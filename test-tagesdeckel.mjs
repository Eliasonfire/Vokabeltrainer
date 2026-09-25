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
 *
 * ⭐⭐ v603 (25.09.2026), Elias' Plan, freigegeben mit „lass uns box 6
 * einführen und box 7 auch …": Box 1 mindestens ein Drittel · Wiederholungen
 * nach Verspätung ÷ Abstand (Fall 8) · freie Plätze zuerst an noch nicht
 * fällige Box-2/3-Karten, dann Box 1, dann Box 4–7 (Fall 9; seine Worte: „wie
 * wäre es die freien plätze den vokabeln aus box 2 udn 3 zu geben?" und „wenn
 * das der fall sein sollte dann einfach box 4-7").
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

/* ⛔ Die Funktionen aus dem ECHTEN Quelltext schneiden, nicht nachbauen —
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
/* tagesAuswahl() ruft nieAbgefragt(), neueZuerst() (seit 16.09.2026) und
   verspaetung()/tageZwischen() (seit v603). Fehlt eine, meldet das der Test,
   statt mit ReferenceError zu enden. */
const teile = ['nieAbgefragt', 'neueZuerst', 'tageZwischen', 'verspaetung', 'tagesAuswahl']
  .map(n => [n, schneide(quelle, n)]);
const fehlend = teile.filter(([, t]) => !t).map(([n]) => n);
if (fehlend.length) { console.log('⛔ nicht mehr in js/kern.js: ' + fehlend.join(', ')); process.exit(1); }
const code = teile.map(([, t]) => t).join('\n');

/* Anteil und Abstände ebenfalls aus der Quelle — eine eigene Zahl hier wäre
   eine zweite Wahrheit, die beim ersten Ändern auseinanderläuft. Seit v603
   steht der Anteil als Bruch da („1 / 3"). */
const mAnteil = quelle.match(/const DECKEL_ANTEIL_BOX1\s*=\s*([\d.]+(?:\s*\/\s*[\d.]+)?)\s*;/);
const mIntervalle = quelle.match(/const INTERVALS = (\{[^}]+\})/);
if (!mAnteil || !mIntervalle) { console.log('⛔ DECKEL_ANTEIL_BOX1 oder INTERVALS nicht gefunden'); process.exit(1); }
const ANTEIL = Number(eval(mAnteil[1]));

const HEUTE = '2026-09-25';
function kontext(quelltext, anteil){
  const k = { PROGRESS: {}, Array, Math, Number, Object, String, Set, Date, isNaN, console,
              todayStr: () => HEUTE };
  vm.createContext(k);
  vm.runInContext('const INTERVALS = ' + mIntervalle[1] + ';\nconst DECKEL_ANTEIL_BOX1 = ' + anteil + ';\n'
    + quelltext + '\n;globalThis.__ = tagesAuswahl;', k);
  return k;
}
const c = kontext(code, mAnteil[1]);
const auswahl = (...a) => c.__(...a);

/* Testbestand: n Wörter mit gegebener Box, alle heute fällig. */
function bestand(spec){
  const pool = [];
  for (const [box, anzahl] of Object.entries(spec)){
    for (let k = 0; k < anzahl; k++){
      const id = 'b' + box + '_' + k;
      c.PROGRESS[id] = { box: Number(box), nextReview: HEUTE };
      pool.push({ id, box: Number(box) });
    }
  }
  return pool;
}
const boxenVon = (liste) => liste.map(w => c.PROGRESS[w.id].box);
const zaehleBox = (liste, pruef) => boxenVon(liste).filter(pruef).length;

console.log('test-tagesdeckel.mjs — die Tagesration\n');

/* ---------- 0. Der Anteil ist ein Drittel (v603) ---------- */
pruefe('DECKEL_ANTEIL_BOX1 ist ein Drittel (' + mAnteil[1] + ')', Math.abs(ANTEIL - 1 / 3) < 1e-9, ANTEIL);

