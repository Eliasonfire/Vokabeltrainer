/* Pruefstand fuer Punkt 1: Kopf einklappen beim Weiterlesen.
 *
 * Laeuft die ECHTE js/quran.js in einem vm gegen einen DOM-Stub. Der
 * Browser-Pane taugt dafuer nicht: er laedt bei Dateien ausserhalb des
 * Projektordners die verlinkten js/*.js nicht neu, auch nicht mit force -
 * man misst dann die alte Fassung und haelt sie fuer einen Befund.
 *
 * ⚠️ `const`/`let`/`function` aus der Datei liegen lexikalisch, NICHT am
 * Kontextobjekt. Zugriff nur ueber vm.runInContext('NAME', ctx).
 *
 *   node test-p1.mjs
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
  const zuhoerer = {};
  const el = {
    id, style:{}, dataset:{}, scrollTop:0, scrollHeight:0, clientHeight:0,
    innerHTML:'', textContent:'', value:'',
    _klassen: klassen, _zuhoerer: zuhoerer,
    classList:{
      add:(...c)=>c.forEach(x=>klassen.add(x)),
      remove:(...c)=>c.forEach(x=>klassen.delete(x)),
      contains:c=>klassen.has(c),
      toggle:(c,an)=>{ const soll = an===undefined ? !klassen.has(c) : !!an;
                       soll ? klassen.add(c) : klassen.delete(c); return soll; }
    },
    addEventListener:(typ,fn)=>{ (zuhoerer[typ] = zuhoerer[typ] || []).push(fn); },
    removeEventListener:()=>{},
    querySelector:()=>null, querySelectorAll:()=>[],
    closest:()=>null, appendChild:()=>{}, remove:()=>{}, focus:()=>{},
    getBoundingClientRect:()=>({top:0,left:0,right:0,bottom:0,width:0,height:0}),
    scrollIntoView:()=>{},
    scrollTo(o){ el.scrollTop = typeof o === 'number' ? o : (o && o.top) || 0; },
    setAttribute:()=>{}, getAttribute:()=>null, hasAttribute:()=>false,
  };
  return el;
}
const hole = id => { if (!ELEMENTE.has(id)) ELEMENTE.set(id, macheElement(id)); return ELEMENTE.get(id); };

const wurzel = macheElement('html');
wurzel.style.setProperty = (k,v)=>{ wurzel.style[k] = v; };
const document_ = {
  getElementById: hole,
  documentElement: wurzel,
  querySelector: ()=>null,
  querySelectorAll: ()=>[],
  createElement: ()=>macheElement('neu'),
  addEventListener: ()=>{},
  head: { appendChild: ()=>{} },
  body: macheElement('body'),
};

/* ---------- Aussenwelt, die quran.js voraussetzt ---------- */
const ctx = vm.createContext({
  document: document_,
  window: { addEventListener: ()=>{}, matchMedia: ()=>({matches:false, addEventListener:()=>{}}) },
  history: { state:null, pushState: ()=>{}, replaceState: ()=>{} },
  console,
  requestAnimationFrame: (f)=>f(),   /* sofort, damit der Test nicht warten muss */
  setTimeout, clearTimeout, setInterval, clearInterval,
  IntersectionObserver: class { observe(){} disconnect(){} unobserve(){} },
  LS: { _d:{}, get(k,f){ return k in this._d ? this._d[k] : f; }, set(k,v){ this._d[k]=v; } },
  SURAH_DATA: [
    { id:1,  name:'Al-Fatihah', ar:'الفاتحة', arTaschkil:'ٱلْفَاتِحَة', verses:7  },
    { id:67, name:'Al-Mulk',    ar:'الملك',   arTaschkil:'ٱلْمُلْك',    verses:30 },
  ],
  SETTINGS: {},
  escapeHtml: s => String(s),
  geheZurueck: ()=>{},
  showScreen: ()=>{},
  zeigeToast: ()=>{},
  feiere: ()=>{},
  QURAN_FREQ: {},
  fetch: ()=>Promise.reject(new Error('kein Netz im Pruefstand')),
});

