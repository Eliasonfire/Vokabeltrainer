/* Übersteht eine angefangene Runde das Schließen der App — und sagt die Zahl
 * oben die Wahrheit?
 *
 * ⛔⛔ DER ANLASS (19.09.2026, 03:48:30). Elias hatte 9 von 10 Karten bewertet
 *    und stand auf der zehnten. Oben stand „10/10" (die alte Zahl war die
 *    KARTENNUMMER), er hielt die Runde für fertig und schloss die App — auf
 *    meine eigene Anweisung nach einer Auslieferung. Die Runde lag nur im
 *    Arbeitsspeicher und war damit weg, ohne ein Wort. Sein Befund: „ich habe
 *    alle karteikarten gemacht, dennoch ist der kreis nicht komplett zu, das
 *    ein fehler".
 *
 * ⛔ Beide Funktionen werden aus js/lernen.js und js/start.js
 *    HERAUSGESCHNITTEN und im vm gefahren — nicht nachgebaut. Ein nachgebauter
 *    Prüfling besteht jeden Test, weil er den Fehler gar nicht enthält.
 *    [[testvorlage_selbst_nachgebaut]]
 *
 * ⭐ Und beide Hälften haben ihren Störtest: die alte Zahl (`erledigt + 1`) und
 *    die alte Lage ohne Sicherung. Ohne sie zeigt eine grüne Liste nur, dass
 *    die neue Fassung tut, was sie tut — nicht, dass der Fehler je bestand.
 *    [[stoertest_muss_wirkung_nachweisen]]
 */
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

/* ⛔ fileURLToPath, nicht .pathname: der Pfad enthält ein Leerzeichen und steht
   in einer URL als %20 — fs findet 'G:\1.%20Workspace' nie. */
const lies = (rel) => fs.readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');
const lernen = lies('../js/lernen.js');
const start  = lies('../js/start.js');
const navi   = lies('../js/navigation.js');
const sync   = lies('../js/sync.js');

let fehler = 0;
const pruefe = (was, erwartet, ist) => {
  const ok = JSON.stringify(erwartet) === JSON.stringify(ist);
  if (!ok) fehler++;
  console.log('  ' + (ok ? 'ok ' : 'X  ') + was.padEnd(54)
    + (ok ? '' : 'erwartet ' + JSON.stringify(erwartet) + ', ist ' + JSON.stringify(ist)));
};

/* ------------------- Die Stücke aus dem echten Quelltext ------------------ */
const mRunde  = lernen.match(/\nconst OFFENE_RUNDE = 'vt_offeneRunde';[\s\S]*?\nfunction offeneRundeFortsetzen\(\)\{[\s\S]*?\n\}\n/);
const mBogen  = start.match(/\nfunction ringBogen\([\s\S]*?\n\}\n/);
const mLeiste = start.match(/\nfunction rundenLeiste\([\s\S]*?\n\}\n/);
const mVorschuss = start.match(/RING_VORSCHUSS\s*=\s*([0-9.]+)/);
if (!mRunde || !mBogen || !mLeiste || !mVorschuss){
  console.log('X  Quelltext nicht gefunden: '
    + [['offene Runde', mRunde], ['ringBogen', mBogen], ['rundenLeiste', mLeiste], ['RING_VORSCHUSS', mVorschuss]]
      .filter(p => !p[1]).map(p => p[0]).join(', '));
  process.exit(1);
}

/* =================== 1. Die Zahl oben in der Runde ======================== */
/* ⚠️ Das ist ein DOM-Doppel, kein DOM. Es darf nur so viel können, wie die
   Funktion fragt. [[pruefung_fragt_einen_stellvertreter_ab]] */
function zahlBei(erledigt, ziel, quelle = mLeiste[0]){
  const texte = {};
  const ctx = {
    RING_VORSCHUSS: Number(mVorschuss[1]),
    document: { getElementById: (id) => ({
      style: {},
      set textContent(v){ texte[id] = v; },
      get textContent(){ return texte[id]; }
    }) }
  };
  vm.createContext(ctx);
  vm.runInContext(mBogen[0] + quelle + '\nthis.RUF = rundenLeiste;', ctx);
  ctx.RUF('balken', 'zahl', erledigt, ziel);
  return texte['zahl'];
}

