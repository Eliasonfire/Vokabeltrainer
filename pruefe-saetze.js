/* pruefe-saetze.js -- die Beispielsaetze mechanisch auf Kasusendungen pruefen
 *
 * Aufruf:  node pruefe-saetze.js            (nur die Befunde)
 *          node pruefe-saetze.js --alle     (jeden Satz mit voller Analyse)
 *
 * Anlass (28.07.2026): Beim Abzug der vollen arabicroots-Datenbank kam heraus,
 * dass die Datenbank ueberhaupt keine Beispielsaetze fuehrt - weder sentAr noch
 * Quranverse. Die 149 Saetze in vocab-data.js stammen also nicht von
 * arabicroots und auch nicht aus dem Unterricht, sondern sind in einer
 * frueheren Sitzung verfasst worden. Elias fuehrt "grammatikalisch korrekte
 * Beispielsaetze" im Ziel-Prompt ausdruecklich als offenen Wunsch.
 *
 * Dieses Skript prueft, was sich am Schriftbild pruefen laesst: traegt jedes
 * Wort die Endung, die seine Rolle im Satz verlangt? Die Rollenanalyse steht
 * in js/irab.js und wird von der App und von hier gemeinsam benutzt, damit es
 * nicht zwei auseinanderlaufende Fassungen gibt.
 *
 * Was das Skript NICHT kann und auch nicht behauptet: entscheiden, ob ein Satz
 * inhaltlich sinnvoll ist, ob die Wortwahl zum Kapitel passt, oder ob ein
 * Muttersprachler ihn so sagen wuerde. Es findet Kasusfehler, mehr nicht.
 * Die Saetze aus dem Lehrwerk (lehrbuch-saetze.js) laufen zur Kontrolle mit:
 * die stammen aus dem Buch und muessen sauber durchgehen - tun sie es nicht,
 * ist der Pruefer zu streng und nicht das Buch falsch. */
const fs = require('fs');
const path = require('path');
const { analysiereSatz, setzeLexikon, endungUnsichtbar,
        istJarrLamVoll, giltAlsVerb, rolleAnzeige } = require('./js/irab.js');

const P = __dirname + path.sep;
const { VOCAB_DATA } =
  (new Function(fs.readFileSync(P + 'vocab-data.js', 'utf8') + ';return {VOCAB_DATA};'))();
const { LEHRBUCH_SAETZE } =
  (new Function(fs.readFileSync(P + 'lehrbuch-saetze.js', 'utf8') + ';return {LEHRBUCH_SAETZE};'))();

/* ⛔ data/beispielsaetze.js MUSS hier mitgelesen werden.
   Am 19.08.2026 sind fuenf verfasste Saetze in die App gelangt, ohne dass
   diese Pruefung sie je gesehen haette: sie las nur vocab-data.js und
   lehrbuch-saetze.js. Die App liest aber drei Quellen — die dritte wird in
   js/buecher.js per saetzeNachtragen() an die Woerter gehaengt.

   Das ist [[pruefwerkzeug_laedt_mehr_als_die_app]] mit umgekehrtem Vorzeichen:
   die Pruefung sah WENIGER als die App und meldete trotzdem gruen. Und es
   waere kein Einzelfall geblieben — die Wartungsroutine schreibt kuenftig
   genau in diese Datei.

   ⚠️ Optional geladen: data/ ist per .gitignore lokal. Auf einem frisch
   geklonten Stand fehlt die Datei, dann bleibt die Quelle leer. */
let BEISPIELSAETZE = {};
try {
  const d = P + 'data' + path.sep + 'beispielsaetze.js';
  if (fs.existsSync(d))
    ({ BEISPIELSAETZE } = (new Function(fs.readFileSync(d, 'utf8') + ';return {BEISPIELSAETZE};'))());
} catch (e) { console.log('  data/beispielsaetze.js nicht lesbar: ' + e.message); }

/* ⛔⛔ Und die VIERTE Quelle (19.08.2026): data/fachbegriffe.js.
   Die fuenf Besitzendungen sind Karteikarten mit eigenem `sentAr`. js/kern.js
   schiebt sie in VOCAB_DATA, js/saetze.js liest `VOCAB_DATA.filter(w =>
   w.sentAr)` — in der App sind das echte Satzmodus-Saetze. Eine Pruefung, die
   sie nicht kennt, sieht wieder WENIGER als die App und meldet trotzdem
   gruen. [[pruefwerkzeug_laedt_mehr_als_die_app]] */
let FACHBEGRIFF_VOKABELN = [];
try {
  const d = P + 'data' + path.sep + 'fachbegriffe.js';
  if (fs.existsSync(d))
    ({ FACHBEGRIFF_VOKABELN } = (new Function(fs.readFileSync(d, 'utf8') + ';return {FACHBEGRIFF_VOKABELN};'))());
} catch (e) { console.log('  data/fachbegriffe.js nicht lesbar: ' + e.message); }
for (const v of FACHBEGRIFF_VOKABELN)
  if (v && v.sentAr && !BEISPIELSAETZE[v.id])
    BEISPIELSAETZE[v.id] = { sentAr: v.sentAr, sentDe: v.sentDe || '' };

const ALLE = process.argv.includes('--alle');

/* Wortarten aus dem vollen Datenabzug nachladen - erst damit kann die Analyse
   Verben von Nomen und Adjektive von Praedikaten unterscheiden. */
const fenster = {};
/* data/ ist per .gitignore lokal (der Vokabelabzug aus Elias' arabicroots-
   Zugang). Auf einem frisch geklonten Stand gibt es den Ordner nicht - dann
   laeuft die Pruefung ohne Wortarten weiter, statt mit einem Absturz zu
   enden. Ohne Lexikon kann die Analyse Verben nicht von Nomen trennen und
   meldet an den Stellen "unklar" statt zu raten; das ist der richtige
   Rueckfall. */
const datenOrdner = P + 'data';
if (fs.existsSync(datenOrdner)){
  for (const f of fs.readdirSync(datenOrdner)){
    if (!f.startsWith('vokabeln-')) continue;
    (new Function('window', fs.readFileSync(datenOrdner + path.sep + f, 'utf8')))(fenster);
  }
}
const wortschatz = Object.values(fenster.VOKABELN || {}).flat();

/* ⛔⛔ UND SEINE SELBST ANGELEGTEN WOERTER — sonst sieht diese Pruefung
   WENIGER als die App und meldet Fehler, die es nicht gibt.

   In der App laeuft setzeLexikon(VOCAB_DATA) (js/saetze.js:623, js/uebung.js:526),
   und VOCAB_DATA enthaelt die Woerter aus vt_personalVocab — js/kern.js:245
   schiebt sie hinein. Hier standen bis zum 20.08.2026 nur die Buchdateien.

   ⭐ Gemessen an einem echten Fehlalarm: der Satz «الْكِتَابُ لَكَ.» wurde als
   VERB gelesen, sobald bayna-yadayk-3 geladen war. Dort steht لَاكَ „kauen"
   mit dem Imperativ لُكْ — und ohne Vokalzeichen ist لُكْ von لَكَ nicht zu
   unterscheiden. Die App kennt لَكَ als genauen Lexikoneintrag und liest
   richtig; nur dieses Skript kannte es nicht.
   [[werkzeug_misst_kleineren_bestand]] [[skelettvergleich_wirft_information_weg]]

   ⚠️ Faellt die Datei aus, wird das GESAGT. Ein stiller Ausfall saehe genauso
   aus wie ein gruener Lauf. [[ausfall_ist_unsichtbar_gebaut]] */
