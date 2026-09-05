/* pruefe-eselsbruecken.js -- halten die Eselsbruecken Elias' eigene Regeln ein?
 *
 * Aufruf:  node pruefe-eselsbruecken.js
 *
 * WOZU (17.08.2026)
 *
 * Fuer die Merkhaken gelten drei Vorgaben, die Elias selbst gesetzt hat. Alle
 * drei sind leise zu brechen - der Text liest sich weiter gut, nur nuetzt er
 * ihm nichts mehr:
 *
 *   1. ⛔ Koranstellen NUR aus dem Bereich, den er auswendig kann:
 *      Sure 1 · Sure 67 · Sure 93 bis 114.
 *      "wenn du mit quran sachen kommst dann am besten mit den suren die ganz
 *       am ende sind bis sura duha weil ich die bis dahin auswendig kenne oder
 *       sura mulk und fatiha natürlich auch noch."
 *      Ein Vers ausserhalb davon ist selbst neuer Stoff.
 *
 *   2. ⛔ Kurze Zitate. "wichtig ist mir wenn du dich auf den quran beziehst
 *      das du nicht ewig lange verse mir zeigst." Gemessen wird als
 *      Obergrenze: kein zusammenhaengender arabischer Textlauf laenger als
 *      VIER Woerter.
 *
 *   3. Jede Id muss zu einer echten Vokabel gehoeren, und kein Vorschlag darf
 *      den ersten (w.mnemo) wiederholen.
 *
 * ⚠️ KOMMENTARE WERDEN VORHER ABGESTREIFT. Ohne das meldet die Pruefung
 * Fundstellen, die in der Begruendung stehen, warum etwas richtig ist - das ist
 * hier schon viermal passiert und kostet jedes Mal eine halbe Stunde Suche nach
 * einem Fehler, den es nicht gibt.
 *
 * ⚠️ Die Pruefung kennt die richtigen Werte NICHT im Voraus. Sie liest den
 * Bereich aus einer Konstanten und die Texte aus der Datei; wer die Datei
 * kaputtmacht, sieht das hier. Gegenprobe zum Mitschreiben: eine Zeile
 * absichtlich auf 2:255 aendern - meldet das Skript nichts, misst es nichts. */

const fs = require('fs');
const path = require('path');

const WURZEL = __dirname;

function ladeAusSkript(datei, name){
  const roh = fs.readFileSync(path.join(WURZEL, datei), 'utf8');
  return new Function(`${roh};return ${name};`)();
}

const VOCAB_DATA = ladeAusSkript('vocab-data.js', 'VOCAB_DATA');
const ALT        = ladeAusSkript('data/eselsbruecken-alt.js', 'ESELSBRUECKEN_ALT');

/* Die Fachbegriffe aus dem Unterricht sind seit v157 echte Vokabeln (eigenes
   Kapitel 'grammar') und stehen in einer eigenen Datei. Sie gehoeren hier
   dazu - sonst meldet die Pruefung ihre Alternativen als "gehoert zu keiner
   Vokabel", und die Merkhaken, die er auf jeder sechsten Karte sieht, waeren
   die einzigen ohne Kontrolle. */
try {
  VOCAB_DATA.push(...ladeAusSkript('data/fachbegriffe.js', 'FACHBEGRIFF_VOKABELN'));
} catch (e){ console.log('  hinw data/fachbegriffe.js nicht lesbar — ohne sie geprueft.'); }

/* ⛔⛔ Und seine SELBST ANGELEGTEN Woerter — der vierte Weg in den Bestand.

   Sie stehen nur in vt_personalVocab, also in seinem localStorage;
   js/kern.js:245 schiebt sie beim Start in VOCAB_DATA. Ohne diese Zeilen
   meldet die Pruefung ihre Eselsbruecken als „Id gehoert zu keiner Vokabel" —
   am 20.08.2026 waren das fuenf Fehlmeldungen, direkt nachdem die ersten
   Texte dafuer geschrieben waren.

   Die Datei entsteht bei `vorrat.mjs --stand <datei> --app auto`.
   ⚠️ Fehlt sie, wird das GESAGT: eine stillschweigend kleinere Pruefung sieht
   aus wie eine bestandene. [[werkzeug_misst_kleineren_bestand]] */
try {
  const d = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'eigene-woerter.json'), 'utf8'));
  const liste = Array.isArray(d.woerter) ? d.woerter : [];
  if (liste.length) VOCAB_DATA.push(...liste);
} catch (e){
  console.log('  hinw data/eigene-woerter.json fehlt — seine selbst angelegten Woerter');
  console.log('       sind NICHT geprueft (node werkzeuge/vorrat.mjs --stand <datei> --app auto).');
}

/* ⭐⭐ SEIN AUSWENDIGER BEREICH — seit dem 24.08.2026 aus dem Speicher, nicht
   mehr abgeschrieben.

   ⛔ Hier stand `new Set([1, 67, 93..114])` mit dem Zusatz „belegt aus
   vt_hifz". Das war die HERKUNFT der Zahlen (abgeschrieben am 17.08.2026),
   nicht der Weg: gelesen hat den Speicher niemand. Hakte Elias im Quran-Leser
   eine Sure ab, aenderte sich hier nichts — und `vt_hifzVerse` (einzelne
   Verse, seit 04.08.) kannte ueberhaupt kein Werkzeug.
   [[eingefrorenes_feld_ist_kein_zustand]]

   ⚠️ Die Meldungen aus dem Leser gehoeren IN DIE AUSGABE. Faellt die Datei
   aus, greift der alte Stand — aber dann muss man das sehen, sonst ist die
   Pruefung nicht mehr deutbar. [[rueckfallliste_nur_ohne_hauptquelle_pruefbar]] */
const { auswendigLesen, kannStelle, umfang } = require('./werkzeuge/auswendig.js');
const BEREICH = auswendigLesen(WURZEL);

/* ⭐ Der Leitner-Stand je Wort — geschrieben von werkzeuge/vorrat.mjs aus
   demselben KV-Abruf wie auswendig.json. Fehlt die Datei, laeuft die
   Pruefung ohne sie weiter und sagt das; eine stille Nullmessung waere
   schlimmer als keine. [[leere_liste_ist_keine_messung]] */
let BOXEN = null;
try {
  const b = JSON.parse(fs.readFileSync(path.join(WURZEL, 'data', 'boxen.json'), 'utf8'));
  if (b && b.boxen && Object.keys(b.boxen).length) BOXEN = b;
} catch (e) { BOXEN = null; }
BEREICH.meldungen.forEach(m => console.log('  hinw ' + m));
console.log('  Leitner-Boxen: ' + (BOXEN
  ? Object.keys(BOXEN.boxen).length + ' Woerter, Stand ' + BOXEN.geholt
    + ' (Box 1 = nie richtig beantwortet: ' + (BOXEN.verteilung['1'] || 0) + ')'
  : '⚠️ data/boxen.json fehlt — Anker werden NUR gegen das Kapitel geprueft,'
    + ' nicht gegen das Koennen. Holen mit: node werkzeuge/vorrat.mjs --stand <datei> --app auto'));
console.log('  Auswendiger Bereich: ' + umfang(BEREICH)
  + ' (Quelle: ' + (BEREICH.quelle === 'datei' ? 'data/auswendig.json, Stand ' + BEREICH.stand
                                                : 'abgeschriebener Stand ' + BEREICH.stand) + ')');

