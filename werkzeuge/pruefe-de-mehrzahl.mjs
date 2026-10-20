#!/usr/bin/env node
/* pruefe-de-mehrzahl.mjs — die deutsche Mehrzahl auf den Mehrzahlkarten
 * ==========================================================================
 *
 * ⛔⛔ DER SATZ, DEN DIESER PRÜFER BEWACHT — Elias, 20.10.2026 um 02:23:
 *
 *   „und bei den plural karten soll direkt der plural stehen also nicht ,,feld (plural)"
 *   sondern ,,felder (Plural)""
 *
 * Die Mehrzahlkarte (bauePluralKarte() in js/kern.js) fragt deMehrzahl(), und die schlägt jede
 * Teilbedeutung im Verzeichnis DE_MEHRZAHL (data/de-mehrzahl.js) nach. Fehlt eine, bleibt die
 * Karte bei „Feld (Plural)" — still, ohne Fehler. Darum:
 *
 *   A  Deckung: Jede Teilbedeutung (Trenner „/") eines Worts, das eine Mehrzahlkarte bekommt
 *      (Feld pl, kein Zahlwort nach der ECHTEN istZahlwort(), kein Adjektiv), hat einen
 *      Eintrag. Geprüft werden ALLE Quellen der App, nicht nur seine Auswahl — er kann jedes
 *      Buch jederzeit anhaken: vocab-data.js, alle data/vokabeln-*.js, seine arabicroots-
 *      Eigenliste, „Koran häufigste" und die Fachbegriffe, jeweils mit den Nachträgen aus
 *      data/feld-ausnahmen.js (die geben manchen Wörtern erst ihre Mehrzahl).
 *      ⚠️ Was er auf dem Gerät selbst an einer Bedeutung ändert, liegt nur in seinem Browser
 *      — das sieht hier nichts; dann bleibt dort die alte Form.
 *   B  Verzeichnis: Schlüssel und Werte NFC, ohne Leerzeichen außen, ohne „/" (der Trenner),
 *      ohne „(Plural)", ohne arabische Buchstaben; kein Schlüssel doppelt im Quelltext (ein
 *      Objekt nimmt sonst still den zweiten).
 *   C  Wirkung: deMehrzahl(), bauePluralKarte() und pluralKarteNachziehen() aus dem ECHTEN
 *      js/kern.js gegen Probekarten.
 *   D  Verdrahtung: index.html lädt data/de-mehrzahl.js vor js/kern.js, sw.js hat es im Vorrat.
 *   S  Störtests: jeder verändert den Quelltext, der zuständige Teil MUSS rot werden.
 *
 * Aufruf:  node werkzeuge/pruefe-de-mehrzahl.mjs              Exit 0 = hält · 1 = Befund
 *          node werkzeuge/pruefe-de-mehrzahl.mjs --fehlende   druckt nur die fehlenden Teilbedeutungen
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lies = p => fs.readFileSync(path.join(WURZEL, p), 'utf8');
const ECHT = { kern: lies('js/kern.js'), tabelle: lies('data/de-mehrzahl.js'), html: lies('index.html'), sw: lies('sw.js') };
const ARABISCH = new RegExp('[' + String.fromCodePoint(0x600) + '-' + String.fromCodePoint(0x6FF) + String.fromCodePoint(0x750) + '-' + String.fromCodePoint(0x77F) + ']');

function schneide(q, kopf){
  const a = q.indexOf(kopf);
  if (a < 0) throw new Error('nicht gefunden im Quelltext: ' + kopf);
  let t = 0;
  for (let i = q.indexOf('{', a); i >= 0 && i < q.length; i++){
    if (q[i] === '{') t++;
    else if (q[i] === '}' && !--t) return q.slice(a, i + 1);
  }
  throw new Error('kein Ende: ' + kopf);
}
const zeile = (q, anfang) => { const a = q.indexOf(anfang); if (a < 0) throw new Error('nicht gefunden: ' + anfang); return q.slice(a, q.indexOf('\n', a)); };

/* Die Tabelle aus ihrem Quelltext (so, wie die App sie lädt). */
function tabelleAus(text){
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(text + '\n;globalThis.__T = typeof DE_MEHRZAHL !== "undefined" ? DE_MEHRZAHL : null;'
    + ' globalThis.__G = typeof DE_MEHRZAHL_GANZ !== "undefined" ? DE_MEHRZAHL_GANZ : {};', ctx);
  return ctx.__T ? Object.assign(ctx.__T, { [GANZ]: ctx.__G || {} }) : null;
}
/* Die ganzen Bedeutungen hängen unter einem Symbol an der Tabelle — so zählen sie nicht als Schlüssel. */
const GANZ = Symbol('ganz');

