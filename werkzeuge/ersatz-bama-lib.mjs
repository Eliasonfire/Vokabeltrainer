/* ersatz-bama-lib.mjs -- liest die Stammliste des Buckwalter Arabic Morphological Analyzer 1.0 (BAMA, GPL v2)
 * und stellt sie nach Lemma geordnet bereit; dazu die Vergleichsformen, mit denen ein Wort aus dem Bestand gegen
 * eine Quelle gehalten wird (ersatz-bama-abgleich.mjs, ersatz-lane.mjs).
 *
 * Elias, 12.10.2026, zu den Plätzen der Ersatzdatenbank, die keine Quelle belegte: „guck nach weiteren
 * möglichkeiten sie zu besorgen". Die Stammliste ist die erste dieser Möglichkeiten (83 von 119 Plätzen).
 *
 * Die Quelle liegt NUR LOKAL: data-ersatz/quellen/bama/dictStems (Zeilen „ohne Vokale <Tab> mit Vokalen <Tab>
 * Kategorie <Tab> englische Bedeutung", davor „;--- Wurzel" und „;; Lemma"), daneben readme-original.txt mit
 * der Lizenz. Sie schreibt in Buckwalter-Umschrift; das Verbindungs-Alif heißt dort „{".
 * Arabische Zeichen entstehen hier nur aus Nummern -- kein arabisches Wort ist von Hand getippt. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { abzugOrdner, istErsatzkarte } from './datenquelle.mjs';

const Z = n => String.fromCodePoint(n);
/* Buckwalter-Umschrift -> Unicode */
const BW = {
  "'": 0x621, '|': 0x622, '>': 0x623, '&': 0x624, '<': 0x625, '}': 0x626, A: 0x627, b: 0x628, p: 0x629, t: 0x62A, v: 0x62B,
  j: 0x62C, H: 0x62D, x: 0x62E, d: 0x62F, '*': 0x630, r: 0x631, z: 0x632, s: 0x633, $: 0x634, S: 0x635, D: 0x636, T: 0x637,
  Z: 0x638, E: 0x639, g: 0x63A, _: 0x640, f: 0x641, q: 0x642, k: 0x643, l: 0x644, m: 0x645, n: 0x646, h: 0x647, w: 0x648,
  Y: 0x649, y: 0x64A, F: 0x64B, N: 0x64C, K: 0x64D, a: 0x64E, u: 0x64F, i: 0x650, '~': 0x651, o: 0x652, '`': 0x670, '{': 0x671,
  P: 0x67E, J: 0x686, V: 0x6A4, G: 0x6AF,
};
export const ausBW = t => [...String(t)].map(c => (BW[c] !== undefined ? Z(BW[c]) : c)).join('').normalize('NFC');
/* Unicode -> Buckwalter-Umschrift (für Dateinamen der abgelegten Seiten; unbekannte Zeichen bleiben stehen) */
const ZURUECK = new Map(Object.entries(BW).map(([k, n]) => [Z(n), k]));
export const nachBW = t => [...String(t)].map(c => ZURUECK.get(c) ?? c).join('');

const FATHA = Z(0x64E), DAMMA = Z(0x64F), KASRA = Z(0x650), SHADDA = Z(0x651), SUKUN = Z(0x652);
const ALIF = Z(0x627), WASLA = Z(0x671), LAM = Z(0x644), TATWEEL = Z(0x640), DOLCH = Z(0x670);
const TANWIN = [Z(0x64B), Z(0x64C), Z(0x64D)];
const KURZ = [FATHA, DAMMA, KASRA];
const ZEICHEN = new Set([...KURZ, ...TANWIN, SHADDA, SUKUN, DOLCH]);
const HAMZA_FORMEN = new Map([[Z(0x623), Z(0x621)], [Z(0x624), Z(0x621)], [Z(0x625), Z(0x621)], [Z(0x626), Z(0x621)]]);

/* Vergleichsform MIT Vokalzeichen: ohne Artikel, ohne Schlussendung, ohne Sukun, ohne Fatha vor Alif;
 * Alif am Wortanfang gleich, ob mit Kasra, als Wasla oder blank. Hamza-Träger bleiben erhalten. */
