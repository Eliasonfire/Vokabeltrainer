/* test-laut.mjs — bewacht `waehleLautKarten()` in js/lernen.js.
 *
 * ⭐⭐ DER KERN DIESES TESTS IST NICHT „es markiert etwas", SONDERN
 * „es markiert BEIM ZWEITEN MAL ANDERE".
 *
 * Elias am 07.09.2026: „am besten aber sind das immer wieder andere wörter und
 * nicht immer die selben die man laut und leise sagen soll."
 *
 * Der Produktionseffekt (MacLeod u. a., JEP:LMC) ist ein ITEM-Effekt: es
 * profitieren die Wörter, die laut gelesen wurden. Bliebe die Markierung fest,
 * profitierten immer dieselben und die anderen nie — die Funktion sähe
 * trotzdem völlig richtig aus, und kein Test hätte es gemeldet. Genau deshalb
 * prüfen die Fälle 3 bis 5 das WANDERN, nicht das Markieren.
 * [[was_geuebt_werden_soll]] [[stoertest_muss_wirkung_nachweisen]]
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const WURZEL = path.dirname(fileURLToPath(import.meta.url));

let ok = 0, schlecht = 0;
const pruefe = (was, bedingung, gemessen) => {
  if (bedingung) { ok++; console.log('  ✔ ' + was); }
  else { schlecht++; console.log('  ✘ ' + was + '   gemessen: ' + gemessen); }
};

/* ---------- Die echte Funktion aus der App holen ---------- */
/* ⛔ NICHT nachbauen. Ein nachgebautes Auswahlverfahren würde genau das
   prüfen, was ich mir dabei gedacht habe — und nicht das, was die App tut.
   [[testvorlage_selbst_nachgebaut]] */
const quelle = fs.readFileSync(path.join(WURZEL, 'js', 'lernen.js'), 'utf8');

/* ⚠️ Die Datei lässt sich nicht als Ganzes laden: sie ruft auf oberster Ebene
   `document` auf (Zeile 405, `karteRueckseite()`). Ein DOM-Stub dafür wäre
   eine zweite Baustelle — und ein großzügiger Proxy-Stub würde Fehler
   verschlucken, statt sie zu zeigen.

   Deshalb wird GENAU DIESE FUNKTION aus dem echten Quelltext geschnitten, mit
   ihrer Klammerbilanz, nicht mit einem Muster über die schließende Zeile: eine
   Regex bis `\n}` träfe die erste innere Klammer.
   ⛔ Nachgebaut wird nichts — was hier läuft, ist Zeichen für Zeichen der
   Quelltext der App. [[testvorlage_selbst_nachgebaut]] */
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
const code = schneide(quelle, 'waehleLautKarten');
if (!code) { console.log('⛔ waehleLautKarten() steht nicht mehr in js/lernen.js'); process.exit(1); }

const c = {
  LAUT_STAND: {}, LAUT_RUNDE: 0,
  saveLautStand(){ c.gespeichert = (c.gespeichert || 0) + 1; },
  console, Math, Number, Set, Object, Array, String, JSON,
};
vm.createContext(c);
vm.runInContext(code + '\n;globalThis.__waehle = waehleLautKarten;', c);
const waehle = c.__waehle;

