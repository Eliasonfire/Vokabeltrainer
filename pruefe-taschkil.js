#!/usr/bin/env node
/* ===================== Vollstaendigkeit der Vokalisierung =====================
   Elias' Vorgabe vom 29.07.2026, woertlich:

     "Grundsaetzlich alle arabischen Woerter sollen mit Vokalisationen und
      Taschkil sein. Es gibt auch noch andere Woerter denen es an Vokalisationen
      und evtl an Taschkil fehlt. Alle sollen das immer haben. Vielleicht kann
      man spaeter Schritt fuer Schritt, wenn ich viel besser geworden bin, die
      Taschkil/Vokalisationen schrittweise rausnehmen, aber fuer jetzt wo ich
      noch nicht gut bin brauche ich alle Taschkil/Vokalisationen."

   WARUM ES DAS GIBT, obwohl es schon `pruefe-saetze.js` gibt:
   Dieses andere Skript meldet "N Saetze mit mindestens einem unvokalisierten
   Wort" — das heisst aber nur "hier ist keine KASUSENDUNG sichtbar", und bei
   هَذَا (unveraenderlich) oder الْمُسْتَشْفَى (Alif maqsura) ist genau das
   korrekt. Ob einem Wort MITTEN DRIN eine Haraka fehlt, hat bisher nichts
   geprueft. Wer die alte Zahl als Mass fuer Elias' Vorgabe nimmt, misst das
   Falsche.

   Aufruf:   node pruefe-taschkil.js
             node pruefe-taschkil.js --alle       jeden Befund einzeln
             node pruefe-taschkil.js --buecher    dazu die data/vokabeln-*.js
   Rueckgabe: 0 = alles vokalisiert, 1 = mindestens eine Luecke IM REPO.
   Die Buchdateien faerben den Rueckgabewert nicht — Begruendung unten beim
   Abschnitt "Die acht Buchdateien". Ihr Umfang steht aber in JEDEM Lauf in
   der Ausgabe, damit ein gruenes Ergebnis nicht mehr nach "alles geprueft"
   aussieht, als nur drei von elf Dateien angesehen wurden.

   ⚠️ Das Skript findet LUECKEN, es fuellt sie nicht. Eine Haraka ohne Beleg aus
   dem Madina-Schluessel oder dem Lehrbuch ist genauso erfunden wie eine
   erfundene Regel (Goal-Prompt E.1). Was hier gemeldet wird, gehoert belegt
   nachgetragen oder Elias vorgelegt — nicht geraten.
   ===================================================================== */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DIR = __dirname;
const ALLE = process.argv.includes('--alle');
const BUECHER = process.argv.includes('--buecher');

/* ---------- Zeichenklassen ----------
   Der Vorrat ist am 29.07.2026 aus vocab-data.js ausgezaehlt, nicht geraten:
   1462 Fatha, 681 Kasra, 608 Dammatan, 409 Sukun, 334 Damma, 161 Schadda,
   5 Fathatan, 3 Kasratan. Mehr Vokalzeichen kommen dort nicht vor. */
const HARAKA   = /[ً-ُِْٰ]/;   // Fathatan..Kasra, Damma, Sukun, Alif chanjariyya
const SCHADDA  = 'ّ';
const KONSONANT = /[ء-غف-ي]/;
const TATWEEL  = 'ـ';

/* Buchstaben, die als LANGER VOKAL keine eigene Haraka brauchen.
   ا nach Fatha (بَاب), و nach Damma (بُيُوت), ي nach Kasra (كَبِير) — der
   Vokal steht am Buchstaben DAVOR. Ein Sukun darauf ist erlaubt, aber nicht
   verlangt. */
const VOKALTRAEGER = { 'ا': 'َ', 'و': 'ُ', 'ي': 'ِ' };

/* Zeichen, die von sich aus nie eine Haraka tragen. */
const OHNE_HARAKA = new Set([
  'آ',   // آ  Alif madda - traegt das Madda schon in sich
  'ى',   // ى  Alif maqsura - immer am Wortende, nie vokalisiert
  'ٰ'    // ٰ  Alif chanjariyya
]);

/* ---------- Ausnahmen mit Grund ----------
   Jede einzeln begruendet. Eine Ausnahmeliste ohne Gruende wird mit der Zeit
   zum Muellplatz fuer alles, was nicht durchgeht. */
