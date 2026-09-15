/* test-luecken-ohne-commit.mjs — bewacht EINE Zusicherung von
 * `werkzeuge/pruefe-gedaechtnis-luecken.mjs`:
 *
 *     Ein Tag ohne Commit ist kein Befund.
 *
 * ==========================================================================
 * ⛔⛔ DER ANLASS (gefunden im Wartungslauf am 13.09.2026, behoben 15.09.)
 *
 * Der Prüfer wurde **jeden Sonntag rot**, ohne dass irgendetwas kaputt war.
 * Sein Fenster ist „seit Mitternacht"; der Sonntagslauf feuert um 13:00, und an
 * dem Tag war um diese Zeit noch nichts committet. Dann ist `zeilen.length === 0`,
 * und zwei Störtest-Proben fallen durch — „git log hat etwas geliefert" und
 * „ein Hash, der dasteht, wird auch gefunden". Exitcode 1, „diese Messung sagt
 * nichts".
 *
 * Formal richtig, praktisch schädlich: ein Prüfer, der regelmäßig ohne Grund
 * rot wird, wird beim dritten Mal überlesen — und dann auch an dem Tag, an dem
 * er recht hat. [[kandidatenliste_ist_keine_fehlerliste]]
 *
 * ==========================================================================
 * ⭐ WARUM DIESER TEST UND NICHT NUR DER EINGEBAUTE STÖRTEST
 *
 * Der eingebaute Störtest prüft, ob die SUCHE etwas taugt. Er kann nicht
 * prüfen, wie sich der Prüfer verhält, wenn es **nichts zu suchen** gibt — dazu
 * müsste er sich selbst leeren. Genau diesen Fall stellt dieser Test her.
 *
 * ⛔⛔ UND ER PRÜFT BEIDE FASSUNGEN. Ein Test, der nur die heutige Fassung
 * gegen „Exit 0" hält, bestünde auch dann, wenn die Änderung gar nichts
 * bewirkt hätte. Deshalb kommt die Fassung von `HEAD` dazu, und sie MUSS
 * durchfallen, solange der Fix nicht committet ist. Ist er committet, sind
 * beide gleich — dann fällt diese Hälfte weg, und der Test sagt es selbst.
 * [[pruefwerkzeug_mit_eingebauter_antwort]]
 *
 * ⚠️ Zwei Eingriffe sind nötig, beide teuer erkauft:
 *   1. `zeilen = []` vor die Ausgabe der Commit-Zahl — der leere Fall.
 *   2. `REPO` überschreiben. Der Prüfer leitet ihn aus seinem EIGENEN Pfad ab
 *      (`dirname(import.meta.url) + '/..'`); eine Kopie im Scratchpad zeigt
 *      damit ins Scratchpad, und `git` antwortet „not a git repository".
 *      Ohne diesen Eingriff enden BEIDE Fassungen mit Exit 2, und der Test
 *      vergleicht zwei Fehlschläge miteinander.
 *
 * Aufruf:  node test-luecken-ohne-commit.mjs
 * Exit 0 = alles wie zugesichert · 1 = die Zusicherung hält nicht
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const REPO = path.dirname(fileURLToPath(import.meta.url));
const DATEI = 'werkzeuge/pruefe-gedaechtnis-luecken.mjs';
const NL = String.fromCharCode(10);

const ANKER = 'console.log(' + "'  '" + ' + zeilen.length';
const REPO_ALT = "const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');";

let fehler = 0;
const pruefe = (was, ist, soll) => {
  if (ist === soll) console.log('  ok   ' + was);
  else { fehler++; console.log('  ⛔   ' + was + ': ' + JSON.stringify(ist)
    + ' (erwartet ' + JSON.stringify(soll) + ')'); }
};

function praepariere(quelle){
  if (!quelle.includes(ANKER) || !quelle.includes(REPO_ALT)) return null;
  const mit = quelle.replace(REPO_ALT, 'const REPO = ' + JSON.stringify(REPO) + ';');
  const i = mit.indexOf(ANKER);
  return mit.slice(0, i) + 'zeilen = [];' + NL + mit.slice(i);
}

function lauf(quelle){
  const vorbereitet = praepariere(quelle);
  if (!vorbereitet) return { code: null, aus: '(Anker nicht gefunden)' };
  const pfad = path.join(os.tmpdir(), 'luecken-probe-' + process.pid + '-'
    + Math.random().toString(36).slice(2) + '.mjs');
  fs.writeFileSync(pfad, vorbereitet, 'utf8');
  let code = 0, aus = '';
  try { aus = execFileSync(process.execPath, [pfad], { encoding: 'utf8', cwd: REPO }); }
  catch (e){ code = e.status; aus = String(e.stdout || '') + String(e.stderr || ''); }
  finally { try { fs.unlinkSync(pfad); } catch {} }
  return { code, aus };
}

console.log('--- Ein Tag ohne Commit ist kein Befund ---');
console.log('');

/* ---- 1. Die heutige Fassung ---- */
const jetzt = fs.readFileSync(path.join(REPO, DATEI), 'utf8');
const a = lauf(jetzt);
console.log('Arbeitskopie bei leerem git log:');
pruefe('endet mit Exit 0', a.code, 0);
pruefe('sagt „Nichts zu pruefen"', a.aus.includes('Nichts zu pruefen'), true);
pruefe('sagt NICHT „Der Stoertest greift nicht"',
  a.aus.includes('Der Stoertest greift nicht'), false);
/* ⭐ Die zwei Proben, die auch ohne Commits etwas aussagen, laufen weiter —
   sonst waere aus dem Fix ein Loch geworden. */
pruefe('prueft trotzdem den erfundenen Hash',
  a.aus.includes('ein erfundener Hash steht nicht im Gedaechtnis'), true);
pruefe('prueft trotzdem, dass die Notizen gelesen wurden',
  a.aus.includes('die Notizen wurden wirklich gelesen'), true);

/* ---- 2. Gegenprobe: die Fassung von HEAD ---- */
console.log('');
let vorher = null;
try {
  vorher = execFileSync('git', ['-C', REPO, 'show', 'HEAD:' + DATEI],
    { encoding: 'utf8', maxBuffer: 20e6 });
} catch { /* kein Repo oder keine Historie — dann entfaellt die Gegenprobe */ }

if (vorher === null){
  console.log('⚠️ Gegenprobe entfaellt: `git show HEAD` nicht lesbar.');
} else if (vorher === jetzt){
  console.log('ⓘ  Gegenprobe entfaellt: HEAD ist schon die neue Fassung.');
  console.log('   Das ist der Normalzustand nach dem Commit — der Test oben');
  console.log('   bewacht die Zusicherung dann allein.');
} else {
  const b = lauf(vorher);
  console.log('Fassung von HEAD bei leerem git log (muss durchfallen):');
  pruefe('endet NICHT mit 0', b.code === 0, false);
}

console.log('');
if (fehler){
  console.log('⛔ ' + fehler + ' Zusicherung(en) halten nicht.');
  process.exit(1);
}
console.log('✔ alles wie zugesichert');
