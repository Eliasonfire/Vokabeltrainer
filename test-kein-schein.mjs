/* test-kein-schein.mjs — kein farbiger Schein mehr im Hintergrund der App (24.11.2026, aus Talib).
   Elias in Talib (5735c85), mit Bild vom Handy: „dieser schimmer ist immer noch da, der soll weg. der soll sich
   dem rest anpassen also entweder schwarz oder weiß je nach einstellung halt“; hier zur Liste der Unterschiede:
   „ja ist gut“.

   Geprüft wird, welche #app-Regel ZULETZT im Stylesheet steht: sie entscheidet, denn alle haben dieselbe
   Gewichtung. Steht dahinter wieder ein Verlauf, ist der Schein zurück. Mit Störtest. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const W = path.dirname(fileURLToPath(import.meta.url));
const HTML = fs.readFileSync(path.join(W, 'index.html'), 'utf8');

function laufe(html, still){
  let schlecht = 0;
  const pruefe = (was, b, gemessen) => { if (!b) schlecht++; if (!still) console.log(b ? '  ✔ ' + was : '  ✘ ' + was + '   gemessen: ' + gemessen); };
  /* nur das Stylesheet im Kopf, ohne Kommentare */
  const css = html.slice(0, html.lastIndexOf('</style>')).replace(/\/\*[\s\S]*?\*\//g, '');
  const regeln = [...css.matchAll(/(^|[}\s])#app\{([^}]*)\}/g)].map(m => m[2]).filter(t => /background\s*:/.test(t));
  const letzte = regeln[regeln.length - 1] || '';
  pruefe('es gibt eine #app-Regel mit Hintergrund', regeln.length > 0, regeln.length);
  pruefe('die letzte #app-Regel setzt nur den Grund (kein Verlauf)', /^\s*background:var\(--bg\);\s*$/.test(letzte), letzte.slice(0, 120));
  pruefe('der Block „Stil-Schicht · Kein Schein“ steht im Stylesheet', html.includes('Stil-Schicht · Kein Schein'), 'fehlt');
  return schlecht;
}

console.log('test-kein-schein.mjs — Hintergrund ohne Schein\n');
const schlecht = laufe(HTML, false);
console.log('\nStörtest:');
let alleRot = true;
for (const [name, h] of [
  /* Verankert am Ende des Blocks, nicht an </style>: seit 24.11.2026 stehen weitere Blöcke dahinter. */
  ['Regel weg', HTML.replace('bleiben. ----- */\n#app{background:var(--bg);}', 'bleiben. ----- */')],
  ['Verlauf zurück', HTML.replace('bleiben. ----- */\n#app{background:var(--bg);}', 'bleiben. ----- */\n#app{background:radial-gradient(ellipse 130% 42% at 50% -4%, rgba(255,23,68,.10), transparent 62%), var(--bg);}')],
  ['danach ein neuer Schein', HTML.replace(/<\/style>(?![\s\S]*<\/style>)/, '#app{background:radial-gradient(red,transparent),var(--bg);}\n</style>')]
]){
  if (h === HTML){ alleRot = false; console.log('  ✘ ' + name + ' — Störung griff nicht'); continue; }
  const n = laufe(h, true);
  if (n > 0) console.log('  ✔ ' + name + ' → ' + n + ' rot'); else { alleRot = false; console.log('  ✘ ' + name + ' → blieb grün'); }
}
console.log('');
console.log(!schlecht && alleRot ? '✔ kein Schein, jede Störung erkannt' : '✘ ' + schlecht + ' gescheitert' + (alleRot ? '' : ', mindestens eine Störung unbemerkt'));
process.exit(!schlecht && alleRot ? 0 : 1);