/* ---------- A: alle Quellen laden ---------- */
const QUELLEN = (() => {
  const ctx = { window: { VOKABELN: {} }, console: { log(){}, warn(){}, error(){} } };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  const datei = (p, nachher) => { if (fs.existsSync(path.join(WURZEL, p))) vm.runInContext(lies(p) + '\n;' + (nachher || ''), ctx, { filename: p }); };
  for (const f of fs.readdirSync(path.join(WURZEL, 'data')).filter(f => /^vokabeln-.*\.js$/.test(f))) datei('data/' + f);
  datei('vocab-data.js', 'globalThis.__VD = typeof VOCAB_DATA !== "undefined" ? VOCAB_DATA : [];');
  datei('koran-haeufig-data.js', 'globalThis.__KH = typeof KORAN_HAEUFIG !== "undefined" ? KORAN_HAEUFIG : [];');
  datei('data/fachbegriffe.js', 'globalThis.__FB = typeof FACHBEGRIFF_VOKABELN !== "undefined" ? FACHBEGRIFF_VOKABELN : [];');
  datei('data/feld-ausnahmen.js', 'globalThis.__FELD = typeof wendeFeldErgaenzungenAn === "function" ? wendeFeldErgaenzungenAn : null;');
  vm.runInContext(zeile(ECHT.kern, 'const ZAHLWORT_DE = ') + '\n' + schneide(ECHT.kern, 'function istZahlwort(') + '\nglobalThis.__ZAHL = istZahlwort;', ctx);
  const q = { 'vocab-data.js': ctx.__VD || [], 'Koran häufigste': ctx.__KH || [], 'Fachbegriffe': ctx.__FB || [],
    'arabicroots-Eigenliste': ctx.window.EIGENE_VOKABELN || [] };
  for (const [slug, l] of Object.entries(ctx.window.VOKABELN || {})) q[slug] = l;
  /* Kopien, dann die Nachträge darauf — wie die App, ohne die geladenen Dateien zu verändern. */
  for (const k of Object.keys(q)){ q[k] = (q[k] || []).map(w => Object.assign({}, w)); if (ctx.__FELD) ctx.__FELD(q[k]); }
  return { listen: q, istZahlwort: ctx.__ZAHL, buecher: Object.keys(ctx.window.VOKABELN || {}).length };
})();

function deckung(tabelle){
  const fehlt = new Map(), ganzGenutzt = new Set();
  const ganz = (tabelle && tabelle[GANZ]) || {};
  let woerter = 0, teile = 0, adjektive = 0;
  for (const [quelle, liste] of Object.entries(QUELLEN.listen)){
    for (const w of liste){
      if (!w || !w.pl || !w.de || QUELLEN.istZahlwort(w)) continue;
      if (w.type === 'adjective'){ adjektive++; continue; }
      woerter++;
      const ganzSchluessel = String(w.de).trim().normalize('NFC');
      if (typeof ganz[ganzSchluessel] === 'string' && ganz[ganzSchluessel]){ ganzGenutzt.add(ganzSchluessel); teile++; continue; }
      for (const t of String(w.de).split('/')){
        const k = t.trim();
        teile++;
        if (!k || !tabelle || typeof tabelle[k.normalize('NFC')] !== 'string'){
          if (!fehlt.has(k)) fehlt.set(k, new Set());
          fehlt.get(k).add(quelle);
        }
      }
    }
  }
  return { fehlt, woerter, teile, adjektive, ganzGenutzt };
}

