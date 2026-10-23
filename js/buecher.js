/* buecher.js -- mehrere Lehrwerke, nachgeladen statt alles auf einmal
   Teil der App-Logik; wird in index.html in fester Reihenfolge geladen und
   teilt sich mit den uebrigen js/-Dateien den globalen Namensraum.

   Ausgangslage: vocab-data.js enthielt nur Madina 1, Kapitel 1-9 (74 KB).
   Elias' arabicroots-Konto hat aber 4433 Vokabeln in acht Lehrwerken, und
   fast alle Woerter, die ihm schwerfallen, stehen in Buechern, die die App
   gar nicht kannte.

   Alles in eine Datei zu legen waeren rund 1,7 MB beim ersten Aufruf - am
   Handy spuerbar, und das meiste davon Buecher, die gerade nicht dran sind.
   Entscheidung (Elias, 28.07.2026): eine Datei je Buch, nachgeladen beim
   Umschalten. Der Start bleibt so schnell wie vorher, offline verfuegbar ist
   trotzdem alles, was einmal geoeffnet wurde - der Service Worker legt jede
   geladene Buchdatei ab.

   vocab-data.js bleibt als Anreicherungsschicht bestehen: dort stehen die
   Beispielsaetze und die Quran-Belege zu Madina 1, Kapitel 1-9. Die rohen
   Buchdateien haben so etwas nicht (die arabicroots-Datenbank fuehrt weder
   Beispielsaetze noch Verse). Beim Nachladen wird deshalb angereichert, nicht
   ersetzt: gleiche ID -> die vorhandenen Zusatzfelder bleiben stehen. */

/* ---------- Welche Buecher gerade gelernt werden ----------

   Bis zum 11.08.2026 war es genau EINES (`SETTINGS.aktivesBuch`). Elias:
   "eigentlich will ich auch die option haben mehrere bücher gleichzeitig
   auszuwählen weil wenn wir dann mit medina buch 2 anfangen dann brauche ich
   ja trotzdem die vokabeln von 1."

   ⭐ Mein erster Entwurf dazu war falsch, und seine Rueckfrage hat ihn
   entlarvt: "wie erkenne ich oder betimme ich denn welches das hauptbuch ist
   und wie viele oder welche kapitel ich beim zusatzbuch freigeschalten haben
   möchte". Ich hatte "ein Hauptbuch mit Kapitelauswahl, Zusatzbuecher laufen
   vollstaendig mit" vorgeschlagen - das haette ihm alle 24 Kapitel von
   Madina 1 gegeben statt der neun, die er gelernt hat.

   Richtig ist deshalb: KEIN Hauptbuch. Jedes gewaehlte Buch traegt seine
   EIGENE Kapitelauswahl. Die Einstellung ist eine Zuordnung

       SETTINGS.buecher = { 'madina-1': [1,2,3], 'madina-2': [] }

   Ein leeres Feld heisst "alle Kapitel dieses Buchs" - dieselbe Bedeutung, die
   die leere `selectedChapters`-Liste vorher hatte. */

function aktiveBuecher(){
  const karte = SETTINGS.buecher;
  const slugs = (karte && typeof karte === 'object') ? Object.keys(karte) : [];
  /* Nie leer: ohne Buch zeigt die App gar nichts an und sieht kaputt aus. */
  return slugs.length ? slugs : ['madina-1'];
}

/* Die Kapitelauswahl EINES Buchs. Leer = alle. */
function kapitelAuswahl(slug){
  const karte = SETTINGS.buecher || {};
  return Array.isArray(karte[slug]) ? karte[slug] : [];
}

function buchGewaehlt(slug){ return aktiveBuecher().indexOf(slug) >= 0; }

/* Ist irgendwo eine Kapitelauswahl gesetzt? Diese Frage entscheidet, ob die
   eigenen Vokabeln mitlaufen - siehe passtZurAuswahl() in js/kern.js. */
function irgendwoEingeengt(){
  const karte = SETTINGS.buecher || {};
  return Object.keys(karte).some(s => (karte[s] || []).length > 0);
}

/* ⚠️ Bleibt bestehen, hat aber nur noch EINEN Zweck: Beschriftungen, die
   nun einmal einen einzelnen Namen brauchen. Wer damit filtert, baut die
   Mehrfachauswahl wieder aus - dafuer gibt es aktiveBuecher(). */
function aktivesBuch(){ return aktiveBuecher()[0]; }

/* Einmalige Umstellung des alten Standes. Ohne sie stuende nach dem Update
   ploetzlich Madina 1 mit allen Kapiteln da, obwohl Elias auf Kapitel 3
   eingestellt war - ein stiller Rueckschritt mitten in seiner Lernrunde. */
function stelleBuchauswahlUm(){
  if (SETTINGS.buecher && typeof SETTINGS.buecher === 'object') return false;
  const slug = SETTINGS.aktivesBuch || 'madina-1';
  const alt  = Array.isArray(SETTINGS.selectedChapters) ? SETTINGS.selectedChapters : [];
  /* 'personal' war frueher ein Eintrag in derselben Liste wie die Kapitel.
     Eigene Vokabeln gehoeren aber zu keinem Buch, deshalb bekommt der Schalter
     jetzt ein eigenes Feld. */
  SETTINGS.buecher = {};
  SETTINGS.buecher[slug] = alt.filter(k => k !== 'personal');
  SETTINGS.eigeneGewaehlt = alt.indexOf('personal') >= 0;
  return true;
}

/* ---------- Der „Eigene"-Chip, einmalig nachgezogen (20.08.2026) ----------

   ⛔ Gemessen am 20.08.2026: `irgendwoEingeengt()` true, `eigeneGewaehlt` false
   — damit standen NULL von 44 eigenen Vokabeln in der Auswahl. Kein Fehler
   meldete das; die Wörter waren einfach nicht da.

   Der Wert kam nicht von Elias, sondern aus stelleBuchauswahlUm() weiter oben:
   stand in der alten Kapitelliste kein 'personal', wurde daraus `false`. Das
   ist keine Entscheidung, das ist ein Nebenprodukt einer Datenumstellung.

   ⚠️ Akut wurde es durch Auftrag E vom selben Tag: die fünfzehn Fachbegriffe
   hatten bis dahin einen eigenen Zweig VOR dem Chip und liefen deshalb immer
   mit. Als sie zu eigenen Vokabeln wurden, wären sie mit unter den Chip
   gerutscht — und mit ihm verschwunden. Der Auftrag hätte ihm etwas
   weggenommen, statt etwas zusammenzulegen.

   ⭐ Deshalb: wer den Chip nie selbst angetippt hat (kein
   `eigeneChipEntschieden`), bekommt ihn an. Wer ihn antippt, setzt den Merker
   — ab dann bleibt seine Wahl stehen, auch wenn sie „aus" lautet. */
function eigeneChipNachziehen(){
  if (SETTINGS.eigeneChipEntschieden) return false;
  SETTINGS.eigeneChipEntschieden = true;
  if (SETTINGS.eigeneGewaehlt) return false;
  SETTINGS.eigeneGewaehlt = true;
  return true;
}

/* Die Eintraege aus vocab-data.js kennen kein `book`-Feld - sie stammen alle
   aus Madina 1. Ohne das Feld faende der Buchfilter sie nicht wieder. */
(function basisEinordnen(){
  VOCAB_DATA.forEach(w=>{
    if (!w.book) w.book = (w.chapter === 'personal') ? 'personal' : 'madina-1';
  });
})();

/* Anfangs ist nichts nachgeladen. Frueher stand hier `new Set(['madina-1'])`,
   weil vocab-data.js ja Madina 1 enthaelt - aber eben nur die Kapitel 1 bis 9.
   Die Kapitel 10 bis 24 desselben Buchs fehlten dadurch dauerhaft, und zwar
   unsichtbar: die App meldete "Madina 1 ist geladen" und zeigte 149 statt 298
   Vokabeln. */
const GELADENE_BUECHER = new Set();

/* Buecher, deren Datei sich nicht laden liess. Sie verschwinden aus der
   Auswahl, statt als Knopf dazustehen, der bei jedem Antippen scheitert.
   Zwei Faelle, in denen das wirklich vorkommt: eine abgebrochene Verbindung
   am Handy - und die Auslieferung ohne data/, solange Elias noch nicht
   entschieden hat, ob sein Vokabelabzug ins oeffentliche Repo darf. */
const BUCH_FEHLT = new Set();

/* ---------- „Ein Buch fehlt" ist nicht „der Ordner fehlt" (09.09.2026) ------

   ⛔ HIER STAND `BUCH_FEHLT.has(slugs[0])` — also: scheitert das ERSTE der
   gemerkten Buecher, gelten alle acht als weg (BUECHER hat heute ACHT
   Eintraege — die alte Fassung dieses Kommentars sprach von sieben und war
   damit ueberholt; nachgezaehlt in data/buecher.js). Die Begruendung dazu war
   richtig gedacht und nur fuer EINEN der beiden Faelle wahr:

     online   data/ wird als Ganzes ausgeliefert oder gar nicht (ohne
              `--mit-daten`). Faellt eines aus, fehlen alle. Stimmt.
     offline  der Cache haelt EINZELNE Dateien. Gemessen: von den neun
              `data/vokabeln-*.js` steht genau EINE in der ASSETS-Liste von
              sw.js (`vokabeln-eigene.js`, 4,5 KB von 1,76 MB). Die anderen
              acht landen erst im Cache, NACHDEM sie einmal mit Netz geladen
              wurden — der fetch-Handler legt jede 200er-Antwort ab. Ein Buch
              da, das naechste nicht, ist offline also der Normalfall.

   Die Folge im zweiten Fall: Elias hat vier Buecher gewaehlt, drei liegen im
   Cache, das erste nicht — und es verschwinden ALLE VIER aus der Auswahl,
   obwohl die drei geladen sind und ihre Vokabeln bereits in VOCAB_DATA
   stehen. Und dieselbe Lage endet je nach Reihenfolge anders: faellt statt
   des ersten das zweite Buch aus, verschwindet nur dieses eine.
   [[kennzeichen_mit_zwei_ursachen]] [[erfundene_begruendung_schliesst_den_fall]]

   ⭐ Der Schluss auf „der ganze Ordner fehlt" ist erst zulaessig, wenn KEIN
   einziges versuchtes Buch geladen hat. Hat eines geladen, ist der Ordner
   nachweislich da — dann ist die Annahme durch die eigenen Daten widerlegt.
   Der urspruengliche Zweck bleibt dabei vollstaendig erhalten: bei fehlendem
   data/ scheitern alle versuchten, und die untersuchten Buecher werden
   weiterhin gar nicht erst angeboten. */
