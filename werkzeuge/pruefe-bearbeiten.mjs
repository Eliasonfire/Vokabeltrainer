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

   Seit 20.10.2026 der Teil „Mehrzahlkarte" (M1–M6, V1–V3, sieben Störtests):
   Elias um 02:24 wollte Mehrzahlkarten direkt bearbeiten, und eine Änderung an
   der Einzahl soll die Mehrzahlkarte weiter mitziehen. Die Prüfungen stehen bei
   missMehrzahl() und verdrahtungMehrzahl() unten.

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
               'data/feld-ausnahmen.js', 'data/de-mehrzahl.js', 'grammar-data.js'];
const SKRIPTE = DATEN.map(rel => new vm.Script(lies(rel), { filename: rel }));
const KERN = lies('js/kern.js');
const SYNC = new vm.Script(lies('js/sync.js'), { filename: 'js/sync.js' });

/* ---------- Die Reihenfolge in js/buecher.js ----------
   Nach dem Einhängen der Bücher läuft dort eine feste Folge; der Nachbau
   unten spielt sie nach. Ändert sie sich, misst dieser Prüfer eine App, die
   es nicht mehr gibt. */
const FOLGE = ['wendeFeldErgaenzungenAn(VOCAB_DATA)', 'wendeWortAenderungenAn()',
               'wendePluralKartenAn(pluralKartenStufe(SETTINGS))', 'wendePluralAenderungenAn()',
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
   `speicher` ist der localStorage des Geräts und überlebt den Start. `vorKern` (freiwillig)
   läuft nach den Daten und vor js/kern.js — so ändert der Teil „Mehrzahlkarte" das Verzeichnis
   der deutschen Mehrzahl zwischen zwei Starts, wie eine spätere Auslieferung es täte. */
function starte(speicher, kernQuelle, vorKern){
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
  if (vorKern) vm.runInContext(vorKern, c);
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

/* ---------- Die Mehrzahlkarte (20.10.2026) ----------
   Elias um 02:24: „außerdem will ich auch direkt die pluralkarten bearbeiten können jedoch
   finde ich es gut das wenn ich eine karte in der bedeutung ändere das sich dann auch plural
   ändert also das die zusammenhängen".
   Bis dahin hatte die Infokarte einer Mehrzahlkarte keinen Bearbeiten-Knopf, und eine Änderung
   wäre nach dem Neustart weg gewesen: js/buecher.js baut die Mehrzahlkarten NACH
   wendeWortAenderungenAn() frisch (im eigenen Edge gemessen). Die Regeln stehen bei
   MEHRZAHL_EIGENE, speicherePluralKartenAenderung() und pluralKarteNachziehen() in js/kern.js:
     M1 Bedeutung und Satz an der Mehrzahlkarte überstehen den Neustart.
     M2 Die arabische Form an der Mehrzahlkarte wird die Mehrzahl der Einzahl (beide Karten
        zeigen dieselbe), und die Mehrzahlkarte speichert dafür nichts Eigenes.
     M3 Ändert er die Bedeutung der Einzahl, folgt die Mehrzahlkarte, auch über ihre eigene
        Bedeutung hinweg; ihr eigener Satz bleibt.
     M4 Nach einer bloßen Satzänderung hängt die Bedeutung nicht fest: eine Korrektur im
        Verzeichnis (data/de-mehrzahl.js) kommt beim nächsten Start an.
     M5 „Auf Original zurück" an der Mehrzahlkarte wirkt sofort und nach dem Neustart.
     M6 Ein zweites Gerät bekommt die Mehrzahlkarte über den Abgleich so, wie er sie geändert hat. */
function missMehrzahl(kernQuelle){
  const f = [];
  const A = {};
  const c1 = starte(A, kernQuelle);
  const woerter = vm.runInContext(`(() => {
    const raus = [];
    for (const w of VOCAB_DATA){
      if (raus.length === 4) break;
      if (istPluralKarte(w.id) || w.type === 'adjective' || String(w.de || '').includes('/')) continue;
      if (!VOCAB_DATA.some(p => p.id === w.id + PLURAL_MARKE) || !deMehrzahl(w)) continue;
      raus.push(String(w.id));
    }
    return raus;
  })()`, c1);
  if (woerter.length < 4) return ['M0 nur ' + woerter.length + ' von 4 Prüfwörtern gefunden (Einzahl mit Mehrzahlkarte und Eintrag im Verzeichnis) — der Teil beweist nichts'];
  const [w1, w2, w3, w4] = woerter;
  const pl = id => id + '#pl';
  const ruf = (c, code) => vm.runInContext(code, c);
  const speichere = (c, id, felder) => ruf(c, `speichereWortAenderung(${JSON.stringify(id)}, ${JSON.stringify(felder)})`);
  const zeig = k => k ? '„' + k.de + '", ar ' + k.ar + ', Satz ' + JSON.stringify(k.sentAr) : 'Karte fehlt';

  /* So schickt das Formular eine Mehrzahlkarte: Plural, Wurzel, Wortart gibt es dort nicht (null). */
  const pk1 = holeWort(c1, pl(w1));
  speichere(c1, pl(w1), { ar: pk1.ar, de: 'PRUEF-MEHRZAHL (Plural)', pl: null, root: null, sentAr: 'PRUEF-SATZ', sentDe: 'Pruefsatz.' });
  const pk2 = holeWort(c1, pl(w2));
  speichere(c1, pl(w2), { ar: 'PRUEF-MEHRZAHL-AR', de: pk2.de, pl: null, root: null, sentAr: '', sentDe: '' });
  const s2 = holeWort(c1, w2), k2 = holeWort(c1, pl(w2));
  if (!s2 || s2.pl !== 'PRUEF-MEHRZAHL-AR') f.push('M2 die arabische Form der Mehrzahlkarte landet nicht als Mehrzahl der Einzahl: ' + (s2 && s2.pl));
  if (!k2 || k2.ar !== 'PRUEF-MEHRZAHL-AR') f.push('M2 die Mehrzahlkarte zeigt ihre geänderte arabische Form nicht sofort: ' + zeig(k2));
  const pk3 = holeWort(c1, pl(w3));
  speichere(c1, pl(w3), { ar: pk3.ar, de: pk3.de, pl: null, root: null, sentAr: 'PRUEF-SATZ-3', sentDe: 'Pruefsatz drei.' });
  const pk4 = holeWort(c1, pl(w4));
  speichere(c1, pl(w4), { ar: pk4.ar, de: 'PRUEF-WEG (Plural)', pl: null, root: null, sentAr: 'PRUEF-WEG-SATZ', sentDe: '' });
  ruf(c1, `verwirfWortAenderung(${JSON.stringify(pl(w4))})`);
  const k4 = holeWort(c1, pl(w4));
  if (!k4 || k4.de !== pk4.de || k4.sentAr !== undefined) f.push('M5 nach „Auf Original zurück" zeigt die Mehrzahlkarte nicht sofort wieder, was sich aus der Einzahl ergibt: ' + zeig(k4));
  const gespeichert = (() => { try { return JSON.parse(A.vt_wortAenderungen || '{}'); } catch (e) { return {}; } })();
  const eintrag2 = gespeichert[pl(w2)];
  if (eintrag2 && !eintrag2.verworfen) f.push('M2 die Mehrzahlkarte speichert eigene Felder, obwohl nur ihre arabische Form geändert wurde: ' + JSON.stringify(eintrag2));

  /* Neustart — dazwischen ändert sich das Verzeichnis für die Bedeutung von w3. */
  const de3 = holeWort(c1, w3).de;
  const c2 = starte(A, kernQuelle, `DE_MEHRZAHL[${JSON.stringify(de3)}] = 'PRUEF-VERZEICHNIS';`);
  const n1 = holeWort(c2, pl(w1));
  if (!n1 || n1.de !== 'PRUEF-MEHRZAHL (Plural)' || n1.sentAr !== 'PRUEF-SATZ' || n1.sentDe !== 'Pruefsatz.')
    f.push('M1 Bedeutung und Satz an der Mehrzahlkarte überstehen den Neustart nicht: ' + zeig(n1));
  const n2s = holeWort(c2, w2), n2 = holeWort(c2, pl(w2));
  if (!n2s || n2s.pl !== 'PRUEF-MEHRZAHL-AR' || !n2 || n2.ar !== 'PRUEF-MEHRZAHL-AR')
    f.push('M2 nach dem Neustart: Mehrzahl der Einzahl ' + (n2s && n2s.pl) + ', Mehrzahlkarte ' + zeig(n2));
  const n3 = holeWort(c2, pl(w3));
  if (!n3 || n3.de !== 'PRUEF-VERZEICHNIS (Plural)' || n3.sentAr !== 'PRUEF-SATZ-3')
    f.push('M4 nach einer bloßen Satzänderung hängt die Bedeutung fest, die Korrektur im Verzeichnis kommt nicht an: ' + zeig(n3));
  const n4 = holeWort(c2, pl(w4));
  if (!n4 || n4.de !== pk4.de || n4.sentAr !== undefined) f.push('M5 nach dem Neustart ist die zurückgesetzte Mehrzahlkarte nicht wieder abgeleitet: ' + zeig(n4));

  /* Die Bedeutung der Einzahl ändern, so wie das Formular der Einzahl es schickt. */
  const s1 = holeWort(c2, w1);
  speichere(c2, w1, { ar: s1.ar, de: 'PRUEFNEU', pl: s1.pl || '', root: s1.root || '', sentAr: s1.sentAr || '', sentDe: s1.sentDe || '', type: s1.type });
  const m3 = holeWort(c2, pl(w1));
  if (!m3 || m3.de !== 'PRUEFNEU (Plural)') f.push('M3 die Bedeutung der Einzahl geändert, die Mehrzahlkarte folgt nicht: ' + zeig(m3));
  else if (m3.sentAr !== 'PRUEF-SATZ') f.push('M3 beim Nachziehen ging der eigene Satz der Mehrzahlkarte verloren: ' + zeig(m3));
  const c3 = starte(A, kernQuelle);
  const m3n = holeWort(c3, pl(w1));
  if (!m3n || m3n.de !== 'PRUEFNEU (Plural)' || m3n.sentAr !== 'PRUEF-SATZ') f.push('M3 nach dem Neustart: ' + zeig(m3n));

  /* Ein zweites Gerät holt sich den Stand ab. */
  const B = {};
  const b1 = starte(B, kernQuelle);
  SYNC.runInContext(b1);
  vm.runInContext(`fuehreZusammen({ daten: ${JSON.stringify(A)}, stempel: {} })`, b1);
  const b2 = starte(B, kernQuelle);
  const z1 = holeWort(b2, pl(w1)), z2 = holeWort(b2, pl(w2));
  if (!z1 || z1.de !== 'PRUEFNEU (Plural)' || z1.sentAr !== 'PRUEF-SATZ') f.push('M6 am zweiten Gerät fehlt die geänderte Mehrzahlkarte: ' + zeig(z1));
  if (!z2 || z2.ar !== 'PRUEF-MEHRZAHL-AR') f.push('M6 am zweiten Gerät fehlt die geänderte arabische Mehrzahl: ' + zeig(z2));
  return f;
}

/* Die Verdrahtung in js/kategorien.js: Bearbeiten-Knopf und Box-Reihe auf der Mehrzahlkarte, ihr
   eigenes Formular, und ein Formular ohne Plural/Wurzel/Wortart gilt beim Schließen nicht als
   geändert. Am Text geprüft — gezeichnet wird die Karte in der Probe im eigenen Edge. */
const KAT = lies('js/kategorien.js');
function verdrahtungMehrzahl(kat){
  const f = [];
  const kopf = kat.indexOf('function baueWortKarte('), ende = kat.indexOf('\nfunction ', kopf + 10);
  const karte = kopf < 0 ? '' : kat.slice(kopf, ende);
  const i = karte.indexOf('  if (w.istPlural){\n    t.push(`<div class="wk-aktionen">');
  const block = i < 0 ? '' : karte.slice(i, karte.indexOf("return t.join('');", i));
  if (!block) f.push('V1 der Block für die Mehrzahlkarte in baueWortKarte() fehlt');
  else {
    if (!block.includes('data-wkbearbeiten')) f.push('V1 die Infokarte der Mehrzahlkarte hat keinen Bearbeiten-Knopf');
    if (!block.includes('data-wkgrundwort')) f.push('V1 der Weg „Zur Grundvokabel" fehlt auf der Mehrzahlkarte');
    const box = karte.indexOf('wk-boxwahl');
    if (box < 0 || box > i) f.push('V1 die Mehrzahlkarte kehrt vor der Box-Reihe zurück (Kommentar dort: „Pluralkarten bekommen die Reihe auch")');
  }
  const fk = kat.indexOf('function baueWortFormular(');
  const fi = fk < 0 ? -1 : kat.indexOf('if (w.istPlural) return `', fk);
  const formular = fi < 0 ? '' : kat.slice(fi, kat.indexOf('`;', fi));
  if (!formular) f.push('V2 baueWortFormular() hat kein eigenes Formular für die Mehrzahlkarte');
  else {
    const fehlt = ['wkAr', 'wkDe', 'wkSentAr', 'wkSentDe'].filter(x => !formular.includes("'" + x + "'"));
    const zuviel = ['wkPl', 'wkRoot', 'wkType', 'wortartFeld('].filter(x => formular.includes(x));
    if (fehlt.length) f.push('V2 im Formular der Mehrzahlkarte fehlt: ' + fehlt.join(', '));
    if (zuviel.length) f.push('V2 im Formular der Mehrzahlkarte steht, was der Einzahl gehört: ' + zuviel.join(', '));
  }
  if (!kat.includes("anders('wkPl', 'pl')") || !kat.includes("anders('wkRoot', 'root')") || kat.includes("wert('wkPl') !== (WK_WORT.pl || '')"))
    f.push('V3 speichereOffenesFormular() zählt ein Feld, das im Formular fehlt, als geändert — jedes Schließen des Mehrzahl-Formulars speicherte');
  return f;
}

const mzBefunde = (() => { try { return missMehrzahl(KERN); } catch (e) { return ['M0 die Messung ließ sich nicht ausführen: ' + String(e && e.message).slice(0, 160)]; } })();
const vBefunde = verdrahtungMehrzahl(KAT);
befunde.push(...mzBefunde, ...vBefunde);

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

/* Störtests für den Teil „Mehrzahlkarte": je eine Regel zurückgebaut, die passende Prüfung muss rot werden. */
const MZ_STOERUNGEN = [
  { name: 'wendePluralAenderungenAn() legt nichts mehr darauf', erwartet: /^M1 /,
    kern: ['function wendePluralAenderungenAn(){\n', 'function wendePluralAenderungenAn(){ return 0;\n'] },
  { name: 'die arabische Form bleibt an der Mehrzahlkarte statt an der Einzahl', erwartet: /^M2 /,
    kern: ['  if (!gleich(ar, sg.pl) && !speichereWortAenderung(sg.id, { ar: sg.ar, de: sg.de, pl: ar })) return false;\n', ''] },
  { name: 'eine neue Bedeutung der Einzahl lässt die eigene der Mehrzahlkarte stehen', erwartet: /^M3 /,
    kern: ["normalize('NFC')) mehrzahlBedeutungFreigeben(id);", "normalize('NFC')) {}"] },
  { name: 'die Mehrzahlkarte speichert jedes Feld, auch das abgeleitete', erwartet: /^M4 /,
    kern: ['    if (v && !gleich(v, abgeleitet[f])) eigen[f] = v;', '    if (v) eigen[f] = v;'] },
  { name: 'Zurücksetzen zieht die Mehrzahlkarte nicht sofort nach', erwartet: /^M5 /,
    kern: ['  pluralKarteNachziehen(istPluralKarte(id) ? id.slice(0, -PLURAL_MARKE.length) : id);\n', ''] },
  { name: 'kein Bearbeiten-Knopf auf der Mehrzahlkarte (Stand bis v698)', erwartet: /^V1 /,
    kat: ["      <button class=\"btn btn-secondary btn-klein\" data-wkbearbeiten>${icon('note')}Bearbeiten</button>\n      <button class=\"btn btn-secondary btn-klein\" data-wkgrundwort",
          '      <button class="btn btn-secondary btn-klein" data-wkgrundwort'] },
  { name: 'ein Feld, das im Formular fehlt, zählt wieder als geändert', erwartet: /^V3 /,
    kat: ["anders('wkPl', 'pl')", "wert('wkPl') !== (WK_WORT.pl || '')"] },
];
for (const s of MZ_STOERUNGEN){
  const [quelle, paar] = s.kern ? [KERN, s.kern] : [KAT, s.kat];
  const treffer = quelle.split(paar[0]).length - 1;
  if (treffer !== 1){ befunde.push('Störtest „' + s.name + '": die Stelle steht ' + treffer + '× statt 1× — der Prüfer beweist dort nichts mehr, nachziehen.'); continue; }
  const gestoert = quelle.replace(paar[0], () => paar[1]);
  let r;
  try { r = s.kern ? missMehrzahl(gestoert) : verdrahtungMehrzahl(gestoert); }
  catch (e){ r = ['M0 ' + String(e && e.message).slice(0, 120)]; }
  if (!r.some(z => s.erwartet.test(z))) befunde.push('Störtest „' + s.name + '": blieb grün — die Prüfung kann diesen Fehler nicht sehen' + (r.length ? ' (' + r[0] + ')' : '') + '.');
  else stoer.push(s.name + ': rot, wie es sein muss');
}

/* ---------- Ausgabe ---------- */
console.log('--- Bleibt, was Elias im Formular ändert? ---\n');
for (const [name, id] of erg.herkunft) console.log('  ' + name.padEnd(34) + (id || '— kein Wort dieser Herkunft (' + (name.includes('Tausch') ? 'Buchdatei fehlt' : 'nicht im Bestand') + ')'));
const n = Object.keys(erg.neustart).length * FELDER.length;
console.log('\nNeustart:           ' + summe(erg.neustart) + ' von ' + n + ' Feldern verloren');
console.log('zweites Gerät:      ' + summe(erg.zweit) + ' von ' + n + ' Feldern nicht angekommen');
console.log('Zurücksetzen:       ' + (erg.zuruecksetzen || 'nicht geprüft'));
console.log('alte Änderung an der Buchkarte (vor der Bestellung): ' + (erg.altVorBestellung === 'ok' ? 'weicht der Beschreibung des Fachbegriffs' : (erg.altVorBestellung || 'nicht geprüft (Buchdatei fehlt)')));
console.log('Mehrzahlkarte:      ' + (mzBefunde.length ? mzBefunde.length + ' Befund(e)' : 'M1–M6 grün')
  + ' · Verdrahtung in js/kategorien.js: ' + (vBefunde.length ? vBefunde.length + ' Befund(e)' : 'V1–V3 grün'));
console.log('Störtests:');
for (const z of stoer) console.log('  · ' + z);

if (befunde.length){
  console.log('\n✖ ' + befunde.length + ' Befund(e):');
  befunde.forEach(z => console.log('  · ' + z));
  process.exit(1);
}
console.log('\n✅ Jede Änderung übersteht Neustart und Abgleich, das Zurücksetzen auch — an Mehrzahlkarten ebenso.');
process.exit(0);
