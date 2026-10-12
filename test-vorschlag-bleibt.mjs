#!/usr/bin/env node
/* test-vorschlag-bleibt.mjs — die Eselsbrücken-Vorschläge bleiben neben seiner eigenen stehen.
 * ==========================================================================
 *
 * ⛔⛔ DER SATZ, DEN DIESER PRÜFSTAND BEWACHT — VON ELIAS, 11.10.2026
 *
 *   „wenn ich eine notiz hinzufüge dann will ich das die eselsbrücken nicht einfach
 *   verschwinden, sie sollen da bleiben auch wenn ich eine notiz mache"
 *
 * Bis dahin galt die harte Rangfolge aus Punkt 8 (10.08.2026): „eigene Notiz schlägt
 * Vorschlag, immer" — sobald er etwas Eigenes schrieb, verschwanden die Vorschläge, auf
 * der Lernkarte und auf der Wortkarte. Aufgehoben ist NUR das Verdrängen. Der Kern von
 * Punkt 8 bleibt und wird hier mitgeprüft: sein eigener Text bleibt sichtbar stehen,
 * und kein Vorschlag wird je in seine Ablage geschrieben (das bewacht außerdem test-p8.mjs).
 *
 * ⛔⛔ UND SEIN ZWEITER SATZ, 12.10.2026 — ER GILT FÜR DIE LERNKARTE
 *
 *   „wenn ich eine notiz bei karteikarten habe beim lernen dann will ich das die unter
 *   dem vorschlag steht und das ich trotzdem noch die vorschläge aufrufen kann und da
 *   weiter normal das menü bedienen kann"
 *
 * Auf der Lernkarte steht seitdem der VORSCHLAG oben im Kasten und seine eigene
 * DARUNTER (`cardNoteEigene`); das Fenster zeigt die Vorschläge auch dann, wenn er etwas
 * Eigenes geschrieben hat, mit allen Knöpfen. „Übernehmen" hängt den Vorschlag dann an
 * seinen Text an, statt ihn zu überschreiben (meine Auslegung des Kerns von Punkt 8).
 *
 * ⛔⛔ UND FÜR DIE WORTKARTE (INFOKARTE), EBENFALLS 12.10.2026
 *
 *   Meine Frage: „Soll die Notiz auch auf der Infokarte unter die Eselsbrücke?"
 *   Elias: „ja"
 *
 * („Notiz" ist in seinen Wörtern sein eigener Text, „Eselsbrücke" der Vorschlag.) Seitdem
 * steht auch dort der Vorschlag ZUERST und seine eigene DARUNTER. Vom 11.10. bis zum
 * 12.10.2026 war es umgekehrt — das war mein Bau, sein Satz vom 11.10. nannte keine
 * Reihenfolge.
 *
 * Alles läuft am ECHTEN Quelltext: renderNotiz(), oeffneNotizEditor() und
 * uebernimmVorschlag() (js/lernen.js) und wkEselsbruecke() (js/kategorien.js) werden
 * herausgeschnitten und gegen ein Doppel gefahren.
 *   L  Lernkarte   F  Fenster der Lernkarte   W  Wortkarte   V  Verdrahtung   S  Störtests
 *
 * Aufruf: node test-vorschlag-bleibt.mjs      Exit 0 = alles in Ordnung
 */
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const lies = p => fs.readFileSync(path.join(HIER, p), 'utf8');
const LERNEN = lies('js/lernen.js');
const KAT = lies('js/kategorien.js');
const HTML = lies('index.html');

let fehler = 0, geprueft = 0;
function pruefe(ok, was) {
  geprueft++;
  if (!ok) { fehler++; console.log('  ⛔ ' + was); }
  return ok;
}

function schneide(quelle, kopf, ende = '\n}') {
  const i = quelle.indexOf(kopf);
  if (i < 0) throw new Error('nicht gefunden im Quelltext: ' + kopf);
  const j = quelle.indexOf(ende, i);
  if (j < 0) throw new Error('Ende nicht gefunden: ' + kopf);
  return quelle.slice(i, j + ende.length);
}

function element() {
  const k = new Set();
  return {
    innerHTML: '', textContent: '',
    classList: {
      add: x => k.add(x), remove: x => k.delete(x), contains: x => k.has(x),
      toggle: (x, an) => { const soll = an === undefined ? !k.has(x) : !!an; if (soll) k.add(x); else k.delete(x); return soll; },
    },
  };
}

