// pruefe-nach-hinten.mjs — „Nach hinten“ auf der Wortkarte (26.11.2026).
//
// Elias, mit dem Bild der Wortkarte von سِتَارَةٌ: „ich möchte vokabeln frei nach hinten packen so das ich sie
// ertsmal lange nicht sehen muss“, und zur Länge: „Länge selbst wählen“ (Beispiel war 30, 60 oder 90 Tage).
//
// Geprüft wird am echten Code (legeNachHinten aus js/kern.js, im vm ausgeführt):
//   - nextReview = heute + gewählte Tage, für 30, 60 und 90
//   - Box steigt auf die passende (30 → 6, 60/90 → 7), fällt aber nie
//   - Lerngruppe wird verlassen, Zeitstempel gesetzt, gespeichert
//   - andere Längen werden abgelehnt, nichts geändert
//   - die Wortkarte hat die drei Knöpfe und der Klick ruft legeNachHinten
// Mit Störtest: jede verdorbene Fassung muss rot werden.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const HIER = join(dirname(fileURLToPath(import.meta.url)), '..');
const KERN = readFileSync(join(HIER, 'js', 'kern.js'), 'utf8').replace(/\r\n/g, '\n');
const KAT = readFileSync(join(HIER, 'js', 'kategorien.js'), 'utf8').replace(/\r\n/g, '\n');

function schneide(text, kopf){
  const a = text.indexOf(kopf);
  if (a < 0) return '';
  let i = text.indexOf('{', a), tiefe = 0;
  for (; i < text.length; i++){
    if (text[i] === '{') tiefe++;
    else if (text[i] === '}' && --tiefe === 0) return text.slice(a, i + 1);
  }
  return '';
}

function laufe(kern, kat, still){
  let fehler = 0;
  const pruefe = (ok, text, mehr) => {
    if (!ok) fehler++;
    if (!still) console.log((ok ? '  ✔ ' : '  ✘ ') + text + (!ok && mehr !== undefined ? '   gemessen: ' + JSON.stringify(mehr) : ''));
  };
  const tageZeile = (kern.match(/const NACH_HINTEN_TAGE = \[[^\]]*\];/) || [''])[0];
  const fn = schneide(kern, 'function legeNachHinten(');
  pruefe(!!tageZeile && !!fn, 'NACH_HINTEN_TAGE und legeNachHinten() stehen in js/kern.js');
  let lege = null, ctx = null;
  try {
    const HEUTE = new Date(Date.UTC(2026, 10, 26));
    ctx = { PROGRESS: {}, gespeichert: 0,
      INTERVALS: {1:0, 2:1, 3:3, 4:7, 5:16, 6:30, 7:60},
      todayStr: (d = 0) => new Date(HEUTE.getTime() + d * 864e5).toISOString().slice(0, 10),
      saveProgress(){ ctx.gespeichert++; } };
    vm.createContext(ctx);
    vm.runInContext(tageZeile + '\n' + fn + '\nthis.lege = legeNachHinten; this.TAGE = NACH_HINTEN_TAGE;', ctx);
    lege = ctx.lege;
  } catch (e) { lege = null; }
  pruefe(typeof lege === 'function', 'legeNachHinten() lässt sich ausführen');
  if (lege){
    pruefe(JSON.stringify([...ctx.TAGE]) === '[30,60,90]', 'zur Wahl stehen 30, 60 und 90 Tage', [...ctx.TAGE]);
    const fall = (box, tage, extra = {}) => {
      ctx.PROGRESS.x = { box, nextReview: '2026-11-26', correct: 1, wrong: 0, ...extra };
      const vorher = ctx.gespeichert;
      const ok = lege('x', tage);
      return { ok, p: ctx.PROGRESS.x, gespeichert: ctx.gespeichert > vorher };
    };
    const a = fall(3, 30);
    pruefe(a.ok && a.p.nextReview === '2026-12-26' && a.p.box === 6, '30 Tage: wieder am 26.12., Box 3 → 6', a.p);
    const b = fall(3, 60);
    pruefe(b.ok && b.p.nextReview === '2027-01-25' && b.p.box === 7, '60 Tage: wieder am 25.01., Box 7', b.p);
    const c = fall(1, 90, { gruppe: '2026-11-20', gruppeArt: 'neu', zurueck: '2026-11-21' });
    pruefe(c.ok && c.p.nextReview === '2027-02-24' && c.p.box === 7, '90 Tage: wieder am 24.02., Box 7', c.p);
    pruefe(!('gruppe' in c.p) && !('gruppeArt' in c.p) && !('zurueck' in c.p), 'das Wort verlässt die Lerngruppe', c.p);
    pruefe(c.gespeichert && typeof c.p.ts === 'number', 'gespeichert und mit Zeitstempel für den Abgleich');
    const d = fall(7, 30);
    pruefe(d.ok && d.p.box === 7 && d.p.nextReview === '2026-12-26', 'die Box fällt nie (Box 7 bleibt bei 30 Tagen)', d.p);
    const e = fall(3, 45);
    pruefe(!e.ok && e.p.box === 3 && e.p.nextReview === '2026-11-26' && !e.gespeichert, 'eine andere Länge ändert nichts', e.p);
    delete ctx.PROGRESS.neu;
    const f = lege('neu', 60);
    pruefe(f && ctx.PROGRESS.neu && ctx.PROGRESS.neu.box === 7, 'ein Wort ohne Lernstand bekommt einen', ctx.PROGRESS.neu);
  }
  pruefe(/data-wkhinten="\$\{n\}"/.test(kat) && /NACH_HINTEN_TAGE\.map/.test(kat), 'die Wortkarte zeigt je Länge einen Knopf');
  pruefe(/closest\('\[data-wkhinten\]'\)[\s\S]{0,300}legeNachHinten\(WK_WORT\.id/.test(kat), 'der Klick ruft legeNachHinten() für das Wort der Karte');
  return fehler;
}

