/* ===================== Vokabeltrainer - App-Logik ===================== */
/* Leitner-System: 5 Boxen. Box-Intervalle in Tagen bis zur naechsten Faelligkeit. */
const INTERVALS = {1:0, 2:1, 3:3, 4:7, 5:16};
const CHAPTER_NAMES = {
  1:"Hadha", 2:"Kapitel 2", 3:"Adjektive", 4:"Genitivpartikel", 5:"Mudaf",
  6:"Hadihi", 7:"Tilka", 8:"Länder", 9:"Kapitel 9", personal:"Eigene Vokabeln"
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

/* Fortschritt initialisieren: Startbox aus Arabic-Roots-Daten importieren (einmalig) */
function initProgress(){
  let progress = LS.get('vt_progress', null);
  if (progress) return progress;
  progress = {};
  VOCAB_DATA.forEach(w=>{
    progress[w.id] = { box: w.box || 1, nextReview: todayStr(0), correct:0, wrong:0 };
  });
  LS.set('vt_progress', progress);
  return progress;
}
let PROGRESS = initProgress();
function saveProgress(){ LS.set('vt_progress', PROGRESS); }

let SETTINGS = Object.assign(
  { showPlural:false, sessionSize:20, voiceURI:null, direction:'ar-de', selectedChapters:[], wrongOnly:false },
  LS.get('vt_settings', {})
);
function saveSettings(){ LS.set('vt_settings', SETTINGS); }

let CUSTOM_CATS = LS.get('vt_customCats', []);
function saveCustomCats(){ LS.set('vt_customCats', CUSTOM_CATS); }

/* ---------- Streak ---------- */
function touchStreak(){
  let s = LS.get('vt_streak', {count:0,last:null});
  const t = todayStr(0), y = todayStr(-1);
  if (s.last === t) { /* schon heute gezaehlt */ }
  else if (s.last === y) { s.count += 1; s.last = t; }
  else { s.count = 1; s.last = t; }
  LS.set('vt_streak', s);
  return s;
}
function getStreak(){ return LS.get('vt_streak', {count:0,last:null}); }

/* ---------- Vocab helpers ---------- */
function byId(id){ return VOCAB_DATA.find(w=>w.id===id); }
function dueWords(){
  const t = todayStr(0);
  return VOCAB_DATA.filter(w => PROGRESS[w.id] && PROGRESS[w.id].nextReview <= t)
    .sort((a,b)=> PROGRESS[a.id].box - PROGRESS[b.id].box);
}
function allRoots(){
  const map = {};
  VOCAB_DATA.forEach(w=>{ if(w.root){ (map[w.root] = map[w.root]||[]).push(w.id); } });
  return map;
}
function isWeak(w){ return !!(PROGRESS[w.id] && PROGRESS[w.id].box<=2); }
function weakWords(){ return VOCAB_DATA.filter(isWeak); }
function currentPool(){
  let pool = SETTINGS.wrongOnly ? weakWords() : dueWords();
  const sel = SETTINGS.selectedChapters || [];
  if (sel.length) pool = pool.filter(w=>sel.includes(w.chapter));
  return pool;
}
function toast(msg){
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>el.classList.remove('show'), 2200);
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
  document.getElementById('dueCount').textContent = pool.length;
  document.getElementById('dueSub').textContent = pool.length
    ? `Sitzungsgröße: ${SETTINGS.sessionSize===9999?'alle':SETTINGS.sessionSize} Karten pro Runde${SETTINGS.wrongOnly?' · Nur falsche Wörter':''}`
    : (SETTINGS.wrongOnly ? 'Keine schwachen Wörter mit dieser Auswahl.' : 'Alles erledigt für heute – super gemacht.');
  document.getElementById('streakCount').textContent = getStreak().count;

  const boxCounts = [1,2,3,4,5].map(b => VOCAB_DATA.filter(w=>PROGRESS[w.id] && PROGRESS[w.id].box===b).length);
  document.getElementById('boxOverview').innerHTML = boxCounts.map((n,i)=>`
    <div class="box-pip"><div class="n">${n}</div><div class="l">Box ${i+1}</div></div>
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
  if (words.length === 0){ toast(SETTINGS.wrongOnly ? 'Keine schwachen Wörter mit dieser Auswahl 🎉' : 'Nichts fällig – schau später wieder vorbei 🌙'); showScreen('home'); return; }
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
  card.classList.remove('flipped');
  card.style.transform = ''; card.style.transition = '';
  document.getElementById('cardChapter').textContent = w.chapter==='personal' ? 'Eigene Vokabel' : `Kap. ${w.chapter}`;

  const dir = cardDirection(SESSION.idx);
  const frontEl = document.getElementById('cardArabic');
  const backEl = document.getElementById('cardGerman');
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
    backEl.removeAttribute('dir');
  }

  // Plural-/Femininum-Formen nur zeigen, wenn in den Einstellungen aktiviert
  let forms = [];
  if (SETTINGS.showPlural){
    if (w.pl) forms.push('Plural: '+w.pl);
    if (w.femSg) forms.push('Fem.: '+w.femSg);
    if (w.femPl) forms.push('Fem. Pl.: '+w.femPl);
  }
  document.getElementById('cardForms').innerHTML = forms.map(f=>`<span>${f}</span>`).join('');

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
}

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

  if (SESSION.idx < SESSION.words.length-1){
    SESSION.idx++;
    renderCard();
  } else {
    document.getElementById('learnProgressFill').style.width = '100%';
    toast('Runde geschafft! 🎉');
    setTimeout(()=>showScreen('home'), 900);
  }
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
    return `<div class="list-row" data-openlist="chapter:${ch}">
      <div class="list-row-title">${ch==='personal'?'📝 ':`Kap. ${ch} — `}${name}</div>
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
      <div class="list-row-title"><span class="ar">${root}</span>${ids.length} verwandte Wörter</div>
      <div class="list-row-count">${ids.length}</div>
    </div>`).join('') || '<p style="color:var(--text-dim)">Noch keine Wurzel-Gruppen mit mehreren Wörtern.</p>';
}

function renderCustomCats(){
  const box = document.getElementById('customCatList');
  box.innerHTML = CUSTOM_CATS.map(cat => `
    <div class="custom-cat-box" data-catid="${cat.id}">
      <div class="cat-title"><span>${cat.name} (${cat.wordIds.length})</span><button data-delcat="${cat.id}">Löschen</button></div>
      <div class="chips-wrap" data-dropzone="${cat.id}">
        ${cat.wordIds.map(id=>{ const w=byId(id); if(!w) return ''; return `<span class="word-chip" draggable-id="${id}">${w.ar}${isWeak(w)?`<span class="weak-de">(${w.de})</span>`:''}</span>`; }).join('')}
      </div>
    </div>
  `).join('');

  const assigned = new Set(CUSTOM_CATS.flatMap(c=>c.wordIds));
  const pool = VOCAB_DATA.filter(w=>!assigned.has(w.id));
  document.getElementById('poolWords').innerHTML = pool.map(w=>`<span class="word-chip" draggable-id="${w.id}">${w.ar}${isWeak(w)?`<span class="weak-de">(${w.de})</span>`:''}</span>`).join('');

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
  `).join('') || '<p style="color:var(--text-dim)">Keine Wörter in dieser Kategorie.</p>';
  showScreen('wordlist');
}
document.getElementById('btnWordlistBack').addEventListener('click', ()=>showScreen('categories'));

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
    if (box && sourceId){
      const catId = box.dataset.catid;
      CUSTOM_CATS.forEach(c=>{ c.wordIds = c.wordIds.filter(id=>id!==sourceId); });
      const cat = CUSTOM_CATS.find(c=>c.id===catId);
      if (cat && !cat.wordIds.includes(sourceId)) cat.wordIds.push(sourceId);
      saveCustomCats();
      renderCustomCats();
    }
    sourceEl=null; sourceId=null; ghost=null;
  }
}

