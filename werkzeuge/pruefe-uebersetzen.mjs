/* ============================================================================
   Die Übersetzungsübung — tut sie, was Elias verlangt hat?
   ============================================================================

   Sein Auftrag vom 22.09.2026, 21:15:
     „es sollte auch im satzmodus eine übung geben, wo mir ein satz gegeben wird
      und den soll ich dann ins deutsche übersetzten. wenn ich falsch mache muss
      erkannt werden was falsch ist und warum und mir das dann zeigen"
     „und die richtige deutsche überstzung und halt warum"

   Geprüft wird an ECHTEN Sätzen aus data/beispielsaetze.js, nicht an
   ausgedachten. Ein Test mit selbst gebauten Daten misst den Nachbau.

   ---------------------------------------------------------------------------
   ZWEI SEITEN, UND BEIDE SIND PFLICHT
   ---------------------------------------------------------------------------
   ⭐ Elias' Grundsatz für diese Übung: großzügig beim Richtigzählen, streng
   beim Benennen eines Fehlers. Daraus folgen genau zwei Messungen:

     A) Die MUSTERÜBERSETZUNG selbst muss als richtig durchgehen — und ebenso
        ein paar harmlose Abweichungen (Kleinschreibung, fehlende Satzzeichen,
        „vom" statt „von dem"). Fällt das durch, bestraft die Übung Deutsch
        statt Arabisch.
     B) Eine GEZIELT VERFÄLSCHTE Übersetzung muss den passenden Befund
        auslösen — und zwar den richtigen, nicht irgendeinen. Das ist der
        Störtest: ein Prüfer, der nur „findet", findet auch dort etwas, wo
        nichts ist. [[leere_liste_ist_keine_messung]]

   ⛔ Und eine dritte, die leicht vergessen wird: die Übung darf bei einer
   unbekannten, aber sinnvollen Formulierung NICHT behaupten, sie wisse, was
   falsch ist. Dafür gibt es den `ratlos`-Zweig, und der wird hier mitgemessen.

   Aufruf:  node werkzeuge/pruefe-uebersetzen.mjs
            node werkzeuge/pruefe-uebersetzen.mjs --laut   (jeden Fall zeigen)
   Exit 0 = in Ordnung, 1 = ein Befund.
   ============================================================================ */

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import vm from 'node:vm';

const HIER   = path.dirname(url.fileURLToPath(import.meta.url));
const WURZEL = path.resolve(HIER, '..');
const laut   = process.argv.includes('--laut');

/* ---------- Die App in einem Kontext laden, wie der Browser es tut ----------
   ⛔ Nicht jede Datei einzeln importieren: js/uebersetzen.js ruft Funktionen
   auf, die in js/uebung.js, js/saetze.js und js/kern.js stehen. Wer sie
   nachbaut, prüft den Nachbau. Deshalb ein gemeinsamer Kontext mit einem
   Minimal-DOM — genug, damit die Verdrahtung am Dateiende nicht stirbt. */
function stummesElement(){
  const el = {
    style:{}, classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    dataset:{}, children:[], value:'', textContent:'', innerHTML:'', disabled:false,
    addEventListener(){}, removeEventListener(){}, appendChild(){}, querySelector(){ return null; },
    querySelectorAll(){ return []; }, closest(){ return null; }, getAttribute(){ return null; },
    setAttribute(){}, focus(){}, getBoundingClientRect(){ return {width:0,height:0,top:0,left:0}; }
  };
  return el;
}
const DOM = {
  getElementById(){ return stummesElement(); },
  querySelector(){ return stummesElement(); },
  querySelectorAll(){ return []; },
  createElement(){ return stummesElement(); },
  addEventListener(){}, body: stummesElement(), documentElement: stummesElement()
};

