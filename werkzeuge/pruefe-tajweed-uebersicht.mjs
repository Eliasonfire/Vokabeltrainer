#!/usr/bin/env node
/* pruefe-tajweed-uebersicht.mjs — bewacht die Übersicht der markierten Koranstellen
 * ==================================================================================
 *
 * Elias, 09.11.2026, auf die Frage nach einer Seite mit allen markierten Stellen,
 * nach Sure geordnet: „Ja, Seite bauen". Gebaut in js/quran-markierung.js
 * (tajweedUebersicht und Nachbarn). Geprüft wird der ECHTE Code: die Funktionen
 * werden aus der Datei ausgeschnitten und hier mit erfundenen Markierungen gefahren.
 *
 *   U1  geordnet nach Sure, Vers, Wort; je Wort die Buchstaben nach Position;
 *       ein Wort mit zwei Buchstaben ist EINE Zeile
 *   U2  nur, was der Leser auch zeigt: `an:false` fehlt, älter als ein Monat fehlt
 *       (seine Regel vom 22.09.2026), die alte Wort-Form (drei Teile) fehlt
 *   U3  erreichbar: Knopf und Fenster in index.html, die Zurück-Taste kennt das Fenster
 *       (OVERLAYS in js/navigation.js), die Surenliste ruft tajweedUebersichtKnopf()
 *
 * Aufruf: node werkzeuge/pruefe-tajweed-uebersicht.mjs              Exit 0 grün, 1 rot
 *         node werkzeuge/pruefe-tajweed-uebersicht.mjs --stoertest  jede Prüfung muss rot werden können
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const W = path.join(path.dirname(fileURLToPath(import.meta.url)), '..') + path.sep;
const lies = d => fs.readFileSync(W + d, 'utf8');
const QUELLE = { mark: lies('js/quran-markierung.js'), html: lies('index.html'), nav: lies('js/navigation.js'), quran: lies('js/quran.js') };

function schneide(quelle, name){
  const start = quelle.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('Funktion fehlt: ' + name);
  let i = quelle.indexOf('{', start), tiefe = 0;
  for (; i < quelle.length; i++){
    if (quelle[i] === '{') tiefe++;
    else if (quelle[i] === '}' && --tiefe === 0) return quelle.slice(start, i + 1);
  }
  throw new Error('Ende nicht gefunden: ' + name);
}

function pruefe(q){
  const fehler = { U1: [], U2: [], U3: [] };
  const c = {};
  vm.createContext(c);
  const ms = q.mark.match(/const TJ_SICHTBAR_MS = [^;]+;/);
  vm.runInContext((ms ? ms[0] : '') + '\n' + schneide(q.mark, 'tajweedSichtbar') + '\n' + schneide(q.mark, 'tajweedUebersicht')
    + '\nthis.F = { tajweedUebersicht, TJ_SICHTBAR_MS };', c);
  const { tajweedUebersicht, TJ_SICHTBAR_MS } = c.F;
  const jetzt = Date.UTC(2026, 10, 9, 12);
  const tag = 24 * 3600 * 1000;
  const e = (farbe, notiz, alterTage, an = true) => ({ an, farbe, notiz, zeichen: 'x', zeit: jetzt, seit: jetzt - alterTage * tag });
  const daten = {
    '94:8:3:3':   e('rot', 'zweiter', 2),
    '94:8:3:1':   e('blau', 'erster', 2),
    '93:4:2:5':   e('rot', 'Nur 2 Harakat', 1),
    '102:2:2:0':  e('orange', '', 3),
    '94:3:3:2':   e('lila', '', 4),
    '99:7:4:5':   e('rot', 'weg', 1, false),       /* weggenommen */
    '112:1:1:0':  e('rot', 'zu alt', 31),          /* älter als ein Monat */
    '113:1:1':    e('rot', 'alte Wort-Form', 1)    /* drei Teile: nicht mehr die Form */
  };
  const suren = tajweedUebersicht(daten, jetzt);
  const zeilen = suren.flatMap(s => s.woerter.map(w => `${w.sure}:${w.vers}:${w.wort}`));

  const erwartet = ['93:4:2', '94:3:3', '94:8:3', '102:2:2'];
  if (zeilen.join(' ') !== erwartet.join(' ')) fehler.U1.push(`Reihenfolge ${zeilen.join(' ')} statt ${erwartet.join(' ')}`);
  if (suren.map(s => s.sure).join(' ') !== '93 94 102') fehler.U1.push(`Suren ${suren.map(s => s.sure).join(' ')} statt 93 94 102`);
  const w948 = suren.flatMap(s => s.woerter).find(w => w.vers === 8 && w.sure === 94);
  if (!w948 || w948.stellen.map(s => s.pos).join(',') !== '1,3') fehler.U1.push(`94:8:3: Buchstaben ${w948 ? w948.stellen.map(s => s.pos).join(',') : '—'} statt 1,3`);

  for (const weg of ['99:7:4', '112:1:1', '113:1']) if (zeilen.some(z => z.startsWith(weg))) fehler.U2.push(`${weg} steht da, gehört nicht hinein`);
  if (TJ_SICHTBAR_MS !== 30 * tag) fehler.U2.push(`TJ_SICHTBAR_MS ist ${TJ_SICHTBAR_MS}, nicht ein Monat (30 Tage)`);

  for (const id of ['btnTjUebersicht', 'tjUebersicht', 'tjUebersichtListe', 'tjUebersichtBackdrop', 'btnCloseTjUebersicht'])
    if (!q.html.includes(`id="${id}"`)) fehler.U3.push(`index.html: id="${id}" fehlt`);
  if (!/id:\s*'tjUebersicht',\s*zu:\s*'tajweedUebersichtSchliessen'/.test(q.nav)) fehler.U3.push('js/navigation.js: OVERLAYS kennt tjUebersicht nicht');
  if (!/tajweedUebersichtKnopf\(\)/.test(q.quran)) fehler.U3.push('js/quran.js ruft tajweedUebersichtKnopf() nicht');
  for (const n of ['tajweedUebersichtOeffnen', 'tajweedUebersichtSchliessen', 'tajweedUebersichtSprung', 'tajweedUebersichtKnopf'])
    if (!q.mark.includes('function ' + n + '(')) fehler.U3.push(`js/quran-markierung.js: ${n} fehlt`);
  return fehler;
}

