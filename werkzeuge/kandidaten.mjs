/* kandidaten.mjs -- Baustein B der Regelkette.
 *
 * Sucht in einer Unterrichtsfolge die Stellen, an denen wahrscheinlich eine
 * Grammatikregel erklaert wird, und legt sie als Kandidatenliste ab. Aus der
 * Liste wird KEINE Regel - darueber entscheidet Elias in Baustein D.
 *
 * Aufruf:
 *   node werkzeuge/kandidaten.mjs 14          Kandidaten fuer Folge 14
 *   node werkzeuge/kandidaten.mjs 14 15 16    mehrere Folgen
 *   node werkzeuge/kandidaten.mjs --offen     alle Folgen ohne Regeln
 *   node werkzeuge/kandidaten.mjs --eichen    Gegenprobe an den bekannten Regeln
 *   … --eichen --ohne-sprecher                dasselbe OHNE die Sprecherspur
 *
 * Ergebnis je Folge: transcripts/kandidaten/folge-NN.json
 *
 * ================== Warum die Gewichte NICHT im Quelltext stehen ============
 *
 * Nahe lag, eine Liste von Fachbegriffen aufzuschreiben und danach zu suchen.
 * Zwei Gruende sprechen dagegen, beide teuer bezahlt:
 *
 * 1. Whisper schreibt die arabischen Begriffe jedes Mal anders ("Tanwin",
 *    "Tanoin", "Madschrur", "majrur"). Eine ausgedachte Schreibweise findet
 *    nichts, und das faellt nicht auf - die Liste bleibt einfach leer.
 * 2. Ein Werkzeug, das seine Antwort im eigenen Quelltext mitbringt, misst
 *    nichts. Haette ich die Gewichte aus den 73 bekannten Regeln fest
 *    eingetragen und danach an denselben 73 Regeln geprueft, waere das Ergebnis
 *    zwangslaeufig gut gewesen und trotzdem wertlos.
 *
 * Deshalb: Die Gewichte werden bei JEDEM Lauf neu aus den vorhandenen Regeln
 * berechnet - und dabei wird die gerade untersuchte Folge AUSGELASSEN. Fuer
 * Folge 14 lernt das Werkzeug also aus 1-13 und hat ueber 14 nichts gewusst.
 * Bei --eichen laeuft das der Reihe nach fuer jede bekannte Folge durch. Das
 * ist eine echte Gegenprobe, keine Selbstbestaetigung.
 *
 * Nebenwirkung, die erwuenscht ist: Je mehr Regeln freigegeben werden, desto
 * besser werden die Gewichte. Das Werkzeug altert nicht.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRT = path.join(REPO, 'transcripts', 'whisper-voll');
const SPRECHER = path.join(REPO, 'transcripts', 'sprecher');
const ZIEL = path.join(REPO, 'transcripts', 'kandidaten');

const FENSTER = 90;   // Sekunden - so lang braucht der Lehrer fuer eine Regel
const SCHRITT = 30;   // Sekunden - Fenster ueberlappen sich, damit keine Regel
                      // zwischen zwei Fenster faellt
const ABSTAND = 90;   // Sekunden Sperrzone um eine bereits erfasste Regel
/* Wie viele Stellen ausgeliefert werden. Gemessen am 18.08.2026 an den 73
 * bekannten Regeln (node werkzeuge/kandidaten.mjs --eichen): top 10 bringt den
 * groessten Gewinn gegenueber Zufall, top 15 findet 77 % der Regeln beim Lesen
 * von 48 % des Unterrichts. Bewusst die groesszuegigere Zahl - eine uebersehene
 * Regel kostet mehr als eine gelesene Stelle zu viel. */
const AUSGABE = 15;

/* Nur zum Messen: die Sprecherspur aus der Bewertung nehmen.
 * GEMESSEN am 18.08.2026 an den 73 bekannten Regeln, top 10:
 *   mit Lehreranteil   47/73 = 64 %,  Faktor 2,07
 *   ohne Lehreranteil  36/73 = 49 %,  Faktor 1,59
 * Die Sprechertrennung ist also 15 Prozentpunkte Trefferquote wert. Das ist
 * der Grund, warum Baustein A vor B kommen musste - vorher war das eine
 * Ueberlegung, jetzt ist es eine Zahl. */
const OHNE_SPRECHER = process.argv.includes('--ohne-sprecher');

