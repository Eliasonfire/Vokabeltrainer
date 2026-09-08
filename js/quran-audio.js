/* ============================================================================
   REZITATOREN UND MITLESEN IM QURAN-LESER      (08.09.2026, Nachtschicht)
   ============================================================================

   Elias am 08.09.2026: „was ist mit den rezitatoren, können wir die auch nehmen
   und auch die funktion einbauen die diese seite hat mit dem mitlesen (wenn dan
   aber in den quran einstellungen aktivieren bzw laufen lassen)"

   Gemeint war diegebetszeiten.de/koran/as-saff — dort laeuft die Rezitation und
   der gerade gelesene Vers ist hervorgehoben.

   ---------------------------------------------------------------------------
   ⭐⭐ WARUM HIER KEIN EINZIGER API-AUFRUF STEHT
   ---------------------------------------------------------------------------

   Der naheliegende Weg waere `recitations/{id}/by_chapter/{sure}` — der liefert
   je Vers ein `{ verse_key, url }`. Gemessen am 08.09.2026, 04:35, fuer ALLE
   zwoelf Rezitatoren an Al-Baqarah (286 Verse):

     286 von 286 Dateien geliefert, und  A B W E I C H U N G E N :  0

   Jeder Dateiname ist `SSSVVV.mp3` — Sure und Vers, je dreistellig aufgefuellt.
   Nur der Ordner davor unterscheidet die Rezitatoren. Damit laesst sich die
   Adresse RECHNEN, und der Leser braucht die API ueberhaupt nicht:

     ⭐ ein Netzabruf weniger je Sure — und vor allem einer weniger, der
        scheitern kann, bevor der erste Ton kommt
     ⭐ faellt api.quran.com aus, spielt die Rezitation trotzdem

   ⛔ Die Ordner sind GEMESSEN, nicht abgeschrieben. Drei der zwoelf liegen
   nicht bei quran.com, sondern auf einem Spiegel — und zwar mit `//` davor,
   ohne Protokoll. Wer das uebersieht, baut fuer diese drei eine Adresse wie
   `https://verses.quran.com///mirrors.quranicaudio.com/...`.

   Stichprobe an sieben weiteren Stellen (1:1, 9:1, 67:30, 93:11, 114:6, beide
   Spiegel-Rezitatoren): 7 von 7 mit Status 200, `audio/mpeg`, und
   `Access-Control-Allow-Origin: *`.

   ---------------------------------------------------------------------------
   ⛔ WORT-HERVORHEBUNG GIBT ES HIER NICHT — und das ist kein Versehen
   ---------------------------------------------------------------------------

   quran.com hebt beim Abspielen einzelne WOERTER hervor. Dafuer braeuchte es
   Zeitmarken je Wort (`segments`). An drei Endpunkten gesucht, an keinem
   gefunden — die Antworten kamen mit Status 200 und ohne das Feld. Vers-weises
   Mitlesen dagegen braucht gar keine Zusatzdaten: wer die Datei `067005.mp3`
   abspielt, WEISS, welcher Vers laeuft. Deshalb ist das hier gebaut und das
   andere nicht.

   ---------------------------------------------------------------------------
   ⛔ EIN Audio-Element, nicht eines je Vers
   ---------------------------------------------------------------------------

   Ein Browser laesst Ton nur nach einer Nutzergeste zu. Die Geste ist der Druck
   auf den Abspielknopf — und sie gilt fuer das Element, das dabei gestartet
   wurde. Wer je Vers ein neues `new Audio()` baut und abspielt, verliert die
   Erlaubnis beim zweiten Vers und der Ton bricht mitten in der Sure ab, ohne
   Fehlermeldung. Deshalb wird hier nur `src` gewechselt.
   ============================================================================ */

