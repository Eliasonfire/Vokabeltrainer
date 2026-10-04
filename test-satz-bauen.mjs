#!/usr/bin/env node
/* test-satz-bauen.mjs — bewacht Übung 17 „Satzbau" (v642, 04.10.2026).
 *
 * Elias, Google Tasks (Liste „Meine Aufgaben", 03.10.2026), wörtlich:
 *   „Claude Wörter haben und satzbau selber machen sodass man den Satz selbst bildet Claude"
 * und im Chat am 04.10.2026: „es geht um wörter bauen als satz übung. guck mal
 * nach und baue".
 *
 * Bewacht (Pflicht 8 des Pflichtprogramms: eigener Test mit Störtest):
 *   1. Nr. 17 in einer eigenen Gruppe „Bauen", die Liste bleibt linear 1 bis N,
 *      die Zeitschätzung kennt die Art, „Warum?" nennt die Übung — und seine
 *      zwei Teile bleiben, wie sie waren: die neue Übung kommt nur dazu.
 *   2. Aus SEINER Auswahl: jeder Satz mit mindestens drei Wörtern gibt genau
 *      eine Aufgabe, und ihre Bausteine sind die Wörter dieses Satzes in seiner
 *      Reihenfolge, ohne Satzzeichen. Keine Aufgabe aus zwei Wörtern, aus einem
 *      Satz mit « » oder aus einer reinen Aufzählung.
 *   3. Die Wertung: die Reihenfolge des Satzes ist richtig, ein Tausch zweier
 *      verschiedener Wörter falsch, ein Tausch zweier GLEICHER richtig, ein
 *      halber Satz gar keine Antwort.
 *   4. Der Vorrat liegt nie schon in der Lösungsreihenfolge.
 *   5. Der Ablauf am Bildschirm (renderUebung an einem mitschreibenden DOM):
 *      das Deutsche steht lesbar an der Frage und nicht noch einmal darunter;
 *      der arabische Satz steht vorher nirgends sichtbar; ein Tipp setzt ein
 *      Wort, ein Tipp auf sein Wort nimmt es zurück; „Prüfen" wertet erst den
 *      ganzen Satz; nach einem Fehler steht der richtige Satz mit Satzzeichen
 *      da; nach einer richtigen Antwort bleibt nichts vom Fehler davor stehen.
 * Jede Zusicherung hat einen Störtest am ECHTEN Quelltext (js/uebung.js, im
 * Speicher verändert), der sie rot werden lassen muss.
 *
 *   node test-satz-bauen.mjs     Exit 0 = alles grün, alle Störtests schlagen an
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const W = path.dirname(fileURLToPath(import.meta.url));
const QUELLE = fs.readFileSync(path.join(W, 'js/uebung.js'), 'utf8');
const TEXTE = new Map();
const lies = f => { if (!TEXTE.has(f)) TEXTE.set(f, fs.readFileSync(path.join(W, f), 'utf8')); return TEXTE.get(f); };

/* Ein Element, das mitschreibt, was renderUebung() hineinsetzt. */
function element(){
  const klassen = new Set();
  return { style:{}, dataset:{}, children:[], value:'', textContent:'', innerHTML:'', disabled:false, className:'',
    classList:{ add(...k){ k.forEach(x => klassen.add(x)); }, remove(...k){ k.forEach(x => klassen.delete(x)); },
      toggle(k, an){ const soll = an === undefined ? !klassen.has(k) : !!an; if (soll) klassen.add(k); else klassen.delete(k); return soll; },
      contains(k){ return klassen.has(k); } },
    addEventListener(){}, removeEventListener(){}, appendChild(){}, querySelector(){ return null; }, querySelectorAll(){ return []; }, closest(){ return null; },
    getAttribute(){ return null; }, setAttribute(){}, removeAttribute(){}, focus(){}, getBoundingClientRect(){ return { width:0, height:0, top:0, left:0 }; } };
}

/* Die App wie in werkzeuge/pruefe-satzmodus-aktuell.mjs: seine Kapitelauswahl
   (.stand-app.json), die Buchkarten mit ihren Sätzen und die bestellten
   Fachbegriffe. js/kern.js lädt dieser Lader nicht — was der Ablauf daraus
   braucht, steht unten als schlichter Ersatz. */
