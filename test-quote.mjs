/* test-quote.mjs — bewacht die Trefferquote je Tag und je Woche (Punkt 5).
 *
 * Elias hat sich am 07.09.2026 für den Rauschversuch entschieden: „du hast
 * recht, dann sollte ich das ausprobieren." Zwei Wochen mit weißem Rauschen,
 * zwei ohne, Trefferquoten vergleichen.
 *
 * ⭐ Drei Dinge, die still falsch werden könnten:
 *   1. Eine Woche OHNE Aufgaben ist nicht „0 %" — sie ist unbekannt.
 *   2. Die Wochengrenze muss dieselbe sein wie im Übungskalender (Montag).
 *   3. Der Geräteabgleich darf NICHT summieren — sonst verdoppelt sich die
 *      Zahl bei jedem Durchlauf, weil beide Geräte einander abgleichen.
 * Alle drei sähen ohne Test völlig richtig aus.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const WURZEL = path.dirname(fileURLToPath(import.meta.url));
const kern = fs.readFileSync(path.join(WURZEL, 'js', 'kern.js'), 'utf8');
const sync = fs.readFileSync(path.join(WURZEL, 'js', 'sync.js'), 'utf8');

let ok = 0, schlecht = 0;
const pruefe = (was, bedingung, gemessen) => {
  if (bedingung) { ok++; console.log('  ✔ ' + was); }
  else { schlecht++; console.log('  ✘ ' + was + '   gemessen: ' + gemessen); }
};
const schneide = (text, name) => {
  const a = text.indexOf('function ' + name + '(');
  if (a < 0) return null;
  let i = text.indexOf('{', a), t = 0;
  for (; i < text.length; i++){
    if (text[i] === '{') t++;
    else if (text[i] === '}'){ t--; if (!t) return text.slice(a, i + 1); }
  }
  return null;
};

console.log('test-quote.mjs — Trefferquote je Tag und je Woche\n');

/* ---------- Aufbau: die echten Funktionen in einen Kontext ---------- */
const code = ['merkeQuote', 'quoteJeWoche'].map(n => schneide(kern, n));
if (code.some(x => !x)) { console.log('⛔ merkeQuote/quoteJeWoche nicht in js/kern.js'); process.exit(1); }

const c = {
  QUOTE_TAGE: {}, speicher: {}, heute: '2026-09-07',
  LS: { get: (k, d) => (k in c.speicher ? c.speicher[k] : d), set: (k, v) => { c.speicher[k] = v; } },
  /* todayStr(0) ist heute, todayStr(-n) ist n Tage zurück — dieselbe Bedeutung
     wie in der App (dort wird für den Kalender `todayStr(-i)` benutzt). */
  todayStr(v){
    const d = new Date(c.heute);
    d.setDate(d.getDate() + (Number(v) || 0));
    return d.toISOString().slice(0, 10);
  },
  Number, Math, Object, Date, JSON, console,
};
vm.createContext(c);
vm.runInContext(code.join('\n') + '\n;globalThis.__m = merkeQuote; globalThis.__w = quoteJeWoche;', c);
const merke = c.__m, jeWoche = c.__w;

/* ---------- 1. Zählen je Tag ---------- */
{
  c.QUOTE_TAGE = {};
  merke(true); merke(true); merke(false);
  const t = c.QUOTE_TAGE['2026-09-07'];
  pruefe('drei Antworten → gestellt 3, richtig 2', t && t.gestellt === 3 && t.richtig === 2, JSON.stringify(t));
  pruefe('und der Stand liegt im Speicher', !!c.speicher['vt_quoteTage'], Object.keys(c.speicher));
  c.heute = '2026-09-08';
  merke(false);
  pruefe('neuer Tag → eigener Eintrag, der alte bleibt',
    c.QUOTE_TAGE['2026-09-08'].gestellt === 1 && c.QUOTE_TAGE['2026-09-07'].gestellt === 3,
    JSON.stringify(c.QUOTE_TAGE));
  c.heute = '2026-09-07';
}

/* ---------- 2. ⭐ Eine Woche ohne Aufgaben ist NICHT 0 % ---------- */
{
  c.QUOTE_TAGE = {};
  const r = jeWoche(4);
  pruefe('vier leere Wochen → quote ist überall null, nicht 0',
    r.length === 4 && r.every(w => w.quote === null && w.gestellt === 0),
    JSON.stringify(r.map(w => w.quote)));
}

/* ---------- 3. ⭐ Die Wochengrenze: Montag, wie im Kalender ---------- */
{
  /* Der 07.09.2026 ist ein Montag — die laufende Woche beginnt also an diesem
     Tag. Prüft die Rechnung, ohne sie hier nachzubauen. */
  c.QUOTE_TAGE = {};
  const r = jeWoche(3);
  pruefe('die jüngste Woche beginnt am 07.09. (Montag)',
    r[r.length - 1].von === '2026-09-07', r[r.length - 1].von);
  pruefe('und endet am 13.09. (Sonntag)',
    r[r.length - 1].bis === '2026-09-13', r[r.length - 1].bis);
  pruefe('die Woche davor beginnt sieben Tage früher',
    r[r.length - 2].von === '2026-08-31', r[r.length - 2].von);
  /* Gegenprobe: dieselbe Rechnung wie im Übungskalender (js/statistik.js). */
  pruefe('GEGENPROBE — der Kalender rechnet den Wochentag genauso',
    /\(new Date\(heute\)\.getDay\(\) \+ 6\) % 7/.test(fs.readFileSync(path.join(WURZEL,'js','statistik.js'),'utf8'))
    && /\(new Date\(heute\)\.getDay\(\) \+ 6\) % 7/.test(kern),
    'Formel steht nicht in beiden Dateien');
}

