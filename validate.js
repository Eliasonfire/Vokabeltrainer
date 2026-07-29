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
  code += 'globalThis.__DATA = { VOCAB_DATA, SURAH_DATA, GRAMMAR_RULES, SENTENCE_TAGS, QURAN_FREQ, QURAN_WORT, LEHRBUCH_SAETZE };';
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  DATA = ctx.__DATA;
} catch (e) {
  fail(`Datendateien nicht ausführbar (Syntaxfehler?): ${e.message}`);
}

const { VOCAB_DATA, SURAH_DATA, GRAMMAR_RULES, SENTENCE_TAGS, QURAN_FREQ, QURAN_WORT, LEHRBUCH_SAETZE } = DATA;

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

  /* ---------- 1b. Singular- und Pluralfeld ----------
     Am 29.07.26 nachgemessen, bevor diese Pruefung entstand: `sg` ist in ALLEN
     111 gefuellten Faellen wortgleich mit `ar` - das Feld traegt nirgends eine
     eigene Information. Deshalb ist keiner der beiden Faelle unten ein Fehler,
     der einen Push aufhalten duerfte; beide sind Hinweise auf eine Luecke im
     Abzug. Und beide bedeuten NICHT dasselbe:

       pl gefuellt, sg leer  -> harmlos. `ar` ist der Singular, `sg` waere nur
                                seine Wiederholung (so bei لَبَنٌ / أَلْبَان).
       sg gefuellt, pl leer  -> inhaltliche Luecke. Bei مِكْوَاةٌ „Buegeleisen"
                                gibt es sehr wohl einen Plural, arabicroots
                                liefert ihn nur nicht mit.

     Die fehlende Form wird NICHT ergaenzt: erfundene Grammatik verbietet E.1.
     Der Hinweis sagt, wo nachzuschlagen ist - mehr darf er nicht. */
  const plOhneSg = VOCAB_DATA.filter(w => w && w.pl && !w.sg);
  const sgOhnePl = VOCAB_DATA.filter(w => w && w.sg && !w.pl);
  const sgUngleichAr = VOCAB_DATA.filter(w => w && w.sg && w.ar && w.sg !== w.ar);

  if (plOhneSg.length)
    warn(`${plOhneSg.length} Vokabel(n) mit Plural, aber ohne sg-Feld — unkritisch, "ar" ist dort der Singular: ${plOhneSg.slice(0,5).map(w => `${w.ar} (id ${w.id})`).join(', ')}${plOhneSg.length>5?' …':''}`);
  if (sgOhnePl.length)
    warn(`${sgOhnePl.length} Vokabel(n) mit sg-Feld, aber ohne Plural — im Abzug nachsehen, nicht selbst bilden (E.1): ${sgOhnePl.slice(0,5).map(w => `${w.ar} (id ${w.id})`).join(', ')}${sgOhnePl.length>5?' …':''}`);
  /* Kommt bisher nie vor. Traete es auf, stuende die Vokabel unter ihrem Plural
     und `w.sg || w.ar` in js/saetze.js suchte im Satz nach einer anderen Form
     als bisher - das gehoert gesehen, bevor es still das Verhalten aendert. */
  if (sgUngleichAr.length)
    warn(`${sgUngleichAr.length} Vokabel(n) mit sg ≠ ar (bisher gab es das nicht; js/saetze.js sucht dann eine andere Form im Satz): ${sgUngleichAr.slice(0,5).map(w => `${w.ar} → sg ${w.sg} (id ${w.id})`).join(', ')}`);
  note(`sg/pl: ${VOCAB_DATA.filter(w => w && w.sg && w.pl).length} Einträge mit beiden Formen, ${plOhneSg.length} nur Plural, ${sgOhnePl.length} nur Singular.`);

  /* ---------- 1c. Trennzeichen in Mehrfachformen ----------
     Manche Vokabeln haben zwei gueltige Plurale (بُيُوتٌ / أَبْيَاتٌ). arabicroots
     trennt sie im Abzug mit "|", in der App steht " / ". Beide muessen hier
     durchgehen, sonst schlaegt die Pruefung beim naechsten Abzug auf lauter
     korrekten Daten an. Geprueft wird nur, dass jede Teilform fuer sich etwas
     Arabisches enthaelt - ein Wert wie "بُيُوتٌ / " waere sonst unauffaellig.
     Stand 29.07.26: 7 Werte mit " / ", kein einziger mit "|". */
  const MEHRFACH = /\s*[|/]\s*/;
  const FORMFELDER = ['sg', 'pl', 'femSg', 'femPl'];
  let mehrfach = 0, mitPipe = 0;
  VOCAB_DATA.forEach((w, i) => {
    if (!w || typeof w !== 'object') return;
    FORMFELDER.forEach(f => {
      const v = w[f];
      if (typeof v !== 'string' || !MEHRFACH.test(v)) return;
      mehrfach++;
      if (v.includes('|')) mitPipe++;
      const teile = v.split(MEHRFACH);
      teile.forEach(teil => {
        if (!teil.trim()) fail(`VOCAB_DATA[${i}] (id ${w.id}): Feld "${f}" hat eine leere Teilform ("${v}").`);
        else if (!/[ء-ي]/.test(teil)) fail(`VOCAB_DATA[${i}] (id ${w.id}): Teilform "${teil}" in "${f}" enthält keine arabischen Buchstaben.`);
      });
    });
  });
  if (mitPipe)
    warn(`${mitPipe} Formfeld(er) trennen mit "|" statt " / ". Die App zeigt beides gleich an (formenAnzeige in js/kern.js) — in den Daten trotzdem vereinheitlichen, damit Suchen darüber nicht zwei Schreibweisen kennen müssen.`);
  if (mehrfach) note(`Mehrfachformen: ${mehrfach} Feld(er) mit zwei Formen, alle Teilformen gefüllt.`);
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

