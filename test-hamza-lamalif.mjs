#!/usr/bin/env node
/* test-hamza-lamalif.mjs — das Hamza im Lam-Alif zeigt der Koran-Leser wie quran.com.
 * ==================================================================================
 *
 * Elias am 19.10.2026, mit zwei Bildschirmfotos von 93:4 (quran.com und die App):
 *   „ich möchte, dass diese Hamza im lam alif nicht so darsteht wie sie aktuell
 *    in der app ist sondern so wie bei quran.com. das soll bei jedem hamza in der
 *    position gelten. es verwirrt mich sonst mit dem mad drüber"
 *
 * Die Muṣḥaf-Schrift des Lesers zeichnet Hamza-Alif + Madda nach einem Lam nur
 * dann als Hamza mit Fatha (wie quran.com), wenn davor ihr eigenes Sukun U+06E1
 * steht; mit U+0652 zeichnet sie die Madda.
 *
 * ⭐ Seit dem 19.10.2026 (v692) ist quran-text.js der Text von quran.com (Elias:
 * „stelle sicher das sie gleich sind damit keine fehler da sind"). Dort steht
 * U+06E1 an diesen Stellen von selbst; der Tausch in der Anzeige
 * (quranSchriftbild(), v691) ist entfallen. Geprüft wird deshalb jetzt AM TEXT,
 * und daran, dass der Leser ihn unverändert zeigt — mit der ECHTEN Funktion aus
 * js/quran.js und dem ECHTEN Korantext:
 *   H1  keine Stelle mit U+0652 vor Hamza-Alif + Madda nach einem Lam (sein Satz)
 *   H2  jede Stelle Lam + Sukun + Hamza-Alif + Madda trägt U+06E1 — und es gibt sie
 *       (sonst misst der Test nichts)
 *   H3  der Leser zeigt den Vers Zeichen für Zeichen, wie er in quran-text.js steht
 *   H5  gleiche Wortzahl und gleiche Länge je Wort in Liste und Anzeige — die
 *       Fehlermarkierungen (vt_tajweed) merken sich die Zeichenposition im Wort
 *   H6  93:4, der Vers aus seinem Bild, ist dabei
 *   H7  der Leser zeichnet den Verstext wirklich über quranWortSpans()
 *
 * Danach vier Störtests (drei an der Quelle, einer am Text), und jeder MUSS rot
 * werden. Bleibt er grün, misst der Test die Stelle nicht.
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

const Z = (...c) => String.fromCodePoint(...c);
const LAM = Z(0x0644), SUKUN = Z(0x0652), SUKUN_MUSHAF = Z(0x06E1);
/* Hamza-Alif + Madda — quran.com schreibt das Hamza-Alif als EIN Zeichen (U+0623);
   die alte Datei schrieb es zerlegt (U+0627 + U+0654). Gezählt wird beides. */
const HAMZA_MADDA = [Z(0x0623, 0x0653), Z(0x0627, 0x0654, 0x0653)];
const zaehle = (text, teil) => text.split(teil).length - 1;
const zaehleHM = (text, vor) => HAMZA_MADDA.reduce((n, hm) => n + zaehle(text, vor + hm), 0);

/* Die Wortfunktionen ausschneiden — über indexOf, nicht über einen Regex mit
   Zeilengrenzen. [[const_ist_im_vm_kontext_unsichtbar]]: darum gibt der
   Funktionsrumpf die Funktionen ausdrücklich zurück. */
