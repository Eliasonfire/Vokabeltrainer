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

/* ── MEHRZAHL eines Nomens aus der Stammliste ────────────────────────────────────────────────────────────────────
 * Die Liste nennt die Mehrzahl auf zwei Wegen (Begleittext readme-original.txt, Abschnitt 4, „A review of stem
 * morphological categories"):
 *   über die KATEGORIE der Einzahl-Zeile: NapAt, NduAt, N/At heißt, das Nomen nimmt die Mehrzahlendung -At
 *   („NAt means that it takes the plural suffix -At"); Ndu und Napdu dagegen „take broken plurals";
 *   über eine WEITERE ZEILE unter demselben Lemma: die gebrochene Mehrzahl („kitAb Ndu book" / „kutub N books")
 *   oder ein Stamm der Kategorie NAt, der mit der Endung -At die Mehrzahl ist und deren Lautwechsel schon trägt
 *   („$urof Napdu balcony" / „$uraf NAt balconies"). Eine Mehrzahl mit schwachem Schluss steht doppelt da; die
 *   Zitierform ist die der Kategorie NK (Stamm mit Kasratan), die auf -iy daneben fällt weg.
 * WELCHE Zeile eine Mehrzahl ist, sagt die Liste nicht eigens. Das liest die Regel hier ab (von Claude, 13.10.2026);
 * jede Bedingung stammt aus einem Fehler beim Nachmessen an 1416 Karten, deren Mehrzahl das Wiktionary nennt:
 *   (a) eine Zeile mit DEMSELBEN Stamm wie die Einzahl ist keine Mehrzahl — das Einzelstück zum Sammelwort („Apfel"),
 *       die weibliche Form („Mutter" unter „Vater");
 *   (b) eine Form mit Artikel ist ein Name („Al-Jazeera" unter „Insel");
 *   (c) eine gebrochene Mehrzahl trägt eine Kategorie, die der Begleittext für Mehrzahlen nennt (N, Nap, Ndip, N0…,
 *       NK, N/At) — Ndu, Nall, Napdu, NapAt beugen selbst nach Zahl, sind also Einzahlen („Göttin" unter „Gott");
 *   (d) ihre englische Bedeutung ist die Mehrzahl eines Wortes der Einzahl-Zeile — sonst gehört sie zu einer anderen
 *       Bedeutung des Worts („Riemen" unter „Verbindung"); ein Zusatz in Klammern, den die Einzahl nicht hat, sperrt
 *       („partners (female)");
 *   (e) eine NAt-Zeile gilt nur, wenn das Wort der Karte die Form auf Ta marbuta ist oder das Lemma keine solche Form
 *       führt — sonst ist es die Mehrzahl des Einzelstücks, nicht des Sammelworts („Haar").
 * NICHT gebaut: die gesunde männliche Mehrzahl aus der Kategorie Nall. Die Kategorie ERLAUBT die Endung -uwna nur, sie
 * nennt sie nicht (gemessen 42 gleich, 8 anders, darunter die -uwna-Mehrzahl von „Band eines Buches").
 * Gemessen mit allen Bedingungen: 900 Karten bekommen eine Form, 856 gleich dem Wiktionary, 9 gleich bis auf einen
 * Vokal der -At-Mehrzahl, 35 anders — alle 35 einzeln gelesen: eine andere Mehrzahl desselben Worts im selben Sinn. */
