#!/usr/bin/env node
/* pruefe-hoer-langsam.mjs — Hörmodus: langsam nur mit der Schnecken-Taste (seit 23.11.2026)
 * ==========================================================================
 *
 *   node werkzeuge/pruefe-hoer-langsam.mjs        Exit 0 = grün, 1 = Befund
 *
 * Elias, 23.11.2026 (über die Talib-Sitzung, für alle seine Apps): „wir sollten beim hören modus
 * auch so ein schnecken zeichen haben statt alle drei mal es langsamer zu machen. das sollst du für
 * all meine apps machen". Vorher (17.11.2026) sprach die App ab dem dritten Abspielen desselben
 * Worts von selbst langsamer; dieser Prüfer bewachte genau das und ist am 23.11.2026 umgedreht.
 *
 * Gemessen in der laufenden App (unsichtbarer Edge, werkzeuge/browser.mjs, leeres Profil — sein
 * Lernstand wird nicht berührt). Die Sprachausgabe wird abgefangen: jede Äußerung meldet nur ihr
 * Tempo (`rate`), gesprochen wird nichts. Getippt wird wie von Hand: click() auf die Tasten.
 *   T1  Lautsprecher viermal: immer 0,85 (kein Langsamerwerden mehr)
 *   T2  Schnecke: langsam (HOER_LANGSAM_TEMPO), auch beim ersten Mal
 *   T3  das Vorsprechen nach der Antwort ist normal
 *   T4  die Karteikarte (speakArabic ohne Tempo) bleibt bei 0,85
 *   T5  die Schnecke steht neben dem Lautsprecher, der Lautsprecher bleibt in der Mitte der Karte
 * Störtest: die Schnecke ruft hoerAbspielen(false) → T2 muss rot werden.
 */
import { oeffneApp } from './browser.mjs';

const MESSUNG = (stoer) => `(async () => {
  const raten = [];
  /* Ohne Stimmenliste sprechen (wie nach seinem Ja beim Test) — eine erfundene Stimme nimmt der Browser nicht an. */
  window.arabischeStimmen = () => []; ARABIC_VOICES = []; window.arabischOhneListe = () => true;
  speechSynthesis.speak = u => { raten.push(Math.round(u.rate * 100) / 100); };
  speechSynthesis.cancel = () => {};
  const warte = ms => new Promise(r => setTimeout(r, ms));
  showScreen('hoeren');
  HOER_ERSTES_WORT = true;
  naechsteHoerfrage();                       // 1. Wort erscheint, spielt nicht von selbst
  const laut = document.getElementById('btnHoerPlay');
  const schnecke = document.getElementById('btnHoerLangsam');
  if (!laut || !schnecke) return { fehlt: !laut ? 'btnHoerPlay' : 'btnHoerLangsam' };
  if (${stoer}) schnecke.id = 'btnHoerLangsamWeg';   // Störung: die Taste wird nicht mehr erkannt
  laut.click(); laut.click(); laut.click(); laut.click();
  const t1 = raten.splice(0);
  schnecke.click();
  const t2 = raten.splice(0);
  if (${stoer}) schnecke.id = 'btnHoerLangsam';
  beantworteHoerfrage(0); await warte(500);  // Vorsprechen nach der Antwort
  const t3 = raten.splice(0);
  speakArabic('كِتَابٌ');                     // wie die Karteikarte
  const t4 = raten.splice(0);
  const karte = document.getElementById('hoerKarte').getBoundingClientRect();
  const l = laut.getBoundingClientRect(), s = schnecke.getBoundingClientRect();
  const mitteKarte = karte.left + karte.width / 2, mitteLaut = l.left + l.width / 2;
  return { t1, t2, t3, t4, langsam: HOER_LANGSAM_TEMPO,
    lage: { mittenAbstand: Math.round(Math.abs(mitteKarte - mitteLaut)),
            schneckeRechts: s.left >= l.right, gleicheHoehe: Math.abs((s.top + s.height / 2) - (l.top + l.height / 2)) < 4,
            schneckeBreite: Math.round(s.width) } };
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
if (!echt || echt.fehlt || !Array.isArray(echt.t1)) { console.log('⛔ Messung lieferte nichts: ' + JSON.stringify(echt)); process.exit(1); }
const L = echt.langsam;
console.log(`Tempo normal 0,85 · Schnecke ${L}`);
pruefe('T1 Lautsprecher viermal: immer normal', gleich(echt.t1, [0.85, 0.85, 0.85, 0.85]), echt.t1);
pruefe('T2 Schnecke: langsam, schon beim ersten Mal', L < 0.85 && gleich(echt.t2, [L]), echt.t2);
pruefe('T3 Vorsprechen nach der Antwort: normal', gleich(echt.t3, [0.85]), echt.t3);
pruefe('T4 Karteikarte bleibt bei 0,85', gleich(echt.t4, [0.85]), echt.t4);
pruefe('T5 Schnecke rechts neben dem Lautsprecher, Lautsprecher mittig',
  echt.lage.mittenAbstand <= 2 && echt.lage.schneckeRechts && echt.lage.gleicheHoehe && echt.lage.schneckeBreite >= 44, echt.lage);
const stoerRot = !(stoer && gleich(stoer.t2, [L]));
console.log(stoerRot ? `  ok STÖRTEST — Schnecke nicht erkannt: T2 ${JSON.stringify(stoer && stoer.t2)} rot`
  : `  X  STÖRTEST nicht rot (T2 ${JSON.stringify(stoer && stoer.t2)})`);
if (!stoerRot) fehler++;
console.log(fehler ? `X  ${fehler} Befund(e)` : '✅ Hörmodus: Lautsprecher normal, Schnecke langsam — alles richtig');
process.exit(fehler ? 1 : 0);
