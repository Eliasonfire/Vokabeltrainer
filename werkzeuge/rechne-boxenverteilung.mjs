/* K3 — Elias' Frage vom 07.09.2026, 18:56:
 *   „aber ist die aufteilung 4 und 6 wirklich gut so täglich? 2-5 sind 117
 *    vokabeln hingegen box 1 130 vokabeln hat. ich weiß es selbst auch nicht
 *    deswegen will ich mich mit dir diesbezüglich beraten"
 *
 * ⛔ Das ist eine BERATUNG, keine Entscheidung von mir. Hier wird gerechnet und
 *    vorgelegt; welche Aufteilung gilt, sagt er.
 *
 * Gerechnet wird mit den ECHTEN Werten der App, aus js/kern.js gelesen statt
 * abgetippt: INTERVALS {1:0, 2:1, 3:3, 4:7, 5:16}, DECKEL_ANTEIL_BOX1 = 0.4,
 * die Stufenfunktionen aus STUFEN und die Auffuellregel aus tagesAuswahl().
 * [[testvorlage_selbst_nachgebaut]]
 *
 * ⚠️ Eine Annahme bleibt unvermeidlich: seine TREFFERQUOTE. Sie wird erst seit
 *    dem 07.09.2026 mitgeschrieben (vt_quoteTage), fuer die Vergangenheit gibt
 *    es sie nicht. Deshalb wird mit drei Quoten gerechnet und das auch so
 *    gesagt. [[zahlen_ohne_beleg]]
 */
import fs from 'node:fs';

const kern = fs.readFileSync('js/kern.js', 'utf8');
const lies = (name, muster) => {
  const m = kern.match(muster);
  if (!m){ console.error('FEHLER: ' + name + ' nicht gefunden'); process.exit(1); }
  return m[1];
};
const INTERVALS = eval('(' + lies('INTERVALS', /const INTERVALS = (\{[^}]+\})/) + ')');
const ANTEIL    = Number(lies('DECKEL_ANTEIL_BOX1', /const DECKEL_ANTEIL_BOX1 = ([\d.]+)/));
console.log('Aus js/kern.js gelesen: INTERVALS = ' + JSON.stringify(INTERVALS)
          + ', DECKEL_ANTEIL_BOX1 = ' + ANTEIL);

/* Die Stufen, wie in js/lernen.js: nochmal = eine Box runter, gut = eine hoch. */
const runter = b => Math.max(1, b - 1);
const hoch   = b => Math.min(5, b + 1);

/* Die Auffuellregel aus tagesAuswahl() — woertlich dieselbe Rechnung. */
function auswahl(faelligNeu, faelligWdh, deckel, anteil){
  let platzNeu = Math.round(deckel * anteil);
  let platzWdh = deckel - platzNeu;
  if (faelligNeu < platzNeu){ platzWdh += platzNeu - faelligNeu; platzNeu = faelligNeu; }
  if (faelligWdh < platzWdh){ platzNeu += platzWdh - faelligWdh; platzWdh = faelligWdh; }
  return [Math.min(platzNeu, faelligNeu), Math.min(platzWdh, faelligWdh)];
}

/* Ein Bestand: 130 in Box 1, 117 verteilt auf Box 2-5 (seine Zahlen vom
   07.09.2026). Box 2-5 wird gleichmaessig verteilt — ihre genaue Verteilung
   kennt nur sein Geraet. */
function bestand(){
  const w = [];
  for (let i = 0; i < 130; i++) w.push({ box: 1, faellig: 0 });
  const je = Math.floor(117 / 4), rest = 117 - je * 4;
  let b = 2;
  for (let k = 0; k < 4; k++){
    const n = je + (k < rest ? 1 : 0);
    /* Faelligkeit gleichmaessig ueber das Intervall gestreut, sonst kaeme der
       ganze Block an einem Tag. */
    for (let i = 0; i < n; i++) w.push({ box: b, faellig: i % (INTERVALS[b] || 1) });
    b++;
  }
  return w;
}

function lauf(anteil, quote, tage, deckel = 10){
  const w = bestand();
  let geuebt = 0, box1Weg = null;
  for (let t = 0; t < tage; t++){
    const neu = w.filter(x => x.box <= 1 && x.faellig <= t);
    const wdh = w.filter(x => x.box  > 1 && x.faellig <= t);
    const [pn, pw] = auswahl(neu.length, wdh.length, deckel, anteil);
    for (const x of neu.slice(0, pn).concat(wdh.slice(0, pw))){
      const richtig = Math.random() < quote;
      x.box = richtig ? hoch(x.box) : runter(x.box);
      x.faellig = t + (INTERVALS[x.box] || 0) + 1;
      geuebt++;
    }
    if (box1Weg === null && w.filter(x => x.box === 1).length === 0) box1Weg = t + 1;
  }
  return {
    box1:  w.filter(x => x.box === 1).length,
    box23: w.filter(x => x.box === 2 || x.box === 3).length,
    box45: w.filter(x => x.box >= 4).length,
    box5:  w.filter(x => x.box === 5).length,
    geuebt, box1Weg,
  };
}

/* Mittelwert ueber viele Laeufe — ein einzelner Wuerfelwurf ist keine Aussage. */
function mittel(anteil, quote, tage, laeufe = 400){
  const s = { box1:0, box23:0, box45:0, box5:0, geuebt:0, box1WegSumme:0, box1WegAnzahl:0 };
  for (let i = 0; i < laeufe; i++){
    const r = lauf(anteil, quote, tage);
    s.box1 += r.box1; s.box23 += r.box23; s.box45 += r.box45; s.box5 += r.box5;
    s.geuebt += r.geuebt;
    if (r.box1Weg !== null){ s.box1WegSumme += r.box1Weg; s.box1WegAnzahl++; }
  }
  const d = (x) => Math.round(x / laeufe);
  return { box1: d(s.box1), box23: d(s.box23), box45: d(s.box45), box5: d(s.box5),
           geuebt: d(s.geuebt),
           box1Weg: s.box1WegAnzahl > laeufe / 2 ? Math.round(s.box1WegSumme / s.box1WegAnzahl) : null };
}

const VARIANTEN = [[0.3,'3 / 7'], [0.4,'4 / 6  ← heute'], [0.5,'5 / 5'], [0.6,'6 / 4']];
for (const quote of [0.7, 0.8, 0.9]){
  console.log('\n======== Trefferquote ' + Math.round(quote*100) + ' % · nach 60 Tagen ========');
  console.log('  Aufteilung   Box 1   Box 2-3   Box 4-5   davon Box 5   Box 1 leer nach   Karten geübt');
  for (const [a, name] of VARIANTEN){
    const r = mittel(a, quote, 60);
    console.log('  ' + name.padEnd(13)
      + String(r.box1).padStart(4)
      + String(r.box23).padStart(10)
      + String(r.box45).padStart(10)
      + String(r.box5).padStart(14)
      + (r.box1Weg ? String(r.box1Weg + ' Tage').padStart(18) : '        nicht in 60'.padStart(18))
      + String(r.geuebt).padStart(15));
  }
}

/* Gegenprobe: bei einem Deckel, der groesser ist als der faellige Vorrat,
   darf die Aufteilung ueberhaupt keine Rolle mehr spielen. */
console.log('\n======== Eichung: Deckel 500 (groesser als jeder Vorrat) ========');
for (const [a, name] of VARIANTEN){
  const r = lauf(a, 0.8, 20, 500);
  console.log('  ' + name.padEnd(13) + ' Box 1: ' + String(r.box1).padStart(4)
    + '   geübt: ' + r.geuebt + '   (muss für alle vier ähnlich sein)');
}
