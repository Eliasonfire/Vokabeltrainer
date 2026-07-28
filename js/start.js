/* start.js -- Startbildschirm
   Teil der App-Logik; wird in index.html in fester Reihenfolge geladen und
   teilt sich mit den uebrigen js/-Dateien den globalen Namensraum. */
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

