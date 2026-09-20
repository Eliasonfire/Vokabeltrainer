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
   ⭐ WORT-HERVORHEBUNG: DOCH — die Zeitmarken gibt es
   ---------------------------------------------------------------------------

   ⛔ Hier stand bis zum 08.09.2026 nachmittags das Gegenteil: „An drei
   Endpunkten gesucht, an keinem gefunden." Das war falsch, und es hat den Fall
   fuer einen halben Tag geschlossen. Nachgemessen an vier Endpunkten:

     recitations/{id}/by_chapter/{sure}?segments=true        keine
     chapter_recitations/{id}/{sure}                         keine
     verses/by_chapter/{sure}?audio={id}&words=true          ⭐ JA
     qdc/audio/reciters/{id}/audio_files?segments=true       ja (interne API)

   Genommen wird der dritte: er gehoert zur oeffentlichen v4-API, und seine
   Zeiten sind VERS-relativ — sie passen also zu den Einzeldateien, die der
   Leser abspielt. Gemessen an Sure 114 fuer alle zwoelf Rezitatoren: alle
   zwoelf liefern Segmente. Gegenprobe auf sure-relative Zeiten: Vers 2 von
   114 beginnt bei Rezitator 1 bei 1850 ms, waehrend Vers 1 bis 10080 ms
   laeuft — die Uhr faengt je Vers neu an.

   ⚠️ Vers-weises Mitlesen braucht davon nichts: wer die Datei `067005.mp3`
   abspielt, WEISS, welcher Vers laeuft. Deshalb laeuft es weiter ohne einen
   einzigen Netzabruf, und Wort-fuer-Wort ist die Zugabe fuer den, der sie
   einschaltet. [[erfundene_begruendung_schliesst_den_fall]]

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
/* ⛔ AUSGEWAEHLT AM 09.09.2026. Elias, nachdem er sie durchgehoert hatte:
   „bei den rezitatorn kannst du nr. 2, 4, 5, 7, 8, 9, 10, 11, 12 weg machen,
   sie gefallen mir nicht wirklich".

   ⚠️ Gemeint sind die PLAETZE in der Auswahlliste, nicht die `id` — die Liste
   ist ein <select> und zeigt nur Namen, keine Nummern. Gezaehlt hat er also
   das, was er sieht. Geblieben sind die Plaetze 1, 3 und 6.

   ⭐ Die neun anderen werden NICHT geloescht, sondern stehen darunter
   auskommentiert — genau wie bei den Schriftarten am 08.09.: „kannst sie bei
   dir gespeichert lassen damit wir wieder darauf zurück kommen können".
   Zum Zurueckholen genuegt es, die Zeile wieder freizulegen.

   ⚠️ Wer vorher einen der neun eingestellt hatte, faellt weich auf den ersten
   zurueck: `quranRezitator()` gibt `QURAN_REZITATOREN[0].id`, wenn die
   gespeicherte id nicht mehr in der Liste steht. Nachgesehen, nicht
   angenommen. [[vorgabewert_greift_nicht_bei_null]] */
const QURAN_REZITATOREN = [
  { id:  7, name: 'Mishārī al-ʿAfāsī',        pfad: 'Alafasy/mp3/' },
  { id:  1, name: 'ʿAbd al-Bāsiṭ',   stil: 'Mujawwad', pfad: 'AbdulBaset/Mujawwad/mp3/' },
  { id:  4, name: 'Abū Bakr ash-Shāṭirī',     pfad: 'Shatri/mp3/' }
];

/* ⛔ AUFGEHOBEN, nicht geloescht — die neun am 09.09.2026 abgewaehlten. Die
   drei mit `//` liegen auf einem Spiegel, nicht bei quran.com.
  { id:  2, name: 'ʿAbd al-Bāsiṭ',   stil: 'Murattal', pfad: 'AbdulBaset/Murattal/mp3/' },
  { id:  3, name: 'ʿAbd ar-Raḥmān as-Sudais', pfad: 'Sudais/mp3/' },
  { id: 10, name: 'Saʿūd ash-Shuraim',        pfad: 'Shuraym/mp3/' },
  { id:  5, name: 'Hānī ar-Rifāʿī',           pfad: 'Rifai/mp3/' },
  { id:  9, name: 'al-Minshāwī',     stil: 'Murattal', pfad: 'Minshawi/Murattal/mp3/' },
  { id:  8, name: 'al-Minshāwī',     stil: 'Mujawwad', pfad: 'Minshawi/Mujawwad/mp3/' },
  { id:  6, name: 'Maḥmūd al-Ḥuṣarī',
    pfad: '//mirrors.quranicaudio.com/everyayah/Husary_64kbps/' },
  { id: 12, name: 'Maḥmūd al-Ḥuṣarī', stil: 'Muʿallim',
    pfad: '//mirrors.quranicaudio.com/everyayah/Husary_Muallim_128kbps/' },
  { id: 11, name: 'Muḥammad aṭ-Ṭablāwī',
    pfad: '//mirrors.quranicaudio.com/everyayah/Mohammad_al_Tablaway_128kbps/' }
*/
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
/** Die Rezitation an- oder ausschalten — EIN Weg für den Schalter in den
 *  Koran-Einstellungen UND für das ✕ in der Leiste.
 *
 *  Elias am 20.09.2026, 02:38, mit Bild (das ✕ rot umrandet): „wenn ich das
 *  drücke will ich das rezitator komplett aus ist, auch in den einstellungen
 *  des korans". Vorher beendete das ✕ nur den laufenden Ton (`audioAus`), die
 *  Leiste blieb stehen und der Schalter stand weiter auf „An" — und solange
 *  nichts lief, war das ✕ sogar gesperrt.
 *
 *  ⛔ Beide Stellen rufen DIESE Funktion. Zwei Wege zum selben Zustand laufen
 *  auseinander: der eine vergisst das Speichern, der andere die Anzeige in
 *  den Einstellungen. [[dieselbe_frage_zwei_antworten]] */
function quranRezitationSetzen(wert){
  SETTINGS.quranRezitation = (wert === 'an') ? 'an' : 'aus';
  saveSettings();
  /* Aus heißt aus: Ton beenden, Mediensitzung räumen. audioAus() ruft am Ende
     zeigeSpieler() — die Leiste verschwindet, weil quranRezitationAn() jetzt
     falsch ist. */
  if (!quranRezitationAn()) audioAus();
  /* Zieht den Schalter in den Koran-Einstellungen nach (und die abhängigen
     Zeilen Rezitator/Mitlesen) und ruft zeigeSpieler(). */
  if (typeof wendeQuranAnsichtAn === 'function') wendeQuranAnsichtAn();
  else zeigeSpieler();
}
/* Mitlesen ist AN, sobald die Rezitation an ist: es ist der eigentliche Zweck
   der Sache und kostet ohne laufenden Ton nichts.

   ⭐ Seit dem 08.09.2026 hat es drei Stufen. Elias: „obwohl lass für
   vokabeltrainer erstmal das vers für vers hervorhebung und füge noch die
   option hinzu wort für wort hervorhebung".

   ⚠️ Der alte gespeicherte Wert war 'an'. Er wird auf 'vers' gelesen statt
   ueberschrieben — wer die App seit gestern offen hat, findet sie unveraendert
   vor, und niemand landet auf einer Stufe, die er nie gewaehlt hat. */
/* ⛔ ZWEI Schalter, nicht eine Stufenwahl. Elias am 08.09.2026: „hast du auch
   option eingebaut das mit dem vers hervorheben und wort hervorheben? ich will
   beide an und aus machen können" — also auch die Verbindung „nur das Wort,
   kein Versbalken", die eine Stufenleiter nicht hergibt.

   ⚠️ Der alte Wert lag unter EINEM Schluessel (`quranMitlesen`: 'aus' | 'an' |
   'vers' | 'wort'). Er wird gelesen, solange die neuen Schluessel fehlen —
   niemand findet seine Einstellung veraendert vor. */
function quranMitleseVers(){
  if (SETTINGS.quranMitleseVers !== undefined) return SETTINGS.quranMitleseVers !== 'aus';
  return SETTINGS.quranMitlesen !== 'aus';          /* alter Schluessel */
}
function quranMitleseWort(){
  if (SETTINGS.quranMitleseWort !== undefined) return SETTINGS.quranMitleseWort === 'an';
  return SETTINGS.quranMitlesen === 'wort';         /* alter Schluessel */
}
/* „Irgendeine Marke an" — gebraucht, wo es nur darum geht, ob ueberhaupt
   etwas hervorgehoben wird. */
function quranMitlesen(){ return quranMitleseVers() || quranMitleseWort(); }
/* ⛔ Hier stand bis 16:50 zusaetzlich `quranMitleseModus()` und darueber der
   Satz „der eine wird an drei Stellen gerufen". Beim Umbau auf zwei Schalter
   wurden alle drei Aufrufstellen einzeln ersetzt — die Funktion blieb stehen,
   der Kommentar auch, und er las sich weiter wie eine Tatsache. Gefunden erst
   beim Nachzaehlen der Verwender, nicht beim Lesen.
   [[kommentar_beschreibt_absicht_markup_wirkung]] */
/* ⛔ Getrennt vom Mitlesen, weil es zwei verschiedene Dinge sind — und Elias
   genau diese Trennung verlangt hat: „beim mitlesen will ich auch die option
   haben das ‚verfolgen‘ nicht mit dabei ist. also die hervorhebung finde ich
   gut aber das automatisch gescrollt wird will ich nicht immer".
   Vorgabe bleibt AN: so verhaelt es sich wie bisher. */
function quranVerfolgen(){ return SETTINGS.quranVerfolgen !== 'aus'; }

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

/* `versuche`/`versuchFuer` seit 15.09.2026: der Ton kommt ueber das Netz, und
   ein einzelner Aussetzer soll die Wiedergabe nicht mehr beenden.
   ⛔ DIESE ZEILE MUSS EINZEILIG BLEIBEN. werkzeuge/pruefe-zweipuffer.mjs
   schneidet sie mit `\nconst QAUDIO = \{[^\n]*\n` heraus, um audioSpiele
   isoliert laufen zu lassen. Ein Umbruch liefert dort ein halbes Objekt und
   einen SyntaxError — genau so ist der Pruefer am 15.09.2026 rot geworden. */
/* ============================================================================
   DAS TON-PROTOKOLL                                    (20.09.2026, v542)
   ============================================================================

   Elias am 20.09.2026, nach v535: „ich hab eben rezitator an gemacht und es
   liefen so ca 3 verse bis es jetzt aufgehört hat bei geschlossenem display zu
   spielen" — „wenn ich aber den bildschirm anlasse dann gibts keine probleme"
   — und auf meine Frage, was danach im Spieler steht: „dann steht da nichts,
   er hört einfach auf zu spielen und das wars".

   ⛔⛔ Das ist ein Fehler, den ich NIE erlebe: hier läuft kein Ton, und der
   Pane darf keinen machen. Zweimal ist dafür schon aus Überlegung gebaut
   worden (09.09. zwei Elemente, 19.09. Wechsel-Marke und Wache), und beide Male
   hat erst sein Handy gezeigt, dass es nicht reicht. Deshalb schreibt die App
   jetzt MIT, was wirklich passiert — jedes Ereignis beider Elemente mit
   Ladezustand, jede Entscheidung beim Verswechsel, ob die Seite verborgen
   oder eingefroren war, und ein Takt alle zehn Sekunden, an dessen Lücken man
   sieht, ob Zeitgeber bei ausgeschaltetem Bildschirm überhaupt laufen.
   [[fehler_den_der_entwickler_nie_erlebt]] [[diagnose_statt_raten]]

   ⭐ Der Weg zu mir ist der, den es schon gibt: Einstellungen → Diagnose →
   „An Claude schicken" hängt das Protokoll an (js/einstellungen.js,
   diagnoseAnhang), gelesen wird es mit werkzeuge/diagnose-holen.mjs. Auf der
   sichtbaren Karte steht nur EINE Zeile — sie muss auf ein Bildschirmfoto
   passen.

   ⛔ Das Protokoll liegt im Gerätespeicher (`vt_tonprotokoll`), nicht nur im
   Arbeitsspeicher: wird die Seite bei ausgeschaltetem Bildschirm beendet, ist
   genau die letzte Zeile vor dem Ende die Antwort. Es wird NICHT abgeglichen
   und NICHT gesichert — es beschreibt dieses eine Gerät.
   ⛔ tonLog() darf nie werfen: es steht mitten in der Wiedergabe.
   ⚠️ BAUSTELLE: kommt wieder heraus, sobald die Ursache gefunden ist. */
