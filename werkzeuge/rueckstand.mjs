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
 *   3. Regelauswertung                 ❌ am 18.08.2026 morgens — ✅ seither
 *
 * ⚠️ DIESER ABSATZ WAR BIS ZUM 11.10.2026 VERALTET, und ich habe ihn Elias als
 * Auskunft weitergegeben („Die Regeln schreibt keine Routine, das passiert in
 * einer Sitzung" — seine Antwort: „wieso??"). Hier stand, Glied 3 gehöre „in
 * eine echte Sitzung". Das galt am 18.08.2026 morgens. Seit demselben Tag
 * wertet die Wartung selbst aus (`Automation/prompts/vokabeltrainer-wartung.md`,
 * Schritt 1b: „auswerten, eintragen, veröffentlichen"), auf seinen Satz hin:
 * „du sollst sie selber auswerten … allgemein gilt das so." Glied 3 ist also
 * ✅ — und was davon bleibt, ist die Belegpflicht: eine Regel ohne gelesene
 * Fundstelle darf nicht entstehen (Goal-Prompt E.1).
 *
 * Der ursprüngliche Fehler war ein anderer: **es gab kein Signal, dass etwas
 * wartet.** Der Backlog unter `transcripts/backlog.md` hat es sauber notiert,
 * aber eine Notiz, die niemand aufschlägt, ist keine Meldung. Dieses Skript
 * macht daraus eine Zahl, die jede Wartungsroutine ausgeben und jede
 * Nachtschicht abfragen kann.
 *
 * ⚠️ GEMESSEN WIRD AN DEN REGELN UND AN MEINEN URTEILEN, NICHT AM BACKLOG.
 * Der Backlog ist von Hand gepflegt und kann veralten — genau das ist hier
 * schon passiert. Zwei Messungen (die zweite seit dem 11.10.2026):
 *   1. `grammar-data.js`: welche Folgen dort als `source.folge` vorkommen.
 *   2. `werkzeuge/kandidaten-urteile.json` gegen `transcripts/kandidaten/`:
 *      ist jede Fundstelle der Folge beurteilt, und steht jede BELEGTE Regel
 *      (Urteil `regel`) schon in der App?
 * Eine Folge ist OFFEN, solange dort noch MEINE Arbeit liegt: eine Fundstelle
 * ohne Urteil, eine belegte Regel, die noch nicht eingebaut ist, oder eine
 * Folge, die noch niemand angesehen hat. Eine Frage an Elias (`abweichung`,
 * `unbelegt`) hält eine Folge NICHT offen — sie steht auf seiner Warteseite.
 *
 * ⭐ Anlass der zweiten Messung: Folge 26 war am 10.10.2026 vollständig
 * beurteilt (zehnmal keine Regel, eine Frage an ihn) und stand hier trotzdem
 * als OFFEN, weil sie keine Regel hervorgebracht hat. Umgekehrt galten Folge
 * 15, 17 und 20 als ausgewertet, obwohl dort vier belegte Regeln seit dem
 * 22.09. darauf warteten, eingebaut zu werden.
 *
 * Aufruf:
 *   node werkzeuge/rueckstand.mjs            Übersicht
 *   node werkzeuge/rueckstand.mjs --knapp    eine Zeile, für Routinen
 *   Exitcode 2, wenn etwas offen ist — damit ein Skript darauf reagieren kann.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gehtAnElias, wartetAufEinbau } from './kandidaten-einordnung.mjs';

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

/* ---------- 2b. Was sagen MEINE Urteile über die Fundstellen? (seit 11.10.2026) ----------
   Die Kennung wird gebildet wie in kandidaten-bewerten.mjs: f<Folge>-<Zeitmarke
   ohne Doppelpunkt>. Fehlt die Urteilsdatei oder der Ordner, bleibt die Karte
   LEER — dann zählt wie früher nur die Regelzahl, und das steht in der Ausgabe. */
