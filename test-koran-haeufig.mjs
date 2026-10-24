/* test-koran-haeufig.mjs — die Wortgruppe „Koran häufigste": Liste, Datendatei und die Regeln in der App.
 *
 * WARUM ES DIESE DATEI GIBT (11.10.2026)
 *
 * Elias: „du kannst koran häufigste die häufigsten 270 wörter darein machen damit ich so 70%
 *   verstehen kann. und da sollen erstmal die wörter kommen die am häufigsten sind. wörter die ich
 *   bereits kann sollen nicht doppelt kommen also wenn sie bereits freigeschalten wurden. häufigsten
 *   wörter die ich bereits kann bzw kenne als kapiteln oder so sollen auf den selben stand gebracht
 *   werden"
 *
 * Bewacht werden seine vier Forderungen, jede mit einem Störtest, der zeigt, dass die Prüfung rot
 * werden kann:
 *   1. 270 Zeilen seiner Tabelle, nichts fehlt, nichts doppelt        (Liste und Datendatei)
 *   2. die häufigsten zuerst                                           (neueZuerst in js/kern.js)
 *   3. ein Wort, das er kennt, kommt nicht doppelt                     (koranKartenEinordnen in js/buecher.js)
 *   4. auf demselben Stand                                             (dieselbe Karte; Übertrag genau einmal)
 * Dazu MEINE Bauart, damit sie nicht still zerfällt: Unterrichtswörter vor Koranwörtern, die Zeile
 * „N-mal im Koran", die Anbindung in index.html und sw.js.
 *
 * ⭐ Die Funktionen werden aus js/kern.js und js/buecher.js GESCHNITTEN, nicht abgetippt.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { leseListe, leseFelder, leseStellen, leseSatzverse, baueDatei, STELLEN, SATZVERSE, LISTE, FELDER, FELDER_JE_TYP, FELD_FOLGE, ZIEL, ZEILEN_DER_TABELLE, SUMME, JE_KAPITEL } from './werkzeuge/koran-haeufig-bauen.mjs';
import { abzugOrdner, abzugGeparkt } from './werkzeuge/datenquelle.mjs';

const HIER = path.dirname(fileURLToPath(import.meta.url));
/* CRLF → LF beim Lesen: die Suchtexte unten enthalten Zeilenenden (Begründung in test-dublette.mjs). */
const lies = (...teile) => fs.readFileSync(path.join(HIER, ...teile), 'utf8').replace(/\r\n/g, '\n');
const KERN = lies('js', 'kern.js');
const BUCH = lies('js', 'buecher.js');

let fehler = 0;
const sag = (ok, t) => { if (!ok) fehler++; console.log('  ' + (ok ? '✔' : '✘') + ' ' + t); };

/* ---------- Funktionen aus der Quelle holen ---------- */
function schneide(text, name){
  const auf = text.indexOf('function ' + name + '(');
  if (auf < 0){ console.error('⛔ ' + name + '() nicht gefunden.'); process.exit(1); }
  /* Ein Einzeiler endet in seiner eigenen Zeile — sonst liefe der Schnitt bis ans Ende der nächsten Funktion. */
  const zeile = text.slice(auf, text.indexOf('\n', auf));
  if (zeile.trimEnd().endsWith('}')) return zeile;
  const zu = text.indexOf('\n}', auf);
  if (zu < 0){ console.error('⛔ ' + name + '(): kein Ende gefunden.'); process.exit(1); }
  return text.slice(auf, zu + 2);
}
const AUS_BUCH = ['aktiveBuecher', 'kapitelAuswahl', 'buchGewaehlt', 'irgendwoEingeengt', 'aktivesBuch', 'koranListe',
  'koranBuchInfo', 'koranKarten', 'koranStueck', 'alleBuecher', 'buchInfo', 'koranKartenEinordnen', 'koranVertritt',
  'kapitelDesBuchs'];
const AUS_KERN = ['hatFortschritt', 'uebertrageFortschritt', 'merkeUebertragen', 'istBekannt', 'fachbegriffFolgtRegel',
  'passtZurAuswahl', 'nieAbgefragt', 'neueZuerst', 'kapitelBeschriftung',
  'dubForm', 'dubOhneArtikel', 'dubGleich', 'dubBedeutungGleich', 'dubletteImBuch'];
function quelltext(kern = KERN, buch = BUCH){
  return [
    kern.match(/const DUB_HARAKA_ENDE = [^\n]*/)[0],
    buch.match(/const KORAN_BUCH = '[^']*';/)[0],
    buch.match(/const KORAN_KARTE = new Map\(\);/)[0],
    ...AUS_BUCH.map(n => schneide(buch, n)),
    ...AUS_KERN.map(n => schneide(kern, n)),
  ].join('\n');
}

/* ---------- Eine kleine App darum herum ---------- */
const KLEINE_LISTE = [
  { id: 'kh-001', rang: 1, kap: 1, ar: 'مِنْ', de: 'von, aus', type: 'particle', gleich: ['45808'] },
  { id: 'kh-020', rang: 2, kap: 1, ar: 'يَوْمٌ', de: 'Tag', type: 'noun' },
  { id: 'kh-008', rang: 3, kap: 1, ar: 'لَا', de: 'nicht; kein', type: 'particle', gleich: ['45775'] },
  { id: 'kh-047', rang: 4, kap: 2, ar: 'كِتَابٌ', de: 'Buch; Schrift', type: 'noun', gleich: ['45754', '50002'] },
  { id: 'kh-081', rang: 5, kap: 2, ar: 'بَعْدَ', de: 'nach', type: 'particle' },
];
/** `buecher` = seine Auswahl, `geladen` = hat er die Gruppe in dieser Sitzung geladen, `eigeneKarte` = er hat „nach" selbst angelegt. */
function baueWelt({ code = quelltext(), buecher = { 'madina-1': [1, 2], 'koran-haeufig': [] }, geladen = true, progress = {}, eigeneKarte = false } = {}){
  const welt = {
    KORAN_HAEUFIG: KLEINE_LISTE,
    BUECHER: [{ slug: 'madina-1', vokabeln: 298, kapitel: 24, datei: 'data/vokabeln-madina-1.js' }],
    VOCAB_DATA: [
      { id: '45808', ar: 'مِنْ', de: 'von, aus', type: 'particle', chapter: 1, book: 'madina-1' },
      { id: '45775', ar: 'لَا', de: 'nein', type: 'particle', chapter: 2, book: 'madina-1' },
      { id: '45754', ar: 'كِتَابٌ', de: 'Buch', type: 'noun', chapter: 14, book: 'madina-1' },
      { id: '45900', ar: 'قَلَمٌ', de: 'Stift', type: 'noun', chapter: 2, book: 'madina-1' },
    ],
    PROGRESS: Object.assign({
      '45808': { box: 1, nextReview: '2026-08-11', correct: 0, wrong: 0 },
      '45775': { box: 1, nextReview: '2026-08-11', correct: 0, wrong: 0 },
      '45754': { box: 1, nextReview: '2026-08-11', correct: 0, wrong: 0 },
      '45900': { box: 1, nextReview: '2026-08-11', correct: 0, wrong: 0 },
    }, progress),
    SETTINGS: { buecher, eigeneGewaehlt: true },
    GELADENE_BUECHER: new Set(['madina-1']),
    BUCH_FEHLT: new Set(),
    LERNBESTAND_IDS: new Set(),
    FREIGESCHALTET: { 'madina-1': [1, 2, 3] },
    GRAMMAR_RULES: [],
    gespeichert: [],
  };
  welt.saveProgress = () => welt.gespeichert.push('vt_progress');
  welt.todayStr = () => '2026-10-11';
  welt.istEinzelnFrei = () => false;
  welt.kennErSchon = () => false;
  welt.buchKurz = s => 'KURZ(' + s + ')';
  welt.einhaengen = liste => {
    const da = new Set(welt.VOCAB_DATA.map(w => String(w.id)));
    for (const k of liste) if (!da.has(String(k.id))) welt.VOCAB_DATA.push(Object.assign({}, k));
    return {};
  };
  if (eigeneKarte){
    /* Sein Fall, gemessen am 11.10.2026: „(von) nach / danach" hat er selbst angelegt und schon gelernt. */
    welt.VOCAB_DATA.push({ id: 'p_9', ar: 'بَعْدَ', de: '(von) nach / danach', type: 'particle', chapter: 'personal' });
    welt.PROGRESS.p_9 = { box: 3, nextReview: '2026-10-12', correct: 4, wrong: 1 };
  }
  const namen = Object.keys(welt);
  const fn = new Function(...namen, code + '\nreturn { ' + AUS_BUCH.concat(AUS_KERN).join(', ') + ', KORAN_KARTE, KORAN_BUCH };');
  const api = fn(...namen.map(n => welt[n]));
  if (geladen){
    /* So lädt setzeBuch() die Gruppe: Karten einhängen, jede bekommt einen Eintrag mit dem Tag von heute. */
    welt.einhaengen(api.koranKarten());
    welt.GELADENE_BUECHER.add('koran-haeufig');
    for (const k of api.koranKarten()) if (!welt.PROGRESS[k.id]) welt.PROGRESS[k.id] = { box: 1, nextReview: '2026-10-11', correct: 0, wrong: 0 };
  }
  welt.hat = id => welt.VOCAB_DATA.some(w => String(w.id) === String(id));
  welt.karte = id => welt.VOCAB_DATA.find(w => String(w.id) === String(id));
  return { welt, api };
}

