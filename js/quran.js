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
/* ⛔⛔ DIE SPEICHERFORM TRAEGT SEIT DEM 06.09.2026 JE EINTRAG EINEN ZEITSTEMPEL
   ==========================================================================
   Elias am 06.09.2026, nachdem er auf dem Tablet nachgesehen hatte:

     „ich habe eben auf meinem tablet geguckt und die sura zalzala war nicht
      als gelernt markiert […] ich möchte das alles was sowohl auf meinem
      handy, als auch auf meinem tablat 1:1 identisch ist."

   Die Ursache lag im Abgleich: `vt_hifz` und `vt_hifzVerse` liefen ueber den
   Schlusszweig von fuehreZusammen() — „der juengere Stempel gewinnt", und zwar
   als GANZER BLOCK. Markiert er auf dem Handy Sure 99 und auf dem Tablet eine
   andere, ueberlebt nur die vom juengeren Geraet. Die andere ist weg.

   Es ist derselbe Fehler, der bei `vt_bekannt` (17.08.) und bei `vt_notes`
   (20.08.) schon behoben wurde. Die Loesung ist dieselbe Form:

       { id: { an: true|false, zeit: ms } }

   ⭐ `an: false` ist der Grund, warum es nicht einfach eine Vereinigung sein
   darf: nimmt er einen Haken WEG, muss auch das ankommen. Eine Vereinigung
   holte ihn vom anderen Geraet zurueck.

   ⚠️ NACH AUSSEN aendert sich nichts: `HIFZ` und `HIFZ_VERSE` bleiben die
   schlanke Form `{ id: true }`, damit die fuenfzehn Lesestellen unten
   unveraendert bleiben. Nur Laden und Speichern gehen durch die zwei
   Funktionen hier. Die reiche Form liegt daneben in `*_ZEIT`.

   ⚠️ Alte Daten werden beim Laden mitgenommen (`true` / `1` → `{an:true,
   zeit:0}`). Zeit 0 heisst „schon immer" und verliert gegen jede echte
   Aenderung — richtig so, denn wann der Haken gesetzt wurde, weiss niemand.
   [[eingefrorenes_feld_ist_kein_zustand]] */
function hakenLaden(schluessel){
  const roh = LS.get(schluessel, {}) || {};
  const schlank = {}, reich = {};
  for (const [id, v] of Object.entries(roh)){
    const e = (v && typeof v === 'object') ? { an: !!v.an, zeit: Number(v.zeit) || 0 }
                                           : { an: !!v, zeit: 0 };
    reich[id] = e;
    if (e.an) schlank[id] = true;
  }
  return { schlank, reich };
}
/* Schreibt die reiche Form und gibt sie zurueck. Ein Eintrag, dessen Zustand
   sich NICHT geaendert hat, behaelt seinen alten Zeitstempel — sonst gaelte
   jeder Speichervorgang als Aenderung und das zuletzt gestartete Geraet
   gewaenne immer. */
function hakenSpeichern(schluessel, schlank, reichAlt){
  const jetzt = Date.now();
  const reich = {};
  for (const id of new Set([...Object.keys(schlank), ...Object.keys(reichAlt || {})])){
    const an = !!schlank[id];
    const vorher = (reichAlt || {})[id];
    reich[id] = (vorher && !!vorher.an === an) ? vorher : { an, zeit: jetzt };
  }
  LS.set(schluessel, reich);
  return reich;
}

const _hifz0 = hakenLaden('vt_hifz');
let HIFZ = _hifz0.schlank, HIFZ_ZEIT = _hifz0.reich;
/* ⭐ `juzStandNeu()` steht in BEIDEN Speicherfunktionen — das ist die Stelle
   an der Quelle. Jede Änderung am Ḥifẓ-Stand läuft hier durch, ganz gleich ob
   sie von einem Haken, vom Geräteabgleich oder vom Rückgängigmachen kommt.
   An den Aufrufern hätte man eine Stelle vergessen. [[wirkung_an_der_quelle_stilllegen]] */
function saveHifz(){ HIFZ_ZEIT = hakenSpeichern('vt_hifz', HIFZ, HIFZ_ZEIT); juzStandNeu(); }

/* ⛔⛔ DIE ACHT (93, 94, 95, 96, 98, 100, 101, 104) NICHT ALS AUSWENDIG EINTRAGEN
   (18.09.2026). In der App sind sie nicht abgehakt, obwohl er am 17.08. sagte,
   er kenne die Suren „bis sura duha" auswendig. Ich hatte sie per Code abhaken
   wollen (so, als hätte er es selbst getan) — Elias: „nein mach das nicht".
   Ein Haken „auswendig" ist SEINE Aussage über sich; die App setzt keinen davon
   selbst. „Wiederholen" nimmt, was er abgehakt hat — so wollte er es auch:
   „und bei wiederholen sollen suren sein ich bereits gelernt habe also wnen ich
   neue lerne dann sollen die auch dazu kommen da".
   [[antwort_auf_meine_frage_ist_keine_freigabe]] */
const _hifzV0 = hakenLaden('vt_hifzVerse');
let HIFZ_VERSE = _hifzV0.schlank, HIFZ_VERSE_ZEIT = _hifzV0.reich;
function saveHifzVerse(){ HIFZ_VERSE_ZEIT = hakenSpeichern('vt_hifzVerse', HIFZ_VERSE, HIFZ_VERSE_ZEIT); juzStandNeu(); }
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
  /* ⭐ Der Strich zieht sofort mit — er hängt am Beobachter und nicht am
     Schreiben, das 800 ms wartet. Sonst hinkte er beim Rollen hinterher. */
  leseStrichZeichnen();
  clearTimeout(LESE_SCHREIBUHR);
  LESE_SCHREIBUHR = setTimeout(() => LS.set('vt_lesestand', LESESTAND), 800);
}

/* ---------- ⭐⭐ WIEDERHOLEN: JEDE AUSWENDIGE SURE FRISCH HALTEN ----------

   Elias am 15.09.2026, statt einer Anzeige „zuletzt wiederholt vor X Tagen":

     „man könnte außer fatiha und mulk pro tag dort verlagen das ich eine sura
      lese von denen die ich bereits auswendig kann um sie wieder frisch zu
      halten. pro tag dann immer eine andere sura die ich auswenig kann + auch
      noch einen ring für immer die sura die ich als favorieten hinzufüge."

   und zur Reihenfolge:

     „jede sura die ich auswenig kann sollte in einem interval dran kommen also
      zb ich kann 10 suren auswendig und am ersten tag ist halt die erste sure.
      ich muss alle 9 anderen suren lesen und dann kommt erst wieder die erste
      sura."

   ⛔ FĀTIḤA UND AL-MULK SIND AUSGENOMMEN — seine Vorgabe. Beide liest er
   ohnehin täglich; sie in die Runde zu nehmen hiesse, ihm etwas abzuverlangen,
   was längst geschieht.

   ⛔ RÜCKWIRKEND GIBT ES NICHTS. Bis heute hat die App nirgends festgehalten,
   welche Sure wann gelesen wurde — `vt_lesestand` merkt nur, WO er zuletzt
   war. Die Runde beginnt also bei null und ist erst nach einem Durchgang
   aussagekräftig. [[daten_ohne_zugang]] */
let WDH = LS.get('vt_suraGelesen', {});      /* { Sure: 'JJJJ-MM-TT' } */

/* ---------- ⛔⛔ WANN WURDE EINE SURE ZULETZT ANGEFASST? (17.09.2026) --------

   Seit heute kann Elias das Abhaken auch ZURÜCKNEHMEN (vergissWiederholung()
   unten). Damit gibt es zum ersten Mal einen Handgriff, der einen Eintrag
   WEGNIMMT — und genau der überlebte den Geräteabgleich nicht: der führt
   `vt_suraGelesen` je Sure nach dem JÜNGEREN Datum zusammen, und ein
   weggenommener Eintrag hat gar kein Datum mehr. Der Abgleich hätte das
   heutige Datum zurückgebracht und den Ring wieder gefüllt — ohne Meldung,
   wenige Sekunden später.

   ⚠️ Das trifft auch mit EINEM Gerät: verglichen wird gegen den Stand, der
   längst hochgeladen ist.

   Deshalb je Sure der Zeitpunkt des letzten Handgriffs — abhaken wie
   zurücknehmen. Der Abgleich entscheidet damit nach dem SPÄTEREN Handgriff
   statt nach dem jüngeren Datum: eine Rücknahme gewinnt gegen ein älteres
   Abhaken, ein späteres Abhaken gegen eine ältere Rücknahme.
   [[ausfall_ist_unsichtbar_gebaut]] [[werkzeug_ohne_aufrufer]] */
let WDH_ZEIT = LS.get('vt_suraGelesenZeit', {});   /* { Sure: Zeitpunkt in ms } */

/* Welches Datum stand VOR dem heutigen Haken da? Nur für diese Sitzung: eine
   Rücknahme soll die letzte ECHTE Lesung nicht mitlöschen. Ist sie nicht mehr
   bekannt (App zwischendurch geschlossen), fällt der Eintrag ganz weg — die
   Sure gilt dann als nie gelesen und ist in der Runde als Erste dran. Das ist
   sie ohne die heutige Lesung ohnehin. */
const WDH_VORHER = {};

const WDH_AUSGENOMMEN = new Set([1, 67]);    /* Fātiḥa und al-Mulk */

function merkeWiederholung(sure){
  const heute = todayStr(0);
  if (WDH[sure] === heute) return;           /* schon heute gezählt */
  WDH_VORHER[sure] = WDH[sure] || '';
  WDH[sure] = heute;
  WDH_ZEIT[sure] = Date.now();
  LS.set('vt_suraGelesen', WDH);
  LS.set('vt_suraGelesenZeit', WDH_ZEIT);
  if (typeof renderQuranRinge === 'function') renderQuranRinge();
  if (typeof zeichneGelesenKnopf === 'function') zeichneGelesenKnopf();
  if (typeof zeichneSeitenKnopf === 'function') zeichneSeitenKnopf();
}

/* ---------- ⭐ Doch nicht gelesen: den Haken zurücknehmen (17.09.2026) -------

   Elias: „ich will das bei den suren die ich ringe habe und mir angezeigt wird
   das ich sie gelesen habe, dass ich in die sure nach unten gehen kann und das
   heute gelesen antippen kann damit es nicht mehr als gelesen gilt und auch
   der ring dann wieder nicht voll ist"

   Bis heute war der Haken eine Einbahnstraße. Wer in eine Sure hineinsah und
   dabei lange genug blieb — nachschlagen, einen Vers vergleichen, die
   Rezitation hören —, hatte sie „gelesen", und der volle Ring behauptete den
   Rest des Tages etwas Falsches. Genau dieselbe Überlegung wie beim Haken
   selbst, nur andersherum: die Automatik kann danebenliegen, und dann muss es
   einen Weg von Hand geben. [[ausfall_ist_unsichtbar_gebaut]]

   ⚠️ Nur HEUTE. Ein älterer Eintrag bleibt stehen — ihn anzufassen hieße, die
   Wiederholungsrunde rückwirkend zu verschieben. */
function vergissWiederholung(sure){
  if (WDH[sure] !== todayStr(0)) return;     /* heute gar nicht eingetragen */
  const vorher = WDH_VORHER[sure];
  if (vorher) WDH[sure] = vorher; else delete WDH[sure];
  delete WDH_VORHER[sure];
  WDH_ZEIT[sure] = Date.now();
  LS.set('vt_suraGelesen', WDH);
  LS.set('vt_suraGelesenZeit', WDH_ZEIT);
  /* ⛔ Ohne diese Sperre trüge die Automatik den Haken sofort wieder ein: er
     steht am ENDE der Sure, die Zeit ist dort längst voll, und der nächste
     Ruck am Bildschirm meldet das Ende erneut. Sie gilt für DIESE Lesung — wer
     die Sure verlässt und neu öffnet, wird wieder normal gezählt. */
  if (typeof leseZuruecknahme === 'function') leseZuruecknahme(sure);
  if (typeof renderQuranRinge === 'function') renderQuranRinge();
  if (typeof zeichneGelesenKnopf === 'function') zeichneGelesenKnopf();
  if (typeof zeichneSeitenKnopf === 'function') zeichneSeitenKnopf();
}

/* ---------- ⛔⛔ WANN GILT EINE SURE ALS GELESEN? (16.09.2026) ----------

   Elias: „auf meinem tablet hab ich zalzala gelesen die heutige aufgabe und
   dann bin ich raus gegangen und es wurde einfach nicht gezählt,
   wahrscheinnlich weil ich nicht runter scrollen konnte weil der bildschirm
   groß genug war für die ganze sura. das könnte sicherlich auch am handy so
   sein. das müsste man lösen. wahrscheinlich indem man mindesten so 1-2 min in
   der sure bleibt dann ist sicher das man auch wirklich liest und nicht
   einfach für 5 sek rein geht, kurz guckt und wieder raus"

   ⛔ SEINE VERMUTUNG WAR RICHTIG, DIE URSACHE LAG ABER NOCH EINE STUFE TIEFER.
   Gezählt wurde bis heute in beobachteLesestand() mit DEMSELBEN Beobachter,
   der den Lesestand führt — und der trägt `rootMargin: '-64px 0px -60% 0px'`.
   Er meldet also nur, was im oberen Band des Fensters steht; die unteren 60 %
   sind ausdrücklich abgeschnitten, weil „wo stehe ich gerade" die Stelle oben
   meint und nicht das, was unten gerade noch mitläuft.

   Für „habe ich das Ende gesehen?" ist genau dieser Beschnitt falsch: Passt
   eine kurze Sure ganz auf den Schirm, steht ihr letzter Vers dauerhaft in den
   abgeschnittenen 60 % — und es gibt nichts zu rollen, was ihn nach oben
   brächte. Die Sure wurde damit NIE gezählt, und zwar umso sicherer, je größer
   das Gerät ist. Az-Zalzala hat 8 Verse; auf seinem Tablet war das Ende nie
   im Band. [[kennzeichen_mit_zwei_ursachen]]

   ⚠️ Das trifft ausgerechnet die kurzen Suren — also genau den Vorrat, aus dem
   die Wiederholungsrunde besteht.

   Deshalb jetzt ZWEI Bedingungen, beide müssen erfüllt sein:
     1. der letzte Vers war wirklich sichtbar — gemessen von einem eigenen
        Beobachter OHNE den Beschnitt, der genau EIN Rechteck ausmisst
     2. lange genug in der Sure — WIE lange, hängt an ihrer Länge (gleich unten)

   ⛔ Die Zeit läuft NUR, solange die Sure offen UND das Fenster sichtbar ist.
   Eine Wanduhr wäre keine Schranke: wer die App weglegt und in zwei Minuten
   zurückkommt, hätte die Sure „gelesen". [[ausfall_ist_unsichtbar_gebaut]] */

/* ---------- ⛔⛔ WIE LANGE? NICHT ÜBERALL GLEICH (16.09.2026, abends) ---------

   Zuerst stand hier eine feste Minute — seine Vorgabe „mindesten so 1-2 min",
   am unteren Rand, gedacht an az-Zalzala. Noch am selben Abend Elias:
   „zb auch am handy mit ikhlas könnte es auch passieren" · „und dafür brauche
   ich wahrscheinlich keine ganze minute um es zu lesen" · „aber wir können
   finde ich nicht überall das selbe maß anwenden weil wenn wir dann zb sagen
   wir nehmen 30 sekunden dann ist sura al mulk aber sicher nicht nach 30
   sekunden gelesen"

   ⛔ Eine feste Zeit ist für Suren von 10 bis 333 Wörtern in BEIDE Richtungen
   falsch: al-Kawthar musste man länger offen halten, als das Lesen dauert —
   und al-Mulk, die einen eigenen TÄGLICHEN Ring hat, zählte nach einem
   Bruchteil ihrer Lesezeit. [[allgemeine_regel_statt_listeneintrag]]

   Jetzt: eine halbe Sekunde je Wort, nie unter 8 Sekunden.

   Der Maßstab ist ein geübter Rezitator, und zwar gekürzt — Elias: „aber wenn
   du das jetzt nach zeit machst wie geübte rezitatoren es machen dann kürze es
   ungefähr um 1/3 weil die sprechen es recht schön und langsam aus und ich
   nicht" · „manchmal lese ich auch recht schnell deswegen"

   Gemessen an Mishari al-ʿAfāsī — Verszeiten von api.qurancdn.com, 16.09.2026,
   erstes Wort ab 0 ms (ohne Basmala). Wörter gezählt mit quranWorte(), genau
   wie der Leser selbst zählt:

       Sure          Wörter   Rezitation   ⅔ davon   Schwelle
       al-Kawthar       10      15,5 s      10,3 s     8 s    (52 %)
       al-Ikhlāṣ        15      13,3 s       8,9 s     8 s    (60 %)
       al-Qadr          30      35,8 s      23,9 s    15 s    (42 %)
       az-Zalzala       36      49,9 s      33,3 s    18 s    (36 %)
       al-Mulk         333     444,2 s     296,1 s   166,5 s  (37 %)

   ⛔ Bei ALLEN 13 gemessenen Suren liegt die Schwelle unter „⅔ davon" — also
   mindestens um das Drittel gekürzt, das er verlangt hat, bei den längeren um
   mehr als die Hälfte. Das ist Absicht: „manchmal lese ich auch recht
   schnell". Eine Schwelle GENAU bei ⅔ hätte al-Mulk (eigener täglicher Ring)
   an einem Tag, an dem er schneller liest als sonst, nicht gezählt.

   Die 8 s liegen über seinem „für 5 sek rein geht, kurz guckt und wieder raus"
   und unter ⅔ der kürzesten gemessenen Rezitation (al-Ikhlāṣ, 8,9 s).

   ⚠️ Wie schnell Elias selbst liest, ist NICHT gemessen — nur seine eigene
   Schätzung („ungefähr um 1/3"). Fühlt es sich falsch an, ist es eine Zahl. */
const WDH_SEK_JE_WORT = 0.5;
const WDH_MINDESTZEIT = 8 * 1000;    /* Untergrenze, auch für die kürzeste Sure */
const WDH_OHNE_TEXT = 60 * 1000;     /* nur falls die Wörter nicht zählbar sind */

/* Wie lange muss DIESE Sure offen sein? Gezählt mit quranWorte() — derselben
   Zählung, mit der der Leser die Wörter markiert. [[dieselbe_frage_zwei_antworten]] */
function wdhSchwelle(sure){
  const verse = (typeof VERSE_CACHE === 'object' && VERSE_CACHE[sure]) || null;
  if (!verse || !verse.length || typeof quranWorte !== 'function') return WDH_OHNE_TEXT;
  let woerter = 0;
  for (const v of verse) woerter += quranWorte(v && v.text_uthmani).length;
  if (!woerter) return WDH_OHNE_TEXT;
  return Math.max(WDH_MINDESTZEIT, Math.round(woerter * WDH_SEK_JE_WORT * 1000));
}

let LESE_SURE = null;          /* welche Sure ist gerade offen */
let LESE_ENDE_GESEHEN = false; /* war ihr letzter Vers schon sichtbar? */
let LESE_SEIT = 0;             /* läuft die Uhr? (Zeitpunkt, sonst 0) */
let LESE_DAUER = 0;            /* bereits gesammelte Zeit in dieser Sure */
let LESE_SCHWELLE = WDH_OHNE_TEXT; /* wie lange DIESE Sure offen sein muss */
let LESE_UHR = null;
let LESE_ENDE_BEOBACHTER = null;
let LESE_ZURUECK = false;      /* in dieser Lesung von Hand zurückgenommen */
let LESE_TAG = null;           /* der Lerntag, auf den sich Uhr und „Ende gesehen" beziehen */

