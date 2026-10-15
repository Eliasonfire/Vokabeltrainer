#!/usr/bin/env node
/* test-plural-karte.mjs — die Mehrzahl auf der Lernkarte: „regelmäßig", das zweite Tippfeld — und dass
   „Klingt wie" weg bleibt (Elias, 15.10.2026: „dieses klingt wie ist quatsch, das soll raus").
 * ==========================================================================
 *
 * ⛔⛔ DIE SÄTZE, DIE DIESER PRÜFSTAND BEWACHT — VON ELIAS, 12.10.2026
 *
 *   „lass uns auch überlegen wie ich in zukunft diese pluralformen mir einprägen kann weil
 *   teilweise sind sie sehr ähnlich zu den singularformen … oder sie sind wirklich nicht so
 *   nah und dann sind sie gefühlt wie neue wörter. also irgendwie brauche ich da eine lösung
 *   langfristig" — auf den Vorschlag in drei Stufen: „hört sich gut an" — und dazu:
 *   „man könnte auch ab box 4 den plural verlangen aber auch nur da wo es regelmässig ist".
 *
 * Die AUSNAHMEN sind der Kern:
 *   - Solange ER nichts einschaltet, ändert sich nichts: ohne „Pluralformen anzeigen" keine
 *     Zeile auf der Rückseite, ohne „Mehrzahl mit eintippen" kein zweites Feld.
 *   - „aber auch nur da wo es regelmässig ist": das zweite Feld steht nie bei einer
 *     gebrochenen Mehrzahl, und nie ohne das erste Feld (Box 4, die Karte fragt auf Deutsch).
 *   - Was regelmäßig ist, sagt EINE Stelle: uebPluralArt() in js/uebung.js. Fehlt sie, gilt
 *     nichts als regelmäßig und nichts bekommt einen Partner.
 *
 * Alles läuft am ECHTEN Quelltext: die Funktionen werden aus js/kern.js, js/lernen.js,
 * js/uebung.js und js/saetze.js geschnitten und gegen Probekarten gefahren. Die Probekarten
 * sind allgemein bekannte Wörter, in Buckwalter-Umschrift geschrieben und hier in Schrift
 * gewandelt (kein getipptes Arabisch); sie stehen auf keiner seiner Karten in dieser Rolle.
 *   M  das Muster (pluralMuster): Familien, Kasusendung, schwache Buchstaben, Schadda
 *   P  die Partner (pluralKlangPartner): Reihenfolge nach Kasten, Ausnahmen
 *   L  die Rückseite der Lernkarte
 *   T  das zweite Tippfeld und die Tablet-Tasten
 *   H  die Kartenhöhe: reicht die Vorderseite für den Tippkasten nicht, wächst die Karte
 *      (tippKarteHoehe() in js/lernen.js — MEINE Regel, Claude, nicht von Elias bestellt; sie
 *      behebt den gemessenen Überlauf am Tablet, den das zweite Feld vergrößert hätte)
 *   V  Verdrahtung in index.html, js/einstellungen.js und js/kern.js
 *   R  seine echten Karten (Auswahl aus .stand-app.json): die Zeile ist dort nicht tot
 *   S  Störtests: der Quelltext wird verändert, der zuständige Fall MUSS scheitern
 *
 * Aufruf: node test-plural-karte.mjs      Exit 0 = alles in Ordnung
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const lies = p => fs.readFileSync(path.join(HIER, p), 'utf8');
const KERN = lies('js/kern.js'), LERNEN = lies('js/lernen.js'), UEBUNG = lies('js/uebung.js'), SAETZE = lies('js/saetze.js');
const HTML = lies('index.html'), EINST = lies('js/einstellungen.js');

/* ---------- Schneiden ---------- */
function schneideFunktion(quelle, kopf){
  const a = quelle.indexOf(kopf);
  if (a < 0) throw new Error('nicht gefunden im Quelltext: ' + kopf);
  let tiefe = 0;
  for (let i = quelle.indexOf('{', a); i >= 0 && i < quelle.length; i++){
    if (quelle[i] === '{') tiefe++;
    else if (quelle[i] === '}'){ tiefe--; if (!tiefe) return quelle.slice(a, i + 1); }
  }
  throw new Error('kein Ende gefunden: ' + kopf);
}
function schneideBis(quelle, kopf, ende){
  const a = quelle.indexOf(kopf);
  if (a < 0) throw new Error('nicht gefunden im Quelltext: ' + kopf);
  const b = quelle.indexOf(ende, a);
  if (b < 0) throw new Error('Ende nicht gefunden: ' + kopf);
  return quelle.slice(a, b + ende.length);
}
const zeile = (quelle, anfang) => schneideBis(quelle, anfang, '\n');

/* Was die neuen Funktionen aus dem Kern brauchen — und sie selbst (von PL_Z bis zum Ende von pluralKlangPartner). */
const kernTeile = kern => [
  zeile(kern, 'const ZAHLWORT_DE = '), schneideFunktion(kern, 'function istZahlwort('),
  zeile(kern, 'const PLURAL_MARKE = '), schneideFunktion(kern, 'function istPluralKarte('),
  zeile(kern, 'const FORM_TRENNER = '), schneideFunktion(kern, 'function formen('), zeile(kern, 'function formenAnzeige('),
  schneideFunktion(kern, 'function plBeschriftung('),
  schneideBis(kern, 'const PL_Z = c =>', '\n  return aus;\n}'),
  schneideFunktion(kern, 'function escapeHtml('),
];
const artTeile = uebung => [zeile(SAETZE, 'function ohneTaschkil('), schneideFunktion(uebung, 'function uebPluralArt(')];

/* ---------- Probekarten (Buckwalter → Schrift, als Codepunkte) ---------- */
const BW = { "'": 0x621, '>': 0x623, '&': 0x624, '<': 0x625, '}': 0x626, A: 0x627, b: 0x628, p: 0x629, t: 0x62A, v: 0x62B, j: 0x62C,
  H: 0x62D, x: 0x62E, d: 0x62F, '*': 0x630, r: 0x631, z: 0x632, s: 0x633, $: 0x634, S: 0x635, D: 0x636, T: 0x637, Z: 0x638,
  E: 0x639, g: 0x63A, f: 0x641, q: 0x642, k: 0x643, l: 0x644, m: 0x645, n: 0x646, h: 0x647, w: 0x648, Y: 0x649, y: 0x64A,
  F: 0x64B, N: 0x64C, K: 0x64D, a: 0x64E, u: 0x64F, i: 0x650, '~': 0x651, o: 0x652 };
