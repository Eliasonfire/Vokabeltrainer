/* pruefe-sprecher.js -- Stammt eine Grammatikregel aus dem Mund des Lehrers?
 *
 * Aufruf:  node pruefe-sprecher.js [Fenster in Sekunden, Standard 30]
 *
 * Hintergrund: Die Regeln in grammar-data.js sind aus den Unterrichtsfolgen
 * abgeleitet. In den Aufnahmen sprechen aber auch Schueler - eine Schuelerantwort
 * darf nicht als Aussage des Lehrers in der App landen (Goal-Prompt E.1).
 *
 * Datengrundlage ist die Sprechertrennung (pyannote) unter
 * transcripts/sprecher/: je Folge eine .rttm (wer spricht von wann bis wann)
 * und eine .json (Redeanteile, vermuteter Lehrer = wer am meisten redet).
 * Der Ordner ist per .gitignore ausgeschlossen; fehlt er, sagt das Skript das
 * und endet ohne Fehler.
 *
 * Ausgabe: je Regel der Lehrer-Redeanteil im Fenster um ihren Zeitstempel.
 * WICHTIG - das ist eine Kandidatenliste, kein Urteil. approxTimestamp ist
 * ausdruecklich ungefaehr, und eine Regel entsteht aus einer laengeren Passage,
 * nicht aus einem Augenblick. Ein niedriger Anteil heisst "hier nachhoeren",
 * nicht "falsch". */
const fs = require('fs');
const path = require('path');

const REPO = __dirname;
const SPRECHER = path.join(REPO, 'transcripts', 'sprecher');
const FENSTER = Number(process.argv[2]) || 30;

if (!fs.existsSync(SPRECHER)) {
  console.log(`Keine Sprecherdaten unter ${SPRECHER} - nichts zu pruefen.`);
  console.log('Die Sprechertrennung erzeugt sie (sprechertrennung.py, laeuft lokal auf der CPU).');
  process.exit(0);
}

const { GRAMMAR_RULES } = (new Function(
  fs.readFileSync(path.join(REPO, 'grammar-data.js'), 'utf8') + ';return {GRAMMAR_RULES};'))();

/** "46:29" -> 2789 Sekunden. Auch "1:02:11" wird verstanden. */
function sekunden(stempel) {
  const teile = String(stempel || '').trim().split(':').map(Number);
  if (teile.some(isNaN) || !teile.length) return null;
  return teile.reduce((a, b) => a * 60 + b, 0);
}

/** Liest eine RTTM-Datei als Liste von {von, bis, sprecher}. */
function ladeSegmente(datei) {
  return fs.readFileSync(datei, 'utf8').split(/\r?\n/).filter(Boolean).map(z => {
    const f = z.split(/\s+/);
    const von = parseFloat(f[3]), dauer = parseFloat(f[4]);
    return { von, bis: von + dauer, sprecher: f[7] };
  });
}

const folgen = {};
for (const f of fs.readdirSync(SPRECHER)) {
  const m = f.match(/^folge-(\d+)\.rttm$/);
  if (!m) continue;
  const nr = Number(m[1]);
  const jsonPfad = path.join(SPRECHER, `folge-${m[1]}.json`);
  if (!fs.existsSync(jsonPfad)) continue;
  const meta = JSON.parse(fs.readFileSync(jsonPfad, 'utf8'));
  folgen[nr] = { segmente: ladeSegmente(path.join(SPRECHER, f)), lehrer: meta.vermutlichLehrer,
                 anteil: meta.redeanteil[meta.vermutlichLehrer] };
}

const vorhanden = Object.keys(folgen).map(Number).sort((a, b) => a - b);
console.log(`Sprecherdaten fuer Folge ${vorhanden.join(', ')} | Fenster +/- ${FENSTER}s\n`);

const ergebnis = [];
let ohneDaten = 0;
for (const r of GRAMMAR_RULES) {
  const daten = folgen[r.source.folge];
  if (!daten) { ohneDaten++; continue; }
  const t = sekunden(r.source.approxTimestamp);
  if (t === null) { ohneDaten++; continue; }

  // Redezeit je Sprecher im Fenster um den Zeitstempel
  const von = t - FENSTER, bis = t + FENSTER;
  const zeit = {};
  for (const s of daten.segmente) {
    const ueberlappung = Math.min(s.bis, bis) - Math.max(s.von, von);
    if (ueberlappung > 0) zeit[s.sprecher] = (zeit[s.sprecher] || 0) + ueberlappung;
  }
  const gesamt = Object.values(zeit).reduce((a, b) => a + b, 0);
  const lehrerAnteil = gesamt ? (zeit[daten.lehrer] || 0) / gesamt * 100 : 0;
  ergebnis.push({ regel: r.id, folge: r.source.folge, zeit: r.source.approxTimestamp,
                  lehrerProzent: Math.round(lehrerAnteil), stille: gesamt < 1 });
}

ergebnis.sort((a, b) => a.lehrerProzent - b.lehrerProzent);
const auffaellig = ergebnis.filter(e => e.lehrerProzent < 60);

console.log(`${ergebnis.length} Regeln gegen die Sprecherspur gehalten, ${ohneDaten} ohne Daten (Folge fehlt noch oder kein Zeitstempel).\n`);
if (!auffaellig.length) {
  console.log('Bei jeder geprueften Regel redet im Fenster ueberwiegend der Lehrer.');
} else {
  console.log(`${auffaellig.length} Regeln mit unter 60% Lehreranteil im Fenster - nachhoeren:\n`);
  for (const e of auffaellig) {
    console.log(`  ${String(e.lehrerProzent).padStart(3)}%  F${String(e.folge).padStart(2)} ${e.zeit.padStart(6)}  ${e.regel}${e.stille ? '  (fast nur Stille im Fenster)' : ''}`);
  }
}
const schnitt = ergebnis.length
  ? Math.round(ergebnis.reduce((a, e) => a + e.lehrerProzent, 0) / ergebnis.length) : 0;
console.log(`\nDurchschnittlicher Lehreranteil ueber alle geprueften Regeln: ${schnitt}%`);
