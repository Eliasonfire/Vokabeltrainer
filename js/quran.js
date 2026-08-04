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

/* ---------- Lesemodus und Schriftgroessen ----------

   Elias am 04.08.2026: "wäre es auch gut wenn ich einen Modus hätte, wo ich nur
   den arabischen Text lesen kann (deutsch wird gar nicht angezeigt) und anders
   herum wo ich nur die deutsche Übersetzung habe. Ebenso wäre es gut, wenn ich
   die schriftgröße vergrößern und verkleinern könnte in jedem Modus. […] Es wäre
   auch gut wenn ich das arabische und das deutsche seperat einstellen kann."

   Die Groesse wird als FAKTOR auf die Grundgroesse gegeben, nicht als fester
   Punktwert. Grund: line-height ist in em angegeben; ein Faktor laesst den
   Zeilenabstand mitwachsen, ein fester Wert wuerde arabische Zeilen mit
   Vokalzeichen uebereinanderschieben. */
const QURAN_MIN = 70, QURAN_MAX = 200, QURAN_SCHRITT = 10;

function quranAnsicht(){
  return {
    modus: SETTINGS.quranModus || 'beide',
    ar: Number(SETTINGS.quranAr) || 100,
    de: Number(SETTINGS.quranDe) || 100
  };
}

function wendeQuranAnsichtAn(){
  const a = quranAnsicht();
  const wurzel = document.documentElement;
  wurzel.style.setProperty('--quran-ar', (a.ar / 100).toFixed(2));
  wurzel.style.setProperty('--quran-de', (a.de / 100).toFixed(2));

  const liste = document.getElementById('verseList');
  liste.classList.toggle('nur-ar', a.modus === 'ar');
  liste.classList.toggle('nur-de', a.modus === 'de');

  document.querySelectorAll('[data-quranmodus]').forEach(b =>
    b.classList.toggle('active', b.dataset.quranmodus === a.modus));
  document.getElementById('qaWertAr').textContent = a.ar + ' %';
  document.getElementById('qaWertDe').textContent = a.de + ' %';
  /* Was gerade nicht angezeigt wird, laesst sich auch nicht sinnvoll groesser
     stellen - die Zeile verschwindet, statt ins Leere zu wirken. */
  document.getElementById('qaZeileAr').classList.toggle('hidden', a.modus === 'de');
  document.getElementById('qaZeileDe').classList.toggle('hidden', a.modus === 'ar');
  document.querySelectorAll('[data-qurangroesse]').forEach(b=>{
    const [feld, richtung] = b.dataset.qurangroesse.split(':');
    const wert = feld === 'ar' ? a.ar : a.de;
    b.disabled = Number(richtung) < 0 ? wert <= QURAN_MIN : wert >= QURAN_MAX;
  });
}

document.getElementById('btnQuranAnsicht').addEventListener('click', ()=>{
  const feld = document.getElementById('quranAnsicht');
  const auf = feld.classList.toggle('hidden');
  document.getElementById('btnQuranAnsicht').setAttribute('aria-expanded', String(!auf));
  if (!auf) wendeQuranAnsichtAn();
});

document.getElementById('quranModi').addEventListener('click', (e)=>{
  const knopf = e.target.closest('[data-quranmodus]');
  if (!knopf) return;
  SETTINGS.quranModus = knopf.dataset.quranmodus;
  saveSettings();
  wendeQuranAnsichtAn();
});

document.getElementById('quranAnsicht').addEventListener('click', (e)=>{
  const knopf = e.target.closest('[data-qurangroesse]');
  if (!knopf) return;
  const [feld, richtung] = knopf.dataset.qurangroesse.split(':');
  const schluessel = feld === 'ar' ? 'quranAr' : 'quranDe';
  const jetzt = Number(SETTINGS[schluessel]) || 100;
  const neu = Math.min(QURAN_MAX, Math.max(QURAN_MIN, jetzt + Number(richtung) * QURAN_SCHRITT));
  if (neu === jetzt) return;
  SETTINGS[schluessel] = neu;
  saveSettings();
  wendeQuranAnsichtAn();
});

