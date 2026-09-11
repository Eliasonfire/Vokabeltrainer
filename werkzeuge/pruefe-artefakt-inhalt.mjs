/* pruefe-artefakt-inhalt.mjs — welche Artefaktseite traegt gesperrtes Material?
 * ==========================================================================
 *
 * ⛔⛔ DIE FRAGE, DIE VORHER NIEMAND GESTELLT HAT
 *
 * `transcripts/` und `data/vokabeln-*.js` sind per .gitignore gesperrt —
 * arabicroots AGB 3.7 und 9, unerlaubte Weitergabe von Kursmaterial. Die
 * Sperre gilt fuer das REPO. Aber die Artefaktseiten werden auf claude.ai
 * veroeffentlicht, und dort greift keine .gitignore.
 *
 * Am 21.08.2026 nachgemessen: `artefakte/freigabe.html` enthaelt den
 * WOERTLICHEN Wortlaut von 41 der 45 Regelkandidaten. Als Artefakt ist die
 * Seite privat, das ist in Ordnung — aber sie ist einen Klick vom Teilen
 * entfernt, und niemand sah ihr das an.
 *
 * ⭐ Alle zehn Seiten wurden gemessen, nicht nur die verdaechtige. Neun sind
 * sauber. Eine Sammelaussage ohne Einzelbeleg waere hier wertlos gewesen.
 * [[sammelaussage_einzeln_belegen]]
 *
 * ==========================================================================
 * Aufruf:  node werkzeuge/pruefe-artefakt-inhalt.mjs
 *
 * Exitcode 0 = jede Seite mit gesperrtem Material traegt ihren Hinweis
 * Exitcode 2 = eine Seite traegt Kursmaterial OHNE sichtbaren Vorbehalt
 *
 * ⚠️ Das Werkzeug verbietet nichts. Es sorgt dafuer, dass der Vorbehalt auf
 * der SEITE steht und nicht nur im Quelltext des Skripts, das sie erzeugt —
 * ein Hinweis, den der Leser nicht sieht, wirkt nicht.
 * [[regel_gilt_nur_mit_begruendung]]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AUS  = path.join(REPO, 'artefakte');
const KAND = path.join(REPO, 'transcripts', 'kandidaten');

if (!fs.existsSync(AUS)){ console.log('Kein artefakte/ — nichts zu pruefen.'); process.exit(0); }

/* ---------- Die Textproben, nach denen gesucht wird ---------- */
/* ⛔ Nicht nach Stichwoertern wie „Transkript" suchen — das faende Kommentare
   und keine Inhalte. Gesucht wird der WORTLAUT selbst, in Stuecken, die lang
   genug sind, um nicht zufaellig zu treffen.
   [[stichworttreffer_ist_kein_inhaltstreffer]] */
const proben = [];
if (fs.existsSync(KAND)){
  for (const d of fs.readdirSync(KAND).filter(f => /^folge-\d+\.json$/.test(f))){
    try {
      const j = JSON.parse(fs.readFileSync(path.join(KAND, d), 'utf8'));
      for (const k of (j.kandidaten || [])){
        const s = String(k.text || '').replace(/\s+/g, ' ').trim().slice(0, 60);
        if (s.length >= 40) proben.push({ quelle: d, text: s });
      }
    } catch { /* kaputte Datei: dann eben ohne sie */ }
  }
}
if (!proben.length){
  console.log('Keine Transkript-Kandidaten gefunden (transcripts/ liegt nicht vor).');
  console.log('⚠️ Das ist KEIN gruener Befund — es wurde nichts geprueft.');
  process.exit(0);
}
console.log(proben.length + ' Textproben aus ' + new Set(proben.map(p => p.quelle)).size + ' Folgendatei(en).');
console.log('');

/* Woran erkennt man den sichtbaren Vorbehalt? An dem Satz, den
   freigabe-artefakt.mjs in den Seitenkopf schreibt. */
const HINWEIS = /nicht teilen/i;

let befunde = 0;
const seiten = fs.readdirSync(AUS).filter(f => f.endsWith('.html')).sort();
for (const f of seiten){
  const h = fs.readFileSync(path.join(AUS, f), 'utf8');
  const treffer = proben.filter(p => h.includes(p.text)).length;
  if (!treffer){ console.log('  ok   ' + f.padEnd(34) + '0 Treffer'); continue; }
  const hat = HINWEIS.test(h);
  if (hat){
    console.log('  ok   ' + f.padEnd(34) + treffer + ' Treffer — Hinweis „nicht teilen" steht auf der Seite');
  } else {
    befunde++;
    console.log('  ⛔   ' + f.padEnd(34) + treffer + ' Treffer — KEIN sichtbarer Vorbehalt');
  }
}

