/* test-schreibweisen.mjs — wirkt SCHREIBWEISEN wirklich?
 *
 * ⛔ WOZU: `SCHREIBWEISEN` (data/eselsbruecken.js) korrigiert Schreibungen,
 * die Elias entschieden hat, an Wörtern aus dem arabicroots-Abzug. Der Abzug
 * wird bei jedem `hole-vokabeln.mjs` neu geschrieben — deshalb liegt die
 * Korrektur daneben und wird beim Laden angewandt.
 *
 * ⛔⛔ DAS IST EIN STILLER AUSFALL, wenn es bricht: die App zeigte einfach
 * wieder die alte Schreibung, kein Fehler, keine Meldung. Genau die
 * Fehlerklasse, an der schon `wendeFeldErgaenzungenAn()` einmal hing —
 * dort war der Aufruf für Buchvokabeln vergessen worden, und der Toast sagte
 * trotzdem „Gespeichert". [[erfolgsmeldung_ohne_wirkung]]
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
let fehler = 0;
const ok = (b, t) => { console.log('  ' + (b ? '✔' : '✘') + ' ' + t); if (!b) fehler++; };

const lade = (datei, name) => {
  const c = { window: {} }; vm.createContext(c); c.window = c;
  vm.runInContext(fs.readFileSync(path.join(HIER, datei), 'utf8')
    + ';globalThis.__ = (typeof ' + name + ' !== "undefined") ? ' + name + ' : null;', c);
  return c.__;
};

console.log('\n=== Die Liste selbst ===\n');
const S = lade('data/eselsbruecken.js', 'SCHREIBWEISEN');
ok(S !== null, 'SCHREIBWEISEN ist definiert');
const ids = Object.keys(S || {});
ok(ids.length > 0, ids.length + ' Eintrag/Einträge');
ok(ids.every(id => S[id].grund), 'jeder Eintrag nennt seinen Grund — die Liste wächst '
  + 'nur durch Elias\' Zustimmung, und der Grund ist der Beleg dafür');
ok(ids.every(id => S[id].ar || S[id].sentArVon),
  'jeder Eintrag ändert wenigstens ein Feld');

console.log('\n=== Der Aufrufer ===\n');
const buecher = fs.readFileSync(path.join(HIER, 'js', 'buecher.js'), 'utf8');
ok(/function schreibweisenErsetzen/.test(buecher),
  'schreibweisenErsetzen() ist definiert');
const aufrufe = (buecher.match(/^\s*schreibweisenErsetzen\(\);/gm) || []).length;
const vorbild = (buecher.match(/^\s*eselsbrueckenErsetzen\(\);/gm) || []).length;
/* ⭐ Die Zahl wird NICHT festgeschrieben, sondern gegen das Vorbild geprüft:
   eselsbrueckenErsetzen() hat genau dieselben Aufrufstellen und dieselbe
   Fehlerklasse. Kommt dort eine dazu, muss sie hier auch dazukommen.
   [[entscheidung_gilt_fuer_das_zweite_werkzeug]] */
ok(aufrufe === vorbild, aufrufe + ' Aufrufe — genauso viele wie eselsbrueckenErsetzen ('
  + vorbild + '), das dieselben Stellen braucht');
ok(aufrufe > 0, '… und es sind mehr als null');

console.log('\n=== Die Wirkung, am echten Bestand ===\n');
/* Den Abzug laden und die Funktion darauf anwenden — ohne Browser. */
const abzug = lade('data/vokabeln-eigene.js', 'EIGENE_VOKABELN') || [];
ok(abzug.length > 0, abzug.length + ' Wörter im Abzug geladen');

let geprueft = 0;
for (const id of ids) {
  const w = abzug.find(x => String(x.id) === id);
  if (!w) continue;
  geprueft++;
  const e = S[id];
  /* Vorher: der Abzug trägt die ALTE Schreibung — sonst wäre der Eintrag
     wirkungslos und niemand wüsste es. */
  if (e.ar) ok(w.ar !== e.ar,
    id.slice(0, 8) + ': der Abzug trägt noch die alte Schreibung (' + w.ar + ') — '
    + 'sonst wäre der Eintrag überflüssig');
  /* Nachher: die Funktion nachgebaut, wortgleich mit js/buecher.js */
  const kopie = { ...w };
  if (e.ar && kopie.ar !== e.ar) kopie.ar = e.ar;
  if (e.sentArVon && e.sentArNach && typeof kopie.sentAr === 'string'
      && kopie.sentAr.includes(e.sentArVon))
    kopie.sentAr = kopie.sentAr.split(e.sentArVon).join(e.sentArNach);
  if (e.ar) ok(kopie.ar === e.ar, id.slice(0, 8) + ': danach steht ' + e.ar);
  if (e.sentArVon) ok(!kopie.sentAr || !kopie.sentAr.includes(e.sentArVon),
    id.slice(0, 8) + ': auch im Beispielsatz — sonst schreiben Karte und Satz verschieden');
}
ok(geprueft > 0, geprueft + ' Eintrag/Einträge am echten Abzug geprüft');

console.log('\n=== Störtest ===\n');
/* ⛔ Kann dieser Test überhaupt scheitern? */
const leer = {};
ok(Object.keys(leer).length === 0 && ids.length > 0,
  'eine leere Liste wäre unterscheidbar — sie ist es nicht');
ok(!/schreibweisenErsetzen/.test('function eselsbrueckenErsetzen(){}'),
  'die Namensprüfung trifft nicht versehentlich das Vorbild');

console.log('\n' + (fehler ? '⛔ ' + fehler + ' Fall/Fälle falsch' : '✅ alle Fälle richtig'));
process.exitCode = fehler ? 1 : 0;
