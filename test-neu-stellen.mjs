/* Prüfstand für den einmaligen Schritt „20 nur angetippte Karten zurück auf neu"
 * (v653, 05.10.2026) — neuStellenEinmalig() in js/kern.js, Aufruf in gleicheAb()
 * in js/sync.js.
 *
 * Warum das hier steht: Der Schritt ÄNDERT Elias' Lernstand. Er hat dazu „ja"
 * gesagt — für genau 20 Karten und genau dieses eine: zurück auf „nie bewertet",
 * damit sie mit Einführung kommen. Geprüft wird deshalb vor allem, was der
 * Schritt NICHT tun darf:
 *   - keine andere Karte anfassen,
 *   - kein zweites Mal zurückstellen, was er danach MIT Einführung gelernt hat
 *     (auch nicht vom zweiten Gerät mit altem Stand aus),
 *   - nicht vor dem Zusammenführen mit dem Server laufen,
 *   - nicht auf dem PC laufen (dort gibt es keinen Abgleich),
 *   - eine Karte nicht mitten in einer offenen Runde zurückstellen.
 *
 * Alles läuft am ECHTEN Quelltext: die Funktionen werden aus js/kern.js und
 * js/lernen.js geschnitten, js/sync.js läuft ganz. Die Lernstände sind erfunden
 * und nur in der Form seinem Stand vom 05.10.2026 nachgebaut.
 *
 * Störtests am Ende: je eine Regel wird aus dem Quelltext genommen, und der
 * dafür zuständige Fall MUSS dann scheitern — sonst prüft er nichts.
 *
 * Aufruf:  node test-neu-stellen.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const WURZEL = path.dirname(fileURLToPath(import.meta.url));
const lies = f => fs.readFileSync(path.join(WURZEL, f), 'utf8').replace(/\r\n/g, '\n');
const KERN = lies('js/kern.js'), LERNEN = lies('js/lernen.js'), SYNC = lies('js/sync.js');

/* Die 20 Kennungen, hier UNABHÄNGIG vom Quelltext aufgeschrieben (aus seinem
   Stand gemessen am 05.10.2026, 01:06 und 03:01): Madina 1, Kapitel 10 bis 13. */
const IDS = ['45899', '45900', '45901', '45902', '45903', '45904', '45905', '45906', '45907', '45908',
  '45909', '45910', '45911', '45912', '45913', '45914', '45915', '45916', '45917', '45920'];
const HEUTE = '2026-10-05';
const T_SEPT  = Date.parse('2026-09-04T02:26:00+02:00');
const T_NACHT = Date.parse('2026-10-05T01:03:13+02:00');
const T1 = Date.parse('2026-10-05T14:00:00+02:00');   /* erstes Gerät stellt zurück */
const T5 = T1 + 30 * 60 * 1000;                        /* Antwort ohne Einführung auf dem anderen Gerät */
const T3 = T1 + 60 * 60 * 1000;                        /* er lernt „Gast" mit Einführung */
const T4 = T1 + 2 * 60 * 60 * 1000;                    /* zweites Gerät öffnet die App */

/* ---------- Quelltext schneiden ---------- */
function schneide(quelle, kopf){
  const a = quelle.indexOf('\n' + kopf);
  if (a < 0) throw new Error('im Quelltext nicht gefunden: ' + kopf);
  let i = quelle.indexOf('{', quelle.indexOf(')', a));
  let tiefe = 0;
  for (; i < quelle.length; i++){
    if (quelle[i] === '{') tiefe++;
    else if (quelle[i] === '}'){ tiefe--; if (!tiefe) return quelle.slice(a + 1, i + 1); }
  }
  throw new Error('kein Ende gefunden: ' + kopf);
}
function konstante(quelle, name){
  const m = quelle.match(new RegExp('\\nconst ' + name + ' = [\\s\\S]*?;\\n'));
  if (!m) throw new Error('Konstante nicht gefunden: ' + name);
  return m[0].trim();
}
function kernStuecke(kern, lernen){
  return [
    schneide(kern, 'function nieAbgefragt('),
    schneide(kern, 'function istGruppenwort('),
    schneide(kern, 'function lerngruppeAufnehmen('),
    konstante(kern, 'NEU_STELLEN_IDS'),
    konstante(kern, 'NEU_STELLEN_TAG'),
    konstante(kern, 'NEU_STELLEN_MERKER'),
    schneide(kern, 'function neuStellenInOffenerRunde('),
    schneide(kern, 'function neuStellenEinmalig('),
    schneide(lernen, 'function ersterTagAnordnen(')
  ].join('\n');
}

