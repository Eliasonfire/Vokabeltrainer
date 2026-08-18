/* rand.mjs -- den Randkontrast der Bedienelemente umschalten.
 *
 *   node werkzeuge/rand.mjs            Stand anzeigen
 *   node werkzeuge/rand.mjs --a        Fassung A: Rand auf WCAG 3,0
 *   node werkzeuge/rand.mjs --ist      zurueck auf den Stand vor dem 18.08.2026
 *
 * WARUM ES DAS GIBT
 * -----------------
 * Elias am 18.08.2026, als er zwischen den drei Entwuerfen gewaehlt hat:
 * "ich finde kompromiss und rand am besten, nimm rand. falls es mir doch nicht
 * gefaellt sorge dafuer das wir das einfach wieder zurueck machen koennen."
 *
 * Deshalb sind die sechs Randfarben nicht in die Regeln geschrieben, sondern
 * als eigene Merkmale in :root. Umschalten heisst: sechs Werte tauschen, sonst
 * aendert sich nichts. Dieses Skript macht genau das und prueft danach nach.
 *
 * ⚠️ Der Reiter .cat-tab hatte vorher GAR KEINEN Rand. Damit das Umschalten die
 * Groesse nicht veraendert, traegt er in beiden Fassungen einen 1-px-Rand - im
 * Ist-Zustand ist er durchsichtig.
 *
 * ⚠️ index.html hat CRLF-Zeilenenden. Hier wird zeilenweise gearbeitet und das
 * gefundene Zeilenende beim Schreiben uebernommen; ein Skript, das die Datei
 * auf LF umstellt, erzeugt sonst einen Diff ueber 4000 Zeilen. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = path.join(REPO, 'index.html');

/* Merkmal -> [Fassung A, Ist-Zustand, wofuer]. Die A-Werte sind die der
   Vorschauseite, die Elias gesehen hat: #5d5d65 erreicht 3,02 auf --surface-1,
   #616169 erreicht 3,02 auf --surface-2. */
const MERKMALE = {
  '--rand-tab':    ['#616169', 'transparent',          '.cat-tab'],
  '--rand-option': ['#616169', 'var(--border)',        '.hoer-option'],
  '--rand-select': ['#616169', 'var(--border)',        '.select-input'],
  '--rand-btn2':   ['#5d5d65', 'var(--border)',        '.btn-secondary'],
  '--rand-check':  ['#616169', 'var(--border-strong)', '.hifz-check'],
  '--rand-korb':   ['#5d5d65', 'var(--border-strong)', '.wz-korb'],
};

const roh = fs.readFileSync(P, 'utf8');
const ZE = roh.includes('\r\n') ? '\r\n' : '\n';
const zeilen = roh.split(/\r?\n/);

/* Wo steht welches Merkmal, und was steht dort gerade? */
const stand = {};
for (const name of Object.keys(MERKMALE)) {
  const i = zeilen.findIndex(z => z.trimStart().startsWith(name + ':'));
  if (i < 0) { console.log('⛔ ' + name + ' steht nicht in index.html — Abbruch.'); process.exit(2); }
  const m = /^(\s*)([^:]+):\s*([^;]+);(.*)$/.exec(zeilen[i]);
  stand[name] = { zeile: i, einzug: m[1], wert: m[3].trim(), rest: m[4] };
}

const wunsch = process.argv.includes('--a') ? 0 : process.argv.includes('--ist') ? 1 : null;

function zeigeStand() {
  console.log('Merkmal          Wert                  gehoert zu       Fassung');
  for (const [name, [a, ist, wo]] of Object.entries(MERKMALE)) {
    const w = stand[name].wert;
    const f = w === a ? 'A (Rand)' : w === ist ? 'Ist (vorher)' : '⚠ weder noch';
    console.log('  ' + name.padEnd(15) + w.padEnd(22) + wo.padEnd(17) + f);
  }
}

if (wunsch === null) { zeigeStand(); process.exit(0); }

let geaendert = 0;
for (const [name, werte] of Object.entries(MERKMALE)) {
  const neu = werte[wunsch], s = stand[name];
  if (s.wert === neu) continue;
  zeilen[s.zeile] = s.einzug + name + ':' + neu + ';' + s.rest;
  geaendert++;
}
fs.writeFileSync(P, zeilen.join(ZE), 'utf8');

/* Gegenprobe am geschriebenen Ergebnis, nicht am Puffer. */
const nach = fs.readFileSync(P, 'utf8').split(/\r?\n/);
let ok = 0;
for (const [name, werte] of Object.entries(MERKMALE)) {
  const z = nach[stand[name].zeile] || '';
  if (z.includes(name + ':' + werte[wunsch] + ';')) ok++;
  else console.log('⛔ ' + name + ' steht nicht wie erwartet: ' + z.trim());
}
console.log(`${geaendert} Merkmal(e) geaendert, ${ok} von ${Object.keys(MERKMALE).length} gegengeprueft.`);
console.log(wunsch === 0
  ? '⭐ Fassung A ist gesetzt. Jetzt CACHE_NAME in sw.js hoch und veroeffentlichen.'
  : '⭐ Zurueck auf den alten Stand. Jetzt CACHE_NAME in sw.js hoch und veroeffentlichen.');
process.exit(ok === Object.keys(MERKMALE).length ? 0 : 2);
