/* urteile-uebernehmen.mjs — Elias' Satzmodus-Urteile aus dem Regelprüfungs-
 * Artefakt in grammar-data.js eintragen.
 * ==========================================================================
 *
 *   node werkzeuge/urteile-uebernehmen.mjs <datei-mit-seinem-text>
 *   node werkzeuge/urteile-uebernehmen.mjs <datei> --pruefen   nur messen
 *
 * Die Datei enthält den Text, den er aus dem Artefakt kopiert hat:
 *
 *     Satzmodus — 30 von 100 beurteilt
 *
 *     DRIN (21):
 *       ismul-isara-hadha-01
 *       ta-marbuta-fem-01  — seine Notiz steht hinter dem Gedankenstrich
 *     RAUS (9):
 *       hadha-stummes-alif-01
 *
 * ================== ⛔ SEINE AUFLAGE, DIE ÜBER ALLEM STEHT =================
 *
 * Elias am 26.08.2026, bei schams-qamar-01 — und die Auflage stand bei EINER
 * Regel und gilt für alle:
 *
 *   „diese und all die anderen regeln sollen nicht gelöscht werden, nur aus
 *    der app raus genommen werden weil ich sie bereits kenne oder unnötig
 *    sind"
 *
 * „raus" heißt deshalb `ausgeblendet: true`, NIEMALS löschen. Die Regel bleibt
 * mit ihrem Unterrichtsbeleg in den Daten stehen und kann jederzeit zurück.
 * [[schweigen_ist_kein_auftrag]]
 *
 * ================== ⛔ IN BEIDE RICHTUNGEN LESEN ==========================
 *
 * Am 26.08.2026 stand `ta-marbuta-fem-01` auf `ausgeblendet` UND in seiner
 * DRIN-Liste. Nur die RAUS-Liste abzuarbeiten hätte diese Änderung still
 * verschluckt — die Regel wäre unsichtbar geblieben, obwohl er sie
 * ausdrücklich zurückgeholt hat. Die Differenz zweier Suchen ist der Befund,
 * nicht die eine Liste. [[ersetzung_zwei_suchen]]
 *
 * ================== ⛔ ZWEI SCHREIBWEISEN IN DERSELBEN DATEI ==============
 *
 * 89 Regeln stehen in grammar-data.js als `id: "…"`, elf als `"id": "…"`
 * (JSON-Stil). Ein Skript, das nur die erste Form kennt, findet
 * possessiv-endungen-01 nicht und bricht ab. [[ein_weg_geht_der_andere_nicht]]
 *
 * ⚠️ Geschrieben wird ERST AM ENDE. Bricht das Skript in der Mitte ab, ist die
 * Datei unverändert — nicht halb bearbeitet.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATEN = path.join(REPO, 'grammar-data.js');

const ARG = process.argv.slice(2);
const QUELLE = ARG.find(a => !a.startsWith('--'));
const NUR_MESSEN = ARG.includes('--pruefen');

if (!QUELLE) {
  console.error('Aufruf: node werkzeuge/urteile-uebernehmen.mjs <datei> [--pruefen]');
  console.error('Die Datei enthält den Text, den Elias aus dem Artefakt kopiert hat.');
  process.exit(1);
}
if (!fs.existsSync(QUELLE)) { console.error('Datei nicht gefunden: ' + QUELLE); process.exit(1); }

/* ⛔ split(/\r?\n/): eine aus Windows kopierte Datei trägt \r, und jedes
   Muster mit $ läuft dann ins Leere. [[zeilenende_r_bricht_muster]] */
const zeilen = fs.readFileSync(QUELLE, 'utf8').split(/\r?\n/);

/* ---------- Lesen: Blockweise, mit den Notizen ---------- */
const listen = { drin: [], aendern: [], raus: [] };
let block = null;
const notizen = new Map();
for (const z of zeilen) {
  const kopf = z.match(/^\s*(DRIN|AENDERN|ÄNDERN|RAUS)\s*\(\d+\)\s*:/i);
  if (kopf) { block = kopf[1].toUpperCase().replace('ÄNDERN', 'AENDERN').toLowerCase(); continue; }
  if (/^\s*(—|-){3}/.test(z)) { block = null; continue; }   // Trennlinie
  if (!block) continue;
  const m = z.match(/^\s+([a-z0-9-]+-\d+)\s*(?:—|--|–)?\s*(.*)$/i);
  if (!m) continue;
  listen[block].push(m[1]);
  if (m[2] && m[2].trim()) notizen.set(m[1], m[2].trim());
}