const ar = t => [...t].map(c => { if (c === ' ' || c === '/') return c; if (!(c in BW)) throw new Error('kein Buckwalter-Zeichen: ' + c); return String.fromCodePoint(BW[c]); }).join('').normalize('NFC');
const wz = t => [...t].map(c => ar(c)).join(' ');
const karte = (id, de, sg, pl, wurzel, dazu) => Object.assign({ id: String(id), de, ar: ar(sg), sg: ar(sg), pl: ar(pl), root: wz(wurzel), type: 'noun' }, dazu || {});
const KARTEN = [
  karte(1, 'Mann', 'rajulN', 'rijAlN', 'rjl'),
  karte(2, 'groß / alt', 'kabiyrN', 'kibArN', 'kbr'),
  karte(3, 'Hund', 'kalobN', 'kilAbN', 'klb'),
  karte(4, 'Berg', 'jabalN', 'jibAlN', 'jbl'),
  karte(5, 'Haus', 'bayotN', 'buyuwtN / >aboyAtN', 'byt'),
  karte(6, 'Herz', 'qalobN', 'quluwbN', 'qlb'),
  karte(7, 'Stift', 'qalamN', '>aqolAmN', 'qlm'),
  karte(8, 'Lehrer', 'mudar~isN', 'mudar~isuwna', 'drs'),
  karte(9, 'Auto', 'say~ArapN', 'say~ArAtN', 'syr'),
  karte(10, 'fünf', 'xamosapN', 'xamosN', 'xms'),
  karte(11, 'der Mann', 'rajulN', 'rijAlN', 'rjl'),
  karte(12, 'Buch', 'kitAbN', 'kutubN', 'ktb'),
  karte(13, 'Gesandter', 'rasuwlN', 'rusulN', 'rsl'),
  karte(14, 'Kind', 'waladN', '>awolAdN', 'wld'),
  karte(15, 'Wort ohne Wurzel', 'tilofAzN', 'tilofAzAtN', '', { root: '' }),
  karte(16, 'Berg (zweite Karte)', 'jabalN', 'jibAlN', 'jbl'),
  /* 17 ist regelmäßig, 18 trägt zwei Formen (also nicht regelmäßig) — und sanawāt hat dasselbe Muster wie
     shajarāt. Daran zeigt sich, ob eine regelmäßige Karte fälschlich Partner wird (P4, Störtests S1 und S8). */
  karte(17, 'Baum', '$ajarapN', '$ajarAtN', '$jr'),
  karte(18, 'Jahr', 'sanapN', 'sanawAtN / sinuwna', 'snw'),
];
const BOX = { 2: { box: 5 }, 3: { box: 3 }, 4: { box: 1 }, 16: { box: 7 }, 6: { box: 4 } };

function welt(kern, uebung, opt = {}){
  const ctx = { console: { log(){}, warn(){}, error(){} } };
  vm.createContext(ctx);
  vm.runInContext('let PROGRESS = ' + JSON.stringify(opt.fortschritt || BOX) + '; let __KARTEN = ' + JSON.stringify(opt.karten || KARTEN)
    + '; function bekannteVokabeln(){ return __KARTEN; }', ctx);
  vm.runInContext([...kernTeile(kern), ...(opt.ohneArt ? [] : artTeile(uebung))].join('\n'), ctx);
  const hole = code => vm.runInContext(code, ctx);
  return { ctx, hole,
    muster: (form, wurzel) => hole('pluralMuster(' + JSON.stringify(ar(form)) + ',' + JSON.stringify(wz(wurzel)) + ')'),
    partner: (id, n = 2) => hole('JSON.stringify(pluralKlangPartner(__KARTEN.find(k => k.id === ' + JSON.stringify(String(id)) + '), ' + n + ').map(t => [t.karte.id, t.form, t.de, t.box]))'),
  };
}

/* Die Rückseite: der Formen-Block der Lernkarte, herausgeschnitten und als Funktion gefahren. */
function rueckseite(kern, lernen, uebung, einstellungen, opt){
  const a = lernen.indexOf('  let forms = [];'), b = lernen.indexOf('\n  renderVerbFormen(w);');
  if (a < 0 || b < a) throw new Error('der Formen-Block der Lernkarte wurde nicht gefunden');
  const w = welt(kern, uebung, opt);
  vm.runInContext('let SETTINGS = ' + JSON.stringify(einstellungen) + '; const __el = { innerHTML: "" }; const document = { getElementById(){ return __el; } };'
    + '\nfunction __zeige(w){\n' + lernen.slice(a, b) + '\n  return __el.innerHTML;\n}', w.ctx);
  return id => w.hole('__zeige(__KARTEN.find(k => k.id === ' + JSON.stringify(String(id)) + '))');
}

/* Das Tippfeld: ein Doppel der Seite — nur, was die geschnittenen Funktionen fragen. */
const HANDY = [{ maxTouchPoints: 5 }, { width: 412, height: 915 }], TABLET = [{ maxTouchPoints: 5 }, { width: 924, height: 1480 }];
function element(klassen){
  const k = new Set(klassen || []), attr = {};
  return { value: '', selectionStart: 0, selectionEnd: 0, innerHTML: '', textContent: '', className: '', dataset: {},
    classList: { add: x => k.add(x), remove: x => k.delete(x), contains: x => k.has(x),
      toggle: (x, an) => { const soll = an === undefined ? !k.has(x) : !!an; if (soll) k.add(x); else k.delete(x); return soll; } },
    setAttribute: (n, v) => { attr[n] = String(v); }, removeAttribute: n => { delete attr[n]; },
    getAttribute: n => (n in attr ? attr[n] : null), hasAttribute: n => n in attr,
    setSelectionRange(x, y){ this.selectionStart = x; this.selectionEnd = y; } };
}
function tippWelt(kern, lernen, uebung, opt){
  const els = {};
  const hol = id => els[id] || (els[id] = element(['cardTippBox', 'cardTippPlural', 'cardTippTasten'].includes(id) ? ['hidden'] : []));
  const zustand = { geraet: opt.geraet || HANDY };
  const ctx = { console: { log(){}, warn(){}, error(){} }, document: { getElementById: hol } };
  Object.defineProperty(ctx, 'navigator', { get: () => zustand.geraet[0], enumerable: true });
  Object.defineProperty(ctx, 'screen', { get: () => zustand.geraet[1], enumerable: true });
  vm.createContext(ctx);
  vm.runInContext('let SETTINGS = ' + JSON.stringify(opt.einstellungen) + '; let PROGRESS = ' + JSON.stringify(opt.fortschritt)
    + '; let SESSION = { words: ' + JSON.stringify(opt.karten) + ', idx: 0, dirs: [], fertig: false }; function bekannteVokabeln(){ return SESSION.words; }'
    /* Für Fall H6: ein Zähler an der Stelle der Höhenregel — gezählt wird, ob renderTippfeld() sie ruft. */
    + (opt.zaehleHoehe ? ' let __hoehe = 0; function tippKarteHoehe(){ __hoehe++; }' : ''), ctx);
  const richtung = lernen.match(/\nconst RICHTUNG_NUR_ARABISCH_BIS_BOX = [^\n]*;/);
  if (!richtung) throw new Error('RICHTUNG_NUR_ARABISCH_BIS_BOX nicht gefunden');
  vm.runInContext([...kernTeile(kern), ...artTeile(uebung), richtung[0],
    schneideFunktion(lernen, 'function cardDirection('), schneideFunktion(lernen, 'function tippPluralDran('),
    schneideFunktion(lernen, 'function renderTippfeld('), schneideFunktion(lernen, 'function pruefeTippen('),
    schneideBis(lernen, 'const TIPP_TASTEN = [', '\n];'), schneideFunktion(lernen, 'function istTablet('),
    schneideFunktion(lernen, 'function baueTippTasten('), schneideFunktion(lernen, 'function zeigeTippTasten('),
    schneideFunktion(lernen, 'function tippTaste(')].join('\n'), ctx);
  const hole = code => vm.runInContext(code, ctx);
  return { els: new Proxy({}, { get: (_, id) => hol(id) }), zustand, hole,
    zeige: i => hole('SESSION.idx = ' + i + '; renderTippfeld(SESSION.words[' + i + ']);'),
    pruefe: (i, wort, mehrzahl) => { hol('cardTippEingabe').value = wort; if (mehrzahl !== undefined) hol('cardTippPlural').value = mehrzahl;
      hole('SESSION.idx = ' + i + '; pruefeTippen();'); return hol('cardTippAntwort').className + ' | ' + hol('cardTippAntwort').textContent; } };
}
/* Die Kartenhöhe: ein Doppel der Vorderseite, das wie das Flex-Layout der Seite rechnet. Die Teile
   stehen mittig untereinander; ein Teil mit `gequetscht` ist kleiner, solange es schrumpfen darf
   (so wie der Lautsprecher-Knopf in der zu kleinen Karte: 24 statt 54 px, gemessen 13.10.2026).
   `fest` sind die Teile mit position:absolute — die Marken (`oben`) und „Antippen zum Umdrehen"
   (`unten` = Abstand seiner Oberkante vom unteren Rand). Die Zahlen der Fälle sind die gemessenen. */
