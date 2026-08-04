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
   286 Einzeleintraege erzeugt bekommen.

   ⚠️ Der zweite Teil dieser Begruendung stand bis zum 04.08.2026 hier: "und wer
   einzelne Verse abhakt, will den Surenhaken nicht ungefragt gesetzt sehen."
   Elias hat ausdruecklich das Gegenteil verlangt: "wenn ich in der sura alle
   Kaestchen anklicke und dadurch die ganze sura auswendig kann, dass dann in der
   Liste der suren diese spezifische sura nicht automatisch auch abgehackt ist.
   […] Das muss gefixt werden."

   Die beiden Speicher bleiben trotzdem getrennt, und der erste Teil der
   Begruendung gilt weiter. Der Abgleich laeuft ueber zwei Bewegungen:

     vollstaendig  →  `gleicheSurenhakenAb`: sind alle Verse einzeln abgehakt,
                      wird daraus der Surenhaken, und die Einzeleintraege
                      fallen weg - sie sagen dann nichts mehr, was der Haken
                      nicht schon sagt.
     abweichend    →  `materialisiereSure`: hakt jemand INNERHALB einer ganz
                      abgehakten Sure einen Vers ab, wird der Surenhaken in
                      Einzelverse aufgeloest. Erst hier entstehen die 286
                      Eintraege - also genau in dem Moment, in dem sie etwas
                      aussagen, und nicht vorher.

   Beides ist verlustfrei umkehrbar: der Haken traegt dieselbe Auskunft wie die
   vollstaendige Einzelliste. */
let HIFZ = LS.get('vt_hifz', {});
function saveHifz(){ LS.set('vt_hifz', HIFZ); }
let HIFZ_VERSE = LS.get('vt_hifzVerse', {});
function saveHifzVerse(){ LS.set('vt_hifzVerse', HIFZ_VERSE); }
function kannVers(sure, vers){ return !!HIFZ_VERSE[`${sure}:${vers}`]; }
function zaehleVerse(sure){
  const prefix = sure + ':';
  return Object.keys(HIFZ_VERSE).filter(k => k.startsWith(prefix) && HIFZ_VERSE[k]).length;
}
function versZahl(sure){
  const s = SURAH_DATA.find(x => x.id === Number(sure));
  return s ? s.verses : (VERSE_CACHE[sure] || []).length;
}

/* Surenhaken in Einzelverse aufloesen. Danach steht dieselbe Auskunft da, nur
   feiner - der Aufrufer kann anschliessend einen einzelnen Vers wegnehmen. */
function materialisiereSure(sure){
  const id = Number(sure);
  const gesamt = versZahl(id);
  if (!gesamt) return false;
  for (let v = 1; v <= gesamt; v++) HIFZ_VERSE[`${id}:${v}`] = 1;
  delete HIFZ[id];
  delete HIFZ[String(id)];
  saveHifz();
  saveHifzVerse();
  return true;
}

/* Gegenrichtung: sind alle Verse einzeln abgehakt, wird daraus der Surenhaken.
   Gibt zurueck, ob sich der Surenhaken dabei geaendert hat - der Aufrufer muss
   dann die Zeile in der Surenliste nachziehen. */
function gleicheSurenhakenAb(sure){
  const id = Number(sure);
  const gesamt = versZahl(id);
  if (!gesamt || HIFZ[id]) return false;
  if (zaehleVerse(id) < gesamt) return false;
  for (let v = 1; v <= gesamt; v++) delete HIFZ_VERSE[`${id}:${v}`];
  HIFZ[id] = true;
  saveHifz();
  saveHifzVerse();
  return true;
}

/* Der Verdecken-Modus gilt nur fuer die gerade offene Sure und wird bewusst
   NICHT gespeichert - beim naechsten Aufschlagen will man erst mal lesen. */
let HIFZ_VERDECKT = false;

const VERSE_CACHE = {};

/* Welche Sure gerade offen ist. Steht hier als eigene Angabe, statt sie bei
   Bedarf aus dem DOM zurueckzurechnen - genau diese Rueckrechnung war die
   Ursache von Punkt 14 (siehe dort). `null`, solange die Surenliste zu sehen
   ist. */
let OFFENE_SURE = null;

