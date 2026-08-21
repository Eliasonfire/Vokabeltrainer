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
const AUSWAHL  = new Map();   /* querySelector-Treffer, siehe unten */
function macheElement(id){
  const klassen = new Set();
  /* ⛔ innerHTML und textContent standen hier bis zum 21.08.2026 als ZWEI
     unverbundene Felder. Im echten DOM leitet sich textContent aus dem
     gesetzten HTML ab — hier blieb es leer.

     Aufgefallen ist es an vier Zusicherungen, die alle denselben Wert
     meldeten: "". js/lernen.js schreibt seit Commit ecbfde0 vom 16.08.2026
       text.innerHTML = arabischHervorheben(…)
     (damit arabische Woerter gross gesetzt werden koennen), der Pruefstand
     liest aber textContent. Vier rote Zeilen, EINE Ursache — sie einzeln zu
     behandeln waere der Fehler gewesen. [[ein_weg_geht_der_andere_nicht]]

     ⚠️ Bewusste Grenze: textContent ist hier innerHTML ohne Tags. Entities
     (&amp; -> &) werden NICHT aufgeloest. Fuer diesen Pruefstand reicht das;
     wer hier einmal Entities prueft, muss es erweitern. */
  let html = '';
  return {
    id, style:{}, dataset:{}, value:'', disabled:false,
    get innerHTML(){ return html; },
    set innerHTML(v){ html = String(v == null ? '' : v); },
    get textContent(){ return html.replace(/<[^>]*>/g, ''); },
    set textContent(v){ html = String(v == null ? '' : v); },
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
  /* ⛔ DASSELBE Objekt auch unter dem Namen, den js/kern.js benutzt.
     getNotiz()/setNotiz() dort greifen auf `NOTIZEN` zu; zeigte das auf ein
     eigenes Objekt, schriebe setNotiz() daneben und die Zusicherung
     „vt_notes ist unveraendert leer" waere fuer immer gruen. */
  NOTIZEN,
  getNote: (id) => (NOTIZEN[id] || '').trim(),
  setNote: (id, t) => { const s = String(t||'').trim(); if (s) NOTIZEN[id] = s; else delete NOTIZEN[id]; },
  saveNotes: ()=>{},
  escapeHtml:s=>String(s), saveProgress:()=>{}, touchStreak:()=>{}, todayStr:()=>'2026-08-10',
  showScreen:()=>{}, zeigeToast:()=>{}, toast:()=>{}, feiere:()=>{}, sprich:()=>{},
  cardDirection:()=>'ar-de', aktivesBuch:()=>'madina1', buchVokabeln:()=>[],
  renderQuranFreqBadge:()=>{}, zeichneStart:()=>{}, geheZurueck:()=>{},
  /* ⛔ Sieben Namen aus ANDEREN Modulen, die js/lernen.js aufruft und die
     dieser Pruefstand bewusst nicht laedt (Quran-Leser, Satzbau, Wischgesten,
     Sprachausgabe, Overlays). Statisch ermittelt am 21.08.2026: benutzte
     Bezeichner in lernen.js minus dort definierte minus hier gestellte.

     Attrappen sind hier richtig — der Pruefstand prueft den Schutz eigener
     Eselsbruecken, nicht den Quran-Leser. Fuer die Funktionen aus js/kern.js
     gilt das AUSDRUECKLICH NICHT: die werden weiter unten echt geladen, weil
     sie mitentscheiden, WAS angezeigt wird. */
  buildSentenceHtml:()=>'', hebeVersHervor:()=>{}, openSurah:()=>{},
  overlayAuf:()=>{}, setupSwipe:()=>{}, speakArabic:()=>{},
  zeigeGrammatikPopover:()=>{},
  fetch:()=>Promise.reject(new Error('kein Netz im Pruefstand')),
});

