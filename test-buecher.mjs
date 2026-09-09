/* Prueft die Mehrfachauswahl der Buecher (11.08.2026).
 *
 * Geprueft wird das, was still kaputtgehen kann: die einmalige Umstellung des
 * alten Standes und der Filter passtZurAuswahl(). Beides entscheidet daruber,
 * WELCHE Woerter Elias zu sehen bekommt - ein Fehler darin faellt nicht als
 * Absturz auf, sondern als "da fehlen doch Vokabeln".
 *
 * ⚠️ vm-Falle (Gedaechtnis, 04.08.2026): `const`/`function` in einer per
 * runInContext ausgefuehrten Datei liegen LEXIKALISCH vor und NICHT am
 * Kontextobjekt. Zugriff nur ueber vm.runInContext('NAME', ctx).
 */
import fs from 'node:fs';
import vm from 'node:vm';
import { ohneKommentareUndTexte } from './werkzeuge/js-quelltext.mjs';

let ok = 0, schlecht = 0;
function pruefe(was, bedingung, zusatz){
  if (bedingung){ ok++; console.log('  ok   ' + was); }
  else { schlecht++; console.log('  FEHL ' + was + (zusatz ? '  → ' + zusatz : '')); }
}

/* ---------- Eine Umgebung mit genau so viel App, wie die zwei Funktionen brauchen ---------- */
function baue(einstellungen, woerter){
  const ctx = {
    console,
    SETTINGS: einstellungen,
    VOCAB_DATA: woerter || [],
    FREIGESCHALTET: { 'madina-1': [1,2,3,4,5,6,7,8,9] },
    BUECHER: [
      { slug:'madina-1', datei:'data/vokabeln-madina-1.js', kapitel:24, vokabeln:298 },
      { slug:'madina-2', datei:'data/vokabeln-madina-2.js', kapitel:31, vokabeln:400 },
      { slug:'bayna-yadayk-1', datei:'data/vokabeln-bayna-yadayk-1.js', kapitel:16, vokabeln:500 },
    ],
    GELADENE_BUECHER: new Set(['madina-1','madina-2','bayna-yadayk-1']),
    BUCH_FEHLT: new Set(),
    document: { addEventListener(){}, getElementById(){ return null; }, querySelector(){ return null; } },
    saveSettings(){}, toast(){}, renderHome(){}, saveProgress(){},
    PROGRESS: {}, todayStr: ()=> '2026-08-11',
    window: {}, Set, Map, Object, Array, Number, String, Boolean, JSON, Promise, Error,
  };
  vm.createContext(ctx);
  /* buecher.js haengt an VOCAB_DATA (basisEinordnen) und definiert die Funktionen. */
  vm.runInContext(fs.readFileSync(new URL('./js/buecher.js', import.meta.url), 'utf8'), ctx);
  /* passtZurAuswahl aus kern.js, nur diese eine Funktion - der Rest der Datei
     zieht die halbe App nach. Wortgleich aus der Datei geschnitten, nicht
     nachgebaut: eine nachgebaute Fassung wuerde die eigene Absicht pruefen,
     nicht den ausgelieferten Code. */
  const kern = fs.readFileSync(new URL('./js/kern.js', import.meta.url), 'utf8');
  const anfang = kern.indexOf('function passtZurAuswahl(w){');
  const ende = kern.indexOf('\n}', anfang) + 2;
  if (anfang < 0) throw new Error('passtZurAuswahl in js/kern.js nicht gefunden');
  vm.runInContext(kern.slice(anfang, ende), ctx);
  return ctx;
}
const ruf = (ctx, code) => vm.runInContext(code, ctx);

/* ---------- 1. Die einmalige Umstellung ---------- */
console.log('\n1. Alter Stand wird übernommen, nicht weggeworfen');
{
  const s = { aktivesBuch:'madina-1', selectedChapters:[3,5] };
  const ctx = baue(s);
  pruefe('Umstellung meldet, dass sie gelaufen ist', ruf(ctx, 'stelleBuchauswahlUm()') === true);
  pruefe('Buch übernommen', JSON.stringify(Object.keys(s.buecher)) === '["madina-1"]', JSON.stringify(s.buecher));
  pruefe('Kapitel 3 und 5 bleiben erhalten', JSON.stringify(s.buecher['madina-1']) === '[3,5]', JSON.stringify(s.buecher));
  pruefe('Eigene waren nicht gewählt', s.eigeneGewaehlt === false);
  pruefe('läuft nur EINMAL', ruf(ctx, 'stelleBuchauswahlUm()') === false);
}
{
  const s = { aktivesBuch:'bayna-yadayk-1', selectedChapters:[2,'personal'] };
  const ctx = baue(s); ruf(ctx, 'stelleBuchauswahlUm()');
  pruefe("'personal' wandert aus der Kapitelliste heraus",
    JSON.stringify(s.buecher['bayna-yadayk-1']) === '[2]' && s.eigeneGewaehlt === true,
    JSON.stringify(s));
}
{
  const s = {};                       /* frische Installation */
  const ctx = baue(s); ruf(ctx, 'stelleBuchauswahlUm()');
  pruefe('frische Installation bekommt Madina 1',
    JSON.stringify(s.buecher) === '{"madina-1":[]}', JSON.stringify(s.buecher));
}