function lade(uebungQuelle){
  const els = {};
  const el = id => els[id] || (els[id] = element());
  const DOM = { getElementById: el, querySelector: () => element(), querySelectorAll: () => [], createElement: element, addEventListener(){}, body: element(), documentElement: element() };
  const auswahl = JSON.parse(lies('.stand-app.json')).buecher || {};
  const meldungen = [];
  const ctx = { window:{ addEventListener(){}, matchMedia(){ return { matches:false, addEventListener(){} }; }, location:{ href:'' }, navigator:{ userAgent:'node', language:'de' }, VOKABELN:{} },
    document: DOM, localStorage:{ _d:{}, getItem(k){ return this._d[k] ?? null; }, setItem(k, v){ this._d[k] = String(v); }, removeItem(k){ delete this._d[k]; } },
    navigator:{ userAgent:'node', language:'de', onLine:true }, console:{ log(){}, warn(){}, error(){}, info(){} },
    Date, Math, JSON, Intl, setTimeout, clearTimeout, setInterval, clearInterval };
  ctx.globalThis = ctx; ctx.self = ctx; ctx.window.document = DOM; ctx.window.localStorage = ctx.localStorage;
  ctx.SETTINGS = { buecher: auswahl, eigene:true, fachbegriffe:true };
  /* Ersatz für js/kern.js. `mischer` ist austauschbar: Zusicherung 4 lässt das
     Mischen absichtlich auf die Lösung fallen. */
  ctx.mischer = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  ctx.shuffle = arr => ctx.mischer(arr);
  ctx.escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  ctx.arabischHervorheben = t => ctx.escapeHtml(String(t || ''));
  ctx.toast = t => { meldungen.push(String(t)); };
  ctx.todayStr = () => '2026-10-04';
  ctx.LS = { _d:{}, get(k, d){ return (k in this._d) ? this._d[k] : d; }, set(k, v){ this._d[k] = v; } };
  ctx.kapitelBeschriftung = () => '';   // herkunft() in js/saetze.js: die Zeile unter der Aufgabe, hier ohne Belang
  vm.createContext(ctx);
  const DATEIEN = ['vocab-data.js', 'data/beispielsaetze.js', 'data/fachbegriffe.js', 'grammar-data.js', 'lehrbuch-saetze.js', 'regelsammlung-data.js',
    ...fs.readdirSync(path.join(W, 'data')).filter(f => /^vokabeln-.*\.js$/.test(f)).map(f => 'data/' + f),
    'js/irab.js', 'js/saetze.js', 'js/uebersetzen.js', 'js/regeln.js'];
  for (const f of DATEIEN) vm.runInContext(lies(f), ctx, { filename: f });
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
  ctx.istBekannt = w => !!w && (w.chapter === 'personal' || bekannt.has(String(w.id)));
  vm.runInContext('if (typeof setzeLexikon === "function") setzeLexikon(VOCAB_DATA)', ctx);
  return { ctx, hole, els, meldungen, tu: code => vm.runInContext(code, ctx) };
}

const SATZZEICHEN = /[.،؟!«»:؛]/g;
const ohneZeichen = w => String(w).normalize('NFC').replace(SATZZEICHEN, '');
const maskiert = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
/* Der Text der Wörter in einem Stück HTML, in ihrer Reihenfolge. */
const worteIn = html => [...String(html).matchAll(/<(?:span|button)[^>]*>([^<]*)<\/(?:span|button)>/g)].map(m => m[1]);
const zeile = html => { const m = /<span class="bau-zeile">(.*)<\/span>$/.exec(String(html)); return m ? m[1] : null; };

