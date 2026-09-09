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

/* ⛔⛔ DER FUENFTE WEG: was nur ueber vocab-data.js im Bestand ist.

   Am 20.08.2026 meldete werkzeuge/pruefe-eigene-vorrang.mjs den Unterschied
   selbst: vorrat.mjs 214, dieses Skript 203. Die elf sind

     9x  50296-50304  die Zahlwoerter. Im Abzug stehen sie unter Kapitel 24,
                      madina-1 ist bis 12 frei — sie fallen aus dem Fenster.
                      In vocab-data.js tragen sie `chapter: "personal"`, und
                      js/kern.js:149 macht sie damit in der App IMMER bekannt.
     2x  madina1-l6-ach / -ucht  stehen in KEINER Abzugsdatei, tragen aber
                      `chapter: 6` und liegen damit mitten im Fenster.

   ⛔ Nur im Fenster-Modus. Mit --ohne-fenster sind ohnehin alle VOCAB drin,
   und der Filter wuerde jedes Wort ein zweites Mal einhaengen.
   [[werkzeug_misst_kleineren_bestand]] [[dieselbe_frage_zwei_antworten]] */
if (!OHNE_FENSTER){
  const _da = new Set(woerter.map(w => String(w.id)));
  VOCAB.filter(w => !_da.has(String(w.id)))
       .forEach(w => woerter.push({ ...w, quelle: 'vocab-data' }));
}

if (setzeLexikon) { try { setzeLexikon(woerter); } catch (e){ /* optional */ } }

if (!woerter.length){
  console.log('  ⚠️ Keine Woerter im Fenster — nichts zu messen.');
  console.log('     (Die Buchabzuege liegen wegen der arabicroots-AGB nicht im Repo.');
  console.log('      Auf einem fremden Rechner ist das der Normalfall, kein Fehler.)');
  process.exit(0);
}

/* ---------- Das Urteil, an EINER Stelle ----------
   „Wort" ist der Rueckfallwert in js/irab.js: WORTART.vocab === 'Wort'. Er
   heisst genau das, was Elias bemaengelt hat — keine Auskunft.

   ⭐ Der Stoertest unten fragt DIESE Funktion, nicht eine zweite mit derselben
   Bedingung. Ein nachgebautes Urteil wuerde mit der Zeit auseinanderlaufen und
   dann etwas anderes bezeugen als der Lauf darunter misst.
   [[testvorlage_selbst_nachgebaut]] */
function funktionen(w){
  try { return funktionenVon(w) || []; } catch (e){ return []; }
}
function nurWortKarte(w){
  const f = funktionen(w);
  return !f.length || (f.length === 1 && String(f[0]).trim() === 'Wort');
}

/* ---------- ⛔ STOERTEST (09.09.2026) ----------

   ⛔ Dieser Pruefer zaehlt EINE Sorte Mangel: Karten, die nur „Wort" sagen.
   Heute sind das 0 von 230 — und genau darin liegt die Gefahr. Eine Fassung,
   die gar nicht mehr misst, meldet dieselbe Null. Der Kopf dieser Datei faengt
   nur den groben Fall ab („Wurde sie umbenannt?").

   ⭐⭐ Der haeufigere Fall waere UNSICHTBAR: die Listen in js/irab.js sind da,
   die Sonderrollen aber nicht mehr. Faellt ZURUF aus, verliert عِنْدَ seine
   Zeile „Zeit- oder Ortsangabe" und bekommt vom Rueckfall in Punkt 6 ein
   sauberes „Partikel" — kein „Wort", also kein Befund. Ausgerechnet das Wort,
   an dem Elias die Funktionsanzeige am 20.08.2026 bestellt hat, waere still
   auf die Auskunft zurueckgefallen, die ihm nicht genuegte.
   [[stoertest_muss_wirkung_nachweisen]] [[gruener_pruefer_beweist_nur_geprueftes]]

   Sechs Faelle, deren Antwort feststeht — mit derselben Funktion gemessen,
   die die App aufruft. */
console.log('=== Stoertest ===');
let stoer = 0;
const sProbe = (was, ist, soll) => {
  if (ist !== soll){ stoer++; console.log('  ⛔  ' + was + ': ' + JSON.stringify(ist) + ' statt ' + JSON.stringify(soll)); }
  else console.log('  ok   ' + was);
};
{
  const zeile = w => funktionen(w).join(' | ');

  /* 1. Der rote Weg. Ohne ihn koennte der Zaehler festgeschraubt sein:
     ein Wort ohne Wortart und ohne Listeneintrag MUSS auffallen. */
  sProbe('ein Wort ganz ohne Auskunft faellt auf',
    nurWortKarte({ ar: 'زززز', type: 'vocab' }), true);

  /* 2. Elias' eigenes Beispiel vom 20.08.2026. Beide Zeilen muessen stehen —
     die Benennung UND die Wirkung auf das naechste Wort. */
  sProbe('عِنْدَ nennt seine Rolle als Zeit-/Ortsangabe',
    /ظَرْف/.test(zeile({ ar: 'عِنْدَ', type: 'particle' })), true);
  sProbe('عِنْدَ nennt die Wirkung (Genitiv danach)',
    /Genitiv/.test(zeile({ ar: 'عِنْدَ', type: 'particle' })), true);

  /* 3. Die Genitivpraeposition — und die Verwechslung, die js/irab.js:546
     ausdruecklich abwehrt: مَنْ (wer) ist KEINE. Ohne Harakat sehen beide
     gleich aus, und auf einer Lernkarte waere das eine falsche Lehre. */
  sProbe('مِنْ ist eine Genitivpraeposition',
    /حَرْف جَرّ/.test(zeile({ ar: 'مِنْ', type: 'particle' })), true);
  sProbe('مَنْ (wer) ist KEINE Genitivpraeposition',
    /حَرْف جَرّ/.test(zeile({ ar: 'مَنْ', type: 'particle' })), false);

  /* 4. Der Fall aus seinem Bildschirmfoto: type:'vocab' heisst intern „Wort",
     und genau dafuer wurde erschlosseneWortart() gebaut. لَحْمٌ traegt Tanwin,
     also ist es ein اِسْم — das darf nicht wieder zu „Wort" werden. */
  sProbe('لَحْمٌ (type vocab) sagt „Nomen", nicht „Wort"',
    zeile({ ar: 'لَحْمٌ', type: 'vocab' }), 'Nomen');

  /* ⚠️ Und die Probe auf die Probe: bei einem fast leeren Bestand waeren
     „0 nur Wort" ebenfalls null Befunde. Am 09.09.2026 waren es 230. */
  sProbe('es steht ueberhaupt ein Bestand da (>= 50)', woerter.length >= 50, true);
}
if (stoer){
  console.log('');
  console.log('⛔ ' + stoer + ' Stoertest(s) gescheitert — dieser Pruefer misst nicht,');
  console.log('   und seine „0 nur Wort" sind damit wertlos.');
  process.exit(1);
}
console.log('');

/* ---------- Messen ---------- */
const ohne = [];
let gemessen = 0;
for (const w of woerter){
  gemessen++;
  if (nurWortKarte(w)) ohne.push(w);
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
