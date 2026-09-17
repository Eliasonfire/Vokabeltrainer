/* test-gedaechtnis-spiegel.mjs — prüft werkzeuge/gedaechtnis-spiegel.mjs (17.09.2026)
 *
 *   node test-gedaechtnis-spiegel.mjs
 *
 * Schreibt den Spiegel in einen Wegwerf-Ordner (nie in den Vault) und prüft:
 * vollständig (jede Regel, Karte, jeder Fachbegriff, jedes Lernwort), jede
 * Notiz unter 1,4 MB, KEINE Buchvokabel von arabicroots (AGB), und dass
 * `--pruefen` eine veränderte Notiz wirklich rot meldet (eingebauter Störtest).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.dirname(fileURLToPath(import.meta.url));
const ZIEL = fs.mkdtempSync(path.join(os.tmpdir(), 'spiegel-test-'));
let fehler = 0;
const ok = (bed, was) => { console.log((bed ? '  ok   ' : '  FEHLER ') + was); if (!bed) fehler++; };
const lauf = (...args) => {
  try { execFileSync(process.execPath, [path.join(REPO, 'werkzeuge', 'gedaechtnis-spiegel.mjs'), ...args],
    { env: Object.assign({}, process.env, { SPIEGEL_ZIEL: ZIEL }), stdio: 'pipe' }); return 0; }
  catch (e){ return e.status || 1; }
};

try {
  ok(lauf() === 0, 'Spiegel wird erzeugt');
  const lies = n => { const p = path.join(ZIEL, n); return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : ''; };
  const namen = ['00 Übersicht.md', 'Regeln.md', 'Regelsammlung.md', 'Fachbegriffe.md', 'Lernwörter.md', 'Sätze.md', 'Wortfelder.md'];
  ok(namen.every(n => fs.existsSync(path.join(ZIEL, n))), 'alle 7 Notizen da');
  ok(fs.readdirSync(ZIEL).every(n => fs.statSync(path.join(ZIEL, n)).size < 1400 * 1024), 'jede Notiz unter 1,4 MB');

  const k = { window: {}, console: { log(){}, warn(){} }, document: { addEventListener(){} } }; k.globalThis = k; vm.createContext(k);
  for (const d of ['vocab-data.js', 'grammar-data.js', 'regelsammlung-data.js', 'data/fachbegriffe.js'])
    vm.runInContext(fs.readFileSync(path.join(REPO, d), 'utf8'), k);
  const hol = n => vm.runInContext(n, k);
  const regeln = lies('Regeln.md'), sammlung = lies('Regelsammlung.md'), fach = lies('Fachbegriffe.md'), lern = lies('Lernwörter.md');
  const R = hol('GRAMMAR_RULES'), K = hol('FOLGE19_KARTEN'), F = hol('FACHBEGRIFF_VOKABELN'), V = hol('VOCAB_DATA');
  ok(R.every(r => regeln.includes('`' + r.id + '`')), 'jede der ' + R.length + ' Regeln steht in Regeln.md');
  ok(K.every(c => sammlung.includes('`' + c.id + '`')), 'jede der ' + K.length + ' Karten steht in Regelsammlung.md');
  ok(F.every(w => fach.includes('### ' + w.ar + ' — ')), 'jeder der ' + F.length + ' Fachbegriffe steht in Fachbegriffe.md');
  ok(V.every(w => lern.includes('### ' + w.ar + ' — ')), 'jedes der ' + V.length + ' Lernwörter steht in Lernwörter.md');

  /* ⛔ Keine Buchvokabel: jedes Wort aus data/vokabeln-*.js, das NICHT auch Lernwort/Fachbegriff/eigenes Wort ist,
     darf nirgends als Eintrag „### ar — de" stehen. */
  const fenster = {};
  const buchDateien = fs.readdirSync(path.join(REPO, 'data')).filter(f => /^vokabeln-.*\.js$/.test(f));
  for (const f of buchDateien) new Function('window', fs.readFileSync(path.join(REPO, 'data', f), 'utf8'))(fenster);
  const erlaubt = new Set(V.map(w => w.ar).concat(F.map(w => w.ar),
    (JSON.parse(fs.readFileSync(path.join(REPO, 'data', 'eigene-woerter.json'), 'utf8')).woerter || []).map(w => w.ar)));
  const alles = namen.map(lies).join('\n');
  const buch = Object.values(fenster.VOKABELN || {}).flat().filter(w => w && w.ar && !erlaubt.has(w.ar));
  if (!buchDateien.length) console.log('  hinw  keine Buchdateien auf dieser Platte — AGB-Prüfung übersprungen');
  else {
    const enthaeltBuch = text => buch.some(w => text.includes('### ' + w.ar + ' — ' + w.de));
    ok(!enthaeltBuch(alles), 'keine der ' + buch.length + ' Buchvokabeln steht als Eintrag im Spiegel');
    ok(enthaeltBuch(alles + '\n### ' + buch[0].ar + ' — ' + buch[0].de + '\n'), 'Gegenprobe: eine eingeschmuggelte Buchvokabel wird erkannt');
  }

  ok(lauf('--pruefen') === 0, '--pruefen: frisch erzeugt → grün');
  ok(lauf() === 0 && lauf('--pruefen') === 0, 'zweiter Lauf schreibt nur Unverändertes, bleibt grün');
  /* Störtest: eine Regel aus der Notiz streichen → --pruefen muss rot werden */
  fs.writeFileSync(path.join(ZIEL, 'Regeln.md'), regeln.replace('`' + R[0].id + '`', '`weg`'));
  ok(lauf('--pruefen') === 1, 'Störtest: veränderte Regeln.md → --pruefen rot');
} finally {
  fs.rmSync(ZIEL, { recursive: true, force: true });
}
console.log(fehler ? '\n⛔ ' + fehler + ' Fehler' : '\n✅ Gedächtnis-Spiegel geprüft.');
process.exit(fehler ? 1 : 0);
