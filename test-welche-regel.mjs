/* test-welche-regel.mjs — bewacht Elias' Satz vom 19.09.2026, 03:10:57, zu
 * „9. Welche Regel?" (Bildschirmfoto: هَذَا الْكِتَابُ خَفِيفٌ, hervorgehoben
 * الْكِتَابُ, zur Wahl vier Einträge aus dem Thema „Schrift"):
 *
 *   „helle und dunkle aussprache von allah ist hier komplett irrelevant. das
 *    hat hier nichts zu suchen. und schekel in diesem zusammenhang verstehe ich
 *    auch nicht. generell alle antowrtoptionen sind eigentlich keine regeln.
 *    was haben die hier zu suchen. mache das weg und alle die dem ähnlich oder
 *    gleich sind"
 *
 * → In „Welche Regel?" kommt nichts aus dem Thema „Schrift" mehr vor, und
 *   nichts, was schon im Namen sagt, dass es keine Regel ist (Namenserklärung,
 *   Merkhilfe, Überblick) — weder als richtige noch als falsche Antwort.
 * → Die Regeln selbst bleiben in der App.
 * → Was bewusst drin bleibt (Sonnen-/Mondbuchstaben, مِنَ vor اَلْ), wird auch
 *   wirklich noch gefragt — sonst wäre ein zu weit gefasstes Muster grün.
 *
 * Gebaut wird mit der ECHTEN Übung aus js/uebung.js an den echten Sätzen
 * (vocab-data.js, lehrbuch-saetze.js, data/beispielsaetze.js) und der echten
 * Analyse (js/irab.js). Die falschen Antworten sind zufällig gemischt; deshalb
 * wird jede Aufgabe 30-mal gebaut.
 *
 *   node test-welche-regel.mjs              prüfen
 *   node test-welche-regel.mjs --stoertest  beweisen, dass er rot werden kann
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const WURZEL = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const STOERTEST = process.argv.includes('--stoertest');
const LAEUFE = 30;

/* ⛔ CRLF → LF beim Lesen: Git legt die Dateien beim Auschecken mit CRLF ab
   (core.autocrlf=true, im Repo LF), und schneideListe() sucht das Ende an `;\n`.
   Im CRLF-Nachbau vom 24.09.2026 fehlten so die Bausteine der Übung.
   [[zeilenende_r_bricht_muster]] */
const UEBUNG = fs.readFileSync(path.join(WURZEL, 'js', 'uebung.js'), 'utf8').replace(/\r\n/g, '\n');
const KERN = fs.readFileSync(path.join(WURZEL, 'js', 'kern.js'), 'utf8').replace(/\r\n/g, '\n');
const irab = require('./js/irab.js');
const lade = (datei, name) =>
  (new Function(fs.readFileSync(path.join(WURZEL, datei), 'utf8') + ';return ' + name + ';'))();
const VOCAB_DATA = lade('vocab-data.js', 'VOCAB_DATA');
const LEHRBUCH_SAETZE = lade('lehrbuch-saetze.js', 'LEHRBUCH_SAETZE');
let BEISPIELSAETZE = {};
try { BEISPIELSAETZE = lade('data/beispielsaetze.js', 'BEISPIELSAETZE'); } catch (e) { /* optional */ }
const G = new Function(fs.readFileSync(path.join(WURZEL, 'grammar-data.js'), 'utf8') +
  ';return {GRAMMAR_RULES, SATZ_THEMEN, SENTENCE_TAGS};')();

irab.setzeLexikon(VOCAB_DATA);
const SAETZE = [
  ...VOCAB_DATA.filter(w => w.sentAr),
  ...LEHRBUCH_SAETZE,
  ...Object.keys(BEISPIELSAETZE)
    .filter(id => id.startsWith('satz-lang-') && BEISPIELSAETZE[id] && BEISPIELSAETZE[id].sentAr)
    .map(id => ({ id, sentAr: BEISPIELSAETZE[id].sentAr, sentDe: BEISPIELSAETZE[id].sentDe || '' }))
];
const ANALYSEN = SAETZE.map(s => ({ s, z: irab.analysiereSatz(s.sentAr) }));

/* Die vier aus dem Bildschirmfoto, und die fünfte sichtbare aus demselben Thema. */
const AUS_DEM_FOTO = ['lafz-al-jalala-01', 'schakl-01', 'iltiqa-sakinain-01', 'hamzatul-wasl-01'];
const SCHRIFT_SICHTBAR = [...AUS_DEM_FOTO, 'madd-tabii-01'];
/* Bewusst drin (meine Lesart von „ähnlich", ihm so gesagt). */
const BLEIBT = ['schams-qamar-01', 'mina-al-01'];
/* Ein Name, der schon sagt, dass es keine Regel ist. */
const NAME_KEINE_REGEL = /Überblick|Merkhilfe|so heißen|so heissen/;

