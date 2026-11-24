// Lesbarkeit: keine Schrift unter 12 px, Tippflächen mindestens 44 px.
// Aus Talib übernommen (24.11.2026), Elias zur Liste der Unterschiede: „übernimm das in beiden apps also
// russich und arabisch“. Angepasst: der Block darf der letzte im Stylesheet sein; die vier Zeilen von
// Startseite und „Üben“ werden erst geprüft, wenn es sie gibt.
//
// Elias, 23.11.2026, zu den sechs Vorschlägen der Recherche: „ich nehme alle deine vorschläge“.
// Vorschlag 2: gemessen waren auf dem Handy 9,3 / 9,6 / 9,9 / 10 / 11,2 px Schrift und 33 px hohe Knöpfe.
// Die älteren Stil-Regeln bleiben, wie sie sind (Weg zurück); was zu klein war, hebt der Block
// „Stil-Schicht · Lesbarkeit“ in index.html an. Dieser Test liest das Stylesheet und verlangt:
//   - die kleinste Schriftstufe (--fs-xs) ist im Block mindestens 12 px
//   - JEDE Regel mit einer festen Schrift unter 12 px (px oder rem) hat im Block eine Regel, die sie anhebt
//     → wer neu eine kleine Schrift schreibt, macht den Test rot, bis sie im Block steht
//   - im Block selbst steht keine Schrift unter 12 px
//   - im Programm (js/*.js) steht keine feste Schrift unter 12 px
//   - die Tippflächen, die zu klein waren, haben im Block 44 px
//   - eine NEUE niedrige Höhe (unter 44 px) an einem Knopf steht nicht im Stylesheet (Liste der bekannten unten)
// Rechnung: 1 rem = 16 px (Handy; auf Tablet und PC ist alles größer). Werte in em hängen an der Schrift
// ihres Kastens und werden nicht geprüft.
// Aufruf: node test-lesbarkeit.mjs            (prüft index.html und js/*.js)
//         node test-lesbarkeit.mjs <Datei>    (eine andere Fassung von index.html, für die Störprobe)
//         node test-lesbarkeit.mjs --liste    (zeigt die niedrigen Höhen an Knöpfen, zum Nachtragen)
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const LISTE = args.includes('--liste');
const datei = args.find(a => !a.startsWith('--')) || join(HIER, 'index.html');
const seite = readFileSync(datei, 'utf8');

let fehler = 0;
const pruefe = (ok, text, mehr) => {
  if (ok) console.log('  ok  ' + text);
  else { console.log('  FEHLER  ' + text + (mehr !== undefined ? '  → ' + JSON.stringify(mehr) : '')); fehler++; }
};

/* Zeichnungen (SVG): die Schrift steht dort in Einheiten der Zeichnung, nicht in Bildschirm-Pixeln. */
const AUSNAHME_SCHRIFT = ['.eselsbild .eb-t'];
/* Niedrige Höhen an Knöpfen, die es am 23.11.2026 gab und die bleiben dürfen — jede mit Grund. */
const BEKANNT_NIEDRIG = {
  '.switch': 'Schalter, 31 px hoch: die unsichtbare Fläche im Block macht ihn 44 px hoch zum Treffen',
  '.hifz-check': 'Haken der Surenliste, 28 px: unsichtbare Fläche im Block',
  '.fav-stern': 'Stern der Surenliste, 28 px: unsichtbare Fläche im Block',
  '.suche-leer-chip': 'Beispiel der Suche, 42 px: im Block auf 44 px angehoben'
};

