/* eiche-fragenreihenfolge.mjs — steht die Frage, die andere erledigt, vorn?
 * ==========================================================================
 *
 * ⛔ DER FUND vom 21.08.2026: Die Fragenseite sortierte nach ANZAHL —
 * pl (25) · root (25) · type (19) · femSg (1). Damit stand `type` HINTER
 * `root`.
 *
 * `data/feld-ausnahmen.js` sagt aber: FELD_REGELN.root.typen = ['particle'],
 * also „ein Partikel hat keine Wurzel". Wer erst die Wurzel beantwortet und
 * danach „Partikel" waehlt, hat eine Frage UMSONST beantwortet — und merkt
 * es nicht einmal, weil nichts die beiden Fragen verbindet.
 *
 * Gemessen: 19 der 70 Fragen haengen so an der type-Frage.
 * ⚠️ Das ist die OBERGRENZE, nicht der Gewinn — es entfaellt nur, was Elias
 * wirklich als Partikel einstuft. [[trefferquote_ohne_preis]]
 *
 * ⭐ Diese Eichung prueft die Reihenfolge an der ECHTEN Ausgabe, nicht an
 * einer nachgebauten Sortierfunktion: sie ruft `vorrat.mjs --offene-fragen`
 * auf und liest, was herauskommt. [[vorabpruefung_kennt_ihr_tor_nicht]]
 *
 * Aufruf:  node werkzeuge/eiche-fragenreihenfolge.mjs
 * Exitcode 1 = ein Feld, an dem Regeln haengen, steht hinter einem, das von
 *              ihm abhaengt.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* Die Regeln aus der Sache — aus der echten Datei. */
const kiste = { window: {} };
kiste.globalThis = kiste;
vm.createContext(kiste);
vm.runInContext(fs.readFileSync(path.join(REPO, 'data', 'feld-ausnahmen.js'), 'utf8'),
  kiste, { filename: 'fa' });
const REGELN = vm.runInContext('typeof FELD_REGELN !== "undefined" ? FELD_REGELN : null', kiste);
if (!REGELN){ console.error('⛔ FELD_REGELN nicht gefunden — die Grundlage fehlt.'); process.exit(1); }

/* Welche Felder haengen an der Wortart? */
const abhaengig = Object.entries(REGELN)
  .filter(([, r]) => r && Array.isArray(r.typen) && r.typen.length)
  .map(([f]) => f);
/* ⛔⛔ DIE ZWEITE QUELLE — nachgeruestet am 20.08.2026.

   FELD_REGELN kennt `root`, `femSg` und die vier Verbformen. Die
   Typabhaengigkeit von `gender`, `sg` und `pl` steht aber nicht dort,
   sondern als CODE in vorrat.mjs, felderPruefen():

       if (t === "noun"){ pruefe("gender"); pruefe("sg"); pruefe("pl"); }

   Diese Eichung sah sie bis heute NICHT. Sie waere gruen geblieben, wenn
   jemand die Fragenseite auf `gender -> type` umgestellt haette — und
   `pl` ist mit 25 Fragen die groesste Gruppe ueberhaupt.
   [[dieselbe_frage_zwei_antworten]] [[pruefwerkzeug_mit_eingebauter_antwort]]

   ⛔ Zeichenweise zerlegt, kein Regex: die Backslashes ueberleben den Weg
   durch ein schreibendes Skript nicht. */
const _vz = fs.readFileSync(path.join(REPO, "werkzeuge", "vorrat.mjs"), "utf8").split(/\r?\n/);
const _ausCode = new Set();
for (const _z of _vz){
  const _t = _z.trim();
  if (!_t.startsWith("if (t ===")) continue;
  for (const _s of _t.split("pruefe(").slice(1)){
    const _auf = _s.indexOf("'");
    const _zu  = _s.indexOf("'", _auf + 1);
    if (_auf === 0 && _zu > 0) _ausCode.add(_s.slice(1, _zu));
  }
}
/* ⛔⛔ UNTERGRENZE, nicht nur „ueberhaupt etwas".

   Der erste Entwurf prueft nur `_ausCode.size === 0`. Im Stoertest am
   20.08.2026 wurde EINE if-Zeile aus felderPruefen() entfernt — `_ausCode`
   war danach noch besetzt, `gender` und `pl` fielen aber aus der Pruefung,
   und die Eichung meldete **Exit 0**. Sie wurde leiser statt rot.

   Am 20.08.2026 gemessen: felderPruefen() macht acht Felder typabhaengig
   (gender · sg · pl · femSg · past · present · imperative · masdar).
   Werden es weniger, ist das eine Aenderung, die gesehen gehoert — auch
   wenn sie richtig sein sollte. [[ausfall_ist_unsichtbar_gebaut]] */
