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
  ],

  /* ===================== Kapitel 4 — Präpositionen, Länder, Orte ===== */

  /* مِنْ - von / aus */
  '45808': [
    '⚠️ Die wichtigste Verwechslung im ganzen Kapitel: مِنْ („von") und مَنْ („wer?") sehen ohne Taschkīl gleich aus. Dein Lehrer gibt dafür den Trick: beides ausprobieren, und was Sinn ergibt, ist richtig. „Von verließ das Klassenzimmer" ergibt keinen — also ist es die Frage مَنْ خَرَجَ.',
    'مِنَ الْبَيْتِ statt مِنْ الْبَيْتِ: trifft das Sukūn auf مِنْ das Sukūn des Artikels, wird aus dem Sukūn ein Kasra. Das ist kein Sonderfall des Wortes, sondern eine Ausspracheregel — man kann zwei stumme Konsonanten nicht hintereinander sprechen. Sag es einmal laut, dann hörst du, warum.'
  ],

  /* إِلَى - nach / zu */
  '45809': [
    'Der letzte Vers der Fātiḥa und Sūrat al-Mulk sind voll davon: صِرَٰطَ ٱلَّذِينَ (1:7) folgt die Richtung, und in 67:15 heißt es وَإِلَيْهِ ٱلنُّشُورُ — „und zu Ihm ist die Auferstehung". إِلَيْهِ ist dein إِلَى mit „ihm" daran. Sechsmal allein in al-Mulk.',
    'Das Paar arbeitet mit einem Satz zusammen, den du selbst hast: مِنَ الْبَيْتِ إِلَى الْجَامِعَةِ — vom Haus zur Universität. ⚠️ Nach BEIDEN steht Genitiv, deshalb الْبَيْتِ und الْجَامِعَةِ mit Kasra. Herkunft und Ziel wechseln die Bedeutung, nicht den Fall.'
  ],

  /* أَيْنَ - wo */
  '45810': [
    '⚠️ Nicht mit مِنْ أَيْنَ verwechseln, das du im selben Kapitel triffst: أَيْنَ fragt „wo?" (der Ort selbst), مِنْ أَيْنَ fragt „woher?" (die Herkunft). Ein Wort davor, und die Frage kippt. Dein Satz أَيْنَ الْمِفْتَاحُ؟ fragt nach dem Ort, nicht nach der Herkunft des Schlüssels.',
    'Merke die Antwortform mit: auf أَيْنَ folgt kein Verb, sondern gleich das Gesuchte — أَيْنَ الْمِفْتَاحُ؟ ist ein vollständiger Satz aus zwei Wörtern. Das Deutsche braucht ein „ist", das Arabische nicht. Dieselbe Regel wie bei هَذَا بَيْتٌ.'
  ],

  /* عَلَى - auf */
  '45811': [
    'Du sprichst es in jedem Gebet: أَنْعَمْتَ عَلَيْهِمْ (1:7) — „denen Du Gunst erwiesen hast". عَلَيْهِمْ ist dein عَلَى mit „ihnen" daran, und genau diese Form kommt in der Fātiḥa zweimal vor. In Sūrat al-Mulk steht es sechsmal.',
    '⚠️ Am Ende steht eine أَلِف مَقْصورة — das ى ohne Punkte, gesprochen wie langes ā: ʿalā. Sobald ein Anhängsel kommt, verwandelt es sich in ein echtes ي: عَلَى → عَلَيْهِ. Dasselbe passiert bei إِلَى → إِلَيْهِ. Zwei Wörter, eine Verwandlung.'
  ],

  /* فِي - in */
  '45812': [
    'Zwei Buchstaben, und dahinter steht immer Genitiv: فِي الْبَيْتِ, فِي الْمَكْتَبِ, فِي السَّمَاءِ. Genau das meint der Fachbegriff حَرْفُ الْجَرِّ, den dein Lehrer benutzt — die Partikel zieht das Nomen in den Genitiv. فِي ist das einfachste Beispiel dafür, das es gibt.',
    'Sortiere die Ortswörter nach dem Bild, dann verwechselst du sie nie: فِي ist DRIN, عَلَى ist DRAUF, تَحْتَ ist DRUNTER. Alle drei hast du. Und تَحْتَ ist trotzdem etwas anderes — dein Lehrer stellt ausdrücklich klar, dass es kein حَرْف جَرّ ist, sondern eine ظَرْف.'
  ],

  /* الْفِلِيبِّينُ - Philippinen */
  '45813': [
    'Der Artikel ist Teil des Namens und fällt nie weg: es heißt الْفِلِيبِّين, nicht فِلِيبِّين. Dasselbe gilt für الْيَابَان, الصِّين, الْهِنْد — alle vier Länder dieses Kapitels tragen ihn fest. Wer den Artikel weglässt, sagt keinen Ländernamen.',
    'Das doppelte ب ist die einzige Stolperstelle: al-Fi-lib-bīn. Vergleiche mit deinen anderen Wörtern, bei denen eine شَدَّة den Rhythmus macht — سُكَّرٌ, دُكَّانٌ, حَمَّامٌ. Immer derselbe kurze Stau in der Mitte.'
  ],

  /* الْيَابَانُ - Japan */
  '45814': [
    'Die Regel dahinter öffnet dir viele Namen: das deutsche J wird im Arabischen zu ي. Deshalb الْيَابَان für Japan — und deshalb heißt Josef يُوسُف und Jesus عِيسَى. Wenn dir ein Name fremd vorkommt, probier das J-zu-ي zurück.',
    'Länder lernst du am besten als Gruppe, weil sie im selben Satzmuster stehen: هَذَا الطَّالِبُ مِنَ الْيَابَانِ. Setz die vier Länder dieses Kapitels reihum ein — الْيَابَان, الصِّين, الْهِنْد, الْفِلِيبِّين. Ein Satz, vier Vokabeln, und nebenbei übst du مِنْ mit Genitiv.'
  ],

  /* الصِّينُ - China */
  '45815': [
    'Hier hörst du eine Regel in einem Wort, das du sowieso lernst: ص ist ein Sonnenbuchstabe, deshalb wird اَلْصِّين zu aṣ-Ṣīn — das ل verschwindet im Klang, das ص verdoppelt sich. Sprich es einmal falsch (al-Ṣīn) und einmal richtig (aṣ-Ṣīn), dann sitzt der Unterschied.',
    '⚠️ Das ص ist der dunkle, satte s-Laut, nicht das leichte س aus سُوقٌ. Dieselbe Unterscheidung wie bei قَصِيرٌ aus Kapitel 3. Zwei Buchstaben, die im Deutschen beide „s" heißen und im Arabischen zwei verschiedene Wörter machen können.'
  ],

  /* الْهِنْدُ - Indien */
  '45816': [
    'Der Klang trägt fast von selbst: al-Hind — darin steckt, was du aus „Hindu" und „Hindi" kennst. ⚠️ Achte nur auf das ه: das ist der gehauchte h-Laut, nicht das kratzige ح aus حَمَّامٌ. Beide heißen im Deutschen „h", im Arabischen sind es zwei Buchstaben.',
    'Nimm den Satz statt des Worts: هَذَا الشَّايُ مِنَ الْهِنْدِ — dieser Tee ist aus Indien. Darin steckt شَايٌ aus Kapitel 6, مِنْ aus diesem Kapitel und das Hinweiswort هَذَا. Ein Satz, drei Vokabeln und eine Regel.'
  ],

  /* مَدْرَسَةٌ - Schule */
  '45817': [
    'Sieh dir die Familie an, dann hast du drei Wörter statt einem: د ر س ist die Wurzel des Lernens. مُدَرِّس ist der, der lehrt, مَدْرَسَة der Ort, an dem gelernt wird, und دَرْس die Lektion selbst. Beide ersten hast du schon als Vokabel.',
    'Das مَـ macht aus einer Handlung einen ORT — und du hast die ganze Reihe: مَسْجِدٌ (Ort der Niederwerfung), مَكْتَبٌ (Ort des Schreibens), مَطْبَخٌ (Ort des Kochens), مَدْرَسَةٌ (Ort des Lernens). ⚠️ Bei مَدْرَسَة kommt eine تاء مَرْبُوطة dazu — deshalb ist sie weiblich, und Adjektive brauchen ein ة: مَدْرَسَةٌ نَظِيفَةٌ.'
  ],

  /* سُوقٌ - Markt */
  '45818': [
    '⚠️ Achtung, dein Beispielsatz verrät es: هَذِهِ سُوقٌ قَدِيمَةٌ — mit هَذِهِ und قَدِيمَةٌ, also WEIBLICH, obwohl das Wort keine تاء مَرْبُوطة trägt. سُوق gehört zu den Wörtern, die weiblich sind, ohne es zu zeigen. Genau die Sorte, vor der dein Lehrer warnt.',
    'Der Plural ist أَسْوَاقٌ, dasselbe Muster wie بَابٌ → أَبْوَابٌ und وَرَقٌ → أَوْرَاقٌ, die du beide hast. ⚠️ Im Singular steht ein langes ū (sūq), im Plural wird daraus ein و mit Sukūn (as-wāq) — der schwache Wurzelbuchstabe wechselt seine Gestalt.'
  ],

  /* جَامِعَةٌ - Universität */
  '45819': [
    'Die Wurzel ج م ع („sammeln") trägt drei Wörter, die du kennst: الْجُمُعَة ist der Tag der Versammlung, der جَامِع die Freitagsmoschee, in der sich alle versammeln — und die جَامِعَة der Ort, an dem sich alle Fächer versammeln. Ein Stamm, drei Versammlungen.',
    'Im Koran begegnet dir die Wurzel in deinem auswendigen Bereich: ٱلَّذِي جَمَعَ مَالًا (104:2) — „der Besitz zusammenträgt", in Sūrat al-Humaza. Dasselbe جَمَعَ, das in جَامِعَة steckt. Wer den Vers spricht, hat das Wort.'
  ],

  /* مُدِيرٌ - Direktor */
  '45820': [
    'Die Wurzel د و ر hat mit Drehen und Kreisen zu tun — der مُدِير ist der, um den sich der Betrieb dreht. ⭐ Von derselben Wurzel kommt دَار, das Haus im Sinne von „Anwesen", und دَوْر, die Runde oder Rolle. Wer die Wurzel hat, erkennt sie in allen dreien wieder.',
    'Der Plural läuft nicht wie bei den Dingen, sondern wie bei Menschen: مُدِيرٌ → مُدِيرُونَ, mit ـُونَ am Ende. Genauso bei جَالِسُونَ, وَاقِفُونَ, نَظِيفُونَ aus Kapitel 3. ⚠️ Das ist der Plural für männliche PERSONEN; Dinge brechen stattdessen auf, wie بَابٌ → أَبْوَابٌ.'
  ],

  /* غُرْفَةٌ - Zimmer */
  '45821': [
    'Bau dir das Haus aus deinen eigenen Vokabeln: ein بَيْت hat eine غُرْفَة (Zimmer), einen مَطْبَخ (Küche), ein حَمَّام (Bad) und einen مِرْحَاض (Toilette). Alle fünf Wörter hast du. Geh das Haus einmal in Gedanken ab und benenne die Räume — das hält besser als fünf einzelne Karten.',
    'Der Plural ist غُرَفٌ und damit kürzer als der Singular — das ist selten und deshalb merkbar. ⚠️ Die تاء مَرْبُوطة fällt im Plural weg: غُرْفَة → غُرَف. Sprich beide hintereinander: ghur-fa, ghu-raf.'
  ],

  /* حَمَّامٌ - Badezimmer */
  '45822': [
    'Das Wort ist auch im Deutschen angekommen: der Hammam, das Dampfbad. Wer es einmal so eingeordnet hat, braucht keine weitere Brücke — nur die Aussprache: das doppelte م muss man hören, ḥam-mām.',
    '⚠️ Der erste Buchstabe ist ح, der kratzige Kehllaut, nicht das gehauchte ه aus الْهِنْد. Übe die beiden im Paar: ḥammām gegen al-Hind. Im Deutschen klingt beides wie „h", im Arabischen sind es zwei Buchstaben und zwei Wörter.'
  ],

  /* مَطْبَخٌ - Küche */
  '45823': [
    'Ort-مَـ wie مَدْرَسَةٌ, مَكْتَبٌ und مَسْجِدٌ, die du alle hast: die Wurzel ط ب خ heißt kochen, also ist مَطْبَخ der Ort des Kochens. ⚠️ Nicht mit طَبِيبٌ (Arzt) verwechseln — der hat die Wurzel ط ب ب. Der letzte Buchstabe entscheidet: خ kocht, ب heilt.',
    'Der Plural bricht nach einem Muster auf, das du bei den Ort-Wörtern immer wieder siehst: مَطْبَخٌ → مَطَابِخُ, wie مَدْرَسَةٌ → مَدَارِسُ. Erst ein langes ā, dann ein Kasra vor dem letzten Buchstaben. ⚠️ Beide ohne Tanwīn am Ende.'
  ],

  /* سَمَاءٌ - Himmel */
  '45824': [
    'In Sūrat al-Mulk, die du auswendig kannst, steht das Wort gleich mehrfach — am schönsten in 67:5: زَيَّنَّا ٱلسَّمَآءَ ٱلدُّنْيَا, „Wir haben den untersten Himmel geschmückt", nämlich بِمَصَٰبِيحَ, mit Lampen. Und in 67:16 fragt der Vers nach مَّن فِي ٱلسَّمَآءِ. Sechs Stellen allein in dieser einen Sure.',
    'Der Plural ist سَمَاوَاتٌ, und dort taucht das و der Wurzel س م و wieder auf, das im Singular verschwunden ist. ⚠️ Achte auf die Endung ـَات: das ist der Plural für weibliche Wörter, denselben hat جَامِعَةٌ → جَامِعَاتٌ und حَمَّامٌ → حَمَّامَاتٌ.'
  ],

  /* فَصْلٌ - Klassenzimmer / Kapitel */
  '45825': [
    'Ein فَصْل ist ein abgetrennter Teil — deshalb heißt dasselbe Wort Klassenzimmer UND Kapitel. Die Wurzel ف ص ل bedeutet trennen. Auch die Jahreszeit heißt so: ein فَصْل des Jahres. Drei Bedeutungen, ein einziges Bild.',
    'Merke es über den Satz deines Lehrers zu مَنْ und مِنْ: dort geht es um خَرَجَ مِنَ الْفَصْلِ, „er verließ das Klassenzimmer". Genau dein Wort, im Genitiv nach مِنْ. Wer diesen Beispielsatz kann, hat Vokabel und Regel zusammen.'
  ],

  /* مِرْحَاضٌ - Toilette */
  '45826': [
    'Werkzeug- und Ort-مِـ wie bei مِفْتَاحٌ (Schlüssel) und مِنْدِيلٌ (Tuch), die du hast: erst مِـ, dann die Wurzel, dann ein langes ā vor dem letzten Buchstaben. Die Wurzel ر ح ض heißt waschen — der مِرْحَاض ist der Ort zum Waschen.',
    'Der praktische Satz steht schon bei dir: أَيْنَ الْمِرْحَاضُ؟ — „Wo ist die Toilette?" Das ist die Sorte Satz, die man auf einer Reise wirklich braucht, und er besteht aus zwei Vokabeln, die du beide in diesem Kapitel lernst. Sprich ihn ein paarmal, dann sitzt er.'
  ],

  /* ===================== Kapitel 5 — Familie, Orte, Hinweiswörter ==== */

  /* رَسُولٌ - Gesandter */
  '45827': [
    'In Sūrat al-Bayyina, die du auswendig kannst, steht das Wort genau in deiner Form: رَسُولٌ مِّنَ ٱللَّهِ (98:2) — „ein Gesandter von Allah". Mit Tanwīn, unbestimmt, wie im Vokabelheft. Und in Sūrat al-Fīl steckt dieselbe Wurzel im Verb: وَأَرْسَلَ عَلَيْهِمْ (105:3), „und Er sandte gegen sie".',
    'Die Wurzel ر س ل („senden") trägt eine ganze Familie: رَسُول der Gesandte, رِسَالَة die Botschaft, أَرْسَلَ er sandte. ⚠️ Der Plural ist unregelmäßig kurz: رَسُولٌ → رُسُلٌ, ru-sul. Genau diese Form hörst du im Koran, wenn von allen Gesandten die Rede ist.'
  ],

  /* تَحْتَ - unter */
  '45828': [
    'Die berühmteste Wendung des Korans über das Paradies trägt dein Wort, und sie steht in einer Sure, die du auswendig kannst: تَجْرِي مِن تَحْتِهَا (98:8) — „durcheilt von Bächen", wörtlich „es fließt von unter ihnen". تَحْتِهَا ist dein تَحْتَ mit „ihnen" daran.',
    '⚠️ Der Fachbegriff dazu ist ظَرْف, und dein Lehrer stellt ausdrücklich klar: تَحْتَ ist KEIN حَرْفُ الْجَرِّ, obwohl das Wort danach genauso in den Genitiv kommt — تَحْتَ الْمَكْتَبِ. Es wirkt wie eine Genitivpartikel, gehört aber in eine eigene Kategorie. Das ist der Unterschied, den man kennen muss.'
  ],

  /* عَمٌّ - Onkel väterlicherseits */
  '45829': [
    'Der Trick gegen das Verwechseln liegt im Klang: „ʿamm" ist kurz und hart, „chāl" weich und lang. Sprich beide direkt hintereinander — ʿamm, chāl — dann trennt sich das Paar von selbst. Und häng die Frauen gleich an: عَمَّة gehört zur Vaterseite, خَالَة zur Mutterseite.',
    'Die شَدَّة verrät die Wurzel: ع م م, zwei م, im Singular zu einem zusammengezogen. Im Plural rücken sie auseinander: عَمٌّ → أَعْمَامٌ. Dasselbe siehst du bei أُمٌّ → أُمَّهَاتٌ und bei قِطٌّ. ⚠️ Und der Plural folgt dem Muster أَفْعَال, das du von أَبْوَابٌ und أَقْلَامٌ kennst.'
  ],

  /* اِبْنٌ - Sohn */
  '45830': [
    'Die Hamzat al-waṣl ist hier zum Anfassen: اِبْن steht allein mit dem اِ, aber im Satz verschwindet es — هَذَا ابْنُ التَّاجِرِ, gesprochen „hādha bnu…". Genau die Regel هَمْزَةُ الوَصْل aus deinem Unterricht, an einem Wort, das du oft brauchst.',
    'Die Wurzel ب ن ي heißt bauen — Kinder bauen die Familie weiter. ⚠️ Achte auf den Unterschied zum Gegenstück: اِبْنٌ (Sohn) hat die Wurzel ب ن ي, بِنْتٌ (Tochter) die Wurzel ب ن ت. Die Plurale gehen deshalb auseinander: أَبْنَاءٌ gegen بَنَاتٌ.'
  ],

  /* شَارِعٌ - Straße */
  '45831': [
    'Die Wurzel ش ر ع steckt auch in شَرِيعَة — und das Bild ist dasselbe: ein Weg, den man geht. Die Straße ist der Weg unter den Füßen, die Scharia der Weg des Lebens. Wer die Wurzel einmal so gesehen hat, hat zwei Wörter statt einem.',
    'Muster فَاعِل wie جَالِسٌ, وَاقِفٌ, طَالِبٌ, تَاجِرٌ — alle vier hast du. ⚠️ Der Plural bricht auf zu شَوَارِعُ, mit einem و, das im Singular gar nicht vorkommt. Sprich beide: shā-riʿ, sha-wā-riʿ.'
  ],

  /* سَيَّارَةٌ - Auto */
  '45832': [
    'Drei deiner Wörter folgen demselben Maschinenmuster فَعَّالَة: سَيَّارَةٌ (Auto), ثَلَّاجَةٌ (Kühlschrank), دَرَّاجَةٌ (Fahrrad). Immer eine شَدَّة in der Mitte und eine تاء مَرْبُوطة am Ende. Das Muster heißt so viel wie „das, was viel tut" — die سَيَّارَة ist „die viel Fahrende".',
    'Die Wurzel س ي ر heißt gehen und reisen — daher سَيْر (der Gang) und سِيرَة, die Lebensbeschreibung: der Weg, den einer gegangen ist. السِّيرَة النَّبَوِيَّة, die Prophetenbiographie, ist derselbe Stamm. Ein Auto und eine Lebensgeschichte aus einer Wurzel — das vergisst man nicht.'
  ],

  /* كَعْبَةٌ - Kaaba */
  '45833': [
    'Nimm die Verbindung, die du schon hast: بَيْتُ اللهِ — das Haus Allahs — ist die كَعْبَة. Damit hängen zwei Vokabeln aneinander (بَيْتٌ aus Kapitel 1 und كَعْبَةٌ hier), und beide an einem Begriff, den du seit jeher kennst.',
    'Die Wurzel ك ع ب hat mit „Würfel" zu tun — daher der Name für den würfelförmigen Bau. ⚠️ Und das Wort ist weiblich (تاء مَرْبُوطة): deshalb heißt es هَذِهِ الْكَعْبَةُ قَدِيمَةٌ mit ة am Adjektiv, nicht قَدِيمٌ. Ein gutes Beispiel für die vier Bedingungen des نَعْت.'
  ],

  /* هُنَا - hier */
  '45834': [
    'Denk es dir als Zeigefinger: هُنَا zeigt auf den Boden vor dir, هُنَاكَ zeigt weg. Der Unterschied ist EIN Buchstabe, das كَ am Ende. Genau dieselbe Nah-Fern-Ordnung hast du bei den Hinweiswörtern aus deinen Regeln: هَذَا für Nahes, ذَلِكَ für Fernes.',
    '⚠️ In deinem Unterricht zählt هُنَا als Nomen, nicht als Partikel — die App zeigt es anders, aber der Unterricht hat Vorrang. Das ist derselbe Fall wie bei تَحْتَ: Wörter, die wie kleine Partikeln aussehen und grammatisch Nomen sind.'
  ],

  /* خَالٌ - Onkel mütterlicherseits */
  '45835': [
    'Merke es über die Plurale, sie klingen sehr verschieden: خَالٌ → أَخْوَالٌ gegen عَمٌّ → أَعْمَامٌ. Im Plural taucht bei خَال das و der Wurzel خ و ل wieder auf, das im Singular im langen ā verschwunden ist. Sprich alle vier hintereinander, dann sitzt das Paar.',
    'Diesen Unterschied gibt es im Deutschen nicht, und genau deshalb muss man ihn bewusst lernen: خَال ist der Bruder der MUTTER, عَمّ der Bruder des VATERS. Eine Eselsbrücke, die trägt: خَال und die خَالَة (Tante mütterlicherseits) gehören zur selben Seite — wer eines weiß, weiß beide.'
  ],

  /* هُنَاكَ - dort */
  '45836': [
    'Das كَ am Ende ist derselbe Zeigefinger, den du bei ذَلِكَ siehst — auch dort steht ein كَ für die Ferne. Sammle die Ferne-Wörter: هُنَاكَ (dort), ذَلِكَ (jenes), تِلْكَ (jene). Alle drei tragen dasselbe كَ, alle drei zeigen weg.',
    'Übe es im Satzpaar, dann ist der Abstand hörbar: الْمُدَرِّسُ هُنَا الْآنَ gegen الْمَكْتَبَةُ هُنَاكَ. Beide Sätze kommen ohne „ist" aus — das ist die Regel des Nominalsatzes, die du schon hast, und hier arbeitet sie mit einem Ortswort statt einem Adjektiv.'
  ],

  /* مُغْلَقٌ - geschlossen */
  '45837': [
    'Das Muster ist der Gewinn: مُفْعَل ist das PASSIVE Partizip — etwas, das geschlossen WURDE. Vergleiche es mit مُدَرِّس (der lehrt, aktiv) und مُدِير (der leitet, aktiv), die du beide hast. Ein مُـ am Anfang, und der Unterschied steckt allein in den Vokalen dazwischen.',
    'Das Gegenteil kennst du über die Wurzel, auch wenn das Wort noch nicht in deinen Vokabeln steht: مَفْتُوح („offen") kommt von ف ت ح — genau der Wurzel deines مِفْتَاحٌ (Schlüssel). Der Schlüssel öffnet, مُغْلَق ist zu. Ein Bild, und du musst dir nur eine Wurzel merken.'
  ],

  /* بِنْتٌ - Tochter / Mädchen */
  '45838': [
    '⚠️ Die Ausnahme, die man sich merken muss: بِنْتٌ endet auf ein normales ت mit Sukūn, NICHT auf die تاء مَرْبُوطة ة, die sonst weibliche Wörter kennzeichnet. Das Wort ist trotzdem weiblich — dein Lehrer nennt solche Fälle مؤنث بلا تاء, „weiblich ohne Tāʾ".',
    'Der Satz aus deinen Regeln zeigt gleich die Folge daraus: بِنْتٌ صَغِيرَةٌ ist richtig, بِنْتٌ صَغِيرٌ nicht. Obwohl das Nomen kein ة hat, muss das Adjektiv eines bekommen — das Geschlecht entscheidet, nicht die Schreibung. Genau das ist die zweite der vier Bedingungen des نَعْت.'
  ],

  /* اِسْمٌ - Name */
  '45839': [
    'Der allererste Vers, der herabgesandt wurde, trägt dein Wort — und du kannst die Sure auswendig: ٱقْرَأْ بِٱسْمِ رَبِّكَ (96:1), „Lies im Namen deines Herrn". Dasselbe بِٱسْمِ sprichst du bei jedem بِسْمِ اللهِ. ⚠️ Auch hier fällt das اِ im Satz weg, weil es eine Hamzat al-waṣl ist.',
    'اِسْم ist außerdem einer der drei Fachbegriffe für die Wortarten aus deinem Unterricht: اِسْم – فِعْل – حَرْف. Alles, was kein Verb und keine Partikel ist, ist ein اِسْم. Damit hat dein Vokabelwort „Name" gleichzeitig eine grammatische Bedeutung — merke beide zusammen.'
  ],

  /* حَقِيبَةٌ - Tasche / Rucksack */
  '45840': [
    'Nimm den Satz, er verbindet drei Vokabeln: هَذِهِ حَقِيبَةُ الطَّالِبِ — „das ist die Tasche des Studenten". Und er ist eine إِضافة zum Anfassen: حَقِيبَةُ ohne اَلْ und ohne Tanwīn, الطَّالِبِ im Genitiv dahinter. Was in الْكِتَابُ فِي الْحَقِيبَةِ steckt, hast du damit gleich mit.',
    '⚠️ Der Plural hat eine Hamzah mitten im Wort: حَقِيبَةٌ → حَقَائِبُ, ḥa-qā-ʾib. Genau dasselbe Muster wie bei دُكَّانٌ → دَكَاكِينُ und مَطْبَخٌ → مَطَابِخُ: langes ā nach dem ersten Buchstaben, dann ein Kasra vor dem letzten. Und alle drei ohne Tanwīn.'
  ],

  /* ===================== Kapitel 6 — Haushalt, Familie, Körper ====== */

  /* مِكْوَاةٌ - Bügeleisen */
  '45841': [
    'Das Werkzeug-مِـ ist hier das ganze Wort: مِفْتَاحٌ (Schlüssel), مِلْعَقَةٌ (Löffel), مِنْدِيلٌ (Tuch), مِرْحَاضٌ (Toilette) — alle hast du, alle fangen mit مِـ an. Das Muster heißt „das Ding, mit dem man …". Wer die Wurzel kennt, rät das Werkzeug richtig.',
    'Die Wurzel ك و ي bedeutet brennen und bügeln — ein Bügeleisen ist heiß. ⚠️ Das و in der Mitte ist schwach: im Wort selbst ist es sichtbar (مِكْوَاة), aber es verhält sich anders als ein normaler Buchstabe. Solche Wurzeln kommen dir noch öfter unter; hier siehst du eine zum ersten Mal.'
  ],

  /* بَقَرَةٌ - Kuh */
  '45842': [
    'Du kennst das Wort seit Jahren, nur nie als Vokabel: Sure 2 heißt الْبَقَرَة — „die Kuh", die längste Sure des Korans. Jedes Mal, wenn du sie im Inhaltsverzeichnis siehst, siehst du deine Vokabel.',
    '⚠️ Die تاء مَرْبُوطة macht hier nicht nur „weiblich", sondern das EINZELNE Stück: بَقَرٌ ist das Rindvieh als Gattung, بَقَرَةٌ die eine Kuh. Dasselbe Paar siehst du bei حَجَرٌ → حِجَارَةٌ mitgedacht. Merke: das ة kann auch „eine einzelne davon" heißen.'
  ],

  /* دَرَّاجَةٌ - Fahrrad */
  '45843': [
    'Drei Maschinen, ein Muster فَعَّالَة, und du hast alle drei: سَيَّارَةٌ (Auto), دَرَّاجَةٌ (Fahrrad), ثَلَّاجَةٌ (Kühlschrank). Immer eine شَدَّة in der Mitte, immer eine تاء مَرْبُوطة am Ende. Wenn dir ein neues Gerät begegnet, ist die Chance groß, dass es genauso gebaut ist.',
    'Die Wurzel د ر ج heißt Stufe und Grad — daher دَرَجَة, die Stufe oder Note. Ein Fahrrad ist „das mit den Stufen", also den Gängen. ⭐ Und im Glauben begegnet dir dieselbe Wurzel als دَرَجَات, die Rangstufen im Paradies.'
  ],

  /* مِلْعَقَةٌ - Löffel */
  '45844': [
    'Werkzeug-مِـ, und die Wurzel ل ع ق heißt lecken — der Löffel ist wörtlich „das Ding zum Lecken". ⭐ Zusammen mit مِفْتَاحٌ (das Ding zum Öffnen) und مِكْوَاةٌ (das Ding zum Bügeln) hast du drei Werkzeuge nach demselben Bauplan. Das Muster ist die Vokabel, nicht das Einzelwort.',
    '⚠️ Der Plural bricht auf und verliert das مِـ-Muster nicht, aber die Vokale wechseln alle: مِلْعَقَةٌ → مَلَاعِقُ, ma-lā-ʿiq. Dasselbe Muster wie مَطْبَخٌ → مَطَابِخُ und حَقِيبَةٌ → حَقَائِبُ. Drei Wörter, ein Pluralmuster — sprich sie hintereinander.'
  ],

  /* فَلَّاحٌ - Bauer */
  '45845': [
    'Du hörst die Wurzel fünfmal am Tag: حَيَّ عَلَى الْفَلَاحِ im Adhān — „auf zum Erfolg". Dieselbe Wurzel ف ل ح steckt im فَلَّاح. Der Bauer pflügt, und wer pflügt, hat Erfolg — das Bild trägt beide Bedeutungen.',
    'Muster فَعَّال für Berufe: der, der etwas VIEL tut. ⚠️ Nicht mit dem Maschinenmuster فَعَّالَة verwechseln — der Unterschied ist nur die تاء مَرْبُوطة: فَلَّاحٌ ist ein Mensch, ثَلَّاجَةٌ ein Gerät. Ein Buchstabe entscheidet, ob es jemand oder etwas ist.'
  ],

  /* أُمٌّ - Mutter */
  '45846': [
    'Der bekannteste Ausdruck damit ist einer, den du kennst: أُمُّ الْقُرَى, „die Mutter der Städte" — Mekka. Und die Fātiḥa heißt أُمُّ الْكِتَابِ, die Mutter des Buches. „Mutter" heißt im Arabischen also auch „Ursprung, Hauptsache". Beides sind إِضافة-Verbindungen, wie du sie gerade lernst.',
    '⚠️ Der Plural ist besonders und lohnt sich: أُمٌّ → أُمَّهَاتٌ, mit einem ه, das im Singular nirgends steht. Sprich ihn laut: um-ma-hāt. Und die شَدَّة verrät die Wurzel أ م م — zwei م, im Singular zu einem zusammengezogen, genau wie bei عَمٌّ.'
  ],

  /* أَبٌ - Vater */
  '45847': [
    'In Sūrat al-Masad, die du auswendig kannst, steht das Wort als Namensteil: أَبِي لَهَبٍ (111:1) — „Abū Lahab". Das أَبِي ist dein أَبٌ im Genitiv, weil es Teil einer إِضافة ist. Ein Vers, den du sowieso sprichst, mit deiner Vokabel darin.',
    '⚠️ Zwei Wörter deiner Liste verhalten sich gleich und gehören zusammen gelernt: أَبٌ und أَخٌ verlängern sich zu أَبُو und أَخُو, sobald etwas folgt — أَبُو بَكْرٍ, أَخُو مُحَمَّدٍ. Allein stehen sie kurz, in einer إِضافة werden sie lang. Das ist keine Ausnahme, das ist ihre Art.'
  ],

  /* ثَلَّاجَةٌ - Kühlschrank */
  '45848': [
    'Die Wurzel ist das Beste an diesem Wort: ث ل ج heißt Schnee. Der Kühlschrank ist wörtlich „die Schneemacherin". Wenn du das Bild einmal hast, brauchst du die Vokabel nicht mehr — du leitest sie her.',
    'Maschinenmuster فَعَّالَة, dritter im Bunde mit سَيَّارَةٌ und دَرَّاجَةٌ. ⚠️ Alle drei sind weiblich (تاء مَرْبُوطة), also brauchen ihre Adjektive auch ein ة: ثَلَّاجَةٌ جَدِيدَةٌ, nicht جَدِيدٌ. Die vier Bedingungen des نَعْت gelten hier ganz praktisch.'
  ],

  /* شَايٌ - Tee */
  '45849': [
    'Das Wort ist in fast allen Sprachen ähnlich — Tee, chai, شَاي. ⚠️ Achte auf die Endung: شَايٌ endet auf ي mit Tanwīn, nicht auf ة. Es ist männlich, deshalb heißt es الشَّايُ حَارٌّ und nicht حَارَّةٌ.',
    'Die Getränke stehen bei dir über die Kapitel verstreut: لَبَنٌ (K2), مَاءٌ (K3), شَايٌ und قَهْوَةٌ (K6). Bau daraus einen Satz mit deinen Adjektiven: شَايٌ حَارٌّ, مَاءٌ بَارِدٌ, لَبَنٌ حُلْوٌ. Vier Getränke, drei Eigenschaften — und du übst nebenbei die Angleichung.'
  ],

  /* غَرْبٌ - Westen */
  '45850': [
    'Das Gebet trägt das Wort: الْمَغْرِب ist der Ort und die Zeit des Sonnenuntergangs, also des Westens — dieselbe Wurzel غ ر ب. Wenn du an Maghrib denkst, hast du die Himmelsrichtung. ⭐ Und der Staat Marokko heißt الْمَغْرِب, weil er ganz im Westen liegt.',
    'Merke das Paar über die Sonne: die Sonne kommt aus dem شَرْق (Osten) — dieselbe Wurzel wie in إِشْرَاق, dem Aufgehen — und geht im غَرْب unter. Zwei Wörter, eine Bewegung über den Himmel. Beide hast du als Vokabel.'
  ],

  /* قَهْوَةٌ - Kaffee */
  '45851': [
    '⚠️ Der zweite Buchstabe ist ه, der gehauchte Laut, nicht das kratzige ح: qah-wa. Sprich es einmal übertrieben mit Ausatmen in der Mitte. Wer stattdessen ح sagt, sagt ein anderes Wort — dieselbe Falle wie bei حَمَّامٌ gegen الْهِنْد.',
    'Das Wort ist weiblich (تاء مَرْبُوطة), also: قَهْوَةٌ حَارَّةٌ mit ة am Adjektiv. Vergleiche mit شَايٌ حَارٌّ ohne ة — dasselbe Adjektiv, zwei Formen, weil die Getränke verschiedenes Geschlecht haben. Ein Paar, an dem man die Regel نَعْت sofort sieht.'
  ],

  /* أَنْفٌ - Nase */
  '45852': [
    'Geh die Wuḍūʾ-Reihenfolge durch, dann hast du fünf Vokabeln in einer Bewegung: يَدٌ (Hände), فَمٌ (Mund), أَنْفٌ (Nase), وَجْه, يَدٌ, رَأْس, أُذُنٌ (Ohren), رِجْلٌ (Füße). Die fünf, die du als Vokabel hast, kommen dabei alle vor — üb sie in der Reihenfolge, nicht alphabetisch.',
    'Der Plural ist unerwartet: أَنْفٌ → أُنُوفٌ, mit ū statt ā. Vergleiche mit عَيْنٌ → عُيُونٌ und قِدْرٌ → قُدُورٌ — dasselbe Muster فُعُول. Drei Körper- und Haushaltswörter, ein Plural. ⚠️ Und أَفْوَاهٌ zu فَمٌ fällt genau NICHT darunter.'
  ],

  /* فَمٌ - Mund */
  '45853': [
    'Das kürzeste Wort deiner Liste: nur ف und م. ⚠️ Und der Plural sieht aus wie von einem anderen Wort: فَمٌ → أَفْوَاهٌ, mit einem و, das im Singular gar nicht vorkommt. Das ist kein Fehler — der Singular hat den Buchstaben verloren, nicht der Plural ihn dazuerfunden.',
    'Merke es in der Wuḍūʾ-Gruppe mit أَنْفٌ (Nase): beim Waschen kommen Mund und Nase direkt nacheinander. Zwei Vokabeln, eine Handbewegung, die du ohnehin jeden Tag machst.'
  ],

  /* قِدْرٌ - Kochtopf */
  '45854': [
    '⭐ Die Wurzel ق د ر trägt eine der bekanntesten Suren, die du auswendig kannst: لَيْلَةِ ٱلْقَدْرِ (97:1) — die Nacht der Bestimmung. Ein قَدَر ist ein Maß, eine Bestimmung; ein قِدْر ist das Gefäß mit einem bestimmten Maß. Küchentopf und Schicksal aus derselben Wurzel — das vergisst man nicht.',
    'Der Plural قُدُورٌ folgt dem Muster فُعُول wie أُنُوفٌ (Nasen) und عُيُونٌ (Augen), die du beide hast. ⚠️ Und nicht mit قَدِيمٌ (alt) verwechseln — das hat die Wurzel ق د م mit م am Ende, nicht ر.'
  ],

  /* أُذُنٌ - Ohr */
  '45855': [
    '⭐ Die stärkste Verknüpfung deiner ganzen Liste: أُذُنٌ (Ohr) und مُؤَذِّنٌ (Gebetsrufer) haben dieselbe Wurzel أ ذ ن. Der Muezzin ruft in die Ohren. Und derselbe Stamm heißt auch „Erlaubnis" — in Sūrat al-Qadr steht بِإِذْنِ رَبِّهِم (97:4), „mit der Erlaubnis ihres Herrn". Wer zuhört, gehorcht.',
    'Der Plural ist آذَانٌ mit einem Madda-Alif am Anfang. ⚠️ Verwechslungsgefahr: أَذَان (der Gebetsruf) und آذَان (Ohren) sehen fast gleich aus und unterscheiden sich nur im ersten Zeichen. Beides gehört zur selben Wurzel — der Ruf und das, was ihn hört.'
  ],

  /* عَيْنٌ - Auge */
  '45856': [
    'In Sūrat at-Takāthur, die du auswendig kannst, steht dein Wort wörtlich: عَيْنَ ٱلْيَقِينِ (102:7) — „mit dem Auge der Gewissheit". Eine إِضافة, wie du sie gerade lernst: erstes Wort ohne Tanwīn, zweites im Genitiv.',
    'عَيْنٌ heißt Auge UND Quelle — beides Stellen, aus denen Wasser kommt. ⭐ Genau das steht am Ende von 67:30, das du kennst: بِمَآءٍ مَّعِينٍ, „mit hervorquellendem Wasser". Dieselbe Wurzel ع ي ن. Ein Wort, zwei Bilder, und der Koran benutzt beide.'
  ],

  /* يَدٌ - Hand */
  '45857': [
    'Sūrat al-Masad beginnt damit, und du kannst sie auswendig: تَبَّتْ يَدَآ أَبِي لَهَبٍ (111:1) — „zugrunde gehen sollen die Hände Abū Lahabs". يَدَا ist der Dual, also genau ZWEI Hände. Dein Wort, dein Vers, und nebenbei die Dualform.',
    '⚠️ Der Plural أَيْدٍ endet auf ein Tanwīn ohne sichtbaren Buchstaben — das ist die Stolperstelle, nicht das kurze Wort selbst. Sprich ihn: ay-din. Solche Endungen kommen bei Wörtern vor, deren letzter Wurzelbuchstabe schwach ist; يَدٌ hat die Wurzel ي د ي.'
  ],

  /* رِجْلٌ - Bein / Fuß */
  '45858': [
    '⚠️ Dein wichtigster Verwechslungsfall überhaupt: رِجْلٌ (Bein) und رَجُلٌ (Mann) bestehen aus denselben drei Buchstaben ر ج ل. Nur die Vokale trennen sie: RIDSCH-l gegen RA-DSCHUL. Deshalb immer laut sprechen, nie nur lesen — ohne Taschkīl sieht man den Unterschied nicht.',
    'Der Plural hilft beim Trennen, weil er ganz verschieden ist: رِجْلٌ → أَرْجُلٌ (Beine), رَجُلٌ → رِجَالٌ (Männer). Sprich alle vier hintereinander: riǧl – arǧul – raǧul – riǧāl. Wer die Plurale kann, verwechselt die Singulare nicht mehr.'
  ],

  /* سَرِيعٌ - schnell */
  '45859': [
    'Muster فَعِيل wie das halbe Kapitel 3 — كَبِير, صَغِير, قَرِيب, جَمِيل. ⭐ Und der Plural läuft wie dort: سَرِيعٌ → سِرَاعٌ, genau wie طَوِيلٌ → طِوَالٌ und قَصِيرٌ → قِصَارٌ. Ein Muster für Singular und Plural gleichzeitig.',
    'Von derselben Wurzel س ر ع kommt أَسْرَعَ (sich beeilen) und سُرْعَة (die Geschwindigkeit) — das Wort, das auf Verkehrsschildern steht. Wer die Wurzel hat, liest auch das Schild.'
  ],

  /* نَافِذَةٌ - Fenster */
  '45860': [
    'Die Wurzel ن ف ذ heißt durchdringen — ein Fenster ist die Stelle, durch die Licht und Luft DURCHGEHEN. ⭐ Von derselben Wurzel kommt نُفُوذ, der Einfluss: etwas, das durchdringt. Bild und Wort passen so genau zusammen, dass man es nicht mehr auswendig lernen muss.',
    'Muster فَاعِلَة, also die weibliche Form von فَاعِل — dasselbe Muster wie جَالِسٌ und وَاقِفٌ, nur mit تاء مَرْبُوطة. ⚠️ Der Plural bricht auf zu نَوَافِذُ, mit einem و, das im Singular fehlt. Sprich beide: nā-fi-dha, na-wā-fidh.'
  ],

  /* شَرْقٌ - Osten */
  '45861': [
    'Die Sonne macht die Eselsbrücke: sie geht im شَرْق auf und im غَرْب unter. Von شَرْق kommt إِشْرَاق, das Aufgehen — und der Name اَلشَّرْق الْأَوْسَط, der Nahe Osten, wörtlich „der mittlere Osten". Ein Wort, das dir in jeder Nachrichtensendung begegnet.',
    '⚠️ Der erste Buchstabe ش hat drei Punkte und wird „sch" gesprochen — nicht zu verwechseln mit س. Im Paar mit غَرْب: das غ ist der Gurgellaut hinten im Hals. Zwei Himmelsrichtungen, zwei Laute, die es im Deutschen so nicht gibt. Beide einmal übertrieben sprechen.'
  ],

  /* أَخٌ - Bruder. ⚠️ Die beiden letzten Woerter dieses Kapitels tragen KEINE
     Zahl als Id, sondern einen sprechenden Schluessel - sie stammen aus dem
     Madina-Schluessel und nicht aus dem arabicroots-Abzug. */
  'madina1-l6-ach': [
    '⚠️ أَبٌ und أَخٌ verhalten sich gleich und gehören zusammen gelernt: beide verlängern sich, sobald etwas folgt — أَبُو بَكْرٍ, أَخُو مُحَمَّدٍ. Allein stehen sie kurz (أَبٌ, أَخٌ), in einer إِضافة werden sie lang. Wer eines kann, kann beide.',
    'Der Begriff, der es festhält, ist einer, den du oft hörst: أَخٌ فِي الْإِسْلَام, der Bruder im Islam — und die Anrede يَا أَخِي, „o mein Bruder". Das يَا davor ist die Rufpartikel aus deinen Regeln, das ـِي am Ende heißt „mein". Ein Ausdruck, drei Bausteine.'
  ],

  /* أُخْتٌ - Schwester */
  'madina1-l6-ucht': [
    '⚠️ Wie بِنْتٌ endet auch أُخْتٌ auf ein echtes ت mit Sukūn, NICHT auf die تاء مَرْبُوطة ة. Beide sind weiblich, ohne es zu zeigen — dein Lehrer nennt solche Wörter مؤنث بلا تاء. Merke die zwei als Paar, dann ist die Ausnahme nur einmal zu lernen.',
    'Der Unterschied zum Bruder steckt allein im Vokal und im ت: أَخٌ mit Fatḥah, أُخْتٌ mit Ḍammah. Sprich sie hintereinander — ach, ucht. Und die Anrede läuft parallel: يَا أَخِي für den Bruder, يَا أُخْتِي für die Schwester.'
  ],

  /* ===================== Kapitel 7 — Tiere und Berufe =============== */

  /* نَاقَةٌ - Kamelstute */
  '45862': [
    '⚠️ Der Punkt ist nicht das Tier, sondern das Geschlecht: جَمَلٌ ist das männliche Kamel, نَاقَةٌ das weibliche. Dieselbe Ordnung hast du bei دِيكٌ (Hahn) und دَجَاجَةٌ (Henne). Im Deutschen sagt man „Kamel" für beide — im Arabischen sind es zwei Vokabeln, und du hast beide.',
    'Die تاء مَرْبُوطة macht hier das WEIBLICHE Tier, nicht das einzelne Stück. ⚠️ Vergleiche mit بَقَرَةٌ und بَطَّةٌ, wo dasselbe ة das Einzeltier aus der Art heraushebt (بَقَرٌ ist das Rindvieh, بَقَرَةٌ die eine Kuh). Dasselbe Zeichen, zwei Aufgaben — hinsehen, welche gemeint ist.'
  ],

  /* بَطَّةٌ - Ente */
  '45863': [
    'Die شَدَّة verrät die Wurzel ب ط ط: zwei ط, im Singular zusammengezogen. Dasselbe siehst du bei قِطٌّ (Katze), عَمٌّ (Onkel) und أُمٌّ (Mutter) — alle vier hast du. Sprich sie hintereinander, dann hörst du den Doppelschlag am Wortende.',
    'Bau dir den Hof aus deinen eigenen Vokabeln: بَطَّةٌ (Ente), دَجَاجَةٌ (Henne), دِيكٌ (Hahn), بَقَرَةٌ (Kuh), حِمَارٌ (Esel), حِصَانٌ (Pferd), جَمَلٌ (Kamel). Sieben Tiere, die du alle hast — als Bild eines Hofes leichter zu behalten als sieben einzelne Karten.'
  ],

  /* مُمَرِّضَةٌ - Krankenschwester */
  '45864': [
    'Drei Wörter aus der Wurzel م ر ض, und der Weg ist logisch: مَرَض ist die Krankheit, مَرِيض der Kranke, مُمَرِّضَة die, die ihn pflegt. ⚠️ Und das Muster مُفَعِّل beschreibt den, der etwas AKTIV tut — dieselbe Form wie مُدَرِّسٌ (Lehrer) und مُؤَذِّنٌ (Gebetsrufer), die du beide hast.',
    'Die männliche Form heißt مُمَرِّضٌ, ohne das ة — und beides gibt es. ⚠️ Bei Berufen entscheidet die تاء مَرْبُوطة über das Geschlecht der Person, nicht über die Sache: مُدَرِّسٌ / مُدَرِّسَةٌ, مُمَرِّضٌ / مُمَرِّضَةٌ. Ein Zeichen, und der Beruf wechselt die Person.'
  ],

  /* بَيْضَةٌ - Ei */
  '45865': [
    'Die Wurzel ب ي ض heißt weiß — das Ei ist „das Weiße". ⭐ Von derselben Wurzel kommt أَبْيَض (weiß), und das gehört zum Farbmuster أَفْعَل, dem auch أَسْوَد (schwarz) folgt — das du aus الْحَجَرُ الْأَسْوَد kennst. Farben und Ei aus einem Stamm.',
    'Auch hier trennt die تاء مَرْبُوطة das Einzelne von der Menge: بَيْضٌ sind Eier als Sache, بَيْضَةٌ ist das eine Ei. Dieselbe Ordnung wie بَقَرٌ / بَقَرَةٌ und دَجَاجٌ / دَجَاجَةٌ. Drei Paare, eine Regel — wer sie einmal sieht, braucht die Plurale nicht einzeln.'
  ],

  /* مُؤَذِّنٌ - Gebetsrufer */
  '45866': [
    'In Sūrat al-Qadr, die du auswendig kannst, steht die Wurzel: بِإِذْنِ رَبِّهِم (97:4) — „mit der Erlaubnis ihres Herrn". Dieselbe Wurzel أ ذ ن wie in أُذُنٌ (Ohr) und أَذَان (Gebetsruf). Hören, erlauben, rufen — ein Stamm, drei Bedeutungen, alle mit „Ohr" im Kern.',
    'Muster مُفَعِّل für den, der etwas aktiv tut: مُؤَذِّنٌ, مُدَرِّسٌ, مُمَرِّضَةٌ — alle drei hast du. ⚠️ Die Hamzah sitzt auf einem و: مُؤَذِّن. Das ist keine Laune, sondern folgt der Aussprache; sprich es langsam: mu-ʾadh-dhin, mit hörbarer شَدَّة auf dem ذ.'
  ],

  /* دَجَاجَةٌ - Henne */
  '45867': [
    'Merke es im Paar mit دِيكٌ (Hahn), das du auch hast: دِيك männlich, دَجَاجَة weiblich. ⚠️ Und in der Küche begegnet dir دَجَاج als Sammelwort für Hühnerfleisch — ohne das ة. Wer im arabischen Restaurant دَجَاج liest, weiß jetzt, was kommt.',
    'Das doppelte د der Wurzel د ج ج hörst du nicht sofort, weil ein langes ā dazwischen liegt: da-ǧā-ǧa. Sprich es einmal Silbe für Silbe. ⚠️ Nicht mit دَرَّاجَةٌ (Fahrrad) verwechseln — beide fangen mit د an und haben ein ā in der Mitte, aber dort steht ein ر.'
  ],

  /* ===================== Kapitel 8 — Länder und Dinge =============== */

  /* أَمْرِيكَا - Amerika */
  '45868': [
    '⚠️ Ländernamen aus fremden Sprachen haben KEINE arabische Wurzel — sie sind nur nachgeschrieben. Such also nicht nach einer Bedeutung, sondern achte auf die Buchstabenfolge: أَمْرِيكَا, mit ر vor dem ي. Das ist die einzige Stelle, an der man stolpert.',
    'Diese Ländergruppe trägt KEINEN Artikel: أَمْرِيكَا, أَلْمَانِيَا, إِنْجِلْتَرَا, سُوِيسْرَا. Die andere Gruppe trägt ihn fest: الْيَابَان, الصِّين, الْهِنْد, الْعِرَاق, الْفِلِيبِّين. ⚠️ Es gibt keine Regel dafür — merke sie in zwei Haufen, mit und ohne اَلْ.'
  ],

  /* سِكِّينٌ - Messer */
  '45869': [
    '⭐ In Sūrat al-Māʿūn, die du auswendig kannst, steht ein Wort mit derselben Wurzel س ك ن: طَعَامِ ٱلْمِسْكِينِ (107:3) — „die Speisung des Armen". Der مِسْكِين ist der, der still bleibt; سَكِينَة ist die innere Ruhe. Der Merkhaken zum Messer ist frei gewählt, die Wurzelverwandtschaft der beiden anderen nicht.',
    'Das doppelte ك muss man hören: sik-kīn. ⚠️ Der Plural bricht auf zu سَكَاكِينُ — dasselbe Muster wie دُكَّانٌ → دَكَاكِينُ, das du schon hast. Beide haben eine شَدَّة im Singular und verlieren sie im Plural, dafür kommt ein langes ī vor dem letzten Buchstaben.'
  ],

  /* أَلْمَانِيَا - Deutschland */
  '45870': [
    'Dein eigenes Land — das sitzt am schnellsten, wenn du den Satz einmal sagst: أَنَا مِنْ أَلْمَانِيَا. Damit übst du gleich مِنْ mit seinem Genitiv und hast einen Satz, den du auf Arabisch wirklich brauchen wirst.',
    '⚠️ Nicht mit dem Artikel versehen: es heißt أَلْمَانِيَا, nicht الْأَلْمَانِيَا. Das أَ am Anfang gehört zum Namen und ist KEIN اَلْ. Genau dieselbe Falle wie bei أَمْرِيكَا. Zum Vergleich: الْعِرَاق trägt den Artikel wirklich, und dort verschmilzt er im Klang.'
  ],

  /* إِنْجِلْتَرَا - England */
  '45871': [
    'Zwei deiner Vokabeln teilen den Anfang: إِنْجِلْتَرَا (England) und إِنْجِلِيزِيَّةٌ (Englisch). Lern sie als Paar — Land und Sprache, dieselbe Anfangssilbe إِنْجـ. ⚠️ Und die Sprache trägt die Endung ـِيَّة, die aus einem Namen eine Zugehörigkeit macht.',
    'Die Endung ـِيَّة ist ein Muster, das dir überall begegnet, und du hast drei davon: إِنْجِلِيزِيَّةٌ (Englisch), عَرَبِيَّةٌ (Arabisch), ثَانَوِيَّةٌ (weiterführende Schule). Immer ein ي mit شَدَّة und eine تاء مَرْبُوطة. Wer das Muster kennt, bildet neue Sprachnamen selbst.'
  ],

  /* الْعِرَاقُ - Irak */
  '45872': [
    'Der Artikel gehört fest zum Namen, wie bei الصِّين, الْهِنْد, الْيَابَان und الْفِلِيبِّين — vier Länder, die du schon hast. ⚠️ Und ع ist ein Mondbuchstabe, deshalb hörst du das ل: al-ʿIrāq, nicht aʿ-ʿIrāq. Vergleiche mit الصِّين, wo das ل verschwindet, weil ص ein Sonnenbuchstabe ist.',
    '⚠️ Der erste Buchstabe ist ع, der tiefe Kehllaut — nicht أ. Sprich beide hintereinander: al-ʿIrāq gegen أَلْمَانِيَا. Im Deutschen klingt der Anfang von „Irak" wie ein normales i; im Arabischen ist es ein eigener Buchstabe, den man üben muss.'
  ],

  /* سُوِيسْرَا - Schweiz */
  '45873': [
    'Nimm es zur Ländergruppe ohne Artikel: سُوِيسْرَا, أَمْرِيكَا, أَلْمَانِيَا, إِنْجِلْتَرَا. Vier Namen, die aus fremden Sprachen kommen und deshalb weder Wurzel noch اَلْ haben. ⚠️ Die Stolperstelle ist das و in der Mitte — es steht für „w", nicht für ein langes u.',
    'Übe alle Länder in einem Satzmuster, statt sie einzeln abzufragen: هَذَا الطَّالِبُ مِنْ سُوِيسْرَا. Setz reihum ein anderes Land ein — du hast neun davon. Ein Satz, neun Vokabeln, und nebenbei sitzt مِنْ.'
  ],

  /* مُسْتَشْفًى - Krankenhaus */
  '45874': [
    '⭐ Das Muster ist der ganze Gewinn: مُسْتَفْعَل, und das سْتَـ in der Mitte heißt „nach etwas SUCHEN". Die Wurzel ش ف ي ist Heilung — das Krankenhaus ist der Ort, an dem man Heilung sucht. Wenn dir dieses سْتَـ wieder begegnet, weißt du schon die halbe Bedeutung.',
    '⚠️ Am Ende steht eine أَلِف مَقْصورة — das ى ohne Punkte, gesprochen wie langes ā: mus-tasch-fā. Genau der Fachbegriff, den du gelernt hast. Und im Plural wird daraus wieder ein echtes ي: مُسْتَشْفَيَاتٌ. Dasselbe Verhalten wie bei عَلَى → عَلَيْهِ.'
  ],

  /* ===================== Kapitel 9 — Sprache, Stadt, Alltag ========= */

  /* فَاكِهَةٌ - Obst */
  '45875': [
    'Im Koran steht فَاكِهَة für die Früchte des Paradieses — ein Wort, das immer im Zusammenhang mit Belohnung fällt. ⚠️ Der Plural ist فَوَاكِهُ, mit einem و, das im Singular fehlt: fa-wā-kih. Dasselbe Muster wie نَافِذَةٌ → نَوَافِذُ, das du auch hast.',
    'Setz es über dein تُفَّاحٌ (Apfel): der Apfel ist die Sorte, das Obst der Oberbegriff. Dasselbe Verhältnis hast du zweimal in diesem Kapitel — عُصْفُورٌ (Spatz) steht unter طَائِرٌ (Vogel). Oberbegriff und Beispiel zusammen zu lernen ist leichter als jedes für sich.'
  ],

  /* عُصْفُورٌ - Spatz */
  '45876': [
    '⭐ Sūrat al-Fīl, die du auswendig kannst, endet mit deiner Wurzel: كَعَصْفٍ مَّأْكُولٍ (105:5) — „wie abgefressene Halme". عَصْف sind die zerfressenen Blätter; dieselbe Wurzel ع ص ف trägt عَاصِفَة, den Sturm, und deinen عُصْفُور. Alles, was klein, leicht und weggeweht ist.',
    '⚠️ Der Plural bricht weit auf: عُصْفُورٌ → عَصَافِيرُ. Das ist das Vierbuchstaben-Muster, das du von دُكَّانٌ → دَكَاكِينُ und سِكِّينٌ → سَكَاكِينُ kennst: langes ā vorne, langes ī vor dem letzten Buchstaben, und kein Tanwīn.'
  ],

  /* طَائِرٌ - Vogel */
  '45877': [
    'In derselben Sure steht das Wort selbst: وَأَرْسَلَ عَلَيْهِمْ طَيْرًا (105:3) — „und Er sandte gegen sie Vögel". طَيْر ist die Sammelform, طَائِر der einzelne Vogel. Wer al-Fīl spricht, hat zwei Vokabeln dieses Kapitels auf einmal: den Vogel und den Spatz.',
    'Muster فَاعِل — „der Fliegende", von der Wurzel ط ي ر (fliegen). Dieselbe Form wie جَالِسٌ (sitzend), وَاقِفٌ (stehend), شَارِعٌ (Straße), die du alle hast. ⚠️ Die Hamzah auf dem أ steht dort, weil ein schwacher Wurzelbuchstabe ي in der Mitte sitzt — dasselbe siehst du bei نَافِذَة nicht, weil deren Wurzel stark ist.'
  ],

  /* عَرَبِيَّةٌ - Arabisch */
  '45878': [
    'Die Endung ـِيَّة macht aus einem Namen eine Zugehörigkeit, und du hast drei Beispiele: عَرَبِيَّةٌ (arabisch), إِنْجِلِيزِيَّةٌ (englisch), ثَانَوِيَّةٌ (die zweite Stufe). Immer ein ي mit شَدَّة, dann eine تاء مَرْبُوطة. Wer das Muster hat, bildet jede weitere Sprache selbst.',
    'Zusammen mit لُغَةٌ (Sprache) ergibt es اللُّغَةُ الْعَرَبِيَّةُ — genau das, was du gerade lernst. ⚠️ Und es ist eine Wortgruppe mit نَعْت, keine إِضافة: BEIDE Wörter tragen اَلْ, und beide stehen im selben Fall. Bei einer إِضافة hätte nur das zweite den Artikel.'
  ],

  /* لُغَةٌ - Sprache */
  '45879': [
    'Merke es nie allein, sondern als Wortgruppe: اللُّغَةُ الْعَرَبِيَّةُ, die arabische Sprache. Beide Wörter hast du in diesem Kapitel — zusammen sind sie ein Ausdruck, den du täglich brauchst, einzeln zwei Karteikarten.',
    '⚠️ Das erste ل wird verschluckt, weil ل ein Sonnenbuchstabe ist: geschrieben اَللُّغَة, gesprochen al-lugha mit doppeltem l. Dasselbe hörst du bei اللَّبَن und اللهُ. Ein guter Ort, um die Sonnenbuchstaben-Regel an einem Wort zu prüfen, das du oft sagst.'
  ],

  /* سَهْلٌ - leicht */
  '45880': [
    'Das Gegenpaar arbeitet auch im Klang: „sahl" ist kurz und weich, „ṣaʿb" hart und stockend. Sprich beide hintereinander, dann trägt dich der Laut. ⚠️ Und pass auf die zweite Bedeutung auf: سَهْل heißt auch die Ebene, das flache Land — was eben ist, ist leicht zu gehen.',
    'Beide sind kurze Adjektive nach dem Muster فَعْل, nicht فَعِيل wie das halbe Kapitel 3. ⚠️ Ihre Plurale gehen trotzdem denselben Weg: سَهْلٌ → سُهُولٌ und صَعْبٌ → صِعَابٌ. Sprich alle vier, dann hörst du, dass die Plurale länger sind als die Singulare.'
  ],

  /* مُجْتَهِدٌ - fleißig */
  '45881': [
    '⭐ Die Wurzel ج ه د kennst du längst — aus جِهَاد (Anstrengung) und اِجْتِهَاد (das eigenständige Bemühen um ein Urteil). Der مُجْتَهِد ist wörtlich „der, der sich müht". Ein Wort, das im Glauben und im Klassenzimmer dasselbe meint.',
    'Muster مُفْتَعِل mit einem eingeschobenen ت — vergleiche مُجْتَهِد mit اِجْتِهَاد: derselbe Baustein. ⚠️ Nicht mit مُفَعِّل verwechseln (مُدَرِّس, مُؤَذِّن, مُمَرِّضَة), das eine شَدَّة hat statt eines ت. Zwei Muster, beide mit مُـ, beide „der, der etwas tut".'
  ],

  /* مَشْهُورٌ - berühmt */
  '45882': [
    'In Sūrat al-Qadr, die du auswendig kannst, steht die Wurzel: خَيْرٌ مِّنْ أَلْفِ شَهْرٍ (97:3) — „besser als tausend Monate". شَهْر ist der Monat, und ش ه ر ist dieselbe Wurzel wie in مَشْهُور: was in aller Munde ist, ist bekannt gemacht.',
    'Muster مَفْعُول, das PASSIVE Partizip: „bekannt GEMACHT". ⚠️ Vergleiche mit مُغْلَقٌ (geschlossen), das du hast — auch ein Passiv, aber nach dem Muster مُفْعَل. Zwei Wege zu derselben Idee; am Muster erkennst du, dass etwas mit dem Wort geschieht, nicht dass es selbst handelt.'
  ],

  /* إِنْجِلِيزِيَّةٌ - Englisch */
  '45883': [
    'Land und Sprache gehören zusammen: إِنْجِلْتَرَا (England) und إِنْجِلِيزِيَّةٌ (Englisch), beide hast du. Die Endung ـِيَّة macht aus dem Ort die Sprache — genau wie bei عَرَبِيَّةٌ. Zwei Karten, ein Gedanke.',
    'Sprich es in Silben, dann verliert es den Schrecken: in-ǧi-lī-ziy-ya. ⚠️ Das ي vor der Endung trägt eine شَدَّة und muss doppelt klingen. Dasselbe gilt für عَرَبِيَّة und ثَانَوِيَّة — bei allen drei liegt die Betonung auf dieser doppelten Silbe.'
  ],

  /* صَعْبٌ - schwierig */
  '45884': [
    '⚠️ Zwei schwere Laute in einem kurzen Wort: ص ist der dunkle s-Laut, ع der tiefe Kehllaut. Sprich es einmal übertrieben — ṣaʿb. Genau diese beiden Buchstaben machen das Wort schwierig, und das ist die Eselsbrücke.',
    'Gegenpaar mit سَهْلٌ, und beide beschreiben nicht nur Aufgaben: صَعْب ist auch das schwer Zugängliche, سَهْل die Ebene. Nimm dazu deinen eigenen Satzbau: اللُّغَةُ الْعَرَبِيَّةُ سَهْلَةٌ — mit ة, weil لُغَة weiblich ist. Ein Satz, an dem du das نَعْت gleich mitübst.'
  ],

  /* مَدِينَةٌ - Stadt */
  '45885': [
    '⭐ Dein ganzes Lehrbuch heißt danach: الْمَدِينَة, die Stadt des Propheten — und die Madina-Bücher sind nach ihr benannt. Ein Wort, das auf dem Umschlag steht, den du jeden Tag ansiehst.',
    '⚠️ Der Plural ist unerwartet kurz: مَدِينَةٌ → مُدُنٌ, mu-dun. Aus einem langen ī wird ein kurzes u, und die تاء مَرْبُوطة fällt weg. Vergleiche mit غُرْفَةٌ → غُرَفٌ, das du auch hast — auch dort wird der Plural kürzer als der Singular.'
  ],

  /* الْقَاهِرَةُ - Kairo */
  '45886': [
    '⭐ In Sūrat aḍ-Ḍuḥā, die du auswendig kannst, steht die Wurzel als Verb: فَلَا تَقْهَرْ (93:9) — „so unterjoche sie nicht", über die Waise. Dieselbe Wurzel ق ه ر trägt الْقَهَّار, einen der Namen Allahs, und den Namen der Stadt: الْقَاهِرَة, „die Bezwingerin".',
    'Muster فَاعِلَة, also die weibliche Form von فَاعِل — dasselbe wie نَافِذَةٌ (Fenster). Städtenamen sind im Arabischen oft weiblich. ⚠️ Und der Artikel gehört fest dazu: الْقَاهِرَة, nie قَاهِرَة allein.'
  ],

  /* يَوْمٌ - Tag */
  '45887': [
    'Du sprichst es in jedem Gebet: مَٰلِكِ يَوْمِ ٱلدِّينِ (1:4) — „dem Herrscher am Tag des Gerichts". Das ist zugleich eine إِضافة in einer إِضافة: مَالِكِ zu يَوْمِ, und يَوْمِ zu الدِّينِ. Deine Vokabel steht mitten in einem Satz, den du auswendig kannst.',
    '⚠️ Der Plural verdoppelt das ي: يَوْمٌ → أَيَّامٌ, ay-yām. Und mit Artikel wird aus dem Tag „heute": الْيَوْمُ. Beide hast du als eigene Vokabel — merke sie als ein Paar, dann ist die zweite Karte fast geschenkt.'
  ],

  /* لِمَاذَا - warum */
  '45888': [
    'Zerlegen ist hier die ganze Eselsbrücke: لِـ („für") + مَاذَا („was") = „wofür?", also warum. Beide Teile kennst du — لِ aus deinen Regeln und مَا als eigene Vokabel. Ein zusammengesetztes Wort, das man nicht auswendig lernen muss, wenn man es einmal auseinandergenommen hat.',
    'Sortiere es zu den Fragewörtern, die du schon hast: مَا (was), أَيْنَ (wo), لِمَاذَا (warum) — dazu aus deinen Regeln مَنْ (wer), هَلْ und أَ (ja/nein). ⚠️ Alle außer هَلْ und أَ verlangen eine Antwort mit Inhalt, nicht mit ja oder nein.'
  ],

  /* كُوبٌ - Tasse / Becher */
  '45889': [
    'Bau den Tisch aus deinen Vokabeln: ein كُوب (Becher) mit شَاي oder قَهْوَة oder مَاء darin, dazu مِلْعَقَة (Löffel) und سُكَّر (Zucker). Sechs Wörter, eine Szene — und alle sechs hast du.',
    'Der Plural ist أَكْوَابٌ, dasselbe Muster wie بَابٌ → أَبْوَابٌ und وَرَقٌ → أَوْرَاقٌ. ⚠️ Achte auf das و der Wurzel ك و ب: im Singular ist es ein langes ū, im Plural wird es zum sichtbaren و mit Sukūn. Derselbe Wechsel wie bei سُوقٌ → أَسْوَاقٌ.'
  ],

  /* مَكْتَبَةٌ - Bibliothek */
  '45890': [
    '⭐ Drei Wörter, eine Wurzel ك ت ب, und du hast alle drei: كِتَابٌ (das Buch), مَكْتَبٌ (der Schreibtisch, der Ort des Schreibens), مَكْتَبَةٌ (die Bibliothek, der Ort der Bücher). Das مَـ macht den Ort, die تاء مَرْبُوطة macht daraus die Sammlung.',
    'Im Koran steht dieselbe Wurzel als أَهْلِ ٱلْكِتَٰبِ (98:1) — „die Leute der Schrift", in Sūrat al-Bayyina, die du auswendig kannst. Wer den Vers spricht, hat den ganzen Stamm: Buch, Schreibtisch, Bibliothek, Schrift.'
  ],

  /* الْآنَ - jetzt */
  '45891': [
    'Das Madda-Alif آ ist die eigentliche Vokabel: es steht für zwei Alif hintereinander und wird lang gesprochen — al-ān. ⚠️ Du siehst dasselbe Zeichen im Plural von أُذُنٌ: آذَانٌ. Ein Zeichen, das man einmal bewusst ansehen sollte, dann erkennt man es überall.',
    'Nimm die Zeitwörter zusammen, die du hast: الْآنَ (jetzt), الْيَوْمُ (heute), يَوْمٌ (Tag). ⚠️ Alle drei stehen im Satz meist am ENDE: الْمُدَرِّسُ هُنَا الْآنَ, الْمَاءُ بَارِدٌ الْيَوْمَ. Das ist kein Zufall, sondern die übliche Stellung von Zeitangaben.'
  ],

  /* مُسْتَوْصَفٌ - Klinik */
  '45892': [
    'Zwei Wörter, ein Bauplan مُسْتَفْعَل, und beide hast du: مُسْتَشْفًى (Krankenhaus, wo man Heilung SUCHT) und مُسْتَوْصَف (Klinik, wo man eine Beschreibung SUCHT, also eine Verschreibung). Das سْتَـ in der Mitte heißt immer „nach etwas suchen" — merk dir den Baustein, nicht die zwei Wörter.',
    'Die Wurzel و ص ف heißt beschreiben — daher وَصْف (die Beschreibung) und صِفَة (die Eigenschaft). ⚠️ Das و am Wortanfang der Wurzel ist schwach und verschwindet in vielen Formen; hier bleibt es sichtbar, weil das Muster es festhält.'
  ],

  /* مِرْوَحَةٌ - Ventilator */
  '45893': [
    'Werkzeug-مِـ, und du hast die ganze Reihe: مِفْتَاحٌ (Schlüssel), مِكْوَاةٌ (Bügeleisen), مِلْعَقَةٌ (Löffel), مِرْوَحَةٌ (Ventilator). Immer مِـ, dann die Wurzel, dann das Gerät. Wenn dir ein neues Ding mit مِـ begegnet, kennst du schon die halbe Bedeutung.',
    '⭐ Die Wurzel ر و ح trägt رِيح (Wind) und رُوح (Geist, Seele) — und in Sūrat al-Qadr steht وَٱلرُّوحُ (97:4), „und der Geist". Der Ventilator macht Wind aus derselben Wurzel, aus der der Geist kommt. Ein Bild, das größer ist als das Gerät.'
  ],

  /* الْكُوَيْتُ - Kuwait */
  '45894': [
    'Zwei Nachbarländer, beide mit Artikel: الْكُوَيْتُ und الْعِرَاقُ, die du beide hast. ⚠️ Bei beiden ist der erste Buchstabe ein Mondbuchstabe (ك und ع), deshalb hörst du das ل: al-Kuwait, al-ʿIrāq. Bei الصِّين dagegen verschwindet es.',
    'Der Name selbst ist eine Verkleinerung — „das kleine Fort". ⚠️ Für dich zählt vor allem die Schreibung: الْكُوَيْت hat ein و UND ein ي hintereinander, gesprochen „uway". Sprich es langsam: al-Ku-wayt.'
  ],

  /* ثَانَوِيَّةٌ - weiterführende Schule */
  '45895': [
    'Die Zahl steckt drin: ث ن ي ist die Wurzel von „zwei" — dieselbe wie in إِثْنَانِ, das du als eigene Vokabel hast. Die ثَانَوِيَّة ist die ZWEITE Stufe nach der مَدْرَسَة. Und ثَانِي heißt schlicht „der zweite".',
    'Wieder die Endung ـِيَّة, die du von عَرَبِيَّةٌ und إِنْجِلِيزِيَّةٌ kennst — sie macht aus einer Grundbedeutung eine Zugehörigkeit. ⚠️ Sprich die doppelte Silbe: thā-na-wiy-ya. Drei Wörter, ein Muster; wer eines kann, kann alle drei.'
  ],

  /* وَزِيرٌ - Minister */
  '45896': [
    '⭐ Es gibt eine Stelle aus deinem auswendigen Bereich, und sie ist besser als die bekannte: وَوَضَعْنَا عَنكَ وِزْرَكَ (94:2) — „und dir deine Last abgenommen", in Sūrat ash-Sharḥ. وِزْر ist die Last; ein وَزِير ist der, der sie mitträgt. Damit hängt die Vokabel an einer Sure, die du sprichst.',
    'Muster فَعِيل wie كَبِيرٌ, قَرِيبٌ, سَرِيعٌ. ⚠️ Der Plural bricht auf zu وُزَرَاءُ — dasselbe Muster wie فَقِيرٌ → فُقَرَاءُ und غَنِيٌّ → أَغْنِيَاءُ, die du beide hast. Alle drei enden auf ُ ohne Tanwīn.'
  ],

  /* حَادٌّ - scharf */
  '45897': [
    'Die شَدَّة ist der halbe Wortstamm: die Wurzel ist ح د د, zwei د auf eines zusammengezogen. Sprich es hörbar: ḥād-d. Dasselbe hast du bei حَارٌّ (heiß) — beide Adjektive, beide mit doppeltem letzten Wurzelbuchstaben, beide kurz.',
    'Von derselben Wurzel kommt حَدِيد (Eisen) — der Name von Sure 57 — und حَدّ, die Grenze. Was scharf ist, hat eine Kante. ⚠️ Und es passt zu deinem سِكِّينٌ (Messer): سِكِّينٌ حَادٌّ, ein scharfes Messer. Zwei Vokabeln, ein Satz.'
  ],

  /* إِنْدُونِيسِيَا - Indonesien */
  '45898': [
    'Sprich es in Silben, dann ist es leicht: in-dū-nī-si-yā. ⚠️ Kein Artikel, wie bei أَمْرِيكَا, أَلْمَانِيَا, إِنْجِلْتَرَا und سُوِيسْرَا — die fremden Namen tragen keinen. Merke die Länder in zwei Haufen: mit اَلْ und ohne.',
    'Ordne es zu den asiatischen Ländern, die du hast: الْيَابَانُ (Japan), الصِّينُ (China), الْهِنْدُ (Indien), الْفِلِيبِّينُ (Philippinen), إِنْدُونِيسِيَا. ⭐ Und merke dabei mit: Indonesien ist das Land mit den meisten Muslimen der Welt.'
  ],

  /* الْيَوْمُ - heute */
  '48402': [
    'Der Artikel macht den Unterschied: يَوْمٌ ist „ein Tag", الْيَوْمُ ist „der Tag" — und damit „heute". Genau dieselbe Verschiebung gibt es im Deutschen bei „heute" und „am Tage". Zwei Vokabeln, die zusammengehören und einzeln nur halb so viel wert sind.',
    '⚠️ Im Satz steht es meist am ENDE und trägt dort ein Fatḥah: الْمَاءُ بَارِدٌ الْيَوْمَ, nicht الْيَوْمُ. Das ist kein Tippfehler — Zeitangaben stehen im Akkusativ. Dir muss das noch nicht erklärt sein; merk dir vorerst nur, dass die Endung wechselt, wenn das Wort eine Zeitangabe ist.'
  ]

};
