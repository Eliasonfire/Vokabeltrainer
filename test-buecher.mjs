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

console.log(`\n${ok} bestanden, ${schlecht} gescheitert.`);
process.exitCode = schlecht ? 1 : 0;
