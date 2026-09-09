/* Faellt die Hoer-Tagesziel-Feier aus, wenn das Ziel im GEH-MODUS faellt —
 * und faellt sie auch aus, wenn gerade NIEMAND HINSIEHT?
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

/* Ein Lauf. Die beiden letzten Schalter bilden die Umgebung nach:
 *   `imHoermodus` — traegt `#screen-hoeren` die Klasse `active`?
 *   `sichtbar`    — `document.visibilityState` (Display aus / App im Hintergrund)
 *
 * ⚠️ Das ist ein DOM-Doppel, kein DOM. Es darf nur so viel koennen, wie die
 *    Funktion fragt — sonst prueft der Test das Doppel und nicht die Sache.
 *    [[pruefung_fragt_einen_stellvertreter_ab]] */
function lauf(gesamt, ziel, gehAn, zielOffenVorher, imHoermodus = true, sichtbar = true){
  const feiern = [];
  const ctx = {
    hoerTag: () => ({ tag: 'x', gesamt, richtig: gesamt }),
    hoerTagesziel: () => ziel,
    GEH: { an: gehAn },
    HOER: { zielOffen: !!zielOffenVorher },
    feiere: (a, d) => feiern.push([a, d.zahl]),
    document: {
      visibilityState: sichtbar ? 'visible' : 'hidden',
      getElementById: (id) => id === 'screen-hoeren'
        ? { classList: { contains: (k) => k === 'active' && imHoermodus } }
        : null
    }
  };
  vm.createContext(ctx);
  vm.runInContext(m[0] + '\nthis.RUF = hoerZielPruefen;', ctx);
  ctx.RUF();
  return { gefeiert: feiern.length, offen: ctx.HOER.zielOffen };
}

console.log('Der Geh-Modus:');
pruefe('Ziel nicht erreicht -> nichts',            { gefeiert: 0, offen: false }, lauf(4, 5, false, false));
pruefe('Ziel erreicht, am Bildschirm -> Feier',    { gefeiert: 1, offen: false }, lauf(5, 5, false, false));
pruefe('Ziel im Geh-Modus -> aufgeschoben',        { gefeiert: 0, offen: true  }, lauf(5, 5, true,  false));
pruefe('danach Geh-Modus aus -> nachgeholt',       { gefeiert: 1, offen: false }, lauf(5, 5, false, true));
pruefe('weit ueber dem Ziel -> feiert trotzdem',   { gefeiert: 1, offen: false }, lauf(30, 5, false, false));

/* ---------- Und sieht ueberhaupt jemand hin? (09.09.2026) ----------
   Elias: „habe eben 5 wörter angehört und konfeti kam erst bei startseite,
   das soll aber doch kommen beim hörmodus". Der Aufschub oben war richtig,
   nur sein Endpunkt lag falsch: `zeigeBildschirm()` wechselt ZUERST den
   Bildschirm und schaltet ERST DANACH den Geh-Modus ab — die nachgeholte
   Feier fiel deshalb auf die Startseite. [[endpunkt_der_zuerst_steht]] */
console.log('\nSieht jemand hin?');
pruefe('nachgeholt, aber schon auf der Startseite', { gefeiert: 0, offen: true },
  lauf(5, 5, false, true, /*imHoermodus*/ false, /*sichtbar*/ true));
pruefe('im Hoermodus, aber Display aus',            { gefeiert: 0, offen: true },
  lauf(5, 5, false, true, true, /*sichtbar*/ false));
pruefe('beides gut -> Feier',                       { gefeiert: 1, offen: false },
  lauf(5, 5, false, true, true, true));
pruefe('erstes Erreichen ausserhalb -> aufgeschoben',{ gefeiert: 0, offen: true },
  lauf(5, 5, false, false, false, true));

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

/* ---------- Stoertest zur Sichtbarkeitsregel ----------
   ⛔ Dieselbe Frage noch einmal, aber fuer die NEUE Bedingung: laesst sich
      zeigen, dass ohne sie das Konfetti auf der Startseite gefallen waere?
      Dafuer wird die Bedingung aus dem echten Quelltext HERAUSGESCHNITTEN und
      die so entstandene Fassung am selben Fall gefahren.
      [[stoertest_muss_wirkung_nachweisen]] */
console.log('\nOhne die Sichtbarkeitsregel (herausgeschnitten aus derselben Quelle):');
const ohne = m[0].replace(/\n\s*const sichtbar = [\s\S]*?if \(!sichtbar\)\{[^}]*\}\n/, '\n');
if (ohne === m[0]){
  console.log('  X  Die Regel liess sich nicht herausschneiden — Stoertest wirkungslos.');
  fehler++;
} else {
  const feiern = [];
  const ctx = {
    hoerTag: () => ({ tag: 'x', gesamt: 5, richtig: 5 }),
    hoerTagesziel: () => 5,
    GEH: { an: false },
    HOER: { zielOffen: true },
    feiere: (a, d) => feiern.push([a, d.zahl]),
    document: { visibilityState: 'visible',
      getElementById: () => ({ classList: { contains: () => false } }) }   /* Startseite */
  };
  vm.createContext(ctx);
  vm.runInContext(ohne + '\nthis.RUF = hoerZielPruefen;', ctx);
  ctx.RUF();
  pruefe('ohne die Regel faellt das Konfetti auf der Startseite', 1, feiern.length);
}

console.log('\n' + (fehler ? 'FEHLER: ' + fehler
  : 'Das Hoer-Tagesziel feiert nur, wenn er auch hinsieht'));
process.exit(fehler ? 1 : 0);
