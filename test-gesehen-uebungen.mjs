#!/usr/bin/env node
/* test-gesehen-uebungen.mjs — bewacht: Wurzeltraining, Übungen und Satzmodus nehmen nur Karten dran,
 * die Elias schon gesehen hat (20.10.2026, v703).
 *
 * Elias, mit einem Bild der Hörfrage „schmerzhaft" (20.10.2026, 05:10): „die vokabel hab ich noch nie
 * gesehen. du sollst sichergehen, dass ich wirklich nur die vokabeln dran genommen werden auch an
 * plurals die ich bereits kenne oder zumindest mal gesehen habe. beim hören sind einige diesbezüglich
 * falsch". Der Hörmodus ist seit v702 dicht (werkzeuge/pruefe-hoer-auswahl.mjs). Auf meinen Bericht
 * (Wurzeltraining 351 von 615 nie gesehen, Mehrzahl-Übung 56 von 193, „Die Sätze prüfe ich noch.")
 * kam: „fix das".
 *
 * „Gesehen" = schonGesehen() in js/kern.js (bewertet oder über Box 1) — hier die ECHTE Funktion,
 * geschnitten aus js/kern.js, an Probekarten mit festem Fortschritt. Probekarten in Buckwalter-Umschrift,
 * in Schrift gewandelt über Codepunkte (kein getipptes Arabisch).
 *
 *   G0  Eichung: die Probewelt hat gesehene UND nie gesehene Karten, und schonGesehen() trennt sie.
 *   G1  Übung 18: uebMehrzahlKarten() nimmt nur gesehene Karten.
 *   G2  Übung 15: uebEndungGlieder() nimmt nur gesehene Endungskarten.
 *   G3  Übungen 11/13/14: uebGruppe() nimmt aus der Kartei nur gesehene Karten.
 *   G4  Übung 16: kein Wort, dessen Karte er nie gesehen hat — das gesehene ergibt eine Aufgabe.
 *   G5  Sätze: der Satz einer nie gesehenen Karte fällt weg (auch in alleSaetze()); der einer
 *       gesehenen bleibt, Lehrbuchsätze und Sätze ohne Karte bleiben immer.
 *   G6  Wurzeltraining, Stufe „stand": Vorrat, Familien (auch ein nie gesehenes Lernwort) und Duell
 *       nur aus gesehenen Wörtern; Stufe „alles" bleibt, wie sie war (seine eigene Wahl).
 * Jede Aussage hat einen Störtest am ECHTEN Quelltext (im Speicher verändert), der rot werden muss.
 *
 *   node test-gesehen-uebungen.mjs     Exit 0 = alles grün, alle Störtests schlagen an
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const W = path.dirname(fileURLToPath(import.meta.url));
const lies = p => fs.readFileSync(path.join(W, p), 'utf8');
const UEBUNG = lies('js/uebung.js'), SAETZE = lies('js/saetze.js'), WURZEL = lies('js/wurzel.js'), KERN = lies('js/kern.js');

function fn(q, kopf){
  const a = q.indexOf(kopf);
  if (a < 0) throw new Error('nicht gefunden: ' + kopf);
  let t = 0;
  for (let i = q.indexOf('{', a); i < q.length; i++){ if (q[i] === '{') t++; else if (q[i] === '}'){ t--; if (!t) return q.slice(a, i + 1); } }
  throw new Error('kein Ende: ' + kopf);
}
function bis(q, kopf, ende){ const a = q.indexOf(kopf); if (a < 0) throw new Error('nicht gefunden: ' + kopf); const b = q.indexOf(ende, a); return q.slice(a, b + ende.length); }
/* Was die Übungen aus js/kern.js brauchen (wie test-mehrzahl-einsetzen.mjs), dazu die echte schonGesehen(). */
const KERN_TEILE = [bis(KERN, 'const ZAHLWORT_DE = ', '\n'), fn(KERN, 'function istZahlwort('), bis(KERN, 'const PLURAL_MARKE = ', '\n'), fn(KERN, 'function istPluralKarte('),
  bis(KERN, 'const FORM_TRENNER = ', '\n'), fn(KERN, 'function formen('), bis(KERN, 'const PL_Z = c =>', '\n  return aus;\n}'),
  fn(KERN, 'function schonGesehen('),
  'var PROGRESS = {}; function bekannteVokabeln(){ return VOCAB_DATA.filter(w => istBekannt(w)); }'].join('\n');

