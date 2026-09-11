/* ===================== REGELSAMMLUNG — DATEN =====================

   Elias am 11.09.2026, 03:43: „ich würde aber gerne auch einen bereich haben
   wo ich alle regeln nachschlagen kann und mir die einzelnen regeln
   durchlesen kann und sie mir nochmals ins gedächtnis rufen kann. vorallem
   die folge 19 von meinem unterricht eignet sich da eigentlich ganz gut […]
   aber primär will ich eigentlich die regeln von folge 19 da stehen haben
   weil die sind für mich relevant. am besten auch immer mit einem
   beispielsatz."

   Zwei Teile:
     FOLGE19_KARTEN        die neun Zusammenfassungen aus Folge 19
                           („Grammatikabfrage 1") — oben in „Regeln"
     REGELPRUEFUNG_26_08   seine Inhalts-Urteile aus dem Regelprüfungs-
                           Artefakt; entscheiden, was darunter steht

   ⛔⛔ DAS ARABISCH IST ABGESCHRIEBEN, NICHT VOKALISIERT.
   Quelle ist die Musterlösung, die der Lehrer in Folge 19 durchgeht
   (Samsung-Sicherung, Pfad in der To-Do). Ihre Textebene ist zum Abschreiben
   unbrauchbar (Reihenfolge verdreht), trägt aber jeden Buchstaben mit seiner
   Position — jede Abschrift wurde Zeile für Zeile gegen sie geprüft: gleiche
   Buchstaben, gleiche Zeichen, Zeichen auf demselben Buchstaben. Alles andere
   Arabisch stammt wörtlich aus grammar-data.js. werkzeuge/pruefe-regelsammlung.mjs
   hält beides fest: ein arabisches Wort, das in keiner der beiden Quellen
   steht, macht ihn rot. [[regeln_selbst_auswerten]] [[maddah_sieht_aus_wie_fatha]]

   ⚠️ Die Minuten (`folge`) beziehen sich auf transcripts/raw/folge-19.txt —
   automatische Untertitel. Zitiert wird deshalb nur, was dort lesbar steht;
   verstümmelte Stellen („zwei Nummer" statt „zwei Nomen") werden nicht
   geglättet, sondern weggelassen. Die Musterlösung ist die genauere Quelle
   und trägt die Merkmale.

   ⚠️ `genauer`: Elias' Auflage aus dem Goal — „Ist eine vorhandene Regel
   genauer als Folge 19: beides nennen." Jeder Eintrag sagt, WORIN die Regel
   weiter geht; der Text stammt aus der Regel selbst. */