const ctx = {
  window:{ addEventListener(){}, matchMedia(){ return { matches:false, addEventListener(){} }; },
           location:{ href:'' }, navigator:{ userAgent:'node', language:'de' } },
  document: DOM,
  localStorage:{ _d:{}, getItem(k){ return this._d[k] ?? null; },
                 setItem(k,v){ this._d[k]=String(v); }, removeItem(k){ delete this._d[k]; } },
  navigator:{ userAgent:'node', language:'de', onLine:true },
  console, Date, Math, JSON, Intl, setTimeout, clearTimeout, setInterval, clearInterval,
  __raus:{}
};
ctx.globalThis = ctx;
ctx.self = ctx;
ctx.window.document = DOM;
ctx.window.localStorage = ctx.localStorage;
/* ⛔⛔ OHNE DIESE ZEILE MISST DER PRÜFER ETWAS ANDERES, ALS ER SAGT.

   js/saetze.js bricht ohne `SETTINGS` mit „SETTINGS is not defined" ab — und
   dort steht wortKern(). Ohne wortKern findet uebsBedeutung() keine einzige
   Vokabel, und die Prüfung „Wort ausgelassen" fällt still aus. Im ersten Lauf
   sah das aus wie „erkennt nur 58 %", also wie ein Befund über die Übung.
   Tatsächlich war es ein Befund über den Prüfer.
   ⚠️ Deshalb steht unten auch eine Zusicherung, dass wortKern erreichbar ist:
   eine Voraussetzung, die still wegfallen kann, gehört gemessen.
   [[leere_liste_ist_keine_messung]] · [[ausfall_ist_unsichtbar_gebaut]] */
ctx.SETTINGS = { buecher:{ 'madina-1': [] }, wrongOnly:false, eigene:true, fachbegriffe:true };
vm.createContext(ctx);

const geladen = [];
const gescheitert = [];
/* Die Reihenfolge ist die des index.html: Daten zuerst, dann die Module. */
const DATEIEN = [
  'vocab-data.js', 'grammar-data.js', 'data/fachbegriffe.js',
  'data/beispielsaetze.js', 'js/saetze.js', 'js/irab.js',
  'js/uebersetzen.js', 'js/uebung.js'
];
for (const f of DATEIEN){
  const p = path.join(WURZEL, f);
  if (!fs.existsSync(p)){ gescheitert.push(f + ' — Datei fehlt'); continue; }
  try { vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: f }); geladen.push(f); }
  catch(e){ gescheitert.push(f + ' — ' + e.message); }
}

/* ⛔ Holen über eine Auswertung IM Kontext: `const` landet nicht am globalen
   Objekt. Genau daran ist die erste Messung dieses Abends gescheitert, und
   ein `catch { continue; }` daneben ließ es wie „nicht vorhanden" aussehen. */
function hole(name){
  try { return vm.runInContext(`typeof ${name} !== 'undefined' ? ${name} : undefined`, ctx); }
  catch(e){ return undefined; }
}

const uebersetzungPruefen = hole('uebersetzungPruefen');
const uebersetzungRueckmeldung = hole('uebersetzungRueckmeldung');
const analysiereSatz = hole('analysiereSatz');
const setzeLexikon   = hole('setzeLexikon');
const VOCAB_DATA     = hole('VOCAB_DATA');
const BEISPIELSAETZE = hole('BEISPIELSAETZE');

const befunde = [];
const melde = z => befunde.push(z);

if (!uebersetzungPruefen) melde('js/uebersetzen.js: uebersetzungPruefen() ist nicht erreichbar.');
/* Die Voraussetzung der halben Prüfung — siehe die Begründung bei SETTINGS. */
if (typeof hole('wortKern') !== 'function')
  melde('js/saetze.js: wortKern() ist nicht erreichbar. Ohne sie findet uebsBedeutung() keine Vokabel, und „Wort ausgelassen" fällt lautlos aus — die Zahlen unten wären dann falsch, nicht die Übung.');
if (!analysiereSatz)      melde('js/irab.js: analysiereSatz() ist nicht erreichbar.');
if (!BEISPIELSAETZE)      melde('data/beispielsaetze.js: BEISPIELSAETZE ist nicht erreichbar.');
if (befunde.length){
  console.log('✖ Der Prüfer kann nicht messen:');
  befunde.forEach(z => console.log('  · ' + z));
  gescheitert.forEach(z => console.log('  · nicht geladen: ' + z));
  process.exit(1);
}
if (typeof setzeLexikon === 'function' && Array.isArray(VOCAB_DATA)) setzeLexikon(VOCAB_DATA);

