/* „schwer" zählt bei arabicroots zur HÄLFTE als gewusst (v707, 23.10.2026).
 *
 * Elias, wörtlich: „ich möchte, dass wenn ich bei karteikarten auf ,,schwer"
 * tippe also das es bei der box bleiben soll, dass es bei arabicroots die
 * hälfte davon als gewusst eingetragen wird und die andere als nicht nicht
 * gewusst".
 *
 * Geprüft wird die ganze Kette am ECHTEN Quelltext, nichts nachgebaut
 * [[testvorlage_selbst_nachgebaut]]:
 *   H1  answer() — die ganze js/lernen.js im vm, wie test-p9.mjs: „schwer"
 *       bleibt in der Box, zählt in der App weiter als Fehlversuch und bekommt
 *       abwechselnd schwerGewusst / schwerNichtGewusst, über ALLE Wörter, die
 *       nach arabicroots gehen. Ein Fachbegriff (gram-…) bekommt keine Hälfte —
 *       er kommt drüben nie an (gemessen in der Probe: sonst 4 zu 3).
 *   H2  nochmal, gut und leicht rühren die neuen Zähler nicht an.
 *   H3  ein Vorsprung aus zwei Geräten gleicht sich von selbst aus.
 *   H4  schickeNachArabicroots() (js/sync.js) schickt die Zählweise und
 *       schwerGewusst; ein Wort ohne „schwer" bleibt wie bisher.
 *   H5  offeneVersuche() (functions/api/arabicroots.js): von zehn „schwer"
 *       kommen drüben fünf als gewusst und fünf als nicht gewusst an, die
 *       „schwer" von vor v707 bleiben, ein zweiter Lauf legt nichts an —
 *       einmal mit fester Eingabe, einmal als Kette H1 → H4 → H5.
 *   H6  kaputte Werte erfinden keinen Versuch und drehen nichts ins Minus.
 *   H7  eine ältere App (ohne Zählweise) schreibt nichts und meldet sich
 *       nicht einmal an; die neue kommt bis zur Anmeldung.
 *   H8  App und Übertragung nennen dieselbe Zählweise.
 * Dazu Störtests: jede Prüfung muss rot werden, wenn ihre Stelle fehlt.
 *
 *   node test-schwer-halb.mjs
 */
import fs from 'node:fs';
import vm from 'node:vm';

const LERNEN = fs.readFileSync('js/lernen.js', 'utf8');
const SYNC = fs.readFileSync('js/sync.js', 'utf8');
const UEBERTRAGUNG = fs.readFileSync('functions/api/arabicroots.js', 'utf8');
const KERN = fs.readFileSync('js/kern.js', 'utf8');

/* Werte aus dem echten js/kern.js, wie in test-p9.mjs. */
const INTERVALS = eval('(' + (KERN.match(/const INTERVALS = (\{[^}]+\})/) || [])[1] + ')');
const TAGE_ZWISCHEN = (() => {
  const a = KERN.indexOf('function tageZwischen(');
  let i = KERN.indexOf('{', a), t = 0;
  for (; i < KERN.length; i++){ if (KERN[i] === '{') t++; else if (KERN[i] === '}' && !--t) break; }
  return vm.runInNewContext('(' + KERN.slice(a, i + 1) + ')', { Date, Math, String, isNaN });
})();
const GRUPPE_ABSTAND = Number((KERN.match(/const GRUPPE_ABSTAND = (\d+)/) || [])[1]);
const HEUTE = '2026-10-23';

function schneideFunktion(quelle, name){
  const start = quelle.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('Funktion nicht gefunden: ' + name);
  let tiefe = 0, i = quelle.indexOf('{', start);
  for (; i < quelle.length; i++){
    if (quelle[i] === '{') tiefe++;
    else if (quelle[i] === '}'){ tiefe--; if (!tiefe) break; }
  }
  if (tiefe) throw new Error('Klammern gehen nicht auf: ' + name);
  return quelle.slice(start, i + 1);
}

/* ---------- DOM-Attrappe (wie test-p9.mjs) ---------- */
function element(id){
  const klassen = new Set();
  return {
    id, style: {}, dataset: {}, innerHTML: '', textContent: '', value: '',
    classList: { add: (...c) => c.forEach(x => klassen.add(x)), remove: (...c) => c.forEach(x => klassen.delete(x)),
                 contains: c => klassen.has(c), toggle: () => false },
    addEventListener(){}, removeEventListener(){}, querySelector: () => null, querySelectorAll: () => [],
    closest: () => null, appendChild(){}, remove(){}, focus(){}, scrollIntoView(){}, scrollTo(){},
    getBoundingClientRect: () => ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }),
    setAttribute(){}, getAttribute: () => null, hasAttribute: () => false,
  };
}

