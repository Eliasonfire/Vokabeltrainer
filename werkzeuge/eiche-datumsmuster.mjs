/* eiche-datumsmuster.mjs — sieht der Datumsprüfer die Uhrzeiten überhaupt?
 * ==========================================================================
 *
 * ⛔⛔ DER FALL: `pruefe-datumsangaben.mjs` kam am 20.08.2026 aus dem
 * Korantrainer herüber. Dort lautete das Uhrzeit-Muster
 *
 *     /\b(\d{2}:\d{2})\s*Uhr\b/
 *
 * und das Wort „Uhr" kommt in der Vokabeltrainer-Notiz in **keiner einzigen**
 * Überschrift vor. Das Werkzeug wäre grün gewesen, ohne je eine Uhrzeit
 * angesehen zu haben — genau die Falle, die sein eigener Kopfkommentar
 * beschreibt: *„ein Prüfwerkzeug kann nur fehlschlagen an dem, was es
 * überhaupt ansieht."* [[pruefwerkzeug_mit_eingebauter_antwort]]
 *
 * ⭐⭐ UND DER GEFÄHRLICHERE FEHLER LIEGT IN DER GEGENRICHTUNG: In dieser
 * Notiz stehen massenhaft Quranstellen als `Sure:Vers` — **112:1**, **89:1**,
 * **105:1**. Ein zu weites Muster liest sie als Uhrzeit und meldet
 * Fehlalarme, bis niemand mehr hinsieht. Deshalb prüft diese Datei beide
 * Richtungen. [[kandidatenliste_ist_keine_fehlerliste]]
 *
 * ⭐ Das Muster wird AUS `pruefe-datumsangaben.mjs` gelesen, nicht nachgebaut.
 * [[handliste_neben_echter_quelle]]
 *
 * Aufruf:  node werkzeuge/eiche-datumsmuster.mjs
 * Exitcode 1 = das Muster trifft nicht mehr, was es treffen soll.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const quelle = fs.readFileSync(path.join(HIER, 'pruefe-datumsangaben.mjs'), 'utf8');

const m = /const uRoh = b\.kopf\.match\(\/(.+)\/\);/.exec(quelle);
if (!m){
  console.log('⛔ In pruefe-datumsangaben.mjs steht keine Zeile `const uRoh = b.kopf.match(/…/);` mehr.');
  console.log('   Entweder wurde das Uhrzeit-Muster entfernt oder umbenannt — beides gehört gesehen.');
  process.exit(1);
}
const RE = new RegExp(m[1]);
console.log('  Muster aus pruefe-datumsangaben.mjs: /' + m[1] + '/');
console.log('');

/* Wortgleich mit der Zeile darunter in pruefe-datumsangaben.mjs. */
const zeitAus = kopf => {
  const r = RE.exec(kopf);
  return r ? r[1].replace(/x$/, '5') : null;
};

const FAELLE = [
  /* JA — die drei Schreibweisen, die in dieser Notiz wirklich vorkommen */
  ['## 20.08.2026, 22:1x — Der Befund steht auf seiner Seite',        '22:15',
   '⭐ Zehnerminute als Platzhalter — der häufigste Stil hier'],
  ['## 20.08.2026, ~22:25 — Der Wächter hat den elften Fall gemeldet', '22:25',
   'ungefähr, mit Tilde'],
  ['## 19.08.2026, 05:00–06:00 — eine Zeitspanne',                     '05:00',
   'Spanne — der ERSTE Wert zählt'],
  ['## 🌅 Stand nach der Nachtschicht (29.07.2026, 13:35 — fortgeschrieben)', '13:35',
   'in Klammern, hinter dem Datum'],
  ['## 20.08.2026, 09:05 Uhr — die Korantrainer-Schreibweise',         '09:05',
   'die Fassung, aus der das Werkzeug stammt — muss weiter gehen'],

  /* NEIN — und diese sind der eigentliche Nachweis */
  ['## 21.08.2026 — Kapitel 24 und Sure 112:1 als Beleg',              null,
   '⛔⛔ Quranstelle. Ein zu weites Muster macht daraus 11:21 oder 12:01'],
  ['## 20.08.2026 — Eselsbrücke aus 105:1, Wurzel aus 89:1',           null,
   '⛔ zwei Quranstellen in einer Überschrift'],
  ['## 20.08.2026 — Nachtschicht ohne jede Zeitangabe',                null,
   'gar keine Uhrzeit'],
  ['## 18.08.2026 — 587 Markierungen, 358 Sätze',                      null,
   '⛔ Zahlen ohne Doppelpunkt dürfen nicht greifen'],
];

let fehler = 0;
for (const [kopf, soll, warum] of FAELLE){
  const ist = zeitAus(kopf);
  const ok = ist === soll;
  if (!ok) fehler++;
  console.log((ok ? '  ok   ' : '  ⛔   ') + String(ist).padEnd(7)
    + ' soll ' + String(soll).padEnd(7) + warum);
}

/* ⭐ Gegenprobe an der echten Notiz: findet das Muster dort überhaupt etwas?
   Ein Muster, das nie greift, bestünde alle Nein-Fälle oben mühelos. */
