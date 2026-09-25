#!/usr/bin/env node
/* test-endungen.mjs — bewacht Übung 15 „Endung einsetzen" (v612, 25.09.2026).
 *
 * Elias, wörtlich: „wie wäre es auch mit einem satz übung wo ich die richtigen
 * endungen hinzufügen muss wie zb ki für frau oder ha und hu usw.. also halt
 * alle die bisher zur auswahl stehen".
 *
 * Bewacht (Pflicht 8 des Pflichtprogramms: eigener Test mit Störtest):
 *   1. Nr. 15 unter „Auswählen", Übersetzen ist 16 (Liste linear, Pflicht 7).
 *   2. Die Auswahl sind SEINE Endungs-Karteikarten, live: eine Karte, die er
 *      nicht (mehr) hat, fehlt.
 *   3. Erkennung, geeicht an Wörtern aus seinen Büchern — und an den Fallen:
 *      فِي, ذَلِكَ, هُنَاكَ, تِلْكَ, الَّذِي, عَلَيْهِ (ـهِ), ein Verb mit
 *      Objekt-Endung, ein Wort, das selbst so im Wortschatz steht (سَمَكَ).
 *   4. Das gezeigte Wort verrät die Lösung nicht: keine Endung, kein Vokal
 *      davor — und ein gleiches Wort im Satz steht ebenfalls ohne Endung.
 *   5. „dein": die Frage sagt, ob ein Mann oder eine Frau angesprochen ist,
 *      passend zur Lösung.
 *   6. Die Anzeige (uebungSatzHtml) zeigt vor der Antwort das Wort ohne
 *      Endung, danach das ganze.
 * Jede Zusicherung hat einen Störtest am ECHTEN Quelltext (js/uebung.js, im
 * Speicher verändert), der sie rot werden lassen muss.
 *
 *   node test-endungen.mjs     Exit 0 = alles grün, alle Störtests schlagen an
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

/* Die App wie in werkzeuge/pruefe-satzmodus-aktuell.mjs: seine Kapitelauswahl
   (.stand-app.json), die Buchkarten mit ihren Sätzen und die bestellten
   Fachbegriffe (in der App hängt js/kern.js sie ein). */
function lade(uebungQuelle, extra){
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
  /* Vier Wörter nur für die Fallen in 3 — sie machen die Falle erst scharf:
     عَلَمٌ macht عَلَّمَهُ (Verb) zu einem scheinbaren Nomen + ـهُ; هُنَا als Nomen
     macht هُنَاكَ zu هُنَا + ـكَ; mit سَمٌّ UND سَمَكٌ wäre سَمَكَ („Fisch") sonst
     سَمّ + ـكَ. Ohne sie bestünde 3 auch ohne die Sperren. */
  VD.push({ id:'test-alam', ar:'عَلَمٌ', de:'Fahne (Test)', type:'noun', chapter:'personal' });
  VD.push({ id:'test-huna', ar:'هُنَا', de:'hier (Test)', type:'noun', chapter:'personal' });
  VD.push({ id:'test-samm', ar:'سَمٌّ', de:'Gift (Test)', type:'noun', chapter:'personal' });
  VD.push({ id:'test-samak', ar:'سَمَكٌ', de:'Fisch (Test)', type:'noun', chapter:'personal' });
  const versteckt = (extra && extra.versteckt) || [];
  ctx.istBekannt = w => !!w && !versteckt.includes(String(w.id)) && (w.chapter === 'personal' || bekannt.has(String(w.id)));
  if (typeof hole('escapeHtml') !== 'function')
    vm.runInContext('function escapeHtml(s){ return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }', ctx);
  vm.runInContext('UEB_WORTGRUPPEN = {}; if (typeof setzeLexikon === "function") setzeLexikon(VOCAB_DATA)', ctx);
  return { ctx, hole };
}

