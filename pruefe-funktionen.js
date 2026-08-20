#!/usr/bin/env node
/* ===================== Funktionsanzeige der Infokarte nachmessen ===========

   Elias am 20.08.2026: „ich würde auch gerne bei den infokarten, dass ihre
   funktion auch gezeigt wird — also wie zb bei عِنْدَ (bei) soll angezeigt
   werden, dass es Orts- und Zeitangabe ist, aber auch dass es eine
   Genitivpräposition ist. So sollen alle infokarten ihre jeweilige funktion
   auch bekommen."

   Und: „anstatt bei solchen wörtern einfach nur ‚Wort' zu schreiben, schreibe
   lieber Nomen oder so hin."

   ⛔ WOZU DIESES SKRIPT EXISTIERT

   Punkt A8 des vollen Programms (VOLLES-PROGRAMM.md) verlangt die
   Funktionsanzeige — und bis zum 20.08.2026 pruefte sie NIEMAND. Die Liste
   nannte `pruefe-saetze.js` als Messer; ein Gegenpruefer hat nachgesehen:
   `funktionenVon` kommt in keinem einzigen Pruefskript vor, nur in js/irab.js
   und js/kategorien.js. Und `werkzeuge/pruefe-volles-programm.mjs` meldete
   dafuer gruen, weil es nur prueft, OB die genannte Datei existiert.

   Ein Punkt, den kein Werkzeug misst, wird nie gemeldet und deshalb nie
   ergaenzt. [[werkzeug_ohne_aufrufer]]

   WAS ES MISST

   Fuer jedes Wort im Fenster: was steht auf seiner Infokarte?
     - eine echte Funktion (Nomen, Genitivpraeposition, Zeitangabe, ...)
     - oder nur „Wort" — das ist keine Auskunft, sondern das Eingestaendnis,
       dass keine da ist

   ⚠️ ES GIBT NUR EINEN WEG, DAS EHRLICH ZU MESSEN: dieselbe Funktion aufrufen,
   die die App aufruft. Eine Nachbildung liefe mit der Zeit auseinander und
   maesse dann etwas anderes als auf dem Bildschirm steht — genau die Sorte
   Werkzeug, die gruen meldet, waehrend die Karte etwas anderes zeigt.

   Aufruf:   node pruefe-funktionen.js
             node pruefe-funktionen.js --alle       jedes Wort einzeln
             node pruefe-funktionen.js --alles      ohne Fensterfilter
   Rueckgabe: 0 = jedes Wort im Fenster hat eine Funktion
              2 = mindestens eines zeigt nur „Wort"
   =========================================================================== */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DIR = __dirname;
const ALLE = process.argv.includes('--alle');
const OHNE_FENSTER = process.argv.includes('--alles');

console.log('--- Funktionsanzeige (A8) ---\n');

/* ---------- Die App-Logik in einer Sandbox laden ----------
   js/irab.js braucht Vorarbeit: Wortlisten, das Lexikon, einige Helfer aus
   js/kern.js. Statt sie nachzubauen, wird geladen, was die Datei selbst
   braucht — und wenn etwas fehlt, sagt das Skript es und misst NICHT. */
const ctx = { window: {}, console, document: undefined };
ctx.globalThis = ctx;
vm.createContext(ctx);

function laden(rel, pflicht = true){
  const p = path.join(DIR, rel);
  if (!fs.existsSync(p)){
    if (pflicht){ console.log('  FEHLER ' + rel + ' fehlt.'); process.exit(1); }
    return false;
  }
  try { vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: rel }); return true; }
  catch (e){
    if (pflicht){ console.log('  FEHLER ' + rel + ': ' + e.message); process.exit(1); }
    return false;
  }
}
const hol = n => vm.runInContext('typeof ' + n + ' !== "undefined" ? ' + n + ' : null', ctx);

laden('vocab-data.js');
laden('data/buecher.js');
laden('data/fachbegriffe.js', false);
laden('data/vokabeln-eigene.js', false);
laden('data/feld-ausnahmen.js', false);
for (const b of (hol('BUECHER') || [])) laden(b.datei, false);

/* ⛔ js/irab.js allein laeuft nicht: es ruft beim Laden nichts auf, braucht
   aber `escapeHtml` und ein paar Helfer aus js/kern.js. Die ganze kern.js zu
   laden scheitert am fehlenden DOM. Deshalb genau die Stuecke nachreichen, die
   funktionenVon() anfasst — und wenn eines fehlt, bricht es hier sichtbar ab
   statt still etwas Falsches zu messen. */
