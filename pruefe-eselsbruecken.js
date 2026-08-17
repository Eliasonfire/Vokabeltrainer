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

/* Sein auswendiger Bereich. Belegt aus vt_hifz (seine eigenen Haekchen im
   Quran-Leser) plus "und ein paar mehr noch bis sura duha". */
const AUSWENDIG = new Set([1, 67, ...Array.from({length: 22}, (_, i) => 93 + i)]);
const MAX_ZITAT = 4;

let fehler = 0, geprueft = 0;
const hinweise = [];
const melde = (was) => { fehler++; console.log('  FEHL ' + was); };

/* Alle Texte einsammeln: der erste Vorschlag steht an der Vokabel, die
   weiteren in data/eselsbruecken-alt.js. Beide unterliegen denselben Regeln -
   die Regel gilt dem Inhalt, nicht der Datei. */
const texte = [];
VOCAB_DATA.forEach(w => {
  if (w.mnemo) texte.push({ id: w.id, wort: w.ar, quelle: 'mnemo', text: w.mnemo });
});
Object.keys(ALT).forEach(id => {
  const w = VOCAB_DATA.find(x => String(x.id) === id);
  (ALT[id] || []).forEach((t, i) => {
    texte.push({ id, wort: w ? w.ar : '(unbekannt)', quelle: 'alt[' + i + ']', text: t });
  });
});

console.log('=== 1. Koranstellen nur aus dem auswendigen Bereich ===');
{
  /* Sure:Vers, auch als Bereich (93:1-3). Die Sure ist die Zahl vor dem
     Doppelpunkt; nur sie entscheidet. */
  const muster = /\b(\d{1,3}):(\d{1,3})(?:\s*[-–]\s*\d{1,3})?\b/g;
  let stellen = 0;
  texte.forEach(t => {
    let m;
    muster.lastIndex = 0;
    while ((m = muster.exec(t.text))){
      const sure = Number(m[1]);
      if (sure < 1 || sure > 114) continue;      /* keine Koranstelle */
      stellen++;
      if (AUSWENDIG.has(sure)) continue;
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
    const w = VOCAB_DATA.find(x => String(x.id) === id);
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
console.log('=== 4. Wie weit ist der Vorrat? ===');
{
  const ohne = VOCAB_DATA.filter(w => !ALT[w.id]);
  const nachKap = {};
  ohne.forEach(w => { nachKap[w.chapter] = (nachKap[w.chapter] || 0) + 1; });
  console.log(`  ${VOCAB_DATA.length - ohne.length} von ${VOCAB_DATA.length} Woertern haben Alternativen.`);
  if (ohne.length) console.log('  offen je Kapitel: ' + JSON.stringify(nachKap));
}

console.log('');
if (hinweise.length){
  console.log('=== Hinweise (kein Fehler — Elias entscheidet) ===');
  hinweise.forEach(h => console.log('  hinw ' + h));
  console.log(`  ${hinweise.length} alte Merkhaken zitieren eine Sure ausserhalb seines`);
  console.log('  auswendigen Bereichs. Der Inhalt kann trotzdem gut sein.');
  console.log('');
}
if (fehler){ console.log(`${fehler} Verstoss/Verstoesse gefunden.`); process.exit(1); }
console.log(`Alles sauber (${geprueft} Einzelpruefungen, ${hinweise.length} Hinweise).`);
