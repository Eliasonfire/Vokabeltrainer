#!/usr/bin/env node
/* ⛔⛔ PRUEFT, DASS DIE WERKZEUGE DIESELBE FASSUNG SEHEN WIE DIE APP.
 * ============================================================================
 *
 * Elias' eigene Vokabeln stehen in ZWEI Dateien, und am 20.08.2026 wichen
 * ALLE ELF voneinander ab:
 *
 *   data/vokabeln-eigene.js   roher arabicroots-Abzug: type:'other', kein Satz,
 *                             „Zwei 2", مُضَافْ إِلَيهِ (Sukun fehlt)
 *   vocab-data.js             gepflegt: type:'grammar'/'vocab', mit Satz,
 *                             „Zwei (2)", مُضَافْ إِلَيْهِ
 *
 * Die App nimmt die gepflegte Fassung — js/buecher.js:538 ueberspringt jedes
 * eigene Wort, dessen id schon in VOCAB_DATA steht. Der Rohabzug erreicht sie
 * fuer diese elf also NIE.
 *
 * WAS PASSIERTE, ALS DIE WERKZEUGE DAS NICHT WUSSTEN
 *
 *   vorrat.mjs             meldete 11 fehlende `type` — 6 davon trugen in der
 *                          App ein sauberes 'grammar'
 *   pruefe-funktionen.js   meldete 8 Infokarten „nur Wort" — alle 8 in Ordnung
 *   pruefe-taschkil.js     meldete مُضَافْ إِلَيهِ als Vokalisierungsluecke
 *   die Fragenseite        stellte 6 Fragen, deren Antwort laengst dastand —
 *                          und die Elias nicht einmal richtig beantworten
 *                          KONNTE: das Formular bietet Nomen/Verb/Partikel/
 *                          Adjektiv, `grammar` fehlt dort
 *
 * ⭐ Der Fehler war nicht „das Werkzeug laedt zu viel", sondern „das Werkzeug
 * wendet die Vorrangregel der App nicht an". Beide Dateien zu laden ist richtig.
 *
 * WIE DIESER WAECHTER MISST
 *
 * Nicht per Textsuche nach einem Kommentar — das waere ein Test mit eingebauter
 * Antwort. Er misst das VERHALTEN: fuer jedes Wort, das in beiden Dateien steht
 * und abweicht, laesst er die Werkzeuge laufen und sieht nach, ob in ihrer
 * Ausgabe der ROHE Wert auftaucht. Taucht er auf, liest das Werkzeug die
 * falsche Fassung. [[pruefwerkzeug_mit_eingebauter_antwort]]
 *
 * Gegenprobe, dass er rot werden KANN:
 *   node werkzeuge/pruefe-eigene-vorrang.mjs --selbsttest
 *
 * Exit 0 = alle Werkzeuge sehen die gepflegte Fassung. Exit 2 = mindestens
 * eines liest den Rohabzug.
 */
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HIER, '..');
const p = (rel) => path.join(REPO, rel);
const SELBSTTEST = process.argv.includes('--selbsttest');

/* ---------- Beide Fassungen laden ---------- */
const kiste = { window: {} };
vm.createContext(kiste);
for (const rel of ['vocab-data.js', 'data/vokabeln-eigene.js']){
  if (!fs.existsSync(p(rel))){
    console.log('  ⚠️ ' + rel + ' fehlt — auf einem fremden Rechner der Normalfall.');
    console.log('     (Die Abzuege liegen wegen der arabicroots-AGB nicht im Repo.)');
    process.exit(0);
  }
  vm.runInContext(fs.readFileSync(p(rel), 'utf8'), kiste, { filename: rel });
}
const VOCAB = vm.runInContext('typeof VOCAB_DATA !== "undefined" ? VOCAB_DATA : []', kiste);
const EIGEN = kiste.window.EIGENE_VOKABELN || [];

/* ---------- Wo weichen sie ab? ---------- */
const nfc = (s) => String(s == null ? '' : s).normalize('NFC');
/* ⛔ Die Fachbegriffe gehoeren dazu: gram-zarf und gram-nat sind genau die
   zwei Woerter, die Elias im Formular geaendert hat, und sie stehen NICHT in
   VOCAB_DATA. Ohne sie faende die Pruefung unten nichts und saehe gruen aus.
   [[leere_liste_ist_keine_messung]] */
