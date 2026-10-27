/* test-welche-regel-eindeutig.mjs — bewacht Elias' Eingang vom 25.10.2026 zu
 * „9. Welche Regel?" (Vault, Notiz „2026-10-25 Vokabeltrainer To-Do – Satz-Modus
 * Mehrdeutigkeit"): M1 · Kap. 5, Satz hadhihi bintu l-mudarrisi (45838),
 * hervorgehoben bintu, gewertet „muḍāf (bestimmt ohne al)". Zur Wahl standen
 * dazu „muḍāf erkennen" und „Iḍāfa", die an diesem Wort BEIDE auch stimmen,
 * und „Ortsangabe als muḍāf". Seine Sätze (das Arabische im ersten in Umschrift):
 *
 *   „Außer ‚Ortsangabe als muḍāf (z.B. taḥta)' könnten alle Optionen richtig sein"
 *   „Die Distraktoren sind keine echten Falschantworten, sondern Beschreibungen derselben Regel."
 *
 * Auftrag in der Notiz: Fragen/Distraktoren so prüfen, dass pro Frage nur eine
 * Option eindeutig stimmt.
 *
 * Umgesetzt am 27.10.2026 in js/uebung.js: uebungMitWahr() sagt, welche Regeln
 * an der hervorgehobenen Stelle mit der richtigen gelten, und baue() bietet sie
 * nicht als falsche Antwort an. uebungAblenker() bietet keine Regel mit
 * demselben Namensstamm mehr an und aus anderen Themen nur noch Regeln, deren
 * Name das hervorgehobene Wort nennt. ⚠️ Welche Regeln zusammen gelten, ist
 * MEINE Lesart der Regeltexte, nicht seine Entscheidung.
 *
 * Fragen, für die das Thema keine zwei sicher falschen Antworten hat, entstehen
 * dadurch nicht mehr (586 statt 762). Auf die Frage, ob sie mit falschen
 * Antworten aus anderen Themen zurückkommen sollen, Elias am 27.10.2026:
 *
 *   „Nein, die weggefallenen Fragen in „Welche Regel?“ sollen wegbleiben.“
 *
 * → Prüfung 7 bewacht genau das.
 *
 * Geprüft wird an der echten Übung, an allen markierten Sätzen, mit dem Lexikon
 * wie in der App: auch Fachbegriffe, Kalender und die Buchvokabeln
 * (data/vokabeln-*.js, nur gelesen, nie ins Repo). Ohne die Bücher hält die
 * Analyse Verben wie sakana für Nomen (gemessen 27.10.2026). Die falschen
 * Antworten werden zufällig gemischt; deshalb wird jede Aufgabe 30-mal gebaut.
 *
 *   node test-welche-regel-eindeutig.mjs              prüfen
 *   node test-welche-regel-eindeutig.mjs --stoertest  beweisen, dass jede Prüfung rot werden kann
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const WURZEL = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const STOERTEST = process.argv.includes('--stoertest');
const LAEUFE = 30;
/* Gemessen am 27.10.2026: 586 Aufgaben je Aufbau (vorher 762). Fällt die Zahl
   darunter, schließt die Zuordnung vermutlich mehr aus, als sie soll. */
const MINDEST_AUFGABEN = 500;

/* Sein Satz, wörtlich aus der Notiz vom 25.10.2026. */
const ZITAT = 'Die Distraktoren sind keine echten Falschantworten, sondern Beschreibungen derselben Regel.';

/* ⛔ CRLF → LF beim Lesen, sonst finden die Schneidefunktionen das Ende an `;\n`
   nicht (wie in test-welche-regel.mjs). [[zeilenende_r_bricht_muster]] */
const lies = datei => fs.readFileSync(path.join(WURZEL, datei), 'utf8').replace(/\r\n/g, '\n');
const UEBUNG = lies('js/uebung.js');
const KERN = lies('js/kern.js');
const irab = require('./js/irab.js');
const lade = (datei, name) => (new Function(lies(datei) + ';return ' + name + ';'))();
const optional = (datei, name, leer) => { try { return lade(datei, name); } catch (e) { return leer; } };
const VOCAB_DATA = lade('vocab-data.js', 'VOCAB_DATA');
const LEHRBUCH_SAETZE = lade('lehrbuch-saetze.js', 'LEHRBUCH_SAETZE');
const BEISPIELSAETZE = optional('data/beispielsaetze.js', 'BEISPIELSAETZE', {});
const FACH = optional('data/fachbegriffe.js', 'FACHBEGRIFF_VOKABELN', []);
const KALENDER = optional('data/kalender.js', 'KALENDER_VOKABELN', []);
const G = new Function(lies('grammar-data.js') + ';return {GRAMMAR_RULES, SATZ_THEMEN, SENTENCE_TAGS};')();
const REGEL = new Map(G.GRAMMAR_RULES.map(r => [r.id, r]));

/* Lexikon in der Reihenfolge der App: vocab-data.js, Fachbegriffe, Kalender
   (js/kern.js), dann die Bücher (js/buecher.js). Die eigenen Wörter aus seinem
   Browser fehlen hier — die hat nur er. */
const fenster = {};
const BUCH_DATEIEN = fs.readdirSync(path.join(WURZEL, 'data')).filter(f => /^vokabeln-.+\.js$/.test(f));
for (const f of BUCH_DATEIEN) (new Function('window', lies('data/' + f)))(fenster);
const BUCH = Object.values(fenster.VOKABELN || {}).flat();
irab.setzeLexikon([...VOCAB_DATA, ...FACH, ...KALENDER, ...BUCH]);

