#!/usr/bin/env node
/* test-leer-gewollt.mjs — verdeckt ein leer gespeichertes Feld nur, was er absichtlich geleert hat?
 * ==========================================================================
 *
 * Elias am 26.10.2026, auf meinen Befund zu „Zeit- oder Ortsangabe" (gram-zarf): „Ja, die
 * zwei Karten sollen ihren Beispielsatz wieder zeigen." Das Bearbeiten-Formular schickt
 * immer alle Felder mit; ein Feld, das beim Bearbeiten noch leer war, kam als '' in
 * vt_wortAenderungen und verdeckte den Satz, der einen Tag später dazukam.
 * Regel (js/kern.js, speichereWortAenderung() und wendeWortAenderungenAn()):
 *   A  ein altes '' ohne Vermerk verdeckt nichts — die Karte zeigt ihren Satz aus den Daten
 *   B  leert er ein Feld, in dem etwas stand, bleibt es leer, auch nach einem Neustart
 *      (Vermerk `leerGewollt`)
 *   C  füllt er es wieder, gilt sein neuer Text, und der Vermerk fällt weg
 *   D  ein Feld, das schon leer war, wird gar nicht erst gespeichert
 *
 * Gefahren wird die ECHTE js/kern.js im vm, mit den Daten in der Reihenfolge von index.html
 * und einem gestellten Speicher, der den Neustart überlebt (wie werkzeuge/pruefe-bearbeiten.mjs).
 *
 * Störtest beim Einbau (26.10.2026): die neue Zeile in wendeWortAenderungenAn() entfernt → A rot;
 * `geleert` in speichereWortAenderung() immer leer → B rot. Beides zurück → grün.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const REPO = path.dirname(fileURLToPath(import.meta.url));
const lies = rel => fs.readFileSync(path.join(REPO, rel), 'utf8');
const DATEN = ['vocab-data.js', 'data/beispielsaetze.js', 'data/fachbegriffe.js', 'data/kalender.js',
               'data/feld-ausnahmen.js', 'data/de-mehrzahl.js', 'grammar-data.js'];
const SKRIPTE = DATEN.map(rel => new vm.Script(lies(rel), { filename: rel }));
const KERN = new vm.Script(lies('js/kern.js'), { filename: 'js/kern.js' });

let gut = 0;
const fehler = [];
const pruefe = (bed, text) => { if (bed) gut++; else fehler.push(text); };

/* Ein Start der App; `speicher` ist sein localStorage und überlebt den Neustart. */
function starte(speicher){
  const el = () => ({ style:{}, classList:{ add(){}, remove(){}, toggle(){}, contains:()=>false },
    addEventListener(){}, appendChild(){}, querySelector:()=>null, querySelectorAll:()=>[],
    closest:()=>null, getAttribute:()=>null, setAttribute(){}, focus(){},
    getBoundingClientRect:()=>({width:0,height:0,top:0,left:0}) });
  const dom = { getElementById: el, querySelector: el, querySelectorAll: () => [],
                createElement: el, addEventListener(){}, body: el(), documentElement: el() };
  const c = {
    window:{ addEventListener(){}, matchMedia:()=>({matches:false,addEventListener(){}}),
             location:{href:''}, navigator:{userAgent:'node',language:'de'} },
    document: dom,
    localStorage:{ getItem:k=>speicher[k] ?? null, setItem:(k,v)=>{speicher[k]=String(v);},
                   removeItem:k=>{delete speicher[k];}, clear(){}, key:i=>Object.keys(speicher)[i] ?? null,
                   get length(){ return Object.keys(speicher).length; } },
    navigator:{ userAgent:'node', language:'de', onLine:true },
    console:{ log(){}, warn(){}, error(){}, info(){} },
    Date, Math, JSON, Intl, setTimeout, clearTimeout, setInterval, clearInterval,
    fetch: () => Promise.reject(new Error('kein Netz im Test'))
  };
  c.globalThis = c; c.self = c; c.window.document = dom; c.window.localStorage = c.localStorage;
  vm.createContext(c);
  for (const s of SKRIPTE) s.runInContext(c);
  KERN.runInContext(c);
  vm.runInContext('wendeFeldErgaenzungenAn(VOCAB_DATA); wendeWortAenderungenAn();', c);
  return c;
}
const karte = (c, id) => vm.runInContext('(() => { const w = VOCAB_DATA.find(x => String(x.id) === '
  + JSON.stringify(String(id)) + '); return w ? JSON.parse(JSON.stringify(w)) : null; })()', c);
const speichere = (c, id, felder) => vm.runInContext('speichereWortAenderung(' + JSON.stringify(id) + ', ' + JSON.stringify(felder) + ')', c);
const eintrag = (speicher, id) => (JSON.parse(speicher.vt_wortAenderungen || '{}'))[String(id)] || null;
const formular = (w, aenderung) => Object.assign({ ar: w.ar, de: w.de, pl: w.pl || '', root: w.root || '',
  sentAr: w.sentAr || '', sentDe: w.sentDe || '', type: w.type }, aenderung);