const gepflegt = new Map(VOCAB.map(w => [String(w.id), w]));
try {
  const c = { window: {} };
  vm.createContext(c);
  vm.runInContext(fs.readFileSync(p('data/fachbegriffe.js'), 'utf8'), c, { filename: 'f.js' });
  const F = vm.runInContext('typeof FACHBEGRIFF_VOKABELN !== "undefined" ? FACHBEGRIFF_VOKABELN : []', c);
  for (const w of F) if (w && w.id && !gepflegt.has(String(w.id))) gepflegt.set(String(w.id), w);
} catch (e) { /* nicht da */ }

/* Felder, deren roher Wert in einer Werkzeugausgabe sichtbar wuerde. `de` und
   `ar` erscheinen in Wortlisten, `type` in den Feldmeldungen. */
const FELDER = ['ar', 'de', 'type'];

const abweichend = [];
for (const e of EIGEN){
  const v = gepflegt.get(String(e.id));
  if (!v) continue;
  for (const f of FELDER){
    const roh = nfc(e[f]), gut = nfc(v[f]);
    if (roh && gut && roh !== gut) abweichend.push({ id: String(e.id), feld: f, roh, gut, ar: v.ar });
  }
}

/* ⛔⛔ DIE DRITTE FASSUNG: was Elias im FORMULAR der App geaendert hat.

   `vt_wortAenderungen` liegt im Geraeteabgleich und kommt seit dem 20.08.2026
   mit `data/eigene-woerter.json`. Die App wendet es an (js/kern.js:783,
   wendeWortAenderungenAn) — und zwar NACH den Feldergaenzungen, weil was er
   selbst eingetippt hat eine Nachtragung ueberschreiben koennen muss.

   ⛔ Kein Pruefwerkzeug kennt diese Fassung. Gemessen an dem Tag: zwei
   Eintraege (gram-zarf, gram-nat — er hat das Tanwin ergaenzt), beide ohne
   aktuellen Befund. Also latent, nicht akut — deshalb wurde nichts umgebaut.

   ⭐ Aber der Waechter nimmt sie mit: bemaengelt ein Werkzeug eines Tages
   genau die Fassung, die er korrigiert hat, faellt es hier auf, statt dass er
   eine Meldung bekommt, die er nicht abstellen kann.
   [[werkzeug_misst_kleineren_bestand]] */
let AENDERUNGEN = {};
try {
  const d = JSON.parse(fs.readFileSync(p('data/eigene-woerter.json'), 'utf8'));
  AENDERUNGEN = d.aenderungen || {};
} catch (e) { /* nicht da — dann eben ohne */ }

const nurAlt = [];
for (const [id, a] of Object.entries(AENDERUNGEN)){
  if (!a || typeof a !== 'object') continue;
  for (const f of FELDER){
    const seins = nfc(a[f]);
    if (!seins) continue;
    const v = gepflegt.get(String(id));
    const datei = nfc(v && v[f]);
    if (datei && datei !== seins) nurAlt.push({ id: String(id), feld: f, seins, datei });
  }
}

console.log('--- Sehen die Werkzeuge dieselbe Fassung wie die App? ---');
console.log('');
console.log('  eigene Vokabeln:        ' + EIGEN.length);
console.log('  davon auch in vocab-data.js: ' + EIGEN.filter(e => gepflegt.has(String(e.id))).length);
console.log('  abweichende Feldwerte:  ' + abweichend.length);

if (!abweichend.length){
  console.log('');
  console.log('  ⚠️ Keine Abweichung — dieser Waechter kann heute nichts messen.');
  console.log('     Das ist KEIN gruenes Ergebnis, sondern ein fehlender Massstab:');
  console.log('     solange die Fassungen gleich sind, faellt ein Werkzeug, das die');
  console.log('     falsche liest, nicht auf. [[stoertest_muss_wirkung_nachweisen]]');
  process.exit(0);
}

console.log('');
abweichend.slice(0, 12).forEach(a =>
  console.log('    ' + a.id.slice(0, 10).padEnd(12) + String(a.ar || '').padEnd(18)
    + a.feld.padEnd(6) + ' roh=' + JSON.stringify(a.roh).slice(0, 22)
    + '  gepflegt=' + JSON.stringify(a.gut).slice(0, 22)));