const EIGENE = 'MEINE EIGENE BRUECKE';
const DREI = ['VORSCHLAG-EINS', 'VORSCHLAG-ZWEI', 'VORSCHLAG-DREI'];

/* ---------- Lernkarte ---------- */
function lernkarte(quelle, { notiz = '', liste = [], nr = 0 }) {
  const els = {};
  const hole = id => els[id] || (els[id] = element());
  hole('cardNoteEigene').classList.add('hidden');
  hole('cardNoteEigeneText');
  const ABLAGE = notiz ? { k1: notiz } : {};
  const vorher = JSON.stringify(ABLAGE);
  const ctx = {
    document: { getElementById: hole }, PROGRESS: {},
    getNote: id => (ABLAGE[id] || '').trim(), getNotiz: () => '',
    vorschlagsListe: () => liste.slice(), gewaehlterVorschlag: (id, n) => Math.min(nr, n - 1),
    arabischHervorheben: s => String(s),
  };
  vm.createContext(ctx);
  vm.runInContext(schneide(quelle, 'function renderNotiz(') + '\nrenderNotiz({ id: "k1" });', ctx);
  return {
    text: els.cardNoteText.innerHTML, kasten: els.cardNoteBox.classList, punkt: els.cardNoteDot.classList,
    eigene: els.cardNoteEigene.classList, eigeneText: els.cardNoteEigeneText.innerHTML,
    ablageUnveraendert: JSON.stringify(ABLAGE) === vorher,
  };
}
/* Sein Satz vom 12.10.: der Vorschlag steht oben im Kasten, seine eigene darunter. */
const lBeides = q => { const k = lernkarte(q, { notiz: EIGENE, liste: DREI });
  return k.text === DREI[0] && k.kasten.contains('ist-vorschlag') && !k.kasten.contains('hat-notiz')
    && !k.eigene.contains('hidden') && k.eigeneText === EIGENE && !k.punkt.contains('hidden') && k.ablageUnveraendert; };

console.log('L  Lernkarte');
pruefe(lBeides(LERNEN), 'mit eigener Eselsbrücke UND Vorschlägen: oben steht nicht der Vorschlag, oder seine eigene fehlt darunter');
{
  const k = lernkarte(LERNEN, { notiz: EIGENE, liste: DREI, nr: 1 });
  pruefe(k.text === DREI[1] && k.eigeneText === EIGENE, 'oben steht nicht der Vorschlag, zu dem er geblättert hat: ' + k.text);
}
{
  const k = lernkarte(LERNEN, { liste: DREI });
  pruefe(k.text === DREI[0] && k.kasten.contains('ist-vorschlag') && !k.kasten.contains('hat-notiz'),
    'ohne eigene Eselsbrücke steht der Vorschlag nicht mehr im Kasten');
  pruefe(k.eigene.contains('hidden') && k.eigeneText === '', 'ohne eigene Eselsbrücke steht darunter trotzdem ein Kasten für seine eigene');
  pruefe(k.punkt.contains('hidden'), 'ein bloßer Vorschlag schaltet den Punkt auf der Vorderseite an');
}
{
  const k = lernkarte(LERNEN, { notiz: EIGENE });
  pruefe(k.text === EIGENE && k.kasten.contains('hat-notiz') && !k.kasten.contains('ist-vorschlag'),
    'eigene Eselsbrücke ohne Vorschlag: sie steht nicht mehr im Kasten');
  pruefe(k.eigene.contains('hidden') && k.eigeneText === '', 'eigene Eselsbrücke ohne Vorschlag: sie steht doppelt da');
  pruefe(!k.punkt.contains('hidden'), 'eigene Eselsbrücke ohne Vorschlag: der Punkt auf der Vorderseite fehlt');
}
{
  const k = lernkarte(LERNEN, {});
  pruefe(k.text === 'Eselsbrücke hinzufügen' && k.eigene.contains('hidden'), 'ohne alles steht nicht die Aufforderung da');
}