// ---- Stylesheet lesen ----
const style = [...seite.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');
const MARKE = 'Stil-Schicht · Lesbarkeit';
const blockAnfang = style.indexOf(MARKE);
/* Im Vokabeltrainer kann der Block der letzte sein; dann endet er mit dem Stylesheet (24.11.2026). */
const naechster = blockAnfang < 0 ? -1 : style.indexOf('/* ----- Stil-Schicht', blockAnfang);
const blockEnde = blockAnfang < 0 ? -1 : (naechster < 0 ? style.length : naechster);
pruefe(blockAnfang >= 0 && blockEnde > blockAnfang, 'der Block „Stil-Schicht · Lesbarkeit“ steht im Stylesheet');

/* Regeln sammeln: [{ sel, text, imBlock }]. Kommentare werden durch Leerzeichen gleicher Länge ersetzt,
   damit die Stellen im Text gleich bleiben. @media wird geöffnet, @keyframes und @font-face übergangen. */
const ohne = style.replace(/\/\*[\s\S]*?\*\//g, k => ' '.repeat(k.length));
const regeln = [];
(function lies(von, bis, breite) {
  let i = von;
  while (i < bis) {
    const auf = ohne.indexOf('{', i);
    if (auf < 0 || auf >= bis) break;
    let tiefe = 1, j = auf + 1;
    while (j < bis && tiefe) { const c = ohne[j]; if (c === '{') tiefe++; else if (c === '}') tiefe--; j++; }
    const kopf = ohne.slice(i, auf).trim();
    if (/^@(media|supports|layer|container)/.test(kopf)) lies(auf + 1, j - 1, true);
    else if (!kopf.startsWith('@')) regeln.push({ sel: kopf, text: ohne.slice(auf + 1, j - 1), imBlock: auf > blockAnfang && auf < blockEnde, breite: !!breite, pos: auf });
    i = j;
  }
})(0, ohne.length, false);
pruefe(regeln.length > 1000, 'das Stylesheet ist gelesen (' + regeln.length + ' Regeln)');

const inPx = wert => {
  const m = String(wert).trim().match(/^(\d*\.?\d+)(px|rem)$/);
  return m ? Number(m[1]) * (m[2] === 'rem' ? 16 : 1) : null;       // null = anderes Maß (em, var, clamp …)
};
const schrift = text => { const m = text.match(/(?:^|;|\s)font-size:\s*([^;]+)/); return m ? inPx(m[1]) : null; };
const teile = sel => sel.split(',').map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
const blockRegeln = regeln.filter(r => r.imBlock);
/* Hebt der Block diesen Selektor an? Die anhebende Regel muss für JEDE Breite gelten (nicht in @media stehen).
   Sie trägt denselben Selektor, wenn die kleine Regel VOR dem Block steht (die spätere gewinnt), sonst einen,
   der auf ihn endet (der wiegt schwerer und gewinnt auch gegen eine spätere Regel). */
const imBlockMit = (sel, test, kleinPos = 0) => blockRegeln.some(r => !r.breite && test(r.text)
  && teile(r.sel).some(s => s.endsWith(' ' + sel) || (s === sel && kleinPos < r.pos)));

// ---- 1. Die kleinste Stufe ----
const stufe = blockRegeln.find(r => teile(r.sel).includes(':root') && /--fs-xs:/.test(r.text));
const stufePx = stufe ? inPx(stufe.text.match(/--fs-xs:\s*([^;]+)/)[1]) : null;
pruefe(stufePx !== null && stufePx >= 12, 'die kleinste Schriftstufe --fs-xs ist im Block mindestens 12 px', stufePx);
const kleineStufen = [];
for (const r of regeln) for (const m of r.text.matchAll(/(--fs-[\w-]+):\s*([^;]+)/g)) {
  const px = inPx(m[2]);
  if (px !== null && px < 12 && !(m[1] === '--fs-xs' && !r.imBlock && stufePx >= 12)) kleineStufen.push(m[1] + ' ' + m[2].trim());
}
pruefe(kleineStufen.length === 0, 'keine andere Schriftstufe liegt unter 12 px', kleineStufen);

// ---- 2. Feste kleine Schrift ----
const offen = [];
let kleinGezaehlt = 0;
for (const r of regeln) {
  const px = schrift(r.text);
  if (px === null || px >= 12) continue;
  for (const sel of teile(r.sel)) {
    if (AUSNAHME_SCHRIFT.includes(sel)) continue;
    kleinGezaehlt++;
    if (r.imBlock) { offen.push('im Block: ' + sel + ' ' + px + 'px'); continue; }
    if (!imBlockMit(sel, t => { const p = schrift(t); return p !== null && p >= 12; }, r.pos)) offen.push(sel + ' ' + px + 'px');
  }
}
pruefe(kleinGezaehlt >= 10, 'die Suche nach kleiner Schrift findet die bekannten Stellen (' + kleinGezaehlt + ')');
pruefe(offen.length === 0, 'jede feste Schrift unter 12 px wird im Block angehoben', offen);

// ---- 3. Im Programm ----
if (datei === join(HIER, 'index.html')) {
  const funde = [];
  for (const name of readdirSync(join(HIER, 'js')).filter(n => n.endsWith('.js'))) {
    const text = readFileSync(join(HIER, 'js', name), 'utf8');
    for (const m of text.matchAll(/font-size:\s*(\d*\.?\d+(?:px|rem))/g)) { const px = inPx(m[1]); if (px !== null && px < 12) funde.push(name + ': ' + m[1]); }
    for (const m of text.matchAll(/fontSize\s*=\s*['"`](\d*\.?\d+(?:px|rem))/g)) { const px = inPx(m[1]); if (px !== null && px < 12) funde.push(name + ': ' + m[1]); }
  }
  pruefe(funde.length === 0, 'im Programm steht keine feste Schrift unter 12 px', funde);
}

// ---- 4. Tippflächen im Block ----
const hoehe = text => { const m = text.match(/(?:^|;|\s)min-height:\s*([^;]+)/); return m ? inPx(m[1]) : null; };
for (const sel of ['.chip-toggle', '.suche-feld input', '.suche-leer-chip', '.pool-schalter'])
  pruefe(imBlockMit(sel, t => (hoehe(t) || 0) >= 44), 'mindestens 44 px hoch: ' + sel);
for (const sel of ['.switch::after', '.fav-stern::after', '.hifz-check::after'])
  pruefe(imBlockMit(sel, t => /(?:^|;|\s)height:\s*44px/.test(t) && /content:/.test(t)), 'unsichtbare Fläche von 44 px: ' + sel);
/* Diese vier Zeilen gehören zu Startseite und „Üben“ aus Talib; im Vokabeltrainer erst geprüft, sobald es sie gibt. */
for (const sel of ['.sw-aendern', '.sw-zeile', '.sm-zeile', '.uw-karte'].filter(s => regeln.some(r => teile(r.sel).includes(s))))
  pruefe(regeln.some(r => teile(r.sel).includes(sel) && (hoehe(r.text) || 0) >= 44), 'mindestens 44 px hoch: ' + sel);

// ---- 5. Keine neue niedrige Höhe an einem Knopf ----
/* Ein Knopf wird am Namen erkannt (letztes Glied des Selektors). Das ist eine Näherung: der Test sieht nicht,
   was man wirklich antippen kann — er hält nur auf, was nach Knopf heißt und niedrig ist. */
const KNOPF = /(btn|chip|knopf|schalter|switch|taste|toggle|check|stern|tab)[\w-]*$/;
const niedrig = new Map();
for (const r of regeln) {
  const m = r.text.match(/(?:^|;|\s)(?:min-)?height:\s*(\d*\.?\d+(?:px|rem))/);
  const px = m ? inPx(m[1]) : null;
  if (px === null || px >= 44 || px < 16) continue;                  // unter 16 px: Striche und Punkte, keine Knöpfe
  for (const sel of teile(r.sel)) {
    const letztes = sel.split(' ').pop().replace(/::?[\w-]+(\([^)]*\))?$/, '');
    if (/::(before|after)/.test(sel) || !KNOPF.test(letztes)) continue;
    niedrig.set(sel, px);
  }
}
if (LISTE) { for (const [s, p] of niedrig) console.log('    ' + s + '  ' + p + 'px'); }
const neu = [...niedrig].filter(([sel]) => !(sel in BEKANNT_NIEDRIG) && !imBlockMit(sel, t => (hoehe(t) || 0) >= 44)).map(([s, p]) => s + ' ' + p + 'px');
pruefe(neu.length === 0, 'kein Knopf mit einer Höhe unter 44 px, der nicht bekannt oder im Block angehoben ist', neu);

console.log(fehler ? '\n' + fehler + ' FEHLER' : '\nalles in Ordnung');
process.exit(fehler ? 1 : 0);
