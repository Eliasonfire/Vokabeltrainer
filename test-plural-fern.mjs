/* test-plural-fern.mjs — Paket A3: nur die weit entfernten Mehrzahlen als eigene Karte (14.10.2026)
 *
 * Elias auf die Liste der acht und ihre Eselsbrücken: „ich bin mit deinen vorschlägen zufrieden,
 * fang an zu arbeiten". Geprüft wird am Quelltext (ausgeschnitten wie in test-plural-karte.mjs):
 *   1. pluralKartenStufe(): seit 19.10.2026 immer true — alle Pluralkarten, ohne Schalter (Elias:
 *      „wir sollen jeden einzelnen plural als eigene vokabel behandeln weil sonst merke ich es mir
 *      nicht"); die acht sind darin. Vom 14. bis 18.10.2026 ohne Schalter nur die acht ('fern').
 *   2. wendePluralKartenAn(): 'fern' baut genau die Pluralkarten der Liste, true alle, false keine,
 *      und ein Wechsel hinterlässt keine doppelten Karten.
 *   3. Die Liste ist genau die bestätigte, und jede ihrer Karten steht in seinem Bestand mit Mehrzahl.
 *   4. Jede Karte außer Spiegel hat unter `<id>#pl` in data/eselsbruecken-alt.js als ERSTEN Text eine
 *      eigene Eselsbrücke, die das Paar Einzahl → Mehrzahl genau so nennt wie die Karte. Ändert
 *      jemand das Feld pl einer der Karten, wird dieser Test rot.
 *   5. Verdrahtung: kein Plural-Schalter in index.html und js/einstellungen.js (auch nicht mehr
 *      „Plural als eigene Karten"), kein Umbau per Klick; die Aufrufe beim Start (js/kern.js,
 *      js/buecher.js) über pluralKartenStufe().
 * Dazu Störtests: jede Prüfung muss rot werden, wenn ihre Stelle kaputt ist.
 *
 * Aufruf: node test-plural-fern.mjs · Exit 0 = grün, 1 = rot
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const lies = p => fs.readFileSync(path.join(HIER, p), 'utf8');
const ECHT = {
  kern: lies('js/kern.js'), einst: lies('js/einstellungen.js'), buecher: lies('js/buecher.js'), html: lies('index.html'),
  alt: new Function(lies('data/eselsbruecken-alt.js') + '; return ESELSBRUECKEN_ALT;')()
};
/* Von Elias am 14.10.2026 bestätigt (To-Do Vokabeltrainer, Übergabe vom 13.10.2026, Abschnitt 10):
   Frau, Mutter, Imam, Tag, Hand, Vater, Mund, Spiegel. */
const BESTAETIGT = ['45919', '45846', '45779', '45887', '45857', '45847', '45853', '46020'];
const OHNE_BRUECKE = ['46020'];   /* Spiegel: kein ehrlicher Aufhänger gefunden */

function schneideFunktion(quelle, kopf){
  const a = quelle.indexOf(kopf);
  if (a < 0) throw new Error('nicht gefunden im Quelltext: ' + kopf);
  let tiefe = 0;
  for (let i = quelle.indexOf('{', a); i >= 0 && i < quelle.length; i++){
    if (quelle[i] === '{') tiefe++;
    else if (quelle[i] === '}'){ tiefe--; if (!tiefe) return quelle.slice(a, i + 1); }
  }
  throw new Error('kein Ende gefunden: ' + kopf);
}
function schneideBis(quelle, kopf, ende){
  const a = quelle.indexOf(kopf);
  if (a < 0) throw new Error('nicht gefunden im Quelltext: ' + kopf);
  const b = quelle.indexOf(ende, a);
  if (b < 0) throw new Error('Ende nicht gefunden: ' + kopf);
  return quelle.slice(a, b + ende.length);
}

/* Sein Bestand wie in werkzeuge/koran-eb-aufloesen.mjs: vocab-data.js und die Buchwörter bis zu
   seinem Kapitel (data/vokabeln-*.js liegen nur lokal; fehlt eine, fehlen ihre Karten). */
function bestand(){
  const b = new Map();
  const merke = w => { if (w && w.id !== undefined && !b.has(String(w.id))) b.set(String(w.id), w); };
  new Function(lies('vocab-data.js') + '; return VOCAB_DATA;')().forEach(merke);
  const stand = JSON.parse(lies('data/lernstand.json'));
  for (const [slug, bis] of Object.entries(stand.angabe || {})){
    if ((stand.nichtInArbeit || {})[slug]) continue;
    const f = {};
    try { new Function('window', lies('data/vokabeln-' + slug + '.js'))(f); } catch (e) { continue; }
    for (const w of ((f.VOKABELN && f.VOKABELN[slug]) || [])) if (Number(w.chapter) <= Number(bis)) merke(w);
  }
  return b;
}
const BESTAND = bestand();