const FOLGE19_KARTEN = [
  {
    id: 'f19-idafa',
    nr: 1,
    titel: 'Iḍāfa',
    untertitel: 'Genitivverbindung',
    ar: 'الإِضَافَة',
    kern: 'Eine إِضَافَة (Iḍāfa) verbindet zwei Nomen miteinander.',
    gruppen: [
      { ar: 'مُضَافٌ', name: 'Muḍāf', rolle: 'das erste Wort',
        merkmale: ['bekommt kein ال', 'bekommt kein Tanwīn',
                   'sein Kasus (also der Fall) hängt von seiner Funktion im Satz ab'] },
      { ar: 'مُضَافٌ إِلَيْهِ', name: 'Muḍāf ilayhi', rolle: 'das zweite Wort',
        merkmale: ['steht immer im Genitiv (مَجْرُور)',
                   'darf bestimmt oder unbestimmt sein'] }
    ],
    zerlegung: [
      { ar: 'كِتَابُ', rolle: 'مُضَافٌ' },
      { ar: 'الطَّالِبِ', rolle: 'مُضَافٌ إِلَيْهِ مَجْرُورٌ' }
    ],
    beispiele: [
      { ar: 'بَيْتُ الْمُدَرِّسِ', de: 'das Haus des Lehrers' },
      { ar: 'بَيْتُ مُدَرِّسٍ', de: 'das Haus eines Lehrers' },
      { ar: 'كِتَابُ الطَّالِبِ', de: 'das Buch des Studenten' }
    ],
    lehrer: [
      { zeit: '1:56', text: 'Der Mudaf darf kein Elif und Lam bekommen, also bekommt keinen Artikel. Er bekommt auch kein Tanwin.' },
      { zeit: '2:36', text: 'ist immer mit Kassra immer immer majur. Ansonsten kann er bestimmt oder unbestimmt sein. Das ist kein Problem.' },
      { zeit: '2:56', text: 'haben den äh Besitz und wir haben den Besitzer' }
    ],
    quelle: { folge: '0:35–3:15', muster: 'Nr. 1, S. 1–2' },
    regeln: ['idafa-01', 'mudaf-01', 'mudaf-ilayh-01', 'mudaf-ohne-al-01', 'idafa-erkennen-01',
             'idafa-zweitglied-01', 'idafa-kein-adjektiv-01', 'idafa-verkettung-01',
             'harf-jarr-idafa-01', 'zarf-als-mudaf-01', 'possessiv-ist-idafa-01'],
    genauer: [
      { regel: 'mudaf-ohne-al-01', text: 'Folge 19 sagt nur „kein ال". Die Regel ergänzt: der Muḍāf ist trotzdem bestimmt — durch den Besitzer. بَيْتُ حامِدٍ heißt „das Haus Hamids", nicht „ein Haus Hamids".' },
      { regel: 'mudaf-ilayh-01', text: 'Das Erkennungszeichen: zwei Nomen hintereinander, und das zweite trägt Kasra.' },
      { regel: 'idafa-zweitglied-01', text: 'Bei männlichen Eigennamen als zweitem Wort gibt es die Wahl „bestimmt oder unbestimmt" nicht: sie stehen immer mit Tanwīn.' }
    ]
  },
  {
    id: 'f19-nat',
    nr: 2,
    titel: 'Naʿt und Manʿūt',
    untertitel: 'Adjektivverbindung',
    ar: 'النَّعْتُ وَالْمَنْعُوتُ',
    kern: 'Das نَعْت folgt seinem مَنْعُوت grundsätzlich in vier Dingen.',
    gruppen: [
      { ar: 'مَنْعُوتٌ', name: 'Manʿūt', rolle: 'das beschriebene Wort',
        merkmale: ['das, was erklärt wird'] },
      { ar: 'نَعْتٌ', name: 'Naʿt', rolle: 'das Adjektiv',
        merkmale: ['beschreibt das Wort und folgt ihm in vier Dingen:',
                   'الإِعْرَاب – Kasus (Fall)',
                   'التَّعْرِيفُ وَالتَّنْكِيرُ – bestimmt/unbestimmt (Bestimmtheit)',
                   'التَّذْكِيرُ وَالتَّأْنِيثُ – männlich/weiblich (Geschlecht)',
                   'الإِفْرَادُ وَالتَّثْنِيَةُ وَالْجَمْعُ – Singular/Dual/Plural (Zahl)',
                   'passt eins davon nicht, ist es kein Adjektiv mehr'] }
    ],
    zerlegung: [
      { ar: 'الطَّالِبُ', rolle: 'مَنْعُوتٌ' },
      { ar: 'الْجَدِيدُ', rolle: 'نَعْتٌ' }
    ],
    beispiele: [
      { ar: 'الطَّالِبُ الْجَدِيدُ', de: 'der neue Student — beide bestimmt, männlich, Singular, marfūʿ' },
      { ar: 'طَالِبٌ جَدِيدٌ', de: 'ein neuer Student' }
    ],
    abgrenzung: {
      ar: 'الطَّالِبُ جَدِيدٌ',
      text: 'Hier gibt es keine Naʿt-Manʿūt-Verbindung: الطَّالِبُ ist مُبْتَدَأٌ, جَدِيدٌ ist خَبَرٌ. Das erkennst du daran, dass das erste Wort bestimmt, das zweite aber unbestimmt ist.',
      hinweis: 'Im PDF steht dazu „Ein Student ist neu." Dein Lehrer sagt in Folge 19 (6:13): „ist ein Fehler. Es müsste der neu sein" — الطَّالِبُ ist bestimmt, also „Der Student ist neu".'
    },
    lehrer: [
      { zeit: '3:36', text: 'Wir hatten ja erwähnt, dass vier Merkmale über einen stimmen müssen, damit das Wort das Adjektiv wird.' },
      { zeit: '3:58', text: 'Weil eins davon nicht passt, ist es nicht mehr sein Adjektiv.' }
    ],
    quelle: { folge: '3:27–6:36', muster: 'Nr. 2, S. 2–4' },
    regeln: ['nat-vier-bedingungen-01', 'nat-bestimmtheit-01', 'nat-fem-01', 'nat-eigenname-01',
             'nat-wen-beschreibt-01', 'adjektive-an-ohne-tanwin-01', 'mubtada-khabar-01'],
    genauer: [
      { regel: 'nat-bestimmtheit-01', text: 'Aus denselben zwei Wörtern kann noch etwas Drittes werden: ändert man die Endung des zweiten Wortes, entsteht eine مُضَاف-Verbindung.' }
    ]
  },
  {
    id: 'f19-isara',
    nr: 3,
    titel: 'Ism al-išāra',
    untertitel: 'Demonstrativpronomen / Hinweiswort',
    ar: 'اِسْمُ الإِشَارَةِ',
    kern: 'هَذَا = „dieser hier" → nah · ذَلِكَ = „jener dort" → weiter entfernt.',
    gruppen: [
      { name: 'Nah',
        merkmale: ['هَذَا – dieser, m. Singular', 'هَذِهِ – diese, f. Singular',
                   'هَذَانِ – diese beiden, m.', 'هَاتَانِ – diese beiden, f.', 'هَؤُلَاءِ – diese, Plural'] },
      { name: 'Fern',
        merkmale: ['ذَلِكَ – jener', 'تِلْكَ – jene',
                   'ذَانِكَ – jene beiden, m.', 'تَانِكَ – jene beiden, f.', 'أُولَئِكَ – jene, Plural'] }
    ],
    hinweis: 'Dual und Plural stehen schon da, „lernen wir noch" (Musterlösung). Bisher im Unterricht: هَذَا und هَذِهِ für die Nähe, ذَلِكَ und تِلْكَ für die Ferne.',
    beispiele: [
      { ar: 'هَذَا كِتَابٌ.', de: '„Dies ist ein Buch."' },
      { ar: 'ذَلِكَ مَسْجِدٌ.', de: '„Jene ist eine Moschee."' }
    ],
    lehrer: [
      { zeit: '7:07', text: 'und Tilka und diese waren für die Ferne. Mehr haben wir bis jetzt nicht äh gehabt.' }
    ],
    quelle: { folge: '6:36–7:57', muster: 'Nr. 3, S. 4–5' },
    regeln: ['ismul-isara-hadha-01', 'ismul-isara-hadhihi-01', 'ismul-isara-dhalika-01', 'ismul-isara-tilka-01',
             'isara-genus-kongruenz-01', 'kaf-der-entfernung-01', 'hadha-al-kein-satz-01'],
    genauer: [
      { regel: 'ismul-isara-hadha-01', text: 'Die Nähe muss nicht räumlich sein: der Lehrer erklärt, dass der Tag der Auferstehung mit هَذَا bezeichnet wird, weil er als nah empfunden wird.' },
      { regel: 'kaf-der-entfernung-01', text: 'Das كَ am Ende von ذَلِكَ und تِلْكَ steht für die Entfernung — dasselbe كَ wie in هُنَاكَ „dort".' }
    ]
  },
  {
    id: 'f19-jarr',
    nr: 4,
    titel: 'Ḥurūf al-jarr',
    untertitel: 'Präpositionen',
    ar: 'حُرُوفُ الْجَرِّ',
    kern: 'Ein حَرْفُ جَرٍّ macht das folgende Nomen مَجْرُورًا.',
    gruppen: [
      { ar: 'حَرْفُ جَرٍّ', name: 'Ḥarf jarr', rolle: 'die Präposition',
        merkmale: ['مِنْ – aus/von', 'إِلَى – zu/nach', 'عَنْ – von/über', 'عَلَى – auf',
                   'فِي – in', 'بِ – mit/durch', 'لِ – für', 'كَ – wie'] },
      { ar: 'اِسْمٌ مَجْرُورٌ', name: 'Ism majrūr', rolle: 'das Nomen danach',
        merkmale: ['wird durch den حَرْفُ جَرٍّ مَجْرُور (Genitiv)'] }
    ],
    zerlegung: [
      { ar: 'فِي', rolle: 'حَرْفُ جَرٍّ' },
      { ar: 'الْبَيْتِ', rolle: 'اِسْمٌ مَجْرُورٌ' }
    ],
    beispiele: [
      { ar: 'الطَّالِبُ فِي الْفَصْلِ.', de: 'Der Student ist im Klassenzimmer.' },
      { ar: 'ذَهَبْتُ إِلَى الْمَسْجِدِ.', de: 'Ich ging zur Moschee.' },
      { ar: 'جِئْتُ مِنَ الْمَدْرَسَةِ.', de: 'Ich kam aus der Schule.' }
    ],
    lehrer: [
      { zeit: '8:21', text: 'und dann kam B dazu mit und dann kam Li dazu um zu sagen, dass jemanden etwas gehört.' }
    ],
    quelle: { folge: '7:57–9:56', muster: 'Nr. 4, S. 5–6' },
    regeln: ['harf-jarr-01', 'harf-jarr-name-01', 'harf-jarr-fi-ala-01', 'harf-jarr-min-ila-01', 'harf-jarr-li-01',
             'harf-jarr-bi-01', 'hurufu-jarr-bedeutungen-01', 'mina-al-01', 'tanwin-nach-harf-jarr-01',
             'li-al-lil-01', 'lil-vs-li-01', 'li-eigenname-01', 'li-mit-suffix-01'],
    genauer: [
      { regel: 'hurufu-jarr-bedeutungen-01', text: 'Was die Präpositionen bedeuten, nach Sharḥ Madīnah: مِنْ den Anfang · إِلَى das Ende · فِي das Enthaltensein · عَلَى das Daraufsein · لِ den Besitz.' },
      { regel: 'mina-al-01', text: 'Warum im dritten Beispiel مِنَ steht und nicht مِنْ: Sukun trifft Sukun.' }
    ]
  },
  {
    id: 'f19-tanith',
    nr: 5,
    titel: 'Taʾnīṯ',
    untertitel: 'Weiblichkeit',
    ar: 'التَّأْنِيثُ',
    kern: 'Das häufigste Zeichen für ein weibliches Wort ist ة – التَّاءُ الْمَرْبُوطَةُ, z. B. طَالِبَةٌ – Studentin.',
    gruppen: [
      { name: 'Mit Zeichen',
        merkmale: ['ة – التَّاءُ الْمَرْبُوطَةُ: طَالِبَةٌ – Studentin', 'ـاء wie حَمْرَاءُ', 'ى wie كُبْرَى'] },
      { name: 'Ohne Zeichen',
        merkmale: ['grammatisch feminin, obwohl kein sichtbares Femininzeichen: أُمٌّ – Mutter · بِنْتٌ – Mädchen/Tochter · شَمْسٌ – Sonne',
                   'Körperteile, die doppelt auftreten, sind weiblich'] },
      { name: 'Maskulin → Feminin',
        merkmale: ['häufig durch ة: مُسْلِمٌ → مُسْلِمَةٌ · طَالِبٌ → طَالِبَةٌ · مُدَرِّسٌ → مُدَرِّسَةٌ',
                   'das Adjektiv muss sich anpassen: طَالِبٌ جَدِيدٌ – ein neuer Student, aber طَالِبَةٌ جَدِيدَةٌ – eine neue Studentin'] }
    ],
    beispiele: [
      { ar: 'طَالِبَةٌ', de: 'Studentin' },
      { ar: 'مُدَرِّسَةٌ', de: 'Lehrerin' },
      { ar: 'سَيَّارَةٌ', de: 'Auto' },
      { ar: 'مَدْرَسَةٌ', de: 'Schule' }
    ],
    lehrer: [
      { zeit: '12:36', text: 'Ja, Körperteile, die doppelt auftreten, sind weiblich.' },
      { zeit: '12:45', text: 'oder es gibt einfach Wörter, die sind einfach so' }
    ],
    quelle: { folge: '9:59–12:48', muster: 'Nr. 5, S. 7–8' },
    regeln: ['ta-marbuta-fem-01', 'fem-bildung-01', 'fem-ohne-ta-marbuta-01', 'koerperteile-genus-01',
             'ta-marbuta-grenzen-01', 'tanwin-maennername-ta-01', 'eigennamen-fem-ohne-tanwin-01',
             'nat-fem-01', 'mutabaqa-genus-01', 'mubtada-khabar-genus-01'],
    genauer: [
      { regel: 'ta-marbuta-grenzen-01', text: 'Nicht jedes Wort lässt sich mit ة weiblich machen: aus طَائِر (Vogel) würde طَائِرَة (Flugzeug).' },
      { regel: 'fem-ohne-ta-marbuta-01', text: 'Drei Gruppen: mit Tāʾ marbūṭa, von der Bedeutung her weiblich (Tochter, Mutter, Tante) und solche ohne erkennbaren Grund, z. B. اَلنَّار – das Feuer.' },
      { regel: 'fem-bildung-01', text: 'Der Handgriff in den Worten des Lehrers: auf den ursprünglichen letzten Buchstaben kommt ein Fatḥa, dann das Tāʾ marbūṭa.' }
    ]
  },
  {
    id: 'f19-schams',
    nr: 6,
    titel: 'Sonnen- und Mondbuchstaben',
    untertitel: 'ال und die Aussprache',
    ar: 'ال',
    kern: 'Beim Mondbuchstaben wird das ل ausgesprochen. Beim Sonnenbuchstaben wird das ل nicht ausgesprochen; der folgende Buchstabe wird verdoppelt.',
    gruppen: [
      { ar: 'الحُرُوفُ الشَّمْسِيَّةُ', name: 'Sonnenbuchstaben', rolle: '14',
        merkmale: ['ت ث د ذ ر ز س ش ص ض ط ظ ل ن',
                   'das ل wird nicht ausgesprochen: الشَّمْسُ – aš-šamsu, nicht al-šamsu'] },
      { ar: 'الحُرُوفُ الْقَمَرِيَّةُ', name: 'Mondbuchstaben', rolle: '14',
        merkmale: ['أ ب ج ح خ ع غ ف ق ك م ه و ي',
                   'das ل wird ausgesprochen: الْقَمَرُ'] }
    ],
    hinweis: 'Zuerst muss das Wort bestimmt sein: كِتَابٌ = ein Buch → unbestimmt · الْكِتَابُ = das Buch → bestimmt. Merkhilfe: Ist ein Nomen bestimmt und trägt der erste Buchstabe nach dem Artikel ein Shadda, so ist dieser Buchstabe ein Sonnenbuchstabe.',
    beispiele: [
      { ar: 'الشَّمْسُ', de: 'aš-šamsu — Sonnenbuchstabe' },
      { ar: 'الْقَمَرُ', de: 'al-qamaru — Mondbuchstabe' }
    ],
    lehrer: [
      { zeit: '13:16', text: 'muss das Wort bestimmt sein, sonst erkennen wir das gar nicht.' },
      { zeit: '14:03', text: 'Und ein Trick dazu ist das Schedder, wenn ein Wort bestimmt ist.' }
    ],
    quelle: { folge: '12:48–14:45', muster: 'Nr. 6, S. 8–9' },
    regeln: ['schams-qamar-01', 'schams-qamar-merkhilfe-01', 'al-gesamtheit-01', 'nakira-marifa-01',
             'al-tanwin-tilgung-01', 'hamzatul-wasl-01'],
    genauer: [
      { regel: 'schams-qamar-merkhilfe-01', text: 'Die Namen erklären sich selbst: اَلْقَمَر beginnt mit einem Mondbuchstaben, اَلشَّمْس mit einem Sonnenbuchstaben.' },
      { regel: 'schams-qamar-01', text: 'Der Lehrer betont: auswendig lernen muss man die Buchstaben nicht — es reicht zu schauen, ob nach dem اَلْ ein Schadda steht. Im Koran steht es genauso.' }
    ]
  },
  {
    id: 'f19-pronomen',
    nr: 7,
    titel: 'Pronomen',
    untertitel: 'Personalpronomen',
    ar: 'الضَّمَائِرُ',
    kern: 'هُوَ = er · هِيَ = sie — und alle übrigen Personalpronomen, geordnet wie bei der Verbkonjugation.',
    gruppen: [
      { name: '3. Person',
        merkmale: ['هُوَ – er', 'هِيَ – sie', 'هُمَا – die beiden', 'هُمْ – sie (m.)', 'هُنَّ – sie (f.)'] },
      { name: '2. Person',
        merkmale: ['أَنْتَ – du (m.)', 'أَنْتِ – du (f.)', 'أَنْتُمَا – ihr beide', 'أَنْتُمْ – ihr (m.)', 'أَنْتُنَّ – ihr (f.)'] },
      { name: '1. Person',
        merkmale: ['أَنَا – ich', 'نَحْنُ – wir'] }
    ],
    hinweis: 'Die Musterlösung hat zwölf Zeilen, der Lehrer zählt vierzehn („3 6 9 12 14"): هُمَا und أَنْتُمَا stehen je für beide Geschlechter.',
    beispiele: [
      { ar: 'هُوَ طَالِبٌ.', de: 'Er ist Student.' },
      { ar: 'هِيَ طَالِبَةٌ.', de: 'Sie ist Studentin.' }
    ],
    lehrer: [
      { zeit: '15:15', text: 'wie man Werben konjugiert und da haben wir auch bei die ganzen Pron erwähnt und haben wir so eine Art Dreie Muster erwähnt.' }
    ],
    quelle: { folge: '14:48–15:59', muster: 'Nr. 7, S. 9–10' },
    regeln: ['huwa-hiya-01', 'huwa-hiya-weitere-01', 'verb-enthaelt-pronomen-01', 'verb-madi-endungen-01',
             'possessiv-endungen-01'],
    genauer: [
      { regel: 'verb-madi-endungen-01', text: 'Dieselben vierzehn Pronomen ordnen die Endungen der Vergangenheit; bei der 2. Person steckt die Endung schon im Pronomen: أَنْتَ → ـْتَ.' }
    ]
  },
  {
    id: 'f19-irab',
    nr: 8,
    titel: 'Iʿrāb',
    untertitel: 'die Fälle',
    ar: 'الإِعْرَاب',
    kern: 'Die Endung zeigt häufig die grammatische Funktion eines Nomens im Satz.',
    gruppen: [
      { ar: 'الرَّفْعُ', name: 'Nominativ', merkmale: ['طَالِبٌ → مرفوع'] },
      { ar: 'النَّصْبُ', name: 'Akkusativ', merkmale: ['طَالِبًا → منصوب'] },
      { ar: 'الْجَرُّ', name: 'Genitiv', merkmale: ['طَالِبٍ → مجرور'] }
    ],
    hinweis: 'Haben Wörter immer Tanwīn? Nein: طَالِبٌ – mit Tanwīn, aber الطَّالِبُ – kein Tanwīn wegen ال. Auch ein مُضَاف bekommt kein Tanwīn: كِتَابُ الطَّالِبِ.',
    beispiele: [
      { ar: 'كِتَابُ الطَّالِبِ', de: 'kein Tanwīn am مُضَاف' }
    ],
    lehrer: [
      { zeit: '16:25', text: 'haben wir immer Tanoin? Nein, haben sie nicht.' },
      { zeit: '16:34', text: 'hatten Marfu, der Hauptfall hatten wir Majrur und wir hatten Manzub.' }
    ],
    quelle: { folge: '16:06–16:43', muster: 'Nr. 8, S. 11–12' },
    regeln: ['irab-drei-faelle-01', 'marfu-grundfall-01', 'al-tanwin-tilgung-01', 'tanwin-eigennamen-01',
             'tanwin-nach-harf-jarr-01', 'mamnu-min-as-sarf-01', 'eigennamen-fem-ohne-tanwin-01',
             'adjektive-an-ohne-tanwin-01'],
    genauer: [
      { regel: 'irab-drei-faelle-01', text: 'Das Arabische hat vier Fälle; drei davon werden zuerst gebraucht. Die Grundzeichen: Damma für مَرْفُوع, Kasra für مَجْرُور, Fatha für مَنْصُوب.' }
    ]
  },
  {
    id: 'f19-fragen',
    nr: 9,
    titel: 'Fragewörter',
    untertitel: 'Frage und Fragesatz',
    ar: 'أَدَوَاتُ الِاسْتِفْهَامِ',
    kern: 'Eine Ja/Nein-Frage beginnt mit هَلْ oder mit der Frage-Hamza; die übrigen Fragewörter fragen nach etwas Bestimmtem.',
    gruppen: [
      { name: 'Ja/Nein-Frage',
        merkmale: ['هَلْ أَنْتَ طَالِبٌ؟ – „Bist du Student?"', 'أَأَنْتَ طَالِبٌ؟ – mit der Frage-Hamza'] },
      { name: 'Fragewörter',
        merkmale: ['مَنْ – wer?', 'مَا – was?', 'مَاذَا – was?', 'أَيْنَ – wo?', 'مِنْ أَيْنَ – woher?',
                   'إِلَى أَيْنَ – wohin?', 'كَيْفَ – wie?', 'كَمْ – wie viele?', 'مَتَى – wann?',
                   'لِمَاذَا – warum?', 'أَيٌّ – welcher?'] }
    ],
    beispiele: [
      { ar: 'مَنْ هَذَا؟', de: 'Wer ist das?' },
      { ar: 'مَا هَذَا؟', de: 'Was ist das?' },
      { ar: 'أَيْنَ الْكِتَابُ؟', de: 'Wo ist das Buch?' },
      { ar: 'مِنْ أَيْنَ أَنْتَ؟', de: 'Woher kommst du?' },
      { ar: 'إِلَى أَيْنَ ذَهَبَ مُحَمَّدٌ؟', de: 'Wohin ging Muḥammad?' },
      { ar: 'كَيْفَ حَالُكَ؟', de: 'Wie geht es dir?' },
      { ar: 'كَمْ طَالِبًا فِي الْفَصْلِ؟', de: 'Wie viele Studenten sind im Klassenzimmer?' },
      { ar: 'مَتَى ذَهَبْتَ؟', de: 'Wann bist du gegangen?' },
      { ar: 'لِمَاذَا ذَهَبْتَ؟', de: 'Warum bist du gegangen?' },
      { ar: 'أَيُّ كِتَابٍ قَرَأْتَ؟', de: 'Welches Buch hast du gelesen?' },
      { ar: 'هَلْ أَنْتَ مُدَرِّسٌ؟', de: 'Bist du Lehrer?' }
    ],
    lehrer: [
      { zeit: '17:02', text: 'Elif eher rhetorisch im Allgemein und hell für Entscheidungsfragen.' }
    ],
    quelle: { folge: '16:45–17:36', muster: 'Nr. 9, S. 12–13' },
    regeln: ['istifham-uebersicht-01', 'fragepartikel-alif-01', 'fragepartikel-hal-01', 'fragepartikel-erforderlich-01',
             'istifham-men-01', 'istifham-ma-01', 'istifham-ayna-01', 'istifham-madha-01', 'istifham-liman-01',
             'min-ayna-01', 'min-man-unterscheiden-01'],
    genauer: [
      { regel: 'fragepartikel-alif-01', text: 'أَ kann beides; „eher rhetorisch" ist eine Vereinfachung, um es von هَلْ zu unterscheiden. In Lektion 1 des Buchs kommt هَلْ gar nicht vor.' },
      { regel: 'istifham-uebersicht-01', text: 'Die Regel sagt: „Für wohin gibt es kein eigenes Wort: أَيْنَ deckt es mit ab." Die Musterlösung nennt dafür إِلَى أَيْنَ — und zusätzlich مَاذَا und أَيٌّ.' }
    ]
  }
];

