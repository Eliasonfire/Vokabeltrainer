#!/usr/bin/env node
/* pruefe-vokabeln-seite.mjs — die Kapitelliste zeigt jedes Buch, das er lernt, mit allen Kapiteln
 * ===============================================================================================
 *
 * ⛔⛔ DER ANLASS — Elias am 23.09.2026 mit einem Bild der Liste (Madina 1, Kapitel 16–24):
 *
 *   „die vokabeln gehen nur bis medina 24, ich bin aber bayna yadayk."
 *   „am besten sobald ich neues buch freischalte soll neues buch kommen und
 *    alle kapteln gezeigt werden da"
 *
 * Gemessen mit seinem Stand (Madina 1 + Bayna Yadayk 1): 25 Zeilen, alle 17 Kapitel
 * von Bayna Yadayk fehlten, 17 Madina-Zeilen zeigten eine falsche Zahl („Kap. 1 — 53"
 * statt 28, Bayna Yadayk Kapitel 1 mitgezählt). renderChapterCats() in
 * js/kategorien.js fragte kapitelDesBuchs() ohne Buch — also nur das erste.
 *
 * Bewacht werden SEINE ZWEI SÄTZE als Wirkung:
 *   1. Jedes gewählte Buch hat eine Überschrift und ALLE seine Kapitel (nicht nur
 *      die angehakten) — auch ein Buch, das gerade erst dazugekommen ist.
 *   2. Jede Zeile zählt nur die Wörter IHRES Buchs.
 *   3. Kein Kapitelname aus Madina 1 an einem anderen Buch (CHAPTER_NAMES kommt aus
 *      dem Madina-Schlüssel 1; einen Namen zu erfinden verbietet E.1).
 *   4. openWordList() filtert eine Kapitelliste nach Buch UND Kapitel.
 *
 * ⛔ NICHTS NACHGEBAUT: renderChapterCats kommt aus js/kategorien.js, aktiveBuecher,
 * aktivesBuch, kapitelDesBuchs, buchVokabeln, buchTitel und BUCH_TITEL aus
 * js/buecher.js. Erfunden ist nur die kleine Welt (Wörter, Auswahl) und ein
 * Dokument, das sich merkt, was hineingeschrieben wird. Der Ring je Kapitel
 * (kapitelFortschritt) ist hier leer — ihn misst die App selbst.
 *
 * ⛔ STÖRTESTS bei jedem Lauf, jeder muss rot werden: nur das erste Buch · Zahl
 * über alle Bücher · Madina-Namen an jedem Buch · openWordList ohne Buchfilter.
 *
 * Aufruf: node werkzeuge/pruefe-vokabeln-seite.mjs    (Exit 0 grün, 1 rot)
 */
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { ohneKommentareUndTexte } from './js-quelltext.mjs';

/* ⛔ fileURLToPath, nicht .pathname: der Pfad enthält ein Leerzeichen. [[adresse_nie_normalisieren]] */
const lies = rel => fs.readFileSync(fileURLToPath(new URL('../' + rel, import.meta.url)), 'utf8');
const KAT = lies('js/kategorien.js');
const BUECHER_JS = lies('js/buecher.js');

let fehler = 0;
const gut = t => console.log('  ok ' + t);
const schlecht = t => { fehler++; console.log('  ⛔ ' + t); };

function funktion(quelle, name){
  const leer = ohneKommentareUndTexte(quelle);
  const a = leer.indexOf('function ' + name + '(');
  if (a < 0) return null;
  let i = leer.indexOf('{', a), tiefe = 0;
  for (; i < leer.length; i++){
    if (leer[i] === '{') tiefe++;
    else if (leer[i] === '}' && --tiefe === 0) return quelle.slice(a, i + 1);
  }
  return null;
}
const TEILE = {};
for (const [q, datei, namen] of [[KAT, 'js/kategorien.js', ['renderChapterCats', 'openWordList']],
  [BUECHER_JS, 'js/buecher.js', ['aktiveBuecher', 'aktivesBuch', 'kapitelDesBuchs', 'buchVokabeln', 'buchTitel']]])
  for (const n of namen){
    const f = funktion(q, n);
    if (!f){ console.log('⛔ function ' + n + '() in ' + datei + ' nicht gefunden — der Prüfer kann nichts messen.'); process.exit(1); }
    TEILE[n] = f;
  }
