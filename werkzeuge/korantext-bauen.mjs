#!/usr/bin/env node
/* korantext-bauen.mjs — quran-text.js aus dem Text des König-Fahd-Komplexes bauen und dagegen prüfen
 *
 *   node werkzeuge/korantext-bauen.mjs                      liest die Datei des Komplexes
 *                                                           (data-ersatz/quellen/kfgqpc/hafsData_v18.json)
 *                                                           und schreibt quran-text.js und den Fingerabdruck neu
 *   node werkzeuge/korantext-bauen.mjs --quelle <datei>     nimmt eine andere Datei gleichen Baus
 *   node werkzeuge/korantext-bauen.mjs --pruefen            schreibt NICHTS; Exit 1, wenn quran-text.js
 *                                                           nicht Zeichen für Zeichen der Text des
 *                                                           Komplexes ist oder der Fingerabdruck nicht passt
 *   node werkzeuge/korantext-bauen.mjs --gegen-qurancom [--ablage <ordner>]
 *                                                           schreibt NICHTS im Repo; holt das Feld
 *                                                           text_qpc_hafs von api.quran.com (das lädt der
 *                                                           Rückfall des Lesers) und vergleicht es mit dem
 *                                                           Komplex. Exit 1 bei einem Unterschied.
 *
 * Elias, 22.11.2026, nach dem Vergleich Komplex ↔ quran.com: „dann nimm fahd" und „nimm fahd für
 * all meine apps und stelle sicher das meine markierungen auf den neuen text übernommen werden".
 * Bis dahin kam der Text von api.quran.com (`text_qpc_hafs`, seit 19.10.2026) mit den
 * Pausenzeichen aus `text_uthmani` (seit 24.10.2026). Was sich dadurch ändert, sind genau diese
 * Pausenzeichen: 352 Wörter in 326 Versen. Buchstaben, Vokalzeichen und Wortzahl jedes Verses
 * bleiben, und kein Buchstabe steht hinter einem geänderten Pausenzeichen — die Markierungen
 * (`vt_tajweed`, „Sure:Vers:Wort:Stelle") zeigen also auf dieselben Buchstaben wie vorher.
 * Das misst der Bau selbst gegen die alte Datei und bricht sonst ab.
 *
 * Die deutsche Übersetzung bleibt, wie sie in quran-text.js steht (Bubenheim & Elyas); sie wird
 * Vers für Vers aus der vorhandenen Datei übernommen.
 *
 * ⛔ Geschrieben wird erst, wenn ALLES stimmt (114 Suren, je Sure dieselbe Verszahl wie
 * surah-data.js und wie die alte Datei, kein leerer Vers, kein doppelter Leerraum, keine
 * Markierungsstelle verschoben) — sonst Abbruch ohne eine Zeile. Erst `.neu`, dann umbenennen:
 * eine halb geschriebene Datei besteht jeden Test, der nur ihr Vorhandensein misst.
 * [[leere_datei_besteht_jeden_test]]
 */
import fs from 'node:fs';
import path from 'node:path';
import { REPO, QUELLE_DATEI, QUELLE_NAME, QUELLE_HERKUNFT, QUELLE_FELD, QURANCOM_URL, ohneVersnummer, fingerabdruck, ladeKoran, ladeKomplex } from './korantext-lib.mjs';

const ZIEL = path.join(REPO, 'quran-text.js');
const ABDRUCK = path.join(REPO, 'werkzeuge', 'korantext-fingerabdruck.json');
const args = process.argv.slice(2);
const wert = n => { const i = args.indexOf(n); return i >= 0 ? path.resolve(args[i + 1] || '') : null; };
const PRUEFEN = args.includes('--pruefen');
const QC = args.includes('--gegen-qurancom');
const QUELLE = wert('--quelle') || QUELLE_DATEI;
const ABLAGE = wert('--ablage');