/* ---------- Die Fälle. Jeder gibt true zurück, wenn die Regel hält — so kann ein Störtest ihn wiederverwenden. ---------- */
function fallNichtDoppelt(code){
  const { welt, api } = baueWelt({ code });
  const r = api.koranKartenEinordnen();
  return !welt.hat('kh-001') && !welt.hat('kh-008')          /* kennt er aus Kapitel 1 und 2 */
    && welt.hat('kh-020') && welt.hat('kh-047')              /* kein Gegenstück bzw. Kapitel 14 nicht freigeschaltet */
    && welt.hat('45808') && welt.hat('45775')
    && r.vertreten === 2 && r.eigene === 3 && r.uebertragen.length === 0
    && api.KORAN_KARTE.get('45808') === KLEINE_LISTE[0] && api.KORAN_KARTE.get('kh-047') === KLEINE_LISTE[3];
}
function fallEigeneKarteBleibt(code){
  /* Eingeengt und „Eigene" abgehakt: seine Karte käme sonst nicht — über die Gruppe gehört sie dazu. */
  const { welt, api } = baueWelt({ code, eigeneKarte: true });
  welt.SETTINGS.eigeneGewaehlt = false;
  const eigen = welt.karte('p_9');
  const keinTausch = api.dubletteImBuch(eigen) == null;      /* die Karte der Gruppe ist geladen und KEIN Tauschziel */
  const vorher = JSON.stringify(welt.PROGRESS.p_9);
  api.koranKartenEinordnen();
  return keinTausch && welt.hat('p_9') && !welt.hat('kh-081') && api.KORAN_KARTE.get('p_9') === KLEINE_LISTE[4]
    && JSON.stringify(welt.PROGRESS.p_9) === vorher && api.passtZurAuswahl(eigen) === true;
}
function fallKarteMitFortschrittVertritt(code){
  /* Die Buchkarte liegt in Kapitel 14 (nicht gewählt), hat aber Fortschritt: sie bleibt und steht für das Wort. */
  const { welt, api } = baueWelt({ code, progress: { '45754': { box: 3, nextReview: '2026-10-12', correct: 4, wrong: 1 } } });
  api.koranKartenEinordnen();
  const k = welt.karte('45754');
  return !welt.hat('kh-047') && api.istBekannt(k) === true && api.passtZurAuswahl(k) === true
    && welt.PROGRESS['45754'].box === 3;
}
function fallVertretungHaengtAnSeinerWahl(code){
  const p = { '45754': { box: 3, nextReview: '2026-10-12', correct: 4, wrong: 1 } };
  /* Stück 2 der Gruppe nicht gewählt → die Buchkarte aus Kapitel 14 gehört nicht in seine Auswahl. */
  const a = baueWelt({ code, progress: p, buecher: { 'madina-1': [1, 2], 'koran-haeufig': [1] } });
  a.api.koranKartenEinordnen();
  /* Gruppe gar nicht gewählt (aber in dieser Sitzung geladen). */
  const b = baueWelt({ code, progress: p, buecher: { 'madina-1': [1, 2] } });
  b.api.koranKartenEinordnen();
  return a.api.passtZurAuswahl(a.welt.karte('45754')) === false
    && b.api.passtZurAuswahl(b.welt.karte('45754')) === false;
}
function fallStandWandertEinmal(code){
  /* Er hat „Buch" zuerst in der Gruppe gelernt (Box 4) und hakt dann Kapitel 14 an. */
  const { welt, api } = baueWelt({ code, progress: { 'kh-047': { box: 4, nextReview: '2026-10-20', correct: 5, wrong: 1, ts: 5 } } });
  api.koranKartenEinordnen();
  if (!welt.hat('kh-047')) return false;                     /* vorher steht die Karte der Gruppe */
  welt.SETTINGS.buecher['madina-1'] = [1, 2, 14];
  const r = api.koranKartenEinordnen();
  const erster = !welt.hat('kh-047') && welt.PROGRESS['45754'].box === 4 && welt.PROGRESS['45754'].correct === 5
    && welt.PROGRESS['kh-047'].uebertragen === '45754' && welt.PROGRESS['kh-047'].box === 1
    && r.uebertragen.length === 1;
  /* Er legt die Kapitelkarte von Hand zurück; die Gruppe wird neu geladen (nächster Start). Der alte Stand darf nicht wiederkommen. */
  welt.PROGRESS['45754'] = { box: 2, nextReview: '2026-10-13', correct: 5, wrong: 2, ts: 9 };
  welt.einhaengen(api.koranKarten());
  const r2 = api.koranKartenEinordnen();
  return erster && welt.PROGRESS['45754'].box === 2 && r2.uebertragen.length === 0 && !welt.hat('kh-047');
}
function fallHoehereBoxGewinnt(code){
  const { welt, api } = baueWelt({ code, buecher: { 'madina-1': [1, 2, 14], 'koran-haeufig': [] },
    progress: { 'kh-047': { box: 2, nextReview: '2026-10-12', correct: 2, wrong: 0 }, '45754': { box: 5, nextReview: '2026-11-01', correct: 9, wrong: 1 } } });
  api.koranKartenEinordnen();
  return welt.PROGRESS['45754'].box === 5 && welt.PROGRESS['45754'].correct === 9 && !welt.hat('kh-047');
}
function fallKarteKommtZurueck(code){
  const { welt, api } = baueWelt({ code });
  api.koranKartenEinordnen();
  welt.SETTINGS.buecher['madina-1'] = [1];                   /* Kapitel 2 abgehakt: „nein" kennt er nicht mehr, Fortschritt hat sie keinen */
  delete welt.PROGRESS['kh-008'];
  api.koranKartenEinordnen();
  return welt.hat('kh-008') && !!welt.PROGRESS['kh-008'] && api.KORAN_KARTE.get('kh-008') === KLEINE_LISTE[2]
    && !api.KORAN_KARTE.has('45775') && !welt.hat('kh-001');
}
function fallNichtGeladen(code){
  const { welt, api } = baueWelt({ code, geladen: false });
  const r = api.koranKartenEinordnen();
  return !welt.VOCAB_DATA.some(w => w.book === 'koran-haeufig') && r.vertreten === 2 && r.eigene === 0
    && api.KORAN_KARTE.size === 2;
}
function fallReihenfolge(code){
  const { welt, api } = baueWelt({ code });
  api.koranKartenEinordnen();
  /* Die Gruppe trägt den Tag von heute, das Unterrichtswort einen älteren — nach „jüngste zuerst" käme die Gruppe davor. */
  const beantwortet = { id: 'x1', ar: 'ا', de: 'alt', chapter: 1, book: 'madina-1' };
  welt.PROGRESS.x1 = { box: 1, nextReview: '2026-10-11', correct: 0, wrong: 3 };
  const ein = [welt.karte('kh-047'), beantwortet, welt.karte('kh-020'), welt.karte('45900')];
  const aus = api.neueZuerst(ein).map(w => String(w.id));
  return aus.join(' ') === '45900 kh-020 kh-047 x1';
}
function fallHerkunft(code){
  const { welt, api } = baueWelt({ code });
  api.koranKartenEinordnen();
  return api.kapitelBeschriftung(welt.karte('kh-020')) === 'Koran · Platz 2'
    && api.kapitelBeschriftung(welt.karte('45900')) === 'KURZ(madina-1) · Kap. 2';
}