/* ---------- Das Fenster der Lernkarte ---------- */
function fenster(quelle, { notiz = '', liste = [], nr = 0 }) {
  const els = {};
  const hole = id => els[id] || (els[id] = Object.assign(element(), { value: '', style: {}, title: '', setAttribute() {} }));
  const ABLAGE = notiz ? { k1: notiz } : {};
  const vorher = JSON.stringify(ABLAGE);
  const ctx = {
    document: { getElementById: hole }, SESSION: { words: [{ id: 'k1', ar: 'X' }], idx: 0 },
    getNote: id => (ABLAGE[id] || '').trim(), vorschlagsListe: () => liste.slice(),
    gewaehlterVorschlag: (id, n) => Math.max(0, Math.min(nr, n - 1)), overlayAuf: () => {},
    istVorschlagVerworfen: () => false, arabischHervorheben: s => String(s),
  };
  vm.createContext(ctx);
  vm.runInContext('var VORSCHLAEGE = []; var VORSCHLAG_NR = 0;\n'
    + schneide(quelle, 'function zeigeVorschlag(') + '\n' + schneide(quelle, 'function oeffneNotizEditor(')
    + '\n' + schneide(quelle, 'function uebernimmVorschlag(') + '\noeffneNotizEditor();', ctx);
  return {
    feld: els.neText, kasten: els.neVorschlag.classList, text: els.neVorschlagText.innerHTML,
    zaehler: els.neVorschlagZaehler.textContent, blaettern: els.neVorschlagBlaettern.classList,
    anzahl: vm.runInContext('VORSCHLAEGE.length', ctx), ablageUnveraendert: () => JSON.stringify(ABLAGE) === vorher,
    uebernimm: () => { els.neVorschlagText.textContent = els.neVorschlagText.innerHTML; vm.runInContext('uebernimmVorschlag()', ctx); },
  };
}
const fBeides = q => { const f = fenster(q, { notiz: EIGENE, liste: DREI, nr: 1 });
  return f.feld.value === EIGENE && f.anzahl === 3 && !f.kasten.contains('hidden') && f.text === DREI[1]
    && f.zaehler === ' 2 von 3' && !f.blaettern.contains('hidden') && f.ablageUnveraendert(); };
const fAnhaengen = q => { const f = fenster(q, { notiz: EIGENE, liste: DREI });
  f.uebernimm();
  return f.feld.value.startsWith(EIGENE) && f.feld.value.endsWith(DREI[0]) && f.feld.value !== DREI[0] && f.ablageUnveraendert(); };

console.log('F  Fenster der Lernkarte');
pruefe(fBeides(LERNEN), 'mit eigener Eselsbrücke fehlen im Fenster die Vorschläge oder das Blättern, oder im Feld steht nicht seine eigene');
pruefe(fAnhaengen(LERNEN), '„Übernehmen" überschreibt seinen eigenen Text im Feld, statt den Vorschlag anzuhängen');
{
  const f = fenster(LERNEN, { liste: DREI });
  pruefe(f.feld.value === '' && !f.kasten.contains('hidden') && f.text === DREI[0], 'ohne eigene Eselsbrücke: das Feld ist vorgefüllt, oder der Vorschlag fehlt');
  f.uebernimm();
  pruefe(f.feld.value === DREI[0] && f.kasten.contains('hidden'), 'ohne eigene Eselsbrücke füllt „Übernehmen" das Feld nicht mit dem Vorschlag');
  pruefe(f.ablageUnveraendert(), '„Übernehmen" allein hat schon etwas in seine Ablage geschrieben');
}
{
  const f = fenster(LERNEN, { notiz: EIGENE + ' mit ' + DREI[0] + ' darin', liste: DREI });
  const davor = f.feld.value;
  f.uebernimm();
  pruefe(f.feld.value === davor, 'steht der Vorschlag schon in seinem Text, hängt „Übernehmen" ihn ein zweites Mal an');
}
{
  const f = fenster(LERNEN, { notiz: EIGENE });
  pruefe(f.feld.value === EIGENE && f.anzahl === 0 && f.kasten.contains('hidden'), 'eigene Eselsbrücke ohne Vorschlag: im Fenster steht trotzdem ein Vorschlagskasten');
}

