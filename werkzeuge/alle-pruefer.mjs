#!/usr/bin/env node
/* alle-pruefer.mjs — jeden Prüfer einmal, und eine Übersicht daraus
 * ==========================================================================
 *
 * ⭐ WOZU
 *
 * In der Nacht auf den 21.08.2026 habe ich dreimal von Hand eine Schleife über
 * alle Prüfer geschrieben, um zu sehen, was rot ist. Das gehört in ein
 * Werkzeug: ein Befehl statt zehn, und die Lage auf einen Blick.
 *
 *   node werkzeuge/alle-pruefer.mjs            alle laufen lassen
 *   node werkzeuge/alle-pruefer.mjs --knapp    nur die Übersicht
 *
 * ==========================================================================
 * ⛔⛔ WAS DER EXITCODE ALLEIN NICHT SAGT — und warum hier eine Spalte dafür steht
 *
 * Am 21.08.2026 gemessen: die elf Prüfer nutzen ihre Exitcodes UNEINHEITLICH.
 *
 *   pruefe-duplikate.js      1 = Werkzeugfehler, 2 = Befunde für Elias
 *   pruefe-erreichbarkeit.js 2 = Befunde
 *   pruefe-taschkil.js       1 = BEIDES (Z275 Datendateien, Z837 Befunde)
 *   die übrigen              1 = Befunde
 *
 * Ein Aufrufer kann daraus also NICHT ableiten, ob das Werkzeug kaputt ist
 * oder ob Elias entscheiden muss. [[kennzeichen_mit_zwei_ursachen]]
 *
 * ⛔ Vereinheitlicht wird hier NICHTS: das wären elf Dateien ohne belegten
 * Nutzen, und ein bestehender Aufrufer könnte daran brechen. Stattdessen zeigt
 * die Übersicht die letzte Ausgabezeile mit — die sagt, was der Code meint.
 *
 * ==========================================================================
 * ⚠️ ZWEI PRÜFER STEHEN DAUERHAFT ROT, UND DAS IST IN ORDNUNG
 *
 * pruefe-duplikate.js (2 Befunde) und pruefe-taschkil.js (25 echte von 37)
 * warten auf Elias' Entscheidung — beide stehen auf seiner Seite „Was auf dich
 * wartet". Automation/routines.json sagt dazu ausdrücklich: „Beide Skripte
 * gehen ueber ein 'warn' hinaus, blockieren aber keinen Push."
 *
 * Deshalb trennt die Schlusszeile: „rot, wartet auf Elias" von „rot, echter
 * Mangel". Ein Werkzeug, das dauerhaft rot steht, wird sonst überlesen.
 *
 * ==========================================================================
 * ⛔ AUFRUFER: bisher nur von Hand (Nachtschicht, eigene Läufe).
 *
 * Es steht NICHT im Wartungs-Prompt — der liegt unter Automation/ und gehört
 * nicht zu diesem Ordner. Ob er dort eingetragen wird, entscheidet Elias; der
 * Punkt liegt auf seiner Warteseite. Ein Werkzeug ohne Aufrufer ist sonst
 * genau der Fehler, vor dem [[werkzeug_ohne_aufrufer]] warnt — hier ist der
 * Aufrufer ein Mensch, und das steht hier, damit es niemand für ein Versehen
 * hält.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HIER, '..');
const KNAPP = process.argv.includes('--knapp');

/* Die Liste stammt aus dem Wartungs-Prompt (Abschnitt „Prüfungen"), am
   21.08.2026 abgeglichen. `pruefe-wortfelder.js` wird dort mit `--fenster`
   aufgerufen — ohne den Schalter misst es den ganzen Abzug statt Elias'
   Fenster und meldet Zahlen, die nichts mit seinem Lernstand zu tun haben. */
