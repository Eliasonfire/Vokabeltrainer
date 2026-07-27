/* ===================== Vokabeltrainer - App-Logik ===================== */
/* Leitner-System: 5 Boxen. Box-Intervalle in Tagen bis zur naechsten Faelligkeit. */
const INTERVALS = {1:0, 2:1, 3:3, 4:7, 5:16};
/* Kapitelnamen: wo eine kuratierte Grammatikregel fuer das Kapitel existiert, ist der
   Name deren Thema (Kap. 2 = ذَلِكَ, belegt durch grammar-data.js `ismul-isara-dhalika-01`,
   Quelle Folge 02). Wo keine Regel vorliegt, beschreibt der Name den tatsaechlichen
   Wortschatz des Kapitels (wie schon bei Kap. 8 "Laender") - nichts davon ist geraten. */
const CHAPTER_NAMES = {
  1:"هَذَا (dies)", 2:"ذَلِكَ (jenes)", 3:"Adjektive", 4:"Genitivpartikel", 5:"مُضَاف (Bezugswort)",
  6:"هَذِهِ (diese)", 7:"تِلْكَ (jene)", 8:"Länder", 9:"Sprachen & Eigenschaften", personal:"Eigene Vokabeln"
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
function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function toast(msg){
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>el.classList.remove('show'), 2200);
}

/* ---------- Darstellung: Icons und Bewegung ----------
   Alle Icons kommen aus dem einen SVG-Sprite in index.html. Nie wieder Emoji
   in generiertem Markup - sonst sieht die Haelfte der App anders aus als die
   andere (je nach Geraet und Emoji-Font). */
function icon(name, extraClass){
  return `<svg class="ic${extraClass ? ' ' + extraClass : ''}" aria-hidden="true"><use href="#ic-${name}"/></svg>`;
}

/* Nutzer, die Animationen reduziert haben wollen, bekommen ueberall sofort den
   Endzustand. Wird von allen JS-Animationen unten geprueft, das CSS hat dafuer
   eine eigene prefers-reduced-motion-Regel. */
const REDUCED_MOTION = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

/* Zahlen zaehlen hoch statt umzuspringen - kleine Geste, macht Home und
   Statistik deutlich lebendiger. */
function animateNumber(el, to, suffix, dur){
  if (!el) return;
  suffix = suffix || '';
  dur = dur || 560;
  const from = parseInt(String(el.textContent).replace(/\D/g,''), 10) || 0;
  /* document.hidden: requestAnimationFrame feuert bei unsichtbarer Seite nicht
     (Hintergrund-Tab, abgedecktes PWA-Fenster) - dann muss der Endwert sofort
     stehen, sonst zeigt die Statistik dauerhaft 0. Der korrekte Wert darf nie
     von einer Animation abhaengen. */
  if (REDUCED_MOTION || from === to || document.hidden){ el.textContent = to + suffix; return; }
  const start = performance.now();
  el.textContent = from + suffix;
  (function step(now){
    const p = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(from + (to - from) * eased) + suffix;
    if (p < 1) requestAnimationFrame(step);
  })(performance.now());
}

/* ===================== Navigation ===================== */
function showScreen(name){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const el = document.getElementById('screen-'+name);
  if (el) el.classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  const navMap = {home:'home', learn:'learn-entry', categories:'categories', sentences:'sentences', stats:'stats', wordlist:'categories', quran:'home', settings:'home'};
  const navName = navMap[name] || name;
  document.querySelectorAll(`.nav-btn[data-nav="${navName}"]`).forEach(b=>b.classList.add('active'));
  if (name==='home') renderHome();
  if (name==='categories') renderCategories();
  if (name==='sentences') openSentences();
  if (name==='quran') renderQuranList();
  if (name==='quranfull') renderSurahList(document.getElementById('surahSearch').value);
  if (name==='stats') renderStats();
  if (name==='settings') renderSettings();
  window.scrollTo(0,0);
}

document.addEventListener('click', (e)=>{
  const navBtn = e.target.closest('[data-nav]');
  if (navBtn){
    const target = navBtn.dataset.nav;
    if (target === 'learn-entry') { startLearningSession(); return; }
    showScreen(target);
  }
  const chBtn = e.target.closest('[data-chfilter]');
  if (chBtn){
    const val = chBtn.dataset.chfilter;
    let sel = SETTINGS.selectedChapters || [];
    if (val === 'all'){ sel = []; }
    else{
      const key = val==='personal' ? 'personal' : Number(val);
      sel = sel.includes(key) ? sel.filter(x=>x!==key) : [...sel, key];
    }
    SETTINGS.selectedChapters = sel;
    saveSettings();
    renderHome();
    return;
  }
  if (e.target.closest('#btnWrongOnly')){
    SETTINGS.wrongOnly = !SETTINGS.wrongOnly;
    saveSettings();
    renderHome();
  }
});

