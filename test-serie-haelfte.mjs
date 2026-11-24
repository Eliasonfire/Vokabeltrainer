/* test-serie-haelfte.mjs — ein Tag zählt für die Serie (Flamme) erst ab der Hälfte von „Karten pro Tag“.
   Elias, 24.11.2026, wörtlich: „lasse bei den flammen erst der tag als ,,gelernt" markiert werden bei den flammen
   wenn die hälfte durch geklickt ist an karten die man täglich lernen möchte. mach das für alle drei apps also
   vokabeltrainer und talib“.

   Die Funktionen werden aus js/kern.js GESCHNITTEN und ausgeführt (touchStreak, serieSchwelle, getUebungstage,
   tagZaehlen, zeigeSerie). Gespielt wird eine Lernrunde: Karte für Karte erst tagZaehlen(), dann touchStreak(),
   in genau der Reihenfolge, die js/lernen.js hat. Am Ende ein Störtest. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const KERN = fs.readFileSync(path.join(HIER, 'js', 'kern.js'), 'utf8');
const LERNEN = fs.readFileSync(path.join(HIER, 'js', 'lernen.js'), 'utf8');

const schneide = (text, name) => {
  const a = text.indexOf('function ' + name + '(');
  if (a < 0) return null;
  let i = text.indexOf('{', a), t = 0;
  for (; i < text.length; i++){ if (text[i] === '{') t++; else if (text[i] === '}'){ t--; if (!t) return text.slice(a, i + 1); } }
  return null;
};

/* Eine Welt mit festem Datum und einem Tagesziel; liefert eine Funktion „lerne n Karten am Tag d“. */
function welt(kern, deckel){
  const teile = ['touchStreak', 'serieSchwelle', 'getUebungstage', 'tagZaehlen', 'zeigeSerie'].map(n => [n, schneide(kern, n)]);
  const fehlt = teile.filter(([, q]) => !q).map(([n]) => n);
  if (fehlt.length) return { fehlt };
  const speicher = {};
  const c = {
    heute: '2026-11-24',
    LS: { get: (k, d) => k in speicher ? JSON.parse(speicher[k]) : d, set: (k, v) => { speicher[k] = JSON.stringify(v); } },
    toast: () => {}, REDUCED_MOTION: true,
    document: { getElementById: () => null }
  };
  vm.createContext(c);
  vm.runInContext(`
    function todayStr(v){ const d = new Date(heute + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + (v || 0)); return d.toISOString().slice(0, 10); }
    function tagesDeckel(){ return ${Number(deckel)}; }
    ${teile.map(([, q]) => q).join('\n')}
    globalThis.__ = { touchStreak, tagZaehlen, serieSchwelle, serie: () => LS.get('vt_streak', {count:0}) };`, c);
  const api = c.__;
  return {
    schwelle: api.serieSchwelle(),
    tag(datum, karten){
      c.heute = datum;
      const stand = [];
      for (let i = 0; i < karten; i++){ api.tagZaehlen(); api.touchStreak(); stand.push(api.serie().count); }
      return stand;
    },
    serie: () => api.serie()
  };
}

function laufe(kern, lernen, still){
  let schlecht = 0;
  const pruefe = (was, ok, gemessen) => { if (!ok) schlecht++; if (!still) console.log((ok ? '  ✔ ' : '  ✘ ') + was + (ok ? '' : '   gemessen: ' + gemessen)); };

  const w = welt(kern, 10);
  if (w.fehlt){ pruefe('Funktionen in js/kern.js gefunden', false, w.fehlt.join(', ')); return schlecht; }
  pruefe('bei 10 Karten pro Tag ist die Hälfte 5', w.schwelle === 5, w.schwelle);
  const t1 = w.tag('2026-11-20', 6);
  pruefe('erster Tag: Karte 1–4 zünden die Flamme nicht, Karte 5 schon', t1.join(',') === '0,0,0,0,1,1', t1.join(','));
  const t2 = w.tag('2026-11-21', 4);
  pruefe('nächster Tag mit nur 4 Karten: die Serie wächst nicht', t2.every(n => n === 1), t2.join(','));
  const t3 = w.tag('2026-11-22', 5);
  pruefe('Tag darauf 5 Karten: der Tag unter der Hälfte gilt wie ausgelassen, die Serie bleibt stehen und wächst um diesen Tag',
    t3[3] === 1 && t3[4] === 2 && w.serie().gnadeAm === '2026-11-22', t3.join(',') + ' gnadeAm ' + w.serie().gnadeAm);
  const t4 = w.tag('2026-11-23', 12);
  pruefe('mehr als das Ziel: der Tag zählt einmal', t4[11] === 3 && t4.filter(n => n === 3).length === 8, t4.join(','));

  const ungerade = welt(kern, 15);
  pruefe('bei 15 Karten pro Tag wird aufgerundet: 8', ungerade.schwelle === 8, ungerade.schwelle);
  const ohne = welt(kern, 0);
  const t5 = ohne.tag('2026-11-20', 1);
  pruefe('ohne Tagesziel zählt der Tag wie bisher mit der ersten Karte', ohne.schwelle === 0 && t5[0] === 1, ohne.schwelle + ' / ' + t5.join(','));

  /* Reihenfolge in js/lernen.js: erst zählen, dann die Serie */
  const a = lernen.indexOf('tagZaehlen();'), b = lernen.indexOf('touchStreak();');
  pruefe('js/lernen.js zählt die Karte, BEVOR touchStreak() fragt', a > 0 && b > a, 'tagZaehlen bei ' + a + ', touchStreak bei ' + b);
  pruefe('sein Satz steht im Quelltext', kern.includes('wenn die hälfte durch geklickt ist an karten die man täglich'), 'fehlt');
  return schlecht;
}

console.log('test-serie-haelfte.mjs — Tag zählt ab dem halben Tagesziel\n');
const schlecht = laufe(KERN, LERNEN, false);
console.log('\nStörtest:');
let alleRot = true;
for (const [name, k, l] of [
  ['Schwelle weg (eine Karte genügt)', KERN.replace('if (heuteZahl < schwelle) return s;', ''), LERNEN],
  ['abgerundet statt aufgerundet', KERN.replace('Math.ceil(d / 2)', 'Math.floor(d / 2)'), LERNEN],
  ['ganzes Ziel statt Hälfte', KERN.replace('Math.ceil(d / 2)', 'd'), LERNEN],
  ['alte Reihenfolge in lernen.js', KERN, LERNEN.replace("  if (typeof tagZaehlen === 'function') tagZaehlen();\n  touchStreak();", "  touchStreak();\n  if (typeof tagZaehlen === 'function') tagZaehlen();")]
]){
  if (k === KERN && l === LERNEN){ alleRot = false; console.log('  ✘ ' + name + ' — Störung griff nicht'); continue; }
  const n = laufe(k, l, true);
  if (n > 0) console.log('  ✔ ' + name + ' → ' + n + ' rot'); else { alleRot = false; console.log('  ✘ ' + name + ' → blieb grün'); }
}
console.log('');
console.log(!schlecht && alleRot ? '✔ alle Fälle richtig, jede Störung erkannt' : '✘ ' + schlecht + ' Fehler' + (alleRot ? '' : ', mindestens eine Störung unbemerkt'));
process.exit(!schlecht && alleRot ? 0 : 1);
