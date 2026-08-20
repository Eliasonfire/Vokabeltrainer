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
  const navMap = {home:'home', learn:'learn-entry', categories:'categories', sentences:'sentences', stats:'stats', wordlist:'categories', quran:'home', quranfull:'home', hoeren:'home', wurzeln:'home', settings:'home'};
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
  if (name==='wurzeln') oeffneWurzeln();
  if (name==='quranfull') renderSurahList(document.getElementById('surahSearch').value);
  if (name==='stats') renderStats();
  if (name==='settings') renderSettings();
  /* Hier stand `window.scrollTo(0,0)`. Ersatzlos gestrichen: das Fenster rollt
     in dieser App nicht, die Zeile war ohne Wirkung. Der wirksame Sprung steht
     jetzt weiter oben, vor den Render-Aufrufen. */
  return name;
}

/* ---------- Rollstand je Historieneintrag (Elias, 16.08.2026) ----------

   "wenn ich auf zurück drücke will ich da raus kommen wo ich davor war."

   Das gab es bis dahin NUR in der Surenliste, als Sonderloesung mit einer
   eigenen Variablen. Ueberall sonst fing jeder Bildschirm nach der
   Zurueck-Taste wieder oben an. Gemessen am 16.08.2026 (375x812): Kategorien
   auf 900 gerollt, ein Kapitel geoeffnet, Zurueck-Taste - Stand 0.

   Der Stand gehoert an den HISTORIENEINTRAG, nicht an den Bildschirm: derselbe
   Bildschirm kann mehrfach in der Historie liegen, jedes Mal mit einem anderen
   Stand. Deshalb wird er beim Verlassen in den noch aktuellen Eintrag
   nachgetragen (replaceState) und beim popstate von dort gelesen.

   ⚠️ Der Quran-Leser ist ausgenommen, siehe popstate-Handler unten. Er hat mit
   LISTEN_ROLLSTAND eine eigene, feiner gebaute Loesung - sie unterscheidet
   Liste, Suche und offene Sure. Zwei Mechanismen auf demselben Rollkasten
   wuerden sich gegenseitig ueberschreiben; genau dieser Fehler war an
   demselben Morgen zu beheben. */
function showScreen(name, opt){
  opt = opt || {};
  const aktiv = document.querySelector('.screen.active');
  const schonDa = !!aktiv && aktiv.id === 'screen-' + name;
  /* VOR zeigeBildschirm() ablesen - das springt als Erstes nach oben. */
  const kasten = document.getElementById('main');
  const standVorher = kasten ? kasten.scrollTop : 0;
  const gezeigt = zeigeBildschirm(name);

  if (opt.ausHistorie) return;               // von popstate ausgeloest, nichts ablegen
  const alt = history.state || {};
  const tiefe = (typeof alt.tiefe === 'number') ? alt.tiefe : 0;
  if (opt.ersetzen || schonDa){
    history.replaceState({ screen: gezeigt, tiefe }, '');
  } else {
    /* Erst den verlassenen Eintrag um seinen Stand ergaenzen, dann den neuen
       anlegen. Object.assign, damit `sure` und `suche` des Quran-Lesers dabei
       nicht verlorengehen. */
    history.replaceState(Object.assign({}, alt, { rollstand: standVorher }), '');
    history.pushState({ screen: gezeigt, tiefe: tiefe + 1 }, '');
  }
}