/* ---------- B: das Verzeichnis selbst ---------- */
function verzeichnis(text, tabelle, ganzGenutzt){
  const f = [];
  if (!tabelle || typeof tabelle !== 'object') return ['das Verzeichnis DE_MEHRZAHL fehlt oder ist kein Objekt'];
  /* Gezählt wird nur im Objekt DE_MEHRZAHL — DE_MEHRZAHL_GANZ dahinter hat eigene Schlüssel. */
  const a = text.indexOf('const DE_MEHRZAHL = {'), b = text.indexOf('\n};', a);
  const rumpf = a >= 0 && b > a ? text.slice(a, b) : '';
  const schluessel = [...rumpf.matchAll(/^\s*'([^']+)':|,\s*'([^']+)':/gm)].map(m => m[1] || m[2]);
  for (const [k, v] of Object.entries(tabelle[GANZ] || {})){
    if (typeof v !== 'string' || !v) f.push('ganze Bedeutung „' + k + '": kein Text als Wert');
    else if (v !== v.normalize('NFC') || k !== k.normalize('NFC')) f.push('ganze Bedeutung „' + k + '": nicht NFC');
    else if (/\(Plural\)/i.test(v) || ARABISCH.test(v)) f.push('ganze Bedeutung „' + k + '": „(Plural)" oder Arabisch im Wert');
    if (ganzGenutzt && !ganzGenutzt.has(k)) f.push('ganze Bedeutung „' + k + '" steht auf keiner Karte (Tippfehler oder veraltet)');
  }
  const gezaehlt = new Map();
  for (const s of schluessel) gezaehlt.set(s, (gezaehlt.get(s) || 0) + 1);
  const doppelt = [...gezaehlt].filter(([, n]) => n > 1).map(([s]) => s);
  if (doppelt.length) f.push('doppelt im Quelltext: ' + doppelt.join(', '));
  if (schluessel.length !== Object.keys(tabelle).length + doppelt.reduce((s, k) => s + gezaehlt.get(k) - 1, 0))
    f.push('der Quelltext nennt ' + schluessel.length + ' Schlüssel, das Objekt hat ' + Object.keys(tabelle).length + ' — das Zählmuster stimmt nicht mehr');
  for (const [k, v] of Object.entries(tabelle)){
    if (typeof v !== 'string' || !v) { f.push('„' + k + '": kein Text als Wert'); continue; }
    for (const [was, s] of [['Schlüssel', k], ['Wert', v]]){
      if (s !== s.normalize('NFC')) f.push('„' + k + '": ' + was + ' nicht NFC');
      if (s !== s.trim()) f.push('„' + k + '": ' + was + ' mit Leerzeichen außen');
      if (s.includes('/')) f.push('„' + k + '": ' + was + ' enthält den Trenner „/"');
      /* Im SCHLÜSSEL darf es stehen — manche Bedeutung trägt es schon im Buch („Vorläufer (Plural)"). */
      if (was === 'Wert' && /\(Plural\)/i.test(s)) f.push('„' + k + '": Wert enthält „(Plural)" — den hängt bauePluralKarte() selbst an');
      if (ARABISCH.test(s)) f.push('„' + k + '": ' + was + ' enthält arabische Buchstaben');
    }
  }
  return f;
}

