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

/** "46:29" -> 2789 Sekunden. Auch "1:02:11" wird verstanden.
 *
 * ⛔ Ein LEERER Stempel ergab bis zum 09.09.2026 die Zahl 0 statt null:
 * ''.split(':') ist [''], Number('') ist 0, und isNaN(0) ist falsch. Die Regel
 * waere damit nicht unter „ohne lesbaren Zeitstempel" gelandet, sondern mit
 * dem Fenster am ANFANG der Folge gemessen worden — eine Prozentzahl, der man
 * nichts ansieht. Heute trifft es keine (91 Regeln mit source, 0 davon leer,
 * gemessen am 09.09.2026), die naechste haette es still getroffen.
 * [[ausfall_ist_unsichtbar_gebaut]] */
function sekunden(stempel) {
  const roh = String(stempel == null ? '' : stempel).trim();
  if (!roh) return null;
  const teile = roh.split(':').map(Number);
  if (teile.some(isNaN) || !teile.length) return null;
  return teile.reduce((a, b) => a * 60 + b, 0);
}

/** Eine RTTM-Zeile je Segment: Feld 3 Beginn, Feld 4 Dauer, Feld 7 Sprecher.
 *  SPEAKER waveform 1 0.031 34.341 <NA> <NA> SPEAKER_02 <NA> <NA> */
function rttmLesen(text) {
  return text.split(/\r?\n/).filter(Boolean).map(z => {
    const f = z.split(/\s+/);
    const von = parseFloat(f[3]), dauer = parseFloat(f[4]);
    return { von, bis: von + dauer, sprecher: f[7] };
  });
}
/** Liest eine RTTM-Datei als Liste von {von, bis, sprecher}. */
function ladeSegmente(datei) {
  return rttmLesen(fs.readFileSync(datei, 'utf8'));
}

/** Redeanteil des Lehrers im Fenster um `t` in Prozent, dazu die gemessene
 *  Gesamtredezeit — unter einer Sekunde heisst: dort ist fast nur Stille.
 *
 *  ⭐ Eigene Funktion, damit der Stoertest unten DIESE Rechnung prueft und
 *  nicht eine zweite mit denselben Formeln. [[testvorlage_selbst_nachgebaut]] */
