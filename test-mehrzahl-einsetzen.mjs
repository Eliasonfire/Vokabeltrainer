#!/usr/bin/env node
/* test-mehrzahl-einsetzen.mjs — bewacht Übung 18 „Mehrzahl einsetzen" (13.10.2026).
 *
 * Elias am 13.10.2026: „denkst du mehr als nur verben macht sinn ?" und dazu:
 * „ich meinte auch andere wörter wie mann hat ja auch mehrzahl, ob man solche
 * übungen auch machen sollte also dann männer." Gebaut ist Stufe 1 („Auswählen").
 *
 * Bewacht — zuerst an Probekarten (allgemein bekannte Wörter, in Buckwalter-Umschrift
 * geschrieben und hier in Schrift gewandelt, kein getipptes Arabisch; gemischt wird dort
 * NICHT, damit jede Regel eine feste Antwort hat):
 *   1. Platz in der Liste: Nummer 18, Art „wahl", Nummern linear, Übersetzen 19,
 *      Satzbau 20; „Warum?" zeigt auf die Plural-Regel; Übung 16 und 18 sind ein Paar.
 *   2. Erkennung: nur ein Satzwort, das die MEHRZAHL einer Karte ist — nicht die
 *      Einzahl, nicht ein Zahlwort (dort ist `pl` die Form beim weiblichen Nomen),
 *      nicht eine Form, die auch die Einzahl sein könnte.
 *   3. Die Lücke zeigt das Wort nicht und behält sein Satzzeichen.
 *   4. KEINE SELBST GEBILDETE FORM: auf jedem Knopf steht eine Form genau so, wie sie
 *      im Feld `pl` einer Karte steht; vier verschiedene; zuerst derselbe Klang,
 *      dann dieselbe Art.
 *   5. Nie zur Wahl: dasselbe Wort auf einer zweiten Karte, eine Karte mit
 *      überschneidender Bedeutung, ein Zahlwort.
 *   6. Zwei Formen auf einer Karte: als Lösung steht die Form aus dem Satz.
 *   7. Dieselbe Mehrzahl zweimal im Satz: EINE Aufgabe, beide Stellen sind Lücke.
 *   8. Lösung und Auswahl tragen die Karte als Wert; die falschen Antworten bringen
 *      ihren Satz mit („… ist die Mehrzahl von …"), die richtige nicht.
 *   9. Die Auflösung: Form im Satz, Einzahl → Mehrzahl, Art — und seit 15.10.2026 KEIN „Klingt wie"
 *      (Elias zur Lernkarte: „dieses klingt wie ist quatsch, das soll raus").
 *  10. Von der Übersetzung bleibt das Wort der Karte lesbar — auch mit Umlaut.
 * Dann an SEINEM Satzvorrat (Auswahl aus .stand-app.json):
 *  11. Mindestens 15 Aufgaben; jede Knopf-Form steht auf einer seiner Karten, jede
 *      Lösung ist das Wort im Buchsatz; kein Zahlwort; seine zwei Teile bleiben, und
 *      die neue steht nie im selben Teil wie Übung 16.
 * Jede Zusicherung hat einen Störtest am ECHTEN Quelltext (js/uebung.js, im Speicher
 * verändert), der sie rot werden lassen muss.
 *
 *   node test-mehrzahl-einsetzen.mjs     Exit 0 = alles grün, alle Störtests schlagen an
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const W = path.dirname(fileURLToPath(import.meta.url));
const lies = p => fs.readFileSync(path.join(W, p), 'utf8');
const QUELLE = lies('js/uebung.js'), KERN = lies('js/kern.js');
const N = s => String(s).normalize('NFC');

/* ---------- Was die Übung aus js/kern.js braucht (geschnitten wie in test-plural-karte.mjs) ---------- */
function fn(q, kopf){
  const a = q.indexOf(kopf);
  if (a < 0) throw new Error('nicht gefunden: ' + kopf);
  let t = 0;
  for (let i = q.indexOf('{', a); i < q.length; i++){ if (q[i] === '{') t++; else if (q[i] === '}'){ t--; if (!t) return q.slice(a, i + 1); } }
  throw new Error('kein Ende: ' + kopf);
}
function bis(q, kopf, ende){ const a = q.indexOf(kopf); if (a < 0) throw new Error('nicht gefunden: ' + kopf); const b = q.indexOf(ende, a); return q.slice(a, b + ende.length); }
const KERN_TEILE = [bis(KERN, 'const ZAHLWORT_DE = ', '\n'), fn(KERN, 'function istZahlwort('), bis(KERN, 'const PLURAL_MARKE = ', '\n'), fn(KERN, 'function istPluralKarte('),
  bis(KERN, 'const FORM_TRENNER = ', '\n'), fn(KERN, 'function formen('), bis(KERN, 'const PL_Z = c =>', '\n  return aus;\n}'),
  'var PROGRESS = {}; function bekannteVokabeln(){ return VOCAB_DATA.filter(w => istBekannt(w)); }'].join('\n');

