/* Pruefstand fuer Punkt 8: vorgeschlagene Eselsbruecken duerfen Elias' eigene
 * NIE ueberschreiben -- und nicht heimlich zu seinen werden.
 *
 * Laeuft die ECHTE js/lernen.js in einem vm gegen einen DOM-Stub.
 *
 * ⚠️ `let SESSION` in js/lernen.js ueberschattet die gleichnamige
 * vm-Kontexteigenschaft lautlos. Zuweisung nur ueber vm.runInContext.
 *
 *   node test-p8.mjs
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
    id, style:{}, dataset:{}, innerHTML:'', textContent:'', value:'', disabled:false,
    classList:{
      add:(...c)=>c.forEach(x=>klassen.add(x)),
      remove:(...c)=>c.forEach(x=>klassen.delete(x)),
      contains:c=>klassen.has(c),
      toggle:(c,an)=>{ const soll = an===undefined ? !klassen.has(c) : !!an;
                       soll ? klassen.add(c) : klassen.delete(c); return soll; }
    },
    addEventListener:()=>{}, removeEventListener:()=>{},
    querySelector:()=>null, querySelectorAll:()=>[], closest:()=>null,
    appendChild:()=>{}, remove:()=>{}, focus:()=>{},
    getBoundingClientRect:()=>({top:0,left:0,right:0,bottom:0,width:0,height:0}),
    scrollIntoView:()=>{}, setAttribute:()=>{}, getAttribute:()=>null,
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
const NOTIZEN = {};
const ctx = vm.createContext({
  document: document_,
  window:{ addEventListener:()=>{}, matchMedia:()=>({matches:false, addEventListener:()=>{}}) },
  history:{ state:null, pushState:()=>{}, replaceState:()=>{} },
  console, requestAnimationFrame:(f)=>f(),
  setTimeout, clearTimeout, setInterval, clearInterval,
  IntersectionObserver: class { observe(){} disconnect(){} unobserve(){} },
  LS:{ _d:{}, get(k,f){ return k in this._d ? this._d[k] : f; }, set(k,v){ this._d[k]=v; } },
  INTERVALS:{1:0,2:1,3:3,4:7,5:16}, PROGRESS:{}, SETTINGS:{},
  VOCAB_DATA:[], PERSONAL_VOCAB:[], GRAMMAR_RULES:[], SENTENCE_TAGS:{},
  QURAN_FREQ:{}, QURAN_WORT:{},
  /* Die Notizen liegen in vt_notes auf dem Geraet. Hier ein Stellvertreter,
     dessen Inhalt der Pruefstand direkt einsehen kann. */
  NOTES: NOTIZEN,
  getNote: (id) => (NOTIZEN[id] || '').trim(),
  setNote: (id, t) => { const s = String(t||'').trim(); if (s) NOTIZEN[id] = s; else delete NOTIZEN[id]; },
  saveNotes: ()=>{},
  escapeHtml:s=>String(s), saveProgress:()=>{}, touchStreak:()=>{}, todayStr:()=>'2026-08-10',
  showScreen:()=>{}, zeigeToast:()=>{}, toast:()=>{}, feiere:()=>{}, sprich:()=>{},
  cardDirection:()=>'ar-de', aktivesBuch:()=>'madina1', buchVokabeln:()=>[],
  renderQuranFreqBadge:()=>{}, zeichneStart:()=>{}, geheZurueck:()=>{},
  fetch:()=>Promise.reject(new Error('kein Netz im Pruefstand')),
});

try { vm.runInContext(fs.readFileSync('js/lernen.js','utf8'), ctx, { filename:'js/lernen.js' }); }
catch (e) { console.log('\n❌ js/lernen.js liess sich nicht laden:', e.message); process.exit(1); }

console.log('\n— Laeuft die neue Fassung? —');
const quelle = vm.runInContext('renderNotiz.toString()', ctx);
ok('renderNotiz kennt den Vorschlag', quelle.includes('ist-vorschlag'), 'Pruefwort "ist-vorschlag"');

const kasten = hole('cardNoteBox'), text = hole('cardNoteText'), punkt = hole('cardNoteDot');
const feld = hole('neText'), vKasten = hole('neVorschlag'), vText = hole('neVorschlagText');

const WORT = { id:'t1', ar:'صِفْرٌ', de:'Null (0)', mnemo:'MERKSATZ-AUS-DEN-DATEN' };
const setzeKarte = (w) => vm.runInContext(
  'SESSION = { words:[KARTE], idx:0, dirs:["ar-de"], fertig:false, serie:0 }',
  Object.assign(ctx, { KARTE: w }));

