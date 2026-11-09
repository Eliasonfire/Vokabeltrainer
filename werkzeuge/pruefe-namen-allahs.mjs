#!/usr/bin/env node
/* pruefe-namen-allahs.mjs — die Namen Allahs (werkzeuge/namen-allahs-liste.json) gegen ihre Belege
 * ===============================================================================================
 *
 * Elias, 08.11.2026: „ich brauche authentische namen von allah". Jeder Name braucht deshalb einen
 * Beleg, und die Vokalzeichen kommen nicht aus meinem Kopf, sondern müssen zum Beleg passen.
 *
 *   N1  genau 99 Namen, Nummern 1–99 lückenlos, kein Name doppelt
 *   N2  alles NFC, jedes arabische Wort voll vokalisiert, Deutsch und Umschrift vorhanden
 *   N3  quelle 'quran': der Vers aus `beleg` enthält ein Wort mit denselben Buchstaben wie der Name
 *       (ohne اَلْ, ohne vorangestellte Partikeln, Endung frei) UND denselben Vokalen bis auf den
 *       letzten Buchstaben (Kasus/Tanwīn) und die Schadda des Sonnenbuchstabens nach اَلْ
 *   N4  quelle 'sunna': der zitierte Hadithtext enthält den Namen (Buchstaben, ohne اَلْ)
 *   N5  dua: jede genannte Dua gibt es in data/duas.json, und ihr Text enthält den Namen
 *   N6  Beispielsätze (namen-allahs-saetze.json): das Zitat steht WÖRTLICH (mit Vokalen, NFC) in seiner
 *       Dua bzw. in seinem Vers, der Vers liegt in seinem auswendigen Bereich (data/auswendig.json), und
 *       Wort Nummer `w` des Zitats enthält den Namen (Buchstaben, ohne اَلْ)
 * Störtests: ein vertauschter Vokal, ein falscher Vers, ein Hadith ohne den Namen, eine Dua ohne
 * den Namen — jeder muss rot werden.
 *
 * Exit 0 = grün und alle Störtests rot. Exit 1 = sonst.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.join(HIER, '..');
const lade = (datei, name) => new Function(fs.readFileSync(path.join(WURZEL, datei), 'utf8') + `;return ${name};`)();
const QURAN = lade('quran-text.js', 'QURAN_TEXT');
const LISTE = JSON.parse(fs.readFileSync(path.join(HIER, 'namen-allahs-liste.json'), 'utf8'));
const DUAS = JSON.parse(fs.readFileSync(path.join(WURZEL, 'data', 'duas.json'), 'utf8')).duas;
const SAETZE = JSON.parse(fs.readFileSync(path.join(HIER, 'namen-allahs-saetze.json'), 'utf8')).saetze;
const AUSWENDIG = JSON.parse(fs.readFileSync(path.join(WURZEL, 'data', 'auswendig.json'), 'utf8'));
const imBereich = (sure, vers) => (AUSWENDIG.suren || []).includes(sure) || (AUSWENDIG.verse || []).includes(sure + ':' + vers);

const HARAKAT = /[ً-ْٰ]/;
const TASCHKIL = /[ً-ٰٟۖ-ۭ]/g;
/* Buchstabenskelett: ohne Zeichen, Hamza-Sitze und Alif-Formen vereinheitlicht. */
const skelett = s => s.normalize('NFD').replace(TASCHKIL, '').replace(/ـ/g, '')
  .replace(/[آأإٱء]/g, 'ا').replace(/[ؤ]/g, 'و').replace(/[ئ]/g, 'ي')
  .replace(/ى/g, 'ي').replace(/ة/g, 'ه').normalize('NFC');
/* Buchstabe für Buchstabe mit seinen Vokalzeichen. Uthmani-Zeichen auf die üblichen abgebildet. */
function zerlege(wort){
  const s = wort.normalize('NFD').replace(/ۡ/g, 'ْ').replace(/[ٕٔٓ]/g, '')
    .replace(/[ۖ-۠ۢ-ۭ]/g, '').replace(/ـ/g, '');
  const out = [];
  for (const z of s) {
    /* Das kleine Alif (U+0670) ist ein langes A: als eigener Buchstabe Alif gezählt, damit
       ٱلظَّٰهِرُ (Muṣḥaf) und الظَّاهِرُ (übliche Schreibung) gleich zerfallen. */
    if (z === 'ٰ') { out.push({ b: 'ا', m: [] }); continue; }
    if (/[ً-ْ]/.test(z)) { if (out.length) out[out.length - 1].m.push(z); }
    else out.push({ b: skelett(z), m: [] });
  }
  return out.filter(x => x.b);
}
const ohneAl = w => w.replace(/^ال/, '');
const versText = (sure, vers) => {
  const v = (QURAN[sure] || [])[vers - 1];
  if (v == null) return null;
  return typeof v === 'string' ? v : (v.ar || v.arabisch || v.text || v[0] || '');
};