/* Elias hat den Haken für diese Sure gerade zurückgenommen (17.09.2026). Dann
   zählt sie in DIESER Lesung nicht noch einmal von selbst — sonst stünde der
   volle Ring beim nächsten Ruck am Bildschirm wieder da, und die Rücknahme
   wäre ein Knopf ohne Wirkung. Beim nächsten Öffnen der Sure fängt alles von
   vorn an (leseSureSetzen). */
function leseZuruecknahme(sure){
  /* ⭐ Die Seite des Tages hat ihre eigene Sperre (18.09.2026). */
  if (typeof sure === 'string' && sure.indexOf('seite:') === 0){
    if (SEITE_HIER && seitenSchluessel(SEITE_HIER.seite) === sure) SEITE_ZURUECK = true;
    return;
  }
  if (LESE_SURE && Number(sure) === LESE_SURE) LESE_ZURUECK = true;
}

/* ---------- ⭐ Die Seite des Tages gelesen? (18.09.2026) ----------
   Dieselbe Regel wie am Surenende (WANN GILT EINE SURE ALS GELESEN, oben):
   ihr letzter Vers war zu sehen UND die Sure war lange genug offen — dieselbe
   Uhr (leseZeitJetzt), aber die Schwelle aus der Wortzahl der SEITE. Der Ring
   springt an den Seitenanfang; die Uhr läuft also ab dort. */
let SEITE_HIER = null;           /* { seite, sure, von, bisSure, bis }, wenn sie in der offenen Sure ENDET */
let SEITE_ENDE_GESEHEN = false;
let SEITE_SCHWELLE = WDH_OHNE_TEXT;
let SEITE_ZURUECK = false;       /* in dieser Lesung von Hand zurückgenommen */
let SEITE_UHR = null;
let SEITE_BEOBACHTER = null;

/* ⚠️ Gezählt wird in der Sure, in der die Seite ENDET — also auch nur deren
   Teil der Seite: die Uhr fängt beim Öffnen jeder Sure neu an (leseSureSetzen).
   Bei Seite 106 (4:176 bis 5:2) sind das 5:1–2. */
function seiteSchwelle(b){
  const verse = (typeof VERSE_CACHE === 'object' && VERSE_CACHE[b.bisSure]) || null;
  if (!verse || !verse.length || typeof quranWorte !== 'function') return WDH_OHNE_TEXT;
  let woerter = 0;
  for (let v = (b.bisSure === b.sure ? b.von : 1); v <= b.bis; v++) woerter += quranWorte(verse[v - 1] && verse[v - 1].text_uthmani).length;
  if (!woerter) return WDH_OHNE_TEXT;
  return Math.max(WDH_MINDESTZEIT, Math.round(woerter * WDH_SEK_JE_WORT * 1000));
}

function seiteUhrStellen(){
  clearTimeout(SEITE_UHR);
  SEITE_UHR = null;
  if (!SEITE_HIER || !SEITE_ENDE_GESEHEN || !LESE_SEIT || SEITE_ZURUECK) return;
  const fehlt = SEITE_SCHWELLE - leseZeitJetzt();
  if (fehlt <= 0){ pruefeSeite(); return; }
  SEITE_UHR = setTimeout(pruefeSeite, fehlt + 50);
}

function pruefeSeite(){
  leseTagPruefen();
  if (!SEITE_HIER || !SEITE_ENDE_GESEHEN || SEITE_ZURUECK) return;
  if (leseZeitJetzt() < SEITE_SCHWELLE){ seiteUhrStellen(); return; }
  clearTimeout(SEITE_UHR);
  SEITE_UHR = null;
  merkeWiederholung(seitenSchluessel(SEITE_HIER.seite));
}

function leseZeitJetzt(){
  return LESE_DAUER + (LESE_SEIT ? Date.now() - LESE_SEIT : 0);
}

/* ⛔⛔ EIN NEUER LERNTAG FÄNGT VON VORN AN (22.09.2026).
   Elias: „übrigens ist bei mir der ring für mulk bereits voll obwohl ich nur um
   4 uhr morgens das gelesen habe, sollte eigentlich gar nicht abgehakt sein für
   mich jetzt". Um 4 Uhr zählte al-Mulk richtig für den VORTAG (der Tag endet um
   8 Uhr). Er blieb aber in der Sure — und die gesammelte Lesezeit samt „Ende
   gesehen" lag weiter im Speicher. Kam die App nach 8 Uhr zurück, stellte
   leseZeitStart() die Uhr, die Schwelle war längst erreicht, und die Sure zählte
   sofort für den NEUEN Tag, ohne dass er eine Zeile las. Im Abgleich zu sehen:
   Lerntag 21.09. „mulk [1,1]" (richtig), und am 22.09. stand al-Mulk als
   gelesen, bis der Haken um 17:55:30 zurückgenommen wurde.
   Deshalb gehören Uhr und „Ende gesehen" zu EINEM Lerntag. Wechselt er, fängt
   die Lesung von vorn an: Zeit 0, das Ende muss neu erreicht werden (der
   Beobachter meldet erst wieder, wenn der letzte Vers neu ins Bild kommt), und
   die Seite des Tages gilt erst nach dem Neuöffnen der Sure — sie ist ab 8 Uhr
   eine andere. [[ausfall_ist_unsichtbar_gebaut]] */
function leseTagPruefen(){
  const tag = (typeof todayStr === 'function') ? todayStr(0) : null;
  if (LESE_TAG && tag && tag !== LESE_TAG){
    LESE_DAUER = 0;
    if (LESE_SEIT) LESE_SEIT = Date.now();
    LESE_ENDE_GESEHEN = false;
    LESE_ZURUECK = false;
    SEITE_ENDE_GESEHEN = false;
    SEITE_ZURUECK = false;
    SEITE_HIER = null;
    clearTimeout(LESE_UHR); LESE_UHR = null;
    clearTimeout(SEITE_UHR); SEITE_UHR = null;
  }
  LESE_TAG = tag;
}

/* Die Uhr auf den Zeitpunkt stellen, an dem die Schwelle fällt. Ohne sie
   zählte eine Sure, deren Ende von Anfang an sichtbar ist, überhaupt nie:
   der Beobachter meldet einmal und danach nie wieder. */
function leseUhrStellen(){
  clearTimeout(LESE_UHR);
  LESE_UHR = null;
  if (!LESE_SURE || !LESE_ENDE_GESEHEN || !LESE_SEIT) return;
  const fehlt = LESE_SCHWELLE - leseZeitJetzt();
  if (fehlt <= 0){ pruefeWiederholung(); return; }
  LESE_UHR = setTimeout(pruefeWiederholung, fehlt + 50);
}

function pruefeWiederholung(){
  leseTagPruefen();
  if (!LESE_SURE || !LESE_ENDE_GESEHEN || LESE_ZURUECK) return;
  if (leseZeitJetzt() < LESE_SCHWELLE){ leseUhrStellen(); return; }
  clearTimeout(LESE_UHR);
  LESE_UHR = null;
  merkeWiederholung(LESE_SURE);
}

function leseZeitStart(){
  if (LESE_SEIT || !LESE_SURE) return;
  /* ⚠️ Nicht anlaufen, solange die App weggelegt ist. Sonst liefe die Uhr ab
     dem Moment, in dem eine Sure im Hintergrund neu aufgebaut wird. */
  if (document.visibilityState === 'hidden') return;
  leseTagPruefen();
  LESE_SEIT = Date.now();
  leseUhrStellen();
  seiteUhrStellen();
}

function leseZeitHalt(){
  if (LESE_SEIT) LESE_DAUER += Date.now() - LESE_SEIT;
  LESE_SEIT = 0;
  clearTimeout(LESE_UHR);
  LESE_UHR = null;
  clearTimeout(SEITE_UHR);
  SEITE_UHR = null;
}

/* Eine andere Sure (oder zurück in die Liste): die Uhr fängt von vorn an.
   ⚠️ Auch beim Wechsel VON einer Sure ZU einer anderen — sonst trüge die neue
   die Minuten der alten und wäre nach einem Blick gezählt. */
function leseSureSetzen(id){
  leseZeitHalt();
  LESE_SURE = id ? Number(id) : null;
  LESE_SCHWELLE = LESE_SURE ? wdhSchwelle(LESE_SURE) : WDH_OHNE_TEXT;
  LESE_ENDE_GESEHEN = false;
  LESE_DAUER = 0;
  LESE_ZURUECK = false;        /* eine Rücknahme galt nur für die Lesung davor */
  LESE_TAG = (typeof todayStr === 'function') ? todayStr(0) : null;
  if (LESE_ENDE_BEOBACHTER){ LESE_ENDE_BEOBACHTER.disconnect(); LESE_ENDE_BEOBACHTER = null; }
  /* ⭐ Die Seite des Tages, wenn sie in dieser Sure ENDET (18.09.2026) — bei
     einer Seite über die Surengrenze ist das die zweite Sure. */
  SEITE_ENDE_GESEHEN = false;
  SEITE_ZURUECK = false;
  if (SEITE_BEOBACHTER){ SEITE_BEOBACHTER.disconnect(); SEITE_BEOBACHTER = null; }
  const tagesSeite = (LESE_SURE && typeof zufallsSeiteHeute === 'function') ? zufallsSeiteHeute() : null;
  SEITE_HIER = (tagesSeite && tagesSeite.bisSure === LESE_SURE) ? tagesSeite : null;
  SEITE_SCHWELLE = SEITE_HIER ? seiteSchwelle(SEITE_HIER) : WDH_OHNE_TEXT;
  if (LESE_SURE) leseZeitStart();
}

/* ⛔ Die Uhr hält an, wenn die App weggelegt wird — und läuft weiter, wenn sie
   zurückkommt. Ohne diesen Haken wäre die Schwelle eine Wanduhr und damit
   keine Schranke. */
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') leseZeitStart(); else leseZeitHalt();
});

/* Welche auswendigen Suren stehen überhaupt in der Runde? */
/* ⛔⛔ EIN FAVORIT IST NICHT IN DER RUNDE (17.09.2026). Seit dem 17.09. bleibt
   ein Favorit sein eigener Ring, auch wenn er schon als auswendig abgehakt ist
   (siehe wdhFavoriten() unten). Stünde er zugleich hier, zählte sein tägliches
   Lesen auch als Wiederholung: `schonHeute` in wdhHeute() fände ihn, der Ring
   hieße „Wiederholen Al-Qadr, erledigt", und die Sure, die eigentlich dran war,
   verschwände — genau Elias' Fehler vom 16.09. („zalzala als ring ist
   verschwunden"), nur jeden Tag. Eine Sure, die er gerade lernt, muss er nicht
   „frisch halten". Nimmt er sie aus den Favoriten, kommt sie von selbst in die
   Runde. */
function wdhVorrat(){
  if (typeof SURAH_DATA === 'undefined') return [];
  return SURAH_DATA
    .filter(s => HIFZ[s.id] && !WDH_AUSGENOMMEN.has(s.id) && !istFavorit(s.id))
    .map(s => s.id);
}

/* ⛔⛔ HEUTE ERST AUSWENDIG ABGEHAKT — gilt für BEIDE Surenringe (16.09.2026).
   Eine Sure, die er heute als auswendig abgehakt hat, verändert die Ringe von
   HEUTE nicht: sie ist heute keine Wiederholung (wdhHeute) und bleibt heute der
   Ring „Neu lernen" (wdhFavorit). Ab dem nächsten Lerntag gehört sie normal zur
   Wiederholungsrunde. Der Zeitpunkt steht im Haken selbst (HIFZ_ZEIT[id].zeit,
   0 bei alten Haken — die gelten nie als „heute").
   Eine Regel, eine Stelle: beide Ringe fragen hier. [[entscheidung_gilt_fuer_das_zweite_werkzeug]]
   ⚠️ Seit 17.09.2026 fragt nur noch wdhHeute() hier. Ein Favorit bleibt sein
   Ring ohnehin, solange der Stern steht — ob heute abgehakt oder nicht. */
function heuteAuswendigAbgehakt(id){
  const z = (typeof HIFZ_ZEIT === 'object' && HIFZ_ZEIT && HIFZ_ZEIT[id]) ? Number(HIFZ_ZEIT[id].zeit) : 0;
  return z > 0 && typeof lerntagVon === 'function' && lerntagVon(z) === todayStr(0);
}

/* ⭐ Die Rotation, genau wie er sie beschrieben hat: dran ist die Sure, die am
   LÄNGSTEN nicht gelesen wurde. Nie gelesene zuerst. Damit kommt keine ein
   zweites Mal, bevor alle anderen einmal dran waren — ohne dass irgendwo eine
   Position mitgeführt werden muss, die beim Dazulernen einer Sure verrutschen
   würde. [[allgemeine_regel_statt_listeneintrag]] */
function wdhHeute(){
  const alle = wdhVorrat();
  if (!alle.length) return null;
  const heute = todayStr(0);
  /* ⛔⛔ EINE SURE, DIE HEUTE ERST AUSWENDIG ABGEHAKT WURDE, IST KEINE
     WIEDERHOLUNG (16.09.2026).

     Elias las an dem Tag al-Qadr (Ring „Neu lernen") und az-Zalzala (Ring
     „Wiederholen") und hakte al-Qadr um 18:47 als auswendig ab. Damit rutschte
     al-Qadr in diese Runde — mit dem Lesedatum von heute —, und `find` nahm sie
     als erste nach Surennummer: der Ring hieß „Wiederholen Al-Qadr", Zalzala
     war verschwunden. Er mit Bild: „zalzala als ring ist verschwunden und ich
     habs geselen, soll das so sein" und dann: „nicht statt. es zeigt nur qadr.
     beides wurde gezeigt aber jetzt fehtl zalzala".

     Wer eine Sure heute gelernt hat, muss sie heute nicht „frisch halten" —
     so war die Runde gemeint: „eine sura lese von denen die ich bereits
     auswendig kann um sie wieder frisch zu halten". Deshalb zählt eine heute
     abgehakte Sure heute weder als erledigt noch als dran; ab morgen gehört sie
     normal zur Runde. Die Prüfung steht in heuteAuswendigAbgehakt() oben.
     test-surenringe.mjs spielt genau diesen Tag nach. */
  const vorrat = alle.filter(id => !heuteAuswendigAbgehakt(id));
  if (!vorrat.length) return null;
  /* Heute schon eine gelesen? Dann ist die Aufgabe erledigt. */
  const schonHeute = vorrat.find(id => WDH[id] === heute);
  if (schonHeute) return { sure: schonHeute, erledigt: true, vorrat: vorrat.length };
  let dran = vorrat[0], aeltestes = WDH[vorrat[0]] || '';
  for (const id of vorrat){
    const d = WDH[id] || '';                 /* nie gelesen sortiert sich vor */
    if (d < aeltestes){ aeltestes = d; dran = id; }
  }
  return { sure: dran, erledigt: false, vorrat: vorrat.length };
}

/* Die Favoriten-Sure zum Neulernen — alles, was er als Favorit markiert hat
   außer al-Mulk. Elias: „ich habe nur mulk hinzugefügt und immer jeweils die
   sura die ich auswendig lernen will … ist nichts außer mulk als favourit
   hinzugefügt so kann der ring weg." */
/* ⛔⛔ UND DER RING VERSCHWINDET NICHT, SOBALD DIE SURE SITZT (16.09.2026).
   Nach der Reparatur von wdhHeute() schrieb Elias um 20:20: „sura qadr ist
   jetzt als ring weg aber zalzala wieder da" — vorher schon: „beides wurde
   gezeigt". al-Qadr war sein Favorit, er hat sie heute gelesen und um 18:47
   als auswendig abgehakt; `!HIFZ[s.id]` warf sie im selben Augenblick aus
   diesem Ring. Deshalb: eine HEUTE abgehakte Sure bleibt heute der Ring „Neu
   lernen" (und zeigt, dass er erledigt ist). Sie geht VOR einem neuen Favoriten,
   sonst verschwände der erledigte Ring wieder, sobald er die nächste Sure
   markiert. Ab morgen ist sie hier raus. */
/* ⛔⛔⛔ ÜBERHOLT AM 17.09.2026 — „ab morgen ist sie hier raus" war MEINE Regel,
   nicht seine. Am 17.09. um 12:33 fehlte al-Qadr als Ring, und Elias schrieb:
   „ich sagte ja ich möchte auch das die sura die ich als favourite genommen
   habe, dass diese mir auch immer als ring vorgeschlagen werden soll, weil ich
   diese gerade auswendig lerne lernst wenn ich sie als gelernt markiert habe.
   erst wenn ich sie von den favouriten löse dann kann sie tatsächlich weg."

   Er HATTE es gesagt, am 14.09.: „einen ring für immer die sura die ich als
   favorieten hinzufüge … jede sura kannst du einen eigenen ring geben. ist
   nichts außer mulk als favourit hinzugefügt so kann der ring weg". Das
   `!HIFZ[s.id]` darin stammte von mir — und warf die Sure genau dann aus dem
   Ring, wenn er sie zum ersten Mal abhakt, also mitten im Lernen.

   Die Regel ist jetzt nur noch seine: JEDER Favorit außer al-Mulk ist ein
   eigener Ring. Ob er auswendig abgehakt ist, spielt keine Rolle. Weg ist der
   Ring erst, wenn der Stern weg ist. Deshalb eine LISTE, nicht eine Sure.
   ⚠️ al-Mulk hat den eigenen Ring „Täglich" — ein zweiter wäre doppelt. */
function wdhFavoriten(){
  if (typeof SURAH_DATA === 'undefined') return [];
  return SURAH_DATA
    .filter(s => istFavorit(s.id) && s.id !== 67)
    .map(s => s.id);
}

