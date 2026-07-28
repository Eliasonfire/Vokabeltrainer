/* navigation.js -- Bildschirmwechsel und Verlauf
   Teil der App-Logik; wird in index.html in fester Reihenfolge geladen und
   teilt sich mit den uebrigen js/-Dateien den globalen Namensraum. */
/* ===================== Navigation =====================
   Jeder Bildschirmwechsel legt einen Eintrag in der Browser-Historie ab.
   Ohne das kannte der Browser nur EINEN Zustand: die Zurueck-Taste des Handys
   hat dann die ganze App verlassen, statt einen Schritt zurueckzugehen - und
   eine laufende Lernrunde war weg. */
function zeigeBildschirm(name){
  /* Lernbildschirm ohne laufende Runde ergibt keinen Sinn (z.B. wenn man per
     Zurueck-Taste dorthin zurueckkehrt, nachdem die Runde beendet wurde). */
  if (name === 'learn' && !(SESSION.words.length && !SESSION.fertig)) name = 'home';

  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const el = document.getElementById('screen-'+name);
  if (el) el.classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  const navMap = {home:'home', learn:'learn-entry', categories:'categories', sentences:'sentences', stats:'stats', wordlist:'categories', quran:'home', quranfull:'home', hoeren:'home', settings:'home'};
  const navName = navMap[name] || name;
  document.querySelectorAll(`.nav-btn[data-nav="${navName}"]`).forEach(b=>b.classList.add('active'));
  if (name==='home') renderHome();
  if (name==='learn') renderCard();          // laufende Runde an derselben Karte fortsetzen
  if (name==='categories') renderCategories();
  if (name==='sentences') openSentences();
  if (name==='quran') renderQuranList();
  if (name==='hoeren') openHoeren();
  if (name==='quranfull') renderSurahList(document.getElementById('surahSearch').value);
  if (name==='stats') renderStats();
  if (name==='settings') renderSettings();
  window.scrollTo(0,0);
  return name;
}

function showScreen(name, opt){
  opt = opt || {};
  const aktiv = document.querySelector('.screen.active');
  const schonDa = !!aktiv && aktiv.id === 'screen-' + name;
  const gezeigt = zeigeBildschirm(name);

  if (opt.ausHistorie) return;               // von popstate ausgeloest, nichts ablegen
  const tiefe = (history.state && typeof history.state.tiefe === 'number') ? history.state.tiefe : 0;
  if (opt.ersetzen || schonDa){
    history.replaceState({ screen: gezeigt, tiefe }, '');
  } else {
    history.pushState({ screen: gezeigt, tiefe: tiefe + 1 }, '');
  }
}

/* Zurueck-Taste des Geraets: innerhalb der App navigieren statt sie zu verlassen. */
window.addEventListener('popstate', (e)=>{
  const ziel = (e.state && e.state.screen) || 'home';
  showScreen(ziel, { ausHistorie: true });
});

/* Der Zurueck-Pfeil in der App verhaelt sich genauso wie die Geraetetaste -
   er geht einen Schritt zurueck, nicht stur zur Startseite. */
function geheZurueck(){
  const tiefe = (history.state && history.state.tiefe) || 0;
  if (tiefe > 0) history.back();
  else showScreen('home', { ersetzen: true });
}

document.addEventListener('click', (e)=>{
  if (e.target.closest('[data-back]')){ geheZurueck(); return; }
  const navBtn = e.target.closest('[data-nav]');
  if (navBtn){
    const target = navBtn.dataset.nav;
    if (target === 'learn-entry'){
      /* Laufende Runde fortsetzen statt neu zu starten - sonst geht der
         Fortschritt der aktuellen Runde verloren, sobald man kurz woanders war. */
      if (SESSION.words.length && !SESSION.fertig) showScreen('learn');
      else startLearningSession();
      return;
    }
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