/* ---------- 1. Kein Deckel ---------- */
{
  c.PROGRESS = {};
  const p = bestand({ 1: 50, 4: 20 });
  pruefe('Deckel 0 → der Pool kommt unverändert zurück', auswahl(p, 0).length === 70, auswahl(p, 0).length);
  pruefe('Pool kleiner als der Deckel → alles', auswahl(p, 200).length === 70, auswahl(p, 200).length);
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
  for (const [deckel, eins] of [[10, 3], [15, 5], [20, 7]]){
    const g = auswahl(p, deckel);
    pruefe(`Deckel ${deckel}: ${eins} aus Box 1 (ein Drittel), ${deckel - eins} Wiederholungen`,
      zaehleBox(g, b => b <= 1) === eins && zaehleBox(g, b => b > 1) === deckel - eins,
      zaehleBox(g, b => b <= 1) + ' / ' + zaehleBox(g, b => b > 1));
  }
  /* ⛔ Ohne die Quote wäre das Ergebnis 10× Box 1 — der Störfall, der zeigt,
     dass die Schranke überhaupt wirkt. Gegenprobe: nur nach Reihenfolge
     abschneiden. */
  const ohneQuote = p.slice(0, 10).filter(w => c.PROGRESS[w.id].box <= 1).length;
  pruefe('STÖRTEST — ohne Quote wären es 10 aus Box 1', ohneQuote === 10, ohneQuote);
  /* ⛔ Und mit dem alten Anteil (0.5) käme 5 aus Box 1 heraus — der Test muss
     den Unterschied sehen. */
  const alt = kontext(code, '0.5');
  alt.PROGRESS = c.PROGRESS;
  const gAlt = alt.__(p, 10);
  pruefe('STÖRTEST — mit 0.5 wären es 5 aus Box 1', zaehleBox(gAlt, b => b <= 1) === 5, zaehleBox(gAlt, b => b <= 1));
}

/* ---------- 4. Auffüllen, wenn eine Seite fehlt (ohne Vorrat) ---------- */
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
    g.length === 10 && zaehleBox(g, b => b > 1) === 2,
    g.length + ' / ' + zaehleBox(g, b => b > 1));
}

/* ---------- 5. Die Reihenfolge des Pools bleibt (bei gleicher Verspätung) ---------- */
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
  pruefe('ohne PROGRESS-Eintrag: kein Absturz, zwei von drei kommen durch',
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
  /* Seit v603 ein Drittel für Box 1: bei 10 drei Plätze — einer fürs am
     längsten falsche Wort, zwei für neue; sieben Wiederholungen. */
  const g = auswahl(lage(seineLage), 10);
  pruefe('seine Lage bei 10: 1 am längsten falsches · 2 neue · 7 Wiederholungen',
    zaehle(g, 'alt') === 1 && zaehle(g, 'heute') === 2 && zaehle(g, 'wdh') === 7,
    zaehle(g, 'alt') + ' / ' + zaehle(g, 'heute') + ' / ' + zaehle(g, 'wdh'));
  /* Seit 25.09.2026, 01:1x: ein fester Platz je 10 Karten — bei 15 und bei 20
     zwei. Elias auf „1 oder 2 bei 20?": „2"; auf „2 bei 15": „ja". */
  const g15 = auswahl(lage(seineLage), 15);
  pruefe('bei 15: 2 am längsten falsche · 3 neue · 10 Wiederholungen',
    zaehle(g15, 'alt') === 2 && zaehle(g15, 'heute') === 3 && zaehle(g15, 'wdh') === 10,
    zaehle(g15, 'alt') + ' / ' + zaehle(g15, 'heute') + ' / ' + zaehle(g15, 'wdh'));
  const g20 = auswahl(lage(seineLage), 20);
  pruefe('bei 20: 2 am längsten falsche · 5 neue · 13 Wiederholungen',
    zaehle(g20, 'alt') === 2 && zaehle(g20, 'heute') === 5 && zaehle(g20, 'wdh') === 13,
    zaehle(g20, 'alt') + ' / ' + zaehle(g20, 'heute') + ' / ' + zaehle(g20, 'wdh'));

  /* die jüngsten zuerst: das neue Kapitel vor alten, nie beantworteten Karten */
  const g2 = auswahl(lage([
    ['alt', 50, { box: 1, nextReview: '2026-09-01', correct: 1, wrong: 1 }],
    ['august', 5, { box: 1, nextReview: '2026-08-29', correct: 0, wrong: 0 }],
    ['heute', 3, { box: 1, nextReview: '2026-09-16', correct: 0, wrong: 0 }],
    ['wdh', 20, { box: 4, nextReview: '2026-09-12', correct: 3, wrong: 0 }]
  ]), 15);
  pruefe('die jüngsten neuen zuerst (15): 3 von heute vor den älteren neuen', zaehle(g2, 'heute') === 3 && zaehle(g2, 'august') === 0,
    zaehle(g2, 'heute') + ' / ' + zaehle(g2, 'august'));

  /* ohne neue Karten: die am längsten falschen */
  const g3 = auswahl(lage([
    ['alt', 50, { box: 1, nextReview: '2026-09-01', correct: 1, wrong: 1 }],
    ['wdh', 20, { box: 4, nextReview: '2026-09-12', correct: 3, wrong: 0 }]
  ]), 10);
  pruefe('ohne neue Karten: 3 alte aus Box 1', zaehle(g3, 'alt') === 3, zaehle(g3, 'alt'));

  /* ⛔ Gegenprobe mit der alten Zeile — sonst prüfte Fall 7 nichts. */
  const altCode = code.replace('const neu = neueZuerst(pool.filter(w => box(w) <= 1));', 'const neu = pool.filter(w => box(w) <= 1);');
  const c2 = kontext(altCode, mAnteil[1]);
  const pool = lage(seineLage);
  c2.PROGRESS = c.PROGRESS;
  const g4 = c2.__(pool, 10);
  pruefe('STÖRTEST — mit der alten Zeile käme keine neue Karte dran', altCode !== code && zaehle(g4, 'heute') === 0, zaehle(g4, 'heute'));
}