/* ---------- ⭐⭐ ZUFÄLLIG: JEDEN TAG EINE SEITE, DIE ER NOCH NICHT AUSWENDIG KANN ----

   Zwei Aufträge am 18.09.2026, beide von Elias:
   1. unterwegs in seine Google-Aufgaben:
        „Random sura die ich nicht auswendig kann als Ring machen Claude"
      im Chat: „als tagesziel so zu sagen, einfach auf dem startbildschirm"
      → v529: jeden Tag eine ganze Sure.
   2. auf v529 und meine zwei Fragen (lange Suren? 93–104 nicht abgehakt?):
      „mach mit ausnahme von denen, gib mir immer nur eine ganze seite zum
      lesen und du sollst die seite auch vor geben also einfach irgendeine
      seite aus dem koran. wenn ich auf link drücke soll es mich direkt
      dahinbringen" → v530: jeden Tag eine Muṣḥaf-SEITE. Der Ring nennt sie und
      springt beim Antippen an ihren ersten Vers.
   ⚠️ Die erste Fassung (ganze Sure) hatte ihm al-Baqara mit 6116 Wörtern
   zumuten können; eine Seite hat 36 bis 161 (Median 129).

   Gelesen ist die Seite, wenn ihr letzter Vers zu sehen war und die Sure lange
   genug offen ist — dieselbe Regel wie am Surenende, nur mit der Wortzahl der
   SEITE (seiteSchwelle, weiter unten). Dazu der Haken von Hand am Seitenende.
   Gespeichert in WDH unter „seite:N" — im selben Speicher wie die Suren, damit
   Abgleich, Zurücknehmen und Sicherung ohne neuen Schlüssel mitgehen: sync.js
   führt vt_suraGelesen je Eintrag zusammen, gleich welcher Name.

   Welche Seiten: keine mit einer Sure, die er auswendig kann (HIFZ — nur seine
   eigenen Haken, siehe ⛔ bei saveHifz), keine mit den acht, die er
   ausgenommen hat (ZUFALL_AUSGENOMMEN, gleich unten), keine mit einem
   Favoriten (hat „Neu lernen"), keine mit al-Fātiḥa/al-Mulk (liest er
   täglich — seine Worte vom 15.09.: „außer fatiha und mulk"). „Kein Haken"
   und die acht sind seine Regeln; Favoriten und al-Fātiḥa/al-Mulk habe ICH
   dazugenommen, damit nichts zwei Ringe hat. Streng: steht EINE solche Sure
   auf der Seite, fällt die ganze Seite weg.

   ⭐ AUCH SEITEN ÜBER EINE SURENGRENZE (Fassung 530, 18.09. abends). Meine
   erste Fassung nahm der Technik wegen nur Seiten ganz in EINER Sure — der
   Leser zeigt Suren. Das ließ 550 von 604 übrig. Elias: „ich will halt
   einfach eine ganze seite lesen darum geht es, diese suren sind kleiner als
   eine seite", und auf die 550: „warum so wenig? ich kenne doch nur ein paar
   und diese suren sind auch nciht viele". Jetzt springt der Ring an den
   Seitenanfang in der ersten Sure; an deren Ende steht „Seite N geht weiter"
   (seitenWeiterHtml), und der Haken „Seite N heute gelesen" steht am
   Seitenende in der Sure, in der die Seite aufhört — dort wird auch gezählt.
   Gemessen am 18.09. mit seinem Stand (KV, zuletzt geschrieben 17.09.
   22:48:55): 591 Seiten zur Wahl, 41 davon über eine Surengrenze.

   ⛔⛔ ZUFÄLLIG, ABER DEN GANZEN TAG DIESELBE — UND AUF JEDEM GERÄT DIESELBE.
   Jede Seite zieht aus dem Datum ein festes Los (zufallsLos), dran ist die mit
   dem kleinsten. Kein eigener Speicher: beide Geräte rechnen dasselbe aus —
   aus dem Datum und, seit Fassung 531, aus den abgeglichenen Lesungen (erst
   die nie gelesenen, siehe zufallsSeiteHeute). Nicht „Datum → Platz in der
   Liste": hakt er eine ANDERE Sure ab, rückte die Liste zusammen, und der Ring
   spränge mitten am Tag um — sein Fehler vom 16.09. („zalzala als ring ist
   verschwunden").

   ⛔ Hakt er heute die Sure DIESER Seite als auswendig ab oder macht sie zum
   Favoriten: Seite schon gelesen → sie bleibt heute (Ring voll); noch nicht
   gelesen → sofort eine andere, denn dann passt die Wahl nicht mehr.
   ⚠️ Bewusst offen: nimmt er heute einen Haken oder Stern WEG, kommen deren
   Seiten sofort in die Auswahl, und mit kleiner Wahrscheinlichkeit ist eine
   davon die neue. Das zu schließen hieße, den Stand vom Tagesbeginn zu
   speichern und abzugleichen — für einen seltenen Handgriff zu viel Mechanik.
   Bewacht von test-surenringe.mjs (Abschnitt 9, mit Gegenproben). */
