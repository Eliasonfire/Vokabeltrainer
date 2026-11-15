#!/usr/bin/env node
/* pruefe-mensch-ding.mjs — ist jedes Nomen mit Mehrzahl als Mensch ODER Ding eingeordnet? (15.11.2026)
 * ==========================================================================
 *
 *   node werkzeuge/pruefe-mensch-ding.mjs        Exit 0 = grün, 1 = Befund oder nichts gemessen
 *
 * Elias, 15.11.2026, für die Übung „Mehrzahl von Dingen" (Kapitel 16): „alles was menschlich ist das
 * kannst du im code irgendwie markieren (ohne das ich es sehe) und einen prüfer machen."
 * Die Markierung sind die Listen UEB_MENSCH_IDS und UEB_DING_IDS in js/uebung.js.
 *
 * Gemessen in der laufenden App (unsichtbarer Edge, werkzeuge/browser.mjs, leeres Profil), erst wenn
 * die Buchvokabeln geladen sind. Sein Lernstand wird weder gelesen noch berührt. Eigene Wörter aus
 * seinem Browser sieht der Prüfer NICHT — dort gilt: nicht eingeordnet = kein Ding, also nie benutzt.
 *   M1  Jedes Nomen mit Mehrzahl (keine Mehrzahlkarte, kein Zahlwort) steht in GENAU einer Liste.
 *       Rot heißt meist: eine neue Karte ist dazugekommen und muss eingeordnet werden.
 *   M2  Jede id in den Listen gibt es als Nomen mit Mehrzahl (sonst ist die Liste veraltet).
 *   M3  Kein Nomen mit regelmäßiger männlicher Mehrzahl (…ُونَ) steht bei den Dingen — die gibt es
 *       nur für Menschen. Fängt einen Mensch, der versehentlich bei den Dingen gelandet ist.
 *   M4  Eine Mehrzahlkarte (…#pl) wird wie ihre Einzahl eingeordnet.
 *   M5  Kein Engel, kein Dschinn, kein Mensch steht bei den Dingen (Bedeutung der Karte). Elias,
 *       15.11.2026: „auch engel und Jinn gehören zu den denkenden". Am 15.11.2026 gab es dafür noch
 *       keine Karte — M5 bewacht die erste, die kommt.
 * Störtest: ein Mensch wird aus der Liste genommen (M1 muss rot werden), der Lehrer wird zu den
 * Dingen gelegt (M3 muss rot werden), und eine Probekarte „Engel" kommt kurz zu den Dingen (M5
 * muss rot werden). Danach stehen Listen und Karten wieder wie vorher.
 */
import { oeffneApp } from './browser.mjs';