function fehltDerGanzeOrdner(versucht){
  if (!Array.isArray(versucht)) return false;
  /* ⚠️ Ohne die Gruppe „Koran häufigste" (11.10.2026): sie liegt nicht in data/ und
     lädt immer. Mit ihr in der Liste gälte der Ordner als vorhanden, auch wenn jedes
     Buch daraus fehlt. Der Name steht als Text, weil Prüfstände nur diese Funktion
     aus dem Quelltext schneiden (KORAN_BUCH weiter unten). */
  const ausOrdner = versucht.filter(s => s !== 'koran-haeufig');
  if (!ausOrdner.length) return false;
  return ausOrdner.every(s => BUCH_FEHLT.has(s));
}

/* ---------- „Koran häufigste" — die häufigsten Wörter des Korans als eigenes Buch (11.10.2026) ----------

   Elias am 11.10.2026, drei Sätze:
     „ja bau die ersten 100 wörter ein" — auf meine Frage: „Soll ich die ersten 100
        Wörter jetzt als eigene Wortgruppe ‚Koran – häufigste Wörter' in die App bauen,
        nach Häufigkeit sortiert? Auf der Karte stünde dann zum Beispiel ‚qala – er
        sagte' und darunter ‚1618-mal im Koran'." (Die Zeile mit der Zahl hat er am
        selben Tag abgesagt — sein Satz steht weiter unten vor schalteBuch().)
     „kürze den namen auf Koran häufigste"
     „du kannst koran häufigste die häufigsten 270 wörter darein machen damit ich so 70%
      verstehen kann. und da sollen erstmal die wörter kommen die am häufigsten sind.
      wörter die ich bereits kann sollen nicht doppelt kommen also wenn sie bereits
      freigeschalten wurden. häufigsten wörter die ich bereits kann bzw kenne als
      kapiteln oder so sollen auf den selben stand gebracht werden"

   Alles Weitere ist MEINE Bauart, nicht seine Vorgabe:
   - Die Gruppe ist ein BUCH (`koran-haeufig`). Damit hat sie, was jedes Buch hat —
     einen Knopf in der Buchzeile, den ER anhakt, eine Kapitelauswahl (je 30 Plätze ein
     Stück), Karteikarten, Kategorien, Statistik —, ohne dass eine dieser Stellen sie
     eigens kennen muss.
   - Sie steht NICHT in BUECHER (data/buecher.js). Das Verzeichnis erzeugt
     hole-vokabeln.mjs aus seinem arabicroots-Abzug, und zwei Leser deuten jeden
     Eintrag als Datei im Ordner data/: „Bücher offline" in js/einstellungen.js und
     „der ganze Ordner fehlt" beim Start weiter unten. alleBuecher() hängt die Gruppe
     für die beiden Stellen an, die ein Buch nur ANBIETEN (buchInfo, renderBuchChips).
   - Die Wörter sind EIGENE Karten (koran-haeufig-data.js, erzeugt aus
     werkzeuge/koran-haeufig-liste.txt), keine Verweise auf seine Buchkarten: dafür
     müssten bis zu sechs fremde Bücher geladen sein, und der Inhalt hinge an Daten,
     die nicht im Repo liegen dürfen. Das Deutsch ist von mir geschrieben.
   - Sein „nicht doppelt" und „auf den selben stand": koranKartenEinordnen() unten. */
const KORAN_BUCH = 'koran-haeufig';
function koranListe(){
  return (typeof KORAN_HAEUFIG !== 'undefined' && Array.isArray(KORAN_HAEUFIG)) ? KORAN_HAEUFIG : [];
}
function koranBuchInfo(){
  const l = koranListe();
  if (!l.length) return null;
  return { slug: KORAN_BUCH, vokabeln: l.length,
           kapitel: l.reduce((m, e) => Math.max(m, Number(e.kap) || 0), 0),
           datei: 'koran-haeufig-data.js' };
}
/* Die Karten der Gruppe, so wie ein Buch sie liefert. `koranRang` trägt den Platz
   nach Häufigkeit auf die Karte — danach ordnet neueZuerst() in js/kern.js. */
function koranKarten(){
  /* Die Felder des vollen Programms (12.10.2026): Wurzel, Geschlecht, Einzahl, Mehrzahl,
     weibliche Form, Verbformen — soweit die Datendatei sie trägt. Belegt sind sie in
     werkzeuge/koran-haeufig-felder.txt; ein Feld ohne Beleg fehlt dort und bleibt hier
     leer. Die Liste steht IN der Funktion: die Prüfstände schneiden sie einzeln heraus. */
  const FELDER = ['root', 'gender', 'sg', 'pl', 'femSg', 'femPl', 'past', 'present', 'imperative', 'masdar'];
  return koranListe().map(e => {
    const k = { id: e.id, ar: e.ar, de: e.de, type: e.type,
                chapter: e.kap, book: KORAN_BUCH, koranRang: e.rang };
    for (const f of FELDER) if (e[f]) k[f] = e[f];
    /* Die Koranstelle (A11, 13.10.2026): nur aus seinem auswendigen Bereich, erzeugt aus
       werkzeuge/koran-vorlagen/stellen.json. Dieselbe Form wie an den Karten aus vocab-data.js —
       die Lernkarte zeigt sie hinter „Quran-Bezug anzeigen", die Kategorie „Wörter mit
       Quran-Bezug" zählt sie mit. */
    if (e.quran) k.quran = e.quran;
    return k;
  });
}
/* Ein Stück der Gruppe heißt nach seinen Plätzen: „1–30", „31–60" …, das letzte
   „241–255". Für jedes andere Buch leer — dann bleibt es beim Aufrufer bei „Kap. N".
   Aus der LISTE gelesen, nicht aus VOCAB_DATA: die Namen bleiben stehen, auch wenn
   für einzelne Wörter eine Kapitelkarte steht. */
function koranStueck(buch, kap){
  if (buch !== KORAN_BUCH) return '';
  const plaetze = koranListe().filter(e => Number(e.kap) === Number(kap)).map(e => Number(e.rang));
  return plaetze.length ? Math.min(...plaetze) + '–' + Math.max(...plaetze) : '';
}
/* Alle Bücher, die die App anbietet: das Verzeichnis aus data/ plus die Gruppe. */
function alleBuecher(){
  const liste = (typeof BUECHER !== 'undefined' && Array.isArray(BUECHER)) ? BUECHER.slice() : [];
  const koran = koranBuchInfo();
  if (koran && !liste.some(b => b.slug === KORAN_BUCH)) liste.push(koran);
  return liste;
}

function buchInfo(slug){
  return alleBuecher().find(b=>b.slug===slug);
}

/* Eine Buchdatei per <script> nachladen. Bewusst kein fetch/JSON: die Dateien
   sind ausfuehrbares JS und haengen sich selbst in window.VOKABELN ein - so
   greift auch der Offline-Cache des Service Workers ohne Sonderbehandlung.

   ⛔ Die ausgelieferte Datei geht dem eingelesenen Vokabelpaket VOR (12.10.2026).
   Bis v668 stand hier nur „liegt das Buch schon in window.VOKABELN, nimm es".
   js/vokabelpaket.js haengt das Paket aber beim Start ein, BEVOR irgendein Buch
   geladen ist - auf einem Geraet mit eingelesenem Paket gewann deshalb immer
   das Paket. Gemessen (Claude, mit den ausgeschnittenen Funktionen in der
   Reihenfolge des App-Starts): 0 Dateianfragen, die App zeigte die Karten vom
   Tag des Einlesens; ein neues Kapitel oder eine berichtigte Karte waere dort
   nie angekommen. Jetzt wird fuer ein Buch, das nur aus dem Paket dasteht
   (PAKET_SLUGS), zuerst die Datei versucht; sie ersetzt den Eintrag beim Laden
   selbst. Kommt sie nicht (kein Netz und nichts im Vorrat, oder die Daten sind
   gar nicht ausgeliefert), bleibt das Paket - dafuer ist es da.
   Bewacht von werkzeuge/pruefe-vokabelpaket.mjs (Abschnitt „Reihenfolge des
   App-Starts"). */
function ladeBuchDatei(slug){
  return new Promise((fertig, fehler)=>{
    const info = buchInfo(slug);
    if (!info) return fehler(new Error(`Unbekanntes Buch: ${slug}`));
    /* „Koran häufigste" liegt nicht in data/ — die Liste hat index.html schon geladen. */
    if (slug === KORAN_BUCH) return fertig(koranKarten());
    const ausPaket = typeof PAKET_SLUGS !== 'undefined' && PAKET_SLUGS.has(slug);
    const vorhanden = (window.VOKABELN && window.VOKABELN[slug]) || null;
    if (vorhanden && !ausPaket) return fertig(vorhanden);
    const s = document.createElement('script');
    s.src = info.datei;
    s.onload = ()=>{
      const jetzt = (window.VOKABELN && window.VOKABELN[slug]) || null;
      /* Hat die Datei den Eintrag ersetzt, steht das Buch ab jetzt aus der
         Auslieferung da - beim naechsten Aufruf braucht es keine Anfrage mehr. */
      if (ausPaket && jetzt && jetzt !== vorhanden) PAKET_SLUGS.delete(slug);
      if (jetzt) fertig(jetzt);
      else fehler(new Error(`${info.datei} geladen, enthielt aber keine Vokabeln.`));
    };
    s.onerror = ()=> vorhanden ? fertig(vorhanden) : fehler(new Error(`${info.datei} nicht erreichbar.`));
    document.head.appendChild(s);
  });
}

/* Rohdaten in VOCAB_DATA einhaengen. Ruecklaeufig ist die Zahl der wirklich
   neuen Eintraege - bei Madina 1 ist sie klein, weil die ersten neun Kapitel
   schon aus vocab-data.js dastehen. */
/* ---------- Wann eine rohe Angabe KEINE Angabe ist ----------

   Elias am 04.08.2026: "Vokabel Schweiz fehlt Taschkil." Die Ursache lag nicht
   dort, wo man sie sucht. In vocab-data.js steht die am 30.07. belegte Fassung
   سُوِيسْرَا (Madina-Schluessel 1, L7, S. 29) - und die ist auch nie ueberschrieben
   worden, denn `ar` ist belegt und Vorhandenes gewinnt.

   Ueberschrieben wurde ein Feld, das GAR NICHT gefuellt war: `sg` stand auf
   null, und der Abzug traegt dort سُويسْرَا nach - dasselbe Wort, aber ohne die
   Kasra unter dem و. Weil fast alles im Code auf `w.sg || w.ar` zugreift,
   gewinnt ab da die schlechtere Schreibung. Bei Japan genauso: `ar` ist
   الْيَابَانُ, der Abzug schiebt ueber `sg` das artikellose اليَابَانُ nach.

   Deshalb diese Pruefung: Ein arabisches Feld aus dem Abzug wird NICHT
   nachgetragen, wenn es - ohne Vokalzeichen betrachtet - dasselbe Wort ist wie
   das schon vorhandene `ar`, aber weniger Taschkil traegt. Dann ist es keine
   neue Angabe, sondern eine schlechtere Schreibung derselben.

   Warum nicht nachtragen statt korrigieren: `w.sg || w.ar` faellt dann von
   selbst auf die belegte Fassung zurueck. Es wird also kein einziges
   Vokalzeichen von mir gesetzt - E.1 bleibt unangetastet.

   Ein echter Plural kann hier nicht hineinlaufen: entvokalisiert ist بُيُوتٌ
   nicht dasselbe wie بَيْتٌ, die erste Bedingung greift also gar nicht. */