console.log('=== 1. Die Liste und die Datendatei ===\n');
const listenText = lies('werkzeuge', 'koran-haeufig-liste.txt');
const { karten, fehler: listenFehler } = leseListe(listenText);
const felderText = fs.existsSync(FELDER) ? fs.readFileSync(FELDER, 'utf8').replace(/\r\n/g, '\n') : '';
const FELDER_GELESEN = leseFelder(felderText, karten);
const stellenText = fs.existsSync(STELLEN) ? fs.readFileSync(STELLEN, 'utf8') : '{}';
const STELLEN_GELESEN = leseStellen(stellenText, karten, FELDER_GELESEN.felder);
const satzText = fs.existsSync(SATZVERSE) ? fs.readFileSync(SATZVERSE, 'utf8') : '{}';
const SATZ_GELESEN = leseSatzverse(satzText, karten, STELLEN_GELESEN.stellen);
{
  sag(listenFehler.length === 0, 'die Liste hat keinen Fehler' + (listenFehler.length ? ' — ' + listenFehler.slice(0, 3).join(' | ') : ''));
  const zeilen = karten.flatMap(k => k.zeilen);
  sag(zeilen.length === ZEILEN_DER_TABELLE && new Set(zeilen).size === ZEILEN_DER_TABELLE,
      `alle ${ZEILEN_DER_TABELLE} Zeilen seiner Tabelle liegen auf genau einer Karte (${karten.length} Karten)`);
  sag(karten.reduce((s, k) => s + k.n, 0) === SUMME, `die Häufigkeiten ergeben ${SUMME}`);
  sag(karten.every((k, i) => i === 0 || k.n <= karten[i - 1].n), 'die Karten stehen nach Häufigkeit, das häufigste zuerst');
  const da = fs.existsSync(ZIEL) ? fs.readFileSync(ZIEL, 'utf8').replace(/\r\n/g, '\n') : null;
  sag(da === baueDatei(karten, FELDER_GELESEN.felder, STELLEN_GELESEN.stellen, SATZ_GELESEN.saetze), 'koran-haeufig-data.js ist genau das, was der Erzeuger aus Liste, Felder-Datei, Koranstellen und Koransätzen baut');
  /* Störtests */
  const ersteDaten = listenText.split('\n').findIndex(l => l && !l.startsWith('#'));
  const zeilenL = listenText.split('\n');
  const doppelt = zeilenL.slice(); doppelt.splice(ersteDaten + 1, 0, zeilenL[ersteDaten]);
  sag(leseListe(doppelt.join('\n')).fehler.length > 0, '⛔ Störtest: eine doppelte Zeile macht die Liste rot');
  const ohne = zeilenL.slice(); ohne.splice(ersteDaten + 5, 1);
  sag(leseListe(ohne.join('\n')).fehler.some(f => f.includes('steht auf keiner Karte')), '⛔ Störtest: eine fehlende Tabellenzeile wird gemeldet');
  const geaendert = karten.map((k, i) => i === 3 ? Object.assign({}, k, { de: k.de + ' x' }) : k);
  sag(da !== baueDatei(geaendert, FELDER_GELESEN.felder, STELLEN_GELESEN.stellen, SATZ_GELESEN.saetze), '⛔ Störtest: ein geändertes Wort in der Liste passt nicht mehr zur Datendatei');
}