/* ---------- 2. aktiveBuecher / kapitelAuswahl ---------- */
console.log('\n2. Auswahl auslesen');
{
  const ctx = baue({ buecher: { 'madina-1':[1,2], 'madina-2':[] } });
  pruefe('beide Bücher aktiv', JSON.stringify(ruf(ctx,'aktiveBuecher()')) === '["madina-1","madina-2"]');
  pruefe('Kapitel je Buch getrennt',
    JSON.stringify(ruf(ctx,'kapitelAuswahl("madina-1")')) === '[1,2]' &&
    JSON.stringify(ruf(ctx,'kapitelAuswahl("madina-2")')) === '[]');
  pruefe('irgendwoEingeengt erkennt die Einengung', ruf(ctx,'irgendwoEingeengt()') === true);
  pruefe('aktivesBuch() liefert weiter EINEN Namen', ruf(ctx,'aktivesBuch()') === 'madina-1');
  pruefe('nicht gewähltes Buch ist nicht dabei', ruf(ctx,'buchGewaehlt("bayna-yadayk-1")') === false);
}
{
  const ctx = baue({ buecher: {} });
  pruefe('leere Auswahl fällt nie ins Nichts',
    JSON.stringify(ruf(ctx,'aktiveBuecher()')) === '["madina-1"]');
  pruefe('ohne Kapitel keine Einengung', ruf(ctx,'irgendwoEingeengt()') === false);
}

/* ---------- 3. Der Filter — das eigentliche Verhalten ---------- */
console.log('\n3. passtZurAuswahl — welche Wörter durchkommen');
const woerter = [
  { id:'m1k1', book:'madina-1', chapter:1 },
  { id:'m1k3', book:'madina-1', chapter:3 },
  { id:'m1k9', book:'madina-1', chapter:9 },
  { id:'m2k1', book:'madina-2', chapter:1 },
  { id:'m2k4', book:'madina-2', chapter:4 },
  { id:'by1k2', book:'bayna-yadayk-1', chapter:2 },
  { id:'eig',  book:'personal', chapter:'personal' },
];
const durch = (ctx) => woerter.filter(w => ruf(ctx, 'passtZurAuswahl')(w)).map(w=>w.id);
{
  const ctx = baue({ buecher:{ 'madina-1':[] } }, woerter);
  pruefe('ein Buch, alle Kapitel: nur dieses Buch + Eigene',
    JSON.stringify(durch(ctx)) === '["m1k1","m1k3","m1k9","eig"]', JSON.stringify(durch(ctx)));
}
{
  const ctx = baue({ buecher:{ 'madina-1':[3] } }, woerter);
  pruefe('ein Buch, Kapitel 3: nur Kapitel 3',
    JSON.stringify(durch(ctx)) === '["m1k3"]', JSON.stringify(durch(ctx)));
}
{
  const ctx = baue({ buecher:{ 'madina-1':[3] }, eigeneGewaehlt:true }, woerter);
  pruefe('… mit Eigene-Schalter kommen die eigenen dazu',
    JSON.stringify(durch(ctx)) === '["m1k3","eig"]', JSON.stringify(durch(ctx)));
}
{
  /* ⭐ Elias' eigentlicher Fall: Madina 2 anfangen, Madina 1 behalten -
     aber von Madina 1 nur die neun gelernten Kapitel. */
  const ctx = baue({ buecher:{ 'madina-1':[1,3,9], 'madina-2':[] } }, woerter);
  pruefe('zwei Bücher, EIGENE Kapitelauswahl je Buch',
    JSON.stringify(durch(ctx)) === '["m1k1","m1k3","m1k9","m2k1","m2k4"]', JSON.stringify(durch(ctx)));
}
{
  const ctx = baue({ buecher:{ 'madina-1':[3], 'madina-2':[4] } }, woerter);
  pruefe('⭐ Kapitel 3 aus Buch 1 schaltet NICHT Kapitel 3 aus Buch 2 frei',
    JSON.stringify(durch(ctx)) === '["m1k3","m2k4"]', JSON.stringify(durch(ctx)));
}
{
  const ctx = baue({ buecher:{ 'madina-2':[] } }, woerter);
  pruefe('abgewähltes Buch verschwindet vollständig',
    JSON.stringify(durch(ctx)) === '["m2k1","m2k4","eig"]', JSON.stringify(durch(ctx)));
}
{
  const ctx = baue({}, woerter);      /* gar nichts gespeichert */
  pruefe('ohne Einstellung faellt der Filter auf Madina 1 zurück',
    JSON.stringify(durch(ctx)) === '["m1k1","m1k3","m1k9","eig"]', JSON.stringify(durch(ctx)));
}