const TITEL = (BUECHER_JS.match(/const BUCH_TITEL = \{[\s\S]*?\};/) || [])[0];
if (!TITEL){ console.log('⛔ const BUCH_TITEL in js/buecher.js nicht gefunden.'); process.exit(1); }

/* ---------- Die kleine Welt ---------- */
const W = (id, book, chapter) => ({ id, ar: 'ar-' + id, de: 'de-' + id, book, chapter });
const WOERTER = [
  W('p1', 'personal', 'personal'),
  W('m1-1a', 'madina-1', 1), W('m1-1b', 'madina-1', 1), W('m1-2', 'madina-1', 2), W('m1-3', 'madina-1', 3),
  W('by-1a', 'bayna-yadayk-1', 1), W('by-1b', 'bayna-yadayk-1', 1), W('by-1c', 'bayna-yadayk-1', 1), W('by-2', 'bayna-yadayk-1', 2),
  W('m2-1', 'madina-2', 1),
];
const NAMEN = { 1: 'MADINA-NAME-1', 2: 'MADINA-NAME-2', 3: 'MADINA-NAME-3', personal: 'Eigene Vokabeln' };
const WELTEN = [
  { name: 'Madina 1 (nur Kapitel 1 angehakt) + Bayna Yadayk 1', buecher: { 'madina-1': [1], 'bayna-yadayk-1': [1, 2] } },
  { name: 'dazu Madina 2 gerade angetippt', buecher: { 'madina-1': [1], 'bayna-yadayk-1': [1, 2], 'madina-2': [] } },
];

function zeichne(teile, buecher){
  const ctx = { __aus: {} };
  vm.createContext(ctx);
  vm.runInContext(
    'var SETTINGS = { buecher: ' + JSON.stringify(buecher) + ' };\n'
    + 'var VOCAB_DATA = ' + JSON.stringify(WOERTER) + ';\n'
    + 'const CHAPTER_NAMES = ' + JSON.stringify(NAMEN) + ';\n'
    + 'const GELADENE_BUECHER = new Set(Object.keys(SETTINGS.buecher));\nconst BUCH_FEHLT = new Set();\n'
    + 'function buchInfo(s){ return { slug: s, kapitel: 30 }; }\n'
    + 'function escapeHtml(s){ return String(s); }\nfunction kapitelFortschritt(){ return ""; }\n'
    + 'var document = { getElementById: id => ({ set innerHTML(v){ __aus[id] = v; } }) };\n'
    + TITEL + '\n' + [teile.aktiveBuecher, teile.aktivesBuch, teile.kapitelDesBuchs, teile.buchVokabeln, teile.buchTitel, teile.renderChapterCats].join('\n')
    + '\nrenderChapterCats();', ctx, { filename: 'Welt für renderChapterCats()' });
  const html = ctx.__aus['catPane-chapters'] || '';
  const koepfe = [...html.matchAll(/<div class="kap-buch">([^<]*)<\/div>/g)].map(m => m[1]);
  const zeilen = [...html.matchAll(/data-openlist="([^"]+)">[\s\S]*?<div class="list-row-title">([\s\S]*?)<\/div>[\s\S]*?<div class="list-row-count">(\d+)<\/div>/g)]
    .map(m => ({ key: m[1], titel: m[2].replace(/<[^>]+>/g, ''), zahl: Number(m[3]) }));
  return { koepfe, zeilen };
}

