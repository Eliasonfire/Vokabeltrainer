/* abgleich.mjs -- Baustein C der Regelkette.
 *
 * Haelt jeden Kandidaten aus Baustein B gegen die bereits erfassten Regeln:
 * Ist das etwas Neues, oder wiederholt der Lehrer nur, was schon in der App
 * steht? Entschieden wird auch hier nichts - das Werkzeug legt die drei
 * aehnlichsten vorhandenen Regeln daneben, damit Elias in Baustein D auf einen
 * Blick sieht, worueber er ueberhaupt entscheidet.
 *
 * Aufruf:
 *   node werkzeuge/abgleich.mjs            alle Kandidatendateien nachtragen
 *   node werkzeuge/abgleich.mjs 14         nur Folge 14
 *   node werkzeuge/abgleich.mjs --eichen   Gegenprobe (siehe unten)
 *   node werkzeuge/abgleich.mjs --verteilung  haelt die Schwelle bei mehr Daten?
 *
 * Das Ergebnis wird in dieselbe Datei geschrieben, aus der die Kandidaten
 * kommen (transcripts/kandidaten/folge-NN.json), Feld `aehnlicheRegeln`.
 *
 * ================== Woran verglichen wird - und woran NICHT ================
 *
 * Nicht am Regeltext. Eine Regel in grammar-data.js ist auf einen Satz
 * eingedampft, oft arabisch; der Lehrer redet zwei Minuten deutsch darum
 * herum. Diese beiden Texte haben kaum ein Wort gemeinsam, und ein Vergleich
 * haette ueberall null ergeben - ohne dass es auffaellt, denn "keine Dublette"
 * ist ein plausibles Ergebnis.
 *
 * Verglichen wird stattdessen Beleg gegen Beleg: Jede Regel hat eine Zeitmarke
 * in ihrer Folge. Der Unterrichtstext um diese Marke ist das, was der Lehrer
 * gesagt hat, als die Regel entstand. Ein Kandidat aus Folge 15 wird also mit
 * dem verglichen, was in Folge 09 an derselben Stelle gesprochen wurde.
 *
 * ⚠️ Die 11 Buchregeln (ergaenzung: true) haben keine Zeitmarke und koennen
 * deshalb nicht verglichen werden. Sie werden GEMELDET, nicht stillschweigend
 * weggelassen - sonst liest man "keine Dublette" und weiss nicht, dass ein
 * Achtel des Bestands gar nicht geprueft wurde.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRT = path.join(REPO, 'transcripts', 'whisper-voll');
const KAND = path.join(REPO, 'transcripts', 'kandidaten');
const FENSTER = 90;

/* Ab wann ein Wert ein Hinweis ist. GEMESSEN am 18.08.2026 mit
 * `node werkzeuge/abgleich.mjs --eichen`, nicht geschaetzt:
 *
 *   eigener Beleg (identischer Text)   1,000
 *   andere Regel                       Median 0,254, Hoechstwert 0,996
 *   regelfernes Fenster (Rauschen)     Median 0,231, Hoechstwert 0,407
 *
 * ⚠️ Nachgemessen am 18.08.2026 mit --verteilung, weil 0,407 nur der
 * Hoechstwert von 101 Ziehungen war - ein Hoechstwert waechst mit der
 * Stichprobe und ist keine Eigenschaft des Masses. Bei 760 regelfernen
 * Fenstern (Schritt 15 s statt 120 s): Mittelwert 0,238, Streuung 0,061,
 * 0,999-Quantil 0,430, Hoechstwert 0,430. Der Hoechstwert steht ab 50
 * Fenstern praktisch still (0,425 -> 0,430 bei 760). Die Verteilung hat also
 * eine harte obere Kante, keinen langen Schwanz - die Schwelle traegt.
 * ⚠️ Abstand zum 0,999-Quantil sind aber nur 0,020. Wer die Schwelle senkt,
 * bekommt sofort Rauschen; wer die Saetze austauscht, muss neu messen.
 *
 * Der Median einer anderen Regel liegt also KAUM ueber dem Rauschen - dieses
 * Mass erkennt zuverlaessig nur woertliche Wiederholungen, nicht "dieselbe
 * Regel, andere Worte". Deshalb ist die Schwelle am Hoechstwert des Rauschens
 * ausgerichtet: was darueber liegt, hat kein regelfernes Fenster je erreicht.
 *
 * ⚠️ Der erste Entwurf hatte hier 0,20 stehen - unter dem Median des Rauschens.
 * Damit haette jede Stelle ein "≈" bekommen, und eine Markierung, die immer
 * erscheint, sagt nichts.
 */