const QTON_SCHLUESSEL = 'vt_tonprotokoll';
const QTON_MAX = 200;
let QTON = null;

function tonLog(text){
  try {
    if (QTON === null){
      try { QTON = JSON.parse(localStorage.getItem(QTON_SCHLUESSEL) || '[]'); } catch (e){ QTON = []; }
      if (!Array.isArray(QTON)) QTON = [];
      /* Steht schon etwas da, war die Seite zwischendurch weg — das ist selbst
         ein Befund (beendet? neu geladen?) und bekommt eine eigene Zeile. */
      if (QTON.length) QTON.push([Date.now(), 0, '——— App neu gestartet ———']);
    }
    QTON.push([Date.now(), (typeof document !== 'undefined' && document.hidden) ? 1 : 0, String(text)]);
    if (QTON.length > QTON_MAX) QTON.splice(0, QTON.length - QTON_MAX);
    localStorage.setItem(QTON_SCHLUESSEL, JSON.stringify(QTON));
  } catch (e){
    try { if (typeof stillerFehler === 'function') stillerFehler('Ton-Protokoll', e); } catch (_){ /* nie werfen */ }
  }
}

/** Eine Zeile je Ereignis eines Abspielelements: welches (A/B), ob es das
 *  spielende ist (*), Ladezustand (rs 0–4), Netzzustand (ns 0–3), Stelle, Datei. */
function tonLogElement(name, el){
  try {
    const i = QAUDIO.paar ? QAUDIO.paar.indexOf(el) : -1;
    const wer = (i === 0 ? 'A' : i === 1 ? 'B' : '?') + (el === QAUDIO.el ? '*' : ' ');
    const datei = String(el.currentSrc || el.src || '').split('/').pop() || '(leer)';
    tonLog(wer + ' ' + name + ' rs' + el.readyState + ' ns' + el.networkState
      + ' t' + (Number(el.currentTime) || 0).toFixed(1)
      + (el.error ? ' FEHLER' + el.error.code : '') + ' ' + datei);
  } catch (e){ /* nie werfen */ }
}

/** Das Protokoll als Text — für „An Claude schicken" und „Kopieren". */
function tonProtokollText(){
  let zeilen = [];
  try { zeilen = QTON !== null ? QTON : JSON.parse(localStorage.getItem(QTON_SCHLUESSEL) || '[]'); } catch (e){ zeilen = []; }
  if (!Array.isArray(zeilen)) zeilen = [];
  const zwei = (n, l) => String(n).padStart(l || 2, '0');
  const kopf = 'Ton-Protokoll: ' + zeilen.length + ' Zeilen, neueste unten. '
    + 'H = Seite verborgen (Bildschirm aus), * = das spielende Element, rs = Ladezustand 0–4.';
  return [kopf].concat(zeilen.map(z => {
    const d = new Date(z[0]);
    return zwei(d.getHours()) + ':' + zwei(d.getMinutes()) + ':' + zwei(d.getSeconds()) + '.' + zwei(d.getMilliseconds(), 3)
      + (z[1] ? ' H ' : '   ') + z[2];
  })).join('\n');
}
function tonProtokollZahl(){
  try { return (QTON !== null ? QTON : JSON.parse(localStorage.getItem(QTON_SCHLUESSEL) || '[]')).length || 0; }
  catch (e){ return 0; }
}

/* Was mit der SEITE passiert, während etwas läuft. `freeze`/`resume` meldet
   der Browser, wenn er eine verborgene Seite einfriert — dann läuft kein
   Skript mehr, und kein `ended` kommt an. */
if (typeof document !== 'undefined' && document.addEventListener){
  const seite = (text) => () => { if (QAUDIO.sure !== null) tonLog('SEITE ' + text); };
  document.addEventListener('visibilitychange', () => { if (QAUDIO.sure !== null) tonLog('SEITE ' + (document.hidden ? 'verborgen' : 'sichtbar')); });
  document.addEventListener('freeze', seite('EINGEFROREN'));
  document.addEventListener('resume', seite('aufgetaut'));
  window.addEventListener('pagehide', seite('pagehide'));
  window.addEventListener('pageshow', seite('pageshow'));
  window.addEventListener('offline', seite('Netz weg'));
  window.addEventListener('online',  seite('Netz da'));
}

const QAUDIO = { el:null, paar:null, sure:null, vers:0, laeuft:false, hinweis:'', versuche:0, versuchFuer:null, wechsel:false, warte:null };

/** Wie viele Verse hat die Sure? Erst der aufgebaute Leser, dann die Surenliste
 *  — der Leser ist die Wahrheit, weil er den Text wirklich vor sich hat. */
function audioVersZahl(sure){
  const c = (typeof VERSE_CACHE === 'object' && VERSE_CACHE[sure]) || null;
  if (c && c.length) return c.length;
  if (typeof versZahl === 'function') return versZahl(sure) || 0;
  return 0;
}

/* ============================================================================
   ZWEI ELEMENTE, ABWECHSELND                          (09.09.2026)
   ============================================================================

   Elias: „sobald ich beim tablet ausschalte und rezitator weiter laufen lasse
   dann läuft er für genau 2 ayaht und das wars. er soll durchlaufen" — und
   nachgereicht: „auch auf meinem handy ist das so".

   ⭐⭐ „Genau zwei" ist die Diagnose, nicht bloss die Menge. Vorher gab es EIN
   Abspielelement, dessen `src` je Vers gewechselt wurde, und daneben einen
   stillen Vorlader:

     Vers 1  spielt   — geladen, solange der Bildschirm noch an war
     Vers 2  spielt   — lag schon im Vorlader
     Vers 3  STILL    — braucht einen NEUEN Ladevorgang

   Und genau den schiebt der Browser bei ausgeschaltetem Bildschirm auf: eine
   verborgene Seite darf laufende Wiedergabe fortsetzen, aber neue
   Medienressourcen werden zurueckgestellt. Deshalb endete es immer nach dem
   zweiten Vers, auf beiden Geraeten gleich. [[hintergrund_tab_droselt_timer]]

   ⭐ Die Loesung ist, nie ein frisch geladenes Element starten zu muessen:
   zwei Elemente wechseln sich ab. Waehrend A den laufenden Vers spielt, hat B
   den naechsten schon vollstaendig geladen. Am Versende wird B gestartet —
   kein neuer Ladevorgang, nur ein `play()` auf eine fertige Datei — und A
   laedt still den uebernaechsten.

   ⚠️ `QAUDIO.el` bleibt der Name fuer das GERADE spielende Element. Wortuhr,
   Fortschrittsbalken und Pausenknopf lesen ihn weiter und mussten nicht
   angefasst werden. [[endpunkt_der_zuerst_steht]] */
function audioBaue(){
  const el = new Audio();
  el.preload = 'auto';
  /* Ton-Protokoll (20.09.2026): jedes Ereignis BEIDER Elemente. `typeof`, weil
     die Prüfer diese Funktion allein in ein vm schneiden. */
  ['loadstart', 'canplaythrough', 'play', 'playing', 'waiting', 'stalled', 'suspend',
   'pause', 'ended', 'error', 'abort', 'emptied'].forEach(n =>
    el.addEventListener(n, () => { if (typeof tonLogElement === 'function') tonLogElement(n, el); }));
  /* ⛔ Nur das AKTIVE Element schaltet weiter. Ohne diese Abfrage meldete auch
     das Element, das gerade nur vorlaedt, ein `ended` — und die Rezitation
     spraenge zwei Verse auf einmal. */
  el.addEventListener('ended', () => { if (el === QAUDIO.el) audioNaechster(); });
  /* ⛔ `timeupdate` und nicht die Wortuhr: das Ereignis feuert rund viermal
     je Sekunde — für eine Fortschrittsanzeige genug. Die Wortuhr läuft im
     Bildtakt und gäbe sechzigmal je Sekunde dieselbe Auskunft. */
  el.addEventListener('timeupdate', () => { if (el === QAUDIO.el) quranMedienPosition(); });
  /* Die Dauer steht erst mit den Metadaten fest — vorher wäre sie NaN und
     der Balken bliebe leer. */
  el.addEventListener('loadedmetadata', () => { if (el === QAUDIO.el) quranMedienPosition(); });
  el.addEventListener('durationchange', () => { if (el === QAUDIO.el) quranMedienPosition(); });
  el.addEventListener('play',  () => {
    if (el !== QAUDIO.el) return;
    /* Der Wechsel ist vorbei, sobald wieder Ton kommt — und die Stillstands-
       Wache fängt hier an zu zählen (19.09.2026). */
    QAUDIO.wechsel = false;
    QAUDIO.laeuft = true; QAUDIO.hinweis = ''; zeigeSpieler(); wortModusVorbereiten();
    quranStilleAn(); quranMedienInfo();
    audioWacheAn();
  });
  el.addEventListener('pause', () => {
    /* ⛔ Auch hier: das vorladende Element pausiert beim Laden gelegentlich von
       selbst. Ohne diese Abfrage sähe die App das als „angehalten" und würde
       die stille Schleife mitten in der Rezitation abschalten. */
    if (el !== QAUDIO.el) return;
    /* ⛔⛔ EIN VERSWECHSEL IST KEINE PAUSE (19.09.2026).

       Elias am 19.09.2026: „wenn ich einen rezitator spielen lasse, dass er
       immer wieder aufhört und nicht durch spricht" — und nachgereicht:
       „Vorallem wenn ich meinen Bildschirm aus mache".

       `el.src = …` und `el.load()` feuern ein `pause` auf DEMSELBEN Element,
       das gerade das spielende ist. Ohne diese Abfrage schaltete der Handgriff
       unten `quranStilleAus()` — und damit ging die stille Schleife genau in
       der Lücke aus, die sie überbrücken soll. Bei ausgeschaltetem Bildschirm
       verliert die Seite damit ihre Mediensitzung, und danach kommt nichts
       mehr. Für Elias sieht das aus wie „hört mittendrin auf".

       ⛔ Die Marke räumt jeder ECHTE Handgriff selbst, bevor er anhält
       (`audioUmschalten`, `audioAus`) — ein Druck auf Pause wird nie
       verschluckt. [[handlung_macht_ihre_bedingung_ungueltig]] */
    if (QAUDIO.wechsel) return;
    /* ⛔⛔ AUCH DAS NATÜRLICHE VERSENDE IST KEINE PAUSE (20.09.2026, GEMESSEN).

       Am Ende einer Datei feuert der Browser ERST `pause`, DANN `ended`. Das
       stand in keinem meiner Prüfer — es steht in Elias' Ton-Protokoll von
       03:04:19: „A* pause rs4 t10.7", 29 ms später „A* ended", und dazwischen
       „STILLE pause". Die Wechsel-Marke von v535 fängt nur das `pause` ab,
       das `src`/`load()` auslösen; dieses hier kommt davor.

       Die Folge bei ausgeschaltetem Bildschirm: für einen Augenblick spielt
       in der ganzen Seite NICHTS mehr — der Vers ist zu Ende, die stille
       Schleife von hier abgeschaltet. Damit gibt der Browser die
       Mediensitzung frei, und der nächste Vers muss sie aus dem Hintergrund
       neu anfordern. Kurz nach dem Ausschalten geht das noch durch; im
       Protokoll 16 s danach nicht mehr: 45 ms nach dem Neustart hält das
       System die stille Schleife an, 200 ms später den neuen Vers — ohne
       jede Meldung („dann steht da nichts"). Deshalb waren es am 09.09.
       „genau 2 ayaht" und am 20.09. „ca 3 verse": es hängt an der ZEIT seit
       dem Ausschalten, nicht an der Zahl der Verse.

       `el.ended` ist an dieser Stelle schon wahr. Das letzte Versende einer
       Sure räumt audioAus() selbst auf (über `ended` → audioNaechster). */
    if (el.ended) return;
    QAUDIO.laeuft = false; audioWacheAus(); zeigeSpieler(); quranMedienInfo();
    /* ⛔⛔ DIE STILLE MUSS MIT. Elias am 08.09.2026: „ich will ein video gucken
       und sorge dafür das der ton vom quran gemuted ist damit es sich nicht
       mit meinem video überschneidet."

       Die stille Schleife wurde eine Stunde vorher eingebaut, um die Luecke
       zwischen zwei Versen zu ueberbruecken — sie haelt die Mediensitzung.
       Genau das wird beim PAUSIEREN zum Fehler: der Ton steht, aber die
       Sitzung laeuft weiter und nimmt sie der App weg, die sie gerade braucht.

       ⭐ Und es trifft nicht nur den Druck auf Pause: Android pausiert das
       Element von SELBST, wenn eine andere App Ton anfordert. Dann wusste
       niemand mehr, dass hier noch etwas laeuft — es war ja still.
       [[ausfall_ist_unsichtbar_gebaut]] */
    quranStilleAus();
    /* ⚠️ Die Wortmarke bleibt STEHEN — sie zeigt, wo man aufgehoert hat. Nur
       die Bildwiederholung wird beendet, damit sie nicht leer weiterlaeuft. */
    if (QW_UHR !== null){ cancelAnimationFrame(QW_UHR); QW_UHR = null; }
  });
  el.addEventListener('error', () => {
    /* ⚠️ Beim Beenden wird `src` entfernt, und genau das loest in manchen
       Browsern ebenfalls `error` aus. Ohne diese Abfrage stuende nach jedem
       Beenden eine Fehlermeldung da, die keinen Fehler beschreibt. */
    if (QAUDIO.sure === null) return;
    if (el !== QAUDIO.el) return;      /* das vorladende Element meldet still */
    /* Ein Fehler beendet jeden Wechsel — sonst bliebe die Marke stehen und das
       nächste echte Anhalten würde verschluckt (19.09.2026). */
    QAUDIO.wechsel = false;
    QAUDIO.laeuft = false;
    QAUDIO.hinweis = 'Aufnahme nicht erreichbar — Internet?';
    zeigeSpieler();
  });
  return el;
}

