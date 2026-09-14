/* verszeichen-bauen.mjs — erzeugt quran-verszeichen.js (14.09.2026)
 *
 * ⭐ WOZU. Der Juz-Ring im Quran-Leser zeigt, wie viel Elias von EINEM Juz
 * auswendig kann — gemessen in Seiten des Muṣḥaf, nicht in Versen. Sein Ziel
 * im Wortlaut: „ich habe ein ziel und das ist einen juz insgesamt aus dem
 * koran zu können … ich will auch suren lernen außerhalb von juz 30 und wenn
 * die dann nicht mitzählen dann wäre das ja schlecht."
 *
 * ⛔ WARUM NICHT IN VERSEN. Gemessen am 14.09.2026: Juz 1 hat 293 Verse,
 * Juz 30 hat 564. Wer in Versen zählt, bekommt für dieselbe Mühe je nach Sure
 * das Doppelte angezeigt.
 *
 * ⛔ WARUM EINE EIGENE DATEI. Die Rechnung braucht die Textmenge je Vers.
 * Die steckt in quran-text.js — 2,3 MB, und die App laedt sie ERST beim
 * Oeffnen einer Sure nach (js/quran.js, `s.onload`). Ein Ring, der darauf
 * wartet, waere beim Aufschlagen der Liste leer. Deshalb hier einmal
 * vorberechnet: 6236 Zahlen statt 2,3 MB.
 *
 * Gezaehlt werden Buchstaben OHNE Taschkil und ohne Leerzeichen — das
 * Skelett. Mit Taschkil haenge die Zahl daran, wie vollstaendig vokalisiert
 * eine Stelle ist, und das ist keine Aussage ueber die Textmenge.
 *
 * Neu erzeugen (und damit nachpruefen):
 *     node werkzeuge/verszeichen-bauen.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function ladeAusSkript(datei, name){
  const c = {};
  vm.createContext(c);
  vm.runInContext(fs.readFileSync(path.join(WURZEL, datei), 'utf8')
    + ';globalThis.__x = ' + name + ';', c);
  return c.__x;
}

const TEXT   = ladeAusSkript('quran-text.js', 'QURAN_TEXT');
const SEITEN = ladeAusSkript('quran-seiten.js', 'QURAN_SEITEN');
const SUREN  = JSON.parse(fs.readFileSync(path.join(WURZEL, 'surah-data.js'), 'utf8')
  .replace(/^[\s\S]*?(\[)/, '$1').replace(/;\s*$/, ''));

/* Taschkil, Tatwil und Leerraum raus. */
const skelett = s => String(s || '')
  .replace(/[ً-ْٰۖ-ۭـ]/g, '')
  .replace(/\s+/g, '');

const proSure = {};
let gesamt = 0, fehlend = 0;
for (const s of SUREN){
  const verse = TEXT[s.id] || [];
  const zahlen = [];
  for (let v = 1; v <= s.verses; v++){
    const paar = verse[v - 1];
    const n = skelett(paar && paar[0]).length;
    if (!n) fehlend++;
    zahlen.push(n);
    gesamt += n;
  }
  proSure[s.id] = zahlen;
}

if (fehlend){
  console.log('⛔ ABBRUCH: ' + fehlend + ' Vers(e) ohne Text. Nichts geschrieben.');
  process.exit(1);
}

const kopf = `/* quran-verszeichen.js — ERZEUGT, nicht von Hand pflegen.
   Quelle: quran-text.js · Werkzeug: werkzeuge/verszeichen-bauen.mjs
   Erzeugt am ${new Date().toISOString().slice(0, 10)}.

   QURAN_VERSZEICHEN[Sure] = [Zeichen von Vers 1, Vers 2, …]
   Gezaehlt sind Buchstaben ohne Taschkil und ohne Leerzeichen.

   Wofuer: der Juz-Ring rechnet daraus die Seitenanteile. Ein Juz sind
   ${(SEITEN.length / 30).toFixed(2)} Seiten (${SEITEN.length} ÷ 30).
   ⛔ Nicht in Versen rechnen — Juz 1 hat 293, Juz 30 hat 564. */
const QURAN_VERSZEICHEN = `;

const leib = '{\n' + SUREN.map(s =>
  '  ' + s.id + ':[' + proSure[s.id].join(',') + ']').join(',\n') + '\n};\n';

const ziel = path.join(WURZEL, 'quran-verszeichen.js');
fs.writeFileSync(ziel + '.neu', kopf + leib, 'utf8');
fs.renameSync(ziel + '.neu', ziel);

const groesse = fs.statSync(ziel).size;
console.log('✔ quran-verszeichen.js geschrieben');
console.log('  Suren:   ' + SUREN.length);
console.log('  Verse:   ' + Object.values(proSure).reduce((a, x) => a + x.length, 0));
console.log('  Zeichen: ' + gesamt.toLocaleString('de-DE'));
console.log('  Ein Juz: ' + Math.round(gesamt / 30).toLocaleString('de-DE') + ' Zeichen bzw. '
  + (SEITEN.length / 30).toFixed(2) + ' Seiten');
console.log('  Groesse: ' + (groesse / 1024).toFixed(1) + ' KB');
