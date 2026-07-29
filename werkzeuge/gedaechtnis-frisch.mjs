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

const TRESOR = 'F:\\Workspace\\Obsidian\\Gedächtnis\\Elias Gedächtnis';
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

if (alterMin > GRENZE_MIN){
  console.log('');
  console.log(`❌ ÜBERFÄLLIG — seit ${alterMin.toFixed(0)} Minuten nichts geschrieben.`);
  console.log('   Jetzt den aktuellen Stand in die zuständige Notiz schreiben,');
  console.log('   BEVOR weitergearbeitet wird. Auch wenn der laufende Punkt noch');
  console.log('   nicht fertig ist: dann eben der Zwischenstand mit dem, was schon');
  console.log('   feststeht, und was noch offen ist.');
  process.exit(2);
}

console.log('');
console.log('✅ Aktuell genug.');
process.exit(0);
