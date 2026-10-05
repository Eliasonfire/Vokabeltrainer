#!/usr/bin/env node
/* test-abgelehnt-tor.mjs — bewacht die Vorprüfung der täglichen Routine
 * „abgelehnte Eselsbrücken ersetzen" (werkzeuge/vorschlaege-holen.mjs --tor / --auftrag).
 *
 * Elias, 05.10.2026: „da jetzt immer die gleichen wörter meistens da sind denke ich es
 * ist jetzt wichtig, dass eine routine sich täglich drum kümmert das die eselsbrücken
 * die ich für untauglich gemacht habe direkt ersetzt werden".
 *
 * Die Vorprüfung entscheidet, ob die Routine überhaupt startet. Sagt sie fälschlich
 * „nichts zu tun", bleibt seine Ablehnung liegen, und nichts meldet sich. Deshalb:
 *   T1  Ein abgelehnter Text, der HEUTE noch dasteht, gibt einen Auftrag (Exit 0) —
 *       an allen vier Stellen, an denen ein Text stehen kann: mnemo eines eigenen
 *       Wortes, Alternative eines eigenen Wortes, Alternative eines BUCHWORTES, erste
 *       Stelle eines Buchwortes. (Die lange Liste des Werkzeugs kennt Buchwörter nicht;
 *       am 05.10.2026 waren das 8 von 30 Wörtern mit Ablehnungen.)
 *   T2  Abgelehnte Texte, die es nicht mehr gibt, geben KEINEN Auftrag (Exit 3).
 *   T3  Ein Stand ohne Ablehnungen: Exit 3.   T4  Kein JSON: Exit 1.
 *   T5  --auftrag schreibt je Wort: was zu ersetzen ist, was heute dasteht, alles
 *       Abgelehnte. T6  --auftrag ohne Dateinamen: Exit 1.
 *   T7  Der Name hinter --auftrag wird nie als Eingabedatei gelesen, in beiden
 *       Reihenfolgen. T8  Im Repo wird nichts geschrieben (data/abgelehnt.json).
 *   T9  Der gewöhnliche Aufruf nennt dieselbe Zahl („Steht noch da: 4").
 * Störtest S1: eine Fassung des Werkzeugs, die immer „nichts zu tun" sagt — T1 muss
 * durchfallen. Gelesen wird nur aus Dateien im Temp-Ordner, nie aus dem Netz.
 *
 *   node test-abgelehnt-tor.mjs [--alles]
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const WURZEL = path.dirname(fileURLToPath(import.meta.url));
const ALLES = process.argv.includes('--alles');
const WERKZEUG = path.join(WURZEL, 'werkzeuge', 'vorschlaege-holen.mjs');
const lies = f => fs.readFileSync(path.join(WURZEL, f), 'utf8');

/* ---------- Vier Texte, die heute wirklich dastehen ---------- */
const VOCAB = new Function(lies('vocab-data.js') + '; return VOCAB_DATA;')();
const ALT = new Function(lies('data/eselsbruecken-alt.js') + '; return ESELSBRUECKEN_ALT;')();
const buchText = lies('data/eselsbruecken.js');
const BUCH = new Function(buchText + '; return BUCH_ESELSBRUECKEN;')();
let ERSATZ = {};
{ const auf = buchText.indexOf('const ESELSBRUECKEN_ERSATZ'), zu = auf < 0 ? -1 : buchText.indexOf('};', auf);
  if (auf >= 0 && zu > auf) ERSATZ = new Function(buchText.slice(auf, zu + 2) + '\nreturn ESELSBRUECKEN_ERSATZ;')(); }
const eigen = new Set(VOCAB.map(w => String(w.id)));
const lang = t => typeof t === 'string' && t.trim().length >= 70;
const wMnemo = VOCAB.find(w => lang(w.mnemo) && !ERSATZ[String(w.id)]);
const idAltEigen = Object.keys(ALT).find(id => eigen.has(id) && id !== String(wMnemo && wMnemo.id) && (ALT[id] || []).some(lang));
const idAltBuch = Object.keys(ALT).find(id => !eigen.has(id) && (ALT[id] || []).some(lang));
const idBuch = Object.keys(BUCH).find(id => !eigen.has(id) && id !== idAltBuch && lang(BUCH[id]));
const FAELLE = [
  ['mnemo eines eigenen Wortes', wMnemo && String(wMnemo.id), wMnemo && wMnemo.mnemo],
  ['Alternative eines eigenen Wortes', idAltEigen, idAltEigen && ALT[idAltEigen].find(lang)],
  ['Alternative eines Buchwortes', idAltBuch, idAltBuch && ALT[idAltBuch].find(lang)],
  ['erste Stelle eines Buchwortes', idBuch, idBuch && BUCH[idBuch]]
];
const fehlend = FAELLE.filter(f => !f[1] || !f[2]).map(f => f[0]);
if (fehlend.length){ console.log('✘ test-abgelehnt-tor: kein Beispiel gefunden für: ' + fehlend.join(', ')); process.exit(1); }

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tor-test-'));
function stand(name, eintraege){
  const weg = {};
  eintraege.forEach(([id, text], i) => { weg[id] = Object.assign(weg[id] || {}, { [String(i)]: { text: String(text).slice(0, 400), zeit: 1791150000000 + i } }); });
  const p = path.join(tmp, name);
  fs.writeFileSync(p, JSON.stringify({ geaendert: 1791150000000, daten: eintraege.length ? { vt_vorschlagWeg: JSON.stringify(weg) } : {}, stempel: { vt_vorschlagWeg: 1791150000000 } }), 'utf8');
  return p;
}
const S_DA = stand('da.json', FAELLE.map(f => [f[1], f[2]]));
const S_WEG = stand('weg.json', FAELLE.map(f => [f[1], 'Diesen Text gibt es an keinem Wort der App, er dient nur der Gegenprobe im Test. ' + f[1]]));
const S_LEER = stand('leer.json', []);
const S_KAPUTT = path.join(tmp, 'kaputt.json'); fs.writeFileSync(S_KAPUTT, 'das ist kein JSON', 'utf8');