/* ---------- 4. Zusammenfassen über Tage hinweg ---------- */
{
  c.QUOTE_TAGE = {
    '2026-09-07': { gestellt: 20, richtig: 15 },   // laufende Woche
    '2026-09-09': { gestellt: 10, richtig: 5 },    // dieselbe Woche
    '2026-08-31': { gestellt: 8,  richtig: 8 },    // Woche davor
    '2026-06-01': { gestellt: 99, richtig: 0 },    // weit außerhalb
  };
  const r = jeWoche(3);
  const jetzt = r[r.length - 1], davor = r[r.length - 2];
  pruefe('laufende Woche: 30 gestellt, 20 richtig → 67 %',
    jetzt.gestellt === 30 && jetzt.richtig === 20 && jetzt.quote === 67,
    JSON.stringify(jetzt));
  pruefe('Woche davor: 8 von 8 → 100 %', davor.quote === 100, JSON.stringify(davor));
  pruefe('ein Tag außerhalb des Fensters zählt NICHT mit',
    r.every(w => w.gestellt !== 99), JSON.stringify(r.map(w => w.gestellt)));
}

/* ---------- 5. ⛔⛔ Der Geräteabgleich darf NICHT summieren ---------- */
{
  /* Beide Geräte gleichen einander ab. Eine Summe würde bei jedem Durchlauf
     erneut summiert — die Zahl verdoppelte sich stillschweigend. Deshalb
     Maximum je Feld, wie bei vt_uebungstage und vt_regelStand. */
  /* ⛔ Per KLAMMERBILANZ schneiden, nicht mit einer festen Länge. Ein
     1200-Zeichen-Ausschnitt reichte in den nächsten Zweig hinein und brachte
     dessen `return;` mit — der Test starb an „Illegal return statement", ohne
     dass am Code etwas falsch war. */
  const zweig = (() => {
    const a = sync.indexOf("if (k === 'vt_quoteTage')");
    if (a < 0) return '';
    let i = sync.indexOf('{', a), t = 0;
    for (; i < sync.length; i++){
      if (sync[i] === '{') t++;
      else if (sync[i] === '}'){ t--; if (!t) return sync.slice(a, i + 1); }
    }
    return '';
  })();
  pruefe("js/sync.js hat einen eigenen Zweig für 'vt_quoteTage'", zweig.length > 100, zweig.length);
  pruefe('er nimmt das MAXIMUM, nicht die Summe',
    /Math\.max\(/.test(zweig) && !/\+\s*Number\(e/.test(zweig),
    zweig.includes('Math.max') ? 'max ok' : 'kein Math.max');
  pruefe("'vt_quoteTage' steht in SYNC_SCHLUESSEL", /'vt_quoteTage',/.test(sync), '—');

  /* Den Zweig ausführen und das Verhalten messen — nicht nur den Text lesen. */
  const k = { localStorage: { daten: {}, getItem(x){ return this.daten[x] ?? null; },
                              setItem(x, v){ this.daten[x] = v; } },
              JSON, Object, Number, Math, etwasGeaendert: false, hierRoh: null, dortRoh: null, k: 'vt_quoteTage' };
  vm.createContext(k);
  const funk = 'function merge(hierRoh, dortRoh){ const k = "vt_quoteTage"; let etwasGeaendert = false;\n'
    + zweig.replace(/^if \(k === 'vt_quoteTage'\)\{/, '').replace(/\s*return;\s*\}\s*$/, '')
    + '\n return { neu: localStorage.getItem("vt_quoteTage"), etwasGeaendert }; }';
  vm.runInContext(funk + ';globalThis.__g = merge;', k);
  const merge = k.__g;

  const handy  = JSON.stringify({ '2026-09-07': { gestellt: 10, richtig: 8 } });
  const tablet = JSON.stringify({ '2026-09-07': { gestellt: 6,  richtig: 3 },
                                  '2026-09-06': { gestellt: 4,  richtig: 4 } });
  k.localStorage.daten['vt_quoteTage'] = handy;
  const r1 = JSON.parse(merge(handy, tablet).neu);
  pruefe('Abgleich: 10/8 gegen 6/3 → 10/8 (Maximum, keine 16/11)',
    r1['2026-09-07'].gestellt === 10 && r1['2026-09-07'].richtig === 8,
    JSON.stringify(r1['2026-09-07']));
  pruefe('ein Tag, den nur das andere Gerät kennt, kommt dazu',
    r1['2026-09-06'] && r1['2026-09-06'].gestellt === 4, JSON.stringify(r1['2026-09-06']));

  /* ⭐ Der eigentliche Störtest: derselbe Abgleich ein zweites Mal. */
  k.localStorage.daten['vt_quoteTage'] = JSON.stringify(r1);
  const r2 = JSON.parse(merge(JSON.stringify(r1), tablet).neu);
  pruefe('STÖRTEST — zweiter Abgleich ändert NICHTS mehr (keine Doppelzählung)',
    r2['2026-09-07'].gestellt === 10 && r2['2026-09-06'].gestellt === 4,
    JSON.stringify(r2));
  pruefe('richtig bleibt ≤ gestellt', Object.values(r2).every(e => e.richtig <= e.gestellt),
    JSON.stringify(r2));
}

console.log('\n' + (schlecht ? '✘ ' + schlecht + ' von ' + (ok + schlecht) + ' Fällen falsch'
                              : '✅ alle ' + ok + ' Fälle richtig'));
process.exitCode = schlecht ? 1 : 0;
