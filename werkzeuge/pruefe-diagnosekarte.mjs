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

console.log('');
if (fehlen) {
  console.log('⛔ ' + fehlen + ' Funktion(en) gibt es nicht mehr. Die Karte meldet dann NICHTS,');
  console.log('   und das sieht aus wie „nichts zu melden".');
  process.exit(1);
}
console.log('✅ Jede Quelle der Diagnosekarte existiert.');
process.exit(0);