/* ---------- Lesefortschritt (Elias' Punkt 10 vom 04.08.2026) ----------

   Er war bei diesem Punkt selbst unsicher ("idk, bin mir da noch unsicher"),
   deshalb die kleinste Fassung, die wirklich etwas spart: eine Zeile ueber der
   Surenliste, die dorthin zurueckfuehrt, wo er aufgehoert hat.

   ⚠️ Ausdruecklich NICHT gebaut, weil es ohne seine Vorgabe geraten waere:
   ein Prozentbalken je Sure, eine "gelesen"-Markierung in der Liste, ein
   Tagesziel. Gelesen und auswendig sind zwei verschiedene Aussagen - die
   gruene Farbe gehoert schon Hifz, und eine zweite Bedeutung daneben haette
   beide unklar gemacht.

   Die Stelle wird ueber einen IntersectionObserver mitgefuehrt, nicht ueber
   einen Roll-Handler: bei Al-Baqarah muesste der bei jedem Fingerstrich 286
   Rechtecke ausmessen. Der Beobachter meldet nur Aenderungen, und die Zahl
   steht danach ohne Rechnen bereit. Geschrieben wird verzoegert - sonst
   entstuende bei jedem Rollen ein localStorage-Schreibvorgang. */
let LESESTAND = LS.get('vt_lesestand', null);
let LESE_BEOBACHTER = null;
let LESE_SICHTBAR = new Set();
let LESE_SCHREIBUHR = null;

function merkeLesestand(sure, vers){
  if (LESESTAND && LESESTAND.sure === sure && LESESTAND.vers === vers) return;
  LESESTAND = { sure, vers };
  clearTimeout(LESE_SCHREIBUHR);
  LESE_SCHREIBUHR = setTimeout(() => LS.set('vt_lesestand', LESESTAND), 800);
}

function beobachteLesestand(id){
  if (LESE_BEOBACHTER) LESE_BEOBACHTER.disconnect();
  LESE_SICHTBAR = new Set();
  const verse = document.querySelectorAll('#verseList .verse-item');
  if (!verse.length) return;
  LESE_BEOBACHTER = new IntersectionObserver(eintraege => {
    for (const e of eintraege){
      const nr = Number(e.target.dataset.versnr);
      if (e.isIntersecting) LESE_SICHTBAR.add(nr); else LESE_SICHTBAR.delete(nr);
    }
    if (!LESE_SICHTBAR.size) return;
    /* Der oberste sichtbare Vers ist die Stelle, an der man steht - nicht der
       unterste: wer wieder einsteigt, will den Vers noch einmal sehen, mit dem
       er aufgehoert hat, und nicht den ersten, den er noch nicht kennt. */
    merkeLesestand(id, Math.min(...LESE_SICHTBAR));
  }, { rootMargin: '-64px 0px -60% 0px' });
  verse.forEach(v => LESE_BEOBACHTER.observe(v));
}

function renderWeiterlesen(){
  const knopf = document.getElementById('weiterlesen');
  const s = LESESTAND && SURAH_DATA.find(x => x.id === LESESTAND.sure);
  if (!s){ knopf.classList.add('hidden'); return; }
  document.getElementById('weiterlesenStelle').textContent =
    `${s.id}. ${s.name} · Ayah ${LESESTAND.vers}`;
  knopf.classList.remove('hidden');
}

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

/* Der Juz einer Sure, als kurzer Text.
   Elias am 04.08.2026: "wäre es gut wenn bei der listenansicht der suren auch
   daneben stehen würde […] die jeweilige Juz die man mit der surah hat."

   19 der 114 Suren liegen ueber mehr als einem Juz - dann steht eine Spanne da
   ("Juz 1–3"), nicht nur der erste. Dass die Spannen wirklich zusammenhaengend
   sind, prueft werkzeuge/juz-holen.mjs beim Erzeugen der Daten; sonst waere
   "1–3" fuer 1 und 3 ohne 2 schlicht falsch.

   Die Rueckfallebene fuer eine Sure ohne Juz-Angabe ist ein leerer Text und
   kein Platzhalter: lieber nichts anzeigen als etwas behaupten. */
