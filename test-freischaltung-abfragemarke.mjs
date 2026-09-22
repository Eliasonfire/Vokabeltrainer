/* test-freischaltung-abfragemarke.mjs — bewacht EINE Zusicherung von
 * `werkzeuge/vorrat.mjs`:
 *
 *     Eine Abfrage, die nichts geändert hat, ist trotzdem eine Abfrage.
 *
 * ==========================================================================
 * ⛔⛔ DER ANLASS (gefunden im Wartungslauf am 13.09.2026, behoben 15.09.)
 *
 * Der Lauf hatte `get_unlocked_chapters` an dem Tag abgefragt. Weil die Liste
 * dieselbe blieb, stieg `vorrat.mjs` mit `process.exit(0)` aus, ohne js/kern.js
 * anzufassen — dort stand weiter „abgefragt am 19.8.2026". Und `--knapp`
 * hängte daran die Warnung „⚠️ 25 Tage alt, die Mi/So-Abfrage hat ausgesetzt".
 *
 * **Die war falsch: die Abfrage lief.** Eine Warnung, die bei jedem Lauf ohne
 * Änderung erscheint, wird beim dritten Mal überlesen — und dann auch dort, wo
 * sie recht hat. [[kennzeichen_mit_zwei_ursachen]]
 *
 * ⛔ Der Fix schreibt das Abfragedatum NICHT in js/kern.js: das ist eine
 * ausgelieferte Datei, und zweimal die Woche eine neue App-Version wegen eines
 * Kommentars wäre Auslieferung ohne Gegenwert. Es steht in
 * `werkzeuge/freischaltung-abfrage.json` daneben; gelesen wird das jüngere von
 * beiden Daten.
 *
 * ==========================================================================
 * ⭐ WAS DIESER TEST PRÜFT — und was ausdrücklich nicht
 *
 *   1. Mit frischer Marke verschwindet die Alterswarnung.
 *   2. OHNE Marke kommt sie zurück (sonst prüfte der Test nichts —
 *      [[pruefwerkzeug_mit_eingebauter_antwort]]).
 *   3. Eine kaputte Marke hält den Lauf nicht an, sondern fällt auf js/kern.js
 *      zurück.
 *
 * ⛔ NICHT geprüft wird der Abruf bei arabicroots selbst. Der braucht Elias'
 * Zugang, ein Netz und einen gültigen Token — ein Test, der davon abhängt, ist
 * an einem schlechten Tag rot, ohne dass hier etwas kaputt ist.
 *
 * ⚠️ Der Test SCHREIBT die Marke und stellt danach den Vorzustand wieder her —
 * auch wenn er selbst abbricht (finally). Lag vorher keine Marke da, ist danach
 * wieder keine da.
 *
 * Aufruf:  node test-freischaltung-abfragemarke.mjs
 * Exit 0 = alles wie zugesichert · 1 = die Zusicherung hält nicht
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const REPO = path.dirname(fileURLToPath(import.meta.url));
const MARKE = path.join(REPO, 'werkzeuge', 'freischaltung-abfrage.json');

/* ⛔ EINE KOPIE von js/kern.js mit ALTEM Abfragedatum (seit 22.09.2026).
   Der Test setzte voraus, dass das Datum in der echten Datei älter als acht
   Tage ist. Seit die Routine „neue Kapitel" dort das heutige einträgt, stimmte
   das nicht mehr: drei Zusicherungen wurden rot, ohne dass etwas kaputt war,
   und die Routine durfte deshalb nicht ausliefern. vorrat.mjs liest die Kopie
   über VORRAT_KERN_DATEI; die echte Datei bleibt unberührt. */
const ALTES_DATUM = '19.8.2026';
const TEMP = fs.mkdtempSync(path.join(os.tmpdir(), 'abfragemarke-'));
const KERN_KOPIE = path.join(TEMP, 'kern.js');
const kernText = fs.readFileSync(path.join(REPO, 'js', 'kern.js'), 'utf8')
  .replace(/abgefragt am [0-9.]+/g, 'abgefragt am ' + ALTES_DATUM);
fs.writeFileSync(KERN_KOPIE, kernText, 'utf8');

