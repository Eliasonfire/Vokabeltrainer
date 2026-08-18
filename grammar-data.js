/* ===================== GRAMMAR DATA ===================== */
/* Grammatikregeln, kuratiert aus den Arabic-Roots-Unterrichtsaufzeichnungen
   (Folge 01-13, get_recordings via arabicroots-MCP). Jede Regel gibt exakt
   nur wieder, was der Lehrer im Video erklaert hat - keine ergaenzten/erfundenen
   Regeln. Quelle (Folge, ungefaehrer Zeitstempel, Kapitel) ist Pflichtangabe,
   analog zu den geprueften Quran-Zitaten in vocab-data.js.

   Stand 27.07.2026: Alle 13 Folgen ausgewertet (vorher nur 01-02). Grundlage
   sind (a) die YouTube-Untertitel, (b) eine Nachtranskription der Regelstellen
   mit Whisper large-v3-turbo und (c) die Standbilder der Buchseiten samt der
   roten Anmerkungen des Lehrers. Jede Regel wurde einzeln gegen den Rohtext
   geprueft; wo die Erklaerung ueber das Gesagte hinausging, wurde sie auf das
   Belegte zurueckgestutzt.

   Rohmaterial (Audit-Grundlage) liegt lokal und NICHT im Git:
     transcripts/raw/       YouTube-Untertitel je Folge
     transcripts/whisper/   Nachtranskription der Regelstellen
     G:\1. Workspace\Arabicroots-Material\  Video und Ton
   Kursmaterial-Disclaimer verbietet die Weitergabe. */

