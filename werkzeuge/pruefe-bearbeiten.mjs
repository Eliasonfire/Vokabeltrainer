#!/usr/bin/env node
/* ============================================================================
   pruefe-bearbeiten.mjs — Bleibt, was Elias im Formular ändert? (24.09.2026)
   ============================================================================

   Elias, 24.09.2026, 04:46, mit dem Bild von „Null (0)": „ich wollte die
   klammer und zahl 0 entfernen und habs bearbeitet, hab dann neu geladen die
   app und es ist wieder da. meine bearbeitungen werden scheinbar nicht
   gespeichert oder so. das ist auch nicht zum ersten mal so. das sollst du
   fixen"

   Vier Wege, auf denen eine Änderung verloren ging — die Begründung steht bei
   speichereWortAenderung() und fachbegriffeMitBuchkarte() in js/kern.js:

     1. Eigene Vokabeln, die NICHT in der App angelegt sind (seine
        arabicroots-Liste in vocab-data.js, alle Fachbegriffe): gespeichert
        wurde nirgends, nur im Arbeitsspeicher geändert.
     2. In der App angelegte (`p_…`): data/feld-ausnahmen.js legt beim Start
        die Wortart auf bestrittene Felder — seine eigene Wahl verlor.
     3. Der Geräteabgleich behielt bei vt_personalVocab die Fassung des
        EIGENEN Geräts — eine Änderung am Handy kam am Tablet nie an.
     4. fachbegriffeMitBuchkarte() schrieb bei jedem Start die Beschreibung des
        Fachbegriffs auf die Buchkarte — auch über seine neuere Änderung.
   Dazu das Zurücksetzen („Auf Original zurück"): ein gelöschter Eintrag kam
   über den Abgleich vom anderen Gerät zurück.

   WIE GEMESSEN WIRD
   Die App-Dateien laufen in einer vm, in der Reihenfolge von index.html, mit
   EINEM Speicher über mehrere Starts und einem zweiten „Gerät". Je Herkunft
   ein echtes Wort aus dem Bestand, alle sieben Felder geändert, neu
   gestartet, verglichen. Der Abgleich ist der echte: fuehreZusammen() aus
   js/sync.js. Die Prüfwerte sind lateinisch und leben nur in der vm.

   STÖRTEST — eingebaut, läuft bei jedem Aufruf mit
   Dieselben Prüfungen gegen js/kern.js mit je EINEM alten Zweig zurückgebaut.
   Jede muss dann rot werden. Findet ein Rückbau seine Stelle nicht mehr (der
   Quelltext hat sich geändert), ist DAS der Befund: dann beweist der Prüfer
   nichts mehr, und er muss nachgezogen werden.

   ⚠️ Die Buchkarte mit Fachbegriff-Tausch steht in data/vokabeln-*.js. Die
   Dateien liegen wegen der arabicroots-AGB nicht im Repo — auf einem fremden
   Rechner wird dieser eine Fall übersprungen und das gemeldet.

   Aufruf:  node werkzeuge/pruefe-bearbeiten.mjs
   Exit 0 = in Ordnung, 1 = ein Befund.
   ============================================================================ */

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import vm from 'node:vm';

const HIER   = path.dirname(url.fileURLToPath(import.meta.url));
const WURZEL = path.resolve(HIER, '..');
const lies   = rel => fs.readFileSync(path.join(WURZEL, rel), 'utf8');
const befunde = [];

/* In der Reihenfolge von index.html, nur was js/kern.js braucht. */
const DATEN = ['vocab-data.js', 'data/beispielsaetze.js', 'data/fachbegriffe.js',
               'data/feld-ausnahmen.js', 'grammar-data.js'];
const SKRIPTE = DATEN.map(rel => new vm.Script(lies(rel), { filename: rel }));
const KERN = lies('js/kern.js');
const SYNC = new vm.Script(lies('js/sync.js'), { filename: 'js/sync.js' });

/* ---------- Die Reihenfolge in js/buecher.js ----------
   Nach dem Einhängen der Bücher läuft dort eine feste Folge; der Nachbau
   unten spielt sie nach. Ändert sie sich, misst dieser Prüfer eine App, die
   es nicht mehr gibt. */
