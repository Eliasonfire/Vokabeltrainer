/* pruefe-zeitmarken.mjs — versteht jeder Zeitstempel-Leser einen LEEREN Stempel?
 * ==========================================================================
 *
 * ⛔⛔ DER ANLASS (09.09.2026)
 *
 * Vier Dateien lesen „46:29" in Sekunden um, und alle vier hatten dieselbe
 * Zeile:
 *
 *     const t = String(s || '').trim().split(':').map(Number);
 *     if (t.some(isNaN) || !t.length) return null;
 *
 * Bei einem LEEREN Stempel liefert das die Zahl **0**, nicht `null`:
 * `''.split(':')` ist `['']`, `Number('')` ist `0`, und `isNaN(0)` ist falsch.
 *
 * Das ist kein Schoenheitsfehler. Jeder der vier Aufrufer prueft ausdruecklich
 * auf `null` — `s == null ? null : belegtext(…)`, `.filter(s => s != null)`,
 * `if (t === null) { ohneZeit++; continue; }`. An dieser Zeile lief der Schutz
 * ins Leere: statt „diese Regel hat keinen Zeitstempel" hiess es dann „diese
 * Regel steht bei Sekunde 0", und gemessen wurde die Begruessung am Anfang der
 * Folge. Eine Prozentzahl oder ein Belegtext von dort sieht aus wie ein Befund.
 * [[ausfall_ist_unsichtbar_gebaut]] [[vorgabewert_sieht_aus_wie_befund]]
 *
 * ⭐ Heute trifft es keine Regel (91 mit `source`, 0 davon mit leerem Stempel,
 * gemessen am 09.09.2026). Es ist eine Falle fuer die naechste — und weil die
 * Zeile schon viermal abgeschrieben wurde, auch fuer die fuenfte Kopie.
 * Deshalb kein Listeneintrag je Datei, sondern eine Regel, die jede Kopie
 * findet. [[allgemeine_regel_statt_listeneintrag]]
 * [[entscheidung_gilt_fuer_das_zweite_werkzeug]]
 *
 * ==========================================================================
 * WIE GEMESSEN WIRD
 *
 * Nicht „steht die Reparatur im Quelltext" — das waere eine Zusicherung im
 * Kommentar. [[zusicherung_im_kommentar_ist_keine_pruefung]] Stattdessen wird
 * jede gefundene Funktion AUS DEM QUELLTEXT GESCHNITTEN, ausgefuehrt und
 * befragt. Was hier gruen ist, ist an der echten Funktion gemessen.
 * [[testvorlage_selbst_nachgebaut]]
 *
 * Aufruf:  node werkzeuge/pruefe-zeitmarken.mjs
 *          node werkzeuge/pruefe-zeitmarken.mjs --zeigen   (Quelltext dazu)
 *
 * Exitcode 0 = jeder Zeitstempel-Leser antwortet auf einen leeren Stempel
 *              mit null
 *          1 = der Stoertest greift nicht — dieser Pruefer misst nichts
 *          2 = mindestens einer liefert eine ZAHL, wo keine Zeit steht
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ohneKommentareUndTexte } from './js-quelltext.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ZEIGEN = process.argv.includes('--zeigen');

/* Ordner, die nicht mitgelesen werden. `.deploy` ist eine Kopie (jeder Befund
   stuende doppelt da), `transcripts` und `data/vokabeln-*` sind gesperrtes
   Kursmaterial, `node_modules` ist fremd. */
const AUS = new Set(['node_modules', '.deploy', '.git', 'transcripts', 'artefakte', 'quellen']);
/* ⛔ quran-text.js ist 2,3 MB. Sie enthaelt keinen Zeitstempel-Leser, aber sie
   einzulesen kostet unnoetig — die Grenze haelt jede Datendatei draussen. */
const MAX_BYTES = 400 * 1024;

function dateien(dir, raus = []){
  for (const e of fs.readdirSync(dir, { withFileTypes: true })){
    if (e.name.startsWith('.') && e.name !== '.') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()){ if (!AUS.has(e.name)) dateien(p, raus); continue; }
    if (!/\.(js|mjs|cjs)$/.test(e.name)) continue;
    if (fs.statSync(p).size > MAX_BYTES) continue;
    raus.push(p);
  }
  return raus;
}

