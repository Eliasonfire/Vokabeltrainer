#!/usr/bin/env node
/* pruefe-hoer-auswahl.mjs — der Hörmodus hat jedes Wort, das die Kartei abfragt
 * =============================================================================
 *
 * ⛔⛔ DER ANLASS — Elias am 23.09.2026 auf meine Frage „Soll er sie mitnehmen?"
 * (die einzeln freigeschalteten Wörter, die im Hörmodus fehlten):
 *
 *   „ja, alle vokabeln die abgefragt werden soll er haben"
 *
 * Gemessen mit seinem Stand vom 23.09., 20:36 (Nachbau, nur gelesen): die Kartei
 * fragte 318 Wörter ab, der Hörmodus hatte 285. 34 Kartei-Wörter fehlten, alle
 * einzeln freigeschaltet (Madina 1 Kapitel 13, 14, 18, 20 und 24, Bayna Yadayk 1
 * Kapitel 5 und 6), darunter Akkusativ, Genitiv und Nominativ. Grund: die
 * Kapitelauswahl in hoerbareVokabeln() (js/hoeren.js) warf alles weg, was nicht
 * im gewählten Kapitel steht; die Kartei nimmt einzeln freigeschaltete Wörter
 * seit dem 07.09.2026 „wie eigene" mit. Seit v584 fragt der Hörmodus dieselbe
 * Funktion wie die Kartei (passtZurAuswahl) und nimmt jedes solche Wort dazu.
 *
 * Bewacht wird SEIN SATZ als Wirkung, nicht die Zeile:
 *   1. Jedes Wort, das die Kartei abfragt und eine Bedeutung hat, steht im
 *      Hörvorrat — in einer Welt MIT und einer OHNE Kapitel-Einengung.
 *   2. Es ist eine VEREINIGUNG: was ohne die neue Zeile im Hörvorrat stand,
 *      steht weiter darin — auch ein Fachbegriff, den die Kartei auslässt, und
 *      ein Wort, das er als „kenne ich schon" markiert hat (es dient als
 *      Ablenker). Er hat gesagt, was dazukommen soll, nicht was wegfallen soll.
 *   3. Es ist keine Öffnung: ein Wort aus einem nicht gewählten Kapitel, das
 *      nicht einzeln freigeschaltet ist, bleibt draußen.
 *
 * ⛔ NICHTS NACHGEBAUT: hoerbareVokabeln, passtZurAuswahl, istBekannt,
 * bekannteVokabeln, fachbegriffFolgtRegel, aktiveBuecher, kapitelAuswahl,
 * irgendwoEingeengt und buchVokabeln werden aus js/hoeren.js, js/kern.js und
 * js/buecher.js geschnitten und laufen hier Zeichen für Zeichen. Erfunden ist
 * nur die kleine Welt (Wörter, Einstellungen, welche Wörter einzeln frei und
 * welche „kenne ich schon" sind) — der Prüfer braucht weder seinen Stand noch
 * die Buchdateien, die nicht im Repo liegen dürfen. [[testvorlage_selbst_nachgebaut]]
 *
 * ⛔ STÖRTESTS bei jedem Lauf, jeder muss rot werden: die Vereinigung
 * entfernt · über bekannteVokabeln() statt über VOCAB_DATA · Ersetzung statt
 * Vereinigung. Und die Welt selbst wird geeicht: ohne die neue Zeile muss sie
 * den Fehler vom 23.09. zeigen, sonst prüft sie nichts.
 * [[stoertest_muss_wirkung_nachweisen]]
 *
 * Aufruf: node werkzeuge/pruefe-hoer-auswahl.mjs    (Exit 0 grün, 1 rot)
 */
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { ohneKommentareUndTexte } from './js-quelltext.mjs';

