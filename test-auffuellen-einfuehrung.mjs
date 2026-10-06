/* Prüfstand: Auch beim AUFFÜLLEN einer fortgesetzten Runde bekommt ein neues
 * Wort seinen ersten Tag (v656, 06.10.2026) — auffuellenEinordnen() und
 * offeneRundeFortsetzen() in js/lernen.js.
 *
 * Der Anlass. Elias am 05.10.2026 zur Karte „Gast": „das ist aus m1 kap13 das
 * hat keine introduction bekommen. warum? das für mich komplett neues wort".
 * Seine Regel vom 25.09.2026 (bei ersterTagAnordnen() zitiert): ein neues Wort
 * der Lerngruppe kommt an seinem ersten Tag dreimal — Infokarte ganz am Anfang,
 * Übung in der Mitte, die entscheidende Abfrage ganz am Ende.
 * Bis v655 hielt sich nur der BAU einer Runde daran. Wurde eine angefangene
 * Runde beim Fortsetzen aufgefüllt (Tagesziel höher als die Runde, Karte
 * gelöscht, Kapitel dazugewählt), kam ein nie bewertetes Wort als gewöhnliche
 * Abfrage ohne Einführung — und galt danach nie mehr als neu.
 *
 * Alles läuft am ECHTEN Quelltext: die Funktionen werden aus js/lernen.js und
 * js/kern.js geschnitten, auch die Auswahl (tagesAuswahl(), lerngruppeHeute())
 * und die Aufnahme in die Lerngruppe (lerngruppeAufnehmen()). Nachgebildet
 * sind nur der Speicher, der Tag, das Tagesziel und „was ist fällig"
 * (currentPool()) — die Lernstände sind erfunden.
 *
 * Störtests am Ende: je eine Regel wird aus dem Quelltext genommen, und der
 * dafür zuständige Fall MUSS dann scheitern — sonst prüft er nichts.
 *
 * Aufruf:  node test-auffuellen-einfuehrung.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const WURZEL = path.dirname(fileURLToPath(import.meta.url));
const lies = f => fs.readFileSync(path.join(WURZEL, f), 'utf8').replace(/\r\n/g, '\n');
const KERN = lies('js/kern.js'), LERNEN = lies('js/lernen.js');
const HEUTE = '2026-10-06';

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
function stuecke(kern, lernen){
  return [
    stueck(kern, /\nconst INTERVALS = [^\n]*;/, 'INTERVALS'),
    stueck(kern, /\nconst DECKEL_ANTEIL_BOX1 = [^\n]*;/, 'DECKEL_ANTEIL_BOX1'),
    schneide(kern, 'function nieAbgefragt('),
    schneide(kern, 'function neueZuerst('),
    stueck(kern, /\nconst KAPITEL_SEIT_GEMESSEN = \{[\s\S]*?\n\};/, 'KAPITEL_SEIT_GEMESSEN'),
    schneide(kern, 'function kapitelSeitMs('),
    schneide(kern, 'function kapitelRang('),
    schneide(kern, 'function ankunftMs('),
    schneide(kern, 'function tageZwischen('),
    schneide(kern, 'function verspaetung('),
    schneide(kern, 'function istGruppenwort('),
    schneide(kern, 'function lerngruppe('),
    schneide(kern, 'function lerngruppeAufnehmen('),
    schneide(kern, 'function lerngruppeHeute('),
    schneide(kern, 'function tagesAuswahl('),
    schneide(lernen, 'function rundenRolle('),
    schneide(lernen, 'function rundeGezaehlt('),
    schneide(lernen, 'function ersterTagAnordnen('),
    stueck(lernen, /\nconst OFFENE_RUNDE = [^\n]*;/, 'OFFENE_RUNDE'),
    schneide(lernen, 'function rundeSichern('),
    schneide(lernen, 'function rundeVergessen('),
    schneide(lernen, 'function offeneRundeStand('),
    schneide(lernen, 'function rundenZiel('),
    schneide(lernen, 'function nachfolgerNachTausch('),
    schneide(lernen, 'function auffuellenEinordnen('),
    schneide(lernen, 'function offeneRundeFortsetzen(')
  ].join('\n');
}

/* ---------- Erfundene Karten und Lernstände ---------- */
const wdh  = (tag) => ({ box: 3, nextReview: tag, correct: 3, wrong: 0 });
const nie  = (tag) => ({ box: 1, nextReview: tag, correct: 0, wrong: 0 });
const neuHeute = (tag) => ({ box: 1, nextReview: tag, correct: 0, wrong: 0, gruppe: HEUTE, gruppeArt: 'neu' });
const kopie = o => JSON.parse(JSON.stringify(o));
function stand(){
  const P = {};
  for (const id of ['R1', 'R2', 'R3', 'R4', 'R5', 'R6']) P[id] = wdh(HEUTE);
  /* Wiederholungen im Fälligen, unterschiedlich spät: W1 am längsten. */
  P.W1 = wdh('2026-09-20'); P.W2 = wdh('2026-09-24'); P.W3 = wdh('2026-09-28');
  P.W4 = wdh('2026-10-02'); P.W5 = wdh('2026-10-05');
  /* Nie bewertet: N1 kam später als N2 (der Tag ist der der Anlage). */
  P.N1 = nie('2026-10-01'); P.N2 = nie('2026-08-11'); P.B = nie('2026-10-03');
  /* Schon bewertet, steht in Box 1. */
  P.F1 = { box: 1, nextReview: '2026-09-01', correct: 0, wrong: 2 };
  return P;
}
const KARTEN = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'W1', 'W2', 'W3', 'W4', 'W5', 'N1', 'N2', 'B', 'F1', 'A', 'X']
  .map(id => ({ id, book: 'buch-x', chapter: 1 }));