const katOhneL = k => String(k).replace(/_L$/, '');
const KAT_AP = ['Nap', 'Napdu', 'NapAt'], KAT_NIMMT_AT = ['NapAt', 'NduAt', 'N/At'];
const KAT_MEHRZAHL = ['N', 'Nap', 'Ndip', 'N0', 'N0_Nh', 'N0_Nhy', 'NK', 'N/At', 'N0F', 'N0F_Nh'];
const KAT_ZITIERBAR = ['N', 'Ndu', 'NduAt', 'N/At', 'Nall', 'N/ap', 'N-ap', 'Ndip', 'Nel', 'N0', 'N0_Nh', 'N0_Nhy', 'N0F', 'N0F_Nh'];
/* die selbständige Form eines Stamms nach seiner Kategorie; null = der Stamm steht nie ohne Endung */
function bamaZitierform(s) {
  const k = katOhneL(s.kat);
  if (KAT_AP.includes(k)) return s.mit + 'ap';
  if (k === 'NAt') return s.mit + 'At';
  if (k === 'NK') return s.mit + 'K';
  return KAT_ZITIERBAR.includes(k) ? s.mit : null;
}
/* Schreibweise wie im übrigen Ersatz: Verbindungs-Alif als Alif mit Kasra, Fatha vor dem Dehnungs-Alif ausgeschrieben
 * (die Liste schreibt „kitAb"); eine Schlussendung nennt die Liste nicht, es kommt auch keine dazu */
const BW_VOKAL = new Set(['a', 'u', 'i', 'o', 'F', 'N', 'K']);
export function bamaSchreibweise(bw) {
  const t = String(bw).replace(/^\{i/, 'Ai').replace(/\{/g, 'A');
  let aus = '';
  for (let i = 0; i < t.length; i++) {
    if (t[i] === 'A' && i > 0 && !BW_VOKAL.has(aus[aus.length - 1])) aus += 'a';
    aus += t[i];
  }
  return aus;
}
/* Englisch: die Wörter einer Bedeutung (ohne Klammerzusätze) und die Klammerzusätze für sich */
const enWoerter = g => String(g).toLowerCase().replace(/\([^)]*\)/g, ' ').split(/[^a-z]+/).filter(x => x.length > 1);
const enStamm = w => w.replace(/ies$/, 'y').replace(/(es|s)$/, '');
const enKlammern = g => [...String(g).toLowerCase().matchAll(/\(([^)]*)\)/g)].map(m => m[1].split(/[^a-z]+/).filter(Boolean).map(enStamm).join(' '));
const EN_UNREGELMAESSIG = { man: 'men', woman: 'women', child: 'children', foot: 'feet', tooth: 'teeth', person: 'people', mouse: 'mice', goose: 'geese', ox: 'oxen' };
/* die möglichen Einzahlen eines englischen Wortes, das eine Mehrzahl sein kann */
function enEinzahlen(pw) {
  const r = [];
  for (const [e, m] of Object.entries(EN_UNREGELMAESSIG)) if (pw === m || (pw.endsWith(m) && pw.length > m.length)) r.push(pw.slice(0, pw.length - m.length) + e);
  if (pw.endsWith('ies')) r.push(pw.slice(0, -3) + 'y');
  if (pw.endsWith('ves')) r.push(pw.slice(0, -3) + 'f', pw.slice(0, -3) + 'fe');
  if (pw.endsWith('es')) r.push(pw.slice(0, -2), pw.slice(0, -2) + 'is');
  if (pw.endsWith('s') && !pw.endsWith('ss')) r.push(pw.slice(0, -1));
  return r.filter(x => x.length > 1);
}
/* Ist die englische Bedeutung glPl die Mehrzahl einer der Bedeutungen glossenSg? („maids" zu „housemaid" gilt auch.) */
export function englischIstMehrzahl(glPl, glossenSg) {
  const kSg = glossenSg.flatMap(enKlammern);
  if (enKlammern(glPl).some(k => !kSg.includes(k))) return false;
  const sg = glossenSg.flatMap(enWoerter);
  return enWoerter(glPl).some(pw => enEinzahlen(pw).some(x => sg.some(sw => sw === x || (x.length >= 4 && sw.endsWith(x)))));
}
/* Die Mehrzahlen, die EIN Lemma der Stammliste zum Wort nennt, in der Reihenfolge seiner Zeilen.
 * einzahl: die Zeilen, deren Form das Wort ist (leer = das Lemma führt das Wort nicht als Einzahl);
 * formen: { ar, bw, art: 'kategorie' | 'zeile-at' | 'zeile', stamm, kat, glosse } */
