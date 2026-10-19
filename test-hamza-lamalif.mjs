#!/usr/bin/env node
/* test-hamza-lamalif.mjs — das Hamza im Lam-Alif zeigt der Koran-Leser wie quran.com.
 * ==================================================================================
 *
 * Elias am 19.10.2026, mit zwei Bildschirmfotos von 93:4 (quran.com und die App):
 *   „ich möchte, dass diese Hamza im lam alif nicht so darsteht wie sie aktuell
 *    in der app ist sondern so wie bei quran.com. das soll bei jedem hamza in der
 *    position gelten. es verwirrt mich sonst mit dem mad drüber"
 *
 * Die Muṣḥaf-Schrift des Lesers zeichnet Alif + Hamza + Madda nach einem Lam nur
 * dann als Hamza mit Fatha (wie quran.com), wenn davor ihr eigenes Sukun U+06E1
 * steht. quran-text.js hat dort U+0652 — dann zeichnet sie die Madda. Die
 * Anzeige tauscht deshalb genau dieses eine Zeichen (quranSchriftbild() in
 * js/quran.js, Begründung und Messung dort).
 *
 * Geprüft wird mit der ECHTEN Funktion aus js/quran.js und dem ECHTEN Korantext:
 *   H1  keine Stelle mehr mit U+0652 vor Alif + Hamza + Madda (sein Satz)
 *   H2  jede dieser Stellen trägt jetzt U+06E1 — so viele, wie der Text hat
 *   H3  sonst ist der Text unverändert (U+06E1 zurückgetauscht = vorher)
 *   H4  die übrigen Sukun bleiben U+0652 (nicht einfach alle getauscht)
 *   H5  gleiche Wortzahl und gleiche Länge je Wort — die Fehlermarkierungen
 *       (vt_tajweed) merken sich die Zeichenposition im Wort
 *   H6  93:4, der Vers aus seinem Bild, ist dabei
 *   H7  der Leser zeichnet den Verstext wirklich über quranWortSpans()
 *
 * Danach fünf Störtests: je eine kaputte Fassung der Quelle, und der Test MUSS
 * rot werden. Bleibt er grün, misst er die Stelle nicht.
 *
 * Exit 0 = alles grün und jeder Störtest rot geworden. Exit 1 = sonst.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const QUELLE = fs.readFileSync(path.join(HIER, 'js', 'quran.js'), 'utf8');
/* 2,3 MB — gelesen vom Skript, nicht vom Modell. */
const KORAN = new Function(fs.readFileSync(path.join(HIER, 'quran-text.js'), 'utf8') + ';return QURAN_TEXT;')();

const SUKUN = String.fromCodePoint(0x0652);
const SUKUN_MUSHAF = String.fromCodePoint(0x06E1);
const HAMZA_MADDA = String.fromCodePoint(0x0627, 0x0654, 0x0653);
const zaehle = (text, teil) => text.split(teil).length - 1;

/* Die Wortfunktionen ausschneiden — über indexOf, nicht über einen Regex mit
   Zeilengrenzen. [[const_ist_im_vm_kontext_unsichtbar]]: darum gibt der
   Funktionsrumpf die Funktionen ausdrücklich zurück. */
function funktionenAus(quelle){
  const von = quelle.indexOf('const QW_TANWIN_FATH'), bis = quelle.indexOf('function quranAnsicht');
  if (von < 0 || bis < 0 || bis <= von) return null;
  return new Function(quelle.slice(von, bis) + '\n;return { quranWorte, quranWortSpans };')();
}

/* Der Leser zeichnet den Vers in renderVerses() — der Rumpf von dort bis zur
   nächsten Funktion. */
function leserRumpf(quelle){
  const von = quelle.indexOf('function renderVerses(');
  if (von < 0) return '';
  const bis = quelle.indexOf('\nfunction ', von + 10);
  return quelle.slice(von, bis < 0 ? undefined : bis);
}

