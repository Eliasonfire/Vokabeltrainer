#!/usr/bin/env node
/* test-verb-einsetzen.mjs — bewacht Übung 17 „Verb einsetzen" (v672, 13.10.2026).
 *
 * Elias am 12.10.2026: „ich brauche auch eine sätze übung fürs konjugieren,
 * tüftle eine sehr gute übung dafür aus" — und am 13.10.2026 auf „bauen wie oben
 * gezeigt, zuerst nur Stufe 1, und sie dir zeigen": „passt so arbeite weiter".
 *
 * Bewacht:
 *   1. Platz in der Liste: Nummer 17, Art „wahl", Nummern linear 1 bis N,
 *      Übersetzen 19, Satzbau 20 (seit Übung 18 „Mehrzahl einsetzen", v677);
 *      seine zwei Teile bleiben, wie sie waren, und
 *      die neue steht nie im selben Teil wie Übung 14 (dieselben Sätze).
 *   2. KEINE SELBST KONJUGIERTE FORM: jede der 13 × 13 Formen steht im Abzug
 *      der Nachschlagetabellen (werkzeuge/verbformen-belege.json) UND ist
 *      „Stamm + Endung seines Lehrers" (UEB_MADI_PRONOMEN); die dreizehn Formen
 *      von ذَهَبَ stehen wörtlich in der Regel verb-madi-endungen-01.
 *   3. Jede Aufgabe aus seinem Satzvorrat: die Lösung ist die Form, die im Buch
 *      steht; vier verschiedene Formen DESSELBEN Verbs zur Wahl; die Lücke
 *      zeigt die Form nicht; das Viererfeld ist eins der festen Felder.
 *   4. Jede Person seiner zwölf Pronomen-Karten hat eine Aufgabe.
 *   5. Nichts geraten: ohne Vokalzeichen, in der Gegenwart und am gleich
 *      geschriebenen Nomen entsteht keine Aufgabe; steht niemand im Satz, der
 *      handelt, sagt die Frage, wer gemeint ist — sonst nicht.
 *   6. Dieselbe Form zweimal im Satz: EINE Aufgabe, beide Stellen sind Lücke.
 *   7. Mehrzahl hinter dem Verb: keine Aufgabe.
 *   8. Die Viererfelder verraten nichts: je vier Personen, jede Person in
 *      mindestens zwei Feldern.
 *   9. Nach der Antwort: das Dreierpaket des Lehrers mit genau EINER umrandeten
 *      Form (der gefragten); bei falscher Wahl der Satz zur gewählten Form.
 *  10. Was falsch war, kommt nach drei anderen Aufgaben noch einmal, höchstens
 *      zweimal; eine richtige Antwort verlängert die Runde nicht.
 *  11. Kurze Zeilen für Formen ohne Satz (Paket B, 13.10.2026) gibt es NUR mit
 *      seinem Schalter (SETTINGS.verbKurzzeilen, Voreinstellung aus).
 *  12. Mit dem Schalter hat jede der 13 × 13 Formen genau eine Art Aufgabe: einen
 *      Satz oder eine Zeile aus Pronomen, Lücke und (Verb) — nie beides; die Zeile
 *      fällt weg, sobald ein Satz die Form trägt; die Frage nennt die Person in
 *      Worten; nur im Thema „alle"; als Herkunft steht die Formenreihe des Lehrers.
 *  13. Sätze zuerst: in der Runde der Übung je Person, in der gemischten Runde
 *      überhaupt, und der Deckel „je Antwort gleich viele" streicht nie einen Satz.
 *  14. uebungenAufbauen() hängt die Zeilen an und baut neu, wenn er umschaltet.
 * Jede Zusicherung hat einen Störtest am ECHTEN Quelltext (js/uebung.js, im
 * Speicher verändert), der sie rot werden lassen muss.
 *
 *   node test-verb-einsetzen.mjs     Exit 0 = alles grün, alle Störtests schlagen an
 *   (--wurzel <Ordner> --quelle <uebung.js> --belege <json>: für einen Probelauf
 *    an einer Kopie, bevor sie im Repo liegt)
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const arg = n => { const i = process.argv.indexOf(n); return i === -1 ? null : process.argv[i + 1]; };
const W = arg('--wurzel') || path.dirname(fileURLToPath(import.meta.url));
const QUELLE = fs.readFileSync(arg('--quelle') || path.join(W, 'js/uebung.js'), 'utf8');
const BELEGE = JSON.parse(fs.readFileSync(arg('--belege') || path.join(W, 'werkzeuge/verbformen-belege.json'), 'utf8'));
const N = s => String(s).normalize('NFC');
const REIHE = ['huwa', 'huma-m', 'hum', 'hiya', 'huma-f', 'hunna', 'anta', 'antuma', 'antum', 'anti', 'antunna', 'ana', 'nahnu'];

/* Ein DOM, das sich merkt, was hineingeschrieben wird — je id EIN Element. */
function welt(){
  const el = new Map();
  const neu = () => ({ style:{}, classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } }, dataset:{}, children:[], value:'', textContent:'', innerHTML:'', className:'', disabled:false,
    addEventListener(){}, removeEventListener(){}, appendChild(){}, querySelector(){ return null; }, querySelectorAll(){ return []; }, closest(){ return null; },
    getAttribute(){ return null; }, setAttribute(){}, removeAttribute(){}, focus(){}, getBoundingClientRect(){ return { width:0, height:0, top:0, left:0 }; } });
  const hole = id => { if (!el.has(id)) el.set(id, neu()); return el.get(id); };
  return { el, DOM: { getElementById: hole, querySelector: () => neu(), querySelectorAll: () => [], createElement: neu, addEventListener(){}, body: neu(), documentElement: neu() } };
}

