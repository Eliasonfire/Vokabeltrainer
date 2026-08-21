/* test-feld-ergaenzungen.mjs — kommt Elias' Antwort wirklich auf der Karte an?
 * ==========================================================================
 *
 * Prueft BEIDE Richtungen des Rueckwegs: einen Wert (FELD_ERGAENZUNGEN) und
 * ein „gibt es nicht“ (FELD_AUSNAHMEN). Der Dateiname nennt nur die erste —
 * er bleibt, weil ein Umbenennen den Sammellauf-Eintrag brechen wuerde.
 *
 * Aufruf:  node test-feld-ergaenzungen.mjs
 * Exitcode 0 = die Kette traegt, 1 = eine Antwort verpufft
 *
 * WOZU
 *
 * Der Rueckweg endet nicht in data/feld-ausnahmen.js, sondern auf der Karte.
 * Das letzte Glied ist wendeFeldErgaenzungenAn() — und dessen WIRKUNG wurde
 * bisher nirgends gemessen:
 *
 *   validate.js prueft, dass die Funktion AUFGERUFEN wird (Name, Ort, Reihen-
 *   folge). Ob sie das Richtige tut, steht dort nicht. [[sein_ist_nicht_wirken]]
 *
 * ⛔ Und der gefaehrliche Teil: FELD_ERGAENZUNGEN, FELD_ZWEIFEL und
 * FELD_AUSNAHMEN sind heute ALLE LEER (gemessen 21.08.2026). Ein kaputter
 * Anwendungscode faellt an null Eintraegen nicht auf — er faellt an Elias'
 * ERSTER Antwort auf, und dann still. Eine Pruefung, die nur im gefuellten
 * Zustand greift, fehlt genau dann, wenn man sie braucht.
 * [[flaeche_nur_im_gefuellten_zustand]]
 *
 * Deshalb bringt dieser Prueftand seine Faelle SELBST mit, statt auf Bestand
 * zu warten.
 *
 * DIE DREI FAELLE — und warum der dritte der wichtigste ist
 *
 *   1. Feld leer            -> Wert wird gesetzt
 *   2. Feld gefuellt        -> Wert bleibt liegen (Elias' Abzug gewinnt)
 *   3. Feld gefuellt, aber BESTRITTEN -> Wert wird gesetzt
 *
 * Fall 3 ist Ebene 4. Bis zum 20.08.2026 fehlte er: Elias sagte „die Wortart
 * stimmt nicht", beantwortete die Frage neu — und die App liess den Wert
 * liegen, weil das Feld ja gefuellt war. Der falsche Wert blieb fuer immer
 * stehen. Genau dieser Fall darf nie wieder still ausfallen.
 */
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/* ⛔ fileURLToPath, nicht von Hand: der Ordner heisst «1. Workspace» mit
   Leerstelle, die in import.meta.url als %20 steht. [[workspace_pfad_g]] */
const HIER = path.dirname(fileURLToPath(import.meta.url));
const DATEI = path.join(HIER, 'data', 'feld-ausnahmen.js');

const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(DATEI, 'utf8'), ctx, { filename: 'data/feld-ausnahmen.js' });

const W = ctx.window;
for (const n of ['wendeFeldErgaenzungenAn', 'FELD_ERGAENZUNGEN', 'FELD_ZWEIFEL']){
  if (!W[n]){
    console.log('⛔ ' + n + ' fehlt in data/feld-ausnahmen.js — die Kette ist unterbrochen.');
    process.exit(1);
  }
}

/* ⭐ Die Eintraege werden ueber window eingeschleust. Das geht nur, weil
   window.FELD_ERGAENZUNGEN DIESELBE Objektreferenz ist wie die Konstante im
   Modulscope — eine Kopie waere fuer die Funktion unsichtbar.
   Gegenprobe unten: Fall 1 muss anschlagen; tut er das nicht, war es eine
   Kopie und der ganze Prueftand waere wertlos. */
W.FELD_ERGAENZUNGEN['t-leer']      = { pl: 'PL-NEU' };
W.FELD_ERGAENZUNGEN['t-gefuellt']  = { pl: 'PL-NEU' };
W.FELD_ERGAENZUNGEN['t-bestritten']= { type: 'noun' };
W.FELD_ZWEIFEL['t-bestritten']     = { type: true };