function zufallsLos(tag, id){
  const text = tag + '|' + id;
  let h = 0x811c9dc5;                                  /* FNV-1a … */
  for (let i = 0; i < text.length; i++){ h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  /* … und durchmischt (murmur3 fmix32). ⛔ Ohne diese drei Zeilen gemessen, über
     400 Tage bei seinen 98 Suren: nur 82 verschiedene, al-Humaza (104) 33-mal,
     in den ersten 14 Tagen al-Anfāl (8) viermal. Mit ihnen: 97 verschiedene,
     keine öfter als 10-mal — so viel, wie echter Zufall auch ergibt (96,4
     erwartet). Bei den SEITEN (seit v530, 591 zur Wahl) ist der Unterschied
     kleiner: mit 293 verschiedene in 400 Tagen, höchstens 4-mal; ohne 271,
     höchstens 5-mal; echter Zufall ergäbe 291. ⚠️ Diese Zahlen gelten, wenn
     er NIE liest. Liest er jeden Tag seine Seite, sind es seit Fassung 531
     400 verschiedene — siehe zufallsSeiteHeute. */
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/* Ist dieser Favorit heute erst gesetzt worden? Gegenstück zu
   heuteAuswendigAbgehakt(), gelesen aus QURAN_FAV_ZEIT. */
function heuteFavoritGesetzt(id){
  const z = (typeof QURAN_FAV_ZEIT === 'object' && QURAN_FAV_ZEIT && QURAN_FAV_ZEIT[id]) ? Number(QURAN_FAV_ZEIT[id].zeit) : 0;
  return z > 0 && typeof lerntagVon === 'function' && lerntagVon(z) === todayStr(0);
}

function seitenSchluessel(p){ return 'seite:' + p; }

/* Wo liegt Seite p? { seite, sure, von, bisSure, bis }: von Sure `sure` Vers
   `von` bis Sure `bisSure` Vers `bis` — bei den meisten Seiten dieselbe Sure.
   null nur, wenn die Seitendaten fehlen. QURAN_SEITEN[n] = [sure, ayah], wo
   Seite n+1 anfängt; das Ende ist der Vers vor dem Anfang der nächsten. */
function seitenBereich(p){
  if (typeof QURAN_SEITEN === 'undefined' || !Array.isArray(QURAN_SEITEN)) return null;
  const a = QURAN_SEITEN[p - 1];
  if (!a) return null;
  const sure = a[0], von = a[1], n = QURAN_SEITEN[p];
  let bisSure, bis;
  if (!n){ bisSure = 114; bis = versZahl(114); }                  /* Seite 604 endet mit an-Nās */
  else if (n[1] > 1){ bisSure = n[0]; bis = n[1] - 1; }
  else { bisSure = n[0] - 1; bis = versZahl(n[0] - 1); }
  if (!bis) return null;
  return { seite: p, sure, von, bisSure, bis };
}

/* ⛔ DIE ACHT, DIE ER AUSGENOMMEN HAT — gilt nur für diesen Ring (18.09.2026).
   Ich hatte gefragt, weil 93, 94, 95, 96, 98, 100, 101 und 104 in der App
   nicht als auswendig abgehakt sind, obwohl er sie am 17.08. dazuzählte
   („bis sura duha"). Elias, auf genau diese Zahlen: „mach mit ausnahme von
   denen". Abhaken lassen wollte er sie NICHT („nein mach das nicht", ⛔ bei
   saveHifz) — deshalb eine Liste hier, kein Haken. „Wiederholen" nimmt
   weiter nur, was er selbst abhakt.
   Ohne sie kämen, seit Seiten über eine Surengrenze zählen, Seite 596
   (92:15–94:8, fast nur aḍ-Ḍuḥā und aš-Šarḥ) und Seite 597 (at-Tīn und
   al-ʿAlaq, sonst nichts) in die Auswahl: 593 statt 591, gemessen am 18.09. */
const ZUFALL_AUSGENOMMEN = new Set([93, 94, 95, 96, 98, 100, 101, 104]);

/* Darf diese Sure heute Seiten liefern? `mitHeute`: heute Abgehaktes und heute
   gesetzte Sterne zählen noch nicht — nur für die Frage, ob die Seite, die
   ohne sie dran wäre, schon gelesen ist (zufallsSeiteHeute). */
function zufallsSureErlaubt(id, mitHeute){
  if (WDH_AUSGENOMMEN.has(id) || ZUFALL_AUSGENOMMEN.has(id)) return false;
  if (HIFZ[id] && !(mitHeute && heuteAuswendigAbgehakt(id))) return false;
  if (istFavorit(id) && !(mitHeute && heuteFavoritGesetzt(id))) return false;
  return true;
}

/* Eine Seite zählt nur, wenn JEDE Sure darauf erlaubt ist — auch die, in die
   sie hinüberläuft. */
function zufallsSeiteErlaubt(b, mitHeute){
  for (let s = b.sure; s <= b.bisSure; s++){
    if (!zufallsSureErlaubt(s, mitHeute)) return false;
  }
  return true;
}

function zufallsSeitenVorrat(mitHeute){
  const raus = [];
  const anzahl = (typeof QURAN_SEITEN !== 'undefined' && Array.isArray(QURAN_SEITEN)) ? QURAN_SEITEN.length : 0;
  for (let p = 1; p <= anzahl; p++){
    const b = seitenBereich(p);
    if (b && zufallsSeiteErlaubt(b, mitHeute)) raus.push(b);
  }
  return raus;
}

/* Die Seite des Tages, { seite, sure, von, bisSure, bis } oder null. `tag`
   nur für den Prüfer — die App ruft ohne.

   ⭐ ERST WIEDERHOLEN, WENN ALLE DRAN WAREN (Fassung 531, 18.09.2026 abends).
   Meine Frage an ihn: „Soll die tägliche Seite sich erst wiederholen, wenn
   alle 591 einmal dran waren? Jetzt ist es reiner Zufall. In 400 Tagen kämen
   nur 293 verschiedene Seiten dran, manche bis zu viermal."
   Elias, 21:07: „ja klingt gut".
   Deshalb zieht das Los nur unter den Seiten, die er noch NIE gelesen
   hat; erst wenn keine mehr übrig ist, ist die dran, die er am längsten nicht
   gelesen hat. Liest er jeden Tag, kommt 591 Tage lang jeden Tag eine andere
   Seite, danach dieselbe Folge noch einmal.
   ⚠️ „Dran gewesen" heißt hier GELESEN, nicht bloß gezogen — das ist MEINE
   Lesart, ihm so gesagt: eine Seite, die er an einem Tag nicht liest, bleibt
   im Vorrat und kann später wiederkommen, statt für diese Runde verloren zu
   sein. Gezählt wird mit dem, was schon da ist: WDH „seite:N" hält den Tag
   der letzten Lesung, wird abgeglichen und gesichert — kein neuer Schlüssel.
   ⛔ Eine HEUTE gelesene Seite zählt heute noch als ungelesen — sonst spränge
   der Ring direkt nach dem Lesen auf die nächste Seite.
   ⛔ Die „seite:N"-Einträge sind damit das Gedächtnis der Runde: nie
   aufräumen oder kürzen, sonst kommen gelesene Seiten zu früh wieder. */
function zufallsSeiteHeute(tag){
  const t = tag || todayStr(0);
  const zuletzt = b => (typeof WDH === 'object' && WDH && WDH[seitenSchluessel(b.seite)]) || '';
  const ziehe = mitHeute => {
    const vorrat = zufallsSeitenVorrat(mitHeute);
    /* erste Runde: nie gelesen, oder erst heute */
    let auswahl = vorrat.filter(b => { const d = zuletzt(b); return !d || d === t; });
    if (!auswahl.length){
      /* alle schon gelesen: die am längsten nicht gelesene */
      let aeltester = null;
      for (const b of vorrat){ const d = zuletzt(b); if (aeltester === null || d < aeltester) aeltester = d; }
      auswahl = vorrat.filter(b => zuletzt(b) === aeltester);
    }
    let dran = null, kleinstes = Infinity;
    for (const b of auswahl){
      const los = zufallsLos(t, b.seite);
      if (los < kleinstes){ kleinstes = los; dran = b; }
    }
    return dran;
  };
  const breit = ziehe(true);
  if (breit && zuletzt(breit) === t) return breit;
  return ziehe(false);
}

/* ---------- Der Haken am Ende der Sure (16.09.2026) ----------

   Elias, nachdem az-Zalzala nicht gezählt worden war: „qadr und zalzala müssen
   bei mir heute abgehackt werden".

   ⭐ Die Reparatur oben (zweiter Beobachter + Mindestzeit) wirkt erst beim
   NÄCHSTEN Lesen. Für einen Tag, an dem er die Sure schon gelesen hat, hilft
   sie nicht — und ihn beide Suren noch einmal offen halten zu lassen für
   etwas, das die App falsch gemacht hat, wäre die falsche Rechnung.

   ⛔ Das ist aber nicht der einzige Grund, warum der Haken bleibt. Eine
   Erkennung, die an Bildschirmgeometrie hängt, KANN wieder danebenliegen — ein
   ungewöhnliches Seitenverhältnis, eine eingeblendete Tastatur, ein Gerät, das
   es noch nicht gibt. Ohne einen Weg von Hand bleibt dann nur, es hinzunehmen.
   Der Haken ist das Sicherheitsnetz unter einer Automatik, die man nicht
   vollständig prüfen kann. [[ausfall_ist_unsichtbar_gebaut]]

   ⚠️ Nur bei Suren, für die WDH überhaupt etwas bedeutet: auswendige (die
   Wiederholungsrunde und al-Mulk) und die Favoritensure, die er gerade lernt.
   Unter den übrigen 100+ Suren wäre der Knopf eine Zeile ohne Folgen.
   ⭐ Die zufällige SEITE des Tages hat ihren eigenen Haken am Seitenende
   (seiteGelesenKnopfHtml) — für sie gilt sein Wunsch vom 17.09. genauso: „bei
   den suren die ich ringe habe … das heute gelesen antippen kann". */
function inWiederholungsrunde(sure){
  const id = Number(sure);
  if (typeof HIFZ === 'object' && HIFZ[id]) return true;
  return (typeof wdhFavoriten === 'function') && wdhFavoriten().includes(id);
}

/* ⛔⛔ DER KNOPF GEHT SEIT DEM 17.09.2026 IN BEIDE RICHTUNGEN. Bis dahin stand
   er nach dem Abhaken als `disabled` da — eine Feststellung, kein Knopf mehr.
   Elias: „dass ich in die sure nach unten gehen kann und das heute gelesen
   antippen kann damit es nicht mehr als gelesen gilt und auch der ring dann
   wieder nicht voll ist". Er sagt beides: was gilt (der Haken ist gesetzt) und
   was ein Tippen tut (es zurücknehmen). `aria-pressed` trägt denselben Stand
   für die Vorlesefunktion. */
function gelesenKnopfHtml(sure){
  if (!inWiederholungsrunde(sure)) return '';
  const heute = (typeof WDH === 'object' && WDH[sure] === todayStr(0));
  return `<div class="sura-gelesen-zeile">
    <button class="btn btn-secondary sura-gelesen${heute ? ' ist' : ''}" type="button"
            data-suragelesen="${sure}" aria-pressed="${heute ? 'true' : 'false'}">
      ${icon('check')}${heute ? 'Heute gelesen — zurücknehmen' : 'Heute gelesen — abhaken'}
    </button>
  </div>`;
}

/* Nur den Knopf neu zeichnen, nicht die ganze Sure: merkeWiederholung() ruft
   das, und ein Neuaufbau der Versliste würde mitten im Lesen den Rollstand
   verlieren. */
function zeichneGelesenKnopf(){
  const alt = document.querySelector('#verseList .sura-gelesen-zeile');
  if (!alt) return;
  const sure = Number(alt.querySelector('[data-suragelesen]')?.dataset.suragelesen || 0);
  if (!sure) return;
  alt.outerHTML = gelesenKnopfHtml(sure);
}

/* ⭐ Der Haken für die zufällige Seite des Tages (18.09.2026) — am Ende DER
   SEITE, nicht der Sure: dort ist die Aufgabe zu Ende. Gleiche Form wie der
   Surenknopf, eigene Hülle (.seite-gelesen-zeile), damit zeichneGelesenKnopf()
   nicht den falschen Knopf neu zeichnet. */
function seiteGelesenKnopfHtml(p){
  const heute = (typeof WDH === 'object' && WDH[seitenSchluessel(p)] === todayStr(0));
  return `<div class="seite-gelesen-zeile">
    <button class="btn btn-secondary sura-gelesen${heute ? ' ist' : ''}" type="button"
            data-seitegelesen="${p}" aria-pressed="${heute ? 'true' : 'false'}">
      ${icon('check')}${heute ? 'Seite ' + p + ' heute gelesen — zurücknehmen' : 'Seite ' + p + ' heute gelesen — abhaken'}
    </button>
  </div>`;
}

function zeichneSeitenKnopf(){
  const alt = document.querySelector('#verseList .seite-gelesen-zeile');
  if (!alt) return;
  const p = Number(alt.querySelector('[data-seitegelesen]')?.dataset.seitegelesen || 0);
  if (p) alt.outerHTML = seiteGelesenKnopfHtml(p);
}

/* ⭐ Geht die Seite des Tages über das Ende dieser Sure hinaus, steht nach dem
   letzten Vers, wo sie weitergeht — und ein Tippen öffnet die nächste Sure
   von vorn. Ohne ihn endete die Aufgabe scheinbar am Surenende, und der Haken
   „Seite N heute gelesen" stünde in einer Sure, die er nie aufmacht.
   Eigene Hülle (.seite-weiter-zeile), damit zeichneSeitenKnopf() ihn nicht
   für den Haken hält. */
function seitenWeiterHtml(p, naechste){
  const s = (typeof SURAH_DATA !== 'undefined') ? SURAH_DATA.find(x => x.id === naechste) : null;
  if (!s) return '';
  return `<div class="seite-weiter-zeile">
    <button class="btn btn-secondary sura-gelesen" type="button" data-seiteweiter="${naechste}">
      Seite ${p} geht weiter in ${naechste}. ${escapeHtml(s.name)}${icon('left')}
    </button>
  </div>`;
}

document.addEventListener('click', e => {
  const k = e.target.closest('[data-seiteweiter]');
  if (!k) return;
  const naechste = Number(k.dataset.seiteweiter);
  if (naechste && typeof openSurah === 'function') openSurah(naechste);
});

document.addEventListener('click', e => {
  const k = e.target.closest('[data-seitegelesen]');
  if (!k) return;
  const p = Number(k.dataset.seitegelesen);
  if (!p) return;
  const schluessel = seitenSchluessel(p);
  if (typeof WDH === 'object' && WDH[schluessel] === todayStr(0)){
    vergissWiederholung(schluessel);
    if (typeof toast === 'function') toast('Zurückgenommen — Seite ' + p + ' gilt heute nicht mehr als gelesen');
    return;
  }
  merkeWiederholung(schluessel);
  if (typeof toast === 'function') toast('Seite ' + p + ' als heute gelesen eingetragen');
});

document.addEventListener('click', e => {
  const k = e.target.closest('[data-suragelesen]');
  if (!k) return;
  const sure = Number(k.dataset.suragelesen);
  if (!sure) return;
  /* Steht der Haken schon für heute, nimmt dasselbe Tippen ihn zurück. */
  if (typeof WDH === 'object' && WDH[sure] === todayStr(0)){
    vergissWiederholung(sure);
    if (typeof toast === 'function') toast('Zurückgenommen — gilt heute nicht mehr als gelesen');
    return;
  }
  merkeWiederholung(sure);
  if (typeof toast === 'function') toast('Als heute gelesen eingetragen');
});

/* ⭐ Der Lesestrich in der offenen Sure (15.09.2026).
   Elias wollte ihn subtil: „ich wills eher subtil haben … einmal in die breite
   durchzuehen", und zur Vorschau mit beiden Varianten: „so find ich gut" —
   an der Kopfzeile, die beim Runterrollen wegfährt.

   ⛔ Nur in einer offenen Sure. In der Liste gibt es keine Strecke, und der
   Juz-Ring oben sagt dort etwas ganz anderes.

   ⚠️ Der Vorschuss gilt auch hier („generell alle leisten … nicht nur bei 0"),
   und beim letzten Vers steht er exakt auf 100. */
function leseStrichZeichnen(){
  const el = document.getElementById('leseStrich');
  if (!el) return;
  const balken = el.querySelector('i');
  if (OFFENE_SURE === null){ el.classList.add('hidden'); return; }
  const gesamt = versZahl(OFFENE_SURE);
  if (!gesamt){ el.classList.add('hidden'); return; }
  /* ⛔ Ohne gespeicherten Stand fängt die Strecke bei Vers 1 an — nicht
     verborgen. Erster Versuch versteckte den Strich, solange `LESESTAND` noch
     nicht auf dieser Sure stand; beim Öffnen einer Sure war das IMMER der
     Fall, und er erschien erst beim ersten Rollen. Eine Strecke, die erst
     sichtbar wird, wenn man sie schon geht, zeigt nicht, wie lang sie ist. */
  const beiVers = (LESESTAND && LESESTAND.sure === OFFENE_SURE) ? LESESTAND.vers : 1;
  const anteil = Math.min(Math.max(beiVers, 1) / gesamt, 1);
  const laenge = anteil >= 1 ? 100 : Math.round((0.10 + 0.90 * anteil) * 1000) / 10;
  el.classList.remove('hidden');
  if (balken) balken.style.width = laenge + '%';
}

function beobachteLesestand(id){
  if (LESE_BEOBACHTER) LESE_BEOBACHTER.disconnect();
  LESE_SICHTBAR = new Set();
  /* ⛔ VOR dem Ausstieg bei leerer Liste. Stünde es weiter unten, behielte eine
     Sure, deren Verse noch nicht da sind, die Uhr der VORIGEN — und die wäre
     dann schon abgelaufen. */
  leseSureSetzen(id);
  const verse = document.querySelectorAll('#verseList .verse-item');
  if (!verse.length) return;
  /* ⭐ Das Ende der Seite des Tages, wenn sie hier liegt (18.09.2026) — eigener
     Beobachter auf genau EINEN Vers, wie beim Surenende weiter unten. */
  if (SEITE_HIER){
    const seitenEnde = document.querySelector(`#verseList .verse-item[data-versnr="${SEITE_HIER.bis}"]`);
    if (seitenEnde){
      SEITE_BEOBACHTER = new IntersectionObserver(eintraege => {
        if (!eintraege.some(e => e.isIntersecting)) return;
        SEITE_ENDE_GESEHEN = true;
        pruefeSeite();
      });
      SEITE_BEOBACHTER.observe(seitenEnde);
    }
  }
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
    /* ⛔ HIER STAND DIE WIEDERHOLUNGSZÄHLUNG — und genau das war der Fehler:
       `if (LESE_SICHTBAR.has(versZahl(id))) merkeWiederholung(id);`
       Dieser Beobachter schneidet unten 60 % ab. Ein letzter Vers, der dort
       steht, weil die Sure ganz auf den Schirm passt, kam nie in die Menge.
       Die Zählung hängt jetzt an einem eigenen Beobachter weiter unten.
       Begründung beim Block „WANN GILT EINE SURE ALS GELESEN?". */
  }, { rootMargin: '-64px 0px -60% 0px' });
  verse.forEach(v => LESE_BEOBACHTER.observe(v));

  /* ---------- Der zweite Beobachter: nur der letzte Vers, ohne Beschnitt ----
     ⚠️ Der Einwand, der hier früher stand („ein zweiter würde dieselben
     Rechtecke ein zweites Mal ausmessen"), galt für ALLE Verse — bei
     al-Baqarah wären das 286. Dieser hier beobachtet genau EINEN Knoten, und
     zwar den, auf den es ankommt. Der Preis ist damit weg, der Fehler auch. */
  const letzterNr = versZahl(id);
  const letzter = letzterNr
    ? document.querySelector(`#verseList .verse-item[data-versnr="${letzterNr}"]`)
    : null;
  if (!letzter) return;
  LESE_ENDE_BEOBACHTER = new IntersectionObserver(eintraege => {
    if (!eintraege.some(e => e.isIntersecting)) return;
    LESE_ENDE_GESEHEN = true;
    pruefeWiederholung();
  });
  LESE_ENDE_BEOBACHTER.observe(letzter);
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
/* Dieselbe Form wie HIFZ, aus demselben Grund: ein Favorit, den er auf einem
   Geraet wegnimmt, muss auch auf dem anderen weg sein. */
const _fav0 = hakenLaden('vt_quranFav');
let QURAN_FAV = _fav0.schlank, QURAN_FAV_ZEIT = _fav0.reich;
function saveQuranFav(){ QURAN_FAV_ZEIT = hakenSpeichern('vt_quranFav', QURAN_FAV, QURAN_FAV_ZEIT); }

/* ⛔⛔ NACH EINEM ABGLEICH NEU EINLESEN (06.09.2026)
   ==================================================
   HIFZ, HIFZ_VERSE und QURAN_FAV liegen als Modulvariablen im Speicher. Holt
   der Abgleich neue Markierungen, arbeitet die laufende Seite trotzdem mit dem
   alten Stand weiter — und der naechste saveHifz() schreibt ihn zurueck. Die
   geholte Markierung ist dann wieder weg, ohne dass irgendetwas meldet.

   Genau diese Falle steht in js/kern.js bei BEKANNT und SETTINGS ausdruecklich
   beschrieben („der naechste Griff an den Knopf schriebe ihn zurueck"). Fuer
   die Quran-Speicher hatte sie niemand angewandt — und sie ist der Grund,
   warum Elias' Sure az-Zalzala auf dem Tablet verschwand, obwohl der Abgleich
   sie geholt hatte. Der Blockersatz war der eine Weg, DAS hier der zweite.
   [[allgemeine_regel_statt_listeneintrag]] [[erfolgsmeldung_ohne_wirkung]]

   ⚠️ Wird von ladeStandNeu() gerufen, nicht von sync.js: die Reihenfolge
   gehoert an eine Stelle. */
function ladeQuranStandNeu(){
  const h = hakenLaden('vt_hifz');       HIFZ = h.schlank;        HIFZ_ZEIT = h.reich;
  const v = hakenLaden('vt_hifzVerse');  HIFZ_VERSE = v.schlank;  HIFZ_VERSE_ZEIT = v.reich;
  const f = hakenLaden('vt_quranFav');   QURAN_FAV = f.schlank;   QURAN_FAV_ZEIT = f.reich;
  /* Die Surenliste zeigt die Haken — ohne Neuzeichnen stuende dort der alte
     Stand, und ein Tipp darauf schriebe ihn zurueck. */
  /* ⚠️ NUR renderSurahList(). Der zweite Zweig hiess `zeichneSurenListe` und
     war geraten — die Funktion gibt es in js/quran.js nicht. Ein
     typeof-Guard verschluckt so einen Tippfehler lautlos: der Aufruf tut
     still gar nichts, und wer den Zweig liest, haelt ihn fuer einen
     Rueckfall. Hier war er harmlos, weil der erste greift; als ALLEINIGER
     Zweig waere die Surenliste nach einem Abgleich nie neu gezeichnet worden.
     [[werkzeug_ohne_aufrufer]] */
  /* ⛔⛔ ABER NICHT, WÄHREND EINE SURE OFFEN IST (17.09.2026).
     Elias: „ich habs gedrückt und wurde dann aus der sure rausgeschmissen, das
     soll auch ncith so sein"

     `renderSurahList()` blendet die Versliste AUS und die Surenliste EIN — das
     ist sein Zweck. Wer gerade liest, steht damit mitten im Lesen wieder in der
     Liste. Gerufen wird es hier vom Abgleich (`gleicheAb` → `ladeStandNeu`),
     und der läuft, sobald irgendetwas zusammengeführt wurde: auch während er
     liest, auch vom anderen Gerät ausgelöst. Der Fehler ist also älter als das
     Zurücknehmen des Hakens — der hat ihn nur jedes Mal ausgelöst.

     Die Liste wird beim Zurückgehen ohnehin neu gebaut (Historie-Eintrag je
     Ebene, siehe unten), der Haken ist also nicht verloren.
     ⚠️ Die Haken IN der offenen Sure bleiben so lange stehen, wie sie beim
     Öffnen waren — ein Neubau der Versliste würde seinen Rollstand verlieren,
     und das mitten im Lesen wäre der schlechtere Tausch.
     [[ausfall_ist_unsichtbar_gebaut]] */
  if (OFFENE_SURE !== null) return;
  if (typeof renderSurahList === 'function') renderSurahList();
  /* Die markierten Fehlerstellen (js/quran-markierung.js, v538) — derselbe
     Grund wie die Haken oben: der Abgleich schreibt in den Speicher, die
     Variable weiss davon nichts, und der Leser zeigte bis zum naechsten
     Start den alten Stand. */
  if (typeof tajweedNachAbgleich === 'function') tajweedNachAbgleich();
}
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
  const zusatz = HIFZ[s.id] ? '' : (einzeln ? `${einzeln} von ${s.verses} auswendig` : '');
  const fav = istFavorit(s.id);
  /* Elias am 04.08.2026 abends, mit Bild: "es sieht besser aus, wenn man die
     juz da hinpackt wo der strich ist und die verse und die umlaut da wo der
     kasten ist." Also: Umschrift und Verszahl in die OBERE Zeile neben den
     arabischen Namen, der Juz in die untere.
     Damit faellt die eigene Juz-Spalte weg. Ihre frühere Begruendung war, dass
     die Namenszeile bei angefangenen Suren schon "12 von 286 auswendig" traegt
     - das steht jetzt unten beim Juz, wo Platz ist. Der alte Grund gilt also
     nicht mehr, statt ihn zu umgehen. */
  const unten = [juzText(s), zusatz].filter(Boolean).join(' · ');
  return `
    <div class="surah-row" data-opensurah="${s.id}">
      <div class="sr-num">${s.id}</div>
      <div class="sr-mid">
        <div class="sr-name">${s.name} · ${s.verses} Verse</div>
        <div class="sr-unten">${unten}</div>
      </div>
      <div class="sr-ar">${surenTitel(s)}</div>
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
  /* Vor dem Aufbau festhalten, ob wir aus einer offenen Sure kommen - nur dann
     wird der Rollstand wiederhergestellt. Beim Tippen in der Suche steht
     OFFENE_SURE ohnehin auf null, dort waere ein Sprung falsch. */
  const kamAusSure = OFFENE_SURE !== null;
  const list = SURAH_DATA.filter(s => !q || s.name.toLowerCase().includes(q) || s.ar.includes(q) || String(s.id)===q);
  document.getElementById('quranFullTitle').textContent = 'Quran lesen';
  /* ⛔⛔ HIER STAND `quranFullIntro` — und sein Fehlen hat am 15.09.2026 die
     ganze Surenliste stillgelegt. Die Einleitung darüber ist auf Elias' Wunsch
     entfallen („das hier kannst du weg machen"); die zwei Zeilen, die sie
     ein- und ausblendeten, sind mir dabei entgangen. `getElementById()` gab
     null, `.classList` darauf warf, und die Funktion brach an dieser Stelle
     ab — vor dem Aufbau der Liste. Ausgeliefert als v482.

     ⚠️ Kein Prüfer hat das gefunden: validate.js kennt die Icon-Verweise
     (`<use href>`), aber nicht die IDs, die der Code anspricht. Genau das
     bewacht jetzt `test-element-verweise.mjs`.
     [[verwiesene_datei_gehoert_dazu]] [[ausfall_ist_unsichtbar_gebaut]] */
  document.getElementById('surahSearch').classList.remove('hidden');
  document.getElementById('surahList').classList.remove('hidden');
  document.getElementById('verseList').classList.add('hidden');
  document.getElementById('hifzBar').classList.add('hidden');
  document.getElementById('btnAyahListe').classList.add('hidden');
  document.getElementById('suraNav').classList.add('hidden');
  OFFENE_SURE = null;
  /* ⛔ Der Ton gehoert zur offenen Sure. Wer zurueck in die Liste geht, hat
     sie verlassen — eine Rezitation, die dann weiterlaeuft, ist ein Geraet
     ohne sichtbaren Ausschalter. Die Leiste ist naemlich weg.
     ⚠️ Nur beim Verlassen einer Sure: renderSurahList laeuft auch bei jedem
     Tastendruck in der Suche, und dort ist OFFENE_SURE schon null. */
  if (kamAusSure && typeof audioAus === 'function') audioAus();
  /* ⛔ Und die Leseuhr. Sie gehoert genauso zur offenen Sure wie der Ton: wer
     in die Liste zurueckgeht, liest diese Sure nicht mehr. Ohne das liefe sie
     weiter und die naechste Sure waere nach einem Blick gezaehlt. */
  if (kamAusSure) leseSureSetzen(null);
  /* Zurueck in der Liste ist der Kopf immer da - sonst stuende man ohne
     Zurueck-Pfeil vor 114 Zeilen. Siehe kopfZuruecksetzen weiter unten. */
  kopfZuruecksetzen();
  /* Wie der Favoritenblock verschwindet auch die Weiterlesen-Zeile bei einer
     Suche: sie filtert nicht mit und stuende sonst ueber Treffern, zu denen
     sie nicht gehoert. */
  if (q) document.getElementById('weiterlesen').classList.add('hidden');
  else renderWeiterlesen();
  renderFavListe(!!q);
  document.getElementById('surahList').innerHTML =
    list.map(surahZeile).join('') || '<div class="empty-state">Keine Sure gefunden.</div>';
  /* Nach dem Aufbau, sonst ist der Kasten noch zu kurz und der Wert wird
     auf die alte Hoehe beschnitten.

     ⚠️ Der else-Zweig ist am 11.08.2026 dazugekommen und behebt einen zweiten,
     eigenstaendigen Fehler: Wer weit unten in der Liste steht und dann sucht,
     bekam die Treffer NICHT zu sehen. Gemessen (375x812): von Rollstand 2500
     aus nach "Fatiha" gesucht - ein Treffer, und der stand 716 px OBERHALB des
     sichtbaren Bereichs. Auf dem Bildschirm war nichts als leere Flaeche; das
     sieht aus wie "nichts gefunden", obwohl die Sure da ist.
     Bei einer Suche und beim Leeren des Feldes aendert sich die Liste
     vollstaendig - dann ist oben der einzig richtige Platz. Nur der Rueckweg
     aus einer Sure behaelt seinen gemerkten Stand.

     ⚠️ Hier stand `kamAusSure && !q`, und das `!q` war zu vorsichtig: es hat
     zwei verschiedene Vorgaenge zusammengeworfen - das AENDERN der Suche (die
     Liste ist eine andere, oben ist richtig) und die RUECKKEHR aus einer Sure in
     eine unveraendert gefilterte Liste (der Stand gehoert wiederhergestellt).
     Auseinanderhalten tut das `kamAusSure` schon von selbst, denn beim Tippen
     ins Suchfeld ist OFFENE_SURE immer null. Gemessen am 16.08.2026 (375x812):
     nach "al" gefiltert, auf 600 gerollt, Sure 6 geoeffnet, Zurueck-Taste - der
     Stand kam als 0 zurueck statt als 600. */
  if (kamAusSure) stelleListenRollstandHer();
  else {
    const kasten = document.getElementById('main');
    if (kasten) kasten.scrollTo({ top: 0, behavior: 'instant' });
  }
  /* Der Juz-Ring gehört zur Liste, nicht zur einzelnen Sure — er steht in der
     Kopfzeile und sagt, wie viel von einem Juz insgesamt sitzt. */
  renderJuzRing();
  /* Und der Lesestrich gehört zur Sure: in der Liste ist er weg. */
  const ls = document.getElementById('leseStrich');
  if (ls) ls.classList.add('hidden');
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
/* Obergrenze am 04.08.2026 abends von 200 auf 300 % gesetzt - Elias: "ich will
   bei den einstellungen die option auch haben auf 300% zu gehen bei den
   beiden", also fuer Arabisch UND Deutsch. Die Schrittweite bleibt bei 10 %;
   von 100 auf 300 sind das 20 Tipper, aber ein groeberer Schritt naehme unten
   herum die feine Einstellung weg, die er beim Lesen eher braucht. */
const QURAN_MIN = 70, QURAN_MAX = 300, QURAN_SCHRITT = 10;

/* ---------- Englische Uebersetzung, zuschaltbar (08.09.2026) ---------------

   Elias: „ich will auch die englische übersetzung von Dr. Mustafa Khattab von
   quran.com und möchte in den quran einstellungen ankreuzen, ob ich den einen
   oder den anderen will oder beide"

   ⛔⛔ KHATTAB GIBT DIE API NICHT HER — gemessen, nicht vermutet:

     /resources/translations  liefert 126 Ausgaben, davon 9 englische.
     Khattab (131) ist NICHT darunter.
     /verses/by_chapter/67?translations=131  antwortet mit Status 200 und
     einem LEEREN Uebersetzungsfeld, waehrend 20 und 85 am selben Aufruf
     Text liefern.

   Ein Status 200 ohne Inhalt ist die gefaehrlichste Antwort: nichts meldet
   sich, die Zeile bleibt einfach leer. Deshalb steht die Messung hier.
   „The Clear Quran" ist urheberrechtlich geschuetzt; quran.com darf sie
   anzeigen, aber offenbar nicht ueber die offene API weiterreichen. Das ist
   nichts, was sich umgehen liesse — und soll es auch nicht.

   ⭐ Gebaut ist deshalb die UMSCHALTUNG, die er wollte, mit den Ausgaben, die
   die API wirklich hergibt. Welche davon er will, entscheidet er im Menue.

   ⛔ Und der Text wird ABGERUFEN, nicht mitgeliefert. Ein Volltext-Abzug einer
   geschuetzten Uebersetzung gehoert weder ins Repo noch auf den oeffentlichen
   Server — die API ist genau dafuer da, und der Zwischenspeicher liegt im
   Browser des Nutzers. Nach dem ersten Lesen ist die Sure auch offline da. */

/* Die englischen Ausgaben, die api.quran.com am 08.09.2026 wirklich
   ausgeliefert hat. ⛔ Nicht aus der Ressourcenliste abgeschrieben, sondern
   je Ausgabe an Sure 67 geprueft. */
/* ⭐ Seit dem 08.09.2026 nur noch EINE, auf Elias' Entscheidung: „dann lass
   nur ihn nehmen." Vorher standen hier vier zur Wahl.

   Sein Kriterium war nicht Wortnaehe, sondern Lesbarkeit: „einen der mir
   sinngemäß widergibt was da steht, wo ich flüssig lesen kann und nicht wie
   18tes jahrhundert klingt und ich die kernaussagen gut verstehe."

   An Sure 67 (30 Verse) gemessen — Haleem gewinnt in jeder Groesse:
     Haleem   3302 Zeichen, Ø Satzlaenge 15,5, 0 altertuemliche Woerter
     Saheeh   3500                        16,1   0   (zieht die arabische
                                                      Wortstellung durch)
     Usmani   3763                        17,3   0   (Klammern, „RaHmān")
     Yusuf Ali 4011                       21,1  21   (hath, thou, thy, ye…)
   Maududi waere der Zweitbeste (16,0), hat aber in Sure 67 VIERZIG
   Fussnotenziffern im laufenden Text und stellenweise schiefes Englisch.

   ⚠️ Der Preis: Haleem schreibt „God" statt „Allah" und „the Lord of Mercy"
   statt „ar-Rahman" — die Entscheidung der Oxford-Ausgabe. Elias kennt sie
   und hat sie in Kauf genommen.

   ⭐ quranEnAusgabe() faellt auf QURAN_EN_AUSGABEN[0] zurueck, wenn die
   gespeicherte id nicht mehr in der Liste steht. Wer vorher Saheeh gewaehlt
   hatte, landet dadurch von selbst hier — ohne kaputten Zustand. */
const QURAN_EN_AUSGABEN = [
  { id: 85, kurz: 'Haleem', name: 'M.A.S. Abdel Haleem' }
];
const QURAN_EN_KEY = 'vt_quranEn';
/* ⚠️ Hoechstens so viele Suren im Zwischenspeicher. Al-Baqarah sind rund
   50 KB, die meisten Suren weit weniger — zwoelf bleiben klar unter dem, was
   localStorage vertraegt, und decken das Lesen von Wochen ab.
   [[localstorage_kann_werfen]] */
const QURAN_EN_MAX = 12;

function quranEnAusgabe(){
  const id = Number(SETTINGS.quranEnAusgabe);
  return QURAN_EN_AUSGABEN.some(a => a.id === id) ? id : QURAN_EN_AUSGABEN[0].id;
}
function quranEnSpeicher(){
  try { const o = LS.get(QURAN_EN_KEY, null); return (o && typeof o === 'object') ? o : {}; }
  catch (e) { return {}; }
}
/** Holt die englischen Verse einer Sure — erst aus dem Zwischenspeicher, sonst
 *  von der API. Gibt ein Array von Strings zurueck (Index 0 = Vers 1) oder
 *  null, wenn nichts zu holen war. */
async function holeQuranEn(sureId){
  const ausgabe = quranEnAusgabe();
  const schluessel = sureId + ':' + ausgabe;
  const speicher = quranEnSpeicher();
  if (Array.isArray(speicher[schluessel])) return speicher[schluessel];
  const verse = [];
  try {
    for (let page = 1; page <= 12; page++){
      const res = await fetch('https://api.quran.com/api/v4/verses/by_chapter/' + sureId
        + '?language=en&translations=' + ausgabe + '&per_page=50&page=' + page);
      if (!res.ok) return null;
      const j = await res.json();
      const teil = j.verses || [];
      teil.forEach(v => {
        const t = (v.translations && v.translations[0] && v.translations[0].text) || '';
        /* ⛔ Fussnotenmarken der API sind HTML (<sup foot_note=…>). Sie stehen
           mitten im Satz und wuerden als Ziffer ohne Bezug erscheinen. */
        verse.push(String(t).replace(/<sup[^>]*>.*?<\/sup>/g, '').trim());
      });
      const gesamt = (j.pagination && j.pagination.total_pages) || 1;
      if (page >= gesamt) break;
    }
  /* `null` heisst „nicht geholt" — der Aufrufer speichert dann nichts, und das
     ist richtig. Gemeldet wird es trotzdem: eine Uebersetzung, die nie
     ankommt, sieht sonst genauso aus wie eine, die es nicht gibt. */
  } catch (e) { stillerFehler('quran.holeQuranEn', e); return null; }
  /* ⛔ Eine leere Antwort NICHT speichern: genau so verhaelt sich eine Ausgabe,
     die die API nicht herausgibt (Status 200, kein Text). Sonst merkte sich
     der Speicher fuer immer, dass es nichts gibt. */
  if (!verse.length || !verse.some(t => t)) return null;
  speicher[schluessel] = verse;
  /* Aeltere Eintraege abraeumen, bevor localStorage wirft. */
  const schluessel_alle = Object.keys(speicher);
  while (schluessel_alle.length > QURAN_EN_MAX) delete speicher[schluessel_alle.shift()];
  try { LS.set(QURAN_EN_KEY, speicher); } catch (e) { /* voll oder privat */ }
  return verse;
}

/** Traegt die englischen Zeilen in die schon gebaute Sure nach. Wird NICHT
 *  abgewartet: der Leser steht sofort, das Englische kommt, wenn es da ist. */
async function zeigeQuranEn(sureId){
  const liste = document.getElementById('verseList');
  if (!liste) return;
  const an = quranUebersetzung() !== 'de';
  if (!an) return;
  const verse = await holeQuranEn(sureId);
  /* ⚠️ Zwischenzeitlich koennte eine andere Sure offen sein. */
  if (OFFENE_SURE !== sureId) return;
  liste.querySelectorAll('.verse-item').forEach(el => {
    const nr = Number(el.dataset.versnr);
    const ziel = el.querySelector('.verse-en');
    if (!ziel) return;
    const t = verse && verse[nr - 1];
    ziel.textContent = t || '';
    /* Ohne Text keine leere Zeile — und ein sichtbarer Hinweis nur, wenn gar
       nichts kam. [[breite_null_ist_kein_layout]] */
    ziel.classList.toggle('leer', !t);
  });
  const nichts = !verse;
  const hinweis = document.getElementById('qaHinweisEn');
  if (hinweis) hinweis.classList.toggle('hidden', !nichts);
}

/** Welche Uebersetzung(en): 'de' (Vorgabe), 'en' oder 'beide'.
 *  ⛔ Vorgabe bleibt 'de' — eine zugeschaltete Ausgabe darf sich nicht selbst
 *  einschalten, sonst findet er seinen Leser nach dem Update nicht wieder.
 *  Dieselbe Ueberlegung wie bei `darstellung` unten. */
function quranUebersetzung(){
  const u = SETTINGS.quranUeb;
  return (u === 'en' || u === 'beide') ? u : 'de';
}

/** Beschriftung des dritten „Anzeigen"-Knopfes, passend zur gewaehlten
 *  Uebersetzung. ⛔ Die Schluessel sind dieselben drei Werte, die
 *  quranUebersetzung() zurueckgibt — kommt dort einer dazu, faellt er hier auf
 *  „Deutsch" zurueck und ist damit sichtbar falsch, nicht still. */
const QURAN_UEB_TITEL = { de: 'Deutsch', en: 'English', beide: 'Deutsch/English' };

/* ⭐ Die Schriftart des Lesers (08.09.2026). Elias mit Bild von
   diegebetszeiten.de: „ich möchte unebdingt diese schriftart haben" — gemessen
   war es KFGQPC Uthmanic Hafs, die Muṣḥaf-Schrift des König-Fahd-Komplexes.

   ⛔ Vorgabe bleibt 'amiri'. Dieselbe Ueberlegung wie bei `darstellung` und
   `uebersetzung`: eine neue Schrift darf sich nicht selbst einschalten. */
const QURAN_SCHRIFTEN = {
  amiri:        "var(--font-ar)",
  uthmani:      "'Uthmanic Hafs', var(--font-ar)",
  scheherazade: "'Scheherazade New', var(--font-ar)"
};
/* ⛔ FEST auf der Muṣḥaf-Schrift seit dem 08.09.2026. Elias: „als schiftart
   kannst du amiri und scheherazade weg machen, aber kannst sie bei dir
   gespeichert lassen damit wir wieder darauf zurück kommen können (so können
   wir uns den ‚schriftarten‘ punkt auch sparen, sollten wir mehr schriftarten
   bekommen können wir den wieder zurück machen)".

   ⭐ Die Tabelle darueber bleibt VOLLSTAENDIG stehen — sie ist das
   Gespeicherte, von dem er spricht. Zum Zurueckbauen: diese Funktion auf die
   alte Fassung zurueckdrehen (auskommentiert darunter) und die Zeile
   `qaZeileSchrift` in index.html wieder freilegen. Zwei Handgriffe.

   ⚠️ Der gespeicherte Wert wird NICHT geloescht. Wer vorher Amiri gewaehlt
   hatte, bekommt jetzt Uthmani — beim Zurueckbauen aber wieder seine alte
   Wahl, statt bei der Vorgabe zu landen. */
function quranSchrift(){
  return 'uthmani';
  /* const w = SETTINGS.quranSchrift;
     return Object.prototype.hasOwnProperty.call(QURAN_SCHRIFTEN, w) ? w : 'amiri'; */
}

/* ============================================================================
   WORTGRENZEN IM VERSTEXT                              (08.09.2026)
   ============================================================================

   Elias: „füge noch die option hinzu wort für wort hervorhebung". Dafür muss
   jedes Wort ein eigenes Element sein — an einem durchgehenden Textknoten
   lässt sich nichts hervorheben.

   ⛔⛔ UNSER TEXT ZÄHLT ANDERS ALS DIE ZEITMARKEN — und das ist der Grund,
   warum hier eine Regel steht und kein schlichtes `split`.

   Gemessen am 08.09.2026 über 1193 Verse aus 15 Suren: bei **235** stimmte
   die Zahl der Leerzeichen-Wörter nicht mit der Zahl der Zeitmarken überein.
   Nebeneinandergelegt zeigte sich immer dasselbe Bild (67:2):

       unser Text   …  أَحْسَنُ · عَمَلً · اۚ · وَهُوَ  …
       quran.com    …  أَحْسَنُ · عَمَلًۭا ۚ  · وَهُوَ  …

   Das Trägeralif der Tanwīn-Fatḥ-Schreibung steht bei uns durch ein
   Leerzeichen getrennt. Orthographisch ist `عَمَلًا` EIN Wort — also wird es
   auch als eines gezählt: endet ein Stück auf Tanwīn Fatḥ und beginnt das
   nächste mit einem Alif, gehören sie zusammen.

   ⭐ Damit passten **1177 von 1193** Versen. Die Regel ist keine Schätzung,
   sondern die Schreibregel selbst.

   ⚠️ Die restlichen 16 weichen in BEIDE Richtungen ab (mal eines zu viel,
   mal eines zu wenig) — dort greift der Rückfall in js/quran-audio.js: passt
   die Zahl nicht, wird der Vers als Ganzes markiert. Ein falsch markiertes
   Wort wäre schlimmer als gar keines. [[ausfall_ist_unsichtbar_gebaut]]

   ⛔ Der Text wird NICHT verändert. Zwei zusammengehörende Stücke teilen sich
   ein Element und behalten ihr Leerzeichen — sonst stünde im Leser ein anderer
   Wortlaut als im Muṣḥaf. [[zitieren_am_original]] */
const QW_TANWIN_FATH = /\u064B[\u0670\u06E1\u06DF]?$/;
const QW_START_ALIF  = /^[\u0627\u0649\u0671]/;

/** Die Wörter eines Verses — als Liste, ohne HTML. Auch von der Prüfung in
 *  js/quran-audio.js benutzt, damit beide dieselbe Zählung sehen.
 *  [[dieselbe_frage_zwei_antworten]] */
function quranWorte(text){
  const roh = String(text || '').trim().split(/\s+/).filter(Boolean);
  const out = [];
  for (const t of roh){
    const v = out.length ? out[out.length - 1] : null;
    if (v && QW_TANWIN_FATH.test(v) && QW_START_ALIF.test(t)) out[out.length - 1] = v + ' ' + t;
    else out.push(t);
  }
  return out;
}

/** Derselbe Text, jedes Wort in einem `<span>`. Die Nummer ist 1-basiert und
 *  entspricht der Nummer der Zeitmarke.
 *  ⚠️ Die Spans stehen IMMER im Markup, auch wenn wortweises Mitlesen aus ist —
 *  dasselbe Prinzip wie bei `.verse-en` und `.ayah-schluss`: ein DOM für alle
 *  Ansichten, und das Umschalten braucht keinen Neuaufbau. */
function quranWortSpans(text){
  return quranWorte(text)
    .map((w, i) => '<span class="qw" data-w="' + (i + 1) + '">' + w + '</span>')
    .join(' ');
}

function quranAnsicht(){
  return {
    modus: SETTINGS.quranModus || 'beide',
    uebersetzung: quranUebersetzung(),
    enAusgabe: quranEnAusgabe(),
    schrift: quranSchrift(),
    /* Elias' Punkt 6 vom 10.08.2026. Vorgabe ist die BISHERIGE Ansicht: eine
       neue Darstellung darf sich nicht selbst einschalten, sonst findet er
       seinen Leser nach dem Update nicht wieder. */
    darstellung: SETTINGS.quranDarstellung || 'kaesten',
    ar: Number(SETTINGS.quranAr) || 100,
    de: Number(SETTINGS.quranDe) || 100
  };
}

/* ---------- Seitengrenzen des Muṣḥaf ----------
   QURAN_SEITEN[n] = [sure, ayah] = wo Seite n+1 anfaengt (604 Paare, erzeugt
   und geprueft von werkzeuge/seiten-holen.mjs). Fehlt die Datei - etwa weil
   ein alter Cache sie noch nicht hat -, gibt es einfach keine Trennlinien
   statt eines Fehlers: der Leser funktioniert ohne sie vollstaendig. */
/* ---------- ⭐⭐ DER JUZ-RING (14.09.2026) ----------------------------------

   Elias' Ziel, im Wortlaut: „ich habe ein ziel und das ist einen juz insgesamt
   aus dem koran zu können. ein juz sind ja so 20 seiten insgesamt. ich finde
   es sollte angezeigt werden wie weit ich innerhalb eines juzs bin. weil ich
   will auch suren lernen außerhalb von juz 30 und wenn die dann nicht
   mitzählen dann wäre das ja schlecht."

   ⛔ NICHT Juz 30, sondern EIN Juz an Menge — egal aus welchem Teil.

   ⛔⛔ UND NICHT IN VERSEN. Gemessen am 14.09.2026: Juz 1 hat 293 Verse,
   Juz 30 hat 564, weil die Verse dort viel kuerzer sind. Wer in Versen zaehlt,
   bekommt fuer dieselbe Muehe je nach Sure das Doppelte angezeigt.

   Gerechnet wird in SEITEN des Muṣḥaf — das traditionelle Mass und Elias'
   eigenes. Ein Juz sind 604 ÷ 30 = 20,13 Seiten. Steht nur ein Teil einer
   Seite, zaehlt der Anteil nach TEXTMENGE, nicht nach Verszahl: auch das war
   ein Messfehler auf dem Weg hierher (59,3 % gegen 39,4 %, weil zwanzig kurze
   Verse einer Seite in Juz 30 sonst so viel wogen wie zwanzig lange).
   [[naechstliegender_wert_ist_nicht_zuverlaessigster]]

   ⚠️ Juz 30 bleibt in Seiten etwas „teurer": dort stehen 455 Zeichen je Seite
   statt 577 im Schnitt (Basmala und Surenueberschriften). Das ist richtig so —
   zweiundzwanzig kurze Suren sind mehr Arbeit als ein gleichlanger Abschnitt
   am Stueck. */
let JUZ_TABELLE = null;

/* Seite → { zeichen, verse:[{k, z}] }. Einmal gebaut, dann gemerkt: 6236
   Verse durchzugehen kostet Millisekunden, aber nicht bei jedem Zeichnen. */
function juzTabelle(){
  if (JUZ_TABELLE) return JUZ_TABELLE;
  if (typeof QURAN_VERSZEICHEN === 'undefined' || typeof SURAH_DATA === 'undefined') return null;
  const t = new Map();
  for (const s of SURAH_DATA){
    const zahlen = QURAN_VERSZEICHEN[s.id] || [];
    for (let v = 1; v <= s.verses; v++){
      const seite = seiteVon(s.id, v);
      if (!seite) continue;
      let e = t.get(seite);
      if (!e){ e = { zeichen: 0, verse: [] }; t.set(seite, e); }
      const z = Number(zahlen[v - 1]) || 0;
      e.zeichen += z;
      e.verse.push({ s: s.id, v, z });
    }
  }
  JUZ_TABELLE = t;
  return t;
}

/* ⛔ Nach jeder Aenderung am Hifz-Stand aufrufen — sonst steht der Ring still.
   Die Tabelle selbst bleibt, nur der gerechnete Stand faellt weg. */
function juzStandNeu(){ JUZ_STAND = null; renderJuzRing(); }
let JUZ_STAND = null;

/* Zeichnet den Ring in die Kopfzeile des Lesers.
   ⛔ Verborgen, solange nichts abgehakt ist: ein leerer Ring mit „0 %" ist
   keine Auskunft, sondern ein Vorwurf. Er erscheint mit dem ersten Vers. */
function renderJuzRing(){
  const knopf = document.getElementById('juzRing');
  if (!knopf) return;
  const s = juzStand();
  if (!s || s.seiten <= 0){ knopf.hidden = true; return; }

  const anteil = Math.min(s.anteil, 1);
  /* Vorschuss 10 % — Elias' Vorgabe vom 14.09.2026 für alle Fortschritts-
     anzeigen: „lasse die ringe nicht bei 0 anfangen sondern lass sie schon
     etwas ausfüllen". Ein erreichtes Ziel zeigt trotzdem exakt voll. */
  const laenge = anteil >= 1 ? 100 : Math.round((0.10 + 0.90 * anteil) * 1000) / 10;
  const proz = Math.round(anteil * 100);
  const offen = Math.max(0, s.einJuz - s.seiten);

  knopf.hidden = false;
  knopf.classList.toggle('voll', anteil >= 1);
  knopf.title = s.seiten.toFixed(1).replace('.', ',') + ' von '
    + s.einJuz.toFixed(1).replace('.', ',') + ' Seiten auswendig — noch '
    + offen.toFixed(1).replace('.', ',') + ' Seiten bis zu einem ganzen Juz';
  knopf.setAttribute('aria-label', proz + ' Prozent eines Juz auswendig');
  knopf.innerHTML =
    '<svg viewBox="0 0 40 40" aria-hidden="true">'
    + '<circle class="spur" cx="20" cy="20" r="15.9155"></circle>'
    + '<circle class="fuell" cx="20" cy="20" r="15.9155" pathLength="100"'
    + ' stroke-dasharray="' + laenge + ' 100"></circle></svg>'
    + '<span>' + proz + ' %</span>';
}

function juzStand(){
  if (JUZ_STAND) return JUZ_STAND;
  const t = juzTabelle();
  if (!t) return null;
  let seiten = 0, ganze = 0, teile = 0;
  for (const [, e] of t){
    if (!e.zeichen) continue;
    let kann = 0;
    for (const x of e.verse)
      if (HIFZ[x.s] || HIFZ_VERSE[x.s + ':' + x.v]) kann += x.z;
    if (!kann) continue;
    const anteil = kann / e.zeichen;
    seiten += anteil;
    if (anteil >= 0.999) ganze++; else teile++;
  }
  const einJuz = (typeof QURAN_SEITEN !== 'undefined' ? QURAN_SEITEN.length : 604) / 30;
  JUZ_STAND = { seiten, einJuz, anteil: einJuz ? seiten / einJuz : 0, ganze, teile };
  return JUZ_STAND;
}

function seiteVon(sure, ayah){
  if (typeof QURAN_SEITEN === 'undefined' || !Array.isArray(QURAN_SEITEN)) return 0;
  /* Rueckwaerts suchen: die gesuchte Seite ist die letzte, die nicht hinter
     (sure, ayah) anfaengt. Bei 604 Eintraegen ist das billig genug, um ohne
     Zwischenspeicher auszukommen. */
  for (let i = QURAN_SEITEN.length - 1; i >= 0; i--){
    const [s, a] = QURAN_SEITEN[i];
    if (s < sure || (s === sure && a <= ayah)) return i + 1;
  }
  return 1;
}

/* ---------- Das Versschlusszeichen ۝ ----------
   U+06DD ist als "END OF AYAH" definiert und legt die FOLGENDEN Ziffern in
   sein Inneres - aber nur, wenn die Schrift das kann. Ob sie es kann, wird
   gemessen und nicht angenommen, genau wie bei der Bismillah-Ligatur:
   liegen die Ziffern drin, aendert sich die Breite kaum; stehen sie daneben,
   waechst sie um deren volle Breite. Faellt die Probe negativ aus, kommt ein
   gezeichneter Kreis mit der Nummer darin (.ayah-schluss.ersatz) - das ist
   ein Ersatz fuer die DARSTELLUNG, keine erfundene Schreibung. */
/* ⛔⛔ JE SCHRIFT, nicht einmal fuer immer (08.09.2026).

   Die Antwort haengt an der SCHRIFT, und die ist seit heute umschaltbar. Ein
   einzelner Zwischenspeicher hiess: gemessen wurde einmal, danach galt das
   Ergebnis auch fuer jede andere Schrift.

   Elias sah es sofort — „es sind jetzt zwei punkte da": nach dem Wechsel auf
   Uthmanic Hafs standen ۝ und die Ziffer als ZWEI Zeichen nebeneinander,
   statt der Ziffer im Zeichen. */
const AYAH_ZEICHEN = {};
function hatAyahZeichen(){
  /* ⛔ Die Frage lautet „legt DIESE Schrift die Ziffern ins Zeichen?" — also
     gehoert die eingestellte Schrift in die Messung, nicht `--font-ar`. Vorher
     stand dort fest `var(--font-ar)`: gemessen wurde immer Amiri, angezeigt
     aber die gewaehlte. Eine Pruefung, die einen Stellvertreter befragt.
     [[pruefung_fragt_einen_stellvertreter_ab]] */
  /* ⛔ Gemessen wird die Schrift, in der das Zeichen WIRKLICH gesetzt ist —
     und das ist seit dem 08.09.2026 wieder fest `--font-ar`, nicht die
     gewaehlte Leseschrift (siehe .ayah-schluss in index.html). Der Schluessel
     bleibt trotzdem je Schrift: faellt die Bindung eines Tages weg, misst diese
     Funktion sofort richtig weiter, statt eine alte Antwort zu behalten. */
  const schrift = 'font-ar';
  if (AYAH_ZEICHEN[schrift] !== undefined) return AYAH_ZEICHEN[schrift];
  const fam = 'var(--font-ar)';
  const miss = (t) => {
    const s = document.createElement('span');
    s.textContent = t;
    s.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font-size:100px;font-family:' + fam + ';';
    document.body.appendChild(s);
    const b = s.getBoundingClientRect().width;
    s.remove();
    return b;
  };
  const ohne = miss('۝');
  const mit  = miss('۝١٢٣');   // ۝ + ١٢٣
  /* ⚠️ Solange die Schrift noch laedt, misst man den Fallback. Ein `ohne` von
     0 heisst „noch nichts da" — dann NICHT merken, sonst steht die falsche
     Antwort fuer den Rest der Sitzung fest. [[breite_null_ist_kein_layout]] */
  if (!ohne) return true;
  AYAH_ZEICHEN[schrift] = mit / ohne < 1.25;
  return AYAH_ZEICHEN[schrift];
}
function arabischeZiffern(n){
  return String(n).replace(/\d/g, d => String.fromCharCode(0x0660 + Number(d)));
}
function ayahSchlussHtml(sure, nr){
  const marke = `data-versmerk="${sure}:${nr}"`;
  const label = `aria-label="Vers ${nr} als auswendig markieren"`;
  if (hatAyahZeichen())
    return `<button class="ayah-schluss" ${marke} ${label}>۝${arabischeZiffern(nr)}</button>`;
  return `<button class="ayah-schluss ersatz" ${marke} ${label}>${nr}</button>`;
}

function wendeQuranAnsichtAn(){
  const a = quranAnsicht();
  const wurzel = document.documentElement;
  wurzel.style.setProperty('--quran-ar', (a.ar / 100).toFixed(2));
  wurzel.style.setProperty('--quran-de', (a.de / 100).toFixed(2));

  const liste = document.getElementById('verseList');
  liste.classList.toggle('nur-ar', a.modus === 'ar');
  liste.classList.toggle('nur-de', a.modus === 'de');
  /* Der Listenmodus ist reines CSS - die Zusatzelemente stehen ohnehin im
     Markup. Deshalb kein renderVerses() hier: Umschalten kostet nichts, und
     der Lesestand bleibt genau da, wo er war. */
  liste.classList.toggle('liste', a.darstellung === 'liste');
  /* ⭐ Die Uebersetzungswahl: 'de' | 'en' | 'beide'. Zwei Klassen statt einer,
     weil beide Zeilen unabhaengig voneinander verschwinden koennen. */
  /* ⚠️ Auf dem SCREEN, nicht auf documentElement: die Schrift gilt nur im
     Leser. Die Karteikarten und der Satzmodus behalten Amiri — dort geht es um
     Lernwoerter, nicht um den Muṣḥaf-Satz. */
  const screenQ = document.getElementById('screen-quranfull');
  if (screenQ) screenQ.style.setProperty('--quran-font', QURAN_SCHRIFTEN[a.schrift]);
  liste.classList.toggle('ohne-de', a.uebersetzung === 'en');
  liste.classList.toggle('ohne-en', a.uebersetzung === 'de');

  /* ⚠️ Die Basmala-Ligatur muss nach JEDER Groessenaenderung neu eingepasst
     werden, nicht nur beim Aufbau der Sure. Bei 300 % lief sie sonst ueber den
     Rand hinaus - nachgemessen, nachdem die Obergrenze auf 300 stand.
     Sie waechst dadurch nur bis zur Bildschirmbreite mit; breiter geht nicht,
     weil ein einzelnes Zeichen nicht umbrechen kann. */
  passeBasmalaAn();

  document.querySelectorAll('[data-quranmodus]').forEach(b =>
    b.classList.toggle('active', b.dataset.quranmodus === a.modus));
  document.querySelectorAll('[data-qurandarstellung]').forEach(b =>
    b.classList.toggle('active', b.dataset.qurandarstellung === a.darstellung));
  document.querySelectorAll('[data-quranueb]').forEach(b =>
    b.classList.toggle('active', b.dataset.quranueb === a.uebersetzung));
  /* ⭐ Der dritte Knopf unter „Anzeigen" heisst nicht mehr fest „Deutsch".
     Er schaltet die UEBERSETZUNGSzeile ein — welche das ist, entscheidet die
     Zeile „Uebersetzung" darunter. Elias: „ich glaube da sollte bei deutsch so
     deutsch/englisch stehen". [[widerspruch_liegt_in_der_beschriftung]] */
  const knopfUeb = document.getElementById('qaModusUeb');
  if (knopfUeb) knopfUeb.textContent = QURAN_UEB_TITEL[a.uebersetzung] || 'Deutsch';
  document.querySelectorAll('[data-quranschrift]').forEach(b =>
    b.classList.toggle('active', b.dataset.quranschrift === a.schrift));
  document.querySelectorAll('[data-quranenausgabe]').forEach(b =>
    b.classList.toggle('active', Number(b.dataset.quranenausgabe) === a.enAusgabe));
  /* Die Wahl der englischen Ausgabe hat nur Sinn, wenn Englisch ueberhaupt
     angezeigt wird — sonst waere es eine Einstellung, die ins Leere wirkt. */
  const zeileEn = document.getElementById('qaZeileEnAusgabe');
  if (zeileEn) zeileEn.classList.toggle('hidden', a.uebersetzung === 'de');
  /* ---------- Rezitation (08.09.2026) ----------
     ⛔ Alles hier ist gegen `typeof` abgesichert: js/quran-audio.js wird NACH
     dieser Datei geladen. Beim ersten Aufruf aus einem Ereignis steht es
     laengst bereit — aber eine Reihenfolge, auf die man sich verlaesst, ohne
     sie zu pruefen, ist genau die Sorte Annahme, die spaeter still bricht. */
  const rezAn = (typeof quranRezitationAn === 'function') && quranRezitationAn();
  document.querySelectorAll('[data-quranrezitation]').forEach(b =>
    b.classList.toggle('active', (b.dataset.quranrezitation === 'an') === rezAn));
  const versMarke = (typeof quranMitleseVers === 'function') ? quranMitleseVers() : true;
  const wortMarke = (typeof quranMitleseWort === 'function') ? quranMitleseWort() : false;
  document.querySelectorAll('[data-quranmitlesevers]').forEach(b =>
    b.classList.toggle('active', (b.dataset.quranmitlesevers === 'an') === versMarke));
  document.querySelectorAll('[data-quranmitlesewort]').forEach(b =>
    b.classList.toggle('active', (b.dataset.quranmitlesewort === 'an') === wortMarke));
  const verfolgt = (typeof quranVerfolgen === 'function') ? quranVerfolgen() : true;
  document.querySelectorAll('[data-quranverfolgen]').forEach(b =>
    b.classList.toggle('active', (b.dataset.quranverfolgen === 'an') === verfolgt));
  /* Rezitator und Mitlesen haben nur Sinn, wenn die Rezitation an ist —
     dieselbe Regel wie bei der englischen Ausgabe eine Zeile hoeher. */
  ['qaZeileRezitator', 'qaZeileMitlesen', 'qaZeileMitleseWort', 'qaZeileVerfolgen'].forEach(id => {
    const z = document.getElementById(id);
    if (z) z.classList.toggle('hidden', !rezAn);
  });
  const rezWahl = document.getElementById('quranRezitatorWahl');
  if (rezWahl && typeof quranRezitator === 'function') rezWahl.value = String(quranRezitator());
  if (typeof zeigeSpieler === 'function') zeigeSpieler();
  document.getElementById('qaWertAr').textContent = a.ar + ' %';
  document.getElementById('qaWertDe').textContent = a.de + ' %';
  /* Was gerade nicht angezeigt wird, laesst sich auch nicht sinnvoll groesser
     stellen - die Zeile verschwindet, statt ins Leere zu wirken.
     Im Listenmodus laeuft nur Arabisch durch, also faellt die Deutsch-Zeile
     dort ebenfalls weg - und der Hinweis daneben sagt, warum. */
  const nurListe = a.darstellung === 'liste';
  /* ⛔ Hier wurde der Hinweis „Im Listenmodus läuft nur der arabische Text
     durch …" ein- und ausgeblendet. Der Satz ist weg (Elias, 20.09.2026: „die
     zwei texte können weg") — und mit ihm das Element; ein getElementById
     darauf würfe hier und risse die ganze Ansicht mit. */
  document.getElementById('qaZeileAr').classList.toggle('hidden', a.modus === 'de' && !nurListe);
  document.getElementById('qaZeileDe').classList.toggle('hidden', a.modus === 'ar' || nurListe);
  document.getElementById('qaZeileModus').classList.toggle('hidden', nurListe);
  /* ⛔ Auch die Zeile „Übersetzung" fällt im Listenmodus weg. Elias am
     20.09.2026, 02:43, mit Bild (die Zeile rot umrandet, Darstellung „Liste"):
     „außerdem will ich beim listenmodus gar nciht die option sehen von
     übersetzung weil sie sowieso nciht da ist in liste." Dieselbe Regel wie
     bei den Zeilen darüber: was gerade nicht angezeigt wird, lässt sich auch
     nicht einstellen. Die Wahl selbst bleibt gespeichert und gilt wieder,
     sobald er auf „Kästchen" wechselt. */
  const zeileUeb = document.getElementById('qaZeileUeb');
  if (zeileUeb) zeileUeb.classList.toggle('hidden', nurListe);
  document.querySelectorAll('[data-qurangroesse]').forEach(b=>{
    const [feld, richtung] = b.dataset.qurangroesse.split(':');
    const wert = feld === 'ar' ? a.ar : a.de;
    b.disabled = Number(richtung) < 0 ? wert <= QURAN_MIN : wert >= QURAN_MAX;
  });
}

/* Der Kasten haengt am Fenster, nicht in der Seite - siehe .quran-ansicht in
   index.html. Deshalb braucht er beim Oeffnen seine Lage: unter die Kopfzeile,
   ueber die Breite der Inhaltsspalte. Beides wird GEMESSEN, weil die Kopfzeile
   je nach Schriftgroesse unterschiedlich hoch ist und die Spalte auf dem Handy
   randbreit, auf dem Desktop 600 px breit ist.
   `ohneSprung` ist hier nicht mehr noetig: ein Kasten am Fenster nimmt der
   Seite keine Hoehe weg, also kann auch nichts mehr rutschen. */
function lageQuranAnsicht(){
  const feld = document.getElementById('quranAnsicht');
  const kopf = document.querySelector('#screen-quranfull .screen-header');
  const spalte = document.getElementById('screen-quranfull');
  if (!feld || !kopf || !spalte) return;
  const k = kopf.getBoundingClientRect(), s = spalte.getBoundingClientRect();
  feld.style.top = Math.round(k.bottom) + 'px';
  feld.style.left = Math.round(s.left) + 'px';
  feld.style.width = Math.round(s.width) + 'px';
}
function schliesseQuranAnsicht(){
  const feld = document.getElementById('quranAnsicht');
  if (feld.classList.contains('hidden')) return;
  feld.classList.add('hidden');
  document.getElementById('btnQuranAnsicht').setAttribute('aria-expanded', 'false');
  document.removeEventListener('pointerdown', ausserhalbGetippt, true);
}
/* Tippen daneben schliesst. In der Erfassungsphase, damit ein Tipp auf einen
   Vers nicht erst den Vers trifft und dann den Kasten stehen laesst. */
function ausserhalbGetippt(e){
  if (e.target.closest('#quranAnsicht') || e.target.closest('#btnQuranAnsicht')) return;
  schliesseQuranAnsicht();
}
document.getElementById('btnQuranAnsicht').addEventListener('click', ()=>{
  const feld = document.getElementById('quranAnsicht');
  if (!feld.classList.contains('hidden')){ schliesseQuranAnsicht(); return; }
  lageQuranAnsicht();
  feld.classList.remove('hidden');
  document.getElementById('btnQuranAnsicht').setAttribute('aria-expanded', 'true');
  wendeQuranAnsichtAn();
  document.addEventListener('pointerdown', ausserhalbGetippt, true);
});
window.addEventListener('resize', ()=>{
  if (!document.getElementById('quranAnsicht').classList.contains('hidden')) lageQuranAnsicht();
});

document.getElementById('quranModi').addEventListener('click', (e)=>{
  const knopf = e.target.closest('[data-quranmodus]');
  if (!knopf) return;
  SETTINGS.quranModus = knopf.dataset.quranmodus;
  saveSettings();
  wendeQuranAnsichtAn();
});

document.getElementById('quranSchrift')?.addEventListener('click', async (e)=>{
  const knopf = e.target.closest('[data-quranschrift]');
  if (!knopf) return;
  const vorher = (typeof hatAyahZeichen === 'function') ? hatAyahZeichen() : null;
  SETTINGS.quranSchrift = knopf.dataset.quranschrift;
  saveSettings();
  wendeQuranAnsichtAn();
  /* ⛔ Die Schrift muss GELADEN sein, bevor gemessen wird — sonst misst man den
     Fallback und merkt sich dessen Antwort. */
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  const nachher = (typeof hatAyahZeichen === 'function') ? hatAyahZeichen() : null;
  /* ⛔ Aendert sich die Antwort, muss die Sure NEU GEBAUT werden: die
     Entscheidung steckt im Markup jedes Versschlusses (Klasse `ersatz`), und
     CSS allein kommt da nicht heran. Genau das war „es sind jetzt zwei punkte
     da". [[erfolgsmeldung_ohne_wirkung]] */
  if (vorher !== nachher && OFFENE_SURE && typeof openSurah === 'function'){
    /* ⛔ Den Rollstand SELBST merken. `openSurah` kennt genau eine Option,
       `ausHistorie` — nachgesehen, nicht angenommen. Ein erfundenes
       `{ rollstandHalten: true }` waere stillschweigend ignoriert worden, und
       der Leser spraenge nach dem Schriftwechsel an den Anfang der Sure.
       [[kann_ist_nicht_ist]] */
    const roller = document.querySelector('main');
    const stand = roller ? roller.scrollTop : 0;
    await openSurah(OFFENE_SURE);
    if (roller) roller.scrollTop = stand;
  }
  /* ⚠️ Die Basmala ist eine EINZELNE Ligatur, deren Breite an der Schrift
     haengt — nach dem Wechsel muss sie neu eingepasst werden, sonst laeuft sie
     ueber den Rand oder steht zu klein da. */
  passeBasmalaAn();
});
document.getElementById('quranUeb').addEventListener('click', (e)=>{
  const knopf = e.target.closest('[data-quranueb]');
  if (!knopf) return;
  SETTINGS.quranUeb = knopf.dataset.quranueb;
  saveSettings();
  wendeQuranAnsichtAn();
  /* ⛔ Beim EINSCHALTEN muss geholt werden — die Zeilen sind leer, solange
     niemand sie gefuellt hat. Ohne diesen Aufruf schaltet er um und sieht
     nichts, bis er die Sure neu oeffnet. [[werkzeug_ohne_aufrufer]] */
  if (OFFENE_SURE) zeigeQuranEn(OFFENE_SURE);
});
document.getElementById('quranEnAusgabe')?.addEventListener('click', (e)=>{
  const knopf = e.target.closest('[data-quranenausgabe]');
  if (!knopf) return;
  SETTINGS.quranEnAusgabe = Number(knopf.dataset.quranenausgabe);
  saveSettings();
  wendeQuranAnsichtAn();
  /* ⚠️ Andere Ausgabe heisst anderer Zwischenspeicher-Schluessel — der Text
     muss neu geholt werden, sonst steht die alte Ausgabe weiter da. */
  if (OFFENE_SURE) zeigeQuranEn(OFFENE_SURE);
});
document.getElementById('quranDarstellung').addEventListener('click', (e)=>{
  const knopf = e.target.closest('[data-qurandarstellung]');
  if (!knopf) return;
  SETTINGS.quranDarstellung = knopf.dataset.qurandarstellung;
  saveSettings();
  /* ⚠️ Nicht `ohneSprung`: das gleicht eine Hoehenaenderung OBERHALB der Liste
     aus. Hier aendert sich die Hoehe der Liste SELBST — im Listenmodus fliesst
     der Text und ist um ein Vielfaches kuerzer. Ein Pixelausgleich ginge
     zwangslaeufig daneben, die Ayah dagegen stimmt in beiden Darstellungen. */
  ohneStellenverlust(wendeQuranAnsichtAn);
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
/* ---------- Rollstand der Surenliste (Elias, 04.08.2026 abends) ----------

   "wenn ich jetzt aus der sura raus gehe dann lande ich zwar bei der sura
   liste, jedoch ganz oben am anfang. ich will eigentlich da wieder raus kommen
   wo ich davor war."

   Die Liste wird beim Zurueckgehen neu gebaut, und ein neu gebauter Kasten
   steht oben. Bei 114 Zeilen heisst das: wer eine der kurzen Suren hinten
   angesehen hat, rollt jedes Mal wieder den ganzen Weg.

   ⚠️ `scrollTo({behavior:'instant'})` und nicht `scrollTop = x`: #main traegt
   `scroll-behavior:smooth`, und das gilt auch fuer eine Zuweisung an
   scrollTop - die Liste faehrt dann sichtbar von oben nach unten, statt
   einfach dort zu stehen. Derselbe Fallstrick wie beim Ayah-Sprung. */
let LISTEN_ROLLSTAND = 0;
function merkeListenRollstand(){
  /* Nur wenn die LISTE zu sehen ist. Beim Blaettern von Sure zu Sure steht in
     scrollTop die Stelle im Verstext - die hier zu merken hiesse, die Liste
     spaeter an einer voellig fremden Stelle aufzuschlagen. */
  if (OFFENE_SURE !== null) return;
  const kasten = document.getElementById('main');
  if (kasten) LISTEN_ROLLSTAND = kasten.scrollTop;
}
/* ⚠️ Hier stand `if (!kasten || !LISTEN_ROLLSTAND) return;` - und genau die
   Null war der Fehler, den Elias am 04.08.2026 gemeldet hat: "wenn ich bei den
   oberen suren rein gehe also so alle favorieten und die ersten zehn suren so.
   wenn ich da raus gehe aus der sura dann gelange ich zurück zu ungefähr der
   15ten sura obwohl ich eigentlich in der liste davor ganz oben war."

   Rollstand 0 ist ein GUELTIGER Stand - "ganz oben" -, aber `!0` ist wahr, also
   wurde ausgerechnet dann nicht zurueckgesprungen. Und weil Liste und Verstext
   sich denselben Rollkasten teilen, blieb dann die Stelle stehen, an der man im
   Verstext war: gemessen im Browser (375x812) 471 px statt 0, also mitten in der
   Liste bei Sure 3 statt bei Sure 1.

   Das erklaert auch, warum es "irgendwie nur manchmal" auftrat: bei einem
   Rollstand ungleich null greift der Sprung, gemessen 4000 -> 4000 (Sure 112 aus
   der Liste bei 4000 geoeffnet, im Verstext ans Ende gerollt, zurueck). Kaputt
   war ausschliesslich der Weg von ganz oben - also Favoriten und die ersten
   Suren, genau die, die er nennt. */
function stelleListenRollstandHer(){
  const kasten = document.getElementById('main');
  if (!kasten) return;
  kasten.scrollTo({ top: LISTEN_ROLLSTAND, behavior: 'instant' });
}
/* ⚠️ Gegenstueck, und es ist Pflicht, nicht Kosmetik. Der Rollkasten ist fuer
   Liste und Verse DERSELBE - beim Umschalten bleibt sein scrollTop stehen. Wer
   also weit unten in der Liste eine Sure oeffnet, steht sofort mitten in ihr
   drin, weil der Verstext viel laenger ist als die Liste.
   Das ist am 04.08.2026 abends genau so passiert: das Merken des Rollstands
   hat den Fehler nicht erzeugt, aber sichtbar gemacht - vorher wurde der Wert
   beim Wechsel meist auf eine kleine Zahl beschnitten. Elias: "dann komme ich
   immer automatisch ans ende jeder sura". */
function anDenAnfang(){
  const kasten = document.getElementById('main');
  if (kasten) kasten.scrollTo({ top: 0, behavior: 'instant' });
}

/* ---------- Kopf einklappen beim Weiterlesen (Elias' Punkt 1, 10.08.2026) ----

   „Ich will das dieser Bereich sich ein klappt wenn ich nach unten weiter lese
   und nach unten scrolle, wenn ich aber hoch scrolle und nach oben gehe dann
   soll sich das wieder öffnen und runter kommen."

   Gemessen wird die RICHTUNG, nicht die Stelle. Deshalb steht hier kein
   Vergleich gegen eine feste Hoehe, sondern ein Weg seit dem letzten
   Richtungswechsel: KOPF_STAND wird bei jedem Umschalten neu gesetzt, und erst
   ein Weg von KOPF_SCHWELLE in die andere Richtung schaltet zurueck. Ohne diese
   Schwelle wuerde die Leiste bei jedem Zittern des Daumens auf- und zuklappen.

   ⚠️ Nur in der geoeffneten Sure. In der Surenliste bleibt der Kopf stehen —
   Elias' Bild zeigt den Leser, und in der Liste ist die Ḥifẓ-Zeile ohnehin
   leer. Faellt ihm das spaeter auf, ist es die Zeile `OFFENE_SURE === null`.

   ⚠️ Ganz oben wird immer ausgeklappt. Sonst gaebe es einen Zustand, aus dem
   man die Leiste nicht mehr hervorholen kann: bei scrollTop 0 laesst sich nicht
   weiter nach oben rollen, also kaeme nie ein Aufwaerts-Weg zustande. */
/* ⭐ Zwei verschiedene Schwellen seit dem 18.08.2026. Elias: „ebenfalls möchte
   ich, dass wenn ich im quran hoch scrolle und diese leiste wieder erscheint,
   das es ein kleinen ticken länger dauert bis diese leiste erscheint. bedeutet
   ich kann ein klein wenig länger hoch scrollen und erst dann soll diese leiste
   auftauchen."

   Vorher war beides derselbe Wert (24 px), und das war der Fehler: die zwei
   Richtungen sind nicht gleich wichtig. Nach UNTEN soll die Leiste schnell weg,
   sie stört beim Lesen. Nach OBEN darf sie sich Zeit lassen — wer ein Stück
   zurückrollt, um ein Wort noch einmal zu sehen, will nicht sofort die halbe
   Ansicht zugestellt bekommen. */
const KOPF_SCHWELLE     = 24;   /* px Weg nach unten, bevor eingeklappt wird */
const KOPF_SCHWELLE_AUF = 110;  /* px Weg nach oben, bevor sie wieder erscheint */
const KOPF_RUHE     = 64;   /* px von oben, in denen immer ausgeklappt ist */
let   KOPF_STAND    = 0;    /* scrollTop beim letzten Umschalten */
let   KOPF_EIN      = false;/* ist gerade eingeklappt? */

function setzeKopf(einklappen){
  if (einklappen === KOPF_EIN) return;
  KOPF_EIN = einklappen;
  const screen = document.getElementById('screen-quranfull');
  if (screen) screen.classList.toggle('kopf-eingeklappt', einklappen);
}

function pruefeLeseRichtung(){
  if (OFFENE_SURE === null){ setzeKopf(false); return; }
  const kasten = document.getElementById('main');
  if (!kasten) return;
  const y = kasten.scrollTop;
  /* Ueberrollen (das Gummiband auf iOS) liefert Werte ausserhalb des Bereichs.
     Das ist keine Lesegeste, sondern das Ende der Liste - sonst klappt die
     Leiste am Sure-Ende von selbst zu und beim Zurueckfedern wieder auf. */
  const max = kasten.scrollHeight - kasten.clientHeight;
  if (y < 0 || y > max) return;

  if (y <= KOPF_RUHE){ KOPF_STAND = y; setzeKopf(false); return; }

  const weg = y - KOPF_STAND;
  if (weg > KOPF_SCHWELLE){ setzeKopf(true);  KOPF_STAND = y; }
  else if (weg < -KOPF_SCHWELLE_AUF){ setzeKopf(false); KOPF_STAND = y; }
}

/* Beim Betreten und Verlassen einer Sure aufklappen und den Weg zuruecksetzen.
   Ohne das stuende man nach einem Sprung mitten im Text mit weggefahrener
   Leiste da, ohne zu wissen, in welcher Sure man ist. */
function kopfZuruecksetzen(){
  KOPF_STAND = 0;
  setzeKopf(false);
}

/* ---------- Aenderungen oberhalb der Liste, ohne dass sie springt ----------

   Elias am 04.08.2026 abends: "wenn ich eine sura als favoriert auswaehle dann
   springt die liste so zwei suren nach unten, beim auswendig lernen button in
   gruen ist das nicht so. es soll nichts runter springen." Dasselbe beim
   Einstellungs-Menue.

   Der Unterschied erklaert den Fehler: der Hifz-Haken aendert nur eine Farbe,
   der Favoriten-Stern baut den Favoritenblock OBERHALB der Liste neu, und das
   Einstellungs-Menue klappt ebenfalls oberhalb auf. Beide aendern die Hoehe
   ueber der Liste, also rutscht alles darunter - die Zeile, die man gerade
   angetippt hat, ist danach eine andere.

   Statt jede dieser Hoehen einzeln auszurechnen, wird der Versatz GEMESSEN:
   Position eines Ankers vor und nach der Aenderung, Differenz auf den
   Rollstand. Das stimmt auch dann, wenn sich Aussenabstaende oder die Anzahl
   der Zeilen im Block aendern - Werte, die man sonst von Hand nachpflegen
   muesste und die beim naechsten CSS-Umbau falsch waeren. */
function ohneSprung(aendern){
  const kasten = document.getElementById('main');
  const anker = [document.getElementById('surahList'), document.getElementById('verseList')]
    .find(e => e && !e.classList.contains('hidden'));
  if (!kasten || !anker){ aendern(); return; }
  const vor = anker.getBoundingClientRect().top;
  aendern();
  const versatz = anker.getBoundingClientRect().top - vor;
  /* Unter einem halben Pixel lohnt der Eingriff nicht und wuerde nur runden. */
  if (Math.abs(versatz) > 0.5){
    kasten.scrollTo({ top: Math.max(0, kasten.scrollTop + versatz), behavior: 'instant' });
  }
}

/* ---------- Die Stelle behalten (Elias' drei Meldungen vom 10.08.2026) -------

   „wenn ich von liste und kästchen wechsel dann komme ich nicht zur gleichen
    ayah zurück wie ich davor war" · „wenn ich die allgemeinen einstellungen
    öffne während ich lese dann komme ich immer wieder an den anfang der sura,
    das will ich auch nicht."

   Beides ist dieselbe Aufgabe: eine Stelle merken, die sich NICHT in Pixeln
   ausdruecken laesst. Der Rollstand taugt dafuer nicht — beim Wechsel der
   Darstellung aendert sich die ganze Hoehe des Textes, und nach einem
   Bildschirmwechsel wird die Sure neu aufgebaut. Gemerkt wird deshalb die
   AYAH, nicht die Pixelzahl. Sie steht ohnehin schon zur Verfuegung:
   `LESE_SICHTBAR` fuehrt der IntersectionObserver mit.

   ⚠️ `scrollIntoView` mit `block:'start'` schoebe den Vers unter die
   angeheftete Kopfleiste. Deshalb wird die Hoehe des Kopfes GEMESSEN und
   abgezogen, statt eine Zahl zu raten — der Kopf ist je nach Schriftgroesse
   und Einklappzustand verschieden hoch. */
function sichtbarerVers(){
  if (LESE_SICHTBAR && LESE_SICHTBAR.size) return Math.min(...LESE_SICHTBAR);
  if (LESESTAND && LESESTAND.sure === OFFENE_SURE) return LESESTAND.vers;
  return null;
}

function zeigeVers(nr){
  if (!nr) return false;
  const kasten = document.getElementById('main');
  const ziel = document.querySelector(`#verseList .verse-item[data-versnr="${nr}"]`);
  if (!kasten || !ziel) return false;
  const kopf = document.querySelector('#screen-quranfull .quran-sticky');
  const kopfHoehe = kopf ? kopf.getBoundingClientRect().height : 0;
  const versatz = ziel.getBoundingClientRect().top - kasten.getBoundingClientRect().top;
  kasten.scrollTo({ top: Math.max(0, kasten.scrollTop + versatz - kopfHoehe - 8),
                    behavior: 'instant' });
  return true;
}