const MESSUNG = (stoer) => `(() => {
  const nimmRaus = '45761', verlege = '45772';
  /* Ausnahmen zu M3: Dinge, deren Karte trotzdem eine Form auf -ūna trägt. 45940 سَنَةٌ „Jahr"
     hat auf der Karte die zweite Mehrzahl سِنُونَ — ein Jahr ist kein Mensch. */
  const M3_AUSNAHME = new Set(['45940']);
  const DENKEND = /Engel|Dschinn|Djinn|Jinn|Mensch/i;
  const probe = { id: 'stoer-engel', ar: 'x', pl: 'y', de: 'Engel', type: 'noun' };
  if (${stoer}) { UEB_MENSCH_IDS.delete(nimmRaus); UEB_MENSCH_IDS.delete(verlege); UEB_DING_IDS.add(verlege);
    VOCAB_DATA.push(probe); UEB_DING_IDS.add(probe.id); }
  try {
    const nomen = VOCAB_DATA.filter(w => w && w.pl && w.type === 'noun' && !istPluralKarte(String(w.id)) && !istZahlwort(w));
    const ids = new Set(nomen.map(w => String(w.id)));
    const M1 = [], M2 = [], M3 = [], M4 = [], M5 = [];
    for (const w of VOCAB_DATA) if (w && UEB_DING_IDS.has(String(w.id)) && DENKEND.test(String(w.de)))
      M5.push(w.id + ' „' + w.de + '" — ein Wesen mit Verstand steht bei den Dingen');
    for (const w of nomen) {
      const id = String(w.id), m = UEB_MENSCH_IDS.has(id), d = UEB_DING_IDS.has(id);
      if (m === d) M1.push(id + ' ' + w.ar + ' „' + w.de + '" — ' + (m ? 'in beiden Listen' : 'in keiner Liste'));
      if (d && !M3_AUSNAHME.has(id) && String(w.pl).normalize('NFC').split(/\\s*[|/]\\s*/).some(f => /\\u0648\\u0646\\u064e?$/.test(f.trim())))
        M3.push(id + ' ' + w.ar + ' „' + w.de + '" — Mehrzahl auf -ūna, steht bei den Dingen');
    }
    for (const id of [...UEB_MENSCH_IDS, ...UEB_DING_IDS]) if (!ids.has(id)) M2.push(id);
    let mehrzahlkarten = 0;
    for (const w of VOCAB_DATA) {
      if (!w || !istPluralKarte(String(w.id))) continue;
      const sg = VOCAB_DATA.find(v => String(v.id) === String(w.plVon || String(w.id).slice(0, -PLURAL_MARKE.length)));
      if (!sg) continue;
      mehrzahlkarten++;
      if (uebMenschOderDing(w) !== uebMenschOderDing(sg)) M4.push(w.id);
    }
    return { nomen: nomen.length, mensch: UEB_MENSCH_IDS.size, ding: UEB_DING_IDS.size, mehrzahlkarten, M1, M2, M3, M4, M5 };
  } finally {
    if (${stoer}) { UEB_DING_IDS.delete(verlege); UEB_MENSCH_IDS.add(nimmRaus); UEB_MENSCH_IDS.add(verlege);
      UEB_DING_IDS.delete(probe.id); const i = VOCAB_DATA.indexOf(probe); if (i >= 0) VOCAB_DATA.splice(i, 1); }
  }
})()`;

const warte = ms => new Promise(r => setTimeout(r, ms));
let app, echt, stoer;
try { app = await oeffneApp(); }
catch (e) { console.log('⛔ pruefe-mensch-ding: die App ließ sich nicht im Browser öffnen — ' + e.message); process.exit(1); }
try {
  let vorher = -1, gleich = 0;
  for (let i = 0; i < 60 && gleich < 4; i++) {
    const n = await app.rechne('VOCAB_DATA.length');
    gleich = (n === vorher) ? gleich + 1 : 0; vorher = n;
    await warte(250);
  }
  echt = await app.rechne(MESSUNG(false));
  stoer = await app.rechne(MESSUNG(true));
} finally { await app.schliessen(); }

const zeige = (name, L) => { if (L.length) { console.log(`   ${name}: ${L.length}`); L.slice(0, 8).forEach(x => console.log('      ' + x)); } };
console.log(`${echt.nomen} Nomen mit Mehrzahl · ${echt.mensch} Menschen · ${echt.ding} Dinge · ${echt.mehrzahlkarten} Mehrzahlkarten verglichen`);
let rot = 0;
if (!echt.nomen || !echt.mehrzahlkarten) { console.log('⛔ Nichts gemessen: keine Nomen mit Mehrzahl geladen.'); rot = 1; }
if (echt.M1.length || echt.M2.length || echt.M3.length || echt.M4.length || echt.M5.length) {
  console.log('⛔ Befunde:');
  zeige('M1 nicht genau einmal eingeordnet', echt.M1);
  zeige('M2 id in der Liste, aber kein Nomen mit Mehrzahl', echt.M2);
  zeige('M3 Menschen-Mehrzahl bei den Dingen', echt.M3);
  zeige('M4 Mehrzahlkarte anders als ihre Einzahl', echt.M4);
  zeige('M5 Engel, Dschinn oder Mensch bei den Dingen', echt.M5);
  rot = 1;
}
const stoerRot = stoer.M1.length > 0 && stoer.M3.length > 0 && stoer.M5.length > 0;
console.log(stoerRot ? `Störtest: rot ✓ (M1 ${stoer.M1.length}, M3 ${stoer.M3.length}, M5 ${stoer.M5.length})`
  : `⛔ Störtest NICHT rot (M1 ${stoer.M1.length}, M3 ${stoer.M3.length}, M5 ${stoer.M5.length}) — die Messung sagt nichts.`);
if (!stoerRot) rot = 1;
console.log(rot ? 'pruefe-mensch-ding: ROT' : 'pruefe-mensch-ding: grün');
process.exit(rot);