/* ⛔ Alles ausser dem Ordner ist Beiwerk: die Adresse entsteht aus `pfad` plus
   `SSSVVV.mp3`. Die Namen sind die deutsche Umschrift, wie Elias sie liest —
   die englische Schreibung der API steht daneben nirgends, weil sie ihm nichts
   sagt. `stil` steht nur dort, wo derselbe Rezitator zweimal vorkommt.

   Reihenfolge: der bekannteste zuerst. Das ist zugleich die Vorgabe. */
const QURAN_REZITATOREN = [
  { id:  7, name: 'Mishārī al-ʿAfāsī',        pfad: 'Alafasy/mp3/' },
  { id:  2, name: 'ʿAbd al-Bāsiṭ',   stil: 'Murattal', pfad: 'AbdulBaset/Murattal/mp3/' },
  { id:  1, name: 'ʿAbd al-Bāsiṭ',   stil: 'Mujawwad', pfad: 'AbdulBaset/Mujawwad/mp3/' },
  { id:  3, name: 'ʿAbd ar-Raḥmān as-Sudais', pfad: 'Sudais/mp3/' },
  { id: 10, name: 'Saʿūd ash-Shuraim',        pfad: 'Shuraym/mp3/' },
  { id:  4, name: 'Abū Bakr ash-Shāṭirī',     pfad: 'Shatri/mp3/' },
  { id:  5, name: 'Hānī ar-Rifāʿī',           pfad: 'Rifai/mp3/' },
  { id:  9, name: 'al-Minshāwī',     stil: 'Murattal', pfad: 'Minshawi/Murattal/mp3/' },
  { id:  8, name: 'al-Minshāwī',     stil: 'Mujawwad', pfad: 'Minshawi/Mujawwad/mp3/' },
  /* ⛔ Die drei mit `//` liegen auf einem Spiegel, nicht bei quran.com. */
  { id:  6, name: 'Maḥmūd al-Ḥuṣarī',
    pfad: '//mirrors.quranicaudio.com/everyayah/Husary_64kbps/' },
  { id: 12, name: 'Maḥmūd al-Ḥuṣarī', stil: 'Muʿallim',
    pfad: '//mirrors.quranicaudio.com/everyayah/Husary_Muallim_128kbps/' },
  { id: 11, name: 'Muḥammad aṭ-Ṭablāwī',
    pfad: '//mirrors.quranicaudio.com/everyayah/Mohammad_al_Tablaway_128kbps/' }
];
const QURAN_AUDIO_BASIS = 'https://verses.quran.com/';

function rezitatorVon(id){
  const n = Number(id);
  return QURAN_REZITATOREN.find(r => r.id === n) || null;
}
function quranRezitator(){
  const r = rezitatorVon(SETTINGS.quranRezitator);
  return r ? r.id : QURAN_REZITATOREN[0].id;
}
function rezitatorTitel(id){
  const r = rezitatorVon(id);
  if (!r) return '';
  return r.stil ? r.name + ' · ' + r.stil : r.name;
}
/* ⛔ Vorgabe AUS. Dieselbe Ueberlegung wie bei Darstellung, Uebersetzung und
   Schriftart: etwas Neues darf sich nicht selbst einschalten — hier waere es
   sogar eine Leiste, die dauerhaft Platz vom Verstext nimmt. Und er hat es
   ausdruecklich so verlangt: „wenn dan aber in den quran einstellungen
   aktivieren bzw laufen lassen". */
function quranRezitationAn(){ return SETTINGS.quranRezitation === 'an'; }
/* Mitlesen dagegen ist AN, sobald die Rezitation an ist: es ist der eigentliche
   Zweck der Sache und kostet ohne laufenden Ton nichts. */
function quranMitlesen(){ return SETTINGS.quranMitlesen !== 'aus'; }

