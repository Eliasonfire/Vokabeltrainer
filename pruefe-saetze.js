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
const { analysiereSatz, setzeLexikon, endungUnsichtbar } = require('./js/irab.js');

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
    saetze: LEHRBUCH_SAETZE.map(s=>({ id:s.id, ar:s.sentAr, de:s.sentDe, seite:s.seite })) }
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
console.log('\n=== LEXIKON-VERGLEICH: sieht die App dasselbe wie diese Pruefung? ===');
{
  const alleSaetze = [].concat(...quellen.map(q => q.saetze));
  const zerlege = (lexikon) => {
    setzeLexikon(lexikon);
    return alleSaetze.map(s => analysiereSatz(s.ar).map(t => t.wort + '\u0000' + t.rolle).join('\u0001'));
  };
  const mitAbzug = zerlege(wortschatz);
  const mitApp   = zerlege(VOCAB_DATA);
  const abweichend = [];
  alleSaetze.forEach((s, i) => { if (mitAbzug[i] !== mitApp[i]) abweichend.push({ s, a: mitAbzug[i], b: mitApp[i] }); });

  console.log(`  Abzug:  ${wortschatz.length} Eintraege, ${wortschatz.filter(v => v.type === 'verb').length} Verben`);
  console.log(`  App:    ${VOCAB_DATA.length} Eintraege, ${VOCAB_DATA.filter(v => v.type === 'verb').length} Verben`);
  if (!abweichend.length){
    console.log(`  ok  Alle ${alleSaetze.length} Saetze werden gleich zerlegt — die Pruefung oben gilt auch fuer die App.`);
  } else {
    console.log(`  ⚠ ${abweichend.length} von ${alleSaetze.length} Saetzen werden UNTERSCHIEDLICH zerlegt.`);
    console.log('    Was hier steht, sieht Elias anders als diese Pruefung. Feste Listen in');
    console.log('    js/irab.js (VERBEN, NICHT_VERB, FUENF_NOMEN) machen die Zerlegung unabhaengig.');
    for (const x of abweichend.slice(0, 12)){
      console.log('    ── ' + x.s.id + '  ' + x.s.ar);
      const A = x.a.split('\u0001'), B = x.b.split('\u0001');
      A.forEach((w, i) => {
        if (w === B[i]) return;
        const [wort, r1] = w.split('\u0000'), r2 = (B[i] || '').split('\u0000')[1];
        console.log('        ' + wort.padEnd(14) + 'Abzug: ' + String(r1).padEnd(30) + '| App: ' + r2);
      });
    }
    if (abweichend.length > 12) console.log('    … und ' + (abweichend.length - 12) + ' weitere.');
  }
  /* Das Lexikon so zuruecklassen, wie der Rest der Datei es erwartet. */
  setzeLexikon(wortschatz);
}
