#!/usr/bin/env node
/* abendlisten.mjs — welche Wörter stehen IMMER WIEDER auf seinen Abendlisten?
 * ==========================================================================
 *
 * Elias am 24.09.2026: „wenn ich karteikarten am abend mir angucke dann
 * schreibe ich mir die nochmals seperat heraus die ich wirklich nciht konnte
 * bzw noch übung brauchen und genau das sind diese notizen. das mache ich
 * täglich. das bietet dir nochmals vielleicht einen einblick" — und auf den
 * Vorschlag, die Wartung lese mit und prüfe bei wiederkehrenden Wörtern
 * Eselsbrücke und Beispielsatz besonders gründlich: „ja klingt gut".
 *
 * Liest data/abendlisten.json (Datum, sein Wort, Kennung der Karte) und zeigt:
 *   · wie oft jedes Wort vorkam, an welchen Abenden,
 *   · die Wörter, die MEHR ALS EINMAL vorkommen — mit dem Stand ihrer
 *     Eselsbrücken (data/eselsbruecken.js) und ihres Beispielsatzes. Genau dort
 *     prüft die Wartung gründlich; seine eigenen Eselsbrücken werden nie
 *     überschrieben.
 * Neue Listen meldet `node werkzeuge/export-index.mjs --sicherung --abendlisten`;
 * die Wartung liest sie (gerendert, nicht geraten) und trägt sie in die JSON ein.
 *
 * Exit 0 = gelesen · 1 = Datei fehlt oder ist kaputt.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let daten;
try { daten = JSON.parse(fs.readFileSync(path.join(REPO, 'data', 'abendlisten.json'), 'utf8')); }
catch (e){ console.log('⛔ data/abendlisten.json fehlt oder ist kaputt: ' + e.message); process.exit(1); }

const ctx = vm.createContext({ window: {} });
let code = '';
for (const f of ['vocab-data.js', 'data/beispielsaetze.js', 'data/eselsbruecken.js'])
  try { code += fs.readFileSync(path.join(REPO, f), 'utf8') + '\n;\n'; } catch (e){}
code += 'globalThis.__D = { V: typeof VOCAB_DATA !== "undefined" ? VOCAB_DATA : [], B: typeof BEISPIELSAETZE !== "undefined" ? BEISPIELSAETZE : {}, E: typeof ESELSBRUECKEN !== "undefined" ? ESELSBRUECKEN : null };';
try { vm.runInContext(code, ctx); } catch (e){ console.log('⚠️ Daten nicht ganz geladen: ' + e.message); }
const D = ctx.__D || { V: [], B: {}, E: null };

const norm = s => String(s || '').toLowerCase().replace(/[„“"?!.()]/g, '').replace(/\s+/g, ' ').trim();
const gruppen = new Map();
let anzahl = 0;
for (const l of daten.listen || []) for (const w of l.woerter || []){
  anzahl++;
  const k = w.id ? 'id:' + w.id : 'de:' + norm(w.wort);
  if (!gruppen.has(k)) gruppen.set(k, { wort: w.wort, id: w.id, abende: [], zuordnung: w.zuordnung });
  gruppen.get(k).abende.push(l.datum);
}
console.log(`${(daten.listen || []).length} Abendlisten · ${anzahl} Einträge · ${gruppen.size} verschiedene Wörter · ohne sichere Karte: ${[...gruppen.values()].filter(g => g.zuordnung !== 'sicher').length}`);
const mehrfach = [...gruppen.values()].filter(g => g.abende.length > 1).sort((a, b) => b.abende.length - a.abende.length);
if (!mehrfach.length){
  console.log('Kein Wort steht auf mehr als einer Liste.');
} else {
  console.log(`\nMehrfach (${mehrfach.length}) — hier Eselsbrücke und Beispielsatz gründlich prüfen:`);
  for (const g of mehrfach){
    const v = D.V.find(x => String(x.id) === String(g.id));
    const satz = (D.B[g.id] && D.B[g.id].sentAr) || (v && v.sentAr) ? 'Beispielsatz da' : 'KEIN Beispielsatz';
    const esel = D.E && g.id && D.E[g.id] ? `${[].concat(D.E[g.id]).length} Eselsbrücke(n)` : 'Eselsbrücken: nicht gefunden';
    console.log(`  ${g.abende.length}× „${g.wort}" (${g.id || 'keine Karte'}) · ${g.abende.join(', ')} · ${satz} · ${esel}`);
  }
}
process.exit(0);