/* ---------- C: die Wirkung am echten Quelltext ---------- */
function wirkung(kern, tabellenText){
  const f = [];
  const ctx = { console: { log(){}, warn(){}, error(){} } };
  vm.createContext(ctx);
  vm.runInContext([tabellenText === null ? '' : tabellenText,
    zeile(kern, 'const ZAHLWORT_DE = '), schneide(kern, 'function istZahlwort('),
    zeile(kern, 'const PLURAL_MARKE = '), schneide(kern, 'function istPluralKarte('),
    schneide(kern, 'function deMehrzahl('), schneide(kern, 'function bauePluralKarte('),
    zeile(kern, 'const AENDERBAR = '), zeile(kern, 'const MEHRZAHL_EIGENE = '),
    schneide(kern, 'function hatWortAenderung('), schneide(kern, 'function pluralKarteNachziehen('),
    'let VOCAB_DATA = []; let WORT_AENDERUNGEN = {};'].join('\n'), ctx);
  const hole = c => vm.runInContext(c, ctx);
  const karte = (de, type) => hole('(bauePluralKarte(' + JSON.stringify({ id: '1', de, ar: 'a', pl: 'b', type: type || 'noun' }) + ') || {}).de');
  const soll = (ist, erwartet, was) => { if (ist !== erwartet) f.push(was + ': „' + ist + '" statt „' + erwartet + '"'); };
  soll(karte('Feld'), 'Felder (Plural)', 'C1 „Feld"');
  soll(karte('Spielplatz / Sportplatz'), 'Spielplätze / Sportplätze (Plural)', 'C2 zwei Teilbedeutungen');
  soll(karte('Feld / Wortohneeintrag'), 'Feld / Wortohneeintrag (Plural)', 'C3 eine Teilbedeutung fehlt: die ganze Karte bleibt bei der alten Form');
  soll(karte('Feld', 'adjective'), 'Feld (Plural)', 'C4 ein Adjektiv bleibt, wie es ist (auch wenn das Wort im Verzeichnis steht)');
  soll(karte('Rat / Ratschlag'), 'Ratschläge (Plural)', 'C8 eine ganze Bedeutung (DE_MEHRZAHL_GANZ) geht vor den Teilen');
  soll(karte('Rat'), 'Räte (Plural)', 'C9 „Rat" allein bleibt die Versammlung');
  /* C5: Lehrer → Professor an der Einzahl, die Mehrzahlkarte zieht nach; eine eigene Änderung an
     der Mehrzahlkarte gewinnt (Regel aus v695). */
  hole('VOCAB_DATA = [{ id: "7", de: "Lehrer", ar: "a", pl: "b", type: "noun" }]; VOCAB_DATA.push(bauePluralKarte(VOCAB_DATA[0]));'
    + ' VOCAB_DATA[0].de = "Professor"; pluralKarteNachziehen("7");');
  soll(hole('VOCAB_DATA[1].de'), 'Professoren (Plural)', 'C5 Änderung an der Einzahl, danach pluralKarteNachziehen()');
  /* C6 seit 20.10.2026 (Mehrzahlkarten bearbeiten) OHNE die Bedeutung vorher an die Karte zu
     schreiben: nach einem Neustart ist die Karte frisch gebaut, und pluralKarteNachziehen() muss
     seine Änderung selbst darauflegen. Vorher stand hier `VOCAB_DATA[1].de = "meine Lehrer"`,
     und damit prüfte C6 nur, dass die Funktion die Karte in Ruhe lässt. */
  hole('WORT_AENDERUNGEN = { "7#pl": { de: "meine Lehrer" } }; VOCAB_DATA[0].de = "Feld"; pluralKarteNachziehen("7");');
  soll(hole('VOCAB_DATA[1].de'), 'meine Lehrer', 'C6 seine eigene Änderung an der Mehrzahlkarte gewinnt, auch an einer frisch gebauten Karte');
  return f;
}
/* Ohne Verzeichnis (Datei nicht geladen) bleibt alles bei der alten Form, ohne Absturz. */
function ohneVerzeichnis(kern){
  const f = [];
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext([zeile(kern, 'const ZAHLWORT_DE = '), schneide(kern, 'function istZahlwort('), zeile(kern, 'const PLURAL_MARKE = '),
    schneide(kern, 'function istPluralKarte('), schneide(kern, 'function deMehrzahl('), schneide(kern, 'function bauePluralKarte(')].join('\n'), ctx);
  let ist;
  try { ist = vm.runInContext('bauePluralKarte({ id: "1", de: "Feld", ar: "a", pl: "b", type: "noun" }).de', ctx); }
  catch (e){ ist = 'wirft: ' + e.message; }
  if (ist !== 'Feld (Plural)') f.push('C7 ohne data/de-mehrzahl.js: „' + ist + '" statt „Feld (Plural)"');
  return f;
}

