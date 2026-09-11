#!/usr/bin/env node
/* pruefe-hoerablenker.mjs — fuenf Antworten im Hoermodus, und die falschen sind wirklich aehnlich
 * ==========================================================================================
 *
 * ⛔⛔ DER ANLASS — Elias am 11.09.2026, unterwegs in einer Claude-Sitzung im Web:
 *
 *   „Also beim Hörverstehen sollen 5 Auswahl Möglichkeiten sein und es soll
 *   schwerer gemacht werden und zwar in den man ähnliche Wörter die die sich
 *   entweder ähnlich anhören oder ähnlich geschrieben werden beim vokabeltrainer"
 *
 * Bewacht werden SEINE ZWEI SAETZE, nicht die Technik dahinter:
 *
 *   1. „5 Auswahl Möglichkeiten" — HOER_ANTWORTEN steht auf 5, und JEDE Stelle
 *      in js/hoeren.js liest die Zahl. Eine vergessene 4 in der Vorratspruefung
 *      waere eine stille Grenze, die niemand sieht.
 *   2. „schwerer … ähnliche Wörter" — gemessen als WIRKUNG an den echten
 *      Vokabeln aus vocab-data.js: die Ablenker der App gegen einen zufaelligen
 *      Griff in denselben Vorrat.
 *
 * Dazu, was beim Schwerermachen kaputtgehen kann:
 *   3. zwei gleichwertige Antworten auf einer Karte („groß (lang)" / „groß",
 *      „Tag" / „heute") — dann ist die Frage unloesbar;
 *   4. immer dieselben Ablenker zu einem Wort — dann erkennt man die Karte
 *      wieder, statt hinzuhoeren.
 *
 * ⛔ NICHTS NACHGEBAUT. Der Block „AEHNLICHE ABLENKER" wird aus js/hoeren.js
 * geschnitten, `sprechText` und `shuffle` aus js/kern.js — was hier laeuft, ist
 * Zeichen fuer Zeichen der Quelltext der App. [[testvorlage_selbst_nachgebaut]]
 *
 * ⛔ STOERTESTS AM ENDE: der Pruefer legt die Aehnlichkeit, den Bedeutungsschutz
 * und die Fuenf probeweise still und muss jedes Mal rot werden. Gemessen wird
 * dabei mit dem UNGESTOERTEN Mass — ein kaputter Zollstock misst sonst seinen
 * eigenen Fehler als richtig. [[stoertest_muss_wirkung_nachweisen]]
 *
 * Aufruf: node werkzeuge/pruefe-hoerablenker.mjs
 */
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { ohneKommentareUndTexte } from './js-quelltext.mjs';

/* ⛔ fileURLToPath, nicht .pathname: der Pfad enthaelt ein Leerzeichen. [[adresse_nie_normalisieren]] */
const lies = rel => fs.readFileSync(fileURLToPath(new URL('../' + rel, import.meta.url)), 'utf8');
const HOEREN = lies('js/hoeren.js');
const KERN = lies('js/kern.js');
const DATEN = lies('vocab-data.js');

let fehler = 0;
const gut = t => console.log('  ok ' + t);
const schlecht = t => { fehler++; console.log('  ⛔ ' + t); };
const pruefe = (bedingung, text, gemessen) => (bedingung ? gut(text) : schlecht(text + (gemessen !== undefined ? '   gemessen: ' + gemessen : '')));

const ANFANG = '/* ===== AEHNLICHE ABLENKER — Anfang';
const ENDE = '/* ===== AEHNLICHE ABLENKER — Ende ===== */';
function block(quelle){
  const a = quelle.indexOf(ANFANG), e = quelle.indexOf(ENDE);
  return (a < 0 || e < a) ? null : quelle.slice(a, e + ENDE.length);
}
/* Funktion mit ihrer Klammerbilanz — gezaehlt im Text OHNE Kommentare und
   Zeichenketten (gleiche Laenge, gleiche Versaetze), geschnitten im Original. */
