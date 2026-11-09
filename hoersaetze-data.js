/* hoersaetze-data.js -- kurze Alltagssaetze fuer den Hoermodus
   ===========================================================

   WOZU — Elias am 08.11.2026: „der Hörmodus soll jetzt auch kleinere einfache
   sätze machen die vorallem im alltag gebrauchbar sind". Auf meine Rueckfragen:
   „Nur bekannte Wörter" und „ich finde es sollte jedes zweiter mal sätze sein".

   ⛔ NUR WOERTER, DIE ER KENNT. Jeder Satz traegt in `w` die Kennungen ALLER
   Woerter, die in ihm stehen. js/hoeren.js nimmt einen Satz nur, wenn jede
   dieser Kennungen gerade im Hoervorrat liegt (hoerbareVokabeln(): gesehen,
   nicht Box 7, nicht ganz hinten). Damit gelten fuer Saetze dieselben Grenzen
   wie fuer Woerter, und neue Saetze werden von selbst frei, sobald er ihre
   Woerter gesehen hat. Ein Satz mit einem Wort, das nicht in `w` steht, waere
   ein Loch in dieser Grenze — werkzeuge/pruefe-hoersaetze.mjs prueft, dass
   jedes arabische Wort des Satzes zu einer Kennung in `w` gehoert.

   ⚠️ MEINE Lesart, nicht seine: angehaengte Besitzendungen (-ī „mein",
   -ka „dein") und die Fem.-Form eines Adjektivs (ḥārra zu ḥārr) zaehlen als
   Form des Wortes, nicht als eigenes Wort. Sie stehen in Madina 1, das er bis
   Kapitel 15 freigeschaltet hat.

   ⭐ Die Bedingung fuer verfasste Saetze ist seit dem 29.07.2026 die
   Korrektheit, nicht die Herkunft (Elias: „solange deine Sätze richtig sind
   und alle Regeln der arabischen Sprache folgen ist dem nichts auszusetzen").
   pruefe-saetze.js liest diese Datei als eigene Quelle mit.

   Verfasst am 08.11.2026 aus den 211 Woertern, die er an dem Tag gesehen hatte
   (sein Stand aus dem Geraeteabgleich, nur gelesen). Voll vokalisiert, NFC. */

