/* pruefe-auslieferliste.mjs — hält die Sperrliste der Auslieferung wirklich?
 * ==========================================================================
 *
 * ⛔⛔ WARUM DAS DIE PRÜFUNG MIT DEN GRÖSSTEN FOLGEN IST
 *
 * Im Projektordner liegen Dinge, die nach den AGB von arabicroots (Ziffer 3.7
 * und 9) NICHT weitergegeben werden dürfen: die Transkripte des Unterrichts
 * (268 MB), der Vokabelabzug, dazu Arbeitsmaterial wie `CLAUDE.md` und
 * `.gitignore`. `werkzeuge/veroeffentlichen.mjs` baut `.deploy/` aus einer
 * WEISSLISTE — und hat zusätzlich eine Sperrliste `VERBOTEN`, „was NIEMALS
 * hochgeht, egal was die Ableitung sagt".
 *
 * Diese Sperrliste ist bis zum 09.09.2026 von KEINEM Werkzeug geprüft worden.
 * Ein Tippfehler in einem der dreizehn Ausdrücke — `transcript` statt
 * `transcripts`, ein fehlendes `^`, ein `.` zu wenig — und die Sperre greift
 * still nicht mehr. Auffallen würde es niemandem: die Seite funktioniert
 * genauso, es liegt nur mehr darauf.
 * [[ausfall_ist_unsichtbar_gebaut]] [[daten_ohne_zugang]]
 *
 * ⭐ Geprüft wird nicht der Wortlaut der Ausdrücke, sondern ihre WIRKUNG auf
 * die Pfade, die WIRKLICH im Ordner liegen. Ein Muster, das keine einzige
 * echte Datei trifft, ist genauso verdächtig wie ein fehlendes.
 * [[gruener_pruefer_beweist_nur_geprueftes]]
 *
 * ⚠️ `data/vokabeln-*.js` steht ABSICHTLICH NICHT in der Sperrliste: die
 * Vokabeln gehören zur App und gehen mit `--mit-daten` bewusst mit. Ihre
 * Schranke ist eine andere — der Access-Nachweis (`.access-geprueft.json`),
 * ohne den `veroeffentlichen.mjs` den Dienst verweigert. Hier wird deshalb
 * ausdrücklich NICHT verlangt, dass sie gesperrt sind; verlangt wird, dass die
 * Datei ihre eigene Bedingung noch kennt.
 *
 * Aufruf:  node werkzeuge/pruefe-auslieferliste.mjs
 * Exit 0 = die Sperre hält · 1 = Störtest greift nicht · 2 = sie hält NICHT
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const QUELLE = path.join(REPO, 'werkzeuge', 'veroeffentlichen.mjs');

console.log('--- Die Sperrliste der Auslieferung ---\n');

if (!fs.existsSync(QUELLE)){
  console.log('⛔ werkzeuge/veroeffentlichen.mjs fehlt — dann gibt es keine Auslieferung.');
  process.exit(2);
}
const src = fs.readFileSync(QUELLE, 'utf8');

/* ---------- Den Block herausschneiden, nicht nachbauen ---------- */
const a = src.indexOf('const VERBOTEN = [');
const b = src.indexOf('const istVerboten', a);
if (a < 0 || b < 0){
  console.log('⛔ VERBOTEN oder istVerboten nicht gefunden — der Aufbau von');
  console.log('   veroeffentlichen.mjs hat sich geaendert. Erst nachsehen, dann anpassen.');
  process.exit(2);
}
const zeilenEnde = src.indexOf('\n', b);
const block = src.slice(a, zeilenEnde + 1);
let VERBOTEN, istVerboten;
try {
  ({ VERBOTEN, istVerboten } = new Function(block + ';return {VERBOTEN, istVerboten};')());
} catch (e){
  console.log('⛔ Der Block laesst sich nicht auswerten: ' + e.message);
  process.exit(2);
}
console.log('  ' + VERBOTEN.length + ' Ausdruecke in der Sperrliste.\n');

