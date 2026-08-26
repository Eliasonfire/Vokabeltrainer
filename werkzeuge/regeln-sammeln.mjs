/* regeln-sammeln.mjs -- sammelt die 95 Regeln samt Beispielsatz fuer das Regelpruefungs-Artefakt.
 *
 * Am 19.08.2026 aus dem Sitzungsordner ins Repo geholt. Vorher lag die Datei
 * nur unter AppData/Local/Temp — der Sitzungsordner wird irgendwann geleert,
 * und dann waere das Artefakt, an dem Elias gerade arbeitet, nicht mehr neu
 * baubar gewesen. Frueherer Name: regeln-sammeln2.mjs
 *
 * Zwischenstaende und fertige Seiten liegen jetzt unter artefakte/ im Repo.
 * ⛔ Der Ordner gehoert in .gitignore, falls er es noch nicht ist: die
 * gebauten Seiten enthalten Elias' Vokabeln und Beispielsaetze und fallen
 * damit unter Regel 7a (arabicroots-AGB Ziffer 9 und 3.7).
 */
import fs from 'node:fs';
const V = 'G:/1. Workspace/Vokabeltrainer/';
const S = 'artefakte/';
const rd = f => fs.readFileSync(V + f, 'utf8');

const { GRAMMAR_RULES, SENTENCE_TAGS } =
  (new Function(rd('grammar-data.js') + ';return {GRAMMAR_RULES, SENTENCE_TAGS};'))();
const { VOCAB_DATA } = (new Function(rd('vocab-data.js') + ';return {VOCAB_DATA};'))();
let LEHRBUCH = [];
try { LEHRBUCH = (new Function(rd('lehrbuch-saetze.js') + ';return LEHRBUCH_SAETZE;'))() || []; } catch(e){}

/* Die 84 IDs, die im veroeffentlichten Artefakt stehen — gemessen aus der
   geholten Seite, nicht erinnert. Alles, was hier NICHT steht, ist fuer Elias
   neu und bekommt in der Seite eine Marke. */
const ALT = new Set(fs.readFileSync(S + 'artefakt-ids.txt', 'utf8')
  .split(/\r?\n/).map(z => z.trim()).filter(Boolean));

/* Satz je Regel: der erste, der mit ihr markiert ist. Mehr als einer bringt
   fuer die Pruefung nichts — es geht darum, die Regel am Beispiel zu sehen. */
/* ⚠️ Dritte und vierte Satzquelle mitgelesen — hier VORSORGLICH, nicht wegen
   eines gemessenen Schadens. Am 20.08.2026 nachgezaehlt: mit und ohne sie
   bekommen **95 von 95** markierten Regeln einen Satz, die Wirkung ist heute
   also NULL. Das liegt daran, dass jede Regel mehrere Markierungen hat und
   mindestens eine in einer bekannten Quelle sitzt — nicht daran, dass die
   Luecke keine waere.

   Sie schlaegt in dem Augenblick zu, in dem eine Regel NUR auf einem
   verfassten Satz markiert ist. Genau das ist bei den 45 offenen
   Regelkandidaten aus F14/15/16 zu erwarten.

   ⛔ Die Zahl steht hier, damit niemand spaeter glaubt, hier sei ein Fehler
   behoben worden. [[zahlen_ohne_beleg]] */
let BSP = {}, FACH = [];
try {
  const p = V + 'data' + (V.endsWith('/') ? '/' : '\\') + 'beispielsaetze.js';
  if (fs.existsSync(p)) BSP = (new Function(fs.readFileSync(p, 'utf8')
    + ';return typeof BEISPIELSAETZE!=="undefined"?BEISPIELSAETZE:{};'))();
} catch (e) { console.log('⚠️  data/beispielsaetze.js nicht lesbar: ' + e.message); }
try {
  const p = V + 'data' + (V.endsWith('/') ? '/' : '\\') + 'fachbegriffe.js';
  if (fs.existsSync(p)) FACH = (new Function(fs.readFileSync(p, 'utf8')
    + ';return typeof FACHBEGRIFF_VOKABELN!=="undefined"?FACHBEGRIFF_VOKABELN:[];'))();
} catch (e) { console.log('⚠️  data/fachbegriffe.js nicht lesbar: ' + e.message); }