/* ---------- 4. buchVokabeln ---------- */
console.log('\n4. buchVokabeln — der Vorrat, aus dem gezählt wird');
{
  const ctx = baue({ buecher:{ 'madina-1':[3], 'bayna-yadayk-1':[] } }, woerter);
  const ids = ruf(ctx,'buchVokabeln()').map(w=>w.id);
  pruefe('⚠️ enthält ALLE Kapitel der gewählten Bücher, nicht nur die gefilterten',
    JSON.stringify(ids) === '["m1k1","m1k3","m1k9","by1k2","eig"]', JSON.stringify(ids));
}

/* ---------- 5. Das letzte Buch lässt sich nicht abwählen ---------- */
console.log('\n5. Schutz gegen die leere Auswahl');
{
  const s = { buecher:{ 'madina-1':[] } };
  const ctx = baue(s, woerter);
  ruf(ctx,'schalteBuch')('madina-1');
  pruefe('letztes Buch bleibt stehen', JSON.stringify(Object.keys(s.buecher)) === '["madina-1"]', JSON.stringify(s.buecher));
}
{
  const s = { buecher:{ 'madina-1':[1,2], 'madina-2':[] } };
  const ctx = baue(s, woerter);
  ruf(ctx,'schalteBuch')('madina-2');
  pruefe('zweites Buch lässt sich abwählen',
    JSON.stringify(Object.keys(s.buecher)) === '["madina-1"]', JSON.stringify(s.buecher));
  pruefe('… und die Kapitel des anderen bleiben unangetastet',
    JSON.stringify(s.buecher['madina-1']) === '[1,2]', JSON.stringify(s.buecher));
}

/* ---------- 6. „Ein Buch fehlt" ist nicht „der Ordner fehlt" (09.09.2026) ----

   Beim Start laedt buecher.js alle gemerkten Buecher nacheinander. Bisher
   entschied allein das ERSTE darueber, ob die ganze Buchzeile verschwindet.
   Online stimmt das (data/ kommt als Ganzes oder gar nicht), offline nicht:
   der Cache haelt einzelne Dateien, und von den neun `data/vokabeln-*.js`
   steht genau eine in der ASSETS-Liste von sw.js. Ein Buch da, das naechste
   nicht, ist offline der Normalfall.

   Geprueft wird die Entscheidung, nicht die Anzeige — sie sitzt jetzt in der
   benannten Funktion `fehltDerGanzeOrdner()`. */
console.log('\n6. Der Schluss auf „der ganze Ordner fehlt"');
{
  const ctx = baue({ buecher:{ 'madina-1':[] } }, woerter);
  const fehlt = (menge, versucht) => {
    const set = ruf(ctx, 'BUCH_FEHLT');
    set.clear();
    menge.forEach(s => set.add(s));
    return ruf(ctx, 'fehltDerGanzeOrdner')(versucht);
  };
  const DREI = ['madina-1','madina-2','bayna-yadayk-1'];

  pruefe('kein Buch gescheitert → der Ordner ist da', fehlt([], DREI) === false);
  pruefe('NUR DAS ERSTE gescheitert → die anderen zwei bleiben',
    fehlt(['madina-1'], DREI) === false);
  pruefe('nur das mittlere gescheitert → ebenso',
    fehlt(['madina-2'], DREI) === false);
  pruefe('zwei von drei gescheitert → immer noch kein Ordnerausfall',
    fehlt(['madina-1','madina-2'], DREI) === false);
  pruefe('ALLE drei gescheitert → der Ordner fehlt',
    fehlt(DREI, DREI) === true);
  pruefe('ein einziges gemerktes Buch, und das fehlt → Ordner fehlt',
    fehlt(['madina-1'], ['madina-1']) === true);
  pruefe('nichts versucht → nichts zu schliessen',
    fehlt(['madina-1'], []) === false);
  pruefe('kein Array → nichts zu schliessen',
    fehlt(['madina-1'], null) === false);

  /* ⛔ Und der Aufrufer. Eine Reparatur ohne Aufrufer besteht jeden Test der
     Funktion und wirkt in der App nicht. [[werkzeug_ohne_aufrufer]]
     Gesucht wird im KOMMENTARFREIEN Text: der Kopfkommentar von buecher.js
     zitiert die alte Bedingung woertlich, um sie zu erklaeren — roh gesucht
     faende man die eigene Dokumentation. [[stichworttreffer_im_kommentar]]

     ⚠️ Das sind Aussagen ueber die APP und gehoeren deshalb hierher, nicht in
     den Stoertest: sonst meldet ein fehlender Aufrufer sich als „der
     Stoertest greift nicht" und der Exitcode liegt ueber die Ursache. */
  const roh = fs.readFileSync(new URL('./js/buecher.js', import.meta.url), 'utf8');
  const nurCode = ohneKommentareUndTexte(roh, { texte: false });
  pruefe('js/buecher.js ruft fehltDerGanzeOrdner(slugs) auf',
    nurCode.includes('fehltDerGanzeOrdner(slugs)'));
  pruefe('die alte Bedingung steht nirgends mehr im Code',
    !nurCode.includes('BUCH_FEHLT.has(slug)'));
}