const AUSNAHMEN = [
  {
    /* Das Alif von اَلْ traegt im Buchdruck oft kein Zeichen: الْبَيْتُ statt
       اَلْبَيْتُ. Beide Schreibweisen kommen in Elias' Material vor, und der
       Madina-Schluessel selbst ist darin nicht einheitlich. Das ist deshalb
       KEINE Luecke, die man ihm melden darf - es waere Rauschen ueber hunderte
       Woerter. */
    name: 'Alif des Artikels اَلْ ohne Fatha',
    trifft: (wort, i) => i === 0 && wort[0] === 'ا' && wort[1] === 'ل'
  },
  {
    /* ⭐ Das لام des Artikels vor einem SONNENBUCHSTABEN traegt richtigerweise
       kein Zeichen - es wird nicht gesprochen, der folgende Buchstabe bekommt
       stattdessen eine Schadda: الشَّمْس, السَّمَاء, الطَّبِيب.

       Das ist genau die Regel `schams-qamar-01` aus Elias' Unterricht (Folge
       02/03) und damit korrekte Schreibung, keine Luecke.

       ⚠️ Diese Ausnahme ist beim ERSTEN Lauf dieses Skripts entstanden: es
       meldete 69 Befunde, und alle 69 waren dieser Fall. Ohne die Ausnahme
       haette Elias eine Liste mit 69 Nicht-Problemen bekommen - und beim
       naechsten Mal dem Skript nicht mehr geglaubt. Ein Pruefer, der
       Fehlalarme liefert, ist schlimmer als keiner. */
    name: 'لام des Artikels vor Sonnenbuchstabe (richtig so)',
    trifft: (wort, i) => {
      /* Das لام des Artikels steht nicht immer an Stelle 1. Bei angeschriebenem
         لِ verschmelzen لِ und اَلْ zu لِلـ (`lil-verschmelzung-01`), dann sitzt
         es an Stelle 2: لِلتَّاجِرِ. Beim ersten Bau war nur Stelle 1 geprueft,
         und لِلتَّاجِرِ und لِلطَّبِيبِ standen faelschlich in der Fehlerliste. */
      if (wort[i] !== 'ل') return false;
      const davor = wort.slice(0, i).replace(new RegExp(`[${'ًٌٍَُِّْٰ'}]`, 'g'), '');
      if (davor !== 'ا' && davor !== 'ل' && davor !== 'لل' && davor !== '') return false;
      /* Naechster Buchstabe nach dem Lam - traegt er eine Schadda? */
      let j = i + 1;
      while (j < wort.length && (HARAKA.test(wort[j]) || wort[j] === SCHADDA)) j++;
      let k = j + 1;
      while (k < wort.length && (HARAKA.test(wort[k]) || wort[k] === SCHADDA)){
        if (wort[k] === SCHADDA) return true;
        k++;
      }
      return false;
    }
  },
  {
    /* لَفْظُ الْجَلَالَةِ - der Gottesname اللّٰه hat eine eigene, feststehende
       Schreibung: das erste لام traegt kein Zeichen, das zweite eine Schadda
       mit dem kleinen Alif darueber. Die App hat dazu eine eigene Regel
       (`lafz-al-jalala-01`). Das ist keine Luecke und darf nicht "korrigiert"
       werden - an einem Gottesnamen wird nicht herumgebastelt. */
    name: 'Gottesname اللّٰه (eigene Schreibung)',
    trifft: (wort) => /^(وَ|فَ|بِ|لِ|تَ)?ال[لّ]/.test(wort) && /لل/.test(wort.replace(/[ًٌٍَُِّْٰ]/g, ''))
  },
  {
    /* Hamzat al-wasl in اِبْنٌ, اِسْمٌ, اِسْتَمَعَ: der Abzug laesst die Kasra
       teils weg. ⚠️ Elias hat am 29.07.2026 fuer اِبْنٌ ausdruecklich MIT Kasra
       entschieden, diese Ausnahme gilt deshalb NICHT generell - sie ist hier
       nur eingetragen, damit die Meldung als eigene Gruppe erscheint statt in
       der Hauptliste unterzugehen. Siehe `nurMelden`. */
    name: 'Hamzat al-wasl am Wortanfang ohne Kasra',
    trifft: (wort, i) => i === 0 && wort[0] === 'ا' && wort[1] !== 'ل',
    nurMelden: true
  },
  {
    /* ⭐ Das Alif nach einem Tanwin Fath ist STUMM (Alif at-tanwin): شُكْرًا,
       جَزِيلًا, جِدًّا. Es wird nicht gesprochen und traegt deshalb weder Haraka
       noch Sukun - "Endung fehlt" ist dort keine Luecke, sondern die Regel.

       Gefunden am 20.08.2026, als data/beispielsaetze.js zum ersten Mal
       mitgeprueft wurde: von 432 Woertern dieser Quelle tragen 4 ein Tanwin
       Fath, und 3 davon standen als "Endung fehlt" in der Liste.

       ⛔ Ein Wort zur Schreibung, weil es KEINE Fehlerfrage ist, sondern eine
       Konventionsfrage - und die beiden Konventionen stehen in diesem Repo
       nebeneinander (gemessen am 20.08.2026):

         data/beispielsaetze.js   ـًا  (Tanwin VOR dem Alif)   2 Woerter
         vocab-data.js            ـاً  (Tanwin AUF dem Alif)   1 Wort (أَيْضاً)
         lehrbuch-saetze.js       gar kein Tanwin Fath          0 von 193

       Beide sind uebliche Schreibungen. Diese Ausnahme deckt nur die erste ab;
       bei der zweiten steht der KONSONANT ohne Zeichen (ض in أَيْضاً), und das
       ist eine echte Luecke, die weiter gemeldet wird.

       ⚠️ Deshalb nurMelden: der Fall bekommt einen eigenen Namen statt unter
       "Endung fehlt" zu stehen - er verschwindet aber nicht. Eine Ausnahme,
       die einen Befund still schluckt, macht den Pruefer blind.
       [[pruefwerkzeug_mit_eingebauter_antwort]] */
    name: 'Alif at-tanwin nach Tanwin Fath (stumm, richtig so)',
    /* ⚠️ Zwischen Tanwin und Alif kann eine Schadda stehen: جِدًّا ist
       064b 0651 0627, also Tanwin, Schadda, Alif. Eine Bedingung, die nur
       wort[i-1] ansieht, greift dort NICHT — genau so ist die erste Fassung
       dieser Ausnahme an جِدًّا vorbeigelaufen, waehrend شُكْرًا sie traf.
       Gleiches Schriftbild, andere Codepoints.
       [[zeichenklasse_nie_sichtbar_kopieren]]

       ⭐ Nachgemessen, bevor ich die Reihenfolge fuer falsch hielt: der GANZE
       Bestand schreibt Haraka VOR Schadda — 278 Mal gegen 0 (lehrbuch-saetze
       34, vocab-data 156, beispielsaetze 88). Die Reihenfolge in جِدًّا ist
       also die hiesige Konvention und kein Tippfehler. */
    trifft: (wort, i) => {
      if (wort[i] !== String.fromCharCode(0x627)) return false;   /* ا */
      if (i !== wort.length - 1) return false;
      for (let j = i - 1; j >= 0; j--){
        const c = wort.charCodeAt(j);
        if (c === 0x64B) return true;                 /* ً gefunden */
        if (c >= 0x64C && c <= 0x652) continue;       /* andere Haraka/Schadda */
        if (c === 0x670) continue;                    /* Dolch-Alif */
        return false;                                 /* Konsonant: Schluss */
      }
      return false;
    },
    nurMelden: true
  },
  {
    /* ⭐ Ein Fachbegriff wird in der ZITIERFORM genannt, also ohne Endung:
       مُضَاف, نَعْت, ظَرْف, شَكْل, مَجْرُور. „Endung fehlt" ist dort kein
       Mangel, sondern die uebliche Nennform — genau die, in der Elias' Lehrer
       sie ausspricht.

       ⛔ Nicht geraten, sondern im eigenen Bestand nachgeschlagen
       (20.08.2026, ueber vocab-data.js, grammar-data.js und die Buchdateien):

         مُضَاف    6×  neben مُضَافٌ 2×
         نَعْت     5×  neben نَعْتٌ  2×
         ظَرْف     3×  neben ظَرْفٌ  2×
         مَرْفُوع  1×  neben مَرْفُوعٌ 1×
         شَكْل     1×  neben شَكْلٌ  2×

       Beide Formen stehen also nebeneinander im Material. Die endungslose ist
       damit belegt und keine Nachlaessigkeit. [[zitierform_ist_nicht_satzkontext]]

       ⚠️ Die Ausnahme haengt an der HERKUNFT, nicht am Wort: nur Eintraege
       aus data/fachbegriffe.js (`gram-`-Kennung). Dasselbe Wort in einem SATZ
       braucht seine Endung weiter, und dort wird sie weiter gemeldet.

       ⛔ Sie deckt AUSDRUECKLICH NICHT die Faelle „Haraka fehlt" ab — إِضافة,
       تاء, مَرْبُوطة, مَقْصورة haben eine Luecke MITTEN im Wort, und das ist
       keine Nennform, sondern eine echte Luecke. Die bleiben in der
       Hauptliste. */
    name: 'Zitierform eines Fachbegriffs (ohne Endung, richtig so)',
    trifft: (wort, i, eintrag) =>
      !!eintrag && typeof eintrag.id === 'string'
      && eintrag.id.indexOf('gram-') === 0
      && i === wort.length - 1,
    nurMelden: true
  }
];