const PRUEFER = [
  ['validate.js', []],
  ['pruefe-duplikate.js', []],
  ['pruefe-erreichbarkeit.js', []],
  ['pruefe-eselsbruecken.js', []],
  ['pruefe-funktionen.js', []],
  ['pruefe-markierungen.js', []],
  ['pruefe-quran.js', []],
  ['pruefe-saetze.js', []],
  ['pruefe-taschkil.js', []],
  ['pruefe-transkripte.js', []],
  ['pruefe-wortfelder.js', ['--fenster']],
  ['werkzeuge/pruefe-artefakt-inhalt.mjs', []],
  ['werkzeuge/pruefe-datumsangaben.mjs', []],
  ['werkzeuge/pruefe-eigene-vorrang.mjs', []],
  ['werkzeuge/pruefe-erreichbarkeit-eichung.mjs', []],
  ['werkzeuge/pruefe-gedaechtnis.mjs', []],
  ['werkzeuge/pruefe-ids.mjs', []],
  /* ⛔ Ohne diese Zeile haette pruefe-muster.mjs keinen Aufrufer und liefe nie.
     Genau der Fehler, den es selbst sucht, in seiner allgemeinen Form: gebaut,
     gepusht, ausgeliefert — und nie gestartet. [[werkzeug_ohne_aufrufer]] */
  ['werkzeuge/pruefe-muster.mjs', []],
  ['werkzeuge/pruefe-plural-thema.mjs', []],
  ['werkzeuge/pruefe-schreibpfade.mjs', []],
  ['werkzeuge/pruefe-volles-programm.mjs', []],
  /* ⛔ SIEBEN PRUEFSTAENDE, DIE BIS ZUM 21.08.2026 NIEMAND GESTARTET HAT.
     Sie fahren die echte App-Logik in einem vm gegen einen DOM-Stub hoch —
     also genau das, was kein anderer Pruefer hier tut. Gefunden wurden sie
     bei der Suche nach fest eingetragenen Zahlen; ein grep nach ihren Namen
     ergab NULL Treffer ausserhalb der Dateien selbst.

     Fuenf von acht waren rot, und keiner davon wegen eines Fehlers in der
     App: dreimal hatte sich die App auf Elias' ausdruecklichen Wunsch
     geaendert (16.08. Leitner-Stufen, 17.08. Umbenennung, 18.08. Leiste
     spaeter zurueck) und der Pruefstand blieb stehen. Einmal hatte eine
     Funktion zwei Rueckgabefelder dazubekommen.

     ⭐ Ein Pruefstand ohne Aufrufer altert genauso schnell wie der Code, den
     er pruefen soll — er sagt es nur niemandem. Deshalb stehen sie jetzt
     hier. [[werkzeug_ohne_aufrufer]] */
  ['test-buecher.mjs', []],
  ['test-p1.mjs', []],
  ['test-p6.mjs', []],
  ['test-p8.mjs', []],
  ['test-p9.mjs', []],
  ['test-sync.mjs', []],
  ['test-sync-anzeige.mjs', []],
  ['test-wurzel.mjs', []],
  /* ⭐ VIER EICHUNGEN, die bis zum 21.08.2026 ebenfalls niemand gestartet hat.
     Sie halten Grenzfaelle fest, die teuer erkauft wurden — etwa die
     Zahlwort-Trennung, deren erster Entwurf 8 von 9 Faellen in beide
     Richtungen falsch traf.

     ⛔ ES SIND VIER VON SIEBEN, und der Unterschied ist der ganze Punkt:
     diese vier lesen die Bedingung, die sie pruefen, AUS DER QUELLDATEI.
       eiche-datumsmuster      <- werkzeuge/pruefe-datumsangaben.mjs
       eiche-fragenreihenfolge <- werkzeuge/vorrat.mjs, data/feld-ausnahmen.js
       eiche-wortart-knopf     <- werkzeuge/wartungsfragen-artefakt.mjs
       eiche-zahlplural        <- validate.js (const ZAHLWORT)

     Die drei anderen (eiche-harf-jarr, eiche-plural-beleg,
     eiche-taschkil-beleg) haben die Bedingung als KOPIE im eigenen Text.
     Sie pruefen damit sich selbst und bleiben gruen, egal was sich an der
     echten Prueflogik aendert. Sie hier einzutragen haette ihnen eine
     Verlaesslichkeit gegeben, die sie nicht haben.
     [[handliste_neben_echter_quelle]]

     ⭐ eiche-zahlplural sagt diese Lehre in seinem eigenen Kopf („Die Regex
     wird NICHT nachgebaut, sondern aus validate.js gelesen") — sie war beim
     Bauen also bekannt und ist bei den drei anderen trotzdem nicht
     angewandt worden.

     Stoertest vor dem Eintrag: in validate.js Z. 205 „|drei|" aus der
     ZAHLWORT-Regex entfernt (Gegenprobe: 0 Treffer danach) -> die Eichung
     meldet „2 Abweichungen, die Zahlwort-Pruefung trifft nicht mehr, was
     sie soll". Danach per cp zurueck, sha256 gegengeprueft. */
  ['werkzeuge/eiche-datumsmuster.mjs', []],
  ['werkzeuge/eiche-fragenreihenfolge.mjs', []],
  ['werkzeuge/eiche-wortart-knopf.mjs', []],
  ['werkzeuge/eiche-zahlplural.mjs', []]
];

/* ⛔ pruefe-oberflaeche.js läuft NICHT unter node — es prüft die laufende App
   und braucht Browser, DOM und localStorage. Sein Exitcode 3 heißt „falsch
   aufgerufen", nicht „Fehler gefunden". Es hier mitlaufen zu lassen hieße,
   jeden Lauf mit einem falschen Rot zu beginnen. */
