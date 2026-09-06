#!/usr/bin/env node
/* pruefe-uebungen.js — misst, ob eine Uebungsaufgabe ihre eigene Antwort verraet.
 *
 * ⛔ WARUM ES DIESE DATEI GIBT (06.09.2026)
 *
 * Elias zu Uebung 10, wo an تِلْكَ die Antwort „تِلْكَ (jene)" zur Wahl stand:
 *   „man kann hier die antwort direkt schon sehen. entweder sind die
 *    antwortmoeglickeiten schlecht gewaehlt oder diese spezifische regel bzw
 *    frageform ist nicht gut umgesetzt und man muesste aendern oder raus
 *    nehmen aber so ist ja keine uebung."
 * Und danach, als der arabische Verrat behoben war:
 *   „wenn die deutsche uebersetzung von einer antwortmoeglichkeit bereits
 *    verraet dann muss das auch geaendert werden" — „guck ob es irgendsowas gibt".
 *
 * Behoben ist es in js/uebung.js. Diese Datei sorgt dafuer, dass es behoben
 * BLEIBT: jede neue Regel und jeder neue Satz kann es lautlos zurueckbringen,
 * und gemerkt haette man es erst beim Ueben.
 *
 * ⭐ Gemessen wird an den DATEN, nicht an der laufenden App. Die Uebungen
 * bauen ihre Aufgaben aus SENTENCE_TAGS und GRAMMAR_RULES; wer die Quelle
 * prueft, braucht weder Browser noch Analyse und findet den Mangel dort, wo
 * er entsteht. [[wirkung_an_der_quelle_stilllegen]]
 */
const fs = require('fs');
const path = require('path');
const W = __dirname;

function lade(datei, namen){
  const src = fs.readFileSync(path.join(W, datei), 'utf8');
  const raum = {};
  const fn = new Function(src + '\nreturn {' + namen.map(n => n + ': typeof ' + n + " !== 'undefined' ? " + n + ' : null').join(', ') + '};');
  return fn.call(raum);
}

const G = lade('grammar-data.js', ['GRAMMAR_RULES', 'SENTENCE_TAGS']);
const B = lade('data/beispielsaetze.js', ['BEISPIELSAETZE']);
const L = lade('lehrbuch-saetze.js', ['LEHRBUCH_SAETZE']);

const REGELN = G.GRAMMAR_RULES || [];
const TAGS   = G.SENTENCE_TAGS || {};
const SAETZE = {};
Object.entries(B.BEISPIELSAETZE || {}).forEach(([id, s]) => SAETZE[id] = s);
(L.LEHRBUCH_SAETZE || []).forEach(s => { if (s && s.id) SAETZE[s.id] = s; });

/* ── Arabisch: traegt der Regelname das markierte Wort? ───────────────── */
const ohneZeichen = s => String(s || '')
  .replace(/[ً-ْٰـ]/g, '')
  .replace(/[.،؟!«»:؛]/g, '').trim();

function wortformen(text){
  const out = [];
  for (const roh of String(text || '').trim().split(/\s+/)){
    const w = ohneZeichen(roh);
    if (!w) continue;
    out.push(w);
    const ohneAl = w.replace(/^(?:و|ف)?(?:ال|أل)/, '');
    if (ohneAl !== w && ohneAl.length >= 2) out.push(ohneAl);
    /* ⛔ Auch ohne Pronomensuffix — عِنْدِي gegen eine Regel, die عِنْدَ
       heisst. Dieselbe Liste wie uebungHervorWorte() in js/uebung.js. */
    for (const suf of ['كما','كم','كن','هما','هم','هن','ها','نا','ي','ك','ه']){
      if (!ohneAl.endsWith(suf)) continue;
      const stamm = ohneAl.slice(0, -suf.length);
      if (stamm.length >= 3) out.push(stamm);
      break;
    }
  }
  return out.filter(w => w.length >= 2);
}
const nameNennt = (regel, worte) => {
  const n = ohneZeichen(regel && regel.name);
  return !!n && worte.some(w => n.includes(w));
};

/* ── Deutsch: steht ein Wort des Regelnamens in der Uebersetzung? ─────── */
const STOPP = new Set(['dies','das','der','die','den','dem','ein','eine','einer',
  'eines','und','oder','nach','mit','ohne','wird','sind','ist','sich','sein',
  'seine','nicht','auch','beim','vom','zum','zur','für','aus','bei','als','wie',
  'vor','steht','stehen','zwei','drei','alle','man','kann','wenn','dann','immer',
  'nur','hier','dort','dieser','diese','dieses']);
const WORT = /[a-zäöüß]+/g;
const deWorte = t => (String(t || '').toLowerCase().match(WORT) || [])
  .filter(w => w.length >= 4 && !STOPP.has(w));

/* ── Die Messung ──────────────────────────────────────────────────────── */
const arVerrat = [], deVerrat = [];
for (const [satzId, tags] of Object.entries(TAGS)){
  const satz = SAETZE[satzId];
  if (!satz) continue;
  const deSatz = new Set(String(satz.sentDe || satz.de || '').toLowerCase().match(WORT) || []);
  for (const t of (tags || [])){
    const regel = REGELN.find(r => r.id === t.ruleId);
    if (!regel || regel.ausgeblendet) continue;

    const worte = wortformen(t.matchText);
    if (worte.length && nameNennt(regel, worte)){
      /* Nur ein Befund, wenn KEINE zweite sichtbare Regel dasselbe Wort
         nennt — sonst hilft das Abgleichen dem Lernenden nicht weiter. */
      const andere = REGELN.filter(r => !r.ausgeblendet && r.id !== regel.id && nameNennt(r, worte));
      if (andere.length < 2)
        arVerrat.push({ satzId, regel: regel.id, wort: t.matchText,
                        andere: andere.length, name: regel.name });
    }

    if (deSatz.size){
      const gemeinsam = deWorte(regel.name).filter(w => deSatz.has(w));
      if (gemeinsam.length)
        deVerrat.push({ satzId, regel: regel.id, gemeinsam,
                        de: String(satz.sentDe || satz.de || '').slice(0, 54) });
    }
  }
}

