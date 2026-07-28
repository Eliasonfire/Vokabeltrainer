#!/usr/bin/env node
/* ===================== Validierung vor jedem Push =====================
   Pflicht laut Vokabeltrainer-Goal-Prompt Abschnitt E.2: doppelte IDs, kaputte
   Referenzen und kaputtes JSON abfangen, BEVOR etwas auf `main` landet — die App
   liegt live auf GitHub Pages, ein kaputter Datenstand ist sofort öffentlich.

   Aufruf:  node validate.js
   Rückgabe: Exitcode 0 = sauber, 1 = mindestens ein Fehler.

   Bewusst ohne Abhängigkeiten (kein npm install nötig) und ohne Browser: die
   Datendateien werden in einer Node-Sandbox ausgeführt und danach geprüft.
   ===================================================================== */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DIR = __dirname;
const errors = [];
const warnings = [];
const info = [];

function fail(msg){ errors.push(msg); }
function warn(msg){ warnings.push(msg); }
function note(msg){ info.push(msg); }

/* ---------- Datendateien in einer Sandbox laden ---------- */
const DATA_FILES = ['vocab-data.js', 'surah-data.js', 'grammar-data.js', 'quran-frequency-data.js', 'lehrbuch-saetze.js'];
let DATA = {};
try {
  let code = '';
  for (const f of DATA_FILES){
    const p = path.join(DIR, f);
    if (!fs.existsSync(p)) { fail(`Datendatei fehlt: ${f}`); continue; }
    code += fs.readFileSync(p, 'utf8') + '\n';
  }
  code += 'globalThis.__DATA = { VOCAB_DATA, SURAH_DATA, GRAMMAR_RULES, SENTENCE_TAGS, QURAN_FREQ, LEHRBUCH_SAETZE };';
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  DATA = ctx.__DATA;
} catch (e) {
  fail(`Datendateien nicht ausführbar (Syntaxfehler?): ${e.message}`);
}

const { VOCAB_DATA, SURAH_DATA, GRAMMAR_RULES, SENTENCE_TAGS, QURAN_FREQ, LEHRBUCH_SAETZE } = DATA;

/* ---------- 1. VOCAB_DATA ---------- */
if (!Array.isArray(VOCAB_DATA) || VOCAB_DATA.length === 0){
  fail('VOCAB_DATA fehlt oder ist leer.');
} else {
  const seen = new Map();
  VOCAB_DATA.forEach((w, i) => {
    const where = `VOCAB_DATA[${i}]`;
    if (w === null || typeof w !== 'object'){ fail(`${where} ist kein Objekt.`); return; }
    if (!w.id) fail(`${where} hat keine id.`);
    else if (seen.has(w.id)) fail(`Doppelte Vokabel-ID "${w.id}" (${where} und VOCAB_DATA[${seen.get(w.id)}]).`);
    else seen.set(w.id, i);

    if (!w.ar || String(w.ar).trim() === '') fail(`${where} (id ${w.id}): Feld "ar" fehlt oder ist leer.`);
    if (!w.de || String(w.de).trim() === '') fail(`${where} (id ${w.id}): Feld "de" fehlt oder ist leer.`);

    const ch = w.chapter;
    const chOk = ch === 'personal' || (Number.isInteger(ch) && ch >= 1 && ch <= 24);
    if (!chOk) fail(`${where} (id ${w.id}): ungültiges chapter "${ch}" (erlaubt: 1–24 oder "personal").`);

    if (w.box !== undefined && !(Number.isInteger(w.box) && w.box >= 1 && w.box <= 5))
      fail(`${where} (id ${w.id}): box "${w.box}" liegt außerhalb 1–5.`);

    if (w.sentDe && !w.sentAr) warn(`${where} (id ${w.id}): sentDe ohne sentAr.`);

    if (w.quran){
      const q = w.quran;
      if (!q.ar) fail(`${where} (id ${w.id}): quran.ar fehlt.`);
      if (!q.surah) fail(`${where} (id ${w.id}): quran.surah fehlt.`);
      if (q.ayah === undefined || q.ayah === null || q.ayah === '') fail(`${where} (id ${w.id}): quran.ayah fehlt.`);
    }
  });
  note(`VOCAB_DATA: ${VOCAB_DATA.length} Einträge, ${seen.size} eindeutige IDs.`);
}

