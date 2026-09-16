/* test-tagesdeckel.mjs — bewacht `tagesAuswahl()` in js/kern.js.
 *
 * ⭐⭐ DER KERN IST NICHT „es deckelt", SONDERN „Box 4 und 5 kommen trotzdem
 * dran". Box 1 hat Intervall 0, ihre Wörter sind also JEDEN Tag fällig
 * (gemessen 06.09.2026: 80 von 171). Ein Deckel, der nur nach Fälligkeit
 * abschneidet, gäbe ihnen alle Plätze — und die 70 Wörter aus Box 4 und 5
 * verfielen still, während die Anzeige „alles erledigt" zeigt.
 * Fall 3 ist deshalb der eigentliche Test; ohne ihn wäre der Deckel eine
 * Verschlechterung, die wie eine Verbesserung aussieht.
 * [[ausfall_ist_unsichtbar_gebaut]] [[was_geuebt_werden_soll]]
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const WURZEL = path.dirname(fileURLToPath(import.meta.url));
const quelle = fs.readFileSync(path.join(WURZEL, 'js', 'kern.js'), 'utf8');

let ok = 0, schlecht = 0;
const pruefe = (was, bedingung, gemessen) => {
  if (bedingung) { ok++; console.log('  ✔ ' + was); }
  else { schlecht++; console.log('  ✘ ' + was + '   gemessen: ' + gemessen); }
};

/* ⛔ Die Funktion aus dem ECHTEN Quelltext schneiden, nicht nachbauen —
   js/kern.js lässt sich nicht als Ganzes laden (DOM, localStorage).
   Klammerbilanz statt Regex: ein Muster bis `\n}` träfe die erste innere
   Klammer. [[testvorlage_selbst_nachgebaut]] */
function schneide(text, name){
  const anfang = text.indexOf('function ' + name + '(');
  if (anfang < 0) return null;
  let i = text.indexOf('{', anfang), tiefe = 0;
  for (; i < text.length; i++){
    if (text[i] === '{') tiefe++;
    else if (text[i] === '}'){ tiefe--; if (!tiefe) return text.slice(anfang, i + 1); }
  }
  return null;
}
/* Seit dem 16.09.2026 gehören nieAbgefragt() und neueZuerst() dazu — tagesAuswahl()
   ruft sie. Fehlt eine, meldet das der Test, statt mit ReferenceError zu enden. */
const teile = ['nieAbgefragt', 'neueZuerst', 'tagesAuswahl'].map(n => [n, schneide(quelle, n)]);
const fehlend = teile.filter(([, t]) => !t).map(([n]) => n);
if (fehlend.length) { console.log('⛔ nicht mehr in js/kern.js: ' + fehlend.join(', ')); process.exit(1); }
const code = teile.map(([, t]) => t).join('\n');

/* Die Anteilskonstante ebenfalls aus der Quelle holen — eine eigene Zahl hier
   wäre eine zweite Wahrheit, die beim ersten Ändern auseinanderläuft. */
const mAnteil = quelle.match(/const DECKEL_ANTEIL_BOX1\s*=\s*([\d.]+)/);
if (!mAnteil) { console.log('⛔ DECKEL_ANTEIL_BOX1 nicht gefunden'); process.exit(1); }

const c = { PROGRESS: {}, Array, Math, Number, Object, console };
vm.createContext(c);
vm.runInContext('const DECKEL_ANTEIL_BOX1 = ' + mAnteil[1] + ';\n' + code
  + '\n;globalThis.__ = tagesAuswahl;', c);
const auswahl = c.__;

/* Testbestand: n Wörter mit gegebener Box. */
function bestand(spec){
  const pool = []; let i = 0;
  for (const [box, anzahl] of Object.entries(spec)){
    for (let k = 0; k < anzahl; k++){
      const id = 'b' + box + '_' + k;
      c.PROGRESS[id] = { box: Number(box) };
      pool.push({ id, box: Number(box) });
      i++;
    }
  }
  return pool;
}
const boxenVon = (liste) => liste.map(w => c.PROGRESS[w.id].box);

console.log('test-tagesdeckel.mjs — die Tagesration\n');

