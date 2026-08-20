#!/usr/bin/env node
/* ===================== Wortfeld-Zuordnung nachmessen =====================
   Elias am 30.07.2026 um 00:40, woertlich: "neue Vokabeln die dazu kommen
   sollen auch automatisch von dir in den Wortfeldern automatisch sinnvoll
   eingelegt werden."

   WAS SCHON VON SELBST GEHT, damit dieses Skript nicht mehr verspricht als es
   halten kann: Die Zuordnung wird bei jedem Aufruf BERECHNET (`wortfelder()` in
   js/kern.js), nirgends gespeichert. Eine neue Vokabel mit "Hund" in der
   Uebersetzung landet also ohne jede Aenderung unter Tiere.

   WAS NICHT VON SELBST GEHT: eine Vokabel, deren Uebersetzung kein Suchwort der
   Tabelle trifft. Die faellt unter "Noch ohne Wortfeld" und braucht einen neuen
   Eintrag in wortfelder-data.js. Vollautomatisch waere nur Raten, und Raten
   heisst hier falsche Einordnung — genau der Fehler, an dem die Suche ueber
   deutsche Wortendungen gescheitert ist (durchbohren -> Ohren, praktisch ->
   tisch; die Begruendung steht ausfuehrlich in js/kern.js).

   Dieses Skript ist deshalb der Melder fuer den zweiten Fall: es sagt nach
   jedem neuen Abzug NAMENTLICH, welche Vokabel noch nirgends auftaucht.

   ⚠️ GEZAEHLT WIRD OHNE DIE WORTART-FELDER, und das ist der ganze Witz an der
   Messung. Nomen, Verben, Adjektive, Partikeln kommen direkt aus dem Abzug —
   jede Vokabel hat eine Wortart, also trifft jede Vokabel mindestens ein Feld.
   Der erste Lauf dieses Skripts am 30.07.2026 meldete darum "4602 von 4602
   zugeordnet", und diese Zahl war zwar richtig gerechnet, aber wertlos: sie
   kann gar nicht anders ausfallen. Was Elias meint, wenn er von Wortfeldern
   spricht, sind die BEDEUTUNGSFELDER (Tiere, Schule, Körperteile). Ein Wort,
   das nur unter "Nomen" steht, ist fuer ihn unsortiert. Die Wortart-Felder
   tragen deshalb `wortart: true` in wortfelder-data.js und bleiben hier
   draussen.

   Aufruf:   node pruefe-wortfelder.js
             node pruefe-wortfelder.js --alle     jede Vokabel ohne Feld
             node pruefe-wortfelder.js --felder   Stichprobe je Feld
   Rueckgabe: 0 = die Tabelle selbst ist in Ordnung
              1 = die TABELLE ist kaputt (Feld ohne Kriterium, Namensdopplung)

   ⚠️ Eine Vokabel ohne Feld ist ausdruecklich KEIN Exitcode 1. Ein frischer
   Abzug bringt zwangslaeufig unbekannte Woerter mit, und der darf keinen Push
   aufhalten (deshalb haengt es in validate.js als Hinweis, nicht als Fehler).
   Kaputt ist nur eine Tabelle, die sich selbst widerspricht — die wirkt sofort
   in der App.

   Die Pruefliste laedt die Funktionen AUS js/kern.js statt sie nachzubauen.
   Eine Kopie wuerde mit der Zeit auseinanderlaufen und dann etwas anderes
   messen als die App anzeigt.
   ===================================================================== */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DIR = __dirname;
const ALLE = process.argv.includes('--alle');
const FELDER = process.argv.includes('--felder');

const errors = [];
const info = [];

/* ---------- Tabelle und Zuordnungslogik in einer Sandbox laden ---------- */
function ladeLogik(){
  const kern = fs.readFileSync(path.join(DIR, 'js', 'kern.js'), 'utf8');
  const von = kern.indexOf('function wortfeldForm');
  const bis = kern.indexOf('const OHNE_WORTFELD');
  if (von < 0 || bis < 0 || bis <= von)
    throw new Error('js/kern.js: der Block von wortfeldForm bis OHNE_WORTFELD wurde nicht gefunden — wurde er umbenannt oder verschoben?');

  const code = fs.readFileSync(path.join(DIR, 'wortfelder-data.js'), 'utf8')
    + '\n' + kern.slice(von, bis)
    + '\nglobalThis.__W = { WORTFELDER, passtInsFeld };';
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  return { ...ctx.__W, ctx };
}