/* ---------- Die Sätze ---------- */

const saetze = Object.entries(BEISPIELSAETZE)
  .map(([id, s]) => ({ id, sentAr: s.sentAr, sentDe: s.sentDe }))
  .filter(s => s.sentAr && String(s.sentDe || '').trim());

const zeilenVon = new Map();
for (const s of saetze){
  try { zeilenVon.set(s.id, analysiereSatz(s.sentAr)); }
  catch(e){ zeilenVon.set(s.id, []); }
}

/* ---------- A) Die Musterübersetzung muss durchgehen ---------- */

/* ⚠️ Vier Abwandlungen, die jeder Mensch schreiben würde und die alle richtig
   sind. Wer hier durchfällt, prüft Rechtschreibung statt Grammatik. */
const HARMLOS = [
  ['unverändert',        de => de],
  ['klein geschrieben',  de => de.toLowerCase()],
  ['ohne Satzzeichen',   de => de.replace(/[.,!?;:]/g, '')],
  ['zusätzliche Leerzeichen', de => '  ' + de.replace(/ /g, '  ') + ' ']
];

let aGeprueft = 0;
const aFehler = [];
for (const s of saetze){
  for (const [wie, mach] of HARMLOS){
    const erg = uebersetzungPruefen(s, zeilenVon.get(s.id), mach(s.sentDe));
    aGeprueft++;
    if (!erg.richtig){
      aFehler.push({ id: s.id, wie, de: s.sentDe,
        grund: erg.befunde.map(b => b.art).join('+') || (erg.ratlos ? 'ratlos' : 'fehlend:' + erg.fehlend) });
    }
  }
}

/* ---------- B) Störtest: jede Fehlerart muss sich auslösen lassen ---------- */

/* Jede Verfälschung greift nur dort, wo ihr Beleg vorliegt — sonst wäre der
   Störtest selbst erfunden. Sie liefert den Text und die Fehlerart, die die
   Prüfung nennen MUSS. */
const STOERUNGEN = [
  {
    art: 'ausgelassen',
    /* Das letzte Inhaltswort streichen. Ein Satz, der danach identisch ist,
       taugt als Störfall nicht und wird übersprungen. */
    mach(s){
      const w = s.sentDe.replace(/[.!?]+$/, '').split(/\s+/);
      return w.length >= 4 ? w.slice(0, -1).join(' ') : null;
    }
  },
  {
    art: 'aussage',
    /* Die Kopula streichen — aus dem Satz wird eine Wortgruppe. */
    mach(s){
      const ohne = s.sentDe.replace(/\b(ist|sind)\b\s*/i, '');
      return ohne !== s.sentDe ? ohne : null;
    }
  },
  {
    art: 'bestimmtheit',
    /* „der/die/das" gegen „ein/eine" tauschen — gleich viele Wörter. */
    mach(s){
      const t = s.sentDe.replace(/\bDie\b/, 'Eine').replace(/\bdie\b/, 'eine')
                        .replace(/\bDer\b/, 'Ein').replace(/\bder\b(?!\s)/, 'ein');
      return t !== s.sentDe ? t : null;
    }
  },
  {
    art: 'besitzer',
    mach(s){
      const t = s.sentDe.replace(/\bMein\b/, 'Dein').replace(/\bmein(e|en|em|er|es)?\b/, (m)=>'dein'+(m.slice(4)||''));
      return t !== s.sentDe ? t : null;
    }
  }
];

const bGeprueft = {};
const bVerfehlt = {};
for (const st of STOERUNGEN){ bGeprueft[st.art] = 0; bVerfehlt[st.art] = []; }

for (const s of saetze){
  const zeilen = zeilenVon.get(s.id);
  for (const st of STOERUNGEN){
    const text = st.mach(s);
    if (text == null || !text.trim()) continue;
    /* Die Verfälschung muss den Satz WIRKLICH verändert haben. */
    if (text.trim() === s.sentDe.trim()) continue;
    const erg = uebersetzungPruefen(s, zeilen, text);
    bGeprueft[st.art]++;
    if (erg.richtig){
      bVerfehlt[st.art].push({ id: s.id, de: s.sentDe, statt: text, wie: 'als RICHTIG gezählt' });
    } else if (!erg.befunde.some(b => b.art === st.art)){
      bVerfehlt[st.art].push({ id: s.id, de: s.sentDe, statt: text,
        wie: 'erkannt als ' + (erg.befunde.map(b=>b.art).join('+') || 'ratlos') });
    }
  }
}

