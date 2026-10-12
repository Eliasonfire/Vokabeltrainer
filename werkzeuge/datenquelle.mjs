/* datenquelle.mjs -- wo der Abzug von arabicroots liegt, und welche Plätze die Ersatzdatenbank weglassen darf
 *
 * Elias, 11.10.2026, zur Ersatzdatenbank: „… genauso organisiert … wie die bei arabicroots damit man … nahtlos
 * wechseln kann ohne probleme"; am 12.10.2026: „und könnten wir diese jederzeit nahtlos verwenden? also auch in
 * bücher und kapiteln und so aufgeteilt usw.. und auch einsatzbereit".
 *
 * Alles Weitere in diesem Kopf ist Claudes Ableitung daraus, kein Satz von Elias.
 *
 * `data/` ist, worauf die App läuft: von dort lesen die App, die Auslieferung, das Vokabelpaket und die Prüfer
 * die Buchdateien (data/vokabeln-<buch>.js) und das Verzeichnis (data/buecher.js). Ohne Ersatzdatenbank liegt
 * dort der Abzug von arabicroots, geschrieben von hole-vokabeln.mjs. Wird auf die Ersatzdatenbank umgeschaltet
 * (ersatz-wechsel.mjs --hin), liegen dort die Ersatzkarten, und der Abzug steht daneben in data-abzug/ --
 * „geparkt". Zwei Sorten Werkzeuge müssen das wissen:
 *   - der Abzug selbst (hole-vokabeln.mjs): er schriebe sonst beim nächsten Lauf die Ersatzkarten still über;
 *   - die Werkzeuge der Ersatzdatenbank (ersatz-zuordnen.mjs, ersatz-bauen.mjs, pruefe-ersatz.mjs,
 *     ersatz-bama-lib.mjs): sie halten die Ersatzkarten gegen den „Bestand" -- nach einem Wechsel hielten sie
 *     sie sonst gegen sich selbst.
 * Beide fragen deshalb hier, wo der Abzug liegt. Alle anderen Leser meinen „worauf die App läuft" und bleiben
 * bei data/.
 *
 * Es gibt KEINE eigene Marke „die Ersatzdatenbank ist an". Der Abzug gilt als geparkt, sobald
 * data-abzug/buecher.js da ist -- die Antwort auf „wo liegt der Abzug?" ist damit immer der Ort, an dem er
 * wirklich liegt, und eine Marke, die von den Dateien abweichen könnte, gibt es nicht. ersatz-wechsel.mjs
 * schreibt das Verzeichnis dort als LETZTES hinein und nimmt es beim Rückweg als ERSTES wieder weg; solange es
 * da ist, ist der geparkte Abzug vollständig. Ohne den Ordner data-abzug/ ändert sich am Verhalten nichts.
 *
 * Die zweite Sicherung steckt in den Karten selbst: jede Ersatzkarte trägt `source: "ersatz"` (ersatz-bauen.mjs),
 * jede Karte des Abzugs `source: "vocabulary"`. Wer den Abzug liest oder schreibt, prüft damit, dass er nicht
 * versehentlich die Ersatzkarten in der Hand hat (istErsatzkarte) -- auch dann, wenn data-abzug/ einmal von Hand
 * gelöscht oder verschoben wurde.
 *
 * data-abzug/ ist arabicroots' Datenbankarbeit wie data/vokabeln-*.js: steht in .gitignore und in der Sperrliste
 * der Auslieferung (veroeffentlichen.mjs, VERBOTEN). Bewacht von werkzeuge/test-ersatz-wechsel.mjs. */
import fs from 'node:fs';
import path from 'node:path';

export const ABZUG_GEPARKT = 'data-abzug';

/* Liegt der Abzug geparkt neben data/? (Dann läuft die App auf der Ersatzdatenbank.) */
export const abzugGeparkt = repo => fs.existsSync(path.join(repo, ABZUG_GEPARKT, 'buecher.js'));

/* Der Ordner, in dem der Abzug von arabicroots liegt -- data/, solange nichts geparkt ist. */
export const abzugOrdner = repo => path.join(repo, abzugGeparkt(repo) ? ABZUG_GEPARKT : 'data');

export const istErsatzkarte = k => !!k && k.source === 'ersatz';

/* Eine Buchdatei oder das Verzeichnis als Liste lesen, ohne die Datei auszuführen: beide enden auf „= [ … ];".
 * Dasselbe Muster wie in hole-vokabeln.mjs und baue-vokabelpaket.mjs (die erste eckige Klammer gehört bei den
 * Buchdateien zum Schlüssel, deshalb vom letzten „= [" bis zum Dateiende). */
export function liesListe(datei) {
  const roh = fs.readFileSync(datei, 'utf8');
  const treffer = roh.match(/=\s*(\[[\s\S]*\])\s*;?\s*$/);
  if (!treffer) throw new Error(path.basename(datei) + ': keine Liste gefunden');
  return JSON.parse(treffer[1]);
}

/* ---------- Die Plätze, die die Ersatzdatenbank weglassen darf ---------------------------------------------
 *
 * Elias, 12.10.2026, auf die Frage, ob bei den 19 Wörtern, die in keiner Quelle zu finden waren, die bisherige
 * Karte bleiben oder das Wort wegfallen soll: „du kannst nochmals gucken, ansonsten kannst du weg lassen."
 *
 * Sein Satz vom 27.09.2026 („weniger soll nicht werden aber kann mehr werden") gilt für alles andere weiter:
 * fehlt nach einem Wechsel eine Kennung, die hier NICHT steht, verweigern ersatz-wechsel.mjs (das Umschalten)
 * und baue-vokabelpaket.mjs (das Paket).
 *
 * Hier stehen nur Kennungen, kein Inhalt einer Karte. Es ist der Stand von data-ersatz/nicht-gefunden.json am
 * 12.10.2026; das „nochmals gucken" steht vor einem Wechsel noch an. Wird einer dieser Plätze belegt, kommt
 * seine Kennung hier heraus -- test-ersatz-wechsel.mjs meldet eine Kennung, die hier steht und inzwischen eine
 * Karte hat. */
export const WEGGELASSEN = Object.freeze([
  '46414', '50251',                                                                           // madina-2
  '47540', '47776', '47982', '50294',                                                         // madina-3
  '48632',                                                                                    // bayna-yadayk-1
  '46722',                                                                                    // bayna-yadayk-2
  '48606',                                                                                    // bayna-yadayk-3
  '49046', '49476', '49571', '49467', '49024', '49393', '49653', '48939', '49200', '49471',   // bayna-yadayk-4
]);