let WORTFELDER, passtInsFeld, ctx;
try {
  ({ WORTFELDER, passtInsFeld, ctx } = ladeLogik());
} catch (e) {
  console.log('--- Wortfelder ---\n');
  console.log('  FEHLER ' + e.message);
  process.exit(1);
}

/* ---------- Vokabeln laden ----------
   vocab-data.js sind die Woerter, mit denen Elias lernt, und die liegen im
   Repo. Die Buchabzuege unter data/ liegen wegen der arabicroots-AGB Ziffer 9
   NICHT im Repo — fehlen sie, ist das kein Fehler, sondern der Normalfall auf
   einem fremden Rechner. Dann wird eben nur ueber vocab-data.js gemessen und
   das steht auch so in der Ausgabe. */
const quellen = [];
try {
  const vocab = fs.readFileSync(path.join(DIR, 'vocab-data.js'), 'utf8')
    + '\nglobalThis.__V = VOCAB_DATA;';
  vm.runInContext(vocab, ctx);
  quellen.push({ name: 'vocab-data.js (Lernbestand)', woerter: ctx.__V });
} catch (e) {
  errors.push(`vocab-data.js nicht ausfuehrbar: ${e.message}`);
}

const dataDir = path.join(DIR, 'data');
let abzuege = 0;
if (fs.existsSync(dataDir)){
  for (const f of fs.readdirSync(dataDir).filter(x => x.startsWith('vokabeln')).sort()){
    try {
      vm.runInContext(fs.readFileSync(path.join(dataDir, f), 'utf8'), ctx);
      abzuege++;
    } catch (e) {
      errors.push(`data/${f} nicht ausfuehrbar: ${e.message}`);
    }
  }
  const buecher = ctx.window && ctx.window.VOKABELN ? Object.entries(ctx.window.VOKABELN) : [];
  buecher.forEach(([slug, liste]) => quellen.push({ name: `data (${slug})`, woerter: liste }));
}

/* ---------- --fenster: nur, was Elias JETZT erreichen kann ----------

   ⛔ OHNE DIESEN SCHALTER IST DIE ZAHL FUER EINEN WARTUNGSLAUF NUTZLOS.
   Gemessen am 20.08.2026: „3509 Vokabel(n) stehen nur unter ihrer Wortart" —
   ueber alle 4604 Woerter aus neun Buechern, von denen er 189 erreicht. Eine
   Zahl, die zu 96 % aus Woertern besteht, die er nie sieht, sagt ueber seinen
   Bestand nichts und wird beim dritten Lauf ueberlesen.
   [[milder_bezugspunkt_verdeckt_mangel]] · [[trefferquote_ohne_preis]]

   Das Fenster wird genauso gebildet wie in werkzeuge/vorrat.mjs: Elias'
   `angabe` aus data/lernstand.json plus drei Kapitel, geschnitten mit dem, was
   in js/kern.js freigeschaltet ist. */
