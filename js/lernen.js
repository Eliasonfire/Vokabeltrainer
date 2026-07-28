/* lernen.js -- Lernkarten, Wischgeste, Antwortlogik (SRS)
   Teil der App-Logik; wird in index.html in fester Reihenfolge geladen und
   teilt sich mit den uebrigen js/-Dateien den globalen Namensraum. */
/* ===================== LEARN / FLASHCARDS ===================== */
let SESSION = { words:[], idx:0, dirs:[], fertig:true };

function startLearningSession(){
  let words = currentPool();
  if (words.length === 0){ toast(SETTINGS.wrongOnly ? 'Keine schwachen Wörter mit dieser Auswahl – stark!' : 'Nichts fällig – schau später wieder vorbei.'); showScreen('home'); return; }
  const size = SETTINGS.sessionSize;
  if (size < words.length) words = words.slice(0, size);
  SESSION = { words, idx:0, dirs:[], fertig:false };
  showScreen('learn');
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

  /* Geschlecht auf der Rueckseite (arabicroots-Paritaet D). Nur wo es etwas
     aussagt: Partikeln wie فِي oder هَلْ haben keins, dort steht in den Daten
     `null` - und ein leerer Platzhalter waere schlechter als gar keiner. */
  const genusEl = document.getElementById('cardGender');
  const GENUS = {
    masculine: { ar: 'مُذَكَّر', de: 'männlich', farbe: 'var(--gram-mubtada)' },
    feminine:  { ar: 'مُؤَنَّث', de: 'weiblich',  farbe: 'var(--gram-fem)' }
  };
  const genus = GENUS[w.gender];
  if (genus){
    genusEl.innerHTML = `<span class="ar" lang="ar" dir="rtl">${genus.ar}</span><span class="de">${genus.de}</span>`;
    genusEl.style.setProperty('--gender-role', genus.farbe);
    genusEl.classList.remove('hidden');
  } else {
    genusEl.classList.add('hidden');
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

  renderNotiz(w);

  document.getElementById('learnCount').textContent = `${SESSION.idx+1}/${SESSION.words.length}`;
  document.getElementById('learnProgressFill').style.width = `${(SESSION.idx/SESSION.words.length)*100}%`;

  renderQuranFreqBadge(w);
}

/* ---------- Quran-Vorkommen (Wurzel-Häufigkeit, aus dem Quranic Arabic Corpus) ---------- */
/* QURAN_FREQ[Wurzel] = [Anzahl, [[Sure, Vers], ...]]. Der Surenname stand
   frueher bei jedem einzelnen Vers ausgeschrieben in der Datei; seit die
   Tabelle alle acht Lehrwerke abdeckt (1038 statt 92 Wurzeln) waere das die
   dreifache Dateigroesse fuer dieselbe Information. Er kommt jetzt aus
   surah-data.js. */
function surenName(nr){
  const s = (typeof SURAH_DATA!=='undefined') && SURAH_DATA.find(x=>x.id===nr);
  return s ? (s.name || `Sure ${nr}`) : `Sure ${nr}`;
}

function renderQuranFreqBadge(w){
  const badge = document.getElementById('cardQuranFreq');
  const root = w.root && (typeof QURAN_FREQ!=='undefined') ? w.root.replace(/\s+/g,'') : null;
  const freq = root && QURAN_FREQ[root];
  if (!freq){ badge.classList.add('hidden'); return; }
  badge.innerHTML = `${icon('crescent')}<span>${freq[0]}× im Quran</span>`;
  badge.classList.remove('hidden');
  badge.onclick = (e)=>{ e.stopPropagation(); openQuranFreqPopover(w, freq); };
}

function openQuranFreqPopover(w, freq){
  const [anzahl, verse] = freq;
  const shown = verse.slice(0, 10);
  document.getElementById('qfpTitle').innerHTML = `${icon('crescent')} <span lang="ar" dir="rtl">${escapeHtml(w.ar)}</span> im Quran (${anzahl}×)`;
  document.getElementById('qfpList').innerHTML = shown.map(([sura, ayah])=>`
    <div class="qfp-item"><span class="qfp-ref">${sura}:${ayah}</span> — ${escapeHtml(surenName(sura))}</div>
  `).join('') + (anzahl > shown.length ? `<div class="qfp-note">Erste ${shown.length} von ${anzahl} Fundstellen</div>` : '');
  document.getElementById('qfpBackdrop').classList.remove('hidden');
  document.getElementById('quranFreqPopover').classList.remove('hidden');
}
function closeQuranFreqPopover(){
  document.getElementById('qfpBackdrop').classList.add('hidden');
  document.getElementById('quranFreqPopover').classList.add('hidden');
}
document.getElementById('qfpBackdrop').addEventListener('click', closeQuranFreqPopover);
document.getElementById('btnCloseQuranFreq').addEventListener('click', closeQuranFreqPopover);

/* ---------- Eigene Eselsbruecke pro Vokabel (arabicroots-Paritaet D) ---------- */
function renderNotiz(w){
  const kasten = document.getElementById('cardNoteBox');
  const text   = document.getElementById('cardNoteText');
  const punkt  = document.getElementById('cardNoteDot');
  const notiz  = getNote(w.id);
  text.textContent = notiz || 'Eselsbrücke hinzufügen';
  kasten.classList.toggle('hat-notiz', !!notiz);
  /* Der Punkt sitzt auf der VORDERSEITE. Er verraet die Loesung nicht, sagt
     aber "zu diesem Wort hast du dir schon etwas notiert" - genau der Hinweis,
     den man beim Ueberlegen brauchen kann. */
  punkt.classList.toggle('hidden', !notiz);
}

function oeffneNotizEditor(){
  const w = SESSION.words[SESSION.idx];
  if (!w) return;
  document.getElementById('neWort').textContent = w.ar;
  const feld = document.getElementById('neText');
  feld.value = getNote(w.id);
  document.getElementById('btnDeleteNote').style.visibility = getNote(w.id) ? 'visible' : 'hidden';
  document.getElementById('noteBackdrop').classList.remove('hidden');
  document.getElementById('noteEditor').classList.remove('hidden');
  feld.focus();
}
function schliesseNotizEditor(){
  document.getElementById('noteBackdrop').classList.add('hidden');
  document.getElementById('noteEditor').classList.add('hidden');
}
document.getElementById('cardNoteBox').addEventListener('click', (e)=>{
  e.stopPropagation();          // sonst dreht sich die Karte gleich mit um
  oeffneNotizEditor();
});
document.getElementById('btnCloseNote').addEventListener('click', schliesseNotizEditor);
document.getElementById('noteBackdrop').addEventListener('click', schliesseNotizEditor);
document.getElementById('btnSaveNote').addEventListener('click', ()=>{
  const w = SESSION.words[SESSION.idx];
  setNote(w.id, document.getElementById('neText').value);
  renderNotiz(w);
  schliesseNotizEditor();
  toast(getNote(w.id) ? 'Eselsbrücke gespeichert.' : 'Eselsbrücke entfernt.');
});
document.getElementById('btnDeleteNote').addEventListener('click', ()=>{
  const w = SESSION.words[SESSION.idx];
  setNote(w.id, '');
  renderNotiz(w);
  schliesseNotizEditor();
  toast('Eselsbrücke entfernt.');
});

let __suppressCardClick = false;
document.getElementById('flashcard').addEventListener('click', (e)=>{
  if (e.target.id === 'btnSpeakWord') return;
  if (e.target.closest('#cardNoteBox')) return;   // hat einen eigenen Klick
  if (__suppressCardClick){ __suppressCardClick = false; return; }
  document.getElementById('flashcard').classList.toggle('flipped');
});
document.getElementById('btnSpeakWord').addEventListener('click', (e)=>{
  e.stopPropagation();
  speakArabic(SESSION.words[SESSION.idx].ar);
});
/* Das X beendet die Runde bewusst - danach startet "Lernen" wieder eine neue. */
document.getElementById('btnExitLearn').addEventListener('click', ()=>{
  SESSION.fertig = true;
  /* Auch beim vorzeitigen Abbrechen pruefen - wer die letzte schwache Vokabel
     richtig hatte und dann abbricht, soll den Modus nicht angeschaltet
     zuruecklassen. */
  pruefeNurFalscheModus();
  showScreen('home', { ersetzen: true });
});

/* ---------- Swipe-Gesten (rechts=richtig, links=falsch) ---------- */
(function setupSwipe(){
  const card = document.getElementById('flashcard');
  const hintR = document.getElementById('swipeHintRight');
  const hintL = document.getElementById('swipeHintLeft');
  let startX=0, startY=0, dx=0, dragging=false, achse=null, zeiger=null;

  card.addEventListener('pointerdown', (e)=>{
    startX=e.clientX; startY=e.clientY; dx=0; dragging=true; achse=null;
    /* Den Zeiger einfangen: sonst landet das pointerup auf dem Element, ueber
       dem der Finger gerade ist, sobald er die Karte verlaesst - und das
       passiert bei 90px Schwelle staendig. endDrag laeuft dann nie, die Karte
       bleibt schraeg stehen und die naechste Beruehrung wirkt wie ein Klick. */
    zeiger = e.pointerId;
    try { card.setPointerCapture(zeiger); } catch(_){}
  });
  card.addEventListener('pointermove', (e)=>{
    if (!dragging) return;
    const dxRoh = e.clientX - startX;
    const dy = e.clientY - startY;
    /* Richtung einmal festlegen und dann dabei bleiben. Vorher wurde dx auch
       bei einer senkrechten Bewegung mitgezaehlt; eine schraege Wischbewegung
       zum Scrollen konnte am Ende ueber der Schwelle landen und eine Vokabel
       ungefragt als richtig oder falsch verbuchen. */
    if (!achse && (Math.abs(dxRoh) > 10 || Math.abs(dy) > 10)){
      achse = Math.abs(dxRoh) > Math.abs(dy) ? 'x' : 'y';
    }
    if (achse !== 'x') return;
    dx = dxRoh;
    card.classList.add('swiping');
    card.style.transform = `translateX(${dx}px) rotate(${dx/22}deg)`;
    hintR.classList.toggle('show', dx>40);
    hintL.classList.toggle('show', dx<-40);
  });
  function endDrag(e){
    if (!dragging) return;
    dragging=false;
    if (zeiger !== null){ try { card.releasePointerCapture(zeiger); } catch(_){} zeiger = null; }
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
  /* Zusaetzlich am Fenster, nicht nur an der Karte. setPointerCapture kann
     fehlschlagen (aeltere WebViews, oder der Browser hat den Zeiger schon fuer
     eine eigene Geste beansprucht). Ohne diesen zweiten Weg bliebe die Karte
     dann schraeg stehen, weil das pointerup nie bei ihr ankommt. endDrag
     laeuft durch das dragging-Flag hoechstens einmal. */
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
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
      SESSION.fertig = true;
      /* Erst pruefen, ob der "nur falsche"-Modus jetzt leer ist: dessen
         Meldung ist die wichtigere und soll nicht vom "Runde geschafft"
         ueberschrieben werden. */
      if (!pruefeNurFalscheModus()) toast('Runde geschafft!');
      /* Beendete Runde ersetzt den Lern-Eintrag in der Historie, statt einen
         neuen anzulegen - sonst landet die Zurueck-Taste auf einer Runde,
         die es nicht mehr gibt. */
      setTimeout(()=>showScreen('home', { ersetzen: true }), 900);
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

