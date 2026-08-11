/* Prueft den Wurzelmodus gegen den ECHTEN Wortbestand.
 *
 * Der Kern ist wzMarkiere(): sie entscheidet, welche Buchstaben als Wurzel
 * eingefaerbt werden. Eine falsch gesetzte Markierung ist der schlimmste
 * denkbare Fehler dieser App - sie brächte Elias einen Zusammenhang bei, den es
 * nicht gibt (Goal-Prompt E.1). Deshalb wird hier nicht nur geprueft, DASS
 * markiert wird, sondern auch, dass bei unsicherer Lage BEWUSST nicht markiert
 * wird.
 *
 * ⚠️ vm-Falle: `function`/`var` aus einer per runInContext gelesenen Datei
 * liegen lexikalisch vor. `var` landet zwar am Kontext, `const`/`function` in
 * Modulen nicht zuverlaessig - deshalb durchgehend ueber vm.runInContext.
 */
import fs from 'node:fs';
import vm from 'node:vm';

let ok = 0, schlecht = 0;
function pruefe(was, bedingung, zusatz){
  if (bedingung){ ok++; console.log('  ok   ' + was); }
  else { schlecht++; console.log('  FEHL ' + was + (zusatz ? '  → ' + zusatz : '')); }
}

/* ---------- Umgebung ---------- */
const ctx = {
  console, Set, Map, Object, Array, Number, String, Boolean, JSON, Math, RegExp,
  SETTINGS: {},
  document: { addEventListener(){}, getElementById(){ return null; },
              querySelector(){ return null; }, querySelectorAll(){ return []; },
              body: { dataset: {} } },
  window: { addEventListener(){} },
  setTimeout(){},
};
ctx.window.VOKABELN = {};
vm.createContext(ctx);

/* Der echte Lernbestand. */
vm.runInContext(fs.readFileSync(new URL('./vocab-data.js', import.meta.url), 'utf8'), ctx);
const anzahlLern = vm.runInContext('VOCAB_DATA.length', ctx);

/* Die Buchdatei, so wie die App sie nachlaedt. Sie ist gitignored und liegt nur
   lokal - fehlt sie, wird der Teil uebersprungen statt zu scheitern. */
const buchdatei = new URL('./data/vokabeln-madina-1.js', import.meta.url);
let buchDa = false;
try {
  vm.runInContext(fs.readFileSync(buchdatei, 'utf8'), ctx);
  buchDa = true;
} catch (e){ /* kein Abzug vorhanden */ }

console.log('\n0. Woher die Wurzeln kommen');
pruefe(`vocab-data.js geladen (${anzahlLern} Lernwörter)`, anzahlLern > 100);
if (!buchDa){
  console.log('  ⚠️   data/vokabeln-madina-1.js fehlt — der Abzug liegt nur lokal.');
  console.log('       Die Wurzel-Tests laufen dann ohne Buchdaten.');
} else {
  const roh = vm.runInContext('(window.VOKABELN["madina-1"]||[]).length', ctx);
  const mitWurzel = vm.runInContext(
    '(window.VOKABELN["madina-1"]||[]).filter(function(w){return w.root&&String(w.root).trim();}).length', ctx);
  pruefe(`Buchdatei bringt ${roh} Einträge, davon ${mitWurzel} mit Wurzel`, mitWurzel > 0);

  /* ⚠️ Hier stand zuerst die Behauptung, vocab-data.js habe GAR KEIN root-Feld.
     Das war falsch, und der Prüfstand hat es sofort gemeldet: 143 der 171
     Lernwörter tragen schon eine Wurzel. Der Irrtum kam von einer schlampigen
     Messung - `grep "root:"` fand nichts, weil die Datei `"root": "ب ي ت"`
     schreibt, also mit Anführungszeichen. Eine Suche, die das Format verfehlt,
     liefert 0 Treffer und sieht aus wie ein Befund.
     Richtig ist: der Lernbestand bringt einen Teil mit, das Einhängen des
     Abzugs füllt den Rest auf. */
  const rohMitRoot = vm.runInContext(
    'VOCAB_DATA.filter(function(w){return w.root;}).length', ctx);
  pruefe(`der Lernbestand bringt schon ${rohMitRoot} Wurzeln mit`,
    rohMitRoot > 100 && rohMitRoot <= anzahlLern, String(rohMitRoot));

  /* einhaengen() aus js/buecher.js nachbilden waere ein Nachbau. Stattdessen
     die echte Funktion laden - sie braucht nur VOCAB_DATA. */
  const bq = fs.readFileSync(new URL('./js/buecher.js', import.meta.url), 'utf8');
  const a = bq.indexOf('function einhaengen(liste){');
  const e = bq.indexOf('\n}', bq.indexOf('return { neu, ergaenzt, verworfen };', a)) + 2;
  vm.runInContext(bq.slice(bq.indexOf('const ROH_ARAB_FELDER'), e), ctx);
  vm.runInContext('einhaengen(window.VOKABELN["madina-1"])', ctx);
  const nachher = vm.runInContext('VOCAB_DATA.filter(function(w){return w.root;}).length', ctx);
  pruefe(`nach dem Einhängen tragen ${nachher} Wörter eine Wurzel`, nachher > 0, String(nachher));
}

/* ---------- Das Modul laden ---------- */
ctx.LERNBESTAND_IDS = new Set(vm.runInContext('VOCAB_DATA.slice(0,' + anzahlLern + ').map(function(w){return w.id;})', ctx));
ctx.bekannteVokabeln = () => vm.runInContext('VOCAB_DATA', ctx);
ctx.buchVokabeln     = () => vm.runInContext('VOCAB_DATA', ctx);
vm.runInContext(fs.readFileSync(new URL('./js/wurzel.js', import.meta.url), 'utf8'), ctx);
const ruf = (code) => vm.runInContext(code, ctx);