/* ---------- Entwürfe für bessere Fassungen (11.09.2026) ----------

   Elias im Satzmodus-Export vom 11.09.2026 zu verb-madi-endungen-01: „hier
   muss man wirklich eine gute regel draus machen weil das komlex ist, man muss
   gucken wie man das widergibt". Das Goal dazu: „gute Fassung als Entwurf,
   alte bleibt".

   ⛔ EIN ENTWURF ERSETZT NICHTS. grammar-data.js bleibt unverändert; die Karte
   zeigt den Entwurf daneben, und erst SEIN Tipp auf „als meine Fassung
   übernehmen" macht ihn zu seiner Fassung — mit dem Original einen Tipp
   entfernt, zurücksetzbar. [[schweigen_ist_kein_auftrag]]

   ⚠️ Kein neuer Inhalt: jede Aussage und jedes arabische Wort steht schon in
   der Regel selbst (Folge 18). Neu ist nur die Form — die vierzehn Formen als
   Tabelle statt als Fließtext, der Kern vorneweg. pruefe-regelsammlung.mjs
   hält das Arabisch gegen den Bestand. */
const REGEL_ENTWUERFE = {
  'verb-madi-endungen-01': {
    vom: '2026-09-11',
    anlass: 'hier muss man wirklich eine gute regel draus machen weil das komlex ist, man muss gucken wie man das widergibt',
    name: 'Die Vergangenheit (اَلْمَاضِي): gleicher Stamm, andere Endung',
    kern: 'Im اَلْمَاضِي bleibt der Stamm gleich — nur die Endung sagt, WER es getan hat. Vierzehn Pronomen, dreizehn verschiedene Formen.',
    tabelle: {
      kopf: ['', 'Singular', 'Dual', 'Plural'],
      zeilen: [
        ['3. Person m.', 'هُوَ ذَهَبَ', 'هُمَا ذَهَبَا', 'هُمْ ذَهَبُوا'],
        ['3. Person w.', 'هِيَ ذَهَبَتْ', 'هُمَا ذَهَبَتَا', 'هُنَّ ذَهَبْنَ'],
        ['2. Person m.', 'أَنْتَ ذَهَبْتَ', 'أَنْتُمَا ذَهَبْتُمَا', 'أَنْتُمْ ذَهَبْتُمْ'],
        ['2. Person w.', 'أَنْتِ ذَهَبْتِ', 'أَنْتُمَا ذَهَبْتُمَا', 'أَنْتُنَّ ذَهَبْتُنَّ']
      ],
      /* ⚠️ Die erste Person steht NICHT in der Tabelle: sie hat nur zwei
         Formen, und in welche Spalte نَحْنُ gehört, sagt die Regel nicht —
         eine Zelle dafür wäre eine Behauptung. Also wörtlich wie in der Regel,
         unter der Tabelle (4 × 3 + 2 = vierzehn). */
      hinweis: '1. Person — nur zwei Formen: أَنَا ذَهَبْتُ · نَحْنُ ذَهَبْنَا'
    },
    merksaetze: [
      '**2. Person — die Endung steckt schon im Pronomen:** أَنْتَ → ـْتَ · أَنْتُمْ → ـْتُمْ · أَنْتُنَّ → ـْتُنَّ.',
      '**3. Person — da hilft das nicht:** هُوَ hat gar keine Endung, هُمْ bekommt ـُوا.',
      '**Stolperstelle:** أَنْتُمَا ذَهَبْتُمَا ist für Männer und Frauen gleich, bei der 3. Person nicht (ذَهَبَا gegen ذَهَبَتَا) — deshalb vierzehn Pronomen, aber dreizehn Formen.',
      'Dein Lehrer (Folge 18): „Das ist wie ein Baukasten. Wir müssen die nur zusammenbauen."'
    ]
  }
};