/* ===================== HOME ===================== */
function renderHome(){
  const pool = currentPool();
  animateNumber(document.getElementById('dueCount'), pool.length);
  document.getElementById('dueSub').textContent = pool.length
    ? `Sitzungsgröße: ${SETTINGS.sessionSize===9999?'alle':SETTINGS.sessionSize} Karten pro Runde${SETTINGS.wrongOnly?' · Nur falsche Wörter':''}`
    : (SETTINGS.wrongOnly ? 'Keine schwachen Wörter mit dieser Auswahl.' : 'Alles erledigt für heute – super gemacht.');
  document.getElementById('streakCount').textContent = getStreak().count;

  const boxCounts = [1,2,3,4,5].map(b => VOCAB_DATA.filter(w=>PROGRESS[w.id] && PROGRESS[w.id].box===b).length);
  document.getElementById('boxOverview').innerHTML = boxCounts.map((n,i)=>`
    <div class="box-pip" data-openlist="box:${i+1}"><div class="n">${n}</div><div class="l">Box ${i+1}</div></div>
  `).join('');

  const quranCount = VOCAB_DATA.filter(w=>w.quran).length;
  document.getElementById('quranTileSub').textContent = `${quranCount} Vokabeln`;

  renderChapterFilterChips();
  document.getElementById('btnWrongOnly').classList.toggle('active', !!SETTINGS.wrongOnly);
}

function renderChapterFilterChips(){
  const chapters = ['all',1,2,3,4,5,6,7,8,9,'personal'];
  const sel = SETTINGS.selectedChapters || [];
  document.getElementById('chapterFilterChips').innerHTML = chapters.map(ch=>{
    const active = ch==='all' ? sel.length===0 : sel.includes(ch==='personal'?'personal':ch);
    const label = ch==='all' ? 'Alle' : (ch==='personal' ? 'Eigene' : ch);
    return `<button class="chip-toggle${active?' active':''}" data-chfilter="${ch}">${label}</button>`;
  }).join('');
}

/* ===================== LEARN / FLASHCARDS ===================== */
let SESSION = { words:[], idx:0 };

function startLearningSession(){
  let words = currentPool();
  if (words.length === 0){ toast(SETTINGS.wrongOnly ? 'Keine schwachen Wörter mit dieser Auswahl – stark!' : 'Nichts fällig – schau später wieder vorbei.'); showScreen('home'); return; }
  const size = SETTINGS.sessionSize;
  if (size < words.length) words = words.slice(0, size);
  SESSION = { words, idx:0, dirs:[] };
  showScreen('learn');
  renderCard();
}

function cardDirection(idx){
  if (SETTINGS.direction === 'mixed'){
    if (SESSION.dirs[idx] === undefined) SESSION.dirs[idx] = Math.random()<0.5 ? 'ar-de' : 'de-ar';
    return SESSION.dirs[idx];
  }
  return SETTINGS.direction || 'ar-de';
}

function renderCard(){
  const w = SESSION.words[SESSION.idx];
  const card = document.getElementById('flashcard');
  const inner = document.getElementById('flashcardInner');

  /* Karte ohne Animation auf die Vorderseite zuruecksetzen. Wuerde man die
     'flipped'-Klasse einfach entfernen, drehte die Karte sichtbar zurueck - und
     weil der neue Inhalt zu dem Zeitpunkt schon gesetzt ist, blitzte dabei die
     Rueckseite der NAECHSTEN Vokabel auf (Spoiler). Reihenfolge ist wichtig:
     erst Uebergaenge abschalten, dann zuruecksetzen, dann per Reflow festschreiben,
     erst danach die Uebergaenge wieder freigeben. */
  card.style.transition = 'none';
  inner.style.transition = 'none';
  card.style.transform = '';
  card.classList.remove('flipped');
  void card.offsetWidth;
  card.style.transition = '';
  inner.style.transition = '';

  document.getElementById('cardChapter').textContent = w.chapter==='personal' ? 'Eigene Vokabel' : `Kap. ${w.chapter}`;

  const dir = cardDirection(SESSION.idx);
  const frontEl = document.getElementById('cardArabic');
  const backEl = document.getElementById('cardGerman');
  /* lang/dir IMMER auf beiden Seiten explizit setzen. Frueher wurde beim Wechsel
     zurueck auf ar-de nur `dir` entfernt - `lang="ar"` blieb am deutschen Text
     haengen, was Schriftwahl und Sprachausgabe des Browsers verfaelscht hat. */
  if (dir === 'de-ar'){
    frontEl.textContent = w.de;
    frontEl.classList.add('front-as-german');
    frontEl.setAttribute('dir','ltr'); frontEl.setAttribute('lang','de');
    backEl.textContent = w.ar;
    backEl.classList.add('back-as-arabic');
    backEl.setAttribute('dir','rtl'); backEl.setAttribute('lang','ar');
  } else {
    frontEl.textContent = w.ar;
    frontEl.classList.remove('front-as-german');
    frontEl.setAttribute('dir','rtl'); frontEl.setAttribute('lang','ar');
    backEl.textContent = w.de;
    backEl.classList.remove('back-as-arabic');
    backEl.setAttribute('dir','ltr'); backEl.setAttribute('lang','de');
  }

  // Plural-/Femininum-Formen nur zeigen, wenn in den Einstellungen aktiviert.
  // Label und arabische Form getrennt ausgeben: das Label bleibt klein und
  // lateinisch, die Form selbst wird gross und arabisch gesetzt.
  let forms = [];
  if (SETTINGS.showPlural){
    if (w.pl) forms.push({label:'Plural', value:w.pl});
    if (w.femSg) forms.push({label:'Fem.', value:w.femSg});
    if (w.femPl) forms.push({label:'Fem. Pl.', value:w.femPl});
  }
  document.getElementById('cardForms').innerHTML = forms.map(f=>
    `<span><i class="lbl">${escapeHtml(f.label)}</i>${escapeHtml(f.value)}</span>`
  ).join('');

  const sentBox = document.getElementById('cardSentenceBox');
  if (w.sentAr){
    sentBox.classList.remove('hidden');
    document.getElementById('cardSentenceAr').textContent = w.sentAr;
    document.getElementById('cardSentenceDe').textContent = w.sentDe || '';
  } else sentBox.classList.add('hidden');

  const qBox = document.getElementById('cardQuranBox');
  if (w.quran){
    qBox.classList.remove('hidden');
    document.getElementById('cardQuranAr').textContent = w.quran.ar;
    document.getElementById('cardQuranRef').textContent = `${w.quran.surah} ${w.quran.ayah}`;
    document.getElementById('cardQuranNote').textContent = w.quran.de || w.quran.note || '';
  } else qBox.classList.add('hidden');

  document.getElementById('learnCount').textContent = `${SESSION.idx+1}/${SESSION.words.length}`;
  document.getElementById('learnProgressFill').style.width = `${(SESSION.idx/SESSION.words.length)*100}%`;

  renderQuranFreqBadge(w);
}

