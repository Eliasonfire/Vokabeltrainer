/* Prüfstand für „die aktuellsten Kapitel zuerst" (v654, 05.10.2026).
 *
 * Elias auf die Frage, ob die Wörter aus dem eben freigeschalteten Kapitel 13
 * vor den 52 neuen Wörtern aus Bayna Yadayk kommen sollen:
 *   „zu erst die. immer die aktuellsten und dann die zweit aktuellsten usw."
 *
 * Geprüft wird am ECHTEN Quelltext (js/kern.js, js/sync.js):
 *   - die Reihenfolge der neuen Wörter (neueZuerst, ankunftMs, kapitelSeitMs),
 *   - dass ein hier angehaktes Kapitel seinen Zeitpunkt bekommt (saveSettings),
 *   - dass nach dem Abgleich fehlende Zeitpunkte nachgetragen werden, beim
 *     allerersten Mal aber als „unbekannt" und nicht als „jetzt",
 *   - dass ein Gerät, das das Feld nicht kennt, es beim Abgleich übernimmt.
 * Die Karten und Stände sind erfunden. Störtests am Ende.
 *
 * Aufruf:  node test-kapitel-zuerst.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const WURZEL = path.dirname(fileURLToPath(import.meta.url));
const lies = f => fs.readFileSync(path.join(WURZEL, f), 'utf8').replace(/\r\n/g, '\n');
const KERN = lies('js/kern.js'), SYNC = lies('js/sync.js');

function schneide(quelle, kopf){
  const a = quelle.indexOf('\n' + kopf);
  if (a < 0) throw new Error('im Quelltext nicht gefunden: ' + kopf);
  let i = quelle.indexOf('{', quelle.indexOf(')', a)), tiefe = 0;
  for (; i < quelle.length; i++){
    if (quelle[i] === '{') tiefe++;
    else if (quelle[i] === '}'){ tiefe--; if (!tiefe) return quelle.slice(a + 1, i + 1); }
  }
  throw new Error('kein Ende gefunden: ' + kopf);
}
function stueck(quelle, muster, was){
  const m = quelle.match(muster);
  if (!m) throw new Error('im Quelltext nicht gefunden: ' + was);
  return m[0].trim();
}
function kernStuecke(kern){
  return [
    schneide(kern, 'function nieAbgefragt('),
    schneide(kern, 'function neueZuerst('),
    stueck(kern, /\nconst KAPITEL_SEIT_GEMESSEN = \{[\s\S]*?\n\};/, 'KAPITEL_SEIT_GEMESSEN'),
    schneide(kern, 'function kapitelSeitMs('),
    schneide(kern, 'function kapitelRang('),
    schneide(kern, 'function ankunftMs('),
    schneide(kern, 'function kapitelNeuAngehakt('),
    schneide(kern, 'function kapitelSeitNachziehen('),
    stueck(kern, /\nconst SETTINGS_FELD_SCHLUESSEL = [^\n]*;/, 'SETTINGS_FELD_SCHLUESSEL'),
    schneide(kern, 'function settingsFeldStempel('),
    schneide(kern, 'function saveSettings(')
  ].join('\n');
}

const T_K14  = Date.parse('2026-10-06T15:00:00+02:00');
const T_K14b = Date.parse('2026-10-09T15:00:00+02:00');
const T_ERST = Date.parse('2026-10-05T14:00:00+02:00');
const SEED_K13 = 1791136763384, SEED_B4 = 1790187420558, SEED_B3 = 1790092438635, SEED_B5 = 1790722887307;

function baue(stuecke, einstellungen, fortschritt){
  const speicher = { vt_settings: JSON.stringify(einstellungen), vt_settingsFeld: JSON.stringify({ direction: 1 }) };
  const geschrieben = [];
  const ctx = { localStorage: {
    getItem: k => (k in speicher ? speicher[k] : null),
    setItem: (k, v) => { speicher[k] = String(v); geschrieben.push(k); },
    removeItem: k => { delete speicher[k]; } }, console: { log(){}, warn(){}, error(){} } };
  vm.createContext(ctx);
  vm.runInContext(`
    let SETTINGS = JSON.parse(localStorage.getItem('vt_settings'));
    let PROGRESS = ${JSON.stringify(fortschritt || {})};
    const __gemeldet = [];
    function syncGeaendert(k){ __gemeldet.push(k); }
    const LS = {
      get(key, fallback){ try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e){ return fallback; } },
      set(key, val){ localStorage.setItem(key, JSON.stringify(val)); syncGeaendert(key); }
    };
    let __jetzt = ${T_ERST};
    Date.now = () => __jetzt;
  `, ctx);
  vm.runInContext(stuecke, ctx);
  const hole = n => vm.runInContext(n, ctx);
  return { hole, speicher, geschrieben,
    gespeichert: () => JSON.parse(speicher.vt_settings), feld: () => JSON.parse(speicher.vt_settingsFeld) };
}

/* Erfundene Karten: nie bewertet bis auf „alt". Der Tag ist der der Anlage. */
const KARTEN = [
  { id: 'alt',   book: 'madina-1', chapter: 2 },
  { id: 'm12',   book: 'madina-1', chapter: 12 },
  { id: 'b1',    book: 'bayna-yadayk-1', chapter: 1 },
  { id: 'b3',    book: 'bayna-yadayk-1', chapter: 3 },
  { id: 'm13',   book: 'madina-1', chapter: 13 },
  { id: 'eigen', chapter: 'personal' },
  { id: 'b4',    book: 'bayna-yadayk-1', chapter: 4 },
  { id: 'm14',   book: 'madina-1', chapter: 14 }
];
const STAND = {
  alt:   { box: 1, nextReview: '2026-09-01', correct: 3, wrong: 1 },
  m12:   { box: 1, nextReview: '2026-08-11', correct: 0, wrong: 0 },
  b1:    { box: 1, nextReview: '2026-08-29', correct: 0, wrong: 0 },
  b3:    { box: 1, nextReview: '2026-08-29', correct: 0, wrong: 0 },
  m13:   { box: 1, nextReview: '2026-08-11', correct: 0, wrong: 0 },
  eigen: { box: 1, nextReview: '2026-10-05', correct: 0, wrong: 0 },
  b4:    { box: 1, nextReview: '2026-08-29', correct: 0, wrong: 0 },
  m14:   { box: 1, nextReview: '2026-08-11', correct: 0, wrong: 0 }
};
const AUSWAHL = { 'madina-1': [12, 13], 'bayna-yadayk-1': [1, 3, 4] };
const reihe = (u, ids) => u.hole('neueZuerst(' + JSON.stringify(KARTEN.filter(k => ids.includes(k.id))) + ').map(w => w.id).join(" ")');
const OHNE_14 = ['alt', 'm12', 'b1', 'b3', 'm13', 'eigen', 'b4'];