/* ---------- Rueckkehr an die Lesestelle: einmal springen reicht nicht ----------

   Beim Zurueckkommen aus einem anderen Bildschirm wird die ganze Sure neu
   aufgebaut, und der Inhalt UEBER dem Ziel waechst noch, waehrend schon
   gesprungen wird - die Verse werden hoeher, sobald die arabische Schrift
   steht. Derselbe Grund wie bei hebeVersHervor() weiter unten.

   Gemessen am 16.08.2026 in Al-Baqarah, Lesestand Ayah 11: beim Zurueckkommen
   aus den Einstellungen landete der Sprung bei Ayah 14, also 502 px zu tief.
   **Derselbe Aufruf von Hand, mit fertigem Layout, traf auf 64 px genau** -
   der Aufruf war also richtig, nur zu frueh.

   ⚠️ Nachgefasst wird nur, wenn der Vers wirklich AUS DEM BILD ist. Sonst risse
   es den Blick weg, falls Elias inzwischen selbst weitergerollt hat. Dieselbe
   Regel wie beim Nachschlag in hebeVersHervor(). */
function zeigeVersNachAufbau(nr){
  if (!zeigeVers(nr)) return false;
  setTimeout(() => {
    if (OFFENE_SURE === null) return;                 // schon wieder weg
    const el = document.querySelector(`#verseList .verse-item[data-versnr="${nr}"]`);
    const kasten = document.getElementById('main');
    if (!el || !kasten) return;
    const k = kasten.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (r.bottom < k.top || r.top > k.bottom) zeigeVers(nr);
  }, 500);
  return true;
}