/* ---------- D: Verdrahtung ---------- */
function verdrahtung(html, sw){
  const f = [];
  const ohneKomm = html.replace(/<!--[\s\S]*?-->/g, '');
  const t = ohneKomm.indexOf('<script src="data/de-mehrzahl.js"></script>'), k = ohneKomm.indexOf('<script src="js/kern.js"></script>');
  if (t < 0) f.push('index.html lädt data/de-mehrzahl.js nicht');
  else if (k < 0 || t > k) f.push('index.html lädt data/de-mehrzahl.js erst NACH js/kern.js');
  if (!sw.includes("'./data/de-mehrzahl.js',")) f.push('sw.js hat data/de-mehrzahl.js nicht im Vorrat (offline fehlte die Mehrzahl)');
  return f;
}

function alles(q){
  const tabelle = (() => { try { return tabelleAus(q.tabelle); } catch (e){ return null; } })();
  const d = deckung(tabelle);
  const befunde = { A: [...d.fehlt].map(([k, qs]) => '„' + k + '" (' + [...qs].join(', ') + ')'), B: verzeichnis(q.tabelle, tabelle, d.ganzGenutzt),
    C: [], D: verdrahtung(q.html, q.sw) };
  try { befunde.C = wirkung(q.kern, q.tabelle).concat(ohneVerzeichnis(q.kern)); } catch (e){ befunde.C = ['wirft: ' + e.message]; }
  return { befunde, d, tabelle };
}

const echt = alles(ECHT);
if (process.argv.includes('--fehlende')){
  console.log([...echt.d.fehlt.keys()].join(' | '));
  console.log('\n' + echt.d.fehlt.size + ' fehlende Teilbedeutung(en).');
  process.exit(echt.d.fehlt.size ? 1 : 0);
}

let rot = 0;
const sag = (ok, text) => { if (!ok) rot++; console.log((ok ? '  ok   ' : '  FEHL ') + text); };
console.log('=== Deutsche Mehrzahl auf den Mehrzahlkarten (Elias, 20.10.2026: „felder (Plural)") ===');
console.log('  gemessen: ' + echt.d.woerter + ' Nomen mit Mehrzahlkarte in ' + Object.keys(QUELLEN.listen).length + ' Quellen ('
  + QUELLEN.buecher + ' Bücher), ' + echt.d.teile + ' Teilbedeutungen; ' + echt.d.adjektive + ' Adjektive bleiben, wie sie sind; Verzeichnis '
  + (echt.tabelle ? Object.keys(echt.tabelle).length : 0) + ' Einträge');
const zeige = (teil, text, liste) => sag(!liste.length, teil + ' ' + text + (liste.length ? ' — ' + liste.length + ': ' + liste.slice(0, 8).join(' · ') + (liste.length > 8 ? ' …' : '') : ''));
zeige('A', 'jede Teilbedeutung hat ihre deutsche Mehrzahl', echt.befunde.A);
zeige('B', 'das Verzeichnis ist sauber (NFC, kein Trenner, kein „(Plural)", kein Arabisch, nichts doppelt)', echt.befunde.B);
zeige('C', 'deMehrzahl(), bauePluralKarte() und pluralKarteNachziehen() wirken wie verlangt', echt.befunde.C);
zeige('D', 'index.html und sw.js laden das Verzeichnis', echt.befunde.D);

