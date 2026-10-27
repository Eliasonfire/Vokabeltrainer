#!/usr/bin/env node
/* test-plural-platz.mjs — jede Mehrzahl eine eigene Karte, mit festem Platz und ihrer Art (19.10.2026)
 * ==================================================================================================
 *
 * Elias, kurz hintereinander:
 *   „wir sollen jeden einzelnen plural als eigene vokabel behandeln weil sonst merke ich es mir nicht"
 *   „ein plural sollte am besten auch immer einen festen platz bekommen von die singularvokabeln die
 *    ich bereits kenne"
 *   „bei den plural vokabeln sollte noch irgendwie gekennzeichnet werden ob sie regelmässig sind oder
 *    unregelmässig"
 * Und am 27.10.2026 auf meine Frage „Die Mehrzahlkarte kommt erst, wenn die Einzahl in Box 2 liegt.
 * Passt das?": „ja passt". Box 2 ist damit SEINE Grenze, nicht mehr meine Lesart. C1 bewacht sie von
 * beiden Seiten: die Störtests „ab Box 1" und „erst ab Box 3" müssen rot werden.
 * Gebaut in js/kern.js (pluralBereit, istBekannt, lerngruppeHeute, kapitelBeschriftung) und
 * js/uebung.js (pluralArtText). Geprüft mit den ECHTEN Funktionen, aus dem Quelltext geschnitten:
 *   A  Art: jede Mehrzahl seiner Bücher bekommt „regelmäßig männlich/weiblich" oder „unregelmäßig";
 *      wo die strenge Einordnung von Übung 16 entscheidet, sagt die Anzeige dasselbe; die Fälle,
 *      die sie offen lässt, wie in js/uebung.js begründet.
 *   B  Die Mehrzahlkarte trägt die Art vor „Plural von …" (das Arabische bleibt am Zeilenende).
 *   C  pluralBereit(): erst, wenn die Einzahl mindestens in Box 2 ist (oder „Kenne ich schon"),
 *      oder die Mehrzahl selbst schon angefangen ist; und istBekannt() fragt es vor 'personal'.
 *   D  Der Mehrzahl-Platz in der Lerngruppe (Deckel 15 → 5 Box-1-Plätze, Gruppe 10).
 * Danach Störtests — jeder muss rot werden.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const lies = f => fs.readFileSync(path.join(HIER, f), 'utf8');
const ECHT = { kern: lies('js/kern.js'), uebung: lies('js/uebung.js'), saetze: lies('js/saetze.js') };

/* Klammerbilanz statt Regex — dieselbe Schneide wie in test-koran-platz.mjs. */
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
function zeile(text, anfang){
  const a = text.indexOf(anfang);
  if (a < 0) return null;
  const e = text.indexOf('\n', a);
  return text.slice(a, e < 0 ? undefined : e);
}

/* ---------- seine Bücher (lokal, nie im Repo) ---------- */
const DATEN = fs.readdirSync(path.join(HIER, 'data')).filter(f => /^vokabeln-.*\.js$/.test(f));
const buchKtx = vm.createContext({ window: {} });
for (const f of DATEN) vm.runInContext(lies('data/' + f), buchKtx);
const WOERTER = Object.values(buchKtx.window.VOKABELN || {}).flat();
const nachId = new Map(WOERTER.map(w => [String(w.id), w]));

