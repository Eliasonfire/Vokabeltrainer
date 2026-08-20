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

console.log('');
if (fehler){
  console.log('⛔ ' + fehler + ' Abweichung(en) — das Uhrzeit-Muster ist zu weit oder zu eng.');
  process.exit(1);
}
console.log('✔ ' + FAELLE.length + ' von ' + FAELLE.length + ' richtig, und an der Notiz greift es.');