/* Ein Lauf über alle Zusicherungen. Rückgabe: die Namen der verletzten. */
function lauf(quelle){
  const rot = [];
  const ok = (name, bedingung) => { if (!bedingung) rot.push(name); };
  const app = lade(quelle);
  const { hole, els, meldungen, tu, ctx } = app;
  const UEBUNGEN = hole('UEBUNGEN'), U = UEBUNGEN.find(u => u.id === 'satz-bauen');
  ok('1 die Übung gibt es', !!U);
  if (!U) return { rot, zahl: 0 };

  // ---- 1: Platz in der Liste
  /* 04.10.2026 (v646): 17 → 18. Die Plural-Übung steht bei den Auswahl-Übungen
     und trägt die 16; Übersetzen und Satzbau sind je eine Nummer aufgerückt,
     damit die Nummern auf dem Bildschirm durchlaufen. */
  ok('1 Nummer 18, Art „bauen"', U.nr === 18 && U.art === 'bauen');
  const nummern = UEBUNGEN.map(u => u.nr).sort((a, b) => a - b);
  ok('1 Nummern linear 1 bis N', nummern.every((n, i) => n === i + 1));
  ok('1 eigene Gruppe „Bauen" im Wähler', (hole('UEB_GRUPPEN') || []).some(([titel, art]) => titel === 'Bauen' && art === 'bauen'));
  ok('1 die Zeitschätzung kennt die Art', Number((hole('UEB_ZEIT_SCHAETZUNG') || {}).bauen) > 0);
  ok('1 „Warum?" nennt die Übung', Object.prototype.hasOwnProperty.call(hole('UEBUNG_WARUM') || {}, 'satz-bauen'));
  ok('1 der Hinweis sagt ausdrücklich, ob er verrät', U.hinweisVerraet === false && !!U.hinweis);
  /* Ohne Messungen (dieser Lader kennt keine) entscheidet die Schätzung — wie
     auf seinem Stand am 04.10.2026. Die Aufteilung OHNE die neue Übung und die
     MIT ihr dürfen sich nur um die neue unterscheiden. */
  {
    const mit = hole('satzTeile')();
    const stelle = UEBUNGEN.indexOf(U);
    UEBUNGEN.splice(stelle, 1);
    let ohne = null; try { ohne = hole('satzTeile')(); } finally { UEBUNGEN.splice(stelle, 0, U); }
    /* `!m.teilRang` (04.10.2026, v646): eine Übung mit teilRang ist NACH dem
       Satzbau dazugekommen und wird als letzte verteilt (satzTeile()) — sie
       landet ohne den Satzbau im anderen Teil, und das ist richtig so. Gemeint
       sind hier die Übungen, die es vor dem Satzbau schon gab. */
    const gewechselt = UEBUNGEN.filter(m => m !== U && !m.teilRang && ohne[1].includes(m.id) !== mit[1].includes(m.id)).map(m => m.nr);
    ok('1 seine zwei Teile bleiben, wie sie waren — die neue kommt nur dazu', gewechselt.length === 0
      && [1, 2].filter(t => mit[t].includes('satz-bauen')).length === 1);
  }

  // ---- 2: die Aufgaben aus seiner Auswahl
  const pool = hole('alleSaetze')(), analysiere = hole('analysiereSatz');
  const aufgaben = [];
  let falschGebaut = 0, falschGewaehlt = 0, mitZeichen = 0;
  const probe = { zwei: null, zitat: null, aufzaehlung: null, doppelt: null, lang: null };
  for (const s of pool){
    const z = analysiere(s.sentAr);
    const worte = String(s.sentAr).split(/\s+/).filter(Boolean);
    const rein = worte.map(ohneZeichen);
    const aufz = worte.length > 1 && worte.slice(0, -1).every(w => /[،:]$/.test(w));
    const zitat = /[«»]/.test(s.sentAr);
    const soll = worte.length >= 3 && !zitat && !aufz && !!String(s.sentDe || '').trim() && new Set(rein).size > 1 && rein.every(Boolean);
    let a = []; try { a = U.baue(z, s) || []; } catch (e){ a = [{ wurf: e.message }]; }
    if (a.length !== (soll ? 1 : 0)) falschGewaehlt++;
    if (worte.length === 2 && !probe.zwei) probe.zwei = a.length;
    if (zitat && worte.length >= 3 && probe.zitat === null) probe.zitat = a.length;
    if (aufz && worte.length >= 3 && probe.aufzaehlung === null) probe.aufzaehlung = a.length;
    for (const x of a){
      if (!Array.isArray(x.bausteine) || x.bausteine.join('|') !== rein.join('|')) falschGebaut++;
      if ((x.bausteine || []).some(b => /[.،؟!«»:؛]/.test(b))) mitZeichen++;
      const voll = { ...x, satz: s, zeilen: z, modus: U };
      aufgaben.push(voll);
      if (!probe.doppelt && new Set(x.bausteine || []).size < (x.bausteine || []).length) probe.doppelt = voll;
      if (!probe.lang && (x.bausteine || []).length >= 4 && new Set(x.bausteine).size === x.bausteine.length) probe.lang = voll;
    }
  }
  ok('2 jeder geeignete Satz gibt genau eine Aufgabe, jeder andere keine', falschGewaehlt === 0);
  ok('2 die Bausteine sind die Wörter des Satzes in seiner Reihenfolge', falschGebaut === 0 && aufgaben.length > 0);
  ok('2 kein Baustein trägt ein Satzzeichen', mitZeichen === 0);
  ok('2 ein Satz aus zwei Wörtern gibt keine Aufgabe (und es gibt einen zum Messen)', probe.zwei === 0);
  ok('2 ein Satz mit « » gibt keine Aufgabe (und es gibt einen zum Messen)', probe.zitat === 0);
  ok('2 eine reine Aufzählung gibt keine Aufgabe (und es gibt eine zum Messen)', probe.aufzaehlung === 0);
  ok('2 genug Aufgaben in seiner Auswahl (Pflicht 5)', aufgaben.length >= (hole('UEB_JE_ANTWORT_MIN') || 15));
  ok('2 es gibt einen Satz mit zwei gleichen Wörtern und einen langen zum Messen', !!probe.doppelt && !!probe.lang);
  if (!probe.doppelt || !probe.lang) return { rot, zahl: aufgaben.length };

  // ---- 3: die Wertung
  const richtigF = hole('uebungBauRichtig');
  const a = probe.lang, n = a.bausteine.length, reiheSoll = a.bausteine.map((_, i) => i);
  ok('3 die Reihenfolge des Satzes ist richtig', richtigF(a, reiheSoll) === true);
  const getauscht = reiheSoll.slice(); [getauscht[0], getauscht[n - 1]] = [getauscht[n - 1], getauscht[0]];
  ok('3 zwei verschiedene Wörter getauscht ist falsch', richtigF(a, getauscht) === false);
  ok('3 ein halber Satz ist keine Antwort', richtigF(a, reiheSoll.slice(0, n - 1)) === null && richtigF(a, []) === null);
  const d = probe.doppelt, dn = d.bausteine.length;
  const p = d.bausteine.findIndex((w, i) => d.bausteine.indexOf(w) !== i), q = d.bausteine.indexOf(d.bausteine[p]);
  const gleichGetauscht = d.bausteine.map((_, i) => i); [gleichGetauscht[p], gleichGetauscht[q]] = [gleichGetauscht[q], gleichGetauscht[p]];
  ok('3 zwei GLEICHE Wörter getauscht ist richtig', richtigF(d, gleichGetauscht) === true && dn >= 3);

  // ---- 4: der Vorrat ist nie schon die Lösung
  const mischenF = hole('uebungBauMischen');
  const istLoesung = (x, reihe) => reihe.every((t, k) => x.bausteine[t] === x.bausteine[k]);
  const istReihe = (x, reihe) => reihe.length === x.bausteine.length && new Set(reihe).size === reihe.length && reihe.every(t => Number.isInteger(t) && t >= 0 && t < x.bausteine.length);
  let schlecht = 0;
  for (const x of [a, d, aufgaben.find(y => y.bausteine.length === 3) || a]){
    for (let i = 0; i < 200; i++){ const r = mischenF(x.bausteine); if (!istReihe(x, r) || istLoesung(x, r)) schlecht++; }
    ctx.mischer = arr => arr.slice();   // das Mischen fällt genau auf die Lösung
    const r = mischenF(x.bausteine); if (!istReihe(x, r) || istLoesung(x, r)) schlecht++;
    tu('mischer = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }');
  }
  ok('4 der Vorrat liegt nie in der Lösungsreihenfolge', schlecht === 0);

  // ---- 5: der Ablauf am Bildschirm
  const starte = x => { ctx.__a = x; tu("UEB = { modus:'satz-bauen', liste:[__a], idx:0, gewaehlt:new Set(), beantwortet:false, richtig:0, gestellt:0 }; renderUebung();"); };
  const stand = () => tu('({ beantwortet: !!UEB.beantwortet, richtig: UEB.richtig, gestellt: UEB.gestellt })');
  let wurf = null;
  try {
    starte(a);
    const de = maskiert(a.satz.sentDe);
    ok('5 das Deutsche steht lesbar an der Frage', els.uebFrage.innerHTML.includes('ueb-frage-de') && els.uebFrage.innerHTML.includes(de));
    ok('5 das Deutsche steht nicht noch einmal darunter', els.uebDe.classList.contains('hidden'));
    ok('5 vor der Antwort ist sein Satz leer', zeile(els.uebSatz.innerHTML) === '');
    const vorrat = worteIn(els.uebBank.innerHTML);
    ok('5 der Vorrat zeigt jedes Wort einmal und ist zu sehen', !els.uebBank.classList.contains('hidden')
      && vorrat.slice().sort().join('|') === a.bausteine.map(maskiert).sort().join('|'));
    ok('5 der Vorrat verrät die Reihenfolge nicht', vorrat.join('|') !== a.bausteine.map(maskiert).join('|'));
    ok('5 „Prüfen" ist da', !els.btnUebPruefen.classList.contains('hidden'));
    /* zwei Wörter setzen: das letzte, dann das erste */
    tu(`uebungBaustein(${n - 1}); uebungBaustein(0);`);
    ok('5 ein Tipp setzt das Wort ans Ende seines Satzes', worteIn(zeile(els.uebSatz.innerHTML)).join('|') === [a.bausteine[n - 1], a.bausteine[0]].map(maskiert).join('|'));
    ok('5 ein gesetztes Wort ist im Vorrat als benutzt markiert', (els.uebBank.innerHTML.match(/ueb-baustein benutzt/g) || []).length === 2);
    tu(`uebungWortTipp(${n - 1});`);
    ok('5 ein Tipp auf sein Wort nimmt es zurück', worteIn(zeile(els.uebSatz.innerHTML)).join('|') === maskiert(a.bausteine[0])
      && (els.uebBank.innerHTML.match(/ueb-baustein benutzt/g) || []).length === 1);
    /* halber Satz: „Prüfen" wertet nicht */
    meldungen.length = 0;
    tu('uebungMehrfachPruefen();');
    ok('5 „Prüfen" wertet einen halben Satz nicht und sagt es', stand().beantwortet === false && stand().gestellt === 0 && meldungen.length === 1);
    /* falsch zu Ende bauen: erstes Wort steht, dann die übrigen von hinten */
    for (let t = n - 1; t >= 1; t--) tu(`uebungBaustein(${t});`);
    tu('uebungMehrfachPruefen();');
    ok('5 die falsche Reihenfolge zählt als falsch', stand().beantwortet === true && stand().richtig === 0 && stand().gestellt === 1
      && /schlecht/.test(els.uebRueckmeldung.className));
    const rueck = els.uebRueckmeldung.innerHTML;
    ok('5 nach dem Fehler steht der richtige Satz mit Satzzeichen da', rueck.includes('ueb-rueck-satz')
      && worteIn(rueck.slice(rueck.indexOf('ueb-rueck-satz'))).slice(0, n).join('|') === a.zeilen.map(t => maskiert(t.wort)).join('|'));
    ok('5 in seinem Satz ist das falsch gesetzte Wort rot, das richtige grün', /bau-wort falsch/.test(els.uebSatz.innerHTML) && /bau-wort richtig/.test(els.uebSatz.innerHTML));
    ok('5 nach dem Prüfen weicht der Vorrat', els.uebBank.classList.contains('hidden'));
    /* dieselbe Aufgabe noch einmal, diesmal richtig */
    starte(a);
    for (let t = 0; t < n; t++) tu(`uebungBaustein(${t});`);
    tu('uebungMehrfachPruefen();');
    ok('5 die Reihenfolge des Satzes zählt als richtig', stand().beantwortet === true && stand().richtig === 1 && /gut/.test(els.uebRueckmeldung.className));
    ok('5 nach der richtigen Antwort steht nichts mehr vom Fehler davor da', !els.uebRueckmeldung.innerHTML.includes('ueb-rueck-satz')
      && !els.uebRueckmeldung.innerHTML.includes('Richtig ist'));
  } catch (e){ wurf = e; }
  ok('5 der Ablauf läuft ohne Wurf' + (wurf ? ' — ' + String(wurf.message).slice(0, 140) : ''), !wurf);
  return { rot, zahl: aufgaben.length };
}