/* ---------- 1. Kein Eigenes, aber ein Vorschlag ---------- */
console.log('\n— Nur ein Vorschlag, nichts Eigenes —');
setzeKarte(WORT);
vm.runInContext('renderNotiz(SESSION.words[0])', ctx);
ok('der Vorschlag steht im Kasten', text.textContent === 'MERKSATZ-AUS-DEN-DATEN', `"${text.textContent}"`);
ok('der Kasten ist als Vorschlag markiert', kasten.classList.contains('ist-vorschlag'));
ok('er gilt NICHT als eigene Notiz', !kasten.classList.contains('hat-notiz'));
ok('der Punkt auf der Vorderseite bleibt aus', !punkt.classList.contains('hidden') === false,
   'ein Vorschlag ist kein "das weisst du schon"');

/* ---------- 2. Eigene Notiz schlaegt den Vorschlag ---------- */
console.log('\n— Eigene Notiz vorhanden —');
ctx.setNote('t1', 'MEINE EIGENE BRUECKE');
vm.runInContext('renderNotiz(SESSION.words[0])', ctx);
ok('die eigene Notiz steht da, nicht der Vorschlag',
   text.textContent === 'MEINE EIGENE BRUECKE', `"${text.textContent}"`);
ok('die Vorschlagsmarkierung ist weg', !kasten.classList.contains('ist-vorschlag'));
ok('sie gilt als eigene Notiz', kasten.classList.contains('hat-notiz'));
ok('der Punkt auf der Vorderseite geht an', !punkt.classList.contains('hidden'));

/* ---------- 3. Der Editor fuellt nie vor ---------- */
console.log('\n— Editor —');
ctx.setNote('t1', '');                       // wieder ohne Eigenes
vm.runInContext('oeffneNotizEditor()', ctx);
ok('das Eingabefeld bleibt LEER', feld.value === '', `"${feld.value}"`);
ok('der Vorschlag steht daneben sichtbar', !vKasten.classList.contains('hidden'));
ok('und traegt den Vorschlagstext', vText.textContent === 'MERKSATZ-AUS-DEN-DATEN');
ok('vt_notes ist unveraendert leer', Object.keys(NOTIZEN).length === 0,
   JSON.stringify(NOTIZEN));

ctx.setNote('t1', 'MEINE EIGENE BRUECKE');
vm.runInContext('oeffneNotizEditor()', ctx);
ok('mit eigener Notiz steht sie im Feld', feld.value === 'MEINE EIGENE BRUECKE');
ok('und der Vorschlag ist ausgeblendet', vKasten.classList.contains('hidden'));

/* ---------- 4. Wort ohne Vorschlag ---------- */
console.log('\n— Wort ganz ohne Vorschlag —');
ctx.setNote('t2', '');
setzeKarte({ id:'t2', ar:'بَيْتٌ', de:'Haus' });
vm.runInContext('renderNotiz(SESSION.words[0])', ctx);
ok('es bleibt bei der Aufforderung', text.textContent === 'Eselsbrücke hinzufügen', `"${text.textContent}"`);
ok('keine Vorschlagsmarkierung', !kasten.classList.contains('ist-vorschlag'));

/* ---------- 5. Die Daten selbst ---------- */
console.log('\n— vocab-data.js —');
const c2 = {}; vm.createContext(c2);
vm.runInContext(fs.readFileSync('vocab-data.js','utf8') + ';globalThis.__=VOCAB_DATA;', c2);
const V = c2.__;
const box12 = V.filter(w => w.box === 1 || w.box === 2);
const mit = V.filter(w => w.mnemo);
ok('14 Woerter starten in Box 1 oder 2', box12.length === 14, `${box12.length}`);
ok('alle davon haben eine Eselsbruecke',
   box12.every(w => w.mnemo && String(w.mnemo).trim()), `${box12.filter(w=>w.mnemo).length}/14`);
ok('kein Wort ausserhalb Box 1+2 hat eine',
   mit.every(w => w.box === 1 || w.box === 2), `${mit.length} insgesamt`);
ok('keine Eselsbruecke behauptet eine Wortherkunft',
   mit.every(w => !/kommt von|stammt von|abgeleitet von|verwandt mit/i.test(w.mnemo)));
ok('Klanghilfen sind als solche gekennzeichnet',
   mit.filter(w => /klingt/i.test(w.mnemo)).every(w => /Klanghilfe|Klang/i.test(w.mnemo)),
   `${mit.filter(w=>/klingt/i.test(w.mnemo)).length} Klanghilfen`);

console.log(`\n${geprueft - fehler}/${geprueft} Zusicherungen erfuellt.`);
process.exit(fehler ? 1 : 0);