vm.runInContext(`
  function escapeHtml(s){ return String(s == null ? '' : s); }
  var SETTINGS = { buecher: null };
  function aktivesBuch(){ return 'madina-1'; }
`, ctx);
laden('js/irab.js');

const funktionenVon = hol('funktionenVon');
if (typeof funktionenVon !== 'function'){
  console.log('  FEHLER funktionenVon() ist nach dem Laden von js/irab.js nicht verfuegbar.');
  console.log('         Wurde sie umbenannt? Dieses Skript misst dann nichts und meldet');
  console.log('         das lieber, als gruen zu sein.');
  process.exit(1);
}

/* Das Lexikon fuellen — ohne es kennt funktionenVon() keine Wortarten. */
const setzeLexikon = hol('setzeLexikon');
const VOCAB = hol('VOCAB_DATA') || [];

/* ---------- Das Fenster bilden (wie werkzeuge/vorrat.mjs) ---------- */
const kern = fs.readFileSync(path.join(DIR, 'js', 'kern.js'), 'utf8');
const mF = kern.match(/const FREIGESCHALTET\s*=\s*(\{[\s\S]*?\n\});/);
const frei = mF ? vm.runInNewContext('(' + mF[1].replace(/\/\/[^\n]*/g, '') + ')') : {};
let angabe = {};
try { angabe = (JSON.parse(fs.readFileSync(path.join(DIR, 'data', 'lernstand.json'), 'utf8')).angabe) || {}; }
catch (e){ console.log('  ⚠️ data/lernstand.json nicht lesbar — ohne Fenster gemessen.'); }
const VORAUS = 3;

const woerter = [];
if (OHNE_FENSTER){
  VOCAB.forEach(w => woerter.push({ ...w, quelle: 'vocab-data' }));
} else {
  for (const b of (hol('BUECHER') || [])){
    const slug = b.slug;
    if (!angabe[slug]) continue;
    const grenze = angabe[slug] + VORAUS;
    const kapitel = (frei[slug] || []).map(Number).filter(k => k <= grenze);
    const liste = (ctx.window.VOKABELN && ctx.window.VOKABELN[slug]) || [];
    liste.filter(w => kapitel.includes(Number(w.chapter)))
         .forEach(w => woerter.push({ ...w, quelle: slug }));
  }
}
/* ⛔⛔ DIE FASSUNG, DIE DIE APP SIEHT — nicht die aus dem Rohabzug.

   Elias' eigene Vokabeln stehen in ZWEI Dateien, und am 20.08.2026 wichen
   ALLE ELF voneinander ab:

     data/vokabeln-eigene.js  roher arabicroots-Abzug: type:'other', kein Satz
     vocab-data.js            gepflegt: type:'grammar'/'vocab', mit Satz

   Die App nimmt die gepflegte Fassung — js/buecher.js:538 ueberspringt jedes
   eigene Wort, dessen id schon in VOCAB_DATA steht:

     const da = new Set(VOCAB_DATA.map(w => String(w.id)));
     const neu = window.EIGENE_VOKABELN.filter(w => !da.has(String(w.id)) && …);

   Bei allen elf trifft das zu. Der Rohabzug erreicht die App also NIE.
   Wer ihn trotzdem misst, meldet Maengel, die es nicht gibt: sechs der acht
   „nur Wort"-Befunde tragen in der App ein sauberes type:'grammar', und die
   Fragenseite stellte sechs Fragen, deren Antwort laengst im Bestand stand —
   Fragen, die Elias nicht einmal richtig beantworten KONNTE, weil das
   Formular nur Nomen/Verb/Partikel/Adjektiv anbietet und `grammar` fehlt.

   ⚠️ Dieselbe Regel steht in werkzeuge/vorrat.mjs, pruefe-funktionen.js und
   pruefe-taschkil.js. Wer eine aendert, aendert alle drei —
   werkzeuge/pruefe-eigene-vorrang.mjs meldet es, wenn eine fehlt.
   [[pruefwerkzeug_laedt_mehr_als_die_app]] [[dieselbe_frage_zwei_antworten]] */
const _gepflegt = new Map(((hol('VOCAB_DATA')) || []).map(w => [String(w.id), w]));
const _EIGENE_GEPFLEGT = (ctx.window.EIGENE_VOKABELN || [])
  .map(w => _gepflegt.get(String(w.id)) || w);
