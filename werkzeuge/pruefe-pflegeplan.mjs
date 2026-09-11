#!/usr/bin/env node
/* pruefe-pflegeplan.mjs — hat jede Funktion der App ihre Pflege?
 * ==========================================================================
 *
 *   node werkzeuge/pruefe-pflegeplan.mjs
 *
 *   Exitcode 0 = jede Funktion hat ihre Pflege
 *            1 = eine Funktion ohne Plan, ein Plan ohne Funktion, oder eine
 *                Antwort, die nicht stimmt (Routine tut es gar nicht)
 *            2 = alles beantwortet, aber mindestens eine ehrlich eingetragene
 *                Lücke wartet darauf, geschlossen zu werden
 *
 * ⛔⛔ DER ANLASS — Elias am 11.09.2026, 19:25:26 (ganzer Satz in pflegeplan.mjs):
 *   „wenn eine neue funktion da ist oder ähliches das geguckt wird wie wird sie
 *    weiterhin gepflegt … du sollst dich dann darum kümmern … weil sonst hat
 *    eine neue funktion keinen sinn wenn sie nicht gepflegt wird"
 *
 * Die Regelsammlung (v465–v468) war der Fall, der es zeigte: gebaut, geprüft,
 * ausgeliefert — und `grep` über Automation/ fand ihren Namen in keiner Routine.
 * Kein Prüfer fragte danach, weil jeder Prüfer eine Funktion prüft, die er
 * schon kennt.
 *
 * ⭐ WAS GEPRÜFT WIRD
 *   1. BESTAND GEGEN PLAN: jede Datei, die index.html lädt oder sw.js vorhält,
 *      und jeder Bildschirm steht bei genau einer Funktion in pflegeplan.mjs —
 *      und jeder Eintrag dort gibt es noch.
 *   2. JEDE ANTWORT HÄLT, WAS SIE VERSPRICHT: eine „routine"-Antwort nur, wenn
 *      der Prompt den Schritt und den Beleg wörtlich enthält und das Werkzeug
 *      aufruft UND freigibt; ein „nein" nur mit Grund; eine „luecke" nur mit
 *      Stichwort, das in der To-Do auch wirklich steht.
 *   3. STÖRTEST: eine erfundene neue Datei, ein neuer Bildschirm, der Prompt
 *      ohne den Aufruf von regeln-holen.mjs (der Stand vom 11.09.2026 mittags),
 *      eine fehlende Freigabe, ein „nein" ohne Grund — jedes muss auffallen.
 *      [[stoertest_muss_wirkung_nachweisen]]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PFLEGEPLAN } from './pflegeplan.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AUTO = path.join(REPO, '..', 'Automation');
const TODO = path.join(REPO, '..', 'Obsidian', 'Gedächtnis', 'Elias Gedächtnis', '03 - Projekte', 'To-Do Vokabeltrainer.md');
const FRAGEN = [['neuerInhalt', 'neuer Inhalt'], ['eingaben', 'seine Eingaben'], ['veralten', 'veralten']];

const lies = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* ---------- Bestand der App ---------- */
function bestand(indexHtml, swJs){
  const dateien = new Set();
  for (const m of indexHtml.matchAll(/<script\s+src="([^"]+)"/g)) dateien.add(m[1].replace(/^\.\//, ''));
  const start = swJs.indexOf('const ASSETS');
  const ende = start >= 0 ? swJs.indexOf('];', start) : -1;
  if (ende > start) for (const m of swJs.slice(start, ende).matchAll(/'\.\/([^']+\.js)'/g)) dateien.add(m[1]);
  const bildschirme = new Set([...indexHtml.matchAll(/<section\s+class="screen"\s+id="([^"]+)"/g)].map(m => m[1]));
  return { dateien, bildschirme };
}

/* ---------- Routinen ---------- */
function ladeRoutinen(){
  const roh = lies(path.join(AUTO, 'routines.json'));
  if (!roh) return null;
  const json = JSON.parse(roh);
  const raus = {};
  for (const [name, def] of Object.entries(json.routines || {})){
    raus[name] = { def, text: def.prompt ? lies(path.join(AUTO, 'prompts', def.prompt)) : null };
  }
  return raus;
}

/* ---------- eine Antwort ---------- */
function pruefeAntwort(a, routinen, todoText){
  if (!a || typeof a !== 'object') return { art: 'fehlt', fehler: ['keine Antwort'] };
  const formen = ['routine', 'sitzung', 'nein', 'luecke'].filter(k => k in a);
  if (formen.length !== 1) return { art: 'ungültig', fehler: ['genau eine Form: routine | sitzung | nein | luecke — gefunden: ' + (formen.join(', ') || 'keine')] };
  const art = formen[0];
  const fehler = [];
  if (art === 'routine'){
    const r = routinen && routinen[a.routine];
    if (!r) fehler.push('Routine „' + a.routine + '" steht nicht in routines.json');
    else if (!r.text) fehler.push('Prompt „' + r.def.prompt + '" fehlt');
    else {
      if (!a.schritt || !new RegExp('(^|\\n)#{2,4}\\s+(Schritt\\s+)?' + esc(a.schritt) + '(?![\\w.])').test(r.text))
        fehler.push('Schritt ' + a.schritt + ' ist keine Überschrift im Prompt');
      if (!a.beleg || !r.text.includes(a.beleg)) fehler.push('Beleg „' + a.beleg + '" steht nicht im Prompt');
      if (a.werkzeug){
        if (!fs.existsSync(path.join(REPO, a.werkzeug))) fehler.push('Werkzeug ' + a.werkzeug + ' gibt es nicht');
        if (!r.text.includes('node ' + a.werkzeug)) fehler.push('der Prompt ruft „node ' + a.werkzeug + '" nicht auf');
        if (!(r.def.allowedTools || []).includes('Bash(node ' + a.werkzeug + ':*)')) fehler.push('„Bash(node ' + a.werkzeug + ':*)" fehlt in allowedTools');
      }
      if (!a.wie || String(a.wie).trim().length < 15) fehler.push('„wie" fehlt');
    }
  } else if (art === 'sitzung'){
    if (String(a.sitzung).trim().length < 25) fehler.push('Sitzungsweg ohne Beschreibung (mindestens 25 Zeichen)');
    if (a.werkzeug && !fs.existsSync(path.join(REPO, a.werkzeug))) fehler.push('Werkzeug ' + a.werkzeug + ' gibt es nicht');
  } else if (art === 'nein'){
    if (String(a.nein).trim().length < 25) fehler.push('„nein" ohne Grund (mindestens 25 Zeichen)');
  } else {
    if (String(a.luecke).trim().length < 25) fehler.push('Lücke ohne Beschreibung');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(a.seit || ''))) fehler.push('Lücke ohne Datum „seit"');
    if (!a.todo || String(a.todo).trim().length < 5) fehler.push('Lücke ohne Stichwort „todo"');
    else if (todoText != null && !todoText.includes(a.todo)) fehler.push('Stichwort „' + a.todo + '" steht nicht in der To-Do — die Lücke ist nirgends als Arbeit eingetragen');
  }
  return { art, fehler };
}

