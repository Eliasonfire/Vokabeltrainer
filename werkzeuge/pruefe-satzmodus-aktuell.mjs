#!/usr/bin/env node
/* pruefe-satzmodus-aktuell.mjs — hält der Satzmodus mit seinen Vokabeln Schritt?
 * ==========================================================================
 *
 * Elias am 24.09.2026 (Goal „Satzmodus und alle Modi aktuell halten"):
 *   „ich möchte das das automatisch geguckt wird ob man den satzmodus mit
 *    etwas erweitern kann. du sollst automatisch das machen und die app immer
 *    aktuell halten. ich denke die routinen für mittwoch und sonntag bieten
 *    sich dafür gut an. … jemand soll auch prüfen ob es immer aktuell sind die
 *    sätze und ob neue vokabeln sowohl innerhalb der übung bzw fragestellung
 *    als auch der beispielsätze und auswahlmöglichkeiten gibt"
 *
 * Vier Teile, gemessen an der App selbst (vm, derselbe Kontext wie
 * pruefe-uebersetzen.mjs) und an SEINER Kapitelauswahl (.stand-app.json):
 *
 *   A  Jede Form seiner Regelkarten — Hinweiswörter (Übung 11), Fragewörter
 *      (14), Pronomen (15) — steht in der Auswahl ihrer Übung und wird
 *      mindestens einmal gefragt. Eine Form ohne Satz ist ein Befund (Exit 2):
 *      dafür fehlt ein belegter Satz.
 *   B  Jede Aufgabe dieser drei Übungen hat ihre Lösung in der Auswahl, keine
 *      Auswahl nennt ein Wort zweimal, und bei den Fragewörtern steht neben der
 *      Lösung kein zweites Wort derselben Bedeutung („was?" = مَا und مَاذَا).
 *      Verstoß = Exit 1.
 *   C  Balance: wie viel Prozent der Sätze enthalten ein Wort aus seinen
 *      NEUESTEN Kapiteln (höchstes Kapitel je Buch seiner Auswahl)? 0 % ist ein
 *      Befund (Exit 2). Der Richtwert „etwa jeder fünfte Satz" ist MEIN
 *      Vorschlag, nicht seiner — deshalb nur Anzeige, keine Grenze.
 *   D  Welche Wörter der neuesten Kapitel stehen in KEINEM Satz des
 *      Satzmodus? Die Liste ist Arbeit für die Wartung (Mi/So), kein Fehler.
 *
 * ⚠️ Was er „einzeln frei" geschaltet hat, steht nur in seinem Browser — hier
 * zählt nur die Kapitelauswahl. [[einzeln_frei_ist_nur_im_browser]]
 *
 * Aufruf:  node werkzeuge/pruefe-satzmodus-aktuell.mjs            Bericht
 *          node werkzeuge/pruefe-satzmodus-aktuell.mjs --stoertest drei Störungen
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STOER = process.argv.includes('--stoertest');

function stummesElement(){
  return { style:{}, classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    dataset:{}, children:[], value:'', textContent:'', innerHTML:'', disabled:false,
    addEventListener(){}, removeEventListener(){}, appendChild(){}, querySelector(){ return null; },
    querySelectorAll(){ return []; }, closest(){ return null; }, getAttribute(){ return null; },
    setAttribute(){}, focus(){}, getBoundingClientRect(){ return {width:0,height:0,top:0,left:0}; } };
}

/* Die App laden, wie der Browser es tut — plus die Buchkarten seiner Auswahl
   mit ihren Sätzen aus data/beispielsaetze.js (so kommen sie auch in der App
   in den Satzmodus). */