const satzFuer = {};
for (const [wid, tags] of Object.entries(SENTENCE_TAGS)){
  for (const t of (tags || [])){
    if (satzFuer[t.ruleId]) continue;
    const w = VOCAB_DATA.find(x => String(x.id) === wid)
           || LEHRBUCH.find(x => String(x.id) === wid)
           || (BSP[wid] && BSP[wid].sentAr ? BSP[wid] : null)
           || FACH.find(x => String(x.id) === wid);
    if (!w) continue;
    /* `bedeutung` wandert mit — sie haengt an der MARKIERUNG, nicht an der
       Regel: dieselbe Regel markiert einmal ـكَ und einmal ـكِ. */
    satzFuer[t.ruleId] = { ar: w.sentAr || w.ar, de: w.sentDe || w.de,
                           treffer: t.matchText, bedeutung: t.bedeutung };
  }
}

/* ⛔ Diese Tabelle war der Grund, warum die drei Madina-Schluessel-Regeln in der
   ersten Fassung als roher Slug dastanden: sie kannte nur zwei Werke. */
const WERK = {
  'sharh-madinah-1':     'Sharḥ Madīnah 1',
  'bayna-yadayk-2':      'Bayna Yadayk 2',
  'madina-schluessel-1': 'Madina-Schlüssel 1',
  'madina-schluessel-2': 'Madina-Schlüssel 2',
  'madina-schluessel-3': 'Madina-Schlüssel 3',
};
const fehlendeWerke = new Set();

const raus = GRAMMAR_RULES.map(r => {
  if (r.ergaenzung && !WERK[r.buchQuelle.werk]) fehlendeWerke.add(r.buchQuelle.werk);
  return {
    id: r.id,
    name: r.name,
    text: r.shortExplanation,
    kapitel: r.ergaenzung ? r.kapitel : (r.source ? r.source.chapter : null),
    ausgeblendet: !!r.ausgeblendet,
    ergaenzung: !!r.ergaenzung,
    neu: !ALT.has(r.id),
    farbe: r.color || '',
    quelle: r.ergaenzung
      ? `📖 ${WERK[r.buchQuelle.werk] || r.buchQuelle.werk} · Lektion ${r.buchQuelle.lektion}, Seite ${r.buchQuelle.seite}`
      : `${r.source.video} · ca. ${r.source.approxTimestamp}`,
    folge: r.source ? r.source.folge : null,
    zeit: r.source ? r.source.approxTimestamp : null,
    buch: r.source2 ? `Schlüssel ${r.source2.schluessel}, Lektion ${r.source2.lektion}, S. ${r.source2.seite}` : null,
    satz: satzFuer[r.id] || null,
  };
});

const kap = {};
raus.forEach(r => (kap[r.kapitel ?? 0] ||= []).push(r));

console.log('Regeln:', raus.length);
console.log('davon neu gegenueber dem Artefakt:', raus.filter(r => r.neu).length);
console.log('  ' + raus.filter(r => r.neu).map(r => r.id).join('\n  '));
console.log('mit Beispielsatz:', raus.filter(r => r.satz).length);
console.log('ohne Beispielsatz:', raus.filter(r => !r.satz).map(r => r.id).join(', ') || '(keine)');
if (fehlendeWerke.size) console.log('⚠️ WERK-Tabelle kennt nicht:', [...fehlendeWerke].join(', '));

/* ⭐ Die eigentliche Sicherung: jede alte ID MUSS wieder vorkommen, sonst
   verwaist ein Haekchen von Elias im localStorage. */
const neueIds = new Set(raus.map(r => r.id));
const verloren = [...ALT].filter(id => !neueIds.has(id));
console.log('\nAlte IDs im Artefakt:', ALT.size, '| davon wieder da:', ALT.size - verloren.length);
if (verloren.length){
  console.log('⛔ VERLOREN:', verloren.join(', '));
  process.exit(2);
}

console.log('\nje Kapitel:');
Object.keys(kap).sort((a,b)=>a-b).forEach(k =>
  console.log('  Kapitel ' + String(k).padEnd(3) + String(kap[k].length).padStart(2) + ' Regeln'
    + (kap[k].filter(r=>r.neu).length ? '  (' + kap[k].filter(r=>r.neu).length + ' neu)' : '')));

fs.writeFileSync(S + 'regeln.json', JSON.stringify(raus, null, 1), 'utf8');
console.log('\nregeln.json geschrieben.');
