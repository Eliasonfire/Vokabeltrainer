#!/usr/bin/env node
/* korantext-bauen.mjs — quran-text.js aus dem Text von quran.com bauen und dagegen prüfen (19.10.2026)
 *
 *   node werkzeuge/korantext-bauen.mjs                      holt alle 114 Suren von api.quran.com und
 *                                                           schreibt quran-text.js und den Fingerabdruck neu
 *   node werkzeuge/korantext-bauen.mjs --quelle <ordner>    nimmt dort gespeicherte Antworten
 *                                                           (qpc_hafs-<n>.json); fehlende werden geholt
 *                                                           und dort abgelegt
 *   node werkzeuge/korantext-bauen.mjs --pruefen [--quelle <ordner>]
 *                                                           schreibt NICHTS; Exit 1, wenn quran-text.js
 *                                                           nicht Zeichen für Zeichen der Text von
 *                                                           quran.com ist oder der Fingerabdruck nicht passt
 *
 * Elias, 19.10.2026: „stelle sicher das sie gleich sind damit keine fehler da sind". Was „gleich"
 * heißt, steht in werkzeuge/korantext-lib.mjs: das Feld `text_qpc_hafs`, ohne die Versnummer am
 * Ende, unverändert. Die deutsche Übersetzung bleibt, wie sie in quran-text.js steht (Bubenheim &
 * Elyas); sie wird Vers für Vers aus der vorhandenen Datei übernommen.
 * ⭐ Seit dem 24.10.2026 mit EINER Ausnahme: das Pausenzeichen jedes Wortes kommt aus `text_uthmani`
 * (= quran.com „V1", in der Elias liest). Elias: „und diese zeichen (alle) müssen auch identisch sein
 * weil jeder eine andere bedetuung hat". Gemischt mit quranPausenV1() aus js/quran.js; die
 * Antworten liegen mit `--quelle` als uthmani-<n>.json neben qpc_hafs-<n>.json.
 *
 * ⛔ Geschrieben wird erst, wenn ALLES stimmt (114 Suren, je Sure dieselbe Verszahl wie
 * surah-data.js und wie die alte Datei, kein leerer Vers, kein doppelter Leerraum) — sonst
 * Abbruch ohne eine Zeile. Erst `.neu`, dann umbenennen: eine halb geschriebene Datei besteht
 * jeden Test, der nur ihr Vorhandensein misst. [[leere_datei_besteht_jeden_test]]
 */
import fs from 'node:fs';
import path from 'node:path';
import { REPO, QUELLE_URL, QUELLE_FELD, PAUSEN_URL, PAUSEN_FELD, pausenV1, ohneVersnummer, fingerabdruck, ladeKoran } from './korantext-lib.mjs';

const ZIEL = path.join(REPO, 'quran-text.js');
const ABDRUCK = path.join(REPO, 'werkzeuge', 'korantext-fingerabdruck.json');
const args = process.argv.slice(2);
const PRUEFEN = args.includes('--pruefen');
const iQ = args.indexOf('--quelle');
const QUELLE = iQ >= 0 ? path.resolve(args[iQ + 1] || '') : null;
const warte = ms => new Promise(z => setTimeout(z, ms));