const GRAMMAR_RULES = [
  {
    id: "ismul-isara-hadha-01",
    name: "هَذَا (dies)",
    shortExplanation: "هَذَا (hadha) ist ein اسْمُ الْإِشَارَة (Hinweiswort/Demonstrativpronomen). Es wird für das benutzt, was (a) in der Nähe ist und (b) männlich – nicht für weibliche Wörter, dafür steht هَذِهِ. Menschen und Dinge gleichermaßen: Sharḥ Madīnah S. 3 definiert es als لِلْمُفْرَدِ الْمُذَكَّرِ الْقَرِيبِ الْعَاقِلِ، وَغَيْرِ الْعَاقِلِ – für das männliche Einzelne in der Nähe, ob vernunftbegabt oder nicht. Die Nähe muss nicht räumlich sein: der Lehrer erklärt am Beispiel يَوْمُ الْقِيامَة (der Tag der Auferstehung), dass dieser Tag im Koran mit هَذَا bezeichnet wird und nicht mit ذَلِكَ (jenes) – weil er als nah empfunden wird, nicht als fern.",
    color: "mubtada",
    source: { folge: 1, video: "Folge 01", approxTimestamp: "10:07", chapter: 1 },
    source2: { schluessel: 1, lektion: 1, seite: 3 }
  },
  {
    id: "hadha-stummes-alif-01",
    name: "هَذَا (Alif wird gesprochen, nicht geschrieben)",
    shortExplanation: "In هَذَا steckt ein Alif, das man nicht mitschreibt, das aber trotzdem ausgesprochen wird. Deshalb spricht man das Wort lang: hādhā. Beim Vorlesen wird entsprechend korrigiert: هَذَا „schön lang machen\" – er zeigt dabei auf zwei Alif im Wort und sagt, die beiden dürfen nicht vergessen werden. Beispiel aus der Übung: هَذَا بَيْتٌ (hādhā baytun) – „Dies ist ein Haus\".",
    color: "other",
    source: { folge: 1, video: "Folge 01", approxTimestamp: "10:30", chapter: 1 },
    source2: { schluessel: 1, lektion: 1, seite: 6 }
  },
  {
    id: "hadha-dies-nicht-das-01",
    name: "هَذَا (dies – nicht „das\")",
    shortExplanation: "هَذَا übersetzt man mit „dies\", nicht mit „das\": هَذَا بَيْتٌ (hādhā baytun) heißt „Dies ist ein Haus\", nicht „das Haus\". „Das\" wäre der bestimmte Artikel, und der kommt erst später dran. Die Wörter in Kapitel 1 sind alle noch unbestimmt, also بَيْتٌ = „ein Haus\", مَسْجِدٌ (masjidun) = „eine Moschee\".",
    color: "other",
    source: { folge: 1, video: "Folge 01", approxTimestamp: "13:57", chapter: 1 },
    source2: { schluessel: 1, lektion: 1, seite: 6 }
  },
  {
    id: "ta-marbuta-fem-01",
    name: "تاء مربوطة (weibliche Endung)",
    shortExplanation: "Die تاء مربوطة (das ة am Wortende, geschrieben wie ein Kreis mit zwei Punkten) wird für Wörter benutzt, die weiblich sind. Wenn ein Wort ein ة hat, weißt du: das Wort ist weiblich – z.B. مَدْرَسَةٌ (madrasatun) „Schule“. بَيْتٌ (baytun) „Haus“ wird dagegen mit normalem ت geschrieben und ist männlich. (Umgekehrt gilt bei بَيْت NICHT, dass jedes Wort mit normalem ت männlich sei, sagt der Lehrer nicht.)",
    color: "fem",
    source: { folge: 1, video: "Folge 01", approxTimestamp: "15:17", chapter: 1 },
    source2: { schluessel: 1, lektion: 6, seite: 22 },
    /* Von Elias am 29.07.2026 abbestellt: "Die Regel für weibliche Endungen
       brauche ich nicht. Ta marbuta ist ja schon als Zeichen genug um das fest
       zu stellen."

       Der Eintrag bleibt trotzdem stehen, und das ist Absicht: Er ist aus
       Folge 01 belegt und steht so auch im Madina-Schluessel 1, Lektion 6.
       Der Beleg wird nicht dadurch falsch, dass Elias die Regel nicht mehr
       angezeigt bekommen will - und geloescht waere er beim Regel-Durchgang,
       den er sich noch vorbehalten hat, unauffindbar.

       Was `ausgeblendet` bewirkt: die 8 Markierungen dieser Regel werden in
       Saetzen nicht mehr unterstrichen (js/saetze.js, buildSentenceHtml).
       Rueckgaengig zu machen, indem diese eine Zeile entfernt wird. */
    ausgeblendet: true
  },
  {
    id: "nominalsatz-ohne-kopula-01",
    name: "هَذَا بَيْتٌ (Satz ohne „ist\")",
    shortExplanation: "Im Arabischen gibt es kein Wort für „ist\" – man muss es sich beim Übersetzen selbst dazudenken. مَا heißt „was\" und هَذَا heißt „dies\", zusammen مَا هَذَا؟ (mā hādhā) also „Was ist dies?\". Genauso ist هَذَا بَيْتٌ (hādhā baytun) „Dies ist ein Haus\", obwohl im Arabischen kein „ist\" dasteht.",
    color: "mubtada",
    source: { folge: 1, video: "Folge 01", approxTimestamp: "20:28", chapter: 1 },
    source2: { schluessel: 1, lektion: 1, seite: 6 }
  },
  {
    id: "istifham-ma-01",
    name: "مَا (Fragewort für Dinge)",
    shortExplanation: "Mit مَا (mā, „was\") fragt man nach Gegenständen und Objekten: مَا هَذَا؟ (mā hādhā) – „Was ist dies?\". Die Antwort ist z.B. هَذَا بَيْتٌ (hādhā baytun) – „Dies ist ein Haus\". مَا benutzt man nicht für Menschen, sondern nur für Dinge.",
    color: "nasab",
    source: { folge: 1, video: "Folge 01", approxTimestamp: "22:05", chapter: 1 },
    source2: { schluessel: 1, lektion: 1, seite: 6 }
  },
  {
    id: "fragepartikel-alif-01",
    name: "أَ (Fragepartikel)",
    shortExplanation: "Ein أَ vor einen vollständigen Satz gestellt macht aus einer Aussage eine Frage. Zuerst und vor allem ist es eine Ja/Nein-Frage — der Madina-Schlüssel zeigt es in Lektion 1 genau so: أَهَذَا بَيْتٌ؟ „Ist dies ein Haus?\", Antwort نَعَمْ، هَذَا بَيْتٌ. „Ja, dies ist ein Haus.\" oder لَا، هَذَا مَسْجِدٌ. „Nein, dies ist eine Moschee.\" Die Wörterliste des Schlüssels sagt dasselbe: أَ steht vor Entscheidungsfragen, direkt vor dem Folgewort. Dein Lehrer stellt أَ zusätzlich dem هَلْ gegenüber und ordnet أَ dabei eher der allgemeinen oder rhetorischen Frage zu — das ist eine Vereinfachung zur Unterscheidung der beiden Partikeln, kein Widerspruch: أَ kann beides, und darüber hinaus in Alternativfragen mit أَمْ stehen. هَلْ kommt in Lektion 1 des Buchs gar nicht vor, es ist eine Ergänzung des Unterrichts.",
    color: "nasab",
    source: { folge: 1, video: "Folge 01", approxTimestamp: "22:48", chapter: 1 },
    source2: { schluessel: 1, lektion: 1, seite: 7 }
  },
  {
    id: "fragepartikel-hal-01",
    name: "هَلْ (Fragepartikel für Entscheidungsfragen)",
    shortExplanation: "Es gibt im Arabischen zwei Fragepartikeln: أَ und هَلْ. هَلْ (hal) stellt man vor eine fertige Aussage und macht daraus eine Ja-Nein-Frage: هَلْ هَذَا بَيْتٌ؟ (hal hādhā baytun) – „Ist dies ein Haus?\". Auf هَلْ kann man nur mit ja oder nein antworten, deshalb ist هَلْ für Entscheidungsfragen. Beispiel des Lehrers aus dem Koran: هَلْ أَتاكَ حَديثُ مُوسى (hal atāka ḥadīthu mūsā) – „Kam zu dir die Geschichte von Musa?\"; darauf antwortet man نَعَمْ (naʿam) – „ja\". أَ dagegen wird eher für rhetorische Fragen benutzt, auf die man auch anders antworten kann – der Lehrer nimmt als Beispiel eine Frage vom Typ „ist dem nicht so?\", auf die man „doch\", „nein\" oder „ich weiß nicht\" sagen kann.",
    color: "nasab",
    source: { folge: 1, video: "Folge 01", approxTimestamp: "23:57", chapter: 1 }
  },
  {
    id: "istifham-men-01",
    name: "مَنْ (wer)",
    shortExplanation: "مَنْ (men) ist das Fragewort für Personen (\"wer ist dies?\"), im Unterschied zu هَذَا/Fragen nach Gegenständen. Nicht verwechseln mit مِنْ (min, \"von\") - men hat Fatha, min hat Sukun.",
    color: "nasab",
    source: { folge: 2, video: "Folge 02", approxTimestamp: "2:11", chapter: 2 },
    source2: { schluessel: 1, lektion: 1, seite: 6 }
  },
  {
    id: "ismul-isara-dhalika-01",
    name: "ذَلِكَ (jenes)",
    shortExplanation: "ذَلِكَ (dhalika) ist wie هَذَا ein اسْمُ الْإِشَارَة (Hinweiswort), aber für Dinge in der Ferne statt in der Nähe. Gilt ebenfalls nur für männliche Wörter. Kann auch auf zuvor Erwähntes zurückverweisen, nicht nur auf räumlich Entferntes.",
    color: "mubtada",
    source: { folge: 2, video: "Folge 02", approxTimestamp: "20:07", chapter: 2 },
    source2: { schluessel: 1, lektion: 2, seite: 8 }
  },
  {
    id: "hamzatul-wasl-01",
    name: "هَمْزَةُ الوَصْل (Verbindungs-Alif)",
    shortExplanation: "هَمْزَةُ الوَصْل (Hamzatu l-waṣl), das Verbindungs-Alif, wird auf zwei Weisen gelesen. Bleibst du bei ihm stehen, liest du es wie ein ganz normales Alif. Liest du weiter, überspringst du es. Beispiel: الْكِتَابُ جَدِيدٌ وَالْقَلَمُ قَدِيمٌ (al-kitābu jadīdun wa-l-qalamu qadīmun) – „Das Buch ist neu und der Stift ist alt.“ Hier wird nicht gestoppt, sondern verbunden: die Araber seien faul, sie mögen das Stoppen nicht und verbinden lieber.",
    color: "other",
    source: { folge: 2, video: "Folge 02", approxTimestamp: "38:24", chapter: 3 },
    source2: { schluessel: 1, lektion: 3, seite: 10 }
  },
  {
    id: "satz-vs-wortgruppe-01",
    name: "الْقَمِيصُ نَظِيفٌ (Satz, nicht Wortgruppe)",
    shortExplanation: "Ein Satz wie الْقَمِيصُ نَظِيفٌ heißt „Das Hemd ist sauber“ – und nicht „das saubere Hemd“. Der Lehrer besteht darauf: Das sind zwei verschiedene Sachen, da müssen wir genau sein. Wie man „das saubere Hemd“ schreibt, ist eine andere Regel und kommt erst in einer späteren Lektion.",
    color: "mubtada",
    source: { folge: 2, video: "Folge 02", approxTimestamp: "46:05", chapter: 3 },
    source2: { schluessel: 1, lektion: 8, seite: 27 }
  },
  {
    id: "mubtada-khabar-01",
    name: "مُبْتَدَأ وخَبَر (Subjekt und Aussage)",
    shortExplanation: "Die beiden Begriffe kommen hier zunächst nur als Vorgeschmack (\"erstmal nicht viel damit machen, sondern erstmal nur wissen\"). خَبَر (khabar) ist die Information über das Nomen – in den Übungen das ergänzte Wort, z.B. جَديدٌ (dschadīdun, neu). مُبْتَدَأ (mubtadaʾ) ist das Subjekt, also das, worum es im Satz geht, z.B. اَلْمُدَرِّسُ (al-mudarrisu, der Lehrer). Zusammen: اَلْمُدَرِّسُ جَديدٌ – der Lehrer ist neu.",
    color: "mubtada",
    source: { folge: 3, video: "Folge 03", approxTimestamp: "13:57", chapter: 3 },
    source2: { schluessel: 2, lektion: 1, seite: 5 }
  },
  {
    id: "schams-qamar-01",
    name: "حُروف شَمْسِيّة وقَمَرِيّة (Sonnen- & Mondbuchstaben)",
    shortExplanation: "Von den 28 arabischen Buchstaben (die Hamza nicht mitgezählt) sind 14 Sonnenbuchstaben und 14 Mondbuchstaben – genau Hälfte/Hälfte. Die Regel gilt nur bei bestimmten Wörtern, also nur wenn اَلْ davorsteht. Beim Mondbuchstaben liest man das لْ ganz normal mit: بَيْتٌ (baytun, ein Haus) wird zu اَلْبَيْتُ (al-baytu, das Haus). Beim Sonnenbuchstaben steht ein Schadda auf dem ersten Buchstaben und das Lam wird übersprungen: نَجْمٌ (nadschmun) wird zu اَلنَّجْمُ (an-nadschmu) – nicht „al-nadschmu\". Genauso macht es der Lehrer an اَلرَّجُلُ (ar-radschulu) vor: „nicht al-radschulu, sondern ar-radschulu\", dazu اَلطَّالِبُ (aṭ-ṭālibu, der Student) und اَلدِّيكُ (ad-dīku). Er betont: Man muss die Buchstaben nicht auswendig lernen, sondern nur schauen, ob nach dem اَلْ ein Schadda steht. Und er weist darauf hin, dass das im Koran genauso steht – man kann die Regel direkt beim Koranlesen anwenden.",
    color: "other",
    source: { folge: 3, video: "Folge 03", approxTimestamp: "21:42", chapter: 3 },
    source2: { schluessel: 1, lektion: 3, seite: 9 }
  },
  {
    id: "madd-tabii-01",
    name: "مَدّ (natürliche Verlängerung)",
    shortExplanation: "Zu jedem Vokalzeichen gehört ein Buchstabe – Kasra gehört zu ي („sein kleiner Bruder\"), Damma zu و, Fatha zu ا. Wenn Vokalzeichen und zugehöriger Buchstabe aufeinandertreffen, verlängern sie sich nur – das ist das natürliche مَدّ (Madd). Ein ي mit Sukūn ist deshalb keine Pause: لَذِيذٌ (ladhīdhun, lecker) wird lang gelesen. Weitere Beispiele: اَلتُّفّاحُ (at-tuffāḥu, der Apfel) – dort trifft Fatha auf ا, deshalb wird lang gelesen; مَفْتوحٌ (maftūḥun) – dort trifft Damma auf و. Ebenso اَلْبَابُ (al-bābu, die Tür): nach der Fatha kann dort unmöglich eine Kasra kommen, das ا verlängert nur.",
    color: "other",
    source: { folge: 3, video: "Folge 03", approxTimestamp: "35:04", chapter: 3 }
  },
  {
    id: "schams-qamar-merkhilfe-01",
    name: "اَلْقَمَر / اَلشَّمْس (Merkhilfe für die Namen)",
    shortExplanation: "Die beiden Gruppen heißen حُروف قَمَرِيّة (Mondbuchstaben) und حُروف شَمْسِيّة (Sonnenbuchstaben). Der Grund für die Namen steckt in den Wörtern selbst: اَلْقَمَر (al-qamar, der Mond) beginnt mit ق, einem Mondbuchstaben, und wird mit gelesenem Lam gesprochen. اَلشَّمْس (asch-schams, die Sonne) beginnt mit ش, einem Sonnenbuchstaben, und wird mit Schadda und übersprungenem Lam gesprochen. Die Beispielwörter zeigen also die Regel bereits selbst.",
    color: "other",
    source: { folge: 3, video: "Folge 03", approxTimestamp: "42:31", chapter: 3 },
    source2: { schluessel: 1, lektion: 3, seite: 9 }
  },
  {
    id: "schakl-01",
    name: "شَكْل (Vokalzeichen)",
    shortExplanation: "شَكْل (schakl) sind die kleinen Zeichen über und unter den Buchstaben. Es gibt fünf: فَتْحة (Fatha), كَسْرة (Kasra), سُكون (Sukun), ضَمّة (Damma) und شَدّة (Schadda). Alle zusammen heißen تَشْكيل (taschkīl), ein einzelnes Zeichen ist ein شَكْل (schakl). Bei einem unbekannten Wort entscheidet die Sonnen-/Mondbuchstaben-Liste, ob ein Schadda hinkommt oder nicht.",
    color: "other",
    source: { folge: 3, video: "Folge 03", approxTimestamp: "45:31", chapter: 3 }
  },
  {
    id: "al-gesamtheit-01",
    name: "اَلْ (Bestimmung = die Gesamtheit)",
    shortExplanation: "Wird ein Wort mit اَلْ bestimmt, ist damit nicht nur „das eine\" gemeint, sondern alles davon. حَمْدٌ (hamdun) ist „ein Lob\" – wie ein Stück Kuchen; اَلْحَمْدُ (al-hamdu) ist „das Lob\" – der ganze Kuchen, also alles an Lob. Der Lehrer formuliert die Regel so: „Wenn wir eine Sache definieren, dann meinen wir alles von ihr\" – wie beim Wort „das Vermögen\", wo man ja auch das ganze Vermögen meint. Genau diese Bedeutung, sagt er, gibt es im Deutschen nicht; deshalb hörten die Araber im اَلْحَمْدُ لِلّٰهِ (al-hamdu lillahi) etwas, das ihre Sprache vorher nicht kannte. Ergänzt die schon bekannte Regel zu اَلْ (bestimmt, Tanwin fällt weg).",
    color: "other",
    source: { folge: 10, video: "Folge 10", approxTimestamp: "21:19", chapter: 3 }
  },
  {
    id: "jumla-ismiya-filiya-01",
    name: "جُمْلة اسْمِيّة / جُمْلة فِعْلِيّة (Nominalsatz und Verbalsatz)",
    shortExplanation: "Im Arabischen gibt es zwei Satzarten: Die جُمْلة اسْمِيّة (jumla ismiyya), der Nominalsatz, beginnt mit einem Nomen. Die جُمْلة فِعْلِيّة (jumla fiʿliyya), der Verbalsatz, beginnt mit einem Verb. Im Madina Buch 1 wird ausschließlich mit Nominalsätzen gearbeitet; Verben kommen erst später dran. Die beiden Satzarten unterscheiden sich auch in der grammatischen Analyse.",
    color: "mubtada",
    source: { folge: 4, video: "Folge 04", approxTimestamp: "12:55", chapter: 4 },
    source2: { schluessel: 2, lektion: 1, seite: 5 }
  },
  {
    id: "wortstellung-fokus-01",
    name: "تَقْديم (Wortstellung bestimmt den Fokus)",
    shortExplanation: "Womit ein Satz beginnt, darauf liegt der Fokus. Der Lehrer dreht dasselbe Satzpaar um: مُحَمَّدٌ ذَهَبَ (Muḥammadun dhahaba) und ذَهَبَ مُحَمَّدٌ (dhahaba Muḥammadun) – beide heißen „Mohammed ging“ und stehen in der Vergangenheit, es sind dieselben Wörter in anderer Reihenfolge. Beginnt der Satz mit dem Nomen, liegt die Betonung auf der Person, und der Satz ist – so der Lehrer – „permanent“: man teilt dem Zuhörer mit, dass Mohammed nicht da ist. Beginnt er mit dem Verb, verschiebt sich die Betonung auf die Zeit, denn ein Verb ist zeitgebunden und veränderbar. Als Beispiel nennt der Lehrer den Koran: Dass Allah der Allvergebende und Barmherzige ist, steht in einem Nominalsatz, weil es unabhängig von der Zeit gilt und sich nicht verändern kann. Einen arabischen Fachbegriff für diese Regel nennt der Lehrer in dieser Folge nicht.",
    color: "mubtada",
    source: { folge: 4, video: "Folge 04", approxTimestamp: "16:29", chapter: 4 }
  },
  {
    id: "irab-drei-faelle-01",
    name: "اَلْإِعْراب (die drei Fälle)",
    shortExplanation: "Das Arabische hat vier Fälle; drei davon werden zuerst gebraucht. مَرْفُوع (marfūʿ) = Nominativ, Frage \"wer oder was?\", Anzeichen: Damma ـُ oder zwei Damma ـٌ. مَجْرُور (majrūr) = Genitiv, Frage \"wessen?\", Anzeichen: Kasra ـِ oder zwei Kasra ـٍ. مَنْصُوب (manṣūb) = Akkusativ, Frage \"wen oder was?\", Anzeichen: Fatha ـَ oder zwei Fatha ـً. Der Lehrer betont, dass es noch weitere Anzeichen gibt, dies aber die Grundzeichen sind. Die Endung zeigt also den Fall an: مُحَمَّدٌ ist marfūʿ, مُحَمَّدٍ ist majrūr, مُحَمَّدًا ist manṣūb – z.B. رَأَى مُحَمَّدٌ حامِدًا (raʾā Muḥammadun Ḥāmidan) \"Mohammed sah Hamid\": Mohammed ist der Täter, also marfūʿ, Hamid ist der Gesehene, also mit Fatha-Tanwin. Im ersten Buch begegnen uns vor allem مَرْفُوع und مَجْرُور. Den arabischen Fachbegriff für die Fälle nennt der Lehrer in dieser Folge nicht; er spricht nur von \"Fällen\".",
    color: "nasab",
    source: { folge: 4, video: "Folge 04", approxTimestamp: "18:53", chapter: 4 },
    source2: { schluessel: 1, lektion: 11, seite: 39 }
  },
  {
    id: "marfu-grundfall-01",
    name: "مَرْفُوع (der Grundfall)",
    shortExplanation: "مَرْفُوع (marfūʿ, Nominativ) ist der Grundfall. Jedes Nomen steht normalerweise im Nominativ, also mit Damma am Ende: اَلْبَيْتُ (al-baytu) \"das Haus\". Erst wenn etwas dazukommt, das den Fall verändert, wird das Wort مَجْرُور oder مَنْصُوب.",
    color: "nasab",
    source: { folge: 4, video: "Folge 04", approxTimestamp: "23:18", chapter: 4 },
    source2: { schluessel: 1, lektion: 4, seite: 13 }
  },
  {
    id: "harf-jarr-01",
    name: "حَرْفُ الجَرِّ (Genitivpartikel)",
    shortExplanation: "حَرْف (ḥarf) heißt Buchstabe oder Partikel, und اَلْجَرّ (al-jarr) kommt von مَجْرُور (Genitiv). Ein حَرْفُ الجَرِّ (Plural: حُروفُ الجَرِّ) ist also eine Genitivpartikel – meistens sind das Präpositionen. Eine solche Partikel verändert den Fall des Nomens, das direkt danach kommt, von مَرْفُوع zu مَجْرُور: aus اَلْبَيْتُ (al-baytu) wird فِي الْبَيْتِ (fī l-bayti) \"im Haus\". Merksatz des Lehrers: Der ḥarf al-jarr macht sein Nomen (اِسْم, ism) zu majrūr.",
    color: "nasab",
    source: { folge: 4, video: "Folge 04", approxTimestamp: "24:07", chapter: 4 },
    source2: { schluessel: 1, lektion: 4, seite: 13 }
  },
  {
    id: "harf-jarr-fi-ala-01",
    name: "فِي und عَلَى (die ersten zwei Genitivpartikeln)",
    shortExplanation: "In Kapitel 4 lernen wir zwei Genitivpartikeln: فِي (fī) heißt \"in\" und عَلَى (ʿalā) heißt \"auf\". Beide setzen das folgende Nomen in den Genitiv (Kasra statt Damma): اَلْبَيْتُ → فِي الْبَيْتِ (fī l-bayti) \"im Haus\", اَلْمَسْجِدُ → فِي الْمَسْجِدِ (fī l-masjidi) \"in der Moschee\", اَلْمَكْتَبُ → عَلَى الْمَكْتَبِ (ʿalā l-maktabi) \"auf dem Schreibtisch\", اَلسَّريرُ → عَلَى السَّريرِ (ʿalā s-sarīri) \"auf dem Bett\". Beim Übersetzen besteht der Lehrer auf Genauigkeit: عَلَى heißt \"auf\", nicht \"über\" – \"über\" wäre etwas anderes. Zweites Beispiel, komplett durchanalysiert, aus dem Koran (Sure al-Baqara, Vers 61): لَن نَّصْبِرَ عَلَىٰ طَعَامٍ وَٰحِدٍ (lan naṣbira ʿalā ṭaʿāmin wāḥidin) – \"wir werden eine einzige Speise nicht ertragen\"; عَلَى ist der حَرْف جَرّ, طَعَامٍ das اِسْم مَجْرُور danach. Weitere Präpositionen kommen später; مِنْ (min) und إِلى (ilā) kündigt er am Ende der Stunde für das nächste Mal an.",
    color: "nasab",
    source: { folge: 4, video: "Folge 04", approxTimestamp: "25:05", chapter: 4 },
    source2: { schluessel: 1, lektion: 4, seite: 13 }
  },
  {
    id: "mudarris-lesung-herkunft-01",
    name: "مُدَرِّس (richtige Lesung und Herkunft)",
    shortExplanation: "Achtung bei der Aussprache: Der Strich unter dem Schadda ist eine Kasra, nicht wie erwartet eine Fatha – also نِّس nicht رَّس. Das Wort heißt deshalb مُدَرِّسٌ (mudarrisun), nicht مُدَرَّسٌ. مُدَرِّس kommt von دَرَّسَ (darrasa, \"er hat unterrichtet/studiert\") und heißt wörtlich \"Lehrer von Studierenden\". Der Lehrer stellt daneben مُعَلِّمٌ (muʿallimun) vor, das von عَلَّمَ (ʿallama) kommt: ein allgemeiner Lehrer für allgemeines Lernen, während مُدَرِّس eher für strukturiertes Lernen steht.",
    color: "other",
    source: { folge: 2, video: "Folge 02", approxTimestamp: "11:39", chapter: 1 }
  },
  {
    id: "fragepartikel-erforderlich-01",
    name: "Ohne Fragepartikel keine Frage",
    shortExplanation: "Anders als im Deutschen macht im Arabischen eine andere Wortstellung allein noch keine Frage. مُحَمَّدٌ ذَهَبَ (Muḥammadun dhahaba) und ذَهَبَ مُحَمَّدٌ (dhahaba Muḥammadun) sind beides Aussagen (\"Mohammed ging\"), nur mit verschobenem Fokus – keine davon ist eine Frage. Um im Arabischen wirklich zu fragen, braucht man zwingend eine Fragepartikel wie أَ oder هَلْ vor dem Satz; ohne sie bleibt es eine Aussage.",
    color: "nasab",
    source: { folge: 4, video: "Folge 04", approxTimestamp: "15:25", chapter: 4 },
    source2: { schluessel: 1, lektion: 1, seite: 6 }
  },
  {
    id: "istifham-ayna-01",
    name: "أَيْنَ (wo?)",
    shortExplanation: "أَيْنَ (ayna) heißt \"wo?\" und fragt nach dem Ort – ein wichtiges Fragewort. Beispiel: أَيْنَ مُحَمَّدٌ؟ (ayna Muḥammadun) \"Wo ist Mohammed?\" Die Antwort enthält eine Genitivpartikel, deshalb steht das Nomen danach im Genitiv: هُوَ فِي الْغُرْفَةِ (huwa fī l-ghurfati) \"Er ist im Zimmer\" – mit Kasra wegen فِي. أَيْنَ deckt auch \"wohin\" ab, nicht nur \"wo\": أَيْنَ ذَهَبَ؟ (ayna dhahaba) \"Wohin ging er?\" – zusammen mit ذَهَبَ اِلَى الْمُديرِ (dhahaba ilā l-mudīri) \"er ging zum Direktor\".",
    color: "mubtada",
    source: { folge: 4, video: "Folge 04", approxTimestamp: "27:03", chapter: 4 },
    source2: { schluessel: 1, lektion: 4, seite: 14 }
  },
  {
    id: "huwa-hiya-01",
    name: "هُوَ / هِيَ (er / sie)",
    shortExplanation: "هُوَ (huwa) heißt \"er\", هِيَ (hiya) heißt \"sie\". Ein eigenes Pronomen für \"es\" gibt es im Arabischen nicht: Man nimmt هُوَ für alle Wörter, die männlich sind, und هِيَ für alle Wörter, die weiblich sind. Bei Personen übersetzt man \"er/sie\", bei Sachen \"es\". Beispiel: أَيْنَ مُحَمَّدٌ؟ – هُوَ فِي الْغُرْفَةِ (ayna Muḥammadun – huwa fī l-ghurfati) \"Wo ist Mohammed? – Er ist im Zimmer.\" Weitere Pronomen kommen später.",
    color: "fem",
    source: { folge: 4, video: "Folge 04", approxTimestamp: "32:21", chapter: 4 },
    source2: { schluessel: 1, lektion: 4, seite: 14 }
  },
  {
    id: "tanwin-eigennamen-01",
    name: "تَنْوين bei Eigennamen (männlich / weiblich)",
    shortExplanation: "Männliche arabische Eigennamen tragen Tanwin, also die doppelte Endung: مُحَمَّدٌ (Muḥammadun), خالِدٌ (Khālidun), حامِدٌ (Ḥāmidun), ياسِرٌ (Yāsirun), عَمّارٌ (ʿAmmārun), سَعيدٌ (Saʿīdun), عَبّاسٌ (ʿAbbāsun). Weibliche arabische Eigennamen haben kein Tanwin, sondern nur eine einfache Endung – egal ob der Name auf ة endet wie فاطِمةُ (Fāṭimatu), آمِنةُ (Āminatu), عائِشةُ (ʿĀʾischatu) oder nicht wie زَيْنَبُ (Zaynabu), مَرْيَمُ (Maryamu). Der Lehrer nennt das ausdrücklich \"keine große Regel\", aber man soll es sich merken.",
    color: "fem",
    source: { folge: 4, video: "Folge 04", approxTimestamp: "47:40", chapter: 4 },
    source2: { schluessel: 1, lektion: 4, seite: 15 }
  },
  {
    id: "tanwin-nach-harf-jarr-01",
    name: "تَنْوين nach حَرْف جَرّ (unbestimmtes Wort)",
    shortExplanation: "Ist das Wort nach einem حَرْف جَرّ (harf jarr, Präposition) unbestimmt, hat es Tanwin – nach einer Präposition also zwei Kasra statt einer: فِي رَيْبٍ fī raibin (in Zweifel). Der Lehrer zeigt das an einem Vers aus Sure al-Baqara (Vers 23): رَيْب raib heißt „Zweifel“, das Wort ist unbestimmt, deshalb Tanwin – und weil فِي davorsteht, ist es Kasra. Er benennt dabei beide Rollen: فِي ist der حَرْف جَرّ, رَيْبٍ ist das اِسْم مَجْرُور (ism majrūr), das abhängige Wort danach. So kann man beim Auswendiglernen die richtige Endung selbst herleiten.",
    color: "nasab",
    source: { folge: 5, video: "Folge 05", approxTimestamp: "16:20", chapter: 4 },
    source2: { schluessel: 1, lektion: 4, seite: 13 }
  },
  {
    id: "harf-jarr-min-ila-01",
    name: "مِنْ und إِلى (zwei neue حُروف جَرّ)",
    shortExplanation: "Zu فِي und عَلى kommen zwei weitere Präpositionen dazu: مِنْ min heißt „von“, إِلى ilā heißt „zu“ oder „nach“. Beide sind Huruf Jarr, das folgende Wort wird also majrūr: مِنَ الْبَيْتِ mina l-baiti (vom Haus), إِلَى الْمَسْجِدِ ilā l-masjidi (zur Moschee).",
    color: "nasab",
    source: { folge: 5, video: "Folge 05", approxTimestamp: "22:54", chapter: 4 },
    source2: { schluessel: 1, lektion: 4, seite: 16 }
  },
  {
    id: "mina-al-01",
    name: "مِنَ الْـ (Sukun trifft Sukun)",
    shortExplanation: "مِنْ endet auf Sukun, und der Artikel اَلْ hat wieder ein Sukun auf dem Lam. Zwei Sukun hintereinander mögen die Araber nicht („das sind faule Säcke“, sie hassen es zu stoppen), deshalb bekommt مِنْ vor dem Artikel ein Fatha und wird zu مِنَ: مِنَ الْبَيْتِ mina l-baiti (vom Haus). Mit dem Fatha kann man „springen“ und flüssig in einem Zug weitersprechen, statt abgehackt zu lesen. Steht kein اَلْ dahinter, bleibt es bei مِنْ.",
    color: "other",
    source: { folge: 5, video: "Folge 05", approxTimestamp: "23:17", chapter: 4 },
    source2: { schluessel: 1, lektion: 12, seite: 41 }
  },
  {
    id: "min-ayna-01",
    name: "مِنْ أَيْنَ (Woher-Frage)",
    shortExplanation: "مِنْ أَيْنَ أَنْتَ؟ min aina anta – „Woher bist du?“ Dabei heißt مِنْ min „von“ und ist ein حَرْف جَرّ (harf jarr), أَيْنَ aina heißt „wo“ und أَنْتَ anta „du“ (männliche Person). Geantwortet wird mit أَنا anā (ich): أَنا مِنَ الْيابانِ anā mina l-yābāni – „Ich bin aus Japan“. الْيابان al-yābān ist Japan und steht nach dem Harf Jarr als اِسْم مَجْرُور (ism majrūr), endet also auf Kasra.",
    color: "mubtada",
    source: { folge: 5, video: "Folge 05", approxTimestamp: "24:31", chapter: 4 }
  },
  {
    id: "verb-enthaelt-pronomen-01",
    name: "خَرَجَ / ذَهَبَ (das „er“ steckt im Verb)",
    shortExplanation: "Die ersten beiden Verben sind خَرَجَ kharaja (er verließ, er ging hinaus) und ذَهَبَ dhahaba (er ging) – beides Vergangenheit. Das „er“ ist kein eigenes Wort und steckt auch nicht in der Endung, sondern ist im Verb selbst versteckt.",
    color: "mubtada",
    source: { folge: 5, video: "Folge 05", approxTimestamp: "27:41", chapter: 4 },
    source2: { schluessel: 1, lektion: 4, seite: 16 }
  },
  {
    id: "alif-maqsura-01",
    name: "أَلِف مَقْصورة (ى am Wortende)",
    shortExplanation: "Ein ى am Wortende ohne Punkte ist kein Ya, sondern eine أَلِف مَقْصورة alif maqṣūra – ein „kleines Alif“, gesprochen wie ein langes ā. Deshalb aufpassen: عَلى ʿalā heißt „auf“, عَلِيٌّ ʿaliyyun dagegen ist der Name Ali und endet wirklich auf ein Ya. Ohne Taschkil sehen die beiden fast gleich aus.",
    color: "other",
    source: { folge: 5, video: "Folge 05", approxTimestamp: "29:38", chapter: 4 }
  },
  {
    id: "min-man-unterscheiden-01",
    name: "مِنْ und مَنْ (von / wer)",
    shortExplanation: "Ohne Taschkil sehen مِنْ min („von“) und مَنْ man („wer?“) gleich aus. Der Lehrer zeigt den Trick: einfach beides ausprobieren und schauen, was Sinn ergibt. In der Übung geht es um das Verb خَرَجَ kharaja (er verließ) und um الْفَصْل al-faṣl (das Klassenzimmer). „Von verließ das Klassenzimmer“ ergibt keinen Sinn – also ist es eine Frage: مَنْ خَرَجَ man kharaja – „Wer verließ das Klassenzimmer?“",
    color: "other",
    source: { folge: 5, video: "Folge 05", approxTimestamp: "40:54", chapter: 4 }
  },
  {
    id: "idafa-01",
    name: "إِضافة (Genitivverbindung)",
    shortExplanation: "Mit der إِضافة verbindet man zwei Nomen (اِسْم + اِسْم) zu einem Ausdruck. Das erste Wort heißt مُضَاف (der Besitz), das zweite مُضَاف إِلَيْهِ (der Besitzer): كِتابُ اللهِ kitābu llāhi – das Buch Allahs, بَيْتُ اللهِ baytu llāhi – das Haus Allahs (die Kaaba), بَابُ الْمَسْجِدِ bābu l-masjidi – die Tür der Moschee, سَيّارَةُ حامِدٍ sayyāratu ḥāmidin – das Auto von Hamid. Damit kann man zusammengesetzte Begriffe bilden – der Lehrer zählt auf Deutsch auf: Wörterbuch, Feuertreppe, Trinkbecher, Schreibtisch. Das ging vorher nicht. Die Verbindung funktioniert nur zwischen zwei Nomen, اِسْم und اِسْم.",
    color: "idafa",
    source: { folge: 7, video: "Folge 07", approxTimestamp: "2:24", chapter: 5 },
    source2: { schluessel: 1, lektion: 5, seite: 18 }
  },
  {
    id: "mudaf-01",
    name: "مُضَاف (der Besitz – erstes Wort)",
    shortExplanation: "Der مُضَاف, also das erste Wort der Verbindung, darf kein اَلْ tragen und kein Tanwin. Seinen Fall bekommt er ganz normal aus dem Satz – er kann jeden Fall annehmen: كِتابُ اللهِ kitābu llāhi (Grundfall, Damma), aber عَلى مَكْتَبِ الْمُدَرِّسِ ʿalā maktabi l-mudarrisi – auf dem Schreibtisch des Lehrers (nach حَرْف جَرّ mit Kasra).",
    color: "idafa",
    source: { folge: 7, video: "Folge 07", approxTimestamp: "7:00", chapter: 5 },
    source2: { schluessel: 1, lektion: 5, seite: 18 }
  },
  {
    id: "mudaf-ilayh-01",
    name: "مُضَاف إِلَيْهِ (der Besitzer – zweites Wort)",
    shortExplanation: "Der مُضَاف إِلَيْهِ, also das zweite Wort, ist immer مَجْرُور – daran lässt sich nichts ändern; er endet auf Kasra: كِتابُ الْمُدَرِّسِ kitābu l-mudarrisi – das Buch des Lehrers. Er darf dabei bestimmt oder unbestimmt sein: كِتابُ مُدَرِّسٍ kitābu mudarrisin – das Buch eines Lehrers.",
    color: "idafa",
    source: { folge: 7, video: "Folge 07", approxTimestamp: "7:39", chapter: 5 },
    source2: { schluessel: 1, lektion: 5, seite: 18 }
  },
  {
    id: "ya-nida-01",
    name: "يَا (Rufpartikel)",
    shortExplanation: "يَا ist die Rufpartikel („o …\"). Steht sie vor einem männlichen Namen, fällt dessen Tanwin weg und es bleibt eine Damma: nicht يَا ياسِرٌ yā Yāsirun, sondern يَا ياسِرُ yā Yāsiru. Im Kapiteltext: أَهَذا كِتابُ مُحَمَّدٍ يَا ياسِرُ؟ – „Ist dies Muhammads Buch, o Yasir?\" Genauso im selben Text: يَا عَلِي yā ʿAlī – „o Ali\", obwohl der Name sonst عَلِيٌّ ʿalīyun mit Tanwin ist.",
    color: "nasab",
    source: { folge: 7, video: "Folge 07", approxTimestamp: "9:39", chapter: 5 }
  },
  {
    id: "mudaf-ohne-al-01",
    name: "مُضَاف (bestimmt ohne اَلْ)",
    shortExplanation: "Obwohl der مُضَاف kein اَلْ tragen darf, ist er trotzdem bestimmt – denn er gehört ja jemandem, und etwas kann nicht jemandem gehören und gleichzeitig unbestimmt sein. بَيْتُ حامِدٍ baytu ḥāmidin heißt deshalb „das Haus Hamids“, nicht „ein Haus Hamids“. Die Bestimmtheit entsteht hier also nicht durch اَلْ, sondern durch den Besitzer.",
    color: "idafa",
    source: { folge: 7, video: "Folge 07", approxTimestamp: "12:18", chapter: 5 },
    source2: { schluessel: 1, lektion: 5, seite: 18 }
  },
  {
    id: "harf-jarr-idafa-01",
    name: "حَرْف جَرّ + إِضافة (Verkettung)",
    shortExplanation: "Steht ein حَرْف جَرّ (عَلى, مِنْ, فِي) vor einer إِضافة, greifen zwei Regeln hintereinander – der Lehrer nennt das eine „Verkettung\". Der حَرْف جَرّ macht den مُضَاف مَجْرُور, und der مُضَاف إِلَيْهِ ist ohnehin مَجْرُور: beide Wörter bekommen Kasra. عَلى مَكْتَبِ الْمُدَرِّسِ ʿalā maktabi l-mudarrisi – auf dem Schreibtisch des Lehrers (مَكْتَب kann jeden Fall annehmen, durch عَلى muss es مَجْرُور werden); فِي كِتابِ اللهِ fī kitābi llāhi – im Buch Allahs (genau diesen Fall zerlegt der Lehrer: فِي ist ein حَرْف جَرّ und macht كِتاب مَجْرُور, und كِتاب ist zugleich مُضَاف und macht اللّٰه مَجْرُور); مِنْ بَيْتِ الْمُدَرِّسِ min bayti l-mudarrisi – vom Haus des Lehrers.",
    color: "nasab",
    source: { folge: 7, video: "Folge 07", approxTimestamp: "12:57", chapter: 5 },
    source2: { schluessel: 1, lektion: 5, seite: 19 }
  },
  {
    id: "zarf-01",
    name: "ظَرْف (Zeit-/Ortsangabe)",
    shortExplanation: "Neben حَرْف جَرّ und إِضافة gibt es eine dritte Sache, die den Fall steuert: die ظَرْف – Zeit- und Ortsangaben (Adverbien). Eine Ortsangabe verhält sich wie ein مُضَاف, das heißt das Nomen dahinter wird مَجْرُور: تَحْتَ الْمَكْتَبِ taḥta l-maktabi – unter dem Schreibtisch. Genauso أَمامَ الْمَسْجِدِ (amāma l-masjidi) \"vor der Moschee\" und خَلْفَ الْمَدْرَسَةِ (khalfa l-madrasati) \"hinter der Schule\". Der Lehrer stellt dazu ausdrücklich klar: تَحْتَ zählt selbst NICHT zu den حُروف الجَرّ – es ist \"eine Art Verb\" (gemeint: eine eigene Kategorie), auch wenn es genauso wie ein حَرْف جَرّ das folgende Nomen in den Genitiv setzt. Der Lehrer hat das in dieser Stunde nur kurz angerissen und angekündigt, es später zu wiederholen.",
    color: "nasab",
    source: { folge: 7, video: "Folge 07", approxTimestamp: "14:46", chapter: 5 },
    source2: { schluessel: 1, lektion: 5, seite: 19 }
  },
  {
    id: "lafz-al-jalala-01",
    name: "اَللّٰه (helle und dunkle Aussprache)",
    shortExplanation: "Kleiner Aussprache-Trick des Lehrers: Normalerweise wird der Name اَللّٰه dunkel/schwer gesprochen – اَللّٰهُ Allāhu. Steht davor aber ein Wort, das auf Kasra endet, wird er hell/leicht gesprochen – …llāhi. Beispiel aus dem Kapitel: فِي كِتابِ اللهِ fī kitābi llāhi – im Buch Allahs.",
    color: "other",
    source: { folge: 7, video: "Folge 07", approxTimestamp: "27:32", chapter: 5 }
  },
  {
    id: "idafa-erkennen-01",
    name: "مُضَاف erkennen (Nomen ohne Tanwin + Nomen)",
    shortExplanation: "So erkennt man eine Genitivverbindung im Text: Wenn ein Nomen nur eine einfache Endung trägt – also z.B. nur ein Damma statt Tanwin-Damma – und direkt danach noch ein Nomen kommt, dann muss das erste Wort ein مُضَاف sein; anders geht es gar nicht. Beispiel: اِبْنُ عَمّارٍ طالِبٌ (ibnu ʿAmmārin ṭālibun) – der Sohn Ammars ist ein Student. اِبْنُ hat nur ein Damma; beide Wörter مَرْفُوع zu machen wäre falsch. Genauso سَيّارَةُ الْمُدَرِّسِ (sayyāratu l-mudarrisi) – das Auto des Lehrers: سَيّارَةُ trägt nur ein Damma, danach folgt ein Nomen. Dabei ist der مُضَاف der Besitz (das Auto) und der مُضَاف إِلَيْهِ der Besitzer (der Lehrer) – umgekehrt ergäbe es keinen Sinn.",
    color: "idafa",
    source: { folge: 8, video: "Folge 08", approxTimestamp: "22:49", chapter: 5 },
    source2: { schluessel: 1, lektion: 5, seite: 20 }
  },
  {
    id: "zarf-als-mudaf-01",
    name: "Ortsangabe als مُضَاف (z.B. تَحْتَ)",
    shortExplanation: "Auch eine Zeit- oder Ortsangabe wie تَحْتَ (taḥta) kann am Anfang einer solchen Verbindung stehen. Der Lehrer besteht hier auf der genauen Formulierung: Die Ortsangabe ist ein Nomen (اِسْم) – تَحْتَ gehört zu den Adverbien und ist deshalb ein اِسْم – und sie funktioniert wie ein مُضَاف, ist aber selbst keiner. Das folgende Wort steht im Genitiv: تَحْتَ السَّيّارَةِ (taḥta s-sayyārati) – unter dem Auto. Der Lehrer betont dazu: eine kleine Änderung in der Formulierung kann schon die ganze Erklärung verändern.",
    color: "idafa",
    source: { folge: 8, video: "Folge 08", approxTimestamp: "24:27", chapter: 5 },
    source2: { schluessel: 1, lektion: 5, seite: 19 }
  },
  {
    id: "wortarten-01",
    name: "اِسْم – فِعْل – حَرْف (die drei Wortarten)",
    shortExplanation: "Im Arabischen gibt es nur drei Wortarten: اِسْم (ism) = Nomen, فِعْل (fiʿl) = Verb, حَرْف (ḥarf) = Partikel. Alles, was kein Verb und kein Partikel ist, ist automatisch ein Nomen. Deshalb zählen im Arabischen auch Adjektive, Adverbien, Ortsangaben und die Hinweiswörter – اِسْمُ الإِشارَةِ (ismu l-ishārati), wörtlich „das Nomen des Zeigens“ – als Nomen; anders als im Deutschen gibt es keine weiteren Kategorien. Fragepartikel dagegen gehören zu حَرْف.",
    color: "other",
    source: { folge: 8, video: "Folge 08", approxTimestamp: "24:41", chapter: 5 },
    source2: { schluessel: 2, lektion: 21, seite: 94 }
  },
  {
    id: "idafa-kein-adjektiv-01",
    name: "إِضافة – kein Adjektiv als Zweitglied",
    shortExplanation: "اَلرَّجُلُ مَرِيضٌ ar-rajulu marīdun »der Mann ist krank« ist ein normaler Satz und enthält keine Iḍāfa. Man kann daraus keine Genitivverbindung machen: مَرِيضٍ marīdin würde »der Mann des Kranken« bzw. »der Krankheitsmann« bedeuten – und das geht nicht.",
    color: "idafa",
    source: { folge: 9, video: "Folge 09", approxTimestamp: "7:29", chapter: 5 }
  },
  {
    id: "idafa-verkettung-01",
    name: "إِضافة – Verkettung (mehrgliedrige Genitivverbindung)",
    shortExplanation: "Eine Iḍāfa kann verkettet (»verschachtelt«) werden: هَذَا اِبْنُ إِمَامِ الْمَسْجِدِ hādhā ibnu imāmi l-masjidi – »dies ist der Sohn des Imams der Moschee«. Das mittlere Wort ist gleichzeitig مُضَاف إِلَيْهِ (deshalb Kasra) und مُضَاف für das nächste Wort – und bekommt deshalb kein Tanwīn. Genauso im Beispiel هَذَا مَسْجِدُ رَسُولِ اللهِ hādhā masjidu rasūli llāhi: رَسُولِ müsste eigentlich رَسُولٍ heißen, weil kein اَلْ dransteht – es bleibt aber ohne Tanwīn, weil es Mudāf für اللهِ ist.",
    color: "idafa",
    source: { folge: 9, video: "Folge 09", approxTimestamp: "18:37", chapter: 5 },
    source2: { schluessel: 1, lektion: 5, seite: 19 }
  },
  {
    id: "idafa-zweitglied-01",
    name: "إِضافة – Zweitglied bestimmt oder unbestimmt",
    shortExplanation: "Beim zweiten Wort der Iḍāfa entscheidest du selbst: بَيْتُ الْإِمَامِ baytu l-imāmi – »das Haus des Imams« (bestimmt mit اَلْ) oder بَيْتُ إِمَامٍ baytu imāmin – »das Haus eines Imams« (unbestimmt mit Tanwīn). Bei männlichen Eigennamen gibt es diese Wahl nicht: sie stehen immer mit Tanwīn – مُحَمَّدٍ Muhammadin, حَامِدٍ Hāmidin, عَمَّارٍ ʿAmmārin. Achtung: für weibliche Eigennamen gilt das nicht, die tragen laut Lehrer gar kein Tanwīn (51:14). (Baut auf der Regel zu اَلْ auf.)",
    color: "idafa",
    source: { folge: 9, video: "Folge 09", approxTimestamp: "20:49", chapter: 5 },
    source2: { schluessel: 1, lektion: 5, seite: 18 }
  },
  {
    id: "ismul-isara-hadhihi-01",
    name: "هَذِهِ (weibliches Hinweiswort, nah)",
    shortExplanation: "هَذِهِ hādhihi ist die weibliche Form von هَذَا hādhā und zeigt wie dieses auf Nahes (der Lehrer liest die Kapitelüberschrift: »diese sind für die Nähe, diese sind für die Ferne«). Genauso gibt es zu ذَلِكَ dhālika »jenes« die weibliche Form تِلْكَ tilka – die kommt aber erst in Kapitel 7. Der Lehrer sagt ausdrücklich: für هَذِهِ und تِلْكَ gelten genau die gleichen Regeln wie bei هَذَا und ذَلِكَ, nur eben für Begriffe, die weiblich sind. Beispiel aus der Stunde: هَذِهِ بِنْتُ يَاسِرٍ hādhihi bintu Yāsirin – »dies ist die Tochter von Yāsir«.",
    color: "mubtada",
    source: { folge: 9, video: "Folge 09", approxTimestamp: "22:58", chapter: 6 },
    source2: { schluessel: 1, lektion: 6, seite: 22 }
  },
  {
    id: "hadha-al-kein-satz-01",
    name: "هَذَا + اَلْ (»dieses Haus« ist kein Satz)",
    shortExplanation: "Steht nach هَذَا / هَذِهِ ein Nomen mit اَلْ, ist das noch kein vollständiger Satz, sondern nur die Wortgruppe »dieses Haus« – da fehlt noch etwas. Es muss ein Prädikat folgen: هَذَا الْبَيْتُ جَدِيدٌ hādhā l-baytu jadīdun – »dieses Haus ist neu«. Deshalb übersetzt man هَذَا immer mit »dies«, damit man diese Konstellation überhaupt erkennt (genauso: »dieser Stift…«, »diese Moschee…« – da muss noch was kommen).",
    color: "mubtada",
    source: { folge: 9, video: "Folge 09", approxTimestamp: "24:42", chapter: 6 }
  },
  {
    id: "istifham-liman-01",
    name: "لِمَنْ (Fragewort »wem gehört«)",
    shortExplanation: "لِمَنْ li-man ist das Fragewort für »wessen / von wem / wem gehört das«: لِمَنْ هَذِهِ؟ li-man hādhihi – »wem gehört diese hier?«. Die Antwort kommt dann mit لِ: هَذِهِ لِخَالِدٍ hādhihi li-Khālidin – »diese gehört Khalid«. Der Lehrer nennt es ausdrücklich »ein wichtiges Fragewort«.",
    color: "mubtada",
    source: { folge: 9, video: "Folge 09", approxTimestamp: "35:06", chapter: 6 },
    source2: { schluessel: 1, lektion: 6, seite: 23 }
  },
  {
    id: "harf-jarr-li-01",
    name: "لِ (fünfter حَرْف جَرّ, Besitz)",
    shortExplanation: "لِ ist der fünfte Harf al-Jarr nach فِي، عَلَى، إِلَى، مِنْ – nur ein einziger Buchstabe, ein Lām mit Kasra. Es bedeutet »für« oder »gehört« und ist eine Besitzanzeige: هَذَا لِخَالِدٍ hādhā li-Khālidin – »dies gehört Khalid«. Fürs Erste steht لِ nur für Besitz; weitere Bedeutungen kommen später dazu. Wie bei den anderen Huruf al-Jarr wird das Wort danach مَجْرُور majrūr (Kasra bzw. Kasratān): لِ ist حَرْف جَرّ, خَالِدٍ ist اِسْم مَجْرُور.",
    color: "nasab",
    source: { folge: 9, video: "Folge 09", approxTimestamp: "35:14", chapter: 6 },
    source2: { schluessel: 1, lektion: 6, seite: 23 }
  },
  {
    id: "mutabaqa-genus-01",
    name: "مُطَابَقَة (Angleichung des Prädikats an das Genus)",
    shortExplanation: "Das Wort, das über etwas Weibliches aussagt, bekommt selbst die weibliche Form mit Tāʾ marbūṭa. Beispiel des Lehrers: das Wort für »Fahrrad« ist im Arabischen weiblich, deshalb heißt es nicht جَدِيدٌ jadīdun, sondern جَدِيدَةٌ jadīdatun »neu« – und nicht قَدِيمٌ qadīmun, sondern قَدِيمَةٌ qadīmatun »alt«.",
    color: "fem",
    source: { folge: 9, video: "Folge 09", approxTimestamp: "40:29", chapter: 6 },
    source2: { schluessel: 1, lektion: 9, seite: 30 }
  },
  {
    id: "fem-ohne-ta-marbuta-01",
    name: "مُؤَنَّث بلا تاء (weiblich ohne Tāʾ marbūṭa)",
    shortExplanation: "Es gibt drei Gruppen weiblicher Wörter: solche mit Tāʾ marbūṭa, solche die von der Bedeutung her weiblich sind (Tochter, Mutter, Tante) und solche, die einfach weiblich sind – ohne erkennbaren Grund, z.B. اَلنَّار an-nār »das Feuer«. Auch قِدْرٌ qidrun »Kochtopf« ist weiblich, obwohl kein Tāʾ marbūṭa dransteht. Die dritte Gruppe muss man auswendig lernen.",
    color: "fem",
    source: { folge: 9, video: "Folge 09", approxTimestamp: "42:53", chapter: 6 },
    source2: { schluessel: 1, lektion: 6, seite: 22 }
  },
  {
    id: "taschkil-kontext-01",
    name: "تشكيل und Kontext (gleiches Schriftbild)",
    shortExplanation: "Zwei Wörter können identisch geschrieben sein und trotzdem Verschiedenes bedeuten: رَجُلٌ rajulun »Mann« und رِجْلٌ rijlun »Bein« – ohne Taschkīl sieht man keinen Unterschied. Genauso مَدْرَسَة madrasa »Schule« und مُدَرِّسَة mudarrisa »Lehrerin«. Deshalb muss man oft auf den Kontext schauen.",
    color: "other",
    source: { folge: 9, video: "Folge 09", approxTimestamp: "46:25", chapter: 6 }
  },
  {
    id: "koerperteile-genus-01",
    name: "أَعْضَاء مزدوجة (doppelte Körperteile sind weiblich)",
    shortExplanation: "Körperteile, die es doppelt gibt, sind im Arabischen weiblich: يَدٌ yadun »Hand«, رِجْلٌ rijlun »Bein«, أُذُنٌ udhunun »Ohr«, عَيْنٌ ʿaynun »Auge«. Körperteile, die es nur einmal gibt, sind männlich – أَنْفٌ anfun »Nase« und فَمٌ famun »Mund«. Der Lehrer nennt das eine »Ausnahmeregel«, die man sich bei Körperteilen gut merken kann.",
    color: "fem",
    source: { folge: 9, video: "Folge 09", approxTimestamp: "48:32", chapter: 6 },
    source2: { schluessel: 1, lektion: 6, seite: 22 }
  },
  {
    id: "isara-genus-kongruenz-01",
    name: "Hinweiswort richtet sich nach dem Genus",
    shortExplanation: "Das Hinweiswort muss zum Geschlecht des Wortes passen, auf das gezeigt wird: هَذَا/ذَلِكَ bei männlichen Wörtern, هَذِهِ/تِلْكَ bei weiblichen. Der Lehrer erklärt es so: هَذَا ist 'er', هَذِهِ ist 'sie'. بَقَرةٌ (baqaratun, Kuh) ist weiblich, deshalb muss هَذِهِ davor stehen und nicht هَذَا; ebenso سَيّارةٌ (sayyaratun, Auto). Baut auf هَذَا und ذَلِكَ auf.",
    color: "fem",
    source: { folge: 10, video: "Folge 10", approxTimestamp: "19:53", chapter: 7 },
    source2: { schluessel: 1, lektion: 7, seite: 26 }
  },
  {
    id: "possessiv-ya-01",
    name: "ـي (mein)",
    shortExplanation: "Um zu sagen, dass eine Sache 'meins' ist, hängt man ein ي ans Wort: aus رَبُّ (rabbu, Herr) wird رَبّي (rabbi) – 'mein Herr'. Im Sprachgebrauch lassen die Araber das ي oft weg und behalten nur die Kasra: رَبِّ. Der Lehrer sagt dazu, dass er das später noch vollständig erklären wird.",
    color: "idafa",
    source: { folge: 10, video: "Folge 10", approxTimestamp: "26:59", chapter: 7 },
    source2: { schluessel: 1, lektion: 10, seite: 35 }
  },
  {
    id: "ismul-isara-tilka-01",
    name: "تِلْكَ (jene)",
    shortExplanation: "تِلْكَ (tilka) ist das Hinweiswort für etwas Entferntes, das weiblich ist – das weibliche Gegenstück zu ذَلِكَ (dhalika). In der Nähe steht هَذِهِ (hadhihi), in der Ferne تِلْكَ. Der Lehrer buchstabiert es als drei Buchstaben: ت – ل – ك (Ta, Lam, Kaf). Beispiel aus der Stunde: مَنْ تِلْكَ؟ – تِلْكَ فاطِمةُ (man tilka – tilka Fatimatu) „Wer ist jene? – Jene ist Fatima\"; er merkt dazu an, dass man hier im Deutschen „jene\" statt „jenes\" sagen muss, weil das Wort weiblich ist. In den Sätzen des Kapitels stehen هَذِهِ und تِلْكَ meist als Paar in einem Satz: هَذِهِ طَبيبةٌ وَتِلْكَ مُمَرِّضةٌ (hadhihi tabibatun wa-tilka mumarridatun) „dies ist eine Ärztin und jene ist eine Krankenschwester\", هَذِهِ مِنَ الْهِنْدِ وَتِلْكَ مِنَ الْيابانِ (hadhihi mina l-Hindi wa-tilka mina l-Yabani) „diese kommt aus Indien und jene kommt aus Japan\".",
    color: "mubtada",
    source: { folge: 10, video: "Folge 10", approxTimestamp: "29:57", chapter: 7 },
    source2: { schluessel: 1, lektion: 7, seite: 26 }
  },
  {
    id: "eigennamen-fem-ohne-tanwin-01",
    name: "Weibliche Eigennamen ohne Tanwin",
    shortExplanation: "Weibliche Eigennamen bekommen kein Tanwin. In den Sätzen dieses Kapitels stehen sie deshalb mit einfachem Damma: آمِنةُ (Aminatu), فاطِمةُ (Fatimatu) – nicht آمِنةٌ. Welche Endung solche Namen an anderen Satzpositionen bekommen, sagt der Lehrer hier nicht.",
    color: "fem",
    source: { folge: 10, video: "Folge 10", approxTimestamp: "30:50", chapter: 7 },
    source2: { schluessel: 1, lektion: 4, seite: 15 }
  },
  {
    id: "li-al-lil-01",
    name: "لِ + اَلْ = لِلـ",
    shortExplanation: "لِ ist ein حَرْف جَرّ (ḥarf jarr, Präposition). Vor einem unbestimmten Wort heißt es لِطَبيبٍ (li-ṭabībin, „gehört einem Arzt\"). Kommt لِ aber vor ein bestimmtes Wort, treffen لِ und اَلْ aufeinander und das أَلِف fällt weg – übrig bleiben zwei لام hintereinander: لِلطَّبيبِ. Bei einem Sonnenbuchstaben springt man beim Sprechen über das لام (liṭ-ṭabībi), bei einem Mondbuchstaben spricht man es mit: لِلْقَلَمِ (lil-qalami), لِلْبَيْتِ (lil-baiti).",
    color: "other",
    source: { folge: 11, video: "Folge 11", approxTimestamp: "29:57", chapter: 8 },
    source2: { schluessel: 1, lektion: 9, seite: 33 }
  },
  {
    id: "lil-vs-li-01",
    name: "لِلْ vs. لِ (bestimmt/unbestimmt)",
    shortExplanation: "Beim لِ (\"gehört\") muss man bestimmt und unbestimmt hörbar unterscheiden: لِلْمُدَرِّسِ (li-l-mudarrisi, vom Lehrer als \"mit zwei L\" beschrieben) heißt \"dem Lehrer\" - bestimmt. لِمُدَرِّسٍ (li-mudarrisin, Kasra mit Tanwīn) heißt \"einem Lehrer\" - unbestimmt. Der Lehrer schärft ein, diese beiden Formen nicht zu verwechseln.",
    color: "idafa",
    source: { folge: 12, video: "Folge 12", approxTimestamp: "12:47", chapter: 8 },
    source2: { schluessel: 1, lektion: 9, seite: 33 }
  },
  {
    id: "li-eigenname-01",
    name: "لِ + Eigenname (kein لِلْ)",
    shortExplanation: "Bei Eigennamen sagt man kein لِلْ, sondern nur لِ + Name mit Kasra und Tanwīn. Beim Satz über den Stuhl wird oft لِلْعَمّار (li-l-ʿAmmār) gelesen, der Lehrer korrigiert sofort zu لِعَمّارٍ (li-ʿAmmārin) und begründet: \"Weil Ammar ist ein Name - und deswegen sagt man auch kein لِلْ.\" Genauso لِمُحَمَّدٍ (li-Muḥammadin) \"gehört Muhammad\" und لِخالِدٍ (li-Khālidin) \"gehört Khalid\". Der Satz übersetzt: \"Wem gehört der Stuhl? - Dieser Stuhl gehört Ammar.\" (Sonderfall zu لِلْ / لِ, siehe Beleg 12:47.)",
    color: "idafa",
    source: { folge: 12, video: "Folge 12", approxTimestamp: "16:21", chapter: 8 },
    source2: { schluessel: 1, lektion: 6, seite: 23 }
  },
  {
    id: "alif-maqsura-unveraenderlich-01",
    name: "أَلِف مَقْصورة (unveränderliche Endung)",
    shortExplanation: "Der Normalfall ist مَرْفُوع (marfūʿ): اَلْبَيْتُ (al-baytu, das Haus). Wird ein Wort مَجْرُور (majrūr), bekommt es Kasra: فِي الْبَيْتِ (fī l-bayti, im Haus), مِنَ الْبَيْتِ (mina l-bayti, vom Haus), إِلَى الْبَيْتِ (ilā l-bayti, zum Haus). Endet ein Wort aber auf ein Alif (ـا) oder auf ein Alif maqṣūra (ـى, \"das hier ohne Punkte\"), dann sieht man den Fall an dem Wort nicht - es bleibt immer gleich. Der Lehrer führt dieselben drei Präpositionen an اَلْمُسْتَشْفى (al-mustashfā, das Krankenhaus) vor: فِي الْمُسْتَشْفى، مِنَ الْمُسْتَشْفى، إِلَى الْمُسْتَشْفى - \"keine Anzeichen, ändert sich nicht, bleibt immer gleich\". Genauso bei أَمْريكا (Amrīkā, Amerika): فِي أَمْريكا، مِنْ أَمْريكا، إِلى أَمْريكا, ebenso bei أَلْمانِيا (Almāniyā, Deutschland) und مُوسى (Mūsā, Musa): \"Ob du sagst, Musa ist marfūʿ - bleibt Musa.\" Der Lehrer nennt das selbst nur \"eine kleine Nebenregel\".",
    color: "nasab",
    source: { folge: 12, video: "Folge 12", approxTimestamp: "19:43", chapter: 8 },
    source2: { schluessel: 1, lektion: 8, seite: 27 }
  },
  {
    id: "zuruf-makan-01",
    name: "تَحْتَ / أَمامَ / خَلْفَ (Ortsadverbien)",
    shortExplanation: "Die bisher gelernten drei ظَرْف (ẓarf, Zeit- und Ortsangaben - der Lehrer sagt dazu \"Adverbien\") sind: تَحْتَ (taḥta) = unter, أَمامَ (amāma) = davor/vor, خَلْفَ (khalfa) = dahinter/hinter. Das Wort dahinter steht im Genitiv, endet also auf Kasra - genau daran wird im Unterricht korrigiert: أَمامَ الطّالِبِ (amāma ṭ-ṭālibi, \"vor dem Studenten\", nicht ṭālibu) und خَلْفَ الْمَسْجِدِ (khalfa l-masjidi, nicht masjidu). Beispiele aus der Stunde: \"Die Tafel ist vor dem Studenten und sie ist hinter dem Lehrer\" sowie بَيْتُ الإِمامِ خَلْفَ الْمَسْجِدِ (baytu l-imāmi khalfa l-masjidi) - \"Das Haus des Imams ist hinter der Moschee.\"",
    color: "other",
    source: { folge: 12, video: "Folge 12", approxTimestamp: "26:59", chapter: 8 },
    source2: { schluessel: 1, lektion: 8, seite: 28 }
  },
  {
    id: "nat-bestimmtheit-01",
    name: "نَعْت und Bestimmtheit (Wortgruppe oder Satz)",
    shortExplanation: "Ob zwei Wörter eine Wortgruppe oder einen ganzen Satz ergeben, hängt an der Bestimmtheit: مَسْجِدٌ كَبِيرٌ (masjidun kabirun) heißt nur „eine große Moschee\" – hier steckt kein „ist\" drin –, und الْمَسْجِدُ الْكَبِيرُ (al-masjidu l-kabiru) heißt „die große Moschee\". Passen die beiden Wörter in der Bestimmtheit nicht zusammen, ist das zweite Wort kein Adjektiv, sondern die Aussage: الْمَسْجِدُ كَبِيرٌ heißt „Die Moschee ist groß\". Genauso كِتَابٌ جَدِيدٌ „ein neues Buch\" gegenüber الْكِتَابُ جَدِيدٌ „Das Buch ist neu\". Ändert man dagegen die Endung des zweiten Wortes, entsteht aus denselben zwei Wörtern eine dritte Möglichkeit: مَسْجِدُ الْكَبِيرِ (masjidu l-kabiri) ist eine مُضَاف-Verbindung und heißt „die Moschee des Großen\" – der Lehrer sagt dazu, dass das inhaltlich wenig Sinn ergibt und hier nur grammatisch getestet wird.",
    color: "mubtada",
    source: { folge: 13, video: "Folge 13", approxTimestamp: "3:11", chapter: 9 },
    source2: { schluessel: 1, lektion: 9, seite: 30 }
  },
  {
    id: "nat-vier-bedingungen-01",
    name: "نَعْت (Adjektiv): die vier Bedingungen",
    shortExplanation: "Ein Wort, das direkt hinter einem Nomen steht, ist dessen Adjektiv (نَعْت), wenn es in vier Dingen mit ihm uebereinstimmt: Geschlecht, Bestimmtheit, Fall und Zahl. Das beschriebene Wort heisst مَنْعُوت. Beispiel: مَسْجِدٌ كَبِيرٌ (masjidun kabirun) „eine grosse Moschee\" – beide maennlich, beide unbestimmt, beide مَرْفُوع, beide Singular. Stimmt auch nur eine Bedingung nicht, ist das Wort kein Adjektiv.",
    color: "mubtada",
    source: { folge: 13, video: "Folge 13", approxTimestamp: "5:32", chapter: 9 },
    source2: { schluessel: 2, lektion: 31, seite: 140 }
  },
  {
    id: "nat-fem-01",
    name: "نَعْت bei weiblichen Nomen (بِنْتٌ صَغِيرَةٌ)",
    shortExplanation: "Ist das beschriebene Nomen weiblich, muss auch das Adjektiv weiblich sein, also die تاء مَرْبُوطة bekommen. بِنْتٌ صَغِيرٌ geht nicht, richtig ist بِنْتٌ صَغِيرَةٌ (bintun saghiratun) „ein kleines Maedchen\". Genauso لُغَةٌ جَمِيلَةٌ (lughatun jamilatun) „eine schoene Sprache\".",
    color: "fem",
    source: { folge: 13, video: "Folge 13", approxTimestamp: "9:23", chapter: 9 },
    source2: { schluessel: 1, lektion: 9, seite: 30 }
  },
  {
    id: "nat-eigenname-01",
    name: "Name + نَعْت (Eigennamen sind bestimmt)",
    shortExplanation: "Eigennamen gelten als bestimmt, obwohl sie ein Tanwin tragen. Deshalb ist ein unbestimmtes Wort direkt hinter einem Namen kein Adjektiv, sondern die Aussage ueber ihn: عَبَّاسٌ تَاجِرٌ ('Abbasun tajirun) heisst „Abbas ist ein Haendler\", nicht „ein Haendler Abbas\". Das Adjektiv bezieht sich dann auf das Wort davor: عَبَّاسٌ تَاجِرٌ غَنِيٌّ ('Abbasun tajirun ghaniyyun) „Abbas ist ein reicher Haendler\".",
    color: "mubtada",
    source: { folge: 13, video: "Folge 13", approxTimestamp: "14:52", chapter: 9 }
  },
  {
    id: "ta-marbuta-grenzen-01",
    name: "تاء مَرْبُوطة – nicht jedes Wort laesst sich weiblich machen",
    shortExplanation: "Man kann nicht jedes Nomen einfach mit einer تاء مَرْبُوطة weiblich machen. Das geht nur dort, wo es ein weibliches Gegenstueck gibt oder wo es Sinn ergibt – der Lehrer nennt als Beispiele Personengruppen wie Handwerker/Handwerkerin und Esel/Eselin. Bei Sachwoertern geht es nicht; er vergleicht es mit „Hose\", wo es zwar „Hoeschen\", aber kein „Hosi\" gibt. Beim Wort طَائِر (ta'ir, Vogel) wuerde die تاء مَرْبُوطة sogar ein ganz anderes Wort ergeben, naemlich طَائِرَة (ta'ira, Flugzeug) – deshalb bleibt طَائِر maennlich.",
    color: "fem",
    source: { folge: 13, video: "Folge 13", approxTimestamp: "18:21", chapter: 9 }
  },
  {
    id: "adjektive-an-ohne-tanwin-01",
    name: "كَسْلَانُ – Adjektive auf ـانُ ohne Tanwin",
    shortExplanation: "Adjektive, die auf ـان (Alif + Nun) enden, koennen kein Tanwin bekommen – sie haben immer nur eine Endung. Beispiel: طَالِبٌ كَسْلَانُ (talibun kaslanu) „ein fauler Student\"; كَسْلَانُ steht ohne Tanwin, ist aber trotzdem unbestimmt. Der Lehrer nennt weitere Adjektive dieser Art (faul, hungrig, durstig, wuetend, voll) und sagt ausdruecklich, die Begruendung dafuer komme erst spaeter im Buch (etwa Kapitel 20/21).",
    color: "nasab",
    source: { folge: 13, video: "Folge 13", approxTimestamp: "21:37", chapter: 9 },
    source2: { schluessel: 1, lektion: 9, seite: 31 }
  },

  /* ═══════════════════════════════════════════════════════════════════════
     ELF ERGÄNZUNGEN AUS DEN LEHRBÜCHERN — freigegeben von Elias am 18.08.2026

     Seine Worte: „also wenn das aus den büchern ist dann kannst du das machen."
     Das ist die Antwort auf Block B des Entscheidungsbogens vom 16.08.

     ⭐ Diese elf Regeln stammen NICHT aus dem Unterricht. Sie schließen Lücken,
        die beim Abgleich mit Sharḥ Madīnah Buch 1 und Bayna Yadayk Band 2
        aufgefallen sind. Keine davon widerspricht dem Lehrer — er sagt zu
        diesen Punkten nichts.

     ⛔ DESHALB HABEN SIE KEIN `source`, SONDERN `buchQuelle` UND `ergaenzung`.
        Eine erfundene Videofundstelle wäre genau das, was Goal-Prompt E.1
        verbietet. `validate.js` kennt die neue Form seit dem 18.08.2026 und
        verlangt bei `ergaenzung: true` statt `source` eine `buchQuelle`.
        Die Oberfläche schreibt an solche Regeln sichtbar dazu, dass sie aus
        dem Buch stammen — damit Elias bei der Regelfreigabe immer weiß, was
        von seinem Lehrer kommt und was nicht.

     ⚠️ Umkehrbar: `ausgeblendet: true` an einer Regel nimmt sie wieder heraus,
        ohne sie zu löschen (js/saetze.js filtert danach).

     ⚠️ NICHT mit aufgenommen: die Frage, ob ein ظَرْف ein مُضاف ist. Sharḥ
        Madīnah beschriftet خَلْفَ als مُضاف, Elias' Lehrer besteht ausdrücklich
        auf dem Gegenteil („funktioniert wie ein مُضاف, ist aber selbst
        keiner", zarf-als-mudaf-01). Das ist ein echter Widerspruch und keine
        Lücke — er bleibt, wie der Lehrer ihn gesagt hat.
     ═══════════════════════════════════════════════════════════════════════ */

  {
    id: "al-tanwin-tilgung-01",
    name: "اَلْ tilgt das Tanwīn",
    shortExplanation: "Sobald اَلْ vor ein Wort tritt, fällt das Tanwīn weg — beides zusammen geht nicht. Sharḥ Madīnah sagt es in fünf Wörtern: يُحْذَفُ التَّنْوِينُ عِنْدَ دُخُولِ اَلْ („das Tanwīn wird getilgt, wenn اَلْ hinzutritt\"). Richtig: الْقَلَمُ مَكْسُورٌ · الْبَابُ مَفْتُوحٌ · الْوَلَدُ جَالِسٌ. Falsch: الْقَلَمٌ (اَلْ und Tanwīn zugleich) · قَلَمُ (Damma ohne beides) · الْوَلَدٌ جَالِسٌ. Diese Regel setzen sechs andere Regeln bei uns stillschweigend voraus: al-gesamtheit-01 schließt sogar mit dem Satz „Ergänzt die schon bekannte Regel zu اَلْ (bestimmt, Tanwin fällt weg)\" — nur stand sie bis heute nirgends als eigener Eintrag.",
    color: "other",
    kapitel: 3,
    ergaenzung: true,
    buchQuelle: { werk: "sharh-madinah-1", lektion: 3, seite: 6 }
  },
  {
    id: "nakira-marifa-01",
    name: "نَكِرَة / مَعْرِفَة (unbestimmt / bestimmt)",
    shortExplanation: "Das Begriffspaar, das dreizehn unserer Regeln berühren, ohne es je zu erklären. Sharḥ Madīnah: النَّكِرَةُ: شَيْءٌ غَيْرُ مُعَيَّنٍ — das Unbestimmte ist „eine Sache, die nicht bestimmt ist\" (بَيْتٌ، قَلَمٌ، رَجُلٌ، بِنْتٌ); الْمَعْرِفَةُ: شَيْءٌ مُعَيَّنٌ — das Bestimmte ist „eine bestimmte Sache\" (الْبَيْتُ، الْقَلَمُ، الرَّجُلُ، الْبِنْتُ). Der Kern steht in zwei Zeilen: بَيْتٌ: يَشْمَلُ كُلَّ الْبُيُوتِ، وَلَيْسَ بَيْتاً مُعَيَّناً — „ein Haus\" umfasst alle Häuser und ist kein bestimmtes; الْبَيْتُ: يَدُلُّ عَلَى بَيْتٍ مُعَيَّنٍ بِذَاتِهِ — „das Haus\" weist auf ein bestimmtes Haus als solches. Das ist dieselbe Einsicht wie in al-gesamtheit-01, nur vom unbestimmten Wort her gedacht: der Lehrer erklärt die Gesamtheit am bestimmten Wort, das Buch am unbestimmten.",
    color: "other",
    kapitel: 3,
    ergaenzung: true,
    buchQuelle: { werk: "sharh-madinah-1", lektion: 3, seite: 6 },
    /* Ausgeblendet am 18.08.2026, NICHT weil die Regel schlecht waere:
       Rollenregel — am Schriftbild nicht auffindbar.
       Ohne markierten Satz hat eine Regel keinen Zugang in der App — sie
       taucht dann nur als FALSCHE Antwort im Uebungsmodus auf. Sobald ein
       Beispielsatz aus dem Buch dazukommt, faellt diese Zeile weg. */
  },
  {
    id: "iltiqa-sakinain-01",
    name: "اِلْتِقَاءُ السَّاكِنَيْنِ (zwei Vokallose treffen sich)",
    shortExplanation: "Der Fachbegriff zu deiner Regel mina-al-01. Du kennst den Sachverhalt schon — „zwei Sukūn hintereinander mögen die Araber nicht\" — und die Erklärung deines Lehrers ist die bessere zum Behalten. Was fehlte, ist der Name, unter dem es in jeder arabischen Grammatik steht: اِلْتِقَاءُ السَّاكِنَيْنِ, „das Zusammentreffen der beiden Vokallosen\". Sharḥ Madīnah zeigt es an مِنَ الْبَيْتِ: أَصْلُهُ مِنْ الْبَيْتِ — die Grundform ist مِنْ + الْ; dann حُرِّكَتِ النُّونُ بِالْفَتْحَةِ مَنْعاً لالْتِقَاءِ السَّاكِنَيْنِ — „das Nūn wurde mit Fatḥa bewegt, um das Zusammentreffen zweier Vokalloser zu verhindern\". Mit diesem Namen findest du die Regel auch außerhalb dieser App wieder.",
    color: "other",
    kapitel: 4,
    ergaenzung: true,
    buchQuelle: { werk: "sharh-madinah-1", lektion: 4, seite: 8 }
  },
  {
    id: "istifham-madha-01",
    name: "مَاذَا؟ (was?)",
    shortExplanation: "Du hast مَا, aber nicht مَاذَا — die Form, die im Gespräch tatsächlich vorkommt. Sharḥ Madīnah: مَاذَا؟ = مَا هَذَا؟ لِغَيْرِ العاقِلِ — مَاذَا ist dasselbe wie مَا هَذَا und fragt nach dem Nicht-Vernunftbegabten, also nach Sachen, nicht nach Personen. Richtig: مَاذَا عَلَى الْمَكْتَبِ؟ — الْقَلَمُ عَلَى الْمَكْتَبِ. Falsch wäre als Antwort مُحَمَّدٌ عَلَى الْمَكْتَبِ, denn nach einer Person fragt man nicht mit مَاذَا, sondern mit مَنْ.",
    color: "nasab",
    kapitel: 4,
    ergaenzung: true,
    buchQuelle: { werk: "sharh-madinah-1", lektion: 4, seite: 8 },
    /* Ausgeblendet am 18.08.2026, NICHT weil die Regel schlecht waere:
       مَاذَا kommt in keinem der 198 Saetze vor (der eine Treffer war لِمَاذَا, also „warum").
       Ohne markierten Satz hat eine Regel keinen Zugang in der App — sie
       taucht dann nur als FALSCHE Antwort im Uebungsmodus auf. Sobald ein
       Beispielsatz aus dem Buch dazukommt, faellt diese Zeile weg. */
  },
  {
    id: "hurufu-jarr-bedeutungen-01",
    name: "Was die حُرُوفُ الْجَرِّ bedeuten",
    shortExplanation: "Deine Regeln sagen, was die حُرُوفُ الْجَرِّ mit dem Kasus machen — sie ziehen das folgende Wort in den Genitiv. Sie sagen nicht, was die Präpositionen bedeuten. Sharḥ Madīnah stellt es als Liste: مِنْ: تُفِيدُ الْبِدَايَةَ (bezeichnet den Anfang) · إِلَى: تُفِيدُ النِّهَايَةَ (das Ende) · فِي: تُفِيدُ الظَّرْفِيَّةَ (das Enthaltensein) · عَلَى: تُفِيدُ الاسْتِعْلاَءَ (das Daraufsein) · اللاَّمُ: تُفِيدُ الْمِلْكَ (den Besitz). Fürs Koranlesen ist das der nützlichere Teil: den Kasus siehst du am Wortende ohnehin, die Bedeutung nicht.",
    color: "nasab",
    kapitel: 4,
    ergaenzung: true,
    buchQuelle: { werk: "sharh-madinah-1", lektion: 8, seite: 12 }
  },
  {
    id: "mubtada-khabar-genus-01",
    name: "مُبْتَدَأ und خَبَر müssen im Geschlecht übereinstimmen",
    shortExplanation: "Im Nominalsatz richtet sich das Prädikat im Geschlecht nach dem Subjekt. Sharḥ Madīnah setzt es als Gegensatzpaar: الْغُرْفَةُ مَفْتُوحٌ ist falsch, الْغُرْفَةُ مَفْتُوحَةٌ ist richtig — غُرْفَة ist weiblich, also muss auch مَفْتُوحَة weiblich sein. Ebenso in seiner Beispielreihe: مُحَمَّدٌ طَالِبٌ neben فَاطِمَةُ طَالِبَةٌ, الْبَابُ مُغْلَقٌ neben النَّافِذَةُ مَفْتُوحَةٌ. Du hast nat-vier-bedingungen-01 für das Adjektiv am Nomen (مَسْجِدٌ كَبِيرٌ), aber der Nominalsatz ist ein anderer Bau — satz-vs-wortgruppe-01 unterscheidet die beiden sogar ausdrücklich („Das Hemd ist sauber\" ≠ „das saubere Hemd\"), ohne die Kongruenz für den Satzfall zu nennen.",
    color: "mubtada",
    kapitel: 6,
    ergaenzung: true,
    buchQuelle: { werk: "sharh-madinah-1", lektion: 6, seite: 10 },
    /* Ausgeblendet am 18.08.2026, NICHT weil die Regel schlecht waere:
       Rollenregel — welches Wort خَبَر ist, steht in keinem Zeichen.
       Ohne markierten Satz hat eine Regel keinen Zugang in der App — sie
       taucht dann nur als FALSCHE Antwort im Uebungsmodus auf. Sobald ein
       Beispielsatz aus dem Buch dazukommt, faellt diese Zeile weg. */
  },
  {
    id: "badal-01",
    name: "بَدَل (die Ersatzangabe)",
    shortExplanation: "Der Begriff, der eine Frage beantwortet, die deine Regeln offenlassen: warum ist هَذَا الرَّجُلُ تَاجِرٌ ein vollständiger Satz und هَذَا الرَّجُلُ التَّاجِرُ keiner? Sharḥ Madīnah zerlegt den Satz in drei Rollen — هَذَا ist مُبْتَدَأ, الرَّجُلُ ist بَدَل dazu, تَاجِرٌ ist خَبَر. Der بَدَل steht anstelle des Wortes davor und bestimmt es näher; das Prädikat kommt erst danach. Nimmt man dem خَبَر die Unbestimmtheit, wird es zum zweiten بَدَل — und es bleibt kein Prädikat übrig, also auch kein Satz. Ebenso: ذَلِكَ الرَّجُلُ طَبِيبٌ ✔ · ذَلِكَ الرَّجُلُ الطَّبِيبُ ✘. Deine satz-vs-wortgruppe-01 beschreibt genau diesen Unterschied — ohne den Begriff, der ihn erklärt.",
    color: "mubtada",
    kapitel: 6,
    ergaenzung: true,
    buchQuelle: { werk: "sharh-madinah-1", lektion: 8, seite: 12 }
  },
  {
    id: "ismun-mawsul-alladhi-01",
    name: "الَّذِي (welcher, der)",
    shortExplanation: "Das Relativpronomen — bei dir bisher in keiner einzigen Regel. Sharḥ Madīnah stellt es in Lektion 9 direkt neben das نَعْت, weil beide dasselbe leisten: sie bestimmen ein Nomen näher. الَّذِي: اِسْمٌ مَوْصُولٌ لِلْمُفْرَدِ الْمُذَكَّرِ الْعَاقِلِ، وَغَيْرِ الْعَاقِلِ — ein Verbindungswort für das männliche Einzelne, ob vernunftbegabt oder nicht. Für Personen: الطَّالِبُ الَّذِي خَرَجَ مِنَ الْهِنْدِ · الْمُدَرِّسُ الَّذِي جَلَسَ عَلَى الْكُرْسِيِّ جَدِيدٌ. Für Sachen: الْكِتَابُ الَّذِي عَلَى الْمَكْتَبِ لِلْمُدَرِّسِ · الْبَيْتُ الْكَبِيرُ الَّذِي فِي الشَّارِعِ لِلْوَزِيرِ. Bayna Yadayk Band 2 führt es in Einheit 7 ebenfalls neben der الصِّفَة — zwei Lehrwerke stellen denselben Zusammenhang her.",
    color: "other",
    kapitel: 9,
    source: {
      folge: 14,
      video: "Folge 14",
      approxTimestamp: "19:15",
      chapter: 9
    },
    /* Der gedruckte Zweitbeleg — vorher stand die Regel NUR hierauf.
       Seit dem 18.08.2026 ist belegt, dass der Lehrer sie in Folge 14 selbst
       behandelt und dabei den Fachbegriff مَوْصُول nennt. */
    source2: { schluessel: 1, lektion: 9, seite: 13 },
    /* Ausgeblendet am 18.08.2026, NICHT weil die Regel schlecht waere:
       الَّذِي kommt in keinem der 198 Saetze vor.
       Ohne markierten Satz hat eine Regel keinen Zugang in der App — sie
       taucht dann nur als FALSCHE Antwort im Uebungsmodus auf. Sobald ein
       Beispielsatz aus dem Buch dazukommt, faellt diese Zeile weg. */
  },
  {
    id: "zarf-makan-rollenname-01",
    name: "ظَرْفُ مَكَانٍ (der Rollenname der Ortsangabe)",
    shortExplanation: "Deine zuruf-makan-01 zählt die Wörter auf — تَحْتَ, أَمَامَ, خَلْفَ — nennt aber nicht die Rolle, die sie im Satz spielen. Sie heißt ظَرْفُ مَكَانٍ, „Umstandsangabe des Ortes\". Sharḥ Madīnah beschriftet أَمَامَ und خَلْفَ in seinen Satzzerlegungen genau so, und Bayna Yadayk Band 2 nennt denselben Begriff — zwei unabhängige Quellen. Beispiele des Buchs: السَّبُّورَةُ أَمَامَ الطُّلَّابِ · السَّبُّورَةُ خَلْفَ الْمُدَرِّسِ. Mit dem Rollennamen kannst du im I'rāb sagen, was das Wort IST, statt nur, was danach passiert.",
    color: "nasab",
    kapitel: 8,
    ergaenzung: true,
    buchQuelle: { werk: "sharh-madinah-1", lektion: 8, seite: 12 },
    /* Ausgeblendet am 18.08.2026, NICHT weil die Regel schlecht waere:
       die Stelle تَحْتَ السَّرِيرِ ist schon von zarf-01 markiert.
       Ohne markierten Satz hat eine Regel keinen Zugang in der App — sie
       taucht dann nur als FALSCHE Antwort im Uebungsmodus auf. Sobald ein
       Beispielsatz aus dem Buch dazukommt, faellt diese Zeile weg. */
  },
  {
    id: "zarf-mansub-01",
    name: "Das ظَرْف ist selbst مَنْصُوب",
    shortExplanation: "Warum enden أَمَامَ, خَلْفَ, تَحْتَ eigentlich immer auf Fatḥa? Du siehst diese Endung in jedem Beispiel, und deine drei Ortsangaben-Regeln erklären nur, was mit dem Wort DAHINTER passiert (es wird مَجْرُور). Bayna Yadayk Band 2 beantwortet den Rest in zwei Wörtern: ظَرْفُ المَكانِ: اسْمٌ مَنْصُوبٌ يَدُلُّ عَلَى مَكانِ وُقُوعِ الفِعْلِ — „ein Nomen im Akkusativ, das auf den Ort des Geschehens hinweist\". Die Fatḥa ist also kein Zufall, sondern der Kasus des Wortes selbst. Kein Widerspruch zum Unterricht: dein Lehrer besteht darauf, dass das ظَرْف ein اِسْم ist, und genau das sagt Bayna Yadayk auch — er sagt zum Kasus nur nichts.",
    color: "nasab",
    kapitel: 8,
    ergaenzung: true,
    buchQuelle: { werk: "bayna-yadayk-2", lektion: 13, seite: 231 },
    /* Ausgeblendet am 18.08.2026, NICHT weil die Regel schlecht waere:
       dieselbe Stelle, schon von zarf-als-mudaf-01 markiert.
       Ohne markierten Satz hat eine Regel keinen Zugang in der App — sie
       taucht dann nur als FALSCHE Antwort im Uebungsmodus auf. Sobald ein
       Beispielsatz aus dem Buch dazukommt, faellt diese Zeile weg. */
  },
  {
    id: "zuruf-makan-weitere-01",
    name: "Zehn weitere Ortswörter",
    shortExplanation: "Deine Kapitel-8-Regel nennt drei Ortswörter, Bayna Yadayk Band 2 zählt dreizehn auf: أَمامَ, وَراءَ, خَلْفَ, يَمِين, يَسار, بَيْنَ, عِنْدَ, فَوْقَ, تَحْتَ, شَمال, جَنُوب, شَرْق, غَرْب. Alle verhalten sich gleich — sie sind selbst مَنْصُوب und ziehen das folgende Wort in den Genitiv. Beispiele aus dem Buch: تَقَعُ المَدِينَةُ شَمالَ مَكَّةَ · يُصَلِّي الْإِمَامُ أَمامَ المَأْمُومِينَ، وَهُمْ خَلْفَهُ · القَلَمُ فَوْقَ الكِتابِ · الكِتابُ تَحْتَ الحَقِيبَةِ · أُصَلِّي خَلْفَ مَقامِ إِبْراهِيمَ · السَّيّارَةُ وَراءَ الشَّجَرَةِ · الطَّبِيبُ عِنْدَ الْبَابِ.",
    color: "other",
    kapitel: 8,
    ergaenzung: true,
    buchQuelle: { werk: "bayna-yadayk-2", lektion: 13, seite: 231 },
    /* Ausgeblendet am 18.08.2026, NICHT weil die Regel schlecht waere:
       keines der zehn Woerter kommt in einem Satz vor.
       Ohne markierten Satz hat eine Regel keinen Zugang in der App — sie
       taucht dann nur als FALSCHE Antwort im Uebungsmodus auf. Sobald ein
       Beispielsatz aus dem Buch dazukommt, faellt diese Zeile weg. */
  },

  {
    "id": "nat-wen-beschreibt-01",
    "name": "نَعْت: die Endung zeigt, WEN es beschreibt",
    "shortExplanation": "Stehen zwei Nomen hintereinander, entscheidet die Endung des نَعْت, welches der beiden es beschreibt — es muss in allen vier Punkten mit ihm übereinstimmen. Der Lehrer führt das an einem Satz vor: هُوَ اِبْنُ الْمُدِيرِ الْجَدِيدِ heißt „er ist der Sohn des neuen Direktors\", weil الْجَدِيدِ wie الْمُدِيرِ مَجْرُور ist. Schreibt man dagegen الْجَدِيدُ (مَرْفُوع), beschreibt es den Sohn, und der Satz heißt „der Sohn des Direktors ist neu\". Seine Worte dazu: „Das sehen wir, was man ändert, kann man jemand anderen beschreiben. Deswegen muss man immer aufpassen.\" Und: „Man muss immer gucken, wer beschreibt wen.\"",
    "color": "mubtada",
    "kapitel": 9,
    "source": {
      "folge": 14,
      "video": "Folge 14",
      "approxTimestamp": "21:15",
      "chapter": 9
    },
    source2: { schluessel: 3, lektion: 1, seite: 15 }
  },
  {
    "id": "kaf-der-entfernung-01",
    "name": "Das كَ der Entfernung: ذَلِكَ · تِلْكَ · هُنَاكَ",
    "shortExplanation": "Ein angehängtes كَ bedeutet Entfernung. Der Lehrer zeigt es an drei Wörtern, die Elias schon kennt: هُنَا heißt „hier\", هُنَاكَ heißt „dort\" — und dasselbe كَ steckt in ذَلِكَ und تِلْكَ, den Hinweiswörtern für das Ferne. Seine Worte: „Dieses كَ hier symbolisiert die Ferne … Das كَ steht für die Entfernung.\" Damit hängen vier Wörter an einem einzigen Merkmal statt an vier Einzelheiten.",
    "color": "other",
    "kapitel": 9,
    "source": {
      "folge": 14,
      "video": "Folge 14",
      "approxTimestamp": "23:15",
      "chapter": 9
    }
  },
  {
    "id": "inda-ort-und-zeit-01",
    "name": "عِنْدَ ist ein ظَرْف — für Ort UND für Zeit",
    "shortExplanation": "عِنْدَ heißt „bei\" und ist ein ظَرْف. Der Lehrer betont, dass es beides kann: „عِنْدَ kann sowohl Ortsangabe sein, als auch Zeitangabe.\" Örtlich in seinem Beispiel „ich bin beim Direktor\", zeitlich in „zum Faǧr\" und „zum Ẓuhr\". Und es verhält sich wie ein مُضَاف: das folgende Wort steht im Genitiv. ⚠️ Die beiden Gebetsnamen stehen hier absichtlich in Umschrift — ihre vokalisierte arabische Schreibung ist im vorhandenen Bestand nicht belegt und wird nicht erfunden.",
    "color": "idafa",
    "kapitel": 9,
    "source": {
      "folge": 14,
      "video": "Folge 14",
      "approxTimestamp": "17:15",
      "chapter": 9
    }
  },
  {
    "id": "possessiv-endungen-01",
    "name": "Die Besitzendungen ـِي · ـكَ · ـكِ · ـهُ · ـهَا",
    "shortExplanation": "Besitz wird durch eine Endung am Nomen ausgedrückt, nicht durch ein eigenes Wort. Der Lehrer geht sie der Reihe nach durch und nennt jede mit ihrem Vokal: ـِي „meins\", ـكَ „deins\" für Männer („Kev, mit Fetha\"), ـكِ „deins\" für Frauen, ـهُ „seins\", ـهَا „ihres\" („Ha, mit Elif\"). ⭐ Und das Entscheidende: **das Tanwīn fällt weg**, sobald eine Besitzendung dazukommt — aus كِتَابٌ wird kitābu-ka „dein Buch\", aus قَلَمٌ wird qalamu-ka „dein Stift\". Seine Worte: „Tanwīn fällt weg, wird dann verbunden.\" Dasselbe an اِسْم, das nach ihm zweierlei heißen kann, „entweder Name oder Nomen\". ⭐ Damit lernt man nach seinen Worten „durch die Besitzanzeigen ganz, ganz viele Wörter\" auf einmal: أَخٌ · أُخْتٌ · لُغَةٌ · كِتَابٌ tragen alle dieselben fünf Endungen. Ergänzt possessiv-ya-01, das nur das ـِي behandelt.",
    "color": "idafa",
    "kapitel": 10,
    "source": {
      "folge": 15,
      "video": "Folge 15",
      "approxTimestamp": "11:45",
      "chapter": 10
    }
  },
  {
    "id": "li-vs-inda-01",
    "name": "لِ oder عِنْدَ? Untrennbar gegen trennbar",
    "shortExplanation": "Beide heißen auf Deutsch „ich habe\", aber sie sind nicht austauschbar — der Lehrer nennt das ausdrücklich „eine wichtige Regel\". **لِ steht für Dinge, die untrennbar zu einem gehören**: Verwandtschaftsbande (Geschwister, Eltern, Kinder) und Körperteile. **عِنْدَ steht für Dinge, die man von sich trennen kann.** Seine Gegenüberstellung, arabisch gesprochen: „naqūlu ʿindī kitābun, wa-naqūlu lī aḫun, wa-lā naqūlu ʿindī aḫun\" — wir sagen „bei mir ist ein Buch\" und wir sagen „mir gehört ein Bruder\", aber wir sagen NICHT „bei mir ist ein Bruder\". Wörtlich unterscheidet er auch die Bedeutung: عِنْدَ heißt „bei mir ist\", لِ heißt „mir gehört\". ⚠️ Die Beispielsätze stehen hier in Umschrift: عِنْدِي und لِي sind im vorhandenen Wortbestand nicht vokalisiert belegt, und eine Ḥaraka ohne Beleg wird nicht gesetzt.",
    "color": "idafa",
    "kapitel": 10,
    "source": {
      "folge": 15,
      "video": "Folge 15",
      "approxTimestamp": "49:15",
      "chapter": 10
    }
  },
  {
    "id": "tanwin-maennername-ta-01",
    "name": "Männliche Namen auf Tāʾ marbūṭa tragen kein تَنْوين",
    "shortExplanation": "Die dritte und letzte Regel zum Tanwīn bei Eigennamen — der Lehrer baut sie ausdrücklich auf den zwei bekannten auf: „Wir hatten erstmal gesagt, männliche Namen haben Tanwīn. Und dann haben wir gesagt, zweitens, weibliche Namen tragen kein Tanwīn. Drittens, männliche Namen, die auf Tāʾ marbūṭa enden, haben auch kein Tanwīn.\" Seine Beispiele: Ḥamzatu, Usāmatu, Muʿāwiyatu — alle männlich, alle auf Tāʾ marbūṭa, alle ohne Tanwīn. Und er sagt dazu, warum es sich zu merken lohnt: „Wir brauchen diese Regel, die ist wichtig für am Ende des Buches.\" Ergänzt tanwin-eigennamen-01, das nur männlich mit und weiblich ohne Tanwīn behandelt. ⚠️ Die drei Namen stehen in Umschrift: sie sind im vorhandenen Wortbestand nicht vokalisiert belegt.",
    "color": "fem",
    "kapitel": 10,
    "source": {
      "folge": 15,
      "video": "Folge 15",
      "approxTimestamp": "16:15",
      "chapter": 10
    },
    source2: { schluessel: 3, lektion: 34, seite: 265 }
  },
  {
    "id": "asma-khamsa-01",
    "name": "Die fünf Ausnahmewörter: أَبٌ und أَخٌ nehmen ein Wāw",
    "shortExplanation": "Normalerweise hängt die Besitzendung direkt ans Wort. Bei fünf Wörtern nicht — der Lehrer: „es gibt in der arabischen Sprache fünf Ausnahmewörter … bei أَبٌ und bei أَخٌ und bei drei anderen kommt nicht das direkt hinten ran.\" Dort schiebt sich erst ein **Wāw** dazwischen: abū-ka „dein Vater\", aḫū-ka „dein Bruder\" — statt des erwarteten abu-ka. ⭐ **Eine Ausnahme von der Ausnahme:** Bei „mein\" kommt kein Wāw, sondern das Yāʾ direkt dahinter — abī „mein Vater\". Seine Worte: „Außer bei mein. Da kommt das Yāʾ direkt hinten dran. Bei einem anderen kommt immer ein Wāw.\" Die drei übrigen der fünf nennt er nicht: sie kommen erst im zweiten Buch. Das ist hier so festgehalten, statt sie zu ergänzen. ⚠️ abūka, aḫūka und abī stehen in Umschrift — ihre vokalisierte Schreibung ist im vorhandenen Wortbestand nicht belegt.",
    "color": "idafa",
    "kapitel": 10,
    "source": {
      "folge": 16,
      "video": "Folge 16",
      "approxTimestamp": "16:15",
      "chapter": 10
    }
  },
  {
    "id": "hu-nach-kasra-01",
    "name": "Nach كَسْرة wird das هُ zu هِ — فِيهِ statt fīhu",
    "shortExplanation": "Eine Regel, die man hört, bevor man sie versteht: Auf eine كَسْرة folgt nur schwer eine ضَمّة. Der Lehrer beschreibt es an فِي + هُ: „Weil auf ein Kasra auf einmal ein Damma folgt. Das stört die. Deswegen haben sie gesagt: ey warte mal, wir haben ein Kasra … Fīhi ist einfacher als fīhu. Deswegen kriegt das هُ bei فِي ein Kasra.\" Ergebnis: فِيهِ, nicht fīhu. ⭐ Dasselbe Prinzip wie bei اِلْتِقَاءُ السَّاكِنَيْنِ und bei مِنَ الْبَيْتِ — die Sprache weicht der unbequemen Lautfolge aus. Wer das einmal als Muster sieht, muss nicht jede Einzelform lernen.",
    "color": "other",
    "kapitel": 10,
    "source": {
      "folge": 16,
      "video": "Folge 16",
      "approxTimestamp": "26:45",
      "chapter": 10
    },
    source2: { schluessel: 2, lektion: 7, seite: 34 }
  },
  {
    "id": "possessiv-ist-idafa-01",
    "name": "Die Besitzendung IST ein مُضَاف إِلَيْهِ",
    "shortExplanation": "Das ist der Satz, der die Besitzendungen mit etwas verbindet, das du schon kennst. Der Lehrer nimmt كِتَاب + كَ auseinander: das Nomen ist مُضَاف, die Endung ist مُضَاف إِلَيْهِ — „in einem einzigen Wort\". Seine Worte: „Und immer wenn wir so ein Wort haben … ist immer مُضَاف und مُضَاف إِلَيْهِ in einem einzigen Wort.\" Er zeigt es auch an der längeren Kette نَافِذَةٌ + غُرْفَةٌ + „meins\": nāfidatu ġurfatī, „das Fenster meines Zimmers\" — نَافِذَة ist مُضَاف, غُرْفَة ist مُضَاف إِلَيْهِ, und die Besitzendung hängt am Ende noch einmal dasselbe Verhältnis an. ⭐ Damit ist keine neue Grammatik zu lernen: die Besitzanzeige ist die إِضَافَة, die aus Kapitel 5 schon bekannt ist — nur zusammengeschrieben.",
    "color": "idafa",
    "kapitel": 10,
    "source": {
      "folge": 16,
      "video": "Folge 16",
      "approxTimestamp": "33:15",
      "chapter": 10
    }
  },
  {
    "id": "asma-khamsa-vollstaendig-01",
    "name": "الأَسْمَاءُ الخَمْسَةُ — alle fünf, und wann sie gelten",
    "shortExplanation": "Dein Lehrer nennt in Folge 16 nur أَبٌ und أَخٌ und sagt ausdrücklich, die drei übrigen kämen erst im zweiten Buch (asma-khamsa-01). Der deutsche Madina-Schlüssel 3 nennt sie vollständig: أَبٌ، أَخٌ، حَمٌ، فَمٌ، ذُو. ⭐ Und er nennt die Bedingung, unter der die besonderen Endungen überhaupt gelten — im Wortlaut des Buchs: «Diese Nomen bekommen die Sekundären Endungen nur, wenn sie مُضافٌ sind und der مُضافٌ إِلَيْهِ nicht ein Pronomen der ersten Person Singular ist. In dieser Gruppe ist die rafʿ-Endung wāw, die naṣb-Endung alif und die jarr-Endung ist yāʾ.» Damit sind beide Ausnahmen deines Lehrers erklärt: أَبِي (mein Vater) hat kein Wāw, weil dort das Ich-Pronomen steht — und هُوَ أَخٌ hat keins, weil أَخٌ dort gar kein مُضَاف ist. حَمٌ ist laut Fußnote des Buchs «der männliche Verwandte des Ehemanns so wie sein Bruder oder sein Vater». فَمٌ (Mund) geht auf zwei Arten: mit مـ wird es normal dekliniert (فَمُكَ نَظِيفٌ), ohne مـ wie die fünf (فُوكَ صَغِيرٌ).",
    "color": "idafa",
    "ergaenzung": true,
    "kapitel": 10,
    "buchQuelle": {
      "werk": "madina-schluessel-3",
      "lektion": 1,
      "seite": 7
    }
  },
  {
    "id": "mamnu-min-as-sarf-01",
    "name": "المَمْنُوعُ مِنَ الصَّرْفِ — warum manche Wörter kein Tanwīn haben",
    "shortExplanation": "Drei deiner Regeln beschreiben dasselbe Phänomen, ohne es zu benennen: كَسْلَانُ ohne Tanwīn (adjektive-an-ohne-tanwin-01), weibliche Eigennamen ohne Tanwīn (tanwin-eigennamen-01) und männliche Namen auf ة wie أُسَامَةُ (tanwin-maennername-ta-01). Der Name dafür ist المَمْنُوعُ مِنَ الصَّرْفِ — im Wortlaut des Madina-Schlüssels 3: «Es ist ein muʿrab Nomen, welches kein tanwīn akzeptiert.» ⭐ Und bei zweien davon hat dein Lehrer die Begründung ausdrücklich vertagt («die Begründung dafür komme erst später im Buch, etwa Kapitel 20/21»). Hier ist sie, jeweils nur der Teil, der deine Regeln betrifft. **Adjektive:** kein Tanwīn, «wenn sie das Schema فَعْلانُ haben» — das Buch nennt جَوْعانُ، شَبْعانُ، عَطْشانُ، مَلْآنُ, also genau die Reihe deines Lehrers (faul, hungrig, durstig, wütend, voll). **Eigennamen:** kein Tanwīn, «wenn sie weiblich sind» — und dazu der Satz, der أُسَامَةُ erklärt: das Buch nennt Ḥamza als Beispiel und schreibt daneben, es sei «der Name eines Mannes, aber das Wort ist weiblich, da es auf tāʾ marbūṭah (ة) endet». ⚠️ Das ist bewusst nur ein Ausschnitt. Der Schlüssel behandelt in Lektion 34 neun weitere Gründe (Alif der Weiblichkeit, der Plural nach مَفَاعِل, nichtarabische Namen, verbähnliche Formen und andere) — die brauchst du erst, wenn du dort ankommst.",
    "color": "fem",
    "kapitel": 9,
    "ergaenzung": true,
    "buchQuelle": {
      "werk": "madina-schluessel-3",
      "lektion": 34,
      "seite": 265
    }
  }
];