try {
  const d = JSON.parse(fs.readFileSync(P + 'data' + path.sep + 'eigene-woerter.json', 'utf8'));
  const liste = Array.isArray(d.woerter) ? d.woerter : [];
  wortschatz.push(...liste);
  /* ⛔ UND in VOCAB_DATA — genau das tut js/kern.js:245 in der App.
     Der Lexikon-Vergleich weiter unten baut jeden Buchstand aus VOCAB_DATA
     auf; steckten die 14 nur im `wortschatz`, waere der erste Ladevorgang
     richtig und JEDER Vergleichsstand weiterhin blind. Ein halber Fix ist
     hier schlimmer als keiner, weil die Ausgabe gruen aussieht.
     [[zweiter_aufruf_ueberschreibt_still]] */
  const schon = new Set(VOCAB_DATA.map(w => String(w.id)));
  VOCAB_DATA.push(...liste.filter(w => !schon.has(String(w.id))));
  liste.forEach(v => {
    if (v && v.sentAr && !BEISPIELSAETZE[v.id])
      BEISPIELSAETZE[v.id] = { sentAr: v.sentAr, sentDe: v.sentDe || '' };
  });
  if (liste.length) console.log(`  ${liste.length} selbst angelegte Woerter mitgeladen (data/eigene-woerter.json).`);
} catch (e) {
  console.log('  ⚠️ data/eigene-woerter.json fehlt — seine selbst angelegten Woerter');
  console.log('     sind der Analyse UNBEKANNT. Sie entsteht bei');
  console.log('     node werkzeuge/vorrat.mjs --stand <datei> --app auto');
}

setzeLexikon(wortschatz);
console.log(wortschatz.length
  ? `Wortarten aus ${wortschatz.length} Vokabeln geladen.`
  : 'Kein Vokabelabzug unter data/ - Analyse laeuft ohne Wortarten (Verben und Adjektive werden dann nicht erkannt).');

/* Ein paar von Elias' eigenen Eintraegen sind keine arabischen Saetze, sondern
   Erklaerungen ueber die Sprache: «فِي الْبَيْتِ»: «الْبَيْتِ» اسْمٌ مَجْرُورٌ.
   Darin steht ein Wort als Zitat, nicht in seiner Satzrolle - eine
   Kasusanalyse waere hier sinnlos. Erkennbar an den arabischen
   Anfuehrungszeichen. */
/* Metasprache: Saetze, die ueber Sprache reden statt etwas zu sagen. Am
   18.08.2026 um den Doppelpunkt erweitert. Nachgemessen: von 208 Beispielsaetzen
   tragen genau 6 einen, und alle 6 sind Aufzaehlungen oder Zitate
   («كِتَابٌ، قَلَمٌ: اِثْنَانِ.»). Kein echter Satz benutzt ihn. Eine
   Kasusanalyse einer Aufzaehlung ist keine Aussage ueber die Daten. */
const istMetasprache = ar => /[«»:]/.test(ar || '') || istAufzaehlung(ar);

/* Reine Aufzaehlungen — «صِفْرٌ، وَاحِدٌ، اِثْنَانِ.» ist die Zahlenreihe, kein
   Satz. Erkennungsmerkmal: fast jedes Wort endet auf ein Komma. Zweiseitig
   geeicht am 18.08.2026 ueber alle 208 Beispielsaetze: erkannt werden genau 7,
   und alle 7 sind Zahlenreihen. Saetze, die ein Komma nur als Satzzeichen
   fuehren — «أَهَذَا كِتَابٌ؟ نَعَمْ، هَذَا كِتَابٌ.» — bleiben drin. */
function istAufzaehlung(ar){
  const w = String(ar || '').trim().split(/\s+/).filter(Boolean);
  if (w.length < 2) return false;
  return w.filter(x => /،$/.test(x)).length >= w.length - 1;
}

const quellen = [
  { name: 'Beispielsaetze aus vocab-data.js (verfasst, nicht belegt)',
    saetze: VOCAB_DATA.filter(v=>v.sentAr && !istMetasprache(v.sentAr))
                      .map(v=>({ id:v.id, ar:v.sentAr, de:v.sentDe })) },
  { name: 'Saetze aus dem Lehrwerk (Kontrollgruppe, muessen sauber sein)',
    saetze: LEHRBUCH_SAETZE.map(s=>({ id:s.id, ar:s.sentAr, de:s.sentDe, seite:s.seite })) },
  { name: 'Beispielsaetze aus data/beispielsaetze.js (verfasst, fuer Buchvokabeln)',
    saetze: Object.entries(BEISPIELSAETZE)
                  .filter(([, s]) => s && s.sentAr && !istMetasprache(s.sentAr))
                  .map(([id, s]) => ({ id, ar: s.sentAr, de: s.sentDe })) }
];

/* ---------- Satzlaenge (Elias' Punkt 16 vom 04.08.2026) ----------
 *
 * "Die Beispiel Saetze sollen relativ kurz gehalten sein."
 *
 * "Kurz" braucht einen Massstab, und der wird hier NICHT erfunden: die
 * Kontrollgruppe aus dem Lehrwerk liefert ihn. Das sind belegte Saetze aus dem
 * Buch, mit dem Elias lernt - laenger als die duerfen die verfassten nicht
 * sein, kuerzer gern.
 *
 * Gemessen am 04.08.2026, bevor irgendetwas geaendert wurde:
 *
 *   verfasst    155 Saetze   Median 4   Mittel 3,7   max 6
 *   Lehrbuch     27 Saetze   Median 5   Mittel 4,9   max 8
 *
 * Die verfassten Saetze waren also bereits KUERZER als die des Lehrwerks, in
 * jedem Kennwert. Kein einziger lag ueber dem laengsten Buchsatz. Deshalb wurde
 * kein Satz umgeschrieben - es gab nichts zu kuerzen, und Elias hatte die 155
 * Saetze am 29.07.2026 bewusst behalten. Was fehlte, war die Zusicherung, dass
 * es so bleibt. Genau die steht jetzt hier.
 *
 * Die Regelerklaerungen in Metasprache («…») zaehlen nicht mit: sie erklaeren
 * eine Regel und duerfen dafuer laenger sein. */
function wortzahl(satz){ return String(satz || '').trim().split(/\s+/).filter(Boolean).length; }
function kennwerte(saetze){
  const n = saetze.map(wortzahl).sort((a, b) => a - b);
  if (!n.length) return null;
  return { anzahl:n.length, min:n[0], median:n[Math.floor(n.length/2)],
           mittel:(n.reduce((a,b)=>a+b,0)/n.length), max:n[n.length-1] };
}

