#!/usr/bin/env node
/* pruefe-koran-vorlagen.mjs — hält die Vorlagen der Gruppe „Koran häufigste" gegen das, was ausgeliefert ist.
 *
 * Die Eselsbrücken und Beispielsätze der Gruppe sind nicht getippt. Sie entstehen aus zwei Vorlagen mit Verweisen
 * (werkzeuge/koran-vorlagen/eselsbruecken.json und saetze.json): „Wort 1 bis 4 von Vers 112:1", „die Form der Karte
 * 45968", „Wort 3 des Satzes mb1-42-3". Aufgelöst werden sie von koran-eb-aufloesen.mjs und koran-satz-aufloesen.mjs.
 * Bis zum 13.10.2026 lagen Vorlagen und Werkzeuge nur in einem lokalen Zwischenordner — das Ergebnis stand im Repo,
 * sein Bauplan nicht.
 *
 * Geprüft wird:
 *   1. Die Vorlagen enthalten KEIN arabisches Zeichen. Das ist die Schranke, die sie ins Repo lässt: ein aufgelöstes
 *      Wort seiner Buchkarten (arabicroots, AGB) darf dort nie stehen — nur der Verweis mit der Kennung.
 *   2. Beide Vorlagen lösen sich heute ohne Fehler auf.
 *   3. Jede Eselsbrücke der Vorlage steht wortgleich in data/eselsbruecken.js (erste Stelle) und
 *      data/eselsbruecken-alt.js (die zwei anderen).
 *   4. Der Abschnitt der Gruppe in data/beispielsaetze.js ist zeichengleich mit dem, was Vorlage und Kopf ergeben
 *      (koran-satz-einbauen.mjs --gleich).
 *   5. Jede Markierung der Vorlage steht in SENTENCE_TAGS (grammar-data.js).
 * 2 bis 5 brauchen seinen Bestand (data/vokabeln-*.js, lokal). Fehlt er, läuft nur Punkt 1 — und das wird gesagt.
 *
 * Wird 3, 4 oder 5 rot, hat jemand das Ergebnis geändert und die Vorlage nicht (oder umgekehrt). Die Vorlage ist die
 * Quelle: dort ändern, auflösen, einspielen.
 *
 *   node werkzeuge/pruefe-koran-vorlagen.mjs     Exit 0 = alles gleich, die Störtests schlagen an · Exit 1 = Befund
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { REPO, ARBEIT, VORLAGEN, lade } from './koran-stellen-lib.mjs';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const PRUEF = path.join(ARBEIT, 'pruefung');
const N = s => String(s == null ? '' : s).normalize('NFC');
let rot = 0;
const sag = (ok, text) => { console.log((ok ? '  ok   ' : '  ⛔   ') + text); if (!ok) rot = 1; return ok; };
console.log('--- Vorlagen der Gruppe „Koran häufigste" ---');

/* ---------- 1. kein arabisches Zeichen in den Vorlagen ---------- */
/* Arabisch, Arabisch-Ergänzung, Arabisch-Erweitert-A und die zwei Blöcke der Darstellungsformen. */
const ARABISCH = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/g;
const arabischeZeichen = text => (String(text).match(ARABISCH) || []).length;
const DATEIEN = ['eselsbruecken.json', 'saetze.json', 'saetze-kopf.txt'];
const texte = {};
for (const d of DATEIEN){
  const p = path.join(VORLAGEN, d);
  if (!sag(fs.existsSync(p), 'werkzeuge/koran-vorlagen/' + d + ' ist da')) continue;
  texte[d] = fs.readFileSync(p, 'utf8');
  sag(arabischeZeichen(texte[d]) === 0, d + ': kein arabisches Zeichen (' + texte[d].length + ' Zeichen gelesen)');
}
let ebVorlage = {}, satzVorlage = {};
try { ebVorlage = JSON.parse(texte['eselsbruecken.json'] || '{}'); satzVorlage = JSON.parse(texte['saetze.json'] || '{}'); }
catch (e){ sag(false, 'eine Vorlage ist kein lesbares JSON: ' + e.message); }
const ebIds = Object.keys(ebVorlage).filter(k => k !== '_'), satzIds = Object.keys(satzVorlage).filter(k => k !== '_');
sag(ebIds.length >= 30 && satzIds.length >= 30, 'die Vorlagen führen ' + ebIds.length + ' Karten mit Eselsbrücken und ' + satzIds.length + ' mit Satz oder Grund (je mindestens 30)');
sag(ebIds.every(id => satzVorlage[id]) && satzIds.every(id => ebVorlage[id]), 'beide Vorlagen führen dieselben Karten');

