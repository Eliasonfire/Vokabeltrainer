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
   die Regel gilt dem Inhalt, nicht der Datei. */
const texte = [];
VOCAB_DATA.forEach(w => {
  if (w.mnemo) texte.push({ id: w.id, wort: w.ar, quelle: 'mnemo', text: w.mnemo });
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
      if (!bekannt.has(gesucht))
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
    const buecher = Object.keys(frei);
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
      const bekannteKapitel = liste.filter(w => frei[slug].includes(w.chapter));
      const fehlen = bekannteKapitel.filter(w => !ALT[w.id]);
      gesamtGeprueft += bekannteKapitel.length;
      gesamtOffen += fehlen.length;
      if (fehlen.length){
        const je = {};
        fehlen.forEach(w => { je[w.chapter] = (je[w.chapter] || 0) + 1; });
        console.log(`  ⬜ ${slug}: ${fehlen.length} von ${bekannteKapitel.length} Woertern aus freigeschalteten Kapiteln ohne Alternative — ${JSON.stringify(je)}`);
      } else {
        console.log(`  ✅ ${slug}: alle ${bekannteKapitel.length} Woerter aus freigeschalteten Kapiteln haben Alternativen.`);
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

    let echt = 0, spaeter = 0, geprueftHier = 0;
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
      });
      VOCAB_DATA.forEach(w => merke(w.ar, w.chapter));

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
            if (kap <= grenze) return;
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
        bald.forEach(w => {
          const a = [...w.anker.values()];
          console.log(`     ${w.ar} (K${w.kap}) ← ` + a.map(x => `${x.anker} K${x.kap}`).join(', '));
        });
        hinweise.push(`${spaeter} Anker in ${bald.length} vorausgeschriebenen Woertern zeigen auf spaetere Kapitel — kein akuter Fehler, aber vor der Freischaltung zu ersetzen.`);
      }
    }
    }
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