/* ── ⛔ EICHUNG: kann diese Pruefung ueberhaupt anschlagen? ───────────────
   Ohne sie waere eine leere Befundliste nicht von einem kaputten Werkzeug zu
   unterscheiden. [[leere_liste_ist_keine_messung]] · [[pruefwerkzeug_mit_eingebauter_antwort]] */
const eich = [
  ['arabisch trifft',      nameNennt({ name: 'تِلْكَ (jene)' }, wortformen('تِلْكَ')) === true],
  ['arabisch trifft nicht',nameNennt({ name: 'هَذَا (dies)' },       wortformen('تِلْكَ')) === false],
  ['artikel wird geloest', wortformen('الْفَتَاةُ').includes('فتاة')],
  ['deutsch trifft',       deWorte('ذَلِكَ (jenes)').includes('jenes')],
  ['kein Teilstring',      !deWorte('Ḍamma').some(w => ['ammars','muhammad'].includes(w))],
  ['Stoppwort faellt weg', deWorte('هَذَا (dies)').length === 0]
];
const eichFehler = eich.filter(([, ok]) => !ok);

/* ── Ausgabe ──────────────────────────────────────────────────────────── */
console.log('=== Eichung (kann die Pruefung scheitern?) ===');
eich.forEach(([n, ok]) => console.log('  ' + (ok ? 'ok  ' : '⛔  ') + n));
console.log('');
console.log('=== Gemessen: ' + Object.keys(TAGS).length + ' Saetze, '
  + Object.values(TAGS).reduce((a, v) => a + (v || []).length, 0) + ' Markierungen, '
  + REGELN.filter(r => !r.ausgeblendet).length + ' sichtbare Regeln ===');

function zeige(titel, liste, zeile){
  console.log('');
  console.log('--- ' + titel + ': ' + liste.length + ' ---');
  liste.slice(0, 12).forEach(x => console.log('   ' + zeile(x)));
  if (liste.length > 12) console.log('   … und ' + (liste.length - 12) + ' weitere');
}
zeige('Der Regelname nennt das markierte Wort (Uebung 10 verriete die Antwort)',
  arVerrat, x => x.wort + '  →  ' + x.regel + '   [' + x.satzId + ']  (' + x.andere + ' andere Regeln nennen es auch)');
zeige('Der Regelname steht in der deutschen Uebersetzung',
  deVerrat, x => '„' + x.gemeinsam.join('/') + '" in „' + x.de + '"  →  ' + x.regel);

/* ⛔ UND DIE EIGENTLICHE WACHE: steht die Schranke in js/uebung.js noch da?

   Die Liste oben ist eine BESTANDSAUFNAHME, kein Fehler — die App laesst
   diese Aufgaben bereits weg. Rot wird es erst, wenn jemand die Schranke
   entfernt: dann waeren dieselben Stellen ploetzlich wieder Aufgaben, und
   niemand saehe es. [[wirkung_an_der_quelle_stilllegen]] */
const UEBUNG = fs.readFileSync(path.join(W, 'js', 'uebung.js'), 'utf8');
const wachen = [
  ['deutsche Schranke gebaut',   /function uebungVerraetDeutsch\s*\(/.test(UEBUNG)],
  ['deutsche Schranke gerufen',  /if\s*\(uebungVerraetDeutsch\(a, satz\)\)\s*return;/.test(UEBUNG)],
  ['arabische Schranke gebaut',  /function uebungNameNennt\s*\(/.test(UEBUNG)],
  ['arabische Schranke gerufen', /ablenker\.filter\(nenntWort\)\.length < 2\)\s*return;/.test(UEBUNG)]
];
const wachFehler = wachen.filter(([, ok]) => !ok);
console.log('');
console.log('=== Die Schranke in js/uebung.js ===');
wachen.forEach(([n, ok]) => console.log('  ' + (ok ? 'ok  ' : '⛔  ') + n));

console.log('');
if (wachFehler.length){
  console.log('⛔ Die Schranke in js/uebung.js fehlt oder heisst anders — damit koennen');
  console.log('   die ' + (arVerrat.length + deVerrat.length) + ' Stellen oben wieder zu Aufgaben werden.');
  process.exit(1);
}
if (eichFehler.length){
  console.log('⛔ Die Eichung ist rot — die Zahlen oben sind wertlos.');
  process.exit(2);
}
const summe = arVerrat.length + deVerrat.length;
console.log('✅ Die Schranke steht. ' + summe + ' Stelle(n) werden deshalb NICHT zur Aufgabe');
console.log('   gemacht (' + arVerrat.length + ' arabisch, ' + deVerrat.length + ' deutsch) — das ist der gewollte Zustand,');
console.log('   kein Mangel. Wer eine davon zurueckhaben will, braucht einen zweiten');
console.log('   Regelnamen mit demselben Wort oder einen anderen Beispielsatz.');
