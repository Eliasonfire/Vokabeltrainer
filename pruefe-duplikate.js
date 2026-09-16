#!/usr/bin/env node
/* pruefe-duplikate.js — Punkt A13: kein Duplikat zu einer freigeschalteten Vokabel
 * ==========================================================================
 *
 * ⛔⛔ WARUM ES DAS BIS ZUM 20.08.2026 NICHT GAB
 *
 * In `VOLLES-PROGRAMM.md` stand bei A13 als prüfendes Werkzeug: **„⛔ nur seine
 * App"**. Es war damit der einzige der dreizehn Punkte, für den überhaupt keine
 * Messung existierte — auffallen konnte ein Duplikat nur, wenn Elias beim
 * Lernen zweimal dieselbe Karte bekam.
 *
 * ================== ZWEI FALLEN, BEIDE BEIM ERSTEN BAU GETRETEN ===========
 *
 * **1. Skelettvergleich wirft Information weg.** Der erste Lauf verglich ohne
 * Vokalzeichen und meldete **14 Duplikate**. Darunter:
 *
 *     صِفْرٌ (Null)  ==  صَفَرَ (Verb)      -> beide werden صفر
 *     لِ (Praeposition) == ل (Buchstabe)   -> beide werden ل
 *     ـكَ  ==  ـكِ                          -> beide werden ك
 *
 * Alle drei sind KEINE Duplikate. Die Vokalzeichen sind hier nicht Zierrat,
 * sondern der Unterschied. [[skelettvergleich_wirft_information_weg]]
 *
 * **2. Der falsche Bezugspunkt.** Er verglich gegen **alle 4433** Buchvokabeln.
 * A13 sagt aber ausdruecklich: kein Duplikat zu einer **FREIGESCHALTETEN**.
 * Von 4433 sind das **387** — ein Treffer in madina-3 Kapitel 27 ist kein
 * Befund, sondern ein Wort, das Elias nie sieht.
 * [[milder_bezugspunkt_verdeckt_mangel]]
 *
 * Nach beiden Korrekturen: **14 -> 1**.
 *
 * ================== WIE VERGLICHEN WIRD ===================================
 *
 * MIT Vokalzeichen, aber:
 *   - NFC, damit zerlegte und zusammengesetzte Hamzah gleich sind
 *     [[arabisch_vergleichen_nfc]]
 *   - Alif-Varianten (آ أ إ ٱ) auf ا — das ist Schreibvariante, nicht Wort
 *   - Tatwil (ـ) raus
 *   - die LETZTE Haraka bzw. das Tanwin raus: das ist die Kasusendung,
 *     nicht das Wort. صِفْرٌ und صِفْرُ sind dasselbe Wort.
 *
 * Aufruf:
 *   node pruefe-duplikate.js            Befunde
 *   node pruefe-duplikate.js --alle     auch gegen NICHT freigeschaltete
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const REPO = __dirname;
const ALLE = process.argv.includes('--alle');

/* ---------- Daten laden, so wie die App es tut ---------- */
const kiste = { window: {} };
vm.createContext(kiste);
const DATEN = path.join(REPO, 'data');
let dateien = [];
try { dateien = fs.readdirSync(DATEN).filter(f => f.endsWith('.js')); }
catch (e) { console.error('⛔ data/ nicht lesbar: ' + e.message); process.exit(1); }
for (const f of dateien) {
  try { vm.runInContext(fs.readFileSync(path.join(DATEN, f), 'utf8'), kiste, { filename: f }); }
  catch (e) { console.error('  ! ' + f + ': ' + e.message.split('\n')[0]); }
}

/* ---------- Der echte Freischaltstand ---------- */
/* ⛔ NICHT nachbauen — aus js/kern.js lesen. Eine zweite Liste liefe
   auseinander, und niemand merkte es. [[handliste_neben_echter_quelle]] */
const kern = fs.readFileSync(path.join(REPO, 'js', 'kern.js'), 'utf8');
const m = /const FREIGESCHALTET = \{([\s\S]*?)\n\};/.exec(kern);
if (!m) { console.error('⛔ FREIGESCHALTET nicht in js/kern.js gefunden.'); process.exit(1); }
const FREI = {};
for (const t of m[1].matchAll(/'([^']+)':\s*\[([0-9,\s]*)\]/g))
  FREI[t[1]] = t[2].split(',').map(s => Number(s.trim())).filter(n => !Number.isNaN(n));