/* Jeder markierte Satz, aus welcher Quelle er auch kommt. */
const TEXT = new Map();
const nimm = (id, s) => { if (s && s.sentAr && !TEXT.has(String(id))) TEXT.set(String(id), s); };
VOCAB_DATA.forEach(w => nimm(w.id, w));
LEHRBUCH_SAETZE.forEach(s => nimm(s.id, s));
Object.keys(BEISPIELSAETZE).forEach(id => nimm(id, BEISPIELSAETZE[id]));
FACH.forEach(w => nimm(w.id, w));
const SAETZE = Object.keys(G.SENTENCE_TAGS).filter(id => TEXT.has(id))
  .map(id => ({ id, sentAr: TEXT.get(id).sentAr, sentDe: TEXT.get(id).sentDe || '' }));
const ANALYSEN = SAETZE.map(s => ({ s, z: irab.analysiereSatz(s.sentAr) }));

/* Sein Fall: Satz 45838, das Wort bintu (Skelett b-n-t, ohne Vokalzeichen). */
const FALL_SATZ = '45838';
const FALL_ANTWORT = 'mudaf-ohne-al-01';
const FALL_SKELETT = String.fromCodePoint(0x0628, 0x0646, 0x062A);
const ohneZeichen = s => String(s || '').normalize('NFC').replace(/[ـً-ٰٟ]/g, '');
/* Eine Iḍāfa-Kette aus dem Bestand: masjidu rasūli llāhi (Skelette m-s-j-d, r-s-w-l). */
const KETTE_SATZ = 'mb1-29-1';
const KETTE_ANFANG = String.fromCodePoint(0x0645, 0x0633, 0x062C, 0x062F);
const KETTE_MITTE = String.fromCodePoint(0x0631, 0x0633, 0x0648, 0x0644);

/* Stichproben: Paare, die nach den Regeltexten an derselben Stelle zusammen
   gelten — hier FEST, unabhängig von den Listen in js/uebung.js. Wer dort eine
   Zeile streicht, wird hier rot, auch wenn der Vergleich mit uebungMitWahr()
   (Prüfung 5) dann mitzieht. [richtige Antwort, nie zugleich als falsche, muss gefragt sein] */
const STICHPROBEN = [
  ['mudaf-ohne-al-01', ['idafa-01', 'idafa-erkennen-01', 'mudaf-01'], true],   // sein Fall bintu
  ['mudaf-01', ['idafa-01', 'idafa-erkennen-01', 'mudaf-ohne-al-01'], true],
  ['mudaf-ilayh-01', ['idafa-01', 'idafa-zweitglied-01'], true],               // zweites Wort der Iḍāfa
  ['idafa-zweitglied-01', ['idafa-01', 'mudaf-ilayh-01'], true],
  ['harf-jarr-fi-ala-01', ['harf-jarr-01'], true],                             // fī ist ein ḥarf jarr
  ['ismul-isara-dhalika-01', ['kaf-der-entfernung-01'], true],                 // dhālika trägt das kāf der Entfernung
  ['zarf-maa-inda-01', ['zarf-01'], true],                                     // maʿa ist ein ẓarf
  ['alif-maqsura-01', ['alif-maqsura-unveraenderlich-01'], false],
  ['schams-qamar-01', ['al-tanwin-tilgung-01', 'nakira-marifa-01', 'al-gesamtheit-01'], false]   // jedes Wort mit al
];

/* ⛔ Welche falsche Antwort neben welcher richtigen am 27.10.2026 geprüft wurde: alle
   363 Paare, die „Welche Regel?" an diesem Tag anbieten konnte (gleich in 40 und in
   300 Aufbauten), jede falsche Antwort am Wort der richtigen gelesen — MEINE Lesart
   der Regeltexte, nicht seine. Kommt ein neues Paar dazu (neue Regel, neu markierter
   Satz, geänderte Zuordnung), wird Prüfung 8 rot, bis es jemand geprüft hat:
   1. Gilt die falsche Antwort an diesem Wort mit der richtigen? Dann in js/uebung.js
      eintragen (UEBUNG_ZUSAMMEN usw., erklärt beim Block „JE FRAGE NUR EINE RICHTIGE
      ANTWORT") — im Zweifel ja: eine Aufgabe weniger ist besser als zwei richtige.
   2. Sonst hier anhängen, mit Datum im Kommentar.
   ⛔ Nie ungelesen übernehmen — dann prüft der Test nichts mehr. */