const ROH_ARAB_FELDER = new Set(['ar','sg','pl','femSg','femPl','past','present','imperative','masdar']);
function rohOhneHarakat(s){ return String(s == null ? '' : s).replace(/[ً-ْٰـ]/g, ''); }
function rohZaehleHarakat(s){ return (String(s == null ? '' : s).match(/[ً-ْٰ]/g) || []).length; }
function istSchlechtereSchreibung(feld, wert, da){
  if (!ROH_ARAB_FELDER.has(feld) || !da.ar) return false;
  if (rohOhneHarakat(wert) !== rohOhneHarakat(da.ar)) return false;
  return rohZaehleHarakat(wert) < rohZaehleHarakat(da.ar);
}

/* ---------- Erfundene Wurzeln nicht uebernehmen (C9, 18.08.2026) ----------

   Elias' Entscheidung: „alle leer lassen — eine erfundene Wurzel täuscht im
   Wurzelmodus eine Familie vor. Ausnahmen عَلَى und تَحْتَ, die belegbar sind."

   Nachgemessen (`vocab-data.js` gegen alle `data/vokabeln-*.js`):
   28 Woerter haben dort keine Wurzel, **10** davon bekaemen aus dem Abzug eine.
   Zwei davon sind echt und bleiben:

   | Wort | Abzug | echt? |
   |---|---|---|
   | عَلَى | ع ل و | **ja** — عَلَا/يَعْلُو „hoch sein", dazu عَلِيّ, أَعْلَى |
   | تَحْتَ | ت ح ت | **ja** — als Wurzel in den Lexika belegt |
   | مِنْ | م ن | nein, zwei Buchstaben des Wortes |
   | إِلَى | ا ل ى | nein |
   | أَيْنَ | ا ي ن | nein |
   | فِي | ف ي | nein |
   | هُنَا | ه ن ا | nein |
   | هُنَاكَ | ه ن ك | nein |
   | لِمَاذَا | ل م ذ | nein — das Wort ist لِ + مَا + ذَا |
   | الْآنَ | ا ن | nein |

   Bleiben **8** zu sperrende. ⚠️ In der To-Do stand „9 davon"; gemessen sind es
   10, und Elias' „8 erfundene" ist die richtige Zahl — 10 minus die zwei
   echten. Die 9 war schlicht falsch.

   ⭐ Gesperrt wird ueber die Id, nicht ueber eine Regel wie „Partikeln kriegen
   keine Wurzel". Eine Regel waere eine Behauptung ueber alle kuenftigen
   Woerter; diese Liste ist eine Aussage ueber zehn nachgesehene Faelle.
   Kommt ein neues Funktionswort dazu, faellt es auf, weil im Wurzelmodus eine
   Familie erscheint, die es nicht gibt - und dann wird es hier eingetragen. */
const KEINE_WURZEL_UEBERNEHMEN = new Set([
  '45808', /* مِنْ    */ '45809', /* إِلَى   */ '45810', /* أَيْنَ  */
  '45812', /* فِي     */ '45834', /* هُنَا   */ '45836', /* هُنَاكَ */
  '45888', /* لِمَاذَا */ '45891'  /* الْآنَ  */
]);

/* ---------- Doppelt in zwei Büchern: die zweite Karte bleibt draußen (16.09.2026) ----

   Gefragt: „أَخٌ (Bruder) und أُخْتٌ (Schwester) stehen in beiden Büchern und
   kommen deshalb doppelt. Soll ich die aus Bayna Yadayk ausblenden?" — Elias: „ja".
   Er hat beide seit Madina 1 Kapitel 6 als Karte (madina1-l6-ach,
   madina1-l6-ucht, samt Fortschritt); die Bayna-Yadayk-Einträge wären leere
   Zweitkarten desselben Wortes.

   ⛔ Warum eine Liste und keine Regel: der Tausch in js/kern.js (tauscheDublette)
   galt nur für EIGENE Karten gegen Buchwörter — Elias' Regel vom 07.09.2026.
   Zwischen zwei Büchern hatte er genau diese zwei entschieden, nicht mehr.
   ⭐ Seit dem 16.09.2026 gibt es die Regel: „wenn zwei identisch sind und eines
   davon aber fortschritt hat dann sollte man immer das behalten was fortschritt
   hat" — blendeKapitelDublettenAus() in js/kern.js, beim Start nach dem Tausch.
   Die Liste bleibt trotzdem: sie ist seine Antwort von vorher, und sie wirkt schon
   beim Einhängen, auch wenn der Fortschritt einmal nicht gelesen werden kann.
   Neue Paare entscheidet die Regel; nur wenn BEIDE Karten Fortschritt haben, fragt
   pruefe-duplikate.js ihn. Gelesen auch von werkzeuge/vorrat.mjs, damit die Wartung
   für diese zwei keine Eselsbrücken schreibt. [[entscheidung_gilt_fuer_das_zweite_werkzeug]] */
const BUCHDUBLETTEN_AUSBLENDEN = new Set([
  '45984',  /* أَخٌ    Bayna Yadayk 1 K1 — hat er als madina1-l6-ach   */
  '45986'   /* أُخْتٌ  Bayna Yadayk 1 K1 — hat er als madina1-l6-ucht  */
]);

function einhaengen(liste){
  const nachId = new Map(VOCAB_DATA.map(w=>[String(w.id), w]));
  let neu = 0, ergaenzt = 0, verworfen = 0;
  liste.forEach(roh=>{
    if (BUCHDUBLETTEN_AUSBLENDEN.has(String(roh.id))) return;
    const da = nachId.get(String(roh.id));
    if (!da){ VOCAB_DATA.push(Object.assign({}, roh)); neu++; return; }
    /* Vorhandenes gewinnt: Beispielsatz, Quran-Beleg und Startbox aus
       vocab-data.js duerfen nicht von den rohen Feldern ueberschrieben
       werden. Nur was fehlt, wird nachgetragen. */
    let hatErgaenzt = false;
    Object.entries(roh).forEach(([k,v])=>{
      if (v !== null && v !== undefined && (da[k] === null || da[k] === undefined)){
        if (istSchlechtereSchreibung(k, v, da)){ verworfen++; return; }
        /* C9: acht Funktionswoerter bekommen im Abzug eine aus ihren eigenen
           Buchstaben gebaute „Wurzel". Die bleibt draussen - siehe die Tabelle
           bei KEINE_WURZEL_UEBERNEHMEN. Alle uebrigen Felder dieser Woerter
           werden ganz normal ergaenzt. */
        if (k === 'root' && KEINE_WURZEL_UEBERNEHMEN.has(String(roh.id))){ verworfen++; return; }
        da[k] = v; hatErgaenzt = true;
      }
    });
    if (hatErgaenzt) ergaenzt++;
  });
  const eselsbruecken = eselsbrueckenNachtragen(liste);
  eselsbrueckenErsetzen();
  schreibweisenErsetzen();
  const saetze = saetzeNachtragen(liste);
  return { neu, ergaenzt, verworfen, eselsbruecken, saetze };
}

/* ---------- Ein einzeln freigeschaltetes Wort aus einem Buch, das er NICHT gewählt hat (20.10.2026) ----

   Elias in derselben Nacht zweimal, je mit einem Bild aus seinem Buch: „ich brauche
   daifun also schwach als vokabel" (01:56) und „spielplatz also al mulab brauche ich
   auch als vokabel." (02:09). Beide Karten gibt es — ḍaʿīf in Bayna Yadayk 2, Kapitel 2,
   malʿab in Madina 2, Kapitel 32 —, aber keines der beiden Bücher hat er gewählt.

   ⛔ Die App lud bis dahin NUR die gewählten Bücher (aktiveBuecher()). Ein einzeln
   freigeschaltetes Wort aus einem anderen Buch stand deshalb nie in VOCAB_DATA: die
   Freischaltung war gespeichert und wirkte nicht. Gemessen im Nachbau mit seinem Stand
   (20.10.2026): vt_einzeln_frei["46549"] gesetzt, VOCAB_DATA ohne 46549. Alle 37 Wörter,
   die er bis dahin einzeln freigeschaltet hatte, stammen aus Madina 1 und Bayna Yadayk 1
   — der Fall war schlicht noch nie vorgekommen.

   Alles Weitere stand schon bereit: istBekannt() lässt ein einzeln freies Wort durch,
   und passtZurAuswahl() behandelt es bei einem nicht gewählten Buch wie seine eigenen
   Wörter (wieEigene, sein Satz vom 07.09.2026). Es fehlte nur das Laden.

   ⭐ Welches Buch ein Wort enthält, steht nirgends — deshalb werden die übrigen Bücher
   der Reihe nach geladen, bis jedes fehlende Wort gefunden ist. Kosten fallen nur an,
   wenn wirklich eines fehlt; die Dateien liegen im Vorrat des Service Workers (sw.js,
   seit v515). Gesucht wird nur nach Buchkennungen (nur Ziffern): eine Mehrzahlkarte
   (…#pl) entsteht erst später beim Start, und eine Kennung, die es in keinem Buch gibt,
   kostete sonst bei jedem Start alle Bücher.
   ⛔ Eingehängt wird NUR das freigeschaltete Wort, nie der Rest des Buchs — sein Satz
   vom 20.08.2026: „ich möchte aber nur die vereinzelnen wörter haben ohne den rest des
   kapitels zu haben". Die Marke `einzelnGeladen` hält es aus der Kapitelvorschau des
   Buchs heraus (kapitelDesBuchs unten): sonst zeigte Bayna Yadayk 2 nur noch Kapitel 2.
   Danach dieselbe Nachbearbeitung wie in einhaengen(): Eselsbrücken, Schreibweisen,
   Beispielsätze. Bewacht von werkzeuge/pruefe-einzeln-fremdbuch.mjs. */
