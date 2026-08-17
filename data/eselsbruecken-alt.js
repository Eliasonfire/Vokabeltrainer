/* data/eselsbruecken-alt.js -- zusaetzliche Eselsbruecken je Wort
   ===============================================================

   WOZU

   Elias am 16.08.2026: "so einen knopf hat der einen neuen vorschlag von dir
   machen lässt, jedoch den alten noch speichert und man auswählen kann ob der
   neue besser ist oder ob man den alten wieder zurück haben will."

   ⛔ Die App kann nichts ERZEUGEN - sie hat keine KI und kein Backend. Der
   Knopf blaettert deshalb durch einen VORRAT, der hier liegt. Von aussen
   fuehlt sich das gleich an, funktioniert aber offline und kostet nichts.

   AUFBAU

   ESELSBRUECKEN_ALT[<id>] = [ "zweiter Vorschlag", "dritter Vorschlag", ... ]

   Der ERSTE Vorschlag steht in `w.mnemo` und wird hier NICHT wiederholt.

   ⭐⭐ DIE RANGFOLGE - am 17.08.2026 von Elias selbst korrigiert

   Zuerst stand hier "Wurzel zuerst, dann Koran". Nach dem Ansehen der ersten
   Beispiele sagte er: "wurzeln ist okay aber zündet bei mir jetzt nicht so
   sehr wie die anderen ... aber kann man schon machen." Also:

     1. Bekannter islamischer BEGRIFF oder eine Wendung - das Staerkste.
        بَيْتُ اللهِ, أَهْلُ الْبَيْتِ, الْفَاتِحَة, أَبْوَابُ الْجَنَّةِ.
        Ein Vers ist dafuer NICHT noetig ("ja genau" zu أَهْلُ الْبَيْتِ).
     2. Ein Vers aus seinem AUSWENDIGEN Bereich.
     3. Muster oder Wurzel - aber nur MIT ANHANG.

   ⭐⭐ Der Unterschied ist nicht "Wurzel gegen Begriff", sondern ob am anderen
   Ende etwas haengt, das er schon hat. Zu مِفْتَاحٌ hat er BEIDE Fassungen mit
   "beide sind sehr gut" bewertet - und eine davon war reine Musterarbeit
   ("Werkzeug-مِـ wie مِكْوَاةٌ, مِرْوَحَةٌ, مِلْعَقَةٌ - alle hast du").
   Drei eigene Vokabeln am selben Muster zuenden; "Wurzel س ج د" allein nicht.

   ⛔⛔ KORANSTELLEN NUR AUS DEM AUSWENDIGEN BEREICH

   Elias am 17.08.2026: "wenn du mit quran sachen kommst dann am besten mit den
   suren die ganz am ende sind bis sura duha weil ich die bis dahin auswendig
   kenne oder sura mulk und fatiha natürlich auch noch."

       Sure 1 (الفاتحة)  ·  Sure 67 (الملك)  ·  Sure 93 bis 114

   Ein Vers ausserhalb davon ist als Merkhaken wertlos - er ist dann selbst
   neuer Stoff. Das hat die erste Fassung dieser Datei weitgehend entwertet:
   von 13 belegten Stellen lagen nur 96:4 und 106:3 im Bereich.

   Gemessen am 17.08.2026 ueber QURAN_TEXT: von den 26 Woertern aus Kapitel 1
   kommen **7** wirklich in seinem Bereich vor. ⚠️ Die Wurzelsuche liefert dabei
   Fehltreffer - تَجْرِي (98:8) hat die Wurzel ج ر ي, nicht ت ج ر, und أَدْرَاكَ
   ist nicht د ي ك. Jeder Treffer wurde am Original nachgeschlagen.

   Belegt mit `node werkzeuge/vers.mjs`: 96:4 · 96:19 · 98:1 · 106:3 · 107:1 ·
   110:1 · 112:3.

   ⚠️ Wo kein Anker aus seinem Bereich existiert, steht KEIN Vers - dann lieber
   ein bekannter Begriff oder ein Muster mit seinen eigenen Woertern.

   STAND: Kapitel 1 vollstaendig (26 Woerter, je 2 Alternativen). */

