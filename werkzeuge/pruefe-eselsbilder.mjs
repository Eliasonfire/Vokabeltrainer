#!/usr/bin/env node
/* pruefe-eselsbilder.mjs — das Bild an der Eselsbrücke: nur auf der Rückseite,
 * nur aus erlaubten Bausteinen, und keine zwei Zeichnungen, die sich zu ähnlich sind.
 *
 * ⭐ WOZU. Seit dem 23.09.2026 steht an der Eselsbrücke ein Bild: bei 72 Wörtern
 * ein Emoji, bei 14 Beziehungswörtern eine kleine Zeichnung (data/eselsbilder.js,
 * gefüllt von renderEselsbild() in js/lernen.js). Alles hier kann STILL kaputtgehen:
 * das Element rutscht beim Umbauen auf die Vorderseite und verrät die Antwort, eine
 * Zeichnung bekommt eine feste Farbe und verschwindet im Dunkelmodus, eine neue
 * Zeichnung ist die alte mit verschobener Katze — und nichts meldet sich.
 *
 * ⛔ ELIAS' SÄTZE, die dieser Prüfer bewacht (wörtlich, Tippfehler inklusive):
 *
 *   1. 23.09.2026, 02:08: „Eselsbrücken-Bild: C · Mischung · die 72 + die 14
 *      Beziehungswörter · nur Rückseite"
 *
 *   2. gleich danach: „mir ist aber auch wichtig, dass wenn du zeichnungen hast wie
 *      oben oder unten das du nicht einfach zwei mal die gleiche zeichnung nimmst und
 *      einmal die katze hoch und einmal unters bett packst weil dann sehen die sich
 *      viellll zu ähnlich aus. sie sollen immer ein bisschen anders sein damit ich sie
 *      mir besser eingrägen kann. sie müssen nicht extrem anders sein aber ein
 *      bisschen reicht schon"
 *
 * WAS GEPRÜFT WIRD
 *   A. Mengen: genau 72 Emoji, genau 14 Zeichnungen, und zwar genau die 14
 *      Beziehungswörter (ZEICHNUNG_SOLL unten); keine Kennung in beiden Listen;
 *      jede Kennung steht in vocab-data.js; jedes Emoji ist nicht leer, ohne
 *      lateinische Buchstaben und enthält ein Bildzeichen.
 *   B. Nur Rückseite: genau ein id="cardEselsbild" in index.html, nach
 *      flashcard-back und vor cardSentenceBox, nicht zwischen flashcard-front und
 *      flashcard-back (HTML-Kommentare, <script>- und <style>-Inhalt zählen nicht).
 *      In js/*.js stehen ESELSBILD_EMOJI, ESELSBILD_ZEICHNUNG und cardEselsbild nur
 *      in js/lernen.js und dort nur in renderEselsbild(); renderEselsbild( wird
 *      außerhalb der eigenen Definition genau einmal aufgerufen, in renderCard().
 *      Gezählt wird OHNE Kommentare (werkzeuge/js-quelltext.mjs, das Zeichenketten
 *      und Regex-Literale kennt). Zusätzlich: renderEselsbild() greift auf kein
 *      anderes Element zu, und data/eselsbilder.js wird geladen (index.html) und
 *      offline vorgehalten (ASSETS in sw.js) — sonst fehlt das Bild ganz.
 *   C. Bausteine: nur path rect circle ellipse line text g; nur die Attribute und
 *      Klassen aus den Listen unten; Pfadbefehle nur M L H V C Q A Z (groß); kein
 *      fill=, stroke=, style=, <script, on…=, href, <foreignObject; jedes Element
 *      trägt eine Farbklasse (selbst oder über sein g), und jede benutzte Klasse hat
 *      eine Regel im CSS von index.html; kein arabisches Zeichen außer über
 *      {{ar:<kennung>}}, jeder Platzhalter zeigt auf eine vorhandene Kennung und
 *      steht nur im Text eines <text>; viewBox hat vier Zahlen; text ist nicht leer.
 *   D. SEINE Regel (Satz 2): jedes der 91 Paare wird über den BAUPLAN verglichen,
 *      unabhängig von Lage und Farbe. Je Element eine Signatur aus Name und Größe:
 *      rect Breite×Höhe · circle r · ellipse rx×ry · line Länge · path die Folge der
 *      Befehlsbuchstaben + Breite×Höhe seines Umrisses (H nur x, V nur y, A nur der
 *      Endpunkt) · text der Text selbst · g zählt nicht, seine Kinder schon. ALLE
 *      Größen auf Vielfache von 4 gerundet (bei path vorgegeben, bei den übrigen
 *      genauso, damit ein Millimeter keine neue Zeichnung macht). Ähnlichkeit =
 *      Jaccard über die Signatur-Multimengen; ab 0,5 rot. `transform` verschiebt
 *      nur, die Signaturen bleiben gleich — das ist gewollt.
 *   F. Beispielsatz: jede Zeichnung zeigt den Satz ihrer Karte (sentDe). Ändert er
 *      sich, passt die Zeichnung vielleicht nicht mehr. SATZ_BEIM_ZEICHNEN hält die
 *      14 Sätze vom 23.09.2026 fest (einmal aus vocab-data.js geholt).
 *
 * E. STÖRTESTS — bei JEDEM Lauf, nur an Kopien im Speicher, nie an den Dateien:
 *   (1) cardEselsbild auf die Vorderseite verschoben
 *   (2) eine 15. Zeichnung = „unter" (45828) mit den roten Katzen-Elementen
 *       (eb-r/eb-rl) um 40 nach oben verschoben → Ähnlichkeit ≥ 0,5
 *   (3) Onkel 45829 mit vertauschten Klassen (eb-r ↔ eb-m) statt 45835
 *   (4) ein Emoji weniger   (5) fill="#fff" in einer Zeichnung
 *   (6) ein arabisches Wort direkt in einer Zeichnung
 *   (7) ein veränderter Beispielsatz (Prüfung F)
 *   Jeder muss ROT werden. Bleibt einer grün, ist der ganze Prüfer rot: dann sieht
 *   die Prüfung ihren eigenen Fall nicht. [[stoertest_muss_wirkung_nachweisen]]
 *
 * Aufruf:  node werkzeuge/pruefe-eselsbilder.mjs
 *          zum Ausprobieren an eigenen Dateien:
 *          --daten <datei> --index <datei> --js <ordner> --vokabeln <datei> --sw <datei>
 * Exitcode 0 = alles in Ordnung · 1 = ein Befund, oder ein Störtest blieb grün
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { ohneKommentareUndTexte } from './js-quelltext.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pfad = (schalter, vorgabe) => {
  const i = process.argv.indexOf(schalter);
  return i > 1 && process.argv[i + 1] ? path.resolve(process.argv[i + 1]) : path.join(REPO, vorgabe);
};
const P = {
  daten: pfad('--daten', 'data/eselsbilder.js'),
  index: pfad('--index', 'index.html'),
  js: pfad('--js', 'js'),
  vokabeln: pfad('--vokabeln', 'vocab-data.js'),
  sw: pfad('--sw', 'sw.js'),
};

/* ---------- Was bestellt ist ---------- */
const EMOJI_ANZAHL = 72;
const ZEICHNUNG_SOLL = {
  '45811': 'auf', '45812': 'in', '45828': 'unter', '45808': 'von/aus', '45809': 'nach/zu',
  '45834': 'hier', '45836': 'dort', '45793': 'nah', '45794': 'fern', '45861': 'Osten',
  '45850': 'Westen', '45829': 'Onkel väterlicherseits', '45835': 'Onkel mütterlicherseits',
  '45789': 'sitzend',
};
/* Die Paare, die sich am ehesten gleichen DÜRFTEN — genau die meint Satz 2. */
const GEGENPAARE = [
  ['45811', '45828'], ['45812', '45828'], ['45811', '45812'], ['45808', '45809'],
  ['45834', '45836'], ['45793', '45794'], ['45861', '45850'], ['45829', '45835'],
];
/* F: die 14 Beispielsätze, wie sie beim Zeichnen waren (23.09.2026, einmal aus
   vocab-data.js geholt). Wer einen davon ändert, sieht die Zeichnung an und zieht
   DIESE Tabelle danach nach — nicht umgekehrt. */
