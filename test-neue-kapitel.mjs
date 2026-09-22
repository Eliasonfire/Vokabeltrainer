/* test-neue-kapitel.mjs — Elias' Regel für neu angehakte Kapitel (22.09.2026)
 *
 *   node test-neue-kapitel.mjs
 *
 * Elias: „hatten wir nicht gesagt das wnen ich bis zu drei neue kapitel anhacke
 * das dann sobald du es weißt und es länger als 1h auch so bleibt (also nicht nur
 * testweiße oder zum gucken mal freigeschcaltet und wieder weg gemacht) das du dann
 * das volle programm machst und damit einhergehend beispielsätze und so weiter?"
 *
 * Geprüft wird werkzeuge/neue-kapitel.mjs: die reine Entscheidung (schritt),
 * die Stunde auch für die Wartung (appKapitelHalten), die Kommandozeile mit
 * Exitcodes — und ein Störtest: ohne die Haltezeit MUSS Fall 2 rot werden.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as NK from './werkzeuge/neue-kapitel.mjs';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const WERKZEUG = path.join(HIER, 'werkzeuge', 'neue-kapitel.mjs');
let fehler = 0;
const ok = (bed, was) => { console.log((bed ? '  ok   ' : '  FEHLER ') + was); if (!bed) fehler++; };

const MIN = 60 * 1000;
const T0 = Date.parse('2026-09-22T12:00:00Z');
const bis = n => Array.from({ length: n }, (_, i) => i + 1);
const GRUND = { 'madina-1': bis(12), 'bayna-yadayk-1': [1, 2, 3] };
const ANGABE = { 'madina-1': 12, 'bayna-yadayk-1': 3 };
/* FREIGESCHALTET, wie es die Wartung kennt — hier deckt es die Auswahl ab. */
const FREI = { 'madina-1': bis(12), 'madina-2': bis(24), 'bayna-yadayk-1': [1, 2, 3] };

/* Hilfe: eine Folge von Blicken; jeder Blick ist { t, auswahl, stempel }. */
function lauf(schritt, blicke, start = null, angabe = ANGABE, hatDaten = () => true, frei = FREI){
  let z = start, r = null;
  const ergebnisse = [];
  for (const b of blicke){
    r = schritt(z, { auswahl: b.auswahl, stempel: b.stempel ?? null, jetzt: b.t, angabe, frei, hatDaten });
    z = r.zustand;
    ergebnisse.push(r);
  }
  return { z, r, ergebnisse };
}
const grundstand = (schritt) => schritt(null, { auswahl: GRUND, stempel: T0 - 600 * MIN, jetzt: T0, angabe: ANGABE, frei: FREI }).zustand;
const mit = (buch, ks) => ({ ...GRUND, [buch]: [...GRUND[buch], ...ks] });

console.log('1. Erster Lauf');
{
  const r = NK.schritt(null, { auswahl: GRUND, stempel: T0 - MIN, jetzt: T0, angabe: ANGABE, frei: FREI });
  ok(!r.auftrag && r.zustand.grundstand === T0 && r.kurz === 'keine neuen Kapitel',
     'alles Angehakte liegt im Fenster der Wartung → nichts zu tun');
  ok(!Object.keys(r.zustand.bekannt).length, 'der erste Lauf verbucht NICHTS als erledigt (kein Grundstand, der Lücken zudeckt)');
}

/* Fall 2 ist der Kern — der Störtest unten spielt ihn gegen eine Fassung ohne Haltezeit. */
function fall2(schritt){
  const a = mit('madina-1', [13]);
  const { ergebnisse } = lauf(schritt, [
    { t: T0 + 30 * MIN, auswahl: a, stempel: T0 + 5 * MIN },   // 25 min angehakt
    { t: T0 + 64 * MIN, auswahl: a, stempel: T0 + 5 * MIN },   // 59 min
    { t: T0 + 66 * MIN, auswahl: a, stempel: T0 + 5 * MIN }    // 61 min
  ], grundstand(schritt));
  return ergebnisse;
}
console.log('2. Ein neues Kapitel, eine Stunde gehalten');
{
  const e = fall2(NK.schritt);
  ok(!e[0].auftrag && /noch \d+ min/.test(e[0].zeilen.join('\n')), 'nach 25 min: wartet, sagt wie lange noch');
  ok(!e[1].auftrag, 'nach 59 min: noch kein Auftrag („länger als 1h")');
  ok(e[2].auftrag && JSON.stringify(e[2].auftrag.kapitel) === '{"madina-1":[13]}', 'nach 61 min: Auftrag für genau madina-1 Kapitel 13');
  ok(e[2].zustand.auftrag.angehaktSeit['madina-1'][13] === T0 + 5 * MIN, 'die Zeit des Anhakens kommt aus dem Stempel des Abgleichs');
}

