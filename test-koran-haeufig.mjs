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
import { leseListe, baueDatei, LISTE, ZIEL, ZEILEN_DER_TABELLE, SUMME, JE_KAPITEL } from './werkzeuge/koran-haeufig-bauen.mjs';

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
{
  sag(listenFehler.length === 0, 'die Liste hat keinen Fehler' + (listenFehler.length ? ' — ' + listenFehler.slice(0, 3).join(' | ') : ''));
  const zeilen = karten.flatMap(k => k.zeilen);
  sag(zeilen.length === ZEILEN_DER_TABELLE && new Set(zeilen).size === ZEILEN_DER_TABELLE,
      `alle ${ZEILEN_DER_TABELLE} Zeilen seiner Tabelle liegen auf genau einer Karte (${karten.length} Karten)`);
  sag(karten.reduce((s, k) => s + k.n, 0) === SUMME, `die Häufigkeiten ergeben ${SUMME}`);
  sag(karten.every((k, i) => i === 0 || k.n <= karten[i - 1].n), 'die Karten stehen nach Häufigkeit, das häufigste zuerst');
  const da = fs.existsSync(ZIEL) ? fs.readFileSync(ZIEL, 'utf8').replace(/\r\n/g, '\n') : null;
  sag(da === baueDatei(karten), 'koran-haeufig-data.js ist genau das, was der Erzeuger aus der Liste baut');
  /* Störtests */
  const ersteDaten = listenText.split('\n').findIndex(l => l && !l.startsWith('#'));
  const zeilenL = listenText.split('\n');
  const doppelt = zeilenL.slice(); doppelt.splice(ersteDaten + 1, 0, zeilenL[ersteDaten]);
  sag(leseListe(doppelt.join('\n')).fehler.length > 0, '⛔ Störtest: eine doppelte Zeile macht die Liste rot');
  const ohne = zeilenL.slice(); ohne.splice(ersteDaten + 5, 1);
  sag(leseListe(ohne.join('\n')).fehler.some(f => f.includes('steht auf keiner Karte')), '⛔ Störtest: eine fehlende Tabellenzeile wird gemeldet');
  const geaendert = karten.map((k, i) => i === 3 ? Object.assign({}, k, { de: k.de + ' x' }) : k);
  sag(da !== baueDatei(geaendert), '⛔ Störtest: ein geändertes Wort in der Liste passt nicht mehr zur Datendatei');
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
  sag(DATEN.every(e => Object.keys(e).every(k => ['id', 'rang', 'kap', 'ar', 'de', 'type', 'gleich'].includes(k))),
      'die Datendatei trägt nur, was die App liest (keine Häufigkeit, kein Zusatz)');
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