/* ⛔⛔ ZWEI GETRENNTE SPEICHER FUER „eigene Vokabeln“ — gemessen 20.08.2026:

     data/vokabeln-eigene.js  (EIGENE_VOKABELN)   11 Woerter, UUID-Kennungen
     data/eigene-woerter.json (vt_personalVocab)  14 Woerter, p_-Kennungen

   ⭐ KEINE Ueberschneidung — keine einzige Kennung kommt in beiden vor. Die App
   laedt beide: js/buecher.js:536 die erste, saetzeNachtragen(PERSONAL_VOCAB)
   die zweite. Dieses Werkzeug kannte nur die erste und hat deshalb
   سَيِّدٌ (p_1787185012359) nicht gefunden — ein ECHTES Duplikat zu
   madina-2 K18, und das Kapitel ist freigeschaltet.
   [[werkzeug_misst_kleineren_bestand]] [[dritte_satzquelle]] */
const EIGENE_ALT = kiste.window.EIGENE_VOKABELN || [];
let EIGENE_NEU = [];
try {
  const ew = path.join(DATEN, 'eigene-woerter.json');
  if (fs.existsSync(ew)) EIGENE_NEU = (JSON.parse(fs.readFileSync(ew, 'utf8')).woerter) || [];
  else console.log('  ⚠ data/eigene-woerter.json fehlt — 14 eigene Woerter UNGEPRUEFT.');
} catch (e) { console.log('  ⚠ data/eigene-woerter.json nicht lesbar: ' + e.message); }
const EIGENE = EIGENE_ALT.concat(EIGENE_NEU);
const FACH = vm.runInContext(
  'typeof FACHBEGRIFF_VOKABELN !== "undefined" ? FACHBEGRIFF_VOKABELN : []', kiste);
const BUCH = [];
Object.entries(kiste.window.VOKABELN || {}).forEach(([b, l]) =>
  (l || []).forEach(w => BUCH.push(Object.assign({}, w, { book: b }))));
const bezug = ALLE ? BUCH : BUCH.filter(w => (FREI[w.book] || []).includes(Number(w.chapter)));

/* ⛔⛔ DER FUENFTE WEG: was die App ueber vocab-data.js kennt, der Abzug aber
   nicht hergibt. Am 20.08.2026 gemessen: elf Woerter.

     9x  50296-50304  die Zahlwoerter. Im Abzug stehen sie unter Kapitel 24,
                      madina-1 ist bis 12 frei — sie fallen aus `bezug`.
                      In vocab-data.js tragen sie `chapter: "personal"`, und
                      js/kern.js:149 macht sie damit IMMER bekannt.
     2x  madina1-l6-ach / -ucht  stehen in KEINER der neun Abzugsdateien
                      (grep -c = 0), tragen aber `chapter: 6`.

   ⭐ HEUTE FINDET DAS NICHTS — gemessen: 0 zusaetzliche Befunde, waehrend
   die Gegenprobe die zwei bekannten (سَيِّدٌ, ظَرْف) sehr wohl findet. Der
   Einbau ist also LATENT, genau wie bei pruefe-erreichbarkeit.js: er wirkt
   erst, wenn Elias ein Wort anlegt, das eines dieser elf schon abdeckt —
   und dann faellt es auf, statt still dazustehen.

   ⛔ Erkannt ueber die MENGENDIFFERENZ, nicht ueber das `book`-Feld. Genau
   die elf tragen als einzige der 171 Eintraege ein `book` — das saehe wie
   ein bequemes Kennzeichen aus, haette aber zwei Ursachen und ueberginge
   ein zwoelftes Wort, das ohne `book` nachgetragen wird.
   [[kennzeichen_mit_zwei_ursachen]] [[werkzeug_misst_kleineren_bestand]] */
const kisteV = { window: {} };
kisteV.globalThis = kisteV;
vm.createContext(kisteV);
let VOCAB_DATA = [];
try {
  vm.runInContext(fs.readFileSync(path.join(REPO, "vocab-data.js"), "utf8"), kisteV,
    { filename: "vocab-data.js" });
  VOCAB_DATA = kisteV.window.VOCAB_DATA
    || vm.runInContext("typeof VOCAB_DATA !== 'undefined' ? VOCAB_DATA : []", kisteV) || [];
} catch (e) { console.log("  ⚠ vocab-data.js nicht lesbar: " + e.message); }
const _bezugIds  = new Set(bezug.map(w => String(w.id)));
const _sonderIds = new Set([...EIGENE, ...FACH].map(w => String(w.id)));
const NUR_VOCAB  = VOCAB_DATA.filter(w =>
  !_bezugIds.has(String(w.id)) && !_sonderIds.has(String(w.id)));