const FAELLE = [
  { id: 't-leer',       wort: { id: 't-leer',       pl: '' },
    feld: 'pl',   soll: 'PL-NEU',
    was: 'leeres Feld — die Antwort muss ankommen' },
  { id: 't-gefuellt',   wort: { id: 't-gefuellt',   pl: 'PL-ALT' },
    feld: 'pl',   soll: 'PL-ALT',
    was: 'gefuelltes Feld — der Bestand gewinnt, die Ergaenzung bleibt liegen' },
  { id: 't-bestritten', wort: { id: 't-bestritten', type: 'adjective' },
    feld: 'type', soll: 'noun',
    was: 'BESTRITTEN (Ebene 4) — der Zweifel zaehlt wie ein leeres Feld' }
];

const liste = FAELLE.map(f => f.wort);
const n = W.wendeFeldErgaenzungenAn(liste);

console.log('');
console.log('=== Kommt Elias\' Antwort auf der Karte an? ===');
console.log('');
console.log('  ' + n + ' Feld(er) gesetzt (erwartet: 2 — Fall 1 und Fall 3)');
console.log('');

let schlecht = 0;
for (const f of FAELLE){
  const ist = f.wort[f.feld];
  const ok = ist === f.soll;
  if (!ok) schlecht++;
  console.log('  ' + (ok ? 'ok  ' : '⛔  ') + f.id.padEnd(14)
    + f.feld.padEnd(6) + 'ist "' + ist + '", soll "' + f.soll + '"');
  console.log('      ' + f.was);
}

/* ⛔ Die Zaehlung ist eine EIGENE Aussage: waeren beide Werte zufaellig
   richtig, aber n falsch, stimmte etwas an der Buchfuehrung nicht.
   [[trefferquote_ohne_preis]] */
if (n !== 2){
  console.log('');
  console.log('  ⛔ Rueckgabewert ' + n + ' statt 2 — die Funktion zaehlt anders als sie wirkt.');
  schlecht++;
}

console.log('');
if (schlecht){
  console.log('⛔ ' + schlecht + ' Fall/Faelle falsch. Eine Antwort von Elias wuerde verpuffen —');
  console.log('   er beantwortet die Frage, und beim naechsten Lauf steht sie wieder da.');
  process.exit(1);
}
console.log('  ok   Ergaenzungen: alle drei Faelle richtig.');

/* ========================================================================
   AUSNAHMEN — die Gegenrichtung

   Oben ging es um "hier ist der Wert". Hier geht es um "den gibt es nicht".
   Beides sind Antworten von Elias, und beide koennen verpuffen — nur
   merkt man es hier anders: die Frage kommt bei JEDEM Lauf wieder, und er
   beantwortet sie wieder und wieder.

   ⛔ FELD_AUSNAHMEN ist heute ebenfalls LEER. Auch das faellt erst an
   seiner ersten Antwort auf. [[flaeche_nur_im_gefuellten_zustand]]

   ⚠️ Getrennte Meldung, nicht in die Ergaenzungs-Zaehlung gemischt: eine
   Fehlermeldung, die auf die falsche Ursache zeigt, ist schlimmer als
   keine. [[werkzeug_misst_kleineren_bestand]] */
if (!W.feldAusnahme || !W.FELD_AUSNAHMEN){
  console.log('⛔ feldAusnahme/FELD_AUSNAHMEN fehlt — „gibt es nicht" wirkt nirgends.');
  process.exit(1);
}

W.FELD_AUSNAHMEN['t-ausnahme'] = { pl: 'Elias: gibt es nicht' };
const wortA = { id: 't-ausnahme', type: 'noun' };
const wortB = { id: 't-ohne-eintrag', type: 'noun' };

/* ⛔ quelle absichtlich als leere Zeichenkette: sonst koennte eine
   FELD_REGELN-Regel ueber die Quelle anschlagen und der Test waere gruen,
   ohne dass Elias Eintrag je gelesen wurde. Fall B beweist, dass hier
   wirklich NUR sein Eintrag wirkt. [[pruefung_fragt_einen_stellvertreter_ab]] */
const mitEintrag  = W.feldAusnahme(wortA, 'pl', '');
const ohneEintrag = W.feldAusnahme(wortB, 'pl', '');