const GEPRUEFT = {
  'adjektive-an-ohne-tanwin-01': 'adjektive-steigerung-akbar-01 ismun-mawsul-alladhi-01 ismun-mawsul-allati-01 mutabaqa-genus-01 nat-bestimmter-mudaf-01 nat-eigenname-01 nat-fem-01',
  'alif-maqsura-01': 'irab-drei-faelle-01 mamnu-min-as-sarf-01 mamnu-min-as-sarf-namen-01 mamnu-min-as-sarf-plural-01 marfu-grundfall-01 tanwin-eigennamen-01 tanwin-fath-alif-01 tanwin-maennername-ta-01 tanwin-nach-harf-jarr-01 ya-nida-01',
  'alif-maqsura-unveraenderlich-01': 'irab-drei-faelle-01 mamnu-min-as-sarf-01 mamnu-min-as-sarf-namen-01 mamnu-min-as-sarf-plural-01 marfu-grundfall-01 tanwin-eigennamen-01 tanwin-fath-alif-01 tanwin-maennername-ta-01 tanwin-nach-harf-jarr-01 ya-nida-01',
  'eigennamen-fem-ohne-tanwin-01': 'fem-ohne-ta-marbuta-01 koerperteile-genus-01',
  'fem-bildung-01': 'eigennamen-fem-ohne-tanwin-01 fem-ohne-ta-marbuta-01 koerperteile-genus-01',
  'fem-ohne-ta-marbuta-01': 'eigennamen-fem-ohne-tanwin-01 fem-bildung-01 ta-marbuta-fem-01 ta-marbuta-grenzen-01',
  'fragepartikel-alif-01': 'istifham-ayna-01 istifham-liman-01 istifham-madha-01 istifham-men-01 min-ayna-01 min-man-unterscheiden-01',
  'harf-jarr-01': 'harf-jarr-fi-ala-01 harf-jarr-min-ila-01 mina-al-01',
  'harf-jarr-bi-01': 'harf-jarr-fi-ala-01 harf-jarr-idafa-01 harf-jarr-li-01 harf-jarr-min-ila-01 hurufu-jarr-bedeutungen-01 li-al-lil-01 li-eigenname-01 li-mit-suffix-01 li-vs-inda-01 lil-vs-li-01 mina-al-01',
  'harf-jarr-fi-ala-01': 'harf-jarr-bi-01 harf-jarr-bi-fi-01 harf-jarr-idafa-01 harf-jarr-li-01 harf-jarr-min-ila-01 hu-nach-kasra-01 li-al-lil-01 li-eigenname-01 li-mit-suffix-01 li-vs-inda-01 lil-vs-li-01 mina-al-01 nat-bestimmter-mudaf-01',
  'harf-jarr-idafa-01': 'harf-jarr-bi-01 harf-jarr-bi-fi-01 harf-jarr-li-01 li-al-lil-01 li-eigenname-01 li-mit-suffix-01 li-vs-inda-01 lil-vs-li-01 mina-al-01',
  'harf-jarr-li-01': 'harf-jarr-bi-01 harf-jarr-bi-fi-01 harf-jarr-fi-ala-01 harf-jarr-idafa-01 harf-jarr-min-ila-01 mina-al-01',
  'harf-jarr-min-ila-01': 'istifham-liman-01 istifham-men-01 mamnu-min-as-sarf-01 nat-bestimmter-mudaf-01 zarf-mansub-01',
  'hurufu-jarr-bedeutungen-01': 'harf-jarr-bi-01 harf-jarr-bi-fi-01 harf-jarr-fi-ala-01 harf-jarr-min-ila-01 mina-al-01',
  'huwa-hiya-weitere-01': 'huwa-hiya-01 verb-enthaelt-pronomen-01',
  'idafa-01': 'idafa-ayyu-01 idafa-kein-adjektiv-01 idafa-verkettung-01 possessiv-ist-idafa-01 zarf-als-mudaf-01',
  'idafa-ayyu-01': 'istifham-ayna-01 min-ayna-01 zarf-al-yawma-heute-01',
  'idafa-erkennen-01': 'idafa-kein-adjektiv-01 idafa-verkettung-01 possessiv-ist-idafa-01 zarf-als-mudaf-01',
  'idafa-kein-adjektiv-01': 'idafa-01 idafa-ayyu-01 idafa-erkennen-01 idafa-verkettung-01 idafa-zweitglied-01 mudaf-01 mudaf-ilayh-01 mudaf-ohne-al-01 possessiv-ist-idafa-01 zarf-als-mudaf-01',
  'idafa-verkettung-01': 'idafa-ayyu-01 idafa-kein-adjektiv-01 possessiv-ist-idafa-01 zarf-als-mudaf-01',
  'idafa-zweitglied-01': 'idafa-ayyu-01 idafa-kein-adjektiv-01 idafa-verkettung-01 mudaf-01 mudaf-ohne-al-01 possessiv-ist-idafa-01 zarf-als-mudaf-01',
  'irab-drei-faelle-01': 'alif-maqsura-01 alif-maqsura-unveraenderlich-01',
  'isara-genus-kongruenz-01': 'ismul-isara-haulai-01 ismul-isara-ulaika-01',
  'ismul-isara-dhalika-01': 'ismul-isara-hadha-01 ismul-isara-haulai-01 ismul-isara-tilka-01 ismul-isara-ulaika-01',
  'ismul-isara-ulaika-01': 'isara-genus-kongruenz-01 ismul-isara-dhalika-01 ismul-isara-hadha-01 ismul-isara-tilka-01',
  'istifham-men-01': 'harf-jarr-min-ila-01 mamnu-min-as-sarf-01 min-ayna-01 mina-al-01 zarf-mansub-01',
  'jam-muannath-salim-01': 'jam-mudhakkar-salim-01 jam-taksir-01',
  'jam-mudhakkar-salim-01': 'jam-muannath-salim-01 jam-taksir-01',
  'jam-taksir-01': 'jam-muannath-salim-01 jam-mudhakkar-salim-01',
  'jumla-ismiya-filiya-01': 'badal-01 mubtada-khabar-01 mubtada-khabar-genus-01 satz-vs-wortgruppe-01',
  'kaf-der-entfernung-01': 'ismul-isara-hadha-01 ismul-isara-haulai-01',
  'koerperteile-genus-01': 'eigennamen-fem-ohne-tanwin-01 fem-bildung-01 ta-marbuta-fem-01 ta-marbuta-grenzen-01',
  'li-al-lil-01': 'harf-jarr-bi-01 harf-jarr-bi-fi-01 harf-jarr-fi-ala-01 harf-jarr-idafa-01 harf-jarr-min-ila-01 li-eigenname-01 li-mit-suffix-01 li-vs-inda-01 mina-al-01',
  'li-eigenname-01': 'harf-jarr-bi-01 harf-jarr-bi-fi-01 harf-jarr-fi-ala-01 harf-jarr-idafa-01 harf-jarr-min-ila-01 li-al-lil-01 li-mit-suffix-01 li-vs-inda-01 mina-al-01',
  'li-mit-suffix-01': 'harf-jarr-bi-01 harf-jarr-bi-fi-01 harf-jarr-fi-ala-01 harf-jarr-idafa-01 harf-jarr-min-ila-01 li-al-lil-01 li-eigenname-01 lil-vs-li-01 mina-al-01',
  'li-vs-inda-01': 'harf-jarr-bi-01 harf-jarr-bi-fi-01 harf-jarr-fi-ala-01 harf-jarr-idafa-01 harf-jarr-min-ila-01 li-al-lil-01 li-eigenname-01 lil-vs-li-01 mina-al-01',
  'lil-vs-li-01': 'harf-jarr-bi-01 harf-jarr-bi-fi-01 harf-jarr-fi-ala-01 harf-jarr-idafa-01 harf-jarr-min-ila-01 li-mit-suffix-01 li-vs-inda-01 mina-al-01',
  'mamnu-min-as-sarf-01': 'alif-maqsura-01 alif-maqsura-unveraenderlich-01 tanwin-fath-alif-01 tanwin-nach-harf-jarr-01 ya-nida-01',
  'mamnu-min-as-sarf-plural-01': 'alif-maqsura-01 alif-maqsura-unveraenderlich-01 tanwin-eigennamen-01 tanwin-fath-alif-01 tanwin-maennername-ta-01 tanwin-nach-harf-jarr-01 ya-nida-01',
  'marfu-grundfall-01': 'alif-maqsura-01 alif-maqsura-unveraenderlich-01 tanwin-fath-alif-01 tanwin-nach-harf-jarr-01',
  'min-ayna-01': 'istifham-liman-01 istifham-men-01 mamnu-min-as-sarf-01 mina-al-01 zarf-mansub-01',
  'mina-al-01': 'harf-jarr-bi-fi-01 istifham-liman-01 istifham-men-01 mamnu-min-as-sarf-01 min-ayna-01 nat-bestimmter-mudaf-01 zarf-mansub-01',
  'mubtada-khabar-genus-01': 'badal-01 jumla-ismiya-filiya-01 wortstellung-fokus-01',
  'mudaf-01': 'idafa-ayyu-01 idafa-kein-adjektiv-01 idafa-verkettung-01 idafa-zweitglied-01 mudaf-ilayh-01 possessiv-ist-idafa-01 zarf-als-mudaf-01',
  'mudaf-ilayh-01': 'idafa-ayyu-01 idafa-kein-adjektiv-01 idafa-verkettung-01 mudaf-01 mudaf-ohne-al-01 possessiv-ist-idafa-01 zarf-als-mudaf-01',
  'mudaf-ohne-al-01': 'idafa-ayyu-01 idafa-kein-adjektiv-01 idafa-verkettung-01 idafa-zweitglied-01 mudaf-ilayh-01 possessiv-ist-idafa-01 zarf-als-mudaf-01',
  'mudari-erkennen-01': 'mudari-sa-zukunft-01 verb-madi-endungen-01',
  'mutabaqa-genus-01': 'adjektive-an-ohne-tanwin-01 adjektive-steigerung-akbar-01 ismun-mawsul-alladhi-01 ismun-mawsul-allati-01 nat-bestimmter-mudaf-01 nat-eigenname-01',
  'nat-bestimmtheit-01': 'adjektive-an-ohne-tanwin-01 adjektive-steigerung-akbar-01 ismun-mawsul-alladhi-01 ismun-mawsul-allati-01',
  'nat-eigenname-01': 'adjektive-an-ohne-tanwin-01 adjektive-steigerung-akbar-01 ismun-mawsul-alladhi-01 ismun-mawsul-allati-01 mutabaqa-genus-01 nat-bestimmter-mudaf-01 nat-fem-01',
  'nat-fem-01': 'adjektive-an-ohne-tanwin-01 adjektive-steigerung-akbar-01 ismun-mawsul-alladhi-01 ismun-mawsul-allati-01 nat-bestimmter-mudaf-01 nat-eigenname-01',
  'nat-vier-bedingungen-01': 'adjektive-steigerung-akbar-01 ismun-mawsul-alladhi-01 ismun-mawsul-allati-01',
  'nat-wen-beschreibt-01': 'adjektive-an-ohne-tanwin-01 adjektive-steigerung-akbar-01 ismun-mawsul-alladhi-01 ismun-mawsul-allati-01 nat-bestimmter-mudaf-01 nat-eigenname-01',
  'possessiv-ist-idafa-01': 'idafa-ayyu-01 idafa-kein-adjektiv-01 idafa-verkettung-01 zarf-als-mudaf-01',
  'ta-marbuta-fem-01': 'eigennamen-fem-ohne-tanwin-01 fem-ohne-ta-marbuta-01 koerperteile-genus-01',
  'ta-marbuta-grenzen-01': 'eigennamen-fem-ohne-tanwin-01 fem-ohne-ta-marbuta-01 koerperteile-genus-01',
  'tanwin-eigennamen-01': 'alif-maqsura-01 alif-maqsura-unveraenderlich-01 mamnu-min-as-sarf-namen-01 mamnu-min-as-sarf-plural-01 tanwin-fath-alif-01 tanwin-maennername-ta-01 tanwin-nach-harf-jarr-01 ya-nida-01',
  'tanwin-fath-alif-01': 'alif-maqsura-01 alif-maqsura-unveraenderlich-01 mamnu-min-as-sarf-01 mamnu-min-as-sarf-namen-01 mamnu-min-as-sarf-plural-01 marfu-grundfall-01 tanwin-eigennamen-01 tanwin-maennername-ta-01 tanwin-nach-harf-jarr-01 ya-nida-01',
  'tanwin-maennername-ta-01': 'alif-maqsura-01 alif-maqsura-unveraenderlich-01 mamnu-min-as-sarf-plural-01 tanwin-fath-alif-01 tanwin-nach-harf-jarr-01 ya-nida-01',
  'tanwin-nach-harf-jarr-01': 'alif-maqsura-01 alif-maqsura-unveraenderlich-01 mamnu-min-as-sarf-01 mamnu-min-as-sarf-namen-01 mamnu-min-as-sarf-plural-01 marfu-grundfall-01 tanwin-fath-alif-01 tanwin-maennername-ta-01 ya-nida-01',
  'verb-madi-endungen-01': 'mudari-erkennen-01 mudari-sa-zukunft-01',
  'wortarten-01': 'huwa-hiya-01 huwa-hiya-weitere-01 verb-enthaelt-pronomen-01',
  'zarf-01': 'inda-ort-und-zeit-01 zarf-al-yawma-heute-01 zarf-maa-inda-01 zuruf-makan-01',
  'zarf-als-mudaf-01': 'idafa-ayyu-01 idafa-kein-adjektiv-01 idafa-verkettung-01 possessiv-ist-idafa-01',
  'zarf-maa-inda-01': 'zarf-al-yawma-heute-01 zuruf-makan-01',
  'zarf-makan-rollenname-01': 'inda-ort-und-zeit-01 zarf-al-yawma-heute-01 zarf-maa-inda-01',
  'zarf-mansub-01': 'inda-ort-und-zeit-01 zarf-al-yawma-heute-01 zarf-maa-inda-01',
  'zuruf-makan-01': 'inda-ort-und-zeit-01 zarf-al-yawma-heute-01 zarf-maa-inda-01',
  'zuruf-makan-weitere-01': 'inda-ort-und-zeit-01 zarf-al-yawma-heute-01 zarf-maa-inda-01 zuruf-makan-01'
};
const GEPRUEFT_PAARE = new Set(Object.entries(GEPRUEFT).flatMap(([a, bs]) => bs.split(' ').map(b => a + ' → ' + b)));

