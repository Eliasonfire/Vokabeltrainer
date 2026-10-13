/* koran-satz-lib.mjs — gemeinsamer Zugriff für die Beispielsätze der Koran-Karten: sein Wortbestand, der vorhandene
   Satzbestand (Lehrbuchsätze, geschriebene Beispielsätze, Sätze der Lernwörter) Wort für Wort, und die zwei
   Umformungen, die an diesem Satzbestand geeicht werden (werkzeuge/eiche-koran-satz.mjs), bevor sie benutzt werden.
   Kein arabisches Wort ist hier von Hand getippt — Zeichen entstehen nur aus Nummern.  REPO = der Ordner über werkzeuge/. */
import fs from 'node:fs';
import path from 'node:path';
import { REPO, ARBEIT, VORLAGEN, lade, Z } from './koran-stellen-lib.mjs';
export { REPO, ARBEIT, VORLAGEN, lade, Z };

const kl = (...b) => '[' + b.map(x => Array.isArray(x) ? Z(x[0]) + '-' + Z(x[1]) : Z(x)).join('') + ']';
export const MARKE = new RegExp(kl([0x64B, 0x652], 0x670), 'g');
const ARABISCH = new RegExp(kl([0x621, 0x652], 0x670, 0x671));
const NICHT_AR = new RegExp('[^' + Z(0x621) + '-' + Z(0x652) + Z(0x670) + Z(0x671) + ']', 'g');
const ALIFE = new RegExp(kl(0x623, 0x625, 0x622, 0x671), 'g');
export const FATHA = Z(0x64E), DAMMA = Z(0x64F), KASRA = Z(0x650), SHADDA = Z(0x651), SUKUN = Z(0x652);
export const FATHATAN = Z(0x64B), DAMMATAN = Z(0x64C), KASRATAN = Z(0x64D);
export const ALIF = Z(0x627), LAM = Z(0x644), TA_M = Z(0x629), HAMZA = Z(0x621), ALIF_M = Z(0x649);
/* Sonnenbuchstaben: t th d dh r z s sh S D T Z l n */
const SONNE = new Set([0x62A, 0x62B, 0x62F, 0x630, 0x631, 0x632, 0x633, 0x634, 0x635, 0x636, 0x637, 0x638, 0x644, 0x646].map(Z));

export const nurAr = w => String(w).normalize('NFC').replace(NICHT_AR, '');
export const nackt = t => nurAr(t).replace(MARKE, '').replace(ALIFE, ALIF);
export const stamm = t => { const n = nackt(t); return (n.startsWith(ALIF + LAM) && n.length > 4) ? n.slice(2) : n; };
/* Wörter eines Satzes, je mit dem Zeichen dahinter (Punkt, Fragezeichen, Doppelpunkt …) */
export function woerter(satz) {
  return String(satz).normalize('NFC').split(/\s+/).filter(w => ARABISCH.test(w)).map(w => ({ roh: w, ar: nurAr(w), nach: w.slice(w.lastIndexOf(nurAr(w).slice(-1)) + 1) }));
}

/* ---------- sein Bestand (wie eb-aufloesen.mjs) ---------- */
export function bestandLaden() {
  const bestand = new Map();
  const merke = (w, quelle) => { if (w && w.id !== undefined && !bestand.has(String(w.id))) bestand.set(String(w.id), Object.assign({ quelle }, w)); };
  lade('vocab-data.js', 'VOCAB_DATA').forEach(w => merke(w, 'vocab'));
  try { lade('data/fachbegriffe.js', 'FACHBEGRIFF_VOKABELN').forEach(w => merke(w, 'fach')); } catch (e) { /* keine */ }
  try { (JSON.parse(fs.readFileSync(path.join(REPO, 'data/eigene-woerter.json'), 'utf8')).woerter || []).forEach(w => merke(w, 'eigen')); } catch (e) { /* keine */ }
  const stand = JSON.parse(fs.readFileSync(path.join(REPO, 'data/lernstand.json'), 'utf8'));
  for (const [slug, bis] of Object.entries(stand.angabe || {})) {
    if ((stand.nichtInArbeit || {})[slug]) continue;
    const f = {};
    new Function('window', fs.readFileSync(path.join(REPO, 'data', 'vokabeln-' + slug + '.js'), 'utf8'))(f);
    for (const w of ((f.VOKABELN && f.VOKABELN[slug]) || [])) if (Number(w.chapter) <= Number(bis)) merke(w, slug + ' K' + w.chapter);
  }
  return bestand;
}

