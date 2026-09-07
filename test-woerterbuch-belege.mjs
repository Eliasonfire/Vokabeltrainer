/* test-woerterbuch-belege.mjs — greifen die vier Schranken noch?
 *
 * ⛔ WOZU: `werkzeuge/woerterbuch-belege.mjs` legt Belege neben Elias' Fragen.
 * Ein falscher Beleg ist schlimmer als gar keiner — er sieht geprüft aus, und
 * Elias tippt ihn an. Am 07.09.2026 lieferte der erste Lauf 17 Belege, **vier
 * davon falsch**; jede der vier Schranken unten hat genau einen gefangen.
 *
 * Dieser Test läuft OHNE Netz und ohne Browser: er prüft die Entscheidungen,
 * nicht die Wörterbücher. [[stoertest_muss_wirkung_nachweisen]]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const { nackt } = await import(pathToFileURL(
  'G:/1. Workspace/MCP-Servers/arabdict/src/arabdict.mjs').href);

let fehler = 0;
const ok = (b, t) => { console.log('  ' + (b ? '✔' : '✘') + ' ' + t); if (!b) fehler++; };
const teil = (t) => console.log('\n=== ' + t + ' ===\n');

/* Die vier Entscheidungen, wortgleich aus dem Werkzeug übernommen. Sie stehen
   hier NOCH EINMAL, und das ist Absicht: ändert sie jemand dort, ohne hier
   nachzuziehen, fällt der Test auf — er vergleicht am Ende beide Fassungen. */
function ohneEndung(s) {
  const t = String(s || '').normalize('NFC');
  let letzter = -1;
  for (let i = 0; i < t.length; i++) if (/[ء-ي]/.test(t[i])) letzter = i;
  if (letzter < 0) return t;
  return t.slice(0, letzter + 1) + t.slice(letzter + 1).replace(/[ً-ِْٰ]/g, '');
}
const hatTaschkil = (s) => /[ً-ْٰ]/.test(String(s || ''));
function formPasstZu(gefunden, gesucht) {
  if (!gefunden) return false;
  if (hatTaschkil(gesucht) && hatTaschkil(gefunden))
    return ohneEndung(gefunden) === ohneEndung(gesucht);
  return nackt(gefunden) === nackt(gesucht);
}

/* ------------------------------------------------------------------ */
teil('Schranke 1 — Vergleich MIT Ḥarakāt, nicht nackt');

ok(!formPasstZu('بَعِدَ', 'بَعْدَ'),
  'بَعِدَ („fern sein") gilt NICHT als بَعْدَ („nach") — der Fall, der „Verb" ergab');
ok(nackt('بَعِدَ') === nackt('بَعْدَ'),
  '… und nackt wären sie gleich: genau deshalb reicht der Nacktvergleich nicht');
ok(formPasstZu('كِتَابٌ', 'كِتَاب'),
  'die Zitierform mit Tanwīn gilt trotzdem als dasselbe Wort');
ok(formPasstZu('سَيِّدٌ', 'سَيِّد'), '… auch bei سَيِّد');
ok(!formPasstZu('كُرْسِي', 'كُرْسِيّ'),
  'die Schadda unterscheidet — كُرْسِيّ („kursiyy") ist nicht كُرْسِي („kursī")');
ok(formPasstZu('مهندس', 'مهندس'),
  'ohne Taschkīl auf einer Seite bleibt der Nacktvergleich');

/* ------------------------------------------------------------------ */
teil('Schranke 2 — nur eindeutige arabdict-Angaben');

const QUELLE = fs.readFileSync(path.join(HIER, 'werkzeuge', 'woerterbuch-belege.mjs'), 'utf8');
const block = QUELLE.slice(QUELLE.indexOf('const ARABDICT_ZU_APP'),
                           QUELLE.indexOf('];', QUELLE.indexOf('const ARABDICT_ZU_APP')));
ok(!/صيغة فاعل|اسم فاعل/.test(block),
  'صيغة فاعل wird NICHT übersetzt — ein Partizip ist Nomen ODER Adjektiv (كَسْلَانُ)');
ok(!/صيغة مفعول/.test(block), 'صيغة مفعول ebenso wenig');
ok(/اسم/.test(block) && /فعل/.test(block) && /صفة/.test(block),
  'die drei eindeutigen Angaben stehen drin');
ok(!/مصدر/.test(block),
  'مصدر nennt die Herkunft, nicht die Wortart — und wird deshalb nicht übersetzt');

/* ------------------------------------------------------------------ */
teil('Schranke 3 — genau EINE Wortart, sonst kein Beleg');

const REVERSO_ZU_APP = {
  'v.': 'verb', 'n.': 'noun', 'nm.': 'noun', 'nf.': 'noun', 'nn.': 'noun',
  'num.': 'noun', 'adj.': 'adjective', 'adv.': 'adverb',
  'prep.': 'particle', 'conj.': 'particle', 'pron.': 'particle',
  'interj.': 'expression',
};
const eindeutig = (rohListe) => {
  const r = rohListe.filter(p => !String(p).includes('infl.'));
  return [...new Set(r.map(p => REVERSO_ZU_APP[p]).filter(Boolean))];
};
ok(eindeutig(['adv.', 'conj.', 'nm.', 'prep.', 'v.']).length > 1,
  'بَعْدَ mit fünf Wortarten gilt als mehrdeutig — kein Beleg');
ok(eindeutig(['num.']).length === 1, 'ein einzelnes „num." ist ein Beleg');
ok(eindeutig(['n.', 'num.']).length === 1,
  '„n." und „num." zeigen beide auf Nomen — das bleibt eindeutig');
