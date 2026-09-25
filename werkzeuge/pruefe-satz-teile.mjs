#!/usr/bin/env node
/* pruefe-satz-teile.mjs — der Satzmodus in zwei Teilen (v606, 25.09.2026)
 * ==========================================================================
 * Elias, wörtlich: „also tag 1 satz teil 1, tag 2 hören, tag 3 satz teil 2 und
 * dann wieder hören. es muss aber klappen, dass es nicht random ist weil sonst
 * gehen einige modis unter und andere sind viel mehr. und dann auch
 * dementsprechend das tagesziel darauf auslegen wie viel es ist um genau die
 * hälte zu machen … und ich möchte das beide teile ungefähr gleich
 * zeitaufwändig sind deswegen guck welche modis man in welches teil packt".
 *
 * Prüft an den ECHTEN Funktionen aus js/uebung.js und js/kern.js:
 *   1. jede Übung steht in genau einem Teil — auch eine neue,
 *   2. die Teile sind gleich lang (Unterschied höchstens eine Übung),
 *   3. der Wechsel ist fest: 1, 2, 1, … je Satz-Tag, am selben Tag bleibt er,
 *   4. das Tagesziel ist genau ein Teil (seine Einstellung anteilig),
 *   5. gemessene Zeiten schlagen die Schätzung,
 *   6. „Gemischt", der Ring auf der Startseite und die Feier nehmen den Teil.
 * Zwei Störtests: ohne Ausgleich und ohne Wechsel muss er rot werden.
 * Exit 0 = alles richtig · 1 = Befund.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lies = f => fs.readFileSync(path.join(REPO, f), 'utf8').replace(/\r\n/g, '\n');
const ueb = lies('js/uebung.js'), kern = lies('js/kern.js'), start = lies('js/start.js'), feier = lies('js/feier.js');

let fehler = 0;
const pruefe = (was, ok, ist) => { if (!ok) fehler++; console.log('  ' + (ok ? 'ok ' : 'X  ') + was + (ok ? '' : '   ist: ' + ist)); };

function schneide(text, name){
  const a = text.indexOf('function ' + name + '(');
  if (a < 0) return null;
  let i = text.indexOf('{', a), t = 0;
  for (; i < text.length; i++){ if (text[i] === '{') t++; else if (text[i] === '}' && !--t) return text.slice(a, i + 1); }
  return null;
}
const UEBUNGEN = [...ueb.matchAll(/^ {4}id:'([a-z0-9-]+)', nr:(\d+), name:'[^']*', art:'([a-z]+)'/gm)]
  .map(m => ({ id: m[1], nr: Number(m[2]), art: m[3] }));
const mSchaetzung = ueb.match(/const UEB_ZEIT_SCHAETZUNG = (\{[^}]+\});/);
const mVorgabe = ueb.match(/const SATZ_ZIEL_VORGABE = (\d+);/);
const teileUeb = ['satzTeile', 'satzTeilHeute', 'satzTageszielHeute', 'satzTagesziel', 'satzTeilAuswahl'].map(n => [n, schneide(ueb, n)]);
const teileKern = [['uebZeitGemessen', schneide(kern, 'uebZeitGemessen')]];
const fehlt = teileUeb.concat(teileKern).filter(([, t]) => !t).map(([n]) => n);
if (fehlt.length || !mSchaetzung || !mVorgabe || UEBUNGEN.length < 10){
  console.log('X  Quelltext nicht gefunden: ' + fehlt.concat(!mSchaetzung ? ['UEB_ZEIT_SCHAETZUNG'] : [], !mVorgabe ? ['SATZ_ZIEL_VORGABE'] : [],
    UEBUNGEN.length < 10 ? ['UEBUNGEN (' + UEBUNGEN.length + ')'] : []).join(', '));
  process.exit(1);
}
const code = teileKern.concat(teileUeb).map(([, t]) => t).join('\n');

function kontext(quelltext, uebungen){
  const k = { UEBUNGEN: uebungen.map(u => ({ ...u })), QUOTE_TAGE: {}, SETTINGS: {}, heute: '2026-09-25', gespeichert: 0,
              Object, Math, Number, Set, String };
  k.todayStr = (o) => { const d = new Date(k.heute + 'T12:00:00'); d.setDate(d.getDate() + (o || 0)); return d.toISOString().slice(0, 10); };
  k.saveSettings = () => { k.gespeichert++; };
  vm.createContext(k);
  vm.runInContext('const UEB_ZEIT_SCHAETZUNG = ' + mSchaetzung[1] + ';\nconst SATZ_ZIEL_VORGABE = ' + mVorgabe[1] + ';\n' + quelltext, k);
  return k;
}

console.log('pruefe-satz-teile.mjs — Satzmodus in zwei Teilen (' + UEBUNGEN.length + ' Übungen)\n');

/* 1 + 2: Aufteilung */
const c = kontext(code, UEBUNGEN);
const t = vm.runInContext('satzTeile()', c);
const alle = t[1].concat(t[2]);
pruefe('jede Übung in genau einem Teil', alle.length === UEBUNGEN.length && new Set(alle).size === UEBUNGEN.length
  && UEBUNGEN.every(u => alle.includes(u.id)), JSON.stringify({ 1: t[1], 2: t[2] }));
const groesste = Math.max(...Object.values(t.zeit));
pruefe(`gleich lang: Teil 1 ${Math.round(t.summe[1])} s, Teil 2 ${Math.round(t.summe[2])} s je Runde (Unterschied höchstens eine Übung, ${Math.round(groesste)} s)`,
  Math.abs(t.summe[1] - t.summe[2]) <= groesste, Math.abs(t.summe[1] - t.summe[2]));
