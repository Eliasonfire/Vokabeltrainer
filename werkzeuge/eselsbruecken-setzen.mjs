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

/* ---------- data/eselsbruecken.js: die erste Stelle für eine BUCHVOKABEL ----

   ⛔⛔ OHNE DAS KANN DIESES WERKZEUG FÜR EIN NEUES WORT GAR NICHTS.
   Bis zum 20.08.2026 kannte es zwei Ziele, und beide brauchen einen
   VORHANDENEN Anker: die `"id": "<id>",`-Zeile in vocab-data.js (die gibt es
   nur für die 171 Lernwörter) und den Block `'<id>': [` in
   eselsbruecken-alt.js (den gibt es nur, wo schon eine Alternative steht).

   Für die acht Wörter aus madina-1 Kapitel 13 — also genau das, was die
   Wartung beim nächsten Freischalten bearbeiten soll — findet es keinen von
   beiden und schreibt NICHTS. Punkt A6 des vollen Programms hätte damit
   keinen Automatikweg gehabt, und die Routine hätte von Hand in die Datei
   geschrieben: ohne diese Maskierung, ohne die Zeilenende-Messung.
   [[werkzeug_ohne_aufrufer]]

   ⚠️ Warum eine dritte Datei und nicht einfach vocab-data.js: dort hängt
   LERNBESTAND_IDS dran und steuert die Freischaltung. Ein neuer Eintrag hätte
   die Nebenwirkung, dass das Wort als „kennt er schon" gilt — das verschiebt
   Elias' Lernstand. Der Kopf von data/eselsbruecken.js sagt das selbst. */
function setzeBuch(inhalt, id, text){
  const ze = zeilenende(inhalt);
  const zeilen = inhalt.split(/\r?\n/);
  const suche = new RegExp('^\\s*"' + id + '"\\s*:');
  const i = zeilen.findIndex(z => suche.test(z));
  if (i >= 0){
    /* Vorhandenen Eintrag ersetzen. Ein Eintrag kann über mehrere Zeilen
       gehen — bis zur nächsten id-Zeile oder zur schließenden Klammer. */
    let ende = i;
    for (let j = i + 1; j < zeilen.length; j++){
      if (/^\s*"\d+"\s*:/.test(zeilen[j]) || /^\s*\};?\s*$/.test(zeilen[j])) break;
      ende = j;
    }
    const einzug = zeilen[i].match(/^\s*/)[0];
    zeilen.splice(i, ende - i + 1, `${einzug}"${id}": ${JSON.stringify(text)},`);
    return { inhalt: zeilen.join(ze), meldung: null, neu: false };
  }
  /* Neu anlegen — ans Ende des Objekts, vor die schließende Klammer.
     ⛔ Die LETZTE `};` im Objekt suchen, nicht die erste im ganzen Text: davor
     stehen Kommentare mit geschweiften Klammern. */
  const iObj = zeilen.findIndex(z => /const BUCH_ESELSBRUECKEN\s*=\s*\{/.test(z));
  if (iObj < 0) return { inhalt, meldung: `id ${id}: BUCH_ESELSBRUECKEN nicht gefunden` };
  let iZu = -1;
  for (let j = iObj + 1; j < zeilen.length; j++){
    if (/^\};?\s*$/.test(zeilen[j])){ iZu = j; break; }
  }
  if (iZu < 0) return { inhalt, meldung: `id ${id}: BUCH_ESELSBRUECKEN wird nicht geschlossen` };
  /* Ein Komma an die bisher letzte Eintragszeile, falls es fehlt. */
  for (let j = iZu - 1; j > iObj; j--){
    const s = zeilen[j].trim();
    if (!s || s.startsWith('/*') || s.startsWith('*') || s.startsWith('//')) continue;
    if (!s.endsWith(',')) zeilen[j] = zeilen[j].replace(/\s*$/, ',');
    break;
  }
  zeilen.splice(iZu, 0, '', `  "${id}": ${JSON.stringify(text)}`);
  return { inhalt: zeilen.join(ze), meldung: null, neu: true };
}

let vocab = fs.readFileSync(VOCAB, 'utf8');
let alt   = fs.readFileSync(ALT, 'utf8');
const BUCH = path.join(WURZEL, 'data', 'eselsbruecken.js');
let buch = fs.existsSync(BUCH) ? fs.readFileSync(BUCH, 'utf8') : null;
const fehler = [];
let gesetztMnemo = 0, gesetztAlt = 0, gesetztBuch = 0, neuBuch = 0;

for (const id of ids){
  const e = neu[id];
  if (typeof e.mnemo === 'string'){
    const r = setzeMnemo(vocab, id, e.mnemo);
    if (!r.meldung){ vocab = r.inhalt; gesetztMnemo++; }
    else if (buch !== null){
      /* ⭐ Kein Lernwort — dann ist es eine Buchvokabel, und ihre erste
         Eselsbrücke gehört nach data/eselsbruecken.js. Das ist keine
         Notlösung, sondern der vorgesehene Ort. */
      const b = setzeBuch(buch, id, e.mnemo);
      if (b.meldung) fehler.push(b.meldung);
      else { buch = b.inhalt; gesetztBuch++; if (b.neu) neuBuch++; }
    } else fehler.push(r.meldung);
  }
  if (Array.isArray(e.alt) && e.alt.length){
    const r = setzeAlt(alt, id, e.alt);
    if (r.meldung) fehler.push(r.meldung); else { alt = r.inhalt; gesetztAlt++; }
  }
}

console.log(`erste Stelle (mnemo):  ${gesetztMnemo} in vocab-data.js`);
console.log(`erste Stelle (Buch):   ${gesetztBuch} in data/eselsbruecken.js`
  + (neuBuch ? `, davon ${neuBuch} neu angelegt` : ''));
console.log(`Alternativen:          ${gesetztAlt} Bloecke gesetzt`);
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
if (buch !== null && gesetztBuch) fs.writeFileSync(BUCH, buch);
console.log('\n✅ Geschrieben. Jetzt pflicht: node --check auf beide Dateien und node pruefe-eselsbruecken.js');
