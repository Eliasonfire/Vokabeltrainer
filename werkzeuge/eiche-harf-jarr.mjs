/* eiche-harf-jarr.mjs — taugt die erweiterte Bedingung fuer harf-jarr-fi-ala-01?
   ==========================================================================
   pruefe-markierungen.js meldet EINEN Verdacht: die Markierung وَفِيهِ im Satz
   p_1787189488747 (Elias' eigene Vokabel „darin"). Die Bedingung lautet

       /^(في|على)(\s|$)/

   und وفيه beginnt weder mit في noch endet es dort — es ist و + في + ه.
   Inhaltlich ist die Markierung richtig: فِي ist der Harf jarr, هِ das
   angehaengte Pronomen. Nur die mechanische Pruefung kennt die Form nicht.

   ⛔ Eine Bedingung zu lockern, weil sie einmal anschlaegt, ist der falsche
   Reflex. Deshalb wird beidseitig gemessen: was kommt dazu, und was darf
   NICHT durchgehen. [[entwurf_zu_grob]]

   ⚠️ In eine Datei geschrieben statt als Shell-Einzeiler: das `$` und das
   `\s` im Muster ueberleben die Shell nicht. Der erste Anlauf meldete
   „neu: 1" statt 27 und liess „في البيت" durchfallen — beides Artefakte des
   Escapings, kein Befund. [[nutztext_nie_in_shell_strings]]
*/
import fs from 'node:fs';

const REPO = 'G:/1. Workspace/Vokabeltrainer';
const { SENTENCE_TAGS } =
  (new Function(fs.readFileSync(REPO + '/grammar-data.js', 'utf8') + ';return {SENTENCE_TAGS};'))();

const DIA = /[\u064B-\u0652\u0670\u0640\u0653-\u0655\u06D6-\u06ED]/g;
const blank = s => (s || '').normalize('NFC').replace(DIA, '').trim();

const alt = w => /^(في|على)(\s|$)/.test(blank(w));

/* ⭐ Drei Faelle, und der dritte ist der Grund fuer die Umstaendlichkeit:
     في   — allein oder mit angehaengtem Pronomen
     على  — mit Alif maqsura nur ALLEIN (davor darf ein و stehen)
     علي  — mit Ya nur MIT Pronomen; allein waere es der Name عَلِيّ
   Ohne die dritte Trennung liesse die Bedingung „Ali" durchgehen. */
/* ⛔ HIER STAND DIE BEDINGUNG ALS KOPIE (bis 21.08.2026). Sie war Zeichen
   fuer Zeichen dieselbe wie in pruefe-markierungen.js — und genau das ist
   das Problem: aendert jemand dort etwas, prueft diese Eichung weiter die
   alte Fassung und bleibt gruen. Sie eicht dann sich selbst.

   ⭐ eiche-zahlplural.mjs macht es seit jeher richtig und sagt auch warum:
   „Die Regex wird NICHT nachgebaut, sondern aus validate.js gelesen. Eine
   kopierte Fassung prueft nach dem ersten Umbau etwas anderes als das, was
   laeuft." Die Lehre stand also in der Nachbardatei und ist hier nie
   angekommen. [[handliste_neben_echter_quelle]]

   ⚠️ Beim Nachsehen hatte ich zuerst die FALSCHE Zeile als Original
   angesehen: `grep 'في|على'` traf nur harf-jarr-01 (Z. 121), weil dort die
   beiden Woerter direkt nebeneinander stehen. Daraus schien zu folgen, die
   Eichung pruefe eine Bedingung, die es gar nicht gibt. Sie steht sehr wohl
   dort — als harf-jarr-fi-ala-01, eine Zeile darueber.
   [[stichworttreffer_ist_kein_inhaltstreffer]] */
const REGEL = 'harf-jarr-fi-ala-01';
const mq = fs.readFileSync(REPO + '/pruefe-markierungen.js', 'utf8');
const mm = new RegExp("'" + REGEL + "':\\s*w\\s*=>\\s*/(.+?)/\\.test\\(blank\\(w\\)\\)").exec(mq);
if (!mm){
  console.log('⛔ In pruefe-markierungen.js steht keine Zeile');
  console.log("   `'" + REGEL + "': w => /…/.test(blank(w))` mehr.");
  console.log('   Entweder wurde die Regel umbenannt oder anders geschrieben —');
  console.log('   diese Eichung kann dann nicht sagen, ob sie noch passt.');
  process.exit(1);
}
console.log('  Regex aus pruefe-markierungen.js gelesen (' + REGEL + '):');
console.log('    /' + mm[1] + '/');
const neu = w => new RegExp(mm[1]).test(blank(w));

/* --- A) Wirkung auf die echten Markierungen --- */
let a = 0, n = 0; const dazu = [], weg = [];
const alleDieser = [];
for (const k of Object.keys(SENTENCE_TAGS)) for (const t of SENTENCE_TAGS[k]){
  if (t.ruleId !== 'harf-jarr-fi-ala-01') continue;
  alleDieser.push(t.matchText);
  const A = alt(t.matchText), N = neu(t.matchText);
  if (A) a++; if (N) n++;
  if (!A && N) dazu.push(t.matchText);
  if (A && !N) weg.push(t.matchText);
}
console.log('Markierungen dieser Regel: ' + alleDieser.length);
console.log('  alte Bedingung besteht: ' + a);
console.log('  neue Bedingung besteht: ' + n);
console.log('  zusaetzlich durchgelassen: ' + JSON.stringify(dazu));
console.log('  ⛔ NEU ABGELEHNT (darf leer sein): ' + JSON.stringify(weg));
console.log('');

/* --- B) Eichung an Faellen mit bekannter Antwort ---
   ⛔ Ohne die Nein-Faelle waere das ein Test, der nicht schlecht ausfallen
   kann. [[pruefwerkzeug_mit_eingebauter_antwort]] */
const FAELLE = [
  ['في',        1, 'der Harf jarr selbst'],
  ['على',       1, 'der zweite'],
  ['في البيت',  1, 'mit folgendem Nomen'],
  ['فيه',       1, 'في + angehaengtes Pronomen'],
  ['وفيه',      1, 'mit vorangestelltem wa — der gemeldete Fall'],
  ['فيها',      1, 'weibliches Pronomen'],
  ['عليه',      1, 'على wird zu علي vor Pronomen'],
  ['عليها',     1, 'dasselbe, weiblich'],
  ['وعليكم',    1, 'wa + على + kum'],
  ['علي',       0, '⭐ der Name Ali — darf NICHT durchgehen'],
  ['فيل',       0, 'Elefant'],
  ['فيلم',      0, 'Film'],
  ['عليم',      0, 'allwissend'],
  ['عالي',      0, 'hoch'],
  ['فيصل',      0, 'Eigenname']
];
let fehler = 0;
for (const [w, soll, warum] of FAELLE){
  const r = neu(w) ? 1 : 0;
  const ok = r === soll;
  if (!ok) fehler++;
  console.log('  ' + w.padEnd(12) + ' -> ' + r + '  soll ' + soll + '  ' + (ok ? 'ok' : '⛔ FALSCH') + '   ' + warum);
}
console.log('');
if (weg.length){ console.log('⛔ Die neue Bedingung wirft bestehende Markierungen weg — nicht uebernehmen.'); process.exit(1); }
if (fehler){ console.log('⛔ ' + fehler + ' Eichfall/-faelle falsch.'); process.exit(1); }
console.log('✔ ' + FAELLE.length + ' von ' + FAELLE.length + ' Eichfaellen richtig, keine bestehende Markierung verloren.');
