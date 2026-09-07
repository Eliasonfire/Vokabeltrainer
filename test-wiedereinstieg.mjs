/* test-wiedereinstieg.mjs — bewacht `pauseInTagen()` und `istWiedereinstieg()`
 * in js/kern.js (Punkt B2, 07.09.2026).
 *
 * ⭐ Der Kern ist die GRENZE, nicht die Rechnung: bei 6 Tagen ist es keine
 * Pause, bei 7 schon. Eine Funktion, die immer „ja" sagt, sähe genauso richtig
 * aus wie eine, die es nie tut — deshalb prüfen die Fälle beide Seiten.
 * [[stoertest_muss_wirkung_nachweisen]]
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const WURZEL = path.dirname(fileURLToPath(import.meta.url));
const quelle = fs.readFileSync(path.join(WURZEL, 'js', 'kern.js'), 'utf8');

let ok = 0, schlecht = 0;
const pruefe = (was, bedingung, gemessen) => {
  if (bedingung) { ok++; console.log('  ✔ ' + was); }
  else { schlecht++; console.log('  ✘ ' + was + '   gemessen: ' + gemessen); }
};

/* Aus dem echten Quelltext schneiden, nicht nachbauen. */
function schneide(text, name){
  const anfang = text.indexOf('function ' + name + '(');
  if (anfang < 0) return null;
  let i = text.indexOf('{', anfang), tiefe = 0;
  for (; i < text.length; i++){
    if (text[i] === '{') tiefe++;
    else if (text[i] === '}'){ tiefe--; if (!tiefe) return text.slice(anfang, i + 1); }
  }
  return null;
}
const teile = ['pauseInTagen', 'istWiedereinstieg'].map(n => schneide(quelle, n));
if (teile.some(t => !t)) { console.log('⛔ pauseInTagen/istWiedereinstieg nicht gefunden'); process.exit(1); }
const mGrenze = quelle.match(/const PAUSE_AB_TAGEN\s*=\s*(\d+)/);
if (!mGrenze) { console.log('⛔ PAUSE_AB_TAGEN nicht gefunden'); process.exit(1); }
const GRENZE = Number(mGrenze[1]);

const c = { Date, Math, Number, isNaN, console, streak: null, heute: '2026-09-07',
  getStreak(){ return c.streak; }, todayStr(){ return c.heute; } };
vm.createContext(c);
vm.runInContext('const PAUSE_AB_TAGEN = ' + GRENZE + ';\n' + teile.join('\n')
  + '\n;globalThis.__p = pauseInTagen; globalThis.__w = istWiedereinstieg;', c);
const pause = c.__p, wieder = c.__w;

console.log('test-wiedereinstieg.mjs — die Pause vor dem Wiedereinstieg\n');
console.log('  (Grenze aus der Quelle gelesen: ' + GRENZE + ' Tage)\n');

/* ---------- 1. Die Rechnung ---------- */
{
  c.streak = { count: 3, last: '2026-09-07' };
  pruefe('heute geübt → 0 Tage', pause() === 0, pause());
  c.streak = { count: 3, last: '2026-09-06' };
  pruefe('gestern geübt → 1 Tag', pause() === 1, pause());
  c.streak = { count: 3, last: '2026-08-24' };
  pruefe('am 24.08. geübt → 14 Tage', pause() === 14, pause());
}

/* ---------- 2. ⭐ Die Grenze, von beiden Seiten ---------- */
{
  const tagVor = (n) => {
    const d = new Date('2026-09-07'); d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  };
  c.streak = { count: 1, last: tagVor(GRENZE - 1) };
  pruefe((GRENZE - 1) + ' Tage Pause → KEIN Wiedereinstieg', wieder() === false, wieder() + ' bei ' + pause());
  c.streak = { count: 1, last: tagVor(GRENZE) };
  pruefe(GRENZE + ' Tage Pause → Wiedereinstieg', wieder() === true, wieder() + ' bei ' + pause());
  c.streak = { count: 1, last: tagVor(GRENZE + 20) };
  pruefe((GRENZE + 20) + ' Tage Pause → Wiedereinstieg', wieder() === true, wieder());
}

/* ---------- 3. ⛔ Die Fälle, in denen es NICHTS sagen darf ---------- */
{
  c.streak = { count: 0, last: null };
  pruefe('noch nie geübt → null, und KEIN Wiedereinstieg',
    pause() === null && wieder() === false, pause() + ' / ' + wieder());
  c.streak = null;
  pruefe('gar kein Streak-Eintrag → null, kein Absturz',
    pause() === null && wieder() === false, pause() + ' / ' + wieder());
  c.streak = { count: 5, last: 'kaputt' };
  pruefe('unlesbares Datum → null statt NaN',
    pause() === null && wieder() === false, pause() + ' / ' + wieder());
  /* Eine Uhr, die zurückgestellt wurde, darf keine negative Pause ergeben. */
  c.streak = { count: 5, last: '2026-09-20' };
  pruefe('Datum in der Zukunft → 0, nicht negativ', pause() === 0, pause());
}

/* ---------- 4. Der Störfall: getStreak wirft ---------- */
{
  c.getStreak = () => { throw new Error('localStorage gesperrt'); };
  let warf = false, r;
  try { r = pause(); } catch (e) { warf = true; }
  pruefe('getStreak() wirft → null statt Absturz', !warf && r === null, warf ? 'hat geworfen' : r);
  c.getStreak = () => c.streak;
}

console.log('\n' + (schlecht ? '✘ ' + schlecht + ' von ' + (ok + schlecht) + ' Fällen falsch'
                              : '✅ alle ' + ok + ' Fälle richtig'));
process.exitCode = schlecht ? 1 : 0;
