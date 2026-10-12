/* eiche-ersatz-bama.mjs -- Eichung des Abgleichs gegen Buckwalters Stammliste (ersatz-bama-lib.mjs).
 *
 * Zwei Fragen:
 *   1. Feste Fälle mit bekannter Antwort -- laufen IMMER, auch ohne die Quelle: die Umschrift, die
 *      Vergleichsform (gleiches Wort trifft, die Mehrzahl desselben Wortes trifft NICHT), das Gerüst und
 *      die Wurzelformen, unter denen ersatz-lane.mjs in Lanes Lexikon nachschlägt.
 *   2. Misst der Abgleich überhaupt? An einem ganzen Buch mit GEWÖHNLICHEN Wörtern muss er die meisten
 *      treffen. Träfe er dort fast nichts, hieße „nicht gefunden" bei einem seltenen Wort gar nichts.
 *      [[leere_liste_ist_keine_messung]]
 *
 * Frage 2 braucht data-ersatz/quellen/bama/dictStems und data/vokabeln-<buch>.js. Beide liegen nur lokal;
 * fehlen sie, wird Frage 2 SICHTBAR übersprungen (kein stilles Grün) und nur Frage 1 entscheidet.
 * Die Schwelle (drei Viertel der Einwort-Karten als Lemma oder Stamm) ist von Claude gesetzt; gemessen am
 * 12.10.2026: madina-1 263 von 292, bayna-yadayk-2 539 von 551.
 *
 * Aufruf:  node werkzeuge/eiche-ersatz-bama.mjs [buch]        Exit 0 = geeicht · 1 = ein Fall rot
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ladeBama, standardDatei, ladeBuch, vergleich, geruest, ausBW, nachBW, hatVokalzeichen, wurzelnAus } from './ersatz-bama-lib.mjs';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const REPO = process.env.ERSATZ_REPO || path.join(HIER, '..');
const buch = process.argv[2] || 'madina-1';
const Z = n => String.fromCodePoint(n);
const wort = (...n) => n.map(Z).join('');

let rot = 0;
const probe = (was, ok) => { console.log('   ' + (ok ? 'ok  ' : 'ROT ') + was); if (!ok) rot++; };

console.log('--- 1. Feste Fälle (ohne Quelle)');
const kitabun = wort(0x643, 0x650, 0x62A, 0x64E, 0x627, 0x628, 0x64C);          // kitābun
const kutubun = wort(0x643, 0x64F, 0x62A, 0x64F, 0x628, 0x64C);                 // kutubun, die Mehrzahl
const alKitabu = wort(0x627, 0x644, 0x652, 0x643, 0x650, 0x62A, 0x64E, 0x627, 0x628, 0x64F);  // al-kitābu
const ktb = wort(0x643, 0x62A, 0x628);                                          // ohne Vokalzeichen
probe('Umschrift: kitAb wird zu vier Buchstaben mit einem Kasra', ausBW('kitAb') === wort(0x643, 0x650, 0x62A, 0x627, 0x628));
probe('Umschrift hin und zurück ergibt dasselbe (Wurzel $mt)', nachBW(ausBW('$mt')) === '$mt');
probe('kitAb trifft kitābun (Schlussendung zählt nicht)', vergleich(ausBW('kitAb'), { artikelWeg: false }) === vergleich(kitabun));
probe('kitAb trifft al-kitābu (Artikel zählt nicht)', vergleich(ausBW('kitAb'), { artikelWeg: false }) === vergleich(alKitabu));
probe('kitAb trifft kutubun NICHT (andere Vokalzeichen)', vergleich(ausBW('kitAb'), { artikelWeg: false }) !== vergleich(kutubun));
probe('Gerüst: kitAb und kutub sind verschieden (Alif)', geruest(ausBW('kitAb')) !== geruest(kutubun));
probe('Gerüst: kutubun und ktb sind gleich (nur Buchstaben)', geruest(kutubun) === geruest(ktb));
probe('ein Wort ohne Vokalzeichen gilt nicht als vokalisiert', hatVokalzeichen(ktb) === false && hatVokalzeichen(kutubun) === true);
/* Die Wurzeln für Lanes Lexikon (ersatz-lane.mjs) aus dem Feld root: Buchstaben mit Leerzeichen dazwischen. */
const gleich = (a, b) => JSON.stringify(a) === JSON.stringify(b);
probe('Wurzel: drei Buchstaben ergeben eine Form', gleich(wurzelnAus(wort(0x634, 0x20, 0x645, 0x20, 0x62A)), ['$mt']));
probe('Wurzel: zweilautig steht die kurze Form ZUERST (Lane führt sie so)', gleich(wurzelnAus(wort(0x62F, 0x20, 0x631, 0x20, 0x631)), ['dr', 'drr']));
probe('Wurzel: Hamza wird mit und ohne Träger versucht', gleich(wurzelnAus(wort(0x648, 0x20, 0x636, 0x20, 0x621)), ["wD'", 'wD>']));
probe('Wurzel: ein leeres Feld ergibt nichts', gleich(wurzelnAus(''), []) && gleich(wurzelnAus(undefined), []));