if (!fs.existsSync(QUELLE)){
  console.log(`⛔ Die Datei des Komplexes fehlt: ${QUELLE}\n   Herkunft: ${QUELLE_HERKUNFT} (hafsData_v18.json). Nichts geschrieben.`);
  process.exit(1);
}
const SUREN = JSON.parse(fs.readFileSync(path.join(REPO, 'surah-data.js'), 'utf8')
  .replace(/^[\s\S]*?(\[)/, '$1').replace(/;\s*$/, ''));
const VERSZAHL = Object.fromEntries(SUREN.map(s => [s.id, s.verses]));

/* 1. Der Komplex */
const fehler = [];
let NEU;
try { NEU = ladeKomplex(QUELLE); } catch (e){ console.log('⛔ ' + e.message + ' — nichts geschrieben.'); process.exit(1); }
for (let s = 1; s <= 114; s++){
  const l = NEU[s] || [];
  if (l.length !== VERSZAHL[s]) fehler.push(`Sure ${s}: ${l.length} Verse beim Komplex, ${VERSZAHL[s]} in surah-data.js`);
  for (let i = 0; i < l.length; i++){
    const t = l[i];
    if (!t) fehler.push(`${s}:${i + 1}: leer`);
    else if (t !== t.trim() || /\s\s/.test(t)) fehler.push(`${s}:${i + 1}: Leerraum am Rand oder doppelt`);
  }
}

/* --gegen-qurancom: der Rückfall des Lesers lädt text_qpc_hafs — ist das noch derselbe Text? */
if (QC){
  const anders = [];
  let verse = 0;
  for (let s = 1; s <= 114; s++){
    const datei = ABLAGE ? path.join(ABLAGE, `qpc_hafs-${s}.json`) : null;
    let j;
    if (datei && fs.existsSync(datei)) j = JSON.parse(fs.readFileSync(datei, 'utf8'));
    else {
      const r = await fetch(QURANCOM_URL(s));
      if (!r.ok){ console.log(`⛔ Sure ${s}: HTTP ${r.status}`); process.exit(1); }
      const roh = await r.text();
      if (datei){ fs.mkdirSync(ABLAGE, { recursive: true }); fs.writeFileSync(datei, roh); }
      j = JSON.parse(roh);
      await new Promise(z => setTimeout(z, 120));
    }
    for (const v of j.verses || []){
      verse++;
      const [vs, vv] = String(v.verse_key).split(':').map(Number);
      if (ohneVersnummer(v.text_qpc_hafs) !== (NEU[vs] || [])[vv - 1]) anders.push(v.verse_key);
    }
  }
  console.log(`Komplex gegen quran.com text_qpc_hafs: ${verse} Verse, ${verse - anders.length} gleich, ${anders.length} verschieden`);
  if (anders.length) console.log('  ⛔ zuerst: ' + anders.slice(0, 10).join(', ') + ' — der Rückfall des Lesers zeigt dort einen anderen Text');
  process.exit(anders.length || verse !== 6236 ? 1 : 0);
}

/* 2. Die vorhandene Datei: für das Deutsch, für --pruefen und für die Markierungsprobe */
const ALT = ladeKoran(ZIEL);

if (PRUEFEN){
  const anders = [];
  let verse = 0;
  for (let s = 1; s <= 114; s++) for (let i = 0; i < (NEU[s] || []).length; i++){
    verse++;
    const a = ALT[s] && ALT[s][i] ? ALT[s][i][0] : null;
    if (a !== NEU[s][i]) anders.push(`${s}:${i + 1}`);
  }
  const da = fs.existsSync(ABDRUCK) ? JSON.parse(fs.readFileSync(ABDRUCK, 'utf8')) : null;
  const jetzt = fingerabdruck(NEU);
  console.log(`Korantext gegen den König-Fahd-Komplex (${path.relative(REPO, QUELLE)}): ${verse} Verse, ${verse - anders.length} gleich, ${anders.length} verschieden`);
  if (anders.length) console.log('  ⛔ verschieden, zuerst: ' + anders.slice(0, 10).join(', '));
  if (fehler.length) console.log('  ⛔ ' + fehler.slice(0, 5).join(' | '));
  const abdruckOk = !!da && da.gesamt === jetzt.gesamt;
  console.log(abdruckOk ? '  ✅ Fingerabdruck passt' : '  ⛔ Fingerabdruck fehlt oder passt nicht zum Komplex');
  process.exit(anders.length || fehler.length || !abdruckOk ? 1 : 0);
}

/* 3. Markierungsprobe gegen die alte Datei. Eine Markierung ist „Sure:Vers:Wort:Stelle" (Stelle =
   Zeichen im Wort, Wörter getrennt an Leerzeichen wie quranWorte() in js/quran.js). Sie bleibt
   richtig, wenn jeder Vers gleich viele Wörter hat und in jedem geänderten Wort hinter der ersten
   Abweichung nur Pausenzeichen stehen. */
const PAUSE = /^[ۖ-ۛ]*$/;
let geaendert = 0, geaenderteVerse = 0;
for (let s = 1; s <= 114; s++){
  if (!ALT[s] || ALT[s].length !== (NEU[s] || []).length){
    fehler.push(`Sure ${s}: ${ALT[s] ? ALT[s].length : 0} Verse in der alten Datei, ${(NEU[s] || []).length} beim Komplex — das Deutsch lässt sich nicht zuordnen`);
    continue;
  }
  NEU[s].forEach((t, i) => {
    const a = ALT[s][i][0].split(/ +/), b = t.split(/ +/);
    if (a.length !== b.length){ fehler.push(`${s}:${i + 1}: ${a.length} Wörter vorher, ${b.length} jetzt — Markierungen verrutschten`); return; }
    let hier = 0;
    a.forEach((w, j) => {
      if (w === b[j]) return;
      hier++;
      let p = 0; while (p < w.length && w[p] === b[j][p]) p++;
      if (!PAUSE.test(w.slice(p)) || !PAUSE.test(b[j].slice(p))) fehler.push(`${s}:${i + 1} Wort ${j + 1}: anders als nur im Pausenzeichen am Wortende — Markierungen dahinter verrutschten`);
    });
    if (hier){ geaendert += hier; geaenderteVerse++; }
  });
}
if (fehler.length){
  console.log('⛔ ABBRUCH, nichts geschrieben:');
  for (const f of fehler.slice(0, 20)) console.log('   ' + f);
  process.exit(1);
}

/* 4. Schreiben. Die Zahl des Wechsels (V1 → Komplex) steht im Fingerabdruck; ein späterer Bau ohne
   Änderung (0 Wörter) übernimmt sie von dort, statt „0" in den Kopf zu schreiben. */
const alterAbdruck = fs.existsSync(ABDRUCK) ? JSON.parse(fs.readFileSync(ABDRUCK, 'utf8')) : {};
const wechsel = geaendert ? { woerter: geaendert, verse: geaenderteVerse, am: new Date().toISOString().slice(0, 10) }
  : (alterAbdruck.wechsel || { woerter: 0, verse: 0, am: '' });
const heute = new Date().toISOString().slice(0, 10);
const kopf = `/* ===================== QURAN-VOLLTEXT ===================== */
/* Kompletter Korantext, damit der Quran-Leser OHNE Internet funktioniert.
   ERZEUGT von werkzeuge/korantext-bauen.mjs (zuletzt ${heute}) — nicht von Hand ändern.

   Aufbau: QURAN_TEXT[Sure] = [[arabisch, deutsch], ...], Index 0 = Vers 1.
   6236 Verse in 114 Suren.

   ⭐ ARABISCH = DER TEXT DES KÖNIG-FAHD-KOMPLEXES, Zeichen für Zeichen (seit 22.11.2026).
   Elias: „dann nimm fahd" und „nimm fahd für all meine apps und stelle sicher das meine
   markierungen auf den neuen text übernommen werden". Quelle: ${QUELLE_NAME},
   Feld ${QUELLE_FELD}, ohne die Versnummer am Ende; geholt über ${QUELLE_HERKUNFT}.
   Bedingungen des Komplexes (dm.qurancomplex.gov.sa/copyright): kostenlos, auch für
   Computerprogramme; das Verändern des Textes regeln sie nicht — darum unverändert, auch die
   Pausenzeichen. Derselbe Text wie das Feld text_qpc_hafs von api.quran.com (gemessen am
   22.11.2026, 6236 von 6236 Versen; das lädt der Rückfall des Lesers).
   Bis 22.11.2026 kamen die Pausenzeichen aus quran.com „V1" (text_uthmani); beim Wechsel
   änderten sich ${wechsel.woerter} Wörter in ${wechsel.verse} Versen, nur am Pausenzeichen am Wortende —
   Wortzahl und Buchstabenstellen gleich, Markierungen bleiben auf ihrem Buchstaben.
   Bewacht von test-korantext.mjs über werkzeuge/korantext-fingerabdruck.json;
   gegen die Datei des Komplexes prüft: node werkzeuge/korantext-bauen.mjs --pruefen

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
const abdruck = { quelle: QUELLE_NAME, herkunft: QUELLE_HERKUNFT, feld: QUELLE_FELD, ohne: 'die Versnummer am Ende',
  pausenzeichen: 'die des Komplexes, unverändert',
  wechsel,
  gebaut: heute, verse: summe, ...fingerabdruck(NEU) };
fs.writeFileSync(ABDRUCK + '.neu', JSON.stringify(abdruck, null, 1) + '\n', 'utf8');
fs.renameSync(ABDRUCK + '.neu', ABDRUCK);
console.log(`✔ quran-text.js geschrieben: ${summe} Verse, ${gleich} gegengeprüft (Arabisch = König-Fahd-Komplex, Deutsch = vorher) · ${(fs.statSync(ZIEL).size / 1024 / 1024).toFixed(2)} MB`);
console.log(`✔ gegenüber vorher geändert: ${geaendert} Wörter in ${geaenderteVerse} Versen, nur Pausenzeichen am Wortende — Markierungen bleiben`);
console.log('✔ werkzeuge/korantext-fingerabdruck.json geschrieben');
