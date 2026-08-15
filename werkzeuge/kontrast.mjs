/* werkzeuge/kontrast.mjs -- WCAG-Kontrast der Textfarben gegen die Flaechen
 *
 * Aufruf:  node werkzeuge/kontrast.mjs
 *          node werkzeuge/kontrast.mjs --suche   (Vorschlag fuer durchgefallene)
 *
 * ⛔ WARUM DIESES SKRIPT DIE WERTE AUS index.html LIEST UND NICHT FEST HAT
 *
 * Die erste Fassung hatte #66666e einprogrammiert. Nachdem der Wert in
 * index.html geaendert war, meldete sie unveraendert "3.69 ⛔" - sie pruefte
 * gar nichts mehr, sondern zeigte einen Schnappschuss von gestern. Ein
 * Pruefwerkzeug, das seine eigene Eingabe erfindet, ist schlimmer als keines:
 * es sieht nach Messung aus.
 *
 * ⭐ DER FEHLER, DEN DIESES SKRIPT AUFGEDECKT HAT (07.08. gegen 15.08.2026)
 *
 * Die Rechnung vom 07.08. pruefte nur gegen --bg (#000) und meldete 3,69 fuer
 * --text-faint. Das ist der MILDESTE Fall, nicht der haerteste: bei heller
 * Schrift auf dunklem Grund sinkt der Kontrast, je heller der Grund wird. Auf
 * --surface-3 waren es nur 3,02. Wer nur gegen Schwarz rechnet, haelt eine
 * Farbe fuer knapp durchgefallen, die in Wahrheit deutlich durchfaellt.
 *
 * Welche Flaeche wirklich zaehlt, steht nicht im CSS - das wurde im laufenden
 * Browser gemessen (getComputedStyle ueber alle Elemente, Hintergrund nach
 * oben verfolgt bis zur ersten nicht-transparenten Farbe).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

/* ⚠️ fileURLToPath, NICHT new URL(...).pathname. Der Projektpfad enthaelt eine
   Leerstelle ("G:\1. Workspace\..."), und die steht in einer file:-URL als
   %20. pathname gibt sie unveraendert zurueck, fs.readFileSync sucht dann
   nach "G:\1.%20Workspace\index.html" und findet nichts. Genau so ist dieses
   Skript beim ersten Lauf gescheitert. */
const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HTML = fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf8');

const lies = name => {
  const m = HTML.match(new RegExp(`--${name}\\s*:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) { console.error(`⛔ --${name} nicht in index.html gefunden.`); process.exit(1); }
  return m[1].toLowerCase();
};

const kanal = c => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const leuchte = h => { const [r, g, b] = hex(h); return 0.2126 * kanal(r) + 0.7152 * kanal(g) + 0.0722 * kanal(b); };
const kontrast = (a, b) => { const x = leuchte(a), y = leuchte(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const zeig = n => n.toFixed(2).padStart(5);

/* Flaechen mit der im Browser gezaehlten Zahl der Elemente, die --text-faint
   dort tragen. Die Zahl steht dabei, damit spaeter erkennbar ist, wie schwer
   ein Durchfallen wiegt - eine Flaeche mit einem Element ist kein Grund, das
   ganze Farbsystem umzubauen, aber sie zaehlt trotzdem. */
const FLAECHEN = [
  ['bg',        10],
  ['surface-1',  3],
  ['surface-2',  5],
  ['surface-3',  1]
];
/* Alle Fundstellen sind unter 13 px -> AA verlangt 4,5.
   Die Erleichterung auf 3,0 gilt erst ab 18,66 px fett bzw. 24 px. */
const AA = 4.5;

const TEXTE = ['text', 'text-dim', 'text-faint'];
let durchgefallen = [];

console.log(`Flaechen: ${FLAECHEN.map(([f]) => '--' + f + ' ' + lies(f)).join(' · ')}`);
console.log(`Schwelle: AA ${AA} (alle Fundstellen unter 13 px)\n`);

for (const t of TEXTE) {
  const farbe = lies(t);
  const werte = FLAECHEN.map(([f]) => kontrast(farbe, lies(f)));
  const min = Math.min(...werte);
  const ok = min >= AA;
  console.log(`--${t.padEnd(11)} ${farbe}   ${werte.map(zeig).join('  ')}   min ${zeig(min)} ${ok ? '✅' : '⛔'}`);
  if (!ok) durchgefallen.push([t, farbe]);
}
console.log(`${''.padEnd(26)}${FLAECHEN.map(([f]) => ('--' + f).padStart(7)).join('  ')}`);

if (process.argv.includes('--suche')) {
  for (const [t, farbe] of durchgefallen) {
    console.log(`\nVorschlag fuer --${t} (Blaustich B-R = ${hex(farbe)[2] - hex(farbe)[0]} bleibt erhalten):`);
    const stich = hex(farbe)[2] - hex(farbe)[0];
    for (let r = hex(farbe)[0]; r <= 255; r++) {
      const f = '#' + [r, r, Math.min(255, r + stich)].map(v => v.toString(16).padStart(2, '0')).join('');
      if (Math.min(...FLAECHEN.map(([fl]) => kontrast(f, lies(fl)))) >= AA) {
        console.log(`  ${f}  (Sprung +${r - hex(farbe)[0]})`); break;
      }
    }
  }
}

if (durchgefallen.length) { console.log(`\n⛔ ${durchgefallen.length} Textfarbe(n) unter AA. Mit --suche einen Vorschlag rechnen.`); process.exit(1); }
console.log('\n✅ Alle Textfarben erreichen AA auf jeder gemessenen Flaeche.');
