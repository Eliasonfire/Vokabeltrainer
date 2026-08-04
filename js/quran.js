/* quran.js -- Quran-Bezug und vollstaendiger Quran-Leser
   Teil der App-Logik; wird in index.html in fester Reihenfolge geladen und
   teilt sich mit den uebrigen js/-Dateien den globalen Namensraum. */
/* ===================== QURAN LIST ===================== */
function renderQuranList(){
  /* Nur das aktive Buch. Sonst stuenden hier nach dem ersten Buchwechsel
     Vokabeln aus Buechern, die gerade nicht gelernt werden. */
  const words = buchVokabeln().filter(w=>w.quran);
  /* Das gesuchte Wort wird auch HIER hervorgehoben, nicht nur auf der Lernkarte.
     Elias' Wunsch vom 29.07.2026 lautete "beim Koranbezug soll das Wort, um das
     es geht, hervorgehoben oder unterstrichen werden" - er hat dabei keinen
     Bildschirm ausgenommen. Am 30.07. nachgemessen: in dieser Liste stand kein
     einziges `.quran-treffer`-Element, die Hervorhebung gab es nur auf der
     Karte. Nebenwirkung, die einen Fehler mitnimmt: quranMitTreffer maskiert
     den Text, vorher stand `${w.quran.ar}` unmaskiert im innerHTML. */
  document.getElementById('quranList').innerHTML = words.map(w=>`
    <div class="word-list-item quran-word-item">
      <div class="quran-word-head">
        <div class="wl-ar">${escapeHtml(w.ar)}</div><div class="wl-de">${escapeHtml(w.de)}</div>
      </div>
      <div class="quran-word-verse" lang="ar" dir="rtl">${quranMitTreffer(w.quran.ar, w)}</div>
      <div class="quran-word-ref">${escapeHtml(w.quran.surah)} ${escapeHtml(w.quran.ayah)}${w.quran.de ? ' — ' + escapeHtml(w.quran.de) : ''}</div>
    </div>
  `).join('') || '<div class="empty-state">Noch keine geprüften Quran-Bezüge.</div>';
}

/* ===================== FULL QURAN READER ===================== */
/* Hifz auf zwei Ebenen. `vt_hifz` merkt sich, welche SUREN Elias als auswendig
   markiert hat - das gab es schon. Neu ist `vt_hifzVerse`: einzelne Verse,
   Schluessel "Sure:Vers". Al-Baqarah hat 286 Verse; ein einziger Haken fuer
   die ganze Sure bildet Auswendiglernen nicht ab, das geht Vers fuer Vers.
   Bewusst zwei getrennte Speicher: wer eine ganze Sure abhakt, will nicht
   286 Einzeleintraege erzeugt bekommen, und wer einzelne Verse abhakt, will
   den Surenhaken nicht ungefragt gesetzt sehen. */
let HIFZ = LS.get('vt_hifz', {});
function saveHifz(){ LS.set('vt_hifz', HIFZ); }
let HIFZ_VERSE = LS.get('vt_hifzVerse', {});
function saveHifzVerse(){ LS.set('vt_hifzVerse', HIFZ_VERSE); }
function kannVers(sure, vers){ return !!HIFZ_VERSE[`${sure}:${vers}`]; }
function zaehleVerse(sure){
  const prefix = sure + ':';
  return Object.keys(HIFZ_VERSE).filter(k => k.startsWith(prefix) && HIFZ_VERSE[k]).length;
}
/* Der Verdecken-Modus gilt nur fuer die gerade offene Sure und wird bewusst
   NICHT gespeichert - beim naechsten Aufschlagen will man erst mal lesen. */
let HIFZ_VERDECKT = false;

const VERSE_CACHE = {};

/* Favoriten-Suren. Elias am 04.08.2026: "Es waere gut wenn ich beim Quran lesen
   eine Favoriten Liste ueber der normalen Quran Liste haette. Dann muesste ich
   nicht immer ganz nach unten scrollen fuer die kleineren suren die fuer mich
   aktuell relevant sind."

   Eigener Speicher, nicht in HIFZ mit hineingerechnet: "ich lerne das gerade"
   und "ich kann das auswendig" sind zwei verschiedene Aussagen. Eine kurze Sure
   kann Favorit sein, WEIL sie noch nicht sitzt. */
let QURAN_FAV = LS.get('vt_quranFav', {});
function saveQuranFav(){ LS.set('vt_quranFav', QURAN_FAV); }
function istFavorit(id){ return !!QURAN_FAV[id]; }

/* Eine Zeile der Surenliste. Als eigene Funktion, damit Favoritenblock und
   Gesamtliste garantiert gleich aussehen - zwei Vorlagen waeren zwei Stellen,
   die auseinanderlaufen koennen. */