/* ---------- S: Störtests ---------- */
function ersetze(t, alt, neu, wo){
  const n = t.split(alt).length - 1;
  if (n !== 1) throw new Error('Störtest „' + wo + '": die Stelle kommt ' + n + '-mal vor (erwartet 1)');
  return t.replace(alt, () => neu);
}
const STOER = [
  ['S1 bauePluralKarte() fragt das Verzeichnis nicht mehr', 'C',
    q => ({ ...q, kern: ersetze(q.kern, "const mehrzahl = typeof deMehrzahl === 'function' ? deMehrzahl(w) : null;", 'const mehrzahl = null;', 'S1') })],
  ['S2 eine fehlende Teilbedeutung bleibt stehen, die anderen werden übersetzt', 'C',
    q => ({ ...q, kern: ersetze(q.kern, "    if (typeof v !== 'string' || !v) return null;\n", "    if (typeof v !== 'string' || !v){ aus.push(teil); continue; }\n", 'S2') })],
  ['S3 auch Adjektive bekommen eine Mehrzahl', 'C',
    q => ({ ...q, kern: ersetze(q.kern, " || w.type === 'adjective') return null;", ') return null;', 'S3') })],
  ['S4 pluralKarteNachziehen() übernimmt die Bedeutung nicht mehr', 'C',
    q => ({ ...q, kern: ersetze(q.kern, '    else if (neu[f] !== undefined) pk[f] = neu[f];\n', '', 'S4') })],
  ['S10 die ganzen Bedeutungen werden nicht mehr gefragt', 'C',
    q => ({ ...q, kern: ersetze(q.kern, "  if (typeof ganz === 'string' && ganz) return ganz;\n", '', 'S10') })],
  ['S5 der Eintrag „Feld" fehlt im Verzeichnis', 'A',
    q => ({ ...q, tabelle: ersetze(q.tabelle, " 'Feld': 'Felder',", '', 'S5') })],
  ['S6 ein Schlüssel steht doppelt', 'B', q => ({ ...q, tabelle: ersetze(q.tabelle, '  /* ---- Bedeutungen, die er selbst geändert',
    "  'Feld': 'Felder',\n  /* ---- Bedeutungen, die er selbst geändert", 'S6') })],
  ['S7 ein Wert enthält „(Plural)"', 'B', q => ({ ...q, tabelle: ersetze(q.tabelle, "'Gast': 'Gäste',", "'Gast': 'Gäste (Plural)',", 'S7') })],
  ['S8 index.html lädt das Verzeichnis nicht', 'D', q => ({ ...q, html: ersetze(q.html, '<script src="data/de-mehrzahl.js"></script>', '', 'S8') })],
  ['S9 sw.js hat das Verzeichnis nicht im Vorrat', 'D', q => ({ ...q, sw: ersetze(q.sw, "  './data/de-mehrzahl.js',\n", '', 'S9') })],
];
console.log('\n=== S  Störtests: ohne die Regel MUSS der zuständige Teil rot werden ===');
for (const [name, teil, mach] of STOER){
  let e;
  try { e = alles(mach(ECHT)); } catch (err){ sag(false, name + ' — ' + err.message); continue; }
  sag(e.befunde[teil].length > 0, name + ' → Teil ' + teil + ' wird rot (' + e.befunde[teil].length + ')');
}
console.log(rot ? '\n⛔ ' + rot + ' Befund(e).' : '\n✅ Jede Mehrzahlkarte zeigt die deutsche Mehrzahl: ' + echt.d.teile + ' Teilbedeutungen gedeckt, ' + STOER.length + ' Störtests wirksam.');
process.exit(rot ? 1 : 0);