/* ---------- 2c. Laedt js/irab.js noch ausserhalb des Browsers? ----------
   Am 29.07.26 wurde hier eine Luecke sichtbar, die teuer haette werden koennen:
   `js/irab.js` bekam einen Aufruf von `formen()` aus `js/kern.js`. Im Browser
   ging das gut, weil index.html kern.js vorher laedt - und genau das prueft der
   Block darueber ja auch ab. `node pruefe-saetze.js` aber laedt irab.js per
   require ALLEIN und starb sofort mit "ReferenceError: formen is not defined".
   validate.js meldete trotzdem "Push ist in Ordnung".

   Das ist der schlimmste Fehlertyp fuer dieses Skript: Es hat seine Zusage
   gegeben, waehrend das zweite Pflichtskript des Projekts komplett tot war. Die
   Verdrahtungspruefung oben kann das strukturell nicht sehen - sie vergleicht
   Dateilisten, sie fuehrt nichts aus.

   Deshalb hier der einzige Test in dieser Datei, der Code wirklich AUSFUEHRT:
   irab.js wird in einer leeren Sandbox geladen, so wie Node es tut. Faellt es
   dort auf die Nase, ist das ein FEHLER und kein Hinweis. Der Kopfkommentar von
   irab.js (Z. 46-58) erklaert, warum diese Eigenstaendigkeit Absicht ist. */
