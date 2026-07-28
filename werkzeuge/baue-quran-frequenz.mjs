/* baue-quran-frequenz.mjs -- Quran-Vorkommen je Wortwurzel neu berechnen
 *
 * Aufruf:  node werkzeuge/baue-quran-frequenz.mjs <pfad-zu-quran-morphology.txt>
 *
 * Bisher deckte quran-frequency-data.js 92 Wurzeln ab - die aus Madina 1,
 * Kapitel 1 bis 9. Seit die App alle acht Lehrwerke kennt, sind es 1584
 * verschiedene Wurzeln, und fuer 1492 davon stand in der App nichts.
 *
 * Datengrundlage ist dieselbe wie bisher, nur vollstaendig ausgewertet:
 * die morphologische Annotation des Quran (Quranic Arabic Corpus, Kais Dukes,
 * Uni Leeds; hier ueber die maschinenlesbare Fassung von
 * github.com/mustafa0x/quran-morphology, GNU-Lizenz). Jede Zeile darin ist ein
 * Wortsegment mit Stelle, Form und - wo vorhanden - der Wurzel.
 *
 * Nichts daran ist geschaetzt oder abgeleitet: gezaehlt wird, was im Korpus
 * als ROOT annotiert ist.
 *
 * Der Abgleich braucht eine Normalisierung, weil die beiden Quellen die
 * Wurzeln unterschiedlich schreiben: arabicroots setzt Leerzeichen zwischen
 * die Radikale ("ق ر أ"), das Korpus nicht ("قرأ"), und die Hamza-Traeger
 * weichen ab (أ إ آ ء gegen ا). Beide Seiten werden deshalb auf dieselbe
 * schlichte Form gebracht.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HIER, '..');
const KORPUS = process.argv[2];
if (!KORPUS || !fs.existsSync(KORPUS)) {
  console.error('Bitte den Pfad zu quran-morphology.txt angeben.');
  console.error('Quelle: https://github.com/mustafa0x/quran-morphology (GNU-Lizenz)');
  process.exit(1);
}




/* Wurzeln beider Seiten auf dieselbe Form bringen. */
const normRoot = r => String(r || '')
  .replace(/\s+/g, '')
  .replace(/[أإآٱ]/g, 'ا')
  .replace(/[ؤئ]/g, 'ء')
  .replace(/[ً-ْٰـ]/g, '');

/* ---- Welche Wurzeln braucht die App ueberhaupt? ---- */
const fenster = {};
for (const f of fs.readdirSync(path.join(REPO, 'data'))) {
  if (!f.startsWith('vokabeln-')) continue;
  (new Function('window', fs.readFileSync(path.join(REPO, 'data', f), 'utf8')))(fenster);
}
const wortschatz = Object.values(fenster.VOKABELN || {}).flat();
/* Die Schreibweise, die in der App steht, bleibt der Schluessel - normalisiert
   wird nur zum Vergleichen. */
const gesucht = new Map();               // normalisiert -> Schreibweise der App
for (const v of wortschatz) {
  if (v.root) gesucht.set(normRoot(v.root), v.root.replace(/\s+/g, ''));
}
console.log(`${wortschatz.length} Vokabeln, ${gesucht.size} verschiedene Wurzeln.`);

/* ---- Welche Woerter selbst? ----
   Die Wurzelzahl beantwortet "wie oft kommt dieses Wortfeld im Quran vor" -
   بيت zaehlt dann Haus, Haeuser und Vers mit. Der Ziel-Prompt (C.3) will
   zusaetzlich die Haeufigkeit des WORTES. Das Korpus fuehrt dafuer je Segment
   ein Lemma (LEM:بَيْت), also die Grundform ohne Kasusendung. */
const ohneZeichen = s => String(s || '').replace(/[ً-ْٰـ]/g, '').replace(/[أإآٱ]/g,'ا');
const wortGesucht = new Map();           // Lemmaskelett -> Schreibweise der App
for (const v of wortschatz) {
  const k = ohneZeichen(v.sg || v.ar);
  if (k.length >= 2 && !wortGesucht.has(k)) wortGesucht.set(k, v.sg || v.ar);
}

/* ---- Korpus auswerten ---- */
const treffer = new Map();               // Wurzel -> { count, verses:Set }
const wortTreffer = new Map();           // Lemmaskelett -> { count, formen:Set }
let zeilen = 0, mitWurzel = 0;
const text = fs.readFileSync(KORPUS, 'utf8');
for (const zeile of text.split(/\r?\n/)) {
  if (!zeile) continue;
  zeilen++;
  const teile = zeile.split('\t');
  if (teile.length < 4) continue;

  const lem = teile[3].match(/LEM:([^|]+)/);
  if (lem){
    const lk = ohneZeichen(lem[1]);
    if (wortGesucht.has(lk)){
      if (!wortTreffer.has(lk)) wortTreffer.set(lk, { count: 0, formen: new Set() });
      const w = wortTreffer.get(lk);
      w.count++;
      /* Welche vokalisierten Lemmata hinter dem Skelett stecken - daran haengt,
         ob die Zahl eindeutig ist. */
      w.formen.add(lem[1]);
    }
  }

  const m = teile[3].match(/ROOT:([^|]+)/);
  if (!m) continue;
  mitWurzel++;
  const key = normRoot(m[1]);
  if (!gesucht.has(key)) continue;
  const [sura, ayah] = teile[0].split(':').map(Number);
  if (!treffer.has(key)) treffer.set(key, { count: 0, verses: new Set() });
  const t = treffer.get(key);
  t.count++;
  t.verses.add(`${sura}:${ayah}`);
}
console.log(`${zeilen} Korpuszeilen, ${mitWurzel} mit Wurzelangabe, ${treffer.size} gesuchte Wurzeln gefunden.`);