function funktion(quelle, name){
  const leer = ohneKommentareUndTexte(quelle);
  const a = leer.indexOf('function ' + name + '(');
  if (a < 0) return null;
  let i = leer.indexOf('{', a), tiefe = 0;
  for (; i < leer.length; i++){
    if (leer[i] === '{') tiefe++;
    else if (leer[i] === '}' && --tiefe === 0) return quelle.slice(a, i + 1);
  }
  return null;
}

const BLOCK = block(HOEREN);
/* ⛔⛔ Seit dem 11.09.2026 abends gehoeren die WORTFELDER dazu (Elias,
   20:38:46: „… oder ähnlich sind wie zb mund und nase …"). hoerFelder() fragt
   sie mit `typeof WORTFELDER` ab und liefert ohne sie still ein leeres Feld.
   Beim ersten Lauf nach dem Umbau fehlten sie hier — der Pruefer war gruen und
   hatte die neue Auswahl OHNE Wortfeld gemessen, also nicht die, die in der
   App laeuft. [[pruefwerkzeug_laedt_mehr_als_die_app]] */
const WORTFELD_DATEN = lies('wortfelder-data.js');
const TRENNER = (KERN.match(/const WORTFELD_TRENNER = [^\n]*\n/) || [null])[0];
const HILFEN = ['sprechText', 'shuffle', 'wortfeldForm', 'wortfeldTreffer', 'istEineDerFormen', 'passtInsFeld'].map(n => funktion(KERN, n));
if (!BLOCK || HILFEN.some(h => !h) || !TRENNER){
  console.log('⛔ Block „AEHNLICHE ABLENKER" in js/hoeren.js oder eine Hilfsfunktion in js/kern.js (sprechText, shuffle, passtInsFeld, WORTFELD_TRENNER …) nicht gefunden.');
  process.exit(1);
}

function lade(blockQuelle){
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(WORTFELD_DATEN + '\n' + TRENNER + HILFEN.join('\n') + '\n' + blockQuelle
    + '\n;globalThis.__H = { waehleAblenker, hoerTaugtAlsAblenker, hoerAehnlichkeit, hoerMerkmale, HOER_LAUTGRUPPEN, HOER_SCHRIFTGRUPPEN,'
    + ' wortfelderGeladen: typeof WORTFELDER !== "undefined" && WORTFELDER.length > 0 };',
    ctx, { filename: 'js/hoeren.js (Block)' });
  return ctx.__H;
}
const datenCtx = {};
vm.createContext(datenCtx);
vm.runInContext(DATEN + '\n;globalThis.__V = VOCAB_DATA;', datenCtx, { filename: 'vocab-data.js' });
/* Derselbe Filter wie hoerbareVokabeln(): ohne brauchbare Bedeutung keine Antwort. */
const POOL = datenCtx.__V.filter(w => w.ar && w.de && String(w.de).trim().length > 1);
const nachBedeutung = de => {
  const w = POOL.find(x => x.de === de);
  if (!w) throw new Error(`„${de}" steht nicht mehr in vocab-data.js — Eichwort ersetzen`);
  return w;
};

const ECHT = lade(BLOCK);

/* ---------- 1. Fuenf Antworten, an jeder Stelle ---------- */
function pruefeZahl(quelle){
  const leer = ohneKommentareUndTexte(quelle, { texte: false });
  const befunde = [];
  const m = leer.match(/const HOER_ANTWORTEN = (\d+);/);
  if (!m || m[1] !== '5') befunde.push(`HOER_ANTWORTEN steht auf ${m ? m[1] : 'nichts'}, Elias will 5`);
  const muss = [
    ['if (pool.length < HOER_ANTWORTEN)', 'die Vorratspruefung in naechsteHoerfrage()'],
    ['if (eng.length >= HOER_ANTWORTEN) pool = eng;', 'die Kapitelauswahl in hoerbareVokabeln()'],
    ['waehleAblenker(HOER.wort, pool, HOER_ANTWORTEN - 1)', 'die Ablenkerzahl in naechsteHoerfrage()'],
    ['um ${HOER_ANTWORTEN} Antworten anzubieten', 'die Leermeldung'],
  ];
  for (const [stelle, was] of muss) if (!leer.includes(stelle)) befunde.push(`${was} liest HOER_ANTWORTEN nicht mehr`);
  if (/waehleAblenker\([^)]*,\s*\d+\s*\)/.test(leer)) befunde.push('ein waehleAblenker()-Aufruf mit fester Zahl');
  return befunde;
}
console.log('pruefe-hoerablenker.mjs — ' + POOL.length + ' Vokabeln mit Bedeutung aus vocab-data.js\n');
console.log('1. „5 Auswahl Möglichkeiten"');
{
  const befunde = pruefeZahl(HOEREN);
  if (!befunde.length) gut('HOER_ANTWORTEN = 5, und Vorrat, Kapitelauswahl, Ablenkerzahl und Leermeldung lesen sie');
  befunde.forEach(schlecht);
}

