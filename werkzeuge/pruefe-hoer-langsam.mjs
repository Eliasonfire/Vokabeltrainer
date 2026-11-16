#!/usr/bin/env node
/* pruefe-hoer-langsam.mjs — Hörmodus: derselbe Ton beim dritten Mal langsamer (17.11.2026)
 * ==========================================================================
 *
 *   node werkzeuge/pruefe-hoer-langsam.mjs        Exit 0 = grün, 1 = Befund
 *
 * Elias (Eingang, 16.11.2026): „Im Hörmodus soll derselbe Ton beim dritten Abspielen langsamer
 * wiedergegeben werden" · „Beim 1. und 2. Mal normale Geschwindigkeit, beim 3. Mal reduziert" ·
 * „Zähler pro Ton: bei einem neuen Wort/Ton wieder bei 1 anfangen."
 *
 * Gemessen in der laufenden App (unsichtbarer Edge, werkzeuge/browser.mjs, leeres Profil — sein
 * Lernstand wird nicht berührt). Die Sprachausgabe wird abgefangen: jede Äußerung meldet nur ihr
 * Tempo (`rate`), gesprochen wird nichts.
 *   T1  neues Wort: 1. und 2. Mal 0,85, ab dem 3. Mal langsamer (HOER_LANGSAM_TEMPO)
 *   T2  nächstes Wort: der Zähler fängt wieder bei 1 an
 *   T3  das Vorsprechen nach der Antwort zählt mit (Erscheinen 1, Antwort 2, Lautsprecher 3 = langsam)
 *   T4  die Karteikarte (speakArabic ohne Tempo) bleibt bei 0,85
 * Störtest: hoerNaechstesTempo() gibt immer „normal" zurück → T1 und T3 müssen rot werden.
 */
import { oeffneApp } from './browser.mjs';

const MESSUNG = (stoer) => `(async () => {
  const raten = [];
  /* Ohne Stimmenliste sprechen (wie nach seinem Ja beim Test) — eine erfundene Stimme nimmt der Browser nicht an. */
  window.arabischeStimmen = () => []; ARABIC_VOICES = []; window.arabischOhneListe = () => true;
  speechSynthesis.speak = u => { raten.push(Math.round(u.rate * 100) / 100); };
  speechSynthesis.cancel = () => {};
  if (${stoer}) window.hoerNaechstesTempo = () => undefined;
  const warte = ms => new Promise(r => setTimeout(r, ms));
  showScreen('hoeren');
  HOER_ERSTES_WORT = false;
  naechsteHoerfrage();                       // 1. Wort erscheint und spielt (1)
  const wort1 = HOER.wort;
  hoerAbspielen(); hoerAbspielen(); hoerAbspielen();   // (2) (3) (4)
  const t1 = raten.splice(0);
  naechsteHoerfrage();                       // neues Wort (1)
  const anderes = HOER.wort !== wort1;
  hoerAbspielen();                           // (2)
  const t2 = raten.splice(0);
  naechsteHoerfrage();                       // neues Wort (1)
  beantworteHoerfrage(0); await warte(500);  // Vorsprechen nach der Antwort (2)
  hoerAbspielen();                           // (3)
  const t3 = raten.splice(0);
  speakArabic('كِتَابٌ');                     // wie die Karteikarte
  const t4 = raten.splice(0);
  return { t1, t2, t3, t4, anderes, langsam: HOER_LANGSAM_TEMPO, ab: HOER_LANGSAM_AB };
})()`;

const warte = ms => new Promise(r => setTimeout(r, ms));
let app, echt, stoer;
try { app = await oeffneApp(); }
catch (e) { console.log('⛔ pruefe-hoer-langsam: die App ließ sich nicht öffnen — ' + e.message); process.exit(1); }
try {
  let vorher = -1, gleich = 0;
  for (let i = 0; i < 60 && gleich < 4; i++) { const n = await app.rechne('VOCAB_DATA.length'); gleich = n === vorher ? gleich + 1 : 0; vorher = n; await warte(250); }
  echt = await app.rechne(MESSUNG(false));
  stoer = await app.rechne(MESSUNG(true));
} finally { await app.schliessen(); }

let fehler = 0;
const pruefe = (name, ok, ist) => { console.log((ok ? '  ok ' : '  X  ') + name + (ok ? '' : '   ist: ' + JSON.stringify(ist))); if (!ok) fehler++; };
const gleich = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const faelle = (m) => {
  const L = m.langsam;
  return {
    T1: gleich(m.t1, [0.85, 0.85, L, L]),
    T2: m.anderes && gleich(m.t2, [0.85, 0.85]),
    T3: gleich(m.t3, [0.85, 0.85, L]),
    T4: gleich(m.t4, [0.85]),
  };
};
if (!echt || !Array.isArray(echt.t1)) { console.log('⛔ Messung lieferte nichts: ' + JSON.stringify(echt)); process.exit(1); }
console.log(`Tempo normal 0,85 · langsam ${echt.langsam} ab dem ${echt.ab}. Mal`);
const f = faelle(echt);
pruefe('T1 1. und 2. Mal normal, ab dem 3. Mal langsamer', f.T1 && echt.langsam < 0.85 && echt.ab === 3, echt.t1);
pruefe('T2 neues Wort: Zähler fängt wieder bei 1 an', f.T2, { anderes: echt.anderes, t2: echt.t2 });
pruefe('T3 das Vorsprechen nach der Antwort zählt mit', f.T3, echt.t3);
pruefe('T4 Karteikarte bleibt bei 0,85', f.T4, echt.t4);
const s = faelle(stoer);
const stoerRot = !s.T1 && !s.T3;
console.log(stoerRot ? `  ok STÖRTEST — Tempo immer normal: T1 ${JSON.stringify(stoer.t1)} und T3 ${JSON.stringify(stoer.t3)} rot`
  : `  X  STÖRTEST nicht rot (T1 ${JSON.stringify(stoer.t1)}, T3 ${JSON.stringify(stoer.t3)})`);
if (!stoerRot) fehler++;
console.log(fehler ? `X  ${fehler} Befund(e)` : '✅ Hörmodus: beim dritten Mal langsamer — alles richtig');
process.exit(fehler ? 1 : 0);