/* ---------- Quran-Vorkommen (Wurzel-Häufigkeit, aus dem Quranic Arabic Corpus) ---------- */
function renderQuranFreqBadge(w){
  const badge = document.getElementById('cardQuranFreq');
  const root = w.root && (typeof QURAN_FREQ!=='undefined') ? w.root.replace(/\s+/g,'') : null;
  const freq = root && QURAN_FREQ[root];
  if (!freq){ badge.classList.add('hidden'); return; }
  badge.innerHTML = `${icon('crescent')}<span>${freq.count}× im Quran</span>`;
  badge.classList.remove('hidden');
  badge.onclick = (e)=>{ e.stopPropagation(); openQuranFreqPopover(w, freq); };
}

function openQuranFreqPopover(w, freq){
  const shown = freq.verses.slice(0, 10);
  document.getElementById('qfpTitle').innerHTML = `${icon('crescent')} <span lang="ar" dir="rtl">${escapeHtml(w.ar)}</span> im Quran (${freq.count}×)`;
  document.getElementById('qfpList').innerHTML = shown.map(v=>`
    <div class="qfp-item"><span class="qfp-ref">${v.sura}:${v.ayah}</span> — ${v.surahName}</div>
  `).join('') + (freq.count > shown.length ? `<div class="qfp-note">Erste ${shown.length} von ${freq.count} Fundstellen</div>` : '');
  document.getElementById('qfpBackdrop').classList.remove('hidden');
  document.getElementById('quranFreqPopover').classList.remove('hidden');
}
function closeQuranFreqPopover(){
  document.getElementById('qfpBackdrop').classList.add('hidden');
  document.getElementById('quranFreqPopover').classList.add('hidden');
}
document.getElementById('qfpBackdrop').addEventListener('click', closeQuranFreqPopover);
document.getElementById('btnCloseQuranFreq').addEventListener('click', closeQuranFreqPopover);

let __suppressCardClick = false;
document.getElementById('flashcard').addEventListener('click', (e)=>{
  if (e.target.id === 'btnSpeakWord') return;
  if (__suppressCardClick){ __suppressCardClick = false; return; }
  document.getElementById('flashcard').classList.toggle('flipped');
});
document.getElementById('btnSpeakWord').addEventListener('click', (e)=>{
  e.stopPropagation();
  speakArabic(SESSION.words[SESSION.idx].ar);
});
document.getElementById('btnExitLearn').addEventListener('click', ()=> showScreen('home'));

/* ---------- Swipe-Gesten (rechts=richtig, links=falsch) ---------- */
(function setupSwipe(){
  const card = document.getElementById('flashcard');
  const hintR = document.getElementById('swipeHintRight');
  const hintL = document.getElementById('swipeHintLeft');
  let startX=0, startY=0, dx=0, dragging=false;

  card.addEventListener('pointerdown', (e)=>{
    startX=e.clientX; startY=e.clientY; dx=0; dragging=true;
  });
  card.addEventListener('pointermove', (e)=>{
    if (!dragging) return;
    dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10){
      card.classList.add('swiping');
      card.style.transform = `translateX(${dx}px) rotate(${dx/22}deg)`;
      hintR.classList.toggle('show', dx>40);
      hintL.classList.toggle('show', dx<-40);
    }
  });
  function endDrag(e){
    if (!dragging) return;
    dragging=false;
    card.classList.remove('swiping');
    hintR.classList.remove('show'); hintL.classList.remove('show');
    const threshold = 90;
    if (Math.abs(dx) > threshold){
      __suppressCardClick = true;
      const goingRight = dx>0;
      card.style.transition = 'transform .22s ease';
      card.style.transform = `translateX(${goingRight?600:-600}px) rotate(${goingRight?25:-25}deg)`;
      setTimeout(()=>{ answer(goingRight); }, 180);
    } else {
      card.style.transform = '';
    }
    dx=0;
  }
  card.addEventListener('pointerup', endDrag);
  card.addEventListener('pointercancel', endDrag);
})();

