/* pruefe-sammellauf.mjs — steht jeder Pruefer auch im Sammellauf?
 * ==========================================================================
 *
 * Aufruf:  node werkzeuge/pruefe-sammellauf.mjs
 * Exitcode 0 = jeder gefundene Pruefer ist eingetragen oder benannt ausgenommen
 *          1 = ein Pruefer liegt herum, ohne dass ihn jemand startet
 *          3 = alle-pruefer.mjs nicht lesbar
 *
 * WOZU
 *
 * In der Nacht auf den 21.08.2026 kamen SECHZEHN Eintraege in
 * werkzeuge/alle-pruefer.mjs dazu — acht Pruefstaende, sieben Eichungen und
 * ein neuer Pruefer. Alle waren vorher gebaut, gepusht und nie gestartet
 * worden, und keiner hat es gemerkt. Bei sechzehn Faellen aus demselben
 * Grund ist die Einzelreparatur nicht mehr die Antwort.
 * [[allgemeine_regel_statt_listeneintrag]] [[werkzeug_ohne_aufrufer]]
 *
 * Diese Pruefung verhindert den siebzehnten: wer einen Pruefer anlegt und
 * das Eintragen vergisst, erfaehrt es beim naechsten Sammellauf.
 *
 * ⛔ SIE PRUEFT NUR DEN SAMMELLAUF, nicht die Wartungsroutine. Der
 * Wartungs-Prompt (Automation/prompts/) fuehrt eine EIGENE Einzelliste und
 * kennt alle-pruefer.mjs gar nicht — dort fehlen dieselben sechzehn. Das
 * laesst sich hier nicht beheben: der Prompt liegt ausserhalb des
 * Vokabeltrainer-Ordners. Es steht in Elias' To-Do.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER   = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.resolve(HIER, '..');
const SAMMEL = path.join(HIER, 'alle-pruefer.mjs');

if (!fs.existsSync(SAMMEL)){
  console.log('⛔ werkzeuge/alle-pruefer.mjs nicht gefunden.');
  process.exit(3);
}
const quelle = fs.readFileSync(SAMMEL, 'utf8');

/* ⚠️ Die beiden Listen getrennt lesen, nicht die ganze Datei nach dem Namen
   durchsuchen. Ein blosses `quelle.includes(name)` haelt auch einen Namen im
   KOMMENTAR fuer einen Eintrag — und in dieser Datei stehen etliche Namen in
   Erklaerungen. [[stichworttreffer_im_kommentar]] */
const holListe = (name) => {
  const a = quelle.indexOf('const ' + name);
  if (a < 0) return null;
  const auf = quelle.indexOf('[', a);
  const zu  = quelle.indexOf('];', auf);
  if (auf < 0 || zu < 0) return null;
  return new Set([...quelle.slice(auf, zu).matchAll(/'([^']+\.(?:js|mjs))'/g)].map(m => m[1]));
};

const eingetragen = holListe('PRUEFER');
const imBrowser   = holListe('NUR_IM_BROWSER');
if (!eingetragen){
  console.log('⛔ In alle-pruefer.mjs steht keine Liste `const PRUEFER = [...]` mehr.');
  console.log('   Diese Pruefung kann dann nicht sagen, was eingetragen ist.');
  process.exit(1);
}

/* Was zaehlt als Pruefer? Die drei Namensformen, die das Projekt benutzt. */
const gefunden = [];
for (const f of fs.readdirSync(WURZEL))
  if (/^(pruefe|test)-.*\.(js|mjs)$/.test(f)) gefunden.push(f);
for (const f of fs.readdirSync(HIER))
  if (/^(pruefe|eiche)-.*\.mjs$/.test(f)) gefunden.push('werkzeuge/' + f);

const waisen = [], ausgenommen = [];
for (const rel of gefunden){
  if (eingetragen.has(rel)) continue;
  if (imBrowser && imBrowser.has(rel)){ ausgenommen.push(rel); continue; }
  /* Das Sammelwerkzeug selbst und diese Pruefung sind keine Eintraege — sie
     WAEREN sonst ihre eigenen Waisen. */
  if (rel === 'werkzeuge/alle-pruefer.mjs' || rel === 'werkzeuge/pruefe-sammellauf.mjs') continue;
  waisen.push(rel);
}

console.log('');
console.log('=== Pruefer im Projekt gegen den Sammellauf ===');
console.log('');
console.log('  ' + gefunden.length + ' gefunden · ' + eingetragen.size + ' eingetragen · '
  + ausgenommen.length + ' benannt ausgenommen (nur im Browser)');
if (ausgenommen.length) ausgenommen.forEach(r => console.log('      ⓘ  ' + r));
console.log('');

if (waisen.length){
  waisen.forEach(r => console.log('  ⛔  ' + r + ' — liegt im Projekt, steht aber nicht im Sammellauf'));
  console.log('');
  console.log('⛔ ' + waisen.length + ' Pruefer laeuft/laufen im Sammellauf nicht mit.');
  console.log('   Entweder in werkzeuge/alle-pruefer.mjs eintragen, oder — wenn er');
  console.log('   dort NICHT hingehoert — mit Begruendung in NUR_IM_BROWSER.');
  console.log('   Stillschweigend liegenlassen ist die dritte Moeglichkeit und die');
  console.log('   schlechteste: er sieht aus, als wuerde er pruefen.');
  process.exit(1);
}
console.log('✅ Jeder Pruefer im Projekt ist eingetragen oder benannt ausgenommen.');
process.exit(0);