const SCHWELLE = 0.45;

const glatt = t => t.toLowerCase()
  .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
  .replace(/dsch/g, 'j').replace(/sch/g, 'sh').replace(/['`´']/g, '');
const zeitS = s => {
  const t = String(s || '').trim().split(':').map(Number);
  return (!t.length || t.some(isNaN)) ? null : t.reduce((a, b) => a * 60 + b, 0);
};
const mmss = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const nn = n => String(n).padStart(2, '0');

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

const cache = {};
function cues(nr) {
  if (!(nr in cache)) cache[nr] = ladeSrt(nr);
  return cache[nr];
}

/** Der gesprochene Text im Fenster um eine Zeitmarke. */
function belegtext(folge, sekunde, breite = FENSTER) {
  const c = cues(folge);
  if (!c) return null;
  const von = sekunde - breite / 2, bis = sekunde + breite / 2;
  return c.filter(x => x.bis >= von && x.von <= bis).map(x => x.text).join(' ');
}

const woerter = t => (glatt(t).match(/[a-z][a-z-]{2,}/g) || []);

/* ------------------------------------------------------- Aehnlichkeitsmass */

/**
 * Baut aus einer Sammlung von Texten ein Vergleichsmodell (idf) und liefert
 * eine Funktion, die einen Text in einen gewichteten Vektor verwandelt.
 *
 * Woerter, die in fast jedem Fenster vorkommen ("das", "wir", "also"), tragen
 * nichts zur Unterscheidung bei und bekommen ueber die inverse
 * Dokumenthaeufigkeit von selbst ein kleines Gewicht. Eine handgeschriebene
 * Stoppwortliste waere hier die schlechtere Wahl: sie muesste geraten werden
 * und wuerde den Fuellwortschatz dieses einen Lehrers verfehlen.
 */
function baueModell(texte) {
  const df = new Map();
  for (const t of texte) {
    for (const w of new Set(woerter(t))) df.set(w, (df.get(w) || 0) + 1);
  }
  const n = texte.length;
  return function vektor(text) {
    const tf = new Map();
    for (const w of woerter(text)) tf.set(w, (tf.get(w) || 0) + 1);
    const v = new Map(); let norm = 0;
    for (const [w, f] of tf) {
      const d = df.get(w) || 0;
      if (d < 2) continue;                 // Einzelvorkommen belegen nichts
      const idf = Math.log((n + 1) / (d + 0.5));
      const g = (1 + Math.log(f)) * idf;
      v.set(w, g); norm += g * g;
    }
    norm = Math.sqrt(norm) || 1;
    for (const [w, g] of v) v.set(w, g / norm);
    return v;
  };
}

function kosinus(a, b) {
  let s = 0;
  const [klein, gross] = a.size < b.size ? [a, b] : [b, a];
  for (const [w, g] of klein) { const h = gross.get(w); if (h) s += g * h; }
  return s;
}

/* ------------------------------------------------------------- Regelbelege */

function ladeRegeln() {
  const quelle = fs.readFileSync(path.join(REPO, 'grammar-data.js'), 'utf8');
  return (new Function(quelle + ';return {GRAMMAR_RULES};'))().GRAMMAR_RULES;
}

/** Zu jeder Lehrerregel den Unterrichtstext, aus dem sie stammt. */
function regelbelege(regeln) {
  const mit = [], ohne = [];
  for (const r of regeln) {
    if (!r.source || !r.source.folge) { ohne.push(r); continue; }
    const s = zeitS(r.source.approxTimestamp);
    const text = s == null ? null : belegtext(r.source.folge, s);
    if (!text) { ohne.push(r); continue; }
    mit.push({
      id: r.id, name: r.name, folge: r.source.folge,
      zeitmarke: r.source.approxTimestamp, sekunde: s, text,
    });
  }
  return { mit, ohne };
}

/* ---------------------------------------------------------------- Eichung */

