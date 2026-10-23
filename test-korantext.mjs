#!/usr/bin/env node
/* test-korantext.mjs — der Korantext der App ist der Text von quran.com, und der Leser zeigt ihn richtig.
 * =====================================================================================================
 *
 * Elias, 19.10.2026: „stelle sicher das sie gleich sind damit keine fehler da sind" — nachdem gemessen
 * war, dass die bis dahin benutzte Datei NICHT der Text von quran.com ist (u. a. 2417 abgetrennte Alif,
 * z. B. hudan in 2:2). Seitdem baut werkzeuge/korantext-bauen.mjs quran-text.js aus dem Feld
 * `text_qpc_hafs` von api.quran.com. Dieser Test hält das fest, ohne Netz:
 *
 *   K1  114 Suren, je Sure so viele Verse wie surah-data.js, zusammen 6236
 *   K2  der Fingerabdruck jeder Sure ist der, den der Bau von quran.com mitgeschrieben hat
 *       (werkzeuge/korantext-fingerabdruck.json) — ein geändertes Zeichen fällt auf
 *   K3  jedes Zeichen des Textes steht in der Schrift des Lesers (fonts/kfgqpc-hafs-18.woff2);
 *       fehlt eines, zeichnet der Browser es mit einer anderen Schrift, ohne Meldung
 *   K4  kein abgetrenntes Alif mehr: kein Wort, das nur aus Alif oder Alif maqṣūra besteht
 *   K5  quranWorte() aus js/quran.js zählt wie quran.com: das Hizb-Zeichen ist nie ein eigenes Wort,
 *       und 2:26 hat 39 Wörter (gemessen an der Wortliste von quran.com am 19.10.2026)
 *   K6  der Leser zeigt den Koran in der Muṣḥaf-Schrift, und sein Rückfall ohne Datei lädt dasselbe
 *       Feld von quran.com und schneidet die Versnummer ab
 *   K7  zuStandard() (für Karten und Vergleiche) lässt kein Zeichen der Muṣḥaf-Kodierung übrig und
 *       ändert keinen Buchstaben
 *   K8  die PAUSENZEICHEN sind die von quran.com „V1" (Feld text_uthmani), in der Elias liest.
 *       Elias, 24.10.2026, mit Bild aus 67:23: „und diese zeichen (alle) müssen auch identisch sein
 *       weil jeder eine andere bedetuung hat". Geprüft: sein Beispiel 67:23 Wort 9 (ṣalā), der
 *       Fingerabdruck nennt die Quelle, quranPausenV1() mischt richtig (Pausenzeichen in text_uthmani
 *       als eigenes Wort), und der Rückfall ohne quran-text.js mischt genauso
 *
 * Gegen das HEUTIGE quran.com (mit Netz) prüft:  node werkzeuge/korantext-bauen.mjs --pruefen
 *
 * Danach fünf Störtests, jeder MUSS rot werden. Exit 0 = grün und alle Störtests rot, sonst 1.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fingerabdruck, schriftZeichen, zuStandard, ladeKoran, Z } from './werkzeuge/korantext-lib.mjs';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const KORAN = ladeKoran(path.join(HIER, 'quran-text.js'));   /* 2,2 MB — vom Skript gelesen, nicht vom Modell */
