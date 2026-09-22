#!/usr/bin/env node
/* kandidaten-bewerten.mjs — ICH bewerte die Regelkandidaten, nicht Elias.
 * ==========================================================================
 *
 * ⛔⛔ WARUM ES DIESE DATEI GIBT
 *
 * Elias am 22.09.2026, als ich ihm ein Artefakt mit 95 Fundstellen zum
 * Durchklicken vorlegte:
 *
 *   „du hast mir ein regelkandidaten freigeben artefakt gemacht. wir hatten das
 *   thema glaube ich schonmal. wir hatten ausgemacht das du das machen sollst
 *   bzw bewerten sollst und ich hatte dir noch gesagt das du auch meine
 *   unterlagen regelmässig gucken sollst und auch das in deine analyse mit
 *   einbeziehen sollst und auch die schlüssel bücher die wir haben usw."
 *
 * Er hat recht, und es steht seit dem 29.07.2026 im Gedächtnis
 * (`04 - Wissen/Lehrwerk-Begleitmaterial.md`, Abschnitt „⭐ Rang der
 * Schlüssel"). Dort stehen drei Sätze von ihm, die zusammen die ganze
 * Arbeitsteilung festlegen:
 *
 *   1. „bei den schlüsselbüchern sollst du ihnen mehr gewicht oder priorität
 *      geben bei den richtigen regeln. sie sind der goldene standart"
 *   2. „egal auf meine frühere aussage … die schlüssel bücher haben höhere
 *      priorität … im zweifel aber dich auf die schlüssel bücher verlassen"
 *   3. „sollte es unterschiede geben ist das eine weitere aufgabe die ich
 *      machen muss … du sollst das einfach markieren oder so."
 *
 * ⭐ Daraus folgt die Trennung, die dieses Werkzeug durchsetzt:
 *
 *   ICH entscheide alles, was die Quellen einig beantworten.
 *   ELIAS bekommt NUR zwei Sorten: wo Schlüssel und Unterricht sich
 *   WIDERSPRECHEN, und wo GAR NICHTS belegt ist.
 *
 * ⛔ Mein Fehler am 22.09.2026 war nicht, ihn zu fragen — sondern ihn ALLES zu
 * fragen. Aus „bei Unterschieden markieren" hatte ich „alles markieren"
 * gemacht. Die Seite mit den 95 Fundstellen hat er noch in derselben Stunde
 * gelöscht. [[nachfrage_deckt_luecke_auf]]
 *
 * ========================= WAS DIESES WERKZEUG TUT ========================
 *
 * Es SAMMELT die Belege — mechanisch, bei jedem Lauf neu, damit die Routine
 * sie aktuell hält. Es BEWERTET nicht: die Urteile stehen in
 * `werkzeuge/kandidaten-urteile.json` und stammen von mir, je mit Begründung
 * und Fundstelle. Das Werkzeug führt beides zusammen und schreibt
 * `transcripts/kandidaten/bewertung.json`, aus der das Artefakt gebaut wird.
 *
 * ⛔⛔ EIN KANDIDAT OHNE MEIN URTEIL GEHT NICHT AN ELIAS. Er zählt als MEIN
 * Rückstand und steht so in der Ausgabe. Sonst wäre die Arbeitsteilung durch
 * bloßes Nichtstun wieder umgedreht — genau der Zustand vom 22.09.
 *
 * ========================= DIE VIER QUELLEN ===============================
 *
 * | Quelle | woher | was sie kann |
 * |---|---|---|
 * | ⭐ Schlüssel **Band 1** | Vault `04 - Wissen/Schluessel-Regeln.md` | **die wichtigste Quelle hier.** Band 1 liegt als PDF nicht mehr vor; die Notiz hat alle 23 Lektionen ausgewertet (29.07.2026, Seiten gerendert und gelesen), mit PDF-Seitenzahl je Lektion |
 * | Schlüssel Band 2+3 | `G:/1. Workspace/PDF Download/Madina_Book{2,3}_German_Key.txt` | deutsche Textebene lesbar, Seitenzahl aus dem Seitenvorschub |
 * | Unterricht | der Kandidat selbst | Folge und Zeitmarke stehen im Datensatz |
 * | Elias' Unterlagen | Vault-Notizen + `werkzeuge/samsung-notizen-index.json` | ⚠️ die Samsung-Notizen sind HANDSCHRIFT in PDFs — `search_notes` liefert dort nichts. Was in den Index kommt, habe ich angesehen |
 *
 * ⛔⛔ GEMESSEN AM 22.09.2026, UND ES ÄNDERT DIE RANGFOLGE DER QUELLEN:
 * **Band 2 und 3 belegen für diese Kandidaten fast nichts.** Sie sind die
 * Schlüssel zu Madina Buch 2 und 3; die 95 Kandidaten stammen aber aus
 * Unterrichtskapitel 4 bis 12, also aus **Buch 1**. Die Suche nach „ʿinda",
 * „maʿa" und „verneint" ergab in beiden Bänden zusammen **0 Treffer**, während
 * `Schluessel-Regeln.md` zu genau diesen drei Punkten einen ganzen Abschnitt
 * hat (Lektion 10, Punkte 3, 7 und 8).
 *
 * Wer hier nur in Band 2+3 sucht, misst also am falschen Buch und bekommt
 * lauter Nulltreffer, die wie „nicht belegt" aussehen. Genau so entsteht ein
 * Kandidat, der fälschlich bei Elias landet. [[leere_liste_ist_keine_messung]]
 *
 * ⛔ DER ARABISCHE TEXT DER SCHLÜSSEL IST NICHT ZITIERFÄHIG. 38 % der
 * arabischen Wörter in Band 3 beginnen mit einer Ḥaraka — die Zeichen stehen in
 * visueller statt logischer Reihenfolge. Die Datei ist ein SUCHINDEX, keine
 * Quelle. Wer den Wortlaut braucht, rendert die Seite.
 * ⛔ Und nie selbst vokalisieren. [[regeln_selbst_auswerten]]
 *
 * ⚠️ EIN STICHWORTTREFFER IST KEIN INHALTSTREFFER. Deshalb wird nur nach
 * echten Fachbegriffen gesucht (Liste unten), nicht nach „heisst", „immer",
 * „beispiel" — die drei häufigsten Begriffe der Kandidaten sind genau diese,
 * und sie stehen auf jeder zweiten Buchseite. [[stichworttreffer_ist_kein_inhaltstreffer]]
 *
 * Aufruf:
 *   node werkzeuge/kandidaten-bewerten.mjs             Übersicht, schreibt bewertung.json
 *   node werkzeuge/kandidaten-bewerten.mjs --offen     nur, was noch auf MEIN Urteil wartet
 *   node werkzeuge/kandidaten-bewerten.mjs --pruefen   schreibt nichts, nur Zahlen und Exitcode
 *   node werkzeuge/kandidaten-bewerten.mjs --stoertest Urteil wird ignoriert -> muss rot werden
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KAND = path.join(REPO, 'transcripts', 'kandidaten');
const URTEILE = path.join(REPO, 'werkzeuge', 'kandidaten-urteile.json');
const SAMSUNG = path.join(REPO, 'werkzeuge', 'samsung-notizen-index.json');
const ZIEL = path.join(KAND, 'bewertung.json');

const SCHLUESSEL_ORDNER = 'G:/1. Workspace/PDF Download';
const BAENDE = { 2: 'Madina_Book2_German_Key', 3: 'Madina_Book3_German_Key' };
const VAULT = 'G:/1. Workspace/Obsidian/Gedächtnis/Elias Gedächtnis/04 - Wissen';
const VAULT_NOTIZEN = ['Schluessel-Regeln.md', 'Lehrwerk-Begleitmaterial.md',
  'Regelabgleich Video-Buch-Heft.md'];

const args = process.argv.slice(2);
const nurOffen = args.includes('--offen');
const nurPruefen = args.includes('--pruefen');
const stoertest = args.includes('--stoertest');

/* ========================================================================
   Die Fachbegriffe, nach denen im Schlüssel gesucht wird.
   Links der Begriff, wie er in den Kandidaten steht (Whisper schreibt den
   Unterricht in deutscher Lautschrift), rechts die Schreibweisen, unter denen
   ihn der deutsche Schlüssel führt.
   ⛔ Nur Fachbegriffe. „heisst", „immer", „beispiel", „wichtig", „merken"
   kommen in den Kandidaten am häufigsten vor und sind als Beleg wertlos.
   ======================================================================== */