console.log('\n=== Satzlaenge (Woerter) ===');
const eigeneSaetze = VOCAB_DATA.filter(v=>v.sentAr && !istMetasprache(v.sentAr)).map(v=>v.sentAr);
const buchSaetze   = LEHRBUCH_SAETZE.map(s=>s.sentAr);
const kEigen = kennwerte(eigeneSaetze), kBuch = kennwerte(buchSaetze);
const zeile = (name, k) => console.log(
  `  ${name.padEnd(34)} n=${String(k.anzahl).padStart(4)}   Median ${k.median}   ` +
  `Mittel ${k.mittel.toFixed(1)}   max ${k.max}`);
zeile('verfasst (vocab-data.js)', kEigen);
zeile('Lehrwerk (belegt, Massstab)', kBuch);

const zuLang = VOCAB_DATA.filter(v =>
  v.sentAr && !istMetasprache(v.sentAr) && wortzahl(v.sentAr) > kBuch.max);
if (zuLang.length){
  console.log(`\n  ⚠ ${zuLang.length} verfasste(r) Satz/Saetze laenger als der laengste Buchsatz (${kBuch.max} Woerter):`);
  zuLang.forEach(v => console.log(`     ${v.id}  ${wortzahl(v.sentAr)} Woerter  ${v.sentAr}`));
  console.log('  Kuerzen - oder begruenden, warum dieser Satz laenger sein muss.');
} else {
  console.log(`\n  ok  Kein verfasster Satz laenger als der laengste Buchsatz (${kBuch.max} Woerter).`);
}
if (kEigen.median > kBuch.median){
  console.log(`  ⚠ Der Median der verfassten Saetze (${kEigen.median}) liegt ueber dem des Lehrwerks (${kBuch.median}).`);
}

/* ⛔ Ab dem 21.08.2026 werden die Befunde ALLER Quellen zusammengezaehlt.
   Vorher hing der Exitcode nur an der Eichung ganz unten (`if (schief)`):
   ein echter Kasusfehler in einem Beispielsatz wurde gemeldet und dann
   fallengelassen. Dabei steht dieses Skript im Nachtschicht-Skill als
   Pflichtpruefung neben validate.js.
   [[pruefwerkzeug_mit_eingebauter_antwort]] [[ausfall_ist_unsichtbar_gebaut]] */
let gesamtFehler = 0, gesamtUnklar = 0, gesamtGeprueft = 0;

for (const q of quellen){
  console.log(`\n=== ${q.name} ===`);
  let geprueft = 0, mitFehler = 0, unklar = 0;
  const unsichtbarGesamt = [];
  const befunde = [];

  for (const s of q.saetze){
    const teile = analysiereSatz(s.ar);
    const fehler = teile.filter(t => t.stimmt === false);
    /* „keine Endung zu lesen" hat zwei ganz verschiedene Gruende. Bis zum
       18.08.2026 standen beide in einer Zahl, und die klang wie ein Mangel. */
    const ohneEndung = teile.filter(t => t.erwartet && !t.gelesen);
    const offen      = ohneEndung.filter(t => !endungUnsichtbar(t.wort));
    const unsichtbar = ohneEndung.filter(t => endungUnsichtbar(t.wort));
    if (unsichtbar.length) unsichtbarGesamt.push(...unsichtbar.map(t => t.wort + '  — ' + endungUnsichtbar(t.wort)));
    geprueft++;
    if (offen.length) unklar++;
    if (fehler.length){
      mitFehler++;
      befunde.push({ s, fehler, teile });
    }
    if (ALLE){
      console.log(`\n${s.id}  ${s.ar}`);
      teile.forEach(t => console.log(
        `   ${t.wort.padEnd(16)} ${String(t.rolle).padEnd(30)} ` +
        `erwartet ${t.erwartet || '-'}  gelesen ${t.gelesen ? t.gelesen.zeichen : '-'}` +
        `${t.stimmt === false ? '   <-- passt nicht' : ''}`));
    }
  }

  console.log(`${geprueft} Saetze geprueft, ${mitFehler} mit mindestens einer unpassenden Endung, ` +
              `${unklar} mit einem Wort, dessen Kasusendung fehlt, obwohl sie sichtbar sein muesste.`);
  gesamtGeprueft += geprueft; gesamtFehler += mitFehler; gesamtUnklar += unklar;
  if (unsichtbarGesamt.length){
    const einmalig = [...new Set(unsichtbarGesamt)];
    console.log(`  dazu ${unsichtbarGesamt.length} Wort/Woerter, deren Endung nach arabischer Regel ` +
                `gar nicht sichtbar ist — KEIN Mangel:`);
    einmalig.forEach(x => console.log('     ' + x));
  }
  if (!wortschatz.length && mitFehler){
    console.log('ACHTUNG: ohne Wortarten sind diese Befunde nicht belastbar - ein Verb am');
    console.log('Satzanfang wird dann als Nomen gelesen. Erst `node werkzeuge/hole-vokabeln.mjs`');
    console.log('laufen lassen, dann noch einmal pruefen.');
  }

  if (!ALLE && befunde.length){
    console.log('');
    befunde.forEach(b=>{
      const wo = b.s.seite ? ` (Buch S. ${b.s.seite})` : '';
      console.log(`  ${b.s.id}${wo}  ${b.s.ar}`);
      console.log(`     ${b.s.de || ''}`);
      b.fehler.forEach(f => console.log(
        `     ${f.wort}  ist ${f.rolle}, das verlangt ${f.erwartet}, ` +
        `geschrieben steht aber ${f.gelesen.zeichen}`));
      console.log('');
    });
  }
}

/* ===================== Lexikon-Vergleich =====================
   ⛔ Der Befund vom 18.08.2026: dieses Werkzeug laedt data/vokabeln-*.js
   VOLLSTAENDIG (4433 Eintraege, 1606 Verben). Die App laedt nur, was Elias
   freigeschaltet hat — im Browser gemessen 321 Eintraege mit 5 Verben. Die
   Zerlegung haengt daran, und 9 der 208 Saetze kamen dadurch verschieden
   heraus. Jedes "0 Fehler" oben galt fuer einen Zustand, den es bei ihm nicht
   gibt.

   Deshalb laeuft hier zum Schluss beides gegeneinander. Das kleine Lexikon ist
   vocab-data.js allein — der unguenstigste Fall, also die richtige Untergrenze
   ([[milder-bezugspunkt-verdeckt-mangel]]). */