function pruefeQuran(n){
  const [s, v] = String(n.beleg).split(':').map(Number);
  const text = versText(s, v);
  if (!text) return `N3 ${n.nr} ${n.um}: Vers ${n.beleg} gibt es nicht`;
  const nameZ = zerlege(n.ar);
  let nameStamm = nameZ;
  if (nameZ.length > 2 && nameZ[0].b === 'ا' && nameZ[1].b === 'ل' && n.ar !== 'اللَّهُ') nameStamm = nameZ.slice(2);
  const stammSkelett = nameStamm.map(x => x.b).join('');
  for (const wort of text.split(/\s+/)) {
    const z = zerlege(wort);
    const sk = z.map(x => x.b).join('');
    for (let i = 0; i <= z.length - nameStamm.length; i++) {
      if (!sk.startsWith(stammSkelett, i)) continue;
      // Vokale vergleichen, ohne den letzten Buchstaben (Endung) und ohne Schadda am ersten Buchstaben
      let gleich = true;
      for (let k = 0; k < nameStamm.length - 1; k++) {
        const a = nameStamm[k].m.filter(m => !(k === 0 && m === 'ّ')).sort().join('');
        const b = z[i + k].m.filter(m => !(k === 0 && m === 'ّ')).sort().join('');
        if (a !== b) { gleich = false; break; }
      }
      if (gleich) return null;
    }
  }
  return `N3 ${n.nr} ${n.um}: in ${n.beleg} kein Wort mit denselben Buchstaben und Vokalen wie ${n.ar}`;
}

function pruefe(liste, duas){
  const f = [];
  const namen = liste.namen;
  if (namen.length !== 99) f.push(`N1: ${namen.length} statt 99 Namen`);
  namen.forEach((n, i) => { if (n.nr !== i + 1) f.push(`N1: an Platz ${i + 1} steht Nummer ${n.nr}`); });
  const gesehen = new Set();
  for (const n of namen) {
    const k = skelett(n.ar);
    if (gesehen.has(k)) f.push(`N1: ${n.ar} doppelt`);
    gesehen.add(k);
    if (n.ar !== n.ar.normalize('NFC')) f.push(`N2 ${n.nr}: nicht NFC`);
    if (!HARAKAT.test(n.ar)) f.push(`N2 ${n.nr}: ohne Vokalzeichen`);
    if (!n.de || !n.um) f.push(`N2 ${n.nr}: Deutsch oder Umschrift fehlt`);
    if (n.quelle === 'quran') { const e = pruefeQuran(n); if (e) f.push(e); }
    else if (n.quelle === 'sunna') {
      if (!skelett(n.beleg).includes(ohneAl(skelett(n.ar)))) f.push(`N4 ${n.nr} ${n.um}: der Hadithtext enthält den Namen nicht`);
    } else f.push(`N2 ${n.nr}: unbekannte quelle ${n.quelle}`);
    for (const nr of n.dua || []) {
      const d = duas.find(x => x.nr === nr);
      if (!d) { f.push(`N5 ${n.nr}: Dua ${nr} gibt es nicht`); continue; }
      const t = skelett(d.texte.map(x => x.arabisch).join(' '));
      const st = n.ar === 'اللَّهُ' ? 'لله' : ohneAl(skelett(n.ar));
      if (!t.includes(st)) f.push(`N5 ${n.nr} ${n.um}: Dua ${nr} enthält den Namen nicht`);
    }
  }
  return f;
}