function eichen(regeln) {
  const { mit, ohne } = regelbelege(regeln);
  console.log(`${mit.length} Regeln mit Belegstelle, ${ohne.length} ohne.`);
  if (ohne.length) {
    console.log('Ohne Belegstelle und deshalb NIE als Dublette erkennbar:');
    for (const r of ohne) console.log(`   ${r.id}${r.ergaenzung ? '  (Buchregel)' : ''}`);
  }
  console.log('');

  const vektor = baueModell(mit.map(m => m.text));
  const vs = mit.map(m => vektor(m.text));

  /* ---- Probe 1: MUSS anschlagen ----------------------------------------
   * Der Beleg einer Regel wird als Kandidat eingespeist. Erkennt das Mass
   * nicht einmal den identischen Text wieder, misst es nichts. */
  let rangEins = 0; const selbstwerte = [];
  for (let i = 0; i < mit.length; i++) {
    let best = -1, bestJ = -1;
    for (let j = 0; j < mit.length; j++) {
      const w = kosinus(vs[i], vs[j]);
      if (w > best) { best = w; bestJ = j; }
    }
    if (bestJ === i) rangEins++;
    selbstwerte.push(best);
  }
  const mittel = a => a.reduce((x, y) => x + y, 0) / (a.length || 1);
  console.log(`Probe 1 (muss anschlagen): eigener Beleg auf Platz 1 bei `
    + `${rangEins} von ${mit.length}.`);

  /* ---- Probe 2: darf NICHT anschlagen -----------------------------------
   * Fenster, die mehr als fuenf Minuten von jeder Regelmarke entfernt liegen.
   * Wenn die genauso hohe Werte erreichen wie Probe 1, ist jede Zahl aus
   * diesem Werkzeug bedeutungslos. */
  const fremd = [];
  for (const nr of [...new Set(mit.map(m => m.folge))]) {
    const marken = mit.filter(m => m.folge === nr).map(m => m.sekunde);
    const c = cues(nr); if (!c) continue;
    const ende = c[c.length - 1].bis;
    for (let s = 60; s < ende - 60; s += 120) {
      if (marken.some(m => Math.abs(m - s) < 300)) continue;
      const t = belegtext(nr, s);
      if (t && woerter(t).length > 60) fremd.push(t);
    }
  }
  const fremdwerte = fremd.map(t => {
    const v = vektor(t);
    return Math.max(...vs.map(x => kosinus(v, x)));
  });

  console.log(`Probe 2 (darf nicht anschlagen): ${fremd.length} regelferne Fenster.`);
  console.log('');
  console.log('                       Mittelwert   Median   Hoechstwert');
  const med = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] || 0; };
  console.log(`eigener Beleg (Probe 1) ${mittel(selbstwerte).toFixed(3).padStart(10)}`
    + `${med(selbstwerte).toFixed(3).padStart(9)}${Math.max(...selbstwerte).toFixed(3).padStart(14)}`);
  console.log(`regelfern     (Probe 2) ${mittel(fremdwerte).toFixed(3).padStart(10)}`
    + `${med(fremdwerte).toFixed(3).padStart(9)}${Math.max(...fremdwerte).toFixed(3).padStart(14)}`);

  /* Was ohne den Selbstvergleich uebrig bleibt - das ist der Wert, den ein
     echter Kandidat aus einer neuen Folge erreichen kann. */
  const fremdRegel = [];
  for (let i = 0; i < mit.length; i++) {
    let best = 0;
    for (let j = 0; j < mit.length; j++) if (j !== i) best = Math.max(best, kosinus(vs[i], vs[j]));
    fremdRegel.push(best);
  }
  console.log(`andere Regel           ${mittel(fremdRegel).toFixed(3).padStart(10)}`
    + `${med(fremdRegel).toFixed(3).padStart(9)}${Math.max(...fremdRegel).toFixed(3).padStart(14)}`);

  const trenn = med(fremdwerte);
  console.log('');
  if (rangEins < mit.length * 0.95) {
    console.log('⛔ Probe 1 versagt: das Mass erkennt nicht einmal den eigenen Text.');
    process.exitCode = 2;
  } else if (mittel(fremdwerte) > mittel(fremdRegel) * 0.9) {
    console.log('⛔ Probe 2 versagt: regelferne Fenster erreichen fast dieselben');
    console.log('   Werte wie echte Regelbelege. Die Zahl unterscheidet nichts.');
    process.exitCode = 2;
  } else {
    console.log('✅ Beide Proben bestanden. Als Hinweis brauchbar - aber es bleibt');
    console.log('   ein Hinweis: die Entscheidung faellt in Baustein D.');
    console.log(`   Erfahrungswert: was ueber ${(trenn * 2).toFixed(2)} liegt, lohnt`);
    console.log('   einen Blick, darunter ist meist nur gemeinsamer Fuellwortschatz.');
  }
}

