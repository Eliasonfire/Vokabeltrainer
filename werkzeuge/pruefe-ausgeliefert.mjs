/* pruefe-ausgeliefert.mjs — laeuft das Repo dem ausgelieferten Stand davon?
 * ==========================================================================
 *
 * Aufruf:  node werkzeuge/pruefe-ausgeliefert.mjs
 * Exitcode 0 = alles, was ausgeliefert ist, entspricht der Arbeitskopie
 *          1 = eine ausgelieferte Datei weicht ab (noch nicht veroeffentlicht)
 *          3 = falsch aufgerufen / .deploy fehlt
 *
 * WOZU
 *
 * `git push` veroeffentlicht hier NICHTS. Ausgeliefert wird ueber
 * werkzeuge/veroeffentlichen.mjs, das .deploy/ aus einer Weissliste baut und
 * hochlaedt. Wer nur pusht, hat ein aktuelles Repo und eine alte Seite —
 * ohne Fehlermeldung, ohne Hinweis. Elias merkt es nur daran, dass eine
 * Aenderung fehlt. [[deploy_meldet_erfolg_ohne_produktion]]
 *
 * Die Lehre stand bisher nur im Gedaechtnis und in CLAUDE.md. Gemessen hat
 * sie niemand: `veroeffentlichen.mjs --pruefen` listet, was hochgeladen
 * WUERDE, vergleicht aber nicht mit dem, was oben liegt.
 *
 * ⛔ ZEILENENDEN WERDEN IGNORIERT, und das ist der Kern der Sache. Am
 * 21.08.2026 meldete ein einfacher Vergleich js/lernen.js als abweichend —
 * `diff` sagte "1,1175c1,1175", also JEDE Zeile. Der Inhalt war Zeichen fuer
 * Zeichen gleich; .deploy hatte LF, die Arbeitskopie CRLF, weil ich die Datei
 * bei Stoertests per cp und git checkout angefasst hatte. Ein Pruefer, der
 * dabei Alarm schlaegt, meldet nach jedem Stoertest einen Fehler, den es
 * nicht gibt — und wird dann weggeklickt.
 * [[zeichen_sind_nicht_bytes]] [[kennzeichen_mit_zwei_ursachen]]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER   = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.resolve(HIER, '..');
const DEPLOY = path.join(WURZEL, '.deploy');

if (!fs.existsSync(DEPLOY)){
  console.log('⛔ .deploy/ gibt es nicht — dann wurde hier noch nie veroeffentlicht.');
  console.log('   Dieser Pruefer kann nichts vergleichen. Kein Befund, kein Freispruch.');
  process.exit(3);
}

/* Nur Textdateien vergleichen. Bilder und Schriften haben keine Zeilenenden,
   dort ist der Bytevergleich richtig — aber sie aendern sich praktisch nie
   und wuerden den Lauf nur langsam machen. */
const TEXT = /\.(js|mjs|cjs|html|json|css|md|webmanifest)$/;

const dateien = [];
(function geh(rel){
  const voll = path.join(DEPLOY, rel);
  for (const e of fs.readdirSync(voll, { withFileTypes: true })){
    const r = rel ? path.join(rel, e.name) : e.name;
    if (e.isDirectory()) geh(r);
    else dateien.push(r.replace(/\\/g, '/'));
  }
})('');

const ohneZeilenenden = s => s.replace(/\r\n/g, '\n');

let abweichend = 0, fehlend = 0, uebersprungen = 0, gleich = 0;
const meldungen = [];

for (const rel of dateien){
  const imDeploy = path.join(DEPLOY, rel);
  const imRepo   = path.join(WURZEL, rel);

  if (!fs.existsSync(imRepo)){
    /* Die Datei liegt oben, aber nicht mehr hier. Das ist kein Fehler an
       sich — sie kann bewusst entfernt worden sein und wartet nur darauf,
       dass beim naechsten Veroeffentlichen auch oben verschwindet. */
    meldungen.push('  ⚠️  ' + rel + ' — liegt ausgeliefert, aber nicht mehr im Projekt');
    fehlend++;
    continue;
  }

  if (!TEXT.test(rel)){ uebersprungen++; continue; }

  const a = ohneZeilenenden(fs.readFileSync(imDeploy, 'utf8'));
  const b = ohneZeilenenden(fs.readFileSync(imRepo, 'utf8'));
  if (a === b){ gleich++; continue; }

  abweichend++;
  /* Sagen, WIE weit sie auseinander sind — eine nackte Abweichungsmeldung
     laesst offen, ob es um eine Zeile oder um die halbe Datei geht. */
  const A = a.split('\n'), B = b.split('\n');
  let n = 0;
  for (let i = 0; i < Math.max(A.length, B.length); i++) if (A[i] !== B[i]) n++;
  meldungen.push('  ⛔  ' + rel + ' — ' + n + ' Zeile(n) anders, NICHT ausgeliefert');
}

console.log('');
console.log('=== Ausgelieferter Stand gegen Arbeitskopie ===');
console.log('');
if (meldungen.length) meldungen.forEach(m => console.log(m));
console.log('');
console.log('  ' + gleich + ' Textdatei(en) deckungsgleich · ' + uebersprungen + ' binaer (nicht verglichen)');
console.log('');

if (abweichend){
  console.log('⛔ ' + abweichend + ' Datei(en) im Repo sind NEUER als das, was Elias hat.');
  console.log('   Auslieferung: CACHE_NAME in sw.js hochzaehlen, dann');
  console.log('   node werkzeuge/veroeffentlichen.mjs --mit-daten');
  process.exit(1);
}
if (fehlend){
  console.log('⚠️  ' + fehlend + ' Datei(en) liegen oben, aber nicht mehr hier — beim');
  console.log('   naechsten Veroeffentlichen verschwinden sie. Kein Fehler.');
}
console.log('✅ Alles Ausgelieferte entspricht der Arbeitskopie (Zeilenenden ignoriert).');
process.exit(0);