function juzText(s){
  const l = Array.isArray(s.juz) ? s.juz : [];
  if (!l.length) return '';
  return l.length === 1 ? `Juz ${l[0]}` : `Juz ${l[0]}–${l[l.length-1]}`;
}

/* Eine Zeile der Surenliste. Als eigene Funktion, damit Favoritenblock und
   Gesamtliste garantiert gleich aussehen - zwei Vorlagen waeren zwei Stellen,
   die auseinanderlaufen koennen. */
/* Der angezeigte Surenname. `arTaschkil` seit 04.08.2026 (Elias' Punkt 5),
   erzeugt von werkzeuge/surennamen-holen.mjs aus api.alquran.cloud und gegen
   quran-text.js gestuetzt. Das blanke `ar` bleibt daneben stehen und bleibt
   auch die Grundlage der SUCHE: wer "البقرة" ohne Vokalzeichen eintippt, muss
   die Sure finden, und ein Vergleich gegen die vokalisierte Fassung faende
   nichts. Faellt das Feld einmal aus, zeigt die App weiter das blanke `ar`. */
function surenTitel(s){ return s.arTaschkil || s.ar; }

function surahZeile(s){
  /* Wer einzelne Verse abgehakt hat, soll das in der Uebersicht sehen -
     sonst wirkt die Sure unangetastet, obwohl schon die Haelfte sitzt. */
  const einzeln = zaehleVerse(s.id);
  const zusatz = HIFZ[s.id] ? '' : (einzeln ? ` · ${einzeln} von ${s.verses} auswendig` : '');
  const fav = istFavorit(s.id);
  return `
    <div class="surah-row" data-opensurah="${s.id}">
      <div class="sr-num">${s.id}</div>
      <div class="sr-mid"><div class="sr-ar">${surenTitel(s)}</div><div class="sr-name">${s.name} · ${s.verses} Verse${zusatz}</div></div>
      <div class="sr-juz">${juzText(s)}</div>
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
  document.getElementById('btnAyahListe').classList.add('hidden');
  document.getElementById('suraNav').classList.add('hidden');
  OFFENE_SURE = null;
  /* Wie der Favoritenblock verschwindet auch die Weiterlesen-Zeile bei einer
     Suche: sie filtert nicht mit und stuende sonst ueber Treffern, zu denen
     sie nicht gehoert. */
  if (q) document.getElementById('weiterlesen').classList.add('hidden');
  else renderWeiterlesen();
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
  OFFENE_SURE = id;
  /* Eine geoeffnete Sure ist eine eigene Ebene. Ohne diesen Eintrag springt die
     Zurueck-Taste ueber die ganze Surenliste hinweg. `ausHistorie` kommt vom
     popstate-Handler - dort wird der Zustand wiederhergestellt, nicht neu
     betreten, sonst waechst die Historie bei jedem Zurueck weiter an. */
  if (!opt.ausHistorie) quranEbeneMerken({ sure:id });
  /* Der Kopf der geoeffneten Sure traegt den arabischen Namen mit, nicht nur
     die Umschrift — auch das gehoert zu Elias' Punkt 5. innerHTML statt
     textContent ist noetig, weil der arabische Teil eigene Schrift und
     Laufrichtung braucht; escapeHtml bleibt trotzdem drum, damit die Regel
     "kein ungeprueftes innerHTML" nicht an einer Ausnahme aufweicht. */
  document.getElementById('quranFullTitle').innerHTML =
    `${id}. ${escapeHtml(surah.name)} <span class="qt-ar" lang="ar" dir="rtl">${escapeHtml(surenTitel(surah))}</span>`;
  document.getElementById('quranFullIntro').classList.add('hidden');
  document.getElementById('surahSearch').classList.add('hidden');
  document.getElementById('surahList').classList.add('hidden');
  /* Der Favoritenblock gehoert zur Surenliste und muss mitverschwinden - sonst
     steht er ueber den Versen der geoeffneten Sure. */
  document.getElementById('surahFavBlock').classList.add('hidden');
  document.getElementById('weiterlesen').classList.add('hidden');
  const vList = document.getElementById('verseList');
  vList.classList.remove('hidden');
  /* Erst verstecken, dann neu bauen: sonst stuenden waehrend des Ladens noch
     die Versnummern der VORIGEN Sure in der Leiste - und ein Tippen darauf
     traefe ins Leere. renderVerses() zeigt sie gleich wieder. */
  document.getElementById('btnAyahListe').classList.add('hidden');
  document.getElementById('suraNav').classList.add('hidden');

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
    /* Bis zum 04.08.2026 waren diese Kaestchen gesperrt, sobald die ganze Sure
       abgehakt war - mit der Begruendung, sie stuenden sonst auf "an", ohne
       dass ein Klick etwas aendert. Das stimmte damals, weil der Surenhaken die
       Einzelverse stach. Seit `materialisiereSure` loest ein Klick den Haken in
       Einzelverse auf, der Klick aendert also sehr wohl etwas. Elias hatte die
       Sperre ausdruecklich als Fehler gemeldet: "dann kann ich innerhalb der
       sura nicht mehr die jeweiligen einzelnen ayaht anklicken um sie dann doch
       vom auswendig gelernt weg zu machen". */
    return `
    <div class="verse-item${kann?' auswendig':''}" data-versnr="${nr}">
      <div class="verse-kopf">
        <span class="verse-num">${v.verse_key}</span>
        <button class="hifz-check${kann?' on':''}" data-versmerk="${id}:${nr}"
                aria-label="Vers ${nr} als auswendig markieren">${icon('check')}</button>
      </div>
      <div class="verse-ar${verdeckt}" lang="ar" dir="rtl">${v.text_uthmani}</div>
      <div class="verse-de">${(v.translations && v.translations[0] && v.translations[0].text) || ''}</div>
    </div>`; }).join('');
  aktualisiereHifzLeiste(id, surah);
  renderAyahListe(id);
  renderSuraNav(id);
  beobachteLesestand(id);
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

/* ---------- Sprungliste der Ayat (Elias' Punkt 8 vom 04.08.2026) ----------

   ⚠️ Erste Fassung war eine waagerechte Leiste im angehefteten Kopf. Falsch,
   und der Wunsch sagte es schon: "die Nummern der ayaht runter scrollen".
   Bei At-Tawbah (129 Verse) waren 13 Nummern gleichzeitig sichtbar, alles
   andere lag hinter einer langen Wischbewegung - und die Leiste nahm dauerhaft
   Hoehe weg fuer etwas, das man selten braucht.

   Jetzt: ein Knopf im Kopf, der eine Liste aufklappt. Senkrecht rollbar, und
   die Nummern laufen von rechts nach links wie die Schrift (direction:rtl an
   .ap-grid - Reihenfolge im Markup bleibt 1..n).

   Bewusst KEINE Beobachtung des Rollens, die den gerade sichtbaren Vers
   mitfuehrt: das haette bei jedem Fingerstrich Arbeit gekostet. Die Markierung
   setzt nur, wer wirklich springt. */
function renderAyahListe(id){
  const knopf = document.getElementById('btnAyahListe');
  const gitter = document.getElementById('ayahGrid');
  const anzahl = (VERSE_CACHE[id] || []).length;
  if (!anzahl){ gitter.innerHTML = ''; knopf.classList.add('hidden'); return; }
  gitter.innerHTML = Array.from({ length: anzahl }, (_, i) => {
    const nr = i + 1;
    const kann = HIFZ[id] || kannVers(id, nr);
    return `<button class="ayah-sprung${kann?' auswendig':''}" data-ayah="${nr}"
                    aria-label="Zu Ayah ${nr} springen">${nr}</button>`;
  }).join('');
  document.getElementById('ayahPopoverTitel').textContent = `Ayah 1–${anzahl}`;
  knopf.classList.remove('hidden');
}

function oeffneAyahListe(){
  document.getElementById('ayahBackdrop').classList.remove('hidden');
  document.getElementById('ayahPopover').classList.remove('hidden');
  /* Zur zuletzt angesteuerten Ayah rollen, statt immer bei 1 zu beginnen: wer
     die Liste zum zweiten Mal oeffnet, ist meistens in der Naehe geblieben. */
  const aktiv = document.querySelector('#ayahGrid .ayah-sprung.aktiv');
  if (aktiv) aktiv.scrollIntoView({ block:'center' });
}
function schliesseAyahListe(){
  document.getElementById('ayahBackdrop').classList.add('hidden');
  document.getElementById('ayahPopover').classList.add('hidden');
}

/* Zum Vers fahren und ihn kurz aufleuchten lassen.
   Stand vorher wortgleich in js/lernen.js (Sprung aus der Haeufigkeitsliste).
   Seit dem 04.08.2026 gibt es zwei Wege zum selben Vers - die Leiste hier und
   die Haeufigkeitsliste dort -, und zwei Kopien waeren zwei Fassungen, sobald
   eine davon angefasst wird.

   Bewusst ohne weiches Scrollen: bis Vers 125 von Al-Baqarah sind es ueber
   30.000 Pixel. So eine Fahrt bricht der Browser ab, und selbst wenn nicht,
   dauerte sie ewig. Der kurze Leuchteffekt uebernimmt die Orientierung.

   Gescrollt wird nicht das Fenster: der Rumpf steht auf `overflow:hidden`, die
   Bildschirme rollen in #main. scrollIntoView beruecksichtigt das von selbst;
   der Nachsatz darunter ist die Rueckfallebene, falls die Fahrt nicht
   angekommen ist. */
/* ⚠️ Ein einziges scrollIntoView reicht NICHT, und das war bis zum 04.08.2026
   abends nicht gemessen. Nachgemessen an At-Tawbah, Sprung auf Ayah 42, Fenster
   780 px hoch — Abstand des Ziels zur Fensteroberkante:

       nach  100 ms   19495 px   nicht im Bild
       nach  500 ms    6505 px   nicht im Bild
       nach 1200 ms     354 px   im Bild
       nach 2500 ms      84 px   steht

   Der Inhalt ÜBER dem Ziel waechst noch, waehrend gerollt wird: die Verse
   werden hoeher, sobald die arabische Schrift steht. Der Browser zieht das
   ueber Scroll-Anchoring selbst nach, aber eben ueber eine Sekunde lang - und
   genau in dieser Sekunde laeuft der gruene Puls (1,9 s) ausserhalb des
   Bildes ab. Man tippt eine Ayah an und sieht erst einmal etwas anderes.

   ⚠️ Ein zweiter und dritter Anlauf reichen NICHT - auch das ist gemessen, nicht
   vermutet. Ein Versuch mit "nachziehen nach zwei Frames, bei fonts.ready und
   nach 600 ms" ergab exakt dieselben Zahlen wie ohne (19497 / 6556 / 425 px
   nach 100 / 500 / 1200 ms). Grund: nach JEDEM Ansteuern waechst der Inhalt
   darueber weiter, das Ziel rutscht also gleich wieder weg.

   Deshalb wird das Ziel GEHALTEN statt angesteuert: bis zu 1,2 s lang wird je
   Frame geprueft, ob es noch mittig steht, und sonst nachgefasst. Das kostet
   rund 70 Aufrufe von getBoundingClientRect - fuer EIN Element, nicht fuer 286.
   Sobald selbst gerollt oder getippt wird, hoert das Halten sofort auf; ohne
   das arbeitete die Seite gegen den eigenen Finger. */
function hebeVersHervor(el){
  const mitte = () => el.scrollIntoView({ block:'center', behavior:'auto' });
  mitte();
  el.classList.remove('angesteuert');
  void el.offsetWidth;                       // Animation neu starten
  el.classList.add('angesteuert');

  let halten = true;
  const aufhoeren = () => { halten = false; };
  const wege = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
  wege.forEach(w => window.addEventListener(w, aufhoeren, { once:true, passive:true }));
  const abraeumen = () => wege.forEach(w => window.removeEventListener(w, aufhoeren));

  const ende = performance.now() + 1200;
  const schritt = (jetzt) => {
    if (!halten){ abraeumen(); return; }
    const r = el.getBoundingClientRect();
    /* Bei sehr langen Versen ist die Sollhoehe 0 statt negativ - sonst zielte
       die Regelung auf eine Stelle oberhalb des Fensters und faende nie Ruhe. */
    const soll = Math.max(0, (window.innerHeight - r.height) / 2);
    if (Math.abs(r.top - soll) > 40) mitte();
    if (jetzt < ende) requestAnimationFrame(schritt);
    else abraeumen();
  };
  requestAnimationFrame(schritt);
}

/* ---------- Vorherige / naechste Sure am Sura-Ende (Punkt 12) ----------

   Elias am 04.08.2026: "Wenn man beim Quran beim Ende einer Sura ist dann kann
   man auch so zwei Buttons hinzufuegen, die einen zur naechsten oder zur
   vorherigen sura fuehrt. Der 'naechste' bottun sollte links sein."

   Die Reihenfolge im Markup bleibt die logische - erst zurueck, dann weiter.
   Dass "weiter" links landet, macht `direction:rtl` am Kasten, nicht ein
   Vertauschen der beiden Bloecke hier. */
function renderSuraNav(id){
  const kasten = document.getElementById('suraNav');
  const zurueck = SURAH_DATA.find(s => s.id === id - 1);
  const weiter  = SURAH_DATA.find(s => s.id === id + 1);
  const knopf = (s, richtung) => s
    ? `<button class="sn-knopf sn-${richtung}" data-suranav="${s.id}">
         ${icon(richtung === 'weiter' ? 'left' : 'right')}
         <span class="sn-text">
           <span class="sn-label">${richtung === 'weiter' ? 'Nächste' : 'Vorherige'}</span>
           <span class="sn-sure">${s.id}. ${escapeHtml(s.name)}</span>
         </span>
       </button>`
    : '<span class="sn-leer"></span>';
  kasten.innerHTML = knopf(zurueck, 'zurueck') + knopf(weiter, 'weiter');
  kasten.classList.remove('hidden');
}

document.getElementById('suraNav').addEventListener('click', (e)=>{
  const knopf = e.target.closest('[data-suranav]');
  if (!knopf) return;
  openSurah(Number(knopf.dataset.suranav));
  /* Ohne das stuende man in der neuen Sure sofort wieder ganz unten - die
     Rollhoehe bleibt beim Austausch des Inhalts erhalten. */
  const kasten = document.getElementById('main');
  if (kasten) kasten.scrollTop = 0;
});

/* Weiterlesen: Sure oeffnen und zur gemerkten Ayah fahren. Der Sprung muss
   warten, bis die Verse im DOM stehen - bei einer noch nicht geladenen Sure
   holt openSurah sie erst. Deshalb der kleine Warteschritt statt eines festen
   Timeouts, der bei langsamer Verbindung zu frueh kaeme. */
document.getElementById('weiterlesen').addEventListener('click', async ()=>{
  if (!LESESTAND) return;
  const { sure, vers } = LESESTAND;
  await openSurah(sure);
  for (let versuch = 0; versuch < 40; versuch++){
    const ziel = document.querySelector(`#verseList .verse-item[data-versnr="${vers}"]`);
    if (ziel){ hebeVersHervor(ziel); return; }
    await new Promise(r => requestAnimationFrame(r));
  }
  toast(`Ayah ${vers} liess sich nicht anspringen.`);
});

