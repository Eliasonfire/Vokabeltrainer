/* eselsbruecken-setzen.mjs -- neue Eselsbruecken aus einer Datendatei einspielen
   ============================================================================

   WOZU

   Am 18.08.2026 hat Elias die Eselsbruecken reihenweise als unbrauchbar
   gemeldet: „sie haben im prinzip nur die pluralform erklärt oder erwähnt. das
   muss anders laufen." Gemessen betrifft das 77 von 181 Woertern. Die von Hand
   zu ersetzen hiesse, 77-mal denselben Handgriff zu tun - und genau dabei
   passieren die Fehler, die niemand mehr findet.

   ⛔ WARUM DER TEXT IN EINER DATENDATEI STEHT UND NICHT IM AUFRUF

   Deutscher und arabischer Text darf nicht durch die Kommandozeile. Maskierungen
   gehen dort lautlos verloren, und der Befehl meldet trotzdem Erfolg. Deshalb:
   der Text steht in einer JSON-Datei, das Skript liest sie, und geschrieben wird
   ueber JSON.stringify beziehungsweise eine eigene Maskierung - nie durch
   Zusammenkleben von Zeichenketten aus der Shell.

   ⛔ WARUM NICHT DIE GANZE DATEI NEU ERZEUGEN

   Naheliegend waere: Datei einlesen, Objekt aendern, neu ausgeben. Dabei gingen
   saemtliche Kommentare verloren - in data/eselsbruecken-alt.js steht ueber
   jedem Eintrag, um welches Wort es geht, und in vocab-data.js haengt an vielen
   Feldern die Begruendung. Deshalb wird gezielt die betroffene ZEILE ersetzt und
   der Rest der Datei nicht angefasst.

   AUFRUF

     node werkzeuge/eselsbruecken-setzen.mjs <datei.json>
     node werkzeuge/eselsbruecken-setzen.mjs <datei.json> --pruefen   (nur zeigen)

   AUFBAU DER DATENDATEI

     {
       "45840": {
         "mnemo": "Text fuer die erste Stelle (steht in vocab-data.js)",
         "alt":  ["zweiter Text", "dritter Text"]
       }
     }

   Beide Felder sind einzeln optional. Fehlt "alt", bleiben die Alternativen
   stehen; fehlt "mnemo", bleibt die erste Stelle stehen.
*/

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HIER  = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.join(HIER, '..');
const VOCAB = path.join(WURZEL, 'vocab-data.js');
const ALT   = path.join(WURZEL, 'data', 'eselsbruecken-alt.js');

const datei = process.argv[2];
const nurZeigen = process.argv.includes('--pruefen');
if (!datei){
  console.error('Aufruf: node werkzeuge/eselsbruecken-setzen.mjs <datei.json> [--pruefen]');
  process.exit(1);
}

const neu = JSON.parse(fs.readFileSync(datei, 'utf8'));
const ids = Object.keys(neu);
console.log(`${ids.length} Wort/Woerter in ${path.basename(datei)}.\n`);

/* ⚠️ Das Zeilenende der ZIELDATEI messen, nicht annehmen. Beide Dateien liegen
   hier mit CRLF; schriebe man LF hinein, waere die Datei danach gemischt und
   jeder spaetere Vergleich meldete Unterschiede, die keine sind. */
function zeilenende(text){ return text.includes('\r\n') ? '\r\n' : '\n'; }

/* ---------- vocab-data.js: die mnemo-Zeile des Eintrags ---------- */
function setzeMnemo(inhalt, id, text){
  const ze = zeilenende(inhalt);
  const zeilen = inhalt.split(/\r?\n/);
  /* Den Eintrag ueber seine id-Zeile finden. Die Suche nach der mnemo-Zeile
     laeuft danach nur ein kurzes Stueck weiter - der naechste "id"-Eintrag
     beendet sie, sonst schriebe man in das falsche Wort. */
  const iId = zeilen.findIndex(z => z.trim() === `"id": "${id}",`);
  if (iId < 0) return { inhalt, meldung: `id ${id}: keine Zeile "id": "${id}" gefunden` };
  let iMnemo = -1;
  for (let i = iId + 1; i < zeilen.length; i++){
    if (/^\s*"id":/.test(zeilen[i])) break;             /* naechstes Wort erreicht */
    if (/^\s*"mnemo":/.test(zeilen[i])){ iMnemo = i; break; }
  }
  if (iMnemo < 0) return { inhalt, meldung: `id ${id}: keine mnemo-Zeile im Eintrag` };
  const einzug = zeilen[iMnemo].match(/^\s*/)[0];
  const endeKomma = zeilen[iMnemo].trimEnd().endsWith(',') ? ',' : '';
  zeilen[iMnemo] = `${einzug}"mnemo": ${JSON.stringify(text)}${endeKomma}`;
  return { inhalt: zeilen.join(ze), meldung: null };
}

