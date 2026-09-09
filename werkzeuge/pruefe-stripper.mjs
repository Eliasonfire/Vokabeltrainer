#!/usr/bin/env node
/* pruefe-stripper.mjs — verliert `js-quelltext.mjs` irgendwo den Faden?
 *
 * ⛔⛔ DER ANLASS (09.09.2026)
 *
 * Vier Pruefer dieser Nacht messen auf kommentarfreiem Quelltext. Beim
 * fuenften fiel auf, dass das Ergebnis in `js/statistik.js` NICHT stimmt: eine
 * Kommentarzeile war fast geleert, uebrig blieb ausgerechnet der Teil in
 * Backticks. Ein testweise eingebauter ECHTER Aufruf wurde danach **nicht
 * gefunden** — der Pruefer war an dieser Stelle blind.
 *
 * ⭐ Die Ursache ist nicht gefunden. Statt sie zu erfinden, wird hier
 * gemessen, WO der Stripper aus dem Tritt geraet — und zwar an einem
 * Kennzeichen, das keine Auslegung braucht: **im kommentarfreien Text darf
 * kein `/*` und kein `*``/` mehr stehen.** Bleibt eines uebrig, hat er den
 * Anfang oder das Ende eines Kommentars nicht gesehen.
 * [[erfundene_begruendung_schliesst_den_fall]] [[unmoegliche_zahl_ist_ein_geschenk]]
 *
 * ⚠️ Der Pruefer sagt NICHT, dass die vier anderen falsch liegen — er sagt,
 * in welchen Dateien man ihrem Ergebnis nicht trauen darf.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ohneKommentareUndTexte } from './js-quelltext.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const JS = path.join(REPO, 'js');

/* ⭐ Eichung: ein Text, dessen Antwort feststeht. */
const eichGut = ohneKommentareUndTexte('/* weg */ const a = 1;');
const eichSchlecht = '/* nicht gestrippt */';
if (/\/\*/.test(eichGut)) { console.log('⛔ EICHUNG: ein einfacher Kommentar bleibt stehen — das Werkzeug ist kaputt.'); process.exit(1); }
if (!/\/\*/.test(eichSchlecht)) { console.log('⛔ EICHUNG: das Kennzeichen selbst greift nicht.'); process.exit(1); }
console.log('Eichung ok: ein einfacher Kommentar verschwindet, das Kennzeichen greift.\n');

const dateien = fs.readdirSync(JS).filter(f => f.endsWith('.js')).sort();
const kaputt = [];
for (const f of dateien) {
  const roh = fs.readFileSync(path.join(JS, f), 'utf8');
  const rein = ohneKommentareUndTexte(roh);
  const reste = [];
  let i = 0;
  while ((i = rein.indexOf('/*', i)) >= 0) { reste.push(rein.slice(0, i).split('\n').length); i += 2; }
  let j = 0;
  while ((j = rein.indexOf('*/', j)) >= 0) { reste.push(rein.slice(0, j).split('\n').length); j += 2; }
  if (reste.length) kaputt.push({ f, zeilen: [...new Set(reste)].sort((a, b) => a - b) });
}

/* ⛔ ZWEITE PROBE, und sie ist die schaerfere: ein Kommentar, von dem
   unabhaengig feststeht, dass er einer ist, muss VOLLSTAENDIG verschwinden.

   In `js/statistik.js:536` steht die Zeile
     „⚠️ Absichtlich NICHT in der Oberflaeche, wie `zeitBericht()`. …"
   Sie ist Teil eines Blockkommentars. Gemessen am 09.09.2026 blieb davon
   ausgerechnet `` `zeitBericht()` `` stehen — der Rest war geleert.

   ⚠️ Diese Datei taucht in der Zaehlung oben NICHT auf: dort ueberlebt kein
   `/*`, der Faden reisst trotzdem. Die erste Probe findet also nicht alle
   Faelle, und das gehoert dazugesagt. [[gruener_pruefer_beweist_nur_geprueftes]] */
const st = fs.readFileSync(path.join(JS, 'statistik.js'), 'utf8');
const stRein = ohneKommentareUndTexte(st);
const zeileNr = st.slice(0, st.indexOf('`zeitBericht()`')).split('\n').length;
const stZeile = stRein.split('\n')[zeileNr - 1] || '';
const bekannterFall = stZeile.trim() === '';
console.log((bekannterFall ? '  ok  ' : '  ⛔  ')
  + 'Bekannter Fall js/statistik.js:' + zeileNr + ' — Kommentarzeile '
  + (bekannterFall ? 'vollstaendig geleert' : 'NICHT geleert, uebrig: ' + JSON.stringify(stZeile.trim())));
console.log('');

console.log(dateien.length + ' Dateien in js/ durchgesehen.');
if (!kaputt.length && bekannterFall) {
  console.log('\n✅ Kein Kommentarzeichen bleibt stehen, und der bekannte Fall haelt.');
  console.log('   ⚠️ Die zweite Probe ist seit dem Fix vom 09.09.2026 keine Eichung mehr,');
  console.log('      sondern eine RUECKFALLPROBE: sie bewacht die Stelle, an der der');
  console.log('      Stripper nachweislich schon einmal den Faden verloren hat.');
  console.log('      Die Eichung ganz oben (einfacher Kommentar) traegt weiter.');
  process.exit(0);
}
if (!kaputt.length) {
  console.log('\n⛔ Kein uebriges `/*`, aber der bekannte Fall in js/statistik.js steht noch.');
  process.exit(1);
}
console.log('\n⛔ ' + kaputt.length + ' Datei(en), in denen der Stripper den Faden verliert:');
for (const k of kaputt) console.log('   js/' + k.f + '  ab Zeile ' + k.zeilen.slice(0, 6).join(', ') + (k.zeilen.length > 6 ? ' …' : ''));
console.log('\n   Was danach kommt, wird als Zeichenkette behandelt und faellt aus jeder');
console.log('   Messung heraus. Betroffen sind die Pruefer, die auf kommentarfreiem');
console.log('   Text arbeiten: stille-fehler, klassen-ohne-fundstelle,');
console.log('   funktionen-ohne-aufrufer, diagnosekarte.');
process.exit(1);