function lauf(werkzeug, args){
  const r = spawnSync(process.execPath, [werkzeug, ...args], { cwd: WURZEL, encoding: 'utf8', timeout: 120000 });
  return { code: r.status, aus: String(r.stdout || '') + String(r.stderr || '') };
}

function pruefe(werkzeug){
  const rot = [];
  const ok = (name, bed, info) => { if (!bed) rot.push(name + (info !== undefined ? '   [gemessen: ' + String(info).replace(/\s+/g, ' ').slice(0, 160) + ']' : '')); };
  const abg = path.join(WURZEL, 'data', 'abgelehnt.json');
  const vorher = fs.existsSync(abg) ? fs.statSync(abg).mtimeMs + ':' + fs.statSync(abg).size : 'fehlt';

  const t1 = lauf(werkzeug, [S_DA, '--tor']);
  ok('T1 abgelehnte Texte stehen noch da → Auftrag (Exit 0)', t1.code === 0, 'Exit ' + t1.code + ' · ' + t1.aus.slice(-200));
  ok('T1b gezählt sind genau vier', /steht noch da: 4 /.test(t1.aus), (t1.aus.match(/steht noch da: \d+/) || ['keine Zeile'])[0]);
  for (const f of FAELLE) ok('T1c genannt: ' + f[0] + ' [' + f[1] + ']', t1.aus.includes('[' + f[1] + ']'), 'fehlt in der Ausgabe');

  const t2 = lauf(werkzeug, [S_WEG, '--tor']);
  ok('T2 abgelehnte Texte, die es nicht mehr gibt → kein Auftrag (Exit 3)', t2.code === 3, 'Exit ' + t2.code + ' · ' + t2.aus.slice(-160));
  const t3 = lauf(werkzeug, [S_LEER, '--tor']);
  ok('T3 Stand ohne Ablehnungen → Exit 3', t3.code === 3, 'Exit ' + t3.code);
  const t4 = lauf(werkzeug, [S_KAPUTT, '--tor']);
  ok('T4 kein JSON → Exit 1 (Frage nicht beantwortet)', t4.code === 1, 'Exit ' + t4.code);

  const ziel = path.join(tmp, 'auftrag-' + path.basename(werkzeug) + '.json');
  const t5 = lauf(werkzeug, [S_DA, '--auftrag', ziel]);
  ok('T5 --auftrag → Exit 0 und Datei', t5.code === 0 && fs.existsSync(ziel), 'Exit ' + t5.code);
  if (fs.existsSync(ziel)){
    let a = null; try { a = JSON.parse(fs.readFileSync(ziel, 'utf8')); } catch (e){ /* unten als Befund */ }
    ok('T5b der Auftrag ist JSON mit vier Wörtern', a && Object.keys(a.woerter || {}).length === 4, a ? Object.keys(a.woerter || {}).length : 'kein JSON');
    for (const f of FAELLE){
      const w = a && a.woerter && a.woerter[f[1]];
      const kurz = String(f[2]).slice(0, 400).trim();
      ok('T5c ' + f[0] + ': zu ersetzen steht der abgelehnte Text', w && (w.ersetzen || []).some(e => String(e.text).trim() === kurz), w ? JSON.stringify((w.ersetzen || []).map(e => e.quelle)) : 'Wort fehlt');
      ok('T5d ' + f[0] + ': „stehtHeute" enthält ihn', w && (w.stehtHeute || []).some(e => String(e.text).trim().startsWith(kurz.slice(0, 60))), w ? (w.stehtHeute || []).length + ' Texte' : 'Wort fehlt');
      ok('T5e ' + f[0] + ': „alleAbgelehnten" enthält ihn', w && (w.alleAbgelehnten || []).some(t => String(t).trim() === kurz), w ? (w.alleAbgelehnten || []).length : 'Wort fehlt');
      ok('T5f ' + f[0] + ': das arabische Wort steht dabei', w && typeof w.ar === 'string' && w.ar.length > 0, w ? w.ar : 'Wort fehlt');
    }
  }
  const t6 = lauf(werkzeug, [S_DA, '--auftrag']);
  ok('T6 --auftrag ohne Dateinamen → Exit 1', t6.code === 1, 'Exit ' + t6.code);
  const ziel7 = path.join(tmp, 'auftrag7-' + path.basename(werkzeug) + '.json');
  const t7 = lauf(werkzeug, ['--auftrag', ziel7, S_DA]);
  ok('T7 Reihenfolge „--auftrag <ziel> <stand>": der Stand wird gelesen, nicht das Ziel', t7.code === 0 && fs.existsSync(ziel7), 'Exit ' + t7.code + ' · ' + t7.aus.slice(0, 120));

  const nachher = fs.existsSync(abg) ? fs.statSync(abg).mtimeMs + ':' + fs.statSync(abg).size : 'fehlt';
  ok('T8 data/abgelehnt.json ist unberührt', vorher === nachher, vorher + ' → ' + nachher);

  /* T10 — die Bremse: für dieselben Befunde höchstens zwei Aufträge, bei neuen wieder von vorn. */
  const zaehler = path.join(tmp, 'tor-stand-' + path.basename(werkzeug) + '.json');
  const mitZaehler = args => { const r = spawnSync(process.execPath, [werkzeug, ...args], { cwd: WURZEL, encoding: 'utf8', timeout: 120000,
    env: Object.assign({}, process.env, { ABGELEHNT_TOR_STAND: zaehler }) }); return r.status; };
  const folge = [mitZaehler([S_DA, '--tor']), mitZaehler([S_DA, '--tor']), mitZaehler([S_DA, '--tor'])];
  ok('T10 dieselben Befunde: Auftrag, Auftrag, dann keiner mehr (0, 0, 3)', folge.join(',') === '0,0,3', folge.join(','));
  const S_ANDERS = stand('anders.json', FAELLE.slice(0, 2).map(f => [f[1], f[2]]));
  const neu = mitZaehler([S_ANDERS, '--tor']);
  ok('T10b andere Befunde: wieder ein Auftrag', neu === 0, 'Exit ' + neu);
  const echterZaehler = path.resolve(WURZEL, '..', 'Automation', '.state', 'eselsbruecken-tor.json');
  const zVorher = fs.existsSync(echterZaehler) ? fs.statSync(echterZaehler).mtimeMs : 0;
  lauf(werkzeug, [S_DA, '--tor']);
  ok('T10c ein Lauf aus einer Datei zählt nicht mit (der echte Zähler bleibt unberührt)',
    (fs.existsSync(echterZaehler) ? fs.statSync(echterZaehler).mtimeMs : 0) === zVorher, 'der echte Zähler wurde geschrieben');

  const t9 = lauf(werkzeug, [S_DA]);
  ok('T9 der gewöhnliche Aufruf nennt dieselbe Zahl', /Steht noch da: 4 von 4/.test(t9.aus), (t9.aus.match(/Steht noch da: [^\n]*/) || ['keine Zeile'])[0]);
  return rot;
}

