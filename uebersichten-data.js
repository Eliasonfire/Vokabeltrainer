/* uebersichten-data.js — Kapitel im Überblick und Thementafeln (Arabisch-App, 15.11.2026)
 * ==========================================================================
 *
 * Elias, 15.11.2026: „ich möchte im prinzip die grammatik regeln als übersicht haben bzw die
 * jeweiligen lektionen der kapteln damit ich später auch noch darauf gucken kann und eine
 * zusammenfassung von allem wichtigen habe so wie auch bei der russich app". Dazu: „da brauchen wir
 * auch von kapitel 16 die plural formen der dinge die keinen verstand haben" und „was ist mit
 * genitiv, das ist ein riesen thema". Auf den Plan (Kapitel-Seiten + Thementafeln): „fang an".
 *
 * ⛔ NUR ZUM NACHSCHLAGEN. Keine Karteikarte, keine Übung, kein Lernstand.
 * ⛔ JEDES ARABISCHE WORT HIER STEHT WÖRTLICH IN grammar-data.js ODER lehrbuch-saetze.js
 *    (mit denselben Ḥarakāt). Die Arabisch-App hat keinen Buchumschlag mit Tabellen wie das
 *    Russisch-Buch; die Quelle sind deshalb seine eigenen Regeln. Nichts ist dazu erfunden.
 *    Bewacht von werkzeuge/pruefe-uebersichten.mjs. Bloße Buchstaben ohne Vokalzeichen
 *    (Sonnen- und Mondbuchstaben) sind davon ausgenommen.
 *    Die deutschen Sätze sind meine Zusammenfassung seiner Regeln.
 *
 * Welche Regeln zu einem Kapitel gehören, steht NICHT hier: js/uebersicht.js liest es zur Laufzeit
 * aus grammar-data.js (Feld kapitel, sonst source.chapter). So bleibt die Liste von selbst aktuell.
 *
 * Zelle einer Tabelle: Text. Steht nur Arabisch darin, wird sie groß und von rechts gezeigt.
 */