/* ---------- 2. CHAPTER_NAMES aus js/kern.js gegen die Daten prüfen ---------- */
/* Lag bis zum 28.07.26 in app.js; seit der Aufteilung nach E.7 in js/kern.js. */
const KERN_DATEI = 'js/kern.js';
try {
  const appSrc = fs.readFileSync(path.join(DIR, KERN_DATEI), 'utf8');
  const m = appSrc.match(/const\s+CHAPTER_NAMES\s*=\s*(\{[\s\S]*?\});/);
  if (!m){
    warn(`CHAPTER_NAMES in ${KERN_DATEI} nicht gefunden — Kapitelnamen konnten nicht geprüft werden.`);
  } else {
    const names = new Function('return ' + m[1])();
    const used = new Set(VOCAB_DATA ? VOCAB_DATA.map(w => w.chapter) : []);
    used.forEach(ch => {
      if (names[ch] === undefined) fail(`CHAPTER_NAMES hat keinen Namen für Kapitel "${ch}", das in VOCAB_DATA vorkommt.`);
      else if (/^Kapitel\s*\d+$/.test(String(names[ch]))) fail(`CHAPTER_NAMES["${ch}"] ist noch ein Platzhalter ("${names[ch]}").`);
    });
    note(`CHAPTER_NAMES: ${used.size} benutzte Kapitel, alle benannt.`);
  }
} catch (e) {
  fail(`${KERN_DATEI} nicht lesbar: ${e.message}`);
}

/* ---------- 2b. Jede js/-Datei muss auch eingebunden und gecacht sein ----------
   Nach der Aufteilung in Module ist der wahrscheinlichste Fehler nicht mehr ein
   Syntaxfehler, sondern eine neue Datei, die jemand anzulegen vergisst zu
   verlinken - oder die in index.html steht, aber nicht in der ASSETS-Liste des
   Service Workers. Das faellt online nicht auf und bricht erst offline. */
try {
  const dateien = fs.readdirSync(path.join(DIR, 'js')).filter(f => f.endsWith('.js')).sort();
  const html = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(DIR, 'sw.js'), 'utf8');
  dateien.forEach(f => {
    if (!html.includes(`js/${f}`)) fail(`js/${f} liegt im Ordner, wird aber in index.html nicht geladen.`);
    if (!sw.includes(`js/${f}`))   fail(`js/${f} fehlt in der ASSETS-Liste von sw.js — offline nicht verfügbar.`);
  });
  note(`js/: ${dateien.length} Module, alle eingebunden und im Offline-Cache.`);
} catch (e) {
  fail(`js/-Ordner nicht lesbar: ${e.message}`);
}

