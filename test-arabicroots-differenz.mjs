/* Der Kern der Rueckmeldung an arabicroots: was muss angelegt werden?
 *
 * Elias' Vorgabe (07.09.2026): „meine versuche sollen sich laufend aktualisiern
 * die prozentzahl soll weiter auf der bisherigen aufbauen".
 *
 * ⛔⛔ DER GEFAEHRLICHSTE FEHLER WAERE DIE VERDOPPLUNG. Der Abgleich laeuft bei
 * jedem Weglegen der App — wenn ein zweiter Lauf dieselben Versuche noch einmal
 * anlegt, waechst seine Versuchszahl in der Klassenrangliste ins Unermessliche,
 * und rueckgaengig machen kann das niemand von Hand. Der dritte Block prueft
 * deshalb ausdruecklich, dass ein Wiederholungslauf NICHTS tut.
 * [[zweiter_aufruf_ueberschreibt_still]]
 *
 * Die Funktion wird direkt aus der ausgelieferten Datei importiert — kein
 * Nachbau. [[testvorlage_selbst_nachgebaut]]
 */
import { offeneVersuche } from './functions/api/arabicroots.js';

let rot = 0;
function pruefe(name, ist, soll){
  const gleich = JSON.stringify(ist) === JSON.stringify(soll);
  if (!gleich) rot++;
  console.log((gleich ? '  ✔ ' : '  ✘ ') + name
    + (gleich ? '' : '\n       erwartet ' + JSON.stringify(soll) + '\n       bekam    ' + JSON.stringify(ist)));
}
const zaehle = (zeilen) => ({
  gesamt: zeilen.length,
  richtig: zeilen.filter(z => z.correct).length,
  falsch: zeilen.filter(z => !z.correct).length,
});

const BEKANNT = new Set(['45751', '45762', '45782']);
const TS = Date.UTC(2026, 8, 6, 19, 30);   /* 06.09.2026, 19:30 UTC */

console.log('\nErstuebertragung: alles, was da ist');
{
  const z = offeneVersuche(
    { '45751': { correct: 3, wrong: 1, ts: TS } }, {}, BEKANNT);
  pruefe('3 richtig, 1 falsch', zaehle(z), { gesamt: 4, richtig: 3, falsch: 1 });
  pruefe('Zeitstempel aus dem Vokabeltrainer', z[0].created_at, new Date(TS).toISOString());
  pruefe('Richtung gesetzt', z[0].direction, 'ar_de');
  pruefe('als Text, nicht als Zahl', typeof z[0].vocabulary_id, 'string');
}

console.log('\nAufbauen statt ersetzen');
{
  const z = offeneVersuche(
    { '45751': { correct: 10, wrong: 4, ts: TS } },
    { '45751': { richtig: 7, falsch: 3 } },
    BEKANNT);
  pruefe('nur die Differenz: 3 richtig, 1 falsch', zaehle(z), { gesamt: 4, richtig: 3, falsch: 1 });
}

console.log('\n⛔ Der zweite Lauf darf NICHTS tun');
{
  const stand = { '45751': { correct: 10, wrong: 4, ts: TS },
                  '45762': { correct: 2,  wrong: 0, ts: TS } };
  const schonDa = { '45751': { richtig: 10, falsch: 4 },
                    '45762': { richtig: 2,  falsch: 0 } };
  pruefe('nichts anzulegen', offeneVersuche(stand, schonDa, BEKANNT).length, 0);

  /* Und der Vollstaendigkeitsbeweis: erst uebertragen, dann das Ergebnis als
     „schon da" einsetzen — der naechste Lauf muss leer sein. */
  const ersteRunde = offeneVersuche(stand, {}, BEKANNT);
  const danach = {};
  for (const z of ersteRunde){
    const k = z.vocabulary_id;
    if (!danach[k]) danach[k] = { richtig: 0, falsch: 0 };
    if (z.correct) danach[k].richtig++; else danach[k].falsch++;
  }
  pruefe('erste Runde legt 16 Zeilen an', ersteRunde.length, 16);
  pruefe('zweite Runde danach: 0', offeneVersuche(stand, danach, BEKANNT).length, 0);
}

console.log('\nWas draussen bleiben muss');
{
  pruefe('eigenes Wort (unbekannte id)',
    offeneVersuche({ 'eigen-abc': { correct: 5, wrong: 2, ts: TS } }, {}, BEKANNT).length, 0);
  pruefe('Wort, das es drueben nicht mehr gibt',
    offeneVersuche({ '99999': { correct: 5, wrong: 2, ts: TS } }, {}, BEKANNT).length, 0);
  pruefe('nie beantwortet (0/0)',
    offeneVersuche({ '45751': { correct: 0, wrong: 0, ts: TS } }, {}, BEKANNT).length, 0);
  /* ⛔ Drueben steht MEHR als hier — etwa weil er dieselbe Karte auf einem
     Geraet oefter hatte, dessen Stand noch nicht angekommen ist. Es darf auf
     keinen Fall eine negative Zahl und keine Zeile geben. */
  pruefe('drueben mehr als hier → nichts, nichts Negatives',
    offeneVersuche({ '45751': { correct: 2, wrong: 1, ts: TS } },
                   { '45751': { richtig: 9, falsch: 9 } }, BEKANNT).length, 0);
  pruefe('kaputter Eintrag (null)',
    offeneVersuche({ '45751': null }, {}, BEKANNT).length, 0);
  pruefe('gar kein Fortschritt', offeneVersuche(null, {}, BEKANNT).length, 0);
}

console.log('\nMehrere Woerter zugleich');
{
  const z = offeneVersuche({
    '45751': { correct: 2, wrong: 0, ts: TS },
    '45762': { correct: 1, wrong: 1, ts: TS },
    '45782': { correct: 0, wrong: 3, ts: TS },
    'eigen': { correct: 9, wrong: 9, ts: TS },
  }, { '45751': { richtig: 1, falsch: 0 } }, BEKANNT);
  pruefe('1 + 2 + 3 = 6 Zeilen, das eigene Wort draussen',
    zaehle(z), { gesamt: 6, richtig: 2, falsch: 4 });
}

console.log('\n' + (rot ? '⛔ ' + rot + ' Pruefung(en) rot' : '✔ alle gruen'));
process.exit(rot ? 1 : 0);