async function einzelneAusAnderenBuechern(){
  if (typeof EINZELN === 'undefined' || !EINZELN) return 0;
  const da = new Set(VOCAB_DATA.map(w => String(w.id)));
  const fehlen = new Set(Object.keys(EINZELN).filter(id =>
    /^\d+$/.test(id) && EINZELN[id] && EINZELN[id].an && !da.has(id)));
  if (!fehlen.size) return 0;
  const gewaehlt = new Set(aktiveBuecher());
  const andere = (typeof BUECHER !== 'undefined' && Array.isArray(BUECHER) ? BUECHER : [])
    .map(b => b.slug).filter(s => s && !gewaehlt.has(s) && s !== KORAN_BUCH);
  const neu = [];
  for (const slug of andere){
    if (!fehlen.size) break;
    let liste;
    try { liste = await ladeBuchDatei(slug); }
    catch (e){ continue; }   /* gewollt still: ein fehlendes Buch hat dieses Wort eben nicht */
    (liste || []).forEach(roh => {
      const id = String(roh.id);
      if (!fehlen.has(id) || BUCHDUBLETTEN_AUSBLENDEN.has(id)) return;
      neu.push(roh); fehlen.delete(id);
    });
  }
  if (!neu.length) return 0;
  VOCAB_DATA.push(...neu.map(roh => Object.assign({}, roh, { einzelnGeladen: true })));
  eselsbrueckenNachtragen(neu);
  eselsbrueckenErsetzen();
  schreibweisenErsetzen();
  saetzeNachtragen(neu);
  return neu.length;
}

/* ---------- Beispielsaetze fuer die Buchvokabeln nachtragen ----------

   Dieselbe Bauart und derselbe Grund wie bei den Eselsbruecken darunter:
   data/vokabeln-*.js wird neu erzeugt, alles Handgeschriebene waere weg.
   Deshalb liegen die Saetze in data/beispielsaetze.js und werden hier
   angewandt, gleich nachdem ein Buch eingehaengt wurde.

   ⚠️ NUR wo noch keiner steht — vorhandenes gewinnt. Die 171 Woerter aus
   vocab-data.js bringen ihren Satz aus der arabicroots-Datenbank mit; der
   darf nicht ueberschrieben werden.

   ⚠️ NACH dem Einhaengen, nicht davor: die frisch per VOCAB_DATA.push()
   dazugekommenen Woerter sollen ihren Satz ja auch bekommen. */
function saetzeNachtragen(liste){
  if (typeof BEISPIELSAETZE === 'undefined') return 0;
  const nachId = new Map(VOCAB_DATA.map(w=>[String(w.id), w]));
  let n = 0;
  liste.forEach(roh=>{
    const w = nachId.get(String(roh.id));
    if (!w || w.sentAr) return;
    const s = BEISPIELSAETZE[String(roh.id)];
    if (s && s.sentAr){ w.sentAr = s.sentAr; if (s.sentDe) w.sentDe = s.sentDe; n++; }
  });
  return n;
}

/* ---------- Eselsbruecken fuer die Buchvokabeln nachtragen ----------

   Die 171 Lernwoerter aus vocab-data.js tragen ihr `mnemo` direkt am Eintrag.
   Fuer die Buchvokabeln geht das nicht: data/vokabeln-*.js wird von
   hole-vokabeln.mjs neu erzeugt (alles Handgeschriebene waere beim naechsten
   Abzug weg), und vocab-data.js scheidet aus, weil LERNBESTAND_IDS
   (js/kern.js) daran die Kapitelfreischaltung haengt - 140 neue Eintraege
   dort wuerden als "kennt er schon" gelten.

   Deshalb liegen sie getrennt in data/eselsbruecken.js und werden hier
   angewandt, gleich nachdem ein Buch eingehaengt wurde.

   ⚠️ NUR wo noch keine steht. Dieselbe Regel wie oben in einhaengen():
   Vorhandenes gewinnt. Sonst koennte eine Buch-Eselsbruecke die handverlesene
   aus vocab-data.js ueberschreiben - und zwar unbemerkt, weil beide Felder
   gleich heissen und gleich aussehen.

   ⚠️ Die Karte wird NACH dem Einhaengen gebaut, nicht davor: die frisch per
   VOCAB_DATA.push() dazugekommenen Woerter sollen ihre Eselsbruecke ja auch
   bekommen. Mit einer vorher gebauten Karte waeren genau die leer ausgegangen -
   also gerade die 140, um die es geht. */
/* ⛔ DER UMGEKEHRTE FALL: einen VORHANDENEN Merkhaken ersetzen (07.09.2026).
   Die Funktion darunter traegt nur nach, wo nichts steht — richtig so. Elias
   hat sich aber zwei Merkhaken selbst in die App geschrieben, die seine eigene
   Regel brechen (hoechstens vier arabische Woerter am Stueck). Sie liegen in
   seinem Geraetespeicher, wo kein Werkzeug herankommt; ohne diese Ersetzung
   waeren die kuerzeren Fassungen geschrieben und nie angezeigt.

   ⚠️ Die Liste in data/eselsbruecken.js waechst NUR durch seine Zustimmung —
   sie ueberschreibt selbst geschriebenen Text. Jeder Eintrag dort nennt Grund
   und Datum. */
function eselsbrueckenErsetzen(){
  if (typeof ESELSBRUECKEN_ERSATZ === 'undefined') return 0;
  let n = 0;
  VOCAB_DATA.forEach(w => {
    const text = ESELSBRUECKEN_ERSATZ[String(w.id)];
    if (text && w.mnemo !== text){ w.mnemo = text; n++; }
  });
  return n;
}

/* ⛔⛔ KORRIGIERTE SCHREIBWEISEN — dieselbe Bauform wie eselsbrueckenErsetzen().
 *
 * Elias' eigene Vokabeln kommen aus dem arabicroots-Abzug und aus seinem
 * Geraetespeicher; beide werden bei jedem Abzug neu geschrieben. Eine
 * Korrektur dort waere beim naechsten hole-vokabeln.mjs spurlos weg.
 * `FELD_ERGAENZUNGEN` fuellt nur LEERE Felder und greift hier nicht.
 *
 * ⚠️ ZWEI Felder je Eintrag, nicht eines: dasselbe Wort steht in `ar` UND
 * im Beispielsatz `sentAr`. Nur `ar` zu aendern hiesse, dass Karte und Satz
 * verschieden schreiben — und der Satz ist genau die Stelle, an der Elias
 * die Schreibung im Zusammenhang sieht.
 *
 * ⚠️ Die Liste in data/eselsbruecken.js waechst NUR durch seine Zustimmung.
 */
function schreibweisenErsetzen(){
  if (typeof SCHREIBWEISEN === 'undefined') return 0;
  let n = 0;
  VOCAB_DATA.forEach(w => {
    const e = SCHREIBWEISEN[String(w.id)];
    if (!e) return;
    if (e.ar && w.ar !== e.ar){ w.ar = e.ar; n++; }
    /* Der Satz wird nur an DER Stelle geaendert, die genannt ist — nie der
       ganze Satz ersetzt. Sonst traegt eine spaetere Satzaenderung von ihm
       die alte Fassung zurueck. */
    if (e.sentArVon && e.sentArNach && typeof w.sentAr === 'string'
        && w.sentAr.includes(e.sentArVon)){
      w.sentAr = w.sentAr.split(e.sentArVon).join(e.sentArNach); n++;
    }
    /* ⛔ UND DIE MARKIERUNGEN AN DIESEM SATZ (19.10.2026). Bis dahin blieb ihr
       matchText bei der alten Schreibung stehen — und js/saetze.js sucht ihn
       mit einem rohen indexOf() im Satz. Die Markierung war damit unsichtbar,
       ohne jede Meldung: gefunden hat es pruefe-oberflaeche.js in der laufenden
       App (aiḍan, tanwin-fath-alif-01), nicht pruefe-markierungen.js, das die
       Dateien liest und die Ersetzung nicht kennt. Eine Schreibung, die er
       bestätigt hat, gilt für Satz UND Markierung.
       [[entscheidung_gilt_fuer_das_zweite_werkzeug]] */
    const marken = (e.sentArVon && e.sentArNach && typeof SENTENCE_TAGS !== 'undefined')
      ? SENTENCE_TAGS[String(w.id)] : null;
    if (Array.isArray(marken)) marken.forEach(t => {
      if (t && typeof t.matchText === 'string' && t.matchText.includes(e.sentArVon)){
        t.matchText = t.matchText.split(e.sentArVon).join(e.sentArNach); n++;
      }
    });
    /* Auch die Singularform, falls sie dieselbe Schreibung traegt. */
    if (e.ar && w.sg === e.sentArVon){ w.sg = e.ar; n++; }
  });
  return n;
}

function eselsbrueckenNachtragen(liste){
  if (typeof BUCH_ESELSBRUECKEN === 'undefined') return 0;
  const nachId = new Map(VOCAB_DATA.map(w=>[String(w.id), w]));
  let n = 0;
  liste.forEach(roh=>{
    const w = nachId.get(String(roh.id));
    if (!w || w.mnemo) return;
    const text = BUCH_ESELSBRUECKEN[String(roh.id)];
    if (text){ w.mnemo = text; n++; }
  });
  return n;
}

