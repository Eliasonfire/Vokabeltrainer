/* Traegt in surah-data.js zu jeder Sure ein, in welchen Juz sie liegt.
 *
 * Warum ueberhaupt ein Werkzeug und nicht einmal von Hand: Elias' Vorgabe E.1
 * verlangt fuer jede Koranangabe eine zitierbare Quelle. Eine Liste, die
 * jemand einmal abgetippt hat, laesst sich spaeter nicht mehr nachpruefen -
 * dieser Aufruf schon.
 *
 * Quelle: https://api.quran.com/api/v4/juzs — dieselbe API, die die App in
 * js/quran.js bereits als Rueckfallebene fuer den Verstext nennt. Sie liefert
 * je Juz ein `verse_mapping` der Form { "2": "1-141" }.
 *
 * Zwei Gegenproben laufen mit, und ohne beide schreibt das Skript nichts:
 *
 *   1. Die API gibt jeden Juz DOPPELT zurueck (60 Eintraege fuer 30 Juz).
 *      Beide Faelle muessen dasselbe verse_mapping haben.
 *   2. Die Verszahlen aus dem verse_mapping muessen je Sure genau die
 *      `verses`-Angabe treffen, die schon in surah-data.js steht. Das ist der
 *      eigentliche Wert der Pruefung: zwei voneinander unabhaengige Quellen
 *      sagen dasselbe, oder es wird nichts uebernommen.
 *
 * Aufruf:  node werkzeuge/juz-holen.mjs            (nur pruefen, nichts schreiben)
 *          node werkzeuge/juz-holen.mjs --schreiben
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const DATEI = path.join(HIER, '..', 'surah-data.js');
const SCHREIBEN = process.argv.includes('--schreiben');

const roh = fs.readFileSync(DATEI, 'utf8');
const SURAH_DATA = new Function(roh + ';return SURAH_DATA;')();

const antwort = await fetch('https://api.quran.com/api/v4/juzs');
if (!antwort.ok) { console.error('HTTP ' + antwort.status); process.exit(1); }
const { juzs } = await antwort.json();

/* --- Gegenprobe 1: die doppelten Eintraege muessen uebereinstimmen --- */
const nachNummer = {};
for (const j of juzs) (nachNummer[j.juz_number] = nachNummer[j.juz_number] || []).push(j);
const uneinig = Object.entries(nachNummer)
  .filter(([, l]) => new Set(l.map(j => JSON.stringify(j.verse_mapping))).size > 1)
  .map(([n]) => n);
if (uneinig.length) { console.error('Uneinige Juz: ' + uneinig.join(', ')); process.exit(1); }
const nummern = Object.keys(nachNummer).map(Number).sort((a, b) => a - b);
if (nummern.length !== 30 || nummern[0] !== 1 || nummern[29] !== 30) {
  console.error('Erwartet 30 Juz, bekommen: ' + nummern.length); process.exit(1);
}

/* --- Zuordnung Sure -> Juz-Nummern und Sure -> abgedeckte Verse --- */
const proSure = {}, abgedeckt = {};
for (const j of juzs) {
  for (const [sure, bereich] of Object.entries(j.verse_mapping)) {
    const s = Number(sure);
    (proSure[s] = proSure[s] || new Set()).add(j.juz_number);
    const [von, bis] = bereich.split('-').map(Number);
    const menge = (abgedeckt[s] = abgedeckt[s] || new Set());
    for (let v = von; v <= (bis || von); v++) menge.add(v);
  }
}

/* --- Gegenprobe 2: gegen die Verszahlen, die schon in der Datei stehen --- */
const abweichungen = [];
for (const s of SURAH_DATA) {
  if (!proSure[s.id]) { abweichungen.push(`Sure ${s.id} (${s.name}) kommt in keinem Juz vor`); continue; }
  const n = abgedeckt[s.id].size;
  if (n !== s.verses) abweichungen.push(`Sure ${s.id} (${s.name}): API deckt ${n} Verse ab, surah-data.js sagt ${s.verses}`);
}
if (abweichungen.length) {
  console.error(`${abweichungen.length} Abweichung(en) — es wird NICHTS geschrieben:`);
  abweichungen.forEach(a => console.error('  ' + a));
  process.exit(1);
}

/* --- Zusammenhaengend? Eine Sure ueber Juz 3 und 5, aber nicht 4, waere ein
       Fehler in der Zuordnung und wuerde die Anzeige "3–5" zur Luege machen. --- */
const loecher = [];
for (const s of SURAH_DATA) {
  const l = [...proSure[s.id]].sort((a, b) => a - b);
  if (l[l.length - 1] - l[0] + 1 !== l.length) loecher.push(`Sure ${s.id}: ${l.join(',')}`);
}
if (loecher.length) { console.error('Nicht zusammenhaengend: ' + loecher.join(' | ')); process.exit(1); }

const mehrfach = SURAH_DATA.filter(s => proSure[s.id].size > 1).length;
console.log(`✅ 30 Juz, beide Datensaetze einig.`);
console.log(`✅ 114 von 114 Suren zugeordnet, Verszahlen deckungsgleich mit surah-data.js.`);
console.log(`   ${mehrfach} Suren liegen ueber mehr als einem Juz, alle zusammenhaengend.`);

/* Kein process.exit() im Erfolgsfall: node bricht unter Windows mit einer
   libuv-Assertion ab, wenn man waehrend eines noch offenen fetch-Sockets
   aussteigt. Der Abbruch sah wie ein Fehler aus, obwohl alles geprueft war. */
if (SCHREIBEN) {
  for (const s of SURAH_DATA) s.juz = [...proSure[s.id]].sort((a, b) => a - b);
  const kopf = roh.slice(0, roh.indexOf('const SURAH_DATA = ['));
  /* ⛔ Nie direkt auf die bestehende surah-data.js: ein Abbruch mitten im
     Schreiben hinterliesse eine leere Datei, und die besteht jeden Test.
     [[leere_datei_besteht_jeden_test]] */
  fs.writeFileSync(DATEI + '.neu', kopf + 'const SURAH_DATA = ' + JSON.stringify(SURAH_DATA, null, 1) + ';\n');
  fs.renameSync(DATEI + '.neu', DATEI);
  console.log('\nsurah-data.js ergaenzt.');
} else {
  console.log('\n(Nur geprueft. Mit --schreiben wird surah-data.js ergaenzt.)');
}