const runde = (ids, idx, ziel, rollen) => JSON.stringify(Object.assign(
  { tag: HEUTE, ids, idx, lautIds: [], ziel, zeit: 1 }, rollen ? { rollen } : {}));

/* ---------- Umgebung ---------- */
function baue(code, opt){
  const store = Object.assign({}, opt.store);
  const bild = [];
  const ctx = { console: { log(){}, warn(){}, error(){} } };
  vm.createContext(ctx);
  vm.runInContext(`
    let PROGRESS = ${JSON.stringify(opt.fortschritt)};
    let SETTINGS = {};
    let SESSION = { words: [], idx: 0, dirs: [], fertig: true, laut: new Set() };
    const VOCAB_DATA = ${JSON.stringify(KARTEN)};
    const __store = ${JSON.stringify(store)};
    const __bild = [];
    let __gespeichert = 0;
    /* Wie LS in js/kern.js: jeder Zugriff geht an den Speicher. */
    const LS = {
      get(k, f){ const v = __store[k]; return v ? JSON.parse(v) : f; },
      set(k, v){ __store[k] = JSON.stringify(v); }
    };
    function todayStr(){ return '${HEUTE}'; }
    function tagesDeckel(){ return ${opt.deckel}; }
    function saveProgress(){ __gespeichert++; }
    function passtZurAuswahl(){ return true; }
    function showScreen(n){ __bild.push(n); }
    /* NACHGEBILDET: was fällig ist, in der Reihenfolge des Falls. */
    const __poolIds = ${JSON.stringify(opt.pool)};
    function currentPool(){
      return __poolIds.map(id => VOCAB_DATA.find(w => w.id === id))
        .filter(w => w && PROGRESS[w.id] && String(PROGRESS[w.id].nextReview) <= todayStr());
    }
    /* NACHGEBILDET: das Tagesziel ist offen, vorziehbare Karten gibt es keine. */
    function zielHeuteOffen(){ return true; }
    function vorziehVorrat(){ return []; }
  `, ctx);
  vm.runInContext(code, ctx);
  const hole = n => vm.runInContext(n, ctx);
  return {
    hole,
    fortsetzen: () => hole('offeneRundeFortsetzen()'),
    reihe: () => hole('SESSION.words.map((w, i) => w.id + (SESSION.rollen[i] ? ":" + SESSION.rollen[i] : "")).join(" ")'),
    idx: () => hole('SESSION.idx'),
    gezaehlt: () => hole('rundeGezaehlt()'),
    fortschritt: () => kopie(hole('PROGRESS')),
    store: () => kopie(hole('__store')),
    hinweis: () => kopie(hole('offeneRundeStand()'))
  };
}

/* Was für JEDE Runde mit einem eingeführten Wort gelten muss — unabhängig von
   der genauen Reihenfolge: dreimal, in der Folge Infokarte → Übung → Abfrage;
   die Abfragen bilden zusammen das Ende; keine Karte mit Rolle ist die letzte. */