/* ---------- Probekarten (Buckwalter → Schrift, als Codepunkte) ---------- */
const BW = { "'": 0x621, '>': 0x623, '&': 0x624, '<': 0x625, '}': 0x626, A: 0x627, b: 0x628, p: 0x629, t: 0x62A, v: 0x62B, j: 0x62C,
  H: 0x62D, x: 0x62E, d: 0x62F, '*': 0x630, r: 0x631, z: 0x632, s: 0x633, $: 0x634, S: 0x635, D: 0x636, T: 0x637, Z: 0x638,
  E: 0x639, g: 0x63A, f: 0x641, q: 0x642, k: 0x643, l: 0x644, m: 0x645, n: 0x646, h: 0x647, w: 0x648, Y: 0x649, y: 0x64A,
  F: 0x64B, N: 0x64C, K: 0x64D, a: 0x64E, u: 0x64F, i: 0x650, '~': 0x651, o: 0x652 };
const ar = t => [...t].map(c => { if (c === ' ' || c === '/') return c; if (!(c in BW)) throw new Error('kein Buckwalter-Zeichen: ' + c); return String.fromCodePoint(BW[c]); }).join('').normalize('NFC');
const wz = t => [...t].map(c => ar(c)).join(' ');
const PUNKT = '.', FRAGE = String.fromCodePoint(0x61F);
const karte = (id, de, sg, pl, wurzel) => ({ id: String(id), de, ar: ar(sg), sg: ar(sg), pl: ar(pl), root: wz(wurzel), type: 'noun', chapter: 'personal' });
/* Die Reihenfolge zählt (es wird nicht gemischt): 11 und 21 stehen früh, damit ihre Sperren greifen müssen. */
const KARTEN = [
  karte(1, 'Mann', 'rajulN', 'rijAlN', 'rjl'),
  karte(11, 'der Mann (zweite Karte)', 'rajulN', 'rijAlN', 'rjl'),
  karte(21, 'Glaubensbruder', '>axN', '<ixowAnN', '>xw'),
  karte(2, 'groß / alt', 'kabiyrN', 'kibArN', 'kbr'),
  karte(3, 'Hund', 'kalobN', 'kilAbN', 'klb'),
  karte(4, 'Berg', 'jabalN', 'jibAlN', 'jbl'),
  karte(16, 'Berg (zweite Karte)', 'jabalN', 'jibAlN', 'jbl'),
  karte(5, 'Haus', 'bayotN', 'buyuwtN / >aboyAtN', 'byt'),
  karte(6, 'Herz', 'qalobN', 'quluwbN', 'qlb'),
  karte(7, 'Stift', 'qalamN', '>aqolAmN', 'qlm'),
  karte(8, 'Lehrer', 'mudar~isN', 'mudar~isuwna', 'drs'),
  karte(9, 'Auto', 'say~ArapN', 'say~ArAtN', 'syr'),
  karte(10, 'fünf', 'xamosapN', 'xamosN', 'xms'),
  karte(12, 'Buch', 'kitAbN', 'kutubN', 'ktb'),
  karte(19, 'groß (lang)', 'TawiylN', 'TiwAlN', 'Twl'),
  karte(20, 'Bruder', '>axN', '<ixowapN', '>xw'),
  karte(22, 'Schiff', 'fulokN', 'fulokN', 'flk'),
  karte(23, 'Ingenieur', 'muhanodisN', 'muhanodisuwna', 'hnds'),
  karte(24, 'Muslim', 'musolimN', 'musolimuwna', 'slm'),
  karte(25, 'Bauer', 'fal~AHN', 'fal~AHuwna', 'flH'),
  karte(27, 'Kamel', 'jamalN', 'jimAlN', 'jml'),
];
const satz = (...woerter) => woerter.map(w => ({ wort: w }));

