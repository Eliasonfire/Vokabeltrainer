/* test-quran-vorladen.mjs — welcher Vers wird als naechstes vorgeladen?
 *
 * ⛔⛔ DER ANLASS (15.09.2026). Elias, mit Screenshot aus Sure 97:
 *
 *   „ich habe gerade diese fehler meldung bekommen. wollte die sura mehrmals
 *    hinterinander hören und manchmal hat es auch gestockt. ich will das es so
 *    oft läuft bis ich es selbst ausschalte"
 *
 * Die Schleife lief endlos, das war nie das Problem. Das Stocken kam vom
 * VORLADEN: `audioVorladen(sure, vers + 1)` laedt bei Vers 5 den Vers 6 vor.
 * Den gibt es in Sure 97 nicht, das Vorladen steigt aus — und der Ruecksprung
 * auf Vers 1 findet ein leeres zweites Element. Statt „play() auf eine fertige
 * Datei" beginnt ein Netzabruf, und den hoert man. Jeden Rundlauf, an
 * derselben Stelle.
 *
 * ⛔ WARUM EIN TEST UND NICHT EINE MESSUNG IM BROWSER: der Pane darf keinen
 * Ton machen — er laeuft in Elias' Zimmer. Zwei Stunden Testrezitationen sind
 * dort schon einmal gelaufen. [[pane_ist_nicht_meine_werkbank]]
 * Also wird die Entscheidung geprueft, nicht ihr Klang.
 *
 * ⛔ Die Regel wird AUS DER QUELLE gelesen, nicht abgeschrieben. Eine zweite
 * Kopie liefe auseinander, und der Test bliebe gruen.
 * [[entscheidung_gilt_fuer_das_zweite_werkzeug]]
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
/* ⛔ CRLF → LF beim Lesen: Git legt die Datei beim Auschecken mit CRLF ab
   (core.autocrlf=true, im Repo LF), die Muster unten suchen `\n\}\n`. Im
   CRLF-Nachbau vom 24.09.2026 wurde dieser Test rot, ohne Fehler im Code.
   [[zeilenende_r_bricht_muster]] */
const quelle = fs.readFileSync(path.join(REPO, 'js', 'quran-audio.js'), 'utf8').replace(/\r\n/g, '\n');

/* ⛔ Ohne Kommentare suchen, wo es um CODE geht. Der erste Lauf meldete die
   alte Fassung als „noch vorhanden" — und der Treffer stand in dem Kommentar,
   der erklaert, dass sie ERSETZT wurde. Ein Kommentar, der den Fehler nennt,
   ist kein Fehler. [[stichworttreffer_im_kommentar]] */
const nurCode = quelle
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');

let fehler = 0;
const ok = (b, was) => { console.log((b ? '  ok  ' : '  ⛔  ') + was); if (!b) fehler++; };

/* ---------- 1. Die Zeile steht da und ist die einzige ihrer Art ----------
   ⭐ Seit dem 19.09.2026 rechnet die Regel `audioFolgeVers()` — dieselbe
   Funktion, die auch `audioNaechster()` fragt. Vorher stand sie an drei
   Stellen und ist am 15.09. schon einmal auseinandergelaufen. */
const ZEILE = /audioVorladen\(sure,\s*audioFolgeVers\(sure,\s*vers\)\)/;
ok(ZEILE.test(nurCode), 'audioSpiele laedt den Schleifenanfang vor, nicht blind vers+1');
ok(/audioSpiele\(QAUDIO\.sure,\s*folge\)/.test(nurCode),
   'audioNaechster fragt dieselbe Funktion — eine Rechnung, nicht zwei');
const alte = nurCode.match(/audioVorladen\(sure,\s*vers\s*\+\s*1\)/g) || [];
ok(alte.length === 0, 'die alte Fassung `audioVorladen(sure, vers + 1)` steht nirgends mehr'
  + (alte.length ? '  (' + alte.length + '× gefunden)' : ''));

/* ---------- 2. Die Entscheidung nachrechnen ----------
   ⛔ Hier stand die Regel bis zum 19.09.2026 ein ZWEITES Mal, von Hand
   nachgeschrieben. Ein Test, der seine eigene Fassung prueft, misst nichts:
   die Quelle haette sich aendern koennen, ohne dass hier etwas rot wird.
   Jetzt wird `audioFolgeVers()` aus js/quran-audio.js herausgeschnitten und
   gefahren. [[testvorlage_selbst_nachgebaut]] */