const SATZ_BEIM_ZEICHNEN = {
  '45811': 'Der Stift ist auf dem Schreibtisch.',
  '45812': 'Das Buch ist in der Tasche.',
  '45828': 'Die Katze ist unter dem Bett.',
  '45808': 'Der Student ist aus Japan.',
  '45809': 'Vom Haus zur Universität.',
  '45834': 'Der Lehrer ist jetzt hier.',
  '45836': 'Die Bibliothek ist dort.',
  '45793': 'Die Schule ist nahe am Haus.',
  '45794': 'Die Universität ist weit vom Haus entfernt.',
  '45861': 'Die Moschee ist im Osten.',
  '45850': 'Das Haus ist im Westen.',
  '45829': 'Dies ist der Onkel des Jungen (väterlicherseits).',
  '45835': 'Dies ist der Onkel des Mädchens (mütterlicherseits).',
  '45789': 'Der Student sitzt auf dem Stuhl.',
};
const ELEMENTE = new Set(['path', 'rect', 'circle', 'ellipse', 'line', 'text', 'g']);
const ATTRIBUTE = new Set(['class', 'd', 'x', 'y', 'width', 'height', 'rx', 'ry', 'cx', 'cy', 'r',
  'x1', 'y1', 'x2', 'y2', 'transform', 'text-anchor']);
const NUMERISCH = new Set(['x', 'y', 'width', 'height', 'rx', 'ry', 'cx', 'cy', 'r', 'x1', 'y1', 'x2', 'y2']);
const KLASSEN = new Set(['eb-g', 'eb-d', 'eb-dl', 'eb-m', 'eb-ml', 'eb-r', 'eb-rl', 'eb-rf',
  'eb-strich', 'eb-t', 'eb-tr', 'eb-ar']);
/* ⛔ Als \u-Folgen, nie sichtbar kopiert. [[zeichenklasse_nie_sichtbar_kopieren]] */
const ARABISCH = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
/* Bildzeichen: Piktogramme, Flaggen (Regionalbuchstaben) und Tastenkappen (1️⃣). */
const EMOJI_KERN = /[\p{Extended_Pictographic}\p{Regional_Indicator}\u20E3]/u;
const ZAHL = /^\s*-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?\s*$/;
const SCHWELLE = 0.5;
const r4 = v => Math.round(v / 4) * 4 + 0;
const wer = k => k + (ZEICHNUNG_SOLL[k] ? ' (' + ZEICHNUNG_SOLL[k] + ')' : '');

/* ---------- Laden ---------- */
/* ⛔ `const` landet in einem vm-Kontext NICHT am globalen Objekt — geholt wird
   es ausdrücklich per runInContext. JSON macht daraus gewöhnliche Objekte. */
