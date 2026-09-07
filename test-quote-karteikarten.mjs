/* Die Trefferquote zaehlt seit dem 07.09.2026 auch die Karteikarten
 * (Elias: „trefferquote sollte doch auch die karteikarten zählen weil der
 * fortschritt da ist ja wirklich sehr wichtig") — in EIGENEN Feldern, damit
 * beide Sorten getrennt auswertbar bleiben.
 *
 * ⛔ Der gefaehrlichste Teil ist nicht das Zaehlen, sondern der GERAETEABGLEICH:
 * dort stand ein Objektliteral mit genau zwei Feldern, das den Eintrag ersetzt
 * statt ihn zu ergaenzen. Ein neues Feld waere beim ersten Abgleich lautlos
 * verschwunden. Deshalb prueft der letzte Block genau das.
 *
 * ⛔ Alle Funktionen werden aus der Quelle GESCHNITTEN, nicht nachgebaut.
 * [[testvorlage_selbst_nachgebaut]]
 */
import fs from 'node:fs';
import vm from 'node:vm';

const kern = fs.readFileSync('js/kern.js', 'utf8');
const sync = fs.readFileSync('js/sync.js', 'utf8');

function schneideFunktion(quelle, name){
  const start = quelle.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('Funktion nicht gefunden: ' + name);
  let tiefe = 0, i = quelle.indexOf('{', start);
  for (; i < quelle.length; i++){
    if (quelle[i] === '{') tiefe++;
    else if (quelle[i] === '}'){ tiefe--; if (!tiefe) break; }
  }
  if (tiefe) throw new Error('Klammern gehen nicht auf: ' + name);
  return quelle.slice(start, i + 1);
}

/* Den Zusammenfuehr-Zweig aus js/sync.js schneiden: ab `if (k === 'vt_quoteTage')`
   bis zur schliessenden Klammer. So laeuft im Test der ECHTE Code — auch dann,
   wenn er spaeter anders geschrieben wird. */
function schneideQuoteZweig(){
  const start = sync.indexOf("if (k === 'vt_quoteTage')");
  if (start < 0) throw new Error("Zweig 'vt_quoteTage' nicht in js/sync.js gefunden");
  let tiefe = 0, i = sync.indexOf('{', start);
  for (; i < sync.length; i++){
    if (sync[i] === '{') tiefe++;
    else if (sync[i] === '}'){ tiefe--; if (!tiefe) break; }
  }
  return sync.slice(start, i + 1);
}

let rot = 0;
function pruefe(name, ist, soll){
  const gleich = JSON.stringify(ist) === JSON.stringify(soll);
  if (!gleich) rot++;
  console.log((gleich ? '  ✔ ' : '  ✘ ') + name
    + (gleich ? '' : '\n       erwartet ' + JSON.stringify(soll) + '\n       bekam    ' + JSON.stringify(ist)));
}

/* ---------------- 1. Zaehlen ---------------- */
console.log('\nZaehlen: Karten und Abfragen in getrennten Feldern');
{
  const welt = { QUOTE_TAGE: {}, todayStr: () => '2026-09-07',
                 LS: { set(){}, get(){ return {}; } }, console };
  vm.createContext(welt);
  vm.runInContext(schneideFunktion(kern, 'merkeQuote').replace(/^function/, 'var merkeQuote = function'), welt);

  vm.runInContext("merkeQuote(true,'karte'); merkeQuote(false,'karte'); merkeQuote(true,'karte');", welt);
  pruefe('drei Karten, zwei richtig', welt.QUOTE_TAGE['2026-09-07'],
    { gestellt: 0, richtig: 0, kGestellt: 3, kRichtig: 2 });

  vm.runInContext("merkeQuote(true); merkeQuote(false);", welt);
  pruefe('zwei Abfragen dazu — Kartenfelder unberuehrt', welt.QUOTE_TAGE['2026-09-07'],
    { gestellt: 2, richtig: 1, kGestellt: 3, kRichtig: 2 });
}

/* ---------------- 2. Summieren ---------------- */
console.log('\nDie Wochenzahl ist die Summe beider Sorten');
{
  const welt = {
    QUOTE_TAGE: { '2026-09-07': { gestellt: 10, richtig: 6, kGestellt: 40, kRichtig: 30 } },
    todayStr: (v) => { const d = new Date('2026-09-07'); d.setDate(d.getDate() + (v||0));
                       return d.toISOString().slice(0,10); },
    Number, Math, Object, Date, console
  };
  vm.createContext(welt);
  vm.runInContext(schneideFunktion(kern, 'quoteJeWoche').replace(/^function/, 'var quoteJeWoche = function'), welt);
  const w = vm.runInContext('quoteJeWoche(1)[0]', welt);
  pruefe('gestellt = 10 + 40',       w.gestellt, 50);
  pruefe('richtig  = 6 + 30',        w.richtig, 36);
  pruefe('Quote 36/50 = 72 %',       w.quote, 72);
  pruefe('Karten einzeln abrufbar',  [w.karten, w.kartenR], [40, 30]);
  pruefe('Abfragen einzeln abrufbar',[w.abfrage, w.abfrageR], [10, 6]);
}

