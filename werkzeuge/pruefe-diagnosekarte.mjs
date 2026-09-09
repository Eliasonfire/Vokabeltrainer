#!/usr/bin/env node
/* pruefe-diagnosekarte.mjs — hält die Karte, die alles andere meldet?
 *
 * ⛔⛔ WARUM (09.09.2026)
 *
 * Seit dieser Nacht laeuft die ganze Fehlermeldung der App ueber die
 * Diagnosekarte: geschluckte Fehler, der Offline-Vorrat, abgelehnte
 * Eselsbruecken, die Kopfzeilenmasse. Sie ist der einzige Weg, auf dem Elias'
 * Geraet uns etwas sagen kann.
 *
 * ⭐ Und sie fragt JEDE ihrer Quellen mit `typeof x === 'function'` ab. Das ist
 * richtig — faellt ein Modul aus, soll nicht die ganze Karte leer bleiben. Es
 * heisst aber auch: **wird eine dieser Funktionen umbenannt, steht dort still
 * ein Strich.** Das Messwerkzeug faellt aus, und der Ausfall sieht aus wie
 * „nichts zu melden". [[ausfall_ist_unsichtbar_gebaut]] [[leere_liste_ist_keine_messung]]
 *
 * ⛔ ALS DATEI, nicht als Einzeiler: `node -e` durch die Shell hat in dieser
 * Nacht DREIMAL einen Regex zerlegt. Beim dritten Mal meldete er „die Karte
 * fragt 0 Funktionen ab" — also ein gruenes Ergebnis fuer eine Messung, die
 * gar nicht stattfand. [[python_backslash_b_wird_backspace]]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ohneKommentareUndTexte } from './js-quelltext.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const JS = path.join(REPO, 'js');

const E = fs.readFileSync(path.join(JS, 'einstellungen.js'), 'utf8');
const von = E.indexOf('function diagnoseText()');
if (von < 0) { console.log('⛔ diagnoseText() nicht gefunden — hat die Datei einen neuen Aufbau?'); process.exit(1); }
const bis = E.indexOf("getElementById('btnDiagnose')", von);
if (bis < 0) { console.log('⛔ Das Ende der Karte ist nicht auffindbar.'); process.exit(1); }
/* ⛔ Zeichenketten BLEIBEN stehen: gesucht wird der typeof-Riegel, und sein
   Wort "function" steht in Anfuehrungszeichen — ein Stripper, der die leert,
   findet null Treffer und meldet gruen. Nur die Kommentare muessen weg. */
const karte = ohneKommentareUndTexte(E.slice(von, bis), { texte: false });