/* ---------- 1. Kein Deckel ---------- */
{
  c.PROGRESS = {};
  const p = bestand({ 1: 50, 4: 20 });
  pruefe('Deckel 0 → der Pool kommt unverändert zurück', auswahl(p, 0).length === 70, auswahl(p, 0).length);
  pruefe('Pool kleiner als der Deckel → unverändert', auswahl(p, 200).length === 70, auswahl(p, 200).length);
  pruefe('leerer Pool → leer, ohne zu werfen', auswahl([], 10).length === 0, '—');
}

/* ---------- 2. Die Zahl stimmt ---------- */
{
  c.PROGRESS = {};
  const p = bestand({ 1: 80, 4: 40, 5: 30 });
  pruefe('150 fällige, Deckel 10 → genau 10', auswahl(p, 10).length === 10, auswahl(p, 10).length);
}

/* ---------- 3. ⭐⭐ DER KERN: Box 4 und 5 kommen dran ---------- */
{
  c.PROGRESS = {};
  /* Die gemessene Lage vom 06.09.2026: 80 in Box 1, 70 in Box 4+5. */
  const p = bestand({ 1: 80, 4: 24, 5: 46 });
  const gewaehlt = auswahl(p, 10);
  const boxen = boxenVon(gewaehlt);
  const ausBox1 = boxen.filter(b => b <= 1).length;
  const ausWdh  = boxen.filter(b => b > 1).length;
  pruefe('80 Box-1-Wörter belegen NICHT alle Plätze', ausBox1 < 10, ausBox1);
  pruefe('genau 4 aus Box 1 (Anteil ' + mAnteil[1] + ')', ausBox1 === 4, ausBox1);
  pruefe('genau 6 Wiederholungen aus Box 2–5', ausWdh === 6, ausWdh);
  /* ⛔ Ohne die Quote wäre das Ergebnis 10× Box 1 — der Störfall, der zeigt,
     dass die Schranke überhaupt wirkt. Gegenprobe: nur nach Reihenfolge
     abschneiden. */
  const ohneQuote = p.slice(0, 10).filter(w => c.PROGRESS[w.id].box <= 1).length;
  pruefe('STÖRTEST — ohne Quote wären es 10 aus Box 1', ohneQuote === 10, ohneQuote);
}

/* ---------- 4. Auffüllen, wenn eine Seite fehlt ---------- */
{
  c.PROGRESS = {};
  const nurNeu = bestand({ 1: 30 });
  pruefe('nur Box 1 vorhanden → der Deckel wird trotzdem voll',
    auswahl(nurNeu, 10).length === 10, auswahl(nurNeu, 10).length);
  c.PROGRESS = {};
  const nurWdh = bestand({ 3: 30 });
  pruefe('nur Wiederholungen vorhanden → ebenfalls voll',
    auswahl(nurWdh, 10).length === 10, auswahl(nurWdh, 10).length);
  c.PROGRESS = {};
  const wenigWdh = bestand({ 1: 40, 5: 2 });
  const g = auswahl(wenigWdh, 10);
  pruefe('nur 2 Wiederholungen da → 8 aus Box 1 füllen auf',
    g.length === 10 && boxenVon(g).filter(b => b > 1).length === 2,
    g.length + ' / ' + boxenVon(g).filter(b => b > 1).length);
}

/* ---------- 5. Die Reihenfolge des Pools bleibt ---------- */
{
  c.PROGRESS = {};
  const p = bestand({ 1: 10, 4: 10 });
  /* Absichtlich mischen, damit die Ausgangsreihenfolge nicht schon sortiert ist. */
  const gemischt = [p[0], p[10], p[1], p[11], p[2], p[12], p[3], p[13], p[4], p[14], p[5], p[15]];
  const g = auswahl(gemischt, 6);
  const stellen = g.map(w => gemischt.indexOf(w));
  pruefe('die Auswahl behält die Reihenfolge des Pools',
    stellen.every((s, i) => i === 0 || s > stellen[i - 1]), JSON.stringify(stellen));
}

/* ---------- 6. Wörter ohne Fortschritt gelten als Box 1 ---------- */
{
  c.PROGRESS = {};
  const p = [{ id: 'ohne1' }, { id: 'ohne2' }, { id: 'ohne3' }];
  pruefe('ohne PROGRESS-Eintrag: kein Absturz, alle drei kommen durch',
    auswahl(p, 2).length === 2, auswahl(p, 2).length);
}