let fehler = 0;
const pruefe = (was, ist, soll) => {
  if (ist === soll) console.log('  ok   ' + was);
  else { fehler++; console.log('  ⛔   ' + was + ': ' + JSON.stringify(ist)
    + ' (erwartet ' + JSON.stringify(soll) + ')'); }
};

function knapp(){
  try {
    return execFileSync(process.execPath, ['werkzeuge/vorrat.mjs', '--knapp'],
      { encoding: 'utf8', cwd: REPO, maxBuffer: 20e6,
        env: { ...process.env, VORRAT_KERN_DATEI: KERN_KOPIE } });
  } catch (e){ return String(e.stdout || '') + String(e.stderr || ''); }
}

const WARNUNG = 'die Mi/So-Abfrage hat ausgesetzt';

/* Vorzustand sichern — er wird in JEDEM Fall wiederhergestellt. */
const gabEsSchon = fs.existsSync(MARKE);
const vorher = gabEsSchon ? fs.readFileSync(MARKE, 'utf8') : null;

try {
  console.log('--- Eine Abfrage ohne Aenderung ist trotzdem eine Abfrage ---');
  console.log('');
  /* Ohne diese Probe prüfte der Test still wieder das echte Datum. */
  pruefe('die Kopie von js/kern.js traegt das alte Datum',
    kernText.includes('abgefragt am ' + ALTES_DATUM), true);
  console.log('');

  /* ---- 1. Ohne Marke: die Warnung MUSS da sein ---- */
  if (gabEsSchon) fs.unlinkSync(MARKE);
  const ohne = knapp();
  console.log('Ohne Abfragemarke:');
  pruefe('die Alterswarnung erscheint', ohne.includes(WARNUNG), true);

  /* ---- 2. Mit frischer Marke: die Warnung MUSS weg sein ---- */
  fs.writeFileSync(MARKE, JSON.stringify({
    _zweck: 'Probe von test-freischaltung-abfragemarke.mjs',
    abgefragt: new Date().toLocaleDateString('de-DE'),
    quelle: 'test',
  }, null, 2) + '\n', 'utf8');
  const mit = knapp();
  console.log('');
  console.log('Mit frischer Abfragemarke:');
  pruefe('die Alterswarnung ist weg', mit.includes(WARNUNG), false);
  pruefe('dafuer steht da, dass die Liste unveraendert ist',
    mit.includes('Liste unver'), true);
  /* ⚠️ Und die Zahlen dürfen sich NICHT geändert haben — die Marke sagt etwas
     über das Datum, nichts über den Vorrat. */
  const zahl = (s) => (s.match(/(\d+) von (\d+) freigeschalteten/) || []).slice(1, 3).join('/');
  pruefe('die Vorratszahlen bleiben gleich', zahl(mit), zahl(ohne));

  /* ---- 3. Kaputte Marke: kein Abbruch, Rückfall auf js/kern.js ---- */
  fs.writeFileSync(MARKE, '{ das ist kein JSON', 'utf8');
  const kaputt = knapp();
  console.log('');
  console.log('Mit kaputter Abfragemarke:');
  pruefe('der Lauf bricht nicht ab (Vorratszeile kommt)',
    kaputt.includes('Vorrat:'), true);
  pruefe('faellt auf js/kern.js zurueck (Warnung wieder da)',
    kaputt.includes(WARNUNG), true);
  pruefe('sagt selbst, dass die Marke unlesbar war',
    kaputt.includes('Abfragemarke unlesbar'), true);

} finally {
  /* ⛔ Der Vorzustand wird IMMER wiederhergestellt — auch wenn oben etwas
     geworfen hat. Ein Test, der Müll hinterlässt, macht den nächsten Lauf
     unbrauchbar. [[leere_datei_besteht_jeden_test]] */
  if (vorher === null){ if (fs.existsSync(MARKE)) fs.unlinkSync(MARKE); }
  else fs.writeFileSync(MARKE, vorher, 'utf8');
  fs.rmSync(TEMP, { recursive: true, force: true });
  console.log('');
  console.log('  (Vorzustand wiederhergestellt: '
    + (vorher === null ? 'keine Marke' : 'Marke wie vorher') + ')');
}

console.log('');
if (fehler){
  console.log('⛔ ' + fehler + ' Zusicherung(en) halten nicht.');
  process.exit(1);
}
console.log('✔ alles wie zugesichert');
