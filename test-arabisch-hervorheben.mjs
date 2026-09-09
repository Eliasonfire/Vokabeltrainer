/* test-arabisch-hervorheben.mjs — greift der eine Handgriff für erzeugte Seiten?
 * ===============================================================================
 *
 * `werkzeuge/arabisch-hervorheben.mjs` schneidet `arabischHervorheben()` aus
 * `js/kern.js` heraus und bietet `arabischInSeite()` an: EIN Aufruf über eine
 * fertige HTML-Seite, der jeden arabischen Lauf im Text verpackt und alles
 * andere in Ruhe lässt.
 *
 * ⛔ Diese Datei prüft genau das, was schiefgehen kann, wenn man mit einem
 * Muster über fertiges HTML läuft:
 *   - ein Lauf in einem ATTRIBUT darf nicht angefasst werden (`<a href="…">`)
 *   - `<script>` und `<style>` bleiben unberührt (dort stehen Daten)
 *   - schon maskierter Text (`&amp;`) darf nicht ein zweites Mal maskiert werden
 *   - deutscher Text bleibt Zeichen für Zeichen gleich
 *
 * ⚠️ Die arabischen Probetexte werden aus CODEPUNKTEN gebaut. Eine sichtbar
 * abgeschriebene Ḥarakah kann fehlen, und dann prüft der Test etwas anderes,
 * als sein Name sagt. [[zeichenklasse_nie_sichtbar_kopieren]]
 *
 * Aufruf:  node test-arabisch-hervorheben.mjs
 */
import { arabischInSeite, arabischHervorheben, escapeHtml, BIDI_CSS, BROWSER_QUELLE }
  from './werkzeuge/arabisch-hervorheben.mjs';

const b = (c) => String.fromCharCode(c);
const M = b(0x645), K = b(0x643), FATHA = b(0x64E);
const PFEIL = b(0x2192);

let gut = 0, schlecht = 0;
const pruefe = (was, ist, soll) => {
  if (ist === soll){ gut++; console.log('  ok   ' + was); }
  else { schlecht++; console.log('  ⛔  ' + was + '\n       ist : ' + JSON.stringify(ist)
    + '\n       soll: ' + JSON.stringify(soll)); }
};

console.log('--- arabischInSeite: verpackt den Text, laesst den Rest ---\n');

/* 1. Der Fall, um den es geht */
pruefe('zwei Laeufe im Text bekommen je einen Span',
  arabischInSeite('<p>Beispiel: ' + M + ' ' + PFEIL + ' ' + K + '</p>'),
  '<p>Beispiel: <span class="ar" lang="ar">' + M + '</span> ' + PFEIL
  + ' <span class="ar" lang="ar">' + K + '</span></p>');

/* 2. Ein zusammenhaengender Lauf bleibt EIN Span — sonst reisst die
      verbundene Schrift auseinander (siehe js/kern.js). */
pruefe('zwei Woerter mit Leerzeichen bleiben EIN Lauf',
  arabischInSeite('<p>' + M + ' ' + K + '</p>'),
  '<p><span class="ar" lang="ar">' + M + ' ' + K + '</span></p>');

/* 3. Attribute */
pruefe('ein Lauf in einem Attribut bleibt unberuehrt',
  arabischInSeite('<a href="/x?q=' + M + '" title="' + K + '">hier</a>'),
  '<a href="/x?q=' + M + '" title="' + K + '">hier</a>');
pruefe('Attribut unberuehrt, Text daneben verpackt',
  arabischInSeite('<b data-w="' + M + '">' + M + '</b>'),
  '<b data-w="' + M + '"><span class="ar" lang="ar">' + M + '</span></b>');

/* 4. Skript und Stil */
pruefe('<script> bleibt unberuehrt',
  arabischInSeite('<script>const D=["' + M + '"];</script><p>' + K + '</p>'),
  '<script>const D=["' + M + '"];</script><p><span class="ar" lang="ar">' + K + '</span></p>');