export function bamaMehrzahl(lemma, wort) {
  const w = vergleich(wort, { artikelWeg: false }), wOhne = vergleich(wort);
  const gleich = f => { const a = vergleich(ausBW(f), { artikelWeg: false }); return a === w || a === wOhne; };
  const st = lemma.staemme.map(s => ({ ...s, zf: bamaZitierform(s), k: katOhneL(s.kat) }));
  const einzahl = st.filter(s => s.zf && gleich(s.zf) && s.k !== 'NAt' && s.k !== 'NK');
  if (!einzahl.length) return { einzahl, formen: [] };
  const glossenSg = [...new Set(einzahl.map(s => s.glosse))], mitSg = new Set(einzahl.map(s => s.mit));
  const hatAp = st.some(s => KAT_AP.includes(s.k)), wortIstAp = einzahl.some(s => KAT_AP.includes(s.k));
  const nkGeruest = new Set(st.filter(s => s.k === 'NK').map(s => geruest(ausBW(s.mit))));
  const formen = [], gesehen = new Set();
  const dazu = (bw, art, s) => {
    const ar = ausBW(bamaSchreibweise(bw)), v = vergleich(ar);
    if (!gesehen.has(v)) { gesehen.add(v); formen.push({ ar, bw, art, stamm: s.mit, kat: s.kat, glosse: s.glosse }); }
  };
  for (const s of st) {
    if (einzahl.includes(s)) { if (KAT_NIMMT_AT.includes(s.k)) dazu(s.mit + 'At', 'kategorie', s); continue; }
    if (glossenSg.includes(s.glosse) || !englischIstMehrzahl(s.glosse, glossenSg)) continue;              // (d)
    if (s.k === 'NAt') { if (wortIstAp || !hatAp) dazu(s.mit + 'At', 'zeile-at', s); continue; }           // (e)
    if (!s.zf || gleich(s.zf) || mitSg.has(s.mit) || /^Al/.test(s.mit)) continue;                         // (a), (b)
    if (!KAT_MEHRZAHL.includes(s.k)) continue;                                                            // (c)
    if (s.k !== 'NK' && s.mit.endsWith('iy') && nkGeruest.has(geruest(ausBW(s.mit.slice(0, -2))))) continue; // die Form auf Kasratan steht daneben
    dazu(s.zf, 'zeile', s);
  }
  return { einzahl, formen };
}
/* Ein Eigenname: Kategorie oder Wortart der Liste — oder jede englische Bedeutung ist groß geschrieben („Kuwait"
 * führt die Liste als gewöhnliches Nomen) */
export const bamaIstName = l => l.staemme.some(s => /prop/i.test(s.kat) || /PROP/.test(s.pos)) || (l.glossen.length > 0 && l.glossen.every(g => /^[A-Z]/.test(g)));
/* Teilt das Lemma ein englisches Wort mit der Bedeutung der Karte? — um unter gleich geschriebenen Lemmata das der
 * Karte zu finden. englischeStaemme macht aus Bedeutungen die Menge ihrer Wortstämme (ohne Füllwörter). */
const EN_FUELLWORT = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'from', 'one', 'who', 'which', 'something', 'someone', 'of', 'to', 'in', 'on', 'or', 'an', 'as', 'by', 'at', 'is', 'be', 'it', 'its', 'etc', 'esp', 'especially', 'used', 'also', 'not', 'any', 'kind', 'type', 'form', 'part', 'act', 'being', 'person', 'thing', 'place', 'time']);
export const englischeStaemme = texte => new Set((texte || []).flatMap(enWoerter).filter(x => x.length > 2 && !EN_FUELLWORT.has(x)).map(enStamm));
export const bamaTeiltSinn = (l, staemme) => l.staemme.some(s => [...englischeStaemme([s.glosse])].some(x => staemme.has(x)));
/* Die Mehrzahl zur KARTE: unter den Lemmata gleicher Schreibung (lemmata; Verben und Namen zählen nicht) das der Karte.
 * Genau eines führt das Wort als Einzahl → das gilt. Mehrere → die, deren englische Bedeutung ein Wort mit der
 * englischen Bedeutung der Karte teilt (englisch: die Bedeutungen aus der Quelle der Karte); teilt keines eines, alle.
 * Nennen die so Gewählten nicht DIESELBEN Formen, gibt es keine Mehrzahl (gemessen: „Gruppe" bekam die Mehrzahl von
 * „Generalleutnant", „Bargeld" die von „Kritik").
 * Ergebnis: null (kein Lemma führt das Wort) · { unklar: n } · { lemma, einzahl, formen, wahl: 'eins'|'sinn'|'einig', von: n } */
