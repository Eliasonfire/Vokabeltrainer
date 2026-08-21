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

const { execFileSync } = require('child_process');
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
  code += 'globalThis.__DATA = { VOCAB_DATA, SURAH_DATA, GRAMMAR_RULES, SENTENCE_TAGS, SATZ_THEMEN, QURAN_FREQ, QURAN_WORT, LEHRBUCH_SAETZE };';
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  DATA = ctx.__DATA;
} catch (e) {
  fail(`Datendateien nicht ausführbar (Syntaxfehler?): ${e.message}`);
}

const { VOCAB_DATA, SURAH_DATA, GRAMMAR_RULES, SENTENCE_TAGS, SATZ_THEMEN, QURAN_FREQ, QURAN_WORT, LEHRBUCH_SAETZE } = DATA;

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

  /* ⚠ SEINE EIGENEN WOERTER — der dritte Weg in den Bestand, seit 20.08.2026.
     js/kern.js:245 schiebt vt_personalVocab in VOCAB_DATA; strukturell gelten
     dort dieselben Regeln. Dieses Tor kannte sie nicht (grep auf
     'eigene-woerter' in validate.js: 0 Treffer).

     ⛔ ABSICHTLICH warn() statt fail(): validate.js ist das Tor VOR dem
     Veroeffentlichen, und data/ wird gar nicht ausgeliefert (.gitignore).
     Ein Fehler in einer nicht ausgelieferten Datei darf die Auslieferung von
     etwas Unbeteiligtem nicht blockieren. Sichtbar sein muss er trotzdem.

     ⭐ Am Tag des Einbaus waren alle vier Pruefungen sauber (0 ID-Dubletten,
     0 ungueltige chapter, 0 ohne id, 0 pl-ohne-sg). Die Wirkung ist heute
     NULL — das steht hier, damit spaeter niemand glaubt, hier sei ein Fehler
     behoben worden. [[zahlen_ohne_beleg]] */
  {
    const ew = path.join(DIR, 'data', 'eigene-woerter.json');
    if (fs.existsSync(ew)){
      try {
        const liste = (JSON.parse(fs.readFileSync(ew, 'utf8')).woerter) || [];
        let n = 0;
        liste.forEach(w => {
          if (!w || w.id == null || String(w.id) === ''){ warn('eigene-woerter.json: Eintrag ohne id.'); n++; return; }
          if (seen.has(w.id)){ warn(`eigene-woerter.json: id "${w.id}" gibt es schon in VOCAB_DATA — in der App gewinnt eine von beiden still.`); n++; }
          const ch = w.chapter;
          if (!(ch === 'personal' || (Number.isInteger(ch) && ch >= 1 && ch <= 24))){
            warn(`eigene-woerter.json (id ${w.id}): ungueltiges chapter "${ch}".`); n++; }
          if (w.pl && !w.sg){ warn(`eigene-woerter.json (id ${w.id}): pl ohne sg.`); n++; }
        });
        note(`data/eigene-woerter.json: ${liste.length} eigene Woerter geprueft, ${n} Hinweis(e).`);
      } catch (e) { warn('data/eigene-woerter.json nicht lesbar: ' + e.message); }
    } else {
      note('data/eigene-woerter.json fehlt — seine eigenen Woerter sind UNGEPRUEFT (auf einem frisch geklonten Stand normal).');
    }
  }

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
  /* Im arabicroots-Abzug nachgeschlagen (19.08.2026, MCP search_vocabulary).
     Wer hier steht, hat auch DORT keinen Plural — es gibt also nichts
     nachzutragen, und selbst bilden verbietet E.1. Die Meldung bleibt
     trotzdem stehen: kommt spaeter ein Plural in den Abzug, faellt sie auf. */
  const ABZUG_OHNE_PLURAL = {
    '45841': 'مِكْوَاةٌ — arabicroots id 45841, madina-1 K6: plural ist dort NULL (19.08.2026 geprueft)',
  };

  const plOhneSg = VOCAB_DATA.filter(w => w && w.pl && !w.sg);
  const sgOhnePl = VOCAB_DATA.filter(w => w && w.sg && !w.pl);
  const sgUngleichAr = VOCAB_DATA.filter(w => w && w.sg && w.ar && w.sg !== w.ar);

  if (plOhneSg.length)
    warn(`${plOhneSg.length} Vokabel(n) mit Plural, aber ohne sg-Feld — unkritisch, "ar" ist dort der Singular: ${plOhneSg.slice(0,5).map(w => `${w.ar} (id ${w.id})`).join(', ')}${plOhneSg.length>5?' …':''}`);
  if (sgOhnePl.length)
    warn(`${sgOhnePl.length} Vokabel(n) mit sg-Feld, aber ohne Plural — ${sgOhnePl.every(w => ABZUG_OHNE_PLURAL[w.id]) ? 'im Abzug geprueft, dort ebenfalls keiner' : 'im Abzug nachsehen, nicht selbst bilden (E.1)'}: ${sgOhnePl.slice(0,5).map(w => `${w.ar} (id ${w.id})`).join(', ')}${sgOhnePl.length>5?' …':''}`);
  /* Kommt bisher nie vor. Traete es auf, stuende die Vokabel unter ihrem Plural
     und `w.sg || w.ar` in js/saetze.js suchte im Satz nach einer anderen Form
     als bisher - das gehoert gesehen, bevor es still das Verhalten aendert. */
  if (sgUngleichAr.length)
    warn(`${sgUngleichAr.length} Vokabel(n) mit sg ≠ ar (bisher gab es das nicht; js/saetze.js sucht dann eine andere Form im Satz): ${sgUngleichAr.slice(0,5).map(w => `${w.ar} → sg ${w.sg} (id ${w.id})`).join(', ')}`);

  /* ⛔ Ein `pl`, das gar kein Plural ist — gemessen am 20.08.2026.

     Die neun Zahlwoerter 50296-50304 tragen im Feld `pl` nicht den Plural,
     sondern die jeweils andere Genusform:

         50296  وَاحِدٌ    pl: وَاحِدَةٌ
         50297  ثَلَاثَةٌ  pl: ثَلَاثٌ
         …      bis 50304 عَشَرَةٌ  pl: عَشْرٌ

     Das ist kein Schreibfehler, sondern eine andere Beziehung: bei den
     Zahlen 3-10 richtet sich die Form gegenlaeufig nach dem Gezaehlten.
     Die App beschriftet das Feld aber an DREI Stellen woertlich mit
     "Plural" (js/kategorien.js:650 und :912, js/lernen.js:231), und
     `bauePluralKarte()` in js/kern.js:366 baut daraus eine eigene
     Lernkarte mit `de: w.de + " (Plural)"` — also "drei (Plural)".

     ⛔ ABSICHTLICH warn() und ABSICHTLICH ohne Korrektur. Was dort statt
     "Plural" stehen soll, ist eine Frage an Elias' Lehrer und nicht an
     mich; eine erfundene Beschriftung waere schlimmer als die falsche,
     weil sie niemand mehr nachprueft. [[sein_ist_nicht_wirken]]
     [[erfundene_begruendung_schliesst_den_fall]]

     ⭐ Erkannt an der BEDEUTUNG, nicht an der Form. Der Formvergleich
     ("nur die Taa marbuta trennt sie") hatte 9 Kandidaten: 8 echt, dazu
     غُرْفَةٌ → غُرَفٌ falsch getroffen (echter gebrochener Plural) und
     ثَمَانِيَةٌ → ثَمَانٍ uebersehen. Ueber `de` sind es genau die neun, in
     beide Richtungen gegengeprueft. [[kandidatenliste_ist_keine_fehlerliste]] */
  const ZAHLWORT = /^(null|ein|eins|eine|zwei|drei|vier|fuenf|fünf|sechs|sieben|acht|neun|zehn|elf|zwoelf|zwölf)$/i;
  const istZahlwort = de => String(de || '').split('/').some(t => ZAHLWORT.test(t.trim()));
  const zahlMitPl = VOCAB_DATA.filter(w => w && w.pl && istZahlwort(w.de));
  if (zahlMitPl.length)
    warn(`${zahlMitPl.length} Zahlwort(e) zeigen unter "Plural" die andere Genusform, keinen Plural — `
      + `die Beschriftung braucht Elias' Entscheidung, nicht meine: `
      + `${zahlMitPl.slice(0,3).map(w => `${w.ar} → ${w.pl} (id ${w.id})`).join(', ')}${zahlMitPl.length>3?' …':''}`);
  note(`Zahlwoerter: ${VOCAB_DATA.filter(w => w && istZahlwort(w.de)).length} im Bestand, ${zahlMitPl.length} davon mit einem pl-Feld.`);
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
    /* Quellenpflicht aus Goal-Prompt E.1 — ohne belegbare Quelle darf keine Regel rein.
       ⭐ Seit dem 18.08.2026 gibt es ZWEI erlaubte Quellenarten, nicht mehr nur eine:
          - der Unterricht  -> `source` mit Video und Zeitmarke (der Normalfall)
          - ein Lehrbuch    -> `ergaenzung: true` + `buchQuelle` + `kapitel`
       Anlass war Elias' Freigabe von Block B ("wenn das aus den büchern ist dann
       kannst du das machen"): elf Lücken werden aus Sharḥ Madīnah und Bayna Yadayk
       geschlossen. Die haben naturgemäß KEINE Videofundstelle — eine zu erfinden
       wäre genau das, was E.1 verbietet. Die Pflicht bleibt also bestehen, sie
       kennt nur einen zweiten Beleg-Typ. Ohne beides fällt die Regel weiterhin durch. */
    /* Die deutschen Madina-Schluessel am 18.08.2026 ergaenzt. Sie sind seit
       dem 29.07.2026 Elias' Goldstandard ("sie sind der goldene standart und
       sollte auch so angesehen werden") und standen trotzdem nicht in dieser
       Liste - die erste Regel daraus fiel deshalb durch. */
    const BUCHWERKE = ['sharh-madinah-1', 'bayna-yadayk-2',
                       'madina-schluessel-1', 'madina-schluessel-2', 'madina-schluessel-3'];
    if (r.ergaenzung){
      if (r.source) fail(`${where} (${r.id}): hat ergaenzung:true UND source — eine Regel ist entweder aus dem Unterricht oder aus dem Buch, nicht beides.`);
      if (!r.buchQuelle) fail(`${where} (${r.id}): ergaenzung:true, aber buchQuelle fehlt (Quellenpflicht E.1).`);
      else {
        const wb = `${where} (${r.id}): buchQuelle`;
        if (!BUCHWERKE.includes(r.buchQuelle.werk)) fail(`${wb}.werk "${r.buchQuelle.werk}" unbekannt (erlaubt: ${BUCHWERKE.join(', ')}).`);
        if (!Number.isInteger(r.buchQuelle.lektion) || r.buchQuelle.lektion < 1) fail(`${wb}.lektion fehlt oder ist keine Zahl.`);
        if (!Number.isInteger(r.buchQuelle.seite) || r.buchQuelle.seite < 1) fail(`${wb}.seite fehlt oder ist keine Zahl.`);
      }
      /* `kapitel` ersetzt hier `source.chapter` — ohne das weiss die Oberflaeche nicht,
         wo die Regel hingehoert, und sie taucht in keiner Kapitelauswahl auf. */
      if (!Number.isInteger(r.kapitel)) fail(`${where} (${r.id}): ergaenzung:true, aber kapitel fehlt oder ist keine Zahl.`);
    } else if (!r.source) {
      fail(`${where} (${r.id}): source fehlt (Quellenpflicht E.1).`);
    } else {
      if (!r.source.video) fail(`${where} (${r.id}): source.video fehlt.`);
      if (!r.source.approxTimestamp) fail(`${where} (${r.id}): source.approxTimestamp fehlt.`);
      if (r.source.chapter === undefined) fail(`${where} (${r.id}): source.chapter fehlt.`);
    }
    if (r.buchQuelle && !r.ergaenzung) fail(`${where} (${r.id}): buchQuelle ohne ergaenzung:true — dann waere die Herkunft in der App nicht gekennzeichnet.`);
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
  const mitBuch   = GRAMMAR_RULES.filter(r => r.source2).length;
  const ausBuch   = GRAMMAR_RULES.filter(r => r.ergaenzung).length;
  const ausLehrer = GRAMMAR_RULES.length - ausBuch;
  /* Die beiden Herkuenfte werden GETRENNT genannt. Eine Sammelzahl "alle mit
     Quelle" wuerde verdecken, dass elf davon nicht vom Lehrer stammen — und
     genau das will Elias bei der Regelfreigabe sehen. */
  note(`GRAMMAR_RULES: ${GRAMMAR_RULES.length} Regeln — ${ausLehrer} aus dem Unterricht, `
     + `${ausBuch} aus den Lehrbuechern (gekennzeichnet); ${mitBuch} mit gedrucktem Zweitbeleg.`);

  /* ---------- 4. SENTENCE_TAGS: Referenzen in beide Richtungen ---------- */
  if (SENTENCE_TAGS && typeof SENTENCE_TAGS === 'object' && Array.isArray(VOCAB_DATA)){
    /* Markierungen duerfen an ALLEN DREI Satzquellen haengen: an den
       arabicroots-Vokabeln, an den Saetzen aus dem Lehrwerk — und seit dem
       19.08.2026 an den verfassten Saetzen in data/beispielsaetze.js.

       ⛔ Die dritte fehlte hier, und das war kein Formfehler: die fuenf an dem
       Tag verfassten Saetze haengen an BUCHVOKABELN (madina-1, Kapitel 10/11).
       Deren Kennungen stehen nicht in vocab-data.js, also meldete diese
       Pruefung "unbekannte Vokabel-ID" und verhinderte jede Markierung an
       ihnen. Ohne Markierung kein Thema und keine Uebungsaufgabe.

       ⚠️ Geprueft wird gegen die Kennungen in beispielsaetze.js selbst, nicht
       gegen den Buchabzug: der darf nach den AGB nicht ins Repo, und eine
       Pruefung, die ohne ihn nicht laeuft, waere auf einem frischen Klon rot.
       [[vorabpruefung_kennt_ihr_tor_nicht]] — genau umgekehrt aufgetreten:
       markierung-setzen.mjs sagte "tragbar", dieses Tor sagte nein. */
    /* ⚠️ `DIR`, nicht `P` — validate.js kennt kein P. Der erste Anlauf schrieb
       `P + 'data'`, warf einen ReferenceError, und das try/catch schluckte ihn:
       die Quelle blieb leer und die Pruefung meldete weiter "unbekannte
       Vokabel-ID". Ein Fangnetz, das ALLES faengt, versteckt auch den eigenen
       Tippfehler — deshalb wird der Fehler jetzt genannt. */
    let VERFASSTE_SAETZE = {};
    {
      const d = path.join(DIR, 'data', 'beispielsaetze.js');
      if (fs.existsSync(d)){
        try {
          VERFASSTE_SAETZE = (new Function(fs.readFileSync(d, 'utf8')
            + ';return typeof BEISPIELSAETZE!=="undefined"?BEISPIELSAETZE:{};'))();
        } catch (e) { fail('data/beispielsaetze.js nicht lesbar: ' + e.message); }
      }
    }
    /* ⛔⛔ VIERTE SATZQUELLE (19.08.2026): data/fachbegriffe.js.
       Die fuenf Besitzendungen sind Karteikarten MIT eigenem Satz. Weil
       js/kern.js sie in VOCAB_DATA schiebt und js/saetze.js
       `VOCAB_DATA.filter(w => w.sentAr)` liest, sind ihre Saetze in der
       laufenden App echte Satzmodus-Saetze — dieses Tor hier kannte sie nicht
       und haette jede Markierung an ihnen als "unbekannte Vokabel-ID"
       zurueckgewiesen. Genau die Luecke, an der am selben Tag schon
       data/beispielsaetze.js haengengeblieben ist. [[dritte_satzquelle]] */
    let FACHBEGRIFFE = [];
    {
      const d = path.join(DIR, 'data', 'fachbegriffe.js');
      if (fs.existsSync(d)){
        try {
          FACHBEGRIFFE = (new Function(fs.readFileSync(d, 'utf8')
            + ';return typeof FACHBEGRIFF_VOKABELN!=="undefined"?FACHBEGRIFF_VOKABELN:[];'))();
        } catch (e) { fail('data/fachbegriffe.js nicht lesbar: ' + e.message); }
      }
    }
    const alleSaetze = VOCAB_DATA
      .concat(Array.isArray(LEHRBUCH_SAETZE) ? LEHRBUCH_SAETZE : [])
      .concat(FACHBEGRIFFE.filter(w => w && w.sentAr))
      .concat(Object.entries(VERFASSTE_SAETZE)
        .filter(([, s]) => s && s.sentAr)
        .map(([id, s]) => ({ id, sentAr: s.sentAr, sentDe: s.sentDe })));
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
         Object.keys(SENTENCE_TAGS) zu hoch ausfallen.

         ✅ Am 15.08.2026 aufgeraeumt: die letzten zwei (45878, 45883) sind
         entfernt, die Warnung feuert seitdem nicht mehr. Sie bleibt trotzdem
         stehen - der naechste Audit erzeugt dieselben Reste wieder, und dann
         soll es auffallen statt still in der Zaehlung zu verschwinden. */
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

    /* ⛔ Bis zum 21.08.2026 wurden NUR <script src> geprueft. Fonts,
       Stylesheets, Bilder und url() im CSS blieben aussen vor — und ihr
       Ausfall waere still: die App startet offline, aber das arabische
       Schriftbild fehlt, weil der Font auf eine Ersatzschrift zurueckfaellt.
       Keine Fehlermeldung, nur ein anderes Aussehen.
       [[testkasten_erbt_falschen_font]] [[ausfall_ist_unsichtbar_gebaut]] */
    const htmlRoh = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
    const weitere = [
      ['<link href>', [...htmlRoh.matchAll(/<link[^>]+href="([^"]+)"/g)].map(m => m[1])],
      ['<img src>',   [...htmlRoh.matchAll(/<img[^>]+src="([^"]+)"/g)].map(m => m[1])],
      ['url() im CSS', [...htmlRoh.matchAll(/url\(['"]?([^)'"]+)['"]?\)/g)].map(m => m[1])]
    ];
    let weitereGeprueft = 0;
    for (const [art, liste] of weitere){
      const lokal = [...new Set(liste
        .filter(s => !/^(https?:|data:|#)/.test(s))
        .map(s => s.replace(/^\.\//, '').split('?')[0]))];
      weitereGeprueft += lokal.length;
      lokal.forEach(s => {
        if (!assets.some(a => a.replace(/^\.\//, '') === s))
          warn(`${art}: "${s}" wird von index.html geladen, steht aber nicht in ASSETS von sw.js (offline nicht verfügbar).`);
      });
    }
    /* ---------- Die Auslieferstrategie selbst ----------

       Drei Eigenschaften, die niemand prüfte und die jede einzelne schon
       Arbeit gekostet haben. Der Wortlaut der Meldungen nennt den Grund mit —
       ein Wächter, dessen Grund man nicht kennt, wird weggeklickt.
       [[regel_gilt_nur_mit_begruendung]] */
    const fehlerVorher = errors.length;
    const swRoh = fs.readFileSync(path.join(DIR, 'sw.js'), 'utf8');
    const fetchBlock = swRoh.slice(swRoh.indexOf("addEventListener('fetch'"));
    if (fetchBlock){
      const iNetz  = fetchBlock.indexOf('fetch(new Request');
      const iCache = fetchBlock.indexOf('caches.match');
      if (iNetz === -1 || (iCache !== -1 && iCache < iNetz))
        fail('sw.js liefert nicht mehr NETZ ZUERST. Dann sieht Elias tagelang eine alte '
           + 'Fassung und meldet Fehler, die laengst behoben sind (18.08.2026). Das Ritual '
           + '"SW abmelden + Caches leeren" wurde nur deshalb abgeschafft.');
      if (!/pathname\.startsWith\('\/api\/'\)/.test(fetchBlock))
        fail('sw.js nimmt /api/ nicht mehr vom Caching aus. Dann bekommt das Geraet beim '
           + 'naechsten Start den Stand von gestern und laedt ihn als "aktuell" wieder hoch — '
           + 'der Geraeteabgleich zerstoert die Arbeit, die er schuetzen soll.');
      if (!/cache:\s*'reload'/.test(fetchBlock))
        fail("sw.js setzt kein cache: 'reload'. Dann darf der BROWSER-Cache antworten, "
           + 'und "Netz zuerst" nuetzt nichts.');
      /* ⛔ NUR wenn wirklich alle drei stehen. Der erste Anlauf setzte diese
         Zeile UNBEDINGT - dann stand im Stoertest die gruene Meldung neben dem
         roten Befund. Genau der Fehler, der eine Stunde vorher in
         pruefe-datumsangaben.mjs behoben wurde, sofort wieder gemacht.
         [[widerspruch_liegt_in_der_beschriftung]] */
      if (errors.length === fehlerVorher)
        note('sw.js: Netz zuerst, /api/ ausgenommen, cache: reload — alle drei gesetzt.');
    } else {
      fail('sw.js hat keinen fetch-Handler mehr — die App waere nicht mehr offlinefaehig.');
    }

    note(`sw.js: ${assets.length} Cache-Einträge geprüft, dagegen ${scriptsInHtml.length} Skripte `
      + `und ${weitereGeprueft} weitere Verweise aus index.html (Stylesheets, Bilder, url()).`);

    /* ⛔⛔ node --check auf jede ausgelieferte .js-Datei.

       Am 19.08.2026 hat eine Textänderung ein Anführungszeichen falsch
       maskiert: `data/eselsbruecken.js` und `vocab-data.js` waren beide
       syntaktisch kaputt — und validate.js meldete "Alles sauber". Die App
       hätte beim Laden die Hälfte ihrer Daten verloren, und zwar STILL:
       ein Skript, das nicht parst, wirft im Browser und der Rest läuft weiter.

       Dieselbe Lücke stand schon einmal im Gedächtnis: ein Kommentar-Einschub
       hinter dem Kommentarende wurde zu nacktem Code — "node --check findet
       es, validate.js nicht". Jetzt findet validate.js es auch.

       ⚠️ Und genau daran ist dieser Block beim Schreiben selbst gescheitert:
       die Zeichenfolge Stern-Schrägstrich stand im Kommentartext und hat den
       Kommentar vorzeitig geschlossen. Sie steht hier deshalb nirgends
       ausgeschrieben. */
    const kaputt = [];
    assets.filter(a => a.endsWith('.js')).forEach(a => {
      const p = path.join(DIR, a.replace(/^\.\//, ''));
      if (!fs.existsSync(p)) return;
      try { execFileSync(process.execPath, ['--check', p], { stdio: 'pipe' }); }
      catch (e) {
        const roh = String(e.stderr || '').split(/\r?\n/);
        const zeile = roh.find(z => /Error/.test(z)) || 'Parserfehler';
        kaputt.push(`${a}: ${zeile.trim()}`);
      }
    });
    if (kaputt.length) kaputt.forEach(k => fail(`Syntaxfehler in ausgelieferter Datei — ${k}`));
    else note(`Syntax: alle ${assets.filter(a => a.endsWith('.js')).length} ausgelieferten .js-Dateien parsen.`);
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

/* ---------- 9. Wortfelder ----------
   Bewusst nur ein HINWEIS und niemals ein Fehler: ein frischer Abzug von
   arabicroots bringt zwangslaeufig Woerter mit, fuer die noch kein deutsches
   Suchwort in wortfelder-data.js steht. Das darf keinen Push aufhalten — die
   Woerter sind in der App auffindbar, nur nicht einsortiert. Die Messung selbst
   steht in pruefe-wortfelder.js, damit sie nicht zweimal existiert und
   auseinanderlaeuft.

   Gemeldet wird ausschliesslich der LERNBESTAND (vocab-data.js). Die Buchabzuege
   unter data/ liegen wegen der arabicroots-AGB nicht im Repo, und ihre Zahlen
   waeren hier auch keine Auskunft: Elias lernt mit den 169. */
try {
  const wf = require('./pruefe-wortfelder.js');
  wf.tabellenFehler.forEach(m => fail(`wortfelder-data.js: ${m}`));
  const lern = wf.ohneFeld.find(g => g.quelle.startsWith('vocab-data.js'));
  const nomen = lern ? lern.woerter.filter(w => w.type === 'noun') : [];
  if (nomen.length)
    warn(`${nomen.length} Nomen im Lernbestand stehen in keinem Bedeutungsfeld — deutsches Suchwort in wortfelder-data.js ergaenzen (node pruefe-wortfelder.js --alle): ${nomen.slice(0,5).map(w => `${w.ar} (${w.de})`).join(', ')}${nomen.length>5?' …':''}`);
  note(`Wortfelder: ${wf.WORTFELDER.length} Felder, ${lern ? lern.woerter.length : 0} von ${VOCAB_DATA ? VOCAB_DATA.length : 0} Lernwoertern nur mit Wortart (davon ${nomen.length} Nomen).`);
} catch (e) {
  warn(`Wortfelder nicht messbar: ${e.message}`);
}

/* ---------- 10. Satzmodus-Kategorien ----------
   Elias am 19.08.2026: „man müsste auch da eine routine einführen, dass das
   immer aktuell bleibt … sogar eben ist naat dazu kommen eine neue
   grammatikregel die ich in der app üben sollte."

   Am selben Tag gemessen: 45 der 95 Regeln fielen durch JEDE Kategorie in
   SATZ_THEMEN und waren nur ueber „Alle" erreichbar. Das war niemandem
   aufgefallen, weil nichts danach gefragt hat.

   ⚠️ Es trifft mehr als den Filter: js/uebung.js waehlt mit derselben
   Tabelle die ABLENKER im Uebungsmodus. Eine Regel ohne Kategorie bekommt
   zufaellige statt thematisch naher.

   ⚠️ Nur ein HINWEIS, nie ein Fehler: die Regel ist ueber „Alle" weiter da,
   nur nicht gezielt uebbar. Das haelt keine Auslieferung auf.

   ⛔ SIEBEN Regeln stehen ABSICHTLICH ohne Kategorie und werden hier nicht
   gemeldet: fuenf zum Thema „weiblich" (Elias am 29.07.2026 zu einem Reiter
   dafuer: „das will ich glaube ich nicht"), dazu ya-nida-01 und badal-01,
   die in keine Gruppe passen, ohne dass man eine erfindet. Wer eine davon
   doch einsortiert, nimmt sie hier aus der Liste. */
const THEMENLOS_GEWOLLT = new Set([
  'ta-marbuta-fem-01', 'fem-ohne-ta-marbuta-01', 'koerperteile-genus-01',
  'eigennamen-fem-ohne-tanwin-01', 'ta-marbuta-grenzen-01',
  'ya-nida-01', 'badal-01',
]);
try {
  const themen = (typeof SATZ_THEMEN !== 'undefined' ? SATZ_THEMEN : []).filter(x => x.muster);
  if (!themen.length) warn('SATZ_THEMEN nicht lesbar — Kategorien ungeprueft.');
  else {
    const ohne = GRAMMAR_RULES.filter(r => !THEMENLOS_GEWOLLT.has(r.id) && !themen.some(x => x.muster.test(r.id)));
    if (ohne.length)
      warn(`${ohne.length} Regel(n) fallen durch jede Satzmodus-Kategorie und sind nur ueber „Alle" erreichbar — Muster in SATZ_THEMEN ergaenzen: ${ohne.slice(0,6).map(r => r.id).join(', ')}${ohne.length>6?' …':''}`);
    note(`SATZ_THEMEN: ${themen.length} Kategorien, ${GRAMMAR_RULES.length - ohne.length - THEMENLOS_GEWOLLT.size} von ${GRAMMAR_RULES.length} Regeln einsortiert, ${THEMENLOS_GEWOLLT.size} absichtlich ohne.`);
  }
} catch (e) {
  warn(`Satzmodus-Kategorien nicht messbar: ${e.message}`);
}

/* ---------- Bleibt jede Kategorie besetzt? (Elias, Nachtplan 5 und 13) ----------

   Seine Worte: "man muesste auch da eine routine einfuehren, dass das immer
   aktuell bleibt mit den verwendeten vokabeln und den moeglichen kategorien".

   ⛔ Die Pruefung oben sieht nur die andere Richtung: Regeln, die durch JEDE
   Kategorie fallen. Die Gegenrichtung fehlte — eine Kategorie, auf deren
   Muster keine Regel mehr passt, bleibt als Reiter stehen und fuehrt ins
   Leere. Elias hat am 19.08.2026 achtundzwanzig Regeln von den Karteikarten
   genommen; bei jeder weiteren Runde kann eine Kategorie leerlaufen.

   ⚠️ Gezaehlt wird, was im Satzmodus WIRKLICH erreichbar ist — also nur
   Regeln mit mindestens einer Markierung. Eine Kategorie mit fuenf Regeln,
   von denen keine markiert ist, zeigt dem Nutzer trotzdem nichts an.
   Das ist derselbe Unterschied wie in [[daten_ohne_zugang]]: vorhanden ist
   nicht dasselbe wie erreichbar.

   Schwelle 2, gemessen am 19.08.2026: die kleinste Kategorie ist "Wortarten"
   mit 3 markierten Regeln, die groesste "Genitiv" mit 11. Eine Kategorie mit
   nur einer Regel ist kein Reiter mehr, sondern ein Umweg. */
try {
  const themen = (typeof SATZ_THEMEN !== 'undefined' ? SATZ_THEMEN : []).filter(x => x.muster);
  const markiert = new Set();
  Object.values(SENTENCE_TAGS || {}).forEach(l => l.forEach(x => markiert.add(x.ruleId)));
  const duenn = [];
  themen.forEach(t => {
    const n = GRAMMAR_RULES.filter(r => t.muster.test(r.id) && markiert.has(r.id)).length;
    if (n < 2) duenn.push(`${t.name} (${n})`);
  });
  if (duenn.length)
    warn(`${duenn.length} Satzmodus-Kategorie(n) haben weniger als 2 erreichbare Regeln und `
       + `laufen ins Leere: ${duenn.join(', ')} — Muster erweitern oder Kategorie entfernen.`);
  else {
    const zahlen = themen.map(t => GRAMMAR_RULES.filter(r => t.muster.test(r.id) && markiert.has(r.id)).length);
    note(`Satzmodus-Kategorien: alle ${themen.length} besetzt, `
       + `${Math.min(...zahlen)}–${Math.max(...zahlen)} erreichbare Regeln je Kategorie.`);
  }
} catch (e) {
  warn(`Kategoriebesetzung nicht messbar: ${e.message}`);
}

/* ---------- 11. WURZELN ----------
   Eine Wurzelangabe behauptet: diese drei (selten vier) Konsonanten stecken in
   diesem Wort. Beides ist nachpruefbar -- die Form und der Inhalt. Bis zum
   20.08.2026 hat das niemand gemessen; 145 der 171 Woerter tragen eine Wurzel.

   ⛔ DIE SCHADDA VERDOPPELT, SIE LOESCHT NICHT.
   Der erste Lauf meldete acht Woerter als falsch -- qitt, harr, 'amm, umm,
   batta, hadd, sitta -- und alle acht sind Verdopplungswurzeln: das doppelte
   Radikal steht als Schadda, nicht als zwei Buchstaben. Wer die Schadda mit den
   uebrigen Zeichen wegwirft, macht aus q-t-t ein q-t und findet die Wurzel
   nicht mehr. Ein Fehler des Werkzeugs, kein Fehler der Daten.

   ⚠️ Schwache Wurzeln: bei Waw/Ya/Alif verschwindet ein Radikal im Wort
   (q-w-l -> qala). Deshalb ein zweiter Anlauf ohne die schwachen Radikale --
   und beides wird GETRENNT gezaehlt, damit die Lockerung sichtbar bleibt. */
try {
  const nfcW = x => String(x).normalize('NFC');
  const buchst = x => nfcW(x)
    .replace(/([ء-ي])[ً-ِ]*ّ/g, '$1$1')
    .replace(/[ً-ٰٓـۖ-ۭ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[^ء-ي]/g, '');
  const SCHWACH = new Set(['و', 'ي', 'ا']);
  const drin = (wort, rad) => {
    let i = 0;
    for (const r of rad){ const p = wort.indexOf(r, i); if (p < 0) return false; i = p + 1; }
    return true;
  };
  /* ⛔ Zwei echte Sonderfaelle des Arabischen, namentlich und mit Grund --
     nicht stumm gefiltert. Beide Wurzelangaben sind RICHTIG, das Wort zeigt sie
     nur nicht mehr:
       45802  ماء (Wasser)  m-w-h   das Ha ist verschwunden (ma' < mawah)
       45853  فم  (Mund)    f-m     zweiradikalig, urspruenglich f-w-h */
  const WURZEL_SONDERFALL = new Set(['45802', '45853']);
  let wOk = 0, wStreng = 0, wSchwach = 0, wSonder = 0;
  const wBefunde = [];
  for (const w of VOCAB_DATA){
    if (!w.root) continue;
    if (WURZEL_SONDERFALL.has(String(w.id))){ wSonder++; continue; }
    const rad = nfcW(w.root).split(/\s+/).filter(Boolean).map(buchst);
    if (rad.length < 3 || rad.length > 4 || rad.some(r => r.length !== 1)){
      wBefunde.push(`${w.ar} (${w.de}): Wurzel "${w.root}" hat nicht drei oder vier Buchstaben`);
      continue;
    }
    const wort = buchst(w.ar);
    if (drin(wort, rad)){ wOk++; wStreng++; continue; }
    const fest = rad.filter(r => !SCHWACH.has(r));
    if (fest.length && drin(wort, fest)){ wOk++; wSchwach++; continue; }
    wBefunde.push(`${w.ar} (${w.de}): die Wurzel ${w.root} steckt nicht im Wort`);
  }
  if (wBefunde.length)
    warn(`${wBefunde.length} Wurzelangabe(n) gehen nicht auf: ${wBefunde.slice(0,4).join(' | ')}${wBefunde.length>4?' …':''}`);
  else
    note(`Wurzeln: ${wOk} gehen auf (${wStreng} streng, ${wSchwach} erst ohne die schwachen Radikale), ${wSonder} benannte Sonderfaelle`);
} catch (e){
  warn(`Wurzeln nicht messbar: ${e.message}`);
}

/* ---------- 12. QURAN-FUNDSTELLEN ----------
   QURAN_FREQ[wurzel] = [anzahl, [[sure,vers], …]] -- die App zeigt daraus
   „dieses Wort kommt N-mal im Koran vor" und listet Fundstellen. Der Abschnitt
   oben zaehlt sie nur; ob es die genannten Verse ueberhaupt GIBT, hat bis zum
   20.08.2026 niemand geprueft.

   ⛔ Was hier NICHT geprueft wird: ob die Wurzel im genannten Vers wirklich
   steckt. Dafuer braeuchte es eine morphologische Analyse -- die Buchstaben
   stehen im Wort oft nicht nebeneinander. Ein Skelettvergleich erzeugte
   massenhaft Fehltreffer und damit eine Liste, die niemand liest.
   Gemessen wird deshalb nur, was sich sicher messen laesst:
     1. gibt es jede Fundstelle?
     2. ist die Zahl mindestens so gross wie die Liste? (Sie ist gekappt --
        bei أبد stehen 10 Stellen bei 28 Vorkommen.)

   ⚠️ Laedt quran-text.js (2,3 MB). Gemessen: 0,12 s, gegen 2,1 s Gesamtlauf. */
try {
  const qtPfad = path.join(DIR, 'quran-text.js');
  if (!fs.existsSync(qtPfad)) {
    warn('quran-text.js fehlt — Fundstellen der Quranhaeufigkeit ungeprueft.');
  } else {
    const { QURAN_TEXT } = (new Function(fs.readFileSync(qtPfad, 'utf8')
      + ';return {QURAN_TEXT};'))();
    const versDa = (s, v) => {
      const a = QURAN_TEXT[s];
      return !!(a && a[v - 1]);
    };
    /* Eichung an drei bekannten Stellen -- schlaegt sie fehl, wird gar nicht
       gemessen. QURAN_TEXT ist Sure 1-basiert, Vers 0-basiert. */
    const eichOk = versDa(1, 1) && versDa(112, 1) && versDa(2, 255);
    if (!eichOk) {
      warn('QURAN_TEXT liest sich nicht wie erwartet — Fundstellen ungeprueft.');
    } else {
      let fStellen = 0, fFehlt = 0, fZuKlein = 0;
      const fBefunde = [];
      for (const [wurzel, wert] of Object.entries(QURAN_FREQ || {})) {
        const [anzahl, liste] = Array.isArray(wert) ? wert : [wert, []];
        if (!Array.isArray(liste)) continue;
        if (typeof anzahl === 'number' && liste.length > anzahl) {
          fZuKlein++;
          fBefunde.push(`${wurzel}: Zahl ${anzahl}, aber ${liste.length} Fundstellen gelistet`);
        }
        for (const [s, v] of liste) {
          fStellen++;
          if (!versDa(s, v)) {
            fFehlt++;
            if (fBefunde.length < 5) fBefunde.push(`${wurzel}: ${s}:${v} gibt es nicht`);
          }
        }
      }
      if (fBefunde.length)
        warn(`Quranhaeufigkeit: ${fFehlt} Fundstelle(n) gibt es nicht, ${fZuKlein} Zahl(en) kleiner als die Liste — ${fBefunde.slice(0,4).join(' | ')}`);
      else
        note(`Quranhaeufigkeit: alle ${fStellen} Fundstellen existieren, keine Zahl kleiner als ihre Liste.`);
    }
  }
} catch (e) {
  warn(`Quran-Fundstellen nicht messbar: ${e.message}`);
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
/* ⛔ Die Zahl der Pruefungen gehoert in die Schlusszeile. Bis zum 21.08.2026
   stand dort nur „Alles sauber (3 Hinweise)" — waere `info` leer gewesen,
   haette derselbe Satz dagestanden. Eine Zahl, die man mit dem erwarteten
   Umfang vergleichen kann, ist die billigste Eichung, die es gibt.
   [[leere_liste_ist_keine_messung]] */
const geprueft = info.length + warnings.length;
console.log(`\nAlles sauber: ${geprueft} Pruefungen gelaufen`
  + (warnings.length ? `, ${warnings.length} Hinweis${warnings.length===1?'':'e'}` : '')
  + ' — Push ist in Ordnung.');
/* Eine Gesamtpruefung, die NICHTS geprueft hat, ist kein Erfolg. */
if (!geprueft) console.log('⛔ …aber es waren NULL — hier wurde nichts geprueft.');
process.exit(0);