pruefe('<style> bleibt unberuehrt',
  arabischInSeite('<style>.x:after{content:"' + M + '"}</style>'),
  '<style>.x:after{content:"' + M + '"}</style>');
pruefe('ein Kommentar bleibt unberuehrt',
  arabischInSeite('<!-- ' + M + ' -->x'),
  '<!-- ' + M + ' -->x');

/* 5. Nichts anfassen, was nicht arabisch ist */
pruefe('deutscher Text bleibt gleich',
  arabischInSeite('<p>Alle vier enden gleich &amp; fertig.</p>'),
  '<p>Alle vier enden gleich &amp; fertig.</p>');
pruefe('maskierter Text wird NICHT noch einmal maskiert',
  arabischInSeite('<p>&lt;b&gt; ' + M + '</p>'),
  '<p>&lt;b&gt; <span class="ar" lang="ar">' + M + '</span></p>');

/* 6. Ḥarakāt gehoeren zum Lauf, nicht daneben */
pruefe('eine Haraka bleibt im selben Span',
  arabischInSeite('<p>' + M + FATHA + '</p>'),
  '<p><span class="ar" lang="ar">' + M + FATHA + '</span></p>');

/* 7. Zweimal anwenden darf nicht doppelt verpacken — der Lauf steckt dann in
      einem Tag-Zwischenraum, aber der Span selbst ist ein Tag.
      ⚠️ Erwartet wird KEINE Verschachtelung, sondern derselbe Text. */
{
  const einmal = arabischInSeite('<p>' + M + '</p>');
  pruefe('zweimal angewandt aendert nichts mehr', arabischInSeite(einmal), einmal);
}

/* 8. Und der Rest der Ausstattung */
pruefe('BIDI_CSS nennt die Klasse aus arabischInSeite', BIDI_CSS.includes('.ar{'), true);
pruefe('BIDI_CSS setzt die Isolation', /unicode-bidi\s*:\s*isolate/.test(BIDI_CSS), true);
pruefe('BROWSER_QUELLE traegt beide Funktionen',
  BROWSER_QUELLE.includes('function escapeHtml(')
  && BROWSER_QUELLE.includes('function arabischHervorheben('), true);
pruefe('arabischHervorheben maskiert selbst', arabischHervorheben('<b>', 'ar'), '&lt;b&gt;');
pruefe('escapeHtml stammt aus js/kern.js und wirkt', escapeHtml('&'), '&amp;');

/* ---------- ⛔ STOERTEST: kann diese Datei ueberhaupt scheitern? ---------- */
console.log('\n=== Stoertest ===');
{
  let s = 0;
  const sp = (was, ist, soll) => { if (ist !== soll){ s++; console.log('  ⛔  ' + was); }
    else console.log('  ok   ' + was); };
  /* Eine absichtlich falsche Erwartung MUSS durchfallen — sonst prueft `pruefe`
     gar nichts. Gemessen wird an einem eigenen Zaehler, nicht am globalen. */
  let hilfsGut = 0, hilfsSchlecht = 0;
  const hilfe = (ist, soll) => { if (ist === soll) hilfsGut++; else hilfsSchlecht++; };
  hilfe(arabischInSeite('<p>' + M + '</p>'), '<p>' + M + '</p>');   // falsch: Span fehlt
  sp('eine falsche Erwartung faellt durch', hilfsSchlecht, 1);
  hilfe(arabischInSeite('<p>x</p>'), '<p>x</p>');                   // richtig
  sp('eine richtige Erwartung geht durch', hilfsGut, 1);
  sp('der Zaehler oben hat wirklich gezaehlt', gut > 10, true);
  if (s){ console.log('\n⛔ Der Stoertest greift nicht.'); process.exit(1); }
}

console.log('');
if (schlecht){
  console.log('⛔ ' + schlecht + ' von ' + (gut + schlecht) + ' Faellen falsch.');
  process.exit(1);
}
console.log('✅ alle ' + gut + ' Faelle richtig — der Handgriff verpackt den Text und sonst nichts.');
