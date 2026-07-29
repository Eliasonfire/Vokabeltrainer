/* arbeit.mjs -- festhalten, WAS gerade angefangen wurde, damit ein Abbruch
 * nicht als fertiger Stand missverstanden wird.
 *
 *   node werkzeuge/arbeit.mjs --beginne "Schriftgroessen vereinheitlichen" \
 *        --dateien index.html,js/lernen.js --schritte 3
 *   node werkzeuge/arbeit.mjs --schritt 2 "Lernkarte umgestellt"
 *   node werkzeuge/arbeit.mjs --fertig
 *   node werkzeuge/arbeit.mjs                  <- Stand pruefen (Aufwacher!)
 *
 * WARUM ES DAS GIBT (29.07.2026)
 * ------------------------------
 * Ein unbeaufsichtigter Lauf kann jederzeit sterben - Nutzungslimit, Absturz,
 * geschlossenes Fenster. Der naechste Lauf sieht dann `git status` mit ein paar
 * geaenderten Dateien und weiss NICHT, ob das ein fertiger Stand ist oder
 * Schritt 2 von 5. Genau diese Frage beantwortet keine der vorhandenen
 * Pruefungen:
 *
 *   git status      sagt WAS sich geaendert hat, nicht ob es fertig gemeint war
 *   validate.js     sagt ob der Zustand STIMMIG ist, nicht ob er VOLLSTAENDIG ist
 *
 * Der Unterschied ist real. Am 29.07.26 wurde `formen()` in js/kern.js angelegt
 * und aus js/irab.js aufgerufen; jede Datei fuer sich war vollstaendig
 * geschrieben, der Zustand trotzdem kaputt (node pruefe-saetze.js starb). Eine
 * Unterbrechung genau dazwischen haette wie normale Arbeit ausgesehen.
 *
 * Die Marke liegt in .arbeit.json (gitignored) und ueberlebt jeden Abbruch,
 * weil sie VOR der Arbeit geschrieben wird. Ist sie beim naechsten Start noch
 * da, war der letzte Lauf nicht fertig - dann erst aufraeumen, dann weiter. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const WURZEL = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MARKE = path.join(WURZEL, '.arbeit.json');

const args = process.argv.slice(2);
const wert = n => { const i = args.indexOf(n); return i === -1 ? undefined : args[i + 1]; };
const jetzt = () => new Date().toISOString();

function gitStatus(){
  try { return execFileSync('git', ['status', '--short'], { cwd: WURZEL, encoding: 'utf8' }).trim(); }
  catch { return '(git nicht verfuegbar)'; }
}

if (args.includes('--beginne')){
  if (fs.existsSync(MARKE)){
    const alt = JSON.parse(fs.readFileSync(MARKE, 'utf8'));
    console.error(`Es liegt schon eine offene Arbeit vor: "${alt.was}" (seit ${alt.begonnen}).`);
    console.error('Erst --fertig melden oder den Stand aufraeumen, dann neu beginnen.');
    process.exit(1);
  }
  const marke = {
    was: wert('--beginne'),
    begonnen: jetzt(),
    dateien: (wert('--dateien') || '').split(',').map(s => s.trim()).filter(Boolean),
    schritteGesamt: Number(wert('--schritte')) || null,
    schritt: 0,
    verlauf: []
  };
  fs.writeFileSync(MARKE, JSON.stringify(marke, null, 2) + '\n', 'utf8');
  console.log(`Angefangen: ${marke.was}`);
  if (marke.dateien.length) console.log(`  betrifft: ${marke.dateien.join(', ')}`);
  process.exit(0);
}

if (args.includes('--schritt')){
  if (!fs.existsSync(MARKE)){ console.error('Keine offene Arbeit. Erst --beginne.'); process.exit(1); }
  const m = JSON.parse(fs.readFileSync(MARKE, 'utf8'));
  m.schritt = Number(wert('--schritt')) || m.schritt + 1;
  m.verlauf.push({ schritt: m.schritt, zeit: jetzt(), text: args[args.indexOf('--schritt') + 2] || '' });
  fs.writeFileSync(MARKE, JSON.stringify(m, null, 2) + '\n', 'utf8');
  console.log(`Schritt ${m.schritt}${m.schritteGesamt ? ' von ' + m.schritteGesamt : ''} vermerkt.`);
  process.exit(0);
}

if (args.includes('--fertig')){
  if (!fs.existsSync(MARKE)){ console.log('Es war nichts offen.'); process.exit(0); }
  const m = JSON.parse(fs.readFileSync(MARKE, 'utf8'));
  fs.unlinkSync(MARKE);
  console.log(`Abgeschlossen: ${m.was}`);
  process.exit(0);
}

/* Kein Argument: Stand pruefen. Das ist der Aufruf fuer den Aufwacher. */
if (!fs.existsSync(MARKE)){
  const st = gitStatus();
  console.log('✅ Keine offene Arbeit — der letzte Lauf hat sauber abgeschlossen.');
  if (st){
    console.log('\nEs liegen trotzdem ungespeicherte Aenderungen im Repo:');
    console.log(st);
    console.log('\nDas ist normal, wenn zuletzt bewusst ohne Commit aufgehoert wurde.');
    console.log('Vor dem Weiterbauen einmal `node validate.js` laufen lassen.');
  }
  process.exit(0);
}

const m = JSON.parse(fs.readFileSync(MARKE, 'utf8'));
const alterMin = Math.round((Date.now() - new Date(m.begonnen).getTime()) / 60000);
console.log('⚠️  ABGEBROCHENE ARBEIT GEFUNDEN — nicht einfach weiterbauen.\n');
console.log(`  Was:       ${m.was}`);
console.log(`  Begonnen:  ${m.begonnen}  (vor ${alterMin} Minuten)`);
console.log(`  Stand:     Schritt ${m.schritt}${m.schritteGesamt ? ' von ' + m.schritteGesamt : ''}`);
if (m.dateien.length) console.log(`  Dateien:   ${m.dateien.join(', ')}`);
if (m.verlauf.length){
  console.log('  Verlauf:');
  for (const v of m.verlauf) console.log(`    ${v.schritt}. ${v.text} (${v.zeit})`);
}
console.log('\n  Git-Stand:');
console.log((gitStatus() || '    (keine Aenderungen)').split('\n').map(z => '    ' + z).join('\n'));
console.log(`
  So geht es weiter:
    1. node validate.js  — ist der Zustand ueberhaupt stimmig?
    2. Die Dateien oben ansehen und entscheiden: fertig machen oder zuruecknehmen.
       NICHT den naechsten Punkt anfangen, solange das offen ist.
    3. Danach: node werkzeuge/arbeit.mjs --fertig`);
process.exit(2);