/* ---------- „Koran häufigste": nicht doppelt, und auf demselben Stand (11.10.2026) ----------

   Sein Satz: „wörter die ich bereits kann sollen nicht doppelt kommen also wenn sie
   bereits freigeschalten wurden. häufigsten wörter die ich bereits kann bzw kenne als
   kapiteln oder so sollen auf den selben stand gebracht werden"

   Zu jedem Wort der Gruppe nennt die Liste die Karten seiner Bücher, die DASSELBE Wort
   sind (`gleich` — von Hand geprüft, nur Kennungen). Daraus wird je Wort EINE Karte,
   die für es steht:

   1. Eine dieser Buchkarten hat Fortschritt → sie steht für das Wort. Das ist Satz 1
      seiner Grundregel vom 16.09.2026 (bei hatFortschritt() in js/kern.js): „wenn zwei
      identisch sind und eines davon aber fortschritt hat dann sollte man immer das
      behalten was fortschritt hat".
   2. Sonst: eine dieser Buchkarten kennt er (istBekannt(): Kapitel freigeschaltet,
      einzeln frei, Lernbestand) → sie steht für das Wort. Sein „wenn sie bereits
      freigeschalten wurden".
   3. Sonst: eine seiner EIGENEN Karten ist dasselbe Wort → sie steht für das Wort
      (im Code als 4. Stufe; MEINE Bauart — sein „kenne als kapiteln oder so").
   4. Sonst steht die Karte der Gruppe selbst.

   Steht eine Buchkarte für das Wort, fällt die Karte der Gruppe aus VOCAB_DATA: so
   kommt nichts doppelt, und die Gruppe zeigt für dieses Wort seinen Stand aus dem
   Kapitel — dieselbe Karte, dieselbe Box („auf den selben stand").
   Hat er ein Wort ZUERST in der Gruppe gelernt und schaltet sein Kapitel später frei,
   wandert der Stand der Gruppenkarte einmal auf die Kapitelkarte (die höhere Box
   gewinnt — sein „ja" vom 22.09.2026, bei uebertrageFortschritt()), und die
   Gruppenkarte fällt weg. Das ist Satz 3 der Grundregel, dort für seine eigenen
   Wörter gesagt: „das was im kapitel ist bevorzugen und auf den gleichen stand
   bringen". Dass er auch für die Gruppe gilt, ist MEINE Lesart seines Satzes von heute.

   ⚠️ Nur über GELADENE Karten. Steht dasselbe Wort in einem Buch, das er nicht gewählt
      hat, ist dessen Karte nicht da — dann steht die Karte der Gruppe, bis er das Buch
      wählt.
   ⚠️ Der Lauf stellt den Bestand in BEIDE Richtungen her: kennt er eine Buchkarte nicht
      mehr (Kapitel abgehakt, kein Fortschritt), kommt die Karte der Gruppe zurück.
   ⚠️ VOR blendeKapitelDublettenAus(): die entscheidet nach Schreibung und Bedeutung
      und behielte eine Gruppenkarte mit Fortschritt statt der Kapitelkarte, die er
      eben freigeschaltet hat.
   ⛔ Seine Auswahl und „einzeln frei" fasst der Lauf nicht an. Eine Buchkarte mit
      Fortschritt aus einem nicht angehakten Kapitel wird über koranVertritt() erreichbar,
      solange er die Gruppe gewählt hat — nicht über einen Eintrag in seinen Daten.
   Geprüft von test-koran-haeufig.mjs, mit Störtests. */
const KORAN_KARTE = new Map();   /* Kennung der Karte, die für ein Wort der Gruppe steht → Eintrag der Liste */

function koranKartenEinordnen(){
  /* Leer heißt auch: koranVertritt() redet während des Laufs nicht mit — sonst gälte
     eine Karte als bekannt, nur weil sie beim letzten Lauf für ein Wort stand. */
  KORAN_KARTE.clear();
  const bericht = { vertreten: 0, eigene: 0, uebertragen: [] };
  const liste = koranListe();
  if (!liste.length) return bericht;
  const nachId = new Map(VOCAB_DATA.map(w => [String(w.id), w]));
  const geladen = GELADENE_BUECHER.has(KORAN_BUCH);
  const steht = new Map(), weg = new Set(), zurueck = [];
  const seine = VOCAB_DATA.filter(w => w && w.chapter === 'personal' && w.ar);
  for (const e of liste){
    const kand = (e.gleich || []).map(id => nachId.get(String(id))).filter(Boolean);
    const ziel = kand.find(w => hatFortschritt(w.id)) || kand.find(w => istBekannt(w))
      /* 4. Sonst: eine SEINER eigenen Karten ist dasselbe Wort (dieselbe Schreibung und
         Bedeutung, gemessen wie beim Tausch — dubletteImBuch() in js/kern.js). Dann
         steht sie für das Wort. Sie wird NICHT gegen die Karte der Gruppe getauscht:
         an ihr hängen sein Stand, seine Notiz, seine Eselsbrücke. */
      || seine.find(w => {
        const endung = w.type === 'particle' || e.type === 'particle';
        const artikel = !endung && w.type !== 'verb' && e.type !== 'verb';
        return dubGleich(e.ar, w.ar, endung, artikel) && dubBedeutungGleich(w, e);
      });
    const eigene = nachId.get(String(e.id));
    if (ziel){
      steht.set(String(ziel.id), e);
      bericht.vertreten++;
      if (!eigene) continue;
      if (hatFortschritt(e.id)){
        const alt = Object.assign({}, PROGRESS[String(e.id)]);
        const was = uebertrageFortschritt(e.id, ziel.id, true);
        /* Auch wenn nichts wanderte (die Kapitelkarte steht höher): der Stand der
           Gruppenkarte ist damit erledigt. Ohne den Vermerk käme er bei jedem Start
           wieder — die Begründung steht bei merkeUebertragen() in js/kern.js. */
        merkeUebertragen(e.id, ziel.id, alt);
        bericht.uebertragen.push({ von: String(e.id), nach: String(ziel.id), wort: ziel.ar, was });
      }
      weg.add(String(e.id));
    } else if (eigene){
      steht.set(String(e.id), e);
      bericht.eigene++;
    } else if (geladen){
      zurueck.push(e);
    }
  }
  if (weg.size) for (let i = VOCAB_DATA.length - 1; i >= 0; i--) if (weg.has(String(VOCAB_DATA[i].id))) VOCAB_DATA.splice(i, 1);
  if (zurueck.length){
    const ids = new Set(zurueck.map(e => String(e.id)));
    einhaengen(koranKarten().filter(k => ids.has(String(k.id))));
    let neu = false;
    for (const e of zurueck){
      steht.set(String(e.id), e);
      bericht.eigene++;
      if (!PROGRESS[e.id]){ PROGRESS[e.id] = { box: 1, nextReview: todayStr(0), correct: 0, wrong: 0 }; neu = true; }
    }
    if (neu) saveProgress();
  }
  for (const [id, e] of steht) KORAN_KARTE.set(id, e);
  return bericht;
}

/* Steht diese BUCHKARTE gerade für ein Wort der Gruppe, das er dort gewählt hat? Dann
   gehört sie in seine Auswahl, auch wenn ihr eigenes Kapitel nicht angehakt ist — sonst
   fehlte der Gruppe genau das Wort, das er schon kann. Gelesen von istBekannt() und
   passtZurAuswahl() in js/kern.js. */
function koranVertritt(w){
  if (!w || w.book === KORAN_BUCH || !KORAN_KARTE.size || !buchGewaehlt(KORAN_BUCH)) return false;
  const e = KORAN_KARTE.get(String(w.id));
  if (!e) return false;
  const stuecke = kapitelAuswahl(KORAN_BUCH);
  return !stuecke.length || stuecke.map(Number).indexOf(Number(e.kap)) >= 0;
}

/* ⛔ KEINE ZEILE „N-MAL IM KORAN" AUF DER KARTE (11.10.2026). Sie stand in meinem
   Beispiel, zu dem er Ja gesagt hatte, und war schon gebaut (klein, auf der Rückseite).
   Elias, als ich meldete, dass ich sie gerade baue: „das sollst du nicht bauen, ist
   glaube unnötig". Dasselbe hatte er am 21.08.2026 zur Häufigkeit der Wurzel gesagt
   (der Satz steht in js/lernen.js). Wer sie wieder einbauen will, fragt ihn vorher.
   Die Häufigkeit steht weiter in werkzeuge/koran-haeufig-liste.txt — aus ihr kommt
   die Reihenfolge. */

/* Ein Buch in die Auswahl aufnehmen oder herausnehmen. Das ist der Weg, den
   die Knoepfe auf der Startseite gehen.

   ⚠️ Das letzte Buch laesst sich nicht abwaehlen. Sonst stuende die App ohne
   jede Vokabel da - und der Weg zurueck waere derselbe Knopf, den man gerade
   ausgeschaltet hat. */
async function schalteBuch(slug){
  if (!buchInfo(slug)) { toast(`Buch "${slug}" gibt es nicht.`); return; }
  const karte = SETTINGS.buecher || (SETTINGS.buecher = {});
  if (buchGewaehlt(slug)){
    if (aktiveBuecher().length < 2){
      toast('Mindestens ein Buch muss ausgewaehlt bleiben.');
      return;
    }
    delete karte[slug];
    saveSettings();
    nachAuswahlwechsel();
    return;
  }
  await setzeBuch(slug);
}

/* Alles, was nach einer Aenderung der Buch- oder Kapitelauswahl nachgezogen
   werden muss. Frueher stand diese Folge dreimal fast gleich im Code; beim
   Kapitelfilter fehlte dabei einmal das Mitziehen der laufenden Runde, was
   Elias am 30.07.2026 gemeldet hat. */
function nachAuswahlwechsel(){
  /* ⭐ Zuerst die Gruppe „Koran häufigste" neu einordnen (11.10.2026): mit der Auswahl
     ändert sich, welche Wörter er schon kennt — und davon hängt ab, ob für ein Wort
     die Karte der Gruppe steht oder seine Kapitelkarte (koranKartenEinordnen() oben). */
  koranKartenEinordnen();
  renderHome();
  if (typeof passeRundeAnAuswahlAn === 'function') passeRundeAnAuswahlAn();
  if (typeof renderCategories === 'function') renderCategories();
  /* ⛔ EINE LAUFENDE UEBUNG MUSS ENDEN — dieselbe Begruendung, die in
     setzeThema() (js/saetze.js) schon steht, nur fuer die andere Ursache:
     "Der Themenwechsel tauscht den Vorrat aus, aus dem die Uebungsaufgaben
     gebaut werden. Eine laufende Uebung waere danach eine Aufgabe zu einem
     Satz, der nicht mehr im Thema steht."
     Die Buchauswahl tauscht denselben Vorrat aus. Am 20.08.2026 im Browser
     gemessen: Uebung "kasus" mit 637 Aufgaben gestartet (Kapitel 1-15), dann
     Kapitel 12-15 abgewaehlt -> die Uebung lief unveraendert weiter, und
     82 ihrer Aufgaben zeigten auf Saetze, die gar nicht mehr im Vorrat waren.
     Die allererste war eine davon. */
  if (typeof uebungBeenden === 'function' && typeof UEB !== 'undefined' && UEB.modus) uebungBeenden();
  if (typeof openSentences === 'function' && document.querySelector('[data-screen="sentences"].active')) openSentences();
}

/* Buch laden und in die Auswahl aufnehmen. Laedt bei Bedarf nach, traegt
   fehlende Fortschrittseintraege nach und baut die Oberflaeche neu auf. */
