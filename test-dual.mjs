#!/usr/bin/env node
/* test-dual.mjs — bewacht die Dualformen, die BEREIT, aber AUS sind (20.10.2026).
 *
 * Elias, 20.10.2026, 01:53: „es wäre auch wichtig, dass ich für alle wörter die dual formen habe."
 * und 01:55: „du sollst es erstmal bereit machen aber ich will erstmal mich nur auf singular und
 * plural konzentrieren".
 *
 * Die Regel aus seinem Buch: Madina-Schlüssel Band 2, Lektion 20, PDF-Seite 89 — „Die marfūʿ Endung
 * im Dual ist (-āni), und die manṣūb und majrūr Endung ist (-aini)", Beispiele riyālāni/riyālayni,
 * kitābayni, yawmayni, mudarrisāni jadīdāni, ghurfatāni kabīratāni. Die Probeformen stehen hier in
 * Buckwalter-Umschrift und werden über Codepunkte zu Schrift (kein getipptes Arabisch).
 *
 *   D1  Die Beispiele des Buchs kommen genau so heraus (Nominativ und Genitiv/Akkusativ),
 *       ta marbuta wird zum ta; die Schadda am Ende bleibt.
 *   D2  Kein Raten: ab/akh, Alif oder Hamza am Ende, Manqūṣ, Endung ā, Diptoton, Artikel, Verb,
 *       Zahlwort, Mehrzahlkarte und zwei Formen ergeben KEINE Form — mit dem richtigen Grund.
 *   D3  Die Karte: Kennung „<id>#du", deutsche Zeile „zwei …" beim Nomen, „… (Dual)" sonst.
 *   D4  AUS: dualKartenStufe() ist false, und kein Quelltext unter js/ ruft baueDualKarte() oder
 *       dualFormen() außerhalb von js/kern.js auf — keine Dualkarte in Runde, Liste, Suche.
 * Jede Aussage hat einen Störtest am echten Quelltext (im Speicher verändert), der rot werden muss.
 *
 *   node test-dual.mjs     Exit 0 = alles grün, alle Störtests schlagen an
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { ohneKommentareUndTexte } from './werkzeuge/js-quelltext.mjs';

const W = path.dirname(fileURLToPath(import.meta.url));
const lies = p => fs.readFileSync(path.join(W, p), 'utf8');
const KERN = lies('js/kern.js');
function fn(q, kopf){
  const a = q.indexOf(kopf);
  if (a < 0) throw new Error('nicht gefunden: ' + kopf);
  let t = 0;
  for (let i = q.indexOf('{', a); i < q.length; i++){ if (q[i] === '{') t++; else if (q[i] === '}'){ t--; if (!t) return q.slice(a, i + 1); } }
  throw new Error('kein Ende: ' + kopf);
}
function bis(q, kopf, ende){ const a = q.indexOf(kopf); if (a < 0) throw new Error('nicht gefunden: ' + kopf); const b = q.indexOf(ende, a); return q.slice(a, b + ende.length); }
function dualTeil(q){
  const a = q.indexOf('const DUAL_MARKE = ');
  const ende = fn(q, 'function baueDualKarte(');
  const b = q.indexOf(ende) + ende.length;
  if (a < 0 || b <= a) throw new Error('Dual-Teil nicht gefunden');
  return q.slice(a, b);
}

const BW = { "'": 0x621, '>': 0x623, '&': 0x624, '<': 0x625, '}': 0x626, A: 0x627, b: 0x628, p: 0x629, t: 0x62A, v: 0x62B, j: 0x62C,
  H: 0x62D, x: 0x62E, d: 0x62F, '*': 0x630, r: 0x631, z: 0x632, s: 0x633, $: 0x634, S: 0x635, D: 0x636, T: 0x637, Z: 0x638,
  E: 0x639, g: 0x63A, f: 0x641, q: 0x642, k: 0x643, l: 0x644, m: 0x645, n: 0x646, h: 0x647, w: 0x648, Y: 0x649, y: 0x64A,
  F: 0x64B, N: 0x64C, K: 0x64D, a: 0x64E, u: 0x64F, i: 0x650, '~': 0x651, o: 0x652 };
const ar = t => [...t].map(c => { if (c === ' ' || c === '/') return c; if (!(c in BW)) throw new Error('kein Buckwalter-Zeichen: ' + c); return String.fromCodePoint(BW[c]); }).join('').normalize('NFC');

const karte = (id, de, sg, type, mehr) => ({ id, de, ar: ar(sg), sg: ar(sg), type: type || 'noun', chapter: 1, book: 'probe', ...(mehr || {}) });
/* [Karte, Nominativ, Genitiv/Akkusativ] — „Quelle" = Beispiel aus dem Buch, sonst dieselbe Regel. */
const GUT = [
  [karte('b1', 'Buch', 'kitAbN'), 'kitAbaAni', 'kitAbayoni'],                                  // Quelle: kitābayni
  [karte('b2', 'Zimmer', 'gurofapN'), 'gurofataAni', 'gurofatayoni'],                          // Quelle: ghurfatāni
  [karte('b3', 'groß (weiblich)', 'kabiyrapN', 'adjective'), 'kabiyrataAni', 'kabiyratayoni'],  // Quelle: kabīratāni
  [karte('b4', 'Lehrer', 'mudar~isN'), 'mudar~isaAni', 'mudar~isayoni'],                       // Quelle: mudarrisāni
  [karte('b5', 'neu', 'jadiydN', 'adjective'), 'jadiydaAni', 'jadiydayoni'],                   // Quelle: jadīdāni
  [karte('b6', 'Tag', 'yawomN'), 'yawomaAni', 'yawomayoni'],                                   // Quelle: yawmayni
  [karte('b7', 'Riyal', 'riyAlN'), 'riyAlaAni', 'riyAlayoni'],                                 // Quelle: riyālāni, riyālayni
  [karte('b8', 'Recht', 'Haq~N'), 'Haq~aAni', 'Haq~ayoni'],                                    // Schadda bleibt
  [karte('b9', 'Stuhl', 'kurosiy~N'), 'kurosiy~aAni', 'kurosiy~ayoni'],
];
const NEIN = [
  [karte('n1', 'Bruder', '>axN'), 'ab oder akh'],
  [karte('n2', 'Vater', '>abN'), 'ab oder akh'],
  [karte('n3', 'Himmel', "samA'N"), 'Alif oder Hamza am Ende'],
  [karte('n4', 'Fehler', 'xaTa>N'), 'Alif oder Hamza am Ende'],
  [karte('n5', 'Richter', 'qADK'), 'ohne Tanwin Damma'],
  [karte('n6', 'Stock', 'EaSFA'), 'ohne Tanwin Damma'],
  [karte('n7', 'Krankenhaus', 'musota$ofaY'), 'ohne Tanwin Damma'],
  [karte('n8', 'rot', '>aHomaru', 'adjective'), 'ohne Tanwin Damma'],
  [karte('n9', 'das Buch', 'AlokitAbu'), 'ohne Tanwin Damma'],
  [karte('n10', 'schreiben', 'kataba', 'verb'), 'kein Nomen oder Adjektiv'],
  [karte('n11', 'fünf', 'xamosapN'), 'Zahlwort'],
  [karte('n12#pl', 'Bücher (Plural)', 'kutubN', 'noun', { istPlural: true }), 'Mehrzahl- oder Dualkarte'],
  [karte('n13', 'Haus', 'buyuwtN / >aboyAtN'), 'mehrere Wörter oder Formen'],
  [karte('gram-probe', 'Genitivverbindung', '<iDAfapN'), 'Fachbegriff'],
];