if (abweichend.length > 12) console.log('    … und ' + (abweichend.length - 12) + ' weitere');

/* ---------- Die Werkzeuge laufen lassen und ihre Ausgabe absuchen ---------- */
/* ⛔ Exitcode 2 ist bei diesen Werkzeugen der Normalfall (offener Rueckstand),
   kein Fehler. Gemessen wird die AUSGABE, nicht der Code. */
const WERKZEUGE = [
  { name: 'werkzeuge/vorrat.mjs',   argv: [p('werkzeuge/vorrat.mjs')] },
  { name: 'pruefe-funktionen.js',   argv: [p('pruefe-funktionen.js')] },
  { name: 'pruefe-taschkil.js',     argv: [p('pruefe-taschkil.js')] },
  /* ⭐ Am 20.08.2026 als VIERTES Werkzeug derselben Klasse aufgefallen: es
     meldete die fuenf neuen Eselsbruecken-Ids als „gehoert zu keiner
     Vokabel", weil es vt_personalVocab nicht kannte. */
  { name: 'pruefe-eselsbruecken.js', argv: [p('pruefe-eselsbruecken.js')] },
];

function ausgabeVon(w){
  try {
    return execFileSync(process.execPath, w.argv,
      { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 240000 });
  } catch (e) {
    /* Exitcode != 0: stdout steht trotzdem in e.stdout. */
    return String((e && e.stdout) || '') + String((e && e.stderr) || '');
  }
}

console.log('');
let rot = 0;
for (const w of WERKZEUGE){
  const aus = nfc(ausgabeVon(w));
  /* Ein roher Wert zaehlt nur, wenn der gepflegte NICHT auch dasteht — sonst
     waere jede Liste, die beide Fassungen nennt, faelschlich rot. */
  const treffer = abweichend.filter(a => aus.includes(a.roh) && !aus.includes(a.gut));
  if (treffer.length){
    rot++;
    console.log('  ⛔ ' + w.name + ' zeigt ' + treffer.length + ' rohe(n) Wert(e):');
    treffer.slice(0, 5).forEach(t =>
      console.log('       ' + t.feld + ' ' + JSON.stringify(t.roh) + '  (gepflegt: ' + JSON.stringify(t.gut) + ')'));
  } else {
    console.log('  ok  ' + w.name);
  }
}

/* ---------- Gegenprobe: kann dieser Waechter rot werden? ---------- */
if (SELBSTTEST){
  console.log('');
  console.log('--- Selbsttest: erkennt der Waechter einen rohen Wert? ---');
  const a = abweichend[0];
  const erfunden = 'Ausgabe eines Werkzeugs, das ' + a.roh + ' zeigt.';
  const erkannt = abweichend.filter(x => nfc(erfunden).includes(x.roh) && !nfc(erfunden).includes(x.gut));
  if (erkannt.length){
    console.log('  ok  Eine erfundene Ausgabe mit ' + JSON.stringify(a.roh) + ' wird erkannt.');
  } else {
    console.log('  ⛔ Der Waechter erkennt seinen eigenen Testfall NICHT — er misst nichts.');
    process.exit(2);
  }
}

/* ---------- Zweiter Abschnitt: messen alle denselben Bestand? ---------- */
/* ⛔⛔ DIESELBE FRAGE, ZWEI ANTWORTEN — die allgemeine Form des Fehlers oben.

   Am 20.08.2026 traten an EINEM Tag vier Faelle auf:
     · drei Werkzeuge lasen den Roh-Abzug statt der gepflegten Fassung
     · fuenf kannten den vierten Weg (vt_personalVocab) gar nicht
     · vorrat.mjs mass 203 Woerter, pruefe-funktionen.js 189
     · die Belegsuche fand 0 Treffer, weil sie nur 469 statt 4629 Woerter sah

   Jeder einzelne war unsichtbar: das Werkzeug meldete gruen, nur eben ueber
   einen kleineren Bestand. Diese Pruefung vergleicht deshalb die ZAHLEN, die
   die Werkzeuge selbst ausgeben — nicht ihren Quelltext.

   ⚠️ Verglichen werden nur Werkzeuge, die dasselbe MEINEN: „Woerter im
   Fenster". pruefe-taschkil.js zaehlt arabische Woerter in Feldern und gehoert
   deshalb NICHT dazu. [[widerspruch_liegt_in_der_beschriftung]] */