const EICH_JA = [
  // [Wort im Satz, Rolle, erwartete Endung, erwartete Anzeige] — alle aus seinen Büchern
  ['قَلَمُكَ', 'خَبَر', 'ـكَ', 'قَلَمـ'],
  ['عَمِّي', 'خَبَر', 'ـِي', 'عَمّـ'],
  ['وَلِي', 'خَبَر', 'ـِي', 'وَلـ'],
  ['أَلَكِ', 'جَارّ وَمَجْرُور (مَبْنِيّ)', 'ـكِ', 'أَلـ'],
  ['فِيهَا', 'جَارّ وَمَجْرُور (مَبْنِيّ)', 'ـهَا', 'فِيـ'],
  ['مَعَهُ', 'ظَرْف', 'ـهُ', 'مَعـ'],
  ['أَبُوكِ', 'خَبَر', 'ـكِ', 'أَبُوـ'],
  ['غُرْفَتِي', 'خَبَر', 'ـِي', 'غُرْفَتـ'],
  ['وَالِدُكَ', 'خَبَر', 'ـكَ', 'وَالِدـ'],
  ['اسْمُهَا', 'مُبْتَدَأ', 'ـهَا', 'اسْمـ'],
  ['زَوْجُهَا', 'مُبْتَدَأ', 'ـهَا', 'زَوْجـ']
];
const EICH_NEIN = [
  ['فِي', 'حَرْف جَرّ'], ['ذَلِكَ', 'مُبْتَدَأ'], ['هُنَاكَ', 'خَبَر'], ['تِلْكَ', 'مُبْتَدَأ'], ['الَّذِي', 'نَعْت'],
  ['عَلَيْهِ', 'جَارّ وَمَجْرُور (مَبْنِيّ)'], ['عَلَّمَهُ', 'فِعْل مَاضٍ'], ['سَمَكَ', 'مَفْعُول بِهِ']
];

