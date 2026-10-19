#!/usr/bin/env node
/* test-koran-platz.mjs — der Koran-Platz in der Lerngruppe (19.10.2026).
 * =====================================================================
 *
 * Elias: „ich möchte übrigens einen slot in meinen 15 vokabeln für die
 * häufigsten koranwörter haben damit ich immer stück für stück neue
 * koranwörter lerne." Gebaut in lerngruppeHeute() (js/kern.js), Begründung dort.
 *
 * Geprüft mit den ECHTEN Funktionen aus js/kern.js (wie test-tagesdeckel.mjs),
 * Deckel 15 → 5 Box-1-Plätze, Gruppe 10:
 *   K1  leere Gruppe: das häufigste Koranwort tritt bei, die übrigen Plätze
 *       gehen an den Unterricht — und nur EIN Koranwort am Tag
 *   K2  heute ist schon ein Koranwort fällig → kein weiteres
 *   K3  zwei Koranwörter in der Gruppe → kein drittes
 *   K4  eines in der Gruppe (nicht fällig) → das nächste nach Rang tritt bei
 *   K5  volle Gruppe → niemand wird verdrängt, kein Koranwort
 *   K6  nur zählen (kein Beitritt) → kein Koranwort
 *   K7  ohne Koranwörter: dieselbe Runde wie ohne den Koran-Platz
 * Danach vier Störtests, jeder muss rot werden.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const QUELLE = fs.readFileSync(path.join(HIER, 'js', 'kern.js'), 'utf8');

/* Klammerbilanz statt Regex — dieselbe Schneide wie in test-tagesdeckel.mjs. */
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
const NAMEN = ['nieAbgefragt', 'neueZuerst', 'tageZwischen', 'verspaetung', 'istGruppenwort', 'lerngruppeHeute', 'tagesAuswahl'];
const mAnteil = QUELLE.match(/const DECKEL_ANTEIL_BOX1\s*=\s*([\d.]+(?:\s*\/\s*[\d.]+)?)\s*;/);
const mIntervalle = QUELLE.match(/const INTERVALS = (\{[^}]+\})/);

const HEUTE = '2026-10-19';
function lauf(quelle){
  const teile = NAMEN.map(n => schneide(quelle, n));
  if (teile.some(t => !t) || !mAnteil || !mIntervalle) return null;
  const k = { PROGRESS: {}, Array, Math, Number, Object, String, Set, Date, isNaN, console, todayStr: () => HEUTE };
  vm.createContext(k);
  vm.runInContext('const INTERVALS = ' + mIntervalle[1] + ';\nconst DECKEL_ANTEIL_BOX1 = ' + mAnteil[1] + ';\n'
    + teile.join('\n') + '\n;globalThis.__ = tagesAuswahl;', k);
  return k;
}

/* Ein Bestand: Unterrichtswörter n0…n6 (neu, die jüngsten zuerst), Koranwörter
   k1…k4 (neu, Rang 1…4), 20 Wiederholungen in Box 4. */