function answer(correct){
  /* Schutz gegen Doppelauslösung: waehrend das Antwort-Feedback laeuft, wird ein
     zweiter Klick/Swipe ignoriert - sonst ueberspringt die Runde eine Karte. */
  if (answer._busy) return;
  const w = SESSION.words[SESSION.idx];
  const p = PROGRESS[w.id];
  if (correct){
    p.box = Math.min(5, p.box+1);
    p.correct = (p.correct||0)+1;
  } else {
    p.box = 1;
    p.wrong = (p.wrong||0)+1;
  }
  p.nextReview = todayStr(INTERVALS[p.box]);
  saveProgress();
  touchStreak();

  const card = document.getElementById('flashcard');
  const feedback = correct ? 'answer-right' : 'answer-wrong';

  function weiter(){
    answer._busy = false;
    card.classList.remove('answer-right','answer-wrong');
    if (SESSION.idx < SESSION.words.length-1){
      SESSION.idx++;
      renderCard();
    } else {
      document.getElementById('learnProgressFill').style.width = '100%';
      toast('Runde geschafft!');
      setTimeout(()=>showScreen('home'), 900);
    }
  }

  if (REDUCED_MOTION){ weiter(); return; }
  /* Kurzes Farbsignal auf der Karte, bevor die naechste kommt: gruener Rahmen
     bei richtig, roter bei falsch. Bewusst kurz gehalten, damit der Lernfluss
     nicht ausgebremst wird. */
  answer._busy = true;
  card.classList.add(feedback);
  setTimeout(weiter, 210);
}
document.getElementById('btnRight').addEventListener('click', ()=>answer(true));
document.getElementById('btnWrong').addEventListener('click', ()=>answer(false));

/* ===================== TTS (Browser Web Speech API) ===================== */
let ARABIC_VOICES = [];
function loadVoices(){
  const voices = speechSynthesis.getVoices();
  ARABIC_VOICES = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('ar'));
  const sel = document.getElementById('voiceSelect');
  if (sel){
    sel.innerHTML = ARABIC_VOICES.length
      ? ARABIC_VOICES.map(v=>`<option value="${v.voiceURI}">${v.name} (${v.lang})</option>`).join('')
      : `<option value="">Keine arabische Stimme gefunden - System-Standard wird genutzt</option>`;
    if (SETTINGS.voiceURI) sel.value = SETTINGS.voiceURI;
  }
}
if ('speechSynthesis' in window){
  speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();
}
function speakArabic(text){
  if (!('speechSynthesis' in window)){ toast('TTS wird von diesem Browser nicht unterstützt'); return; }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ar-SA';
  const chosen = ARABIC_VOICES.find(v=>v.voiceURI===SETTINGS.voiceURI) || ARABIC_VOICES[0];
  if (chosen) u.voice = chosen;
  u.rate = 0.85;
  speechSynthesis.speak(u);
}

/* ===================== CATEGORIES ===================== */
document.querySelectorAll('.cat-tab').forEach(tab=>{
  tab.addEventListener('click', ()=>{
    document.querySelectorAll('.cat-tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.cat-pane').forEach(p=>p.classList.add('hidden'));
    document.getElementById('catPane-'+tab.dataset.cattab).classList.remove('hidden');
  });
});

function renderCategories(){
  renderChapterCats();
  renderRootCats();
  renderCustomCats();
}

function renderChapterCats(){
  const chapters = [1,2,3,4,5,6,7,8,9,'personal'];
  const html = chapters.map(ch=>{
    const words = VOCAB_DATA.filter(w=>w.chapter===ch);
    const name = CHAPTER_NAMES[ch] || `Kapitel ${ch}`;
    const label = ch==='personal' ? `${icon('note')}<span>${name}</span>` : `<span>Kap. ${ch} — ${name}</span>`;
    return `<div class="list-row" data-openlist="chapter:${ch}">
      <div class="list-row-title">${label}</div>
      <div class="list-row-count">${words.length}</div>
    </div>`;
  }).join('');
  document.getElementById('catPane-chapters').innerHTML = html;
}

function renderRootCats(){
  const roots = allRoots();
  const entries = Object.entries(roots).filter(([r,ids])=>ids.length>=2).sort((a,b)=>b[1].length-a[1].length);
  document.getElementById('catPane-roots').innerHTML = entries.map(([root,ids])=>`
    <div class="list-row" data-openlist="root:${root}">
      <div class="list-row-title"><span class="ar">${root}</span><span>${ids.length} verwandte Wörter</span></div>
      <div class="list-row-count">${ids.length}</div>
    </div>`).join('') || '<div class="empty-state">Noch keine Wurzel-Gruppen mit mehreren Wörtern.</div>';
}