console.log('pruefe-nach-hinten.mjs — „Nach hinten“ auf der Wortkarte\n');
const fehler = laufe(KERN, KAT, false);
console.log('\nStörtest:');
const stoerungen = [
  ['Box fällt (min statt max)', KERN.replace('p.box = Math.max(Number(p.box) || 1,', 'p.box = Math.min(Number(p.box) || 1,'), KAT],
  ['Tage nicht übernommen', KERN.replace('p.nextReview = todayStr(n);', 'p.nextReview = todayStr(INTERVALS[p.box]);'), KAT],
  ['bleibt in der Lerngruppe', KERN.replace('delete p.gruppe; delete p.gruppeArt; delete p.zurueck;', ''), KAT],
  ['kein Zeitstempel', KERN.replace('  p.ts = Date.now();\n  saveProgress();\n  return true;\n}\n\nfunction addPersonalVocab', '  saveProgress();\n  return true;\n}\n\nfunction addPersonalVocab'), KAT],
  ['jede Länge erlaubt', KERN.replace('if (!NACH_HINTEN_TAGE.includes(n)) return false;', ''), KAT],
  ['Knöpfe fehlen', KERN, KAT.replace('data-wkhinten="${n}"', 'data-wk-weg="${n}"')],
  ['Klick ohne Wirkung', KERN, KAT.replace('if (legeNachHinten(WK_WORT.id, tage)){', 'if (false){')]
];
let alleRot = true;
for (const [name, k, c] of stoerungen){
  if (k === KERN && c === KAT){ alleRot = false; console.log('  ✘ ' + name + ' — Störung griff nicht'); continue; }
  const r = laufe(k, c, true);
  if (r > 0) console.log('  ✔ ' + name + ' → ' + r + ' rot');
  else { alleRot = false; console.log('  ✘ ' + name + ' → blieb grün'); }
}
console.log('');
console.log(!fehler && alleRot ? '✔ Nach hinten stimmt, jede Störung erkannt (' + stoerungen.length + ')'
  : '✘ ' + fehler + ' gescheitert' + (alleRot ? '' : ', mindestens eine Störung unbemerkt'));
process.exit(!fehler && alleRot ? 0 : 1);