/* ⛔⛔ 17.09.2026: NUR BUCHAUSWAHLEN, IN DENEN DER SATZ BEI IHM ERSCHEINT.

   Bis heute verglich dieser Abschnitt „vocab-data.js + EIN Buch" gegen
   „vocab-data.js allein" und zeigte je Stand sechs Saetze, dann „… und 11
   weitere". Zwei Fehler steckten darin, beide am selben Abend gemessen:
     1. Ein Satz zu einer Buchvokabel erscheint in der App NUR, wenn sein Buch
        geladen ist (js/buecher.js, saetzeNachtragen). Sechzehn Verbsaetze aus
        Bayna Yadayk 1 standen deshalb seit Wochen als „anders" da — verglichen
        mit einem Stand OHNE ihr Buch, den es fuer sie gar nicht gibt. Darunter,
        im abgeschnittenen Rest, der eine echte Fehler: الْعَمَلِ als Verb in
        SEINEM Stand (madina-1 + bayna-yadayk-1). Weil die Liste als „bekannt"
        galt, las niemand nach.
     2. Den Stand „eigenes Buch + ein weiteres" prueften wir nie. Meine
        Korrektur fuer جَدُّ (46004) beruhte am selben Abend genau auf dem
        Scheinstand „vocab-data + madina-2" und war unnoetig: in JEDEM Stand
        mit bayna-yadayk-1 las der Erklaerer es richtig.
   Jetzt: je Satz seine Heimat — ein Buch, oder „immer" (vocab-data.js, seine
   eigenen Woerter, Fachbegriffe, Lehrbuch, laengere Saetze). Verglichen wird
   die Heimat gegen „Heimat + je ein weiteres Buch", jede Abweichung ganz.
   ⛔ SCHWER und damit rot: ein Wort wechselt zwischen فِعْل und Nicht-Verb, oder
   ein Kasusbefund kommt oder geht — dann lehrt die App je nach Buchhaken
   etwas anderes, und eines davon ist falsch.
   Leicht (nur angezeigt): eine Rolle wird mit mehr Wissen genauer, z. B.
   „Anschluss mit وَ" → خَبَر.
   ⚠️ Das Lexikon enthaelt die Fachbegriffe: js/kern.js schiebt sie in der App
   in VOCAB_DATA, der alte Vergleich kannte sie nicht.
   [[app_auswahl_entscheidet]] · [[fehler_trifft_mehr_als_gemeldet]] */
console.log(String.fromCharCode(10) + '=== LEXIKON-VERGLEICH: sieht Elias in jeder Buchauswahl dieselbe Zerlegung? ===');
let lexikonSchwer = 0;
{
  const BUECHER = Object.keys(fenster.VOKABELN || {});
  const buchVon = new Map();
  for (const b of BUECHER) for (const w of fenster.VOKABELN[b])
    if (!buchVon.has(String(w.id))) buchVon.set(String(w.id), b);
  const immerIds = new Set(VOCAB_DATA.map(w => String(w.id)));
  for (const w of FACHBEGRIFF_VOKABELN) if (w) immerIds.add(String(w.id));
  /* quellen[0] vocab-data.js und quellen[1] Lehrbuch sind immer da; in
     quellen[2] (data/beispielsaetze.js) haengt es an der Id. */
  const alleSaetze = [];
  quellen.forEach((q, qi) => q.saetze.forEach(s => {
    const id = String(s.id);
    const heimat = (qi < 2 || immerIds.has(id) || id.startsWith('satz-lang-')) ? null : (buchVon.get(id) || 'verwaist');
    alleSaetze.push(Object.assign({}, s, { heimat }));
  }));
  const lexikonFuer = buecher => {
    const lex = VOCAB_DATA.slice();
    const ids = new Set(lex.map(w => String(w.id)));
    const dazu = w => { if (w && !ids.has(String(w.id))){ ids.add(String(w.id)); lex.push(w); } };
    FACHBEGRIFF_VOKABELN.forEach(dazu);
    for (const b of buecher) (fenster.VOKABELN[b] || []).forEach(dazu);
    return lex;
  };
  /* فِعْل als Zeichenfolge aus Codepoints — nie sichtbar kopiert, siehe js/irab.js */
  const VERB = String.fromCharCode(0x0641, 0x0650, 0x0639, 0x0652, 0x0644);
  const befunde = [];
  let vergleiche = 0;
  for (const heimat of [null].concat(BUECHER)){
    const gruppe = alleSaetze.filter(s => s.heimat === heimat);
    if (!gruppe.length) continue;
    const eigen = heimat ? [heimat] : [];
    setzeLexikon(lexikonFuer(eigen));
    const grund = gruppe.map(s => analysiereSatz(s.ar));
    for (const weiteres of BUECHER){
      if (weiteres === heimat) continue;
      setzeLexikon(lexikonFuer(eigen.concat(weiteres)));
      gruppe.forEach((s, i) => {
        vergleiche++;
        const r = analysiereSatz(s.ar);
        const d = grund[i].map((t, k) => [t, r[k]]).filter(([a, b]) => b && a.rolle !== b.rolle);
        if (!d.length) return;
        const schwer = d.some(([a, b]) => (a.rolle === VERB) !== (b.rolle === VERB)
                                        || (a.stimmt === false) !== (b.stimmt === false));
        befunde.push({ s, weiteres, d, schwer });
      });
    }
  }
  lexikonSchwer = befunde.filter(b => b.schwer).length;
  const verwaist = alleSaetze.filter(s => s.heimat === 'verwaist');
  console.log(`  ${alleSaetze.length} Saetze (${alleSaetze.filter(s => !s.heimat).length} immer sichtbar, `
    + `${alleSaetze.length - alleSaetze.filter(s => !s.heimat).length - verwaist.length} an ihr Buch gebunden), `
    + `${vergleiche} Vergleiche → ${befunde.length} Abweichung(en), davon ${lexikonSchwer} schwer.`);
  for (const b of befunde){
    console.log(`  ${b.schwer ? '⛔' : '· '} ${b.s.id}  [${b.s.heimat || 'immer'} + ${b.weiteres}]  ${b.s.ar}`);
    for (const [a, c] of b.d)
      console.log('        ' + a.wort.padEnd(14) + 'ohne: ' + String(a.rolle).padEnd(30) + (a.stimmt === false ? '✘ ' : '  ')
        + '| mit ' + b.weiteres + ': ' + c.rolle + (c.stimmt === false ? ' ✘' : ''));
  }
  if (verwaist.length)
    console.log('  ⚠ ' + verwaist.length + ' Satz/Saetze zu einer Id, die in keinem Buch steht — sie erscheinen nie: '
      + verwaist.map(s => s.id).join(', '));
  if (!befunde.length)
    console.log('  ok  Jeder Satz wird in jeder Buchauswahl, in der er erscheint, gleich zerlegt.');
  else if (!lexikonSchwer)
    console.log('  ok  Keine schwere Abweichung — die obigen werden mit mehr Buechern nur genauer.');
  /* Das Lexikon so zuruecklassen, wie der Rest der Datei es erwartet. */
  setzeLexikon(wortschatz);
}