function schneideFunktion(text, name){
  const anfang = text.indexOf('function ' + name + '(');
  if (anfang < 0) return null;
  let i = text.indexOf('{', anfang), tiefe = 0;
  for (; i < text.length; i++){
    if (text[i] === '{') tiefe++;
    else if (text[i] === '}'){ tiefe--; if (!tiefe) return text.slice(anfang, i + 1); }
  }
  return null;
}
function schneideZeile(text, kopf){
  const a = text.indexOf(kopf);
  if (a < 0) return null;
  return text.slice(a, text.indexOf(';\n', a) + 1);
}
function schneideListe(text, kopf){
  const a = text.indexOf(kopf);
  if (a < 0) return null;
  const e = text.indexOf('\n];', a);
  return e < 0 ? null : text.slice(a, e + 3);
}

function laufe(quelle, still){
  let ok = 0, schlecht = 0;
  const pruefe = (was, bedingung, gemessen) => {
    if (bedingung){ ok++; if (!still) console.log('  ✔ ' + was); }
    else { schlecht++; if (!still) console.log('  ✘ ' + was + '   gemessen: ' + gemessen); }
  };
  const log = s => { if (!still) console.log(s); };

  /* ---------- 1. Sein Satz steht an der Stelle, die ihn umsetzt ---------- */
  log('\n1. Elias\' Satz steht bei der Funktion, die ihn umsetzt');
  pruefe('js/uebung.js zitiert ihn im Wortlaut',
    quelle.includes('„helle und dunkle aussprache von allah ist hier komplett irrelevant. das hat hier nichts zu suchen. und schekel in diesem zusammenhang verstehe ich auch nicht. generell alle antowrtoptionen sind eigentlich keine regeln. was haben die hier zu suchen. mache das weg und alle die dem ähnlich oder gleich sind"'),
    'Zitat fehlt oder ist verändert');

  const teile = [
    schneideZeile(quelle, 'const uebungOhneZeichen ='),
    schneideZeile(quelle, 'const uebungNamensstamm ='),
    schneideZeile(quelle, 'const UEBUNG_KEINE_REGEL ='),
    schneideFunktion(quelle, 'uebungKeineRegel'),
    schneideFunktion(quelle, 'uebungHervorWorte'),
    schneideFunktion(quelle, 'uebungNameNennt'),
    schneideFunktion(quelle, 'uebungAblenker'),
    schneideFunktion(quelle, 'uebungSammel'),
    schneideZeile(quelle, 'const UEBUNG_WARUM_UNSICHTBAR ='),
    schneideFunktion(quelle, 'uebungUnsichtbarerFall'),
    schneideFunktion(KERN, 'shuffle'),
    schneideListe(quelle, 'const UEBUNGEN = [')
  ];
  pruefe('alle Bausteine der Übung sind in js/uebung.js zu finden', teile.every(Boolean),
    teile.map((t, i) => t ? null : i).filter(i => i !== null).join(','));
  if (!teile.every(Boolean)) return schlecht;

  const c = { console, ...G, regelAusgeblendet: r => !r || !!r.ausgeblendet };
  vm.createContext(c);
  try {
    vm.runInContext(teile.join('\n') + '\n;globalThis.__U = UEBUNGEN; globalThis.__K = uebungKeineRegel;', c);
  } catch (e){
    pruefe('die Übung lässt sich laden', false, e.message);
    return schlecht;
  }
  const modus = c.__U.find(m => m.id === 'regel');
  pruefe('die Übung „Welche Regel?" gibt es', !!modus, '—');
  if (!modus) return schlecht;

  const regel = id => G.GRAMMAR_RULES.find(r => r.id === id);
  const schrift = G.SATZ_THEMEN.find(t => t.id === 'schrift');
  const istSchrift = id => !!(schrift && schrift.muster && schrift.muster.test(id));
  const keineRegelDemNamenNach = G.GRAMMAR_RULES.filter(r => NAME_KEINE_REGEL.test(String(r.name || '')));
  const verboten = id => istSchrift(id) || keineRegelDemNamenNach.some(r => r.id === id);

  /* ---------- 2. Die Voraussetzungen, auf denen der Filter steht ---------- */
  log('\n2. Worauf der Filter steht');
  pruefe('das Thema „Schrift" gibt es in SATZ_THEMEN', !!(schrift && schrift.muster), 'fehlt');
  pruefe('sein Muster fasst alle vier aus dem Bildschirmfoto und die Verlängerung',
    SCHRIFT_SICHTBAR.every(istSchrift), SCHRIFT_SICHTBAR.filter(id => !istSchrift(id)).join(', '));
  pruefe('die Regeln selbst stehen weiter in grammar-data.js (nur die Übung lässt sie weg)',
    SCHRIFT_SICHTBAR.every(id => !!regel(id)), SCHRIFT_SICHTBAR.filter(id => !regel(id)).join(', '));
  pruefe('und sie sind nicht nebenbei ausgeblendet worden (die Markierung bleibt im Satz-Modus)',
    SCHRIFT_SICHTBAR.every(id => regel(id) && !regel(id).ausgeblendet),
    SCHRIFT_SICHTBAR.filter(id => regel(id) && regel(id).ausgeblendet).join(', '));
  pruefe('es gibt Einträge, die schon im Namen sagen, dass sie keine Regel sind (sonst prüft 3 hier nichts)',
    keineRegelDemNamenNach.length >= 3, keineRegelDemNamenNach.map(r => r.id).join(', '));
  const fehlt = keineRegelDemNamenNach.filter(r => !c.__K(r));
  pruefe('jeder davon fällt in uebungKeineRegel() — auch ein neuer mit so einem Namen',
    fehlt.length === 0, fehlt.map(r => r.id + ' „' + r.name + '"').join(' · '));

  /* ---------- 3. Die Übung, 30-mal gebaut ---------- */
  log('\n3. „Welche Regel?" an allen ' + SAETZE.length + ' Sätzen, ' + LAEUFE + '-mal gebaut');
  let aufgaben = 0, alsAntwort = [], alsAblenker = [], gefragt = new Set(), fotoSatz = [];
  for (let l = 0; l < LAEUFE; l++){
    for (const { s, z } of ANALYSEN){
      let liste = [];
      try { liste = modus.baue(z, s) || []; } catch (e){ liste = []; }
      for (const a of liste){
        if (l === 0){ aufgaben++; gefragt.add(a.loesung); }
        if (verboten(a.loesung)) alsAntwort.push(a.loesung);
        for (const o of a.optionen) if (o.wert !== a.loesung && verboten(o.wert)) alsAblenker.push(o.wert);
        if (l === 0 && /الْكِتَابُ خَفِيفٌ/.test(s.sentAr)) fotoSatz.push(a);
      }
    }
  }
  log('     gemessen: ' + aufgaben + ' Aufgaben je Aufbau, ' + gefragt.size + ' verschiedene Regeln als richtige Antwort');
  pruefe('es gibt Aufgaben (sonst wäre alles unten grün, weil leer)', aufgaben >= 200, aufgaben);
  pruefe('keine richtige Antwort aus „Schrift" oder mit einem Namen, der keine Regel ist',
    alsAntwort.length === 0, alsAntwort.length + '× z. B. ' + [...new Set(alsAntwort)].slice(0, 4).join(', '));
  pruefe('auch keine FALSCHE Antwort daraus (' + LAEUFE + ' Aufbauten, jede Mischung)',
    alsAblenker.length === 0, alsAblenker.length + '× z. B. ' + [...new Set(alsAblenker)].slice(0, 4).join(', '));
  pruefe('der Satz vom Bildschirmfoto steht im Bestand', SAETZE.some(s => /الْكِتَابُ خَفِيفٌ/.test(s.sentAr)), 'fehlt');
  pruefe('an ihm steht keine der vier Antworten mehr zur Wahl',
    fotoSatz.every(a => !a.optionen.some(o => AUS_DEM_FOTO.includes(o.wert))),
    fotoSatz.map(a => a.optionen.map(o => o.text).join(' · ')).join(' | '));

  /* ---------- 4. Was bewusst drin bleibt, wird auch gefragt ---------- */
  log('\n4. Was bewusst drin bleibt, kommt auch wirklich noch dran');
  for (const id of BLEIBT)
    pruefe('„' + (regel(id) || {}).name + '" ist noch richtige Antwort einer Aufgabe', gefragt.has(id), 'nie gefragt');

  return schlecht;
}

