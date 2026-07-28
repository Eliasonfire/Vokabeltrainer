/* kern.js -- Konstanten, Speicher, Lernfortschritt, Streak, kleine Helfer
   Teil der App-Logik; wird in index.html in fester Reihenfolge geladen und
   teilt sich mit den uebrigen js/-Dateien den globalen Namensraum. */
/* ===================== Vokabeltrainer - App-Logik ===================== */
/* Leitner-System: 5 Boxen. Box-Intervalle in Tagen bis zur naechsten Faelligkeit. */
const INTERVALS = {1:0, 2:1, 3:3, 4:7, 5:16};
/* Kapitelnamen: wo eine kuratierte Grammatikregel fuer das Kapitel existiert, ist der
   Name deren Thema (Kap. 2 = ذَلِكَ, belegt durch grammar-data.js `ismul-isara-dhalika-01`,
   Quelle Folge 02). Wo keine Regel vorliegt, beschreibt der Name den tatsaechlichen
   Wortschatz des Kapitels - nichts davon ist geraten.
   27.07.2026, nach Auswertung aller 13 Folgen: Kap. 3 und 9 tragen jetzt ihr
   Grammatikthema statt einer Wortschatz-Beschreibung. Kap. 3 = اَلْ mit Sonnen- und
   Mondbuchstaben (`al-tarif-01`, `schams-qamar-01`, Folge 02/03), Kap. 9 = نَعْت
   (`nat-vier-bedingungen-01`, Folge 13) - genau der Wechsel, den Abschnitt A.6 des
   Ziel-Prompts vorgesehen hat. Kap. 8 bleibt "Laender": die Regeln dort drehen sich
   um لِ, das Kapitel selbst fuehrt aber Laendernamen ein. */
const CHAPTER_NAMES = {
  1:"هَذَا (dies)", 2:"ذَلِكَ (jenes)", 3:"اَلْ (bestimmter Artikel)", 4:"Genitivpartikel", 5:"مُضَاف (Bezugswort)",
  6:"هَذِهِ (diese)", 7:"تِلْكَ (jene)", 8:"Länder", 9:"نَعْت (Adjektiv)", personal:"Eigene Vokabeln"
};

/* ---------- Storage ---------- */
const LS = {
  get(key, fallback){ try{ const v = localStorage.getItem(key); return v?JSON.parse(v):fallback; }catch(e){ return fallback; } },
  set(key, val){ try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){} }
};

function todayStr(offsetDays=0){
  const d = new Date();
  d.setDate(d.getDate()+offsetDays);
  return d.toISOString().slice(0,10);
}

/* ---------- Eigene Vokabeln (lokal, nicht Teil von vocab-data.js) ---------- */
let PERSONAL_VOCAB = LS.get('vt_personalVocab', []);
function savePersonalVocab(){ LS.set('vt_personalVocab', PERSONAL_VOCAB); }
VOCAB_DATA.push(...PERSONAL_VOCAB);

function addPersonalVocab({ar, de, sentAr, sentDe}){
  const w = { id:'p_'+Date.now(), ar, de, chapter:'personal', type:'noun' };
  if (sentAr) w.sentAr = sentAr;
  if (sentDe) w.sentDe = sentDe;
  PERSONAL_VOCAB.push(w);
  savePersonalVocab();
  VOCAB_DATA.push(w);
  PROGRESS[w.id] = { box:1, nextReview: todayStr(0), correct:0, wrong:0 };
  saveProgress();
  return w;
}

/* Fortschritt initialisieren: Startbox aus Arabic-Roots-Daten importieren.
   WICHTIG: Laeuft NICHT nur beim allerersten Start. Frueher stieg die Funktion bei
   vorhandenem Speicherstand sofort aus - Vokabeln, die spaeter zu VOCAB_DATA
   dazukamen (neu freigeschaltete Kapitel, Backfill), bekamen dadurch nie einen
   PROGRESS-Eintrag und tauchten nie in "Jetzt lernen" auf, obwohl sie in den
   Kategorien sichtbar waren. Jetzt werden fehlende Eintraege bei jedem Start
   nachgetragen, ohne bestehenden Fortschritt anzufassen. */
function initProgress(){
  let progress = LS.get('vt_progress', null);
  let changed = false;
  if (!progress){ progress = {}; changed = true; }
  VOCAB_DATA.forEach(w=>{
    if (!progress[w.id]){
      progress[w.id] = { box: w.box || 1, nextReview: todayStr(0), correct:0, wrong:0 };
      changed = true;
    }
  });
  if (changed) LS.set('vt_progress', progress);
  return progress;
}
let PROGRESS = initProgress();
function saveProgress(){ LS.set('vt_progress', PROGRESS); }

