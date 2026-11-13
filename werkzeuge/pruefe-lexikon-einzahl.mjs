#!/usr/bin/env node
/* pruefe-lexikon-einzahl.mjs — findet das Übungs-Nachschlagewerk für jede Form die EINZAHLKARTE? (13.11.2026)
 * ==========================================================================
 *
 *   node werkzeuge/pruefe-lexikon-einzahl.mjs        Exit 0 = grün, 1 = Befund oder nichts gemessen
 *
 * Elias, 13.11.2026, nachdem Übung 18 „Mehrzahl einsetzen" keine Aufgaben mehr hatte und die übrigen
 * Leser desselben Nachschlagewerks noch ungeprüft waren: „ja prüfe, vielleicht einen prüfer dafür
 * mcahen aber idk".
 *
 * Der Fehler: seit 19.10.2026 ist jede Mehrzahl eine eigene Karte (id „…#pl", `ar` = die Mehrzahl,
 * kein sg/pl/femSg/gender). uebungLexikon() in js/uebung.js trug `ar` zuerst ein — 213 Formen zeigten
 * auf eine Mehrzahlkarte. Alle sieben Leser (Geschlecht, „Einzahl klar", Verb danach, Übungen 11, 12,
 * 16, 18) erwarten die Einzahlkarte. Folgen, gemessen: Übung 18 hatte 0 statt 43 Aufgaben, Übung 16
 * 34 zu wenig, Übung 11 bot bei هَذِهِ كُتُبٌ das هَؤُلَاءِ als Falle an.
 *
 * Gemessen in der laufenden App (unsichtbarer Edge, werkzeuge/browser.mjs, leeres Profil), ERST wenn
 * die Buchvokabeln geladen sind — vorher sind weniger Mehrzahlkarten da und der Fehler zeigt sich nur
 * halb (so schwankte pruefe-aufgaben.mjs). Sein Lernstand wird weder gelesen noch berührt.
 *   L1  Keine Form im Nachschlagewerk zeigt auf eine Mehrzahlkarte.
 *   L2  Jede Mehrzahlkarte, deren Einzahlkarte da ist: ihre Form führt nicht ins Leere und nicht zu
 *       einer Mehrzahlkarte. Führt sie zu einer EIGENEN Karte mit genau dieser Form (gram-awlad), ist
 *       das nur ein Hinweis.
 * Störtest: dasselbe mit dem Nachschlagewerk von vor dem 13.11.2026 (alle Karten eingetragen) — muss rot sein.
 */
import { oeffneApp } from './browser.mjs';

const MESSUNG = (alt) => `(() => {
  const echt = uebungLexikon;
  if (${alt}) {
    UEBUNG_LEX = new Map();
    const ein = (form, w) => { if (!form) return; String(form).split(/\\s*[|/]\\s*/).filter(Boolean).forEach(e => {
      const k = uebungOhneEndung(e); if (k && !UEBUNG_LEX.has(k)) UEBUNG_LEX.set(k, w); }); };
    VOCAB_DATA.forEach(w => ein(w.ar, w)); VOCAB_DATA.forEach(w => { ein(w.sg, w); ein(w.femSg, w); ein(w.pl, w); });
  } else UEBUNG_LEX = null;
  const lex = uebungLexikon();
  const istPk = w => !!w && istPluralKarte(String(w.id));
  const L1 = []; for (const [k, w] of lex) if (istPk(w)) L1.push(k + ' → ' + w.id);
  const ids = new Set(VOCAB_DATA.map(w => String(w.id)));
  const L2 = [], eigene = []; let geprueft = 0;
  for (const w of VOCAB_DATA) {
    if (!istPk(w)) continue;
    const sg = String(w.plVon || String(w.id).slice(0, -PLURAL_MARKE.length));
    if (!ids.has(sg)) continue;
    geprueft++;
    const v = uebungVokabel(String(w.ar).split(/\\s*[|/]\\s*/)[0]);
    /* Eine EIGENE Karte mit genau dieser Form (gram-awlad „Kinder", seit 16.09.2026 auf seinen Wunsch:
       „die vokabeln die ich dort aufgeschrieben habe mit rot die brauche ich auch als karteikarten")
       ist kein Fehler — sie ist ein eigenes Wort und gewinnt bewusst („ar zuerst"). Nur ein Hinweis. */
    if (!v || istPk(v)) L2.push(w.ar + ' (' + w.id + ') → ' + (v ? v.id : 'nichts'));
    else if (!v.pl) eigene.push(w.ar + ' (' + w.id + ') → eigene Karte ' + v.id);
  }
  UEBUNG_LEX = null;
  return { karten: VOCAB_DATA.length, mehrzahlkarten: VOCAB_DATA.filter(istPk).length, geprueft, L1, L2, eigene };
})()`;

const warte = ms => new Promise(r => setTimeout(r, ms));
let app, echt, stoer;
try { app = await oeffneApp(); }
catch (e) { console.log('⛔ pruefe-lexikon-einzahl: die App ließ sich nicht im Browser öffnen — ' + e.message); process.exit(1); }
try {
  /* Warten, bis die Kartenzahl eine Sekunde lang steht (die Buchvokabeln kommen nach dem Start). */
  let vorher = -1, gleich = 0;
  for (let i = 0; i < 60 && gleich < 4; i++) {
    const n = await app.rechne('VOCAB_DATA.length');
    gleich = (n === vorher) ? gleich + 1 : 0; vorher = n;
    await warte(250);
  }
  echt = await app.rechne(MESSUNG(false));
  stoer = await app.rechne(MESSUNG(true));
} finally { await app.schliessen(); }

const zeige = (name, L) => { if (L.length) { console.log(`   ${name}: ${L.length}`); L.slice(0, 5).forEach(x => console.log('      ' + x)); } };
console.log(`${echt.karten} Karten, ${echt.mehrzahlkarten} Mehrzahlkarten, ${echt.geprueft} mit Einzahlkarte geprüft`);
let rot = 0;
if (!echt.mehrzahlkarten || !echt.geprueft) { console.log('⛔ Nichts gemessen: keine Mehrzahlkarten geladen.'); rot = 1; }
if (echt.L1.length || echt.L2.length) { console.log('⛔ Befunde:'); zeige('L1 Form zeigt auf eine Mehrzahlkarte', echt.L1); zeige('L2 Mehrzahl führt nicht zur Einzahlkarte', echt.L2); rot = 1; }
if (echt.eigene.length) { console.log('   ⓘ eine eigene Karte trägt die Mehrzahl als Wort (kein Fehler):'); echt.eigene.forEach(x => console.log('      ' + x)); }
const stoerRot = stoer.L1.length > 0 && stoer.L2.length > 0;
console.log(stoerRot ? `Störtest (altes Nachschlagewerk): rot ✓ (L1 ${stoer.L1.length}, L2 ${stoer.L2.length})`
  : `⛔ Störtest NICHT rot (L1 ${stoer.L1.length}, L2 ${stoer.L2.length}) — die Messung sagt nichts.`);
if (!stoerRot) rot = 1;
console.log(rot ? 'pruefe-lexikon-einzahl: ROT' : 'pruefe-lexikon-einzahl: grün');
process.exit(rot);
