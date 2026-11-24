/* test-flaechenfarbe.mjs — die 30 % der Regel 60-30-10 sind wählbar, Vorgabe Nachtblau (24.11.2026).
   Elias, 24.11.2026, zu den Unterschieden zu Talib: „startbildschirm, hören, hot bar, statistik und übung sollst
   du übernehmen. auch die flächenfarben“. In Talib stammt die Wahl von ihm (Commit eb3c51f): „das soll man auch
   übrigens in den einstellungen einstellen können welche farbe jene anteile haben sollen“, „ich glaube nachtblau
   ist etwas besser“. Das Hell/Dunkel aus Talib gibt es hier nicht (Elias: „brauch ich nicht“).

   Nach Talibs test-flaechenfarbe.mjs. Funktionen werden aus dem Quelltext GESCHNITTEN und ausgeführt.
   Am Ende ein Störtest: jede Störung muss mindestens eine Prüfung rot machen. */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const W = path.dirname(fileURLToPath(import.meta.url));
const DAR = fs.readFileSync(path.join(W, 'js/darstellung.js'), 'utf8');
const EINST = fs.readFileSync(path.join(W, 'js/einstellungen.js'), 'utf8');
const HTML = fs.readFileSync(path.join(W, 'index.html'), 'utf8');

function schneide(text, name){
  const a = text.indexOf('function ' + name + '(');
  if (a < 0) return null;
  let i = text.indexOf('{', a), t = 0;
  for (; i < text.length; i++){ if (text[i] === '{') t++; else if (text[i] === '}'){ t--; if (!t) return text.slice(a, i + 1); } }
  return null;
}
const block = (text, start) => { const a = text.indexOf(start); if (a < 0) return null; const e = text.indexOf('];', a); return text.slice(a, e + 2); };