function hoeheWelt(lernen, opt){
  const karte = { style: { minHeight: opt.karteVorher || '' } }, innen = { style: { minHeight: opt.karteVorher || '' } };
  const hoeheJetzt = () => karte.style.minHeight ? parseInt(karte.style.minHeight, 10) - 2 : opt.basis;
  const teile = opt.teile.map(t => Object.assign({}, t, { style: { flexShrink: t.vorher || '' } }));
  const fluss = teile.filter(t => !t.fest && !t.verborgen);
  const hoeheVon = t => (t.gequetscht !== undefined && t.style.flexShrink !== '0') ? t.gequetscht : t.h;
  for (const t of teile){
    Object.defineProperty(t, 'offsetHeight', { get: () => t.verborgen ? 0 : hoeheVon(t) });
    Object.defineProperty(t, 'offsetTop', { get: () => {
      if (t.fest) return t.unten !== undefined ? hoeheJetzt() - t.unten : t.oben;
      let y = Math.round((hoeheJetzt() - fluss.reduce((s, x) => s + (x.abstand || 0) + hoeheVon(x), 0)) / 2);
      for (const x of fluss){ y += (x.abstand || 0); if (x === t) return y; y += hoeheVon(x); }
      return 0; } });
  }
  const vorn = { children: teile };
  Object.defineProperty(vorn, 'clientHeight', { get: hoeheJetzt });
  Object.defineProperty(vorn, 'offsetHeight', { get: () => hoeheJetzt() + 2 });
  karte.querySelector = sel => sel === '.flashcard-inner' ? innen : sel === '.flashcard-front' ? vorn : null;
  const kasten = element(opt.kastenZu ? ['hidden'] : []);
  const ctx = { console: { log(){}, warn(){}, error(){} },
    document: { getElementById: id => id === 'flashcard' ? karte : id === 'cardTippBox' ? kasten : null },
    getComputedStyle: el => el === vorn ? { position: 'absolute', paddingTop: opt.polster + 'px', paddingBottom: opt.polster + 'px' } : { position: el.fest ? 'absolute' : 'static' } };
  vm.createContext(ctx);
  vm.runInContext(schneideFunktion(lernen, 'function tippKarteHoehe(') + '\ntippKarteHoehe();', ctx);
  return { karte: karte.style.minHeight, innen: innen.style.minHeight, schrumpf: teile.map(t => t.style.flexShrink).join('|') };
}
const MARKEN = { fest: true, oben: 18, h: 26 }, HINWEIS = { fest: true, unten: 37, h: 15 };
/* Handy 375×812, ein Feld, ohne Tasten: Inhalt 287 px, Marken bis 42, Hinweis 34 px über dem Rand, Polster 24, Vorderseite 458. */
const HOEHE_HANDY = { basis: 458, polster: 24, teile: [{ fest: true, oben: 16, h: 26 }, { h: 77 }, { h: 54, abstand: 18 }, { h: 120, abstand: 18 }, { fest: true, unten: 34, h: 15 }] };
/* Tablet 800×1249, zwei Felder, mit Tasten: Inhalt 659 px (77 + 18 + 54 + 18 + 492), Marken bis 44, Polster 28 → 749 px Karte. */
const HOEHE_TABLET = { basis: 458, polster: 28, teile: [MARKEN, { h: 77 }, { h: 54, gequetscht: 24, abstand: 18 }, { h: 492, abstand: 18 }, HINWEIS] };

const TIPP_KARTEN = [KARTEN[7], KARTEN[8], KARTEN[0], KARTEN[9]];          /* Lehrer (regelmäßig m), Auto (regelmäßig f), Mann (gebrochen), fünf (Zahlwort) */
const TIPP_STAND = { 8: { box: 5 }, 9: { box: 4 }, 1: { box: 6 }, 10: { box: 6 } };
const SEIN = { direction: 'de-ar', tippenAbBox4: true };                    /* so steht es bei ihm (13.10.2026); seit 14.10.2026 kommt dort das zweite Feld ohne eigenen Schalter */
const BEIDE = { direction: 'de-ar', tippenAbBox4: true, tippenPlural: true };

