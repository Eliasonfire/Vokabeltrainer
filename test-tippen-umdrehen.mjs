#!/usr/bin/env node
/* test-tippen-umdrehen.mjs — richtig getippt + Eingabetaste: die Karteikarte dreht sich um (v701).
 * ==========================================================================
 *
 * ⛔⛔ DER SATZ, DEN DIESER PRÜFSTAND BEWACHT — VON ELIAS, 20.10.2026 um 04:50
 *
 *   „ich möchte, dass wenn ich das arabische bei den karteikarten richtig geschrieben habe und
 *   auf der tastatur auf enter drücke und es richtig ist, dass sich die karte dann direkt
 *   umdreht. nur wenn es falsch ist soll es so bleiben"
 *
 * Die AUSNAHME ist der Kern: falsch getippt bleibt die Karte stehen, mit „Noch nicht.".
 *
 * Alles läuft am ECHTEN Quelltext von js/lernen.js: pruefeTippen(), tippPruefenUndUmdrehen(),
 * tippTaste() und die beiden Horcher auf die Eingabetaste (erstes Feld, zweites Feld für die
 * Mehrzahl) werden herausgeschnitten und gegen ein Doppel der Seite gefahren. Nachgebildet sind
 * nur die Seite und tippPluralDran() — wann das zweite Feld dran ist, prüft test-plural-karte.mjs.
 * Arabisch steht hier als Codepunkte.
 *
 *   U1  richtig + Eingabetaste: Karte gedreht, Tastatur zu, Hinweis nachgerechnet
 *   U2  falsch + Eingabetaste: Karte bleibt, Feld behält den Fokus, „Noch nicht."
 *   U3  leeres Feld: nichts passiert
 *   U4  zwei Felder: erst wenn Wort UND Mehrzahl stimmen
 *   U5  die Taste „Prüfen" am Tablet wie die Eingabetaste
 *   U6  ein zweites Enter dreht nicht zurück
 *   U7  eingeordnet wird nicht: Lernstand und Runde bleiben unberührt
 *   Störtests: je eine Regel wird aus dem Quelltext genommen, der zuständige Fall MUSS scheitern.
 *
 * Aufruf: node test-tippen-umdrehen.mjs      Exit 0 = alles in Ordnung
 */
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const LERNEN = fs.readFileSync(path.join(HIER, 'js/lernen.js'), 'utf8').replace(/\r\n/g, '\n');

/* Eine Funktion samt Rumpf, über die Klammertiefe. */
function schneideFunktion(quelle, kopf){
  const a = quelle.indexOf('\n' + kopf);
  if (a < 0) throw new Error('im Quelltext nicht gefunden: ' + kopf);
  let i = quelle.indexOf('{', quelle.indexOf(')', a)), tiefe = 0;
  for (; i < quelle.length; i++){
    if (quelle[i] === '{') tiefe++;
    else if (quelle[i] === '}'){ tiefe--; if (!tiefe) return quelle.slice(a + 1, i + 1); }
  }
  throw new Error('kein Ende gefunden: ' + kopf);
}
/* Ein Stück von `anfang` bis einschließlich `ende`. */
function schneideBis(quelle, anfang, ende){
  const a = quelle.indexOf(anfang);
  if (a < 0) throw new Error('im Quelltext nicht gefunden: ' + anfang.slice(0, 60));
  const b = quelle.indexOf(ende, a);
  if (b < 0) throw new Error('kein Ende gefunden: ' + anfang.slice(0, 60));
  return quelle.slice(a, b + ende.length);
}

const z = (...c) => String.fromCodePoint(...c);
const KITAB_VOLL  = z(0x0643, 0x0650, 0x062A, 0x064E, 0x0627, 0x0628, 0x064C);   /* kitābun */
const KITAB_NACKT = z(0x0643, 0x062A, 0x0627, 0x0628);                           /* kitāb, ohne Vokalzeichen */
const KUTUB_VOLL  = z(0x0643, 0x064F, 0x062A, 0x064F, 0x0628, 0x064C);           /* kutubun */
const KUTUB_NACKT = z(0x0643, 0x062A, 0x0628);                                   /* kutub, ohne Vokalzeichen */
const QALAM_NACKT = z(0x0642, 0x0644, 0x0645);                                   /* qalam, ein anderes Wort */

/* Das Doppel der Seite. blur() gibt den Fokus ab wie im Browser: document.activeElement ist danach
   nicht mehr das Feld. Horcher werden gesammelt und von feuere() gerufen. */