function welt(q){
  const teile = [
    schneideBis(q.kern, 'const PLURAL_MARKE =', ';'),
    schneideFunktion(q.kern, 'function istPluralKarte('),
    'function istZahlwort(w){ return false; }',
    schneideFunktion(q.kern, 'function bauePluralKarte('),
    schneideFunktion(q.kern, 'function wendePluralKartenAn('),
    schneideBis(q.kern, 'const PLURAL_FERN =', '];'),
    schneideFunktion(q.kern, 'function pluralKartenStufe(')
  ].join('\n');
  const ctx = { VOCAB_DATA: [] };
  vm.createContext(ctx);
  vm.runInContext(teile + '\nthis.PLURAL_FERN = PLURAL_FERN; this.stufe = pluralKartenStufe; this.wende = wendePluralKartenAn;', ctx);
  return ctx;
}

function pruefe(q){
  const f = [];
  let w;
  try { w = welt(q); } catch (e) { return ['Quelltext nicht ausschneidbar: ' + e.message]; }
  /* 1 */
  /* Seit 19.10.2026 immer ALLE (Elias: „wir sollen jeden einzelnen plural als eigene vokabel
     behandeln …"); die acht sind darin enthalten. */
  if (w.stufe({}) !== true) f.push('1: ohne Einstellungen gibt es nicht alle Pluralkarten');
  if (w.stufe(undefined) !== true) f.push('1: ohne Einstellungen (undefined) gibt es nicht alle Pluralkarten');
  if (w.stufe({ pluralKarten: false }) !== true) f.push('1: ein alter Wert pluralKarten:false versteckt die Pluralkarten wieder');
  if (w.stufe({ pluralFern: false }) !== true) f.push('1: ein alter Wert pluralFern:false versteckt die Pluralkarten wieder');
  /* 3, die Liste */
  const liste = Array.from(w.PLURAL_FERN || []);
  if (JSON.stringify(liste) !== JSON.stringify(BESTAETIGT)) f.push('3: PLURAL_FERN ist nicht die bestätigte Liste: ' + liste.join(','));
  /* 2 */
  w.VOCAB_DATA = [...BESTAETIGT, '99901', '99902'].map(id => ({ id, ar: 'a' + id, pl: 'p' + id, de: 'Wort ' + id, type: 'noun' }))
    .concat([{ id: '99903', ar: 'a', de: 'ohne Mehrzahl', type: 'noun' }]);
  const plural = () => w.VOCAB_DATA.filter(k => String(k.id).endsWith('#pl')).map(k => k.id).sort();
  const soll = BESTAETIGT.map(id => id + '#pl').sort();
  w.wende('fern');
  if (JSON.stringify(plural()) !== JSON.stringify(soll)) f.push('2: fern baut nicht genau die acht: ' + plural().join(','));
  w.wende(true);
  if (plural().length !== 10) f.push('2: true baut nicht alle zehn (' + plural().length + ')');
  w.wende('fern');
  if (JSON.stringify(plural()) !== JSON.stringify(soll)) f.push('2: der Wechsel von alle zu fern lässt ' + plural().length + ' statt 8');
  w.wende(false);
  if (plural().length) f.push('2: false lässt Pluralkarten stehen');
  if (w.VOCAB_DATA.length !== 11) f.push('2: nach dem Ausschalten stimmt die Zahl der Grundkarten nicht (' + w.VOCAB_DATA.length + ')');
  /* 3, der Bestand */
  for (const id of liste){
    const k = BESTAND.get(id);
    if (!k) f.push('3: ' + id + ' steht nicht in seinem Bestand');
    else if (!k.pl) f.push('3: ' + id + ' hat keine Mehrzahl');
  }
  /* 4 */
  for (const id of liste){
    if (OHNE_BRUECKE.includes(id)) continue;
    const k = BESTAND.get(id);
    if (!k) continue;
    const texte = q.alt[id + '#pl'];
    const erste = Array.isArray(texte) ? String(texte[0] || '').normalize('NFC') : '';
    const paar = String(k.ar || k.sg).normalize('NFC') + ' → ' + String(k.pl).normalize('NFC');
    if (!erste) f.push('4: ' + id + '#pl hat keine eigene Eselsbrücke');
    else if (!erste.includes(paar)) f.push('4: die erste Eselsbrücke von ' + id + '#pl nennt das Paar der Karte nicht');
  }
  /* 5 — ⚠️ Eine Ausnahme ist gewollt: der Schalter „Mehrzahl mit eintippen" für das zweite Tippfeld
     (toggleMehrzahlEintippen, SETTINGS.mehrzahlEintippen, seit 20.10.2026, Voreinstellung aus).
     Elias: „und ich will erstmal bei ab box 4 die plural einschreiben erstmal aus machen weil ich
     die plurals noch gar nicht kenne, am besten eine einstellung die dierekt auf aus ist". Bewacht
     von test-plural-karte.mjs (T1, T10). Die alten Namen hier bleiben verboten — tippenPlural steht
     in seinem Stand noch auf true. */
  const zaehle = (t, s) => t.split(s).length - 1;
  for (const id of ['togglePluralFern', 'toggleShowPlural', 'toggleTippenPlural', 'togglePluralKarten'])
    if (q.html.includes('id="' + id + '"')) f.push('5: der Schalter ' + id + ' steht wieder in index.html');
  if (/SETTINGS\.(pluralFern|showPlural|tippenPlural|pluralKarten)/.test(q.einst)) f.push('5: js/einstellungen.js liest wieder einen Plural-Schalter');
  if (zaehle(q.einst, 'wendePluralKartenAn(') !== 0) f.push('5: js/einstellungen.js baut die Pluralkarten wieder auf einen Klick um');
  if (!q.buecher.includes('wendePluralKartenAn(pluralKartenStufe(SETTINGS))')) f.push('5: js/buecher.js baut die Pluralkarten nicht über pluralKartenStufe');
  if (!q.kern.includes("wendePluralKartenAn(pluralKartenStufe(LS.get('vt_settings', {}) || {}))")) f.push('5: der Start in js/kern.js baut nicht über pluralKartenStufe');
  return f;
}