function schneideFunktion(text, name){
  const anfang = text.indexOf('function ' + name + '(');
  if (anfang < 0) return null;
  let i = text.indexOf('{', anfang), tiefe = 0;
  for (; i < text.length; i++){
    if (text[i] === '{') tiefe++;
    else if (text[i] === '}'){ tiefe--; if (!tiefe) return text.slice(anfang, i + 1); }
  }
  return null;
}
function schneideZeile(text, kopf){
  const a = text.indexOf(kopf);
  return a < 0 ? null : text.slice(a, text.indexOf(';\n', a) + 1);
}
function schneideListe(text, kopf){
  const a = text.indexOf(kopf);
  if (a < 0) return null;
  const e = text.indexOf('\n];', a);
  return e < 0 ? null : text.slice(a, e + 3);
}
function schneideMitWahr(text){
  const a = text.indexOf('const UEBUNG_ZUSAMMEN = [');
  const f = schneideFunktion(text, 'uebungMitWahr');
  return (a < 0 || !f) ? null : text.slice(a, text.indexOf('function uebungMitWahr(')) + f;
}

/* Die Übung aus dem Quelltext laden. Gibt den Kontext zurück oder, was fehlt. */
function lade_uebung(quelle){
  const teile = [
    schneideZeile(quelle, 'const uebungOhneZeichen ='),
    schneideZeile(quelle, 'const uebungNamensstamm ='),
    schneideZeile(quelle, 'const UEBUNG_KEINE_REGEL ='),
    schneideMitWahr(quelle),
    schneideFunktion(quelle, 'uebungKeineRegel'),
    schneideFunktion(quelle, 'uebungHervorWorte'),
    schneideFunktion(quelle, 'uebungNameNennt'),
    schneideFunktion(quelle, 'uebungAblenker'),
    schneideFunktion(quelle, 'uebungSammel'),
    schneideZeile(quelle, 'const UEBUNG_WARUM_UNSICHTBAR ='),
    schneideFunktion(quelle, 'uebungUnsichtbarerFall'),
    schneideFunktion(KERN, 'shuffle'),
    schneideListe(quelle, 'const UEBUNGEN = [')
  ];
  const fehlt = teile.map((t, i) => t ? null : i).filter(i => i !== null);
  if (fehlt.length) return { fehler: 'Bausteine fehlen: ' + fehlt.join(',') };
  const c = { console, ...G, regelAusgeblendet: r => !r || !!r.ausgeblendet };
  vm.createContext(c);
  try {
    vm.runInContext(teile.join('\n') + '\n;globalThis.__U = UEBUNGEN; globalThis.__MIT = uebungMitWahr;' +
      ' globalThis.__HERVOR = uebungHervorWorte; globalThis.__NENNT = uebungNameNennt;' +
      ' globalThis.__DATEN = { UEBUNG_ZUSAMMEN, UEBUNG_DAZU, UEBUNG_DAZU_MEHRWORTIG, UEBUNG_DAZU_AM_NOMEN,' +
      ' UEBUNG_OBERBEGRIFF, UEBUNG_OBERBEGRIFF_WORT };', c);
  } catch (e){
    return { fehler: 'lädt nicht: ' + e.message };
  }
  const modus = c.__U.find(m => m.id === 'regel');
  return modus ? { c, modus } : { fehler: 'die Übung „Welche Regel?" fehlt' };
}