/* Eine Aenderung durchfuehren und danach dieselbe Ayah wieder zeigen. Der Vers
   wird VOR der Aenderung gelesen — danach kann der Beobachter schon andere
   Werte liefern, weil sich das Layout verschoben hat. */
function ohneStellenverlust(aendern){
  const vorher = sichtbarerVers();
  aendern();
  if (vorher) zeigeVers(vorher);
}

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
  if (!st.suche && feld.value){
    feld.value = '';
    renderSurahList('');
  }
  /* ⚠️ Sonst wird hier NICHT neu gebaut, und genau das ist der Inhalt dieser
     Zeilen. zeigeBildschirm() hat die Liste eben schon gebaut, samt Ruecksprung
     auf den gemerkten Rollstand. Ein zweiter Aufruf faende OFFENE_SURE bereits
     auf null vor - `kamAusSure` waere falsch, und der am 11.08.2026
     dazugekommene else-Zweig in renderSurahList() springt dann nach ganz oben.
     Er wirft also genau die Wiederherstellung weg, die der erste Aufruf gerade
     gemacht hat.

     Im Browser gemessen (16.08.2026, 375x812): Liste auf 4000 gerollt, Sure 47
     geoeffnet, Zurueck-Taste gedrueckt. Erster Aufruf 0 -> 4000, zweiter Aufruf
     4000 -> 0. Elias: "als ich wieder auf meinem handy zurück knopf gedrückt
     habe war ich wieder ganz ganz oben, obwohl ich eigentlich wieder unten raus
     kommen wollte."

     ⚠️ Der Fehler wurde nicht am 04.08. eingebaut, sondern am 11.08.: vorher tat
     der zweite Aufruf nichts Sichtbares, weil renderSurahList() ohne else-Zweig
     den Rollstand einfach stehen liess. Die Suchkorrektur hat die alte
     Wiederherstellung still ueberfahren. */
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
       wenn man gerade weit unten bei den kurzen Suren steht.
       `ohneSprung`, weil der Block OBERHALB der Liste liegt: waechst er, rutscht
       alles darunter nach unten und man hat plaetzlich eine andere Zeile unter
       dem Finger. */
    ohneSprung(()=> renderFavListe(!!document.getElementById('surahSearch').value.trim()));
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
  /* VOR dem Setzen von OFFENE_SURE: danach wuesste merkeListenRollstand nicht
     mehr, dass gerade noch die Liste zu sehen war. */
  merkeListenRollstand();
  OFFENE_SURE = id;
  /* ⛔ HIER, nicht nur beim Laden. Beim ersten Anstrich ist der Leser
     `display:none` und die Titelzeile 0 px hoch — gemessen: der
     ResizeObserver unten allein hat die Variable auf ihrem geratenen
     Startwert 48px stehen lassen. Wer die richtige Stelle sucht, erkennt
     sie an der Wirkung, nicht am Namen. [[endpunkt_der_zuerst_steht]] */
  if (typeof quranKopfHoeheMessen === 'function') quranKopfHoeheMessen();
  /* Eine ANDERE Sure beendet die laufende Rezitation; dieselbe laesst sie
     stehen (etwa beim Zurueckkommen aus den Einstellungen). */
  if (typeof audioSureWechsel === 'function') audioSureWechsel(id);
  /* Eine frisch geoeffnete Sure faengt mit sichtbarem Kopf an, egal wie der
     Stand beim Verlassen der vorigen war. */
  kopfZuruecksetzen();
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
  /* Elias am 04.08.2026 abends, mit Bild: "hier sollte lieber das arabische
     gross sein (bzw die prioritaet) und dann daneben halt das deutsche."
     Also andersherum als zuvor: der arabische Name traegt die Zeile, die
     Umschrift steht klein daneben. Die Nummer bleibt vorn - sie ist die
     Ordnung, nach der er sucht. */
  document.getElementById('quranFullTitle').innerHTML =
    `<span class="qt-nr">${id}.</span>` +
    `<span class="qt-ar" lang="ar" dir="rtl">${escapeHtml(surenTitel(surah))}</span>` +
    `<span class="qt-um">${escapeHtml(surah.name)}</span>`;
  /* ⛔ Zweite Stelle, die auf das entfallene `quranFullIntro` zeigte — sie
     hätte das Öffnen einer Sure genauso stillgelegt wie die Liste. Siehe den
     Kommentar bei renderSurahList(). */
  /* ⭐ Der Juz-Ring gehört zur LISTE, nicht zur offenen Sure. Elias am
     15.09.2026: „man sieht ihn während ich in einer sura bin. er soll nur bei
     der sura liste sein." In der Sure steht im Kopf der Surenname — ein
     Gesamtfortschritt daneben gehört zu einer anderen Frage. */
  const jr = document.getElementById('juzRing');
  if (jr) jr.hidden = true;
  /* Der Lesestrich gehört zur offenen Sure — hier beginnt seine Strecke. */
  leseStrichZeichnen();
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
  /* Zweimal an den Anfang: einmal jetzt, damit schon der Ladeplatzhalter oben
     steht, und einmal nach dem Aufbau - erst dann ist der Kasten so hoch, dass
     ein alter Wert ueberhaupt stehenbleiben koennte.

     ⚠️ AUSSER beim Zurueckkommen aus der Historie. `showScreen()` stellt immer
     die Surenliste her, danach baut `stelleQuranEbeneHer` die offene Sure neu
     auf - fuer die App ist das ein Neuaufbau, fuer Elias nur ein Blick in die
     Einstellungen und zurueck. Er am 10.08.2026: „wenn ich die allgemeinen
     einstellungen öffne während ich lese dann komme ich immer wieder an den
     anfang der sura, das will ich auch nicht."
     Zurueckgesprungen wird auf die AYAH aus dem Lesestand, nicht auf einen
     Pixelwert - der waere nach dem Neuaufbau bedeutungslos. */
  /* ⭐ `opt.vers` (18.09.2026): der Ring „Zufällig" springt an den Anfang
     SEINER Seite. Elias: „wenn ich auf link drücke soll es mich direkt
     dahinbringen". Derselbe Weg wie die Rückkehr an die Lesestelle. */
  const zurueckZu = Number(opt.vers) > 0 ? Number(opt.vers)
    : ((opt.ausHistorie && LESESTAND && LESESTAND.sure === id) ? LESESTAND.vers : null);
  if (!zurueckZu) anDenAnfang();

  if (VERSE_CACHE[id]){
    renderVerses(id);
    if (!zurueckZu || !zeigeVersNachAufbau(zurueckZu)) anDenAnfang();
    return;
  }
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
    if (!zurueckZu || !zeigeVersNachAufbau(zurueckZu)) anDenAnfang();
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
      anDenAnfang();
    }catch(err2){
      vList.innerHTML = `<div class="verse-loading">Verse konnten nicht geladen werden.<br>${err2.message}</div>`;
    }
  }
}