/* Die App wie in test-pronomen-verb.mjs: seine Kapitelauswahl (.stand-app.json),
   die Buchkarten mit ihren Sätzen und die bestellten Fachbegriffe. Dazu das
   Wenige aus js/kern.js, das eine Antwort braucht (uebungAuswerten). */
function lade(uebungQuelle){
  const { el, DOM } = welt();
  const auswahl = JSON.parse(fs.readFileSync(path.join(W, '.stand-app.json'), 'utf8')).buecher || {};
  const ctx = { window:{ addEventListener(){}, matchMedia(){ return { matches:false, addEventListener(){} }; }, location:{ href:'' }, navigator:{ userAgent:'node', language:'de' }, VOKABELN:{}, innerWidth: 400 },
    document: DOM, localStorage:{ _d:{}, getItem(k){ return this._d[k] ?? null; }, setItem(k, v){ this._d[k] = String(v); }, removeItem(k){ delete this._d[k]; } },
    navigator:{ userAgent:'node', language:'de', onLine:true }, console:{ log(){}, warn(){}, error(){}, info(){} },
    Date, Math, JSON, Intl, setTimeout, clearTimeout, setInterval, clearInterval };
  ctx.globalThis = ctx; ctx.self = ctx; ctx.window.document = DOM; ctx.window.localStorage = ctx.localStorage;
  ctx.SETTINGS = { buecher: auswahl, eigene:true, fachbegriffe:true };
  ctx.todayStr = () => '2026-10-13';
  ctx.LS = { get: (k, d) => d, set(){} };
  ctx.shuffle = a => a.slice();
  ctx.toast = () => {};
  ctx.kapitelBeschriftung = () => '';
  ctx.escapeHtml = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
  ctx.istBekannt = w => !!w && (w.chapter === 'personal' || bekannt.has(String(w.id)));
  vm.runInContext('UEB_WORTGRUPPEN = {}; if (typeof setzeLexikon === "function") setzeLexikon(VOCAB_DATA)', ctx);
  return { hole, ctx, el, run: code => vm.runInContext(code, ctx) };
}