/* ---------- Die Fälle ---------- */
function laufe(kern, lernen, uebung){
  const erg = new Map();
  const fall = (name, fn) => { let r; try { r = fn(); } catch (e){ r = 'wirft: ' + e.message; } erg.set(name, { ok: r === true, zusatz: r === true ? '' : String(r) }); };
  const W = () => welt(kern, uebung);

  fall('M1 Eine Familie: rijāl, kilāb, kibār und jibāl haben dasselbe Muster — und es ist nicht das von kutub oder buyūt', () => {
    const w = W(), a = w.muster('rijAlN', 'rjl');
    if (!a) return 'kein Muster für rijāl';
    for (const [f, r] of [['kilAbN', 'klb'], ['kibArN', 'kbr'], ['jibAlN', 'jbl']]) if (w.muster(f, r) !== a) return f + ' fällt aus der Familie';
    if (w.muster('kutubN', 'ktb') === a || w.muster('buyuwtN', 'byt') === a) return 'kutub oder buyūt gilt als dieselbe Familie wie rijāl';
    return w.muster('kutubN', 'ktb') === w.muster('rusulN', 'rsl') && w.muster('buyuwtN', 'byt') === w.muster('quluwbN', 'qlb') ? true : 'kutub/rusul oder buyūt/qulūb sind keine Familie';
  });
  fall('M2 Die Kasusendung zählt nicht: rijālun, rijālu, rijālin und rijāli sind ein Muster', () => {
    const w = W(), a = w.muster('rijAlN', 'rjl');
    return ['rijAlu', 'rijAlK', 'rijAli'].every(f => w.muster(f, 'rjl') === a) ? true : 'eine Endung ändert das Muster';
  });
  fall('M3 Schwache Buchstaben: aʿyād (ʿ-w-d) und abwāb (b-w-b) klingen wie aqlām — und awlād (w-l-d) auch: das Alif vorn ist dort Vorsilbe', () => {
    const w = W(), a = w.muster('>aqolAmN', 'qlm');
    if (w.muster('>aEoyAdN', 'Ewd') !== a) return 'aʿyād: das Ya steht nicht für das Waw der Wurzel';
    if (w.muster('>abowAbN', 'bwb') !== a) return 'abwāb fällt aus der Familie';
    return w.muster('>awolAdN', 'wld') === a ? true : 'awlād bekommt ein eigenes Muster: ' + w.muster('>awolAdN', 'wld');
  });
  fall('M4 Ein verdoppelter Wurzelbuchstabe unter Schadda zählt doppelt: asirra (s-r-r) und adilla (d-l-l) sind eine Familie', () => {
    const w = W(), a = w.muster('>asir~apN', 'srr');
    return a && a === w.muster('>adil~apN', 'dll') ? true : 'asirra: ' + a + ' · adilla: ' + w.muster('>adil~apN', 'dll');
  });
  fall('M5 Kein Muster ohne Wurzel: weniger als drei Buchstaben, oder die Wurzel steht nicht im Wort', () => {
    const w = W();
    if (w.muster('rijAlN', 'rj') !== null) return 'zwei Wurzelbuchstaben ergeben ein Muster';
    if (w.hole('pluralMuster(' + JSON.stringify(ar('rijAlN')) + ', "")') !== null) return 'eine leere Wurzel ergibt ein Muster';
    return w.muster('rijAlN', 'ktb') === null ? true : 'eine fremde Wurzel ergibt ein Muster';
  });

  fall('P1 „Mann" bekommt zwei Partner, den mit dem höchsten Kasten zuerst — mit Mehrzahl, erster Bedeutung und Kasten', () => {
    const p = W().partner(1);
    return p === JSON.stringify([['16', ar('jibAlN'), 'Berg (zweite Karte)', 7], ['2', ar('kibArN'), 'groß', 5]]) ? true : p;
  });
  fall('P2 Die Reihenfolge folgt SEINEM Kasten: steigt der Hund auf Kasten 6, steht er vor „groß"', () => {
    const p = welt(kern, uebung, { fortschritt: Object.assign({}, BOX, { 3: { box: 6 } }) }).partner(1);
    return JSON.parse(p).map(x => x[0]).join(',') === '16,3' ? true : p;
  });
  fall('P3 Dasselbe Wort auf zwei Karten ist kein Partner, und zwei Karten desselben Worts zählen als EIN Partner', () => {
    const ids = JSON.parse(W().partner(1, 9)).map(x => x[0]);
    if (ids.includes('11')) return 'die zweite Karte „Mann" gilt als Partner von „Mann"';
    return ids.includes('16') && !ids.includes('4') ? true : 'beide Berg-Karten stehen da (oder keine): ' + ids.join(',');
  });
  fall('P4 Eine regelmäßige Mehrzahl hat keinen Partner und ist keiner; ein Zahlwort ebenso; ohne Wurzel gibt es keinen', () => {
    const w = W();
    for (const id of [8, 9, 10, 15, 17]) if (w.partner(id) !== '[]') return 'Karte ' + id + ' bekommt Partner: ' + w.partner(id);
    if (w.muster('sanawAtN', 'snw') !== w.muster('$ajarAtN', '$jr')) return 'sanawāt und shajarāt haben nicht dasselbe Muster — der Fall misst nichts';
    const alle = KARTEN.flatMap(k => JSON.parse(w.partner(k.id, 9)).map(x => x[0]));
    return alle.some(id => ['8', '9', '10', '15', '17'].includes(id)) ? 'eine regelmäßige Karte, ein Zahlwort oder eine Karte ohne Wurzel ist Partner: ' + alle.join(',') : true;
  });
  fall('P5 Zwei Formen auf einer Karte: „Haus" (buyūt / abyāt) hat Partner aus BEIDEN Familien', () => {
    const ids = JSON.parse(W().partner(5, 9)).map(x => x[0]);
    return ids.includes('6') && (ids.includes('7') || ids.includes('14')) ? true : 'Partner von Haus: ' + ids.join(',');
  });
  fall('P6 Ohne uebPluralArt() (die eine Stelle der Einordnung) gibt es keinen Partner und nichts gilt als regelmäßig', () => {
    const w = welt(kern, uebung, { ohneArt: true });
    if (w.partner(1) !== '[]') return 'Partner ohne die Einordnung: ' + w.partner(1);
    return w.hole('pluralRegelmaessig(__KARTEN[7])') === false ? true : 'ohne die Einordnung gilt „Lehrer" als regelmäßig';
  });

  const R = (einst, opt) => rueckseite(kern, lernen, uebung, einst, opt);
  fall('L1 Die Formen stehen IMMER da, auch bei einem alten Stand mit showPlural:false (Elias, 14.10.2026: „plural soll nciht hinter schaltern versteckt sein")', () => {
    const z = R({ showPlural: false });
    return [1, 8, 9, 10].every(id => z(id) !== '') ? true : 'ohne den alten Schalter fehlt die Formen-Zeile';
  });
  fall('L2 Regelmäßige Mehrzahl: die Zeile sagt „Plural · regelmäßig", ohne „Klingt wie"', () => {
    const z = R({ showPlural: true });
    for (const id of [8, 9]){ const h = z(id); if (!h.includes('>Plural · regelmäßig</i>') || h.includes('Klingt wie')) return 'Karte ' + id + ': ' + h; }
    return true;
  });
  fall('L3 Gebrochene Mehrzahl: „Plural" ohne Vermerk — und KEIN „Klingt wie", obwohl die Karte Partner hätte (Elias, 15.10.2026: „dieses klingt wie ist quatsch, das soll raus")', () => {
    const h = R({ showPlural: true })(1);
    if (!h.includes('<i class="lbl">Plural</i>') || h.includes('regelmäßig')) return 'die Plural-Zeile stimmt nicht: ' + h;
    return !/Klingt wie|wf-klang|wf-paar/.test(h) ? true : '„Klingt wie" steht wieder auf der Karte: ' + h;
  });
  fall('L4 Auch ohne Wurzel kein „Klingt wie"; beim Zahlwort bleibt „bei weiblichem Nomen" — ohne „regelmäßig"', () => {
    const z = R({ showPlural: true });
    if (z(15).includes('Klingt wie')) return 'eine Karte ohne Wurzel bekommt „Klingt wie"';
    const h = z(10);
    return h.includes('>bei weiblichem Nomen</i>') && !h.includes('regelmäßig') && !h.includes('Klingt wie') ? true : 'Zahlwort: ' + h;
  });
  fall('L5 Die Mehrzahl selbst wird maskiert (fremder Text im HTML)', () => {
    const karten = KARTEN.map(k => k.id === '1' ? Object.assign({}, k, { pl: '<b>' + k.pl }) : k);
    const h = R({ showPlural: true }, { karten })(1);
    return h.includes('&lt;b&gt;') && !h.includes('<b>') ? true : h;
  });

  const T = (einst, geraet) => tippWelt(kern, lernen, uebung, { einstellungen: einst, fortschritt: TIPP_STAND, karten: TIPP_KARTEN, geraet });
  fall('T1 Bei SEINEN Einstellungen (nur „Ab Box 4 eintippen") steht bei regelmäßiger Mehrzahl das zweite Feld da — ohne eigenen Schalter (Elias, 14.10.2026: „plural soll nciht hinter schaltern versteckt sein")', () => {
    const u = T(SEIN); u.zeige(0);
    if (u.els.cardTippBox.classList.contains('hidden')) return 'das erste Feld fehlt — der Fall misst nichts';
    return u.els.cardTippPlural.classList.contains('hidden') ? 'das zweite Feld fehlt bei seinen Einstellungen' : true;
  });
  fall('T2 Ab Box 4, auf Deutsch gefragt und bei regelmäßiger Mehrzahl steht das zweite Feld da — leer', () => {
    const u = T(BEIDE); u.els.cardTippPlural.value = 'alt';
    u.zeige(0);
    if (u.els.cardTippPlural.classList.contains('hidden')) return 'männlich regelmäßig: kein zweites Feld';
    if (u.els.cardTippPlural.value !== '') return 'im zweiten Feld steht noch der Text des vorigen Worts';
    u.zeige(1);
    return u.els.cardTippPlural.classList.contains('hidden') ? 'weiblich regelmäßig: kein zweites Feld' : true;
  });
  fall('T3 „aber auch nur da wo es regelmässig ist": bei gebrochener Mehrzahl und beim Zahlwort steht das zweite Feld NICHT da', () => {
    const u = T(BEIDE);
    u.zeige(0); u.zeige(2);
    if (u.els.cardTippBox.classList.contains('hidden')) return 'das erste Feld fehlt bei „Mann" — der Fall misst nichts';
    if (!u.els.cardTippPlural.classList.contains('hidden')) return 'gebrochene Mehrzahl: das zweite Feld steht da';
    u.zeige(0); u.zeige(3);
    return u.els.cardTippPlural.classList.contains('hidden') ? true : 'Zahlwort: das zweite Feld steht da';
  });
  fall('T4 Nie ohne das erste Feld: unter Box 4, auf Arabisch gefragt oder ohne „Ab Box 4 eintippen" bleibt der ganze Kasten zu', () => {
    const box3 = tippWelt(kern, lernen, uebung, { einstellungen: BEIDE, fortschritt: { 8: { box: 3 } }, karten: TIPP_KARTEN }); box3.zeige(0);
    if (!box3.els.cardTippBox.classList.contains('hidden')) return 'Box 3 bekommt den Kasten';
    const arDe = T({ direction: 'ar-de', tippenAbBox4: true, tippenPlural: true }); arDe.zeige(0);
    if (!arDe.els.cardTippBox.classList.contains('hidden')) return 'auf Arabisch gefragt: der Kasten steht da';
    const nurPl = T({ direction: 'de-ar', tippenPlural: true }); nurPl.zeige(0);
    return nurPl.els.cardTippBox.classList.contains('hidden') ? true : 'der Mehrzahl-Schalter allein öffnet den Kasten';
  });
  fall('T5 „Richtig" erst, wenn Wort UND Mehrzahl stimmen (ohne Vokalzeichen getippt gilt); sonst sagt die Zeile, was fehlt', () => {
    const u = T(BEIDE); u.zeige(0);
    const beide = u.pruefe(0, ar('mdrs'), ar('mdrswn')), voll = u.pruefe(0, ar('mudar~isN'), ar('mudar~isuwna'));
    if (beide !== 'tipp-antwort richtig | Richtig — umdrehen und einordnen.') return 'beide richtig: ' + beide;
    if (voll !== beide) return 'mit Vokalzeichen: ' + voll;
    const nurWort = u.pruefe(0, ar('mdrs'), ar('mdrsAt')), nurPl = u.pruefe(0, ar('qlm'), ar('mdrswn')), keins = u.pruefe(0, ar('qlm'), ar('ktb'));
    if (nurWort !== 'tipp-antwort falsch | Das Wort stimmt — die Mehrzahl noch nicht.') return 'nur das Wort richtig: ' + nurWort;
    if (nurPl !== 'tipp-antwort falsch | Die Mehrzahl stimmt — das Wort noch nicht.') return 'nur die Mehrzahl richtig: ' + nurPl;
    if (keins !== 'tipp-antwort falsch | Noch nicht.') return 'beides falsch: ' + keins;
    const leer = u.pruefe(0, '  ', ' ');
    return leer === 'tipp-antwort | ' ? true : 'zwei leere Felder bekommen ein Urteil: ' + leer;
  });
  fall('T6 Ein verborgenes zweites Feld zählt nicht: bei „Mann" (gebrochen) entscheidet allein das Wort, auch wenn im Feld noch Text steht', () => {
    const u = T(BEIDE); u.zeige(2);
    const r = u.pruefe(2, ar('rjl'), ar('ktb'));
    return r === 'tipp-antwort richtig | Richtig — umdrehen und einordnen.' ? true : r;
  });
  fall('T7 Die Tablet-Tasten schreiben in das Feld, das zuletzt angetippt war — und nie in ein verborgenes', () => {
    const u = T(BEIDE, TABLET); u.zeige(0);
    const B = String.fromCodePoint(0x628), T2 = String.fromCodePoint(0x62A);
    u.hole('tippTaste("z' + 0x628 + '")');
    if (u.els.cardTippEingabe.value !== B || u.els.cardTippPlural.value !== '') return 'ohne Antippen landet der Buchstabe nicht im ersten Feld';
    u.els.cardTippBox.dataset.ziel = 'cardTippPlural';
    u.hole('tippTaste("z' + 0x62A + '")');
    if (u.els.cardTippPlural.value !== T2 || u.els.cardTippEingabe.value !== B) return 'nach dem Antippen des zweiten Felds schreibt die Taste nicht dorthin';
    u.zeige(2);                                    /* „Mann": zweites Feld verborgen, der Merker steht wieder auf dem ersten */
    u.els.cardTippBox.dataset.ziel = 'cardTippPlural';
    u.hole('tippTaste("z' + 0x628 + '")');
    return u.els.cardTippEingabe.value === B && u.els.cardTippPlural.value === '' ? true : 'eine Taste schreibt in das verborgene zweite Feld';
  });
  fall('T8 Am Tablet bleibt bei BEIDEN Feldern die Gerätetastatur zu (inputmode none) — am Handy trägt keins ein inputmode', () => {
    const tab = T(BEIDE, TABLET); tab.zeige(0);
    if (tab.els.cardTippEingabe.getAttribute('inputmode') !== 'none' || tab.els.cardTippPlural.getAttribute('inputmode') !== 'none') return 'am Tablet fehlt inputmode none an einem der Felder';
    tab.zustand.geraet = HANDY; tab.zeige(0);
    return !tab.els.cardTippEingabe.hasAttribute('inputmode') && !tab.els.cardTippPlural.hasAttribute('inputmode') ? true : 'am Handy bleibt ein inputmode hängen';
  });
  fall('T9 Nach jeder neuen Karte zeigt der Merker wieder auf das erste Feld', () => {
    const u = T(BEIDE, TABLET); u.zeige(0);
    u.els.cardTippBox.dataset.ziel = 'cardTippPlural'; u.zeige(1);
    return u.els.cardTippBox.dataset.ziel === 'cardTippEingabe' ? true : 'der Merker bleibt auf dem zweiten Feld stehen: ' + u.els.cardTippBox.dataset.ziel;
  });

  const H = opt => hoeheWelt(lernen, opt);
  fall('H1 Passt der Tippkasten, bleibt die Karte, wie sie ist (Handy, ein Feld) — ein verborgenes Teil zählt nicht mit', () => {
    const r = H(HOEHE_HANDY);
    if (r.karte !== '' || r.innen !== '') return 'die Karte bekommt eine Höhe, obwohl alles passt: ' + r.karte;
    /* Ein verborgenes Teil meldet im Browser Höhe 0 und Oberkante 0. Zählte es mit, reichte der Inhalt von
       ganz oben (0) bis zur Unterkante des Kastens (379 bei 300 px Inhalt, mittig in 458) — mit Rand 463 > 458. */
    const teile = HOEHE_HANDY.teile.map((t, i) => i === 3 ? Object.assign({}, t, { h: 133 }) : t).concat([{ h: 300, verborgen: true }]);
    const mitVerborgenem = H(Object.assign({}, HOEHE_HANDY, { teile }));
    return mitVerborgenem.karte === '' ? true : 'ein verborgenes Teil macht die Karte höher: ' + mitVerborgenem.karte;
  });
  fall('H2 Reicht die Höhe nicht, bekommt die Karte das Fehlende: ungequetschter Inhalt + zweimal der größte Rand (Tablet, zwei Felder: 749 px)', () => {
    const r = H(HOEHE_TABLET);
    return r.karte === '749px' && r.innen === '749px' ? true : 'Karte ' + (r.karte || 'leer') + ' · innen ' + (r.innen || 'leer') + ' (erwartet 749px: 659 + 2 × 44 + 2 Rahmen)';
  });
  fall('H3 Zuerst wird zurückgesetzt: ohne Tippkasten verliert die Karte die Höhe ihrer Vorgängerin, und mit Kasten wird neu gemessen', () => {
    const ohne = H(Object.assign({}, HOEHE_TABLET, { karteVorher: '749px', kastenZu: true }));
    if (ohne.karte !== '' || ohne.innen !== '') return 'ohne Kasten bleibt die alte Höhe stehen: ' + ohne.karte;
    const neu = H(Object.assign({}, HOEHE_TABLET, { karteVorher: '900px' }));
    return neu.karte === '749px' ? true : 'nach einer höheren Karte wird nicht neu gemessen: ' + neu.karte;
  });
  fall('H4 Der Rand ist der GRÖSSTE aus Polster, Marken (oben) und Hinweis (unten)', () => {
    const polster = H({ basis: 300, polster: 60, teile: [MARKEN, { h: 77 }, { h: 200, abstand: 18 }, HINWEIS] });
    if (polster.karte !== '417px') return 'Polster 60: ' + (polster.karte || 'leer') + ' (erwartet 417px: 295 + 2 × 60 + 2)';
    const hinweis = H({ basis: 300, polster: 28, teile: [MARKEN, { h: 77 }, { h: 200, abstand: 18 }, { fest: true, unten: 70, h: 15 }] });
    return hinweis.karte === '437px' ? true : 'Hinweis 70 px über dem Rand: ' + (hinweis.karte || 'leer') + ' (erwartet 437px: 295 + 2 × 70 + 2)';
  });
  fall('H5 Nach der Messung dürfen die Teile wieder schrumpfen wie vorher (flex-shrink zurückgestellt)', () => {
    const teile = HOEHE_TABLET.teile.map((t, i) => i === 3 ? Object.assign({}, t, { vorher: '1' }) : t);
    const r = H(Object.assign({}, HOEHE_TABLET, { teile }));
    /* fünf Teile, mit „|" verbunden: vier ohne eigene Angabe (leer), das vierte trug vorher „1" */
    return r.schrumpf === '|||1|' ? true : 'flex-shrink der Teile danach: ' + r.schrumpf;
  });
  fall('H6 renderTippfeld() ruft die Höhenregel in BEIDEN Zweigen (mit Kasten erst NACH den Tasten), und „Überspringen" ruft sie auch', () => {
    const mit = tippWelt(kern, lernen, uebung, { einstellungen: BEIDE, fortschritt: TIPP_STAND, karten: TIPP_KARTEN, zaehleHoehe: true });
    mit.zeige(0);
    if (mit.els.cardTippBox.classList.contains('hidden')) return 'der Kasten fehlt — der Fall misst nichts';
    if (mit.hole('__hoehe') !== 1) return 'mit Kasten: ' + mit.hole('__hoehe') + ' Aufrufe statt 1';
    const ohne = tippWelt(kern, lernen, uebung, { einstellungen: BEIDE, fortschritt: { 8: { box: 3 } }, karten: TIPP_KARTEN, zaehleHoehe: true });
    ohne.zeige(0);
    if (ohne.hole('__hoehe') !== 1) return 'ohne Kasten (Box 3): ' + ohne.hole('__hoehe') + ' Aufrufe statt 1';
    const fn = schneideFunktion(lernen, 'function renderTippfeld(');
    if (!(fn.indexOf('zeigeTippTasten();') >= 0 && fn.lastIndexOf('tippKarteHoehe();') > fn.indexOf('zeigeTippTasten();'))) return 'die Höhe wird vor den Tasten gemessen';
    const a = lernen.indexOf("document.getElementById('btnTippUeberspringen').addEventListener('click'"), b = lernen.indexOf('});', a);
    return a >= 0 && b > a && lernen.slice(a, b).includes('tippKarteHoehe();') ? true : '„Überspringen" setzt die Höhe nicht zurück';
  });
  return erg;
}