/* ---------------- 3. ⛔ Der Geraeteabgleich ---------------- */
console.log('\n⛔ Abgleich: die Kartenfelder duerfen NICHT verlorengehen');
{
  const hier = { '2026-09-07': { gestellt: 10, richtig: 6, kGestellt: 40, kRichtig: 30 } };
  const dort = { '2026-09-07': { gestellt: 12, richtig: 5, kGestellt: 8,  kRichtig: 8  } };
  let geschrieben = null;
  const welt = {
    k: 'vt_quoteTage',
    hierRoh: JSON.stringify(hier),
    dortRoh: JSON.stringify(dort),
    JSON, Object, Number, Math, Set, console,
    etwasGeaendert: false,
    localStorage: { setItem(_, v){ geschrieben = JSON.parse(v); } },
  };
  vm.createContext(welt);
  /* `return` im geschnittenen Zweig braucht eine Funktion drumherum. */
  vm.runInContext('(function(){' + schneideQuoteZweig() + '})();', welt);

  pruefe('Maximum je Feld, Kartenfelder erhalten', geschrieben && geschrieben['2026-09-07'],
    { gestellt: 12, richtig: 6, kGestellt: 40, kRichtig: 30 });

  /* Ein Tag, den nur das andere Geraet kennt, muss vollstaendig ankommen. */
  const welt2 = Object.assign({}, welt, {
    hierRoh: JSON.stringify({}),
    dortRoh: JSON.stringify({ '2026-09-06': { gestellt: 3, richtig: 2, kGestellt: 9, kRichtig: 7 } }),
    localStorage: { setItem(_, v){ geschrieben = JSON.parse(v); } },
  });
  vm.createContext(welt2);
  vm.runInContext('(function(){' + schneideQuoteZweig() + '})();', welt2);
  pruefe('nur auf dem anderen Geraet — kommt ganz an', geschrieben && geschrieben['2026-09-06'],
    { gestellt: 3, richtig: 2, kGestellt: 9, kRichtig: 7 });

  /* Und ein ALTER Eintrag ohne die neuen Felder darf keine erfinden.
     ⚠️ Die andere Seite muss hier einen HOEHEREN Wert haben, sonst ist das
     Ergebnis gleich `hierRoh` und der Code schreibt zu Recht gar nicht — dann
     stuende `geschrieben` noch auf dem Wert des vorigen Falls und der Test
     pruefte etwas ganz anderes. Genau so ist er beim ersten Lauf rot geworden.
     [[eingefrorenes_feld_ist_kein_zustand]] */
  geschrieben = null;
  const welt3 = Object.assign({}, welt, {
    hierRoh: JSON.stringify({ '2026-09-05': { gestellt: 4, richtig: 3 } }),
    dortRoh: JSON.stringify({ '2026-09-05': { gestellt: 9, richtig: 3 } }),
    localStorage: { setItem(_, v){ geschrieben = JSON.parse(v); } },
  });
  vm.createContext(welt3);
  vm.runInContext('(function(){' + schneideQuoteZweig() + '})();', welt3);
  pruefe('alter Tag bekommt keine erfundenen Kartenfelder', geschrieben && geschrieben['2026-09-05'],
    { gestellt: 9, richtig: 3 });
}

/* ---------------- 4. Der Aufruf steht wirklich in der Karte ---------------- */
console.log('\nVerdrahtung');
{
  const lernen = fs.readFileSync('js/lernen.js', 'utf8');
  pruefe("js/lernen.js ruft merkeQuote(s.richtig,'karte')",
    /merkeQuote\(s\.richtig,\s*'karte'\)/.test(lernen), true);
  /* ⛔ Die Grenze muss `s.richtig` sein — dieselbe wie bei p.correct. Eine
     eigene Bedingung daneben hiesse, dass zwei Ansichten verschieden zaehlen. */
  pruefe('keine zweite Definition von „richtig" daneben',
    !/merkeQuote\((?!s\.richtig,\s*'karte')[^)]*'karte'\)/.test(lernen), true);
}

console.log('\n' + (rot ? '⛔ ' + rot + ' Pruefung(en) rot' : '✔ alle gruen'));
process.exit(rot ? 1 : 0);