bezug.push(...NUR_VOCAB);

/* ---------- Doppelt in zwei Büchern: seine Entscheidung (16.09.2026) ----------
   Gefragt: „أَخٌ (Bruder) und أُخْتٌ (Schwester) stehen in beiden Büchern und
   kommen deshalb doppelt. Soll ich die aus Bayna Yadayk ausblenden?" — Elias:
   „ja". Die App lässt diese Kennungen beim Einhängen weg
   (BUCHDUBLETTEN_AUSBLENDEN in js/buecher.js, v512).

   ⛔ Bis zum Wartungslauf vom 16.09.2026 kannte dieses Werkzeug die Liste nicht
   und meldete beide weiter als Befund — die Seite „Was auf dich wartet" hätte
   ihn ein zweites Mal nach etwas gefragt, das er schon beantwortet hat. Gelesen
   aus DERSELBEN Zeile wie vorrat.mjs, pruefe-funktionen.js und
   pruefe-wortfelder.js. [[entscheidung_gilt_fuer_das_zweite_werkzeug]]

   ⭐ Die Liste kann VERALTEN: verschwindet der Zwilling (neuer Abzug, andere
   Kennung, ein Kapitel nicht mehr frei), blendet sie ein Wort aus, das er dann
   GAR NICHT mehr hat — ohne Fehlermeldung, die Karte fehlt einfach. Das ist
   ein eigener Befund, und zwar für eine Sitzung, nicht für ihn: die Kennung
   gehört dann aus der Liste. [[ausfall_ist_unsichtbar_gebaut]] */