document.getElementById('btnAyahListe').addEventListener('click', oeffneAyahListe);
document.getElementById('btnCloseAyah').addEventListener('click', schliesseAyahListe);
document.getElementById('ayahBackdrop').addEventListener('click', schliesseAyahListe);

document.getElementById('ayahGrid').addEventListener('click', (e)=>{
  const knopf = e.target.closest('[data-ayah]');
  if (!knopf) return;
  const nr = Number(knopf.dataset.ayah);
  const ziel = document.querySelector(`#verseList .verse-item:nth-of-type(${nr})`);
  if (!ziel){ toast(`Ayah ${nr} liess sich nicht anspringen.`); return; }
  document.querySelectorAll('#ayahGrid .ayah-sprung.aktiv').forEach(k=>k.classList.remove('aktiv'));
  knopf.classList.add('aktiv');
  /* Erst zumachen, dann springen: solange die Liste offen ist, liegt sie ueber
     dem Vers, und scrollIntoView traefe eine verdeckte Stelle. */
  schliesseAyahListe();
  hebeVersHervor(ziel);
});

/* Einzelnen Vers abhaken. Kein Neuaufbau der ganzen Liste - bei Al-Baqarah
   waeren das 286 Verse, und die Seite wuerde bei jedem Haken springen. */
