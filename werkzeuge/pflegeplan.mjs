/* pflegeplan.mjs — wie wird jede Funktion der App weiter gepflegt?
 * ==========================================================================
 *
 * ⛔⛔ DER ANLASS — Elias am 11.09.2026, 19:25:26:
 *
 *   „es wäre wichtig, dass es einen prüfer oder routine auch gibt die genau das
 *    prüft was ich eben angesprochen habe. also wenn eine neue funktion da ist
 *    oder ähliches das geguckt wird wie wird sie weiterhin gepflegt und hat sich
 *    automatische abläufe bzw muss sie weiterhin verarbeitet werden usw.. du
 *    sollst dich dann darum kümmern und gucken das solche neuen dinge ihre
 *    entsprechenden routinen bekommen bzw die aktuellen routinen geupdated
 *    werden damit alles auch immer aktuell bleibt und nicht in zukunft veraltet
 *    weil sonst hat eine neue funktion keinen sinn wenn sie nicht gepflegt wird"
 *
 * Vorausgegangen war die Regelsammlung (v465–v468): gebaut, geprüft,
 * ausgeliefert — und KEINE Routine nannte sie beim Namen.
 *
 * ⭐ JEDE FUNKTION BEANTWORTET DREI FRAGEN — seine drei, in seiner Reihenfolge:
 *
 *   neuerInhalt  „wie wird sie weiterhin gepflegt" — kommt neuer Inhalt dazu,
 *                den jemand eintragen muss? (neue Folgen, Kapitel, Wörter)
 *   eingaben     „muss sie weiterhin verarbeitet werden" — erzeugt Elias darin
 *                etwas, das jemand weiterverarbeiten muss? (Notizen,
 *                Ablehnungen, Papierkorb)
 *   veralten     „damit alles auch immer aktuell bleibt" — kann etwas daran
 *                alt werden, das jemand nachziehen muss? (erzeugte Seiten,
 *                zurückgestellte Punkte)
 *
 * JEDE ANTWORT HAT GENAU EINE DIESER FORMEN (oder ist eine Liste davon):
 *
 *   { routine, schritt, beleg, werkzeug?, wie }
 *       Eine Routine erledigt es. werkzeuge/pruefe-pflegeplan.mjs verlangt:
 *       die Routine steht in Automation/routines.json · ihr Prompt hat den
 *       Schritt als Überschrift · der Beleg steht WÖRTLICH im Prompt · ein
 *       genanntes Werkzeug wird dort mit `node <werkzeug>` aufgerufen UND steht
 *       in ihren allowedTools. Sonst verspricht der Plan, was die Routine nicht
 *       tut — genau der Fehler vom 18.08.2026 (neun Werkzeuge im Prompt, keins
 *       freigegeben). [[werkzeug_ohne_aufrufer]]
 *   { sitzung, werkzeug? }
 *       Es kommt von IHM im Chat und wird in einer Sitzung eingetragen.
 *   { nein }
 *       Es braucht keine Pflege — mit Grund, mindestens 25 Zeichen. „—" oder
 *       „nichts" gehen nicht durch. [[pruefwerkzeug_mit_eingebauter_antwort]]
 *   { luecke, seit, todo }
 *       Es BRAUCHT Pflege, und niemand macht sie. Ehrlich eingetragen, mit dem
 *       Stichwort des Punkts in der To-Do. Der Prüfer bleibt dann rot
 *       (Exitcode 2), bis die Lücke geschlossen ist — so war es gewollt: „du
 *       sollst dich dann darum kümmern".
 *
 * ⛔ WAS ALS FUNKTION ZÄHLT — und was der Prüfer deshalb findet:
 *   jede Datei, die index.html lädt oder sw.js vorhält (.js), und jeder
 *   Bildschirm `<section class="screen" id="…">`. Eine neue Datei oder ein
 *   neuer Bildschirm ohne Eintrag hier macht den Prüfer rot.
 * ⚠️ GRENZE: eine neue Funktion INNERHALB einer bestehenden Datei (etwa eine
 *   weitere Übungsart in js/uebung.js) findet er nicht. Neue Speicherschlüssel
 *   findet pruefe-kreislaeufe.mjs. Wer so etwas baut, trägt es hier von Hand
 *   nach — die Regel dazu steht in CLAUDE.md.
 */