/* ---------- 2. Eichung an echten Woertern ---------- */
function eichung(H){
  const befunde = [];
  const gruppen = [...H.HOER_LAUTGRUPPEN, ...H.HOER_SCHRIFTGRUPPEN].join('');
  for (const z of gruppen){
    const cp = z.codePointAt(0);
    if (!((cp >= 0x0621 && cp <= 0x064A) || cp === 0x0671))
      befunde.push(`U+${cp.toString(16).toUpperCase()} in einer Buchstabengruppe liegt ausserhalb des arabischen Grundblocks`);
  }
  const A = (a, b) => H.hoerAehnlichkeit(nachBedeutung(a), nachBedeutung(b));
  const T = (a, b) => H.hoerTaugtAlsAblenker(nachBedeutung(a), nachBedeutung(b));
  const faelle = [
    [A('Mann', 'Bein / Fuß').laut === 1, '„Mann" / „Bein" klingen bis auf die Vokale gleich (Lautbild 1)'],
    [A('Haus', 'Tochter / Mädchen').schrift === 1 && A('Haus', 'Tochter / Mädchen').laut < 1, '„Haus" / „Tochter" unterscheiden sich nur in den Punkten (Schriftbild 1, Lautbild darunter)'],
    [A('wo', 'Auge').laut === 1 && A('wo', 'Auge').schrift < 1, '„wo" / „Auge": Hamza und ʿAin fallen fuers Ohr zusammen, fuers Auge nicht'],
    [A('Schreibtisch / Büro / Amt', 'Bibliothek / Buchladen').laut === 1, '„Büro" / „Bibliothek": ة am Ende zaehlt nicht'],
    [A('jetzt', 'Vater').schrift < 1, '„jetzt" / „Vater": ن am Wortende ist kein Zahn'],
    [(() => { const k = nachBedeutung('klein').ar, a = nachBedeutung('Auto').ar;
      const kl = H.hoerAehnlichkeit({ id: 'x', ar: k[0], de: 'x' }, { id: 'y', ar: a[0], de: 'y' });
      return kl.laut === 1 && kl.schrift < 1; })(), 'ṣād (aus „klein") und sīn (aus „Auto"): gleicher Laut, andere Schrift'],
    [T('Tag', 'heute') === false, '„Tag" / „heute" ist dasselbe Wort — nie zusammen auf einer Karte'],
    [T('groß (lang)', 'groß') === false, '„groß (lang)" / „groß" haben dieselbe Bedeutung — nie zusammen'],
    [T('Mann', 'Bein / Fuß') === true, '„Mann" / „Bein" sind verschiedene Woerter — ein erlaubtes Hoerpaar'],
    [H.wortfelderGeladen === true, 'die Wortfelder sind geladen — sonst misst dieser Pruefer eine Auswahl ohne Themen'],
    [H.hoerMerkmale(nachBedeutung('Mund')).felder.includes('Körperteile') && H.hoerMerkmale(nachBedeutung('Nase')).felder.includes('Körperteile'),
      '„Mund" und „Nase" liegen beide im Feld „Körperteile"'],
    [H.hoerMerkmale(nachBedeutung('Lehrer')).wurzel !== '' && H.hoerMerkmale(nachBedeutung('Lehrer')).wurzel === H.hoerMerkmale(nachBedeutung('Schule')).wurzel,
      '„Lehrer" und „Schule" haben dieselbe Wurzel (د ر س)'],
  ];
  for (const [ok, text] of faelle) if (!ok) befunde.push(text + ' — trifft nicht mehr zu');
  return { befunde, anzahl: faelle.length };
}
console.log('\n2. Eichung an Woertern aus vocab-data.js');
{
  const { befunde, anzahl } = eichung(ECHT);
  if (!befunde.length) gut(`alle Buchstaben im arabischen Grundblock, ${anzahl} von ${anzahl} Eichfaellen treffen`);
  befunde.forEach(schlecht);
}

