/* test-antwortformat.mjs — verstehen sich Warteseite und Übernahme noch?
 * ==========================================================================
 *
 * Aufruf:  node test-antwortformat.mjs
 * Exitcode 0 = die beiden passen zusammen, 1 = Elias' Antworten verpuffen
 *
 * WOZU
 *
 * Zwischen den beiden Werkzeugen steht eine Vereinbarung, die NIRGENDS
 * aufgeschrieben ist:
 *
 *   wartungsfragen-artefakt.mjs BAUT die Zeile   (Zeile ~457)
 *   antworten-uebernehmen.mjs   LIEST sie        (ein Regex)
 *
 * Aendert jemand eine der beiden Seiten, bricht es still — und zwar nicht
 * fuer eine Antwort, sondern fuer ALLE auf einmal. Elias klickt 78 Woerter
 * durch, kopiert den Text, und nichts kommt an.
 *
 * ⛔ NICHTS NACHBAUEN. Das Muster wird aus BEIDEN Dateien GELESEN:
 * der Bau-Ausdruck aus dem Erzeuger wird ausgewertet, die Regexe werden aus
 * dem Leser herausgeschnitten. Eine abgeschriebene Kopie waere eine dritte
 * Fassung, die mit keiner der beiden mitwandert.
 * [[handliste_neben_echter_quelle]]
 *
 * ⭐ Seit dem 21.08. meldet antworten-uebernehmen.mjs unlesbare Zeilen
 * wenigstens. Das macht den Schaden SICHTBAR — verhindert ihn aber nicht.
 * Diese Pruefung verhindert ihn.
 */
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const ERZEUGER = path.join(HIER, 'werkzeuge', 'wartungsfragen-artefakt.mjs');
const LESER    = path.join(HIER, 'werkzeuge', 'antworten-uebernehmen.mjs');

for (const [p, n] of [[ERZEUGER, 'wartungsfragen-artefakt.mjs'], [LESER, 'antworten-uebernehmen.mjs']]){
  if (!fs.existsSync(p)){
    console.log('⛔ ' + n + ' fehlt — die Kette ist unterbrochen.');
    process.exit(1);
  }
}

const erz = fs.readFileSync(ERZEUGER, 'utf8');
const les = fs.readFileSync(LESER, 'utf8');

/* ---------- 1. Den Bau-Ausdruck aus dem Erzeuger holen ---------- */
const bau = erz.match(/zeilen\.push\(([\s\S]*?)\);/);
if (!bau){
  console.log('⛔ Der Zeilenbau in wartungsfragen-artefakt.mjs ist nicht mehr auffindbar');
  console.log('   (gesucht: zeilen.push(...)). Dann kann diese Pruefung nichts mehr sagen —');
  console.log('   und genau das ist der Befund, kein gruener Durchlauf.');
  process.exit(1);
}

/* ---------- 2. Die Muster aus dem Leser holen ---------- */
const kopfM  = les.match(/const kopf = (\/\^.*?\/)\.exec/);
const zeilM  = les.match(/const m = (\/\^.*?\/)\.exec/);
if (!kopfM || !zeilM){
  console.log('⛔ Die Lesemuster in antworten-uebernehmen.mjs sind nicht mehr auffindbar.');
  process.exit(1);
}
const KOPF  = vm.runInNewContext(kopfM[1]);
const ZEILE = vm.runInNewContext(zeilM[1]);

/* ---------- 3. Eine echte Zeile bauen lassen ---------- */
function baue(a){
  const ctx = {
    el: { dataset: { id: '48402' } },
    ar: 'الْيَوْمُ',
    de: 'heute',
    a
  };
  vm.createContext(ctx);
  return vm.runInContext('(' + bau[1] + ')', ctx);
}

console.log('');
console.log('=== Verstehen sich Warteseite und Uebernahme? ===');
console.log('');

let schlecht = 0;
const sag = (ok, was, dazu) => {
  if (!ok) schlecht++;
  console.log('  ' + (ok ? 'ok  ' : '⛔  ') + was + (dazu ? '   ' + dazu : ''));
};

/* Die Feldueberschrift — ohne sie wird JEDE Zeile "ohne Feldueberschrift". */
sag(KOPF.test('pl:'), 'Feldueberschrift "pl:" wird erkannt');

/* Ein gewoehnlicher Wert. */
const z1 = baue('بُيُوتٌ');
const m1 = ZEILE.exec(z1);
sag(!!m1, 'gewoehnliche Antwort wird gelesen', m1 ? '' : '→ "' + z1 + '"');
if (m1){
  sag(m1[1] === '48402', 'die id kommt richtig an', 'gelesen: "' + m1[1] + '"');
  sag(m1[4] === 'بُيُوتٌ', 'der Wert kommt richtig an', 'gelesen: "' + m1[4] + '"');
}

/* ⭐ Die zwei Sonderantworten. Sie sind KEINE Werte, sondern Steuerwoerter —
   und der Leser erkennt sie an eigenen Mustern. Faellt eines aus, wird aus
   "gibt es nicht" ein WERT: das Wort traegt dann kuenftig die Zeichenkette
   "GIBT ES NICHT" als Plural. [[kennzeichen_mit_zwei_ursachen]] */
for (const [roh, muster, name] of [
  ['__nein__',        /^GIBT ES NICHT$/i,   'gibt es nicht'],
  ['__falschertyp__', /^WORTART FALSCH$/i,  'Wortart falsch']
]){
  const z = baue(roh);
  const m = ZEILE.exec(z);
  const wort = m ? m[4].trim() : '';
  sag(!!m && muster.test(wort), 'Sonderantwort „' + name + '" bleibt Steuerwort',
      m ? 'gelesen: "' + wort + '"' : '→ Zeile unlesbar');
  /* Gegenprobe: der Rohwert darf NICHT durchrutschen. */
  sag(wort !== roh, '  und nicht als Wert "' + roh + '"');
}

console.log('');
if (schlecht){
  console.log('⛔ ' + schlecht + ' Punkt(e) passen nicht. Elias klickt seine Woerter durch,');
  console.log('   kopiert den Text — und es kommt nichts an. Nicht eine Antwort,');
  console.log('   sondern alle auf einmal.');
  process.exit(1);
}
console.log('✅ Warteseite und Uebernahme sprechen dieselbe Sprache.');
process.exit(0);
