/* gedaechtnis-frisch.mjs -- wie lange ist der letzte Eintrag ins Obsidian-
 * Gedaechtnis her? Exitcode 2, wenn es zu lange her ist.
 *
 *   node werkzeuge/gedaechtnis-frisch.mjs           Grenze 15 Minuten
 *   node werkzeuge/gedaechtnis-frisch.mjs 30        eigene Grenze
 *
 * WARUM ES DAS GIBT (29.07.2026)
 * ------------------------------
 * Elias hat seinen 30-Minuten-Loop `/gedaechtnis` geloescht, weil drei
 * gleichzeitige Cron-Auftraege zu viele Auslösungen kosteten - unter der
 * Bedingung, dass stattdessen konsequent gespeichert wird. Die Regel dafuer
 * lautete "nach jedem Punkt". Das ist aber KEINE Garantie: dauert ein Punkt
 * 40 Minuten, passiert 40 Minuten lang nichts; bricht er ab, gar nichts.
 *
 * Sein Wunsch: "es muss garantiert immer aktuallisiert sein". Eine Zusicherung
 * an eine Uhr zu haengen kostet Auslösungen; sie an eine MESSUNG zu haengen
 * kostet nichts. Dieses Skript misst das Alter des juengsten Schreibvorgangs im
 * Tresor und sagt, ob geschrieben werden muss.
 *
 * Bewusst nur Lesen von Zeitstempeln - es schreibt selbst nichts. Was in den
 * Tresor gehoert, entscheidet der Inhalt, nicht ein Skript. */

import fs from 'node:fs';
import path from 'node:path';

const TRESOR = 'G:\\1. Workspace\\Obsidian\\Gedächtnis\\Elias Gedächtnis';
/* Nicht `Number(x) || 15` - das schluckt eine ausdrueckliche 0 und nimmt
   stillschweigend 15. Beim ersten Test genau so aufgetreten. */
const roh = process.argv[2];
const GRENZE_MIN = roh !== undefined && Number.isFinite(Number(roh)) ? Number(roh) : 15;

function alleNotizen(ordner){
  const raus = [];
  for (const e of fs.readdirSync(ordner, { withFileTypes: true })){
    const p = path.join(ordner, e.name);
    if (e.isDirectory()) raus.push(...alleNotizen(p));
    else if (e.name.endsWith('.md')) raus.push(p);
  }
  return raus;
}

if (!fs.existsSync(TRESOR)){
  console.error(`Tresor nicht gefunden: ${TRESOR}`);
  process.exit(1);
}

const notizen = alleNotizen(TRESOR)
  .map(p => ({ p, m: fs.statSync(p).mtimeMs }))
  .sort((a, b) => b.m - a.m);

const juengste = notizen[0];
const alterMin = (Date.now() - juengste.m) / 60000;
const kurz = p => path.relative(TRESOR, p);

console.log(`Zuletzt geschrieben: ${kurz(juengste.p)}`);
console.log(`  vor ${alterMin.toFixed(1)} Minuten  (Grenze: ${GRENZE_MIN})`);
console.log('');
console.log('Die drei jüngsten:');
for (const n of notizen.slice(0, 3))
  console.log(`  ${((Date.now() - n.m) / 60000).toFixed(1).padStart(6)} min  ${kurz(n.p)}`);

/* ---------- Die JÜNGSTE ist der falsche Maßstab (21.08.2026) --------------

   ⛔ BEFUND: bis heute maß dieses Werkzeug das Alter der jüngsten Datei im
   ganzen Tresor. Regel 2 verlangt aber ZWEI Orte — den Arbeitsstand in der
   Projekt-To-Do UND die Erkenntnis in der zuständigen Notiz. Wer nur einen
   davon schreibt, bekam trotzdem „aktuell genug".

   ⭐ Schlimmer: die Frische konnte von einer Datei kommen, die ich gar nicht
   geschrieben habe. Am 21.08.2026 stand in der Liste mehrfach
   `Routinen-Status.md` — geschrieben von einer anderen Routine. Hätte ich
   nichts gesichert und nur sie wäre angefasst worden, wäre die Meldung grün
   gewesen: eine Prüfung, die bestehen kann, ohne dass das Geprüfte passiert
   ist. [[pruefung_fragt_einen_stellvertreter_ab]]

   Deshalb werden die beiden Pflichtdateien jetzt EINZELN bewertet. Die
   Gesamtmeldung oben bleibt als Übersicht stehen. */
const PFLICHT = [
  ['Arbeitsstand', path.join(TRESOR, '03 - Projekte', 'To-Do Vokabeltrainer.md')],
  ['Erkenntnis',   path.join(TRESOR, '03 - Projekte', 'Vokabeltrainer-Arabisch.md')]
];

console.log('');
console.log('Die zwei Pflichtstellen aus Regel 2:');
let ueberfaellig = [];
for (const [rolle, datei] of PFLICHT){
  if (!fs.existsSync(datei)){
    console.log(`  ⛔ ${rolle.padEnd(12)} FEHLT: ${kurz(datei)}`);
    ueberfaellig.push(`${rolle} (Datei fehlt)`);
    continue;
  }
  const alt = (Date.now() - fs.statSync(datei).mtimeMs) / 60000;
  const zeichen = alt > GRENZE_MIN ? '❌' : '✅';
  console.log(`  ${zeichen} ${rolle.padEnd(12)} ${alt.toFixed(1).padStart(6)} min   ${kurz(datei)}`);
  if (alt > GRENZE_MIN) ueberfaellig.push(`${rolle} (${alt.toFixed(0)} min)`);
}

if (ueberfaellig.length){
  console.log('');
  console.log(`❌ ÜBERFÄLLIG — ${ueberfaellig.join(', ')}.`);
  console.log('   Regel 2 verlangt BEIDE Orte: den Arbeitsstand in der Projekt-To-Do');
  console.log('   und die Erkenntnis in der zuständigen Notiz. Eine von beiden allein');
  console.log('   genügt nicht — die To-Do ist zum Wegwerfen, die Notiz bleibt.');
  console.log('   Jetzt schreiben, BEVOR weitergearbeitet wird. Auch wenn der laufende');
  console.log('   Punkt noch nicht fertig ist: dann eben der Zwischenstand.');
  process.exit(2);
}

console.log('');
console.log('✅ Aktuell genug — beide Pflichtstellen frisch.');
process.exit(0);