console.log('3. Zum Anschauen angehakt und wieder weg');
{
  const a = mit('madina-1', [13]);
  const { ergebnisse } = lauf(NK.schritt, [
    { t: T0 + 10 * MIN, auswahl: a, stempel: T0 + 5 * MIN },
    { t: T0 + 40 * MIN, auswahl: GRUND, stempel: T0 + 35 * MIN },       // wieder abgewählt
    { t: T0 + 70 * MIN, auswahl: a, stempel: T0 + 65 * MIN },           // erneut angehakt
    { t: T0 + 100 * MIN, auswahl: a, stempel: T0 + 65 * MIN }
  ], grundstand(NK.schritt));
  ok(/wieder abgewaehlt/.test(ergebnisse[1].zeilen.join('\n')), 'Abwählen wird bemerkt');
  ok(!ergebnisse.some(r => r.auftrag), 'kein Auftrag: die Stunde beginnt nach dem Abwählen von vorn');
  ok(ergebnisse[3].zustand.beobachtet['madina-1'][13] === T0 + 65 * MIN, 'neue Haltezeit ab dem erneuten Anhaken');
}

console.log('4. Mehr als drei auf einmal');
{
  const a = mit('madina-1', [13, 14, 15, 16]);
  const { r } = lauf(NK.schritt, [{ t: T0 + 200 * MIN, auswahl: a, stempel: T0 }], grundstand(NK.schritt));
  ok(!r.auftrag && /mehr als 3/.test(r.zeilen.join('\n')), 'vier neue Kapitel → kein volles Programm, mit Begründung');
  const b = mit('madina-1', [13, 14, 15]);
  const { r: r3 } = lauf(NK.schritt, [{ t: T0 + 200 * MIN, auswahl: b, stempel: T0 }], grundstand(NK.schritt));
  ok(r3.auftrag && r3.auftrag.kapitel['madina-1'].length === 3, 'drei neue Kapitel → Auftrag („bis zu drei")');
}

console.log('5. Was neu ist und was nicht');
{
  /* Der Fall vom 22.09.2026: Angabe 3, Auswahl [1,2,3], js/kern.js aber [1,2]. */
  const frei = { ...FREI, 'bayna-yadayk-1': [1, 2] };
  const { r } = lauf(NK.schritt, [{ t: T0 + 200 * MIN, auswahl: GRUND, stempel: T0 }], null, ANGABE, () => true, frei);
  ok(r.auftrag && JSON.stringify(r.auftrag.kapitel) === '{"bayna-yadayk-1":[3]}',
     'Kapitel in der Angabe, aber nicht freigeschaltet → neu (die Wartung hat es nie gemessen)');
  const m2 = lauf(NK.schritt, [{ t: T0 + 200 * MIN, auswahl: { ...GRUND, 'madina-2': [1] }, stempel: T0 }], grundstand(NK.schritt));
  ok(m2.r.auftrag && JSON.stringify(m2.r.auftrag.kapitel) === '{"madina-2":[1]}',
     'freigeschaltet, aber ohne Angabe (nicht im Fenster) → neu, wenn er es anhakt');
  const { r: rd } = lauf(NK.schritt, [{ t: T0 + 200 * MIN, auswahl: { ...GRUND, 'madina-9': [1] }, stempel: T0 }],
    grundstand(NK.schritt), ANGABE, b => b !== 'madina-9');
  ok(!rd.auftrag && /keine Vokabeldatei/.test(rd.zeilen.join('\n')), 'Buch ohne Vokabeldatei → übersprungen, gesagt');
}

console.log('6. Der PC war aus: schon lange angehakt');
{
  const a = mit('bayna-yadayk-1', [4]);
  const { r } = lauf(NK.schritt, [{ t: T0 + 600 * MIN, auswahl: a, stempel: T0 + 60 * MIN }], grundstand(NK.schritt));
  ok(r.auftrag && r.auftrag.kapitel['bayna-yadayk-1'][0] === 4, 'Stempel neun Stunden alt → sofort fällig, kein Warten auf eine zweite Stunde');
}

console.log('7. Ein Buch wartet auf sein jüngstes Kapitel; ein zweites Buch geht allein');
{
  const a1 = mit('madina-1', [13]);
  const a2 = { ...mit('madina-1', [13, 14]), 'bayna-yadayk-1': [1, 2, 3, 4] };
  const { ergebnisse } = lauf(NK.schritt, [
    { t: T0 + 10 * MIN, auswahl: a1, stempel: T0 + 5 * MIN },
    { t: T0 + 60 * MIN, auswahl: a2, stempel: T0 + 55 * MIN },    // 14 und bayna 4 kommen dazu
    { t: T0 + 70 * MIN, auswahl: a2, stempel: T0 + 55 * MIN },    // 13 ist 65 min alt, 14 erst 15
    { t: T0 + 120 * MIN, auswahl: a2, stempel: T0 + 55 * MIN }    // alle über eine Stunde
  ], grundstand(NK.schritt));
  ok(!ergebnisse[2].auftrag, 'madina-1 13 ist fällig, 14 noch nicht → das Buch wartet (kein zweiter Lauf kurz danach)');
  const r = ergebnisse[3];
  ok(r.auftrag && JSON.stringify(r.auftrag.kapitel) === '{"madina-1":[13,14],"bayna-yadayk-1":[4]}', 'dann beide Bücher in EINEM Auftrag');
}