const gesamt = listen.drin.length + listen.aendern.length + listen.raus.length;
if (!gesamt) {
  console.error('⛔ Keine Urteile erkannt. Erwartet werden Blöcke wie "DRIN (21):" mit');
  console.error('   eingerückten Regel-Ids darunter. Datei geprüft: ' + QUELLE);
  process.exit(2);
}
console.log('Gelesen: ' + listen.drin.length + ' drin · ' + listen.aendern.length
  + ' ändern · ' + listen.raus.length + ' raus   (' + notizen.size + ' mit Notiz)');

/* ---------- Stand vorher messen ---------- */
const ctx = { window: {}, document: {}, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(DATEN, 'utf8')
  + '\nglobalThis.__R = GRAMMAR_RULES; globalThis.__T = SENTENCE_TAGS;', ctx);
const R = ctx.__R, T = ctx.__T;
const bekannt = new Set(R.map(r => r.id));
const fehlt = [...listen.drin, ...listen.aendern, ...listen.raus].filter(i => !bekannt.has(i));
if (fehlt.length) {
  console.error('⛔ Unbekannte Regel-Id(s) — nichts geschrieben:\n   ' + fehlt.join('\n   '));
  process.exit(2);
}

const marken = id => { let n = 0; for (const k in T) for (const t of T[k]) if (t.ruleId === id) n++; return n; };
const istAus = id => !!(R.find(r => r.id === id) || {}).ausgeblendet;

const neuRaus = listen.raus.filter(id => !istAus(id));
const zurueck = [...listen.drin, ...listen.aendern].filter(istAus);
let wegfallend = 0;
console.log('\nRaus aus dem Satzmodus (' + neuRaus.length + ' neu von ' + listen.raus.length + '):');
for (const id of neuRaus) { const n = marken(id); wegfallend += n; console.log('  ' + id.padEnd(32) + n + ' Markierung(en)'); }
if (!neuRaus.length) console.log('  (keine — alle standen schon auf ausgeblendet)');
console.log('  ' + 'zusammen'.padEnd(32) + wegfallend);

if (zurueck.length) {
  console.log('\n⭐ Wieder SICHTBAR (stand auf ausgeblendet, steht jetzt in drin/ändern):');
  for (const id of zurueck) console.log('  ' + id.padEnd(32) + marken(id) + ' Markierung(en)');
}

/* ⭐ Seine Notizen sind der wertvollste Teil und gehen sonst verloren —
   sie stehen nur in seinem kopierten Text, in keiner Datei. */
if (notizen.size) {
  console.log('\n📝 Seine Notizen (gehören ins Gedächtnis, nicht in die Daten):');
  for (const [id, n] of notizen) console.log('  ' + id.padEnd(32) + '„' + n + '"');
}

if (NUR_MESSEN) { console.log('\n(nur gemessen, nichts geschrieben)'); process.exit(0); }

/* ---------- Schreiben ---------- */
const roh = fs.readFileSync(DATEN, 'utf8');
const ZE = roh.includes('\r\n') ? '\r\n' : '\n';
let z2 = roh.split(/\r?\n/);

/* Beide Schreibweisen der id-Zeile treffen. */
const zeileVonId = id => z2.findIndex(x =>
  x.includes('id: "' + id + '"') || x.includes("id: '" + id + "'")
  || x.includes('"id": "' + id + '"') || x.includes("'id': '" + id + "'"));

let gesetzt = 0, entfernt = 0;
for (const id of neuRaus) {
  const i = zeileVonId(id);
  if (i < 0) throw new Error('id-Zeile fehlt: ' + id);
  const einzug = (z2[i].match(/^\s*/) || [''])[0];
  z2.splice(i + 1, 0, einzug + 'ausgeblendet: true,   /* Elias: aus dem Satzmodus. NICHT loeschen. */');
  gesetzt++;
}
for (const id of zurueck) {
  const i = zeileVonId(id);
  if (i < 0) throw new Error('id-Zeile fehlt: ' + id);
  for (let k = i; k < Math.min(i + 30, z2.length); k++) {
    if (/^\s*ausgeblendet:\s*true/.test(z2[k])) { z2.splice(k, 1); entfernt++; break; }
  }
}
fs.writeFileSync(DATEN + '.neu', z2.join(ZE), 'utf8');
fs.renameSync(DATEN + '.neu', DATEN);
console.log('\n✅ ' + gesetzt + ' ausgeblendet gesetzt, ' + entfernt + ' wieder sichtbar gemacht.');
console.log('   ⛔ Jetzt: node validate.js · CACHE_NAME hoch · node werkzeuge/veroeffentlichen.mjs --mit-daten');