/* ⛔ fileURLToPath, nicht .pathname: der Pfad enthält ein Leerzeichen. [[adresse_nie_normalisieren]] */
const lies = rel => fs.readFileSync(fileURLToPath(new URL('../' + rel, import.meta.url)), 'utf8');
const HOEREN = lies('js/hoeren.js');
const KERN = lies('js/kern.js');
const BUECHER = lies('js/buecher.js');

let fehler = 0;
const gut = t => console.log('  ok ' + t);
const schlecht = t => { fehler++; console.log('  ⛔ ' + t); };

/* Funktion mit ihrer Klammerbilanz — gezählt im Text OHNE Kommentare und
   Zeichenketten (gleiche Länge, gleiche Versätze), geschnitten im Original.
   Dieselbe Bauart wie in pruefe-hoerablenker.mjs. */
function funktion(quelle, name){
  const leer = ohneKommentareUndTexte(quelle);
  const a = leer.indexOf('function ' + name + '(');
  if (a < 0) return null;
  let i = leer.indexOf('{', a), tiefe = 0;
  for (; i < leer.length; i++){
    if (leer[i] === '{') tiefe++;
    else if (leer[i] === '}' && --tiefe === 0) return quelle.slice(a, i + 1);
  }
  return null;
}

const TEILE = {};
for (const [quelle, datei, namen] of [
  [HOEREN, 'js/hoeren.js', ['hoerbareVokabeln']],
  [KERN, 'js/kern.js', ['istBekannt', 'bekannteVokabeln', 'fachbegriffFolgtRegel', 'passtZurAuswahl']],
  [BUECHER, 'js/buecher.js', ['aktiveBuecher', 'kapitelAuswahl', 'irgendwoEingeengt', 'buchVokabeln']],
]) for (const n of namen){
  const f = funktion(quelle, n);
  if (!f){ console.log('⛔ function ' + n + '() in ' + datei + ' nicht gefunden — der Prüfer kann nichts messen.'); process.exit(1); }
  TEILE[n] = f;
}
const ANTWORTEN = (HOEREN.match(/const HOER_ANTWORTEN = (\d+);/) || [])[1];
if (!ANTWORTEN){ console.log('⛔ HOER_ANTWORTEN in js/hoeren.js nicht gefunden.'); process.exit(1); }

/* ---------- Die kleine Welt ----------
   Sechs Wörter aus Kapitel 1, damit die Einengung wirklich greift (sie wird
   nur benutzt, wenn danach mindestens HOER_ANTWORTEN Wörter übrig sind). */
const W = (id, book, chapter, de, extra) => Object.assign({ id, ar: 'ar-' + id, book, chapter, de }, extra || {});
const WOERTER = [
  ...[1, 2, 3, 4, 5, 6].map(i => W('m1-1-' + i, 'madina-1', 1, 'Wort ' + i)),
  W('m1-2', 'madina-1', 2, 'aus Kapitel zwei'),
  W('m1-3', 'madina-1', 3, 'aus Kapitel drei, weder gewählt noch einzeln frei'),
  W('m1-24', 'madina-1', 24, '(gr) im Akkusativ'),
  W('m1-24-leer', 'madina-1', 24, ''),
  W('m2-5', 'madina-2', 5, 'aus einem nicht gewählten Buch'),
  W('by-1', 'bayna-yadayk-1', 1, 'aus Bayna Yadayk, Kapitel eins'),
  W('by-6', 'bayna-yadayk-1', 6, 'faul'),
  W('p-1', 'personal', 'personal', 'ein eigenes Wort'),
  W('g-regel', 'grammar', 'personal', 'Nominativ — der Grundfall', { regel: 'r-gestrichen' }),
  W('k-1', 'madina-1', 1, 'kenne ich schon'),
];
const EINZELN = ['m1-24', 'm1-24-leer', 'm2-5', 'by-6'];
const KENNT = ['k-1'];
const WELTEN = [
  { name: 'mit Einengung (Madina 1: Kapitel 1–2, Bayna Yadayk 1: Kapitel 1, Eigene an)',
    settings: { buecher: { 'madina-1': [1, 2], 'bayna-yadayk-1': [1] }, eigeneGewaehlt: true },
    /* ohne die neue Zeile fehlen diese — der Fehler vom 23.09. */
    fehlerVorher: ['m1-24', 'by-6', 'm2-5'],
    draussen: ['m1-3', 'm1-24-leer'],
    bleiben: ['g-regel', 'k-1'] },
  { name: 'ohne Einengung (alle Kapitel, Eigene aus)',
    settings: { buecher: { 'madina-1': [], 'bayna-yadayk-1': [] }, eigeneGewaehlt: false },
    fehlerVorher: ['m2-5'],
    draussen: ['m1-24-leer'],
    bleiben: ['g-regel', 'k-1'] },
];

