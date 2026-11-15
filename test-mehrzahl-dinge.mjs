#!/usr/bin/env node
/* test-mehrzahl-dinge.mjs — Übung 19 „Mehrzahl von Dingen" (Kapitel 16), 15.11.2026
 * ==========================================================================
 *
 *   node test-mehrzahl-dinge.mjs        Exit 0 = grün, 1 = Befund
 *
 * Elias: „und lasse eine übung im satzmodus auch dazu kommen bezogen auf plural mit dinge die
 * keinen verstand haben damit da auch die regeln angewandt werden" · „alle vokabeln die ich kenne
 * können benutz werden" · auf den Entwurf: „ja bau so".
 *
 * Gemessen in der laufenden App (unsichtbarer Edge, werkzeuge/browser.mjs, leeres Profil), im
 * Zustand „jede Karte bekannt und gesehen" (nur im Probe-Browser). Sein Lernstand wird nicht berührt.
 *   D1  Es gibt Aufgaben, und zwar mit Dingen UND mit Menschen.
 *   D2  Ding → هَذِهِ, Mensch → هَؤُلَاءِ, jeweils nach uebMenschOderDing(); drei verschiedene Knöpfe,
 *       die Lösung ist einer davon.
 *   D3  Nur Nomen, nur eingeordnete; die Form steht so auf der Karte; die Zeile ist Lösung + Form.
 *   D4  Feste Fälle: كُتُبٌ (Buch, 45754) → هَذِهِ, طُلَّابٌ (Student, 45763) → هَؤُلَاءِ.
 *   D5  Über der Zeile steht „Aus deinen Karten", nicht eine Buchseite.
 *   D6  In einem anderen Thema als „alle" gibt es keine Aufgabe.
 *   D7  Die drei Hinweiswörter stehen genau so in grammar-data.js (keine Ḥaraka ohne Quelle).
 * Störtest: Buch und Student tauschen die Listen (D4 muss rot werden), dann wird ein Ding aus der
 * Liste genommen (seine Aufgabe muss verschwinden). Danach stehen die Listen wie vorher.
 */
import fs from 'node:fs';
import { oeffneApp } from './werkzeuge/browser.mjs';

const MESSUNG = (stoer) => `(() => {
  window.istBekannt = () => true; window.uebGesehen = () => true;
  UEB_WORTGRUPPEN = {};
  const m = UEBUNGEN.find(x => x.id === 'mehrzahl-dinge');
  if (!m) return { fehlt: true };
  if (${stoer}) { UEB_DING_IDS.delete('45754'); UEB_MENSCH_IDS.add('45754'); UEB_MENSCH_IDS.delete('45763'); UEB_DING_IDS.add('45763'); }
  try {
    const A = m.ohneSatz([]);
    const nachKarte = {}; for (const a of A) nachKarte[a.karte] = a.loesung;
    const D2 = [], D3 = [];
    const karten = uebMehrzahlKarten();
    for (const a of A) {
      const w = VOCAB_DATA.find(v => String(v.id) === String(a.karte));
      const art = uebMenschOderDing(w);
      const soll = art === 'ding' ? 'هَذِهِ' : art === 'mensch' ? 'هَؤُلَاءِ' : null;
      const werte = (a.optionen || []).map(o => o.wert);
      if (a.loesung !== soll || werte.length !== 3 || new Set(werte).size !== 3 || !werte.includes(a.loesung))
        D2.push(a.karte + ' Lösung ' + a.loesung + ' soll ' + soll + ' Knöpfe ' + werte.join(','));
      const e = karten.find(k => k.karte === w);
      if (!w || w.type !== 'noun' || !art || !e || !e.formen.includes(a.zeilen[1].wort) || a.satz.sentAr !== a.loesung + ' ' + a.zeilen[1].wort)
        D3.push(a.karte + ' ' + (a.satz && a.satz.sentAr));
    }
    const herkunftText = A.length ? herkunft(A[0].satz) : '';
    const altThema = SATZ_THEMA; let imThema = -1;
    try { SATZ_THEMA = 'gibt-es-nicht'; imThema = m.ohneSatz([]).length; } finally { SATZ_THEMA = altThema; }
    return { n: A.length, ding: A.filter(a => a.art === 'ding').length, mensch: A.filter(a => a.art === 'mensch').length,
      buch: nachKarte['45754'] || null, student: nachKarte['45763'] || null, D2, D3, herkunftText, imThema,
      woerter: ['هَذِهِ', 'هَؤُلَاءِ', 'هَذَا'] };
  } finally {
    if (${stoer}) { UEB_MENSCH_IDS.delete('45754'); UEB_DING_IDS.add('45754'); UEB_DING_IDS.delete('45763'); UEB_MENSCH_IDS.add('45763'); }
  }
})()`;

