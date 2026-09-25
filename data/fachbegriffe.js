/* ---------------------------------------------------------------------------
   Die arabischen Fachbegriffe aus Elias' Unterricht — als eigene Vokabeln.

   Elias am 17.08.2026: „und da ist es auch wichtig, dass auch vorallem begriffe
   genutzt werden, die in meinem unterricht häufiger verwendet werden wie
   harfuljar oder so … ebenso auch adjektiv oder das sich darauf beziehende
   nomen auf arabisch dieser name, all diese sachen sagt er wirklich auf
   arabisch." Und danach ausdrücklich: „die müssen inkludiert werden und als
   eigene vokabeln hinzugefügt werden. mach das alles für mich."

   ⭐ Warum das nötig war, gemessen und nicht geschätzt: In vocab-data.js standen
   **6 von 171** Wörtern, die überhaupt Fachbegriffe sind (3,5 %) — und alle
   sechs unter „Eigene Vokabeln". Sein Lehrer spricht diese Wörter in jeder
   Stunde aus, abgefragt wurden sie so gut wie nie.

   ⛔ HERKUNFT DER SCHREIBUNGEN — nichts hier ist von mir vokalisiert.
   Jede arabische Zeichenkette unten ist aus `grammar-data.js` übernommen, also
   aus Elias' eigenen 73 Regeln, die aus den Unterrichtsfolgen und dem
   Madina-Schlüssel stammen. Das Feld `regel` nennt die Regel-Id, aus der sie
   kommt; `belegt` zählt, wie oft die Schreibung dort vorkommt (gemessen am
   17.08.2026 mit einem Abgleich ohne Vokalzeichen über die ganze Datei).

   ⚠️ Vier Schreibungen waren in der Quelle UNVOLLSTÄNDIG vokalisiert und wurden
   trotzdem so übernommen, statt ein Taschkīl zu erfinden. Der Satz dazu lautete:
   „Das gehört auf die Liste für Elias: er kann seinen Lehrer fragen. Ein
   geratenes Taschkīl wäre hier schlimmer als eine sichtbare Lücke, weil er es
   auswendig lernen würde."

   ⭐⭐ AM 06.09.2026 HAT DER LEHRER GEANTWORTET. Elias' Musterlösung zur
   Grammatikabfrage (Samsung Notes, 01.09.) schreibt zwei davon voll aus, und
   damit war es kein Raten mehr, sondern Abschreiben:

     · إِضَافَة  — ml-01, Überschrift 1 („اَلْإِضَافَة / مُضَاف") und Fließtext
                  („Eine إِضَافَة (Iḍāfa) verbindet zwei Nomen"). Vorher stand
                  hier إِضافة ohne Zeichen auf ض ا ف, 42× im ganzen Bestand.
     · اِسْمُ الْإِشَارَة — ml-04, Überschrift 3. Vorher stand die Form OHNE
                  Kasra unter dem Hamzat al-waṣl. ⭐ Die Datei wusste es
                  eigentlich schon: hier stand der Hinweis, dass es in der
                  Quelle ZWEI Schreibungen gebe (2× ohne, 1× mit Kasra) und die
                  häufigere genommen sei. Die seltenere war die richtige.

   ⛔ ZWEI SIND WEITERHIN OFFEN — der Lehrer erwähnt sie in der Musterlösung
   nicht, also bleibt es beim Original:
     · شَكْل    — vollständig, aber der Plural تَشْكيل daneben nicht
     · تاء مَرْبُوطة — das erste Wort ohne jedes Zeichen (4× so, 3× ganz nackt)
     · أَلِف مَقْصورة — مقصورة ohne Zeichen auf ص و ر  (3× so)

   ⚠️ Wer hier wieder etwas vereinheitlicht, prüfe DIESEN Kommentar mit: die
   Ersetzung vom 06.09. hat ihn beim ersten Lauf selbst getroffen und aus
   „إِضافة — ohne Zeichen auf ض ا ف" ein „إِضَافَة — ohne Zeichen auf ض ا ف"
   gemacht, also einen Satz, der sich selbst widerspricht.
   [[eingefrorenes_feld_ist_kein_zustand]]

   ⭐⭐ SEIT DEM 16.09.2026 MIT ENDUNG. Gefragt: „Sollen Fachbegriffe mit Endung
   stehen, also حَرْفُ جَرٍّ statt حَرْف جَرّ, so wie auf deiner Regelkarte?" —
   Elias um 18:53:56: „ja". Anlass war seine eigene Frage an حَرْف جَرّ im
   Satzmodus: „kann es sein das das falsch geschrieben ist".
   Damit gilt die frühere Haltung „Zitierform ohne Endung, richtig so" nicht mehr.

   ⛔ Nur wo die Form MIT Endung in seinem eigenen Material steht (gezählt über
   vocab-data.js, grammar-data.js, regelsammlung-data.js, beispielsaetze.js,
   eselsbruecken.js und die Buchabzüge — gleiche Schreibung, auch wenn das Wort
   dort etwas anderes heißt, etwa ظَرْفٌ „Umschlag"):
     مُضَافٌ · مَجْرُورٌ · مَرْفُوعٌ · نَعْتٌ · إِضَافَةٌ · ظَرْفٌ · شَكْلٌ ·
     مُبْتَدَأٌ · خَبَرٌ · مَنْصُوبٌ · حَرْفٌ · فِعْلٌ · مَدٌّ · مُطَابَقَةٌ · تَقْدِيمٌ
   NOCH OHNE Endung, weil kein Beleg gefunden (nicht selbst ergänzen):
     اِسْمُ الْإِشَارَة · تَاء مَرْبُوطَة · أَلِف مَقْصورة · كَسْرَة · تَشْكِيل ·
     هَمْزَة وَصْل · جُمْلَة فِعْلِيَّة · إِعْرَاب · حُرُوف شَمْسِيَّة
   ⚠️ Der Doppelt-Abgleich (dubForm in js/kern.js) ignoriert die letzte Ḥaraka —
   ein Tausch gegen eine Buchvokabel wird durch die Endung weder wahrscheinlicher
   noch unwahrscheinlicher; er verlangt ohnehin dieselbe Bedeutung.

   ---------------------------------------------------------------------------
   TECHNISCH: `book: 'grammar'` (die Herkunft) und `chapter: 'personal'`.
   ⚠️ Das `chapter` war bis zum 20.08.2026 ebenfalls 'grammar'. Elias an
   diesem Tag: „ich finde die kategorie ,,fachbegriffe" unnötig. ich möchte das
   all diese begriffe und zukünftige einfach als meine eigenen begriffe gelten.
   sie sollen alle unter eigene vokabeln sein."
   ⛔ `book` bleibt 'grammar' und ist ab jetzt das EINZIGE Merkmal: daran haengen
   der Fachbegriff-Takt im Lernmodus (jeder sechste Platz), der Hoermodus und die
   Zaehlung in pruefe-oberflaeche.js. Wer es entfernt, schaltet alle drei still ab.

   ⛔ Sie laufen bewusst NICHT unter 'personal'. Der Schalter „Eigene" darf sie
   nicht abschalten können — sonst verschwinden genau die Wörter, um die er
   gebeten hat, sobald er den Schalter einmal ausmacht. In `istBekannt()` und
   `passtZurAuswahl()` (js/kern.js) sind sie deshalb bedingungslos dabei.
   --------------------------------------------------------------------------- */

/* ---------------------------------------------------------------------------
   ⛔⛔ EINE KARTE NUR AUF SEIN WORT (23.09.2026)

   Elias um 15:08, nachdem er im Hörmodus die Karte „Übereinstimmung — die
   Aussage passt sich im Geschlecht an“ gesehen hatte:
     „das ist keine vokabel die ich lernen möchte. wir hatten dieses thema
      schonmal das ich diese fachbegriffe nicht haben will. ich hattte
      spezifisch darum gebeten akkusativ, genitiv und nominativ und vielleicht
      noch eine hand voll weitere zu haben aber nicht solceh dinge. irgendjemand
      fügt sich dauerhaft hinzu und das will ich nicht. prüfe bitte woher das
      kommt und warum und sorge dafür das es nicht wieder so dazu kommt.“

   Der „irgendjemand“ war werkzeuge/fachbegriffe-setzen.mjs in der
   Wartungsroutine (Schritt 1f, seit dem 11.09.2026). Es trug an diesem Tag 16
   Fachbegriffe ein, die er nie einzeln bestellt hatte — darunter مُطَابَقَةٌ
   und die vier, nach denen er am 22.09. gefragt hatte („woher kommt diese
   vokabel, ich weiß nicht ob es sich lohnt die zu lernen“).

   ⭐ DESHALB EINE WEISSLISTE, KEINE SPERRLISTE. Ein Eintrag weiter unten wird
   nur dann eine Karte (Kartei, Hörmodus, Suche, Satzmodus), wenn seine id
   HIER steht — mit Datum und seinem Satz. Alles andere RUHT: es bleibt in der
   Datei, damit ein Wort, das er später doch haben will, mit einer einzigen
   Zeile zurückkommt, und damit die Wortsuche der Übungen (uebersetzungFuer,
   uebsBedeutung) seine Bedeutung weiter kennt. Ein neuer Eintrag — egal von
   wem — ruht damit von selbst. Genau das fehlte: bisher war ein Eintrag in
   der Datei zugleich eine Karte.

   ⛔ Nie eine Zeile ergänzen, „weil der Begriff in seinen Regeln steht“ oder
   „weil der Lehrer ihn benutzt“ — das ist genau der Weg, den er abbestellt
   hat. Eine Zeile braucht SEIN Wort zu genau diesem Wort oder dieser Gruppe.
   Die ruhenden Fachbegriffe stehen als Frage auf seiner Warteseite („die hand
   voll weitere“) — er wählt, nicht ich.

   Bewacht von werkzeuge/pruefe-fachbegriff-auftrag.mjs.
   --------------------------------------------------------------------------- */