console.log('\n=== 1b. Die Felder des vollen Programms (Wurzel, Geschlecht, Einzahl, Mehrzahl, Verbformen) ===\n');
{
  /* Elias, 20.08.2026: „es muss halt recht klar sein was ‚das volle programm‘ ist … und einfach irgendwas machst."
     Bewacht wird, dass kein Feld ohne Beleg, an der falschen Wortart oder an einer fremden Kennung steht — und
     dass die App die Felder wirklich an die Karte bringt. Ein FALSCHES Feld ist schädlicher als ein leeres
     (VOLLES-PROGRAMM.md): die Verbformen und die Mehrzahl steuern, wie jeder Satz zerlegt wird. */
  const F = FELDER_GELESEN;
  sag(F.fehler.length === 0, 'die Felder-Datei hat keinen Fehler' + (F.fehler.length ? ' — ' + F.fehler.slice(0, 3).join(' | ') : ''));
  sag(F.zeilen > 0 && [...F.felder.keys()].every(id => karten.some(k => k.id === id)), `${F.zeilen} Felder an ${F.felder.size} Karten, jede Kennung steht in der Liste`);
  sag([...F.belege.values()].every(b => Object.values(b).every(t => t && t.length > 5)), 'jedes Feld nennt seinen Beleg');
  const typ = new Map(karten.map(k => [k.id, k.type]));
  sag([...F.felder].every(([id, f]) => Object.keys(f).every(name => FELDER_JE_TYP[typ.get(id)].includes(name))), 'jedes Feld passt zur Wortart seiner Karte (keine Verbform an einem Nomen, keine Wurzel an einer Partikel)');
  sag([...F.felder].every(([id, f]) => typ.get(id) !== 'verb' || !f.past || f.past === karten.find(k => k.id === id).ar), 'die Vergangenheitsform eines Verbs ist die Schreibung seiner Karte');
  /* Störtests: je eine falsche Zeile an die echte Datei gehängt */
  const erste = [...F.felder.keys()][0];
  const einVerb = karten.find(k => k.type === 'verb' && F.felder.has(k.id)), einNomen = karten.find(k => k.type === 'noun' && F.felder.has(k.id) && F.felder.get(k.id).sg);
  const einePartikel = karten.find(k => k.type === 'particle');
  const mit = zeile => leseFelder(felderText + '\n' + zeile + '\n', karten).fehler;
  sag(mit('kh-999|root|x y z|Probe').some(f => f.includes('steht nicht in der Liste')), '⛔ Störtest: ein Feld an einer Kennung, die es nicht gibt, wird gemeldet');
  sag(!!einNomen && !!einVerb && mit(einNomen.id + '|present|' + F.felder.get(einVerb.id).present + '|Probe').some(f => f.includes('trägt kein Feld')), '⛔ Störtest: eine Verbform an einem Nomen wird gemeldet');
  sag(!!einePartikel && mit(einePartikel.id + '|root|' + F.felder.get(einVerb.id).root + '|Probe').some(f => f.includes('trägt kein Feld')), '⛔ Störtest: eine Wurzel an einer Partikel wird gemeldet');
  sag(mit(einVerb.id + '|present|' + F.felder.get(einVerb.id).present + '|Probe').some(f => f.includes('schon')), '⛔ Störtest: dasselbe Feld zweimal wird gemeldet');
  const ohneFeld = (id, feld) => felderText.split('\n').filter(z => !z.startsWith(id + '|' + feld + '|')).join('\n');
  const nur = (id, feld, zeile) => leseFelder(ohneFeld(id, feld) + '\n' + zeile + '\n', karten).fehler;
  sag(nur(einVerb.id, 'present', einVerb.id + '|present|' + F.felder.get(einVerb.id).present + '|').some(f => f.includes('ohne Beleg')), '⛔ Störtest: ein Feld ohne Beleg wird gemeldet');
  sag(nur(einVerb.id, 'past', einVerb.id + '|past|' + F.felder.get(einVerb.id).present + '|Probe').some(f => f.includes('nicht die Schreibung der Karte')), '⛔ Störtest: eine Vergangenheitsform, die nicht die Karte ist, wird gemeldet');
  const NACKT = new RegExp('[' + String.fromCodePoint(0x64B) + '-' + String.fromCodePoint(0x652) + ']', 'g');
  sag(nur(einVerb.id, 'present', einVerb.id + '|present|' + F.felder.get(einVerb.id).present.replace(NACKT, '') + '|Probe').some(f => f.includes('ohne Vokalzeichen')), '⛔ Störtest: eine Form ohne Vokalzeichen wird gemeldet');
  sag(nur(einNomen.id, 'gender', einNomen.id + '|gender|männlich|Probe').some(f => f.includes('kennt nur masculine und feminine')), '⛔ Störtest: ein Geschlecht, das die App nicht kennt, wird gemeldet');
  sag(nur(einVerb.id, 'root', einVerb.id + '|root|' + F.felder.get(einVerb.id).root.replace(/ /g, '') + '|Probe').some(f => f.includes('Wurzel')), '⛔ Störtest: eine Wurzel ohne Leerzeichen wird gemeldet');
  const anders = new Map(F.felder); anders.set(erste, Object.assign({}, F.felder.get(erste), { root: 'x y z' }));
  sag(fs.readFileSync(ZIEL, 'utf8').replace(/\r\n/g, '\n') !== baueDatei(karten, anders, STELLEN_GELESEN.stellen, SATZ_GELESEN.saetze), '⛔ Störtest: ein geändertes Feld passt nicht mehr zur Datendatei');
  /* Die App: koranKarten() reicht die Felder an die Karte durch */
  const fallFelder = (code) => {
    const { welt, api } = baueWelt({ code });
    const vorher = welt.KORAN_HAEUFIG.slice();   /* die Welt teilt sich EINE Liste mit allen Fällen — danach genau so zurücklegen */
    welt.KORAN_HAEUFIG.push({ id: 'kh-998', rang: 6, kap: 2, ar: 'V', de: 'Probe', type: 'verb', root: 'R', past: 'V', present: 'G', imperative: 'B', masdar: 'M' },
                            { id: 'kh-997', rang: 7, kap: 2, ar: 'N', de: 'Probe', type: 'noun', gender: 'feminine', sg: 'N', pl: 'P' });
    const k = api.koranKarten();
    const v = k.find(x => x.id === 'kh-998'), n = k.find(x => x.id === 'kh-997'), ohne = k.find(x => x.id === 'kh-001');
    welt.KORAN_HAEUFIG.length = 0; welt.KORAN_HAEUFIG.push(...vorher);
    return !!v && !!n && v.root === 'R' && v.present === 'G' && v.imperative === 'B' && v.masdar === 'M' && n.gender === 'feminine' && n.pl === 'P' && n.sg === 'N'
      && v.chapter === 2 && v.book === 'koran-haeufig' && !('root' in ohne) && !('pl' in ohne);
  };
  sag(fallFelder(), 'die App bringt die Felder an die Karte (koranKarten); eine Karte ohne Felder bekommt keine leeren');
  const ohneDurchreichen = BUCH.replace('    for (const f of FELDER) if (e[f]) k[f] = e[f];\n', '');
  sag(ohneDurchreichen !== BUCH && !fallFelder(quelltext(KERN, ohneDurchreichen)), '⛔ Störtest: ohne das Durchreichen kämen die Felder nie an der Karte an');
  /* ---------- Die Koranstellen (A11, 13.10.2026) ---------- */
  {
    const S = STELLEN_GELESEN;
    sag(S.fehler.length === 0, 'die Koranstellen lösen sich ohne Fehler auf' + (S.fehler.length ? ' — ' + S.fehler.slice(0, 3).join(' | ') : ''));
    sag(S.stellen.size >= 25 && S.ohne >= 5, `${S.stellen.size} Karten tragen eine Stelle aus seinem auswendigen Bereich, ${S.ohne} bewusst keine (mit Grund)`);
    sag([...S.stellen.values()].every(q => q.surah && /^\d+:\d+$/.test(q.ayah) && q.ar && q.de), 'jede Stelle hat Surenname, Sure:Vers, Wortlaut und Deutsch');
    const vorlage = JSON.parse(stellenText);
    const mit = (id, aenderung) => { const v = JSON.parse(stellenText); v[id] = Object.assign({}, v[id], aenderung); return leseStellen(JSON.stringify(v), karten, FELDER_GELESEN.felder).fehler; };
    const probe = Object.keys(vorlage).find(id => id !== '_' && vorlage[id].wo && vorlage[id].de === '*');
    sag(mit(probe, { wo: '2:2', wort: 1 }).some(f => f.includes('nicht in seinem auswendigen Bereich')), '⛔ Störtest: ein Vers außerhalb seines Bereichs wird gemeldet');
    sag(mit(probe, { wo: 'D1.1' }).some(f => f.includes('keine Koranstelle')), '⛔ Störtest: eine Dua als Koranstelle wird gemeldet');
    sag(mit(probe, { de: 'Das habe ich mir ausgedacht' }).some(f => f.includes('nicht wörtlich')), '⛔ Störtest: ein Deutsch, das nicht in der Übersetzung der Datei steht, wird gemeldet');
    sag(mit(probe, { wort: vorlage[probe].wort === 1 ? 2 : 1 }).some(f => f.includes('Wort ')), '⛔ Störtest: eine falsch gezählte Wortnummer wird gemeldet');
    sag(mit(probe, { ohne: 'ein Grund, der lang genug ist' }).some(f => f.includes('zugleich')), '⛔ Störtest: Stelle und „ohne" zugleich wird gemeldet');
    const fremd = JSON.parse(stellenText); fremd['kh-999'] = { wo: '112:1', wort: 3, de: '*' };
    sag(leseStellen(JSON.stringify(fremd), karten, FELDER_GELESEN.felder).fehler.some(f => f.includes('keine Karte')), '⛔ Störtest: eine Stelle an einer Kennung, die es nicht gibt, wird gemeldet');
    const ohneEine = new Map(S.stellen); ohneEine.delete(probe);
    sag(fs.readFileSync(ZIEL, 'utf8').replace(/\r\n/g, '\n') !== baueDatei(karten, FELDER_GELESEN.felder, ohneEine, SATZ_GELESEN.saetze), '⛔ Störtest: eine fehlende Stelle passt nicht mehr zur Datendatei');
    /* Die App: koranKarten() reicht die Stelle an die Karte durch */
    const fallStelle = (code) => {
      const { welt, api } = baueWelt({ code });
      const vorher = welt.KORAN_HAEUFIG.slice();
      welt.KORAN_HAEUFIG.push({ id: 'kh-996', rang: 8, kap: 2, ar: 'Q', de: 'Probe', type: 'noun', quran: { surah: 'S', ayah: '1:1', ar: 'Q', de: 'D' } });
      const k = api.koranKarten();
      const q = k.find(x => x.id === 'kh-996'), ohne = k.find(x => x.id === 'kh-001');
      welt.KORAN_HAEUFIG.length = 0; welt.KORAN_HAEUFIG.push(...vorher);
      return !!q && !!q.quran && q.quran.ayah === '1:1' && q.quran.de === 'D' && !!ohne && !('quran' in ohne);
    };
    sag(fallStelle(), 'die App bringt die Koranstelle an die Karte (koranKarten); eine Karte ohne Stelle bekommt keine');
    const ohneQ = BUCH.replace('    if (e.quran) k.quran = e.quran;\n', '');
    sag(ohneQ !== BUCH && !fallStelle(quelltext(KERN, ohneQ)), '⛔ Störtest: ohne das Durchreichen käme die Koranstelle nie an der Karte an');
  }
  /* ---------- Die Koransätze (24.10.2026) ----------
     Elias, 23.10.2026, 23:25: „für die koranwörter von den häufigsten gibt es keinen beispielsatz, da kannst du ruhig
     aus dem koran die nehmen vorallem wenn ich sie bereits kenne". Die Anzeige auf der Karte prüft
     test-koransatz-karte.mjs in der echten App; hier die Vorlage, der Erzeuger und das Durchreichen. */
  {
    const K = SATZ_GELESEN;
    sag(K.fehler.length === 0, 'die Koransätze lösen sich ohne Fehler auf' + (K.fehler.length ? ' — ' + K.fehler.slice(0, 3).join(' | ') : ''));
    sag(K.saetze.size + K.ohne === karten.length, `jede Karte hat einen Koransatz oder einen Grund (${K.saetze.size} mit, ${K.ohne} ohne, ${karten.length} Karten)`);
    sag([...STELLEN_GELESEN.stellen.keys()].every(id => K.saetze.get(id) && K.saetze.get(id).ayah === STELLEN_GELESEN.stellen.get(id).ayah),
        'eine Karte mit Stelle aus seinem Bereich hat genau diese Stelle als Koransatz');
    sag([...K.saetze.values()].every(s => s.surah && /^\d+:\d+$/.test(s.ayah) && s.ar && s.de && s.w >= 1 && s.w <= s.ar.split(/\s+/).length),
        'jeder Koransatz hat Surenname, Sure:Vers, Wortlaut, Deutsch und die Stelle des Wortes im Zitat');
    const vorlage = JSON.parse(satzText);
    const mit = (id, aenderung) => { const v = JSON.parse(satzText); v[id] = Object.assign({}, v[id], aenderung); return leseSatzverse(JSON.stringify(v), karten, STELLEN_GELESEN.stellen).fehler; };
    const probe = Object.keys(vorlage).find(id => id !== '_' && vorlage[id].wo && vorlage[id].de === '*' && !vorlage[id].form);
    const andere = Object.keys(vorlage).find(id => id !== '_' && vorlage[id].form === 'andere');
    sag(mit(probe, { wort: vorlage[probe].wort === 1 ? 2 : 1 }).some(f => f.includes('nicht genau die Form')), '⛔ Störtest: eine falsch gezählte Wortnummer wird gemeldet (Form mit Vokalen verglichen)');
    sag(mit(probe, { de: 'Das habe ich mir ausgedacht' }).some(f => f.includes('nicht wörtlich')), '⛔ Störtest: ein Deutsch, das nicht in der Übersetzung der Datei steht, wird gemeldet');
    sag(mit(probe, { von: 2 }).some(f => f.includes('„*" gilt nur')), '⛔ Störtest: „*" an einem Ausschnitt wird gemeldet');
    sag(mit(probe, { wo: 'D1.1' }).some(f => f.includes('keine Koranstelle')), '⛔ Störtest: eine Dua als Koransatz wird gemeldet');
    sag(!!andere && mit(andere, { warum: '' }).some(f => f.includes('ohne Grund')), '⛔ Störtest: „form: andere" ohne Grund wird gemeldet');
    sag(!!andere && mit(andere, { wort: vorlage[andere].wort === 1 ? 2 : vorlage[andere].wort - 1 }).some(f => f.includes('festen Buchstaben')), '⛔ Störtest: bei „form: andere" fällt eine falsche Wortnummer auf');
    sag(mit(probe, { form: 'frei' }).some(f => f.includes('kennt der Erzeuger nicht')), '⛔ Störtest: eine unbekannte Form wird gemeldet');
    const mitStelle = [...STELLEN_GELESEN.stellen.keys()][0];
    const doppelt = JSON.parse(satzText); doppelt[mitStelle] = { wo: '112:1', wort: 3, de: '*' };
    sag(leseSatzverse(JSON.stringify(doppelt), karten, STELLEN_GELESEN.stellen).fehler.some(f => f.includes('hat schon eine Stelle')), '⛔ Störtest: ein Eintrag für eine Karte mit Stelle wird gemeldet');
    const luecke = JSON.parse(satzText); delete luecke[probe];
    sag(leseSatzverse(JSON.stringify(luecke), karten, STELLEN_GELESEN.stellen).fehler.some(f => f.includes('ohne Koransatz und ohne Grund')), '⛔ Störtest: eine Karte ohne Koransatz und ohne Grund wird gemeldet');
    const ohneEinen = new Map(K.saetze); ohneEinen.delete(probe);
    sag(fs.readFileSync(ZIEL, 'utf8').replace(/\r\n/g, '\n') !== baueDatei(karten, FELDER_GELESEN.felder, STELLEN_GELESEN.stellen, ohneEinen), '⛔ Störtest: ein fehlender Koransatz passt nicht mehr zur Datendatei');
    /* Die App: koranKarten() reicht den Koransatz an die Karte durch */
    const fallSatz = (code) => {
      const { welt, api } = baueWelt({ code });
      const vorher = welt.KORAN_HAEUFIG.slice();
      welt.KORAN_HAEUFIG.push({ id: 'kh-995', rang: 8, kap: 2, ar: 'Q', de: 'Probe', type: 'noun', koranSatz: { surah: 'S', ayah: '1:1', ar: 'A B', de: 'D', w: 2 } });
      const k = api.koranKarten();
      const q = k.find(x => x.id === 'kh-995');
      welt.KORAN_HAEUFIG.length = 0; welt.KORAN_HAEUFIG.push(...vorher);
      return !!q && !!q.koranSatz && q.koranSatz.w === 2 && q.koranSatz.de === 'D';
    };
    sag(fallSatz(), 'die App bringt den Koransatz an die Karte (koranKarten)');
    const ohneS = BUCH.replace('    if (e.koranSatz) k.koranSatz = e.koranSatz;\n', '');
    sag(ohneS !== BUCH && !fallSatz(quelltext(KERN, ohneS)), '⛔ Störtest: ohne das Durchreichen käme der Koransatz nie an der Karte an');
  }
}