const SENTENCE_TAGS = {
  /* Key = vocab-data.js `id` (stabiler Join-Key, NICHT der Satztext).
     Erzeugt aus den Formen, die im Satz tatsaechlich vorkommen - jede Markierung
     wurde gegen den Satztext geprueft. Hoechstens 3 je Satz, ohne Ueberlappung,
     damit ein Satz lesbar bleibt.

     ⛔ EIN SATZ OHNE MARKIERUNG BEKOMMT KEINEN SCHLUESSEL - auch kein leeres
     Array. Das ist keine Formsache:

     Beim Markierungs-Audit am 28.07.2026 wurden 31 falsche Markierungen
     entfernt. Wo ALLE Markierungen eines Satzes wegfielen, blieb der Schluessel
     mit `[]` zurueck. Funktional harmlos - jeder Aufrufer sichert mit
     `tags && tags.length` oder `|| []` ab. Aber jede Zaehlung ueber
     Object.keys(SENTENCE_TAGS) faellt dadurch zu hoch aus.

     Gemessen am 15.08.2026, vorher gegen nachher:
       vorher   173 Schluessel, davon 2 leer, 342 Markierungen
       nachher  171 Schluessel, davon 0 leer, 342 Markierungen

     Wer also ueber Object.keys() zaehlte, bekam 173 "markierte Saetze" statt
     171. validate.js zog die leeren bereits ab und meldete richtig - aber
     pruefe-markierungen.js und jedes kuenftige Skript taten es nicht. Genau so
     eine Zahl wird spaeter zitiert und niemand rechnet sie nach.

     Entfernt wurden 45878 عَرَبِيَّةٌ und 45883 إِنْجِلِيزِيَّةٌ.

     ⚠️ Das heisst NICHT "zu diesen Saetzen passt keine Regel". Es heisst nur:
     hier ist keine belegt. Neue Markierungen kommen nur mit Beleg dazu (E.1),
     und die Regeln selbst gibt Elias frei. */
  "45751": [
    { ruleId: "nat-vier-bedingungen-01", matchText: "بَيْتٌ جَمِيلٌ" },
    { ruleId: "ismul-isara-hadha-01", matchText: "هَذَا" },
    { ruleId: "madd-tabii-01", matchText: "وَنَظِيفٌ" }
  ],
  "45752": [
    { ruleId: "mina-al-01", matchText: "مِنَ الْبَيْتِ" },
    { ruleId: "nat-vier-bedingungen-01", matchText: "مَسْجِدٌ جَدِيدٌ" },
    { ruleId: "ismul-isara-hadha-01", matchText: "هَذَا" }
  ],
  "45753": [
    { ruleId: "mudaf-ohne-al-01", matchText: "بَابُ" },
    { ruleId: "mudaf-ilayh-01", matchText: "الْبَيْتِ" },
    { ruleId: "marfu-grundfall-01", matchText: "جَدِيدٌ" }
  ],
  "45754": [
    { ruleId: "nat-vier-bedingungen-01", matchText: "كِتَابٌ قَدِيمٌ" },
    { ruleId: "ismul-isara-hadha-01", matchText: "هَذَا" }
  ],
  "45755": [
    { ruleId: "alif-maqsura-01", matchText: "عَلَى" },
    { ruleId: "nat-vier-bedingungen-01", matchText: "قَلَمٌ صَغِيرٌ" },
    { ruleId: "hamzatul-wasl-01", matchText: "الْمَكْتَبِ" }
  ],
  "45756": [
    { ruleId: "mudaf-ohne-al-01", matchText: "مِفْتَاحُ" },
    { ruleId: "mudaf-ilayh-01", matchText: "الْبَابِ" },
    { ruleId: "hurufu-jarr-bedeutungen-01", matchText: "فِي الْحَقِيبَةِ" }
  ],
  "45757": [
    { ruleId: "ta-marbuta-fem-01", matchText: "الْمَدْرَسَةِ" },
    { ruleId: "nat-vier-bedingungen-01", matchText: "مَكْتَبٌ جَدِيدٌ" }
  ],
  "45758": [
    { ruleId: "ta-marbuta-fem-01", matchText: "الْغُرْفَةِ" },
    { ruleId: "nat-vier-bedingungen-01", matchText: "سَرِيرٌ صَغِيرٌ" }
  ],
  "45759": [
    { ruleId: "nat-vier-bedingungen-01", matchText: "قَدِيمٌ وَثَقِيلٌ" },
    { ruleId: "ismul-isara-hadha-01", matchText: "هَذَا" }
  ],
  "45760": [
    { ruleId: "schams-qamar-01", matchText: "السَّمَاءِ" },
    { ruleId: "nat-vier-bedingungen-01", matchText: "نَجْمٌ بَعِيدٌ" }
  ],
  "45761": [
    { ruleId: "alif-maqsura-01", matchText: "الْمُسْتَشْفَى" },
    { ruleId: "schams-qamar-01", matchText: "الطَّبِيبُ" }
  ],
  "45762": [
    { ruleId: "ismul-isara-hadha-01", matchText: "هَذَا" },
    { ruleId: "schakl-01", matchText: "مُجْتَهِدٌ" }
  ],
  "45763": [
    { ruleId: "ta-marbuta-fem-01", matchText: "الْجَامِعَةِ" }
  ],
  "45764": [
    { ruleId: "ismul-isara-hadha-01", matchText: "هَذَا" },
    { ruleId: "schakl-01", matchText: "وَمَشْهُورٌ" },
    { ruleId: "taschkil-kontext-01", matchText: "رَجُلٌ" }
  ],
  "45765": [
    { ruleId: "schams-qamar-01", matchText: "التَّاجِرُ" },
    { ruleId: "hamzatul-wasl-01", matchText: "الْآنَ" }
  ],
  "45766": [
    { ruleId: "ismul-isara-hadha-01", matchText: "هَذَا" }
  ],
  "45767": [
    { ruleId: "zarf-01", matchText: "تَحْتَ السَّرِيرِ" },
    { ruleId: "ismul-isara-hadha-01", matchText: "هَذَا" },
    { ruleId: "nakira-marifa-01", matchText: "قِطٌّ" }
  ],
  "45768": [
    { ruleId: "mina-al-01", matchText: "مِنَ الْبَيْتِ" },
    { ruleId: "hadha-dies-nicht-das-01", matchText: "هَذَا" }
  ],
  "45769": [
    { ruleId: "hadha-dies-nicht-das-01", matchText: "هَذَا" }
  ],
  "45770": [
    { ruleId: "hadha-dies-nicht-das-01", matchText: "هَذَا" }
  ],
  "45771": [
    { ruleId: "mina-al-01", matchText: "مِنَ الْبَيْتِ" },
    { ruleId: "hadha-dies-nicht-das-01", matchText: "هَذَا" },
    { ruleId: "marfu-grundfall-01", matchText: "دِيكٌ" }
  ],
  "45772": [
    { ruleId: "schams-qamar-01", matchText: "الثَّانَوِيَّةِ" },
    { ruleId: "hadha-dies-nicht-das-01", matchText: "هَذَا" },
    { ruleId: "mudarris-lesung-herkunft-01", matchText: "مُدَرِّسٌ" }
  ],
  "45773": [
    { ruleId: "harf-jarr-fi-ala-01", matchText: "فِي الْحَقِيبَةِ" },
    { ruleId: "hadha-dies-nicht-das-01", matchText: "هَذَا" },
    { ruleId: "marfu-grundfall-01", matchText: "مِنْدِيلٌ" }
  ],
  "45774": [
    { ruleId: "fragepartikel-alif-01", matchText: "أَ" },
    { ruleId: "marfu-grundfall-01", matchText: "كِتَابٌ" },
    { ruleId: "fragepartikel-erforderlich-01", matchText: "؟" }
  ],
  "45775": [
    { ruleId: "fragepartikel-alif-01", matchText: "أَ" },
    { ruleId: "marfu-grundfall-01", matchText: "بَيْتٌ" }
  ],
  "45776": [
    { ruleId: "fragepartikel-alif-01", matchText: "أَ" }
  ],
  "45777": [
    { ruleId: "istifham-ma-01", matchText: "مَا" },
    { ruleId: "marfu-grundfall-01", matchText: "كِتَابٌ" }
  ],
  "45778": [
    { ruleId: "hadha-dies-nicht-das-01", matchText: "هَذَا" },
    { ruleId: "marfu-grundfall-01", matchText: "قَلَمٌ" }
  ],
  "45779": [
    { ruleId: "istifham-men-01", matchText: "مَنْ" },
    { ruleId: "ismul-isara-dhalika-01", matchText: "ذَلِكَ" },
    { ruleId: "marfu-grundfall-01", matchText: "إِمَامٌ" }
  ],
  "45780": [
    { ruleId: "hadha-dies-nicht-das-01", matchText: "هَذَا" },
    { ruleId: "nominalsatz-ohne-kopula-01", matchText: "حَجَرٌ" }
  ],
  "45781": [
    { ruleId: "ismul-isara-dhalika-01", matchText: "ذَلِكَ" },
    { ruleId: "nominalsatz-ohne-kopula-01", matchText: "سُكَّرٌ" }
  ],
  "45782": [
    { ruleId: "nominalsatz-ohne-kopula-01", matchText: "لَبَنٌ" },
    { ruleId: "schakl-01", matchText: "حُلْوٌ" }
  ],
  "45783": [
    { ruleId: "hadha-al-kein-satz-01", matchText: "التَّاجِرُ" }
  ],
  "45784": [
    { ruleId: "hadha-al-kein-satz-01", matchText: "الرَّجُلُ" }
  ],
  "45785": [
    { ruleId: "hadha-al-kein-satz-01", matchText: "الشَّارِعُ" },
    { ruleId: "hadha-stummes-alif-01", matchText: "هَذَا" }
  ],
  "45786": [
    { ruleId: "hadha-al-kein-satz-01", matchText: "الْقَلَمُ" },
    { ruleId: "hadha-stummes-alif-01", matchText: "هَذَا" }
  ],
  "45787": [
    { ruleId: "mubtada-khabar-01", matchText: "الْمَاءُ" },
    { ruleId: "hamzatul-wasl-01", matchText: "الْيَوْمَ" }
  ],
  "45788": [
    { ruleId: "schams-qamar-01", matchText: "الشَّايُ" }
  ],
  "45789": [
    { ruleId: "alif-maqsura-01", matchText: "عَلَى" },
    { ruleId: "hamzatul-wasl-01", matchText: "الْكُرْسِيِّ" },
    { ruleId: "al-tanwin-tilgung-01", matchText: "الطَّالِبُ" }
  ],
  "45790": [
    { ruleId: "mubtada-khabar-01", matchText: "الْوَلَدُ" },
    { ruleId: "mina-al-01", matchText: "مِنَ الْبَابِ" }
  ],
  "45791": [
    { ruleId: "hadha-al-kein-satz-01", matchText: "الْكِتَابُ" },
    { ruleId: "hadha-stummes-alif-01", matchText: "هَذَا" }
  ],
  "45792": [
    { ruleId: "hadha-al-kein-satz-01", matchText: "الْمَسْجِدُ" },
    { ruleId: "hadha-stummes-alif-01", matchText: "هَذَا" }
  ],
  "45793": [
    { ruleId: "mubtada-khabar-01", matchText: "الْمَدْرَسَةُ" },
    { ruleId: "mina-al-01", matchText: "مِنَ الْبَيْتِ" },
    { ruleId: "mubtada-khabar-genus-01", matchText: "قَرِيبَةٌ" }
  ],
  "45794": [
    { ruleId: "mubtada-khabar-01", matchText: "الْجَامِعَةُ" },
    { ruleId: "mina-al-01", matchText: "مِنَ الْبَيْتِ" }
  ],
  "45795": [
    { ruleId: "hadha-al-kein-satz-01", matchText: "الْمِنْدِيلُ" },
    { ruleId: "hadha-stummes-alif-01", matchText: "هَذَا" }
  ],
  "45796": [
    { ruleId: "hadha-al-kein-satz-01", matchText: "الْكَلْبُ" },
    { ruleId: "hadha-stummes-alif-01", matchText: "هَذَا" }
  ],
  "45797": [
    { ruleId: "hamzatul-wasl-01", matchText: "الْقِطُّ" },
    { ruleId: "hadha-stummes-alif-01", matchText: "هَذَا" }
  ],
  "45798": [
    { ruleId: "mubtada-khabar-01", matchText: "الْمَسْجِدُ" }
  ],
  "45799": [
    { ruleId: "hamzatul-wasl-01", matchText: "الْكِتَابُ" },
    { ruleId: "hadha-stummes-alif-01", matchText: "هَذَا" },
    { ruleId: "irab-drei-faelle-01", matchText: "خَفِيفٌ" }
  ],
  "45800": [
    { ruleId: "hamzatul-wasl-01", matchText: "الْحَجَرُ" },
    { ruleId: "irab-drei-faelle-01", matchText: "ثَقِيلٌ" },
    { ruleId: "madd-tabii-01", matchText: "هَذَا" }
  ],
  "45801": [
    { ruleId: "alif-maqsura-01", matchText: "عَلَى" },
    { ruleId: "hamzatul-wasl-01", matchText: "الْمَكْتَبِ" },
    { ruleId: "nominalsatz-ohne-kopula-01", matchText: "وَرَقٌ" }
  ],
  "45802": [
    { ruleId: "nominalsatz-ohne-kopula-01", matchText: "مَاءٌ" },
    { ruleId: "madd-tabii-01", matchText: "هَذَا" }
  ],
  "45803": [
    { ruleId: "nominalsatz-ohne-kopula-01", matchText: "تُفَّاحٌ" },
    { ruleId: "schakl-01", matchText: "حُلْوٌ" },
    { ruleId: "madd-tabii-01", matchText: "هَذَا" }
  ],
  "45804": [
    { ruleId: "mina-al-01", matchText: "مِنَ السُّوقِ" },
    { ruleId: "nominalsatz-ohne-kopula-01", matchText: "دُكَّانٌ" }
  ],
  "45805": [
    { ruleId: "irab-drei-faelle-01", matchText: "جَمِيلٌ" },
    { ruleId: "madd-tabii-01", matchText: "هَذَا" },
    { ruleId: "al-tanwin-tilgung-01", matchText: "الْبَيْتُ" }
  ],
  "45806": [
    { ruleId: "schams-qamar-01", matchText: "الشَّايُ" },
    { ruleId: "irab-drei-faelle-01", matchText: "حُلْوٌ" },
    { ruleId: "madd-tabii-01", matchText: "هَذَا" }
  ],
  "45807": [
    { ruleId: "alif-maqsura-01", matchText: "الْمُسْتَشْفَى" }
  ],
  "45808": [
    { ruleId: "mina-al-01", matchText: "مِنَ الْيَابَانِ" }
  ],
  "45809": [
    { ruleId: "alif-maqsura-01", matchText: "إِلَى" },
    { ruleId: "harf-jarr-min-ila-01", matchText: "مِنَ الْبَيْتِ" },
    { ruleId: "ta-marbuta-fem-01", matchText: "الْجَامِعَةِ" }
  ],
  "45810": [
    { ruleId: "istifham-ayna-01", matchText: "أَيْنَ" }
  ],
  "45811": [
    { ruleId: "alif-maqsura-01", matchText: "عَلَى" }
  ],
  "45812": [
    { ruleId: "harf-jarr-fi-ala-01", matchText: "فِي الْحَقِيبَةِ" }
  ],
  "45813": [
    { ruleId: "harf-jarr-min-ila-01", matchText: "مِنَ الْفِلِيبِّينِ" },
    { ruleId: "madd-tabii-01", matchText: "هَذَا" }
  ],
  "45814": [
    { ruleId: "harf-jarr-min-ila-01", matchText: "مِنَ الْيَابَانِ" },
    { ruleId: "ismul-isara-hadhihi-01", matchText: "هَذِهِ" },
    { ruleId: "ta-marbuta-fem-01", matchText: "سَيَّارَةٌ" }
  ],
  "45815": [
    { ruleId: "harf-jarr-min-ila-01", matchText: "مِنَ الصِّينِ" },
    { ruleId: "madd-tabii-01", matchText: "هَذَا" }
  ],
  "45816": [
    { ruleId: "harf-jarr-min-ila-01", matchText: "مِنَ الْهِنْدِ" },
    { ruleId: "schams-qamar-01", matchText: "الشَّايُ" },
    { ruleId: "madd-tabii-01", matchText: "هَذَا" }
  ],
  "45817": [
    { ruleId: "mutabaqa-genus-01", matchText: "نَظِيفَةٌ" },
    { ruleId: "ismul-isara-hadhihi-01", matchText: "هَذِهِ" },
    { ruleId: "ta-marbuta-fem-01", matchText: "مَدْرَسَةٌ" }
  ],
  "45818": [
    { ruleId: "mutabaqa-genus-01", matchText: "قَدِيمَةٌ" },
    { ruleId: "harf-jarr-min-ila-01", matchText: "مِنَ الْبَيْتِ" },
    { ruleId: "ismul-isara-hadhihi-01", matchText: "هَذِهِ" }
  ],
  "45819": [
    { ruleId: "mutabaqa-genus-01", matchText: "مَشْهُورَةٌ" },
    { ruleId: "ismul-isara-hadhihi-01", matchText: "هَذِهِ" },
    { ruleId: "ta-marbuta-fem-01", matchText: "جَامِعَةٌ" }
  ],
  "45820": [
    { ruleId: "harf-jarr-fi-ala-01", matchText: "فِي الْمَكْتَبِ" }
  ],
  "45821": [
    { ruleId: "mutabaqa-genus-01", matchText: "نَظِيفَةٌ" },
    { ruleId: "ismul-isara-hadhihi-01", matchText: "هَذِهِ" },
    { ruleId: "ta-marbuta-fem-01", matchText: "غُرْفَةٌ" }
  ],
  "45822": [
    { ruleId: "nominalsatz-ohne-kopula-01", matchText: "حَمَّامٌ" },
    { ruleId: "jumla-ismiya-filiya-01", matchText: "هَذَا" }
  ],
  "45823": [
    { ruleId: "irab-drei-faelle-01", matchText: "مَطْبَخٌ" },
    { ruleId: "jumla-ismiya-filiya-01", matchText: "هَذَا" }
  ],
  "45824": [
    { ruleId: "harf-jarr-fi-ala-01", matchText: "فِي السَّمَاءِ" },
    { ruleId: "schams-qamar-01", matchText: "النَّجْمُ" }
  ],
  "45825": [
    { ruleId: "harf-jarr-fi-ala-01", matchText: "فِي الْجَامِعَةِ" },
    { ruleId: "irab-drei-faelle-01", matchText: "فَصْلٌ" },
    { ruleId: "jumla-ismiya-filiya-01", matchText: "هَذَا" }
  ],
  "45826": [
    { ruleId: "istifham-ayna-01", matchText: "أَيْنَ" }
  ],
  "45827": [
    { ruleId: "irab-drei-faelle-01", matchText: "رَسُولٌ" },
    { ruleId: "schakl-01", matchText: "مَشْهُورٌ" },
    { ruleId: "jumla-ismiya-filiya-01", matchText: "هَذَا" }
  ],
  "45828": [
    { ruleId: "zarf-als-mudaf-01", matchText: "تَحْتَ السَّرِيرِ" },
    { ruleId: "nakira-marifa-01", matchText: "الْقِطُّ" }
  ],
  "45829": [
    { ruleId: "al-gesamtheit-01", matchText: "الْوَلَدِ" },
    { ruleId: "jumla-ismiya-filiya-01", matchText: "هَذَا" }
  ],
  "45830": [
    { ruleId: "mudaf-ohne-al-01", matchText: "اِبْنُ" },
    { ruleId: "mudaf-ilayh-01", matchText: "التَّاجِرِ" },
    { ruleId: "jumla-ismiya-filiya-01", matchText: "هَذَا" }
  ],
  "45831": [
    { ruleId: "irab-drei-faelle-01", matchText: "شَارِعٌ" },
    { ruleId: "jumla-ismiya-filiya-01", matchText: "هَذَا" }
  ],
  "45832": [
    { ruleId: "mudaf-ohne-al-01", matchText: "سَيَّارَةُ" },
    { ruleId: "mudaf-ilayh-01", matchText: "الْمُدِيرِ" },
    { ruleId: "ismul-isara-hadhihi-01", matchText: "هَذِهِ" }
  ],
  "45833": [
    { ruleId: "nat-fem-01", matchText: "قَدِيمَةٌ وَمَشْهُورَةٌ" },
    { ruleId: "ismul-isara-hadhihi-01", matchText: "هَذِهِ" },
    { ruleId: "ta-marbuta-grenzen-01", matchText: "الْكَعْبَةُ" }
  ],
  "45834": [
    { ruleId: "al-gesamtheit-01", matchText: "الْمُدَرِّسُ" }
  ],
  "45835": [
    { ruleId: "mudaf-ohne-al-01", matchText: "خَالُ" },
    { ruleId: "mudaf-ilayh-01", matchText: "الْبِنْتِ" },
    { ruleId: "jumla-ismiya-filiya-01", matchText: "هَذَا" }
  ],
  "45836": [
    { ruleId: "ta-marbuta-grenzen-01", matchText: "الْمَكْتَبَةُ" },
    { ruleId: "kaf-der-entfernung-01", matchText: "هُنَاكَ" }
  ],
  "45837": [
    { ruleId: "mudaf-ohne-al-01", matchText: "بَابُ" },
    { ruleId: "mudaf-ilayh-01", matchText: "الدُّكَّانِ" },
    { ruleId: "al-gesamtheit-01", matchText: "الْآنَ" }
  ],
  "45838": [
    { ruleId: "mudaf-ohne-al-01", matchText: "بِنْتُ" },
    { ruleId: "mudaf-ilayh-01", matchText: "الْمُدَرِّسِ" },
    { ruleId: "ismul-isara-hadhihi-01", matchText: "هَذِهِ" }
  ],
  "45839": [
    { ruleId: "istifham-ma-01", matchText: "مَا" },
    { ruleId: "al-gesamtheit-01", matchText: "الْوَلَدِ" },
    { ruleId: "schakl-01", matchText: "اِسْمُ" }
  ],
  "45840": [
    { ruleId: "mudaf-ohne-al-01", matchText: "حَقِيبَةُ" },
    { ruleId: "isara-genus-kongruenz-01", matchText: "هَذِهِ" },
    { ruleId: "mudaf-ilayh-01", matchText: "الطَّالِبِ" }
  ],
  "45841": [
    { ruleId: "mutabaqa-genus-01", matchText: "جَدِيدَةٌ" },
    { ruleId: "harf-jarr-fi-ala-01", matchText: "فِي الْمَطْبَخِ" },
    { ruleId: "isara-genus-kongruenz-01", matchText: "هَذِهِ" }
  ],
  "45842": [
    { ruleId: "mutabaqa-genus-01", matchText: "كَبِيرَةٌ" },
    { ruleId: "isara-genus-kongruenz-01", matchText: "هَذِهِ" },
    { ruleId: "ta-marbuta-grenzen-01", matchText: "بَقَرَةٌ" }
  ],
  "45843": [
    { ruleId: "mutabaqa-genus-01", matchText: "جَدِيدَةٌ" },
    { ruleId: "isara-genus-kongruenz-01", matchText: "هَذِهِ" },
    { ruleId: "ta-marbuta-grenzen-01", matchText: "دَرَّاجَةٌ" }
  ],
  "45844": [
    { ruleId: "mutabaqa-genus-01", matchText: "نَظِيفَةٌ" },
    { ruleId: "isara-genus-kongruenz-01", matchText: "هَذِهِ" },
    { ruleId: "ta-marbuta-grenzen-01", matchText: "مِلْعَقَةٌ" }
  ],
  "45845": [
    { ruleId: "schakl-01", matchText: "مُجْتَهِدٌ" },
    { ruleId: "wortstellung-fokus-01", matchText: "هَذَا" }
  ],
  "45846": [
    { ruleId: "isara-genus-kongruenz-01", matchText: "هَذِهِ" },
    { ruleId: "al-gesamtheit-01", matchText: "الْبِنْتِ" }
  ],
  "45847": [
    { ruleId: "schakl-01", matchText: "مُجْتَهِدٌ" },
    { ruleId: "wortstellung-fokus-01", matchText: "هَذَا" }
  ],
  "45848": [
    { ruleId: "nat-fem-01", matchText: "ثَلَّاجَةٌ جَدِيدَةٌ" },
    { ruleId: "harf-jarr-fi-ala-01", matchText: "فِي الْمَطْبَخِ" },
    { ruleId: "isara-genus-kongruenz-01", matchText: "هَذِهِ" }
  ],
  "45849": [
    { ruleId: "wortstellung-fokus-01", matchText: "هَذَا" }
  ],
  "45850": [
    { ruleId: "harf-jarr-fi-ala-01", matchText: "فِي الْغَرْبِ" },
    { ruleId: "al-gesamtheit-01", matchText: "الْبَيْتُ" }
  ],
  "45851": [
    { ruleId: "isara-genus-kongruenz-01", matchText: "هَذِهِ" },
    { ruleId: "ta-marbuta-grenzen-01", matchText: "قَهْوَةٌ" }
  ],
  "45852": [
    { ruleId: "koerperteile-genus-01", matchText: "أَنْفٌ" },
    { ruleId: "wortstellung-fokus-01", matchText: "هَذَا" }
  ],
  "45853": [
    { ruleId: "koerperteile-genus-01", matchText: "فَمٌ" },
    { ruleId: "wortstellung-fokus-01", matchText: "هَذَا" }
  ],
  "45854": [
    { ruleId: "ta-marbuta-grenzen-01", matchText: "ثَقِيلَةٌ" },
    { ruleId: "harf-jarr-01", matchText: "فِي الْمَطْبَخِ" },
    { ruleId: "wortstellung-fokus-01", matchText: "هَذِهِ" }
  ],
  "45855": [
    { ruleId: "fem-ohne-ta-marbuta-01", matchText: "أُذُنٌ" },
    { ruleId: "ta-marbuta-grenzen-01", matchText: "صَغِيرَةٌ" },
    { ruleId: "wortstellung-fokus-01", matchText: "هَذِهِ" }
  ],
  "45856": [
    { ruleId: "fem-ohne-ta-marbuta-01", matchText: "عَيْنٌ" },
    { ruleId: "wortstellung-fokus-01", matchText: "هَذِهِ" }
  ],
  "45857": [
    { ruleId: "fem-ohne-ta-marbuta-01", matchText: "يَدُ" },
    { ruleId: "idafa-zweitglied-01", matchText: "الطَّبِيبِ" },
    { ruleId: "wortarten-01", matchText: "هَذِهِ" }
  ],
  "45858": [
    { ruleId: "idafa-zweitglied-01", matchText: "الْكُرْسِيِ" },
    { ruleId: "wortarten-01", matchText: "هَذِهِ" },
    { ruleId: "taschkil-kontext-01", matchText: "رِجْلُ" }
  ],
  "45859": [
    { ruleId: "wortarten-01", matchText: "هَذَا" }
  ],
  "45860": [
    { ruleId: "nat-fem-01", matchText: "نَافِذَةٌ مُغْلَقَةٌ" },
    { ruleId: "harf-jarr-01", matchText: "فِي الْغُرْفَةِ" },
    { ruleId: "wortarten-01", matchText: "هَذِهِ" }
  ],
  "45861": [
    { ruleId: "schams-qamar-merkhilfe-01", matchText: "الشَّرْقِ" },
    { ruleId: "al-gesamtheit-01", matchText: "الْمَسْجِدُ" }
  ],
  "45862": [
    { ruleId: "ismul-isara-tilka-01", matchText: "تِلْكَ" },
    { ruleId: "nat-fem-01", matchText: "نَاقَةٌ طَوِيلَةٌ" }
  ],
  "45863": [
    { ruleId: "ismul-isara-tilka-01", matchText: "تِلْكَ" }
  ],
  "45864": [
    { ruleId: "ismul-isara-tilka-01", matchText: "تِلْكَ" },
    { ruleId: "alif-maqsura-01", matchText: "الْمُسْتَشْفَى" },
    { ruleId: "nat-fem-01", matchText: "مُمَرِّضَةٌ مُجْتَهِدَةٌ" }
  ],
  "45865": [
    { ruleId: "ismul-isara-tilka-01", matchText: "تِلْكَ" },
    { ruleId: "nat-fem-01", matchText: "بَيْضَةٌ بَارِدَةٌ" }
  ],
  "45866": [
    { ruleId: "wortarten-01", matchText: "هَذَا" }
  ],
  "45867": [
    { ruleId: "ismul-isara-tilka-01", matchText: "تِلْكَ" },
    { ruleId: "nat-fem-01", matchText: "دَجَاجَةٌ صَغِيرَةٌ" }
  ],
  "45868": [
    { ruleId: "harf-jarr-min-ila-01", matchText: "مِنْ أَمْرِيكَا" },
    { ruleId: "schams-qamar-merkhilfe-01", matchText: "الطَّبِيبُ" },
    { ruleId: "wortarten-01", matchText: "هَذَا" }
  ],
  "45869": [
    { ruleId: "wortarten-01", matchText: "هَذَا" }
  ],
  "45870": [
    { ruleId: "harf-jarr-min-ila-01", matchText: "مِنْ أَلْمَانِيَا" },
    { ruleId: "wortarten-01", matchText: "هَذَا" }
  ],
  "45871": [
    { ruleId: "schams-qamar-merkhilfe-01", matchText: "السَّيَّارَةُ" },
    { ruleId: "harf-jarr-01", matchText: "مِنْ إِنْجِلْتَرَا" },
    { ruleId: "ismul-isara-hadhihi-01", matchText: "هَذِهِ" }
  ],
  "45872": [
    { ruleId: "schams-qamar-merkhilfe-01", matchText: "الرَّجُلُ" },
    { ruleId: "harf-jarr-01", matchText: "مِنَ الْعِرَاقِ" }
  ],
  "45873": [
    { ruleId: "harf-jarr-01", matchText: "مِنْ سُوِيسْرَا" },
    { ruleId: "al-gesamtheit-01", matchText: "الْمُدَرِّسُ" }
  ],
  "45874": [
    { ruleId: "alif-maqsura-unveraenderlich-01", matchText: "مُسْتَشْفًى" }
  ],
  "45875": [
    { ruleId: "nat-fem-01", matchText: "فَاكِهَةٌ حُلْوَةٌ" },
    { ruleId: "ismul-isara-hadhihi-01", matchText: "هَذِهِ" }
  ],
  "45877": [
    { ruleId: "schams-qamar-merkhilfe-01", matchText: "السَّمَاءِ" }
  ],
  "45881": [
    { ruleId: "ismul-isara-hadhihi-01", matchText: "هَذِهِ" }
  ],
  "45886": [
    { ruleId: "mubtada-khabar-01", matchText: "الْقَاهِرَةُ" }
  ],
  "45890": [
    { ruleId: "harf-jarr-01", matchText: "مِنَ الْجَامِعَةِ" },
    { ruleId: "ismul-isara-hadhihi-01", matchText: "هَذِهِ" }
  ],
  "45891": [
    { ruleId: "harf-jarr-01", matchText: "فِي الْمَكْتَبِ" }
  ],
  "45892": [
    { ruleId: "harf-jarr-01", matchText: "مِنَ الْبَيْتِ" }
  ],
  "45880": [
    { ruleId: "badal-01", matchText: "هَذَا الْكِتَابُ" }
  ],
  "45884": [
    { ruleId: "badal-01", matchText: "هَذَا الْكِتَابُ" }
  ],
  "45894": [
    { ruleId: "schams-qamar-merkhilfe-01", matchText: "الرَّجُلُ" },
    { ruleId: "iltiqa-sakinain-01", matchText: "مِنَ الْكُوَيْتِ" }
  ],
  "45897": [
    { ruleId: "schams-qamar-merkhilfe-01", matchText: "السِّكِّينُ" }
  ],
  "45898": [
    { ruleId: "schams-qamar-merkhilfe-01", matchText: "الطَّالِبُ" }
  ],
  "0f311405-7349-450c-885e-e3abefb6fbf3": [
    { ruleId: "li-al-lil-01", matchText: "لِلْوَلَدِ" }
  ],
  "69179bbf-faa9-4b2a-859c-9e5f3d76b98c": [
    { ruleId: "ya-nida-01", matchText: "يَا وَلَدُ" }
  ],
  "c73787a3-8f9c-4033-b1ff-5644f34995d3": [
    { ruleId: "huwa-hiya-01", matchText: "هُوَ" },
    { ruleId: "mudaf-01", matchText: "بَابُ" },
    { ruleId: "idafa-zweitglied-01", matchText: "الْبَيْتِ" }
  ],
  "c623f2fb-57a5-48b6-b176-55df461b2ada": [
    /* Elias am 30.07.2026 zu dieser Karte: "das sind keine genitiv praepositionen.
       und da fehlt noch Li als genitiv praepositionen." Beides stimmte:
       - Die Aufzaehlung nannte nur vier.  sagt woertlich, لِ sei
         "der fuenfte Harf al-Jarr nach فِي، عَلَى، إِلَى، مِنْ" (Folge 09 ca. 35:14,
         Schl. 1 L6 S. 23) - der Satz ist also ergaenzt, nicht erfunden.
       - Unterstrichen war einzig هِيَ. In einem Satz, dessen ganzer Zweck die
         Aufzaehlung der Genitivpartikeln ist, war damit das Pronomen markiert und
         die Partikeln nicht. Jetzt steht die Markierung auf der Aufzaehlung. */
    { ruleId: "harf-jarr-01", matchText: "فِي، عَلَى، إِلَى، مِنْ، لِ" },
    { ruleId: "huwa-hiya-01", matchText: "هِيَ" }
  ],
  "0e23a52d-e2f5-4a57-9082-58eb9f362d88": [
    { ruleId: "mubtada-khabar-01", matchText: "الْبَيْتُ" }
  ],
  "45882": [
    { ruleId: "taschkil-kontext-01", matchText: "الْمُدَرِّسُ" }
  ],

  /* --- Saetze aus dem Lehrwerk (lehrbuch-saetze.js) ---
     Die arabicroots-Beispielsaetze sind rein nominal; Verben, Fragewoerter,
     Gottesname und Eigennamen kommen darin nicht vor. Diese Markierungen
     haengen deshalb an Saetzen aus Madina Buch 1 - jeder mit Buchseite
     belegt, keiner erfunden. */
  "mb1-13-1": [
    { ruleId: "fragepartikel-hal-01", matchText: "أَذَلِكَ" }
  ],
  "mb1-15-1": [
    { ruleId: "satz-vs-wortgruppe-01", matchText: "الْقَمِيصُ وَسِخٌ" }
  ],
  "mb1-17-1": [
    { ruleId: "idafa-kein-adjektiv-01", matchText: "الطَّالِبُ مَرِيضٌ" }
  ],
  "mb1-21-1": [
    { ruleId: "eigennamen-fem-ohne-tanwin-01", matchText: "آمِنَةُ" },
    { ruleId: "istifham-ayna-01", matchText: "أَيْنَ" },
    { ruleId: "huwa-hiya-01", matchText: "هِيَ" }
  ],
  "mb1-24-1": [
    { ruleId: "min-ayna-01", matchText: "مِنْ أَيْنَ" }
  ],
  "mb1-25-1": [
    { ruleId: "min-man-unterscheiden-01", matchText: "مَنْ مِنَ" },
    { ruleId: "tanwin-eigennamen-01", matchText: "عَمَّارٌ" }
  ],
  "mb1-25-2": [
    { ruleId: "verb-enthaelt-pronomen-01", matchText: "خَرَجَ" }
  ],
  "mb1-27-1": [
    { ruleId: "idafa-01", matchText: "كِتَابُ حَامِدٍ" }
  ],
  "mb1-27-2": [
    { ruleId: "harf-jarr-idafa-01", matchText: "عَلَى مَكْتَبِ الْمُدَرِّسِ" },
    { ruleId: "istifham-ayna-01", matchText: "أَيْنَ" },
    { ruleId: "huwa-hiya-01", matchText: "هُوَ" }
  ],
  "mb1-27-3": [
    { ruleId: "zuruf-makan-01", matchText: "تَحْتَ" },
    { ruleId: "istifham-ayna-01", matchText: "أَيْنَ" },
    { ruleId: "huwa-hiya-01", matchText: "هِيَ" }
  ],
  "mb1-28-1": [
    { ruleId: "lafz-al-jalala-01", matchText: "اللهِ" }
  ],
  "mb1-29-1": [
    { ruleId: "idafa-verkettung-01", matchText: "مَسْجِدُ رَسُولِ اللهِ" },
    { ruleId: "istifham-ayna-01", matchText: "أَيْنَ" },
    { ruleId: "huwa-hiya-01", matchText: "هُوَ" }
  ],
  "mb1-30-1": [
    { ruleId: "lafz-al-jalala-01", matchText: "اللهِ" }
  ],
  "mb1-30-2": [
    { ruleId: "zuruf-makan-01", matchText: "تَحْتَ" },
    { ruleId: "istifham-ayna-01", matchText: "أَيْنَ" },
    { ruleId: "huwa-hiya-01", matchText: "هُوَ" }
  ],
  "mb1-34-1": [
    { ruleId: "istifham-liman-01", matchText: "لِمَنْ" },
    { ruleId: "tanwin-nach-harf-jarr-01", matchText: "لِخَالِدٍ" },
    { ruleId: "ismul-isara-hadhihi-01", matchText: "هَذِهِ" }
  ],
  "mb1-37-1": [
    { ruleId: "tanwin-eigennamen-01", matchText: "مُحَمَّدٌ" },
    /* Genau der Fall aus der Regel: hinter einem Eigennamen ist ein
       unbestimmtes Wort kein Adjektiv, sondern die Aussage ueber ihn.
       مُحَمَّدٌ طَالِبٌ heisst "Muhammad ist Student", nicht "ein Student Muhammad". */
    { ruleId: "nat-eigenname-01", matchText: "طَالِبٌ" }
  ],
  "mb1-37-2": [
    { ruleId: "satz-vs-wortgruppe-01", matchText: "الْبَابُ مُغْلَقٌ" }
  ],
  "mb1-42-1": [
    { ruleId: "lil-vs-li-01", matchText: "لِلتَّاجِرِ" },
    { ruleId: "harf-jarr-li-01", matchText: "لِلطَّبِيبِ" },
    { ruleId: "ismul-isara-dhalika-01", matchText: "ذَلِكَ" }
  ],
  "mb1-42-2": [
    { ruleId: "idafa-erkennen-01", matchText: "اسْمُ التَّاجِرِ" }
  ],
  "mb1-42-3": [
    { ruleId: "zuruf-makan-01", matchText: "أَمَامَ" },
    { ruleId: "zarf-mansub-01", matchText: "خَلْفَ" }
  ],
  "mb1-43-1": [
    { ruleId: "istifham-liman-01", matchText: "لِمَنْ" },
    { ruleId: "li-eigenname-01", matchText: "لِمُحَمَّدٍ" }
  ],
  "mb1-46-1": [
    { ruleId: "li-eigenname-01", matchText: "لِعِيسَى" },
    { ruleId: "ismul-isara-dhalika-01", matchText: "ذَلِكَ" }
  ],
  "mb1-46-2": [
    { ruleId: "zuruf-makan-01", matchText: "خَلْفَ" },
    { ruleId: "zarf-makan-rollenname-01", matchText: "أَمَامَ" }
  ],
  "mb1-51-1": [
    { ruleId: "nat-bestimmtheit-01", matchText: "السَّيَّارَةُ الْجَمِيلَةُ" },
    { ruleId: "ismul-isara-tilka-01", matchText: "تِلْكَ" },
    { ruleId: "nat-wen-beschreibt-01", matchText: "لِلْمُدِيرِ الْجَدِيدِ" }
  ],
  "mb1-51-2": [
    { ruleId: "nat-bestimmtheit-01", matchText: "اللُّغَةُ الْعَرَبِيَّةُ" }
  ],
  "mb1-63-1": [
    { ruleId: "possessiv-ya-01", matchText: "اسْمِي" },
    { ruleId: "istifham-ma-01", matchText: "مَا" },
    { ruleId: "possessiv-endungen-01", matchText: "اسْمُكِ" }
  ],
  "mb1-63-2": [
    { ruleId: "possessiv-ya-01", matchText: "عَمِّي" },
    { ruleId: "huwa-hiya-01", matchText: "هِيَ" }
  ],
  "45879": [
    { ruleId: "ismul-isara-hadhihi-01", matchText: "هَذِهِ" }
  ],
  "45885": [
    { ruleId: "ismul-isara-hadhihi-01", matchText: "هَذِهِ" }
  ],
  "45893": [
    { ruleId: "ismul-isara-hadhihi-01", matchText: "هَذِهِ" }
  ],
  "45895": [
    { ruleId: "ismul-isara-hadhihi-01", matchText: "هَذِهِ" }
  ],
  "mb1-61-1": [
    { ruleId: "possessiv-ist-idafa-01", matchText: "بَيْتِي" },
    { ruleId: "zarf-makan-rollenname-01", matchText: "أَمَامَ" }
  ],
  "mb1-61-2": [
    { ruleId: "tanwin-maennername-ta-01", matchText: "أُسَامَةُ" },
    { ruleId: "li-vs-inda-01", matchText: "لِي" },
    { ruleId: "mamnu-min-as-sarf-01", matchText: "سُعَادُ" }
  ],
  "mb1-61-3": [
    { ruleId: "hu-nach-kasra-01", matchText: "فِيهِ" },
    { ruleId: "istifham-men-01", matchText: "مَنْ" }
  ],
  "mb1-61-4": [
    { ruleId: "istifham-madha-01", matchText: "مَاذَا" },
    { ruleId: "possessiv-ist-idafa-01", matchText: "كِتَابِي" },
    { ruleId: "hurufu-jarr-bedeutungen-01", matchText: "فِي الْحَقِيبَةِ" }
  ],
  "mb1-53-1": [
    { ruleId: "ismun-mawsul-alladhi-01", matchText: "الَّذِي" },
    { ruleId: "li-al-lil-01", matchText: "لِلْمُدَرِّسِ" }
  ],
  "by2-231-1": [
    { ruleId: "inda-ort-und-zeit-01", matchText: "عِنْدَ" }
  ],
  "by2-231-2": [
    { ruleId: "zuruf-makan-weitere-01", matchText: "فَوْقَ" }
  ],
  "mb1-65-1": [
    { ruleId: "asma-khamsa-01", matchText: "أَبُوكَ" },
    { ruleId: "ya-nida-01", matchText: "يَا" }
  ],
  "sk3-7-1": [
    { ruleId: "asma-khamsa-vollstaendig-01", matchText: "أَبُو" },
    { ruleId: "istifham-madha-01", matchText: "مَاذَا" }
  ],
  "mb1-48-1": [
    { ruleId: "adjektive-an-ohne-tanwin-01", matchText: "كَسْلَانُ" },
    { ruleId: "nat-eigenname-01", matchText: "عَمَّارٌ طَالِبٌ" }
  ],
  "45876": [
    { ruleId: "madd-tabii-01", matchText: "عُصْفُورٌ" }
  ],
  "48402": [
    { ruleId: "mudarris-lesung-herkunft-01", matchText: "الْمُدَرِّسُ" }
  ],
  "45888": [
    { ruleId: "mubtada-khabar-genus-01", matchText: "الْبَابُ مُغْلَقٌ" }
  ],
  "45878": [
    { ruleId: "mubtada-khabar-genus-01", matchText: "جَمِيلَةٌ" }
  ],
  "45883": [
    { ruleId: "nat-bestimmtheit-01", matchText: "اللُّغَةُ الْإِنْجِلِيزِيَّةُ" }
  ],
  "45887": [
    { ruleId: "nat-vier-bedingungen-01", matchText: "يَوْمٌ جَمِيلٌ" }
  ],
  "45889": [
    { ruleId: "nat-vier-bedingungen-01", matchText: "كُوبٌ صَغِيرٌ" }
  ],
  "45896": [
    { ruleId: "nat-vier-bedingungen-01", matchText: "وَزِيرٌ مَشْهُورٌ" }
  ],
  "36e01b96-9367-4f09-acaf-31a82bdcf061": [
    { ruleId: "nat-vier-bedingungen-01", matchText: "مُهَنْدِسٌ مَشْهُورٌ" }
  ],
  "59e30a8a-e400-4380-8adf-89e811852a1d": [
    { ruleId: "hurufu-jarr-bedeutungen-01", matchText: "فِي الثَّلَّاجَةِ" }
  ],
  "madina1-l6-ucht": [
    { ruleId: "hurufu-jarr-bedeutungen-01", matchText: "فِي الْبَيْتِ" }
  ],
  "madina1-l6-ach": [
    { ruleId: "nominalsatz-ohne-kopula-01", matchText: "أَخٌ" }
  ],
  "mb1-57-1": [
    { ruleId: "li-vs-inda-01", matchText: "عِنْدِي" },
    { ruleId: "fragepartikel-alif-01", matchText: "أَ" }
  ],
  "mb1-58-1": [
    { ruleId: "possessiv-endungen-01", matchText: "قَلَمُكَ" }
  ]
};