/* ---------- 3.–5. Die Karten ---------- */
const ANZAHL = 4;             /* fuenf Antworten = das gefragte Wort + vier Ablenker */
/* Zehn Karten je Wort reichen, um „immer dieselben" zu erkennen: bei nur drei
   moeglichen Saetzen kaeme derselbe zehnmal in Folge mit 3 · (1/3)^10 ≈ 0,005 %. */
const LAEUFE = 10;
function messeKarten(H, laeufe = LAEUFE){
  let karten = 0, zuWenig = 0, zielDrin = 0, verstoesse = 0, wertApp = 0, wertZufall = 0, aehnlich = 0, immerGleich = 0;
  let feldMoeglich = 0, feldAllein = 0, wurzelMoeglich = 0, wurzelDabei = 0, typMoeglich = 0, typAllein = 0, mundKoerper = 0, mundKarten = 0;
  const paare = { 'Mann': ['Bein / Fuß', 0], 'Lehrer': ['Schule', 0] };
  /* Das ECHTE Mass fuer Feld und Wurzel — auch wenn H gestoert ist. */
  const M = w => ECHT.hoerMerkmale(w);
  const teiltFeld = (a, b) => M(a).felder.some(f => M(b).felder.includes(f));
  for (const ziel of POOL){
    const saetze = new Set();
    const erlaubt = POOL.filter(w => ECHT.hoerTaugtAlsAblenker(ziel, w));
    const gibtFeld = M(ziel).felder.length > 0 && erlaubt.some(w => teiltFeld(ziel, w));
    const gibtWurzel = M(ziel).wurzel !== '' && erlaubt.some(w => M(w).wurzel === M(ziel).wurzel);
    const gibtTyp = erlaubt.filter(w => w.type === ziel.type).length >= ANZAHL;
    for (let r = 0; r < laeufe; r++){
      const ab = H.waehleAblenker(ziel, POOL, ANZAHL);
      karten++;
      if (ab.length < ANZAHL) zuWenig++;
      if (ab.some(w => w.id === ziel.id)) zielDrin++;
      const karte = [ziel, ...ab];
      for (let i = 0; i < karte.length; i++) for (let j = i + 1; j < karte.length; j++)
        if (!ECHT.hoerTaugtAlsAblenker(karte[i], karte[j])) verstoesse++;
      /* ⛔ Gemessen mit dem ECHTEN Mass, auch wenn H gestoert ist. */
      wertApp += ab.reduce((s, w) => s + ECHT.hoerAehnlichkeit(ziel, w).wert, 0) / Math.max(1, ab.length);
      aehnlich += ab.filter(w => ECHT.hoerAehnlichkeit(ziel, w).aehnlich).length;
      const zufall = [];
      while (zufall.length < ANZAHL){
        const w = POOL[Math.floor(Math.random() * POOL.length)];
        if (w.id !== ziel.id && !zufall.includes(w)) zufall.push(w);
      }
      wertZufall += zufall.reduce((s, w) => s + ECHT.hoerAehnlichkeit(ziel, w).wert, 0) / ANZAHL;
      saetze.add(ab.map(w => w.id).sort().join(','));
      if (paare[ziel.de] && ab.some(w => w.de === paare[ziel.de][0])) paare[ziel.de][1]++;
      /* „per ausschluss": steht die richtige Antwort als EINZIGE ihres Themas
         oder ihrer Wortart auf der Karte, braucht man nicht hinzuhoeren. */
      if (gibtFeld){ feldMoeglich++; if (!ab.some(w => teiltFeld(ziel, w))) feldAllein++; }
      if (gibtWurzel){ wurzelMoeglich++; if (ab.some(w => M(w).wurzel === M(ziel).wurzel)) wurzelDabei++; }
      if (gibtTyp){ typMoeglich++; if (!ab.some(w => w.type === ziel.type)) typAllein++; }
      if (ziel.de === 'Mund'){ mundKarten++; mundKoerper += ab.filter(w => M(w).felder.includes('Körperteile')).length; }
    }
    if (saetze.size === 1) immerGleich++;
  }
  return { karten, laeufe, zuWenig, zielDrin, verstoesse, wertApp: wertApp / karten, wertZufall: wertZufall / karten,
    aehnlich: aehnlich / karten, immerGleich, paare,
    feldAllein: feldMoeglich ? feldAllein / feldMoeglich : 0, feldMoeglich,
    wurzelDabei: wurzelMoeglich ? wurzelDabei / wurzelMoeglich : 1, wurzelMoeglich,
    typAllein: typMoeglich ? typAllein / typMoeglich : 0,
    mundKoerper: mundKarten ? mundKoerper / mundKarten : 0 };
}
function urteile(m){
  const befunde = [];
  if (m.zuWenig) befunde.push(`${m.zuWenig} von ${m.karten} Karten mit weniger als ${ANZAHL} Ablenkern`);
  if (m.zielDrin) befunde.push(`${m.zielDrin} Karten mit dem gefragten Wort unter den Ablenkern`);
  if (m.verstoesse) befunde.push(`${m.verstoesse} Mal zwei gleichwertige Antworten auf einer Karte`);
  /* Gemessen am 11.09.2026: 0,38 gegen 0,15 — die Grenzen lassen Luft fuer den Zufall. */
  if (!(m.wertApp >= 0.30 && m.wertApp >= 2 * m.wertZufall))
    befunde.push(`Ablenker nicht aehnlicher als der Zufall: Ø ${m.wertApp.toFixed(3)} gegen ${m.wertZufall.toFixed(3)} (verlangt ≥ 0,30 und das Doppelte)`);
  /* v469: 1,02 · seit dem Wortfeld-Platz (11.09.2026 abends): 0,90 — das
     Hoerpaar bleibt, ein Platz geht an das Thema. Die Grenze bewacht, dass das
     Thema das Hoeren nicht verdraengt (mit zwei festen Feld-Plaetzen: 0,68). */
  if (!(m.aehnlich >= 0.8)) befunde.push(`im Mittel nur ${m.aehnlich.toFixed(2)} Ablenker ueber der Schwelle (gemessen am 11.09.2026: 1,02 vor, 0,90 nach dem Wortfeld-Platz; verlangt ≥ 0,8)`);
  if (m.immerGleich > POOL.length * 0.05) befunde.push(`${m.immerGleich} Woerter bekamen in ${m.laeufe} Laeufen immer dieselben Ablenker`);
  for (const [wort, [partner, n]] of Object.entries(m.paare))
    if (n !== m.laeufe) befunde.push(`„${wort}": der aehnlichste Ablenker „${partner}" kam nur ${n} von ${m.laeufe} Mal`);
  /* Elias, 20:38:46: „sehr oft kann ich einfach per ausschluss kriterium das
     richtig machen". Gemessen am 11.09.2026 (171 Woerter × 10 Karten):
       vorher (v469)  Thema allein 52,4 % · Wurzel dabei 66,8 % · Wortart allein 2,5 % · „Mund" 0,67 Koerperteile
       nachher        Thema allein  0,0 % · Wurzel dabei 100 %  · Wortart allein 0,2 % · „Mund" 2,00 Koerperteile
       Zufall         Thema allein 79 %   · Wurzel dabei 2,6 %  · Wortart allein 21 %
     Die Grenzen lassen Luft fuer den Zufall, aber nicht fuer den alten Stand. */
  if (m.feldAllein > 0.10) befunde.push(`bei ${(100 * m.feldAllein).toFixed(1)} % der Karten ist die richtige Antwort das einzige Wort ihres Wortfelds — per Ausschluss loesbar (verlangt ≤ 10 %)`);
  if (m.wurzelDabei < 0.90) befunde.push(`nur bei ${(100 * m.wurzelDabei).toFixed(1)} % der moeglichen Karten ein Wort derselben Wurzel (verlangt ≥ 90 %)`);
  if (m.typAllein > 0.05) befunde.push(`bei ${(100 * m.typAllein).toFixed(1)} % der Karten ist die richtige Antwort die einzige ihrer Wortart (verlangt ≤ 5 %)`);
  if (m.mundKoerper < 1.5) befunde.push(`„Mund" bekommt im Mittel nur ${m.mundKoerper.toFixed(2)} Koerperteile als Ablenker (verlangt ≥ 1,5)`);
  return befunde;
}
console.log(`\n3.–5. ${POOL.length} Woerter × ${LAEUFE} Karten mit ${ANZAHL} Ablenkern`);
const M = messeKarten(ECHT);
{
  const befunde = urteile(M);
  console.log(`  gemessen: Ø Aehnlichkeit ${M.wertApp.toFixed(3)} (Zufall ${M.wertZufall.toFixed(3)}) · Ø ${M.aehnlich.toFixed(2)} von ${ANZAHL} ueber der Schwelle · immer gleicher Satz: ${M.immerGleich} · gleichwertige Antworten: ${M.verstoesse}`);
  console.log(`  per Ausschluss: Thema allein ${(100 * M.feldAllein).toFixed(1)} % (${M.feldMoeglich} Karten) · Wurzel dabei ${(100 * M.wurzelDabei).toFixed(1)} % (${M.wurzelMoeglich} Karten) · Wortart allein ${(100 * M.typAllein).toFixed(1)} % · „Mund": Ø ${M.mundKoerper.toFixed(2)} Koerperteile`);
  if (!befunde.length){
    gut('jede Karte hat vier Ablenker, nie das gefragte Wort, nie zwei gleichwertige Antworten');
    gut('die Ablenker sind deutlich aehnlicher als ein zufaelliger Griff, und sie wandern');
    gut('„Mann" bekommt immer „Bein", „Lehrer" immer „Schule" — der aehnlichste kommt fest mit');
  }
  befunde.forEach(schlecht);
}

