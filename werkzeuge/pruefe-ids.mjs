#!/usr/bin/env node
/* pruefe-ids.mjs — zeigt jedes `getElementById(…).addEventListener(…)` auf ein
 * Element, das es wirklich gibt?
 * ==========================================================================
 *
 *   node werkzeuge/pruefe-ids.mjs
 *   Exitcode 0 = alle Handler hängen an einer echten id, 2 = einer nicht.
 *
 * ⛔⛔ WARUM DAS EINE EIGENE FEHLERKLASSE IST
 *
 * Fehlt die id im Markup, liefert `getElementById` **null**, und die Zeile
 * wirft `TypeError: Cannot read properties of null (reading 'addEventListener')`.
 * Dann stirbt das ganze Modul — und ALLE Handler, die darunter stehen, werden
 * nie registriert. Die App lädt scheinbar normal, aber ein Teil der Knöpfe tut
 * nichts, und die Konsole meldet eine einzige Zeile, die niemand liest.
 *
 * Genau dieselbe Bauart wie der localStorage-Fall vom 19.08.2026: „stirbt in
 * Zeile 2, die Konsole schweigt".
 * [[localstorage_kann_werfen]] [[ausfall_ist_unsichtbar_gebaut]]
 *
 * Ausgelöst wird das nicht durch einen Programmierfehler, sondern durch eine
 * harmlose Umbenennung im Markup — und die passiert beim Umgestalten dauernd.
 *
 * ==========================================================================
 * ⚠️ WAS KEIN BEFUND IST — und warum das keine Handliste ist
 *
 * Nicht jede id steht im Markup. Manche werden zur Laufzeit erzeugt:
 *
 *   js/feier.js:60        el.id = 'feierBuehne';
 *   js/kategorien.js:909  ${feld('wkAr', …)}   →  id="wkAr" in einem Template
 *
 * Statt diese vier auf eine Ausnahmeliste zu setzen (die beim nächsten neuen
 * Element schon wieder falsch wäre), sucht dieses Skript die **Quelle**: eine
 * id gilt als vorhanden, wenn sie im Markup steht ODER im JavaScript erzeugt
 * wird (`el.id = '…'`, `id="…"` in einem Template-Literal, `setAttribute`).
 * [[handliste_neben_echter_quelle]]
 *
 * ⚠️ Und: gemeldet werden nur Stellen mit DIREKT folgendem addEventListener.
 * Ein `if (document.getElementById('x')) …` ist abgesichert und kein Befund.
 * [[kandidatenliste_ist_keine_fehlerliste]]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HIER, '..');

const html = fs.readFileSync(path.join(REPO, 'index.html'), 'utf8');
const imMarkup = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));

const dateien = fs.readdirSync(path.join(REPO, 'js')).filter(f => f.endsWith('.js'));
const quellen = new Map();                 // Datei → Inhalt, einmal lesen
for (const f of dateien) quellen.set(f, fs.readFileSync(path.join(REPO, 'js', f), 'utf8'));

/* Zur Laufzeit erzeugte ids — aus dem Code gelesen, nicht aufgeschrieben. */
const erzeugt = new Set();
for (const t of quellen.values()){
  for (const m of t.matchAll(/\.id\s*=\s*['"]([^'"]+)['"]/g)) erzeugt.add(m[1]);
  for (const m of t.matchAll(/\bid="([^"$]+)"/g)) erzeugt.add(m[1]);
  for (const m of t.matchAll(/setAttribute\(\s*['"]id['"]\s*,\s*['"]([^'"]+)['"]/g)) erzeugt.add(m[1]);
  /* `${feld('wkAr', …)}` — der erste Parameter solcher Bauer ist die id. */
  for (const m of t.matchAll(/\$\{[a-zA-Z]+\(\s*['"]([a-zA-Z][\w-]*)['"]/g)) erzeugt.add(m[1]);
}

console.log('--- ids: hängt jeder Handler an einem echten Element? ---');
console.log('');
console.log('  ' + imMarkup.size + ' ids im Markup, ' + erzeugt.size + ' im JavaScript erzeugt.');

/* ⛔ EICHUNG an einer id, deren Antwort feststeht: der Kopierknopf steht seit
   v275 im Markup. Kommt hier „fehlt" heraus, misst das Skript nichts.
   [[unmoegliche_zahl_ist_ein_geschenk]] */
const EICH = 'btnEinzelnFreiKopieren';
const eichOk = imMarkup.has(EICH);
console.log('  Eichung #' + EICH + ': ' + (eichOk ? '✅ im Markup gefunden' : '⛔ NICHT gefunden'));
if (!eichOk){
  console.log('');
  console.log('⛔ Die Eichung schlägt fehl — dieses Skript misst nicht, was es zu messen behauptet.');
  process.exit(2);
}

let handler = 0;
const befunde = [];
for (const [f, t] of quellen){
  const zeilen = t.split(/\r?\n/);
  for (const m of t.matchAll(/getElementById\(\s*['"]([^'"]+)['"]\s*\)\s*\.?\s*(\n\s*)?\.?addEventListener/g)){
    handler++;
    const id = m[1];
    if (imMarkup.has(id) || erzeugt.has(id)) continue;
    const zeile = t.slice(0, m.index).split(/\r?\n/).length;
    befunde.push({ f, id, zeile, text: (zeilen[zeile - 1] || '').trim().slice(0, 70) });
  }
}

console.log('  ' + handler + ' Handler an einer festen id.');
console.log('');
if (befunde.length){
  console.log('⛔ ' + befunde.length + ' Handler hängen an einer id, die es NIRGENDS gibt:');
  for (const b of befunde)
    console.log('   js/' + b.f + ':' + b.zeile + '  #' + b.id + '\n      ' + b.text);
  console.log('');
  console.log('   Folge: die Zeile wirft TypeError, das Modul stirbt, und JEDER');
  console.log('   Handler darunter wird nie registriert. Die App laedt trotzdem.');
  process.exit(2);
}
console.log('✅ Alle ' + handler + ' Handler haengen an einem Element, das es gibt.');
process.exit(0);