function ersetze(t, alt, neu){
  const n = t.split(alt).length - 1;
  if (n !== 1) throw new Error('Störstelle kommt ' + n + '-mal vor: ' + alt.slice(0, 60));
  return t.replace(alt, neu);
}
const STOER = [
  ['die Mehrzahlen kommen wieder hinter den Schalter „Plural als eigene Karten"', q => ({ ...q, kern: ersetze(q.kern, 'function pluralKartenStufe(){\n  return true;\n}', "function pluralKartenStufe(s){\n  s = s || {};\n  return s.pluralKarten ? true : 'fern';\n}") })],
  ['der Schalter „Plural als eigene Karten" steht wieder in den Einstellungen', q => ({ ...q, html: q.html + '<button class="switch" id="togglePluralKarten"></button>' })],
  ['ein Klick baut die Pluralkarten wieder um', q => ({ ...q, einst: q.einst + '\nwendePluralKartenAn(pluralKartenStufe(SETTINGS));' })],
  ['fern baut alle', q => ({ ...q, kern: ersetze(q.kern, "const nur = an === 'fern' ? new Set(PLURAL_FERN) : null;", 'const nur = null;') })],
  ['Frau fehlt in der Liste', q => ({ ...q, kern: ersetze(q.kern, "const PLURAL_FERN = ['45919', ", 'const PLURAL_FERN = [') })],
  ['Brücke für Frau fehlt', q => ({ ...q, alt: Object.fromEntries(Object.entries(q.alt).filter(([k]) => k !== '45919#pl')) })],
  ['Brücke nennt ein falsches Paar', q => ({ ...q, alt: { ...q.alt, '45887#pl': ['x → y'] } })],
  ['js/buecher.js baut nur nach dem alten Schalter', q => ({ ...q, buecher: ersetze(q.buecher, 'wendePluralKartenAn(pluralKartenStufe(SETTINGS))', 'wendePluralKartenAn(!!SETTINGS.pluralKarten)') })],
  ['ein Plural-Schalter steht wieder in den Einstellungen', q => ({ ...q, html: q.html + '<button class="switch" id="toggleShowPlural"></button>' })],
  ['js/einstellungen.js liest wieder SETTINGS.tippenPlural', q => ({ ...q, einst: q.einst + '\nif (SETTINGS.tippenPlural) {}' })]
];

let rot = 0;
const sag = (ok, text) => { if (!ok) rot++; console.log((ok ? '  ok   ' : '  FEHL ') + text); };
console.log('--- Paket A3: weit entfernte Mehrzahl als eigene Karte ---');
const befund = pruefe(ECHT);
befund.forEach(b => console.log('       ' + b));
sag(!befund.length, 'echter Quelltext: ' + (befund.length ? befund.length + ' Befund(e)' : 'alles stimmt')
  + ' (Liste ' + BESTAETIGT.length + ' Karten, davon ' + (BESTAETIGT.length - OHNE_BRUECKE.length) + ' mit eigener Eselsbrücke; Bestand ' + BESTAND.size + ' Karten)');
console.log('--- Störtests ---');
for (const [name, mach] of STOER){
  let q;
  try { q = mach(ECHT); } catch (e) { sag(false, 'Störtest „' + name + '": ' + e.message); continue; }
  const n = pruefe(q).length;
  sag(n > 0, 'Störtest „' + name + '" wird rot (' + n + ')');
}
console.log(rot ? '\n⛔ ' + rot + ' rot' : '\n✅ alles grün');
process.exit(rot ? 1 : 0);