/* ---------- Probekarten (Buckwalter → Schrift, als Codepunkte) ---------- */
const BW = { "'": 0x621, '>': 0x623, '&': 0x624, '<': 0x625, '}': 0x626, A: 0x627, b: 0x628, p: 0x629, t: 0x62A, v: 0x62B, j: 0x62C,
  H: 0x62D, x: 0x62E, d: 0x62F, '*': 0x630, r: 0x631, z: 0x632, s: 0x633, $: 0x634, S: 0x635, D: 0x636, T: 0x637, Z: 0x638,
  E: 0x639, g: 0x63A, f: 0x641, q: 0x642, k: 0x643, l: 0x644, m: 0x645, n: 0x646, h: 0x647, w: 0x648, Y: 0x649, y: 0x64A,
  F: 0x64B, N: 0x64C, K: 0x64D, a: 0x64E, u: 0x64F, i: 0x650, '~': 0x651, o: 0x652, _: 0x640 };
const ar = t => [...t].map(c => { if (c === ' ' || c === '/') return c; if (!(c in BW)) throw new Error('kein Buckwalter-Zeichen: ' + c); return String.fromCodePoint(BW[c]); }).join('').normalize('NFC');
const wz = t => [...t].map(c => ar(c)).join(' ');
const PUNKT = '.';

/* Gesehen: richtig > 0, falsch > 0 oder über Box 1. Nie gesehen: Box 1 mit 0/0, oder gar kein Eintrag. */
const GESEHEN = { box: 1, correct: 1, wrong: 0 }, BOX2 = { box: 2, correct: 0, wrong: 0 }, FALSCH = { box: 1, correct: 0, wrong: 1 }, NIE = { box: 1, correct: 0, wrong: 0 };
const nomen = (id, de, sg, pl, wurzel, p, mehr) => ({ karte: { id, de, ar: ar(sg), sg: ar(sg), ...(pl ? { pl: ar(pl) } : {}), root: wurzel ? wz(wurzel) : '', type: 'noun', chapter: 'personal', ...(mehr || {}) }, p });
const PROBE = [
  /* Übung 18 und 16 */
  nomen('m1', 'Lehrer', 'mudar~isN', 'mudar~isuwna', 'drs', GESEHEN),
  nomen('m2', 'Hund', 'kalobN', 'kilAbN', 'klb', NIE),
  nomen('m3', 'Berg', 'jabalN', 'jibAlN', 'jbl', BOX2),
  nomen('m4', 'Herz', 'qalobN', 'quluwbN', 'qlb', null),
  nomen('m5', 'Stift', 'qalamN', '>aqolAmN', 'qlm', FALSCH),
  /* Übung 15 */
  { karte: { id: 'e1', de: 'die Besitzendung „mein" — 1. Person', ar: ar('_iy'), type: 'particle', chapter: 'personal' }, p: GESEHEN },
  { karte: { id: 'e2', de: 'die Besitzendung „dein" — zu einem Mann', ar: ar('_ka'), type: 'particle', chapter: 'personal' }, p: NIE },
  { karte: { id: 'e3', de: 'die Besitzendung „sein"', ar: ar('_hu'), type: 'particle', chapter: 'personal' }, p: BOX2 },
  /* Übungen 11/13/14 (uebGruppe) */
  { karte: { id: 'p1', de: 'er', ar: ar('huwa'), type: 'pronoun', chapter: 'personal' }, p: GESEHEN },
  { karte: { id: 'p2', de: 'sie (Singular)', ar: ar('hiya'), type: 'pronoun', chapter: 'personal' }, p: NIE },
];
const FORTSCHRITT = Object.fromEntries(PROBE.filter(x => x.p).map(x => [x.karte.id, { ...x.p, nextReview: '2026-10-20' }]));

