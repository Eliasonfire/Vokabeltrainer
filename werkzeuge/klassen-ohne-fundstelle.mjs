#!/usr/bin/env node
/* klassen-ohne-fundstelle.mjs — welche CSS-Klasse aus index.html benutzt
 * niemand?
 *
 * ⛔ ALS DATEI, NICHT ALS EINZEILER. Derselbe Fehler zum zweiten Mal in
 * dieser Nacht: durch die Shell geschrieben verliert `\b` seine Bedeutung,
 * und das Ergebnis war „567 von 567 ohne Fundstelle" — also offensichtlicher
 * Unsinn, aber einer, der ohne Gegenprobe wie ein Befund aussieht.
 * [[python_backslash_b_wird_backspace]] [[unmoegliche_zahl_ist_ein_geschenk]]
 *
 * ⛔ GESUCHT WIRD IM ORIGINAL, Zeichenketten eingeschlossen. Die App baut
 * ihr Markup in Template-Literalen zusammen — `class="wq-saeule"` steht dort
 * IN einer Zeichenkette. Wer den kommentarfreien Text durchsucht, haelt die
 * halbe Oberflaeche fuer tot. [[funktion_als_referenz_sieht_tot_aus]]
 *
 * ⚠️ Das Ergebnis ist eine KANDIDATENliste. Eine Klasse kann aus Stuecken
 * zusammengesetzt werden (`'kal-s'+n`), dann findet sie hier niemand.
 * [[kandidatenliste_ist_keine_fehlerliste]]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(REPO, 'index.html'), 'utf8');

/* Definiert: alle `.klasse` in den <style>-Bloecken.
   ⛔ KOMMENTARE VORHER RAUS — und das ist genau der Fehler, gegen den es
   `js-quelltext.mjs` schon gibt; ich hatte ihn hier nur nicht angewandt.
   `.quran-freq-badge` stand in der Liste, obwohl seine Regel laengst geloescht
   ist: uebrig war nur der Kommentar, der das ERKLAERT. Ebenso
   `.chapter-book-Kaesten` und `.wz-nav`. Ein Prüfer, der roh sucht, findet
   seine eigene Dokumentation. [[stichworttreffer_im_kommentar]]
   ⚠️ Danach noch die `url(...)`-Angaben raus, sonst gelten `gstatic` und
   `woff2` als Klassennamen. */
let css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');
css = css.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/url\([^)]*\)/g, ' ');
const definiert = new Set([...css.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)].map(m => m[1]));

/* Benutzt: der ganze Rest — index.html ohne die <style>-Bloecke, plus js/. */
let such = html.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '\n');
for (const f of fs.readdirSync(path.join(REPO, 'js')).filter(x => x.endsWith('.js')))
  such += '\n' + fs.readFileSync(path.join(REPO, 'js', f), 'utf8');

/* ⭐ Eichung: eine Klasse, von der unabhaengig feststeht, dass sie benutzt
   wird, MUSS gefunden werden. `topbar` steht in validate.js als gepruefte
   Tatsache. Kommt sie hier nicht vor, misst dieses Werkzeug nichts.
   [[gruener_pruefer_beweist_nur_geprueftes]] */
const kommtVor = (k) => new RegExp('(^|[^\\w-])' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^\\w-])').test(such);
if (!kommtVor('topbar') || !kommtVor('hidden')) {
  console.log('⛔ EICHUNG GESCHEITERT: `topbar` oder `hidden` gilt als unbenutzt.');
  console.log('   Das kann nicht sein — dieses Werkzeug misst nichts. Kein Befund unten gilt.');
  process.exit(1);
}
/* Gegenrichtung: ein erfundener Name darf NICHT gefunden werden. */
if (kommtVor('gibtEsGarNichtXyz')) {
  console.log('⛔ EICHUNG GESCHEITERT: ein erfundener Klassenname wird gefunden.');
  process.exit(1);
}
console.log('Eichung ok: `topbar` und `hidden` werden gefunden, ein erfundener Name nicht.\n');

