/* kategorien.js -- Kategorien, Wortliste, Ziehen und Ablegen
   Teil der App-Logik; wird in index.html in fester Reihenfolge geladen und
   teilt sich mit den uebrigen js/-Dateien den globalen Namensraum. */
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
document.getElementById('btnWordlistBack').addEventListener('click', geheZurueck);
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