/* ---------- Basmala vor der Sure (Elias, 04.08.2026 abends) ----------

   "und vor jeder sura sollte noch wie bei quran.com die basmala stehen"

   ZWEI AUSNAHMEN, und beide sind belegt, nicht angenommen:
     Sure 1 (Al-Fatiha)  - dort IST die Basmala der erste Vers, sie stuende sonst
                           doppelt da.
     Sure 9 (At-Tawba)   - traegt als einzige Sure gar keine.
   Gegengeprueft an api.quran.com/api/v4/chapters, Feld `bismillah_pre`: genau
   diese beiden stehen auf false, die uebrigen 112 auf true. Das deckt sich mit
   der bekannten Regel - beides musste zusammenpassen, sonst waere hier nichts
   gebaut worden.

   DER TEXT wird nicht getippt, sondern GENOMMEN: es ist woertlich Vers 1:1 aus
   quran-text.js, also aus der Datei, die die App ohnehin ausliefert
   (`node werkzeuge/vers.mjs 1:1`). Damit ist die Schreibung dieselbe wie im
   uebrigen Verstext - Uthmani mit ٱ und ٰ - und kein einziges Vokalzeichen
   stammt von mir.

   ⚠️ Sie steht IM #verseList, aber ohne `.verse-item`: die Basmala ist kein
   Vers dieser Sure, sie darf also weder abhakbar sein noch beim Lesestand oder
   in der Ayah-Liste mitzaehlen. Frueher waere schon ihre blosse Anwesenheit ein
   Fehler gewesen, weil die Ayah-Liste ueber `:nth-of-type` zaehlte und jedes
   zusaetzliche Element alle Nummern verschoben haette. Deshalb im selben Zug
   auf `[data-versnr]` umgestellt - das zaehlt nicht, sondern benennt. */