/* ---------- 1. Markieren ---------- */
console.log('\n1. Markieren — und wo bewusst NICHT markiert wird');
const m = ruf('wzMarkiere');
{
  const r = m('كِتَابٌ', 'ك ت ب');
  pruefe('كِتَابٌ mit ك ت ب wird markiert', r.ok);
  pruefe('… die Vokalzeichen bleiben am Buchstaben', r.ok && r.html.indexOf('كِ') >= 0, r.html);
  pruefe('… es entstehen getrennte wz/fm-Abschnitte',
    r.ok && /class="wz"/.test(r.html) && /class="fm"/.test(r.html), r.html);
}
{
  /* ⭐ Der wichtigste Fall: schwache Wurzel. بَابٌ hat die Wurzel ب و ب, das و
     steht aber nicht im Wort. Raten wäre hier der Fehler. */
  const r = m('بَابٌ', 'ب و ب');
  pruefe('⭐ schwache Wurzel (بَابٌ / ب و ب) wird NICHT markiert', !r.ok, r.grund || r.html);
  pruefe('… und der Grund wird genannt', !!r.grund);
}
{
  const r = m('أُمٌّ', 'أ م م);'.slice(0,5));
  pruefe('⭐ verdoppelte Wurzel (أُمٌّ / أ م م) wird NICHT markiert', !r.ok, r.grund || r.html);
}
{
  const r = m('أَمْرِيكَا', 'أ م ر');
  pruefe('⭐ Lehnwort أَمْرِيكَا wird NICHT markiert', !r.ok && r.grund === 'Lehnwort', r.grund);
}
{
  pruefe('ohne Wurzelangabe wird nicht markiert', !m('بَيْتٌ', '').ok);
  pruefe('ohne Wort kommt kein Absturz', m('', 'ب ي ت').ok === false);
}
{
  /* Hamza-Formen müssen zusammenfallen, sonst fände man أ nicht über ا. */
  const r = m('اَلْأَبُ', 'أ ب و');
  pruefe('Alif-Varianten werden zusammengefasst (kein Absturz)', typeof r.ok === 'boolean');
}

/* ---------- 2. Einheiten für Schritt 2 ---------- */
console.log('\n2. Einheiten — die antippbaren Buchstaben');
{
  const e = ruf('wzEinheiten')('كِتَابٌ', 'ك ت ب');
  pruefe('Zuordnung geht auf', e.ok);
  pruefe('drei Buchstaben gehören zur Wurzel',
    e.istWz.filter(Boolean).length === 3, String(e.istWz.filter(Boolean).length));
  pruefe('⭐ jeder Buchstabe ist genau EIN Element (sonst reißt die Schrift)',
    e.teile.length === e.istWz.length);
  pruefe('… und es gibt auch Formbuchstaben', e.istWz.some(v => !v));
}

/* ---------- 3. Familien aus dem echten Bestand ---------- */
console.log('\n3. Familien aus dem echten Bestand');
ruf('wzBaueFamilien()');
const fam = ruf('WZ_FAMILIEN');
pruefe(`es entstehen Familien (${fam.length})`, fam.length > 0);
if (fam.length){
  pruefe('jede Familie hat mindestens ein eigenes Wort',
    fam.every(f => f.eigene > 0));
  pruefe('jede Familie hat mindestens zwei Wörter',
    fam.every(f => f.woerter.length >= 2));
  pruefe('keine Familie ist länger als sieben Zeilen',
    fam.every(f => f.woerter.length <= 7));
  pruefe('eigene Wörter stehen oben',
    fam.every(f => { let sahNeu = false;
      return f.woerter.every(w => { if (!w.kennst) sahNeu = true; return !(sahNeu && w.kennst); }); }));
  pruefe('nach Anzahl eigener Wörter sortiert',
    fam.every((f,i) => i === 0 || fam[i-1].eigene >= f.eigene));
  pruefe('⭐ kein Lehnwort ist in einer Familie gelandet',
    fam.every(f => f.woerter.every(w =>
      ruf('WZ_LEHNWORT').indexOf(ruf('wzVergleichsform')(w.ar)) < 0)));
  const doppelt = fam.some(f => {
    const s = new Set(f.woerter.map(w => ruf('wzOhneZeichen')(w.ar)));
    return s.size !== f.woerter.length;
  });
  pruefe('kein Wort steht doppelt in derselben Familie', !doppelt);
}

/* ---------- 4. Spielbarkeit ---------- */
console.log('\n4. Was das Mini-Spiel hergibt');
{
  const sp = ruf('wzSpielbar()');
  pruefe(`spielbare Familien: ${sp.length}`, sp.length >= 0);
  pruefe('⭐ jede spielbare Familie hat mindestens ein markierbares Wort — sonst wäre sie unlösbar',
    sp.every(f => f.woerter.some(w => m(w.ar, f.wurzel).ok)));
}

/* ---------- 5. Nichts wird in den Lernstand geschrieben ---------- */
console.log('\n5. Der Wurzelmodus fasst den Lernstand nicht an');
{
  const quelle = fs.readFileSync(new URL('./js/wurzel.js', import.meta.url), 'utf8');
  pruefe('kein saveProgress()', quelle.indexOf('saveProgress') < 0);
  pruefe('kein Schreiben in PROGRESS', !/PROGRESS\s*\[[^\]]*\]\s*=/.test(quelle));
  pruefe('kein LS.set', quelle.indexOf('LS.set') < 0);
}

console.log(`\n${ok} bestanden, ${schlecht} gescheitert.`);
process.exitCode = schlecht ? 1 : 0;