/* ---------- A + B: die Art ---------- */
function artWelt(q){
  const teile = [zeile(q.kern, 'const ZAHLWORT_DE = '), schneide(q.kern, 'istZahlwort'), zeile(q.saetze, 'function ohneTaschkil('),
    schneide(q.uebung, 'uebPluralArt'), zeile(q.uebung, 'const PL_ART_TEXT = '), schneide(q.uebung, 'pluralFormArt'),
    schneide(q.uebung, 'pluralArtText'), schneide(q.kern, 'kapitelBeschriftung')];
  if (teile.some(t => !t)) return null;
  const k = vm.createContext({});
  vm.runInContext(teile.join('\n') + '\n;globalThis.__ = { art: pluralArtText, streng: uebPluralArt, zahl: istZahlwort, kb: kapitelBeschriftung, TEXT: PL_ART_TEXT };', k);
  return k.__;
}
/* Die Fälle, die uebPluralArt() offen lässt — begründet bei pluralArtText() in js/uebung.js. */
const OFFEN_SOLL = {
  '45822': 'regelmäßig weiblich',          // ḥammām → ḥammāmāt
  '45993': 'regelmäßig weiblich',          // tadrīb → tadrībāt
  '46032': 'regelmäßig weiblich',          // tilfāz → tilfāzāt
  '45824': 'regelmäßig weiblich',          // samāʾ → samāwāt
  '45910': 'regelmäßig weiblich',          // fatāh → fatayāt
  '45874': 'regelmäßig weiblich',          // mustashfā → mustashfayāt
  '46010': 'regelmäßig männlich',          // wālid → wālidūn | wālidīn
  '45838': 'unregelmäßig',                 // bint → banāt (der Schlüssel: unregelmäßig)
  '45986': 'unregelmäßig',                 // ukht → akhawāt (ebenso)
  '45846': 'unregelmäßig',                 // umm → ummahāt
  '45804': 'unregelmäßig',                 // dukkān → dakākīn
  '45869': 'unregelmäßig',                 // sikkīn → sakākīn
  '45751': 'unregelmäßig',                 // bayt → buyūt / abyāt
  '45842': 'unregelmäßig und regelmäßig weiblich'   // baqara → baqar / baqarāt
};
function teilA(q){
  const f = [];
  const a = artWelt(q);
  if (!a) return { f: ['A0: pluralArtText/uebPluralArt/istZahlwort/kapitelBeschriftung nicht ausschneidbar'], zahl: {} };
  if (!WOERTER.length) return { f: ['A0: keine Bücher in data/ — die Prüfung hätte nichts gemessen'], zahl: {} };
  const erlaubt = new Set(Object.values(a.TEXT));
  const zahl = { alle: 0, m: 0, f: 0, g: 0, zwei: 0 };
  for (const w of WOERTER){
    if (!w.pl || a.zahl(w)) continue;
    zahl.alle++;
    const text = a.art(w.sg || w.ar, w.pl);
    const teile = text.split(' und ');
    if (!text || teile.some(t => !erlaubt.has(t))) { f.push('A1: ' + w.id + ' bekommt keine gültige Art: „' + text + '"'); continue; }
    if (teile.length > 1) zahl.zwei++;
    else zahl[Object.keys(a.TEXT).find(k => a.TEXT[k] === text)]++;
    /* dieselbe Antwort wie Übung 16, wo die streng entscheidet */
    for (const form of String(w.pl).split(/[\/|]/).map(t => t.trim()).filter(Boolean)){
      const s = a.streng({ sg: w.sg || w.ar, pl: form, de: '' });
      if (s && !teile.includes(a.TEXT[s])) f.push('A2: ' + w.id + ' — Übung 16 sagt „' + a.TEXT[s] + '", die Anzeige „' + text + '"');
    }
  }
  for (const [id, soll] of Object.entries(OFFEN_SOLL)){
    const w = nachId.get(id);
    if (!w) { f.push('A3: ' + id + ' steht nicht mehr in den Büchern — die Liste OFFEN_SOLL nachziehen'); continue; }
    const ist = a.art(w.sg || w.ar, w.pl);
    if (ist !== soll) f.push('A3: ' + id + ' soll „' + soll + '" sein, ist „' + ist + '"');
  }
  if (a.art('', 'x') !== '' || a.art('x', '') !== '') f.push('A4: ohne Einzahl oder Mehrzahl kommt trotzdem ein Text');
  /* B: die Mehrzahlkarte */
  const haus = nachId.get('45751');
  if (haus){
    const karte = { id: '45751#pl', istPlural: true, sgAr: haus.ar, ar: haus.pl, plVon: '45751' };
    const soll = 'unregelmäßig · Plural von ' + haus.ar;
    if (a.kb(karte) !== soll) f.push('B1: die Mehrzahlkarte sagt „' + a.kb(karte) + '" statt „' + soll + '"');
    const ohne = vm.createContext({});
    vm.runInContext(schneide(q.kern, 'kapitelBeschriftung') + '\n;globalThis.__ = kapitelBeschriftung;', ohne);
    if (ohne.__(karte) !== 'Plural von ' + haus.ar) f.push('B2: ohne pluralArtText fehlt die alte Zeile „Plural von …"');
  } else f.push('B0: 45751 nicht in den Büchern');
  return { f, zahl };
}