const mFolge = quelle.match(/\nfunction audioFolgeVers\([^)]*\)\{[\s\S]*?\n\}\n/);
const mGilt  = quelle.match(/\nfunction schleifeGilt\(\)\{[\s\S]*?\n\}\n/);
if (!mFolge || !mGilt){
  console.log('  ⛔  audioFolgeVers() oder schleifeGilt() nicht gefunden');
  process.exit(1);
}
function naechster(vers, schleifeAn, von, bis, verseInSure){
  const ctx = {
    QAUDIO: { sure: 67 },
    QSCHLEIFE: { an: schleifeAn, von, bis, sure: 67 },
    audioVersZahl: () => verseInSure
  };
  vm.createContext(ctx);
  vm.runInContext(mGilt[0] + mFolge[0] + '\nthis.RUF = audioFolgeVers;', ctx);
  return ctx.RUF(67, vers);
}
/* [Vers, Schleife an?, von, bis, Verse, erwartet, Beschreibung] */
const FAELLE = [
  [1, true,  1, 5, 5, 2,  'Sure 97, Schleife 1-5, Vers 1 -> 2'],
  [4, true,  1, 5, 5, 5,  'Vers 4 -> 5'],
  [5, true,  1, 5, 5, 1,  '⭐ Vers 5 -> 1  (der Fall, der gestockt hat)'],
  [5, false, 0, 0, 5, 0,  'ohne Schleife am Surenende: 0 heisst „danach ist Schluss"'],
  [20, true, 10, 20, 30, 10, 'al-Mulk 10-20: Vers 20 -> 10, obwohl die Sure weitergeht'],
  [15, true, 10, 20, 30, 16, 'mitten im Bereich: 15 -> 16'],
  [30, true, 10, 20, 30, 10, 'jenseits des Bereichs: >= bis, also zurueck auf 10'],
  [3, true,  3, 3, 5, 3,  'ein einzelner Vers in Schleife: 3 -> 3'],
  [2, true,  0, 0, 5, 3,  'Schleife an, aber leer: wie ohne Schleife'],
];
console.log('');
for (const [v, an, von, bis, n, soll, was] of FAELLE) {
  const ist = naechster(v, an, von, bis, n);
  ok(ist === soll, was + '   -> ' + ist + (ist === soll ? '' : ' (erwartet ' + soll + ')'));
}

/* ---------- 3. Der Neuversuch ---------- */
console.log('');
ok(/NotAllowedError/.test(quelle), 'NotAllowedError wird eigens behandelt — dort hilft kein Neuversuch');
/* ⛔ Bis zum 19.09.2026: drei Versuche im Abstand 350/700/1050 ms, zusammen
   2,1 Sekunden — kuerzer als jedes Funkloch, durch das er faehrt. */
ok(/const QAUDIO_SCHNELL = 5;/.test(quelle),
   'fuenf schnelle Versuche (0,4 · 0,8 · 1,6 · 3,2 · 6,4 s)');
ok(/QAUDIO_SCHNELL \+ QAUDIO_LANGE/.test(quelle),
   'danach alle 15 Sekunden weiter, bis zehn Minuten um sind');
ok(!/QAUDIO\.versuche\s*<=\s*3/.test(quelle), 'die alte Drei-Versuche-Grenze ist weg');
ok(/addEventListener\('online'/.test(quelle),
   'kommt das Netz zurueck, laeuft es von selbst wieder an');
ok(/QAUDIO\.versuchFuer\b/.test(nurCode.split("addEventListener('online'")[1] || ''),
   '… aber nur, wenn ein Neuversuch haengt — eine angehaltene Rezitation bleibt an');
ok(/versuchFuer\s*===\s*kennung/.test(quelle),
   'der Neuversuch prueft, ob DERSELBE Vers noch gewaehlt ist');
ok(/navigator\.onLine\s*===\s*false/.test(quelle), 'bei fehlendem Netz sagt die Meldung das auch');
ok(!/hinweis\s*=\s*'Ton lässt sich nicht starten'/.test(quelle),
   'die alte nichtssagende Meldung ist weg');

/* ---------- 4. Stoertest: wuerde der Test einen Rueckfall bemerken? ---------- */
console.log('');
const kaputt = nurCode.replace(ZEILE, 'audioVorladen(sure, vers + 1)');
ok(!ZEILE.test(kaputt), 'Stoertest: die alte Fassung wird erkannt');
ok(naechster(5, true, 1, 5, 5) !== 6, 'Stoertest: 5 -> 6 waere der Fehler und faellt auf');

console.log('');
console.log(fehler ? '⛔ ' + fehler + ' Fehler.' : '✅ Vorladen und Neuversuch stimmen.');
process.exit(fehler ? 1 : 0);
