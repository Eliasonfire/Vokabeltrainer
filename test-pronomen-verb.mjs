#!/usr/bin/env node
/* test-pronomen-verb.mjs — bewacht Übung 14 „Pronomen einsetzen" an der Stelle,
 * die v616 geändert hat (25.09.2026): „du", „sie" und „ihr" werden auch dann
 * gefragt, wenn das VERB danach die Person zeigt (أَنْتَ ذَهَبْتَ …).
 *
 * Elias zur Übung (24.09.2026): „… die jeweilis passenden pronomen in den satz
 * einfügen muss und zur auswahl halt alle die ich habe". Vorher hatten 7 der 12
 * Pronomen seiner Karte keinen einzigen Satz, obwohl die Beispielsätze seiner
 * Pronomen-Karten (data/fachbegriffe.js, gram-pron-*) sie enthalten.
 *
 * Bewacht:
 *   1. Jedes der sieben (هُمْ هُنَّ أَنْتَ أَنْتِ أَنْتُمَا أَنْتُمْ أَنْتُنَّ) hat
 *      eine Aufgabe, mit genau diesem Pronomen als Lösung.
 *   2. Die Auflösung nennt das Verb und seine Endung.
 *   3. Die längste Endung gewinnt: ذَهَبْتُمَا gehört zu أَنْتُمَا, nicht zu هُمَا.
 *   4. Keine geratene Aufgabe: nach أَنْتَ ein Präsens (تَذْهَبُ — auch هِيَ) oder
 *      eine fremde Endung (ذَهَبْتِ) → keine Aufgabe.
 * Jede Zusicherung hat einen Störtest am ECHTEN Quelltext (js/uebung.js, im
 * Speicher verändert), der sie rot werden lassen muss.
 *
 *   node test-pronomen-verb.mjs     Exit 0 = alles grün, alle Störtests schlagen an
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const W = path.dirname(fileURLToPath(import.meta.url));
const QUELLE = fs.readFileSync(path.join(W, 'js/uebung.js'), 'utf8');

function stumm(){ return { style:{}, classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } }, dataset:{}, children:[], value:'', textContent:'', innerHTML:'', disabled:false,
  addEventListener(){}, removeEventListener(){}, appendChild(){}, querySelector(){ return null; }, querySelectorAll(){ return []; }, closest(){ return null; },
  getAttribute(){ return null; }, setAttribute(){}, removeAttribute(){}, focus(){}, getBoundingClientRect(){ return { width:0, height:0, top:0, left:0 }; } }; }

/* Die App wie in test-endungen.mjs: seine Kapitelauswahl (.stand-app.json), die
   Buchkarten mit ihren Sätzen und die bestellten Fachbegriffe. */
function lade(uebungQuelle){
  const DOM = { getElementById: stumm, querySelector: stumm, querySelectorAll: () => [], createElement: stumm, addEventListener(){}, body: stumm(), documentElement: stumm() };
  const auswahl = JSON.parse(fs.readFileSync(path.join(W, '.stand-app.json'), 'utf8')).buecher || {};
  const ctx = { window:{ addEventListener(){}, matchMedia(){ return { matches:false, addEventListener(){} }; }, location:{ href:'' }, navigator:{ userAgent:'node', language:'de' }, VOKABELN:{} },
    document: DOM, localStorage:{ _d:{}, getItem(k){ return this._d[k] ?? null; }, setItem(k, v){ this._d[k] = String(v); }, removeItem(k){ delete this._d[k]; } },
    navigator:{ userAgent:'node', language:'de', onLine:true }, console:{ log(){}, warn(){}, error(){}, info(){} },
    Date, Math, JSON, Intl, setTimeout, clearTimeout, setInterval, clearInterval };
  ctx.globalThis = ctx; ctx.self = ctx; ctx.window.document = DOM; ctx.window.localStorage = ctx.localStorage;
  ctx.SETTINGS = { buecher: auswahl, eigene:true, fachbegriffe:true };
  vm.createContext(ctx);
  const DATEIEN = ['vocab-data.js', 'data/beispielsaetze.js', 'data/fachbegriffe.js', 'grammar-data.js', 'lehrbuch-saetze.js', 'regelsammlung-data.js',
    ...fs.readdirSync(path.join(W, 'data')).filter(f => /^vokabeln-.*\.js$/.test(f)).map(f => 'data/' + f),
    'js/irab.js', 'js/saetze.js', 'js/uebersetzen.js', 'js/regeln.js'];
  for (const f of DATEIEN) vm.runInContext(fs.readFileSync(path.join(W, f), 'utf8'), ctx, { filename: f });
  vm.runInContext(uebungQuelle, ctx, { filename: 'js/uebung.js' });
  const hole = n => vm.runInContext(`typeof ${n} !== 'undefined' ? ${n} : undefined`, ctx);
  const VD = hole('VOCAB_DATA'), BS = hole('BEISPIELSAETZE') || {};
  const bekannt = new Set(VD.map(w => String(w.id)));
  for (const [buch, liste] of Object.entries(ctx.window.VOKABELN || {})){
    const kap = auswahl[buch] || [];
    for (const w of liste) if (kap.includes(Number(w.chapter)) && !bekannt.has(String(w.id))){
      const s = BS[w.id] || {};
      VD.push({ ...w, sentAr: w.sentAr || s.sentAr, sentDe: w.sentDe || s.sentDe }); bekannt.add(String(w.id));
    }
  }
  const FV = hole('FACHBEGRIFF_VOKABELN') || [], FA = hole('FACHBEGRIFF_AUFTRAG') || {};
  for (const w of FV) if (Object.prototype.hasOwnProperty.call(FA, String(w.id)) && !bekannt.has(String(w.id))){ VD.push(w); bekannt.add(String(w.id)); }
  vm.runInContext('UEB_WORTGRUPPEN = {}; if (typeof setzeLexikon === "function") setzeLexikon(VOCAB_DATA)', ctx);
  return { hole, ctx };
}