/* Jede Zeichenkette in den Zuordnungen — Schlüssel wie Werte. */
function alleIds(daten){
  const out = [];
  const geh = v => {
    if (typeof v === 'string') out.push(v);
    else if (Array.isArray(v)) v.forEach(geh);
    else if (v && typeof v === 'object') Object.entries(v).forEach(([k, w]) => { out.push(k); geh(w); });
  };
  Object.values(daten).forEach(geh);
  return out;
}

const stammVon = id => String((REGEL.get(id) || {}).name || '').split('(')[0].trim();
const themaVon = id => G.SATZ_THEMEN.find(t => t.muster && t.muster.test(id)) || null;
const kurz = liste => [...new Set(liste)].slice(0, 4).join(' · ') + (new Set(liste).size > 4 ? ' …' : '');

/* referenz: der Quelltext, dessen uebungMitWahr() als Maßstab gilt. Im Störtest
   ist das die echte Datei — außer dort, wo die echte Datei selbst gestört wird. */
function laufe(quelle, still, referenz){
  const rot = new Set();
  const pruefe = (schluessel, was, bedingung, gemessen) => {
    if (bedingung){ if (!still) console.log('  ✔ ' + was); }
    else { rot.add(schluessel); if (!still) console.log('  ✘ ' + was + '   gemessen: ' + gemessen); }
  };
  const log = s => { if (!still) console.log(s); };

  log('\n1. Sein Satz und was die Prüfung braucht');
  pruefe('zitat', 'js/uebung.js zitiert seinen Satz im Wortlaut', quelle.includes(ZITAT), 'fehlt oder ist verändert');
  pruefe('lexikon', 'die Buchvokabeln sind geladen wie in der App (' + BUCH_DATEIEN.length + ' Dateien, ' + BUCH.length + ' Wörter)',
    BUCH.length > 0, 'keine data/vokabeln-*.js — ohne sie misst der Test eine andere Satzanalyse als die App');
  const lauf = lade_uebung(quelle);
  pruefe('bausteine', 'die Übung lässt sich aus js/uebung.js laden', !lauf.fehler, lauf.fehler);
  if (lauf.fehler) return rot;
  const ref = lade_uebung(referenz);
  pruefe('bausteine', 'die Vergleichsfassung auch', !ref.fehler, ref.fehler);
  if (ref.fehler) return rot;

  log('\n2. Die Zuordnung „was am selben Wort mitgilt"');
  const ids = alleIds(lauf.c.__DATEN);
  const unbekannt = ids.filter(id => !REGEL.has(id));
  pruefe('ids', 'jede der ' + ids.length + ' IDs gibt es in grammar-data.js (ein Tippfehler schlösse still nichts aus)',
    unbekannt.length === 0 && ids.length >= 50, unbekannt.length ? kurz(unbekannt) : ids.length + ' IDs');

  /* ---------- Bauen, 30-mal ---------- */
  const aufgaben = [];
  let fehler = 0;
  for (let l = 0; l < LAEUFE; l++){
    for (const { s, z } of ANALYSEN){
      let liste = [];
      try { liste = lauf.modus.baue(z, s) || []; } catch (e){ fehler++; }
      for (const a of liste){
        const bis = a.wortIdxBis === undefined ? a.wortIdx : a.wortIdxBis;
        aufgaben.push({ s, z, a, l, von: a.wortIdx, bis, falsche: a.optionen.map(o => o.wert).filter(w => w !== a.loesung) });
      }
    }
  }
  const jeAufbau = aufgaben.filter(x => x.l === 0).length;
  log('\n3. „Welche Regel?" an allen ' + SAETZE.length + ' markierten Sätzen, ' + LAEUFE + '-mal gebaut');
  log('     gemessen: ' + jeAufbau + ' Aufgaben je Aufbau, ' + new Set(aufgaben.map(x => x.a.loesung)).size +
    ' verschiedene richtige Antworten' + (fehler ? ', ' + fehler + ' Fehler beim Bauen' : ''));
  pruefe('anzahl', 'mindestens ' + MINDEST_AUFGABEN + ' Aufgaben je Aufbau (sonst schließt die Zuordnung zu viel aus)',
    jeAufbau >= MINDEST_AUFGABEN, jeAufbau);
  pruefe('anzahl', 'kein Fehler beim Bauen', fehler === 0, fehler);

  log('\n4. Sein Fall: hadhihi bintu l-mudarrisi, hervorgehoben bintu');
  const fall = aufgaben.filter(x => x.s.id === FALL_SATZ && x.a.loesung === FALL_ANTWORT);
  const amWort = fall.every(x => ohneZeichen(x.z[x.von] && x.z[x.von].rein) === FALL_SKELETT && x.bis === x.von);
  pruefe('fall', 'bintu wird weiter nach „' + (REGEL.get(FALL_ANTWORT) || {}).name + '" gefragt, in jedem Aufbau',
    fall.length === LAEUFE && amWort, fall.length + ' von ' + LAEUFE + (amWort ? '' : ', nicht am Wort bintu'));
  const angeboten = fall.flatMap(x => x.falsche);
  const mitgeltend = angeboten.filter(w => ['idafa-01', 'idafa-erkennen-01', 'mudaf-01'].includes(w));
  pruefe('fall', 'dort nie „Iḍāfa", „muḍāf erkennen" oder „muḍāf" als falsche Antwort (' + LAEUFE + ' Aufbauten)',
    mitgeltend.length === 0, mitgeltend.length + '× ' + kurz(mitgeltend));
  pruefe('fall', '„Ortsangabe als muḍāf" bleibt dort als falsche Antwort (die hat er selbst als falsch erkannt)',
    angeboten.includes('zarf-als-mudaf-01'), 'nie angeboten: ' + kurz(angeboten));

  log('\n5. Keine falsche Antwort, die an der Stelle mit der richtigen gilt');
  const merk = new Map();
  const mitWahr = x => {
    const k = x.s.id + '|' + x.von + '|' + x.bis + '|' + x.a.loesung;
    if (!merk.has(k)) merk.set(k, ref.c.__MIT(REGEL.get(x.a.loesung), x.z, x.von, x.bis));
    return merk.get(k);
  };
  const doppelt = [];
  for (const x of aufgaben) for (const w of x.falsche) if (mitWahr(x).has(w)) doppelt.push(x.a.loesung + ' + ' + w + ' (' + x.s.id + ')');
  pruefe('mitwahr', 'nach uebungMitWahr() der ' + (referenz === quelle ? 'geprüften' : 'echten') + ' Fassung, in allen Aufbauten',
    doppelt.length === 0, doppelt.length + '× z. B. ' + kurz(doppelt));
  for (const [antwort, nie, muss] of STICHPROBEN){
    const mit = aufgaben.filter(x => x.a.loesung === antwort);
    const falsch = mit.flatMap(x => x.falsche.filter(w => nie.includes(w)));
    const n = mit.length / LAEUFE;
    pruefe('stichprobe', 'Stichprobe ' + antwort + ': nie zugleich ' + nie.join(', ') +
      (n ? ' (' + n + (n === 1 ? ' Aufgabe)' : ' Aufgaben)') : ' (wird nicht gefragt)'),
      falsch.length === 0 && (!muss || mit.length > 0), muss && !mit.length ? 'nie gefragt — die Stichprobe prüft nichts' : falsch.length + '× ' + kurz(falsch));
  }

  /* Mitten in einer Kette ist ein Wort zweites UND erstes Glied (Satz mb1-29-1,
     masjidu rasūli llāhi: rasūli). Einzeln markiert ist so ein Wort noch nirgends;
     geprüft wird deshalb direkt an uebungMitWahr() mit der echten Satzanalyse. */
  const kette = ANALYSEN.find(x => x.s.id === KETTE_SATZ);
  const mitte = kette ? kette.z.findIndex(w => ohneZeichen(w.rein) === KETTE_MITTE) : -1;
  const anfang = kette ? kette.z.findIndex(w => ohneZeichen(w.rein) === KETTE_ANFANG) : -1;
  const mitteMit = mitte >= 0 ? lauf.c.__MIT(REGEL.get('mudaf-ohne-al-01'), kette.z, mitte, mitte) : new Set();
  const anfangMit = anfang >= 0 ? lauf.c.__MIT(REGEL.get('mudaf-ohne-al-01'), kette.z, anfang, anfang) : new Set();
  pruefe('kette', 'mitten in der Kette (rasūli): „muḍāf ilayh" und „zweites Glied" gelten mit',
    mitte >= 0 && mitteMit.has('mudaf-ilayh-01') && mitteMit.has('idafa-zweitglied-01'),
    mitte < 0 ? 'Satz ' + KETTE_SATZ + ' oder das Wort fehlt' : kurz([...mitteMit]));
  pruefe('kette', 'am Anfang der Kette (masjidu) nicht — dort sind sie gute falsche Antworten',
    anfang >= 0 && !anfangMit.has('mudaf-ilayh-01') && !anfangMit.has('idafa-zweitglied-01'),
    anfang < 0 ? 'Wort fehlt' : kurz([...anfangMit]));

  log('\n6. Keine falsche Antwort mit demselben Namen vor der Klammer');
  const gleich = aufgaben.flatMap(x => x.falsche.filter(w => stammVon(w) === stammVon(x.a.loesung)).map(w => x.a.loesung + ' + ' + w));
  pruefe('stamm', 'in allen Aufbauten (am 30.07. standen so drei hādhā-Regeln zur Wahl)', gleich.length === 0, gleich.length + '× ' + kurz(gleich));

  log('\n7. Aus einem anderen Thema nur, was das hervorgehobene Wort beim Namen nennt' +
    ' (Elias, 27.10.2026: „Nein, die weggefallenen Fragen in „Welche Regel?“ sollen wegbleiben.“)');
  const fremd = [];
  for (const x of aufgaben){
    const thema = themaVon(x.a.loesung), richtig = REGEL.get(x.a.loesung);
    const imThema = w => thema ? thema.muster.test(w) : (REGEL.get(w) || {}).color === richtig.color;
    const worte = ref.c.__HERVOR(x.z, x.von, x.bis);
    for (const w of x.falsche) if (!imThema(w) && !ref.c.__NENNT(REGEL.get(w), worte)) fremd.push(x.a.loesung + ' + ' + w);
  }
  pruefe('thema', 'in allen Aufbauten (eine beliebige Regel aus einem anderen Thema kann am Wort ebenso gelten)',
    fremd.length === 0, fremd.length + '× ' + kurz(fremd));

  log('\n8. Nur Paare, die schon jemand geprüft hat (GEPRUEFT oben)');
  const neu = new Map();
  for (const x of aufgaben) for (const w of x.falsche) {
    const paar = x.a.loesung + ' → ' + w;
    if (!GEPRUEFT_PAARE.has(paar) && !neu.has(paar))
      neu.set(paar, 'Satz ' + x.s.id + ' an ' + x.z.slice(x.von, x.bis + 1).map(t => t.rein).join(' '));
  }
  pruefe('paare', 'jede angebotene falsche Antwort ist neben ihrer richtigen geprüft (' + GEPRUEFT_PAARE.size + ' Paare)',
    neu.size === 0, neu.size + ' neu — erst prüfen, dann eintragen (Anleitung bei GEPRUEFT):\n      ' +
    [...neu].map(([p, wo]) => p + '   (' + wo + ')').join('\n      '));

  return rot;
}

