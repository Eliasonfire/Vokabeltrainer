/* eiche-wortart-knopf.mjs — spricht der Beleg die Sprache der Fragenseite?
 * ==========================================================================
 *
 * ⛔ DER FUND vom 21.08.2026: Der Beleg zu صِفْر sagte „Wortart Adjective /
 * Numeral". Die Fragenseite hat aber nur SECHS Knoepfe — noun · verb ·
 * adjective · particle · adverb · expression. „Numeral" ist keiner davon.
 * Elias haette einen Beleg gelesen und keinen Knopf gefunden, der dazu passt.
 *
 * ⭐ Die Zuordnung ist am eigenen Bestand GEMESSEN, nicht geraten: von elf
 * Zahlwoertern in vocab-data.js tragen NEUN `type: "noun"` (واحد, ثلاثة,
 * أربعة, خمسة, ستة, سبعة, ثمانية, تسعة, عشرة). Nur إثنان und صفر tragen
 * „vocab" — der Platzhalter der eigenen Woerter, also genau die Luecke, um
 * die es geht.
 *
 * Dieselbe Messung fuer die Partikeln: der Bestand kennt 15 `particle`, und
 * die App hat fuer Praeposition, Konjunktion und Pronomen keinen eigenen
 * Knopf — sie alle sind حَرْف.
 *
 * ⛔ Uebersetzt wird NUR, was die App kennt. Fuer alles andere bleibt der
 * Wiktionary-Name stehen: lieber ein fremder Begriff als eine falsche
 * Zuordnung.
 *
 * Aufruf:  node werkzeuge/eiche-wortart-knopf.mjs
 * Exitcode 1 = die Tabelle passt nicht mehr zu den Knoepfen der Seite.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ⭐ Die Knoepfe NICHT abschreiben, sondern aus der Seite selbst lesen.
   Eine Handliste daneben waere beim naechsten Knopf falsch.
   [[handliste_neben_echter_quelle]] [[vorabpruefung_kennt_ihr_tor_nicht]] */
const seite = fs.readFileSync(path.join(REPO, 'werkzeuge', 'wartungsfragen-artefakt.mjs'), 'utf8');
const block = /const WORTARTEN = \[([\s\S]*?)\];/.exec(seite);
if (!block){ console.error('⛔ WORTARTEN-Liste in wartungsfragen-artefakt.mjs nicht gefunden.'); process.exit(1); }
const KNOEPFE = [...block[1].matchAll(/\['([a-z]+)',/g)].map(m => m[1]);
console.log('Knoepfe der Fragenseite (aus der Quelle gelesen): ' + KNOEPFE.join(' · '));

/* Dieselbe Tabelle wie in aussenbelege.mjs. */
const ZU_APP = {
  'noun': 'noun', 'proper noun': 'noun', 'numeral': 'noun',
  'verb': 'verb', 'adjective': 'adjective', 'adverb': 'adverb',
  'particle': 'particle', 'preposition': 'particle',
  'conjunction': 'particle', 'pronoun': 'particle',
  'interjection': 'expression'
};

let fehler = 0;

/* a) Jedes Ziel der Tabelle muss ein echter Knopf sein. */
for (const [von, nach] of Object.entries(ZU_APP)){
  if (!KNOEPFE.includes(nach)){
    fehler++;
    console.log('  ⛔ ' + von + ' -> "' + nach + '" ist KEIN Knopf der Seite.');
  }
}
if (!fehler) console.log('  ok  alle ' + Object.keys(ZU_APP).length + ' Zuordnungen zeigen auf echte Knoepfe.');

/* b) Die Messung, auf der „numeral -> noun" beruht, muss noch stimmen. */
const kiste = { window: {} };
const vm = await import('node:vm');
kiste.globalThis = kiste;
vm.createContext(kiste);
vm.runInContext(fs.readFileSync(path.join(REPO, 'vocab-data.js'), 'utf8'), kiste, { filename: 'v' });
const V = vm.runInContext('typeof VOCAB_DATA !== "undefined" ? VOCAB_DATA : null', kiste) || [];
const ZAHLWORT = /^(eins|zwei|drei|vier|fünf|fuenf|sechs|sieben|acht|neun|zehn|null)\b/i;
const zahlen = V.filter(w => ZAHLWORT.test(String(w.de || '')));
const alsNoun = zahlen.filter(w => w.type === 'noun').length;
console.log('  Zahlwoerter im Bestand: ' + zahlen.length + ', davon type:"noun" = ' + alsNoun);
if (zahlen.length && alsNoun < zahlen.length - 2){
  fehler++;
  console.log('  ⛔ Die Grundlage fuer „numeral -> noun" traegt nicht mehr.');
} else {
  console.log('  ok  die Grundlage fuer „numeral -> noun" traegt.');
}

/* c) Gegenprobe: eine Wortart, die es NICHT gibt, darf nicht uebersetzt werden. */
const erfunden = ZU_APP['quantifier'];
if (erfunden !== undefined){ fehler++; console.log('  ⛔ Unbekannte Wortarten werden uebersetzt statt stehen gelassen.'); }
else console.log('  ok  eine unbekannte Wortart („quantifier") wird NICHT uebersetzt.');

console.log('');
if (fehler){ console.log('⛔ ' + fehler + ' Befund(e).'); process.exit(1); }
console.log('✔ Die Belege sprechen die Sprache der Fragenseite.');
