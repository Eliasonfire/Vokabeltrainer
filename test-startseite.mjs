/* test-startseite.mjs — Startseite aufgeräumt (24.11.2026, aus Talib 41456dd; dessen Prüfer hängt an der Tour,
   die es hier nicht gibt, darum ein eigener). Elias zur Liste der Unterschiede: „startbildschirm … sollst du
   übernehmen“.
   Geprüft: die Auswahl steht zugeklappt hinter „Du lernst … Ändern“, Tagesziel und Listen hinter „Dein
   Fortschritt im Einzelnen“; renderStartWahl() wird aus js/start.js GESCHNITTEN und ausgeführt; sie wird von
   renderHome(), renderBuchChips() und renderChapterFilterChips() gerufen. Mit Störtest. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const W = path.dirname(fileURLToPath(import.meta.url));
const HTML = fs.readFileSync(path.join(W, 'index.html'), 'utf8');
const START = fs.readFileSync(path.join(W, 'js', 'start.js'), 'utf8');
const BUECHER = fs.readFileSync(path.join(W, 'js', 'buecher.js'), 'utf8');

const schneide = (text, name) => {
  const a = text.indexOf('function ' + name + '(');
  if (a < 0) return null;
  let i = text.indexOf('{', a), t = 0;
  for (; i < text.length; i++){ if (text[i] === '{') t++; else if (text[i] === '}'){ t--; if (!t) return text.slice(a, i + 1); } }
  return null;
};

function laufe(html, start, buecher, still){
  let schlecht = 0;
  const pruefe = (was, ok, gemessen) => { if (!ok) schlecht++; if (!still) console.log((ok ? '  ✔ ' : '  ✘ ') + was + (ok ? '' : '   gemessen: ' + gemessen)); };
  const a = html.indexOf('id="screen-home"'), e = html.indexOf('<section', a + 10);
  const home = html.slice(a, e);
  const wahl = home.indexOf('<details class="start-wahl" id="startWahl">'), wahlZu = home.indexOf('</details>', wahl);
  pruefe('Buch- und Kapitelknöpfe stehen in der Klappe „Du lernst“',
    wahl > 0 && home.indexOf('id="bookFilterChips"') > wahl && home.indexOf('id="chapterFilterChips"') < wahlZu, wahl + '/' + wahlZu);
  pruefe('die Zeile hat „Du lernst“, den Wert und „Ändern“/„Fertig“',
    /<span class="sw-kopf">Du lernst<\/span>\s*<span class="sw-wert" id="startWahlText"><\/span>/.test(home) && /<span class="sw-zu">Ändern<\/span><span class="sw-auf">Fertig<\/span>/.test(home), 'fehlt');
  const mehr = home.indexOf('<details class="start-mehr" id="startFortschritt">');
  pruefe('Tagesziel, Wochenquote und Listen stehen hinter „Dein Fortschritt im Einzelnen“',
    mehr > home.indexOf('id="statsGrid"') && ['uebungskalender', 'wochenquote', 'regelStand', 'uebungStand'].every(id => home.indexOf('id="' + id + '"') > mehr)
    && home.includes('<span class="sm-name">Dein Fortschritt im Einzelnen</span>'), mehr);
  pruefe('Kacheln, Boxen und Kennzahlen bleiben offen sichtbar',
    ['home-grid', 'boxOverview', 'statsGrid'].every(n => { const i = home.indexOf(n); return i > wahlZu && i < mehr; }), 'verschoben');
  pruefe('Stil-Schicht „Startseite aufgeräumt“ steht im Stylesheet', html.includes('Stil-Schicht · Startseite aufgeräumt'), 'fehlt');

  const fn = schneide(start, 'renderStartWahl');
  pruefe('renderStartWahl() steht in js/start.js', !!fn, 'fehlt');
  if (fn){
    const zeile = (buecherListe, karte, eigene) => {
      const ziel = { innerHTML: '' };
      const c = { document: { getElementById: id => id === 'startWahlText' ? ziel : null },
        aktiveBuecher: () => buecherListe, kapitelAuswahl: s => karte[s] || [], buchTitel: s => ({ 'madina-1': 'Madina 1', 'madina-2': 'Madina 2', 'byd-1': 'Bayna Yadayk 1' }[s] || s),
        escapeHtml: s => s, SETTINGS: { eigeneGewaehlt: eigene } };
      vm.createContext(c);
      vm.runInContext(fn + '\nrenderStartWahl();', c);
      return ziel.innerHTML.replace(/<[^>]+>/g, '');
    };
    pruefe('ein Buch, alle Kapitel', zeile(['madina-1'], {}, false) === 'Madina 1 · alle Kapitel', zeile(['madina-1'], {}, false));
    pruefe('ein Buch, drei Kapitel, mit Eigenen', zeile(['madina-1'], { 'madina-1': [17, 18, 19] }, true) === 'Madina 1 · 3 Kapitel · Eigene', zeile(['madina-1'], { 'madina-1': [17, 18, 19] }, true));
    pruefe('zwei Bücher mit Auswahl', zeile(['madina-1', 'byd-1'], { 'byd-1': [4] }, false) === 'Madina 1, Bayna Yadayk 1 · ausgewählte Kapitel', zeile(['madina-1', 'byd-1'], { 'byd-1': [4] }, false));
    pruefe('drei Bücher: nur die Zahl', zeile(['madina-1', 'madina-2', 'byd-1'], {}, false) === '3 Bücher · alle Kapitel', zeile(['madina-1', 'madina-2', 'byd-1'], {}, false));
  }
  pruefe('renderHome() ruft sie', /renderStartWahl\(\);/.test(schneide(start, 'renderHome') || ''), 'fehlt');
  pruefe('renderChapterFilterChips() ruft sie', /renderStartWahl\(\);/.test(schneide(start, 'renderChapterFilterChips') || ''), 'fehlt');
  pruefe('renderBuchChips() ruft sie', /renderStartWahl\(\);/.test(schneide(buecher, 'renderBuchChips') || ''), 'fehlt');
  return schlecht;
}

console.log('test-startseite.mjs — Startseite aufgeräumt\n');
const schlecht = laufe(HTML, START, BUECHER, false);
console.log('\nStörtest:');
let alleRot = true;
for (const [name, h, s, b] of [
  ['Auswahl nicht mehr zugeklappt', HTML.replace('<details class="start-wahl" id="startWahl">', '<div class="start-wahl" id="startWahl">'), START, BUECHER],
  ['Tagesziel vor der Klappe', HTML.replace('<details class="start-mehr" id="startFortschritt">', '<div id="x"></div>').replace('</section>\n\n    <!-- ============ LEARN', '<details class="start-mehr" id="startFortschritt"></details></section>\n\n    <!-- ============ LEARN'), START, BUECHER],
  ['Grenze drei Bücher weg', HTML, START.replace('if (buecher.length > 2)', 'if (buecher.length > 9)'), BUECHER],
  ['renderHome ruft nicht', HTML, START.replace('  zeigeSerie(getStreak().count);\n  renderStartWahl();', '  zeigeSerie(getStreak().count);'), BUECHER]
]){
  if (h === HTML && s === START && b === BUECHER){ alleRot = false; console.log('  ✘ ' + name + ' — Störung griff nicht'); continue; }
  const n = laufe(h, s, b, true);
  if (n > 0) console.log('  ✔ ' + name + ' → ' + n + ' rot'); else { alleRot = false; console.log('  ✘ ' + name + ' → blieb grün'); }
}
console.log('');
console.log(!schlecht && alleRot ? '✔ alles richtig, jede Störung erkannt' : '✘ ' + schlecht + ' Fehler' + (alleRot ? '' : ', mindestens eine Störung unbemerkt'));
process.exit(!schlecht && alleRot ? 0 : 1);
