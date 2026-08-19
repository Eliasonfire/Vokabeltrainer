/* icon-bauen.mjs -- baut icon.svg und icon-maskable.svg aus dem Gehirn.
 *
 * Elias am 19.08.2026, nach fünf Runden: Fassung P mit dem Stamm „kürzer und
 * dicker" — *„das gefällt mir am besten. gib mir zwei variationen davon, die
 * hier und eine wo das gehirn etwas größer ist (weil die app icons immer so
 * klein sind) und dann teste ich beide mal aus als app icon"*.
 *
 * AUFRUF
 *   node werkzeuge/icon-bauen.mjs            zeigt den Stand
 *   node werkzeuge/icon-bauen.mjs --klein    Gehirn in Ausgangsgröße
 *   node werkzeuge/icon-bauen.mjs --gross    Gehirn größer
 *   node werkzeuge/icon-bauen.mjs --ilm      zurück auf عِلْم (der alte Stand)
 *
 * Danach: CACHE_NAME hoch und `node werkzeuge/veroeffentlichen.mjs --mit-daten`.
 *
 * ⛔ EINE PWA HAT NUR EIN ICON. Zwei Fassungen gleichzeitig auf dem
 * Startbildschirm gehen nicht — dafür bräuchte es zwei Manifeste und zwei
 * Installationen. Deshalb dieser Umschalter: Elias installiert eine, sieht sie
 * an, sagt ein Wort, und der Wechsel kostet einen Befehl.
 *
 * ⛔ DER ALTE STAND WIRD NICHT GELÖSCHT. `--ilm` stellt das عِلْم-Icon wieder
 * her; sein Inhalt steht unten im Quelltext, nicht in einer Sicherungsdatei,
 * die jemand aufräumt.
 *
 * ============================ Die Maße, gemessen ==========================
 *
 * Das Gehirn (Kuppe + Kleinhirn + Stamm) belegt im 512er-Raster:
 *   x 102 bis 397  (295 breit)      y 154 bis 374  (220 hoch)
 *   Mitte (249.5, 264) — NICHT (256,256), deshalb wird beim Vergrößern um
 *   die INHALTS-Mitte skaliert und nicht um die Bild-Mitte. Sonst wandert das
 *   Gehirn beim Vergrößern nach rechts unten aus dem Bild.
 *
 * Die maskable-Zone ist die innere 80 %, also 51 bis 461. Was darüber
 * hinausragt, kann der Startbildschirm abschneiden — deshalb hat die
 * maskable-Fassung IMMER einen kleineren Maßstab als die normale.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ---------------------------------------------------------------- Die Formen */
const KUPPE = `<path d="M102 240
    A 37 37 0 0 1 133 185
    A 45 45 0 0 1 204 154
    A 52 52 0 0 1 296 154
    A 45 45 0 0 1 367 185
    A 33 33 0 0 1 397 232
    A 28 28 0 0 1 384 278
    A 42 42 0 0 1 324 318
    A 260 260 0 0 1 212 327
    A 90 90 0 0 1 122 285
    A 30 30 0 0 1 102 240 Z"/>`;
const KLEIN = `<path d="M298 286 C 324 276 352 290 354 314
    C 356 338 336 352 316 344
    C 296 336 286 296 298 286 Z"/>`;
/* Stamm „kuerzer und dicker" — Elias' Wahl aus fuenf. */
const STAMM = `<path d="M318 316 C 329 336 327 357 313 367
    C 303 374 288 369 294 359
    C 303 346 305 332 301 314 Z"/>`;
const FALTEN = `<g fill="none" stroke-linecap="round">
    <path d="M133 185 C 156 204 148 232 120 240"/>
    <path d="M204 154 C 212 186 190 206 162 200"/>
    <path d="M296 154 C 292 190 266 204 240 194"/>
    <path d="M367 185 C 348 208 356 236 378 246"/>
    <path d="M397 232 C 368 240 354 264 362 284"/>
    <path d="M324 318 C 314 292 324 270 344 262"/>
    <path d="M212 327 C 210 298 226 280 250 274"/>
    <path d="M122 285 C 148 280 162 262 158 240"/>
    <path d="M176 216 C 206 200 236 214 244 242"/>
    <path d="M258 226 C 286 216 310 230 314 254"/>
    <path d="M196 262 C 222 250 250 262 258 286"/>
  </g>`;

const MITTE_X = 249.5, MITTE_Y = 264;
const KASTEN = { x1: 102, y1: 154, x2: 397, y2: 374 };

/* Wie weit ragt der Inhalt bei einem Massstab? Wird gerechnet, nicht geschaetzt. */
function ausdehnung(f){
  const b = (KASTEN.x2 - KASTEN.x1) * f, h = (KASTEN.y2 - KASTEN.y1) * f;
  return { x1: 256 - b/2, x2: 256 + b/2, y1: 256 - h/2, y2: 256 + h/2, b, h };
}