/* ---------- Und die Datei, die WIRKLICH veroeffentlicht wird ----------
 *
 * ⭐⭐ Der wichtigere Teil. Die Artefaktseiten sind privat; `grammar-data.js`
 * dagegen wird ausgeliefert — sie steht in der Weissliste von
 * veroeffentlichen.mjs und liegt hinter Elias' Cloudflare-Access, aber sie
 * IST das ausgelieferte Material.
 *
 * Die .gitignore-Begruendung sagt dazu: „Nur die kuratierten, selbst
 * formulierten Regeln in grammar-data.js werden committet." Kurzzitate des
 * Lehrers mit Quellenangabe gehoeren zu dieser Kuratierung — ein Beleg ohne
 * Wortlaut ist keiner.
 *
 * ⛔ Gemessen wird deshalb nicht „gibt es Zitate" (ja, und das ist richtig so),
 * sondern die LAENGE des laengsten zusammenhaengenden Stuecks. Zehn Treffer
 * von je 50 Zeichen koennen ein einziges 500-Zeichen-Stueck sein oder zehn
 * verstreute Saetze — nur die Laenge trennt Zitat von Abzug.
 *
 * Stand 21.08.2026, gemessen:
 *     10 Uebernahmen ab 40 Zeichen
 *     laengste 102 Zeichen ("Das sehen wir, was man aendert, …")
 *     zusammen 601 von 41.148 Zeichen Kandidatentext = 1,5 %
 *     jede einzelne unter 12 % ihres Abschnitts
 *
 * Die Schwelle steht bei 200 — dem Doppelten des heutigen Hoechstwerts. Genug
 * Luft fuer ein laengeres Zitat, weit unter einem Abschnitt. Sie ist kein
 * Rechtsurteil, sondern eine Marke, an der eine Veraenderung auffaellt.
 */
const GRENZE = 200;
/* ⭐ Seit dem 11.09.2026 ZWEI ausgelieferte Dateien mit Unterrichtszitaten:
   grammar-data.js und regelsammlung-data.js (die neun Karten aus Folge 19 mit
   Lehrer-Zitaten und Minute). Dieselbe Marke gilt für beide — eine Entscheidung
   für die erste Datei gilt auch für die zweite.
   [[entscheidung_gilt_fuer_das_zweite_werkzeug]]
   Gemessen beim Bau, gegen das GANZE Rohtranskript der Folge 19: das längste
   Stück in regelsammlung-data.js war zuerst 170 Zeichen („diese vier, die sind
   uns von Anfang an begegnet …"), auf 123 gekürzt. ⚠️ Diese Prüfung misst
   gegen transcripts/kandidaten/ — nur Ausschnitte — und findet deshalb
   weniger (74 am 11.09.2026). Sie ist eine Untergrenze, keine Vollmessung. */
for (const zielDatei of ['grammar-data.js', 'regelsammlung-data.js']){
const gd = path.join(REPO, zielDatei);
let laengste = 0, laengstesStueck = '', summe = 0, anzahl = 0;
if (fs.existsSync(gd) && fs.existsSync(KAND)){
  const ziel = fs.readFileSync(gd, 'utf8');
  for (const d of fs.readdirSync(KAND).filter(f => /^folge-\d+\.json$/.test(f))){
    let j; try { j = JSON.parse(fs.readFileSync(path.join(KAND, d), 'utf8')); } catch { continue; }
    for (const k of (j.kandidaten || [])){
      const t = String(k.text || '').replace(/\s+/g, ' ').trim();
      for (let i = 0; i + 40 <= t.length; i++){
        if (!ziel.includes(t.slice(i, i + 40))) continue;
        let len = 40;
        while (i + len < t.length && ziel.includes(t.slice(i, i + len + 1))) len++;
        anzahl++; summe += len;
        if (len > laengste){ laengste = len; laengstesStueck = t.slice(i, i + len); }
        i += len;
      }
    }
  }
  console.log(zielDatei + ' — woertliche Uebernahmen aus dem Unterricht:');
  console.log('  ' + anzahl + ' Stueck(e) ab 40 Zeichen, zusammen ' + summe + ' Zeichen.');
  console.log('  laengstes: ' + laengste + ' Zeichen (Grenze ' + GRENZE + ')');
  if (laengste) console.log('    ' + JSON.stringify(laengstesStueck.slice(0, 110)));
  if (laengste > GRENZE){
    befunde++;
    console.log('  ⛔ Das ist kein Kurzzitat mehr. Nachsehen, ob der Abschnitt');
    console.log('     wirklich als Beleg gebraucht wird — ' + zielDatei + ' WIRD ausgeliefert.');
  }
  console.log('');
}
}

