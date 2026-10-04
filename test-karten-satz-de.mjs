/* test-karten-satz-de.mjs — bewacht: auf der Karteikarte ist die deutsche Übersetzung
 * des Beispielsatzes erst verschwommen, und ein Antippen zeigt sie.
 *
 * Elias am 05.10.2026, wörtlich: „auch bei den karteikarten bei vokabeln üben sollen die
 * deutschen überstzungen beim satz erstmal verschwommen sein das wie beim satzmodus. also
 * das ich erstmal den arabischen satz lesen muss und beim antippen dann erst detusch
 * sichtbar wird".
 *
 * Geprüft wird am ECHTEN Quelltext, nichts ist nachgebaut:
 *   · aus js/lernen.js die drei Funktionen kartenSatzDe…(), der Klick-Handler der Karte
 *     und das Stück von renderCard(), das den Beispielsatz zeichnet
 *   · aus js/saetze.js deVerschwommenSetzen() — dieselbe Funktion wie im Satzmodus
 * Die Seite selbst ist ein kleines Gerüst aus Elementen mit Klassenliste und Maßen.
 *
 * Drei Störtests belegen, dass der Test rot werden kann:
 *   S1  renderCard() ohne den Aufruf            — die Karte käme lesbar (K1, K11)
 *   S2  Klick-Handler ohne die neue Zeile       — jedes Antippen dreht die Karte um
 *   S3  Treffer nur nach e.target, ohne Stelle  — die Fläche neben der Zeile und der
 *                                                 falsch benannte Klick fallen durch
 *
 *   node test-karten-satz-de.mjs            nur das Ergebnis
 *   node test-karten-satz-de.mjs --alles    jeder Fall mit Messwert
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const WURZEL = path.dirname(fileURLToPath(import.meta.url));
const LERNEN = fs.readFileSync(path.join(WURZEL, 'js', 'lernen.js'), 'utf8');
const SAETZE = fs.readFileSync(path.join(WURZEL, 'js', 'saetze.js'), 'utf8');
const ALLES = process.argv.includes('--alles');

/* Klammerbilanz ab der ersten `{` hinter `anfang` — gibt das Stück samt Klammern zurück. */
function block(text, anfang){
  let i = text.indexOf('{', anfang), tiefe = 0;
  const von = i;
  for (; i < text.length; i++){
    if (text[i] === '{') tiefe++;
    else if (text[i] === '}'){ tiefe--; if (!tiefe) return text.slice(von, i + 1); }
  }
  return null;
}
function funktionAus(text, name){
  const a = text.indexOf('function ' + name + '(');
  if (a < 0) throw new Error(name + '() nicht gefunden');
  return text.slice(a, text.indexOf('{', a)) + block(text, a);
}
function stirb(text){ console.log('✘ ' + text); process.exit(1); }

/* ---------- Die echten Stücke ---------- */
let VERWISCHEN, TREFFER, UMSCHALTEN, SETZEN;
try {
  VERWISCHEN = funktionAus(LERNEN, 'kartenSatzDeVerwischen');
  TREFFER    = funktionAus(LERNEN, 'kartenSatzDeTreffer');
  UMSCHALTEN = funktionAus(LERNEN, 'kartenSatzDeUmschalten');
  SETZEN     = funktionAus(SAETZE, 'deVerschwommenSetzen');
} catch (e){ stirb(e.message + ' — die verschwommene Übersetzung der Karteikarte ist ausgebaut oder umbenannt.'); }

const H_MARKE = "document.getElementById('flashcard').addEventListener('click'";
const hAnfang = LERNEN.indexOf(H_MARKE);
if (hAnfang < 0) stirb('Der Klick-Handler der Karteikarte steht nicht mehr in js/lernen.js.');
const HANDLER = block(LERNEN, hAnfang);

/* Das Stück von renderCard(), das den Beispielsatz zeichnet. */
const rcAnfang = LERNEN.indexOf('function renderCard(){');
if (rcAnfang < 0) stirb('renderCard() steht nicht mehr in js/lernen.js.');
const RENDER = funktionAus(LERNEN, 'renderCard');
const S_VON = "const sentBox = document.getElementById('cardSentenceBox');";
const S_BIS = "else sentBox.classList.add('hidden');";
const sVon = RENDER.indexOf(S_VON), sBis = RENDER.indexOf(S_BIS, sVon);
if (sVon < 0 || sBis < 0) stirb('In renderCard() steht das Stück für den Beispielsatz nicht mehr so da wie erwartet.');
const SATZSTUECK = RENDER.slice(sVon, sBis + S_BIS.length);