if (process.argv.includes('--stoertest')){
  const faelle = {
    U1: () => pruefe({ ...QUELLE, mark: QUELLE.mark.replace('.sort((a, b) => a.sure - b.sure || a.vers - b.vers || a.wort - b.wort)', '') }),
    U2: () => pruefe({ ...QUELLE, mark: QUELLE.mark.replace('    if (!tajweedSichtbar(e, jetzt)) continue;\n    const t = id.split', '    const t = id.split') }),
    U3: () => pruefe({ ...QUELLE, quran: QUELLE.quran.replace('tajweedUebersichtKnopf();', '') })
  };
  let gut = 0;
  for (const [k, f] of Object.entries(faelle)){
    const n = f()[k].length;
    console.log(`  ${n ? 'ok  ' : 'XX  '} Störtest ${k}: ${n ? 'wird rot' : 'BLEIBT GRÜN'}`);
    if (n) gut++;
  }
  const echtRot = Object.values(pruefe(QUELLE)).flat().length;
  const alle = Object.keys(faelle).length;
  console.log(gut === alle && !echtRot ? `✅ Störtest: ${alle} von ${alle} rot, echte Dateien grün.` : '❌ Störtest unvollständig.');
  process.exit(gut === alle && !echtRot ? 0 : 1);
}

const fehler = pruefe(QUELLE);
let rot = 0;
for (const [k, liste] of Object.entries(fehler)){
  if (liste.length){ rot += liste.length; console.log(`  XX  ${k}: ${liste.length}`); liste.forEach(z => console.log('        ' + z)); }
  else console.log(`  ok  ${k}`);
}
console.log(rot ? `❌ ${rot} Befunde.` : '✅ Übersicht der markierten Stellen: geordnet, nur Sichtbares, erreichbar.');
process.exit(rot ? 1 : 0);