function lehrerAnteilImFenster(segmente, lehrer, t, fenster) {
  const von = t - fenster, bis = t + fenster;
  const zeit = {};
  for (const s of segmente) {
    const ueberlappung = Math.min(s.bis, bis) - Math.max(s.von, von);
    if (ueberlappung > 0) zeit[s.sprecher] = (zeit[s.sprecher] || 0) + ueberlappung;
  }
  const gesamt = Object.values(zeit).reduce((a, b) => a + b, 0);
  return { prozent: gesamt ? (zeit[lehrer] || 0) / gesamt * 100 : 0, gesamt };
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

/* ---------- ⛔ STOERTEST (09.09.2026) ----------
 *
 * ⛔ Dieses Skript gibt NIE einen Fehlercode zurueck — es ist eine
 * Kandidatenliste, kein Urteil (siehe Kopf). Damit fehlt ihm das uebliche
 * Warnzeichen ganz: eine Fassung, die falsch rechnet, sieht genauso aus wie
 * eine, die richtig rechnet. Nur die Prozentzahlen waeren andere, und die
 * kennt niemand auswendig.
 *
 * ⭐⭐ Zwei Wege, auf denen das lautlos passiert:
 *   1. Die RTTM-Spalten verschieben sich (pyannote-Fassung wechselt). Dann
 *      liest `parseFloat(f[3])` etwas anderes, und jede Zahl unten ist falsch.
 *   2. `sekunden()` versteht einen Stempel anders. Das Fenster liegt dann an
 *      der falschen Stelle der Folge — und 51 % sehen genauso plausibel aus
 *      wie 86 %.
 *
 * Beides mit festen Antworten geprueft. [[stoertest_muss_wirkung_nachweisen]]
 * [[gruener_pruefer_beweist_nur_geprueftes]] */
console.log('=== Stoertest ===');
let stoer = 0;
const sProbe = (was, ist, soll) => {
  if (ist !== soll) { stoer++; console.log('  ⛔  ' + was + ': ' + JSON.stringify(ist) + ' statt ' + JSON.stringify(soll)); }
  else console.log('  ok   ' + was);
};
{
  /* 1. Die Zeitstempel. 46*60+29 = 2789, (1*60+2)*60+11 = 3731. */
  sProbe('46:29 sind 2789 Sekunden', sekunden('46:29'), 2789);
  sProbe('1:02:11 sind 3731 Sekunden', sekunden('1:02:11'), 3731);
  sProbe('ein leerer Stempel ist null, nicht Sekunde 0', sekunden(''), null);
  sProbe('Unlesbares ist null', sekunden('irgendwann'), null);

  /* 2. Die RTTM-Spalten, an einer echten Zeile aus folge-01.rttm. */
  const z = rttmLesen('SPEAKER waveform 1 0.031 34.341 <NA> <NA> SPEAKER_02 <NA> <NA>')[0];
  sProbe('RTTM: Beginn steht in Feld 3', z.von, 0.031);
  sProbe('RTTM: Feld 4 ist die DAUER, nicht das Ende', Math.round(z.bis * 1000), 34372);
  sProbe('RTTM: der Sprecher steht in Feld 7', z.sprecher, 'SPEAKER_02');

  /* 3. Die Fensterrechnung, an einem Fall mit bekannter Antwort.
     Lehrer redet 0–100 s, Schueler 100–120 s; das Fenster ist 60–120 s.
     Angerechnet wird nur, was IM Fenster liegt: 40 s Lehrer, 20 s Schueler
     = 67 %.

     ⛔ Der Lehrer ragt absichtlich ueber den Fensterrand hinaus. Wer das
     Zuschneiden vergisst und ganze Segmente zaehlt, bekommt 83 % — eine
     Zahl, die nach einer besonders sauberen Fundstelle aussieht. Genau in
     diese Richtung faellt der Fehler auf: die Liste wird KUERZER, nicht
     laenger. [[milder_bezugspunkt_verdeckt_mangel]] */
  const seg = [{ von: 0, bis: 100, sprecher: 'L' }, { von: 100, bis: 120, sprecher: 'S' }];
  sProbe('Fenster: nur die 40 s IM Fenster zaehlen (67 %, nicht 83 %)',
    Math.round(lehrerAnteilImFenster(seg, 'L', 90, 30).prozent), 67);
  sProbe('nur der Schueler im Fenster sind 0 %',
    Math.round(lehrerAnteilImFenster(seg, 'L', 110, 5).prozent), 0);
  sProbe('ein Fenster ohne jede Rede meldet Stille',
    lehrerAnteilImFenster(seg, 'L', 5000, 30).gesamt, 0);

  /* ⚠️ Und die Probe auf die Probe: ohne Sprecherdaten und ohne Regeln waere
     alles darunter ein Satz ueber nichts. Am 09.09.2026: 16 Folgen, 103 Regeln. */
  sProbe('es liegen Sprecherdaten vor (>= 5 Folgen)', vorhanden.length >= 5, true);
  sProbe('grammar-data.js ist geladen (>= 50 Regeln)', GRAMMAR_RULES.length >= 50, true);
}
if (stoer) {
  console.log('');
  console.log('⛔ ' + stoer + ' Stoertest(s) gescheitert — die Prozentzahlen unten');
  console.log('   messen nicht, was ihre Beschriftung sagt. Nicht verwenden.');
  process.exit(1);
}
console.log('');

/* "Der Lehrer ist, wer am meisten redet" traegt nur, solange es wirklich einen
   Hauptsprecher gibt. In Folge 12 kommt der lauteste Sprecher auf 33% - dort
   hat pyannote den Lehrer offensichtlich auf mehrere Labels verteilt, und jede
   Prozentzahl fuer diese Folge waere eine Scheingenauigkeit. Solche Folgen
   werden getrennt ausgewiesen statt stillschweigend mitgerechnet. */
const SCHWELLE_HAUPTSPRECHER = 50;
const unsicher = vorhanden.filter(n => folgen[n].anteil < SCHWELLE_HAUPTSPRECHER);
if (unsicher.length) {
  console.log(`Achtung: In Folge ${unsicher.join(', ')} gibt es keinen klaren Hauptsprecher ` +
              `(staerkster Sprecher unter ${SCHWELLE_HAUPTSPRECHER}%: ` +
              unsicher.map(n => `F${n} ${folgen[n].anteil}%`).join(', ') + ').');
  console.log('Dort ist der Lehrer auf mehrere Labels verteilt - die Zahlen unten sagen fuer');
  console.log('diese Folgen nichts aus und stehen deshalb in einem eigenen Block.\n');
}

const ergebnis = [];
/* ⛔ Bis zum 21.08.2026 EIN Zaehler fuer DREI Ursachen — und die Beschriftung
   nannte ausgerechnet die beiden, die nicht auftreten. Gemessen an dem Tag:
     Buch-Ergaenzung / keine source   12x   <- die tatsaechliche Ursache
     Folge fehlt in den Sprecherdaten  0x   <- genannt
     kein Zeitstempel                  0x   <- genannt
   Je Ursache ein eigener Zaehler, sonst steht am Ende eine Zahl, die man
   nicht deuten kann. [[kennzeichen_mit_zwei_ursachen]] */
let ohneQuelle = 0;      // Buch-Ergaenzung oder gar keine source
let ohneFolge  = 0;      // Sprecherdaten fuer diese Folge fehlen
let ohneZeit   = 0;      // source da, aber kein lesbarer Zeitstempel
for (const r of GRAMMAR_RULES) {
  /* Buch-Ergaenzungen haben keine Videofundstelle — hier gibt es nichts zu
     pruefen, und ohne diese Zeile stuerzt der Lauf an `r.source.folge` ab. */
  if (r.ergaenzung || !r.source) { ohneQuelle++; continue; }
  const daten = folgen[r.source.folge];
  if (!daten) { ohneFolge++; continue; }
  const t = sekunden(r.source.approxTimestamp);
  if (t === null) { ohneZeit++; continue; }

  const { prozent, gesamt } = lehrerAnteilImFenster(daten.segmente, daten.lehrer, t, FENSTER);
  ergebnis.push({ regel: r.id, folge: r.source.folge, zeit: r.source.approxTimestamp,
                  lehrerProzent: Math.round(prozent), stille: gesamt < 1,
                  belastbar: daten.anteil >= SCHWELLE_HAUPTSPRECHER });
}

ergebnis.sort((a, b) => a.lehrerProzent - b.lehrerProzent);
const zeile = e => `  ${String(e.lehrerProzent).padStart(3)}%  F${String(e.folge).padStart(2)} ${e.zeit.padStart(6)}  ${e.regel}${e.stille ? '  (fast nur Stille im Fenster)' : ''}`;

const belastbar = ergebnis.filter(e => e.belastbar);
const auffaellig = belastbar.filter(e => e.lehrerProzent < 60);

const ohneDaten = ohneQuelle + ohneFolge + ohneZeit;
console.log(`${ergebnis.length} von ${GRAMMAR_RULES.length} Regeln gegen die Sprecherspur gehalten.`);
if (ohneDaten){
  const gruende = [];
  if (ohneQuelle) gruende.push(`${ohneQuelle} Buch-Ergaenzung(en) ohne Videofundstelle`);
  if (ohneFolge)  gruende.push(`${ohneFolge} aus Folgen ohne Sprecherdaten`);
  if (ohneZeit)   gruende.push(`${ohneZeit} ohne lesbaren Zeitstempel`);
  console.log(`${ohneDaten} uebersprungen: ` + gruende.join(' · ') + '.');
}
console.log(`Davon ${belastbar.length} aus Folgen mit klarem Hauptsprecher.\n`);
if (!belastbar.length) {
  /* ⛔ Ohne diese Zeile stuende bei null geprueften Regeln derselbe
     beruhigende Satz wie bei 77 sauberen. [[leere_liste_ist_keine_messung]] */
  console.log('⚠️ KEINE Regel belastbar geprueft — der Satz „ueberwiegend der Lehrer"');
  console.log('   waere hier eine Aussage ueber nichts. Fehlen die Sprecherdaten?');
} else if (!auffaellig.length) {
  console.log('Bei jeder belastbar geprueften Regel redet im Fenster ueberwiegend der Lehrer.');
} else {
  console.log(`${auffaellig.length} Regeln mit unter 60% Lehreranteil im Fenster - nachhoeren:\n`);
  auffaellig.forEach(e => console.log(zeile(e)));
}
const schnitt = belastbar.length
  ? Math.round(belastbar.reduce((a, e) => a + e.lehrerProzent, 0) / belastbar.length) : 0;
console.log(`\nDurchschnittlicher Lehreranteil ueber die belastbaren Regeln: ${schnitt}%`);

const ohneHauptsprecher = ergebnis.filter(e => !e.belastbar);
if (ohneHauptsprecher.length) {
  console.log(`\n--- ${ohneHauptsprecher.length} Regeln aus Folgen ohne klaren Hauptsprecher ---`);
  console.log('Zahlen nur zur Vollstaendigkeit, sie taugen hier nicht als Beleg:\n');
  ohneHauptsprecher.forEach(e => console.log(zeile(e)));
}