/* ---------- ⛔ STOERTEST — nur Aussagen ueber DIESES WERKZEUG ----------

   ⛔ Hier steht bewusst keine Aussage ueber die App. Zweimal in dieser Nacht
   hat ein App-Befund im Stoertest dazu gefuehrt, dass eine kaputte Sperre sich
   als kaputter Pruefer meldete — der Exitcode log dann ueber die Ursache.
   [[stoertest_muss_wirkung_nachweisen]] */
let stoer = 0;
console.log('\n=== Stoertest ===');
{
  const sP = (was, ist, soll) => { if (ist !== soll){ stoer++; console.log('  ⛔  ' + was
    + ': ' + JSON.stringify(ist)); } else console.log('  ok   ' + was); };

  /* ⭐ Koennen die acht Faelle oben ueberhaupt scheitern? Beantwortet wird das
     nicht durch Nachdenken, sondern indem die ALTE Regel eingesetzt wird —
     `BUCH_FEHLT.has(versucht[0])`, also „das erste entscheidet". Mindestens
     einer der acht muss sie zurueckweisen. Tut das keiner, sind es acht
     gruene Behauptungen ohne Trennschaerfe.
     [[pruefwerkzeug_mit_eingebauter_antwort]] [[gruener_pruefer_beweist_nur_geprueftes]] */
  const alteRegel = (menge, versucht) =>
    Array.isArray(versucht) && versucht.length ? menge.includes(versucht[0]) : false;
  const DREI = ['madina-1','madina-2','bayna-yadayk-1'];
  const FAELLE = [
    { menge: [],                          versucht: DREI,          soll: false },
    { menge: ['madina-1'],                versucht: DREI,          soll: false },
    { menge: ['madina-2'],                versucht: DREI,          soll: false },
    { menge: ['madina-1','madina-2'],     versucht: DREI,          soll: false },
    { menge: DREI,                        versucht: DREI,          soll: true  },
    { menge: ['madina-1'],                versucht: ['madina-1'],  soll: true  },
    { menge: ['madina-1'],                versucht: [],            soll: false },
    { menge: ['madina-1'],                versucht: null,          soll: false },
  ];
  const abgewiesen = FAELLE.filter(f => alteRegel(f.menge, f.versucht) !== f.soll).length;
  sP('die Faelle weisen die alte Regel zurueck', abgewiesen > 0, true);
  sP('… und zwar nicht alle acht (sonst pruefen sie etwas anderes)',
    abgewiesen < FAELLE.length, true);

  /* Der Kommentarfilter, an einer eigenen Vorlage statt an der App: sonst
     haenge diese Aussage daran, dass mein Kommentar oben stehen bleibt. */
  const probe = '/* weg */ const a = 1;';
  const gefiltert = ohneKommentareUndTexte(probe, { texte: false });
  sP('der Filter entfernt Kommentartext', gefiltert.includes('weg'), false);
  sP('… laesst den Code stehen', gefiltert.includes('const a = 1;'), true);
  sP('… und behaelt die Laenge, damit Versaetze weiter passen',
    gefiltert.length === probe.length, true);
}

console.log(`\n${ok} bestanden, ${schlecht} gescheitert.`);
if (stoer){
  console.log('⛔ Der Stoertest greift nicht — die Faelle oben sagen nichts.');
  process.exitCode = 3;
} else process.exitCode = schlecht ? 1 : 0;