function ladeApp(){
  const DOM = { getElementById: stummesElement, querySelector: stummesElement, querySelectorAll: () => [],
    createElement: stummesElement, addEventListener(){}, body: stummesElement(), documentElement: stummesElement() };
  const auswahl = JSON.parse(fs.readFileSync(path.join(WURZEL, '.stand-app.json'), 'utf8')).buecher || {};
  const ctx = {
    window:{ addEventListener(){}, matchMedia(){ return { matches:false, addEventListener(){} }; },
      location:{ href:'' }, navigator:{ userAgent:'node', language:'de' }, VOKABELN:{} },
    document: DOM,
    localStorage:{ _d:{}, getItem(k){ return this._d[k] ?? null; }, setItem(k,v){ this._d[k] = String(v); }, removeItem(k){ delete this._d[k]; } },
    navigator:{ userAgent:'node', language:'de', onLine:true },
    console:{ log(){}, warn(){}, error(){}, info(){} }, Date, Math, JSON, Intl, setTimeout, clearTimeout, setInterval, clearInterval
  };
  ctx.globalThis = ctx; ctx.self = ctx; ctx.window.document = DOM; ctx.window.localStorage = ctx.localStorage;
  ctx.SETTINGS = { buecher: auswahl, eigene:true, fachbegriffe:true };
  vm.createContext(ctx);
  const DATEIEN = ['vocab-data.js', 'data/beispielsaetze.js', 'data/fachbegriffe.js', 'grammar-data.js',
    'lehrbuch-saetze.js', 'regelsammlung-data.js',
    ...fs.readdirSync(path.join(WURZEL, 'data')).filter(f => /^vokabeln-.*\.js$/.test(f)).map(f => 'data/' + f),
    'js/irab.js', 'js/saetze.js', 'js/uebersetzen.js', 'js/uebung.js'];
  const fehlt = [];
  for (const f of DATEIEN){
    try { vm.runInContext(fs.readFileSync(path.join(WURZEL, f), 'utf8'), ctx, { filename: f }); }
    catch (e){ fehlt.push(f + ': ' + e.message); }
  }
  const hole = n => { try { return vm.runInContext(`typeof ${n} !== 'undefined' ? ${n} : undefined`, ctx); } catch (e){ return undefined; } };
  const VD = hole('VOCAB_DATA'), BS = hole('BEISPIELSAETZE') || {};
  const bekannt = new Set(VD.map(w => String(w.id)));
  for (const [buch, liste] of Object.entries(ctx.window.VOKABELN || {})){
    const kap = auswahl[buch] || [];
    for (const w of liste) if (kap.includes(Number(w.chapter)) && !bekannt.has(String(w.id))){
      const s = BS[w.id] || {};
      VD.push({ ...w, sentAr: w.sentAr || s.sentAr, sentDe: w.sentDe || s.sentDe });
      bekannt.add(String(w.id));
    }
  }
  ctx.istBekannt = w => !!w && (w.chapter === 'personal' || bekannt.has(String(w.id)));
  return { ctx, hole, auswahl, fehlt };
}

