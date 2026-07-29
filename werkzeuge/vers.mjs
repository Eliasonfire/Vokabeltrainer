/* vers.mjs -- einzelne Koranverse ausgeben, ohne quran-text.js zu oeffnen
 *
 * Aufruf:
 *   node werkzeuge/vers.mjs 2:255           ein Vers
 *   node werkzeuge/vers.mjs 2:255-257       ein Bereich
 *   node werkzeuge/vers.mjs 112             eine ganze Sure (bis 20 Verse)
 *   node werkzeuge/vers.mjs 2 --alles       auch lange Suren vollstaendig
 *   node werkzeuge/vers.mjs --suche "hada"  im Text suchen, arabisch oder deutsch
 *   node werkzeuge/vers.mjs --suche "هَذَا" --max 30
 *
 * WARUM ES DAS GIBT (29.07.2026): quran-text.js ist 2,3 MB gross. Wer sie in
 * einen Claude-Kontext laedt, verbraucht dafuer sehr viele Token - und braucht
 * am Ende doch nur einen einzigen Vers. Ueberlegt wurde deshalb, die Datei in
 * 114 Einzeldateien je Sure zu zerlegen. Das wurde VERWORFEN: Der Service
 * Worker cacht heute eine Datei und meldet einen Fehlschlag sichtbar; bei 114
 * Dateien wuerde aus einem lauten Totalausfall ein stiller Teilausfall (siehe
 * sw.js, Promise.allSettled) - ausgerechnet beim Offline-Betrieb, den die Datei
 * ueberhaupt erst ermoeglicht hat. Die Groesse war fuer die App nie ein
 * Problem, nur fuer das Werkzeug drumherum. Also wurde das Werkzeug geaendert
 * und nicht die App.
 *
 * Dieses Skript liest die grosse Datei selbst und gibt nur das Verlangte aus.
 * Die Ausgabe bleibt klein, egal wie gross die Quelle ist.
 *
 * Beruehrt keine Daten aus Elias' arabicroots-Zugang - der Korantext stammt aus
 * frei verwendbaren Quellen (siehe Kopf von quran-text.js). */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.join(HIER, '..');

function ladeAusSkript(datei, name) {
  const pfad = path.join(WURZEL, datei);
  if (!fs.existsSync(pfad)) {
    console.error(`${datei} nicht gefunden (erwartet unter ${pfad}).`);
    process.exit(1);
  }
  const roh = fs.readFileSync(pfad, 'utf8');
  return new Function(`${roh};return ${name};`)();
}

const QURAN_TEXT = ladeAusSkript('quran-text.js', 'QURAN_TEXT');
const SURAH_DATA = ladeAusSkript('surah-data.js', 'SURAH_DATA');

const sureName = n => {
  const s = SURAH_DATA.find(x => x.id === n);
  return s ? `${s.name} (${s.ar})` : `Sure ${n}`;
};

/* Diakritika und die Unicode-Sonderzeichen der Uthmani-Ausgabe wegnehmen,
   damit eine Suche nach "هذا" auch "هَٰذَا" findet. Alif-Varianten und
   Ta marbuta werden zusaetzlich vereinheitlicht - der Lehrer schreibt oft
   ohne, der Korantext immer mit. */
const ohneZeichen = s => s
  .replace(/[ؐ-ًؚ-ٰٟۖ-ࣰۭ-ࣳ]/g, '')
  .replace(/ـ/g, '')
  .replace(/[آأإٱ]/g, 'ا')
  .replace(/ة/g, 'ه')
  .replace(/[ى]/g, 'ي');

const flach = s => ohneZeichen(s).toLowerCase();

function zeigeVers(sure, vers, arabisch, deutsch) {
  console.log(`\n${sure}:${vers}  ${sureName(sure)}`);
  console.log(`  ${arabisch}`);
  console.log(`  ${deutsch}`);
}

function ausgabeSure(sure, von, bis) {
  const verse = QURAN_TEXT[sure];
  if (!verse) {
    console.error(`Sure ${sure} gibt es nicht (1-114).`);
    process.exit(1);
  }
  if (von < 1 || bis > verse.length) {
    console.error(`${sureName(sure)} hat ${verse.length} Verse - ${von}-${bis} liegt ausserhalb.`);
    process.exit(1);
  }
  for (let v = von; v <= bis; v++) {
    const [ar, de] = verse[v - 1];
    zeigeVers(sure, v, ar, de);
  }
  console.log(`\n${bis - von + 1} Vers(e) aus ${sureName(sure)}.`);
}

function suche(begriff, max) {
  const nadel = flach(begriff);
  if (!nadel) {
    console.error('Leerer Suchbegriff.');
    process.exit(1);
  }
  let gefunden = 0, gezeigt = 0;
  for (const sure of Object.keys(QURAN_TEXT).map(Number).sort((a, b) => a - b)) {
    const verse = QURAN_TEXT[sure];
    for (let i = 0; i < verse.length; i++) {
      const [ar, de] = verse[i];
      if (!flach(ar).includes(nadel) && !de.toLowerCase().includes(nadel)) continue;
      gefunden++;
      if (gezeigt < max) { zeigeVers(sure, i + 1, ar, de); gezeigt++; }
    }
  }
  if (!gefunden) {
    console.log(`\nKeine Fundstelle fuer "${begriff}".`);
    console.log('Die Suche vergleicht ohne Vokalzeichen und vereinheitlicht Alif-Varianten,');
    console.log('trifft aber keine Umschrift - "hada" findet هذا NICHT, nur den deutschen Text.');
    return;
  }
  console.log(`\n${gefunden} Fundstelle(n)${gezeigt < gefunden ? `, davon ${gezeigt} gezeigt (mit --max mehr)` : ''}.`);
}

const args = process.argv.slice(2);

if (!args.length || args.includes('--hilfe') || args.includes('-h')) {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0].replace(/^\/\*|^ \* ?/gm, ''));
  process.exit(0);
}

const iSuche = args.indexOf('--suche');
if (iSuche !== -1) {
  const begriff = args[iSuche + 1];
  if (!begriff) { console.error('--suche braucht einen Begriff.'); process.exit(1); }
  const iMax = args.indexOf('--max');
  const max = iMax !== -1 ? Number(args[iMax + 1]) || 10 : 10;
  suche(begriff, max);
  process.exit(0);
}

const ziel = args[0];
const alles = args.includes('--alles');

/* Formen: "2:255", "2:255-257", "112" */
const m = /^(\d+)(?::(\d+)(?:-(\d+))?)?$/.exec(ziel);
if (!m) {
  console.error(`Verstehe "${ziel}" nicht. Erwartet: 2:255 oder 2:255-257 oder 112.`);
  process.exit(1);
}

const sure = Number(m[1]);
const verse = QURAN_TEXT[sure];
if (!verse) { console.error(`Sure ${sure} gibt es nicht (1-114).`); process.exit(1); }

if (m[2] === undefined) {
  if (verse.length > 20 && !alles) {
    console.error(`${sureName(sure)} hat ${verse.length} Verse. Das waere viel Ausgabe.`);
    console.error(`Nimm einen Bereich (z. B. ${sure}:1-20) oder haeng --alles an.`);
    process.exit(1);
  }
  ausgabeSure(sure, 1, verse.length);
} else {
  const von = Number(m[2]);
  ausgabeSure(sure, von, m[3] !== undefined ? Number(m[3]) : von);
}
