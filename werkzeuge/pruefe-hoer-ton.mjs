#!/usr/bin/env node
/* pruefe-hoer-ton.mjs — der Lautsprecher im Hörmodus spielt dasselbe Wort, auch nach der Antwort
 * ===========================================================================================
 *
 * ⛔⛔ DER ANLASS — Elias am 24.09.2026:
 *
 *   „wenn ich beim hörmodus bereits eine lösung gegeben habe und wieder auf das
 *    ton zeichen tippe möchte ich, dass es mir den selben ton wieder abspielt und
 *    nicht zum nächsten geht."
 *
 * Im Klick-Zuhörer der Karte (#hoerKarte, js/hoeren.js) stand der Lautsprecher
 * HINTER dem Weiter-Zweig „if (HOER.beantwortet) … naechsteHoerfrage()". Nach der
 * Antwort war er deshalb ein Fleck der Karte wie jeder andere und schaltete weiter;
 * nach einer falschen Antwort blieb er zwei Sekunden stumm (Q8-Sperre). Gemessen im
 * Nachbau mit seinem Stand: vorher „springt zum nächsten Wort", nachher „dasselbe
 * Wort noch einmal", auch in der Sperre; überall sonst auf der Karte geht es weiter.
 *
 * Geprüft wird die REIHENFOLGE im echten Zuhörer (ohne Kommentare): der
 * Lautsprecher-Zweig steht vor dem Weiter-Zweig und endet mit return. Zwei
 * Störtests bei jedem Lauf: Reihenfolge wie vorher · return entfernt.
 *
 * Aufruf: node werkzeuge/pruefe-hoer-ton.mjs    (Exit 0 grün, 1 rot)
 */
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ohneKommentareUndTexte } from './js-quelltext.mjs';

const HOEREN = fs.readFileSync(fileURLToPath(new URL('../js/hoeren.js', import.meta.url)), 'utf8');
let fehler = 0;
const gut = t => console.log('  ok ' + t);
const schlecht = t => { fehler++; console.log('  ⛔ ' + t); };

const KOPF = "document.getElementById('hoerKarte').addEventListener('click'";
/* Den Zuhörer ohne Kommentare, Zeichenketten bleiben stehen (die Kennungen stecken darin). */
function zuhoerer(quelle){
  const leer = ohneKommentareUndTexte(quelle, { texte: false });
  const a = leer.indexOf(KOPF);
  if (a < 0) return null;
  let i = leer.indexOf('{', a), tiefe = 0;
  for (; i < leer.length; i++){
    if (leer[i] === '{') tiefe++;
    else if (leer[i] === '}' && --tiefe === 0) return leer.slice(a, i + 1).replace(/\s+/g, ' ');
  }
  return null;
}
function befunde(quelle){
  const z = zuhoerer(quelle);
  if (!z) return ['der Klick-Zuhörer der Karte (#hoerKarte) ist in js/hoeren.js nicht zu finden'];
  const raus = [];
  const ton = z.search(/if \(e\.target\.closest\('#btnHoerPlay'\)\)\s*\{\s*hoerAbspielen\(\);\s*return;\s*\}/);
  const weiter = z.indexOf('if (HOER.beantwortet)');
  if (ton < 0) raus.push('kein Lautsprecher-Zweig „if (e.target.closest(\'#btnHoerPlay\')){ hoerAbspielen(); return; }" im Zuhörer');
  else if (weiter >= 0 && ton > weiter) raus.push('der Lautsprecher-Zweig steht HINTER „if (HOER.beantwortet)" — nach der Antwort schaltet der Lautsprecher weiter');
  return raus;
}

console.log('pruefe-hoer-ton — Elias, 24.09.2026: „… den selben ton wieder abspielt und nicht zum nächsten geht."\n');
const echt = befunde(HOEREN);
if (echt.length) echt.forEach(schlecht);
else gut('der Lautsprecher-Zweig steht vor dem Weiter-Zweig und endet mit return');

const ZEILE = "if (e.target.closest('#btnHoerPlay')){ hoerAbspielen(); return; }";
const STOERUNGEN = [
  /* Die Zeile an die alte Stelle: hinter den Weiter-Zweig, als letzte Zeile des Zuhörers. */
  ['Reihenfolge wie vor dem 24.09.', q => q.replace(ZEILE, '')
    .replace(/(nur nicht auf dem Lautsprecher \(oben\) \*\/\r?\n  \}\r?\n)(\}\);)/, '$1  ' + ZEILE + '\n$2')],
  ['return entfernt', q => q.replace(ZEILE, "if (e.target.closest('#btnHoerPlay')){ hoerAbspielen(); }")],
];
for (const [name, stoere] of STOERUNGEN){
  if (!HOEREN.includes(ZEILE)){ schlecht('Störtest „' + name + '": die Zeile „' + ZEILE + '" steht nicht mehr in js/hoeren.js — Störtest anpassen'); continue; }
  const gestoert = stoere(HOEREN);
  if (gestoert === HOEREN){ schlecht('Störtest „' + name + '" hat nichts verändert — er prüft nichts'); continue; }
  const b = befunde(gestoert);
  if (b.length) gut('Störtest „' + name + '" wird rot: ' + b[0]);
  else schlecht('Störtest „' + name + '" bleibt grün — der Prüfer sieht diesen Fehler nicht');
}
console.log('\n' + (fehler ? '⛔ ' + fehler + ' Befund(e) — Exit 1' : '✅ grün — der Lautsprecher spielt nach der Antwort dasselbe Wort'));
process.exit(fehler ? 1 : 0);