console.log('\n=== 2. Was die App lädt ===\n');
const ctx = { window: { VOKABELN: {} }, console };
vm.createContext(ctx);
vm.runInContext(lies('koran-haeufig-data.js') + '\n;globalThis.__K = KORAN_HAEUFIG;', ctx);
const DATEN = ctx.__K;
{
  sag(Array.isArray(DATEN) && DATEN.length === karten.length, `KORAN_HAEUFIG hat ${karten.length} Einträge`);
  sag(new Set(DATEN.map(e => e.id)).size === DATEN.length && DATEN.every(e => /^kh-\d{3}$/.test(e.id)), 'jede Kennung gibt es einmal (kh-NNN)');
  sag(DATEN.every((e, i) => e.rang === i + 1 && e.kap === Math.ceil(e.rang / JE_KAPITEL)), `Rang lückenlos, je ${JE_KAPITEL} Plätze ein Stück`);
  const alle = DATEN.flatMap(e => e.gleich || []);
  sag(new Set(alle).size === alle.length, 'keine Buchkarte steht bei zwei Wörtern');
  const html = lies('index.html'), sw = lies('sw.js');
  const iDaten = html.indexOf('<script src="koran-haeufig-data.js"></script>'), iBuch = html.indexOf('<script src="js/buecher.js"></script>');
  sag(iDaten > 0 && iBuch > iDaten, 'index.html lädt die Datendatei VOR js/buecher.js');
  sag(sw.includes("'./koran-haeufig-data.js'"), 'sw.js führt die Datendatei im Offline-Vorrat');
  /* ⛔ Sein Satz vom 11.10.2026 zur Zeile „N-mal im Koran": „das sollst du nicht bauen, ist glaube unnötig".
     Sie war schon gebaut und ist wieder heraus — hier steht, woran man merkt, wenn sie zurückkommt. */
  const quelle = ['lernen.js', 'kategorien.js', 'buecher.js'].map(f => lies('js', f)).join('\n');
  sag(!html.includes('cardKoranZahl') && !html.includes('koran-zahl') && !html.includes('wk-koran')
      && !quelle.includes('function koranZeile(') && !quelle.includes('koranZeile(w)'),
      '⛔ keine Zeile „N-mal im Koran" auf der Karte (von Elias abgesagt)');
  /* `quran` seit dem 13.10.2026 (A11): gelesen von koranKarten() in js/buecher.js, gezeigt von der Lernkarte.
     `koranSatz` seit dem 24.10.2026: ebenso durchgereicht, gezeigt im Satzkasten der Lernkarte und in der Wortkarte. */
  sag(DATEN.every(e => Object.keys(e).every(k => ['id', 'rang', 'kap', 'ar', 'de', 'type', 'gleich', 'quran', 'koranSatz'].concat(FELD_FOLGE).includes(k))),
      'die Datendatei trägt nur, was die App liest (keine Häufigkeit, kein Zusatz, kein Beleg)');
  sag(DATEN.filter(e => e.quran).every(e => JSON.stringify(Object.keys(e.quran)) === JSON.stringify(['surah', 'ayah', 'ar', 'de'])),
      'eine Koranstelle trägt genau Surenname, Sure:Vers, Wortlaut und Deutsch (wie die Bezüge in vocab-data.js)');
  sag(DATEN.every(e => FELD_FOLGE.every(f => !(f in e) || FELDER_JE_TYP[e.type].includes(f))), 'in der Datendatei trägt keine Karte ein Feld, das ihre Wortart nicht hat');
  sag(/'koran-haeufig': 'Koran häufigste'/.test(BUCH) && /'koran-haeufig': 'Koran'\n/.test(BUCH), 'Titel „Koran häufigste" und Kurzname „Koran" stehen in js/buecher.js');
  sag(!lies('data', 'buecher.js').includes('koran-haeufig'), 'die Gruppe steht NICHT in data/buecher.js (das Verzeichnis gehört dem arabicroots-Abzug)');
}