/* ---------- Störtest ---------- */
const GRUPPE_MUDAF = "['mudaf-01', 'mudaf-ohne-al-01', 'idafa-erkennen-01']";
const ohneMudafInGruppe = q => q.replace(GRUPPE_MUDAF, "['mudaf-ohne-al-01', 'idafa-erkennen-01']");
const STOERUNGEN = [
  /* [was, Veränderung, Schlüssel, der rot werden muss, gilt die gestörte Fassung auch als Maßstab?] */
  ['baue() ruft uebungMitWahr() nicht mehr auf',
    q => q.replace('...imSatz, ...uebungMitWahr(rule, z, idx, bis)', '...imSatz'), 'mitwahr', false],
  ['UEBUNG_ZUSAMMEN ist leer (in der echten Datei, der Vergleich zieht mit)',
    q => q.replace(/const UEBUNG_ZUSAMMEN = \[[\s\S]*?\n\];/, 'const UEBUNG_ZUSAMMEN = [];'), 'stichprobe', true],
  ['UEBUNG_OBERBEGRIFF ist leer (in der echten Datei)',
    q => q.replace(/const UEBUNG_OBERBEGRIFF = \{[\s\S]*?\n\};/, 'const UEBUNG_OBERBEGRIFF = {};'), 'fall', true],
  ['andere Themen wieder ohne Bedingung',
    q => q.replace("shuffle(passend).concat(typeof bevorzugt === 'function' ? shuffle(rest.filter(bevorzugt)) : [])",
                   'shuffle(passend).concat(shuffle(rest))'), 'thema', false],
  ['gleicher Namensstamm wieder zugelassen (und mudaf-01 aus seiner Gruppe genommen)',
    q => ohneMudafInGruppe(q).replace('const reihe = shuffle(passend)', 'const reihe = shuffle(nah).concat(shuffle(passend))'), 'stamm', true],
  ['eine Zeile fehlt in UEBUNG_ZUSAMMEN, und keine Stichprobe deckt sie (in der echten Datei)',
    q => q.replace("  ['koerperteile-genus-01', 'fem-ohne-ta-marbuta-01'],             // ʿaynun, yadun\n", ''), 'paare', true],
  ['die Kettenmitte zählt nicht mehr',
    q => q.replace('  if (z.slice(von, bis + 1).some(uebungKettenmitte)) dazu(UEBUNG_IDAFA_STELLEN);\n', ''), 'kette', false],
  ['eine ID mit Tippfehler',
    q => q.replace(GRUPPE_MUDAF, "['mudaf-01', 'mudaf-ohne-al-01', 'idafa-erkenen-01']"), 'ids', false],
  ['uebungMitWahr() schließt alles aus',
    q => q.replace('  mit.delete(id);\n  return mit;', '  GRAMMAR_RULES.forEach(r => mit.add(r.id));\n  mit.delete(id);\n  return mit;'), 'anzahl', false],
  ['sein Satz ist „verbessert"',
    q => q.replace('keine echten Falschantworten', 'keine echten Falsch-Antworten'), 'zitat', false]
];