/* ---------- Overlays und die Zurueck-Taste ----------

   Elias am 19.08.2026: "wenn ich gerade einen vorschlag angucke und im
   textfeld bin ... da habe ich die zurueck taste von meinem handy gedrueckt
   und das vorschlag pop up ist immer noch da geblieben, jedoch bin ich auf die
   startseite der app dadurch gekommen".

   ⛔ Die Ursache: der popstate-Handler unten kannte nur BILDSCHIRME. Ein
   offenes Overlay stand in der Historie ueberhaupt nicht, also ging die
   Zurueck-Taste eine Bildschirmebene zurueck und liess das Overlay stehen —
   schwebend ueber einem Bildschirm, zu dem es nicht gehoert.

   ⚠️ Gemessen am 19.08.2026: BETROFFEN WAREN ALLE VIER Overlays, nicht nur das
   gemeldete. Keines legte einen Historieneintrag an.

   Die Loesung ist eine eigene Ebene in der Historie: das Oeffnen legt einen
   Eintrag an, die Zurueck-Taste verbraucht genau diesen. Damit gilt sie erst
   dem Overlay und danach dem Bildschirm — so, wie man es von Android kennt.

   ⭐ Warum der Weg ueber die Historie und nicht "beim popstate einfach
   zumachen": ohne eigenen Eintrag wuerde die Zurueck-Taste einen
   BILDSCHIRM-Eintrag aufbrauchen. Die Historie waere danach eine Ebene zu
   flach, und der naechste Druck spraenge zwei Schritte auf einmal.

   ⚠️ Die Nav-Leiste ist waehrenddessen nicht erreichbar: der Backdrop liegt
   auf z-index 650, die Leiste auf 30. Die Zurueck-Taste war also der einzige
   Weg in diesen Zustand — deshalb braucht es keine zweite Absicherung in
   showScreen(). */
const OVERLAYS = [
  { id: 'noteEditor',       zu: 'schliesseNotizEditor'  },
  { id: 'quranFreqPopover', zu: 'closeQuranFreqPopover' },
  { id: 'ayahPopover',      zu: 'schliesseAyahListe'    },
  { id: 'wortKarte',        zu: 'schliesseWortKarte'    }
];

/* Welches Overlay liegt gerade oben? Gelesen wird der DOM, nicht eine
   mitgefuehrte Variable — eine Variable koennte auseinanderlaufen, die Klasse
   `hidden` ist die Wahrheit, die auch Elias auf dem Schirm sieht. */
function offenesOverlay(){
  for (const o of OVERLAYS){
    const el = document.getElementById(o.id);
    if (el && !el.classList.contains('hidden')) return o;
  }
  return null;
}

/* Beim Oeffnen aufzurufen, als LETZTE Zeile — erst steht das Overlay, dann
   bekommt es seinen Eintrag. */
function overlayAuf(id){
  const alt = history.state || {};
  history.pushState(Object.assign({}, alt, { overlay: id }), '');
}

/* Am ANFANG jeder Schliessfunktion aufzurufen. Liefert true, wenn das
   Schliessen ueber die Historie laeuft — dann hoert die Schliessfunktion
   sofort auf, und der popstate-Handler ruft sie gleich noch einmal, diesmal
   ohne Eintrag. So gibt es genau EINEN Weg zum Zumachen, egal ob das X, der
   Hintergrund oder die Zurueck-Taste benutzt wurde.

   ⚠️ history.back() wirkt erst im naechsten Zug. Fuer den Nutzer ist das
   unsichtbar, aber wer direkt danach den geschlossenen Zustand abfragt,
   bekommt noch den alten. */
function overlayZuUeberHistorie(id){
  if ((history.state || {}).overlay !== id) return false;
  history.back();
  return true;
}