const nackt = s => String(s || '').replace(/[\u064B-\u0652\u0670\u0640]/g, '').replace(/[أإآٱ]/g, 'ا')
  .replace(/[.،؟?!«»:؛"„“”()]/g, '').trim();
const kern = s => nackt(s).replace(/^(و|ف|ب|ل)?(ال)?/, '');

function messen(app){
  const { hole, auswahl } = app;
  const UEB = hole('UEBUNGEN') || [], analysiere = hole('analysiereSatz');
  vm.runInContext('UEB_WORTGRUPPEN = {}', app.ctx);
  const pool = hole('alleSaetze')();
  const zerlegt = pool.map(s => { try { return { s, z: analysiere(s.sentAr) }; } catch (e){ return { s, z: null }; } });
  const ergebnis = { pool: pool.length, uebungen: {}, verstoesse: [] };
  for (const [id, karte] of [['isara', 'f19-isara'], ['fragewort', 'f19-fragen'], ['pronomen', 'f19-pronomen']]){
    const U = UEB.find(u => u.id === id);
    const glieder = hole('uebKartenGlieder')(karte);
    const gefragt = new Map(glieder.map(g => [g.form, 0]));
    let aufgaben = 0;
    for (const { s, z } of zerlegt){
      if (!z || !U) continue;
      let a = []; try { a = U.baue(z, s) || []; } catch (e){ ergebnis.verstoesse.push(`${id}: baue() wirft — ${e.message}`); }
      for (const x of a){
        aufgaben++;
        if (gefragt.has(x.loesung)) gefragt.set(x.loesung, gefragt.get(x.loesung) + 1);
        const werte = x.optionen.map(o => o.wert);
        if (!werte.includes(x.loesung)) ergebnis.verstoesse.push(`${id}: Lösung fehlt in der Auswahl — ${s.id || s.sentAr}`);
        if (new Set(werte).size !== werte.length) ergebnis.verstoesse.push(`${id}: ein Wort steht zweimal zur Wahl — ${s.id || s.sentAr}`);
        if (id === 'fragewort'){
          const bed = hole('uebBedeutung'), gl = glieder.concat(hole('uebGruppe')(karte, () => false));
          const deVon = w => (gl.find(g => g.form === w) || {}).de;
          if (x.optionen.some(o => o.wert !== x.loesung && bed(deVon(o.wert)) === bed(deVon(x.loesung))))
            ergebnis.verstoesse.push(`fragewort: zwei Wörter „${deVon(x.loesung)}" zur Wahl — ${s.id || s.sentAr}`);
        }
      }
    }
    ergebnis.uebungen[id] = { nr: U && U.nr, aufgaben, formen: glieder.length,
      ohneSatz: [...gefragt].filter(([, n]) => !n).map(([f]) => ({ form: f, de: (glieder.find(g => g.form === f) || {}).de })) };
  }
  // C + D: neueste Kapitel = höchstes Kapitel je Buch seiner Auswahl
  const neueste = Object.entries(auswahl).filter(([, k]) => k.length).map(([b, k]) => [b, Math.max(...k)]);
  const VD = hole('VOCAB_DATA');
  const neu = VD.filter(w => neueste.some(([b, k]) => w.book === b && Number(w.chapter) === k));
  const neuKern = new Map();
  for (const w of neu) for (const f of [w.ar, w.sg, w.pl, w.femSg].filter(Boolean)) for (const t of String(f).split('/')) neuKern.set(kern(t), w);
  let mitNeu = 0; const getroffen = new Set();
  for (const { s } of zerlegt){
    const worte = String(s.sentAr).split(/\s+/).map(kern);
    const t = worte.filter(k => k.length > 1 && neuKern.has(k));
    if (t.length){ mitNeu++; t.forEach(k => getroffen.add(String(neuKern.get(k).id))); }
  }
  ergebnis.neueste = neueste; ergebnis.neuWoerter = neu.length;
  ergebnis.anteil = pool.length ? Math.round(1000 * mitNeu / pool.length) / 10 : 0;
  ergebnis.mitNeu = mitNeu;
  ergebnis.ohneSatzNeu = neu.filter(w => !getroffen.has(String(w.id))).map(w => `${w.de} (${w.book} K${w.chapter}, ${w.id})`);
  return ergebnis;
}

function bericht(e){
  const z = [];
  z.push(`Satzvorrat: ${e.pool} Sätze (seine Auswahl: ${e.neueste.map(([b, k]) => `${b} bis K${k}`).join(', ')})`);
  for (const [id, u] of Object.entries(e.uebungen)){
    z.push(`Übung ${u.nr} ${id}: ${u.aufgaben} Aufgaben · ${u.formen} Formen auf seiner Karte · ohne Satz: ${u.ohneSatz.length ? u.ohneSatz.map(x => `„${x.de}"`).join(', ') : '—'}`);
  }
  z.push(`Balance: ${e.anteil} % der Sätze (${e.mitNeu} von ${e.pool}) enthalten ein Wort aus den neuesten Kapiteln — Richtwert (MEIN Vorschlag): etwa 20 %`);
  z.push(`Neueste Kapitel: ${e.neuWoerter} Wörter, davon ${e.ohneSatzNeu.length} in keinem Satz` + (e.ohneSatzNeu.length ? ':\n   ' + e.ohneSatzNeu.slice(0, 40).join('\n   ') : ''));
  return z.join('\n');
}

const app = ladeApp();
if (app.fehlt.length){ console.log('⛔ Ladefehler:\n  ' + app.fehlt.join('\n  ')); process.exit(1); }

if (STOER){
  let rot = 0;
  const ok = (name, bedingung) => { console.log(`${bedingung ? '✔' : '✘'} Störtest: ${name}`); if (!bedingung) rot++; };
  // 1. Eine erfundene Form auf seiner Karte, zu der es keinen Satz gibt → Teil A muss sie nennen.
  const karten = app.hole('FOLGE19_KARTEN');
  const isara = karten.find(k => k.id === 'f19-isara');
  isara.gruppen[0].merkmale.push('\u0630\u064E\u064A\u0652\u0646\u0650\u0643\u064E – Störtest-Form');
  let e = messen(app);
  ok('erfundene Kartenform ohne Satz wird gemeldet', e.uebungen.isara.ohneSatz.some(x => x.de === 'Störtest-Form'));
  isara.gruppen[0].merkmale.pop();
  // 2. Eine Übung, deren Aufgabe die Lösung nicht zur Wahl stellt → Teil B muss rot werden.
  const U = app.hole('UEBUNGEN').find(u => u.id === 'pronomen'), echt = U.baue;
  U.baue = function(z, s){ return (echt.call(this, z, s) || []).map(a => ({ ...a, optionen: a.optionen.filter(o => o.wert !== a.loesung).concat([{ wert: 'x', text: 'x' }]) })); };
  e = messen(app);
  ok('Lösung fehlt in der Auswahl → Verstoß', e.verstoesse.some(v => v.startsWith('pronomen: Lösung fehlt')));
  U.baue = echt;
  // 3. Ein neuestes Kapitel ohne ein einziges Wort im Satzvorrat → Teil C meldet 0 %.
  const alt = JSON.stringify(app.auswahl);
  for (const b of Object.keys(app.auswahl)) app.auswahl[b] = [999];
  e = messen(app);
  ok('Balance 0 % wird erkannt', e.anteil === 0);
  Object.assign(app.auswahl, JSON.parse(alt));
  console.log(rot ? `\n⛔ ${rot} Störtest(s) schlagen NICHT an` : '\n✅ alle 3 Störtests schlagen an');
  process.exit(rot ? 1 : 0);
}

const e = messen(app);
console.log(bericht(e));
if (e.verstoesse.length){ console.log('\n⛔ ' + e.verstoesse.length + ' Verstöße:\n  ' + e.verstoesse.slice(0, 20).join('\n  ')); process.exit(1); }
const luecken = Object.values(e.uebungen).reduce((n, u) => n + u.ohneSatz.length, 0) + (e.anteil === 0 ? 1 : 0);
console.log(luecken ? `\n⚠️ ${luecken} Lücke(n) — Arbeit für die Wartung (Mi/So), kein Werkzeugfehler` : '\n✅ alles aktuell');
process.exit(luecken ? 2 : 0);
