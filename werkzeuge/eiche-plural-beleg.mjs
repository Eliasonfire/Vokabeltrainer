/* eiche-plural-beleg.mjs — der Platzhalter-Filter darf nicht wegfallen
 * ==========================================================================
 *
 * ⛔⛔ DER FALL: Wiktionary schreibt REGELMAESSIGE Pluralformen nicht aus,
 * sondern als Platzhalter. Gemessen am 21.08.2026 an den offenen Faellen:
 *
 *     سُكَّر   ->  pl=+f
 *     كَعْبَة  ->  pl=كَعَبَات, +, كِعَاب
 *
 * Das „+" heisst „die regelmaessige Form, bitte selbst bilden". Ohne Filter
 * stuende auf Elias' Fragenseite „Plural: +f" — eine Angabe, die falsch ist
 * und sich nie meldet, weil sie wie eine Antwort aussieht.
 * [[bild_ohne_fehlermeldung_falsch]]
 *
 * ⭐ Der Filter ist eine Zeile: alles verwerfen, was kein arabisches Zeichen
 * traegt. Genau deshalb faellt er beim naechsten Umbau leicht heraus — diese
 * Datei haelt ihn fest.
 *
 * Aufruf:  node werkzeuge/eiche-plural-beleg.mjs
 * Exitcode 1 = der Filter greift nicht mehr.
 */

/* ⛔ Wortgleich mit der Fassung in aussenbelege.mjs, eintraege(). Weicht eine
   ab, prueft diese Datei etwas anderes als das, was laeuft. */
function pluraleAus(kopfText){
  const pl = [];
  for (const p of kopfText.matchAll(/\bpl\d?\s*=\s*([^|}]+)/g))
    for (const einzeln of p[1].split(',')){
      const t = einzeln.replace(/<[^>]*>/g, '').trim();
      if (t && /[؀-ۿ]/.test(t) && !pl.includes(t)) pl.push(t);
    }
  return pl;
}

const FAELLE = [
  ['{{ar-noun|سُكَّر|m|pl=+f}}',                    [],                    '⭐ reiner Platzhalter — NICHTS darf durch'],
  ['{{ar-noun|كَعْبَة|f|pl=كَعَبَات, +, كِعَاب}}',   ['كَعَبَات','كِعَاب'], '⭐ Platzhalter MITTENDRIN — die echten bleiben'],
  ['{{ar-noun|مَاء|m|pl=مِيَاه}}',                   ['مِيَاه'],            'der einfache Fall'],
  ['{{ar-noun|قَهْوَة|f|pl=قَهَوَات, قَهَاوٍ}}',     ['قَهَوَات','قَهَاوٍ'],'zwei echte Formen'],
  ['{{ar-noun|شَاي|m}}',                             [],                    'gar kein pl-Parameter'],
  ['{{ar-noun|x|m|pl=مِيَاه<tr:miyāh>}}',            ['مِيَاه'],            'Transkriptionsmarke wird abgeschnitten'],
  ['{{ar-noun|x|m|pl=مِيَاه, مِيَاه}}',              ['مِيَاه'],            'Dublette faellt weg']
];

let fehler = 0;
for (const [vorlage, soll, warum] of FAELLE){
  const ist = pluraleAus(vorlage);
  const ok = JSON.stringify(ist) === JSON.stringify(soll);
  if (!ok) fehler++;
  console.log((ok ? '  ok   ' : '  ⛔   ') + JSON.stringify(ist).padEnd(34)
    + ' soll ' + JSON.stringify(soll).padEnd(34) + warum);
}
console.log('');
if (fehler){ console.log('⛔ ' + fehler + ' von ' + FAELLE.length + ' falsch — der Platzhalter-Filter ist verschoben.'); process.exit(1); }
console.log('✔ ' + FAELLE.length + ' von ' + FAELLE.length + ' richtig; die zwei Platzhalter-Faelle bleiben draussen.');
