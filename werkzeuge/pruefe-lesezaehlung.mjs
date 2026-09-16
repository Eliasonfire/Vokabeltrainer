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
 * ⛔⛔ DIESER PRÜFER BEWACHT ZUERST SÄTZE VON ELIAS, NICHT NUR TECHNIK.
 * Die Mindestzeit war seine Vorgabe („mindesten so 1-2 min in der sure"), und
 * noch am selben Abend hat er sie selbst verfeinert: „aber wir können finde ich
 * nicht überall das selbe maß anwenden weil wenn wir dann zb sagen wir nehmen
 * 30 sekunden dann ist sura al mulk aber sicher nicht nach 30 sekunden
 * gelesen". Beides ist die Sorte Regel, die bei der nächsten Vereinfachung als
 * „unnötig" wegfällt — eine feste Zahl sieht einfacher aus.
 * [[wirkung_an_der_quelle_stilllegen]]
 *
 * Fünf Prüfungen:
 *   1. Der Abschluss hängt NICHT mehr am beschnittenen Beobachter
 *   2. Es gibt einen zweiten Beobachter OHNE rootMargin für den letzten Vers
 *   3. Die Schwelle hängt an der LÄNGE der Sure, wird je Sure gesetzt und
 *      geprüft; die Untergrenze liegt über seinen „5 sek" und unter einer Minute
 *   4. Die Uhr hält an, wenn die App weggelegt wird (visibilitychange)
 *   5. Der Haken von Hand ist da — das Sicherheitsnetz unter der Automatik
 *
 * Was hier NICHT geprüft wird: ob die Zahlen stimmen. Das rechnet
 * test-lesezaehlung.mjs mit dem echten Korantext nach.
 *
 * Störtest: `node werkzeuge/pruefe-lesezaehlung.mjs --stoertest`
 * — baut BEIDE alten Fehler wieder ein und verlangt, dass jede der zwei
 * zuständigen Prüfungen für sich rot wird.
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
const ohneKommentare = s => s
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');

const NAME_ABSCHLUSS = 'Abschluss NICHT am beschnittenen Beobachter';
const NAME_LAENGE = 'Schwelle hängt an der Länge der Sure';

if (STOERTEST){
  /* Störung 1: den Abschluss wieder an den beschnittenen Beobachter hängen. */
  quelle = quelle.replace('LESE_ENDE_GESEHEN = true;',
    'LESE_SICHTBAR.has(versZahl(id)) && merkeWiederholung(id);');
  /* Störung 2: wieder dieselbe Zeit für jede Sure. */
  quelle = quelle.replace(/LESE_SCHWELLE\s*=\s*LESE_SURE\s*\?\s*wdhSchwelle\(LESE_SURE\)\s*:\s*WDH_OHNE_TEXT;/,
    'LESE_SCHWELLE = WDH_OHNE_TEXT;');
}
const code = ohneKommentare(quelle);

const fehler = [];
const pruefe = (name, ok, hinweis) => {
  if (ok) console.log('  ✔ ' + name);
  else { console.log('  ⛔ ' + name + ' — ' + hinweis); fehler.push(name); }
};

console.log('Lesezählung — wann gilt eine Sure als gelesen?');
console.log('');

/* 1. Der Abschluss darf nicht mehr am Lesestand-Beobachter hängen. */
pruefe(NAME_ABSCHLUSS,
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

/* 3. Wie lange — nicht überall dasselbe Maß. */
const jeWort = /WDH_SEK_JE_WORT\s*=\s*([0-9.]+)/.exec(code);
pruefe(NAME_LAENGE,
  !!jeWort && Number(jeWort[1]) > 0
    && /LESE_SCHWELLE\s*=\s*LESE_SURE\s*\?\s*wdhSchwelle\(\s*LESE_SURE\s*\)/.test(code),
  'die Schwelle wird nicht mehr je Sure aus ihrer Wortzahl gesetzt — dann gilt wieder eine '
  + 'Zeit für al-Kawthar (10 Wörter) wie für al-Mulk (333). Elias: „nicht überall das selbe maß"');
pruefe('  … und sie wird auch geprüft, nicht nur gesetzt',
  /leseZeitJetzt\(\)\s*<\s*LESE_SCHWELLE/.test(code) && /LESE_SCHWELLE\s*-\s*leseZeitJetzt\(\)/.test(code),
  'LESE_SCHWELLE steht da, aber pruefeWiederholung() oder leseUhrStellen() vergleicht nicht gegen sie');
const unten = /WDH_MINDESTZEIT\s*=\s*([0-9]+)\s*\*\s*([0-9]+)/.exec(code);
pruefe('  … Untergrenze WDH_MINDESTZEIT steht im Code', !!unten, 'WDH_MINDESTZEIT fehlt');
if (unten){
  const ms = Number(unten[1]) * Number(unten[2]);
  pruefe('  … und liegt über „5 sek" und unter einer Minute, ist: ' + (ms / 1000) + ' s',
    ms > 5000 && ms < 60000,
    'unter 5 s zählt „für 5 sek rein geht, kurz guckt und wieder raus"; ab 60 s braucht die '
    + 'kürzeste Sure wieder „eine ganze minute" — beides seine Sätze vom 16.09.2026');
}

/* 4. Die Uhr muss anhalten, wenn die App weggelegt wird. */
pruefe('Uhr hält beim Weglegen an (visibilitychange)',
  /visibilitychange[\s\S]{0,200}leseZeitHalt\s*\(/.test(code),
  'ohne diesen Haken ist die Schwelle eine Wanduhr und damit keine Schranke: '
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
  const fehlt = [NAME_ABSCHLUSS, NAME_LAENGE].filter(n => !fehler.includes(n));
  if (!fehlt.length){
    console.log('✔ Störtest: beide eingebauten Fehler werden erkannt (' + fehler.length + ' Befund(e)).');
    process.exit(0);
  }
  console.log('⛔ Störtest: blieb GRÜN bei: ' + fehlt.join(' · '));
  process.exit(1);
}
if (fehler.length){ console.log('⛔ ' + fehler.length + ' Befund(e).'); process.exit(1); }
console.log('✅ Alle Prüfungen grün.');