/* Wortschatz, in dem ueber Grammatik gesprochen wird. Das ist eine
 * VOKABELLISTE, keine Trefferliste: welche dieser Woerter tatsaechlich etwas
 * anzeigen, entscheidet die Messung unten, nicht diese Reihenfolge. Woerter,
 * die sich als nutzlos erweisen (gemessen am 18.08.2026 z. B. "kapitel" und
 * "grammatik"), bekommen von selbst das Gewicht null. */
const WORTSCHATZ = [
  'nomen', 'verb', 'partikel', 'adjektiv', 'buchstabe', 'subjekt', 'praedikat',
  'mubtada', 'chabar', 'khabar', 'ismun', 'harf', 'fiil',
  'marfu', 'mansub', 'majrur', 'nominativ', 'akkusativ', 'genitiv',
  'endung', 'endet', 'damma', 'damm', 'fatha', 'kasra', 'sukun', 'tanwin',
  'tanoin', 'vokal', 'vokalzeichen',
  'bestimmt', 'unbestimmt', 'nakira', 'marifa', 'weiblich', 'maennlich',
  'einzahl', 'mehrzahl', 'dual', 'feminin', 'maskulin',
  'idafa', 'nat', 'nominalsatz', 'verbalsatz', 'praeposition', 'fragewort',
  'regel', 'lektion', 'kapitel', 'grammatik', 'merken', 'merkt', 'wichtig',
  'ausnahme', 'bedeutet', 'heisst', 'grundsatz', 'beachtet', 'unterschied',
  'gegenteil', 'beispiel', 'immer', 'niemals',
];

/* Umschrift vereinheitlichen. "Madschrur" und "majrur" sind dasselbe Wort;
 * ohne diesen Schritt zaehlt jede Schreibweise fuer sich und keine erreicht
 * eine belegbare Haeufigkeit. */
const glatt = t => t.toLowerCase()
  .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
  .replace(/dsch/g, 'j').replace(/sch/g, 'sh').replace(/['`´']/g, '');

const zeit = s => {
  const t = String(s || '').trim().split(':').map(Number);
  return (!t.length || t.some(isNaN)) ? null : t.reduce((a, b) => a * 60 + b, 0);
};
const mmss = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const nn = n => String(n).padStart(2, '0');

/**
 * Folgen, die ausgewertet sind, aber absichtlich KEINE Regel hervorgebracht
 * haben. Folge 06 ist reine Wiederholung von 04 und 05.
 *
 * ⚠️ Ohne diese Ausnahme meldet --offen sie fuer immer als offen, und eine
 * Meldung, die jedes Mal kommt, liest bald niemand mehr. Dieselbe Erkennung
 * steht in werkzeuge/rueckstand.mjs; wird sie dort geaendert, hier mitziehen.
 * Beide Stellen lesen bewusst dieselbe Datei, damit backlog.md die eine
 * Wahrheit bleibt.
 */
function ausgewertetOhneRegeln() {
  const p = path.join(REPO, 'transcripts', 'backlog.md');
  const out = new Set();
  if (!fs.existsSync(p)) return out;
  for (const z of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = /^\|\s*(\d+)\s*\|/.exec(z);
    if (m && /ausgewertet/i.test(z) && /keine neuen/i.test(z)) out.add(Number(m[1]));
  }
  return out;
}

function ladeRegeln() {
  const quelle = fs.readFileSync(path.join(REPO, 'grammar-data.js'), 'utf8');
  return (new Function(quelle + ';return {GRAMMAR_RULES};'))().GRAMMAR_RULES;
}

/** SRT -> [{von, bis, text}] in Sekunden. */
function ladeSrt(nr) {
  const datei = path.join(SRT, `folge-${nn(nr)}.srt`);
  if (!fs.existsSync(datei)) return null;
  const out = [];
  for (const b of fs.readFileSync(datei, 'utf8').split(/\r?\n\r?\n/)) {
    const z = b.split(/\r?\n/).filter(Boolean);
    const m = z[1] && z[1].match(
      /(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)/);
    if (!m) continue;
    out.push({
      von: (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]) + (+m[4]) / 1000,
      bis: (+m[5]) * 3600 + (+m[6]) * 60 + (+m[7]) + (+m[8]) / 1000,
      text: z.slice(2).join(' ').trim(),
    });
  }
  return out;
}