/* ==========================================================================
   EICHUNG: taugen die beiden Handlisten in js/irab.js noch?

   ⛔ JARR_LAM_VOLL und VERBEN entscheiden ueber die Zerlegung und werden von
   Hand gepflegt. Faellt eine Zeile heraus oder verrutscht ein Zeichen,
   meldet niemand etwas — die Saetze werden nur wieder falsch gelesen. Am
   21.08.2026 stand فَضَلَ nicht in VERBEN, und الْمَالَ galt daraufhin als
   نَعْت statt als مَفْعُول بِهِ.

   ⭐ Geprueft wird die ECHTE, geladene Funktion aus js/irab.js, nicht eine
   nachgebaute Kopie — sonst eicht sich der Test an sich selbst.
   Jeder Fall traegt seine Begruendung; die NEIN-Faelle sind die wichtigen.
   ========================================================================== */
{
  const EICH_JARR = [
    ['\u0644\u064E\u0643\u064E.', true,  'lakа mit Punkt — der am 21.08. gemeldete Fall'],
    ['\u0644\u064E\u0643\u0650',  true,  'laki, weiblich'],
    ['\u0648\u0644\u064E\u0647\u064F', true, 'wa-lahu — das Anschluss-Waw wird abgeschnitten'],
    ['\u0628\u0650\u0643\u064E',  true,  'bika — das angeschriebene bi zaehlt mit'],
    ['\u0644\u064E\u0647\u064E\u0627', false, 'laha — madina-3 fuehrt es als VERB, gleiche Vokalisierung'],
    ['\u0644\u064E\u0643\u0650\u0646\u0651\u064E', false, 'lakinna (aber) — Schwester von inna, kein jarr'],
    ['\u0644\u0643', false, 'ohne Harakat — der Skelettvergleich darf NICHT greifen'],
    ['\u0627\u0644\u0652\u0643\u0650\u062A\u064E\u0627\u0628\u064F', false, 'ein gewoehnliches Nomen']
  ];
  const EICH_VERB = [
    ['\u062F\u064E\u0623\u064E\u0628\u064E', true,  'daaba — madina-1 K24, am 21.08. nachgetragen'],
    ['\u0641\u064E\u0636\u064E\u0644\u064E', true,  'fadala — dito'],
    ['\u0627\u0650\u0633\u062A\u064E\u0630\u0652\u0643\u064E\u0631\u064E', true, 'istadhkara — Form X'],
    ['\u0641\u064E\u0636\u0652\u0644\u064C', false, 'fadlun (Gunst) — Tanwin, also nie ein Verb'],
    ['\u062F\u064E\u0623\u0652\u0628\u064C', false, 'dabun (Gewohnheit) — dito'],
    ['\u0627\u0644\u0652\u0643\u0650\u062A\u064E\u0627\u0628\u064F', false, 'ein gewoehnliches Nomen']
  ];

  let schief = 0;
  const eiche = (liste, fn, name) => {
    const falsch = liste.filter(([w, soll]) => fn(w) !== soll);
    if (falsch.length){
      schief += falsch.length;
      console.log('  ⛔ ' + name + ': ' + falsch.length + ' von ' + liste.length + ' Eichfaellen falsch.');
      falsch.forEach(([w, soll, warum]) =>
        console.log('     ' + w + '  ist ' + fn(w) + ', soll ' + soll + '  — ' + warum));
    } else {
      console.log('  ok ' + name + ': ' + liste.length + ' von ' + liste.length + ' Eichfaellen richtig.');
    }
  };

  console.log('');
  console.log('=== EICHUNG der Handlisten in js/irab.js ===');
  eiche(EICH_JARR, istJarrLamVoll, 'JARR_LAM_VOLL (لَكَ ist kein خَبَر)');

  /* ⛔⛔ OHNE LEXIKON PRUEFEN — sonst misst dieser Test nichts.
     Erster Anlauf am 21.08.2026: فَضَلَ aus VERBEN entfernt, und die Eichung
     blieb GRUEN. giltAlsVerb fragt zuerst `wortart(w)`, und dieses Skript
     hat 4.447 Vokabeln geladen — darunter فَضَلَ. Die Liste wurde also gar
     nicht befragt. Genau davor soll sie aber schuetzen: sie traegt die
     Faelle, in denen das Lexikon NICHT geladen ist, weil Elias das Buch
     abgewaehlt hat. [[pruefwerkzeug_mit_eingebauter_antwort]]
     [[app_auswahl_entscheidet]] */
  setzeLexikon(null);
  eiche(EICH_VERB, giltAlsVerb,    'VERBEN + traegtTanwin (ohne Lexikon)');
  /* ⛔⛔ DIE REGELN VOM 17.09.2026 — jede mit einem Fall, an dem sie scheitern kann.

     Artikel: MIT einem Mini-Lexikon, in dem das Verb steht. Ohne Lexikon waere
     al-amali auch ohne die Regel kein Verb, und der Test maesse nichts — die
     Falle vom 21.08. oben, nur andersherum. Deshalb die Gegenprobe amila: sie
     zeigt, dass das Mini-Lexikon ueberhaupt wirkt.
     Saetze: geprueft wird nur ASCII (erwartet/stimmt), keine arabischen
     Rollennamen — ein Vergleich mit kopiertem Arabisch kann an der Reihenfolge
     der Zeichen scheitern, ohne dass es jemand sieht.
     [[pruefwerkzeug_mit_eingebauter_antwort]] */
  const mitLexikon = (eintraege, fn) => { setzeLexikon(eintraege); try { return fn(); } finally { setzeLexikon(null); } };
  const EICH_ARTIKEL = [
    /* [Wort, Verb im Mini-Lexikon, soll giltAlsVerb, warum] */
    ['\u0627\u0644\u0652\u0639\u064E\u0645\u064E\u0644\u0650.', '\u0639\u064E\u0645\u0650\u0644\u064E', false, 'al-amali (50466, in SEINEM Stand als Verb gelesen) — Artikel, also nie ein Verb'],
    ['\u0639\u064E\u0645\u0650\u0644\u064E', '\u0639\u064E\u0645\u0650\u0644\u064E', true, 'Gegenprobe: amila selbst bleibt ein Verb — das Mini-Lexikon wirkt'],
    ['\u0648\u064E\u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F', '\u062D\u064E\u0645\u0650\u062F\u064E', false, 'wa-l-hamdu (mb1-63-3, mit madina-3 als Verb gelesen)'],
    ['\u0627\u0650\u0644\u0652\u062A\u064E\u0641\u064E\u062A\u064E', '\u0627\u0650\u0644\u0652\u062A\u064E\u0641\u064E\u062A\u064E', true, 'Form VIII mit al- vorn: Kasra auf dem Alif, kein Artikel'],
    ['\u0627\u0644\u0652\u062A\u064E\u0641\u064E\u062A\u064E', '\u0627\u0650\u0644\u0652\u062A\u064E\u0641\u064E\u062A\u064E', true, 'dasselbe mitten im Satz ohne Kasra: Sonnenbuchstabe ta ohne Schadda, kein Artikel']
  ];
  eiche(EICH_ARTIKEL.map(([w, , soll, warum]) => [w, soll, warum]),
        w => { const e = EICH_ARTIKEL.find(x => x[0] === w); return mitLexikon([{ ar: e[1], type: 'verb' }], () => giltAlsVerb(e[0])); },
        'Artikel ist kein Verb (mit Mini-Lexikon)');
  /* ⛔⛔ DER masdar IST EIN NOMEN (25.09.2026, js/irab.js setzeLexikon).
     Mit madina-3 galt أَفْرَادُ im Lehrbuchsatz by1-85-1 als Verb: madina-3
     führt أَفْرَدَ mit der Grundform إِفْرَاد, und die stand mit der Wortart
     ihres Eintrags im Lexikon. Wieder mit Mini-Lexikon und Gegenprobe (das
     Verb selbst bleibt eines), sonst misst der Fall nichts. Störtest: mit der
     alten irab.js ist der erste Fall `true` (gemessen 25.09.2026). */
  const EICH_MASDAR = [
    /* [Wort, soll giltAlsVerb, warum] — Mini-Lexikon: afrada, masdar ifrad */
    ['أَفْرَادُ', false, 'afradu (by1-85-1, mit madina-3 als Verb gelesen) — Plural von fard, nicht der masdar ifrad'],
    ['أَفْرَدَ', true, 'Gegenprobe: afrada selbst bleibt ein Verb — das Mini-Lexikon wirkt']
  ];
  const MINI_MASDAR = [{ ar: 'أَفْرَدَ', type: 'verb',
                         masdar: 'إِفْرَاد' }];
  eiche(EICH_MASDAR, w => mitLexikon(MINI_MASDAR, () => giltAlsVerb(w)),
        'masdar ist kein Verb (mit Mini-Lexikon)');
  const EICH_SATZ = [
    /* [Satz, Pruefung an analysiereSatz(), warum] */
    ['\u0648\u064E\u0627\u0644\u0650\u062F\u064F \u0627\u0644\u0637\u064E\u0651\u0627\u0644\u0650\u0628\u0650 \u0645\u064F\u0647\u064E\u0646\u0652\u062F\u0650\u0633\u064C.', r => r[1].erwartet === 'jarr' && r[1].stimmt === true,
      'walidu — das wa ist Wurzelbuchstabe, nicht wa + Artikel: at-talibi ist mudaf ilayh'],
    ['\u0622\u0645\u0650\u0646\u064E\u0629\u064F \u0648\u064E\u0641\u064E\u0627\u0637\u0650\u0645\u064E\u0629\u064F \u0641\u0650\u064A \u0627\u0644\u0652\u0628\u064E\u064A\u0652\u062A\u0650.', r => r[1].erwartet !== 'jarr' && r[1].stimmt !== false,
      'Name + wa + Name — keine Idafa, wa-fatimatu ist ein neues Glied'],
    ['\u0643\u0650\u062A\u064E\u0627\u0628\u064F \u0627\u0644\u0637\u064E\u0651\u0627\u0644\u0650\u0628\u064F.', r => r[1].stimmt === false,
      'Gegenprobe: der falsche Nominativ im mudaf ilayh wird WEITER gemeldet (die wa-Regel ist bewusst eng)']
  ];
  eiche(EICH_SATZ.map(([satz, , warum]) => [satz, true, warum]),
        satz => EICH_SATZ.find(e => e[0] === satz)[1](analysiereSatz(satz)),
        'Satzrollen: walid und Name + wa + Name');

  /* ⭐ نَعْت des مُضَاف hinter dem مُضَاف إِلَيْه (17.09.2026, js/irab.js
     mudafFuerNat). Beleg nat-wen-beschreibt-01: „Man muss immer gucken, wer
     beschreibt wen" — die Endung entscheidet. Zwei Gegenproben halten die
     Regel eng: im Genitiv bleibt es نَعْت des مُضَاف إِلَيْه, und ein
     männliches Adjektiv im Nominativ hinter einem weiblichen مُضَاف bleibt ein
     gemeldeter Fehler. Arabisch aus Codepoints. [[zeichenklasse_nie_sichtbar_kopieren]] */
  {
    const z = (...c) => String.fromCharCode(...c);
    const HAQIBATU = z(0x062D,0x064E,0x0642,0x0650,0x064A,0x0628,0x064E,0x0629,0x064F);
    const ATTALIBI = z(0x0627,0x0644,0x0637,0x064E,0x0651,0x0627,0x0644,0x0650,0x0628,0x0650);
    const JAMILATU = z(0x0627,0x0644,0x0652,0x062C,0x064E,0x0645,0x0650,0x064A,0x0644,0x064E,0x0629,0x064F);
    const JAMILATI = z(0x0627,0x0644,0x0652,0x062C,0x064E,0x0645,0x0650,0x064A,0x0644,0x064E,0x0629,0x0650);
    const JADIDU   = z(0x0627,0x0644,0x0652,0x062C,0x064E,0x062F,0x0650,0x064A,0x062F,0x064F);
    const ALA_MAKTABI = z(0x0639,0x064E,0x0644,0x064E,0x0649, 0x20, 0x0627,0x0644,0x0652,0x0645,0x064E,0x0643,0x0652,0x062A,0x064E,0x0628,0x0650);
    const HUWA_IBNU_MUDIRI = z(0x0647,0x064F,0x0648,0x064E, 0x20, 0x0627,0x0650,0x0628,0x0652,0x0646,0x064F, 0x20,
                               0x0627,0x0644,0x0652,0x0645,0x064F,0x062F,0x0650,0x064A,0x0631,0x0650);
    const s = (...w) => w.join(' ') + '.';
    const EICH_NAT = [
      [s(HAQIBATU, ATTALIBI, JAMILATU, ALA_MAKTABI), r => r[2].rolle === 'نَعْت (zum مُضَاف davor)' && r[2].stimmt === true,
        'haqibatu t-talibi l-jamilatu — Nominativ + ة wie der مُضَاف: die schöne Tasche des Studenten'],
      [s(HUWA_IBNU_MUDIRI, JADIDU), r => r[3].erwartet === 'raf' && r[3].stimmt === true,
        'das Beispiel des Lehrers (Folge 14): ibnu l-mudiri l-jadidu — beschreibt den Sohn'],
      [s(HAQIBATU, ATTALIBI, JAMILATI, ALA_MAKTABI), r => r[2].erwartet === 'jarr' && !/zum/.test(r[2].rolle),
        'Gegenprobe: im Genitiv bleibt es نَعْت des مُضَاف إِلَيْه'],
      [s(HAQIBATU, ATTALIBI, JADIDU, ALA_MAKTABI), r => r[2].stimmt === false,
        'Gegenprobe: männlich im Nominativ hinter weiblichem مُضَاف — weiter ein Fehler']
    ];
    eiche(EICH_NAT.map(([satz, , warum]) => [satz, true, warum]),
          satz => EICH_NAT.find(e => e[0] === satz)[1](analysiereSatz(satz)),
          'نَعْت des مُضَاف hinter dem مُضَاف إِلَيْه');
  }
  /* ⛔⛔ وَ ALS WURZELBUCHSTABE MITTEN IM SATZ und يَا VOR EINEM مُضَاف
     (25.09.2026, js/irab.js waGehoertZumWort und der مُنَادَى-Zweig). OHNE
     Lexikon geprüft: die Regel liest die Schrift, nicht den Wortschatz — sonst
     hinge die Zerlegung an seiner Buchauswahl. Zwei Gegenproben halten die
     Regeln eng. Störtest: mit der irab.js von vor dieser Änderung sind die
     Fälle 1, 4 und 5 falsch (gemessen 25.09.2026, scratchpad eich-c-probe.mjs).
     Arabisch aus Codepoints. [[zeichenklasse_nie_sichtbar_kopieren]] */
  {
    const z = (...c) => String.fromCharCode(...c);
    const HADHA      = z(0x0647,0x064E,0x0630,0x064E,0x0627);
    const WALIDUHU   = z(0x0648,0x064E,0x0627,0x0644,0x0650,0x062F,0x064F,0x0647,0x064F);
    const MUDARRISUN = z(0x0645,0x064F,0x062F,0x064E,0x0631,0x0651,0x0650,0x0633,0x064C);
    const WASMUHU    = z(0x0648,0x064E,0x0627,0x0633,0x0652,0x0645,0x064F,0x0647,0x064F);
    const KHALIDUN   = z(0x062E,0x064E,0x0627,0x0644,0x0650,0x062F,0x064C);
    const KHALIDU    = z(0x062E,0x064E,0x0627,0x0644,0x0650,0x062F,0x064F);
    const YA         = z(0x064A,0x064E,0x0627);
    const WALIDI     = z(0x0648,0x064E,0x0627,0x0644,0x0650,0x062F,0x0650,0x064A);
    const ABDA       = z(0x0639,0x064E,0x0628,0x0652,0x062F,0x064E);
    const ALLAHI     = z(0x0627,0x0644,0x0644,0x0651,0x064E,0x0647,0x0650);
    const s = (...w) => w.join(' ') + '.';
    const EICH_WAW = [
      [s(HADHA, WALIDUHU), r => r[1].erwartet === 'raf' && r[1].stimmt === true,
        'hadha waliduhu (BY1 Buchseite 38) — das waw gehoert zum Wort: خَبَر im Nominativ, kein Anschluss'],
      [s(HADHA, MUDARRISUN, WASMUHU, KHALIDUN), r => r[2].erwartet === null,
        'Gegenprobe: wa-smuhu (Sukun nach dem Alif) bleibt Anschluss mit waw, ohne Kasusaussage'],
      [s(YA, KHALIDU), r => r[1].erwartet === 'raf' && r[1].stimmt === true,
        'Gegenprobe: ya khalidu — ya-nida-01 gilt weiter (Damma ohne Tanwin)'],
      [s(YA, WALIDI), r => r[1].erwartet === null,
        'ya walidi (BY1 Buchseite 32) — mit Besitzendung keine Kasusaussage, ya-nida-01 belegt nur den Namen'],
      [s(YA, ABDA, ALLAHI), r => r[1].erwartet === null && r[1].stimmt !== false,
        'ya abda llahi — der angerufene مُضَاف steht nicht auf Damma: kein gemeldeter Fehler mehr']
    ];
    eiche(EICH_WAW.map(([satz, , warum]) => [satz, true, warum]),
          satz => EICH_WAW.find(e => e[0] === satz)[1](analysiereSatz(satz)),
          'waw als Wurzelbuchstabe, ya vor مُضَاف (ohne Lexikon)');
  }
  /* ⛔⛔ FUTUR سَـ, OBJEKT MIT FATHA NACH DEM VERB, NAME VOR ARTIKEL+FATHA,
     يَا NACH DEM VERB (25.09.2026, Zerleger-Befunde (a) und (b) aus den Sätzen
     von Bayna Yadayk 1, Kap. 4). OHNE Lexikon — gebraucht wird nur يَفْعَلُ aus
     VERBEN_MUDARI. Störtest: mit der irab.js von vor diesem Tag sind die Fälle
     1, 3 und 6 falsch; Fall 7 war mit (a), aber ohne !nachNida falsch
     (طَارِقُ als فَاعِل). Gemessen 25.09.2026, scratchpad eich-ab-probe.mjs. */
  {
    const z = (...c) => String.fromCharCode(...c);
    const SATAFALU = z(0x0633,0x064E,0x062A,0x064E,0x0641,0x0652,0x0639,0x064E,0x0644,0x064F);
    const SAYYIDU  = z(0x0633,0x064E,0x064A,0x0651,0x0650,0x062F,0x064F);
    const YAFALU   = z(0x064A,0x064E,0x0641,0x0652,0x0639,0x064E,0x0644,0x064F);
    const ALWAJIBA = z(0x0627,0x0644,0x0652,0x0648,0x064E,0x0627,0x062C,0x0650,0x0628,0x064E);
    const ALWALADU = z(0x0627,0x0644,0x0652,0x0648,0x064E,0x0644,0x064E,0x062F,0x064F);
    const AHMADU   = z(0x0623,0x064E,0x062D,0x0652,0x0645,0x064E,0x062F,0x064F);
    const MADHA    = z(0x0645,0x064E,0x0627,0x0630,0x064E,0x0627);
    const YA       = z(0x064A,0x064E,0x0627);
    const TARIQU   = z(0x0637,0x064E,0x0627,0x0631,0x0650,0x0642,0x064F);
    const KHALIDU  = z(0x062E,0x064E,0x0627,0x0644,0x0650,0x062F,0x064F);
    const s = (...w) => w.join(' ') + '.';
    const EICH_VERBSATZ = [
      ['satafalu (Futur)', () => giltAlsVerb(SATAFALU) === true,
        'sa- vor dem Praesens (BY1 Buchseite 84) — ein Verb, kein مُبْتَدَأ'],
      ['sayyidu', () => giltAlsVerb(SAYYIDU) === false,
        'Gegenprobe: sayyidu faengt mit sa + ya an und bleibt ein Nomen'],
      ['yafalu l-wajiba', () => { const r = analysiereSatz(s(YAFALU, ALWAJIBA)); return r[1].erwartet === 'nasb' && r[1].stimmt === true; },
        'Fatha direkt nach dem Verb: das Objekt, kein فَاعِل (yaghsilu l-malabisa, BY1)'],
      ['yafalu l-waladu l-wajiba', () => { const r = analysiereSatz(s(YAFALU, ALWALADU, ALWAJIBA)); return r[1].erwartet === 'raf' && r[1].stimmt === true && r[2].erwartet === 'nasb' && r[2].stimmt === true; },
        'Gegenprobe: mit Damma bleibt das erste Nomen der فَاعِل'],
      ['yafalu l-wajiba l-waladu', () => { const r = analysiereSatz(s(YAFALU, ALWAJIBA, ALWALADU)); return r[2].erwartet === 'raf' && r[2].stimmt === true; },
        'Objekt vor dem Taeter: das Nomen im Nominativ danach ist der فَاعِل, kein Fehler'],
      ['yafalu ahmadu l-wajiba', () => { const r = analysiereSatz(s(YAFALU, AHMADU, ALWAJIBA)); return r[1].erwartet === 'raf' && r[1].stimmt === true && r[2].erwartet === 'nasb' && r[2].stimmt === true; },
        'Name ohne Tanwin vor Artikel + Fatha ist kein مُضَاف (yusalli ahmadu l-fajra, BY1)'],
      ['madha satafalu ya tariqu', () => { const r = analysiereSatz(MADHA + ' ' + SATAFALU + ' ' + YA + ' ' + TARIQU + '؟'); const v = analysiereSatz(s(YA, KHALIDU)); return r[3].rolle === v[1].rolle && r[3].stimmt === true; },
        'nach Verb + ya: der Angerufene ist مُنَادَى wie in ya khalidu, nicht فَاعِل']
    ];
    eiche(EICH_VERBSATZ.map(([n, , warum]) => [n, true, warum]),
          n => EICH_VERBSATZ.find(e => e[0] === n)[1](),
          'Futur, Objekt nach dem Verb, ya nach dem Verb (ohne Lexikon)');
  }
  /* ⛔ أَيّ NACH PRÄPOSITION, NACH كَمْ, لَدَى (25.09.2026, Zerleger-Befund (e),
     Sätze von Bayna Yadayk 1, Buchseite 58). OHNE Lexikon. Störtest: mit der
     irab.js von vor dieser Änderung sind alle drei falsch (أَيِّ „unveränderlich",
     طَالِبًا مَفْعُول مُطْلَق mit nasb, لَدَيْنَا مُبْتَدَأ). Gemessen 25.09.2026,
     scratchpad eich-e-probe.mjs. Fall 2 ist der Satz seiner Karte gram-frage-kam. */
  {
    const z = (...c) => String.fromCharCode(...c);
    const FI        = z(0x0641,0x0650,0x064A);
    const AYYI      = z(0x0623,0x064E,0x064A,0x0650,0x0651);
    const DAWRIN    = z(0x062F,0x064E,0x0648,0x0652,0x0631,0x064D);
    const KAM       = z(0x0643,0x064E,0x0645,0x0652);
    const TALIBAN   = z(0x0637,0x064E,0x0627,0x0644,0x0650,0x0628,0x064B,0x0627);
    const ALFASLI   = z(0x0627,0x0644,0x0652,0x0641,0x064E,0x0635,0x0652,0x0644,0x0650);
    const LADAYNA   = z(0x0644,0x064E,0x062F,0x064E,0x064A,0x0652,0x0646,0x064E,0x0627);
    const SHAQQATUN = z(0x0634,0x064E,0x0642,0x0651,0x064E,0x0629,0x064C);
    const EICH_E = [
      ['fi ayyi dawrin', () => { const r = analysiereSatz(FI + ' ' + AYYI + ' ' + DAWRIN + '؟'); return r[1].erwartet === 'jarr' && r[1].stimmt === true && r[2].erwartet === 'jarr' && r[2].stimmt === true; },
        'ayy nach fi steht im Genitiv und ist مُضَاف, nicht unveraenderlich'],
      ['kam taliban fi l-fasli', () => { const r = analysiereSatz(KAM + ' ' + TALIBAN + ' ' + FI + ' ' + ALFASLI + '؟'); return r[1].erwartet === null && r[1].stimmt === null; },
        'nach kam keine Rolle und kein Kasus (tamyiz steht in keiner seiner Regeln), nicht مَفْعُول مُطْلَق'],
      ['ladayna shaqqatun', () => { const r = analysiereSatz(LADAYNA + ' ' + SHAQQATUN + '.'); return r[0].erwartet === null && r[1].erwartet === 'raf' && r[1].stimmt === true; },
        'ladayna ist ein ظَرْف wie indana, kein مُبْتَدَأ']
    ];
    eiche(EICH_E.map(([n, , warum]) => [n, true, warum]),
          n => EICH_E.find(e => e[0] === n)[1](),
          'ayy nach Praeposition, nach kam, ladaa (ohne Lexikon)');
  }
  setzeLexikon(wortschatz);

  /* ⭐ rolleAnzeige (17.09.2026): die Rollen im Iʿrāb-Erklärer mit belegter
     Endung. NUR Anzeige — geprüft über ALLE Rollen aus vocab-data.js und dem
     Lehrbuch: (1) das Skelett bleibt gleich, es kommen nur Vokalzeichen dazu;
     (2) nie zweimal dasselbe Zeichen hintereinander (مُضَافٌٌ — so sähe es aus,
     wenn die Wortgrenze fehlt); (3) zweimal angewandt = einmal angewandt;
     (4) überhaupt etwas geändert (sonst prüft 1–3 nichts). */
  {
    const HAR = c => { const n = c.charCodeAt(0); return (n >= 0x064B && n <= 0x0652) || n === 0x0670; };
    const skel = s => [...s].filter(c => !HAR(c)).join('');
    const rollen = new Set();
    VOCAB_DATA.filter(w => w.sentAr).map(w => w.sentAr).concat(buchSaetze)
      .forEach(s => analysiereSatz(s).forEach(t => rollen.add(t.rolle)));
    let kaputt = 0, geaendert = 0;
    for (const r of rollen){
      const a = rolleAnzeige(r);
      if (a !== r) geaendert++;
      const doppelt = [...a].some((c, i) => i > 0 && HAR(c) && c === a[i - 1]);
      if (skel(a) !== skel(r) || doppelt || rolleAnzeige(a) !== a){
        kaputt++;
        console.log('  ⛔ rolleAnzeige: ' + r + ' → ' + a);
      }
    }
    console.log('\n=== Eichung rolleAnzeige: ' + rollen.size + ' Rollen, ' + geaendert + ' mit Endung, ' + kaputt + ' kaputt ===');
    if (kaputt || !geaendert) schief++;
  }
  if (schief) process.exitCode = 1;
}

