/* Rückstand zwischen Rohmaterial und ausgewerteten Regeln — misst die Lücke,
 * die am 18.08.2026 dazu geführt hat, dass drei Folgen fünf Tage lang
 * unbemerkt liegen blieben.
 *
 * Elias' Worte an dem Tag: „sobald die routinen fertig sind liegen die
 * ergebnisse und niemand kümmert sich drum und macht sie zu regeln etc.."
 *
 * ⭐ WARUM ES DIESES WERKZEUG BRAUCHT
 *
 * Die Kette hat drei Glieder, und nur die ersten beiden waren automatisiert:
 *   1. `arabicroots-update-check`   merkt, dass es eine neue Folge gibt   ✅
 *   2. `arabicroots-backfill-retry` holt Untertitel + Ton, läuft Whisper   ✅
 *   3. Regelauswertung                                                    ❌
 *
 * Glied 3 gehört nach Goal-Prompt E.1 in eine echte Sitzung — eine Regel ohne
 * gelesene Fundstelle darf nicht entstehen. Das ist richtig so. Der Fehler war
 * ein anderer: **es gab kein Signal, dass etwas wartet.** Der Backlog unter
 * `transcripts/backlog.md` hat es sauber notiert, aber eine Notiz, die niemand
 * aufschlägt, ist keine Meldung.
 *
 * Dieses Skript macht daraus eine Zahl, die jede Wartungsroutine ausgeben und
 * jede Nachtschicht abfragen kann.
 *
 * ⚠️ GEMESSEN WIRD AN DEN REGELN, NICHT AM BACKLOG.
 * Der Backlog ist von Hand gepflegt und kann veralten — genau das ist hier
 * schon passiert. Die Wahrheit steht in `grammar-data.js`: welche Folgen dort
 * als `source.folge` vorkommen, sind ausgewertet. Alles andere ist offen.
 *
 * Aufruf:
 *   node werkzeuge/rueckstand.mjs            Übersicht
 *   node werkzeuge/rueckstand.mjs --knapp    eine Zeile, für Routinen
 *   Exitcode 2, wenn etwas offen ist — damit ein Skript darauf reagieren kann.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/* fileURLToPath, nicht von Hand zerlegen: der Ordner heisst "1. Workspace"
   mit Leerzeichen, das steht in import.meta.url als %20. */
const HIER   = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.resolve(HIER, '..');
const knapp  = process.argv.includes('--knapp');

const lies = p => fs.readFileSync(path.join(WURZEL, p), 'utf8');

/* ---------- 1. Welche Folgen haben Rohmaterial? ---------- */
function folgenMitRohmaterial(){
  const gefunden = new Map();   /* Nummer -> Set der Quellen */
  for (const [ordner, was] of [['transcripts/raw', 'Untertitel'],
                               ['transcripts/whisper-voll', 'Whisper'],
                               ['transcripts/sprecher', 'Sprecher']]){
    const p = path.join(WURZEL, ordner);
    if (!fs.existsSync(p)) continue;
    for (const d of fs.readdirSync(p)){
      const m = /folge-(\d+)/.exec(d);
      if (!m) continue;
      const n = Number(m[1]);
      if (!gefunden.has(n)) gefunden.set(n, new Set());
      gefunden.get(n).add(was);
    }
  }
  return gefunden;
}

/* ---------- 2. Welche Folgen sind zu Regeln geworden? ---------- */
function folgenMitRegeln(){
  const { GRAMMAR_RULES } =
    (new Function(lies('grammar-data.js') + ';return {GRAMMAR_RULES};'))();
  const nachFolge = new Map();
  for (const r of GRAMMAR_RULES){
    /* Buch-Ergänzungen (ergaenzung: true) haben keine Folge — sie stammen
       nicht aus dem Unterricht und dürfen hier nicht als Auswertung zählen. */
    if (!r.source || r.source.folge === undefined) continue;
    nachFolge.set(r.source.folge, (nachFolge.get(r.source.folge) || 0) + 1);
  }
  return nachFolge;
}

/* ---------- 3. Was sagt der Backlog? Nur zum Vergleich. ---------- */
function backlogSagt(){
  const p = path.join(WURZEL, 'transcripts/backlog.md');
  if (!fs.existsSync(p)) return null;
  const zeilen = fs.readFileSync(p, 'utf8').split(/\r?\n/);
  const offen = new Set(), erledigtOhneRegeln = new Set(), ausserWertung = new Set();
  for (const z of zeilen){
    const m = /^\|\s*(\d+)\s*\|/.exec(z);
    if (!m) continue;
    const n = Number(m[1]);
    /* ⛔⛔ ZUERST die Folgen, die gar nicht gewertet werden duerfen. Elias am
       22.09.2026 zu Folge 21, woertlich: "folge 21 hat keinen ton vom lehrer,
       folge 21 ist ungültig und soll nciht verarbeitet bzw analysiert oder
       überhaupt gewertet werden." Und dazu: "schreib in to do damit niemand
       auch danach es je versucht zumindest solange es keine neue folge davon
       gibt aber ich schätze er wird davon keine neue folge machen".
       Eine solche Folge ist KEINE offene Aufgabe und auch nichts Ausgewertetes.
       Sie steht ausser Wertung — Rohmaterial liegt da, es ist nur wertlos.
       ⚠️ Der Unterschied zu "0 Regeln, gewollt" ist wichtig: dort HAT jemand
       hingesehen, hier soll ausdruecklich niemand mehr hinsehen. */
    if (/ausser wertung/i.test(z)) ausserWertung.add(n);
    /* ⚠️ Dann der Sonderfall, dann der Normalfall: Folge 06 ist ausgewertet
       und hat ABSICHTLICH keine Regeln hervorgebracht (reine Wiederholung von
       04/05). Ohne diese Zeile meldet das Skript sie fuer immer als offen —
       und eine Meldung, die immer kommt, liest bald niemand mehr. */
    else if (/ausgewertet/i.test(z) && /keine neuen/i.test(z)) erledigtOhneRegeln.add(n);
    else if (/Regelauswertung offen|roh vorhanden/i.test(z)) offen.add(n);
  }
  return { offen, erledigtOhneRegeln, ausserWertung };
}