function gesetze(reihe, eingefuehrt){
  const e = reihe.split(' ').map(t => { const [id, rolle] = t.split(':'); return { id, rolle: rolle || null }; });
  if (e[e.length - 1].rolle) return 'die letzte Karte trägt eine Rolle (' + e[e.length - 1].id + ') — dort bliebe die Runde stehen';
  for (const id of eingefuehrt){
    const stellen = e.map((x, i) => (x.id === id ? i : -1)).filter(i => i >= 0);
    const rollen = stellen.map(i => e[i].rolle || 'abfrage').join(',');
    if (rollen !== 'info,uebung,abfrage') return id + ' steht als [' + rollen + '] in der Runde, verlangt ist info,uebung,abfrage';
  }
  let ende = e.length;
  while (ende > 0 && !e[ende - 1].rolle && eingefuehrt.includes(e[ende - 1].id)) ende--;
  if (e.length - ende !== eingefuehrt.length)
    return 'die entscheidenden Abfragen stehen nicht zusammen am Ende (am Ende nur ' + (e.length - ende) + ' von ' + eingefuehrt.length + ')';
  const ohne = e.filter(x => !eingefuehrt.includes(x.id)).map(x => x.id);
  if (new Set(ohne).size !== ohne.length) return 'eine gewöhnliche Karte steht doppelt in der Runde';
  return true;
}