/* ---------- Seine Inhalts-Urteile aus dem Regelprüfungs-Artefakt ----------

   Wortgetreu aus „Regelprüfung-Export 26.08.2026.md" (Vault), erzeugt am
   11.09.2026 mit einem Leseskript — nicht abgetippt. Die Notizen stehen in
   seiner Schreibweise, auch mit Tippfehlern: ein korrigiertes Zitat ist nicht
   mehr auffindbar.

   Was daraus in der Sammlung wird (Goal, Punkt 3):
     passt, aendern, nie beurteilt   stehen in der Liste
     streichen                       verborgen, mit einem Tipp wiederherstellbar

   ⛔ „Streichen" hieß auf seiner Seite: nicht mehr als Erklärung beim Lernen
   der Vokabel einblenden — also „kenne ich", nicht „falsch". Seine Notiz bei
   schams-qamar-01 gilt ausdrücklich für alle: „diese und all die anderen
   regeln sollen nicht gelöscht werden, nur aus der app raus genommen werden
   weil ich sie bereits kenne oder unnötig sind". Deshalb VERBORGEN, nie weg.

   ⚠️ Das Artefakt bleibt (Elias, 11.09.2026, 04:08: „artefakt soll da
   bleiben"). Diese Liste ist ein STAND, keine zweite Wahrheit: sie ändert
   sich nur durch einen neuen Export von ihm. */
