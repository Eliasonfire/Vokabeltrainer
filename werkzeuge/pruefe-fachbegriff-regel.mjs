/* ============================================================================
   Ein Fachbegriff folgt seiner Regel — und dieser Prüfer passt darauf auf.
   ============================================================================

   Elias am 22.09.2026, an drei Karteikarten hintereinander (Verbalsatz,
   Sonnenbuchstaben, Hamzat al-waṣl):

     „woher kommt diese vokabel, ich weiß nicht ob es sich lohnt die zu lernen.
      woher ist sie?"   ·   „das auch"

   und dann, das eigentliche Stück Arbeit:

     „mach diese drei weg und kümmere dich erstmal darum
      DAS DAS AUCH NICHT WIEDER PASSIERT"

   ---------------------------------------------------------------------------
   WAS PASSIERT WAR
   ---------------------------------------------------------------------------
   Am 19.08.2026 hat Elias im Regeldurchgang Regeln von den Karteikarten
   gestrichen — ausdrücklich nur von dort: „genau die regeln die ich eben
   bearbeitet habe galten nur den karteikarten … seperat mache ich das mit dem
   satzmodus bzw uebungsmodus." Die Regeln tragen seitdem
   `nichtAufKarteikarten: true`.

   Zu jeder dieser Regeln gibt es einen FACHBEGRIFF in data/fachbegriffe.js —
   und der ist selbst eine Karteikarte. Er blieb stehen. Elias' Entscheidung war
   damit an der einen Stelle umgesetzt und an der anderen aufgehoben, ohne dass
   irgendetwas rot wurde. Gemessen am 22.09.2026: **13 von 61 Fachbegriffen**.

   Behoben ist es als ABLEITUNG in js/kern.js (`fachbegriffFolgtRegel`, benutzt
   in `passtZurAuswahl`) — nicht als Liste mit dreizehn Kennungen. Eine Liste
   hätte den vierzehnten Fall wieder durchgelassen.
   [[allgemeine_regel_statt_listeneintrag]]

   ---------------------------------------------------------------------------
   WAS DIESER PRÜFER BEWACHT
   ---------------------------------------------------------------------------
   ⭐ Nicht das Ergebnis, sondern die WIRKSAMKEIT. Dass gerade kein Fachbegriff
   fälschlich in der Kartei steht, ist nach der Behebung selbstverständlich —
   ein Prüfer, der das misst, ist für immer grün und beweist nichts. Rot wird er
   dort, wo die Ableitung still verschwinden könnte:

     1. `fachbegriffFolgtRegel` gibt es noch.
     2. `passtZurAuswahl` ruft sie auf — eine Funktion ohne Aufrufer ist
        wirkungslos und sieht trotzdem richtig aus. [[werkzeug_ohne_aufrufer]]
     3. Sie liest `nichtAufKarteikarten` und NICHT `ausgeblendet`. Das sind zwei
        verschiedene Entscheidungen von Elias; das falsche Feld nähme ihm Wörter
        aus dem Satzmodus, die er dort behalten wollte.
     4. Die Ableitung trifft in beide Richtungen — sie findet einen echten Fall
        UND schweigt bei einem Fachbegriff, dessen Regel steht. Ein Prüfer, der
        nur „findet", findet auch dort etwas, wo nichts ist.

   ---------------------------------------------------------------------------
   ⛔⛔ 23.09.2026 — DIE ABLEITUNG WAR NICHT SEIN GRUND
   ---------------------------------------------------------------------------
   Einen Tag später sah Elias مُطَابَقَة im Hörmodus: „das ist keine vokabel die
   ich lernen möchte … ich hattte spezifisch darum gebeten akkusativ, genitiv
   und nominativ und vielleicht noch eine hand voll weitere zu haben aber nicht
   solceh dinge. irgendjemand fügt sich dauerhaft hinzu und das will ich nicht."
   Diese Ableitung hatte genau die drei aus der Kartei genommen, die er WILL,
   und مُطَابَقَة durchgelassen. Sein Grund war „nicht in Auftrag gegeben", nicht
   „Regel gestrichen" — beides fiel bei den drei Beispielen nur zufällig zusammen.
   Seitdem entscheidet die Weißliste FACHBEGRIFF_AUFTRAG (data/fachbegriffe.js),
   bewacht von pruefe-fachbegriff-auftrag.mjs. Ein ruhender Begriff ist gar nicht
   in der App; diese Ableitung wirkt nur noch auf BESTELLTE — die listet der
   Prüfer unten getrennt auf, damit keiner davon still aus der Kartei fällt.

   Aufruf:  node werkzeuge/pruefe-fachbegriff-regel.mjs
            node werkzeuge/pruefe-fachbegriff-regel.mjs --liste    (alle zeigen)
   Exit 0 = in Ordnung, 1 = ein Befund.
   ============================================================================ */

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import vm from 'node:vm';