/* ---------- 8. ⭐⭐ v603: Wiederholungen nach Verspätung ÷ Abstand ----------
   Ein Platz für Wiederholungen frei (Box 1 hat genug). Kandidaten:
     Box 2, 2 Tage zu spät  → 2 / 1  = 2,0
     Box 5, 10 Tage zu spät → 10 / 16 ≈ 0,6
     Box 7, 30 Tage zu spät → 30 / 60 = 0,5
   Nach dem reinen Datum (dueWords) stünde die Box-7-Karte vorn. */
{
  c.PROGRESS = {
    b2: { box: 2, nextReview: '2026-09-23' }, b5: { box: 5, nextReview: '2026-09-15' },
    b7: { box: 7, nextReview: '2026-08-26' },
  };
  const eins = Array.from({ length: 20 }, (_, k) => { c.PROGRESS['e' + k] = { box: 1, nextReview: HEUTE, correct: 1, wrong: 1 }; return { id: 'e' + k }; });
  const nachDatum = [{ id: 'b7' }, { id: 'b5' }, { id: 'b2' }];   /* so sortiert dueWords() */
  /* Deckel 3: ein Box-1-Platz, zwei Wiederholungsplätze → die zwei spätesten
     gemessen am Abstand: Box 2 und Box 5. */
  const g = auswahl(nachDatum.concat(eins), 3).map(w => w.id);
  pruefe('Deckel 3: die Wiederholungen sind Box 2 (2 Abstände zu spät) und Box 5, nicht Box 7',
    g.includes('b2') && g.includes('b5') && !g.includes('b7'), JSON.stringify(g));
  /* Gleichstand (alle heute fällig): die niedrigere Box zuerst. */
  c.PROGRESS.b2.nextReview = HEUTE; c.PROGRESS.b5.nextReview = HEUTE; c.PROGRESS.b7.nextReview = HEUTE;
  const g2 = auswahl(nachDatum.concat(eins), 2).map(w => w.id);
  pruefe('Gleichstand → die niedrigere Box (Box 2)', g2.includes('b2') && !g2.includes('b7'), JSON.stringify(g2));
  /* ⛔ STÖRTEST: mit der Reihenfolge vor v603 (nur Pool-Reihenfolge) käme Box 7. */
  c.PROGRESS.b2.nextReview = '2026-09-23'; c.PROGRESS.b5.nextReview = '2026-09-15'; c.PROGRESS.b7.nextReview = '2026-08-26';
  const ohneSort = code.replace('.sort((a, b) => (b.v - a.v) || (a.b - b.b) || (a.i - b.i))', '');
  const c3 = kontext(ohneSort, mAnteil[1]); c3.PROGRESS = c.PROGRESS;
  const g3 = c3.__(nachDatum.concat(eins), 3).map(w => w.id);
  pruefe('STÖRTEST — ohne die Sortierung käme Box 7 dran', ohneSort !== code && g3.includes('b7'), JSON.stringify(g3));
}

