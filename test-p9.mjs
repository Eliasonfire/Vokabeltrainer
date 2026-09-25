/* Pruefstand fuer Punkt 9: auf jedem der vier Bewertungsknoepfe steht, in
 * welche Box die Vokabel wandert -- schon VOR dem Tippen.
 *
 * Laeuft die ECHTE js/lernen.js in einem vm gegen einen DOM-Stub. Der
 * Browser-Pane taugt dafuer nicht: er laedt bei Dateien ausserhalb des
 * Projektordners die verlinkten js/*.js nicht neu, auch nicht mit force.
 *
 * ⚠️ Am 10.08.2026 hat mich genau das einmal getaeuscht: die Gegenprobe
 * `stufenVorschau.toString().includes('${tage} Tage')` meldete "neue Fassung",
 * obwohl die alte lief -- der Text ist auch in `in ${tage} Tagen` enthalten.
 * Eine Gegenprobe muss ein Stueck nehmen, das in der ALTEN Fassung unmoeglich
 * vorkommt, nicht nur eines, das in der neuen vorkommt.
 *
 * ⚠️ `const`/`let`/`function` aus der Datei liegen lexikalisch, NICHT am
 * Kontextobjekt. Zugriff nur ueber vm.runInContext('NAME', ctx).
 *
 *   node test-p9.mjs
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
const AUSWAHL  = new Map();   /* querySelector-Treffer, siehe unten */
function macheElement(id){
  const klassen = new Set();
  const el = {
    id, style:{}, dataset:{}, scrollTop:0, scrollHeight:0, clientHeight:0,
    innerHTML:'', textContent:'', value:'', _klassen: klassen,
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
  return el;
}
const hole = id => { if (!ELEMENTE.has(id)) ELEMENTE.set(id, macheElement(id)); return ELEMENTE.get(id); };
const wurzel = macheElement('html');
wurzel.style.setProperty = (k,v)=>{ wurzel.style[k] = v; };
const document_ = {
  getElementById: hole, documentElement: wurzel,
  /* ⛔ Lieferte bis zum 21.08.2026 IMMER null. js/lernen.js holt sich seit
     Commit 5631d26 die Kartenrueckseite ueber
       document.querySelector('.flashcard-back')
     und haengt auf Modulebene einen Rollhinweis daran. Mit null als Antwort
     starb das ganze Modul beim Laden, und der Test meldete nur „liess sich
     nicht laden" ohne Fundstelle.
     Der Cache bedient NUR .klasse und #id — alles andere bleibt null, damit
     ein Stub nicht auf jede Frage etwas antwortet. */
  querySelector: (sel)=>{
    if (typeof sel !== 'string' || !/^[.#][A-Za-z][\w-]*$/.test(sel)) return null;
    if (!AUSWAHL.has(sel)) AUSWAHL.set(sel, macheElement(sel));
    return AUSWAHL.get(sel);
  },
  querySelectorAll: ()=>[],
  createElement: ()=>macheElement('neu'),
  addEventListener: ()=>{}, head:{ appendChild:()=>{} }, body: macheElement('body'),
};

/* ---------- Aussenwelt, die lernen.js voraussetzt ---------- */
const WORT = { id:'t1', ar:'كِتَابٌ', de:'Buch', chapter:'test', type:'noun' };
/* v603: INTERVALS und tageZwischen() aus dem ECHTEN js/kern.js, nicht getippt —
   seit Box 6 und 7 hängt die Knopfvorschau an stufeErgebnis(), und die rechnet
   mit beiden. [[testvorlage_selbst_nachgebaut]] */
const KERN = fs.readFileSync('js/kern.js', 'utf8');
const KERN_INTERVALS = eval('(' + (KERN.match(/const INTERVALS = (\{[^}]+\})/) || [])[1] + ')');
const KERN_TAGEZWISCHEN = (() => {
  const a = KERN.indexOf('function tageZwischen(');
  let i = KERN.indexOf('{', a), t = 0;
  for (; i < KERN.length; i++){ if (KERN[i] === '{') t++; else if (KERN[i] === '}' && !--t) break; }
  return vm.runInNewContext('(' + KERN.slice(a, i + 1) + ')', { Date, Math, String, isNaN });
})();
const ctx = vm.createContext({
  document: document_,
  window:{ addEventListener:()=>{}, matchMedia:()=>({matches:false, addEventListener:()=>{}}) },
  history:{ state:null, pushState:()=>{}, replaceState:()=>{} },
  console, requestAnimationFrame:(f)=>f(),
  setTimeout, clearTimeout, setInterval, clearInterval,
  IntersectionObserver: class { observe(){} disconnect(){} unobserve(){} },
  LS:{ _d:{}, get(k,f){ return k in this._d ? this._d[k] : f; }, set(k,v){ this._d[k]=v; } },
  /* Die Werte, die der Pruefstand wirklich braucht - alles andere ist Attrappe. */
  INTERVALS: KERN_INTERVALS, HOECHSTE_BOX: Math.max(...Object.keys(KERN_INTERVALS).map(Number)),
  tageZwischen: KERN_TAGEZWISCHEN,
  PROGRESS:{ t1:{ box:1, nextReview:'', correct:0, wrong:0 } },
  SESSION:{ words:[WORT], idx:0, dirs:['ar-de'], fertig:false, serie:0 },
  VOCAB_DATA:[WORT], PERSONAL_VOCAB:[], SETTINGS:{},
  escapeHtml:s=>String(s), saveProgress:()=>{}, touchStreak:()=>{},
  todayStr:()=>'2026-08-10', showScreen:()=>{}, zeigeToast:()=>{}, feiere:()=>{},
  cardDirection:()=>'ar-de', aktivesBuch:()=>'madina1', buchVokabeln:()=>[WORT],
  sprich:()=>{}, renderQuranFreqBadge:()=>{}, zeichneStart:()=>{}, geheZurueck:()=>{},
  GRAMMAR_RULES:[], SENTENCE_TAGS:{}, QURAN_FREQ:{}, QURAN_WORT:{},
  fetch:()=>Promise.reject(new Error('kein Netz im Pruefstand')),
});

const quelle = fs.readFileSync('js/lernen.js', 'utf8');
try { vm.runInContext(quelle, ctx, { filename:'js/lernen.js' }); }
catch (e) { console.log('\n❌ js/lernen.js liess sich nicht laden:', e.message);
  /* Die Fehlermeldung allein sagt nicht, WO es knallt. Die erste
     Stack-Zeile aus der geladenen Datei sagt es. */
  const __ort = String(e.stack || '').split('\n').find(z => z.includes('js/lernen.js'));
  if (__ort) console.log('   Fundstelle:', __ort.trim()); process.exit(1); }

/* ⚠️ SESSION MUSS hier drin gesetzt werden, nicht oben im Kontextobjekt.
   js/lernen.js Zeile 5 hat `let SESSION = { words:[], ... }` -- eine lexikalische
   Deklaration ueberschattet die gleichnamige Eigenschaft des Kontexts lautlos.
   Genau daran ist der erste Lauf dieses Pruefstands gescheitert: alle vier
   Knoepfe blieben leer, weil SESSION.words[0] undefined war und die Funktion
   still bei `if (!w) return` ausstieg. PROGRESS und INTERVALS sind davon NICHT
   betroffen -- die werden in js/kern.js deklariert, das hier gar nicht laeuft. */
vm.runInContext('SESSION = { words: [WORT_IM_TEST], idx:0, dirs:["ar-de"], fertig:false, serie:0 }',
                Object.assign(ctx, { WORT_IM_TEST: WORT }));

console.log('\n— Der Pruefstand steht richtig —');
ok('SESSION traegt die Testkarte (lexikalisch gesetzt, nicht am Kontext)',
   vm.runInContext('SESSION.words.length === 1 && SESSION.words[0].id === "t1"', ctx));

/* ---------- Beleg, dass die NEUE Fassung laeuft ---------- */
console.log('\n— Lauefer prueft sich selbst —');
const src = vm.runInContext('stufenVorschau', ctx).toString();
ok('stufenVorschau ist die neue Fassung', src.includes('Kurzform statt'),
   '(Stueck, das die alte Fassung nicht enthalten kann)');
/* v603: Box und Tage kommen aus stufeErgebnis() — derselben Rechnung wie in
   answer(). */
ok('beide Zeilen aus EINER Rechnung', src.includes('stufeErgebnis(k,')
   && src.includes('${e.box}') && src.includes('text(e.tage)'));
ok('answer() nimmt dieselbe Rechnung', vm.runInContext('answer', ctx).toString().includes('stufeErgebnis(stufe, p'));

/* ---------- Werkzeuge ---------- */
const KNOEPFE = ['Nochmal','Schwer','Gut','Leicht'];
const lies = () => KNOEPFE.map(n=>{
  const h = hole('stufe'+n).innerHTML;
  const m = h.match(/^<b>Box (\d)<\/b><i>(.+)<\/i>$/);
  return m ? { box:+m[1], text:m[2] } : { roh:h };
});
const ausBox = b => {
  vm.runInContext(`PROGRESS.t1.box = ${b}`, ctx);
  vm.runInContext('stufenVorschau()', ctx);
  return lies();
};

/* ---------- 1. Die Box kommt aus der echten Leitner-Logik ---------- */
console.log('\n— Die Zahl kommt aus STUFEN, nicht aus einer festen Liste —');
/* ⛔ DIESE TABELLE WAR SEIT DEM 16.08.2026 VERALTET und hat den Pruefstand
   vier Zusicherungen lang rot gemeldet, obwohl die App richtig lief.

   Sie hielt die Fassung von VOR Commit 559cd0a fest:
     nochmal: immer 1        schwer: max(1, b-1)

   Elias hat das an diesem Tag ausdruecklich anders gewuenscht:

     „nochmal sollte die selbe funktion haben wie schwer, also dass man
      einfach nur eine einzige box weiter runter geht. und schwer sollte die
      funktion haben, dass man in der selben box bleibt."

   Daraus, und NICHT aus den gemessenen Werten abgeschrieben:
     nochmal: max(1, b-1)    schwer: b
     gut:     min(5, b+1)    leicht: min(5, b+2)      (beide unveraendert)

   ⚠️ Der Unterschied ist wichtig. Eine Erwartung, die man aus dem Istzustand
   abschreibt, kann nie wieder etwas finden — sie sagt nur noch „die App tut,
   was die App tut". Diese hier ist aus seiner Anweisung abgeleitet und wuerde
   wieder anschlagen, wenn jemand die Stufen erneut verschiebt.
   [[zitierform_ist_nicht_satzkontext]]

   ⭐ Warum der Fehler ueberhaupt vier Tage ueberleben konnte: dieser
   Pruefstand hat keinen Aufrufer und lief nie. */
/* v603 (25.09.2026): sieben Boxen; gut +1 und leicht +2, beide bei 7 gekappt.
   Elias: „ja aber der knopf ,,leicht" soll nicht alles direkt in box 7 packen
   sondern nur 2 boxen höher, das ist ein kleiner aber feiner unterschied". */
const erwartet = {
  1: [1,1,2,3],
  2: [1,2,3,4],
  3: [2,3,4,5],
  4: [3,4,5,6],
  5: [4,5,6,7],
  6: [5,6,7,7],
  7: [6,7,7,7],
};
const ALLE_BOXEN = [1,2,3,4,5,6,7];
for (const b of ALLE_BOXEN){
  const g = ausBox(b).map(x=>x.box);
  ok(`aus Box ${b} → ${erwartet[b].join('/')}`,
     JSON.stringify(g) === JSON.stringify(erwartet[b]), `gemessen ${g.join('/')}`);
}

/* ---------- 2. Kein Knopf bleibt leer ---------- */
console.log('\n— Alle vier Knoepfe, nicht nur der positive —');
const vier = ausBox(2);
ok('alle vier tragen eine Box', vier.every(x=>x.box >= 1 && x.box <= 7));
ok('alle vier tragen ein Intervall', vier.every(x=>x.text && x.text.length));

/* ---------- 3. Intervall und Box koennen nicht auseinanderlaufen ---------- */
console.log('\n— Das Intervall gehoert zur angezeigten Box —');
const worte = {1:'heute', 2:'morgen', 3:'3 Tage', 4:'7 Tage', 5:'16 Tage', 6:'30 Tage', 7:'60 Tage'};
let stimmig = true, abweichung = '';
for (const b of ALLE_BOXEN) for (const x of ausBox(b))
  if (x.text !== worte[x.box]){ stimmig = false; abweichung = `Box ${x.box} zeigte "${x.text}"`; }
ok('jedes Intervall passt zu seiner Box', stimmig, abweichung);

/* ---------- 4. Die Kurzform passt in den Knopf ----------
   Gemessen am 10.08.2026 im Browser bei 375 px: der Innenraum der Zeile ist
   60 px. "in 16 Tagen" braucht 64 px und wird abgeschnitten, "16 Tage" 44 px. */
console.log('\n— Kurzform, weil "in 16 Tagen" bei 375 px abgeschnitten wird —');
const langformDa = ALLE_BOXEN.some(b => ausBox(b).some(x => /^in \d+ Tagen$/.test(x.text)));
ok('keine Langform "in N Tagen" mehr', !langformDa);
ok('laengster Text so lang wie "60 Tage"',
   Math.max(...ALLE_BOXEN.flatMap(b=>ausBox(b).map(x=>x.text.length))) === '60 Tage'.length);

/* ---------- 5. Ohne Fortschrittseintrag: Box 1 statt alter Zahlen ---------- */
console.log('\n— Fehlt der Fortschritt, gilt Box 1 (wie im Rest der App) —');
ausBox(5);                                   /* erst hohe Zahlen anzeigen ... */
vm.runInContext('delete PROGRESS.t1; stufenVorschau()', ctx);
const ohne = lies();
ok('nicht die Zahlen der vorigen Karte stehengeblieben',
   JSON.stringify(ohne.map(x=>x.box)) === JSON.stringify(erwartet[1]),
   `gemessen ${ohne.map(x=>x.box).join('/')}`);
vm.runInContext('PROGRESS.t1 = { box:1, nextReview:"", correct:0, wrong:0 }', ctx);

/* ---------- 5b. v603: vorgezogene Karten ----------
   Eine noch nicht fällige Karte springt auf einen freien Platz ein. Box 4–7:
   richtig → Box UND Termin bleiben (mein Vorschlag, ihm gesagt 25.09.2026,
   auf sein „wenn das der fall sein sollte dann einfach box 4-7"). Box 2/3:
   wie immer (sein „so kann man die auch weiter hoch bringen"). */
console.log('\n— Vorgezogene Karten (v603) —');
vm.runInContext('PROGRESS.t1 = { box:5, nextReview:"2026-08-15", correct:3, wrong:0 }; stufenVorschau()', ctx);
const fr5 = lies();
ok('Box 5 vorgezogen: gut/leicht bleiben in Box 5, noch 5 Tage',
   fr5[2].box === 5 && fr5[3].box === 5 && fr5[2].text === '5 Tage' && fr5[3].text === '5 Tage',
   JSON.stringify(fr5));
ok('Box 5 vorgezogen: nochmal → Box 4 (7 Tage), schwer bleibt (16 Tage)',
   fr5[0].box === 4 && fr5[0].text === '7 Tage' && fr5[1].box === 5 && fr5[1].text === '16 Tage',
   JSON.stringify(fr5));
vm.runInContext('PROGRESS.t1 = { box:2, nextReview:"2026-08-11", correct:1, wrong:0 }; stufenVorschau()', ctx);
const fr2 = lies();
ok('Box 2 vorgezogen: gut → Box 3 wie immer', fr2[2].box === 3 && fr2[2].text === '3 Tage', JSON.stringify(fr2));
vm.runInContext('PROGRESS.t1 = { box:1, nextReview:"", correct:0, wrong:0 }', ctx);

/* ---------- 5c. Die Wischgeste (25.09.2026) ----------
   Elias: „ich möchte auch, dass bei den karteikarten das nach links wischen
   bedetuet das es schwierig ist also bleibt auf der selben box. und rechts
   wischen bedeutet gut also geht eine box hoch." */
console.log('\n— Wischen: links = schwer, rechts = gut —');
ok('setupSwipe gibt links „schwer" und rechts „gut" an answer()',
   quelle.includes("answer(goingRight ? 'gut' : 'schwer')") && !/answer\(goingRight\)/.test(quelle));

/* ---------- 6. Ohne Karte wird gar nichts angefasst ---------- */
console.log('\n— Ohne Karte passiert nichts —');
vm.runInContext('stufenVorschau()', ctx);    /* Ausgangslage merken */
const vorher = hole('stufeGut').innerHTML;
vm.runInContext('SESSION.words = []; stufenVorschau()', ctx);
ok('leere Runde wirft nicht und laesst die Anzeige stehen', hole('stufeGut').innerHTML === vorher);

console.log(`\n${fehler ? '❌' : '✅'} ${geprueft - fehler}/${geprueft} Zusicherungen erfuellt.`);
process.exit(fehler ? 1 : 0);