console.log('\n=== 3. Jede Kennung aus „gleich" gibt es wirklich ===\n');
{
  const dateien = fs.existsSync(path.join(HIER, 'data')) ? fs.readdirSync(path.join(HIER, 'data')).filter(f => /^vokabeln-.*\.js$/.test(f) && f !== 'vokabeln-eigene.js') : [];
  if (dateien.length < 8){
    console.log('  – übersprungen: data/vokabeln-*.js liegt hier nicht vollständig (' + dateien.length + ' von 8 Büchern).');
  } else {
    const buchKarte = new Map();
    vm.runInContext(lies('vocab-data.js') + '\n;globalThis.__V = VOCAB_DATA;', ctx);
    for (const w of ctx.__V) if (w.chapter !== 'personal') buchKarte.set(String(w.id), w);
    for (const f of dateien){
      vm.runInContext(lies('data', f), ctx);
      for (const w of (ctx.window.VOKABELN[f.slice('vokabeln-'.length, -3)] || [])) if (!buchKarte.has(String(w.id))) buchKarte.set(String(w.id), w);
    }
    const fehlt = DATEN.flatMap(e => (e.gleich || []).filter(id => !buchKarte.has(String(id))).map(id => e.id + '→' + id));
    sag(fehlt.length === 0, `alle ${DATEN.flatMap(e => e.gleich || []).length} Kennungen stehen in den acht Büchern` + (fehlt.length ? ' — fehlen: ' + fehlt.slice(0, 8).join(', ') : ''));
    const verworfenFehlt = karten.flatMap(k => k.nicht.filter(id => !buchKarte.has(String(id))).map(id => k.id + '→!' + id));
    sag(verworfenFehlt.length === 0, 'auch jede verworfene Kennung (!) gibt es' + (verworfenFehlt.length ? ' — fehlen: ' + verworfenFehlt.slice(0, 8).join(', ') : ''));

    /* ⛔ Was still veralten kann (12.10.2026): ein Feld der Gruppe gilt als belegt, weil die Buchkarte desselben
       Worts dieselbe Form trägt („gleich Buchkarte N" in der Felder-Datei). Ändert arabicroots die Form dort,
       stünde der Beleg weiter da und stimmte nicht mehr. Verglichen wird wie beim Belegen: mit allen
       Vokalzeichen, ohne Sukun und ohne die Endung am letzten Buchstaben. */
    const Zc = n => String.fromCodePoint(n);
    const ENDE = new RegExp('[' + Zc(0x64B) + '-' + Zc(0x650) + ']*(' + Zc(0x651) + '?)[' + Zc(0x64B) + '-' + Zc(0x650) + ']*$');
    const formKern = s => String(s || '').normalize('NFC').replace(new RegExp(Zc(0x640), 'g'), '').trim().split(/\s+/).map(w => w
      .replace(new RegExp(Zc(0x64B) + Zc(0x627) + '$'), '').replace(new RegExp(Zc(0x627) + Zc(0x64B) + '$'), '').replace(new RegExp(Zc(0x652), 'g'), '').replace(ENDE, '$1')).join(' ');
    const HAMZA = new RegExp('[' + Zc(0x623) + Zc(0x625) + Zc(0x622) + Zc(0x671) + Zc(0x621) + Zc(0x624) + Zc(0x626) + ']', 'g');
    const wurzelKern = r => String(r || '').replace(/\s+/g, '').replace(HAMZA, Zc(0x627));
    const feldGegenBuch = (buecher) => {
      const anders = [];
      for (const [id, belegeDerKarte] of FELDER_GELESEN.belege) for (const [feld, beleg] of Object.entries(belegeDerKarte)){
        const m = /gleich Buchkarte ([\d, ]+)/.exec(beleg);
        if (!m) continue;
        const wert = FELDER_GELESEN.felder.get(id)[feld];
        for (const nr of m[1].split(',').map(x => x.trim()).filter(Boolean)){
          const b = buecher.get(nr);
          const dort = b ? (feld === 'sg' ? (b.sg || b.ar) : b[feld]) : null;
          let gleich;
          if (!dort) gleich = false;
          else if (feld === 'gender') gleich = dort === wert;
          else if (feld === 'root') gleich = wurzelKern(dort) === wurzelKern(wert);
          else { const formen = String(dort).split(/\s*[\/،,]\s*/).map(formKern); gleich = wert.split(' / ').every(x => formen.includes(formKern(x))); }
          if (!gleich) anders.push(id + ' ' + feld + ' ≠ Buchkarte ' + nr);
        }
      }
      return anders;
    };
    /* ⛔ DER ZEUGE IST DER ABZUG, nicht „was gerade in data/ liegt" (12.10.2026). Die Felder-Datei sagt es
       selbst: „verglichen am Abzug". Ist auf die Ersatzdatenbank umgeschaltet, liegen in data/ deren Karten
       und der Abzug steht in data-abzug/ (werkzeuge/datenquelle.mjs). Im Probelauf des Wechsels wurde diese
       Prüfung rot, weil sie die Felder der Gruppe gegen die Ersatzkarten hielt — denen fehlten sechs Angaben
       (eine Mehrzahl, zwei Wurzeln, drei Verbformen); widersprochen hat keine. Das ist ein Mangel der
       Ersatzkarten und steht unten als Hinweis, kein Grund, den Beleg der Gruppe anzuzweifeln. */
    let zeugen = buchKarte, zeugenOrt = '';
    if (abzugGeparkt(HIER)){
      zeugen = new Map();
      for (const w of ctx.__V) if (w.chapter !== 'personal') zeugen.set(String(w.id), w);
      for (const f of fs.readdirSync(abzugOrdner(HIER)).filter(f => /^vokabeln-.*\.js$/.test(f) && f !== 'vokabeln-eigene.js')){
        const fenster = {};
        vm.runInNewContext(fs.readFileSync(path.join(abzugOrdner(HIER), f), 'utf8'), { window: fenster });
        for (const w of (fenster.VOKABELN[f.slice('vokabeln-'.length, -3)] || [])) if (!zeugen.has(String(w.id))) zeugen.set(String(w.id), w);
      }
      zeugenOrt = ' (geprüft am geparkten Abzug in data-abzug/)';
    }
    sag(![...zeugen.values()].some(w => w && w.source === 'ersatz'), 'der Zeuge für „gleich Buchkarte" ist der Abzug von arabicroots, nicht die Ersatzdatenbank');
    const anders = feldGegenBuch(zeugen);
    const mitBeleg = [...FELDER_GELESEN.belege.values()].flatMap(b => Object.values(b)).filter(t => /gleich Buchkarte/.test(t)).length;
    sag(anders.length === 0, `alle ${mitBeleg} Felder mit dem Beleg „gleich Buchkarte" stimmen noch mit ihrer Buchkarte überein${zeugenOrt}` + (anders.length ? ' — ' + anders.slice(0, 6).join(' · ') : ''));
    if (zeugen !== buchKarte){
      const e = feldGegenBuch(buchKarte);
      console.log('  ⓘ gegen die Karten in data/ (Ersatzdatenbank) gehalten: ' + (e.length ? e.length + ' Abweichung(en) — ' + e.join(' · ') : 'keine Abweichung'));
    }
    const [probeId, probeBelege] = [...FELDER_GELESEN.belege].find(([, b]) => Object.values(b).some(t => /gleich Buchkarte/.test(t))) || [];
    if (probeId){
      const feld = Object.keys(probeBelege).find(f => /gleich Buchkarte/.test(probeBelege[f]) && f !== 'gender');
      const nr = /gleich Buchkarte (\d+)/.exec(probeBelege[feld])[1];
      const gestoert = new Map(zeugen); gestoert.set(nr, Object.assign({}, zeugen.get(nr), { [feld]: 'x', sg: 'x', ar: 'x' }));
      sag(feldGegenBuch(gestoert).some(t => t.startsWith(probeId + ' ' + feld)), '⛔ Störtest: ändert sich die Form an der Buchkarte, wird das Feld gemeldet');
    }
  }
}