function welt(lernen, opt){
  const doc = { activeElement: null, el: {} };
  const element = (id, klassen) => {
    const k = new Set(klassen || []), horcher = {};
    const e = {
      id, value: '', textContent: '', className: '', dataset: {}, blurs: 0, selectionStart: 0, selectionEnd: 0,
      classList: { add: x => k.add(x), remove: x => k.delete(x), contains: x => k.has(x),
        toggle: (x, an) => { const soll = an === undefined ? !k.has(x) : !!an; if (soll) k.add(x); else k.delete(x); return soll; } },
      addEventListener(typ, fn){ (horcher[typ] = horcher[typ] || []).push(fn); },
      feuere(typ, ereignis){ for (const fn of horcher[typ] || []) fn(ereignis); },
      blur(){ e.blurs++; if (doc.activeElement === e) doc.activeElement = null; },
      setSelectionRange(a, b){ e.selectionStart = a; e.selectionEnd = b; },
    };
    return e;
  };
  for (const [id, kl] of [['flashcard', opt.gedreht ? ['flashcard', 'flipped'] : ['flashcard']], ['cardTippBox', ['tipp-box']],
    ['cardTippEingabe', []], ['cardTippPlural', opt.zweiFelder ? [] : ['hidden']], ['cardTippAntwort', []], ['cardTippTasten', ['hidden']]])
    doc.el[id] = element(id, kl);
  const document = { getElementById: id => doc.el[id] || null };
  Object.defineProperty(document, 'activeElement', { get: () => doc.activeElement, set: v => { doc.activeElement = v; } });
  const ctx = { console: { log(){}, warn(){}, error(){} }, document, __hinweis: 0 };
  vm.createContext(ctx);
  vm.runInContext('let PROGRESS = ' + JSON.stringify(opt.fortschritt || { k: { box: 4 } })
    + '; let SESSION = { words: ' + JSON.stringify(opt.karten) + ', idx: 0, dirs: [], fertig: false };'
    /* NACHGEBILDET: wann das zweite Feld dran ist (die Regel selbst prüft test-plural-karte.mjs). */
    + ' function tippPluralDran(w){ return ' + (opt.zweiFelder ? 'true' : 'false') + '; }'
    + ' function aktualisiereMehrHinweis(){ __hinweis++; }', ctx);
  const stuecke = [
    schneideFunktion(lernen, 'function pruefeTippen('),
    schneideFunktion(lernen, 'function tippPruefenUndUmdrehen('),
    schneideFunktion(lernen, 'function tippTaste('),
    schneideBis(lernen, "document.getElementById('cardTippEingabe').addEventListener('keydown', (e)=>{", '\n});'),
    schneideBis(lernen, "(function(){\n  const kasten = document.getElementById('cardTippBox');\n  for (const id of ['cardTippEingabe', 'cardTippPlural']){", '\n})();'),
  ];
  vm.runInContext(stuecke.join('\n'), ctx);
  const hole = code => vm.runInContext(code, ctx);
  const enter = feld => { const e = { key: 'Enter', verhindert: false, preventDefault(){ this.verhindert = true; }, stopPropagation(){} };
    doc.el[feld].feuere('keydown', e); return e; };
  return {
    el: doc.el, doc, ctx, hole,
    /* Text ins Feld, Fokus aufs Feld, dann die Eingabetaste in DIESEM Feld. */
    tippe(wort, mehrzahl, feld = 'cardTippEingabe'){
      doc.el.cardTippEingabe.value = wort;
      if (mehrzahl !== undefined) doc.el.cardTippPlural.value = mehrzahl;
      doc.activeElement = doc.el[feld];
      return enter(feld);
    },
    gedreht: () => doc.el.flashcard.classList.contains('flipped'),
    antwort: () => doc.el.cardTippAntwort.className + ' | ' + doc.el.cardTippAntwort.textContent,
  };
}

const EIN_WORT = { karten: [{ id: 'k', ar: KITAB_VOLL, de: 'das Buch' }] };
const MIT_MEHRZAHL = { karten: [{ id: 'k', ar: KITAB_VOLL, de: 'das Buch', pl: KUTUB_VOLL }], zweiFelder: true };