/* Kann die Schrift die Bismillah-Ligatur U+FDFD (﷽)? Das ist EIN Zeichen, das
   den ganzen Satz als Kalligrafie zeichnet - Elias' Wunsch: "sie soll so schoen
   sein". Es ist kein selbst gemaltes Bild und keine erfundene Schreibung: das
   Zeichen ist in Unicode genau als dieser Satz definiert.

   Geprueft wird es, nicht angenommen. Eine Schrift ohne das Zeichen zeigt ein
   Ersatzkaestchen von etwa einer Buchstabenbreite; die echte Ligatur ist ein
   Vielfaches davon. Gemessen am 04.08.2026 bei 100 px Schriftgroesse:
     Noto Naskh Arabic  1221 px gegen 48,9 px fuer م   -> Faktor 25,0
     Amiri               667 px gegen 33,8 px          -> Faktor 19,7
   Die Schwelle 3 liegt weit von beiden Faellen entfernt.

   Faellt die Pruefung negativ aus, kommt der einfache Verstext - Elias
   ausdruecklich: "das jetzt kannst du als back up plan halten". */
let BISMILLAH_LIGATUR = null;
function hatBismillahLigatur(){
  if (BISMILLAH_LIGATUR !== null) return BISMILLAH_LIGATUR;
  const miss = (t) => {
    const s = document.createElement('span');
    s.textContent = t;
    s.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font-size:100px;font-family:var(--font-ar);';
    document.body.appendChild(s);
    const b = s.getBoundingClientRect().width;
    s.remove();
    return b;
  };
  const einzeln = miss('م');
  BISMILLAH_LIGATUR = einzeln > 0 && miss('﷽') / einzeln > 3;
  return BISMILLAH_LIGATUR;
}

/* Die Ligatur ist rund das Zwoelffache ihrer Schriftgroesse breit und kann
   nicht umbrechen - bei 360 px Fensterbreite lief sie in der ersten Fassung
   442 px breit in einen 316 px breiten Platz. Statt eine Groesse zu raten oder
   sie an vw zu haengen (was auf dem Desktop wieder falsch waere, weil die App
   dort auf 600 px begrenzt ist), wird sie GEMESSEN und eingepasst. */
function passeBasmalaAn(){
  const b = document.querySelector('#verseList .basmala.ligatur');
  if (!b) return;
  b.style.fontSize = '';
  const platz = b.clientWidth;
  const breite = b.scrollWidth;
  if (platz > 0 && breite > platz){
    const jetzt = parseFloat(getComputedStyle(b).fontSize);
    b.style.fontSize = (jetzt * platz / breite * 0.97) + 'px';
  }
}
window.addEventListener('resize', passeBasmalaAn);

function basmalaHtml(id){
  if (id === 1 || id === 9) return '';
  /* Zuerst aus QURAN_TEXT, weil das beim Oeffnen einer Sure ohnehin geladen
     ist - der Zwischenspeicher enthaelt Sure 1 nur, wenn sie schon einmal offen
     war. Faellt beides aus (Rueckfallebene ueber quran.com ohne lokale Datei),
     steht lieber KEINE Basmala da als eine selbst getippte. */
  const text =
    (typeof QURAN_TEXT !== 'undefined' && QURAN_TEXT[1] && QURAN_TEXT[1][0] && QURAN_TEXT[1][0][0]) ||
    (VERSE_CACHE[1] && VERSE_CACHE[1][0] && VERSE_CACHE[1][0].text_uthmani);
  if (!text) return '';
  /* Der belegte Verstext bleibt in beiden Faellen die Grundlage: als Inhalt,
     wenn die Ligatur fehlt, und sonst als Beschriftung fuer die Sprachausgabe -
     ein einzelnes Zeichen vorzulesen ist nicht dasselbe wie der Satz. */
  if (hatBismillahLigatur())
    return `<div class="basmala ligatur" lang="ar" dir="rtl" aria-label="${escapeHtml(text)}">&#xFDFD;</div>`;
  return `<div class="basmala" lang="ar" dir="rtl" aria-label="Basmala">${escapeHtml(text)}</div>`;
}

function renderVerses(id){
  const verses = VERSE_CACHE[id];
  const surah = SURAH_DATA.find(s=>s.id===id);
  /* ⭐ Die Seite des Tages (18.09.2026): ENDET sie in dieser Sure, steht ihr
     Haken nach ihrem LETZTEN Vers; läuft sie über das Ende dieser Sure
     hinaus, steht dort „Seite N geht weiter". Einmal vor der Schleife
     ausgerechnet — zufallsSeiteHeute() geht über alle 604 Seiten. */
  const tagesSeite = (typeof zufallsSeiteHeute === 'function') ? zufallsSeiteHeute() : null;
  const tagesSeiteHier = (tagesSeite && tagesSeite.bisSure === id) ? tagesSeite : null;
  const seiteGehtWeiter = (tagesSeite && tagesSeite.sure <= id && id < tagesSeite.bisSure)
    ? seitenWeiterHtml(tagesSeite.seite, id + 1) : '';
  document.getElementById('verseList').innerHTML = basmalaHtml(id) + verses.map((v, i) => {
    const nr = i + 1;
    const seitenKnopf = (tagesSeiteHier && nr === tagesSeiteHier.bis) ? seiteGelesenKnopfHtml(tagesSeiteHier.seite) : '';
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
    /* Seitenende NACH diesem Vers, wenn der naechste auf einer neuen Seite
       steht. Die Zahl ist die der Seite, die man gerade zu Ende gelesen hat -
       deshalb "Seitenende" und nicht "Seitenanfang". Nach dem LETZTEN Vers
       einer Sure steht keine: dort endet die Sure, nicht die Seite - die
       naechste Sure laeuft im Muṣḥaf auf derselben Seite weiter. */
    let trenner = '';
    if (nr < verses.length){
      const hier = seiteVon(id, nr), naechste = seiteVon(id, nr + 1);
      if (hier && naechste && naechste !== hier)
        trenner = `<div class="seiten-ende" aria-hidden="true">Seite ${hier}</div>`;
    }
    return `
    <div class="verse-item${kann?' auswendig':''}" data-versnr="${nr}">
      <div class="verse-kopf">
        <span class="verse-num">${v.verse_key}</span>
        <button class="hifz-check${kann?' on':''}" data-versmerk="${id}:${nr}"
                aria-label="Vers ${nr} als auswendig markieren">${icon('check')}</button>
      </div>
      <div class="verse-ar${verdeckt}" lang="ar" dir="rtl">${quranWortSpans(v.text_uthmani)}</div>${ayahSchlussHtml(id, nr)}
      <div class="verse-de">${(v.translations && v.translations[0] && v.translations[0].text) || ''}</div>
      <!-- ⚠️ Steht IMMER im Markup und wird nur ein- und ausgeblendet, genau
           wie das Ayah-Schlusszeichen. So bleibt der DOM in allen Ansichten
           derselbe, und das Umschalten braucht keinen Neuaufbau. Gefuellt
           wird sie nachtraeglich von zeigeQuranEn(). -->
      <div class="verse-en" lang="en"></div>
    </div>${seitenKnopf}${trenner}`; }).join('') + gelesenKnopfHtml(id) + seiteGehtWeiter;
  aktualisiereHifzLeiste(id, surah);
  /* ⛔ OHNE await: der Leser steht sofort, das Englische kommt nach. Ein
     Netzabruf darf den Aufbau nie aufhalten — sonst haengt der ganze Leser an
     einer Verbindung, die es beim Lesen im Bus nicht gibt. */
  zeigeQuranEn(id);
  renderAyahListe(id);
  renderSuraNav(id);
  beobachteLesestand(id);
  passeBasmalaAn();
  /* ⛔ Die markierten Fehlerstellen NACH jedem Neuaufbau neu zeichnen. Sie
     hängen an Textknoten (CSS Custom Highlight API, js/quran-markierung.js);
     nach einem Neuaufbau sind das andere Knoten, und die alten Bereiche
     zeigen ins Leere — ohne Fehler, nur ohne Markierung.
     [[ausfall_ist_unsichtbar_gebaut]] */
  if (typeof tajweedZeichnen === 'function') tajweedZeichnen();
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
  /* ⚠️ Kurze Beschriftung seit dem 20.09.2026: Elias wollte die drei Knöpfe
     der Leiste NEBENEINANDER („ich will das die drei nebeneinander stehen
     damit sie nicht so viel platz in der höhe einnehmen"), und „Auswendige
     verdecken" passte dort nicht mehr. Beide Wörter sind seine eigenen —
     am 04.08.2026: „wieder aufdecken", „auswendig verbergen". */
  document.getElementById('hifzVerdeckenText').textContent =
    HIFZ_VERDECKT ? 'Aufdecken' : 'Verdecken';
}

/* ---------- Sprungliste der Ayat (Elias' Punkt 8 vom 04.08.2026) ----------

   ⚠️ Erste Fassung war eine waagerechte Leiste im angehefteten Kopf. Falsch,
   und der Wunsch sagte es schon: "die Nummern der ayaht runter scrollen".
   Bei At-Tawbah (129 Verse) waren 13 Nummern gleichzeitig sichtbar, alles
   andere lag hinter einer langen Wischbewegung - und die Leiste nahm dauerhaft
   Hoehe weg fuer etwas, das man selten braucht.

   Jetzt: ein Knopf im Kopf, der eine Liste aufklappt, senkrecht rollbar.
   Die Nummern laufen von LINKS nach rechts. Sie liefen kurz andersherum, weil
   Elias "genau andersherum" gewuenscht hatte - nachdem er es gesehen hatte,
   war es doch falsch: die Ziffern sind westlich, und westliche Ziffern liest
   man von links. Begruendung steht bei .ap-grid in index.html.

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
  /* 'instant' ausdruecklich: .ap-grid erbt zwar kein scroll-behavior, aber die
     Angabe wegzulassen ist genau der Fehler, der bei hebeVersHervor eine
     Stunde gekostet hat. */
  if (aktiv) aktiv.scrollIntoView({ block:'center', behavior:'instant' });
  overlayAuf('ayahPopover');
}
function schliesseAyahListe(){
  if (overlayZuUeberHistorie('ayahPopover')) return;
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
   ⚠️ Dieser Absatz stand hier schon, WAEHREND die Fahrt weich war - siehe
   unten. Ein Kommentar ist keine Zusicherung.

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

   ⭐ Die Ursache war NICHT das Nachwachsen des Inhalts, wie zwei verworfene
   Anläufe annahmen (erst ein zweiter/dritter Anlauf, dann ein Halten ueber
   1,2 s - beide brachten exakt dieselben Zahlen, 19497/6556/425 bzw.
   19589/6977/461). Die Werte sind eine Beschleunigungskurve, keine
   Verschiebung: `#main` traegt `scroll-behavior:smooth`, und
   `behavior:'auto'` heisst NICHT "sofort", sondern "nimm den CSS-Wert".
   Die Fahrt war also weich - genau das, was der Kommentar hier seit jeher
   ausschliessen wollte. Die Absicht stimmte, die Umsetzung nicht.

   `behavior:'instant'` uebergeht die CSS-Angabe. Nachgemessen, gleiche Stelle:
   Ziel 156 px unter der Oberkante nach 0 ms statt 19589 px.

   Danach wandert es noch auf 419 px, weil die Verse mit der Schrift hoeher
   werden - das bleibt aber die ganze Zeit im Bild und braucht kein Nachfassen.
   Nur falls es doch ganz herausrutscht, greift der eine Nachschlag unten. */
function hebeVersHervor(el){
  const mitte = () => el.scrollIntoView({ block:'center', behavior:'instant' });
  mitte();
  el.classList.remove('angesteuert');
  void el.offsetWidth;                       // Animation neu starten
  el.classList.add('angesteuert');
  /* Ein einziger Nachschlag, und nur wenn der Vers wirklich aus dem Bild ist -
     sonst risse es den Blick weg, falls inzwischen selbst gerollt wurde. */
  setTimeout(() => {
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) mitte();
  }, 500);
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
  /* Hier stand bis zum 04.08.2026 abends ein eigenes Zuruecksetzen der
     Rollhoehe. Es ist weg, weil openSurah das jetzt selbst tut - und zwar auf
     ALLEN Wegen, nicht nur auf diesem einen. Genau die fehlende Abdeckung war
     der Fehler: aus der Liste heraus geoeffnet, blieb die Rollhoehe stehen. */
  openSurah(Number(knopf.dataset.suranav));
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
  const ziel = document.querySelector(`#verseList .verse-item[data-versnr="${nr}"]`);
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
    const karte = knopf.closest('.verse-item');
    /* Seit dem Listenmodus (Punkt 6, 10.08.2026) tragen ZWEI Elemente je Vers
       dieselbe Marke: das Haken-Kaestchen der Kaestchen-Ansicht und das
       Versschlusszeichen der Liste. Nur das angeklickte umzuschalten hiesse,
       das andere stehen zu lassen - beim Wechsel der Darstellung staende dann
       ein falscher Haken da, bis die Sure neu gebaut wird. */
    (karte || document).querySelectorAll(`[data-versmerk="${key}"]`)
      .forEach(b => b.classList.toggle('on', an));
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
     Vers fuer Vers, ohne den Modus zu verlassen. Ein zweiter Tipp verdeckt ihn
     wieder. Elias am 10.08.2026: „damit ich nicht die ganze zeit der verdecken
     button drücken muss … im prinzip das gleiche wie wenn ich einmal eine ayah
     antipppe um sie wieder sichtbar zu machen, so halt nur andersherum."

     ⚠️ Das Zurueckverdecken darf NUR greifen, solange der Verdecken-Modus
     laeuft UND der Vers als auswendig markiert ist - sonst liesse sich jeder
     beliebige Vers durch Antippen unlesbar machen. Genau diese zwei
     Bedingungen entscheiden auch beim Umschalten des Modus, was verdeckt wird
     (siehe btnHifzVerdecken weiter unten); sie stehen hier absichtlich in
     derselben Form, damit nicht zwei Stellen dasselbe verschieden beantworten. */
  const text = e.target.closest('.verse-ar');
  if (!text) return;
  if (text.classList.contains('verdeckt')){ text.classList.remove('verdeckt'); return; }
  const karte = text.closest('.verse-item');
  if (HIFZ_VERDECKT && karte && karte.classList.contains('auswendig'))
    text.classList.add('verdeckt');
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


/* Ein einziger Zuhoerer auf dem Rollkasten, nicht einer je geoeffneter Sure -
   `#main` ist fuer Liste und Verse derselbe und bleibt ueber die ganze Laufzeit
   bestehen. pruefeLeseRichtung steigt selbst aus, wenn gerade keine Sure offen
   ist.

   Gedrosselt auf ein Bild: Ein Bildlauf feuert je nach Geraet dutzende Male je
   Sekunde, und jeder Durchlauf liest scrollHeight/clientHeight - das erzwingt
   ein Nachrechnen der Seite. Mit requestAnimationFrame passiert das hoechstens
   einmal je gezeichnetem Bild, also genau so oft, wie man es ueberhaupt sehen
   koennte.

   `passive:true`, weil hier nie `preventDefault` aufgerufen wird - damit darf
   der Browser weiterrollen, ohne auf diesen Zuhoerer zu warten. */
(function beobachteLeseRichtung(){
  const kasten = document.getElementById('main');
  if (!kasten) return;
  let angefordert = false;
  kasten.addEventListener('scroll', ()=>{
    if (angefordert) return;
    angefordert = true;
    const gleich = typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame : (f)=>setTimeout(f, 16);
    gleich(()=>{ angefordert = false; pruefeLeseRichtung(); });
  }, { passive:true });
})();

/* Die gespeicherte Ansicht gilt ab dem ersten Bildaufbau, nicht erst, wenn das
   Menue einmal geoeffnet wurde. Sonst startet der Leser immer in 100 % und
   springt erst um, sobald man die Einstellung anfasst. */
wendeQuranAnsichtAn();

/* ---------- Die Klebekante MESSEN statt raten (08.09.2026) ------------------

   Elias mit Bildschirmfoto aus Al-Mulk: „hier ist es etwas zu abgeschnittten
   … die auswendig verdecken und ayah und generell diese leiste ist zu weit
   oben, die wird etwas abgeschnitten. das soll so nicht sein."

   ⛔ Gemessen bei 375 px: `--quran-kopf-h` stand auf **48px**, die Titelzeile
   ist aber **52px** hoch. `.quran-sticky` klebt an dieser Variablen — also
   vier Pixel zu hoch, und weil die Titelzeile `z-index:30` hat und die Leiste
   nur 25, verschwindet ihr oberer Rand darunter. Sichtbar wird es erst beim
   Rollen: ungerollt stehen beide ohnehin aufeinander.

   ⭐ Die 48 waren nie falsch abgeschrieben, sie waren eine RECHNUNG: der
   Kommentar in index.html sagt „40 px Knopfhoehe + 2 × 4 px". Die Knopfhoehe
   ist seither eine andere. Eine feste Zahl, die eine gemessene Groesse
   nachbildet, veraltet lautlos — und niemand prueft sie, weil sie aussieht
   wie eine Entscheidung. [[vor_dem_eintragen_messen]] · [[zahlen_ohne_beleg]]

   ⚠️ Genau dasselbe Muster wie `--topbar-h` in js/kern.js, dort seit dem
   21.08.2026 aus demselben Grund. Deshalb hier derselbe Bau, nicht ein
   zweiter erfundener. [[entscheidung_gilt_fuer_das_zweite_werkzeug]]

   ⚠️ ResizeObserver statt `resize`: die Zeile aendert ihre Hoehe auch ohne
   Fensteraenderung — laengerer Surenname, groessere Systemschrift,
   nachgeladene arabische Schrift. Ein `resize`-Zuhoerer bekaeme davon nichts
   mit.

   ⚠️ `transform` beim Einklappen stoert nicht: es verschiebt das Bild, die
   gemessene Hoehe bleibt dieselbe. */
function quranKopfHoeheMessen(){
  const kopf = document.querySelector('#screen-quranfull .screen-header');
  const screen = document.getElementById('screen-quranfull');
  if (!kopf || !screen) return;
  /* ⚠️ Die Funktion wird bei JEDEM Surenwechsel gerufen — ohne diese Marke
     haengt nach zwanzig Suren ein Stapel von zwanzig Beobachtern am selben
     Element, die alle dasselbe tun. Messen darf sie trotzdem jedes Mal. */
  const schonBeobachtet = kopf.dataset.hoeheBeobachtet === '1';
  const setzen = () => {
    const h = Math.ceil(kopf.getBoundingClientRect().height);
    /* 0 kommt vor, solange der Leser nicht gezeigt wird — der alte Wert ist
       dann besser als keiner. [[breite_null_ist_kein_layout]] */
    if (h > 0) screen.style.setProperty('--quran-kopf-h', h + 'px');
  };
  setzen();
  if (schonBeobachtet) return;
  kopf.dataset.hoeheBeobachtet = '1';
  if (typeof ResizeObserver === 'function') new ResizeObserver(setzen).observe(kopf);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(setzen);
}
/* ⚠️ Nicht blind auf DOMContentLoaded warten: die Skripte stehen am Ende des
   Body, und wer diese Datei spaeter einbindet oder nachlaedt, wartet auf ein
   Ereignis, das schon vorbei ist. [[werkzeug_ohne_aufrufer]] */
if (document.readyState === 'loading')
  document.addEventListener('DOMContentLoaded', quranKopfHoeheMessen);
else quranKopfHoeheMessen();