try {
  const irabSrc = fs.readFileSync(path.join(DIR, 'js', 'irab.js'), 'utf8');
  const sandbox = { module: { exports: {} }, exports: {}, require, console };
  vm.createContext(sandbox);
  vm.runInContext(irabSrc, sandbox);
  /* Nicht nur laden, sondern die Funktion auch benutzen - der Fehler von damals
     steckte im Rumpf von setzeLexikon und waere beim blossen Laden unbemerkt
     geblieben. Ein Eintrag mit Doppelform trifft genau die betroffene Zeile. */
  if (typeof sandbox.setzeLexikon === 'function'){
    sandbox.setzeLexikon([
      { ar: 'بَيْتٌ', type: 'noun', pl: 'بُيُوتٌ / أَبْيَاتٌ', sg: null, femSg: null, femPl: null }
    ]);
    note('js/irab.js: laedt und laeuft auch ohne Browser (setzeLexikon getestet).');
  } else {
    fail('js/irab.js laedt zwar, stellt aber kein setzeLexikon bereit — pruefe-saetze.js braucht es.');
  }
} catch (e) {
  fail(`js/irab.js laeuft ausserhalb des Browsers nicht mehr: ${e.message}. `
     + `Ursache ist fast immer ein Aufruf in ein anderes Modul (z.B. js/kern.js), `
     + `das Node nie laedt — siehe Kopfkommentar von irab.js. node pruefe-saetze.js waere damit tot.`);
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
    /* source2 ist FREIWILLIG — der gedruckte Zweitbeleg aus einem der deutschen
       Madina-Schluessel. Er steht nur an Regeln, bei denen Buch und Unterricht
       dasselbe sagen; wo sie abweichen, entscheidet Elias und es bleibt leer.
       Wenn das Feld aber da ist, muss es vollstaendig und plausibel sein —
       eine halbe Fundstelle ist schlimmer als keine, weil man ihr glaubt. */
    if (r.source2 !== undefined){
      const w2 = `${where} (${r.id}): source2`;
      if (typeof r.source2 !== 'object' || r.source2 === null) fail(`${w2} ist kein Objekt.`);
      else {
        const { schluessel, lektion, seite } = r.source2;
        if (![1,2,3].includes(schluessel)) fail(`${w2}.schluessel muss 1, 2 oder 3 sein (ist: ${schluessel}).`);
        /* Lektionszahl je Band: Schluessel 1 hat 23, Band 2 hat 31, Band 3 hat 34. */
        const maxLektion = { 1: 23, 2: 31, 3: 34 }[schluessel];
        if (!Number.isInteger(lektion) || lektion < 1 || (maxLektion && lektion > maxLektion))
          fail(`${w2}.lektion "${lektion}" liegt ausserhalb von 1-${maxLektion} (Schluessel ${schluessel}).`);
        /* Seitenzahl je Band: 73, 141, 272 Seiten. */
        const maxSeite = { 1: 73, 2: 141, 3: 272 }[schluessel];
        if (!Number.isInteger(seite) || seite < 1 || (maxSeite && seite > maxSeite))
          fail(`${w2}.seite "${seite}" liegt ausserhalb von 1-${maxSeite} (Schluessel ${schluessel}).`);
      }
    }
  });
  const mitBuch = GRAMMAR_RULES.filter(r => r.source2).length;
  note(`GRAMMAR_RULES: ${GRAMMAR_RULES.length} Regeln, alle mit Quelle; ${mitBuch} zusaetzlich mit gedrucktem Beleg.`);

  /* ---------- 4. SENTENCE_TAGS: Referenzen in beide Richtungen ---------- */
  if (SENTENCE_TAGS && typeof SENTENCE_TAGS === 'object' && Array.isArray(VOCAB_DATA)){
    /* Markierungen duerfen an beiden Satzquellen haengen: an den arabicroots-
       Vokabeln und an den Saetzen aus dem Lehrwerk. */
    const alleSaetze = VOCAB_DATA.concat(Array.isArray(LEHRBUCH_SAETZE) ? LEHRBUCH_SAETZE : []);
    const vocabById = new Map(alleSaetze.map(w => [String(w.id), w]));
    let tagCount = 0;
    const leer = [];
    Object.entries(SENTENCE_TAGS).forEach(([vocabId, tags]) => {
      const w = vocabById.get(String(vocabId));
      if (!w){ fail(`SENTENCE_TAGS verweist auf unbekannte Vokabel-ID "${vocabId}".`); return; }
      if (!Array.isArray(tags)){ fail(`SENTENCE_TAGS["${vocabId}"] ist kein Array.`); return; }
      /* Leergebliebene Eintraege stammen aus dem Markierungs-Audit vom 28.07.26:
         wurden ALLE Markierungen eines Satzes entfernt, blieb der Schluessel mit
         leerem Array zurueck. Schadet nichts, laesst aber jede Zaehlung ueber
         Object.keys(SENTENCE_TAGS) zu hoch ausfallen - 169 "markierte Saetze",
         von denen 3 keine einzige Markierung haben. */
      if (!tags.length){ leer.push(vocabId); return; }
      tags.forEach((t, j) => {
        tagCount++;
        if (!ruleIds.has(t.ruleId)) fail(`SENTENCE_TAGS["${vocabId}"][${j}] verweist auf unbekannte Regel "${t.ruleId}".`);
        if (!t.matchText) fail(`SENTENCE_TAGS["${vocabId}"][${j}]: matchText fehlt.`);
        else if (!w.sentAr) fail(`SENTENCE_TAGS["${vocabId}"][${j}]: Vokabel hat keinen Beispielsatz (sentAr), Markierung liefe ins Leere.`);
        else if (!w.sentAr.includes(t.matchText)) fail(`SENTENCE_TAGS["${vocabId}"][${j}]: matchText "${t.matchText}" kommt im Satz nicht vor.`);
      });
    });
    if (leer.length)
      warn(`${leer.length} Satz-Schlüssel in SENTENCE_TAGS haben ein leeres Array (id ${leer.join(', ')}) — Rest des Markierungs-Audits, verfälscht jede Zählung über Object.keys().`);
    note(`SENTENCE_TAGS: ${tagCount} Markierungen auf ${Object.keys(SENTENCE_TAGS).length - leer.length} Sätzen, alle Referenzen auflösbar.`);
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
  /* Die Wortzahlen sind eine zweite, unabhaengige Tabelle in derselben Datei. */
  if (QURAN_WORT && typeof QURAN_WORT === "object"){
    const schlecht = Object.entries(QURAN_WORT).filter(([,n]) => typeof n !== "number" || n < 1);
    if (schlecht.length) fail(`QURAN_WORT: ${schlecht.length} Eintraege ohne positive Zahl (z.B. "${schlecht[0][0]}").`);
    else note(`QURAN_WORT: ${Object.keys(QURAN_WORT).length} Woerter mit eindeutiger Zahl.`);
  }
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