/* ---------- Die echte Datei laufen lassen ---------- */
const quelle = fs.readFileSync('js/quran.js', 'utf8');
try {
  vm.runInContext(quelle, ctx, { filename: 'js/quran.js' });
} catch (e) {
  console.log('\n❌ js/quran.js liess sich nicht laden:', e.message);
  /* Die Fehlermeldung allein sagt nicht, WO es knallt. Die erste
     Stack-Zeile aus der geladenen Datei sagt es. */
  const __ort = String(e.stack || '').split('\n').find(z => z.includes('js/quran.js'));
  if (__ort) console.log('   Fundstelle:', __ort.trim());
  process.exit(1);
}

/* ---------- Beleg, dass die NEUE Fassung laeuft ---------- */
console.log('\n— Lauefer prueft sich selbst —');
const quellText = vm.runInContext('pruefeLeseRichtung', ctx).toString();
ok('pruefeLeseRichtung ist die neue Fassung', quellText.includes('KOPF_SCHWELLE'));
ok('Ueberroll-Schutz ist drin', quellText.includes('scrollHeight'));

/* ---------- Werkzeuge fuer den Test ---------- */
const screen = hole('screen-quranfull');
const main   = hole('main');
main.scrollHeight = 5000;
main.clientHeight = 800;          /* max = 4200 */
const eingeklappt = () => screen._klassen.has('kopf-eingeklappt');
const rolleAuf = y => { main.scrollTop = y; vm.runInContext('pruefeLeseRichtung()', ctx); };
const setzeSure = id => vm.runInContext(`OFFENE_SURE = ${id === null ? 'null' : id}`, ctx);

/* ---------- 1. In der Surenliste passiert nichts ---------- */
console.log('\n— In der Surenliste bleibt der Kopf stehen —');
setzeSure(null);
rolleAuf(1000);
ok('Liste, weit unten: NICHT eingeklappt', !eingeklappt());

/* ---------- 2. In der Sure: runter klappt ein ---------- */
console.log('\n— In der geoeffneten Sure —');
setzeSure(67);
vm.runInContext('kopfZuruecksetzen()', ctx);
rolleAuf(0);
ok('ganz oben: ausgeklappt', !eingeklappt());

rolleAuf(60);
ok('60 px (in der Ruhezone 64): noch ausgeklappt', !eingeklappt(), '(Ruhezone)');

rolleAuf(80);
ok('80 px, aber erst 16 px Weg seit dem Umschalten: noch offen', !eingeklappt(),
   '(unter der Schwelle 24)');

rolleAuf(200);
ok('200 px nach unten: EINGEKLAPPT', eingeklappt());

rolleAuf(400);
ok('weiter runter: bleibt eingeklappt', eingeklappt());

/* ---------- 3. Hoch klappt wieder aus ---------- */
console.log('\n— Hochrollen holt ihn zurueck —');
rolleAuf(390);
ok('10 px hoch: noch eingeklappt', eingeklappt(), '(unter der Schwelle)');

/* ⛔ HIER STAND „40 px hoch: wieder AUSGEKLAPPT" — und das war seit dem
   18.08.2026 falsch. Bis dahin galt in BEIDE Richtungen dieselbe Schwelle
   (24 px), dann hat Elias ausdruecklich etwas anderes gewuenscht:

     „ebenfalls möchte ich, dass wenn ich im quran hoch scrolle und diese
      leiste wieder erscheint, das es ein kleinen ticken länger dauert bis
      diese leiste erscheint."

   Seitdem: KOPF_SCHWELLE 24 px nach unten, KOPF_SCHWELLE_AUF 110 px nach
   oben. Bei 40 px Aufwaertsweg SOLL die Leiste also noch weg sein — genau
   das war sein Wunsch. Der Pruefstand hat drei Tage lang das Gegenteil
   verlangt, ohne dass es jemand sah: er hat keinen Aufrufer.

   ⭐ Jetzt wird die Schwelle von BEIDEN Seiten geprueft statt nur von
   einer. Eine Grenze, die man nur von unten anfaehrt, kann beliebig weit
   nach oben rutschen, ohne dass die Pruefung etwas merkt.
   [[pruefwerkzeug_laedt_mehr_als_die_app]] */
