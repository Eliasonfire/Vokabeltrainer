/* archiv-seite.mjs -- in einem archive.org-Scan seitengenau suchen
 *
 *   node werkzeuge/archiv-seite.mjs <datei_djvu.xml> "<suchwort>"
 *   node werkzeuge/archiv-seite.mjs <datei_djvu.xml> "<suchwort>" --umfeld 12
 *
 * Gibt je Fundstelle die PDF-Seitenzahl und das Umfeld aus. Schreibt nichts.
 *
 * WARUM ES DAS GIBT (29.07.2026, Nachtschicht)
 * --------------------------------------------
 * Die Lehrwerke von Al-Arabiyyah Bayna Yadayk liegen als 110-131 MB grosse
 * Scans im Internet Archive. Zum Suchen gibt es dort `…_djvu.txt` mit nur
 * 0,2-0,5 MB - aber diese Datei kennt KEINE Seitengrenzen. Man findet also,
 * DASS ein Abschnitt existiert, aber nicht WO. Und ohne Seitenzahl kann man
 * die Seite nicht rendern, und ohne Rendering gibt es keinen zitierfaehigen
 * arabischen Wortlaut (E.1) - die OCR selbst ist dafuer unbrauchbar.
 *
 * Die Loesung liegt in `…_djvu.xml` (2,5-5 MB): dort steht je Seite ein
 * <OBJECT>-Block, darin die einzelnen <WORD coords="...">. Der Index des
 * OBJECT-Blocks IST die Seitenzahl im zugehoerigen PDF.
 *
 * ZWEI SACKGASSEN, die vorher probiert wurden - damit sie niemand wiederholt:
 *
 * 1. `…_hocr_pageindex.json` sieht nach genau der Loesung aus (258 Eintraege
 *    fuer 258 Seiten, mit Byte-Offsets). Die Offsets zeigen aber in die
 *    `hocr.html` (5-8 MB), NICHT in die `_hocr_searchtext.txt`. Wendet man sie
 *    trotzdem auf die Searchtext-Datei an, landen alle 35 Fundstellen auf den
 *    Seiten 2-15 - ein Ergebnis, das plausibel aussieht und komplett falsch
 *    ist. Genau so ist es beim ersten Versuch passiert.
 *
 * 2. `pdftotext` auf die kleine `…_text.pdf`-Fassung liefert fuer Arabisch nur
 *    Ziffern- und Lateinrauschen (92 KB ueber 258 Seiten). Der Textlayer dieser
 *    PDFs ist unbrauchbar; nur das gerenderte BILD taegt.
 *
 * DAZU DER PRAKTISCHE FUND, der das Rendern erst bezahlbar macht:
 * Neben dem 110-131 MB grossen Original liegt meist eine Fassung mit dem
 * Zusatz `_text` von nur 10-13 MB. Sie ist bei `-r 150` vollstaendig lesbar,
 * Harakat inklusive. (Ausnahme im Bayna-Yadayk-Bestand: Band 1 Teil 1 hat
 * keine solche Fassung.)
 *
 * ⚠️ Ein Download von archive.org kann mit HTTP 500 fehlschlagen und trotzdem
 * eine Datei hinterlassen - 170 Byte HTML-Fehlerseite. Nach dem Laden also die
 * GROESSE pruefen, nicht die Existenz. Ein zweiter Versuch klappte sofort.
 *
 * ⚠️ Die Trefferzahl ist eine UNTERGRENZE. Die OCR verschluckt Ueberschriften,
 * besonders farbige und dekorativ gesetzte. In Band 1 wurden 10 von erwarteten
 * 16 Abschnitten gefunden. Zum Auffinden reicht das, zum Zaehlen nicht. */

import fs from 'node:fs';

const args = process.argv.slice(2);
const datei = args[0];
const suchwort = args[1];
const umfeldIdx = args.indexOf('--umfeld');
const UMFELD = umfeldIdx === -1 ? 8 : Math.max(1, Number(args[umfeldIdx + 1]) || 8);