/** Sprecherspur einer Folge, oder null wenn die Trennung noch nicht lief. */
function ladeSprecher(nr) {
  const rttm = path.join(SPRECHER, `folge-${nn(nr)}.rttm`);
  const meta = path.join(SPRECHER, `folge-${nn(nr)}.json`);
  if (!fs.existsSync(rttm) || !fs.existsSync(meta)) return null;
  const segmente = fs.readFileSync(rttm, 'utf8').split(/\r?\n/).filter(Boolean)
    .map(z => {
      const f = z.split(/\s+/);
      const von = parseFloat(f[3]);
      return { von, bis: von + parseFloat(f[4]), sprecher: f[7] };
    });
  return { segmente, lehrer: JSON.parse(fs.readFileSync(meta, 'utf8')).vermutlichLehrer };
}

/** Anteil der Sekunden in [von,bis], in denen der Lehrer spricht.
 *
 *  ⚠️ Gibt NULL zurueck, wenn es keine Sprecherspur gibt - nicht 1. Der erste
 *  Entwurf lieferte hier 1, damit die Bewertung nicht einbricht; in der Ausgabe
 *  stand daraufhin bei jeder Stelle der Folgen 14-16 "Lehrer 100%". Das sah aus
 *  wie eine Messung, war aber nur die Ersatzannahme - genau die Sorte Zahl, die
 *  spaeter als Beleg zitiert wird. Fehlt der Wert, muss man das SEHEN. */
function lehreranteil(spr, von, bis) {
  if (!spr) return null;
  let lehrer = 0;
  for (const s of spr.segmente) {
    if (s.sprecher !== spr.lehrer) continue;
    const ue = Math.min(bis, s.bis) - Math.max(von, s.von);
    if (ue > 0) lehrer += ue;
  }
  return Math.min(1, lehrer / (bis - von));
}

/* ---------------------------------------------------------------- Gewichte */

/** Zaehlt Begriffstreffer in einem Text. */
function treffer(text) {
  const t = glatt(text);
  const out = {};
  for (const b of WORTSCHATZ) {
    const n = (t.match(new RegExp(b, 'g')) || []).length;
    if (n) out[b] = n;
  }
  return out;
}

/**
 * Lernt aus allen Folgen AUSSER `ausser`, wie stark jedes Wort auf eine Regel
 * hinweist. Rueckgabe: {gewicht: {wort: zahl}, folgen, regeln, anteil}.
 *
 * Das Gewicht ist der Hub minus eins: ein Wort, das im Regelfenster genauso
 * haeufig ist wie ueberall, traegt nichts bei. Negative Gewichte werden auf
 * null gekappt - ein seltenes Wort soll ein Fenster nicht aktiv abwerten,
 * dafuer ist die Datenlage zu duenn.
 */
function lerneGewichte(regeln, ausser) {
  const imF = {}, ges = {};
  let nF = 0, nG = 0, benutzteFolgen = new Set(), benutzteRegeln = 0;

  for (let nr = 1; nr <= 99; nr++) {
    if (nr === ausser) continue;
    const marken = regeln.filter(r => r.source && r.source.folge === nr)
      .map(r => zeit(r.source.approxTimestamp)).filter(s => s != null);
    if (!marken.length) continue;
    const cues = ladeSrt(nr);
    if (!cues) continue;
    benutzteFolgen.add(nr); benutzteRegeln += marken.length;

    for (const c of cues) {
      const drin = marken.some(m => c.bis >= m - FENSTER && c.von <= m + FENSTER);
      const woerter = (glatt(c.text).match(/[a-z-]{2,}/g) || []).length;
      nG += woerter; if (drin) nF += woerter;
      for (const [b, n] of Object.entries(treffer(c.text))) {
        ges[b] = (ges[b] || 0) + n;
        if (drin) imF[b] = (imF[b] || 0) + n;
      }
    }
  }

  const gewicht = {};
  for (const b of WORTSCHATZ) {
    // Unter zehn Vorkommen ist der Hub Zufall, nicht Signal.
    if ((ges[b] || 0) < 10) { gewicht[b] = 0; continue; }
    const hub = ((imF[b] || 0) / nF) / (ges[b] / nG);
    gewicht[b] = Math.max(0, hub - 1);
  }
  return {
    gewicht, folgen: benutzteFolgen.size, regeln: benutzteRegeln,
    anteil: nG ? nF / nG : 0,
  };
}

/* ------------------------------------------------------------ Kandidaten */

