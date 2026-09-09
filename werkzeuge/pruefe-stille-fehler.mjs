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

/* ---------- 1b. Der ZWEITE Weg, einen Fehler zu schlucken ----------

   ⛔ Am 09.09.2026 nachgetragen, nachdem Punkt 1 fertig schien: `catch {}` ist
   nur die eine Schreibweise. `promise.catch(() => {})` schluckt genauso — und
   davon gab es VIER, darunter der teuerste der ganzen App:

     js/init.js:  navigator.serviceWorker.register('sw.js').catch(()=>{})

   Scheitert die Anmeldung, hat die App keinen Offline-Betrieb und keinen Weg,
   sich zu erneuern. Sie ist dann ein Browser-Tab mit Internetzwang, und
   niemand erfaehrt es. Ein Pruefer, der nur eine Schreibweise kennt, meldet
   gruen und beweist nur die geprueften.
   [[gruener_pruefer_beweist_nur_geprueftes]] [[blickwinkel_durchprobieren]] */
const STILL_PROMISE = /\.catch\s*\(\s*(?:\(\s*[A-Za-z_$][\w$]*\s*\)|[A-Za-z_$][\w$]*|\(\s*\))\s*=>\s*(?:\{\s*\}|null|undefined|0|false)\s*\)/g;
let promiseOffen = 0;
for (const f of dateien) {
  const q = fs.readFileSync(path.join(JS, f), 'utf8');
  const rein = ohneKommentareUndTexte(q);
  let m; STILL_PROMISE.lastIndex = 0;
  while ((m = STILL_PROMISE.exec(rein))) {
    promiseOffen++;
    rot('js/' + f + ':' + zeileVon(q, m.index) + ': `.catch(() => {})` schluckt eine abgelehnte Zusage stumm — '
      + 'entweder `stillerFehler(...)` hineinschreiben oder einen Grund als Kommentar.');
  }
}
if (!promiseOffen) console.log('  ok   Keine abgelehnte Zusage wird stumm geschluckt.');

/* Stoertest fuer 1b: das Muster muss den bekannten Fall FINDEN. */
STILL_PROMISE.lastIndex = 0;
if (!STILL_PROMISE.test("register('sw.js').catch(()=>{});")) rot('Stoertest 1b wirkungslos: das Muster findet den bekannten Fall nicht.');
else {
  STILL_PROMISE.lastIndex = 0;
  if (STILL_PROMISE.test("register('sw.js').catch(e => melde(e));")) rot('Stoertest 1b wirkungslos: das Muster meldet auch einen echten Melder.');
  else console.log('  ok   Stoertest: findet `.catch(()=>{})`, schweigt bei `.catch(e => melde(e))`.');
}

/* ---------- 1c. Der DRITTE Weg: ein plausibler Rueckgabewert ----------

   ⛔⛔ Am 09.09.2026 nachgetragen. Punkt 1 und 1b suchen Bloecke, die NICHTS
   tun. Der gefaehrlichere Fall tut etwas — er gibt eine Zahl zurueck:

       function wortzahl(){
         try { return Object.keys(JSON.parse(localStorage.getItem(…))).length; }
         catch (e){ return 0; }        // <- kein leerer Block, trotzdem still
       }

   Diese Zahl stand in js/sync.js in der Erfolgsmeldung des Geraeteabgleichs:
   „12 Wörter, Stand aktualisiert". Wirft `localStorage` — und das kann es
   [[localstorage_kann_werfen]] —, las Elias dort „0 Wörter, Stand
   aktualisiert". Eine Erfolgsmeldung mit einer Null, die aussieht wie ein
   Messwert. [[vorgabewert_sieht_aus_wie_befund]]

   ⭐ Fuenf solche Stellen gab es am 09.09.2026 in js/, und KEINE davon faellt
   unter Punkt 1 oder 1b — beide Regeln waren gruen. Ein dritter Weg, den zwei
   Regeln nicht sehen: genau die Sorte Luecke, wegen der dieses Skript
   existiert. [[gruener_pruefer_beweist_nur_geprueftes]] [[blickwinkel_durchprobieren]]

   ⚠️ Der Massstab ist derselbe wie oben: ENTWEDER melden (`stillerFehler`)
   ODER einen Grund hinschreiben. Nicht „kein Rueckgabewert im catch" — den
   braucht es oft, und ein Verbot waere schlechter als der Fehler.

   ⚠️ Gesucht wird auf der kommentarfreien Maske, nachgesehen im Original an
   derselben Stelle — sonst zerlegt eine geschweifte Klammer im Kommentar das
   Rumpfmuster, und der Block faellt aus BEIDEN Toepfen. Derselbe Grund wie
   bei Punkt 1. */