/* ---------- die drei Vergleiche als Funktionen (die Störtests rufen sie mit verdorbener Eingabe) ---------- */
function vergleicheEselsbruecken(soll, erste, andere){
  const f = [];
  for (const [id, e] of Object.entries(soll)){
    if (N(erste[id]) !== N(e.mnemo)) f.push(id + ': die erste Eselsbrücke in data/eselsbruecken.js ist nicht die der Vorlage');
    const a = (andere[id] || []).map(x => N(typeof x === 'string' ? x : (x && (x.text || x.mnemo)) || ''));
    const s = (e.alt || []).map(N);
    if (a.length !== s.length || s.some((t, i) => t !== a[i])) f.push(id + ': die weiteren Eselsbrücken in data/eselsbruecken-alt.js sind nicht die der Vorlage (' + a.length + ' gegen ' + s.length + ')');
  }
  return f;
}
function vergleicheMarken(marken, tags){
  const f = [];
  for (const m of marken){
    const liste = tags[m.satzId] || [];
    if (!liste.some(t => t.ruleId === m.ruleId && N(t.matchText) === N(m.matchText))) f.push(m.satzId + ': die Markierung ' + m.ruleId + ' der Vorlage steht nicht in SENTENCE_TAGS');
  }
  return f;
}

/* ---------- 2 bis 5: nur mit seinem Bestand ---------- */
let bestandDa = true;
try {
  const stand = JSON.parse(fs.readFileSync(path.join(REPO, 'data', 'lernstand.json'), 'utf8'));
  for (const slug of Object.keys(stand.angabe || {})) if (!(stand.nichtInArbeit || {})[slug] && !fs.existsSync(path.join(REPO, 'data', 'vokabeln-' + slug + '.js'))) bestandDa = false;
} catch (e){ bestandDa = false; }