/* ---------- 9. ⭐⭐ v603: freie Plätze — Box 2/3, dann Box 1, dann Box 4–7 ---------- */
{
  const setze = (id, box, next) => { c.PROGRESS[id] = { box, nextReview: next, correct: 1, wrong: 0 }; return { id }; };
  c.PROGRESS = {};
  const wdh = [setze('w1', 4, HEUTE), setze('w2', 5, HEUTE)];            /* nur 2 fällig */
  const box1 = Array.from({ length: 30 }, (_, k) => setze('e' + k, 1, HEUTE));
  /* Vorrat so sortiert, wie vorziehVorrat() ihn liefert: am ehesten fällig zuerst. */
  const vorrat = [setze('f2a', 2, '2026-09-26'), setze('f5a', 5, '2026-09-27'), setze('f3a', 3, '2026-09-28'),
                  setze('f6a', 6, '2026-10-01'), setze('f2b', 2, '2026-10-03')];
  const g = auswahl(box1.concat(wdh), 10, vorrat).map(w => w.id);
  /* 3 Box-1-Plätze + 7 Wiederholungsplätze; fällig nur 2 → 5 frei:
     zuerst die drei Box-2/3-Karten, dann 2 weitere aus Box 1. Box 4–7 nicht. */
  const n = pre => g.filter(x => x.startsWith(pre)).length;
  pruefe('freie Plätze: erst alle Box-2/3-Vorgezogenen (3)', ['f2a', 'f3a', 'f2b'].every(x => g.includes(x)), JSON.stringify(g));
  pruefe('… dann Box 1 (3 + 2 = 5), noch kein Box-4–7-Vorgezogenes',
    n('e') === 5 && !g.includes('f5a') && !g.includes('f6a') && g.length === 10, JSON.stringify(g));
  /* Box 1 leer: nach Box 2/3 kommt Box 4–7. */
  const g2 = auswahl(wdh, 10, vorrat).map(w => w.id);
  pruefe('Box 1 leer: 2 fällige + 3 Box-2/3 + 2 Box-4–7 = 7 (kürzere Runde, Vorrat leer)',
    g2.length === 7 && g2.includes('f5a') && g2.includes('f6a'), JSON.stringify(g2));
  /* Vorgezogene stehen HINTER dem Fälligen. */
  pruefe('die Vorgezogenen stehen hinter dem Fälligen', g2.indexOf('f2a') > g2.indexOf('w1') && g2.indexOf('f2a') > g2.indexOf('w2'), JSON.stringify(g2));
  /* Ohne Vorrat (Zählen für Feier/Tagesziele): nichts Vorgezogenes. */
  const g3 = auswahl(box1.concat(wdh), 10).map(w => w.id);
  pruefe('ohne Vorrat: kein vorgezogenes Wort, Box 1 füllt auf', g3.every(x => !x.startsWith('f')) && n.call(null, 'e') >= 0 && g3.length === 10, JSON.stringify(g3));
  /* Eine Karte, die schon im Pool steht, wird nicht doppelt genommen. */
  const g4 = auswahl(wdh.concat(vorrat.slice(0, 1)), 10, vorrat).map(w => w.id);
  pruefe('keine Karte doppelt', new Set(g4).size === g4.length, JSON.stringify(g4));
  /* ⛔ STÖRTEST: ohne die Box-2/3-Stufe gingen die freien Plätze an Box 1. */
  const ohne23 = code.replace('const n23 = Math.min(frei, frueh23.length);', 'const n23 = 0;');
  const c4 = kontext(ohne23, mAnteil[1]); c4.PROGRESS = c.PROGRESS;
  const g5 = c4.__(box1.concat(wdh), 10, vorrat).map(w => w.id);
  pruefe('STÖRTEST — ohne die Box-2/3-Stufe käme keine vorgezogene Box-2/3-Karte', ohne23 !== code && !g5.includes('f2a'), JSON.stringify(g5));
}

console.log('\n' + (schlecht ? '✘ ' + schlecht + ' von ' + (ok + schlecht) + ' Fällen falsch'
                              : '✅ alle ' + ok + ' Fälle richtig'));
process.exitCode = schlecht ? 1 : 0;