const SUREN = JSON.parse(fs.readFileSync(path.join(REPO, 'surah-data.js'), 'utf8')
  .replace(/^[\s\S]*?(\[)/, '$1').replace(/;\s*$/, ''));
const VERSZAHL = Object.fromEntries(SUREN.map(s => [s.id, s.verses]));

async function sureHolen(s, art = 'qpc_hafs'){
  const datei = QUELLE ? path.join(QUELLE, `${art}-${s}.json`) : null;
  if (datei && fs.existsSync(datei)) return JSON.parse(fs.readFileSync(datei, 'utf8'));
  const r = await fetch(art === 'uthmani' ? PAUSEN_URL(s) : QUELLE_URL(s));
  if (!r.ok) throw new Error(`Sure ${s}: HTTP ${r.status}`);
  const roh = await r.text();
  if (datei){ fs.mkdirSync(QUELLE, { recursive: true }); fs.writeFileSync(datei, roh); }
  await warte(120);
  return JSON.parse(roh);
}

/* 1. quran.com lesen: text_qpc_hafs, und die Pausenzeichen aus text_uthmani (V1) */
const NEU = {};
const fehler = [];
const mische = pausenV1();
const nachVers = (j) => (j.verses || []).slice().sort((a, b) => Number(String(a.verse_key).split(':')[1]) - Number(String(b.verse_key).split(':')[1]));
let pausenWoerter = 0, pausenVerse = 0;
for (let s = 1; s <= 114; s++){
  const verse = nachVers(await sureHolen(s));
  const uth = new Map(nachVers(await sureHolen(s, 'uthmani')).map(v => [v.verse_key, v[PAUSEN_FELD]]));
  NEU[s] = verse.map(v => {
    const t = ohneVersnummer(v[QUELLE_FELD]);
    if (t === v[QUELLE_FELD]) fehler.push(`${v.verse_key}: keine Versnummer am Ende — Feld anders gebaut als erwartet`);
    if (!uth.has(v.verse_key)){ fehler.push(`${v.verse_key}: fehlt in ${PAUSEN_FELD}`); return t; }
    const m = mische(t, uth.get(v.verse_key));
    if (m === null){ fehler.push(`${v.verse_key}: Pausenzeichen aus ${PAUSEN_FELD} lassen sich keinem Wort zuordnen`); return t; }
    const vorher = t.split(' '), nachher = m.split(' ');
    const n = nachher.filter((w, i) => w !== vorher[i]).length;
    if (n){ pausenWoerter += n; pausenVerse++; }
    return m;
  });
  if (NEU[s].length !== VERSZAHL[s]) fehler.push(`Sure ${s}: ${NEU[s].length} Verse bei quran.com, ${VERSZAHL[s]} in surah-data.js`);
  NEU[s].forEach((t, i) => {
    if (!t) fehler.push(`${s}:${i + 1}: leer`);
    else if (t !== t.trim() || /\s\s/.test(t)) fehler.push(`${s}:${i + 1}: Leerraum am Rand oder doppelt`);
  });
}

/* 2. Die vorhandene Datei: für das Deutsch, und für --pruefen */
const ALT = ladeKoran(ZIEL);

if (PRUEFEN){
  const anders = [];
  let verse = 0;
  for (let s = 1; s <= 114; s++) for (let i = 0; i < NEU[s].length; i++){
    verse++;
    const a = ALT[s] && ALT[s][i] ? ALT[s][i][0] : null;
    if (a !== NEU[s][i]) anders.push(`${s}:${i + 1}`);
  }
  const da = fs.existsSync(ABDRUCK) ? JSON.parse(fs.readFileSync(ABDRUCK, 'utf8')) : null;
  const jetzt = fingerabdruck(NEU);
  console.log(`Korantext gegen quran.com (${QUELLE ? 'gespeicherte Antworten aus ' + QUELLE : 'frisch von api.quran.com'}): ${verse} Verse, ${verse - anders.length} gleich, ${anders.length} verschieden`);
  console.log(`  Pausenzeichen aus ${PAUSEN_FELD} (V1): ${pausenWoerter} Wörter in ${pausenVerse} Versen anders als in ${QUELLE_FELD}`);
  if (anders.length) console.log('  ⛔ verschieden, zuerst: ' + anders.slice(0, 10).join(', '));
  if (fehler.length) console.log('  ⛔ ' + fehler.slice(0, 5).join(' | '));
  const abdruckOk = !!da && da.gesamt === jetzt.gesamt;
  console.log(abdruckOk ? '  ✅ Fingerabdruck passt' : '  ⛔ Fingerabdruck fehlt oder passt nicht zu quran.com');
  process.exit(anders.length || fehler.length || !abdruckOk ? 1 : 0);
}

for (let s = 1; s <= 114; s++){
  if (!ALT[s] || ALT[s].length !== NEU[s].length) fehler.push(`Sure ${s}: ${ALT[s] ? ALT[s].length : 0} Verse in der alten Datei, ${NEU[s].length} bei quran.com — das Deutsch lässt sich nicht zuordnen`);
}
if (fehler.length){
  console.log('⛔ ABBRUCH, nichts geschrieben:');
  for (const f of fehler.slice(0, 20)) console.log('   ' + f);
  process.exit(1);
}

/* 3. Schreiben */
const heute = new Date().toISOString().slice(0, 10);
const kopf = `/* ===================== QURAN-VOLLTEXT ===================== */
/* Kompletter Korantext, damit der Quran-Leser OHNE Internet funktioniert.
   ERZEUGT von werkzeuge/korantext-bauen.mjs (zuletzt ${heute}) — nicht von Hand ändern.

   Aufbau: QURAN_TEXT[Sure] = [[arabisch, deutsch], ...], Index 0 = Vers 1.
   6236 Verse in 114 Suren.

   ⭐ ARABISCH = DER TEXT VON QURAN.COM, Zeichen für Zeichen (seit 19.10.2026).
   Elias: „stelle sicher das sie gleich sind damit keine fehler da sind". Quelle:
   ${QUELLE_URL('N')}, Feld ${QUELLE_FELD}
   (King Fahd Complex, Muṣḥaf al-Madīna, Ḥafṣ), ohne die Versnummer am Ende.
   ⭐ Mit EINER Ausnahme (seit 24.10.2026): das Pausenzeichen jedes Wortes kommt aus
   ${PAUSEN_URL('N')}, Feld ${PAUSEN_FELD} — so zeigt sie
   quran.com in der Schrift „V1", in der Elias liest (${pausenWoerter} Wörter in ${pausenVerse} Versen).
   Elias: „und diese zeichen (alle) müssen auch identisch sein weil jeder eine andere
   bedetuung hat". Gemischt mit quranPausenV1() aus js/quran.js.
   Bewacht von test-korantext.mjs über werkzeuge/korantext-fingerabdruck.json;
   gegen das heutige quran.com prüft: node werkzeuge/korantext-bauen.mjs --pruefen

   ⛔ Die Kodierung gehört zur Muṣḥaf-Schrift des Lesers (fonts/kfgqpc-hafs-18.woff2):
   versetztes Tanwīn als U+0657 / U+065E / U+0656, Sukun des Muṣḥaf als U+06E1. Jede
   andere Schrift zeichnet U+0657 falsch (als umgekehrte Ḍamma). Wer den Text außerhalb
   des Lesers zeigt oder vergleicht, nimmt zuStandard() aus werkzeuge/korantext-lib.mjs.

   Bis v691 kam der Text aus einer anderen Ausgabe derselben Quelle (fawazahmed0/quran-api)
   mit getauschten Zeichen für Amiri; dort stand an 2417 Stellen ein Alif als eigenes Wort
   abgetrennt (z. B. 2:2). Gemessen und ersetzt am 19.10.2026.

   deutsch: Frank Bubenheim & Nadeem Elyas (quranenc.com), unverändert übernommen. */

const QURAN_TEXT = {
`;
let leib = '';
for (let s = 1; s <= 114; s++){
  const paare = NEU[s].map((ar, i) => [ar, ALT[s][i][1]]);
  leib += s + ':' + JSON.stringify(paare) + (s < 114 ? ',' : '') + '\n';
}
const text = kopf + leib + '};\n';
fs.writeFileSync(ZIEL + '.neu', text, 'utf8');
/* Gegenprobe an der geschriebenen Datei, bevor sie die alte ersetzt */
const probe = ladeKoran(ZIEL + '.neu');
let gleich = 0;
for (let s = 1; s <= 114; s++) for (let i = 0; i < NEU[s].length; i++) if (probe[s][i][0] === NEU[s][i] && probe[s][i][1] === ALT[s][i][1]) gleich++;
const summe = Object.values(NEU).reduce((a, l) => a + l.length, 0);
if (gleich !== summe){ fs.unlinkSync(ZIEL + '.neu'); console.log(`⛔ Gegenprobe: nur ${gleich} von ${summe} Versen gleich — nichts ersetzt.`); process.exit(1); }
fs.renameSync(ZIEL + '.neu', ZIEL);
const abdruck = { quelle: QUELLE_URL('N'), feld: QUELLE_FELD, ohne: 'die Versnummer am Ende',
  pausenzeichen: { quelle: PAUSEN_URL('N'), feld: PAUSEN_FELD, woerter: pausenWoerter, verse: pausenVerse },
  gebaut: heute, verse: summe, ...fingerabdruck(NEU) };
fs.writeFileSync(ABDRUCK + '.neu', JSON.stringify(abdruck, null, 1) + '\n', 'utf8');
fs.renameSync(ABDRUCK + '.neu', ABDRUCK);
console.log(`✔ quran-text.js geschrieben: ${summe} Verse, ${gleich} gegengeprüft (Arabisch = quran.com, Deutsch = vorher) · ${(fs.statSync(ZIEL).size / 1024 / 1024).toFixed(2)} MB`);
console.log(`✔ Pausenzeichen wie quran.com V1 (${PAUSEN_FELD}): ${pausenWoerter} Wörter in ${pausenVerse} Versen`);
console.log('✔ werkzeuge/korantext-fingerabdruck.json geschrieben');
