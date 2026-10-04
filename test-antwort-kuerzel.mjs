#!/usr/bin/env node
/* test-antwort-kuerzel.mjs — bewacht das Kürzel unter den Antworten (05.10.2026, v651).
 *
 * Elias, 05.10.2026, mit Bild der Übung 11 (zehn Hinweiswörter zur Wahl):
 * „bei den antwortmöglichkeiten sollte auch geschlecht, person und singlular oder
 * plural stehen so als abkürzung".
 *
 * Was hier bewacht wird — und warum gerade das:
 *   1  Jedes Kürzel STIMMT. Es wird nicht gegen die Tabelle in js/uebung.js geprüft
 *      (die prüfte nur sich selbst), sondern gegen SEINE Karten: aus dem deutschen
 *      Text der Karte („diese beiden, m." · „sie (f.)" in der Gruppe „3. Person" ·
 *      „dein" — zu einer Frau) rechnet der Test das Kürzel selbst aus. Ein falsches
 *      Kürzel lernt sich mit.
 *   2  In seiner Auswahl trägt JEDE Antwort der Übungen 11, 14 und 15 ein Kürzel —
 *      eine neue Form ohne Eintrag fällt hier auf, nicht erst ihm.
 *   3  Keine andere Übung trägt eins (Fragewörter haben weder Person noch Geschlecht).
 *   4  Die Antwort selbst bleibt die bloße Form: gewertet wird weiter über `wert`.
 *   5  Gezeichnet wird das Kürzel als eigene Zeile, von links nach rechts — in den
 *      Übungen 14 und 15 läuft das Gitter von rechts nach links.
 *
 * Drei Störtests belegen, dass der Test rot werden kann:
 *   S1  ein vertauschtes Kürzel in der Tabelle (هِيَ als männlich)   → Punkt 1
 *   S2  Übung 14 baut ihre Antworten ohne Kürzel                    → Punkt 2
 *   S3  renderUebung() zeichnet die Zeile nicht                     → Punkt 5
 *
 *   node test-antwort-kuerzel.mjs            nur das Ergebnis
 *   node test-antwort-kuerzel.mjs --alles    mit Zahlen
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const WURZEL = path.dirname(fileURLToPath(import.meta.url));
const ALLES = process.argv.includes('--alles');
const UEBUNG_TEXT = fs.readFileSync(path.join(WURZEL, 'js', 'uebung.js'), 'utf8');

function stummesElement(){
  return { style:{}, classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    dataset:{}, children:[], value:'', textContent:'', innerHTML:'', disabled:false,
    addEventListener(){}, removeEventListener(){}, appendChild(){}, querySelector(){ return null; },
    querySelectorAll(){ return []; }, closest(){ return null; }, getAttribute(){ return null; },
    setAttribute(){}, removeAttribute(){}, focus(){}, getBoundingClientRect(){ return {width:0,height:0,top:0,left:0}; } };
}

/* Derselbe Lader wie in test-plural-uebung.mjs: seine Kapitelauswahl aus
   .stand-app.json, Buchkarten, bestellte Fachbegriffe. `uebungText` ist der Quelltext
   von js/uebung.js — echt oder eine Störfassung. */
function ladeApp(uebungText){
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
    try { vm.runInContext(f === 'js/uebung.js' ? uebungText : fs.readFileSync(path.join(WURZEL, f), 'utf8'), ctx, { filename: f }); }
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
  /* escapeHtml() steht in js/kern.js, das dieser Lader nicht lädt. */
  if (!hole('escapeHtml')) vm.runInContext(
    'function escapeHtml(s){ return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }', ctx);
  vm.runInContext('UEB_WORTGRUPPEN = {}', ctx);
  vm.runInContext('if (typeof setzeLexikon === "function") setzeLexikon(VOCAB_DATA)', ctx);
  const pool = (hole('alleSaetze') || (() => []))();
  const analysiere = hole('analysiereSatz');
  const zerlegt = pool.map(s => { try { return { s, z: analysiere(s.sentAr) }; } catch (e){ return { s, z: null }; } });
  return { ctx, hole, fehlt, pool, zerlegt };
}