console.log('     Teil 1: ' + t[1].join(', '));
console.log('     Teil 2: ' + t[2].join(', '));
const neu = kontext(code, UEBUNGEN.concat([{ id: 'neue-uebung', nr: 99, art: 'wahl' }]));
const tn = vm.runInContext('satzTeile()', neu);
pruefe('eine neue Übung kommt in einen Teil, und die Teile bleiben gleich lang',
  tn[1].concat(tn[2]).includes('neue-uebung') && Math.abs(tn.summe[1] - tn.summe[2]) <= Math.max(...Object.values(tn.zeit)),
  JSON.stringify(tn.summe));

/* 3: fester Wechsel */
const w = kontext(code, UEBUNGEN);
const folge = [];
for (const [tag, speichern] of [['2026-09-25', true], ['2026-09-25', true], ['2026-09-27', false], ['2026-09-27', true], ['2026-09-29', true], ['2026-10-02', true]]){
  w.heute = tag; folge.push(vm.runInContext(`satzTeilHeute(${speichern})`, w));
}
pruefe('Wechsel 1 → (gleicher Tag) 1 → Anzeige 2 → 2 → 1 → 2', JSON.stringify(folge) === '[1,1,2,2,1,2]', JSON.stringify(folge));
pruefe('der Teil wird mit den Einstellungen gespeichert (abgeglichen)', w.gespeichert >= 4 && w.SETTINGS.satzTeil && w.SETTINGS.satzTeil.tag === '2026-10-02', JSON.stringify(w.SETTINGS));

/* 4: Tagesziel = ein Teil */
const z = kontext(code, UEBUNGEN);
z.SETTINGS = { satzZiel: 15 };
const zt = vm.runInContext('satzTeile()', z), zTeil = vm.runInContext('satzTeilHeute(false)', z);
const soll15 = Math.max(1, Math.round(15 * zt[zTeil].length / UEBUNGEN.length));
pruefe(`Tagesziel bei Einstellung 15: ${soll15} (Teil ${zTeil} mit ${zt[zTeil].length} Übungen)`, vm.runInContext('satzTageszielHeute()', z) === soll15, vm.runInContext('satzTageszielHeute()', z));
z.SETTINGS = { satzZiel: 30 };
pruefe('bei 30: doppelt so viel', vm.runInContext('satzTageszielHeute()', z) === Math.max(1, Math.round(30 * zt[zTeil].length / UEBUNGEN.length)), vm.runInContext('satzTageszielHeute()', z));
pruefe('seine Einstellung selbst bleibt (satzTagesziel() = 30)', vm.runInContext('satzTagesziel()', z) === 30, vm.runInContext('satzTagesziel()', z));

/* 5: Messung schlägt Schätzung */
const m = kontext(code, UEBUNGEN);
m.QUOTE_TAGE = { '2026-09-20': { zn_uebersetzen: 12, zs_uebersetzen: 240 } };
const tm = vm.runInContext('satzTeile()', m);
pruefe('gemessen 12 Antworten à 20 s ersetzen die Schätzung', tm.zeit.uebersetzen === 20 && tm.quelle.uebersetzen === 'gemessen', JSON.stringify([tm.zeit.uebersetzen, tm.quelle.uebersetzen]));
m.QUOTE_TAGE = { '2026-09-20': { zn_uebersetzen: 5, zs_uebersetzen: 100 } };
pruefe('unter 10 Antworten gilt die Schätzung', vm.runInContext('satzTeile()', m).quelle.uebersetzen === 'geschaetzt', '');

/* 6: die Aufrufer */
pruefe('„Gemischt" zieht nur den heutigen Teil', /uebungGemischteListe\(satzTeilAuswahl\(alle\)\)/.test(ueb), '');
pruefe('die Standzeile, der Ring im Satzmodus und die Satz-Feier nehmen das Ziel des Teils',
  (ueb.match(/satzTageszielHeute\(\)/g) || []).length >= 5, (ueb.match(/satzTageszielHeute\(\)/g) || []).length);
pruefe('die Startseite zeigt „Satz 1/2" mit dem Ziel des Teils', /'Satz ' \+ satzTeilHeute\(false\)/.test(start) && /satzTageszielHeute\(\)/.test(start), '');
pruefe('die Tagesziel-Feier nimmt das Ziel des Teils', /satzTageszielHeute\(\)/.test(feier), '');

/* Störtests */
const ohneAusgleich = code.replace('const t = summe[1] < summe[2] ? 1 : summe[2] < summe[1] ? 2 : (teil[1].length <= teil[2].length ? 1 : 2);', 'const t = 1;');
const s1 = vm.runInContext('satzTeile()', kontext(ohneAusgleich, UEBUNGEN));
pruefe('STÖRTEST — ohne Ausgleich wären die Teile ungleich', ohneAusgleich !== code && Math.abs(s1.summe[1] - s1.summe[2]) > Math.max(...Object.values(s1.zeit)), JSON.stringify(s1.summe));
const ohneWechsel = code.replace('const teil = (st && st.teil === 1) ? 2 : 1;', 'const teil = 1;');
const s2 = kontext(ohneWechsel, UEBUNGEN);
const f2 = [];
for (const tag of ['2026-09-25', '2026-09-27', '2026-09-29']){ s2.heute = tag; f2.push(vm.runInContext('satzTeilHeute(true)', s2)); }
pruefe('STÖRTEST — ohne Wechsel käme immer Teil 1', ohneWechsel !== code && JSON.stringify(f2) === '[1,1,1]', JSON.stringify(f2));

console.log('\n' + (fehler ? `X  ${fehler} Befund(e)` : '✅ Satzmodus in zwei Teilen: alles richtig'));
process.exit(fehler ? 1 : 0);