/* ---------- Woerter aus einem Feld holen ---------- */
function woerterAus(text){
  return String(text || '')
    .split(/[\s.،؟!«»:؛/]+/)
    .map(w => w.replace(new RegExp(TATWEEL, 'g'), '').trim())
    .filter(w => KONSONANT.test(w));
}

/* Fehlt an Stelle i eine Haraka? Gibt null zurueck, wenn alles in Ordnung ist,
   sonst einen Grund im Klartext. */
function luecke(wort, i){
  const c = wort[i];
  if (!KONSONANT.test(c)) return null;
  if (OHNE_HARAKA.has(c)) return null;

  /* Was folgt? Schadda und Haraka duerfen in beliebiger Reihenfolge stehen. */
  let j = i + 1, hatHaraka = false, hatSchadda = false;
  while (j < wort.length && (HARAKA.test(wort[j]) || wort[j] === SCHADDA)){
    if (wort[j] === SCHADDA) hatSchadda = true; else hatHaraka = true;
    j++;
  }
  if (hatHaraka) return null;

  /* Langer Vokal: ا و ي nach der passenden Haraka am Buchstaben davor. */
  const erwartet = VOKALTRAEGER[c];
  if (erwartet){
    /* Was steht am vorigen Konsonanten? */
    let k = i - 1;
    while (k >= 0 && (HARAKA.test(wort[k]) || wort[k] === SCHADDA)) k--;
    const davor = wort.slice(k + 1, i);
    if (davor.includes(erwartet)) return null;
    /* Auch ein Sukun auf dem Traeger selbst ist gueltige Schreibung (بَيْت). */
    if (hatSchadda) return null;
  }

  /* Letzter Buchstabe ohne Endung: bei einem Satz ist das die fehlende
     Kasusendung, die `pruefe-saetze.js` schon behandelt - hier trotzdem
     melden, aber als eigene Gruppe. */
  const istLetzter = j >= wort.length;
  return istLetzter ? 'Endung fehlt' : 'Haraka fehlt';
}

/* ---------- Datendateien laden ---------- */
let VOCAB_DATA = null, LEHRBUCH_SAETZE = null, SURAH_DATA = null,
    GRAMMAR_RULES = null;
try {
  let code = '';
  for (const f of ['vocab-data.js', 'lehrbuch-saetze.js', 'surah-data.js',
                   'grammar-data.js'])
    code += fs.readFileSync(path.join(DIR, f), 'utf8') + '\n';
  code += 'globalThis.__D = { VOCAB_DATA, LEHRBUCH_SAETZE, SURAH_DATA, GRAMMAR_RULES };';
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  ({ VOCAB_DATA, LEHRBUCH_SAETZE, SURAH_DATA, GRAMMAR_RULES } = ctx.__D);
} catch (e) {
  console.error('Datendateien nicht ausfuehrbar: ' + e.message);
  process.exit(1);
}

/* `quran.ar` ist AUSGENOMMEN: Uthmani folgt eigenen Schreibregeln (ٱ, kleine
   Zeichen, Rezitationsmarken) und ist keine Vorlage fuer Elias' Schreibung. */
const FELDER = ['ar', 'sg', 'pl', 'femSg', 'femPl', 'sentAr'];

const befunde = [];
let woerterGeprueft = 0;

function pruefeEintrag(eintrag, quelle, ziel = befunde){
  let gezaehlt = 0;
  FELDER.forEach(feld => {
    const wert = eintrag[feld];
    if (typeof wert !== 'string' || !wert.trim()) return;
    woerterAus(wert).forEach(wort => {
      gezaehlt++;
      for (let i = 0; i < wort.length; i++){
        const grund = luecke(wort, i);
        if (!grund) continue;
        /* ⚠️ Dritter Parameter seit dem 20.08.2026: manche Ausnahmen haengen
           nicht am Wort, sondern am EINTRAG (siehe „Zitierform eines
           Fachbegriffs"). Die aelteren vier ignorieren ihn. */
        const ausnahme = AUSNAHMEN.find(a => a.trifft(wort, i, eintrag));
        if (ausnahme && !ausnahme.nurMelden) continue;
        ziel.push({
          quelle, id: eintrag.id, feld, wort,
          stelle: i, zeichen: wort[i], grund,
          gruppe: ausnahme ? ausnahme.name : grund
        });
        break;                      // ein Befund je Wort reicht
      }
    });
  });
  return gezaehlt;
}

VOCAB_DATA.forEach(w => { woerterGeprueft += pruefeEintrag(w, 'vocab-data.js'); });
(LEHRBUCH_SAETZE || []).forEach(s => { woerterGeprueft += pruefeEintrag(s, 'lehrbuch-saetze.js'); });

