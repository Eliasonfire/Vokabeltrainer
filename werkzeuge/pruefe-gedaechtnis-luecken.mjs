/* pruefe-gedaechtnis-luecken.mjs — steht JEDER frische Commit im Gedächtnis?
 * ===========================================================================
 *
 * ⛔⛔ DER ANLASS: eine Frage von Elias (09.09.2026, 15:11)
 *
 *   „ist gedächtnis wirklich aktuell"
 *
 * Ich hatte es behauptet, und drei Prüfer standen auf Grün. Sie waren trotzdem
 * keine Antwort:
 *
 *   gedaechtnis-frisch.mjs      wann wurde zuletzt GESCHRIEBEN (mtime)
 *   pruefe-gedaechtnis-zahlen   stimmen die genannten ZAHLEN
 *   pruefe-datumsangaben        stimmen Datum, Uhrzeit, Reihenfolge
 *
 * Keiner von ihnen prüft, ob etwas FEHLT. Nachgemessen ergab: 91 von 92
 * Commits des Tages waren auffindbar, einer nicht (`4d093a1`). Sein Inhalt
 * stand da, nur der Beleg fehlte — und genau daran hängt später die Frage
 * „wann und womit war das eigentlich".
 *
 * ⭐ „Grün" heißt „das Geprüfte stimmt", nicht „es ist vollständig".
 * Vollständigkeit braucht eine Liste von AUSSEN — hier `git log`.
 * [[gruener_pruefer_beweist_nur_geprueftes]] [[zahlen_ohne_beleg]]
 *
 * ==========================================================================
 * DIE REGEL
 *
 *   Jeder Commit SEIT MITTERNACHT muss mit seinem kurzen Hash in
 *   einer der beiden Pflichtnotizen vorkommen.
 *
 * ⚠️ Das Fenster ist bewusst klein. Für ältere Commits ist die Frage
 * beantwortet oder überholt, und ein Prüfer, der jeden Tag dieselben
 * fünfhundert alten Hashes durchgeht, findet nichts und kostet nur Zeit.
 *
 * ⚠️ Und er prüft die eine Richtung: log → Notiz. Die andere (ein Hash in der
 * Notiz, den es nicht gibt) misst pruefe-datumsangaben bereits — dort steht
 * auch der Grund, warum 31 Hashes nach der Historien-Umschreibung vom
 * 08.09.2026 nur noch als Objekt existieren.
 *
 * Aufruf:  node werkzeuge/pruefe-gedaechtnis-luecken.mjs [--tage N]
 * Exit 0 = jeder frische Commit steht drin · 1 = Störtest greift nicht
 *       2 = einer fehlt
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VAULT = 'G:\\1. Workspace\\Obsidian\\Gedächtnis\\Elias Gedächtnis\\03 - Projekte';
const NOTIZEN = ['To-Do Vokabeltrainer.md', 'Vokabeltrainer-Arabisch.md'];

/* ⛔⛔ DAS FENSTER BEGINNT UM MITTERNACHT, NICHT „VOR ZWEI TAGEN".
 *
 * Der erste Lauf am 09.09.2026 nahm zwei Tage und meldete 29 fehlende
 * Commits — alle vom 08.09., und KEINER davon war ein Versäumnis. An jenem Tag
 * wurden „zwei Belegdateien und vier Langenscheidt-Seiten aus allen Commits
 * entfernt"; eine Umschreibung der Historie vergibt NEUE Hashes. Im Gedächtnis
 * stehen die alten, im `git log` die neuen — sie können sich gar nicht
 * treffen. Denselben Fall beschreibt pruefe-datumsangaben aus der anderen
 * Richtung („31 von 651 zeigen ins Leere").
 *
 * Zum sechsten Mal an diesem Tag: der erste Befund eines frischen Werkzeugs
 * war ein Artefakt seiner eigenen Annahme. [[mein_neues_werkzeug_ist_verdaechtig]]
 *
 * Der laufende Tag ist ohnehin der einzige, für den Regel 2 noch etwas ändern
 * kann. Wer weiter zurück sehen will, nimmt `--tage N` und liest das Ergebnis
 * mit diesem Absatz im Kopf. */
