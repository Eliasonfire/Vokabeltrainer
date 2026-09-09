/* pruefe-schreibanlass.mjs — schreibt der Abgleich nur, wenn es einen Grund gibt?
 * ===========================================================================
 *
 * ⛔⛔ WOFÜR (09.09.2026)
 *
 * Cloudflare erlaubt im Gratistarif 1000 Schreibvorgänge am Tag, für das ganze
 * Konto. Am 08.09. war das Kontingent zweimal gerissen. Die Ursache war beide
 * Male dieselbe Sorte: ein Wert, der sich ohne Zutun ändert, galt als Grund zu
 * schreiben.
 *
 *   vt_lesestand   ändert sich bei JEDEM gerollten Vers    (behoben 08.09.)
 *   vt_zeit        ändert sich alle FÜNF SEKUNDEN          (behoben 09.09.)
 *
 * ⭐ Und der zweite Fall zeigte, dass die erste Reparatur nur halb griff: der
 * Lesestand stieß zwar keinen Abgleich mehr an, aber der TAKT rief `gleicheAb`
 * ohnehin alle 90 Sekunden, und DORT war er wieder ein Grund zu schreiben.
 * Eine stille Liste allein reicht also nicht — der Vergleich muss sie kennen.
 * [[zweiter_fix_deckt_ersten_zu]]
 *
 * ---------------------------------------------------------------------------
 * WIE HIER GEMESSEN WIRD
 *
 * Nicht nachgebaut, sondern AUSGESCHNITTEN: die Schlüssellisten, die Funktion
 * `nutzlastVergleich` und der Entscheidungsblock aus `gleicheAb` werden aus
 * js/sync.js selbst gelesen und ausgeführt. Ein nachgebauter Vergleich würde
 * seine eigene Fassung prüfen und immer bestehen.
 * [[testvorlage_selbst_nachgebaut]] [[pruefwerkzeug_mit_eingebauter_antwort]]
 *
 * ⚠️ Der Block wird bis zu SEINER schließenden Klammer gelesen, nicht bis zur
 * nächsten Fundstelle — daran ist test-p6.mjs schon einmal zerbrochen.
 *
 * Aufruf:  node werkzeuge/pruefe-schreibanlass.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const QUELLE = path.join(HIER, '..', 'js', 'sync.js');
const src = fs.readFileSync(QUELLE, 'utf8').replace(/\r\n/g, '\n');

let gut = 0, schlecht = 0;
function sag(bedingung, text){
  if (bedingung){ gut++; console.log('   ok    ' + text); }
  else { schlecht++; console.log('   ⛔ NEIN ' + text); }
}

/* ---------- Ausschneiden ---------- */

/** Liest ab `start` bis zur Klammer, die den dort geöffneten Block schließt. */
function blockAb(text, start, auf = '{', zu = '}'){
  const i = text.indexOf(auf, start);
  if (i < 0) return null;
  let tiefe = 0;
  for (let j = i; j < text.length; j++){
    if (text[j] === auf) tiefe++;
    else if (text[j] === zu){ tiefe--; if (!tiefe) return text.slice(start, j + 1); }
  }
  return null;
}

function schneide(name, muster, auf, zu){
  const m = src.match(muster);
  if (!m){ console.error('⛔ ' + name + ' nicht gefunden — hat sync.js einen neuen Aufbau?'); process.exit(1); }
  const stueck = blockAb(src, m.index, auf, zu);
  if (!stueck){ console.error('⛔ ' + name + ': Block nicht geschlossen.'); process.exit(1); }
  return stueck;
}

