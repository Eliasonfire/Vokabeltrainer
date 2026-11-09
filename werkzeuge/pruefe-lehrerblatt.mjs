#!/usr/bin/env node
/* pruefe-lehrerblatt.mjs — bewacht lehrerblatt-data.js (das Übungsblatt seines Lehrers)
 * ======================================================================================
 *
 * Elias, 08.11.2026: „beides und fehlende wörter ergänzen falls vorhanden" — die Aufgaben
 * vom Blatt seines Lehrers als Übung. Die Musterlösungen stammen von mir (Claude), nicht vom
 * Lehrer. Deshalb prüft dieses Werkzeug, was dort NICHT erfunden sein darf:
 *
 *   L1  jede verlinkte Regel steht in grammar-data.js (sonst öffnet der Knopf eine leere Karte)
 *   L2  jedes arabische Wort einer Antwort oder eines Zerlegungssatzes steht in seinem Bestand
 *       (Karten aller Bücher, Fachbegriffe, Satzvorräte) — verglichen ohne Vokalzeichen, nach
 *       Abtrennen von و/ف/بِـ/لِـ/كَـ, اَلْ und den Besitzendungen
 *   L3  jeder ganze Satz (endet auf . oder ؟) ist kasusrein nach js/irab.js — dieselbe
 *       Zerlegung wie im Satzmodus; ein Wort mit `stimmt === false` ist rot
 *   L4  18 Aufgaben, Nummern 1–18 lückenlos
 *
 * Aufruf: node werkzeuge/pruefe-lehrerblatt.mjs              Exit 0 grün, 1 rot
 *         node werkzeuge/pruefe-lehrerblatt.mjs --stoertest  jede Prüfung muss rot werden können
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const W = path.join(path.dirname(fileURLToPath(import.meta.url)), '..') + path.sep;
const lies = d => fs.readFileSync(W + d, 'utf8');
const { analysiereSatz, setzeLexikon } = require(W + 'js/irab.js');

const { GRAMMAR_RULES } = (new Function(lies('grammar-data.js') + ';return {GRAMMAR_RULES};'))();
const { VOCAB_DATA } = (new Function(lies('vocab-data.js') + ';return {VOCAB_DATA};'))();
const { LEHRBUCH_SAETZE } = (new Function(lies('lehrbuch-saetze.js') + ';return {LEHRBUCH_SAETZE};'))();
const fenster = {};
for (const f of fs.readdirSync(W + 'data').filter(f => /^vokabeln-.*\.js$/.test(f)))
  (new Function('window', lies('data/' + f)))(fenster);
let FACH = [];
try { ({ FACHBEGRIFF_VOKABELN: FACH } = (new Function(lies('data/fachbegriffe.js') + ';return {FACHBEGRIFF_VOKABELN};'))()); } catch { /* fehlt sie, fehlen nur Fachwörter */ }

const KARTEN = [...VOCAB_DATA, ...Object.values(fenster.VOKABELN || {}).flat(), ...(FACH || [])];
/* Für die Zerlegung (L3) nur die Bücher, die bei ihm freigeschaltet sind (js/kern.js
   FREIGESCHALTET) — wie in der App. Mit madina-3 im Lexikon liest js/irab.js أَخُو als
   Verb (gemessen 09.11.2026: nur dieses Buch kippt es); in seiner App ist es nicht geladen. */
const V = fenster.VOKABELN || {};
setzeLexikon([...VOCAB_DATA, ...(V['madina-1'] || []), ...(V['madina-2'] || []), ...(V['bayna-yadayk-1'] || []), ...(FACH || [])]);

const ohne = s => String(s || '').normalize('NFC').replace(/[ً-ٰٟـ]/g, '').replace(/[أإآٱ]/g, 'ا');
const woerter = s => ohne(s).split(/[^ء-ي]+/).filter(Boolean);

/* Der Bestand als Wortskelette */
const BESTAND = new Set();
for (const k of KARTEN) for (const f of ['ar', 'sg', 'pl', 'femSg', 'femPl', 'past', 'present', 'sentAr']) woerter(k[f]).forEach(w => BESTAND.add(w));
for (const s of LEHRBUCH_SAETZE) woerter(s.sentAr).forEach(w => BESTAND.add(w));
/* Auch Wörter, die in SEINEN Regeln stehen (Name und Erklärung): ضَمَّةٌ, فَتْحَةٌ … sind dort erklärt. */
for (const r of GRAMMAR_RULES) [r.name, r.shortExplanation].forEach(t => woerter(t).forEach(w => BESTAND.add(w)));
/* Die Partikeln, die man allein nur mit Bindestrich schreibt (بِـ, لِـ). */
['ب', 'ل', 'ك', 'و', 'ف'].forEach(w => BESTAND.add(w));

