/* Holt die Seitengrenzen des Muṣḥaf und schreibt sie nach quran-seiten.js.
 *
 * WARUM EIN WERKZEUG UND NICHT VON HAND:
 * Elias' Punkt 6 verlangt im Listenmodus eine Seitentrennung "wie bei
 * quran.com" — am Seitenende die Seitenzahl mittig. Welche Ayah auf welcher
 * Seite anfaengt, ist eine harte, nachpruefbare Tatsache des Muṣḥaf
 * (Madina-Ausgabe, 604 Seiten) und steht in KEINER Datei dieses Projekts:
 * quran-text.js kennt nur [arabisch, deutsch] je Vers, surah-data.js nur
 * Verszahl und Juz. Abtippen oder schaetzen waere erfunden (E.1). Also derselbe
 * Weg wie bei werkzeuge/juz-holen.mjs am 04.08.2026: von einer Quelle holen,
 * gegen eine zweite pruefen, nur bei Deckungsgleichheit schreiben.
 *
 * Quelle: https://api.alquran.cloud/v1/quran/quran-uthmani — dieselbe API, aus
 * der am 04.08. die Surentitel mit Taschkil kamen. Sie liefert jede der 6236
 * Ayat mit `page`, `numberInSurah` und der Sure dazu, in EINER Antwort.
 *
 * DREI GEGENPROBEN, ohne die nichts geschrieben wird:
 *   1. 114 Suren, 6236 Ayat insgesamt.
 *   2. Die Verszahl je Sure muss genau die `verses`-Angabe aus surah-data.js
 *      treffen — das ist der eigentliche Wert: zwei voneinander unabhaengige
 *      Quellen sagen dasselbe, oder es wird nichts uebernommen.
 *   3. Die Seitenzahlen muessen bei 1 anfangen, bei 604 enden und
 *      lueckenlos aufsteigen. Eine fehlende Seite waere ein stiller Fehler,
 *      der im Leser als verschwundene Trennlinie erschiene.
 *
 * AUSGABE: eine Zeile je Seite, [sure, ayah] = wo die Seite ANFAENGT. 604
 * Paare statt 6236 Einzelzuordnungen — der Leser braucht nur die Grenzen.
 *
 * Aufruf:  node werkzeuge/seiten-holen.mjs              (nur pruefen)
 *          node werkzeuge/seiten-holen.mjs --schreiben
 *
 * ⚠️ Kein process.exit() nach dem fetch: unter Windows bricht node dann mit
 *    einer libuv-Assertion ab, obwohl das Skript vollstaendig durchgelaufen
 *    ist (belegt am 29.07.2026). Stattdessen process.exitCode setzen.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const SURAH = path.join(HIER, '..', 'surah-data.js');
const ZIEL  = path.join(HIER, '..', 'quran-seiten.js');
const SCHREIBEN = process.argv.includes('--schreiben');

const SURAH_DATA = new Function(fs.readFileSync(SURAH, 'utf8') + ';return SURAH_DATA;')();

console.log('Hole den Volltext mit Seitenangaben …');
const antwort = await fetch('https://api.alquran.cloud/v1/quran/quran-uthmani');
if (!antwort.ok){
  console.error('HTTP ' + antwort.status + ' — nichts geschrieben.');
  process.exitCode = 1;
} else {
  const daten = await antwort.json();
  const suren = daten?.data?.surahs;
  let fehler = [];

  /* --- Gegenprobe 1: Umfang --- */
  const ayatGesamt = (suren || []).reduce((n, s) => n + s.ayahs.length, 0);
  if (!Array.isArray(suren) || suren.length !== 114)
    fehler.push(`114 Suren erwartet, ${suren ? suren.length : 0} bekommen`);
  if (ayatGesamt !== 6236)
    fehler.push(`6236 Ayat erwartet, ${ayatGesamt} bekommen`);

  /* --- Gegenprobe 2: Verszahl je Sure gegen surah-data.js --- */
  let gleich = 0;
  const abweichend = [];
  for (const s of suren || []){
    const eigen = SURAH_DATA.find(x => x.id === s.number);
    if (!eigen){ abweichend.push(`Sure ${s.number} fehlt in surah-data.js`); continue; }
    if (eigen.verses === s.ayahs.length) gleich++;
    else abweichend.push(`Sure ${s.number}: eigen ${eigen.verses}, API ${s.ayahs.length}`);
  }
  console.log(`Verszahl je Sure: ${gleich}/114 deckungsgleich mit surah-data.js.`);
  if (abweichend.length) fehler.push('Abweichungen: ' + abweichend.slice(0, 5).join(' · '));

  /* --- Seitengrenzen bilden --- */
  const anfang = new Map();          // Seite -> [sure, ayah]
  for (const s of suren || [])
    for (const a of s.ayahs)
      if (!anfang.has(a.page)) anfang.set(a.page, [s.number, a.numberInSurah]);

  const seiten = [...anfang.keys()].sort((x, y) => x - y);

  /* --- Gegenprobe 3: lueckenlos 1..604 --- */
  const luecken = [];
  for (let p = 1; p <= 604; p++) if (!anfang.has(p)) luecken.push(p);
  const zuviel = seiten.filter(p => p < 1 || p > 604);
  if (luecken.length) fehler.push(`${luecken.length} fehlende Seiten, erste: ${luecken.slice(0,5).join(', ')}`);
  if (zuviel.length)  fehler.push(`Seiten ausserhalb 1..604: ${zuviel.slice(0,5).join(', ')}`);
  console.log(`Seiten: ${seiten.length} (erwartet 604), von ${seiten[0]} bis ${seiten[seiten.length-1]}.`);

  if (fehler.length){
    console.error('\n⛔ Nicht uebernommen:');
    fehler.forEach(f => console.error('   ' + f));
    process.exitCode = 1;
  } else {
    console.log('\n✅ Alle drei Gegenproben bestanden.');
    console.log('   Seite 1 beginnt bei ' + anfang.get(1).join(':') +
                ', Seite 604 bei ' + anfang.get(604).join(':') + '.');
    if (!SCHREIBEN){
      console.log('   (Nur geprueft. Mit --schreiben wird quran-seiten.js erzeugt.)');
    } else {
      const zeilen = [];
      for (let p = 1; p <= 604; p++){
        const [su, ay] = anfang.get(p);
        zeilen.push(`[${su},${ay}]`);
      }
      const inhalt =
`/* ============== SEITENGRENZEN DES MUṢḤAF (604 Seiten) ==============
   Erzeugt von werkzeuge/seiten-holen.mjs — NICHT von Hand aendern.

   Aufbau: QURAN_SEITEN[n] = [sure, ayah] = wo Seite n+1 ANFAENGT.
   Index 0 ist Seite 1. 604 Paare statt 6236 Einzelzuordnungen: der Leser
   braucht nur die Grenzen, alles dazwischen ergibt sich.

   Quelle: api.alquran.cloud (quran-uthmani), geprueft gegen surah-data.js —
   die Verszahl je Sure war in allen 114 Faellen deckungsgleich, und die
   Seiten laufen lueckenlos von 1 bis 604. Ohne beide Proben schreibt das
   Werkzeug nichts (Qualitaetsstandard E.1: keine Koranangabe ohne Quelle).

   Wofuer: Elias' Punkt 6 vom 10.08.2026 — im Listenmodus soll am Seitenende
   die Seitenzahl mittig stehen, wie bei quran.com.
   ================================================================== */
const QURAN_SEITEN = [
${zeilen.map((z, i) => (i % 8 === 0 ? '  ' : '') + z).reduce((acc, z, i) =>
  acc + z + ((i + 1) % 8 === 0 ? ',\n' : (i === 603 ? '\n' : ',')), '')}];
if (typeof window !== 'undefined') window.QURAN_SEITEN = QURAN_SEITEN;
`;
      fs.writeFileSync(ZIEL, inhalt, 'utf8');
      console.log(`   geschrieben: ${path.basename(ZIEL)} (${(inhalt.length/1024).toFixed(1)} KB)`);
    }
  }
}
