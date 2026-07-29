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
  renderWortfeldCats();
  renderCustomCats();
}

function renderChapterCats(){
  /* Die Kapitelliste kommt jetzt aus dem aktiven Buch - fest 1-9 stimmte nur
     fuer Madina 1 und auch dort nur fuer die freigeschalteten Kapitel. */
  const chapters = [...kapitelDesBuchs(), 'personal'];
  const html = chapters.map(ch=>{
    const words = buchVokabeln().filter(w=>w.chapter===ch);
    const name = CHAPTER_NAMES[ch] || `Kapitel ${ch}`;
    const label = ch==='personal' ? `${icon('note')}<span>${name}</span>` : `<span>Kap. ${ch} — ${name}</span>`;
    return `<div class="list-row" data-openlist="chapter:${ch}">
      <div class="list-row-title">${label}</div>
      <div class="list-row-count">${words.length}</div>
    </div>`;
  }).join('');
  document.getElementById('catPane-chapters').innerHTML = html;
}

/* Wortfelder statt Wurzeln (Elias, 29.07.2026: "3 random arabische Buchstaben
   machen fuer mich als Wortstamm keinen Sinn"). Die Reihenfolge kommt aus
   wortfelder-data.js und ist bewusst NICHT nach Groesse sortiert: dort stehen
   erst die Wortarten, dann die Sachgebiete - eine Sortierung nach Anzahl
   wuerfelte "Verben" und "Farben" beliebig durcheinander.
   "Noch ohne Wortfeld" haengt sich hinten an und wird gedaempft dargestellt. */
