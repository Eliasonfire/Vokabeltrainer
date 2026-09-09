/* arabisch-hervorheben.mjs — die EINE Zerlegung, auch für die erzeugten Seiten
 * ============================================================================
 *
 * ⛔ DER ANLASS (09.09.2026, dreimal am selben Tag)
 *
 * „مَدْرَسَةٌ → مَدَارِسُ" stand in der App rückwärts, weil ein Pfeil zwischen
 * zwei arabischen Läufen ein NEUTRALES Zeichen ist und deren Richtung bekommt.
 * Behoben in der App (v457/v458), dann noch einmal im Regel-Aufklapper (v459).
 *
 * Und dann fiel derselbe Fehler auf der Seite auf, die Elias morgens ÖFFNET:
 * `artefakte/wartet-auf-elias.html`. Dort standen **7 von 7** solcher Stellen
 * verkehrt herum, darunter „وَاحِدٌ → وَاحِدَةٌ" — im Browser gemessen
 * (x=110 gegen x=60). Die Entscheidungsseite selbst zeigte also die Beispiele
 * rückwärts, an denen er entscheiden soll.
 *
 * ⚠️ Auf dem `<li>` stand `unicode-bidi: isolate` sogar schon — als
 * UA-Vorgabe des Browsers. Das beweist den Punkt: Isolation am äußeren Kasten
 * trennt ihn von der UMGEBUNG, nicht die beiden Läufe voneinander. Nur wer
 * JEDEN Lauf einzeln verpackt, dreht die Reihenfolge richtig.
 *
 * ====================================================================
 * WARUM DIESE DATEI NICHT SELBST ZERLEGT
 *
 * ⭐⭐ Sie SCHNEIDET `arabischHervorheben()` aus `js/kern.js` heraus, statt
 * sie nachzubauen. Ein Nachbau wäre die vierte Kopie derselben Entscheidung —
 * und die Nacht vom 09.09. besteht aus nichts anderem als Fällen, in denen die
 * zweite Kopie die Reparatur nicht mitbekommen hat.
 * [[entscheidung_gilt_fuer_das_zweite_werkzeug]] [[testvorlage_selbst_nachgebaut]]
 *
 * ⛔ `js/kern.js` als Ganzes lässt sich nicht auswerten (`VOCAB_DATA is not
 * defined` — die Datei hat Wirkung auf oberster Ebene). Deshalb wird genau der
 * Block von `function escapeHtml(` bis zum Ende von `arabischHervorheben`
 * herausgeschnitten; die beiden Konstanten AR_BEREICH/AR_LAUF liegen
 * dazwischen und kommen mit.
 *
 * ⚠️ Verschiebt jemand eine der beiden Funktionen, findet der Schnitt sie
 * nicht mehr — dann wirft dieses Modul beim Laden, statt still eine kaputte
 * Zerlegung zu liefern. Ein Fehler beim Start ist hier das mildere Ergebnis.
 * [[ausfall_ist_unsichtbar_gebaut]]
 *
 * Benutzung:
 *   import { arabischHervorheben, BIDI_CSS } from './arabisch-hervorheben.mjs';
 *   html = arabischHervorheben(text, 'ar');     // maskiert SELBST, kein escapeHtml davor
 *   …und BIDI_CSS in den <style> der erzeugten Seite.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let QUELLE = '';   // der herausgeschnittene Block, wortwoertlich

function schneiden(){
  const src = fs.readFileSync(path.join(REPO, 'js', 'kern.js'), 'utf8');
  const a = src.indexOf('function escapeHtml(');
  const b = src.indexOf('function arabischHervorheben(');
  if (a < 0 || b < 0 || b < a)
    throw new Error('js/kern.js: escapeHtml oder arabischHervorheben nicht gefunden '
      + '(oder die Reihenfolge hat sich gedreht) — der Schnitt muss angepasst werden.');
  let i = src.indexOf('{', b);
  if (i < 0) throw new Error('js/kern.js: arabischHervorheben ohne Rumpf?');
  let tiefe = 0, ende = i;
  for (; ende < src.length; ende++){
    if (src[ende] === '{') tiefe++;
    else if (src[ende] === '}'){ tiefe--; if (!tiefe) break; }
  }
  if (tiefe) throw new Error('js/kern.js: die Klammern von arabischHervorheben gehen nicht auf.');
  const block = src.slice(a, ende + 1);
  QUELLE = block;
  const raus = new Function(block + '; return {escapeHtml, arabischHervorheben, AR_LAUF};')();

  /* ⛔ Sofort nachsehen, ob das Herausgeschnittene auch WIRKT. Ein Schnitt, der
     eine Funktion liefert, die nichts mehr zerlegt, wäre die schlimmere Sorte
     Fehler: alles läuft, und die Seiten stehen wieder verkehrt herum.
     Die Probe baut ihr Arabisch aus Codepunkten, nicht aus abgeschriebenen
     Zeichen. [[zeichenklasse_nie_sichtbar_kopieren]] */
  const M = String.fromCharCode(0x645), K = String.fromCharCode(0x643);
  const probe = raus.arabischHervorheben(M + ' → ' + K, 'ar');
  const spans = (probe.match(/<span/g) || []).length;
  if (spans !== 2)
    throw new Error('arabischHervorheben aus js/kern.js zerlegt nicht mehr: '
      + spans + ' Span(s) statt 2 bei zwei arabischen Laeufen.');
  if (raus.escapeHtml('<b>') !== '&lt;b&gt;')
    throw new Error('escapeHtml aus js/kern.js maskiert nicht mehr.');
  return raus;
}