function lauf(hoerQuelle, settings){
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(
    'var SETTINGS = ' + JSON.stringify(settings) + ';\n'
    + 'var VOCAB_DATA = ' + JSON.stringify(WOERTER) + ';\n'
    + 'var LERNBESTAND_IDS = new Set();\nvar FREIGESCHALTET = {};\n'
    + 'var GRAMMAR_RULES = [{ id: "r-gestrichen", nichtAufKarteikarten: true }];\n'
    + 'const HOER_ANTWORTEN = ' + ANTWORTEN + ';\n'
    + 'const __EINZELN = new Set(' + JSON.stringify(EINZELN) + ');\n'
    + 'const __KENNT = new Set(' + JSON.stringify(KENNT) + ');\n'
    + 'function istEinzelnFrei(w){ return !!w && __EINZELN.has(String(w.id)); }\n'
    + 'function kennErSchon(w){ return !!w && __KENNT.has(String(w.id)); }\n'
    + [TEILE.aktiveBuecher, TEILE.kapitelAuswahl, TEILE.irgendwoEingeengt, TEILE.buchVokabeln,
       TEILE.istBekannt, TEILE.bekannteVokabeln, TEILE.fachbegriffFolgtRegel, TEILE.passtZurAuswahl, hoerQuelle].join('\n')
    + '\n;globalThis.__E = JSON.stringify({'
    + ' hoer: hoerbareVokabeln().map(w => String(w.id)),'
    + ' karteiMit: VOCAB_DATA.filter(w => passtZurAuswahl(w) && w.ar && w.de && String(w.de).trim().length > 1).map(w => String(w.id)) });',
    ctx, { filename: 'Welt für hoerbareVokabeln()' });
  return JSON.parse(ctx.__E);
}

/* Die drei Aussagen für eine Fassung von hoerbareVokabeln(). Gibt die Befunde
   zurück, statt sie zu drucken — die Störtests brauchen nur ihre Zahl.
   ⚠️ „Vorher" ist immer die ECHTE Funktion ohne die neue Zeile, nie die
   gestörte: sonst vergliche ein Störtest „Ersetzung statt Vereinigung" sich mit
   seiner eigenen, ebenso leeren Fassung und sähe keinen Verlust. */
const OHNE_ZEILE = ['&& passtZurAuswahl(w)) pool.push(w);', '&& false) pool.push(w);'];
const VORHER = WELTEN.map(welt => lauf(TEILE.hoerbareVokabeln.split(OHNE_ZEILE[0]).join(OHNE_ZEILE[1]), welt.settings));
function befunde(hoerQuelle){
  const raus = [];
  for (const [i, welt] of WELTEN.entries()){
    const e = lauf(hoerQuelle, welt.settings);
    const vorher = VORHER[i];
    const hoer = new Set(e.hoer);
    const fehlt = e.karteiMit.filter(id => !hoer.has(id));
    if (fehlt.length) raus.push(welt.name + ': ' + fehlt.length + ' Kartei-Wörter fehlen im Hörmodus (' + fehlt.join(', ') + ')');
    const verloren = vorher.hoer.filter(id => !hoer.has(id));
    if (verloren.length) raus.push(welt.name + ': ' + verloren.length + ' Wörter sind aus dem Hörmodus verschwunden (' + verloren.join(', ') + ') — keine Vereinigung');
    for (const id of welt.bleiben) if (!hoer.has(id)) raus.push(welt.name + ': ' + id + ' fehlt im Hörmodus, stand aber vorher darin');
    const offen = welt.draussen.filter(id => hoer.has(id));
    if (offen.length) raus.push(welt.name + ': ' + offen.join(', ') + ' im Hörmodus, obwohl weder in der Kartei noch vorher darin');
  }
  return raus;
}