function pruefe(quelle){
  const f = [];
  let app;
  try { app = lade(quelle); } catch (e){ return { f: ['lädt nicht: ' + e.message], zahl: 0 }; }
  const { hole, el, run } = app;
  const UEBUNGEN = hole('UEBUNGEN') || [];
  const U = UEBUNGEN.find(u => u.id === 'verb-einsetzen');
  const an = hole('analysiereSatz');
  if (!U || !an) return { f: ['Übung verb-einsetzen oder analysiereSatz fehlt'], zahl: 0 };
  const PERS = hole('UEB_VERB_PERSONEN') || [], VERBEN = hole('UEB_VERBEN') || [], FELDER = hole('UEB_VERB_FELDER') || [], PAKETE = hole('UEB_VERB_PAKETE') || {};
  const baue = (ar, de) => { try { return U.baue(an(N(ar)), { sentAr: N(ar), sentDe: de || '' }) || []; } catch (e){ f.push(`baue() wirft an «${ar}»: ${e.message}`); return []; } };

  /* 1 — Platz in der Liste */
  if (U.nr !== 17 || U.art !== 'wahl') f.push(`1: nr ${U.nr}, art ${U.art} (erwartet 17, wahl)`);
  if (typeof U.hinweisVerraet !== 'boolean') f.push('1: hinweisVerraet fehlt (Pflichtfeld)');
  const nummern = UEBUNGEN.map(u => u.nr).sort((a, b) => a - b);
  if (!nummern.every((n, i) => n === i + 1)) f.push('1: Nummern nicht linear 1 bis N: ' + nummern.join(','));
  const nrVon = id => (UEBUNGEN.find(u => u.id === id) || {}).nr;
  /* 13.10.2026 (v677): 18/19 → 19/20, seit „Mehrzahl einsetzen" die 18 trägt. */
  if (nrVon('uebersetzen') !== 19 || nrVon('satz-bauen') !== 20) f.push(`1: Übersetzen ${nrVon('uebersetzen')}, Satzbau ${nrVon('satz-bauen')} (erwartet 19 und 20)`);
  if (hole('UEBUNG_WARUM')['verb-einsetzen'] !== 'verb-madi-endungen-01') f.push('1: „Warum?" zeigt nicht auf verb-madi-endungen-01');
  { const mit = hole('satzTeile')();
    const stelle = UEBUNGEN.indexOf(U);
    UEBUNGEN.splice(stelle, 1);
    let ohne = null; try { ohne = hole('satzTeile')(); } finally { UEBUNGEN.splice(stelle, 0, U); }
    const gewechselt = UEBUNGEN.filter(m => m !== U && ohne[1].includes(m.id) !== mit[1].includes(m.id)).map(m => m.nr);
    if (gewechselt.length) f.push('1t: seine zwei Teile bleiben nicht — den Teil wechseln die Übungen ' + gewechselt.join(', '));
    if ([1, 2].filter(t => mit[t].includes('verb-einsetzen')).length !== 1) f.push('1t: die neue steht nicht in genau einem Teil');
    if ([1, 2].some(t => mit[t].includes('verb-einsetzen') && mit[t].includes('pronomen'))) f.push('1v: im selben Teil wie Übung 14 (dieselben Sätze)');
  }

  /* 2 — keine selbst konjugierte Form */
  const enden = new Map((hole('UEB_MADI_PRONOMEN') || []).map(([p, e]) => [e, p]));
  const ENDE = { 'huwa':'َ', 'huma-m':'َا', 'hum':'ُوا', 'hiya':'َتْ', 'huma-f':'َتَا', 'hunna':'ْنَ', 'anta':'ْتَ', 'antuma':'ْتُمَا', 'antum':'ْتُمْ', 'anti':'ْتِ', 'antunna':'ْتُنَّ', 'ana':'ْتُ', 'nahnu':'ْنَا' };
  if (PERS.map(p => p.id).join() !== REIHE.join()) f.push('2: die Personen stehen nicht in der Reihenfolge der Dreierpakete');
  for (const p of PERS) if (enden.get(N(ENDE[p.id])) !== p.pron) f.push(`2: ${p.id} — Endung und Pronomen passen nicht zu UEB_MADI_PRONOMEN`);
  const belegt = Object.keys(BELEGE.verben || {});
  if (VERBEN.length !== 13 || belegt.length !== 13) f.push(`2: ${VERBEN.length} Verben in der Liste, ${belegt.length} im Abzug (erwartet 13 und 13)`);
  for (const v of VERBEN){
    const grund = N(v.formen[0]);
    const b = (BELEGE.verben || {})[grund];
    if (!b){ f.push(`2: ${grund} — kein Abzug der Nachschlagetabelle`); continue; }
    if (v.formen.length !== 13) f.push(`2: ${grund} — ${v.formen.length} Formen statt 13`);
    REIHE.forEach((p, k) => {
      const tab = (b.formen[p] || []).map(N);
      if (!(tab.length === 1 && tab[0] === N(v.formen[k]))) f.push(`2: ${grund} ${p} — in der Liste ${v.formen[k]}, in der Tabelle ${tab.join('/') || 'nichts'}`);
      if (N(grund.replace(/َ$/, '') + ENDE[p]) !== N(v.formen[k])) f.push(`2: ${grund} ${p} — ${v.formen[k]} ist nicht Stamm + Endung des Lehrers`);
    });
  }
  { const regel = (hole('GRAMMAR_RULES') || []).find(r => r.id === 'verb-madi-endungen-01');
    const text = N((regel && regel.shortExplanation) || '');
    const dhahaba = VERBEN.find(v => N(v.formen[0]) === N('ذَهَبَ'));
    if (!dhahaba) f.push('2: ذَهَبَ fehlt in der Liste');
    else for (const form of dhahaba.formen) if (!new RegExp('(^|[\\s·:])' + N(form) + '($|[\\s·\\n])').test(text)) f.push(`2: ${form} steht nicht wörtlich in der Regel seines Lehrers`);
    for (const pk of Object.values(PAKETE)) if (!text.includes(pk.name)) f.push(`2: Paketname „${pk.name}" steht nicht in der Regel`);
  }

  /* 3 + 4 — an seinem Satzvorrat */
  const pool = hole('alleSaetze')();
  const jePerson = new Map();
  let zahl = 0;
  const feldSchluessel = new Set(FELDER.map(x => x.slice().sort().join()));
  for (const s of pool){
    let z; try { z = an(s.sentAr); } catch (e){ continue; }
    let a = []; try { a = U.baue(z, s) || []; } catch (e){ f.push(`3: baue() wirft an ${s.id}: ${e.message}`); }
    for (const x of a){
      zahl++;
      const wo = `${s.id || s.sentAr}`;
      const werte = x.optionen.map(o => o.wert);
      if (werte.filter(w => w === x.loesung).length !== 1) f.push(`3: Lösung nicht genau einmal in der Auswahl — ${wo}`);
      if (werte.length !== 4 || new Set(x.optionen.map(o => N(o.text))).size !== 4) f.push(`3: nicht vier verschiedene Formen — ${wo}`);
      if (!feldSchluessel.has(werte.slice().sort().join())) f.push(`3: die Auswahl ist keins der festen Viererfelder — ${wo}`);
      const L = x.optionen.find(o => o.wert === x.loesung);
      const gedruckt = N(String(z[x.wortIdx].wort));
      if (L && !gedruckt.startsWith(N(L.text))) f.push(`3: die Lösung ${L && L.text} ist nicht die Form im Satz (${gedruckt}) — ${wo}`);
      const verb = VERBEN.find(v => x.optionen.every(o => v.formen.some(fm => N(o.text).endsWith(N(fm)))));
      if (!verb) f.push(`3: die vier Formen gehören nicht zu EINEM Verb der Liste — ${wo}`);
      for (const [j, text] of Object.entries(x.ohneSuffix || {})) if (!/____/.test(text) || (L && N(text).includes(N(L.text)))) f.push(`3: die Lücke an Stelle ${j} zeigt die Form — ${wo}`);
      if (!x.ohneSuffix || x.ohneSuffix[x.wortIdx] == null) f.push(`3: an der gefragten Stelle steht keine Lücke — ${wo}`);
      /* 9a — das Paket */
      const gefragt = (x.paket || []).filter(g => g.gefragt);
      if (!(x.paket || []).length || gefragt.length !== 1) f.push(`9: Paket fehlt oder nicht genau eine gefragte Form — ${wo}`);
      else {
        const P = PERS.find(p => p.id === x.loesung);
        if (!(P && verb && N(gefragt[0].ar) === N(P.pron + ' ' + verb.formen[P.i]))) f.push(`9: die umrandete Form ist nicht die gefragte — ${wo}`);
        const pk = PAKETE[P && P.paket];
        if (!pk || x.paket.length !== pk.glieder.length || !x.aufloesung.includes(pk.name)) f.push(`9: Paket ist nicht das Dreierpaket des Lehrers — ${wo}`);
      }
      for (const o of x.optionen){
        const P = PERS.find(p => p.id === o.wert);
        if (!o.falsch || !P || !o.falsch.includes(P.pron)) f.push(`9: Antwort ${o.text} ohne Satz „gehört zu …" — ${wo}`);
      }
      if (!jePerson.has(x.loesung)) jePerson.set(x.loesung, wo);
    }
  }
  if (zahl < 15) f.push(`3: nur ${zahl} Aufgaben in seiner Auswahl (Pflichtprogramm: mindestens 15)`);
  const karten = (hole('FACHBEGRIFF_VOKABELN') || []).filter(w => /^gram-pron-/.test(String(w.id)) && w.sentAr);
  for (const k of karten){
    const a = baue(k.sentAr, k.sentDe);
    const P = PERS.find(p => p.pron === N(k.ar) && a.some(x => x.loesung === p.id));
    if (!P) f.push(`4: ${k.ar} — keine Aufgabe aus dem Satz seiner Karte «${k.sentAr}»`);
  }

  /* 5 — nichts geraten */
  for (const [s, was] of [['هِيَ ذهبت إِلَى الْمَسْجِدِ.', 'ohne Vokalzeichen'], ['أَنْتَ تَذْهَبُ إِلَى الْمَسْجِدِ.', 'Gegenwart'], ['لَا، أَذْهَبُ بِالْحَافِلَةِ.', 'Gegenwart mit أَ'], ['هَذِهِ كُتُبٌ جَدِيدَةٌ.', 'Nomen كُتُبٌ']])
    if (baue(s).length) f.push(`5: geratene Aufgabe (${was}) aus «${s}»`);
  { const ohne = baue('مَتَى ذَهَبْتَ؟', 'Wann bist du gegangen?');
    if (ohne.length !== 1 || !/Gemeint ist: du \(männlich\)\./.test(ohne[0].frage)) f.push('5a: «مَتَى ذَهَبْتَ؟» — die Frage sagt nicht, wer gemeint ist');
    const mit = baue('هُمْ ذَهَبُوا إِلَى الْمَسْجِدِ.', 'Sie gingen in die Moschee.');
    if (mit.length !== 1 || /Gemeint ist/.test(mit[0].frage)) f.push('5a: «هُمْ ذَهَبُوا …» — die Frage verrät die Person, obwohl das Pronomen dasteht');
    const nomen = baue('ذَهَبَ الْمُدَرِّسُ إِلَى الْمَدْرَسَةِ.', 'Der Lehrer ging zur Schule.');
    if (nomen.length !== 1 || nomen[0].loesung !== 'huwa' || /Gemeint ist/.test(nomen[0].frage)) f.push('5a: «ذَهَبَ الْمُدَرِّسُ …» — keine saubere Aufgabe mit dem Nomen als Handelndem');
    const und = baue('خَرَجَ الْمُدَرِّسُ مِنَ الْفَصْلِ وَذَهَبَ إِلَى الْمُدِيرِ.', '');
    const zweite = und.find(x => /^وَ/.test(String((x.optionen[0] || {}).text)));
    if (und.length !== 2 || !zweite || !/^وَ____/.test(zweite.ohneSuffix[zweite.wortIdx])) f.push('5b: «… وَذَهَبَ …» — das وَ bleibt nicht vor der Lücke stehen');
  }
  /* 6 — Zwillinge */
  { const a = baue('مَنْ خَرَجَ مَعَهُ؟ خَرَجَ مَعَهُ عَمِّي.', 'Wer ging mit ihm hinaus? Mein Onkel ging mit ihm hinaus.');
    if (a.length !== 1 || Object.keys(a[0].ohneSuffix || {}).length !== 2) f.push(`6: dieselbe Form zweimal — ${a.length} Aufgaben, ${a[0] ? Object.keys(a[0].ohneSuffix || {}).length : 0} Lücken (erwartet 1 und 2)`); }
  /* 7 — Mehrzahl hinter dem Verb */
  if (baue('ذَهَبَ الطُّلَّابُ إِلَى الْمَطْعَمِ.', 'Die Studenten gingen ins Restaurant.').length) f.push('7: Aufgabe trotz Mehrzahl hinter dem Verb');
  if (baue('الطُّلَّابُ ذَهَبُوا إِلَى الْمَطْعَمِ.', 'Die Studenten gingen ins Restaurant.').length !== 1) f.push('7: keine Aufgabe, obwohl die Mehrzahl VOR dem Verb steht');
  /* 8 — die Felder */
  for (const feld of FELDER) if (feld.length !== 4 || new Set(feld).size !== 4 || feld.some(id => !REIHE.includes(id))) f.push('8: ein Feld hat nicht vier verschiedene Personen: ' + feld.join(','));
  for (const id of REIHE){ const n = FELDER.filter(x => x.includes(id)).length; if (n < 2) f.push(`8: ${id} steht nur in ${n} Feld — dann verrät das Feld die Lösung`); }

  /* 9b + 10 — eine Runde: falsch, richtig, das Bild der Rückmeldung */
  try {
    const eine = (ar, de) => { const s = { id: 'test', sentAr: N(ar), sentDe: de }; const z = an(s.sentAr); return U.baue(z, s).map(x => ({ ...x, satz: s, zeilen: z, modus: U })); };
    const liste = [...eine('هُمْ ذَهَبُوا إِلَى الْمَسْجِدِ.', 'Sie gingen in die Moschee.'), ...eine('أَنَا ذَهَبْتُ إِلَى الْمَسْجِدِ.', 'Ich ging in die Moschee.'),
      ...eine('نَحْنُ ذَهَبْنَا إِلَى الْمَسْجِدِ.', 'Wir gingen in die Moschee.'), ...eine('هُوَ ذَهَبَ إِلَى الْمَسْجِدِ.', 'Er ging in die Moschee.'), ...eine('هِيَ ذَهَبَتْ إِلَى الْمَسْجِدِ.', 'Sie ging in die Moschee.')];
    app.ctx.__liste = liste;
    run(`UEB = { modus:'verb-einsetzen', liste: __liste, idx:0, gewaehlt:new Set(), beantwortet:false, richtig:0, gestellt:0, teil:null };`);
    const erste = liste[0], falschWert = erste.optionen.find(o => o.wert !== erste.loesung).wert;
    run(`renderUebung()`);
    if (N(el.get('uebSatz').innerHTML).includes(N('ذَهَبُوا')) || !/____/.test(el.get('uebSatz').innerHTML)) f.push('9: vor der Antwort steht die Form im Satz statt der Lücke');
    if (/opt-kuerzel/.test(el.get('uebWahl').innerHTML)) f.push('9: unter den Antworten steht ein Kürzel — das ist hier die Lösung');
    app.ctx.__w = falschWert; run(`uebungWahl(__w)`);
    const bild = el.get('uebRueckmeldung').innerHTML;
    const falschSatz = erste.optionen.find(o => o.wert === falschWert).falsch;
    if (!N(bild.replace(/<[^>]+>/g, '')).includes(N(falschSatz).replace(/\s+/g, ' ').slice(0, 8))) f.push('9: bei falscher Wahl fehlt der Satz zur gewählten Form');
    if ((bild.match(/ueb-paket-glied gefragt/g) || []).length !== 1 || (bild.match(/ueb-paket-glied/g) || []).length !== 3) f.push('9: das Dreierpaket steht nicht mit genau einer umrandeten Form in der Rückmeldung');
    if (!N(el.get('uebSatz').innerHTML).includes(N('ذَهَبُوا'))) f.push('9: nach der Antwort steht die Form nicht im Satz');
    const L1 = run(`UEB.liste.length`);
    if (L1 !== 6 || run(`UEB.liste[4] && UEB.liste[4].nochmal`) !== 1 || run(`UEB.liste[4].loesung`) !== erste.loesung) f.push(`10: nach einer falschen Antwort kommt die Aufgabe nicht nach drei anderen noch einmal (Länge ${L1})`);
    run(`uebungWeiter()`); app.ctx.__w = liste[1].loesung; run(`uebungWahl(__w)`);
    if (run(`UEB.liste.length`) !== L1) f.push('10: eine richtige Antwort verlängert die Runde');
    if (/ueb-paket-glied gefragt/.test(el.get('uebRueckmeldung').innerHTML) === false) f.push('9: nach einer richtigen Antwort fehlt das Paket');
    /* die Wiederholung falsch, dann deren Wiederholung falsch: danach ist Schluss */
    run(`uebungWeiter(); uebungWeiter(); uebungWeiter();`);
    if (run(`UEB.liste[UEB.idx].nochmal`) !== 1) f.push('10: an Stelle 5 steht nicht die Wiederholung');
    app.ctx.__w = falschWert; run(`uebungWahl(__w)`);
    const L2 = run(`UEB.liste.length`);
    run(`UEB.idx = UEB.liste.length - 1; UEB.gewaehlt = new Set(); UEB.beantwortet = false;`);
    if (run(`UEB.liste[UEB.idx].nochmal`) !== 2) f.push(`10: die zweite Wiederholung fehlt (Länge ${L2})`);
    run(`uebungWahl(__w)`);
    if (run(`UEB.liste.length`) !== L2) f.push('10: mehr als zwei Wiederholungen derselben Aufgabe');
  } catch (e){ f.push('9/10: der Ablauf wirft — ' + e.message); }
  /* 11 bis 14 — die kurzen Zeilen für Formen ohne Satz (Paket B, 13.10.2026) */
  try {
    const pool = (hole('alleSaetze') || (() => []))();
    const vorhanden = [];
    for (const s of pool){ let z; try { z = an(N(s.sentAr)); } catch (e){ continue; } for (const a of (U.baue(z, s) || [])) vorhanden.push({ ...a, satz: s, zeilen: z, modus: U }); }
    const paar = a => a.verbNr + '|' + a.loesung;
    if (vorhanden.some(a => !(a.verbNr >= 0))) f.push('12: eine Satzaufgabe kennt ihr Verb nicht (verbNr)');
    /* 11 — ohne seinen Schalter nichts */
    app.ctx.SETTINGS.verbKurzzeilen = false;
    if (typeof U.ohneSatz !== 'function') f.push('11: ohneSatz() fehlt am Eintrag');
    else {
      if (U.ohneSatz(vorhanden).length) f.push('11: ohne seinen Schalter entstehen kurze Zeilen');
      /* 12 — mit dem Schalter: jede der 13 × 13 Formen hat GENAU eine Art Aufgabe */
      app.ctx.SETTINGS.verbKurzzeilen = true;
      const kurz = U.ohneSatz(vorhanden);
      const mitSatz = new Set(vorhanden.map(paar)), mitZeile = new Set(kurz.map(paar));
      const alle = VERBEN.length * PERS.length;
      if (alle !== 169 || mitSatz.size + mitZeile.size !== alle || kurz.length !== mitZeile.size) f.push(`12: ${mitSatz.size} Formen mit Satz + ${mitZeile.size} mit Zeile (${kurz.length} Zeilen) ergeben nicht ${alle}`);
      if ([...mitZeile].some(k => mitSatz.has(k))) f.push('12: eine Form hat einen Satz UND eine kurze Zeile');
      for (const a of kurz){
        const verb = VERBEN[a.verbNr], P = PERS.find(p => p.id === a.loesung), wo = `12 (${verb && verb.de}, ${a.loesung})`;
        if (!verb || !P){ f.push(wo + ': Verb oder Person unbekannt'); continue; }
        if (!a.ohneSatz || a.wortIdx !== 1 || a.ohneSuffix[1] !== '____') f.push(wo + ': keine Lücke an der Stelle der Form');
        if (N(a.zeilen[0].wort) !== N(P.pron) || N(a.zeilen[1].wort) !== N(verb.formen[P.i]) || N(a.zeilen[2].wort) !== '(' + N(verb.formen[0]) + ')') f.push(wo + ': die Zeile ist nicht Pronomen, Form, (Verb)');
        const texte = a.optionen.map(o => N(o.text));
        if (a.optionen.length !== 4 || new Set(texte).size !== 4 || texte.some(t => !verb.formen.map(N).includes(t))) f.push(wo + ': keine vier verschiedenen Formen DESSELBEN Verbs');
        const lo = a.optionen.find(o => o.wert === a.loesung);
        if (!lo || N(lo.text) !== N(verb.formen[P.i])) f.push(wo + ': die Lösung ist nicht die belegte Form der Person');
        if (!String(a.frage).includes('Gemeint ist: ' + P.de + '.')) f.push('12f: die Frage nennt die Person nicht in Worten (' + a.loesung + ')');
        if ((a.paket || []).filter(g => g.gefragt).length !== 1) f.push(wo + ': das Dreierpaket hat nicht genau eine gefragte Form');
        if (!a.satz || a.satz.verbZeile !== verb.folge || !a.deKlar || !a.deKlar.test('irgendwas')) f.push(wo + ': Herkunft (Folge) oder lesbare deutsche Zeile fehlt');
      }
      const herkunftFn = hole('herkunft');
      if (kurz[0] && (typeof herkunftFn !== 'function' || !/^Formenreihe deines Lehrers/.test(herkunftFn(kurz[0].satz)))) f.push('12h: als Herkunft steht nicht „Formenreihe deines Lehrers"');
      /* 12w — kommt ein Satz dazu, fällt die Zeile weg */
      if (kurz[0]){
        const danach = U.ohneSatz([...vorhanden, { verbNr: kurz[0].verbNr, loesung: kurz[0].loesung }]);
        if (danach.length !== kurz.length - 1 || danach.some(a => paar(a) === paar(kurz[0]))) f.push('12w: die Zeile bleibt, obwohl ein Satz die Form jetzt trägt');
      }
      /* 12t — nur im Thema „alle" */
      try { run(`SATZ_THEMA = 'ein-einzelnes-thema'`); if (U.ohneSatz(vorhanden).length) f.push('12t: kurze Zeilen auch in einem einzelnen Thema'); }
      finally { run(`SATZ_THEMA = 'alle'`); }
      /* 13 — Sätze zuerst (die Zeilen stehen in der Eingabe absichtlich VORN) */
      const gemeinsam = [...kurz.map(a => ({ ...a, modus: U })), ...vorhanden];
      /* Hier mit einem „Mischen", das wirklich umstellt (umdrehen): mit dem stillen Mischen des Prüfstands
         käme die Reihenfolge schon aus dem Deckel, und die Regel in uebungReihum() bliebe ungeprüft. */
      const stillesMischen = app.ctx.shuffle;
      let runde;
      app.ctx.shuffle = a => a.slice().reverse();
      try { runde = hole('uebungMischen')(U, gemeinsam); } finally { app.ctx.shuffle = stillesMischen; }
      const jeP = new Map();
      runde.forEach((a, i) => { const e = jeP.get(a.loesung) || { letzterSatz: -1, ersteZeile: Infinity }; if (a.ohneSatz) e.ersteZeile = Math.min(e.ersteZeile, i); else e.letzterSatz = i; jeP.set(a.loesung, e); });
      if ([...jeP.values()].some(e => e.ersteZeile < e.letzterSatz)) f.push('13a: in der Runde der Übung steht bei einer Person eine kurze Zeile vor einem Satz');
      const gemischt = hole('uebungGemischteListe')({ 'verb-einsetzen': gemeinsam });
      const ersteZeile = gemischt.findIndex(a => a.ohneSatz);
      /* Der Deckel „je Antwort gleich viele" darf kurze Zeilen streichen, aber keinen Satz (uebungGleichViele). */
      /* Mit dem stillen Mischen gemessen: die Zeilen stehen in der Eingabe vorn, ohne die Regel zählte der Deckel sie zuerst. */
      const saetzeNachDeckel = hole('uebungMischen')(U, gemeinsam).filter(a => !a.ohneSatz).length;
      if (saetzeNachDeckel !== vorhanden.length) f.push(`13d: der Deckel streicht Satzaufgaben zugunsten kurzer Zeilen (${saetzeNachDeckel} von ${vorhanden.length} bleiben)`);
      if (ersteZeile !== vorhanden.length) f.push(`13g: die gemischte Runde zieht eine kurze Zeile an Stelle ${ersteZeile + 1}, obwohl es ${vorhanden.length} Satzaufgaben gibt`);
      /* 14 — der Aufbau hängt die Zeilen an, und der Schalter baut neu */
      const zaehle = an => run(`SETTINGS.verbKurzzeilen = ${an}; uebungenAufbauen()['verb-einsetzen'].filter(a => a.ohneSatz).length`);
      run(`SENT.list = alleSaetze(); UEB_CACHE = {};`);
      const aus1 = zaehle(false), an1 = zaehle(true), aus2 = zaehle(false);
      if (aus1 !== 0 || an1 !== kurz.length || aus2 !== 0) f.push(`14: uebungenAufbauen() hängt die Zeilen nicht an oder baut beim Umschalten nicht neu (aus ${aus1}, an ${an1}, wieder aus ${aus2}; erwartet 0, ${kurz.length}, 0)`);
    }
  } catch (e){ f.push('11–14: die Prüfung der kurzen Zeilen wirft — ' + e.message); }
  finally { app.ctx.SETTINGS.verbKurzzeilen = false; }
  return { f, zahl, jePerson };
}

