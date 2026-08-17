/* stoff.mjs -- der Rohstoff fuer eine Eselsbruecke, je Wort auf einen Blick.
 *
 * Aufruf:
 *   node werkzeuge/stoff.mjs 3            Kapitel 3
 *   node werkzeuge/stoff.mjs 3 4 personal
 *   node werkzeuge/stoff.mjs --offen      nur Woerter OHNE zweite Eselsbruecke
 *   node werkzeuge/stoff.mjs 3 --offen
 *
 * WOZU (17.08.2026)
 *
 * Elias hat die Rangfolge fuer Eselsbruecken selbst korrigiert:
 *
 *   1. ein bekannter islamischer Begriff
 *   2. ein Vers - NUR aus Sure 1, 67, 93-114 (mehr kann er nicht auswendig)
 *   3. Muster oder Wurzel, aber MIT seinen eigenen Woertern daran
 *
 * Und der entscheidende Satz dazu: "vorallem alles drum herum ist eher viel
 * wertvoller ... das gibt mir einblicke und gibt mir mehr verständnis für die
 * sprache und das wort."
 *
 * Damit ist klar, was man vor dem Schreiben WISSEN muss: welche seiner eigenen
 * Woerter am selben Haken haengen. Genau das sammelt dieses Skript.
 *
 * ⛔ Es behauptet KEINE Wurzelbedeutungen. Was hier steht, sind seine eigenen
 * Vokabeln - nachpruefbar in vocab-data.js. Eine Wurzelbedeutung darf man aus
 * ihnen ERSCHLIESSEN ("Buch, Schreibtisch, Bibliothek - es geht ums
 * Schreiben"), aber dann steht die Herleitung daneben und nicht eine Behauptung
 * aus dem Nichts.
 *
 * Die Koranstellen kommen aus werkzeuge/anker.mjs und sind KANDIDATEN. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.join(HIER, '..');

function ladeAusSkript(datei, name){
  const pfad = path.join(WURZEL, datei);
  if (!fs.existsSync(pfad)){ console.error(`${datei} nicht gefunden.`); process.exit(1); }
  return new Function(`${fs.readFileSync(pfad, 'utf8')};return ${name};`)();
}

const VOCAB_DATA = ladeAusSkript('vocab-data.js', 'VOCAB_DATA');
const ALT = ladeAusSkript('data/eselsbruecken-alt.js', 'ESELSBRUECKEN_ALT');

const ZEICHEN = /[ؐ-ًؚ-ٰٟۖ-ࣰۭ-ࣳ]/g;
const flach = s => String(s).replace(ZEICHEN, '').replace(/ـ/g, '')
  .replace(/[آأإٱ]/g, 'ا')
  .replace(/ة/g, 'ه').replace(/ى/g, 'ي');

/* Das MUSTER eines Wortes, sehr grob: die Zusatzbuchstaben um die Wurzel
   herum. Reicht, um "alle deine Woerter mit Werkzeug-Mim" zu finden -
   genau die Art Anhang, die bei ihm gezuendet hat. */
function muster(w){
  if (!w.root) return null;
  const r = flach(w.root).split(/\s+/).filter(Boolean);
  const a = flach(w.ar);
  if (r.length < 3 || a.length < 3) return null;
  /* Vorsilbe: was vor dem ersten Radikal steht. */
  const i = a.indexOf(r[0]);
  return i > 0 ? a.slice(0, i) : '(ohne Vorsilbe)';
}

const args = process.argv.slice(2);
const nurOffen = args.includes('--offen');
const kapArg = args.filter(a => !a.startsWith('--'));

let woerter = VOCAB_DATA;
if (kapArg.length){
  const kap = kapArg.map(k => (k === 'personal' ? 'personal' : Number(k)));
  woerter = woerter.filter(w => kap.includes(w.chapter));
}
if (nurOffen) woerter = woerter.filter(w => !ALT[w.id]);

if (!woerter.length){ console.error('Keine Woerter zu dieser Auswahl.'); process.exit(1); }

woerter.forEach(w => {
  const gleicheWurzel = w.root
    ? VOCAB_DATA.filter(x => x.root === w.root && x.id !== w.id)
    : [];
  const m = muster(w);
  const gleichesMuster = m && m !== '(ohne Vorsilbe)'
    ? VOCAB_DATA.filter(x => x.id !== w.id && muster(x) === m).slice(0, 8)
    : [];

  console.log(`\n=== ${w.ar}  =  ${w.de}   [id ${w.id}, Kap. ${w.chapter}, ${w.type || '?'}]`);
  console.log(`    Wurzel: ${w.root || '-'}${w.pl ? '   Plural: ' + w.pl : ''}`);
  if (w.mnemo) console.log(`    schon da: ${w.mnemo}`);
  if (gleicheWurzel.length)
    console.log(`    deine Woerter mit derselben Wurzel: ${gleicheWurzel.map(x => x.ar + ' (' + x.de + ')').join(' · ')}`);
  if (gleichesMuster.length)
    console.log(`    dieselbe Vorsilbe "${m}": ${gleichesMuster.map(x => x.ar + ' (' + x.de + ')').join(' · ')}`);
  if (w.sentAr) console.log(`    Beispielsatz: ${w.sentAr}  /  ${w.sentDe}`);
  if (w.quran) console.log(`    Vers in vocab-data: ${w.quran.ayah}  (⚠️ nur brauchbar, wenn Sure 1, 67 oder 93-114)`);
});

console.log(`\n${woerter.length} Wort/Woerter.`);
console.log('Koranstellen aus seinem auswendigen Bereich: node werkzeuge/anker.mjs <Kapitel> --text');