function renderCustomCats(){
  const box = document.getElementById('customCatList');
  box.innerHTML = CUSTOM_CATS.map(cat => `
    <div class="custom-cat-box" data-catid="${cat.id}">
      <div class="cat-title"><span data-openlist="cat:${cat.id}">${cat.name} (${cat.wordIds.length})</span><button data-delcat="${cat.id}">${icon('trash')}Löschen</button></div>
      <div class="chips-wrap" data-dropzone="${cat.id}">
        ${cat.wordIds.map(id=>{ const w=byId(id); if(!w) return ''; return `<span class="word-chip" draggable-id="${id}">${w.ar}<span class="weak-de">(${w.de})</span></span>`; }).join('')}
      </div>
    </div>
  `).join('');

  const assigned = new Set(CUSTOM_CATS.flatMap(c=>c.wordIds));
  const pool = VOCAB_DATA.filter(w=>!assigned.has(w.id));
  document.getElementById('poolWords').innerHTML = pool.map(w=>`<span class="word-chip" draggable-id="${w.id}">${w.ar}<span class="weak-de">(${w.de})</span></span>`).join('');

  document.querySelectorAll('[data-delcat]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      CUSTOM_CATS = CUSTOM_CATS.filter(c=>c.id!==btn.dataset.delcat);
      saveCustomCats(); renderCustomCats();
    });
  });
  setupDragAndDrop();
}

document.getElementById('btnAddCat').addEventListener('click', ()=>{
  const input = document.getElementById('newCatName');
  const name = input.value.trim();
  if (!name) return;
  CUSTOM_CATS.push({ id: 'cat_'+Date.now(), name, wordIds: [] });
  saveCustomCats();
  input.value = '';
  renderCustomCats();
});

document.querySelectorAll('[data-openlist]').forEach(()=>{}); // delegated below
document.getElementById('main').addEventListener('click', (e)=>{
  const row = e.target.closest('[data-openlist]');
  if (row) openWordList(row.dataset.openlist);
});

function openWordList(key){
  let words, title;
  if (key.startsWith('chapter:')){
    const ch = key.split(':')[1];
    const chNum = ch==='personal' ? 'personal' : Number(ch);
    words = VOCAB_DATA.filter(w=>w.chapter===chNum);
    title = ch==='personal' ? 'Eigene Vokabeln' : `Kapitel ${ch} — ${CHAPTER_NAMES[chNum]}`;
  } else if (key.startsWith('root:')){
    const root = key.split(':')[1];
    words = VOCAB_DATA.filter(w=>w.root===root);
    title = `Wurzel ${root}`;
  } else if (key.startsWith('cat:')){
    const cat = CUSTOM_CATS.find(c=>c.id===key.split(':')[1]);
    words = cat ? cat.wordIds.map(byId).filter(Boolean) : [];
    title = cat ? cat.name : 'Kategorie';
  } else if (key.startsWith('box:')){
    const boxNum = Number(key.split(':')[1]);
    words = VOCAB_DATA.filter(w=>PROGRESS[w.id] && PROGRESS[w.id].box===boxNum);
    title = `Box ${boxNum}`;
  } else if (key==='quran'){
    words = VOCAB_DATA.filter(w=>w.quran);
    title = 'Vokabeln im Quran';
  } else { words=[]; title=''; }

  document.getElementById('wordlistTitle').textContent = title;
  document.getElementById('wordList').innerHTML = words.map(w=>`
    <div class="word-list-item">
      <div><div class="wl-ar">${w.ar}</div><div class="wl-de">${w.de}</div></div>
      <span class="wl-box">Box ${PROGRESS[w.id]?PROGRESS[w.id].box:1}</span>
    </div>
  `).join('') || '<div class="empty-state">Keine Wörter in dieser Kategorie.</div>';
  document.getElementById('personalVocabAddForm').style.display = key==='chapter:personal' ? 'flex' : 'none';
  showScreen('wordlist');
}
document.getElementById('btnWordlistBack').addEventListener('click', ()=>showScreen('categories'));
document.getElementById('btnAddPersonalVocab').addEventListener('click', ()=>{
  const ar = document.getElementById('pvAr').value.trim();
  const de = document.getElementById('pvDe').value.trim();
  const sentAr = document.getElementById('pvSentAr').value.trim();
  const sentDe = document.getElementById('pvSentDe').value.trim();
  if (!ar || !de){ toast('Bitte Arabisch und Deutsch ausfüllen'); return; }
  addPersonalVocab({ar, de, sentAr, sentDe});
  document.getElementById('pvAr').value = '';
  document.getElementById('pvDe').value = '';
  document.getElementById('pvSentAr').value = '';
  document.getElementById('pvSentDe').value = '';
  toast('Vokabel hinzugefügt');
  openWordList('chapter:personal');
});