/** Die Adresse einer Vers-Aufnahme — gerechnet, nicht abgefragt. */
function audioAdresse(rezId, sure, vers){
  const r = rezitatorVon(rezId);
  if (!r || !sure || !vers) return null;
  const datei = String(sure).padStart(3, '0') + String(vers).padStart(3, '0') + '.mp3';
  const p = r.pfad + datei;
  /* ⛔ Das Protokoll fehlt bei den Spiegel-Adressen. Ein `//` am Anfang heisst
     „gleiches Protokoll wie die Seite" — im Browser ginge das von selbst, aber
     nur bei einem Attribut, nicht bei einer selbst gebauten Zeichenkette. */
  return p.startsWith('//') ? 'https:' + p : QURAN_AUDIO_BASIS + p;
}

const QAUDIO = { el:null, vorlader:null, sure:null, vers:0, laeuft:false, hinweis:'' };

/** Wie viele Verse hat die Sure? Erst der aufgebaute Leser, dann die Surenliste
 *  — der Leser ist die Wahrheit, weil er den Text wirklich vor sich hat. */
function audioVersZahl(sure){
  const c = (typeof VERSE_CACHE === 'object' && VERSE_CACHE[sure]) || null;
  if (c && c.length) return c.length;
  if (typeof versZahl === 'function') return versZahl(sure) || 0;
  return 0;
}

function audioElement(){
  if (QAUDIO.el) return QAUDIO.el;
  const el = new Audio();
  el.preload = 'auto';
  el.addEventListener('ended', () => audioNaechster());
  el.addEventListener('play',  () => { QAUDIO.laeuft = true;  QAUDIO.hinweis = ''; zeigeSpieler(); });
  el.addEventListener('pause', () => { QAUDIO.laeuft = false; zeigeSpieler(); });
  el.addEventListener('error', () => {
    /* ⚠️ Beim Beenden wird `src` entfernt, und genau das loest in manchen
       Browsern ebenfalls `error` aus. Ohne diese Abfrage stuende nach jedem
       Beenden eine Fehlermeldung da, die keinen Fehler beschreibt. */
    if (QAUDIO.sure === null) return;
    QAUDIO.laeuft = false;
    QAUDIO.hinweis = 'Aufnahme nicht erreichbar — Internet?';
    zeigeSpieler();
  });
  QAUDIO.el = el;
  return el;
}

/** Holt die naechste Datei still in den Browsercache, damit zwischen zwei
 *  Versen keine Lade-Pause steht. ⛔ Wird nie abgespielt. */
function audioVorladen(sure, vers){
  if (!sure || vers < 1 || vers > audioVersZahl(sure)) return;
  const url = audioAdresse(quranRezitator(), sure, vers);
  if (!url) return;
  if (!QAUDIO.vorlader){ QAUDIO.vorlader = new Audio(); QAUDIO.vorlader.preload = 'auto'; }
  QAUDIO.vorlader.src = url;
}

async function audioSpiele(sure, vers){
  const anzahl = audioVersZahl(sure);
  if (!anzahl || vers < 1 || vers > anzahl){ audioAus(); return; }
  const url = audioAdresse(quranRezitator(), sure, vers);
  if (!url){ audioAus(); return; }
  QAUDIO.sure = sure; QAUDIO.vers = vers; QAUDIO.hinweis = '';
  const el = audioElement();
  el.src = url;
  markiereLaufendenVers(sure, vers);
  zeigeSpieler();
  try {
    await el.play();
  } catch (err){
    /* ⚠️ Ein Wechsel des `src` bricht das laufende `play()` ab — der Browser
       meldet das als AbortError. Das ist kein Fehler, sondern genau das, was
       beim Weiterblaettern passieren SOLL. */
    if (err && err.name === 'AbortError') return;
    QAUDIO.laeuft = false;
    QAUDIO.hinweis = 'Ton lässt sich nicht starten';
    zeigeSpieler();
    return;
  }
  audioVorladen(sure, vers + 1);
}

