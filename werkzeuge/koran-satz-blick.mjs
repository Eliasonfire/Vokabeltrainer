/* koran-satz-blick.mjs — zeigt vorhandene Sätze mit ihren Markierungen (SENTENCE_TAGS), als Vorbild für neue Sätze.
   Aufruf:  node werkzeuge/koran-satz-blick.mjs <ziel.txt> <satzId> [<satzId> …] [--hadha]
   ⚠️ <ziel.txt> gehört in den Zwischenordner (data-ersatz/arbeit/koran-zwischenordner/), nicht ins Repo: die Ausgabe
      enthält Sätze mit Wörtern seiner Buchkarten.
   Satzkennungen wie in satz-lib: Lehrbuch „mb1-28-1", geschriebener Satz „B45968", Lernwort „L45754". */
import fs from 'node:fs';
import path from 'node:path';
import { saetzeLaden, lade, nackt, Z, REPO } from './koran-satz-lib.mjs';
const [ziel, ...rest] = process.argv.slice(2);
const saetze = saetzeLaden();
const TAGS = new Function(fs.readFileSync(path.join(REPO, 'grammar-data.js'), 'utf8') + ';return SENTENCE_TAGS;')();
const tagsVon = id => { const k = id.replace(/^[BL]/, ''); return (TAGS[k] || TAGS[id] || []).map(t => t.ruleId + ' ⟵ ' + t.matchText); };
const aus = [];
const zeige = s => { aus.push(s.id + ' | ' + s.ar + ' | ' + s.de); for (const t of tagsVon(s.id)) aus.push('      ' + t); };
for (const id of rest.filter(a => !a.startsWith('--'))) { const s = saetze.get(id); if (s) zeige(s); else aus.push(id + ' | (nicht gefunden)'); }
if (rest.includes('--hadha')) {
  const HADHA = Z(0x647) + Z(0x630) + Z(0x627), HADHIHI = Z(0x647) + Z(0x630) + Z(0x647);
  for (const [name, start] of [['hadha', HADHA], ['hadhihi', HADHIHI]]) {
    aus.push('--- Sätze aus drei Wörtern, die mit ' + name + ' beginnen (höchstens 4)');
    let n = 0;
    for (const s of saetze.values()) { if (n >= 4) break; if (s.w.length === 3 && nackt(s.w[0].ar) === start) { zeige(s); n++; } }
  }
}
fs.writeFileSync(ziel, aus.join('\n') + '\n', 'utf8');
console.log('Zeilen: ' + aus.length);