/* ---------- Drag & Drop (Pointer Events, touch + mouse) ---------- */
function setupDragAndDrop(){
  let ghost=null, sourceEl=null, sourceId=null;
  document.querySelectorAll('.word-chip').forEach(chip=>{
    chip.addEventListener('pointerdown', startDrag);
  });

  function startDrag(e){
    sourceEl = e.currentTarget;
    sourceId = sourceEl.getAttribute('draggable-id');
    e.preventDefault();
    ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    ghost.textContent = sourceEl.textContent;
    document.body.appendChild(ghost);
    moveGhost(e.clientX, e.clientY);
    sourceEl.classList.add('dragging');
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp, {once:true});
  }
  function moveGhost(x,y){ if(ghost){ ghost.style.left = (x-30)+'px'; ghost.style.top = (y-20)+'px'; } }
  function onMove(e){
    moveGhost(e.clientX, e.clientY);
    document.querySelectorAll('.custom-cat-box').forEach(b=>b.classList.remove('drop-hover'));
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const box = el && el.closest('.custom-cat-box');
    if (box) box.classList.add('drop-hover');
  }
  function onUp(e){
    document.removeEventListener('pointermove', onMove);
    if (ghost) ghost.remove();
    if (sourceEl) sourceEl.classList.remove('dragging');
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const box = el && el.closest('.custom-cat-box');
    document.querySelectorAll('.custom-cat-box').forEach(b=>b.classList.remove('drop-hover'));
    if (sourceId){
      /* Immer zuerst aus allen Kategorien entfernen - so wird ein Wort, das aus
         einer Kategorie-Box heraus (zurueck in den Pool oder nirgendwohin)
         gezogen wird, automatisch wieder freigegeben. */
      CUSTOM_CATS.forEach(c=>{ c.wordIds = c.wordIds.filter(id=>id!==sourceId); });
      if (box){
        const catId = box.dataset.catid;
        const cat = CUSTOM_CATS.find(c=>c.id===catId);
        if (cat && !cat.wordIds.includes(sourceId)) cat.wordIds.push(sourceId);
      }
      saveCustomCats();
      renderCustomCats();
    }
    sourceEl=null; sourceId=null; ghost=null;
  }
}

/* ===================== SENTENCES ===================== */
let SENT = { list: VOCAB_DATA.filter(w=>w.sentAr), idx:0 };

function openSentences(){
  SENT.list = VOCAB_DATA.filter(w=>w.sentAr);
  if (SENT.idx >= SENT.list.length) SENT.idx = 0;
  renderSentence();
}

function buildSentenceHtml(w){
  const tags = (typeof SENTENCE_TAGS!=='undefined') && SENTENCE_TAGS[w.id];
  if (!SETTINGS.grammarHighlight || !tags || !tags.length) return escapeHtml(w.sentAr);
  let html = escapeHtml(w.sentAr);
  tags.forEach(t=>{
    const rule = GRAMMAR_RULES.find(r=>r.id===t.ruleId);
    if (!rule) return;
    const needle = escapeHtml(t.matchText);
    if (!needle || html.indexOf(needle)===-1) return;
    html = html.replace(needle, `<span class="gram-underline" style="--gram-role:var(--gram-${rule.color})" data-rule="${rule.id}">${needle}</span>`);
  });
  return html;
}

function renderSentence(){
  if (SENT.list.length===0){ document.getElementById('sentAr').textContent='Keine Sätze in dieser Auswahl.'; return; }
  const w = SENT.list[SENT.idx];
  document.getElementById('sentChapter').textContent = w.chapter==='personal'?'Eigene Vokabel':`Kap. ${w.chapter}`;
  document.getElementById('sentAr').innerHTML = buildSentenceHtml(w);
  document.getElementById('sentDe').textContent = w.sentDe || '';
  document.getElementById('sentPos').textContent = `${SENT.idx+1} / ${SENT.list.length}`;

  const qBox = document.getElementById('sentQuranBox');
  if (w.quran){
    qBox.classList.remove('hidden');
    document.getElementById('sentQuranAr').textContent = w.quran.ar;
    document.getElementById('sentQuranRef').textContent = `${w.quran.surah} ${w.quran.ayah}`;
    document.getElementById('sentQuranDe').textContent = w.quran.de || w.quran.note || '';
  } else qBox.classList.add('hidden');

}
document.getElementById('btnSentPrev').addEventListener('click', ()=>{
  SENT.idx = (SENT.idx-1+SENT.list.length)%SENT.list.length; renderSentence();
});
document.getElementById('btnSentNext').addEventListener('click', ()=>{
  SENT.idx = (SENT.idx+1)%SENT.list.length; renderSentence();
});
document.getElementById('btnSentSpeak').addEventListener('click', ()=>{
  speakArabic(SENT.list[SENT.idx].sentAr);
});

document.getElementById('sentAr').addEventListener('click', (e)=>{
  const span = e.target.closest('.gram-underline');
  const pop = document.getElementById('gramPopover');
  if (!span){ pop.classList.remove('show'); return; }
  const rule = GRAMMAR_RULES.find(r=>r.id===span.dataset.rule);
  if (!rule) return;
  pop.innerHTML = `<div class="gp-title">${rule.name}</div><div>${rule.shortExplanation}</div><div class="gp-source">${rule.source.video} · ca. ${rule.source.approxTimestamp}</div>`;
  const rect = span.getBoundingClientRect();
  pop.style.left = Math.max(8, Math.min(rect.left, window.innerWidth-296))+'px';
  pop.style.top = (rect.bottom+8)+'px';
  pop.classList.add('show');
});
document.addEventListener('click', (e)=>{
  if (!e.target.closest('.gram-underline') && !e.target.closest('#gramPopover'))
    document.getElementById('gramPopover').classList.remove('show');
});
const gramToggleBtn = document.getElementById('toggleGrammarHighlight');
gramToggleBtn.classList.toggle('on', SETTINGS.grammarHighlight);
gramToggleBtn.addEventListener('click', ()=>{
  SETTINGS.grammarHighlight = !SETTINGS.grammarHighlight;
  gramToggleBtn.classList.toggle('on', SETTINGS.grammarHighlight);
  saveSettings();
  renderSentence();
});

