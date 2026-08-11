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

  /* ⚠️ Jeder Bildschirmwechsel faengt oben an - und das musste erst repariert
     werden, obwohl unten seit jeher `window.scrollTo(0,0)` stand.

     Der Rollkasten dieser App ist NICHT das Fenster, sondern #main. Im Browser
     nachgemessen: `body{overflow:hidden}`, das Dokument ist gar nicht rollbar
     (scrollHeight = innerHeight), #main dagegen sehr wohl (2588 gegen 798 px
     sichtbar). Die Zeile am Ende hat also nie etwas bewirkt - sie sah nur so
     aus, als taete sie es.

     Weil sich ALLE Bildschirme denselben Kasten teilen, blieb dessen Stand
     beim Wechsel stehen. Gemessen: Kategorien auf 600 px gerollt, dann zur
     Surenliste - die oeffnete bei 600, die erste Sure stand 224 px oberhalb
     des sichtbaren Bereichs. Genau das hat Elias am 11.08.2026 gemeldet:
     "wenn ich den quran öffne um zu lesen und bei den suren komme, dann bin
     ich nicht ganz oben in der liste sondern etwas weiter drunter und muss
     immer manuell nach oben scrollen".

     ⚠️ VOR den Render-Aufrufen darunter, nicht danach: renderSurahList()
     stellt beim Rueckweg aus einer Sure den gemerkten Listenstand wieder her.
     Stuende der Sprung nach oben danach, wuerde er genau diese Wiederherstellung
     wieder kaputtmachen - also den Fehler von v119 ein zweites Mal einbauen.

     ⚠️ scrollTo({behavior:'instant'}) und nicht `scrollTop = 0`: #main traegt
     `scroll-behavior:smooth`, das gilt auch fuer eine Zuweisung. Sonst faehrt
     die Liste bei jedem Wechsel sichtbar nach oben. */
  const rollkasten = document.getElementById('main');
  if (rollkasten) rollkasten.scrollTo({ top: 0, behavior: 'instant' });

  if (name==='home') renderHome();
  if (name==='learn') renderCard();          // laufende Runde an derselben Karte fortsetzen
  if (name==='categories') renderCategories();
  if (name==='sentences') openSentences();
  if (name==='quran') renderQuranList();
  if (name==='hoeren') openHoeren();
  if (name==='quranfull') renderSurahList(document.getElementById('surahSearch').value);
  if (name==='stats') renderStats();
  if (name==='settings') renderSettings();
  /* Hier stand `window.scrollTo(0,0)`. Ersatzlos gestrichen: das Fenster rollt
     in dieser App nicht, die Zeile war ohne Wirkung. Der wirksame Sprung steht
     jetzt weiter oben, vor den Render-Aufrufen. */
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
  const st = e.state || {};
  const ziel = st.screen || 'home';
  showScreen(ziel, { ausHistorie: true });
  /* Der Quran-Leser hat Ebenen INNERHALB seines Bildschirms - eine geoeffnete
     Sure und eine laufende Suche. showScreen() stellt immer die Surenliste her;
     was darueber lag, zieht js/quran.js nach. Ohne das spraenge die
     Zurueck-Taste aus einer Sure ueber die ganze Liste hinweg zur Startseite
     (Elias, 04.08.2026). */
  if (ziel === 'quranfull' && typeof stelleQuranEbeneHer === 'function') stelleQuranEbeneHer(st);
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
    /* Eine laufende Runde mitziehen, sonst laeuft sie mit der ALTEN Auswahl
       weiter - genau der Fehler, den Elias am 30.07.2026 gemeldet hat. */
    if (typeof passeRundeAnAuswahlAn === 'function') passeRundeAnAuswahlAn();
    return;
  }
  if (e.target.closest('#btnWrongOnly')){
    SETTINGS.wrongOnly = !SETTINGS.wrongOnly;
    saveSettings();
    renderHome();
  }
});