const TITEL_VON = { 'madina-1': 'Madina 1', 'bayna-yadayk-1': 'Bayna Yadayk 1', 'madina-2': 'Madina 2' };
function befunde(teile){
  const raus = [];
  for (const welt of WELTEN){
    let e;
    try { e = zeichne(teile, welt.buecher); } catch (err) { raus.push(welt.name + ': renderChapterCats() wirft — ' + String(err.message).slice(0, 90)); continue; }
    const gewaehlt = Object.keys(welt.buecher);
    for (const b of gewaehlt) if (!e.koepfe.includes(TITEL_VON[b])) raus.push(welt.name + ': keine Überschrift für ' + TITEL_VON[b]);
    for (const b of gewaehlt){
      const kapitel = [...new Set(WOERTER.filter(w => w.book === b).map(w => w.chapter))];
      for (const k of kapitel){
        const z = e.zeilen.find(x => x.key === 'chapter:' + b + ':' + k);
        const soll = WOERTER.filter(w => w.book === b && w.chapter === k).length;
        if (!z) raus.push(welt.name + ': ' + TITEL_VON[b] + ' Kapitel ' + k + ' fehlt in der Liste');
        else {
          if (z.zahl !== soll) raus.push(welt.name + ': ' + TITEL_VON[b] + ' Kapitel ' + k + ' zeigt ' + z.zahl + ' Wörter, das Buch hat dort ' + soll);
          if (b !== 'madina-1' && /MADINA-NAME/.test(z.titel)) raus.push(welt.name + ': ' + TITEL_VON[b] + ' Kapitel ' + k + ' trägt einen Namen aus Madina 1 („' + z.titel + '")');
          if (b === 'madina-1' && NAMEN[k] && !z.titel.includes(NAMEN[k])) raus.push(welt.name + ': Madina 1 Kapitel ' + k + ' ohne seinen Namen');
        }
      }
    }
    for (const z of e.zeilen){
      const b = z.key.split(':')[1];
      if (b !== 'personal' && !gewaehlt.includes(b)) raus.push(welt.name + ': Zeile ' + z.key + ' aus einem nicht gewählten Buch');
    }
    if (!e.zeilen.some(z => z.key === 'chapter:personal')) raus.push(welt.name + ': „Eigene Vokabeln" fehlt oben');
  }
  /* openWordList: nur statisch — die Funktion baut die ganze Wortliste ins
     Dokument. Die Wirkung hat der Nachbau mit seinem Stand gemessen (23.09.:
     „Bayna Yadayk 1 · Kapitel 1", 25 Wörter, alle aus diesem Buch). */
  const ow = ohneKommentareUndTexte(teile.openWordList);
  if (!/w\.book\s*===\s*buch/.test(ow)) raus.push('openWordList(): eine Kapitelliste filtert nicht nach dem Buch (w.book===buch fehlt)');
  return raus;
}

console.log('pruefe-vokabeln-seite — Elias, 23.09.2026: „sobald ich neues buch freischalte soll neues buch kommen und alle kapteln gezeigt werden da"\n');

const echt = befunde(TEILE);
if (echt.length) echt.forEach(schlecht);
else for (const welt of WELTEN){
  const e = zeichne(TEILE, welt.buecher);
  gut(welt.name + ': Überschriften ' + e.koepfe.join(' | ') + ' · ' + e.zeilen.length + ' Zeilen, alle Kapitel da, jede Zahl nur aus ihrem Buch');
}

const STOERUNGEN = [
  ['nur das erste Buch', 'renderChapterCats', 'aktiveBuecher().flatMap(buch =>', '[aktivesBuch()].flatMap(buch =>'],
  ['Zahl über alle Bücher', 'renderChapterCats', "w.chapter===ch && (!buch || w.book===buch)", 'w.chapter===ch'],
  ['Madina-Namen an jedem Buch', 'renderChapterCats', "(!buch || buch === 'madina-1') ? CHAPTER_NAMES[ch] : null", 'CHAPTER_NAMES[ch]'],
  ['openWordList ohne Buchfilter', 'openWordList', "w.chapter===chNum && (!buch || w.book===buch)", 'w.chapter===chNum'],
];
for (const [name, fn, alt, neu] of STOERUNGEN){
  if (!TEILE[fn].includes(alt)){ schlecht('Störtest „' + name + '": „' + alt + '" steht nicht in ' + fn + '() — Störtest an den Umbau anpassen'); continue; }
  const b = befunde({ ...TEILE, [fn]: TEILE[fn].split(alt).join(neu) });
  if (b.length) gut('Störtest „' + name + '" wird rot: ' + b[0]);
  else schlecht('Störtest „' + name + '" bleibt grün — der Prüfer sieht diesen Fehler nicht');
}

console.log('\n' + (fehler ? '⛔ ' + fehler + ' Befund(e) — Exit 1' : '✅ grün — jedes gewählte Buch mit allen Kapiteln, jede Zahl aus ihrem Buch'));
process.exit(fehler ? 1 : 0);