/* Ein DOM, das sich nichts merkt — gebaut wird nur, nicht gezeichnet. */
function stumm(){
  return { style:{}, classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } }, dataset:{}, children:[], value:'', textContent:'', innerHTML:'', className:'', disabled:false, hidden:false,
    addEventListener(){}, removeEventListener(){}, appendChild(){}, querySelector(){ return null; }, querySelectorAll(){ return []; }, closest(){ return null; },
    getAttribute(){ return null; }, setAttribute(){}, removeAttribute(){}, focus(){}, getBoundingClientRect(){ return { width:0, height:0, top:0, left:0, right:0 }; } };
}
function welt(){
  const DOM = { getElementById: stumm, querySelector: stumm, querySelectorAll: () => [], createElement: stumm, addEventListener(){}, body: stumm(), documentElement: stumm() };
  const ctx = { window:{ addEventListener(){}, matchMedia(){ return { matches:false, addEventListener(){} }; }, location:{ href:'' }, navigator:{ userAgent:'node', language:'de' }, VOKABELN:{}, innerWidth: 400 },
    document: DOM, localStorage:{ _d:{}, getItem(k){ return this._d[k] ?? null; }, setItem(k, v){ this._d[k] = String(v); }, removeItem(k){ delete this._d[k]; } },
    navigator:{ userAgent:'node', language:'de', onLine:true }, console:{ log(){}, warn(){}, error(){}, info(){} },
    Date, Math, JSON, Intl, setTimeout, clearTimeout, setInterval, clearInterval };
  ctx.globalThis = ctx; ctx.self = ctx; ctx.window.document = DOM; ctx.window.localStorage = ctx.localStorage;
  ctx.SETTINGS = { buecher: {}, eigene: true, fachbegriffe: true };
  ctx.todayStr = () => '2026-10-20';
  ctx.LS = { get: (k, d) => d, set(){} };
  ctx.shuffle = a => a.slice();
  ctx.toast = () => {};
  ctx.kapitelBeschriftung = () => '';
  ctx.escapeHtml = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  vm.createContext(ctx);
  return ctx;
}

