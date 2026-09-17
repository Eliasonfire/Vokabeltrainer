/* kv-abruf.mjs — einen Befehl ausführen, und scheitert er, nach ein paar
 * Sekunden EINMAL wiederholen.
 *
 * ================== WOZU (17.09.2026) ======================================
 *
 * `vorrat.mjs --app auto` holt Elias' Gerätestand mit `wrangler kv key get`.
 * Derselbe Abruf scheiterte am 09.09., am 13.09. und am 16.09. 20:45 beim
 * ERSTEN Versuch — und `vorrat.mjs` gab sofort auf. Folge am 16.09.:
 * `data/abgelehnt.json` blieb eine Woche alt, und zehn Eselsbrücken, die Elias
 * in der App weggeklickt hatte, standen weiter in der App. Der Wartungsbericht
 * hat den zweiten Versuch vorgeschlagen (maintenance-log.md, Lauf 16.09.).
 *
 * ⛔ Genau EIN zweiter Versuch, keine Schleife: ein KV, der zweimal nicht
 * antwortet, ist ein Befund für den Bericht und kein Grund, die Wartung
 * minutenlang hängen zu lassen (jeder Versuch darf bis zu 180 s dauern).
 *
 * Geprüft von test-kv-abruf.mjs (auch, dass vorrat.mjs diesen Weg benutzt).
 */
import { execFileSync } from 'node:child_process';

export function mitWiederholung(befehl, args, optionen = {}, { versuche = 2, warteSek = 5 } = {}){
  let letzter;
  for (let v = 1; v <= versuche; v++){
    try {
      return { text: execFileSync(befehl, args, optionen), versuch: v };
    } catch (e){
      letzter = e;
      if (v < versuche) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, Math.round(warteSek * 1000));
    }
  }
  const fehler = new Error('nach ' + versuche + ' Versuch' + (versuche === 1 ? '' : 'en') + ': '
    + String((letzter && letzter.message) || 'unbekannt').split('\n')[0]);
  fehler.versuche = versuche;
  throw fehler;
}