/* Alles, was die Karte per typeof-Riegel abfragt. */
const namen = [...new Set([...karte.matchAll(/typeof\s+([A-Za-zÄÖÜäöü_$][\w$]*)\s*===?\s*['"]function['"]/g)].map(m => m[1]))].sort();

let quelle = '';
for (const f of fs.readdirSync(JS).filter(x => x.endsWith('.js')))
  quelle += ohneKommentareUndTexte(fs.readFileSync(path.join(JS, f), 'utf8')) + '\n';

const definiert = (n) => {
  const e = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp('function\\s+' + e + '\\s*\\(').test(quelle)
      || new RegExp('(?:const|let|var)\\s+' + e + '\\s*=').test(quelle);
};

/* ⛔ EICHUNG ZUERST. Findet die Suche gar nichts, meldet sie „alles in
   Ordnung" — und das ist der Fehler, den diese Datei selbst beschreibt.
   [[leere_liste_ist_keine_messung]] */
if (namen.length < 5) {
  console.log('⛔ EICHUNG GESCHEITERT: nur ' + namen.length + ' typeof-Riegel in der Karte gefunden.');
  console.log('   Am 09.09.2026 waren es zehn. Entweder wurde die Karte umgebaut,');
  console.log('   oder dieses Werkzeug misst nichts — beides gehoert angesehen.');
  process.exit(1);
}
if (definiert('gibtEsGarNichtXyz')) {
  console.log('⛔ EICHUNG GESCHEITERT: ein erfundener Name gilt als definiert.');
  process.exit(1);
}

console.log('Die Diagnosekarte fragt ' + namen.length + ' Funktionen ueber einen typeof-Riegel ab.\n');
let fehlen = 0;
let zuLang = 0;      /* zweite Ursache, eigener Zaehler — siehe ganz unten */
let ersatzRot = 0;   /* dritte: das Nachtragen einer Zeile */
for (const n of namen) {
  const da = definiert(n);
  if (!da) fehlen++;
  console.log('  ' + (da ? 'ok  ' : '⛔  ') + n + (da ? '' : '   — der Riegel greift, und in der Karte steht still ein Strich'));
}

/* ---------- ⛔ Stoertest: haengt die Zaehlung am echten Text? ----------
   Eine Eichung sagt „ich messe ueberhaupt etwas". Ein Stoertest sagt
   zusaetzlich, dass die Zahl vom geprueften TEXT abhaengt und nicht von
   irgendwoher. [[stoertest_muss_wirkung_nachweisen]] */
{
  const einerWeg = karte.replace(/typeof\s+stilleFehlerZeilen\s*===?\s*['"]function['"]/, 'typeof x === "irgendwas"');
  const nachher = new Set([...einerWeg.matchAll(/typeof\s+([A-Za-zÄÖÜäöü_$][\w$]*)\s*===?\s*['"]function['"]/g)].map(m => m[1]));
  const ok = nachher.size === namen.length - 1 && !nachher.has('stilleFehlerZeilen');
  console.log('');
  console.log('  ' + (ok ? 'ok  ' : '⛔  ') + 'Stoertest: faellt ein Riegel weg, sinkt die Zahl um genau eins'
    + (ok ? '' : ' — die Zaehlung haengt NICHT am Text (' + nachher.size + ' statt ' + (namen.length - 1) + ')'));
  if (!ok) fehlen++;
}

/* ---------- Passt die Karte noch auf ein Bildschirmfoto? ----------

   ⛔⛔ Sie ist Elias' einziger Kanal: er fotografiert sie. Bei 375 px Breite
   belegt sie 674 von 812 px — knapp, gemessen am 09.09.2026. Das
   Ringprotokoll der geschluckten Fehler fasst bis zu 30 Eintraege, und die
   stehen ganz UNTEN. Kaemen sie alle, waere die Karte doppelt so lang wie der
   Bildschirm — ausgerechnet dann, wenn sie am meisten zu sagen hat.

   ⚠️ Geprueft wird nicht, ob die Begrenzung im Quelltext STEHT, sondern was
   sie TUT: die Funktion wird aus js/einstellungen.js geschnitten und
   aufgerufen. [[zusicherung_im_kommentar_ist_keine_pruefung]]
   [[testvorlage_selbst_nachgebaut]] */
{
  const a = karte.indexOf('const KARTE_FEHLER_MAX');
  let kappen = null;
  if (a >= 0){
    let tiefe = 0, ende = -1;
    for (let i = karte.indexOf('{', karte.indexOf('function stilleFehlerFuerKarte', a)); i < karte.length; i++){
      if (karte[i] === '{') tiefe++;
      else if (karte[i] === '}'){ tiefe--; if (!tiefe){ ende = i; break; } }
    }
    if (ende > 0){
      try { kappen = new Function(karte.slice(a, ende + 1) + '\n;return stilleFehlerFuerKarte;')(); }
      catch (e){ /* faellt unten als „fehlt" auf */ }
    }
  }
  if (typeof kappen !== 'function'){
    zuLang++;
    console.log('  ⛔  stilleFehlerFuerKarte() fehlt — die Karte kann auf 30+ Zeilen wachsen');
    console.log('      und passt dann auf kein Bildschirmfoto mehr.');
  } else {
    const viele = Array.from({ length: 30 }, (_, i) => '  Fehler ' + i);
    const kurz  = kappen(viele);
    const wenig = kappen(['  a', '  b']);
    const leer  = kappen([]);
    const proben = [
      ['30 Eintraege werden gekappt',        kurz.length <= 8],
      ['und die Restzahl steht dabei',       /und 24 weitere/.test(kurz.join('\n'))],
      ['die neuesten bleiben stehen',        kurz[0] === '  Fehler 0'],
      ['wenige bleiben unveraendert',        wenig.length === 2 && wenig[1] === '  b'],
      ['leer bleibt leer',                   leer.length === 0],
    ];
    for (const [was, ok] of proben){
      if (!ok) zuLang++;
      console.log('  ' + (ok ? 'ok  ' : '⛔  ') + was);
    }
  }
}

/* ---------- Wird eine Zeile SICHER nachgetragen? ----------

   ⛔⛔ Zwei Angaben der Karte kommen asynchron (die Fassung aus caches.keys(),
   der Offline-Vorrat vom Service Worker) und ersetzen einen Platzhalter.
   `String.replace` liest im ERSATZ Sonderzeichen: `$&`, `$'`, `` $` ``, `$1`.
   Ein einziges `$'` in einer Fehlermeldung fuegt den ganzen Rest der Karte ein
   zweites Mal ein — auf dem einzigen Bildschirmfoto, das Elias schickt, und
   ausgerechnet im Fehlerfall. Die Funktionsform ist dicht.
   [[replace_dollar_ist_sonderzeichen]] */
{
  /* ⚠️ `trageNach()` steht VOR diagnoseText() und damit ausserhalb des
     Kartenausschnitts — deshalb zwei Blickwinkel: im Ausschnitt darf gar nicht
     mehr direkt ersetzt werden, in der ganzen Datei muss die eine Stelle die
     Funktionsform benutzen. [[blickwinkel_durchprobieren]] */
  const roh = [...ohneKommentareUndTexte(E, { texte: false })
    .matchAll(/textContent\s*\.replace\s*\(/g)];
  const imAusschnitt = [...karte.matchAll(/textContent\s*\.replace\s*\(/g)].length;
  const funktionsform = /textContent\s*\.replace\s*\([^,]*,\s*\(\s*\)\s*=>/
    .test(ohneKommentareUndTexte(E, { texte: false }));
  const hatHelfer = /function\s+trageNach\s*\(/.test(E);

  if (!hatHelfer || !roh.length){
    ersatzRot++;
    console.log('  ⛔  trageNach() fehlt — die asynchronen Zeilen der Karte blieben');
    console.log('      auf „(wird geladen)" stehen.');
  } else if (imAusschnitt){
    ersatzRot++;
    console.log('  ⛔  die Karte ersetzt an ' + imAusschnitt + ' Stelle(n) selbst im Text,'
      + ' statt ueber trageNach() zu gehen.');
  } else if (roh.length > 1 || !funktionsform){
    ersatzRot++;
    console.log('  ⛔  ' + roh.length + ' Ersetzung(en) im Kartentext, nicht alle in'
      + ' Funktionsform — ein „$\'" in einer Fehlermeldung verdoppelt die Karte.');
  } else {
    console.log('  ok  die nachgetragene Zeile geht durch EINE Stelle, in Funktionsform');
  }
}

console.log('');
/* ⚠️ Zwei Ursachen, zwei Zaehler — sonst steht am Ende „2 Funktion(en) gibt es
   nicht mehr" ueber einer zu langen Karte, und man sucht an der falschen
   Stelle. [[kennzeichen_mit_zwei_ursachen]] [[widerspruch_liegt_in_der_beschriftung]] */
if (fehlen) {
  console.log('⛔ ' + fehlen + ' Funktion(en) gibt es nicht mehr. Die Karte meldet dann NICHTS,');
  console.log('   und das sieht aus wie „nichts zu melden".');
}
if (zuLang) {
  console.log('⛔ ' + zuLang + ' Probe(n) zur Laenge gescheitert: die Karte kann laenger werden');
  console.log('   als ein Bildschirmfoto. Sie ist Elias’ einziger Kanal — was unten');
  console.log('   herausfaellt, sieht niemand.');
}
if (ersatzRot) {
  console.log('⛔ Das Nachtragen einer Kartenzeile ist nicht mehr sicher. Ein „$\'" in');
  console.log('   einer Fehlermeldung fuegt den Rest der Karte ein zweites Mal ein —');
  console.log('   auf dem einen Bildschirmfoto, das er schickt.');
}
if (fehlen || zuLang || ersatzRot) process.exit(1);
console.log('✅ Jede Quelle der Diagnosekarte existiert, und sie passt auf ein Bild.');
process.exit(0);
