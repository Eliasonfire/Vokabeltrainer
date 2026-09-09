/* ohne-kommentare-preload.mjs — ruht diese Aussage auf einem KOMMENTAR?
 * ======================================================================
 *
 * ⛔ HANDWERKZEUG, kein Prüfer. Es läuft nicht im Sammellauf mit und soll es
 * auch nicht: es beantwortet eine Frage, die man STELLT, nicht eine, die
 * dauernd gestellt werden muss.
 *
 * ⛔⛔ DIE FRAGE (09.09.2026, an einem Tag fünfmal aufgetreten)
 *
 * Ein Prüfer, der behauptet „dieser Ausdruck steht im Quelltext", und dafür den
 * ROHTEXT durchsucht, liest auch die Kommentare — und die nennen genau das, was
 * dort stehen soll. Vier der fünf Fälle waren „nur" falsch erfüllbar. Der
 * fünfte hatte eine Wirkung: `pruefe-abgleich.mjs` zählte `vt_geraetId` als
 * Schlüssel des Geräteabgleichs, obwohl der Kommentar daneben genau erklärt,
 * warum er dort NICHT steht. Die Begründung einer Ausnahme hob die Ausnahme auf.
 *
 * ⭐ WIE MAN ES BEANTWORTET, OHNE EINE DATEI ANZUFASSEN
 *
 *   node --import "file:///G:/1. Workspace/Vokabeltrainer/werkzeuge/ohne-kommentare-preload.mjs" pruefe-x.mjs
 *
 * Das Modul hängt sich in `fs.readFileSync` und gibt für `js/*.js` den Text
 * OHNE Kommentare zurück (Länge bleibt gleich, Zeichenketten bleiben stehen).
 * Läuft der Prüfer damit anders als ohne, ruht eine seiner Aussagen auf einem
 * Kommentar. Auf der Platte ändert sich dabei nichts.
 *
 * ⚠️ ES BEWEIST NUR ETWAS, WENN ES ÜBERHAUPT WIRKT. Gegenprobe am 09.09.2026:
 * ein Zweizeiler, der die Schlüssel aus `SYNC_SCHLUESSEL` zählt, meldete ohne
 * das Modul 30 und mit ihm 29. Erst danach war „elf Prüfer laufen gleich" eine
 * Messung und nicht nur ein leeres Ergebnis.
 * [[leere_liste_ist_keine_messung]] [[stichworttreffer_im_kommentar]]
 *
 * Ergebnis dieser Runde: von elf Prüfern, die App-Quelltext roh lesen, läuft
 * KEINER anders — `pruefe-eselsbruecken`, `pruefe-ids`, `pruefe-sicherung`,
 * `pruefe-schreibanlass`, `test-buecher`, `test-hifz-sync`,
 * `test-quote-karteikarten`, `test-tippen-beide-richtungen`,
 * `test-trefferflaechen`, `test-sync`, `test-sync-anzeige`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ohneKommentareUndTexte } from './js-quelltext.mjs';

const HIER = path.dirname(fileURLToPath(import.meta.url));

const echt = fs.readFileSync;
/* Nur die App-Module. Datendateien und HTML bleiben, wie sie sind — dort wäre
   „ohne Kommentare" eine andere Frage und die Antwort schwerer zu deuten. */
const betrifft = (p) => /\/js\/[a-z0-9-]+\.js$/i.test(String(p).replace(/\\/g, '/'));

fs.readFileSync = function (p, ...rest) {
  const roh = echt.call(this, p, ...rest);
  if (typeof roh === 'string' && betrifft(p)){
    try { return ohneKommentareUndTexte(roh, { texte: false }); }
    catch { return roh; }          /* im Zweifel den Rohtext, nie gar nichts */
  }
  return roh;
};

/* Eine Zeile auf stderr, damit man im Nachhinein sieht, dass es aktiv war —
   sonst hält man einen Lauf mit für einen ohne. [[ausfall_ist_unsichtbar_gebaut]] */
process.stderr.write('[ohne-kommentare] js/*.js wird kommentarfrei gelesen (' + HIER + ')\n');
