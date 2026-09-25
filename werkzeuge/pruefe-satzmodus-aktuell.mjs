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
 *   E  Jede Antwort ungefähr gleich oft, in JEDER Auswahl-Übung (Elias,
 *      25.09.2026: „es sollen bewusst ungefähr gleichviele von jeder antwort
 *      geben damit jede antwort gleich oft ungefähr drankommt" · „das sollte
 *      auch bei den anderen aufgaben so sein mit reihum"): in den ersten k
 *      Aufgaben — k = Zahl der verschiedenen Lösungen — steht jede Lösung genau
 *      einmal (uebungMischen in js/uebung.js). Verstoß = Exit 1.
 *   F  Genitiv (Elias, 25.09.2026: „es sollen mehrere sein im genitiv aus
 *      unterschiedlichsten gründen. lasse auch bei den genitiv präpositionen
 *      immer durchrutieren sodass ich jede mal sehe"): jede Aufgabe von
 *      Übung 5 hat mindestens zwei Wörter im Genitiv aus mindestens zwei
 *      Gründen, und in Übung 4 und 5 kommt in den ersten k Aufgaben jede der
 *      k Präpositionen/ظُرُوف einmal. Verstoß = Exit 1. Welche seiner acht
 *      Präpositionen (Karte f19-jarr) in Übung 5 noch fehlen, steht im
 *      Bericht — Arbeit für neue Sätze aus seinen Büchern.
 *   G  Die Tanwīn-Namen heißen auf „-tayn" (Elias, 25.09.2026: „bei den
 *      antworten mit tanweed sollte so dummatayn, kasratayn, fathatayn stehen
 *      und nicht tan"). Verstoß = Exit 1.
 *
 * ⚠️ Was er „einzeln frei" geschaltet hat, steht nur in seinem Browser — hier
 * zählt nur die Kapitelauswahl. [[einzeln_frei_ist_nur_im_browser]]
 *
 * Aufruf:  node werkzeuge/pruefe-satzmodus-aktuell.mjs            Bericht
 *          node werkzeuge/pruefe-satzmodus-aktuell.mjs --stoertest acht Störungen
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
  /* ⛔ Wie uebungenAufbauen(): erst das Lexikon aus seinem Wortschatz. Ohne das
     (bis 25.09.2026) galten Verben seiner neuesten Kapitel nicht als Verb — in
     „نَظَرَ الطَّالِبُ إِلَى النَّجْمِ." wurde الطَّالِبُ zum مُضَاف إِلَيْه. */
  vm.runInContext('if (typeof setzeLexikon === "function") setzeLexikon(VOCAB_DATA)', app.ctx);
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
  // E: in JEDER Auswahl-Übung (art 'wahl') jede Antwort ungefähr gleich oft —
  // die ersten k Aufgaben haben k verschiedene Lösungen (uebungMischen).
  const mischen = hole('uebungMischen');
  ergebnis.gleichOft = [];
  /* ⭐ Und je Antwort gleich viele (Elias, 25.09.2026: „wenn es ingesamt 30
     sätze zu dieser übung gibt dann sollte jede antwort 10 sätze haben"): in der
     gemischten Runde hat jede Antwort min(Vorrat, Deckel) Aufgaben, Deckel =
     die seltenste, aber mindestens UEB_JE_ANTWORT_MIN. */
  const MIN_JE = hole('UEB_JE_ANTWORT_MIN') || 10;
  ergebnis.jeAntwort = [];
  const gleichViele = (U, liste, schluessel) => {
    if (!mischen || !liste.length) return;
    const voll = new Map(), runde = new Map();
    for (const x of liste){ const k = schluessel(x); voll.set(k, (voll.get(k) || 0) + 1); }
    for (const x of mischen(U, liste)){ const k = schluessel(x); runde.set(k, (runde.get(k) || 0) + 1); }
    const deckel = Math.max(Math.min(...voll.values()), MIN_JE);
    for (const [k, v] of voll) if ((runde.get(k) || 0) !== Math.min(v, deckel))
      ergebnis.verstoesse.push(`${U.id}: nicht je Antwort gleich viele — „${k}" ${runde.get(k) || 0} statt ${Math.min(v, deckel)}`);
    const unter = [...voll].filter(([, v]) => v < MIN_JE).map(([k, v]) => `${k} ${v}`);
    ergebnis.jeAntwort.push(`${U.nr}: je ${deckel}` + (unter.length ? ` · unter ${MIN_JE}: ${unter.join(', ')}` : ''));
  };
  for (const U of UEB.filter(u => u.art === 'wahl')){
    const liste = [];
    for (const { s, z } of zerlegt){ if (!z) continue; try { liste.push(...(U.baue(z, s) || [])); } catch (e){ /* B meldet baue()-Fehler */ } }
    const loesungen = new Set(liste.map(x => String(x.loesung)));
    const erste = mischen ? mischen(U, liste).slice(0, loesungen.size).map(x => String(x.loesung)) : [];
    ergebnis.gleichOft.push(`${U.nr}: ${loesungen.size}`);
    if (loesungen.size > 1 && new Set(erste).size !== loesungen.size)
      ergebnis.verstoesse.push(`${U.id}: nicht jede Antwort gleich oft — in den ersten ${loesungen.size} Aufgaben nur ${new Set(erste).size} verschiedene Lösungen`);
    gleichViele(U, liste, x => String(x.loesung));
  }
  // F: Genitiv — Übung 5 nur schwer, Übung 4 und 5 reihum nach Präposition.
  const gruende = hole('uebGenitivGruende');
  ergebnis.genitiv = {};
  for (const id of ['jarr-paar', 'alle-majrur']){
    const U = UEB.find(u => u.id === id);
    if (!U){ ergebnis.verstoesse.push(`${id}: Übung fehlt`); continue; }
    const liste = [];
    for (const { s, z } of zerlegt){
      if (!z) continue;
      let a = []; try { a = U.baue(z, s) || []; } catch (e){ ergebnis.verstoesse.push(`${id}: baue() wirft — ${e.message}`); }
      for (const x of a){
        liste.push(x);
        if (id === 'jarr-paar'){
          /* Elias, 25.09.2026: „auch hier die sätze schwerer machen wie beim
             genitiv davor und mit mehr präpositionen im satz". */
          const p = z.filter(t => t.rolle === 'حَرْف جَرّ').length;
          const n = z.filter((t, i) => t.rolle === 'حَرْف جَرّ' && z[i + 1] && z[i + 1].erwartet === 'jarr').length;
          if (p < 2 || n < 2) ergebnis.verstoesse.push(`jarr-paar: zu leicht (weniger als zwei Präpositionen mit Genitiv) — ${s.id || s.sentAr}`);
        }
        if (id === 'alle-majrur'){
          const g = gruende ? gruende(z) : [];
          if (g.length < 2 || new Set(g.map(y => y.grund)).size < 2)
            ergebnis.verstoesse.push(`alle-majrur: zu leicht (weniger als zwei Genitive aus zwei Gründen) — ${s.id || s.sentAr}`);
          if (!x.aufloesung) ergebnis.verstoesse.push(`alle-majrur: keine Begründung nach der Antwort — ${s.id || s.sentAr}`);
        }
      }
    }
    const zaehl = new Map();
    for (const x of liste) for (const k of (x.reihum || [])) zaehl.set(k, (zaehl.get(k) || 0) + 1);
    const korb = x => (x.reihum || []).slice().sort((p, q) => (zaehl.get(p) - zaehl.get(q)) || (p < q ? -1 : p > q ? 1 : 0))[0] || '—';
    const koerbe = new Set(liste.map(korb));
    const erste = mischen ? mischen(U, liste).slice(0, koerbe.size).map(korb) : [];
    if (koerbe.size > 1 && new Set(erste).size !== koerbe.size)
      ergebnis.verstoesse.push(`${id}: Präpositionen nicht reihum — in den ersten ${koerbe.size} Aufgaben nur ${new Set(erste).size} verschiedene`);
    gleichViele(U, liste, korb);
    ergebnis.genitiv[id] = { aufgaben: liste.length, koerbe: [...koerbe] };
  }
  const karteJarr = (hole('FOLGE19_KARTEN') || []).find(k => k.id === 'f19-jarr');
  const acht = karteJarr ? karteJarr.gruppen[0].merkmale.map(m => String(m).split('–')[0].trim()) : [];
  const inFuenf = new Set(ergebnis.genitiv['alle-majrur'] ? ergebnis.genitiv['alle-majrur'].koerbe : []);
  const kernVon = hole('uebPraepKern');
  ergebnis.genitiv.fehlen = acht.filter(p => {
    const k = p.length <= 2 ? kernVon(p).charAt(0) + 'ـ' : kernVon(p);
    return !inFuenf.has(k) && !(k === 'إلى' && inFuenf.has('الى'));
  });
  // G: Tanwīn-Namen auf „-tayn"
  for (const h of (hole('HARAKA_WAHL') || []))
    if (/tan$/.test(h.wert) && !/tayn$/.test(String(h.text)))
      ergebnis.verstoesse.push(`Tanwīn-Name nicht auf „-tayn": ${h.text}`);
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
  if (e.genitiv){
    for (const id of ['jarr-paar', 'alle-majrur']) if (e.genitiv[id])
      z.push(`Genitiv ${id}: ${e.genitiv[id].aufgaben} Aufgaben · reihum über ${e.genitiv[id].koerbe.length}: ${e.genitiv[id].koerbe.join(' ')}`);
    z.push(`Präpositionen seiner Karte ohne schweren Satz in Übung 5: ${e.genitiv.fehlen.length ? e.genitiv.fehlen.join(' ') : '—'}`);
  }
  if (e.jeAntwort && e.jeAntwort.length) z.push(`Je Antwort gleich viele (Übung: Deckel · seltene Antworten brauchen Sätze):\n   ${e.jeAntwort.join('\n   ')}`);
  z.push(`Balance: ${e.anteil} % der Sätze (${e.mitNeu} von ${e.pool}) enthalten ein Wort aus den neuesten Kapiteln — Richtwert (MEIN Vorschlag): etwa 20 %`);
  z.push(`Neueste Kapitel: ${e.neuWoerter} Wörter, davon ${e.ohneSatzNeu.length} in keinem Satz` + (e.ohneSatzNeu.length ? ':\n   ' + e.ohneSatzNeu.slice(0, 40).join('\n   ') : ''));
  return z.join('\n');
}

const app = ladeApp();
if (app.fehlt.length){ console.log('⛔ Ladefehler:\n  ' + app.fehlt.join('\n  ')); process.exit(1); }
/* shuffle() steht in js/kern.js, das der Lader nicht lädt — uebungMischen() (Teil E) braucht es.
   Dieselbe Rückgabe wie dort: eine gemischte KOPIE. */
if (typeof app.hole('shuffle') !== 'function')
  vm.runInContext('function shuffle(arr){ const a = arr.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }', app.ctx);

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
  // 4. uebungMischen wieder nur gemischt → Teil E muss rot werden (Übung 11: 98 von 152 Aufgaben haben هَذَا).
  vm.runInContext('globalThis.__echtMischen = uebungMischen; uebungMischen = function(m, l){ return shuffle(l.slice()); };', app.ctx);
  e = messen(app);
  ok('nur gemischt statt reihum → Verstoß', e.verstoesse.some(v => v.startsWith('isara: nicht jede Antwort')));
  vm.runInContext('uebungMischen = globalThis.__echtMischen;', app.ctx);
  // 5. Übung 4/5 wieder nur gemischt → Teil F muss rot werden.
  vm.runInContext('globalThis.__echtMischen = uebungMischen; uebungMischen = function(m, l){ return l.some(a => a && Array.isArray(a.reihum)) ? shuffle(l.slice()) : globalThis.__echtMischen(m, l); };', app.ctx);
  e = messen(app);
  ok('Präpositionen nur gemischt statt reihum → Verstoß', e.verstoesse.some(v => / Präpositionen nicht reihum/.test(v)));
  vm.runInContext('uebungMischen = globalThis.__echtMischen;', app.ctx);
  // 6. Übung 5 wieder mit jedem Satz, der EIN Genitiv-Wort hat → Teil F muss rot werden.
  const U5 = app.hole('UEBUNGEN').find(u => u.id === 'alle-majrur'), echt5 = U5.baue;
  U5.baue = function(z){ const ziele = z.map((t, i) => t.erwartet === 'jarr' ? i : -1).filter(i => i >= 0); return ziele.length ? [{ frage: 'x', ziele, art: 'mehrfach', aufloesung: 'x' }] : []; };
  e = messen(app);
  ok('Übung 5 wieder leicht → Verstoß', e.verstoesse.some(v => v.startsWith('alle-majrur: zu leicht')));
  U5.baue = echt5;
  // 6b. Übung 4 wieder mit jedem Satz, der EINE Präposition hat → Teil F muss rot werden.
  const U4 = app.hole('UEBUNGEN').find(u => u.id === 'jarr-paar'), echt4 = U4.baue;
  U4.baue = function(z){ const i = z.findIndex(t => t.rolle === 'حَرْف جَرّ'); return i >= 0 ? [{ frage: 'x', ziele: [i], art: 'mehrfach', reihum: ['x'] }] : []; };
  e = messen(app);
  ok('Übung 4 wieder leicht → Verstoß', e.verstoesse.some(v => v.startsWith('jarr-paar: zu leicht')));
  U4.baue = echt4;
  // 7. Ein Tanwīn-Name wieder auf „-tan" → Teil G muss rot werden.
  const hw = app.hole('HARAKA_WAHL'), altText = hw[1].text;
  hw[1].text = 'ـٌ  Ḍammatān';
  e = messen(app);
  ok('Tanwīn-Name „-tan" → Verstoß', e.verstoesse.some(v => v.startsWith('Tanwīn-Name')));
  hw[1].text = altText;
  // 8. Wieder ungedeckelt (Nominativ 557 gegen Genitiv 240) → „je Antwort gleich viele" muss rot werden.
  vm.runInContext('globalThis.__echtGleich = uebungGleichViele; uebungGleichViele = function(l){ return shuffle(l.slice()); };', app.ctx);
  e = messen(app);
  ok('je Antwort NICHT gleich viele → Verstoß', e.verstoesse.some(v => v.startsWith('kasus: nicht je Antwort gleich viele')));
  vm.runInContext('uebungGleichViele = globalThis.__echtGleich;', app.ctx);
  console.log(rot ? `\n⛔ ${rot} Störtest(s) schlagen NICHT an` : '\n✅ alle 9 Störtests schlagen an');
  process.exit(rot ? 1 : 0);
}

const e = messen(app);
console.log(bericht(e));
if (e.verstoesse.length){ console.log('\n⛔ ' + e.verstoesse.length + ' Verstöße:\n  ' + e.verstoesse.slice(0, 20).join('\n  ')); process.exit(1); }
const luecken = Object.values(e.uebungen).reduce((n, u) => n + u.ohneSatz.length, 0) + (e.anteil === 0 ? 1 : 0);
console.log(luecken ? `\n⚠️ ${luecken} Lücke(n) — Arbeit für die Wartung (Mi/So), kein Werkzeugfehler` : '\n✅ alles aktuell');
process.exit(luecken ? 2 : 0);
