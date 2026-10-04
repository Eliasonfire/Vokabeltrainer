#!/usr/bin/env node
/* test-plural-uebung.mjs — bewacht Übung 16 „Welcher Plural?" (04.10.2026).
 *
 * Elias, 04.10.2026, nach Folge 25 (MB1 Kapitel 13): „wurde schon neue satzmodus
 * übung gebaut für den plural der heute gemacht wurde im video?"
 *
 * Was hier bewacht wird — und warum gerade das:
 *   1  Die Übung steht da (Nummer 16, Art wahl), mit Hinweis, der die drei Enden
 *      NICHT nennt: steht die Mehrzahl selbst im Satz, wäre das die Lösung.
 *   2  „Warum?" führt zu einer Regel, die es gibt.
 *   3  Sie steht in genau einem seiner zwei Teile.
 *   4  In SEINER Auswahl gibt es genug Aufgaben, und alle drei Antworten kommen vor.
 *   5  Jede Lösung stimmt mit der Karte überein — hier noch einmal unabhängig von
 *      js/uebung.js nachgerechnet. Das ist die wichtigste Zusicherung: eine falsch
 *      eingeordnete Mehrzahl lernt sich mit. Dazu gehört, dass eine Karte, die sich
 *      nicht sauber einordnen lässt (zwei Pluralformen, ـَات ohne ة in der Einzahl,
 *      Stammwechsel), GAR NICHT gefragt wird.
 *   7  Steht die Mehrzahl selbst im Satz, wird nach ihrer Art gefragt — die
 *      Abfrage des Lehrers (Folge 25, 13:24) an seinem eigenen Satz (mb1-68-2).
 *   8  Die weibliche Form eines Wortes (كَبِيرَةٌ) wird nicht gefragt: ihre
 *      Mehrzahl wäre eine andere als die auf der Karte.
 *   9  Zahlwörter werden nicht gefragt. Bei eins und drei bis zehn steht im Feld
 *      `pl` die Form beim weiblichen Nomen, keine Mehrzahl (istZahlwort() in
 *      js/kern.js, 16.09.2026). Von v646 bis v647 fragte die Übung „fünf → …:
 *      gebrochen" — 25 Aufgaben an neun Karten. Punkt 5 konnte das nicht sehen:
 *      er rechnet die FORM nach, und die Form sieht wie ein gebrochener Plural aus.
 *      Gemessen wird mit der ECHTEN Funktion aus js/kern.js, nicht mit einem Nachbau.
 *
 * Gemessen wird mit seiner Kapitelauswahl aus .stand-app.json, geladen wie in
 * werkzeuge/pruefe-satzmodus-aktuell.mjs.
 *
 *   node test-plural-uebung.mjs     Exit 0 = alles grün, alle Störtests schlagen an
 *                                   Exit 1 = eine Zusicherung verletzt oder ein
 *                                            Störtest schlägt nicht an
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
/* Im Repo liegt der Test neben vocab-data.js. PLURAL_UEBUNG_DATEI erlaubt, eine
   Probefassung von js/uebung.js zu messen, bevor sie ins Repo kommt. */
const WURZEL = fs.existsSync(path.join(HIER, 'vocab-data.js')) ? HIER : 'G:/1. Workspace/Vokabeltrainer';
const UEBUNG_DATEI = process.env.PLURAL_UEBUNG_DATEI || path.join(WURZEL, 'js', 'uebung.js');

function stummesElement(){
  return { style:{}, classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    dataset:{}, children:[], value:'', textContent:'', innerHTML:'', disabled:false,
    addEventListener(){}, removeEventListener(){}, appendChild(){}, querySelector(){ return null; },
    querySelectorAll(){ return []; }, closest(){ return null; }, getAttribute(){ return null; },
    setAttribute(){}, focus(){}, getBoundingClientRect(){ return {width:0,height:0,top:0,left:0}; } };
}