/* ---------- Plan gegen Bestand ---------- */
function vergleiche(plan, best){
  const befunde = [];
  const zu = new Map();
  for (const f of plan){
    for (const d of f.dateien || []){ if (zu.has(d)) befunde.push(d + ' steht zweimal: „' + zu.get(d) + '" und „' + f.funktion + '"'); zu.set(d, f.funktion); }
    for (const b of f.bildschirme || []){ const k = '#' + b; if (zu.has(k)) befunde.push(b + ' steht zweimal'); zu.set(k, f.funktion); }
  }
  for (const d of best.dateien) if (!zu.has(d)) befunde.push('NEU: ' + d + ' — die App lädt die Datei, aber keine Funktion im Pflegeplan nennt sie');
  for (const b of best.bildschirme) if (!zu.has('#' + b)) befunde.push('NEU: Bildschirm ' + b + ' — keine Funktion im Pflegeplan nennt ihn');
  for (const [k, fn] of zu){
    if (k.startsWith('#')){ if (!best.bildschirme.has(k.slice(1))) befunde.push('Bildschirm ' + k.slice(1) + ' („' + fn + '") gibt es nicht mehr — Eintrag veraltet'); }
    else if (!best.dateien.has(k)) befunde.push(k + ' („' + fn + '") lädt die App nicht mehr — Eintrag veraltet');
  }
  return befunde;
}

