/* pruefe-netzfassung.mjs — passt die geteilte Netzfassung noch zur Seite?
 * ==========================================================================
 *
 * Aufruf:  node werkzeuge/pruefe-netzfassung.mjs
 * Exitcode 0 = jede Netzfassung ergibt zusammengesetzt genau ihre Seite
 *          1 = eine Netzfassung fehlt, ist unvollständig oder weicht ab
 *
 * WOZU
 *
 * Seit dem 11.10.2026 werden die zwei großen Regelseiten nicht mehr als eine
 * Datei veröffentlicht, sondern als kleine Seite plus Inhaltsdatei
 * (werkzeuge/seite-teilen.mjs, Ordner artefakte/netz/<name>/). Die Prüfer der
 * Seiten (Inhalt, Speicher, Schreibrichtung) lesen aber weiter die große
 * Datei artefakte/<name>.html. Wichen die zwei voneinander ab, wäre alles
 * grün und im Netz stünde etwas anderes, als geprüft wurde.
 * [[werkzeug_misst_kleineren_bestand]]
 *
 * ⚠️ artefakte/ steht in .gitignore. Fehlt die große Seite ganz (frischer
 * Abzug des Repos), gibt es nichts zu vergleichen — das wird gesagt, nicht
 * verschwiegen. Gibt es die große Seite, MUSS es auch ihre Netzfassung geben:
 * eine leere Liste ist keine Messung. [[leere_liste_ist_keine_messung]]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setzeZusammen, fingerabdruck, NAME_MUSTER } from './seite-teilen.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARTEFAKTE = path.join(REPO, 'artefakte');

/* Die Seiten, die geteilt veröffentlicht werden. Kommt eine dazu, gehört sie
   hierher UND in ihren Erzeuger (Aufruf von schreibeNetzfassung). */
const SEITEN = ['regelkategorien', 'regelpruefung'];

console.log('');
console.log('=== Netzfassung der großen Seiten: ergibt sie genau die geprüfte Seite? ===');
console.log('');

let fehler = 0, geprueft = 0;
for (const kurz of SEITEN){
  const gross = path.join(ARTEFAKTE, kurz + '.html');
  const ordner = path.join(ARTEFAKTE, 'netz', kurz);
  const melde = text => { fehler++; console.log('  ⛔ ' + kurz + ': ' + text); };

  if (!fs.existsSync(gross)){
    console.log('  ·  ' + kurz + ': artefakte/' + kurz + '.html gibt es hier nicht — nichts zu vergleichen.');
    continue;
  }
  geprueft++;
  if (!fs.existsSync(path.join(ordner, 'index.html'))){
    melde('die Netzfassung fehlt (artefakte/netz/' + kurz + '/index.html) — den Erzeuger neu laufen lassen.');
    continue;
  }
  const inhalte = fs.readdirSync(ordner).filter(f => NAME_MUSTER.test(f));
  if (inhalte.length !== 1){
    melde(inhalte.length + ' Inhaltsdateien im Ordner statt genau einer.');
    continue;
  }
  const name = inhalte[0];
  const seite = fs.readFileSync(path.join(ordner, 'index.html'), 'utf8');
  const datei = fs.readFileSync(path.join(ordner, name), 'utf8');
  if (name !== 'inhalt-' + fingerabdruck(datei) + '.js'){
    melde('der Name ' + name + ' passt nicht zum Inhalt der Datei — sie wurde nach dem Bau verändert.');
    continue;
  }
  let ganz;
  try { ganz = setzeZusammen(seite, datei, name); }
  catch (e){ melde(e.message); continue; }
  if (ganz !== fs.readFileSync(gross, 'utf8')){
    melde('Netzfassung und artefakte/' + kurz + '.html sind verschieden — den Erzeuger neu laufen lassen.');
    continue;
  }
  console.log('  ✅ ' + kurz + ': index.html (' + Buffer.byteLength(seite, 'utf8') + ' B) + ' + name
    + ' (' + Buffer.byteLength(datei, 'utf8') + ' B) ergeben genau artefakte/' + kurz + '.html');
}

console.log('');
if (fehler){
  console.log('⛔ ' + fehler + ' Netzfassung(en) passen nicht zu ihrer Seite. Was im Netz stünde, ist nicht das, was geprüft wurde.');
  process.exit(1);
}
console.log(geprueft
  ? '✅ ' + geprueft + ' Netzfassung(en) ergeben zusammengesetzt genau ihre Seite.'
  : 'ℹ️  Keine der großen Seiten liegt hier auf der Platte — nichts geprüft.');
process.exit(0);