function ladeBilder(text) {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(text, ctx, { filename: 'eselsbilder.js' });
  return JSON.parse(vm.runInContext('JSON.stringify({'
    + ' E: typeof ESELSBILD_EMOJI === "undefined" ? null : ESELSBILD_EMOJI,'
    + ' Z: typeof ESELSBILD_ZEICHNUNG === "undefined" ? null : ESELSBILD_ZEICHNUNG })', ctx));
}
function ladeVokabeln(text) {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(text, ctx, { filename: 'vocab-data.js' });
  const liste = JSON.parse(vm.runInContext(
    'JSON.stringify(VOCAB_DATA.map(v => ({ id: String(v.id), sentDe: v.sentDe == null ? null : String(v.sentDe) })))', ctx));
  return new Map(liste.map(v => [v.id, v]));
}

/* ---------- A. Mengen ---------- */
function pruefeMengen(E, Z, vok) {
  const r = [];
  const eK = E ? Object.keys(E) : [], zK = Z ? Object.keys(Z) : [];
  r.push([!!E && !!Z, 'ESELSBILD_EMOJI und ESELSBILD_ZEICHNUNG sind definiert']);
  r.push([eK.length === EMOJI_ANZAHL, `genau ${EMOJI_ANZAHL} Emoji (ist: ${eK.length})`]);
  r.push([zK.length === 14, `genau 14 Zeichnungen (ist: ${zK.length})`]);
  const fehlt = Object.keys(ZEICHNUNG_SOLL).filter(k => !zK.includes(k));
  const fremd = zK.filter(k => !(k in ZEICHNUNG_SOLL));
  r.push([!fehlt.length && !fremd.length, 'die Zeichnungen sind genau die 14 Beziehungswörter'
    + (fehlt.length ? ' — es fehlt: ' + fehlt.map(wer).join(', ') : '')
    + (fremd.length ? ' — nicht bestellt: ' + fremd.join(', ') : '')]);
  const beide = eK.filter(k => zK.includes(k));
  r.push([!beide.length, 'keine Kennung hat Emoji UND Zeichnung' + (beide.length ? ' — beide: ' + beide.join(', ') : '')]);
  const unbekannt = [...eK, ...zK].filter(k => !vok.has(k));
  r.push([!unbekannt.length, 'jede Kennung steht in vocab-data.js' + (unbekannt.length ? ' — unbekannt: ' + unbekannt.join(', ') : '')]);
  const schlecht = eK.filter(k => {
    const v = E[k];
    return typeof v !== 'string' || !v.trim() || /\p{Script=Latin}/u.test(v) || !EMOJI_KERN.test(v);
  });
  r.push([!schlecht.length, 'jedes Emoji ist ein Bild (nicht leer, keine lateinischen Buchstaben)'
    + (schlecht.length ? ' — auffällig: ' + schlecht.map(k => k + '=' + JSON.stringify(E[k])).join(', ') : '')]);
  return r;
}

/* ---------- B. Nur Rückseite ---------- */
const leer = s => s.replace(/[^\n]/g, ' ');
/* Längentreu: Kommentare und Skript-/Stilinhalt werden zu Leerzeichen, die
   Positionen bleiben — der Störtest schneidet mit ihnen im Original. */
const htmlOhne = html => html.replace(/<!--[\s\S]*?-->/g, leer)
  .replace(/(<(script|style)\b[^>]*>)([\s\S]*?)(<\/\2\s*>)/gi, (_, a, n, innen, z) => a + leer(innen) + z);
const tagMitKlasse = klasse => new RegExp('<div\\b[^>]*\\bclass\\s*=\\s*["\'](?:[^"\']*\\s)?' + klasse
  + '(?:\\s[^"\']*)?["\'][^>]*>', 'g');