const FACHBEGRIFF_AUFTRAG = {
  /* Die drei Fälle — sein Wort von oben. Genitiv und Akkusativ laufen bei ihm
     seit dem 08. und 11.09.2026 als seine Kapitel-24-Karten (Buchtausch,
     vt_geloescht); die Zeile schadet dort nicht und hält die Absicht fest. */
  'gram-majrur': '23.09.2026 — „ich hattte spezifisch darum gebeten akkusativ, genitiv und nominativ“',
  'gram-mansub': '23.09.2026 — „ich hattte spezifisch darum gebeten akkusativ, genitiv und nominativ“',
  'gram-marfu':  '23.09.2026 — „ich hattte spezifisch darum gebeten akkusativ, genitiv und nominativ“',
  /* Läuft als Kapitel-24-Karte (buchTausch '50473') — ohne diese Zeile fiele
     die Zuordnung weg und die Buchkarte verlöre Beschreibung und Box. */
  'gram-mudaf':  '22.09.2026 — „es gibt zwei mudaf, ich möchte eigentlich nur eins haben. lass das in kapitel 24“',

  'gram-suffix-i':  '19.08.2026 — „die sufixe die ich da gelernt haben soll die sollten auch als karteikarte sein“',
  'gram-suffix-ka': '19.08.2026 — „die sufixe die ich da gelernt haben soll die sollten auch als karteikarte sein“',
  'gram-suffix-ki': '19.08.2026 — „die sufixe die ich da gelernt haben soll die sollten auch als karteikarte sein“',
  'gram-suffix-hu': '19.08.2026 — „die sufixe die ich da gelernt haben soll die sollten auch als karteikarte sein“',
  'gram-suffix-ha': '19.08.2026 — „die sufixe die ich da gelernt haben soll die sollten auch als karteikarte sein“',

  'gram-pron-huwa':    '24.08.2026 — „ich brauche alle konjuktionen aus dem video die da genannt werden als karteikarten“',
  'gram-pron-huma-m':  '24.08.2026 — „ich brauche alle konjuktionen aus dem video die da genannt werden als karteikarten“',
  'gram-pron-hum':     '24.08.2026 — „ich brauche alle konjuktionen aus dem video die da genannt werden als karteikarten“',
  'gram-pron-hiya':    '24.08.2026 — „ich brauche alle konjuktionen aus dem video die da genannt werden als karteikarten“',
  'gram-pron-hunna':   '24.08.2026 — „ich brauche alle konjuktionen aus dem video die da genannt werden als karteikarten“',
  'gram-pron-anta':    '24.08.2026 — „ich brauche alle konjuktionen aus dem video die da genannt werden als karteikarten“',
  'gram-pron-antuma':  '24.08.2026 — „ich brauche alle konjuktionen aus dem video die da genannt werden als karteikarten“',
  'gram-pron-antum':   '24.08.2026 — „ich brauche alle konjuktionen aus dem video die da genannt werden als karteikarten“',
  'gram-pron-anti':    '24.08.2026 — „ich brauche alle konjuktionen aus dem video die da genannt werden als karteikarten“',
  'gram-pron-antunna': '24.08.2026 — „ich brauche alle konjuktionen aus dem video die da genannt werden als karteikarten“',
  'gram-pron-ana':     '24.08.2026 — „ich brauche alle konjuktionen aus dem video die da genannt werden als karteikarten“',
  'gram-pron-nahnu':   '24.08.2026 — „ich brauche alle konjuktionen aus dem video die da genannt werden als karteikarten“',

  'gram-zarf-maa':       '26.08.2026 — „ja mach“ (auf die Frage nach Karten für مَعَ und خَيْرٌ)',
  'gram-khayr':          '26.08.2026 — „ja mach“ (auf die Frage nach Karten für مَعَ und خَيْرٌ)',
  'gram-mawsul-alladhi': '05.09.2026 — „das bräuchte ich aber natürlich als karteikarte“',
  'gram-harf-an':        '06.09.2026 — „عَنْ soll rein, mach das volle Programm“',

  'gram-isara-hadhani': '16.09.2026 — „die brauche ich als neue karteikarten damit ich danach abgefragt werde“',
  'gram-isara-hatani':  '16.09.2026 — „die brauche ich als neue karteikarten damit ich danach abgefragt werde“',
  'gram-isara-dhanika': '16.09.2026 — „die brauche ich als neue karteikarten damit ich danach abgefragt werde“',
  'gram-isara-tanika':  '16.09.2026 — „die brauche ich als neue karteikarten damit ich danach abgefragt werde“',

  'gram-frage-madha':    '16.09.2026 — „hab ich die auch schon als karteikarten die mich abfragen? das sind auch wichtige vokabeln“',
  'gram-frage-kam':      '16.09.2026 — „hab ich die auch schon als karteikarten die mich abfragen? das sind auch wichtige vokabeln“',
  'gram-frage-min-ayna': '16.09.2026 — „hab ich die auch schon als karteikarten die mich abfragen? das sind auch wichtige vokabeln“',
  'gram-frage-ila-ayna': '16.09.2026 — „hab ich die auch schon als karteikarten die mich abfragen? das sind auch wichtige vokabeln“',

  'gram-fem-hamra': '16.09.2026 — „ja beides als karteikarten machen“',
  'gram-fem-kubra': '16.09.2026 — „ja beides als karteikarten machen“',
  'gram-harf-bi':   '16.09.2026 — „ja beides als karteikarten machen“',
  'gram-harf-ka':   '16.09.2026 — „ja beides als karteikarten machen“',

  'gram-awlad':      '16.09.2026 — „die vokabeln die ich dort aufgeschrieben habe mit rot die brauche ich auch als karteikarten“',
  'gram-hayya-bina': '16.09.2026 — „die vokabeln die ich dort aufgeschrieben habe mit rot die brauche ich auch als karteikarten“',

  /* Zwei weitere rot beschriftete Wörter aus Bayna Yadayk 1A. Meine Frage vom
     25.09.2026: „Fünf Wörter aus deinem Buch als Karteikarten? „Los gehts",
     „Begrüßen", „Der Alltag", „Vokabeln", „Zusammenfassung"". Seine Antwort
     steht rechts. „Los gehts" ist gram-hayya-bina — seit dem 16.09. seine Karte
     (Box 1, einmal beantwortet), deshalb keine zweite. */
  'gram-tahiyya':        '25.09.2026 — „ja mach außer zusammenfassung und vokabeln“',
  'gram-hayat-yawmiyya': '25.09.2026 — „ja mach außer zusammenfassung und vokabeln“',

  /* ⭐ SEINE „HAND VOLL“, erste Antwort (24.09.2026, 05:00). Auf die Liste der 22
     ruhenden vom Vorabend („Sag mir einfach die, die du wiederhaben willst“)
     zitierte er „Genitivverbindung (Iḍāfa)“ und „Zeit- oder Ortsangabe (Ẓarf)“:
     „die sollen wieder da sein und bleiben“, zur Iḍāfa noch einmal „das auch“,
     und auf meine Rückmeldung dazu „als karteikarten“.
     Die Genitivverbindung läuft als EINE Karte über die Kapitel-24-Karte 50474
     (`buchTausch` am Eintrag, Begründung dort). */
  'gram-idafa': '24.09.2026 — „die sollen wieder da sein und bleiben“ · „als karteikarten“',
  'gram-zarf':  '24.09.2026 — „die sollen wieder da sein und bleiben“ · „als karteikarten“',
};

/* ⛔ AUSDRÜCKLICH ABBESTELLT — diese fragt auch die Warteseite nicht mehr.
   Die übrigen ruhenden stehen dort zur Wahl („die hand voll weitere“); diese
   hat er selbst beim Namen abgelehnt. Eine Kennung darf nie zugleich in
   FACHBEGRIFF_AUFTRAG stehen — sagt er später doch ja, fliegt sie HIER raus,
   mit seinem neuen Satz dort. werkzeuge/pruefe-fachbegriff-auftrag.mjs prüft das.
   24.09.2026, 05:00: auf die Liste der ruhenden vom Vorabend zitierte er die
   neun „Bis heute nur im Hörmodus“ (Verbalsatz, Sonnenbuchstaben, Hamzat
   al-waṣl, Voranstellung, Hinweiswort, Partikel, Verb, Dehnung, Iʿrāb):
   „sollen aus hörmodus raus“. Drei davon standen schon hier. */
const FACHBEGRIFF_ABBESTELLT = {
  'gram-mutabaqa':        '23.09.2026 — „das ist keine vokabel die ich lernen möchte“',
  'gram-jumla-filiya':    '22.09.2026 — „mach diese drei weg und kümmere dich erstmal darum das das auch nicht wieder passiert“ · 24.09.2026 — „sollen aus hörmodus raus“',
  'gram-huruf-schamsiya': '22.09.2026 — „mach diese drei weg und kümmere dich erstmal darum das das auch nicht wieder passiert“ · 24.09.2026 — „sollen aus hörmodus raus“',
  'gram-hamzat-wasl':     '22.09.2026 — „mach diese drei weg und kümmere dich erstmal darum das das auch nicht wieder passiert“ · 24.09.2026 — „sollen aus hörmodus raus“',
  'gram-taqdim':          '24.09.2026 — „sollen aus hörmodus raus“',
  'gram-ismul-isara':     '24.09.2026 — „sollen aus hörmodus raus“',
  'gram-harf':            '24.09.2026 — „sollen aus hörmodus raus“',
  'gram-fil':             '24.09.2026 — „sollen aus hörmodus raus“',
  'gram-madd':            '24.09.2026 — „sollen aus hörmodus raus“',
  'gram-irab':            '24.09.2026 — „sollen aus hörmodus raus“',
};