/* Zurueck-Taste des Geraets: innerhalb der App navigieren statt sie zu verlassen. */
window.addEventListener('popstate', (e)=>{
  /* Liegt ein Overlay oben, gilt die Zurueck-Taste ihm — der Bildschirm
     darunter bleibt unberuehrt. Der Eintrag, den sie gerade verbraucht hat,
     ist genau der, den overlayAuf() beim Oeffnen angelegt hat; deshalb bleibt
     die Tiefe der Historie stimmig, ohne dass hier etwas nachgelegt wird.

     ⚠️ Die Schliessfunktion wird ueber ihren NAMEN geholt, nicht als
     Verweis: js/navigation.js wird vor js/lernen.js geladen, ein Verweis
     waere zum Zeitpunkt der Liste noch undefined. */
  const obenauf = offenesOverlay();
  if (obenauf){
    const zu = window[obenauf.zu];
    if (typeof zu === 'function') zu();
    else {
      /* Notnagel, falls eine Schliessfunktion einmal umbenannt wird: dann
         wenigstens zuklappen, statt das Overlay stehen zu lassen. Genau
         dieser Zustand war der gemeldete Fehler. */
      const el = document.getElementById(obenauf.id);
      if (el) el.classList.add('hidden');
      document.querySelectorAll('.qfp-backdrop').forEach(b=>b.classList.add('hidden'));
    }
    return;
  }
  const st = e.state || {};
  const ziel = st.screen || 'home';
  /* VOR showScreen() ablesen: renderSurahList() setzt OFFENE_SURE gleich auf
     null, danach waere nicht mehr zu erkennen, ob wir aus einer Sure kommen. */
  const kamAusSure = (typeof OFFENE_SURE !== 'undefined' && OFFENE_SURE !== null);
  showScreen(ziel, { ausHistorie: true });
  /* Der Quran-Leser hat Ebenen INNERHALB seines Bildschirms - eine geoeffnete
     Sure und eine laufende Suche. showScreen() stellt immer die Surenliste her;
     was darueber lag, zieht js/quran.js nach. Ohne das spraenge die
     Zurueck-Taste aus einer Sure ueber die ganze Liste hinweg zur Startseite
     (Elias, 04.08.2026). */
  if (ziel === 'quranfull' && typeof stelleQuranEbeneHer === 'function'){
    stelleQuranEbeneHer(st);
    /* Drei Wege enden hier, und nur einer braucht den allgemeinen Rollstand:
       - aus einer Sure zurueck in die Liste: LISTEN_ROLLSTAND hat das schon
         erledigt, und zwar feiner - er unterscheidet Liste, Suche und Sure;
       - zurueck in eine OFFENE Sure: openSurah() springt ueber LESESTAND auf
         die Ayah, nicht auf einen Pixelwert. Der waere nach dem Neuaufbau der
         Verse ohnehin bedeutungslos;
       - von einem ANDEREN Bildschirm zurueck in die Surenliste: da stellt
         niemand etwas wieder her. Gemessen am 16.08.2026: Liste auf 400,
         Statistik geoeffnet, Zurueck-Taste -> Stand 0. Genau dieser Weg faellt
         deshalb unten durch. */
    if (kamAusSure || st.sure) return;
  }
  /* Ueberall sonst: den beim Verlassen gemerkten Rollstand wiederherstellen.
     NACH showScreen(), denn zeigeBildschirm() springt zuerst nach oben und baut
     den Bildschirm neu auf - davor waere der Kasten noch zu kurz und der Wert
     wuerde auf die alte Hoehe beschnitten.

     ⚠️ scrollTo({behavior:'instant'}) und nicht `scrollTop = x`: #main traegt
     `scroll-behavior:smooth`, das gilt auch fuer eine Zuweisung. Sonst faehrt
     der Bildschirm bei jedem Zurueck sichtbar von oben nach unten. */
  if (typeof st.rollstand === 'number' && st.rollstand > 0){
    const kasten = document.getElementById('main');
    if (kasten) kasten.scrollTo({ top: st.rollstand, behavior: 'instant' });
  }
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
    const val  = chBtn.dataset.chfilter;
    /* Seit dem 11.08.2026 traegt jeder Kapitel-Chip sein Buch mit sich. Ohne
       das waere "3" bei mehreren gewaehlten Buechern nicht mehr eindeutig. Der
       "Eigene"-Chip hat bewusst kein Buch - eigene Vokabeln gehoeren zu keinem. */
    const buch = chBtn.dataset.chbuch;
    if (val === 'personal'){
      SETTINGS.eigeneGewaehlt = !SETTINGS.eigeneGewaehlt;
      /* ⭐ Ab jetzt ist es SEINE Entscheidung und wird nicht mehr angefasst.
         Die einmalige Umstellung in js/buecher.js (eigeneChipNachziehen) läuft
         nur, solange dieser Merker fehlt. */
      SETTINGS.eigeneChipEntschieden = true;
    } else {
      if (!SETTINGS.buecher || typeof SETTINGS.buecher !== 'object') SETTINGS.buecher = {};
      const slug = buch || (typeof aktivesBuch === 'function' ? aktivesBuch() : 'madina-1');
      let sel = Array.isArray(SETTINGS.buecher[slug]) ? SETTINGS.buecher[slug] : [];
      if (val === 'all') sel = [];
      else {
        const nr = Number(val);
        sel = sel.indexOf(nr) >= 0 ? sel.filter(x => x !== nr) : sel.concat([nr]);
      }
      SETTINGS.buecher[slug] = sel;
    }
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