const UEBERSICHTEN = {
  kapitel: [
    { nr: 1, titel: 'Dies ist … und die Frage mit أَ',
      worum: 'Mit هَذَا zeigst du auf etwas Männliches in der Nähe. Ein أَ vor dem Satz macht daraus eine Ja/Nein-Frage. Das ة am Wortende zeigt: das Wort ist weiblich.',
      beispiel: [['أَهَذَا بَيْتٌ؟', 'Ist dies ein Haus?'], ['نَعَمْ، هَذَا بَيْتٌ.', 'Ja, dies ist ein Haus.']],
      achtung: ['هَذَا gilt nur für männliche Wörter. Für weibliche steht هَذِهِ.'] },
    { nr: 2, titel: 'Wer? und jenes',
      worum: 'مَنْ fragt nach Personen. ذَلِكَ zeigt wie هَذَا auf etwas Männliches, aber in der Ferne.',
      beispiel: [['ذَلِكَ الرَّجُلُ طَبِيبٌ', 'Jener Mann ist ein Arzt.']],
      achtung: ['مَنْ (man, wer) und مِنْ (min, von) sehen ohne Vokalzeichen gleich aus.'] },
    { nr: 3, titel: 'اَلْ – das bestimmte Wort',
      worum: 'Mit اَلْ wird ein Wort bestimmt, und das Tanwīn fällt weg. Ob du das Lam sprichst, entscheidet der Buchstabe danach: Mond- oder Sonnenbuchstabe. Und ein Nominalsatz hat zwei Teile: مُبْتَدَأٌ und خَبَرٌ.',
      beispiel: [['الْكِتَابُ جَدِيدٌ وَالْقَلَمُ قَدِيمٌ', 'Das Buch ist neu und der Stift ist alt.']],
      achtung: ['اَلْ und Tanwīn nie zusammen: الْقَلَمُ, nicht الْقَلَمٌ.', 'الْقَمِيصُ نَظِيفٌ ist ein Satz („das Hemd ist sauber"), keine Wortgruppe.'] },
    { nr: 4, titel: 'Die Fälle und die ersten Genitivpartikeln',
      worum: 'Die Endung zeigt den Fall: Ḍamma für den Grundfall, Kasra für den Genitiv, Fatḥa für den Akkusativ. فِي, عَلَى, مِنْ und إِلَى ziehen das Wort danach in den Genitiv. Dazu kommen أَيْنَ, هُوَ und هِيَ und die ersten Verben.',
      beispiel: [['أَيْنَ مُحَمَّدٌ؟', 'Wo ist Mohammed?'], ['هُوَ فِي الْغُرْفَةِ', 'Er ist im Zimmer.']],
      achtung: ['Nach einer Genitivpartikel endet das Wort auf Kasra: فِي الْبَيْتِ.', 'Vor اَلْ wird مِنْ zu مِنَ: مِنَ الْبَيْتِ.'] },
    { nr: 5, titel: 'إِضَافَةٌ – die Genitivverbindung',
      worum: 'Zwei Nomen hintereinander: das erste ist der Besitz (مُضَافٌ), das zweite der Besitzer (مُضَافٌ إِلَيْهِ). Das ist der zweite Weg zum Genitiv, nach der Genitivpartikel. Auch Ortswörter wie تَحْتَ ziehen das Wort danach in den Genitiv.',
      beispiel: [['بَابُ الْمَسْجِدِ', 'die Tür der Moschee'], ['عَلَى مَكْتَبِ الْمُدَرِّسِ', 'auf dem Schreibtisch des Lehrers']],
      achtung: ['Das erste Wort hat kein اَلْ und kein Tanwīn.', 'Das zweite Wort steht immer im Genitiv.'] },
    { nr: 6, titel: 'Wem gehört das? Männlich und weiblich',
      worum: 'لِمَنْ fragt, wem etwas gehört, لِ antwortet. Die Aussage über etwas Weibliches wird selbst weiblich. Manche Wörter sind weiblich ohne ة.',
      beispiel: [['لِمَنْ هَذِهِ؟', 'Wem gehört diese hier?'], ['هَذِهِ لِخَالِدٍ', 'Diese gehört Khalid.']],
      achtung: ['الْغُرْفَةُ مَفْتُوحَةٌ, nicht الْغُرْفَةُ مَفْتُوحٌ.', 'Körperteile, die es doppelt gibt, sind weiblich: يَدٌ, عَيْنٌ.'] },
    { nr: 7, titel: 'jene und mein',
      worum: 'تِلْكَ zeigt auf etwas Weibliches in der Ferne. Das Hinweiswort richtet sich nach dem Geschlecht. Mit ـي sagst du „mein".',
      beispiel: [['هَذِهِ طَبِيبَةٌ وَتِلْكَ مُمَرِّضَةٌ', 'Dies ist eine Ärztin und jene ist eine Krankenschwester.']],
      achtung: ['Weibliche Namen haben kein Tanwīn: فَاطِمَةُ, آمِنَةُ.'] },
    { nr: 8, titel: 'لِلـ und die Ortswörter',
      worum: 'لِ vor اَلْ wird zu لِلـ. تَحْتَ, أَمَامَ und خَلْفَ sagen, wo etwas ist, und ziehen das Wort danach in den Genitiv. Wörter auf ى ändern ihre Endung nie.',
      beispiel: [['بَيْتُ الْإِمَامِ خَلْفَ الْمَسْجِدِ', 'Das Haus des Imams ist hinter der Moschee.']],
      achtung: ['Bei Namen nur لِ, kein لِلْ: لِعَمَّارٍ.'] },
    { nr: 9, titel: 'نَعْتٌ – das Adjektiv',
      worum: 'Das Adjektiv steht hinter dem Nomen und stimmt in vier Dingen mit ihm überein: Geschlecht, Bestimmtheit, Fall und Zahl. Passt die Bestimmtheit nicht, ist es kein Adjektiv, sondern die Aussage. Dazu kommen الَّذِي und عِنْدَ.',
      beispiel: [['مَسْجِدٌ كَبِيرٌ', 'eine große Moschee'], ['الْمَسْجِدُ كَبِيرٌ', 'Die Moschee ist groß.']],
      achtung: ['Am weiblichen Nomen wird das Adjektiv weiblich: بِنْتٌ صَغِيرَةٌ.', 'كَسْلَانُ und ähnliche Adjektive haben kein Tanwīn.'] },
    { nr: 10, titel: 'Die Besitzendungen',
      worum: 'Mein, dein, sein, ihr: eine Endung am Wort, kein eigenes Wort. Die Besitzendung ist selbst ein مُضَافٌ إِلَيْهِ. لِ steht für das, was untrennbar zu dir gehört, عِنْدَ für das, was du weggeben kannst.',
      beispiel: [['عِنْدِي كِتَابٌ', 'Ich habe ein Buch (bei mir).'], ['لِي أَخٌ', 'Ich habe einen Bruder.']],
      achtung: ['Mit Besitzendung fällt das Tanwīn weg.', 'أَبٌ und أَخٌ bekommen ein Wāw davor: abū-ka, aḫū-ka. Nur bei „mein" nicht.'] },
    { nr: 11, titel: 'Kapitel 11',
      worum: 'Zu Kapitel 11 steht noch keine Regel in deiner App.',
      beispiel: [], achtung: [] },
    { nr: 12, titel: 'Das Verb in der Vergangenheit',
      worum: 'Der Stamm bleibt, nur die Endung wechselt: vierzehn Pronomen, vierzehn Endungen. Die Gegenwart erkennst du dagegen am Anfang des Verbs, und سَـ davor macht die Zukunft. Dazu kommen الَّتِي, بِـ und die übrigen Pronomen.',
      beispiel: [['جَلَسَتِ الطَّالِبَةُ', 'Die Studentin setzte sich.'], ['أَنَا بِخَيْرٍ وَالْحَمْدُ لِلَّهِ', 'Mir geht es gut, Lob sei Allah.']],
      achtung: ['Vergangenheit: das Ende ändert sich. Gegenwart: der Anfang.', 'Hängt an لِ eine Endung, wird es لَـ: لَكَ, لَهُ. Nur لِي behält die Kasra.'] },
    { nr: 13, titel: 'Die Mehrzahl',
      worum: 'Es gibt die regelmäßige Mehrzahl (männlich mit ـُونَ, weiblich mit ـَات) und die gebrochene, bei der das Wort umgebaut wird. Für mehrere Personen gibt es هَؤُلَاءِ und أُولَئِكَ.',
      beispiel: [['هَؤُلَاءِ تُجَّارٌ', 'Dies sind Händler.'], ['هَؤُلَاءِ مُدَرِّسَاتٌ', 'Dies sind Lehrerinnen.']],
      achtung: ['Die gebrochene Mehrzahl lernst du mit dem Wort mit.', 'Manche Mehrzahlen haben kein Tanwīn: أَطِبَّاءُ.'] },
    { nr: 14, titel: 'Namen, welcher und das Adjektiv am Besitz',
      worum: 'Namen, die nicht aus dem Arabischen kommen, haben kein Tanwīn. أَيُّ heißt „welcher" und wirkt wie ein مُضَافٌ. Ein Wort mit Besitzendung ist bestimmt, also trägt sein Adjektiv اَلْ.',
      beispiel: [['بَيْتُنَا الْجَدِيدُ قَرِيبٌ مِنَ الْمَطَارِ.', 'Unser neues Haus ist nahe beim Flughafen.'], ['أَيُّ يَوْمٍ هَذَا؟', 'Welcher Tag ist dies?']],
      achtung: ['إِبْرَاهِيمُ hat kein Tanwīn.'] },
    { nr: 15, titel: 'heute',
      worum: 'الْيَوْمَ mit Fatḥa heißt „heute". Es ist eine Zeitangabe, darum die Fatḥa.',
      beispiel: [['الْمُدَرِّسُ هُنَا الْيَوْمَ.', 'Der Lehrer ist heute hier.']],
      achtung: ['Mit Ḍamma heißt es meist „der Tag".'] },
    { nr: 16, titel: 'Mehrzahl von Dingen',
      worum: 'Die Mehrzahl von Dingen und Tieren benimmt sich wie ein weibliches Wort in der Einzahl. Die echte Mehrzahl steht nur bei Menschen.',
      beispiel: [['هَذِهِ كُتُبٌ جَدِيدَةٌ.', 'Dies sind neue Bücher.'], ['هَؤُلَاءِ طُلَّابٌ جُدُدٌ.', 'Dies sind neue Studenten.']],
      achtung: ['Bei Büchern, Häusern und Hunden: هَذِهِ, تِلْكَ und هِيَ, nicht هَؤُلَاءِ und أُولَئِكَ.'] },
    { nr: 17, titel: 'ist nicht',
      worum: 'لَيْسَ heißt „ist nicht". Die Aussage danach bekommt بِ und steht deshalb im Genitiv. لَدَى heißt „bei", wie عِنْدَ.',
      beispiel: [['لَيْسَ الْبَيْتُ بِجَدِيدٍ.', 'Das Haus ist nicht neu.']],
      achtung: ['Weiblich heißt es لَيْسَتْ: لَيْسَتْ زَيْنَبُ بِمَرِيضَةٍ.'] }
  ],

  tafeln: [
    { id: 'ueb-hinweis', titel: 'Hinweiswörter (dies, jenes)', unter: 'nah oder fern, männlich, weiblich oder mehrere',
      tabelle: { kopf: ['', 'nah', 'fern'], zeilen: [
        ['männlich', 'هَذَا', 'ذَلِكَ'],
        ['weiblich', 'هَذِهِ', 'تِلْكَ'],
        ['mehrere Personen', 'هَؤُلَاءِ', 'أُولَئِكَ'],
        ['mehrere Dinge', 'هَذِهِ', 'تِلْكَ']] },
      hinweise: ['Bei mehreren Personen gibt es nur noch ein Wort, für Männer und Frauen gleich.',
        'Mehrere Dinge sind wie weiblich Einzahl (Kapitel 16): هَذِهِ كُتُبٌ جَدِيدَةٌ.',
        'Das كَ am Ende steht für die Ferne: ذَلِكَ · تِلْكَ · هُنَاكَ.'],
      regeln: ['ismul-isara-hadha-01', 'ismul-isara-dhalika-01', 'ismul-isara-tilka-01', 'isara-genus-kongruenz-01', 'ismul-isara-haulai-01', 'ismul-isara-ulaika-01', 'kaf-der-entfernung-01', 'jam-ghayr-aqil-01'] },

    { id: 'ueb-pronomen', titel: 'Fürwörter (ich, du, er …)', unter: 'vierzehn Pronomen, in Dreierpaketen',
      tabelle: { kopf: ['', 'einer', 'zwei', 'mehrere'], zeilen: [
        ['er / sie (m)', 'هُوَ', 'هُمَا', 'هُمْ'],
        ['sie (f)', 'هِيَ', 'هُمَا', 'هُنَّ'],
        ['du / ihr (m)', 'أَنْتَ', 'أَنْتُمَا', 'أَنْتُمْ'],
        ['du / ihr (f)', 'أَنْتِ', 'أَنْتُمَا', 'أَنْتُنَّ'],
        ['ich / wir', 'أَنَا', '', 'نَحْنُ']] },
      hinweise: ['Ein eigenes „es" gibt es nicht: هُوَ für männliche, هِيَ für weibliche Wörter.',
        'Zwei ist eine eigene Zahl (Dual), die es im Deutschen nicht gibt.'],
      regeln: ['huwa-hiya-01', 'huwa-hiya-weitere-01', 'verb-madi-endungen-01'] },

    { id: 'ueb-besitz', titel: 'Besitzendungen (mein, dein …)', unter: 'eine Endung am Wort, kein eigenes Wort',
      tabelle: { kopf: ['', 'Endung', 'an لِ'], zeilen: [
        ['mein', 'ـِي', 'لِي'],
        ['dein (m)', 'ـكَ', 'لَكَ'],
        ['dein (f)', 'ـكِ', 'لَكِ'],
        ['sein', 'ـهُ', 'لَهُ'],
        ['ihr', 'ـهَا', 'لَهَا']] },
      hinweise: ['Mit Besitzendung fällt das Tanwīn weg.',
        'Die Besitzendung ist ein مُضَافٌ إِلَيْهِ, also eine Genitivverbindung in einem Wort.',
        'Nach Kasra wird ـهُ zu ـهِ: فِيهِ.',
        'أَبٌ und أَخٌ bekommen ein Wāw davor: أَيْنَ أَبُوكَ يَا خَالِدُ؟',
        'Unser: بَيْتُنَا الْجَدِيدُ قَرِيبٌ مِنَ الْمَطَارِ.'],
      regeln: ['possessiv-ya-01', 'possessiv-endungen-01', 'possessiv-ist-idafa-01', 'hu-nach-kasra-01', 'asma-khamsa-01', 'li-mit-suffix-01'] },

    { id: 'ueb-vergangenheit', titel: 'Das Verb in der Vergangenheit', unter: 'vierzehn Formen von ذَهَبَ (gehen)',
      tabelle: { kopf: ['', 'einer', 'zwei', 'mehrere'], zeilen: [
        ['er / sie (m)', 'ذَهَبَ', 'ذَهَبَا', 'ذَهَبُوا'],
        ['sie (f)', 'ذَهَبَتْ', 'ذَهَبَتَا', 'ذَهَبْنَ'],
        ['du / ihr (m)', 'ذَهَبْتَ', 'ذَهَبْتُمَا', 'ذَهَبْتُمْ'],
        ['du / ihr (f)', 'ذَهَبْتِ', 'ذَهَبْتُمَا', 'ذَهَبْتُنَّ'],
        ['ich / wir', 'ذَهَبْتُ', '', 'ذَهَبْنَا']] },
      hinweise: ['Der Stamm bleibt gleich, nur die Endung wechselt.',
        'Bei der 2. Person steckt die Endung schon im Pronomen: أَنْتَ → ـْتَ.',
        'Die Gegenwart erkennst du am Anfang des Verbs, die Vergangenheit am Ende.',
        'Vor اَلْ wird aus dem Sukūn am Verb eine Kasra: جَلَسَتِ الطَّالِبَةُ.'],
      regeln: ['verb-madi-endungen-01', 'verb-enthaelt-pronomen-01', 'mudari-erkennen-01', 'mudari-sa-zukunft-01', 'iltiqa-sakinain-verb-01'] },

    { id: 'ueb-faelle', titel: 'Die drei Fälle', unter: 'die Endung zeigt den Fall',
      tabelle: { kopf: ['', 'Zeichen', 'Beispiel'], zeilen: [
        ['Grundfall (مَرْفُوعٌ)', 'ـُ ـٌ', 'مُحَمَّدٌ'],
        ['Akkusativ (مَنْصُوبٌ)', 'ـَ ـً', 'مُحَمَّدًا'],
        ['Genitiv (مَجْرُورٌ)', 'ـِ ـٍ', 'مُحَمَّدٍ']] },
      hinweise: ['Grundfall: normalerweise, auch مُبْتَدَأٌ und خَبَرٌ.',
        'Akkusativ: wen oder was? Auch die Ortswörter selbst: تَحْتَ, أَمَامَ.',
        'Genitiv: nach حَرْفُ جَرٍّ, als مُضَافٌ إِلَيْهِ und nach einem Ortswort (Tafel „Der Genitiv").',
        'Endet ein unbestimmtes Wort auf zwei Fatḥa, steht ein Alif dahinter: شُكْرًا جَزِيلًا.',
        'Wörter auf ى oder ا zeigen ihren Fall nicht: فِي الْمُسْتَشْفَى.',
        'Manche Wörter haben nie Tanwīn (الْمَمْنُوعُ مِنَ الصَّرْفِ): weibliche Namen, كَسْلَانُ, أَطِبَّاءُ, إِبْرَاهِيمُ.'],
      regeln: ['irab-drei-faelle-01', 'marfu-grundfall-01', 'tanwin-fath-alif-01', 'alif-maqsura-unveraenderlich-01', 'mamnu-min-as-sarf-01'] },

    { id: 'ueb-genitiv', titel: 'Der Genitiv (مَجْرُورٌ)', unter: 'drei Wege, dazu die Besitzendung',
      tabelle: { kopf: ['Weg', 'Beispiel', 'auf Deutsch'], zeilen: [
        ['Genitivpartikel', 'فِي الْبَيْتِ', 'im Haus'],
        ['… unbestimmt', 'فِي رَيْبٍ', 'in Zweifel'],
        ['Genitivverbindung', 'كِتَابُ اللهِ', 'das Buch Allahs'],
        ['… unbestimmt', 'بَيْتُ إِمَامٍ', 'das Haus eines Imams'],
        ['Ortswort', 'تَحْتَ الْمَكْتَبِ', 'unter dem Schreibtisch'],
        ['Besitzendung', 'بَيْتُنَا', 'unser Haus'],
        ['beides zusammen', 'عَلَى مَكْتَبِ الْمُدَرِّسِ', 'auf dem Schreibtisch des Lehrers'],
        ['Kette', 'هَذَا اِبْنُ إِمَامِ الْمَسْجِدِ', 'dies ist der Sohn des Imams der Moschee']] },
      hinweise: ['Das erste Wort der إِضَافَةٌ (مُضَافٌ) hat kein اَلْ und kein Tanwīn, ist aber trotzdem bestimmt.',
        'Das zweite Wort (مُضَافٌ إِلَيْهِ) steht immer im Genitiv.',
        'So erkennst du die إِضَافَةٌ: ein Nomen ohne Tanwīn, direkt danach noch ein Nomen.',
        'Das mittlere Wort einer Kette hat Kasra, aber kein Tanwīn.',
        'Kein Adjektiv als zweites Wort: اَلرَّجُلُ مَرِيضٌ bleibt ein Satz.',
        'Nach Kasra klingt اَللّٰه hell: فِي كِتَابِ اللهِ.'],
      regeln: ['harf-jarr-01', 'tanwin-nach-harf-jarr-01', 'idafa-01', 'mudaf-01', 'mudaf-ilayh-01', 'mudaf-ohne-al-01', 'idafa-erkennen-01', 'idafa-zweitglied-01', 'idafa-verkettung-01', 'idafa-kein-adjektiv-01', 'harf-jarr-idafa-01', 'zarf-01', 'zarf-als-mudaf-01', 'possessiv-ist-idafa-01', 'idafa-ayyu-01', 'lafz-al-jalala-01'] },

    { id: 'ueb-partikeln', titel: 'Genitivpartikeln (حُرُوفُ الْجَرِّ)', unter: 'sechs Partikeln, eine Regel',
      tabelle: { kopf: ['', 'heißt', 'Beispiel'], zeilen: [
        ['فِي', 'in', 'فِي الْمَسْجِدِ'],
        ['عَلَى', 'auf', 'عَلَى الْمَكْتَبِ'],
        ['مِنْ', 'von, aus', 'مِنَ الْبَيْتِ'],
        ['إِلَى', 'zu, nach', 'إِلَى الْمَسْجِدِ'],
        ['لِ', 'für, gehört', 'هَذَا لِخَالِدٍ'],
        ['بِـ', 'mit, an, bei', 'أَنَا طَالِبٌ بِالْجَامِعَةِ']] },
      hinweise: ['Jede zieht das Wort danach in den Genitiv: aus اَلْبَيْتُ wird فِي الْبَيْتِ.',
        'Vor اَلْ wird مِنْ zu مِنَ.',
        'لِ vor اَلْ wird لِلْ: لِلْمُدَرِّسِ. Bei Namen nur لِ: لِعَمَّارٍ.',
        'عِنْدَ, تَحْتَ und مَعَ sind keine Partikeln, sondern Ortswörter. Sie wirken aber genauso.'],
      regeln: ['harf-jarr-fi-ala-01', 'harf-jarr-min-ila-01', 'mina-al-01', 'harf-jarr-li-01', 'li-al-lil-01', 'lil-vs-li-01', 'li-eigenname-01', 'harf-jarr-bi-01', 'harf-jarr-bi-fi-01', 'hurufu-jarr-bedeutungen-01', 'harf-jarr-name-01'] },

    { id: 'ueb-ortswoerter', titel: 'Ortswörter (ظَرْفٌ)', unter: 'wo etwas ist',
      tabelle: { kopf: ['', 'heißt', 'Beispiel'], zeilen: [
        ['تَحْتَ', 'unter', 'تَحْتَ السَّيَّارَةِ'],
        ['أَمَامَ', 'vor', 'أَمَامَ الْمَسْجِدِ'],
        ['خَلْفَ', 'hinter', 'خَلْفَ الْمَدْرَسَةِ'],
        ['فَوْقَ', 'über', 'الْقَلَمُ فَوْقَ الْكِتَابِ'],
        ['وَرَاءَ', 'hinter', 'السَّيَّارَةُ وَرَاءَ الشَّجَرَةِ'],
        ['عِنْدَ', 'bei', 'الطَّبِيبُ عِنْدَ الْبَابِ'],
        ['مَعَ', 'mit', 'أَنَا مَعَ الْمُدِيرِ'],
        ['لَدَى', 'bei', 'لَدَى الْبَابِ']] },
      hinweise: ['Das Ortswort selbst endet auf Fatḥa, das Wort danach auf Kasra.',
        'Weitere aus Bayna Yadayk: بَيْنَ, يَمِين, يَسَار, شَمَال, جَنُوب, شَرْق, غَرْب.',
        'عِنْدَ geht auch für die Zeit, und für Besitz, den man weggeben kann: عِنْدِي كِتَابٌ.',
        'مَعَ: irgendwo zusammen. عِنْدَ: ich bin zu ihm hingegangen.'],
      regeln: ['zuruf-makan-01', 'zuruf-makan-weitere-01', 'zarf-makan-rollenname-01', 'zarf-mansub-01', 'inda-ort-und-zeit-01', 'zarf-maa-inda-01', 'li-vs-inda-01', 'zarf-lada-01'] },

    { id: 'ueb-fragen', titel: 'Fragewörter', unter: 'womit man fragt',
      tabelle: { kopf: ['', 'heißt'], zeilen: [
        ['مَنْ', 'wer'], ['أَيْنَ', 'wo, wohin'], ['مِنْ أَيْنَ', 'woher'], ['مَا', 'was'], ['مَاذَا', 'was (nach Sachen)'],
        ['كَيْفَ', 'wie'], ['مَتَى', 'wann'], ['لِمَاذَا', 'warum'], ['كَمْ', 'wie viel'], ['لِمَنْ', 'wem gehört'],
        ['أَيُّ', 'welcher'], ['هَلْ', 'Ja/Nein-Frage'], ['أَ', 'Ja/Nein-Frage']] },
      hinweise: ['Ohne Fragewort keine Frage: eine andere Wortstellung allein reicht nicht.',
        'Nach أَيُّ steht das Wort im Genitiv: أَيُّ يَوْمٍ هَذَا؟'],
      regeln: ['istifham-uebersicht-01', 'istifham-men-01', 'istifham-ayna-01', 'min-ayna-01', 'istifham-madha-01', 'istifham-liman-01', 'idafa-ayyu-01', 'fragepartikel-alif-01', 'fragepartikel-erforderlich-01'] },

    { id: 'ueb-sonne-mond', titel: 'Sonnen- und Mondbuchstaben', unter: 'ob du das Lam von اَلْ sprichst',
      sonneMond: true,
      tabelle: { kopf: ['', 'Lam', 'Beispiel'], zeilen: [
        ['Mondbuchstabe', 'gesprochen', 'اَلْقَمَرُ'],
        ['Mondbuchstabe', 'gesprochen', 'اَلْبَيْتُ'],
        ['Sonnenbuchstabe', 'übersprungen, Schadda', 'اَلشَّمْسُ'],
        ['Sonnenbuchstabe', 'übersprungen, Schadda', 'اَلرَّجُلُ']] },
      hinweise: ['Die Namen zeigen die Regel selbst: اَلْقَمَرُ (al-qamar) und اَلشَّمْسُ (asch-schams).'],
      regeln: ['schams-qamar-01', 'schams-qamar-merkhilfe-01', 'li-al-lil-01'] },

    { id: 'ueb-mehrzahl', titel: 'Die Mehrzahl', unter: 'regelmäßig, gebrochen, und bei Dingen',
      tabelle: { kopf: ['', 'Einzahl', 'Mehrzahl'], zeilen: [
        ['männlich', 'مُسْلِمٌ', 'مُسْلِمُونَ'],
        ['weiblich', 'مُدَرِّسَةٌ', 'مُدَرِّسَاتٌ'],
        ['gebrochen', 'نَجْمٌ', 'نُجُومٌ'],
        ['gebrochen', 'كُوبٌ', 'أَكْوَابٌ'],
        ['gebrochen', 'طَالِبٌ', 'طُلَّابٌ'],
        ['ohne Tanwīn', 'طَبِيبٌ', 'أَطِبَّاءُ']] },
      tabelle2: { titel: 'Kapitel 16: Menschen oder Dinge?', kopf: ['', 'Menschen', 'Dinge, Tiere'], zeilen: [
        ['dies', 'هَؤُلَاءِ', 'هَذِهِ'],
        ['jene', 'أُولَئِكَ', 'تِلْكَ'],
        ['sie', 'هُمْ', 'هِيَ'],
        ['Adjektiv', 'جُدُدٌ', 'جَدِيدَةٌ']] },
      hinweise: ['Regelmäßig männlich: ـُونَ wird angehängt. Regelmäßig weiblich: ة wird zu ـَات.',
        'Die Mehrzahl von Dingen und Tieren ist wie weiblich Einzahl. Die echte Mehrzahl nur bei Menschen.',
        'Menschen: هَؤُلَاءِ طُلَّابٌ جُدُدٌ. Dinge: هَذِهِ كُتُبٌ جَدِيدَةٌ.',
        'Die gebrochene Mehrzahl lernst du mit dem Wort mit.'],
      regeln: ['jam-salim-taksir-01', 'jam-mudhakkar-salim-01', 'jam-muannath-salim-01', 'jam-taksir-01', 'mamnu-min-as-sarf-plural-01', 'jam-ghayr-aqil-01', 'ismul-isara-haulai-01', 'ismul-isara-ulaika-01'] },

    { id: 'ueb-adjektiv', titel: 'Adjektiv oder Aussage?', unter: 'die Bestimmtheit entscheidet',
      tabelle: { kopf: ['', 'Arabisch', 'auf Deutsch'], zeilen: [
        ['beide unbestimmt', 'مَسْجِدٌ كَبِيرٌ', 'eine große Moschee'],
        ['beide bestimmt', 'الْمَسْجِدُ الْكَبِيرُ', 'die große Moschee'],
        ['nur das erste bestimmt', 'الْمَسْجِدُ كَبِيرٌ', 'Die Moschee ist groß.'],
        ['weiblich', 'بِنْتٌ صَغِيرَةٌ', 'ein kleines Mädchen'],
        ['am Besitz', 'بَيْتُنَا الْجَدِيدُ', 'unser neues Haus']] },
      hinweise: ['Das Adjektiv stimmt in vier Dingen überein: Geschlecht, Bestimmtheit, Fall und Zahl.',
        'Die Endung zeigt, WEN es beschreibt: هُوَ اِبْنُ الْمُدِيرِ الْجَدِيدِ (der neue Direktor).',
        'Die Aussage über etwas Weibliches wird weiblich: الْغُرْفَةُ مَفْتُوحَةٌ.'],
      regeln: ['nat-vier-bedingungen-01', 'nat-bestimmtheit-01', 'satz-vs-wortgruppe-01', 'nat-fem-01', 'nat-eigenname-01', 'nat-wen-beschreibt-01', 'nat-bestimmter-mudaf-01', 'mutabaqa-genus-01', 'mubtada-khabar-genus-01', 'badal-01'] }
  ]
};
if (typeof module !== 'undefined') module.exports = { UEBERSICHTEN };