/* ===================== QURAN LIST ===================== */
function renderQuranList(){
  const words = VOCAB_DATA.filter(w=>w.quran);
  document.getElementById('quranList').innerHTML = words.map(w=>`
    <div class="word-list-item quran-word-item">
      <div class="quran-word-head">
        <div class="wl-ar">${w.ar}</div><div class="wl-de">${w.de}</div>
      </div>
      <div class="quran-word-verse" lang="ar" dir="rtl">${w.quran.ar}</div>
      <div class="quran-word-ref">${w.quran.surah} ${w.quran.ayah}${w.quran.de ? ' — ' + w.quran.de : ''}</div>
    </div>
  `).join('') || '<div class="empty-state">Noch keine geprüften Quran-Bezüge.</div>';
}

/* ===================== FULL QURAN READER ===================== */
let HIFZ = LS.get('vt_hifz', {});
function saveHifz(){ LS.set('vt_hifz', HIFZ); }
const VERSE_CACHE = {};

function renderSurahList(filter){
  const q = (filter||'').trim().toLowerCase();
  const list = SURAH_DATA.filter(s => !q || s.name.toLowerCase().includes(q) || s.ar.includes(q) || String(s.id)===q);
  document.getElementById('quranFullTitle').textContent = 'Quran lesen';
  document.getElementById('quranFullIntro').classList.remove('hidden');
  document.getElementById('surahSearch').classList.remove('hidden');
  document.getElementById('surahList').classList.remove('hidden');
  document.getElementById('verseList').classList.add('hidden');
  document.getElementById('surahList').innerHTML = list.map(s => `
    <div class="surah-row" data-opensurah="${s.id}">
      <div class="sr-num">${s.id}</div>
      <div class="sr-mid"><div class="sr-ar">${s.ar}</div><div class="sr-name">${s.name} · ${s.verses} Verse</div></div>
      <button class="hifz-check${HIFZ[s.id]?' on':''}" data-hifztoggle="${s.id}" aria-label="Als auswendig markieren">${icon('check')}</button>
    </div>`).join('') || '<div class="empty-state">Keine Sure gefunden.</div>';
}

document.getElementById('surahSearch').addEventListener('input', (e)=> renderSurahList(e.target.value));
document.getElementById('btnQuranFullBack').addEventListener('click', ()=>{
  if (!document.getElementById('verseList').classList.contains('hidden')) renderSurahList(document.getElementById('surahSearch').value);
  else showScreen('home');
});
document.getElementById('surahList').addEventListener('click', (e)=>{
  const hifzBtn = e.target.closest('[data-hifztoggle]');
  if (hifzBtn){
    const id = hifzBtn.dataset.hifztoggle;
    HIFZ[id] = !HIFZ[id];
    saveHifz();
    hifzBtn.classList.toggle('on', !!HIFZ[id]);
    return;
  }
  const row = e.target.closest('[data-opensurah]');
  if (row) openSurah(Number(row.dataset.opensurah));
});

async function openSurah(id){
  const surah = SURAH_DATA.find(s=>s.id===id);
  document.getElementById('quranFullTitle').textContent = `${id}. ${surah.name}`;
  document.getElementById('quranFullIntro').classList.add('hidden');
  document.getElementById('surahSearch').classList.add('hidden');
  document.getElementById('surahList').classList.add('hidden');
  const vList = document.getElementById('verseList');
  vList.classList.remove('hidden');

  if (VERSE_CACHE[id]){ renderVerses(id); return; }
  /* Skeleton-Platzhalter in Versform statt nackter Textzeile - die Seite
     "steht" sofort, auch wenn quran.com noch laedt. */
  vList.innerHTML =
    '<div class="verse-loading">Lade Verse von quran.com…</div>' +
    Array.from({length:5}, ()=>`
      <div class="verse-skeleton">
        <div class="skeleton sk-line" style="width:54px;height:18px;"></div>
        <div class="skeleton sk-line sk-ar"></div>
        <div class="skeleton sk-line sk-de"></div>
      </div>`).join('');
  try{
    let verses = [], page = 1, totalPages = 1;
    do{
      const res = await fetch(`https://api.quran.com/api/v4/verses/by_chapter/${id}?language=de&translations=27&fields=text_uthmani&per_page=50&page=${page}`);
      if (!res.ok) throw new Error('HTTP '+res.status);
      const data = await res.json();
      verses = verses.concat(data.verses||[]);
      totalPages = (data.pagination && data.pagination.total_pages) || 1;
      page++;
    } while(page <= totalPages);
    VERSE_CACHE[id] = verses;
    renderVerses(id);
  }catch(err){
    vList.innerHTML = `<div class="verse-loading">Verse konnten nicht geladen werden (Internetverbindung prüfen).<br>${err.message}</div>`;
  }
}