/* ---------- 3. GRAMMAR_RULES ---------- */
const RULE_COLORS = ['mubtada', 'idafa', 'nasab', 'fem', 'other'];
if (!Array.isArray(GRAMMAR_RULES)){
  fail('GRAMMAR_RULES fehlt oder ist kein Array.');
} else {
  const ruleIds = new Set();
  GRAMMAR_RULES.forEach((r, i) => {
    const where = `GRAMMAR_RULES[${i}]`;
    if (!r.id) fail(`${where} hat keine id.`);
    else if (ruleIds.has(r.id)) fail(`Doppelte Regel-ID "${r.id}".`);
    else ruleIds.add(r.id);
    if (!r.name) fail(`${where} (${r.id}): name fehlt.`);
    if (!r.shortExplanation) fail(`${where} (${r.id}): shortExplanation fehlt.`);
    if (!RULE_COLORS.includes(r.color)) fail(`${where} (${r.id}): unbekannte color "${r.color}" (erlaubt: ${RULE_COLORS.join(', ')}).`);
    /* Quellenpflicht aus Goal-Prompt E.1 — ohne belegbare Quelle darf keine Regel rein. */
    if (!r.source) fail(`${where} (${r.id}): source fehlt (Quellenpflicht E.1).`);
    else {
      if (!r.source.video) fail(`${where} (${r.id}): source.video fehlt.`);
      if (!r.source.approxTimestamp) fail(`${where} (${r.id}): source.approxTimestamp fehlt.`);
      if (r.source.chapter === undefined) fail(`${where} (${r.id}): source.chapter fehlt.`);
    }
  });
  note(`GRAMMAR_RULES: ${GRAMMAR_RULES.length} Regeln, alle mit Quelle.`);

  /* ---------- 4. SENTENCE_TAGS: Referenzen in beide Richtungen ---------- */
  if (SENTENCE_TAGS && typeof SENTENCE_TAGS === 'object' && Array.isArray(VOCAB_DATA)){
    /* Markierungen duerfen an beiden Satzquellen haengen: an den arabicroots-
       Vokabeln und an den Saetzen aus dem Lehrwerk. */
    const alleSaetze = VOCAB_DATA.concat(Array.isArray(LEHRBUCH_SAETZE) ? LEHRBUCH_SAETZE : []);
    const vocabById = new Map(alleSaetze.map(w => [String(w.id), w]));
    let tagCount = 0;
    Object.entries(SENTENCE_TAGS).forEach(([vocabId, tags]) => {
      const w = vocabById.get(String(vocabId));
      if (!w){ fail(`SENTENCE_TAGS verweist auf unbekannte Vokabel-ID "${vocabId}".`); return; }
      if (!Array.isArray(tags)){ fail(`SENTENCE_TAGS["${vocabId}"] ist kein Array.`); return; }
      tags.forEach((t, j) => {
        tagCount++;
        if (!ruleIds.has(t.ruleId)) fail(`SENTENCE_TAGS["${vocabId}"][${j}] verweist auf unbekannte Regel "${t.ruleId}".`);
        if (!t.matchText) fail(`SENTENCE_TAGS["${vocabId}"][${j}]: matchText fehlt.`);
        else if (!w.sentAr) fail(`SENTENCE_TAGS["${vocabId}"][${j}]: Vokabel hat keinen Beispielsatz (sentAr), Markierung liefe ins Leere.`);
        else if (!w.sentAr.includes(t.matchText)) fail(`SENTENCE_TAGS["${vocabId}"][${j}]: matchText "${t.matchText}" kommt im Satz nicht vor.`);
      });
    });
    note(`SENTENCE_TAGS: ${tagCount} Markierungen, alle Referenzen auflösbar.`);
  }
}

/* ---------- 5. SURAH_DATA ---------- */
if (!Array.isArray(SURAH_DATA)){
  fail('SURAH_DATA fehlt oder ist kein Array.');
} else {
  if (SURAH_DATA.length !== 114) fail(`SURAH_DATA hat ${SURAH_DATA.length} Einträge, erwartet sind 114.`);
  const ids = new Set();
  SURAH_DATA.forEach((s, i) => {
    if (ids.has(s.id)) fail(`Doppelte Suren-ID ${s.id}.`);
    ids.add(s.id);
    if (!Number.isInteger(s.id) || s.id < 1 || s.id > 114) fail(`SURAH_DATA[${i}]: ungültige id "${s.id}".`);
    if (!s.name) fail(`SURAH_DATA[${i}] (${s.id}): name fehlt.`);
    if (!s.ar) fail(`SURAH_DATA[${i}] (${s.id}): ar fehlt.`);
    if (!Number.isInteger(s.verses) || s.verses < 1) fail(`SURAH_DATA[${i}] (${s.id}): verses ungültig.`);
  });
  note(`SURAH_DATA: ${SURAH_DATA.length} Suren.`);
}

/* ---------- 6. QURAN_FREQ ---------- */
if (!QURAN_FREQ || typeof QURAN_FREQ !== 'object'){
  fail('QURAN_FREQ fehlt oder ist kein Objekt.');
} else {
  let roots = 0, stellen = 0;
  /* Kompaktes Format seit der Erweiterung auf alle acht Lehrwerke:
     QURAN_FREQ[Wurzel] = [Anzahl, [[Sure, Vers], ...]]. */
  Object.entries(QURAN_FREQ).forEach(([root, f]) => {
    roots++;
    if (!Array.isArray(f) || f.length !== 2){
      fail(`QURAN_FREQ["${root}"]: erwartet [Anzahl, Verse].`); return;
    }
    const [anzahl, verse] = f;
    if (typeof anzahl !== 'number' || anzahl < 1)
      fail(`QURAN_FREQ["${root}"]: Anzahl ist keine positive Zahl.`);
    if (!Array.isArray(verse)){ fail(`QURAN_FREQ["${root}"]: Versliste ist kein Array.`); return; }
    if (verse.length > anzahl)
      fail(`QURAN_FREQ["${root}"]: mehr Fundstellen (${verse.length}) als Vorkommen (${anzahl}).`);
    verse.forEach((v, j) => {
      stellen++;
      if (!Array.isArray(v) || v.length !== 2){
        fail(`QURAN_FREQ["${root}"][${j}]: erwartet [Sure, Vers].`); return;
      }
      if (v[0] < 1 || v[0] > 114)
        fail(`QURAN_FREQ["${root}"][${j}]: Sure ${v[0]} liegt ausserhalb 1-114.`);
      if (v[1] < 1)
        fail(`QURAN_FREQ["${root}"][${j}]: Vers ${v[1]} ist keine gueltige Nummer.`);
    });
  });
  note(`QURAN_FREQ: ${roots} Wurzeln, ${stellen} Fundstellen.`);
}