const FACHBEGRIFFE = {
  nat:          ['Adjektiv', 'Attribut', 'na\u02bft', 'Nat'],
  harf:         ['Partikel', 'Harf', 'Buchstabe'],
  marfu:        ['Nominativ', 'marf\u016b', 'marfu'],
  majrur:       ['Genitiv', 'majr\u016br', 'majrur'],
  mansub:       ['Akkusativ', 'man\u1e63\u016bb', 'mansub'],
  sukun:        ['Suk\u016bn', 'Sukun'],
  damma:        ['\u1e0camma', 'Damma'],
  damm:         ['\u1e0camma', 'Damma'],
  kasra:        ['Kasra'],
  fatha:        ['Fatha', 'Fat\u1e25a'],
  tanwin:       ['Tanw\u00een', 'Tanwin'],
  tanoin:       ['Tanw\u00een', 'Tanwin'],
  genitiv:      ['Genitiv'],
  nominativ:    ['Nominativ'],
  adjektiv:     ['Adjektiv'],
  verb:         ['Verb'],
  partikel:     ['Partikel'],
  praeposition: ['Pr\u00e4position'],
  nomen:        ['Substantiv', 'Nomen'],
  bestimmt:     ['bestimmt'],
  unbestimmt:   ['unbestimmt'],
  maennlich:    ['m\u00e4nnlich', 'Maskulin'],
  weiblich:     ['weiblich', 'Feminin'],
  lektion:      [],   // sagt nichts über den Inhalt
  endung:       [],
  endet:        [],
  regel:        [],
  heisst:       [],
  immer:        [],
  beispiel:     [],
  bestimmtheit: ['bestimmt'],
  buchstabe:    ['Buchstabe'],
  wichtig:      [],
  merken:       [],
};