function laufe(dar, einst, html, still){
  let ok = 0, schlecht = 0;
  const pruefe = (was, b, gemessen) => {
    if (b) ok++; else schlecht++;
    if (!still) console.log(b ? '  ✔ ' + was : '  ✘ ' + was + '   gemessen: ' + gemessen);
  };

  /* ---------- 1. Die Liste und das Anwenden ---------- */
  const liste = block(dar, 'const FLAECHEN_FARBEN = ['), vorgabe = (dar.match(/const FLAECHE_VORGABE = '[a-z]+';/) || [])[0], fn = schneide(dar, 'wendeFlaecheAn');
  pruefe('Liste, Vorgabe und wendeFlaecheAn() gefunden', liste && vorgabe && fn, [!!liste, !!vorgabe, !!fn].join(','));
  if (!(liste && vorgabe && fn)) return schlecht;
  const stil = new Map();
  const c = { document: { documentElement: { dataset: {}, style: { setProperty: (k, v) => stil.set(k, v), removeProperty: k => stil.delete(k) } } } };
  vm.createContext(c);
  vm.runInContext(liste + '\n' + vorgabe + '\n' + fn + '\nglobalThis.__ = { FLAECHEN_FARBEN, FLAECHE_VORGABE, wendeFlaecheAn };', c);
  const f = c.__, root = c.document.documentElement;
  pruefe('Vorgabe ist Nachtblau', f.FLAECHE_VORGABE === 'nachtblau', f.FLAECHE_VORGABE);
  pruefe('zur Wahl: Nachtblau, Grau (wie bisher) und Petrol, dazu weitere',
    ['nachtblau', 'grau', 'petrol'].every(id => f.FLAECHEN_FARBEN.some(x => x.id === id)) && f.FLAECHEN_FARBEN.length >= 4,
    f.FLAECHEN_FARBEN.map(x => x.id).join(','));
  pruefe('jede Kennung einmal, jeder Ton eine Farbe oder bei Grau keiner',
    new Set(f.FLAECHEN_FARBEN.map(x => x.id)).size === f.FLAECHEN_FARBEN.length
    && f.FLAECHEN_FARBEN.every(x => x.id === 'grau' ? x.ton === null : /^#[0-9a-f]{6}$/.test(x.ton)), JSON.stringify(f.FLAECHEN_FARBEN));
  pruefe('ohne Wahl gilt Nachtblau', f.wendeFlaecheAn(undefined) === 'nachtblau' && root.dataset.flaeche === 'nachtblau' && stil.get('--fl-ton') === '#1d369c',
    root.dataset.flaeche + ' ' + stil.get('--fl-ton'));
  f.wendeFlaecheAn('petrol');
  pruefe('Petrol setzt Attribut und Ton', root.dataset.flaeche === 'petrol' && stil.get('--fl-ton') === (f.FLAECHEN_FARBEN.find(x => x.id === 'petrol') || {}).ton, root.dataset.flaeche);
  f.wendeFlaecheAn('grau');
  pruefe('Grau nimmt Attribut und Ton weg (das alte Aussehen)', !('flaeche' in root.dataset) && !stil.has('--fl-ton'), JSON.stringify(root.dataset));
  pruefe('unbekannte Wahl → Nachtblau', f.wendeFlaecheAn('quatsch') === 'nachtblau', root.dataset.flaeche);
  pruefe('beim Start sofort angewandt (kein Aufblitzen)', /wendeFlaecheAn\(s\.flaeche \|\| FLAECHE_VORGABE\);/.test(dar), 'fehlt');

  /* ---------- 2. Das Stylesheet ---------- */
  const a = html.indexOf('Stil-Schicht · Flächenfarbe');
  const css = a < 0 ? '' : html.slice(a, html.indexOf('</style>', a));
  pruefe('Block „Stil-Schicht · Flächenfarbe“ steht im Stylesheet', !!css, 'fehlt');
  pruefe('nur mit color-mix (sonst bleibt Grau statt einer leeren Fläche)', /@supports \(color: color-mix\(in srgb, red, blue\)\)\{/.test(css), 'kein @supports');
  const regel = (css.match(/:root\[data-flaeche\]\{([^}]*)\}/) || [])[1] || '';
  const VARS = ['--surface-1', '--surface-2', '--surface-3', '--surface-4', '--border', '--border-strong'];
  pruefe('alle Flächen und Ränder getönt', VARS.every(v => new RegExp(v + ':\\s*color-mix\\(in srgb, #[0-9a-f]{6}, var\\(--fl-ton\\) \\d+%\\);').test(regel)), regel.slice(0, 120));
  pruefe('der Grund (--bg, die 60 %) bleibt unberührt', !/--bg\s*:/.test(css), 'setzt --bg');
  /* Die Grundwerte im Block müssen die Flächen aus dem ersten :root sein. */
  const quelle = (html.match(/:root\{\s*\/\* --- Flächen[\s\S]*?\}/) || [])[0] || '';
  const falsch = VARS.filter(v => {
    const basis = (regel.match(new RegExp(v + ':\\s*color-mix\\(in srgb, (#[0-9a-f]{6})')) || [])[1];
    const echt = (quelle.match(new RegExp(v + ':\\s*(#[0-9a-f]{6})')) || [])[1];
    return !basis || basis !== echt;
  });
  pruefe('die Grundwerte sind die Flächen aus :root', quelle && !falsch.length, falsch.join(',') || 'kein :root');
  const anteil = v => Number((regel.match(new RegExp(v + ':[^;]*var\\(--fl-ton\\) (\\d+)%')) || [])[1]);
  pruefe('höhere Schichten werden stärker getönt',
    anteil('--surface-1') < anteil('--surface-2') && anteil('--surface-2') < anteil('--surface-3') && anteil('--surface-3') < anteil('--surface-4'), 'Reihenfolge');
  pruefe('der Block steht am Ende des Stylesheets (zuletzt gilt)', a > html.indexOf('Stil-Schicht · Vokabelkarte'), 'zu früh');

  /* ---------- 3. Einstellungen ---------- */
  const stelle = html.indexOf('id="flaechenwahl"');
  const umgebung = stelle < 0 ? '' : html.slice(stelle - 900, stelle + 100);
  pruefe('Wahl „Flächenfarbe“ steht unter Aussehen vor der Akzentfarbe',
    stelle > html.indexOf('id="grpInhalt-aussehen"') && stelle < html.indexOf('id="farbwahl"') && /<div class="setting-title">Flächenfarbe<\/div>/.test(umgebung), 'fehlt');
  pruefe('die Erklärung nennt 60-30-10', /60-30-10: 60 % Grund[^<]*30 % Flächen[^<]*10 % Akzent/.test(umgebung), 'fehlt');
  /* Die Zahl im Gruppenkopf zählt die Einstellungen darunter. */
  const grp = html.slice(html.indexOf('id="grpInhalt-aussehen"'), html.indexOf('id="grp-karte"'));
  const zahl = Number((html.match(/Aussehen<\/span><span class="einst-gruppe-zahl">(\d+)</) || [])[1]);
  const zeilen = (grp.match(/class="setting-title"/g) || []).length;
  pruefe('die Zahl am Kopf „Aussehen“ stimmt', zahl === zeilen, zahl + ' gegen ' + zeilen);
  const z = schneide(einst, 'zeichneFlaechenwahl') || '';
  pruefe('ein Tipp speichert die Wahl', /SETTINGS\.flaeche = wendeFlaecheAn\(b\.dataset\.flaeche\);\s*saveSettings\(\);/.test(z), 'fehlt');
  pruefe('die gewählte Fläche ist markiert (aria-checked)', /aria-checked', b\.dataset\.flaeche === jetzt/.test(z), 'fehlt');
  pruefe('renderSettings() zeichnet die Wahl', /zeichneFlaechenwahl\(\);/.test(schneide(einst, 'renderSettings') || ''), 'fehlt');

  if (!still) console.log('\n  ' + ok + ' bestanden, ' + schlecht + ' gescheitert');
  return schlecht;
}

console.log('test-flaechenfarbe.mjs — Flächenfarbe (30 %), aus Talib\n');
const schlecht = laufe(DAR, EINST, HTML, false);

console.log('\nStörtest:');
let alleRot = true;
const STOER = [
  ['Vorgabe Grau statt Nachtblau', DAR.replace("FLAECHE_VORGABE = 'nachtblau'", "FLAECHE_VORGABE = 'grau'"), EINST, HTML],
  ['nicht beim Start angewandt', DAR.replace('wendeFlaecheAn(s.flaeche || FLAECHE_VORGABE);', ''), EINST, HTML],
  ['Grau lässt den Ton stehen', DAR.replace("else { delete r.dataset.flaeche; r.style.removeProperty('--fl-ton'); }", 'else {}'), EINST, HTML],
  ['Block fehlt', DAR, EINST, HTML.replace('Stil-Schicht · Flächenfarbe', 'Stil-Schicht · Weg')],
  ['ein Rand nicht getönt', DAR, EINST, HTML.replace('--border-strong: color-mix(in srgb, #33333a, var(--fl-ton) 34%);', '--border-strong: #33333a;')],
  ['falscher Grundwert', DAR, EINST, HTML.replace('--surface-3: color-mix(in srgb, #1b1b1e, var(--fl-ton) 28%);', '--surface-3: color-mix(in srgb, #1c1c1e, var(--fl-ton) 28%);')],
  ['Zahl am Kopf nicht erhöht', DAR, EINST, HTML.replace('Aussehen</span><span class="einst-gruppe-zahl">4<', 'Aussehen</span><span class="einst-gruppe-zahl">3<')],
  ['Tipp speichert nicht', DAR, EINST.replace('SETTINGS.flaeche = wendeFlaecheAn(b.dataset.flaeche);\n      saveSettings();', 'SETTINGS.flaeche = wendeFlaecheAn(b.dataset.flaeche);'), HTML],
  ['renderSettings ohne Flächenwahl', DAR, EINST.replace("  if (typeof zeichneFlaechenwahl === 'function') zeichneFlaechenwahl();\n", ''), HTML]
];
for (const [name, d, e, h] of STOER){
  if (d === DAR && e === EINST && h === HTML){ alleRot = false; console.log('  ✘ ' + name + ' — Störung griff nicht'); continue; }
  const n = laufe(d, e, h, true);
  if (n > 0) console.log('  ✔ ' + name + ' → ' + n + ' rot');
  else { alleRot = false; console.log('  ✘ ' + name + ' → blieb grün'); }
}
console.log('');
console.log(!schlecht && alleRot ? '✔ alle Prüfungen grün, jede Störung erkannt' : '✘ ' + schlecht + ' gescheitert' + (alleRot ? '' : ', mindestens eine Störung unbemerkt'));
process.exit(!schlecht && alleRot ? 0 : 1);