/* ---------- C: pluralBereit und istBekannt ---------- */
function teilC(q){
  const f = [];
  const teile = [zeile(q.kern, 'const PLURAL_MARKE = '), schneide(q.kern, 'istPluralKarte'), schneide(q.kern, 'pluralBereit'), schneide(q.kern, 'kennErSchon')];
  if (teile.some(t => !t)) return ['C0: pluralBereit/istPluralKarte/kennErSchon nicht ausschneidbar'];
  const k = vm.createContext({ PROGRESS: {}, BEKANNT: {} });
  vm.runInContext(teile.join('\n') + '\n;globalThis.__ = pluralBereit;', k);
  const bereit = (prog, bek, karte) => { k.PROGRESS = prog; k.BEKANNT = bek || {}; return k.__(karte); };
  const pl = { id: 's1#pl', plVon: 's1', istPlural: true };
  const faelle = [
    ['Einzahl in Box 1 → wartet', bereit({ s1: { box: 1, correct: 2 } }, {}, pl), false],
    ['Einzahl nicht im Fortschritt → wartet', bereit({}, {}, pl), false],
    ['Einzahl in Box 2 → bereit (Elias, 27.10.2026, auf „… erst, wenn die Einzahl in Box 2 liegt. Passt das?": „ja passt")', bereit({ s1: { box: 2 } }, {}, pl), true],
    ['Einzahl in Box 7 → bereit', bereit({ s1: { box: 7 } }, {}, pl), true],
    ['Einzahl mit „Kenne ich schon" → bereit', bereit({ s1: { box: 1 } }, { s1: { an: true } }, pl), true],
    ['„Kenne ich schon" zurückgenommen (an:false) → wartet', bereit({ s1: { box: 1 } }, { s1: { an: false } }, pl), false],
    ['Mehrzahl schon beantwortet, Einzahl zurück in Box 1 → bleibt', bereit({ s1: { box: 1 }, 's1#pl': { box: 1, wrong: 1 } }, {}, pl), true],
    ['Mehrzahl in der Lerngruppe → bleibt', bereit({ s1: { box: 1 }, 's1#pl': { box: 1, gruppe: '2026-10-19' } }, {}, pl), true],
    ['Mehrzahl über Box 1 → bleibt', bereit({ 's1#pl': { box: 3 } }, {}, pl), true],
    ['nur angelegt (initProgress), Einzahl Box 1 → wartet', bereit({ s1: { box: 1 }, 's1#pl': { box: 1, correct: 0, wrong: 0 } }, {}, pl), false],
    ['ohne plVon: Einzahl aus der Kennung', bereit({ s1: { box: 2 } }, {}, { id: 's1#pl' }), true],
    ['keine Mehrzahlkarte → immer bereit', bereit({}, {}, { id: 's1' }), true]
  ];
  for (const [name, ist, soll] of faelle) if (ist !== soll) f.push('C1: ' + name + ' — ergab ' + ist);
  /* PROGRESS noch in der Totzone: kein Absturz, nicht bereit */
  const tz = vm.createContext({});
  vm.runInContext(teile.join('\n') + '\n;globalThis.__ = pluralBereit;', tz);
  let ergebnis;
  try { ergebnis = tz.__(pl); } catch (e){ ergebnis = 'Absturz: ' + e.message; }
  if (ergebnis !== false) f.push('C2: ohne PROGRESS (Totzone beim Start) → ' + ergebnis);
  /* istBekannt fragt pluralBereit VOR dem Zweig für eigene Wörter */
  const ib = schneide(q.kern, 'istBekannt') || '';
  const a = ib.indexOf("if (typeof pluralBereit === 'function' && !pluralBereit(w)) return false;");
  const b = ib.indexOf("if (w.chapter === 'personal') return true;");
  if (a < 0 || b < 0 || a > b) f.push('C3: istBekannt() fragt pluralBereit() nicht vor dem Zweig für eigene Wörter');
  /* C4: pluralBereit() prüft die Marke als Text '#pl' (wegen der Totzone) — sie muss PLURAL_MARKE sein */
  if (zeile(q.kern, 'const PLURAL_MARKE = ') !== "const PLURAL_MARKE = '#pl';") f.push('C4: PLURAL_MARKE ist nicht mehr \'#pl\' — pluralBereit() prüft noch den alten Text');
  if (!/endsWith\('#pl'\)/.test(schneide(q.kern, 'pluralBereit') || '')) f.push('C4: pluralBereit() erkennt die Mehrzahlkarte nicht mehr an der Marke');
  return f;
}