const VORGABE_CATCH = /catch\s*(?:\([^)]*\))?\s*\{([^{}]{1,240})\}/g;
const PLAUSIBEL = /return\s+(?:0|''|""|\[\]|\{\}|null|false|true|-1|NaN)\s*;?\s*$/;
let vorgabeOffen = 0, vorgabeGesamt = 0;
for (const f of dateien) {
  const q = fs.readFileSync(path.join(JS, f), 'utf8');
  const rein = ohneKommentareUndTexte(q);
  let m; VORGABE_CATCH.lastIndex = 0;
  while ((m = VORGABE_CATCH.exec(rein))) {
    if (!PLAUSIBEL.test(m[1].trim())) continue;
    vorgabeGesamt++;
    /* meldet er? — auf der Maske, denn das ist Quelltext, kein Kommentar */
    if (/stillerFehler\s*\(/.test(m[1])) continue;
    /* traegt er einen Grund? — im ORIGINAL an derselben Stelle */
    const original = q.slice(m.index, m.index + m[0].length);
    const maske    = rein.slice(m.index, m.index + m[0].length);
    let kommentar = false;
    for (let i = 0; i < original.length; i++)
      if (original[i] !== maske[i] && original[i].trim()){ kommentar = true; break; }
    if (kommentar) continue;
    vorgabeOffen++;
    rot('js/' + f + ':' + zeileVon(q, m.index) + ': `catch` gibt einen plausiblen Wert zurueck ('
      + m[1].trim().slice(0, 40) + ') — der Ausfall sieht dann aus wie ein Messwert. '
      + 'Entweder `stillerFehler(...)` oder einen Grund als Kommentar.');
  }
}
if (!vorgabeOffen)
  console.log('  ok   ' + vorgabeGesamt + ' catch-Bloecke mit Vorgabewert melden oder begruenden ihn.');

/* Stoertest fuer 1c — an einem Fall, dessen Antwort feststeht. */
{
  const pruefe = (quelle) => {
    const rein = ohneKommentareUndTexte(quelle);
    VORGABE_CATCH.lastIndex = 0;
    const m = VORGABE_CATCH.exec(rein);
    if (!m || !PLAUSIBEL.test(m[1].trim())) return 'nicht gefunden';
    if (/stillerFehler\s*\(/.test(m[1])) return 'meldet';
    const o = quelle.slice(m.index, m.index + m[0].length);
    const k = rein.slice(m.index, m.index + m[0].length);
    for (let i = 0; i < o.length; i++) if (o[i] !== k[i] && o[i].trim()) return 'begruendet';
    return 'offen';
  };
  const roh    = pruefe('function f(){ try { a(); } catch (e){ return 0; } }');
  const meldet = pruefe('function f(){ try { a(); } catch (e){ stillerFehler("x", e); return 0; } }');
  const grund  = pruefe('function f(){ try { a(); } catch (e){ /* darf 0 sein */ return 0; } }');
  const echt   = pruefe('function f(){ try { a(); } catch (e){ return berechneErsatz(); } }');
  if (roh !== 'offen')          rot('Stoertest 1c wirkungslos: `return 0` ohne alles wird nicht gemeldet.');
  else if (meldet !== 'meldet') rot('Stoertest 1c wirkungslos: eine gemeldete Stelle gilt trotzdem als offen.');
  else if (grund !== 'begruendet') rot('Stoertest 1c wirkungslos: ein geschriebener Grund zaehlt nicht.');
  else if (echt !== 'nicht gefunden') rot('Stoertest 1c wirkungslos: ein echter Ersatzwert wird faelschlich gemeldet.');
  else console.log('  ok   Stoertest: findet `catch { return 0 }`, schweigt bei Meldung, Grund und echtem Ersatz.');
}

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
  ['einstellungen.js', 'Diagnose: Platzhalter weg',      'die nachgetragene Zeile faende ihren Platz nicht und bliebe ewig „(wird gefragt)"'],
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
