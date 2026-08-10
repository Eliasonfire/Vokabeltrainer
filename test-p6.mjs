/* Pruefstand fuer Punkt 6: zweite Ansicht im Quran-Leser (Listenmodus) mit
 * Versschlusszeichen und Seitentrennung wie im Muṣḥaf.
 *
 * Laeuft die ECHTE js/quran.js in einem vm gegen einen DOM-Stub. Der
 * Browser-Pane taugt dafuer nicht: er laedt bei Dateien ausserhalb des
 * Projektordners die verlinkten js/*.js nicht neu, auch nicht mit force.
 *
 * ⚠️ `const`/`let`/`function` aus der Datei liegen lexikalisch, NICHT am
 * Kontextobjekt. Zugriff und Zuweisung nur ueber vm.runInContext('NAME', ctx).
 *
 *   node test-p6.mjs
 */
import fs from 'fs';
import vm from 'vm';

let fehler = 0, geprueft = 0;
const ok = (was, bedingung, zusatz='') => {
  geprueft++;
  if (bedingung) console.log(`  ✅ ${was}${zusatz ? '  ' + zusatz : ''}`);
  else { fehler++; console.log(`  ❌ ${was}${zusatz ? '  ' + zusatz : ''}`); }
};

/* ---------- DOM-Stub ---------- */
const ELEMENTE = new Map();
function macheElement(id){
  const klassen = new Set();
  return {
    id, style:{}, dataset:{}, scrollTop:0, scrollHeight:0, clientHeight:0, scrollWidth:0,
    innerHTML:'', textContent:'', value:'', disabled:false, _klassen: klassen,
    classList:{
      add:(...c)=>c.forEach(x=>klassen.add(x)),
      remove:(...c)=>c.forEach(x=>klassen.delete(x)),
      contains:c=>klassen.has(c),
      toggle:(c,an)=>{ const soll = an===undefined ? !klassen.has(c) : !!an;
                       soll ? klassen.add(c) : klassen.delete(c); return soll; }
    },
    addEventListener:()=>{}, removeEventListener:()=>{},
    querySelector:()=>null, querySelectorAll:()=>[],
    closest:()=>null, appendChild:()=>{}, remove:()=>{}, focus:()=>{},
    getBoundingClientRect:()=>({top:0,left:0,right:0,bottom:0,width:0,height:0}),
    scrollIntoView:()=>{}, scrollTo(){},
    setAttribute:()=>{}, getAttribute:()=>null, hasAttribute:()=>false,
  };
}
const hole = id => { if (!ELEMENTE.has(id)) ELEMENTE.set(id, macheElement(id)); return ELEMENTE.get(id); };
const wurzel = macheElement('html');
wurzel.style.setProperty = (k,v)=>{ wurzel.style[k] = v; };
const document_ = {
  getElementById: hole, documentElement: wurzel,
  querySelector: ()=>null, querySelectorAll: ()=>[],
  createElement: ()=>macheElement('neu'),
  addEventListener: ()=>{}, head:{ appendChild:()=>{} }, body: macheElement('body'),
};

/* ---------- Aussenwelt ---------- */
const laden = (datei, name) =>
  new Function(fs.readFileSync(datei,'utf8') + `;return ${name};`)();
const SURAH_DATA   = laden('surah-data.js', 'SURAH_DATA');
const QURAN_SEITEN = laden('quran-seiten.js', 'QURAN_SEITEN');

const ctx = vm.createContext({
  document: document_,
  window:{ addEventListener:()=>{}, matchMedia:()=>({matches:false, addEventListener:()=>{}}) },
  history:{ state:null, pushState:()=>{}, replaceState:()=>{} },
  console, requestAnimationFrame:(f)=>f(), navigator:{ onLine:true },
  setTimeout, clearTimeout, setInterval, clearInterval,
  IntersectionObserver: class { observe(){} disconnect(){} unobserve(){} },
  LS:{ _d:{}, get(k,f){ return k in this._d ? this._d[k] : f; }, set(k,v){ this._d[k]=v; } },
  SURAH_DATA, QURAN_SEITEN,
  QURAN_TEXT:{}, QURAN_FREQ:{}, QURAN_WORT:{},
  SETTINGS:{}, PROGRESS:{}, VOCAB_DATA:[], PERSONAL_VOCAB:[],
  escapeHtml:s=>String(s), saveSettings:()=>{}, zeigeToast:()=>{}, showScreen:()=>{},
  icon:()=>'<svg></svg>', todayStr:()=>'2026-08-10', feiere:()=>{}, sprich:()=>{},
  geheZurueck:()=>{}, merkeZustand:()=>{}, ohneSprung:(f)=>f(),
  fetch:()=>Promise.reject(new Error('kein Netz im Pruefstand')),
});