/* ---------- Übungen und Sätze ---------- */
function pruefeUebungen(uebungQ, saetzeQ){
  const f = [];
  const ctx = welt();
  const run = code => vm.runInContext(code, ctx);
  try {
    for (const d of ['vocab-data.js', 'data/beispielsaetze.js', 'data/fachbegriffe.js', 'grammar-data.js', 'lehrbuch-saetze.js', 'regelsammlung-data.js', 'js/irab.js'])
      vm.runInContext(lies(d), ctx, { filename: d });
    vm.runInContext(saetzeQ, ctx, { filename: 'js/saetze.js' });
    for (const d of ['js/uebersetzen.js', 'js/regeln.js']) vm.runInContext(lies(d), ctx, { filename: d });
    vm.runInContext(KERN_TEILE, ctx, { filename: 'js/kern.js (Teile)' });
    vm.runInContext(uebungQ, ctx, { filename: 'js/uebung.js' });
  } catch (e){ return ['lädt nicht: ' + e.message]; }
  const VD = run('VOCAB_DATA');
  VD.length = 0;
  for (const x of PROBE) VD.push(x.karte);
  ctx.istBekannt = () => true;
  ctx.PROGRESS = JSON.parse(JSON.stringify(FORTSCHRITT));
  run('UEBUNG_LEX = null; UEB_WORTGRUPPEN = {}; if (typeof setzeLexikon === "function") setzeLexikon(VOCAB_DATA)');

  /* G0 — Eichung */
  const g = id => run(`schonGesehen(VOCAB_DATA.find(w => w.id === ${JSON.stringify(id)}))`);
  const gesehen = PROBE.filter(x => g(x.karte.id)).map(x => x.karte.id).join(',');
  if (gesehen !== 'm1,m3,m5,e1,e3,p1') f.push('G0: schonGesehen() trennt die Probewelt anders als erwartet: ' + gesehen);

  /* G1 — Übung 18 */
  let mz = [];
  try { mz = run('uebMehrzahlKarten()').map(e => e.karte.id); } catch (e){ f.push('G1: uebMehrzahlKarten() wirft: ' + e.message); }
  if (mz.join(',') !== 'm1,m3,m5') f.push('G1: uebMehrzahlKarten() = ' + mz.join(',') + ' (erwartet m1,m3,m5)');

  /* G2 — Übung 15 */
  let end = [];
  try { end = run('uebEndungGlieder()').map(e => e.de); } catch (e){ f.push('G2: uebEndungGlieder() wirft: ' + e.message); }
  if (end.length !== 2 || end.some(d => /dein/.test(d))) f.push('G2: uebEndungGlieder() = ' + JSON.stringify(end) + ' (erwartet „mein" und „sein", nicht „dein")');

  /* G3 — Übungen 11/13/14 */
  let gr = [];
  try { gr = run('uebGruppe("probe-gruppe", w => w.type === "pronoun")').filter(x => x.gruppe === 'Karte').map(x => x.de); } catch (e){ f.push('G3: uebGruppe() wirft: ' + e.message); }
  if (gr.join('|') !== 'er') f.push('G3: uebGruppe() nimmt ' + JSON.stringify(gr) + ' (erwartet nur „er")');

  /* G4 — Übung 16 */
  const u16 = run('UEBUNGEN.find(u => u.id === "plural")');
  if (!u16) f.push('G4: Übung „plural" fehlt');
  else {
    const baue = wort => { try { return u16.baue([{ wort }], { sentAr: wort, sentDe: '' }) || []; } catch (e){ f.push('G4: baue() wirft: ' + e.message); return []; } };
    if (baue(ar('mudar~isuwna') + PUNKT).length !== 1) f.push('G4: die Mehrzahl einer GESEHENEN Karte ergibt keine Aufgabe (Eichung)');
    if (baue(ar('kilAbN') + PUNKT).length) f.push('G4: die Mehrzahl einer NIE gesehenen Karte ergibt eine Aufgabe');
    if (baue(ar('qalobN') + PUNKT).length) f.push('G4: die Einzahl einer Karte ohne Fortschritt ergibt eine Aufgabe');
  }

  /* G5 — Sätze */
  const nv = s => { try { return run(`nichtVorausgeschrieben(${JSON.stringify(s)})`); } catch (e){ f.push('G5: nichtVorausgeschrieben() wirft: ' + e.message); return null; } };
  if (nv({ id: 'm1', sentAr: 'x' }) !== true) f.push('G5: der Satz einer GESEHENEN Karte fällt weg');
  if (nv({ id: 'm2', sentAr: 'x' }) !== false) f.push('G5: der Satz einer NIE gesehenen Karte bleibt');
  if (nv({ id: 'm4', sentAr: 'x' }) !== false) f.push('G5: der Satz einer Karte ohne Fortschritt bleibt');
  if (nv({ id: 'm2', sentAr: 'x', seite: 12 }) !== true) f.push('G5: ein Lehrbuchsatz fällt weg');
  if (nv({ id: 'satz-lang-probe', sentAr: 'x' }) !== true) f.push('G5: ein Satz ohne Karte fällt weg');
  VD.find(w => w.id === 'm1').sentAr = ar('huwa mudar~isN') + PUNKT;
  VD.find(w => w.id === 'm2').sentAr = ar('huwa kalobN') + PUNKT;
  let ids = [];
  try { ids = run('alleSaetze()').map(s => s.id); } catch (e){ f.push('G5: alleSaetze() wirft: ' + e.message); }
  if (!ids.includes('m1') || ids.includes('m2')) f.push('G5: alleSaetze() enthält ' + (ids.includes('m2') ? 'den Satz der nie gesehenen Karte' : 'den Satz der gesehenen Karte nicht'));
  return f;
}