function pruefe(kern, aufrufer){
  const f = [];
  const ctx = { console, String, RegExp, Array, Object };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  ctx.deMehrzahl = w => (w && w.de === 'Buch') ? 'Bücher' : null;
  try {
    vm.runInContext([bis(kern, 'const ZAHLWORT_DE = ', '\n'), fn(kern, 'function istZahlwort('), dualTeil(kern),
      'var __pruef = { dualPruefen, dualFormen, baueDualKarte, dualKartenStufe, istDualKarte };'].join('\n'), ctx, { filename: 'js/kern.js (Teile)' });
  } catch (e){ return ['lädt nicht: ' + e.message]; }
  const D = ctx.__pruef;
  /* D1 */
  for (const [k, nom, gen] of GUT){
    const r = D.dualFormen(k);
    if (!r) { f.push(`D1: ${k.de}: keine Form (${(D.dualPruefen(k) || {}).grund})`); continue; }
    if (r.nom !== ar(nom)) f.push(`D1: ${k.de}: Nominativ falsch`);
    if (r.gen !== ar(gen)) f.push(`D1: ${k.de}: Genitiv/Akkusativ falsch`);
  }
  /* D2 */
  for (const [k, grund] of NEIN){
    const r = D.dualPruefen(k) || {};
    if (r.nom) f.push(`D2: ${k.de}: eine Form gebildet, obwohl unsicher`);
    else if (!String(r.grund || '').startsWith(grund)) f.push(`D2: ${k.de}: Grund „${r.grund}" statt „${grund}"`);
  }
  /* D3 */
  const kb = D.baueDualKarte(GUT[0][0]), kj = D.baueDualKarte(GUT[4][0]);
  if (!kb || kb.id !== 'b1#du' || kb.de !== 'zwei Bücher' || kb.ar !== ar('kitAbaAni') || kb.arGen !== ar('kitAbayoni') || kb.dualVon !== 'b1' || !kb.istDual) f.push('D3: Karte „Buch" falsch gebaut: ' + JSON.stringify(kb));
  if (!kj || kj.de !== 'neu (Dual)') f.push('D3: Karte „neu" heißt ' + (kj && kj.de));
  if (D.baueDualKarte(NEIN[0][0]) !== null) f.push('D3: unsichere Form ergibt eine Karte');
  if (!D.istDualKarte('b1#du') || D.istDualKarte('b1#pl')) f.push('D3: istDualKarte() trennt nicht');
  /* D4 */
  if (D.dualKartenStufe() !== false) f.push('D4: dualKartenStufe() ist nicht false — er hat „noch nicht" gesagt');
  for (const [datei, text] of aufrufer){
    /* Kommentare zählen nicht (der Kopf über DUAL_MARKE nennt die Funktionen beim Namen). */
    const ohneDef = ohneKommentareUndTexte(datei === 'js/kern.js' ? text.replace(dualTeil(text), '') : text, { texte: false });
    if (/\b(baueDualKarte|dualFormen|dualPruefen)\s*\(/.test(ohneDef)) f.push(`D4: ${datei} ruft die Dualformen auf — sie sind noch AUS`);
  }
  return f;
}

const JS = fs.readdirSync(path.join(W, 'js')).filter(d => d.endsWith('.js')).map(d => ['js/' + d, lies('js/' + d)]);
let rot = 0;
const echt = pruefe(KERN, JS);
if (echt.length){ rot++; console.log('❌ Am echten Quelltext:'); echt.forEach(x => console.log('   ' + x)); }
else console.log(`✅ D1–D4 grün: ${GUT.length} Formen wie im Buch, ${NEIN.length} unsichere Fälle ohne Form, Dual AUS.`);

const ersetze = (q, alt, neu, name) => { const n = q.split(alt).length - 1; if (n !== 1) throw new Error(`Störtest „${name}" greift nicht: Stelle ${n}× gefunden`); return q.replace(alt, neu); };
const STOER = [
  ['S1 ta marbuta bleibt', 'D1', '  if (letzter === DUAL_Z(0x629)) stamm = basis.slice(0, -1) + DUAL_Z(0x62A);\n', ''],
  ['S2 Genitiv mit -āni', 'D1', 'DUAL_Z(0x64A) + DUAL_Z(0x652) + DUAL_Z(0x646)', 'DUAL_Z(0x627) + DUAL_Z(0x646)'],
  ['S3 ohne Tanwin-Prüfung', 'D2', "  if (!zeichen.includes(DUAL_Z(0x64C))) return", '  if (false) return'],
  ['S4 ab/akh nicht gesperrt', 'D2', '[[0x623, 0x628], [0x623, 0x62E], [0x627, 0x628], [0x627, 0x62E]]', '[]'],
  ['S5 Dual eingeschaltet', 'D4', '  return false;\n}\n/* → { nom, gen }', '  return true;\n}\n/* → { nom, gen }'],
  ['S6 Schadda fällt weg', 'D1', '  if (zeichen.includes(DUAL_Z(0x651))) stamm += DUAL_Z(0x651);\n', ''],
  ['S7 Hamza am Ende erlaubt', 'D2', '.map(DUAL_Z).includes(letzter)) return', '.map(DUAL_Z).includes(letzter) && false) return'],
  ['S8 jede Wortart', 'D2', "  if (!['noun', 'adjective'].includes(w.type)) return", '  if (false) return'],
  ['S10 Fachbegriffe bekommen einen Dual', 'D2', "  if (/^gram-/.test(id)) return", '  if (false) return'],
];
for (const [name, ziel, alt, neu] of STOER){
  let fehl;
  try { fehl = pruefe(ersetze(KERN, alt, neu, name), JS); } catch (e){ rot++; console.log(`❌ ${name}: ${e.message}`); continue; }
  if (fehl.some(x => x.startsWith(ziel + ':'))) console.log(`✅ ${name}: rot (${fehl.filter(x => x.startsWith(ziel)).length}× ${ziel})`);
  else { rot++; console.log(`❌ ${name}: bleibt grün in ${ziel}`); }
}
/* S9: ein Aufruf in einer anderen Datei muss D4 rot machen. */
{
  const fehl = pruefe(KERN, [...JS, ['js/probe-aufrufer.js', 'VOCAB_DATA.push(baueDualKarte(w));']]);
  if (fehl.some(x => x.startsWith('D4:'))) console.log('✅ S9 Dualkarte eingehängt: rot (D4)');
  else { rot++; console.log('❌ S9 Dualkarte eingehängt: bleibt grün in D4'); }
}
console.log(rot ? `\n❌ ${rot} Befund(e).` : `\n✅ Alles grün: 4 Aussagen, ${STOER.length + 1} Störtests schlagen an.`);
process.exit(rot ? 1 : 0);