const i = process.argv.indexOf('--tage');
const TAGE = i >= 0 ? Math.max(1, Number(process.argv[i + 1]) || 1) : 0;
const SEIT = TAGE ? TAGE + ' days ago' : 'midnight';
const FENSTER = TAGE ? ('letzten ' + TAGE + ' Tage') : 'seit Mitternacht';

console.log('--- Steht jeder frische Commit im Gedaechtnis? ---\n');

/* Die Notizen. Fehlt der Ordner, ist es ein fremder Rechner — kein Fehler. */
let text = '';
if (!fs.existsSync(VAULT)){
  console.log('⚠️ Vault-Ordner nicht da — fremder Rechner, uebersprungen.');
  process.exit(0);
}
for (const n of NOTIZEN){
  const p = path.join(VAULT, n);
  if (!fs.existsSync(p)){
    console.log('⛔ Pflichtnotiz fehlt: ' + n);
    console.log('   Der Ordner ist da, die Datei nicht — hier fehlt etwas.');
    process.exit(2);
  }
  text += '\n' + fs.readFileSync(p, 'utf8');
}

/* Die Commits von aussen. */
let zeilen = [];
try {
  zeilen = execFileSync('git',
    ['-C', REPO, 'log', '--since=' + SEIT, '--format=%h\t%ad\t%s',
     '--date=format:%d.%m. %H:%M'],
    { encoding: 'utf8', maxBuffer: 20e6 }).split(/\r?\n/).filter(Boolean);
} catch (e){
  console.log('⛔ `git log` nicht lesbar: ' + e.message);
  process.exit(2);
}
console.log('  ' + zeilen.length + ' Commit(s) ' + FENSTER + '.');

const fehlend = [];
for (const z of zeilen){
  const [hash, wann, betreff] = z.split('\t');
  if (!text.includes(hash)) fehlend.push({ hash, wann, betreff });
}
console.log('  ' + (zeilen.length - fehlend.length) + ' davon stehen im Gedaechtnis, '
  + fehlend.length + ' nicht.\n');
for (const f of fehlend.slice(0, 12))
  console.log('  ⛔ ' + f.hash + '  ' + f.wann + '  ' + f.betreff.slice(0, 70));
if (fehlend.length > 12) console.log('  … und ' + (fehlend.length - 12) + ' weitere');

/* ---------- ⛔ STOERTEST ---------- */
console.log('\n=== Stoertest ===');
{
  let s = 0;
  const sP = (was, ist, soll) => { if (ist !== soll){ s++; console.log('  ⛔  ' + was
    + ': ' + JSON.stringify(ist)); } else console.log('  ok   ' + was); };
  /* Kann diese Suche ueberhaupt etwas NICHT finden? */
  sP('ein erfundener Hash steht nicht im Gedaechtnis', text.includes('0000000'), false);
  /* ⛔ HIER STAND EINE PROBE, DIE IMMER BESTAND: „gefunden ODER in der
     Fehlliste" ist bei jedem Hash wahr — sie hat nichts unterschieden.
     Jetzt wird ein Hash genommen, der nachweislich DASTEHT, und verlangt,
     dass die Suche ihn auch findet. Gibt es keinen einzigen, ist das selbst
     der Befund und die Probe faellt durch. [[pruefwerkzeug_mit_eingebauter_antwort]] */
  const gefunden = zeilen.map(z => z.split('\t')[0]).filter(h => !fehlend.some(f => f.hash === h));
  sP('ein Hash, der dasteht, wird auch gefunden',
    gefunden.length > 0 && text.includes(gefunden[0]), true);
  sP('die Notizen wurden wirklich gelesen (>= 100k Zeichen)', text.length > 100000, true);
  sP('git log hat etwas geliefert', zeilen.length > 0, true);
  if (s){ console.log('\n⛔ Der Stoertest greift nicht — diese Messung sagt nichts.'); process.exit(1); }
}

console.log('');
if (fehlend.length){
  console.log('⛔ ' + fehlend.length + ' Commit(s) ohne Spur im Gedaechtnis.');
  console.log('   Regel 2 der Nachtschicht: nach JEDEM Commit speichern. Fehlt der Hash,');
  console.log('   fehlt spaeter die Antwort auf „wann und womit war das eigentlich".');
  process.exit(2);
}
console.log('✅ Jeder Commit ' + FENSTER + ' steht im Gedaechtnis.');