export function vergleich(wort, { artikelWeg = true } = {}) {
  let t = String(wort).normalize('NFC').replaceAll(TATWEEL, '').trim();
  if (artikelWeg) {
    const m = t.match(new RegExp('^[' + ALIF + WASLA + ']' + LAM + SUKUN + '?'));
    if (m && t.length > m[0].length + 2) t = t.slice(m[0].length);
  }
  t = t.replaceAll(WASLA, ALIF).replaceAll(SUKUN, '');
  t = t.replace(new RegExp('^' + ALIF + KASRA), ALIF);
  t = t.replaceAll(FATHA + ALIF, ALIF).replaceAll(FATHA + SHADDA + ALIF, SHADDA + ALIF);
  // Fathatan vor Alif maqsura am Ende zählt wie Fatha (BAMA schreibt dort „aY")
  t = t.replace(new RegExp(TANWIN[0] + '(' + SHADDA + '?)' + Z(0x649) + '$'), FATHA + '$1' + Z(0x649));
  // Fathatan mit Träger-Alif (auch über Shadda): Endung samt Alif weg, Shadda bleibt
  t = t.replace(new RegExp(TANWIN[0] + '(' + SHADDA + '?)' + ALIF + '$'), '$1');
  // Schlussendung: Tanwin (auch mit Träger-Alif) und kurzer Vokal am Ende
  t = t.replace(new RegExp('[' + TANWIN.join('') + ']' + ALIF + '?$'), '');
  t = t.replace(new RegExp('[' + KURZ.join('') + ']$'), '');
  // NFC stellt Shadda hinter den Vokal: endet das Wort auf Vokal+Shadda, ist der Vokal die Schlussendung
  t = t.replace(new RegExp('[' + KURZ.join('') + TANWIN.join('') + '](' + SHADDA + ')$'), '$1');
  return t;
}
/* nur die Buchstaben, Hamza-Träger vereinheitlicht */
export function geruest(wort) {
  let t = vergleich(wort);
  t = [...t].filter(c => !ZEICHEN.has(c)).map(c => HAMZA_FORMEN.get(c) || c).join('');
  return t.replace(new RegExp('^' + ALIF), '').replace(new RegExp(Z(0x629) + '$'), '');
}
/* trägt das Wort wenigstens ein Vokalzeichen? Ein Treffer ohne Vokalzeichen belegt die Schreibung nicht. */
const VOKALZEICHEN = new RegExp('[' + Z(0x64B) + '-' + Z(0x652) + ']');
export const hatVokalzeichen = wort => VOKALZEICHEN.test(String(wort));

export function ladeBama(datei) {
  const roh = fs.readFileSync(datei, 'latin1').split(/\r?\n/);
  const lemmas = [];
  let wurzel = '', lemma = null;
  for (const zeile of roh) {
    if (zeile.startsWith(';--- ')) { wurzel = zeile.slice(5).split(/\s/)[0]; continue; }
    if (zeile.startsWith(';; ')) {
      const id = zeile.slice(3).trim();
      const m = id.match(/^(.*?)(?:-([aiu]+))?_(\d+)$/);
      lemma = { id, form: m ? m[1] : id, praesensVokal: m && m[2] ? m[2] : '', wurzel, staemme: [] };
      lemmas.push(lemma);
      continue;
    }
    if (!zeile || zeile.startsWith(';')) continue;
    const f = zeile.split('\t');
    if (f.length < 4 || !lemma) continue;
    const glosse = f[3].replace(/<pos>.*?<\/pos>/g, '').trim();
    const pos = (f[3].match(/<pos>(.*?)<\/pos>/) || [])[1] || '';
    lemma.staemme.push({ ohne: f[0], mit: f[1], kat: f[2], glosse, pos });
  }
  for (const l of lemmas) {
    const kats = [...new Set(l.staemme.map(s => s.kat))];
    l.kats = kats;
    l.glossen = [...new Set(l.staemme.map(s => s.glosse).filter(Boolean))];
    l.verb = kats.some(k => /^(PV|IV|CV)/.test(k));
    l.ar = ausBW(l.form);
  }
  return lemmas;
}
export const standardDatei = repo => path.join(repo, 'data-ersatz', 'quellen', 'bama', 'dictStems');