/* Ein Skelett kann mehrere vokalisierte Lemmata decken - كتب ist Buch und
   schrieb zugleich. Eine Zahl, die beides zusammenwirft, waere schlicht
   falsch; solche Woerter bekommen deshalb gar keine. */
const wortZahl = {};
let mehrdeutig = 0;
for (const [lk, w] of wortTreffer){
  if (w.formen.size > 1){ mehrdeutig++; continue; }
  wortZahl[wortGesucht.get(lk)] = w.count;
}
console.log(`${Object.keys(wortZahl).length} Woerter mit eindeutiger Wortzahl, ${mehrdeutig} mehrdeutig (keine Zahl).`);

/* ---- Ausgabedatei ---- */
const raus = {};
const sortiert = [...treffer.entries()].sort((a, b) =>
  gesucht.get(a[0]).localeCompare(gesucht.get(b[0])));
for (const [key, t] of sortiert) {
  const verses = [...t.verses]
    .map(v => v.split(':').map(Number))
    .sort((a, b) => a[0] - b[0] || a[1] - b[1])
    /* Gekappt auf zehn: genau so viele zeigt die App im Popover. Bei Wurzeln
       wie ق و ل waeren es sonst tausende Eintraege in der Datei. */
    .slice(0, 10);
  /* Kompakt als [Anzahl, [[Sure, Vers], ...]]. Der Surenname stand hier
     frueher ausgeschrieben bei jedem einzelnen Vers - bei 1038 Wurzeln macht
     das die Datei dreimal so gross fuer dieselbe Information. Er steht
     ohnehin in surah-data.js und wird beim Anzeigen nachgeschlagen. */
  raus[gesucht.get(key)] = [t.count, verses];
}

/* Zwei Tabellen in einer Datei: QURAN_FREQ nach Wurzel (mit Fundstellen) und
   QURAN_WORT nach Wort (nur die Anzahl). Getrennt, weil sie verschiedene
   Fragen beantworten. */
const kopf =
`/* ===================== QURAN FREQUENCY DATA =====================
   Automatisch erzeugt von werkzeuge/baue-quran-frequenz.mjs - nicht von Hand
   aendern.

   Wie oft die Wurzel eines Vokabelworts im Quran vorkommt, gezaehlt aus der
   morphologischen Annotation des Quran (Quranic Arabic Corpus, Kais Dukes,
   Uni Leeds; maschinenlesbare Fassung: github.com/mustafa0x/quran-morphology,
   GNU-Lizenz). Gezaehlt werden Wortsegmente mit ROOT-Angabe; die verses-Liste
   ist auf zehn Eintraege gekappt - genau so viele zeigt die App an.

   Aufbau: QURAN_FREQ[Wurzel] = [Anzahl, [[Sure, Vers], ...]] - der Surenname
   steht in surah-data.js und wird beim Anzeigen nachgeschlagen.

   ${Object.keys(raus).length} Wurzeln aus allen acht Lehrwerken. */
const QURAN_FREQ = `;
const wortKopf =
`

/* Wie oft das WORT selbst im Quran steht (Lemma laut Korpus), nicht nur seine
   Wurzel. بَيْتٌ als Wurzel zaehlt Haus, Haeuser und Vers zusammen; als Wort
   nur das Haus.

   Nur eindeutige Faelle: wo ein Schriftbild mehrere vokalisierte Lemmata deckt
   (كتب ist Buch und schrieb), steht hier nichts - eine Zahl, die beides
   zusammenwirft, waere schlicht falsch.

   ${Object.keys(wortZahl).length} Woerter, ${mehrdeutig} wegen Mehrdeutigkeit ausgelassen. */
const QURAN_WORT = `;

fs.writeFileSync(path.join(REPO, 'quran-frequency-data.js'),
  kopf + JSON.stringify(raus, null, 1) + ';\n'
       + wortKopf + JSON.stringify(wortZahl, null, 1) + ';\n', 'utf8');

const ohne = [...gesucht.keys()].filter(k => !treffer.has(k)).length;
console.log(`Geschrieben: ${Object.keys(raus).length} Wurzeln mit Vorkommen, ${ohne} ohne (kommen im Quran nicht vor).`);
console.log(`Dateigroesse: ${Math.round(fs.statSync(path.join(REPO, 'quran-frequency-data.js')).size / 1024)} KB`);
