/* quran.js -- Quran-Bezug und vollstaendiger Quran-Leser
   Teil der App-Logik; wird in index.html in fester Reihenfolge geladen und
   teilt sich mit den uebrigen js/-Dateien den globalen Namensraum. */
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
  /* Innerhalb des Readers ist die Versliste eine eigene Ebene: erst dorthin
     zurueck, danach erst den Bildschirm verlassen. */
  if (!document.getElementById('verseList').classList.contains('hidden')) renderSurahList(document.getElementById('surahSearch').value);
  else geheZurueck();
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

/* Der Korantext (2,3 MB) wird NICHT beim App-Start geladen, sondern erst wenn
   der Quran-Leser das erste Mal geoeffnet wird. Danach liegt er im Speicher und
   dank Service Worker auch im Cache - ab dann funktioniert der Leser offline. */
let QURAN_TEXT_PROMISE = null;
function ladeQuranText(){
  if (typeof QURAN_TEXT !== 'undefined') return Promise.resolve(QURAN_TEXT);
  if (QURAN_TEXT_PROMISE) return QURAN_TEXT_PROMISE;
  QURAN_TEXT_PROMISE = new Promise((erfuellen, ablehnen)=>{
    const s = document.createElement('script');
    s.src = 'quran-text.js';
    s.onload = ()=> erfuellen(typeof QURAN_TEXT !== 'undefined' ? QURAN_TEXT : null);
    s.onerror = ()=>{ QURAN_TEXT_PROMISE = null; ablehnen(new Error('quran-text.js nicht ladbar')); };
    document.head.appendChild(s);
  });
  return QURAN_TEXT_PROMISE;
}

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
     "steht" sofort, auch waehrend der Text noch laedt. */
  vList.innerHTML =
    '<div class="verse-loading">Lade Verse…</div>' +
    Array.from({length:5}, ()=>`
      <div class="verse-skeleton">
        <div class="skeleton sk-line" style="width:54px;height:18px;"></div>
        <div class="skeleton sk-line sk-ar"></div>
        <div class="skeleton sk-line sk-de"></div>
      </div>`).join('');
  try{
    const text = await ladeQuranText();
    if (!text || !text[id]) throw new Error('Sure nicht im lokalen Text');
    VERSE_CACHE[id] = text[id].map(([ar, de], i) => ({
      verse_key: `${id}:${i+1}`, text_uthmani: ar, translations: [{ text: de }]
    }));
    renderVerses(id);
  }catch(err){
    /* Rueckfallebene: wenn die lokale Datei fehlt oder beschaedigt ist, holt die
       App die Verse wie frueher von quran.com. Dann braucht sie aber Internet. */
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
    }catch(err2){
      vList.innerHTML = `<div class="verse-loading">Verse konnten nicht geladen werden.<br>${err2.message}</div>`;
    }
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