function audioNaechster(){
  if (QAUDIO.sure === null) return;
  if (QAUDIO.vers >= audioVersZahl(QAUDIO.sure)){
    /* Sure zu Ende. Bewusst KEIN automatischer Sprung in die naechste Sure:
       er hoert eine bestimmte Sure, nicht den Quran am Stueck. */
    audioAus();
    return;
  }
  audioSpiele(QAUDIO.sure, QAUDIO.vers + 1);
}
function audioVoriger(){
  if (QAUDIO.sure === null) return;
  audioSpiele(QAUDIO.sure, Math.max(1, QAUDIO.vers - 1));
}

function audioAus(){
  const el = QAUDIO.el;
  QAUDIO.sure = null; QAUDIO.vers = 0; QAUDIO.laeuft = false; QAUDIO.hinweis = '';
  if (el){ el.pause(); el.removeAttribute('src'); try { el.load(); } catch (e) {} }
  markeWeg();
  zeigeSpieler();
}

/** Der eine Knopf: startet, haelt an, laeuft weiter. */
function audioUmschalten(){
  if (OFFENE_SURE === null) return;
  if (QAUDIO.sure !== OFFENE_SURE){
    /* Anfangen, wo er gerade liest — nicht stur bei Vers 1. Wer bei Ayah 14
       steht und auf Abspielen drueckt, will dort weiterhoeren.
       [[endpunkt_der_zuerst_steht]] */
    const start = (typeof sichtbarerVers === 'function' && sichtbarerVers()) || 1;
    audioSpiele(OFFENE_SURE, start);
    return;
  }
  const el = audioElement();
  if (QAUDIO.laeuft) el.pause();
  else el.play().catch(() => {});
}

/* ---------- Mitlesen ---------- */

function markeWeg(){
  document.querySelectorAll('#verseList .verse-item.laeuft')
    .forEach(e => e.classList.remove('laeuft'));
}
function markiereLaufendenVers(sure, nr){
  markeWeg();
  /* ⛔ Nur wenn Mitlesen an ist. Er hat es als eigene Einstellung verlangt,
     also darf es sich auch nicht ueber die Hintertuer einschalten. */
  if (!quranMitlesen()) return;
  if (sure !== OFFENE_SURE) return;
  const el = document.querySelector('#verseList .verse-item[data-versnr="' + nr + '"]');
  if (!el) return;
  el.classList.add('laeuft');
  /* ⚠️ `zeigeVers` und nicht `scrollIntoView`: `#main` traegt
     `scroll-behavior:smooth`, und der vorhandene Sprung rechnet die klebende
     Kopfzeile heraus. Ein eigener Sprung wuerde den Vers darunter schieben.
     [[weiches_rollen_meldet_alten_wert]] */
  if (typeof zeigeVers === 'function') zeigeVers(nr);
}

/* ---------- Die Leiste ---------- */