function gehirn(f, breite){
  const t = `translate(256,256) scale(${f}) translate(${-MITTE_X},${-MITTE_Y})`;
  return `<g transform="${t}">
  <g fill="#ff3355">${STAMM}${KUPPE}${KLEIN}</g>
  ${FALTEN.replace('<g fill="none"', `<g fill="none" stroke="#000" stroke-width="${breite}"`)}
</g>`;
}

function svg(f, breite, name){
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Vokabeltrainer">
<title>Vokabeltrainer — ${name}</title>
<!-- Gehirn, Fassung P mit Stamm "kuerzer und dicker" (Elias, 19.08.2026).
     Massstab ${f}, Furchenbreite ${breite}. Gebaut von werkzeuge/icon-bauen.mjs —
     dort steht auch, wie man umschaltet und warum die Masse so sind. -->
<rect width="512" height="512" fill="#000000"/>
${gehirn(f, breite)}
</svg>`;
}

/* Das alte Icon, damit `--ilm` es zurueckholen kann, ohne dass jemand eine
   Sicherungsdatei aufbewahren muss. */
const ILM_INHALT = fs.existsSync(path.join(REPO, 'artefakte', 'icon-ilm.svg'))
  ? fs.readFileSync(path.join(REPO, 'artefakte', 'icon-ilm.svg'), 'utf8') : null;

const was = process.argv[2] || '';

if (!was || was === '--stand'){
  for (const f of ['icon.svg', 'icon-maskable.svg']){
    const p = path.join(REPO, f);
    const s = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
    const m = /<title>[^—]*— ([^<]*)<\/title>/.exec(s);
    const g = /scale\(([\d.]+)\)/.exec(s);
    console.log('  ' + f.padEnd(20) + (m ? m[1] : '?') + (g ? '   Massstab ' + g[1] : ''));
  }
  console.log('\n  --klein · --gross · --ilm');
  process.exit(0);
}

if (was === '--ilm'){
  if (!ILM_INHALT){ console.log('⛔ artefakte/icon-ilm.svg fehlt — der alte Stand ist nicht gesichert.'); process.exit(1); }
  fs.writeFileSync(path.join(REPO, 'icon.svg'), ILM_INHALT, 'utf8');
  fs.writeFileSync(path.join(REPO, 'icon-maskable.svg'), ILM_INHALT, 'utf8');
  console.log('  ok  zurueck auf عِلْم');
  process.exit(0);
}

/* Massstaebe. Die maskable-Fassung bleibt immer kleiner — sie muss in die
   innere 80 % passen (51 bis 461). */
const WAHL = {
  '--klein': { any: 1.00, mask: 1.00, name: 'Gehirn (Ausgangsgroesse)' },
  '--gross': { any: 1.42, mask: 1.35, name: 'Gehirn (groesser)' },
}[was];
if (!WAHL){ console.log('⛔ Verstehe "' + was + '" nicht. --klein · --gross · --ilm'); process.exit(1); }

/* Die Furchenbreite waechst NICHT mit dem Massstab mit: sie steht im
   viewBox-Raster und wird ohnehin mitskaliert. Wer sie zusaetzlich erhoehte,
   bekaeme bei der grossen Fassung doppelt so dicke Linien. */
fs.writeFileSync(path.join(REPO, 'icon.svg'), svg(WAHL.any, 13, WAHL.name), 'utf8');
fs.writeFileSync(path.join(REPO, 'icon-maskable.svg'), svg(WAHL.mask, 13, WAHL.name + ', maskable'), 'utf8');

const a = ausdehnung(WAHL.any), m = ausdehnung(WAHL.mask);
console.log('  ok  ' + WAHL.name);
console.log('  icon.svg          Massstab ' + WAHL.any.toFixed(2)
  + '  belegt ' + Math.round(a.b) + '×' + Math.round(a.h)
  + '  (' + Math.round(a.b / 512 * 100) + ' % der Breite)');
console.log('                    x ' + Math.round(a.x1) + '–' + Math.round(a.x2)
  + ', y ' + Math.round(a.y1) + '–' + Math.round(a.y2)
  + (a.x1 >= 0 && a.x2 <= 512 && a.y1 >= 0 && a.y2 <= 512 ? '   ✓ im Bild' : '   ⛔ RAGT HERAUS'));
console.log('  icon-maskable.svg Massstab ' + WAHL.mask.toFixed(2)
  + '  x ' + Math.round(m.x1) + '–' + Math.round(m.x2)
  + ', y ' + Math.round(m.y1) + '–' + Math.round(m.y2)
  + (m.x1 >= 51 && m.x2 <= 461 && m.y1 >= 51 && m.y2 <= 461
      ? '   ✓ in der maskable-Zone (51–461)' : '   ⛔ AUSSERHALB DER ZONE'));
console.log('\n  Jetzt: CACHE_NAME in sw.js hoch, dann veroeffentlichen.mjs --mit-daten');