/** Die zwei Elemente. `QAUDIO.el` zeigt immer auf das SPIELENDE. */
function audioElement(){
  if (!QAUDIO.paar) QAUDIO.paar = [audioBaue(), audioBaue()];
  if (!QAUDIO.el) QAUDIO.el = QAUDIO.paar[0];
  return QAUDIO.el;
}
/** Das andere der beiden — dort liegt der naechste Vers schon fertig. */
function audioAnderes(){
  audioElement();
  return QAUDIO.paar[0] === QAUDIO.el ? QAUDIO.paar[1] : QAUDIO.paar[0];
}

/** Holt die naechste Datei still in den Browsercache, damit zwischen zwei
 *  Versen keine Lade-Pause steht. ⛔ Wird nie abgespielt. */
function audioVorladen(sure, vers){
  if (!sure || vers < 1 || vers > audioVersZahl(sure)) return;
  const url = audioAdresse(quranRezitator(), sure, vers);
  if (!url) return;
  /* ⛔ Vorgeladen wird in das ANDERE Abspielelement, nicht in ein drittes.
     Genau darin liegt der Unterschied: am Versende muss kein neuer
     Ladevorgang beginnen, es wird nur `play()` auf eine fertige Datei
     gerufen — und das erlaubt der Browser auch bei ausgeschaltetem
     Bildschirm. Ein eigener Vorlader konnte das nie, weil seine Datei danach
     trotzdem in das spielende Element neu geladen werden musste. */
  const b = audioAnderes();
  if (b.src !== url){ b.src = url; try { b.load(); } catch (e){ /* laedt spaetestens beim play() */ } }
  /* ⛔⛔ DIE ADRESSE STIMMT, DIE DATEI IST KAPUTT (19.09.2026).
     Das Vorladen laeuft ueber das Netz und scheitert unterwegs staendig. Dann
     stand hier die richtige Adresse und dahinter ein Element im Fehlerzustand
     — verglichen wurde nur `src`. Jedes `play()` darauf wurde sofort
     abgewiesen, und weil an der Adresse nichts zu aendern war, hat es auch nie
     jemand neu geladen: die Rezitation blieb an derselben Stelle stehen.
     `load()` raeumt den Fehlerzustand. [[vorgabewert_sieht_aus_wie_befund]] */
  else if (b.error){ try { b.load(); } catch (e){ /* naechster Versuch holt es */ } }
}

/** Welcher Vers kommt WIRKLICH als naechstes — mit dem Bereich gerechnet?
 *  ⛔ Diese Frage stand bis zum 19.09.2026 an drei Stellen im Code und ist am
 *  15.09.2026 schon einmal auseinandergelaufen (der Vorrat lud den Vers, der
 *  OHNE Schleife gekommen waere, und der Ruecksprung begann mit einem
 *  Netzabruf — „am Ende der sura"). Jetzt steht sie einmal hier.
 *  Gibt 0 zurueck, wenn danach Schluss ist. [[dieselbe_frage_zwei_antworten]] */
function audioFolgeVers(sure, vers){
  if (!sure) return 0;
  if (schleifeGilt() && vers >= QSCHLEIFE.bis) return QSCHLEIFE.von;
  if (vers >= audioVersZahl(sure)) return 0;
  return vers + 1;
}

/* ============================================================================
   DIE STILLSTANDS-WACHE                                (19.09.2026)
   ============================================================================

   Elias am 19.09.2026: „wenn ich einen rezitator spielen lasse, dass er immer
   wieder aufhört und nicht durch spricht und das das gefixt werden muss" —
   nachgereicht: „Vorallem wenn ich meinen Bildschirm aus mache".

   ⭐⭐ Der Ausfall, den KEIN Ereignis meldet: läuft der Puffer mitten im Vers
   leer, kommt kein `ended`, kein `error`, kein `pause`. Die App hält sich für
   laufend, der Knopf zeigt weiter Pause — und es kommt nichts mehr. Es gibt
   also keine Stelle, an der eine Erholung hängen könnte; sie muss selbst
   nachsehen. [[ausfall_ist_unsichtbar_gebaut]]

   Alle 2 s wird `currentTime` verglichen:
     · steht er 2 s  → „Puffert …" (ein Puffern sah bisher aus wie ein Absturz),
     · steht er 6 s  → derselbe Vers wird neu geholt und an DERSELBEN Stelle
                       fortgesetzt, nicht von vorn.

   ⚠️ BEI AUSGESCHALTETEM BILDSCHIRM UNGEPRÜFT. Browser drosseln Zeitgeber in
   verborgenen Seiten; die stille Schleife hält die Seite als „spielt Ton" wach,
   was die Drosselung mildert. Ob der 2-Sekunden-Takt dort wirklich ankommt,
   zeigt erst sein Handy — hier ist kein Ton zu hören und der Pane darf keinen
   machen. [[hintergrund_tab_droselt_timer]] */
let QAUDIO_WACHE = null;
let QAUDIO_STAND = { zeit: -1, seit: 0 };
const QAUDIO_WACHE_TAKT = 2000;
const QAUDIO_STILLSTAND = 6000;

function audioWacheAn(){
  if (QAUDIO_WACHE === null) QAUDIO_WACHE = setInterval(audioWacheTick, QAUDIO_WACHE_TAKT);
}
function audioWacheAus(){
  if (QAUDIO_WACHE !== null){ clearInterval(QAUDIO_WACHE); QAUDIO_WACHE = null; }
  QAUDIO_STAND = { zeit: -1, seit: 0 };
}
function audioWacheTick(){
  const el = QAUDIO.el;
  /* Ton-Protokoll: jeder fünfte Takt (10 s) schreibt eine Zeile. An den LÜCKEN
     zwischen diesen Zeilen sieht man, ob Zeitgeber bei ausgeschaltetem
     Bildschirm überhaupt noch laufen — die Frage, die seit dem 19.09.2026 als
     „ungeprüft" über dieser Wache steht.
     ⚠️ Der Zähler hängt an der Funktion selbst, nicht an einer Variablen
     daneben: pruefe-zweipuffer.mjs schneidet diese Funktion ALLEIN in ein vm —
     eine `let` davor käme dort nicht mit (so am 20.09.2026 rot geworden). */
  audioWacheTick.takt = (audioWacheTick.takt || 0) + 1;
  if (audioWacheTick.takt % 5 === 0 && typeof tonLog === 'function' && el){
    tonLog('TAKT vers ' + QAUDIO.vers + ' t' + (Number(el.currentTime) || 0).toFixed(1)
      + ' rs' + el.readyState + (el.paused ? ' PAUSIERT' : '') + (QAUDIO.wechsel ? ' wechsel' : ''));
  }
  /* Angehalten, weggeblättert oder mitten im Verswechsel: nichts zu wachen. */
  if (!el || QAUDIO.sure === null || !QAUDIO.laeuft || el.paused || QAUDIO.wechsel){
    QAUDIO_STAND = { zeit: -1, seit: 0 };
    return;
  }
  const t = Number(el.currentTime) || 0;
  /* 0,05 s Toleranz: `currentTime` ist eine Fließkommazahl und steht auch im
     Normalbetrieb nie exakt still. */
  if (QAUDIO_STAND.zeit >= 0 && Math.abs(t - QAUDIO_STAND.zeit) < 0.05){
    QAUDIO_STAND.seit += QAUDIO_WACHE_TAKT;
    if (QAUDIO_STAND.seit >= QAUDIO_STILLSTAND){ audioNachladen(t); return; }
    if (!QAUDIO.hinweis){ QAUDIO.hinweis = 'Puffert …'; zeigeSpieler(); }
    return;
  }
  QAUDIO_STAND = { zeit: t, seit: 0 };
  if (QAUDIO.hinweis === 'Puffert …'){ QAUDIO.hinweis = ''; zeigeSpieler(); }
}

/** Denselben Vers neu holen und an DERSELBEN Stelle weiterspielen.
 *  ⛔ Nicht von vorn: wer bei Sekunde 40 eines langen Verses steht, hörte sonst
 *  alles noch einmal — und beim nächsten Stillstand wieder. */
