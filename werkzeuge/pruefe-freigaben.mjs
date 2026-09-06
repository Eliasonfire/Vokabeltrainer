#!/usr/bin/env node
/* pruefe-freigaben.mjs — darf die Wartungsroutine überhaupt, was der Prompt ihr sagt?
 *
 * ⛔ WARUM ES DIESE DATEI GIBT (07.09.2026)
 *
 * Elias, nachdem der Sammellauf in den Wartungs-Prompt eingetragen war:
 *   „wichtig bei denen ist das die mich beim ersten start (wenn nötig) nach
 *    allen berechtigungen fragen und ich ihnen einmal diese gebe und sie
 *    danach nichts mehr an berechtigungen brauchen. ich will nicht die ganze
 *    zeit berechtigungen geben müssen, beim ersten lauf das muss genügen"
 *
 * Und genau daran fehlte es: `node werkzeuge/alle-pruefer.mjs` stand seit
 * derselben Stunde im Prompt, aber NICHT in `allowedTools`. Der Kopf von
 * routines.json sagt dazu: *„alles was hier nicht steht, wird im -p-Modus
 * automatisch abgelehnt"*.
 *
 * ⛔ Das ist die stille Sorte Ausfall: eine abgelehnte Anweisung lässt die
 * Routine nicht abstürzen. Sie überspringt und meldet grün. Der Prompt sagt
 * „führe aus", die Berechtigung sagt nein, und der Bericht sagt nichts.
 * [[anleitung_ohne_berechtigung]] [[ausfall_ist_unsichtbar_gebaut]]
 *
 * ⚠️ Geprüft wird die eine Richtung, die schadet: ein Befehl IM PROMPT ohne
 * Freigabe. Die Gegenrichtung (Freigabe ohne Befehl) ist harmlos — sie kostet
 * nichts und hält einen Weg offen, den ein späterer Lauf brauchen kann.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER   = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.resolve(HIER, '..');
const PROMPT   = path.resolve(WURZEL, '..', 'Automation', 'prompts', 'vokabeltrainer-wartung.md');
const ROUTINEN = path.resolve(WURZEL, '..', 'Automation', 'routines.json');

let fehler = 0;
const sag = (ok, text) => { if (!ok) fehler++; console.log('  ' + (ok ? 'ok  ' : '⛔  ') + text); };

console.log('=== Befehle im Wartungs-Prompt gegen allowedTools ===\n');

if (!fs.existsSync(PROMPT) || !fs.existsSync(ROUTINEN)) {
  console.log('  ⓘ  Prompt oder routines.json nicht gefunden — ungeprüft.');
  console.log('     ' + PROMPT);
  process.exit(0);
}

const prompt = fs.readFileSync(PROMPT, 'utf8');
let freigaben = [];
try {
  const j = JSON.parse(fs.readFileSync(ROUTINEN, 'utf8'));
  freigaben = (j.routines && j.routines['vokabeltrainer-wartung']
            && j.routines['vokabeltrainer-wartung'].allowedTools) || [];
} catch (e) {
  console.log('  ⛔  routines.json nicht lesbar: ' + e.message);
  process.exit(1);
}

/* ⛔ Die Befehle NUR aus den Codeblöcken lesen, nicht aus dem Fließtext.
   Der Prompt nennt Werkzeuge auch erklärend („`arbeit.mjs` stand bis dahin
   nur in der Berechtigungsliste") — solche Erwähnungen sind keine Aufrufe,
   und wer sie mitzählt, erzeugt eine Liste aus Fehlalarmen.
   [[stichworttreffer_im_kommentar]] */
const bloecke = [...prompt.matchAll(/```[a-z]*\n([\s\S]*?)```/g)].map(m => m[1]);
const befehle = new Set();
for (const b of bloecke)
  for (const zeile of b.split(/\r?\n/)) {
    const z = zeile.trim();
    const m = z.match(/^(?:npx |)node\s+([^\s|>&;]+)/);
    if (m) befehle.add('node ' + m[1]);
  }
/* ⛔⛔ UND INLINE-CODE. Der erste Anlauf las NUR Codebloecke — und uebersah
   damit ausgerechnet den Fall, fuer den dieser Pruefer gebaut wurde: der
   Sammellauf steht im Prompt als Inline-Code mitten im Satz. Der Stoertest
   (Freigabe entfernen) blieb gruen, der Pruefer pruefte nichts.

   ⚠️ Nur mit fuehrendem "node ": im Fliesstext stehen Werkzeugnamen auch ohne
   ("arbeit.mjs stand bis dahin nur in der Berechtigungsliste"), und das sind
   Erwaehnungen, keine Aufrufe. [[leere_liste_ist_keine_messung]] */
const INLINE = new RegExp(String.fromCharCode(96) + '\\s*(?:npx |)node\\s+([^\\s' + String.fromCharCode(96) + '|>&;]+)', 'g');
for (const m of prompt.matchAll(INLINE)) befehle.add('node ' + m[1]);

/* Passt ein Befehl auf ein Freigabemuster? `Bash(node x.js:*)` deckt
   „node x.js" mit beliebigen Argumenten ab. */
const gedeckt = (befehl) => freigaben.some(f => {
  const m = f.match(/^Bash\((.*?)(?::\*)?\)$/);
  if (!m) return false;
  const muster = m[1];
  return befehl === muster || befehl.startsWith(muster + ' ') || muster.startsWith(befehl);
});

const offen = [...befehle].filter(b => !gedeckt(b)).sort();
console.log('  ' + befehle.size + ' node-Befehle in Codeblöcken · ' + freigaben.length + ' Freigaben');
sag(!offen.length, offen.length
  ? offen.length + ' Befehl(e) stehen im Prompt, aber NICHT in allowedTools:\n        ' + offen.join('\n        ')
  : 'Jeder Befehl aus dem Prompt ist freigegeben.');

/* Störtest: ein erfundener Befehl muss auffallen. */
console.log('');
sag(!gedeckt('node werkzeuge/gibtesnicht.mjs'),
    'Störtest: ein nicht freigegebener Befehl wird als offen erkannt');
sag(gedeckt('node validate.js'),
    'Störtest: ein freigegebener Befehl gilt als gedeckt');

console.log('');
if (fehler) {
  console.log('⛔ ' + fehler + ' Befund(e). Eine abgelehnte Anweisung bricht die Routine NICHT ab —');
  console.log('   sie überspringt und meldet grün. Deshalb ist das hier ein Fehler, kein Hinweis.');
  process.exit(1);
}
console.log('✅ Die Routine darf, was der Prompt ihr sagt.');
process.exit(0);