async function setzeBuch(slug, still){
  if (!buchInfo(slug)) { toast(`Buch "${slug}" gibt es nicht.`); return; }
  if (!GELADENE_BUECHER.has(slug)){
    if (!still) toast('Lade ' + buchTitel(slug) + ' …');
    try {
      const liste = await ladeBuchDatei(slug);
      const { neu } = einhaengen(liste);
      GELADENE_BUECHER.add(slug);
      /* ⭐ „Koran häufigste" gleich einordnen (11.10.2026), VOR den Einträgen darunter:
         ein Wort, das er aus einem Kapitel kennt, bekommt so gar nicht erst eine
         zweite Karte samt Eintrag. Nur beim Antippen — beim Start (`still`) sind noch
         nicht alle Bücher da; dort läuft es einmal, wenn der Bestand steht. */
      const koran = still ? null : koranKartenEinordnen();
      /* Neue Vokabeln brauchen einen Fortschrittseintrag, sonst tauchen sie
         in "Jetzt lernen" nie auf - derselbe Fehler wie frueher beim
         Kapitel-Backfill. */
      VOCAB_DATA.forEach(w=>{
        if (!PROGRESS[w.id]) PROGRESS[w.id] = { box: w.box || 1, nextReview: todayStr(0), correct:0, wrong:0 };
      });
      saveProgress();
      if (!still && slug === KORAN_BUCH){
        /* Die Zahl, die stimmt: was er aus seinen Kapiteln kennt, kommt nicht neu dazu. */
        toast(`${buchTitel(slug)}: ${koran.eigene} neue Wörter`
          + (koran.vertreten ? `, ${koran.vertreten} kennst du schon.` : '.'));
      } else if (!still) toast(`${buchTitel(slug)}: ${neu} neue Vokabeln.`);
    } catch (e){
      /* Nicht nur melden, sondern merken: ein Buch, dessen Datei fehlt, hat
         in der Auswahl nichts verloren. Sonst steht dort ein Knopf, der bei
         jedem Antippen dieselbe Fehlermeldung bringt. */
      BUCH_FEHLT.add(slug);
      renderBuchChips();
      if (!still) toast(buchTitel(slug) + ' ist gerade nicht verfuegbar.');
      return;
    }
  }
  /* Neu in der Auswahl heisst: alle Kapitel dieses Buchs. Die Kapitelauswahl
     gilt immer nur innerhalb eines Buchs - Kapitel 3 in Madina 1 hat mit
     Kapitel 3 in Bayna Yadayk nichts zu tun.
     ⚠️ Eine schon vorhandene Auswahl wird NICHT ueberschrieben: setzeBuch()
     laeuft auch beim Start ueber jedes gemerkte Buch, und dabei duerfen seine
     Kapitel nicht verlorengehen. */
  if (!SETTINGS.buecher || typeof SETTINGS.buecher !== 'object') SETTINGS.buecher = {};
  if (!Array.isArray(SETTINGS.buecher[slug])) SETTINGS.buecher[slug] = [];
  saveSettings();
  if (!still) nachAuswahlwechsel();
}

/* Anzeigenamen. Die Datenbank fuehrt nur Kuerzel wie "bayna-yadayk-2"; das
   ist als Beschriftung unbrauchbar. */
const BUCH_TITEL = {
  'madina-1': 'Madina 1', 'madina-2': 'Madina 2', 'madina-3': 'Madina 3',
  'bayna-yadayk-1': 'Bayna Yadayk 1', 'bayna-yadayk-2': 'Bayna Yadayk 2',
  'bayna-yadayk-3': 'Bayna Yadayk 3', 'bayna-yadayk-4': 'Bayna Yadayk 4',
  'quran': 'Quran',
  /* Sein Name für die Gruppe (11.10.2026): „kürze den namen auf Koran häufigste". */
  'koran-haeufig': 'Koran häufigste'
};
function buchTitel(slug){ return BUCH_TITEL[slug] || slug; }

/* Kurzform fuer enge Stellen, vor allem den Kapitel-Chip auf der Lernkarte.
   Elias am 24.09.2026 (Bildschirmfoto, „Kap. 1" rot umrandet): „hier steht
   kapitel 1 aber von was? von welchem buch? da ich jetzt an zwei büchern
   arbeite und in zukunft noch mehr sollte das auch immer dabei stehen aber
   halt in kurzform".
   ⛔ Jedes Buch aus data/buecher.js braucht hier einen Eintrag - sonst stuende
   der lange Titel im Chip und schoebe die Kapitelzahl in die Auslassungspunkte.
   Bewacht von werkzeuge/pruefe-buecher-aktuell.mjs (B4). */
const BUCH_KURZ = {
  'madina-1': 'M1', 'madina-2': 'M2', 'madina-3': 'M3',
  'bayna-yadayk-1': 'BY1', 'bayna-yadayk-2': 'BY2',
  'bayna-yadayk-3': 'BY3', 'bayna-yadayk-4': 'BY4',
  'quran': 'Quran',
  'koran-haeufig': 'Koran'
};
function buchKurz(slug){ return BUCH_KURZ[slug] || buchTitel(slug); }

/* Alle Vokabeln der gewaehlten Buecher plus die eigenen. Ueberall dort zu
   benutzen, wo frueher direkt ueber VOCAB_DATA gelaufen wurde - sonst zaehlen
   Kategorien und Statistik Woerter mit, die gerade gar nicht gelernt werden.
   Eigene Vokabeln laufen bewusst in jeder Auswahl mit. */
function buchVokabeln(){
  const gewaehlt = new Set(aktiveBuecher());
  /* ⭐ Die fuenfzehn Fachbegriffe aus dem Unterricht (data/fachbegriffe.js)
     tragen seit dem 20.08.2026 chapter 'personal' und brauchen deshalb keine
     eigene Bedingung mehr. Elias: „ich finde die kategorie ,,fachbegriffe"
     unnötig. ich möchte das all diese begriffe und zukünftige einfach als
     meine eigenen begriffe gelten."
     ⚠️ Ihr `book` ist weiterhin 'grammar' — daran haengen der Fachbegriff-Takt
     im Lernmodus und der Hoermodus. Die Herkunft bleibt, die Zugehoerigkeit
     wechselt. */
  /* ⭐ `einzelnGeladen` (20.10.2026): ein einzeln freigeschaltetes Wort aus einem Buch, das
     er nicht gewählt hat (ḍaʿīf, malʿab — einzelneAusAnderenBuechern()). Ohne diese
     Bedingung stand es im Nachbau mit seinem Stand in der Lernrunde (passtZurAuswahl: ja),
     aber in KEINER Liste, die hierüber läuft: Kategorien, Hörmodus, Statistik, Wortfelder. */
  return VOCAB_DATA.filter(w => gewaehlt.has(w.book)
                             || w.chapter === 'personal'
                             || w.einzelnGeladen === true);
}

/* Alle Kapitelnummern des aktiven Buchs, aufsteigend. Fuer Madina 1 tragen
   die ersten neun Kapitel einen sprechenden Namen (CHAPTER_NAMES); in den
   uebrigen Buechern gibt es den nicht, dort steht nur die Nummer. */
function kapitelDesBuchs(slug){
  const s = slug || aktivesBuch();
  const info = buchInfo(s);
  /* ⚠️ ALLE Kapitel, die geladen sind - hier wird NICHT auf die freigeschalteten
     eingeengt. Am 30.07.2026 stand hier kurz eine solche Sperre, und Elias hat
     sie sofort zurueckgenommen: "es sollten alle kapitel zur verfuegung stehen."

     Warum sie ueberhaupt entstand: Er hatte gemeldet, dass Kapitel 24 ploetzlich
     auftauchte. Die Ursache war aber NICHT die Kapitelliste, sondern ich - die
     neun Zahlen, die er angefordert hatte, trugen `chapter: 24`, und damit galt
     das Kapitel als vorhanden. Das ist behoben (die Zahlen stehen auf
     'personal'); die Sperre hier war die falsche zweite Haelfte und ist weg.

     Die Lehre: erst die Ursache beheben, dann pruefen, ob die zweite Massnahme
     noch gebraucht wird. Hier wurde beides gleichzeitig gemacht, und die zweite
     hat ihm etwas weggenommen, was er wollte.

     FREIGESCHALTET (js/kern.js) gilt weiterhin - aber nur fuer die Frage, welche
     WOERTER in den Wortfeldern und im Vorrat der eigenen Kategorien stehen. Das
     ist eine andere Frage als die, welche Kapitel er lernen darf. */
  /* ⚠️ „Koran häufigste" (11.10.2026): die Stücke kommen aus der Liste, nicht aus
     VOCAB_DATA. Dort fehlen die Karten, für die eine Kapitelkarte steht
     (koranKartenEinordnen()) — kennt er einmal alle Wörter eines Stücks, verschwände
     sonst dessen Knopf, und mit ihm der Weg, das Stück an- oder abzuhaken.
     Der Name steht als Text, weil Prüfstände nur diese Funktion aus dem Quelltext
     schneiden (pruefe-vokabeln-seite.mjs wurde sonst rot: „KORAN_BUCH is not defined"). */
  if (s === 'koran-haeufig') return info ? Array.from({length: info.kapitel}, (_,i)=>i+1) : [];
  /* `einzelnGeladen`: ein einzeln freigeschaltetes Wort aus einem nicht gewählten Buch
     (einzelneAusAnderenBuechern()) sagt nichts darüber, welche Kapitel das Buch hat. */
  const vorhanden = [...new Set(VOCAB_DATA.filter(w=>w.book===s && typeof w.chapter==='number' && !w.einzelnGeladen)
    .map(w=>w.chapter))].sort((a,b)=>a-b);
  /* Was tatsaechlich geladen ist, gilt. Die Zahl aus dem Verzeichnis ist nur
     die Vorschau fuer ein Buch, das noch nicht angetippt wurde - stuende sie
     auch danach da, zeigte die App Kapitel an, hinter denen nichts liegt. */
  if (vorhanden.length) return vorhanden;
  if (GELADENE_BUECHER.has(s) || BUCH_FEHLT.has(s)) return [];
  return info ? Array.from({length: info.kapitel}, (_,i)=>i+1) : [];
}

function renderBuchChips(){
  const ziel = document.getElementById('bookFilterChips');
  /* ⚠️ Weiter NUR mit Verzeichnis: ohne BUECHER (kein data/, kein Paket) blieb die
     Zeile bisher unberührt — die Gruppe „Koran häufigste" allein ändert daran nichts. */
  if (!ziel || typeof BUECHER === 'undefined') return;
  /* Die Ueberschrift steht fest in index.html und muss mitverschwinden. Sonst
     bleibt sie ueber einer leeren Zeile stehen und die Startseite sieht kaputt
     aus - genau so war es live, solange data/ nicht ausgeliefert wird. */
  const beschriftung = document.getElementById('bookFilterLabel');
  const sichtbar = alleBuecher().filter(b => !BUCH_FEHLT.has(b.slug));
  /* Bleibt nur ein Buch uebrig, ist die Auswahlzeile ueberfluessig. */
  if (sichtbar.length < 2){
    ziel.innerHTML = '';
    if (beschriftung) beschriftung.classList.add('hidden');
    return;
  }
  if (beschriftung) beschriftung.classList.remove('hidden');
  ziel.innerHTML = sichtbar.map(b=>{
    const geladen = GELADENE_BUECHER.has(b.slug);
    const an = buchGewaehlt(b.slug);
    /* aria-pressed statt nur einer Klasse: die Knoepfe schalten jetzt
       mehrere Zustaende gleichzeitig, das ist keine Auswahl aus einer Reihe
       mehr, sondern eine Ansammlung von Schaltern. */
    return `<button class="chip-toggle${an?' active':''}" data-buch="${b.slug}" aria-pressed="${an}"
      title="${b.vokabeln} Vokabeln, ${b.kapitel} Kapitel${geladen?'':' – wird beim Antippen geladen'}">${buchTitel(b.slug)}</button>`;
  }).join('');
}