const ohneFunktion = q => q.replace(/function uebungKeineRegel\(r\)\{/, 'function uebungKeineRegel(r){ return false;');
const ohneFrage = q => q.replace('&& !uebungKeineRegel(x.rule) ', '');
const ohneAblenker = q => q.replace('&& !uebungKeineRegel(r) ', '');
const ohneListe = q => q.replace(/const UEBUNG_KEINE_REGEL = \[[^\]]*\];/, 'const UEBUNG_KEINE_REGEL = [];');

if (STOERTEST){
  console.log('Störtest: jede Gegenprobe muss rot werden.\n');
  let alleRot = true;
  for (const [was, veraendert] of [
    ['uebungKeineRegel() lässt alles durch', ohneFunktion(UEBUNG)],
    ['nur die FRAGE prüft nicht mehr', ohneFrage(UEBUNG)],
    ['nur die FALSCHEN Antworten prüfen nicht mehr', ohneAblenker(UEBUNG)],
    ['die Liste der Namen ist leer', ohneListe(UEBUNG)],
    ['sein Zitat ist „verbessert"', UEBUNG.replace('antowrtoptionen', 'antwortoptionen')]
  ]){
    const geaendert = veraendert !== UEBUNG;
    const rot = geaendert && laufe(veraendert, true) > 0;
    if (!rot) alleRot = false;
    console.log((rot ? '  ✔ rot: ' : '  ✘ GRÜN: ') + was + (geaendert ? '' : '  (Ersetzung griff nicht)'));
  }
  const echt = laufe(UEBUNG, true);
  console.log('\n  und die echte Datei: ' + (echt === 0 ? 'grün ✔' : echt + ' Befund(e) ✘'));
  process.exit(alleRot && echt === 0 ? 0 : 1);
}

const schlecht = laufe(UEBUNG, false);
console.log('\n' + (schlecht ? '✘ ' + schlecht + ' Prüfung(en) rot' : '✔ alle grün'));
process.exit(schlecht ? 1 : 0);