/* ====================== Quellen laden ==================================== */

function ladeBand(band) {
  const p = path.join(SCHLUESSEL_ORDNER, BAENDE[band] + '.txt');
  if (!fs.existsSync(p)) return null;
  /* pdftotext trennt Seiten mit Seitenvorschub — daraus kommt die Seitenzahl. */
  return fs.readFileSync(p, 'utf8').split('\f');
}

const SCHLUESSEL = {};
for (const band of Object.keys(BAENDE)) {
  const seiten = ladeBand(band);
  if (seiten) SCHLUESSEL[band] = seiten;
}

const VAULT_TEXT = {};
for (const n of VAULT_NOTIZEN) {
  const p = path.join(VAULT, n);
  if (fs.existsSync(p)) VAULT_TEXT[n] = fs.readFileSync(p, 'utf8').split(/\r?\n/);
}

let SAMSUNG_INDEX = { notizen: [] };
if (fs.existsSync(SAMSUNG)) SAMSUNG_INDEX = JSON.parse(fs.readFileSync(SAMSUNG, 'utf8'));

let URTEIL = { urteile: {} };
if (fs.existsSync(URTEILE)) URTEIL = JSON.parse(fs.readFileSync(URTEILE, 'utf8'));
if (stoertest) URTEIL = { urteile: {} };

/* ====================== Belege je Kandidat =============================== */

/* Seitenzahlen, auf denen ein Begriff im Band steht. Ab 30 Seiten ist der
   Begriff im Buch allgegenwärtig und belegt nichts mehr — dann wird die Zahl
   gemeldet, aber keine Seitenliste. */
function imBand(band, wort) {
  const seiten = SCHLUESSEL[band];
  if (!seiten) return null;
  const klein = wort.toLowerCase();
  const treffer = [];
  seiten.forEach((s, i) => { if (s.toLowerCase().includes(klein)) treffer.push(i + 1); });
  if (!treffer.length) return null;
  return { band: Number(band), wort, seiten: treffer.length <= 30 ? treffer : [], anzahl: treffer.length };
}

function imVault(wort) {
  const klein = wort.toLowerCase();
  const treffer = [];
  for (const [datei, zeilen] of Object.entries(VAULT_TEXT)) {
    zeilen.forEach((z, i) => {
      if (z.toLowerCase().includes(klein)) treffer.push({ datei, zeile: i + 1 });
    });
  }
  return treffer;
}

