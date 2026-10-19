#!/usr/bin/env node
/* test-wortkarte-herkunft.mjs — nach Löschen und Speichern bleibt er, wo er war (19.10.2026)
 * ==========================================================================================
 *
 * Elias, mit Bild einer leeren Liste ohne Überschrift („Keine Wörter in dieser Kategorie."):
 * „ich habe gerade wörter gelöscht und bin jetzt hier gekommen. ich will aber eigentlich in die
 * liste da zurück wo ich davor war". Gebaut in zeichneHerkunftNeu() (js/kategorien.js), dort
 * begründet. Geprüft mit der ECHTEN Funktion, aus dem Quelltext geschnitten:
 *   H1  in einer Wortliste: dieselbe Liste neu zeichnen
 *   H2  aus der Suche der Kategorien (auch wenn vorher eine andere Liste offen war): die Suche neu
 *       zeichnen, NIE auf eine Liste wechseln — sein Fall
 *   H3  aus der Suche vom Startbildschirm: diese Suche neu zeichnen
 *   H4  nirgends eine Liste oder Suche: nichts tun
 *   H5  Löschen und Speichern rufen zeichneHerkunftNeu(), nicht mehr openWordList(AKTUELLE_LISTE)
 * Danach Störtests — jeder muss rot werden.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const QUELLE = fs.readFileSync(path.join(HIER, 'js', 'kategorien.js'), 'utf8');

function schneide(text, name){
  const anfang = text.indexOf('function ' + name + '(');
  if (anfang < 0) return null;
  let i = text.indexOf('{', anfang), tiefe = 0;
  for (; i < text.length; i++){
    if (text[i] === '{') tiefe++;
    else if (text[i] === '}'){ tiefe--; if (!tiefe) return text.slice(anfang, i + 1); }
  }
  return null;
}

/* Ein Doppel der Seite: welcher Bildschirm aktiv ist, welche Trefferliste zu sehen ist. */
function lauf(quelle, { bildschirm, liste, sichtbar }){
  const fn = schneide(quelle, 'zeichneHerkunftNeu');
  if (!fn) return null;
  const aufrufe = [];
  const el = id => ({ classList: { contains: k => k === 'hidden' && !(sichtbar || []).includes(id) } });
  const k = vm.createContext({
    document: { querySelector: s => (s === '.screen.active' && bildschirm ? { id: bildschirm } : null), getElementById: el },
    AKTUELLE_LISTE: liste || '',
    openWordList: key => aufrufe.push('liste:' + key),
    zeichneSuche: () => aufrufe.push('suche'),
    zeichneAlleSuche: () => aufrufe.push('alleSuche')
  });
  vm.runInContext(fn.replace('function zeichneHerkunftNeu(', 'globalThis.__ = function(') , k);
  k.__();
  return aufrufe.join(',');
}

function befunde(quelle){
  const f = [];
  const soll = [
    ['H1', { bildschirm: 'screen-wordlist', liste: 'chapter:personal' }, 'liste:chapter:personal'],
    ['H2', { bildschirm: 'screen-categories', liste: 'chapter:madina-1:3', sichtbar: ['sucheTreffer'] }, 'suche'],
    ['H2', { bildschirm: 'screen-categories', liste: '', sichtbar: ['sucheTreffer'] }, 'suche'],
    ['H3', { bildschirm: 'screen-suche', liste: 'box:1', sichtbar: ['alleSucheTreffer'] }, 'alleSuche'],
    ['H4', { bildschirm: 'screen-home', liste: '' }, ''],
    ['H4', { bildschirm: 'screen-home', liste: 'chapter:personal' }, '']
  ];
  for (const [name, lage, erwartet] of soll){
    const ist = lauf(quelle, lage);
    if (ist === null) return ['H0: zeichneHerkunftNeu() fehlt in js/kategorien.js'];
    if (ist !== erwartet) f.push(`${name}: ${JSON.stringify(lage)} → „${ist}" statt „${erwartet}"`);
  }
  /* H5: die Verdrahtung */
  const loeschen = quelle.indexOf('if (loeschePersonalVocab(w.id)){');
  const block = loeschen < 0 ? '' : quelle.slice(loeschen, quelle.indexOf('}', quelle.indexOf('toast(', loeschen)));
  if (!/schliesseWortKarte\(\);\s*zeichneHerkunftNeu\(\);/.test(block)) f.push('H5: nach dem Löschen wird nicht zeichneHerkunftNeu() gerufen');
  if (block.includes('openWordList(')) f.push('H5: nach dem Löschen wechselt die Karte wieder auf eine Liste');
  const speichern = quelle.indexOf('speichereWortAenderung(WK_WORT.id, {');
  const danach = speichern < 0 ? '' : quelle.slice(speichern, quelle.indexOf("toast('Gespeichert')", speichern));
  if (!danach.includes('zeichneHerkunftNeu();') || danach.includes('openWordList(')) f.push('H5: nach dem Speichern wird nicht zeichneHerkunftNeu() gerufen');
  return f;
}

let schlecht = 0;
const echt = befunde(QUELLE);
console.log('test-wortkarte-herkunft — nach Löschen und Speichern bleibt er, wo er war (Elias, 19.10.2026)');
if (echt.length){ schlecht++; echt.forEach(b => console.log('  ⛔ ' + b)); }
else console.log('  ✅ H1–H5 grün');

const ersetze = (t, alt, neu) => { const n = t.split(alt).length - 1; if (n !== 1) throw new Error('die Stelle steht ' + n + '-mal da'); return t.replace(alt, neu); };
const STOER = [
  ['Löschen wechselt wieder fest auf die letzte Liste', /^H5:/, q => ersetze(q, '      schliesseWortKarte();\n      zeichneHerkunftNeu();', '      schliesseWortKarte();\n      openWordList(AKTUELLE_LISTE);')],
  ['die alte Liste gewinnt auch außerhalb der Wortliste', /^H2:/, q => ersetze(q, "  if (aktiv && aktiv.id === 'screen-wordlist'){", '  if (AKTUELLE_LISTE){')],
  ['die Suche wird nicht neu gezeichnet', /^H2:/, q => ersetze(q, "  if (sichtbar('sucheTreffer') && typeof zeichneSuche === 'function') zeichneSuche();\n", '')],
  ['Speichern wechselt wieder auf die Liste', /^H5:/, q => ersetze(q, "    zeichneHerkunftNeu();\n    toast('Gespeichert');", "    if (AKTUELLE_LISTE) openWordList(AKTUELLE_LISTE);\n    toast('Gespeichert');")]
];
console.log('\nStörtests (jeder muss rot werden):');
for (const [name, erwartet, stoere] of STOER){
  let q;
  try { q = stoere(QUELLE); } catch (e){ schlecht++; console.log(`  ⛔ „${name}": ${e.message}`); continue; }
  const t = befunde(q).find(b => erwartet.test(b));
  if (t) console.log(`  ✔ ${name} → rot (${t.split(':')[0]})`);
  else { schlecht++; console.log(`  ⛔ ${name} → blieb grün`); }
}
console.log('\n' + (schlecht ? '⛔ test-wortkarte-herkunft: ' + schlecht + ' Befund(e).' : `✅ test-wortkarte-herkunft: grün, alle ${STOER.length} Störtests rot geworden.`));
process.exit(schlecht ? 1 : 0);