if (!bestandDa){
  console.log('  (Seine Buchabzüge fehlen auf diesem Rechner — die Vorlagen lassen sich hier nicht auflösen.');
  console.log('   Punkt 2 bis 5 sind NICHT gelaufen. Auf einem fremden Rechner ist das der Normalfall.)');
} else {
  fs.mkdirSync(PRUEF, { recursive: true });
  const lauf = (werkzeug, args) => spawnSync(process.execPath, [path.join(HIER, werkzeug), ...args], { encoding: 'utf8', cwd: REPO });
  const letzte = r => String(r.stdout || '').trim().split('\n').filter(Boolean).slice(-1)[0] || String(r.stderr || '').trim().split('\n').slice(-1)[0] || '';

  /* 2 + 3: Eselsbrücken */
  const ebDatei = path.join(PRUEF, 'eb.json');
  const r1 = lauf('koran-eb-aufloesen.mjs', [path.join(VORLAGEN, 'eselsbruecken.json'), ebDatei, path.join(PRUEF, 'eb-lesen.txt')]);
  if (sag(r1.status === 0, 'die Eselsbrücken-Vorlage löst sich ohne Fehler auf' + (r1.status === 0 ? '' : ' — ' + letzte(r1).slice(0, 140)))){
    const soll = JSON.parse(fs.readFileSync(ebDatei, 'utf8'));
    const erste = lade('data/eselsbruecken.js', 'BUCH_ESELSBRUECKEN') || {}, andere = lade('data/eselsbruecken-alt.js', 'ESELSBRUECKEN_ALT') || {};
    const f = vergleicheEselsbruecken(soll, erste, andere);
    sag(!f.length, Object.keys(soll).length + ' Karten: jede Eselsbrücke der Vorlage steht wortgleich in den zwei Dateien' + (f.length ? ' — ' + f.length + ' Abweichung(en): ' + f.slice(0, 3).join(' · ') : ''));
    /* Störtests */
    const erste2 = Object.assign({}, erste), id0 = Object.keys(soll)[0];
    erste2[id0] = String(erste2[id0]) + ' x';
    sag(vergleicheEselsbruecken(soll, erste2, andere).length === 1, 'Störtest: eine geänderte erste Eselsbrücke wird gemeldet');
    const andere2 = Object.assign({}, andere); andere2[id0] = (andere2[id0] || []).slice(0, 1);
    sag(vergleicheEselsbruecken(soll, erste, andere2).length === 1, 'Störtest: eine fehlende weitere Eselsbrücke wird gemeldet');
  }

  /* 2 + 4 + 5: Sätze */
  const r2 = lauf('koran-satz-aufloesen.mjs', [path.join(VORLAGEN, 'saetze.json'), PRUEF]);
  if (sag(r2.status === 0, 'die Satz-Vorlage löst sich ohne Fehler auf' + (r2.status === 0 ? '' : ' — ' + letzte(r2).slice(0, 140)))){
    const r3 = lauf('koran-satz-einbauen.mjs', ['--gleich', PRUEF]);
    sag(r3.status === 0, 'der Abschnitt in data/beispielsaetze.js ist zeichengleich mit Vorlage und Kopf' + (r3.status === 0 ? '' : ' — ' + letzte(r3).slice(0, 140)));
    const marken = (JSON.parse(fs.readFileSync(path.join(PRUEF, 'satz-marken.json'), 'utf8')).markierungen) || [];
    const tags = new Function(fs.readFileSync(path.join(REPO, 'grammar-data.js'), 'utf8') + ';return SENTENCE_TAGS;')();
    const f = vergleicheMarken(marken, tags);
    sag(!f.length && marken.length > 0, marken.length + ' Markierungen der Vorlage stehen in SENTENCE_TAGS' + (f.length ? ' — ' + f.slice(0, 3).join(' · ') : ''));
    /* Störtests */
    if (marken.length){
      const tags2 = Object.assign({}, tags); tags2[marken[0].satzId] = (tags2[marken[0].satzId] || []).filter(t => t.ruleId !== marken[0].ruleId);
      sag(vergleicheMarken(marken, tags2).length >= 1, 'Störtest: eine fehlende Markierung wird gemeldet');
    }
    /* Störtest für --gleich: ein verdorbener Block muss den Vergleich rot machen. */
    const STOER = path.join(PRUEF, 'stoer');
    fs.mkdirSync(STOER, { recursive: true });
    fs.copyFileSync(path.join(PRUEF, 'satz.json'), path.join(STOER, 'satz.json'));
    fs.writeFileSync(path.join(STOER, 'satz-block.txt'), fs.readFileSync(path.join(PRUEF, 'satz-block.txt'), 'utf8').replace('KEIN SATZ, mit Absicht.', 'KEIN SATZ, mit Absicht!'), 'utf8');
    sag(lauf('koran-satz-einbauen.mjs', ['--gleich', STOER]).status === 1, 'Störtest: ein geänderter Kommentar im Abschnitt macht --gleich rot');
  }
}
/* Störtest für Punkt 1 — läuft immer. Das Zeichen entsteht aus seiner Nummer. */
sag(arabischeZeichen('abc ' + String.fromCodePoint(0x628) + ' def') === 1 && arabischeZeichen('{b:45968} {v:112:1:1-4}') === 0, 'Störtest: ein arabisches Zeichen in einer Vorlage würde gezählt, ein Verweis nicht');

console.log(rot ? '\n⛔ pruefe-koran-vorlagen: es gibt Befunde.' : '\n✅ pruefe-koran-vorlagen: die Vorlagen sind frei von Arabisch' + (bestandDa ? ' und ergeben genau das Ausgelieferte.' : '.'));
process.exit(rot);