document.getElementById('verseList').addEventListener('click', (e)=>{
  const knopf = e.target.closest('[data-versmerk]');
  if (knopf){
    const key = knopf.dataset.versmerk;
    const [sureStr, versStr] = key.split(':');
    const id = Number(sureStr);
    const hakenVorher = !!HIFZ[id];
    /* War die ganze Sure abgehakt, muss sie erst in Einzelverse aufgeloest
       werden - sonst haette das Wegnehmen dieses einen Verses keinen Ort, an
       dem es stehen koennte. */
    if (hakenVorher) materialisiereSure(id);
    if (HIFZ_VERSE[key]) delete HIFZ_VERSE[key]; else HIFZ_VERSE[key] = 1;
    saveHifzVerse();
    /* Und die Gegenrichtung: war das der letzte fehlende Vers, wird daraus der
       Surenhaken. Danach ist `HIFZ_VERSE[key]` weg, der Vers gilt aber weiter
       als gekonnt - deshalb wird der Anzeigezustand aus BEIDEN Speichern
       gebildet und nicht aus dem Einzeleintrag allein. */
    gleicheSurenhakenAb(id);
    const an = !!HIFZ[id] || !!HIFZ_VERSE[key];
    knopf.classList.toggle('on', an);
    const karte = knopf.closest('.verse-item');
    karte.classList.toggle('auswendig', an);
    const text = karte.querySelector('.verse-ar');
    text.classList.toggle('verdeckt', HIFZ_VERDECKT && an);
    /* Die Sprungleiste zeigt dieselbe Auskunft und wird hier gleich
       mitgezogen - sonst behauptet sie bis zum naechsten Aufbau der Sure das
       Gegenteil von dem, was direkt darunter steht. */
    const chip = document.querySelector(`#ayahGrid [data-ayah="${versStr}"]`);
    if (chip) chip.classList.toggle('auswendig', an);
    /* Hat sich der Surenhaken durch diesen einen Klick geaendert - in die eine
       oder die andere Richtung -, muss die Zeile in der Surenliste mit. Sie
       steht gerade nicht im Bild, aber der Haken bliebe sonst stehen, bis sie
       neu gebaut wird. Beide Richtungen, nicht nur das Setzen: wer in einer ganz
       abgehakten Sure einen Vers wegnimmt, darf sie in der Liste nicht weiter
       als vollstaendig markiert vorfinden. */
    const hakenNachher = !!HIFZ[id];
    if (hakenNachher !== hakenVorher){
      document.querySelectorAll(`[data-hifztoggle="${id}"]`)
        .forEach(b=>b.classList.toggle('on', hakenNachher));
    }
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
  /* Elias am 04.08.2026: "Das 'wieder aufdecken' Symbol wird nicht immer gezeigt
     wenn man auf 'auswendig verbergen' drueckt. Oft kommt das 'wieder
     aufdecken' gar nicht und da steht nur 'auswendig verbergen'. Nichts desto
     trotz tut es seinen job."

     Genau so sah der Fehler aus, und hier stand seine Ursache: die Surennummer
     wurde aus dem ersten `[data-versmerk]` im DOM zurueckgerechnet. War die
     ganze Sure abgehakt, trug KEIN Vers dieses Attribut - die Kaestchen waren
     damals gesperrt. Also blieb `id` leer, `aktualisiereHifzLeiste` lief nicht,
     und die Beschriftung blieb stehen. Verdeckt wurde trotzdem, weil das die
     Schleife darueber erledigt - deshalb "tut es seinen job".

     Punkt 13 hat die Sperre entfernt und damit auch diesen Fall repariert. Die
     Rueckrechnung bleibt trotzdem falsch: sie macht die Beschriftung davon
     abhaengig, wie die Verse gerade gebaut sind. Die offene Sure merkt sich die
     App jetzt direkt. */
  if (OFFENE_SURE) aktualisiereHifzLeiste(OFFENE_SURE, SURAH_DATA.find(s=>s.id===OFFENE_SURE));
});


/* Die gespeicherte Ansicht gilt ab dem ersten Bildaufbau, nicht erst, wenn das
   Menue einmal geoeffnet wurde. Sonst startet der Leser immer in 100 % und
   springt erst um, sobald man die Einstellung anfasst. */
wendeQuranAnsichtAn();
