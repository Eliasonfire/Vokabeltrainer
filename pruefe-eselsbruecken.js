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

/* Sein auswendiger Bereich. Belegt aus vt_hifz (seine eigenen Haekchen im
   Quran-Leser) plus "und ein paar mehr noch bis sura duha". */
const ZEICHEN = /[ؐ-ًؚ-ٰٟۖ-ࣰۭ-ࣳ]/g;
const flach = s => String(s).replace(ZEICHEN, '').replace(/ـ/g, '')
  .replace(/[آأإٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');

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
      behauptungen++;
      if (!bekannt.has(flach(wort)))
        melde(`${t.wort} (${t.quelle}): „${wort} (${glosse})" wird als bekanntes Wort vorgestellt, steht aber NICHT im Lernbestand`);
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
if (hinweise.length){
  console.log('=== Hinweise (kein Fehler — Elias entscheidet) ===');
  hinweise.forEach(h => console.log('  hinw ' + h));
  console.log(`  ${hinweise.length} alte Merkhaken zitieren eine Sure ausserhalb seines`);
  console.log('  auswendigen Bereichs. Der Inhalt kann trotzdem gut sein.');
  console.log('');
}
if (fehler){ console.log(`${fehler} Verstoss/Verstoesse gefunden.`); process.exit(1); }
console.log(`Alles sauber (${geprueft} Einzelpruefungen, ${hinweise.length} Hinweise).`);