/* ---------- Und alles ANDERE, was wirklich ausgeliefert wird (09.09.2026) ----
 *
 * ⛔⛔ DIE LUECKE: oben stehen `artefakte/` (privat) und `grammar-data.js`
 * (ausgeliefert). Nicht angesehen wurde der REST von `.deploy/` — und dort
 * liegen 18 `vorschau-*.html`, die ueber eine MUSTERregel in die Weissliste
 * kommen:
 *
 *     fs.readdirSync(WURZEL).filter(f => /^vorschau.*\.html$/.test(f))
 *
 * Also ohne dass jemand die einzelne Seite je freigegeben haette. Genau die
 * Sorte Seite, bei der der Fall am 21.08. aufgefallen ist: von Hand gebautes
 * HTML, in das Inhalt hineinkopiert wurde. Eine Entscheidung, die fuer
 * `artefakte/` getroffen wurde, gilt auch fuer den zweiten Ort.
 * [[entscheidung_gilt_fuer_das_zweite_werkzeug]]
 *
 * ⭐ GEMESSEN, bevor gebaut wurde: 58 ausgelieferte Textdateien (68 abzueglich
 * der 10, die das Material sein duerfen), **0 Treffer** aus 79
 * Unterrichtsproben. Die Seiten sind sauber — der Abschnitt bewacht also den
 * naechsten Einfuegevorgang, er raeumt nichts auf.
 *
 * ⚠️ Die erste Messung nannte „68 geprueft" und meinte die Zahl VOR dem
 * Ueberspringen — die Zaehlung stand neben einer Schleife, die zehn Dateien
 * auslaesst. Hier wird gezaehlt, was wirklich angesehen wurde.
 * [[aufgabenzahl_haengt_am_filter]]
 *
 * ⛔ VERWORFEN, mit Grund: als zweite Probe lagen die deutschen Bedeutungen
 * des Abzugs nahe (2040 Stueck ab 18 Zeichen). Sie melden 11 Dateien —
 * darunter `vocab-data.js`, `quran-text.js` und `js/kern.js` — und **jeder
 * einzelne Treffer war Zufall**: „Onkel vaeterlicherseits", „weiterfuehrende
 * Schule", „zur Rechenschaft ziehen". Eine deutsche Glosse ist die kuerzeste
 * Fassung ihrer Bedeutung und entsteht unabhaengig wieder; sie taugt nicht als
 * Fingerabdruck. Die Transkriptproben (40-60 Zeichen gesprochener Satz) tun es.
 * Nicht wieder einbauen. [[stichworttreffer_ist_kein_inhaltstreffer]] */
let deployGeprueft = null;   /* null = kein .deploy/ da; sonst die Anzahl */
{
  const DEPLOY = path.join(REPO, '.deploy');
  if (!fs.existsSync(DEPLOY)){
    console.log('⚠️ Kein .deploy/ — die ausgelieferten Dateien wurden NICHT geprueft.');
    console.log('   Erst `node werkzeuge/veroeffentlichen.mjs --pruefen`, dann hier nachsehen.');
  } else {
    /* Die Dateien, die das Material sein DUERFEN: der Abzug selbst, und
       grammar-data.js — dort misst der Abschnitt darueber die Laenge. */
    const ERLAUBT = /^data[\\/]vokabeln-|^grammar-data\.js$/;
    const dateien = [];
    (function lauf(d, praefix){
      for (const e of fs.readdirSync(d, { withFileTypes: true })){
        const p = path.join(d, e.name);
        if (e.isDirectory()) lauf(p, praefix + e.name + '/');
        else if (/\.(html|js|json|css|txt)$/i.test(e.name)) dateien.push({ rel: praefix + e.name, p });
      }
    })(DEPLOY, '');
    let mitTreffer = 0, geprueft = 0;
    for (const { rel, p } of dateien){
      if (ERLAUBT.test(rel)) continue;
      geprueft++;
      const h = fs.readFileSync(p, 'utf8');
      const treffer = proben.filter(x => h.includes(x.text)).length;
      if (!treffer) continue;
      mitTreffer++; befunde++;
      console.log('  ⛔   ' + rel.padEnd(34) + treffer + ' Unterrichtsstelle(n) WOERTLICH — und die Datei wird ausgeliefert');
    }
    deployGeprueft = geprueft;
    console.log('Ausgeliefert (.deploy/): ' + geprueft + ' Textdatei(en) gegen '
      + proben.length + ' Unterrichtsproben, ' + mitTreffer + ' mit Treffern.');
    console.log('');
  }
}

