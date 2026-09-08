/* Faellt die Hoer-Tagesziel-Feier aus, wenn das Ziel im GEH-MODUS faellt?
 *
 * ⛔ Die Funktion wird aus js/hoeren.js HERAUSGESCHNITTEN und im vm gefahren —
 *    nicht nachgebaut. Ein nachgebauter Pruefling besteht jeden Test, weil er
 *    den Fehler gar nicht enthaelt. [[testvorlage_selbst_nachgebaut]]
 */
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

/* ⛔ fileURLToPath, nicht .pathname: der Pfad enthaelt ein Leerzeichen und
   steht in einer URL als %20 — fs findet 'G:\1.%20Workspace' nie.
   [[adresse_nie_normalisieren]] */
const QUELLE = fileURLToPath(new URL('../js/hoeren.js', import.meta.url));
const src = fs.readFileSync(QUELLE, 'utf8');

/* Die Funktion samt Kommentaren bis zur schliessenden Klammer am Zeilenanfang. */
const m = src.match(/\nfunction hoerZielPruefen\(\)\{[\s\S]*?\n\}\n/);
if (!m){ console.log('X  hoerZielPruefen() nicht gefunden'); process.exit(1); }

let fehler = 0;
const pruefe = (was, erwartet, ist) => {
  const ok = JSON.stringify(erwartet) === JSON.stringify(ist);
  if (!ok) fehler++;
  console.log('  ' + (ok ? 'ok ' : 'X  ') + was.padEnd(52)
    + (ok ? '' : 'erwartet ' + JSON.stringify(erwartet) + ', ist ' + JSON.stringify(ist)));
};

/* Ein Lauf: Zaehlerstand, Ziel, Geh-Modus an? -> wurde gefeiert, steht etwas offen? */
function lauf(gesamt, ziel, gehAn, zielOffenVorher){
  const feiern = [];
  const ctx = {
    hoerTag: () => ({ tag: 'x', gesamt, richtig: gesamt }),
    hoerTagesziel: () => ziel,
    GEH: { an: gehAn },
    HOER: { zielOffen: !!zielOffenVorher },
    feiere: (a, d) => feiern.push([a, d.zahl]),
  };
  vm.createContext(ctx);
  vm.runInContext(m[0] + '\nthis.RUF = hoerZielPruefen;', ctx);
  ctx.RUF();
  return { gefeiert: feiern.length, offen: ctx.HOER.zielOffen };
}

console.log('Der neue Weg:');
pruefe('Ziel nicht erreicht -> nichts',            { gefeiert: 0, offen: false }, lauf(4, 5, false, false));
pruefe('Ziel erreicht, am Bildschirm -> Feier',    { gefeiert: 1, offen: false }, lauf(5, 5, false, false));
pruefe('Ziel im Geh-Modus -> aufgeschoben',        { gefeiert: 0, offen: true  }, lauf(5, 5, true,  false));
pruefe('danach Geh-Modus aus -> nachgeholt',       { gefeiert: 1, offen: false }, lauf(5, 5, false, true));
pruefe('weit ueber dem Ziel -> feiert trotzdem',   { gefeiert: 1, offen: false }, lauf(30, 5, false, false));

/* ---------- Der Stoertest: haette die ALTE Fassung das gemerkt? ----------
   ⛔ Ohne diesen Teil beweist die gruene Liste oben nur, dass die neue
      Funktion tut, was sie tut — nicht, dass der Fehler je bestand.
      [[stoertest_muss_wirkung_nachweisen]] */
console.log('\nDie alte Fassung am selben Ablauf (Uebergang statt Zustand):');
const altFeiern = [];
const alt = (vorher, nachher, ziel) => {
  if (vorher < ziel && nachher >= ziel) altFeiern.push(nachher);
};
/* Der echte Ablauf: fuenf Woerter im Geh-Modus (die alte Fassung rief dort
   gar nichts auf), dann eine getippte Antwort. */
alt(5, 6, 5);                      /* die erste getippte Antwort NACH dem Laufen */
pruefe('alte Fassung feiert nach dem Geh-Modus nie', 0, altFeiern.length);
if (altFeiern.length){ console.log('  ⚠️ Stoertest wirkungslos — der Fehler laesst sich so nicht zeigen.'); fehler++; }

/* Und die Gegenprobe zum Stoertest selbst: am Bildschirm feuerte sie sehr wohl. */
const altFeiern2 = [];
const alt2 = (v, n, z) => { if (v < z && n >= z) altFeiern2.push(n); };
alt2(4, 5, 5);
pruefe('alte Fassung feuerte am Bildschirm (Eichung)', 1, altFeiern2.length);

console.log('\n' + (fehler ? 'FEHLER: ' + fehler : 'Das Hoer-Tagesziel feiert auf allen drei Wegen'));
process.exit(fehler ? 1 : 0);
