/* eiche-fragenreihenfolge.mjs — steht die Frage, die andere erledigt, vorn?
 * ==========================================================================
 *
 * ⛔ DER FUND vom 21.08.2026: Die Fragenseite sortierte nach ANZAHL —
 * pl (25) · root (25) · type (19) · femSg (1). Damit stand `type` HINTER
 * `root`.
 *
 * `data/feld-ausnahmen.js` sagt aber: FELD_REGELN.root.typen = ['particle'],
 * also „ein Partikel hat keine Wurzel". Wer erst die Wurzel beantwortet und
 * danach „Partikel" waehlt, hat eine Frage UMSONST beantwortet — und merkt
 * es nicht einmal, weil nichts die beiden Fragen verbindet.
 *
 * Gemessen: 19 der 70 Fragen haengen so an der type-Frage.
 * ⚠️ Das ist die OBERGRENZE, nicht der Gewinn — es entfaellt nur, was Elias
 * wirklich als Partikel einstuft. [[trefferquote_ohne_preis]]
 *
 * ⭐ Diese Eichung prueft die Reihenfolge an der ECHTEN Ausgabe, nicht an
 * einer nachgebauten Sortierfunktion: sie ruft `vorrat.mjs --offene-fragen`
 * auf und liest, was herauskommt. [[vorabpruefung_kennt_ihr_tor_nicht]]
 *
 * Aufruf:  node werkzeuge/eiche-fragenreihenfolge.mjs
 * Exitcode 1 = ein Feld, an dem Regeln haengen, steht hinter einem, das von
 *              ihm abhaengt.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* Die Regeln aus der Sache — aus der echten Datei. */
const kiste = { window: {} };
kiste.globalThis = kiste;
vm.createContext(kiste);
vm.runInContext(fs.readFileSync(path.join(REPO, 'data', 'feld-ausnahmen.js'), 'utf8'),
  kiste, { filename: 'fa' });
const REGELN = vm.runInContext('typeof FELD_REGELN !== "undefined" ? FELD_REGELN : null', kiste);
if (!REGELN){ console.error('⛔ FELD_REGELN nicht gefunden — die Grundlage fehlt.'); process.exit(1); }

/* Welche Felder haengen an der Wortart? */
const abhaengig = Object.entries(REGELN)
  .filter(([, r]) => r && Array.isArray(r.typen) && r.typen.length)
  .map(([f]) => f);
console.log('Felder, deren Regel an der Wortart haengt: ' + abhaengig.join(' · '));

/* Die ECHTE Ausgabe holen. ⛔ vorrat.mjs endet mit Exit 2, wenn etwas offen
   ist — das ist hier der Normalfall. */
const tmp = path.join(os.tmpdir(), 'eiche-fragenreihenfolge.json');
if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
try {
  execFileSync(process.execPath,
    [path.join(REPO, 'werkzeuge', 'vorrat.mjs'), '--offene-fragen', tmp],
    { cwd: REPO, stdio: ['ignore', 'ignore', 'inherit'] });
} catch (e){ if (e.status !== 2){ console.error('vorrat.mjs Exit ' + e.status); process.exit(1); } }
if (!fs.existsSync(tmp)){
  console.log('⚠️ Keine Fragendatei — es ist nichts offen. Nichts zu pruefen.');
  process.exit(0);
}
const fragen = JSON.parse(fs.readFileSync(tmp, 'utf8')).fragen || [];
fs.unlinkSync(tmp);

const reihe = fragen.map(f => f.feld);
console.log('Reihenfolge auf der Seite: ' + reihe.join(' -> '));
console.log('');

let fehler = 0;
const iType = reihe.indexOf('type');
for (const f of abhaengig){
  const i = reihe.indexOf(f);
  if (i < 0) continue;                 /* Feld gar nicht offen */
  if (iType < 0){
    console.log('  ok   ' + f.padEnd(8) + 'die type-Frage ist gar nicht offen — nichts zu ordnen.');
    continue;
  }
  if (iType < i) console.log('  ok   ' + f.padEnd(8) + 'steht hinter „type" (Platz ' + (i+1) + ' nach ' + (iType+1) + ')');
  else { fehler++; console.log('  ⛔   ' + f.padEnd(8) + 'steht VOR „type" (Platz ' + (i+1) + ' vor ' + (iType+1) + ') — Elias beantwortet es womoeglich umsonst.'); }
}

/* Und: sagt die Seite den Zusammenhang auch? */
const seite = path.join(REPO, 'artefakte', 'wartungsfragen.html');
if (fs.existsSync(seite)){
  const h = fs.readFileSync(seite, 'utf8');
  const n = (h.match(/class="folgt"/g) || []).length;
  if (n) console.log('  ok   die Seite nennt den Zusammenhang bei ' + n + ' Wort/Woertern.');
  else { fehler++; console.log('  ⛔   die Seite nennt den Zusammenhang NICHT — die richtige Reihenfolge allein sieht man ihr nicht an.'); }
}

console.log('');
if (fehler){ console.log('⛔ ' + fehler + ' Befund(e).'); process.exit(1); }
console.log('✔ Was andere Fragen erledigen kann, steht vorn — und die Seite sagt es.');