/* ---------- data/eselsbruecken-alt.js: der Block '<id>': [ … ], ---------- */
/* Einfache Anfuehrungszeichen wie im Rest der Datei. Maskiert werden Backslash
   und das Anfuehrungszeichen selbst - mehr braucht es in einer JS-Zeichenkette
   mit einfachen Anfuehrungszeichen nicht, und mehr zu maskieren machte den Text
   im Ergebnis unleserlich. */
function jsText(s){ return "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'"; }

function setzeAlt(inhalt, id, texte){
  const ze = zeilenende(inhalt);
  const zeilen = inhalt.split(/\r?\n/);
  const iStart = zeilen.findIndex(z => z.trim().startsWith(`'${id}': [`));
  if (iStart < 0) return { inhalt, meldung: `id ${id}: kein Block '${id}': [ gefunden` };
  let iEnde = -1;
  for (let i = iStart + 1; i < zeilen.length; i++){
    if (/^\s*\],?\s*$/.test(zeilen[i])){ iEnde = i; break; }
  }
  if (iEnde < 0) return { inhalt, meldung: `id ${id}: Block wird nicht geschlossen` };
  const einzug = zeilen[iStart].match(/^\s*/)[0];
  const innen = einzug + '  ';
  const neuBlock = [
    `${einzug}'${id}': [`,
    ...texte.map((t, i) => `${innen}${jsText(t)}${i < texte.length - 1 ? ',' : ''}`),
    zeilen[iEnde]
  ];
  zeilen.splice(iStart, iEnde - iStart + 1, ...neuBlock);
  return { inhalt: zeilen.join(ze), meldung: null };
}

let vocab = fs.readFileSync(VOCAB, 'utf8');
let alt   = fs.readFileSync(ALT, 'utf8');
const fehler = [];
let gesetztMnemo = 0, gesetztAlt = 0;

for (const id of ids){
  const e = neu[id];
  if (typeof e.mnemo === 'string'){
    const r = setzeMnemo(vocab, id, e.mnemo);
    if (r.meldung) fehler.push(r.meldung); else { vocab = r.inhalt; gesetztMnemo++; }
  }
  if (Array.isArray(e.alt) && e.alt.length){
    const r = setzeAlt(alt, id, e.alt);
    if (r.meldung) fehler.push(r.meldung); else { alt = r.inhalt; gesetztAlt++; }
  }
}

console.log(`erste Stelle (mnemo): ${gesetztMnemo} gesetzt`);
console.log(`Alternativen:         ${gesetztAlt} Bloecke gesetzt`);
if (fehler.length){
  console.log('\n⛔ NICHT gesetzt:');
  fehler.forEach(f => console.log('  ' + f));
}

if (nurZeigen){
  console.log('\n--pruefen: nichts geschrieben.');
  process.exit(fehler.length ? 2 : 0);
}

/* ⚠️ Erst schreiben, wenn NICHTS gescheitert ist. Eine halb eingespielte Runde
   waere der schlimmste Zustand: ein Teil der Woerter neu, der Rest alt, und
   niemand wuesste hinterher, welche. */
if (fehler.length){
  console.log('\n⛔ Nichts geschrieben — erst die Meldungen oben beheben.');
  process.exit(2);
}

fs.writeFileSync(VOCAB, vocab);
fs.writeFileSync(ALT, alt);
console.log('\n✅ Geschrieben. Jetzt pflicht: node --check auf beide Dateien und node pruefe-eselsbruecken.js');