function szenen(c){
  const setze = (id, p, extra) => { c.PROGRESS[id] = Object.assign({ box: 1, nextReview: HEUTE, correct: 0, wrong: 0 }, p); return Object.assign({ id }, extra || {}); };
  const lage = () => {
    c.PROGRESS = {};
    return {
      nw: Array.from({ length: 7 }, (_, i) => setze('n' + i, { nextReview: '2026-10-1' + i })),
      kw: [1, 2, 3, 4].map(r => setze('k' + r, { nextReview: '2026-10-11' }, { book: 'koran-haeufig', koranRang: r })),
      wd: Array.from({ length: 20 }, (_, i) => setze('w' + i, { box: 4, correct: 2 })),
    };
  };
  const ids = l => l.map(w => w.id);
  const zahl = (l, pre) => ids(l).filter(x => x.startsWith(pre)).length;
  const r = {};
  /* K1: leere Gruppe, Runde fürs Tagesziel */
  let L = lage();
  const a = c.__(L.nw.concat(L.kw, L.wd), 15, [], []);
  r.K1 = { ok: ids(a).includes('k1') && zahl(a, 'k') === 1 && zahl(a, 'n') === 4 && a.length === 15, zeig: ids(a) };
  /* K2: ein Koranwort ist heute fällig (Mitglied), dazu zwei fällige Unterrichtswörter */
  L = lage();
  const K0 = setze('K0', { gruppe: '2026-10-17', gruppeArt: 'neu', wrong: 1, nextReview: '2026-10-19' }, { book: 'koran-haeufig', koranRang: 9 });
  const m12 = [1, 2].map(i => setze('m' + i, { gruppe: '2026-10-17', gruppeArt: 'neu', wrong: 1, nextReview: '2026-10-19' }));
  const b = c.__([K0].concat(m12, L.nw, L.kw, L.wd), 15, [], [K0].concat(m12));
  r.K2 = { ok: ids(b).includes('K0') && !ids(b).some(x => /^k\d/.test(x)) && zahl(b, 'n') === 2, zeig: ids(b) };
  /* K3: zwei Koranwörter in der Gruppe, beide nicht fällig; drei Unterrichtswörter fällig */
  L = lage();
  const KK = ['KA', 'KB'].map(id => setze(id, { gruppe: '2026-10-18', gruppeArt: 'neu', wrong: 1, nextReview: '2026-10-20' }, { book: 'koran-haeufig', koranRang: 8 }));
  const m3 = [1, 2, 3].map(i => setze('m' + i, { gruppe: '2026-10-17', gruppeArt: 'neu', wrong: 1, nextReview: '2026-10-19' }));
  const cc = c.__(m3.concat(L.nw, L.kw, L.wd), 15, [], m3.concat(KK));
  r.K3 = { ok: !ids(cc).some(x => /^k\d/.test(x)) && zahl(cc, 'n') === 2, zeig: ids(cc) };
  /* K4: ein Koranwort in der Gruppe, nicht fällig → das nächste nach Rang (k1) tritt bei */
  L = lage();
  const K1 = setze('KA', { gruppe: '2026-10-18', gruppeArt: 'neu', wrong: 1, nextReview: '2026-10-20' }, { book: 'koran-haeufig', koranRang: 8 });
  const m3b = [1, 2, 3].map(i => setze('m' + i, { gruppe: '2026-10-17', gruppeArt: 'neu', wrong: 1, nextReview: '2026-10-19' }));
  const d = c.__(m3b.concat(L.nw, L.kw, L.wd), 15, [], m3b.concat([K1]));
  r.K4 = { ok: ids(d).includes('k1') && !ids(d).includes('k2') && zahl(d, 'n') === 1, zeig: ids(d) };
  /* K5: volle Gruppe (10), fünf fällig → kein Beitritt, kein Koranwort */
  L = lage();
  const voll = Array.from({ length: 10 }, (_, i) => setze('m' + i, { gruppe: '2026-10-17', gruppeArt: i < 7 ? 'neu' : 'frueher', wrong: 1, nextReview: i < 5 ? '2026-10-19' : '2026-10-20' }));
  const e = c.__(voll.slice(0, 5).concat(L.nw, L.kw, L.wd), 15, [], voll);
  r.K5 = { ok: !ids(e).some(x => /^k\d/.test(x)) && zahl(e, 'm') === 5 && zahl(e, 'n') === 0, zeig: ids(e) };
  /* K6: nur zählen (ohne Vorrat): niemand tritt bei */
  L = lage();
  const f = c.__(L.nw.concat(L.kw, L.wd), 15, undefined, []);
  r.K6 = { ok: !ids(f).some(x => /^[kn]\d/.test(x)), zeig: ids(f) };
  /* K7: ohne Koranwörter — vergleicht der Aufrufer mit der Fassung ohne Koran-Platz */
  L = lage();
  const g1 = c.__(L.nw.concat(L.wd), 15, [], []);
  const m2 = [1, 2].map(i => setze('m' + i, { gruppe: '2026-10-17', gruppeArt: 'neu', wrong: 1, nextReview: '2026-10-19' }));
  const g2 = c.__(m2.concat(L.nw, L.wd), 15, [], m2);
  r.K7 = { runde: JSON.stringify([ids(g1), ids(g2)]) };
  return r;
}