const NOTIZ = 'G:\\1. Workspace\\Obsidian\\Gedächtnis\\Elias Gedächtnis\\03 - Projekte\\Vokabeltrainer-Arabisch.md';
let mitZeit = 0, koepfe = 0;
try {
  for (const z of fs.readFileSync(NOTIZ, 'utf8').split(/\r?\n/)){
    if (!z.startsWith('## ')) continue;
    koepfe++;
    if (zeitAus(z)) mitZeit++;
  }
  console.log('');
  console.log('  An der echten Notiz: ' + mitZeit + ' von ' + koepfe + ' Überschriften tragen eine Uhrzeit.');
  if (!mitZeit){
    console.log('  ⛔ KEINE einzige — das Muster greift nicht mehr. Genau der Zustand,');
    console.log('     in dem das Werkzeug grün meldet, ohne etwas geprüft zu haben.');
    fehler++;
  }
} catch { console.log('\n  ⚠️ Vault-Notiz nicht erreichbar — Gegenprobe übersprungen.'); }

/* ⛔⛔ ZWEITER TEIL: DIE SPANNEN-ERKENNUNG.

   Die Reihenfolgeprüfung in pruefe-datumsangaben.mjs nimmt Blöcke mit einer
   Zeitspanne im Kopf aus. Ohne diese Ausnahme meldete sie am 20.08.2026
   **4 Fehlalarme** — alle vier Rückwärtssprünge der Notiz betreffen Spannen,
   es sind nachträglich eingefügte Verlaufsblöcke.

   ⛔ Die gefährlichere Richtung ist wieder die weite: `112:1` und `89:1` in
   einer Überschrift sehen aus wie eine Zeitspanne. Träfe das Muster sie,
   wäre der Block ausgenommen — und ein echter Rücksprung bliebe stumm. */
const mS = /const spanne = \(b\.kopf\.match\((\/.+?\/[gimsuy]*)\)/.exec(quelle);
if (!mS){
  console.log('');
  console.log('⛔ In pruefe-datumsangaben.mjs steht keine Zeile `const spanne = …` mehr —');
  console.log('   entweder wurde die Reihenfolgeprüfung entfernt oder umgebaut.');
  process.exit(1);
}
const spanneRe = new RegExp(mS[1].slice(1, mS[1].lastIndexOf('/')),
  mS[1].slice(mS[1].lastIndexOf('/') + 1));
const spanneAus = kopf => (kopf.match(spanneRe) || []).length > 1;
console.log('');
console.log('  Spannen-Muster aus derselben Datei: ' + mS[1]);
console.log('');
const SPANNEN = [
  ['## 20.08.2026, 02:29–02:42 — Box von Hand',            true,  '⭐ Gedankenstrich — der häufigste Fall'],
  ['## 20.08.2026, 08:4x–09:0x — Neue Schicht',            true,  '⭐ Platzhalter auf beiden Seiten'],
  ['## 20.08.2026, 05:00-06:00 — mit Bindestrich',         true,  'Bindestrich statt Gedankenstrich'],
  ['## 20.08.2026, 23:24 — Die Satzschablone',             false, 'EINE Uhrzeit, keine Spanne'],
  ['## 20.08.2026, ~22:25 — ungefähr',                     false, '„ungefähr" ist keine Spanne'],
  ['## 20.08.2026 — Kapitel 24 und Sure 112:1',            false, '⛔ eine Quranstelle'],
  ['## 20.08.2026 — Eselsbrücke aus 105:1, Wurzel aus 89:1', false, '⛔⛔ ZWEI Quranstellen — sehen aus wie eine Spanne'],
];
for (const [kopf, soll, warum] of SPANNEN){
  const ist = spanneAus(kopf);
  const ok = ist === soll;
  if (!ok) fehler++;
  console.log((ok ? '  ok   ' : '  ⛔   ') + (ist ? 'Spanne ' : 'einzeln')
    + ' soll ' + (soll ? 'Spanne ' : 'einzeln') + '   ' + warum);
}

/* ⭐ Am echten Bestand: null Spannen wäre verdächtig — dann greift die
   Ausnahme nie, und die vier bekannten Fehlalarme kommen zurück. */
try {
  let mitSpanne = 0, koepfe2 = 0;
  for (const zz of fs.readFileSync(NOTIZ, 'utf8').split(/\r?\n/)){
    if (!zz.startsWith('## ')) continue;
    koepfe2++;
    if (spanneAus(zz)) mitSpanne++;
  }
  console.log('');
  console.log('  An der echten Notiz: ' + mitSpanne + ' von ' + koepfe2 + ' Überschriften tragen eine Zeitspanne.');
  if (!mitSpanne){
    console.log('  ⛔ KEINE — dann greift die Ausnahme nie und die vier bekannten');
    console.log('     Fehlalarme kommen bei jedem Lauf zurück.');
    fehler++;
  }
} catch { console.log('\n  ⚠️ Vault-Notiz nicht erreichbar — Gegenprobe übersprungen.'); }

console.log('');
if (fehler){
  console.log('⛔ ' + fehler + ' Abweichung(en) — Uhrzeit- oder Spannen-Muster stimmen nicht mehr.');
  process.exit(1);
}
console.log('✔ ' + (FAELLE.length + SPANNEN.length) + ' Fälle richtig (' + FAELLE.length + ' Uhrzeit, ' + SPANNEN.length + ' Spanne), und beide Muster greifen an der Notiz.');