rolleAuf(360);
ok('40 px hoch: noch eingeklappt', eingeklappt(), '(Elias wollte 110 px statt 24)');

rolleAuf(280);
ok('120 px hoch: wieder AUSGEKLAPPT', !eingeklappt(), '(ueber KOPF_SCHWELLE_AUF)');

rolleAuf(600);
ok('wieder runter: erneut eingeklappt', eingeklappt());

/* ---------- 4. Ganz oben immer sichtbar ---------- */
console.log('\n— Die Ruhezone oben —');
rolleAuf(1500);
ok('weit unten: eingeklappt', eingeklappt());
rolleAuf(10);
ok('zurueck nach ganz oben: ausgeklappt', !eingeklappt(),
   '(sonst kaeme man nie wieder heran)');

/* ---------- 5. Gummiband am Rand ---------- */
console.log('\n— Ueberrollen ist keine Lesegeste —');
rolleAuf(3000);
ok('weit unten: eingeklappt', eingeklappt());
const vorher = eingeklappt();
main.scrollTop = 4600;                       /* ueber max 4200 hinaus */
vm.runInContext('pruefeLeseRichtung()', ctx);
ok('Ueberrollen nach unten aendert nichts', eingeklappt() === vorher);
main.scrollTop = -50;                        /* Gummiband nach oben */
vm.runInContext('pruefeLeseRichtung()', ctx);
ok('Ueberrollen nach oben aendert nichts', eingeklappt() === vorher);

/* ---------- 6. Sure wechseln setzt zurueck ---------- */
console.log('\n— Beim Wechseln wird zurueckgesetzt —');
/* Erst sauber zuruecksetzen und dann NACH UNTEN rollen. Hier stand vorher nur
   `rolleAuf(2000)` nach einem Stand von 3000 - das ist ein Weg nach OBEN, also
   klappte die Leiste richtigerweise aus und der Test schlug fehl. Der Fehler
   lag in der Erwartung, nicht im Code. */
vm.runInContext('kopfZuruecksetzen()', ctx);
rolleAuf(0);
rolleAuf(2000);
ok('eingeklappt vor dem Wechsel', eingeklappt());
vm.runInContext('kopfZuruecksetzen()', ctx);
ok('nach kopfZuruecksetzen: ausgeklappt', !eingeklappt());
ok('Weg ist zurueckgesetzt', vm.runInContext('KOPF_STAND', ctx) === 0);

/* ---------- 7. Der Zuhoerer haengt wirklich am Rollkasten ---------- */
console.log('\n— Verdrahtung —');
ok('#main hat einen scroll-Zuhoerer', Array.isArray(main._zuhoerer.scroll) && main._zuhoerer.scroll.length === 1,
   `(${(main._zuhoerer.scroll||[]).length} Stueck)`);
setzeSure(67);
vm.runInContext('kopfZuruecksetzen()', ctx);
main.scrollTop = 0; main._zuhoerer.scroll[0]();
main.scrollTop = 500; main._zuhoerer.scroll[0]();
ok('ein echtes scroll-Ereignis klappt ein', eingeklappt(), '(ueber den Zuhoerer, nicht direkt gerufen)');

/* ---------- Ergebnis ---------- */
console.log(`\n${fehler ? '❌' : '✅'} ${geprueft - fehler}/${geprueft} Zusicherungen halten.`);
process.exitCode = fehler ? 1 : 0;