/* ---------- 7. Dateien, auf die index.html und sw.js verweisen ---------- */
try {
  const html = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1]);
  scripts.forEach(src => {
    if (/^https?:/.test(src)) return;
    if (!fs.existsSync(path.join(DIR, src))) fail(`index.html lädt "${src}", die Datei existiert aber nicht.`);
  });
  note(`index.html: ${scripts.length} Skript-Einbindungen geprüft.`);
} catch (e) {
  fail(`index.html nicht lesbar: ${e.message}`);
}

try {
  const sw = fs.readFileSync(path.join(DIR, 'sw.js'), 'utf8');
  const cacheName = sw.match(/const\s+CACHE_NAME\s*=\s*['"]([^'"]+)['"]/);
  if (!cacheName) fail('sw.js: CACHE_NAME nicht gefunden.');
  else note(`sw.js: CACHE_NAME = ${cacheName[1]}`);
  const assetsBlock = sw.match(/const\s+ASSETS\s*=\s*\[([\s\S]*?)\]/);
  if (assetsBlock){
    const assets = [...assetsBlock[1].matchAll(/['"]([^'"]+)['"]/g)].map(m => m[1]);
    assets.forEach(a => {
      if (a === './') return;
      const p = path.join(DIR, a.replace(/^\.\//, ''));
      if (!fs.existsSync(p)) fail(`sw.js cacht "${a}", die Datei existiert aber nicht.`);
    });
    /* Umgekehrt: liegt eine eingebundene Datei NICHT im Cache, funktioniert offline nur die Hälfte. */
    const scriptsInHtml = [...fs.readFileSync(path.join(DIR, 'index.html'), 'utf8')
      .matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1]).filter(s => !/^https?:/.test(s));
    scriptsInHtml.forEach(s => {
      if (!assets.some(a => a.replace(/^\.\//, '') === s)) warn(`"${s}" wird von index.html geladen, steht aber nicht in ASSETS von sw.js (offline nicht verfügbar).`);
    });
    note(`sw.js: ${assets.length} Cache-Einträge geprüft.`);
  }
} catch (e) {
  fail(`sw.js nicht lesbar: ${e.message}`);
}

/* ---------- 8. manifest.json muss gültiges JSON sein ---------- */
try {
  const raw = fs.readFileSync(path.join(DIR, 'manifest.json'), 'utf8');
  const mf = JSON.parse(raw);
  if (!mf.name) warn('manifest.json: "name" fehlt.');
  if (!mf.start_url) warn('manifest.json: "start_url" fehlt.');
  note('manifest.json: gültiges JSON.');
} catch (e) {
  fail(`manifest.json ist kein gültiges JSON: ${e.message}`);
}

/* ---------- Ausgabe ---------- */
console.log('--- Validierung Vokabeltrainer ---');
info.forEach(m => console.log('  ok   ' + m));
warnings.forEach(m => console.log('  warn ' + m));
if (errors.length){
  console.log('');
  errors.forEach(m => console.log('  FEHLER ' + m));
  console.log(`\n${errors.length} Fehler — NICHT pushen.`);
  process.exit(1);
}
console.log(`\nAlles sauber${warnings.length ? ` (${warnings.length} Hinweis${warnings.length===1?'':'e'})` : ''} — Push ist in Ordnung.`);
process.exit(0);