/* ===================== SENTENCES ===================== */
let SENT = { list: VOCAB_DATA.filter(w=>w.sentAr), idx:0, mode:'alle' };
let mediaRecorder=null, recordedChunks=[], lastRecordingUrl=null;

function openSentences(){
  const btns = document.querySelectorAll('[data-sentstyle]');
  btns.forEach(b=>b.addEventListener('click', ()=>{
    btns.forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    SENT.mode = b.dataset.sentstyle;
    SENT.list = SENT.mode==='quran'
      ? VOCAB_DATA.filter(w=>w.quran)
      : VOCAB_DATA.filter(w=>w.sentAr);
    SENT.idx = 0;
    renderSentence();
  }, {once:false}));
  renderSentence();
}

function renderSentence(){
  if (SENT.list.length===0){ document.getElementById('sentAr').textContent='Keine Sätze in dieser Auswahl.'; return; }
  const w = SENT.list[SENT.idx];
  document.getElementById('sentChapter').textContent = w.chapter==='personal'?'Eigene Vokabel':`Kap. ${w.chapter}`;
  document.getElementById('sentAr').textContent = w.sentAr;
  document.getElementById('sentDe').textContent = w.sentDe || '';
  document.getElementById('sentPos').textContent = `${SENT.idx+1} / ${SENT.list.length}`;

  const qBox = document.getElementById('sentQuranBox');
  if (w.quran && SENT.mode!=='quran'){
    qBox.classList.remove('hidden');
    document.getElementById('sentQuranAr').textContent = w.quran.ar;
    document.getElementById('sentQuranRef').textContent = `${w.quran.surah} ${w.quran.ayah}`;
  } else qBox.classList.add('hidden');

  document.getElementById('btnSentPlay').classList.add('hidden');
  document.getElementById('recordStatus').textContent = '';
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

document.getElementById('btnSentRecord').addEventListener('click', async ()=>{
  const btn = document.getElementById('btnSentRecord');
  if (mediaRecorder && mediaRecorder.state==='recording'){
    mediaRecorder.stop();
    return;
  }
  try{
    const stream = await navigator.mediaDevices.getUserMedia({audio:true});
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = e => recordedChunks.push(e.data);
    mediaRecorder.onstop = ()=>{
      btn.classList.remove('recording');
      const blob = new Blob(recordedChunks, {type:'audio/webm'});
      if (lastRecordingUrl) URL.revokeObjectURL(lastRecordingUrl);
      lastRecordingUrl = URL.createObjectURL(blob);
      document.getElementById('btnSentPlay').classList.remove('hidden');
      document.getElementById('recordStatus').textContent = 'Aufnahme fertig - zum Anhören ▶️ tippen';
      stream.getTracks().forEach(t=>t.stop());
    };
    mediaRecorder.start();
    btn.classList.add('recording');
    document.getElementById('recordStatus').textContent = 'Aufnahme läuft... nochmal tippen zum Stoppen';
  }catch(err){
    toast('Mikrofon-Zugriff nicht möglich: '+err.message);
  }
});
document.getElementById('btnSentPlay').addEventListener('click', ()=>{
  if (lastRecordingUrl){ const a = new Audio(lastRecordingUrl); a.play(); }
});

/* ===================== QURAN LIST ===================== */
function renderQuranList(){
  const words = VOCAB_DATA.filter(w=>w.quran);
  document.getElementById('quranList').innerHTML = words.map(w=>`
    <div class="word-list-item" style="flex-direction:column;align-items:flex-start;gap:8px;">
      <div style="display:flex;justify-content:space-between;width:100%;">
        <div class="wl-ar">${w.ar}</div><div class="wl-de">${w.de}</div>
      </div>
      <div style="font-family:var(--font-ar);direction:rtl;font-size:1.15rem;color:#fff;width:100%;text-align:right;">${w.quran.ar}</div>
      <div style="font-size:.78rem;color:var(--text-dim);">${w.quran.surah} ${w.quran.ayah} — ${w.quran.de||''}</div>
    </div>
  `).join('');
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
      <button class="hifz-check${HIFZ[s.id]?' on':''}" data-hifztoggle="${s.id}">✓</button>
    </div>`).join('') || '<p style="color:var(--text-dim)">Keine Sure gefunden.</p>';
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
  vList.innerHTML = '<div class="verse-loading">Lade Verse von quran.com…</div>';
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
    <div class="stat-card"><div class="v">${total}</div><div class="l">Vokabeln gesamt</div></div>
    <div class="stat-card"><div class="v">${mastered}</div><div class="l">In Box 5 (sicher)</div></div>
    <div class="stat-card"><div class="v">${acc}%</div><div class="l">Trefferquote (in dieser App)</div></div>
    <div class="stat-card"><div class="v">${getStreak().count}</div><div class="l">Tage-Streak 🔥</div></div>
  `;
  const boxCounts = [1,2,3,4,5].map(b => VOCAB_DATA.filter(w=>PROGRESS[w.id] && PROGRESS[w.id].box===b).length);
  document.getElementById('boxBars').innerHTML = boxCounts.map((n,i)=>`
    <div class="box-bar-row">
      <span class="bl">Box ${i+1}</span>
      <div class="box-bar-track"><div class="box-bar-fill" style="width:${total?Math.round(100*n/total):0}%"></div></div>
      <span class="bn">${n}</span>
    </div>`).join('');
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
