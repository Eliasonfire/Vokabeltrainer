/* test-richtung-nach-box.mjs — die Lernrichtung „Nach Box"
 *
 *   node test-richtung-nach-box.mjs
 *
 * ⛔ DER SATZ, DEN DIESER TEST BEWACHT — Elias am 11.09.2026 abends:
 *
 *   „was hälst du dann davon wenn wir die ersten zwei boxen nur auf arabisch
 *    anzeigen lassen und ab box 3 wieder gemischt machen? wenn ich so doch
 *    besser lernen sollte" — und dann: „arbeite erstmal daran"
 *
 * und seine Auflage vom 07.09.2026: „option für gemischt soll trotzdem in
 * einstellungen bleiben".
 *
 * ⛔ cardDirection() wird aus js/lernen.js GESCHNITTEN, nicht nachgebaut.
 * [[testvorlage_selbst_nachgebaut]] Der Zufall wird mit je 400 Ziehungen
 * geprüft: dass eine gemischte Box 400-mal dieselbe Richtung zieht, hat die
 * Wahrscheinlichkeit 2 hoch −399.
 *
 * Störtests am echten Quelltext — jeder MUSS rot werden:
 *   1. Box 2 würfelt schon (Grenze um eins verrutscht)
 *   2. Box 3 fragt noch nur Arabisch (Grenze auf 3)
 *   3. „Gemischt" fragt bei Box 1–2 auch nur Arabisch
 *   4. „Nach Box" fällt aus dem Würfelzweig und liefert „box" als Richtung
 *   5. die Wahl „Gemischt" fehlt in den Einstellungen
 *   6. die Richtung wird je Aufruf neu gewürfelt statt je Karte festgelegt
 *
 * Exit 0 = hält · 1 = Befund oder wirkungsloser Störtest
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const REPO = path.dirname(fileURLToPath(import.meta.url));
const lies = f => fs.readFileSync(path.join(REPO, f), 'utf8');

function schneide(quelle, name){
  const start = quelle.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('js/lernen.js: ' + name + '() nicht gefunden');
  let tiefe = 0, i = quelle.indexOf('{', start);
  for (; i < quelle.length; i++){
    if (quelle[i] === '{') tiefe++;
    else if (quelle[i] === '}'){ tiefe--; if (!tiefe) break; }
  }
  if (tiefe) throw new Error('js/lernen.js: Klammern von ' + name + '() gehen nicht auf');
  return quelle.slice(start, i + 1);
}

function befunde(lernen, html){
  const f = [];
  const konst = (lernen.match(/^const RICHTUNG_NUR_ARABISCH_BIS_BOX = [^\n]*$/m) || [])[0];
  if (!konst) return ['RICHTUNG_NUR_ARABISCH_BIS_BOX steht nicht mehr in js/lernen.js'];
  let fn;
  try { fn = schneide(lernen, 'cardDirection'); } catch (e){ return [e.message]; }

  const welt = { Math, SETTINGS: {}, SESSION: { words: [], dirs: [] }, PROGRESS: {} };
  vm.createContext(welt);
  try { vm.runInContext(konst + '\n' + fn, welt); } catch (e){ return ['cardDirection() läuft nicht: ' + e.message]; }
  if (typeof welt.cardDirection !== 'function') return ['cardDirection() fehlt nach dem Laden'];

  /* Eine frische Karte je Ziehung — SESSION.dirs leer, wie beim Rundenstart. */
  const ziehe = (wahl, box) => {
    const z = { 'ar-de': 0, 'de-ar': 0, anderes: 0 };
    welt.SETTINGS = { direction: wahl };
    welt.PROGRESS = (box === undefined) ? {} : { w1: { box } };
    for (let i = 0; i < 400; i++){
      welt.SESSION = { words: [{ id: 'w1' }], dirs: [] };
      const r = welt.cardDirection(0);
      if (r === 'ar-de' || r === 'de-ar') z[r]++; else z.anderes++;
    }
    return z;
  };
  const text = z => `ar-de ${z['ar-de']} · de-ar ${z['de-ar']}` + (z.anderes ? ` · anderes ${z.anderes}` : '');

  /* 1. „die ersten zwei boxen nur auf arabisch" */
  for (const [name, box] of [['ein neues Wort', undefined], ['Box 1', 1], ['Box 2', 2]]){
    const z = ziehe('box', box);
    if (z['ar-de'] !== 400) f.push(`„Nach Box", ${name}: nicht nur Arabisch → Deutsch (${text(z)}) — „die ersten zwei boxen nur auf arabisch"`);
  }
  /* 2. „ab box 3 wieder gemischt" */
  for (const box of [3, 4, 5]){
    const z = ziehe('box', box);
    if (!z['ar-de'] || !z['de-ar'] || z.anderes) f.push(`„Nach Box", Box ${box}: nicht gemischt (${text(z)}) — „ab box 3 wieder gemischt"`);
  }
  /* 3. „option für gemischt soll trotzdem … bleiben" — und würfelt bei jeder Box */
  for (const box of [undefined, 1, 5]){
    const z = ziehe('mixed', box);
    if (!z['ar-de'] || !z['de-ar'] || z.anderes) f.push(`„Gemischt", ${box === undefined ? 'neues Wort' : 'Box ' + box}: würfelt nicht mehr (${text(z)})`);
  }
  const auswahl = (html.match(/<select id="directionSelect"[\s\S]*?<\/select>/) || [''])[0];
  if (!/<option value="mixed">/.test(auswahl)) f.push('in den Einstellungen fehlt die Wahl „Gemischt" — „option für gemischt soll trotzdem in einstellungen bleiben"');
  if (!/<option value="box">/.test(auswahl)) f.push('in den Einstellungen fehlt die Wahl „Nach Box"');

  /* 4. Die festen Richtungen bleiben fest */
  if (ziehe('ar-de', 5)['ar-de'] !== 400) f.push('„Arabisch → Deutsch" ist nicht mehr fest');
  if (ziehe('de-ar', 1)['de-ar'] !== 400) f.push('„Deutsch → Arabisch" ist nicht mehr fest');

  /* 5. Je Karte EINMAL: die Bewertung darf die Richtung der laufenden Karte
     nicht mehr drehen. */
  let gedreht = 0;
  for (let i = 0; i < 200; i++){
    welt.SETTINGS = { direction: 'box' };
    welt.PROGRESS = { w1: { box: 3 } };
    welt.SESSION = { words: [{ id: 'w1' }], dirs: [] };
    const vorher = welt.cardDirection(0);
    welt.PROGRESS.w1.box = (vorher === 'de-ar') ? 1 : 5;   // die Bewertung verschiebt die Box
    for (let k = 0; k < 5; k++) if (welt.cardDirection(0) !== vorher) { gedreht++; break; }
  }
  if (gedreht) f.push(`bei ${gedreht} von 200 Karten wechselte die Richtung, nachdem sich die Box verschoben hatte — Vorderseite und Antwortprüfung sprächen dann verschiedene Sprachen`);
  return f;
}