/**
 * Haelt die Schwelle auch bei mehr Daten?
 *
 * Die Begruendung fuer SCHWELLE = 0,45 lautete: "kein regelfernes Fenster kam
 * ueber 0,407". Das ist aber der Hoechstwert von 101 Ziehungen - bei 1000
 * Ziehungen waere er vermutlich hoeher. Ein Hoechstwert waechst mit der
 * Stichprobe; er ist keine Eigenschaft des Masses.
 *
 * Diese Messung nimmt deshalb viel mehr regelferne Fenster (kleinerer Schritt)
 * und zeigt, wie der Hoechstwert mit der Zahl der Ziehungen mitwaechst. Wenn er
 * bei 1000 Fenstern die Schwelle erreicht, ist die Schwelle zu niedrig.
 */
function verteilung(regeln) {
  const { mit } = regelbelege(regeln);
  const vektor = baueModell(mit.map(m => m.text));
  const vs = mit.map(m => vektor(m.text));

  console.log('Regelferne Fenster in dichter Folge sammeln (Schritt 15 s statt 120 s)\n');
  const werte = [];
  for (const nr of [...new Set(mit.map(m => m.folge))]) {
    const marken = mit.filter(m => m.folge === nr).map(m => m.sekunde);
    const c = cues(nr); if (!c) continue;
    const ende = c[c.length - 1].bis;
    for (let s = 60; s < ende - 60; s += 15) {
      if (marken.some(m => Math.abs(m - s) < 300)) continue;
      const t = belegtext(nr, s);
      if (!t || woerter(t).length <= 60) continue;
      const v = vektor(t);
      werte.push(Math.max(...vs.map(x => kosinus(v, x))));
    }
  }
  if (!werte.length) { console.log('Keine Fenster gefunden.'); return; }

  const s = [...werte].sort((a, b) => a - b);
  const q = p => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  const mittel = s.reduce((a, b) => a + b, 0) / s.length;
  const streu = Math.sqrt(s.reduce((a, b) => a + (b - mittel) ** 2, 0) / s.length);

  console.log(`${werte.length} regelferne Fenster.`);
  console.log(`Mittelwert ${mittel.toFixed(3)} · Streuung ${streu.toFixed(3)}`);
  console.log('Quantil    0,50   0,90   0,99  0,999   Hoechstwert');
  console.log(`         ${q(.50).toFixed(3)}  ${q(.90).toFixed(3)}  ${q(.99).toFixed(3)}`
    + `  ${q(.999).toFixed(3)}         ${s[s.length - 1].toFixed(3)}`);

  /* Wie schnell waechst der Hoechstwert? Die erste Haelfte, das erste Viertel
     usw. - ohne Zufall, einfach der Reihe nach, damit das Ergebnis
     wiederholbar ist. */
  console.log('\nWie der Hoechstwert mit der Stichprobe waechst:');
  console.log('Fenster   Hoechstwert');
  for (const n of [50, 100, 200, 400, 800, werte.length]) {
    if (n > werte.length) continue;
    const teil = werte.slice(0, n);
    console.log(`${String(n).padStart(7)}         ${Math.max(...teil).toFixed(3)}`);
  }

  const hoch = s[s.length - 1];
  console.log('');
  if (hoch >= SCHWELLE) {
    console.log(`⛔ Die Schwelle ${SCHWELLE} ist ZU NIEDRIG: ein regelfernes`);
    console.log(`   Fenster erreicht ${hoch.toFixed(3)}. Sie war am Hoechstwert`);
    console.log('   einer zu kleinen Stichprobe ausgerichtet.');
    process.exitCode = 2;
  } else {
    console.log(`✅ Kein regelfernes Fenster erreicht die Schwelle ${SCHWELLE}`);
    console.log(`   (hoechster Wert ${hoch.toFixed(3)} bei ${werte.length} Fenstern).`);
    console.log(`   Abstand zum 0,999-Quantil: ${(SCHWELLE - q(.999)).toFixed(3)}.`);
  }
}