function renderWortfeldCats(){
  const felder = wortfelder();
  const reihenfolge = (typeof WORTFELDER !== 'undefined') ? WORTFELDER.map(f=>f.name) : [];
  const namen = reihenfolge.filter(n => felder[n] && felder[n].length);
  if (felder[OHNE_WORTFELD]) namen.push(OHNE_WORTFELD);
  document.getElementById('catPane-roots').innerHTML = namen.map(name=>{
    const ids = felder[name];
    const rest = name === OHNE_WORTFELD;
    return `<div class="list-row${rest ? ' list-row-rest' : ''}" data-openlist="feld:${name}">
      <div class="list-row-title"><span>${escapeHtml(name)}</span></div>
      <div class="list-row-count">${ids.length}</div>
    </div>`;
  }).join('') || '<div class="empty-state">Für dieses Buch sind noch keine Wortfelder belegt.</div>';
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
  const pool = buchVokabeln().filter(w=>!assigned.has(w.id));
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
    words = buchVokabeln().filter(w=>w.chapter===chNum);
    /* CHAPTER_NAMES benennt nur die neun Kapitel aus Madina 1, zu denen eine
       belegte Grammatikregel vorliegt. Fuer alle uebrigen bleibt die Nummer -
       einen Namen zu erfinden verbietet E.1. */
    const kapName = CHAPTER_NAMES[chNum];
    title = ch==='personal' ? 'Eigene Vokabeln' : (kapName ? `Kapitel ${ch} — ${kapName}` : `Kapitel ${ch}`);
  } else if (key.startsWith('feld:')){
    /* Nicht an ':' zerlegen und das zweite Stueck nehmen - Feldnamen duerfen
       ein '&' und theoretisch auch weitere Zeichen enthalten ("Familie &
       Menschen"). Nur das Praefix abschneiden. */
    const name = key.slice('feld:'.length);
    const ids = new Set(wortfelder()[name] || []);
    words = buchVokabeln().filter(w=>ids.has(w.id));
    title = name;
  } else if (key.startsWith('cat:')){
    const cat = CUSTOM_CATS.find(c=>c.id===key.split(':')[1]);
    words = cat ? cat.wordIds.map(byId).filter(Boolean) : [];
    title = cat ? cat.name : 'Kategorie';
  } else if (key.startsWith('box:')){
    const boxNum = Number(key.split(':')[1]);
    words = buchVokabeln().filter(w=>PROGRESS[w.id] && PROGRESS[w.id].box===boxNum);
    title = `Box ${boxNum}`;
  } else if (key==='quran'){
    words = buchVokabeln().filter(w=>w.quran);
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

/* ---------- Drag & Drop (Pointer Events, touch + mouse) ----------

   Seit dem 29.07.2026 mit HALTEN statt Sofortstart. Elias' Meldung:

     "Bei den eigenen Kategorien kann ich kaum die Liste runter wischen auf
      meinem Handy weil ich dauernd auf die Wörter klicke und sie so automatisch
      auswähle. Es wäre gut, wenn ich die Wörter für einen Moment halten muss
      und erst dann wird das Wort ausgewählt, sonst kann man nicht runter
      wischen die Wörter Liste."

   Warum das vorher unvermeidlich war: `startDrag` lief am `pointerdown` und
   rief sofort `e.preventDefault()`. Damit war JEDE Beruehrung eines Worts ein
   Ziehvorgang - und weil preventDefault dem Browser das Rollen verbietet, blieb
   die Liste stehen. Die Wortliste ist auf 38vh gedeckelt und rollt, es gibt
   also gar keinen Weg daran vorbei.

   Jetzt: Der Zeiger wird zwar sofort verfolgt, aber erst nach HALTEN_MS
   wird daraus ein Ziehvorgang. Wer vorher mehr als HALTEN_WEG Pixel bewegt,
   wollte rollen - der Zeitgeber wird verworfen und der Browser behaelt die
   Geste. Bis dahin wird NICHTS unterdrueckt.

   400 ms ist der Wert, den Android fuer den langen Druck selbst benutzt
   (ViewConfiguration.getLongPressTimeout); wer das Geraet kennt, kennt das
   Gefuehl. 10 Pixel entsprechen der Achsenschwelle der Wischgeste in
   js/lernen.js - dieselbe Frage, dieselbe Antwort. */
const HALTEN_MS = 400;
const HALTEN_WEG = 10;

function setupDragAndDrop(){
  let ghost=null, sourceEl=null, sourceId=null;
  let warten=null, startX=0, startY=0;

  document.querySelectorAll('.word-chip').forEach(chip=>{
    chip.addEventListener('pointerdown', druckBeginnt);
  });

  function druckAbbrechen(){
    if (warten){ clearTimeout(warten); warten = null; }
    if (sourceEl && !ghost) sourceEl.classList.remove('haltend');
    document.removeEventListener('pointermove', beobachte);
    document.removeEventListener('pointerup', druckAbbrechen);
    document.removeEventListener('pointercancel', druckAbbrechen);
    if (!ghost){ sourceEl = null; sourceId = null; }
  }

  function beobachte(e){
    if (Math.abs(e.clientX-startX) > HALTEN_WEG || Math.abs(e.clientY-startY) > HALTEN_WEG)
      druckAbbrechen();                 // das war Rollen, kein Auswaehlen
  }

  function druckBeginnt(e){
    const chip = e.currentTarget;
    startX = e.clientX; startY = e.clientY;
    sourceEl = chip;
    sourceId = chip.getAttribute('draggable-id');
    chip.classList.add('haltend');
    /* KEIN preventDefault hier - sonst rollt die Liste wieder nicht. */
    document.addEventListener('pointermove', beobachte);
    document.addEventListener('pointerup', druckAbbrechen);
    document.addEventListener('pointercancel', druckAbbrechen);
    warten = setTimeout(()=>{
      warten = null;
      document.removeEventListener('pointermove', beobachte);
      document.removeEventListener('pointerup', druckAbbrechen);
      document.removeEventListener('pointercancel', druckAbbrechen);
      startDrag(e.clientX, e.clientY);
    }, HALTEN_MS);
  }

  function startDrag(x, y){
    if (!sourceEl) return;
    ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    ghost.textContent = sourceEl.textContent;
    document.body.appendChild(ghost);
    moveGhost(x, y);
    sourceEl.classList.remove('haltend');
    sourceEl.classList.add('dragging');
    /* Kurzes Rueckmelden, dass der Druck angekommen ist - auf dem Handy sieht
       man den Ziehschatten sonst erst, wenn man sich schon bewegt. */
    if (navigator.vibrate) { try { navigator.vibrate(12); } catch(_){} }
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp, {once:true});
  }
  function moveGhost(x,y){ if(ghost){ ghost.style.left = (x-30)+'px'; ghost.style.top = (y-20)+'px'; } }
  function onMove(e){
    /* Erst AB HIER unterdruecken, also nachdem der lange Druck durch ist.
       Waehrend des Wartens wuerde dasselbe preventDefault genau den Fehler
       zurueckholen, den der lange Druck behebt. */
    e.preventDefault();
    moveGhost(e.clientX, e.clientY);
    document.querySelectorAll('.custom-cat-box').forEach(b=>b.classList.remove('drop-hover'));
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const box = el && el.closest('.custom-cat-box');
    if (box) box.classList.add('drop-hover');
  }
  function onUp(e){
    document.removeEventListener('pointermove', onMove);
    if (ghost) ghost.remove();
    if (sourceEl) sourceEl.classList.remove('dragging','haltend');
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