const KOPF = fs.readFileSync(path.join(HIER, 'quran-text.js'), 'utf8').slice(0, 3000);
const QUELLE = fs.readFileSync(path.join(HIER, 'js', 'quran.js'), 'utf8');
const ABDRUCK = JSON.parse(fs.readFileSync(path.join(HIER, 'werkzeuge', 'korantext-fingerabdruck.json'), 'utf8'));
const SCHRIFT = schriftZeichen(path.join(HIER, 'fonts', 'kfgqpc-hafs-18.woff2'));
const SUREN = JSON.parse(fs.readFileSync(path.join(HIER, 'surah-data.js'), 'utf8')
  .replace(/^[\s\S]*?(\[)/, '$1').replace(/;\s*$/, ''));

const HIZB = Z(0x06DE);
const MARKEN = new RegExp('[' + Z(0x0610) + '-' + Z(0x061A) + Z(0x064B) + '-' + Z(0x065F) + Z(0x0670) + Z(0x06D6) + '-' + Z(0x06ED) + Z(0x0640) + ']', 'g');
const NUR_ALIF = new RegExp('^[' + Z(0x0627) + Z(0x0649) + ']$');
const MUSHAF_ZEICHEN = [0x0656, 0x0657, 0x065E, 0x06E1, 0x00A0];

function funktionenAus(quelle){
  const von = quelle.indexOf('function quranWorte(text){'), bis = quelle.indexOf('function quranAnsicht');
  if (von < 0 || bis < 0 || bis <= von) return null;
  try { return new Function(quelle.slice(von, bis) + '\n;return { quranWorte, quranOhneVersnummer };')(); }
  catch (e){ return null; }
}

function pausenAus(quelle){
  const von = quelle.indexOf('function quranPausenV1('), bis = quelle.indexOf('/* ende quranPausenV1 */');
  if (von < 0 || bis <= von) return null;
  try { return new Function(quelle.slice(von, bis) + '\n;return quranPausenV1;')(); }
  catch (e){ return null; }
}

function pruefe(koran, quelle){
  const b = [];
  /* K1 */
  let verse = 0;
  for (const s of SUREN){
    const l = koran[s.id];
    if (!l || l.length !== s.verses) b.push(`K1: Sure ${s.id} hat ${l ? l.length : 0} Verse statt ${s.verses}`);
    verse += l ? l.length : 0;
  }
  if (verse !== 6236) b.push(`K1: ${verse} Verse statt 6236`);
  /* K2 */
  const jetzt = fingerabdruck(koran);
  const andere = Object.keys(ABDRUCK.suren || {}).filter(s => ABDRUCK.suren[s] !== jetzt.suren[s]);
  if (!ABDRUCK.suren || Object.keys(ABDRUCK.suren).length !== 114) b.push('K2: der Fingerabdruck hat nicht 114 Suren');
  else if (andere.length) b.push(`K2: ${andere.length} Sure(n) sind nicht mehr der Text von quran.com, zuerst Sure ${andere[0]}`);
  /* K3 */
  const fehlt = new Map();
  for (const l of Object.values(koran)) for (const [ar] of l) for (const c of ar){
    const k = c.codePointAt(0);
    if (!SCHRIFT.zeichen.has(k)) fehlt.set(k, (fehlt.get(k) || 0) + 1);
  }
  if (fehlt.size) b.push('K3: in der Schrift des Lesers fehlen ' + [...fehlt].map(([k, n]) => 'U+' + k.toString(16).toUpperCase().padStart(4, '0') + ' (' + n + '×)').join(', '));
  /* K4 */
  const allein = [];
  for (const [s, l] of Object.entries(koran)) l.forEach(([ar], i) => {
    for (const w of ar.split(' ')) if (NUR_ALIF.test(w.normalize('NFD').replace(MARKEN, ''))) allein.push(`${s}:${i + 1}`);
  });
  if (allein.length) b.push(`K4: ${allein.length} Wort/Wörter bestehen nur aus einem Alif (abgetrennt), zuerst ${allein[0]}`);
  /* K5 */
  const f = funktionenAus(quelle);
  if (!f) b.push('K5: quranWorte() liess sich nicht aus js/quran.js schneiden');
  else {
    let hizbAllein = 0;
    for (const l of Object.values(koran)) for (const [ar] of l) for (const w of f.quranWorte(ar)) if (w === HIZB) hizbAllein++;
    if (hizbAllein) b.push(`K5: das Hizb-Zeichen steht ${hizbAllein}× als eigenes Wort — das Mitlesen läge dahinter um eins daneben`);
    const n226 = f.quranWorte(koran[2][25][0]).length;
    if (n226 !== 39) b.push(`K5: 2:26 hat ${n226} Wörter, quran.com zählt 39`);
    const probe = koran[112][0][0] + Z(0x00A0, 0x0661);
    if (f.quranOhneVersnummer(probe) !== koran[112][0][0]) b.push('K6: quranOhneVersnummer() schneidet die Versnummer nicht ab');
  }
  /* K6 */
  if (!/return 'uthmani';/.test(quelle) || !/uthmani:\s*"'Uthmanic Hafs'/.test(quelle)) b.push('K6: der Leser zeigt den Koran nicht mehr fest in der Muṣḥaf-Schrift');
  const ab = quelle.indexOf('Rueckfallebene: wenn die lokale Datei fehlt');
  const rueck = ab < 0 ? '' : quelle.slice(ab, ab + 2500);
  if (!/fields=text_qpc_hafs/.test(rueck) || !/quranOhneVersnummer\(v\.text_qpc_hafs\)/.test(rueck)) b.push('K6: der Rückfall ohne quran-text.js lädt nicht text_qpc_hafs ohne Versnummer');
  if (!/text_qpc_hafs/.test(KOPF)) b.push('K6: der Kopf von quran-text.js nennt die Quelle nicht');
  /* K7 */
  let rest = 0, buchstabenAnders = '';
  for (const [s, l] of Object.entries(koran)) l.forEach(([ar], i) => {
    const st = zuStandard(ar);
    for (const k of MUSHAF_ZEICHEN) if (st.includes(Z(k))) rest++;
    const g1 = ar.normalize('NFD').replace(MARKEN, '').replace(/\s+/g, ''), g2 = st.replace(MARKEN, '').replace(/\s+/g, '');
    if (g1 !== g2 && !buchstabenAnders) buchstabenAnders = `${s}:${i + 1}`;
  });
  if (rest) b.push(`K7: zuStandard() lässt ${rest}× ein Zeichen der Muṣḥaf-Kodierung stehen`);
  if (buchstabenAnders) b.push(`K7: zuStandard() ändert Buchstaben, zuerst in ${buchstabenAnders}`);
  /* K8 */
  const w67 = ((koran[67] && koran[67][22]) ? koran[67][22][0] : '').split(' ')[8] || '';
  if (!w67.endsWith(Z(0x06D6))) b.push('K8: 67:23 Wort 9 trägt nicht das Pausenzeichen ṣalā wie quran.com V1');
  if (!ABDRUCK.pausenzeichen || ABDRUCK.pausenzeichen.feld !== 'text_uthmani' || !(ABDRUCK.pausenzeichen.woerter > 0)) b.push('K8: der Fingerabdruck nennt keine Pausenzeichen aus text_uthmani');
  const mische = pausenAus(quelle);
  if (!mische) b.push('K8: quranPausenV1() liess sich nicht aus js/quran.js schneiden');
  else {
    /* Probe ohne echten Vers: in text_uthmani steht das Pausenzeichen als eigenes Wort */
    const qpc = Z(0x0628, 0x064E, 0x06DA) + ' ' + Z(0x062A, 0x064E);
    const uth = Z(0x0628, 0x064E) + ' ' + Z(0x06D6) + ' ' + Z(0x062A, 0x064E);
    if (mische(qpc, uth) !== Z(0x0628, 0x064E, 0x06D6) + ' ' + Z(0x062A, 0x064E)) b.push('K8: quranPausenV1() übernimmt das Pausenzeichen aus text_uthmani nicht');
  }
  if (!/fields=text_qpc_hafs,text_uthmani/.test(rueck) || !/quranPausenV1\(qpc, v\.text_uthmani\)/.test(rueck)) b.push('K8: der Rückfall ohne quran-text.js mischt die Pausenzeichen nicht');
  return { befunde: b, verse };
}

let schlecht = 0;
const lauf = pruefe(KORAN, QUELLE);
console.log('Korantext = quran.com (Elias, 19.10.2026: „stelle sicher das sie gleich sind")');
console.log(`  ${lauf.verse} Verse · Fingerabdruck vom ${ABDRUCK.gebaut} · Schrift „${SCHRIFT.name}" ${SCHRIFT.version}, ${SCHRIFT.zeichen.size} Zeichen`);
if (lauf.befunde.length){ schlecht++; for (const x of lauf.befunde) console.log('  ⛔ ' + x); }
else console.log('  ✅ K1–K8 grün');

const kopie = () => JSON.parse(JSON.stringify(KORAN));
const STOERTESTS = [
  ['ein Zeichen in 93:4 geändert', () => { const k = kopie(); k[93][3][0] = k[93][3][0].replace(Z(0x065E), Z(0x064C)); return [k, QUELLE]; }, /^K2:/],
  ['ein Zeichen, das die Schrift nicht hat (U+08F0, wie in der alten Datei)', () => { const k = kopie(); k[2][1][0] = k[2][1][0].replace(Z(0x0657), Z(0x08F0)); return [k, QUELLE]; }, /^K3:/],
  ['ein abgetrenntes Alif wie bis v691 (hudan in 2:2)', () => { const k = kopie(); k[2][1][0] = k[2][1][0].replace(Z(0x0657, 0x0649), Z(0x0657) + ' ' + Z(0x0649)); return [k, QUELLE]; }, /^K4:/],
  ['quranWorte() trennt wieder an jedem Leerraum', () => [KORAN, QUELLE.replace("return String(text || '').trim().split(/ +/).filter(Boolean);", "return String(text || '').trim().split(/\\s+/).filter(Boolean);")], /^K5:/],
  ['der Rückfall lädt wieder text_uthmani', () => [KORAN, QUELLE.replace('fields=text_qpc_hafs', 'fields=text_uthmani')], /^K6:/],
  ['67:23 Wort 9 wieder mit jīm wie text_qpc_hafs', () => { const k = kopie(); const w = k[67][22][0].split(' '); w[8] = w[8].replace(Z(0x06D6), Z(0x06DA)); k[67][22][0] = w.join(' '); return [k, QUELLE]; }, /^K8:/],
  ['quranPausenV1() erkennt das Pausenzeichen als eigenes Wort nicht mehr', () => [KORAN, QUELLE.replace("String.fromCodePoint(0x6D6) + '-' + String.fromCodePoint(0x6DC) + String.fromCodePoint(0x6DE, 0x6E9)", 'String.fromCodePoint(0x6DE, 0x6E9)')], /^K8:/],
  ['der Rückfall mischt die Pausenzeichen nicht mehr', () => [KORAN, QUELLE.replace('quranPausenV1(qpc, v.text_uthmani) || qpc', 'qpc')], /^K8:/],
];
console.log('');
console.log('Störtests (jeder muss rot werden):');
for (const [name, bau, erwartet] of STOERTESTS){
  const [k, q] = bau();
  if (q === QUELLE && k === KORAN){ schlecht++; console.log(`  ⛔ „${name}": nichts gestört — die Stelle steht nicht mehr so da`); continue; }
  if (k !== KORAN && JSON.stringify(k) === JSON.stringify(KORAN)){ schlecht++; console.log(`  ⛔ „${name}": der Text blieb gleich — die Stelle steht nicht mehr so da`); continue; }
  const r = pruefe(k, q);
  const treffer = r.befunde.find(x => erwartet.test(x));
  if (treffer) console.log(`  ✔ ${name} → rot (${treffer.split(':')[0]})`);
  else { schlecht++; console.log(`  ⛔ ${name} → blieb ${r.befunde.length ? 'rot, aber ohne ' + erwartet : 'GRÜN'}`); }
}
console.log('');
console.log(schlecht ? '⛔ test-korantext: ' + schlecht + ' Befund(e).' : '✅ test-korantext: grün, alle ' + STOERTESTS.length + ' Störtests rot geworden.');
process.exit(schlecht ? 1 : 0);