function laufe(kern, sync){
  const erg = new Map();
  const stuecke = kernStuecke(kern);
  const fall = (name, tun) => {
    try { const r = tun(); erg.set(name, r === true ? { ok: true } : { ok: false, zusatz: String(r) }); }
    catch (e){ erg.set(name, { ok: false, zusatz: 'geworfen: ' + e.message }); }
  };

  fall('R1 Reihenfolge: eigene Vokabel von heute, dann Kapitel 13 (04.10.), Bayna Yadayk 4 (23.09.), 3 (22.09.), 1, zuletzt Madina 12 — die bewertete Karte dahinter', () => {
    const soll = 'eigen m13 b4 b3 b1 m12 alt';
    const a = reihe(baue(stuecke, { buecher: AUSWAHL }, STAND), OHNE_14);
    if (a !== soll) return 'ohne gemerkte Zeitpunkte: ' + a;
    const b = reihe(baue(stuecke, { buecher: AUSWAHL, kapitelSeit: { _seit: 5, 'madina-1': { 12: 0, 13: 0 }, 'bayna-yadayk-1': { 1: 0, 3: 0, 4: 0 } } }, STAND), OHNE_14);
    return b === soll ? true : 'mit „unbekannt" gemerkt: ' + b;
  });

  fall('R2 Hier angehaktes Kapitel bekommt den Zeitpunkt von jetzt, das Feld wird gestempelt, seine Wörter kommen zuerst', () => {
    const u = baue(stuecke, { buecher: AUSWAHL, kapitelSeit: { _seit: 5, 'madina-1': { 12: 0, 13: 0 } } }, STAND);
    u.hole('__jetzt = ' + T_K14);
    u.hole('SETTINGS.buecher = { "madina-1": [12, 13, 14], "bayna-yadayk-1": [1, 3, 4] }; saveSettings()');
    const g = u.gespeichert();
    if (!(g.kapitelSeit && g.kapitelSeit['madina-1'] && g.kapitelSeit['madina-1']['14'] === T_K14)) return 'gespeichert: ' + JSON.stringify(g.kapitelSeit);
    if (g.kapitelSeit['madina-1']['13'] !== 0 || g.kapitelSeit._seit !== 5) return 'andere Zeitpunkte verändert';
    if (u.feld().kapitelSeit !== T_K14 || u.feld().buecher !== T_K14) return 'Feldstempel: ' + JSON.stringify(u.feld());
    const r = reihe(u, OHNE_14.concat('m14'));
    return r === 'm14 eigen m13 b4 b3 b1 m12 alt' ? true : 'Reihenfolge: ' + r;
  });

  fall('R3 Speichern ohne neues Kapitel ändert keinen Zeitpunkt; abhaken und später wieder anhaken zählt neu', () => {
    const u = baue(stuecke, { buecher: { 'madina-1': [12, 13, 14] }, kapitelSeit: { _seit: 5, 'madina-1': { 12: 0, 13: 0, 14: T_K14 } }, direction: 'ar-de' }, STAND);
    u.hole('__jetzt = ' + (T_K14 + 1000));
    u.hole('SETTINGS.direction = "mixed"; saveSettings()');
    if (JSON.stringify(u.gespeichert().kapitelSeit) !== JSON.stringify({ _seit: 5, 'madina-1': { 12: 0, 13: 0, 14: T_K14 } })) return 'ohne neues Kapitel verändert';
    if ('kapitelSeit' in u.feld()) return 'Feld gestempelt, obwohl nichts geändert';
    u.hole('SETTINGS.buecher = { "madina-1": [12, 13] }; saveSettings()');
    if (u.gespeichert().kapitelSeit['madina-1']['14'] !== T_K14) return 'beim Abhaken verändert';
    u.hole('__jetzt = ' + T_K14b);
    u.hole('SETTINGS.buecher = { "madina-1": [12, 13, 14] }; saveSettings()');
    return u.gespeichert().kapitelSeit['madina-1']['14'] === T_K14b ? true : 'wieder angehakt: ' + u.gespeichert().kapitelSeit['madina-1']['14'];
  });

  fall('R4 Nach dem Abgleich, allererstes Mal: alle gewählten Kapitel gelten als „unbekannt" (0), nicht als jetzt — und ein zweiter Aufruf schreibt nichts', () => {
    const u = baue(stuecke, { buecher: AUSWAHL }, STAND);
    if (u.hole('kapitelSeitNachziehen()') !== true) return 'Rückgabe nicht true';
    const k = u.gespeichert().kapitelSeit;
    const soll = { 'madina-1': { 12: 0, 13: 0 }, 'bayna-yadayk-1': { 1: 0, 3: 0, 4: 0 }, _seit: T_ERST };
    if (JSON.stringify(k) !== JSON.stringify(soll)) return JSON.stringify(k);
    const n = u.geschrieben.length;
    u.hole('__jetzt = ' + T_K14);
    if (u.hole('kapitelSeitNachziehen()') !== false || u.geschrieben.length !== n) return 'zweiter Aufruf schreibt';
    return reihe(u, OHNE_14) === 'eigen m13 b4 b3 b1 m12 alt' ? true : 'Reihenfolge danach falsch';
  });

  fall('R5 Nach dem Abgleich, später: ein gewähltes Kapitel ohne Zeitpunkt (auf dem Gerät mit älterer Fassung angehakt) bekommt jetzt', () => {
    const u = baue(stuecke, { buecher: { 'madina-1': [12, 13, 14] }, kapitelSeit: { _seit: 5, 'madina-1': { 12: 0, 13: 0 } } }, STAND);
    u.hole('__jetzt = ' + T_K14);
    if (u.hole('kapitelSeitNachziehen()') !== true) return 'Rückgabe nicht true';
    const k = u.gespeichert().kapitelSeit;
    return (k['madina-1']['14'] === T_K14 && k['madina-1']['13'] === 0 && k._seit === 5) ? true : JSON.stringify(k);
  });

  fall('R6 Ein hier angehaktes Kapitel VOR dem ersten Nachziehen behält seinen Zeitpunkt, die übrigen werden „unbekannt"', () => {
    const u = baue(stuecke, { buecher: { 'madina-1': [12, 13, 14] }, kapitelSeit: { 'madina-1': { 14: T_K14 } } }, STAND);
    u.hole('__jetzt = ' + T_K14b);
    u.hole('kapitelSeitNachziehen()');
    const k = u.gespeichert().kapitelSeit;
    return (k['madina-1']['14'] === T_K14 && k['madina-1']['12'] === 0 && k['madina-1']['13'] === 0 && k._seit === T_K14b) ? true : JSON.stringify(k);
  });

  fall('R7 Der gemerkte Zeitpunkt schlägt den gemessenen; „unbekannt" fällt auf den gemessenen zurück; ohne beides gilt der Tag des Eintrags', () => {
    const u = baue(stuecke, { buecher: AUSWAHL, kapitelSeit: { _seit: 5, 'bayna-yadayk-1': { 4: 0, 5: T_K14 } } }, STAND);
    const ms = (b, c) => u.hole('kapitelSeitMs(' + JSON.stringify({ id: 'x', book: b, chapter: c }) + ')');
    if (ms('bayna-yadayk-1', 5) !== T_K14) return 'gemerkt schlägt gemessen nicht';
    if (ms('bayna-yadayk-1', 4) !== SEED_B4 || ms('bayna-yadayk-1', 3) !== SEED_B3 || ms('madina-1', 13) !== SEED_K13) return 'gemessene Zeitpunkte falsch';
    if (ms('madina-1', 12) !== 0 || u.hole('kapitelSeitMs({ id: "e", chapter: "personal" })') !== 0) return 'unbekannt ist nicht 0';
    if (new Date(SEED_K13).toISOString().slice(0, 10) !== '2026-10-04' || new Date(SEED_B5).toISOString().slice(0, 10) !== '2026-09-29') return 'gemessene Zeitpunkte liegen an anderen Tagen';
    return u.hole('ankunftMs({ id: "m12", book: "madina-1", chapter: 12 })') === Date.parse('2026-08-11T00:00:00') ? true : 'Tag des Eintrags falsch';
  });

  fall('R8 Abgleich: ein Gerät, das das Feld nicht kennt, übernimmt es; bei beiden gewinnt der jüngere Feldstempel', () => {
    const ctx = { localStorage: { getItem: () => null, setItem(){}, removeItem(){} }, document: { addEventListener(){}, getElementById(){ return null; } },
      location: { protocol: 'https:', hostname: 'vokabeltrainer.example' }, navigator: { onLine: true },
      fetch: async () => { throw new Error('kein Netz im Prüfstand'); }, setTimeout: () => 0, clearTimeout(){}, setInterval: () => 0, clearInterval(){}, console: { log(){}, warn(){}, error(){} } };
    ctx.window = ctx; vm.createContext(ctx); vm.runInContext(sync, ctx);
    const fuehre = vm.runInContext('fuehreEinstellungenZusammen', ctx);
    const feld = { _seit: 5, 'madina-1': { 14: T_K14 } };
    const a = fuehre({ buecher: AUSWAHL }, { buecher: AUSWAHL, kapitelSeit: feld }, { buecher: 9 }, { buecher: 9, kapitelSeit: 7 }, false);
    if (JSON.stringify(a.kapitelSeit) !== JSON.stringify(feld)) return 'nicht übernommen: ' + JSON.stringify(a.kapitelSeit);
    const neuer = { _seit: 5, 'madina-1': { 14: T_K14b } };
    const b = fuehre({ kapitelSeit: feld }, { kapitelSeit: neuer }, { kapitelSeit: 7 }, { kapitelSeit: 8 }, false);
    const c = fuehre({ kapitelSeit: neuer }, { kapitelSeit: feld }, { kapitelSeit: 8 }, { kapitelSeit: 7 }, false);
    return (b.kapitelSeit['madina-1']['14'] === T_K14b && c.kapitelSeit['madina-1']['14'] === T_K14b) ? true : 'der ältere Stand gewinnt';
  });

  fall('R10 Zeitpunkt unbekannt: im selben Buch das später angehakte Kapitel zuerst (Auswahl [10, 12, 11] → 11, 12, 10); zwischen zwei Büchern bleibt die Reihenfolge', () => {
    const karten = [{ id: 'k10', book: 'madina-1', chapter: 10 }, { id: 'fremd', book: 'madina-2', chapter: 1 }, { id: 'k12', book: 'madina-1', chapter: 12 }, { id: 'k11', book: 'madina-1', chapter: 11 }];
    const stand = {};
    for (const k of karten) stand[k.id] = { box: 1, nextReview: '2026-08-11', correct: 0, wrong: 0 };
    const u = baue(stuecke, { buecher: { 'madina-1': [10, 12, 11], 'madina-2': [1] } }, stand);
    const r = u.hole('neueZuerst(' + JSON.stringify(karten) + ').map(w => w.id).join(" ")');
    /* „fremd" (anderes Buch, derselbe Tag) steht in der Eingabe MITTEN zwischen den dreien.
       Genau daran scheiterte die erste Fassung: sie verglich nur im selben Buch, und das
       Sortieren ließ 10, 12, 11 stehen. Jetzt: erst nach dem Buch, dann nach dem Rang. */
    return r === 'k11 k12 k10 fremd' ? true : 'Reihenfolge: ' + r;
  });

  fall('R9 Im Quelltext: das Nachziehen wird in gleicheAb() genau einmal gerufen, nach dem Zusammenführen und dem Neueinlesen', () => {
    const code = sync.replace(/\/\*[\s\S]*?\*\//g, '');
    if (code.split('kapitelSeitNachziehen(').length - 1 !== 1) return 'nicht genau ein Aufruf';
    const a = code.indexOf('fuehreZusammen(fern);'), l = code.indexOf('ladeStandNeu();', a), b = code.indexOf('kapitelSeitNachziehen('), z = code.indexOf('schickeNachArabicroots();', a);
    return (a > 0 && l > a && b > l && z > b) ? true : 'Reihenfolge im Quelltext stimmt nicht';
  });

  return erg;
}

let rot = 0;
const erg = laufe(KERN, SYNC);
console.log('=== Die aktuellsten Kapitel zuerst ===');
for (const [name, e] of erg){ if (!e.ok) rot++; console.log((e.ok ? '  ok   ' : '  FEHL ') + name + (e.zusatz ? '  -> ' + e.zusatz : '')); }

function ersetze(quelle, alt, neu, wo){
  const n = quelle.split(alt).length - 1;
  if (n !== 1) throw new Error('Störtest „' + wo + '": die Stelle kommt ' + n + '-mal vor (erwartet 1) — Quelltext hat sich geändert');
  return quelle.replace(alt, () => neu);
}
const STOER = [
  { name: 'S1 die Reihenfolge wieder nur nach dem Tag des Eintrags', muss: ['R1', 'R2'],
    kern: q => ersetze(q, "  const an = (typeof ankunftMs === 'function') ? ankunftMs : (w => Date.parse(tag(w) + 'T00:00:00') || 0);", "  const an = (w => Date.parse(tag(w) + 'T00:00:00') || 0);", 'S1') },
  { name: 'S2 das Speichern merkt ein neues Kapitel nicht', muss: ['R2', 'R3'],
    kern: q => ersetze(q, "  if (typeof kapitelNeuAngehakt === 'function') kapitelNeuAngehakt(alt);\n", '', 'S2') },
  { name: 'S3 beim allerersten Mal bekommen alle Kapitel „jetzt"', muss: ['R4', 'R6'],
    kern: q => ersetze(q, '      neu[buch][k] = erstesMal ? 0 : jetzt;', '      neu[buch][k] = jetzt;', 'S3') },
  { name: 'S4 ohne den gemessenen Zeitpunkt für Kapitel 13', muss: ['R1', 'R7'],
    kern: q => ersetze(q, "  'madina-1':       { 13: 1791136763384 },", "  'madina-1':       { },", 'S4') },
  { name: 'S5 ohne den Vermerk, seit wann mitgeschrieben wird', muss: ['R4', 'R6'],
    kern: q => ersetze(q, '  if (erstesMal){ neu._seit = jetzt; geaendert = true; }\n', '', 'S5') },
  { name: 'S7 ohne die Reihenfolge des Anhakens bei unbekanntem Zeitpunkt', muss: ['R10'],
    kern: q => ersetze(q, "  const mitRang = typeof kapitelRang === 'function';", '  const mitRang = false;', 'S7') },
  { name: 'S8 der Vergleich entscheidet nur im selben Buch (die erste Fassung)', muss: ['R10'],
    kern: q => ersetze(q, "(String(a.book).localeCompare(String(b.book)) || (kapitelRang(b) - kapitelRang(a)))", "((a.book === b.book) ? kapitelRang(b) - kapitelRang(a) : 0)", 'S8') },
  { name: 'S6 das Nachziehen vor dem Zusammenführen', muss: ['R9'],
    sync: q => ersetze(q, '    let geaendert = fuehreZusammen(fern);\n', "    if (typeof kapitelSeitNachziehen === 'function') kapitelSeitNachziehen();\n    let geaendert = fuehreZusammen(fern);\n", 'S6') }
];
console.log('\n=== Störtests: ohne die Regel MUSS der zuständige Fall scheitern ===');
for (const s of STOER){
  let e;
  try { e = laufe(s.kern ? s.kern(KERN) : KERN, s.sync ? s.sync(SYNC) : SYNC); }
  catch (err){ rot++; console.log('  FEHL ' + s.name + '  -> ' + err.message); continue; }
  const gescheitert = [...e].filter(([, v]) => !v.ok).map(([n]) => n.split(' ')[0]);
  const fehlt = s.muss.filter(k => !gescheitert.includes(k));
  if (fehlt.length){ rot++; console.log('  FEHL ' + s.name + '  -> ' + fehlt.join(', ') + ' blieb grün (gescheitert: ' + (gescheitert.join(', ') || 'nichts') + ')'); }
  else console.log('  ok   ' + s.name + '  -> scheitert wie verlangt: ' + gescheitert.join(', '));
}
console.log('\n' + (rot ? rot + ' Befund(e).' : 'Alles grün: ' + erg.size + ' Fälle, ' + STOER.length + ' Störtests.'));
process.exit(rot ? 1 : 0);