export function bamaMehrzahlZurKarte(lemmata, wort, englisch) {
  const je = (lemmata || []).filter(l => !l.verb && !bamaIstName(l)).map(l => ({ lemma: l, ...bamaMehrzahl(l, wort) })).filter(x => x.einzahl.length);
  if (!je.length) return null;
  if (je.length === 1) return { ...je[0], wahl: 'eins', von: 1 };
  const en = englischeStaemme(englisch), sig = x => x.formen.map(f => f.bw).join(',');
  const mit = je.filter(x => bamaTeiltSinn(x.lemma, en));
  const kreis = mit.length ? mit : je;
  if (new Set(kreis.map(sig)).size !== 1) return { unklar: je.length };
  return { ...kreis[0], wahl: mit.length ? 'sinn' : 'einig', von: je.length };
}

/* Der Bestand eines Buches (vokabeln-<buch>.js, liegt nur lokal) als Karte Kennung -> Vokabel. Der Bestand ist
 * der Abzug von arabicroots: in data/ -- oder in data-abzug/, solange auf die Ersatzdatenbank umgeschaltet ist
 * (datenquelle.mjs). */
/* ---------- VERBFORMEN aus der Stammliste (13.10.2026, Regel von Claude) ----------
 * Gut hundert Verbkarten haben in keiner anderen Quelle einen Verb-Eintrag. Die Stammliste führt je Verb den Stamm
 * der Gegenwart mit Vokalen (Zeilen der Kategorien IV…).
 *   GEGENWART (3. Person m. Einzahl) = Vorsilbe + Stamm + Endung: Vorsilbe yu- bei Kategorie …_yu, sonst ya-; Endung -u,
 *     bei schwachem Schluss (Kategorien IV_0hAnn, IV_0) keine — so beschreibt es der Begleittext der Liste (Abschnitt
 *     „VERB STEMS“). Das ist abgelesen und zusammengesetzt, nicht gebildet.
 *   BEFEHL: die Liste führt Befehlsformen nur für wenige Verben (und schreibt einige davon mit Hamza statt
 *     Verbindungs-Alif). Er wird nach der Regel der Grammatik aus dem Stamm der Gegenwart gebildet — eine Regel von
 *     Claude, KEINE Angabe der Liste; der Beleg sagt es.
 *   VERBALSUBSTANTIV: die Liste verknüpft es nicht mit dem Verb. Bei den abgeleiteten Bauformen folgt es einem festen
 *     Muster; genommen wird es, wenn die Liste genau dieses Nomen (mit Vokalen) unter DERSELBEN Wurzel führt. Die
 *     Grundform hat kein festes Muster — dort bleibt das Feld offen.
 * Jede Bedingung stammt aus einem Fehler beim Messen gegen die Formen, die das Wiktionary nennt (Eichmaß, mit diesem
 * Code gemessen am 13.10.2026: Gegenwart 1399 Karten mit Form — 1381 gleich, 18 mit anderem Vokal der Grundform, 0
 * anders; Befehl bei feststehender Gegenwart 1366 — 1364 gleich, 2 anders, beide an verdoppelten Verben (einmal nennt
 * das Wiktionary die nicht zusammengezogene Form, einmal passt sein Befehl nicht zu seiner eigenen Gegenwart);
 * Verbalsubstantiv 643 — 641 gleich, 2 ein anderes richtiges):
 *   - Grundform: Liste und Wiktionary nennen bei etwa jedem vierzigsten Verb einen anderen Vokal der Gegenwart, und
 *     nicht immer hat die Liste den üblichen. Darum der SCHLÜSSEL: steht eine Gegenwart schon fest (auf der Karte
 *     selbst, sonst auf der bisherigen Karte), zählt nur die Zeile, die genau diese Gegenwart ergibt — die bisherige
 *     Karte ist Schlüssel und Einspruch, nie Quelle. Passt keine Zeile, bleibt das Feld offen.
 *   - vier Zeilen der Liste tragen eine Kategorie, deren Vorsilbe nicht zur Bauform passt (>aEorab und >ayoqan ohne
 *     _yu, Zalam-ia und lAn-i mit _yu) — solche Zeilen werden übergangen.
 *   - schwacher Schluss: führt ein Lemma eine Zeile auf -iy/-uw UND eine auf -aY, gilt die der Bauform.
 *   - ein Ya vor dem Schluss-Alif (leben): die Liste schreibt Alif maqsura, das Verb schreibt man mit Alif — keine Form.
 *   - Befehl: Hamza am Wortanfang sitzt auf Alif; ein Stamm, der mit zwei Konsonanten oder einem verdoppelten beginnt,
 *     bekommt das Verbindungs-Alif (mit u, wenn der Stammvokal u ist, sonst i); Form IV bekommt ihr >a- zurück, und ein
 *     erster Wurzelbuchstabe w/y steht wieder da; verdoppelte Verben in der zusammengezogenen Form; bei Hamza vorn nur
 *     die Befehlszeile der Liste (iss, nimm); Hamza unmittelbar vor der Endung: keine Regel. */