document.addEventListener('click', (e)=>{
  const b = e.target.closest('[data-buch]');
  if (b) schalteBuch(b.dataset.buch);
});

/* Beim Start das zuletzt gewaehlte Buch nachladen - auch Madina 1, denn
   vocab-data.js deckt davon nur die Kapitel 1 bis 9 ab. Ohne diesen Aufruf
   stand nach einem Neustart zwar das richtige Buch in den Einstellungen,
   geladen war es aber nicht: die App zeigte dann ausser den eigenen Vokabeln
   nichts an und sah kaputt aus. `still` unterdrueckt die Meldungen - beim
   normalen Start soll nichts aufblitzen. */
/* ⭐⭐ STARTBESTAND_BEREIT (23.09.2026): erfüllt, sobald der Handler unten durch ist
   — Bücher, eigene Vokabeln, Tausch, Fachbegriffe mit Buchkarte, Kapiteldubletten.
   Erst dann baut „Jetzt lernen" eine Runde oder setzt eine fort
   (lernenBeginnen() in js/lernen.js). Vorher war der Bestand halb, und eine Runde
   aus dieser Zeit verlor beim nächsten Öffnen Karten. Elias, 02:53: „warum ist
   hier von 8? ich hatte von 10 eingestellt". */
let startbestandFertig = () => {};
const STARTBESTAND_BEREIT = new Promise(fertig => { startbestandFertig = fertig; });