console.log('Die Zahl zählt die FERTIGEN Karten (Elias am 19.09.2026, 22:10:02):');
pruefe('erste Karte, noch nichts bewertet -> 0/10', '0/10',  zahlBei(0, 10));
pruefe('nach der ersten Antwort -> 1/10',           '1/10',  zahlBei(1, 10));
pruefe('auf der offenen zehnten Karte -> 9/10',     '9/10',  zahlBei(9, 10));
pruefe('erst die letzte Antwort macht 10/10',       '10/10', zahlBei(10, 10));
pruefe('Hörmodus über dem Ziel bleibt gedeckelt',   '10/10', zahlBei(13, 10));

/* ---------- Störtest: hätte die alte Zahl das gezeigt? ---------- */
console.log('\nDie alte Zahl (Kartennummer) am selben Fall:');
const alteZahl = mLeiste[0].replace('Math.min(erledigt, ziel)', 'Math.min(erledigt + 1, ziel)');
if (alteZahl === mLeiste[0]){
  console.log('  X  Die Rechnung ließ sich nicht zurückdrehen — Störtest wirkungslos.');
  fehler++;
} else {
  pruefe('sie sagte auf der offenen zehnten Karte 10/10', '10/10', zahlBei(9, 10, alteZahl));
}

/* ============ 2. Die Runde übersteht das Schließen der App ================ */
const HEUTE = '2026-09-19';

function umgebung(store, woerter, tag = HEUTE){
  const bildschirme = [];
  const ctx = {
    SESSION: { words: [], idx: 0, dirs: [], fertig: true, laut: new Set() },
    VOCAB_DATA: woerter,
    /* So arbeitet LS in js/kern.js: es hält nichts im Speicher, jeder Zugriff
       geht an den Browserspeicher. Genau das ist hier nachgebildet. */
    LS: {
      get(k, f){ const v = store[k]; return v ? JSON.parse(v) : f; },
      set(k, v){ store[k] = JSON.stringify(v); }
    },
    todayStr: () => tag,
    showScreen: (n) => bildschirme.push(n)
  };
  vm.createContext(ctx);
  vm.runInContext(mRunde[0]
    + '\nthis.RUF = { rundeSichern, rundeVergessen, offeneRundeStand, offeneRundeFortsetzen };', ctx);
  return { ctx, bildschirme };
}

const woerter = Array.from({ length: 10 }, (_, i) => ({ id: 100 + i }));
const store = {};

/* Der echte Ablauf einer Runde: aufbauen, dann neun Karten bewerten. Nach
   jeder Antwort sichert `answer()` mit dem Stand DANACH, und erst 210 ms
   später zählt `weiter()` den Zeiger hoch — beides hier in dieser Reihenfolge. */
const a = umgebung(store, woerter);
a.ctx.SESSION = { words: woerter.slice(), idx: 0, dirs: [], fertig: false, laut: new Set([0, 2]) };
a.ctx.RUF.rundeSichern(0);
for (let k = 0; k < 9; k++){
  a.ctx.SESSION.idx = k;
  a.ctx.RUF.rundeSichern(k + 1);
  a.ctx.SESSION.idx = k + 1;
}
const standNeun = { ...store };

console.log('\nNeun von zehn bewertet, dann App zu und wieder auf:');
const b = umgebung(store, woerter);
pruefe('die Runde kommt zurück',                     true, b.ctx.RUF.offeneRundeFortsetzen());
pruefe('sie steht auf Karte 10 von 10',              { karten: 10, idx: 9 },
  { karten: b.ctx.SESSION.words.length, idx: b.ctx.SESSION.idx });