/* Zeichen und Vereinheitlichung fuer den Textvergleich weiter unten. */
const ZEICHEN = /[ؐ-ًؚ-ٰٟۖ-ࣰۭ-ࣳ]/g;
const flach = s => String(s).replace(ZEICHEN, '').replace(/ـ/g, '')
  .replace(/[آأإٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');

const MAX_ZITAT = 4;

/* Die Woerter aus den Buchabzuegen. ⚠️ Sie stehen NICHT in vocab-data.js, und
   Eselsbruecken duerfen es auch fuer sie geben (data/eselsbruecken.js deckt
   300 von 300 Madina-1-Woertern ab). Ohne diese Liste meldete Abschnitt 3
   jede Alternative zu einem Buchwort als "gehoert zu keiner Vokabel".
   ⛔ Die Abzugsdateien werden nur GELESEN — sie duerfen nach arabicroots' AGB
   nicht ins Repo, und nichts davon steht hier im Quelltext. Fehlen sie,
   arbeitet die Pruefung ohne sie weiter. */
const BUCH_WOERTER = [];
(function ladeBuecher(){
  const ordner = path.join(WURZEL, 'data');
  if (!fs.existsSync(ordner)) return;
  fs.readdirSync(ordner).filter(n => /^vokabeln-.*\.js$/.test(n)).forEach(n => {
    try {
      const fenster = {};
      new Function('window', fs.readFileSync(path.join(ordner, n), 'utf8'))(fenster);
      Object.keys(fenster.VOKABELN || {}).forEach(slug => {
        (fenster.VOKABELN[slug] || []).forEach(w => BUCH_WOERTER.push(Object.assign({ book: slug }, w)));
      });
    } catch (e){
      /* Eine kaputte Abzugsdatei darf die Pruefung nicht kippen — aber sie
         darf auch nicht schweigen. Ohne diese Zeile faellt die Namensaufloesung
         fuer ein ganzes Buch aus, und jede Meldung dazu heisst dann
         "(unbekannt)": derselbe Ausfall, nur unsichtbar. */
      console.log('  hinw data/' + n + ' nicht lesbar (' + e.message + ') — dieses Buch fehlt in der Pruefung.');
    }
  });
})();

let fehler = 0, geprueft = 0;
const hinweise = [];
const melde = (was) => { fehler++; console.log('  FEHL ' + was); };

/* Alle Texte einsammeln: der erste Vorschlag steht an der Vokabel, die
   weiteren in data/eselsbruecken-alt.js. Beide unterliegen denselben Regeln -
   die Regel gilt dem Inhalt, nicht der Datei.

   ⛔⛔ DRITTE QUELLE, am 21.08.2026 nachgetragen: data/eselsbruecken.js traegt
   154 Texte. Sie fehlten hier - und damit liefen ALLE Regeln dieser Datei an
   ihnen vorbei: Koranstellen, Zitatlaenge, Mindestlaenge.

   ⚠️ Der Dateiname und mein erster Kommentar sagten "die Merkhilfen der
   BUCHVOKABELN". Nachgezaehlt am selben Tag: 140 Buchwoerter und **14 mit
   `p_`-Id, also Elias' EIGENE Vokabeln**. Wer hier etwas aendert, aendert
   womoeglich an seinen eigenen Woertern - und zwei der vier Laengen-Befunde
   von heute stehen genau dort. [[eingefrorenes_feld_ist_kein_zustand]]

   Gemessen: der Abschnitt "Koranstellen nur aus dem auswendigen Bereich"
   meldete 7 Faelle. Ueber alle drei Quellen sind es 11 - vier Buchtexte
   zitieren Sure 2:25, und niemand sah es. Die Zahl 7 sah dabei nie falsch
   aus. [[werkzeug_misst_kleineren_bestand]] [[die_dritte_satzquelle]]

   ⭐ Abschnitt 7 laedt dieselbe Datei seit langem selbst (Zeile ~483) und
   warnt dort sogar, er saehe sonst "WENIGER als die App". Dieselbe Frage,
   zwei Antworten in EINER Datei - derselbe Fehler, den der Kommentar unten
   fuer die Wortsuche beschreibt. [[dieselbe_frage_zwei_antworten]]

   ⚠️ Ausfallsicher wie in Abschnitt 7: fehlt data/, arbeitet die Pruefung
   ohne sie weiter - die Abzugsdateien duerfen nicht ins Repo. */
let BUCH_EB_TEXTE = {};
try { BUCH_EB_TEXTE = ladeAusSkript('data/eselsbruecken.js', 'BUCH_ESELSBRUECKEN'); }
catch (e){
  console.log('  ⛔ data/eselsbruecken.js nicht lesbar: ' + e.message);
  console.log('     Alle Abschnitte pruefen dann OHNE die Buch-Eselsbruecken.');
}

const texte = [];
VOCAB_DATA.forEach(w => {
  if (w.mnemo) texte.push({ id: w.id, wort: w.ar, quelle: 'mnemo', text: w.mnemo });
});
/* Die Buchvokabeln: ihre Merkhilfe steht nicht am Eintrag, sondern hier.
   Der Wortname kommt aus BUCH_WOERTER, damit eine Meldung nicht
   "(unbekannt)" heisst - dieselbe Aufloesung wie bei den Alternativen unten. */
Object.keys(BUCH_EB_TEXTE).forEach(id => {
  const t = BUCH_EB_TEXTE[id];
  if (typeof t !== 'string' || !t.trim()) return;
  /* ⚠️ Steht dasselbe Wort schon mit `mnemo` da, ist der Buchtext nicht in
     Gebrauch: die App nimmt das vorhandene mnemo (einhaengen() - Vorhandenes
     gewinnt). Was nicht angezeigt wird, soll auch nicht gemeldet werden. */
  const inVocab = VOCAB_DATA.find(x => String(x.id) === String(id));
  if (inVocab && inVocab.mnemo) return;
  const w = inVocab || BUCH_WOERTER.find(x => String(x.id) === String(id));
  texte.push({ id, wort: w ? w.ar : '(unbekannt, id ' + id + ')', quelle: 'buch', text: t });
});

Object.keys(ALT).forEach(id => {
  /* ⛔ AUCH IM BUCHABZUG NACHSEHEN. Bis zum 19.08.2026 stand hier nur
     VOCAB_DATA — also 171 von 4.446 Woertern. Jede Meldung zu einem Buchwort
     hiess deshalb "(unbekannt)", und das waren alle neun offenen Befunde:
     man sah, DASS etwas nicht stimmt, aber nicht WORAN.
     Abschnitt 3 hat es zwei Bildschirmseiten weiter unten schon richtig
     gemacht — dieselbe Frage, zwei Antworten in einer Datei. */
  const w = VOCAB_DATA.find(x => String(x.id) === id)
         || BUCH_WOERTER.find(x => String(x.id) === id);
  (ALT[id] || []).forEach((t, i) => {
    texte.push({ id, wort: w ? w.ar : '(unbekannt, id ' + id + ')', quelle: 'alt[' + i + ']', text: t });
  });
});

console.log('=== 1. Koranstellen nur aus dem auswendigen Bereich ===');
{
  /* Sure:Vers, auch als Bereich (93:1-3).
     ⚠️ Das Versende ist seit dem 24.08.2026 eine EIGENE Gruppe: seit einzelne
     Verse zaehlen, reicht „die Sure entscheidet" nicht mehr. Bei 2:255-260
     muessen ALLE Verse abgedeckt sein — sonst ginge die Stelle durch, weil
     zufaellig der erste abgehakt ist. */
  const muster = /\b(\d{1,3}):(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?\b/g;
  let stellen = 0;
  texte.forEach(t => {
    let m;
    muster.lastIndex = 0;
    while ((m = muster.exec(t.text))){
      const sure = Number(m[1]);
      if (sure < 1 || sure > 114) continue;      /* keine Koranstelle */
      /* ⛔ ZEITMARKEN SEHEN AUS WIE KORANSTELLEN (05.09.2026).
         Ein Merkhaken zu الَّتِي zitiert den Unterricht mit „Dein Lehrer geht
         in Folge 17 ab 32:06 …" — der Pruefer las das als Sure 32, Vers 6 und
         meldete einen Fehler, den es nicht gab. Das ist die Gegenrichtung zu
         dem, was eiche-datumsmuster.mjs fuer den Datumspruefer festhaelt: dort
         war „112:1" eine Quranstelle und keine Uhrzeit, hier ist „32:06" eine
         Uhrzeit und keine Quranstelle.

         Erkennungsmerkmal ist das WORT DAVOR, nicht die Zahl: „ab", „bei",
         „Minute", „Folge … ab". Eine Quranstelle steht nie hinter „ab".
         [[kennzeichen_mit_zwei_ursachen]] */
      const davor = t.text.slice(Math.max(0, m.index - 24), m.index);
      if (/\b(ab|bei|Minute|min\.?|Zeitmarke)\s+$/i.test(davor)) continue;
      stellen++;
      const von = Number(m[2]);
      const bis = m[3] ? Number(m[3]) : von;
      let alleDrin = true;
      for (let v = von; v <= bis && alleDrin; v++)
        if (!kannStelle(BEREICH, sure, v)) alleDrin = false;
      if (alleDrin) continue;
      /* ⭐ Zwei verschiedene Strengegrade, und der Unterschied ist Elias'
         eigener Wortlaut. Zum BEREICH sagte er "am besten mit den suren die
         ganz am ende sind" - eine Vorliebe. Zur LAENGE sagte er "wichtig ist
         mir" - eine Vorgabe. Deshalb:

           · in data/eselsbruecken-alt.js (dort habe ich frei gewaehlt,
             NACHDEM er die Regel genannt hat) -> Fehler
           · in w.mnemo (aelter als die Regel, oft mit gutem Inhalt)
             -> Hinweis, damit ER entscheidet statt ich

         Ein pauschales Verbot haette hier 7 brauchbare Merkhaken gekippt,
         darunter den Thronvers zu كُرْسِيّ. */
      if (t.quelle === 'mnemo'){
        hinweise.push(`${t.wort} (mnemo): Sure ${sure} ausserhalb des auswendigen Bereichs — ${m[0]}`);
      } else {
        melde(`${t.wort} (${t.quelle}): Sure ${sure} liegt AUSSERHALB seines auswendigen Bereichs — ${m[0]}`);
      }
    }
  });
  console.log(`  ${stellen} Koranstelle(n) in ${texte.length} Texten geprueft.`);
  geprueft += stellen;
}

console.log('');
console.log('=== 2. Kein arabischer Textlauf laenger als ' + MAX_ZITAT + ' Woerter ===');
{
  /* Ein "Lauf" ist eine ununterbrochene Folge arabischer Woerter, getrennt nur
     durch Leerzeichen. Deutsche Einschuebe beenden ihn - genau darum geht es:
     nicht die Menge Arabisch ist das Problem, sondern der lange Vers am Stueck. */
  const arabWort = '[\\u0600-\\u06FF\\u0750-\\u077F\\uFB50-\\uFDFF\\uFE70-\\uFEFF]+';
  const lauf = new RegExp(arabWort + '(?:[ \\u00A0]' + arabWort + ')*', 'g');
  let laengster = 0, laengsterOrt = '';
  texte.forEach(t => {
    let m;
    lauf.lastIndex = 0;
    while ((m = lauf.exec(t.text))){
      const n = m[0].trim().split(/[  ]+/).filter(Boolean).length;
      if (n > laengster){ laengster = n; laengsterOrt = `${t.wort} (${t.quelle}): ${m[0]}`; }
      if (n > MAX_ZITAT)
        melde(`${t.wort} (${t.quelle}): arabischer Lauf mit ${n} Woertern — "${m[0]}"`);
    }
  });
  console.log(`  laengster Lauf: ${laengster} Wort/Woerter — ${laengsterOrt}`);
  geprueft++;
}

console.log('');
console.log('=== 3. Ids, Anzahl und Doppelungen ===');
{
  Object.keys(ALT).forEach(id => {
    const w = VOCAB_DATA.find(x => String(x.id) === id)
           || BUCH_WOERTER.find(x => String(x.id) === id);
    if (!w){ melde(`Id ${id} gehoert zu keiner Vokabel`); return; }
    const liste = ALT[id] || [];
    if (!liste.length) melde(`${w.ar}: leere Liste`);
    liste.forEach((t, i) => {
      if (typeof t !== 'string' || t.trim().length < 40)
        melde(`${w.ar} (alt[${i}]): Text fehlt oder ist zu kurz`);
      if (w.mnemo && t.trim() === w.mnemo.trim())
        melde(`${w.ar} (alt[${i}]): wiederholt wortgleich den ersten Vorschlag`);
    });
    const einmalig = new Set(liste.map(t => t.trim()));
    if (einmalig.size !== liste.length) melde(`${w.ar}: zwei gleiche Vorschlaege`);
  });
  console.log(`  ${Object.keys(ALT).length} Woerter mit Alternativen geprueft.`);
  geprueft += Object.keys(ALT).length;
}

console.log('');
console.log('=== 4. „das hast du auch" — steht das Wort wirklich im Lernbestand? ===');
{
  /* ⭐ Der Anlass ist ein echter Fehlgriff vom 17.08.2026: In der Eselsbruecke
     zu تُفَّاحٌ stand „مَوْزٌ (Banane), بُرْتُقَالٌ (Orange)" als Gruppe seiner
     eigenen Woerter - beide hat er gar nicht. Das ist die gefaehrlichste Sorte
     Fehler in dieser Datei: Der Satz liest sich richtig, und der Merkhaken
     haengt an etwas, das es bei ihm nicht gibt.

     Geprueft wird das Muster ARABISCHES WORT (deutsche Bedeutung) - genau die
     Schreibweise, mit der ein Wort als bekannt VORGESTELLT wird. Ein Zitat aus
     dem Koran sieht anders aus und faellt nicht darunter.

     ⚠️ Nur der alt-Vorrat, nicht die alten mnemo-Texte: dort stehen bewusst
     auch Woerter, die er noch nicht hat (z. B. مُرّ „bitter" mit dem
     ausdruecklichen Zusatz, dass es noch nicht in seinen Vokabeln steht). */
  const arab = '[\\u0600-\\u06FF]';
  const muster = new RegExp('(' + arab + '+)\\s*\\(([^)]{2,30})\\)', 'g');
  /* ⚠️ Auch die PLURAL- und Singularformen zaehlen als bekannt. Sie stehen an
     seinen Vokabeln (Feld `pl` / `sg`) und werden auf der Lernkarte angezeigt -
     „أُنُوفٌ (Nasen)" ist also keine Behauptung ueber ein fremdes Wort, sondern
     ueber die Mehrzahl von أَنْفٌ, das er hat. Ohne diese Zeile meldet die
     Pruefung genau die Stellen, an denen Muster erklaert werden. */
  const bekannt = new Set();
  VOCAB_DATA.forEach(w => {
    [w.ar, w.pl, w.sg, w.femSg, w.femPl].forEach(feld => {
      if (!feld) return;
      String(feld).split('/').forEach(teil => {
        const t = flach(teil).trim();
        if (t) bekannt.add(t);
      });
    });
  });
  /* Fachbegriffe aus dem Unterricht zaehlen mit - sie sind seit v157 Vokabeln. */
  try {
    ladeAusSkript('data/fachbegriffe.js', 'FACHBEGRIFF_VOKABELN')
      .forEach(w => bekannt.add(flach(w.ar)));
  } catch (e){ /* Datei fehlt: dann eben ohne */ }

  /* ⭐ WO STEHT DAS WORT SONST? Am 21.08.2026 gemessen: von fuenf Meldungen
     "steht nicht im Lernbestand" waren nur ZWEI erfundene Woerter.

       أسبوع (Woche)  madina-1 Kapitel 15   er ist bei 12
       سنة   (Jahr)   madina-1 Kapitel 18
       خلف   (hinter) quran

     Beides bleibt ein Mangel — eine Bruecke auf ein Wort aus Kapitel 15
     traegt HEUTE nicht. Aber die Behebung ist eine andere: dort warten,
     hier neu schreiben. Eine Meldung, die beides gleich nennt, fuehrt bei
     drei von fuenf in die Irre.
     [[kennzeichen_mit_zwei_ursachen]] [[kann_ist_nicht_ist]]

     ⛔ BUCH_WOERTER wird oben schon geladen — nicht ein zweites Mal lesen.
     Eine eigene Ladeschleife waere eine zweite Wahrheit mit eigener
     Fehlerbehandlung. [[handliste_neben_echter_quelle]] */
  const anderswo = new Map();
  for (const w of BUCH_WOERTER){
    const k = flach(w && w.ar);
    if (!k || bekannt.has(k) || anderswo.has(k)) continue;
    anderswo.set(k, (w.book || 'Buch')
      + (w.chapter != null ? ' Kapitel ' + w.chapter : ''));
  }
  /* ⚠️ Ohne Buchvokabeln ist jedes "erfunden" unten unbelegt — das muss
     dastehen, sonst behauptet die Meldung mehr als sie weiss.
     [[leere_liste_ist_keine_messung]] */
  if (!BUCH_WOERTER.length)
    console.log('  ⚠️ Keine Buchvokabel geladen — "erfunden" unten ist ungeprueft.');

  let behauptungen = 0;
  texte.filter(t => t.quelle !== 'mnemo').forEach(t => {
    let m;
    muster.lastIndex = 0;
    while ((m = muster.exec(t.text))){
      const wort = m[1], glosse = m[2];
      /* Klammern mit Erklaerungen statt Bedeutungen ueberspringen. */
      if (/kapitel|sure|vers|wurzel|form|plural|muster|arabisch|deutsch|\d/i.test(glosse)) continue;
      /* ⭐ ENTSCHEIDEND, und beim ersten Versuch falsch gemacht: Die Klammer
         allein ist KEINE Behauptung. „أَبْوَابٌ (Türen)" nennt eine Pluralform,
         „أَقْرَب (näher)" eine abgeleitete Form, „بَعْدَ (nach)" eine
         Verwechslungsgefahr - nichts davon behauptet, dass er das Wort hat.
         Von sieben Meldungen der ersten Fassung waren sechs falsch.

         Die Behauptung steckt im BESITZWORT daneben: „hast du", „deine
         Vokabeln", „du hast". Erst der Satz mit einem solchen Wort sagt: das
         gehoert dir schon. Genau daran haengt die Pruefung jetzt - und der
         eine echte Fund bleibt drin (مُهَنْدِسٌ „aus deinen Vokabeln", das er
         nie hatte). */
      /* Nur der SATZ, in dem die Klammer steht - nicht ein Zeichenfenster
         darum herum. Mit ±160 Zeichen fing die Pruefung ein „Dein Satz zeigt
         …" zwei Saetze weiter ein und meldete einen Fehler, den es nicht gab. */
      const vorher = t.text.slice(0, m.index);
      /* ⛔ EIN WURZELBUCHSTABE IST KEIN WORT. Der Glossen-Filter oben faengt
         „(Wurzel …)" ab — aber bei كَسْلَانُ steht „Wurzel" im SATZ, und die
         Glosse ist eine echte Bedeutung:
           „dort ist die Wurzel ك س ر (brechen), hier ك س ل"
         Gemeldet wurde daraufhin der letzte Wurzelbuchstabe ر als angeblich
         fehlende Vokabel. Der Text ist voellig richtig — er vergleicht zwei
         Wurzeln, er behauptet nichts ueber Elias' Bestand.

         Erkennbar am Muster davor: zwei einzelne Buchstaben mit Leerzeichen,
         die Wurzelschreibweise. Gemessen: das trifft 1 von 221 Klammer-
         Kandidaten, naemlich genau diesen einen.

         ⚠️ Ein pauschales „Einzelbuchstaben ueberspringen" waere zu grob
         gewesen: أَ (Fragepartikel), وَ (und) und لِ (fuer) sind echte
         Vokabeln im Bestand, und eine Eselsbruecke darf auf sie verweisen.
         [[mein_entwurf_ist_zu_grob]] [[kandidatenliste_ist_keine_fehlerliste]] */
      if (/(?:^|\s)[ء-ي]\s+[ء-ي]\s+$/.test(vorher)) continue;
      const nachher = t.text.slice(m.index + m[0].length);
      const satz = vorher.slice(vorher.lastIndexOf('. ') + 1)
                 + m[0]
                 + nachher.slice(0, (nachher.indexOf('. ') + 1) || nachher.length);
      /* „aus deinen REGELN" ist etwas anderes als „aus deinen VOKABELN": die
         73 Grammatikregeln enthalten Woerter, die nicht im Lernbestand stehen,
         und sie dort zu nennen ist richtig. */
      if (/deine[nrm]?\s+(Regeln?|Folgen|Unterricht|Stunden?)/i.test(satz)) continue;
      /* Ein ausdruecklicher Vorbehalt hebt die Behauptung auf. Genau so ist
         der Fall مَفْتُوح gemeint: „auch wenn das Wort noch nicht in deinen
         Vokabeln steht". Ohne diese Zeile kann man einen ehrlichen Hinweis
         gar nicht schreiben, ohne dass die Pruefung Alarm schlaegt - und eine
         Pruefung, die korrektes Verhalten bestraft, wird abgeschaltet. */
      if (/noch nicht|nicht in deinen|hast du nicht|steht (das )?(wort )?nicht/i.test(satz)) continue;
      /* ⚠️ Die erste Fassung hiess `\bdeine[nr]?\b|\bhast du\b` und liess
         „deines" und „das du auch hast" durch - beides kommt in echten Texten
         staendig vor. Aufgefallen ist es nur an der GEGENPROBE: den Vorbehalt
         aus einem Text herausgenommen, und die Pruefung blieb gruen. Eine
         Pruefung, die man nicht absichtlich zum Ausschlagen bringt, misst
         moeglicherweise nichts. */
      const besitz = /\bdein(e|er|es|en|em)?\b/i.test(satz)
                  || /\bhast du\b/i.test(satz)
                  || /\bdu\b[^.]{0,40}\bhast\b/i.test(satz);
      if (!besitz) continue;
      /* ⛔ DAS WORT SELBST IST KEINE BEHAUPTUNG UEBER EIN FREMDES WORT.
         Am 19.08.2026 waren drei der neun offenen Befunde genau das: eine
         Eselsbruecke, die ihr eigenes Wort in eine Reihe stellt.
           حَفِيدٌ: „أَبٌ (Vater) → اِبْنٌ (Sohn) → حَفِيدٌ (Enkel).
                     Drei Generationen — und nur die letzte ist neu."
         Der Text sagt ausdruecklich, dass es das neue Wort ist, und die
         Pruefung meldete es als unbelegte Behauptung.
         Mitgeprueft wird auch der Bestandteil eines zusammengesetzten
         Eintrags (كُلِّيَّةُ التِّجَارَةِ enthaelt التِّجَارَة).
         [[kandidatenliste_ist_keine_fehlerliste]] */
      const eigen = flach(t.wort || '');
      const gesucht = flach(wort);
      if (eigen && gesucht && (eigen === gesucht || eigen.includes(gesucht))) continue;
      behauptungen++;
      /* ⛔ DER AUSDRUCK KANN MEHRWORTIG SEIN. Das Muster oben erfasst nur
         arabische Zeichen ohne Leerzeichen, also das Wort DIREKT vor der
         Klammer. Bei "حَرْفُ الْجَرِّ (Genitiv-Präposition)" bleibt davon
         nur الجر uebrig — und das gibt es als eigenes Wort nicht, es
         existiert nur im Ganzen.

         Am 21.08.2026 gemessen: BEIDE Ganzheiten stehen in vocab-data.js
           حرف الجر    id c623f2fb-57a5-48b6-b176-55df461b2ada
           مضاف إليه   id c73787a3-8f9c-4033-b1ff-5644f34995d3
         Die Merksaetze hatten also recht; die Pruefung meldete zwei
         Fehlalarme. Wer sie befolgt haette, haette zwei richtige Texte
         zerstoert. [[zitierform_ist_nicht_satzkontext]]

         ⚠️ Die umgekehrte Richtung kennt die Pruefung laengst (Bestand
         zusammengesetzt, Merksatz nennt einen Teil). Diese hier ist die
         andere: Merksatz nennt das Zusammengesetzte, Bestand hat es als
         Ganzes. [[form_sagt_nicht_welche_beziehung]]

         Genau EIN Vorgaengerwort, nicht beliebig viele: der ganze Satz
         davor ist arabisch, und "irgendein Teilstueck kommt im Bestand
         vor" waere kein Nachweis mehr. */
      if (!bekannt.has(gesucht)){
        const davor = (vorher.match(/([\u0600-\u06FF]+)\s*$/) || [])[1];
        if (davor && bekannt.has(flach(davor) + ' ' + gesucht)) continue;
      }
      if (!bekannt.has(gesucht))
        {
        const wo = anderswo.get(gesucht);
        melde(`${t.wort} (${t.quelle}): „${wort} (${glosse})" wird als bekanntes Wort`
          + (wo ? ` vorgestellt — steht aber erst in ${wo}, ausserhalb seines Fensters`
                : ' vorgestellt, steht aber in KEINER Quelle — erfunden'));
      }
    }
  });
  console.log(`  ${behauptungen} Behauptung(en) „das hast du" geprueft.`);
  geprueft += behauptungen;
}

console.log('');
console.log('=== 5. Wie weit ist der Vorrat? ===');
{
  const ohne = VOCAB_DATA.filter(w => !ALT[w.id]);
  const nachKap = {};
  ohne.forEach(w => { nachKap[w.chapter] = (nachKap[w.chapter] || 0) + 1; });
  console.log(`  ${VOCAB_DATA.length - ohne.length} von ${VOCAB_DATA.length} Woertern haben Alternativen.`);
  if (ohne.length) console.log('  offen je Kapitel: ' + JSON.stringify(nachKap));
}

console.log('');
console.log('=== 6. Dauerauftrag: neu freigeschaltete Kapitel ===');
{
  /* ⭐ Elias am 17.08.2026: "für später wäre auch wichtig die nachfolgenden
     kapiteln auch damit auszurüsten aber das müsstest du dich später einfach
     dran erinnern."

     ⛔ "Dran erinnern" ist genau das, was ein Mensch nicht kann und ein Skript
     umsonst tut. Deshalb steht es hier: Sobald FREIGESCHALTET in js/kern.js
     waechst, meldet diese Pruefung die neuen Woerter ohne Alternativen — auch
     Monate spaeter und auch, wenn niemand mehr an das Versprechen denkt.

     ⚠️ Der Buchabzug (data/vokabeln-*.js) darf nach arabicroots' AGB nicht ins
     Repo. Er wird hier nur GELESEN, nichts davon steht im Quelltext. Fehlt die
     Datei, wird der Abschnitt uebersprungen statt zu scheitern. */
  const kern = fs.readFileSync(path.join(WURZEL, 'js/kern.js'), 'utf8');
  const block = kern.match(/const FREIGESCHALTET = \{([\s\S]*?)\};/);
  if (!block){ console.log('  FREIGESCHALTET in js/kern.js nicht gefunden — uebersprungen.'); }
  else {
    const frei = {};
    block[1].split('\n').forEach(z => {
      const m = z.match(/'([^']+)'\s*:\s*\[([^\]]*)\]/);
      if (m) frei[m[1]] = m[2].split(',').map(x => Number(x.trim())).filter(n => !Number.isNaN(n));
    });
    /* ⛔ NICHT gegen FREIGESCHALTET pruefen, sondern gegen den LERNSTAND.
       Am 19.08.2026 gemessen: madina-2 ist vollstaendig freigeschaltet und
       meldete "224 von 224 Woertern ohne Alternative" — also 448 Texte, die
       niemand braucht. Elias steht bei madina-1 Kapitel 11.
       Er selbst dazu: "es macht keinen sinn alle 4000 woerter einen vorschlag
       zu machen weil wir wissen ja nicht wie in 2 jahren mein wissenstand ist."
       [[kann_ist_nicht_ist]]
       Abschnitt 7 macht es seit heute richtig; dieser hier ist aelter und
       wurde nicht mitgezogen. */
    const LERNFENSTER = 3;
    let ANGABE = {};
    {
      const sd = path.join(WURZEL, 'data/lernstand.json');
      if (fs.existsSync(sd)){
        try { ANGABE = JSON.parse(fs.readFileSync(sd, 'utf8')).angabe || {}; }
        catch (e){ console.log('  hinw data/lernstand.json nicht lesbar: ' + e.message); }
      }
    }
    const buecher = Object.keys(frei).filter(b => {
      if (ANGABE[b] === undefined){
        console.log('  ⬜ ' + b + ': freigeschaltet, aber ohne Lernstand-Angabe — nicht eingefordert.');
        return false;
      }
      return true;
    });
    console.log('  freigeschaltet: ' + buecher.map(b => `${b} ${frei[b].join(',')}`).join(' | '));

    let gesamtOffen = 0, gesamtGeprueft = 0;
    buecher.forEach(slug => {
      const datei = `data/vokabeln-${slug}.js`;
      if (!fs.existsSync(path.join(WURZEL, datei))){
        console.log(`  ${datei} liegt nicht vor — ${slug} nicht pruefbar.`);
        return;
      }
      const fenster = {};
      new Function('window', fs.readFileSync(path.join(WURZEL, datei), 'utf8'))(fenster);
      const liste = (fenster.VOKABELN && fenster.VOKABELN[slug]) || [];
      /* Freigeschaltet UND im Fenster (Lernstand bis Lernstand+3). */
      const imFenster = k => Number(k) <= Number(ANGABE[slug]) + LERNFENSTER;
      const bekannteKapitel = liste.filter(w => frei[slug].includes(w.chapter) && imFenster(w.chapter));
      const fehlen = bekannteKapitel.filter(w => !ALT[w.id]);
      gesamtGeprueft += bekannteKapitel.length;
      gesamtOffen += fehlen.length;
      if (fehlen.length){
        const je = {};
        fehlen.forEach(w => { je[w.chapter] = (je[w.chapter] || 0) + 1; });
        console.log(`  ⬜ ${slug}: ${fehlen.length} von ${bekannteKapitel.length} Woertern aus freigeschalteten Kapiteln ohne Alternative — ${JSON.stringify(je)}`);
      } else {
        console.log(`  ✅ ${slug}: alle ${bekannteKapitel.length} Woerter aus freigeschalteten Kapiteln haben Alternativen.`);
        /* ⛔ Der Nenner sagt, was er NICHT angesehen hat. Dieser Abschnitt
           fragt nach neu freigeschalteten KAPITELWOERTERN; die eigenen
           Vokabeln, die Fachbegriffe, die selbst angelegten und die elf, die
           es nur in vocab-data.js gibt, haengen an keinem Kapitel und koennen
           hier gar nicht auftauchen. Am 20.08.2026 gemessen: 163 hier gegen
           214 im Lernbestand, und von den 51 Differenz hat KEINES eine
           fehlende Alternative — Abschnitt 1 sieht sie alle.
           ⭐ Ohne diese Zeile liest sich „alle 163" wie „alle bekannten", und
           genau daran habe ich selbst eine Viertelstunde gesucht.
           [[trefferquote_ohne_preis]] [[werkzeug_misst_kleineren_bestand]] */
        console.log('     (Die eigenen Vokabeln, Fachbegriffe, selbst angelegten und die elf nur aus vocab-data.js haengen an keinem Kapitel und werden hier NICHT gezaehlt — Abschnitt 1 prueft sie mit.)');
      }
    });
    if (gesamtOffen){
      hinweise.push(`Dauerauftrag: ${gesamtOffen} von ${gesamtGeprueft} Woertern aus FREIGESCHALTETEN Kapiteln haben noch keine zweite Eselsbruecke.`);
    }
    geprueft += gesamtGeprueft;
  }
}


console.log('');
console.log('=== 7. Anker: baut die Eselsbruecke auf etwas, das er SCHON hat? ===');
{
  /* ⭐ Elias am 19.08.2026: „es sollen immer 3 eselsbrücken sein. wichtig ist,
     dass sie darauf basieren was ich bereits kann."

     ⛔ Das ist SCHAERFER als „das Wort steht irgendwo im Bestand" (Abschnitt 4).
     Ein Anker aus Kapitel 22 hilft bei einem Wort aus Kapitel 1 nicht — dann
     ist die Bruecke an ein Ufer gebaut, das er noch nicht betreten hat.

     ⛔⛔ DREI MAL NACHGESCHAERFT, und jedes Mal war die erste Zahl falsch:
       194 Treffer  — verglichen wurde nur mit dem Kapitel des erklaerten
                      Wortes. Damit galt كَعْبَةٌ (K5) als zu frueh fuer
                      بَيْتٌ (K1) — obwohl Elias bei K11 steht und die
                      كَعْبَة laengst kennt.
        93 Treffer  — die GRAMMATIKBEGRIFFE zaehlten mit. Der Abzug legt sie
                      in Kapitel 24 ab (فَاعِل, نَعْت, مَجْرُور …), gelernt
                      werden sie aber aus den Videos, nicht aus Lektion 24.
        46 Treffer  — dazu der Anhang des Abzugs: Pronomen, Demonstrativa und
                      Fragewoerter stehen ebenfalls unter Kapitel 24, obwohl
                      هَذَا im Buch ab Lektion 1 vorkommt.
        32 Treffer  — `wordType` statt `type` gelesen; das Feld heisst im
                      Abzug anders als in vocab-data.js.
     [[kandidatenliste_ist_keine_fehlerliste]]

     ⚠️ Verglichen wird ueber das Konsonantengeruest. Das wirft Information weg
     (مِنْ/مَنْ sehen gleich aus) — fuer die Frage „kommt dieses Wort als
     Vokabel vor?" ist es die richtige Grobheit, und jeder Treffer wird mit
     voller Schreibung ausgegeben. [[skelettvergleich_wirft_information_weg]] */

  const standDatei = path.join(WURZEL, 'data/lernstand.json');
  if (!fs.existsSync(standDatei)){
    console.log('  data/lernstand.json fehlt — uebersprungen.');
  } else {
    const stand = JSON.parse(fs.readFileSync(standDatei, 'utf8'));
    /* ⛔ Massgeblich ist SEINE ANGABE, nicht die Messung aus get_learning_progress.
       Gemessen meldet madina-1 „hoechstes Kapitel 23"; gesagt hat er 11.
       [[kann_ist_nicht_ist]] */
    const ANGABE = stand.angabe || {};
    if (!Object.keys(ANGABE).length){
      console.log('  data/lernstand.json hat keine `angabe` — uebersprungen (nur seine eigene Angabe zaehlt).');
    } else {

    /* ⛔ KEIN STUMMES catch. Am 19.08.2026 hat genau hier ein leeres
       catch eine kaputte data/eselsbruecken.js verschluckt: Abschnitt 7 lief
       mit NULL Buch-Eselsbruecken weiter, meldete 231 statt 298 geprueften
       Woertern und fand dadurch weniger Anker — es sah aus wie ein Erfolg.
       Ein Fangnetz, das alles faengt, versteckt auch den eigenen Fehler. */
    let BUCH_EB = {};
    try { BUCH_EB = ladeAusSkript('data/eselsbruecken.js', 'BUCH_ESELSBRUECKEN'); }
    catch (e){
      console.log('  ⛔ data/eselsbruecken.js NICHT LESBAR: ' + e.message);
      console.log('     Abschnitt 7 prueft ohne die Buch-Eselsbruecken und sieht damit WENIGER als die App.');
      fehler++;
    }

    const geruest = s => String(s || '').normalize('NFC')
      .replace(/[ً-ْٰـ]/g, '').replace(/[إأآٱ]/g, 'ا').trim();

    /* Grammatikbegriffe des Unterrichts — sie kommen aus den Videos, nicht aus
       dem Kapitel, unter dem der Abzug sie ablegt. */
    const GRAMMATIK = new Set(['مبتدا','مفعول','فاعل',
      'مرفوع','منصوب','مجرور','مضاف',
      'اضافة','نعت','حرف','اسم','فعل','جر']);

    /* ⛔ 21.08.2026: BUECHER OHNE ANGABE WURDEN GAR NICHT GEPRUEFT.
       Fuer bayna-yadayk-1 lagen 27 Eselsbruecken vor, und dieser Abschnitt
       meldete „Kein Anker aus einem spaeteren Kapitel" — ohne sie
       anzusehen: `angabe` in lernstand.json nennt nur madina-1.
       Ein Pruefwerkzeug, das den halben Bestand nicht kennt, kann gar nicht
       schlecht ausfallen. [[werkzeug_misst_kleineren_bestand]]
       [[pruefwerkzeug_mit_eingebauter_antwort]]

       Die Grenze 0 ist die konservative Annahme: ohne seine Angabe zaehlt
       nur das Kapitel des erklaerten Wortes selbst als bekannt. Lieber eine
       Meldung zu viel als ein Anker, den er nicht aufloesen kann. */
    for (const d of fs.readdirSync(path.join(WURZEL, 'data'))){
      const m = /^vokabeln-(.+)\.js$/.exec(d);
      if (!m || ANGABE[m[1]] !== undefined) continue;
      const f = {};
      try { new Function('window', fs.readFileSync(path.join(WURZEL, 'data', d), 'utf8'))(f); }
      catch (e){ console.log('  ⛔ ' + d + ' nicht lesbar: ' + e.message); fehler++; continue; }
      const liste = (f.VOKABELN && f.VOKABELN[m[1]]) || [];
      const wieViele = liste.filter(w => BUCH_EB[String(w.id)]).length;
      if (!wieViele) continue;
      ANGABE[m[1]] = 0;
      console.log('  ⭐ ' + m[1] + ': keine Angabe von Elias, aber ' + wieViele
        + ' Eselsbruecke(n) vorhanden — mit Grenze 0 geprueft.');
    }

    let echt = 0, spaeter = 0, geprueftHier = 0;
    const schwacherAnker = [];
    const jeWort = {};

    Object.entries(ANGABE).forEach(([slug, lernstand]) => {
      const datei = `data/vokabeln-${slug}.js`;
      if (!fs.existsSync(path.join(WURZEL, datei))){
        console.log(`  ${datei} liegt nicht vor — ${slug} nicht pruefbar.`);
        return;
      }
      const fenster = {};
      new Function('window', fs.readFileSync(path.join(WURZEL, datei), 'utf8'))(fenster);
      const liste = (fenster.VOKABELN && fenster.VOKABELN[slug]) || [];

      /* Verzeichnis: Geruest -> kleinstes Kapitel, in dem es auftaucht. */
      const kapitelVon = new Map(), schreibungVon = new Map();
      /* ⭐ Dieselbe Schluesselform wie kapitelVon (das Geruest), damit der
         Vergleich unten mit einem Nachschlagen auskommt. Steht ein Geruest
         fuer mehrere Woerter, gewinnt die HOECHSTE Box — im Zweifel zu
         Elias\u0027 Gunsten, sonst meldete ein gleichaussehendes Wort in Box 1
         ein Wort mit, das er laengst kann.
         [[skelettvergleich_wirft_information_weg]] */
      const boxVonGeruest = new Map();
      const merkeBox = (ar, id) => {
        if (!BOXEN) return;
        const b = Number(BOXEN.boxen[String(id)]);
        if (!Number.isFinite(b)) return;
        const k = geruest(ar);
        if (!k || k.length < 2) return;
        if (!boxVonGeruest.has(k) || b > boxVonGeruest.get(k)) boxVonGeruest.set(k, b);
      };
      const merke = (ar, kap) => {
        const k = geruest(ar);
        if (!k || k.length < 2) return;
        const n = Number(kap);
        if (Number.isNaN(n)) return;      /* 'personal'/'grammar' zaehlen als immer bekannt */
        if (!kapitelVon.has(k) || n < kapitelVon.get(k)) kapitelVon.set(k, n);
        if (!schreibungVon.has(k)) schreibungVon.set(k, ar);
      };
      const letztesKapitel = Math.max(...liste.map(w => Number(w.chapter) || 0));
      liste.forEach(w => {
        const g = geruest(w.ar);
        if (GRAMMATIK.has(g)) return;
        /* Anhang des Abzugs im LETZTEN Kapitel: Partikeln, Pronomen, Fragewoerter. */
        if (Number(w.chapter) === letztesKapitel && (w.wordType || w.type) === 'particle') return;
        merke(w.ar, w.chapter);
        merkeBox(w.ar, w.id);
      });
      /* ⛔ 21.08.2026: die Kapitelzahl aus vocab-data.js ist eine
         madina-1-Zahl. Gegen die Kapitel eines ANDEREN Buches gehalten,
         vergleicht sie zwei verschiedene Skalen — وَاحِدٌ steht dort unter
         Kapitel 24 und haette in bayna-yadayk-1 Kapitel 1 als „spaeter"
         gegolten, obwohl es laengst in seinem Lernbestand liegt.
         Bei einem fremden Buch zaehlen sie deshalb als immer bekannt. */
      VOCAB_DATA.forEach(w => { merke(w.ar, slug === 'madina-1' ? w.chapter : 0); merkeBox(w.ar, w.id); });

      const eigen = new Map(VOCAB_DATA.map(w => [String(w.id), w]));
      liste.forEach(w => {
        const id = String(w.id);
        const meinKapitel = Number(w.chapter);
        if (Number.isNaN(meinKapitel)) return;
        const e = eigen.get(id);
        const texte = [];
        const erst = (e && e.mnemo) || w.mnemo || BUCH_EB[id];
        if (erst) texte.push(['1. Vorschlag', erst]);
        (ALT[id] || []).forEach((t, i) => texte.push([(i + 2) + '. Vorschlag', t]));
        if (!texte.length) return;
        geprueftHier++;

        texte.forEach(([welcher, text]) => {
          const woerter = String(text).match(/[؀-ۿݐ-ݿ]+/g) || [];
          woerter.forEach(roh => {
            const k = geruest(roh);
            if (!kapitelVon.has(k)) return;                /* kein Lernwort — egal */
            const kap = kapitelVon.get(k);
            /* Die Grenze ist das GROESSERE von beidem:
                 - was er heute kann (seine Angabe)
                 - das Kapitel des erklaerten Wortes selbst; wer dort ankommt,
                   kennt alles davor. */
            const grenze = Math.max(Number(lernstand), meinKapitel);
            if (kap <= grenze) {
              /* ⭐ Das Kapitel passt — aber KANN er das Wort? Elias am
                 24.08.2026: „wenn es wenigstens ein bekanntes wort ist, ist
                 okay aber so hilft halt nicht wirklich weil beide unbekannt
                 sind und sich in meinem kopf nichts tut."
                 Box 1 heisst: nie richtig beantwortet.
                 ⚠️ Hinweis, kein Fehler — 1909 von 2021 Woertern liegen in
                 Box 1, eine harte Schwelle waere unlesbar.
                 [[kann_ist_nicht_ist]] · [[kandidatenliste_ist_keine_fehlerliste]] */
              if (BOXEN && boxVonGeruest.get(k) === 1 && k !== geruest(w.ar))
                schwacherAnker.push({ wort: w.ar, welcher, anker: schreibungVon.get(k) || roh });
              return;
            }
            /* ⛔ OFFENGELEGT IST NICHT VORAUSGESETZT.
               Nennt der Satz um die Fundstelle das spaetere Kapitel selbst,
               baut der Text nicht auf dem Wort auf — er zeigt darauf:
                 „…in Kapitel 24 begegnet dir noch مَتْجَرٌ, der Ort des Handels."
               Abschnitt 4 kennt diese Unterscheidung laengst ("noch nicht",
               "nicht in deinen"); Abschnitt 7 ist neu und hatte sie nicht.
               ⚠️ Nur die KAPITELZAHL zaehlt als Offenlegung, keine weichen
               Stichworte wie "spaeter" — eine Zahl ist nachpruefbar. */
            const stelle = String(text).indexOf(roh);
            const vor = String(text).slice(0, stelle);
            const nach = String(text).slice(stelle);
            const satz = vor.slice(vor.lastIndexOf('. ') + 1)
                       + nach.slice(0, (nach.indexOf('. ') + 1) || nach.length);
            const genannt = [...satz.matchAll(/Kapitel\s+(\d{1,2})/g)].map(m => Number(m[1]));
            if (genannt.some(n => n === kap)) return;
            /* ⛔ ZWEITE QUELLE FUER "KENNT ER SCHON": DER KORAN.
               مَمْلَكَةٌ knuepft an مَلِكِ النَّاسِ (114:2) an. Der Prüfer hielt das
               für einen Anker auf Kapitel 13, weil النَّاسُ dort als Vokabel
               steht — Elias kennt das Wort aber aus Sure 114, die er auswendig
               kann. Ein Vokabelkapitel ist nicht die einzige Art, ein Wort zu
               kennen; genau darauf zielen die Merkhaken ja.
               ⚠️ Nur wenn die Fundstelle IM SELBEN SATZ eine Sure aus seinem
               auswendigen Bereich nennt — sonst wäre jede Erwähnung eines
               beliebigen Verses ein Freibrief. [[quranbezug-nur-auswendiges]] */
            /* ⚠️ Seit dem 24.08.2026 zaehlt auch der VERS: kann er 2:255
               einzeln, ist مَلِكِ daraus ein gueltiger Anker — vorher entschied
               allein die Sure, und einzeln abgehakte Verse gab es fuer kein
               Werkzeug. */
            const stellen = [...satz.matchAll(/(\d{1,3}):(\d{1,3})/g)];
            if (stellen.some(m => kannStelle(BEREICH, Number(m[1]), Number(m[2])))) return;
            /* ⭐ Zwei Schweregrade, und sie sind nicht dasselbe:
               Steht das erklaerte Wort in einem Kapitel, das er SCHON hat, ist
               die Bruecke heute kaputt — Fehler. Ist es vorausgeschrieben,
               bleibt Zeit — Hinweis. */
            const dringend = meinKapitel <= Number(lernstand);
            const eintrag = (jeWort[id] = jeWort[id] || { ar: w.ar, kap: meinKapitel, slug, dringend, anker: new Map() });
            const schluessel = schreibungVon.get(k) + '|' + kap;
            if (!eintrag.anker.has(schluessel))
              eintrag.anker.set(schluessel, { anker: schreibungVon.get(k), kap, welcher });
            if (dringend) echt++; else spaeter++;
          });
        });
      });
    });

    geprueft += geprueftHier;
    const woerter = Object.values(jeWort);
    console.log(`  ${geprueftHier} Woerter mit Eselsbruecken geprueft, Lernstand laut seiner Angabe: ` +
      Object.entries(ANGABE).map(([b, k]) => `${b} Kapitel ${k}`).join(', '));

    if (!woerter.length){
      console.log('  ✅ Kein Anker aus einem spaeteren Kapitel.');
    } else {
      const jetzt = woerter.filter(w => w.dringend);
      const bald  = woerter.filter(w => !w.dringend);
      if (jetzt.length){
        console.log(`  ⛔ ${echt} Anker in ${jetzt.length} Woertern, die er HEUTE schon lernt:`);
        jetzt.forEach(w => {
          console.log(`     ${w.ar} (Kapitel ${w.kap})`);
          w.anker.forEach(a => console.log(`        ⛔ ${a.anker} aus Kapitel ${a.kap}   [${a.welcher}]`));
        });
        fehler += jetzt.length;
      }
      if (bald.length){
        console.log(`  ⬜ ${spaeter} weitere Anker in ${bald.length} vorausgeschriebenen Woertern (Kapitel ueber seinem Stand):`);
        /* Nach Abstand ordnen — 18 Zeilen sehen sonst alle gleich schlimm aus.
           +1 Kapitel ist praktisch harmlos (wer dort ankommt, ist eine Lektion
           spaeter sowieso da), +10 ist etwas anderes. */
        bald.map(w => {
          const a = [...w.anker.values()];
          return { w, a, weit: Math.max(...a.map(x => x.kap - w.kap)) };
        }).sort((x, y) => y.weit - x.weit).forEach(({ w, a, weit }) => {
          console.log(`     +${String(weit).padStart(2)} Kapitel  ${w.ar} (K${w.kap}) ← ` +
            a.map(x => `${x.anker} K${x.kap}`).join(', '));
        });
        hinweise.push(`${spaeter} Anker in ${bald.length} vorausgeschriebenen Woertern zeigen auf spaetere Kapitel — kein akuter Fehler, aber vor der Freischaltung zu ersetzen.`);
      }
    }

    /* ⭐ Die zweite Frage, seit dem 25.08.2026: nicht „liegt der Anker in
       einem freigeschalteten Kapitel", sondern „kann er das Wort". Elias
       hat den alten Massstab selbst bestritten. Ausgegeben als HINWEIS und
       nach Wort gebuendelt — eine Zeile je Anker waere bei 1909 Woertern in
       Box 1 unlesbar. [[kann_ist_nicht_ist]] */
    if (BOXEN && schwacherAnker.length){
      const jeWort2 = new Map();
      schwacherAnker.forEach(s => {
        if (!jeWort2.has(s.wort)) jeWort2.set(s.wort, new Set());
        jeWort2.get(s.wort).add(s.anker);
      });
      console.log('');
      console.log('  hinw ' + schwacherAnker.length + ' Anker in ' + jeWort2.size
        + ' Wort/Woertern stehen in BOX 1 — freigeschaltet, aber nie richtig'
        + ' beantwortet. Das Kapitel passt, das Koennen nicht.');
      [...jeWort2.entries()].sort((a,b) => b[1].size - a[1].size).slice(0, 12)
        .forEach(([wort, anker]) => {
          console.log('       ' + wort + '  ← ' + [...anker].join(', '));
        });
      if (jeWort2.size > 12) console.log('       … und ' + (jeWort2.size - 12) + ' weitere.');
      hinweise.push(schwacherAnker.length + ' Anker stehen in Box 1 (nie richtig beantwortet) —'
        + ' das Kapitel passt, das Koennen nicht.');
    }
    }
  }
}
console.log('');
console.log('=== 8. Abgelehnte Vorschlaege: steht einer noch drin? ===');
{
  /* ⭐⭐ DER KREISLAUF, DER BIS ZUM 24.08.2026 OFFEN WAR.
     Elias tippt in der App auf „Taugt nicht". Der Stand wandert in den
     Geraeteabgleich — und blieb dort liegen: `werkzeuge/vorschlaege-holen.mjs`
     konnte ihn holen, aber niemand rief es auf. Er lehnte ab, und derselbe
     Text stand beim naechsten Mal wieder da. [[werkzeug_ohne_aufrufer]]

     Seit dem 24.08. schreibt `vorrat.mjs` die Liste bei jedem Abruf nach
     data/abgelehnt.json, und dieser Abschnitt prueft, ob ich sie beachtet
     habe.

     ⚠️ Der gespeicherte Text ist auf 400 Zeichen gekuerzt (js/kern.js). Der
     Vergleich laeuft deshalb ueber den ANFANG, nicht auf Gleichheit — sonst
     ginge jeder laengere Text durch. */
  let dateiDa = false, geprueft8 = 0;
  try {
    const d = JSON.parse(fs.readFileSync(path.join(WURZEL, 'data', 'abgelehnt.json'), 'utf8'));
    dateiDa = true;
    const alter = (() => {
      const m = String(d.geholt || '').match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
      return m ? Math.floor((Date.now() - new Date(+m[3], +m[2] - 1, +m[1]).getTime()) / 86400000) : null;
    })();
    if (alter === null)
      console.log('  hinw data/abgelehnt.json: wann geholt, steht nicht lesbar da.');
    else if (alter > 8)
      console.log('  hinw data/abgelehnt.json ist ' + alter + ' Tage alt — seither'
        + ' abgelehnte Vorschlaege fehlen hier.');
    const woerter = d.woerter || {};
    for (const id of Object.keys(woerter)){
      for (const e of woerter[id]){
        const weg = String(e.text || '').trim();
        if (weg.length < 12) continue;      /* zu kurz fuer einen sicheren Vergleich */
        geprueft8++;
        const anfang = weg.slice(0, 60);
        const treffer = texte.filter(t => t.id === id && String(t.text).trim().startsWith(anfang));
        treffer.forEach(t => melde(`${t.wort} (${t.quelle}): Vorschlag ${e.nr} hat Elias`
          + ' ABGELEHNT, steht aber noch da — ersetzen. „' + anfang.slice(0, 40) + '…"'));
      }
    }
  } catch (e){
    console.log('  hinw data/abgelehnt.json fehlt — seine Ablehnungen sind NICHT geprueft.');
    console.log('       Sie entsteht bei: node werkzeuge/vorrat.mjs --stand <datei> --app auto');
  }
  if (dateiDa){
    console.log('  ' + geprueft8 + ' abgelehnte(r) Vorschlag/Vorschlaege gegen den Bestand geprueft.');
    geprueft += geprueft8;
  }
}

console.log('');
if (hinweise.length){
  console.log('=== Hinweise (kein Fehler — Elias entscheidet) ===');
  hinweise.forEach(h => console.log('  hinw ' + h));
  /* ⚠️ Nur die Koran-Hinweise zaehlen, nicht alle. Seit Abschnitt 7 stehen hier
     auch andere — die Zeile behauptete sonst 8 Sure-Hinweise, wo 7 sind.
     [[zahlen_ohne_beleg]] */
  const sureHinweise = hinweise.filter(h => /ausserhalb des auswendigen Bereichs/.test(h)).length;
  if (sureHinweise){
    console.log(`  ${sureHinweise} alte Merkhaken zitieren eine Sure ausserhalb seines`);
    console.log('  auswendigen Bereichs. Der Inhalt kann trotzdem gut sein.');
  }
  console.log('');
}
if (fehler){ console.log(`${fehler} Verstoss/Verstoesse gefunden.`); process.exit(1); }
console.log(`Alles sauber (${geprueft} Einzelpruefungen, ${hinweise.length} Hinweise).`);