function pruefeAlles(app){
  const { hole, ctx } = app;
  const fehler = {};
  const f = (punkt, text) => { (fehler[punkt] = fehler[punkt] || []).push(text); };
  const U = hole('UEBUNGEN') || [];
  const E = U.find(u => u.id === 'endungen'), Ue = U.find(u => u.id === 'uebersetzen');
  // 1
  if (!E) { f(1, 'Übung endungen fehlt'); return fehler; }
  if (E.nr !== 15 || E.art !== 'wahl') f(1, `endungen: nr ${E.nr}, art ${E.art} (erwartet 15, wahl)`);
  if (!Ue || Ue.nr !== 16) f(1, `uebersetzen: nr ${Ue && Ue.nr} (erwartet 16)`);
  if (typeof E.hinweisVerraet !== 'boolean') f(1, 'hinweisVerraet fehlt (Pflichtfeld)');
  // 2
  const glieder = hole('uebEndungGlieder')();
  const formen = glieder.map(g => g.form);
  const erwartet = ['ـِي', 'ـكَ', 'ـكِ', 'ـهُ', 'ـهَا'].filter(x => !(app.versteckt || []).some(id => (hole('FACHBEGRIFF_VOKABELN') || []).find(w => w.id === id && w.ar === x)));
  if (formen.join(' ') !== erwartet.join(' ')) f(2, `Auswahl ${formen.join(' ')} — erwartet ${erwartet.join(' ')}`);
  // 3
  const stelle = hole('uebEndungStelle');
  for (const [wort, rolle, form, anzeige] of EICH_JA){
    const st = stelle({ wort, rein: wort, rolle }, glieder);
    const ist = st ? `${st.glied.form} ${st.vorsatz}${st.stamm}ـ` : 'nicht erkannt';
    if (!st || st.glied.form !== form || `${st.vorsatz}${st.stamm}ـ` !== anzeige) f(3, `${wort}: ${ist} — erwartet ${form} ${anzeige}`);
  }
  for (const [wort, rolle] of EICH_NEIN){
    const st = stelle({ wort, rein: wort, rolle }, glieder);
    if (st) f(3, `${wort} (${rolle}) als ${st.glied.form} erkannt — ist keine seiner Endungen`);
  }
  // 4 + 5 am echten Satzvorrat
  const pool = hole('alleSaetze')(), zerlege = hole('analysiereSatz');
  const ske = hole('uebEndungSkelett');
  let aufgaben = 0, zwillingsSaetze = 0;
  for (const s of pool){
    let z; try { z = zerlege(s.sentAr); } catch (e){ continue; }
    const liste = E.baue(z, s) || [];
    const stellen = z.map(t => stelle(t, glieder));
    for (const a of liste){
      aufgaben++;
      const text = a.ohneSuffix && String(a.ohneSuffix[a.wortIdx] || '').replace(/[.،؟?!:؛]+$/, '');
      if (!text || !text.endsWith('ـ')) { f(4, `${s.id}: keine Anzeige ohne Endung`); continue; }
      const zeichenWort = (String(z[a.wortIdx].wort).match(/[.،؟?!:؛]+$/) || [''])[0];
      if (!String(a.ohneSuffix[a.wortIdx]).endsWith('ـ' + zeichenWort)) f(4, `${s.id}: Satzzeichen „${zeichenWort}" fehlt in der Anzeige`);
      const vorher = text.slice(0, -1);
      if (/[ً-ِْ]$/.test(vorher)) f(4, `${s.id}: „${text}" endet auf einem Vokal — verrät die Endung`);
      if (vorher.endsWith(String(a.loesung).slice(1))) f(4, `${s.id}: „${text}" trägt die Lösung ${a.loesung} noch`);
      if (!a.optionen.some(o => o.wert === a.loesung)) f(4, `${s.id}: Lösung fehlt in der Auswahl`);
      if (a.optionen.map(o => o.wert).join(' ') !== formen.join(' ')) f(4, `${s.id}: Auswahl ist nicht genau seine Karten`);
      const st = stellen[a.wortIdx];
      const key = x => ske(x.stamm) + '|' + x.glied.form;
      const zw = stellen.map((x, j) => (j !== a.wortIdx && x && st && key(x) === key(st)) ? j : -1).filter(j => j >= 0);
      if (zw.length) zwillingsSaetze++;
      for (const j of zw) if (a.ohneSuffix[j] == null) f(4, `${s.id}: „${z[j].rein}" steht daneben mit der Lösung`);
      const mann = /zu einem Mann/.test(a.frage), frau = /zu einer Frau/.test(a.frage);
      if (a.loesung === 'ـكَ' && !(mann && !frau)) f(5, `${s.id}: ـكَ ohne „zu einem Mann"`);
      if (a.loesung === 'ـكِ' && !(frau && !mann)) f(5, `${s.id}: ـكِ ohne „zu einer Frau"`);
      if (!['ـكَ', 'ـكِ'].includes(a.loesung) && (mann || frau)) f(5, `${s.id}: ${a.loesung} mit Angabe Mann/Frau`);
    }
  }
  if (aufgaben < 15) f(4, `nur ${aufgaben} Aufgaben (Pflicht: mindestens 15)`);
  if (!zwillingsSaetze) f(4, 'kein Satz mit zwei gleichen Wörtern geprüft — die Probe greift ins Leere');
  // 6 die Anzeige
  const satz = pool.find(s => s.id === 'mb1-58-1') || pool.find(s => /قَلَمُكَ/.test(s.sentAr));
  if (!satz) f(6, 'Probesatz mit قَلَمُكَ fehlt');
  else {
    const z = zerlege(satz.sentAr), a = (E.baue(z, satz) || [])[0];
    if (!a) f(6, 'keine Aufgabe am Probesatz');
    else {
      const html = beantwortet => { vm.runInContext(`UEB = { modus:null, liste:[], idx:0, gewaehlt:new Set(), beantwortet:${beantwortet} }`, ctx); return hole('uebungSatzHtml')({ ...a, zeilen: z }); };
      const vor = html(false), nach = html(true);
      if (!vor.includes(a.ohneSuffix[a.wortIdx]) || vor.includes(z[a.wortIdx].wort)) f(6, 'vor der Antwort steht nicht das Wort ohne Endung');
      if (!nach.includes(z[a.wortIdx].wort)) f(6, 'nach der Antwort fehlt das ganze Wort');
    }
  }
  app.aufgaben = aufgaben;
  return fehler;
}

let rot = 0;
const echt = lade(QUELLE);
const befund = pruefeAlles(echt);
for (const [p, l] of Object.entries(befund)) for (const t of l){ console.log(`✘ ${p}: ${t}`); rot++; }
if (!rot) console.log(`✔ 1–6 grün: ${echt.aufgaben} Aufgaben, Auswahl ${echt.hole('uebEndungGlieder')().map(g => g.form).join(' ')}`);