document.addEventListener('DOMContentLoaded', async ()=>{
  /* Erst das im Geraet abgelegte Vokabelpaket einhaengen, dann das Buch
     aufbauen. Ohne dieses Warten liefe setzeBuch() gegen ein noch leeres
     window.VOKABELN und meldete das Buch als fehlend - obwohl es Sekunden
     spaeter dagewesen waere. Siehe js/vokabelpaket.js. */
  if (typeof PAKET_BEREIT !== 'undefined') await PAKET_BEREIT;
  /* ⛔ Beide Umstellungen in EINER Zeile, sonst haette die zweite keinen
     Aufrufer und liefe nie. */
  if ([stelleBuchauswahlUm(), eigeneChipNachziehen()].some(Boolean)) saveSettings();
  /* ALLE gemerkten Buecher laden, nicht nur eines. Nacheinander und nicht
     ueber Promise.all: einhaengen() schreibt in dieselbe Liste VOCAB_DATA und
     baut sich dafuer jedes Mal einen Index darueber auf - zwei gleichzeitige
     Laeufe wuerden mit einem veralteten Index arbeiten. */
  const slugs = aktiveBuecher();
  for (const s of slugs) await setzeBuch(s, true);

  /* ---------- Eigene Vokabeln von arabicroots (C8, 18.08.2026) ------------

     Sie stehen in data/vokabeln-eigene.js und tragen `chapter:'personal'`, also
     erscheinen sie in der Kapitelliste ganz oben unter „Eigene Vokabeln" -
     genau dort, wo er sie sucht. Die Datei wird nachgeladen wie die Buecher;
     fehlt sie (Deploy ohne --mit-daten), laeuft die App unveraendert weiter.

     ⚠️ Die ausgeblendeten ueberspringen. Ohne diese Zeile kaeme ein geloeschtes
     Wort beim naechsten Start wieder - und das Loeschen waere eine
     Scheinfunktion, die niemandem auffaellt, weil sie im Moment des Klickens
     richtig aussieht. */
  await new Promise(fertig => {
    if (window.EIGENE_VOKABELN) return fertig();
    const s = document.createElement('script');
    s.src = 'data/vokabeln-eigene.js';
    s.onload = fertig; s.onerror = fertig;
    document.head.appendChild(s);
  });
  if (Array.isArray(window.EIGENE_VOKABELN)){
    const wegRoh = LS.get('vt_geloescht', {});
    const weg = (wegRoh && typeof wegRoh === 'object' && !Array.isArray(wegRoh)) ? wegRoh : {};
    const da = new Set(VOCAB_DATA.map(w => String(w.id)));
    const neu = window.EIGENE_VOKABELN.filter(w =>
      !da.has(String(w.id)) && !(weg[w.id] && weg[w.id].an));
    if (neu.length) VOCAB_DATA.push(...neu.map(w => Object.assign({}, w)));
  }

  /* ⛔⛔ AUCH DIE SELBST ANGELEGTEN WOERTER — sonst kommt keine Eselsbruecke
     bei ihnen an.

     eselsbrueckenNachtragen() lief bis zum 20.08.2026 NUR mit der Buchliste
     (einhaengen(), Zeile 255). Woerter aus vt_personalVocab stehen aber in
     keiner Buchliste — js/kern.js:245 schiebt sie direkt in VOCAB_DATA. Ein
     Eintrag in data/eselsbruecken.js unter ihrer `p_…`-Id waere also
     geschrieben, gespeichert, ausgeliefert — und nie angewandt worden.

     ⭐ Gefunden, BEVOR die ersten Texte dafuer geschrieben waren: die Frage
     „wer ruft das eigentlich auf, und womit?" kostete zwei Minuten und
     ersparte fuenfzehn Eselsbruecken, die niemand je gesehen haette.
     [[werkzeug_ohne_aufrufer]]

     ⚠️ Der Aufruf ist gefahrlos, wenn nichts passt: die Funktion ueberspringt
     jedes Wort, das schon ein `mnemo` hat, und jede Id ohne Eintrag. */
  if (typeof PERSONAL_VOCAB !== 'undefined' && Array.isArray(PERSONAL_VOCAB)
      && PERSONAL_VOCAB.length){
    eselsbrueckenNachtragen(PERSONAL_VOCAB);
    eselsbrueckenErsetzen();
  schreibweisenErsetzen();
    /* ⛔⛔ UND DIE BEISPIELSAETZE, aus genau demselben Grund.

       Am 20.08.2026 wurde oben der Eselsbruecken-Weg repariert — und die
       Zeile daneben blieb stehen. `saetzeNachtragen()` lief weiterhin nur
       mit der Buchliste (einhaengen(), Zeile 256), also lief derselbe
       Fehler unter anderem Namen weiter: ein Eintrag in
       data/beispielsaetze.js unter einer `p_…`-Id waere geschrieben,
       gespeichert, ausgeliefert — und nie angewandt worden.

       ⭐ Die Lehre ist nicht „Saetze vergessen", sondern: eine Entscheidung
       ueber einen Weg gilt fuer JEDEN Weg derselben Bauart. Hier waren es
       zwei Funktionen mit identischer Aufgabe, zwei Zeilen auseinander.
       [[entscheidung_gilt_fuer_das_zweite_werkzeug]] [[werkzeug_ohne_aufrufer]]

       ⚠️ Gefahrlos, wenn nichts passt: die Funktion ueberspringt jedes Wort,
       das schon ein `sentAr` hat, und jede Id ohne Eintrag. */
    saetzeNachtragen(PERSONAL_VOCAB);
  }

  /* ⛔⛔ UND DIE FACHBEGRIFFE — dieselbe Lücke zum dritten Mal (19.10.2026).
     Ihre Sätze stehen zum Teil in data/beispielsaetze.js (die drei Plural-Namen
     vom 13.10.2026, dazu gram-marfu), aber saetzeNachtragen() lief nur mit der
     Buchliste und mit PERSONAL_VOCAB. In der laufenden App hatten diese vier
     Karten deshalb KEINEN Beispielsatz, und die fünf Markierungen daran waren
     unsichtbar. Gefunden von pruefe-oberflaeche.js; pruefe-beispielsaetze.mjs
     zählt die Einträge nur und war grün. [[werkzeug_ohne_aufrufer]]
     ⚠️ Gefahrlos, wenn nichts passt: vorhandene Sätze gewinnen, Kennungen ohne
     Eintrag oder ohne Karte werden übersprungen. */
  if (typeof FACHBEGRIFF_VOKABELN !== 'undefined' && Array.isArray(FACHBEGRIFF_VOKABELN))
    saetzeNachtragen(FACHBEGRIFF_VOKABELN);

  /* ⭐ Und die Kalenderkarten (23.10.2026, data/kalender.js) — damit dieselbe Lücke nicht
     ein viertes Mal entsteht: ihr Satz steht in data/beispielsaetze.js, ihre erste
     Eselsbrücke in data/eselsbruecken.js, wie bei jeder Buchkarte. Ohne diese zwei Zeilen
     hätten sie beides nie bekommen. Gefahrlos, wenn nichts passt (siehe oben). */
  if (typeof KALENDER_VOKABELN !== 'undefined' && Array.isArray(KALENDER_VOKABELN)){
    saetzeNachtragen(KALENDER_VOKABELN);
    eselsbrueckenNachtragen(KALENDER_VOKABELN);
  }

  /* ⭐ Einzeln freigeschaltete Wörter aus Büchern, die er nicht gewählt hat (20.10.2026,
     ḍaʿīf und malʿab) — Begründung bei einzelneAusAnderenBuechern() oben. HIER, weil
     danach seine Korrekturen, die Mehrzahlkarten und der Fortschritt über ALLE Wörter
     laufen: so bekommen auch diese ihre Änderungen, ihre Mehrzahlkarte und ihren Kasten. */
  await einzelneAusAnderenBuechern();

  /* ---------- Seine Korrekturen NACH den Buechern anwenden (21.08.2026) ----

     ⛔⛔ DERSELBE FEHLER ZUM VIERTEN MAL IN DIESEM BLOCK. wendePluralKartenAn,
     eselsbrueckenNachtragen und saetzeNachtragen stehen alle drei hier, alle
     drei mit derselben Begruendung — und `wendeWortAenderungenAn()` fehlte.

     Elias am 21.08.2026 um 05:31, mit Bild: „das hab ich jetzt mehrmals
     versucht zu löschen und jedes mal kommt es wieder obwohl steht das es
     gespeichert wurde. habe app zu gemacht und alles aber nichts hilft."

     Im Browser bewiesen, zwei Faelle nebeneinander, ein Neustart:

       45751 (Haus)  steht in vocab-data.js       -> "PROBE-HAUS"  ueberlebt ✅
       50474 (Idafa) nur in vokabeln-madina-1.js  -> Originaltext  ist weg  ⛔

     Beide standen in vt_wortAenderungen, beide Woerter waren geladen. Der
     einzige Unterschied war die HERKUNFT.

     Der Grund: wendeWortAenderungenAn() laeuft in js/kern.js beim Laden — da
     stehen erst die 171 Woerter aus vocab-data.js in der Liste. Die
     Buchvokabeln kommen erst hier dazu, und danach rief sie niemand mehr auf.
     Fuer ihn sah das aus wie ein Speicher, der luegt: die Karte zeigte sofort
     den neuen Text, der Toast sagte „Gespeichert", und beim naechsten Start
     stand der alte wieder da. [[erfolgsmeldung_ohne_wirkung]]

     ⭐ wendeFeldErgaenzungenAn() hat denselben blinden Fleck und kommt
     deshalb mit. Gemessen: FELD_ERGAENZUNGEN hat heute 0 Eintraege — die
     Fehlerklasse ist also leer, aber ab dem ersten Eintrag fuer eine
     Buchvokabel waere sie still wirkungslos gewesen.
     [[entscheidung_gilt_fuer_das_zweite_werkzeug]]

     ⛔ Die Reihenfolge ist dieselbe wie in js/kern.js:782: ERST die
     Nachtragungen, DANN seine eigenen Aenderungen. Was er selbst eingetippt
     hat, muss eine Nachtragung ueberschreiben koennen, nie umgekehrt.

     ⚠️ Beide Aufrufe sind gefahrlos, wenn nichts zu tun ist: der eine fuellt
     nur leere oder bestrittene Felder, der andere setzt dieselben Werte noch
     einmal und merkt sich den Vorher-Wert nur beim ERSTEN Mal.

     ⚠️ VOR den Pluralkarten: die werden aus `pl` gebaut. Hat er `pl`
     korrigiert, soll die Karte seine Fassung tragen, nicht die des Abzugs. */
  if (typeof wendeFeldErgaenzungenAn === 'function') wendeFeldErgaenzungenAn(VOCAB_DATA);
  /* ⭐ „Rajab (7. Monat)" (23.10.2026). Elias: „die islamischen monat bitte auch dazu
     schreiben welcher im jahr dieser monat ist damit ich weiß weil ich weiß nicht wann
     welcher monat ist". Rajab ist eine Buchkarte (madina-1, Kapitel 14, 45926) — die
     Buchdatei schreibt jeder Abzug neu, und FELD_ERGAENZUNGEN füllt nur leere Felder.
     Deshalb steht die Fassung in data/kalender.js (KALENDER_BUCHKARTEN) und wird hier bei
     jedem Start gesetzt — VOR seinen eigenen Änderungen: was er selbst eintippt, gewinnt. */
  if (typeof KALENDER_BUCHKARTEN !== 'undefined' && KALENDER_BUCHKARTEN){
    for (const w of VOCAB_DATA){
      const e = w && KALENDER_BUCHKARTEN[String(w.id)];
      if (e && e.de && w.de !== e.de) w.de = e.de;
    }
  }
  if (typeof wendeWortAenderungenAn === 'function') wendeWortAenderungenAn();

  /* ---------- Pluralkarten NACH den Buechern neu bauen (18.08.2026) --------

     ⚠️ Ein Fehler, den nur die Zahl verraten hat. `wendePluralKartenAn` laeuft
     in kern.js beim Laden - da stehen aber erst die 171 Woerter aus
     vocab-data.js in der Liste. Die Buchvokabeln kommen erst hier dazu, weil
     ihre Dateien nachgeladen werden.

     Gemessen: nach dem Neuladen 120 Pluralkarten, nach einem Umlegen des
     Schalters im laufenden Betrieb 190. Dieselbe Einstellung, zwei Ergebnisse
     - je nachdem, ob man die App neu gestartet oder den Schalter angefasst
     hatte. Aufgefallen ist es nur, weil beide Zahlen im selben Protokoll
     standen; einzeln sah jede plausibel aus.

     Der Aufruf ist gefahrlos, wenn der Schalter aus ist: dann raeumt er die
     Liste auf und legt nichts an. */
  if (typeof wendePluralKartenAn === 'function' && typeof SETTINGS !== 'undefined'){
    wendePluralKartenAn(pluralKartenStufe(SETTINGS));
  }

  /* ---------- Seine Änderungen an den Mehrzahlkarten (20.10.2026) ----------
     wendePluralKartenAn() baut die Mehrzahlkarten eben frisch, aus der Einzahl und OHNE das,
     was er an einer Mehrzahlkarte selbst geändert hat. wendeWortAenderungenAn() weiter oben
     kam dafür zu früh. Im eigenen Edge gemessen, bevor es diesen Aufruf gab: Änderung an der
     Mehrzahlkarte gespeichert, nach dem Neustart stand wieder „Felder (Plural)" da.
     Elias um 02:24: „außerdem will ich auch direkt die pluralkarten bearbeiten können …"
     Bewacht von validate.js (Startlauf-Nachträge) und werkzeuge/pruefe-bearbeiten.mjs. */
  if (typeof wendePluralAenderungenAn === 'function') wendePluralAenderungenAn();

  /* ---------- Lernstand fuer die Pluralkarten (21.08.2026) ----------------

     Diese Schleife stand bis heute INLINE und INNERHALB der Bedingung darueber.
     Inhaltlich war das richtig — sie gehoert hinter `wendePluralKartenAn()`,
     weil die Pluralkarten erst dort entstehen. Nur SAGTE das nichts: eine
     namenlose Schleife hinter einer Pruefung ueber Pluralkarten liest sich wie
     ein Anhaengsel und nicht wie die Stelle, an der 70 Karten ihren Lernstand
     bekommen.

     ⛔ GEMESSEN, nicht vermutet. Aufruf stillgelegt, Pluralkarten AN,
     vt_progress geleert: 518 Karten, davon 70 ohne Lernstand — alle 70
     Pluralkarten. `dueWords()` lieferte 448 statt 518, ohne jede Meldung.
     [[ausfall_ist_unsichtbar_gebaut]]

     ⚠️ Meine erste Annahme war eine ANDERE und falsch: ich hielt die
     nachgeladenen Buchvokabeln fuer betroffen. Der Stoertest blieb gruen —
     `setzeBuch()` fuellt sie laengst nach jedem geladenen Buch. Erst der
     zweite Anlauf mit eingeschalteten Pluralkarten wurde rot.
     [[stoertest_muss_wirkung_nachweisen]]

     ⭐ Jetzt eine benannte Funktion in js/kern.js, unbedingt aufgerufen und
     weiterhin NACH den Pluralkarten. Unbedingt, weil die Bedingung darueber
     von etwas anderem handelt: sind die Pluralkarten aus, gibt es nichts
     nachzutragen, und der Aufruf kostet einen Durchlauf ohne Wirkung. */
  if (typeof ergaenzeProgress === 'function') ergaenzeProgress();

  /* ⛔⛔ SELBST ANGELEGTE DUBLETTEN DURCH DIE BUCHVOKABEL ERSETZEN (07.09.2026)
     Elias: „wenn so ein fall kommt dann kannst du meine durch die im buch
     ersetzen. dieses eine wort soll dann schon voher einzeln freigeschalten
     sein und möglichst identisch durch meins ersetzt werden."

     ⚠️ HIER und nicht früher: der Tausch braucht den vollständigen Bestand.
     Vor dem Einhängen der Bücher fände er kein Gegenstück, und vor
     ergaenzeProgress() wäre der Fortschritt, den er mitnimmt, noch nicht
     vollständig.

     ⭐ Er meldet sich. Ein stiller Tausch löscht eine Karte, ohne dass Elias
     es erfährt — und die nächste Frage wäre „wo ist mein Wort hin".
     [[ausfall_ist_unsichtbar_gebaut]] */
  if (typeof tauscheDubletten === 'function') tauscheDubletten();

  /* ⭐ UND EIN FACHBEGRIFF, DER SCHON EINE BUCHVOKABEL IST (22.09.2026).
     Elias: „es gibt zwei mudaf, ich möchte eigentlich nur eins haben. lass das
     in kapitel 24, mache es aber exakt so wie das meine eigene … nimm die
     höhere box." Die Begründung und das Feld `buchTausch` stehen bei
     fachbegriffeMitBuchkarte() in js/kern.js.
     ⚠️ GENAU HIER, aus demselben Grund wie der Tausch darüber: die Buchvokabel
     steht in data/vokabeln-madina-1.js und ist vorher nicht geladen. Ein
     Ladetest hat das belegt — der erste Entwurf lief in js/kern.js und fand
     nichts. */
  if (typeof fachbegriffeMitBuchkarte === 'function') fachbegriffeMitBuchkarte();

  /* ⛔⛔ UND ZWEI KAPITELKARTEN FÜR DASSELBE WORT (16.09.2026) — Elias' Grundregel:
     „wenn zwei identisch sind und eines davon aber fortschritt hat dann sollte man
     immer das behalten was fortschritt hat" / „also wenn er hier um zwei vokabeln
     geht die beide in kapiteln vorkommen". Begründung bei der Funktion in js/kern.js.
     ⚠️ NACH dem Tausch: der gibt einer Kapitelkarte vielleicht gerade erst den
     Fortschritt der eigenen — und der entscheidet hier, welche bleibt. */
  /* ⭐ DAVOR die Gruppe „Koran häufigste" (11.10.2026): welche Karte für ein Wort der
     Gruppe steht, sagt die von Hand geprüfte Liste — die Regel darunter vergliche
     nur Schreibung und Bedeutung. Begründung bei koranKartenEinordnen() oben.
     ⚠️ Nach dem Tausch und den Fachbegriffen, aus demselben Grund wie die Regel
     darunter: erst dann steht fest, welche Karte Fortschritt hat. */
  koranKartenEinordnen();
  if (typeof blendeKapitelDublettenAus === 'function') blendeKapitelDublettenAus();

  renderBuchChips();
  if (typeof renderHome === 'function') renderHome();
  /* Scheitert KEIN einziges der versuchten Buecher am Netz, sondern scheitern
     sie alle, fehlt nicht ein Buch, sondern der ganze Ordner data/ - dann
     werden die gar nicht erst versuchten auch nicht angeboten. Die App faellt
     auf das zurueck, was in vocab-data.js steht: Madina 1, Kapitel 1 bis 9.
     Warum die Bedingung „alle" heisst und nicht „das erste": siehe
     fehltDerGanzeOrdner() weiter oben. */
  if (fehltDerGanzeOrdner(slugs)){
    (typeof BUECHER !== 'undefined' ? BUECHER : []).forEach(b => BUCH_FEHLT.add(b.slug));
    renderBuchChips();
    renderChapterFilterChips();
  }
  /* Der Bestand steht — ab jetzt darf eine Runde entstehen (STARTBESTAND_BEREIT oben). */
  startbestandFertig();
});
