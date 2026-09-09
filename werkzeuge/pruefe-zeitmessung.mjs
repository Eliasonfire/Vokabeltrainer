#!/usr/bin/env node
/* pruefe-zeitmessung.mjs — zaehlt die Uebungszeit richtig, und bleibt sie unsichtbar?
 *
 * ⛔ WARUM ES DIESE DATEI GIBT (09.09.2026)
 *
 * `js/zeitmessung.js` (195 Zeilen) wurde bis heute von KEINEM Pruefer genannt.
 * Gemessen am 09.09.: von 22 Dateien in js/ galt das noch fuer `init.js` und
 * `sprachausgabe.js`. Ausgerechnet die Zeitmessung ist aber die Stelle, die in
 * der Nacht davor 750 von 1000 Cloudflare-Schreibvorgaengen verursacht hat —
 * sie schreibt alle 5 Sekunden.
 *
 * ⭐⭐ UND SIE TRAEGT EINE AUSDRUECKLICHE VORGABE VON ELIAS (08.09.2026, 00:38):
 *
 *   „am besten mir nicht sagen aber wenn ich es bei dir wissen will oder es
 *    nuetzlich ist damit zu arbeiten waere es denke ich gut als information"
 *
 * ⛔ Die Zahl gehoert in KEINE Oberflaeche. Kein Element, keine Zeile in der
 * Statistik, kein Zusatz in einer Feier. „Eine sichtbare Uhr macht aus Uebung
 * eine Pruefung; bei ADHS ist das genau die falsche Richtung."
 * [[adhs_enkodieren_ist_die_luecke]]
 *
 * Eine solche Vorgabe erodiert lautlos: irgendwann baut jemand eine huebsche
 * Statistikzeile, und niemand erinnert sich an den Satz. Deshalb prueft das
 * hier eine Maschine. [[wirkung_an_der_quelle_stilllegen]]
 *
 * ⛔ Die echten Funktionen werden aus js/zeitmessung.js AUSGESCHNITTEN und
 * ausgefuehrt — kein Nachbau. [[testvorlage_selbst_nachgebaut]]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ohneKommentareUndTexte } from './js-quelltext.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const JS = path.join(REPO, 'js');
const Z = fs.readFileSync(path.join(JS, 'zeitmessung.js'), 'utf8');

let fehler = 0;
const pruefe = (name, ist, soll) => {
  const ok = JSON.stringify(ist) === JSON.stringify(soll);
  if (!ok) { fehler++; console.log('  ⛔  ' + name + '\n        ist:  ' + JSON.stringify(ist) + '\n        soll: ' + JSON.stringify(soll)); }
  else console.log('  ok  ' + name);
  return ok;
};

/* ---------- Die echten Funktionen ausschneiden ---------- */
const schneide = (name) => {
  const m = Z.match(new RegExp('function\\s+' + name + '\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}'));
  if (!m) { console.log('⛔ ' + name + '() nicht auffindbar — hat js/zeitmessung.js einen neuen Aufbau?'); process.exit(1); }
  return m[0];
};
/* ⚠️ `ZEIT_LAUF` ist KEINE Konstante im Sinne dieser Buehne: sie ist der
   laufende Zustand, den jede Probe selbst setzt, und wird deshalb als
   Parameter uebergeben. Steht sie zusaetzlich im ausgeschnittenen Text, wirft
   die Bühne „Identifier has already been declared" — was hier ein ehrlicher
   Abbruch ist und keine stille Fehlmessung. */
const konstanten = (Z.match(/const ZEIT_[A-Z_]+\s*=\s*[^;]+;/g) || [])
  .filter(z => !/^const ZEIT_LAUF\b/.test(z)).join('\n');
if (!/ZEIT_TAGE/.test(konstanten) || !/ZEIT_MODI/.test(konstanten)) {
  console.log('⛔ Die ZEIT_-Konstanten sind nicht vollstaendig auffindbar.');
  process.exit(1);
}

/* Bühne: nur das, was die Funktionen wirklich anfassen. */
const bauen = () => {
  const speicher = { wert: {} };
  const LS = {
    get: (k, f) => (k === 'vt_zeit' ? speicher.wert : f),
    set: (k, v) => { if (k === 'vt_zeit') speicher.wert = v; },
  };
  const localStorage = { getItem: () => 'gTEST1', setItem: () => {} };
  let TAG = '2026-09-09';
  const todayStr = () => TAG;
  const umgebung = { visibilityState: 'visible' };
  const document = umgebung;
  const ZEIT_LAUF = { modus: null, letzteRegung: Date.now(), ticker: null };
  let GEH = { an: false };

  const quelle = konstanten + '\n'
    + schneide('zeitGeraet') + '\n'
    + schneide('zeitDaten') + '\n'
    + schneide('zeitAufraeumen') + '\n'
    + schneide('zeitGutschreiben') + '\n'
    + schneide('zeitTakt') + '\n'
    + schneide('zeitBildschirm') + '\n'
    + 'return { zeitGutschreiben, zeitAufraeumen, zeitTakt, zeitBildschirm, zeitGeraet };';

  const f = new Function('LS', 'localStorage', 'todayStr', 'document', 'ZEIT_LAUF', 'GEH',
    quelle)(LS, localStorage, todayStr, document, ZEIT_LAUF, GEH);
  return { ...f, speicher, ZEIT_LAUF, umgebung,
           setzeTag: (t) => { TAG = t; },
           setzeGeh: (an) => { GEH.an = an; } };
};

