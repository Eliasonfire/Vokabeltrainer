// Einstellungen: die Zahl im Kopf einer Gruppe ist die Zahl ihrer Zeilen.
// Unverändert aus Talib (cf488a8) übernommen, 24.11.2026. Elias zur Liste der Unterschiede: „übernimm das in
// beiden apps also russich und arabisch“.
//
// Der Anlass: Die Zahlen standen fest im Markup und stimmten in vier von neun Gruppen nicht mehr.
// Geprüft wird zaehleEinstGruppen() aus js/einstellungen.js (ohne Browser, mit nachgestellten Elementen):
//   - gezählt werden die Zeilen der Gruppe, nichts anderes (kein aufklappbarer Kasten, kein Hinweis)
//   - eine ausgeblendete Zeile zählt nicht (Attribut hidden oder Klasse hidden)
//   - eine zugeklappte Gruppe behält ihre Zahl
//   - renderSettings() ruft die Zählung
// Aufruf: node test-einst-gruppen.mjs            (prüft js/einstellungen.js)
//         node test-einst-gruppen.mjs <Datei>    (prüft eine andere Fassung, für die Störprobe)
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = dirname(fileURLToPath(import.meta.url));
const quelle = readFileSync(process.argv[2] || join(HIER, 'js', 'einstellungen.js'), 'utf8');
const a = quelle.indexOf('function zaehleEinstGruppen(){'), b = quelle.indexOf('\n}\n', a);
if (a < 0) { console.log('FEHLER: zaehleEinstGruppen wurde nicht gefunden'); process.exit(1); }

let fehler = 0;
const pruefe = (ok, text) => { if (ok) console.log('  ok  ' + text); else { console.log('  FEHLER  ' + text); fehler++; } };

const kind = (klassen, hidden = false) => ({ hidden, classList: { contains: k => klassen.includes(k) } });
function gruppe(id, kinder, zu = false){
  const zahl = { textContent: '99' };
  const inhalt = { children: kinder, classList: { contains: k => zu && k === 'hidden' } };
  const knopf = { id, getAttribute: n => (n === 'aria-controls' ? 'inhalt-' + id : null), querySelector: s => (s === '.einst-gruppe-zahl' ? zahl : null) };
  return { knopf, inhalt, zahl };
}
const gruppen = [
  gruppe('drei', [kind(['setting-row']), kind(['setting-row', 'setting-row-block']), kind(['setting-row'])]),
  gruppe('gemischt', [kind(['setting-row']), kind(['hinweis']), kind(['einklapp']), kind(['setting-row'])]),
  gruppe('versteckt', [kind(['setting-row']), kind(['setting-row'], true), kind(['setting-row', 'hidden'])]),
  gruppe('zu', [kind(['setting-row']), kind(['setting-row'])], true),
  gruppe('leer', [])
];
const document = {
  querySelectorAll: s => (s === '.einst-gruppe' ? gruppen.map(g => g.knopf) : []),
  getElementById: id => { const g = gruppen.find(x => 'inhalt-' + x.knopf.id === id); return g ? g.inhalt : null; }
};
new Function('document', quelle.slice(a, b + 2) + '\nzaehleEinstGruppen();')(document);
const z = id => gruppen.find(g => g.knopf.id === id).zahl.textContent;

pruefe(z('drei') === '3', 'drei Zeilen: im Kopf steht 3');
pruefe(z('gemischt') === '2', 'ein Hinweis und ein aufklappbarer Kasten zählen nicht (2)');
pruefe(z('versteckt') === '1', 'ausgeblendete Zeilen zählen nicht, weder mit Attribut noch mit Klasse (1)');
pruefe(z('zu') === '2', 'eine zugeklappte Gruppe behält ihre Zahl (2)');
pruefe(z('leer') === '0', 'eine Gruppe ohne Zeile zeigt 0');

const zeichnen = quelle.slice(quelle.indexOf('function renderSettings(){'), quelle.indexOf('\n}\n', quelle.indexOf('function renderSettings(){')));
pruefe(zeichnen.includes('zaehleEinstGruppen();'), 'renderSettings() ruft die Zählung');

console.log(fehler ? `\n${fehler} FEHLER` : '\nAlles in Ordnung.');
process.exit(fehler ? 1 : 0);