console.log('--- 2. Misst der Abgleich? (Buch ' + buch + ')');
const quelle = standardDatei(REPO);
const karten = fs.existsSync(quelle) ? ladeBuch(REPO, buch) : null;
if (!fs.existsSync(quelle) || !karten) {
  console.log('   ⚠️ ÜBERSPRUNGEN: ' + (!fs.existsSync(quelle) ? 'die Stammliste' : 'der Bestand des Buches') + ' liegt hier nicht (beides ist nur lokal).');
} else {
  const lemmas = ladeBama(quelle);
  const nachForm = new Set(), nachStamm = new Set();
  for (const l of lemmas) {
    nachForm.add(vergleich(l.ar, { artikelWeg: false }));
    for (const s of l.staemme) nachStamm.add(vergleich(ausBW(s.mit), { artikelWeg: false }));
  }
  const einwort = [...karten.values()].filter(k => k.ar && String(k.ar).trim().split(/\s+/).length === 1);
  let streng = 0, stamm = 0;
  for (const k of einwort) { const K = vergleich(k.ar); if (nachForm.has(K)) streng++; else if (nachStamm.has(K)) stamm++; }
  console.log('   ' + lemmas.length + ' Lemmas · ' + einwort.length + ' Einwort-Karten · als Lemma ' + streng + ' · als Stamm ' + stamm);
  probe('die Liste ist ganz gelesen (über 30000 Lemmas)', lemmas.length > 30000);
  probe('das Lemma kitAb_1 steht darin', lemmas.some(l => l.id === 'kitAb_1'));
  probe('mindestens drei Viertel der gewöhnlichen Wörter werden getroffen', einwort.length > 100 && (streng + stamm) * 4 >= einwort.length * 3);
  /* Gegenprobe: dieselbe Zählung mit einer Vergleichsform, die nichts mehr unterscheidet, dürfte NICHT als
     Messung durchgehen -- sie träfe alles. Darum zählt oben die Form MIT Vokalzeichen, und hier wird geprüft,
     dass ein erfundenes Wort (vier gleiche Buchstaben mit Damma) NICHT getroffen wird. */
  const erfunden = wort(0x636, 0x64F, 0x636, 0x64F, 0x636, 0x64F, 0x636, 0x64F);
  probe('ein erfundenes Wort wird NICHT getroffen', !nachForm.has(vergleich(erfunden)) && !nachStamm.has(vergleich(erfunden)));
}

console.log('');
if (rot) { console.log('⛔ ' + rot + ' Fall/Fälle rot — der Abgleich gegen die Stammliste misst nicht verlässlich.'); process.exit(1); }
console.log('✅ Abgleich gegen Buckwalters Stammliste geeicht: feste Fälle grün' + (karten ? ', gewöhnliche Wörter werden getroffen, ein erfundenes nicht.' : ' (Quelle hier nicht vorhanden).'));