const HOER_SAETZE = [
  /* Unterwegs: wo ist was? */
  { k: 'wo-toilette',      ar: 'أَيْنَ الْمِرْحَاضُ؟',            de: 'Wo ist die Toilette?',            w: ['45810', '45826'] },
  { k: 'wo-bad',           ar: 'أَيْنَ الْحَمَّامُ؟',             de: 'Wo ist das Badezimmer?',          w: ['45810', '45822'] },
  { k: 'wo-kueche',        ar: 'أَيْنَ الْمَطْبَخُ؟',             de: 'Wo ist die Küche?',               w: ['45810', '45823'] },
  { k: 'wo-arzt',          ar: 'أَيْنَ الطَّبِيبُ؟',              de: 'Wo ist der Arzt?',                w: ['45810', '45761'] },
  { k: 'wo-krankenhaus',   ar: 'أَيْنَ الْمُسْتَشْفَى؟',          de: 'Wo ist das Krankenhaus?',         w: ['45810', '45874'] },
  { k: 'wo-markt',         ar: 'أَيْنَ السُّوقُ؟',                de: 'Wo ist der Markt?',               w: ['45810', '45818'] },
  { k: 'wo-bus',           ar: 'أَيْنَ الْحَافِلَةُ؟',            de: 'Wo ist der Bus?',                 w: ['45810', '46030'] },
  { k: 'wo-schluessel',    ar: 'أَيْنَ الْمِفْتَاحُ؟',            de: 'Wo ist der Schlüssel?',           w: ['45810', '45756'] },
  { k: 'wo-du-jetzt',      ar: 'أَيْنَ أَنْتَ الْآنَ؟',           de: 'Wo bist du jetzt?',               w: ['45810', '50156', '45891'] },
  { k: 'welches-zimmer',   ar: 'فِي أَيِّ غُرْفَةٍ أَنْتَ؟',      de: 'In welchem Zimmer bist du?',      w: ['45812', '50170', '45821', '50156'] },
  { k: 'krankenhaus-nah',  ar: 'هَلِ الْمُسْتَشْفَى قَرِيبٌ؟',    de: 'Ist das Krankenhaus nah?',        w: ['50167', '45874', '45793'] },
  { k: 'schule-nah',       ar: 'الْمَدْرَسَةُ قَرِيبَةٌ.',        de: 'Die Schule ist nah.',             w: ['45817', '45793'] },
  { k: 'uni-weit',         ar: 'الْجَامِعَةُ بَعِيدَةٌ.',         de: 'Die Universität ist weit weg.',   w: ['45819', '45794'] },
  { k: 'bibliothek-dort',  ar: 'الْمَكْتَبَةُ هُنَاكَ.',          de: 'Die Bibliothek ist dort.',        w: ['45890', '45836'] },
  { k: 'bus-hier',         ar: 'الْحَافِلَةُ هُنَا.',             de: 'Der Bus ist hier.',               w: ['46030', '45834'] },
  { k: 'auto-strasse',     ar: 'السَّيَّارَةُ فِي الشَّارِعِ.',   de: 'Das Auto steht auf der Straße.',  w: ['45832', '45812', '45831'] },
  { k: 'ich-hier',         ar: 'أَنَا هُنَا.',                    de: 'Ich bin hier.',                   w: ['50154', '45834'] },
  { k: 'ich-zuhause-jetzt',ar: 'أَنَا فِي الْبَيْتِ الْآنَ.',     de: 'Ich bin jetzt zu Hause.',         w: ['50154', '45812', '45751', '45891'] },
  { k: 'wir-markt',        ar: 'نَحْنُ فِي السُّوقِ.',            de: 'Wir sind auf dem Markt.',         w: ['50155', '45812', '45818'] },
  { k: 'wann-zuhause',     ar: 'مَتَى أَنْتَ فِي الْبَيْتِ؟',     de: 'Wann bist du zu Hause?',          w: ['50169', '50156', '45812', '45751'] },

  /* Sich vorstellen, Familie */
  { k: 'wie-heisst-du',    ar: 'مَا اسْمُكَ؟',                    de: 'Wie heißt du?',                   w: ['45777', '45839'] },
  { k: 'woher-du',         ar: 'مِنْ أَيْنَ أَنْتَ؟',             de: 'Woher kommst du?',                w: ['45808', '45810', '50156'] },
  { k: 'ich-deutschland',  ar: 'أَنَا مِنْ أَلْمَانِيَا.',        de: 'Ich komme aus Deutschland.',      w: ['50154', '45808', '45870'] },
  { k: 'er-deutschland',   ar: 'هُوَ مِنْ أَلْمَانِيَا.',         de: 'Er kommt aus Deutschland.',       w: ['50157', '45808', '45870'] },
  { k: 'ich-student-uni',  ar: 'أَنَا طَالِبٌ فِي الْجَامِعَةِ.', de: 'Ich bin Student an der Universität.', w: ['50154', '45763', '45812', '45819'] },
  { k: 'wer-das',          ar: 'مَنْ هَذَا؟',                     de: 'Wer ist das?',                    w: ['50168', '50160'] },
  { k: 'was-das',          ar: 'مَا هَذَا؟',                      de: 'Was ist das?',                    w: ['45777', '50160'] },
  { k: 'das-vater',        ar: 'هَذَا أَبِي.',                    de: 'Das ist mein Vater.',             w: ['50160', '45847'] },
  { k: 'das-mutter',       ar: 'هَذِهِ أُمِّي.',                  de: 'Das ist meine Mutter.',           w: ['50161', '45846'] },
  { k: 'er-bruder',        ar: 'هُوَ أَخِي.',                     de: 'Er ist mein Bruder.',             w: ['50157', 'madina1-l6-ach'] },
  { k: 'sie-schwester',    ar: 'هِيَ أُخْتِي.',                   de: 'Sie ist meine Schwester.',        w: ['50158', 'madina1-l6-ucht'] },
  { k: 'bruder-student',   ar: 'أَخِي طَالِبٌ.',                  de: 'Mein Bruder ist Student.',        w: ['madina1-l6-ach', '45763'] },
  { k: 'schwester-aerztin',ar: 'أُخْتِي طَبِيبَةٌ.',              de: 'Meine Schwester ist Ärztin.',     w: ['madina1-l6-ucht', '45761'] },
  { k: 'vater-zuhause',    ar: 'أَبِي فِي الْبَيْتِ.',            de: 'Mein Vater ist zu Hause.',        w: ['45847', '45812', '45751'] },
  { k: 'mutter-kueche',    ar: 'أُمِّي فِي الْمَطْبَخِ.',         de: 'Meine Mutter ist in der Küche.',  w: ['45846', '45812', '45823'] },
  { k: 'gast-zimmer',      ar: 'الضَّيْفُ فِي الْغُرْفَةِ.',      de: 'Der Gast ist im Zimmer.',         w: ['45913', '45812', '45821'] },

  /* Wie es einem geht */
  { k: 'ich-krank',        ar: 'أَنَا مَرِيضٌ.',                  de: 'Ich bin krank.',                  w: ['50154', '45807'] },
  { k: 'bist-du-krank',    ar: 'هَلْ أَنْتَ مَرِيضٌ؟',            de: 'Bist du krank?',                  w: ['50167', '50156', '45807'] },
  { k: 'warum-wuetend',    ar: 'لِمَاذَا أَنْتَ غَضْبَانُ؟',      de: 'Warum bist du wütend?',           w: ['45888', '50156', '50357'] },

  /* Essen und Trinken */
  { k: 'wasser-kalt',      ar: 'الْمَاءُ بَارِدٌ.',               de: 'Das Wasser ist kalt.',            w: ['45802', '45787'] },
  { k: 'tee-heiss',        ar: 'الشَّايُ حَارٌّ.',                de: 'Der Tee ist heiß.',               w: ['45849', '45788'] },
  { k: 'tee-suess',        ar: 'الشَّايُ حُلْوٌ.',                de: 'Der Tee ist süß.',                w: ['45849', '45806'] },
  { k: 'kaffee-heiss',     ar: 'الْقَهْوَةُ حَارَّةٌ.',           de: 'Der Kaffee ist heiß.',            w: ['45851', '45788'] },
  { k: 'obst-suess',       ar: 'الْفَاكِهَةُ حُلْوَةٌ.',          de: 'Das Obst ist süß.',               w: ['45875', '45806'] },
  { k: 'milch-kuehlschrank', ar: 'اللَّبَنُ فِي الثَّلَّاجَةِ.',  de: 'Die Milch ist im Kühlschrank.',   w: ['45782', '45812', '45848'] },
  { k: 'wasser-kuehlschrank', ar: 'الْمَاءُ فِي الثَّلَّاجَةِ.',  de: 'Das Wasser ist im Kühlschrank.',  w: ['45802', '45812', '45848'] },
  { k: 'becher-sauber',    ar: 'هَذَا الْكُوبُ نَظِيفٌ.',         de: 'Dieser Becher ist sauber.',       w: ['50160', '45889', '45795'] },
  { k: 'messer-scharf',    ar: 'السِّكِّينُ حَادٌّ.',             de: 'Das Messer ist scharf.',          w: ['45869', '45897'] },

  /* Zu Hause, Dinge */
  { k: 'schluessel-tisch', ar: 'الْمِفْتَاحُ عَلَى الْمَكْتَبِ.', de: 'Der Schlüssel liegt auf dem Schreibtisch.', w: ['45756', '45811', '45757'] },
  { k: 'tasche-bett',      ar: 'الْحَقِيبَةُ تَحْتَ السَّرِيرِ.', de: 'Die Tasche liegt unter dem Bett.', w: ['45840', '45828', '45758'] },
  { k: 'tasche-schwer',    ar: 'الْحَقِيبَةُ ثَقِيلَةٌ.',         de: 'Die Tasche ist schwer.',          w: ['45840', '45800'] },
  { k: 'tuer-zu-frage',    ar: 'هَلِ الْبَابُ مُغْلَقٌ؟',         de: 'Ist die Tür zu?',                 w: ['50167', '45753', '45837'] },
  { k: 'laden-zu-heute',   ar: 'الدُّكَّانُ مُغْلَقٌ الْيَوْمَ.', de: 'Das Geschäft hat heute zu.',      w: ['45804', '45837', '48402'] },
  { k: 'zimmer-sauber',    ar: 'الْغُرْفَةُ نَظِيفَةٌ.',          de: 'Das Zimmer ist sauber.',          w: ['45821', '45795'] },
  { k: 'bad-schmutzig',    ar: 'الْحَمَّامُ وَسِخٌ.',             de: 'Das Badezimmer ist schmutzig.',   w: ['45822', '45796'] },
  { k: 'auto-neu',         ar: 'هَذِهِ السَّيَّارَةُ جَدِيدَةٌ.', de: 'Dieses Auto ist neu.',            w: ['50161', '45832', '45791'] },
  { k: 'das-meins',        ar: 'هَذَا لِي.',                      de: 'Das gehört mir.',                 w: ['50160', '0f311405-7349-450c-885e-e3abefb6fbf3'] },
  { k: 'gehoert-dir',      ar: 'هَلْ هَذَا لَكَ؟',                de: 'Gehört das dir?',                 w: ['50167', '50160', '0f311405-7349-450c-885e-e3abefb6fbf3'] },
  { k: 'stuhl-gast',       ar: 'هَذَا الْكُرْسِيُّ لِلضَّيْفِ.',  de: 'Dieser Stuhl ist für den Gast.',  w: ['50160', '45759', '0f311405-7349-450c-885e-e3abefb6fbf3', '45913'] },

  /* Unterricht und Tag */
  { k: 'wann-unterricht',  ar: 'مَتَى الدَّرْسُ؟',                de: 'Wann ist der Unterricht?',        w: ['50169', '45955'] },
  { k: 'unterricht-heute', ar: 'الدَّرْسُ الْيَوْمَ.',            de: 'Der Unterricht ist heute.',       w: ['45955', '48402'] },
  { k: 'unterricht-leicht',ar: 'الدَّرْسُ سَهْلٌ.',               de: 'Der Unterricht ist leicht.',      w: ['45955', '45880'] },
  { k: 'lehrer-klasse',    ar: 'الْمُدَرِّسُ فِي الْفَصْلِ.',     de: 'Der Lehrer ist im Klassenzimmer.', w: ['45772', '45812', '45825'] },
  { k: 'arabisch-schoen',  ar: 'اللُّغَةُ الْعَرَبِيَّةُ جَمِيلَةٌ.', de: 'Die arabische Sprache ist schön.', w: ['45879', '45878', '45805'] },
  { k: 'arabisch-leicht',  ar: 'اللُّغَةُ الْعَرَبِيَّةُ سَهْلَةٌ.', de: 'Die arabische Sprache ist leicht.', w: ['45879', '45878', '45880'] },
  { k: 'schoener-tag',     ar: 'الْيَوْمُ يَوْمٌ جَمِيلٌ.',       de: 'Heute ist ein schöner Tag.',      w: ['48402', '45887', '45805'] },
];