/* Ein DOM, das sich nichts merkt — die Übung wird nur gebaut, nicht gezeichnet. */
function stumm(){
  return { style:{}, classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } }, dataset:{}, children:[], value:'', textContent:'', innerHTML:'', className:'', disabled:false,
    addEventListener(){}, removeEventListener(){}, appendChild(){}, querySelector(){ return null; }, querySelectorAll(){ return []; }, closest(){ return null; },
    getAttribute(){ return null; }, setAttribute(){}, removeAttribute(){}, focus(){}, getBoundingClientRect(){ return { width:0, height:0, top:0, left:0 }; } };
}
/* Die App wie in test-verb-einsetzen.mjs: seine Kapitelauswahl (.stand-app.json), die Buchkarten mit ihren
   Sätzen und die bestellten Fachbegriffe. `probe: true` tauscht danach den Wortschatz gegen die Probekarten. */
function lade(uebungQuelle, probe){
  const DOM = { getElementById: stumm, querySelector: stumm, querySelectorAll: () => [], createElement: stumm, addEventListener(){}, body: stumm(), documentElement: stumm() };
  const auswahl = JSON.parse(lies('.stand-app.json')).buecher || {};
  const ctx = { window:{ addEventListener(){}, matchMedia(){ return { matches:false, addEventListener(){} }; }, location:{ href:'' }, navigator:{ userAgent:'node', language:'de' }, VOKABELN:{}, innerWidth: 400 },
    document: DOM, localStorage:{ _d:{}, getItem(k){ return this._d[k] ?? null; }, setItem(k, v){ this._d[k] = String(v); }, removeItem(k){ delete this._d[k]; } },
    navigator:{ userAgent:'node', language:'de', onLine:true }, console:{ log(){}, warn(){}, error(){}, info(){} },
    Date, Math, JSON, Intl, setTimeout, clearTimeout, setInterval, clearInterval };
  ctx.globalThis = ctx; ctx.self = ctx; ctx.window.document = DOM; ctx.window.localStorage = ctx.localStorage;
  ctx.SETTINGS = { buecher: auswahl, eigene:true, fachbegriffe:true };
  ctx.todayStr = () => '2026-10-13';
  ctx.LS = { get: (k, d) => d, set(){} };
  ctx.shuffle = a => a.slice();
  ctx.toast = () => {};
  ctx.kapitelBeschriftung = () => '';
  ctx.escapeHtml = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  vm.createContext(ctx);
  const DATEIEN = ['vocab-data.js', 'data/beispielsaetze.js', 'data/fachbegriffe.js', 'grammar-data.js', 'lehrbuch-saetze.js', 'regelsammlung-data.js',
    ...fs.readdirSync(path.join(W, 'data')).filter(f => /^vokabeln-.*\.js$/.test(f)).map(f => 'data/' + f),
    'js/irab.js', 'js/saetze.js', 'js/uebersetzen.js', 'js/regeln.js'];
  for (const f of DATEIEN) vm.runInContext(lies(f), ctx, { filename: f });
  vm.runInContext(KERN_TEILE, ctx, { filename: 'js/kern.js (Teile)' });
  vm.runInContext(uebungQuelle, ctx, { filename: 'js/uebung.js' });
  const hole = n => vm.runInContext(`typeof ${n} !== 'undefined' ? ${n} : undefined`, ctx);
  const VD = hole('VOCAB_DATA'), BS = hole('BEISPIELSAETZE') || {};
  if (probe){
    VD.length = 0;
    for (const k of KARTEN) VD.push(k);
    ctx.istBekannt = () => true;
  } else {
    const bekannt = new Set(VD.map(w => String(w.id)));
    for (const [buch, liste] of Object.entries(ctx.window.VOKABELN || {})){
      const kap = auswahl[buch] || [];
      for (const w of liste) if (kap.includes(Number(w.chapter)) && !bekannt.has(String(w.id))){
        const s = BS[w.id] || {};
        VD.push({ ...w, sentAr: w.sentAr || s.sentAr, sentDe: w.sentDe || s.sentDe }); bekannt.add(String(w.id));
      }
    }
    const FV = hole('FACHBEGRIFF_VOKABELN') || [], FA = hole('FACHBEGRIFF_AUFTRAG') || {};
    for (const w of FV) if (Object.prototype.hasOwnProperty.call(FA, String(w.id)) && !bekannt.has(String(w.id))){ VD.push(w); bekannt.add(String(w.id)); }
    ctx.istBekannt = w => !!w && (w.chapter === 'personal' || bekannt.has(String(w.id)));
  }
  vm.runInContext('UEBUNG_LEX = null; UEB_WORTGRUPPEN = {}; if (typeof setzeLexikon === "function") setzeLexikon(VOCAB_DATA)', ctx);
  return { hole, ctx, run: code => vm.runInContext(code, ctx) };
}