/* ---------- C) Die Rückmeldung nennt alle drei Stücke ---------- */

/* Elias hat drei Dinge verlangt: WAS falsch ist, WARUM, und die RICHTIGE
   Übersetzung. Die dritte ist die einzige, die immer da sein MUSS — auch im
   ratlos-Zweig. Genau sie fällt beim Umbauen als erste weg. */
const cFehler = [];
let cGeprueft = 0;
for (const s of saetze.slice(0, 60)){
  const erg = uebersetzungPruefen(s, zeilenVon.get(s.id), 'völliger unsinn hier');
  const text = uebersetzungRueckmeldung ? uebersetzungRueckmeldung(erg) : '';
  cGeprueft++;
  if (erg.richtig){ cFehler.push(s.id + ': „völliger unsinn" gilt als richtig'); continue; }
  if (!text.includes(s.sentDe))
    cFehler.push(s.id + ': die Rückmeldung nennt die Musterübersetzung nicht');
}

/* ---------- D) Die genannten Regeln gibt es wirklich ---------- */

/* ⛔⛔ DAS IST DER EIGENTLICHE PFLEGEPUNKT DIESER ÜBUNG.

   js/uebersetzen.js nennt sieben Regelkennungen im Klartext. Wird eine davon in
   grammar-data.js umbenannt oder entfernt, zeigt die Rückmeldung weiter auf sie
   — und „Warum? → Regel" öffnet nichts. Kein Test würde rot, die Übung liefe
   weiter, und Elias bekäme eine Begründung ohne Karte dahinter.
   [[werkzeug_ohne_aufrufer]] · [[zahlen_ohne_beleg]]

   ⚠️ Gelesen werden die Kennungen aus dem QUELLTEXT und nicht aus einer Liste
   hier: eine Liste im Prüfer wäre eine zweite Wahrheit, die beim achten Befund
   vergessen wird. */
const dFehler = [];
const quelltextUebersetzen = fs.readFileSync(path.join(WURZEL, 'js/uebersetzen.js'), 'utf8');
const GRAMMAR_RULES = hole('GRAMMAR_RULES');
const bekannteIds = new Set(Array.isArray(GRAMMAR_RULES) ? GRAMMAR_RULES.map(r => r && r.id) : []);
/* ⛔ GESUCHT WIRD IM KOMMENTARFREIEN QUELLTEXT, NICHT AM AUFRUF.

   Die erste Fassung suchte nach `uebsBefund(… 'id')` und fand 5 von 6: sobald
   eine Kennung in einem ternären Ausdruck steht (`hatKhabar ? 'nat-…' : null`),
   endet der Aufruf nicht mehr mit ihr, und sie fiel durch. Ein Prüfer, der von
   der Schreibweise des Aufrufs abhängt, prüft die Schreibweise.

   Jetzt: Kommentare weg, dann JEDE Zeichenkette, die wie eine Regelkennung
   aussieht. Das erfasst auch Nennungen an Stellen, die es heute noch nicht gibt.
   [[funktion_als_referenz_sieht_tot_aus]] */