function audioNachladen(pos){
  const el = QAUDIO.el;
  if (!el || QAUDIO.sure === null) return;
  QAUDIO_STAND = { zeit: -1, seit: 0 };
  if (typeof tonLog === 'function') tonLog('WACHE: 6 s Stillstand bei t' + (Number(pos) || 0).toFixed(1) + ' — Vers wird neu geholt');
  QAUDIO.hinweis = 'Ton stockt — wird neu geholt …';
  zeigeSpieler();
  /* `load()` feuert ein `pause`; das ist kein Anhalten (siehe `pause`-Handler). */
  QAUDIO.wechsel = true;
  const weiter = () => {
    try { el.currentTime = pos; } catch (e){ /* geht erst mit den Metadaten */ }
    const p = el.play();
    if (p && p.then) p.then(() => { QAUDIO.wechsel = false; },
                            () => { QAUDIO.wechsel = false; });
    else QAUDIO.wechsel = false;
  };
  /* `once`: sonst hinge nach jedem Nachladen ein Zuhörer mehr am Element. */
  el.addEventListener('loadedmetadata', weiter, { once: true });
  try { el.load(); } catch (e){ QAUDIO.wechsel = false; }
}

/* ⛔⛔ MEHR GEDULD ALS DAS FUNKLOCH (19.09.2026).
   Drei Versuche im Abstand 350/700/1050 ms sind zusammen 2,1 Sekunden —
   kürzer als jeder Tunnel, durch den er fährt; alle drei fielen in dieselbe
   Störung. Jetzt: fünf schnelle Versuche (0,4 · 0,8 · 1,6 · 3,2 · 6,4 s, also
   12,4 s), danach alle 15 Sekunden weiter, bis zehn Minuten um sind.
   ⭐ Und kommt das Netz vorher zurück, läuft es sofort wieder an (`online`,
   ganz unten). Zum Handy greifen ist beim Radfahren oder im Gebet keine
   Bedienung, sondern ein Abbruch. */
const QAUDIO_SCHNELL = 5;
const QAUDIO_LANGE = 40;

async function audioSpiele(sure, vers){
  /* ⛔ Der Geh-Modus zuerst aus. Beide beschriften dieselbe Mediensitzung, und
     beide spielen Ton — nebeneinander waeren es zwei Stimmen und ein
     Pause-Knopf, der den falschen Modus trifft. Die Gegenrichtung steht in
     `gehStilleAn()` in js/hoeren.js.
     ⚠️ Nur beim ERSTEN Vers: `audioSpiele` laeuft bei jedem Weiterblaettern,
     und der Geh-Modus ist dann laengst aus. */
  /* ⚠️ try/catch, nicht nur `typeof`: js/hoeren.js wird NACH dieser Datei
     geladen, und ein `const` aus einer Datei, die nicht durchlief, wirft beim
     blossen `typeof` einen ReferenceError. Ohne die Klammer risse ein Fehler
     im Hoermodus den Quran-Leser mit. [[const_ist_im_vm_kontext_unsichtbar]] */
  if (QAUDIO.sure === null){
    /* ⛔⛔ Faellt das hier aus, laeuft der Geh-Modus WEITER, waehrend die
       Rezitation anfaengt — zwei Stimmen gleichzeitig in seinem Zimmer. Das
       ist der teuerste Fehler dieser Datei und darf nicht still bleiben. */
    try {
      if (GEH && GEH.an && typeof gehModusSetzen === 'function') gehModusSetzen(false);
    } catch (e){ stillerFehler('Quran-Ton: Geh-Modus liess sich nicht abschalten', e); }
  }
  const anzahl = audioVersZahl(sure);
  if (!anzahl || vers < 1 || vers > anzahl){ audioAus(); return; }
  const url = audioAdresse(quranRezitator(), sure, vers);
  if (!url){ audioAus(); return; }
  QAUDIO.sure = sure; QAUDIO.vers = vers; QAUDIO.hinweis = '';
  /* ⛔ Sonst faellt das erste Wort des neuen Verses aus: es traegt Index 0,
     und wenn der alte Vers dort stehengeblieben war, gaebe es keinen Wechsel. */
  QW_LETZTES = -1;
  /* ⭐ Liegt der Vers schon im anderen Element, wird DIESES das spielende —
     kein neuer Ladevorgang. Das ist der ganze Trick gegen „genau zwei Ayat".
     ⚠️ Das bisher spielende wird angehalten und zurueckgespult, sonst laufen
     zwei Stimmen uebereinander. Sein `pause`-Ereignis greift nicht mehr,
     weil `QAUDIO.el` da schon umgesetzt ist — genau dafuer sind die
     `el === QAUDIO.el`-Abfragen oben da. */
  audioElement();
  const b = audioAnderes();
  let el;
  /* ⛔ Ab hier wechselt der Vers: die `pause`-Ereignisse, die `src` und
     `load()` gleich auslösen, sind KEIN Anhalten (19.09.2026, siehe den
     `pause`-Handler in audioBaue). */
  QAUDIO.wechsel = true;
  /* ⛔ `!b.error`: ein vorgeladenes Element kann die richtige Adresse tragen
     und trotzdem kaputt sein (Netzabriss beim Vorladen). Dann darf es nicht
     das spielende werden — `play()` würde sofort abgewiesen. */
  if (typeof tonLog === 'function') tonLog('SPIELE ' + sure + ':' + vers + ' — '
    + (b.src === url && !b.error ? 'aus dem Vorrat, rs' + b.readyState + ' ns' + b.networkState
                                 : 'NEUER LADEVORGANG' + (b.error ? ' (Vorrat kaputt)' : b.src ? ' (Vorrat hat anderes)' : ' (Vorrat leer)')));
  if (b.src === url && !b.error){
    const alt = QAUDIO.el;
    QAUDIO.el = b;
    el = b;
    try { el.currentTime = 0; } catch (e){ /* Quelle noch nicht bereit: startet ohnehin bei 0 */ }
    if (alt && alt !== b){ try { alt.pause(); } catch (e){ /* schon angehalten */ } }
  } else {
    el = QAUDIO.el;
    if (el.src !== url) el.src = url;
    /* Dieselbe Adresse, aber im Fehlerzustand: nur `load()` räumt ihn. Ohne das
       blieb die Rezitation an einer kaputt geladenen Datei für immer stehen. */
    else if (el.error){ try { el.load(); } catch (e){ /* naechster Versuch holt es */ } }
    else { try { el.currentTime = 0; } catch (e){ /* Quelle noch nicht bereit: startet ohnehin bei 0 */ } }
  }
  markiereLaufendenVers(sure, vers);
  wortModusVorbereiten();
  /* ⛔ VOR dem play(): die stille Schleife muss schon laufen, wenn die
     Luecke zwischen zwei Versen entsteht — sonst ueberbrueckt sie genau
     die erste nicht. */
  quranStilleAn();
  quranMedienKnoepfe(true);
  quranMedienInfo();
  zeigeSpieler();
  try {
    await el.play();
    if (typeof tonLog === 'function') tonLog('play() angenommen ' + sure + ':' + vers);
  } catch (err){
    if (typeof tonLog === 'function') tonLog('play() ABGELEHNT ' + sure + ':' + vers + ' — ' + ((err && err.name) || 'unbekannt'));
    /* ⚠️ Ein Wechsel des `src` bricht das laufende `play()` ab — der Browser
       meldet das als AbortError. Das ist kein Fehler, sondern genau das, was
       beim Weiterblaettern passieren SOLL. */
    if (err && err.name === 'AbortError') return;

    /* ⛔⛔ HIER STAND NUR EINE MELDUNG UND SONST NICHTS (bis 15.09.2026).
       Elias: „wollte die sura mehrmals hintereinander hören und manchmal hat
       es auch gestockt", dazu der Screenshot mit „Ton lässt sich nicht
       starten" bei Sure 97 in der Schleife 1–5.

       Der Ton kommt von `verses.quran.com`, also ueber das Netz. Ein einziger
       Aussetzer beendete die ganze Wiedergabe — und beim Wiederholen trifft
       das frueher oder spaeter, weil jeder Rundlauf fuenf neue Abrufe macht.
       Es gab KEINEN Neuversuch.

       ⭐ Zwei verschiedene Ursachen, die bisher dieselbe Meldung bekamen:
         NotAllowedError  der Browser will eine Geste — ein Neuversuch hilft
                          NIE, er muss tippen
         alles andere     Netz oder Datei — ein Neuversuch hilft meistens */
    /* Ab hier ist kein Wechsel mehr im Gang — es kommt ja kein Ton. */
    QAUDIO.wechsel = false;
    if (err && err.name === 'NotAllowedError'){
      QAUDIO.laeuft = false;
      QAUDIO.hinweis = 'Tippe auf ▶, der Browser braucht einen Druck';
      zeigeSpieler();
      return;
    }
    /* ⛔ Die Kennung verhindert, dass ein Neuversuch einen Vers startet, den
       er inzwischen weggeblaettert hat. [[handlung_macht_ihre_bedingung_ungueltig]] */
    const kennung = sure + ':' + vers;
    QAUDIO.versuche = (QAUDIO.versuchFuer === kennung ? (QAUDIO.versuche || 0) : 0) + 1;
    QAUDIO.versuchFuer = kennung;
    const n = QAUDIO.versuche;
    const schnell = n <= QAUDIO_SCHNELL;
    if (n <= QAUDIO_SCHNELL + QAUDIO_LANGE){
      /* ⭐ Die Meldung sagt, in welchem Zustand er steckt — das ist beim
         nächsten Mal die halbe Suche. */
      QAUDIO.hinweis = (navigator && navigator.onLine === false)
        ? 'Kein Netz — es geht von selbst weiter, sobald es wieder da ist'
        : (schnell ? 'Ton stockt — Versuch ' + n + ' von ' + QAUDIO_SCHNELL + ' …'
                   : 'Ton stockt — wird weiter versucht …');
      zeigeSpieler();
      if (QAUDIO.warte){ clearTimeout(QAUDIO.warte); QAUDIO.warte = null; }
      QAUDIO.warte = setTimeout(function(){
        QAUDIO.warte = null;
        /* Nur weitermachen, wenn genau dieser Vers noch gewaehlt ist. */
        if (QAUDIO.sure === sure && QAUDIO.vers === vers && QAUDIO.versuchFuer === kennung){
          audioSpiele(sure, vers);
        }
      }, schnell ? 400 * Math.pow(2, n - 1) : 15000);
      return;
    }
    QAUDIO.laeuft = false;
    QAUDIO.versuche = 0; QAUDIO.versuchFuer = null;
    /* ⭐ Die Meldung nennt jetzt die Ursache. „Ton laesst sich nicht starten"
       allein sagte weder ihm noch mir, wo man suchen soll. */
    QAUDIO.hinweis = (navigator && navigator.onLine === false)
      ? 'Kein Netz — die Rezitation kommt von quran.com'
      : 'Ton kam auch nach zehn Minuten nicht (' + ((err && err.name) || 'unbekannt') + ')';
    zeigeSpieler();
    return;
  }
  /* Gelungen: den Zaehler zuruecksetzen, sonst zaehlt der naechste Aussetzer
     auf einem alten Stand weiter. */
  QAUDIO.versuche = 0; QAUDIO.versuchFuer = null; QAUDIO.wechsel = false;
  /* ⛔⛔ HIER STAND `audioVorladen(sure, vers + 1)` — und genau das war Elias'
     „manchmal hat es gestockt" (15.09.2026).

     Bei Sure 97 (5 Verse) und der Schleife 1–5 laedt Vers 5 den Vers 6 vor.
     Den gibt es nicht, `audioVorladen` steigt sofort aus — und der Ruecksprung
     auf Vers 1 findet ein LEERES zweites Element. Statt „play() auf eine
     fertige Datei" beginnt ein neuer Abruf ueber das Netz, und das hoert man.
     Es traf jeden Rundlauf an derselben Stelle.

     ⭐ Vorgeladen wird jetzt, was WIRKLICH als naechstes kommt — die Schleife
     eingerechnet. [[zwischenstand_wird_nicht_mitgebaut]]
     ⭐ Seit dem 19.09.2026 rechnet das `audioFolgeVers()` — dieselbe Funktion,
     die auch `audioNaechster()` fragt. Zwei Rechnungen derselben Frage waren
     genau der Fehler vom 15.09. */
  audioVorladen(sure, audioFolgeVers(sure, vers));
}