function laufe(kern, lernen){
  const code = stuecke(kern, lernen);
  const erg = new Map();
  const fall = (name, fn) => {
    let r;
    try { r = fn(); } catch (e){ r = 'wirft: ' + e.message; }
    erg.set(name, { ok: r === true, zusatz: r === true ? '' : String(r) });
  };

  /* Der Grundfall: sechs Karten gebaut, zwei bewertet, Tagesziel 10 — vier
     fehlen. Fällig sind Wiederholungen, zwei nie bewertete Wörter und ein
     schon bewertetes Box-1-Wort. Nach tagesAuswahl() kommt bei vier Plätzen
     EIN Box-1-Platz, und der geht an das zuletzt gekommene neue Wort (N1). */
  const grund = () => baue(code, { fortschritt: stand(), deckel: 10,
    store: { vt_offeneRunde: runde(['R1', 'R2', 'R3', 'R4', 'R5', 'R6'], 2, 6) },
    pool: ['W1', 'N1', 'W2', 'F1', 'W3', 'W4', 'N2'] });

  fall('F1 Ein nie bewertetes Wort, das beim Auffüllen dazukommt, bekommt Infokarte, Übung und Abfrage — die Infokarte ist das Erste, was er sieht', () => {
    const u = grund();
    if (u.fortsetzen() !== true) return 'die Runde kam nicht zurück';
    const r = u.reihe();
    const soll = 'R1 R2 N1:info R3 R4 R5 N1:uebung R6 W1 W2 W3 N1';
    if (r !== soll) return 'Reihe: ' + r + ' — erwartet: ' + soll;
    if (u.idx() !== 2) return 'der Zeiger steht auf ' + u.idx() + ' statt auf 2 (der Infokarte)';
    if (u.gezaehlt() !== 10) return 'Karten, die zählen: ' + u.gezaehlt() + ' statt 10';
    const p = u.fortschritt().N1;
    if (p.gruppe !== HEUTE || p.gruppeArt !== 'neu') return 'N1 ist nicht als neues Wort in der Lerngruppe: ' + JSON.stringify(p);
    return gesetze(r, ['N1']);
  });

  fall('F2 Steht schon ein eingeführtes Wort in der Runde, bleibt seine Abfrage am Ende: gewöhnliche Auffüllkarten kommen davor, das neu dazugekommene Wort dahinter', () => {
    const P = stand(); P.A = neuHeute('2026-10-02');
    const u = baue(code, { fortschritt: P, deckel: 8,
      store: { vt_offeneRunde: runde(['A', 'R1', 'R2', 'A', 'R3', 'R4', 'A'], 2, 5, ['info', null, null, 'uebung', null, null, null]) },
      pool: ['A', 'W1', 'B', 'W2', 'W3'] });
    u.fortsetzen();
    const r = u.reihe();
    const soll = 'A:info R1 B:info R2 A:uebung R3 B:uebung R4 W1 W2 A B';
    if (r !== soll) return 'Reihe: ' + r + ' — erwartet: ' + soll;
    if (u.gezaehlt() !== 8) return 'Karten, die zählen: ' + u.gezaehlt() + ' statt 8';
    return gesetze(r, ['A', 'B']);
  });

  fall('F3 Ohne neues Wort ändert sich nichts: die Auffüllkarten hängen wie bisher hinten an', () => {
    const u = baue(code, { fortschritt: stand(), deckel: 10,
      store: { vt_offeneRunde: runde(['R1', 'R2', 'R3', 'R4', 'R5', 'R6'], 2, 6) },
      pool: ['W1', 'W2', 'W3', 'W4', 'W5'] });
    u.fortsetzen();
    const r = u.reihe();
    return (r === 'R1 R2 R3 R4 R5 R6 W1 W2 W3 W4' && u.idx() === 2) ? true : 'Reihe: ' + r + ', Zeiger ' + u.idx();
  });

  fall('F4 Ein neues Wort der Lerngruppe von HEUTE, das noch nicht beantwortet ist und nicht in der Runde steht, bekommt beim Auffüllen ebenfalls seinen ersten Tag', () => {
    const P = stand(); P.X = neuHeute('2026-08-11');
    const u = baue(code, { fortschritt: P, deckel: 6,
      store: { vt_offeneRunde: runde(['R1', 'R2', 'R3', 'R4'], 1, 4) },
      pool: ['W1', 'X', 'W2'] });
    u.fortsetzen();
    const r = u.reihe();
    const soll = 'R1 X:info R2 R3 X:uebung R4 W1 X';
    if (r !== soll) return 'Reihe: ' + r + ' — erwartet: ' + soll;
    return gesetze(r, ['X']);
  });

  fall('F5 Ist nichts weiter fällig, bleibt die Runde, wie sie war', () => {
    const u = baue(code, { fortschritt: stand(), deckel: 10,
      store: { vt_offeneRunde: runde(['R1', 'R2', 'R3', 'R4', 'R5', 'R6'], 2, 6) }, pool: [] });
    if (u.fortsetzen() !== true) return 'die Runde kam nicht zurück';
    const r = u.reihe();
    return (r === 'R1 R2 R3 R4 R5 R6' && u.idx() === 2) ? true : 'Reihe: ' + r + ', Zeiger ' + u.idx();
  });

  fall('F6 Steht er schon auf der entscheidenden Abfrage eines eingeführten Wortes, kommt die Infokarte des dazugekommenen trotzdem zuerst, und beide Abfragen bleiben das Ende', () => {
    const P = stand(); P.A = neuHeute('2026-10-02');
    const u = baue(code, { fortschritt: P, deckel: 5,
      store: { vt_offeneRunde: runde(['A', 'R1', 'A', 'R2', 'A'], 4, 3, ['info', null, 'uebung', null, null]) },
      pool: ['A', 'W1', 'B'] });
    u.fortsetzen();
    const r = u.reihe();
    const soll = 'A:info R1 A:uebung R2 B:info B:uebung W1 A B';
    if (r !== soll) return 'Reihe: ' + r + ' — erwartet: ' + soll;
    if (u.idx() !== 4) return 'der Zeiger steht auf ' + u.idx() + ' statt auf 4';
    return gesetze(r, ['A', 'B']);
  });

  fall('F7 App zu und wieder auf: vor dem ersten Antippen dieselbe Runde noch einmal, nach „Weiter" auf der Infokarte geht es dahinter weiter — die Rollen sind mitgesichert', () => {
    const a = grund();
    const vorher = a.store().vt_offeneRunde;
    a.fortsetzen();
    const reihe1 = a.reihe();
    if (a.store().vt_offeneRunde !== vorher) return 'schon das Fortsetzen hat die gesicherte Runde verändert';
    /* zweiter Start, ohne dass er etwas angetippt hat: N1 ist jetzt Mitglied der Lerngruppe */
    const b = baue(code, { fortschritt: a.fortschritt(), deckel: 10, store: a.store(), pool: ['W1', 'N1', 'W2', 'F1', 'W3', 'W4', 'N2'] });
    b.fortsetzen();
    if (b.reihe() !== reihe1) return 'zweiter Start: ' + b.reihe() + ' — erwartet dieselbe Reihe: ' + reihe1;
    /* „Weiter" auf der Infokarte — genau das tut answer() bei einer Karte mit Rolle */
    b.hole('rundeSichern(SESSION.idx + 1); SESSION.idx++;');
    const c = baue(code, { fortschritt: b.fortschritt(), deckel: 10, store: b.store(), pool: ['W1', 'N1', 'W2', 'F1', 'W3', 'W4', 'N2'] });
    c.fortsetzen();
    if (c.reihe() !== reihe1) return 'dritter Start: ' + c.reihe() + ' — erwartet: ' + reihe1;
    if (c.idx() !== 3) return 'dritter Start: Zeiger ' + c.idx() + ' statt 3';
    return true;
  });

  fall('F8 Der Hinweis auf der Startseite zählt ein neues Wort weiter als EINE Karte: 8 fehlen von 10 — vor dem Fortsetzen und danach', () => {
    const a = grund();
    const soll = JSON.stringify({ fehlt: 8, gesamt: 10 });
    if (JSON.stringify(a.hinweis()) !== soll) return 'vorher: ' + JSON.stringify(a.hinweis());
    a.fortsetzen();
    a.hole('rundeSichern(SESSION.idx + 1); SESSION.idx++;');
    const b = baue(code, { fortschritt: a.fortschritt(), deckel: 10, store: a.store(), pool: ['W1', 'N1', 'W2', 'F1', 'W3', 'W4', 'N2'] });
    return JSON.stringify(b.hinweis()) === soll ? true : 'danach: ' + JSON.stringify(b.hinweis());
  });

  fall('F9 Im Quelltext: das Fortsetzen ordnet genau einmal ein, NACH der Aufnahme in die Lerngruppe, und hängt selbst keine Karte mehr an; welches Wort neu ist, fragt das Einordnen bei ersterTagAnordnen()', () => {
    const ohneKomm = q => q.replace(/\/\*[\s\S]*?\*\//g, '');
    const fort = ohneKomm(schneide(lernen, 'function offeneRundeFortsetzen('));
    if (fort.split('auffuellenEinordnen(').length - 1 !== 1) return 'nicht genau ein Aufruf von auffuellenEinordnen()';
    const auf = fort.indexOf('lerngruppeAufnehmen(nach)'), ein = fort.indexOf('auffuellenEinordnen(');
    if (!(auf > 0 && ein > auf)) return 'die Aufnahme in die Lerngruppe steht nicht vor dem Einordnen';
    if (fort.slice(fort.indexOf('tagesAuswahl(rest')).includes('.push(')) return 'nach der Auswahl wird noch eine Karte von Hand angehängt';
    const ordnen = ohneKomm(schneide(lernen, 'function auffuellenEinordnen('));
    if (!ordnen.includes('ersterTagAnordnen(dazu)')) return 'das Einordnen fragt nicht ersterTagAnordnen()';
    if (ordnen.includes('PROGRESS')) return 'das Einordnen liest den Lernstand selbst — dann gäbe es zwei Stellen für „heute neu"';
    return true;
  });

  return erg;
}

let rot = 0;
const erg = laufe(KERN, LERNEN);
console.log('=== Auch beim Auffüllen: der erste Tag eines neuen Wortes ===');
for (const [name, e] of erg){ if (!e.ok) rot++; console.log((e.ok ? '  ok   ' : '  FEHL ') + name + (e.zusatz ? '  -> ' + e.zusatz : '')); }

function ersetze(quelle, alt, neu, wo){
  const n = quelle.split(alt).length - 1;
  if (n !== 1) throw new Error('Störtest „' + wo + '": die Stelle kommt ' + n + '-mal vor (erwartet 1) — Quelltext hat sich geändert');
  return quelle.replace(alt, () => neu);
}
const AUFRUF = '    auffuellenEinordnen(words, rollen, idx, nach.slice(0, Math.max(0, ziel - gezaehlt())));\n';
const AUFNAHME = "    if (typeof lerngruppeAufnehmen === 'function') lerngruppeAufnehmen(nach);\n";
const STOER = [
  /* `bleibt`: F3 und F5 müssen auch mit der alten Fassung grün sein — das ist der
     Beleg, dass sich für eine Runde OHNE neues Wort nichts geändert hat. (F7 prüft
     nur, dass ein zweiter Start dasselbe ergibt; das galt vorher auch.) */
  { name: 'S1 wie bis v655: jede Auffüllkarte ohne Rolle hinten an', muss: ['F1', 'F2', 'F4', 'F6', 'F9'], bleibt: ['F3', 'F5'],
    lernen: q => ersetze(q, AUFRUF, '    for (const w of nach){\n      if (gezaehlt() >= ziel) break;\n      words.push(w); rollen.push(null);\n    }\n', 'S1') },
  { name: 'S2 ohne die Übung in der Mitte', muss: ['F1', 'F2', 'F4'],
    lernen: q => ersetze(ersetze(q,
      '    ...neu, ...offenW.slice(0, mitte), ...neu, ...offenW.slice(mitte), ...schlussW, ...neu);',
      '    ...neu, ...offenW.slice(0, mitte), ...offenW.slice(mitte), ...schlussW, ...neu);', 'S2 Wörter'),
      "    ...neu.map(() => 'info'), ...offenR.slice(0, mitte), ...neu.map(() => 'uebung'), ...offenR.slice(mitte),",
      "    ...neu.map(() => 'info'), ...offenR.slice(0, mitte), ...offenR.slice(mitte),", 'S2 Rollen') },
  { name: 'S3 die Abfrage eines schon eingeführten Wortes bleibt nicht am Ende', muss: ['F2', 'F6'],
    lernen: q => ersetze(q, '  while (ende > idx && !rollen[ende - 1] && eingefuehrt.has(String(words[ende - 1].id))) ende--;\n', '', 'S3') },
  { name: 'S4 die Übung gleich hinter der Infokarte statt in der Mitte', muss: ['F1', 'F2', 'F4'],
    lernen: q => ersetze(q, '  const mitte = Math.floor(offenW.length / 2);', '  const mitte = 0;', 'S4') },
  { name: 'S5 erst einordnen, dann in die Lerngruppe aufnehmen', muss: ['F1', 'F2', 'F9'],
    lernen: q => ersetze(ersetze(q, AUFNAHME, '', 'S5 Aufnahme'), AUFRUF, AUFRUF + AUFNAHME, 'S5 Aufruf') },
  { name: 'S6 die Infokarte nicht an der Stelle, an der er weitermacht', muss: ['F1', 'F4'],
    lernen: q => ersetze(ersetze(q,
      '    ...neu, ...offenW.slice(0, mitte), ...neu, ...offenW.slice(mitte), ...schlussW, ...neu);',
      '    ...offenW.slice(0, 1), ...neu, ...offenW.slice(1, mitte), ...neu, ...offenW.slice(mitte), ...schlussW, ...neu);', 'S6 Wörter'),
      "    ...neu.map(() => 'info'), ...offenR.slice(0, mitte), ...neu.map(() => 'uebung'), ...offenR.slice(mitte),",
      "    ...offenR.slice(0, 1), ...neu.map(() => 'info'), ...offenR.slice(1, mitte), ...neu.map(() => 'uebung'), ...offenR.slice(mitte),", 'S6 Rollen') },
  { name: 'S7 ohne die entscheidende Abfrage am Ende', muss: ['F1', 'F2', 'F4', 'F6'],
    lernen: q => ersetze(ersetze(q,
      ' ...schlussW, ...neu);', ' ...schlussW);', 'S7 Wörter'),
      '    ...schlussR, ...neu.map(() => null));', '    ...schlussR);', 'S7 Rollen') }
];
console.log('\n=== Störtests: ohne die Regel MUSS der zuständige Fall scheitern ===');
for (const s of STOER){
  let e;
  try { e = laufe(KERN, s.lernen(LERNEN)); }
  catch (err){ rot++; console.log('  FEHL ' + s.name + '  -> ' + err.message); continue; }
  const gescheitert = [...e].filter(([, v]) => !v.ok).map(([n]) => n.split(' ')[0]);
  const fehlt = s.muss.filter(k => !gescheitert.includes(k));
  const zuviel = (s.bleibt || []).filter(k => gescheitert.includes(k));
  if (fehlt.length){ rot++; console.log('  FEHL ' + s.name + '  -> ' + fehlt.join(', ') + ' blieb grün (gescheitert: ' + (gescheitert.join(', ') || 'nichts') + ')'); }
  else if (zuviel.length){ rot++; console.log('  FEHL ' + s.name + '  -> ' + zuviel.join(', ') + ' scheitert, sollte aber auch ohne die Regel grün bleiben'); }
  else console.log('  ok   ' + s.name + '  -> scheitert wie verlangt: ' + gescheitert.join(', '));
}
console.log('\n' + (rot ? rot + ' Befund(e).' : 'Alles grün: ' + erg.size + ' Fälle, ' + STOER.length + ' Störtests.'));
process.exit(rot ? 1 : 0);