let SETTINGS = Object.assign(
  { showPlural:false, sessionSize:20, voiceURI:null, direction:'ar-de', selectedChapters:[], wrongOnly:false, grammarHighlight:true },
  LS.get('vt_settings', {})
);
function saveSettings(){ LS.set('vt_settings', SETTINGS); }

/* Eigene Eselsbruecken pro Vokabel (arabicroots-Paritaet D): { [vokabelId]: Text }.
   Bewusst getrennt von PROGRESS - beim "Fortschritt zuruecksetzen" soll das,
   was Elias sich selbst ausgedacht hat, nicht mit weggeworfen werden. */
let NOTES = LS.get('vt_notes', {});
function saveNotes(){ LS.set('vt_notes', NOTES); }
function getNote(id){ return (NOTES[id] || '').trim(); }
function setNote(id, text){
  const t = (text || '').trim();
  if (t) NOTES[id] = t; else delete NOTES[id];
  saveNotes();
}

let CUSTOM_CATS = LS.get('vt_customCats', []);
function saveCustomCats(){ LS.set('vt_customCats', CUSTOM_CATS); }

/* ---------- Streak ---------- */
function touchStreak(){
  let s = LS.get('vt_streak', {count:0,last:null});
  const t = todayStr(0), y = todayStr(-1);
  const vorher = s.count;
  if (s.last === t) { /* schon heute gezaehlt */ }
  else if (s.last === y) { s.count += 1; s.last = t; }
  else { s.count = 1; s.last = t; }
  LS.set('vt_streak', s);
  if (s.count !== vorher){
    const badge = document.getElementById('streakBadge');
    const zahl = document.getElementById('streakCount');
    if (zahl) zahl.textContent = s.count;
    if (badge && !REDUCED_MOTION){
      badge.classList.remove('bump');
      void badge.offsetWidth;
      badge.classList.add('bump');
    }
  }
  return s;
}
function getStreak(){ return LS.get('vt_streak', {count:0,last:null}); }

/* ---------- Vocab helpers ---------- */
function byId(id){ return VOCAB_DATA.find(w=>w.id===id); }

/* Fisher-Yates, arbeitet auf einer Kopie. */
function shuffle(arr){
  const a = arr.slice();
  for (let i=a.length-1; i>0; i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Erst mischen, dann stabil nach Box sortieren: Die Leitner-Prioritaet (niedrige
   Box zuerst) bleibt erhalten, aber innerhalb einer Box ist die Reihenfolge
   zufaellig. Ohne das Mischen kam die Sitzung in VOCAB_DATA-Reihenfolge heraus -
   da alle Woerter anfangs in derselben Box liegen, bestand eine 20er-Runde
   ausschliesslich aus Kapitel 1. */
function dueWords(){
  const t = todayStr(0);
  const due = VOCAB_DATA.filter(w => PROGRESS[w.id] && PROGRESS[w.id].nextReview <= t);
  return shuffle(due).sort((a,b)=> PROGRESS[a.id].box - PROGRESS[b.id].box);
}
function allRoots(){
  const map = {};
  VOCAB_DATA.forEach(w=>{ if(w.root){ (map[w.root] = map[w.root]||[]).push(w.id); } });
  return map;
}
function isWeak(w){ return !!(PROGRESS[w.id] && PROGRESS[w.id].box<=2); }
function weakWords(){
  return shuffle(VOCAB_DATA.filter(isWeak)).sort((a,b)=> PROGRESS[a.id].box - PROGRESS[b.id].box);
}
function currentPool(){
  let pool = SETTINGS.wrongOnly ? weakWords() : dueWords();
  const sel = SETTINGS.selectedChapters || [];
  if (sel.length) pool = pool.filter(w=>sel.includes(w.chapter));
  return pool;
}

/* "Nur falsche Wörter" wieder abschalten, sobald keine mehr da sind
   (arabicroots-Paritaet D). Der Schalter war bisher dauerhaft: hat man die
   letzte schwache Vokabel geschafft, blieb er an, "Lernen" meldete jedes Mal
   "Keine schwachen Woerter" und sprang zurueck - bis man von selbst merkt,
   dass oben noch ein Knopf leuchtet.
   Bewusst NICHT beim blossen Umschalten pruefen, sonst spraenge der Schalter
   sofort wieder zurueck und wirkte kaputt. Nur nach einer Antwort und am Ende
   einer Runde, also genau dann, wenn man die Liste wirklich leergeraeumt hat. */
function pruefeNurFalscheModus(){
  if (!SETTINGS.wrongOnly) return false;
  if (currentPool().length) return false;
  SETTINGS.wrongOnly = false;
  saveSettings();
  toast('Keine schwachen Wörter mehr – zurück zum normalen Modus.');
  return true;
}
function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function toast(msg){
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>el.classList.remove('show'), 2200);
}

