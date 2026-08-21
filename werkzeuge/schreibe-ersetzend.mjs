/* schreibe-ersetzend.mjs — eine bestehende Datei ersetzen, aber nicht blind
 * ===========================================================================
 *
 * ⛔ ZWEI VERSCHIEDENE UNFAELLE, und der `.neu`+rename-Weg deckt nur den ersten:
 *
 *   1. Der Lauf bricht MITTEN im Schreiben ab. Dann stuende ohne Zwischenschritt
 *      eine leere Datei da — und eine leere Datei besteht jeden Test.
 *      Dagegen hilft: erst daneben schreiben, dann umbenennen. `rename` ist auf
 *      demselben Laufwerk unteilbar. [[leere_datei_besteht_jeden_test]]
 *
 *   2. Der Lauf schreibt VOLLSTAENDIG — aber falsch. Eine Ersetzung hat zu viel
 *      getroffen, ein Filter zu scharf gegriffen, eine Liste ist leer geblieben.
 *      Die Datei ist dann formal in Ordnung und inhaltlich zur Haelfte weg.
 *      Dagegen hilft `rename` NICHT.
 *
 * Am 20.08.2026 ist Fall 2 in der anderen Richtung passiert: aus 34.619 wurden
 * 43.589 Zeichen fuer EINE geaenderte Zeile, weil `$'` in String.replace den
 * Dateirest einfuegt. Nach unten waere derselbe Fehler still geblieben — die
 * Datei ist ja da, sie ist nur kleiner. [[replace_dollar_ist_sonderzeichen]]
 *
 * ⭐ Deshalb hier BEIDES an einer Stelle. Wer nur `.neu`+rename kopiert, kopiert
 * die halbe Absicherung — und merkt es nicht, weil der Kommentar daneben von
 * „leerer Datei" spricht und das ja stimmt.
 *
 * ---------------------------------------------------------------------------
 * ⚠️ WAS DER SCHWELLWERT NICHT IST
 *
 * Er ist keine Qualitaetspruefung. Er faengt den GROBEN Fall — die Haelfte weg,
 * die Liste leer — und laesst normale Schrumpfungen durch. Eine Datei, die
 * absichtlich kleiner wird (geloeschte Eintraege), gibt `--schrumpfen-erlaubt`
 * mit; dann steht die Zahl im Aufruf und nicht im Werkzeug.
 * [[begrenzung_haelt_messung_nicht_stand]]
 *
 * ⛔ Gemessen wird in ZEICHEN, nicht in Bytes: `statSync().size` zaehlt bei
 * arabischem Text zwei bis drei Bytes je Zeichen, und ein Wechsel der
 * Zeilenenden verschoebe die Zahl ohne inhaltlichen Grund.
 * [[zeichen_sind_nicht_bytes]]
 */
import fs from 'node:fs';

/* Wie viel darf eine Datei beim Ersetzen hoechstens verlieren, bevor der Lauf
   abbricht? 0.6 heisst: unter 60 % der alten Laenge wird nicht geschrieben.
   Der Wert ist bewusst grosszuegig — er soll den Unfall fangen, nicht die
   normale Pflege behindern. */
export const MINDEST_ANTEIL = 0.6;

/**
 * Ersetzt eine bestehende Datei unteilbar und mit Groessenpruefung.
 *
 * @param {string} pfad     Zieldatei (muss existieren; sonst ist es kein Ersetzen)
 * @param {string} inhalt   der neue vollstaendige Text
 * @param {object} [opt]
 * @param {number} [opt.mindestAnteil]  Untergrenze als Anteil der alten Laenge
 * @param {string} [opt.grund]          was hier ersetzt wird, fuer die Meldung
 * @returns {{alt:number, neu:number}}  Laengen in ZEICHEN
 * @throws  wenn die Datei zu stark schrumpft — dann wird NICHTS geschrieben
 */
export function ersetzeDatei(pfad, inhalt, opt = {}){
  /* ⛔ `opt = {}` greift nur bei `undefined`. Wer `null` uebergibt, bekaeme
     hier einen Absturz — und alles danach liefe nie.
     [[vorgabewert_greift_nicht_bei_null]] */
  const o = opt || {};
  const anteil = typeof o.mindestAnteil === 'number' ? o.mindestAnteil : MINDEST_ANTEIL;

  if (typeof inhalt !== 'string' || !inhalt.length)
    throw new Error(`${pfad}: der neue Inhalt ist leer — nichts geschrieben.`);

  const gabEsSchon = fs.existsSync(pfad);
  const alt = gabEsSchon ? fs.readFileSync(pfad, 'utf8').length : 0;

  if (gabEsSchon && alt > 0 && inhalt.length < alt * anteil){
    const prozent = Math.round(inhalt.length / alt * 100);
    throw new Error(
      `${pfad}: die neue Fassung haette nur ${prozent} % der alten Laenge `
      + `(${inhalt.length} statt ${alt} Zeichen). Das ist keine Pflege, das ist ein Verlust. `
      + `NICHTS geschrieben.`
      + (o.grund ? ` — ${o.grund}` : '')
      + ' Ist das gewollt, den Aufruf mit einem eigenen mindestAnteil versehen.');
  }

  /* Erst daneben, dann umbenennen. */
  fs.writeFileSync(pfad + '.neu', inhalt, 'utf8');
  fs.renameSync(pfad + '.neu', pfad);
  return { alt, neu: inhalt.length };
}
