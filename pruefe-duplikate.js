#!/usr/bin/env node
/* pruefe-duplikate.js — Punkt A13: kein Duplikat zu einer freigeschalteten Vokabel
 * ==========================================================================
 *
 * ⛔⛔ WARUM ES DAS BIS ZUM 20.08.2026 NICHT GAB
 *
 * In `VOLLES-PROGRAMM.md` stand bei A13 als prüfendes Werkzeug: **„⛔ nur seine
 * App"**. Es war damit der einzige der dreizehn Punkte, für den überhaupt keine
 * Messung existierte — auffallen konnte ein Duplikat nur, wenn Elias beim
 * Lernen zweimal dieselbe Karte bekam.
 *
 * ================== ZWEI FALLEN, BEIDE BEIM ERSTEN BAU GETRETEN ===========
 *
 * **1. Skelettvergleich wirft Information weg.** Der erste Lauf verglich ohne
 * Vokalzeichen und meldete **14 Duplikate**. Darunter:
 *
 *     صِفْرٌ (Null)  ==  صَفَرَ (Verb)      -> beide werden صفر
 *     لِ (Praeposition) == ل (Buchstabe)   -> beide werden ل
 *     ـكَ  ==  ـكِ                          -> beide werden ك
 *
 * Alle drei sind KEINE Duplikate. Die Vokalzeichen sind hier nicht Zierrat,
 * sondern der Unterschied. [[skelettvergleich_wirft_information_weg]]
 *
 * **2. Der falsche Bezugspunkt.** Er verglich gegen **alle 4433** Buchvokabeln.
 * A13 sagt aber ausdruecklich: kein Duplikat zu einer **FREIGESCHALTETEN**.
 * Von 4433 sind das **387** — ein Treffer in madina-3 Kapitel 27 ist kein
 * Befund, sondern ein Wort, das Elias nie sieht.
 * [[milder_bezugspunkt_verdeckt_mangel]]
 *
 * Nach beiden Korrekturen: **14 -> 1**.
 *
 * ================== WIE VERGLICHEN WIRD ===================================
 *
 * MIT Vokalzeichen, aber:
 *   - NFC, damit zerlegte und zusammengesetzte Hamzah gleich sind
 *     [[arabisch_vergleichen_nfc]]
 *   - Alif-Varianten (آ أ إ ٱ) auf ا — das ist Schreibvariante, nicht Wort
 *   - Tatwil (ـ) raus
 *   - die LETZTE Haraka bzw. das Tanwin raus: das ist die Kasusendung,
 *     nicht das Wort. صِفْرٌ und صِفْرُ sind dasselbe Wort.
 *
 * Aufruf:
 *   node pruefe-duplikate.js            Befunde
 *   node pruefe-duplikate.js --alle     auch gegen NICHT freigeschaltete
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const REPO = __dirname;
const ALLE = process.argv.includes('--alle');

/* ---------- Daten laden, so wie die App es tut ---------- */
const kiste = { window: {} };
vm.createContext(kiste);
const DATEN = path.join(REPO, 'data');
let dateien = [];
try { dateien = fs.readdirSync(DATEN).filter(f => f.endsWith('.js')); }
catch (e) { console.error('⛔ data/ nicht lesbar: ' + e.message); process.exit(1); }
for (const f of dateien) {
  try { vm.runInContext(fs.readFileSync(path.join(DATEN, f), 'utf8'), kiste, { filename: f }); }
  catch (e) { console.error('  ! ' + f + ': ' + e.message.split('\n')[0]); }
}

/* ---------- Der echte Freischaltstand ---------- */
/* ⛔ NICHT nachbauen — aus js/kern.js lesen. Eine zweite Liste liefe
   auseinander, und niemand merkte es. [[handliste_neben_echter_quelle]] */
const kern = fs.readFileSync(path.join(REPO, 'js', 'kern.js'), 'utf8');
const m = /const FREIGESCHALTET = \{([\s\S]*?)\n\};/.exec(kern);
if (!m) { console.error('⛔ FREIGESCHALTET nicht in js/kern.js gefunden.'); process.exit(1); }
const FREI = {};
for (const t of m[1].matchAll(/'([^']+)':\s*\[([0-9,\s]*)\]/g))
  FREI[t[1]] = t[2].split(',').map(s => Number(s.trim())).filter(n => !Number.isNaN(n));

/* ⛔⛔ ZWEI GETRENNTE SPEICHER FUER „eigene Vokabeln“ — gemessen 20.08.2026:

     data/vokabeln-eigene.js  (EIGENE_VOKABELN)   11 Woerter, UUID-Kennungen
     data/eigene-woerter.json (vt_personalVocab)  14 Woerter, p_-Kennungen

   ⭐ KEINE Ueberschneidung — keine einzige Kennung kommt in beiden vor. Die App
   laedt beide: js/buecher.js:536 die erste, saetzeNachtragen(PERSONAL_VOCAB)
   die zweite. Dieses Werkzeug kannte nur die erste und hat deshalb
   سَيِّدٌ (p_1787185012359) nicht gefunden — ein ECHTES Duplikat zu
   madina-2 K18, und das Kapitel ist freigeschaltet.
   [[werkzeug_misst_kleineren_bestand]] [[dritte_satzquelle]] */
