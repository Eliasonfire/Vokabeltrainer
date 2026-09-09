/* pruefe-stille-fehler.mjs — kein `catch` darf schweigen, ohne dass jemand
   aufgeschrieben hat, WARUM.

   ⛔⛔ DER ANLASS: „habe eben 5 wörter angehört und konfeti kam erst bei
   startseite, das soll aber doch kommen beim hörmodus" (Elias, 08.09.2026).
   Der Fehler sass in einem leeren `catch {}` und war auf seinem Geraet nicht
   auffindbar — im Pruefbrowser lief alles. [[ausfall_ist_unsichtbar_gebaut]]

   ⭐ Was hier geprueft wird, ist nicht „keine leeren catch-Bloecke". Die
   braucht es: `localStorage.setItem` wirft im privaten Fenster, und ein
   Absturz dort waere schlimmer als der geschluckte Fehler. Geprueft wird,
   dass jeder von ihnen ENTWEDER eine geschriebene Begruendung traegt ODER
   ueber `stillerFehler()` in der Diagnosekarte auftaucht.

   ⭐ Die Trennlinie, in einem Satz: steht im `try` eine BROWSER-SCHNITTSTELLE,
   die bekanntermassen wirft, reicht die Begruendung. Steht dort EIGENE LOGIK,
   gehoert der Fehler gemeldet — sonst faellt still Funktion aus.

   ⚠️ Gemessen wird auf KOMMENTARFREIEM Quelltext. Die erste Zaehlung dieser
   Bloecke meldete „37, darunter feier.js 1" — der Treffer in feier.js sass in
   einem Kommentar, der genau dieses Problem beschreibt.
   [[stichworttreffer_im_kommentar]] */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ohneKommentareUndTexte, zeileVon } from './js-quelltext.mjs';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const JS = path.join(WURZEL, 'js');

const LEER = /catch\s*(\([^)]*\))?\s*\{\s*\}/g;

let fehler = 0;
const rot  = (t) => { fehler++; console.log('  ROT  ' + t); };

/* ---------- 1. Jeder leere catch-Block braucht seine Begruendung ----------

   ⭐ Gezaehlt wird auf dem KOMMENTARFREIEN Text, nachgesehen wird im
   ORIGINAL — an derselben Stelle, denn `ohneKommentareUndTexte()` ersetzt
   laengengleich.

   ⚠️ Der naheliegende Weg — ein zweiter Regex ueber das Original mit dem
   Rumpfmuster `[^{}]*` — hat hier NICHT getragen. In js/kern.js steht ein
   Block, dessen Kommentar selbst geschweifte Klammern enthaelt („dann gilt"
   plus das leere Objekt). Das Rumpfmuster findet ihn dann gar nicht mehr; er
   faellt aus BEIDEN Toepfen und sieht dabei aus wie „begruendet".
   [[gruener_pruefer_beweist_nur_geprueftes]] */
function leereStellen(quelle) {
  const rein = ohneKommentareUndTexte(quelle);
  const stellen = [];
  let m; LEER.lastIndex = 0;                /* [[regexp_g_merkt_sich_lastindex]] */
  while ((m = LEER.exec(rein))) {
    const roh  = quelle.slice(m.index, m.index + m[0].length);
    const auf  = roh.indexOf('{');
    const rumpf = roh.slice(auf + 1, roh.length - 1);
    stellen.push({ zeile: zeileVon(quelle, m.index), begruendet: !!rumpf.trim() });
  }
  return stellen;
}
function ohneBegruendung(quelle) {
  return leereStellen(quelle).filter(s => !s.begruendet).map(s => s.zeile);
}

const dateien = fs.readdirSync(JS).filter(f => f.endsWith('.js')).sort();
let leerGesamt = 0, begruendet = 0;
for (const f of dateien) {
  const q = fs.readFileSync(path.join(JS, f), 'utf8');
  const stellen = leereStellen(q);
  const offen = stellen.filter(s => !s.begruendet).map(s => s.zeile);
  leerGesamt += stellen.length;
  begruendet += stellen.length - offen.length;
  if (offen.length) rot('js/' + f + ': ' + offen.length + ' catch-Block(e) ohne ein Wort dazu — Zeile ' + offen.join(', '));
}
console.log('  ok   ' + begruendet + ' von ' + leerGesamt + ' schweigenden catch-Bloecken tragen ihre Begruendung.');

/* ---------- 2. Das Protokoll selbst muss vorhanden und verdrahtet sein ----------
   ⛔ Ein Melder ohne Anzeige ist genau der Ausfall, den er verhindern soll.
   [[werkzeug_ohne_aufrufer]] */