/* ---------- der vorhandene Satzbestand ---------- */
export function saetzeLaden() {
  const saetze = new Map();
  const LB = lade('lehrbuch-saetze.js', 'LEHRBUCH_SAETZE');
  for (const s of (Array.isArray(LB) ? LB : Object.values(LB || {}).flat())) if (s && (s.ar || s.sentAr)) saetze.set(String(s.id), { quelle: 'Lehrbuch', id: String(s.id), ar: s.ar || s.sentAr, de: s.de || s.sentDe || '' });
  for (const [id, s] of Object.entries(lade('data/beispielsaetze.js', 'BEISPIELSAETZE'))) if (s && s.sentAr && !saetze.has('B' + id)) saetze.set('B' + id, { quelle: 'Beispielsatz', id: 'B' + id, ar: s.sentAr, de: s.sentDe || '' });
  for (const w of lade('vocab-data.js', 'VOCAB_DATA')) if (w.sentAr) saetze.set('L' + w.id, { quelle: 'Lernwort', id: 'L' + w.id, ar: w.sentAr, de: w.sentDe || '' });
  for (const s of saetze.values()) s.w = woerter(s.ar);
  return saetze;
}

/* ---------- die zwei Umformungen ---------- */
/* (1) unbestimmt (Nominativ, wie auf der Karte) -> bestimmt, Nominativ. Liefert null, wenn die Form nicht sicher
       gebildet werden kann (kein Dammatan am Ende, Hamza-/Alif-Anfang mit Sonderschreibung usw.). */
export function bestimmt(wort) {
  const t = nurAr(wort);
  let koerper;
  if (t.endsWith(DAMMATAN)) koerper = t.slice(0, -1) + DAMMA;
  else if (t.endsWith(DAMMATAN + SHADDA)) koerper = t.slice(0, -2) + DAMMA + SHADDA;       // NFC stellt Shadda hinter den Vokal
  else if (t.endsWith(DAMMA) || t.endsWith(DAMMA + SHADDA)) koerper = t;                    // ohne Tanwin (diptot): bleibt
  else return null;
  const erster = koerper[0];
  if (erster === ALIF || erster === Z(0x622) || erster === Z(0x625)) return null;           // Alif/Madda/Hamza unten am Anfang: nicht von selbst
  if (SONNE.has(erster)) {
    /* Sonnenbuchstabe: Lam ohne Zeichen, der Buchstabe bekommt Shadda (NFC-Reihenfolge: Vokal, dann Shadda) */
    const zweites = koerper[1];
    if (zweites === SHADDA || koerper[2] === SHADDA) return null;                           // schon verdoppelt: nicht von selbst
    if (![FATHA, DAMMA, KASRA].includes(zweites)) return null;
    return (ALIF + LAM + erster + zweites + SHADDA + koerper.slice(2)).normalize('NFC');
  }
  return (ALIF + LAM + SUKUN + koerper).normalize('NFC');
}
/* (3) Kartenform (unbestimmt, Nominativ) -> erstes Wort einer Genitivverbindung: das Tanwin fällt, sonst nichts. */
export function mudaf(wort) {
  const t = nurAr(wort);
  if (t.endsWith(DAMMATAN)) return (t.slice(0, -1) + DAMMA).normalize('NFC');
  if (t.endsWith(DAMMATAN + SHADDA)) return (t.slice(0, -2) + DAMMA + SHADDA).normalize('NFC');
  return null;
}
/* (4) bi- vor ein bestimmtes Wort im Genitiv: Ba mit Kasra, das Alif des Artikels bleibt geschrieben. */
export function mitBi(wort) {
  const t = nurAr(wort);
  if (!(t.startsWith(ALIF + LAM) && (t.endsWith(KASRA) || t.endsWith(KASRA + SHADDA)))) return null;
  return (Z(0x628) + KASRA + t).normalize('NFC');
}
/* (2) bestimmtes Nomen im Nominativ -> Genitiv oder Akkusativ: nur der letzte kurze Vokal wechselt.
       Liefert null, wenn das Wort nicht auf Damma endet (Alif maqsura, Dual, Plural auf -una, Besitzendung …). */
export function fall(wort, kasus) {
  const t = nurAr(wort);
  const neu = kasus === 'gen' ? KASRA : kasus === 'akk' ? FATHA : null;
  if (!neu) return null;
  if (t.endsWith(DAMMA + SHADDA)) return (t.slice(0, -2) + neu + SHADDA).normalize('NFC');
  if (t.endsWith(DAMMA)) return (t.slice(0, -1) + neu).normalize('NFC');
  return null;
}