const roh    = folgenMitRohmaterial();
const regeln = folgenMitRegeln();
const bl     = backlogSagt();
const ohneRegeln = bl ? bl.erledigtOhneRegeln : new Set();
const ausser     = bl ? bl.ausserWertung      : new Set();

const alle = [...roh.keys()].sort((a, b) => a - b);
/* Ausgewertet ist eine Folge, wenn sie Regeln geliefert hat ODER im Backlog
   ausdruecklich als "ausgewertet, keine neuen Regeln" steht.
   Offen ist sie nur, wenn sie ueberdies nicht ausser Wertung steht. */
const offen = alle.filter(n => !regeln.has(n) && !ohneRegeln.has(n) && !ausser.has(n));

if (knapp){
  const zusatz = ausser.size ? ` (${ausser.size} ausser Wertung: ${[...ausser].join(', ')})` : '';
  console.log(offen.length === 0
    ? 'Regelauswertung: kein Rueckstand.' + zusatz
    : `Regelauswertung: ${offen.length} Folge(n) offen — ${offen.join(', ')}.` + zusatz);
  process.exit(offen.length ? 2 : 0);
}

console.log('--- Rueckstand Regelauswertung ---\n');
console.log('Folge  Rohmaterial                      Regeln  Stand');
for (const n of alle){
  const q = [...roh.get(n)].join(' + ');
  const anz = regeln.get(n);
  const stand = ausser.has(n) ? '⛔ AUSSER WERTUNG — nicht auswerten'
              : anz           ? 'ausgewertet'
              : ohneRegeln.has(n) ? 'ausgewertet (0 Regeln, gewollt)'
              : 'OFFEN';
  console.log('  ' + String(n).padStart(2) + '   ' + q.padEnd(32)
            + String(anz || 0).padStart(4) + '    ' + stand);
}

console.log('\nFolgen mit Rohmaterial: ' + alle.length
          + ' | ausgewertet: ' + alle.filter(n => regeln.has(n)).length
          + ' | offen: ' + offen.length
          + ' | ausser Wertung: ' + alle.filter(n => ausser.has(n)).length);

/* ⛔ Der Grund steht hier und nicht nur im Backlog, weil dieses Skript der Ort
   ist, an dem jemand nach der naechsten Aufgabe sucht. */
if (ausser.size){
  console.log('\n⛔ Ausser Wertung, NICHT auswerten: Folge ' + [...ausser].join(', ')
            + '\n   Folge 21 hat keinen Ton vom Lehrer (Elias, 22.09.2026).'
            + '\n   Rohmaterial liegt da und bleibt liegen. Wer sie doch auswertet,'
            + '\n   baut Regeln auf einer Aufnahme ohne Lehrerstimme.');
}

/* Der Backlog ist von Hand gepflegt. Weicht er ab, ist das selbst ein Befund —
   dann glaubt jemand einem Stand, den die Daten nicht hergeben. */
if (bl){
  const nurBacklog = [...bl.offen].filter(n => !offen.includes(n));
  const nurGemessen = offen.filter(n => !bl.offen.has(n));
  if (nurBacklog.length || nurGemessen.length){
    console.log('\n⚠️ backlog.md weicht ab:');
    if (nurBacklog.length)  console.log('   dort offen, hier ausgewertet: ' + nurBacklog.join(', '));
    if (nurGemessen.length) console.log('   hier offen, dort nicht vermerkt: ' + nurGemessen.join(', '));
  } else {
    console.log('backlog.md stimmt mit der Messung ueberein.');
  }
}

/* ⚠️ Eine Folge OHNE neue Regeln ist nicht automatisch unausgewertet — Folge 06
   war reine Wiederholung und hat bewusst keine hervorgebracht. Solche Faelle
   muessen im Backlog stehen, sonst meldet dieses Skript sie ewig als offen.
   Genau dafuer ist der Abgleich oben da. */
if (offen.length){
  console.log('\nNaechster Schritt je offener Folge:');
  console.log('  1. node pruefe-transkripte.js <folge>   Fundstellen im Volltext');
  console.log('  2. Regelkandidaten lesen, gegen die vorhandenen abgleichen');
  console.log('  3. Uebernommene Regeln mit source.folge eintragen');
  console.log('  4. backlog.md nachziehen');
}
process.exit(offen.length ? 2 : 0);