/* Die Wurzeln, unter denen Lanes Lexikon nachgeschlagen wird (ersatz-lane.mjs), aus dem Feld root einer Karte,
 * in Buckwalter-Umschrift: zweilautig gekürzt (zweiter und dritter Buchstabe gleich -- Lane führt solche Wurzeln
 * unter ZWEI Buchstaben), dann die ganze Wurzel, dann dieselben mit dem Hamza in der anderen Schreibung. */
const BUCHSTABE = new RegExp('[' + Z(0x621) + '-' + Z(0x64A) + ']');
export function wurzelnAus(feld) {
  const b = [...String(feld || '')].filter(c => BUCHSTABE.test(c));
  if (b.length < 2) return [];
  const formen = [b.join('')];
  if (b.length === 3 && b[1] === b[2]) formen.unshift(b[0] + b[1]);
  for (const f of [...formen]) {
    if (f.includes(Z(0x621))) formen.push(f.replaceAll(Z(0x621), Z(0x623)));
    if (f.includes(Z(0x623))) formen.push(f.replaceAll(Z(0x623), Z(0x621)));
  }
  return [...new Set(formen)].map(nachBW);
}

/* Dateiname einer abgelegten Wurzelseite von Lanes Lexikon (data-ersatz/quellen/lane/seiten/). Die Umschrift
 * unterscheidet Groß und klein (H/h, S/s, D/d, T/t, Y/y …), Windows bei Dateinamen nicht: „Drb.html" und „drb.html"
 * wären dort EINE Datei, und die Seite der einen Wurzel würde als die der anderen gelesen (so geschehen am 12.10.2026:
 * der Schlüssel „bny" las die Seite von „bnY"). Darum trägt jeder Großbuchstabe einen Strich hinter sich; die bis
 * dahin abgelegten Seiten sind umbenannt. Zeichen, die keine Buchstaben sind, stehen als Unterstrich mit Zeichennummer. */
export const laneDateiname = bw => String(bw).replace(/[^A-Za-z]/g, c => '_' + c.charCodeAt(0)).replace(/[A-Z]/g, c => c + '-') + '.html';

/* Die Stichwörter, die eine abgelegte Wurzelseite von Lanes Lexikon nennt: jedes ist ein Verweis auf die Seite des
 * Stichworts. Gemessen am 12.10.2026 an den 612 abgelegten Seiten -- es gibt drei Arten von Kennung:
 *   · „n123"    das gewöhnliche Stichwort (9048 Verweise)
 *   · „n123-2"  ein weiteres Stichwort DESSELBEN Artikels (562 Verweise). Bis zu diesem Tag las das Werkzeug nur die
 *               erste Art; diese Stichwörter sah es nicht, und ein Wort, das Lane so führt, galt als „nicht genannt".
 *   · „j12"     kein Stichwort, sondern die blanke Wurzel als Verweis auf eine andere Schreibung (9 Seiten, jede mit
 *               genau diesem einen Verweis und ohne Vokalzeichen). Die zählt nicht mit.
 * laneFuehrtWurzel sagt, ob eine Seite eine Wurzel wirklich FÜHRT: sie nennt wenigstens ein Stichwort mit
 * Vokalzeichen. Eine Seite, die nur auf die andere Schreibung verweist, führt sie nicht. */
const ohneMarken = t => String(t).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
export const laneVerweise = html => [...String(html).matchAll(/<a href="(\/word\/[^"]+\/(n\d+(?:-\d+)?))" class="root-word-link">([^]*?)<\/a>/g)]
  .map(m => ({ pfad: m[1], nr: m[2], wort: ohneMarken(m[3]) }));
export const laneFuehrtWurzel = html => laneVerweise(html).some(v => v.wort.split(' ').some(hatVokalzeichen));

/* Dieselben Suchschlüssel, erweitert um die zwei Schreibungen, unter denen Lanes Seiten eine Wurzel sonst noch führen
 * (gemessen am 12.10.2026 an den abgelegten Seiten und an den Fehlabrufen: „An" ist da, „>nf" und „'nf" nicht;
 * „H*w" ist da, „bny", „vny" und „fty" nicht):
 *   · Hamza am Anfang steht dort als bloßes Alif
 *   · der schwache letzte Radikal: Waw und Ya sind bei Lane zwei Seiten, das Ya steht als Alif maqsura
 * Das ist nur der Weg zur Seite. Welche Wurzel gilt, sagt die Seite, auf der das Wort als Stichwort steht (wurzelWert). */