console.log('=== Rechnet die Zeitmessung richtig? ===\n');
{
  const b = bauen();
  b.zeitGutschreiben('learn', 5);
  b.zeitGutschreiben('learn', 5);
  b.zeitGutschreiben('hoeren', 5);
  pruefe('zwei Modi am selben Tag, dasselbe Geraet',
    b.speicher.wert['2026-09-09']['gTEST1'], { learn: 10, hoeren: 5 });

  b.zeitGutschreiben('quran', 5);
  pruefe('ein NICHT gemessener Bildschirm wird ignoriert',
    Object.keys(b.speicher.wert['2026-09-09']['gTEST1']), ['learn', 'hoeren']);

  b.setzeTag('2026-09-10');
  b.zeitGutschreiben('sentences', 5);
  pruefe('ein neuer Tag beginnt bei null',
    b.speicher.wert['2026-09-10']['gTEST1'], { sentences: 5 });
  pruefe('der alte Tag bleibt unangetastet',
    b.speicher.wert['2026-09-09']['gTEST1'], { learn: 10, hoeren: 5 });
}

/* ⭐ Der Punkt, der die ganze Aufteilung je Geraet traegt: SUMMIEREN, nicht
   maximieren. `vt_uebungstage` nimmt das Maximum und unterschaetzt damit jeden
   Tag, an dem Elias auf beiden Geraeten geuebt hat. */
{
  const b = bauen();
  b.zeitGutschreiben('learn', 300);
  b.speicher.wert['2026-09-09']['gTEST2'] = { learn: 180 };
  const tag = b.speicher.wert['2026-09-09'];
  const summe = Object.values(tag).reduce((s, g) => s + (g.learn || 0), 0);
  pruefe('zwei Geraete am selben Tag stehen NEBENeinander (5 min + 3 min = 8 min)', summe, 480);
  pruefe('und ueberschreiben sich nicht', Object.keys(tag).sort(), ['gTEST1', 'gTEST2']);
}

console.log('\n=== Zaehlt sie nur, wenn wirklich geuebt wird? ===\n');
{
  const zaehle = (bau) => {
    const b = bauen();
    b.ZEIT_LAUF.modus = 'learn';
    bau(b);
    b.zeitTakt();
    const t = b.speicher.wert['2026-09-09'];
    return t && t['gTEST1'] ? (t['gTEST1'].learn || 0) : 0;
  };
  pruefe('sichtbar und gerade beruehrt → 5 s',
    zaehle(b => { b.umgebung.visibilityState = 'visible'; b.ZEIT_LAUF.letzteRegung = Date.now(); }), 5);
  pruefe('Bildschirm verdeckt → nichts',
    zaehle(b => { b.umgebung.visibilityState = 'hidden'; b.ZEIT_LAUF.letzteRegung = Date.now(); }), 0);
  pruefe('seit 61 s nichts beruehrt → nichts',
    zaehle(b => { b.umgebung.visibilityState = 'visible'; b.ZEIT_LAUF.letzteRegung = Date.now() - 61000; }), 0);
  /* ⭐ Die eine Ausnahme von BEIDEN Bedingungen: im Geh-Modus ist der
     Bildschirm aus und 20 Minuten lang beruehrt niemand etwas — und genau
     dann wird geuebt. */
  pruefe('Geh-Modus: verdeckt UND 20 min unberuehrt → trotzdem 5 s',
    zaehle(b => { b.umgebung.visibilityState = 'hidden'; b.ZEIT_LAUF.letzteRegung = Date.now() - 1200000; b.setzeGeh(true); }), 5);
  {
    const b = bauen();
    b.ZEIT_LAUF.modus = null;
    b.zeitTakt();
    pruefe('kein gemessener Bildschirm offen → nichts', b.speicher.wert, {});
  }
}