const FOLGE = ['wendeFeldErgaenzungenAn(VOCAB_DATA)', 'wendeWortAenderungenAn()',
               'ergaenzeProgress()', 'tauscheDubletten()', 'fachbegriffeMitBuchkarte()'];
{
  const b = lies('js/buecher.js');
  let ab = 0;
  for (const aufruf of FOLGE){
    const i = b.indexOf(aufruf, ab);
    if (i < 0){ befunde.push('js/buecher.js: die Folge nach dem Einhängen der Bücher hat sich geändert (' + aufruf
      + ' nicht mehr an seiner Stelle) — den Nachbau in diesem Prüfer nachziehen.'); break; }
    ab = i + aufruf.length;
  }
}

/* ---------- Die Buchkarten mit Fachbegriff-Tausch, einmal geladen ---------- */
const fach = (() => {
  const c = { window: {} };
  vm.createContext(c);
  vm.runInContext(lies('data/fachbegriffe.js') + '\n;window.__f = FACHBEGRIFF_VOKABELN; window.__a = FACHBEGRIFF_AUFTRAG;', c);
  return { liste: c.window.__f || [], auftrag: c.window.__a || {} };
})();
const tauschZiele = new Set(fach.liste.filter(f => f && f.buchTausch
  && Object.prototype.hasOwnProperty.call(fach.auftrag, String(f.id))).map(f => String(f.buchTausch)));
const buchKarten = [];
{
  const c = { window: {} };
  vm.createContext(c);
  let dateien = [];
  try { dateien = fs.readdirSync(path.join(WURZEL, 'data')).filter(x => /^vokabeln-.*\.js$/.test(x) && x !== 'vokabeln-eigene.js'); }
  catch (e) { /* kein Ordner */ }
  for (const d of dateien){
    try { vm.runInContext(lies('data/' + d), c, { filename: d }); } catch (e) { /* eine kaputte Buchdatei betrifft pruefe-buecher */ }
  }
  for (const liste of Object.values(c.window.VOKABELN || {}))
    for (const w of (Array.isArray(liste) ? liste : []))
      if (w && tauschZiele.has(String(w.id)) && !buchKarten.some(x => String(x.id) === String(w.id))) buchKarten.push(w);
}

/* ---------- Ein Start der App ----------
   `speicher` ist der localStorage des Geräts und überlebt den Start. */
function starte(speicher, kernQuelle){
  const el = () => ({ style:{}, classList:{ add(){}, remove(){}, toggle(){}, contains:()=>false },
    addEventListener(){}, appendChild(){}, querySelector:()=>null, querySelectorAll:()=>[],
    closest:()=>null, getAttribute:()=>null, setAttribute(){}, focus(){},
    getBoundingClientRect:()=>({width:0,height:0,top:0,left:0}) });
  const dom = { getElementById: el, querySelector: el, querySelectorAll: () => [],
                createElement: el, addEventListener(){}, body: el(), documentElement: el() };
  const c = {
    window:{ addEventListener(){}, matchMedia:()=>({matches:false,addEventListener(){}}),
             location:{href:''}, navigator:{userAgent:'node',language:'de'} },
    document: dom,
    localStorage:{ getItem:k=>speicher[k] ?? null, setItem:(k,v)=>{speicher[k]=String(v);},
                   removeItem:k=>{delete speicher[k];}, clear(){}, key:i=>Object.keys(speicher)[i] ?? null,
                   get length(){ return Object.keys(speicher).length; } },
    navigator:{ userAgent:'node', language:'de', onLine:true },
    console:{ log(){}, warn(){}, error(){}, info(){} },
    Date, Math, JSON, Intl, setTimeout, clearTimeout, setInterval, clearInterval,
    fetch: () => Promise.reject(new Error('kein Netz im Test'))
  };
  c.globalThis = c; c.self = c; c.window.document = dom; c.window.localStorage = c.localStorage;
  vm.createContext(c);
  for (const s of SKRIPTE) s.runInContext(c);
  vm.runInContext(kernQuelle, c, { filename: 'js/kern.js' });
  /* Was js/buecher.js beim Einhängen tut, für die Buchkarten, die hier zählen. */
  c.__buch = JSON.parse(JSON.stringify(buchKarten));
  vm.runInContext(`{
    const da = new Set(VOCAB_DATA.map(w => String(w.id)));
    for (const w of __buch) if (!da.has(String(w.id))) VOCAB_DATA.push(w);
    ${FOLGE.join(';\n    ')};
  }`, c);
  return c;
}
const holeWort = (c, id) => vm.runInContext(`(() => { const w = VOCAB_DATA.find(x => String(x.id) === ${JSON.stringify(String(id))}); return w ? JSON.parse(JSON.stringify(w)) : null; })()`, c);
const FELDER = ['ar', 'de', 'pl', 'root', 'sentAr', 'sentDe', 'type'];