const kern = fs.readFileSync(path.join(JS, 'kern.js'), 'utf8');
if (!/function\s+stillerFehler\s*\(/.test(kern)) rot('js/kern.js: stillerFehler() fehlt.');
if (!/function\s+stilleFehlerZeilen\s*\(/.test(kern)) rot('js/kern.js: stilleFehlerZeilen() fehlt.');

/* ⛔ Das Protokoll darf NICHT in localStorage wandern: jedes LS.set meldet dem
   Geraeteabgleich eine Aenderung, und ein haeufiger Fehler schriebe dann im
   Sekundentakt nach Cloudflare. Am 09.09.2026 hat ein Sekundenzaehler auf
   genau diesem Weg 750 von 1000 Schreibvorgaengen verbraucht. */
const koerper = kern.slice(kern.indexOf('function stillerFehler'), kern.indexOf('const LS = {'));
if (/localStorage|LS\.set/.test(koerper))
  rot('js/kern.js: stillerFehler() fasst den Speicher an — das Protokoll wuerde den Geraeteabgleich anstossen.');
else console.log('  ok   stillerFehler() schreibt nur in den Arbeitsspeicher.');

const einst = fs.readFileSync(path.join(JS, 'einstellungen.js'), 'utf8');
if (!/stilleFehlerZeilen\s*\(/.test(einst))
  rot('js/einstellungen.js: die Diagnosekarte zeigt das Ringprotokoll nicht an.');
else console.log('  ok   Die Diagnosekarte zeigt die geschluckten Fehler.');

/* ---------- 3. Wo eigene Logik im try steht, muss gemeldet werden ----------
   Die Liste ist eine PFLICHTliste, keine Vollstaendigkeitsbehauptung: diese
   Stellen sind einzeln durchgesehen worden, und keine darf still zurueckfallen.
   ⭐ Jede traegt ihren Grund — ohne den ist eine Liste nur eine Behauptung.
   [[regel_gilt_nur_mit_begruendung]] */
const PFLICHT = [
  ['einstellungen.js', 'Diagnose: Version lesen',        'sonst steht in der Karte ewig „(wird geladen)"'],
  ['einstellungen.js', 'Diagnose: Feier-Protokoll',      'sonst zeigt die Karte „(noch keine)" — ein Befund statt eines Ausfalls'],
  ['einstellungen.js', 'Diagnose: Geh-Protokoll',        'sonst zeigt die Karte „(nicht gelaufen)"'],
  ['einstellungen.js', 'Aktualisieren: ',                'eine Datei bleibt alt, der Knopf meldet trotzdem fertig'],
  ['hoeren.js',        'Hoeren: Sperrbildschirm',        'die drei Tasten sind dann nie angemeldet worden'],
  ['hoeren.js',        'Geh-Protokoll schreiben',        'das Messwerkzeug selbst; sein Ausfall verfaelscht jede spaetere Messung'],
  ['quran-audio.js',   'Quran-Ton: Geh-Modus',           'sonst laufen zwei Stimmen gleichzeitig'],
  ['quran-audio.js',   'Quran-Ton: stille',              'ohne die stille Schleife bricht die Rezitation beim Bildschirm-Aus ab'],
  ['quran-audio.js',   'Quran-Ton: Sperrbildschirm',     'der Sperrbildschirm bliebe bei der vorigen Sure stehen'],
  ['sync.js',          'Abgleich: Stempelkarte',         'stiller Datenverlust: das aeltere Geraet gewinnt'],
];
const zwischen = new Map();
let pflichtFehlt = 0;
for (const [datei, marke, grund] of PFLICHT) {
  if (!zwischen.has(datei)) zwischen.set(datei, fs.readFileSync(path.join(JS, datei), 'utf8'));
  const q = zwischen.get(datei);
  if (!q.includes("stillerFehler('" + marke)) { pflichtFehlt++; rot('js/' + datei + ': Meldung „' + marke + '…" fehlt — ' + grund); }
}
/* ⚠️ Eigener Zaehler, nicht `fehler`: haengt die Meldung an der Gesamtzahl,
   verschwindet sie, sobald IRGENDWO anders etwas rot ist — und dann sieht es
   aus, als waere dieser Teil gar nicht gelaufen. */
if (!pflichtFehlt) console.log('  ok   Alle ' + PFLICHT.length + ' Pflichtmeldungen stehen.');

/* ---------- 4. Stoertest: kann diese Pruefung ueberhaupt rot werden? ----------
   [[stoertest_muss_wirkung_nachweisen]] */
const probeLeer = ohneBegruendung('function f(){ try { a(); } catch (e){ } }');
const probeGut  = ohneBegruendung('function f(){ try { a(); } catch (e){ /* Grund */ } }');
if (probeLeer.length !== 1) rot('Stoertest 1 wirkungslos: ein unbegruendeter Block wird nicht gefunden.');
if (probeGut.length !== 0)  rot('Stoertest 2 wirkungslos: ein begruendeter Block wird faelschlich gemeldet.');
if (probeLeer.length === 1 && probeGut.length === 0)
  console.log('  ok   Stoertests: findet den unbegruendeten Block, schweigt beim begruendeten.');

console.log(fehler ? '\n⛔ ' + fehler + ' Befund(e).' : '\n✅ Kein catch-Block schweigt unbegruendet.');
process.exit(fehler ? 1 : 0);
