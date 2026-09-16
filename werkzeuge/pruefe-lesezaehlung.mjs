#!/usr/bin/env node
/* pruefe-lesezaehlung.mjs — bewacht, WANN eine Sure als gelesen zählt.
 * ===================================================================
 *
 * Elias am 16.09.2026: „auf meinem tablet hab ich zalzala gelesen die heutige
 * aufgabe und dann bin ich raus gegangen und es wurde einfach nicht gezählt,
 * wahrscheinnlich weil ich nicht runter scrollen konnte weil der bildschirm
 * groß genug war für die ganze sura."
 *
 * ⛔ DER FEHLER WAR NICHT SICHTBAR UND MELDETE SICH NIE. Gezählt wurde am
 * Beobachter des Lesestands, und der schneidet unten 60 % des Fensters ab
 * (`rootMargin: '-64px 0px -60% 0px'`). Passt eine kurze Sure ganz auf den
 * Schirm, steht ihr letzter Vers dauerhaft im abgeschnittenen Bereich — und es
 * gibt nichts zu rollen, was ihn nach oben brächte. Die Sure wurde NIE
 * gezählt, und zwar umso sicherer, je größer das Gerät ist.
 *
 * ⛔⛔ DIESER PRÜFER BEWACHT ZUERST EINEN SATZ VON ELIAS, NICHT NUR TECHNIK:
 * die Mindestzeit ist SEINE Vorgabe („mindesten so 1-2 min in der sure"), und
 * sie ist die Sorte Regel, die bei der nächsten Vereinfachung als „unnötig"
 * wegfällt. [[wirkung_an_der_quelle_stilllegen]]
 *
 * Fünf Prüfungen:
 *   1. Der Abschluss hängt NICHT mehr am beschnittenen Beobachter
 *   2. Es gibt einen zweiten Beobachter OHNE rootMargin für den letzten Vers
 *   3. Die Mindestzeit steht da und liegt in Elias' Spanne (60–120 s)
 *   4. Die Uhr hält an, wenn die App weggelegt wird (visibilitychange)
 *   5. Der Haken von Hand ist da — das Sicherheitsnetz unter der Automatik
 *
 * Störtest: `node werkzeuge/pruefe-lesezaehlung.mjs --stoertest`
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const DATEI = path.join(HIER, '..', 'js', 'quran.js');
const STOERTEST = process.argv.includes('--stoertest');

let quelle = fs.readFileSync(DATEI, 'utf8');

/* ⛔ Kommentare heraus, BEVOR gesucht wird. Dieser Prüfer zitiert den alten,
   falschen Aufruf in seiner eigenen Begründung — und in js/quran.js steht er
   ebenfalls als Warnung im Kommentar. Ohne diesen Schritt fände Prüfung 1
   ihren eigenen Beleg und meldete ewig rot.
   [[funktion_als_referenz_sieht_tot_aus]] [[stichworttreffer_im_kommentar]] */
const nurCode = quelle
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');

if (STOERTEST){
  /* Die Störung: den Abschluss wieder an den beschnittenen Beobachter hängen. */
  quelle = quelle.replace('LESE_ENDE_GESEHEN = true;',
    'LESE_SICHTBAR.has(versZahl(id)) && merkeWiederholung(id);');
}
const code = STOERTEST
  ? quelle.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
  : nurCode;

const fehler = [];
const pruefe = (name, ok, hinweis) => {
  if (ok) console.log('  ✔ ' + name);
  else { console.log('  ⛔ ' + name + ' — ' + hinweis); fehler.push(name); }
};

console.log('Lesezählung — wann gilt eine Sure als gelesen?');
console.log('');

/* 1. Der Abschluss darf nicht mehr am Lesestand-Beobachter hängen. */
pruefe('Abschluss NICHT am beschnittenen Beobachter',
  !/LESE_SICHTBAR\.has\(\s*versZahl/.test(code),
  'LESE_SICHTBAR.has(versZahl(...)) ist zurück — der Beobachter schneidet unten 60 % ab, '
  + 'eine kurze Sure auf großem Schirm wird damit NIE gezählt (Elias, 16.09.2026)');

/* 2. Ein eigener Beobachter für den letzten Vers, und zwar OHNE rootMargin. */
const zweiter = /LESE_ENDE_BEOBACHTER\s*=\s*new IntersectionObserver\(([\s\S]{0,400}?)\}\s*\)\s*;/.exec(code);
pruefe('zweiter Beobachter für den letzten Vers vorhanden', !!zweiter,
  'LESE_ENDE_BEOBACHTER = new IntersectionObserver(...) fehlt');
if (zweiter)
  pruefe('  … und er hat KEINEN rootMargin', !/rootMargin/.test(zweiter[1]),
    'ein rootMargin am Ende-Beobachter bringt genau den Fehler zurück, gegen den er gebaut ist');

/* 3. Die Mindestzeit — Elias' eigene Vorgabe. */
const zeit = /WDH_MINDESTZEIT\s*=\s*([0-9]+)\s*\*\s*([0-9]+)/.exec(code);
pruefe('Mindestzeit WDH_MINDESTZEIT steht im Code', !!zeit, 'WDH_MINDESTZEIT fehlt');
if (zeit){
  const ms = Number(zeit[1]) * Number(zeit[2]);
  pruefe('  … und liegt in seiner Spanne (60–120 s), ist: ' + (ms / 1000) + ' s',
    ms >= 60000 && ms <= 120000,
    'seine Vorgabe war „mindesten so 1-2 min" — ' + (ms/1000) + ' s liegt außerhalb');
  pruefe('  … und wird auch geprüft, nicht nur gesetzt',
    /leseZeitJetzt\(\)\s*<\s*WDH_MINDESTZEIT/.test(code),
    'die Konstante steht da, aber niemand vergleicht gegen sie');
}

/* 4. Die Uhr muss anhalten, wenn die App weggelegt wird. */
pruefe('Uhr hält beim Weglegen an (visibilitychange)',
  /visibilitychange[\s\S]{0,200}leseZeitHalt\s*\(/.test(code),
  'ohne diesen Haken ist WDH_MINDESTZEIT eine Wanduhr und damit keine Schranke: '
  + 'App weglegen, in zwei Minuten zurückkommen, Sure gilt als gelesen');

/* 5. Der Haken von Hand. */
pruefe('Haken von Hand vorhanden (data-suragelesen)',
  /data-suragelesen/.test(code) && /gelesenKnopfHtml/.test(code),
  'das Sicherheitsnetz unter einer Automatik, die an Bildschirmgeometrie hängt, fehlt');
pruefe('  … und er ist in der Versliste eingehängt',
  /\.join\(''\)\s*\+\s*gelesenKnopfHtml\(/.test(code),
  'gelesenKnopfHtml() existiert, wird aber beim Aufbau der Versliste nicht angehängt '
  + '— eine Funktion ohne Aufrufer [[werkzeug_ohne_aufrufer]]');

console.log('');
if (STOERTEST){
  if (fehler.length){ console.log('✔ Störtest: der Prüfer wird rot (' + fehler.length + ' Befund(e)).'); process.exit(0); }
  console.log('⛔ Störtest: der Prüfer blieb GRÜN, obwohl der Fehler eingebaut wurde.');
  process.exit(1);
}
if (fehler.length){ console.log('⛔ ' + fehler.length + ' Befund(e).'); process.exit(1); }
console.log('✅ Alle Prüfungen grün.');
