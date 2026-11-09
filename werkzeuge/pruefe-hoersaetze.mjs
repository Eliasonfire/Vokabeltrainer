#!/usr/bin/env node
/* pruefe-hoersaetze.mjs — jeder Hoersatz besteht nur aus Woertern, die in seiner Liste `w` stehen
 * ==============================================================================================
 *
 * ⛔ DER ANLASS — Elias am 08.11.2026: „der Hörmodus soll jetzt auch kleinere einfache sätze
 * machen die vorallem im alltag gebrauchbar sind", auf meine Rueckfrage „Nur bekannte Wörter".
 *
 * js/hoeren.js nimmt einen Satz nur, wenn jede Kennung in `w` im Hoervorrat liegt. Das schuetzt
 * nur, wenn `w` VOLLSTAENDIG ist: ein arabisches Wort im Satz ohne Kennung in `w` kaeme ungeprueft
 * an ihm vorbei. Deshalb wird hier jedes Wort des Satzes einer Kennung aus `w` zugeordnet
 * (ohne Vokalzeichen, ohne Artikel, ohne angehaengtes lam, ohne Besitz- und Femininendung) —
 * und jede Kennung in `w` muss es geben und muss im Satz vorkommen.
 *
 * Ausserdem: kein Schluessel `k` doppelt, keine zwei Saetze mit derselben deutschen Bedeutung
 * (sonst stuenden zwei richtige Antworten auf der Karte), alles in NFC, jedes Wort vokalisiert.
 *
 * ⛔ STOERTESTS bei jedem Lauf, jeder muss rot werden: eine Kennung aus `w` entfernt · ein fremdes
 * Wort in den Satz gesetzt · eine erfundene Kennung · eine doppelte deutsche Bedeutung.
 *
 * Aufruf: node werkzeuge/pruefe-hoersaetze.mjs    (Exit 0 gruen, 1 rot)
 * ⚠️ Die Buchvokabeln (data/vokabeln-*.js) liegen nur lokal. Fehlen sie, prueft das Werkzeug
 * nur, was ohne sie geht, und sagt das.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lies = f => fs.readFileSync(path.join(WURZEL, f), 'utf8');

function laden(datei, name){
  const ctx = { window: {}, console };
  vm.createContext(ctx);
  vm.runInContext(lies(datei).replace(/^\s*(const|let) /gm, 'var '), ctx, { filename: datei });
  return name ? ctx[name] : ctx;
}

/* Alle Woerter mit Kennung — dieselben Dateien, die die App laedt. */
function alleWoerter(){
  const m = new Map();
  const dateien = ['vocab-data.js'];
  const dataDir = path.join(WURZEL, 'data');
  let buecher = false;
  if (fs.existsSync(dataDir)){
    for (const f of fs.readdirSync(dataDir)) if (/^vokabeln-.*\.js$/.test(f)){ dateien.push('data/' + f); buecher = true; }
  }
  for (const f of dateien){
    let ctx;
    try { ctx = laden(f); } catch (e){ console.log('  ⚠️ ' + f + ' nicht lesbar: ' + e.message); continue; }
    for (const quelle of [ctx, ctx.window]) for (const k of Object.keys(quelle)){
      const v = quelle[k];
      const liste = Array.isArray(v) ? v : (v && typeof v === 'object' ? Object.values(v).flat() : []);
      for (const w of liste) if (w && w.id != null && w.ar && !m.has(String(w.id))) m.set(String(w.id), w);
    }
  }
  return { m, buecher };
}