function urteileJeFolge(){
  const aus = new Map();
  const kand = path.join(WURZEL, 'transcripts/kandidaten');
  const up = path.join(WURZEL, 'werkzeuge/kandidaten-urteile.json');
  if (!fs.existsSync(kand) || !fs.existsSync(up)) return aus;
  const urteile = JSON.parse(fs.readFileSync(up, 'utf8')).urteile || {};
  for (const d of fs.readdirSync(kand)){
    if (!d.startsWith('folge-') || !d.endsWith('.json')) continue;
    const o = JSON.parse(fs.readFileSync(path.join(kand, d), 'utf8'));
    const liste = o.kandidaten || [];
    let ohne = 0, einbau = 0, fragen = 0;
    for (const k of liste){
      const u = urteile['f' + o.folge + '-' + String(k.zeitmarke).split(':').join('')];
      if (!u || !u.urteil) ohne++;
      else if (wartetAufEinbau(u)) einbau++;
      else if (gehtAnElias(u.urteil)) fragen++;
    }
    aus.set(Number(o.folge), { gesamt: liste.length, ohne, einbau, fragen });
  }
  return aus;
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

const urteile = urteileJeFolge();

const alle = [...roh.keys()].sort((a, b) => a - b);
/* Bei mir liegt noch Arbeit: eine Fundstelle ohne Urteil oder eine belegte
   Regel, die noch nicht in der App steht. */
const meineArbeit = n => {
  const u = urteile.get(n);
  return !!u && (u.ohne > 0 || u.einbau > 0);
};
/* Durchgesehen: es GIBT Fundstellen, jede ist beurteilt, nichts wartet aufs
   Einbauen. Eine Folge mit 0 Fundstellen ist damit NICHT durchgesehen. */
const durchgesehen = n => {
  const u = urteile.get(n);
  return !!u && u.gesamt > 0 && u.ohne === 0 && u.einbau === 0;
};
/* Ausgewertet ist eine Folge, wenn sie Regeln geliefert hat, ODER im Backlog
   ausdruecklich als "ausgewertet, keine neuen Regeln" steht, ODER jede ihrer
   Fundstellen beurteilt ist. Offen ist sie, wenn nichts davon zutrifft ODER
   bei mir noch Arbeit liegt — und sie nicht ausser Wertung steht. */
const offen = alle.filter(n => !ausser.has(n)
  && (meineArbeit(n) || (!regeln.has(n) && !ohneRegeln.has(n) && !durchgesehen(n))));

const standVon = n => {
  const u = urteile.get(n);
  if (ausser.has(n)) return '⛔ AUSSER WERTUNG — nicht auswerten';
  if (u && u.ohne > 0) return 'OFFEN — ' + u.ohne + ' Fundstelle(n) ohne Urteil';
  if (u && u.einbau > 0) return 'OFFEN — ' + u.einbau + ' belegte Regel(n) einzubauen';
  const frage = u && u.fragen ? ', ' + u.fragen + ' Frage(n) an Elias' : '';
  if (regeln.get(n)) return 'ausgewertet' + (frage ? ' (' + frage.slice(2) + ')' : '');
  if (ohneRegeln.has(n)) return 'ausgewertet (0 Regeln, gewollt' + frage + ')';
  if (durchgesehen(n)) return 'ausgewertet (0 Regeln; alle ' + u.gesamt + ' Fundstellen beurteilt' + frage + ')';
  return 'OFFEN';
};

if (knapp){
  const zusatz = ausser.size ? ` (${ausser.size} ausser Wertung: ${[...ausser].join(', ')})` : '';
  console.log(offen.length === 0
    ? 'Regelauswertung: kein Rueckstand.' + zusatz
    : `Regelauswertung: ${offen.length} Folge(n) offen — `
      + offen.map(n => n + ' (' + standVon(n).replace('OFFEN — ', '').replace('OFFEN', 'noch nicht angesehen') + ')').join(', ')
      + '.' + zusatz);
  process.exit(offen.length ? 2 : 0);
}

console.log('--- Rueckstand Regelauswertung ---\n');
console.log('Folge  Rohmaterial                      Regeln  Stand');
for (const n of alle){
  const q = [...roh.get(n)].join(' + ');
  const anz = regeln.get(n);
  console.log('  ' + String(n).padStart(2) + '   ' + q.padEnd(32)
            + String(anz || 0).padStart(4) + '    ' + standVon(n));
}

console.log('\nFolgen mit Rohmaterial: ' + alle.length
          + ' | ausgewertet: ' + alle.filter(n => !ausser.has(n) && !offen.includes(n)).length
          + ' | offen: ' + offen.length
          + ' | ausser Wertung: ' + alle.filter(n => ausser.has(n)).length);
if (!urteile.size){
  console.log('⚠️ Keine Urteile gelesen (werkzeuge/kandidaten-urteile.json oder transcripts/kandidaten fehlt) —'
            + '\n   gemessen ist dann nur die Regelzahl je Folge, nicht der Stand der Fundstellen.');
}

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
  console.log('\nNaechster Schritt je offener Folge (Wartung, Schritt 1b):');
  console.log('  1. node werkzeuge/kandidaten-bewerten.mjs --offen   Fundstellen ohne Urteil lesen und beurteilen');
  console.log('  2. Belegte Regeln (Urteil regel) EINBAUEN: node werkzeuge/uebernehmen.mjs — nicht Elias fragen');
  console.log('  3. Urteil danach auf schon-regel setzen, mit `regel` (Kennung) und `eingebaut` (Datum)');
  console.log('  4. backlog.md nachziehen');
}
process.exit(offen.length ? 2 : 0);