if (STOERTEST){
  console.log('Störtest: jede Gegenprobe muss an der genannten Stelle rot werden.\n');
  let alleRichtig = true;
  for (const [was, aendere, schluessel, alsMassstab] of STOERUNGEN){
    const v = aendere(UEBUNG);
    const geaendert = v !== UEBUNG;
    const rot = geaendert ? laufe(v, true, alsMassstab ? v : UEBUNG) : new Set();
    const ok = geaendert && rot.has(schluessel);
    if (!ok) alleRichtig = false;
    console.log((ok ? '  ✔ rot (' + schluessel + '): ' : '  ✘ NICHT rot (' + schluessel + '): ') + was +
      (geaendert ? '' : '  (Ersetzung griff nicht)'));
  }
  /* Gegenprobe andersherum: der Namensstamm hält auch allein. Ohne mudaf-01 in
     seiner Gruppe darf trotzdem keine Regel mit demselben Namen kommen. */
  const ohne = ohneMudafInGruppe(UEBUNG);
  const rotOhne = ohne !== UEBUNG ? laufe(ohne, true, ohne) : new Set(['ersetzung']);
  const haelt = !rotOhne.has('stamm') && !rotOhne.has('ersetzung');
  if (!haelt) alleRichtig = false;
  console.log((haelt ? '  ✔ grün (stamm): ' : '  ✘ ROT (stamm): ') + 'nur mudaf-01 aus seiner Gruppe — der Ausschluss gleicher Namen hält allein');
  const echt = laufe(UEBUNG, true, UEBUNG);
  console.log('\n  und die echte Datei: ' + (echt.size === 0 ? 'grün ✔' : 'rot ✘ (' + [...echt].join(', ') + ')'));
  process.exit(alleRichtig && echt.size === 0 ? 0 : 1);
}

const rot = laufe(UEBUNG, false, UEBUNG);
console.log('\n' + (rot.size ? '✘ rot: ' + [...rot].join(', ') : '✔ alle grün'));
process.exit(rot.size ? 1 : 0);
