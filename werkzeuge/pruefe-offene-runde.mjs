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
   in einer URL als %20 — fs findet 'G:\1.%20Workspace' nie.
   ⛔ Und CRLF → LF beim Lesen: Git legt die Dateien beim Auschecken mit CRLF ab
   (core.autocrlf=true, im Repo LF), die Muster unten suchen `\n`. Am 24.09.2026
   stand js/kern.js so da, und dieser Prüfer wurde rot, ohne dass im Code etwas
   falsch war. [[zeilenende_r_bricht_muster]] */
const lies = (rel) => fs.readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8').replace(/\r\n/g, '\n');
const lernen = lies('../js/lernen.js');
const start  = lies('../js/start.js');
const navi   = lies('../js/navigation.js');
const sync   = lies('../js/sync.js');
const kern   = lies('../js/kern.js');
const buecher = lies('../js/buecher.js');

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

function umgebung(store, woerter, tag = HEUTE, extra = {}){
  const bildschirme = [];
  const ctx = {
    ...extra,
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

/* ===== 4. Getauscht, gelöscht, geschrumpft: die Runde bleibt so groß (23.09.2026) =====
   Elias, 02:53: „warum ist hier von 8? ich hatte von 10 eingestellt" — und dann:
   „behebe vorallem den fehler das dort keine 8 sondern von 10 steht bei
   karteikarten". Auf seinem Gerät waren Karten der Runde beim nächsten Start
   getauscht (eigene Karte → Karte aus dem Buch) und fielen still weg. */
console.log('\nEine Karte der Runde wurde inzwischen getauscht:');
const mitEigener = Array.from({ length: 10 }, (_, i) => ({ id: i === 3 ? 'eigen' : 200 + i }));
const nachTausch = mitEigener.filter(w => w.id !== 'eigen').concat([{ id: 'buch' }]);
const storeT = {};
const t0 = umgebung(storeT, mitEigener);
t0.ctx.SESSION = { words: mitEigener.slice(), idx: 0, dirs: [], fertig: false, laut: new Set([3]) };
t0.ctx.RUF.rundeSichern(0);
const t1 = umgebung({ ...storeT }, nachTausch, HEUTE, { PROGRESS: { eigen: { box: 1, uebertragen: 'buch' } } });
pruefe('sie kommt zurück', true, t1.ctx.RUF.offeneRundeFortsetzen());
pruefe('mit 10 Karten, an Stelle 4 die aus dem Buch', { karten: 10, stelle4: 'buch' },
  { karten: t1.ctx.SESSION.words.length, stelle4: t1.ctx.SESSION.words[3] && t1.ctx.SESSION.words[3].id });
pruefe('„laut sagen" wandert mit', [3], [...t1.ctx.SESSION.laut]);
const t2 = umgebung({ ...storeT }, nachTausch, HEUTE, { GETAUSCHT: new Map([['eigen', 'buch']]) });
t2.ctx.RUF.offeneRundeFortsetzen();
pruefe('auch über den Tausch dieses Starts', 10, t2.ctx.SESSION.words.length);
const t3 = umgebung({ ...storeT }, nachTausch.concat([]), HEUTE,
  { PROGRESS: { eigen: { uebertragen: 203 } } });           /* die Buchkarte steht schon drin */
t3.ctx.RUF.offeneRundeFortsetzen();
pruefe('steht die Buchkarte schon drin, nicht doppelt', 9, new Set(t3.ctx.SESSION.words.map(w => String(w.id))).size);
/* Störtest: ohne Vermerk kein Ersatz — so war es bis v573. */
const t4 = umgebung({ ...storeT }, nachTausch);
t4.ctx.RUF.offeneRundeFortsetzen();
pruefe('Störtest: ohne Vermerk fiele sie weg (9)', 9, t4.ctx.SESSION.words.length);

console.log('\nFehlt trotzdem eine Karte, wird aus dem Fälligen aufgefüllt:');
const faellig = Array.from({ length: 14 }, (_, i) => ({ id: 300 + i }));
const acht = faellig.slice(0, 8);
/* Eine Sicherung von vor v574: 8 Kennungen, keine Größe — so liegt seine
   geschrumpfte Runde gerade auf dem Handy. */
const alt8 = JSON.stringify({ tag: HEUTE, ids: acht.map(w => String(w.id)), idx: 0, lautIds: [], zeit: 1 });
const voll = { tagesDeckel: () => 10, currentPool: () => faellig.slice() };
const f1 = umgebung({ vt_offeneRunde: alt8 }, faellig, HEUTE, voll);
f1.ctx.RUF.offeneRundeFortsetzen();
pruefe('seine alte 8er-Runde kommt mit 10 zurück', { karten: 10, idx: 0 },
  { karten: f1.ctx.SESSION.words.length, idx: f1.ctx.SESSION.idx });
pruefe('die 8 stehen vorn, unverändert', acht.map(w => w.id), f1.ctx.SESSION.words.slice(0, 8).map(w => w.id));
pruefe('keine Karte doppelt', 10, new Set(f1.ctx.SESSION.words.map(w => w.id)).size);
const ziel8 = JSON.stringify({ tag: HEUTE, ids: acht.map(w => String(w.id)), idx: 0, lautIds: [], ziel: 8, zeit: 1 });
const f2 = umgebung({ vt_offeneRunde: ziel8 }, faellig, HEUTE, voll);
f2.ctx.RUF.offeneRundeFortsetzen();
/* ⛔ Bis 24.09.2026 stand hier „eine bewusst kleinere Runde bleibt klein" (8) —
   meine Annahme. Elias: „hier wird mir 0/6 angezeigt obwohl mein tagesziel 10
   sind". Jetzt: bis zum Tagesziel, soweit fällig. */
pruefe('eine zu klein gebaute Runde wird bis zum Tagesziel aufgefüllt (sein 0/6)', 10, f2.ctx.SESSION.words.length);
const f2b = umgebung({ vt_offeneRunde: ziel8 }, faellig, HEUTE,
  { tagesDeckel: () => 10, currentPool: () => acht.slice() });
f2b.ctx.RUF.offeneRundeFortsetzen();
pruefe('ist wirklich nur so viel fällig (Kapitel abgewählt), bleibt sie klein', 8, f2b.ctx.SESSION.words.length);
const f3 = umgebung({ vt_offeneRunde: alt8 }, faellig, HEUTE,
  { tagesDeckel: () => 10, currentPool: () => faellig.slice(0, 9) });
f3.ctx.RUF.offeneRundeFortsetzen();
pruefe('reicht das Fällige nicht, wird nichts erfunden (9)', 9, f3.ctx.SESSION.words.length);
/* Störtest: ohne das Auffüllen bliebe es bei 8. */
const f4 = umgebung({ vt_offeneRunde: alt8 }, faellig);
f4.ctx.RUF.offeneRundeFortsetzen();
pruefe('Störtest: ohne Auffüllen blieben es 8', 8, f4.ctx.SESSION.words.length);

/* ===== 5. „Jetzt lernen" wartet, bis der Bestand beim Start steht ===== */
const mBeginnen = lernen.match(/\nconst START_WARTEN_MS = \d+;[\s\S]*?\nasync function lernenBeginnen\(\)\{[\s\S]*?\n\}\n/);
console.log('\n„Jetzt lernen" direkt nach dem Öffnen:');
if (!mBeginnen){ pruefe('lernenBeginnen() gefunden', true, false); }
else {
  const beginnen = (quelle, bereit, frist) => {
    const log = [];
    const ctx = {
      SESSION: { words: [], idx: 0, dirs: [], fertig: true }, setTimeout,
      showScreen: n => log.push('zeige ' + n),
      offeneRundeFortsetzen: () => { log.push('fortsetzen?'); return false; },
      startLearningSession: () => log.push('neue Runde'),
    };
    if (bereit) ctx.STARTBESTAND_BEREIT = bereit;
    vm.createContext(ctx);
    vm.runInContext((frist ? quelle.replace(/START_WARTEN_MS = \d+/, 'START_WARTEN_MS = ' + frist) : quelle)
      + '\nthis.los = lernenBeginnen;', ctx);
    return { los: ctx.los, log };
  };
  const kurz = () => new Promise(f => setTimeout(f, 30));
  let freigeben;
  const w1 = beginnen(mBeginnen[0], new Promise(f => { freigeben = f; }));
  const l1 = w1.los(), l2 = w1.los();                  /* zweimal getippt */
  await kurz();
  pruefe('vor dem fertigen Bestand entsteht keine Runde', [], w1.log);
  freigeben(); await l1; await l2;
  pruefe('danach genau eine, auch bei zweimal Tippen', ['fortsetzen?', 'neue Runde'], w1.log);
  const w2 = beginnen(mBeginnen[0], new Promise(() => {}), 20);    /* der Start hängt */
  await w2.los();
  pruefe('hängt der Start, geht es nach der Frist weiter', ['fortsetzen?', 'neue Runde'], w2.log);
  /* Störtest: ohne das Warten — so war es bis v573. */
  const ohne = mBeginnen[0].replace(/await Promise\.race\([\s\S]*?\]\);/, ';');
  if (ohne === mBeginnen[0]) pruefe('Störtest ließ sich bauen', true, false);
  const w3 = beginnen(ohne, new Promise(() => {}));
  w3.los(); await kurz();
  pruefe('Störtest: ohne Warten entstünde sie sofort', ['fortsetzen?', 'neue Runde'], w3.log);
}

/* ===== 6. Gelöschte eigene Wörter aus vocab-data.js kommen beim Start nicht wieder ===== */
const mFilter = kern.match(/\n\{\n  const wegRoh = LS\.get\('vt_geloescht', \{\}\);[\s\S]*?VOCAB_DATA\.push\(\.\.\.PERSONAL_VOCAB\.filter\([^\n]*\n\}\n/);
console.log('\nBeim Start, vor dem Laden der Bücher:');
if (!mFilter){ pruefe('der Ladeblock in js/kern.js gefunden', true, false); }
else {
  const laden = (quelle) => {
    const ctx = {
      VOCAB_DATA: [{ id: 'fleisch', chapter: 'personal' }, { id: 'bleibt', chapter: 'personal' },
                   { id: 'buch', chapter: 7 }, { id: 'zurueck', chapter: 'personal' }],
      PERSONAL_VOCAB: [{ id: 'p_1', chapter: 'personal' }],
      LS: { get: (k, f) => k === 'vt_geloescht'
        ? { fleisch: { an: true }, buch: { an: true }, zurueck: { an: false } } : f }
    };
    vm.createContext(ctx);
    vm.runInContext(quelle, ctx);
    return ctx.VOCAB_DATA.map(w => w.id);
  };
  pruefe('gelöschte eigene fehlen, alles andere bleibt', ['bleibt', 'buch', 'zurueck', 'p_1'], laden(mFilter[0]));
  const ohne = mFilter[0].replace(/  for \(let i = VOCAB_DATA\.length - 1;[\s\S]*?\n  \}\n/, '');
  pruefe('Störtest: ohne den Filter stünde „Fleisch" wieder da', true, laden(ohne).includes('fleisch'));
}

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
pruefe('„Jetzt lernen" ruft lernenBeginnen()', true,
  /learn-entry[\s\S]{0,800}?lernenBeginnen\(\);/.test(navi));
pruefe('lernenBeginnen() setzt fort oder beginnt neu', true,
  !!mBeginnen && /if \(offeneRundeFortsetzen\(\)\) return;\s*startLearningSession\(\);/.test(mBeginnen[0]));
pruefe('js/buecher.js meldet den Bestand fertig, als Letztes', true,
  /const STARTBESTAND_BEREIT = new Promise/.test(buecher) && /\n  startbestandFertig\(\);\n\}\);/.test(buecher));
pruefe('der Tausch merkt sich die Karte aus dem Buch', true,
  /GETAUSCHT\.set\(von, nach\);/.test(kern) && /GETAUSCHT\.set\(String\(f\.id\), String\(ziel\.id\)\)/.test(kern));
pruefe('die Sicherung merkt sich die Größe', true,
  /ziel: Number\(SESSION\.ziel\) \|\| SESSION\.words\.length/.test(lernen));
pruefe('die Startseite zeigt den Hinweis', true, /offeneRundeStand\(\)/.test(start));
/* ⛔ Der Schlüssel gehört dem Gerät. Stünde er im Abgleich, käme die beendete
   Runde vom anderen Gerät zurück — ein fehlender Eintrag verliert jeden
   „jüngerer Stempel gewinnt"-Vergleich. [[ausfall_ist_unsichtbar_gebaut]] */
pruefe('der Schlüssel wird NICHT abgeglichen', false, /vt_offeneRunde/.test(sync));

console.log('\n' + (fehler ? 'FEHLER: ' + fehler
  : 'Die angefangene Runde übersteht das Schließen der App, und die Zahl zählt das Gemachte.'));
process.exit(fehler ? 1 : 0);