/* ---------- Wortkarte ---------- */
function wortkarte(quelle, { notiz = '', liste = [], nr = 0 }) {
  const ctx = {
    getNote: () => notiz, vorschlagsListe: () => liste.slice(), gewaehlterVorschlag: (id, n) => Math.min(nr, n - 1),
    arabischHervorheben: s => String(s), icon: n => '<i>' + n + '</i>',
  };
  vm.createContext(ctx);
  return vm.runInContext(schneide(quelle, 'function wkEselsbruecke(') + '\nwkEselsbruecke({ id: "k1" });', ctx);
}
const zahl = (html, was) => html.split(was).length - 1;
const wBeides = q => { const h = wortkarte(q, { notiz: EIGENE, liste: DREI });
  return h.includes('Deine Eselsbrücke') && h.includes(EIGENE) && h.includes('<span>Vorschlag</span>') && h.includes(DREI[0])
    && h.indexOf(DREI[0]) < h.indexOf(EIGENE) && zahl(h, EIGENE) === 1 && h.includes('1 von 3')
    && h.includes('data-wkblatt="-1"') && h.includes('data-wkblatt="1"'); };
const wEinKnopf = q => { const h = wortkarte(q, { notiz: EIGENE, liste: DREI });
  return zahl(h, 'data-wkmerk') === 1 && h.includes('data-wkvorschlag') && !h.includes('>eigene<'); };

console.log('W  Wortkarte');
pruefe(wBeides(KAT), 'mit eigener Eselsbrücke fehlen die Vorschläge (oder ihre Blätterknöpfe), oder seine steht nicht UNTER dem Vorschlag');
pruefe(wEinKnopf(KAT), 'neben seiner eigenen ist der Vorschlagskasten auch ein Knopf zum Schreiben, oder der Stift „eigene" steht noch da');
{
  const h = wortkarte(KAT, { notiz: EIGENE, liste: DREI, nr: 2 });
  pruefe(h.includes(DREI[2]) && h.includes('3 von 3'), 'gezeigt wird nicht der Vorschlag, zu dem er geblättert hat');
}
{
  const h = wortkarte(KAT, { liste: DREI });
  pruefe(!h.includes('Deine Eselsbrücke') && h.includes(DREI[0]) && zahl(h, 'data-wkmerk') === 1 && h.includes('eigene'),
    'ohne eigene Eselsbrücke ist der Vorschlagskasten nicht mehr der Knopf zum Schreiben');
}
{
  const h = wortkarte(KAT, { notiz: EIGENE });
  pruefe(h.includes(EIGENE) && !h.includes('<span>Vorschlag</span>') && !h.includes('Noch keine'), 'eigene Eselsbrücke ohne Vorschlag zeigt etwas Falsches');
}
{
  const h = wortkarte(KAT, {});
  pruefe(h.includes('Noch keine — schreib dir eine.') && zahl(h, 'data-wkmerk') === 1, 'ohne alles fehlt die Einladung zum Schreiben');
}
{
  const h = wortkarte(KAT, { notiz: EIGENE, liste: ['NUR-EINER'] });
  pruefe(h.includes('NUR-EINER') && !h.includes('data-wkblatt') && !h.includes(' von '), 'bei nur einem Vorschlag stehen Blätterknöpfe da');
}

console.log('V  Verdrahtung');
const iKasten = HTML.indexOf('id="cardNoteBox"'), iEigene = HTML.indexOf('id="cardNoteEigene"'), iNotiz = HTML.indexOf('id="cardNotizBox"');
pruefe(HTML.includes('<button class="note-box note-eigene hat-notiz hidden" id="cardNoteEigene"') && HTML.includes('id="cardNoteEigeneText"'),
  'index.html: der Kasten für seine eigene Eselsbrücke fehlt oder ist nicht von Anfang an verborgen');
pruefe(iKasten >= 0 && iKasten < iEigene && iEigene < iNotiz,
  'index.html: seine eigene Eselsbrücke steht nicht direkt unter dem Vorschlagskasten (und vor der Notiz der Infokarte)');
pruefe(HTML.includes('.hidden{display:none !important;}'), 'index.html: `.hidden` verbirgt nicht mehr sicher — der verborgene Kasten nähme Platz ein');
pruefe(!HTML.includes('cardNoteVorschlag') && !LERNEN.includes('cardNoteVorschlag'), 'die Vorschlagszeile vom 11.10. (unter seiner eigenen) ist noch da');
pruefe(LERNEN.includes("const eigeneKnopf = document.getElementById('cardNoteEigene');") && LERNEN.includes("addEventListener('click', uebernimmVorschlag);"),
  'js/lernen.js: der Kasten seiner eigenen öffnet das Fenster nicht, oder „Übernehmen" hängt nicht an uebernimmVorschlag()');
