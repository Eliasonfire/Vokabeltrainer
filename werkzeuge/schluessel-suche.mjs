/* schluessel-suche.mjs -- in den deutschen Madina-Schluesseln suchen und die
 * PDF-Seite nennen, auf der der Treffer steht.
 *
 * Aufruf:
 *   node werkzeuge/schluessel-suche.mjs <suchwort>          in Band 2 und 3
 *   node werkzeuge/schluessel-suche.mjs <suchwort> 3        nur Band 3
 *   node werkzeuge/schluessel-suche.mjs --stand             was die Textebene hergibt
 *
 * Sucht deutsch UND arabisch. Arabisch wird OHNE Vokalzeichen verglichen, also
 * findet "الفاعل" auch "الفَاعِل".
 *
 * ================== WOZU, UND WAS ES AUSDRUECKLICH NICHT KANN ==============
 *
 * Die To-Do stand bis zum 18.08.2026 auf: "auch das Deutsche in der Textebene
 * zerstoert (kein Umlaut uebersteht pdftotext), es geht also nur ueber
 * pdftoppm und Seite-fuer-Seite-Lesen". Nachgemessen stimmt daran nichts:
 *
 *   Band 2   127.177 Zeichen   1.508 Umlaute   141 Seiten   6 arabische Zeichen
 *   Band 3   405.968 Zeichen   2.769 Umlaute   272 Seiten   86.182 arabische Zeichen
 *
 * Das Deutsche ist vollstaendig lesbar. Damit werden aus "413 Seiten Seite fuer
 * Seite lesen" ein paar gezielte Renderauftraege.
 *
 * ⛔ ABER: Der arabische Text ist NICHT zitierfaehig. Gemessen an Band 3:
 * **5.729 von 14.966 arabischen Woertern (38 %) beginnen mit einer Ḥaraka** -
 * im Arabischen unmoeglich. Die Zeichen kommen in visueller statt logischer
 * Reihenfolge heraus, aus مَرْفُوعٌ wird ٌَمرْفُوع. Das Konsonantengeruest
 * dagegen ist intakt; deshalb ist die Datei ein brauchbarer SUCHINDEX und
 * keine Quelle.
 *
 * ⚠️ Die Zahl haengt an der Normalisierung, und das ist kein Detail: nach
 * `normalize('NFC')` sind es **8.140 von 14.966 (54 %)**, weil NFC einen Teil
 * der Zeichen zusammenzieht und umordnet. Erst mass ich 54 %, dann meldete
 * dasselbe Werkzeug 38 % - der Unterschied war allein das fehlende NFC.
 * Gemeldet wird hier der Rohwert; die Aussage ("systematisch verschoben")
 * traegt in beiden Faellen.
 *
 * ⛔⛔ EIN NULLTREFFER AUF ARABISCH BELEGT NICHTS (gemessen 19.08.2026). Nicht
 * nur die Vokalzeichen sind verschoben, ganze Woerter sind unauffindbar:
 *
 *   الأسماء  0 Treffer     أسماء  0 Treffer     إضافة  0 Treffer
 *   تنوين    0 Treffer     هناك   0 Treffer     الخمسة 3 Treffer (S. 7, 8, 17)
 *
 * Alle fuenf Nulltreffer stehen nachweislich im Buch - الأسماء الخمسة z.B. auf
 * Band-3-Seite 7, wo asma-khamsa-vollstaendig-01 herkommt. Auch die
 * Hamza-Gleichsetzung aus schluessel_zeile.py hilft kaum weiter (مبتدأ 0 -> 1,
 * der Rest bleibt 0). ⭐ Also: DEUTSCH suchen. Das Arabische ist ein Bonus,
 * keine Auskunft ueber Abwesenheit.
 *
 * ⚠️ DIE PDF-SEITE IST NICHT DIE GEDRUCKTE SEITE, und der Versatz ist nicht
 * konstant. Band 2: PDF 5 = gedruckt 1, PDF 34 = gedruckt 30, PDF 96 =
 * gedruckt 93, PDF 140 = gedruckt 137 - vorne 4, hinten 3. Dieses Werkzeug
 * meldet die PDF-Seite, und source2.seite in grammar-data.js fuehrt sie auch;
 * validate.js begrenzt entsprechend auf 73 / 141 / 272.
 *
 * ⭐ Der Weg ist also: hier suchen -> Seitenzahl bekommen -> genau diese Seite
 * mit `pdftoppm -r 600 -f N -l N` rendern -> von dort abschreiben. Das ist
 * derselbe Grundsatz wie bei den Buchseiten: die Textebene sagt WO, das Bild
 * sagt WAS.
 */