function funktionenAus(quelle){
  const von = quelle.indexOf('function quranWorte(text){'), bis = quelle.indexOf('function quranAnsicht');
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
const entities = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

function pruefeAlles(quelle, koran){
  const befunde = [];
  const f = funktionenAus(quelle);
  if (!f) return { befunde: ['H0: die Wortfunktionen liessen sich nicht aus js/quran.js schneiden'], zahlen: {} };
  let verse = 0, woerter = 0, mitSukun = 0, mitMushaf = 0, mitRund = 0;
  let anders = '', laenge = '', zahl = '', vers934 = false;
  for (const [s, liste] of Object.entries(koran)) liste.forEach(([ar], i) => {
    verse++;
    const html = f.quranWortSpans(ar);
    const roh = f.quranWorte(ar);
    const spans = [...html.matchAll(/<span class="qw" data-w="(\d+)">([^<]*)<\/span>/g)].map(m => entities(m[2]));
    const gezeigt = spans.join(' ');
    woerter += roh.length;
    mitMushaf += zaehleHM(gezeigt, LAM + SUKUN_MUSHAF);
    mitRund += zaehleHM(gezeigt, LAM + SUKUN);
    mitSukun += zaehleHM(ar, LAM + SUKUN_MUSHAF) + zaehleHM(ar, LAM + SUKUN);
    if (gezeigt !== ar.trim() && !anders) anders = `${s}:${i + 1}`;
    if (spans.length !== roh.length && !zahl) zahl = `${s}:${i + 1} (${spans.length} statt ${roh.length})`;
    else if (!laenge) {
      const k = roh.findIndex((w, n) => w.length !== (spans[n] || '').length);
      if (k >= 0) laenge = `${s}:${i + 1}, Wort ${k + 1}`;
    }
    if (s === '93' && i === 3) vers934 = zaehleHM(gezeigt, LAM + SUKUN_MUSHAF) > 0;
  });
  if (mitSukun === 0) befunde.push('H0: im Korantext steht keine Stelle Lam + Sukun + Hamza-Alif + Madda — der Test misst nichts mehr');
  if (mitRund > 0) befunde.push(`H1: ${mitRund} Stelle(n) zeigen U+0652 vor Hamza-Alif + Madda — dort zeichnet die Schrift die Madda`);
  if (mitMushaf !== mitSukun) befunde.push(`H2: ${mitMushaf} von ${mitSukun} Stellen tragen U+06E1 vor Hamza-Alif + Madda`);
  if (anders) befunde.push(`H3: der Leser zeigt einen anderen Text als quran-text.js, zuerst in ${anders}`);
  if (zahl) befunde.push(`H5: andere Wortzahl in ${zahl}`);
  if (laenge) befunde.push(`H5: ein Wort hat eine andere Länge (${laenge}) — die Markierungen rutschen`);
  if (!vers934) befunde.push('H6: in 93:4 steht vor Hamza-Alif + Madda kein U+06E1');
  const rumpf = leserRumpf(quelle);
  if (!rumpf.includes('${quranWortSpans(v.text_uthmani)}')) befunde.push('H7: renderVerses() zeichnet den Verstext nicht mehr über quranWortSpans()');
  if (/\$\{v\.text_uthmani\}/.test(rumpf)) befunde.push('H7: renderVerses() setzt den Verstext roh ein, an quranWortSpans() vorbei');
  return { befunde, zahlen: { verse, woerter, mitSukun, mitMushaf, mitRund } };
}

let schlecht = 0;
const lauf = pruefeAlles(QUELLE, KORAN);
const z = lauf.zahlen;
console.log('Hamza im Lam-Alif wie bei quran.com (Elias, 19.10.2026)');
console.log(`  ${z.verse} Verse, ${z.woerter} Wörter`);
console.log(`  Stellen Lam + Sukun + Hamza-Alif + Madda: ${z.mitSukun} im Text, ${z.mitMushaf} davon zeigt der Leser mit U+06E1, ${z.mitRund} mit U+0652`);
if (lauf.befunde.length) { schlecht++; for (const b of lauf.befunde) console.log('  ⛔ ' + b); }
else console.log('  ✅ H1–H7 grün');

/* ---------- Störtests: jede Stelle muss GENAU EINMAL in der Quelle stehen ---------- */
const STOERTESTS = [
  ['die Anzeige tauscht U+06E1 gegen U+0652 (so sah der Text bis v691 aus)',
    '  return quranWorte(text)\n', '  return quranWorte(String(text).split(String.fromCodePoint(0x06E1)).join(String.fromCodePoint(0x0652)))\n', /^H1:/],
  ['die Anzeige hängt ein Zeichen an jedes Wort: die Markierungen würden verrutschen',
    "'\">' + w + '</span>'", "'\">' + w + String.fromCodePoint(0x200F) + '</span>'", /^H3:/],
  ['der Leser setzt den Verstext roh ein',
    '${quranWortSpans(v.text_uthmani)}', '${v.text_uthmani}', /^H7:/],
];
console.log('');
console.log('Störtests (jeder muss rot werden):');
for (const [name, alt, neu, erwartet] of STOERTESTS) {
  const n = QUELLE.split(alt).length - 1;
  if (n !== 1) { schlecht++; console.log(`  ⛔ „${name}": die Stelle steht ${n}-mal in js/quran.js statt genau einmal`); continue; }
  const r = pruefeAlles(QUELLE.replace(alt, neu), KORAN);
  if (r.befunde.some(b => erwartet.test(b))) console.log(`  ✔ ${name} → rot (${r.befunde.find(b => erwartet.test(b)).split(':')[0]})`);
  else { schlecht++; console.log(`  ⛔ ${name} → blieb ${r.befunde.length ? 'rot, aber ohne ' + erwartet : 'GRÜN'}`); }
}
/* Am Text: an der ersten Stelle U+06E1 gegen U+0652 — so wie die alte Datei. */
{
  const kopie = JSON.parse(JSON.stringify(KORAN));
  let getan = false;
  for (const liste of Object.values(kopie)) for (const v of liste){
    if (getan) break;
    const alt = LAM + SUKUN_MUSHAF + HAMZA_MADDA[0];
    if (v[0].includes(alt)){ v[0] = v[0].replace(alt, LAM + SUKUN + HAMZA_MADDA[0]); getan = true; }
  }
  const r = pruefeAlles(QUELLE, kopie);
  const name = 'im Text steht an einer Stelle U+0652 statt U+06E1';
  if (getan && r.befunde.some(b => /^H1:/.test(b))) console.log(`  ✔ ${name} → rot (H1)`);
  else { schlecht++; console.log(`  ⛔ ${name} → ${getan ? 'blieb grün' : 'keine Stelle zum Stören gefunden'}`); }
}
console.log('');
console.log(schlecht ? '⛔ test-hamza-lamalif: ' + schlecht + ' Befund(e).' : '✅ test-hamza-lamalif: grün, alle 4 Störtests rot geworden.');
process.exit(schlecht ? 1 : 0);