/* ---------- Störfassungen (jede muss den Text wirklich ändern) ---------- */
function ohne(text, stueck, wofuer){
  if (!text.includes(stueck)) stirb('Störtest ' + wofuer + ': das Stück, das er entfernt, steht nicht mehr da — Test anpassen.');
  return text.replace(stueck, '');
}
const SATZSTUECK_S1 = ohne(SATZSTUECK, 'kartenSatzDeVerwischen();', 'S1');
const HANDLER_S2 = ohne(HANDLER, 'if (kartenSatzDeTreffer(e)){ kartenSatzDeUmschalten(); return; }', 'S2');
const T_GEO = 'return e.clientX >= k.left && e.clientX <= k.right && e.clientY > a.bottom && e.clientY <= k.bottom;';
if (!TREFFER.includes(T_GEO)) stirb('Störtest S3: die Zeile mit der Stelle des Tippens steht nicht mehr so in kartenSatzDeTreffer().');
const TREFFER_S3 = TREFFER.replace(T_GEO, 'return false;');

/* ---------- Das Gerüst der Seite ---------- */
function element(id, eltern){
  const klassen = new Set();
  const attr = {};
  return {
    id, eltern: eltern || null, textContent: '', innerHTML: '',
    rechteck: { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 },
    classList: {
      add(k){ klassen.add(k); }, remove(k){ klassen.delete(k); },
      contains(k){ return klassen.has(k); },
      toggle(k, an){ const soll = an === undefined ? !klassen.has(k) : !!an; if (soll) klassen.add(k); else klassen.delete(k); return soll; }
    },
    setAttribute(n, v){ attr[n] = String(v); }, getAttribute(n){ return n in attr ? attr[n] : null; },
    getBoundingClientRect(){ return this.rechteck; },
    closest(sel){
      const gesucht = sel.replace(/^#/, '');
      for (let x = this; x; x = x.eltern) if (x.id === gesucht) return x;
      return null;
    }
  };
}
function rechteck(left, top, right, bottom){ return { left, top, right, bottom, width: right - left, height: bottom - top }; }

function umgebung({ satzstueck = SATZSTUECK, handler = HANDLER, treffer = TREFFER } = {}){
  const karte = element('flashcard');
  const innen = element('flashcardInner', karte);
  const vorn = element('cardFront', innen);
  const hinten = element('cardBack', innen);
  const notiz = element('cardNoteBox', hinten);
  const kasten = element('cardSentenceBox', hinten);
  const ar = element('cardSentenceAr', kasten);
  const de = element('cardSentenceDe', kasten);
  karte.rechteck  = rechteck(80, 100, 520, 700);
  kasten.rechteck = rechteck(100, 400, 500, 520);
  ar.rechteck     = rechteck(116, 416, 484, 472);
  de.rechteck     = rechteck(116, 480, 484, 504);
  const nachId = { flashcard: karte, flashcardInner: innen, cardNoteBox: notiz, cardSentenceBox: kasten, cardSentenceAr: ar, cardSentenceDe: de };
  const ctx = vm.createContext({
    document: { getElementById: id => nachId[id] || null },
    buildSentenceHtml: w => 'AR:' + w.sentAr,
    String, console
  });
  vm.runInContext(SETZEN, ctx);
  vm.runInContext(VERWISCHEN, ctx);
  vm.runInContext(treffer, ctx);
  vm.runInContext(UMSCHALTEN, ctx);
  vm.runInContext(`
    globalThis.__suppressCardClick = false;
    globalThis.hinweisGerechnet = 0;
    function aktualisiereMehrHinweis(){ hinweisGerechnet++; }
    function zeichneSatz(w){ ${satzstueck} }
    function tippe(e) ${handler}
  `, ctx);
  return {
    karte, innen, vorn, hinten, notiz, kasten, ar, de,
    zeichne(w){ ctx.__w = w; vm.runInContext('zeichneSatz(__w)', ctx); },
    tippe(ziel, x, y){ ctx.__e = { target: ziel, clientX: x, clientY: y }; vm.runInContext('tippe(__e)', ctx); },
    sperre(an){ vm.runInContext('__suppressCardClick = ' + (an ? 'true' : 'false'), ctx); },
    gesperrt(){ return vm.runInContext('__suppressCardClick', ctx); },
    verschwommen(){ return de.classList.contains('de-verschwommen'); },
    gedreht(){ return karte.classList.contains('flipped'); }
  };
}

const WORT  = { id: 'w1', sentAr: 'هَذَا بَيْتٌ', sentDe: 'Das ist ein Haus.' };
const WORT2 = { id: 'w2', sentAr: 'ذَلِكَ بَابٌ', sentDe: 'Jenes ist eine Tür.' };
const OHNE_SATZ = { id: 'w3' };
const OHNE_DE   = { id: 'w4', sentAr: 'هَذَا بَيْتٌ' };

function faelle(opts){
  const r = [];
  const p = (name, bed, gemessen) => r.push([name, !!bed, gemessen]);
  let U;
  try { U = umgebung(opts); }
  catch (e){ return [['Gerüst: die echten Stücke laufen zusammen', false, e.message]]; }
  const lauf = (name, f) => { try { f(); } catch (e){ p(name + ' — läuft ohne Fehler', false, e.message); } };

  lauf('K1', () => {
    U.zeichne(WORT);
    p('K1 eine frisch gezeichnete Karte hat die Übersetzung verschwommen', U.verschwommen() === true, U.verschwommen());
    p('K1b die Übersetzung steht im Element (nur unlesbar, nicht entfernt)', U.de.textContent === WORT.sentDe, U.de.textContent);
    p('K1c sie ist als antippbar gekennzeichnet', U.de.classList.contains('de-tippbar'), U.de.classList.contains('de-tippbar'));
  });

  lauf('K2', () => {
    U.karte.classList.add('flipped');
    U.tippe(U.de, 300, 492);
    p('K2 EIN Antippen der Übersetzung zeigt sie', U.verschwommen() === false, U.verschwommen());
    p('K2b die Karte bleibt umgedreht', U.gedreht() === true, U.gedreht());
  });

  lauf('K3', () => {
    U.tippe(U.de, 300, 492);
    p('K3 ein zweites Antippen verwischt sie wieder (wie im Satzmodus)', U.verschwommen() === true, U.verschwommen());
    p('K3b die Karte bleibt umgedreht', U.gedreht() === true, U.gedreht());
  });

  lauf('K4', () => {
    U.tippe(U.kasten, 300, 514);
    p('K4 ein Tipp knapp UNTER der Zeile (Rand des Satzkastens) zeigt sie auch', U.verschwommen() === false, U.verschwommen());
    p('K4b die Karte bleibt umgedreht', U.gedreht() === true, U.gedreht());
    U.tippe(U.kasten, 300, 476);
    p('K4c ein Tipp in die Lücke zwischen arabischem Satz und Übersetzung verwischt wieder', U.verschwommen() === true, U.verschwommen());
  });

  lauf('K5', () => {
    U.tippe(U.ar, 300, 440);
    p('K5 ein Tipp auf den ARABISCHEN Satz dreht die Karte um, wie bisher', U.gedreht() === false, U.gedreht());
    p('K5b die Übersetzung bleibt dabei verschwommen', U.verschwommen() === true, U.verschwommen());
  });

  lauf('K6', () => {
    U.karte.classList.add('flipped');
    U.tippe(U.hinten, 300, 200);
    p('K6 ein Tipp anderswo auf der Rückseite dreht die Karte um', U.gedreht() === false, U.gedreht());
    p('K6b die Übersetzung bleibt verschwommen', U.verschwommen() === true, U.verschwommen());
  });

  lauf('K7', () => {
    U.tippe(U.vorn, 300, 492);
    p('K7 auf der VORDERSEITE dreht ein Tipp an derselben Stelle die Karte um', U.gedreht() === true, U.gedreht());
    p('K7b und zeigt die Übersetzung nicht', U.verschwommen() === true, U.verschwommen());
  });

  lauf('K9', () => {
    /* Der Browser nennt als Ziel die Drehfläche statt der Zeile (Befund 29.07.2026). */
    U.tippe(U.innen, 300, 492);
    p('K9 nennt der Browser das falsche Element, entscheidet die Stelle: Übersetzung sichtbar', U.verschwommen() === false, U.verschwommen());
    p('K9b die Karte bleibt umgedreht', U.gedreht() === true, U.gedreht());
  });

  lauf('K10', () => {
    U.sperre(true);
    U.tippe(U.de, 300, 492);
    p('K10 nach einem Wisch wird der Tipp verschluckt: Übersetzung unverändert sichtbar', U.verschwommen() === false, U.verschwommen());
    p('K10b die Sperre ist danach wieder aus', U.gesperrt() === false, U.gesperrt());
  });

  lauf('K11', () => {
    /* „Aufgedeckt" wird hier am Element gesetzt, nicht ertippt — sonst hinge der
       Fall davon ab, wie oft davor getippt wurde, und ginge im Störtest S1 durch
       Zufall durch (so gemessen beim ersten Lauf). */
    U.de.classList.remove('de-verschwommen');
    U.zeichne(WORT);
    p('K11 dasselbe Wort noch einmal gezeichnet: wieder verschwommen', U.verschwommen() === true, U.verschwommen());
    U.de.classList.remove('de-verschwommen');
    U.zeichne(WORT2);
    p('K11b die nächste Karte kommt verschwommen, auch wenn die vorige aufgedeckt war', U.verschwommen() === true, U.verschwommen());
    p('K11c und trägt den neuen Satz', U.de.textContent === WORT2.sentDe, U.de.textContent);
  });

  lauf('K8', () => {
    U.zeichne(OHNE_SATZ);
    p('K8 Wort ohne Beispielsatz: der Kasten ist ausgeblendet', U.kasten.classList.contains('hidden'), U.kasten.classList.contains('hidden'));
    U.karte.classList.add('flipped');
    U.tippe(U.hinten, 300, 492);
    p('K8b ein Tipp an der Stelle dreht die Karte um (keine tote Fläche)', U.gedreht() === false, U.gedreht());
  });

  lauf('K12', () => {
    U.zeichne(OHNE_DE);
    U.karte.classList.add('flipped');
    U.tippe(U.kasten, 300, 514);
    p('K12 Satz ohne Übersetzung: ein Tipp unter dem arabischen Satz dreht die Karte um', U.gedreht() === false, U.gedreht());
  });

  lauf('K13', () => {
    U.zeichne(WORT);
    U.karte.classList.add('flipped');
    U.tippe(U.notiz, 300, 492);
    p('K13 der Kasten der Eselsbrücke behält seinen eigenen Klick (Karte bleibt, Übersetzung bleibt)',
      U.gedreht() === true && U.verschwommen() === true, U.gedreht() + '/' + U.verschwommen());
  });

  return r;
}

const rot = liste => liste.filter(x => !x[1]);
let fehler = 0;

const echt = faelle({});
for (const [name, ok, gemessen] of echt){
  if (!ok) fehler++;
  if (!ok || ALLES) console.log((ok ? '  ok   ' : '  ✘    ') + name + (ok && !ALLES ? '' : '   [gemessen: ' + gemessen + ']'));
}

/* ---------- Störtests ---------- */
const STOER = [
  ['S1 renderCard() ohne den Aufruf', { satzstueck: SATZSTUECK_S1 }, ['K1 ', 'K11 ', 'K11b']],
  ['S2 Klick-Handler ohne die neue Zeile', { handler: HANDLER_S2 }, ['K2 ', 'K2b', 'K4 ', 'K9 ']],
  ['S3 Treffer nur nach e.target', { treffer: TREFFER_S3 }, ['K4 ', 'K9 ']]
];
for (const [name, opts, erwartet] of STOER){
  const durchgefallen = rot(faelle(opts)).map(x => x[0]);
  const fehlt = erwartet.filter(k => !durchgefallen.some(n => n.startsWith(k)));
  const ok = durchgefallen.length > 0 && fehlt.length === 0;
  if (!ok) fehler++;
  if (!ok || ALLES) console.log((ok ? '  ok   ' : '  ✘    ') + 'Störtest ' + name + ': ' + durchgefallen.length + ' Fälle fallen durch'
    + (fehlt.length ? ' — ERWARTET waren auch ' + fehlt.join(', ') : '')
    + (ALLES ? '   [' + durchgefallen.map(n => n.split(' ')[0]).join(', ') + ']' : ''));
}

console.log((fehler ? '✘ ' : '✔ ') + 'test-karten-satz-de: ' + echt.length + ' Fälle, ' + STOER.length + ' Störtests'
  + (fehler ? ' — ' + fehler + ' NICHT in Ordnung' : ' — alles in Ordnung'));
process.exit(fehler ? 1 : 0);