/* Den Klick-Zuhoerer von #verseList abfangen, damit er im Pruefstand wirklich
   AUFGERUFEN werden kann. Der DOM-Stub verschluckt addEventListener sonst, und
   dann liesse sich nur die Quelltextform pruefen, nicht das Verhalten.
   Muss VOR dem Laden von quran.js stehen. */
const VERSLISTE = hole('verseList');
const KLICK_ZUHOERER = [];
VERSLISTE.addEventListener = (typ, fn) => { if (typ === 'click') KLICK_ZUHOERER.push(fn); };

try { vm.runInContext(fs.readFileSync('js/quran.js','utf8'), ctx, { filename:'js/quran.js' }); }
catch (e) { console.log('\n❌ js/quran.js liess sich nicht laden:', e.message); process.exit(1); }

/* ---------- Beleg, dass die NEUE Fassung laeuft ----------
   Ein Pruefwort, das es in der alten Fassung UNMOEGLICH geben kann - nicht
   nur eines, das in der neuen vorkommt. Genau daran ist am 10.08.2026 eine
   Gegenprobe falsch positiv geworden. */
console.log('\n— Laeuft die neue Fassung? —');
const quelle = vm.runInContext('renderVerses.toString()', ctx);
ok('renderVerses kennt die Seitentrennung',
   quelle.includes('seiten-ende'), 'Pruefwort "seiten-ende"');
ok('renderVerses setzt das Versschlusszeichen',
   quelle.includes('ayahSchlussHtml'), 'Pruefwort "ayahSchlussHtml"');

/* ---------- seiteVon() gegen bekannte Grenzen ---------- */
console.log('\n— Seitengrenzen —');
const seite = (s,a) => vm.runInContext(`seiteVon(${s},${a})`, ctx);
ok('604 Seitenpaare geladen', QURAN_SEITEN.length === 604, `${QURAN_SEITEN.length}`);
ok('1:1 liegt auf Seite 1',      seite(1,1)   === 1,   `= ${seite(1,1)}`);
ok('2:1 liegt auf Seite 2',      seite(2,1)   === 2,   `= ${seite(2,1)}`);
ok('2:5 liegt noch auf Seite 2', seite(2,5)   === 2,   `= ${seite(2,5)}`);
ok('2:6 liegt auf Seite 3',      seite(2,6)   === 3,   `= ${seite(2,6)}`);
ok('112:1 liegt auf Seite 604',  seite(112,1) === 604, `= ${seite(112,1)}`);
ok('114:6 liegt auf Seite 604',  seite(114,6) === 604, `= ${seite(114,6)}`);
/* Jede Seite muss von der vorigen erreichbar sein: die Nummern duerfen nie
   zurueckspringen, wenn man den Text vorwaerts liest. */
let monoton = true, letzte = 0;
for (const [s,a] of QURAN_SEITEN){ const p = seite(s,a); if (p < letzte) monoton = false; letzte = p; }
ok('Seitennummern steigen ueber den ganzen Text monoton', monoton);

/* ---------- renderVerses: Sure 2, Verse 1..10 ---------- */
console.log('\n— Aufbau der Verse —');
const verseListe = hole('verseList');
const verse = Array.from({length:10}, (_,i) => ({
  verse_key:`2:${i+1}`, text_uthmani:`TEXT${i+1}`,
  translations:[{ text:`Uebersetzung ${i+1}` }]
}));
vm.runInContext('VERSE_CACHE[2] = VERSE_TEST', Object.assign(ctx, { VERSE_TEST: verse }));
vm.runInContext('AYAH_ZEICHEN = false', ctx);      // Ersatzkreis erzwingen
vm.runInContext('renderVerses(2)', ctx);
const html = verseListe.innerHTML;