function zeigeSpieler(){
  const leiste = document.getElementById('quranSpieler');
  if (!leiste) return;
  const sichtbar = quranRezitationAn() && OFFENE_SURE !== null;
  leiste.classList.toggle('hidden', !sichtbar);
  /* ⛔ Die Polsterung des Bildschirms haengt an derselben Bedingung. Ohne sie
     stuende die Leiste ueber dem letzten Vers — und der letzte Vers einer Sure
     ist genau der, den man beim Auswendiglernen am oeftesten braucht. */
  const screenQ = document.getElementById('screen-quranfull');
  if (screenQ) screenQ.classList.toggle('mit-spieler', sichtbar);
  if (!sichtbar) return;

  const laeuftHier = QAUDIO.sure === OFFENE_SURE;
  const knopf = document.getElementById('btnQsPlay');
  if (knopf){
    knopf.classList.toggle('an', QAUDIO.laeuft);
    const bild = knopf.querySelector('use');
    if (bild) bild.setAttribute('href', QAUDIO.laeuft ? '#ic-pause' : '#ic-play');
    knopf.setAttribute('aria-label', QAUDIO.laeuft ? 'Anhalten' : 'Rezitation abspielen');
  }
  const stand = document.getElementById('qsStand');
  if (stand){
    const gesamt = audioVersZahl(OFFENE_SURE);
    stand.textContent = QAUDIO.hinweis ? QAUDIO.hinweis
      : laeuftHier ? 'Vers ' + QAUDIO.vers + ' von ' + gesamt
      : rezitatorTitel(quranRezitator());
    stand.classList.toggle('qs-warnung', !!QAUDIO.hinweis);
  }
  const name = document.getElementById('qsName');
  if (name) name.textContent = laeuftHier ? rezitatorTitel(quranRezitator()) : '';
  /* ⛔ GESPERRT, nicht ausgeblendet. Wären sie weg, spränge der Abspielknopf
     beim Start eine Knopfbreite nach rechts — und der Finger, der ihn gerade
     getroffen hat, läge dann auf „vorheriger Vers". Begründung steht auch am
     Markup in index.html, weil man dort zuerst hinsieht. */
  ['btnQsZurueck', 'btnQsVor', 'btnQsAus'].forEach(id => {
    const b = document.getElementById(id);
    if (b) b.disabled = !laeuftHier;
  });
  /* Beim ersten Vers gibt es kein Zurück. */
  const zurueck = document.getElementById('btnQsZurueck');
  if (zurueck && laeuftHier) zurueck.disabled = QAUDIO.vers <= 1;
}

/* Ein Surenwechsel beendet die Rezitation — sonst liefe Al-Mulk weiter,
   waehrend An-Nās auf dem Bildschirm steht. */
function audioSureWechsel(neueSure){
  if (QAUDIO.sure !== null && QAUDIO.sure !== neueSure) audioAus();
  else zeigeSpieler();
}

/* ---------- Bedienung ---------- */

(function verdrahteSpieler(){
  const an = (id, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', fn);
  };
  an('btnQsPlay',    audioUmschalten);
  an('btnQsVor',     audioNaechster);
  an('btnQsZurueck', audioVoriger);
  an('btnQsAus',     audioAus);

  const wahl = document.getElementById('quranRezitatorWahl');
  if (wahl){
    wahl.innerHTML = QURAN_REZITATOREN
      .map(r => '<option value="' + r.id + '">' + escapeHtml(rezitatorTitel(r.id)) + '</option>')
      .join('');
    wahl.addEventListener('change', () => {
      SETTINGS.quranRezitator = Number(wahl.value);
      saveSettings();
      /* ⛔ Laeuft gerade etwas, muss es mit der NEUEN Stimme weitergehen —
         sonst wechselt die Einstellung sichtbar und der Ton bleibt der alte.
         Derselbe Vers, damit er nichts verpasst. */
      if (QAUDIO.sure !== null) audioSpiele(QAUDIO.sure, QAUDIO.vers);
      else zeigeSpieler();
    });
  }
  const zeileRez = document.getElementById('quranRezitation');
  if (zeileRez) zeileRez.addEventListener('click', (e) => {
    const k = e.target.closest('[data-quranrezitation]');
    if (!k) return;
    SETTINGS.quranRezitation = k.dataset.quranrezitation;
    saveSettings();
    if (!quranRezitationAn()) audioAus();
    wendeQuranAnsichtAn();
  });
  const zeileMit = document.getElementById('quranMitlesen');
  if (zeileMit) zeileMit.addEventListener('click', (e) => {
    const k = e.target.closest('[data-quranmitlesen]');
    if (!k) return;
    SETTINGS.quranMitlesen = k.dataset.quranmitlesen;
    saveSettings();
    /* Sofort wirksam: aus heisst Marke weg, an heisst Marke auf den Vers, der
       gerade laeuft. Ohne das muesste er erst den naechsten Vers abwarten. */
    if (QAUDIO.sure !== null && quranMitlesen()) markiereLaufendenVers(QAUDIO.sure, QAUDIO.vers);
    else markeWeg();
    wendeQuranAnsichtAn();
  });
})();
