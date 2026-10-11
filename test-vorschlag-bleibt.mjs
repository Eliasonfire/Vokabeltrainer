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
 * Punkt 8 bleibt und wird hier mitgeprüft: sein eigener Text steht im Kasten, zuerst,
 * und kein Vorschlag wird je in seine Ablage geschrieben (das bewacht außerdem test-p8.mjs).
 *
 * Alles läuft am ECHTEN Quelltext: renderNotiz() (js/lernen.js) und wkEselsbruecke()
 * (js/kategorien.js) werden herausgeschnitten und gegen ein Doppel gefahren.
 *   L  Lernkarte      W  Wortkarte      V  Verdrahtung      S  Störtests
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
  hole('cardNoteVorschlag').classList.add('hidden');
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
    zusatz: els.cardNoteVorschlag, ablageUnveraendert: JSON.stringify(ABLAGE) === vorher,
  };
}
const lBeides = q => { const k = lernkarte(q, { notiz: EIGENE, liste: DREI });
  return k.text === EIGENE && k.kasten.contains('hat-notiz') && !k.kasten.contains('ist-vorschlag')
    && !k.zusatz.classList.contains('hidden') && k.zusatz.innerHTML === DREI[0] && !k.punkt.contains('hidden') && k.ablageUnveraendert; };

console.log('L  Lernkarte');
pruefe(lBeides(LERNEN), 'mit eigener Eselsbrücke UND Vorschlägen: seine steht nicht mehr allein im Kasten, oder der Vorschlag darunter fehlt');
{
  const k = lernkarte(LERNEN, { notiz: EIGENE, liste: DREI, nr: 1 });
  pruefe(k.zusatz.innerHTML === DREI[1], 'darunter steht nicht der Vorschlag, zu dem er geblättert hat: ' + k.zusatz.innerHTML);
}
{
  const k = lernkarte(LERNEN, { liste: DREI });
  pruefe(k.text === DREI[0] && k.kasten.contains('ist-vorschlag') && !k.kasten.contains('hat-notiz'),
    'ohne eigene Eselsbrücke steht der Vorschlag nicht mehr im Kasten');
  pruefe(k.zusatz.classList.contains('hidden') && k.zusatz.innerHTML === '', 'ohne eigene Eselsbrücke steht der Vorschlag doppelt da');
  pruefe(k.punkt.contains('hidden'), 'ein bloßer Vorschlag schaltet den Punkt auf der Vorderseite an');
}
{
  const k = lernkarte(LERNEN, { notiz: EIGENE });
  pruefe(k.text === EIGENE && k.zusatz.classList.contains('hidden') && k.zusatz.innerHTML === '',
    'eigene Eselsbrücke ohne Vorschlag: darunter steht trotzdem eine Vorschlagszeile');
}
{
  const k = lernkarte(LERNEN, {});
  pruefe(k.text === 'Eselsbrücke hinzufügen' && k.zusatz.classList.contains('hidden'), 'ohne alles steht nicht die Aufforderung da');
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
    && h.indexOf(EIGENE) < h.indexOf(DREI[0]) && h.includes('1 von 3')
    && h.includes('data-wkblatt="-1"') && h.includes('data-wkblatt="1"'); };
const wEinKnopf = q => { const h = wortkarte(q, { notiz: EIGENE, liste: DREI });
  return zahl(h, 'data-wkmerk') === 1 && h.includes('data-wkvorschlag') && !h.includes('>eigene<'); };

console.log('W  Wortkarte');
pruefe(wBeides(KAT), 'mit eigener Eselsbrücke fehlen die Vorschläge (oder ihre Blätterknöpfe), oder seine steht nicht zuerst');
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
const nachKasten = HTML.slice(HTML.indexOf('id="cardNoteBox"'), HTML.indexOf('id="cardNoteBox"') + 1400);
pruefe(/class="note-vorschlag hidden" id="cardNoteVorschlag"/.test(nachKasten),
  'index.html: die Vorschlagszeile fehlt unter dem Eselsbrücken-Kasten oder ist nicht von Anfang an verborgen');
pruefe(HTML.includes('.note-vorschlag.hidden{display:none;}'), 'index.html: die verborgene Vorschlagszeile nimmt trotzdem Platz ein');
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
stoere('Lernkarte: Vorschlag verschwindet wieder', LERNEN, "const daneben = notiz ? gewaehlt : '';", "const daneben = '';", q => !lBeides(q));
stoere('Lernkarte: Vorschlag verdrängt seine eigene', LERNEN, "const vorschlag = notiz ? '' : gewaehlt;", 'const vorschlag = gewaehlt;', q => !lBeides(q));
stoere('Wortkarte: Vorschläge nur ohne eigene', KAT,
  '  if (liste.length){\n    const nr = gewaehlterVorschlag(w.id, liste.length);\n    const huelle',
  '  if (!notiz && liste.length){\n    const nr = gewaehlterVorschlag(w.id, liste.length);\n    const huelle', q => !wBeides(q));
stoere('Wortkarte: zwei Knöpfe zum Schreiben', KAT,
  "const huelle = notiz ? 'class=\"wk-abschnitt\" data-wkvorschlag'\n      : ", 'const huelle = ', q => !wEinKnopf(q));

console.log('\ntest-vorschlag-bleibt: ' + geprueft + ' Prüfungen, ' + fehler + ' Fehler');
process.exit(fehler ? 1 : 0);