const ohneKommentare = quelltextUebersetzen
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
const genannt = [...ohneKommentare.matchAll(/['"]([a-z][a-z0-9]*(?:-[a-z0-9]+)+-\d{2})['"]/g)]
  .map(m => m[1]);
const genanntEindeutig = [...new Set(genannt)];
for (const id of genanntEindeutig){
  if (!bekannteIds.has(id)) dFehler.push(id);
}

/* ---------- Ausgabe ---------- */

console.log('--- Übersetzungsübung ---\n');
console.log('Sätze mit Musterübersetzung: ' + saetze.length);
console.log('Module geladen:              ' + geladen.length + ' von ' + DATEIEN.length);
if (gescheitert.length) gescheitert.forEach(z => console.log('   ⚠️ ' + z));

console.log('\nA) Richtige Übersetzungen gehen durch');
console.log('   geprüft: ' + aGeprueft + ' (4 Schreibweisen je Satz) · durchgefallen: ' + aFehler.length);
if (aFehler.length && (laut || aFehler.length <= 12))
  aFehler.slice(0, laut ? 999 : 12).forEach(f =>
    console.log('   ✖ ' + f.id + ' [' + f.wie + '] ' + f.grund + '  — „' + f.de + '"'));
else if (aFehler.length) console.log('   (mit --laut alle zeigen)');

console.log('\nB) Störtest — jede Verfälschung muss ihren Befund auslösen');
for (const st of STOERUNGEN){
  const n = bGeprueft[st.art], v = bVerfehlt[st.art].length;
  const quote = n ? Math.round((n - v) / n * 100) : 0;
  console.log('   ' + st.art.padEnd(14) + String(n).padStart(4) + ' Fälle · erkannt '
            + String(n - v).padStart(4) + ' = ' + quote + '%');
  if (v && laut) bVerfehlt[st.art].slice(0, 6).forEach(x =>
    console.log('        ✖ ' + x.id + ' ' + x.wie + ': „' + x.statt + '"'));
}

console.log('\nC) Die Rückmeldung nennt immer die richtige Übersetzung');
console.log('   geprüft: ' + cGeprueft + ' · ohne Musterübersetzung: ' + cFehler.length);
if (cFehler.length) cFehler.slice(0, 6).forEach(z => console.log('   ✖ ' + z));

console.log('\nD) Die genannten Regeln gibt es in grammar-data.js');
console.log('   genannt: ' + genanntEindeutig.length + ' · unbekannt: ' + dFehler.length);
if (laut || dFehler.length)
  genanntEindeutig.forEach(id => console.log('   ' + (bekannteIds.has(id) ? '✓' : '✖') + ' ' + id));

/* ---------- Urteil ---------- */

/* ⭐ Die Schwellen stehen hier und nicht im Kopf des Lesers.
   A und C sind HART: eine richtige Übersetzung darf nie durchfallen, und die
   Musterübersetzung muss immer dastehen — beides ist Elias' Auftrag im
   Wortlaut. B ist weich, und zwar mit Grund: eine Verfälschung kann zufällig
   einen ANDEREN, ebenfalls richtigen Befund auslösen (wer das letzte Wort
   streicht, ändert oft auch die Bestimmtheit). Gemessen wird deshalb, dass
   überhaupt etwas erkannt wird, und die Quote steht als Zahl da. */
const urteile = [];
if (aFehler.length) urteile.push('A: ' + aFehler.length + ' richtige Übersetzung(en) fallen durch — die Übung ist zu streng.');
if (cFehler.length) urteile.push('C: ' + cFehler.length + ' Rückmeldung(en) ohne die richtige Übersetzung.');
if (dFehler.length) urteile.push('D: js/uebersetzen.js nennt Regel(n), die es in grammar-data.js nicht gibt: ' + dFehler.join(', ') + ' — „Warum? → Regel" öffnet dort nichts.');
if (!genanntEindeutig.length) urteile.push('D: im Quelltext steht keine einzige Regelkennung — entweder ist das Muster von uebsBefund() geändert worden, oder die Übung nennt keine Regeln mehr.');
for (const st of STOERUNGEN){
  const n = bGeprueft[st.art];
  if (!n){ urteile.push('B: für „' + st.art + '" gab es keinen einzigen Störfall — die Fehlerart ist ungeprüft.'); continue; }
  const quote = (n - bVerfehlt[st.art].length) / n;
  if (quote < 0.5) urteile.push('B: „' + st.art + '" wird nur in ' + Math.round(quote*100) + '% der Störfälle erkannt.');
}

if (urteile.length){
  console.log('\n✖ ' + urteile.length + ' Befund(e):');
  urteile.forEach(z => console.log('  · ' + z));
  process.exit(1);
}
console.log('\n✅ Richtiges geht durch, Falsches wird benannt, die Musterübersetzung steht immer dabei.');
process.exit(0);