const W = 'vokabeltrainer-wartung';

export const PFLEGEPLAN = [
  {
    funktion: 'Vokabeln und Karteikarten',
    dateien: ['vocab-data.js', 'js/lernen.js', 'data/eselsbruecken.js', 'data/eselsbruecken-alt.js', 'data/beispielsaetze.js', 'data/feld-ausnahmen.js'],
    bildschirme: ['screen-learn'],
    neuerInhalt: { routine: W, schritt: '1c.4', beleg: 'node werkzeuge/eselsbruecken-setzen.mjs', werkzeug: 'werkzeuge/eselsbruecken-setzen.mjs',
      wie: 'jedes neu freigeschaltete Wort bekommt Eselsbrücken und einen Beispielsatz („das volle Programm")' },
    eingaben: [
      { routine: W, schritt: '1c.1', beleg: '--app auto', werkzeug: 'werkzeuge/vorrat.mjs',
        wie: 'seine Ablehnungen („Taugt nicht") und sein Kapitelfenster kommen aus dem Abgleich' },
      { routine: W, schritt: '1c.8', beleg: 'node werkzeuge/antworten-uebernehmen.mjs', werkzeug: 'werkzeuge/antworten-uebernehmen.mjs',
        wie: 'seine Antworten auf fehlende Wortangaben landen in data/feld-ausnahmen.js' },
    ],
    veralten: { routine: W, schritt: '1c.7', beleg: 'wartungsfragen-artefakt.mjs', werkzeug: 'werkzeuge/wartungsfragen-artefakt.mjs',
      wie: 'fehlende Angaben (Geschlecht, Plural …) werden zur Fragenseite, statt still zu fehlen' },
  },
  {
    funktion: 'Lehrwerke (die acht Bücher und seine arabicroots-Wörter)',
    /* 16.09.2026 (v515): die acht Buchabzüge stehen jetzt in ASSETS von sw.js —
       Elias: „soll unterwegs auch verfügbar sein als oja". Damit zählt der
       Prüfer sie als App-Dateien. Kein neuer Pflegebedarf: hole-vokabeln.mjs
       (Schritt 2) frischt sie wie bisher auf, und ausgeliefert werden sie nur
       mit --mit-daten — veroeffentlichen.mjs verweigert sonst, bewacht von
       pruefe-auslieferliste.mjs (Abschnitt 5). */
    dateien: ['js/buecher.js', 'js/vokabelpaket.js', 'data/buecher.js', 'data/vokabeln-eigene.js',
      'data/vokabeln-madina-1.js', 'data/vokabeln-madina-2.js', 'data/vokabeln-madina-3.js',
      'data/vokabeln-bayna-yadayk-1.js', 'data/vokabeln-bayna-yadayk-2.js', 'data/vokabeln-bayna-yadayk-3.js',
      'data/vokabeln-bayna-yadayk-4.js', 'data/vokabeln-quran.js'],
    bildschirme: [],
    neuerInhalt: { routine: W, schritt: '2', beleg: 'node werkzeuge/hole-vokabeln.mjs', werkzeug: 'werkzeuge/hole-vokabeln.mjs',
      wie: 'frischt die Lehrwerke und seine eigenen Wörter aus arabicroots auf' },
    eingaben: { routine: W, schritt: '1c.1', beleg: '--app auto', werkzeug: 'werkzeuge/vorrat.mjs',
      wie: 'welche Kapitel er freigeschaltet hat, kommt aus seinem abgeglichenen Stand' },
    veralten: { routine: W, schritt: '2', beleg: 'node werkzeuge/baue-vokabelpaket.mjs', werkzeug: 'werkzeuge/baue-vokabelpaket.mjs',
      wie: 'das Vokabelpaket wird nach dem Abzug neu gebaut; das ABFRAGEDATUM der '
        + 'Freischaltung pflegt vorrat.mjs selbst in werkzeuge/freischaltung-abfrage.json '
        + '(15.09.2026) — vorher stand es nur als Kommentar in der ausgelieferten '
        + 'js/kern.js und wurde bei einem Lauf ohne Änderung nicht erneuert, worauf '
        + 'die Warnung „die Mi/So-Abfrage hat ausgesetzt" jeden Sonntag zu Unrecht kam. '
        + 'Bewacht von test-freischaltung-abfragemarke.mjs' },
  },
  {
    /* 16.09.2026 (v512), innerhalb von js/buecher.js und deshalb von Hand hier.
       Gefragt: „أَخٌ (Bruder) und أُخْتٌ (Schwester) stehen in beiden Büchern und
       kommen deshalb doppelt. Soll ich die aus Bayna Yadayk ausblenden?" —
       Elias: „ja". BUCHDUBLETTEN_AUSBLENDEN lässt die Kennungen beim Einhängen
       weg. Der Pflegeplan fehlte zuerst; die Wartung desselben Abends fand die
       Folge: pruefe-duplikate.js kannte die Liste nicht und meldete beide weiter.
       ⚠️ KEINE Dateien hier: js/buecher.js steht schon bei den Lehrwerken, und
       eine Datei darf nur bei einer Funktion stehen. */
    funktion: 'Doppelte Wörter in zwei Büchern (BUCHDUBLETTEN_AUSBLENDEN)',
    dateien: [],
    bildschirme: [],
    neuerInhalt: { routine: W, schritt: '1c.5', beleg: 'node pruefe-duplikate.js', werkzeug: 'pruefe-duplikate.js',
      wie: 'jedes neu freigeschaltete Kapitel eines zweiten Buchs kann Wörter bringen, die er aus dem ersten schon hat; '
        + 'sie erscheinen als Befund „Buchvokabel" und auf seiner Seite „Was auf dich wartet" als Frage je Wort' },
    eingaben: { sitzung: 'Ob ein Wort im zweiten Buch ausgeblendet wird, entscheidet Elias je Wort — es gibt keine allgemeine Regel, '
        + 'nur zwei einzelne Antworten. Erst nach seinem Ja trägt eine Sitzung die Kennung in BUCHDUBLETTEN_AUSBLENDEN ein; '
        + 'die Routine nie.',
      werkzeug: 'pruefe-duplikate.js' },
    veralten: { routine: W, schritt: '1c.5', beleg: 'node pruefe-duplikate.js', werkzeug: 'pruefe-duplikate.js',
      wie: 'eine Kennung, die kein Buch mehr hat oder deren Zwilling fehlt, blendet ein Wort aus, das er dann gar nicht mehr hat — '
        + 'pruefe-duplikate.js meldet sie als „Ausblendung veraltet" (Exit 2), bewacht von test-dublette.mjs' },
  },
  {
    funktion: 'Fachbegriffe aus dem Unterricht',
    dateien: ['data/fachbegriffe.js'],
    bildschirme: [],
    /* Bis 11.09.2026, 20:4x eine `luecke` — der erste Fund dieses Plans. Elias:
       „das muss gefixt werden", Wahl „Direkt eintragen". Geschlossen mit
       Schritt 1f; die Kandidaten kommen aus den Regeln, weil das Zählen im
       Transkript an bekannten Antworten scheiterte. */
    neuerInhalt: [
      { routine: W, schritt: '1f', beleg: 'node werkzeuge/fachbegriffe-finden.mjs', werkzeug: 'werkzeuge/fachbegriffe-finden.mjs',
        wie: 'Begriffe, die eine neue Regel benennen oder in mehreren wiederkehren, werden entschieden' },
      { routine: W, schritt: '1f', beleg: 'node werkzeuge/fachbegriffe-setzen.mjs', werkzeug: 'werkzeuge/fachbegriffe-setzen.mjs',
        wie: 'belegte, voll vokalisierte Begriffe direkt eintragen — Elias: „Direkt eintragen"' },
      /* ⭐ Seit 15.09.2026: der Schritt schlägt jetzt SELBST nach, statt zu
         fragen. Elias am 11.09.: „guck es doch nach bei den wörterbüchern die
         ich dir gegeben habe" — bis dahin stand jeder unbelegte Begriff unter
         „Offen", und eine Sitzung musste ihn von Hand nachschlagen. */
      { routine: W, schritt: '1f', beleg: 'node werkzeuge/fachbegriffe-nachschlagen.mjs', werkzeug: 'werkzeuge/fachbegriffe-nachschlagen.mjs',
        wie: 'unbelegte Schreibungen bei arabdict und en.wiktionary holen (ohne Browser) '
          + 'und nur bei ZWEI übereinstimmenden Quellen in fachbegriffe-belege.json ablegen; '
          + 'eingetragen wird davon nichts — das bleibt fachbegriffe-setzen.mjs. '
          + 'Zweiseitig geeicht mit --eichen (zwei Fälle MÜSSEN leer ausgehen)' },
    ],
    eingaben: { nein: 'Er blendet Fachbegriffe höchstens aus (vt_geloescht); das wertet die App selbst aus und gleicht es zwischen den Geräten ab.' },
    veralten: { routine: W, schritt: '1c.4', beleg: 'FACHBEGRIFF_VOKABELN',
      wie: 'Fachbegriffe bekommen wie Vokabeln Eselsbrücken und Beispielsatz' },
  },
  {
    funktion: 'Kategorien und Wortliste',
    dateien: ['js/kategorien.js', 'wortfelder-data.js'],
    bildschirme: ['screen-categories', 'screen-wordlist'],
    neuerInhalt: { routine: W, schritt: '6', beleg: 'node pruefe-wortfelder.js',
      wie: 'meldet Wörter, deren Bedeutung in kein Wortfeld fällt' },
    eingaben: { nein: 'Eigene Kategorien sind Ansichtssache auf seinem Gerät (vt_customCats) — niemand muss sie weiterverarbeiten.' },
    veralten: { nein: 'Die Listen entstehen beim Öffnen aus den aktuellen Vokabeln; es wird nichts gespeichert, das alt werden kann.' },
  },
  {
    /* 11.09.2026, 22:39 — Elias: „im startbildschirm kann es nach beidem suchen
       aber die wörter sollen immer über den regeln angezeigt werden". Der
       Bildschirm wird in js/kategorien.js gezeichnet (zeichneAlleSuche); die
       Datei steht deshalb schon oben bei den Kategorien. */
    funktion: 'Suche vom Start (Wörter und Regeln)',
    dateien: [],
    bildschirme: ['screen-suche'],
    neuerInhalt: { nein: 'Die Suche liest nur, was schon in der App steht (VOCAB_DATA und die Regeln); neue Wörter und Regeln sind ohne Zutun dabei.' },
    eingaben: { nein: 'Der Suchbegriff wird nirgends gespeichert und nicht abgeglichen; es entsteht nichts, das jemand weiterverarbeiten muss.' },
    veralten: { nein: 'Die Treffer entstehen bei jedem Tastendruck und jedem Öffnen neu aus den aktuellen Daten.' },
  },
  /* 16.09.2026 (v504), innerhalb von js/uebung.js und deshalb von Hand hier:
     „Bestimmt?" entfernt, Tipp-Fragen ohne Anzahl und mit deutschem Wort,
     „Warum?" bei unsichtbarer Endung → alif-maqsura-unveraenderlich-01.
     Kein neuer Pflegebedarf: die Bedingung kommt aus endungUnsichtbar()
     (js/irab.js), die Karte bewacht pruefe-regelsammlung.mjs, das Verhalten
     test-satzmodus-schwerer.mjs. */
  /* 16.09.2026 abends, innerhalb von js/saetze.js und data/beispielsaetze.js und
     deshalb von Hand hier: acht längere Sätze `satz-lang-…` (laengereSaetze() in
     alleSaetze()). Elias: „mach das" auf „Ich schreibe neue, längere Sätze, nur
     mit Wörtern, die du schon hast".
     Kein neuer Pflegebedarf, aus drei Gründen:
     · neuer Inhalt — die Sätze bleiben gültig, wenn Kapitel dazukommen; weitere
       entstehen nur auf seinen Wunsch (Material, kein Kreislauf);
     · seine Eingaben — er trägt in ihnen nichts ein;
     · veralten — ändert sich ein Wortfeld oder ein Lehrbuchsatz, auf dem eine
       Form beruht, wird test-satzmodus-schwerer.mjs (2g) rot. Den ruft die
       Wartung seit demselben Abend in Schritt 6 direkt auf (Freigabe in
       routines.json); vorher lief er nur über alle-pruefer.mjs in 1b.6, also
       nur, wenn neue Regeln ausgeliefert wurden.
     Markierungen, Taschkīl und Iʿrāb prüfen dieselben Werkzeuge wie bei jedem
     Beispielsatz, weil die Sätze in data/beispielsaetze.js stehen. */
  {
    funktion: 'Satzmodus und Grammatik-Hervorhebung',
    dateien: ['js/saetze.js', 'js/uebung.js', 'grammar-data.js', 'lehrbuch-saetze.js'],
    bildschirme: ['screen-sentences'],
    neuerInhalt: [
      { routine: W, schritt: '1b.3', beleg: 'node werkzeuge/uebernehmen.mjs --entwuerfe', werkzeug: 'werkzeuge/uebernehmen.mjs',
        wie: 'neue Folgen werden ausgewertet, Regeln mit Folge und Zeitmarke eingetragen' },
      { routine: W, schritt: '1b.4', beleg: 'node werkzeuge/markierung-setzen.mjs', werkzeug: 'werkzeuge/markierung-setzen.mjs',
        wie: 'jede neue Regel bekommt einen Beispielsatz — ohne ist sie in der App unerreichbar' },
    ],
    eingaben: { sitzung: 'Seine Satzmodus-Urteile aus dem Regelprüfungs-Artefakt schickt er im Chat; eine Sitzung trägt sie ein (seit 11.09.2026 mit Zeitpunkt, gegen die Schalter der App).',
      werkzeug: 'werkzeuge/urteile-uebernehmen.mjs' },
    veralten: { routine: W, schritt: '1c.8c', beleg: 'node werkzeuge/regelpruefung-seite.mjs', werkzeug: 'werkzeuge/regelpruefung-seite.mjs',
      wie: 'die Regelprüfungs-Seite wird mit jeder neuen Regel neu gebaut' },
  },
  {
    funktion: 'Regelsammlung',
    dateien: ['js/regeln.js', 'regelsammlung-data.js'],
    bildschirme: ['screen-regeln'],
    neuerInhalt: [
      { routine: W, schritt: '1b.3', beleg: 'node werkzeuge/uebernehmen.mjs --entwuerfe', werkzeug: 'werkzeuge/uebernehmen.mjs',
        wie: 'neue Regeln aus grammar-data.js erscheinen von selbst unter „noch nicht beurteilt"' },
      { routine: W, schritt: '1d', beleg: 'node werkzeuge/regelsammlung-wache.mjs', werkzeug: 'werkzeuge/regelsammlung-wache.mjs',
        wie: 'eine Zusammenfassungs-Folge ohne Karten und eine neue Grammatik-Notiz werden gemeldet' },
    ],
    eingaben: { routine: W, schritt: '1d', beleg: 'node werkzeuge/regeln-holen.mjs', werkzeug: 'werkzeuge/regeln-holen.mjs',
      wie: 'seine Notizen, der Papierkorb, eigene Regeln und Fassungen kommen aus dem Abgleich' },
    veralten: { routine: W, schritt: '1d', beleg: 'wiedervorlagen.json',
      wie: 'zurückgestellte Regeln werden gegen jede neue Folge gehalten' },
  },
  {
    /* Neu am 15.09.2026. Elias: „dass du das artefakt nochmals in kategorien
       unterteilst mit den aktuellen regeln die wir haben und dann kann ich
       entscheiden ob diese einzelne regel dazu gehört oder nicht."
       ⛔ EINE Frage je Regel, nicht zwei: Regeln-Bereich und Satzmodus zeigen
       dieselben 93, und auf den Karteikarten steht seit dem 26.08.2026 gar
       keine Grammatik mehr. */
    funktion: 'Regelkategorien-Seite (Artefakt)',
    /* ⚠️ KEINE App-Dateien: die Seite ist ein Artefakt für ihn, kein Teil der
       App. Standen sie hier, meldete der Prüfer zu Recht „lädt die App nicht
       mehr — Eintrag veraltet". */
    dateien: [],
    bildschirme: [],
    neuerInhalt: { routine: W, schritt: '1d.3', beleg: 'node werkzeuge/regelkategorien-seite.mjs', werkzeug: 'werkzeuge/regelkategorien-seite.mjs',
      wie: 'jede neue Regel erscheint beim nächsten Bau in ihrer Kategorie — die Einteilung kommt aus SATZ_THEMEN, nicht aus einer zweiten Liste' },
    eingaben: { routine: W, schritt: "1d.3", beleg: "node werkzeuge/urteile-uebernehmen.mjs", werkzeug: 'werkzeuge/urteile-uebernehmen.mjs',
      wie: 'seine Entscheidungen kommen im Format DRIN/RAUS/AENDERN heraus, das dieses Werkzeug schon liest — deshalb kein zweites gebaut' },
    veralten: { routine: W, schritt: '1d.3', beleg: 'werkzeuge/regelkategorien-seite.mjs',
      wie: 'die Seite trägt ihr Baudatum und wird bei jedem Lauf neu erzeugt; eine Regel, die aus SATZ_THEMEN fällt, landet sichtbar unter „Nicht zuordbar"' },
  },
  {
    funktion: 'Iʿrāb-Erklärer',
    dateien: ['js/irab.js'],
    bildschirme: [],
    neuerInhalt: { routine: W, schritt: '6', beleg: 'node pruefe-saetze.js',
      wie: 'jeder neue Beispielsatz wird gegen die Iʿrāb-Analyse gehalten' },
    eingaben: { nein: 'Der Erklärer rechnet aus vorhandenen Sätzen und Regeln; er nimmt keine Eingaben von Elias entgegen.' },
    veralten: { nein: 'Er speichert nichts — jede Erklärung entsteht beim Antippen neu.' },
  },
  {
    funktion: 'Quran-Leser und Quranbezug der Vokabeln',
    dateien: ['js/quran.js', 'js/quran-audio.js', 'surah-data.js', 'quran-seiten.js', 'quran-verszeichen.js', 'quran-frequency-data.js', 'quran-text.js'],
    bildschirme: ['screen-quran', 'screen-quranfull'],
    neuerInhalt: { routine: W, schritt: '6', beleg: 'node pruefe-quran.js',
      wie: 'Quranbezüge neuer Vokabeln werden gegen den Qurantext gehalten' },
    eingaben: { nein: 'Lesezeichen, Lesestand und Audio-Einstellungen sind Zustand seines Geräts; vt_hifz führt pruefe-kreislaeufe.mjs als ausgewertet über data/auswendig.json. vt_suraGelesen (welche Sure wann gelesen wurde, seit 15.09.2026) ebenso — die App wertet es selbst aus, für die Wiederholungsringe auf der Startseite.' },
    /* 16.09.2026 abends (v505): eine heute als auswendig abgehakte Sure zählt
       heute nicht als Wiederholung (sie hatte az-Zalzala vom Ring verdrängt).
       Liest nur HIFZ_ZEIT, das es schon gab; neu ist lerntagVon() in js/kern.js.
       Kein neuer Pflegebedarf — test-surenringe.mjs spielt den Tag nach. */
    /* ⭐⭐ WANN EINE SURE ALS GELESEN ZÄHLT (16.09.2026) — die Stelle, an der
       diese Funktion schon einmal still ausgefallen ist.

       Elias: „auf meinem tablet hab ich zalzala gelesen die heutige aufgabe
       und dann bin ich raus gegangen und es wurde einfach nicht gezählt."
       Gezählt wurde am Beobachter des Lesestands, und der schneidet unten
       60 % ab — eine kurze Sure, die ganz auf den Schirm passt, wurde NIE
       gezählt. Seitdem: eigener Beobachter ohne Beschnitt für den letzten
       Vers PLUS eine Mindestzeit. Die war zuerst eine feste Minute („mindesten
       so 1-2 min in der sure") und hängt seit demselben Abend an der
       Wortzahl der Sure — Elias: „nicht überall das selbe maß", und für
       al-Mulk (eigener täglicher Ring) sicher nicht dieselbe Zeit wie für
       al-Ikhlāṣ. Halbe Sekunde je Wort, mindestens 8 s; bei allen 13
       gemessenen Suren höchstens ⅔ eines geübten Rezitators („kürze es
       ungefähr um 1/3"). Nachgerechnet mit echtem Korantext in
       test-lesezaehlung.mjs. Kein Pflegebedarf: die Wortzahl kommt aus dem
       Korantext selbst, nicht aus einer Liste.

       ⚠️ Beides hängt an Bildschirmgeometrie und lässt sich hier nicht
       vollständig prüfen — deshalb steht darunter ein Haken von Hand
       („Heute gelesen — abhaken") am Ende jeder Sure der Wiederholungsrunde.
       Bewacht von werkzeuge/pruefe-lesezaehlung.mjs (mit Störtest). */
    /* ⭐ quran-verszeichen.js kam am 15.09.2026 für den Juz-Ring dazu: 6236
       Zahlen, die Zeichen je Vers ohne Taschkīl. Erzeugt von
       werkzeuge/verszeichen-bauen.mjs aus quran-text.js.
       ⚠️ Sie veraltet nur, wenn sich der Qurantext ändert — und der ändert
       sich nicht. Deshalb kein Routineschritt: eine Wartung, die nie etwas zu
       tun hat, ist eine, die niemand mehr liest. Das Werkzeug bricht ab, wenn
       ein Vers ohne Text bleibt, und das ist der einzige Fall, der zählt. */
    veralten: { nein: 'Qurantext, Suren und Seitengrenzen ändern sich nicht. quran-frequency-data.js wird aus dem Quran-Korpus berechnet (baue-quran-frequenz.mjs), quran-verszeichen.js aus dem Qurantext (verszeichen-bauen.mjs) — beide nur neu zu erzeugen, wenn sich ihre Quelle ändert; neue Wurzeln brächte nur ein neues Lehrwerk.' },
  },
  {
    funktion: 'Hörverstehen',
    dateien: ['js/hoeren.js'],
    bildschirme: ['screen-hoeren'],
    neuerInhalt: { nein: 'Der Vorrat sind seine gelernten Wörter; ein neu gelerntes Wort ist ohne Zutun dabei, die Ablenker sucht die App selbst.' },
    eingaben: { nein: 'Er wählt nur Antworten; der Tageszähler vt_hoerTag ist reiner App-Zustand.' },
    veralten: { nein: 'Nichts Gespeichertes; ob fünf Antworten und die Ähnlichkeit wirken, misst pruefe-hoerablenker.mjs im Sammellauf.' },
  },
  {
    funktion: 'Wurzelmodus',
    dateien: ['js/wurzel.js'],
    bildschirme: ['screen-wurzeln'],
    neuerInhalt: { nein: 'Wortfamilien entstehen aus den vorhandenen Vokabeln und ihren Wurzeln; neue Wörter ordnet die App selbst zu.' },
    eingaben: { nein: 'Keine Eingaben, die außerhalb der App gebraucht werden.' },
    veralten: { nein: 'Nichts Erzeugtes, das gespeichert wird.' },
  },
  {
    funktion: 'Startseite, Statistik, Feiern und Zeitmessung',
    dateien: ['js/start.js', 'js/statistik.js', 'js/feier.js', 'js/zeitmessung.js'],
    bildschirme: ['screen-home'],
    neuerInhalt: { nein: 'Sie zeigen seine eigenen Übungsdaten; neuer Inhalt entsteht durch sein Üben, nicht durch Nachtragen.' },
    eingaben: { nein: 'Die stille Zeitmessung ist bewusst nur auf Abruf (zeitBericht()) — Elias: „am besten mir nicht sagen aber wenn ich es bei dir wissen will".' },
    veralten: { nein: 'Alles wird beim Öffnen aus seinem aktuellen Stand berechnet.' },
  },
  {
    funktion: 'Einstellungen und Geräteabgleich',
    dateien: ['js/einstellungen.js', 'js/sync.js'],
    bildschirme: ['screen-settings'],
    neuerInhalt: { nein: 'Technik ohne eigenen Lerninhalt.' },
    eingaben: { nein: 'Einstellungen wirken in der App selbst; das KV-Kontingent misst die Diagnosekarte auf seinem Gerät (vt_syncPuts).' },
    veralten: { nein: 'Nichts Erzeugtes; wie neue Speicherschlüssel ausgewertet werden, prüft pruefe-kreislaeufe.mjs.' },
  },
  {
    funktion: 'Grundgerüst der App',
    dateien: ['js/kern.js', 'js/darstellung.js', 'js/navigation.js', 'js/init.js', 'js/sprachausgabe.js'],
    bildschirme: [],
    neuerInhalt: { nein: 'App-Logik ohne eigenen Inhalt: Speicher, Darstellung, Navigation, Start und Sprachausgabe.' },
    eingaben: { nein: 'Nimmt selbst keine Eingaben entgegen, die jemand weiterverarbeiten müsste.' },
    veralten: { nein: 'Erzeugt nichts, das gespeichert wird und alt werden kann.' },
  },
];