const REGELPRUEFUNG_26_08 = {
  vom: '2026-08-26T03:34:02+02:00',
  passt: {
    'ismul-isara-hadha-01': '',
    'fragepartikel-alif-01': '',
    'istifham-men-01': '',
    'ismul-isara-dhalika-01': '',
    'al-tanwin-tilgung-01': '',
    'harf-jarr-01': '',
    'harf-jarr-fi-ala-01': 'erklärt nicht die regel',
    'tanwin-eigennamen-01': '',
    'tanwin-nach-harf-jarr-01': '',
    'mina-al-01': '',
    'iltiqa-sakinain-01': '',
    'hurufu-jarr-bedeutungen-01': 'das ist gut',
    'mudaf-01': '',
    'mudaf-ilayh-01': 'sollte die regel noch etwas ausführlicher zeigen',
    'ya-nida-01': 'es sollen andere beispielnamen genommen werden.',
    'mudaf-ohne-al-01': 'ich weiß nicht ob das so genau stimmt, müsste man nochmals nachgucken voralllem gibt es mehrere von diesen regeln die ähnlich sind. ansonsten müsste es okay sein aber ist auch so ein kandidat den man verschmelzen kann mit den anderen',
    'harf-jarr-idafa-01': 'erklärt nicht die regel so wirklich.',
    'zarf-01': '',
    'idafa-erkennen-01': 'muss auch vielleicht verschmolzen werden und oder die regel noch etwas preziser oder ausgeschmückter gezeigt werden',
    'zarf-als-mudaf-01': '',
    'idafa-kein-adjektiv-01': '',
    'idafa-verkettung-01': 'könnte auch verschmolzen werden',
    'istifham-liman-01': '',
    'mutabaqa-genus-01': '',
    'fem-ohne-ta-marbuta-01': '',
    'koerperteile-genus-01': '',
    'mubtada-khabar-genus-01': ''
  },
  aendern: {
    'mubtada-khabar-01': 'die regel erklärt in seiner kurzform irgendwie nichts. außerdem glaube ich das die regel später nach kapitel 9 erwähnt wird dementsprechend glaube ich braucht man das hier nicht sollte später tatsächlich noch die regel auftauchen die sie besser erklärt oder richtig erklärt.',
    'harf-jarr-min-ila-01': 'erklärt nicht die regel',
    'verb-enthaelt-pronomen-01': 'erklärt nicht die regel',
    'alif-maqsura-01': 'erklärt nicht die regel. ,,Ein ى am Wortende ohne Punkte ist kein Ya, sondern eine أَلِف مَقْصورة alif maqṣūra" bis dahin ist noch okay aber danach fehlt halt die regel so',
    'idafa-01': 'erklärt nicht die regel'
  },
  streichen: {
    'hadha-stummes-alif-01': '',
    'hadha-dies-nicht-das-01': '',
    'ta-marbuta-fem-01': '',
    'nominalsatz-ohne-kopula-01': '',
    'istifham-ma-01': '',
    'fragepartikel-hal-01': '',
    'mudarris-lesung-herkunft-01': '',
    'hamzatul-wasl-01': '',
    'satz-vs-wortgruppe-01': '',
    'schams-qamar-01': 'diese und all die anderen regeln sollen nicht gelöscht werden, nur aus der app raus genommen werden weil ich sie bereits kenne oder unnötig sind',
    'madd-tabii-01': 'diese sachen können auch noch im satzmodus gerne bleiben auch das mit sonne und mond aber nicht bei den karteikarten als erklärung',
    'schams-qamar-merkhilfe-01': '',
    'schakl-01': '',
    'al-gesamtheit-01': '',
    'nakira-marifa-01': '',
    'jumla-ismiya-filiya-01': '',
    'wortstellung-fokus-01': '',
    'irab-drei-faelle-01': '',
    'marfu-grundfall-01': '',
    'fragepartikel-erforderlich-01': '',
    'istifham-ayna-01': 'das erklärt keine neue grammatik oder satzregel. es sagt nur die übersetzung davon',
    'huwa-hiya-01': 'das erklärt keine neue grammatik oder satzregel. es sagt nur die übersetzung davon',
    'min-ayna-01': '',
    'min-man-unterscheiden-01': '',
    'istifham-madha-01': '',
    'lafz-al-jalala-01': '',
    'wortarten-01': '',
    'idafa-zweitglied-01': '',
    'ismul-isara-hadhihi-01': '',
    'hadha-al-kein-satz-01': '',
    'taschkil-kontext-01': '',
    'li-vs-inda-01': ''
  }
};