/* ===================== Satz-Themen =====================
   Elias am 29.07.2026: "Man müsste den Satzmodus vielleicht auch nochmal in
   mehreren Abteilen aufteilen: der eine behandelt den Kasus, der andere die
   Adjektive, der andere مُضَاف / مُضَاف إِلَيْهِ, der andere den Genitiv …
   Dann könnte man vielleicht noch einen Satzmodus haben, der alle mischt."

   Gebaut als FILTER auf dem bestehenden Satz-Modus, nicht als sechs getrennte
   Bildschirme: derselbe Nutzen, ein Bruchteil des Codes, und der Lückentext,
   die I'rab-Zerlegung und der Vorlesen-Knopf funktionieren in jedem Thema
   weiter, ohne dreimal gebaut zu werden.

   VOR dem Bauen gezählt (29.07.2026, `zaehle-themen.mjs`), weil sechs Modi
   nichts nützen, von denen vier leer sind. Ergebnis über 186 Sätze:

     Hinweiswörter   49   ·   Genitiv        37   ·   Nominalsatz  30
     Kasus           28   ·   Adjektiv       28   ·   Weiblich     26
     Bestimmtheit    24   ·   Iḍāfa          16

   Zwei von Elias' Wünschen sind damit NICHT als eigenes Thema gebaut:
   „Fragen" hätte 4 Sätze, „Wortarten" 10 — das wäre ein Reiter, der nach
   zwei Sätzen leer ist. Sie bleiben über „Alle" erreichbar. Ebenso Akkusativ:
   den behandelt der Unterricht bisher nur als Erwähnung, es gibt keine Regel
   und keinen Satz dazu (Elias selbst: „die Regeln zum Akkusativ kenne ich
   auch nicht, unser Lehrer hatte es nur erwähnt").

   Zugeordnet wird über die Regel-ID, nicht über die Anzeigefarbe: die Farbe
   ist eine Gestaltungsentscheidung und deckt sich nicht mit den Themen. */