/* ---------- Schlussurteil ueber ALLE Abschnitte ----------

   ⛔ Bis zum 21.08.2026 endete das Skript mit dem EICHUNGSergebnis
   ("6 von 6 Eichfaellen richtig"). Wer nur das Ende liest — und genau das
   tut werkzeuge/alle-pruefer.mjs —, sah ein Teilergebnis statt des
   Gesamtbildes. [[erfolgsmeldung_ohne_wirkung]]

   ⚠️ ZWEI DINGE ZAEHLEN BEWUSST NICHT MIT:
     - die LEICHTEN Lexikon-Unterschiede: eine Rolle wird mit mehr Buechern
       genauer („Anschluss mit وَ" → خَبَر). Die SCHWEREN zaehlen seit dem
       17.09.2026 mit — ein Wort wechselt zwischen Verb und Nicht-Verb, oder
       ein Kasusbefund kommt oder geht: dann lehrt die App je nach Buchhaken
       etwas anderes. [[app_auswahl_entscheidet]]
     - die unsichtbaren Endungen: die Ausgabe nennt sie ausdruecklich
       "KEIN Mangel" (Yāʾ des Sprechers und Verwandtes). */
const schluss = [];
if (gesamtFehler || gesamtUnklar)
  schluss.push(`⛔ ${gesamtFehler} Satz/Saetze mit unpassender Endung, ${gesamtUnklar} mit fehlender `
    + `Kasusendung (von ${gesamtGeprueft} geprueften). Nicht pushen, bevor das geklaert ist.`);
if (lexikonSchwer)
  schluss.push(`⛔ ${lexikonSchwer} schwere Lexikon-Abweichung(en): je nach Buchauswahl eine andere `
    + 'Zerlegung (Abschnitt LEXIKON-VERGLEICH). Nicht pushen, bevor das geklaert ist.');
if (!schluss.length)
  schluss.push(`✅ Alle ${gesamtGeprueft} geprueften Saetze sind kasusrein und in jeder Buchauswahl gleich zerlegt `
    + '(unsichtbare Endungen und leichte Lexikon-Unterschiede zaehlen bewusst nicht mit).');
console.log(String.fromCharCode(10) + schluss.join(String.fromCharCode(10)));
if (gesamtFehler || gesamtUnklar || lexikonSchwer) process.exitCode = 1;