let rot = 0;
const echt = pruefe(QUELLE);
if (echt.f.length){ console.log('❌ Echter Stand:'); echt.f.slice(0, 40).forEach(x => console.log('   ' + x)); rot = 1; }
else console.log(`✅ Echter Stand: ${echt.zahl} Aufgaben in seiner Auswahl, ${echt.jePerson.size} von 13 Personen mit Satz, 169 Formen belegt, nichts geraten.`);
{ const ohne = REIHE.filter(p => !echt.jePerson || !echt.jePerson.has(p));
  if (ohne.length) console.log(`   ⚠️ Lücke (kein Fehler): ohne Satz in seiner Auswahl — ${ohne.join(', ')}. Dafür fehlt ein belegter Satz aus seinen Büchern.`); }

const STOER = [
  ['die Vokalzeichen entscheiden nicht mehr', 'const passt = kand.filter(x => uebVertraeglich(v.rest, x.verb.formen[x.k]) >= 1);', 'const passt = kand;', /^4:/],
  ['eine Form der Liste verfälscht', 'ذَهَبَ ذَهَبَا ذَهَبُوا', 'ذَهَبَ ذَهَبَا ذَهَبُو', /^2:/],
  ['die Frage sagt nie, wer gemeint ist', "(hatAnker ? '' : ` Gemeint ist: ${P.de}.`)", "''", /^5a:/],
  ['die Frage sagt immer, wer gemeint ist', 'const hatAnker = z.some(', 'const hatAnker = false && z.some(', /^5a:/],
  ['dieselbe Form zweimal bleibt zwei Aufgaben', 'x.verb === st.verb && x.person === st.person) ? j : -1', 'false) ? j : -1', /^6:/],
  ['Mehrzahl hinter dem Verb wird gefragt', '&& uebVerbMehrzahlDanach(danach)) return;', '&& false) return;', /^7:/],
  ['ein Feld mit nur drei Personen', "['huwa', 'hiya', 'hum', 'hunna'],", "['huwa', 'hiya', 'hum'],", /^8:|^3:/],
  ['eine Person in nur einem Feld', "['ana', 'nahnu', 'hunna', 'huma-m'],", '', /^8:/],
  ['das Paket ohne umrandete Form', 'gefragt: id === P.id', 'gefragt: false', /^9:/],
  ['kein Satz zur falschen Wahl', 'if (gewaehlt) teile.push(gewaehlt.falsch);', '', /^9:/],
  ['Falsches kommt nicht wieder', 'falschNochmal: 3,', 'falschNochmal: 0,', /^10:/],
  ['Falsches kommt endlos wieder', '(aF.nochmal || 0) < 2', 'true', /^10:/],
  ['die Lösung ist die Form statt der Person', 'loesung: P.id,', 'loesung: formen[P.i],', /^3:/],
  ['teilRang fehlt', 'teilRang:100,', '', /^1t:/],
  ['Übung 14 und 17 dürfen in denselben Teil', ", ['pronomen', 'verb-einsetzen']];", '];', /^1v:/],
  /* Paket B (13.10.2026): die kurzen Zeilen für Formen ohne Satz */
  ['kurze Zeilen ohne seinen Schalter', "if (!(typeof SETTINGS === 'object' && SETTINGS && SETTINGS.verbKurzzeilen)) return [];", '', /^11:|^14:/],
  ['eine Zeile bleibt, obwohl ein Satz die Form trägt', "if (mitSatz.has(nr + '|' + person.id)) return;", '', /^12:|^12w:/],
  ['die Satzaufgabe merkt sich ihr Verb nicht', '          verbNr: UEB_VERBEN.indexOf(st.verb),\n', '', /^12:/],
  ['die Frage der kurzen Zeile nennt die Person nicht', 'frage: `Welche Form des Verbs gehört in die Lücke? Gemeint ist: ${person.de}.`,', "frage: 'Welche Form des Verbs gehört in die Lücke?',", /^12f:/],
  ['kurze Zeilen auch in einem einzelnen Thema', "if (typeof SATZ_THEMA !== 'undefined' && SATZ_THEMA !== 'alle') return [];", '', /^12t:/],
  ['kurze Zeilen stehen vor den Sätzen (Runde der Übung)', ': shuffle(k).sort((x, y) => (x.ohneSatz ? 1 : 0) - (y.ohneSatz ? 1 : 0)));', ': shuffle(k));', /^13a:/],
  ['die gemischte Runde zieht kurze Zeilen zuerst', '.sort((x, y) => (y.ohneSatz ? 1 : 0) - (x.ohneSatz ? 1 : 0)))', ')', /^13g:/],
  ['der Deckel streicht Sätze statt kurzer Zeilen', 'return shuffle(liste.slice()).sort((x, y) => (x.ohneSatz ? 1 : 0) - (y.ohneSatz ? 1 : 0)).filter(a => {', 'return shuffle(liste.slice()).filter(a => {', /^13d:/],
  ['der Aufbau hängt die kurzen Zeilen nicht an', '    dazu.forEach(a=>nachModus[m.id].push({ ...a, modus:m }));', '', /^14:/],
  ['der Schalter baut die Liste nicht neu', ' && UEB_CACHE.kurz === kurz', '', /^14:/]
];
for (const [name, alt, neu, muster] of STOER){
  if (!QUELLE.includes(alt)){ console.log(`❌ Störtest „${name}": Stelle nicht gefunden`); rot = 1; continue; }
  const r = pruefe(QUELLE.replace(alt, neu));
  const n = r.f.filter(x => muster.test(x)).length;
  if (n) console.log(`✅ Störtest „${name}" schlägt an (${n})`);
  else { console.log(`❌ Störtest „${name}" schlägt NICHT an` + (r.f.length ? ` — andere Befunde: ${r.f.slice(0, 2).join(' | ')}` : '')); rot = 1; }
}
process.exit(rot);
