/* Setzt die Schriftproben in vorschau.html ein — WOERTLICH aus quran-text.js.
 *
 * Warum ein Werkzeug fuer drei Textzeilen: Die erste Fassung dieser Proben war
 * aus dem Kopf getippt und schrieb ٱلْحَىُّ statt ٱلْحَيُّ (Alif maqsura statt
 * Ya). Genau das verbietet E.1, und genau das faellt bei arabischem Text ohne
 * Vergleich nicht auf. Seitdem kommt jede Zeile aus der Datei, und der Lauf
 * prueft am Ende nach, dass sie auch wirklich dort steht.
 *
 * Aufruf:  node werkzeuge/schriftproben.mjs            (nur zeigen)
 *          node werkzeuge/schriftproben.mjs --schreiben
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.join(HIER, '..');
const ZIEL = path.join(WURZEL, 'vorschau.html');
const SCHREIBEN = process.argv.includes('--schreiben');

const QURAN_TEXT = new Function(
  fs.readFileSync(path.join(WURZEL, 'quran-text.js'), 'utf8') + ';return QURAN_TEXT;')();

const vers = (s, a) => QURAN_TEXT[s][a - 1][0];

/* Die haeufigsten Woerter mit Dolch-Alif (U+0670) im ganzen Text. Nicht
   ausgesucht, sondern ausgezaehlt - so steht die Probe fuer das, was Elias
   beim Lesen tatsaechlich am haeufigsten sieht.
 *
 * ⚠️ Der erste Versuch hat die Woerter "gesaeubert"
 * (`w.replace(/[^ء-ْٰٱ]/g,'')`) und dabei U+0655 HAMZA BELOW weggeschnitten,
 * weil das Zeichen hinter U+0652 liegt: aus إِلَىٰ wurde اِلَىٰ, ein Wort, das
 * so in keiner Zeile steht. Die eigene Gegenprobe hat es gemeldet.
 * Lehre: gezaehlt wird auf einem Schluessel, ANGEZEIGT wird der unveraenderte
 * Fundort. Was auf dem Bildschirm landet, darf nie durch eine Saeuberung
 * gegangen sein. */
const PAUSE = /[ۖ-ۭ]/g;      // Rezitationsmarken, keine Buchstaben
const zaehler = new Map();             // Schluessel -> { n, wortlaut }
for (const s of Object.keys(QURAN_TEXT))
  for (const [ar] of QURAN_TEXT[s])
    for (const w of ar.split(/\s+/)){
      if (!w.includes('ٰ')) continue;
      const schluessel = w.replace(PAUSE, '');
      if (!schluessel) continue;
      const e = zaehler.get(schluessel) || { n: 0, wortlaut: null };
      e.n++;
      /* Bevorzugt eine Fundstelle ohne Rezitationsmarke - die liest sich in
         der Probe ruhiger. Gibt es keine, wird die erste genommen, wie sie ist. */
      if (!e.wortlaut || (PAUSE.test(e.wortlaut) && !new RegExp(PAUSE.source).test(w)))
        e.wortlaut = w;
      zaehler.set(schluessel, e);
    }
const top = [...zaehler.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 5)
  .map(([, e]) => [e.wortlaut, e.n]);

const PROBEN = [
  { text: vers(112, 1), herkunft: 'Sure 112, Vers 1' },
  { text: vers(2, 255).slice(0, 44).trim(), herkunft: 'Sure 2, Vers 255 (Anfang)' },
  { text: top.map(([w]) => w).join('   '),
    herkunft: 'die fuenf haeufigsten Woerter mit Dolch-Alif: ' +
              top.map(([w, n]) => `${n}×`).join(', ') }
];

/* Reihenfolge mit Absicht: die heutige Schrift zuerst, damit der Vergleich von
   dem ausgeht, was er kennt. */
const SCHRIFTEN = [
  ['Noto Naskh Arabic', "'Noto Naskh Arabic'", 'so sieht die App heute aus'],
  ['Amiri', "'Amiri'", 'heute die Rueckfallebene'],
  ['Amiri Quran', "'Amiri Quran'", 'eigens fuer Korantext gezeichnet'],
  ['Scheherazade New', "'Scheherazade New'", 'von SIL, sehr vollstaendige Zeichen']
];