console.log('pruefe-hoer-auswahl — Elias, 23.09.2026: „ja, alle vokabeln die abgefragt werden soll er haben"\n');

/* 0. Die Welt eichen: ohne die neue Zeile muss sie den Fehler vom 23.09. zeigen. */
if (!TEILE.hoerbareVokabeln.includes(OHNE_ZEILE[0])){
  schlecht('die Zeile „' + OHNE_ZEILE[0] + '" steht nicht mehr in hoerbareVokabeln() — Prüfer und Störtests an den Umbau anpassen');
} else {
  for (const [i, welt] of WELTEN.entries()){
    const v = VORHER[i];
    const hoer = new Set(v.hoer);
    const zeigt = welt.fehlerVorher.filter(id => !hoer.has(id) && v.karteiMit.includes(id));
    if (zeigt.length === welt.fehlerVorher.length) gut('Welt geeicht, ' + welt.name + ': ohne die Zeile fehlen ' + zeigt.join(', ') + ' — der Fehler vom 23.09. ist nachgestellt');
    else schlecht('Welt ' + welt.name + ' zeigt den Fehler nicht (erwartet fehlend: ' + welt.fehlerVorher.join(', ') + ', gemessen: ' + (zeigt.join(', ') || 'keins') + ') — dann prüft sie nichts');
  }
}

/* 1.–3. Die echte Fassung. */
const echt = befunde(TEILE.hoerbareVokabeln);
if (echt.length) echt.forEach(schlecht);
else {
  for (const welt of WELTEN){
    const e = lauf(TEILE.hoerbareVokabeln, welt.settings);
    gut(welt.name + ': Kartei ' + e.karteiMit.length + ' Wörter mit Bedeutung, alle im Hörmodus (' + e.hoer.length + '); '
      + welt.bleiben.join(', ') + ' bleiben; ' + welt.draussen.join(', ') + ' bleiben draußen');
  }
}

/* Störtests: jede Fassung muss mindestens einen Befund liefern. */
const STOERUNGEN = [
  ['die Vereinigung entfernt', OHNE_ZEILE[0], OHNE_ZEILE[1]],
  ['über bekannteVokabeln() statt über VOCAB_DATA', 'for (const w of VOCAB_DATA)', 'for (const w of bekannteVokabeln())'],
  ['Ersetzung statt Vereinigung', 'const da = new Set(pool.map(w => String(w.id)));', 'const da = new Set(); pool = [];'],
];
for (const [name, alt, neu] of STOERUNGEN){
  if (!TEILE.hoerbareVokabeln.includes(alt)){ schlecht('Störtest „' + name + '": „' + alt + '" steht nicht in hoerbareVokabeln() — Störtest an den Umbau anpassen'); continue; }
  const b = befunde(TEILE.hoerbareVokabeln.split(alt).join(neu));
  if (b.length) gut('Störtest „' + name + '" wird rot: ' + b[0]);
  else schlecht('Störtest „' + name + '" bleibt grün — der Prüfer sieht diesen Fehler nicht');
}

console.log('\n' + (fehler ? '⛔ ' + fehler + ' Befund(e) — Exit 1' : '✅ grün — der Hörmodus hat jedes Wort, das die Kartei abfragt'));
process.exit(fehler ? 1 : 0);