function alleAntworten(f){
  return FRAGEN.flatMap(([k]) => (Array.isArray(f[k]) ? f[k] : [f[k]]).map(a => [k, a]));
}

/* ============================== Lauf ============================== */
const indexHtml = lies(path.join(REPO, 'index.html')) || '';
const swJs = lies(path.join(REPO, 'sw.js')) || '';
const best = bestand(indexHtml, swJs);
const routinen = ladeRoutinen();
const todoText = lies(TODO);

let fehler = 0, luecken = 0;
const zaehl = { routine: 0, sitzung: 0, nein: 0, luecke: 0 };

console.log('');
console.log('=== 1. Bestand gegen Plan ===');
if (!best.dateien.size || !best.bildschirme.size){ console.log('  ⛔ Bestand leer (' + best.dateien.size + ' Dateien, ' + best.bildschirme.size + ' Bildschirme) — index.html/sw.js nicht gelesen'); fehler++; }
if (!routinen){ console.log('  ⛔ Automation/routines.json fehlt — keine Antwort über Routinen prüfbar'); fehler++; }
if (todoText == null) console.log('  ⚠️  To-Do Vokabeltrainer nicht lesbar — ob Lücken dort stehen, bleibt ungeprüft');
const befunde = vergleiche(PFLEGEPLAN, best);
for (const b of befunde){ console.log('  ⛔ ' + b); fehler++; }
console.log('  ' + best.dateien.size + ' Dateien und ' + best.bildschirme.size + ' Bildschirme in der App · '
  + PFLEGEPLAN.length + ' Funktionen im Plan' + (befunde.length ? '' : ' — jede Datei und jeder Bildschirm ist zugeordnet'));

console.log('');
console.log('=== 2. Die drei Fragen je Funktion ===');
for (const f of PFLEGEPLAN){
  const zeilen = [];
  let ok = true;
  for (const [k, name] of FRAGEN){
    const antworten = Array.isArray(f[k]) ? f[k] : [f[k]];
    for (const a of antworten){
      const r = pruefeAntwort(a, routinen, todoText);
      if (r.art in zaehl) zaehl[r.art]++;
      const kurz = r.art === 'routine' ? 'Routine, Schritt ' + a.schritt + ' — ' + a.wie
        : r.art === 'sitzung' ? 'in einer Sitzung' + (a.werkzeug ? ' (' + path.basename(a.werkzeug) + ')' : '')
        : r.art === 'nein' ? 'keine Pflege nötig — ' + a.nein
        : r.art === 'luecke' ? 'LÜCKE seit ' + a.seit + ' — ' + a.luecke : r.art;
      if (r.fehler.length){ ok = false; fehler += r.fehler.length; zeilen.push('     ⛔ ' + name + ': ' + r.fehler.join(' · ')); }
      else if (r.art === 'luecke'){ luecken++; zeilen.push('     🔴 ' + name + ': ' + kurz); }
      else zeilen.push('     ✓ ' + name + ': ' + kurz.slice(0, 150));
    }
  }
  console.log('  ' + (ok ? (zeilen.some(z => z.includes('🔴')) ? '🔴' : '✓') : '⛔') + ' ' + f.funktion);
  zeilen.forEach(z => console.log(z));
}