const { escapeHtml, arabischHervorheben, AR_LAUF } = schneiden();

/* ⭐⭐ DER EINE HANDGRIFF FUER EINE GANZE ERZEUGTE SEITE.
 *
 * Die Alternative waere gewesen, in jedem Seitenbauer jedes `esc(x)` von Hand
 * durchzugehen und die arabischen davon zu ersetzen. Vier Dateien, ueber
 * fuenfzig Stellen, und bei jeder die Frage, ob sie in einem ATTRIBUT steht —
 * dort waere ein eingesetzter <span> ein Fehler. Genau die Sorte Arbeit, bei
 * der die fuenfzigste Stelle vergessen wird.
 *
 * Stattdessen einmal am Ende ueber die fertige Seite: Text ausserhalb von
 * Tags wird verpackt, alles andere bleibt, wie es ist.
 *
 *   - `<script>`- und `<style>`-Bloecke werden UEBERSPRUNGEN. Dort stehen
 *     Daten und Regeln; ein <span> darin waere Unsinn oder Schaden.
 *   - Tag-Inneres (`<a href="…">`, `data-…="…"`) wird uebersprungen, weil die
 *     Zerlegung nur auf den Textstuecken DAZWISCHEN laeuft.
 *   - Kommentare bleiben unberuehrt.
 *
 * ⚠️ Der Text ist zu diesem Zeitpunkt bereits maskiert. Deshalb wird NICHT
 * `arabischHervorheben()` benutzt (die maskiert selbst und wuerde `&amp;` zu
 * `&amp;amp;` machen), sondern nur deren Muster `AR_LAUF`.
 *
 * ⚠️ `AR_LAUF` traegt das `g`-Flag und merkt sich damit `lastIndex`. Mit
 * `.replace()` ist das harmlos (es setzt zurueck) — `.test()` waere es NICHT.
 * [[regexp_g_merkt_sich_lastindex]]
 */
export function arabischInSeite(html, klasse = 'ar'){
  const verpacke = (t) => t.replace(AR_LAUF,
    (lauf) => '<span class="' + klasse + '" lang="ar">' + lauf + '</span>');
  /* ⛔ Ein schon verpackter Lauf wird UEBERSPRUNGEN — sonst steckt beim
     zweiten Aufruf ein Span im Span. Gefunden hat das der eigene Test
     (test-arabisch-hervorheben.mjs, „zweimal angewandt aendert nichts mehr"):
     in der Anwendung passiert es nie, aber ein Handgriff, der beim zweiten Mal
     etwas anderes tut, ist eine Falle fuer den naechsten Seitenbauer.
     ⚠️ Der uebersprungene Bereich muss VOR der allgemeinen Tag-Regel stehen —
     sonst frisst `<[^>]*>` schon das oeffnende <span>. */
  const TEIL = new RegExp(
    '<span class="' + klasse + '" lang="ar">[\\s\\S]*?</span>'
    + '|<script\\b[\\s\\S]*?</script>|<style\\b[\\s\\S]*?</style>'
    + '|<!--[\\s\\S]*?-->|<[^>]*>', 'gi');
  let raus = '', letzte = 0, m;
  TEIL.lastIndex = 0;
  while ((m = TEIL.exec(html))){
    raus += verpacke(html.slice(letzte, m.index)) + m[0];
    letzte = m.index + m[0].length;
  }
  return raus + verpacke(html.slice(letzte));
}

/* Die CSS-Zeile, die dazugehört. Sie steht HIER und nicht in jeder erzeugten
   Seite einzeln — sonst hat die nächste Seite sie wieder nicht. */
export const BIDI_CSS = '.ar{unicode-bidi:isolate}';

/* ⭐⭐ FUER SEITEN, DIE IM BROWSER ZEICHNEN.
 *
 * `artefakte/freigabe.html`, `regelpruefung.html` und `wartungsfragen.html`
 * tragen ihre Daten als JSON in der Seite und bauen die Liste erst dort
 * zusammen. Dort nuetzt eine Reparatur am Server-`esc()` nichts — die Zerlegung
 * muss IM Browser passieren.
 *
 * Also wandert der herausgeschnittene Block wortwörtlich in das `<script>` der
 * Seite. Das ist zwar eine Kopie, aber keine HANDGESCHRIEBENE: sie stammt bei
 * jedem Bauen frisch aus `js/kern.js`. Aendert sich die Zerlegung dort, aendert
 * sie sich beim naechsten Bauen hier mit — genau das, was einer von Hand
 * gepflegten zweiten Fassung fehlt.
 * [[entscheidung_gilt_fuer_das_zweite_werkzeug]]
 *
 * Benutzung im Generator:
 *   <script>${BROWSER_QUELLE}
 *     const ar = (s) => arabischHervorheben(String(s == null ? '' : s), 'ar');
 *     …
 *   </script>
 *
 * ⚠️ `escapeHtml` kommt mit — die Seite hat danach also ihre eigene Fassung.
 * Hat sie schon eine, ist eine davon zu loeschen, sonst wirft der Browser
 * „Identifier has already been declared" und die GANZE Seite bleibt leer.
 * Genau so ist am 06.09.2026 js/uebung.js ausgefallen (AR_LAUF doppelt).
 */
export const BROWSER_QUELLE = QUELLE;

export { escapeHtml, arabischHervorheben };