// ---------------------------------------------------------------- der echte Stand
let exit = 0;
const echt = lauf(QUELLE);
if (echt.rot.length){
  exit = 1;
  console.log('✘ test-satz-bauen: ' + echt.rot.length + ' Zusicherung(en) verletzt');
  for (const r of echt.rot) console.log('   ✘ ' + r);
} else console.log(`✔ Übung 17 „Satzbau": alle Zusicherungen halten (${echt.zahl} Aufgaben in seiner Auswahl)`);

// ---------------------------------------------------------------- Störtests
/* [Name, alt, neu, die Zusicherung, die rot werden MUSS (Anfang ihres Namens)] */
const STOERUNGEN = [
  ['zwei Wörter reichen', 'z.length < UEB_BAU_MIN) return [];', 'z.length < 2) return [];', '2 '],
  ['Bausteine mit Satzzeichen', "String((t && t.rein) || '').normalize('NFC')", "String((t && t.wort) || '').normalize('NFC')", '2 '],
  ['Sätze mit « » zugelassen', "if (UEB_ZITAT.test(String(satz.sentAr || ''))) return [];", '', '2 ein Satz mit « »'],
  ['Aufzählungen zugelassen', "if (z.slice(0, -1).every(t => /[،:]$/.test(String(t.wort || '')))) return [];", '', '2 eine reine Aufzählung'],
  ['Wertung nach Nummer statt nach Wort', '&& reihe.every((t, k) => a.bausteine[t] === a.bausteine[k]);', '&& reihe.every((t, k) => t === k);', '3 zwei GLEICHE'],
  ['halber Satz wird gewertet', 'if (reihe.length < a.bausteine.length) return null;', '', '3 ein halber Satz'],
  ['Vorrat darf die Lösung sein', 'if (j > 0) [reihe[0], reihe[j]] = [reihe[j], reihe[0]];', '', '4 '],
  ['das Deutsche fehlt an der Frage', 'deAlsAufgabe:true,', 'deAlsAufgabe:false,', '5 das Deutsche steht lesbar'],
  ['das Deutsche steht doppelt', '|| m.deAlsAufgabe));', '));', '5 das Deutsche steht nicht noch einmal'],
  ['kein „Prüfen" beim Bauen', "['mehrfach', 'schreiben', 'bauen'].includes(uebungArtVon(a))", "['mehrfach', 'schreiben'].includes(uebungArtVon(a))", '5 „Prüfen" ist da'],
  ['gesetztes Wort bleibt im Vorrat tippbar', "class=\"ueb-baustein${weg ? ' benutzt' : ''}\"", 'class="ueb-baustein"', '5 ein gesetztes Wort'],
  ['Tipp auf sein Wort nimmt nichts zurück', 'if (UEB.gewaehlt.delete(i)) renderUebung();', 'renderUebung();', '5 ein Tipp auf sein Wort'],
  ['nach dem Fehler fehlt der richtige Satz', 'a.loesungSatz = richtig ? null : a.zeilen.map(z => z.wort);', 'a.loesungSatz = null;', '5 nach dem Fehler'],
  ['der Fehler von vorhin bleibt stehen', "a.aufloesung = richtig ? '' : 'Richtig ist:';", "if (!richtig) a.aufloesung = 'Richtig ist:';", '5 nach der richtigen Antwort'],
  ['der Vorrat bleibt nach dem Prüfen stehen', "bank.classList.toggle('hidden', !baut || !!UEB.beantwortet);", "bank.classList.toggle('hidden', !baut);", '5 nach dem Prüfen weicht'],
  ['keine eigene Gruppe im Wähler', "['Bauen',            'bauen']", "['Bauen',            'bauenx']", '1 eigene Gruppe'],
  ['die Zeitschätzung kennt die Art nicht', 'schreiben: 60, bauen: 12 }', 'schreiben: 60 }', '1 die Zeitschätzung'],
  /* Seine zwei Teile bleiben, wie sie waren (gemessen an seinem Stand am
     04.10.2026): die neue Übung kommt zu den bisherigen dazu, keine wechselt. */
  ['die neue Übung würfelt seine zwei Teile neu', 'schreiben: 60, bauen: 12 }', 'schreiben: 60, bauen: 30 }', '1 seine zwei Teile']
];
let taub = 0;
for (const [name, alt, neu, soll] of STOERUNGEN){
  if (!QUELLE.includes(alt)){ taub++; console.log(`✘ Störtest „${name}": die Stelle steht nicht mehr im Quelltext — der Störtest prüft nichts`); continue; }
  let erg = null, wurf = null;
  try { erg = lauf(QUELLE.replace(alt, neu)); } catch (e){ wurf = e; }
  if (wurf){ taub++; console.log(`✘ Störtest „${name}": die gestörte Datei lädt nicht (${String(wurf.message).slice(0, 100)}) — so beweist er nichts`); continue; }
  const trifft = erg.rot.some(r => r.startsWith(soll));
  if (!trifft){ taub++; console.log(`✘ Störtest „${name}": bleibt grün — erwartet war rot bei „${soll}…" (rot war: ${erg.rot.join(' · ') || 'nichts'})`); }
}
if (taub) exit = 1;
else console.log(`✔ alle ${STOERUNGEN.length} Störtests schlagen an`);
process.exit(exit);