/* ---------- Die ganze Messung, gegen eine Fassung von js/kern.js ---------- */
function miss(kernQuelle){
  const erg = { herkunft: [], neustart: {}, zweit: {}, zuruecksetzen: null, altVorBestellung: null, fehler: [] };

  /* Ein in der App angelegtes Wort, dessen Wortart data/feld-ausnahmen.js als
     bestritten führt — genau die zehn seiner p_-Wörter. Id aus der Datei, der
     Eintrag selbst ist ein Prüfwort. */
  const probe = starte({}, kernQuelle);
  const pId = vm.runInContext(`Object.keys(typeof FELD_ZWEIFEL !== 'undefined' ? FELD_ZWEIFEL : {})
    .find(id => /^p_/.test(id) && FELD_ZWEIFEL[id].type && FELD_ERGAENZUNGEN[id] && FELD_ERGAENZUNGEN[id].type) || null`, probe);

  const saat = {};
  if (pId) saat.vt_personalVocab = JSON.stringify([{ id: pId, ar: 'PRUEFWORT', de: 'Pruefwort', chapter: 'personal', book: 'personal', type: 'noun' }]);
  /* Die Buchkarte mit Tausch trägt eine ALTE Änderung von ihm, vor dem Tag der
     Bestellung — wie 50473/50474 seit dem 21.08.2026. Die muss der Bestellung
     weichen (sein Wort vom 22.09.), eine neue darf es nicht. */
  const ziel = buchKarten[0] || null;
  const fZiel = ziel ? fach.liste.find(f => String(f.buchTausch) === String(ziel.id)) : null;
  if (ziel) saat.vt_wortAenderungen = JSON.stringify({ [String(ziel.id)]: { ar: ziel.ar, de: 'ALTE FASSUNG', zeit: Date.UTC(2026, 7, 21) } });

  const A = Object.assign({}, saat);
  const c1 = starte(A, kernQuelle);
  if (ziel && fZiel){
    const w = holeWort(c1, ziel.id);
    erg.altVorBestellung = w ? (w.de === fZiel.de ? 'ok' : 'steht: „' + w.de + '"') : 'Karte fehlt';
  }

  /* Je Herkunft ein echtes Wort. */
  const wahl = vm.runInContext(`(() => {
    const imGeraet = new Set((typeof PERSONAL_VOCAB !== 'undefined' ? PERSONAL_VOCAB : []).map(w => String(w.id)));
    const fachIds = new Set((typeof FACHBEGRIFF_VOKABELN !== 'undefined' ? FACHBEGRIFF_VOKABELN : []).map(w => String(w.id)));
    const erstes = f => { const w = VOCAB_DATA.find(f); return w ? w.id : null; };
    return [
      ['Buchwort (vocab-data.js)',         erstes(w => w.chapter !== 'personal' && w.book !== 'grammar' && !w.istPlural && !fachIds.has(String(w.id)))],
      ['eigene, arabicroots-Liste',        erstes(w => w.chapter === 'personal' && !imGeraet.has(String(w.id)) && !fachIds.has(String(w.id)))],
      ['Fachbegriff',                      erstes(w => fachIds.has(String(w.id)))],
      ['in der App angelegt (p_)',         ${JSON.stringify(pId)}],
      ['Buchkarte mit Fachbegriff-Tausch', ${JSON.stringify(ziel ? ziel.id : null)}],
    ];
  })()`, c1);

  const soll = {};
  for (const [name, id] of wahl){
    if (id === null || id === undefined){ erg.herkunft.push([name, null]); continue; }
    const w = holeWort(c1, id);
    if (!w){ erg.herkunft.push([name, null]); continue; }
    const ergaenzt = vm.runInContext(`(FELD_ERGAENZUNGEN[${JSON.stringify(String(id))}] || {}).type || null`, c1);
    const typ = ['adverb', 'expression', 'particle', 'noun'].find(t => t !== w.type && t !== ergaenzt);
    const neu = { ar: String(w.ar) + ' PRUEF', de: 'PRUEFWERT ' + w.de, pl: 'PRUEF-PL', root: 'PRUEF-WURZEL',
                  sentAr: 'PRUEF-SATZ', sentDe: 'Pruefsatz.', type: typ };
    const ok = vm.runInContext(`speichereWortAenderung(${JSON.stringify(id)}, ${JSON.stringify(neu)})`, c1);
    if (!ok) erg.fehler.push(name + ': speichereWortAenderung() lehnte ab');
    soll[String(id)] = { name, neu };
    erg.herkunft.push([name, String(id)]);
  }
  /* Die Änderungen eine Minute älter machen: sonst trügen Änderung und
     Zurücksetzen unten womöglich dieselbe Millisekunde. */
  try {
    const a = JSON.parse(A.vt_wortAenderungen || '{}');
    for (const id of Object.keys(soll)) if (a[id]) a[id].zeit = Number(a[id].zeit) - 60000;
    A.vt_wortAenderungen = JSON.stringify(a);
  } catch (e) { erg.fehler.push('vt_wortAenderungen unlesbar: ' + e.message); }

  const vergleich = (c) => {
    const raus = {};
    for (const [id, s] of Object.entries(soll)){
      const w = holeWort(c, id);
      raus[id] = w ? FELDER.filter(f => w[f] !== s.neu[f]) : FELDER.slice();
    }
    return raus;
  };

  /* 1. Neustart auf demselben Gerät. */
  const c2 = starte(A, kernQuelle);
  erg.neustart = vergleich(c2);

  /* 2. Ein zweites Gerät mit dem Stand von VORHER holt sich Gerät 1 ab. */
  const B = Object.assign({}, saat);
  const b1 = starte(B, kernQuelle);
  SYNC.runInContext(b1);
  vm.runInContext(`fuehreZusammen({ daten: ${JSON.stringify(A)}, stempel: {} })`, b1);
  const b2 = starte(B, kernQuelle);
  erg.zweit = vergleich(b2);

  /* 3. Zurücksetzen auf Gerät 1 — und der Abgleich mit Gerät 2, das die
        Änderung noch hat, darf sie nicht zurückbringen. */
  const rId = erg.herkunft.find(([n]) => n === 'Buchwort (vocab-data.js)')?.[1] || null;
  if (rId){
    const zurueck = vm.runInContext(`verwirfWortAenderung(${JSON.stringify(rId)})`, c2);
    SYNC.runInContext(c2);
    vm.runInContext(`fuehreZusammen({ daten: ${JSON.stringify(B)}, stempel: {} })`, c2);
    const c3 = starte(A, kernQuelle);
    const w = holeWort(c3, rId);
    erg.zuruecksetzen = !zurueck ? 'verwirfWortAenderung() lehnte ab'
      : (!w ? 'Wort fehlt' : (w.de === soll[rId].neu.de ? 'nach dem Abgleich wieder da: „' + w.de + '"' : 'ok'));
  }
  return erg;
}

