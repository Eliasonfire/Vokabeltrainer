/* eiche-zahlplural.mjs — erkennt die Prüfung Zahlwörter, und NUR Zahlwörter?
 * ==========================================================================
 *
 * ⛔⛔ DER FALL: Die neun Zahlwörter 50296–50304 tragen im Feld `pl` nicht den
 * Plural, sondern die andere Genusform (ثَلَاثَةٌ → ثَلَاثٌ). Die App
 * beschriftet das Feld an drei Stellen wörtlich mit „Plural" und baut daraus
 * bei eingeschaltetem Schalter eine Lernkarte „drei (Plural)".
 * `validate.js` warnt seit dem 20.08.2026 davor.
 *
 * ⭐⭐ WARUM DIESE DATEI EXISTIERT: Der erste Entwurf erkannte den Fall an der
 * FORM — „nur die Tāʾ marbūṭa trennt ar und pl". Gemessen: 9 Kandidaten,
 * 8 echt, dazu غُرْفَةٌ → غُرَفٌ falsch getroffen (ein echter gebrochener
 * Plural) und ثَمَانِيَةٌ → ثَمَانٍ übersehen, weil dort auch das ي wegfällt.
 * 8 von 9 in beide Richtungen — als Sperre unbrauchbar.
 * [[kandidatenliste_ist_keine_fehlerliste]] [[entwurf_zu_grob]]
 *
 * Die Prüfung fragt deshalb nach der BEDEUTUNG. Diese Datei hält fest, dass
 * sie das weiter tut — und dass sie beide Richtungen trifft.
 *
 * ⭐ Die Regex wird NICHT nachgebaut, sondern aus validate.js gelesen. Eine
 * kopierte Fassung prüft nach dem ersten Umbau etwas anderes als das, was
 * läuft. [[handliste_neben_echter_quelle]] [[entscheidung_gilt_fuer_das_zweite_werkzeug]]
 *
 * Aufruf:  node werkzeuge/eiche-zahlplural.mjs
 * Exitcode 1 = die Prüfung trifft nicht mehr, was sie treffen soll.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const quelle = fs.readFileSync(path.join(REPO, 'validate.js'), 'utf8');

/* Die Zeile `const ZAHLWORT = /…/i;` aus validate.js holen. */
const m = /const ZAHLWORT\s*=\s*\/(.+?)\/([gimsuy]*)\s*;/.exec(quelle);
if (!m){
  console.log('⛔ In validate.js steht keine Zeile `const ZAHLWORT = /…/;` mehr.');
  console.log('   Entweder wurde die Prüfung entfernt oder umbenannt — beides gehört gesehen.');
  process.exit(1);
}
const ZAHLWORT = new RegExp(m[1], m[2]);
console.log('  Regex aus validate.js gelesen: /' + m[1] + '/' + m[2]);
console.log('');

/* Wortgleich mit validate.js: dort steht
     const istZahlwort = de => String(de||'').split('/').some(t => ZAHLWORT.test(t.trim()));
   ⛔ `split('/')` ist nicht Kosmetik — „ein / eine" steht so im Bestand. */
const istZahlwort = de => String(de || '').split('/').some(t => ZAHLWORT.test(t.trim()));

const FAELLE = [
  /* JA — das sind die neun, alle mit ihrem echten `de` aus vocab-data.js */
  ['eins',        true,  'die 1 trägt als einzige ein gender, gehört trotzdem dazu'],
  ['drei',        true,  ''],
  ['vier',        true,  ''],
  ['fünf',        true,  '⭐ mit Umlaut — eine ASCII-Fassung („fuenf") allein würde es verfehlen'],
  ['sechs',       true,  ''],
  ['sieben',      true,  ''],
  ['acht',        true,  ''],
  ['neun',        true,  ''],
  ['zehn',        true,  ''],
  ['ein / eine',  true,  '⭐ zwei Lesarten in einem Feld — ohne split(\'/\') fiele es durch'],

  /* NEIN — und diese sechs sind der eigentliche Nachweis. Ohne sie wäre nicht
     gezeigt, dass die Prüfung überhaupt schlecht ausfallen kann.
     [[pruefwerkzeug_mit_eingebauter_antwort]] [[stoertest_muss_wirkung_nachweisen]] */
  ['Zimmer',      false, '⛔ غُرْفَةٌ → غُرَفٌ, der Fehlalarm des Formvergleichs'],
  ['Ein Zehntel', false, '⛔ عُشْرٌ — ein Bruch, kein Grundzahlwort, und hat einen echten Plural'],
  ['Buch',        false, ''],
  ['einfach',     false, '⛔ fängt mit „ein" an — die Regex ist verankert, sonst träfe sie hier'],
  ['keiner',      false, ''],
  ['neunzehn',    false, '⛔ zusammengesetzt — 11–19 folgen einer anderen Regel als 3–10'],
  ['',            false, 'leeres Feld'],
];

let fehler = 0;
for (const [de, soll, warum] of FAELLE){
  const ist = istZahlwort(de);
  const ok = ist === soll;
  if (!ok) fehler++;
  console.log((ok ? '  ok   ' : '  ⛔   ') + JSON.stringify(de).padEnd(16)
    + (ist ? 'Zahlwort ' : 'nein     ') + ' soll ' + (soll ? 'Zahlwort' : 'nein    ') + '   ' + warum);
}

/* ⭐ Und die Gegenprobe am echten Bestand: die Prüfung muss GENAU neun finden.
   Eine Regex, die alles trifft, bestünde die Fälle oben ebenso.
   [[milder_bezugspunkt_verdeckt_mangel]] */
const vd = fs.readFileSync(path.join(REPO, 'vocab-data.js'), 'utf8');
const VOCAB_DATA = (new Function(vd + ';return typeof VOCAB_DATA !== "undefined" ? VOCAB_DATA : (window && window.VOCAB_DATA) || [];'))
  .call({ window: {} });
const treffer = VOCAB_DATA.filter(w => w && istZahlwort(w.de));
const mitPl   = treffer.filter(w => w.pl);
console.log('');
console.log('  Am echten Bestand: ' + treffer.length + ' von ' + VOCAB_DATA.length
  + ' Wörtern sind Zahlwörter, ' + mitPl.length + ' davon mit pl-Feld.');
if (treffer.length !== 9){
  console.log('  ⛔ Erwartet waren 9 (50296–50304). Weicht die Zahl ab, hat sich entweder der');
  console.log('     Bestand geändert oder die Regex ist zu weit/zu eng geworden — beides');
  console.log('     gehört angesehen, bevor die Warnung in validate.js geglaubt wird.');
  fehler++;
}

console.log('');
if (fehler){
  console.log('⛔ ' + fehler + ' Abweichung(en) — die Zahlwort-Prüfung trifft nicht mehr, was sie soll.');
  process.exit(1);
}
console.log('✔ ' + FAELLE.length + ' von ' + FAELLE.length + ' richtig, und am Bestand genau die neun.');