/* ---------- Wurzeltraining ---------- */
const WURZEL_PROBE = [
  nomen('k1', 'Buch', 'kitAbN', null, 'ktb', GESEHEN, { lern: true }),
  nomen('k2', 'Schreiber', 'kAtibN', null, 'ktb', BOX2),
  nomen('k3', 'Büro', 'makotabN', null, 'ktb', NIE),
  nomen('k4', 'geschrieben', 'makotuwbN', null, 'ktb', null, { lern: true }),
  nomen('k5', 'Lehrer', 'mudar~isN', null, 'drs', GESEHEN, { lern: true }),
  nomen('k6', 'Schule', 'madorasapN', null, 'drs', FALSCH),
  nomen('d1', 'Mann', 'rajulN', null, 'rjl', GESEHEN, { lern: true }),
  nomen('d2', 'Fuß', 'rijolN', null, 'rjl', NIE),
  nomen('d3', 'wer?', 'mano', null, '', GESEHEN, { lern: true }),
  nomen('d4', 'von', 'mino', null, '', BOX2),
];
function pruefeWurzel(wurzelQ){
  const f = [];
  const ctx = welt();
  const run = code => vm.runInContext(code, ctx);
  ctx.VOCAB_DATA = WURZEL_PROBE.map(x => ({ ...x.karte }));
  ctx.LERNBESTAND_IDS = new Set(WURZEL_PROBE.filter(x => x.karte.lern).map(x => x.karte.id));
  ctx.bekannteVokabeln = () => ctx.VOCAB_DATA;
  ctx.buchVokabeln = () => ctx.VOCAB_DATA;
  ctx.PROGRESS = Object.fromEntries(WURZEL_PROBE.filter(x => x.p).map(x => [x.karte.id, { ...x.p }]));
  try {
    vm.runInContext(fn(KERN, 'function schonGesehen('), ctx, { filename: 'js/kern.js (schonGesehen)' });
    vm.runInContext(wurzelQ, ctx, { filename: 'js/wurzel.js' });
  } catch (e){ return ['lädt nicht: ' + e.message]; }
  const stufe = (n, wo) => {
    ctx.SETTINGS.wurzelNiveau = n;
    const vorrat = run('wzVorrat()').map(w => w.id).sort().join(',');
    run('wzBaueFamilien()');
    const fam = {};
    for (const x of run('WZ_FAMILIEN')) fam[x.wurzel] = x.woerter.map(y => y.de + (y.kennst ? '*' : '')).sort().join(',');
    const duell = new Set();
    for (let i = 0; i < 120; i++){ run('WZ_SITZUNG.duelle = {}'); const d = run('wzDuellFuer(WZ_FAMILIEN[0] || { woerter: [] })'); if (d) duell.add(d.skelett); }
    return { vorrat, fam, duell: [...duell].sort().join('|') };
  };
  let s, a;
  try { s = stufe('stand'); a = stufe('alles'); } catch (e){ return ['G6: wirft: ' + e.message]; }
  const ktb = wz('ktb'), drs = wz('drs');
  if (s.vorrat !== 'd1,d3,d4,k1,k2,k5,k6') f.push('G6a: Vorrat auf „stand" = ' + s.vorrat + ' (erwartet d1,d3,d4,k1,k2,k5,k6)');
  if (s.fam[ktb] !== 'Buch*,Schreiber') f.push('G6b: Familie k-t-b auf „stand" = ' + s.fam[ktb] + ' (erwartet Buch*,Schreiber — ohne Büro und ohne das nie gesehene Lernwort)');
  if (s.fam[drs] !== 'Lehrer*,Schule') f.push('G6b: Familie d-r-s auf „stand" = ' + s.fam[drs]);
  const rjl = ar('rjl'), mn = ar('mn');
  if (s.duell.includes(rjl)) f.push('G6c: auf „stand" kommt das Duell mit dem nie gesehenen Wort dran');
  if (!s.duell.includes(mn)) f.push('G6c: auf „stand" kommt das Duell aus zwei gesehenen Wörtern nicht mehr dran (Eichung)');
  if (a.vorrat !== 'd1,d2,d3,d4,k1,k2,k3,k4,k5,k6') f.push('G6d: Vorrat auf „alles" = ' + a.vorrat + ' (erwartet alle zehn)');
  if (a.fam[ktb] !== 'Buch*,Büro,Schreiber,geschrieben*') f.push('G6d: Familie k-t-b auf „alles" = ' + a.fam[ktb]);
  if (!a.duell.includes(rjl)) f.push('G6d: auf „alles" kommt das Duell mit dem nicht gesehenen Wort nicht mehr dran');
  return f;
}