/* ---------- 7. ⭐⭐ Neue Vokabeln zuerst (16.09.2026) ----------
   Seine Lage um 20:21:19 (KV-Stand): 170 ältere Box-1-Karten, die zwölf Karten
   des Abends mit dem Tag von heute, dazu Wiederholungen. Gefragt, ob nie
   abgefragte Karten früher kommen sollen — „ja", und als Regel: „generell wenn
   neue vokabeln kommen vorallem bei neuem kapiteln oder büchern dann bekomen die
   immer den vorzug weil das sind die mit denen ich arbeiten werde". */
{
  const lage = (spec) => {
    c.PROGRESS = {};
    const pool = [];
    for (const [praefix, anzahl, p] of spec)
      for (let k = 0; k < anzahl; k++){ c.PROGRESS[praefix + k] = Object.assign({}, p); pool.push({ id: praefix + k }); }
    /* wie dueWords(): am längsten fällig zuerst (sort ist stabil) */
    return pool.sort((a, b) => String(c.PROGRESS[a.id].nextReview).localeCompare(String(c.PROGRESS[b.id].nextReview)));
  };
  const zaehle = (liste, praefix) => liste.filter(w => w.id.startsWith(praefix)).length;
  const seineLage = [
    ['alt', 170, { box: 1, nextReview: '2026-09-01', correct: 0, wrong: 1 }],
    ['wdh', 67,  { box: 3, nextReview: '2026-09-10', correct: 2, wrong: 0 }],
    ['heute', 12, { box: 1, nextReview: '2026-09-16', correct: 0, wrong: 0 }]
  ];
  const g = auswahl(lage(seineLage), 10);
  pruefe('seine Lage: alle 4 Box-1-Plätze gehen an neue Karten', zaehle(g, 'heute') === 4, zaehle(g, 'heute'));
  pruefe('… und die 6 Wiederholungen bleiben', zaehle(g, 'wdh') === 6, zaehle(g, 'wdh'));

  /* die jüngsten zuerst: das neue Kapitel vor alten, nie beantworteten Karten */
  const g2 = auswahl(lage([
    ['alt', 50, { box: 1, nextReview: '2026-09-01', correct: 1, wrong: 1 }],
    ['august', 5, { box: 1, nextReview: '2026-08-29', correct: 0, wrong: 0 }],
    ['heute', 3, { box: 1, nextReview: '2026-09-16', correct: 0, wrong: 0 }],
    ['wdh', 20, { box: 4, nextReview: '2026-09-12', correct: 3, wrong: 0 }]
  ]), 10);
  pruefe('die jüngsten neuen zuerst: 3 von heute + 1 ältere neue', zaehle(g2, 'heute') === 3 && zaehle(g2, 'august') === 1,
    zaehle(g2, 'heute') + ' / ' + zaehle(g2, 'august'));

  /* ohne neue Karten: genau wie vorher, die am längsten fälligen */
  const g3 = auswahl(lage([
    ['alt', 50, { box: 1, nextReview: '2026-09-01', correct: 1, wrong: 1 }],
    ['wdh', 20, { box: 4, nextReview: '2026-09-12', correct: 3, wrong: 0 }]
  ]), 10);
  pruefe('ohne neue Karten: 4 alte aus Box 1 wie bisher', zaehle(g3, 'alt') === 4, zaehle(g3, 'alt'));

  /* ⛔ Gegenprobe mit der alten Zeile — sonst prüfte Fall 7 nichts. */
  const alt = code.replace('const neu  = neueZuerst(pool.filter(w => box(w) <= 1));', 'const neu  = pool.filter(w => box(w) <= 1);');
  const c2 = { PROGRESS: {}, Array, Math, Number, Object, String, console };
  vm.createContext(c2);
  vm.runInContext('const DECKEL_ANTEIL_BOX1 = ' + mAnteil[1] + ';\n' + alt + '\n;globalThis.__ = tagesAuswahl;', c2);
  const pool = lage(seineLage);
  c2.PROGRESS = c.PROGRESS;
  const g4 = c2.__(pool, 10);
  pruefe('STÖRTEST — mit der alten Zeile käme keine neue Karte dran', alt !== code && zaehle(g4, 'heute') === 0, zaehle(g4, 'heute'));
}

console.log('\n' + (schlecht ? '✘ ' + schlecht + ' von ' + (ok + schlecht) + ' Fällen falsch'
                              : '✅ alle ' + ok + ' Fälle richtig'));
process.exitCode = schlecht ? 1 : 0;
