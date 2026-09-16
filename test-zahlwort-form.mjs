/* test-zahlwort-form.mjs — bei Zahlwörtern steht nicht mehr „Plural"
 *
 * ⛔ WARUM (16.09.2026)
 *
 * Die neun Zahlwörter وَاحِدٌ, ثَلَاثَةٌ … عَشَرَةٌ tragen im Feld `pl` die Form
 * des anderen Geschlechts (وَاحِدَةٌ, ثَلَاثٌ … عَشْرٌ), keinen Plural. Die App
 * schrieb „Plural" davor und baute die Karte „drei (Plural)". Auf seiner Seite
 * gefragt, was dort stehen soll — Elias: „das auch" (selbst mit den
 * Wörterbüchern entscheiden). en.wiktionary, ثَلَاثَة: „f (masculine ثَلَاث)",
 * drei bis neun „differ in gender from the modified noun" → die Zeile heißt
 * „bei weiblichem Nomen", und Zahlwörter bekommen keine Pluralkarte.
 *
 * ⭐ Die Funktionen werden aus js/kern.js GESCHNITTEN und ausgeführt, an den
 * echten Einträgen aus vocab-data.js — mit Gegenfällen: ein echter Plural
 * (بَيْتٌ → بُيُوتٌ) und غُرْفَةٌ → غُرَفٌ, die der Formvergleich einst falsch für
 * ein Zahlwort hielt. [[pruefwerkzeug_mit_eingebauter_antwort]]
 *
 *   node test-zahlwort-form.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const KERN = fs.readFileSync(path.join(HIER, 'js', 'kern.js'), 'utf8');
const ANZEIGE = fs.readFileSync(path.join(HIER, 'js', 'lernen.js'), 'utf8') + fs.readFileSync(path.join(HIER, 'js', 'kategorien.js'), 'utf8');
const VD = (new Function(fs.readFileSync(path.join(HIER, 'vocab-data.js'), 'utf8') + ';return VOCAB_DATA;'))();

const schneide = (text, name) => {
  const auf = text.indexOf('function ' + name + '(');
  if (auf < 0) return null;
  let i = text.indexOf('{', auf), tiefe = 0;
  for (; i < text.length; i++){
    if (text[i] === '{') tiefe++;
    else if (text[i] === '}'){ tiefe--; if (!tiefe) return text.slice(auf, i + 1); }
  }
  return null;
};

function laufe(kern, anzeige, still){
  let schlecht = 0;
  const sag = (ok, t) => { if (!ok) schlecht++; if (!still) console.log('  ' + (ok ? '✔' : '✘') + ' ' + t); };
  const teile = ['istZahlwort', 'plBeschriftung', 'istPluralKarte', 'bauePluralKarte'].map(n => [n, schneide(kern, n)]);
  const regex = (kern.match(/const ZAHLWORT_DE = [^\n]*/) || [])[0];
  const marke = (kern.match(/const PLURAL_MARKE = [^\n]*/) || [])[0];
  const fehlt = teile.filter(([, q]) => !q).map(([n]) => n).concat(regex ? [] : ['ZAHLWORT_DE'], marke ? [] : ['PLURAL_MARKE']);
  sag(!fehlt.length, 'Funktionen und Konstanten stehen in js/kern.js' + (fehlt.length ? ' (fehlt: ' + fehlt.join(', ') + ')' : ''));
  if (fehlt.length) return schlecht;
  const welt = {};
  vm.createContext(welt);
  vm.runInContext([regex, marke, ...teile.map(([, q]) => q)].join('\n')
    + '\n;globalThis.__B = plBeschriftung; globalThis.__K = bauePluralKarte; globalThis.__Z = istZahlwort;', welt);

  const zahlen = VD.filter(w => w.pl && welt.__Z(w));
  sag(zahlen.length === 9, 'genau neun Zahlwörter mit pl-Feld erkannt (gemessen: ' + zahlen.length + ' — ' + zahlen.map(w => w.ar).join(' ') + ')');
  const falschBeschriftet = zahlen.filter(w => welt.__B(w) !== 'bei weiblichem Nomen');
  sag(zahlen.length > 0 && !falschBeschriftet.length, 'bei allen steht „bei weiblichem Nomen", nicht „Plural"');
  const mitKarte = zahlen.filter(w => welt.__K(w) !== null);
  sag(zahlen.length > 0 && !mitKarte.length, 'keines bekommt eine Pluralkarte („drei (Plural)")' + (mitKarte.length ? ' — doch: ' + mitKarte.map(w => w.ar).join(' ') : ''));

  const haus = VD.find(w => String(w.id) === '45751');
  sag(!!haus && welt.__B(haus) === 'Plural' && !!welt.__K(haus), 'Gegenfall بَيْتٌ → بُيُوتٌ: weiter „Plural" und eine Pluralkarte');
  const zimmer = VD.find(w => String(w.id) === '45821');
  sag(!!zimmer && welt.__B(zimmer) === 'Plural' && !!welt.__K(zimmer), 'Gegenfall غُرْفَةٌ → غُرَفٌ (sieht aus wie ein Zahlwort-Paar): weiter „Plural"');
  const acht = VD.find(w => String(w.id) === '50302');
  sag(!!acht && welt.__B(acht) === 'bei weiblichem Nomen', 'ثَمَانِيَةٌ → ثَمَانٍ, das der Formvergleich übersah, ist erkannt');

  /* ⛔ Jede Stelle EINZELN — eine Zählung „mindestens drei" blieb im Störtest
     grün, weil das Bearbeiten-Feld die Funktion zweimal aufruft. */
  const STELLEN = [
    ['Lernkarte (js/lernen.js)', "label:(typeof plBeschriftung === 'function' ? plBeschriftung(w)"],
    ['Wortkarte (js/kategorien.js)', "formen.push([(typeof plBeschriftung === 'function' ? plBeschriftung(w)"],
    ['Bearbeiten-Feld (js/kategorien.js)', "feld('wkPl', (typeof plBeschriftung === 'function'"]
  ];
  for (const [wo, text] of STELLEN) sag(anzeige.includes(text), wo + ' fragt plBeschriftung(w)');
  return schlecht;
}