const ALT_KORAN = '    if (!faellig.some(koranwort) && mitglieder.filter(koranwort).length < KORAN_PLAETZE){\n      const k = neuW.find(koranwort);\n      if (k) neuW = [k].concat(neuW.filter(w => w !== k));\n    }\n';
function befundeVon(quelle){
  const c = lauf(quelle);
  if (!c) return { befunde: ['K0: Funktionen oder Konstanten nicht mehr in js/kern.js'], r: {} };
  const r = szenen(c);
  const ohne = quelle.includes(ALT_KORAN) ? lauf(quelle.replace(ALT_KORAN, '')) : null;
  const befunde = [];
  for (const k of ['K1', 'K2', 'K3', 'K4', 'K5', 'K6']) if (!r[k].ok) befunde.push(`${k}: ${JSON.stringify(r[k].zeig)}`);
  if (!ohne) befunde.push('K7: der Koran-Platz steht nicht mehr in der erwarteten Form in lerngruppeHeute()');
  else if (szenen(ohne).K7.runde !== r.K7.runde) befunde.push('K7: ohne Koranwörter ändert sich die Runde');
  return { befunde, r };
}

let schlecht = 0;
const echt = befundeVon(QUELLE);
console.log('test-koran-platz — ein Platz für die häufigsten Koranwörter (Elias, 19.10.2026)');
console.log('  K1 Runde bei leerer Gruppe: ' + JSON.stringify(echt.r.K1 && echt.r.K1.zeig.filter(x => !/^w/.test(x))));
if (echt.befunde.length) { schlecht++; for (const b of echt.befunde) console.log('  ⛔ ' + b); }
else console.log('  ✅ K1–K7 grün');

const STOER = [
  ['ohne Koran-Platz (sein „Unterricht zuerst" vom 11.10.)', ALT_KORAN, '', /^K1:/],
  ['beliebig viele Koranwörter in der Gruppe', '  const KORAN_PLAETZE = 2;', '  const KORAN_PLAETZE = 99;', /^K3:/],
  ['auch wenn heute schon eines fällig ist', '    if (!faellig.some(koranwort) && mitglieder', '    if (mitglieder', /^K2:/],
  ['alle Koranwörter nach vorn statt eines', '      if (k) neuW = [k].concat(neuW.filter(w => w !== k));', '      if (k) neuW = neuW.filter(koranwort).concat(neuW.filter(w => !koranwort(w)));', /^K1:/],
];
console.log('\nStörtests (jeder muss rot werden):');
for (const [name, alt, neu, erwartet] of STOER){
  const n = QUELLE.split(alt).length - 1;
  if (n !== 1){ schlecht++; console.log(`  ⛔ „${name}": die Stelle steht ${n}-mal in js/kern.js statt genau einmal`); continue; }
  const r = befundeVon(QUELLE.replace(alt, neu));
  const treffer = r.befunde.find(b => erwartet.test(b));
  if (treffer) console.log(`  ✔ ${name} → rot (${treffer.split(':')[0]})`);
  else { schlecht++; console.log(`  ⛔ ${name} → blieb ${r.befunde.length ? 'rot, aber ohne ' + erwartet : 'GRÜN'}`); }
}
console.log('\n' + (schlecht ? '⛔ test-koran-platz: ' + schlecht + ' Befund(e).' : '✅ test-koran-platz: grün, alle 4 Störtests rot geworden.'));
process.exit(schlecht ? 1 : 0);