/* ---------- Erfundene Lernstände ---------- */
const kopie = o => JSON.parse(JSON.stringify(o));
function alterStand(){
  const P = {};
  IDS.forEach((id, i) => {
    P[id] = { box: 1, nextReview: '2026-09-0' + (1 + i % 6), correct: 0, wrong: 1 + (i % 2), ts: T_SEPT + i * 1000 };
  });
  /* „Gast": am 06.09. einmal richtig, in der Nacht zum 05.10. einmal falsch. */
  P['45913'] = { box: 1, nextReview: '2026-10-04', correct: 1, wrong: 1, ts: T_NACHT, zurueck: '2026-10-04' };
  /* Nachbarn, die NICHT in der Liste stehen (alle erfunden). */
  P['90001'] = { box: 1, nextReview: '2026-08-11', correct: 0, wrong: 0 };
  P['90002'] = { box: 1, nextReview: '2026-09-06', correct: 0, wrong: 2, ts: T_SEPT };
  P['90003'] = { box: 1, nextReview: '2026-10-05', correct: 0, wrong: 7, ts: T_SEPT, gruppe: '2026-09-29', gruppeArt: 'frueher' };
  P['90004'] = { box: 1, nextReview: '2026-10-06', correct: 0, wrong: 1, ts: T_NACHT, gruppe: '2026-10-04', gruppeArt: 'neu' };
  P['90005'] = { box: 5, nextReview: '2026-10-20', correct: 9, wrong: 1, ts: T_SEPT };
  return P;
}
function zurueckgestellt(alt, zeit){
  return { box: 1, nextReview: '2026-08-11', correct: 0, wrong: 0, ts: zeit, neuGestellt: zeit, vorher: kopie(alt) };
}
/* Der Stand, nachdem das ERSTE Gerät um T1 zurückgestellt hat. */
function standNachErstemGeraet(){
  const P = alterStand();
  for (const id of IDS) P[id] = zurueckgestellt(P[id], T1);
  return P;
}

/* ---------- Umgebung: nur die Kernstücke ---------- */
const SPIEGEL = `
  /* Wie initProgress() in js/kern.js: ein unlesbarer Speicher ergibt einen leeren Stand. */
  function __liesStand(){ try { return JSON.parse(localStorage.getItem('vt_progress') || '{}') || {}; } catch (e){ return {}; } }
  let PROGRESS = __liesStand();
  let SESSION = { words: [], idx: 0, dirs: [], fertig: true };
  const __fehler = [];
  function stillerFehler(wo, e){ __fehler.push(String(wo)); }
  /* Dasselbe Verhalten wie LS in js/kern.js: lesen mit Rückfall, schreiben mit
     Meldung an den Abgleich. */
  const LS = {
    get(key, fallback){ try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e){ return fallback; } },
    set(key, val){
      try { localStorage.setItem(key, JSON.stringify(val)); } catch (e){ stillerFehler('Speichern: ' + key, e); }
      if (typeof syncGeaendert === 'function') syncGeaendert(key);
    }
  };
  function todayStr(){ return '${HEUTE}'; }
  function tagesDeckel(){ return 15; }
  function saveProgress(){ LS.set('vt_progress', PROGRESS); }
  function ladeStandNeu(){ PROGRESS = __liesStand(); }
  function toast(){}
  let __jetzt = 0;
  Date.now = () => __jetzt;
`;
function speicherBauen(start, opt){
  const speicher = Object.assign({}, start);
  const geschrieben = [];
  return { speicher, geschrieben, localStorage: {
    getItem: k => (k in speicher ? speicher[k] : null),
    setItem: (k, v) => {
      if (opt && opt.voll && k === opt.voll) throw new Error('QuotaExceededError');
      speicher[k] = String(v); geschrieben.push(k);
    },
    removeItem: k => { delete speicher[k]; }
  } };
}
function baueKern(stuecke, stand, opt = {}){
  const start = Object.assign({}, opt.speicher || {});
  if (stand !== undefined) start.vt_progress = typeof stand === 'string' ? stand : JSON.stringify(stand);
  const s = speicherBauen(start, opt);
  const ctx = { localStorage: s.localStorage, console: { log(){}, warn(){}, error(){} } };
  vm.createContext(ctx);
  vm.runInContext(SPIEGEL + '\nconst __gemeldet = [];\nfunction syncGeaendert(k){ __gemeldet.push(k); }', ctx);
  vm.runInContext(stuecke, ctx);
  const hole = n => vm.runInContext(n, ctx);
  hole('__jetzt = ' + (opt.jetzt || T1));
  return { ctx, hole, speicher: s.speicher, geschrieben: s.geschrieben,
    stand: () => JSON.parse(s.speicher.vt_progress),
    merker: () => (s.speicher.vt_neuGestellt ? JSON.parse(s.speicher.vt_neuGestellt) : null) };
}