console.log('test-zahlwort-form.mjs — „das auch" (16.09.2026)\n');
const schlecht = laufe(KERN, ANZEIGE, false);

console.log('\nStörtest:');
let alleRot = true;
for (const [name, kern, anzeige] of [
  ['bauePluralKarte ohne die Zahlwort-Sperre', KERN.replace(' || istZahlwort(w)) return null;', ') return null;'), ANZEIGE],
  ['plBeschriftung sagt immer „Plural"', KERN.replace("istZahlwort(w) ? 'bei weiblichem Nomen' : 'Plural'", "'Plural'"), ANZEIGE],
  ['die Wortkarte schreibt wieder fest „Plural"', KERN, ANZEIGE.replace("formen.push([(typeof plBeschriftung === 'function' ? plBeschriftung(w) : 'Plural'),", "formen.push(['Plural',")]
]){
  if (kern === KERN && anzeige === ANZEIGE){ alleRot = false; console.log('  ✘ ' + name + ' — Störung griff nicht'); continue; }
  const n = laufe(kern, anzeige, true);
  if (n > 0) console.log('  ✔ ' + name + ' → ' + n + ' rot');
  else { alleRot = false; console.log('  ✘ ' + name + ' → blieb grün'); }
}
console.log('');
console.log(!schlecht && alleRot ? '✔ alle Fälle richtig, jede Störung erkannt' : '✘ ' + schlecht + ' Fehler' + (alleRot ? '' : ', mindestens eine Störung unbemerkt'));
process.exit(!schlecht && alleRot ? 0 : 1);