/* ---------- Alle Pfade, die es wirklich gibt ---------- */
const alle = [];
(function sammle(ordner, rel){
  let eintraege;
  try { eintraege = fs.readdirSync(ordner, { withFileTypes: true }); } catch { return; }
  for (const e of eintraege){
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()){
      if (e.name === 'node_modules' || e.name === '.deploy') continue;
      /* Grosse gesperrte Ordner nicht komplett durchlaufen — ein Beispiel reicht. */
      if (e.name === 'transcripts' || e.name === '.git'){ alle.push(r + '/beispiel.txt'); continue; }
      sammle(path.join(ordner, e.name), r);
    } else alle.push(r);
  }
})(REPO, '');
const gesperrt = alle.filter(p => istVerboten(p.replace(/\//g, path.sep)) || istVerboten(p));
console.log('  ' + alle.length + ' Pfade im Ordner, ' + gesperrt.length + ' davon gesperrt.\n');

let fehler = 0;
const pruefe = (was, ist, soll) => {
  if (ist === soll) console.log('  ok   ' + was);
  else { fehler++; console.log('  ⛔   ' + was + '  (ist ' + ist + ', erwartet ' + soll + ')'); }
};
const sperrt = (p) => istVerboten(p) || istVerboten(p.replace(/\//g, path.sep));

/* ---------- 1. Was NIEMALS hochgehen darf ---------- */
for (const p of ['transcripts/beispiel.txt', 'transcripts/kandidaten/freigabe.html',
                 'vokabelpaket.json', 'CLAUDE.md', '.gitignore',
                 'werkzeuge/veroeffentlichen.mjs', '.git/config', 'validate.js',
                 'pruefe-taschkil.js', 'test-sync.mjs', 'maintenance-log.md'])
  pruefe('gesperrt: ' + p, sperrt(p), true);

/* ---------- 2. Was mit MUSS ---------- */
for (const p of ['index.html', 'sw.js', 'manifest.json', 'js/kern.js', 'vocab-data.js',
                 'grammar-data.js', 'icon.svg', 'functions/_middleware.js',
                 'data/eselsbruecken-alt.js', 'data/vokabeln-madina-1.js'])
  pruefe('NICHT gesperrt: ' + p, sperrt(p), false);

/* ---------- 3. Jeder Ausdruck muss etwas Echtes treffen ----------
 *
 * Ein Ausdruck, der keine einzige Datei trifft, ist verdaechtig: ein Tippfehler
 * sperrt genauso wenig wie ein fehlender Eintrag, sieht aber aus wie eine
 * Sperre. [[gruener_pruefer_beweist_nur_geprueftes]]
 *
 * ⛔ ABER: der erste Lauf am 09.09.2026 meldete genau einen Befund, und der war
 * KEINER. `.arbeit.json` ist die Marke fuer eine abgebrochene Aenderung — sie
 * existiert nur, WAEHREND etwas offen ist, und genau dann soll sie nicht
 * hochgehen. Wieder galt: der erste Befund eines neuen Werkzeugs ist ein
 * Verdacht gegen das Werkzeug. [[mein_neues_werkzeug_ist_verdaechtig]]
 *
 * ⚠️ `.budget.json` ist von derselben Sorte (Haushaltsbuch der Schicht), liegt
 * heute aber da. Es steht bewusst NICHT hier: eine Ausnahme, die man heute
 * nicht braucht, wird nie geprueft und deckt spaeter etwas Echtes zu.
 */
const NUR_ZEITWEISE = {
  '/^\\.arbeit\\.json$/i': 'Marke fuer eine abgebrochene Aenderung — sie existiert nur, '
    + 'solange etwas offen ist (werkzeuge/arbeit.mjs), und genau dann darf sie nicht mit.',
};
console.log('');
for (const r of VERBOTEN){
  const treffer = alle.filter(p => r.test(p) || r.test(p.replace(/\//g, path.sep))).length;
  const grund = NUR_ZEITWEISE[String(r)];
  if (!treffer && grund){
    console.log('  ~    ' + String(r).padEnd(34) + '0 Treffer — mit Grund:');
    console.log('       ' + grund);
  } else if (!treffer){
    fehler++;
    console.log('  ⛔   ' + String(r) + '  trifft KEINE Datei im Ordner — Tippfehler oder veraltet?');
  } else console.log('  ok   ' + String(r).padEnd(34) + treffer + ' Treffer');
}
/* Eine Begruendung ohne Gegenstand deckt beim naechsten Mal etwas Echtes zu. */
for (const k of Object.keys(NUR_ZEITWEISE))
  if (!VERBOTEN.some(r => String(r) === k)){
    fehler++;
    console.log('  ⛔   Der Grund fuer ' + k + ' steht da, der Ausdruck aber nicht mehr.');
  }

/* ---------- 4. Die zweite Schranke: --mit-daten braucht den Nachweis ------ */
console.log('');
pruefe('veroeffentlichen.mjs kennt .access-geprueft.json noch',
  /access-geprueft\.json/.test(src), true);
pruefe('… und verweigert ohne ihn den Dienst',
  /mitDaten[\s\S]{0,600}access-geprueft/.test(src) || /access-geprueft[\s\S]{0,600}process\.exit/.test(src), true);

/* ---------- ⛔ STOERTEST ---------- */
console.log('\n=== Stoertest ===');
{
  let s = 0;
  const sP = (was, ist, soll) => { if (ist !== soll){ s++; console.log('  ⛔  ' + was); }
    else console.log('  ok   ' + was); };
  /* ⛔ NUR AUSSAGEN UEBER DAS WERKZEUG. Beim ersten Anlauf stand hier auch
     „die echte Liste sperrt transcripts/" — mit der Folge, dass eine
     VERSTUEMMELTE Sperre den Exitcode 1 („der Stoertest greift nicht") ergab
     statt 2 („die Sperre haelt nicht"). Zum zweiten Mal an diesem Tag derselbe
     Griff: ein kaputtes Schloss meldete sich als kaputter Schluesselpruefer.
     Die Aussage steht oben bei den Faellen. [[kennzeichen_mit_zwei_ursachen]] */
  const leer = (rel) => [].some(r => r.test(rel));
  sP('eine leere Sperrliste sperrt nichts', leer('transcripts/x.txt'), false);
  const beispielListe = (rel) => [/^transcripts[\\/]/i].some(r => r.test(rel));
  sP('eine Beispielliste mit dem Ausdruck sperrt sehr wohl', beispielListe('transcripts/x.txt'), true);
  /* Und ein Ausdruck, der nur einen TEIL trifft, darf nicht als Sperre gelten. */
  const halb = (rel) => [/^transcript$/].some(r => r.test(rel));
  sP('ein zu enger Ausdruck sperrt den echten Pfad NICHT', halb('transcripts/x.txt'), false);
  sP('die Ordnerliste ist nicht leer', alle.length > 50, true);
  sP('sie enthaelt wirklich einen gesperrten Pfad', gesperrt.length > 0, true);
  if (s){ console.log('\n⛔ Der Stoertest greift nicht — diese Messung unterscheidet nichts.'); process.exit(1); }
}

console.log('');
if (fehler){
  console.log('⛔ ' + fehler + ' Fall/Faelle: die Sperrliste haelt nicht, was sie soll.');
  console.log('   ⛔ NICHT ausliefern, bevor das geklaert ist — es geht um AGB 3.7 und 9.');
  process.exit(2);
}
console.log('✅ Die Sperrliste haelt: Transkripte, Abzug und Arbeitsmaterial bleiben');
console.log('   draussen, die App geht mit, und jeder Ausdruck trifft etwas Echtes.');