/* ---------- Umgebung: der ganze Abgleich ---------- */
function baueAbgleich(stuecke, syncQuelle, lokal, server, opt = {}){
  const start = { vt_syncStatus: JSON.stringify({ ok: true, text: 'Prüfstand', zeit: 1, erfolg: 1 }) };
  if (lokal) start.vt_progress = JSON.stringify(lokal);
  const s = speicherBauen(start, opt);
  const netz = { server, aufrufe: [] };
  const ctx = {
    localStorage: s.localStorage,
    document: { addEventListener(){}, getElementById(){ return null; }, visibilityState: 'visible', hidden: false },
    location: { protocol: 'https:', hostname: opt.hostname || 'vokabeltrainer.example' },
    navigator: { onLine: true },
    fetch: async (url, o) => {
      const methode = (o && o.method) || 'GET';
      netz.aufrufe.push(methode + ' ' + url);
      if (url === '/api/stand' && methode === 'GET'){
        if (netz.server === null) return { ok: false, status: 404, redirected: false, json: async () => ({}) };
        return { ok: true, status: 200, redirected: false, json: async () => kopie(netz.server) };
      }
      if (url === '/api/stand' && methode === 'PUT'){
        netz.server = JSON.parse(o.body);
        return { ok: true, status: 200, redirected: false, json: async () => ({ ok: true }) };
      }
      if (url === '/api/arabicroots') return { ok: true, status: 200, redirected: false, json: async () => ({}) };
      throw new Error('unerwarteter Abruf: ' + methode + ' ' + url);
    },
    setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
    console: { log(){}, warn(){}, error(){} }
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(SPIEGEL, ctx);
  vm.runInContext(stuecke, ctx);
  vm.runInContext(syncQuelle, ctx);
  const hole = n => vm.runInContext(n, ctx);
  hole('__jetzt = ' + (opt.jetzt || T1));
  return { ctx, hole, netz, speicher: s.speicher,
    stand: () => JSON.parse(s.speicher.vt_progress),
    serverStand: () => JSON.parse(netz.server.daten.vt_progress),
    merker: () => (s.speicher.vt_neuGestellt ? JSON.parse(s.speicher.vt_neuGestellt) : null) };
}
const nutzlast = P => ({ fassung: 1, geaendert: T_NACHT, stempel: { vt_progress: T_NACHT }, daten: { vt_progress: JSON.stringify(P) } });
const gleich = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const istNeu = p => !!p && p.box === 1 && p.correct === 0 && p.wrong === 0 && p.nextReview === '2026-08-11';

/* ---------- Die Fälle ---------- */
async function laufe(kern, sync){
  const erg = new Map();
  const stuecke = kernStuecke(kern, LERNEN);
  const fall = async (name, tun) => {
    try { const r = await tun(); erg.set(name, r === true ? { ok: true } : { ok: false, zusatz: String(r) }); }
    catch (e){ erg.set(name, { ok: false, zusatz: 'geworfen: ' + e.message }); }
  };

  await fall('K1 Grundfall: alle 20 stehen als nie bewertet da, mit Stempel, Vermerk und dem alten Eintrag', () => {
    const alt = alterStand();
    const u = baueKern(stuecke, alt);
    if (u.hole('neuStellenEinmalig()') !== true) return 'Rückgabe nicht true';
    const neu = u.stand();
    for (const id of IDS){
      const p = neu[id];
      if (!istNeu(p)) return id + ' ist nicht neu: ' + JSON.stringify(p);
      if (p.ts !== T1 || p.neuGestellt !== T1) return id + ' ohne Stempel/Vermerk von jetzt';
      if (!gleich(p.vorher, alt[id])) return id + ': vorher stimmt nicht';
      if ('gruppe' in p || 'gruppeArt' in p || 'zurueck' in p) return id + ' trägt noch gruppe/zurueck';
      if (u.hole('nieAbgefragt({ id: "' + id + '" })') !== true) return id + ': nieAbgefragt() sagt nein';
      if (!gleich(u.hole('PROGRESS["' + id + '"]'), p)) return id + ': Arbeitsspeicher und Speicher verschieden';
    }
    const m = u.merker();
    if (!m || m.fertig !== T1 || m.wartet.length || !gleich(m.gestellt.slice().sort(), IDS.slice().sort())) return 'Merker: ' + JSON.stringify(m);
    if (u.hole('__gemeldet.filter(k => k === "vt_progress").length') !== 1) return 'dem Abgleich nicht genau einmal gemeldet';
    return true;
  });

  await fall('K2 Keine andere Karte: alle übrigen Einträge und die Schlüsselmenge bleiben gleich', () => {
    const alt = alterStand();
    const u = baueKern(stuecke, alt);
    u.hole('neuStellenEinmalig()');
    const neu = u.stand();
    if (!gleich(Object.keys(neu), Object.keys(alt))) return 'Schlüsselmenge geändert';
    for (const id of Object.keys(alt)) if (!IDS.includes(id) && !gleich(neu[id], alt[id])) return id + ' wurde geändert';
    const fremd = u.geschrieben.filter(k => k !== 'vt_progress' && k !== 'vt_neuGestellt');
    return fremd.length ? 'andere Speicherschlüssel geschrieben: ' + fremd.join(', ') : true;
  });

  await fall('K3 Zweiter Aufruf tut nichts und schreibt nichts', () => {
    const u = baueKern(stuecke, alterStand());
    u.hole('neuStellenEinmalig()');
    const vorher = u.speicher.vt_progress, n = u.geschrieben.length;
    u.hole('__jetzt = ' + T4);
    if (u.hole('neuStellenEinmalig()') !== false) return 'Rückgabe nicht false';
    return (u.speicher.vt_progress === vorher && u.geschrieben.length === n) ? true : 'es wurde geschrieben';
  });

  await fall('K4 Vermerk da und danach gelernt: der Eintrag bleibt (kein zweites Zurückstellen)', () => {
    const P = standNachErstemGeraet();
    P['45913'] = Object.assign(P['45913'], { box: 2, nextReview: '2026-10-08', correct: 1, wrong: 0, ts: T3 });
    const gelernt = kopie(P['45913']);
    const u = baueKern(stuecke, P, { jetzt: T4 });
    if (u.hole('neuStellenEinmalig()') !== false) return 'Rückgabe nicht false';
    if (!gleich(u.stand()['45913'], gelernt)) return 'Gast wurde verändert: ' + JSON.stringify(u.stand()['45913']);
    const m = u.merker();
    return (m && m.fertig === T4) ? true : 'Merker fehlt';
  });

  await fall('K5 Box 3 oder höher bleibt, wie sie ist', () => {
    const P = alterStand();
    P['45900'] = { box: 3, nextReview: '2026-10-09', correct: 2, wrong: 2, ts: T_NACHT };
    const alt = kopie(P['45900']);
    const u = baueKern(stuecke, P);
    u.hole('neuStellenEinmalig()');
    if (!gleich(u.stand()['45900'], alt)) return 'Box-3-Karte verändert';
    const m = u.merker();
    if (!m || m.gelassen['45900'] !== 'Box 3' || !m.fertig) return 'Merker: ' + JSON.stringify(m);
    return IDS.filter(id => id !== '45900').every(id => istNeu(u.stand()[id])) ? true : 'die anderen 19 nicht alle neu';
  });

  await fall('K6 Schon nie bewertet (auch von Hand in Box 5 gelegt): bleibt Zeichen für Zeichen', () => {
    const P = alterStand();
    P['45901'] = { box: 1, nextReview: '2026-08-11', correct: 0, wrong: 0 };
    P['45902'] = { box: 5, nextReview: '2026-11-04', correct: 0, wrong: 0, ts: T_NACHT };
    const a = kopie(P['45901']), b = kopie(P['45902']);
    const u = baueKern(stuecke, P);
    u.hole('neuStellenEinmalig()');
    return (gleich(u.stand()['45901'], a) && gleich(u.stand()['45902'], b)) ? true : 'verändert';
  });

  await fall('K7 Offene Runde von heute (gesichert): was noch kommt, wartet — danach wird nachgeholt', () => {
    const runde = { tag: HEUTE, ids: ['90005', '45914', '45915'], idx: 1, rollen: [null, null, null], ziel: 3, zeit: T1 };
    const u = baueKern(stuecke, alterStand(), { speicher: { vt_offeneRunde: JSON.stringify(runde) } });
    const alt = alterStand();
    if (u.hole('neuStellenEinmalig()') !== true) return 'Rückgabe nicht true';
    let neu = u.stand();
    if (!gleich(neu['45914'], alt['45914']) || !gleich(neu['45915'], alt['45915'])) return 'Karte der offenen Runde wurde zurückgestellt';
    if (IDS.filter(id => istNeu(neu[id])).length !== 18) return 'nicht genau 18 zurückgestellt';
    let m = u.merker();
    if (!m || m.fertig || !gleich(m.wartet, ['45914', '45915'])) return 'Merker 1: ' + JSON.stringify(m);
    /* Die Runde ist vorbei (rundeVergessen() schreibt null). */
    u.speicher.vt_offeneRunde = 'null';
    u.hole('__jetzt = ' + T5);
    if (u.hole('neuStellenEinmalig()') !== true) return 'zweiter Lauf: Rückgabe nicht true';
    neu = u.stand(); m = u.merker();
    if (!istNeu(neu['45914']) || !istNeu(neu['45915']) || neu['45914'].ts !== T5) return 'nicht nachgeholt';
    if (neu['45899'].ts !== T1) return 'eine schon zurückgestellte Karte wurde neu gestempelt';
    return (m.fertig === T5 && m.gestellt.length === 20) ? true : 'Merker 2: ' + JSON.stringify(m);
  });

  await fall('K8 Offene Runde: schon beantwortet (vor dem Zeiger) oder von gestern → wartet nicht', () => {
    const a = baueKern(stuecke, alterStand(), { speicher: { vt_offeneRunde: JSON.stringify({ tag: HEUTE, ids: ['45914', '90005'], idx: 1 }) } });
    a.hole('neuStellenEinmalig()');
    if (!istNeu(a.stand()['45914']) || !a.merker().fertig) return 'vor dem Zeiger: nicht zurückgestellt';
    const b = baueKern(stuecke, alterStand(), { speicher: { vt_offeneRunde: JSON.stringify({ tag: '2026-10-04', ids: ['45914', '45915'], idx: 0 }) } });
    b.hole('neuStellenEinmalig()');
    return (istNeu(b.stand()['45914']) && istNeu(b.stand()['45915']) && b.merker().fertig) ? true : 'Runde von gestern hält auf';
  });

  await fall('K9 Laufende Runde im Arbeitsspeicher: die Karte am Zeiger und dahinter wartet', () => {
    const u = baueKern(stuecke, alterStand());
    u.hole('SESSION = { words: [{ id: "45916" }, { id: "45917" }], idx: 1, dirs: [], fertig: false }');
    u.hole('neuStellenEinmalig()');
    const alt = alterStand(), neu = u.stand();
    if (!istNeu(neu['45916'])) return 'schon beantwortete Karte nicht zurückgestellt';
    if (!gleich(neu['45917'], alt['45917'])) return 'Karte am Zeiger wurde zurückgestellt';
    if (u.merker().fertig) return 'Merker steht zu früh';
    u.hole('SESSION = { words: [{ id: "45916" }, { id: "45917" }], idx: 2, dirs: [], fertig: true }');
    u.hole('neuStellenEinmalig()');
    return (istNeu(u.stand()['45917']) && u.merker().fertig) ? true : 'nach der Runde nicht nachgeholt';
  });

  await fall('K10 Mitglied der Lerngruppe: fällt sauber heraus und kommt als NEUES Wort mit Einführung wieder', () => {
    const P = alterStand();
    P['45904'] = { box: 1, nextReview: '2026-10-06', correct: 0, wrong: 3, ts: T_NACHT, gruppe: '2026-10-03', gruppeArt: 'frueher' };
    const u = baueKern(stuecke, P);
    if (u.hole('istGruppenwort({ id: "45904" })') !== true) return 'Ausgangslage: kein Gruppenwort';
    u.hole('neuStellenEinmalig()');
    if (u.hole('istGruppenwort({ id: "45904" })') !== false) return 'ist noch Gruppenwort';
    if (u.hole('lerngruppeAufnehmen([{ id: "45904" }])') !== 1) return 'wird nicht aufgenommen';
    const p = u.hole('PROGRESS["45904"]');
    if (p.gruppeArt !== 'neu' || p.gruppe !== HEUTE) return 'aufgenommen als ' + p.gruppeArt;
    const rollen = u.hole('(() => { const w = { id: "45904" }, a = { id: "90005" }, b = { id: "90002" }; const r = ersterTagAnordnen([w, a, b]); return r.worte.map((x, i) => x.id + ":" + r.rollen[i]).join(" "); })()');
    return rollen === '45904:info 90005:null 45904:uebung 90002:null 45904:null' ? true : 'Anordnung: ' + rollen;
  });

  await fall('K11 Gegenprobe ohne den Schritt: dasselbe Wort käme als „früheres" und OHNE Einführung', () => {
    const u = baueKern(stuecke, alterStand());
    u.hole('lerngruppeAufnehmen([{ id: "45905" }])');
    const p = u.hole('PROGRESS["45905"]');
    if (p.gruppeArt !== 'frueher') return 'Art: ' + p.gruppeArt;
    const rollen = u.hole('ersterTagAnordnen([{ id: "45905" }, { id: "90005" }]).rollen.join(",")');
    return rollen === ',' ? true : 'Rollen: ' + rollen;
  });

  await fall('K12 Speicher voll: nichts geschieht, nichts wird gemerkt, der Fehler wird gemeldet', () => {
    const alt = alterStand();
    const u = baueKern(stuecke, alt, { voll: 'vt_progress' });
    /* Der Startwert steht schon da (er wurde nicht über setItem geschrieben). */
    if (u.hole('neuStellenEinmalig()') !== false) return 'Rückgabe nicht false';
    if (!gleich(u.stand(), alt)) return 'Stand verändert';
    if (u.merker()) return 'Merker steht trotzdem';
    return u.hole('__fehler.length') === 1 ? true : 'kein stiller Fehler gemeldet';
  });

  await fall('K13 Kaputter oder leerer Lernstand: nichts geschieht', () => {
    for (const roh of ['{kaputt', 'null', '[]']){
      const u = baueKern(stuecke, undefined, { speicher: { vt_progress: roh } });
      vm.runInContext('PROGRESS = {}', u.ctx);
      if (u.hole('neuStellenEinmalig()') !== false) return roh + ': Rückgabe nicht false';
      if (u.speicher.vt_progress !== roh || u.merker()) return roh + ': es wurde geschrieben';
    }
    return true;
  });

  await fall('K14 Nach dem Durchgang bleibt ein späterer Eintrag ohne Vermerk stehen (etwa nach einem Tausch)', () => {
    const u = baueKern(stuecke, alterStand());
    u.hole('neuStellenEinmalig()');
    const P = u.stand();
    P['45899'] = { box: 2, nextReview: '2026-10-09', correct: 3, wrong: 1, ts: T_SEPT };
    u.speicher.vt_progress = JSON.stringify(P);
    u.hole('__jetzt = ' + T4);
    if (u.hole('neuStellenEinmalig()') !== false) return 'Rückgabe nicht false';
    return gleich(u.stand()['45899'], P['45899']) ? true : 'wurde zurückgestellt';
  });

  await fall('K15 Die Liste im Quelltext: genau diese 20, keine doppelt, alle aus Madina 1 Kapitel 10–13', () => {
    const u = baueKern(stuecke, {});
    const liste = u.hole('NEU_STELLEN_IDS.slice()');
    if (!gleich(liste.slice().sort(), IDS.slice().sort()) || new Set(liste).size !== 20) return 'Liste weicht ab: ' + liste.join(',');
    if (u.hole('NEU_STELLEN_TAG') !== '2026-08-11' || u.hole('NEU_STELLEN_MERKER') !== 'vt_neuGestellt') return 'Tag oder Merker weicht ab';
    const datei = path.join(WURZEL, 'data', 'vokabeln-madina-1.js');
    if (!fs.existsSync(datei)){ erg.set('   (Hinweis)', { ok: true, zusatz: 'data/vokabeln-madina-1.js fehlt hier — Kapitel der 20 NICHT geprüft' }); return true; }
    const win = { VOKABELN: {} };
    new Function('window', fs.readFileSync(datei, 'utf8'))(win);
    const karten = Object.values(win.VOKABELN).flat();
    for (const id of IDS){
      const w = karten.find(k => String(k.id) === id);
      if (!w) return id + ' steht nicht in Madina 1';
      if (!(Number(w.chapter) >= 10 && Number(w.chapter) <= 13)) return id + ' ist Kapitel ' + w.chapter;
    }
    return true;
  });

  /* ---------- Der ganze Abgleich ---------- */
  await fall('A1 Erstes Gerät: gleicheAb() stellt zurück und legt es im selben Lauf beim Server ab', async () => {
    const alt = alterStand();
    const u = baueAbgleich(stuecke, sync, alt, nutzlast(alt), { jetzt: T1 });
    await u.hole('gleicheAb(true)');
    const lokal = u.stand();
    if (!IDS.every(id => istNeu(lokal[id]) && lokal[id].neuGestellt === T1)) return 'lokal nicht alle 20 neu';
    if (!u.netz.aufrufe.includes('PUT /api/stand')) return 'nichts abgelegt: ' + u.netz.aufrufe.join(' | ');
    const fern = u.serverStand();
    if (!IDS.every(id => istNeu(fern[id]) && fern[id].ts === T1)) return 'beim Server nicht alle 20 neu';
    if ('vt_neuGestellt' in u.netz.server.daten) return 'der Geräte-Merker wurde mit abgelegt';
    if (u.hole('SYNC_SCHLUESSEL.indexOf("vt_neuGestellt")') !== -1) return 'der Merker steht in SYNC_SCHLUESSEL';
    return (u.merker() && u.merker().fertig === T1) ? true : 'Merker fehlt';
  });

  await fall('A2 Zweites Gerät mit ALTEM Stand, er hat „Gast" inzwischen mit Einführung gelernt: bleibt gelernt', async () => {
    const fern = standNachErstemGeraet();
    fern['45913'] = Object.assign(fern['45913'], { box: 2, nextReview: '2026-10-08', correct: 1, wrong: 0, ts: T3 });
    const gelernt = kopie(fern['45913']);
    const u = baueAbgleich(stuecke, sync, alterStand(), nutzlast(fern), { jetzt: T4 });
    await u.hole('gleicheAb(true)');
    const lokal = u.stand();
    if (!gleich(lokal['45913'], gelernt)) return 'Gast lokal: ' + JSON.stringify(lokal['45913']);
    if (!gleich(u.serverStand()['45913'], gelernt)) return 'Gast beim Server überschrieben';
    for (const id of IDS) if (id !== '45913' && !(istNeu(lokal[id]) && lokal[id].ts === T1)) return id + ' trägt nicht den Eintrag des ersten Geräts';
    return (u.merker() && u.merker().fertig === T4) ? true : 'Merker fehlt';
  });

  await fall('A3 Antwort OHNE Einführung auf diesem Gerät, nachdem drüben zurückgestellt war: wird hier nachgeholt', async () => {
    const lokal = alterStand();
    lokal['45914'] = { box: 1, nextReview: '2026-10-05', correct: 0, wrong: 2, ts: T5 };
    const u = baueAbgleich(stuecke, sync, lokal, nutzlast(standNachErstemGeraet()), { jetzt: T4 });
    await u.hole('gleicheAb(true)');
    const p = u.stand()['45914'], f = u.serverStand()['45914'];
    if (!(istNeu(p) && p.ts === T4 && p.vorher.wrong === 2)) return 'lokal: ' + JSON.stringify(p);
    if (!(istNeu(f) && f.ts === T4)) return 'beim Server: ' + JSON.stringify(f);
    return u.stand()['45899'].ts === T1 ? true : 'eine andere Karte wurde neu gestempelt';
  });

  await fall('A4 Auf dem PC (localhost) läuft der Schritt nie', async () => {
    const alt = alterStand();
    const u = baueAbgleich(stuecke, sync, alt, nutzlast(alt), { hostname: 'localhost' });
    await u.hole('gleicheAb(true)');
    if (u.netz.aufrufe.length) return 'es wurde abgerufen: ' + u.netz.aufrufe.join(' | ');
    return (gleich(u.stand(), alt) && !u.merker()) ? true : 'Stand verändert oder Merker gesetzt';
  });

  await fall('A5 Server ohne Lernstand oder nicht erreichbar: der Schritt läuft nicht', async () => {
    const alt = alterStand();
    const a = baueAbgleich(stuecke, sync, alt, { fassung: 1, geaendert: 1, stempel: {}, daten: {} });
    await a.hole('gleicheAb(true)');
    if (!IDS.every(id => gleich(a.stand()[id], alt[id])) || a.merker()) return 'lief ohne Lernstand vom Server';
    const b = baueAbgleich(stuecke, sync, alt, null);
    await b.hole('gleicheAb(true)');
    return (IDS.every(id => gleich(b.stand()[id], alt[id])) && !b.merker()) ? true : 'lief trotz fehlgeschlagenem Abruf';
  });

  await fall('A6 Der zurückgestellte Eintrag gewinnt das Zusammenführen gegen den alten — in beide Richtungen', async () => {
    const alt = alterStand();
    const u = baueAbgleich(stuecke, sync, alt, nutzlast(alt), { jetzt: T1 });
    await u.hole('gleicheAb(true)');
    const neu = u.stand();
    const fuehre = u.hole('fuehreFortschrittZusammen');
    const ab = fuehre(kopie(alt), kopie(neu)), ba = fuehre(kopie(neu), kopie(alt));
    for (const id of IDS){
      if (!istNeu(ab[id]) || !istNeu(ba[id])) return id + ': der alte Eintrag kam zurück';
      /* Eine ältere App-Fassung führt genauso zusammen und nimmt den GANZEN Eintrag —
         der Vermerk muss also mitkommen. */
      if (ab[id].neuGestellt !== T1 || !ab[id].vorher) return id + ': Vermerk nicht mitgekommen';
    }
    /* Und was er danach lernt, gewinnt gegen den zurückgestellten Eintrag. */
    const gelernt = Object.assign(kopie(neu['45913']), { box: 2, correct: 1, ts: T3 });
    const x = fuehre({ k: kopie(neu['45913']) }, { k: gelernt }), y = fuehre({ k: gelernt }, { k: kopie(neu['45913']) });
    return (x.k.correct === 1 && y.k.correct === 1) ? true : 'gelernt verliert gegen zurückgestellt';
  });

  await fall('A7 Im Quelltext: der Aufruf steht nach dem Zusammenführen, ohne await dazwischen', () => {
    /* Ohne Kommentare: dort steht der Name der Funktion auch. */
    const code = sync.replace(/\/\*[\s\S]*?\*\//g, '');
    const aufrufe = code.split('neuStellenEinmalig(').length - 1;
    if (aufrufe !== 1) return 'der Schritt wird ' + aufrufe + '-mal aufgerufen (erwartet: genau einmal)';
    const a = code.indexOf('fuehreZusammen(fern);');
    const b = code.indexOf('neuStellenEinmalig(');
    if (a < 0) return 'das Zusammenführen ist nicht gefunden';
    if (b < a) return 'der Aufruf steht VOR dem Zusammenführen';
    return /\bawait\b/.test(code.slice(a, b)) ? 'zwischen Zusammenführen und Aufruf steht ein await' : true;
  });

  return erg;
}

/* ---------- Auswertung ---------- */
let rot = 0;
const erg = await laufe(KERN, SYNC);
console.log('=== Der einmalige Schritt „zurück auf neu" ===');
for (const [name, e] of erg){
  if (!e.ok) rot++;
  console.log((e.ok ? '  ok   ' : '  FEHL ') + name + (e.zusatz ? '  -> ' + e.zusatz : ''));
}

/* ---------- Störtests ---------- */
function ersetze(quelle, alt, neu, wo){
  const n = quelle.split(alt).length - 1;
  if (n !== 1) throw new Error('Störtest „' + wo + '": die Stelle kommt ' + n + '-mal vor (erwartet 1) — Quelltext hat sich geändert');
  return quelle.replace(alt, () => neu);
}
const STOER = [
  { name: 'S1 ohne die Prüfung des Vermerks am Eintrag', muss: ['K4', 'A2'],
    kern: q => ersetze(q, '    if (p.neuGestellt) continue;\n', '', 'S1') },
  { name: 'S2 der Aufruf VOR dem Zusammenführen', muss: ['A2'],
    sync: q => ersetze(q, '    let geaendert = fuehreZusammen(fern);\n',
      '    if (typeof neuStellenEinmalig === \'function\') neuStellenEinmalig();\n    let geaendert = fuehreZusammen(fern);\n', 'S2') },
  { name: 'S3 der neue Eintrag ohne Zeitstempel', muss: ['K1', 'A6'],
    kern: q => ersetze(q, 'correct: 0, wrong: 0, ts: jetzt, neuGestellt: jetzt, vorher };', 'correct: 0, wrong: 0, neuGestellt: jetzt, vorher };', 'S3') },
  { name: 'S4 ohne das Warten auf die offene Runde', muss: ['K7', 'K9'],
    kern: q => ersetze(q, '    if (offen.has(id)){ wartet.push(id); continue; }\n', '', 'S4') },
  { name: 'S5 ohne die Grenze bei Box 2', muss: ['K5'],
    kern: q => ersetze(q, "    if ((Number(p.box) || 1) > 2){ gelassen[id] = 'Box ' + p.box; continue; }\n", '', 'S5') },
  { name: 'S6 der alte Eintrag wird nur genullt statt ersetzt (gruppe bleibt)', muss: ['K10'],
    kern: q => ersetze(q, '    stand[id] = { box: 1, nextReview: NEU_STELLEN_TAG, correct: 0, wrong: 0, ts: jetzt, neuGestellt: jetzt, vorher };',
      '    stand[id] = Object.assign({}, p, { box: 1, nextReview: NEU_STELLEN_TAG, correct: 0, wrong: 0, ts: jetzt, neuGestellt: jetzt, vorher });', 'S6') },
  { name: 'S7 ohne den Merker des Geräts', muss: ['K14'],
    kern: q => ersetze(q, '  if (merker && merker.fertig) return false;\n', '', 'S7') },
  { name: 'S8 der Schritt läuft auch ohne Lernstand vom Server', muss: ['A5'],
    sync: q => ersetze(q, "    if (fern && fern.daten && fern.daten.vt_progress != null\n        && typeof neuStellenEinmalig === 'function' && neuStellenEinmalig()) geaendert = true;",
      "    if (typeof neuStellenEinmalig === 'function' && neuStellenEinmalig()) geaendert = true;", 'S8') },
  { name: 'S9 eine 21. Kennung in der Liste', muss: ['K2', 'K15'],
    kern: q => ersetze(q, "'45917', '45920'];", "'45917', '45920', '90002'];", 'S9') }
];
console.log('\n=== Störtests: ohne die Regel MUSS der zuständige Fall scheitern ===');
for (const s of STOER){
  let e;
  try { e = await laufe(s.kern ? s.kern(KERN) : KERN, s.sync ? s.sync(SYNC) : SYNC); }
  catch (err){ rot++; console.log('  FEHL ' + s.name + '  -> ' + err.message); continue; }
  const gescheitert = [...e].filter(([, v]) => !v.ok).map(([n]) => n.split(' ')[0]);
  const fehlt = s.muss.filter(k => !gescheitert.includes(k));
  if (fehlt.length){ rot++; console.log('  FEHL ' + s.name + '  -> ' + fehlt.join(', ') + ' blieb grün (gescheitert: ' + (gescheitert.join(', ') || 'nichts') + ')'); }
  else console.log('  ok   ' + s.name + '  -> scheitert wie verlangt: ' + gescheitert.join(', '));
}

console.log('\n' + (rot ? rot + ' Befund(e).' : 'Alles grün: ' + erg.size + ' Fälle, ' + STOER.length + ' Störtests.'));
process.exit(rot ? 1 : 0);