const zaehle = (muster) => (html.match(muster) || []).length;
ok('10 Verskaesten gebaut', zaehle(/class="verse-item/g) === 10, `${zaehle(/class="verse-item/g)}`);
ok('je Vers genau ein Versschlusszeichen',
   zaehle(/class="ayah-schluss/g) === 10, `${zaehle(/class="ayah-schluss/g)}`);
ok('genau EINE Seitentrennung in 2:1–2:10',
   zaehle(/class="seiten-ende"/g) === 1, `${zaehle(/class="seiten-ende"/g)}`);
ok('sie traegt die Nummer der beendeten Seite (2)',
   /class="seiten-ende"[^>]*>Seite 2</.test(html));
/* Sie muss NACH Vers 5 stehen und VOR Vers 6 - genau dort liegt die Grenze. */
const posTrenner = html.indexOf('seiten-ende');
const pos5 = html.indexOf('data-versnr="5"'), pos6 = html.indexOf('data-versnr="6"');
ok('sie steht zwischen Vers 5 und Vers 6', pos5 < posTrenner && posTrenner < pos6,
   `v5@${pos5} < trenner@${posTrenner} < v6@${pos6}`);
ok('Ersatzkreis, weil die Schrift im Pruefstand nichts kann',
   zaehle(/ayah-schluss ersatz/g) === 10);
ok('Versnummer steht im Ersatzkreis', /ayah-schluss ersatz[^>]*>7</.test(html));

/* ---------- dasselbe mit echtem ۝ ---------- */
vm.runInContext('AYAH_ZEICHEN = true', ctx);
vm.runInContext('renderVerses(2)', ctx);
const html2 = verseListe.innerHTML;
ok('mit ۝ kein Ersatzkreis mehr', !/ayah-schluss ersatz/.test(html2));
ok('۝ mit arabischen Ziffern (Vers 10 = ١٠)', html2.includes('۝١٠'),
   'U+06DD + U+0661 U+0660');

/* ---------- letzter Vers einer Sure bekommt KEINE Seitentrennung ---------- */
console.log('\n— Sonderfaelle —');
const kurz = Array.from({length:4}, (_,i) => ({
  verse_key:`112:${i+1}`, text_uthmani:`T${i+1}`, translations:[{text:'x'}]
}));
vm.runInContext('VERSE_CACHE[112] = VERSE_KURZ', Object.assign(ctx, { VERSE_KURZ: kurz }));
vm.runInContext('renderVerses(112)', ctx);
ok('Sure 112 endet ohne Seitentrennung',
   !verseListe.innerHTML.includes('seiten-ende'));

/* ---------- Umschalten ist reines CSS ---------- */
console.log('\n— Umschalten —');
ctx.SETTINGS.quranDarstellung = 'liste';
vm.runInContext('wendeQuranAnsichtAn()', ctx);
ok('Listenmodus setzt die Klasse .liste', verseListe.classList.contains('liste'));
ok('Deutsch-Zeile im Ansicht-Kasten verschwindet',
   hole('qaZeileDe').classList.contains('hidden'));
ok('Hinweis zur Uebersetzung wird sichtbar',
   !hole('qaHinweisListe').classList.contains('hidden'));
const htmlVorher = verseListe.innerHTML;
ctx.SETTINGS.quranDarstellung = 'kaesten';
vm.runInContext('wendeQuranAnsichtAn()', ctx);
ok('Kaesten-Ansicht nimmt die Klasse wieder weg', !verseListe.classList.contains('liste'));
ok('Hinweis verschwindet wieder', hole('qaHinweisListe').classList.contains('hidden'));
ok('das Umschalten baut die Verse NICHT neu (gleiches Markup)',
   verseListe.innerHTML === htmlVorher);

/* ---------- Vorgabe ---------- */
console.log('\n— Vorgabe —');
ctx.SETTINGS = {};
ok('ohne Einstellung gilt die bisherige Ansicht',
   vm.runInContext('quranAnsicht().darstellung', ctx) === 'kaesten');

/* ---------- Elias' drei Meldungen vom 10.08.2026 vormittags ---------- */
console.log('\n— Die Stelle geht nicht mehr verloren —');
/* 1. Die Ausrichtung liegt am BLOCK, nicht an den Versen. */
const css = fs.readFileSync('index.html', 'utf8');
const block = css.slice(css.indexOf('#verseList.liste{'), css.indexOf('#verseList.liste .verse-item'));
ok('der Listenmodus schaltet die Flexbox ab', /display:\s*block/.test(block), block.trim().split('\n')[0]);
ok('Laufrichtung steht am Block', /direction:\s*rtl/.test(block));
ok('und die Ausrichtung ebenfalls', /text-align:\s*center/.test(block));

/* 2. Umschalten merkt sich die Ayah, nicht den Rollstand. */
const umschalter = vm.runInContext(
  "document.getElementById.toString && (function(){return null})()", ctx);
const quelleQ = fs.readFileSync('js/quran.js', 'utf8');
ok('der Darstellungswechsel laeuft ueber ohneStellenverlust',
   /qurandarstellung[\s\S]{0,600}ohneStellenverlust\(wendeQuranAnsichtAn\)/.test(quelleQ));
ok('gemerkt wird die AYAH, nicht der Rollstand',
   /function sichtbarerVers\(\)[\s\S]{0,300}Math\.min\(\.\.\.LESE_SICHTBAR\)/.test(quelleQ));

/* 3. Rueckkehr aus der Historie springt nicht mehr an den Anfang. */
ok('openSurah unterscheidet Rueckkehr von Neuoeffnen',
   /opt\.ausHistorie && LESESTAND && LESESTAND\.sure === id/.test(quelleQ));
ok('nur ohne Rueckkehrziel wird an den Anfang gesprungen',
   (quelleQ.match(/if \(!zurueckZu \|\| !zeigeVers\(zurueckZu\)\) anDenAnfang\(\);/g) || []).length === 2,
   'beide Ladewege (Cache und Nachladen)');
ok('die Kopfhoehe wird gemessen, nicht geraten',
   /quran-sticky[\s\S]{0,200}getBoundingClientRect\(\)\.height/.test(quelleQ));

/* sichtbarerVers() gegen echte Zustaende */
vm.runInContext('LESE_SICHTBAR = new Set([7,9,12]); OFFENE_SURE = 2; LESESTAND = null;', ctx);
ok('sichtbarerVers nimmt den OBERSTEN sichtbaren Vers',
   vm.runInContext('sichtbarerVers()', ctx) === 7, `= ${vm.runInContext('sichtbarerVers()', ctx)}`);
vm.runInContext('LESE_SICHTBAR = new Set(); LESESTAND = { sure:2, vers:23 };', ctx);
ok('ohne sichtbare Verse gilt der gespeicherte Lesestand',
   vm.runInContext('sichtbarerVers()', ctx) === 23);
vm.runInContext('LESESTAND = { sure:114, vers:3 };', ctx);
ok('ein Lesestand aus einer ANDEREN Sure zaehlt nicht',
   vm.runInContext('sichtbarerVers()', ctx) === null);

/* ---------- Verdecken: zweiter Tipp verdeckt wieder (10.08.2026) ---------- */
console.log('\n— Verdeckte Ayah an- und wieder zutippen —');

function klassen(anfang){
  const s = new Set(anfang);
  return { add:(...c)=>c.forEach(x=>s.add(x)), remove:(...c)=>c.forEach(x=>s.delete(x)),
           contains:c=>s.has(c), toggle:(c,an)=>{ const soll = an===undefined?!s.has(c):!!an;
             soll ? s.add(c) : s.delete(c); return soll; } };
}
/* Ein Vers, wie ihn der Zuhoerer sieht: Kaestchen + Textelement. */
function tippe({ auswendig, verdeckt }){
  const karte = { classList: klassen(auswendig ? ['verse-item','auswendig'] : ['verse-item']) };
  const text  = { classList: klassen(verdeckt ? ['verse-ar','verdeckt'] : ['verse-ar']),
                  closest: sel => sel === '.verse-item' ? karte : null };
  const ev = { target: { closest: sel => sel === '.verse-ar' ? text : null } };
  KLICK_ZUHOERER.forEach(fn => fn(ev));
  return text.classList.contains('verdeckt');
}

ok('der Klick-Zuhoerer wurde abgefangen', KLICK_ZUHOERER.length >= 1,
   `${KLICK_ZUHOERER.length} Zuhoerer`);

vm.runInContext('HIFZ_VERDECKT = true;', ctx);
ok('verdeckt + angetippt → sichtbar', tippe({ auswendig:true, verdeckt:true }) === false);
ok('sichtbar + auswendig + angetippt → wieder verdeckt',
   tippe({ auswendig:true, verdeckt:false }) === true);
ok('ein NICHT auswendiger Vers laesst sich nicht verdecken',
   tippe({ auswendig:false, verdeckt:false }) === false);

vm.runInContext('HIFZ_VERDECKT = false;', ctx);
ok('ohne Verdecken-Modus verdeckt ein Tipp nichts',
   tippe({ auswendig:true, verdeckt:false }) === false);
ok('ein noch verdeckter Vers laesst sich trotzdem immer aufdecken',
   tippe({ auswendig:true, verdeckt:true }) === false,
   'sonst bliebe er nach dem Ausschalten des Modus unlesbar');

console.log(`\n${geprueft - fehler}/${geprueft} Zusicherungen erfuellt.`);
process.exit(fehler ? 1 : 0);