const ESELSBRUECKEN_ALT = {

  /* بَيْتٌ - Haus */
  '45751': [
    'Du sprichst es in Quraysh mit: فَلْيَعْبُدُوا رَبَّ هَٰذَا الْبَيْتِ — „So sollen sie dem Herrn dieses Hauses dienen" (106:3). Gemeint ist die كَعْبَةٌ, das Wort ist dasselbe wie für dein Haus.',
    'Plural بُيُوتٌ. Du kennst das Wort auch aus أَهْلُ الْبَيْتِ, „die Leute des Hauses" — dieselbe Form, nur mit Artikel.'
  ],

  /* مَسْجِدٌ - Moschee */
  '45752': [
    'Du kennst zwei davon beim Namen: الْمَسْجِدُ الْحَرَامُ und الْمَسْجِدُ الْأَقْصَىٰ. Das Wort ist jedes Mal dasselbe, nur die Beschreibung dahinter wechselt.',
    'Die Wurzel س ج د sprichst du am Ende von al-ʿAlaq: وَاسْجُدْ وَاقْتَرِبْ — „wirf dich nieder und sei nah" (96:19). Die مَسْجِد ist der Ort dafür; das مَـ macht aus der Handlung einen Ort, wie bei مَكْتَبٌ und مَدْرَسَةٌ.'
  ],

  /* بَابٌ - Tür */
  '45753': [
    'أَبْوَابُ الْجَنَّةِ — die Tore des Paradieses, acht an der Zahl. Ein Begriff, den du kennst, und die Vokabel steckt mitten drin.',
    'Plural أَبْوَابٌ, Muster أَفْعَال — dasselbe wie أَقْلَامٌ zu قَلَمٌ und أَوْلَادٌ zu وَلَدٌ. Drei Wörter aus Kapitel 1 mit demselben Plural.'
  ],

  /* كِتَابٌ - Buch */
  '45754': [
    'Aus al-Bayyina, die du auswendig kannst: مِنْ أَهْلِ الْكِتَابِ — „von den Leuten der Schrift" (98:1). Dasselbe Wort, das bei dir schlicht „Buch" heißt.',
    'Muster فِعَال — dieselbe Form wie حِمَارٌ (Esel) und حِصَانٌ (Pferd) aus diesem Kapitel. Drei Wörter, ein Rhythmus: ki-tāb, ḥi-mār, ḥi-ṣān.'
  ],

  /* قَلَمٌ - Stift */
  '45755': [
    'Aus al-ʿAlaq, der ersten Offenbarung: الَّذِي عَلَّمَ بِالْقَلَمِ — „Der mit dem Schreibrohr gelehrt hat" (96:4). Das Wort steht ganz am Anfang.',
    'Plural أَقْلَامٌ, Muster أَفْعَال wie أَبْوَابٌ (Türen). Und كِتَابٌ ist der Partner: der قَلَم schreibt, das كِتَاب ist das Ergebnis.'
  ],

  /* مِفْتَاحٌ - Schlüssel */
  '45756': [
    'Wurzel ف ت ح = öffnen — dieselbe wie in الْفَاتِحَة, der „Eröffnenden", die du in jedem Gebet sprichst. Der مِفْتَاح ist das Ding zum Öffnen.',
    'Und in an-Naṣr, die du auswendig kannst: نَصْرُ اللهِ وَالْفَتْحُ (110:1). الْفَتْح ist die Öffnung, مِفْتَاح das Werkzeug dazu — dieselbe Wurzel, zwei Rollen.'
  ],

  /* مَكْتَبٌ - Schreibtisch / Büro / Amt */
  '45757': [
    'Drei Orte mit مَـ, die du alle hast: مَسْجِدٌ (Ort der Niederwerfung), مَكْتَبٌ (Ort des Schreibens), مَدْرَسَةٌ (Ort des Lernens). Wer das Muster einmal sieht, erkennt es überall.',
    'مَكْتَبٌ und مَكْتَبَةٌ trennt nur das ة am Ende — Büro gegen Bibliothek. Genau wie bei مُدَرِّسٌ und مُدَرِّسَةٌ: das ة macht den Unterschied, nicht die Wurzel.'
  ],

  /* سَرِيرٌ - Bett */
  '45758': [
    'Muster فَعِيل — dieselbe Form wie طَبِيبٌ (Arzt) und جَمِيلٌ (schön) aus deinem Bestand. Sprich alle drei hintereinander: sa-rīr, ṭa-bīb, ǧa-mīl.',
    'Plural أَسِرَّةٌ, unregelmäßig und mit doppeltem ر. Laut sprechen: a-si-rra — die Verdopplung ist das Merkmal, wie bei قِطٌّ.'
  ],

  /* كُرْسِيٌّ - Stuhl */
  '45759': [
    'Du kennst den Namen آيَةُ الْكُرْسِيِّ, den Thronvers — genau dieses Wort steht darin. Was dort der Thron ist, ist hier der ganz gewöhnliche Stuhl.',
    'Plural كَرَاسِيّ. Das doppelte ي am Ende ist derselbe Anhang wie in einer Zugehörigkeitsform — sprich es lang: kur-siyy, nicht kur-si.'
  ],

  /* نَجْمٌ - Stern */
  '45760': [
    'Sure 53 trägt diesen Namen: النَّجْم. Wenn dir der Surenname begegnet, hast du die Vokabel — Stern.',
    'Plural نُجُوم. Klanghilfe: „naǧm" — nachts am Himmel. Nur der Klang, über die Herkunft wird nichts behauptet.'
  ],

  /* طَبِيبٌ - Arzt */
  '45761': [
    'Wurzel ط ب ب steckt in الطِّبّ, der Heilkunde — der Begriff aus الطِّبُّ النَّبَوِيّ, der „prophetischen Medizin".',
    'Muster فَعِيل wie سَرِيرٌ (Bett) und جَمِيلٌ (schön). ⚠️ Nicht mit مَطْبَخٌ (Küche) verwechseln: dort steht خ, hier ب. Der Arzt heilt, die Küche kocht.'
  ],

  /* وَلَدٌ - Junge */
  '45762': [
    'Aus al-Ikhlāṣ, die du in jedem Gebet sprechen kannst: لَمْ يَلِدْ وَلَمْ يُولَدْ — „Er hat nicht gezeugt und ist nicht gezeugt worden" (112:3). Dieselbe Wurzel و ل د; ein وَلَد ist ein Geborener.',
    'Und dieselbe Wurzel steckt in الْوَالِدَيْنِ, den Eltern — der Begriff aus بِرُّ الْوَالِدَيْنِ. وَلَدٌ ist der Geborene, وَالِد der, von dem er kommt.'
  ],

  /* طَالِبٌ - Student */
  '45763': [
    'Wurzel ط ل ب = suchen. Im Islamunterricht heißt der Lernende deshalb طَالِبُ عِلْمٍ — „einer, der Wissen sucht". Das Wort beschreibt die Haltung, nicht den Schulplatz.',
    'Muster فَاعِل, der Handelnde — genau wie تَاجِرٌ (Händler), جَالِسٌ (sitzend) und وَاقِفٌ (stehend) aus deinen Vokabeln. Vier Wörter, ein Bauplan.'
  ],

  /* رَجُلٌ - Mann */
  '45764': [
    'Der Plural رِجَال ist die Form, die dir überall begegnet, wo von den Männern die Rede ist. Eine Vokabel, zwei Gestalten: رَجُلٌ einer, رِجَالٌ viele.',
    '⚠️ Dieselben drei Buchstaben ر ج ل tragen auch رِجْلٌ (Bein). Nur die Vokale trennen sie: ra-ǧul mit u in der Mitte, riǧl ohne. Immer laut sprechen.'
  ],

  /* تَاجِرٌ - Händler */
  '45765': [
    'Die Wurzel ت ج ر steckt in تِجَارَة, dem Handel — ein Wort, das du aus dem Alltag kennst. Der تَاجِر ist der Mensch dazu.',
    'Muster فَاعِل wie طَالِبٌ (Student), جَالِسٌ (sitzend), وَاقِفٌ (stehend). Wer فَاعِل sieht, fragt: Wer tut das gerade?'
  ],

  /* كَلْبٌ - Hund */
  '45766': [
    'Der bekannteste Hund im Islam ist der der Höhlengefährten aus Sure الْكَهْف, die viele freitags lesen — dort liegt كَلْبُهُم mit ausgestreckten Vorderbeinen am Eingang.',
    '⚠️ Klangfalle: „kalb" klingt wie das deutsche „Kalb", heißt aber Hund. Das Rind heißt بَقَرَةٌ — auch in deinen Vokabeln, und der Name von Sure 2.'
  ],

  /* قِطٌّ - Katze */
  '45767': [
    'Merke sie mit den anderen Tieren aus Kapitel 1 zusammen: كَلْبٌ (Hund), قِطٌّ (Katze), حِمَارٌ (Esel), حِصَانٌ (Pferd), جَمَلٌ (Kamel), دِيكٌ (Hahn). Sechs auf einmal statt sechsmal einzeln.',
    'Das doppelte ط am Ende (Schadda) ist das Auffällige — sprich es wirklich doppelt: qiṭṭ, nicht qiṭ. Dieselbe Verdopplung wie in طَبِيبٌ mit ط ب ب.'
  ],

  /* حِمَارٌ - Esel */
  '45768': [
    'Muster فِعَال — genau wie كِتَابٌ (Buch) und حِصَانٌ (Pferd), beide aus diesem Kapitel. Der Rhythmus ist derselbe: ki-tāb, ḥi-mār, ḥi-ṣān.',
    '⚠️ Esel und Pferd fangen beide mit حِـ an. Der Unterschied sitzt in der Mitte: م beim Esel (حِمَار), ص beim Pferd (حِصَان). Und die Wurzel ح م ر steckt auch in أَحْمَر, rot.'
  ],

  /* حِصَانٌ - Pferd */
  '45769': [
    'Wurzel ح ص ن = befestigen, schützen — ein حِصْن ist eine Festung. Das Pferd war der Schutz des Reiters.',
    'Muster فِعَال wie كِتَابٌ (Buch) und حِمَارٌ (Esel). ⚠️ Gegen den Esel abgrenzen: م in der Mitte ist der Esel, ص das Pferd.'
  ],

  /* جَمَلٌ - Kamel */
  '45770': [
    'Zwei deiner Wörter teilen ج م ل: جَمَلٌ (Kamel) und جَمِيلٌ (schön). Für den Beduinen war das Kamel das schönste Tier — ob das sprachlich zusammengehört, wird nicht behauptet, als Merkhaken hält es trotzdem.',
    'Plural جِمَال, Muster فِعَال — dieselbe Form wie كِتَابٌ und حِمَارٌ. Das Kamel bildet seinen Plural also wie das Buch.'
  ],

  /* دِيكٌ - Hahn */
  '45771': [
    'Immer als Paar lernen: دِيكٌ ist der Hahn, دَجَاجَةٌ die Henne — beide hast du. Beide beginnen mit د, und das ة am Ende macht die Henne weiblich.',
    'Ein kurzes Wort mit langem ī in der Mitte, wie سَرِيرٌ und طَبِيبٌ. Sprich es lang: dīk, nicht dik.'
  ],

  /* مُدَرِّسٌ - Lehrer */
  '45772': [
    'Wurzel د ر س steckt auch in مَدْرَسَةٌ, der Schule — dem Ort, an dem der مُدَرِّس steht. Ein Wortpaar, das sich gegenseitig hält.',
    'Muster مُفَعِّل wie مُهَنْدِسٌ (Ingenieur) aus deinen Vokabeln. Das Schadda auf dem mittleren Buchstaben ist das Kennzeichen: mu-dar-ris, mit doppeltem r.'
  ],

  /* مِنْدِيلٌ - Tuch */
  '45773': [
    'Drei Geräte mit مِـ aus deinem Bestand: مِفْتَاحٌ (Schlüssel), مِكْوَاةٌ (Bügeleisen), مِلْعَقَةٌ (Löffel). Das Tuch gehört dazu. ⚠️ مِـ heißt Gerät, مَـ heißt Ort — ein Vokalzeichen entscheidet.',
    'Langes ī in der Mitte wie bei دِيكٌ, سَرِيرٌ, طَبِيبٌ. Sprich min-dīl mit gezogenem ī, dann sitzt die Vokalisierung.'
  ],

  /* نَعَمْ - ja */
  '45774': [
    'نَعَمْ und لَا gehören zusammen wie Frage und Gegenfrage — und لَا kennst du aus لَا إِلَٰهَ إِلَّا اللهُ. Wer das eine hat, soll das andere gleich mitnehmen.',
    'Endet auf ein Sukūn über dem م — deshalb bricht das Wort hinten ab: na-ʿam, nicht na-ʿa-mu. Genau dieses harte Ende macht es unverwechselbar.'
  ],

  /* لَا - nein */
  '45775': [
    'Du sprichst es täglich als erstes Wort des Glaubensbekenntnisses: لَا إِلَٰهَ إِلَّا اللهُ. Dasselbe لَا, dieselbe Bedeutung — die Verneinung von allem, was danach kommt.',
    'Zwei Zeichen, ein Laut: das ل mit dem أَلِف. Kürzer geht ein Wort nicht. Immer im Paar mit نَعَمْ üben.'
  ],

  /* أَ - Fragepartikel */
  '45776': [
    'Genau diese Partikel eröffnet al-Māʿūn, die du auswendig kannst: أَرَأَيْتَ — „Siehst du …?" (107:1). Ohne das أَ vorne wäre رَأَيْتَ nur „du hast gesehen".',
    '⚠️ Gegen مَا abgrenzen, das du auch hast: أَ fragt nach ja oder nein, مَا nach der Sache. أَهَذَا بَيْتٌ؟ — „Ist das ein Haus?" gegen مَا هَذَا؟ — „Was ist das?"'
  ]

};