function laufe(lernen){
  const erg = new Map();
  const fall = (name, fn) => {
    let r;
    try { r = fn(); } catch (e){ r = 'wirft: ' + e.message; }
    erg.set(name, { ok: r === true, zusatz: r === true ? '' : String(r) });
  };

  fall('U1 Richtig getippt + Eingabetaste: die Karte dreht sich um, das Feld gibt den Fokus ab (Tastatur zu), der Hinweis wird nachgerechnet', () => {
    const w = welt(lernen, EIN_WORT);
    const e = w.tippe(KITAB_NACKT);
    if (!e.verhindert) return 'die Eingabetaste wird nicht abgefangen';
    if (!w.gedreht()) return 'die Karte ist nicht umgedreht (' + w.antwort() + ')';
    if (w.el.cardTippEingabe.blurs !== 1 || w.doc.activeElement) return 'das Feld behält den Fokus — die Tastatur läge über der Rückseite';
    if (w.ctx.__hinweis !== 1) return 'aktualisiereMehrHinweis() wurde ' + w.ctx.__hinweis + '-mal gerufen, erwartet 1';
    return w.antwort() === 'tipp-antwort richtig | Richtig — umdrehen und einordnen.' ? true : 'Urteil: ' + w.antwort();
  });

  fall('U2 Falsch getippt + Eingabetaste: die Karte bleibt stehen, das Feld behält den Fokus, „Noch nicht." — die Ausnahme in seinem Satz', () => {
    const w = welt(lernen, EIN_WORT);
    w.tippe(QALAM_NACKT);
    if (w.gedreht()) return 'falsch getippt, und die Karte dreht sich trotzdem um';
    if (w.el.cardTippEingabe.blurs || w.doc.activeElement !== w.el.cardTippEingabe) return 'falsch getippt, und das Feld verliert den Fokus — er kann nicht weiterschreiben';
    return w.antwort() === 'tipp-antwort falsch | Noch nicht.' ? true : 'Urteil: ' + w.antwort();
  });

  fall('U3 Leeres Feld + Eingabetaste: nichts passiert, kein Urteil', () => {
    const w = welt(lernen, EIN_WORT);
    w.tippe('   ');
    if (w.gedreht()) return 'leeres Feld, und die Karte dreht sich um';
    return w.antwort() === 'tipp-antwort | ' ? true : 'Urteil: ' + w.antwort();
  });

  fall('U4 Zwei Felder (Wort und Mehrzahl): gedreht wird erst, wenn BEIDE stimmen — in welchem Feld die Eingabetaste kam, ist gleich', () => {
    const nurWort = welt(lernen, MIT_MEHRZAHL); nurWort.tippe(KITAB_NACKT, '');
    if (nurWort.gedreht()) return 'nur das Wort stimmt, und die Karte dreht sich um';
    const nurMz = welt(lernen, MIT_MEHRZAHL); nurMz.tippe(QALAM_NACKT, KUTUB_NACKT, 'cardTippPlural');
    if (nurMz.gedreht()) return 'nur die Mehrzahl stimmt, und die Karte dreht sich um';
    const ersteFeld = welt(lernen, MIT_MEHRZAHL); ersteFeld.tippe(KITAB_NACKT, KUTUB_NACKT, 'cardTippEingabe');
    if (!ersteFeld.gedreht()) return 'beide stimmen (Eingabetaste im Wortfeld), und die Karte bleibt stehen';
    const zweiteFeld = welt(lernen, MIT_MEHRZAHL); zweiteFeld.tippe(KITAB_NACKT, KUTUB_NACKT, 'cardTippPlural');
    if (!zweiteFeld.gedreht()) return 'beide stimmen (Eingabetaste im Mehrzahlfeld), und die Karte bleibt stehen';
    if (zweiteFeld.el.cardTippPlural.blurs !== 1 || zweiteFeld.doc.activeElement) return 'das Mehrzahlfeld behält den Fokus';
    return true;
  });

  fall('U5 Die Taste „Prüfen" am Tablet tut dasselbe wie die Eingabetaste: richtig → gedreht, falsch → bleibt', () => {
    const r = welt(lernen, EIN_WORT);
    r.el.cardTippEingabe.value = KITAB_NACKT; r.doc.activeElement = r.el.cardTippEingabe;
    r.hole('tippTaste("pruefen")');
    if (!r.gedreht()) return 'richtig getippt, „Prüfen" gedrückt, und die Karte bleibt stehen';
    if (r.el.cardTippEingabe.value !== KITAB_NACKT) return '„Prüfen" verändert den Text im Feld';
    const f = welt(lernen, EIN_WORT);
    f.el.cardTippEingabe.value = QALAM_NACKT; f.doc.activeElement = f.el.cardTippEingabe;
    f.hole('tippTaste("pruefen")');
    return f.gedreht() ? 'falsch getippt, „Prüfen" gedrückt, und die Karte dreht sich um' : true;
  });

  fall('U6 Ist die Karte schon gedreht, dreht ein zweites Enter sie nicht zurück', () => {
    const w = welt(lernen, Object.assign({ gedreht: true }, EIN_WORT));
    w.tippe(KITAB_NACKT);
    return w.gedreht() ? true : 'die Karte stand auf der Rückseite und dreht nach Enter wieder nach vorn';
  });

  fall('U7 Eingeordnet wird nicht: Lernstand und Runde sind nach dem Umdrehen unverändert — die Stufe wählt er selbst', () => {
    const w = welt(lernen, EIN_WORT);
    const vorher = w.hole('JSON.stringify([PROGRESS, SESSION])');
    w.tippe(KITAB_NACKT);
    if (!w.gedreht()) return 'die Karte ist nicht umgedreht — der Fall misst nichts';
    const nachher = w.hole('JSON.stringify([PROGRESS, SESSION])');
    return nachher === vorher ? true : 'nach dem Umdrehen hat sich etwas geändert: ' + nachher;
  });

  return erg;
}

