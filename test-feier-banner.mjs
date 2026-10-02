/* test-feier-banner.mjs — zwei Banner zur selben Zeit liegen nicht aufeinander
 *
 *   node test-feier-banner.mjs
 *
 * ⛔ DER SATZ, DEN DIESER TEST BEWACHT — Elias am 02.10.2026, nach einer Karte,
 * die aus Box 5 in Box 4 gefallen war und wieder in Box 5 kam:
 *
 *   „dabei haben sich zwei benachrichtigungen überlappt einmal müsste es
 *    ‚sitzt' und ‚zurück' oder sowas sein. das soll jedenfalls nicht so sein.
 *    fix das"
 *
 * Jedes Banner sitzt per CSS auf derselben Stelle (top:38%). Feuern zwei
 * Anlässe in derselben Antwort ('box-5' + 'wort-zurueck', 'runde-fertig' +
 * 'alles-faellig', ein Tagesziel + 'tag-komplett'), lagen sie aufeinander.
 *
 * ⛔ feierBanner(), feierBuehne() und feierBannerPlatz() werden aus js/feier.js
 * GESCHNITTEN, nicht nachgebaut. [[testvorlage_selbst_nachgebaut]] Der DOM-Stub
 * rechnet nur an der einen Stelle wie der Browser, auf die es ankommt:
 * `offsetTop` ist `style.top`, wenn gesetzt, sonst die CSS-Voreinstellung
 * (38 % der Bühne). Dass die CSS-Regel wirklich so lautet, prüft der Test an
 * index.html mit — feierBannerPlatz() rechnet mit ihr.
 *
 * Störtests am echten Quelltext — jeder MUSS rot werden:
 *   1. feierBanner() ruft feierBannerPlatz() nicht mehr auf
 *   2. feierBannerPlatz() rückt nie
 *   3. die CSS-Regel .feier-banner sitzt nicht mehr auf top:38%
 *
 * Exit 0 = hält · 1 = Befund oder wirkungsloser Störtest
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const REPO = path.dirname(fileURLToPath(import.meta.url));
const lies = f => fs.readFileSync(path.join(REPO, f), 'utf8');

function schneide(quelle, name){
  const start = quelle.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('js/feier.js: ' + name + '() nicht gefunden');
  let tiefe = 0, i = quelle.indexOf('{', start);
  for (; i < quelle.length; i++){
    if (quelle[i] === '{') tiefe++;
    else if (quelle[i] === '}'){ tiefe--; if (!tiefe) break; }
  }
  if (tiefe) throw new Error('js/feier.js: Klammern von ' + name + '() gehen nicht auf');
  return quelle.slice(start, i + 1);
}

/* Höhen wie im Browser grob gemessen: mittel mit Unterzeile, groß mit Unterzeile. */
const HOEHEN = { klein: 40, mittel: 64, gross: 76 };
const BUEHNE_HOCH = 800;
const STANDARD_MITTE = Math.round(BUEHNE_HOCH * 0.38);

function neueWelt(quelle){
  const konst = (quelle.match(/^const FEIER_BANNER_ABSTAND = [^\n]*$/m) || [])[0];
  if (!konst) throw new Error('FEIER_BANNER_ABSTAND steht nicht mehr in js/feier.js');
  const uhren = [];
  const mache = () => ({
    id: '', className: '', innerHTML: '', style: {}, eltern: null, kinder: [],
    get offsetHeight(){ const m = /feier-(klein|mittel|gross)/.exec(this.className); return m ? HOEHEN[m[1]] : 0; },
    get offsetTop(){ return this.style.top ? parseFloat(this.style.top) : STANDARD_MITTE; },
    appendChild(k){ k.eltern = this; this.kinder.push(k); return k; },
    remove(){ if (this.eltern){ this.eltern.kinder = this.eltern.kinder.filter(x => x !== this); this.eltern = null; } },
    querySelectorAll(){ return this.kinder.filter(k => (' ' + k.className + ' ').includes(' feier-banner ')); }
  });
  const body = mache();
  const w = {
    document: {
      body,
      createElement: () => mache(),
      getElementById: id => body.kinder.find(k => k.id === id) || null
    },
    escapeHtml: s => String(s),
    setTimeout: (fn, ms) => { uhren.push({ fn, ms }); return uhren.length; }
  };
  vm.createContext(w);
  vm.runInContext(konst + '\n' + ['feierBuehne', 'feierBanner', 'feierBannerPlatz'].map(n => schneide(quelle, n)).join('\n'), w);
  const banner = () => (body.kinder[0] ? body.kinder[0].querySelectorAll() : []);
  const spanne = b => [b.offsetTop - b.offsetHeight / 2, b.offsetTop + b.offsetHeight / 2];
  return { w, uhren, banner, spanne, abstand: vm.runInContext('FEIER_BANNER_ABSTAND', w) };
}