function renderVerses(id){
  const verses = VERSE_CACHE[id];
  document.getElementById('verseList').innerHTML = verses.map(v => `
    <div class="verse-item">
      <span class="verse-num">${v.verse_key}</span>
      <div class="verse-ar" lang="ar" dir="rtl">${v.text_uthmani}</div>
      <div class="verse-de">${(v.translations && v.translations[0] && v.translations[0].text) || ''}</div>
    </div>`).join('');
}

/* ===================== STATS ===================== */
function renderStats(){
  const total = VOCAB_DATA.length;
  const mastered = VOCAB_DATA.filter(w=>PROGRESS[w.id] && PROGRESS[w.id].box===5).length;
  const totalCorrect = Object.values(PROGRESS).reduce((s,p)=>s+(p.correct||0),0);
  const totalWrong = Object.values(PROGRESS).reduce((s,p)=>s+(p.wrong||0),0);
  const acc = (totalCorrect+totalWrong) ? Math.round(100*totalCorrect/(totalCorrect+totalWrong)) : 0;

  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card"><div class="v" data-count="${total}">0</div><div class="l">Vokabeln gesamt</div></div>
    <div class="stat-card"><div class="v" data-count="${mastered}">0</div><div class="l">In Box 5 (sicher)</div></div>
    <div class="stat-card"><div class="v" data-count="${acc}" data-suffix="%">0%</div><div class="l">Trefferquote (in dieser App)</div></div>
    <div class="stat-card"><div class="v" data-count="${getStreak().count}">0</div><div class="l">Tage-Streak ${icon('flame')}</div></div>
  `;
  document.querySelectorAll('#statsGrid .v[data-count]').forEach(el=>{
    animateNumber(el, Number(el.dataset.count), el.dataset.suffix || '');
  });

  const boxCounts = [1,2,3,4,5].map(b => VOCAB_DATA.filter(w=>PROGRESS[w.id] && PROGRESS[w.id].box===b).length);
  document.getElementById('boxBars').innerHTML = boxCounts.map((n,i)=>`
    <div class="box-bar-row">
      <span class="bl">Box ${i+1}</span>
      <div class="box-bar-track"><div class="box-bar-fill" data-width="${total?Math.round(100*n/total):0}"></div></div>
      <span class="bn">${n}</span>
    </div>`).join('');
  /* Breite erst im naechsten Frame setzen, damit die Balken sichtbar von 0
     aufwachsen (CSS-Transition auf width). Bei unsichtbarer Seite feuert rAF
     nicht - dann sofort setzen, der Wert darf nie von der Animation abhaengen. */
  const setBars = ()=>{
    document.querySelectorAll('#boxBars .box-bar-fill').forEach(el=>{
      el.style.width = el.dataset.width + '%';
    });
  };
  if (REDUCED_MOTION || document.hidden) setBars();
  else requestAnimationFrame(()=>requestAnimationFrame(setBars));
}

/* ===================== SETTINGS ===================== */
function renderSettings(){
  const sw = document.getElementById('toggleShowPlural');
  sw.classList.toggle('on', SETTINGS.showPlural);
  document.getElementById('sessionSizeSelect').value = String(SETTINGS.sessionSize);
  document.getElementById('directionSelect').value = SETTINGS.direction || 'ar-de';
  loadVoices();
}
document.getElementById('btnSettings').addEventListener('click', ()=>showScreen('settings'));
document.getElementById('toggleShowPlural').addEventListener('click', ()=>{
  SETTINGS.showPlural = !SETTINGS.showPlural;
  saveSettings();
  renderSettings();
});
document.getElementById('sessionSizeSelect').addEventListener('change', (e)=>{
  SETTINGS.sessionSize = Number(e.target.value);
  saveSettings();
});
document.getElementById('directionSelect').addEventListener('change', (e)=>{
  SETTINGS.direction = e.target.value;
  saveSettings();
});
document.getElementById('voiceSelect').addEventListener('change', (e)=>{
  SETTINGS.voiceURI = e.target.value;
  saveSettings();
});
document.getElementById('btnResetProgress').addEventListener('click', ()=>{
  if (!confirm('Wirklich den gesamten Lernfortschritt zurücksetzen? Alle Karten gehen zurück auf Box 1.')) return;
  PROGRESS = {};
  VOCAB_DATA.forEach(w=>{ PROGRESS[w.id] = { box:1, nextReview: todayStr(0), correct:0, wrong:0 }; });
  saveProgress();
  toast('Lernfortschritt zurückgesetzt');
  renderHome();
});
document.getElementById('btnResetStats').addEventListener('click', ()=>{
  if (!confirm('Wirklich den Tages-Streak zurücksetzen?')) return;
  LS.set('vt_streak', {count:0, last:null});
  toast('Streak zurückgesetzt');
  renderHome();
});

/* ===================== INIT ===================== */
document.addEventListener('click', (e)=>{
  const chip = e.target.closest('.word-chip');
  // klick auf Chip im Pool/Kategorie ohne Drag = nichts (Drag uebernimmt), Platzhalter fuer spaeter
});

if ('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  });
}

renderHome();
showScreen('home');