if (!datei || !suchwort || datei.startsWith('--')){
  console.error('Aufruf:  node werkzeuge/archiv-seite.mjs <datei_djvu.xml> "<suchwort>" [--umfeld N]');
  console.error('');
  console.error('Die XML holt man sich vorher, z. B.:');
  console.error('  https://archive.org/metadata/<item-id>          -> Dateinamen');
  console.error('  https://archive.org/download/<item-id>/<name>_djvu.xml');
  process.exit(1);
}

if (!fs.existsSync(datei)){
  console.error(`Datei nicht gefunden: ${datei}`);
  process.exit(1);
}

const groesse = fs.statSync(datei).size;
if (groesse < 50_000){
  /* Genau die Falle von oben: ein fehlgeschlagener Download hinterlaesst eine
     winzige HTML-Fehlerseite, die sich einlesen laesst und nichts findet. */
  console.error(`Die Datei ist nur ${groesse} Byte gross. Eine echte djvu.xml hat Megabyte.`);
  console.error('Vermutlich ist der Download fehlgeschlagen (archive.org antwortet gelegentlich');
  console.error('mit HTTP 500 und legt trotzdem eine Datei an). Noch einmal laden.');
  process.exit(1);
}

const xml = fs.readFileSync(datei, 'utf8');
const bloecke = xml.split('<OBJECT');
const seiten = bloecke.length - 1;

if (seiten < 1){
  console.error('Kein <OBJECT>-Block gefunden - ist das wirklich eine djvu.xml?');
  process.exit(1);
}

const entwandeln = s => s
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&');

/* Mehrwortsuche muss ueber die zusammengefuegte Zeile laufen, NICHT ueber die
   einzelnen <WORD>-Elemente. Die erste Fassung dieses Skripts hat je Wort
   geprueft; eine Suche nach "قواعد اللغة" konnte damit NIE anschlagen und
   meldete stattdessen seelenruhig "0 Seiten mit Treffer". Ein Werkzeug, das
   bei falscher Benutzung nichts findet statt sich zu beschweren, ist
   gefaehrlicher als gar keines - deshalb sucht es jetzt im Fliesstext der
   Seite und rechnet die Wortposition zurueck. */
const treffer = [];
bloecke.forEach((block, seite) => {
  if (seite === 0) return;                 // alles vor dem ersten <OBJECT>
  const woerter = [...block.matchAll(/<WORD[^>]*>([^<]*)<\/WORD>/g)].map(m => entwandeln(m[1]));
  if (!woerter.length) return;

  const zeile = woerter.join(' ');
  const stelle = zeile.indexOf(suchwort);
  if (stelle === -1) return;

  /* Vom Zeichen-Offset zurueck auf den Wortindex: wie viele Leerzeichen liegen
     davor? Das ist der Index, weil join(' ') genau eines je Luecke setzt. */
  const wortIndex = zeile.slice(0, stelle).split(' ').length - 1;
  treffer.push({
    seite,
    umfeld: woerter.slice(Math.max(0, wortIndex - 2), wortIndex + UMFELD).join(' ').replace(/\s+/g, ' ').trim(),
  });
});

console.log(`${datei}`);
console.log(`  ${seiten} Seiten, Suche nach "${suchwort}": ${treffer.length} Seite(n) mit Treffer`);
console.log('');
for (const t of treffer)
  console.log(`  PDF-Seite ${String(t.seite).padStart(4)}   ${t.umfeld.slice(0, 90)}`);

if (!treffer.length){
  console.log('  Nichts gefunden. Vor dem Schluss "gibt es nicht" bitte bedenken:');
  console.log('  - Die OCR verschluckt Ueberschriften, vor allem farbige.');
  console.log('  - Dasselbe kann anders heissen. Bayna Yadayk nennt seinen');
  console.log('    Grammatikteil je nach Band تراكيب نحوية, ملاحظة نحوية ODER قواعد اللغة.');
}

console.log('');
console.log('  Seite ansehen:  pdftoppm -png -r 150 -f <seite> -l <seite> <datei_text.pdf> aus');