function ladeLernen(quelle){
  const ELEMENTE = new Map(), AUSWAHL = new Map();
  const hole = id => { if (!ELEMENTE.has(id)) ELEMENTE.set(id, element(id)); return ELEMENTE.get(id); };
  const wurzel = element('html');
  wurzel.style.setProperty = () => {};
  const ctx = vm.createContext({
    document: {
      getElementById: hole, documentElement: wurzel,
      querySelector: sel => {
        if (typeof sel !== 'string' || !/^[.#][A-Za-z][\w-]*$/.test(sel)) return null;
        if (!AUSWAHL.has(sel)) AUSWAHL.set(sel, element(sel));
        return AUSWAHL.get(sel);
      },
      querySelectorAll: () => [], createElement: () => element('neu'),
      addEventListener(){}, head: { appendChild(){} }, body: element('body'),
    },
    window: { addEventListener(){}, matchMedia: () => ({ matches: false, addEventListener(){} }) },
    history: { state: null, pushState(){}, replaceState(){} },
    console, requestAnimationFrame: f => f(), setTimeout, clearTimeout, setInterval, clearInterval,
    IntersectionObserver: class { observe(){} disconnect(){} unobserve(){} },
    LS: { _d: {}, get(k, f){ return k in this._d ? this._d[k] : f; }, set(k, v){ this._d[k] = v; } },
    INTERVALS, HOECHSTE_BOX: Math.max(...Object.keys(INTERVALS).map(Number)),
    tageZwischen: TAGE_ZWISCHEN, GRUPPE_ABSTAND,
    PROGRESS: {}, VOCAB_DATA: [], PERSONAL_VOCAB: [], SETTINGS: {},
    escapeHtml: s => String(s), saveProgress(){}, touchStreak(){},
    todayStr: () => HEUTE, showScreen(){}, zeigeToast(){}, toast(){},
    feiere(){}, feiereAnkunftBoxFuenf(){},
    cardDirection: () => 'ar-de', aktivesBuch: () => 'madina1', buchVokabeln: () => [],
    sprich(){}, renderQuranFreqBadge(){}, zeichneStart(){}, geheZurueck(){},
    GRAMMAR_RULES: [], SENTENCE_TAGS: {}, QURAN_FREQ: {}, QURAN_WORT: {},
    /* Sofort weiter statt 210 ms Farbsignal — so läuft answer() ohne Uhr. */
    REDUCED_MOTION: true,
    fetch: () => Promise.reject(new Error('kein Netz im Prüfstand')),
  });
  vm.runInContext(quelle, ctx, { filename: 'js/lernen.js' });
  return ctx;
}

/* Eine Folge von Antworten durch die ECHTE answer(). Die Runde bekommt eine
   Karte mehr, damit sie nicht endet — das Rundenende ist nicht Gegenstand.
   Zurück kommt je Antwort, welcher neue Zähler gestiegen ist: g (gewusst),
   n (nicht gewusst) oder - (keiner). */
function tippe(ctx, start, folge){
  ctx.PROGRESS = JSON.parse(JSON.stringify(start));
  return vm.runInContext(`(() => {
    const alt = { renderCard, rundeSichern };
    renderCard = () => {}; rundeSichern = () => {};
    const FOLGE = ${JSON.stringify(folge)};
    SESSION = { words: FOLGE.map(([, id]) => ({ id, ar: 'x', de: 'y' })).concat([{ id: 'ende' }]),
                idx: 0, dirs: FOLGE.map(() => 'ar-de').concat(['ar-de']), fertig: false, serie: 0 };
    const spur = [];
    try {
      for (let i = 0; i < FOLGE.length; i++){
        const [stufe, id] = FOLGE[i];
        SESSION.idx = i; answer._busy = false;
        const v = JSON.parse(JSON.stringify(PROGRESS[id]));
        answer(stufe);
        const p = PROGRESS[id];
        spur.push((p.schwerGewusst || 0) > (v.schwerGewusst || 0) ? 'g'
                : (p.schwerNichtGewusst || 0) > (v.schwerNichtGewusst || 0) ? 'n' : '-');
      }
    } finally { renderCard = alt.renderCard; rundeSichern = alt.rundeSichern; }
    return JSON.stringify({ spur: spur.join(''), progress: PROGRESS });
  })()`, ctx);
}

/* ---------- Die Probe ---------- */
const W1 = '45751', W2 = '45762', W3 = '45782', W4 = '45790';
const BEKANNT = new Set([W1, W2, W3, W4]);
/* Vor v707: je 2 richtig, 3 falsch — alles schon drüben. */
const VORHER = { box: 3, nextReview: HEUTE, correct: 2, wrong: 3, ts: 1 };
const FACH = 'gram-zarf';
const START = { [W1]: { ...VORHER }, [W2]: { ...VORHER }, [W3]: { ...VORHER }, [W4]: { ...VORHER },
                [FACH]: { box: 2, nextReview: HEUTE, correct: 0, wrong: 5, ts: 1 } };
const SCHON_DA = { [W1]: { richtig: 2, falsch: 3 }, [W2]: { richtig: 2, falsch: 3 },
                   [W3]: { richtig: 2, falsch: 3 }, [W4]: { richtig: 2, falsch: 3 } };
/* Zehn „schwer" auf arabicroots-Wörtern, ein „schwer" auf einem Fachbegriff,
   dazu ein „nochmal" und ein „gut". */
const FOLGE = [['schwer', W1], ['schwer', FACH], ['schwer', W2], ['nochmal', W3], ['schwer', W3], ['schwer', W4], ['gut', W1],
               ['schwer', W1], ['schwer', W2], ['schwer', W2], ['schwer', W3], ['schwer', W4], ['schwer', W4]];
const TS = Date.UTC(2026, 9, 23, 18, 0);

const zaehle = zeilen => ({ gesamt: zeilen.length, richtig: zeilen.filter(z => z.correct).length,
                            falsch: zeilen.filter(z => !z.correct).length });
const gleich = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const schonDaNach = (vorher, zeilen) => {
  const raus = JSON.parse(JSON.stringify(vorher));
  for (const z of zeilen){
    const k = z.vocabulary_id;
    if (!raus[k]) raus[k] = { richtig: 0, falsch: 0 };
    if (z.correct) raus[k].richtig++; else raus[k].falsch++;
  }
  return raus;
};

async function ladeUebertragung(quelle){
  return quelle === UEBERTRAGUNG
    ? import('./functions/api/arabicroots.js')
    : import('data:text/javascript;charset=utf-8,' + encodeURIComponent(quelle));
}

async function pruefeAlles({ lernen = LERNEN, sync = SYNC, uebertragung = UEBERTRAGUNG } = {}){
  const f = [];
  let modul;
  try { modul = await ladeUebertragung(uebertragung); }
  catch (e){ return ['H5: functions/api/arabicroots.js lädt nicht: ' + e.message]; }
  const { offeneVersuche, onRequest, ZAEHLWEISE } = modul;

  /* ---------- H1–H3: answer() ---------- */
  let nachH1 = null;
  try {
    const ctx = ladeLernen(lernen);
    const r = JSON.parse(tippe(ctx, START, FOLGE));
    nachH1 = r.progress;
    if (r.spur !== 'g-n-gn-gngngn')
      f.push('H1: Reihenfolge der Hälften ' + r.spur + ' (erwartet g-n-gn-gngngn: abwechselnd über alle arabicroots-Wörter, der Fachbegriff ohne)');
    const summe = feld => Object.values(r.progress).reduce((s, p) => s + (Number(p[feld]) || 0), 0);
    if (summe('schwerGewusst') !== 5 || summe('schwerNichtGewusst') !== 5)
      f.push(`H1: von zehn „schwer" ${summe('schwerGewusst')} gewusst, ${summe('schwerNichtGewusst')} nicht gewusst (erwartet 5 und 5)`);
    const zahlen = id => [r.progress[id].correct, r.progress[id].wrong, r.progress[id].box];
    const soll = { [W1]: [3, 5, 4], [W2]: [2, 6, 3], [W3]: [2, 6, 2], [W4]: [2, 6, 3], [FACH]: [0, 6, 2] };
    for (const id of [W1, W2, W3, W4, FACH])
      if (!gleich(zahlen(id), soll[id]))
        f.push(`H1: ${id} hat richtig/falsch/Box ${zahlen(id)} (erwartet ${soll[id]} — „schwer" bleibt in der App Fehlversuch und hält die Box)`);

    const r2 = JSON.parse(tippe(ctx, { '45999': { box: 2, nextReview: HEUTE, correct: 0, wrong: 0 } },
                                [['nochmal', '45999'], ['gut', '45999'], ['leicht', '45999']]));
    const e2 = r2.progress['45999'];
    if (r2.spur !== '---' || 'schwerGewusst' in e2 || 'schwerNichtGewusst' in e2)
      f.push('H2: nochmal/gut/leicht setzen einen „schwer"-Zähler (Spur ' + r2.spur + ', Eintrag ' + JSON.stringify(e2) + ')');

    const r3 = JSON.parse(tippe(ctx, { '45991': { ...VORHER, schwerGewusst: 2 }, '45992': { ...VORHER } },
                                [['schwer', '45991'], ['schwer', '45992'], ['schwer', '45991']]));
    if (r3.spur !== 'nng')
      f.push('H3: zwei Gewusst Vorsprung (vom anderen Gerät) ergeben ' + r3.spur + ' (erwartet nng)');
  } catch (e){ f.push('H1: answer() läuft nicht: ' + e.message); }

  /* ---------- H4: schickeNachArabicroots() ---------- */
  let gesendet = null, zaehlweiseApp = null;
  try {
    const fn = schneideFunktion(sync, 'schickeNachArabicroots');
    const start = sync.indexOf('let AR_LETZTE_MELDUNG');
    const ende = sync.indexOf(fn) + fn.length;
    if (start < 0 || ende < start) throw new Error('Abschnitt AR_LETZTE_MELDUNG … schickeNachArabicroots nicht gefunden');
    const progress = Object.assign({}, nachH1 || {}, {
      '45800': { box: 2, correct: 4, wrong: 1, ts: 7 },
      '45801': { box: 1, correct: 0, wrong: 0 },
    });
    const ctx = vm.createContext({
      PROGRESS: progress,
      fetch: (url, opt) => { gesendet = { url, koerper: JSON.parse(opt.body) }; return Promise.resolve({ ok: true }); },
    });
    vm.runInContext(sync.slice(start, ende), ctx, { filename: 'js/sync.js (Übertragung)' });
    await vm.runInContext('schickeNachArabicroots()', ctx);
    zaehlweiseApp = vm.runInContext('typeof AR_ZAEHLWEISE === "undefined" ? null : AR_ZAEHLWEISE', ctx);
    const k = gesendet && gesendet.koerper;
    if (!k) f.push('H4: es wurde nichts geschickt');
    else {
      if (k.zaehlweise !== 2) f.push('H4: geschickt mit Zählweise ' + JSON.stringify(k.zaehlweise) + ' (erwartet 2)');
      const e1 = k.fortschritt[W1] || {};
      if (e1.schwerGewusst !== 2 || e1.correct !== 3 || e1.wrong !== 5)
        f.push('H4: ' + W1 + ' geht als ' + JSON.stringify(e1) + ' raus (erwartet correct 3, wrong 5, schwerGewusst 2)');
      const ohne = k.fortschritt['45800'];
      if (!ohne || Object.keys(ohne).join(',') !== 'correct,wrong,ts')
        f.push('H4: ein Wort ohne „schwer" geht anders raus als bisher: ' + JSON.stringify(ohne));
      if ('45801' in k.fortschritt) f.push('H4: ein nie beantwortetes Wort wird mitgeschickt');
    }
  } catch (e){ f.push('H4: schickeNachArabicroots() läuft nicht: ' + e.message); }

  /* ---------- H5: offeneVersuche() ---------- */
  try {
    const fest = {
      [W1]: { correct: 3, wrong: 5, ts: TS, schwerGewusst: 2 },
      [W2]: { correct: 2, wrong: 6, ts: TS, schwerGewusst: 1 },
      [W3]: { correct: 2, wrong: 6, ts: TS, schwerGewusst: 1 },
      [W4]: { correct: 2, wrong: 6, ts: TS, schwerGewusst: 1 },
    };
    const z = offeneVersuche(fest, SCHON_DA, BEKANNT);
    if (!gleich(zaehle(z), { gesamt: 12, richtig: 6, falsch: 6 }))
      f.push('H5: zehn „schwer", ein „gut", ein „nochmal" ergeben drüben ' + JSON.stringify(zaehle(z))
        + ' (erwartet 12 = 6 gewusst [1 gut + 5 schwer] und 6 nicht gewusst [1 nochmal + 5 schwer])');
    const w1 = zaehle(z.filter(x => x.vocabulary_id === W1));
    if (!gleich(w1, { gesamt: 3, richtig: 3, falsch: 0 }))
      f.push('H5: ' + W1 + ' (zwei „schwer" als gewusst, ein „gut") ergibt ' + JSON.stringify(w1));
    if (offeneVersuche(fest, schonDaNach(SCHON_DA, z), BEKANNT).length)
      f.push('H5: der zweite Lauf legt noch einmal etwas an');
    /* Übergang: was vor v707 drüben steht, bleibt; das erste neue „schwer" als gewusst. */
    if (offeneVersuche({ [W1]: { correct: 3, wrong: 4, ts: TS } }, { [W1]: { richtig: 3, falsch: 4 } }, BEKANNT).length)
      f.push('H5: ein Wort ohne neues „schwer" bekommt nach v707 etwas angelegt');
    const erst = offeneVersuche({ [W1]: { correct: 3, wrong: 5, ts: TS, schwerGewusst: 1 } },
                                { [W1]: { richtig: 3, falsch: 4 } }, BEKANNT);
    if (!gleich(zaehle(erst), { gesamt: 1, richtig: 1, falsch: 0 }))
      f.push('H5: das erste „schwer" nach v707 (als gewusst) ergibt ' + JSON.stringify(zaehle(erst)));
    /* Die Kette: was answer() gezählt und sync.js geschickt hat. */
    if (gesendet && gesendet.koerper){
      const kette = offeneVersuche(gesendet.koerper.fortschritt, SCHON_DA, BEKANNT);
      if (!gleich(zaehle(kette), { gesamt: 12, richtig: 6, falsch: 6 }))
        f.push('H5: Kette answer() → sync.js → Übertragung ergibt ' + JSON.stringify(zaehle(kette)) + ' (erwartet 12, 6, 6)');
    } else f.push('H5: Kette — von H4 kam nichts');
  } catch (e){ f.push('H5: offeneVersuche() wirft: ' + e.message); }

  /* ---------- H6: kaputte Werte ---------- */
  try {
    const eins = p => zaehle(offeneVersuche({ [W1]: { ts: TS, ...p } }, {}, BEKANNT));
    const faelle = [
      [{ correct: 1, wrong: 2, schwerGewusst: 9 }, { gesamt: 3, richtig: 3, falsch: 0 }, 'mehr gewusst als falsch'],
      [{ correct: 1, wrong: 2, schwerGewusst: -4 }, { gesamt: 3, richtig: 1, falsch: 2 }, 'negativ'],
      [{ correct: 0, wrong: 2, schwerGewusst: 'x' }, { gesamt: 2, richtig: 0, falsch: 2 }, 'keine Zahl'],
      [{ correct: 0, wrong: 3, schwerGewusst: 1.7 }, { gesamt: 3, richtig: 1, falsch: 2 }, 'Bruch'],
    ];
    for (const [p, soll, name] of faelle){
      const ist = eins(p);
      if (!gleich(ist, soll)) f.push(`H6: ${name} (${JSON.stringify(p)}) ergibt ${JSON.stringify(ist)} (erwartet ${JSON.stringify(soll)})`);
    }
  } catch (e){ f.push('H6: wirft: ' + e.message); }

  /* ---------- H7: eine ältere App schreibt nichts ---------- */
  const echtesFetch = globalThis.fetch;
  try {
    const env = { AR_SUPABASE_URL: 'https://arabicroots.invalid', AR_ANON_KEY: 'probe', AR_REFRESH_TOKEN: 'probe' };
    const frage = koerper => new Request('https://vokabeltrainer.test/api/arabicroots', {
      method: 'POST', body: JSON.stringify(koerper),
      headers: { 'content-type': 'application/json', 'cf-access-authenticated-user-email': 'probe@example.org' } });
    let aufrufe = 0;
    globalThis.fetch = async () => { aufrufe++; return new Response('{}', { status: 400 }); };
    const fortschritt = { [W1]: { correct: 3, wrong: 5, ts: TS } };
    for (const [koerper, name] of [[{ fortschritt }, 'ohne Zählweise'], [{ zaehlweise: 1, fortschritt }, 'Zählweise 1']]){
      aufrufe = 0;
      const res = await onRequest({ request: frage(koerper), env });
      if (res.status !== 409 || aufrufe !== 0)
        f.push(`H7: ältere App (${name}) bekommt ${res.status} und löst ${aufrufe} Netzaufruf(e) aus (erwartet 409 und 0)`);
    }
    aufrufe = 0;
    const neu = await onRequest({ request: frage({ zaehlweise: ZAEHLWEISE, fortschritt }), env });
    if (aufrufe < 1 || neu.status === 409)
      f.push(`H7: die neue App kommt nicht bis zur Anmeldung (Status ${neu.status}, ${aufrufe} Netzaufrufe)`);
  } catch (e){ f.push('H7: onRequest() wirft: ' + e.message); }
  finally { globalThis.fetch = echtesFetch; }

  /* ---------- H8: dieselbe Zählweise ---------- */
  if (ZAEHLWEISE !== 2 || zaehlweiseApp !== ZAEHLWEISE)
    f.push(`H8: App schickt Zählweise ${zaehlweiseApp}, die Übertragung erwartet ${ZAEHLWEISE} (beide müssen 2 sein)`);

  return f;
}

/* ---------- Lauf und Störtests ---------- */
const ersetze = (q, alt, neu, name) => {
  const n = q.split(alt).length - 1;
  if (n !== 1) throw new Error(`Störtest „${name}" greift nicht: Stelle ${n}× gefunden`);
  return q.replace(alt, neu);
};
let rot = 0;
const aussagen = await pruefeAlles();
if (aussagen.length){ rot++; console.log('❌ Am echten Quelltext:'); aussagen.forEach(x => console.log('   ' + x)); }
else console.log('✅ H1–H8 grün am echten Quelltext.');

const HALB = '    const halb = Math.min(falsch, Math.max(0, Math.floor(Number(p && p.schwerGewusst) || 0)));';
const STOER = [
  ['S1 answer() zählt keine Hälfte', 'H1', { lernen: ['  if (s === STUFEN.schwer && istArabicrootsWort(w.id)){', '  if (false){'] }],
  ['S2 jedes „schwer" gewusst', 'H1', { lernen: ['  return gewusst <= nicht;', '  return true;'] }],
  ['S3 auch „nochmal" zählt mit', 'H2', { lernen: ['  if (s === STUFEN.schwer && istArabicrootsWort(w.id)){', '  if (!s.richtig && istArabicrootsWort(w.id)){'] }],
  ['S11 auch der Fachbegriff bekommt eine Hälfte', 'H1', { lernen: ['  if (s === STUFEN.schwer && istArabicrootsWort(w.id)){', '  if (s === STUFEN.schwer){'] }],
  ['S4 sync.js schickt schwerGewusst nicht', 'H4', { sync: ['      if (sg > 0) eintrag.schwerGewusst = sg;', ''] }],
  ['S5 sync.js schickt keine Zählweise', 'H4', { sync: ['body: JSON.stringify({ zaehlweise: AR_ZAEHLWEISE, fortschritt }),', 'body: JSON.stringify({ fortschritt }),'] }],
  ['S6 Übertragung ignoriert schwerGewusst', 'H5', { uebertragung: [HALB, '    const halb = 0;'] }],
  ['S7 ältere App darf schreiben', 'H7', { uebertragung: ['  if (zaehlweise !== ZAEHLWEISE)', '  if (false)'] }],
  ['S8 ohne Deckel bei wrong', 'H6', { uebertragung: [HALB, '    const halb = Math.max(0, Math.floor(Number(p && p.schwerGewusst) || 0));'] }],
  ['S9 App mit alter Zählweise', 'H8', { sync: ['const AR_ZAEHLWEISE = 2;', 'const AR_ZAEHLWEISE = 1;'] }],
  ['S10 ohne Boden bei 0', 'H6', { uebertragung: [HALB, '    const halb = Math.min(falsch, Math.floor(Number(p && p.schwerGewusst) || 0));'] }],
];
for (const [name, ziel, aend] of STOER){
  let fehl;
  try {
    const q = {};
    for (const [datei, [alt, neu]] of Object.entries(aend))
      q[datei] = ersetze({ lernen: LERNEN, sync: SYNC, uebertragung: UEBERTRAGUNG }[datei], alt, neu, name);
    fehl = await pruefeAlles(q);
  } catch (e){ rot++; console.log(`❌ ${name}: ${e.message}`); continue; }
  const treffer = fehl.filter(x => x.startsWith(ziel + ':'));
  if (treffer.length) console.log(`✅ ${name}: rot (${treffer.length}× ${ziel})`);
  else { rot++; console.log(`❌ ${name}: bleibt grün in ${ziel}` + (fehl.length ? ' — andere Meldungen: ' + fehl.slice(0, 2).join(' | ') : '')); }
}
console.log(rot ? `\n❌ ${rot} Befund(e).` : `\n✅ Alles grün: H1–H8, ${STOER.length} Störtests schlagen an.`);
process.exit(rot ? 1 : 0);
