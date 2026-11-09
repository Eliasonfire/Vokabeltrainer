#!/usr/bin/env node
/* pruefe-geschichten.mjs — bewacht „Geschichten mit Lücken" im Satzmodus (js/saetze.js)
 * ======================================================================================
 *
 * Elias, 08.11.2026: „ich finde geschichten mit lücken ganz interessant", dann „Im Satzmodus
 * (A)". Eine Geschichte ist eine Lektion aus seinem Madina-1-Exemplar (lehrbuch-saetze.js,
 * `mb1-…`) in Buchreihenfolge. Goal-Prompt E.1: nichts erfunden. Geprüft wird der ECHTE Code:
 * die Funktionen werden aus js/saetze.js ausgeschnitten und hier ausgeführt.
 *
 *   G1  jeder Satz einer Geschichte ist ein mb1-Buchsatz mit Seite, und die Seiten steigen
 *   G2  jede Auswahl: Lösung dabei, Knöpfe verschieden, mindestens 2, und jedes Wort steht
 *       wörtlich in einem Buchsatz DERSELBEN Lektion (keine erzeugte Form)
 *   G3  es gibt mindestens eine Geschichte mit Lücke (sonst ist die Funktion leer)
 *   G4  die Lücke verdeckt JEDES Vorkommen des Wortes im Satz (mb1-68-2 hat es zweimal)
 *
 * Aufruf: node werkzeuge/pruefe-geschichten.mjs              Exit 0 grün, 1 rot
 *         node werkzeuge/pruefe-geschichten.mjs --stoertest  jede Prüfung muss rot werden können
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const W = path.join(path.dirname(fileURLToPath(import.meta.url)), '..') + path.sep;
const lies = d => fs.readFileSync(W + d, 'utf8');
const SAETZE_JS = lies('js/saetze.js');

function schneide(quelle, name){
  const start = quelle.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('Funktion fehlt in js/saetze.js: ' + name);
  let i = quelle.indexOf('{', start), tiefe = 0;
  for (; i < quelle.length; i++){
    if (quelle[i] === '{') tiefe++;
    else if (quelle[i] === '}' && --tiefe === 0) return quelle.slice(start, i + 1);
  }
  throw new Error('Ende nicht gefunden: ' + name);
}
function block(quelle){
  const a = quelle.indexOf('const GESCHICHTE_PRAEFIX');
  const b = quelle.indexOf('function satzListe(');
  if (a < 0 || b < a) throw new Error('Block „Geschichten" nicht gefunden');
  return quelle.slice(a, b);
}

function baueKontext(daten, ersatz = {}){
  const c = {
    LEHRBUCH_SAETZE: daten.LEHRBUCH_SAETZE, SENTENCE_TAGS: daten.SENTENCE_TAGS,
    GRAMMAR_RULES: daten.GRAMMAR_RULES, SATZ_THEMA: 'alle', SATZ_REGELFILTER: null,
    LUECKE: { aktiv: false, wort: '', geloest: false },
    escapeHtml: s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  };
  vm.createContext(c);
  const teile = ['ohneTaschkil', 'ohnePunkt', 'wortKern', 'findeZielwort', 'gleichesWortLose', 'mitLuecke', 'satzZufall']
    .map(n => ersatz[n] || schneide(SAETZE_JS, n));
  vm.runInContext('const SATZ_ZUFALL = new Map();\n' + teile.join('\n') + '\n' + (ersatz.block || block(SAETZE_JS))
    + '\nthis.F={geschichten,geschichteSaetze,geschichteWahl,findeZielwort,mitLuecke,ohneTaschkil,istMb1Buchsatz};', c);
  return c;
}

function laden(){
  const { LEHRBUCH_SAETZE } = (new Function(lies('lehrbuch-saetze.js') + ';return {LEHRBUCH_SAETZE};'))();
  const { GRAMMAR_RULES, SENTENCE_TAGS } = (new Function(lies('grammar-data.js') + ';return {GRAMMAR_RULES, SENTENCE_TAGS};'))();
  return { LEHRBUCH_SAETZE: LEHRBUCH_SAETZE.map(s => ({ ...s })), GRAMMAR_RULES, SENTENCE_TAGS };
}

function pruefe(daten, ersatz){
  const c = baueKontext(daten, ersatz), F = c.F, fehler = { G1: [], G2: [], G3: [], G4: [] };
  const gs = F.geschichten();
  let mitLueckeZahl = 0;
  for (const g of gs){
    const liste = F.geschichteSaetze(g.id);
    let vorher = -1;
    for (const s of liste){
      if (!F.istMb1Buchsatz(s) || !s.seite) fehler.G1.push(`${g.id}: ${s.id} ohne Buchseite oder nicht aus Madina 1`);
      if (Number(s.seite) < vorher) fehler.G1.push(`${g.id}: ${s.id} steht vor S. ${vorher}`);
      vorher = Number(s.seite);
    }
    const text = liste.map(s => s.sentAr).join(' ');
    c.SATZ_THEMA = g.id;
    for (const s of liste){
      const ziel = F.findeZielwort(s);
      if (!ziel) continue;
      mitLueckeZahl++;
      const wahl = F.geschichteWahl(s, ziel, g.id);
      if (!wahl.includes(ziel)) fehler.G2.push(`${s.id}: Lösung fehlt in der Auswahl`);
      if (new Set(wahl.map(F.ohneTaschkil)).size !== wahl.length) fehler.G2.push(`${s.id}: doppelte Knöpfe`);
      if (wahl.length < 2) fehler.G2.push(`${s.id}: nur ${wahl.length} Knopf`);
      for (const w of wahl) if (!text.includes(w)) fehler.G2.push(`${s.id}: „${w}" steht in keinem Satz von ${g.name}`);
    }
  }
  if (!gs.length || !mitLueckeZahl) fehler.G3.push(`Geschichten: ${gs.length}, Sätze mit Lücke: ${mitLueckeZahl}`);
  c.LUECKE.aktiv = true; c.LUECKE.wort = 'مُجْتَهِدُونَ';
  const html = F.mitLuecke('أَهُمْ مُجْتَهِدُونَ؟ نَعَمْ، هُمْ مُجْتَهِدُونَ.') || '';
  const offen = html.replace(/<span class="satz-luecke[^"]*">[^<]*<\/span>/g, '');
  if (offen.includes('مُجْتَهِدُونَ')) fehler.G4.push('ein Vorkommen des Lückenworts steht offen im Satz');
  return { fehler, gs, mitLueckeZahl };
}

if (process.argv.includes('--stoertest')){
  const faelle = {
    G1: () => { const d = laden(); const s = d.LEHRBUCH_SAETZE.find(x => /^mb1-/.test(x.id) && x.kapitel === 13); delete s.seite; return pruefe(d); },
    G2: () => pruefe(laden(), { findeZielwort: 'function findeZielwort(w){ return "كَلِمَةٌ" + String(w.id).length; }' }),
    G3: () => { const d = laden(); d.LEHRBUCH_SAETZE = d.LEHRBUCH_SAETZE.filter(x => !/^mb1-/.test(x.id)); return pruefe(d); },
    G4: () => pruefe(laden(), { mitLuecke: 'function mitLuecke(t){ const v=t.indexOf(LUECKE.wort); return t.slice(0,v)+`<span class="satz-luecke">${LUECKE.wort}</span>`+t.slice(v+LUECKE.wort.length); }' })
  };
  let gut = 0;
  for (const [k, f] of Object.entries(faelle)){
    const n = f().fehler[k].length;
    console.log(`  ${n ? 'ok  ' : 'XX  '} Störtest ${k}: ${n ? 'wird rot' : 'BLEIBT GRÜN'}`);
    if (n) gut++;
  }
  const echt = pruefe(laden());
  const echtRot = Object.values(echt.fehler).flat().length;
  console.log(`  ${echtRot ? 'XX  ' : 'ok  '} echte Dateien: ${echtRot ? echtRot + ' Befunde' : 'grün'}`);
  console.log(gut === 4 && !echtRot ? '✅ Störtest: 4 von 4 rot, echte Dateien grün.' : '❌ Störtest unvollständig.');
  process.exit(gut === 4 && !echtRot ? 0 : 1);
}

const { fehler, gs, mitLueckeZahl } = pruefe(laden());
let rot = 0;
for (const [k, liste] of Object.entries(fehler)){
  if (liste.length){ rot += liste.length; console.log(`  XX  ${k}: ${liste.length}`); liste.slice(0, 8).forEach(z => console.log('        ' + z)); }
  else console.log(`  ok  ${k}`);
}
console.log(rot ? `❌ ${rot} Befunde.` : `✅ ${gs.length} Geschichten, ${mitLueckeZahl} Sätze mit Lücke — alles aus dem Buch.`);
process.exit(rot ? 1 : 0);
