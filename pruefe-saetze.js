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
const { analysiereSatz, setzeLexikon } = require('./js/irab.js');

const P = __dirname + path.sep;
const { VOCAB_DATA } =
  (new Function(fs.readFileSync(P + 'vocab-data.js', 'utf8') + ';return {VOCAB_DATA};'))();
const { LEHRBUCH_SAETZE } =
  (new Function(fs.readFileSync(P + 'lehrbuch-saetze.js', 'utf8') + ';return {LEHRBUCH_SAETZE};'))();

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
setzeLexikon(wortschatz);
console.log(wortschatz.length
  ? `Wortarten aus ${wortschatz.length} Vokabeln geladen.`
  : 'Kein Vokabelabzug unter data/ - Analyse laeuft ohne Wortarten (Verben und Adjektive werden dann nicht erkannt).');

/* Ein paar von Elias' eigenen Eintraegen sind keine arabischen Saetze, sondern
   Erklaerungen ueber die Sprache: «فِي الْبَيْتِ»: «الْبَيْتِ» اسْمٌ مَجْرُورٌ.
   Darin steht ein Wort als Zitat, nicht in seiner Satzrolle - eine
   Kasusanalyse waere hier sinnlos. Erkennbar an den arabischen
   Anfuehrungszeichen. */
const istMetasprache = ar => /[«»]/.test(ar || '');

const quellen = [
  { name: 'Beispielsaetze aus vocab-data.js (verfasst, nicht belegt)',
    saetze: VOCAB_DATA.filter(v=>v.sentAr && !istMetasprache(v.sentAr))
                      .map(v=>({ id:v.id, ar:v.sentAr, de:v.sentDe })) },
  { name: 'Saetze aus dem Lehrwerk (Kontrollgruppe, muessen sauber sein)',
    saetze: LEHRBUCH_SAETZE.map(s=>({ id:s.id, ar:s.sentAr, de:s.sentDe, seite:s.seite })) }
];

for (const q of quellen){
  console.log(`\n=== ${q.name} ===`);
  let geprueft = 0, mitFehler = 0, unklar = 0;
  const befunde = [];

  for (const s of q.saetze){
    const teile = analysiereSatz(s.ar);
    const fehler = teile.filter(t => t.stimmt === false);
    const offen  = teile.filter(t => t.erwartet && !t.gelesen);
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
              `${unklar} mit mindestens einem unvokalisierten Wort.`);
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
