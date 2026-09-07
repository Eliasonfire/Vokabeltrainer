/* Prueft die deutsche Seite der Tipp-Uebung (Elias' Kommentar am Vorschlag R2,
 * 07.09.2026: „aber hier ist doch sinnvoll wenn ich in beide richtungen es
 * eintippe oder?").
 *
 * ⛔ Die Funktionen werden aus js/lernen.js GESCHNITTEN, nicht nachgebaut. Ein
 * nachgebauter Pruefstand prueft den Nachbau. [[testvorlage_selbst_nachgebaut]]
 *
 * ⛔ Und er muss scheitern koennen: der letzte Block stellt Eingaben, die
 * ABGELEHNT werden muessen. Ohne ihn bestuende eine Funktion, die immer
 * `true` sagt, jede Pruefung. [[pruefwerkzeug_mit_eingebauter_antwort]]
 */
import fs from 'node:fs';
import vm from 'node:vm';

const quelle = fs.readFileSync('js/lernen.js', 'utf8');

function schneide(name){
  const start = quelle.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('Funktion nicht gefunden: ' + name);
  let tiefe = 0, i = quelle.indexOf('{', start);
  const anfang = i;
  for (; i < quelle.length; i++){
    if (quelle[i] === '{') tiefe++;
    else if (quelle[i] === '}'){ tiefe--; if (!tiefe) break; }
  }
  if (tiefe) throw new Error('Klammern gehen nicht auf: ' + name);
  return quelle.slice(start, i + 1);
}

/* `var` statt `const`: im vm-Kontext ist ein `const` von aussen unsichtbar.
   [[const_ist_im_vm_kontext_unsichtbar]] */
const welt = { Set };
vm.createContext(welt);
vm.runInContext(schneide('tippPutz').replace(/^function/, 'var tippPutz = function'), welt);
vm.runInContext(schneide('tippVariantenDe').replace(/^function/, 'var tippVariantenDe = function'), welt);

const trifft = (eingabe, de) =>
  vm.runInContext('tippVariantenDe(' + JSON.stringify(de) + ').has(tippPutz(' + JSON.stringify(eingabe) + '))', welt);

let rot = 0;
function pruefe(name, ist, soll){
  const gut = ist === soll;
  if (!gut) rot++;
  console.log((gut ? '  ✔ ' : '  ✘ ') + name + (gut ? '' : '   erwartet ' + soll + ', bekam ' + ist));
}

/* ---- Diese Bedeutungen stehen so im Bestand (aus Elias' Bildschirmfoto vom
   07.09.2026 und aus data/): sie sind der eigentliche Grund fuer die Nachsicht. */
console.log('\nEine Variante aus einer Aufzaehlung genuegt');
pruefe('„welcher" bei „der / welcher (Relativpronomen)"',
  trifft('welcher', 'der / welcher (Relativpronomen)'), true);
pruefe('„der" bei „der / welcher (Relativpronomen)"',
  trifft('der', 'der / welcher (Relativpronomen)'), true);
pruefe('ganze Zeichenkette abgetippt',
  trifft('der / welcher (Relativpronomen)', 'der / welcher (Relativpronomen)'), true);
pruefe('„mit" bei „mit / zusammen mit"',
  trifft('mit', 'mit / zusammen mit'), true);
pruefe('„zusammen mit" bei „mit / zusammen mit"',
  trifft('zusammen mit', 'mit / zusammen mit'), true);
pruefe('„Adjektiv" bei „(gr) Attribut / Adjektiv"',
  trifft('Adjektiv', '(gr) Attribut / Adjektiv'), true);
pruefe('„sie" bei „sie (Pl. m.)"',
  trifft('sie', 'sie (Pl. m.)'), true);

console.log('\nSchreibweise darf abweichen, Bedeutung nicht');
pruefe('Grossschreibung egal',       trifft('LEHRER', 'der Lehrer'), true);
pruefe('bestimmter Artikel weglassbar', trifft('Lehrer', 'der Lehrer'), true);
pruefe('Artikel mitgetippt',         trifft('der Lehrer', 'der Lehrer'), true);
pruefe('Leerzeichen ringsum egal',   trifft('  Buch  ', 'das Buch'), true);
pruefe('Satzzeichen egal',           trifft('wir!', 'wir'), true);
pruefe('„oder" trennt auch',         trifft('Haus', 'Haus oder Wohnung'), true);

console.log('\n⛔ Der Stoertest: was ABGELEHNT werden muss');
pruefe('anderes Wort',               trifft('Auto', 'der Lehrer'), false);
pruefe('leere Eingabe',              trifft('', 'der Lehrer'), false);
pruefe('nur Leerzeichen',            trifft('   ', 'der Lehrer'), false);
pruefe('nur ein Artikel',            trifft('der', 'der Lehrer'), false);
pruefe('halbes Wort',                trifft('Lehr', 'der Lehrer'), false);
pruefe('Klammerinhalt allein',       trifft('Relativpronomen', 'der / welcher (Relativpronomen)'), false);
pruefe('nur Satzzeichen',            trifft('/', 'mit / zusammen mit'), false);

console.log('\n' + (rot ? '⛔ ' + rot + ' Pruefung(en) rot' : '✔ alle gruen'));
process.exit(rot ? 1 : 0);