const summe = (m) => Object.values(m).reduce((n, l) => n + l.length, 0);
function befundeAus(erg){
  const b = { neustart: [], zweit: [], zuruecksetzen: [], alt: [], sonst: erg.fehler.slice() };
  for (const [name, id] of erg.herkunft){
    if (!id) continue;
    if (erg.neustart[id] && erg.neustart[id].length) b.neustart.push(name + ' (' + id + '): nach dem Neustart weg — ' + erg.neustart[id].join(', '));
    if (erg.zweit[id] && erg.zweit[id].length) b.zweit.push(name + ' (' + id + '): am zweiten Gerät nicht angekommen — ' + erg.zweit[id].join(', '));
  }
  if (erg.zuruecksetzen && erg.zuruecksetzen !== 'ok') b.zuruecksetzen.push('Zurücksetzen: ' + erg.zuruecksetzen);
  if (erg.altVorBestellung && erg.altVorBestellung !== 'ok')
    b.alt.push('Buchkarte mit Tausch: seine Änderung von VOR der Bestellung schlägt die Beschreibung des Fachbegriffs — ' + erg.altVorBestellung
      + '. Sein Wort vom 22.09.2026: „mache es aber exakt so wie das meine eigene".');
  return b;
}

/* ---------- Die echte Fassung ---------- */
let erg;
try { erg = miss(KERN); }
catch (e){
  console.log('✖ Die Messung ließ sich nicht ausführen: ' + String(e && e.stack || e).split('\n').slice(0, 3).join(' | '));
  process.exit(1);
}
const echt = befundeAus(erg);
for (const liste of Object.values(echt)) befunde.push(...liste);