/* ⛔⛔ DIE DRITTE SATZQUELLE — data/beispielsaetze.js.
   Am 20.08.2026 nachgezaehlt: 148 Saetze stehen dort und NIRGENDS sonst.
   Keiner davon war je auf Taschkil geprueft.

   ⭐ Und das ausgerechnet bei der Quelle, wo ein Fehler am wahrscheinlichsten
   ist: die 148 Saetze sind von MIR verfasst, nicht aus dem Lehrwerk
   abgeschrieben. lehrbuch-saetze.js traegt den Wortlaut des Buches, vocab-data.js
   den arabicroots-Abzug — beide sind gegengelesen. Diese hier nicht.

   ⚠️ Die 14 selbst angelegten Woerter helfen hier nicht aus: in
   data/eigene-woerter.json hat KEINES ein sentAr (gemessen: 0 von 14). Ihre
   Saetze stehen ausschliesslich hier. Der Block weiter unten prueft also ihre
   Wortfelder, nicht ihre Saetze.

   Derselbe Mangel steckte in pruefe-markierungen.js (Commit 937b1e3, dort
   33,2 % aller Markierungen blind). Zwei Werkzeuge, ein Loch, verschiedene
   Dateinamen. [[entscheidung_gilt_fuer_das_zweite_werkzeug]] [[dritte_satzquelle]] */
let beispielAnzahl = 0;
try {
  const bs = path.join(DIR, 'data', 'beispielsaetze.js');
  if (fs.existsSync(bs)){
    const { BEISPIELSAETZE } =
      (new Function(fs.readFileSync(bs, 'utf8') + ';return {BEISPIELSAETZE};'))();
    for (const k of Object.keys(BEISPIELSAETZE || {})){
      const s = BEISPIELSAETZE[k];
      if (!s || !s.sentAr) continue;
      woerterGeprueft += pruefeEintrag({ id: k, sentAr: s.sentAr },
                                       'data/beispielsaetze.js');
      beispielAnzahl++;
    }
  } else {
    console.log('  ⚠️ data/beispielsaetze.js fehlt — 148 verfasste Saetze sind');
    console.log('     damit UNGEPRUEFT. Ein gruener Lauf sieht genauso aus.');
  }
} catch (e) {
  console.log('  ⚠️ data/beispielsaetze.js nicht lesbar: ' + e.message);
  console.log('     Die verfassten Saetze sind damit UNGEPRUEFT.');
}

/* ⛔⛔ DIE VIERTE QUELLE — data/fachbegriffe.js, der Fachbegriff-Weg.
   Am 20.08.2026 nachgezaehlt: 15 Fachbegriffe, **0 davon** stehen in
   vocab-data.js. Alle 21 arabischen Felder waren ungeprueft.

   ⛔ Und das ist der peinliche Teil: der Block direkt darueber ist am selben
   Tag entstanden, eine Stunde vorher. Ich habe dort die DRITTE Quelle
   nachgetragen und die vierte liegen lassen — obwohl ich sie im
   Schwesterwerkzeug pruefe-markierungen.js im selben Zug beide ergaenzt
   hatte. Sechster Fall derselben Klasse an einem Tag.
   [[entscheidung_gilt_fuer_das_zweite_werkzeug]]

   ⭐ Sie gehoeren hierher, weil sie in der App echte Karteikarten sind:
   js/kern.js schiebt sie in VOCAB_DATA, und ihre Vokalisierung stammt aus
   dem Unterricht bzw. von mir — also aus derselben Ecke wie die verfassten
   Saetze, nicht aus einem gegengelesenen Abzug. */
let fachAnzahl = 0;
try {
  const fb = path.join(DIR, 'data', 'fachbegriffe.js');
  if (fs.existsSync(fb)){
    const { FACHBEGRIFF_VOKABELN } =
      (new Function(fs.readFileSync(fb, 'utf8') + ';return {FACHBEGRIFF_VOKABELN};'))();
    for (const w of (FACHBEGRIFF_VOKABELN || [])){
      if (!w) continue;
      woerterGeprueft += pruefeEintrag(w, 'data/fachbegriffe.js');
      fachAnzahl++;
    }
  } else {
    console.log('  ⚠️ data/fachbegriffe.js fehlt — 15 Fachbegriffe sind UNGEPRUEFT.');
  }
} catch (e) {
  console.log('  ⚠️ data/fachbegriffe.js nicht lesbar: ' + e.message);
  console.log('     Die Fachbegriffe sind damit UNGEPRUEFT.');
}

/* Surentitel, seit 04.08.2026 (Elias' Punkt 5). Geprueft wird NUR
   `arTaschkil` - das Feld `ar` daneben ist absichtlich unvokalisiert, es ist
   der Suchname und die Rueckfallebene. Deshalb eine eigene Runde mit eigenem
   Feld statt surah-data.js in FELDER aufzunehmen: sonst meldete das Skript
   114 Luecken, die keine sind. */
/* ---------- Grammatikregeln, seit 18.08.2026 ----------
 *
 * ⭐ Warum das ueberhaupt dazukam: Ein Pruefagent hat am 18.08.2026 in
 * `nakira-marifa-01` neun unvokalisierte Woerter gefunden - in gewoehnlichen
 * Beispiellisten, direkt neben vollvokalisiertem Buchzitat im selben Satz. Der
 * Fehler war unsichtbar, obwohl es dieses Skript gibt: grammar-data.js stand
 * einfach nicht in seinem Geltungsbereich. **Ein Pruefskript, das die Datei
 * nicht kennt, ist kein Schutz - es ist eine Beruhigung.**
 *
 * ⚠️ NUR "Haraka fehlt" wird gemeldet, "Endung fehlt" NICHT. Grund: Der
 * Bestand zitiert Fachbegriffe in der Pausalform ohne Kasusendung
 * (مُبْتَدَأ, خَبَر, ظَرْف, نَعْت) - gemessen in 19,5 % der arabischen Woerter
 * der 73 Unterrichtsregeln. Das ist Hauskonvention, kein Mangel. Wuerde die
 * Endung mitgemeldet, kaeme eine dreistellige Zahl von Nichtbefunden heraus -
 * und eine Meldung, die immer erscheint, liest bald niemand mehr.
 */
const REGEL_FELDER = ['name', 'shortExplanation'];
const HARAKA_IRGENDEINE = /[ً-ْٰ]/;