const _MINDESTENS = 8;
if (_ausCode.size < _MINDESTENS){
  console.error("⛔ vorrat.mjs macht nur noch " + _ausCode.size + " Feld(er) typabhaengig,");
  console.error("   am 20.08.2026 waren es " + _MINDESTENS + ": gender · sg · pl · femSg · past ·");
  console.error("   present · imperative · masdar. Gefunden: " + [..._ausCode].join(" · "));
  console.error("   Entweder umgebaut oder das Muster `if (t === …) pruefe(…)` traegt nicht mehr.");
  process.exit(1);
}
/* ⛔ Erst merken, dann erweitern: der Vergleich gegen Object.keys(REGELN)
   lief ins Leere, weil `gender`, `sg` und `pl` dort als Schluessel stehen —
   nur ohne `typen`. Die Zeile war deshalb immer leer und behauptete, es
   gebe keine zweite Quelle. [[widerspruch_liegt_in_der_beschriftung]] */
const _ausRegeln = abhaengig.slice();
for (const _f of _ausCode) if (!abhaengig.includes(_f)) abhaengig.push(_f);
const _nurCode = [..._ausCode].filter(f => !_ausRegeln.includes(f));
console.log("  davon nur aus vorrat.mjs (Code, nicht FELD_REGELN): "
  + (_nurCode.length ? _nurCode.join(" · ") : "keines"));
console.log('Felder, deren Regel an der Wortart haengt: ' + abhaengig.join(' · '));

/* Die ECHTE Ausgabe holen. ⛔ vorrat.mjs endet mit Exit 2, wenn etwas offen
   ist — das ist hier der Normalfall. */
const tmp = path.join(os.tmpdir(), 'eiche-fragenreihenfolge.json');
if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
try {
  execFileSync(process.execPath,
    [path.join(REPO, 'werkzeuge', 'vorrat.mjs'), '--offene-fragen', tmp],
    { cwd: REPO, stdio: ['ignore', 'ignore', 'inherit'] });
} catch (e){ if (e.status !== 2){ console.error('vorrat.mjs Exit ' + e.status); process.exit(1); } }
if (!fs.existsSync(tmp)){
  console.log('⚠️ Keine Fragendatei — es ist nichts offen. Nichts zu pruefen.');
  process.exit(0);
}
const fragen = JSON.parse(fs.readFileSync(tmp, 'utf8')).fragen || [];
fs.unlinkSync(tmp);

const reihe = fragen.map(f => f.feld);
console.log('Reihenfolge auf der Seite: ' + reihe.join(' -> '));
console.log('');

let fehler = 0;
const iType = reihe.indexOf('type');
for (const f of abhaengig){
  const i = reihe.indexOf(f);
  if (i < 0) continue;                 /* Feld gar nicht offen */
  if (iType < 0){
    console.log('  ok   ' + f.padEnd(8) + 'die type-Frage ist gar nicht offen — nichts zu ordnen.');
    continue;
  }
  if (iType < i) console.log('  ok   ' + f.padEnd(8) + 'steht hinter „type" (Platz ' + (i+1) + ' nach ' + (iType+1) + ')');
  else { fehler++; console.log('  ⛔   ' + f.padEnd(8) + 'steht VOR „type" (Platz ' + (i+1) + ' vor ' + (iType+1) + ') — Elias beantwortet es womoeglich umsonst.'); }
}

/* Und: sagt die Seite den Zusammenhang auch? */
const seite = path.join(REPO, 'artefakte', 'wartungsfragen.html');
if (fs.existsSync(seite)){
  const h = fs.readFileSync(seite, 'utf8');
  const n = (h.match(/class="folgt"/g) || []).length;
  if (n) console.log('  ok   die Seite nennt den Zusammenhang bei ' + n + ' Wort/Woertern.');
  else { fehler++; console.log('  ⛔   die Seite nennt den Zusammenhang NICHT — die richtige Reihenfolge allein sieht man ihr nicht an.'); }
}

console.log('');
if (fehler){ console.log('⛔ ' + fehler + ' Befund(e).'); process.exit(1); }
console.log('✔ Was andere Fragen erledigen kann, steht vorn — und die Seite sagt es.');