console.log('\n=== Wirft sie alte Tage weg, und nur die alten? ===\n');
{
  const b = bauen();
  const TAGE = Number((konstanten.match(/ZEIT_TAGE\s*=\s*(\d+)/) || [])[1]);
  pruefe('ZEIT_TAGE ist auslesbar', Number.isFinite(TAGE) && TAGE > 0, true);
  const d = {};
  for (let i = 0; i < TAGE + 3; i++) d['2026-' + String(1 + (i % 12)).padStart(2, '0') + '-' + String(1 + (i % 28)).padStart(2, '0') + '#' + i] = { x: i };
  const vorher = Object.keys(d).sort();
  const nachher = Object.keys(b.zeitAufraeumen(d)).sort();
  pruefe('es bleiben genau ' + TAGE + ' Tage', nachher.length, TAGE);
  pruefe('weggeworfen wurden die DREI aeltesten', vorher.slice(0, 3).every(k => !nachher.includes(k)), true);
  pruefe('der juengste ist noch da', nachher.includes(vorher[vorher.length - 1]), true);
}

/* ---------- ⛔ Die Vorgabe: die Zahl bleibt unsichtbar ---------- */
console.log('\n=== Bleibt die Zahl aus der Oberflaeche? ===\n');
{
  const abruf = ['zeitBericht', 'zeitRoh', 'zeitSumme'];

  /* ⛔⛔ GESUCHT WIRD IM ROHEN TEXT, NICHT IM GESTRIPPTEN (09.09.2026).

     Der erste Entwurf lief ueber `ohneKommentareUndTexte()` — und der
     Stoertest hat ihn zerlegt: ein ECHTER Aufruf, testweise in
     `wortQuoteBericht()` eingebaut, wurde **nicht gefunden**. In
     `js/statistik.js` laeuft der Zustand des Strippers ab etwa Zeile 536 aus
     dem Tritt (dort blieb `` `zeitBericht()` `` uebrig, waehrend der Rest der
     Kommentarzeile geleert war); alles danach wird zu Unrecht als
     Zeichenkette behandelt. Ein Pruefer, der genau das nicht sieht, was er
     sucht, ist schlimmer als keiner.
     ⚠️ Die Ursache im Stripper ist NICHT gefunden — sie steht als offener
     Punkt im Arbeitsstand. Eine erfundene Begruendung waere hier schlimmer
     als die offene Frage. [[erfundene_begruendung_schliesst_den_fall]]

     ⭐ Im rohen Text ist die Unterscheidung in diesem Bestand eindeutig: eine
     ERWAEHNUNG steht immer in Backticks (`` `zeitBericht()` ``), ein AUFRUF
     nie. Das ist eine Regel ueber den Hausstil, keine ueber JavaScript — und
     genau deshalb steht sie hier und nicht im gemeinsamen Werkzeug. */
  const suche = (text, quelle) => {
    const raus = [];
    for (const n of abruf) {
      const re = new RegExp('\\b' + n + '\\s*\\(', 'g');
      let m;
      while ((m = re.exec(text))) if (text[m.index - 1] !== '`') raus.push(quelle + ':' + text.slice(0, m.index).split('\n').length + ' ruft ' + n + '()');
    }
    return raus;
  };

  const treffer = [];
  for (const f of fs.readdirSync(JS).filter(x => x.endsWith('.js') && x !== 'zeitmessung.js'))
    treffer.push(...suche(fs.readFileSync(path.join(JS, f), 'utf8'), 'js/' + f));
  treffer.push(...suche(fs.readFileSync(path.join(REPO, 'index.html'), 'utf8'), 'index.html'));

  if (treffer.length) {
    fehler++;
    console.log('  ⛔  Die Uebungszeit wird in der Oberflaeche abgerufen:');
    treffer.forEach(t => console.log('        ' + t));
    console.log('      Elias am 08.09.2026: „am besten mir nicht sagen." Eine sichtbare');
    console.log('      Uhr macht aus Uebung eine Pruefung. [[adhs_enkodieren_ist_die_luecke]]');
  } else {
    console.log('  ok  Kein Modul und kein Markup ruft zeitBericht()/zeitRoh() auf.');
  }

  /* Stoertest: wuerde ein Aufruf ueberhaupt gefunden? */
  const probe = ohneKommentareUndTexte('function x(){ zeitBericht(14); }');
  pruefe('Stoertest: ein Aufruf in der Oberflaeche wuerde auffallen',
    /\bzeitBericht\s*\(/.test(probe), true);
  /* Gegenrichtung: der Name in einem KOMMENTAR darf nicht ausloesen. */
  const probe2 = ohneKommentareUndTexte('/* siehe zeitBericht() in js/zeitmessung.js */');
  pruefe('Stoertest: der Name in einem Kommentar loest NICHT aus',
    /\bzeitBericht\s*\(/.test(probe2), false);
}

console.log('');
console.log(fehler ? '⛔ ' + fehler + ' Befund(e).' : '✅ Die Zeitmessung rechnet richtig und bleibt unsichtbar.');
process.exit(fehler ? 1 : 0);