/* ---------- Der Quran-Leser hat Ebenen INNERHALB seines Bildschirms ----------

   Elias am 04.08.2026: "wenn ich in einer Sura bin und auf meinem Handy die
   zurück Taste drücke, dann komme ich immer zum Startbildschirm der app zurück,
   eigentlich möchte ich aber wieder die Liste mit all den suren im Quran sehen."
   Und weiter, als allgemeine Regel: "Grundsätzlich soll mich meine Handy zurück
   Taste immer nur auf das vorherige Menü zurück bringen."

   Warum das vorher nicht ging: navigation.js legt je BILDSCHIRM einen
   Historie-Eintrag an. Eine geoeffnete Sure ist aber kein eigener Bildschirm,
   sondern ein Zustand innerhalb von `screen-quranfull` - openSurah() versteckt
   nur #surahList und zeigt #verseList. Fuer die Historie sah das aus, als waere
   man die ganze Zeit auf derselben Seite geblieben; die Zurueck-Taste sprang
   deshalb ueber die ganze Surenliste hinweg zum vorigen Bildschirm.

   Der App-Pfeil hatte dafuer eine Sonderbehandlung, die Geraetetaste nicht -
   zwei Wege, die sich unterschiedlich verhielten. Statt die Sonderbehandlung zu
   verdoppeln, bekommen die Ebenen jetzt echte Historie-Eintraege. Dadurch tut
   `geheZurueck()` fuer beide Wege von selbst das Richtige, und der App-Pfeil
   braucht gar keine Sonderbehandlung mehr.

   Drei Zustaende, alle unter screen 'quranfull':
     { tiefe }                -> Surenliste
     { tiefe, suche:true }    -> Suche laeuft
     { tiefe, sure:<id> }     -> eine Sure ist offen */
function quranEbeneMerken(zusatz){
  const st = history.state || {};
  const tiefe = typeof st.tiefe === 'number' ? st.tiefe : 0;
  history.pushState(Object.assign({ screen:'quranfull', tiefe: tiefe + 1 }, zusatz), '');
}

/* Wird aus dem popstate-Handler in navigation.js gerufen. showScreen() stellt
   immer die Surenliste her - was darueber liegt, muss hier nachgezogen werden. */
function stelleQuranEbeneHer(st){
  st = st || {};
  const feld = document.getElementById('surahSearch');
  if (st.sure){ openSurah(Number(st.sure), { ausHistorie:true }); return; }
  /* Weder Sure noch Suche: das Suchfeld wird geleert. Sonst kaeme man aus einer
     gefilterten Liste nie zur vollstaendigen zurueck - die Zurueck-Taste haette
     die Suche zwar verlassen, aber derselbe Filter stuende noch im Feld. */
  if (!st.suche && feld.value) feld.value = '';
  renderSurahList(feld.value);
}

document.getElementById('surahSearch').addEventListener('input', (e)=>{
  const wert = e.target.value;
  const st = history.state || {};
  /* Nur beim UEBERGANG von "keine Suche" zu "Suche" einen Eintrag anlegen.
     Bei jedem Tastendruck einen zu setzen hiesse, dass man nach "ikhlas"
     sechsmal zurueck druecken muesste, um die Liste wiederzusehen. */
  if (wert.trim() && !st.suche && !st.sure) quranEbeneMerken({ suche:true });
  renderSurahList(wert);
});

/* Der App-Pfeil verhaelt sich jetzt genau wie die Geraetetaste - beide gehen
   eine Ebene zurueck. Das ist Elias' ausdrueckliche Vorgabe und ersetzt die
   fruehere Sonderbehandlung, die nur hier galt. */
document.getElementById('btnQuranFullBack').addEventListener('click', geheZurueck);
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

async function openSurah(id, opt){
  opt = opt || {};
  const surah = SURAH_DATA.find(s=>s.id===id);
  /* Eine geoeffnete Sure ist eine eigene Ebene. Ohne diesen Eintrag springt die
     Zurueck-Taste ueber die ganze Surenliste hinweg. `ausHistorie` kommt vom
     popstate-Handler - dort wird der Zustand wiederhergestellt, nicht neu
     betreten, sonst waechst die Historie bei jedem Zurueck weiter an. */
  if (!opt.ausHistorie) quranEbeneMerken({ sure:id });
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
  /* Modus und Groessen gelten auch fuer frisch gebaute Verse. Die Klassen sitzen
     zwar am Container und ueberleben den Neuaufbau - die Knopfzustaende im
     Ansicht-Menue aber nicht, wenn es zwischendurch geoeffnet wurde. */
  wendeQuranAnsichtAn();
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


/* Die gespeicherte Ansicht gilt ab dem ersten Bildaufbau, nicht erst, wenn das
   Menue einmal geoeffnet wurde. Sonst startet der Leser immer in 100 % und
   springt erst um, sobald man die Einstellung anfasst. */
wendeQuranAnsichtAn();