const HIER   = path.dirname(url.fileURLToPath(import.meta.url));
const WURZEL = path.resolve(HIER, '..');
const zeigeAlle = process.argv.includes('--liste');

const befunde = [];
const meldung = (z) => befunde.push(z);

/* ---------- Daten laden ---------- */

/* ⛔ `const NAME = [...]` landet NICHT am globalen Objekt eines vm-Kontexts.
   Der erste Anlauf dieser Messung suchte deshalb in Object.keys() und fand
   nichts — und weil daneben ein `catch { continue }` stand, sah es aus wie
   „die Datei enthält das Wort nicht". Beides zusammen ist die Falle:
   [[leere_liste_ist_keine_messung]] */
function ladeNamen(datei, namen){
  const quelltext = fs.readFileSync(path.join(WURZEL, datei), 'utf8');
  const ctx = { window: {}, document: {}, __raus: {} };
  vm.createContext(ctx);
  vm.runInContext(quelltext + '\n;' + namen
    .map(n => `try{__raus[${JSON.stringify(n)}]=${n}}catch(e){}`).join(';'), ctx);
  return ctx.__raus;
}

const { FACHBEGRIFF_VOKABELN, FACHBEGRIFF_AUFTRAG } = ladeNamen('data/fachbegriffe.js', ['FACHBEGRIFF_VOKABELN', 'FACHBEGRIFF_AUFTRAG']);
const bestellt = (w) => !!(FACHBEGRIFF_AUFTRAG && Object.prototype.hasOwnProperty.call(FACHBEGRIFF_AUFTRAG, String(w.id)));
const { GRAMMAR_RULES }        = ladeNamen('grammar-data.js',      ['GRAMMAR_RULES']);

if (!Array.isArray(FACHBEGRIFF_VOKABELN) || !FACHBEGRIFF_VOKABELN.length){
  console.log('✖ data/fachbegriffe.js liefert keine Fachbegriffe — nichts zu prüfen.');
  process.exit(1);
}
if (!Array.isArray(GRAMMAR_RULES) || !GRAMMAR_RULES.length){
  console.log('✖ grammar-data.js liefert keine Regeln — nichts zu prüfen.');
  process.exit(1);
}

const regelNach = new Map(GRAMMAR_RULES.map(r => [r.id, r]));

/* ---------- 1. Die Ableitung selbst, nachgebaut ---------- */

/* ⚠️ Nachgebaut und nicht importiert: js/kern.js ist ein Browserskript mit
   Zugriff auf localStorage und das DOM. Damit der Nachbau nicht von der App
   abweicht, prüft Schritt 2 den Quelltext auf genau diese Bedingungen. */
function folgtRegel(w){
  if (!w || w.book !== 'grammar' || !w.regel) return false;
  const r = regelNach.get(w.regel);
  return !!(r && r.nichtAufKarteikarten);
}

const betroffen = FACHBEGRIFF_VOKABELN.filter(folgtRegel);
const ohneRegel = FACHBEGRIFF_VOKABELN.filter(w => w.regel && !regelNach.has(w.regel));

/* ---------- 2. Ist die Ableitung in der App wirksam? ---------- */

const kern = fs.readFileSync(path.join(WURZEL, 'js/kern.js'), 'utf8');