/* ---------- Einen Zeitstempel-Leser aus dem Quelltext schneiden ----------

   Gesucht wird die Rechnung selbst, nicht ein Name: `split(':')` gefolgt von
   `.map(Number)`. Ein Werkzeug, das nach `sekunden` sucht, faende `zeitS` und
   `zeit` nicht — und genau die beiden waren die letzten zwei Kopien.

   ⚠️ Gesucht wird auf der Maske OHNE Kommentare, aber MIT Textinhalten: das
   Zielstueck steht in einem String (`':'`). Mit `texte: true` wuerde daraus
   `split('')`, und der Pruefer faende nichts — still. Die Kommentare muessen
   dagegen weg, sonst findet er seine eigene Beschreibung.
   [[stichworttreffer_im_kommentar]] */
const MUSTER = /split\(\s*['"]:['"]\s*\)\s*\.\s*map\(\s*Number\s*\)/g;
const KOPF = /^[ \t]*(?:export[ \t]+)?(?:const|let|var|function)[ \t]+([A-Za-z_$][\w$]*)/;

/* ⛔ Die erste Fassung nahm die naechstbeste Zeile, die mit `const` beginnt —
   und das ist fast immer die ZEILE SELBST (`const t = String(s || '')…`). Der
   Pruefer schnitt dann eine halbe Zeile aus und meldete „nicht ausfuehrbar"
   fuer jede der vier echten Fundstellen. Ein Kopf zaehlt nur, wenn seine
   Klammer VOR dem Treffer aufgeht und NACH ihm wieder zu — sonst umschliesst
   er ihn nicht. [[befund_vor_dem_ende_der_funktion]] */
function schneideFunktion(quelle, maske, treffer){
  let zeilenAnfang = maske.lastIndexOf('\n', treffer) + 1;
  for (let versuch = 0; versuch < 80; versuch++){
    const zeilenEnde = maske.indexOf('\n', zeilenAnfang);
    const zeile = maske.slice(zeilenAnfang, zeilenEnde < 0 ? maske.length : zeilenEnde);
    const m = zeile.match(KOPF);
    if (m){
      const auf = maske.indexOf('{', zeilenAnfang);
      if (auf >= 0 && auf < treffer){
        let tiefe = 0, ende = -1;
        for (let i = auf; i < maske.length; i++){
          if (maske[i] === '{') tiefe++;
          else if (maske[i] === '}'){ tiefe--; if (!tiefe){ ende = i; break; } }
        }
        if (ende > treffer){
          /* Ein abschliessendes `;` gehoert bei `const f = … };` dazu. */
          const schluss = maske[ende + 1] === ';' ? ende + 2 : ende + 1;
          return { name: m[1], quelltext: quelle.slice(zeilenAnfang, schluss).trim() };
        }
      }
    }
    if (zeilenAnfang === 0) break;
    zeilenAnfang = maske.lastIndexOf('\n', zeilenAnfang - 2) + 1;
  }
  return null;
}

/* ---------- Die Fragen, deren Antwort feststeht ---------- */
const FAELLE = [
  { was: "''",            wert: '',            soll: null },
  { was: "'   '",         wert: '   ',         soll: null },
  { was: 'null',          wert: null,          soll: null },
  { was: 'undefined',     wert: undefined,     soll: null },
  { was: "'kein Stempel'", wert: 'kein Stempel', soll: null },
];

function befrage(quelltext, name){
  let f;
  try { f = new Function(quelltext + '\n;return ' + name + ';')(); }
  catch (e){ return { fehler: 'nicht ausfuehrbar: ' + e.message }; }
  if (typeof f !== 'function') return { fehler: name + ' ist keine Funktion' };
  const schlecht = [];
  for (const fall of FAELLE){
    let ist;
    try { ist = f(fall.wert); } catch (e){ ist = 'wirft: ' + e.message; }
    if (ist !== fall.soll) schlecht.push(fall.was + ' → ' + JSON.stringify(ist));
  }
  /* Und die Gegenprobe: ein ECHTER Stempel muss eine Zahl ergeben. Sonst
     bestuende auch eine Funktion, die immer null liefert, jede Pruefung oben.
     [[leere_datei_besteht_jeden_test]] */
  let echt;
  try { echt = f('46:29'); } catch (e){ echt = null; }
  if (!Number.isFinite(echt) || echt <= 0) schlecht.push("'46:29' → " + JSON.stringify(echt) + ' (keine Zeit)');
  return { schlecht, echt };
}

/* ---------- Lauf ---------- */
console.log('--- Zeitstempel-Leser ---\n');
const gefunden = [];
let andere = 0;   /* Doppelpunkt-Zerlegungen, die KEINE Zeit lesen */
for (const p of dateien(REPO)){
  /* ⛔ Die eigene Datei bleibt draussen: der Stoertest unten enthaelt die
     kaputte Fassung als ZEICHENKETTE, und mit `texte: false` steht sie in der
     Maske. Der Pruefer faende sonst sein eigenes Beispiel und meldete sich
     selbst. [[stichworttreffer_ist_kein_inhaltstreffer]] */
  if (path.basename(p) === 'pruefe-zeitmarken.mjs') continue;
  const quelle = fs.readFileSync(p, 'utf8');
  if (!/split\(/.test(quelle)) continue;
  const maske = ohneKommentareUndTexte(quelle, { texte: false });
  MUSTER.lastIndex = 0;
  let m, gesehen = new Set();
  while ((m = MUSTER.exec(maske))){
    /* ⛔ `split(':').map(Number)` zerlegt im Projekt auch Suren-Schluessel
       („2:255") und Kapitelmarken. Das ist eine andere Frage — hier geht es um
       Zeit. Erkannt wird sie an der Rechnung, die Minuten in Sekunden
       umsetzt: irgendwo in der Naehe steht `* 60`. Was das nicht tut, wird
       NICHT stillschweigend verschwiegen, sondern unten gezaehlt.
       [[trefferquote_ohne_preis]] [[kandidatenliste_ist_keine_fehlerliste]] */
    const umfeld = maske.slice(Math.max(0, m.index - 400), m.index + 400);
    if (!/\*\s*60/.test(umfeld)){ andere++; continue; }

    const datei = path.relative(REPO, p).replace(/\\/g, '/');
    const s = schneideFunktion(quelle, maske, m.index);
    if (!s) { gefunden.push({ datei, name: '(nicht ausschneidbar)',
                              quelltext: '', unlesbar: true }); continue; }
    if (gesehen.has(s.name)) continue;
    gesehen.add(s.name);
    gefunden.push({ datei, ...s });
  }
}

if (!gefunden.length){
  console.log('⚠️ KEIN einziger Zeitstempel-Leser gefunden — das ist kein gruener');
  console.log('   Befund, sondern der Verdacht, dass das Suchmuster nicht mehr passt.');
  console.log('   Gesucht wird: split(\':\').map(Number)');
  process.exit(2);
}

let befunde = 0;
for (const g of gefunden){
  if (g.unlesbar){
    befunde++;
    console.log('  ⛔   ' + g.datei + ': Rechnung gefunden, aber die Funktion drumherum');
    console.log('       liess sich nicht ausschneiden — von Hand nachsehen.');
    continue;
  }
  const { schlecht, echt, fehler } = befrage(g.quelltext, g.name);
  if (fehler){
    befunde++;
    console.log('  ⛔   ' + (g.datei + ' · ' + g.name).padEnd(46) + fehler);
    continue;
  }
  if (schlecht.length){
    befunde++;
    console.log('  ⛔   ' + (g.datei + ' · ' + g.name).padEnd(46) + schlecht.join(' · '));
  } else {
    console.log('  ok   ' + (g.datei + ' · ' + g.name).padEnd(46) + "'46:29' → " + echt + ' s');
  }
  if (ZEIGEN) console.log(g.quelltext.split('\n').map(z => '         ' + z).join('\n'));
}
console.log('');
console.log('  ' + gefunden.length + ' Zeitstempel-Leser gemessen.');
if (andere) console.log('  ' + andere + ' weitere `split(\':\').map(Number)` lesen keine Zeit '
  + '(Suren-Schluessel „2:255", Kapitelmarken) — hier nicht geprueft.');

/* ---------- ⛔ STOERTEST ----------

   Der teuerste Fehler waere hier ein Suchmuster, das nichts mehr findet: „0
   Befunde" saehe genauso aus wie „alles in Ordnung". Der Fall oben faengt die
   Null ab; hier wird zusaetzlich gezeigt, dass die Befragung eine kaputte
   Funktion wirklich durchfallen laesst — und eine heile nicht.
   [[stoertest_muss_wirkung_nachweisen]] [[leere_liste_ist_keine_messung]] */
console.log('');
console.log('=== Stoertest ===');
let stoer = 0;
const sProbe = (was, ist, soll) => {
  if (ist !== soll){ stoer++; console.log('  ⛔  ' + was + ': ' + JSON.stringify(ist) + ' statt ' + JSON.stringify(soll)); }
  else console.log('  ok   ' + was);
};
{
  const KAPUTT = "function f(s){ const t = String(s || '').trim().split(':').map(Number);"
    + ' if (t.some(isNaN) || !t.length) return null;'
    + ' return t.reduce((a,b) => a*60+b, 0); }';
  const HEIL = "function f(s){ const r = String(s == null ? '' : s).trim(); if (!r) return null;"
    + " const t = r.split(':').map(Number);"
    + ' if (t.some(isNaN) || !t.length) return null;'
    + ' return t.reduce((a,b) => a*60+b, 0); }';
  const IMMER_NULL = 'function f(s){ return null; }';

  sProbe('die alte, kaputte Fassung faellt durch', befrage(KAPUTT, 'f').schlecht.length > 0, true);
  sProbe('die reparierte Fassung besteht',        befrage(HEIL, 'f').schlecht.length, 0);
  /* ⛔ Eine Funktion, die immer null liefert, erfuellt jede Null-Erwartung
     oben. Ohne die Gegenprobe waere sie der beste Weg, diesen Pruefer
     ruhigzustellen. [[leere_datei_besteht_jeden_test]] */
  sProbe('„immer null" besteht NICHT',            befrage(IMMER_NULL, 'f').schlecht.length > 0, true);

  /* Und das Ausschneiden selbst — an beiden Schreibweisen, die im Projekt
     wirklich vorkommen. */
  const beispiel = 'const vorher = 1;\n'
    + "const zeitS = s => {\n  const t = String(s || '').split(':').map(Number);\n  return t;\n};\n"
    + 'const nachher = 2;\n';
  const maske = ohneKommentareUndTexte(beispiel, { texte: false });
  MUSTER.lastIndex = 0;
  const tr = MUSTER.exec(maske);
  const geschnitten = tr ? schneideFunktion(beispiel, maske, tr.index) : null;
  sProbe('Pfeilfunktion wird gefunden', geschnitten ? geschnitten.name : null, 'zeitS');
  sProbe('und endet mit ihrer Klammer',
    geschnitten ? /\};$/.test(geschnitten.quelltext) : false, true);

  /* ⚠️ Die Probe auf die Probe: bei null gefundenen Lesern waere alles oben
     bedeutungslos. Am 09.09.2026 waren es vier. */
  sProbe('es wurden ueberhaupt Leser gefunden (>= 2)', gefunden.length >= 2, true);
}
if (stoer){
  console.log('');
  console.log('⛔ ' + stoer + ' Stoertest(s) gescheitert — dieser Pruefer misst nicht.');
  process.exit(1);
}

if (befunde){
  console.log('');
  console.log('⛔ ' + befunde + ' Zeitstempel-Leser antwortet auf einen leeren Stempel mit einer ZAHL.');
  console.log('   Reparatur: den leeren Fall VOR dem Zerlegen abfangen —');
  console.log("     const roh = String(s == null ? '' : s).trim();");
  console.log('     if (!roh) return null;');
  process.exit(2);
}
console.log('');
console.log('✅ Jeder Zeitstempel-Leser sagt „keine Zeit", wenn keine dasteht.');