let rot = 0;
const erg = laufe(LERNEN);
console.log('=== Richtig getippt + Eingabetaste: die Karte dreht sich um ===');
for (const [name, e] of erg){ if (!e.ok) rot++; console.log((e.ok ? '  ok   ' : '  FEHL ') + name + (e.zusatz ? '  -> ' + e.zusatz : '')); }

function ersetze(quelle, alt, neu, wo){
  const n = quelle.split(alt).length - 1;
  if (n !== 1) throw new Error('Störtest „' + wo + '": die Stelle kommt ' + n + '-mal vor (erwartet 1) — Quelltext hat sich geändert');
  return quelle.replace(alt, () => neu);
}
const STOER = [
  { name: 'S1 die Karte wird gar nicht gedreht', muss: ['U1', 'U4', 'U5'],
    q: q => ersetze(q, "  document.getElementById('flashcard').classList.add('flipped');\n", '', 'S1') },
  { name: 'S2 gedreht wird immer, auch bei falscher Antwort', muss: ['U2', 'U3', 'U4'],
    q: q => ersetze(q, '  if (!pruefeTippen()) return false;\n', '  pruefeTippen();\n', 'S2') },
  { name: 'S3 umschalten statt umdrehen (toggle)', muss: ['U6'],
    q: q => ersetze(q, "document.getElementById('flashcard').classList.add('flipped');", "document.getElementById('flashcard').classList.toggle('flipped');", 'S3') },
  { name: 'S4 das Feld behält den Fokus (Tastatur bleibt offen)', muss: ['U1', 'U4'],
    q: q => ersetze(q, " && typeof aktiv.blur === 'function') aktiv.blur();", " && typeof aktiv.blur === 'function') {}", 'S4') },
  { name: 'S5 die Eingabetaste im Wortfeld prüft nur, wie bis v700', muss: ['U1', 'U4'],
    q: q => ersetze(q, "addEventListener('keydown', (e)=>{\n  e.stopPropagation();\n  if (e.key === 'Enter'){ e.preventDefault(); tippPruefenUndUmdrehen(); }",
      "addEventListener('keydown', (e)=>{\n  e.stopPropagation();\n  if (e.key === 'Enter'){ e.preventDefault(); pruefeTippen(); }", 'S5') },
  { name: 'S6 die Eingabetaste im Mehrzahlfeld prüft nur', muss: ['U4'],
    q: q => ersetze(q, "    if (e.key === 'Enter'){ e.preventDefault(); tippPruefenUndUmdrehen(); }", "    if (e.key === 'Enter'){ e.preventDefault(); pruefeTippen(); }", 'S6') },
  { name: 'S7 die Taste „Prüfen" prüft nur', muss: ['U5'],
    q: q => ersetze(q, "  if (wert === 'pruefen'){ tippPruefenUndUmdrehen(); return; }", "  if (wert === 'pruefen'){ pruefeTippen(); return; }", 'S7') },
  { name: 'S8 bei zwei Feldern gilt schon ein richtiges als ganz richtig', muss: ['U4'],
    q: q => ersetze(q, '    return richtig && plRichtig;\n', '    return richtig || plRichtig;\n', 'S8') },
];
console.log('\n=== Störtests: ohne die Regel MUSS der zuständige Fall scheitern ===');
for (const s of STOER){
  let e;
  try { e = laufe(s.q(LERNEN)); }
  catch (err){ rot++; console.log('  FEHL ' + s.name + '  -> ' + err.message); continue; }
  const gescheitert = [...e].filter(([, v]) => !v.ok).map(([n]) => n.split(' ')[0]);
  const fehlt = s.muss.filter(k => !gescheitert.includes(k));
  if (fehlt.length){ rot++; console.log('  FEHL ' + s.name + '  -> ' + fehlt.join(', ') + ' blieb grün (gescheitert: ' + (gescheitert.join(', ') || 'nichts') + ')'); }
  else console.log('  ok   ' + s.name + '  -> scheitert wie verlangt: ' + gescheitert.join(', '));
}
console.log('\n' + (rot ? rot + ' Befund(e).' : 'Alles grün: ' + erg.size + ' Fälle, ' + STOER.length + ' Störtests.'));
process.exit(rot ? 1 : 0);