function pruefe(quelle){
  const f = [];
  let app, echt;
  try { app = lade(quelle, true); echt = lade(quelle, false); } catch (e){ return { f: ['lädt nicht: ' + e.message], zahl: 0 }; }
  const { hole } = app;
  const UEBUNGEN = hole('UEBUNGEN') || [];
  const U = UEBUNGEN.find(u => u.id === 'mehrzahl-einsetzen');
  if (!U) return { f: ['Übung mehrzahl-einsetzen fehlt'], zahl: 0 };
  const baue = z => { try { return U.baue(z, { sentAr: z.map(t => t.wort).join(' '), sentDe: '' }) || []; } catch (e){ f.push('baue() wirft: ' + e.message); return []; } };
  const werte = a => a.optionen.map(o => o.wert).join(',');
  const eine = (z, wo) => { const a = baue(z); if (a.length !== 1) f.push(`${wo}: ${a.length} Aufgaben statt einer`); return a[0] || null; };

  /* 1 — Platz in der Liste */
  if (U.nr !== 18 || U.art !== 'wahl') f.push(`1: nr ${U.nr}, art ${U.art} (erwartet 18, wahl)`);
  if (typeof U.hinweisVerraet !== 'boolean' || U.falschNochmal !== 3 || U.optionenRtl !== true) f.push('1: hinweisVerraet, falschNochmal: 3 oder optionenRtl fehlt');
  const nummern = UEBUNGEN.map(u => u.nr).sort((a, b) => a - b);
  if (!nummern.every((n, i) => n === i + 1)) f.push('1: Nummern nicht linear 1 bis N: ' + nummern.join(','));
  const nrVon = id => (UEBUNGEN.find(u => u.id === id) || {}).nr;
  if (nrVon('uebersetzen') !== 19 || nrVon('satz-bauen') !== 20) f.push(`1: Übersetzen ${nrVon('uebersetzen')}, Satzbau ${nrVon('satz-bauen')} (erwartet 19 und 20)`);
  if (hole('UEBUNG_WARUM')['mehrzahl-einsetzen'] !== 'jam-salim-taksir-01') f.push('1: „Warum?" zeigt nicht auf jam-salim-taksir-01');
  /* Am Feld selbst geprüft, nicht am Kommentar darüber (der nennt das Paar auch). Heute stehen die zwei auch
     ohne das Paar in verschiedenen Teilen — das Paar hält sie dort, wenn sich die gemessenen Zeiten ändern. */
  if (!/const VERWANDT = \[[^\n]*\['plural', 'mehrzahl-einsetzen'\]/.test(fn(quelle, 'function satzTeile('))) f.push('1v: Übung 16 und 18 sind in satzTeile() kein Paar');

  /* 2 — Erkennung */
  const A = eine(satz(ar('>uwla}ika'), ar('rijAlN') + PUNKT), '2: «jene sind Männer»');
  if (baue(satz(ar('huwa'), ar('rajulN') + PUNKT)).length) f.push('2: die EINZAHL im Satz ergibt eine Aufgabe');
  if (baue(satz(ar('xamosN'))).length) f.push('2z: ein Zahlwort ergibt eine Aufgabe (bei ihm steht in pl die Form beim weiblichen Nomen)');
  if (baue(satz(ar('fulokN') + PUNKT)).length) f.push('2e: eine Form, die auch die Einzahl der Karte ist, ergibt eine Aufgabe');
  if (!baue(satz(ar('Alr~ijAlu'), ar('hunA') + PUNKT)).length) f.push('2: mit Artikel und Kasusendung wird die Mehrzahl nicht erkannt');

  if (A){
    /* 3 — die Lücke */
    if (A.ohneSuffix[1] !== '____' + PUNKT || A.wortIdx !== 1) f.push('3: die Lücke ist nicht „____." an der Stelle des Wortes: ' + JSON.stringify(A.ohneSuffix));
    /* 4 — die Knöpfe */
    if (werte(A) !== 'k1,k2,k3,k4') f.push('4k: zu „Mann" stehen nicht die drei ersten Karten desselben Klangs zur Wahl: ' + werte(A));
    if (N(A.optionen[0].text) !== ar('rijAlN')) f.push('4: die Lösung steht nicht so da wie auf der Karte');
    if (new Set(A.optionen.map(o => N(o.text))).size !== 4) f.push('4: keine vier verschiedenen Formen');
    /* 8 — Werte und der Satz zur falschen Wahl */
    if (A.loesung !== 'k1') f.push('8: die Lösung trägt nicht die Karte als Wert: ' + A.loesung);
    if (A.optionen[0].falsch) f.push('8: die richtige Antwort trägt einen „falsch"-Satz');
    const f2 = A.optionen.find(o => o.wert === 'k2');
    if (!f2 || !N(String(f2.falsch || '')).includes(ar('kabiyrN')) || !/ist die Mehrzahl von .* — groß\./.test(String(f2.falsch || ''))) f.push('8: der Satz zur falschen Wahl nennt nicht Einzahl und Bedeutung');
    /* 9 — die Auflösung */
    const t = N(A.aufloesung);
    if (!t.includes(ar('rajulN') + ' → ' + ar('rijAlN') + ' (Mann)')) f.push('9: Einzahl → Mehrzahl (Bedeutung) fehlt');
    if (!/Art: gebrochen/.test(t)) f.push('9: die Art fehlt');
    /* 9k — seit 15.10.2026 OHNE „Klingt wie". Elias zur Lernkarte: „dieses klingt wie ist quatsch, das soll raus";
       hier standen dieselben Partner. */
    if (/Klingt wie/.test(t)) f.push('9k: „Klingt wie" steht wieder in der Auflösung');
    /* 10 — die Übersetzung */
    if (!A.deKlar || !A.deKlar.test('Männer.') || !A.deKlar.test('Mann')) f.push('10: „Männer" bleibt in der Übersetzung nicht lesbar');
    if (A.deKlar && (A.deKlar.test('man') || A.deKlar.test('sind'))) f.push('10: ein fremdes Wort der Übersetzung bleibt lesbar');
  }
  /* 4 — zwei gleiche Formen nie nebeneinander (Berg steht auf zwei Karten), dieselbe Art zuerst */
  { const H = eine(satz(ar('hum'), ar('kilAbN') + PUNKT), '4: «Hunde»');
    if (H && new Set(H.optionen.map(o => N(o.text))).size !== H.optionen.length) f.push('4d: dieselbe Form steht zweimal zur Wahl: ' + werte(H));
    const L = eine(satz(ar('hum'), ar('mudar~isuwna') + PUNKT), '4: «Lehrer»');
    if (L && werte(L) !== 'k8,k23,k24,k25') f.push('4a: zu einer regelmäßigen Mehrzahl stehen nicht zuerst die regelmäßigen zur Wahl: ' + werte(L));
    if (L && (!/Art: regelmäßig männlich/.test(L.aufloesung) || /Klingt wie/.test(L.aufloesung))) f.push('9: regelmäßig — die Art fehlt oder „Klingt wie" steht da');
  }
  /* 5 — Sperren */
  { const T = eine(satz(ar('hum'), ar('TiwAlN') + PUNKT), '5: «groß (lang)»');
    if (T && /k2(,|$)/.test(werte(T))) f.push('5b: eine Karte mit überschneidender Bedeutung (groß) steht zur Wahl: ' + werte(T));
    const B = eine(satz(ar('hum'), ar('<ixowapN') + PUNKT), '5: «Brüder»');
    if (B && /k21(,|$)/.test(werte(B))) f.push('5w: dasselbe Wort auf einer zweiten Karte steht zur Wahl: ' + werte(B));
    for (const z of [satz(ar('hum'), ar('rijAlN')), satz(ar('hum'), ar('kutubN')), satz(ar('hum'), ar('mudar~isuwna'))])
      for (const a of baue(z)) if (/k10(,|$)/.test(werte(a))) f.push('2z: ein Zahlwort steht zur Wahl');
  }
  /* 6 — zwei Formen */
  { const X = eine(satz(ar('hunAka'), ar('>aboyAtN') + PUNKT), '6: «Häuser», zweite Form');
    if (X && (X.loesung !== 'k5' || N(X.optionen.find(o => o.wert === 'k5').text) !== ar('>aboyAtN'))) f.push('6: als Lösung steht nicht die Form aus dem Satz');
    if (X && !/zwei Formen/.test(X.aufloesung)) f.push('6: die Auflösung nennt die zwei Formen nicht');
    const Y = eine(satz(ar('fiy'), ar('Alobuyuwti') + PUNKT), '6: «in den Häusern», erste Form');
    if (Y && N(Y.optionen.find(o => o.wert === 'k5').text) !== ar('buyuwtN')) f.push('6: erste Form — als Lösung steht nicht die Form aus dem Satz');
  }
  /* 7 — dasselbe Wort zweimal */
  { const z = satz(ar('>ahum'), ar('mudar~isuwna') + FRAGE, ar('naEam'), ar('hum'), ar('mudar~isuwna') + PUNKT);
    const a = baue(z);
    if (a.length !== 1) f.push(`7: ${a.length} Aufgaben statt einer, obwohl dieselbe Mehrzahl zweimal dasteht`);
    else if (a[0].ohneSuffix[1] !== '____' + FRAGE || a[0].ohneSuffix[4] !== '____' + PUNKT) f.push('7: nicht beide Stellen sind Lücke: ' + JSON.stringify(a[0].ohneSuffix));
  }

  /* 11 — sein Satzvorrat */
  let zahl = 0;
  try {
    const E = echt.hole, UE = (E('UEBUNGEN') || []).find(u => u.id === 'mehrzahl-einsetzen');
    const an = E('analysiereSatz'), pool = (E('alleSaetze') || (() => []))();
    const VD = E('VOCAB_DATA'), istZahl = E('istZahlwort'), ohneE = E('uebungOhneEndung'), kand = E('uebungKandidaten'), istB = echt.ctx.istBekannt;
    const formenVon = w => String(w.pl || '').normalize('NFC').split(/\s*[\/|]\s*/).map(x => x.trim()).filter(Boolean);
    const jeKarte = new Map(VD.filter(w => w && w.pl && istB(w)).map(w => ['k' + w.id, w]));
    for (const s of pool){
      let z; try { z = an(s.sentAr); } catch (e){ continue; }
      for (const a of (UE.baue(z, s) || [])){
        zahl++;
        const wo = `11 (${s.id})`;
        if (a.optionen.length !== 4) f.push(`${wo}: ${a.optionen.length} Knöpfe statt vier`);
        for (const o of a.optionen){
          const w = jeKarte.get(o.wert);
          if (!w) { f.push(`${wo}: der Knopf ${o.wert} gehört zu keiner seiner Karten`); continue; }
          if (!formenVon(w).includes(N(o.text))) f.push(`${wo}: auf dem Knopf steht eine Form, die so nicht auf der Karte ${w.id} steht`);
          if (istZahl(w)) f.push(`${wo}: ein Zahlwort steht zur Wahl (${w.id})`);
        }
        const lw = jeKarte.get(a.loesung), lo = a.optionen.find(o => o.wert === a.loesung);
        if (!lw || !lo || !kand(z[a.wortIdx].wort).includes(ohneE(lo.text))) f.push(`${wo}: die Lösung ist nicht das Wort im Buchsatz`);
        if (!/____/.test(a.ohneSuffix[a.wortIdx] || '')) f.push(`${wo}: keine Lücke an der Stelle des Wortes`);
      }
    }
    if (zahl < 15) f.push(`11n: nur ${zahl} Aufgaben in seiner Auswahl (Pflicht 5: mindestens 15)`);
    const alle = E('UEBUNGEN'), mit = E('satzTeile')(), stelle = alle.indexOf(UE);
    alle.splice(stelle, 1);
    let ohne = null; try { ohne = E('satzTeile')(); } finally { alle.splice(stelle, 0, UE); }
    const gewechselt = alle.filter(m => m !== UE && ohne[1].includes(m.id) !== mit[1].includes(m.id)).map(m => m.nr);
    if (gewechselt.length) f.push('11t: seine zwei Teile bleiben nicht — den Teil wechseln die Übungen ' + gewechselt.join(', '));
    if ([1, 2].filter(t => mit[t].includes('mehrzahl-einsetzen')).length !== 1) f.push('11t: die neue steht nicht in genau einem Teil');
    if ([1, 2].some(t => mit[t].includes('mehrzahl-einsetzen') && mit[t].includes('plural'))) f.push('11v: im selben Teil wie Übung 16 (dieselben Wörter)');
  } catch (e){ f.push('11: die Messung an seinem Satzvorrat wirft — ' + e.message); }
  return { f, zahl };
}

let rot = 0;
const echt = pruefe(QUELLE);
if (echt.f.length){ console.log('❌ Echter Stand:'); echt.f.slice(0, 40).forEach(x => console.log('   ' + x)); rot = 1; }
else console.log(`✅ Echter Stand: ${echt.zahl} Aufgaben in seiner Auswahl; jede Knopf-Form steht auf einer seiner Karten, jede Lösung ist das Wort im Buchsatz.`);

const STOER = [
  ['Zahlwörter werden gefragt', '(bekannt && !bekannt(w)) || istZahlwort(w)) continue;', '(bekannt && !bekannt(w))) continue;', /^2z:/],
  ['eine Form, die auch die Einzahl ist, wird gefragt', 'if (k < 0 || istEinzahl) return null;', 'if (k < 0) return null;', /^2e:/],
  ['die Lücke zeigt das Wort', "luecke[j] = stellen[j].davor + '____' + stellen[j].danach;", 'luecke[j] = z[j].wort;', /^3:|^7:/],
  ['auf dem Knopf steht eine veränderte Form', "text: f.form,", "text: f.form + 'x',", /^4:|^11 /],
  ['derselbe Klang zählt nicht mehr', 'const klang = muster ? e.muster.indexOf(muster) : -1;', 'const klang = -1;', /^4k:/],
  ['dieselbe Art zählt nicht mehr', 'stufen[(e.art || null) === (ziel.art || null) ? 1 : 2]', 'stufen[2]', /^4a:/],
  ['dieselbe Form steht zweimal zur Wahl', '    if (gesehen.has(g)) continue;\n    gesehen.add(g);\n    const karte = f.eintrag.karte;', '    gesehen.add(g);\n    const karte = f.eintrag.karte;', /^4d:|^4:/],
  ['überschneidende Bedeutung steht zur Wahl', '    if (ueberlappt(e.bedeutungen, ziel.bedeutungen)) continue;', '', /^5b:/],
  ['dasselbe Wort auf einer zweiten Karte steht zur Wahl', 'if (e === ziel || e.einzahl === ziel.einzahl) continue;', 'if (e === ziel) continue;', /^5w:/],
  ['bei zwei Formen steht immer die erste da', "optionen: shuffle([{ wert: 'k' + v.id, text: st.eintrag.formen[st.k] },", "optionen: shuffle([{ wert: 'k' + v.id, text: st.eintrag.formen[0] },", /^6:/],
  ['dieselbe Mehrzahl zweimal bleibt zwei Aufgaben', 'x.eintrag === st.eintrag) ? j : -1', 'false) ? j : -1', /^7:/],
  ['die Lösung ist die Form statt der Karte', "loesung: 'k' + v.id,", 'loesung: st.eintrag.formen[st.k],', /^8:|^11 /],
  ['kein Satz zur falschen Wahl', "              falsch: `${f.form} ist die Mehrzahl von ${f.einzahl} — ${f.de}.` }))]),", '            }))]),', /^8:/],
  ['„Klingt wie" kommt in die Auflösung zurück', "test-mehrzahl-einsetzen.mjs (9k). */\n  return teile.join(' ');", "test-mehrzahl-einsetzen.mjs (9k). */\n  teile.push('Klingt wie x.');\n  return teile.join(' ');", /^9k:/],
  ['die Auflösung ohne die Art', '    if (art) teile.push(`Art: ${art.text}.`);', '', /^9:/],
  ['Umlaute werden nicht mehr gefaltet', ".replace(/ä/g, 'a')", '', /^10:/],
  ['teilRang fehlt', 'teilRang:101,', '', /^11t:|^11v:/],
  ['Übung 16 und 18 sind kein Paar mehr', " ['plural', 'mehrzahl-einsetzen'],", '', /^1v:|^11v:/],
  ['Übersetzen behält die alte Nummer', "id:'uebersetzen', nr:19,", "id:'uebersetzen', nr:18,", /^1:/]
];
for (const [name, alt, neu, muster] of STOER){
  const n0 = QUELLE.split(alt).length - 1;
  if (n0 !== 1){ console.log(`❌ Störtest „${name}": die Stelle kommt ${n0}-mal vor (erwartet 1)`); rot = 1; continue; }
  const r = pruefe(QUELLE.replace(alt, () => neu));
  const n = r.f.filter(x => muster.test(x)).length;
  if (n) console.log(`✅ Störtest „${name}" schlägt an (${n})`);
  else { console.log(`❌ Störtest „${name}" schlägt NICHT an` + (r.f.length ? ` — andere Befunde: ${r.f.slice(0, 2).join(' | ')}` : '')); rot = 1; }
}
console.log(rot ? '\n❌ test-mehrzahl-einsetzen: es gibt Befunde.' : `\n✅ test-mehrzahl-einsetzen: alle Zusicherungen grün, alle ${STOER.length} Störtests schlagen an.`);
process.exit(rot);