console.log('\n=== 4. Nicht doppelt, und auf demselben Stand ===\n');
{
  sag(fallNichtDoppelt(), 'kennt er die Buchkarte, fällt die Karte der Gruppe weg; ohne Gegenstück bleibt sie');
  sag(fallKarteMitFortschrittVertritt(), 'eine Buchkarte mit Fortschritt steht für das Wort — auch aus einem nicht gewählten Kapitel');
  sag(fallVertretungHaengtAnSeinerWahl(), 'das gilt nur, solange er die Gruppe und das Stück gewählt hat');
  sag(fallStandWandertEinmal(), 'erst in der Gruppe gelernt, dann das Kapitel angehakt: der Stand wandert — genau einmal');
  sag(fallHoehereBoxGewinnt(), 'haben beide Fortschritt, bleibt die höhere Box');
  sag(fallKarteKommtZurueck(), 'kennt er die Buchkarte nicht mehr, kommt die Karte der Gruppe zurück');
  sag(fallNichtGeladen(), 'ist die Gruppe nicht geladen, legt der Lauf keine Karte an');
  sag(fallEigeneKarteBleibt(), 'ist es eines SEINER eigenen Wörter, bleibt seine Karte mit ihrem Stand — die der Gruppe fällt aus, getauscht wird nichts');
  const mitTausch = KERN.replace("    if (w.book === 'koran-haeufig') return false;\n", '');
  sag(mitTausch !== KERN && !fallEigeneKarteBleibt(quelltext(mitTausch, BUCH)), '⛔ Störtest: ohne die Sperre nähme der Tausch die Karte der Gruppe und löschte seine eigene');
  const ohneSeine = BUCH.replace('      || seine.find(w => {', '      || [].find(w => {');
  sag(ohneSeine !== BUCH && !fallEigeneKarteBleibt(quelltext(KERN, ohneSeine)), '⛔ Störtest: ohne die vierte Stufe käme sein eigenes Wort doppelt');
  /* Störtests: jede Zeile, an der eine seiner Forderungen hängt, einmal herausnehmen. */
  const ohneWeg = BUCH.replace('      weg.add(String(e.id));\n', '');
  sag(ohneWeg !== BUCH && !fallNichtDoppelt(quelltext(KERN, ohneWeg)), '⛔ Störtest: ohne das Wegnehmen käme das Wort doppelt');
  const ohneVermerk = BUCH.replace('        merkeUebertragen(e.id, ziel.id, alt);\n', '');
  sag(ohneVermerk !== BUCH && !fallStandWandertEinmal(quelltext(KERN, ohneVermerk)), '⛔ Störtest: ohne den Vermerk käme der alte Stand beim nächsten Start wieder');
  const zeile = "  if (typeof koranVertritt === 'function' && koranVertritt(w)) return true;\n";
  sag(KERN.split(zeile).length === 3, 'js/kern.js fragt koranVertritt() an genau zwei Stellen (istBekannt, passtZurAuswahl)');
  const ohneBeide = KERN.split(zeile).join('');
  sag(!fallKarteMitFortschrittVertritt(quelltext(ohneBeide, BUCH)), '⛔ Störtest: ohne die zwei Zeilen fiele die Karte mit Fortschritt aus seiner Auswahl');
  const ohneLeeren = BUCH.replace('  KORAN_KARTE.clear();\n', '');
  sag(ohneLeeren !== BUCH && !fallKarteKommtZurueck(quelltext(KERN, ohneLeeren)), '⛔ Störtest: ohne das Leeren gälte eine Karte als bekannt, nur weil sie beim letzten Lauf für ein Wort stand');
}