/**
 * Bewertet alle Fenster einer Folge.
 * `sperren` sind Zeitpunkte, um die herum schon eine Regel erfasst ist.
 */
function fensterFolge(nr, gewicht, sperren = []) {
  const cues = ladeSrt(nr);
  if (!cues) return null;
  const spr = ladeSprecher(nr);
  const ende = cues.length ? cues[cues.length - 1].bis : 0;
  const out = [];

  for (let start = 0; start + FENSTER <= ende + SCHRITT; start += SCHRITT) {
    const bis = start + FENSTER;
    const mitte = start + FENSTER / 2;
    if (sperren.some(s => Math.abs(s - mitte) <= ABSTAND)) continue;

    const teile = cues.filter(c => c.bis >= start && c.von <= bis);
    if (!teile.length) continue;
    const text = teile.map(c => c.text).join(' ');
    const woerter = (glatt(text).match(/[a-z-]{2,}/g) || []).length;
    if (woerter < 40) continue;   // zu wenig gesprochen, meist eine Pause

    let punkte = 0; const gefunden = {};
    for (const [b, n] of Object.entries(treffer(text))) {
      if (!gewicht[b]) continue;
      punkte += gewicht[b] * n;
      gefunden[b] = n;
    }
    // Auf 100 Woerter beziehen: sonst gewinnt allein, wer schnell redet.
    punkte = punkte / woerter * 100;
    const anteil = lehreranteil(spr, start, bis);   // null = nicht gemessen
    out.push({
      von: start, bis, mitte, zeitmarke: mmss(mitte),
      // Ohne Sprecherspur bleibt die Rohbewertung stehen; sie wird weder
      // gehoben noch gesenkt, und lehreranteil sagt, dass nichts gemessen wurde.
      punkte: +(punkte * (OHNE_SPRECHER ? 1 : (anteil === null ? 1 : anteil))).toFixed(3),
      rohpunkte: +punkte.toFixed(3),
      lehreranteil: anteil === null ? null : +anteil.toFixed(2),
      begriffe: gefunden,
      text,
    });
  }
  out.sort((a, b) => b.punkte - a.punkte);
  return out;
}

/**
 * Aus einer nach Punkten sortierten Fensterliste die Ueberlappungen entfernen:
 * ein Fenster faellt weg, wenn es sich mit einem besser bewerteten ueberschneidet.
 *
 * Warum das noetig ist - der Fehler, den es behebt: Bei 90 s Fensterbreite und
 * 30 s Schritt ueberlappen benachbarte Fenster zu zwei Dritteln. Eine gute
 * Stelle erzeugt darum drei fast gleich gute Fenster, und "die besten 25"
 * waren in Wahrheit acht Stellen, dreifach gezaehlt. Gemessen am 18.08.2026
 * deckten 25 solche Fenster bereits 76 % der Folge ab - die Trefferquote sah
 * mit 73 % gut aus und war in Wirklichkeit schlechter als Raten.
 */
function ohneUeberlappung(fenster) {
  const out = [];
  for (const f of fenster) {
    if (out.some(g => f.von < g.bis && g.von < f.bis)) continue;
    out.push(f);
  }
  return out;
}

/** Laenge der Vereinigung der Zeitfenster - fuer die Zufallserwartung. Die
 *  Summe der Einzellaengen taugt dafuer nicht, sobald sich Fenster ueberlappen. */
function abgedeckteZeit(fenster) {
  const s = [...fenster].sort((a, b) => a.von - b.von);
  let summe = 0, bisher = -1;
  for (const f of s) {
    const von = Math.max(f.von, bisher);
    if (f.bis > von) { summe += f.bis - von; bisher = f.bis; }
  }
  return summe;
}

/* ---------------------------------------------------------------- Eichung */