if (!/function\s+fachbegriffFolgtRegel\s*\(/.test(kern))
  meldung('js/kern.js: die Funktion fachbegriffFolgtRegel fehlt — die Ableitung ist weg.');

/* Der Aufruf muss IN passtZurAuswahl stehen. Eine Funktion, die nur definiert
   ist, sortiert nichts aus. */
const iAuswahl = kern.indexOf('function passtZurAuswahl(');
const koerper  = iAuswahl >= 0 ? kern.slice(iAuswahl, iAuswahl + 4000) : '';
if (iAuswahl < 0)
  meldung('js/kern.js: passtZurAuswahl() nicht gefunden — der Prüfer kann die Wirkung nicht belegen.');
else if (!/fachbegriffFolgtRegel\s*\(/.test(koerper))
  meldung('js/kern.js: passtZurAuswahl() ruft fachbegriffFolgtRegel() nicht auf — die Funktion ist wirkungslos, und das sieht man ihr nicht an.');

/* Das richtige Feld. `ausgeblendet` wäre die andere Entscheidung. */
const iFolgt = kern.indexOf('function fachbegriffFolgtRegel(');
const koerperFolgt = iFolgt >= 0 ? kern.slice(iFolgt, kern.indexOf('\n}', iFolgt) + 2) : '';
if (iFolgt >= 0){
  if (!/nichtAufKarteikarten/.test(koerperFolgt))
    meldung('js/kern.js: fachbegriffFolgtRegel() liest nicht nichtAufKarteikarten — ohne dieses Feld greift die Ableitung nicht.');
  if (/\bausgeblendet\b/.test(koerperFolgt))
    meldung('js/kern.js: fachbegriffFolgtRegel() liest `ausgeblendet`. Das ist die Satzmodus-Entscheidung, nicht die der Karteikarten — Elias hat beide am 19.08.2026 ausdrücklich getrennt.');
}

/* ---------- 3. Zweiseitige Eichung ---------- */

/* ⭐ Ein Prüfer ist erst geeicht, wenn er einen bekannten Treffer FINDET und
   bei einem bekannten Nicht-Treffer SCHWEIGT. Beide Fälle kommen aus den
   echten Daten, nicht aus erfundenen Objekten — sonst prüft die Eichung den
   Nachbau statt der Daten. */
const einTreffer   = betroffen[0] || null;
const einNichtFall = FACHBEGRIFF_VOKABELN.find(w => {
  const r = w.regel ? regelNach.get(w.regel) : null;
  return r && !r.nichtAufKarteikarten;
}) || null;

if (!einTreffer && !zeigeAlle){
  /* Kein Treffer ist kein Fehler — aber dann fehlt die eine Hälfte der Eichung,
     und das gehört gesagt statt verschwiegen. */
  console.log('ℹ Zurzeit hängt kein Fachbegriff an einer gestrichenen Regel.');
  console.log('  Die Eichung „findet einen echten Fall" kann deshalb nicht laufen.');
} else if (einTreffer && !folgtRegel(einTreffer)){
  meldung('Eichung: der bekannte Fall ' + einTreffer.id + ' wird nicht erkannt.');
}
if (einNichtFall && folgtRegel(einNichtFall))
  meldung('Eichung: ' + einNichtFall.id + ' hat eine stehende Regel und wird trotzdem aussortiert — die Ableitung feuert zu breit.');

/* Eine Regel, auf die ein Fachbegriff zeigt, die es aber nicht gibt, ist ein
   eigener Befund: die Ableitung kann dort nichts entscheiden.
   ⚠️ f19-Karten sind keine grammar-Regeln und zählen nicht als Fehlverweis —
   sie haben ihren eigenen Bestand (regelArt() in js/regeln.js kennt beide). */
const echteFehlverweise = ohneRegel.filter(w => !/^f19-/.test(String(w.regel)));
if (echteFehlverweise.length)
  meldung('Fachbegriff(e) zeigen auf eine Regel, die es in grammar-data.js nicht gibt: '
    + echteFehlverweise.map(w => w.id + ' → ' + w.regel).join(', '));

/* ---------- Ausgabe ---------- */

console.log('--- Fachbegriff folgt seiner Regel ---\n');
console.log('Fachbegriffe gesamt:                 ' + FACHBEGRIFF_VOKABELN.length);
console.log('davon mit Regelbezug:                ' + FACHBEGRIFF_VOKABELN.filter(w => w.regel).length);
console.log('an einer gestrichenen Regel:         ' + betroffen.length + '  (nicht auf Karteikarten)');
console.log('auf f19-Karten verweisend:           ' + (ohneRegel.length - echteFehlverweise.length));

/* ⛔ Seit dem 23.09.2026 getrennt: nur ein BESTELLTER Begriff ist überhaupt in
   der App. Ein ruhender „bleibt" nirgends — die alte Zeile „sie bleiben in
   Satzmodus, Suche und Hörmodus" stimmte für ihn nicht mehr. */
const betroffenBestellt = betroffen.filter(bestellt);
const betroffenRuhend   = betroffen.filter(w => !bestellt(w));
console.log('davon bestellt (FACHBEGRIFF_AUFTRAG): ' + betroffenBestellt.length + ' · ruhend, also gar nicht in der App: ' + betroffenRuhend.length);
if (betroffenBestellt.length){
  console.log('\nBestellt, aber aus der Kartei — Hörmodus, Suche und Satzmodus behalten sie:');
  for (const w of betroffenBestellt){
    console.log('  ' + w.id.padEnd(24) + (w.de || '').slice(0, 46).padEnd(48) + '← ' + w.regel);
  }
}
if (betroffenRuhend.length && zeigeAlle){
  console.log('\nRuhend (nicht bestellt) — in keinem Modus:');
  for (const w of betroffenRuhend) console.log('  ' + w.id.padEnd(24) + (w.de || '').slice(0, 46));
}

if (befunde.length){
  console.log('\n✖ ' + befunde.length + ' Befund(e):');
  befunde.forEach(z => console.log('  · ' + z));
  process.exit(1);
}
console.log('\n✅ Die Ableitung ist vorhanden, wird aufgerufen und trifft in beide Richtungen.');
process.exit(0);
