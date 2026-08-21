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

import fs from 'node:fs';
const REPO = 'G:/1. Workspace/Vokabeltrainer';

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

/* ⛔ DIESE FUNKTION IST EINE KOPIE, und der Kommentar darueber sagte das
   schon vor dem 21.08.2026: „Wortgleich mit der Fassung in
   aussenbelege.mjs, eintraege(). Weicht eine ab, prueft diese Datei etwas
   anderes als das, was laeuft."

   Das Wissen war also da — nur ohne Wirkung, denn niemand hat es je
   nachgemessen. Genau das tut der Block unten jetzt: er liest die echte
   Fassung und vergleicht sie Zeichen fuer Zeichen mit dieser hier.

   ⚠️ Warum VERGLEICHEN und nicht laden: die Logik steckt mitten in
   eintraege() zwischen `const pl = [];` und `raus.push(...)`. Sie
   herauszuschneiden braeuchte Textmarken im Funktionsrumpf — und genau die
   verfallen still, sobald jemand eine Zeile einfuegt.
   [[indexof_minus_eins_ist_immer_kleiner]]

   ⭐ Der Vergleich normalisiert \uXXXX-Folgen zu echten Zeichen. Nur so
   sind die beiden Fassungen ueberhaupt vergleichbar: das Original schreibt
   [؀-ۿ], diese Kopie schreibt dieselbe Klasse mit SICHTBAREN
   Zeichen. Gleiches Bild, andere Schreibweise — und die sichtbare Variante
   ist die riskante, weil ein Zeichen mit gleichem Bild aber anderem
   Codepoint nicht auffaellt. [[zeichenklasse_nie_sichtbar_kopieren]] */
{
  const aq = fs.readFileSync(REPO + '/werkzeuge/aussenbelege.mjs', 'utf8');
  const echt = /for \(const p of kopf\[0\]\.matchAll[\s\S]*?pl\.push\(t\);/.exec(aq);
  if (!echt){
    console.log('⛔ In werkzeuge/aussenbelege.mjs steht die pl-Schleife nicht mehr');
    console.log('   in der erwarteten Form. Diese Eichung kann dann nicht sagen,');
    console.log('   ob ihre Fassung noch dieselbe ist.');
    process.exit(1);
  }
  /* \uXXXX zu echten Zeichen, damit beide Schreibweisen vergleichbar sind. */
  const gleich = s => s
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\s+/g, ' ').trim();

  const meine = gleich(pluraleAus.toString().slice(
    pluraleAus.toString().indexOf('for (const p of'),
    pluraleAus.toString().indexOf('pl.push(t);') + 'pl.push(t);'.length));
  const ihre = gleich(echt[0].replace('kopf[0]', 'kopfText'));

  if (meine !== ihre){
    console.log('⛔ Die Fassung hier weicht von werkzeuge/aussenbelege.mjs ab.');
    console.log('   hier:  ' + meine);
    console.log('   dort:  ' + ihre);
    console.log('   Die Eichfaelle unten pruefen dann etwas, das so nicht laeuft.');
    process.exit(1);
  }
  console.log('  Deckungsgleich mit werkzeuge/aussenbelege.mjs ✔');
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