const NUR_IM_BROWSER = ['pruefe-oberflaeche.js'];

/* ⭐ test-p8.mjs stand bis zum 21.08.2026 NICHT in der Liste oben: es
   stuerzte beim Laden ab, und ein Rot, das immer da ist, liest irgendwann
   niemand mehr. Seit es 22/22 meldet, laeuft es mit.

   Der Weg dorthin steht im Pruefstand selbst; hier nur das, was fuer die
   Liste wichtig ist: die acht test-*.mjs fahren die ECHTE App-Logik in
   einem vm gegen einen DOM-Stub hoch. Bricht einer, liegt der Fehler
   haeufiger im Pruefstand als in der App — von den fuenf roten waren es
   fuenf von fuenf. Erst lesen, was er misst, dann die App verdaechtigen.
   [[testfehler_kann_echten_mangel_zeigen]] */

const ergebnisse = [];
for (const [rel, args] of PRUEFER){
  const datei = path.join(REPO, rel);
  if (!fs.existsSync(datei)){
    ergebnisse.push({ rel, code: null, letzte: '⛔ Datei fehlt' });
    continue;
  }
  let code = 0, aus = '';
  try { aus = execFileSync('node', [rel, ...args], { cwd: REPO, encoding: 'utf8' }); }
  catch (e){ code = typeof e.status === 'number' ? e.status : -1; aus = (e.stdout || '') + (e.stderr || ''); }
  const zeilen = aus.split(/\r?\n/).filter(l => l.trim());
  /* ⛔ NICHT einfach die letzte Zeile: bei drei Pruefern ist das die
     Fortsetzung eines mehrzeiligen Urteils, und die liest sich ohne die
     Zeile darueber wie ein Bruchstueck ("und die Zitate in grammar-data.js
     bleiben Kurzzitate."). Gesucht ist die letzte NICHT eingerueckte Zeile
     — dort faengt das Urteil an. */
  let i = zeilen.length - 1;
  while (i > 0 && /^\s/.test(zeilen[i])) i--;
  const urteil = zeilen.slice(i).join(' ').replace(/\s+/g, ' ').trim();
  ergebnisse.push({ rel, code, letzte: urteil || '(keine Ausgabe)' });
  if (!KNAPP){
    console.log('─'.repeat(74));
    console.log('  ' + rel + (args.length ? ' ' + args.join(' ') : '') + '   → exit ' + code);
    zeilen.slice(-3).forEach(l => console.log('    ' + l.slice(0, 100)));
  }
}

/* ---------- Übersicht ---------- */
console.log('');
console.log('═'.repeat(74));
console.log('  ÜBERSICHT — ' + new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' }));
console.log('═'.repeat(74));
const breit = Math.max(...ergebnisse.map(e => e.rel.length));
for (const e of ergebnisse)
  console.log('  ' + (e.code === 0 ? '✅' : '⛔') + ' ' + e.rel.padEnd(breit)
    + '  exit ' + String(e.code).padStart(2) + '   ' + e.letzte.slice(0, 68));

const rot = ergebnisse.filter(e => e.code !== 0);
console.log('');
console.log('  ' + ergebnisse.length + ' Prüfer gelaufen, ' + rot.length + ' rot.');
console.log('  (' + NUR_IM_BROWSER.join(', ') + ' läuft nur im Browser und ist nicht dabei.)');

if (rot.length){
  console.log('');
  console.log('  ⚠️ ROT heißt NICHT automatisch „kaputt". Die Exitcodes sind uneinheitlich:');
  console.log('     pruefe-duplikate.js: 2 = Befunde für Elias, 1 = Werkzeugfehler');
  console.log('     pruefe-taschkil.js:  1 = BEIDES');
  console.log('     Die letzte Zeile oben sagt, was gemeint ist — sie lesen, nicht nur den Code.');
  console.log('     Bekannt und in Ordnung: duplikate (2 Befunde) und taschkil (25 echte)');
  console.log('     warten auf Elias und stehen auf seiner Seite „Was auf dich wartet".');
}

/* ⛔ Der eigene Exitcode meldet nur, ob ALLE gelaufen sind — nicht, ob alle
   grün sind. Sonst stünde dieses Werkzeug wegen der zwei wartenden Prüfer
   dauerhaft rot und würde nach dem dritten Lauf überlesen. */
const nichtGelaufen = ergebnisse.filter(e => e.code === null || e.code === -1);
if (nichtGelaufen.length){
  console.log('');
  console.log('  ⛔ ' + nichtGelaufen.length + ' Prüfer konnten gar nicht laufen:');
  nichtGelaufen.forEach(e => console.log('     ' + e.rel + '  ' + e.letzte.slice(0, 60)));
}
process.exit(nichtGelaufen.length ? 1 : 0);