const FENSTER = process.argv.includes('--fenster');
if (FENSTER){
  try {
    const kern = fs.readFileSync(path.join(DIR, 'js', 'kern.js'), 'utf8');
    const mF = kern.match(/const FREIGESCHALTET\s*=\s*(\{[\s\S]*?\n\});/);
    const frei = mF ? vm.runInNewContext('(' + mF[1].replace(/\/\/[^\n]*/g, '') + ')') : {};
    const lern = JSON.parse(fs.readFileSync(path.join(DIR, 'data', 'lernstand.json'), 'utf8'));
    const angabe = (lern && lern.angabe) || {};
    const VORAUS = 3;
    let n = 0;
    for (const q of quellen){
      const m = /^data \((.+)\)$/.exec(q.name);
      if (!m){ q.woerter = []; continue; }   /* vocab-data.js ist Lernbestand, nicht Fenster */
      const slug = m[1];
      if (!angabe[slug]){ q.woerter = []; continue; }
      const grenze = angabe[slug] + VORAUS;
      const kapitel = (frei[slug] || []).map(Number).filter(k => k <= grenze);
      q.woerter = (q.woerter || []).filter(w => kapitel.includes(Number(w.chapter)));
      n += q.woerter.length;
    }
    quellen = quellen.filter(q => (q.woerter || []).length);
    info.push(`--fenster: nur die ${n} Woerter, die Elias jetzt erreicht `
      + `(${Object.entries(angabe).map(([b, k]) => `${b} bis ${k}+${VORAUS}`).join(', ')}).`);
  } catch (e) {
    errors.push('--fenster: Lernstand oder FREIGESCHALTET nicht lesbar: ' + e.message);
  }
}

/* ---------- 1. Die Tabelle gegen sich selbst pruefen ----------
   Das ist der Teil, der einen Push aufhalten darf: ein Feld ohne jedes
   Kriterium trifft nie etwas und steht dann als leere Kachel in der App, eine
   Namensdopplung laesst zwei Felder in der Ansicht verschmelzen. */
const KRITERIEN = ['typ', 'formen', 'woerter'];
const namen = new Map();
WORTFELDER.forEach((feld, i) => {
  const wo = `WORTFELDER[${i}]`;
  if (!feld || typeof feld !== 'object'){ errors.push(`${wo} ist kein Objekt.`); return; }
  if (!feld.name) errors.push(`${wo} hat keinen Namen.`);
  else if (namen.has(feld.name)) errors.push(`Doppelter Feldname "${feld.name}" (${wo} und WORTFELDER[${namen.get(feld.name)}]).`);
  else namen.set(feld.name, i);

  if (!KRITERIEN.some(k => feld[k]))
    errors.push(`${wo} ("${feld.name}") nennt kein Kriterium (${KRITERIEN.join(', ')}) — das Feld bleibt immer leer.`);

  /* Eine Sperre ohne Treffer, den sie sperren koennte, ist meistens ein Tippfehler
     im gesperrten Wort. Nur ein Hinweis: sie kann auch Vorsorge fuer den naechsten
     Abzug sein. */
  ['nicht', 'nichtFormen'].forEach(k => {
    if (feld[k] && !Array.isArray(feld[k])) errors.push(`${wo} ("${feld.name}"): ${k} ist keine Liste.`);
  });
});
info.push(`Tabelle: ${WORTFELDER.length} Felder, ${namen.size} eindeutige Namen.`);

/* ---------- 2. Zuordnung messen ----------
   Zwei Zahlen je Quelle, und nur die zweite ist eine Auskunft (siehe Kopf):
   `getroffen`   irgendein Feld, Wortart eingeschlossen — immer >= 1
   `bedeutung`   ein Feld, das etwas ueber den INHALT sagt */
const zaehler = new Map(WORTFELDER.map(f => [f.name, 0]));
const beispiele = new Map(WORTFELDER.map(f => [f.name, []]));
const ohneFeld = [];
let gesamt = 0;

quellen.forEach(q => {
  const ohne = [];
  (q.woerter || []).forEach(w => {
    if (!w || !w.de) return;
    gesamt++;
    let bedeutung = 0;
    WORTFELDER.forEach(feld => {
      if (!passtInsFeld(w, feld)) return;
      if (!feld.wortart) bedeutung++;
      zaehler.set(feld.name, zaehler.get(feld.name) + 1);
      const b = beispiele.get(feld.name);
      if (b.length < 6) b.push(w.de);
    });
    if (!bedeutung) ohne.push(w);
  });
  const n = (q.woerter || []).length;
  const anteil = n ? ((n - ohne.length) / n * 100).toFixed(0) : '0';
  info.push(`${q.name}: ${n - ohne.length} von ${n} (${anteil} %) mit Bedeutungsfeld${ohne.length ? `, ${ohne.length} nur mit Wortart` : ''}.`);
  if (ohne.length) ohneFeld.push({ quelle: q.name, woerter: ohne });
});