/* ---------- D: der Mehrzahl-Platz ---------- */
const NAMEN = ['nieAbgefragt', 'neueZuerst', 'tageZwischen', 'verspaetung', 'istGruppenwort', 'istPluralKarte', 'lerngruppeHeute', 'tagesAuswahl'];
const HEUTE = '2026-10-19';
function lauf(quelle){
  const teile = NAMEN.map(n => schneide(quelle, n));
  const marke = zeile(quelle, 'const PLURAL_MARKE = ');
  const mAnteil = quelle.match(/const DECKEL_ANTEIL_BOX1\s*=\s*([\d.]+(?:\s*\/\s*[\d.]+)?)\s*;/);
  const mIntervalle = quelle.match(/const INTERVALS = (\{[^}]+\})/);
  if (teile.some(t => !t) || !marke || !mAnteil || !mIntervalle) return null;
  const k = { PROGRESS: {}, Array, Math, Number, Object, String, Set, Date, isNaN, console, todayStr: () => HEUTE };
  vm.createContext(k);
  vm.runInContext('const INTERVALS = ' + mIntervalle[1] + ';\nconst DECKEL_ANTEIL_BOX1 = ' + mAnteil[1] + ';\n' + marke + '\n'
    + teile.join('\n') + '\n;globalThis.__ = tagesAuswahl;', k);
  return k;
}
function szenen(c){
  const setze = (id, p, extra) => { c.PROGRESS[id] = Object.assign({ box: 1, nextReview: HEUTE, correct: 0, wrong: 0 }, p); return Object.assign({ id }, extra || {}); };
  /* Unterricht n0…n6, Einzahlen s1…s4 (Box 3, 7, 5, 2) mit bereiten Mehrzahlen s1#pl…s4#pl, 20 Wiederholungen. */
  const lage = (ohneMehrzahl) => {
    c.PROGRESS = {};
    ['s1', 's2', 's3', 's4'].forEach((id, i) => setze(id, { box: [3, 7, 5, 2][i], correct: 3, nextReview: '2026-12-01' }));
    return {
      nw: Array.from({ length: 7 }, (_, i) => setze('n' + i, { nextReview: '2026-10-1' + i })),
      pw: ohneMehrzahl ? [] : ['s1', 's2', 's3', 's4'].map(s => setze(s + '#pl', { nextReview: '2026-10-11' }, { istPlural: true, plVon: s })),
      wd: Array.from({ length: 20 }, (_, i) => setze('w' + i, { box: 4, correct: 2 }))
    };
  };
  const ids = l => l.map(w => w.id);
  const pl = l => ids(l).filter(x => x.endsWith('#pl'));
  const zahl = (l, pre) => ids(l).filter(x => x.startsWith(pre) && !x.endsWith('#pl')).length;
  const mitglied = (id, p, extra) => setze(id, Object.assign({ gruppe: '2026-10-17', gruppeArt: 'neu', wrong: 1 }, p), extra);
  const r = {};
  /* P1: leere Gruppe — genau eine Mehrzahl, die der sichersten Einzahl (s2, Box 7) */
  let L = lage();
  const a = c.__(L.nw.concat(L.pw, L.wd), 15, [], []);
  r.P1 = { ok: JSON.stringify(pl(a)) === '["s2#pl"]' && zahl(a, 'n') === 4 && a.length === 15, zeig: ids(a) };
  /* P2: heute ist schon eine Mehrzahl fällig → keine weitere */
  L = lage();
  const P0 = mitglied('s9#pl', { nextReview: HEUTE }, { istPlural: true, plVon: 's2' });
  const m2 = [1, 2].map(i => mitglied('m' + i, { nextReview: HEUTE }));
  const b = c.__([P0].concat(m2, L.nw, L.pw, L.wd), 15, [], [P0].concat(m2));
  r.P2 = { ok: JSON.stringify(pl(b)) === '["s9#pl"]' && zahl(b, 'n') === 2, zeig: ids(b) };
  /* P3: zwei Mehrzahlen in der Gruppe (nicht fällig) → keine dritte */
  L = lage();
  const PP = ['sa#pl', 'sb#pl'].map(id => mitglied(id, { nextReview: '2026-10-20' }, { istPlural: true, plVon: 's2' }));
  const m3 = [1, 2, 3].map(i => mitglied('m' + i, { nextReview: HEUTE }));
  const cc = c.__(m3.concat(L.nw, L.pw, L.wd), 15, [], m3.concat(PP));
  r.P3 = { ok: pl(cc).length === 0 && zahl(cc, 'n') === 2, zeig: ids(cc) };
  /* P4: eine Mehrzahl in der Gruppe (nicht fällig) → die nächste kommt dazu */
  L = lage();
  const P1 = mitglied('sa#pl', { nextReview: '2026-10-20' }, { istPlural: true, plVon: 's2' });
  const m3b = [1, 2, 3].map(i => mitglied('m' + i, { nextReview: HEUTE }));
  const d = c.__(m3b.concat(L.nw, L.pw, L.wd), 15, [], m3b.concat([P1]));
  r.P4 = { ok: JSON.stringify(pl(d)) === '["s2#pl"]' && zahl(d, 'n') === 1, zeig: ids(d) };
  /* P5: nur zwei Unterrichtswörter — trotzdem nur EINE Mehrzahl, die übrigen Plätze bleiben frei */
  L = lage();
  const e = c.__(L.nw.slice(0, 2).concat(L.pw, L.wd), 15, [], []);
  r.P5 = { ok: pl(e).length === 1 && zahl(e, 'n') === 2, zeig: ids(e) };
  /* P6: Koran-Platz und Mehrzahl-Platz zugleich → ein Koranwort, eine Mehrzahl, drei Unterrichtswörter */
  L = lage();
  const kw = [1, 2].map(r2 => setze('k' + r2, { nextReview: '2026-10-11' }, { book: 'koran-haeufig', koranRang: r2 }));
  const g = c.__(L.nw.concat(L.pw, kw, L.wd), 15, [], []);
  r.P6 = { ok: pl(g).length === 1 && ids(g).filter(x => /^k\d$/.test(x)).length === 1 && zahl(g, 'n') === 3, zeig: ids(g) };
  /* P7: eine zurückgefallene Mehrzahl geht wie jedes Wort nach vorn — auch neben zwei Mehrzahlen in der Gruppe */
  L = lage();
  const Z = setze('sz#pl', { correct: 2, wrong: 1, zurueck: '2026-10-18', nextReview: '2026-10-18' }, { istPlural: true, plVon: 's3' });
  const m2c = [1, 2].map(i => mitglied('m' + i, { nextReview: HEUTE }));
  const h = c.__(m2c.concat([Z], L.nw, L.pw, L.wd), 15, [], m2c.concat(PP.map(w => (c.PROGRESS[w.id] = Object.assign({ box: 1, gruppe: '2026-10-17', gruppeArt: 'neu', wrong: 1, nextReview: '2026-10-20' }), w))));
  r.P7 = { ok: ids(h).includes('sz#pl') && JSON.stringify(pl(h)) === '["sz#pl"]', zeig: ids(h) };
  /* P9: Gleichstand (beide Einzahlen Box 6) — das frühere Kapitel zuerst, egal wie der Pool gemischt ist */
  c.PROGRESS = {};
  setze('t5', { box: 6, correct: 4, nextReview: '2026-12-01' }); setze('t6', { box: 6, correct: 4, nextReview: '2026-12-01' });
  const tw = [setze('t5#pl', {}, { istPlural: true, plVon: 't5', chapter: 3 }), setze('t6#pl', {}, { istPlural: true, plVon: 't6', chapter: 1 })];
  const nw9 = Array.from({ length: 4 }, (_, i) => setze('n' + i, { nextReview: '2026-10-1' + i }));
  const i9 = c.__(nw9.concat(tw), 15, [], []);
  r.P9 = { ok: JSON.stringify(pl(i9)) === '["t6#pl"]', zeig: ids(i9) };
  /* P8: ohne Mehrzahlen — der Vergleich mit der Fassung ohne Mehrzahl-Platz macht befundeVon() */
  L = lage(true);
  const k1 = c.__(L.nw.concat(L.wd), 15, [], []);
  const m2d = [1, 2].map(i => mitglied('m' + i, { nextReview: HEUTE }));
  const k2 = c.__(m2d.concat(L.nw, L.wd), 15, [], m2d);
  r.P8 = { runde: JSON.stringify([ids(k1), ids(k2)]) };
  return r;
}
const PLATZ_ZEILE = '    if (plW.length && !faellig.some(pluralwort) && mitglieder.filter(pluralwort).length < PLURAL_PLAETZE)\n      neuW = [plW[0]].concat(neuW);\n';
function teilD(quelle){
  const c = lauf(quelle);
  if (!c) return { f: ['D0: Funktionen oder Konstanten nicht mehr in js/kern.js'], r: {} };
  const r = szenen(c);
  const f = [];
  for (const k of ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P9']) if (!r[k].ok) f.push(`${k}: ${JSON.stringify(r[k].zeig.filter(x => !/^w\d/.test(x)))}`);
  const ohne = quelle.includes(PLATZ_ZEILE) ? lauf(quelle.replace(PLATZ_ZEILE, '')) : null;
  if (!ohne) f.push('P8: der Mehrzahl-Platz steht nicht mehr in der erwarteten Form in lerngruppeHeute()');
  else if (szenen(ohne).P8.runde !== r.P8.runde) f.push('P8: ohne Mehrzahlen ändert sich die Runde');
  return { f, r };
}

function befundeVon(q){
  const A = teilA(q), D = teilD(q.kern);
  return { befunde: [...A.f, ...teilC(q), ...D.f], A, D };
}

let schlecht = 0;
const echt = befundeVon(ECHT);
console.log('test-plural-platz — jede Mehrzahl eine eigene Karte, fester Platz, ihre Art (Elias, 19.10.2026)');
const z = echt.A.zahl;
console.log(`  A Mehrzahlen in seinen Büchern: ${z.alle} — regelmäßig männlich ${z.m} · regelmäßig weiblich ${z.f} · unregelmäßig ${z.g} · zwei Arten ${z.zwei}`);
if (echt.D.r.P1) console.log('  D Runde bei leerer Gruppe: ' + JSON.stringify(echt.D.r.P1.zeig.filter(x => !/^w\d/.test(x))));
if (echt.befunde.length){ schlecht++; for (const b of echt.befunde) console.log('  ⛔ ' + b); }
else console.log('  ✅ A, B, C und D grün');

const ersetze = (t, alt, neu) => { const n = t.split(alt).length - 1; if (n !== 1) throw new Error('die Stelle steht ' + n + '-mal da statt genau einmal: ' + alt.slice(0, 70)); return t.replace(alt, neu); };
const STOER = [
  ['kein Mehrzahl-Platz', /^P1:/, q => ({ ...q, kern: ersetze(q.kern, PLATZ_ZEILE, '') })],
  ['beliebig viele Mehrzahlen in der Gruppe', /^P3:/, q => ({ ...q, kern: ersetze(q.kern, '  const PLURAL_PLAETZE = 2;', '  const PLURAL_PLAETZE = 99;') })],
  ['Mehrzahlen auch auf den Plätzen des Unterrichts', /^P5:/, q => ({ ...q, kern: ersetze(q.kern, '    let neuW = kand.filter(w => !p(w).zurueck && nieAbgefragt(w) && !pluralwort(w));', '    let neuW = kand.filter(w => !p(w).zurueck && nieAbgefragt(w));') })],
  ['die schwächste Einzahl zuerst', /^P1:/, q => ({ ...q, kern: ersetze(q.kern, '.sort((a, b) => (sgBox(b) - sgBox(a))', '.sort((a, b) => (sgBox(a) - sgBox(b))') })],
  ['bei Gleichstand entscheidet die Mischung des Pools', /^P9:/, q => ({ ...q, kern: ersetze(q.kern, "      || ((Number(a.chapter) || 0) - (Number(b.chapter) || 0))\n", '') })],
  ['auch wenn heute schon eine fällig ist', /^P2:/, q => ({ ...q, kern: ersetze(q.kern, 'if (plW.length && !faellig.some(pluralwort) && ', 'if (plW.length && ') })],
  ['jede Mehrzahl gleich bereit', /^C1:/, q => ({ ...q, kern: ersetze(q.kern, '    return !!sg && (sg.box || 1) >= 2;', '    return true;') })],
  ['„Kennen" schon ab Box 1', /^C1:/, q => ({ ...q, kern: ersetze(q.kern, '    return !!sg && (sg.box || 1) >= 2;', '    return !!sg;') })],
  ['„Kennen" erst ab Box 3 (gegen sein „ja passt" zu Box 2)', /^C1:/, q => ({ ...q, kern: ersetze(q.kern, '    return !!sg && (sg.box || 1) >= 2;', '    return !!sg && (sg.box || 1) >= 3;') })],
  ['istBekannt fragt pluralBereit nicht', /^C3:/, q => ({ ...q, kern: ersetze(q.kern, "  if (typeof pluralBereit === 'function' && !pluralBereit(w)) return false;\n", '') })],
  ['-āʾ → -āwāt gilt nicht mehr', /^A3: 45824/, q => ({ ...q, uebung: ersetze(q.uebung, "  if (s.endsWith(ALIF + HAMZA) && p === s.slice(0, -1) + WAW + ALIF + TA) return 'f';\n", '') })],
  ['ein Alif am Ende → -ayāt gilt nicht mehr', /^A3: 45910/, q => ({ ...q, uebung: ersetze(q.uebung, "  if ((s0.endsWith(ALIF) || s0.endsWith(MAQ)) && p === s0.slice(0, -1) + YA + ALIF + TA) return 'f';\n", '') })],
  ['-īn zählt nicht als regelmäßig männlich', /^A3: 46010/, q => ({ ...q, uebung: ersetze(q.uebung, 'if (p === s0 + WAW + NUN || p === s0 + YA + NUN) return ', 'if (p === s0 + WAW + NUN) return ') })],
  ['die Anzeige weicht von Übung 16 ab', /^A2:/, q => ({ ...q, uebung: ersetze(q.uebung, '  const streng = uebPluralArt({ sg: sg, pl: form, de: \'\' });\n  if (streng) return streng;\n', "  const streng = uebPluralArt({ sg: sg, pl: form, de: '' });\n  if (streng === 'm') return 'g';\n  if (streng) return streng;\n") })],
  ['die Mehrzahlkarte nennt ihre Art nicht', /^B1:/, q => ({ ...q, kern: ersetze(q.kern, "    return (art ? art + ' · ' : '') + `Plural von ${w.sgAr}`;", '    return `Plural von ${w.sgAr}`;') })]
];
console.log('\nStörtests (jeder muss rot werden):');
for (const [name, erwartet, stoere] of STOER){
  let q;
  try { q = stoere(ECHT); } catch (e){ schlecht++; console.log(`  ⛔ „${name}": ${e.message}`); continue; }
  const r = befundeVon(q);
  const treffer = r.befunde.find(b => erwartet.test(b));
  if (treffer) console.log(`  ✔ ${name} → rot (${treffer.split(':')[0]})`);
  else { schlecht++; console.log(`  ⛔ ${name} → blieb ${r.befunde.length ? 'rot, aber ohne ' + erwartet : 'GRÜN'}`); }
}
console.log('\n' + (schlecht ? '⛔ test-plural-platz: ' + schlecht + ' Befund(e).' : `✅ test-plural-platz: grün, alle ${STOER.length} Störtests rot geworden.`));
process.exit(schlecht ? 1 : 0);