export function wurzelSchluessel(feld) {
  const erst = wurzelnAus(feld);
  const mitAlif = [...erst];
  for (const f of erst) if ("'><".includes(f[0])) mitAlif.push('A' + f.slice(1));
  const alle = [...mitAlif];
  for (const f of mitAlif) {
    const letzter = f.slice(-1);
    if (f.length >= 3 && 'wyY'.includes(letzter)) for (const x of ['Y', 'y', 'w']) if (x !== letzter) alle.push(f.slice(0, -1) + x);
  }
  return [...new Set(alle)];
}

/* Der WERT einer Wurzel aus dem Namen der Seite, auf der Lane das Wort führt (Buckwalter-Umschrift), in der Schreibweise
 * der App: Buchstaben mit Leerzeichen, das Hamza auf dem Alif (wie ersatz-zuordnen.mjs es bei den Wurzeln des
 * Wiktionary hält), das Ya am Ende als Ya.
 *   · Eine zweilautige Seite wird nur dann verdoppelt, wenn auch der Suchschlüssel drei Buchstaben mit gleichem zweiten
 *     und dritten hatte -- sonst ist es die Seite einer Partikel („mn"), und die hat keine Wurzel.
 *   · Es gelten drei oder vier Radikale. Ein bloßes Alif, das dann noch dasteht, ist kein Radikal (Lane führt manche
 *     Lehnwörter unter ihren Buchstaben); dann gibt es keinen Wert.
 * null heißt: aus dieser Seite lässt sich keine Wurzel ablesen. */
const RADIKAL = new Set([...">btvjHxd*rzs$SDTZEgfqklmnhwy"]);
export function wurzelWert(bw, schluesselFeld) {
  let b = [...String(bw || '')];
  if (b.length === 2) {
    const k = [...String(schluesselFeld || '')].filter(c => BUCHSTABE.test(c));
    if (!(k.length === 3 && k[1] === k[2] && nachBW(k[1]) === b[1])) return null;
    b = [b[0], b[1], b[1]];
  }
  if (b[0] === 'A') b[0] = '>';
  if (b[b.length - 1] === 'Y') b[b.length - 1] = 'y';
  b = b.map(c => ("'&}<".includes(c) ? '>' : c));
  if (b.length < 3 || b.length > 4 || b.some(c => !RADIKAL.has(c))) return null;
  return ausBW(b.join(' '));
}

/* Der Bestand eines Buches (vokabeln-<buch>.js, liegt nur lokal) als Karte Kennung -> Vokabel. Der Bestand ist
 * der Abzug von arabicroots: in data/ -- oder in data-abzug/, solange auf die Ersatzdatenbank umgeschaltet ist
 * (datenquelle.mjs). */
const _bestand = new Map();
export function ladeBuch(repo, buch) {
  const schluessel = repo + '|' + buch;
  if (_bestand.has(schluessel)) return _bestand.get(schluessel);
  const datei = path.join(abzugOrdner(repo), 'vokabeln-' + buch + '.js');
  let karte = null;
  if (fs.existsSync(datei)) {
    const fenster = {};
    vm.runInContext(fs.readFileSync(datei, 'utf8'), vm.createContext({ window: fenster }), { filename: datei });
    if (fenster.VOKABELN[buch].some(istErsatzkarte)) throw new Error(datei + ': das sind Karten der Ersatzdatenbank, nicht der Abzug von arabicroots („node werkzeuge/ersatz-wechsel.mjs --stand“ zeigt die Lage)');
    karte = new Map(fenster.VOKABELN[buch].map(k => [String(k.id), k]));
  }
  _bestand.set(schluessel, karte);
  return karte;
}
export const BUECHER = ['madina-1', 'madina-2', 'madina-3', 'bayna-yadayk-1', 'bayna-yadayk-2', 'bayna-yadayk-3', 'bayna-yadayk-4', 'quran'];