/* ============================================================================
   DEN BEREICH WIEDERHOLEN                              (08.09.2026)
   ============================================================================

   Elias: „ich will auch die option haben einen vers oder nur bestimmte verse
   öfter wiederholen zu lassen also wenn ich zb vers 10-20 von mulk auswendig
   lernen will und nur mir diese anhören möchte dann möchte ich das können."

   ⭐ Kein Zähler „wie oft", sondern endlos bis zum Anhalten. Wer auswendig
   lernt, weiß vorher nicht, wie oft er den Abschnitt braucht — und muss
   mittendrin nichts nachstellen.

   ⛔ Der Bereich gehört zur SURE, nicht zum Gerät: er wird beim Surenwechsel
   verworfen. „Vers 10 bis 20" heißt in Al-Fātiḥa etwas anderes als in
   Al-Baqarah, und ein stehengebliebener Bereich aus einer anderen Sure wäre
   die Sorte Einstellung, die man erst bemerkt, wenn sie stört. */
const QSCHLEIFE = { an:false, von:0, bis:0, sure:null };

/** Gilt der Bereich hier und jetzt? */
function schleifeGilt(){
  return QSCHLEIFE.an && QSCHLEIFE.sure === QAUDIO.sure
      && QSCHLEIFE.von > 0 && QSCHLEIFE.bis >= QSCHLEIFE.von;
}

/** Liest die beiden Felder, begrenzt sie auf die Sure und dreht sie bei Bedarf. */
function schleifeLesen(){
  const vonF = document.getElementById('qsVon');
  const bisF = document.getElementById('qsBis');
  const sure = QAUDIO.sure !== null ? QAUDIO.sure : OFFENE_SURE;
  const max = audioVersZahl(sure) || 0;
  let von = Math.round(Number(vonF && vonF.value) || 0);
  let bis = Math.round(Number(bisF && bisF.value) || 0);
  /* Leer heißt „ab hier" bzw. „bis zum Ende" — das ist die Erwartung, wenn
     jemand nur ein Feld ausfüllt. */
  if (!von) von = QAUDIO.vers || 1;
  if (!bis) bis = max || von;
  von = Math.min(Math.max(1, von), max || von);
  bis = Math.min(Math.max(1, bis), max || bis);
  /* ⚠️ Verdrehte Eingabe nicht abweisen, sondern drehen. „von 20 bis 10" ist
     kein Fehler, sondern eine Zahlendreher — und eine Fehlermeldung dafür
     hielte nur auf. */
  if (bis < von){ const t = von; von = bis; bis = t; }
  QSCHLEIFE.von = von; QSCHLEIFE.bis = bis; QSCHLEIFE.sure = sure;
  if (vonF) vonF.value = String(von);
  if (bisF) bisF.value = String(bis);
}

/* ⛔⛔ ZEILE OFFEN = SCHLEIFE AN. Es gibt keinen zweiten Schalter mehr.
   Elias am 20.09.2026, 02:41, mit Bild (Zeile offen, „von 1 bis 5", daneben
   der Knopf „Aus"): „wenn ich das aktiviert habe soll automatisch ein loop
   sein also ich will nicht noch extra einschalten das ein loop kommt. wenn
   ich die funktion nutze dann brauche ich nur einen loop, es kommt nicht vor
   das ich es dann nur einmal spielen lassen möchte".
   Der Knopf „An/Aus" in der Zeile ist weg; das Wiederholen-Zeichen in der
   Leiste ist der EINE Schalter: ein Druck öffnet die Zeile UND schaltet ein,
   der nächste schließt sie UND schaltet aus. Ein Zustand, eine Stelle —
   sonst steht irgendwann die Zeile offen und nichts wiederholt sich (genau
   sein Bild). [[dieselbe_frage_zwei_antworten]] */
function schleifeSetzen(an){
  QSCHLEIFE.an = !!an;
  const sch = document.getElementById('qsSchleife');
  if (sch) sch.classList.toggle('hidden', !QSCHLEIFE.an);
  if (QSCHLEIFE.an){
    /* ⭐ Beim Öffnen die Felder mit dem füllen, wo er gerade ist — „diesen
       Vers wiederholen" ist der häufigste Fall und dann ein einziger Druck. */
    const vonF = document.getElementById('qsVon');
    const bisF = document.getElementById('qsBis');
    const hier = QAUDIO.vers || (typeof sichtbarerVers === 'function' && sichtbarerVers()) || 1;
    if (vonF && !vonF.value) vonF.value = String(hier);
    if (bisF && !bisF.value) bisF.value = String(hier);
    schleifeLesen();
  }
  schleifeAnzeigen();
}
function schleifeAnzeigen(){
  const reihe = document.getElementById('btnQsSchleife');
  if (!reihe) return;
  reihe.classList.toggle('an', QSCHLEIFE.an);
  reihe.setAttribute('aria-expanded', QSCHLEIFE.an ? 'true' : 'false');
  reihe.setAttribute('aria-label', QSCHLEIFE.an ? 'Wiederholen ausschalten' : 'Verse wiederholen');
}

function audioNaechster(){
  if (QAUDIO.sure === null) return;
  /* ⛔ Der Bereich wird VOR dem Surenende geprüft: bei „von 20 bis 30" in
     einer Sure mit 30 Versen fielen beide Bedingungen sonst zusammen, und
     die Rezitation endete, statt zu wiederholen. Das rechnet seit dem
     19.09.2026 `audioFolgeVers()` — dieselbe Rechnung wie beim Vorladen. */
  const folge = audioFolgeVers(QAUDIO.sure, QAUDIO.vers);
  if (typeof tonLog === 'function') tonLog('NAECHSTER nach ' + QAUDIO.vers + ' → ' + (folge || 'Ende'));
  if (!folge){
    /* Sure zu Ende. Bewusst KEIN automatischer Sprung in die naechste Sure:
       er hoert eine bestimmte Sure, nicht den Quran am Stueck. */
    audioAus();
    return;
  }
  audioSpiele(QAUDIO.sure, folge);
}
function audioVoriger(){
  if (QAUDIO.sure === null) return;
  audioSpiele(QAUDIO.sure, Math.max(1, QAUDIO.vers - 1));
}

function audioAus(){
  if (typeof tonLog === 'function' && QAUDIO.sure !== null) tonLog('AUS (audioAus) bei Vers ' + QAUDIO.vers);
  QAUDIO.sure = null; QAUDIO.vers = 0; QAUDIO.laeuft = false; QAUDIO.hinweis = '';
  /* Beenden heißt beenden: keine Wache mehr, kein wartender Neuversuch, und
     die Wechsel-Marke räumen, damit das `pause` unten nicht verschluckt wird. */
  QAUDIO.wechsel = false;
  QAUDIO.versuche = 0; QAUDIO.versuchFuer = null;
  if (QAUDIO.warte){ clearTimeout(QAUDIO.warte); QAUDIO.warte = null; }
  audioWacheAus();
  /* ⛔ BEIDE Elemente leeren, nicht nur das spielende. Im anderen liegt der
     vorgeladene naechste Vers; bliebe er dort, hielte er die Datei im
     Speicher und beim naechsten Start spraenge der Leser auf einen Vers, den
     niemand gewaehlt hat. [[fehler_trifft_mehr_als_gemeldet]] */
  for (const el of (QAUDIO.paar || [])){
    try { el.pause(); el.removeAttribute('src'); el.load(); } catch (e) { /* Aufraeumen auf einem schon leeren Element */ }
  }
  quranStilleAus();
  quranMedienKnoepfe(false);
  quranMedienInfo();
  wortUhrStop();
  markeWeg();
  zeigeSpieler();
}

/** Der eine Knopf: startet, haelt an, laeuft weiter. */
function audioUmschalten(){
  if (OFFENE_SURE === null) return;
  /* Ton-Protokoll: SEIN Druck — damit ein `pause` vom System davon zu
     unterscheiden ist. */
  if (typeof tonLog === 'function') tonLog('KNOPF Play/Pause (von ihm)');
  if (QAUDIO.sure !== OFFENE_SURE){
    /* Anfangen, wo er gerade liest — nicht stur bei Vers 1. Wer bei Ayah 14
       steht und auf Abspielen drueckt, will dort weiterhoeren.
       [[endpunkt_der_zuerst_steht]] */
    /* ⭐ Läuft ein Bereich für DIESE Sure, fängt er dort an — sonst müsste
       Elias erst hinscrollen, obwohl er den Bereich gerade eingestellt hat. */
    const start = (QSCHLEIFE.an && QSCHLEIFE.sure === OFFENE_SURE && QSCHLEIFE.von > 0)
      ? QSCHLEIFE.von
      : ((typeof sichtbarerVers === 'function' && sichtbarerVers()) || 1);
    audioSpiele(OFFENE_SURE, start);
    return;
  }
  const el = audioElement();
  /* ⛔ Sein Druck auf Pause räumt die Wechsel-Marke — er wird nie verschluckt,
     auch wenn gerade ein Verswechsel läuft (19.09.2026). */
  QAUDIO.wechsel = false;
  if (QAUDIO.warte){ clearTimeout(QAUDIO.warte); QAUDIO.warte = null; }
  if (QAUDIO.laeuft) el.pause();
  /* ⛔ Ein abgelehntes play() ist der haeufigste Grund, warum „nichts
     passiert": der Browser verweigert Ton ohne Geste, oder die Datei fehlt.
     Von aussen sieht beides gleich aus — ein Knopf, der nichts tut. */
  else el.play().catch(e => stillerFehler('Quran-Ton: play() abgelehnt', e));
}

/* ⭐ Kommt das Netz zurück, läuft die Rezitation von selbst wieder an
   (19.09.2026). Unterwegs ist das Funkloch der Normalfall, und zum Handy
   greifen ist beim Radfahren oder im Gebet keine Bedienung, sondern ein
   Abbruch.

   ⛔ NUR, wenn gerade ein Neuversuch hängt (`versuchFuer`). Ohne diese Abfrage
   würde jedes Funkloch eine bewusst angehaltene Rezitation wieder starten —
   im Gespräch, im Unterricht, in der Nacht. [[antwort_auf_meine_frage_ist_keine_freigabe]] */
window.addEventListener('online', () => {
  if (QAUDIO.sure === null || QAUDIO.laeuft || !QAUDIO.versuchFuer) return;
  if (QAUDIO.warte){ clearTimeout(QAUDIO.warte); QAUDIO.warte = null; }
  const sure = QAUDIO.sure, vers = QAUDIO.vers;
  QAUDIO.versuche = 0; QAUDIO.versuchFuer = null;
  QAUDIO.hinweis = 'Netz ist wieder da …';
  zeigeSpieler();
  audioSpiele(sure, vers);
});