if (befunde){
  console.log('⛔ ' + befunde + ' Befund(e).');
  console.log('   Bei Artefaktseiten: den Vorbehalt in den KOPF der Seite schreiben,');
  console.log('   nicht nur in den Kommentar des erzeugenden Skripts.');
  process.exit(2);
}
/* ---------- ⛔ STOERTEST (09.09.2026) ----------

   ⛔ Hier haengt Rechtliches dran (arabicroots AGB 3.7 und 9). Ein Pruefer,
   der still nichts sucht, sieht genauso aus wie einer, der nichts findet —
   und dann glaubt man, es sei geprueft. Der Kopf dieser Datei sagt das an
   einer Stelle schon selbst („Das ist KEIN gruener Befund — es wurde nichts
   geprueft"), aber nur fuer den Fall ohne Transkripte.
   [[stoertest_muss_wirkung_nachweisen]] [[leere_liste_ist_keine_messung]]

   Drei Faelle, deren Antwort feststeht — mit derselben Erkennung wie oben. */
console.log('=== Stoertest ===');
let stoer = 0;
const sProbe = (was, ist, soll) => {
  if (ist !== soll){ stoer++; console.log('  ⛔  ' + was + ': ' + ist + ' statt ' + soll); }
  else console.log('  ok   ' + was);
};
{
  const beispiel = proben[0].text;
  const ohneHinweis = '<html><body><p>' + beispiel + '</p></body></html>';
  const mitHinweis  = '<html><body><p>⛔ Bitte nicht teilen.</p><p>' + beispiel + '</p></body></html>';
  const leer        = '<html><body><p>Nichts davon.</p></body></html>';
  const zaehle = (h) => proben.filter(p => h.includes(p.text)).length;

  sProbe('eine Seite MIT Wortlaut wird gefunden', zaehle(ohneHinweis) > 0, true);
  sProbe('und ohne Vorbehalt waere sie ein Befund', HINWEIS.test(ohneHinweis), false);
  sProbe('mit sichtbarem Vorbehalt ist sie in Ordnung', HINWEIS.test(mitHinweis), true);
  sProbe('eine Seite OHNE Wortlaut bleibt still', zaehle(leer), 0);
  /* ⚠️ Und die Probe auf die Probe: gaebe es keine Textproben, waere alles
     oben bedeutungslos.

     ⛔ HIER STAND „Am 09.09.2026 waren es 253" — nachgezaehlt am selben Tag
     sind es **79**, aus 6 Folgendateien, und zwar ALLE Kandidaten (jeder ist
     laenger als 40 Zeichen, die Schwelle wirft keinen weg). Woher die 253 kam,
     ist nicht mehr feststellbar; sie ist jedenfalls nicht diese Zahl. Eine
     Zahl im Kommentar wird spaeter zitiert, als waere sie gemessen.
     [[zahlen_ohne_beleg]]
     Nachzaehlen:
       node -e "…transcripts/kandidaten/folge-*.json → kandidaten.length" */
  sProbe('es gibt ueberhaupt Textproben (>= 20)', proben.length >= 20, true);

  /* ⭐ Und dasselbe fuer den Abschnitt ueber `.deploy/`: laeuft der Durchlauf
     ins Leere (falscher Pfad, leerer Ordner, Endungsfilter zu eng), meldet er
     „0 mit Treffern" und sieht aus wie ein sauberer Befund. Ist gar kein
     .deploy/ da, wurde oben gewarnt — dann steht hier `null` und die Probe
     entfaellt bewusst. [[leere_liste_ist_keine_messung]] */
  sProbe('der Durchlauf durch .deploy/ hat etwas angesehen (>= 20 oder kein Ordner)',
    deployGeprueft === null || deployGeprueft >= 20, true);
}
if (stoer){
  console.log('');
  console.log('⛔ ' + stoer + ' Stoertest(s) gescheitert — dieser Pruefer misst nicht,');
  console.log('   und sein „alles in Ordnung" ist damit wertlos.');
  process.exit(1);
}
console.log('');

console.log('✅ Jede Seite mit Kursmaterial traegt ihren Vorbehalt sichtbar,');
console.log('   und die Zitate in grammar-data.js bleiben Kurzzitate.');