let fehler = 0;
try {
  const rot = pruefe(WERKZEUG);
  fehler += rot.length;
  rot.forEach(r => console.log('  ✘    ' + r));

  /* S1 — eine Fassung, die immer „nichts zu tun" sagt. Sie muss neben dem echten
     Werkzeug liegen (es findet das Repo über seinen eigenen Ort). */
  const stoer = path.join(WURZEL, 'werkzeuge', '.stoertest-vorschlaege-holen.mjs');
  const echt = fs.readFileSync(WERKZEUG, 'utf8');
  const STELLE = 'if (!erg.befunde.length) {';
  if (!echt.includes(STELLE)){ fehler++; console.log('  ✘    Störtest S1: die Zeile, die er ändert, steht nicht mehr im Werkzeug — Test anpassen.'); }
  else {
    try {
      fs.writeFileSync(stoer, echt.replace(STELLE, 'if (true) {'), 'utf8');
      const r = pruefe(stoer);
      const trifft = r.filter(x => x.startsWith('T1 ')).length;
      if (!trifft){ fehler++; console.log('  ✘    Störtest S1: ein Werkzeug, das immer „nichts zu tun" sagt, fällt NICHT auf'); }
      else if (ALLES) console.log('  ok   Störtest S1: ' + r.length + ' Meldungen, T1 fällt durch');
    } finally { try { fs.unlinkSync(stoer); } catch (e){ /* lag nie da */ } }
  }
} finally {
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e){ /* Temp-Ordner bleibt liegen: harmlos */ }
}
if (ALLES) console.log('  Beispiele: ' + FAELLE.map(f => f[0] + ' [' + f[1] + ']').join(' · '));
console.log((fehler ? '✘ ' : '✔ ') + 'test-abgelehnt-tor: 10 Prüfpunkte an vier Stellen, 1 Störtest' + (fehler ? ' — ' + fehler + ' NICHT in Ordnung' : ' — alles in Ordnung'));
process.exit(fehler ? 1 : 0);