/* ============================================================================
   DIE MEDIENBENACHRICHTIGUNG                           (08.09.2026)
   ============================================================================

   Elias mit dem Handy in der Hand, drei Meldungen kurz hintereinander:

     „wenn ich den rezitator laufen lasse und aus der app gehe dann wird mir
      nur für einen vers der medienplayer meines handy angezeigt. außerdem
      steht dort vokabeltrainer, ich will eher das dort steht welche sura und
      ayah gerade gespielt wird"
     „sobald diese eine ayah vorbei ist verschwindet das medianfeld wieder bei
      meinem handy, dass soll nicht so sein"
     „ich will auch nicht das es die ganze zeit mir einmal vokabeltrainer
      zeigt als medium und dann youtube zb und dann wieder vokabeltrainer, es
      soll konstant bleben"

   ⭐⭐ Die dritte Meldung ist die Diagnose. Ein Feld, das zwischen zwei Apps
   HIN UND HER springt, ist nicht verschwunden — es wird ABGEGEBEN und wieder
   geholt. Und zwar bei jedem Verswechsel: zwischen dem Ende von `067004.mp3`
   und dem Start von `067005.mp3` spielt das Element nichts, Android beendet
   die Sitzung und reicht sie an die naechste App weiter, die noch etwas
   anzubieten hat. Beim naechsten `play()` holt der Leser sie zurueck.

   ⛔ Die MediaSession-Angaben allein beheben das NICHT. Sie beschriften eine
   Sitzung, sie halten keine — wo kein Ton ist, ist keine Sitzung, die man
   beschriften koennte.

   ⭐ Deshalb laeuft waehrend der ganzen Rezitation eine stille Schleife mit.
   Dieselbe Technik, die der Geh-Modus schon benutzt (`stille.wav`, gebaut am
   08.09.2026): sie ueberbrueckt die Luecke zwischen zwei Versen, und die
   Sitzung reisst nie ab. [[ausfall_ist_unsichtbar_gebaut]]

   ⚠️ Die Datei ist STILL, der Regler steht auf 1. Ein Element auf `volume 0`
   zaehlt bei manchen Browsern nicht als Wiedergabe — dann waere die ganze
   Ueberbrueckung wirkungslos und saehe trotzdem richtig aus. */
let QAUDIO_STILLE = null;

function quranStilleAn(){
  try {
    if (!QAUDIO_STILLE){
      /* ⚠️ `stille-lang.wav` (12 s) statt `stille.wav` (GENAU 5,00 s) — eine
         VORSICHT, kein Messwert (20.09.2026). Chrome behandelt kurze Töne als
         „flüchtig" und zählt sie nicht als Wiedergabe, die eine Mediensitzung
         trägt; die Grenze liegt bei fünf Sekunden, und ob genau fünf noch
         darunter fällt, weiß ich nicht sicher. Zwölf Sekunden lassen die Frage
         gar nicht erst entstehen. Der Geh-Modus (js/hoeren.js) benutzt weiter
         die kurze Datei — dort ist kein Fehler gemeldet. Das Ton-Protokoll
         schreibt die Dauer mit, die der Browser sieht. */
      QAUDIO_STILLE = new Audio('stille-lang.wav');
      QAUDIO_STILLE.loop = true;
      QAUDIO_STILLE.volume = 1;
      QAUDIO_STILLE.addEventListener('loadedmetadata', () => {
        if (typeof tonLog === 'function') tonLog('STILLE geladen, Dauer ' + (Number(QAUDIO_STILLE.duration) || 0).toFixed(2) + ' s');
      });
      /* Ton-Protokoll (20.09.2026): die stille Schleife soll die Lücke zwischen
         zwei Versen überbrücken. Hält das System SIE an, ist das die Antwort. */
      ['play', 'pause', 'error', 'stalled'].forEach(n =>
        QAUDIO_STILLE.addEventListener(n, () => { if (typeof tonLog === 'function') tonLog('STILLE ' + n); }));
    }
    if (QAUDIO_STILLE.paused){
      const p = QAUDIO_STILLE.play();
      /* ⛔ Auch der abgelehnte Abspielversuch wird gemeldet. Genau hier bricht
         die Ueberbrueckung ab, wenn der Browser sie ohne Geste verweigert —
         und der Ausfall sieht von aussen aus wie „die Rezitation stoppt beim
         Bildschirm aus", also wie ein ganz anderer Fehler. */
      if (p && p.catch) p.catch(e => stillerFehler('Quran-Ton: stille.wav abgelehnt', e));
    }
  } catch (e){ stillerFehler('Quran-Ton: stille Schleife', e); }
}
function quranStilleAus(){
  try { if (QAUDIO_STILLE) QAUDIO_STILLE.pause(); } catch (e){ /* nichts zu pausieren ist kein Fehler */ }
}

/** Der Name der Sure, wie er in der Liste steht. */
function sureName(id){
  if (typeof SURAH_DATA === 'undefined') return 'Sure ' + id;
  const s = SURAH_DATA.find(x => x.id === id);
  return s ? s.name : 'Sure ' + id;
}

/** Beschriftet die Medienbenachrichtigung mit dem, was gerade laeuft.
 *
 *  ⛔ NICHT „Vokabeltrainer". Auf dem Sperrbildschirm steht das neben
 *  Musik-Apps, und Elias will dort lesen, WO er ist. Der App-Name steht
 *  ohnehin klein darunter — den setzt das Betriebssystem selbst. */
function quranMedienInfo(){
  if (!('mediaSession' in navigator)) return;
  try {
    if (QAUDIO.sure === null){
      navigator.mediaSession.playbackState = 'none';
      return;
    }
    navigator.mediaSession.metadata = new MediaMetadata({
      title:  sureName(QAUDIO.sure) + ' · Vers ' + QAUDIO.vers,
      artist: rezitatorTitel(quranRezitator()),
      album:  'Quran'
    });
    navigator.mediaSession.playbackState = QAUDIO.laeuft ? 'playing' : 'paused';
    quranMedienPosition();
    /* ⚠️ Hier steht eigene Logik, nicht nur eine Browser-Schnittstelle:
       `sureName`, `rezitatorTitel` und `quranRezitator` koennen werfen. Dann
       bleibt der Sperrbildschirm bei der VORIGEN Sure stehen — sichtbar
       falsch, aber ohne Fehlermeldung. */
  } catch (e){ stillerFehler('Quran-Ton: Sperrbildschirm beschriften', e); }
}

/** ⭐ Die Fortschrittsanzeige auf dem Sperrbildschirm — der „Tonbalken, der wie
 *  eine Welle aussieht" (Elias, 08.09.2026, mit Bild der Benachrichtigung).
 *
 *  ⛔ Ohne `setPositionState()` weiß Android nicht, wie lang der Titel ist und
 *  wo man darin steht. Titel, Rezitator und die Knöpfe standen deshalb schon
 *  richtig da — die Welle fehlte trotzdem, weil sie nicht aus den Metadaten
 *  kommt, sondern aus der Position. Zwei verschiedene Auskünfte.
 *
 *  ⚠️ Der Aufruf WIRFT bei unsinnigen Werten (Dauer NaN oder unendlich,
 *  Position größer als die Dauer, Rate ≤ 0). Genau das ist der Normalfall,
 *  solange die Metadaten der nächsten Datei noch laden — deshalb wird jeder
 *  Wert geprüft, statt sich auf try/catch zu verlassen: ein stiller Fehlschlag
 *  in jedem Takt wäre schwer zu finden. */
function quranMedienPosition(){
  if (!('mediaSession' in navigator) || !navigator.mediaSession.setPositionState) return;
  const el = QAUDIO.el;
  if (!el || QAUDIO.sure === null) return;
  const dauer = Number(el.duration);
  if (!isFinite(dauer) || dauer <= 0) return;
  const rate = Number(el.playbackRate) || 1;
  if (rate <= 0) return;
  /* ⚠️ Beim Wechsel der Datei steht `currentTime` einen Augenblick noch auf
     dem alten Wert, der größer als die neue Dauer sein kann. */
  const stelle = Math.min(Math.max(0, Number(el.currentTime) || 0), dauer);
  try {
    navigator.mediaSession.setPositionState({
      duration: dauer, playbackRate: rate, position: stelle
    });
  } catch (e){ /* setPositionState fehlt oder mag die Werte nicht; nur der Fortschrittsbalken fehlt dann */ }
}

/** Die Knoepfe auf dem Sperrbildschirm. Einmal belegt, solange rezitiert wird.
 *
 *  ⚠️ Beim Beenden werden sie wieder freigegeben: der Geh-Modus belegt
 *  dieselben Knoepfe, und ein liegengebliebener Handler wuerde den falschen
 *  Modus anhalten. [[wirkung_an_der_quelle_stilllegen]] */
function quranMedienKnoepfe(an){
  if (!('mediaSession' in navigator)) return;
  const setze = (name, fn) => {
    try { navigator.mediaSession.setActionHandler(name, fn); } catch (e){ /* diese Taste kennt der Browser nicht */ }
  };
  if (!an){
    ['play', 'pause', 'stop', 'nexttrack', 'previoustrack'].forEach(n => setze(n, null));
    return;
  }
  /* Ton-Protokoll: ein `pause`, das vom SPERRBILDSCHIRM oder vom System kommt
     (Kopfhörer ab, anderer Ton), sieht sonst aus wie eines von ihm. */
  setze('play',          () => { tonLog('SPERRBILDSCHIRM play'); const el = audioElement(); el.play().catch(e => stillerFehler('Quran-Ton: play() vom Sperrbildschirm abgelehnt', e)); });
  setze('pause',         () => { tonLog('SPERRBILDSCHIRM pause'); const el = audioElement(); el.pause(); });
  setze('stop',          () => audioAus());
  setze('nexttrack',     () => audioNaechster());
  setze('previoustrack', () => audioVoriger());
}

/* ---------- Mitlesen ---------- */

function markeWeg(){
  document.querySelectorAll('#verseList .verse-item.laeuft')
    .forEach(e => e.classList.remove('laeuft'));
  wortMarkeWeg();
}
function wortMarkeWeg(){
  document.querySelectorAll('#verseList .qw.laeuft')
    .forEach(e => e.classList.remove('laeuft'));
}
/* ⛔⛔ DREI ENTSCHEIDUNGEN, DREI STELLEN — und genau daran ist es beim ersten
   Anlauf gescheitert.

   Elias am 08.09.2026: „ich hab vers hervorhebung ausgemacht aber verfolgen
   angemacht und auch wort hervorhebung angemacht und es verfolgt nicht den
   vers"

   ⭐ Der Grund stand zwei Zeilen ueber dem Rollbefehl: `if (!quranMitleseVers())
   return;`. Das Rollen bekam zwar seine eigene Bedingung — aber es blieb HINTER
   dem Ausstieg des Versbalkens stehen und war damit weiter von ihm abhaengig.
   Eine Bedingung zu ERGAENZEN loest eine Verkettung nicht auf; sie muss
   aufgetrennt werden. [[erst_ursache_dann_zweite_massnahme]]

   Seitdem entscheidet jeder Schalter fuer sich:

     sure === OFFENE_SURE   Voraussetzung fuer beides — was nicht auf dem
                            Bildschirm steht, laesst sich weder markieren
                            noch anfahren
     quranMitleseVers()     nur der Balken
     quranVerfolgen()       nur das Rollen

   ⭐ Damit gilt auch der Fall, den er zuerst genannt hat: „die hervorhebung
   finde ich gut aber das automatisch gescrollt wird will ich nicht immer" —
   und ebenso der umgekehrte, den er jetzt gemeldet hat. */