if (typeof waehle !== 'function') {
  console.log('⛔ waehleLautKarten() nicht gefunden — hat sich der Name geändert?');
  process.exitCode = 1;
} else {

const runde = (n, ab = 0) => Array.from({ length: n }, (_, i) => ({ id: 'w' + (i + ab) }));

/* ---------- 1. Etwa die Hälfte ---------- */
{
  c.LAUT_STAND = {}; c.LAUT_RUNDE = 0;
  const w = runde(20);
  const s = waehle(w);
  pruefe('20 Karten → 10 markiert', s.size === 10, s.size);
}

/* ---------- 2. Kurze Runden bekommen trotzdem eine ---------- */
{
  c.LAUT_STAND = {}; c.LAUT_RUNDE = 0;
  pruefe('1 Karte → 1 markiert', waehle(runde(1)).size === 1, waehle(runde(1)).size);
  c.LAUT_STAND = {}; c.LAUT_RUNDE = 0;
  pruefe('3 Karten → 2 markiert', waehle(runde(3)).size === 2, waehle(runde(3)).size);
  c.LAUT_STAND = {}; c.LAUT_RUNDE = 0;
  pruefe('leere Runde → nichts, ohne zu werfen', waehle([]).size === 0, '—');
}

/* ---------- 3. ⭐⭐ Die Markierung WANDERT ---------- */
{
  c.LAUT_STAND = {}; c.LAUT_RUNDE = 0;
  const w = runde(10);
  const a = waehle(w);
  const b = waehle(w);
  const gleich = [...a].filter(i => b.has(i)).length;
  pruefe('zweite Runde markiert ANDERE Karten (kein einziger Übertrag)',
    gleich === 0, gleich + ' von ' + a.size + ' gleich');
  const dritte = waehle(w);
  pruefe('dritte Runde ist wieder die erste Hälfte — es kreist, statt zu versanden',
    [...dritte].every(i => a.has(i)) && dritte.size === a.size,
    JSON.stringify([...dritte]) + ' gegen ' + JSON.stringify([...a]));
}

/* ---------- 4. ⭐ Jedes Wort kommt dran ---------- */
{
  c.LAUT_STAND = {}; c.LAUT_RUNDE = 0;
  const w = runde(9);
  const gesehen = new Set();
  for (let r = 0; r < 2; r++) for (const i of waehle(w)) gesehen.add(i);
  pruefe('nach zwei Runden war jede der 9 Karten mindestens einmal dran',
    gesehen.size === 9, gesehen.size + ' von 9');
}

/* ---------- 5. ⭐ Neue Wörter kommen ZUERST ---------- */
{
  /* Ein Wort, das nie dran war, muss vor einem stehen, das gerade dran war —
     sonst könnte ein neu freigeschaltetes Wort dauerhaft übersprungen werden. */
  c.LAUT_STAND = { alt1: 5, alt2: 5, alt3: 5 }; c.LAUT_RUNDE = 5;
  const w = [{ id: 'alt1' }, { id: 'alt2' }, { id: 'neu' }, { id: 'alt3' }];
  const s = waehle(w);
  pruefe('das nie markierte Wort ist dabei', s.has(2), JSON.stringify([...s]));
}

/* ---------- 6. Der Stand wird geschrieben, nicht nur gedacht ---------- */
{
  c.LAUT_STAND = {}; c.LAUT_RUNDE = 0; c.gespeichert = 0;
  waehle(runde(4));
  pruefe('saveLautStand() wird beim Rundenaufbau gerufen', c.gespeichert === 1, c.gespeichert);
  pruefe('und der Stand trägt die neue Rundennummer',
    Object.values(c.LAUT_STAND).every(v => v === 1) && Object.keys(c.LAUT_STAND).length === 2,
    JSON.stringify(c.LAUT_STAND));
}

/* ---------- 7. ⛔ Kein Speicher: der Rückfall trägt ---------- */
{
  /* Privates Fenster, gelöschte Daten: LAUT_STAND ist dann kein Objekt.
     Die Runde muss trotzdem laufen — lieber keine Markierung als ein Absturz
     mitten im Lernen. [[localstorage_kann_werfen]] */
  c.LAUT_STAND = null; c.LAUT_RUNDE = 0;
  let warf = false, s;
  try { s = waehle(runde(6)); } catch (e) { warf = true; }
  pruefe('ohne Speicher: keine Ausnahme, leere Auswahl', !warf && s && s.size === 0,
    warf ? 'hat geworfen' : (s ? s.size : '—'));
}

console.log('\n' + (schlecht ? '✘ ' + schlecht + ' von ' + (ok + schlecht) + ' Fällen falsch'
                              : '✅ alle ' + ok + ' Fälle richtig'));
process.exitCode = schlecht ? 1 : 0;
}