function pruefeAlles(quelle){
  const befunde = [];
  const f = funktionenAus(quelle);
  if (!f) return { befunde: ['H0: die Wortfunktionen liessen sich nicht aus js/quran.js schneiden'], zahlen: {} };
  let vorher = 0, nachher = 0, mushaf = 0, sukunVor = 0, sukunNach = 0, verse = 0, woerter = 0;
  let anders = '', laenge = '', zahl = '', vers934 = false;
  for (const [s, liste] of Object.entries(KORAN)) liste.forEach(([ar], i) => {
    verse++;
    const html = f.quranWortSpans(ar);
    const roh = f.quranWorte(ar);
    const spans = [...html.matchAll(/<span class="qw" data-w="(\d+)">([^<]*)<\/span>/g)].map(m => m[2]);
    const text = spans.join(' ');
    vorher += zaehle(ar, SUKUN + HAMZA_MADDA);
    nachher += zaehle(text, SUKUN + HAMZA_MADDA);
    mushaf += zaehle(text, SUKUN_MUSHAF + HAMZA_MADDA);
    sukunVor += zaehle(ar, SUKUN);
    sukunNach += zaehle(text, SUKUN);
    woerter += roh.length;
    if (text.split(SUKUN_MUSHAF).join(SUKUN) !== roh.join(' ') && !anders) anders = `${s}:${i + 1}`;
    if (spans.length !== roh.length && !zahl) zahl = `${s}:${i + 1} (${spans.length} statt ${roh.length})`;
    else if (!laenge) {
      const k = roh.findIndex((w, n) => w.length !== (spans[n] || '').length);
      if (k >= 0) laenge = `${s}:${i + 1}, Wort ${k + 1}`;
    }
    if (s === '93' && i === 3) vers934 = (spans[0] || '').includes(SUKUN_MUSHAF + HAMZA_MADDA);
  });
  const ersetzt = vorher - nachher;
  if (vorher === 0) befunde.push('H0: im Korantext steht keine Stelle mit U+0652 vor Alif + Hamza + Madda — der Test misst nichts mehr');
  if (nachher > 0) befunde.push(`H1: ${nachher} Stelle(n) zeigen weiter U+0652 vor Alif + Hamza + Madda — dort steht die Madda`);
  if (mushaf !== vorher) befunde.push(`H2: ${mushaf} von ${vorher} Stellen tragen U+06E1 vor Alif + Hamza + Madda`);
  if (anders) befunde.push(`H3: der Text ist ausser dem Sukun verändert, zuerst in ${anders}`);
  if (sukunNach !== sukunVor - ersetzt) befunde.push(`H4: ${sukunVor - sukunNach} Sukun getauscht statt ${ersetzt} — andere Sukun sind mitgegangen`);
  if (zahl) befunde.push(`H5: andere Wortzahl in ${zahl}`);
  if (laenge) befunde.push(`H5: ein Wort hat eine andere Länge (${laenge}) — die Markierungen rutschen`);
  if (!vers934) befunde.push('H6: in 93:4 steht vor Alif + Hamza + Madda kein U+06E1');
  const rumpf = leserRumpf(quelle);
  if (!rumpf.includes('${quranWortSpans(v.text_uthmani)}')) befunde.push('H7: renderVerses() zeichnet den Verstext nicht mehr über quranWortSpans()');
  if (/\$\{v\.text_uthmani\}/.test(rumpf)) befunde.push('H7: renderVerses() setzt den Verstext roh ein, an quranWortSpans() vorbei');
  return { befunde, zahlen: { verse, woerter, vorher, mushaf, sukunVor, sukunNach } };
}

let schlecht = 0;
const lauf = pruefeAlles(QUELLE);
const z = lauf.zahlen;
console.log('Hamza im Lam-Alif wie bei quran.com (Elias, 19.10.2026)');
console.log(`  ${z.verse} Verse, ${z.woerter} Wörter`);
console.log(`  Stellen mit Sukun vor Alif + Hamza + Madda: ${z.vorher} im Text, ${z.mushaf} davon zeigt der Leser mit U+06E1`);
console.log(`  Sukun U+0652 im Text: ${z.sukunVor}, im Leser: ${z.sukunNach}`);
if (lauf.befunde.length) { schlecht++; for (const b of lauf.befunde) console.log('  ⛔ ' + b); }
else console.log('  ✅ H1–H7 grün');

/* ---------- Störtests: jede Stelle muss GENAU EINMAL in der Quelle stehen ---------- */
const STOERTESTS = [
  ['die Anzeige ruft quranSchriftbild() nicht mehr auf',
    'return quranWorte(quranSchriftbild(text))', 'return quranWorte(text)', /^H1:/],
  ['falsches Zeichen: Fatha statt U+06E1',
    'const QW_SUKUN_MUSHAF = String.fromCodePoint(0x06E1);', 'const QW_SUKUN_MUSHAF = String.fromCodePoint(0x064E);', /^H2:/],
  ['ALLE Sukun getauscht statt nur der vor Alif + Hamza + Madda',
    '.split(QW_SUKUN + QW_HAMZA_MADDA)\n    .join(QW_SUKUN_MUSHAF + QW_HAMZA_MADDA);', '.split(QW_SUKUN)\n    .join(QW_SUKUN_MUSHAF);', /^H4:/],
  ['ein Zeichen mehr: die Markierungen würden verrutschen',
    '.join(QW_SUKUN_MUSHAF + QW_HAMZA_MADDA);', '.join(QW_SUKUN_MUSHAF + QW_SUKUN_MUSHAF + QW_HAMZA_MADDA);', /^H5:/],
  ['der Leser setzt den Verstext roh ein',
    '${quranWortSpans(v.text_uthmani)}', '${v.text_uthmani}', /^H7:/],
];
console.log('');
console.log('Störtests (jeder muss rot werden):');
for (const [name, alt, neu, erwartet] of STOERTESTS) {
  const n = QUELLE.split(alt).length - 1;
  if (n !== 1) { schlecht++; console.log(`  ⛔ „${name}": die Stelle steht ${n}-mal in js/quran.js statt genau einmal`); continue; }
  const r = pruefeAlles(QUELLE.replace(alt, neu));
  if (r.befunde.some(b => erwartet.test(b))) console.log(`  ✔ ${name} → rot (${r.befunde.find(b => erwartet.test(b)).split(':')[0]})`);
  else { schlecht++; console.log(`  ⛔ ${name} → blieb ${r.befunde.length ? 'rot, aber ohne ' + erwartet : 'GRÜN'}`); }
}
console.log('');
console.log(schlecht ? '⛔ test-hamza-lamalif: ' + schlecht + ' Befund(e).' : '✅ test-hamza-lamalif: grün, alle 5 Störtests rot geworden.');
process.exit(schlecht ? 1 : 0);