const listeAlle   = schneide('SYNC_SCHLUESSEL',        /const SYNC_SCHLUESSEL = \[/,        '[', ']');
const listeStill  = schneide('SYNC_STILLE_SCHLUESSEL', /const SYNC_STILLE_SCHLUESSEL = \[/, '[', ']');
const vergleichFn = schneide('nutzlastVergleich',      /function nutzlastVergleich\(/,      '{', '}');

/* Der Entscheidungsblock aus gleicheAb — von der ersten Zeile bis zur
   SYNC_OFFEN-Zuweisung. Beides sind eindeutige Zeilen; findet sich eine nicht,
   bricht der Prüfer ab, statt eine halbe Messung zu melden. */
const vonA = src.indexOf('const hier = baueNutzlast().daten;');
const bisA = src.indexOf('SYNC_OFFEN = false;', vonA);
if (vonA < 0 || bisA < 0){
  console.error('⛔ Der Entscheidungsblock in gleicheAb() ist nicht mehr auffindbar.');
  process.exit(1);
}
const entscheidung = src.slice(vonA, bisA + 'SYNC_OFFEN = false;'.length);

/* ---------- Die Bühne ---------- */

/** Führt den echten Entscheidungsblock aus und meldet, was er getan hat.
 *  @param stilleListe  überschreibt SYNC_STILLE_SCHLUESSEL (für den Störtest) */
async function lauf(hier, dort, stilleListe){
  const code = `
    ${listeAlle}
    ${stilleListe ? 'const SYNC_STILLE_SCHLUESSEL = ' + JSON.stringify(stilleListe) + ';' : listeStill}
    ${vergleichFn}
    return (async function(){
      let SYNC_OFFEN = true;
      let puts = 0;
      const still = true;
      const fern = FERN;
      const baueNutzlast = () => ({ daten: HIER });
      const schickeZumServer = async () => { puts++; return {}; };
      ${entscheidung}
      return { puts, offen: SYNC_OFFEN };
    })();`;
  /* ⚠️ `new Function` statt vm: im vm-Kontext sind `const`-Deklarationen von
     außen unsichtbar — das hat schon einmal eine leere Messung erzeugt.
     [[const_ist_im_vm_kontext_unsichtbar]] */
  /* ⛔ Die ferne Seite kommt in IHRER HÜLLE, nicht roh: der Block liest
     `fern.daten`. Zuerst wurde hier das nackte Objekt uebergeben — dann war
     `dort` immer leer, jeder Fall meldete einen Schreibvorgang, und der Fall
     "eine Karte wurde beantwortet" bestand trotzdem: aus dem falschen Grund.
     Ein Testaufbau, der die echte Form verfehlt, prueft nichts.
     [[testvorlage_selbst_nachgebaut]] */
  return new Function('HIER', 'FERN', code)(hier, { daten: dort });
}

/* ---------- Die Fälle ---------- */

const GRUND = { vt_progress: '{"45751":{"correct":3}}', vt_settings: '{"a":1}' };
const mit = (zusatz) => Object.assign({}, GRUND, zusatz);

console.log('Schreibanlass — was löst einen Cloudflare-Schreibvorgang aus?\n');

const stillDrin = /'vt_zeit'/.test(listeStill);
sag(stillDrin, "vt_zeit steht in SYNC_STILLE_SCHLUESSEL");
sag(/'vt_lesestand'/.test(listeStill), "vt_lesestand steht weiter darin");
sag(/'vt_zeit'/.test(listeAlle), 'vt_zeit wird trotzdem abgeglichen (steht in SYNC_SCHLUESSEL)');

const faelle = [
  ['beide Seiten gleich',
    mit({ vt_zeit: '{"2026-09-09":100}' }), mit({ vt_zeit: '{"2026-09-09":100}' }),
    { puts: 0, offen: false }],

  ['NUR die gemessene Zeit ist weiter',
    mit({ vt_zeit: '{"2026-09-09":300}' }), mit({ vt_zeit: '{"2026-09-09":100}' }),
    { puts: 0, offen: true }],

  ['NUR der Lesestand ist weiter',
    mit({ vt_lesestand: '67:12' }), mit({ vt_lesestand: '67:3' }),
    { puts: 0, offen: true }],

  ['eine Karte wurde beantwortet',
    mit({ vt_progress: '{"45751":{"correct":4}}' }), mit({}),
    { puts: 1, offen: false }],

  ['Karte UND Zeit — ein einziger Vorgang, die Zeit fährt mit',
    mit({ vt_progress: '{"45751":{"correct":4}}', vt_zeit: '{"2026-09-09":300}' }),
    mit({ vt_zeit: '{"2026-09-09":100}' }),
    { puts: 1, offen: false }],

  ['die ferne Seite kennt vt_zeit noch gar nicht',
    mit({ vt_zeit: '{"2026-09-09":100}' }), mit({}),
    { puts: 0, offen: true }],
];

for (const [name, hier, dort, erwartet] of faelle){
  const r = await lauf(hier, dort, null);
  sag(r.puts === erwartet.puts && r.offen === erwartet.offen,
    name.padEnd(52) + ' → ' + r.puts + ' Schreibvorgang' + (r.puts === 1 ? '' : 'e')
    + ', offen=' + r.offen + '   (erwartet ' + erwartet.puts + '/' + erwartet.offen + ')');
}

/* ---------- Reihenfolge: der Vergleich darf nicht daran hängen ---------- */
console.log('');
const a = { vt_progress: 'x', vt_settings: 'y' };
const b = { vt_settings: 'y', vt_progress: 'x' };   /* dieselben Werte, andere Reihenfolge */
sag((await lauf(a, b, null)).puts === 0,
  'gleiche Werte in anderer Schlüsselreihenfolge lösen nichts aus');
sag(JSON.stringify(a) !== JSON.stringify(b),
  '  (und genau dieser Fall wäre mit JSON.stringify ein Schreibvorgang gewesen)');

/* ---------- Störtest ---------- */
console.log('');
const ohneZeit = await lauf(mit({ vt_zeit: '{"2026-09-09":300}' }),
                      mit({ vt_zeit: '{"2026-09-09":100}' }),
                      ['vt_lesestand']);          /* vt_zeit absichtlich entfernt */
sag(ohneZeit.puts === 1,
  'Störtest: ohne vt_zeit in der stillen Liste wird wieder geschrieben ('
  + ohneZeit.puts + ' Vorgang) — die Prüfung oben kann also scheitern');

const ohneStilleGanz = await lauf(mit({ vt_lesestand: '67:12' }), mit({ vt_lesestand: '67:3' }), []);
sag(ohneStilleGanz.puts === 1,
  'Störtest: mit leerer stiller Liste schreibt auch der Lesestand wieder');

/* ---------- Die Rechnung, die den Fall erst sichtbar gemacht hat ---------- */
console.log('');
const TAKT_MS = (() => {
  const z = fs.readFileSync(path.join(HIER, '..', 'js', 'zeitmessung.js'), 'utf8');
  const m = z.match(/const ZEIT_TAKT_MS\s*=\s*(\d+)/);
  return m ? Number(m[1]) : null;
})();
const ABSTAND = (() => { const m = src.match(/const SYNC_MINDESTABSTAND = (\d+) \* 1000/); return m ? Number(m[1]) : null; })();
const BUDGET  = (() => { const m = src.match(/const SYNC_TAGESBUDGET\s*=\s*(\d+)/);        return m ? Number(m[1]) : null; })();
sag(TAKT_MS !== null && ABSTAND !== null && BUDGET !== null,
  'die drei Zahlen sind aus den Quellen gelesen, nicht eingetippt: Zeittakt '
  + TAKT_MS + ' ms, Mindestabstand ' + ABSTAND + ' s, Tagesbudget ' + BUDGET);
if (TAKT_MS && ABSTAND && BUDGET){
  const proStunde = Math.floor(3600 / ABSTAND);
  console.log('          ohne diese Bremse: bis zu ' + proStunde + ' Schreibvorgänge je Stunde und Gerät,');
  console.log('          das Tagesbudget von ' + BUDGET + ' wäre nach ' + (BUDGET / proStunde).toFixed(1)
    + ' Stunden offener App leer — bei drei Geräten ' + (BUDGET * 3) + ' von 1000 des Kontos.');
}

console.log('\n' + gut + ' richtig, ' + schlecht + ' falsch.');
process.exit(schlecht ? 1 : 0);