const TASCHKIL = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;
/* Das Geruest eines Wortes: ohne Vokale, Hamza-Formen vereinheitlicht, ohne Artikel, ohne ة/ى am Ende. */
function geruest(t){
  let s = String(t || '').normalize('NFC').replace(TASCHKIL, '').replace(/[؟?.!،,]/g, '').trim();
  s = s.replace(/[أإآٱ]/g, 'ا');
  return s;
}
function kernformen(token){
  /* Alle Lesarten, die ein Satzwort auf ein Kartenwort zurueckfuehren koennen. */
  const aus = new Set();
  const g = geruest(token);
  const schritte = [g];
  if (g.startsWith('لل')) schritte.push('ال' + g.slice(2));     /* لِلضَّيْفِ → الضيف */
  for (const s of [...schritte]){
    if (s.startsWith('ال')) schritte.push(s.slice(2));
  }
  for (const s of schritte){
    aus.add(s);
    for (const end of ['ي', 'ك', 'ه', 'ها', 'ة', 'ا']) if (s.length > end.length + 1 && s.endsWith(end)) aus.add(s.slice(0, -end.length));
    if (s.endsWith('تي') || s.endsWith('تك')) aus.add(s.slice(0, -2));   /* أُخْتِي → اخت wird oben schon; طبيبتي → طبيب */
  }
  /* lam mit Suffix: لِي, لَكَ */
  if (g === 'لي' || g === 'لك' || g.startsWith('لل')) aus.add('ل');
  return aus;
}
function kartenformen(w){
  const aus = new Set();
  for (const roh of String(w.ar).split('/')){
    let g = geruest(roh);
    aus.add(g);
    if (g.startsWith('ال')) aus.add(g.slice(2));
    if (g.endsWith('ة')) aus.add(g.slice(0, -1));
    if (g.endsWith('ا') && g.length > 2) aus.add(g.slice(0, -1));   /* أَيْضاً */
  }
  return aus;
}
function passt(token, w){
  const a = kernformen(token), b = kartenformen(w);
  for (const x of a) if (b.has(x)) return true;
  return false;
}

function pruefe(saetze, woerter, mitBuechern){
  const fehler = [];
  const schluessel = new Set(), bedeutung = new Map();
  for (const s of saetze){
    const wo = 'Satz ' + (s && s.k);
    if (!s || !s.k || !s.ar || !s.de || !Array.isArray(s.w) || !s.w.length){ fehler.push(wo + ': Feld fehlt'); continue; }
    if (schluessel.has(s.k)) fehler.push(wo + ': Schluessel doppelt');
    schluessel.add(s.k);
    const de = s.de.trim().toLowerCase();
    if (bedeutung.has(de)) fehler.push(wo + ': dieselbe deutsche Bedeutung wie ' + bedeutung.get(de));
    bedeutung.set(de, s.k);
    if (s.ar !== s.ar.normalize('NFC')) fehler.push(wo + ': nicht in NFC');
    const tokens = s.ar.split(/\s+/).filter(Boolean);
    for (const t of tokens) if (t.replace(TASCHKIL, '') === t) fehler.push(wo + ': „' + t + '" ohne Vokalzeichen');
    if (!mitBuechern) continue;
    const karten = [];
    for (const id of s.w){
      const w = woerter.get(String(id));
      if (!w) fehler.push(wo + ': Kennung ' + id + ' gibt es nicht');
      else karten.push(w);
    }
    for (const t of tokens)
      if (!karten.some(w => passt(t, w))) fehler.push(wo + ': „' + t + '" gehoert zu keiner Kennung in w');
    for (const w of karten)
      if (!tokens.some(t => passt(t, w))) fehler.push(wo + ': Kennung ' + w.id + ' (' + w.ar + ') steht nicht im Satz');
  }
  return fehler;
}

const SAETZE = laden('hoersaetze-data.js', 'HOER_SAETZE');
const { m: WOERTER, buecher } = alleWoerter();
if (!buecher) console.log('  ⚠️ data/vokabeln-*.js fehlen — die Zuordnung zu den Kennungen wird NICHT geprueft.');

const fehler = pruefe(SAETZE, WOERTER, buecher);

/* Stoertests: jeder muss mindestens einen Fehler finden. */
const kopie = () => JSON.parse(JSON.stringify(SAETZE));
const stoer = [
  ['eine Kennung aus w entfernt', () => { const k = kopie(); k[0].w = k[0].w.slice(1); return k; }, true],
  ['ein fremdes Wort im Satz', () => { const k = kopie(); k[1].ar = k[1].ar.replace('؟', ' كَبِيرٌ؟'); return k; }, true],
  ['eine erfundene Kennung', () => { const k = kopie(); k[2].w = [...k[2].w, '99999999']; return k; }, true],
  ['doppelte deutsche Bedeutung', () => { const k = kopie(); k[3].de = k[4].de; return k; }, false],
];
let stoerRot = 0;
for (const [name, bau, brauchtBuecher] of stoer){
  if (brauchtBuecher && !buecher) continue;
  const n = pruefe(bau(), WOERTER, buecher).length;
  if (n > fehler.length) stoerRot++;
  else fehler.push('Stoertest „' + name + '" blieb gruen — der Pruefer prueft das nicht');
}

console.log('  Hoersaetze: ' + SAETZE.length + ' · Stoertests rot: ' + stoerRot);
if (fehler.length){
  for (const f of fehler) console.log('  ✗ ' + f);
  process.exit(1);
}
console.log('  ✓ jeder Satz besteht nur aus Woertern seiner Liste');