import fs from 'node:fs';
import path from 'node:path';

const ORDNER = 'G:/1. Workspace/PDF Download';
const BAENDE = { 2: 'Madina_Book2_German_Key', 3: 'Madina_Book3_German_Key' };

/* Vokalzeichen, Tatweel und die Richtungsmarken raus - letztere stehen in
   diesen Dateien massenhaft zwischen den Woertern und wuerden jeden Vergleich
   scheitern lassen, ohne dass man es sieht. */
const BLIND = /[\u064B-\u0652\u0670\u0640\u200e\u200f\u202a-\u202e]/g;
const skel = s => s.normalize('NFC').replace(BLIND, '');

function lade(band) {
  const p = path.join(ORDNER, BAENDE[band] + '.txt');
  if (!fs.existsSync(p)) {
    console.log('⛔ ' + path.basename(p) + ' fehlt. Erzeugen mit:');
    console.log('   pdftotext -enc UTF-8 "' + path.join(ORDNER, BAENDE[band] + '.pdf') + '" "' + p + '"');
    return null;
  }
  /* pdftotext trennt Seiten mit Formfeed - daraus kommt die Seitenzahl. */
  return fs.readFileSync(p, 'utf8').split('\f');
}

function stand() {
  for (const band of Object.keys(BAENDE)) {
    const seiten = lade(band);
    if (!seiten) continue;
    const t = seiten.join('');
    const arWoerter = t.split(/[\s\u200e\u200f]+/).filter(w => /[\u0621-\u064A]/.test(w));
    const kaputt = arWoerter.filter(w => /^[\u064B-\u0652]/.test(w));
    console.log('Band ' + band + ':  ' + seiten.length + ' Seiten, ' + t.length + ' Zeichen');
    console.log('   deutsch: ' + (t.match(/[äöüÄÖÜß]/g) || []).length + ' Umlaute - lesbar');
    console.log('   arabisch: ' + arWoerter.length + ' Woerter, davon ' + kaputt.length
      + ' mit vorangestellter Ḥaraka (' + (arWoerter.length ? (100 * kaputt.length / arWoerter.length).toFixed(0) : 0)
      + ' %) - NICHT zitierfaehig, nur zum Suchen');
  }
}

function suche(wort, baende) {
  const s = skel(wort);
  const arabisch = /[\u0621-\u064A]/.test(s);
  let gesamt = 0;
  for (const band of baende) {
    const seiten = lade(band);
    if (!seiten) continue;
    const treffer = [];
    seiten.forEach((seite, i) => {
      const heu = arabisch ? skel(seite) : seite;
      const n = heu.split(s).length - 1;
      if (n) treffer.push({ pdfSeite: i + 1, n, zeile: kontext(seite, s, arabisch) });
    });
    gesamt += treffer.length;
    console.log('\n=== Band ' + band + ': ' + treffer.length + ' Seite(n) mit "' + wort + '" ===');
    for (const t of treffer.slice(0, 25))
      console.log('  PDF-Seite ' + String(t.pdfSeite).padStart(3) + '  (' + t.n + 'x)  ' + t.zeile);
    if (treffer.length > 25) console.log('  ... und ' + (treffer.length - 25) + ' weitere Seiten');
  }
  if (!gesamt) console.log('\nKein Treffer. Bei arabischen Woertern ohne Vokalzeichen suchen.');
  else console.log('\n⭐ Zum Abschreiben die Seite rendern, nicht diese Ausgabe benutzen:'
    + '\n   pdftoppm -png -r 600 -f N -l N "' + path.join(ORDNER, 'Madina_BookN_German_Key.pdf') + '" seite');
}

/* Eine Zeile Umgebung, damit man sieht, WAS getroffen wurde - ein
   Stichworttreffer ist kein Inhaltstreffer. */
function kontext(seite, s, arabisch) {
  for (const z of seite.split(/\r?\n/)) {
    if ((arabisch ? skel(z) : z).includes(s)) return z.trim().replace(/\s+/g, ' ').slice(0, 95);
  }
  return '';
}

const args = process.argv.slice(2);
if (args.includes('--stand') || !args.length) { stand(); if (!args.length) console.log('\nAufruf: node werkzeuge/schluessel-suche.mjs <suchwort> [2|3]'); }
else {
  const wort = args.find(a => !a.startsWith('--') && !/^[23]$/.test(a));
  const band = args.find(a => /^[23]$/.test(a));
  suche(wort, band ? [band] : ['2', '3']);
}
