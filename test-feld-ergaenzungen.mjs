/* test-feld-ergaenzungen.mjs — kommt Elias' Antwort wirklich auf der Karte an?
 * ==========================================================================
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
console.log('✅ Alle drei Faelle richtig — der Rueckweg traegt bis auf die Karte.');
process.exit(0);