/* ---------- Störtests: je ein alter Zweig zurück, die passende Prüfung muss rot werden ---------- */
const STOERUNGEN = [
  { name: 'nur p_-Wörter nach vt_personalVocab (Stand bis v588)', gruppe: 'neustart',
    alt: 'WORT_AENDERUNGEN[id] = Object.assign({}, bisher, sauber, { zeit: Date.now() });',
    neu: "if (w.chapter !== 'personal') WORT_AENDERUNGEN[id] = Object.assign({}, bisher, sauber, { zeit: Date.now() });" },
  { name: 'Zurücksetzen löscht den Eintrag', gruppe: 'zuruecksetzen',
    alt: 'WORT_AENDERUNGEN[id] = { verworfen: true, zeit: Date.now() };',
    neu: 'delete WORT_AENDERUNGEN[id];' },
  { name: 'Tausch überschreibt die Buchkarte immer', gruppe: 'neustart', braucht: 'buch',
    alt: 'if (f.de && !selbstDanach) ziel.de = f.de;',
    neu: 'if (f.de) ziel.de = f.de;' },
];
const stoer = [];
for (const s of STOERUNGEN){
  if (s.braucht === 'buch' && !buchKarten.length){ stoer.push(s.name + ': übersprungen (keine Buchdatei)'); continue; }
  const treffer = KERN.split(s.alt).length - 1;
  if (treffer !== 1){ befunde.push('Störtest „' + s.name + '": die Stelle steht ' + treffer + '× in js/kern.js statt 1× — der Prüfer beweist dort nichts mehr, nachziehen.'); continue; }
  let r;
  try { r = befundeAus(miss(KERN.replace(s.alt, s.neu))); }
  catch (e){ befunde.push('Störtest „' + s.name + '" ließ sich nicht ausführen: ' + String(e.message).slice(0, 120)); continue; }
  if (!r[s.gruppe].length) befunde.push('Störtest „' + s.name + '": blieb grün — die Prüfung kann diesen Fehler nicht sehen.');
  else stoer.push(s.name + ': rot, wie es sein muss (' + r[s.gruppe].length + ')');
}

/* ---------- Ausgabe ---------- */
console.log('--- Bleibt, was Elias im Formular ändert? ---\n');
for (const [name, id] of erg.herkunft) console.log('  ' + name.padEnd(34) + (id || '— kein Wort dieser Herkunft (' + (name.includes('Tausch') ? 'Buchdatei fehlt' : 'nicht im Bestand') + ')'));
const n = Object.keys(erg.neustart).length * FELDER.length;
console.log('\nNeustart:           ' + summe(erg.neustart) + ' von ' + n + ' Feldern verloren');
console.log('zweites Gerät:      ' + summe(erg.zweit) + ' von ' + n + ' Feldern nicht angekommen');
console.log('Zurücksetzen:       ' + (erg.zuruecksetzen || 'nicht geprüft'));
console.log('alte Änderung an der Buchkarte (vor der Bestellung): ' + (erg.altVorBestellung === 'ok' ? 'weicht der Beschreibung des Fachbegriffs' : (erg.altVorBestellung || 'nicht geprüft (Buchdatei fehlt)')));
console.log('Störtests:');
for (const z of stoer) console.log('  · ' + z);

if (befunde.length){
  console.log('\n✖ ' + befunde.length + ' Befund(e):');
  befunde.forEach(z => console.log('  · ' + z));
  process.exit(1);
}
console.log('\n✅ Jede Änderung übersteht Neustart und Abgleich, das Zurücksetzen auch.');
process.exit(0);