const leer = [...zaehler.entries()].filter(([, n]) => n === 0).map(([name]) => name);
const fehlend = ohneFeld.reduce((s, g) => s + g.woerter.length, 0);

/* validate.js haengt diese Messung als Hinweis ein und braucht dafuer die
   Zahlen, nicht die Ausgabe. Node legt jedes CommonJS-Modul in eine Funktion,
   deshalb ist ein `return` hier oben gueltig — so bleibt der Berichtsteil
   unten ohne zusaetzliche Einrueckung stehen. */
module.exports = { WORTFELDER, passtInsFeld, quellen, ohneFeld, gesamt, fehlend, tabellenFehler: errors };
if (require.main !== module) return;

/* ---------- Ausgabe ---------- */
console.log('--- Wortfelder ---\n');
info.forEach(m => console.log('  ok   ' + m));
if (abzuege === 0)
  console.log('  ok   data/vokabeln-*.js nicht vorhanden — nur der Lernbestand wurde gemessen (die Abzuege sind wegen der arabicroots-AGB nicht im Repo).');

if (leer.length)
  console.log(`\n  warn ${leer.length} Feld(er) ohne einen einzigen Treffer: ${leer.join(' · ')}`);

if (ohneFeld.length){
  console.log(`\n  warn ${fehlend} Vokabel(n) stehen nur unter ihrer Wortart und in keinem Bedeutungsfeld.`);
  console.log('       Sie sind in der App auffindbar (unter Nomen, Verben …), aber nicht sortiert.');
  console.log('       Wer eines aufnehmen will, ergaenzt das deutsche Suchwort in wortfelder-data.js.');
  console.log('       Nicht raten: ein falsches Feld ist schlimmer als keines, weil man ihm glaubt.');
  /* ⚠️ Die Zahl darf nicht als eine gelesen werden. Bei einem Adjektiv IST
     "Adjektive" das Bedeutungsfeld — Elias hat es in seiner Liste ausdruecklich
     neben Tiere und Schule genannt. Bei einem NOMEN sagt "Nomen" dagegen nichts,
     und nur diese Gruppe ist die echte Luecke. Am 30.07.2026 gemessen: von den
     40 unsortierten Woertern des Lernbestands ist kein einziges ein Nomen. */
  console.log('\n       Gezaehlt wird auch das Nomen darunter: nur DIE Gruppe ist eine echte Luecke —');
  console.log('       bei einem Adjektiv oder einer Partikel ist die Wortart selbst schon die Kategorie.');

  ohneFeld.forEach(g => {
    const zeigen = ALLE ? g.woerter : g.woerter.slice(0, 20);
    const nomen = g.woerter.filter(w => w.type === 'noun').length;
    console.log(`\n  ${g.quelle} (${g.woerter.length}, davon ${nomen} Nomen):`);
    zeigen.forEach(w => console.log(`    ${w.ar}   ${w.de}${w.type ? `   [${w.type}]` : ''}`));
    if (!ALLE && g.woerter.length > zeigen.length)
      console.log(`    … ${g.woerter.length - zeigen.length} weitere (mit --alle vollstaendig)`);
  });
}

if (FELDER){
  console.log('\n--- Treffer je Feld ---');
  console.log('Feld                             Treffer   Stichprobe');
  WORTFELDER.forEach(f => {
    const bsp = beispiele.get(f.name).map(s => s.slice(0, 20)).join(' · ');
    console.log((f.name + (f.wortart ? ' (Wortart)' : '')).padEnd(32) + String(zaehler.get(f.name)).padStart(6) + '   ' + bsp);
  });
}

if (errors.length){
  console.log('');
  errors.forEach(m => console.log('  FEHLER ' + m));
  console.log(`\n${errors.length} Fehler in der Tabelle — NICHT pushen.`);
  process.exit(1);
}
console.log(`\nTabelle in Ordnung. ${gesamt - fehlend} von ${gesamt} Vokabeln haben ein Bedeutungsfeld.`);
process.exit(0);