_EIGENE_GEPFLEGT.forEach(w => woerter.push({ ...w, quelle: 'eigene' }));
(hol('FACHBEGRIFF_VOKABELN') || []).forEach(w => woerter.push({ ...w, quelle: 'fachbegriff' }));

/* ⛔ Der vierte Weg: seine SELBST ANGELEGTEN Woerter aus vt_personalVocab.
   Sie stehen nur im localStorage; `vorrat.mjs --stand … --app auto` holt sie
   nach data/eigene-woerter.json. Ohne diese Zeilen mass dieses Skript 189
   Woerter, waehrend vorrat.mjs 203 zaehlte — dieselbe Frage, zwei Antworten.

   ⚠️ Fehlt die Datei, wird das GESAGT. Ein stillschweigend kleinerer Bestand
   sieht aus wie ein gruener Lauf. [[ausfall_ist_unsichtbar_gebaut]] */
let selbstAnzahl = 0;
try {
  const d = JSON.parse(fs.readFileSync(path.join(DIR, 'data', 'eigene-woerter.json'), 'utf8'));
  (Array.isArray(d.woerter) ? d.woerter : []).forEach(w => {
    woerter.push({ ...w, quelle: 'selbst' }); selbstAnzahl++;
  });
} catch (e) {
  console.log('  ⚠️ data/eigene-woerter.json fehlt — seine selbst angelegten Woerter');
  console.log('     sind NICHT gemessen (node werkzeuge/vorrat.mjs --stand <datei> --app auto).');
}

if (setzeLexikon) { try { setzeLexikon(woerter); } catch (e){ /* optional */ } }

if (!woerter.length){
  console.log('  ⚠️ Keine Woerter im Fenster — nichts zu messen.');
  console.log('     (Die Buchabzuege liegen wegen der arabicroots-AGB nicht im Repo.');
  console.log('      Auf einem fremden Rechner ist das der Normalfall, kein Fehler.)');
  process.exit(0);
}

/* ---------- Messen ---------- */
/* „Wort" ist der Rueckfallwert in js/irab.js: WORTART.vocab === 'Wort'. Er
   heisst genau das, was Elias bemaengelt hat — keine Auskunft. */
const ohne = [];
let gemessen = 0;
for (const w of woerter){
  let f = [];
  try { f = funktionenVon(w) || []; } catch (e){ f = []; }
  gemessen++;
  const nurWort = !f.length || (f.length === 1 && String(f[0]).trim() === 'Wort');
  if (nurWort) ohne.push(w);
}

console.log('  gemessen:        ' + gemessen + ' Woerter'
  + (OHNE_FENSTER ? ' (ohne Fensterfilter)' : ' im Fenster'));
console.log('  mit Funktion:    ' + (gemessen - ohne.length));
console.log('  nur „Wort":      ' + ohne.length
  + (ohne.length ? '   ⛔ diese Infokarten sagen nichts ueber das Wort' : ''));

if (ohne.length){
  const jeQuelle = {};
  ohne.forEach(w => { jeQuelle[w.quelle] = (jeQuelle[w.quelle] || 0) + 1; });
  console.log('');
  console.log('  je Herkunft:');
  Object.entries(jeQuelle).sort((a, b) => b[1] - a[1])
    .forEach(([q, n]) => console.log('    ' + q.padEnd(14) + n));
  console.log('');
  const zeigen = ALLE ? ohne : ohne.slice(0, 8);
  zeigen.forEach(w => console.log('    ' + String(w.ar).padEnd(14)
    + String(w.de || '').slice(0, 30).padEnd(32) + '[' + (w.type || 'kein type') + ']'));
  if (!ALLE && ohne.length > zeigen.length)
    console.log('    … ' + (ohne.length - zeigen.length) + ' weitere (mit --alle vollstaendig)');
  console.log('');
  console.log('  ⭐ Der haeufigste Grund ist ein fehlendes oder unbrauchbares `type`');
  console.log('     (A1). Der zweite: das Wort gehoert in eine der Listen in');
  console.log('     js/irab.js (HURUF_JARR, ZURUF, HURUF_NIDA, INDEKLINABEL).');
  process.exit(2);
}

console.log('');
console.log('  Jede Infokarte im Fenster nennt eine Funktion.');
process.exit(0);