const FACHBEGRIFF_VOKABELN = [
  {
    id: 'gram-mudaf',
    /* ⭐⭐ 22.09.2026 — DIESER FACHBEGRIFF STEHT SCHON IM BUCH.
       Elias mit dem Bild der Suche, auf der مُضَافٌ zweimal stand: „es gibt
       zwei mudaf, ich möchte eigentlich nur eins haben. lass das in kapitel 24,
       mache es aber exakt so wie das meine eigene. also gleiche kiste, gleiche
       beschreibung und nennung und alles … nimm die höhere box."
       50473 ist die Buchvokabel (madina-1, Kapitel 24, „(gr) Besitzobjekt
       (Mudaf)"). Mit diesem Feld hängt js/kern.js den Fachbegriff nicht mehr
       ein, sondern schreibt seine Beschreibung auf die Buchkarte, schaltet sie
       einzeln frei und zieht den Fortschritt nach.
       ⚠️ WER DIESE DATEI MIT fachbegriffe-setzen.mjs NEU ERZEUGT, muss das Feld
       im Auftrag mitgeben — sonst ist es weg und das Wort steht wieder doppelt.
       werkzeuge/pruefe-buchtausch.mjs wird dann rot. */
    buchTausch: '50473',
    ar: 'مُضَافٌ',
    de: 'der Besitz — das erste Wort der Genitivverbindung',
    type: 'noun',
    chapter: 'personal',
    book: 'grammar',
    regel: 'mudaf-01',
    belegt: 23,
    mnemo: 'Das ERSTE Wort einer إِضَافَة: بَيْتُ اللهِ — das Haus Allahs, die Kaaba. بَيْتٌ hast du als Vokabel; hier steht es als مُضَاف. Du erkennst ihn an dem, was FEHLT: kein اَلْ und kein Tanwīn. Also nicht اَلْبَيْتُ und nicht بَيْتٌ, sondern nacktes بَيْتُ — es braucht keine eigene Bestimmung, das Wort dahinter bestimmt es schon.'
  },
  {
    id: 'gram-majrur',
    ar: 'مَجْرُورٌ',
    de: 'Genitiv (Frage: wessen?)',
    type: 'noun',
    chapter: 'personal',
    book: 'grammar',
    regel: 'irab-drei-faelle-01',
    belegt: 18,
    mnemo: 'مَجْرُور und حَرْفُ الْجَرِّ sind dasselbe Wort — الْجَرّ. Die Partikel zieht das Nomen dahinter in den Genitiv: aus اَلْبَيْتُ wird فِي الْبَيْتِ. Am Ende steht dann Kasra ـِ statt Damma ـُ. Merksatz deines Lehrers: der ḥarf al-jarr macht sein Nomen zu majrūr. فِي kennst du als Vokabel — das ist die Partikel, die es tut.'
  },
  {
    id: 'gram-marfu',
    ar: 'مَرْفُوعٌ',
    de: 'Nominativ — der Grundfall',
    type: 'noun',
    chapter: 'personal',
    book: 'grammar',
    regel: 'marfu-grundfall-01',
    belegt: 8,
    mnemo: 'Der Ruhezustand, kein Sonderfall: solange nichts dazukommt, steht jedes Nomen mit Damma am Ende — اَلْبَيْتُ. Erst ein حَرْف جَرّ oder eine إِضَافَة macht daraus مَجْرُور. Wenn du also ein Wort ohne besonderen Grund siehst, ist es مَرْفُوع.'
  },
  {
    id: 'gram-nat',
    ar: 'نَعْتٌ',
    de: 'Adjektiv — das beschreibende Wort',
    type: 'noun',
    chapter: 'personal',
    book: 'grammar',
    regel: 'nat-vier-bedingungen-01',
    belegt: 5,
    mnemo: 'نَعْت kommt von „beschreiben“ — und das Wort tut selbst, was es heißt: es steht hinter dem Nomen und macht ihm alles nach. Vier Bedingungen: Geschlecht, Bestimmtheit, Fall und Zahl. Das beschriebene Wort heißt مَنْعُوت, also „das Beschriebene“ — dieselbe Wurzel ن ع ت, einmal aktiv, einmal passiv. Wer den einen Namen hat, hat den anderen.'
  },
  {
    id: 'gram-idafa',
    /* ⭐⭐ 24.09.2026 — EINE KARTE, NICHT ZWEI. Elias hat die Genitivverbindung
       zurückbestellt („die sollen wieder da sein und bleiben" · „als
       karteikarten"). Sie steht aber schon als Buchkarte in Madina 1, Kapitel
       24 (50474 „(gr) Genitivverbindung"), bei ihm einzeln freigeschaltet. Die
       Warteseite (Version 8), auf der er wählen sollte, hat für genau diesen
       Fall zugesagt: „Wo „schon als Karte" steht, bekommst du keine zweite:
       dann schalte ich die Buchkarte frei". Und seine Regel für denselben Fall
       bei مُضَافٌ (22.09.2026): „es gibt zwei mudaf, ich möchte eigentlich nur
       eins haben. lass das in kapitel 24 … nimm die höhere box."
       v587 hatte beide Karten nebeneinander (gemessen: Box 3 hier, Box 1 dort)
       — mit diesem Feld bleibt die Kapitel-24-Karte, bekommt diese
       Beschreibung und die höhere Box. werkzeuge/pruefe-buchtausch.mjs prüft
       es beim Laden. */
    buchTausch: '50474',
    ar: 'إِضَافَةٌ',
    de: 'Genitivverbindung — zwei Nomen werden ein Ausdruck',
    type: 'noun',
    chapter: 'personal',
    book: 'grammar',
    regel: 'idafa-01',
    /* ⭐ 06.09.2026: 9 → 14. Nicht weil neue Regeln dazukamen, sondern weil
       die Schreibung vereinheitlicht wurde — vorher stand إِضافة (ohne
       Zeichen auf ض ا ف) daneben, jetzt zählen alle Stellen mit.
       Beleg für die volle Form: die Musterlösung des Lehrers, ml-01. */
    belegt: 14,
    mnemo: 'بابُ الْمَسْجِدِ — die Tür der Moschee. بَابٌ und مَسْجِدٌ hast du einzeln gelernt, die إِضَافَة setzt sie zu einem Begriff zusammen. Erstes Wort: مُضَاف. Zweites Wort: مُضَاف إِلَيْهِ, und das steht im Genitiv. Damit kannst du zusammengesetzte Wörter bauen, die es im Arabischen sonst nicht gäbe — Schreibtisch, Wörterbuch, Feuertreppe.'
  },
  {
    id: 'gram-zarf',
    ar: 'ظَرْفٌ',
    de: 'Zeit- oder Ortsangabe',
    type: 'noun',
    chapter: 'personal',
    book: 'grammar',
    regel: 'zarf-01',
    belegt: 3,
    mnemo: 'Die DRITTE Sache, die den Fall steuert — neben حَرْف جَرّ und إِضَافَة. تَحْتَ الْمَكْتَبِ: تَحْتَ hast du als Vokabel, und das Wort dahinter wird مَجْرُور, genau wie hinter einem مُضَاف. Dein Lehrer stellt ausdrücklich klar: تَحْتَ selbst ist KEIN حَرْف جَرّ — es wirkt nur so.',
    /* ⛔ Der EINZIGE Fachbegriff, der einen Satz bekommt -- und zwar mit Grund.
       Von den zehn Begriffen ohne Beispielsatz haben neun eine Regel mit 3 bis 13
       Markierungen, ihr Konzept ist also erreichbar. `zarf-01` stand bei EINER.
       Ein zweiter Beleg in einem vorhandenen Satz ging nicht: alle acht Saetze mit
       einem Ortsadverb haben ihres bereits belegt. */
    sentAr: 'الْمِفْتَاحُ تَحْتَ الْبَابِ.',
    sentDe: 'Der Schlüssel ist unter der Tür.',
  },
  {
    id: 'gram-schakl',
    ar: 'شَكْلٌ',
    de: 'Vokalzeichen (ein einzelnes)',
    type: 'noun',
    chapter: 'personal',
    book: 'grammar',
    regel: 'schakl-01',
    belegt: 3,
    mnemo: 'Die kleinen Zeichen über und unter den Buchstaben. Fünf Stück: فَتْحة, كَسْرة, سُكون, ضَمّة, شَدّة. Alle zusammen heißen تَشْكيل — EINES davon ist ein شَكْل. Dieselbe Sache in Einzahl und Gesamtheit, wie Buchstabe und Alphabet.'
  },
  {
    id: 'gram-ismul-isara',
    ar: 'اِسْمُ الْإِشَارَة',
    de: 'Hinweiswort (dieser, jener)',
    type: 'noun',
    chapter: 'personal',
    book: 'grammar',
    regel: 'ismul-isara-hadha-01',
    /* ⭐ 06.09.2026: die Zahl bleibt 2, ihre Bedeutung nicht. Vorher waren es
       zwei Stellen OHNE Kasra unter dem Hamzat al-waṣl, jetzt zwei MIT — die
       Schreibung folgt seit heute der Musterlösung des Lehrers (ml-04). */
    belegt: 2,
    /* ⚠️ Steht nur noch als historischer Beleg da: dies WAR die seltenere
       Variante in der Quelle (1×), und sie hatte recht. Der Unterschied zur
       Hauptform ist jetzt nur noch die Endung und das Lām-Alif. */
    varianteInQuelle: 'اِسْمُ الإِشارَةِ',
    mnemo: 'Wörtlich „der Name des Zeigens" — اِسْم ist das Wort für „Nomen", das du aus den drei Wortarten kennst (اِسْم – فِعْل – حَرْف). Vier davon hattest du im Unterricht: هَذَا und هَذِهِ für Nahes, ذَلِكَ und تِلْكَ für Fernes. هَذَا بَيْتٌ — dies ist ein Haus.'
  },
  {
    id: 'gram-ta-marbuta',
    ar: 'تَاء مَرْبُوطَة',
    de: 'die weibliche Endung ة',
    type: 'noun',
    chapter: 'personal',
    book: 'grammar',
    regel: 'ta-marbuta-fem-01',
    belegt: 4,
    mnemo: 'Wörtlich das „gebundene Tāʾ" — geschrieben wie ein Kreis mit zwei Punkten. Steht es am Wortende, ist das Wort weiblich: مَدْرَسَةٌ und سَيَّارَةٌ hast du beide als Vokabel, beide sind weiblich. Aber Vorsicht in beide Richtungen: nicht jedes weibliche Wort trägt eins, und nicht jedes Wort lässt sich damit weiblich machen.'
  },
  {
    id: 'gram-alif-maqsura',
    ar: 'أَلِف مَقْصُورَة',
    de: 'das ى am Wortende (gesprochen wie langes ā)',
    type: 'noun',
    chapter: 'personal',
    book: 'grammar',
    regel: 'alif-maqsura-01',
    belegt: 3,
    mnemo: 'Ein ى am Wortende OHNE Punkte ist kein Ya, sondern ein „kleines Alif" — gesprochen wie langes ā. عَلى hast du als Vokabel: „auf". عَلِيٌّ dagegen ist der Name Ali und endet wirklich auf ein Ya. Ohne Taschkīl sehen die beiden fast gleich aus — der Unterschied sind nur die zwei Punkte.'
  },

  /* ------------------------------------------------------------------------
     DIE FUENF BESITZENDUNGEN (19.08.2026)

     Elias: „ich muss unbedingt kapitel 10 wiederholen mit den suffixen die ich
     gelernt habe … die sufixe die ich da gelernt haben soll die sollten auch
     als karteikarte sein und ich soll die auch lernen bei dem lern modus bei
     karteikarten."

     ⭐ WARUM SIE HIER STEHEN UND NICHT IN EINER EIGENEN DATEI
     Eine sechste Datendatei muesste in index.html, sw.js, kern.js,
     pruefe-eselsbruecken.js, pruefe-oberflaeche.js und pruefe-plural-thema.mjs
     einzeln bekannt gemacht werden. Genau daran ist am selben Tag
     data/beispielsaetze.js gescheitert: drei Werkzeuge kannten sie nicht, und
     fuenf fertige Saetze erzeugten 0 statt 105 Uebungsaufgaben.
     [[dritte_satzquelle]] Hier greift dagegen alles sofort, weil
     `chapter: grammar` schon ueberall behandelt wird.

     ⭐ UND SIE BRINGEN DEN SATZMODUS GLEICH MIT
     `alleSaetze()` in js/saetze.js liest VOCAB_DATA.filter(w => w.sentAr).
     Ein `sentAr` an der Karte ist damit zugleich ein Satz im Satzmodus —
     genau das, was Elias mit „der satzmodus bietet sich sehr gut dafuer an"
     meinte. Deshalb traegt jede der fuenf Karten einen eigenen Satz.

     ⛔ HERKUNFT: Kein Zeichen ist hier vokalisiert worden.
     · Die fuenf Endungen stehen woertlich im Namen von possessiv-endungen-01.
     · Jedes Wort der fuenf Saetze ist aus einem Lehrbuchsatz herausgesucht —
       ueber sein Skelett, mit Gegenprobe auf genau eine Form:
         mb1-61-1 (S.61) · mb1-61-2 (S.61) · mb1-61-3 (S.61) · mb1-61-4 (S.61)
         mb1-58-1 (S.58, Kapitel 10) · mb1-63-1 (S.63) · mb1-65-1 (S.65)
     · Die Verse kommen aus quran-text.js: 94:1 · 99:2 · 109:6 · 111:2 — alle
       aus dem Bereich, den Elias auswendig kann. [[quranbezug_nur_auswendiges]]
     Gebaut mit werkzeuge/suffixkarten.mjs, das bei jeder Abweichung abbricht.
     ------------------------------------------------------------------------ */
  {
    id: 'gram-suffix-i',
    ar: 'ـِي',
    de: 'die Besitzendung „mein“ — 1. Person',
    type: 'particle',
    chapter: 'personal',
    book: 'grammar',
    regel: 'possessiv-ya-01',
    belegt: 2,
    sentAr: 'هَذَا كِتَابِي.',
    sentDe: 'Dies ist mein Buch.',
    mnemo: 'Dein Lehrer geht die fünf der Reihe nach durch und nennt zuerst diese: ـِي „meins“. Du hast sie längst gelesen, ohne sie zu benennen — auf Seite 61 steht بَيْتِي „mein Haus“, auf Seite 61 auch كِتَابِي „mein Buch“. Das Yāʾ am Ende ist das Ich.'
  },
  {
    id: 'gram-suffix-ka',
    ar: 'ـكَ',
    de: 'die Besitzendung „dein“ — zu einem Mann',
    type: 'particle',
    chapter: 'personal',
    book: 'grammar',
    regel: 'possessiv-endungen-01',
    belegt: 3,
    sentAr: 'أَيْنَ قَلَمُكَ يَا خَالِدُ؟',
    sentDe: 'Wo ist dein Stift, Khālid?',
    mnemo: 'Deinem Lehrer ist der Vokal das Merkzeichen: „Kev, mit Fetha“ — ـكَ mit Fatḥa spricht einen Mann an. ⭐ Und das Entscheidende steht daneben: das Tanwīn fällt weg. Aus einem Stift mit Tanwīn wird قَلَمُكَ „dein Stift“ — Seite 58, genau dein Kapitel 10.'
  },
  {
    id: 'gram-suffix-ki',
    ar: 'ـكِ',
    de: 'die Besitzendung „dein“ — zu einer Frau',
    type: 'particle',
    chapter: 'personal',
    book: 'grammar',
    regel: 'possessiv-endungen-01',
    belegt: 1,
    sentAr: 'مَا اسْمُكِ يَا آمِنَةُ؟',
    sentDe: 'Wie heißt du, Āmina?',
    mnemo: 'Derselbe Buchstabe wie bei ـكَ, nur der Vokal wechselt: Fatḥa fragt einen Mann, Kasra fragt eine Frau. Auf Seite 63 steht genau diese Frage an Āmina: اسْمُكِ „dein Name“. Ein einziges Zeichen entscheidet, wen du ansprichst.'
  },
  {
    id: 'gram-suffix-hu',
    ar: 'ـهُ',
    de: 'die Besitzendung „sein“',
    type: 'particle',
    chapter: 'personal',
    book: 'grammar',
    regel: 'possessiv-endungen-01',
    belegt: 2,
    sentAr: 'لِي أَخٌ اسْمُهُ حَامِدٌ.',
    sentDe: 'Ich habe einen Bruder, sein Name ist Ḥāmid.',
    mnemo: 'Auf Seite 61 stehen ـهُ und ـهَا in EINEM Satz nebeneinander: اسْمُهُ أُسَامَةُ für den Bruder, اسْمُهَا سُعَادُ für die Schwester. Wer diesen einen Satz liest, hat beide Endungen auf einmal.'
  },
  {
    id: 'gram-suffix-ha',
    ar: 'ـهَا',
    de: 'die Besitzendung „ihr“',
    type: 'particle',
    chapter: 'personal',
    book: 'grammar',
    regel: 'possessiv-endungen-01',
    belegt: 2,
    sentAr: 'لِي أُخْتٌ اسْمُهَا آمِنَةُ.',
    sentDe: 'Ich habe eine Schwester, ihr Name ist Āmina.',
    mnemo: 'Deinem Lehrer genügt dafür ein Wort: „Ha, mit Elif“. Genau daran erkennst du sie — dasselbe Hāʾ wie beim „sein“, aber ein Alif dahinter macht es weiblich: اسْمُهُ gegen اسْمُهَا (Seite 61).'
  },

  /* ---------------------------------------------------------------------
     DIE VIERZEHN PRONOMEN DER VERGANGENHEIT — Folge 18, Einschub 10:14–24:22

     Elias am 24.08.2026: „wir haben beim letzten video die konjuktionen der
     vergangenheit besprochen … ich brauche alle konjuktionen aus dem video
     die da genannt werden als karteikarten bzw als eigene vokabeln."
     Und danach: „wichtig ist aber auch das es hier um die vergangenheit geht."
     Deshalb traegt JEDE Karte ihre Maadii-Endung im `deNeben` — das Feld wird
     angezeigt UND ist suchbar.

     ⭐ Warum sie hier stehen muessen, gemessen am 24.08.2026 ueber alle 4473
     Woerter aller vier Wege, NFC-normalisiert: SECHS davon (هُوَ هِيَ هُمْ أَنَا
     نَحْنُ أَنْتَ) stehen in madina-1 Kapitel 24 — Elias ist bei Kapitel 12, sie
     sind also nicht freigeschaltet. Die anderen SECHS (هُمَا هُنَّ أَنْتِ أَنْتُمَا
     أَنْتُمْ أَنْتُنَّ) gibt es in keiner Quelle. Sein Lehrer hat damit Stoff
     vorgezogen, den das Buch erst zwoelf Kapitel spaeter bringt.
     ⚠️ Ein grep hatte هُمَا zuerst in madina-2 gefunden — das war ein
     Teiltreffer in einem laengeren Wort. [[namenssuche_trifft_die_welt]]

     ⛔ VIERZEHN FORMEN, ZWOELF WOERTER. هُمَا steht fuer den maennlichen und
     den weiblichen Dual, أَنْتُمَا ebenso. Zwei Karten mit identischer
     Vorderseite waeren beim Abfragen nicht unterscheidbar; die Karte fuer
     هُمَا traegt deshalb BEIDE Verbformen.

     ⛔ HERKUNFT: Nichts hier ist von mir konjugiert. Alle vierzehn Formen hat
     der Lehrer im Video vorgesagt. Die drei Saetze mit إِلَى الْمَسْجِدِ hat er
     woertlich gesprochen (هُوَ, هُمَا, هُمْ); die uebrigen neun setzen die
     belegte Form in denselben belegten Rahmen. مَسْجِدٌ (Kap. 1) und إِلَى
     (Kap. 4) sind beide freigeschaltet. Goal-Prompt E.1.

     ⭐ ESELSBRUECKEN: Fuenf haben einen Vers aus seinem auswendigen Bereich
     (gemessen mit einer NFC-Suche an Wortgrenzen ueber Sure 1, 67, 93–114):
     هُوَ 112:1 · هِيَ 97:5 · هُمْ 107:5 · أَنْتُمْ 109:3 · أَنَا 109:4.
     Die anderen sieben bekommen den Merkhaken des Lehrers statt eines Verses
     ausserhalb seines Bereichs. [[quranbezug_nur_auswendiges]]
     --------------------------------------------------------------------- */
  {
    id: "gram-pron-huwa",
    gender: "masculine",
    ar: "هُوَ",
    de: "er",
    deNeben: "Vergangenheit ohne Endung: ذَهَبَ (er ging)",
    type: 'particle',
    chapter: 'personal',
    book: 'grammar',
    regel: 'verb-madi-endungen-01',
    belegt: 14,
    sentAr: "هُوَ ذَهَبَ إِلَى الْمَسْجِدِ.",
    sentDe: "Er ging in die Moschee.",
    mnemo: "قُلْ هُوَ اللَّهُ أَحَدٌ — der erste Vers von سُورَةُ الْإِخْلَاصِ, den du auswendig kannst. Genau dieses هُوَ. In der Vergangenheit ist er der Einfache: er bekommt gar keine Endung, ذَهَبَ steht nackt da. Alle dreizehn anderen hängen etwas an — er nicht."
  },
  {
    id: "gram-pron-huma-m",
    ar: "هُمَا",
    de: "sie beide (zwei Personen)",
    deNeben: "Vergangenheit: ذَهَبَا (m) · ذَهَبَتَا (f)",
    type: 'particle',
    chapter: 'personal',
    book: 'grammar',
    regel: 'verb-madi-endungen-01',
    belegt: 2,
    sentAr: "هُمَا ذَهَبَا إِلَى الْمَسْجِدِ.",
    sentDe: "Sie beide gingen in die Moschee.",
    mnemo: "Das ist der Dual — im Deutschen gibt es ihn nicht, im Arabischen ist er eine eigene Zahl: genau zwei. Ein Wort für Männer und Frauen; welche gemeint sind, sagt erst das Verb. Männlich hängt dein Lehrer nur ein Alif an: ذَهَبَ → ذَهَبَا. Weiblich kommt das تْ der Einzahl davor: ذَهَبَتْ → ذَهَبَتَا. Und das Alif steckt schon im Pronomen — هُمَـا endet darauf, beide Verbformen auch."
  },
  {
    id: "gram-pron-hum",
    gender: "masculine",
    ar: "هُمْ",
    de: "sie (ab drei, männlich)",
    deNeben: "Vergangenheit auf ـُوا: ذَهَبُوا (sie gingen)",
    type: 'particle',
    chapter: 'personal',
    book: 'grammar',
    regel: 'verb-madi-endungen-01',
    belegt: 3,
    sentAr: "هُمْ ذَهَبُوا إِلَى الْمَسْجِدِ.",
    sentDe: "Sie gingen in die Moschee.",
    mnemo: "الَّذِينَ هُمْ — so fängt Vers 5 von سُورَةُ الْمَاعُونِ an, die du auswendig kannst. Dort steht هُمْ genau so allein, als eigenes Wort. Der Plural fängt im Arabischen erst bei drei an: zwei sind هُمَا. Die Endung ـُوا schreibt man mit einem Alif, das man nicht spricht — wie bei قَالُوا."
  },
  {
    id: "gram-pron-hiya",
    gender: "feminine",
    ar: "هِيَ",
    de: "sie (eine)",
    deNeben: "Vergangenheit auf ـَتْ: ذَهَبَتْ (sie ging)",
    type: 'particle',
    chapter: 'personal',
    book: 'grammar',
    regel: 'verb-madi-endungen-01',
    belegt: 10,
    sentAr: "هِيَ ذَهَبَتْ إِلَى الْمَسْجِدِ.",
    sentDe: "Sie ging in die Moschee.",
    mnemo: "سَلَامٌ هِيَ — so beginnt der letzte Vers von سُورَةُ الْقَدْرِ (97:5), die du auswendig kannst. Die weibliche Endung ist dasselbe تْ, das du von der تَاء مَرْبُوطَة kennst — nur hier als offenes تَاء مَفْتُوحَة geschrieben, weil noch etwas folgen kann. Dein Lehrer sagt dazu ausdrücklich: „ein offenes Ta.“"
  },
  {
    id: "gram-pron-hunna",
    gender: "feminine",
    ar: "هُنَّ",
    de: "sie (ab drei, weiblich)",
    deNeben: "Vergangenheit auf ـْنَ: ذَهَبْنَ (sie gingen)",
    type: 'particle',
    chapter: 'personal',
    book: 'grammar',
    regel: 'verb-madi-endungen-01',
    belegt: 1,
    sentAr: "هُنَّ ذَهَبْنَ إِلَى الْمَسْجِدِ.",
    sentDe: "Sie (die Frauen) gingen in die Moschee.",
    mnemo: "Das weibliche Gegenstück zu هُمْ, das du aus سُورَةُ الْمَاعُونِ kennst: هُمْ endet auf م, هُنَّ auf ن. Genau dieses ن hängst du ans Verb — ذَهَبْنَ. Merk dir das ن als das weibliche Zeichen im Plural: هُنَّ ← ذَهَبْنَ."
  },
  {
    id: "gram-pron-anta",
    gender: "masculine",
    ar: "أَنْتَ",
    de: "du (männlich)",
    deNeben: "Vergangenheit auf ـْتَ: ذَهَبْتَ (du gingst)",
    type: 'particle',
    chapter: 'personal',
    book: 'grammar',
    regel: 'verb-madi-endungen-01',
    belegt: 5,
    sentAr: "أَنْتَ ذَهَبْتَ إِلَى الْمَسْجِدِ.",
    sentDe: "Du gingst in die Moschee.",
    mnemo: "Hier fängt der Trick deines Lehrers an: bei der zweiten Person steckt die Endung schon im Pronomen. أَنْ|تَ — was hinter dem أَنْ steht, hängst du ans Verb: ذَهَبْ|تَ. Das gilt für alle fünf Anredeformen, und deshalb ist die zweite Person die einfachste von allen."
  },
  {
    id: "gram-pron-antuma",
    ar: "أَنْتُمَا",
    de: "ihr beide (zwei Personen)",
    deNeben: "Vergangenheit auf ـْتُمَا: ذَهَبْتُمَا — für Männer und Frauen gleich",
    type: 'particle',
    chapter: 'personal',
    book: 'grammar',
    regel: 'verb-madi-endungen-01',
    belegt: 3,
    sentAr: "أَنْتُمَا ذَهَبْتُمَا إِلَى الْمَسْجِدِ.",
    sentDe: "Ihr beide gingt in die Moschee.",
    mnemo: "Der Trick der zweiten Person trägt auch hier: أَنْ|تُمَا wird zu ذَهَبْ|تُمَا. Und dieses eine Wort spart dir eine ganze Form — im Dual der Anrede gibt es keinen Unterschied zwischen Männern und Frauen. Dein Lehrer sagt es ausdrücklich: „Die Dualform bei der zweiten Person ist identisch. Bei der dritten Person nicht.“ Vierzehn Pronomen, aber nur dreizehn verschiedene Verbformen."
  },
  {
    id: "gram-pron-antum",
    gender: "masculine",
    ar: "أَنْتُمْ",
    de: "ihr (ab drei, männlich)",
    deNeben: "Vergangenheit auf ـْتُمْ: ذَهَبْتُمْ (ihr gingt)",
    type: 'particle',
    chapter: 'personal',
    book: 'grammar',
    regel: 'verb-madi-endungen-01',
    belegt: 2,
    sentAr: "أَنْتُمْ ذَهَبْتُمْ إِلَى الْمَسْجِدِ.",
    sentDe: "Ihr gingt in die Moschee.",
    mnemo: "وَلَا أَنْتُمْ عَابِدُونَ — aus سُورَةُ الْكَافِرُونَ, die du auswendig kannst; dort steht es sogar zweimal, in Vers 3 und Vers 5. Dasselbe م wie in هُمْ zeigt auch hier den männlichen Plural. Und der Trick greift: أَنْ|تُمْ ← ذَهَبْ|تُمْ."
  },
  {
    id: "gram-pron-anti",
    gender: "feminine",
    ar: "أَنْتِ",
    de: "du (weiblich)",
    deNeben: "Vergangenheit auf ـْتِ: ذَهَبْتِ (du gingst)",
    type: 'particle',
    chapter: 'personal',
    book: 'grammar',
    regel: 'verb-madi-endungen-01',
    belegt: 1,
    sentAr: "أَنْتِ ذَهَبْتِ إِلَى الْمَسْجِدِ.",
    sentDe: "Du (Frau) gingst in die Moschee.",
    mnemo: "Der Unterschied zu أَنْتَ ist ein einziges Zeichen: Fatḥa oben für den Mann, Kasra unten für die Frau. Beim Verb genauso — ذَهَبْتَ gegen ذَهَبْتِ. Die Kasra als weibliches Zeichen kennst du schon von der Besitzendung ـكِ (اسْمُكِ — dein Name, zu einer Frau gesagt)."
  },
  {
    id: "gram-pron-antunna",
    gender: "feminine",
    ar: "أَنْتُنَّ",
    de: "ihr (ab drei, weiblich)",
    deNeben: "Vergangenheit auf ـْتُنَّ: ذَهَبْتُنَّ (ihr gingt)",
    type: 'particle',
    chapter: 'personal',
    book: 'grammar',
    regel: 'verb-madi-endungen-01',
    belegt: 2,
    sentAr: "أَنْتُنَّ ذَهَبْتُنَّ إِلَى الْمَسْجِدِ.",
    sentDe: "Ihr (die Frauen) gingt in die Moschee.",
    mnemo: "Wieder das ن als weibliches Zeichen im Plural, genau wie bei هُنَّ — und wieder mit Schadda. Setz sie nebeneinander: هُنَّ ذَهَبْنَ für „sie“, أَنْتُنَّ ذَهَبْتُنَّ für „ihr“. Und der Trick der zweiten Person trägt auch hier: أَنْ|تُنَّ ← ذَهَبْ|تُنَّ."
  },
  {
    id: "gram-pron-ana",
    ar: "أَنَا",
    de: "ich",
    deNeben: "Vergangenheit auf ـْتُ: ذَهَبْتُ (ich ging)",
    type: 'particle',
    chapter: 'personal',
    book: 'grammar',
    regel: 'verb-madi-endungen-01',
    belegt: 3,
    sentAr: "أَنَا ذَهَبْتُ إِلَى الْمَسْجِدِ.",
    sentDe: "Ich ging in die Moschee.",
    mnemo: "وَلَا أَنَا عَابِدٌ — aus سُورَةُ الْكَافِرُونَ, Vers 4, die du auswendig kannst. Achtung, hier hilft der Trick der zweiten Person NICHT: أَنَا endet auf Alif, die Verbform aber auf ـْتُ. Merk dir stattdessen das Paar am Ende der Tabelle: ich ذَهَبْتُ, wir ذَهَبْنَا — die beiden gehören zusammen."
  },
  {
    id: "gram-pron-nahnu",
    ar: "نَحْنُ",
    de: "wir",
    deNeben: "Vergangenheit auf ـْنَا: ذَهَبْنَا (wir gingen)",
    type: 'particle',
    chapter: 'personal',
    book: 'grammar',
    regel: 'verb-madi-endungen-01',
    belegt: 2,
    sentAr: "نَحْنُ ذَهَبْنَا إِلَى الْمَسْجِدِ.",
    sentDe: "Wir gingen in die Moschee.",
    mnemo: "Das ن von نَحْنُ ist dasselbe ن, das ans Verb geht: نَحْنُ ← ذَهَبْنَا. Und daneben das Paar, das man leicht verwechselt: هُنَّ ذَهَبْنَ endet auf نَ ohne Alif, نَحْنُ ذَهَبْنَا mit Alif. Das Alif macht aus „die Frauen“ ein „wir“."
  },

  /* ==================================================================
     Wörter, die Elias freigegeben hat: خَيْرٌ und مَعَ am 26.08.2026
     („ja mach"), الَّذِي am 05.09.2026 („das bräuchte ich aber natürlich als
     karteikarte").

     ⛔ الَّتِي stand hier auch — und musste wieder raus.
     pruefe-duplikate.js fand es als Buchvokabel in madina-2 K21 (id 46401),
     und madina-2 K1-24 IST freigeschaltet. Die To-Do behauptete „Alle drei
     fehlen im Bestand"; das war gegen vocab-data.js gemessen, nicht gegen
     den vollen Abzug. Die vorhandene Karte hat stattdessen ihre Merkhaken
     bekommen (data/eselsbruecken.js). [[werkzeug_misst_kleineren_bestand]]

     ⚠️ مَعَ und الَّذِي stehen beide in madina-1 K24 — freigeschaltet sind
     dort nur K1-12, also kein Duplikat. Gemessen, nicht angenommen.

     ⛔ KEIN ERFUNDENER BEISPIELSATZ. Wo es keinen belegten Satz gibt,
     bleibt sentAr leer und der Koranvers trägt die Illustration —
     Goal-Prompt E.1 und die Regel aus /volles-programm: „Lieber KEIN
     Satz als ein gestellter."
     ================================================================== */
  {
    id: "gram-zarf-maa",
    ar: "مَعَ",
    de: "mit, bei",
    /* Wie تَحْتَ in vocab-data.js: ein ظَرْف wird in dieser App als
       particle geführt. Nicht geraten — dieselbe Wortart wie das
       Ortswort, das der Unterricht behandelt hat. */
    type: 'particle',
    chapter: 'personal',
    book: 'grammar',
    /* ⛔ ABSICHTLICH KEINE `regel`. zarf-01 nennt تَحْتَ, أَمامَ und
       خَلْفَ — مَعَ steht dort NICHT, der Unterricht hat es nicht
       behandelt. Eine Markierung wäre eine Regelaussage, die kein
       Lehrer gemacht hat.
       ⭐ Die App behandelt مَعَ trotzdem richtig: js/irab.js:113 führt
       es in ZURUF, die Funktionsanzeige stimmt also (A8). */
    belegt: 1,
    /* Aus dem Lehrbuch — dort steht مَعَ mit angehängtem Pronomen
       (مَعَكِ), was genau der Normalfall ist. */
    sentAr: "وَمَنْ هَذِهِ الْفَتَاةُ الَّتِي مَعَكِ؟ أَهِيَ أُخْتُكِ؟",
    sentDe: "Und wer ist dieses Mädchen, das bei dir ist? Ist sie deine Schwester?",
    quran: {
      surah: "Ash-Sharh",
      ayah: "94:6",
      ar: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
      de: "gewiß, mit der Erschwernis ist Erleichterung"
    },
    mnemo: "إِنَّ مَعَ الْعُسْرِ يُسْرًا — aus سُورَةُ الشَّرْح, die du auswendig kannst, und dort steht مَعَ zweimal hintereinander (Vers 5 und 6). Wie تَحْتَ ist es kein حَرْف جَرّ, wirkt aber genauso: das Wort dahinter wird مَجْرُور — الْعُسْرِ mit Kasra."
  },
  {
    /* ⭐⭐ عَنْ — von Elias freigegeben am 06.09.2026: „عَنْ soll rein, mach
       das volle Programm".

       ⛔ WARUM ES FEHLTE, und warum das auffiel: Sein Lehrer listet in der
       Musterlösung zur Grammatikabfrage (01.09.2026, Seite ml-05) ACHT
       حُرُوف الْجَرّ und fragt unter 4a nach „allen, die du bisher gelernt
       hast, mit Bedeutung". Sieben hatte die App: مِنْ · إِلَى · عَلَى ·
       فِي · بِ · لِ · كَ. عَنْ stand in KEINER Regel, KEINER Vokabel und
       KEINEM Satz — dreifach gemessen: Tokenvergleich über Regeln, Vokabeln,
       Fachbegriffe, Beispiel- und Lehrbuchsätze (0), `grep` über alle fünf
       Datendateien (5 × 0), und die Gegenprobe an einem Wort, das drin ist.

       ⚠️ Es steht bewusst NICHT in vocab-data.js: ein Eintrag dort zöge das
       Wort über LERNBESTAND_IDS in „kennt er schon" und verschöbe seinen
       Lernstand. Derselbe Weg wie bei مَعَ. */
    id: "gram-harf-an",
    ar: "عَنْ",
    /* Wortlaut des Lehrers in der Musterlösung: „عَنْ — von/über". */
    de: "von, über",
    /* A1. Wie die übrigen حُرُوف الْجَرّ in dieser App — nicht geraten,
       dieselbe Wortart wie فِي und مِنْ aus dem Unterricht. */
    type: 'particle',
    /* ⛔ A2 entfällt: Partikeln haben keine Wurzel. Das ist kein leeres Feld,
       sondern die richtige Antwort. */
    chapter: 'personal',
    book: 'grammar',
    regel: 'harf-jarr-01',
    /* ⛔ belegt: 0 — und genau das ist der Befund. Die Zahl zählt, wie oft die
       Schreibung in Elias' EIGENEN Regeln vorkommt. Hier ist die Quelle keine
       Regel, sondern sein Lehrer. Wer die 0 später „korrigiert", löscht den
       Grund, aus dem dieser Eintrag existiert. */
    belegt: 0,
    quelleLehrer: 'Musterlösung Grammatikabfrage Madīna Buch 1, 01.09.2026, Aufgabe 4a',
    /* A9. Alle vier Wörter im Bestand gemessen: الْبَيْتُ · بَعِيدٌ ·
       الْمَسْجِدُ sind da, die Bauform ist der Nominalsatz, den er kennt.
       ⭐ عَنِ mit Kasra statt Sukūn, weil الْمَسْجِدِ mit Hamzat al-waṣl
       beginnt — belegt am Vers unten (عَنِ النَّعِيمِ), nicht selbst gesetzt. */
    sentAr: "الْبَيْتُ بَعِيدٌ عَنِ الْمَسْجِدِ.",
    sentDe: "Das Haus ist weit von der Moschee entfernt.",
    /* A11. Sure 102 steht mit Häkchen in data/auswendig.json — nicht nur über
       seine Ansage vom 17.08. Und der Vers zeigt genau die Wirkung:
       عَنِ + النَّعِيمِ im Genitiv. */
    quran: {
      surah: "At-Takathur",
      ayah: "102:8",
      ar: "ثُمَّ لَتُسْأَلُنَّ يَوْمَئِذٍ عَنِ النَّعِيمِ",
      de: "Hierauf werdet ihr an jenem Tag ganz gewiß nach der Wonne gefragt werden"
    },
    mnemo: "⭐ Jeder Ḥadīth fängt mit diesem Wort an: عَنْ أَبِي هُرَيْرَةَ — „von Abū Huraira“ —, dann folgt قَالَ رَسُولُ اللهِ. In der Überliefererkette heißt عَنْ „überliefert von“, und das ist dieselbe Grundbedeutung wie „von, über“. Du hörst es in jedem Glied der Kette."
  },
  {
    id: "gram-khayr",
    ar: "خَيْرٌ",
    de: "besser; das Gute",
    /* ⭐ Der Beispielsatz baut die Bauform des Verses nach, den er auswendig
       kann (93:4, وَلَلْآخِرَةُ خَيْرٌ لَكَ مِنَ الْأُولَىٰ): X خَيْرٌ مِنْ Y.
       Der Vers selbst geht nicht — الْآخِرَة und الْأُولَىٰ stehen nicht in
       seinem Bestand, und A9 verlangt Wörter, die er hat. مَسْجِدٌ und بَيْتٌ
       stehen beide in Kapitel 1, مِنْ in Kapitel 4.
       ⚠️ مِنَ mit Fatḥa vor dem Artikel-Alif — dieselbe Stelle wie im Vers
       (مِنَ الْأُولَىٰ), nicht eine eigene Entscheidung. */
    sentAr: 'الْمَسْجِدُ خَيْرٌ مِنَ الْبَيْتِ.',
    sentDe: 'Die Moschee ist besser als das Haus.',
    /* Ein Wort mit Tanwīn ist ein اِسْم — das ist kein Ratschluss,
       sondern die Probe, die auch js/irab.js benutzt: ein Verb trägt
       nie Tanwīn, eine Partikel auch nicht.
       ⚠️ Dass es ein اِسْم تَفْضِيل (Elativ) ist, steht bewusst NICHT
       als Wortart da — die App kennt diese Kategorie nicht, und sie
       zu erfinden wäre eine Grammatikaussage ohne Unterrichtsbeleg. */
    type: 'noun',
    /* Belegt im arabicroots-Abzug: اِخْتِيَارٌ (Auswahl) und خِيرَة
       (beste Wahl) tragen beide root "خ ي ر". */
    root: "خ ي ر",
    chapter: 'personal',
    book: 'grammar',
    belegt: 1,
    /* ⛔ KEIN sentAr. In allen vier Satzquellen kommt خَيْر kein
       einziges Mal vor, und einen Satz zu bauen hieße, Vokalisation
       und Kasus selbst zu setzen. Der Vers unten trägt die
       Illustration; er ist belegt und steht in seinem Auswendigen. */
    quran: {
      surah: "Ad-Duhaa",
      ayah: "93:4",
      ar: "وَلَلْآخِرَةُ خَيْرٌ لَكَ مِنَ الْأُولَىٰ",
      de: "Und das Jenseits ist wahrlich besser für dich als das Diesseits"
    },
    mnemo: "وَلَلْآخِرَةُ خَيْرٌ — „und das Jenseits ist besser“ — لَكَ مِنَ الْأُولَىٰ, aus سُورَةُ الضُّحَى, die du auswendig kannst. Die Bauform ist immer dieselbe: خَيْرٌ … مِنْ … heißt „besser als“. Und die Wurzel خ ي ر kennst du schon aus اِخْتِيَارٌ (Auswahl) — wer wählt, sucht sich das Bessere aus."
  },
  {
    id: "gram-mawsul-alladhi",
    ar: "الَّذِي",
    de: "der, welcher (männliche Form)",
    deNeben: "weiblich: الَّتِي",
    /* Wie die Buchvokabel im Abzug (madina-1 K24, id 50166): particle.
       Nicht geraten, sondern von dort übernommen. */
    type: 'particle',
    /* ⭐ Das Geschlecht IST hier die Lektion: welches der beiden
       Relativpronomen hineingehört, entscheidet allein das Geschlecht des
       Wortes davor — nicht, ob es eine Person ist oder eine Sache. Der
       Genus-Chip auf der Karte zeigt genau das an. */
    gender: "masculine",
    chapter: 'personal',
    book: 'grammar',
    regel: 'ismun-mawsul-alladhi-01',
    belegt: 1,
    /* Aus dem Lehrbuch (lehrbuch-saetze.js) — nicht gebaut. */
    sentAr: "الْكِتَابُ الَّذِي عَلَى الْمَكْتَبِ لِلْمُدَرِّسِ.",
    sentDe: "Das Buch, das auf dem Schreibtisch ist, gehört dem Lehrer.",
    quran: {
      surah: "Al-Humazah",
      ayah: "104:2",
      ar: "الَّذِي جَمَعَ مَالًا وَعَدَّدَهُ",
      de: "der Besitz zusammenträgt und ihn zählt und immer wieder zählt"
    },
    /* ⭐⭐ Beide Formen stehen in DERSELBEN Sure, fünf Verse auseinander —
       104:2 الَّذِي und 104:7 الَّتِي. Ein Merkhaken, den man nicht bauen
       muss, weil er schon dasteht. Belegt mit werkzeuge/vers.mjs 104. */
    mnemo: "سُورَةُ الْهُمَزَة, die du auswendig kannst, hat BEIDE Formen — fünf Verse auseinander. Vers 2: الَّذِي جَمَعَ مَالًا (der Besitz zusammenträgt), Vers 7: نَارُ اللَّهِ … الَّتِي تَطَّلِعُ. ⭐ Warum einmal so und einmal so? نَار (Feuer) ist weiblich, der Stichler aus Vers 1 nicht. Das Geschlecht des Wortes DAVOR entscheidet — nicht, ob es um eine Person geht oder um eine Sache."
  },
  {
    /* Eingetragen am 2026-09-11 von fachbegriffe-setzen.mjs — Schreibung wörtlich aus Regel mubtada-khabar-01. */
    id: "gram-mubtada",
    ar: "مُبْتَدَأٌ",
    de: "Subjekt des Nominalsatzes — das, worum es geht",
    type: "noun",
    chapter: 'personal',
    book: 'grammar',
    regel: "mubtada-khabar-01",
    belegt: 8,
    mnemo: "Womit fängt der Satz an? Mit dem, worum es geht: in اَلْمُدَرِّسُ جَدِيدٌ (der Lehrer ist neu) ist اَلْمُدَرِّسُ der مُبْتَدَأ. Wie beim Erzählen: erst sagen, WORÜBER du sprichst — was du darüber sagst, ist dann der خَبَر."
  },
  {
    /* Eingetragen am 2026-09-11 von fachbegriffe-setzen.mjs — Schreibung wörtlich aus Regel mubtada-khabar-01. */
    id: "gram-khabar",
    ar: "خَبَرٌ",
    de: "Aussage des Nominalsatzes — das, was darüber gesagt wird",
    type: "noun",
    chapter: 'personal',
    book: 'grammar',
    regel: "mubtada-khabar-01",
    belegt: 9,
    mnemo: "Dein Lehrer nennt den خَبَر »die Benachrichtigung für den مُبْتَدَأ«: in اَلْمُدَرِّسُ جَدِيدٌ ist جَدِيدٌ die Nachricht über den Lehrer — er ist neu. Fragst du »und was ist mit ihm?«, ist die Antwort der خَبَر."
  },
  {
    /* Eingetragen am 2026-09-11 von fachbegriffe-setzen.mjs — Schreibung wörtlich aus Regel irab-drei-faelle-01. */
    id: "gram-mansub",
    ar: "مَنْصُوبٌ",
    /* ⚠️ BUCHTAUSCH, ABSICHTLICH: dasselbe Wort mit derselben Bedeutung steht
       im Buch (madina-1, Kapitel 24, id 50471, „(gr) im Akkusativ").
       tauscheDubletten() in js/kern.js ersetzt diese Karte beim Start durch die
       Buchvokabel und schaltet sie einzeln frei — genau Elias' Regel vom
       07.09.2026: „wenn so ein fall kommt dann kannst du meine durch die im buch
       ersetzen. dieses eine wort soll dann schon voher einzeln freigeschalten
       sein". Fachbegriffe gelten seit dem 20.08. als seine eigenen. Im
       Browser-Pane am 11.09.2026 gemessen: 50471 steht danach einzeln frei.
       Anders bei gram-harf darunter — dort wäre die BEDEUTUNG getauscht worden. */
    de: "Akkusativ (Frage: wen oder was?)",
    type: "noun",
    chapter: 'personal',
    book: 'grammar',
    regel: "irab-drei-faelle-01",
    belegt: 5,
    mnemo: "Die drei Fälle deines Lehrers am Endvokal: مَرْفُوع mit Damma, مَجْرُور mit Kasra, مَنْصُوب mit Fatha — so wie مُحَمَّدًا mit zwei Fatha. Fatha und Akkusativ fangen beide mit »A« an: wen oder was?"
  },
  {
    /* Eingetragen am 2026-09-11 von fachbegriffe-setzen.mjs — Schreibung wörtlich aus Regel wortarten-01. */
    id: "gram-harf",
    ar: "حَرْفٌ",
    /* ⚠️ Zuerst „Partikel — eine der drei Wortarten (auch: Buchstabe)". Das
       „Buchstabe" traf die Bedeutung der Buchvokabel حَرْفٌ (madina-1 K20, id
       45954), und dubletteImBuch() hielt beide für DASSELBE Wort. Es sind zwei:
       die Wortart hier, der Buchstabe im Buch — wie bei ظَرْف und ظَرْفٌ. */
    de: "Partikel — eine der drei Wortarten",
    type: "noun",
    chapter: 'personal',
    book: 'grammar',
    regel: "wortarten-01",
    belegt: 34,
    mnemo: "Dein Lehrer kennt nur drei Wortarten: اِسْم, فِعْل und حَرْف. حَرْف sind die kleinen Wörter wie فِي und عَلَى — und laut deinem Lehrer auch die Fragepartikel. Du kennst das Wort schon aus حَرْفُ الْجَرِّ."
  },
  {
    /* Eingetragen am 2026-09-11 von fachbegriffe-setzen.mjs — Schreibung wörtlich aus Regel wortarten-01. */
    id: "gram-fil",
    ar: "فِعْلٌ",
    de: "Verb — eine der drei Wortarten",
    type: "noun",
    chapter: 'personal',
    book: 'grammar',
    regel: "wortarten-01",
    belegt: 4,
    mnemo: "Die drei Wortarten deines Lehrers: اِسْم, فِعْل, حَرْف. فِعْل ist das Tun-Wort — ذَهَبَ und خَرَجَ aus deinen Regeln sind beide فِعْل. Was weder فِعْل noch حَرْف ist, ist automatisch اِسْم."
  },
  {
    /* Eingetragen am 2026-09-11 von fachbegriffe-setzen.mjs — Schreibung wörtlich aus Regel madd-tabii-01. */
    id: "gram-madd",
    ar: "مَدٌّ",
    de: "Dehnung — der lang gelesene Vokal",
    type: "noun",
    chapter: 'personal',
    book: 'grammar',
    regel: "madd-tabii-01",
    belegt: 2,
    mnemo: "Trifft ein Vokalzeichen auf »seinen« Buchstaben, wird der Laut lang: Fatha auf ا, Damma auf و, Kasra auf ي — »sein kleiner Bruder«, sagt dein Lehrer. Darum liest du لَذِيذٌ lang. Und مَدّ selbst trägt eine Shadda: das doppelte d zieht das Wort in die Länge."
  },
  {
    /* Eingetragen am 2026-09-11 von fachbegriffe-setzen.mjs — Schreibung wörtlich aus Regel mutabaqa-genus-01. */
    id: "gram-mutabaqa",
    ar: "مُطَابَقَةٌ",
    /* ⚠️ Buchtausch bestätigt: مُطَابَقَةٌ „Übereinstimmung" steht in madina-3,
       Kapitel 11 (id 47239) — gleiche Bedeutung. Ist dieses Buchwort beim Start
       geladen, ersetzt tauscheDubletten() die Karte und schaltet es einzeln frei
       (Regel vom 07.09.2026). Im Browser-Pane am 11.09. NICHT getauscht: dort
       war das Wort nicht geladen. */
    de: "Übereinstimmung — die Aussage passt sich im Geschlecht an",
    type: "noun",
    chapter: 'personal',
    book: 'grammar',
    regel: "mutabaqa-genus-01",
    belegt: 1,
    mnemo: "Das Beispiel deines Lehrers: das Fahrrad ist im Arabischen weiblich — also nicht جَدِيدٌ, sondern جَدِيدَةٌ, nicht قَدِيمٌ, sondern قَدِيمَةٌ. مُطَابَقَة heißt: die Aussage zieht mit — ist das Wort weiblich, bekommt sie ebenfalls die Tāʾ marbūṭa."
  },
  {
    /* Eingetragen am 2026-09-11 von fachbegriffe-setzen.mjs — Schreibung wörtlich aus Regel verb-madi-endungen-01. */
    id: "gram-madi",
    ar: "اَلْمَاضِي",
    de: "Vergangenheit (Verbform)",
    type: "noun",
    chapter: 'personal',
    book: 'grammar',
    regel: "verb-madi-endungen-01",
    belegt: 2,
    mnemo: "Dein Lehrer nennt es einen Baukasten: in اَلْمَاضِي bleibt der Stamm gleich, nur die Endung wechselt — vierzehn Pronomen, vierzehn Endungen. Bei أَنْتَ steckt die Endung sogar schon im Pronomen. اَلْمَاضِي ist das, was schon vorbei ist."
  },
  {
    /* Eingetragen am 2026-09-11 von fachbegriffe-setzen.mjs — Schreibung wörtlich aus Regel tanwin-eigennamen-01. */
    id: "gram-tanwin",
    ar: "التَّنْوِينُ",
    de: "Tanwīn — die doppelte Endung (-un, -in, -an)",
    type: "noun",
    chapter: 'personal',
    book: 'grammar',
    regel: "tanwin-eigennamen-01",
    belegt: 4,
    mnemo: "In مُحَمَّدٌ hörst du am Ende ein »n« (Muḥammadun), das nicht als Buchstabe dasteht — das ist التَّنْوِينُ, und im Wort »Tanwīn« steckt das n schon drin. Dein Lehrer: männliche Eigennamen tragen es, weibliche wie فَاطِمَةُ nicht."
  },
  {
    /* Eingetragen am 2026-09-11 von fachbegriffe-setzen.mjs — Schreibung wörtlich aus Regel hu-nach-kasra-01. */
    id: "gram-kasra",
    ar: "كَسْرَة",
    de: "Kasra — das Vokalzeichen i",
    type: "noun",
    chapter: 'personal',
    book: 'grammar',
    regel: "hu-nach-kasra-01",
    belegt: 4,
    mnemo: "Der kleine Strich unter dem Buchstaben, gesprochen »i«. Dein Lehrer: auf eine كَسْرَة folgt nur schwer eine Damma — deshalb heißt es فِيهِ und nicht fīhu. Nach فِي steht sie am Ende: فِي الْبَيْتِ."
  },
  {
    /* Eingetragen am 2026-09-11 von fachbegriffe-setzen.mjs — Schreibung wörtlich aus Regel taschkil-kontext-01. */
    id: "gram-taschkil",
    ar: "تَشْكِيل",
    de: "Taschkīl — die Vokalzeichen",
    type: "noun",
    chapter: 'personal',
    book: 'grammar',
    regel: "taschkil-kontext-01",
    belegt: 2,
    mnemo: "Ohne تَشْكِيل sehen رَجُلٌ (Mann) und رِجْلٌ (Bein) gleich aus — dein Lehrer: dann muss man auf den Kontext schauen. تَشْكِيل ist alles, was zu den nackten Buchstaben dazukommt: Fatha, Damma, Kasra, Sukūn, Schadda."
  },
  {
    /* Eingetragen am 2026-09-11 von fachbegriffe-setzen.mjs — Schreibung wörtlich aus Regel hamzatul-wasl-01. */
    id: "gram-hamzat-wasl",
    ar: "هَمْزَة وَصْل",
    de: "Hamzat al-waṣl — das Verbindungs-Alif",
    type: "noun",
    chapter: 'personal',
    book: 'grammar',
    regel: "hamzatul-wasl-01",
    belegt: 2,
    mnemo: "Das Alif, das verbindet: bleibst du davor stehen, liest du es; liest du weiter, springst du drüber — in وَالْقَلَمُ hörst du wa-l-qalamu, kein a vor dem l. Dein Lehrer: die Araber mögen das Stoppen nicht und verbinden lieber."
  },
  {
    /* Eingetragen am 2026-09-11 von fachbegriffe-setzen.mjs — Schreibung wörtlich aus Regel jumla-ismiya-filiya-01. */
    id: "gram-jumla-filiya",
    ar: "جُمْلَة فِعْلِيَّة",
    de: "Verbalsatz — der Satz beginnt mit einem Verb",
    type: "noun",
    chapter: 'personal',
    book: 'grammar',
    regel: "jumla-ismiya-filiya-01",
    belegt: 2,
    mnemo: "فِعْلِيَّة steckt in فِعْل, dem Verb: die جُمْلَة فِعْلِيَّة fängt mit dem Verb an — ذَهَبَ مُحَمَّدٌ. Dein Lehrer: im Madina Buch 1 kommen erst die Nominalsätze, die Verben später."
  },
  {
    /* Eingetragen am 2026-09-11 von fachbegriffe-setzen.mjs — Schreibung wörtlich aus Regel wortstellung-fokus-01. */
    id: "gram-taqdim",
    ar: "تَقْدِيمٌ",
    de: "Voranstellung — was am Satzanfang steht, wird betont",
    type: "noun",
    chapter: 'personal',
    book: 'grammar',
    regel: "wortstellung-fokus-01",
    belegt: 1,
    mnemo: "Dein Lehrer dreht den Satz um: مُحَمَّدٌ ذَهَبَ und ذَهَبَ مُحَمَّدٌ heißen beide »Mohammed ging« — aber womit der Satz beginnt, darauf liegt der Fokus. تَقْدِيم heißt: etwas nach vorne stellen."
  },
  {
    /* Eingetragen am 2026-09-11 von fachbegriffe-setzen.mjs — Schreibung wörtlich aus Regel irab-drei-faelle-01. */
    id: "gram-irab",
    ar: "إِعْرَاب",
    de: "Iʿrāb — die Fallendungen am Wortende",
    type: "noun",
    chapter: 'personal',
    book: 'grammar',
    regel: "irab-drei-faelle-01",
    belegt: 1,
    mnemo: "Die Endung zeigt den Fall: مُحَمَّدٌ ist مَرْفُوع, مُحَمَّدٍ ist مَجْرُور, مُحَمَّدًا ist مَنْصُوب — dasselbe Wort, drei Endungen. إِعْرَاب ist das Lesen dieser Endungen."
  },
  {
    /* Eingetragen am 2026-09-11 von fachbegriffe-setzen.mjs — Schreibung wörtlich aus Regel schams-qamar-01. */
    id: "gram-huruf-schamsiya",
    ar: "حُرُوف شَمْسِيَّة",
    de: "Sonnenbuchstaben — das l des Artikels wird verschluckt",
    type: "noun",
    chapter: 'personal',
    book: 'grammar',
    regel: "schams-qamar-01",
    belegt: 2,
    mnemo: "اَلشَّمْس, die Sonne, zeigt es selbst: das l des Artikels hörst du nicht, dafür steht eine Schadda auf dem ش — asch-schams. So geht es bei 14 von 28 Buchstaben, den حُرُوف شَمْسِيَّة."
  },
  {
    /* Eingetragen am 2026-09-16 von fachbegriffe-setzen.mjs — Schreibung wörtlich aus Regel f19-isara. */
    id: "gram-isara-hadhani",
    ar: "هَذَانِ",
    de: "diese beiden (m.)",
    type: "particle",
    chapter: 'personal',
    book: 'grammar',
    regel: "f19-isara",
    belegt: 1,
    /* ⭐ Die vier Hinweiswörter für ZWEI (16.09.2026). Elias schickte die Seite
       „Nah / Fern" seiner Musterlösung: „die brauche ich als neue karteikarten
       damit ich danach abgefragt werde". Sechs der zehn Wörter dort gibt es schon
       als Buchvokabel (Madina 1, Kapitel 24; تَانِكَ in Madina 3) — die schaltet
       er einzeln frei. Diese vier hatten gar keine Karte.
       ⛔ SÄTZE: nur Wörter, die genau so in seinem Material stehen (حَامِدٌ 2×,
       عَمَّارٌ 4×, مُحَمَّدٌ 25×; طَالِبَةٌ und مُدَرِّسَةٌ auf der Karte f19-tanith),
       und ein Nominalsatz mit وَ — beides kennt er. Kein Dual als Aussage: den
       „lernen wir noch". */
    sentAr: "هَذَانِ حَامِدٌ وَعَمَّارٌ.",
    sentDe: "Diese beiden sind Hamid und Ammar.",
    mnemo: "Nah, zu zweit, männlich. Aus هَذَا (dieser) wird هَذَانِ (diese beiden) — hinten kommt ein -āni dazu. In deiner Musterlösung steht es gleich unter هَذَا und هَذِهِ."
  },
  {
    /* Eingetragen am 2026-09-16 von fachbegriffe-setzen.mjs — Schreibung wörtlich aus Regel f19-isara. */
    id: "gram-isara-hatani",
    ar: "هَاتَانِ",
    de: "diese beiden (f.)",
    type: "particle",
    chapter: 'personal',
    book: 'grammar',
    regel: "f19-isara",
    belegt: 1,
    /* ⚠️ Nicht „آمِنَةُ وَفَاطِمَةُ": ein weiblicher Name trägt kein Tanwīn, und
       js/irab.js liest „Nomen ohne Tanwīn + Nomen" als Iḍāfa — das وَ davor
       übersah es bis zum 17.09.2026 (seitdem erkennt schliesstIdafaAus() „وَ vorn,
       Ḍamma hinten" als neues Glied, geeicht in pruefe-saetze.js; der Satz bleibt). طَالِبَةٌ und
       مُدَرِّسَةٌ stehen so auf seiner Karte „Weiblichkeit". */
    sentAr: "هَاتَانِ طَالِبَةٌ وَمُدَرِّسَةٌ.",
    sentDe: "Diese beiden sind eine Studentin und eine Lehrerin.",
    mnemo: "Nah, zu zweit, weiblich — das Gegenstück zu هَذَانِ. Dieselbe Endung -āni, aber vorne hā-tā: هَاتَانِ steht in deiner Musterlösung direkt unter هَذَانِ."
  },
  {
    /* Eingetragen am 2026-09-16 von fachbegriffe-setzen.mjs — Schreibung wörtlich aus Regel f19-isara. */
    id: "gram-isara-dhanika",
    ar: "ذَانِكَ",
    de: "jene beiden (m.)",
    type: "particle",
    chapter: 'personal',
    book: 'grammar',
    regel: "f19-isara",
    belegt: 1,
    sentAr: "ذَانِكَ مُحَمَّدٌ وَحَامِدٌ.",
    sentDe: "Jene beiden sind Muhammad und Hamid.",
    mnemo: "Fern, zu zweit, männlich. Es endet wie ذَلِكَ auf كَ — das كَ steht für die Entfernung. Davor das -āni für zwei: ذَانِكَ heißt jene beiden."
  },
  {
    /* Eingetragen am 2026-09-16 von fachbegriffe-setzen.mjs — Schreibung wörtlich aus Regel f19-isara. */
    id: "gram-isara-tanika",
    ar: "تَانِكَ",
    de: "jene beiden (f.)",
    type: "particle",
    chapter: 'personal',
    book: 'grammar',
    regel: "f19-isara",
    belegt: 1,
    sentAr: "تَانِكَ مُدَرِّسَةٌ وَطَالِبَةٌ.",
    sentDe: "Jene beiden sind eine Lehrerin und eine Studentin.",
    mnemo: "Fern, zu zweit, weiblich — das Gegenstück zu ذَانِكَ. Wie تِلْكَ endet es auf das كَ der Entfernung: تَانِكَ heißt jene beiden, weiblich."
  },
  {
    /* Eingetragen am 2026-09-16 von fachbegriffe-setzen.mjs — Schreibung wörtlich aus Regel f19-fragen. */
    id: "gram-frage-madha",
    ar: "مَاذَا",
    de: "was?",
    type: "particle",
    chapter: 'personal',
    book: 'grammar',
    regel: "f19-fragen",
    belegt: 2,
    /* ⭐ Fragewörter aus seiner Musterlösung (16.09.2026): „hab ich die auch schon
       als karteikarten die mich abfragen? das sind auch wichtige vokabeln".
       مَتَى und أَيٌّ gibt es in Madina 1, K24 — die schaltet js/kern.js frei
       (FREISCHALTEN_AUF_WUNSCH). Diese vier hatten keine aktive Karte.
       ⛔ SÄTZE nur aus seinem Material: dieser aus der Regel istifham-madha-01
       (Sharḥ Madīnah), die drei folgenden von der Karte f19-fragen. */
    sentAr: "مَاذَا عَلَى الْمَكْتَبِ؟ الْقَلَمُ عَلَى الْمَكْتَبِ.",
    sentDe: "Was ist auf dem Schreibtisch? Der Stift ist auf dem Schreibtisch.",
    mnemo: "Was? — مَاذَا. Dein Buch fragt so: مَاذَا فِي الْحَقِيبَةِ؟ Neben مَا ist es die zweite Form für was, die deine Musterlösung nennt."
  },
  {
    /* Eingetragen am 2026-09-16 von fachbegriffe-setzen.mjs — Schreibung wörtlich aus Regel f19-fragen. */
    id: "gram-frage-kam",
    ar: "كَمْ",
    de: "wie viele?",
    type: "particle",
    chapter: 'personal',
    book: 'grammar',
    regel: "f19-fragen",
    belegt: 2,
    sentAr: "كَمْ طَالِبًا فِي الْفَصْلِ؟",
    sentDe: "Wie viele Studenten sind im Klassenzimmer?",
    mnemo: "Wie viele? — كَمْ. Auf deiner Karte fragt es: كَمْ طَالِبًا فِي الْفَصْلِ؟ Wie viele Studenten sind im Klassenzimmer?"
  },
  {
    /* Eingetragen am 2026-09-16 von fachbegriffe-setzen.mjs — Schreibung wörtlich aus Regel f19-fragen. */
    id: "gram-frage-min-ayna",
    ar: "مِنْ أَيْنَ",
    de: "woher?",
    type: "particle",
    chapter: 'personal',
    book: 'grammar',
    regel: "f19-fragen",
    belegt: 2,
    sentAr: "مِنْ أَيْنَ أَنْتَ؟",
    sentDe: "Woher kommst du?",
    mnemo: "Woher? — مِنْ (von, aus) und أَيْنَ (wo): zusammen „von wo“. Dein Buch fragt: مِنْ أَيْنَ أَنْتَ؟ Woher bist du?"
  },
  {
    /* Eingetragen am 2026-09-16 von fachbegriffe-setzen.mjs — Schreibung wörtlich aus Regel f19-fragen. */
    id: "gram-frage-ila-ayna",
    ar: "إِلَى أَيْنَ",
    de: "wohin?",
    type: "particle",
    chapter: 'personal',
    book: 'grammar',
    regel: "f19-fragen",
    belegt: 3,
    sentAr: "إِلَى أَيْنَ ذَهَبَ مُحَمَّدٌ؟",
    sentDe: "Wohin ging Muḥammad?",
    mnemo: "Wohin? — إِلَى (zu, nach) und أَيْنَ (wo): zusammen „nach wo“. Auf deiner Karte: إِلَى أَيْنَ ذَهَبَ مُحَمَّدٌ؟ Wohin ging Muḥammad?"
  },
  {
    /* Eingetragen am 2026-09-16 von fachbegriffe-setzen.mjs — Schreibung wörtlich aus Regel f19-tanith. */
    id: "gram-fem-hamra",
    ar: "حَمْرَاءُ",
    de: "rot (weiblich)",
    type: "adjective",
    chapter: 'personal',
    book: 'grammar',
    regel: "f19-tanith",
    belegt: 1,
    /* ⭐ Weiblichkeit und zwei Präpositionen aus seiner Musterlösung (16.09.2026).
       Gefragt: „Soll ich für die Weiblichkeit Karten zu ـاء (wie حَمْرَاءُ) und
       ى (wie كُبْرَى) anlegen?" und „Die Präpositionen بِ und كَ werden auch noch
       nicht abgefragt. Soll ich dafür ebenfalls Karten anlegen?" — Elias:
       „ja beides als karteikarten machen".
       Bedeutungen: حَمْرَاءُ steht als weibliche Form von أَحْمَرُ „rot" im Buch
       (Madina 1, K22); كُبْرَى: Schreibung arabdict, Bedeutung Reverso („große",
       Grundform أكبر).
       ⛔ SÄTZE: der für بِ steht wörtlich im Lektionstext Kapitel 12 (Regel
       harf-jarr-bi-01, Folge 17). Die für حَمْرَاءُ und كَ sind VERFASST — nur
       aus Wörtern seines Bestands und als Nominalsatz, den er kennt.
       كُبْرَى bekommt KEINEN Satz: ohne Steigerungsform, die er noch nicht
       hatte, wäre jeder Satz damit unnatürlich — lieber ehrlich ohne.
       ⛔ ÜBERHOLT am 20.09.2026: Elias wollte einen („mach mir einen satz").
       Er steht jetzt bei der Karte selbst, mit der Begründung dort. */
    sentAr: "السَّيَّارَةُ حَمْرَاءُ.",
    sentDe: "Das Auto ist rot.",
    /* Die Karte IST die weibliche Form — deshalb steht sie auch hier. */
    femSg: "حَمْرَاءُ",
    mnemo: "Rot, weiblich: حَمْرَاءُ. Hier zeigt nicht ة das Weibliche, sondern die Endung -ā’ (Alif und Hamza). So steht es in deiner Musterlösung unter „Weitere Zeichen“."
  },
  {
    /* Eingetragen am 2026-09-16 von fachbegriffe-setzen.mjs — Schreibung wörtlich aus Regel f19-tanith. */
    id: "gram-fem-kubra",
    ar: "كُبْرَى",
    de: "groß, die größte (weiblich)",
    type: "adjective",
    chapter: 'personal',
    book: 'grammar',
    regel: "f19-tanith",
    belegt: 1,
    /* ⭐ SATZ AUF SEINEN WUNSCH (20.09.2026). Elias zur Karte ohne Satz: „woher
       kommt das und warum gibt es hier keinen beispielsatz" — und nach meiner
       Erklärung: „mach mir einen satz".
       VERFASST, aber keine Schreibung ist getippt: das Werkzeug hat die Wörter
       aus dem Bestand KOPIERT — „die Schwester" mit Artikel und „Ärztin" aus
       vocab-data.js, das Kartenwort aus dieser Karte, der Artikel davor ist
       derselbe wie bei „die Schwester". Das Kartenwort endet auf ى und ändert
       seine Endung nie, deshalb entsteht mit dem Artikel keine neue Ḥaraka.
       „Die große Schwester" ist im Arabischen wie im Deutschen die übliche
       Wendung für die ältere Schwester — so klingt der Satz natürlich, obwohl
       er die Steigerung noch nicht hatte. Ein Koranvers kam nicht in Frage:
       das Wort steht in keiner Sure, die er auswendig kann. */
    sentAr: "الْأُخْتُ الْكُبْرَى طَبِيبَةٌ.",
    sentDe: "Die große Schwester ist Ärztin.",
    /* Die Karte IST die weibliche Form — deshalb steht sie auch hier. */
    femSg: "كُبْرَى",
    mnemo: "Groß, die größte, weiblich: كُبْرَى. Das ى am Ende ist hier das Zeichen für weiblich, nicht ة. Deine Musterlösung nennt es als zweites weiteres Zeichen."
  },
  {
    /* Eingetragen am 2026-09-16 von fachbegriffe-setzen.mjs — Schreibung wörtlich aus Regel f19-jarr. */
    id: "gram-harf-bi",
    ar: "بِ",
    de: "mit, durch",
    type: "particle",
    chapter: 'personal',
    book: 'grammar',
    regel: "f19-jarr",
    belegt: 2,
    sentAr: "أَنَا بِخَيْرٍ وَالْحَمْدُ لِلَّهِ.",
    sentDe: "Mir geht es gut, und Lob sei Allah.",
    mnemo: "بِ klebt am nächsten Wort und heißt mit oder durch: أَنَا بِخَيْرٍ — wörtlich „ich bin mit Gutem“, also: mir geht es gut."
  },
  {
    /* Eingetragen am 2026-09-16 von fachbegriffe-setzen.mjs — Schreibung wörtlich aus Regel f19-jarr. */
    id: "gram-harf-ka",
    ar: "كَ",
    de: "wie",
    type: "particle",
    chapter: 'personal',
    book: 'grammar',
    regel: "f19-jarr",
    belegt: 4,
    sentAr: "الطَّالِبُ كَالْمُدَرِّسِ.",
    sentDe: "Der Student ist wie der Lehrer.",
    mnemo: "كَ klebt vorne am nächsten Wort und heißt wie. Nicht verwechseln mit dem كَ am Ende von ذَلِكَ — das steht für die Entfernung."
  },
  {
    /* ⭐ Aus „Arabya Bayna Yadayk 1A", Seite 33 (Einheit 2, Lektion 2), von Elias
       rot mit der Übersetzung seines Lehrers beschriftet. Elias am 16.09.2026,
       20:32:24: „die vokabeln die ich dort aufgeschrieben habe mit rot die brauche
       ich auch als karteikarten" und 20:34:11: „ich hab da auch scon die
       übersetzung hingeschrieben die mein lehrer gesagt hat".
       Die übrigen rot beschrifteten Wörter der Seite hat er schon, jeweils mit
       derselben Übersetzung: مِعْطَفٌ, نَظَّارَةٌ, صَلَّى, قَرَأَ, تَوَضَّأَ aus Bayna
       Yadayk 1 Kapitel 1–2 (von ihm freigeschaltet um 20:20:56) und غُرْفَةٌ aus
       Madina 1 Kapitel 4. أَوْلَادٌ stand nur als Mehrzahl auf seiner Karte وَلَدٌ
       „Junge" (Madina 1 Kapitel 1, id 45762) — die Bedeutung „Kinder" fehlte.
       ⛔ TASCHKĪL: das Buch druckt „أولاد" OHNE Zeichen (Seite 55 der PDF bei 300 dpi
       gerendert und angesehen). أَوْلَادٌ steht so im arabicroots-Abzug (45762, pl)
       und im Satz zu هَؤُلَاءِ (50164).
       ⛔ NICHT in vocab-data.js — derselbe Weg wie bei مَعَ und عَنْ.
       ⚠️ هَيَّا بِنَا von derselben Seite fehlt noch: das Buch druckt es ohne
       Zeichen, arabdict schreibt هَيَّا (mit Schadda), Reverso هَيَا (ohne) — bei
       Abweichung entscheidet ein Mensch; die Frage ist an Elias gestellt. */
    id: "gram-awlad",
    ar: "أَوْلَادٌ",
    de: "Kinder",
    deNeben: "Jungen (Mehrzahl von وَلَدٌ)",
    type: 'noun',
    root: "و ل د",
    chapter: 'personal',
    book: 'grammar',
    /* belegt: 0 — die Zahl zählt Vorkommen in seinen REGELN; die Quelle ist hier
       sein Buch und sein Lehrer (wie bei عَنْ). */
    belegt: 0,
    quelleLehrer: 'Arabya Bayna Yadayk 1A, S. 33 (Einheit 2, Lektion 2) — rot „Kinder", Übersetzung seines Lehrers',
    /* لِلتَّاجِرِ steht wörtlich im Lektionstext (mb1-42-1), أَوْلَادٌ im Abzug. Dieselbe
       Bauform wie لِي أَخٌ im Buch: Besitz mit لِ, das Nomen danach unbestimmt.
       Bewusst NICHT هَؤُلَاءِ أَوْلَادٌ — das ist schon der Satz von هَؤُلَاءِ. */
    sentAr: "لِلتَّاجِرِ أَوْلَادٌ.",
    sentDe: "Der Händler hat Kinder.",
    mnemo: "أَوْلَادٌ – Kinder, so hat es dein Lehrer übersetzt. Es ist die Mehrzahl von وَلَدٌ (Junge), das du aus Madina 1 kennst: einer ist وَلَدٌ, viele sind أَوْلَادٌ."
  },
  {
    /* ⭐ Das letzte rot beschriftete Wort der Seite 33 („Los gehts"), Elias 20:32:24:
       „die vokabeln die ich dort aufgeschrieben habe mit rot die brauche ich auch
       als karteikarten".
       ⛔ TASCHKĪL — drei Schritte, weil die Quellen zuerst uneins waren:
         · Bildergitter S. 33: „هيا بنا" OHNE Zeichen.
         · arabdict: هَيَّا (mit Schadda) · Reverso: هَيَا بِنَا (ohne Schadda).
         · Elias hörte nach: Folge 20 „AB1A Kapitel 1-2", 22:07–22:13 und
           22:37–22:41 — 20:51:27 „hayya hat ein schadda", 20:53:01 „aber es hat
           ein kasrah. also hayyi bina", 20:53:36 „ich habs von meinem lehrer so
           gehöhrt", 20:53:59 „du kannst auch wörterbuch gucken". Im Buch steht
           unter dem Schadda keine Kasra — sein Wort, 20:54:36: „kann man nicht
           erkennen weil es da keins gibt" —, beide Wörterbücher schreiben Fatha,
           und die Kasra gehört zu بِ in بِنَا.
         · Dialog S. 32 (PDF-Seite 54, bei 300 dpi gelesen; der Scan hat 130 ppi):
           „الأب : هَيّا بِنا إلى المَسْجِدِ ." und „سَعْدٌ وسَعيدٌ : هيّا بِنا ."
       Der Satz unten ist dieser Buchsatz; إِلَى und الْمَسْجِدِ in der voll
       vokalisierten Form aus seinem Bestand (im Buch teils ohne Zeichen).
       ⚠️ js/irab.js kennt هيا seither als unveränderlich — sonst hätte der
       Satzmodus هَيَّا als مُبْتَدَأ abgefragt. */
    id: "gram-hayya-bina",
    ar: "هَيَّا بِنَا",
    de: "Los geht's",
    deNeben: "Los, lass(t) uns gehen",
    type: 'expression',
    chapter: 'personal',
    book: 'grammar',
    belegt: 0,
    quelleLehrer: 'Arabya Bayna Yadayk 1A, S. 32 (Dialog 3) und S. 33 (rot „Los gehts"); Folge 20, 22:10 „Los geht\'s"',
    sentAr: "هَيَّا بِنَا إِلَى الْمَسْجِدِ.",
    sentDe: "Los, lasst uns zur Moschee gehen.",
    mnemo: "هَيَّا بِنَا – Los geht's! So ruft der Vater in deinem Buch, nachdem die Mutter den Adhan des Fajr gehört hat: هَيَّا بِنَا إِلَى الْمَسْجِدِ – los, zur Moschee."
  },
  {
    /* ⭐ „Begrüßen" — Elias hat es rot unter das erste Wort des Titels der
       ersten Einheit geschrieben: Arabya Bayna Yadayk 1A, Titelseite der
       Einheit 1 (PDF-Seite 23), gedruckt voll vokalisiert „التَّحِيَّةُ".
       Auftrag 25.09.2026 (siehe FACHBEGRIFF_AUFTRAG).
       ⛔ TASCHKĪL aus drei Quellen, alle gleich: der Druck (bei 300 dpi gelesen),
       der arabicroots-Abzug (Madina 3, Kapitel 6, id 47121 „Gruß") und arabdict
       (مص. حَيَّا). Die Grundform steht hier ohne Artikel, wie تَعَارُفٌ.
       ⛔ NICHT als Buchvokabel: Madina 3 ist bei ihm nicht gewählt, und aus
       einem nicht gewählten Buch lässt sich kein Wort einzeln freischalten.
       ⚠️ Kein `buchTausch` auf 47121 — solange Madina 3 nicht geladen ist,
       zeigte er ins Leere und die Karte wäre ganz weg. Wählt er Madina 3 bis
       Kapitel 6, meldet pruefe-duplikate.js die Dublette; dann tauschen.
       SATZ: in seinen Büchern steht das Wort nur als Titel und Kopfzeile, in
       keiner Wortliste seiner Kapitel — deshalb nach seiner Notfall-Regel
       (24.09.2026) aus seinen Wörtern gebildet, genau nach dem Muster seiner
       Karte عَيْنٌ: «هَذِهِ عَيْنٌ جَمِيلَةٌ.» (هَذِهِ mb1-34-1, جَمِيلَةٌ W:45805.femSg). */
    id: "gram-tahiyya",
    ar: "تَحِيَّةٌ",
    de: "Begrüßen",
    deNeben: "Gruß, Begrüßung",
    type: 'noun',
    root: "ح ي ي",
    chapter: 'personal',
    book: 'grammar',
    belegt: 0,
    quelleLehrer: 'Arabya Bayna Yadayk 1A, Titelseite der Einheit 1 (PDF-Seite 23) — rot „Begrüßen" unter التَّحِيَّةُ',
    sentAr: "هَذِهِ تَحِيَّةٌ جَمِيلَةٌ.",
    sentDe: "Das ist eine schöne Begrüßung.",
    mnemo: "تَحِيَّةٌ – Begrüßen. Du sagst das Wort in jedem Gebet: der Taschahhud beginnt mit „at-taḥiyyātu lillāh“ – at-taḥiyyāt ist die Mehrzahl von تَحِيَّةٌ, und gemeint ist: alle Grüße gehören Allah."
  },
  {
    /* ⭐ „Der Alltag" — Elias hat es rot unter den Titel der vierten Einheit
       geschrieben: Arabya Bayna Yadayk 1A, Titelseite der Einheit 4 (PDF-Seite
       103, vor S. 82), gedruckt „الحَيَاةُ اليَوْمِيَّةُ". Auftrag 25.09.2026.
       ⛔ TASCHKĪL: alles wie gedruckt (bei 400 dpi gelesen). Zwei Zeichen stehen
       nicht im Druck: die Fatha auf dem ي von حَيَاة (steht vor dem Alif, im
       Buch weggelassen) — belegt im arabicroots-Abzug (Bayna Yadayk 2, id 46554
       حَيَاةٌ) —, und das Sukūn des Artikels vor ح und ي (Mondbuchstaben),
       geschrieben wie in seinen Wörtern الْيَوْمُ und الْعَرَبِيَّةُ.
       type 'noun' wie die anderen zweiwortigen Nomen hier (جُمْلَة فِعْلِيَّة).
       ⛔ NICHT als Buchvokabel: حَيَاةٌ steht in Bayna Yadayk 2, يَوْمِيٌّ in
       Bayna Yadayk 3 — beide bei ihm nicht gewählt.
       SATZ: wie bei gram-tahiyya nach seiner Notfall-Regel, genau nach dem
       Muster seiner Karte اللُّغَةُ: «اللُّغَةُ الْعَرَبِيَّةُ جَمِيلَةٌ.» Der
       Zerleger liest ihn richtig: مُبْتَدَأ · نَعْت · خَبَر. */
    id: "gram-hayat-yawmiyya",
    ar: "الْحَيَاةُ الْيَوْمِيَّةُ",
    de: "Der Alltag",
    deNeben: "das tägliche Leben",
    type: 'noun',
    root: "ح ي ي",
    chapter: 'personal',
    book: 'grammar',
    belegt: 0,
    quelleLehrer: 'Arabya Bayna Yadayk 1A, Titelseite der Einheit 4 (PDF-Seite 103) — rot „Der Alltag"',
    sentAr: "الْحَيَاةُ الْيَوْمِيَّةُ جَمِيلَةٌ.",
    sentDe: "Der Alltag ist schön.",
    mnemo: "الْحَيَاةُ الْيَوْمِيَّةُ – Der Alltag. So heißt die vierte Einheit in deinem Buch, und genau das zeigen ihre Bilder: der Wecker, die Tasse Kaffee, das Gebet – und im ersten Dialog Aufstehen zum Fajr, Quran lesen und mit dem Bus zur Schule."
  }
];