pruefe(KAT.includes('t.push(wkEselsbruecke(w));'), 'js/kategorien.js: baueWortKarte() baut die Eselsbrücke nicht mehr über wkEselsbruecke()');
pruefe(KAT.includes("const blatt = e.target.closest('[data-wkblatt]');"), 'js/kategorien.js: der Blätter-Handler fehlt');

console.log('S  Störtests (der Quelltext wird verändert)');
function stoere(was, quelle, alt, neu, bemerkt) {
  const text = quelle.split(alt).join(neu);
  if (!pruefe(text !== quelle, 'Störtest „' + was + '": die Stelle wurde nicht gefunden — der Störtest prüft nichts')) return;
  let gemerkt;
  try { gemerkt = bemerkt(text); } catch (e) { gemerkt = true; }
  pruefe(gemerkt, 'Störtest „' + was + '" wird NICHT bemerkt');
}
stoere('Lernkarte: seine eigene verdrängt den Vorschlag wieder aus dem Kasten', LERNEN, 'const vorschlag = gewaehlt;', "const vorschlag = notiz ? '' : gewaehlt;", q => !lBeides(q));
stoere('Lernkarte: seine eigene verschwindet unter dem Vorschlag', LERNEN, "const darunter = (notiz && gewaehlt) ? notiz : '';", "const darunter = '';", q => !lBeides(q));
stoere('Lernkarte: seine eigene steht wieder oben', LERNEN, "arabischHervorheben(vorschlag || notiz || 'Eselsbrücke hinzufügen')",
  "arabischHervorheben(notiz || vorschlag || 'Eselsbrücke hinzufügen')", q => !lBeides(q));
stoere('Fenster: Vorschläge wieder weg, sobald er etwas Eigenes hat', LERNEN, 'VORSCHLAEGE = vorschlagsListe(w);',
  'VORSCHLAEGE = getNote(w.id) ? [] : vorschlagsListe(w);', q => !fBeides(q));
stoere('Fenster: „Übernehmen" überschreibt seinen Text', LERNEN,
  "else if (eigenes.indexOf(vorschlag.trim()) < 0) feld.value = eigenes + '\\n\\n' + vorschlag;", 'else feld.value = vorschlag;', q => !fAnhaengen(q));
stoere('Wortkarte: Vorschläge nur ohne eigene', KAT,
  '  if (liste.length){\n    const nr = gewaehlterVorschlag(w.id, liste.length);\n    const huelle',
  '  if (!notiz && liste.length){\n    const nr = gewaehlterVorschlag(w.id, liste.length);\n    const huelle', q => !wBeides(q));
stoere('Wortkarte: zwei Knöpfe zum Schreiben', KAT,
  "const huelle = notiz ? 'class=\"wk-abschnitt\" data-wkvorschlag'\n      : ", 'const huelle = ', q => !wEinKnopf(q));
stoere('Wortkarte: seine eigene steht wieder über dem Vorschlag', KAT,
  '  if (liste.length){\n    const nr = gewaehlterVorschlag(w.id, liste.length);\n    const huelle',
  "  if (notiz) t.push('<div>Deine Eselsbrücke ' + notiz + '</div>');\n  if (liste.length){\n    const nr = gewaehlterVorschlag(w.id, liste.length);\n    const huelle", q => !wBeides(q));
stoere('Wortkarte: seine eigene verschwindet neben dem Vorschlag', KAT,
  '  if (notiz){\n    t.push(`<div class="wk-abschnitt wk-tippbar" data-wkmerk role="button" tabindex="0" aria-label="Eselsbrücke ändern">',
  '  if (notiz && !liste.length){\n    t.push(`<div class="wk-abschnitt wk-tippbar" data-wkmerk role="button" tabindex="0" aria-label="Eselsbrücke ändern">', q => !wBeides(q));

console.log('\ntest-vorschlag-bleibt: ' + geprueft + ' Prüfungen, ' + fehler + ' Fehler');
process.exit(fehler ? 1 : 0);