/* ---------- Das Kürzel, UNABHÄNGIG von js/uebung.js aus dem Text seiner Karte ---------- */
/* „dieser, m. Singular" · „diese beiden, f." · „jene, Plural" · „jener" · „jene" */
function sollHinweiswort(de){
  const t = String(de).toLowerCase().trim();
  if (/plural/.test(t)) return 'Pl.';
  const g = /(^|[\s,(])m\./.test(t) ? 'm.' : /(^|[\s,(])f\./.test(t) ? 'f.'
    : /^(dieser|jener)$/.test(t) ? 'm.' : /^(diese|jene)$/.test(t) ? 'f.' : null;
  return g ? g + (/beide/.test(t) ? ' Dual' : ' Sg.') : null;
}
/* Gruppe „3. Person" mit „er" · „sie" · „die beiden" · „sie (m.)" · „du (f.)" · „ihr beide" · „ich" · „wir" */
function sollPronomen(de, gruppe){
  const p = (String(gruppe).match(/^([123])\. Person/) || [])[1];
  if (!p) return null;
  const t = String(de).toLowerCase().trim();
  let rest = null;
  if (/beide/.test(t)) rest = 'Dual';
  else if (t === 'er') rest = 'm. Sg.';
  else if (t === 'sie') rest = 'f. Sg.';
  else if (t === 'ich') rest = 'Sg.';
  else if (t === 'wir') rest = 'Pl.';
  else { const m = t.match(/^(du|sie|ihr) \((m|f)\.\)$/); if (m) rest = m[2] + '. ' + (m[1] === 'du' ? 'Sg.' : 'Pl.'); }
  return rest ? p + '. P. ' + rest : null;
}
/* „die Besitzendung „mein“ — 1. Person" · „dein“ — zu einem Mann · „sein“ · „ihr“ */
function sollEndung(de){
  const bed = (String(de).match(/[„"“]([^“”"]+)[“”"]/) || [])[1];
  const t = String(de).toLowerCase();
  if (/plural|mehrzahl|beide/.test(t)) return null;          // nicht aus dem Text allein zu rechnen
  if (bed === 'mein') return '1. P. Sg.';
  if (bed === 'dein') return /frau/.test(t) ? '2. P. f. Sg.' : /mann/.test(t) ? '2. P. m. Sg.' : null;
  if (bed === 'sein') return '3. P. m. Sg.';
  if (bed === 'ihr') return '3. P. f. Sg.';
  return null;
}

/* Das Stück von renderUebung(), das die Antwortknöpfe zeichnet (für Punkt 5). */
const Z_VON = 'wahl.innerHTML = a.optionen.map(o=>{';
const Z_BIS = "}).join('');";
function zeichenStueck(text){
  const von = text.indexOf(Z_VON), bis = text.indexOf(Z_BIS, von);
  return (von < 0 || bis < 0) ? null : text.slice(von, bis + Z_BIS.length);
}

function pruefe(uebungText){
  const rot = [];
  const zahlen = {};
  const app = ladeApp(uebungText);
  if (app.fehlt && app.fehlt.length){ return { rot: app.fehlt.map(f => 'Laden: ' + f), zahlen }; }
  const { ctx, hole } = app;
  const kuerzel = hole('uebFormKuerzel');
  if (typeof kuerzel !== 'function') return { rot: ['uebFormKuerzel() gibt es nicht mehr in js/uebung.js'], zahlen };

  /* ---- 1 — jedes Kürzel stimmt mit seiner Karte überein ---- */
  const gruppen = JSON.parse(vm.runInContext(`(() => {
    UEB_WORTGRUPPEN = {};
    const zeile = g => ({ form: g.form, de: g.de, gruppe: g.gruppe || '' });
    return JSON.stringify({
      hinweis: uebGruppe('f19-isara', w => /^(dies|jen)/i.test(String(w.de || '').trim())).map(zeile),
      pronomen: uebGruppe('f19-pronomen', w => w.type === 'pronoun' && /^(ich|du|er|sie|es|wir|ihr)\\b/i.test(String(w.de || '').trim())).map(zeile),
      endung: uebEndungGlieder().map(zeile)
    });
  })()`, ctx));
  const soll = { hinweis: g => sollHinweiswort(g.de), pronomen: g => sollPronomen(g.de, g.gruppe), endung: g => sollEndung(g.de) };
  let geprueft = 0, ohneGegenprobe = [];
  for (const name of Object.keys(gruppen)){
    zahlen[name] = gruppen[name].length;
    if (!gruppen[name].length) rot.push(`1 Gruppe „${name}" ist leer — dann steht in ihrer Übung gar nichts zur Wahl`);
    for (const g of gruppen[name]){
      const ist = kuerzel(g.form), erwartet = soll[name](g);
      if (!ist){ rot.push(`1 ${g.form} („${g.de}") hat kein Kürzel`); continue; }
      if (erwartet === null){ ohneGegenprobe.push(g.form); continue; }
      geprueft++;
      if (ist !== erwartet) rot.push(`1 ${g.form}: die App schreibt „${ist}", seine Karte sagt „${g.de}"${g.gruppe ? ' (' + g.gruppe + ')' : ''} → „${erwartet}"`);
    }
  }
  zahlen.gegenKarteGeprueft = geprueft; zahlen.ohneGegenprobe = ohneGegenprobe.length;
  if (geprueft < 20) rot.push(`1 nur ${geprueft} Kürzel ließen sich gegen seine Karten rechnen (erwartet mindestens 20 von ${zahlen.hinweis + zahlen.pronomen + zahlen.endung})`);

  /* Nichts Fremdes bekommt eins, und ein Wort ohne Vokalzeichen (du m. oder f.?) auch nicht. */
  for (const fremd of ['مَنْ', 'أَيْنَ', 'بَيْتٌ', 'انت', '']) if (kuerzel(fremd)) rot.push(`1 „${fremd}" bekommt ein Kürzel („${kuerzel(fremd)}"), obwohl es keins haben darf`);
  /* Endung und ganzes Wort werden nicht verwechselt. */
  if (kuerzel('ـهُمْ') !== '3. P. m. Pl.' || kuerzel('هُمْ') !== '3. P. m. Pl.' || kuerzel('ـكِ') !== '2. P. f. Sg.')
    rot.push('1 die Endungen ـهُمْ / ـكِ oder das Wort هُمْ tragen nicht das erwartete Kürzel');

  /* ---- 2 bis 4 — in seiner Auswahl: jede Antwort der Übungen 11, 14, 15 ---- */
  const UEBUNGEN = hole('UEBUNGEN') || [];
  const MIT = ['isara', 'pronomen', 'endungen'];
  const beispiel = {};
  for (const U of UEBUNGEN){
    if (typeof U.baue !== 'function') continue;
    let aufgaben = 0, optionen = 0, ohne = 0, mit = 0;
    for (const { s, z } of app.zerlegt){
      if (!z) continue;
      let liste = [];
      try { liste = U.baue(z, s) || []; } catch (e){ if (MIT.includes(U.id)) rot.push(`2 Übung ${U.nr}: baue() wirft bei ${s.id}: ${e.message}`); continue; }
      for (const a of liste){
        if (!Array.isArray(a.optionen)) continue;
        aufgaben++;
        if (MIT.includes(U.id) && !beispiel[U.id]) beispiel[U.id] = a;
        if (!MIT.includes(U.id) && U.id === 'fragewort' && !beispiel[U.id]) beispiel[U.id] = a;
        for (const o of a.optionen){
          optionen++;
          if (o.kuerzel) mit++; else ohne++;
          if (MIT.includes(U.id)){
            if (o.kuerzel && o.kuerzel !== kuerzel(o.wert)) rot.push(`2 Übung ${U.nr}: an ${o.wert} steht „${o.kuerzel}", die Tabelle sagt „${kuerzel(o.wert)}"`);
            if (/[A-Za-zÄÖÜäöü]/.test(String(o.wert))) rot.push(`4 Übung ${U.nr}: der Wert der Antwort ist nicht mehr die bloße Form („${o.wert}")`);
          }
        }
      }
    }
    if (MIT.includes(U.id)){
      zahlen['uebung' + U.nr] = aufgaben + ' Aufgaben, ' + optionen + ' Antworten';
      if (!aufgaben) rot.push(`2 Übung ${U.nr} (${U.id}) hat in seiner Auswahl keine Aufgabe — dann ist nichts geprüft`);
      if (ohne) rot.push(`2 Übung ${U.nr} (${U.id}): ${ohne} von ${optionen} Antworten tragen KEIN Kürzel`);
    } else if (mit) rot.push(`3 Übung ${U.nr} (${U.id}): ${mit} Antworten tragen ein Kürzel — das ist nur für 11, 14 und 15 gedacht`);
  }
  for (const id of MIT) if (!UEBUNGEN.some(u => u.id === id)) rot.push(`2 die Übung „${id}" gibt es nicht mehr`);

  /* ---- 5 — gezeichnet als eigene Zeile, von links nach rechts ---- */
  const stueck = zeichenStueck(uebungText);
  if (!stueck) rot.push('5 in renderUebung() steht das Stück, das die Antwortknöpfe zeichnet, nicht mehr so da wie erwartet');
  else {
    ctx.__wahl = { innerHTML: '' };
    try {
      vm.runInContext(`function __zeichneWahl(a, UEB, wahl){ ${stueck} return wahl.innerHTML; }`, ctx);
      for (const id of [...MIT, 'fragewort']){
        const a = beispiel[id];
        if (!a){ if (MIT.includes(id)) rot.push(`5 keine Beispielaufgabe für „${id}"`); continue; }
        ctx.__a = a;
        const html = vm.runInContext('__zeichneWahl(__a, { beantwortet:false, gewaehlt:new Set() }, __wahl)', ctx);
        const knoepfe = html.split('<button').slice(1);
        if (knoepfe.length !== a.optionen.length) rot.push(`5 „${id}": ${knoepfe.length} Knöpfe gezeichnet, ${a.optionen.length} Antworten`);
        knoepfe.forEach((k, i) => {
          const o = a.optionen[i];
          const zeile = '<span class="opt-de opt-kuerzel" lang="de" dir="ltr">' + o.kuerzel + '</span>';
          if (MIT.includes(id)){
            if (!k.includes(zeile)) rot.push(`5 „${id}": am Knopf ${o.wert} fehlt die Zeile mit „${o.kuerzel}" (von links nach rechts)`);
            if (!k.includes('data-uebwahl="' + o.wert + '"')) rot.push(`4 „${id}": der Knopf ${o.wert} trägt nicht mehr die bloße Form als Wert`);
          } else if (k.includes('opt-kuerzel')) rot.push(`3 „${id}": ein Knopf trägt eine Kürzel-Zeile`);
        });
        zahlen['gezeichnet_' + id] = knoepfe.length;
      }
    } catch (e){ rot.push('5 das Zeichnen der Antwortknöpfe wirft: ' + e.message); }
  }
  return { rot, zahlen };
}

/* ---------- Störfassungen (jede muss den Text wirklich ändern) ---------- */
function ersetze(text, alt, neu, wofuer){
  if (!text.includes(alt)){ console.log('✘ Störtest ' + wofuer + ': das Stück, das er ändert, steht nicht mehr in js/uebung.js — Test anpassen.'); process.exit(1); }
  return text.replace(alt, neu);
}
const S1 = ersetze(UEBUNG_TEXT, "['هِيَ', '3. P. f. Sg.']", "['هِيَ', '3. P. m. Sg.']", 'S1');
const S2 = ersetze(UEBUNG_TEXT, 'optionen: glieder.map(g => ({ wert:g.form, text: tr.vorsatz + g.form, kuerzel: uebFormKuerzel(g.form) })),',
  'optionen: glieder.map(g => ({ wert:g.form, text: tr.vorsatz + g.form })),', 'S2');
const S3 = ersetze(UEBUNG_TEXT, '${uebungOptionHtml(o.text)}${kuerzel}</button>', '${uebungOptionHtml(o.text)}</button>', 'S3');

let fehler = 0;
const echt = pruefe(UEBUNG_TEXT);
if (echt.rot.length){ fehler += echt.rot.length; echt.rot.slice(0, 25).forEach(r => console.log('  ✘    ' + r)); if (echt.rot.length > 25) console.log('  … und ' + (echt.rot.length - 25) + ' weitere'); }
if (ALLES) console.log('  Zahlen: ' + JSON.stringify(echt.zahlen));

for (const [name, text, punkt] of [['S1 vertauschtes Kürzel', S1, '1 '], ['S2 Übung 14 ohne Kürzel', S2, '2 '], ['S3 Zeile wird nicht gezeichnet', S3, '5 ']]){
  const r = pruefe(text).rot;
  const trifft = r.filter(x => x.startsWith(punkt)).length;
  const ok = trifft > 0;
  if (!ok) fehler++;
  if (!ok || ALLES) console.log((ok ? '  ok   ' : '  ✘    ') + 'Störtest ' + name + ': ' + r.length + ' Meldungen, davon ' + trifft + ' zu Punkt ' + punkt.trim()
    + (ok ? '' : ' — der Test bleibt grün, obwohl er rot werden müsste'));
}

console.log((fehler ? '✘ ' : '✔ ') + 'test-antwort-kuerzel: ' + (echt.zahlen.gegenKarteGeprueft || 0) + ' Kürzel gegen seine Karten gerechnet, 3 Störtests'
  + (fehler ? ' — ' + fehler + ' NICHT in Ordnung' : ' — alles in Ordnung'));
process.exit(fehler ? 1 : 0);