const escape = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const html =
  SCHRIFTEN.map(([name, fam, notiz]) => `
      <div class="schrift-block">
        <div class="schrift-name">${escape(name)} <span>${escape(notiz)}</span></div>
${PROBEN.map(p =>
`        <div class="schrift-probe" style="font-family:${fam}" lang="ar" dir="rtl">${escape(p.text)}</div>`
).join('\n')}
      </div>`).join('') + `
      <p class="schrift-quelle">Alle Zeilen stehen wörtlich so in
        <code>quran-text.js</code> und sind von
        <code>werkzeuge/schriftproben.mjs</code> eingesetzt, nicht abgetippt.
        ${PROBEN.map((p, i) => `Zeile ${i + 1}: ${escape(p.herkunft)}.`).join(' ')}</p>`;

console.log('Proben:');
PROBEN.forEach((p, i) => console.log(`  ${i + 1}: ${p.text}\n     [${p.herkunft}]`));

if (!SCHREIBEN){ console.log('\n(Nur gezeigt. Mit --schreiben landet es in vorschau.html.)'); }
else {
  let seite = fs.readFileSync(ZIEL, 'utf8');
  const anfang = seite.indexOf('<div id="schriftProben">');
  /* ⚠️ NICHT `indexOf('</div>', anfang)`. Der erzeugte Block enthaelt selbst
     </div>-Zeichen, also traf die Suche beim zweiten Lauf das Ende des ERSTEN
     erzeugten Kastens - der Rest blieb stehen und die Seite hatte 7 statt 4
     Bloecke. Ende ist deshalb das Ende des Abschnitts, nicht das naechste
     schliessende div. */
  const ende = seite.indexOf('</section>', anfang);
  if (anfang < 0 || ende < 0){ console.error('Platz in vorschau.html nicht gefunden.'); process.exitCode = 1; }
  else {
    seite = seite.slice(0, anfang) + '<div id="schriftProben">' + html +
            '\n      <!--ENDE-PROBEN--></div>\n    ' + seite.slice(ende);
    fs.writeFileSync(ZIEL, seite, 'utf8');

    /* Gegenprobe: steht jede Zeile so auch WIRKLICH in vorschau.html - und
       stammt sie WIRKLICH aus quran-text.js? Ohne diese zwei Fragen waere das
       Werkzeug nur eine bequemere Art, sich zu vertun. */
    const jetzt = fs.readFileSync(ZIEL, 'utf8');
    const roh = fs.readFileSync(path.join(WURZEL, 'quran-text.js'), 'utf8');
    let alleDrin = true, alleBelegt = true;
    for (const p of PROBEN){
      if (!jetzt.includes(escape(p.text))) alleDrin = false;
      /* Zeile 3 ist zusammengesetzt, deshalb Wort fuer Wort pruefen. */
      for (const w of p.text.split(/[\s ]+/).filter(Boolean))
        if (!roh.includes(w)) alleBelegt = false;
    }
    /* Dritte Probe, aus dem Verdopplungsfehler gelernt: die Seite muss GENAU
       so viele Bloecke haben wie Schriften. Ein mehrfacher Lauf darf nichts
       anhaeufen. */
    const bloecke = (jetzt.match(/class="schrift-block"/g) || []).length;
    const proben  = (jetzt.match(/class="schrift-probe"/g) || []).length;
    const anzahlStimmt = bloecke === SCHRIFTEN.length && proben === SCHRIFTEN.length * PROBEN.length;
    console.log(`\ngeschrieben.  in vorschau.html: ${alleDrin ? 'ja' : 'NEIN'}` +
                `  ·  jedes Wort in quran-text.js belegt: ${alleBelegt ? 'ja' : 'NEIN'}` +
                `\n              ${bloecke} Bloecke (erwartet ${SCHRIFTEN.length}), ` +
                `${proben} Proben (erwartet ${SCHRIFTEN.length * PROBEN.length}) — ` +
                (anzahlStimmt ? 'stimmt' : 'STIMMT NICHT'));
    if (!alleDrin || !alleBelegt || !anzahlStimmt) process.exitCode = 1;
  }
}