/* ⭐ ZUSAMMENGESETZTE Namen erkennen (09.09.2026). `kal-s1` bis `kal-s4`
   entstehen als `'kal-s' + kalStufe(wert)` (js/statistik.js), `feier-chip-gut`
   als `'feier-chip-' + ton` (js/feier.js). Am Stueck stehen sie nirgends — und
   waeren ohne diesen Schritt sechs falsche Befunde in einer Liste von
   vierundzwanzig. [[funktion_als_referenz_sieht_tot_aus]] */
const zusammengesetzt = (k) => {
  /* ⚠️ Der Anfang der Zeichenkette taugt NICHT als Anker: in
     `'kal-zelle kal-s' + kalStufe(wert)` steht das Anfuehrungszeichen vor
     `kal-zelle`, nicht vor `kal-s`. Verankert wird am ENDE — Praefix,
     schliessendes Anfuehrungszeichen, `+` oder `${`.

     ⛔ UND DER BELEG WIRD MITGELIEFERT, nicht nur ein Urteil. Ein reiner
     Praefixtest ist zu grosszuegig: er hielt `sent-thema` fuer „gebaut aus
     sent" und `feier-gross` fuer „gebaut aus feier-" — beides Unsinn. Wer die
     Fundstelle danebenstehen hat, sieht das in einer Sekunde; wer nur die
     Behauptung liest, glaubt sie. [[zahlen_ohne_beleg]] */
  for (let i = k.length - 1; i >= 4; i--) {
    const p = k.slice(0, i);
    const e = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const m = such.match(new RegExp('.{0,45}' + e + "['\"`]\\s*(?:\\+|,)|.{0,45}" + e + '\\$\\{'));
    if (m) return { praefix: p, beleg: m[0].replace(/\s+/g, ' ').trim() };
  }
  return null;
};

const roh = [...definiert].filter(k => !kommtVor(k)).sort();
const gebaut = [], ohne = [];
for (const k of roh) { const p = zusammengesetzt(k); if (p) gebaut.push(k.padEnd(20) + ' ← ' + p.beleg); else ohne.push(k); }

console.log(definiert.size + ' Klassen in den <style>-Bloecken definiert.');
if (gebaut.length) console.log('\n' + gebaut.length + ' KOENNTEN zur Laufzeit zusammengesetzt werden — Beleg daneben, bitte selbst lesen:\n  ' + gebaut.join('\n  '));
console.log('\n' + ohne.length + ' ohne jede Fundstelle in Markup oder js/'
  + (ohne.length ? ':\n  ' + ohne.join('\n  ') : '.'));
console.log('\n⚠️ Kandidatenliste, kein Urteil: eine Klasse kann zur Laufzeit');
console.log('   zusammengesetzt werden (`\'kal-s\' + n`) und steht dann nirgends am Stueck.');

/* ---------- Die Schwelle, damit dies mehr als ein Bericht ist ----------
   ⛔ Ein Werkzeug, das immer 0 zurueckgibt, laeuft im Sammellauf mit und
   sagt nie etwas. Genau so ist die Luecke in der Sicherung zwei Jahre lang
   unbemerkt geblieben. [[werkzeug_ohne_aufrufer]]

   ⭐ Deshalb ein GEMESSENER Stand vom 09.09.2026: 11 Klassen ohne jede
   Fundstelle (die 8 unten plus box-bars, sent-thema, sent-themen, die der
   Praefixtest zu grosszuegig eingeordnet hat — ihre Belege daneben zeigen
   das sofort). Kommt eine dazu, ist das ein Befund; wird eine aufgeraeumt,
   gehoert die Zahl hier heruntergesetzt. */
const STAND_09_09_2026 = 8;
if (ohne.length > STAND_09_09_2026){
  console.log('\n⛔ ' + (ohne.length - STAND_09_09_2026) + ' Klasse(n) MEHR ohne Fundstelle als am 09.09.2026 (' + STAND_09_09_2026 + ').');
  console.log('   Entweder ist eine Regel verwaist — dann weg — oder sie wird zur Laufzeit');
  console.log('   gebaut und der Beleg oben fehlt. Beides gehoert angesehen, nicht ignoriert.');
  process.exit(1);
}
if (ohne.length < STAND_09_09_2026)
  console.log('\n⭐ Weniger als am 09.09.2026 (' + STAND_09_09_2026 + ') — die Zahl oben im Quelltext bitte nachziehen.');
process.exit(0);
