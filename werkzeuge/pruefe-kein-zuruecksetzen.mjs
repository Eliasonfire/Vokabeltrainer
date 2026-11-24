// pruefe-kein-zuruecksetzen.mjs — es gibt keinen Knopf, der den ganzen Lernstand auf Box 1 zurücksetzt (24.11.2026).
//
// Elias, 24.11.2026, zu den Einstellungen (in der Talib-Sitzung): „das man den ganzen lernstand wieder auf 0 macht
// also alles auf box 1? das brauchen wir nicht, in keinen meiner apps“ und auf die Frage, ob „Lernfortschritt
// zurücksetzen“ in allen drei Apps raus soll: „Ja, raus“.
//
// Geprüft wird:
//   - kein Element btnResetProgress in index.html
//   - keine Zeile „Lernfortschritt zurücksetzen“ in der Seite (Kommentare zählen nicht)
//   - kein Programm in js/ hängt an btnResetProgress
//   - keine Stelle in js/ leert PROGRESS und setzt danach jede Karte auf Box 1
// Mit Störtest: jede verdorbene Fassung muss rot werden.
// Dieselbe Datei liegt im Vokabeltrainer und im Russisch-Ordner (Pfade relativ zu werkzeuge/).
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = join(dirname(fileURLToPath(import.meta.url)), '..');
const SEITE = readFileSync(join(HIER, 'index.html'), 'utf8').replace(/\r\n/g, '\n');
const JS = readdirSync(join(HIER, 'js')).filter(f => f.endsWith('.js')).sort()
  .map(f => readFileSync(join(HIER, 'js', f), 'utf8')).join('\n').replace(/\r\n/g, '\n');
const ohneKommentar = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/<!--[\s\S]*?-->/g, ' ').replace(/^\s*\/\/.*$/gm, ' ');

function laufe(seiteRoh, jsRoh, still){
  let fehler = 0;
  const pruefe = (ok, text) => { if (!ok) fehler++; if (!still) console.log((ok ? '  ✔ ' : '  ✘ ') + text); };
  const seite = ohneKommentar(seiteRoh);
  const js = ohneKommentar(jsRoh);
  pruefe(!/id="btnResetProgress"/.test(seite), 'kein Knopf btnResetProgress in der Seite');
  pruefe(!/>\s*Lernfortschritt zurücksetzen\s*</.test(seite), 'keine Zeile „Lernfortschritt zurücksetzen“');
  pruefe(!/btnResetProgress/.test(js), 'kein Programm hängt an btnResetProgress');
  pruefe(!/PROGRESS\s*=\s*\{\s*\}\s*;[\s\S]{0,200}box\s*:\s*1/.test(js), 'keine Stelle leert PROGRESS und setzt alle Karten auf Box 1');
  return fehler;
}

console.log('pruefe-kein-zuruecksetzen.mjs — kein Knopf „Lernfortschritt zurücksetzen“\n');
const fehler = laufe(SEITE, JS, false);

console.log('\nStörtest:');
const ZEILE = '<div class="setting-row"><div><div class="setting-title">Lernfortschritt zurücksetzen</div></div>'
  + '<button class="btn btn-secondary" id="btnResetProgress">Zurücksetzen</button></div>';
const HORCHER = "\ndocument.getElementById('btnResetProgress').addEventListener('click', ()=>{\n  PROGRESS = {};\n"
  + "  VOCAB_DATA.forEach(w=>{ PROGRESS[w.id] = { box:1, nextReview: todayStr(0), correct:0, wrong:0 }; });\n});\n";
const stoerungen = [
  ['Zeile mit Knopf zurück', SEITE.replace('</main>', ZEILE + '</main>'), JS],
  ['Horcher zurück', SEITE, JS + HORCHER],
  ['nur das Leeren, ohne Knopf', SEITE, JS + "\nfunction weg(){ PROGRESS = {}; VOCAB_DATA.forEach(w=>{ PROGRESS[w.id] = { box: 1 }; }); }\n"]
];
let alleRot = true;
for (const [name, s, j] of stoerungen){
  if (s === SEITE && j === JS){ alleRot = false; console.log('  ✘ ' + name + ' — Störung griff nicht'); continue; }
  const r = laufe(s, j, true);
  if (r > 0) console.log('  ✔ ' + name + ' → ' + r + ' rot');
  else { alleRot = false; console.log('  ✘ ' + name + ' → blieb grün'); }
}
console.log('');
console.log(!fehler && alleRot ? '✔ kein Zurücksetzen, jede Störung erkannt (' + stoerungen.length + ')'
  : '✘ ' + fehler + ' gescheitert' + (alleRot ? '' : ', mindestens eine Störung unbemerkt'));
process.exit(!fehler && alleRot ? 0 : 1);