const BESTANDSZAHL = [
  { name: 'werkzeuge/vorrat.mjs', argv: [p('werkzeuge/vorrat.mjs')],
    muster: /geprueft:\s+(\d+)\s+Woerter/ },
  { name: 'pruefe-funktionen.js', argv: [p('pruefe-funktionen.js')],
    muster: /gemessen:\s+(\d+)\s+Woerter/ },
];

if (nurAlt.length){
  console.log('');
  console.log('--- Was Elias im Formular geaendert hat ---');
  console.log('');
  nurAlt.forEach(a => console.log('    ' + a.id.slice(0, 12).padEnd(14) + a.feld.padEnd(6)
    + ' er: ' + JSON.stringify(a.seins).slice(0, 24) + '   Datei: ' + JSON.stringify(a.datei).slice(0, 24)));
  console.log('');
  console.log('  ⚠️ Kein Pruefwerkzeug kennt diese Fassung. Solange keines der Woerter');
  console.log('     bemaengelt wird, ist das folgenlos — bemaengelt eines es doch,');
  console.log('     bekaeme Elias eine Meldung, die er nicht abstellen kann.');
}

/* ⛔ Eigener Zaehler: ein Bestandsunterschied ist eine ANDERE Ursache als
   „liest den Rohabzug" und braucht eine andere Reparatur. Bis zum
   20.08.2026 liefen beide in `rot` zusammen, und die Schlussmeldung nannte
   nur die erste — sie schickte damit in js/buecher.js:538, wo nichts war.
   [[widerspruch_liegt_in_der_beschriftung]] */
let rotBestand = 0;

console.log('--- Messen alle Werkzeuge denselben Bestand? ---');
console.log('');
const zahlen = [];
for (const w of BESTANDSZAHL){
  const m = ausgabeVon(w).match(w.muster);
  if (!m){
    console.log('  ⛔ ' + w.name + ': die Zahl steht nicht in der Ausgabe —');
    console.log('     entweder umbenannt oder das Werkzeug bricht ab. NICHT gruen.');
    rotBestand++;
    continue;
  }
  zahlen.push({ name: w.name, zahl: Number(m[1]) });
  console.log('  ' + String(m[1]).padStart(6) + '  ' + w.name);
}
if (zahlen.length > 1){
  const einig = zahlen.every(z => z.zahl === zahlen[0].zahl);
  console.log('');
  if (einig){
    console.log('  ok  alle messen ' + zahlen[0].zahl + ' Woerter.');
  } else {
    rotBestand++;
    console.log('  ⛔ Die Werkzeuge messen VERSCHIEDENE Bestaende.');
    console.log('     Der kleinere kennt einen Weg nicht — meist vt_personalVocab');
    console.log('     (data/eigene-woerter.json) oder eine Buchdatei, die nur bei');
    console.log('     vorhandener Lernstand-Angabe geladen wird.');
  }
}

console.log('');
if (rot || rotBestand){
  if (rot){
    console.log('⛔ ' + rot + ' Werkzeug(e) lesen den Rohabzug statt der Fassung, die die App sieht.');
    console.log('   Die Regel steht in js/buecher.js:538 — ein eigenes Wort, dessen id schon');
    console.log('   in VOCAB_DATA steht, wird durch die gepflegte Fassung ersetzt.');
  }
  if (rotBestand){
    console.log('⛔ ' + rotBestand + ' Abweichung(en) beim BESTAND — eine andere Ursache.');
    console.log('   Nicht in js/buecher.js suchen: hier kennt ein Werkzeug einen der');
    console.log('   fuenf Wege nicht. Die fuenf sind Kapitel (FREIGESCHALTET) · einzeln');
    console.log('   freigeschaltet · vokabeln-eigene.js · fachbegriffe.js · und was NUR');
    console.log('   in vocab-data.js steht (chapter "personal" oder gar kein Abzug).');
  }
  process.exit(2);
}
console.log('✅ Alle ' + WERKZEUGE.length + ' Werkzeuge sehen dieselbe Fassung wie die App.');