/* ====================== Schlüssel Band 1 nach Lektionen =================
   `Schluessel-Regeln.md` ist nach Lektionen gegliedert (`### Lektion N — …`),
   viele mit der PDF-Seite darunter (`*(PDF-Seiten 35–37)*`). Ein Treffer
   bekommt dadurch eine ZITIERBARE Fundstelle: Lektion und Seite. Ein Treffer
   ohne Fundstelle ist ein halber Beleg, und der ist schlimmer als keiner.  */
const LEKTIONEN = [];
{
  const zeilen = VAULT_TEXT['Schluessel-Regeln.md'] || [];
  let aktuell = null;
  zeilen.forEach((z, i) => {
    const kopf = z.match(/^###\s+Lektion\s+([0-9]+(?:\s*[–\-+]\s*[0-9A-Za-z]+)?)\s*(?:—|-)?\s*(.*)$/);
    if (kopf) {
      aktuell = { lektion: kopf[1].replace(/\s+/g, ''), titel: kopf[2].trim(), seite: null, ab: i + 1, text: [] };
      LEKTIONEN.push(aktuell);
      return;
    }
    if (/^##\s/.test(z)) aktuell = null;
    if (!aktuell) return;
    const seite = z.match(/PDF-Seiten?\s+([0-9]+(?:\s*[–\-]\s*[0-9]+)?)/);
    if (seite && !aktuell.seite) aktuell.seite = seite[1].replace(/\s+/g, '');
    const kopfSeite = aktuell.titel.match(/\(S\.\s*([0-9]+(?:\s*[–\-]\s*[0-9]+)?)\)/);
    if (kopfSeite && !aktuell.seite) aktuell.seite = kopfSeite[1].replace(/\s+/g, '');
    aktuell.text.push(z);
  });
}

/* Folge -> Kapitel, GEMESSEN an den vorhandenen Regeln, nicht geraten.
   ⚠️ Die Lektionsnummer des Buchs ist NICHT immer die Kapitelnummer des
   Lehrers — bei Lektion 8 weichen sie belegt ab (siehe Kopf von
   `schluessel-lektionen.mjs`). Deshalb wird hier nur das Kapitel gemeldet und
   die Lektion ueber den INHALT gesucht, nicht ueber die Nummer. */
const FOLGE_KAPITEL = (() => {
  const gdp = path.join(REPO, 'grammar-data.js');
  if (!fs.existsSync(gdp)) return {};
  const G = new Function(fs.readFileSync(gdp, 'utf8') + ';return {GRAMMAR_RULES};')().GRAMMAR_RULES;
  const m = {};
  for (const r of G) {
    const f = r.source && r.source.folge;
    const k = r.kapitel || (r.source && r.source.chapter);
    if (f == null || k == null) continue;
    if (!m[f]) m[f] = {};
    m[f][k] = (m[f][k] || 0) + 1;
  }
  const aus = {};
  for (const [f, k] of Object.entries(m)) {
    const beste = Object.entries(k).sort((a, b) => b[1] - a[1])[0];
    aus[f] = { kapitel: Number(beste[0]), regeln: beste[1], alle: k };
  }
  return aus;
})();

function imSchluessel1(woerter) {
  const treffer = [];
  for (const L of LEKTIONEN) {
    const text = L.text.join('\n');
    const klein = text.toLowerCase();
    const gefunden = woerter.filter(w => klein.includes(w.toLowerCase()));
    if (gefunden.length)
      treffer.push({ lektion: L.lektion, titel: L.titel.slice(0, 70), seite: L.seite,
        zeile: L.ab, woerter: gefunden });
  }
  return treffer;
}

function belegeFuer(kand, folge) {
  const begriffe = Object.keys(kand.begriffe || {});
  const fach = [];
  for (const b of begriffe) {
    const schreibweisen = FACHBEGRIFFE[b];
    if (!schreibweisen || !schreibweisen.length) continue;
    fach.push({ begriff: b, schreibweisen });
  }

  /* ⚠️ Doppelt suchen kostet nichts, doppelt MELDEN schon: „damm" und „damma"
     schlagen beide auf „Ḍamma" an, und die Zeile wird unlesbar. Deshalb je
     (Band, Wort) nur einmal, und das Spezifischste zuerst — ein Begriff auf 42
     Seiten belegt nichts, einer auf zwei Seiten schon.
     [[stichworttreffer_ist_kein_inhaltstreffer]] */
  const gesehen = new Set();
  const schluessel = [];
  for (const f of fach) {
    for (const w of f.schreibweisen) {
      for (const band of Object.keys(SCHLUESSEL)) {
        const schluesselwort = band + '|' + w.toLowerCase();
        if (gesehen.has(schluesselwort)) continue;
        gesehen.add(schluesselwort);
        const t = imBand(band, w);
        if (t) schluessel.push({ ...t, begriff: f.begriff });
      }
    }
  }
  schluessel.sort((a, b) => a.anzahl - b.anzahl);

  /* Vault: nur nach dem Fachbegriff, und nur die ersten Fundstellen —
     die drei Notizen sind zusammen 213 KB. */
  const vault = [];
  for (const f of fach) {
    for (const w of f.schreibweisen) {
      const t = imVault(w);
      if (t.length) vault.push({ begriff: f.begriff, wort: w, fundstellen: t.length, erste: t.slice(0, 3) });
    }
  }

  /* Elias' eigene Unterlagen: Handschrift, deshalb ein gepflegter Index. */
  const samsung = (SAMSUNG_INDEX.notizen || []).filter(n =>
    (n.begriffe || []).some(b => begriffe.includes(b)));

  const aehn = kand.aehnlicheRegeln || [];
  const schonRegel = aehn.find(r => r.folge === folge && r.zeitmarke === kand.zeitmarke) || null;

  /* ⭐ Die eigentliche Schlüsselquelle für Buch 1. */
  const alleSchreibweisen = [];
  for (const f of fach) alleSchreibweisen.push(...f.schreibweisen);
  const schluessel1 = imSchluessel1(alleSchreibweisen);
  const kap = FOLGE_KAPITEL[folge] || null;

  return {
    schonRegel: schonRegel ? { id: schonRegel.id, name: schonRegel.name } : null,
    kapitel: kap ? kap.kapitel : null,
    kapitelBeleg: kap ? kap.regeln + ' vorhandene Regel(n) aus Folge ' + folge : 'keine Regel aus dieser Folge',
    schluessel1,
    fachbegriffe: fach.map(f => f.begriff),
    schluessel, vault,
    samsung: samsung.map(n => ({ titel: n.titel, seite: n.seite || null })),
    aehnlich: aehn.slice(0, 3).map(r => ({ id: r.id, name: r.name, wert: r.wert })),
  };
}

/* ====================== Durchlauf ======================================= */

/* ⛔⛔ WARUM `regel` AN ELIAS GEHT UND NICHT AN MICH.
   Im selben Gedächtnisabschnitt, der mir das Bewerten aufträgt, steht auch
   Punkt 3 von „Wie damit weitergearbeitet wird" (29.07.2026):
   „Band 2 und 3 liefern Kandidaten für neue Regeln, aber sie werden GESAMMELT,
   NICHT EINGEBAUT: **Elias will alle Regeln selbst freigeben**."
   Beides gilt zugleich, und das ist kein Widerspruch: ich nehme ihm das
   Aussortieren ab, nicht das Freigeben. Aus 95 Fundstellen wird eine Handvoll
   fertiger Vorschläge mit Beleg und Empfehlung — ein Ja oder Nein statt einer
   Abendarbeit. [[antwort_auf_meine_frage_ist_keine_freigabe]] */
const URTEILSARTEN = {
  'schon-regel': { an: 'claude', text: 'Der Inhalt steht bereits als Regel' },
  'weg':         { an: 'claude', text: 'Keine Regel darin' },
  'regel':       { an: 'elias',  text: 'Mein Vorschlag, mit Beleg — dein Ja fehlt' },
  'abweichung':  { an: 'elias',  text: 'Schlüssel und Unterricht widersprechen sich' },
  'unbelegt':    { an: 'elias',  text: 'Keine gedruckte Quelle bestätigt es' },
};

/* Ein Kandidat, der zu Elias geht, braucht eine FRAGE an ihn. Ohne sie steht
   er vor einem Textblock und soll raten, was von ihm erwartet wird — genau
   der Zustand, den er am 22.09. abgeräumt hat. */
const BRAUCHT_FRAGE = new Set(['regel', 'abweichung', 'unbelegt']);

const dateien = fs.readdirSync(KAND).filter(f => /^folge-\d+\.json$/.test(f))
  .sort((a, b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]));
if (!dateien.length) { console.log('Keine folge-XX.json in ' + KAND); process.exit(0); }

const alle = [];
for (const datei of dateien) {
  const d = JSON.parse(fs.readFileSync(path.join(KAND, datei), 'utf8'));
  for (const k of d.kandidaten || []) {
    const id = 'f' + d.folge + '-' + k.zeitmarke.replace(/:/g, '');
    const u = URTEIL.urteile[id] || null;
    alle.push({
      id, folge: d.folge, zeitmarke: k.zeitmarke, text: k.text,
      lehreranteil: k.lehreranteil, begriffe: k.begriffe || {},
      belege: belegeFuer(k, d.folge),
      urteil: u ? u.urteil : null,
      grund: u ? u.grund : null,
      quelle: u ? (u.quelle || null) : null,
      frage: u ? (u.frage || null) : null,
    });
  }
}

const ohneUrteil = alle.filter(a => !a.urteil);
const unbekannteArt = alle.filter(a => a.urteil && !URTEILSARTEN[a.urteil]);
const anElias = alle.filter(a => a.urteil && URTEILSARTEN[a.urteil]
  && URTEILSARTEN[a.urteil].an === 'elias');
const vonMir = alle.filter(a => a.urteil && URTEILSARTEN[a.urteil]
  && URTEILSARTEN[a.urteil].an === 'claude');

/* ⛔ Ein Urteil ohne Begründung ist keins. Genau so entsteht der Zustand, in
   dem eine Liste grün aussieht und niemand mehr weiß, warum. */
const ohneGrund = alle.filter(a => a.urteil && (!a.grund || a.grund.trim().length < 15));
const ohneFrage = alle.filter(a => a.urteil && BRAUCHT_FRAGE.has(a.urteil)
  && (!a.frage || a.frage.trim().length < 15));
/* ⛔ Und eine Fundstelle. „Mein Vorschlag" ohne Beleg ist eine Behauptung. */
const ohneQuelle = alle.filter(a => a.urteil && BRAUCHT_FRAGE.has(a.urteil)
  && (!a.quelle || a.quelle.trim().length < 10));

/* ====================== Ausgabe ========================================= */

if (nurOffen) {
  console.log('=== ' + ohneUrteil.length + ' Kandidaten warten auf MEIN Urteil ===\n');
  for (const a of ohneUrteil) {
    console.log('--- ' + a.id + '  (Folge ' + a.folge + ' @ ' + a.zeitmarke + ')'
      + (a.belege.schonRegel ? '  SCHON REGEL: ' + a.belege.schonRegel.id : ''));
    console.log('Kapitel ' + (a.belege.kapitel || '?') + ' (' + a.belege.kapitelBeleg + ')');
    console.log('Begriffe: ' + Object.keys(a.begriffe).join(', '));
    if (a.belege.schluessel1.length) {
      console.log('Schluessel 1: ' + a.belege.schluessel1.slice(0, 4).map(x =>
        'Lektion ' + x.lektion + (x.seite ? ' (S. ' + x.seite + ')' : '') + ' — ' + x.titel).join(' | '));
    }
    /* Nur die fuenf spezifischsten Fundstellen. Der Rest steht in
       bewertung.json und waere hier Rauschen. */
    const eng = a.belege.schluessel.filter(x => x.anzahl <= 20).slice(0, 5);
    if (eng.length) {
      console.log('Band 2/3: ' + eng.map(x => 'B' + x.band + ' ' + x.wort + ' S.'
        + x.seiten.slice(0, 6).join(',')).join(' | '));
    }
    if (a.belege.samsung.length)
      console.log('Unterlagen: ' + a.belege.samsung.map(x => x.titel).join(' | '));
    console.log(a.text);
    console.log();
  }
  process.exit(0);
}

const zahlen = {};
for (const art of Object.keys(URTEILSARTEN)) zahlen[art] = alle.filter(a => a.urteil === art).length;

console.log('Regelkandidaten: ' + alle.length + ' aus ' + dateien.length + ' Folgen');
console.log('  von mir entschieden: ' + vonMir.length
  + '  (' + Object.entries(zahlen).filter(([k]) => URTEILSARTEN[k].an === 'claude')
      .map(([k, v]) => k + ' ' + v).join(', ') + ')');
console.log('  fuer Elias:          ' + anElias.length
  + '  (' + Object.entries(zahlen).filter(([k]) => URTEILSARTEN[k].an === 'elias')
      .map(([k, v]) => k + ' ' + v).join(', ') + ')');
console.log('  MEIN Rueckstand:     ' + ohneUrteil.length);
console.log('Quellen: Schluessel Band ' + Object.keys(SCHLUESSEL).join('+')
  + ' (' + Object.values(SCHLUESSEL).map(s => s.length).join('/') + ' Seiten)'
  + ' · Vault ' + Object.keys(VAULT_TEXT).length + ' Notizen'
  + ' · Unterlagen ' + (SAMSUNG_INDEX.notizen || []).length + ' Eintraege');

let fehler = 0;

if (!Object.keys(SCHLUESSEL).length) {
  console.error('\n⛔ Keine Schluessel-Textebene gefunden in ' + SCHLUESSEL_ORDNER);
  console.error('   Erzeugen mit: pdftotext -enc UTF-8 Madina_Book2_German_Key.pdf Madina_Book2_German_Key.txt');
  console.error('   Ohne sie waere jede Bewertung eine Scheinmessung — der goldene Standard fehlt.');
  fehler++;
}
if (!Object.keys(VAULT_TEXT).length) {
  console.error('\n⛔ Keine der Vault-Notizen gefunden in ' + VAULT);
  fehler++;
}
if (unbekannteArt.length) {
  console.error('\n⛔ Unbekannte Urteilsart bei ' + unbekannteArt.length + ' Kandidaten: '
    + unbekannteArt.map(a => a.id + '=' + a.urteil).join(', '));
  console.error('   Erlaubt: ' + Object.keys(URTEILSARTEN).join(', '));
  fehler++;
}
if (ohneGrund.length) {
  console.error('\n⛔ ' + ohneGrund.length + ' Urteil(e) ohne Begruendung: '
    + ohneGrund.map(a => a.id).join(', '));
  console.error('   Ein Urteil ohne Begruendung laesst sich spaeter nicht nachpruefen.');
  fehler++;
}
if (ohneFrage.length) {
  console.error('\n⛔ ' + ohneFrage.length + ' Kandidat(en) fuer Elias ohne Frage an ihn: '
    + ohneFrage.map(a => a.id).join(', '));
  console.error('   Ohne Frage steht er vor einem Textblock und soll raten, was gemeint ist.');
  fehler++;
}
if (ohneQuelle.length) {
  console.error('\n⛔ ' + ohneQuelle.length + ' Kandidat(en) fuer Elias ohne Fundstelle: '
    + ohneQuelle.map(a => a.id).join(', '));
  console.error('   „Mein Vorschlag" ohne Beleg ist eine Behauptung.');
  fehler++;
}
if (ohneUrteil.length) {
  console.error('\n⛔ ' + ohneUrteil.length + ' Kandidaten ohne mein Urteil — DAS IST MEIN RUECKSTAND,');
  console.error('   nicht Elias\u2019. Sie gehen NICHT ins Artefakt.');
  console.error('   Ansehen mit: node werkzeuge/kandidaten-bewerten.mjs --offen');
  console.error('   Die ersten: ' + ohneUrteil.slice(0, 12).map(a => a.id).join(', ')
    + (ohneUrteil.length > 12 ? ' …' : ''));
  fehler++;
}

if (!nurPruefen && !stoertest) {
  fs.writeFileSync(ZIEL, JSON.stringify({
    stand: new Date().toISOString(),
    gesamt: alle.length,
    vonMir: vonMir.length,
    fuerElias: anElias.length,
    rueckstand: ohneUrteil.length,
    quellen: {
      schluesselBaende: Object.keys(SCHLUESSEL).map(Number),
      schluesselSeiten: Object.fromEntries(Object.entries(SCHLUESSEL).map(([b, s]) => [b, s.length])),
      vaultNotizen: Object.keys(VAULT_TEXT),
      unterlagen: (SAMSUNG_INDEX.notizen || []).length,
    },
    kandidaten: alle,
  }, null, 1), 'utf8');
  console.log('\ngeschrieben: ' + path.relative(REPO, ZIEL));
}

if (stoertest) {
  if (fehler) { console.log('\n✅ Stoertest: rot geworden wie verlangt (Urteile ignoriert).'); process.exit(0); }
  console.error('\n⛔ Stoertest GRUEN — der Pruefer merkt nicht, wenn die Urteile fehlen.');
  process.exit(1);
}
process.exit(fehler ? 1 : 0);