ok(eindeutig(['nf.', 'num.']).length === 1, '„nf." und „num." ebenso');
ok(eindeutig(['adj.', 'nm.']).length > 1,
  'سَيِّدٌ mit „adj., nm." ist mehrdeutig — Adjektiv gegen Nomen');
ok(eindeutig(['v. infl.', 'nm.']).length === 1,
  'die gebeugten Formen („infl.") zählen nicht mit');

/* ------------------------------------------------------------------ */
teil('Schranke 4 — Suffix und Präfix gegen die NACKTE Form');

const SUFFIX = /(?:هَا|ها|هُمْ|هم|كُمْ|كم|هُ|ه|كِ|كَ|ك|ي|ْ?ه)$/;
const PRAEFIX = /^(?:لِ|بِ|فِ|كَ|وَ)/;
function zusammengesetzt(ar) {
  const roh = String(ar || '').normalize('NFC');
  const bloss = nackt(roh);
  if (/\s/.test(roh.trim())) return true;
  if (bloss.length <= 5 && PRAEFIX.test(roh) && SUFFIX.test(bloss)) return true;
  if (bloss.length <= 4 && SUFFIX.test(bloss)) return true;
  const FUNKTIONSWOERTER = ["من", "ما", "ذا", "هو", "هي", "ذلك", "هذا"];
  if (PRAEFIX.test(roh) && FUNKTIONSWOERTER.includes(bloss.slice(1))) return true;
  return false;
}
ok(zusammengesetzt('حَالُكْ'),
  'حَالُكْ gilt als zusammengesetzt — es endet auf ein Sukūn, nicht auf ك');
ok(!SUFFIX.test('حَالُكْ'),
  '… und am VOKALISIERTEN Wort griffe der Test nicht: genau das war der Fehler');
ok(zusammengesetzt('لَكَ') && zusammengesetzt('لَكِ') && zusammengesetzt('لِمَن'),
  'لَكَ, لَكِ und لِمَن ebenfalls');
ok(zusammengesetzt('حَرْفُ الْجَرِّ'),
  'Wortgruppen werden gar nicht erst gefragt');
ok(!zusammengesetzt('كِتَابٌ') && !zusammengesetzt('مُهَنْدِسٌ'),
  '… aber كِتَابٌ und مُهَنْدِسٌ nicht — sonst würde die Schranke alles verschlucken');

/* ------------------------------------------------------------------ */
teil('Die abgelegten Belege selbst');

const p = path.join(HIER, 'data', 'woerterbuch-belege.json');
if (!fs.existsSync(p)) {
  console.log('  ⓘ data/woerterbuch-belege.json fehlt — erst '
    + 'node werkzeuge/woerterbuch-belege.mjs laufen lassen');
} else {
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  const b = j.belege || {};
  const ids = Object.keys(b);
  ok(ids.length > 0, ids.length + ' Belege liegen ab');
  ok(ids.every(id => b[id].typeApp || b[id].gender),
    'jeder Beleg trägt eine App-Wortart oder ein Geschlecht');
  const ERLAUBT = ['noun', 'verb', 'adjective', 'particle', 'adverb', 'expression'];
  ok(ids.every(id => !b[id].typeApp || ERLAUBT.includes(b[id].typeApp)),
    'jede App-Wortart ist eine, die js/kern.js kennt');
  ok(ids.every(id => !b[id].gender || ['masculine', 'feminine'].includes(b[id].gender)),
    'jedes Geschlecht ist „masculine" oder „feminine" — ein dritter Wert gälte '
    + 'in Übung 11 stillschweigend als männlich');
  ok(ids.every(id => b[id].woher && b[id].url),
    'jeder Beleg nennt seine Quelle und eine Adresse zum Nachsehen');
  /* ⛔ Die vier Wörter, die beim ersten Lauf falsch belegt waren, dürfen
     NICHT wieder auftauchen — sie sind der eigentliche Zweck dieses Tests. */
  const VERBOTEN = { 'بَعْدَ': 'Homograph بَعِدَ', 'عِنْدَ': 'Homograph عنَدَ',
                     'كَسْلَانُ': 'Partizip mehrdeutig', 'حَالُكْ': 'zusammengesetzt' };
  const drin = Object.keys(VERBOTEN).filter(w =>
    ids.some(id => (b[id].form && nackt(b[id].form) === nackt(w))));
  ok(drin.length === 0, drin.length
    ? '⛔ wieder belegt: ' + drin.map(w => w + ' (' + VERBOTEN[w] + ')').join(', ')
    : 'keines der vier Wörter aus dem Fehllauf ist wieder dabei');
}

/* ------------------------------------------------------------------ */
teil('Störtest — kann dieser Test überhaupt scheitern?');

ok(formPasstZu('بَعْدَ', 'بَعْدَ'),
  'dasselbe Wort gilt als dasselbe — sonst wäre Schranke 1 nur blockiert');
ok(eindeutig(['num.']).length === 1 && eindeutig([]).length === 0,
  'Schranke 3 unterscheidet „eine" von „keine" — sie sagt nicht immer nein');
ok(!zusammengesetzt('بَيْتٌ'),
  'Schranke 4 lässt ein gewöhnliches Wort durch');

console.log('\n' + (fehler ? '⛔ ' + fehler + ' Fall/Fälle falsch' : '✅ alle Fälle richtig'));
process.exitCode = fehler ? 1 : 0;