/* ============================== Störtest ============================== */
console.log('');
console.log('=== 3. Störtest ===');
let stoer = 0;
const muss = (was, befund) => { if (befund) console.log('  ok   ' + was); else { stoer++; console.log('  ⛔  ' + was + ' — fiel NICHT auf'); } };

const bestNeu = bestand(indexHtml.replace('</body>', '<script src="js/gibt-es-noch-nicht.js"></script></body>'), swJs);
muss('eine neue Datei ohne Plan', vergleiche(PFLEGEPLAN, bestNeu).some(b => b.includes('gibt-es-noch-nicht.js')));
const bestBild = bestand(indexHtml.replace('</body>', '<section class="screen" id="screen-neu"></section></body>'), swJs);
muss('ein neuer Bildschirm ohne Plan', vergleiche(PFLEGEPLAN, bestBild).some(b => b.includes('screen-neu')));

const regelsammlung = PFLEGEPLAN.find(f => f.funktion === 'Regelsammlung');
if (!regelsammlung || !routinen || !routinen['vokabeltrainer-wartung']){
  stoer++; console.log('  ⛔  Störtest ohne Grundlage: Regelsammlung oder Wartung fehlt');
} else {
  const w = routinen['vokabeltrainer-wartung'];
  const ohneAufruf = { ...routinen, 'vokabeltrainer-wartung': { def: w.def, text: String(w.text).split('node werkzeuge/regeln-holen.mjs').join('') } };
  muss('der Prompt ohne „node werkzeuge/regeln-holen.mjs" (Stand 11.09.2026 mittags)', pruefeAntwort(regelsammlung.eingaben, ohneAufruf, todoText).fehler.length > 0);
  const ohneFreigabe = { ...routinen, 'vokabeltrainer-wartung': { def: { ...w.def, allowedTools: (w.def.allowedTools || []).filter(t => !t.includes('regeln-holen')) }, text: w.text } };
  muss('die Freigabe für regeln-holen.mjs fehlt in allowedTools', pruefeAntwort(regelsammlung.eingaben, ohneFreigabe, todoText).fehler.length > 0);
}
muss('ein „nein" ohne Grund', pruefeAntwort({ nein: '—' }, routinen, todoText).fehler.length > 0);
muss('eine Routine, die es nicht gibt', pruefeAntwort({ routine: 'gibt-es-nicht', schritt: '1', beleg: 'x', wie: 'irgendwas Langes hier' }, routinen, todoText).fehler.length > 0);
muss('eine Lücke, die nicht in der To-Do steht', todoText == null || pruefeAntwort({ luecke: 'eine erfundene Lücke zum Testen des Prüfers', seit: '2026-09-11', todo: 'STICHWORT_DAS_NIRGENDS_STEHT_4711' }, routinen, todoText).fehler.length > 0);

console.log('');
console.log('  Antworten: ' + zaehl.routine + ' über eine Routine · ' + zaehl.sitzung + ' in einer Sitzung · ' + zaehl.nein + ' ohne Pflegebedarf · ' + zaehl.luecke + ' Lücke(n)');
console.log('');
if (stoer){
  console.log('⛔ ' + stoer + ' Störtest(s) gescheitert — dieser Prüfer sieht nicht, wofür er gebaut ist.');
  process.exit(1);
}
if (fehler){
  console.log('⛔ ' + fehler + ' Befund(e): eine Funktion ohne Pflegeplan oder ein Plan, den keine Routine einlöst.');
  console.log('   Was zu tun ist: den Eintrag in werkzeuge/pflegeplan.mjs ergänzen und — wo Pflege nötig ist —');
  console.log('   die Routine im selben Zug erweitern (Prompt + allowedTools). Siehe CLAUDE.md, „Neue Funktion".');
  process.exit(1);
}
if (luecken){
  console.log('🔴 ' + luecken + ' eingetragene Lücke(n): Pflege nötig, aber noch von niemandem übernommen.');
  process.exit(2);
}
console.log('✅ Jede Funktion hat ihre Pflege.');
process.exit(0);