function surahZeile(s){
  /* Wer einzelne Verse abgehakt hat, soll das in der Uebersicht sehen -
     sonst wirkt die Sure unangetastet, obwohl schon die Haelfte sitzt. */
  const einzeln = zaehleVerse(s.id);
  const zusatz = HIFZ[s.id] ? '' : (einzeln ? ` · ${einzeln} von ${s.verses} auswendig` : '');
  const fav = istFavorit(s.id);
  return `
    <div class="surah-row" data-opensurah="${s.id}">
      <div class="sr-num">${s.id}</div>
      <div class="sr-mid"><div class="sr-ar">${s.ar}</div><div class="sr-name">${s.name} · ${s.verses} Verse${zusatz}</div></div>
      <div class="sr-knoepfe">
        <button class="fav-stern${fav?' on':''}" data-favtoggle="${s.id}"
                aria-pressed="${fav}" aria-label="${s.name} zu den Favoriten">${icon('stern')}</button>
        <button class="hifz-check${HIFZ[s.id]?' on':''}" data-hifztoggle="${s.id}" aria-label="Ganze Sure als auswendig markieren">${icon('check')}</button>
      </div>
    </div>`;
}

/* Der Favoritenblock wird bei einer Suche ausgeblendet: wer sucht, will die
   Treffer sehen: ein Block darueber, der nicht mitfiltert, waere dann nur eine
   zweite Liste im Weg. */
function renderFavListe(suchend){
  const block = document.getElementById('surahFavBlock');
  if (!block) return;
  const favs = SURAH_DATA.filter(s => istFavorit(s.id));
  block.classList.toggle('hidden', suchend || !favs.length);
  if (suchend || !favs.length) return;
  document.getElementById('surahFavList').innerHTML = favs.map(surahZeile).join('');
}

function renderSurahList(filter){
  const q = (filter||'').trim().toLowerCase();
  const list = SURAH_DATA.filter(s => !q || s.name.toLowerCase().includes(q) || s.ar.includes(q) || String(s.id)===q);
  document.getElementById('quranFullTitle').textContent = 'Quran lesen';
  document.getElementById('quranFullIntro').classList.remove('hidden');
  document.getElementById('surahSearch').classList.remove('hidden');
  document.getElementById('surahList').classList.remove('hidden');
  document.getElementById('verseList').classList.add('hidden');
  document.getElementById('hifzBar').classList.add('hidden');
  renderFavListe(!!q);
  document.getElementById('surahList').innerHTML =
    list.map(surahZeile).join('') || '<div class="empty-state">Keine Sure gefunden.</div>';
}

document.getElementById('surahSearch').addEventListener('input', (e)=> renderSurahList(e.target.value));
document.getElementById('btnQuranFullBack').addEventListener('click', ()=>{
  /* Innerhalb des Readers ist die Versliste eine eigene Ebene: erst dorthin
     zurueck, danach erst den Bildschirm verlassen. */
  if (!document.getElementById('verseList').classList.contains('hidden')) renderSurahList(document.getElementById('surahSearch').value);
  else geheZurueck();
});
/* Ein Klick auf eine Surenzeile - derselbe Ablauf in beiden Listen.
   ⚠️ Eine Sure kann GLEICHZEITIG in beiden stehen (im Favoritenblock oben und
   in der Gesamtliste unten). Ein Zustand darf deshalb nie nur an dem Knopf
   nachgezogen werden, den man gerade getroffen hat - sonst zeigt dieselbe Sure
   oben einen Haken und unten keinen. Darum immer ueber alle passenden Knoepfe. */