let fehler = 0;
const ok = t => console.log('  ✔ ' + t);
const rot = t => { fehler++; console.log('  ✘ ' + t); };

const ECHT = { lernen: lies('js/lernen.js'), html: lies('index.html') };

console.log('\n„Nach Box" — Elias, 11.09.2026 abends');
const echt = befunde(ECHT.lernen, ECHT.html);
if (echt.length) echt.forEach(rot);
else ok('Box 1–2 und neue Wörter nur Arabisch → Deutsch · ab Box 3 gemischt · „Gemischt" würfelt bei jeder Box · feste Richtungen fest · je Karte eine Richtung');

console.log('\nStörtests — jeder muss rot werden');
const STOER = [
  ['Box 2 würfelt schon', 'lernen', 'box <= RICHTUNG_NUR_ARABISCH_BIS_BOX', 'box < RICHTUNG_NUR_ARABISCH_BIS_BOX'],
  ['Box 3 fragt noch nur Arabisch', 'lernen', 'const RICHTUNG_NUR_ARABISCH_BIS_BOX = 2;', 'const RICHTUNG_NUR_ARABISCH_BIS_BOX = 3;'],
  ['„Gemischt" fragt bei Box 1–2 nur Arabisch', 'lernen', "(wahl === 'box' && box <= ", '(box <= '],
  ['„Nach Box" fällt aus dem Würfelzweig', 'lernen', "if (wahl === 'mixed' || wahl === 'box'){", "if (wahl === 'mixed'){"],
  ['die Wahl „Gemischt" fehlt', 'html', '<option value="mixed">Gemischt (zufällig)</option>', ''],
  ['die Richtung wird je Aufruf neu gewürfelt', 'lernen', 'if (SESSION.dirs[idx] === undefined){', 'if (true){'],
];
for (const [name, datei, alt, neu] of STOER){
  const n = ECHT[datei].split(alt).length - 1;
  if (n !== 1){ rot(`Störtest „${name}": die Stelle steht ${n}× im Quelltext statt einmal — er greift nicht`); continue; }
  const probe = { ...ECHT, [datei]: ECHT[datei].replace(alt, () => neu) };
  const b = befunde(probe.lernen, probe.html);
  if (b.length) ok(`Störtest „${name}" → rot: ${b[0]}`);
  else rot(`Störtest „${name}" blieb grün — diesen Rückfall sähe der Test nicht`);
}

console.log('');
if (fehler){ console.log('✘ ' + fehler + ' Befund(e).'); process.exit(1); }
console.log('✔ „Nach Box" hält: die ersten zwei Boxen nur Arabisch, ab Box 3 gemischt — und „Gemischt" bleibt.');
