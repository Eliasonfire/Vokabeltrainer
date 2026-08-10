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
let VOCAB_DATA = null, LEHRBUCH_SAETZE = null, SURAH_DATA = null;
try {
  let code = '';
  for (const f of ['vocab-data.js', 'lehrbuch-saetze.js', 'surah-data.js'])
    code += fs.readFileSync(path.join(DIR, f), 'utf8') + '\n';
  code += 'globalThis.__D = { VOCAB_DATA, LEHRBUCH_SAETZE, SURAH_DATA };';
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  ({ VOCAB_DATA, LEHRBUCH_SAETZE, SURAH_DATA } = ctx.__D);
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
        const ausnahme = AUSNAHMEN.find(a => a.trifft(wort, i));
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

/* Surentitel, seit 04.08.2026 (Elias' Punkt 5). Geprueft wird NUR
   `arTaschkil` - das Feld `ar` daneben ist absichtlich unvokalisiert, es ist
   der Suchname und die Rueckfallebene. Deshalb eine eigene Runde mit eigenem
   Feld statt surah-data.js in FELDER aufzunehmen: sonst meldete das Skript
   114 Luecken, die keine sind. */
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
    vm.runInContext(fs.readFileSync(path.join(BUCH_DIR, f), 'utf8') +
      '\nglobalThis.__V = (typeof VOKABELN !== "undefined") ? VOKABELN : (window.VOKABELN || null);',
      ctx, { filename: f });
    liste = Array.isArray(ctx.__V) ? ctx.__V
          : (ctx.__V ? Object.values(ctx.__V).flat() : null);
  } catch (e) {
    console.error(`  ! ${f} nicht ausfuehrbar: ${e.message}`);
    return;
  }
  if (!liste) { console.error(`  ! ${f}: kein VOKABELN gefunden`); return; }
  buchEintraege += liste.length;
  liste.forEach(w => { buchWoerter += pruefeEintrag(w, f, buchBefunde); });
});

/* ---------- Ausgabe ---------- */
console.log('--- Vollstaendigkeit der Vokalisierung ---');
console.log(`${woerterGeprueft} arabische Woerter geprueft ` +
            `(Felder: ${FELDER.join(', ')}; quran.ar ausgenommen).`);

/* Der Geltungsbereich kommt IMMER mit — auch und gerade im gruenen Fall.
   Ein "alles vokalisiert" ohne diesen Satz war die eigentliche Falle. */
console.log(`\nGeltungsbereich: vocab-data.js, lehrbuch-saetze.js, surah-data.js` +
            ` (${VOCAB_DATA.length} Lernwoerter).`);
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