/* ---------- Lauf und Störtests ---------- */
const ersetze = (q, alt, neu, name) => {
  const n = q.split(alt).length - 1;
  if (n !== 1) throw new Error(`Störtest „${name}" greift nicht: Stelle ${n}× gefunden`);
  return q.replace(alt, neu);
};
let rot = 0;
const aussagen = [...pruefeUebungen(UEBUNG, SAETZE), ...pruefeWurzel(WURZEL)];
if (aussagen.length){ rot++; console.log('❌ Am echten Quelltext:'); aussagen.forEach(x => console.log('   ' + x)); }
else console.log('✅ G0–G6 grün am echten Quelltext.');

const STOER = [
  ['S1 Übung 18 ohne Grenze', 'G1', { u: ['    if (!w || !w.pl || (bekannt && !bekannt(w)) || !uebGesehen(w) || istZahlwort(w)) continue;', '    if (!w || !w.pl || (bekannt && !bekannt(w)) || istZahlwort(w)) continue;'] }],
  ['S2 Übung 15 ohne Grenze', 'G2', { u: ['    if (!w || (bekannt && !bekannt(w)) || !uebGesehen(w)) continue;', '    if (!w || (bekannt && !bekannt(w))) continue;'] }],
  ['S3 uebGruppe ohne Grenze', 'G3', { u: ['    if (!w || !w.ar || (bekannt && !bekannt(w)) || !uebGesehen(w) || !passtKarte(w)) continue;', '    if (!w || !w.ar || (bekannt && !bekannt(w)) || !passtKarte(w)) continue;'] }],
  ['S4 Übung 16 ohne Grenze', 'G4', { u: ['        if (!art || !uebGesehen(v)) return null;', '        if (!art) return null;'] }],
  ['S5 uebGesehen() immer wahr', 'G1', { u: ["  return uebMzKern(() => typeof schonGesehen !== 'function' || schonGesehen(w), true);", '  return true;'] }],
  ['S6 Sätze ohne Grenze', 'G5', { s: ['    if (!gesehen) return false;', '    if (!gesehen) return true;'] }],
  ['S7 Wurzel-Vorrat ohne Grenze', 'G6a', { w: [').filter(wzErlaubt);', ');'] }],
  ['S8 Lernwörter ohne Grenze', 'G6b', { w: ['eigenIds.has(w.id) && wzErlaubt(w))', 'eigenIds.has(w.id))'] }],
  ['S9 Duell ohne Grenze', 'G6c', { w: [' && wzErlaubt(d.a) && wzErlaubt(d.b);', ';'] }],
  ['S10 Grenze auch auf „alles"', 'G6d', { w: ["  if (wzNiveau() !== 'stand' || typeof schonGesehen !== 'function') return true;", "  if (typeof schonGesehen !== 'function') return true;"] }],
];
for (const [name, ziel, aend] of STOER){
  let fehl;
  try {
    const u = aend.u ? ersetze(UEBUNG, ...aend.u, name) : UEBUNG;
    const s = aend.s ? ersetze(SAETZE, ...aend.s, name) : SAETZE;
    const w = aend.w ? ersetze(WURZEL, ...aend.w, name) : WURZEL;
    fehl = (aend.w ? pruefeWurzel(w) : pruefeUebungen(u, s));
  } catch (e){ rot++; console.log(`❌ ${name}: ${e.message}`); continue; }
  const getroffen = fehl.some(x => x.startsWith(ziel + ':') || x.startsWith(ziel + ' '));
  if (getroffen) console.log(`✅ ${name}: rot (${fehl.filter(x => x.startsWith(ziel)).length}× ${ziel})`);
  else { rot++; console.log(`❌ ${name}: bleibt grün in ${ziel}` + (fehl.length ? ' — andere Meldungen: ' + fehl.slice(0, 2).join(' | ') : '')); }
}
console.log(rot ? `\n❌ ${rot} Befund(e).` : `\n✅ Alles grün: 7 Aussagen, ${STOER.length} Störtests schlagen an.`);
process.exit(rot ? 1 : 0);