function eichen(regeln) {
  console.log('Gegenprobe: findet das Werkzeug die Stellen wieder, aus denen die');
  console.log('bekannten Regeln stammen? Je Folge wird NUR aus den anderen Folgen');
  console.log('gelernt, die geprueft Folge bleibt aussen vor.\n');

  const folgen = [...new Set(regeln.filter(r => r.source && r.source.folge)
    .map(r => r.source.folge))].sort((a, b) => a - b);

  /* Gemessen wird bei mehreren Lesetiefen, denn "top K" ist nicht die Frage,
   * die sich in der Praxis stellt. Auf der Freigabeseite liest Elias eine
   * feste Zahl kurzer Stellen; interessant ist also: wie viele muss er lesen,
   * damit die Regeln darunter sind? Eine Folge hat rund 95 Fenster - wer 20
   * davon liest, spart 80 % der Zeit gegenueber dem ganzen Video. */
  /* Gemessen wird bei mehreren Lesetiefen, denn "top K" ist nicht die Frage,
   * die sich in der Praxis stellt. Auf der Freigabeseite liest Elias eine
   * feste Zahl kurzer Stellen; interessant ist: wie viel Unterricht muss er
   * dafuer durchgehen, und wie viele Regeln sind dann dabei?
   *
   * Die Zufallsspalte ist deshalb an die ABGEDECKTE ZEIT gebunden, nicht an
   * die Zahl der Stellen. Wer 40 % der Folge liest, findet auch beim Wuerfeln
   * rund 40 % der Regeln - alles darunter waere schlechter als nichts tun. */
  const TIEFEN = [3, 5, 8, 10, 15, 20];
  const treffer = {}, zufallT = {}, zeitAnteil = {};
  for (const t of TIEFEN) { treffer[t] = 0; zufallT[t] = 0; zeitAnteil[t] = 0; }
  let markenGes = 0, folgenGes = 0;

  console.log('Folge  Regeln  Stellen' + TIEFEN.map(t => `top ${t}`.padStart(10)).join(''));
  for (const nr of folgen) {
    const marken = regeln.filter(r => r.source && r.source.folge === nr)
      .map(r => zeit(r.source.approxTimestamp)).filter(s => s != null);
    if (!marken.length) continue;
    const { gewicht } = lerneGewichte(regeln, nr);
    const alle = fensterFolge(nr, gewicht);
    if (!alle) { console.log(`  ${nn(nr)}   -- kein Transkript`); continue; }
    const stellen = ohneUeberlappung(alle);
    const dauer = Math.max(...alle.map(f => f.bis));
    markenGes += marken.length; folgenGes++;

    const spalten = [];
    for (const t of TIEFEN) {
      const oben = stellen.slice(0, t);
      const g = marken.filter(m => oben.some(f => m >= f.von && m <= f.bis)).length;
      const anteil = Math.min(1, abgedeckteZeit(oben) / dauer);
      treffer[t] += g; zufallT[t] += marken.length * anteil; zeitAnteil[t] += anteil;
      spalten.push(`${g}/${marken.length}`.padStart(10));
    }
    console.log(`  ${nn(nr)}  ${String(marken.length).padStart(6)}`
      + `${String(stellen.length).padStart(9)}` + spalten.join(''));
  }

  console.log('\nLesetiefe   Anteil der Folge   wiedergefunden   Zufall   Faktor');
  for (const t of TIEFEN) {
    const q = treffer[t] / markenGes * 100;
    const qz = zufallT[t] / markenGes * 100;
    console.log(`top ${String(t).padEnd(8)}`
      + `${(zeitAnteil[t] / folgenGes * 100).toFixed(0)} %`.padStart(15)
      + `${treffer[t]}/${markenGes} = ${q.toFixed(0)} %`.padStart(19)
      + `${qz.toFixed(0)} %`.padStart(9)
      + `${(q / (qz || 1)).toFixed(2)}`.padStart(9));
  }

  /* Nicht der groesste Faktor gewinnt, sondern der groesste ABSTAND zum
   * Zufall. Der Faktor ist bei sehr kleiner Lesetiefe immer am hoechsten -
   * top 1 haette rechnerisch den besten Faktor und faende fast nichts.
   * Gesucht ist die Tiefe, bei der die Vorauswahl am meisten einbringt. */
  const gewinn = t => treffer[t] / markenGes * 100 - zufallT[t] / markenGes * 100;
  const best = TIEFEN.reduce((a, b) => gewinn(b) > gewinn(a) ? b : a);
  const qb = treffer[best] / markenGes * 100;
  const zb = zufallT[best] / markenGes * 100;
  console.log(`\nBeste Lesetiefe: top ${best} - dort werden ${qb.toFixed(0)} % der`
    + ` bekannten Regeln\ngefunden, waehrend nur `
    + `${(zeitAnteil[best] / folgenGes * 100).toFixed(0)} % des Unterrichts gelesen wird`
    + ` (${gewinn(best).toFixed(0)} Punkte ueber Zufall).`);
  console.log(`Ausgeliefert werden ${AUSGABE} Stellen - etwas mehr als das`
    + ` Optimum,\ndamit auch die knapp darunter liegenden Regeln mitkommen.`);
  if (qb < zb * 1.4) {
    console.log('\n⛔ Kaum besser als Raten. Als Vorauswahl unbrauchbar -');
    console.log('   erst den Wortschatz verbessern, dann wieder eichen.');
    process.exitCode = 2;
  } else {
    console.log(`\n✅ Faktor ${(qb / (zb || 1)).toFixed(2)} gegenueber Zufall`
      + ` (${zb.toFixed(0)} %).`);
  }
}