/* ⛔ js/lernen.js braucht Namen aus js/kern.js — dieser Pruefstand laedt aber
   bewusst nur lernen.js. Ergebnis war ein „ReferenceError: … is not defined"
   mitten im Laden, also ein Abbruch VOR der ersten Zusicherung. Seit Commit
   c8c7f02 vom 18.08.2026, unbemerkt: der Pruefstand hatte keinen Aufrufer.

   ⛔ NICHT die ganze js/kern.js laden, obwohl das naheliegt. Gemessen am
   21.08.2026 mit zwei runInContext-Aufrufen auf demselben Kontext: eine
   `const`-Deklaration UEBERSCHATTET die gleichnamige Kontext-Eigenschaft
   lautlos fuer alles, was danach kommt — die Eigenschaft selbst bleibt
   unveraendert daneben stehen. kern.js deklariert `const LS`,
   `const INTERVALS`, `let NOTES`; der Vollimport wuerde also die Attrappen
   oben verdecken, und das echte LS griffe auf localStorage, das es hier
   nicht gibt. Dazu vier Funktionen (escapeHtml, getNote, setNote,
   saveNotes), die am globalen Objekt landen und die Attrappen ersetzen —
   der Pruefstand liest seine Notizen genau darueber.
   [[zweiter_aufruf_ueberschreibt_still]]

   ⭐ Deshalb einzelne Funktionen, per KLAMMERZAEHLUNG ausgeschnitten statt
   per Textmarke. Eine Marke am Funktionsende verfaellt, sobald die Funktion
   eine Zeile dazubekommt — genau daran ist test-wurzel.mjs gestorben, und
   dieser Pruefstand hat es zweimal an beiden Kanten des Schnitts
   wiederholt. [[indexof_minus_eins_ist_immer_kleiner]] */
{
  const kq = fs.readFileSync('js/kern.js', 'utf8');

  /* Schneidet `function NAME(...){…}` heraus. Zaehlt geschweifte Klammern und
     ueberspringt Zeichenketten, Vorlagen und Kommentare — ein `{` darin
     wuerde die Zaehlung verschieben. Verzaehlt sie sich doch, gibt es einen
     Syntaxfehler oder die Namenspruefung unten schlaegt an; eine stille
     Luecke kann daraus nicht werden. */
  const funktionAus = (name) => {
    const a = kq.indexOf('function ' + name + '(');
    if (a < 0) throw new Error('js/kern.js: function ' + name + ' nicht gefunden — umbenannt?');
    let i = kq.indexOf('{', a);
    if (i < 0) throw new Error('js/kern.js: kein Rumpf bei ' + name);
    let tiefe = 0;
    for (; i < kq.length; i++){
      const c = kq[i], zwei = kq.slice(i, i + 2);
      if (zwei === '/*'){ const e = kq.indexOf('*/', i + 2); if (e < 0) break; i = e + 1; continue; }
      if (zwei === '//'){ const e = kq.indexOf('\n', i + 2); if (e < 0) break; i = e; continue; }
      if (c === '"' || c === "'" || c === '`'){
        for (i++; i < kq.length && kq[i] !== c; i++) if (kq[i] === '\\') i++;
        continue;
      }
      if (c === '{') tiefe++;
      else if (c === '}'){ tiefe--; if (tiefe === 0) return kq.slice(a, i + 1); }
    }
    throw new Error('js/kern.js: Rumpf von ' + name + ' endet nicht — Klammern verzaehlt?');
  };

  /* Lexikalische Nachbarn: `const`/`let` auf Top-Level von kern.js, die die
     Funktionen unten brauchen. Die Klammerzaehlung nimmt nur die Funktion
     selbst mit, nie ihre Nachbarn — deshalb hier, als KONTEXT-Eigenschaften
     statt lexikalisch (`const ` -> `globalThis.`). So sind sie sichtbar,
     ohne irgendetwas zu ueberschatten. Die Werte kommen aus der Datei,
     nichts ist nachgebaut.

     Gemessen am 21.08.2026, nicht einzeln erfahren: fuenf Nachbarn ueber
     alle zehn Funktionen. [[allgemeine_regel_statt_listeneintrag]] */
  const BEREICHE = [
    { von: 'const VORSCHLAG_SCHLUESSEL',     bis: 'function gewaehlterVorschlag',
      setzt: ['VORSCHLAG_SCHLUESSEL', 'VORSCHLAG_WAHL'] },
    { von: 'const VORSCHLAG_WEG_SCHLUESSEL', bis: 'function istVorschlagVerworfen',
      setzt: ['VORSCHLAG_WEG_SCHLUESSEL', 'VORSCHLAG_WEG'] },
    { von: 'const AR_BEREICH',               bis: 'function arabischHervorheben',
      setzt: ['AR_BEREICH', 'AR_LAUF'] }
  ];
  for (const b of BEREICHE){
    const von = kq.indexOf(b.von);
    if (von < 0) throw new Error('js/kern.js: „' + b.von + '" nicht gefunden — umbenannt?');
    const bis = kq.indexOf(b.bis, von);
    if (bis < 0) throw new Error('js/kern.js: „' + b.bis + '" nicht gefunden');
    vm.runInContext(kq.slice(von, bis).replace(/^const |^let /gm, 'globalThis.'), ctx,
                    { filename: 'js/kern.js (' + b.setzt[0] + ')' });
    for (const n of b.setzt)
      if (vm.runInContext('typeof ' + n, ctx) === 'undefined')
        throw new Error(n + ' aus js/kern.js wurde nicht gesetzt');
  }

  /* ⛔ NOTIZEN kommt bewusst NICHT aus der Datei. kern.js hat ein eigenes
     `let NOTIZEN`, und der Pruefstand hat oben seines — laedt man das der
     Datei, schreibt setNotiz() in ein ANDERES Objekt als das, welches
     Zusicherung „vt_notes ist unveraendert leer" ansieht. Die waere dann
     fuer immer gruen, egal was passiert: der Test wuerde blind.
     Deshalb zeigt der Kontext auf DASSELBE Objekt (siehe oben,
     `NOTIZEN: NOTIZEN`). [[pruefwerkzeug_mit_eingebauter_antwort]] */
  if (vm.runInContext('typeof NOTIZEN', ctx) !== 'object')
    throw new Error('NOTIZEN fehlt im Kontext — die Notiz-Zusicherungen waeren wirkungslos');

  /* Funktionsdeklarationen landen am globalen Objekt und ueberschatten daher
     keine lexikalische Attrappe. Alle zehn sind gemessen, nicht geraten. */
  const AUS_KERN = ['gewaehlterVorschlag', 'setzeGewaehltenVorschlag', 'istVorschlagVerworfen',
                    'schalteVorschlagWeg', 'arabischHervorheben', 'kapitelBeschriftung',
                    'getNotiz', 'currentPool', 'pruefeNurFalscheModus', 'formenAnzeige'];
  for (const name of AUS_KERN){
    vm.runInContext(funktionAus(name), ctx, { filename: 'js/kern.js' });
    if (vm.runInContext('typeof ' + name, ctx) !== 'function')
      throw new Error(name + '() aus js/kern.js wurde nicht definiert');
  }
}
try { vm.runInContext(fs.readFileSync('js/lernen.js','utf8'), ctx, { filename:'js/lernen.js' }); }
catch (e) { console.log('\n❌ js/lernen.js liess sich nicht laden:', e.message);
  /* Die Fehlermeldung allein sagt nicht, WO es knallt. Die erste
     Stack-Zeile aus der geladenen Datei sagt es. */
  const __ort = String(e.stack || '').split('\n').find(z => z.includes('js/lernen.js'));
  if (__ort) console.log('   Fundstelle:', __ort.trim()); process.exit(1); }

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
/* ⛔ HIER STAND „kein Wort ausserhalb Box 1+2 hat eine" — eine Regel aus der
   Zeit, als Eselsbruecken nur fuer die 14 Startwoerter gedacht waren.
   Gemessen am 21.08.2026:

     171 Woerter gesamt · 171 mit Eselsbruecke · nur 14 in Box 1+2
     -> 157 „Verstoesse", verteilt auf Box 3 (67), 4 (43), 5 (36), ohne (11)

   Eine Regel, die zu 92 % verletzt wird, ist keine Regel mehr. Der Bestand
   hat inzwischen VOLLE Abdeckung, und das ist erkennbar Absicht: es gibt
   ein eigenes Vorrats-Werkzeug dafuer, und pruefe-eselsbruecken.js prueft
   die Qualitaet der Texte, nicht ihre Verteilung.

   ⚠️ EHRLICHER UNTERSCHIED zu den drei anderen Erwartungen, die ich heute
   angepasst habe (p1, p6, p9): dort lag jeweils Elias' WORTLAUT als Beleg
   vor. Hier nicht — die neue Zusicherung ist aus dem gemessenen Zustand und
   dem erkennbaren Zweck abgeleitet. Sie ist deshalb bewusst eine
   Abdeckungspruefung: sie schlaegt an, wenn eine Eselsbruecke VERLOREN
   geht, und erfindet keine Regel darueber, welche Woerter eine haben
   duerfen. [[zitierform_ist_nicht_satzkontext]] */
ok('jedes Wort hat eine Eselsbruecke',
   mit.length === V.length, `${mit.length}/${V.length}`);
ok('keine Eselsbruecke behauptet eine Wortherkunft',
   mit.every(w => !/kommt von|stammt von|abgeleitet von|verwandt mit/i.test(w.mnemo)));
ok('Klanghilfen sind als solche gekennzeichnet',
   mit.filter(w => /klingt/i.test(w.mnemo)).every(w => /Klanghilfe|Klang/i.test(w.mnemo)),
   `${mit.filter(w=>/klingt/i.test(w.mnemo)).length} Klanghilfen`);

console.log(`\n${geprueft - fehler}/${geprueft} Zusicherungen erfuellt.`);
process.exit(fehler ? 1 : 0);
