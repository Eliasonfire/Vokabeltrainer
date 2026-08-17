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
    'Muster مُفَعِّل, und du hast drei davon: مُدَرِّسٌ (Lehrer), مُمَرِّضَةٌ (Krankenschwester), مُؤَذِّنٌ (Gebetsrufer). Alle drei sind Berufe, alle drei haben ein مُـ vorne und eine شَدَّة auf dem mittleren Buchstaben. Sprich es hörbar doppelt: mu-dar-ris.'
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
  ],

  /* ===================== Kapitel 1, Nachzügler ===================== */

  /* مَا - was */
  '45777': [
    'Sūrat al-Qāriʿa kannst du auswendig — und sie besteht fast aus diesem einen Wort: مَا ٱلْقَارِعَةُ (101:2), gleich darauf وَمَآ أَدْرَىٰكَ مَا (101:3). Dreimal مَا in drei kurzen Versen, jedes Mal „was". Wenn dir das Wort nicht einfällt, sprich die Sure innerlich an.',
    'Sortiere deine Fragewörter in zwei Sorten, dann verwechselst du nie wieder: مَا (was) und aus deinen Regeln مَنْ (wer), أَيْنَ (wo), لِمَنْ (wem gehört) fragen nach einer SACHE oder PERSON — die Antwort ist ein Wort. أَ und هَلْ fragen nach JA ODER NEIN. Der Unterschied liegt nicht am Wort, sondern an der Art der Antwort.'
  ],

  /* وَ - und */
  '45778': [
    'Zähl die Suren, die du auswendig kannst und die mit genau diesem Buchstaben anfangen: وَٱلضُّحَىٰ (93:1), وَٱلْعَصْرِ (103:1), وَٱلتِّينِ (95:1). ⚠️ Dort heißt وَ aber nicht „und", sondern ist das Schwur-Wāw: „bei der Morgenhelle". Dasselbe Zeichen, zwei Aufgaben — und beide begegnen dir längst.',
    'وَ wird NIE getrennt geschrieben, es klebt am folgenden Wort: قَلَمٌ وَكِتَابٌ, niemals وَ كِتَابٌ. Das ist keine Schreibmarotte, sondern die Art dieser kurzen حُرُوف — dasselbe tut لِ aus deinen Regeln, das mit اَلْ sogar zu لِلـ verschmilzt.'
  ],

  /* ===================== Kapitel 2 ===================== */

  /* إِمَامٌ - Imam */
  '45779': [
    'إِمَامُ الْمَسْجِدِ — das ist genau die إِضافة, die du gerade gelernt hast: das erste Wort ohne اَلْ und ohne Tanwīn (إِمَامُ), das zweite bestimmt und im Genitiv (الْمَسْجِدِ). Eine Vokabel und eine Regel im selben Ausdruck, und مَسْجِدٌ hast du seit Kapitel 1.',
    'Der Plural lohnt sich extra, weil er die Wurzel sichtbar macht: إِمَامٌ → أَئِمَّةٌ. Im Singular stehen die beiden م weit auseinander (أ-م-ا-م), im Plural rücken sie zusammen und bekommen eine شَدَّة. Wer den Plural einmal geschrieben hat, sieht أ م م im Singular sofort wieder.'
  ],

  /* حَجَرٌ - Stein */
  '45780': [
    'Sūrat al-Fīl kannst du auswendig, und der Plural steht mitten darin: تَرْمِيهِم بِحِجَارَةٍ (105:4) — „bewarfen sie mit Steinen". حِجَارَةٌ ist genau die Mehrzahl, die bei deiner Vokabel steht. Ein Vers, und Einzahl und Mehrzahl sitzen zusammen.',
    'Dein eigener Beispielsatz ist die zweite Brücke: حَجَرٌ قَدِيمٌ وَثَقِيلٌ. قَدِيمٌ (alt) und ثَقِيلٌ (schwer) hast du beide aus Kapitel 3 — und beide tragen dasselbe Tanwīn wie حَجَرٌ. Das ist die Regel نَعْت zum Anfassen: das Adjektiv macht dem Nomen alles nach.'
  ],

  /* سُكَّرٌ - Zucker */
  '45781': [
    'Das doppelte ك ist eine شَدَّة — eines der fünf شَكْل aus deinen Regeln. Sprich es hörbar: suk-kar, nicht su-kar. Eine شَدَّة ist im Arabischen nie Zierde; sie zählt wie ein eigener Buchstabe, und wer sie weglässt, spricht ein anderes Wort.',
    'Stell dir deine anderen Wörter mit شَدَّة daneben: قِطٌّ (Katze), كُرْسِيٌّ (Stuhl), تُفَّاحٌ (Apfel), حَمَّامٌ (Badezimmer), سَيَّارَةٌ (Auto). Sprich sie hintereinander — du hörst denselben Doppelschlag in der Mitte, und سُكَّرٌ reiht sich ein, statt allein zu stehen.'
  ],

  /* لَبَنٌ - Milch */
  '45782': [
    'Nimm den ganzen Satz statt des einzelnen Worts: لَبَنٌ حُلْوٌ وَبَارِدٌ — süße und kalte Milch. حُلْوٌ und بَارِدٌ hast du beide aus Kapitel 3, beide hängen als نَعْت an لَبَنٌ und tragen dasselbe Tanwīn. Drei Vokabeln und eine Regel in einem Bild.',
    'Der Plural bricht das Wort auf: لَبَنٌ → أَلْبَان. Dasselbe Muster hast du schon dreimal: بَابٌ → أَبْوَابٌ, قَلَمٌ → أَقْلَامٌ, وَلَدٌ → أَوْلَادٌ. Ein أَ vorne, ein langes ا vor dem letzten Buchstaben — wer das Muster erkennt, muss den Plural nicht einzeln lernen.'
  ],

  /* ===================== Kapitel 3 — Eigenschaften =====================
     Fast das ganze Kapitel besteht aus Gegenpaaren in der Form فَعِيل. Der
     erste Vorschlag nennt bei den meisten schon das Gegenwort; die
     Alternativen gehen deshalb bewusst woanders hin: Vers, Muster, Plural,
     Aussprache. */

  /* غَنِيٌّ - reich */
  '45783': [
    'Sūrat aḍ-Ḍuḥā kannst du auswendig, und dein ganzes Gegenpaar steht dort in EINEM Vers: وَوَجَدَكَ عَآئِلًا فَأَغْنَىٰ (93:8) — „und dich arm gefunden und dann reich gemacht". فَأَغْنَىٰ trägt genau deine Wurzel غ ن ي. ⚠️ Für „arm" steht dort عَآئِلًا und nicht فَقِيرًا — dieselbe Aussage, ein anderes Wort.',
    'Sieh dir das Muster an, dann hast du halb Kapitel 3 geschenkt: غَنِيّ, فَقِير, كَبِير, صَغِير, قَرِيب, بَعِيد, جَدِيد, نَظِيف, ثَقِيل, جَمِيل — alle in der Form فَعِيل. Drei Wurzelbuchstaben, davor ein a, dazwischen ein langes ī vor dem letzten. Wer die Wurzel kennt, kann das Adjektiv bilden, ohne es je gesehen zu haben.'
  ],

  /* فَقِيرٌ - arm */
  '45784': [
    'Die فُقَرَاء stehen an erster Stelle der acht Gruppen, denen die Zakāh zusteht — den Begriff hörst du in jedem Ramadan. Nimm den Plural gleich mit: فَقِيرٌ → فُقَرَاءُ. ⚠️ Am Ende steht ein ُ und KEIN Tanwīn — das ist kein Tippfehler, sondern eine eigene Wortsorte, die dir später als Regel begegnet.',
    'Die beiden gehören zusammen wie zwei Seiten einer Münze, und der Unterschied liegt nicht im Besitz: غَنِيّ ist der, der auf niemanden angewiesen ist, فَقِير der, der angewiesen ist. Deshalb heißt الْغَنِيّ auch ein Name Allahs, aber الْفَقِير nie.'
  ],

  /* طَوِيلٌ - lang / groß */
  '45785': [
    'Nimm die Doppelbedeutung ernst, sie ist der Merkhaken: طَوِيل ist lang in der ZEIT und im RAUM. Deshalb ist ein Mensch طَوِيل („groß") und eine Straße ebenso (dein Satz: الشَّارِعُ طَوِيلٌ). Im Deutschen brauchst du zwei Wörter, im Arabischen reicht eines — such also nicht nach einem zweiten.',
    'Die Plurale zeigen das Paar noch einmal: طَوِيلٌ → طِوَالٌ und قَصِيرٌ → قِصَارٌ, beide nach dem Muster فِعَال. Sprich die vier hintereinander: ṭawīl – ṭiwāl, qaṣīr – qiṣār. Zwei Wörter, zwei Plurale, ein Muster.'
  ],

  /* قَصِيرٌ - kurz */
  '45786': [
    'Deine eigenen Beispielsätze halten das Paar fest: الْقَلَمُ قَصِيرٌ gegen الشَّارِعُ طَوِيلٌ. Nimm beide als ein Bild — ein kurzer Stift in der Hand, eine lange Straße davor. Zwei Sätze aus Wörtern, die du alle hast.',
    '⚠️ Achte auf das ص: das ist der satte, dunkle s-Laut, nicht das leichte س aus سُوقٌ. Im Arabischen sind das zwei verschiedene Buchstaben, keine Schreibvarianten — sprich es einmal langsam und übertrieben: qa-ṣīr, mit rundem Mund.'
  ],

  /* بَارِدٌ - kalt */
  '45787': [
    'Das Muster ist hier der eigentliche Gewinn: بَارِد folgt NICHT der Form فَعِيل wie die meisten Adjektive dieses Kapitels, sondern فَاعِل — dieselbe Form wie جَالِسٌ (sitzend), وَاقِفٌ (stehend), طَالِبٌ (Student), تَاجِرٌ (Händler). Alle vier hast du. فَاعِل beschreibt den, der gerade etwas tut oder in einem Zustand ist.',
    'Der Unterschied zum Gegenwort springt ins Auge, sobald man hinsieht: بَارِد zeigt seine drei Wurzelbuchstaben offen (ب ر د), حَارّ nur zwei — die beiden ر sind zu einer شَدَّة zusammengezogen. Sprich beide: bā-rid gegen ḥārr.'
  ],

  /* حَارٌّ - heiß */
  '45788': [
    'Die شَدَّة ist hier kein Zierrat, sondern der halbe Wortstamm: die Wurzel ist ح ر ر, und die beiden ر sind auf ein Zeichen zusammengefallen. Genau dasselbe siehst du bei قِطٌّ (ط ط) und أُمٌّ (م م), die du beide hast. Wer die شَدَّة verschluckt, verschluckt einen Wurzelbuchstaben.',
    'Zwei Sätze aus deinen eigenen Vokabeln halten das Paar: الشَّايُ حَارٌّ und الْمَاءُ بَارِدٌ. Tee heiß, Wasser kalt. Sag sie einmal hintereinander laut — dann hast du zwei Adjektive, zwei Nomen und die Wortstellung des Nominalsatzes in einem Zug.'
  ],

  /* جَالِسٌ - sitzend */
  '45789': [
    'مَجْلِس ist der Ort des Sitzens — der Begriff für eine Lernrunde oder Versammlung, den du kennst. Dieselbe Wurzel ج ل س. Und das مَـ davor ist dasselbe wie in مَسْجِدٌ (Ort der Niederwerfung) und مَكْتَبٌ (Ort des Schreibens): مَـ macht aus einer Handlung einen ORT.',
    'جَالِسٌ und وَاقِفٌ sind beide Form فَاعِل — der, der gerade sitzt, und der, der gerade steht. Das ist der Unterschied zu فَعِيل: فَاعِل ist eine Momentaufnahme, فَعِيل eine Eigenschaft. كَبِير ist man dauerhaft, جَالِس nur, solange man sitzt.'
  ],

  /* وَاقِفٌ - stehend */
  '45790': [
    'Beim Koranlesen begegnet dir das Wort ständig: die Pausenzeichen heißen وَقْف — die Stelle, an der man stehen bleibt. Dieselbe Wurzel و ق ف. Und ein وَقْف ist auch die Stiftung, die „stehen bleibt", weil sie nie verkauft wird. Ein Stamm, drei Bedeutungen, alle mit „anhalten und bleiben".',
    'Achte auf den ersten Buchstaben: و am Wortanfang ist selten und macht das Wort unverwechselbar. Zusammen mit وَرَقٌ (Papier) und وَسِخٌ (schmutzig) aus deinen Vokabeln hast du drei davon — sprich sie hintereinander, dann sitzt der weiche w-Anlaut.'
  ],

  /* جَدِيدٌ - neu */
  '45791': [
    'Die Wurzel ج د د trägt „neu machen, erneuern". Deshalb heißt تَجْدِيد die Erneuerung — ein Begriff, der dir in Vorträgen begegnet. Wer das einmal verknüpft hat, braucht die Klanghilfe nicht mehr.',
    'Gegenpaar mit قَدِيمٌ, und beide sind Form فَعِيل. Der Plural bricht anders auf als sonst in diesem Kapitel: جَدِيدٌ → جُدُدٌ, ganz ohne langen Vokal. Sprich ihn einmal: ju-dud. Bei قَدِيمٌ → قُدَمَاءُ läuft es wieder wie bei فُقَرَاءُ.'
  ],

  /* قَدِيمٌ - alt */
  '45792': [
    'قَدَم ist der Fuß, تَقَدَّمَ heißt voranschreiten — dieselbe Wurzel ق د م. Was VORANGEGANGEN ist, ist alt. Damit hast du auch مُقَدِّمَة (die Einleitung, das Vorangestellte) mit einem Schlag verstanden.',
    '⚠️ Nicht mit كَبِير verwechseln. Beide heißen im Deutschen manchmal „alt", meinen aber Verschiedenes: قَدِيم ist alt im Sinne von LANGE DA (dein Satz: الْمَسْجِدُ قَدِيمٌ), كَبِير ist groß, und bei Menschen „älter" im Sinne von größer. Ein alter Stein ist قَدِيم, ein großer Stein كَبِير.'
  ],

  /* قَرِيبٌ - nah */
  '45793': [
    'Der letzte Vers von Sūrat al-ʿAlaq, die du auswendig kannst, endet mit deiner Wurzel: وَٱسْجُدْ وَٱقْتَرِب (96:19) — „wirf dich nieder und sei nah". اِقْتَرِب ist ein Befehl von ق ر ب. Nähe zu Allah durch die Niederwerfung — ein Bild, das das Wort trägt.',
    'Dieselbe Wurzel steckt in أَقْرَب (näher) und in قَرِيب als „Verwandter" — wer nah ist, im Raum wie in der Familie. Dein Satz zeigt die räumliche Seite: الْمَدْرَسَةُ قَرِيبَةٌ مِنَ الْبَيْتِ. ⚠️ Beachte das ة an قَرِيبَة: مَدْرَسَة ist weiblich, also muss das Adjektiv es auch sein.'
  ],

  /* بَعِيدٌ - fern */
  '45794': [
    'Merke es über die Präposition, die du schon hast: مِنَ heißt „von, aus" — und بَعِيدٌ مِنْ heißt „weit weg VON". Dein Satz sagt es vollständig: الْجَامِعَةُ بَعِيدَةٌ مِنَ الْبَيْتِ. Nah und fern arbeiten im Arabischen mit derselben Präposition; nur das Adjektiv dreht die Bedeutung um.',
    '⚠️ Nicht mit بَعْدَ („nach, danach") verwechseln — dieselben drei Buchstaben ب ع د, aber ein anderes Wort. Der Unterschied ist hörbar: ba-ʿīd mit langem ī gegen baʿ-da. Wenn du im Koran بَعْدُ liest, ist damit die Zeit gemeint und nicht die Entfernung.'
  ],

  /* نَظِيفٌ - sauber */
  '45795': [
    'نَظَافَة (Reinlichkeit) ist ein Begriff, den du aus dem Glauben kennst — die Wurzel ن ظ ف steckt in beiden. Das Adjektiv beschreibt den Zustand, das Nomen benennt ihn. Wer die Wurzel hat, hat beide Wörter.',
    'Dein eigener Satz verbindet zwei Vokabeln: هَذَا الْمِنْدِيلُ نَظِيفٌ — dieses Tuch ist sauber. Und das Gegenwort steht ebenso griffbereit: هَذَا الْكَلْبُ وَسِخٌ. Zwei Sätze, vier Vokabeln, ein Gegensatz.'
  ],

  /* وَسِخٌ - schmutzig */
  '45796': [
    'Das Muster fällt aus der Reihe und genau das macht es merkbar: وَسِخ ist NICHT فَعِيل wie نَظِيف, sondern فَعِل — kurz, ohne langen Vokal. Sprich beide hintereinander: na-ẓīf gegen wa-six. Das saubere Wort ist lang und rund, das schmutzige kurz und rau.',
    'Drei deiner Vokabeln fangen mit و an: وَسِخٌ, وَرَقٌ (Papier), وَاقِفٌ (stehend). Dazu kommt وَ (und) selbst. Übe sie als kleine Gruppe — der w-Anlaut ist im Arabischen selten genug, dass er als eigener Haken taugt.'
  ],

  /* صَغِيرٌ - klein */
  '45797': [
    'Du kennst die Wurzel aus dem Vergleich: أَصْغَر heißt „kleiner, am kleinsten" — dieselben drei Buchstaben ص غ ر. Und genauso läuft es beim Gegenwort: كَبِير → أَكْبَر. Das Muster أَفْعَل für den Vergleich ist bei beiden dasselbe.',
    '⚠️ Wenn das beschriebene Wort weiblich ist, bekommt das Adjektiv eine تاء مَرْبُوطة: بِنْتٌ صَغِيرَةٌ, nicht بِنْتٌ صَغِيرٌ. Das ist die Regel نَعْت — vier Dinge müssen übereinstimmen, und das Geschlecht ist eines davon. Dein Satz mit dem Kätzchen zeigt es: هَذَا الْقِطُّ صَغِيرٌ, männlich, also ohne ة.'
  ],

  /* كَبِيرٌ - groß */
  '45798': [
    'In Sūrat al-Mulk, die du auswendig kannst, steht das Wort unverändert: وَأَجْرٌ كَبِيرٌ (67:12) — „und großer Lohn". Genau deine Vokabel, genau diese Form, mit Tanwīn wie im Buch. Es lohnt sich, den Vers einmal daraufhin zu lesen: du kennst ihn längst, nur nicht als Vokabel.',
    'Von derselben Wurzel kommt تَكْبِير — das Sprechen von اللهُ أَكْبَر. Und der Vergleich أَكْبَر („größer") ist dasselbe Muster أَفْعَل wie أَصْغَر bei صَغِير. Drei Wörter, eine Wurzel ك ب ر, und eines davon sagst du jeden Tag.'
  ],

  /* خَفِيفٌ - leicht */
  '45799': [
    'Die Wurzel خ ف ف steckt auch in تَخْفِيف, der Erleichterung — ein Begriff, der im Zusammenhang mit Erlaubnissen und Ausnahmen fällt. Wer den kennt, hat das Adjektiv gratis.',
    'Doppelter Wurzelbuchstabe wie bei حَارّ und جَدِيد: خ ف ف, wobei das zweite ف im langen ī steckt (خَفِيف). ⚠️ Der Plural macht es wieder sichtbar: خِفَافٌ. Der Wechsel zwischen خَفِيف und خِفَاف ist genau der von طَوِيل → طِوَال und قَصِير → قِصَار.'
  ],

  /* ثَقِيلٌ - schwer */
  '45800': [
    'Sūrat al-Qāriʿa kannst du auswendig, und deine Wurzel trägt dort den entscheidenden Satz: مَن ثَقُلَتْ مَوَٰزِينُهُ (101:6) — „wessen Waagschalen schwer sind". Schwer ist im Koran das Gute, das wiegt. Ein Bild, das man nicht mehr los wird.',
    'Von derselben Wurzel ث ق ل kommt مِثْقَال, das Gewichtsmaß. Und das مِـ davor ist dasselbe wie in مِفْتَاحٌ (Schlüssel) und مِنْدِيلٌ (Tuch), die du hast: مِـ macht aus einer Handlung ein WERKZEUG oder ein Maß. Ein Muster, das dir immer wieder begegnet.'
  ],

  /* وَرَقٌ - Papier */
  '45801': [
    'Ein وَرَق ist auch das Blatt am Baum — Blatt Papier und Blatt am Baum sind dasselbe Wort, weil es dasselbe Bild ist: etwas Dünnes, Flaches. Wer das einmal so sieht, verwechselt es nie mit كِتَابٌ.',
    'Der Plural läuft nach dem Muster, das du schon dreimal hast: وَرَقٌ → أَوْرَاقٌ, wie بَابٌ → أَبْوَابٌ, قَلَمٌ → أَقْلَامٌ und وَلَدٌ → أَوْلَادٌ. Ein أَ vorne, ein langes ا vor dem letzten Buchstaben. ⚠️ Beachte das و als ersten Wurzelbuchstaben: im Plural bleibt es stehen, أَوْرَاق.'
  ],

  /* مَاءٌ - Wasser */
  '45802': [
    'Es gibt eine Stelle aus deinem auswendigen Bereich, und sie ist eindringlicher als die bekannte: أَصْبَحَ مَآؤُكُمْ غَوْرًا — „wenn euer Wasser versickert wäre" (67:30, Sūrat al-Mulk). مَآؤُكُمْ ist dein Wort mit „euer" daran. Der Vers endet mit بِمَآءٍ مَّعِينٍ, „mit hervorquellendem Wasser".',
    '⚠️ Das Wort ist kürzer, als es aussieht: م + ا + ء, drei Zeichen. Die Wurzel م و ه sieht man ihm nicht mehr an — das و ist im langen ā verschwunden. Solche Wörter nennt man später „schwach"; fürs Erste reicht: مَاء ist eine Ausnahme und muss auswendig gelernt werden, nicht hergeleitet.'
  ],

  /* تُفَّاحٌ - Apfel */
  '45803': [
    'Ordne es in die Gruppe ein, statt es allein zu lernen: تُفَّاحٌ ist eine فَاكِهَة (Obst, Kapitel 9), er ist حُلْو (süß, dieses Kapitel), und dazu passen لَحْمٌ (Fleisch) und لَبَنٌ (Milch) aus deinen übrigen Wörtern. Ein Essenstisch aus fünf Vokabeln, die du alle hast — leichter als fünf einzelne Karten.',
    'Die شَدَّة auf dem ف ist Pflicht: tuf-fāḥ, nicht tu-fāḥ. Deine anderen Wörter mit doppeltem Mittelbuchstaben: سُكَّرٌ (Zucker), دُكَّانٌ (Geschäft), حَمَّامٌ (Badezimmer). Sprich sie hintereinander — es ist immer derselbe kurze Stau in der Mitte des Wortes.'
  ],

  /* دُكَّانٌ - Geschäft */
  '45804': [
    'Der Plural ist der interessante Teil: دُكَّانٌ → دَكَاكِينُ. Das ist ein Vierbuchstaben-Muster, das dir bei تُفَّاحٌ → تَفَافِيحُ genauso begegnet — beide Male ein langes ā nach dem ersten Buchstaben und ein langes ī vor dem letzten. ⚠️ Und beide enden ohne Tanwīn.',
    'Zwei Vokabeln, eine Szene: du gehst in den سُوق (Markt) und stehst vor einem دُكَّان (Laden). Dein eigener Satz sagt es schon: دُكَّانٌ صَغِيرٌ — ein kleiner Laden — قَرِيبٌ مِنَ السُّوقِ, nahe am Markt. Darin stecken vier Wörter aus Kapitel 1 bis 3; nimm den Satz als Ganzes, nicht das Wort allein.'
  ],

  /* جَمِيلٌ - schön */
  '45805': [
    'Von derselben Wurzel ج م ل kommt جَمَال, die Schönheit — das Nomen zum Adjektiv. Und im selben Hadith stehen beide: إِنَّ اللهَ جَمِيلٌ, und Er liebt الْجَمَال. Ein Satz, zwei Wortformen, eine Wurzel.',
    'Form فَعِيل wie fast alles in diesem Kapitel. ⚠️ Beim weiblichen Nomen wird daraus جَمِيلَةٌ — dein Satz mit der Katze zeigt es beinahe: هَذَا الْقِطُّ صَغِيرٌ وَجَمِيلٌ ist männlich, بِنْتٌ جَمِيلَةٌ wäre weiblich. Das Adjektiv folgt dem Nomen, immer.'
  ],

  /* حُلْوٌ - süß */
  '45806': [
    'Das Wort ist kürzer als die anderen hier und folgt einem eigenen Muster: فُعْل — حُلْو, mit Sukūn auf dem ل. Kein langer Vokal, keine drei Silben. Sprich es einmal gegen نَظِيف: ḥulw ist ein Schlag, na-ẓīf sind zwei. Kurze Adjektive gibt es, sie sind nur seltener.',
    'Deine eigenen Sätze bringen es dreimal: الشَّايُ حُلْوٌ (der Tee), تُفَّاحٌ حُلْوٌ (der Apfel), لَبَنٌ حُلْوٌ (die Milch). Immer dasselbe Adjektiv an einem anderen Nomen. Sprich alle drei — dann hast du das Wort in drei Zusammenhängen statt einmal auf einer Karte.'
  ],

  /* مَرِيضٌ - krank */
  '45807': [
    'مَرَض ist die Krankheit selbst, مَرِيض der Kranke, مُمَرِّضَة die Pflegerin — drei Wörter aus der Wurzel م ر ض, und zwei davon hast du schon. Dazu passt مُسْتَشْفًى (Krankenhaus) aus einer anderen Wurzel: der Ort, an dem der مَرِيض Heilung sucht.',
    '⚠️ Der Plural fällt aus jedem Muster dieses Kapitels: مَرِيضٌ → مَرْضَى, mit أَلِف مَقْصورة am Ende. Das ist das ى ohne Punkte, das du als Fachbegriff kennst — gesprochen wie ein langes ā: mar-ḍā. Ein guter Ort, um beides zusammen zu merken.'
  ]

};