console.log('8. Offener Auftrag: kein zweiter, EIN neuer Versuch, dann sichtbar aufgeben');
{
  const a = mit('madina-1', [13]);
  const erst = lauf(NK.schritt, [{ t: T0 + 200 * MIN, auswahl: a, stempel: T0 }], grundstand(NK.schritt));
  ok(erst.r.auftrag, 'Auftrag erteilt');
  const b = mit('madina-1', [13, 14]);
  const { ergebnisse } = lauf(NK.schritt, [
    { t: T0 + 260 * MIN, auswahl: b, stempel: T0 + 100 * MIN },     // 1 h später, 14 ist fällig
    { t: T0 + 200 * MIN + 4 * 60 * MIN + MIN, auswahl: b, stempel: T0 + 100 * MIN },
    { t: T0 + 200 * MIN + 9 * 60 * MIN, auswahl: b, stempel: T0 + 100 * MIN }
  ], erst.z);
  ok(!ergebnisse[0].auftrag && /laeuft oder wartet/.test(ergebnisse[0].zeilen.join('\n')), 'solange der Auftrag offen ist: nichts Neues');
  ok(ergebnisse[1].auftrag && ergebnisse[1].auftrag.versuche === 2, 'nach vier Stunden ohne Abschluss: Versuch 2');
  const r = ergebnisse[2];
  ok(/aufgegeben/.test(r.zeilen.join('\n')) && r.zustand.bekannt['madina-1'].includes(13), 'nach Versuch 2: aufgegeben, Kapitel gilt als bekannt');
  ok(r.auftrag && JSON.stringify(r.auftrag.kapitel) === '{"madina-1":[14]}', 'und das inzwischen fällige Kapitel 14 bekommt seinen eigenen Auftrag');
}

console.log('9. Die Stunde gilt auch für die Wartung (vorrat.mjs --app)');
{
  const jetzt = T0 + 300 * MIN;
  const alt = { 'madina-1': bis(12) };
  const vonApp = { 'madina-1': bis(13) };
  const frisch = NK.appKapitelHalten(vonApp, { alt, angabe: ANGABE, stempel: jetzt - 10 * MIN, jetzt, zustand: {} });
  ok(!frisch.behalten['madina-1'].includes(13) && frisch.gehalten.length === 1, 'vor zehn Minuten angehakt → Kapitel 13 wird NICHT übernommen');
  ok(frisch.behalten['madina-1'].length === 12, 'das schon Freigeschaltete bleibt');
  const alt2 = NK.appKapitelHalten(vonApp, { alt, angabe: ANGABE, stempel: jetzt - 90 * MIN, jetzt, zustand: {} });
  ok(alt2.behalten['madina-1'].includes(13), 'Stand seit 90 min unverändert → übernommen');
  const beob = NK.appKapitelHalten(vonApp, { alt, angabe: ANGABE, stempel: jetzt - 10 * MIN, jetzt,
    zustand: { beobachtet: { 'madina-1': { 13: jetzt - 80 * MIN } } } });
  ok(beob.behalten['madina-1'].includes(13), 'die stündliche Prüfung sieht es seit 80 min → übernommen, auch wenn sich danach etwas anderes änderte');
}