function pruefeSaetze(saetze, liste, duas){
  const f = [];
  for (const [nr, x] of Object.entries(saetze)) {
    const n = liste.namen.find(y => String(y.nr) === nr);
    if (!n) { f.push(`N6 ${nr}: keinen Namen mit dieser Nummer`); continue; }
    const zitat = String(x.ar || '');
    if (!zitat || zitat !== zitat.normalize('NFC') || !x.de) { f.push(`N6 ${nr}: Zitat leer, nicht NFC oder ohne Deutsch`); continue; }
    let quelle;
    if (x.dua) {
      const d = duas.find(y => y.nr === x.dua);
      if (!d) { f.push(`N6 ${nr}: Dua ${x.dua} gibt es nicht`); continue; }
      quelle = d.texte.map(y => String(y.arabisch || '').normalize('NFC')).join(' ');
    } else {
      const [s, v] = String(x.ayah || '').split(':').map(Number);
      quelle = versText(s, v);
      if (!quelle) { f.push(`N6 ${nr}: Vers ${x.ayah} gibt es nicht`); continue; }
      if (!imBereich(s, v)) f.push(`N6 ${nr}: Vers ${x.ayah} liegt nicht in seinem auswendigen Bereich`);
      quelle = quelle.normalize('NFC');
    }
    if (!quelle.includes(zitat)) f.push(`N6 ${nr} ${n.um}: das Zitat steht nicht wörtlich in ${x.dua ? 'Dua ' + x.dua : x.ayah}`);
    const wort = zitat.split(/\s+/)[Number(x.w) - 1] || '';
    const st = n.ar === 'اللَّهُ' ? 'لله' : ohneAl(skelett(n.ar));
    const ws = skelett(wort);
    /* Endung frei: ein Name auf ـِي (aš-Šāfī) oder mit Tā marbūṭa darf im Zitat anders enden. */
    if (!ws.includes(st) && !ws.includes(st.replace(/[يه]$/, ''))) f.push(`N6 ${nr} ${n.um}: Wort ${x.w} des Zitats (${wort}) ist nicht der Name`);
  }
  return f;
}

const fehler = pruefe(LISTE, DUAS).concat(pruefeSaetze(SAETZE, LISTE, DUAS));

const kopie = () => JSON.parse(JSON.stringify(LISTE));
const stoer = [];
{ const l = kopie(); l.namen[30].ar = 'الرَّحَيمُ'; stoer.push(['Vokal vertauscht', pruefe(l, DUAS).some(e => e.startsWith('N3 31'))]); }
{ const l = kopie(); l.namen[12].beleg = '1:1'; stoer.push(['falscher Vers', pruefe(l, DUAS).some(e => e.startsWith('N3 13'))]); }
{ const l = kopie(); l.namen[81].beleg = 'Muslim 1: إِنَّ اللَّهَ رَفِيقٌ'; stoer.push(['Hadith ohne Namen', pruefe(l, DUAS).some(e => e.startsWith('N4 82'))]); }
{ const l = kopie(); l.namen[89].dua = [1]; stoer.push(['Dua ohne Namen', pruefe(l, DUAS).some(e => e.startsWith('N5 90'))]); }
{ const s2 = JSON.parse(JSON.stringify(SAETZE)); const k = Object.keys(s2)[0]; s2[k].ar = s2[k].ar.replace(/َ/, 'ُ'); stoer.push(['Satz mit geänderter Ḥaraka', pruefeSaetze(s2, LISTE, DUAS).some(e => e.startsWith('N6 ' + k + ' '))]); }
{ const s2 = JSON.parse(JSON.stringify(SAETZE)); const k = Object.keys(s2)[0]; s2[k].w = 1; stoer.push(['Satz mit falschem Wort', pruefeSaetze(s2, LISTE, DUAS).some(e => e.startsWith('N6 ' + k + ' ') && e.includes('Wort'))]); }
{ const s2 = { '13': { ayah: '2:1', ar: 'الم', w: 1, de: 'x' } }; stoer.push(['Vers außerhalb seines Bereichs', pruefeSaetze(s2, LISTE, DUAS).some(e => e.includes('nicht in seinem auswendigen'))]); }
for (const [name, rot] of stoer) if (!rot) fehler.push(`Störtest „${name}" blieb grün`);

if (fehler.length) { for (const e of fehler) console.log('  ✗ ' + e); console.log(`  ${fehler.length} Befund(e).`); process.exit(1); }
const q = LISTE.namen.filter(n => n.quelle === 'quran').length;
console.log(`  ✓ Namen Allahs: 99 (${q} Koran, ${99 - q} Sunna), jeder Koran-Name in seinem Vers mit denselben Vokalen, ${Object.keys(SAETZE).length} Beispielsätze wörtlich belegt, ${stoer.length} Störtests rot`);
