/* erklaerungen-setzen.mjs — neue shortExplanation-Texte in grammar-data.js
 * eintragen, ohne sie zu tippen.
 * ==========================================================================
 *
 *   node werkzeuge/erklaerungen-setzen.mjs <datei.json>
 *   node werkzeuge/erklaerungen-setzen.mjs <datei.json> --pruefen   nur zeigen
 *
 * Die JSON-Datei ist ein Objekt `{ "regel-id": "neuer Text", … }`. Schlüssel,
 * die mit `_` anfangen, sind Kommentare und werden übersprungen:
 *
 *   { "_warum": "Elias' Urteile vom 26.08.: erklärt nicht die Regel",
 *     "idafa-01": "Mit der إِضافة verbindest du zwei Nomen …" }
 *
 * ================== ⛔ WARUM DER TEXT ÜBER EINE DATEI GEHT =================
 *
 * Deutscher und arabischer Text verliert auf der Kommandozeile seine
 * Maskierung lautlos, und der Befehl meldet trotzdem Erfolg. Am 26.08.2026
 * dreimal an einem Abend erlebt: aus `` `new Date()` `` wurde ein LEERER
 * String, aus `\*\*` wurde `**`. Zwei der drei Fälle meldeten sich nie.
 * [[nutztext_nie_in_shell_strings]]
 *
 * ================== ⛔ DER KERN IST DER ERSTE SATZ =========================
 *
 * Die App zeigt im Regel-Popover nur den **ersten Satz** (`kernSatz()` in
 * js/saetze.js), alles andere liegt hinter „ausführlich". Elias am 26.08.2026
 * zu fünf Regeln: *„erklärt nicht die regel"* — und der gemeinsame Mangel lag
 * nicht im Inhalt, sondern in der REIHENFOLGE: der erste Satz war eine
 * Meta-Aussage („was der Lehrer sagte", „kommt später noch") statt der Regel.
 *
 * ⭐ Dieses Werkzeug zeigt deshalb bei jeder Änderung den Kern VORHER und
 * NACHHER. Wer nur die Länge vergleicht, sieht die eigentliche Verbesserung
 * nicht — und merkt auch nicht, wenn sie ausgeblieben ist.
 *
 * ================== ⛔ ZWEI FALLEN BEIM SCHREIBEN ==========================
 *
 * 1. Ein echter Zeilenumbruch in einem "…"-Literal ist ein SYNTAXFEHLER.
 *    verb-madi-endungen-01 enthält welche (die vierzehn Formen stehen als
 *    Zeilen) — sie müssen als \n geschrieben werden. `node --check` fängt es,
 *    aber erst nachdem die Datei kaputt ist.
 * 2. Der alte Text steht mal in doppelten, mal in einfachen Anführungszeichen.
 *    Beide Formen werden probiert; passt keine EINDEUTIG, bleibt die Regel
 *    unverändert und wird gemeldet.
 *
 * ⚠️ Geschrieben wird erst am Ende, in EINEM Durchgang. Bricht etwas ab, ist
 * die Datei unverändert.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATEN = path.join(REPO, 'grammar-data.js');

const ARG = process.argv.slice(2);
const QUELLE = ARG.find(a => !a.startsWith('--'));
const NUR_ZEIGEN = ARG.includes('--pruefen');

if (!QUELLE) {
  console.error('Aufruf: node werkzeuge/erklaerungen-setzen.mjs <datei.json> [--pruefen]');
  console.error('Die Datei ist ein Objekt { "regel-id": "neuer Text", … }.');
  process.exit(1);
}
if (!fs.existsSync(QUELLE)) { console.error('Datei nicht gefunden: ' + QUELLE); process.exit(1); }
const NEU = JSON.parse(fs.readFileSync(QUELLE, 'utf8'));

/* ---------- Vorher lesen ---------- */
const ctx = { window: {}, document: {}, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(DATEN, 'utf8') + '\nglobalThis.__R = GRAMMAR_RULES;', ctx);
const alt = {};
for (const r of ctx.__R) alt[r.id] = r.shortExplanation;

/* Genau so schneidet die App den Kern (js/saetze.js kernSatz + KERN_BUDGET). */
const kern = s => { const m = /^(.{40,320}?[.!?])\s/.exec(String(s)); return m ? m[1] : String(s).slice(0, 120); };

const roh = fs.readFileSync(DATEN, 'utf8');
const ZE = roh.includes('\r\n') ? '\r\n' : '\n';
let t = roh.split(/\r?\n/).join('\n');
const vorher = t.length;
let gesetzt = 0, uebersprungen = 0;

for (const [id, text] of Object.entries(NEU)) {
  if (id.startsWith('_')) continue;
  if (!(id in alt)) { console.log('⛔ unbekannte Regel: ' + id); uebersprungen++; continue; }
  const a = alt[id];
  const kandidaten = ['"' + a.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"',
                      "'" + a.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'"];
  const A = kandidaten.find(k => t.split(k).length - 1 === 1);
  if (!A) { console.log('⛔ Anker nicht eindeutig für ' + id + ' — unverändert gelassen'); uebersprungen++; continue; }
  const q = A[0];
  const N = q + text.split('\\').join('\\\\').split(q).join('\\' + q).split('\n').join('\\n') + q;
  t = t.split(A).join(N);
  gesetzt++;
  console.log('\n=== ' + id + ' ===');
  console.log('  Länge  ' + a.length + ' -> ' + text.length);
  console.log('  KERN alt : ' + kern(a));
  console.log('  KERN neu : ' + kern(text));
  if (kern(a) === kern(text)) console.log('  ⚠️  Der Kern ist UNVERÄNDERT — in der App sieht Elias dasselbe wie vorher.');
}

if (NUR_ZEIGEN) { console.log('\n(nur geprüft, nichts geschrieben)'); process.exit(0); }
if (!gesetzt) { console.log('\nNichts gesetzt.'); process.exit(2); }
fs.writeFileSync(DATEN + '.neu', t.split('\n').join(ZE), 'utf8');
fs.renameSync(DATEN + '.neu', DATEN);
console.log('\n✅ ' + gesetzt + ' Erklärung(en) gesetzt'
  + (uebersprungen ? ', ' + uebersprungen + ' übersprungen' : '')
  + ' (' + (t.length - vorher >= 0 ? '+' : '') + (t.length - vorher) + ' Zeichen)');
console.log('   ⛔ Jetzt: node --check grammar-data.js · node validate.js · CACHE_NAME hoch');