function markiereLaufendenVers(sure, nr){
  markeWeg();
  if (sure !== OFFENE_SURE) return;
  const el = document.querySelector('#verseList .verse-item[data-versnr="' + nr + '"]');
  if (!el) return;
  if (quranMitleseVers()) el.classList.add('laeuft');
  /* ⛔ Das Rollen ist eine EIGENE Einstellung und nicht Teil des Mitlesens.
     „die hervorhebung finde ich gut aber das automatisch gescrollt wird will
     ich nicht immer" (08.09.2026). Wer verfolgen ausschaltet, behaelt die
     Marke und blaettert selbst.

     ⚠️ `zeigeVers` und nicht `scrollIntoView`: `#main` traegt
     `scroll-behavior:smooth`, und der vorhandene Sprung rechnet die klebende
     Kopfzeile heraus. Ein eigener Sprung wuerde den Vers darunter schieben.
     [[weiches_rollen_meldet_alten_wert]] */
  if (quranVerfolgen() && typeof zeigeVers === 'function') zeigeVers(nr);
}

/* ============================================================================
   WORT FUER WORT                                       (08.09.2026)
   ============================================================================

   Elias: „füge noch die option hinzu wort für wort hervorhebung".

   Die Zeitmarken kommen von api.quran.com und sind VERS-relativ — sie zaehlen
   ab dem Anfang derselben Datei, die hier abgespielt wird. Deshalb genuegt
   `el.currentTime` ohne jede Umrechnung. Gegenprobe siehe Kopf dieser Datei.

   ⛔ Geholt wird EINMAL je Rezitator und Sure, nicht je Vers. Ein Abruf je
   Vers waere bei Al-Baqarah 286 Anfragen fuer eine einzige Sure.

   ⛔ Und geholt wird nur, wenn der Wortmodus wirklich an ist. Wer vers-weise
   mitliest, soll keinen Netzabruf bezahlen, den er nicht braucht — vers-weises
   Mitlesen funktioniert ohne Internet weiter. */
const QSEG = {};        /* 'rez:sure' -> { versnr: [[von,bis], ...] } | 'fehlt' */
let   QW_UHR = null;    /* Kennung der laufenden Bildwiederholung */
let   QW_LETZTES = -1;  /* zuletzt gefolgtes Wort — gegen Rollen bei jedem Bild */

function segSchluessel(rez, sure){ return rez + ':' + sure; }

/** Holt die Wort-Zeitmarken einer Sure. Gibt es sie nicht, wird das GEMERKT —
 *  sonst fragt jeder Verswechsel erneut und scheitert erneut. */
async function segmenteHolen(rez, sure){
  const k = segSchluessel(rez, sure);
  if (QSEG[k]) return QSEG[k];
  QSEG[k] = 'laedt';
  try {
    const url = 'https://api.quran.com/api/v4/verses/by_chapter/' + sure +
                '?audio=' + rez + '&per_page=300';
    const r = await fetch(url);
    if (!r.ok) throw new Error('Status ' + r.status);
    const j = await r.json();
    const map = {};
    for (const v of (j.verses || [])){
      const s = v.audio && v.audio.segments;
      if (!s || !s.length) continue;
      /* ⛔ Nur die letzten beiden Zahlen jeder Zeile werden gelesen: Anfang und
         Ende in Millisekunden. Welche Felder davor stehen, ist gleichgueltig —
         die Wortnummer kommt aus der REIHENFOLGE, und die wird ohnehin gegen
         den eigenen Text geprueft. So ueberlebt der Bau eine Formataenderung,
         die eine Spalte hinzufuegt. */
      map[v.verse_number] = s.map(z => [Number(z[z.length - 2]), Number(z[z.length - 1])]);
    }
    QSEG[k] = Object.keys(map).length ? map : 'fehlt';
  } catch (e){
    QSEG[k] = 'fehlt';
  }
  return QSEG[k];
}

/** Die Zeitmarken des laufenden Verses — oder null, wenn wortweise hier nicht
 *  geht. Das ist der eine Ort, an dem der Rueckfall entschieden wird. */
function segmenteJetzt(){
  /* ⛔ Auch wenn nur VERFOLGT wird und die Wortmarke aus ist: das seitenweise
     Blaettern in langen Versen braucht die Wortposition, sonst weiss niemand,
     wo der Rezitator gerade steht. Siehe folgeWort(). */
  if (!quranMitleseWort() && !quranVerfolgen()) return null;
  if (QAUDIO.sure === null || QAUDIO.sure !== OFFENE_SURE) return null;
  const m = QSEG[segSchluessel(quranRezitator(), QAUDIO.sure)];
  if (!m || m === 'laedt' || m === 'fehlt') return null;
  const seg = m[QAUDIO.vers];
  if (!seg || !seg.length) return null;
  /* ⛔⛔ DIE Pruefung, ohne die falsch markiert wuerde. Unser Text zaehlt bei
     16 von 1193 gemessenen Versen anders als die Zeitmarken (Begruendung bei
     quranWorte() in js/quran.js). Passt die Zahl nicht, bleibt es beim ganzen
     Vers — eine Marke am falschen Wort waere schlimmer als keine.
     [[ausfall_ist_unsichtbar_gebaut]] */
  const el = document.querySelector('#verseList .verse-item[data-versnr="' + QAUDIO.vers + '"]');
  const spans = el ? el.querySelectorAll('.verse-ar .qw') : [];
  if (!spans.length || spans.length !== seg.length) return null;
  return { seg, spans };
}

/** Markiert das Wort, das gerade gesprochen wird. */
function wortSchritt(){
  QW_UHR = null;
  if (!QAUDIO.laeuft || QAUDIO.sure === null) return;
  const d = segmenteJetzt();
  if (!d){ wortMarkeWeg(); wortUhrStart(); return; }
  const ms = QAUDIO.el ? QAUDIO.el.currentTime * 1000 : 0;
  let i = -1;
  for (let k = 0; k < d.seg.length; k++){
    if (ms >= d.seg[k][0] && ms < d.seg[k][1]){ i = k; break; }
    /* Zwischen zwei Woertern liegt manchmal eine Pause. Dann bleibt das zuletzt
       gesprochene Wort stehen, statt dass die Marke flackernd verschwindet. */
    if (ms >= d.seg[k][1]) i = k;
  }
  /* ⚠️ Gezeichnet wird nur, wenn die Wortmarke an ist — GERECHNET wird immer,
     solange verfolgt wird. Zwei Fragen, zwei Antworten.
     [[dieselbe_frage_zwei_antworten]] */
  const zeigen = quranMitleseWort();
  d.spans.forEach((s, k) => s.classList.toggle('laeuft', zeigen && k === i));
  /* ⛔ Nur bei einem WECHSEL nachfassen. Bei jedem Bilddurchlauf zu rollen
     hiesse, gegen Elias' eigenen Finger zu arbeiten, sobald er selbst blaettert. */
  if (i >= 0 && i !== QW_LETZTES){
    QW_LETZTES = i;
    if (quranVerfolgen()) folgeWort(d.spans[i]);
  }
  wortUhrStart();
}

/* ============================================================================
   LANGE VERSE: SEITENWEISE MITGEHEN                    (08.09.2026)
   ============================================================================

   Elias mit Bild von Al-Baqarah 83 — einem Vers, der über mehrere Bildschirme
   läuft:

     „dieser vers geht über meinem bildschirm ende hinaus. es wäre gut wenn das
      bildschirm ende gekommen ist das das ende zum anfang wird und ‚ein
      bildschirm‘ nach unten geht damit ich immer den vers sehen kann der
      gerade abgespielt wird"

   ⭐ Bis hierher fuhr das Verfolgen den VERSANFANG an und blieb dort. Bei
   einem Vers, der länger ist als der Bildschirm, läuft die Rezitation dann
   nach unten aus dem Bild — und je länger der Vers, desto länger sieht man
   die falsche Stelle.

   ⭐⭐ Gelöst über die WORTPOSITION, nicht über eine Pixelrechnung: Das
   laufende Wort wird an den oberen Rand geholt, sobald es aus dem sichtbaren
   Bereich läuft. Damit wird „das Ende zum Anfang" von selbst — was gerade noch
   unten stand, steht danach oben, und ein ganzer Bildschirm folgt darunter.
   Eine Rechnung „Rollstand plus Bildschirmhöhe" träfe dagegen jedes Mal knapp
   daneben, weil Kopfzeile und Spielerleiste unterschiedlich hoch sind und weil
   niemand garantiert, dass die Grenze zwischen zwei Zeilen fällt.

   ⛔ Das braucht die Wort-Zeitmarken. Fehlen sie (kein Netz, oder eine
   abweichende Wortzahl), bleibt es beim Anfahren des Versanfangs — dieselbe
   ehrliche Grenze wie bei der Wortmarke selbst. */

/** Der sichtbare Bereich zwischen Kopfzeile und Spielerleiste. */
function leseFenster(){
  const kasten = document.getElementById('main');
  if (!kasten) return null;
  const kopf = document.querySelector('#screen-quranfull .quran-sticky');
  const spieler = document.getElementById('quranSpieler');
  const oben = kopf ? kopf.getBoundingClientRect().bottom
                    : kasten.getBoundingClientRect().top;
  /* ⚠️ Die Leiste zählt nur, wenn sie wirklich steht — sonst verschenkte man
     ihre Höhe auch dann, wenn sie ausgeblendet ist. */
  const unten = (spieler && !spieler.classList.contains('hidden'))
    ? spieler.getBoundingClientRect().top
    : kasten.getBoundingClientRect().bottom;
  return { kasten, oben, unten };
}

/** Holt das laufende Wort an den oberen Rand, wenn es aus dem Blick läuft. */
function folgeWort(span){
  const f = leseFenster();
  if (!f || !span) return;
  const r = span.getBoundingClientRect();
  /* Noch im Blick? Dann nichts anfassen — jeder unnötige Sprung reißt den
     Blick weg. */
  if (r.top >= f.oben && r.bottom <= f.unten) return;
  /* ⚠️ `behavior:'instant'`: #main trägt `scroll-behavior:smooth`, und ein
     weicher Sprung wäre bei der nächsten Messung noch unterwegs — dann stünde
     das Wort scheinbar immer noch falsch und es würde ein zweites Mal
     gesprungen. [[weiches_rollen_meldet_alten_wert]] */
  const versatz = r.top - f.oben;
  f.kasten.scrollTo({ top: Math.max(0, f.kasten.scrollTop + versatz - 8),
                      behavior: 'instant' });
}

/* ⛔ `requestAnimationFrame` und nicht `timeupdate`: das Ereignis feuert rund
   viermal je Sekunde, und ein kurzes Wort dauert 300 ms — die Marke saesse
   dann sichtbar hinterher. rAF kostet nichts, solange nichts laeuft, und der
   Browser haelt es im Hintergrund von selbst an.
   [[hintergrund_tab_drosselt_timer]] */
function wortUhrStart(){
  if (QW_UHR !== null) return;
  if (typeof requestAnimationFrame !== 'function') return;
  QW_UHR = requestAnimationFrame(wortSchritt);
}
function wortUhrStop(){
  if (QW_UHR !== null){ cancelAnimationFrame(QW_UHR); QW_UHR = null; }
  wortMarkeWeg();
}