function ladeApp(){
  const DOM = { getElementById: stummesElement, querySelector: stummesElement, querySelectorAll: () => [],
    createElement: stummesElement, addEventListener(){}, body: stummesElement(), documentElement: stummesElement() };
  const standDatei = path.join(WURZEL, '.stand-app.json');
  if (!fs.existsSync(standDatei)) return { fehlt: ['.stand-app.json fehlt — ohne seine Kapitelauswahl ist nichts messbar'] };
  const auswahl = JSON.parse(fs.readFileSync(standDatei, 'utf8')).buecher || {};
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
    'js/irab.js', 'js/saetze.js', 'js/uebersetzen.js', 'js/regeln.js', 'js/uebung.js'];
  const fehlt = [];
  for (const f of DATEIEN){
    const p = f === 'js/uebung.js' ? UEBUNG_DATEI : path.join(WURZEL, f);
    try { vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: f }); }
    catch (e){ fehlt.push(f + ': ' + e.message); }
  }
  const hole = n => { try { return vm.runInContext(`typeof ${n} !== 'undefined' ? ${n} : undefined`, ctx); } catch (e){ return undefined; } };
  const VD = hole('VOCAB_DATA') || [], BS = hole('BEISPIELSAETZE') || {};
  const bekannt = new Set(VD.map(w => String(w.id)));
  const m = fs.readFileSync(path.join(WURZEL, 'js', 'kern.js'), 'utf8').match(/const FREISCHALTEN_AUF_WUNSCH\s*=\s*\[([^\]]*)\]/);
  const aufWunsch = m ? new Set((m[1].match(/'[^']+'|"[^"]+"/g) || []).map(s => s.slice(1, -1))) : new Set();
  for (const [buch, liste] of Object.entries(ctx.window.VOKABELN || {})){
    const kap = auswahl[buch] || [];
    for (const w of liste) if ((kap.includes(Number(w.chapter)) || aufWunsch.has(String(w.id))) && !bekannt.has(String(w.id))){
      const s = BS[w.id] || {};
      VD.push({ ...w, sentAr: w.sentAr || s.sentAr, sentDe: w.sentDe || s.sentDe });
      bekannt.add(String(w.id));
    }
  }
  { const FV = hole('FACHBEGRIFF_VOKABELN') || [], FA = hole('FACHBEGRIFF_AUFTRAG') || {};
    for (const w of FV) if (Object.prototype.hasOwnProperty.call(FA, String(w.id)) && !bekannt.has(String(w.id))){ VD.push(w); bekannt.add(String(w.id)); } }
  ctx.istBekannt = w => !!w && (w.chapter === 'personal' || bekannt.has(String(w.id)));
  vm.runInContext('UEB_WORTGRUPPEN = {}', ctx);
  vm.runInContext('if (typeof setzeLexikon === "function") setzeLexikon(VOCAB_DATA)', ctx);
  /* istZahlwort() steht in js/kern.js, das dieser Lader nicht lädt — und ohne sie
     fragt die Übung nichts (uebPluralArt). Geschnitten wird die ECHTE Fassung samt
     ihrem Muster: ein Nachbau hier prüfte nur sich selbst. `zahlwortEcht` bleibt
     für Punkt 9 stehen, auch wenn ein Störtest die Funktion in der App-Welt ersetzt. */
  { const kernText = fs.readFileSync(path.join(WURZEL, 'js', 'kern.js'), 'utf8');
    const zw = kernText.match(/const ZAHLWORT_DE = [^\n]*\r?\nfunction istZahlwort\(w\)\{[\s\S]*?\r?\n\}/);
    if (zw) vm.runInContext(zw[0], ctx);
    else fehlt.push('js/kern.js: ZAHLWORT_DE und istZahlwort() nicht lesbar — ohne sie fragt Übung 16 nichts'); }
  const zahlwortEcht = hole('istZahlwort');
  const pool = (hole('alleSaetze') || (() => []))();
  const analysiere = hole('analysiereSatz');
  const zerlegt = pool.map(s => { try { return { s, z: analysiere(s.sentAr) }; } catch (e){ return { s, z: null }; } });
  return { ctx, hole, fehlt, pool, zerlegt, auswahl, zahlwortEcht };
}

const ohne = s => String(s == null ? '' : s).normalize('NFC').replace(/[\u064B-\u0652\u0670\u0640]/g, '');
const kern = w => ohne(w).replace(/[.،؟!«»:؛]/g, '').replace(/^[وفبلك]?(ال|لل)/, '');
/* Die Einordnung, UNABHÄNGIG von js/uebung.js nachgerechnet — dieselbe Regel,
   anders geschrieben. null = lässt sich nicht sauber einordnen. */
function sollArt(v){
  const pl = String(v.pl || '').trim(), sg = String(v.sg || v.ar || '').trim();
  if (!pl || !sg || /[\s\/|,،]/.test(pl)) return null;
  const p = ohne(pl), s = ohne(sg).replace(/^ال/, '');
  if (p.endsWith('ون')) return p === s + 'ون' ? 'm' : null;
  if (p.endsWith('ين')) return null;
  if (p.endsWith('ات')) return (s.endsWith('ة') && p === s.slice(0, -1) + 'ات') ? 'f' : null;
  return 'g';
}

function pruefe(app, zahlen){
  const rot = [];
  const ok = (name, bed, info) => { if (!bed) rot.push(name + (info ? ' — ' + info : '')); };
  const { hole, zerlegt } = app;
  const U = (hole('UEBUNGEN') || []).find(u => u.id === 'plural');
  ok('1 die Übung „plural" gibt es', !!U);
  if (!U) return rot;
  ok('1 Nummer 16, Art wahl', U.nr === 16 && U.art === 'wahl', `nr ${U.nr}, art ${U.art}`);
  ok('1 Hinweis vorhanden, hinweisVerraet:false', typeof U.hinweis === 'string' && U.hinweis.length > 20 && U.hinweisVerraet === false);
  ok('1 der Hinweis nennt keines der Enden', !/ون|ات/.test(ohne(U.hinweis)));
  const warum = hole('UEBUNG_WARUM') || {}, regeln = hole('GRAMMAR_RULES') || [];
  ok('2 „Warum?" führt zu einer vorhandenen Regel', !!warum.plural && regeln.some(r => r.id === warum.plural), String(warum.plural));
  const teile = (hole('satzTeile') || (() => ({})))();
  ok('3 in genau einem der zwei Teile', [1, 2].filter(t => (teile[t] || []).includes('plural')).length === 1);
  /* Seine zwei Teile bleiben, wie sie waren — die neue kommt nur dazu. Verglichen
     wird die Aufteilung OHNE die Übung mit der MIT ihr (ohne Messungen, wie auf
     seinem Stand am 04.10.2026: die Schätzung entscheidet). Dafür ist `teilRang`
     da: nach der Nummer käme sie vor dem Satzbau dran und nähme dessen Platz. */
  {
    const liste = hole('UEBUNGEN'), stelle = liste.indexOf(U);
    liste.splice(stelle, 1);
    let ohneSie = null;
    try { ohneSie = hole('satzTeile')(); } finally { liste.splice(stelle, 0, U); }
    const gewechselt = liste.filter(m => m !== U && (ohneSie[1] || []).includes(m.id) !== (teile[1] || []).includes(m.id)).map(m => m.id);
    ok('3 seine zwei Teile bleiben, wie sie waren — die neue kommt nur dazu', gewechselt.length === 0, 'gewechselt: ' + gewechselt.join(', '));
  }

  const uebungVokabel = hole('uebungVokabel');
  const alle = [];
  for (const { s, z } of zerlegt){
    if (!z) continue;
    let a = [];
    try { a = U.baue(z, s) || []; } catch (e){ rot.push(`baue() wirft bei ${s.id}: ${e.message}`); }
    for (const x of a) alle.push({ s, z, a: x });
  }
  const je = { m: 0, f: 0, g: 0 };
  for (const x of alle) if (x.a.loesung in je) je[x.a.loesung]++;
  if (zahlen) Object.assign(zahlen, { aufgaben: alle.length, je, saetze: new Set(alle.map(x => x.s.id)).size, teile });
  ok('4 mindestens 15 Aufgaben in seiner Auswahl', alle.length >= 15, alle.length + ' Aufgaben');
  ok('4 alle drei Antworten kommen vor', je.m > 0 && je.f > 0 && je.g > 0, JSON.stringify(je));

  const falsch = [], ohneForm = [], frage = [], fem = [];
  for (const { s, z, a } of alle){
    const t = z[a.wortIdx], v = t && uebungVokabel(t.wort);
    if (!v || !v.pl){ falsch.push(`${s.id}: keine Karte mit Mehrzahl hinter dem Wort`); continue; }
    const soll = sollArt(v);
    if (soll !== a.loesung) falsch.push(`${s.id} ${v.ar} → ${v.pl}: Lösung ${a.loesung}, nach der Karte ${soll}`);
    if (!String(a.aufloesung).includes(String(v.pl))) ohneForm.push(s.id);
    const w = kern(t.wort), p = ohne(v.pl).replace(/^ال/, ''), e = ohne(v.sg || v.ar).replace(/^ال/, '');
    if (w === p && !/^Welche Art Plural ist/.test(a.frage)) frage.push(`${s.id}: Mehrzahl im Satz, Frage „${a.frage}"`);
    if (w === e && w !== p && !/^Welchen Plural hat/.test(a.frage)) frage.push(`${s.id}: Einzahl im Satz, Frage „${a.frage}"`);
    if (v.femSg && w === ohne(v.femSg).replace(/^ال/, '') && w !== e && w !== p) fem.push(`${s.id} ${t.wort}`);
  }
  ok('5 jede Lösung stimmt mit der Karte überein', !falsch.length, falsch.slice(0, 3).join(' | '));
  ok('5 jede Auflösung nennt die Mehrzahl der Karte', !ohneForm.length, ohneForm.slice(0, 3).join(', '));
  ok('5 jede Aufgabe bietet genau die drei Antworten', alle.every(x => Array.isArray(x.a.optionen) && x.a.optionen.map(o => o.wert).join() === 'm,f,g'));
  ok('5 die Frage passt zur Form im Satz', !frage.length, frage.slice(0, 2).join(' | '));
  const an = (satzId, geruest) => alle.find(x => String(x.s.id) === satzId && kern(x.z[x.a.wortIdx].wort) === geruest);
  const m = an('mb1-68-2', 'مجتهدون');
  ok('7 die Mehrzahl im Satz selbst wird nach ihrer Art gefragt (mb1-68-2)', !!m && m.a.loesung === 'm' && /^Welche Art Plural ist/.test(m.a.frage));
  const g = an('mb1-68-1', 'طلاب');
  ok('7 ein gebrochener Plural im Satz wird als gebrochen gefragt (mb1-68-1)', !!g && g.a.loesung === 'g');
  ok('8 die weibliche Form eines Wortes wird nicht gefragt', !fem.length, fem.slice(0, 3).join(', '));
  /* 9 — Zahlwörter. Erst die Gegenprobe, dass der Punkt überhaupt etwas prüft: es muss
     in seiner Auswahl Zahlwort-Karten mit pl-Feld geben, und sie müssen in Sätzen stehen. */
  const istZahl = app.zahlwortEcht;
  ok('9 die Zahlwort-Erkennung aus js/kern.js ist geladen', typeof istZahl === 'function');
  if (typeof istZahl === 'function'){
    const zahlKarten = (hole('VOCAB_DATA') || []).filter(w => w && w.pl && istZahl(w));
    const inSaetzen = new Set();
    for (const { z } of zerlegt) if (z) for (const t of z){ const v = uebungVokabel(t.wort); if (v && v.pl && istZahl(v)) inSaetzen.add(String(v.id)); }
    if (zahlen) Object.assign(zahlen, { zahlKarten: zahlKarten.length, zahlInSaetzen: inSaetzen.size });
    ok('9 Zahlwort-Karten mit pl-Feld stehen in seinen Sätzen (sonst prüft Punkt 9 nichts)', zahlKarten.length > 0 && inSaetzen.size > 0, `${zahlKarten.length} Karten, ${inSaetzen.size} davon in Sätzen`);
    const gefragt = alle.filter(x => { const v = uebungVokabel(x.z[x.a.wortIdx].wort); return v && istZahl(v); });
    ok('9 kein Zahlwort wird nach seinem Plural gefragt', !gefragt.length, `${gefragt.length} Aufgaben, z. B. ` + gefragt.slice(0, 3).map(x => `${x.s.id} ${x.z[x.a.wortIdx].wort}`).join(', '));
  }
  return rot;
}

const app = ladeApp();
if (app.fehlt && app.fehlt.length){ console.log('⛔ Laden: ' + app.fehlt.join(' · ')); process.exit(1); }
const zahlen = {};
const echt = pruefe(app, zahlen);
console.log(`Übung 16 „Welcher Plural?": ${zahlen.aufgaben ?? 0} Aufgaben in ${zahlen.saetze ?? 0} von ${app.pool.length} Sätzen seiner Auswahl`
  + (zahlen.je ? ` — regelmäßig männlich ${zahlen.je.m}, regelmäßig weiblich ${zahlen.je.f}, gebrochen ${zahlen.je.g}` : ''));
if (zahlen.zahlKarten != null) console.log(`Zahlwörter: ${zahlen.zahlKarten} Karten mit pl-Feld, ${zahlen.zahlInSaetzen} davon in seinen Sätzen — keine wird gefragt`);
if (zahlen.teile) console.log(`Teile: 1 =${(zahlen.teile[1] || []).length} Übungen, 2 = ${(zahlen.teile[2] || []).length} Übungen; „plural" steht in Teil ${[1, 2].find(t => (zahlen.teile[t] || []).includes('plural')) || '?'}`);
for (const r of echt) console.log('  ✘ ' + r);

/* Störtests: jede Zusicherung muss rot werden können. */
const tu = code => vm.runInContext(code, app.ctx);
const STOER = [
  ['Einordnung vertauscht (männlich ↔ gebrochen)',
    () => tu('globalThis.__echtArt = uebPluralArt; uebPluralArt = v => ({ m:"g", g:"m", f:"f" })[globalThis.__echtArt(v)] || null;'),
    () => tu('uebPluralArt = globalThis.__echtArt;')],
  ['eine Karte ohne saubere Einordnung kommt durch',
    () => tu('globalThis.__echtArt = uebPluralArt; uebPluralArt = v => globalThis.__echtArt(v) || (v && v.pl ? "g" : null);'),
    () => tu('uebPluralArt = globalThis.__echtArt;')],
  ['der Hinweis nennt ein Ende',
    () => tu('globalThis.__echtHinweis = UEBUNGEN.find(u => u.id === "plural").hinweis; UEBUNGEN.find(u => u.id === "plural").hinweis = "Endet die Mehrzahl auf \\u0648\\u0646, ist sie regelmäßig männlich.";'),
    () => tu('UEBUNGEN.find(u => u.id === "plural").hinweis = globalThis.__echtHinweis;')],
  ['ohne teilRang nimmt sie dem Satzbau den Platz (ein Teil-Wechsel)',
    () => tu('globalThis.__echtRang = UEBUNGEN.find(u => u.id === "plural").teilRang; delete UEBUNGEN.find(u => u.id === "plural").teilRang;'),
    () => tu('UEBUNGEN.find(u => u.id === "plural").teilRang = globalThis.__echtRang;')],
  ['„Warum?" kennt die Übung nicht',
    () => tu('globalThis.__echtWarum = UEBUNG_WARUM.plural; delete UEBUNG_WARUM.plural;'),
    () => tu('UEBUNG_WARUM.plural = globalThis.__echtWarum;')],
  ['die Frage unterscheidet Einzahl und Mehrzahl nicht',
    () => tu('globalThis.__echtBaue = UEBUNGEN.find(u => u.id === "plural").baue; UEBUNGEN.find(u => u.id === "plural").baue = function(z, s){ return globalThis.__echtBaue.call(this, z, s).map(a => ({ ...a, frage: "Welchen Plural hat das hervorgehobene Wort?" })); };'),
    () => tu('UEBUNGEN.find(u => u.id === "plural").baue = globalThis.__echtBaue;')],
  ['die Auflösung nennt die Mehrzahl nicht',
    () => tu('globalThis.__echtBaue = UEBUNGEN.find(u => u.id === "plural").baue; UEBUNGEN.find(u => u.id === "plural").baue = function(z, s){ return globalThis.__echtBaue.call(this, z, s).map(a => ({ ...a, aufloesung: "gebrochen" })); };'),
    () => tu('UEBUNGEN.find(u => u.id === "plural").baue = globalThis.__echtBaue;')],
  ['Zahlwörter kommen wieder durch (die Erkennung sagt immer nein)',
    () => tu('globalThis.__echtZahl = istZahlwort; istZahlwort = () => false;'),
    () => tu('istZahlwort = globalThis.__echtZahl;')],
  ['die Zahlwort-Erkennung fehlt ganz (js/kern.js nicht geladen): dann fragt die Übung nichts',
    () => tu('globalThis.__echtZahl = istZahlwort; istZahlwort = undefined;'),
    () => tu('istZahlwort = globalThis.__echtZahl;')]
];
let stumm = 0;
if (!echt.length){
  for (const [name, an, aus] of STOER){
    let r = [];
    try { an(); r = pruefe(app); } catch (e){ r = ['wirft: ' + e.message]; } finally { try { aus(); } catch (e){} }
    if (!r.length){ stumm++; console.log(`  ✘ Störtest schlägt NICHT an: ${name}`); }
  }
  const danach = pruefe(app);
  if (danach.length){ stumm++; console.log('  ✘ nach den Störtests ist der Stand nicht wiederhergestellt: ' + danach[0]); }
}
if (echt.length){ console.log(`✘ test-plural-uebung: ${echt.length} Zusicherung(en) verletzt`); process.exit(1); }
if (stumm){ console.log(`✘ test-plural-uebung: ${stumm} Störtest(s) ohne Wirkung`); process.exit(1); }
console.log(`✅ test-plural-uebung: alle Zusicherungen grün, alle ${STOER.length} Störtests schlagen an`);
