/* test-lernstand-zuwachs.mjs — waechst Elias' Lernstand um das RICHTIGE Mass?
 *
 *   node test-lernstand-zuwachs.mjs
 *
 * WORUM ES GEHT
 * -------------
 * `werkzeuge/vorrat.mjs` zieht den Freischaltstand nach und schreibt dabei
 * `angabe` in `data/lernstand.json` automatisch fort. Die Grenze dafuer ist
 * Elias' eigene Zahl: „1-3 kapitel sind realistisch."
 *
 * ⛔ DER FEHLER, DEN DIESER TEST FESTHAELT: gemessen wurde der Zuwachs am
 * FREISCHALTSTAND (`jetzt - vorher`), veraendert wird aber die ANGABE. Beide
 * koennen weit auseinanderliegen — madina-2 steht mit [1..24] frei, waehrend
 * Elias dort nach eigener Aussage nicht arbeitet. Sagt er einmal „ich bin bei
 * madina-2 kapitel 3" und arabicroots legt danach EIN Kapitel nach, dann ist
 * der Zuwachs 1 („im Rahmen") — und die Angabe springt von 3 auf 25.
 * Die Meldung dazu lautete `Angabe 3 → 25 (+1, im Rahmen)`: eine Begruendung,
 * die den Fall schliesst, obwohl sein Fenster um 22 Kapitel aufgeht.
 * [[erfundene_begruendung_schliesst_den_fall]] [[kennzeichen_mit_zwei_ursachen]]
 *
 * ⭐ Der Test liest den Block AUS DER ECHTEN QUELLE, statt die Logik
 * nachzubauen. Eine Handliste neben der echten Quelle prueft sich sonst
 * selbst. [[handliste_neben_echter_quelle]]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const QUELLE = path.join(HIER, 'werkzeuge', 'vorrat.mjs');
const roh = fs.readFileSync(QUELLE, 'utf8');

/* ---- Den Entscheidungsblock aus vorrat.mjs holen -------------------------
   Anker ist die forEach-Zeile; Ende die erste Zeile, die nur aus „  });"
   besteht. ⛔ Erst zaehlen, wie oft der Anker vorkommt — bei 0 oder 2 waere
   jede Aussage darunter wertlos. */
const ANKER = 'Object.keys(neu).forEach(b => {';
const treffer = roh.split(ANKER).length - 1;
if (treffer !== 1){
  console.error(`⛔ Anker ${treffer}x gefunden, erwartet 1x — vorrat.mjs hat sich geaendert.`);
  console.error('   Diesen Test anpassen, NICHT das Ergebnis glauben.');
  process.exit(3);
}
const abStart = roh.slice(roh.indexOf(ANKER) + ANKER.length);
const ende = abStart.indexOf('\n  });');
if (ende < 0){ console.error('⛔ Blockende nicht gefunden.'); process.exit(3); }
const KOERPER = abStart.slice(0, ende);
console.log(`Block aus vorrat.mjs geholt: ${KOERPER.split('\n').length} Zeilen`);

/* Der Block ist der Rumpf von `forEach(b => { ... })`. Er greift auf
   neu, alt, l, FENSTER, gewachsen, zurueckgestellt zu. */
const bauen = () => new Function('b', 'neu', 'alt', 'l', 'FENSTER', 'gewachsen', 'zurueckgestellt', KOERPER);

function lauf(fall){
  const gewachsen = [], zurueckgestellt = [];
  const l = { angabe: { ...fall.angabe } };
  const fn = bauen();
  Object.keys(fall.neu).forEach(b => fn(b, fall.neu, fall.alt, l, 3, gewachsen, zurueckgestellt));
  return { angabe: l.angabe, gewachsen, zurueckgestellt };
}

const bis = n => Array.from({ length: n }, (_, i) => i + 1);

const FAELLE = [
  {
    name: 'madina-1: ein Kapitel weiter — darf uebernommen werden',
    neu: { 'madina-1': bis(13) }, alt: { 'madina-1': bis(12) },
    angabe: { 'madina-1': 12 },
    pruefe: r => r.angabe['madina-1'] === 13 && r.gewachsen.length === 1
      ? null : 'Angabe haette auf 13 wachsen muessen, ist ' + r.angabe['madina-1']
  },
  {
    name: 'madina-2: Angabe 3, frei bis 24, EIN Kapitel kommt dazu',
    /* ⛔ Der eigentliche Befund. Zuwachs am Freischaltstand = 1 („im Rahmen"),
       Sprung der Angabe = 22. */
    neu: { 'madina-2': bis(25) }, alt: { 'madina-2': bis(24) },
    angabe: { 'madina-2': 3 },
    pruefe: r => r.angabe['madina-2'] === 3 && r.zurueckgestellt.length === 1
      ? null : 'Angabe sprang von 3 auf ' + r.angabe['madina-2']
              + ' — sein Fenster geht um 22 Kapitel auf, die er nie genannt hat'
  },
  {
    name: 'madina-2 ohne Angabe: waechst nie automatisch',
    neu: { 'madina-2': bis(25) }, alt: { 'madina-2': bis(24) },
    angabe: {},
    pruefe: r => r.zurueckgestellt.length === 1 && !('madina-2' in r.angabe)
      ? null : 'ohne Angabe darf nichts uebernommen werden'
  },
  {
    name: 'Zuwachs 4 Kapitel: zu viel fuer einen Lernschritt',
    neu: { 'madina-1': bis(16) }, alt: { 'madina-1': bis(12) },
    angabe: { 'madina-1': 12 },
    pruefe: r => r.angabe['madina-1'] === 12 && r.zurueckgestellt.length === 1
      ? null : 'Angabe haette bei 12 bleiben muessen, ist ' + r.angabe['madina-1']
  },
  {
    name: 'Luecke in der Mitte gefuellt, Hoechstes unveraendert',
    /* Sein Lernstand rueckt nicht vor — die neuen Kapitel meldet vorrat.mjs
       ueber die Aenderungsliste, nicht ueber diesen Block. Hier also: still. */
    neu: { 'madina-1': bis(12) }, alt: { 'madina-1': [1, 2, 3, 12] },
    angabe: { 'madina-1': 3 },
    pruefe: r => r.angabe['madina-1'] === 3
      ? null : 'Angabe sprang auf ' + r.angabe['madina-1'] + ', obwohl er nicht weiter ist'
  },
  {
    name: 'Neues Buch ohne Angabe: gemeldet, nicht uebernommen',
    neu: { 'bayna-yadayk-1': bis(2) }, alt: {},
    angabe: {},
    pruefe: r => r.zurueckgestellt.length === 1 && !r.gewachsen.length
      ? null : 'ein Buch ohne Angabe darf nie automatisch wachsen'
  }
];

let rot = 0;
console.log('');
for (const f of FAELLE){
  let fehler;
  try { fehler = f.pruefe(lauf(f)); }
  catch (e){ fehler = 'Ausnahme: ' + e.message; }
  console.log(`  ${fehler ? '❌' : '✅'} ${f.name}`);
  if (fehler){ console.log(`      ${fehler}`); rot++; }
}

console.log('');
if (rot){
  console.log(`❌ ${rot} von ${FAELLE.length} Faellen falsch.`);
  process.exit(1);
}
console.log(`✅ Alle ${FAELLE.length} Faelle richtig.`);