/* ---------- Störtests: jeder muss SEINEN Punkt rot machen ---------- */
const STOER = [
  { name: 'ausgeblendete Karte ـهُ (istBekannt) → Punkt 2', punkt: 2, extra: { versteckt: ['gram-suffix-hu'] },
    aus: 'if (!w || (bekannt && !bekannt(w))) continue;\n    const form = String(w.ar || \'\').normalize(\'NFC\').trim();', ein: 'if (!w) continue;\n    const form = String(w.ar || \'\').normalize(\'NFC\').trim();' },
  { name: 'ohne die Liste ذَلِكَ/هُنَاكَ … → Punkt 3', punkt: 3,
    aus: 'if (UEB_ENDUNG_NICHT.includes(uebSkelett(kern))) return null;', ein: '' },
  { name: 'ohne die Verb-Sperre → Punkt 3', punkt: 3,
    aus: "if (!t || /فِعْل/.test(String(t.rolle || ''))) return null;", ein: 'if (!t) return null;' },
  { name: 'Wort im Wortschatz nicht mehr ausgeschlossen (سَمَكَ) → Punkt 3', punkt: 3,
    aus: 'if (sk.length < 2 || uebEndungNomenPasst(uebungOhneEndung(kern))) continue;', ein: 'if (sk.length < 2) continue;' },
  { name: 'Stamm mit seinem Vokal gezeigt → Punkt 4', punkt: 4,
    aus: 'const roh = uebungOhneEndung(stamm);', ein: 'const roh = stamm;' },
  { name: 'gleiches Wort daneben nicht mehr verdeckt → Punkt 4', punkt: 4,
    aus: '[i, ...zwillinge].forEach(', ein: '[i].forEach(' },
  { name: 'ohne „zu einem Mann/zu einer Frau" → Punkt 5', punkt: 5,
    aus: 'zusatz = ` Gesprochen wird ${L.zusatz}.`;', ein: "zusatz = '';" },
  { name: 'Anzeige ohne den ohneSuffix-Zweig → Punkt 6', punkt: 6,
    aus: 'else if (a.ohneSuffix && a.ohneSuffix[i] != null && !UEB.beantwortet) text = a.ohneSuffix[i];', ein: '' }
];
let nichtAngeschlagen = 0;
for (const s of STOER){
  const quelle = QUELLE.replace(/\r\n/g, '\n');
  if (!quelle.includes(s.aus)){ console.log(`✘ Störtest „${s.name}": Stelle im Quelltext nicht gefunden`); nichtAngeschlagen++; continue; }
  const app = lade(quelle.replace(s.aus, s.ein), s.extra);
  app.versteckt = (s.extra && s.extra.versteckt) || [];
  let b; try { b = pruefeAlles(app); } catch (e){ b = { [s.punkt]: ['wirft: ' + e.message] }; }
  const an = !!(b[s.punkt] && b[s.punkt].length);
  console.log(`${an ? '✔' : '✘'} Störtest: ${s.name}${an ? '' : ' — schlägt NICHT an'}`);
  if (!an) nichtAngeschlagen++;
}
/* Gegenprobe zu 2 ohne Störung: dieselbe versteckte Karte mit dem ECHTEN
   Quelltext fehlt in der Auswahl (sonst hätte Störtest 1 nichts bewiesen). */
{
  const app = lade(QUELLE, { versteckt: ['gram-suffix-hu'] });
  app.versteckt = ['gram-suffix-hu'];
  const formen = app.hole('uebEndungGlieder')().map(g => g.form);
  const gut = !formen.includes('ـهُ') && formen.length === 4;
  console.log(`${gut ? '✔' : '✘'} Gegenprobe: ausgeblendetes ـهُ fehlt in der Auswahl (${formen.join(' ')})`);
  if (!gut) rot++;
}
console.log(rot || nichtAngeschlagen ? `\n⛔ ${rot} Befund(e), ${nichtAngeschlagen} Störtest(s) ohne Wirkung` : `\n✅ Übung 15 in Ordnung, alle ${STOER.length} Störtests schlagen an`);
process.exit(rot || nichtAngeschlagen ? 1 : 0);