const VORSILBEN = ['', 'و', 'ف', 'ب', 'ل', 'ك', 'وب', 'ول', 'فب', 'فل'];
const ENDUNGEN = ['', 'ه', 'ها', 'هم', 'نا', 'ك', 'كم', 'ي'];
function bekannt(w, bestand){
  if (bestand.has(w)) return true;
  for (const v of VORSILBEN){
    if (!w.startsWith(v)) continue;
    let r = w.slice(v.length);
    for (const st of [r, r.startsWith('ال') ? r.slice(2) : null, r.startsWith('ل') && v.endsWith('ل') ? 'ا' + r : null]){
      if (!st) continue;
      for (const e of ENDUNGEN){
        if (!st.endsWith(e) || st.length - e.length < 2) continue;
        const kern = st.slice(0, st.length - e.length);
        for (const k of [kern, kern.endsWith('ت') ? kern.slice(0, -1) + 'ة' : null, kern.endsWith('و') ? kern.slice(0, -1) : null, kern.endsWith('ا') ? kern.slice(0, -1) : null]){
          if (!k) continue;
          if (bestand.has(k) || bestand.has('ال' + k) || bestand.has(k + 'ا')) return true;
        }
      }
    }
  }
  return false;
}

function pruefe(blatt, regeln, bestand){
  const fehler = [];
  const ids = new Set(regeln.map(r => r.id));
  const nummern = blatt.aufgaben.map(a => a.nr);
  if (nummern.length !== 18 || nummern.some((n, i) => n !== i + 1)) fehler.push(`L4 Aufgaben ${nummern.join(',')} statt 1–18`);
  for (const a of blatt.aufgaben) for (const t of a.teile){
    const wo = `Aufgabe ${a.nr}${t.b}`;
    for (const id of t.regeln || []) if (!ids.has(id)) fehler.push(`L1 ${wo}: Regel ${id} gibt es nicht`);
    const texte = [...(t.antworten || []).map(x => x.a), ...(t.irab || [])];
    for (const tx of texte){
      for (const w of woerter(tx)) if (!bekannt(w, bestand)) fehler.push(`L2 ${wo}: „${w}" steht nicht in seinem Bestand (aus: ${tx})`);
      for (const satz of String(tx).split(' — ')){
        if (!/[.؟]\s*$/.test(satz) || !/[ء-ي]/.test(satz)) continue;
        for (const z of analysiereSatz(satz.trim())) if (z.stimmt === false) fehler.push(`L3 ${wo}: „${z.rein || z.wort}" passt nicht zu seiner Rolle (${z.rolle}) in: ${satz.trim()}`);
      }
    }
  }
  return fehler;
}

const { LEHRERBLATT } = require(W + 'lehrerblatt-data.js');

if (process.argv.includes('--stoertest')){
  const klon = () => JSON.parse(JSON.stringify(LEHRERBLATT));
  const faelle = [
    ['L1 erfundene Regel', b => { b.aufgaben[0].teile[0].regeln.push('gibt-es-nicht-01'); }],
    ['L2 erfundenes Wort', b => { b.aufgaben[16].teile[0].antworten[0].a = 'هَذَا الْبَيْتُ زُرْقُوفٌ.'; }],
    ['L3 falsche Endung', b => { b.aufgaben[16].teile[0].antworten[0].a = 'هَذَا الْبَيْتُ كَبِيرٍ.'; }],
    ['L4 Aufgabe fehlt', b => { b.aufgaben.pop(); }]
  ];
  let gut = 0;
  for (const [name, aendere] of faelle){
    const b = klon(); aendere(b);
    const f = pruefe(b, GRAMMAR_RULES, BESTAND);
    const rot = f.some(x => x.startsWith(name.slice(0, 2)));
    console.log(`  ${rot ? 'ok  ' : 'FEHLT'} ${name}: ${rot ? 'rot' : 'NICHT rot'}`);
    if (rot) gut++;
  }
  const echt = pruefe(LEHRERBLATT, GRAMMAR_RULES, BESTAND);
  console.log(`  ${echt.length ? 'FEHLT' : 'ok  '} echte Datei: ${echt.length ? echt.length + ' Befunde' : 'grün'}`);
  process.exit(gut === faelle.length && !echt.length ? 0 : 1);
}

const f = pruefe(LEHRERBLATT, GRAMMAR_RULES, BESTAND);
if (f.length){ f.forEach(x => console.log('  ✗ ' + x)); console.log(`\n${f.length} Befunde in lehrerblatt-data.js`); process.exit(1); }
const n = LEHRERBLATT.aufgaben.reduce((s, a) => s + a.teile.length, 0);
console.log(`  ✓ Lehrerblatt: 18 Aufgaben, ${n} Teile — Regeln vorhanden, jedes Wort im Bestand, alle Sätze kasusrein`);
