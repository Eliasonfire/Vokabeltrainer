/* schluessel-lektionen.mjs -- den Grammatikteil je Lektion aus einem der
 * deutschen Madina-Schluessel herausziehen.
 *
 *   node werkzeuge/schluessel-lektionen.mjs <textdatei>          Uebersicht
 *   node werkzeuge/schluessel-lektionen.mjs <textdatei> 3        eine Lektion
 *   node werkzeuge/schluessel-lektionen.mjs <textdatei> --json   alles als JSON
 *
 * Die Textdatei entsteht vorher mit:
 *   pdftotext -enc UTF-8 Madina_Book1_German_Key.pdf schluessel.txt
 *
 * WARUM ES DAS GIBT (29.07.2026)
 * ------------------------------
 * Die Schluessel erklaeren je Lektion die Grammatik - genau das, was unsere 73
 * Regeln belegen muessen. Der erste Versuch suchte nach der Ueberschrift
 * "Merke:"; die gibt es aber nur 6x bei 23 Lektionen. Die Erklaerungen stehen
 * meist als Fliesstext zwischen Einleitung und Woerterliste. Also andersherum:
 * die bekannten Bloecke (Woerter, Uebungen) abschneiden - was bleibt, ist die
 * Grammatik. Ergebnis Band 1: 704 Zeilen ueber 23 Lektionen.
 *
 * ZUORDNUNG - und Vorsicht damit. Fuer die Lektionen 1 bis 7 und 9 deckt sich
 * die Lektionsnummer des Buchs mit unserer Kapitelnummer; geprueft an Lektion 1
 * (hadha, kein "ist", Fragepartikel), 3 (Artikel al, Sonnen-/Mondbuchstaben),
 * 5 (Mudaf / Mudaf ilaihi) und 9 (Nat) gegen grammar-data.js.
 *
 * NICHT bei Lektion 8: Das Buch behandelt dort "hadha l-kitaabu" (dies Buch ist
 * kein Satz) - bei uns steht diese Regel in Kapitel 6. Unser Kapitel 8 (lil-,
 * Ortsadverbien) steht im Buch an anderer Stelle. Der Lehrer hat umsortiert.
 *
 * Am 29.07.2026 stand hier zuerst "Lektion N entspricht Kapitel N", belegt an
 * zwei Lektionen und auf alle verallgemeinert. Das war zu stark. Vor einer
 * Zuordnung also den Inhalt vergleichen, nicht die Nummer.
 *
 * ARABISCH WIRD BEWUSST NICHT UEBERNOMMEN. Die Textebene dieser PDFs ist
 * defekt (Meldung "Illegal entry in bfchar block") und liefert falsch
 * vokalisierte Woerter. Wo arabische Brocken standen, steht hier ein
 * Auslassungszeichen - das zeigt, dass dort etwas war, ohne Falsches zu
 * behaupten. Wer den arabischen Wortlaut braucht, rendert die Seite
 * (pdftoppm -r 200) und liest sie; gemessene Genauigkeit dieses Wegs: 28 von
 * 29 Woertern zeichengleich mit vocab-data.js.
 *
 * Das Skript gibt nur aus, es speichert nichts. Der Buchtext gehoert nicht ins
 * Repo - er ist fuer Elias' persoenliche Nutzung freigegeben, nicht zur
 * Weiterveroeffentlichung. */
import fs from 'node:fs';

const T = fs.readFileSync(process.argv[2], 'utf8');
const seiten = T.split('\f');

const start = new Map();
seiten.forEach((s, i) => {
  const m = s.match(/LEKTION\s+(\d+)/);
  if (m && !start.has(Number(m[1]))) start.set(Number(m[1]), i);
});
const nummern = [...start.keys()].sort((a, b) => a - b);

const saeubern = z => z
  .replace(/[؀-ۿ‏‎�]+/g, '…')
  .replace(/…(\s*…)+/g, '…')
  .replace(/\s+/g, ' ')
  .trim();

const raus = [];
for (let i = 0; i < nummern.length; i++) {
  const nr = nummern[i];
  const von = start.get(nr);
  const bis = i + 1 < nummern.length ? start.get(nummern[i + 1]) : seiten.length;
  const roh = seiten.slice(von, bis).join('\n');

  /* Woerter- und Uebungsbloecke abschneiden. Sie laufen bis zum naechsten
     bekannten Block oder bis zum Ende der Lektion. */
  const zeilen = roh.split('\n');
  const grammatik = [];
  let ueberspringen = false;
  for (const z of zeilen) {
    const s = z.trim();
    if (/^(W[oö]rter|Übungen|Uebungen)\s*:/.test(s)) { ueberspringen = true; continue; }
    if (/^LEKTION\s+\d+/.test(s)) { ueberspringen = false; continue; }
    if (/^In (dieser Lektion|diesem Teil) geht es um/.test(s)) { ueberspringen = false; }
    if (ueberspringen) continue;
    if (!s || /^\d+$/.test(s)) continue;
    const rein = saeubern(s);
    /* Zeilen, die nach dem Saeubern nur noch aus Punkten bestehen, waren reiner
       arabischer Text - die tragen keine deutsche Aussage. */
    if (rein.replace(/[…\s.]/g, '').length < 4) continue;
    grammatik.push(rein);
  }
  raus.push({ nr, seite: von + 1, grammatik });
}

if (process.argv[3] === '--json') { console.log(JSON.stringify(raus, null, 1)); process.exit(0); }

const nur = process.argv[3] ? Number(process.argv[3]) : null;
for (const l of raus) {
  if (nur && l.nr !== nur) continue;
  console.log(`\n=== LEKTION ${l.nr} (PDF-Seite ${l.seite}) — ${l.grammatik.length} Zeilen ===`);
  if (nur) l.grammatik.forEach(z => console.log('  ' + z));
}
if (!nur) {
  const g = raus.reduce((s, l) => s + l.grammatik.length, 0);
  console.log(`\n${raus.length} Lektionen, ${g} Grammatik-Zeilen insgesamt.`);
}