pruefe('der Lernbildschirm geht auf',                ['learn'], b.bildschirme);
pruefe('„laut sagen" trägt dieselbe Karte wie vorher', [0, 2], [...b.ctx.SESSION.laut]);
pruefe('die Startseite kennt die offene Karte',      { fehlt: 1, gesamt: 10 }, b.ctx.RUF.offeneRundeStand());

console.log('\nUnd wenn die Runde wirklich zu Ende ist:');
b.ctx.SESSION.idx = 9;
b.ctx.RUF.rundeSichern(10);
pruefe('nichts bleibt offen',                        null, b.ctx.RUF.offeneRundeStand());
pruefe('der nächste Start beginnt eine neue Runde',  false, umgebung(store, woerter).ctx.RUF.offeneRundeFortsetzen());

console.log('\nDie zwei Fälle, in denen sie bewusst NICHT zurückkommt:');
pruefe('am nächsten Lerntag (8 Uhr) nicht',          false,
  umgebung({ ...standNeun }, woerter, '2026-09-20').ctx.RUF.offeneRundeFortsetzen());
/* Ein Wort, das inzwischen gelöscht wurde: die Runde bleibt, der Zeiger wandert
   mit — dieselbe Umrechnung wie in passeRundeAnAuswahlAn(). */
const d = umgebung({ ...standNeun }, woerter.filter(w => w.id !== 102));
pruefe('ein gelöschtes Wort nimmt die Runde nicht mit', true, d.ctx.RUF.offeneRundeFortsetzen());
pruefe('der Zeiger wandert mit',                     { karten: 9, idx: 8 },
  { karten: d.ctx.SESSION.words.length, idx: d.ctx.SESSION.idx });

/* ---------- Störtest: die Lage vor dem 19.09.2026 ---------- */
console.log('\nOhne die Sicherung (so war es bis zum 19.09.2026):');
const storeAlt = {};
const e = umgebung(storeAlt, woerter);
e.ctx.SESSION = { words: woerter.slice(), idx: 9, dirs: [], fertig: false, laut: new Set() };
/* genau das, was fehlte: kein rundeSichern() beim Bewerten */
pruefe('nach dem Neustart ist die Runde weg', false,
  umgebung(storeAlt, woerter).ctx.RUF.offeneRundeFortsetzen());

/* ================== 3. Ist sie überhaupt verdrahtet? ===================== */
/* ⭐ Die zwei Prüfungen oben fahren Funktionen. Ob die App sie auch AUFRUFT,
   sieht man ihnen nicht an — das ist die Fehlerart, die stillschweigend
   durchgeht. [[werkzeug_ohne_aufrufer]] */
console.log('\nDie Aufrufe in der App:');
pruefe('answer() sichert nach jeder Karte', true,
  /tagZaehlen\(\);[\s\S]{0,600}?rundeSichern\(SESSION\.idx \+ 1\);/.test(lernen));
pruefe('das Rundenende vergisst sie wieder', true,
  /SESSION\.fertig = true;[\s\S]{0,400}?rundeVergessen\(\);/.test(lernen));
pruefe('das X beendet sie endgültig', true,
  /btnExitLearn[\s\S]{0,600}?rundeVergessen\(\);/.test(lernen));
pruefe('„Jetzt lernen" setzt eine gesicherte Runde fort', true,
  /learn-entry[\s\S]{0,1200}?offeneRundeFortsetzen\(\)/.test(navi));
pruefe('die Startseite zeigt den Hinweis', true, /offeneRundeStand\(\)/.test(start));
/* ⛔ Der Schlüssel gehört dem Gerät. Stünde er im Abgleich, käme die beendete
   Runde vom anderen Gerät zurück — ein fehlender Eintrag verliert jeden
   „jüngerer Stempel gewinnt"-Vergleich. [[ausfall_ist_unsichtbar_gebaut]] */
pruefe('der Schlüssel wird NICHT abgeglichen', false, /vt_offeneRunde/.test(sync));

console.log('\n' + (fehler ? 'FEHLER: ' + fehler
  : 'Die angefangene Runde übersteht das Schließen der App, und die Zahl zählt das Gemachte.'));
process.exit(fehler ? 1 : 0);