/** Sorgt dafuer, dass die Marken da sind, wenn der Wortmodus laeuft. */
function wortModusVorbereiten(){
  /* ⛔ Auch fuers blosse Verfolgen — Begruendung bei segmenteJetzt(). */
  if ((!quranMitleseWort() && !quranVerfolgen()) || QAUDIO.sure === null){
    wortUhrStop(); return;
  }
  const rez = quranRezitator();
  if (!QSEG[segSchluessel(rez, QAUDIO.sure)]) segmenteHolen(rez, QAUDIO.sure);
  wortUhrStart();
}

/* ---------- Die Leiste ---------- */

function zeigeSpieler(){
  /* ⚠️ Wechselt der Vers, während das Sprungfeld offen steht, sähe man den
     neuen Stand nicht. Das Feld schließt sich deshalb bei jeder Auffrischung
     der Leiste — außer es hat gerade den Fokus, dann tippt jemand darin. */
  const spFeld = document.getElementById('qsSprungFeld');
  const spEing = document.getElementById('qsSprung');
  if (spFeld && !spFeld.classList.contains('hidden') && document.activeElement !== spEing){
    spFeld.classList.add('hidden');
    const spKnopf = document.getElementById('qsStandKnopf');
    if (spKnopf) spKnopf.classList.remove('hidden');
  }
  const leiste = document.getElementById('quranSpieler');
  if (!leiste) return;
  const sichtbar = quranRezitationAn() && OFFENE_SURE !== null;
  leiste.classList.toggle('hidden', !sichtbar);
  /* ⛔ Die Polsterung des Bildschirms haengt an derselben Bedingung. Ohne sie
     stuende die Leiste ueber dem letzten Vers — und der letzte Vers einer Sure
     ist genau der, den man beim Auswendiglernen am oeftesten braucht. */
  /* Die Schleifenzeile gehört zur Leiste — sie verschwindet mit ihr, und
     seit dem 20.09.2026 heißt „Zeile zu" auch „Schleife aus" (schleifeSetzen). */
  if (!sichtbar) schleifeSetzen(false);
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
      /* ⛔ „Vers 25 von 30" statt „25/30": gemessen am 08.09.2026 braucht die
         lange Form 114 px, die Textspalte hat 81 — sie wurde mit Ellipse
         abgeschnitten, sobald der Wiederhol-Knopf dazukam. Das Wort „Vers"
         steht daneben ohnehin im Verstext. */
      : laeuftHier ? 'Vers ' + QAUDIO.vers + '/' + gesamt
      : rezitatorTitel(quranRezitator());
    stand.classList.toggle('qs-warnung', !!QAUDIO.hinweis);
  }
  const name = document.getElementById('qsName');
  if (name) name.textContent = laeuftHier ? rezitatorTitel(quranRezitator()) : '';
  /* ⛔ GESPERRT, nicht ausgeblendet. Wären sie weg, spränge der Abspielknopf
     beim Start eine Knopfbreite nach rechts — und der Finger, der ihn gerade
     getroffen hat, läge dann auf „vorheriger Vers". Begründung steht auch am
     Markup in index.html, weil man dort zuerst hinsieht. */
  /* ⛔ Das ✕ steht NICHT in dieser Liste: es schaltet seit dem 20.09.2026 den
     Rezitator ganz aus (quranRezitationSetzen) und muss auch gehen, wenn
     gerade nichts läuft — auf Elias' Bild war genau das der Fall. */
  ['btnQsZurueck', 'btnQsVor'].forEach(id => {
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
  /* ⛔ Der Bereich gehoert zur Sure. „Vers 10 bis 20" heisst in Al-Fatiha
     etwas anderes als in Al-Baqarah, und ein stehengebliebener Bereich waere
     die Sorte Einstellung, die man erst bemerkt, wenn sie stoert.
     schleifeGilt() prueft die Sure ohnehin — hier werden zusaetzlich die
     FELDER geleert, damit dort nicht Zahlen stehen, die nichts mehr tun.
     [[eingefrorenes_feld_ist_kein_zustand]] */
  if (QSCHLEIFE.sure !== null && QSCHLEIFE.sure !== neueSure){
    QSCHLEIFE.an = false; QSCHLEIFE.von = 0; QSCHLEIFE.bis = 0; QSCHLEIFE.sure = null;
    ['qsVon', 'qsBis'].forEach(id => {
      const f = document.getElementById(id); if (f) f.value = '';
    });
    /* Schließt auch die Zeile: offen hieße „an" (20.09.2026). */
    schleifeSetzen(false);
  }
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
  /* Elias 20.09.2026: „wenn ich das drücke will ich das rezitator komplett
     aus ist, auch in den einstellungen des korans". Der Hinweis sagt, wo es
     wieder angeht — die Leiste, an der man es sonst sähe, ist ja dann weg. */
  an('btnQsAus', () => {
    quranRezitationSetzen('aus');
    toast('Rezitator aus — wieder an in den Koran-Einstellungen');
  });

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
    /* Derselbe Weg wie das ✕ in der Leiste (20.09.2026). */
    quranRezitationSetzen(k.dataset.quranrezitation);
  });
  const zeileMit = document.getElementById('quranMitleseVers');
  if (zeileMit) zeileMit.addEventListener('click', (e) => {
    const k = e.target.closest('[data-quranmitlesevers]');
    if (!k) return;
    SETTINGS.quranMitleseVers = k.dataset.quranmitlesevers;
    saveSettings();
    /* Sofort wirksam: aus heisst Marke weg, an heisst Marke auf den Vers, der
       gerade laeuft. Ohne das muesste er erst den naechsten Vers abwarten. */
    /* ⛔ Immer rufen, auch wenn beide Marken aus sind: die Funktion entscheidet
       inzwischen selbst, und das Rollen haengt nicht mehr an ihnen. Vorher
       stand hier `&& quranMitlesen()` — dieselbe Verkettung wie in der
       Funktion, nur eine Ebene hoeher. */
    if (QAUDIO.sure !== null) markiereLaufendenVers(QAUDIO.sure, QAUDIO.vers);
    else markeWeg();
    /* ⛔ Und die Wortmarken holen, wenn er gerade auf „Wort" gestellt hat —
       sonst passierte bis zum naechsten Verswechsel nichts sichtbares, und das
       saehe aus, als koenne die App es nicht. [[werkzeug_ohne_aufrufer]] */
    wortModusVorbereiten();
    wendeQuranAnsichtAn();
  });
  const zeileWort = document.getElementById('quranMitleseWort');
  if (zeileWort) zeileWort.addEventListener('click', (e) => {
    const k = e.target.closest('[data-quranmitlesewort]');
    if (!k) return;
    SETTINGS.quranMitleseWort = k.dataset.quranmitlesewort;
    saveSettings();
    if (!quranMitleseWort()) wortUhrStop();
    wortModusVorbereiten();
    wendeQuranAnsichtAn();
  });
  /* ---------- Zu einem Vers springen ----------

     Elias am 08.09.2026: „am besten wenn ich das auch selbst eintippen
     kann". Die Sure hat bis zu 286 Verse; über die Sprungleiste dorthin zu
     scrollen dauert länger als drei Ziffern.

     ⛔ Das Feld ERSETZT den Stand, statt daneben zu stehen: die Leiste hat
     vier Knöpfe und eine Textspalte, für ein sechstes Element ist auf einem
     Handy kein Platz. */
  function sprungZeigen(an){
    const knopf = document.getElementById('qsStandKnopf');
    const feld  = document.getElementById('qsSprungFeld');
    const eing  = document.getElementById('qsSprung');
    if (!knopf || !feld || !eing) return;
    knopf.classList.toggle('hidden', an);
    feld.classList.toggle('hidden', !an);
    if (an){
      eing.value = '';
      eing.placeholder = String(QAUDIO.vers || 1);
      /* ⚠️ `focus()` erst nach dem Einblenden — ein Element mit `hidden`
         nimmt keinen Fokus, und die Tastatur käme nicht. */
      eing.focus();
    }
  }
  function sprungAusfuehren(){
    const eing = document.getElementById('qsSprung');
    if (!eing) return;
    const max = audioVersZahl(QAUDIO.sure !== null ? QAUDIO.sure : OFFENE_SURE) || 0;
    const nr = Math.round(Number(eing.value) || 0);
    sprungZeigen(false);
    if (!nr || !max) return;
    /* Außerhalb der Sure wird begrenzt statt abgewiesen — wer 999 tippt,
       meint das Ende. */
    audioSpiele(QAUDIO.sure !== null ? QAUDIO.sure : OFFENE_SURE,
                Math.min(Math.max(1, nr), max));
  }
  /* ⛔ HIER STAND der Tipp auf die Mitte der Leiste (`qsStandKnopf` →
     sprungZeigen(true)). Elias am 20.09.2026: „wenn ich in die mitte davon
     tippe also wo der name des rezitators steht dann komme ich zu dem feld wo
     ich eine zahl eintippen kann … das soll nicht so sein". Die Mitte ist
     jetzt nur Anzeige. sprungZeigen()/sprungAusfuehren() bleiben stehen, haben
     aber keinen Auslöser mehr — ob das Springen per Zahl ganz weg soll oder
     einen anderen Platz bekommt, entscheidet er (To-Do, 🔴). Sein Wunsch vom
     08.09.2026 („am besten wenn ich das auch selbst eintippen kann") ist
     damit nicht gelöscht, nur vom Tipp auf den Namen gelöst. */
  const eSprung = document.getElementById('qsSprung');
  if (eSprung){
    eSprung.addEventListener('keydown', (e) => {
      if (e.key === 'Enter'){ e.preventDefault(); sprungAusfuehren(); }
      if (e.key === 'Escape'){ sprungZeigen(false); }
    });
    /* ⛔ Auch beim Verlassen ausführen: auf dem Handy tippt man die Zahl und
       dann irgendwohin — eine Eingabetaste drückt dort kaum jemand. */
    eSprung.addEventListener('blur', () => {
      if (!document.getElementById('qsSprungFeld').classList.contains('hidden'))
        sprungAusfuehren();
    });
  }

  /* ---------- Wiederholbereich ---------- */
  /* Der EINE Schalter (20.09.2026): Zeile auf = Schleife an. Siehe
     schleifeSetzen(). Den Knopf „An/Aus" in der Zeile gibt es nicht mehr. */
  const knAuf = document.getElementById('btnQsSchleife');
  if (knAuf) knAuf.addEventListener('click', () => schleifeSetzen(!QSCHLEIFE.an));
  /* ⚠️ Auf `change` und nicht auf `input`: bei jedem getippten Zeichen zu
     begrenzen hieße, dass aus einer angefangenen „20" erst „2" und dann
     etwas Unerwartetes wird, während der Finger noch tippt. */
  ['qsVon', 'qsBis'].forEach(id => {
    const f = document.getElementById(id);
    if (f) f.addEventListener('change', () => { if (QSCHLEIFE.an) schleifeLesen(); });
  });
  const zeileVerf = document.getElementById('quranVerfolgen');
  if (zeileVerf) zeileVerf.addEventListener('click', (e) => {
    const k = e.target.closest('[data-quranverfolgen]');
    if (!k) return;
    SETTINGS.quranVerfolgen = k.dataset.quranverfolgen;
    saveSettings();
    /* Wer es gerade EINgeschaltet hat, will nicht bis zum naechsten Vers
       warten — der laufende wird sofort herangeholt. Ausschalten dagegen tut
       von selbst nichts: die Ansicht bleibt, wo sie ist. */
    if (quranVerfolgen() && QAUDIO.sure !== null && QAUDIO.sure === OFFENE_SURE
        && typeof zeigeVers === 'function') zeigeVers(QAUDIO.vers);
    wendeQuranAnsichtAn();
  });
})();