const LUECKE = `(() => { window.istBekannt = () => true; window.uebGesehen = () => true; UEB_WORTGRUPPEN = {};
  const m = UEBUNGEN.find(x => x.id === 'mehrzahl-dinge');
  UEB_DING_IDS.delete('45754');
  try { return m.ohneSatz([]).some(a => a.karte === '45754'); } finally { UEB_DING_IDS.add('45754'); } })()`;

const warte = ms => new Promise(r => setTimeout(r, ms));
let app, echt, stoer, ohneBuch;
try { app = await oeffneApp(); }
catch (e) { console.log('⛔ test-mehrzahl-dinge: die App ließ sich nicht öffnen — ' + e.message); process.exit(1); }
try {
  let vorher = -1, gleich = 0;
  for (let i = 0; i < 60 && gleich < 4; i++) { const n = await app.rechne('VOCAB_DATA.length'); gleich = n === vorher ? gleich + 1 : 0; vorher = n; await warte(250); }
  echt = await app.rechne(MESSUNG(false));
  stoer = await app.rechne(MESSUNG(true));
  ohneBuch = await app.rechne(LUECKE);
} finally { await app.schliessen(); }

let fehler = 0;
const pruefe = (name, ok, ist) => { console.log((ok ? '  ok ' : '  X  ') + name + (ok ? '' : '   ist: ' + JSON.stringify(ist))); if (!ok) fehler++; };
if (echt.fehlt) { console.log('⛔ Übung „mehrzahl-dinge" fehlt in UEBUNGEN'); process.exit(1); }
console.log(`${echt.n} Aufgaben · ${echt.ding} mit Dingen · ${echt.mensch} mit Menschen`);
pruefe('D1 Aufgaben mit Dingen und mit Menschen', echt.ding > 0 && echt.mensch > 0, [echt.ding, echt.mensch]);
pruefe('D2 Ding → هَذِهِ, Mensch → هَؤُلَاءِ, drei verschiedene Knöpfe', !echt.D2.length, echt.D2.slice(0, 5));
pruefe('D3 nur eingeordnete Nomen, Form von der Karte, Zeile = Lösung + Form', !echt.D3.length, echt.D3.slice(0, 5));
pruefe('D4 كُتُبٌ → هَذِهِ, طُلَّابٌ → هَؤُلَاءِ', echt.buch === 'هَذِهِ' && echt.student === 'هَؤُلَاءِ', [echt.buch, echt.student]);
pruefe('D5 Herkunft „Aus deinen Karten"', echt.herkunftText === 'Aus deinen Karten', echt.herkunftText);
pruefe('D6 anderes Thema → keine Aufgabe', echt.imThema === 0, echt.imThema);
const gd = fs.readFileSync(new URL('./grammar-data.js', import.meta.url), 'utf8').normalize('NFC');
pruefe('D7 die drei Hinweiswörter stehen in grammar-data.js', echt.woerter.every(w => gd.includes(w.normalize('NFC'))), echt.woerter.filter(w => !gd.includes(w)));
const stoerRot = !(stoer.buch === 'هَذِهِ' && stoer.student === 'هَؤُلَاءِ') && ohneBuch === false;
console.log(stoerRot ? `  ok STÖRTEST — Listen getauscht: Buch ${stoer.buch}, Student ${stoer.student} (D4 rot); Buch nicht eingeordnet: keine Aufgabe`
  : `  X  STÖRTEST nicht rot (Buch ${stoer.buch}, Student ${stoer.student}, ohne Einordnung noch da: ${ohneBuch})`);
if (!stoerRot) fehler++;
console.log(fehler ? `X  ${fehler} Befund(e)` : '✅ Übung 19 „Mehrzahl von Dingen": alles richtig');
process.exit(fehler ? 1 : 0);