/* ⚠️ GEMESSEN am 18.08.2026, bevor der Massstab festgelegt wurde - genau das
 * war noetig, denn der erste Entwurf war unbrauchbar:
 *
 *   Massstab "irgendwo fehlt eine Haraka"      -> 223 Meldungen in 61 von 84 Regeln
 *   Massstab "Wortkoerper voellig unvokalisiert" ->  41 Meldungen
 *   Ein-Buchstabe-Token (Buchstabenzitate)      ->  48, muessen raus
 *
 * Die 223 waren zum groessten Teil keine Fehler: Der ganze Bestand schreibt
 * lange Vokale ohne Haraka davor (حُروف statt حُرُوف) - in 63 verschiedenen
 * Woertern, teils in Regeln, die genau davon handeln. Das ist Hauskonvention.
 * Eine Meldung, die bei 61 von 84 Regeln anschlaegt, wird nicht gelesen; sie
 * haette die Pruefung wertlos gemacht, statt sie einzufuehren.
 *
 * Gemeldet wird deshalb nur der eindeutige Fall: ein Wort, dessen Koerper
 * KEIN EINZIGES Vokalzeichen traegt. Das war der Befund vom 18.08. (بيتٌ،
 * قلمٌ، رجلٌ، بنتٌ in nakira-marifa-01) und er ist ohne Auslegung erkennbar.
 */
const REGEL_AUSNAHMEN = [
  { name: 'Buchstabenzitat',
    /* "ة", "ت", "و" - ein einzelner Buchstabe wird als Buchstabe genannt, nicht
       als Wort. Er kann gar keine Haraka tragen. 48 Vorkommen. */
    trifft: w => [...w].filter(c => KONSONANT.test(c)).length < 2 },
  { name: 'Lafz al-Jalala',
    /* الله / اللهِ wird herkoemmlich ohne vollstaendige Vokalisierung
       geschrieben; so steht es auch in den Lehrbuchsaetzen. */
    trifft: w => /^ا?ل?ل[هﻪ]/.test(w.replace(HARAKA_IRGENDEINE, '')) },
  { name: 'Artikel als Zitat',
    /* "اَلْ" / "الْ" - der Artikel wird als Baustein genannt. Sein Sukun sitzt
       auf dem letzten Zeichen, das der Koerper-Test nicht ansieht. */
    trifft: w => w.replace(HARAKA_IRGENDEINE, '') === 'ال' },
];