/* ---------- 6. Stoertests ---------- */
console.log('\n6. Stoertests — jeder muss rot werden');
function stoere(name, alt, neu, pruefung){
  const quelle = name === 'zahl' ? HOEREN : BLOCK;
  if (!quelle.includes(alt)){ schlecht(`Stoertest „${name}": die Stelle „${alt}" gibt es nicht mehr — Stoertest anpassen`); return; }
  const gestoert = quelle.replace(alt, () => neu);
  const befunde = pruefung(gestoert);
  pruefe(befunde.length > 0, `Stoertest „${name}" wird rot` + (befunde.length ? ` (${befunde[0]})` : ''), 'blieb gruen');
}
stoere('zahl', 'const HOER_ANTWORTEN = 5;', 'const HOER_ANTWORTEN = 4;', q => pruefeZahl(q));
stoere('aehnlichkeit stillgelegt', 'const wert = Math.max(laut, schrift);', 'const wert = 0;',
  q => urteile(messeKarten(lade(q), 5)));
stoere('bedeutungsschutz stillgelegt', '&& !hoerGleicheBedeutung(ziel, w);', ';',
  q => eichung(lade(q)).befunde);
stoere('wortkern stillgelegt', '&& hoerMerkmale(w).kern !== hoerMerkmale(ziel).kern', '',
  q => eichung(lade(q)).befunde);
/* Die zwei neuen Plaetze: legt man einen still, muss genau seine Messung rot werden. */
stoere('wurzel stillgelegt', 'wurzel: !!zm.wurzel && m.wurzel === zm.wurzel,', 'wurzel: false,',
  q => urteile(messeKarten(lade(q), 5)).filter(b => /Wurzel/.test(b)));
stoere('wortfeld stillgelegt', 'feld: zm.felder.some(f => m.felder.includes(f)),', 'feld: false,',
  q => urteile(messeKarten(lade(q), 5)).filter(b => /Wortfeld|Koerperteile/.test(b)));

console.log(fehler
  ? `\n⛔ ${fehler} Befund(e) — die Ablenker im Hoermodus tun nicht, was Elias verlangt hat.`
  : '\n✅ Fuenf Antworten; die falschen klingen aehnlich, teilen die Wurzel oder das Thema — kein Ausschluss, keine zweite richtige.');
process.exitCode = fehler ? 1 : 0;