console.log('10. Kommandozeile');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'neue-kapitel-'));
try {
  const zustand = path.join(tmp, 'zustand.json');
  const kv = path.join(tmp, 'kv.json');
  const kern = path.join(tmp, 'kern.js');
  const lern = path.join(tmp, 'lernstand.json');
  fs.writeFileSync(kern, "const FREIGESCHALTET = {\n  'madina-1': [" + bis(12).join(',') + "],   // Kommentar\n};\n");
  fs.writeFileSync(lern, JSON.stringify({ angabe: { 'madina-1': 12 } }));
  const schreibKv = (auswahl, stempel) => fs.writeFileSync(kv, JSON.stringify({
    stempel: { vt_settings: stempel }, daten: { vt_settings: JSON.stringify({ buecher: auswahl }) } }));
  const marke = path.join(tmp, 'arbeit.json');
  const tor = (t, k = kern) => {
    try { return { code: 0, out: execFileSync(process.execPath, [WERKZEUG, '--tor', '--kv', kv, '--zustand', zustand, '--jetzt', String(t), '--kern', k, '--lernstand', lern, '--marke', marke], { encoding: 'utf8' }) }; }
    catch (e){ return { code: e.status, out: String(e.stdout || '') }; }
  };
  const cli = (...a) => {
    try { return { code: 0, out: execFileSync(process.execPath, [WERKZEUG, ...a, '--zustand', zustand], { encoding: 'utf8' }) }; }
    catch (e){ return { code: e.status, out: String(e.stdout || '') }; }
  };
  schreibKv({ 'madina-1': [5, 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12] }, T0);
  const g = tor(T0);
  ok(g.code === 3 && /keine neuen Kapitel/.test(g.out), 'erster Lauf, unsortierte Auswahl im Fenster: Exit 3, keine neuen Kapitel');
  const leerKern = path.join(tmp, 'leer.js');
  fs.writeFileSync(leerKern, '// kein Block\n');
  ok(tor(T0, leerKern).code === 1, 'js/kern.js ohne FREIGESCHALTET: Exit 1 — nicht „alles ist neu"');
  schreibKv({ 'madina-1': bis(13) }, T0 + 5 * MIN);
  const w = tor(T0 + 20 * MIN);
  ok(w.code === 3, 'neues Kapitel, noch keine Stunde: Exit 3');
  const letzte = w.out.trim().split('\n').pop();
  ok(/^[\x20-\x7e]+$/.test(letzte), 'die letzte Zeile (für routines.log) ist reines ASCII: ' + letzte);
  ok(cli('--auftrag').code === 3, '--auftrag ohne Auftrag: Exit 3');
  fs.writeFileSync(marke, JSON.stringify({ was: 'Wartungslauf', begonnen: new Date(T0 + 60 * MIN).toISOString() }));
  const s = tor(T0 + 70 * MIN);
  ok(s.code === 3 && /andere Arbeit laeuft/.test(s.out), 'fällig, aber die Wartung arbeitet (Arbeitsmarke): Exit 3, kein Auftrag');
  fs.writeFileSync(marke, JSON.stringify({ was: 'Wartungslauf', begonnen: new Date(T0 - 5 * 60 * MIN).toISOString() }));
  const f = tor(T0 + 70 * MIN);
  ok(f.code === 0 && /AUFTRAG: madina-1 Kapitel 13/.test(f.out), 'nach der Stunde: Exit 0, Auftrag');
  const a = cli('--auftrag');
  ok(a.code === 0 && a.out.includes('--nur-kapitel madina-1:13'), '--auftrag nennt den Befehl für genau dieses Kapitel');
  const e = cli('--erledigt', '--notiz', 'Test');
  ok(e.code === 0, '--erledigt: Exit 0');
  const z = JSON.parse(fs.readFileSync(zustand, 'utf8'));
  ok(!z.auftrag && z.bekannt['madina-1'].includes(13) && z.verlauf.length === 1, 'danach: kein Auftrag, Kapitel bekannt, im Verlauf');
  ok(tor(T0 + 130 * MIN).code === 3, 'derselbe Stand danach: nichts mehr zu tun');
  fs.writeFileSync(kv, 'kein json');
  ok(tor(T0 + 190 * MIN).code === 1, 'unlesbarer Abgleich: Exit 1 (kein Lauf, aber kein Normalfall)');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log('11. Störtest: ohne Haltezeit muss Fall 2 rot werden');
{
  const quelle = fs.readFileSync(WERKZEUG, 'utf8');
  const anker = 'if (alter > HALTEZEIT_MS) faellig[b] = ks;';
  const anzahl = quelle.split(anker).length - 1;
  ok(anzahl === 1, 'Anker für den Störtest genau einmal im Werkzeug');
  const kaputt = quelle.replace(anker, 'if (true) faellig[b] = ks;')
    .replace("from './kv-abruf.mjs'", "from '" + pathToFileURL(path.join(HIER, 'werkzeuge', 'kv-abruf.mjs')).href + "'");
  const tmpDatei = path.join(os.tmpdir(), 'neue-kapitel-stoer-' + process.pid + '.mjs');
  fs.writeFileSync(tmpDatei, kaputt);
  try {
    const K = await import(pathToFileURL(tmpDatei).href);
    const e = fall2(K.schritt);
    ok(!!e[0].auftrag, 'die Fassung ohne Haltezeit erteilt schon nach 25 min einen Auftrag — Fall 2 hätte das bemerkt');
  } finally {
    fs.rmSync(tmpDatei, { force: true });
  }
}

console.log('');
console.log(fehler ? `⛔ ${fehler} Fehler` : '✅ alle Prüfungen bestanden');
process.exit(fehler ? 1 : 0);
