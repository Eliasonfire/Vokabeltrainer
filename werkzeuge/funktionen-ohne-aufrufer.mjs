#!/usr/bin/env node
/* funktionen-ohne-aufrufer.mjs — welche Funktion hat nur ihre eigene
 * Definition als Fundstelle?
 *
 * ⛔ WARUM ALS DATEI UND NICHT ALS EINZEILER (09.09.2026): Der erste Versuch
 * lief als `node --input-type=module -e "…"` durch die Shell und meldete
 * „0 ohne Aufrufer" — obwohl `paketLoeschen` nachweislich genau eine
 * Fundstelle hat. Die Backslashes des `\b` ueberleben den Weg durch die
 * Shell nicht. [[python_backslash_b_wird_backspace]] [[windows_pfad_in_python_string]]
 *
 * ⭐ Die Lehre daneben: die alte Messung sagte „genau zwei", meine neue „null".
 * Wenn ein neues Werkzeug einer alten Messung widerspricht, ist zuerst das
 * neue verdaechtig. [[mein_neues_werkzeug_ist_verdaechtig]]
 *
 * Gemessen wird auf kommentarfreiem Quelltext — sonst zaehlt ein Name in
 * einem Kommentar als Aufrufer. [[stichworttreffer_im_kommentar]]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ohneKommentareUndTexte } from './js-quelltext.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ⛔⛔ ZWEI Texte, und die Trennung ist der ganze Punkt (09.09.2026).

   DEFINITIONEN werden im kommentarfreien Text gesucht — sonst zaehlt ein
   `function x()` in einem Kommentar als echte Funktion.

   AUFRUFE werden im ORIGINAL gesucht, Zeichenketten eingeschlossen. Der erste
   Entwurf suchte beides im kommentarfreien Text und meldete 25 Funktionen
   „ohne Aufrufer" — darunter `setNotiz`, `verschiebeInBox` und
   `openQuranFreqPopover`. Die werden alle gerufen, nur eben aus einem
   `onclick="…"`, das die App als Zeichenkette zusammenbaut. Genau die haette
   eine Aufraeumaktion nach dieser Liste geloescht.
   [[funktion_als_referenz_sieht_tot_aus]] [[kandidatenliste_ist_keine_fehlerliste]]

   ⚠️ Kommentare bleiben beim Zaehlen der Aufrufe deshalb AUCH drin. Das macht
   die Liste kuerzer, als sie sein koennte — eine Funktion, die nur noch in
   einem Kommentar vorkommt, faellt hier durch. Das ist die richtige Richtung:
   lieber einen toten Namen uebersehen als einen lebenden loeschen. */
let dateien = [];
for (const f of fs.readdirSync(path.join(REPO, 'js')).filter(x => x.endsWith('.js')))
  dateien.push(fs.readFileSync(path.join(REPO, 'js', f), 'utf8'));
dateien.push(fs.readFileSync(path.join(REPO, 'index.html'), 'utf8'));

const original = dateien.join('\n');
const quelle   = dateien.map(ohneKommentareUndTexte).join('\n');

/* ⛔ NICHT jede benannte Funktion braucht einen Aufrufer (09.09.2026).
   `(function leisteMessen(){ … })()` ist ein Ausdruck, der sich SELBST
   ausfuehrt — der Name dient nur der Fehlersuche. Der zweite Entwurf meldete
   fuenf davon als „ohne Aufrufer", und alle fuenf laufen bei jedem Start.
   Erkennbar am Zeichen davor: eine Klammer statt Zeilenanfang oder Semikolon.
   [[kennzeichen_mit_zwei_ursachen]] */
const namen = new Set(
  [...quelle.matchAll(/(.?)function\s+([A-Za-zÄÖÜäöü_$][\w$]*)\s*\(/g)]
    .filter(m => m[1] !== '(')
    .map(m => m[2]));

/* ⛔ Die Eichung zuerst: ein Name, von dem UNABHAENGIG feststeht, dass er oft
   gerufen wird, muss mehr als eine Fundstelle haben. Kommt dort 1 heraus,
   misst dieses Werkzeug nichts. [[gruener_pruefer_beweist_nur_geprueftes]] */
const zaehl = (n) => (original.match(new RegExp('\\b' + n.replace(/\$/g, '\\$') + '\\b', 'g')) || []).length;
const eichung = zaehl('bekannteVokabeln');
if (eichung < 2) {
  console.log('⛔ EICHUNG GESCHEITERT: bekannteVokabeln kommt nur ' + eichung + '× vor.');
  console.log('   Das kann nicht sein — dieses Werkzeug misst nichts. Kein Befund unten gilt.');
  process.exit(1);
}
console.log('Eichung ok: bekannteVokabeln kommt ' + eichung + '× vor.\n');

/* Benannte Ausnahmen — mit Grund, sonst ist die Liste nur eine Behauptung.
   [[regel_gilt_nur_mit_begruendung]] */
const AUSGENOMMEN = new Map([
  ['paketLoeschen', 'steht in js/vokabelpaket.js:64 und wartet auf Elias\' Entscheidung — '
    + 'werkzeuge/wartet-auf-elias.mjs fuehrt ihn dort. Nicht ohne ihn anfassen.'],
]);

const ohne = [...namen].filter(n => zaehl(n) === 1).sort();
const neu  = ohne.filter(n => !AUSGENOMMEN.has(n));

console.log(namen.size + ' Funktionsdeklarationen in js/ und index.html.');
console.log(ohne.length + ' ohne jeden Aufrufer'
  + (ohne.length ? ':\n  ' + ohne.map(n => n + (AUSGENOMMEN.has(n) ? '   (benannt ausgenommen)' : '   ⛔ NEU')).join('\n  ') : '.'));
for (const [n, grund] of AUSGENOMMEN) console.log('\n  (' + n + ': ' + grund + ')');

/* ⛔ Stoertest: kann das hier ueberhaupt rot werden? Ein erfundener Name darf
   nicht als Aufrufer gelten. [[stoertest_muss_wirkung_nachweisen]] */
console.log('');
if (zaehl('gibtEsGarNichtXyz') !== 0){
  console.log('⛔ Stoertest gescheitert: ein erfundener Name wird gefunden — die Zaehlung misst nichts.');
  process.exit(1);
}
console.log('  ok   Stoertest: ein erfundener Name kommt 0× vor.');

if (neu.length){
  console.log('\n⛔ ' + neu.length + ' Funktion(en) ohne Aufrufer und ohne Begruendung: ' + neu.join(', '));
  console.log('   Entweder tot (dann weg, mit einem Satz warum) oder ein Anschluss, den');
  console.log('   jemand vergessen hat. ⚠️ Vorher pruefen, ob sie aus einem `onclick="…"`');
  console.log('   gerufen wird — das steht in einer Zeichenkette. [[funktion_als_referenz_sieht_tot_aus]]');
  process.exit(1);
}
console.log('\n✅ Keine Funktion ohne Aufrufer ausser der benannten Ausnahme.');
process.exit(0);