console.log('');
console.log('=== Legt „gibt es nicht" die Frage still? ===');
console.log('');
console.log('  ' + (mitEintrag ? 'ok  ' : '⛔  ') + 'mit seinem Eintrag   -> '
  + (mitEintrag ? 'Frage entfaellt ("' + mitEintrag + '")' : 'Frage kommt WIEDER'));
console.log('  ' + (!ohneEintrag ? 'ok  ' : '⛔  ') + 'ohne Eintrag         -> '
  + (ohneEintrag ? 'faelschlich still ("' + ohneEintrag + '")' : 'Frage wird gestellt'));

/* ⭐ Und der Aufrufer: die Funktion kann richtig antworten und trotzdem
   wirkungslos sein, wenn niemand sie fragt. [[werkzeug_ohne_aufrufer]] */
const VORRAT = path.join(HIER, 'werkzeuge', 'vorrat.mjs');
const rufer = fs.existsSync(VORRAT)
  && /feldAusnahme\s*&&\s*feldAusnahme\(/.test(fs.readFileSync(VORRAT, 'utf8'));
console.log('  ' + (rufer ? 'ok  ' : '⛔  ') + 'vorrat.mjs fragt sie ' + (rufer ? '' : 'NICHT ')
  + '— sonst waere die Antwort richtig und trotzdem wirkungslos');

if (!mitEintrag || ohneEintrag || !rufer){
  console.log('');
  console.log('⛔ „Gibt es nicht" wirkt nicht. Elias bekaeme dieselbe Frage bei jedem Lauf');
  console.log('   wieder vorgelegt — und haette keine Moeglichkeit, sie loszuwerden.');
  process.exit(1);
}

console.log('');
/* ========================================================================
   REGELN — bekommt er nur beantwortbare Fragen?

   feldAusnahme() hat DREI Wege: Elias eigener Eintrag (oben), eine Regel
   ueber die Wortart, eine ueber die Quelle. Faellt einer der beiden
   Regel-Wege aus, bekommt er sinnlose Fragen vorgelegt — "wie lautet die
   Wurzel von حَرْف?" hat keine Antwort, und er kann sie nicht loswerden.

   ⛔ Der letzte Fall ist der wichtigste: ein normales Nomen MUSS seine
   Frage bekommen. Ohne ihn waere ein "immer still"-Fehler gruen — und die
   Warteseite dauerhaft leer, ohne dass etwas beantwortet waere.
   [[pruefwerkzeug_mit_eingebauter_antwort]] */
const REGELFAELLE = [
  { w:{id:'r1',type:'particle'}, feld:'root',   quelle:'madina-1',
    still:true,  was:'Partikel — ein حَرْف ist nicht ableitbar' },
  { w:{id:'r2',type:'noun'},     feld:'root',   quelle:'fachbegriffe',
    still:true,  was:'Fachbegriff — gehoert nicht in die Wurzelansicht' },
  { w:{id:'r3',type:'noun'},     feld:'gender', quelle:'fachbegriffe',
    still:true,  was:'Fachbegriff — Metasprache, kein Uebungswort' },
  { w:{id:'r4',type:'noun'},     feld:'root',   quelle:'madina-1',
    still:false, was:'normales Nomen — die Frage MUSS kommen' }
];

console.log('');
console.log('=== Bekommt er nur beantwortbare Fragen? ===');
console.log('');
let regelSchlecht = 0;
for (const r of REGELFAELLE){
  const grund = W.feldAusnahme(r.w, r.feld, r.quelle);
  const ok = r.still ? !!grund : !grund;
  if (!ok) regelSchlecht++;
  console.log('  ' + (ok ? 'ok  ' : '⛔  ') + (grund ? 'still' : 'FRAGE').padEnd(6)
    + r.feld.padEnd(7) + r.quelle.padEnd(14) + r.was);
}

if (regelSchlecht){
  console.log('');
  console.log('⛔ ' + regelSchlecht + ' Regelfall/-faelle falsch. Entweder bekommt Elias sinnlose');
  console.log('   Fragen vorgelegt, oder eine noetige Frage wird nie gestellt.');
  process.exit(1);
}

console.log('');
console.log('✅ Alle zehn Faelle richtig — der Rueckweg traegt in BEIDE Richtungen:');
console.log('   ein Wert kommt auf der Karte an, ein „gibt es nicht“ legt die Frage still,');
console.log('   und sinnlose Fragen entstehen gar nicht erst.');
process.exit(0);