const AUSGEBLENDET = (() => {
  const q = fs.readFileSync(path.join(REPO, 'js', 'buecher.js'), 'utf8');
  const t = /const BUCHDUBLETTEN_AUSBLENDEN = new Set\(\[([\s\S]*?)\]\);/.exec(q);
  if (!t) {
    console.log('  ⚠ BUCHDUBLETTEN_AUSBLENDEN in js/buecher.js nicht gefunden — ausgeblendete Buchwörter zählen als Befund.');
    return new Set();
  }
  return new Set((t[1].replace(/\/\*[\s\S]*?\*\//g, '').match(/'([^']+)'/g) || []).map(x => x.slice(1, -1)));
})();
/* Wie die App: was ausgeblendet ist, gibt es in VOCAB_DATA nicht — also auch
   nicht als Partner eines Befunds. */
for (let i = bezug.length - 1; i >= 0; i--)
  if (AUSGEBLENDET.has(String(bezug[i].id))) bezug.splice(i, 1);

/* ---------- Die Grundregel der App (16.09.2026) ----------
   Elias: „das ist eine grundregel: wenn zwei identisch sind und eines davon aber
   fortschritt hat dann sollte man immer das behalten was fortschritt hat" — „also
   wenn er hier um zwei vokabeln geht die beide in kapiteln vorkommen" — „sollte es
   jedoch um ein meine eigenen wörter handeln dann soll man das was im kapitel ist
   bevorzugen und auf den gleichen stand bringen …".
   Die App entscheidet damit beim Start selbst (tauscheDubletten und
   blendeKapitelDublettenAus in js/kern.js). Eine Doppelung, die sie entscheidet, ist
   KEINE Frage an ihn — sonst fragte ihn seine Seite nach etwas, das er beantwortet
   hat. Offen bleiben nur: zwei Kapitelkarten, die BEIDE Fortschritt haben (dazu sagt
   die Regel nichts), und Paare, deren Bedeutung die App nicht als gleich erkennt.
   ⛔ Gleich heißt hier, was die App gleich nennt: die Vergleichsfunktionen werden
   aus js/kern.js GESCHNITTEN, nicht nachgebaut — auch der Artikel (أَلْمُهَنْدِسٌ =
   مُهَنْدِسٌ) und die Bedeutung kommen von dort. [[entscheidung_gilt_fuer_das_zweite_werkzeug]]
   Der Fortschritt kommt aus data/boxen.json (vorrat.mjs schreibt sie in jedem
   Wartungslauf aus seinem Geräteabgleich). */
const APP = (() => {
  const schneideKern = (name) => {
    const auf = kern.indexOf('function ' + name + '(');
    const zu = auf < 0 ? -1 : kern.indexOf('\n}', auf);
    return auf < 0 || zu < 0 ? null : kern.slice(auf, zu + 2);
  };
  const namen = ['dubForm', 'dubOhneArtikel', 'dubGleich', 'dubBedeutungGleich'];
  const teile = namen.map(schneideKern);
  const konst = (/const DUB_HARAKA_ENDE = [^\n]*/.exec(kern) || [])[0];
  if (!konst || teile.some(t => !t)) {
    console.error('⛔ Die Vergleichsfunktionen der App (' + namen.join(', ') + ') stehen nicht mehr in js/kern.js.');
    process.exit(1);
  }
  return new Function(konst + '\n' + teile.join('\n') + '\nreturn { dubGleich, dubBedeutungGleich, dubOhneArtikel };')();
})();
const artikelUndEndung = (a, b) => {
  const endung = a.type === 'particle' || b.type === 'particle';
  return { endung, artikel: !endung && a.type !== 'verb' && b.type !== 'verb' };
};
/* wie dubletteImBuch(): die eigene Karte trägt die Bedeutung */
const appGleichEigen = (eigen, w) => {
  const { endung, artikel } = artikelUndEndung(eigen, w);
  return APP.dubGleich(w.ar, eigen.ar, endung, artikel) && APP.dubBedeutungGleich(eigen, w);
};
/* wie blendeKapitelDublettenAus(): keine ist die eigene, Bedeutung in einer Richtung */
const appGleichKapitel = (a, b) => {
  const { endung, artikel } = artikelUndEndung(a, b);
  return APP.dubGleich(a.ar, b.ar, endung, artikel) && (APP.dubBedeutungGleich(a, b) || APP.dubBedeutungGleich(b, a));
};

const BOXEN_DATEI = path.join(REPO, 'data', 'boxen.json');
const BOXEN = (() => {
  try {
    const b = JSON.parse(fs.readFileSync(BOXEN_DATEI, 'utf8'));
    return (b && b.boxen && typeof b.boxen === 'object') ? b : null;
  } catch (e) { return null; }
})();
/* true / false — oder null, wenn es sich nicht messen lässt (dann fragt die Seite lieber). */
const hatFortschritt = (id) => {
  if (!BOXEN) return null;
  const box = Number(BOXEN.boxen[String(id)]);
  if (box > 1) return true;
  return Array.isArray(BOXEN.angefangen) ? BOXEN.angefangen.includes(String(id)) : false;
};

/* ---------- Vergleich ---------- */
const HARAKA_ENDE = /[ًٌٍَُِْ]$/;
function form(s) {
  return String(s == null ? '' : s).normalize('NFC')
    .replace(/ـ/g, '')
    .replace(/[آأإٱ]/g, 'ا')
    .trim()
    .replace(HARAKA_ENDE, '');
}
const gleich = (a, b) => { const x = form(a); return x.length > 0 && x === form(b); };

/* ---------- Eichung: kann diese Pruefung ueberhaupt durchfallen? ---------- */
/* ⛔ Ein Test, der nur "gruen" kennt, misst nichts.
   [[pruefwerkzeug_mit_eingebauter_antwort]] */
const EICHUNG = [
  ['بَيْتٌ', 'بَيْتٌ', true,  'dasselbe Wort'],
  ['صِفْرٌ', 'صَفَرَ', false, 'Null gegen Verb'],
  ['مِنْ',             'مَنْ',             false, 'min gegen man'],
  ['أَخٌ',             'اَخٌ',             true,  'Hamzah-Variante']
];
const eichFehler = EICHUNG.filter(([a, b, soll]) => gleich(a, b) !== soll);
if (eichFehler.length) {
  console.error('⛔ EICHUNG FEHLGESCHLAGEN — die Pruefung misst nicht, was sie soll:');
  eichFehler.forEach(([a, b, soll, was]) =>
    console.error('   ' + was + ': erwartet ' + soll + ', bekam ' + gleich(a, b)));
  process.exit(1);
}

/* Eine ausgeblendete Kennung ist nur dann entschieden, wenn es sie im Abzug
   noch gibt UND er dasselbe Wort unter einer ANDEREN Kennung hat. */
function ausblendenPruefen(ids, buch, bestand) {
  const entschieden = [], veraltet = [];
  for (const id of ids) {
    const w = buch.find(x => String(x.id) === String(id));
    if (!w) { veraltet.push({ id, grund: 'steht in keinem Buch des Abzugs mehr — die Kennung ist verwaist' }); continue; }
    const zwilling = bestand.filter(x => String(x.id) !== String(id) && gleich(x.ar, w.ar));
    if (zwilling.length) entschieden.push({ w, zwilling });
    else veraltet.push({ id, w, grund: 'er hat das Wort sonst nirgends — ausgeblendet fehlt es ihm ganz' });
  }
  return { entschieden, veraltet };
}
/* ⛔ Eichung: alle drei Ausgänge müssen erreichbar sein, sonst meldet der
   Abschnitt immer „entschieden". [[pruefwerkzeug_mit_eingebauter_antwort]] */
{
  const buch = [{ id: 'b1', ar: 'أَخٌ' }, { id: 'b2', ar: 'أُخْتٌ' }];
  const faelle = [
    ['Zwilling unter anderer Kennung', ausblendenPruefen(['b1'], buch, [{ id: 'm1', ar: 'أَخٌ' }]), 1, 0],
    ['Kennung nicht mehr im Abzug',    ausblendenPruefen(['b9'], buch, [{ id: 'm1', ar: 'أَخٌ' }]), 0, 1],
    ['nur ein ähnliches Wort da',      ausblendenPruefen(['b1'], buch, [{ id: 'm2', ar: 'أُخْتٌ' }]), 0, 1],
    ['das Wort selbst ist kein Zwilling', ausblendenPruefen(['b2'], buch, [{ id: 'b2', ar: 'أُخْتٌ' }]), 0, 1]
  ];
  const schief = faelle.filter(([, r, e, v]) => r.entschieden.length !== e || r.veraltet.length !== v);
  if (schief.length) {
    console.error('⛔ EICHUNG „ausgeblendet" FEHLGESCHLAGEN:');
    schief.forEach(([was, r, e, v]) => console.error('   ' + was + ': erwartet ' + e + ' entschieden / ' + v
      + ' veraltet, bekam ' + r.entschieden.length + ' / ' + r.veraltet.length));
    process.exit(1);
  }
}

/* ---------- Messen ---------- */
console.log('--- A13: Duplikate zu freigeschalteten Vokabeln ---');
console.log('');
console.log('  Freigeschaltet: ' + Object.entries(FREI)
  .map(([b, k]) => b + ' K' + Math.min(...k) + '-' + Math.max(...k)).join(' · '));
console.log('  Verglichen gegen ' + (bezug.length - NUR_VOCAB.length) + ' von ' + BUCH.length + ' Buchvokabeln'
  + (NUR_VOCAB.length ? ' + ' + NUR_VOCAB.length + ' aus vocab-data.js, die der Abzug nicht hergibt' : '')
  + (ALLE ? '  (--alle: ALLE, auch nicht freigeschaltete)' : ''));
console.log('  Eichung: ' + EICHUNG.length + ' Faelle, alle wie erwartet.');
console.log('');

const ausblendung = ausblendenPruefen([...AUSGEBLENDET], BUCH, bezug.concat(EIGENE, FACH));
if (ausblendung.entschieden.length) {
  console.log('=== in zwei Büchern, im zweiten ausgeblendet (kein Befund): ' + ausblendung.entschieden.length + ' ===');
  ausblendung.entschieden.forEach(({ w, zwilling }) => console.log('  ' + String(w.ar).padEnd(20) + ' '
    + w.book + ' K' + w.chapter + ' id ' + w.id + ' „' + (w.de || '') + '" — er hat es als '
    + zwilling.map(z => (z.id + ' „' + (z.de || '') + '"')).join(' / ')));
  console.log('  (Elias, 16.09.2026: „ja" — BUCHDUBLETTEN_AUSBLENDEN in js/buecher.js)');
  console.log('');
}
if (ausblendung.veraltet.length) {
  console.log('=== ⛔ ' + ausblendung.veraltet.length + ' Ausblendung(en) veraltet — Arbeit für eine Sitzung, keine Frage an Elias ===');
  ausblendung.veraltet.forEach(v => console.log('  id ' + v.id + (v.w ? ' ' + v.w.ar + ' „' + (v.w.de || '') + '"' : '')
    + ': ' + v.grund));
  console.log('  → die Kennung aus BUCHDUBLETTEN_AUSBLENDEN (js/buecher.js) nehmen oder den neuen Zwilling prüfen.');
  console.log('');
}

const befunde = [];
for (const [herkunft, liste] of [['eigene Vokabel', EIGENE], ['Fachbegriff', FACH]]) {
  for (const e of liste) {
    /* ⭐ Dazu, was die App ohne Artikel als gleich erkennt (16.09.2026) —
       أَلْمُهَنْدِسٌ fand die Schriftbild-Suche nicht. */
    const t = bezug.filter(x => gleich(x.ar, e.ar) || appGleichEigen(e, x));
    if (t.length) befunde.push({ herkunft, e, t });
  }
}
/* Und innerhalb der freigeschalteten selbst. */
const gesehen = new Map();
for (const w of bezug) {
  const f = form(w.ar);
  if (!f) continue;
  if (gesehen.has(f)) befunde.push({ herkunft: 'Buchvokabel', e: w, t: [gesehen.get(f)] });
  else gesehen.set(f, w);
}
/* ⭐ Dazu Paare, die sich NUR im Artikel unterscheiden — aber nur, wenn auch die
   App sie gleich nennt (Bedeutung). Sonst stünde الْيَوْمُ „heute" gegen يَوْمٌ „Tag"
   als Frage auf seiner Seite (so im ersten Lauf am 16.09.2026). */
const ohneArtikel = new Map();
for (const w of bezug) {
  if (w.type === 'particle' || w.type === 'verb') continue;
  const f = form(APP.dubOhneArtikel(w.ar));
  if (!f) continue;
  for (const v of (ohneArtikel.get(f) || []))
    if (form(v.ar) !== form(w.ar) && appGleichKapitel(v, w)) befunde.push({ herkunft: 'Buchvokabel', e: w, t: [v] });
  ohneArtikel.set(f, (ohneArtikel.get(f) || []).concat(w));
}

/* ---------- Bewusst nebeneinander ----------
   ⛔ Ein Paar, das der Pruefer jeden Lauf als Befund fuehrt und im selben Atemzug
   selbst fuer KEIN Duplikat erklaert, ist kein Kandidat mehr — es ist Rauschen,
   das den echten Kandidaten daneben unsichtbar macht. Seit dem 09.09.2026 steht
   es deshalb hier, MIT dem Grund; die Bedeutungen unterscheiden sich, und das
   ist eine Tatsache aus den Daten, keine Entscheidung.
   ⚠️ Nur Paare mit VERSCHIEDENER Bedeutung gehoeren hierher. Ein Paar mit
   gleicher Bedeutung (سَيِّدٌ „Herr" gegen madina-2 K18 „Herr") bleibt Befund —
   welche Karte Elias behaelt, entscheidet er. [[kandidatenliste_ist_keine_fehlerliste]] */
const BEWUSST_NEBENEINANDER = [
  { a: 'gram-zarf', b: 46352, grund: 'ظَرْف = Zeit-/Ortsangabe (Fachbegriff) gegen ظَرْفٌ = Umschlag (madina-2 K17) — anderes Wort, gleiches Schriftbild' }
];
const bewusst = [];
for (let i = befunde.length - 1; i >= 0; i--) {
  const f = befunde[i];
  const treffer = BEWUSST_NEBENEINANDER.find(p =>
    String(f.e.id) === String(p.a) && f.t.some(x => String(x.id) === String(p.b)));
  if (treffer) { bewusst.push({ f, grund: treffer.grund }); befunde.splice(i, 1); }
}
if (bewusst.length) {
  console.log('=== bewusst nebeneinander (kein Befund): ' + bewusst.length + ' ===');
  bewusst.forEach(({ f, grund }) => console.log('  ' + f.e.ar.padEnd(20) + ' ' + grund));
  console.log('');
}

/* ---------- Was die App nach seiner Grundregel selbst entscheidet ---------- */
const entschiedenApp = [];
for (let i = befunde.length - 1; i >= 0; i--) {
  const f = befunde[i];
  if (f.herkunft === 'Buchvokabel') {
    const a = f.e, b = f.t[0];
    if (!appGleichKapitel(a, b)) continue;          /* Bedeutung nicht sicher gleich: er entscheidet */
    const fa = hatFortschritt(a.id), fb = hatFortschritt(b.id);
    if (fa === null || fb === null) continue;        /* nicht messbar: lieber fragen als raten */
    if (fa && fb) continue;                          /* beide: dazu sagt seine Regel nichts */
    const bleibt = fa ? a : fb ? b : null;
    entschiedenApp.push({ f, grund: bleibt
      ? 'die Karte mit Fortschritt bleibt (' + (bleibt.book || 'vocab-data') + ' K' + bleibt.chapter + ' id ' + bleibt.id + '), die andere blendet die App beim Start aus'
      : 'noch keine mit Fortschritt — beide bleiben, bis er eine beantwortet hat; dann blendet die App die andere aus' });
    befunde.splice(i, 1);
  } else {
    const treffer = f.t.filter(x => appGleichEigen(f.e, x));
    if (!treffer.length) continue;                   /* Bedeutung nicht sicher gleich: er entscheidet */
    entschiedenApp.push({ f, grund: 'seine Karte geht, ' + (treffer[0].book || 'vocab-data') + ' K' + treffer[0].chapter
      + ' id ' + treffer[0].id + ' bleibt und bekommt seinen Stand — sobald das Buch geladen ist' });
    befunde.splice(i, 1);
  }
}
if (!BOXEN) console.log('  ⚠ data/boxen.json fehlt oder ist unlesbar — zwei Kapitelkarten bleiben Befund (Fortschritt nicht messbar).\n');
else if (!Array.isArray(BOXEN.angefangen)) console.log('  ⚠ data/boxen.json ohne `angefangen` (älter als 16.09.2026) — eine Karte in Box 1 mit Antworten zählt bis zum nächsten Abruf als „ohne Fortschritt".\n');
if (entschiedenApp.length) {
  console.log('=== entscheidet die App nach seiner Grundregel (kein Befund): ' + entschiedenApp.length + ' ===');
  entschiedenApp.forEach(({ f, grund }) => console.log('  ' + String(f.e.ar).padEnd(20) + ' ' + f.herkunft + ' id ' + f.e.id
    + ' == ' + f.t.map(x => x.id).join(' / ') + ' — ' + grund));
  console.log('  (Elias, 16.09.2026: „das ist eine grundregel: wenn zwei identisch sind und eines davon aber fortschritt hat');
  console.log('   dann sollte man immer das behalten was fortschritt hat" — tauscheDubletten / blendeKapitelDublettenAus in js/kern.js)');
  console.log('');
}

if (!befunde.length) {
  console.log(ausblendung.veraltet.length ? '⛔ Kein neues Wort steht doppelt — aber die Ausblendliste ist veraltet (oben).'
                                          : '✅ Keine Doppelung, die er entscheiden muss.');
  process.exit(ausblendung.veraltet.length ? 2 : 0);
}
/* ⭐⭐ WAS BRINGT JEDE SEITE MIT? (09.09.2026)
 *
 * „Zwei Karten fuer dasselbe Wort — welche willst du?" ist ohne diese Zeile
 * nicht zu beantworten. Entscheidend ist, was beim Wegwerfen VERLOREN geht:
 * eine Eselsbruecke, ein Beispielsatz, ein Plural, eine Wurzel. Steht das
 * alles nur auf einer Seite, ist die Antwort in zwei Sekunden da; steht es auf
 * beiden verschieden, ist es eine echte Abwaegung.
 *
 * ⛔ Die Zeile URTEILT nicht — sie zaehlt gefuellte Felder. Welche Karte
 * bleibt, entscheidet Elias. [[kandidatenliste_ist_keine_fehlerliste]]
 */
const FELDER = ['mnemo', 'sentAr', 'sentDe', 'pl', 'sg', 'root', 'type', 'gender',
                'femSg', 'femPl', 'note', 'deNeben', 'quran'];
const mitbringt = (w) => {
  const da = FELDER.filter(f => {
    const v = w && w[f];
    return v != null && v !== '' && !(typeof v === 'object' && !Object.keys(v).length);
  });
  return da.length ? da.join(', ') : '— nichts ausser Wort und Bedeutung';
};
/* ⛔ Eichung fuer diese Zeile — sie muss ein leeres Feld von einem gefuellten
   unterscheiden koennen, sonst steht ueberall dasselbe da und die Auskunft ist
   wertlos, ohne dass es auffaellt. Exit 1 = Werkzeugfehler (wie bei der
   Eichung oben), NICHT 2 = Befund. */
{
  const proben = [
    [{ mnemo: 'x', sentAr: 'y' },        'mnemo, sentAr'],
    [{ mnemo: '', pl: null, root: 'r' }, 'root'],
    [{},                                 '— nichts ausser Wort und Bedeutung'],
    [{ quran: {} },                      '— nichts ausser Wort und Bedeutung'],
    [{ quran: { surah: 1 } },            'quran'],
  ];
  const schief = proben.filter(([w, soll]) => mitbringt(w) !== soll);
  if (schief.length){
    console.error('⛔ EICHUNG „bringt mit" FEHLGESCHLAGEN — die Zeile misst nicht:');
    schief.forEach(([w, soll]) => console.error('   ' + JSON.stringify(w)
      + ': erwartet „' + soll + '", bekam „' + mitbringt(w) + '"'));
    process.exit(1);
  }
}
console.log('=== ' + befunde.length + ' Befund(e) ===');
for (const b of befunde) {
  console.log('  ' + String(b.e.ar).padEnd(22) + '(' + b.herkunft + ', id ' + b.e.id + ')  ' + (b.e.de || ''));
  console.log('        bringt mit: ' + mitbringt(b.e));
  b.t.forEach(x => {
    console.log('      == ' + String(x.ar).padEnd(20) + x.book + ' K' + x.chapter + '  id ' + x.id + '  ' + (x.de || ''));
    console.log('        bringt mit: ' + mitbringt(x));
  });
}
console.log('');
console.log('⚠️ Ein Befund ist noch keine Aufforderung: ein Fachbegriff und eine');
console.log('   Buchvokabel koennen bewusst nebeneinander stehen (Grammatikkarte');
console.log('   gegen Wortschatzkarte). Welche Elias will, entscheidet er.');
console.log('');
/* ⛔ Was hier noch als Befund steht, entscheidet seine Grundregel NICHT: zwei
   Kapitelkarten mit Fortschritt auf BEIDEN, oder eine Bedeutung, die die App nicht
   als gleich erkennt (dann ist es vielleicht gar kein Duplikat). */
if (befunde.some(b => b.herkunft === 'Buchvokabel')) {
  console.log('⭐ In zwei Kapiteln: die App behält seit dem 16.09.2026 selbst die Karte mit');
  console.log('   Fortschritt. Hier stehen nur Paare, bei denen BEIDE Fortschritt haben oder die');
  console.log('   Bedeutung nicht sicher gleich ist — die entscheidet er je Wort.');
  console.log('');
}
/* ⭐ Die BEDEUTUNG steht seit dem 20.08.2026 hinter jedem Eintrag — ohne sie
   sieht ein Homograph aus wie ein Duplikat. Genau das war bei ظَرْف der Fall:
   der Fachbegriff heißt „Zeit- oder Ortsangabe“, die Buchvokabel „Umschlag“.
   Gleiches Schriftbild, verschiedene Woerter. Automatisch entscheiden laesst
   sich das nicht — deutscher Text ist frei formuliert —, aber SICHTBAR machen
   schon. [[skelettvergleich_wirft_information_weg]] */
console.log('⛔ Und zwar mit BEDEUTUNG vergleichen, nicht nur mit Schriftbild:');
console.log('   ظَرْف = Zeit-/Ortsangabe gegen ظَرْفٌ = Umschlag ist KEIN Duplikat.');
console.log('');
/* ⭐ Seit v365 (07.09.2026) handelt die App selbst — Elias' Regel:
     „wenn so ein fall kommt dann kannst du meine durch die im buch
      ersetzen. dieses eine wort soll dann schon voher einzeln
      freigeschalten sein und möglichst identisch durch meins ersetzt werden."

   `tauscheDubletten()` in js/kern.js laeuft bei jedem Start: es schaltet die
   Buchvokabel einzeln frei, nimmt Fortschritt, Notiz, eigene Eselsbruecke
   und „kenne ich schon" mit und entfernt erst dann die eigene Karte.

   ⚠️ DIESER PRUEFER MISST DEN REPO-ABZUG, nicht Elias' Geraet. Er meldet
   eine echte Dublette deshalb so lange, bis Elias die App einmal geoeffnet
   und der naechste Abzug (hole-vokabeln.mjs) sie mitgenommen hat. Ohne
   diesen Absatz sieht das aus wie ein ungeloestes Problem.
   [[pruefserver_ist_nicht_die_app]] [[erledigt_heisst_nicht_wertlos]] */
console.log('\u2b50 Die App loest ECHTE Dubletten seit v365 beim Start selbst auf');
console.log('   (tauscheDubletten in js/kern.js, mit Fortschritt-Uebernahme).');
console.log('   Dieser Lauf misst den Repo-Abzug — ein Befund verschwindet hier');
console.log('   erst nach dem naechsten hole-vokabeln.mjs.');
process.exit(2);
