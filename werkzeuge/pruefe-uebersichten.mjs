#!/usr/bin/env node
/* pruefe-uebersichten.mjs — bewacht „Kapitel im Überblick" und die Thementafeln (15.11.2026)
 * ==========================================================================
 *
 *   node werkzeuge/pruefe-uebersichten.mjs        Exit 0 = grün, 1 = Befund
 *
 * Elias, 15.11.2026: „ich möchte im prinzip die grammatik regeln als übersicht haben bzw die
 * jeweiligen lektionen der kapteln … so wie auch bei der russich app", dann „fang an".
 *
 *   U1  Jedes arabische Wort mit Vokalzeichen in uebersichten-data.js steht wörtlich (NFC, ohne das
 *       Dehnungszeichen ـ am Rand) in grammar-data.js oder lehrbuch-saetze.js. Regel „keine Ḥaraka
 *       ohne Quelle": die Tafeln erfinden nichts, sie ordnen nur, was seine Regeln schon sagen.
 *   U2  Jede genannte Regel-Kennung gibt es in grammar-data.js.
 *   U3  Kapitel 1 bis 17 je genau einmal; jede Tafel hat eine eindeutige Kennung „ueb-…".
 *   U4  Nur zum Nachschlagen: js/uebersicht.js schreibt nichts (kein LS.set, kein localStorage,
 *       kein saveSettings), und außer ihm liest keine Datei UEBERSICHTEN.
 *   U5  Die Datei ist in index.html eingebunden und steht im Vorrat des Service Workers.
 * Störtest: ein Vokal in einem Tafelwort wird vertauscht — U1 muss rot werden.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lies = p => fs.readFileSync(path.join(WURZEL, p), 'utf8');
const require = createRequire(import.meta.url);
const { UEBERSICHTEN } = require(path.join(WURZEL, 'uebersichten-data.js'));

const kontext = {}; kontext.window = kontext; vm.createContext(kontext);
vm.runInContext(lies('grammar-data.js') + ';this.__R = GRAMMAR_RULES;', kontext);
const REGEL_IDS = new Set(kontext.__R.map(r => r.id));
const KORPUS = (lies('grammar-data.js') + '\n' + lies('lehrbuch-saetze.js')).normalize('NFC');

const HARAKA = /[ً-ْٰ]/;
const AR = /[ء-ي]/;
const texte = (o, aus = []) => {
  if (typeof o === 'string') aus.push(o);
  else if (Array.isArray(o)) o.forEach(x => texte(x, aus));
  else if (o && typeof o === 'object') Object.entries(o).forEach(([k, v]) => { if (k !== 'regeln') texte(v, aus); });
  return aus;
};
const woerter = s => s.normalize('NFC').split(/[\s،.؟?!:;,()"„“'«»·→\/+…]+/).map(w => w.replace(/^ـ+|ـ+$/g, '')).filter(w => AR.test(w));

function unbelegt(daten, korpus){
  const aus = new Set();
  for (const t of texte(daten)) for (const w of woerter(t)) if (HARAKA.test(w) && !korpus.includes(w)) aus.add(w);
  return [...aus];
}

const befunde = [];
const u1 = unbelegt(UEBERSICHTEN, KORPUS);
if (u1.length) befunde.push(`U1 ${u1.length} arabische Wörter ohne Beleg: ${u1.slice(0, 12).join(' · ')}`);

const alleRegeln = [...(UEBERSICHTEN.tafeln || []).flatMap(t => t.regeln || [])];
const fehlt = [...new Set(alleRegeln.filter(id => !REGEL_IDS.has(id)))];
if (fehlt.length) befunde.push(`U2 unbekannte Regel-Kennungen: ${fehlt.join(', ')}`);

const nrn = (UEBERSICHTEN.kapitel || []).map(k => k.nr);
const soll = Array.from({ length: 17 }, (_, i) => i + 1);
if (JSON.stringify(nrn) !== JSON.stringify(soll)) befunde.push(`U3 Kapitel sind ${nrn.join(',')} statt 1–17`);
const ids = (UEBERSICHTEN.tafeln || []).map(t => t.id);
if (ids.some(id => !/^ueb-/.test(id)) || new Set(ids).size !== ids.length) befunde.push('U3 Tafel-Kennungen nicht eindeutig oder ohne „ueb-"');

const anzeige = lies('js/uebersicht.js');
const ohneKommentar = anzeige.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
if (/LS\.set|localStorage|saveSettings|SETTINGS\.\w+\s*=/.test(ohneKommentar)) befunde.push('U4 js/uebersicht.js schreibt etwas — die Übersichten sollen nichts speichern');
const leser = fs.readdirSync(path.join(WURZEL, 'js')).filter(f => f.endsWith('.js') && f !== 'uebersicht.js')
  .filter(f => /\bUEBERSICHTEN\b/.test(lies('js/' + f).replace(/\/\*[\s\S]*?\*\//g, '')));
if (leser.length) befunde.push(`U4 außer js/uebersicht.js lesen UEBERSICHTEN: ${leser.join(', ')}`);

const html = lies('index.html'), sw = lies('sw.js');
for (const d of ['uebersichten-data.js', 'js/uebersicht.js']) {
  if (!html.includes(`src="${d}`) && !html.includes(`src="./${d}`)) befunde.push(`U5 ${d} ist nicht in index.html eingebunden`);
  if (!sw.includes(`'./${d}'`) && !sw.includes(`"./${d}"`) && !sw.includes(`'${d}'`)) befunde.push(`U5 ${d} fehlt im Vorrat von sw.js`);
}

/* Störtest: Fatḥa auf هَذَا → Ḍamma. */
const gestoert = JSON.parse(JSON.stringify(UEBERSICHTEN));
gestoert.tafeln[0].tabelle.zeilen[0][1] = 'هُذَا';
const stoerRot = unbelegt(gestoert, KORPUS).includes('هُذَا');

const tafeln = ids.length, kap = nrn.length, worte = new Set(texte(UEBERSICHTEN).flatMap(woerter)).size;
console.log(`${kap} Kapitel, ${tafeln} Tafeln, ${worte} verschiedene arabische Wörter, ${new Set(alleRegeln).size} Regeln verknüpft`);
befunde.forEach(b => console.log('⛔ ' + b));
console.log(stoerRot ? 'Störtest (vertauschter Vokal): rot ✓' : '⛔ Störtest NICHT rot — U1 prüft nichts.');
const rot = befunde.length > 0 || !stoerRot;
console.log(rot ? 'pruefe-uebersichten: ROT' : 'pruefe-uebersichten: grün');
process.exit(rot ? 1 : 0);