function pruefeHtml(html, sw) {
  const r = [];
  const o = htmlOhne(html);
  const ids = [...o.matchAll(/\bid\s*=\s*["']cardEselsbild["']/g)];
  const vorn = [...o.matchAll(tagMitKlasse('flashcard-front'))];
  const hinten = [...o.matchAll(tagMitKlasse('flashcard-back'))];
  const satz = [...o.matchAll(/\bid\s*=\s*["']cardSentenceBox["']/g)];
  r.push([ids.length === 1, `genau ein id="cardEselsbild" in index.html (ist: ${ids.length})`]);
  const aufbau = vorn.length === 1 && hinten.length === 1 && satz.length === 1
    && vorn[0].index < hinten[0].index && hinten[0].index < satz[0].index;
  r.push([aufbau, 'Kartenaufbau erkannt: je einmal flashcard-front, flashcard-back, cardSentenceBox, in dieser Folge'
    + (aufbau ? '' : ` (front ${vorn.length}×, back ${hinten.length}×, cardSentenceBox ${satz.length}×)`)]);
  if (ids.length === 1 && aufbau) {
    const e = ids[0].index, v = vorn[0].index, h = hinten[0].index, s = satz[0].index;
    r.push([!(e > v && e < h), 'cardEselsbild liegt NICHT auf der Vorderseite (zwischen flashcard-front und flashcard-back)']);
    r.push([e > h && e < s, 'cardEselsbild liegt auf der Rückseite: nach flashcard-back, vor cardSentenceBox']);
  }
  const quellen = [...o.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)]
    .map(m => m[1].replace(/^\.\//, '').replace(/\?.*$/, ''));
  r.push([quellen.includes('data/eselsbilder.js'), 'index.html lädt data/eselsbilder.js (<script src>)']);
  const swOhne = ohneKommentareUndTexte(sw || '', { texte: false });
  const auf = swOhne.indexOf('const ASSETS'), zu = auf < 0 ? -1 : swOhne.indexOf('];', auf);
  const assets = auf < 0 || zu < 0 ? [] : [...swOhne.slice(auf, zu).matchAll(/["']([^"']+)["']/g)].map(m => m[1].replace(/^\.\//, ''));
  r.push([assets.includes('data/eselsbilder.js'), 'sw.js führt data/eselsbilder.js in ASSETS (offline da)']);
  return r;
}

/* Grenzen einer Funktion — die Klammern werden im Text OHNE Kommentare UND
   Zeichenketten gezählt: '{{ar:' oder ein Regex /\{\{/ brächten sonst die Zählung
   durcheinander. Die Positionen sind dieselben wie im Original. */
function bereich(voll, name) {
  const m = new RegExp('\\bfunction\\s+' + name + '\\s*\\(').exec(voll);
  if (!m) return null;
  let j = m.index + m[0].length - 1, tiefe = 0;
  for (; j < voll.length; j++) {
    if (voll[j] === '(') tiefe++;
    else if (voll[j] === ')' && --tiefe === 0) break;
  }
  const auf = voll.indexOf('{', j);
  if (auf < 0) return null;
  tiefe = 0;
  for (let k = auf; k < voll.length; k++) {
    if (voll[k] === '{') tiefe++;
    else if (voll[k] === '}' && --tiefe === 0) return { von: m.index, bis: k + 1 };
  }
  return null;
}
const zeile = (text, pos) => text.slice(0, pos).split('\n').length;

function pruefeJs(dateien) {
  const r = [];
  const d = dateien.map(x => ({ ...x, ohne: ohneKommentareUndTexte(x.text, { texte: false }), voll: ohneKommentareUndTexte(x.text) }));
  const L = d.find(x => x.name === 'lernen.js');
  if (!L) return [[false, 'js/lernen.js fehlt']];
  const defs = d.flatMap(x => [...x.voll.matchAll(/\bfunction\s+renderEselsbild\s*\(/g)].map(() => x.name));
  r.push([defs.length === 1 && defs[0] === 'lernen.js', 'renderEselsbild() ist genau einmal definiert, in js/lernen.js'
    + (defs.length === 1 && defs[0] === 'lernen.js' ? '' : ' (gefunden: ' + (defs.join(', ') || 'nirgends') + ')')]);
  const eb = bereich(L.voll, 'renderEselsbild'), rc = bereich(L.voll, 'renderCard');
  if (!eb || !rc) { r.push([false, 'renderEselsbild() oder renderCard() in js/lernen.js nicht abgrenzbar']); return r; }
  const innen = (x, pos, b) => x.name === 'lernen.js' && pos >= b.von && pos < b.bis;

  const aussen = [];
  for (const x of d) for (const m of x.ohne.matchAll(/\b(ESELSBILD_EMOJI|ESELSBILD_ZEICHNUNG|cardEselsbild)\b/g))
    if (!innen(x, m.index, eb)) aussen.push(`js/${x.name}:${zeile(x.text, m.index)} ${m[1]}`);
  r.push([!aussen.length, 'ESELSBILD_EMOJI, ESELSBILD_ZEICHNUNG und cardEselsbild stehen nur in renderEselsbild()'
    + (aussen.length ? ' — auch: ' + aussen.join(', ') : '')]);

  const aufrufe = [], lose = [];
  for (const x of d) for (const m of x.ohne.matchAll(/\brenderEselsbild\b/g)) {
    const davor = x.ohne.slice(Math.max(0, m.index - 30), m.index);
    if (/\bfunction\s+$/.test(davor) || /\btypeof\s+$/.test(davor)) continue;
    (/^\s*\(/.test(x.ohne.slice(m.index + m[0].length)) ? aufrufe : lose).push({ x, pos: m.index });
  }
  const wo = a => `js/${a.x.name}:${zeile(a.x.text, a.pos)}`;
  r.push([aufrufe.length === 1 && innen(aufrufe[0].x, aufrufe[0].pos, rc),
    `renderEselsbild( wird genau einmal aufgerufen, in renderCard() (ist: ${aufrufe.length}× — ${aufrufe.map(wo).join(', ') || 'nirgends'})`]);
  r.push([!lose.length, 'kein loser Verweis auf renderEselsbild (etwa als Rückruf)' + (lose.length ? ' — ' + lose.map(wo).join(', ') : '')]);

  /* Zusatz zu „nur Rückseite": die Funktion schreibt in kein fremdes Element. */
  const koerper = L.ohne.slice(eb.von, eb.bis);
  const fremd = [...koerper.matchAll(/getElementById\(\s*["'`]([^"'`]+)["'`]\s*\)/g)].map(m => m[1]).filter(i => i !== 'cardEselsbild');
  const qs = /document\s*\.\s*querySelector/.test(koerper);
  r.push([!fremd.length && !qs, 'renderEselsbild() greift nur auf #cardEselsbild zu'
    + (fremd.length ? ' — auch auf: ' + fremd.join(', ') : '') + (qs ? ' — und per document.querySelector' : '')]);
  return r;
}

/* ---------- C. Bausteine ---------- */
const ARGS = { M: 2, L: 2, H: 1, V: 1, C: 6, Q: 4, A: 7, Z: 0 };
const PFAD_TOKEN = /[A-Za-z]|-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g;
function zerlegePfad(d) {
  const rest = d.replace(PFAD_TOKEN, '');
  if (/[^\s,]/.test(rest)) return { fehler: 'unlesbare Zeichen „' + rest.replace(/[\s,]/g, '') + '"' };
  const segmente = [];
  let cmd = null, args = [];
  for (const t of d.match(PFAD_TOKEN) || []) {
    if (/[A-Za-z]/.test(t)) {
      if (!Object.prototype.hasOwnProperty.call(ARGS, t)) return { fehler: 'Befehl „' + t + '" nicht erlaubt (nur M L H V C Q A Z, groß)' };
      if (args.length) return { fehler: 'zu wenige Zahlen vor „' + t + '"' };
      cmd = t;
      if (ARGS[t] === 0) segmente.push({ cmd: t, args: [] });
      continue;
    }
    if (!cmd || ARGS[cmd] === 0) return { fehler: 'Zahl ohne Befehl' };
    args.push(Number(t));
    /* Wiederholte Zahlengruppen ohne neuen Buchstaben bekommen ihren Befehl
       ausgeschrieben (nach M gilt L) — sonst wäre „L 1 2 3 4" ein anderer
       Bauplan als „L 1 2 L 3 4", obwohl es dieselbe Linie ist. */
    if (args.length === ARGS[cmd]) { segmente.push({ cmd, args }); args = []; if (cmd === 'M') cmd = 'L'; }
  }
  if (args.length) return { fehler: 'unvollständiger Befehl am Ende' };
  if (!segmente.length || segmente[0].cmd !== 'M') return { fehler: 'beginnt nicht mit M' };
  const xs = [], ys = [];
  for (const { cmd: c, args: a } of segmente) {
    if (c === 'M' || c === 'L') { xs.push(a[0]); ys.push(a[1]); }
    else if (c === 'H') xs.push(a[0]);
    else if (c === 'V') ys.push(a[0]);
    else if (c === 'C') { xs.push(a[0], a[2], a[4]); ys.push(a[1], a[3], a[5]); }
    else if (c === 'Q') { xs.push(a[0], a[2]); ys.push(a[1], a[3]); }
    else if (c === 'A') { xs.push(a[5]); ys.push(a[6]); }
  }
  const spanne = v => v.length ? Math.max(...v) - Math.min(...v) : 0;
  return { segmente, buchstaben: segmente.map(s => s.cmd).join(''), breite: spanne(xs), hoehe: spanne(ys) };
}

function signatur(el) {
  const a = el.attr, n = k => Number(a[k]);
  const fehlt = (...ks) => ks.filter(k => a[k] === undefined || !ZAHL.test(a[k]));
  let f;
  switch (el.name) {
    case 'rect': f = fehlt('width', 'height'); return f.length ? { fehler: '<rect> ohne ' + f.join('/') } : { wert: 'rect ' + r4(n('width')) + '×' + r4(n('height')) };
    case 'circle': f = fehlt('r'); return f.length ? { fehler: '<circle> ohne r' } : { wert: 'circle r' + r4(n('r')) };
    case 'ellipse': f = fehlt('rx', 'ry'); return f.length ? { fehler: '<ellipse> ohne ' + f.join('/') } : { wert: 'ellipse ' + r4(n('rx')) + '×' + r4(n('ry')) };
    case 'line': f = fehlt('x1', 'y1', 'x2', 'y2'); return f.length ? { fehler: '<line> ohne ' + f.join('/') } : { wert: 'line ' + r4(Math.hypot(n('x2') - n('x1'), n('y2') - n('y1'))) };
    case 'text': { const t = el.text.trim().replace(/\s+/g, ' '); return t ? { wert: 'text „' + t + '"' } : { fehler: '<text> ohne Inhalt' }; }
    case 'path': {
      if (a.d === undefined) return { fehler: '<path> ohne d' };
      const p = zerlegePfad(a.d);
      return p.fehler ? { fehler: '<path d="' + a.d.slice(0, 40) + '">: ' + p.fehler } : { wert: 'path ' + p.buchstaben + ' ' + r4(p.breite) + '×' + r4(p.hoehe) };
    }
    default: return { fehler: '<' + el.name + '> hat keine Signatur' };
  }
}

/* Zerlegt `inhalt` in Elemente. Ein eigener kleiner Leser statt eines DOM: die
   erlaubte Menge ist klein, und was er nicht lesen kann, ist ein Befund. */
function zerlege(inhalt) {
  const elemente = [], fehler = [], stapel = [];
  const re = /<\s*(\/?)\s*([A-Za-z][\w:.-]*)([^<>]*?)(\/?)\s*>|([^<]+)|</g;
  let m;
  while ((m = re.exec(inhalt))) {
    if (m[0] === '<') { fehler.push('ein „<" ohne Abschluss'); continue; }
    if (m[5] !== undefined) {
      if (!m[5].trim()) continue;
      const oben = stapel[stapel.length - 1];
      if (oben && oben.name === 'text') oben.text += m[5];
      else fehler.push('Text außerhalb von <text>: „' + m[5].trim().slice(0, 30) + '"');
      continue;
    }
    const [, zu, name, attrRoh, selbst] = m;
    if (zu) {
      const oben = stapel.pop();
      if (!oben || oben.name !== name) fehler.push('</' + name + '> schließt kein offenes <' + name + '>');
      continue;
    }
    if (!ELEMENTE.has(name)) fehler.push('<' + name + '> ist kein erlaubtes Element');
    const attr = {};
    const rest = attrRoh.replace(/([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g, (_, k, a, b) => { attr[k] = a !== undefined ? a : b; return ' '; });
    if (rest.trim()) fehler.push('<' + name + '>: unlesbar „' + rest.trim().slice(0, 30) + '"');
    for (const [k, v] of Object.entries(attr)) {
      if (!ATTRIBUTE.has(k)) fehler.push('<' + name + '>: Attribut ' + k + '= nicht erlaubt');
      else if (NUMERISCH.has(k) && !ZAHL.test(v)) fehler.push('<' + name + '>: ' + k + '="' + v + '" ist keine Zahl');
      if (/\{\{/.test(v)) fehler.push('<' + name + '>: Platzhalter in einem Attribut');
    }
    const eigene = (attr.class || '').split(/\s+/).filter(Boolean);
    eigene.filter(c => !KLASSEN.has(c)).forEach(c => fehler.push('<' + name + '>: Klasse ' + c + ' nicht erlaubt'));
    const el = { name, attr, text: '', klassen: [...stapel.flatMap(e => e.klassen), ...eigene] };
    if (name !== 'g' && !el.klassen.length) fehler.push('<' + name + '> ohne Klasse — seine Farbe käme nicht aus dem CSS');
    if (!selbst) stapel.push(el);
    if (name !== 'g') elemente.push(el);
  }
  if (stapel.length) fehler.push('nicht geschlossen: <' + stapel.map(e => e.name).join('>, <') + '>');
  for (const el of elemente) {
    if (!ELEMENTE.has(el.name)) continue;
    const s = signatur(el);
    if (s.fehler) fehler.push(s.fehler); else el.signatur = s.wert;
  }
  return { elemente, fehler };
}

function pruefeBausteine(Z, vok, css) {
  const befunde = [], benutzt = new Set();
  for (const [k, z] of Object.entries(Z || {})) {
    const b = t => befunde.push(wer(k) + ': ' + t);
    if (!z || typeof z !== 'object') { b('kein Objekt'); continue; }
    if (typeof z.text !== 'string' || !z.text.trim()) b('text ist leer');
    const vb = typeof z.viewBox === 'string' ? z.viewBox.trim().split(/[\s,]+/) : [];
    if (vb.length !== 4 || !vb.every(x => ZAHL.test(x)) || !(Number(vb[2]) > 0 && Number(vb[3]) > 0))
      b('viewBox hat nicht vier Zahlen mit Breite und Höhe: ' + JSON.stringify(z.viewBox));
    if (typeof z.inhalt !== 'string' || !z.inhalt.trim()) { b('inhalt ist leer'); continue; }
    const i = z.inhalt;
    if (/<\s*script/i.test(i)) b('<script> in der Zeichnung');
    if (/(^|[\s"'])on[a-z]+\s*=/i.test(i)) b('Ereignis-Attribut (on…=) in der Zeichnung');
    if (/href/i.test(i)) b('href in der Zeichnung');
    if (/foreignObject/i.test(i)) b('<foreignObject> in der Zeichnung');
    for (const f of ['fill', 'stroke', 'style'])
      if (new RegExp('(^|[\\s"\'])' + f + '\\s*=', 'i').test(i)) b(f + '= im Code — Farben kommen nur über die Klassen aus dem CSS');
    /* Auch als Zeichenreferenz (&#1576;) ist es Arabisch. */
    const entschluesselt = i.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
    if (ARABISCH.test(entschluesselt)) b('arabische Schrift direkt in der Zeichnung — Arabisch nur über {{ar:<kennung>}}');
    for (const m of (i + ' ' + (typeof z.text === 'string' ? z.text : '')).matchAll(/\{\{ar:([^{}]*)\}\}/g))
      if (!vok.has(m[1])) b('Platzhalter {{ar:' + m[1] + '}} zeigt auf keine Vokabel');
    if (/\{\{|\}\}/.test(i.replace(/\{\{ar:[^{}]*\}\}/g, ''))) b('unvollständiger Platzhalter');
    const { elemente, fehler } = zerlege(i);
    fehler.forEach(b);
    elemente.forEach(e => e.klassen.forEach(c => benutzt.add(c)));
  }
  if (css != null)
    for (const c of benutzt)
      if (KLASSEN.has(c) && !new RegExp('\\.' + c + '(?![\\w-])').test(css))
        befunde.push('Klasse ' + c + ' hat keine Regel im CSS von index.html — ihr Element wäre schwarz oder unsichtbar');
  return befunde;
}

/* ---------- D. Keine zwei fast gleichen ---------- */
function aehnlichkeit(a, b) {
  const za = new Map(), zb = new Map();
  a.forEach(s => za.set(s, (za.get(s) || 0) + 1));
  b.forEach(s => zb.set(s, (zb.get(s) || 0) + 1));
  let schnitt = 0, verein = 0;
  const gemeinsam = [];
  for (const k of new Set([...za.keys(), ...zb.keys()])) {
    const x = za.get(k) || 0, y = zb.get(k) || 0, n = Math.min(x, y);
    schnitt += n; verein += Math.max(x, y);
    if (n) gemeinsam.push(k + (n > 1 ? ' ×' + n : ''));
  }
  return { wert: verein ? schnitt / verein : 0, gemeinsam };
}
function pruefeAehnlichkeit(Z) {
  const sig = {};
  for (const [k, z] of Object.entries(Z || {}))
    sig[k] = z && typeof z.inhalt === 'string' ? zerlege(z.inhalt).elemente.map(e => e.signatur).filter(Boolean) : [];
  const ks = Object.keys(sig), paare = [];
  for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++)
    paare.push({ a: ks[i], b: ks[j], ...aehnlichkeit(sig[ks[i]], sig[ks[j]]) });
  paare.sort((p, q) => q.wert - p.wert);
  const rot = paare.filter(p => p.wert >= SCHWELLE);
  const ergebnisse = rot.length
    ? rot.map(p => [false, `${wer(p.a)} und ${wer(p.b)} sind zu ähnlich: ${p.wert.toFixed(2)} ≥ ${SCHWELLE} — gemeinsam: ${p.gemeinsam.join(' · ')}`])
    : [[true, `alle ${paare.length} Paare unter ${SCHWELLE} — jede Zeichnung ist ein bisschen anders`]];
  return { ergebnisse, paare };
}

/* ---------- F. Beispielsatz wie beim Zeichnen ---------- */
function pruefeSaetze(vok) {
  const r = [];
  for (const [k, soll] of Object.entries(SATZ_BEIM_ZEICHNEN)) {
    const v = vok.get(k), ist = v ? v.sentDe : null;
    if (ist !== soll) r.push([false, `${wer(k)}: Beispielsatz geändert, Zeichnung in data/eselsbilder.js ansehen, dann die Tabelle nachziehen`
      + ` (SATZ_BEIM_ZEICHNEN in werkzeuge/pruefe-eselsbilder.mjs) — war „${soll}", ist „${ist}"`]);
  }
  if (!r.length) r.push([true, 'die 14 Beispielsätze stehen noch so da wie beim Zeichnen']);
  return r;
}

/* ---------- Hilfen für die Störtests ---------- */
const Y_STELLEN = { M: [1], L: [1], H: [], V: [0], C: [1, 3, 5], Q: [1, 3], A: [6], Z: [] };
function verschiebePfad(d, dy) {
  const p = zerlegePfad(d);
  if (p.fehler) return d;
  return p.segmente.map(s => s.cmd + (s.args.length ? ' ' + s.args.map((a, i) => Y_STELLEN[s.cmd].includes(i) ? a + dy : a).join(' ') : '')).join(' ');
}
/* Verschiebt die Elemente mit eb-r/eb-rl um dy — über ihre KOORDINATEN, nicht per
   transform: so hätte man die Katze beim Abschreiben wirklich umgesetzt. */
function verschiebeRot(inhalt, dy) {
  return inhalt.replace(/<(path|rect|circle|ellipse|line|text|g)\b([^<>]*?)(\/?)>/g, (tag, name, attr, zu) => {
    const kl = /\bclass\s*=\s*["']([^"']*)["']/.exec(attr);
    if (!kl || !kl[1].split(/\s+/).some(c => c === 'eb-r' || c === 'eb-rl')) return tag;
    if (name === 'g') return /\btransform\s*=/.test(attr)
      ? '<g' + attr.replace(/\btransform\s*=\s*(["'])/, (_, q) => 'transform=' + q + 'translate(0 ' + dy + ') ') + zu + '>'
      : '<g' + attr + ' transform="translate(0 ' + dy + ')"' + zu + '>';
    const neu = attr
      .replace(/(^|\s)(y|cy|y1|y2)\s*=\s*(["'])([^"']*)\3/g, (_, v, k, q, w) => v + k + '=' + q + (Number(w) + dy) + q)
      .replace(/(^|\s)d\s*=\s*(["'])([^"']*)\2/, (_, v, q, d) => v + 'd=' + q + verschiebePfad(d, dy) + q);
    return '<' + name + neu + zu + '>';
  });
}
const tauscheKlassen = (inhalt, a, b) => inhalt.replace(/\bclass\s*=\s*(["'])([^"']*)\1/g,
  (_, q, v) => 'class=' + q + v.split(/\s+/).map(c => c === a ? b : c === b ? a : c).join(' ') + q);
const kopie = o => JSON.parse(JSON.stringify(o));

/* ================================ Lauf ================================ */
let fehler = 0;
const zeige = liste => { for (const [ok, t] of liste) { if (!ok) fehler++; console.log((ok ? '  ok  ' : '  ⛔  ') + t); } };
const lies = p => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null);

const T = { daten: lies(P.daten), index: lies(P.index), vok: lies(P.vokabeln), sw: lies(P.sw) };
const fehlend = [['data/eselsbilder.js', T.daten], ['index.html', T.index], ['vocab-data.js', T.vok], ['sw.js', T.sw]]
  .filter(([, t]) => t == null).map(([n]) => n);
if (!fs.existsSync(P.js)) fehlend.push('js/');
if (fehlend.length) { console.log('⛔ Es fehlt: ' + fehlend.join(', ') + ' — ohne das ist nichts zu prüfen.'); process.exit(1); }

let B, vok;
try { B = ladeBilder(T.daten); }
catch (e) { console.log('⛔ data/eselsbilder.js lässt sich nicht ausführen: ' + e.message); process.exit(1); }
try { vok = ladeVokabeln(T.vok); }
catch (e) { console.log('⛔ vocab-data.js lässt sich nicht ausführen: ' + e.message); process.exit(1); }
const E = B.E, Z = B.Z;
const jsDateien = fs.readdirSync(P.js).filter(f => f.endsWith('.js')).sort()
  .map(f => ({ name: f, text: fs.readFileSync(path.join(P.js, f), 'utf8') }));
const css = [...T.index.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]).join('\n').replace(/\/\*[\s\S]*?\*\//g, ' ');

console.log('=== A. Die 72 und die 14 ===\n');
zeige(pruefeMengen(E, Z, vok));

console.log('\n=== B. Nur Rückseite ===\n');
zeige(pruefeHtml(T.index, T.sw));
zeige(pruefeJs(jsDateien));

console.log('\n=== C. Bausteine der Zeichnungen ===\n');
{
  const bf = pruefeBausteine(Z, vok, css);
  zeige(bf.length ? bf.map(t => [false, t])
    : [[true, `${Object.keys(Z || {}).length} Zeichnungen: nur erlaubte Elemente, Attribute, Klassen und Pfadbefehle, keine Farben im Code, kein Arabisch außer über Platzhalter`]]);
}

console.log('\n=== D. Keine zwei fast gleichen Zeichnungen (Elias, Satz 2) ===\n');
{
  const { ergebnisse, paare } = pruefeAehnlichkeit(Z);
  zeige(ergebnisse);
  console.log('\n  Die fünf ähnlichsten Paare:');
  paare.slice(0, 5).forEach(p => console.log(`      ${p.wert.toFixed(2)}  ${wer(p.a)} / ${wer(p.b)}`));
  console.log('  Die Gegenpaare:');
  for (const [a, b] of GEGENPAARE) {
    const p = paare.find(x => (x.a === a && x.b === b) || (x.a === b && x.b === a));
    console.log(`      ${p ? p.wert.toFixed(2) : ' –  '}  ${wer(a)} / ${wer(b)}${p ? '' : '  (fehlt)'}`);
  }
}

console.log('\n=== F. Beispielsatz wie beim Zeichnen ===\n');
zeige(pruefeSaetze(vok));

/* ---------- E. Störtests ---------- */
console.log('\n=== E. Störtests: wird der Prüfer rot, wo er soll? ===\n');
const stoer = (nr, was, ergebnisse, muster) => {
  const rot = ergebnisse.filter(([ok, t]) => !ok && muster.test(t));
  if (rot.length) console.log(`  ok  Störtest ${nr} (${was}) → rot: ${rot[0][1].slice(0, 120)}`);
  else { fehler++; console.log(`  ⛔  Störtest ${nr} (${was}) blieb GRÜN — die Prüfung sieht ihren eigenen Fall nicht`); }
};
const nichtBaubar = (nr, warum) => { fehler++; console.log(`  ⛔  Störtest ${nr} nicht baubar: ${warum}`); };
const ZK = Object.keys(Z || {});

{ /* (1) auf die Vorderseite */
  const o = htmlOhne(T.index);
  const id = /\bid\s*=\s*["']cardEselsbild["']/.exec(o), vorn = tagMitKlasse('flashcard-front').exec(o);
  if (!id || !vorn) nichtBaubar(1, 'cardEselsbild oder flashcard-front nicht gefunden');
  else {
    let h = T.index.slice(0, id.index) + T.index.slice(id.index + id[0].length);
    const ende = (vorn.index > id.index ? vorn.index - id[0].length : vorn.index) + vorn[0].length;
    h = h.slice(0, ende) + '<div id="cardEselsbild"></div>' + h.slice(ende);
    stoer(1, 'cardEselsbild auf die Vorderseite verschoben', pruefeHtml(h, T.sw), /Vorderseite|Rückseite/);
  }
}
{ /* (2) „unter" mit hochgesetzter Katze als 15. Zeichnung */
  const z = Z && Z['45828'];
  const neu = z && typeof z.inhalt === 'string' ? verschiebeRot(z.inhalt, -40) : null;
  if (!z || neu === z.inhalt) nichtBaubar(2, '45828 fehlt oder hat keine Elemente mit eb-r/eb-rl — die Katze ist nicht zu finden');
  else if (pruefeBausteine({ '45828-hoch': { ...z, inhalt: neu } }, vok, null).length)
    nichtBaubar(2, 'die verschobene Kopie ist selbst fehlerhaft: ' + pruefeBausteine({ '45828-hoch': { ...z, inhalt: neu } }, vok, null)[0]);
  else {
    const Z2 = kopie(Z); Z2['45828-hoch'] = { ...z, inhalt: neu };
    stoer(2, '„unter" mit der Katze 40 höher als 15. Zeichnung', pruefeAehnlichkeit(Z2).ergebnisse, /45828-hoch.*45828 \(unter\)|45828 \(unter\).*45828-hoch/);
  }
}
{ /* (3) Onkel mit getauschten Farben */
  const z = Z && Z['45829'];
  const neu = z && typeof z.inhalt === 'string' ? tauscheKlassen(z.inhalt, 'eb-r', 'eb-m') : null;
  if (!z || !(Z && Z['45835']) || neu === z.inhalt) nichtBaubar(3, '45829/45835 fehlen oder 45829 trägt weder eb-r noch eb-m');
  else {
    const Z3 = kopie(Z); Z3['45835'] = { ...z, inhalt: neu };
    stoer(3, 'Onkel 45829 mit eb-r ↔ eb-m statt 45835', pruefeAehnlichkeit(Z3).ergebnisse, /45829.*45835|45835.*45829/);
  }
}
{ /* (4) ein Emoji weniger */
  const E4 = kopie(E || {}); delete E4[Object.keys(E4)[0]];
  stoer(4, 'ein Emoji weniger', pruefeMengen(E4, Z, vok), /Emoji/);
}
if (!ZK.length) { nichtBaubar(5, 'keine Zeichnung da'); nichtBaubar(6, 'keine Zeichnung da'); }
else {
  const k = ZK[0];
  { /* (5) feste Farbe */
    const Z5 = kopie(Z);
    Z5[k].inhalt = String(Z5[k].inhalt).replace(/<(path|rect|circle|ellipse|line|text)\b/, '<$1 fill="#fff"');
    if (Z5[k].inhalt === Z[k].inhalt) nichtBaubar(5, 'kein Element in ' + k + ' gefunden');
    else stoer(5, 'fill="#fff" in ' + k, pruefeBausteine(Z5, vok, null).map(t => [false, t]), /fill/);
  }
  { /* (6) arabisches Wort direkt — بَيْتٌ, als \u-Folge */
    const Z6 = kopie(Z);
    Z6[k].inhalt = String(Z6[k].inhalt) + '<text class="eb-ar" x="20" y="20">\u0628\u064E\u064A\u0652\u062A\u064C</text>';
    stoer(6, 'arabisches Wort direkt in ' + k, pruefeBausteine(Z6, vok, null).map(t => [false, t]), /arabische Schrift/);
  }
}
{ /* (7) ein veränderter Beispielsatz */
  const vok7 = new Map(vok);
  vok7.set('45828', { id: '45828', sentDe: 'Die Katze ist auf dem Bett.' });
  stoer(7, 'Beispielsatz von 45828 verändert', pruefeSaetze(vok7), /Beispielsatz geändert/);
}

console.log('');
console.log(fehler ? '⛔ ' + fehler + ' Befund(e).' : '✅ Das Eselsbrücken-Bild steht nur auf der Rückseite, ist sauber gebaut, und keine zwei Zeichnungen sind sich zu ähnlich.');
process.exit(fehler ? 1 : 0);
