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
             node pruefe-taschkil.js --alle     jeden Befund einzeln
   Rueckgabe: 0 = alles vokalisiert, 1 = mindestens eine Luecke.

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
let VOCAB_DATA = null, LEHRBUCH_SAETZE = null;
try {
  let code = '';
  for (const f of ['vocab-data.js', 'lehrbuch-saetze.js'])
    code += fs.readFileSync(path.join(DIR, f), 'utf8') + '\n';
  code += 'globalThis.__D = { VOCAB_DATA, LEHRBUCH_SAETZE };';
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  ({ VOCAB_DATA, LEHRBUCH_SAETZE } = ctx.__D);
} catch (e) {
  console.error('Datendateien nicht ausfuehrbar: ' + e.message);
  process.exit(1);
}

/* `quran.ar` ist AUSGENOMMEN: Uthmani folgt eigenen Schreibregeln (ٱ, kleine
   Zeichen, Rezitationsmarken) und ist keine Vorlage fuer Elias' Schreibung. */
const FELDER = ['ar', 'sg', 'pl', 'femSg', 'femPl', 'sentAr'];

const befunde = [];
let woerterGeprueft = 0;

function pruefeEintrag(eintrag, quelle){
  FELDER.forEach(feld => {
    const wert = eintrag[feld];
    if (typeof wert !== 'string' || !wert.trim()) return;
    woerterAus(wert).forEach(wort => {
      woerterGeprueft++;
      for (let i = 0; i < wort.length; i++){
        const grund = luecke(wort, i);
        if (!grund) continue;
        const ausnahme = AUSNAHMEN.find(a => a.trifft(wort, i));
        if (ausnahme && !ausnahme.nurMelden) continue;
        befunde.push({
          quelle, id: eintrag.id, feld, wort,
          stelle: i, zeichen: wort[i], grund,
          gruppe: ausnahme ? ausnahme.name : grund
        });
        break;                      // ein Befund je Wort reicht
      }
    });
  });
}

VOCAB_DATA.forEach(w => pruefeEintrag(w, 'vocab-data.js'));
(LEHRBUCH_SAETZE || []).forEach(s => pruefeEintrag(s, 'lehrbuch-saetze.js'));

/* ---------- Ausgabe ---------- */
console.log('--- Vollstaendigkeit der Vokalisierung ---');
console.log(`${woerterGeprueft} arabische Woerter geprueft ` +
            `(Felder: ${FELDER.join(', ')}; quran.ar ausgenommen).`);

if (!befunde.length){
  console.log('\nKeine Luecke gefunden — alles vokalisiert.');
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
process.exit(1);
