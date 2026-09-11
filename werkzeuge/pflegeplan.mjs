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
    dateien: ['js/buecher.js', 'js/vokabelpaket.js', 'data/buecher.js', 'data/vokabeln-eigene.js'],
    bildschirme: [],
    neuerInhalt: { routine: W, schritt: '2', beleg: 'node werkzeuge/hole-vokabeln.mjs', werkzeug: 'werkzeuge/hole-vokabeln.mjs',
      wie: 'frischt die Lehrwerke und seine eigenen Wörter aus arabicroots auf' },
    eingaben: { routine: W, schritt: '1c.1', beleg: '--app auto', werkzeug: 'werkzeuge/vorrat.mjs',
      wie: 'welche Kapitel er freigeschaltet hat, kommt aus seinem abgeglichenen Stand' },
    veralten: { routine: W, schritt: '2', beleg: 'node werkzeuge/baue-vokabelpaket.mjs', werkzeug: 'werkzeuge/baue-vokabelpaket.mjs',
      wie: 'das Vokabelpaket wird nach dem Abzug neu gebaut' },
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
    dateien: ['js/quran.js', 'js/quran-audio.js', 'surah-data.js', 'quran-seiten.js', 'quran-frequency-data.js', 'quran-text.js'],
    bildschirme: ['screen-quran', 'screen-quranfull'],
    neuerInhalt: { routine: W, schritt: '6', beleg: 'node pruefe-quran.js',
      wie: 'Quranbezüge neuer Vokabeln werden gegen den Qurantext gehalten' },
    eingaben: { nein: 'Lesezeichen, Lesestand und Audio-Einstellungen sind Zustand seines Geräts; vt_hifz führt pruefe-kreislaeufe.mjs als ausgewertet über data/auswendig.json.' },
    veralten: { nein: 'Qurantext, Suren und Seitengrenzen ändern sich nicht. quran-frequency-data.js wird aus dem Quran-Korpus berechnet (baue-quran-frequenz.mjs); neue Wurzeln brächte nur ein neues Lehrwerk.' },
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