const EIGENE_ALT = kiste.window.EIGENE_VOKABELN || [];
let EIGENE_NEU = [];
try {
  const ew = path.join(DATEN, 'eigene-woerter.json');
  if (fs.existsSync(ew)) EIGENE_NEU = (JSON.parse(fs.readFileSync(ew, 'utf8')).woerter) || [];
  else console.log('  ⚠ data/eigene-woerter.json fehlt — 14 eigene Woerter UNGEPRUEFT.');
} catch (e) { console.log('  ⚠ data/eigene-woerter.json nicht lesbar: ' + e.message); }
const EIGENE = EIGENE_ALT.concat(EIGENE_NEU);
const FACH = vm.runInContext(
  'typeof FACHBEGRIFF_VOKABELN !== "undefined" ? FACHBEGRIFF_VOKABELN : []', kiste);
const BUCH = [];
Object.entries(kiste.window.VOKABELN || {}).forEach(([b, l]) =>
  (l || []).forEach(w => BUCH.push(Object.assign({}, w, { book: b }))));
const bezug = ALLE ? BUCH : BUCH.filter(w => (FREI[w.book] || []).includes(Number(w.chapter)));

/* ---------- Vergleich ---------- */
const HARAKA_ENDE = /[ًٌٍَُِْ]$/;
function form(s) {
  return String(s == null ? '' : s).normalize('NFC')
    .replace(/ـ/g, '')
    .replace(/[آأإٱ]/g, 'ا')
    .trim()
    .replace(HARAKA_ENDE, '');
}
const gleich = (a, b) => { const x = form(a); return x.length > 0 && x === form(b); };

/* ---------- Eichung: kann diese Pruefung ueberhaupt durchfallen? ---------- */
/* ⛔ Ein Test, der nur "gruen" kennt, misst nichts.
   [[pruefwerkzeug_mit_eingebauter_antwort]] */
const EICHUNG = [
  ['بَيْتٌ', 'بَيْتٌ', true,  'dasselbe Wort'],
  ['صِفْرٌ', 'صَفَرَ', false, 'Null gegen Verb'],
  ['مِنْ',             'مَنْ',             false, 'min gegen man'],
  ['أَخٌ',             'اَخٌ',             true,  'Hamzah-Variante']
];
const eichFehler = EICHUNG.filter(([a, b, soll]) => gleich(a, b) !== soll);
if (eichFehler.length) {
  console.error('⛔ EICHUNG FEHLGESCHLAGEN — die Pruefung misst nicht, was sie soll:');
  eichFehler.forEach(([a, b, soll, was]) =>
    console.error('   ' + was + ': erwartet ' + soll + ', bekam ' + gleich(a, b)));
  process.exit(1);
}

/* ---------- Messen ---------- */
console.log('--- A13: Duplikate zu freigeschalteten Vokabeln ---');
console.log('');
console.log('  Freigeschaltet: ' + Object.entries(FREI)
  .map(([b, k]) => b + ' K' + Math.min(...k) + '-' + Math.max(...k)).join(' · '));
console.log('  Verglichen gegen ' + bezug.length + ' von ' + BUCH.length + ' Buchvokabeln'
  + (ALLE ? '  (--alle: ALLE, auch nicht freigeschaltete)' : ''));
console.log('  Eichung: ' + EICHUNG.length + ' Faelle, alle wie erwartet.');
console.log('');

const befunde = [];
for (const [herkunft, liste] of [['eigene Vokabel', EIGENE], ['Fachbegriff', FACH]]) {
  for (const e of liste) {
    const t = bezug.filter(x => gleich(x.ar, e.ar));
    if (t.length) befunde.push({ herkunft, e, t });
  }
}
/* Und innerhalb der freigeschalteten selbst. */
const gesehen = new Map();
for (const w of bezug) {
  const f = form(w.ar);
  if (!f) continue;
  if (gesehen.has(f)) befunde.push({ herkunft: 'Buchvokabel', e: w, t: [gesehen.get(f)] });
  else gesehen.set(f, w);
}

if (!befunde.length) {
  console.log('✅ Kein Wort steht doppelt.');
  process.exit(0);
}
console.log('=== ' + befunde.length + ' Befund(e) ===');
for (const b of befunde) {
  console.log('  ' + String(b.e.ar).padEnd(22) + '(' + b.herkunft + ', id ' + b.e.id + ')  ' + (b.e.de || ''));
  b.t.forEach(x => console.log('      == ' + String(x.ar).padEnd(20) + x.book + ' K' + x.chapter + '  id ' + x.id + '  ' + (x.de || '')));
}
console.log('');
console.log('⚠️ Ein Befund ist noch keine Aufforderung: ein Fachbegriff und eine');
console.log('   Buchvokabel koennen bewusst nebeneinander stehen (Grammatikkarte');
console.log('   gegen Wortschatzkarte). Welche Elias will, entscheidet er.');
console.log('');
/* ⭐ Die BEDEUTUNG steht seit dem 20.08.2026 hinter jedem Eintrag — ohne sie
   sieht ein Homograph aus wie ein Duplikat. Genau das war bei ظَرْف der Fall:
   der Fachbegriff heißt „Zeit- oder Ortsangabe“, die Buchvokabel „Umschlag“.
   Gleiches Schriftbild, verschiedene Woerter. Automatisch entscheiden laesst
   sich das nicht — deutscher Text ist frei formuliert —, aber SICHTBAR machen
   schon. [[skelettvergleich_wirft_information_weg]] */
console.log('⛔ Und zwar mit BEDEUTUNG vergleichen, nicht nur mit Schriftbild:');
console.log('   ظَرْف = Zeit-/Ortsangabe gegen ظَرْفٌ = Umschlag ist KEIN Duplikat.');
process.exit(2);
