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
  /* 23.09.2026 (v575), innerhalb von js/sprachausgabe.js, js/einstellungen.js
     und index.html und deshalb von Hand hier: der Knopf „Arabisch testen"
     (Einstellungen → Hören) und der neue Speicherschlüssel
     `vt_arabischOhneListe`. Auf seinen beiden Geräten ist Arabisch
     installiert, Chrome meldet es der App aber nicht; mit seinem Ja spricht
     die App ohne Stimme aus der Liste. Der Pflegebedarf, geprüft:
     · neuer Inhalt — nein. Der Probesatz ist der erste Beispielsatz aus den
       vorhandenen Daten.
     · Eingaben von Elias — ja, seine Antwort (Ja/Nein). Ausgewertet wird sie
       von der App selbst (speakArabic) und in der Diagnosekarte; sie ist
       Gerätezustand, absichtlich nicht abgeglichen und nicht gesichert
       (Gründe in pruefe-abgleich.mjs und pruefe-sicherung.mjs).
     · veralten — ja: deinstalliert er Arabisch, bleibt sein Ja stehen. Dann
       meldet die App „Kein Ton" mit dem Weg zum Test, und ein „Nein" nimmt es
       zurück. Kein Routineschritt, denn kein Werkzeug sieht die
       Sprachausgabe seines Geräts.
     Bewacht von werkzeuge/pruefe-sprachausgabe.mjs (in alle-pruefer.mjs), mit
     Störtest in beide Richtungen. */
  /* 16.09.2026 (v517), innerhalb von js/kern.js, js/lernen.js und
     js/kategorien.js und deshalb von Hand hier: bei Zahlwörtern heißt die
     pl-Zeile „bei weiblichem Nomen", und es gibt keine Pluralkarte (Elias:
     „das auch"; Beleg en.wiktionary). Kein neuer Pflegebedarf: erkannt wird an
     der deutschen Bedeutung (null … zwölf), ein neues Zahlwort aus einem Buch
     ist ohne Zutun dabei; test-zahlwort-form.mjs läuft in alle-pruefer.mjs,
     validate.js meldet, wenn eine der drei Anzeigen die Beschriftung verliert. */
  /* 19.09.2026, innerhalb von js/lernen.js, js/start.js und js/navigation.js und
     deshalb von Hand hier: eine angefangene Runde übersteht jetzt das Schließen
     der App (neuer Speicherschlüssel `vt_offeneRunde`), und die Zahl oben zählt
     die FERTIGEN Karten statt der Kartennummer (Elias am 19.09.2026, 22:10:02:
     „Fertige Karten zählen"). Kein neuer Pflegebedarf, und zwar geprüft:
     · neuer Inhalt — nein, es entsteht nichts, was gepflegt werden müsste;
     · Eingaben von Elias — nein, der Schlüssel ist Gerätezustand und wird
       absichtlich nicht abgeglichen; ausgewertet wird er von der App selbst
       (`offeneRundeFortsetzen()`, `offeneRundeStand()`), eingetragen mit Grund
       in pruefe-kreislaeufe.mjs;
     · veralten — ja, eine Runde von gestern; genau dafür trägt sie den Lerntag
       und wird am nächsten Tag verworfen, ohne dass jemand aufräumen muss.
     Bewacht von werkzeuge/pruefe-offene-runde.mjs (in alle-pruefer.mjs), samt
     Störtest in beide Richtungen. */
  /* 20.09.2026 (v542) — das TON-PROTOKOLL mit seinem eigenen Speicherschlüssel
     (Name bewusst nicht ausgeschrieben, siehe js/quran-audio.js).
     ✅ AM 22.09.2026 WIEDER AUSGEBAUT, wie beim Bau
     angekündigt: „⛔ ABLAUF: ist die Ursache gefunden und behoben, kommt es
     wieder heraus." Die Ursache war am 20.09. gefunden (v543) und von Elias
     bestätigt („aber jetzt funktioniert es bei ausgeschaltetem display"); bis
     zum 22.09. kam kein neuer Ausfall. Elias zum Aufräumposten: „wenn nicht
     dann sollst du".
     Entfernt: der Block in js/quran-audio.js, alle tonLog-Aufrufe, die Zeile
     auf der Diagnosekarte, der Anhang in diagnoseAnhang(),
     werkzeuge/pruefe-tonprotokoll.mjs samt Eintrag in alle-pruefer.mjs und die
     zwei Ausnahmen in pruefe-abgleich/pruefe-sicherung.
     ⛔ Kein Pflegebedarf mehr — und deshalb steht hier kein Eintrag, sondern
     dieser Absatz: ein Pflegeplan für eine Funktion, die es nicht gibt, ist
     genau die Art Zeile, die drei Monate später jemanden suchen lässt.
     Kommt der Ausfall wieder: `git show 6d2bc1b:js/quran-audio.js`. */
  /* 20.09.2026 (v547), neue Funktion INNERHALB von js/quran-audio.js: die
     Leiste des Handys (Sperrbildschirm) zeigt die ganze Sure statt des
     einzelnen Verses, und der Punkt lässt sich ziehen (`seekto`). Elias:
     „sag mal könnte man auch … das die ganze sura angezeigt wird. weil dann
     könnte ich auch mehr zum ende springen in der sure". Der Pflegebedarf:
     · Eingaben von Elias — nein. · Neuer Speicherschlüssel — nein, die
       gemessenen Verslängen (QDAUER) leben nur im Arbeitsspeicher.
     · Was veralten kann: das Format der Zeitmarken von api.quran.com — es ist
       DIESELBE Quelle wie beim Wort-für-Wort-Mitlesen (segmenteHolen) und
       liest nur die letzten zwei Zahlen je Zeile. Fällt sie aus, bleibt die
       Leiste beim einzelnen Vers (kein Ausfall, nur der alte Zustand).
     · ✅ Am 20.09.2026 von Elias auf seinem Handy bestätigt: „jap zeigt ganze
       sure an" (04:16) und, zum Ziehen des Punktes, „geht" (04:17). Bewacht
       von werkzeuge/pruefe-sura-leiste.mjs (in alle-pruefer.mjs). */
  /* 20.09.2026 (v536), neue Datei js/quran-markierung.js und neuer
     Speicherschlüssel `vt_tajweed`: Elias kann im Korantext einzelne
     Buchstaben markieren, an denen sein Tajweed schiefgeht — mit Farbe und
     eigener Notiz („Ich will auch im Koran den Text markieren irgendwie
     können für Fehler zB wo ich tajweed etwas falsch mache", 19.09.2026).
     Der Pflegebedarf, geprüft:
     · neuer Inhalt — nein. Es entsteht kein Material, das jemand pflegen
       müsste; markiert wird auf dem bestehenden Korantext, und der ändert
       sich nicht.
     · Eingaben von Elias — JA, und zwar zwei: die markierten Stellen und
       seine Notizen dazu. Ausgewertet werden sie heute nur von der App
       selbst (`tajweedZeichnen()`), und das ist Absicht: er wollte „erst
       einmal nur markieren" (19.09.2026, 23:54:21), keine Übersichtsseite.
       ⚠️ Damit sammelt sich etwas an, das niemand liest — genau das Muster
       von `vt_zielverlauf`. Es steht deshalb als offener Punkt in der To-Do
       („Übersicht der markierten Stellen"), nicht als stille Lücke.
       [[werkzeug_ohne_aufrufer]]
     · veralten — ja, aber von selbst harmlos: sitzt eine Stelle, nimmt er
       die Markierung weg; der Eintrag bleibt als `an:false` mit Zeitstempel
       stehen, damit der Geräteabgleich sie nicht zurückholt. Nichts muss
       aufgeräumt werden.
     ⭐ ÜBERHOLT AM 22.09.2026 durch zwei Sätze von Elias: die Übersicht
       „brauchen wir nicht", und „nach einem monat kann sie automatisch
       verschwinden aber du solltest trotzdem aufzeichnen welche ich markiert
       habe". Seitdem: ausgeblendet nach 30 Tagen, archiviert von
       werkzeuge/tajweed-markierungen.mjs in der Wartung (Schritt 1c.1b) —
       siehe `eingaben` beim Quran-Leser unten. Der Punkt „kein Werkzeug liest
       es" ist damit geschlossen.
     Bewacht von werkzeuge/pruefe-markierung.mjs (in alle-pruefer.mjs), 51
     Proben mit drei Störtests. */
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
    veralten: [
      { routine: W, schritt: '1c.7', beleg: 'wartungsfragen-artefakt.mjs', werkzeug: 'werkzeuge/wartungsfragen-artefakt.mjs',
        wie: 'fehlende Angaben (Geschlecht, Plural …) werden zur Fragenseite, statt still zu fehlen' },
      /* ⛔ Neu am 20.09.2026, und zwar wegen eines stillen Ausfalls: der Prüfer
         meldete „alle 163 Wörter aus freigeschalteten Kapiteln haben
         Alternativen", während seine Diagnosekarte gleichzeitig „nur EIN
         Vorschlag: 22 Wörter" zeigte. Beide hatten recht — die Angabe in
         data/lernstand.json stand seit dem 20.08.2026 auf Kapitel 12, geübt
         wurde Kapitel 24. Was veraltet, ist also nicht der Inhalt, sondern
         die Zahl, gegen die geprüft wird. */
      { routine: W, schritt: '1b.6', beleg: 'node werkzeuge/alle-pruefer.mjs', werkzeug: 'pruefe-eselsbruecken.js',
        wie: 'seine Lernstand-Angabe veraltet — der Prüfer hält sie gegen das gemessene Kapitel und zählt die Wörter dazwischen ohne zweite Eselsbrücke' },
    ],
  },
  {
    /* ⭐ 23.09.2026 (v573) — das Bild zur Eselsbrücke. Elias: „Eselsbrücken-Bild:
       C · Mischung · die 72 + die 14 Beziehungswörter · nur Rückseite". */
    funktion: 'Bild zur Eselsbrücke (Emoji und Zeichnungen auf der Rückseite)',
    dateien: ['data/eselsbilder.js'],
    bildschirme: [],
    neuerInhalt: { sitzung: 'Seine Entscheidung gilt für genau diese 86 Wörter (72 Emoji, 14 Zeichnungen). Ob neue Wörter aus neuen '
        + 'Kapiteln nach derselben Regel ein Bild bekommen, ist eine offene Frage an ihn (To-Do, 23.09.2026) — bis er sie beantwortet, '
        + 'kommt jedes neue Bild aus einer Sitzung, nie aus der Routine.',
      werkzeug: 'werkzeuge/pruefe-eselsbilder.mjs' },
    eingaben: { nein: 'Er trägt nichts ein: das Bild wird nur angezeigt. Es gibt kein Eingabefeld und keinen Speicherschlüssel — '
        + 'seine eigene Eselsbrücke bleibt im Kasten darunter, wie bisher.' },
    veralten: { routine: W, schritt: '1b.6', beleg: 'node werkzeuge/alle-pruefer.mjs', werkzeug: 'werkzeuge/pruefe-eselsbilder.mjs',
      wie: 'verschwindet eine Kennung aus vocab-data.js, zeigt ein Platzhalter {{ar:…}} ins Leere oder ändert sich einer der 14 Beispielsätze, '
        + 'die eine Zeichnung zeigt, wird der Prüfer rot' },
  },
  /* 25.09.2026 (v604–v606), innerhalb von js/kern.js, js/lernen.js und
     js/uebung.js und deshalb von Hand hier: Lerngruppe (v604), erster Tag
     eines neuen Wortes (v605), Satzmodus in zwei Teilen (v606). Pflegebedarf,
     geprüft: · neuer Inhalt — nein; eine neue Satzübung kommt von selbst in
     den kürzeren Teil (satzTeile()) · Eingaben von Elias — seine Antworten
     tragen die Gruppe (Fortschritt je Wort: gruppe/gruppeArt/zurueck), den
     Teil des Tages (SETTINGS.satzTeil) und die Zeit je Satzübung
     (vt_quoteTage zn_/zs_); gelesen von der App selbst und in Schritt 1b.10
     von `node werkzeuge/lernlast.mjs` (Lerngruppe, Schlange, Zeiten) ·
     veralten — die Zeitschätzung (UEB_ZEIT_SCHAETZUNG) ist eine Annahme und
     wird von der Messung abgelöst, sobald je Übung 10 Antworten da sind.
     Bewacht von test-tagesdeckel.mjs, test-p9.mjs, pruefe-offene-runde.mjs
     und pruefe-satz-teile.mjs (alle in alle-pruefer.mjs). */
  /* 25.09.2026 (v603), innerhalb von js/kern.js und js/lernen.js und deshalb
     von Hand hier: Box 6 (30 T) und Box 7 (60 T), Box 1 mindestens ein Drittel,
     Wiederholungen nach Verspätung ÷ Abstand, freie Plätze an noch nicht fällige
     Karten (Box 2/3 → Box 1 → Box 4–7), Wischen links = „schwer". Elias: „lass
     uns box 6 einführen und box 7 auch" und „wie wäre es die freien plätze den
     vokabeln aus box 2 udn 3 zu geben?". Pflegebedarf, und zwar geprüft:
     · neuer Inhalt — nein, die Boxen füllen sich durch seine Antworten und sein
       Verschieben;
     · Eingaben von Elias — ja: seine Antworten zählen je Box mit
       (vt_quoteTage, Felder b/f/v<Box>g/r aus merkeQuote()). Die Routine liest
       sie in Schritt 1b.10 (`node werkzeuge/lernlast.mjs`): Trefferquote in
       Box 6/7 (in der Rechnung angenommen 0,9), ob vorgezogene Karten später
       halten, Länge der Box-1-Schlange — alles mit Zahl an ihn, geändert wird
       nichts ohne sein Wort;
     · veralten — die Abstände 30/60 Tage sind eine Annahme; liegt die
       gemessene Quote deutlich unter 0,8, legt die Routine sie ihm als Frage
       vor (Schritt 1b.10). Bewacht von test-tagesdeckel.mjs und test-p9.mjs
       (beide in alle-pruefer.mjs). */
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
    eingaben: [
      { routine: W, schritt: '1c.1', beleg: '--app auto', werkzeug: 'werkzeuge/vorrat.mjs',
        wie: 'welche Kapitel er freigeschaltet hat, kommt aus seinem abgeglichenen Stand' },
      /* 22.09.2026: nicht erst Mi/So. Elias: „wenn ich bis zu drei neue kapitel
         anhacke das dann sobald du es weißt und es länger als 1h auch so bleibt …
         das du dann das volle programm machst". Die Aufgabe „Vokabeltrainer neue
         Kapitel (stuendlich)" fragt ohne KI (neue-kapitel.mjs --tor) und startet
         die Routine nur mit Auftrag. Bewacht von test-neue-kapitel.mjs. */
      { routine: 'vokabeltrainer-neue-kapitel', schritt: '0', beleg: 'node werkzeuge/neue-kapitel.mjs --auftrag', werkzeug: 'werkzeuge/neue-kapitel.mjs',
        wie: 'neu angehakte Kapitel (höchstens drei je Buch, länger als eine Stunde) bekommen stündlich das volle Programm' },
    ],
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
    /* ⭐ 16.09.2026, abends: seine GRUNDREGEL — „das ist eine grundregel: wenn zwei
       identisch sind und eines davon aber fortschritt hat dann sollte man immer das
       behalten was fortschritt hat". Neu in BESTEHENDEN Dateien (js/kern.js:
       hatFortschritt, holeFortschrittNach, blendeKapitelDublettenAus; js/buecher.js
       ruft sie beim Start) — deshalb von Hand hier nachgetragen (CLAUDE.md). Die drei
       Fragen: neuer Inhalt? ja, jedes Kapitel und jedes Buch kann Paare bringen — die
       App entscheidet sie selbst, pruefe-duplikate.js legt ihm nur vor, was die Regel
       nicht entscheidet · verarbeiten? seine Antwort je Wort, nur für diese Reste ·
       veralten? die Prüfung liest den Fortschritt aus data/boxen.json (1c.1); fehlt
       die Datei, bleiben Kapitel-Paare Befund und die Prüfung sagt es. Kein neuer
       Speicherschlüssel: der Vermerk `uebertragen` steht in vt_progress. */
    neuerInhalt: { routine: W, schritt: '1c.5', beleg: 'node pruefe-duplikate.js', werkzeug: 'pruefe-duplikate.js',
      wie: 'jedes neu freigeschaltete Kapitel oder Buch kann Wörter bringen, die er schon hat; die App behält beim Start die Karte '
        + 'mit Fortschritt (eigene Wörter: die Kapitelkarte bekommt seinen Stand). Als Befund „Buchvokabel" und auf seiner Seite '
        + 'erscheint nur, was die Regel nicht entscheidet — beide mit Fortschritt oder Bedeutung nicht sicher gleich' },
    eingaben: { sitzung: 'Die Reste (beide Karten mit Fortschritt, Bedeutung unsicher) entscheidet Elias je Wort. Erst nach seinem Ja '
        + 'trägt eine Sitzung die Kennung in BUCHDUBLETTEN_AUSBLENDEN ein; die Routine nie.',
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
      /* ⛔⛔ 23.09.2026: „Direkt eintragen" ist AUFGEHOBEN. Hier stand ein zweiter
         Punkt: Routine 1f trägt mit fachbegriffe-setzen.mjs selbst ein. Genau
         daraus kamen die 16 Begriffe vom 11.09., von denen Elias einen im
         Hörmodus sah: „irgendjemand fügt sich dauerhaft hinzu und das will ich
         nicht … sorge dafür das es nicht wieder so dazu kommt." Die Routine
         findet jetzt nur noch und FRAGT; eingetragen wird in einer Sitzung, nach
         seinem Ja (eingaben unten). */
      { routine: W, schritt: '1f', beleg: 'node werkzeuge/fachbegriffe-finden.mjs', werkzeug: 'werkzeuge/fachbegriffe-finden.mjs',
        wie: 'Begriffe, die eine neue Regel benennen oder in mehreren wiederkehren, werden gefunden und ihm als FRAGE vorgelegt '
          + '(„Soll … eine Karteikarte werden?" unter 🔴 Wartet auf Elias) — eingetragen wird nichts' },
      /* ⭐ Seit 15.09.2026: der Schritt schlägt jetzt SELBST nach, statt zu
         fragen. Elias am 11.09.: „guck es doch nach bei den wörterbüchern die
         ich dir gegeben habe" — bis dahin stand jeder unbelegte Begriff unter
         „Offen", und eine Sitzung musste ihn von Hand nachschlagen. */
      { routine: W, schritt: '1f', beleg: 'node werkzeuge/fachbegriffe-nachschlagen.mjs', werkzeug: 'werkzeuge/fachbegriffe-nachschlagen.mjs',
        wie: 'unbelegte Schreibungen bei arabdict und en.wiktionary holen (ohne Browser) '
          + 'und nur bei ZWEI übereinstimmenden Quellen in fachbegriffe-belege.json ablegen; '
          + 'eingetragen wird davon nichts — das tut nur eine Sitzung nach seinem Ja. '
          + 'Zweiseitig geeicht mit --eichen (zwei Fälle MÜSSEN leer ausgehen)' },
    ],
    /* Bis 23.09.2026: { nein: 'Er blendet Fachbegriffe höchstens aus (vt_geloescht) …' }.
       Seitdem entscheidet ER, was eine Karte wird — das ist eine Eingabe. */
    eingaben: { sitzung: 'Sagt Elias zu einem Begriff ja (Warteseite oder Chat), trägt eine Sitzung ihn mit fachbegriffe-setzen.mjs ein '
        + 'UND ergänzt FACHBEGRIFF_AUFTRAG in data/fachbegriffe.js mit Datum und seinem Satz — ohne diese Zeile ruht der Eintrag. '
        + 'Die Routine nie. Ausblenden kann er weiter selbst (vt_geloescht).',
      werkzeug: 'werkzeuge/fachbegriffe-setzen.mjs' },
    veralten: { routine: W, schritt: '1c.4', beleg: 'FACHBEGRIFF_VOKABELN',
      wie: 'Fachbegriffe bekommen wie Vokabeln Eselsbrücken und Beispielsatz' },
  },
  {
    /* ⭐⭐ 22.09.2026 (v566) — DIE ÜBERSETZUNGSÜBUNG IM SATZMODUS.

       Elias am 22.09.2026, 21:15: „es sollte auch im satzmodus eine übung
       geben, wo mir ein satz gegeben wird und den soll ich dann ins deutsche
       übersetzten. wenn ich falsch mache muss erkannt werden was falsch ist und
       warum und mir das dann zeigen" · „und die richtige deutsche überstzung
       und halt warum"

       Eigene Datei, und das ist kein Zufall: eine neue Funktion INNERHALB von
       js/uebung.js findet pruefe-pflegeplan.mjs nicht (siehe Kopf dieser
       Datei). Der Übungseintrag selbst steht dort trotzdem — er ist ein
       Listeneintrag unter zwölf gleichartigen und braucht keinen eigenen Plan. */
    funktion: 'Übersetzungsübung (Arabisch ins Deutsche)',
    dateien: ['js/uebersetzen.js'],
    bildschirme: [],
    neuerInhalt: { nein: 'Sie erzeugt nichts. Gestellt werden die vorhandenen Beispielsätze, geprüft wird gegen deren sentDe — kommt ein Satz dazu, ist er ohne Zutun dabei; fehlt ihm sentDe, stellt die Übung ihn gar nicht erst (baue() gibt dann eine leere Liste zurück).' },
    eingaben: { nein: 'Er tippt eine Übersetzung ein, und die wird sofort ausgewertet und verworfen. Gespeichert wird allein richtig/falsch — über merkeUebung() und merkeQuote(), dieselben Zähler wie bei den anderen zwölf Übungen. Es bleibt also nichts liegen, das jemand weiterverarbeiten müsste.' },
    /* ⛔ DAS HIER IST DER EINZIGE ECHTE PFLEGEPUNKT — und er ist still.
       js/uebersetzen.js nennt sechs Regelkennungen im Klartext. Wird eine davon
       in grammar-data.js umbenannt oder entfernt, zeigt die Rückmeldung weiter
       auf sie, „Warum? → Regel" öffnet nichts, und nichts wird rot: die Übung
       liefe weiter und begründete mit einer Karte, die es nicht mehr gibt. */
    veralten: { routine: W, schritt: '1b.6', beleg: 'node werkzeuge/alle-pruefer.mjs', werkzeug: 'werkzeuge/pruefe-uebersetzen.mjs',
      wie: 'Teil D des Prüfers liest die Regelkennungen aus dem kommentarfreien Quelltext und schlägt jede in grammar-data.js nach; fehlt eine, wird er rot (Störtest belegt: eine verfälschte Kennung ergibt Exit 1)' },
  },
  {
    /* ⭐⭐ 24.09.2026 — DER SATZMODUS HÄLT MIT SEINEN VOKABELN SCHRITT.
       Übung 11 mit allen Hinweiswörtern, neu 14 (Fragewort) und 15 (Pronomen),
       dazu der Prüfer, der Lücken und die Balance misst. Elias: „du sollst
       automatisch das machen und die app immer aktuell halten. ich denke die
       routinen für mittwoch und sonntag bieten sich dafür gut an." Die Übungen
       stehen in js/uebung.js (keine eigene Datei) — deshalb von Hand hier. */
    /* 25.09.2026 (v612): dazu Übung 15 „Endung einsetzen" (Elias: „wo ich die
       richtigen endungen hinzufügen muss wie zb ki für frau oder ha und hu
       usw.. also halt alle die bisher zur auswahl stehen"). Ihre Auswahl sind
       seine Endungs-Karteikarten (uebEndungGlieder, bei jedem Aufbau gelesen);
       Teil A des Prüfers meldet eine Endung ohne Satz. Übersetzen ist seitdem 16. */
    funktion: 'Satzmodus aktuell: Hinweiswort, Fragewort, Pronomen, Endung einsetzen; neue Vokabeln im Satzmodus',
    /* Dazu gehören seit 24.09.2026 auch seine Abendlisten (data/abendlisten.json,
       werkzeuge/abendlisten.mjs, Wartungsschritt 1b.9): Elias „ja klingt gut"
       zum Mitlesen und gründlichen Prüfen wiederkehrender Wörter. Die Datei
       lädt die App nicht — sie ist Stoff für die Wartung. */
    /* Keine eigene Datei: die Übungen stehen in js/uebung.js, und die hat schon
       ihren Eintrag („Satzmodus und Grammatik-Hervorhebung") — zweimal dieselbe
       Datei lässt pruefe-pflegeplan nicht zu. */
    dateien: [],
    bildschirme: [],
    neuerInhalt: { routine: W, schritt: '1b.8', beleg: 'node werkzeuge/pruefe-satzmodus-aktuell.mjs', werkzeug: 'werkzeuge/pruefe-satzmodus-aktuell.mjs',
      wie: 'Neue Karten gehören von selbst zur Auswahl (uebGruppe liest Regelkarte und istBekannt bei jedem Aufbau, uebEndungGlieder seine Endungs-Karteikarten). Fehlt einer Kartenform oder einem Wort der neuesten Kapitel ein Satz, meldet der Prüfer Exit 2 — die Wartung holt einen belegten Satz (Lehrbuchseite, Madina-Schlüssel) oder legt die Lücke auf die Warteseite; neue Regeln prüft sie auf eine eigene Übung (nur als Vorschlag an ihn)' },
    eingaben: { nein: 'Er wählt nur aus; gespeichert wird richtig/falsch über dieselben Zähler wie bei den übrigen Übungen.' },
    veralten: { routine: W, schritt: '1b.8', beleg: 'node werkzeuge/alle-pruefer.mjs', werkzeug: 'werkzeuge/pruefe-satzmodus-aktuell.mjs',
      wie: 'Teil B wird rot, wenn eine Aufgabe ihre Lösung nicht zur Wahl stellt; Teil C meldet 0 % neueste Wörter; drei Störtests laufen in jedem Sammellauf (--stoertest)' },
  },
  {
    /* ⭐⭐ 22.09.2026 (v566) — EIN FACHBEGRIFF FOLGT SEINER REGEL.

       Elias, nachdem ihm vier Karteikarten hintereinander begegnet waren, deren
       Regel er am 19.08.2026 selbst gestrichen hatte: „woher kommt diese
       vokabel, ich weiß nicht ob es sich lohnt die zu lernen" — und dann:
       „mach diese drei weg und kümmere dich erstmal darum das das auch nicht
       wieder passiert."

       Die Behebung ist eine Ableitung in js/kern.js (fachbegriffFolgtRegel,
       benutzt in passtZurAuswahl) — INNERHALB einer bestehenden Datei, also von
       Hand hier eingetragen. Gemessen am 22.09.2026: 13 der 61 Fachbegriffe. */
    funktion: 'Fachbegriffe an gestrichenen Regeln',
    /* ⚠️ 23.09.2026: seit der Weißliste FACHBEGRIFF_AUFTRAG wirkt diese Ableitung
       nur noch auf BESTELLTE Begriffe (sichtbar: gram-marfu, dessen
       Kapitel-24-Zwilling schon in der Kartei steht). Der eigentliche Schutz
       ist der Eintrag „Fachbegriff-Karten nur auf sein Wort" direkt darunter. */
    dateien: [],
    bildschirme: [],
    neuerInhalt: { nein: 'Es entsteht nichts Neues — es fällt etwas weg, und zwar abgeleitet statt aufgelistet.' },
    eingaben: { nein: 'Seine Entscheidung steckt schon in der Regel (nichtAufKarteikarten, gesetzt beim Regeldurchgang). Genau deshalb ist hier nichts zusätzlich einzutragen: eine zweite Liste wäre eine zweite Wahrheit.' },
    /* ⛔ Der Pflegepunkt ist nicht das Ergebnis, sondern die WIRKSAMKEIT: eine
       Ableitung kann still verschwinden, und dann steht alles wieder da. */
    veralten: { routine: W, schritt: '1b.6', beleg: 'node werkzeuge/alle-pruefer.mjs', werkzeug: 'werkzeuge/pruefe-fachbegriff-regel.mjs',
      wie: 'prüft, dass die Funktion da ist, dass passtZurAuswahl sie aufruft und dass sie nichtAufKarteikarten liest statt ausgeblendet; zweiseitig geeicht (ein echter Fall wird gefunden, ein Fachbegriff mit stehender Regel nicht). Störtest belegt: Aufruf entfernt = Exit 1, falsches Feld = Exit 1' },
  },
  {
    /* ⛔⛔ 23.09.2026 — FACHBEGRIFF-KARTEN NUR AUF SEIN WORT.
       Elias, 15:08, zur Karte „Übereinstimmung" im Hörmodus: „ich hattte
       spezifisch darum gebeten akkusativ, genitiv und nominativ und vielleicht
       noch eine hand voll weitere zu haben aber nicht solceh dinge. irgendjemand
       fügt sich dauerhaft hinzu und das will ich nicht. … sorge dafür das es
       nicht wieder so dazu kommt."
       Die Weißliste FACHBEGRIFF_AUFTRAG steht in data/fachbegriffe.js, der Filter
       an der einen Tür in js/kern.js (fachbegriffBestellt) — beides INNERHALB
       bestehender Dateien, also von Hand hier eingetragen. 39 bestellt, 22 ruhen. */
    funktion: 'Fachbegriff-Karten nur auf sein Wort',
    dateien: [],
    bildschirme: [],
    neuerInhalt: { nein: 'Die Liste wächst nie von selbst: eine Zeile braucht sein Wort (Datum und Satz). Dafür sorgt der Eintrag „Fachbegriffe aus dem Unterricht" (eingaben: nur eine Sitzung nach seinem Ja).' },
    eingaben: { sitzung: 'Die 22 ruhenden Fachbegriffe stehen als Frage auf seiner Warteseite („die hand voll weitere"). Wählt er welche, '
        + 'ergänzt eine Sitzung je Begriff eine Zeile in FACHBEGRIFF_AUFTRAG mit Datum und seinem Satz, dann ausliefern.',
      werkzeug: 'werkzeuge/wartet-auf-elias.mjs' },
    veralten: { routine: W, schritt: '1b.6', beleg: 'node werkzeuge/alle-pruefer.mjs', werkzeug: 'werkzeuge/pruefe-fachbegriff-auftrag.mjs',
      wie: 'prüft jede Zeile (Datum, sein Satz, echte Kennung), dass js/kern.js an der Tür nach VOCAB_DATA und an den zwei Nebentüren '
        + '(Buchtausch, Fortschritt) filtert, die Funktion zweiseitig am echten Text, und dass die Wartungsroutine fachbegriffe-setzen.mjs '
        + 'weder genannt noch freigegeben bekommt; jede Erkennung vorher an 9 Gegenproben geeicht. Störtest: Routine-Freigabe drin = Exit 1' },
  },
  {
    /* ⭐ 23.09.2026 — DER HÖRMODUS HAT JEDES WORT, DAS DIE KARTEI ABFRAGT.
       Elias auf meine Frage „Soll er sie mitnehmen?": „ja, alle vokabeln die
       abgefragt werden soll er haben". Eine Zeile in hoerbareVokabeln()
       (js/hoeren.js) — INNERHALB einer bestehenden Datei, also von Hand hier
       eingetragen. Gemessen mit seinem Stand (20:36): 34 Kartei-Wörter fehlten
       im Hörmodus, danach 0; Hörvorrat 285 → 319, keines ging verloren. */
    funktion: 'Hörmodus fragt alles, was die Kartei fragt',
    dateien: [],
    bildschirme: [],
    neuerInhalt: { nein: 'Kein eigener Inhalt: der Hörvorrat folgt passtZurAuswahl() — schaltet er ein Wort frei oder wählt ein Kapitel, steht es ohne Zutun in beiden.' },
    eingaben: { nein: 'Er trägt hier nichts ein; die Auswahl trifft er wie bisher auf der Startseite und bei den Karteikarten.' },
    veralten: { routine: W, schritt: '1b.6', beleg: 'node werkzeuge/alle-pruefer.mjs', werkzeug: 'werkzeuge/pruefe-hoer-auswahl.mjs',
      wie: 'lässt hoerbareVokabeln() und passtZurAuswahl() aus dem echten Quelltext in einer kleinen Welt mit und ohne Kapitel-Einengung laufen: '
        + 'jedes Kartei-Wort mit Bedeutung muss im Hörvorrat stehen, nichts, was vorher darin stand, darf fehlen. Die Welt wird geeicht '
        + '(ohne die Zeile zeigt sie den Fehler vom 23.09.). Störtests: Vereinigung entfernt, bekannteVokabeln() statt VOCAB_DATA, '
        + 'Ersetzung statt Vereinigung = je Exit 1' },
  },
  {
    /* ⭐ 22.09.2026 — BEISPIELSÄTZE FÜR DIE FACHBEGRIFFE.
       Elias mit dem Bild einer Karte, auf der nur eine Eselsbrücke stand:
       „kein beispielsatz, sorge dafür das alle ien beispielsatz haben"
       Die Freigabe zum Verfassen steht seit dem 19.08.2026 im Kopf von
       data/beispielsaetze.js: „die sollst du auch eigentlich bauen aber da muss
       drauf geachtet werden, dass es natürlich dann auch die richtige grammatik
       hat." Deshalb ist die Lücke kein Wartepunkt auf IHN, sondern auf Material. */
    funktion: 'Beispielsätze der Fachbegriffe',
    dateien: [],
    bildschirme: [],
    neuerInhalt: { routine: W, schritt: '1b.6', beleg: 'node werkzeuge/alle-pruefer.mjs', werkzeug: 'werkzeuge/pruefe-beispielsaetze.mjs',
      wie: 'zählt jede Karte ohne Beispielsatz und schlägt mit --kandidaten vorhandene Sätze vor, in denen das Wort ALS WORT steht; Exit 2 bei Lücken, Exit 1 nur bei einem Werkzeugfehler' },
    eingaben: { nein: 'Er trägt hier nichts ein — er hat die Lücke gemeldet, und gebaut wird sie aus seinem eigenen Wortbestand.' },
    veralten: { nein: 'Ein einmal verfasster Satz bleibt richtig. Kommt eine neue Karte dazu, meldet derselbe Prüfer sie als Lücke — die Zahl veraltet also nicht still.' },
  },
  {
    /* ⭐ 22.09.2026 — EIN FACHBEGRIFF, DER SCHON IM BUCH STEHT.
       Elias: „es gibt zwei mudaf, ich möchte eigentlich nur eins haben. lass
       das in kapitel 24 … nimm die höhere box." Gelöst über das Feld
       `buchTausch` (fachbegriffeMitBuchkarte in js/kern.js, aufgerufen aus
       js/buecher.js) — innerhalb bestehender Dateien, deshalb von Hand hier. */
    funktion: 'Fachbegriffe mit Buchkarte zusammenführen',
    dateien: [],
    bildschirme: [],
    neuerInhalt: { nein: 'Es entsteht nichts. Eine doppelte Karte fällt weg, und die bleibende bekommt die Beschreibung, die Elias wollte.' },
    eingaben: { nein: 'Die Zuordnung steht in data/fachbegriffe.js und ist eine Entscheidung je Wort — er trägt sie nicht selbst ein, er nennt sie.' },
    /* ⛔ Zweierlei kann still ausfallen: die Zuordnung zeigt ins Leere (dann ist
       das Wort GAR nicht mehr da, nicht nur nicht doppelt), und das Feld
       überlebt ein Neuerzeugen von data/fachbegriffe.js nicht. */
    veralten: { routine: W, schritt: '1b.6', beleg: 'node werkzeuge/alle-pruefer.mjs', werkzeug: 'werkzeuge/pruefe-buchtausch.mjs',
      wie: 'prüft die Zuordnung, den Aufruf und den Fortschritt — und führt js/kern.js wirklich aus, um danach zu messen, was in VOCAB_DATA steht. Exit 2 nennt weitere Kandidaten, über die Elias noch nicht entschieden hat' },
  },
  /* 22.09.2026 (v569), innerhalb von functions/api/diagnose.js,
     js/einstellungen.js und werkzeuge/diagnose-holen.mjs und deshalb von Hand
     hier: die Diagnose liegt jetzt unter `diagnose:<mail>:<gerät>` statt unter
     `diagnose:<mail>`. Vorher überschrieb das zweite Gerät das erste — gemessen
     am 22.09.2026: Elias' Tablet-Bericht (Serverzeit 20:23:10Z) war weg,
     nachdem das Handy (20:37:37Z) geschickt hatte. Mein Baufehler, nicht seiner.
     Kein neuer Pflegebedarf, und zwar geprüft:
     · neuer Inhalt — nein, es entsteht ein Schlüssel je Gerät statt einer, und
       diagnose-holen.mjs listet ohnehin schon mit Präfix, zeigt also alle;
     · seine Eingaben — die Diagnose IST seine Eingabe, und sie wird von Hand
       gelesen, wenn er sagt „ich hab dir Diagnose geschickt". Kein Kreislauf,
       der von selbst laufen müsste;
     · veralten — ja, ein alter Bericht; er trägt die Serverzeit im Kopf, und
       die steht bei jedem Abruf mit da. Ein Aufräumen braucht es nicht: KV
       hält je Gerät genau einen Eintrag, nicht einen je Absendung.
     ⚠️ Und diagnose-holen.mjs läuft wieder: wrangler 4.120.1 → 4.124.0. Die
     alte Fassung meldete „Ist wrangler angemeldet?", obwohl sie es war. */
  {
    funktion: 'Kategorien und Wortliste',
    dateien: ['js/kategorien.js', 'wortfelder-data.js'],
    bildschirme: ['screen-categories', 'screen-wordlist'],
    neuerInhalt: { routine: W, schritt: '6', beleg: 'node pruefe-wortfelder.js',
      wie: 'meldet Wörter, deren Bedeutung in kein Wortfeld fällt' },
    eingaben: { nein: 'Eigene Kategorien sind Ansichtssache auf seinem Gerät (vt_customCats) — niemand muss sie weiterverarbeiten.' },
    veralten: { nein: 'Die Listen entstehen beim Öffnen aus den aktuellen Vokabeln; es wird nichts gespeichert, das alt werden kann. '
      + 'Dass seine Änderungen im Formular der Wortkarte (vt_wortAenderungen) Neustart und Geräteabgleich überstehen — Elias, 24.09.2026: '
      + '„meine bearbeitungen werden scheinbar nicht gespeichert" —, misst pruefe-bearbeiten.mjs im Sammellauf.' },
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
  /* 19.09.2026 (v532), innerhalb von js/uebung.js und deshalb von Hand hier:
     uebungKeineRegel() — „Welche Regel?" fragt nichts aus dem Thema „Schrift"
     mehr und nichts, was schon im Namen sagt, dass es keine Regel ist
     (UEBUNG_KEINE_REGEL: Namenserklärung, Merkhilfe, Überblick), auch nicht
     als falsche Antwort. Elias: „generell alle antowrtoptionen sind eigentlich
     keine regeln. … mache das weg und alle die dem ähnlich oder gleich sind".
     Kein neuer Schlüssel, und kein neuer Pflegebedarf, weil beide Wege neue
     Regeln von selbst erfassen:
     · eine neue Schrift-Regel fällt über das Muster in SATZ_THEMEN mit weg;
     · ein neuer Eintrag mit „Überblick", „Merkhilfe" oder „so heißen" im Namen
       macht test-welche-regel.mjs rot, bis er in der Liste steht. Der läuft
       über alle-pruefer.mjs (Wartung 1b.6) — also genau dann, wenn neue Regeln
       ausgeliefert werden, und nur dann kann sich sein Ergebnis ändern. */
  /* 19.09.2026 (v533), innerhalb von js/uebung.js und deshalb von Hand hier:
     uebungZarfMitGenitiv() — in „Tippe alle مُضَافٌ an" zählt jede Orts- und
     Zeitangabe mit einem Genitiv dahinter als مُضَاف, das Wort dahinter als
     مُضَاف إِلَيْه; „Warum?" zeigt dann zarf-als-mudaf-01, auch bei „Welcher
     Fall?". Elias: „lass die zwei dann gelten und auch andere ähnliche
     ortangaben oder zeitangeben". Kein neuer Schlüssel, kein neuer
     Pflegebedarf: welche Wörter Orts-/Zeitangaben sind, steht in EINER Liste
     (ZURUF in js/irab.js) — ein neues Wort dort gilt hier von selbst.
     Bewacht von test-zarf-als-mudaf.mjs über alle-pruefer.mjs. */
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
    veralten: [
      { routine: W, schritt: '1c.8c', beleg: 'node werkzeuge/regelpruefung-seite.mjs', werkzeug: 'werkzeuge/regelpruefung-seite.mjs',
        wie: 'die Regelprüfungs-Seite wird mit jeder neuen Regel neu gebaut' },
      /* ⭐ 22.09.2026 (v562): `hinweisVerraet` je Übung. Elias: „Bau das bitte
         so, dass die Routinen es aktuell halten." Das Feld ist ein Urteil über
         einen TEXT und veraltet still: wer einen Hinweis um ein Beispielwort
         ergänzt, macht aus einer Einordnung eine Lösung, und nichts meldet
         sich. Ebenso still ist eine neue Übung ohne das Pflichtfeld. */
      { routine: W, schritt: '1b.6', beleg: 'node werkzeuge/pruefe-hinweise.mjs', werkzeug: 'werkzeuge/pruefe-hinweise.mjs',
        wie: 'verräterische Hinweise im Satzmodus bleiben verborgen, bis Elias geantwortet hat — geprüft am echten Aufgabenbestand, nicht an einer Handliste' },
    ],
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
    /* Neu am 22.09.2026. Elias: „wir hatten ausgemacht das du das machen sollst
       bzw bewerten sollst und ich hatte dir noch gesagt das du auch meine
       unterlagen regelmässig gucken sollst und auch das in deine analyse mit
       einbeziehen sollst und auch die schlüssel bücher die wir haben usw."
       ⛔ Die Seite legte ihm bis dahin ALLE 95 Fundstellen vor. Jetzt bewerte
       ich jede einzeln gegen die Quellen; zu ihm kommen nur noch die, die ohne
       ihn nicht zu entscheiden sind. Gemessen: 95 → 7. */
    funktion: 'Regelkandidaten bewerten und freigeben (Artefakt)',
    /* ⚠️ KEINE App-Dateien: die Seite ist ein Artefakt für ihn, kein Teil der
       App — wie bei der Regelkategorien-Seite darüber. */
    dateien: [],
    bildschirme: [],
    neuerInhalt: [
      { routine: W, schritt: '1c.8b', beleg: 'node werkzeuge/kandidaten-bewerten.mjs', werkzeug: 'werkzeuge/kandidaten-bewerten.mjs',
        wie: 'jede neue Fundstelle aus kandidaten.mjs bekommt beim nächsten Lauf ihre Belege gesucht (Schlüssel 1 über die Vault-Notiz, Band 2+3, die vorhandenen Regeln) und wartet dann sichtbar auf MEIN Urteil' },
      { routine: W, schritt: '1c.8b', beleg: 'node werkzeuge/freigabe-artefakt.mjs', werkzeug: 'werkzeuge/freigabe-artefakt.mjs',
        wie: 'aus der Bewertung wird die Seite gebaut — nur regel, abweichung und unbelegt landen als Entscheidung darauf' },
    ],
    eingaben: { routine: W, schritt: '1c.8b', beleg: 'artefakte/freigabe.html',
      wie: 'seine Antworten kommen als Textblock aus der Seite (Kennung plus JA/NEIN/SPAETER bzw. SCHLUESSEL/LEHRER) und werden von Hand in grammar-data.js eingetragen — jede neue Regel braucht sein Ja' },
    veralten: [
      { routine: W, schritt: '1c.8b', beleg: 'node werkzeuge/kandidaten-bewerten.mjs', werkzeug: 'werkzeuge/kandidaten-bewerten.mjs',
        wie: 'Exitcode 1, sobald ein Kandidat ohne Urteil, ohne Begründung, ohne Fundstelle oder (bei einer Frage an ihn) ohne Frage dasteht — mein Rückstand wird dadurch sichtbar statt zu seiner Arbeit zu werden' },
      /* ⛔ Der teuerste Fehlerfall dieses Werkzeugs ist kein Absturz, sondern
         eine LEERE Quelle: fehlt die Schlüssel-Textebene oder die Vault-Notiz,
         wären alle Treffer null und jeder Kandidat sähe „nicht belegt" aus.
         Genau so landet einer fälschlich bei Elias. Deshalb prüft der Lauf
         beide Quellen und wird rot, wenn eine fehlt.
         [[leere_liste_ist_keine_messung]] */
      { routine: W, schritt: '1c.8b', beleg: 'node werkzeuge/kandidaten-bewerten.mjs --stoertest', werkzeug: 'werkzeuge/kandidaten-bewerten.mjs',
        wie: 'der Störtest ignoriert die Urteile und muss rot werden — er belegt, dass der Lauf überhaupt messen kann' },
    ],
  },
  {
    /* Neu am 17.09.2026. Elias am 16.09.2026, 19:11:57: „ja mein gedächtnis soll
       immer auf dem aktuellsten stand sein mit allem". Keine App-Datei — ein
       Werkzeug, das den Inhalt der App als Notizen in seinen Vault schreibt. */
    funktion: 'Gedächtnis-Spiegel (Vault-Notizen)',
    dateien: [],
    bildschirme: [],
    neuerInhalt: { routine: W, schritt: '1b.6', beleg: 'node werkzeuge/veroeffentlichen.mjs',
      wie: 'veroeffentlichen.mjs ruft gedaechtnis-spiegel.mjs nach jedem Upload auf — jede ausgelieferte Regel, Karte, jeder Satz steht danach im Vault' },
    eingaben: { nein: 'Elias trägt dort nichts ein: die Notizen sind erzeugt und tragen den Hinweis, dass Handänderungen überschrieben werden.' },
    veralten: [
      { routine: W, schritt: '1b.6', beleg: 'Gedächtnis-Spiegel NICHT nachgezogen',
        wie: 'scheitert der Spiegel, meldet veroeffentlichen.mjs das laut und die Wartung schreibt es in den Bericht; test-gedaechtnis-spiegel.mjs (alle-pruefer) prüft Vollständigkeit und --pruefen' },
      /* ⛔ Neu am 22.09.2026. Elias auf die Frage, wohin neue Einträge gehören:
         „oben, räume demtentsprechend um". Was veraltet, ist hier nicht der
         Inhalt, sondern die REIHENFOLGE: wird einmal unten angehängt, hat die
         Notiz wieder einen absteigenden Kopf und einen aufsteigenden Rumpf —
         genau der Zustand, den das Umräumen an diesem Tag behoben hat (16
         Brüche in Vokabeltrainer-Arabisch.md). */
      { routine: W, schritt: '1b.6', beleg: 'node werkzeuge/notiz-umraeumen.mjs', werkzeug: 'werkzeuge/notiz-umraeumen.mjs',
        wie: 'im Sammellauf: Exit 1, sobald in einer Projektnotiz ein älterer Abschnitt vor einem neueren steht — mit --schreiben räumt dasselbe Werkzeug um, nach fünf Gegenproben' },
    ],
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
  /* 19.09.2026 (v535), innerhalb von js/quran-audio.js und deshalb von Hand
     hier: die Rezitation hält jetzt durch, wenn der Bildschirm aus ist. Elias:
     „wenn ich einen rezitator spielen lasse, dass er immer wieder aufhört und
     nicht durch spricht … Vorallem wenn ich meinen Bildschirm aus mache".
     Vier Dinge: ein Verswechsel schaltet die stille Schleife nicht mehr ab, ein
     kaputt vorgeladenes Element wird erkannt, eine Wache holt nach 6 s
     Stillstand denselben Vers an derselben Stelle nach, und die Neuversuche
     reichen jetzt zehn Minuten weit (dazu `online`). Kein neuer Pflegebedarf:
     kein neuer Inhalt, kein neuer Speicherschlüssel, nichts, was veraltet —
     alles hängt am Ton von quran.com, der schon geprüft wird.
     Bewacht von werkzeuge/pruefe-zweipuffer.mjs (Verswechsel, kaputter Vorrat,
     Stillstands-Wache, je mit Störtest) und test-quran-vorladen.mjs.
     ⚠️ Offen und ehrlich: bei AUSGESCHALTETEM Bildschirm ist nichts davon
     gemessen — hier läuft kein Ton, und der Pane darf keinen machen. Das zeigt
     erst sein Handy; der Punkt steht in der To-Do. */
  {
    funktion: 'Quran-Leser und Quranbezug der Vokabeln',
    dateien: ['js/quran.js', 'js/quran-audio.js', 'js/quran-markierung.js', 'surah-data.js', 'quran-seiten.js', 'quran-verszeichen.js', 'quran-frequency-data.js', 'quran-text.js'],
    bildschirme: ['screen-quran', 'screen-quranfull'],
    neuerInhalt: { routine: W, schritt: '6', beleg: 'node pruefe-quran.js',
      wie: 'Quranbezüge neuer Vokabeln werden gegen den Qurantext gehalten' },
    /* 22.09.2026: vt_tajweed ist jetzt eine Eingabe, die verarbeitet wird —
       Elias: „nach einem monat kann sie automatisch verschwinden aber du
       solltest trotzdem aufzeichnen welche ich markiert habe". Die App blendet
       nach 30 Tagen aus (TJ_SICHTBAR_MS), das Archiv behält. Der Rest bleibt,
       wie er war: Lesezeichen, Lesestand und Audio-Einstellungen sind Zustand
       seines Geräts; vt_hifz führt pruefe-kreislaeufe.mjs als ausgewertet über
       data/auswendig.json; vt_suraGelesen wertet die App selbst aus (Ringe). */
    eingaben: { routine: W, schritt: '1c.1b', beleg: 'node werkzeuge/tajweed-markierungen.mjs', werkzeug: 'werkzeuge/tajweed-markierungen.mjs',
      wie: 'seine Tajweed-Markierungen (vt_tajweed) wandern aus dem Abgleich in data/tajweed-archiv.json, das nur wächst — auch ausgeblendete bleiben dort' },
    /* 16.09.2026 abends (v505): eine heute als auswendig abgehakte Sure zählt
       heute nicht als Wiederholung (sie hatte az-Zalzala vom Ring verdrängt).
       Liest nur HIFZ_ZEIT, das es schon gab; neu ist lerntagVon() in js/kern.js.
       Kein neuer Pflegebedarf — test-surenringe.mjs spielt den Tag nach. */
    /* 17.09.2026 (v526): JEDER Favorit außer al-Mulk ist ein eigener Ring
       „Neu lernen", auch wenn er als auswendig abgehakt ist — weg erst mit dem
       Stern (Elias: „erst wenn ich sie von den favouriten löse dann kann sie
       tatsächlich weg"). Favoriten stehen dafür nicht in der Wiederholungsrunde.
       Liest nur QURAN_FAV und HIFZ, die es schon gab; kein neuer Schlüssel.
       Kein neuer Pflegebedarf — test-surenringe.mjs spielt seinen Stand vom
       17.09. nach, mit zwei Gegenproben. */
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
    /* ⭐⭐ 17.09.2026 (v527): DERSELBE HAKEN GEHT JETZT IN BEIDE RICHTUNGEN.
       Elias: „dass ich in die sure nach unten gehen kann und das heute gelesen
       antippen kann damit es nicht mehr als gelesen gilt und auch der ring
       dann wieder nicht voll ist". Ein zweites Tippen nimmt ihn zurück, der
       Ring ist wieder offen, und die Automatik trägt ihn in derselben Lesung
       nicht erneut ein.

       ⛔ EIN NEUER SCHLÜSSEL, und er hat Pflegebedarf an drei Stellen:
       `vt_suraGelesenZeit` (js/quran.js) merkt je Sure den Zeitpunkt des
       letzten Handgriffs. Ohne ihn hätte der Geräteabgleich jede Rücknahme
       zurückgeholt — er entschied je Sure nach dem jüngeren DATUM, und eine
       Rücknahme ist ein fehlender Eintrag ohne Datum. Eingetragen ist er
       deshalb in js/sync.js (eigener Zweig: der spätere Handgriff gewinnt),
       in der Sicherung (js/einstellungen.js) und in pruefe-kreislaeufe.mjs.
       Gemessen von test-sync.mjs (drei Fälle samt Gegenprobe),
       test-lesezaehlung.mjs (die Automatik zählt nach der Rücknahme nicht
       nach) und test-surenringe.mjs (der Ring wird wieder leer).
       ⚠️ Der Schlüssel wächst nie über 114 Einträge — einer je Sure. */
    /* ⭐ 18.09.2026 (v529): EINE ZUFÄLLIGE SURE DES TAGES, Ring „Zufällig".
       Elias, unterwegs in seine Google-Aufgaben: „Random sura die ich nicht
       auswendig kann als Ring machen Claude", im Chat: „als tagesziel so zu
       sagen, einfach auf dem startbildschirm". Gezogen aus allem ohne Haken
       „auswendig", ohne Favoriten, ohne al-Fātiḥa und al-Mulk; das Los hängt am
       Datum — den ganzen Tag und auf jedem Gerät dieselbe Sure.
       Kein neuer Schlüssel, kein neuer Inhalt: die Auswahl rechnet aus vt_hifz
       und vt_quranFav, gelesen wird über vt_suraGelesen wie bei allen Ringen.
       ⛔ Pflege an EINER Stelle: der neue Bereich `zufall` des stillen
       Zielverlaufs steht in ZIELVERLAUF_ABGELEITET (js/sync.js); test-sync.mjs
       prüft seit heute, dass JEDER Surenring dort steht (Störtest: ohne ihn
       2 rot). Veralten kann nichts — hakt er Suren ab, rechnet die Auswahl am
       nächsten Lerntag von selbst. Bewacht von test-surenringe.mjs, Abschnitt 9. */
    /* ⭐ 18.09.2026 abends (v530): STATT EINER SURE EINE SEITE. Elias: „gib mir
       immer nur eine ganze seite zum lesen und du sollst die seite auch vor
       geben also einfach irgendeine seite aus dem koran. wenn ich auf link
       drücke soll es mich direkt dahinbringen". Auch Seiten über eine
       Surengrenze („warum so wenig?" auf 550); ohne die acht, die er mit „mach
       mit ausnahme von denen" ausgenommen hat (ZUFALL_AUSGENOMMEN in
       js/quran.js — eine Liste, KEIN Haken: „nein mach das nicht").
       Kein neuer Schlüssel: gelesen steht in vt_suraGelesen unter „seite:N",
       Zurücknehmen in vt_suraGelesenZeit — Abgleich, Sicherung und Rücknahme
       gehen dadurch ohne Änderung mit. ⚠️ Beide wachsen damit über 114
       Einträge hinaus, aber nie über 604 + 114 — eine Zeile je Seite und je
       Sure, jeweils nur das letzte Datum. Veralten kann nichts: die Seiten-
       grenzen stehen in quran-seiten.js, und hakt er eine Sure ab, rechnet
       die Auswahl ab dem nächsten Lerntag ohne sie. Bewacht von
       test-surenringe.mjs (Abschnitt 9: 591 Seiten, fünf Gegenproben) und
       test-lesezaehlung.mjs (Abschnitt 9: gezählt in der Sure, in der die
       Seite endet; Gegenprobe mit der alten Regel: 4 rot). */
    /* ⭐ 18.09.2026 abends (v531): DIE TAGESSEITE WIEDERHOLT SICH ERST, WENN
       ALLE GELESEN SIND. Meine Frage: „Soll die tägliche Seite sich erst
       wiederholen, wenn alle 591 einmal dran waren?" — Elias: „ja klingt gut".
       Kein neuer Schlüssel: die Runde steht in den „seite:N"-Einträgen von
       vt_suraGelesen (Tag der letzten Lesung). ⛔ Diese Einträge sind damit
       das Gedächtnis der Runde — kein Werkzeug und keine Routine darf sie
       aufräumen oder kürzen, sonst kommen gelesene Seiten zu früh wieder.
       Veralten kann nichts: sind alle gelesen, kommt von selbst die am
       längsten nicht gelesene. Bewacht von test-surenringe.mjs (Abschnitt 9:
       591 Tage lesen → jede Seite genau einmal; drei Gegenproben). */
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
    veralten: { nein: 'Nichts Gespeichertes; ob fünf Antworten und die Ähnlichkeit wirken, misst pruefe-hoerablenker.mjs im Sammellauf; '
      + 'dass der Lautsprecher nach der Antwort dasselbe Wort spielt (Elias, 24.09.2026), pruefe-hoer-ton.mjs.' },
  },
  {
    /* ⭐ 23./24.09.2026 — DIE KAPITELLISTE ZEIGT JEDES BUCH, DAS ER LERNT.
       Elias: „die vokabeln gehen nur bis medina 24, ich bin aber bayna yadayk"
       und „am besten sobald ich neues buch freischalte soll neues buch kommen und
       alle kapteln gezeigt werden da". renderChapterCats() und openWordList() in
       js/kategorien.js — INNERHALB bestehender Dateien, also von Hand hier.
       Seit v585 live (mitgenommen von der Routine „neue Kapitel"), committet 00:32. */
    funktion: 'Kapitelliste je Buch',
    dateien: [],
    bildschirme: [],
    neuerInhalt: { nein: 'Abgeleitet aus seiner Buchauswahl (aktiveBuecher) und den geladenen Kapiteln: ein neu gewähltes Buch steht ohne Zutun mit allen Kapiteln da.' },
    eingaben: { nein: 'Er wählt Bücher und Kapitel wie bisher; die Liste zeigt nur.' },
    /* Seit 24.09.2026 eingelöst: sein „irgendwer soll auch gucken ob das meine
       kapitel hier auch aktuell sind und auch bücher". Die Seite selbst misst
       pruefe-vokabeln-seite.mjs (Sammellauf, 4 Störtests); ob Bücher und Kapitel
       mit seinem Stand übereinstimmen, misst pruefe-buecher-aktuell.mjs direkt
       nach vorrat.mjs --stand — dabei fiel „aby-1" (Bayna Yadayk 1) auf, das
       arabicroots so nennt und vorrat.mjs bis dahin still verwarf. */
    veralten: { routine: W, schritt: '1c.1', beleg: 'node werkzeuge/pruefe-buecher-aktuell.mjs', werkzeug: 'werkzeuge/pruefe-buecher-aktuell.mjs',
      wie: 'arabicroots, seine Auswahl, FREIGESCHALTET und die Buchdateien gegeneinander — Befund in den Bericht, eine Frage an ihn nur, wo seine Auswahl entscheidet (Warteseite)' },
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
    veralten: { nein: 'Erzeugt nichts, das gespeichert wird und alt werden kann — bis auf seine Antwort bei „Arabisch testen" (vt_arabischOhneListe, v575): die kann nach einer Deinstallation stehen bleiben, dann meldet die App „Kein Ton" mit dem Weg zum Test, und sein Nein nimmt sie zurück. Kein Werkzeug sieht die Sprachausgabe seines Geräts, also auch kein Routineschritt.' },
  },
];