/* Die Karten: gram-zarf, wenn sie da ist (der Fall von Elias), sonst die erste mit Satz;
   dazu eine ohne Satz. */
const probe = starte({});
const [mitId, ohneId] = vm.runInContext(`(() => {
  const ok = w => w && !w.istPlural && w.ar && w.de;
  const zarf = VOCAB_DATA.find(w => String(w.id) === 'gram-zarf' && w.sentAr);
  const mit = zarf || VOCAB_DATA.find(w => ok(w) && w.sentAr && w.sentDe);
  const ohne = VOCAB_DATA.find(w => ok(w) && !w.sentAr && !w.sentDe && w !== mit);
  return [mit ? mit.id : null, ohne ? ohne.id : null];
})()`, probe);
pruefe(!!mitId && !!ohneId, '0: Probekarten gefunden (mit Satz: ' + mitId + ', ohne: ' + ohneId + ')');
const original = mitId ? karte(probe, mitId) : null;

if (original && original.sentAr){
  /* A — die alte Bearbeitung vom 19.08.: nur das Tanwin, die Satzfelder leer mitgeschickt */
  const sA = { vt_wortAenderungen: JSON.stringify({ [String(mitId)]: { ar: original.ar, de: original.de,
    sentAr: '', sentDe: '', pl: '', zeit: Date.UTC(2026, 7, 19) } }) };
  const wA = karte(starte(sA), mitId);
  pruefe(wA && wA.sentAr === original.sentAr && wA.sentDe === original.sentDe,
    'A: ein altes leeres Satzfeld ohne Vermerk verdeckt den Satz nicht (zeigt: ' + JSON.stringify(wA && wA.sentAr) + ')');

  /* B — er leert den Satz absichtlich */
  const sB = {};
  const cB = starte(sB);
  pruefe(speichere(cB, mitId, formular(original, { sentAr: '', sentDe: '' })) === true, 'B: Speichern klappt');
  const eB = eintrag(sB, mitId) || {};
  pruefe(eB.sentAr === '' && Array.isArray(eB.leerGewollt) && eB.leerGewollt.includes('sentAr') && eB.leerGewollt.includes('sentDe'),
    'B: gespeichert als leer MIT Vermerk (Eintrag: ' + JSON.stringify(eB) .slice(0, 200) + ')');
  const wB = karte(starte(sB), mitId);
  pruefe(wB && !wB.sentAr && !wB.sentDe, 'B: nach dem Neustart bleibt der Satz leer (zeigt: ' + JSON.stringify(wB && wB.sentAr) + ')');
  pruefe(original.pl ? true : !('pl' in eB), 'B: ein schon leeres Feld (pl) wird nicht mitgespeichert');

  /* C — er füllt ihn wieder */
  const cC = starte(sB);
  speichere(cC, mitId, formular(karte(cC, mitId), { sentAr: 'NEUER SATZ', sentDe: 'Neuer Satz' }));
  const eC = eintrag(sB, mitId) || {};
  pruefe(!(Array.isArray(eC.leerGewollt) && (eC.leerGewollt.includes('sentAr') || eC.leerGewollt.includes('sentDe'))),
    'C: der Vermerk fällt weg, wenn er den Satz wieder füllt (Eintrag: ' + JSON.stringify(eC).slice(0, 200) + ')');
  const wC = karte(starte(sB), mitId);
  pruefe(wC && wC.sentAr === 'NEUER SATZ' && wC.sentDe === 'Neuer Satz', 'C: nach dem Neustart gilt sein neuer Satz');
} else fehler.push('A–C: die Probekarte hat keinen Satz — der Test beweist nichts');

if (ohneId){
  /* D — schon leer: nur die Bedeutung geändert, die leeren Satzfelder dürfen nicht hinein */
  const sD = {};
  const cD = starte(sD);
  const w = karte(cD, ohneId);
  speichere(cD, ohneId, formular(w, { de: w.de + ' PRUEFUNG' }));
  const eD = eintrag(sD, ohneId) || {};
  pruefe(eD.de === w.de + ' PRUEFUNG', 'D: die echte Änderung ist gespeichert');
  pruefe(!('sentAr' in eD) && !('sentDe' in eD) && !('leerGewollt' in eD),
    'D: schon leere Felder bleiben draußen, kein Vermerk (Eintrag: ' + JSON.stringify(eD).slice(0, 200) + ')');
}

console.log(fehler.length ? 'ROT (' + gut + ' gut, ' + fehler.length + ' falsch):\n- ' + fehler.join('\n- ')
  : 'GRÜN: ' + gut + ' Prüfungen — ein leeres Feld verdeckt nur, was er absichtlich geleert hat');
process.exit(fehler.length ? 1 : 0);