console.log('\n=== 5. Die Reihenfolge und die Zeile auf der Karte ===\n');
{
  sag(fallReihenfolge(), 'neue Unterrichtswörter zuerst, dann die Gruppe nach Häufigkeit, dann die schon beantworteten');
  const ohneRang = KERN.replace("    if (ka) return (Number(a.koranRang) || 0) - (Number(b.koranRang) || 0);\n", '');
  sag(ohneRang !== KERN && !fallReihenfolge(quelltext(ohneRang, BUCH)), '⛔ Störtest: ohne den Rang kämen die Koranwörter nicht nach Häufigkeit');
  const ohneGruppe = KERN.replace('    if (ka !== kb) return ka ? 1 : -1;\n', '');
  sag(ohneGruppe !== KERN && !fallReihenfolge(quelltext(ohneGruppe, BUCH)), '⛔ Störtest: ohne die Trennung kämen die Koranwörter vor den Unterrichtswörtern');
  sag(fallHerkunft(), 'die Herkunft auf der Karte heißt „Koran · Platz N"; bei einer Buchkarte bleibt „Buch · Kap. N"');
  /* Mit den echten Daten: die Namen der Stücke. */
  const { welt, api } = baueWelt();
  welt.KORAN_HAEUFIG.length = 0; welt.KORAN_HAEUFIG.push(...KLEINE_LISTE);
  const echt = baueWelt({ geladen: false });
  echt.welt.KORAN_HAEUFIG = DATEN;
  const fnEcht = new Function('KORAN_HAEUFIG', 'BUECHER', 'VOCAB_DATA', 'GELADENE_BUECHER', 'BUCH_FEHLT', 'SETTINGS',
    quelltext() + '\nreturn { koranStueck, kapitelDesBuchs, alleBuecher, buchInfo };')(DATEN, echt.welt.BUECHER, [], new Set(), new Set(), echt.welt.SETTINGS);
  const stuecke = fnEcht.kapitelDesBuchs('koran-haeufig');
  const letzter = Math.ceil(DATEN.length / JE_KAPITEL);
  sag(stuecke.length === letzter && fnEcht.koranStueck('koran-haeufig', 1) === '1–' + JE_KAPITEL
      && fnEcht.koranStueck('koran-haeufig', letzter) === ((letzter - 1) * JE_KAPITEL + 1) + '–' + DATEN.length
      && fnEcht.koranStueck('madina-1', 1) === '',
      `${letzter} Stücke, benannt nach ihren Plätzen (1–${JE_KAPITEL} … ${(letzter - 1) * JE_KAPITEL + 1}–${DATEN.length}) — auch ohne eine einzige Karte in VOCAB_DATA`);
  sag(fnEcht.alleBuecher().filter(b => b.slug === 'koran-haeufig').length === 1 && fnEcht.buchInfo('koran-haeufig').vokabeln === DATEN.length
      && fnEcht.buchInfo('madina-1').kapitel === 24, 'die App bietet die Gruppe als Buch an, neben dem Verzeichnis');
  void welt; void api;
}

console.log('\n=== 6. Wann die Regel läuft ===\n');
{
  sag(BUCH.includes("  koranKartenEinordnen();\n  if (typeof blendeKapitelDublettenAus === 'function') blendeKapitelDublettenAus();"),
      'beim Start: unmittelbar VOR blendeKapitelDublettenAus()');
  const nach = schneide(BUCH, 'nachAuswahlwechsel');
  sag(nach.indexOf('koranKartenEinordnen();') > 0 && nach.indexOf('koranKartenEinordnen();') < nach.indexOf('renderHome();'),
      'nach jedem Wechsel der Buchauswahl: als Erstes in nachAuswahlwechsel()');
  const nav = lies('js', 'navigation.js');
  const iSpeichern = nav.indexOf("    if (typeof koranKartenEinordnen === 'function') koranKartenEinordnen();\n    renderHome();");
  sag(iSpeichern > 0, 'nach jedem Kapitel-Knopf: vor dem Neuzeichnen der Startseite (js/navigation.js)');
  sag(BUCH.includes('const koran = still ? null : koranKartenEinordnen();'), 'beim Antippen eines Buchs: vor dem Anlegen der Einträge (setzeBuch)');
}

console.log(fehler ? `\n✘ ${fehler} Prüfung(en) fehlgeschlagen.` : '\n✔ Alles in Ordnung.');
process.exit(fehler ? 1 : 0);