/* -------------------------------------------------------------------- Lauf */

const args = process.argv.slice(2);
const regeln = ladeRegeln();

if (args.includes('--eichen')) {
  eichen(regeln);
} else {
  let folgen = args.filter(a => /^\d+$/.test(a)).map(Number);
  if (args.includes('--offen') || !folgen.length) {
    const mitRegeln = new Set(regeln.filter(r => r.source && r.source.folge)
      .map(r => r.source.folge));
    const erledigt = ausgewertetOhneRegeln();
    folgen = []; const uebersprungen = [];
    for (let nr = 1; nr <= 99; nr++) {
      if (mitRegeln.has(nr)) continue;
      if (!fs.existsSync(path.join(SRT, `folge-${nn(nr)}.srt`))) continue;
      if (erledigt.has(nr)) { uebersprungen.push(nr); continue; }
      folgen.push(nr);
    }
    console.log(`Offen (Transkript da, noch keine Regel): `
      + (folgen.map(nn).join(', ') || 'keine'));
    if (uebersprungen.length) {
      console.log(`Laut backlog.md ausgewertet ohne neue Regeln, deshalb `
        + `uebergangen: ${uebersprungen.map(nn).join(', ')}`);
    }
    console.log('');
  }
  if (!folgen.length) process.exit(0);

  fs.mkdirSync(ZIEL, { recursive: true });
  for (const nr of folgen) {
    const gelernt = lerneGewichte(regeln, nr);
    const sperren = regeln.filter(r => r.source && r.source.folge === nr)
      .map(r => zeit(r.source.approxTimestamp)).filter(s => s != null);
    const alle = fensterFolge(nr, gelernt.gewicht, sperren);
    if (!alle) { console.log(`Folge ${nn(nr)}: kein Transkript - uebersprungen`); continue; }

    const spr = ladeSprecher(nr);
    const oben = ohneUeberlappung(alle.filter(f => f.punkte > 0)).slice(0, AUSGABE);
    const dauer = Math.max(...alle.map(f => f.bis));
    const datei = path.join(ZIEL, `folge-${nn(nr)}.json`);
    fs.writeFileSync(datei, JSON.stringify({
      folge: nr,
      erzeugtVon: 'werkzeuge/kandidaten.mjs',
      gelerntAus: { folgen: gelernt.folgen, regeln: gelernt.regeln },
      sprecherspur: !!spr,
      gesperrteMarken: sperren.length,
      fensterGesamt: alle.length,
      folgenlaenge: Math.round(dauer),
      anteilGelesen: +(abgedeckteZeit(oben) / dauer).toFixed(2),
      kandidaten: oben,
    }, null, 1), 'utf8');

    console.log(`Folge ${nn(nr)}: ${oben.length} Stellen aus ${alle.length} Fenstern`
      + ` = ${(abgedeckteZeit(oben) / dauer * 100).toFixed(0)} % der Folge`
      + ` (gelernt aus ${gelernt.regeln} Regeln in ${gelernt.folgen} Folgen)`);
    if (!spr) {
      console.log('   ⚠️  keine Sprecherspur - Schueleraussagen sind nicht');
      console.log('       ausgeschlossen. sprechertrennung.py laufen lassen.');
    }
    for (const f of oben.slice(0, 8)) {
      const b = Object.keys(f.begriffe).slice(0, 6).join(' ');
      const l = f.lehreranteil === null
        ? 'Lehrer   ?' : `Lehrer ${String(Math.round(f.lehreranteil * 100)).padStart(3)}%`;
      console.log(`   ${f.zeitmarke.padStart(6)}  ${String(f.punkte).padStart(6)}`
        + `  ${l}  ${b}`);
    }
    console.log(`   -> ${path.relative(REPO, datei)}`);
  }
}