function befunde(quelle, html){
  const f = [];
  /* Die Rechnung hängt an dieser CSS-Regel: offsetTop ist nur dann die MITTE. */
  const css = html.replace(/\/\*[\s\S]*?\*\//g, '');
  if (!/\.feier-banner\{[^}]*top:38%;[^}]*transform:translate\(-50%,-50%\)/.test(css))
    f.push('index.html: .feier-banner sitzt nicht mehr auf top:38% mit translate(-50%,-50%) — feierBannerPlatz() rechnet damit');

  let welt;
  try { welt = neueWelt(quelle); } catch (e){ return f.concat([e.message]); }
  const { w, uhren, banner, spanne, abstand } = welt;
  const frei = (a, b) => { const [ao, au] = spanne(a), [bo, bu] = spanne(b); return au + abstand <= bo || bu + abstand <= ao; };

  /* 1. Ein Banner allein sitzt, wo es immer saß. */
  w.feierBanner('Sitzt!', 'Wort ist in Box 5.', 'mittel');
  if (banner().length !== 1) return f.concat(['feierBanner() legt kein Banner auf die Bühne']);
  if (banner()[0].style.top) f.push('ein Banner ALLEIN wurde verschoben (top = ' + banner()[0].style.top + ') — es soll sitzen wie bisher');

  /* 2. Sein Fall: 'box-5' und 'wort-zurueck' in derselben Antwort. */
  w.feierBanner('Zurückerobert', 'Wort ist wieder in Box 5.', 'mittel');
  const [a, b] = banner();
  if (!b) return f.concat(['das zweite Banner fehlt']);
  if (a.style.top) f.push('das ERSTE Banner springt, wenn das zweite kommt');
  if (!frei(a, b)) f.push('„Sitzt!" und „Zurückerobert" liegen aufeinander: ' + spanne(a).join('–') + ' und ' + spanne(b).join('–') + ' px');

  /* 3. Ein drittes, großes dazu (Meilenstein in derselben Antwort). */
  w.feierBanner('25 Wörter sitzen', 'Alle ab Box 5.', 'gross');
  const c = banner()[2];
  if (!c || !frei(a, c) || !frei(b, c)) f.push('das dritte Banner liegt auf einem der ersten beiden');

  /* 4. Jedes bleibt so lange wie bisher und räumt sich selbst weg. */
  const dauer = uhren.map(u => u.ms).join(',');
  if (dauer !== '1700,1700,2600') f.push('die Dauer hat sich geändert: ' + dauer + ' statt 1700,1700,2600');
  uhren.forEach(u => u.fn());
  if (banner().length) f.push('nach Ablauf liegen noch ' + banner().length + ' Banner auf der Bühne');
  w.feierBanner('Runde geschafft', '20 Karten durch.', 'mittel');
  if (banner()[0] && banner()[0].style.top) f.push('nach dem Abräumen sitzt ein neues Banner nicht wieder an der alten Stelle');

  /* 5. Das obere ist schon weg, das untere steht noch: ein neues, größeres darf
        nicht auf das untere fallen. */
  const z = neueWelt(quelle);
  z.w.feierBanner('A', 'a', 'mittel');
  z.w.feierBanner('B', 'b', 'mittel');
  z.uhren[0].fn();                                  // A läuft ab, B bleibt
  z.w.feierBanner('C', 'c', 'gross');
  const [rest, neu] = z.banner();
  if (!neu) f.push('Fall 5: das neue Banner fehlt');
  else {
    const [ro, ru] = z.spanne(rest), [no, nu] = z.spanne(neu);
    if (!(ru + z.abstand <= no || nu + z.abstand <= ro)) f.push('ein neues Banner fällt auf eines, das noch steht (' + ro + '–' + ru + ' und ' + no + '–' + nu + ' px)');
  }
  return f;
}

const quelle = lies('js/feier.js');
const html = lies('index.html');
let rot = 0;

const echt = befunde(quelle, html);
if (echt.length){ rot++; echt.forEach(t => console.log('  ❌ ' + t)); }
else console.log('  ✅ zwei und drei Banner zur selben Zeit liegen untereinander, eines allein sitzt wie bisher');

const STOERTESTS = [
  ['feierBanner() ruft feierBannerPlatz() nicht mehr auf',
    () => [quelle.replace('  feierBannerPlatz(b, buehne);\n', ''), html]],
  ['feierBannerPlatz() rückt nie',
    () => [quelle.replace('if (belegt) neu.style.top', 'if (false) neu.style.top'), html]],
  ['die CSS-Regel .feier-banner sitzt nicht mehr auf top:38%',
    () => [quelle, html.replace('position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);', 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);')]]
];
for (const [name, mach] of STOERTESTS){
  const [q, h] = mach();
  if (q === quelle && h === html){ rot++; console.log('  ❌ Störtest wirkungslos (nichts ersetzt): ' + name); continue; }
  if (befunde(q, h).length) console.log('  ✅ Störtest wird rot: ' + name);
  else { rot++; console.log('  ❌ Störtest bleibt GRÜN: ' + name); }
}

if (rot){ console.log('\n⛔ ' + rot + ' Befund(e).'); process.exit(1); }
console.log('\n✔ Banner überlappen nicht — und der Test kann rot werden.');