const SATZ_THEMEN = [
  { id: 'alle',        name: 'Alle' },
  { id: 'isara',       name: 'Hinweiswörter',  muster: /^(ismul-isara|hadha|isara|tilka)/ },
  { id: 'jarr',        name: 'Genitiv',        muster: /^(harf-jarr|min-ila|fi-ala|mina-al|li-|lil-)/ },
  { id: 'nominalsatz', name: 'Nominalsatz',    muster: /^(mubtada|nominalsatz|jumla|wortstellung)/ },
  { id: 'kasus',       name: 'Kasus',          muster: /^(irab|kasus|marfu|majrur|mansub|tanwin|alif-maqsura)/ },
  { id: 'nat',         name: 'Adjektiv',       muster: /^(nat|adjektive|mutabaqa)/ },
  /* HIER STAND ein Thema „Weiblich" (18 Sätze, Regel-Muster
     /^(ta-marbuta|fem-|nat-fem|eigennamen-fem)/). Elias am 29.07.2026, direkt
     nachdem er die Themenliste gesehen hat: „das will ich glaube ich nicht."
     Passt zu seiner Ansage vom selben Abend, die Regel zu den weiblichen
     Endungen nicht zu brauchen — تاء مربوطة sei als Zeichen schon genug.

     ⚠️ Was das NICHT tut: Die Regeln dahinter bleiben alle in der App und
     werden in den Sätzen weiter unterstrichen — `nat-fem-01` (das Adjektiv muss
     weiblich werden), `fem-ohne-ta-marbuta-01`, `ta-marbuta-grenzen-01`,
     `eigennamen-fem-ohne-tanwin-01`. Nur der Reiter ist weg; über „Alle" sind
     die Sätze weiter erreichbar. Wieder da ist er, indem diese eine Zeile
     zurückkommt. */
  { id: 'al',          name: 'اَلْ',            muster: /^(al-|schams|qamar|adjektive-an)/ },
  { id: 'idafa',       name: 'إِضافة',          muster: /^(idafa|mudaf|zarf-als-mudaf)/ }
];