let rot = 0;
const sag = (ok, text) => { if (!ok) rot++; console.log((ok ? '  ok   ' : '  FEHL ') + text); };

console.log('=== Mehrzahl auf der Lernkarte: Muster, Partner, Rückseite, zweites Tippfeld ===');
const erg = laufe(KERN, LERNEN, UEBUNG);
for (const [name, e] of erg) sag(e.ok, name + (e.zusatz ? '  -> ' + e.zusatz : ''));

console.log('\n=== V  Verdrahtung ===');
{
  const ohneKomm = q => q.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');
  const h = ohneKomm(HTML), e = ohneKomm(EINST), l = ohneKomm(LERNEN), k = ohneKomm(KERN);
  const kasten = h.slice(h.indexOf('id="cardTippBox"'), h.indexOf('id="btnTippUeberspringen"'));
  const feld = (kasten.match(/<input[^>]*id="cardTippPlural"[^>]*>/) || [''])[0];
  sag(!!feld, 'index.html: das zweite Feld steht im Tippkasten');
  sag(/class="[^"]*\bhidden\b[^"]*"/.test(feld), 'index.html: das zweite Feld ist von Anfang an verborgen');
  sag(/lang="ar"/.test(feld) && /dir="rtl"/.test(feld) && /placeholder="Mehrzahl /.test(feld), 'index.html: das zweite Feld ist arabisch, rtl und sein Hinweistext beginnt mit „Mehrzahl"');
  /* Gemessen am 13.10.2026 in der Seitenprobe (375 px Fensterbreite, Feld innen 227 px, Schrift 20 px):
     „Mehrzahl auf Arabisch eintippen …" (33 Zeichen, 329 px) wurde links abgeschnitten, und beide Felder
     zeigten nur noch „… auf Arabisch eintippen". „Mehrzahl eintippen …" (20 Zeichen) braucht 204 px. */
  const hinweis = (feld.match(/placeholder="([^"]*)"/) || ['', ''])[1];
  sag(hinweis.length > 0 && hinweis.length <= 20, 'index.html: der Hinweistext des zweiten Felds ist höchstens 20 Zeichen lang (ein längerer wird am Handy abgeschnitten, dann sehen beide Felder gleich aus)  -> ' + hinweis.length + ' Zeichen');
  sag(!!feld && !feld.includes('inputmode'), 'index.html: das zweite Feld trägt kein festes inputmode (sonst ginge am Handy seine Tastatur nicht auf)');
  sag(!h.includes('id="toggleTippenPlural"') && !h.includes('id="toggleShowPlural"'), 'index.html: kein Schalter mehr für „Pluralformen anzeigen" und „Mehrzahl mit eintippen" (Elias, 14.10.2026: „plural soll nciht hinter schaltern versteckt sein")');
  sag(!/SETTINGS\.(showPlural|tippenPlural)/.test(e + l), 'js/einstellungen.js und js/lernen.js lesen weder SETTINGS.showPlural noch SETTINGS.tippenPlural');
  const vorgabe = (k.match(/\{ pluralKarten:[^\n]*\}/) || [''])[0];
  sag(!!vorgabe && !/showPlural|tippenPlural|pluralFern/.test(vorgabe) && !/tippenAbBox4/.test(vorgabe), 'js/kern.js: die Vorgabe kennt keinen Plural-Schalter außer „Plural als eigene Karten", und kein Tipp-Schalter ist an');
  sag(l.includes("f.addEventListener('focus', merke);") && l.includes('kasten.dataset.ziel = id;'), 'js/lernen.js: ein Antippen merkt sich das Feld für die Tablet-Tasten');
  sag(l.includes("pl.addEventListener('click', (e)=>e.stopPropagation());") && l.includes("pl.addEventListener('pointerdown', (e)=>e.stopPropagation());"), 'js/lernen.js: ein Tippen ins zweite Feld dreht die Karte nicht um');
  sag(l.includes("typeof pluralRegelmaessig === 'function' && pluralRegelmaessig(w)") && !/function uebPluralArt\(/.test(l + k), 'die Einordnung regelmäßig/gebrochen steht nur in js/uebung.js — Lernkarte und Kern fragen dort');
}

console.log('\n=== R  Seine echten Karten (Auswahl aus .stand-app.json) ===');
{
  const standDatei = path.join(HIER, '.stand-app.json');
  const buchDateien = fs.existsSync(path.join(HIER, 'data')) ? fs.readdirSync(path.join(HIER, 'data')).filter(f => /^vokabeln-.*\.js$/.test(f)) : [];
  if (!fs.existsSync(standDatei) || !buchDateien.length) sag(false, 'nicht messbar: .stand-app.json oder die Buchdateien fehlen');
  else {
    const auswahl = JSON.parse(fs.readFileSync(standDatei, 'utf8')).buecher || {};
    const ctx = { window: { VOKABELN: {} }, console: { log(){}, warn(){}, error(){} } };
    ctx.globalThis = ctx;
    vm.createContext(ctx);
    for (const f of ['vocab-data.js', ...buchDateien.map(f => 'data/' + f)]) vm.runInContext(lies(f), ctx, { filename: f });
    const VD = [...(vm.runInContext('typeof VOCAB_DATA !== "undefined" ? VOCAB_DATA : []', ctx))];
    const da = new Set(VD.map(w => String(w.id)));
    const mW = KERN.match(/const FREISCHALTEN_AUF_WUNSCH\s*=\s*\[([^\]]*)\]/);
    const aufWunsch = new Set(mW ? (mW[1].match(/'[^']+'|"[^"]+"/g) || []).map(s => s.slice(1, -1)) : []);
    for (const [buch, liste] of Object.entries(ctx.window.VOKABELN || {})){
      const kap = (auswahl[buch] || []).map(Number);
      for (const w of liste) if ((kap.includes(Number(w.chapter)) || aufWunsch.has(String(w.id))) && !da.has(String(w.id))){ VD.push(w); da.add(String(w.id)); }
    }
    const w = welt(KERN, UEBUNG, { karten: VD.map(k => ({ id: String(k.id), de: k.de, ar: k.ar, sg: k.sg, pl: k.pl, root: k.root, type: k.type })), fortschritt: {} });
    const m = JSON.parse(w.hole(`JSON.stringify((() => {
      const mit = __KARTEN.filter(k => k.pl && !istZahlwort(k));
      const regel = mit.filter(pluralRegelmaessig), rest = mit.filter(k => !pluralRegelmaessig(k));
      const wort = k => plNackt(k.sg || k.ar).replace(PL_ARTIKEL, '');
      let mitPartner = 0, verstoss = [], familien = new Set();
      for (const k of rest){
        for (const f of formen(k.pl)){ const mu = pluralMuster(f, k.root); if (mu) familien.add(mu); }
        const p = pluralKlangPartner(k, 2);
        if (p.length) mitPartner++;
        if (p.length > 2) verstoss.push(k.id + ': mehr als zwei');
        const eigene = formen(k.pl).map(f => pluralMuster(f, k.root)).filter(Boolean);
        for (const t of p){
          if (pluralRegelmaessig(t.karte) || istZahlwort(t.karte)) verstoss.push(k.id + ': Partner ' + t.karte.id + ' ist regelmäßig oder ein Zahlwort');
          if (wort(t.karte) === wort(k)) verstoss.push(k.id + ': Partner ' + t.karte.id + ' ist dasselbe Wort');
          if (!eigene.includes(pluralMuster(t.form, t.karte.root))) verstoss.push(k.id + ': Partner ' + t.karte.id + ' hat ein anderes Muster');
        }
      }
      return { mit: mit.length, regel: regel.length, rest: rest.length, mitPartner, familien: familien.size,
        regelMitPartner: regel.filter(k => pluralKlangPartner(k, 2).length).length, verstoss };
    })())`));
    console.log('  gemessen: ' + m.mit + ' Karten mit Mehrzahl (ohne Zahlwörter) · ' + m.regel + ' regelmäßig · ' + m.rest + ' andere, davon ' + m.mitPartner
      + ' mit Klang-Partner, ' + (m.rest - m.mitPartner) + ' ohne · ' + m.familien + ' Muster');
    sag(m.mit >= 100, 'in seiner Auswahl stehen mindestens 100 Karten mit Mehrzahl (sonst hat das Laden nicht geklappt): ' + m.mit);
    sag(m.regel >= 20, 'mindestens 20 davon sind regelmäßig — das zweite Tippfeld und der Vermerk haben Stoff: ' + m.regel);
    /* Angezeigt wird der Partner seit 15.10.2026 nicht mehr; er ist das Maß für Teil C von werkzeuge/pruefe-plural.mjs. */
    sag(m.mitPartner >= 60, 'mindestens 60 nicht regelmäßige Karten haben einen Klang-Partner — das Maß von pruefe-plural.mjs (Teil C) hat Stoff: ' + m.mitPartner);
    sag(m.regelMitPartner === 0, 'keine regelmäßige Karte bekommt einen Partner');
    sag(m.verstoss.length === 0, 'jeder Partner hat dasselbe Muster, ist ein anderes Wort und weder regelmäßig noch Zahlwort' + (m.verstoss.length ? ' — ' + m.verstoss.slice(0, 4).join(' · ') : ''));
  }
}

/* ---------- Störtests ---------- */
function ersetze(quelle, alt, neu, wo){
  const n = quelle.split(alt).length - 1;
  if (n !== 1) throw new Error('Störtest „' + wo + '": die Stelle kommt ' + n + '-mal vor (erwartet 1) — der Quelltext hat sich geändert');
  return quelle.replace(alt, () => neu);
}
const STOER = [
  { name: 'S1 nichts gilt mehr als regelmäßig', muss: ['L2', 'T2', 'P4'],
    kern: q => ersetze(q, "  return art === 'm' || art === 'f';", '  return false;', 'S1') },
  { name: 'S2 die Kasusendung bleibt im Muster', muss: ['M2'],
    kern: q => ersetze(q, "return ri === r.length ? aus.replace(PL_ENDUNG, '') : null;", 'return ri === r.length ? aus : null;', 'S2') },
  { name: 'S3 ein schwacher Wurzelbuchstabe hat keinen Stellvertreter mehr', muss: ['M3'],
    kern: q => ersetze(q, '(PL_SCHWACH.includes(w) && (PL_SCHWACH.includes(c) || PL_HAMZA.includes(c))', '(false && (PL_SCHWACH.includes(c) || PL_HAMZA.includes(c))', 'S3') },
  { name: 'S4 die Vorsilbe gilt als Wurzelbuchstabe (awlād)', muss: ['M3'],
    kern: q => ersetze(q, '            && !stehtSpaeter(i + 1, w, ri) && restFolgt(i + 1, ri + 1)))){', '            && restFolgt(i + 1, ri + 1)))){', 'S4') },
  { name: 'S5 das Schadda zählt nicht mehr doppelt', muss: ['M4'],
    kern: q => ersetze(q, 'if (schadda && ri + 1 < r.length && r[ri + 1] === w){', 'if (false){', 'S5') },
  { name: 'S6 die Partner stehen nicht mehr nach Kasten', muss: ['P1', 'P2'],
    kern: q => ersetze(q, '  treffer.sort((a, b) => b.box - a.box);', '', 'S6') },
  { name: 'S7 dasselbe Wort auf einer zweiten Karte gilt als Partner', muss: ['P3'],
    kern: q => ersetze(q, '    if (gesehen.has(g)) continue;', '', 'S7') },
  { name: 'S8 regelmäßige Karten werden Partner', muss: ['P4'],
    kern: q => ersetze(q, ' || istPluralKarte(k.id) || pluralRegelmaessig(k)) continue;', ' || istPluralKarte(k.id)) continue;', 'S8') },
  { name: 'S9 Partner auch ohne die eine Stelle der Einordnung', muss: ['P6'],
    kern: q => ersetze(q, "  if (typeof uebPluralArt !== 'function') return [];", '', 'S9') },
  { name: 'S10 die Rückseite zeigt die Zeilen nur noch mit dem alten Schalter', muss: ['L1'],
    lernen: q => ersetze(q, "  let forms = [];\n  {", "  let forms = [];\n  if (SETTINGS.showPlural){", 'S10') },
  { name: 'S11 der Vermerk „regelmäßig" fehlt', muss: ['L2'],
    lernen: q => ersetze(q, "+ (plRegel ? ' · regelmäßig' : '')", "+ ''", 'S11') },
  { name: 'S12 die Mehrzahl geht unmaskiert ins HTML', muss: ['L5'],
    lernen: q => ersetze(q, '<span class="wf-ar">${escapeHtml(f.value)}</span>', '<span class="wf-ar">${f.value}</span>', 'S12') },
  { name: 'S32 die Zeile „Klingt wie" kommt auf die Karte zurück', muss: ['L3'],
    lernen: q => ersetze(q, "  ).join('');\n\n  renderVerbFormen(w);", "  ).join('') + '<span class=\"wf-klang\"><i class=\"lbl\">Klingt wie</i></span>';\n\n  renderVerbFormen(w);", 'S32') },
  { name: 'S13 das zweite Feld nur noch mit einem Schalter', muss: ['T1'],
    lernen: q => ersetze(q, '  return !!(w && w.pl && ', '  return !!(SETTINGS.tippenPlural && w && w.pl && ', 'S13') },
  { name: 'S14 das zweite Feld auch bei gebrochener Mehrzahl', muss: ['T3', 'T6'],
    lernen: q => ersetze(q, "w.pl && typeof pluralRegelmaessig === 'function' && pluralRegelmaessig(w));", 'w.pl);', 'S14') },
  { name: 'S15 „richtig", sobald das Wort stimmt', muss: ['T5'],
    lernen: q => ersetze(q, "    feld.className = 'tipp-antwort ' + (richtig && plRichtig ? 'richtig' : 'falsch');", "    feld.className = 'tipp-antwort ' + (richtig ? 'richtig' : 'falsch');", 'S15') },
  { name: 'S16 das zweite Feld wird beim neuen Wort nicht geleert', muss: ['T2'],
    lernen: q => ersetze(q, "    plFeld.value = '';\n", '', 'S16') },
  { name: 'S17 die Tablet-Tasten schreiben immer ins erste Feld', muss: ['T7'],
    lernen: q => ersetze(q, "  const ein = (gemerkt && !gemerkt.classList.contains('hidden')) ? gemerkt : document.getElementById('cardTippEingabe');", "  const ein = document.getElementById('cardTippEingabe');", 'S17') },
  { name: 'S18 die Tablet-Tasten schreiben auch in ein verborgenes Feld', muss: ['T7'],
    lernen: q => ersetze(q, "(gemerkt && !gemerkt.classList.contains('hidden')) ? gemerkt", '(gemerkt) ? gemerkt', 'S18') },
  { name: 'S19 das zweite Feld am Tablet ohne inputmode', muss: ['T8'],
    lernen: q => ersetze(q, "if (an) pl.setAttribute('inputmode', 'none'); else", 'if (false) pl.setAttribute(\'inputmode\', \'none\'); else', 'S19') },
  { name: 'S20 der Merker bleibt nach dem Kartenwechsel stehen', muss: ['T9'],
    lernen: q => ersetze(q, "  if (kasten.dataset) kasten.dataset.ziel = 'cardTippEingabe';", '', 'S20') },
  { name: 'S21 die Kartenhöhe wird nicht zurückgesetzt', muss: ['H3'],
    lernen: q => ersetze(q, "  setze('');\n", '', 'S21') },
  { name: 'S22 gemessen wird das Gequetschte', muss: ['H2'],
    lernen: q => ersetze(q, "  for (const k of fluss) k.style.flexShrink = '0';\n", '', 'S22') },
  { name: 'S23 der Rand zählt nur einmal statt oben und unten', muss: ['H2', 'H4'],
    lernen: q => ersetze(q, 'const gebraucht = Math.ceil(unten - oben + 2 * rand);', 'const gebraucht = Math.ceil(unten - oben + rand);', 'S23') },
  { name: 'S24 der Platz der Marken zählt nicht als Rand', muss: ['H2'],
    lernen: q => ersetze(q, '    if (u <= hoehe / 2) rand = Math.max(rand, u);', '    if (false) rand = Math.max(rand, u);', 'S24') },
  { name: 'S25 der Platz des Hinweises zählt nicht als Rand', muss: ['H4'],
    lernen: q => ersetze(q, '    else if (o >= hoehe / 2) rand = Math.max(rand, hoehe - o);', '', 'S25') },
  { name: 'S26 das Polster der Seite zählt nicht als Rand', muss: ['H4'],
    lernen: q => ersetze(q, '  rand = Math.max(rand, parseFloat(stil.paddingTop) || 0, parseFloat(stil.paddingBottom) || 0);', '', 'S26') },
  { name: 'S27 die Teile bleiben nach der Messung unschrumpfbar', muss: ['H5'],
    lernen: q => ersetze(q, '  fluss.forEach((k, i) => { k.style.flexShrink = geschrumpft[i]; });\n', '', 'S27') },
  { name: 'S28 ohne Tippkasten ruft renderTippfeld() die Höhenregel nicht', muss: ['H6'],
    lernen: q => ersetze(q, "if (!dran){ kasten.classList.add('hidden'); if (typeof tippKarteHoehe === 'function') tippKarteHoehe(); return; }", "if (!dran){ kasten.classList.add('hidden'); return; }", 'S28') },
  { name: 'S29 mit Tippkasten ruft renderTippfeld() die Höhenregel nicht', muss: ['H6'],
    lernen: q => ersetze(q, "  /* Erst NACH den Tasten: sie machen den Kasten höher (tippKarteHoehe() oben). */\n  if (typeof tippKarteHoehe === 'function') tippKarteHoehe();\n", '', 'S29') },
  { name: 'S30 „Überspringen" lässt die Mehrhöhe stehen', muss: ['H6'],
    lernen: q => ersetze(q, "  /* Ohne Kasten braucht die Karte ihre Mehrhöhe nicht mehr (tippKarteHoehe() setzt sie zurück). */\n  if (typeof tippKarteHoehe === 'function') tippKarteHoehe();\n", '', 'S30') },
  { name: 'S31 ein verborgenes Teil zählt zur Höhe', muss: ['H1'],
    lernen: q => ersetze(q, '  const sichtbar = [...vorn.children].filter(k => k.offsetHeight);', '  const sichtbar = [...vorn.children];', 'S31') },
];
console.log('\n=== S  Störtests: ohne die Regel MUSS der zuständige Fall scheitern ===');
for (const s of STOER){
  let e;
  try { e = laufe(s.kern ? s.kern(KERN) : KERN, s.lernen ? s.lernen(LERNEN) : LERNEN, UEBUNG); }
  catch (err){ rot++; console.log('  FEHL ' + s.name + '  -> ' + err.message); continue; }
  const gescheitert = [...e].filter(([, v]) => !v.ok).map(([n]) => n.split(' ')[0]);
  const fehlt = s.muss.filter(k => !gescheitert.includes(k));
  if (fehlt.length){ rot++; console.log('  FEHL ' + s.name + '  -> ' + fehlt.join(', ') + ' blieb grün (gescheitert: ' + (gescheitert.join(', ') || 'nichts') + ')'); }
  else console.log('  ok   ' + s.name + '  -> scheitert wie verlangt: ' + gescheitert.join(', '));
}

console.log('\n' + (rot ? '⛔ ' + rot + ' Befund(e).' : '✅ Mehrzahl auf der Lernkarte: ' + erg.size + ' Fälle, ' + STOER.length + ' Störtests, Verdrahtung und seine echten Karten in Ordnung.'));
process.exit(rot ? 1 : 0);