const N = s => String(s).normalize('NFC');
const SIEBEN = ['هُمْ', 'هُنَّ', 'أَنْتَ', 'أَنْتِ', 'أَنْتُمَا', 'أَنْتُمْ', 'أَنْتُنَّ'].map(N);

function pruefe(quelle){
  const f = [];
  let app;
  try { app = lade(quelle); } catch (e){ return ['lädt nicht: ' + e.message]; }
  const { hole } = app;
  const U = (hole('UEBUNGEN') || []).find(u => u.id === 'pronomen');
  const an = hole('analysiereSatz');
  if (!U || !an) return ['Übung 14 oder analysiereSatz fehlt'];
  const aufgaben = s => { try { return U.baue(an(N(s)), { sentAr: N(s), sentDe: '' }) || []; } catch (e){ return []; } };
  /* 1 + 2 — an den Beispielsätzen seiner Karten */
  const karten = (hole('FACHBEGRIFF_VOKABELN') || []).filter(w => /^gram-pron-/.test(String(w.id)));
  for (const p of SIEBEN){
    const k = karten.find(w => N(w.ar) === p);
    if (!k || !k.sentAr){ f.push(`1: keine Karte mit Beispielsatz für ${p}`); continue; }
    const a = aufgaben(k.sentAr).filter(x => N(x.loesung) === p);
    if (!a.length){ f.push(`1: ${p} — keine Aufgabe aus «${k.sentAr}»`); continue; }
    const verb = N(k.sentAr).split(/\s+/)[1];
    if (!a[0].aufloesung.includes(verb)) f.push(`2: ${p} — Auflösung nennt das Verb nicht: ${a[0].aufloesung}`);
  }
  /* 3 */
  const mp = hole('uebMadiPronomen');
  const r = mp && mp(N('ذَهَبْتُمَا'));
  if (!r || r.p !== N('أَنْتُمَا')) f.push(`3: ذَهَبْتُمَا → ${r ? r.p : 'nichts'} statt أَنْتُمَا`);
  /* 4 */
  for (const s of ['أَنْتَ تَذْهَبُ إِلَى الْمَسْجِدِ.', 'أَنْتَ ذَهَبْتِ إِلَى الْمَسْجِدِ.']){
    const a = aufgaben(s).filter(x => N(x.loesung) === N('أَنْتَ'));
    if (a.length) f.push(`4: geratene Aufgabe aus «${s}»`);
  }
  return f;
}

let rot = 0;
const echt = pruefe(QUELLE);
if (echt.length){ console.log('❌ Echter Stand:'); echt.forEach(x => console.log('   ' + x)); rot = 1; }
else console.log('✅ Echter Stand: sieben Pronomen mit Aufgabe, Verb in der Auflösung, längste Endung, nichts geraten.');

const STOER = [
  ['alter Stand: das Verb zählt nicht', 'const m = nomen ? null : uebMadiPronomen(n.wort);', 'const m = null;', /^1:/],
  ['Auflösung ohne Verb', "(verb ? ` Das Verb ${verb.wort} endet auf ${verb.endung}.` : '')", "''", /^2:/],
  ['erste statt längster Endung', 'if (!best || e.length > best.e.length)', 'if (!best)', /^3:/],
  ['jede Verbendung passt', "if (!nomen && !(m && m.p === String(L.form).normalize('NFC'))) return;", 'if (!nomen && !m) return;', /^4:/]
];
for (const [name, alt, neu, muster] of STOER){
  if (!QUELLE.includes(alt)){ console.log(`❌ Störtest „${name}": Stelle nicht gefunden`); rot = 1; continue; }
  const f = pruefe(QUELLE.replace(alt, neu));
  if (f.some(x => muster.test(x))) console.log(`✅ Störtest „${name}" schlägt an (${f.filter(x => muster.test(x)).length})`);
  else { console.log(`❌ Störtest „${name}" schlägt NICHT an`); rot = 1; }
}
process.exit(rot);