export const verbStreng = t => String(t ?? '').normalize('NFC').trim().replaceAll(TATWEEL, '').replaceAll(WASLA, ALIF).replaceAll(SUKUN, '').replaceAll(DOLCH, '').replaceAll(FATHA + ALIF, ALIF);
export const verbStrengOhneEndung = t => verbStreng(t).replace(new RegExp('[' + KURZ.join('') + ']$'), '');
const verbAktiv = s => !/_Pass/.test(s.kat);
const verbBasis = k => String(k).replace('_intr', '').replace('_yu', '');
const BW_KURZ = new Set(['a', 'i', 'u']);
const BW_HAMZA = new Set(['>', '<', '&', '}', "'", '|']);
const bwLetzterVokal = st => { for (let i = st.length - 1; i >= 0; i--) if (BW_KURZ.has(st[i])) return st[i]; return ''; };
function verbVorsilbeDerBauform(lemma) {
  const f = String(lemma.form || '');
  if (lemma.praesensVokal) return 'ya';       // Grundform: der Name des Lemmas trägt den Vokal der Gegenwart
  if (/^\{i/.test(f)) return 'ya';            // Formen VII bis X
  if (/^[>|]/.test(f)) return 'yu';           // Form IV, und Form II/III einer Wurzel mit Hamza vorn
  return null;                                // sonst gilt die Kategorie
}
/* je Gegenwartszeile ein Paar { gw, bf[], stamm, kat, ausZeile } in Buckwalter-Umschrift */
export function bamaVerbformen(lemma) {
  const f = String(lemma.form || '');
  const iv = lemma.staemme.filter(s => /^IV/.test(s.kat) && verbAktiv(s));
  const cv = lemma.staemme.filter(s => /^CV/.test(s.kat));
  if (!iv.length) return { paare: [] };
  const soll = verbVorsilbeDerBauform(lemma);
  const vorsilbe = s => (/_yu/.test(s.kat) ? 'yu' : 'ya');
  const passt = s => !soll || vorsilbe(s) === soll;
  const zeilen = iv.filter(passt);
  const mitU = zeilen.filter(s => ['IV', 'IV-n', 'IV_no-Pref-A', 'IV_V'].includes(verbBasis(s.kat)));
  let ohne = zeilen.filter(s => ['IV_0hAnn', 'IV_0'].includes(verbBasis(s.kat)));
  if (ohne.length > 1 && new Set(ohne.map(s => s.mit.slice(-2))).size > 1) {
    const will = lemma.praesensVokal
      ? s => [...lemma.praesensVokal].some(v => ({ i: /iy$/, u: /uw$/, a: /aY$/ })[v].test(s.mit))
      : /^\{i/.test(f) ? s => /iy$/.test(s.mit)
        : /^ta/.test(f) ? s => (vorsilbe(s) === 'yu' ? /iy$/ : /aY$/).test(s.mit)
          : ohne.every(s => vorsilbe(s) === 'yu') ? s => /iy$/.test(s.mit) : null;
    if (will) ohne = ohne.filter(will);
  }
  ohne = ohne.filter(s => !/yaY$/.test(s.mit));
  const formIV = /^>a/.test(f) && !lemma.praesensVokal && !mitU.concat(ohne).some(s => /^[>&]/.test(s.mit));
  const befehl = (j, s, e) => {
    if (!j) return null;
    if (j[0] === '&') {
      if (j[1] === 'A') j = '|' + j.slice(2);
      else if (j[1] === 'a' || j[1] === 'u') j = '>' + j.slice(1);
      else if (j[1] === 'i') j = '<' + j.slice(1);
      else return null;
    }
    if (vorsilbe(s) === 'yu') {
      if (/^\|/.test(f)) return null;
      if (formIV) return (/^w[^aiuo~AY]/.test(j) ? '>a' + f[2] + 'o' + j.slice(1) : '>a' + j) + e;
      return j + e;
    }
    if (j[1] === 'o' || j[1] === '~') return '{' + (bwLetzterVokal(j) === 'u' ? 'u' : 'i') + j + e;
    return j + e;
  };
  const paare = new Map();
  const dazu = (gw, bf, s, ausZeile = false) => {
    const v = paare.get(gw), neu = bf.filter(Boolean);
    if (v) v.bf = [...new Set([...v.bf, ...neu])]; else paare.set(gw, { gw, bf: [...new Set(neu)], stamm: s.mit, kat: s.kat, ausZeile });
  };
  for (const s of mitU) {
    const b = verbBasis(s.kat), gw = vorsilbe(s) + s.mit + 'u';
    if (b === 'IV' || b === 'IV-n') dazu(gw, [befehl(s.mit, s, 'o')], s);
    else if (b === 'IV_V') dazu(gw, s.mit.endsWith('~') ? [befehl(s.mit, s, 'a')] : iv.filter(x => passt(x) && verbBasis(x.kat) === 'IV_C' && vorsilbe(x) === vorsilbe(s)).map(x => befehl(x.mit, x, 'o')), s);
    else dazu(gw, cv.filter(x => verbBasis(x.kat) === 'CV' && !BW_HAMZA.has(x.mit[0]) && x.mit[0] !== '{').map(x => x.mit + 'o'), s, true);
  }
  for (const s of ohne) {
    let j = /(iy|uw|aY)$/.test(s.mit) ? s.mit.slice(0, -1) : null;
    if (j && BW_HAMZA.has(j[j.length - 2])) j = null;
    dazu(vorsilbe(s) + s.mit, [befehl(j, s, '')], s);
  }
  return { paare: [...paare.values()] };
}
/* Zur Karte: lemmata = die Verb-Lemmata, deren Vergangenheit der Karte gleicht. schluessel = Gegenwartsformen, die
 * schon feststehen: dann zählen nur Paare mit genau dieser Gegenwart. Ergebnis: { lemma, paare, gegenwart[], befehl[],
 * wahl, von } · { widerspruch } (kein Paar gleicht dem Schlüssel) · { unklar } (gleich geschriebene Lemmata nennen
 * Verschiedenes, und die Bedeutung entscheidet nicht) · { ohneForm } · null (kein Lemma) */
export function bamaVerbformenZurKarte(lemmata, { englisch = [], schluessel = [] } = {}) {
  const arab = bw => ausBW(bamaSchreibweise(bw));
  let je = (lemmata || []).filter(l => l.verb).map(l => ({ lemma: l, paare: bamaVerbformen(l).paare.map(p => ({ ...p, gwAr: arab(p.gw), bfAr: p.bf.map(arab) })) }));
  if (!je.length) return null;
  if (!je.some(x => x.paare.length)) return { ohneForm: true };
  if (schluessel.length) {
    const will = new Set(schluessel.map(verbStrengOhneEndung));
    je = je.map(x => ({ ...x, paare: x.paare.filter(p => will.has(verbStrengOhneEndung(p.gwAr))) })).filter(x => x.paare.length);
    if (!je.length) return { widerspruch: true };
  } else je = je.filter(x => x.paare.length);
  const von = je.length;
  const fertig = (x, wahl) => ({ lemma: x.lemma, paare: x.paare, gegenwart: x.paare.map(p => p.gwAr), befehl: [...new Set(x.paare.flatMap(p => p.bfAr))], wahl, von });
  if (je.length === 1) return fertig(je[0], schluessel.length ? 'schluessel' : 'eins');
  const en = englischeStaemme(englisch), sig = x => x.paare.map(p => p.gw + '=' + p.bf.join('+')).join(',');
  const mit = je.filter(x => bamaTeiltSinn(x.lemma, en));
  const kreis = mit.length ? mit : je;
  if (new Set(kreis.map(sig)).size !== 1) return { unklar: von };
  return fertig(kreis[0], mit.length ? 'sinn' : 'einig');
}
/* Verbalsubstantiv: das Muster der Bauform aus der Vergangenheit (Buckwalter-Umschrift), mit dem Hamza-Sitz der
 * Zielform */
const VERB_K = '([^aiuo~AYFNK{])';
const hamzaSitz = bw => String(bw).replace(/A>$/, "A'").replace(/u>$/, 'u&').replace(/A'u/, 'A&u').replace(/^\{isoti>o/, '{isoti}o').replace(/i>ap$/, 'i}ap');
const MASDAR_MUSTER = [
  ['IV', `^>a${VERB_K}o${VERB_K}a${VERB_K}$`, m => [m[1] === 'w' ? '<iy' + m[2] + 'A' + m[3] : '<i' + m[1] + 'o' + m[2] + 'A' + m[3]]],
  ['IV hohl', `^>a${VERB_K}A${VERB_K}$`, m => ['<i' + m[1] + 'A' + m[2] + 'ap']],
  ['IV schwach', `^>a${VERB_K}o${VERB_K}aY$`, m => [m[1] === 'w' ? '<iy' + m[2] + "A'" : '<i' + m[1] + 'o' + m[2] + "A'"]],
  ['IV doppelt', `^>a${VERB_K}a${VERB_K}~$`, m => ['<i' + m[1] + 'o' + m[2] + 'A' + m[2]]],
  ['II', `^${VERB_K}a${VERB_K}~a${VERB_K}$`, m => ['ta' + m[1] + 'o' + m[2] + 'iy' + m[3], 'ta' + m[1] + 'o' + m[2] + 'i' + m[3] + 'ap']],
  ['II schwach', `^${VERB_K}a${VERB_K}~aY$`, m => ['ta' + m[1] + 'o' + m[2] + 'iyap']],
  ['III', `^${VERB_K}A${VERB_K}a${VERB_K}$`, m => ['mu' + m[1] + 'A' + m[2] + 'a' + m[3] + 'ap', m[1] + 'i' + m[2] + 'A' + m[3]]],
  ['III schwach', `^${VERB_K}A${VERB_K}aY$`, m => ['mu' + m[1] + 'A' + m[2] + 'Ap']],
  ['V', `^ta${VERB_K}a${VERB_K}~a${VERB_K}$`, m => ['ta' + m[1] + 'a' + m[2] + '~u' + m[3]]],
  ['VI', `^ta${VERB_K}A${VERB_K}a${VERB_K}$`, m => ['ta' + m[1] + 'A' + m[2] + 'u' + m[3]]],
  ['VII', `^\\{ino${VERB_K}a${VERB_K}a${VERB_K}$`, m => ['{ino' + m[1] + 'i' + m[2] + 'A' + m[3]]],
  ['X', `^\\{isota${VERB_K}o${VERB_K}a${VERB_K}$`, m => ['{isoti' + m[1] + 'o' + m[2] + 'A' + m[3]]],
  ['X hohl', `^\\{isota${VERB_K}A${VERB_K}$`, m => ['{isoti' + m[1] + 'A' + m[2] + 'ap']],
  ['X doppelt', `^\\{isota${VERB_K}a${VERB_K}~$`, m => ['{isoti' + m[1] + 'o' + m[2] + 'A' + m[2]]],
  ['VIII', `^\\{i${VERB_K}(o[tdT]|~)a${VERB_K}a${VERB_K}$`, m => ['{i' + m[1] + m[2] + 'i' + m[3] + 'A' + m[4]]],
  ['VIII hohl', `^\\{i${VERB_K}otA${VERB_K}$`, m => ['{i' + m[1] + 'otiyA' + m[2]]],
  ['VIII schwach', `^\\{i${VERB_K}(o[tdT]|~)a${VERB_K}aY$`, m => ['{i' + m[1] + m[2] + 'i' + m[3] + "A'"]],
  ['Vierer', `^${VERB_K}a${VERB_K}o${VERB_K}a${VERB_K}$`, m => [m[1] + 'a' + m[2] + 'o' + m[3] + 'a' + m[4] + 'ap']],
].map(([name, re, bilde]) => [name, new RegExp(re), bilde]);
export function bamaMasdarMuster(lemma) {
  if (lemma.praesensVokal) return { bau: 'Grundform', muster: [] };
  const f = String(lemma.form || '');
  for (const [name, re, bilde] of MASDAR_MUSTER) { const m = f.match(re); if (m) return { bau: name, muster: bilde(m).map(hamzaSitz) }; }
  return { bau: 'unbekannt', muster: [] };
}
/* nach = alle Lemmata der Liste, nach vergleich(l.ar, { artikelWeg: false }) geordnet. Ergebnis { lage, bau, muster[],
 * formen[] } mit lage: ohneLemma · grundform · ohneMuster · nichtInListe (das Muster steht da, die Liste führt das Nomen
 * nicht) · gesetzt */
export function bamaMasdarZurKarte(lemmata, nach) {
  const verben = (lemmata || []).filter(l => l.verb);
  if (!verben.length) return { lage: 'ohneLemma' };
  const je = verben.map(l => ({ lemma: l, ...bamaMasdarMuster(l) }));
  if (je.every(x => x.bau === 'Grundform')) return { lage: 'grundform', bau: 'Grundform' };
  const mit = je.filter(x => x.muster.length);
  if (!mit.length) return { lage: 'ohneMuster', bau: je[0].bau };
  const wurzeln = new Set(mit.map(x => x.lemma.wurzel)), muster = [...new Set(mit.flatMap(x => x.muster))];
  const formen = [], gesehen = new Set();
  for (const mu of muster) for (const n of (nach.get(vergleich(ausBW(mu), { artikelWeg: false })) || [])) {
    if (n.verb || !wurzeln.has(n.wurzel) || bamaIstName(n)) continue;
    const ar = ausBW(bamaSchreibweise(n.form)), v = vergleich(ar, { artikelWeg: false });
    if (gesehen.has(v)) continue;
    gesehen.add(v);
    formen.push({ ar, bw: n.form, lemma: n.id, kat: [...new Set(n.staemme.map(s => s.kat))].join('/'), glosse: n.glossen[0] || '', verb: mit[0].lemma.id });
  }
  if (!formen.length) return { lage: 'nichtInListe', bau: mit[0].bau, muster, verb: mit[0].lemma.id };
  return { lage: 'gesetzt', bau: mit[0].bau, muster, formen };
}

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