function surahKlick(e){
  const favBtn = e.target.closest('[data-favtoggle]');
  if (favBtn){
    const id = favBtn.dataset.favtoggle;
    if (QURAN_FAV[id]) delete QURAN_FAV[id]; else QURAN_FAV[id] = 1;
    saveQuranFav();
    const an = istFavorit(id);
    document.querySelectorAll(`[data-favtoggle="${id}"]`).forEach(b=>{
      b.classList.toggle('on', an);
      b.setAttribute('aria-pressed', String(an));
    });
    /* Nur den Favoritenblock neu bauen, nicht die Gesamtliste: die ist 114
       Zeilen lang, und ein Neuaufbau wuerfe die Rollposition weg - genau dann,
       wenn man gerade weit unten bei den kurzen Suren steht. */
    renderFavListe(!!document.getElementById('surahSearch').value.trim());
    return;
  }
  const hifzBtn = e.target.closest('[data-hifztoggle]');
  if (hifzBtn){
    const id = hifzBtn.dataset.hifztoggle;
    HIFZ[id] = !HIFZ[id];
    saveHifz();
    document.querySelectorAll(`[data-hifztoggle="${id}"]`).forEach(b=>b.classList.toggle('on', !!HIFZ[id]));
    return;
  }
  const row = e.target.closest('[data-opensurah]');
  if (row) openSurah(Number(row.dataset.opensurah));
}
document.getElementById('surahList').addEventListener('click', surahKlick);
document.getElementById('surahFavList').addEventListener('click', surahKlick);

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
  /* Der Favoritenblock gehoert zur Surenliste und muss mitverschwinden - sonst
     steht er ueber den Versen der geoeffneten Sure. */
  document.getElementById('surahFavBlock').classList.add('hidden');
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
  const surah = SURAH_DATA.find(s=>s.id===id);
  document.getElementById('verseList').innerHTML = verses.map((v, i) => {
    const nr = i + 1;
    const kann = HIFZ[id] || kannVers(id, nr);
    /* Verdeckt wird nur, was auch als auswendig markiert ist - alles andere
       zu verdecken waere kein Selbsttest, sondern nur laestig. */
    const verdeckt = HIFZ_VERDECKT && kann ? ' verdeckt' : '';
    /* Ist die ganze Sure abgehakt, waeren die einzelnen Kaestchen eine Luege:
       sie stuenden auf "an" und liessen sich anklicken, ohne dass sich etwas
       aendert - der Surenhaken sticht sie. Also ausgrauen und sagen warum. */
    const ganzeSure = !!HIFZ[id];
    return `
    <div class="verse-item${kann?' auswendig':''}">
      <div class="verse-kopf">
        <span class="verse-num">${v.verse_key}</span>
        <button class="hifz-check${kann?' on':''}" ${ganzeSure?'disabled title="Die ganze Sure ist abgehakt"':`data-versmerk="${id}:${nr}"`}
                aria-label="Vers ${nr} als auswendig markieren">${icon('check')}</button>
      </div>
      <div class="verse-ar${verdeckt}" lang="ar" dir="rtl">${v.text_uthmani}</div>
      <div class="verse-de">${(v.translations && v.translations[0] && v.translations[0].text) || ''}</div>
    </div>`; }).join('');
  aktualisiereHifzLeiste(id, surah);
}

function aktualisiereHifzLeiste(id, surah){
  const leiste = document.getElementById('hifzBar');
  leiste.classList.remove('hidden');
  const gesamt = surah ? surah.verses : (VERSE_CACHE[id] || []).length;
  const kann = HIFZ[id] ? gesamt : zaehleVerse(id);
  document.getElementById('hifzStand').textContent =
    HIFZ[id] ? `Ganze Sure abgehakt (${gesamt} Verse)`
    : kann === 0 ? `${gesamt} Verse`
    : kann >= gesamt ? `Alle ${gesamt} Verse auswendig`
    : `${kann} von ${gesamt} Versen auswendig`;
  const knopf = document.getElementById('btnHifzVerdecken');
  knopf.classList.toggle('active', HIFZ_VERDECKT);
  knopf.disabled = kann === 0;
  document.getElementById('hifzVerdeckenText').textContent =
    HIFZ_VERDECKT ? 'Wieder aufdecken' : 'Auswendige verdecken';
}

/* Einzelnen Vers abhaken. Kein Neuaufbau der ganzen Liste - bei Al-Baqarah
   waeren das 286 Verse, und die Seite wuerde bei jedem Haken springen. */
document.getElementById('verseList').addEventListener('click', (e)=>{
  const knopf = e.target.closest('[data-versmerk]');
  if (knopf){
    const key = knopf.dataset.versmerk;
    if (HIFZ_VERSE[key]) delete HIFZ_VERSE[key]; else HIFZ_VERSE[key] = 1;
    saveHifzVerse();
    const an = !!HIFZ_VERSE[key];
    knopf.classList.toggle('on', an);
    const karte = knopf.closest('.verse-item');
    karte.classList.toggle('auswendig', an);
    const text = karte.querySelector('.verse-ar');
    text.classList.toggle('verdeckt', HIFZ_VERDECKT && an);
    const id = Number(key.split(':')[0]);
    aktualisiereHifzLeiste(id, SURAH_DATA.find(s=>s.id===id));
    return;
  }
  /* Einen verdeckten Vers antippen deckt genau ihn auf - so prueft man sich
     Vers fuer Vers, ohne den Modus zu verlassen. */
  const text = e.target.closest('.verse-ar.verdeckt');
  if (text) text.classList.remove('verdeckt');
});

document.getElementById('btnHifzVerdecken').addEventListener('click', ()=>{
  HIFZ_VERDECKT = !HIFZ_VERDECKT;
  document.querySelectorAll('#verseList .verse-item').forEach(karte=>{
    const text = karte.querySelector('.verse-ar');
    text.classList.toggle('verdeckt', HIFZ_VERDECKT && karte.classList.contains('auswendig'));
  });
  const erste = document.querySelector('#verseList [data-versmerk]');
  const id = erste ? Number(erste.dataset.versmerk.split(':')[0]) : null;
  if (id) aktualisiereHifzLeiste(id, SURAH_DATA.find(s=>s.id===id));
});

