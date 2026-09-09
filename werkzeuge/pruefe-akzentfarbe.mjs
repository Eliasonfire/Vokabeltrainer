#!/usr/bin/env node
/* pruefe-akzentfarbe.mjs — bleibt Torch Red die Vorgabe, und trägt jede Farbe?
 *
 * ⛔⛔ DER ANLASS ist ein Satz von Elias aus dieser Nacht (09.09.2026, 01:2x):
 *
 *   „warum ist cyan immer standart hier am pc als farbe? das habe ich nie
 *    gewollt, ich will tirch red haben satndartmässig"
 *
 * Eine Vorgabefarbe ist die Sorte Entscheidung, die beim Umsortieren einer
 * Liste unbemerkt kippt: wer `AKZENT_FARBEN` neu ordnet oder den Rueckfall in
 * `wendeAkzentfarbeAn()` anfasst, aendert sie, ohne es zu merken. Und Elias
 * sieht es erst Tage spaeter — an einem Bildschirm, der ploetzlich anders
 * aussieht.
 *
 * ⭐ `js/darstellung.js` (315 Zeilen) wurde von keinem Pruefer genannt.
 *
 * ⛔ Die echten Funktionen werden ausgeschnitten und ausgefuehrt.
 * [[testvorlage_selbst_nachgebaut]]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ohneKommentareUndTexte } from './js-quelltext.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const D = fs.readFileSync(path.join(REPO, 'js', 'darstellung.js'), 'utf8');

let fehler = 0;
const pruefe = (name, ist, soll) => {
  const ok = JSON.stringify(ist) === JSON.stringify(soll);
  if (!ok) { fehler++; console.log('  ⛔  ' + name + '\n        ist:  ' + JSON.stringify(ist) + '\n        soll: ' + JSON.stringify(soll)); }
  else console.log('  ok  ' + name);
};
const schneide = (muster, was) => {
  const m = D.match(muster);
  if (!m) { console.log('⛔ ' + was + ' nicht auffindbar — hat js/darstellung.js einen neuen Aufbau?'); process.exit(1); }
  return m[0];
};

/* ---------- Buehne ---------- */
const gesetzt = {};
const documentStub = { documentElement: { style: { setProperty: (k, v) => { gesetzt[k] = v; } } } };
const quelle =
    schneide(/const AKZENT_FARBEN = \[[\s\S]*?\n\];/, 'AKZENT_FARBEN') + '\n'
  + schneide(/function farbeZuHsl\(hex\)\{[\s\S]*?\n\}/, 'farbeZuHsl') + '\n'
  + schneide(/function farbeAusHsl\(h, s, l\)\{[\s\S]*?\n\}/, 'farbeAusHsl') + '\n'
  + schneide(/function akzentFamilie\(hex\)\{[\s\S]*?\n\}/, 'akzentFamilie') + '\n'
  + schneide(/const AKZENT_HEUTE = \{[\s\S]*?\n\};/, 'AKZENT_HEUTE') + '\n'
  + schneide(/function wendeAkzentfarbeAn\(hex\)\{[\s\S]*?\n\}/, 'wendeAkzentfarbeAn') + '\n'
  + 'return { AKZENT_FARBEN, AKZENT_HEUTE, farbeZuHsl, farbeAusHsl, akzentFamilie, wendeAkzentfarbeAn };';
const A = new Function('document', quelle)(documentStub);

console.log('=== Bleibt Torch Red die Vorgabe? ===\n');
pruefe('Torch Red steht an erster Stelle', A.AKZENT_FARBEN[0].hex, '#ff1744');
pruefe('und ist als „heute" markiert', A.AKZENT_FARBEN[0].heute, true);
pruefe('genau EINE Farbe traegt die Marke „heute"',
  A.AKZENT_FARBEN.filter(f => f.heute).length, 1);
pruefe('AKZENT_HEUTE hat dieselbe Basis', A.AKZENT_HEUTE.basis, '#ff1744');

/* ⛔ Der Rueckfall ist die eigentliche Wache: kommt eine Farbe an, die es
   nicht (mehr) gibt — etwa aus einem abgeglichenen Stand eines anderen
   Geraets —, muss Torch Red herauskommen und nicht die erste beste. */
pruefe('unbekannte Farbe faellt auf Torch Red zurueck', A.wendeAkzentfarbeAn('#123456'), '#ff1744');
pruefe('leere Angabe faellt auf Torch Red zurueck', A.wendeAkzentfarbeAn(''), '#ff1744');
pruefe('undefined faellt auf Torch Red zurueck', A.wendeAkzentfarbeAn(undefined), '#ff1744');
pruefe('Cyan bleibt Cyan, wenn er es WAEHLT', A.wendeAkzentfarbeAn('#00d2ff'), '#00d2ff');
/* ⭐ Die drei Stellen muessen DIESELBE Farbe meinen: die Marke „heute" in der
   Liste, der Rueckfall in wendeAkzentfarbeAn() und AKZENT_HEUTE.basis. Fasst
   jemand nur eine davon an, sieht alles weiter richtig aus — bis die Farbe
   auf einem Geraet kippt. [[entscheidung_gilt_fuer_das_zweite_werkzeug]] */