const regelBefunde = [];
let regelWoerter = 0, regelAusgenommen = 0;
(GRAMMAR_RULES || []).forEach(r => {
  REGEL_FELDER.forEach(feld => {
    const wert = r[feld];
    if (typeof wert !== 'string' || !wert.trim()) return;
    woerterAus(wert).forEach(rohwort => {
      /* ⚠️ woerterAus trennt nicht an Klammern und ASCII-Komma - in deutschem
         Fliesstext stehen arabische Woerter aber genau so: "(في)" und "جر,".
         Ohne diesen Schritt melden sie eine Luecke, die nur ein Satzzeichen ist.
         Nicht in woerterAus selbst geaendert: dort haengen die anderen Runden
         dran, und die sind an ihren Zahlen geeicht. */
      const wort = rohwort.replace(/^[\s(«"'‹„]+|[\s),.;:!?«»"'›“]+$/g, '');
      if (!wort) return;
      regelWoerter++;
      const a = REGEL_AUSNAHMEN.find(x => x.trifft(wort));
      if (a) { regelAusgenommen++; return; }
      /* Der Koerper ist alles ausser dem letzten Zeichen: die Kasusendung
         allein macht ein Wort nicht vokalisiert. */
      if (HARAKA_IRGENDEINE.test(wort.slice(0, -1))) return;
      regelBefunde.push({
        quelle: 'grammar-data.js', id: r.id, feld, wort,
        grund: 'Wortkoerper ohne jedes Vokalzeichen',
      });
    });
  });
});

/* Aus Codepoints gebaut, nicht kopiert: gleiches Schriftbild bei anderen
   Codepoints waere hier nicht zu sehen und wuerde die Pruefung still
   verfehlen. [[zeichenklasse_nie_sichtbar_kopieren]] */
const IHFA_NUN = 'ن';
const IHFA_MIM = 'م';
const IHFA_BA  = 'ب';
const IQLAB_BA = 'ب';
const IHFA_BUCHSTABEN = 'تثجدذزسشصضطظفقك';

const SURAH_FELDER = ['arTaschkil'];
(SURAH_DATA || []).forEach(s => {
  SURAH_FELDER.forEach(feld => {
    const wert = s[feld];
    if (typeof wert !== 'string' || !wert.trim()) return;
    woerterAus(wert).forEach(wort => {
      woerterGeprueft++;
      for (let i = 0; i < wort.length; i++){
        const grund = luecke(wort, i);
        if (!grund) continue;
        /* Ein Surentitel steht fuer sich und traegt deshalb KEINE Kasusendung
           (Pausalform). "Endung fehlt" ist hier also kein Befund, sondern die
           richtige Schreibung — genau darum wird die Endung beim Holen ja
           entfernt, siehe werkzeuge/surennamen-holen.mjs. Ohne diese Zeile
           meldete das Skript 48 Luecken, die keine sind. */
        if (grund === 'Endung fehlt') continue;
        /* Die Muqattaʿat-Suren heissen nach den Buchstaben selbst (طه, يسٓ, صٓ,
           قٓ). Buchstabennamen tragen keine Harakat - auch die Quelle liefert
           sie ohne, und der Korantext schreibt sie ebenso. Kein Befund. */
        if (/^[طيصقنهرالمكعسحدذ]{1,3}[ٓ]?$/.test(wort)) continue;
        /* ⭐ Ein Nun ohne Zeichen VOR einem Ihfa-Buchstaben ist in der
           uthmani-Schreibung richtig, nicht luecken haft: das Nun wird dort
           verborgen gesprochen und traegt deshalb kein Sukun. Dasselbe gilt
           fuer das Mim vor Ba (Ihfa schafawi).

           ⛔ BELEGT AUS DEM KORANTEXT SELBST, nicht angenommen:
             8:1   يَسْـَٔلُونَكَ عَنِ ٱلْأَنفَالِ   -- Nun vor Fa, kein Sukun
             8:1   إِن كُنتُم مُّؤْمِنِينَ           -- Nun vor Ta, kein Sukun
             60:1  إِلَيْهِم بِٱلْمَوَدَّةِ          -- Mim vor Ba, kein Sukun

           Ohne diese Zeile meldete das Skript 6 Surennamen als Luecke, die in
           der Quelle korrekt geschrieben sind: \u0627\u0644\u0623\u0646\u0641\u0627\u0644 und funf weitere.
           [[zwei_rechtschreibungen_ein_text]] */
        if (grund !== 'Endung fehlt'){
          const naechster = wort.slice(i + 1).replace(/[\u064B-\u0652\u0670]/g, '')[0];
          if (wort[i] === IHFA_NUN && naechster && IHFA_BUCHSTABEN.includes(naechster)) continue;
          /* Iqlab: Nun vor Ba wird zu einem Mim und traegt statt eines Sukun
             das kleine Mim U+06E2 -- oder im Surennamen gar nichts.
             Beleg 2:33  أَنۢبِئْهُم  = U+0646 U+06E2 U+0628, kein Sukun.
             ⭐ Gegenprobe, damit die Regel nicht zu breit wird: vor einem
             IZHAR-Buchstaben steht das Sukun sehr wohl --
             6:99  مِنْهُ  und  يَنْعِهِ  tragen es. */
          if (wort[i] === IHFA_NUN && naechster === IQLAB_BA) continue;
          if (wort[i] === IHFA_MIM && naechster === IHFA_BA) continue;
        }
        const ausnahme = AUSNAHMEN.find(a => a.trifft(wort, i));
        if (ausnahme && !ausnahme.nurMelden) continue;
        befunde.push({
          quelle: 'surah-data.js', id: s.id, feld, wort,
          stelle: i, zeichen: wort[i], grund,
          gruppe: ausnahme ? ausnahme.name : grund
        });
        break;
      }
    });
  });
});

/* ---------- Die acht Buchdateien: der Bestand, den das GERAET hat ----------
   Gefunden am 10.08.2026 bei Elias' Punkt 11 ("Schweiz hat kein Taschkil").
   Bis dahin las dieses Skript genau drei Dateien — vocab-data.js,
   lehrbuch-saetze.js, surah-data.js. Auf Elias' Geraet kommen aber alle
   Kapitel ab 10 und alle sieben anderen Lehrwerke aus `data/vokabeln-*.js`;
   allein bei Madina 1 sind davon 140 Eintraege neu. "Der Pruefer ist gruen"
   hat also ueber einen anderen Bestand geurteilt als den, den Elias vor sich
   hat — und genau diese stille Luecke erzeugt eine Meldung wie seine.

   Warum die Buchbefunde den Rueckgabewert NICHT rot faerben:
   Die Dateien sind Elias' bezahlter arabicroots-Abzug. Sie liegen nicht im
   Repo (AGB Ziffer 9), sie sind nicht unsere Daten, und eine fehlende Haraka
   darin darf nicht selbst ergaenzt werden — das waere erfunden (E.1). Ein
   Tor, das man nicht passieren kann, ist kein Tor, sondern kaputt. Also:
   berichten statt sperren.

   Geprueft wird der ROHBESTAND der Dateien, nicht das Ergebnis von
   `einhaengen()`. Das ist Absicht und deckt mehr ab, nicht weniger: der
   Zusammenbau verwirft nur schlechtere Schreibungen und fuellt leere Felder,
   er erfindet nie eine Haraka. Jede Zeichenfolge, die aufs Geraet kommt,
   steht also schon hier. */
let eigeneAnzahl = 0;   // fuer den Geltungsbereich-Satz weiter unten
const BUCH_DIR = path.join(DIR, 'data');
const buchBefunde = [];
let buchWoerter = 0, buchEintraege = 0;
let buchDateien = [];
try {
  buchDateien = fs.readdirSync(BUCH_DIR).filter(f => /^vokabeln-.*\.js$/.test(f)).sort();
} catch { /* kein data/ — frischer Klon, siehe Ausgabe unten */ }

buchDateien.forEach(f => {
  let liste = null;
  try {
    const ctx = { window: {} };
    vm.createContext(ctx);
    /* ⛔ `vokabeln-eigene.js` schreibt NICHT nach window.VOKABELN, sondern nach
       window.EIGENE_VOKABELN — bewusst, damit die eigenen Vokabeln in der
       Buchauswahl nicht als achtes Buch erscheinen (siehe Kopf jener Datei).
       Bis zum 20.08.2026 meldete dieses Skript deshalb nur
       „kein VOKABELN gefunden" und ueberging SEINE elf Vokabeln stillschweigend
       — ausgerechnet die, bei denen die Vokalisierung von ihm selbst kommt und
       am ehesten Luecken hat. [[dritte_satzquelle]] */
    vm.runInContext(fs.readFileSync(path.join(BUCH_DIR, f), 'utf8') +
      '\nglobalThis.__V = (typeof VOKABELN !== "undefined") ? VOKABELN' +
      ' : (window.VOKABELN || window.EIGENE_VOKABELN' +
      ' || (typeof FACHBEGRIFF_VOKABELN !== "undefined" ? FACHBEGRIFF_VOKABELN : null));',
      ctx, { filename: f });
    liste = Array.isArray(ctx.__V) ? ctx.__V
          : (ctx.__V ? Object.values(ctx.__V).flat() : null);
  } catch (e) {
    console.error(`  ! ${f} nicht ausfuehrbar: ${e.message}`);
    return;
  }
  if (!liste) { console.error(`  ! ${f}: kein VOKABELN gefunden`); return; }
  /* ⭐⭐ vokabeln-eigene.js ist KEIN Abzug — es sind Elias' eigene Vokabeln,
     und die Vokalisierung darin stammt von ihm selbst. Die Begruendung, warum
     die uebrigen Buchdateien den Rueckgabewert nicht faerben ("fremde Daten,
     duerfen nicht selbst vokalisiert werden"), trifft auf sie nicht zu: er
     KANN sie aendern, und niemand sonst tut es.

     Bis zum 20.08.2026 fielen sie mit dem Abzug in dieselbe Gruppe. Gemessen
     hat das genau einen Befund verschluckt, den kein anderes Werkzeug sieht:
     إِلَيهِ in „مُضَافْ إِلَيهِ" — dem ي fehlt das Sukun.
     [[regel_gilt_nur_mit_begruendung]] */
  const eigene = f === 'vokabeln-eigene.js';
  if (eigene) eigeneAnzahl = liste.length;
  buchEintraege += eigene ? 0 : liste.length;
  liste.forEach(w => {
    const n = pruefeEintrag(w, eigene ? 'data/' + f : f, eigene ? befunde : buchBefunde);
    if (eigene) woerterGeprueft += n; else buchWoerter += n;
  });
});

/* ⛔⛔ SEINE SELBST ANGELEGTEN WOERTER — der vierte Weg in den Bestand.

   `addPersonalVocab()` legt sie in vt_personalVocab ab, also nur im
   localStorage; js/kern.js:245 schiebt sie beim Start in VOCAB_DATA. Sie sind
   damit voll im Lernbestand — und ausgerechnet bei ihnen kommt die
   Vokalisierung von IHM selbst, hat also am ehesten Luecken.

   Seit dem 20.08.2026 holt `vorrat.mjs --stand … --app auto` sie aus dem
   Geraeteabgleich nach data/eigene-woerter.json. Ohne diese Zeilen hier
   pruefte dieses Skript 189 Woerter, waehrend vorrat.mjs 203 mass.

   ⚠️ Geprueft wird mit pruefeEintrag(), der ECHTEN Funktion — ein Nachbau der
   Luecken-Erkennung waere genau der Fehler, den dieses Repo schon dreimal
   gesehen hat. [[handliste_neben_echter_quelle]] */
let selbstAnzahl = 0;
try {
  const d = JSON.parse(fs.readFileSync(path.join(DIR, 'data', 'eigene-woerter.json'), 'utf8'));
  const liste = Array.isArray(d.woerter) ? d.woerter : [];
  liste.forEach(w => { woerterGeprueft += pruefeEintrag(w, 'data/eigene-woerter.json'); });
  selbstAnzahl = liste.length;
} catch (e) {
  /* ⛔ Nicht schweigen. Fehlt die Datei, sind 14 Woerter UNGEPRUEFT, und ein
     gruener Lauf saehe genauso aus wie einer, der sie geprueft hat.
     [[ausfall_ist_unsichtbar_gebaut]] */
  console.log('  ⚠️ data/eigene-woerter.json fehlt — seine selbst angelegten');
  console.log('     Woerter sind NICHT geprueft. Sie entsteht bei');
  console.log('     node werkzeuge/vorrat.mjs --stand <datei> --app auto');
}

/* ⛔ Ein Wort kann in ZWEI Dateien stehen: Elias' eigene Vokabeln liegen
   sowohl in vocab-data.js (sein Lernbestand) als auch in
   data/vokabeln-eigene.js (der Abzug). Ohne diesen Schritt zaehlt derselbe
   Befund doppelt — am 20.08.2026 gemessen: 16 statt 14, und die zwei
   Ueberzaehligen waren الإِسْمُ und أَيْضاً.
   Eindeutig ist ein Befund durch id + Feld + Stelle.
   [[kandidatenliste_ist_keine_fehlerliste]] */
{
  const gesehen = new Set();
  for (let i = befunde.length - 1; i >= 0; i--){
    const b = befunde[i];
    const schluessel = String(b.id) + '|' + b.feld + '|' + b.stelle + '|' + b.wort;
    if (gesehen.has(schluessel)) befunde.splice(i, 1);
    else gesehen.add(schluessel);
  }
}

/* ⛔⛔ DIE GEPFLEGTE FASSUNG GEWINNT — der Schritt, den die Entdopplung darueber
   nicht schafft.

   Sie vergleicht id + Feld + Stelle + WORT. Steht dasselbe Wort in beiden
   Dateien unterschiedlich vokalisiert, sind das fuer sie zwei Befunde:

     data/vokabeln-eigene.js   مُضَافْ إِلَيهِ     (Roh-Abzug, Sukun fehlt)
     vocab-data.js             مُضَافْ إِلَيْهِ    (gepflegt, korrekt)

   Gemeldet wurde daraufhin die rohe Form — ein Befund, den Elias NIE beheben
   koennte: die App liest fuer dieses Wort ausschliesslich die gepflegte Fassung
   (js/buecher.js:538 ueberspringt jedes eigene Wort, dessen id schon in
   VOCAB_DATA steht), und hole-vokabeln.mjs schreibt den Abzug bei jeder Wartung
   neu. Eine Korrektur darin waere beim naechsten Lauf weg.

   ⚠️ Nur Woerter, die in BEIDEN stehen. Ein eigenes Wort, das noch nicht in
   vocab-data.js gepflegt ist, wird von der App sehr wohl aus dem Abzug gelesen —
   dort ist der Befund echt und bleibt stehen.
   [[pruefwerkzeug_laedt_mehr_als_die_app]] [[zwei_rechtschreibungen_ein_text]] */
{
  /* ⛔ NICHT nach der id filtern — das war am 20.08.2026 der erste Entwurf,
     und er verschluckte ZWEI ECHTE Befunde. أَيْضاً und الإِسْمُ stehen in beiden
     Dateien BUCHSTABENGLEICH; ihre Luecke ist also auch in vocab-data.js echt.
     Nur bei إِلَيهِ unterscheidet sich die Schreibung. Gemessen mit Codepoints,
     nicht nach Augenschein. [[entwurf_zu_grob]] [[zeichenklasse_nie_sichtbar_kopieren]]

     Der richtige Massstab ist das GEMELDETE WORT: kommt es in der gepflegten
     Fassung genauso vor, gilt der Befund dort auch. Kommt es nicht vor, hat
     die gepflegte Fassung es anders (richtig) — dann ist es ein Abzugs-Artefakt.
     ⚠️ NFC, sonst scheitert der Vergleich lautlos. [[arabisch_vergleichen_nfc]] */
  const nfc = s => String(s == null ? '' : s).normalize('NFC');
  const gepflegt = new Map((VOCAB_DATA || []).map(w => [String(w.id), w]));
  const vorher = befunde.length;
  for (let i = befunde.length - 1; i >= 0; i--){
    const b = befunde[i];
    if (!String(b.quelle || '').includes('vokabeln-eigene.js')) continue;
    const v = gepflegt.get(String(b.id));
    if (!v) continue;                       // nur im Abzug — dort liest die App ihn
    if (!nfc(v[b.feld]).includes(nfc(b.wort))) befunde.splice(i, 1);
  }
  if (vorher !== befunde.length)
    console.log('  (' + (vorher - befunde.length) + ' Befund(e) aus dem Roh-Abzug verworfen —'
      + ' das Wort liegt in vocab-data.js gepflegt vor)');
}

/* ---------- Ausgabe ---------- */
console.log('--- Vollstaendigkeit der Vokalisierung ---');
console.log(`${woerterGeprueft} arabische Woerter geprueft ` +
            `(Felder: ${FELDER.join(', ')}; quran.ar ausgenommen).`);

/* Der Geltungsbereich kommt IMMER mit — auch und gerade im gruenen Fall.
   Ein "alles vokalisiert" ohne diesen Satz war die eigentliche Falle. */
console.log(`
Geltungsbereich: vocab-data.js, lehrbuch-saetze.js, surah-data.js` +
            ` und data/vokabeln-eigene.js (${VOCAB_DATA.length} Lernwoerter + ${eigeneAnzahl} eigene`
            + (selbstAnzahl ? ` + ${selbstAnzahl} selbst angelegte` : ' + 0 selbst angelegte ⚠️') + `).`);

/* Die Regeln bekommen eine eigene Zeile mit eigener Zahl - nicht in die Summe
   oben gemischt. Sonst waere nach dem naechsten gruenen Lauf wieder unklar,
   ob sie ueberhaupt geprueft wurden. */
console.log(`Dazu grammar-data.js: ${(GRAMMAR_RULES || []).length} Regeln, ` +
            `${regelWoerter} arabische Woerter in ${REGEL_FELDER.join(' + ')}, ` +
            `${regelBefunde.length} Luecken` +
            ` (Zitierform ohne Kasusendung zaehlt NICHT als Luecke).`);
if (regelBefunde.length){
  const nachRegel = {};
  for (const b of regelBefunde) (nachRegel[b.id] = nachRegel[b.id] || []).push(b.wort);
  console.log('=== Regeln mit unvokalisierten Woertern: ' +
              Object.keys(nachRegel).length + ' ===');
  for (const [id, w] of Object.entries(nachRegel)){
    console.log(`  ${id}: ${[...new Set(w)].join(' · ')}`);
  }
  console.log('  ⚠️ Nicht selbst vokalisieren (E.1) - die Form im vorhandenen');
  console.log('     Bestand nachschlagen: vocab-data.js und lehrbuch-saetze.js');
  console.log('     kennen die meisten dieser Woerter voll vokalisiert.');
}
if (!buchDateien.length){
  console.log('Die acht data/vokabeln-*.js liegen hier nicht — auf Elias\' Geraet' +
              ' kommen von dort alle Kapitel ab 10 und sieben weitere Lehrwerke.' +
              ' Dieser Lauf sagt also NICHTS ueber deren Vokalisierung.');
} else {
  console.log(`Dazu ${buchDateien.length} Buchdateien mit ${buchEintraege} Eintraegen` +
              ` und ${buchWoerter} arabischen Woertern: ${buchBefunde.length} Luecken.` +
              ' Sie zaehlen NICHT zum Rueckgabewert (fremde Daten, nicht selbst' +
              ' zu vokalisieren) — mit --buecher stehen sie unten aufgeschluesselt.');
}

function zeigeBuchBericht(){
  if (!BUECHER || !buchBefunde.length) return;
  const nachBuch = {};
  buchBefunde.forEach(b => (nachBuch[b.gruppe] = nachBuch[b.gruppe] || []).push(b));
  console.log('\n--- Buchdateien (Bericht, kein Tor) ---');
  Object.entries(nachBuch).sort((a, b) => b[1].length - a[1].length)
    .forEach(([gruppe, liste]) => {
      const jeDatei = {};
      liste.forEach(b => jeDatei[b.quelle] = (jeDatei[b.quelle] || 0) + 1);
      console.log(`\n=== ${gruppe}: ${liste.length} ===`);
      console.log('  je Datei: ' + Object.entries(jeDatei)
        .sort((a, b) => b[1] - a[1])
        .map(([d, n]) => `${d.replace(/^vokabeln-|\.js$/g, '')} ${n}`).join(', '));
      (ALLE ? liste : liste.slice(0, 8)).forEach(b => console.log(
        `  ${b.wort.padEnd(18)} Stelle ${String(b.stelle).padStart(2)} ` +
        `(${b.zeichen})  ${b.feld}  id ${b.id}`));
      if (!ALLE && liste.length > 8)
        console.log(`  … ${liste.length - 8} weitere (--alle zeigt sie)`);
    });
  console.log('\n⚠️  Diese Luecken sind NICHT hier zu schliessen. Die Dateien sind' +
              '\n   Elias\' arabicroots-Abzug; eine selbst gesetzte Haraka waere' +
              '\n   erfunden (E.1). Belegen oder Elias vorlegen.');
  console.log('⚠️  "Endung fehlt" ist in einer Vokabelliste meist KEIN Fehler: das' +
              '\n   Stichwort steht in Pausalform, wie im Woerterbuch. Aussagekraeftig' +
              '\n   sind "Haraka fehlt" und die Hamzat-al-wasl-Gruppe.');
}

if (!befunde.length){
  console.log('\nKeine Luecke in den Repo-Dateien — dort ist alles vokalisiert.' +
    (buchBefunde.length ? ` (Die Buchdateien haben ${buchBefunde.length}.)` : ''));
  zeigeBuchBericht();
  process.exit(0);
}

/* Nach Gruppe zusammenfassen, damit ein systematischer Fall nicht als
   hundert Einzelbefunde erscheint. */
const nachGruppe = {};
befunde.forEach(b => (nachGruppe[b.gruppe] = nachGruppe[b.gruppe] || []).push(b));

Object.entries(nachGruppe)
  .sort((a, b) => b[1].length - a[1].length)
  .forEach(([gruppe, liste]) => {
    console.log(`\n=== ${gruppe}: ${liste.length} ===`);
    const zeigen = ALLE ? liste : liste.slice(0, 12);
    zeigen.forEach(b => console.log(
      `  ${b.wort.padEnd(18)} Stelle ${String(b.stelle).padStart(2)} ` +
      `(${b.zeichen})  ${b.feld}  id ${b.id}`));
    if (!ALLE && liste.length > zeigen.length)
      console.log(`  … ${liste.length - zeigen.length} weitere (--alle zeigt sie)`);
  });

const woerter = new Set(befunde.map(b => b.wort));
console.log(`\n${befunde.length} Befunde in ${woerter.size} verschiedenen Woertern.`);
console.log('⚠️  Nicht selbst vokalisieren: Beleg aus dem Madina-Schluessel oder');
console.log('   dem Lehrbuch holen, sonst Elias vorlegen (E.1 gilt auch fuer Harakat).');
zeigeBuchBericht();
process.exit(1);