/* -------------------------------------------------------------------- Lauf */

const args = process.argv.slice(2);
const regeln = ladeRegeln();

if (args.includes('--verteilung')) { verteilung(regeln); }
else if (args.includes('--eichen')) { eichen(regeln); }
else {
  if (!fs.existsSync(KAND)) {
    console.log(`Keine Kandidaten unter ${path.relative(REPO, KAND)} - `
      + 'erst werkzeuge/kandidaten.mjs laufen lassen.');
    process.exit(0);
  }
  const nur = args.filter(a => /^\d+$/.test(a)).map(Number);
  const dateien = fs.readdirSync(KAND).filter(f => /^folge-\d+\.json$/.test(f))
    .filter(f => !nur.length || nur.includes(Number(f.match(/\d+/)[0])));
  if (!dateien.length) { console.log('Keine passende Kandidatendatei.'); process.exit(0); }

  const { mit, ohne } = regelbelege(regeln);
  const vektor = baueModell(mit.map(m => m.text));
  const vs = mit.map(m => vektor(m.text));
  console.log(`Vergleichsbestand: ${mit.length} Regeln mit Belegstelle.`);
  if (ohne.length) {
    const buch = ohne.filter(r => r.ergaenzung).length;
    const art = buch === ohne.length ? 'alle aus den Lehrbuechern'
      : `${buch} aus den Lehrbuechern`;
    console.log(`⚠️  ${ohne.length} Regeln ohne Belegstelle im Unterricht `
      + `(${art}) sind`);
    console.log('    NICHT im Vergleich. Eine Dublette dazu geht hier als "neu" durch.');
  }
  console.log('');

  for (const d of dateien) {
    const pfad = path.join(KAND, d);
    const daten = JSON.parse(fs.readFileSync(pfad, 'utf8'));
    let auffaellig = 0;
    for (const k of daten.kandidaten) {
      const v = vektor(k.text);
      const rang = mit.map((m, j) => ({
        id: m.id, name: m.name, folge: m.folge, zeitmarke: m.zeitmarke,
        wert: +kosinus(v, vs[j]).toFixed(3),
      })).sort((a, b) => b.wert - a.wert).slice(0, 3);
      k.aehnlicheRegeln = rang;
      if (rang[0] && rang[0].wert >= SCHWELLE) auffaellig++;
    }
    daten.abgeglichenGegen = mit.length;
    daten.ohneBelegstelle = ohne.length;
    fs.writeFileSync(pfad, JSON.stringify(daten, null, 1), 'utf8');

    console.log(`Folge ${nn(daten.folge)}: ${daten.kandidaten.length} Stellen, `
      + `davon ${auffaellig} mit deutlicher Aehnlichkeit zu einer vorhandenen Regel.`);
    for (const k of daten.kandidaten.slice(0, 8)) {
      const a = k.aehnlicheRegeln[0];
      const hin = a.wert >= SCHWELLE ? '≈' : ' ';
      console.log(`   ${k.zeitmarke.padStart(6)} ${hin} ${String(a.wert).padEnd(6)}`
        + ` ${a.id} (F${nn(a.folge)} ${a.zeitmarke})`);
    }
  }
  console.log('\n"≈" heisst: aehnelt einer vorhandenen Regel, bitte pruefen.');
  console.log('Es heisst NICHT "Dublette" - das entscheidet Elias in Baustein D.');
  console.log('');
  console.log('⚠️ Und der Umkehrschluss gilt NICHT. Ein niedriger Wert beweist');
  console.log('   nicht, dass die Stelle neu ist: das Mass erkennt zuverlaessig');
  console.log('   nur woertliche Wiederholungen (--eichen zeigt die Zahlen).');
  console.log('   Erklaert der Lehrer dieselbe Regel mit anderen Beispielen,');
  console.log('   bleibt der Wert niedrig. Die Spalte ist eine Abkuerzung fuer');
  console.log('   den offensichtlichen Fall, kein Ersatz fuers Hinsehen.');
}