pruefe('die Marke „heute", der Rueckfall und AKZENT_HEUTE meinen dieselbe Farbe',
  [A.AKZENT_FARBEN.find(f => f.heute).hex, A.wendeAkzentfarbeAn('#123456'), A.AKZENT_HEUTE.basis],
  ['#ff1744', '#ff1744', '#ff1744']);

console.log('\n=== Traegt jede waehlbare Farbe eine vollstaendige Familie? ===\n');
{
  const PFLICHT = ['--red', '--red-bright', '--red-soft', '--red-dim', '--red-glow', '--red-wash', '--rand-wrongonly', '--accent-grad'];
  const kaputt = [];
  for (const f of A.AKZENT_FARBEN) {
    for (const k of Object.keys(gesetzt)) delete gesetzt[k];
    A.wendeAkzentfarbeAn(f.hex);
    for (const p of PFLICHT) {
      const v = gesetzt[p];
      if (!v || /undefined|NaN/.test(v)) kaputt.push(f.name + ' → ' + p + ' = ' + v);
    }
  }
  pruefe('alle ' + A.AKZENT_FARBEN.length + ' Farben setzen alle ' + PFLICHT.length + ' Variablen', kaputt, []);
}
{
  /* ⭐ „hell" muss heller sein als die Basis und „dim" dunkler — sonst wird
     ein Knopf unlesbar, und das sieht man erst auf dem Geraet. */
  const hell = (hex) => A.farbeZuHsl(hex)[2];
  const schief = [];
  for (const f of A.AKZENT_FARBEN) {
    if (f.hex === '#ff1744') continue;         /* handgepflegte Werte, s. u. */
    const fam = A.akzentFamilie(f.hex);
    if (!(hell(fam.bright) > hell(f.hex))) schief.push(f.name + ': bright nicht heller');
    if (!(hell(fam.soft) > hell(fam.bright) - 0.01)) schief.push(f.name + ': soft nicht heller als bright');
    if (!(hell(fam.dim) < hell(f.hex))) schief.push(f.name + ': dim nicht dunkler');
  }
  pruefe('hell wird heller, dim wird dunkler', schief, []);
}
{
  /* Hin und zurueck: die Umrechnung darf nicht abdriften. */
  const ab = [];
  for (const f of A.AKZENT_FARBEN) {
    const [h, s, l] = A.farbeZuHsl(f.hex);
    const zurueck = A.farbeAusHsl(h, s, l);
    const d = [1, 3, 5].map(i => Math.abs(parseInt(f.hex.slice(i, i + 2), 16) - parseInt(zurueck.slice(i, i + 2), 16)));
    if (Math.max(...d) > 2) ab.push(f.name + ': ' + f.hex + ' → ' + zurueck);
  }
  pruefe('Umrechnung hin und zurueck trifft auf 2 Stufen genau', ab, []);
}

console.log('\n=== Bleibt die Adressleiste schwarz? ===\n');
{
  /* ⛔ Eine ausdrueckliche Entscheidung, die im Quelltext begruendet steht:
     die App ist OLED-schwarz, eine mitgefaerbte Adressleiste waere ein
     Fremdkoerper. Der erste Entwurf zog sie mit; der Code ist wieder raus. */
  /* ⛔ KOMMENTARE RAUS, ZEICHENKETTEN DRIN. Der erste Entwurf suchte im rohen
     Text — und fand `theme-color` in dem Kommentar, der ERKLAERT, warum es
     nicht angefasst wird. Zum fuenften Mal in dieser Nacht derselbe Griff
     daneben. [[stichworttreffer_im_kommentar]]
     ⚠️ `texte: false` ist Absicht: ein echter Zugriff waere
     `setProperty('theme-color', …)` — also eine Zeichenkette. Wer die auch
     leert, findet den echten Fall nicht mehr. */
  const w = ohneKommentareUndTexte(
    schneide(/function wendeAkzentfarbeAn\(hex\)\{[\s\S]*?\n\}/, 'wendeAkzentfarbeAn'), { texte: false });
  pruefe('wendeAkzentfarbeAn fasst theme-color NICHT an', /theme-color/.test(w), false);
  const html = fs.readFileSync(path.join(REPO, 'index.html'), 'utf8');
  const meta = (html.match(/<meta[^>]*name="theme-color"[^>]*>/) || [''])[0];
  pruefe('index.html setzt theme-color auf Schwarz', /#000000|#000\b/.test(meta), true);
}

console.log('\n=== Stoertest ===\n');
{
  /* Eine Fassung ohne Rueckfall — die Probe muss sie melden. */
  const ohne = new Function('return (hex) => hex;')();
  pruefe('ohne Rueckfall wuerde eine unbekannte Farbe durchgehen', ohne('#123456'), '#123456');
  pruefe('und die echte Fassung tut das NICHT', A.wendeAkzentfarbeAn('#123456') === '#123456', false);
}

console.log('');
console.log(fehler ? '⛔ ' + fehler + ' Befund(e).' : '✅ Torch Red bleibt die Vorgabe, und jede Farbe traegt.');
process.exit(fehler ? 1 : 0);
