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

  /* ---------- Selbst angelegte Woerter (20.08.2026) ---------- */
  "p_1787183484954": [
    "⭐ Die Ḥaraka, die du auf jeder Karteikarte siehst, heißt كَسْرَة — von derselben Wurzel ك س ر. Sie ist der Strich, der den Vokal nach unten „bricht\". Wer كَسْرَة sagt, hat مَكْسُورٌ schon halb im Mund.",
    "Das Gegenstück im Deutschen ist zweiteilig: „kaputt\" und „zerbrochen\". مَكْسُورٌ ist das zweite — ein Partizip, kein Zustandswort. Etwas ist مَكْسُورٌ, weil jemand oder etwas es gebrochen HAT.",
  ],
  "p_1787185012359": [
    "Die Form فَيْعِلٌ mit dem doppelten ي in der Mitte: سَيِّد. Die Wurzel ist س و د — das و wird im Wort zu ي. ⭐ Dasselbe passiert bei سَيِّدَةٌ.",
    "Im Deutschen sagst du „Herr\" auch dann, wenn du niemanden besitzt. Genauso سَيِّدٌ: es ist die höfliche Anrede, nicht der Herr über Diener.",
  ],
  "p_1787185031977": [
    "Wenn du سَيِّدٌ kannst, kannst du سَيِّدَةٌ — die تاء مَرْبُوطة ist im Arabischen der Normalweg zur weiblichen Form. ⭐ Sprich sie am Wortende als kurzes „a\", nicht als „t\": sayyida.",
    "Merke dir das Paar an einer Tür: an der einen steht سَيِّدٌ, an der anderen سَيِّدَةٌ. Dasselbe ة, das du bei تاء مَرْبُوطة gelernt hast.",
  ],
  "p_1787189845886": [
    "Die Wurzel خ ر ج steckt im مَخْرَج, dem „Ausgang\". ⭐ Im Tajwīd sind die مَخَارِج الْحُرُوف die Stellen im Mund, an denen ein Buchstabe HERAUSKOMMT — dieselbe Wurzel, derselbe Gedanke.",
    "Das Gegenteil ist دَخَلَ (hineingehen). ⭐ Ein Buchstabe Unterschied am Anfang, und die Richtung dreht sich um: خ hinaus, د hinein.",
  ],
  "p_1787191371934": [
    "Die Form فَعْلَانُ beschreibt einen Zustand, in dem du GERADE bist — nicht eine Eigenschaft, die du immer hast. ⭐ Wer كَسْلَانُ ist, ist heute faul, nicht sein Leben lang.",
    "⚠️ Achte auf die Endung: كَسْلَانُ trägt ein Ḍamma ohne Tanwīn, obwohl es unbestimmt ist. Das ist kein Tippfehler — Wörter dieser Form gehören zu denen, die kein Tanwīn annehmen.",
  ],

  /* بَيْتٌ - Haus */
  '45751': [
    'Du sprichst es in Quraysh mit: فَلْيَعْبُدُوا رَبَّ هَٰذَا الْبَيْتِ — „So sollen sie dem Herrn dieses Hauses dienen“ (106:3). Gemeint ist die كَعْبَةٌ, das Wort ist dasselbe wie für dein Haus.',
    'أَهْلُ الْبَيْتِ — „die Leute des Hauses“ — kennst du als feststehenden Ausdruck für die Familie des Propheten ﷺ. Dasselbe بَيْت, nur mit Artikel. Wer den Ausdruck kennt, hat die Vokabel schon im Kopf.'
  ],

  /* مَسْجِدٌ - Moschee */
  '45752': [
    'Du kennst zwei davon beim Namen: الْمَسْجِدُ الْحَرَامُ und الْمَسْجِدُ الْأَقْصَىٰ. Das Wort ist jedes Mal dasselbe, nur die Beschreibung dahinter wechselt.',
    'Die Wurzel س ج د sprichst du am Ende von al-ʿAlaq: وَاسْجُدْ وَاقْتَرِبْ — „wirf dich nieder und sei nah" (96:19). Die مَسْجِد ist der Ort dafür; das مَـ macht aus der Handlung einen Ort, wie bei مَكْتَبٌ und مَدْرَسَةٌ.'
  ],

  /* بَابٌ - Tür */
  '45753': [
    'أَبْوَابُ الْجَنَّةِ — die Tore des Paradieses, acht an der Zahl. Ein Begriff, den du kennst, und die Vokabel steckt mitten drin.',
    'Wer die Tür bewacht, heißt بَوَّاب — der Pförtner. Dieselbe Wurzel, und ein Beruf, den es in jedem größeren arabischen Haus gibt: die Tür und ihr Mann tragen denselben Namen.'
  ],

  /* كِتَابٌ - Buch */
  '45754': [
    'Aus al-Bayyina, die du auswendig kannst: مِنْ أَهْلِ الْكِتَابِ — „von den Leuten der Schrift" (98:1). Dasselbe Wort, das bei dir schlicht „Buch" heißt.',
    'Muster فِعَال — dieselbe Form wie حِمَارٌ (Esel) und حِصَانٌ (Pferd) aus diesem Kapitel. Drei Wörter, ein Rhythmus: ki-tāb, ḥi-mār, ḥi-ṣān.'
  ],

  /* قَلَمٌ - Stift */
  '45755': [
    'Aus al-ʿAlaq, der ersten Offenbarung: الَّذِي عَلَّمَ بِالْقَلَمِ — „Der mit dem Schreibrohr gelehrt hat“ (96:4). Das Wort steht ganz am Anfang.',
    'تَقْلِيمُ الْأَظْفَارِ, das Schneiden der Nägel, gehört zu den fünf Dingen der فِطْرَة — und es ist dieselbe Wurzel ق ل م: zuschneiden. Ein Rohr wurde zugeschnitten, damit man damit schreiben konnte; daher heißt der Stift قَلَم. (Buḫārī und Muslim.)'
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
    'Dieselbe Wurzel س ر ر trägt سُرُور, die Freude, und سِرّ, das Geheimnis. Das Bett ist der Ort, an den man sich zurückzieht und zur Ruhe kommt — daher der Name. (Aus den Wörterbüchern, nicht aus dem Unterricht.)',
    'Zwei Möbel, ein Bauprinzip: سَرِيرٌ und كُرْسِيٌّ hast du beide, beide tragen ein langes ī vor der letzten Silbe, und beide sagen, was man darauf tut — auf dem einen liegt man, auf dem anderen sitzt man. Wer sie als Paar lernt, verwechselt sie nicht mit مَكْتَبٌ, dem dritten Möbel in deiner Liste.'
  ],

  /* كُرْسِيٌّ - Stuhl */
  '45759': [
    'Du kennst den Namen آيَةُ الْكُرْسِيِّ, den Thronvers — genau dieses Wort steht darin. Was dort der Thron ist, ist hier der ganz gewöhnliche Stuhl.',
    'Das doppelte ي am Ende ist kein Zierrat, es ist eine Silbe: kur-siyy, mit hörbarem Nachschlag. Wer kur-si sagt, lässt sie weg — und genau daran hört man, ob jemand das Wort gelesen oder gehört hat.',
    'Denk ihn dir als Teil deiner Zimmereinrichtung, nicht als Einzelwort: مَكْتَبٌ zum Arbeiten, كُرْسِيٌّ zum Sitzen, سَرِيرٌ zum Schlafen. Alle drei stehen in deinem Bestand, und alle drei kommen im Buch im selben Zusammenhang vor — ein Wort davon ruft die anderen mit auf.'
  ],

  /* نَجْمٌ - Stern */
  '45760': [
    'Sure 53 trägt diesen Namen: النَّجْم. Wenn dir der Surenname begegnet, hast du die Vokabel — Stern.',
    'Deutsch und Arabisch machen dasselbe Bild: ein berühmter Mensch heißt im Deutschen „Star“, im Arabischen نَجْم. Beide Sprachen nehmen dafür den Himmelskörper. Wer نَجْم als „Star“ hört, hat beide Bedeutungen auf einmal.'
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
    'Im Ḥadīth von den Sieben, die Allah in Seinen Schatten nimmt, beginnt fast jede Zeile mit رَجُلٌ — „ein Mann, der …“. Einer davon ist «رَجُلٌ قَلْبُهُ مُعَلَّقٌ بِالْمَسَاجِدِ», dessen Herz an den Moscheen hängt. Wer den Ḥadīth einmal gehört hat, hat das Wort siebenmal gehört. (Buḫārī und Muslim.)',
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
    '⚠️ Esel und Pferd fangen beide mit حِـ an. Der Unterschied sitzt in der Mitte: م beim Esel (حِمَار), ص beim Pferd (حِصَان). Und im Plural trennen sich die beiden vollends: حُمُرٌ gegen أَحْصِنَةٌ.'
  ],

  /* حِصَانٌ - Pferd */
  '45769': [
    'Wurzel ح ص ن = befestigen, schützen — ein حِصْن ist eine Festung. Das Pferd war der Schutz des Reiters.',
    'Muster فِعَال wie كِتَابٌ (Buch) und حِمَارٌ (Esel). ⚠️ Gegen den Esel abgrenzen: م in der Mitte ist der Esel, ص das Pferd.'
  ],

  /* جَمَلٌ - Kamel */
  '45770': [
    'Zwei deiner Wörter teilen ج م ل: جَمَلٌ (Kamel) und جَمِيلٌ (schön). Für den Beduinen war das Kamel das schönste Tier — ob das sprachlich zusammengehört, wird nicht behauptet, als Merkhaken hält es trotzdem.',
    'Das Bild vom Kamel und dem Nadelöhr kennst du aus dem Deutschen — es steht fast wörtlich auch im Koran: «حَتَّىٰ يَلِجَ الْجَمَلُ» — „bis das Kamel hindurchgeht“ — «فِي سَمِّ الْخِيَاطِ», „durch das Nadelöhr“. Dasselbe Tier, dasselbe Bild, zwei Sprachen.'
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
    'Der إِمَام ist der, der vorne steht — im Gebet buchstäblich. Wer hinter ihm steht, heißt مَأْمُوم. Zwei Rollen aus demselben Stamm أ م م: der Führende und der Geführte, und du bist jeden Freitag einer von beiden.'
  ],

  /* حَجَرٌ - Stein */
  '45780': [
    'Sūrat al-Fīl kannst du auswendig, und das Wort steht mitten darin: تَرْمِيهِم بِحِجَارَةٍ (105:4) — „sie bewarfen sie mit Steinen“. Eine Sure, die du jederzeit im Kopf hast.',
    'Über den Schwarzen Stein ist überliefert, er sei aus dem Paradies gekommen und «أَشَدُّ بَيَاضًا مِنَ اللَّبَنِ» — weißer als Milch. In diesem einen Satz stecken zwei deiner Vokabeln: الْحَجَر und اللَّبَن. (Tirmiḏī.)'
  ],

  /* سُكَّرٌ - Zucker */
  '45781': [
    'Das doppelte ك ist eine شَدَّة — eines der fünf شَكْل aus deinen Regeln. Sprich es hörbar: suk-kar, nicht su-kar. Eine شَدَّة ist im Arabischen nie Zierde; sie zählt wie ein eigener Buchstabe, und wer sie weglässt, spricht ein anderes Wort.',
    'Stell dir deine anderen Wörter mit شَدَّة daneben: قِطٌّ (Katze), كُرْسِيٌّ (Stuhl), تُفَّاحٌ (Apfel), حَمَّامٌ (Badezimmer), سَيَّارَةٌ (Auto). Sprich sie hintereinander — du hörst denselben Doppelschlag in der Mitte, und سُكَّرٌ reiht sich ein, statt allein zu stehen.'
  ],

  /* لَبَنٌ - Milch */
  '45782': [
    'In der Nacht der Himmelfahrt wurden dem Propheten ﷺ zwei Becher gereicht, Wein und Milch. Er nahm die Milch, und Jibrīl sagte: «اخْتَرْتَ الْفِطْرَةَ» — „du hast die Fiṭra gewählt“. لَبَن ist das Wort in dieser Geschichte. (Buḫārī und Muslim.)',
    'Für Milch allein ist ein eigenes Bittgebet überliefert, für kein anderes Getränk: «اللَّهُمَّ بَارِكْ لَنَا فِيهِ» — „o Allah, segne es uns“ — «وَزِدْنَا مِنْهُ», „und gib uns mehr davon“. Wer es einmal spricht, hat لَبَن verankert. (Abū Dāwūd und Tirmiḏī.)'
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
    'Die beiden gehören zusammen wie zwei Seiten einer Münze, und der Unterschied liegt nicht im Besitz: غَنِيّ ist der, der auf niemanden angewiesen ist, فَقِير der, der angewiesen ist. Deshalb heißt الْغَنِيّ auch ein Name Allahs, aber الْفَقِير nie.',
    '⭐ Eine Stelle aus deinem auswendigen Bereich, und sie trifft genau das Gegenpaar: وَوَجَدَكَ عَآئِلًا فَأَغْنَىٰ — «und dich arm gefunden und dann reich gemacht» (93:8, aḍ-Ḍuḥā). Das Wort dort ist عَآئِلًا, nicht فَقِير — aber فَأَغْنَىٰ ist dieselbe Wurzel wie dein غَنِيٌّ. Wer den Vers kann, hat das Paar arm/reich schon im Ohr, und فَقِيرٌ hängt sich daran.'
  ],

  /* طَوِيلٌ - lang / groß */
  '45785': [
    'Die Doppelbedeutung ist selbst der Haken: طَوِيل ist lang in der ZEIT und im RAUM. Deshalb ist ein Mensch طَوِيل („groß“) und eine Straße ebenso („lang“). Deutsch braucht zwei Wörter, Arabisch kommt mit einem aus — such also nicht nach einem zweiten.',
    'Der Prophet ﷺ sagte seinen Frauen, die mit der längsten Hand — أَطْوَلُكُنَّ يَدًا — werde ihm zuerst folgen; gemeint war die freigebigste. Dieselbe Wurzel ط و ل, und يَد steht gleich daneben. (Buḫārī und Muslim.)'
  ],

  /* قَصِيرٌ - kurz */
  '45786': [
    "Sprich es laut: ka-SIIR — genauso endet صَغِيرٌ (klein), das du sicher kannst. Beide sagen „wenig davon\": صَغِيرٌ wenig Fläche, قَصِيرٌ wenig Länge.",
    "Bild: dein قَلَمٌ nach dem zehnten Spitzen. Er war كَبِيرٌ, jetzt ist er قَصِيرٌ — ein Stummel zwischen zwei Fingern.",
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
    'Im Gebet wechseln sich genau diese beiden Haltungen ab: قِيَام, das Stehen, und جُلُوس, das Sitzen zwischen den Niederwerfungen. جَالِس ist der Sitzende dieser Haltung — jeden Tag siebzehnmal geübt, nur ohne den Namen.',
    'Das erste Wort, das man in jedem arabischen Haus hört: اِجْلِسْ — „setz dich!". Dieselbe Wurzel, dieselbe Bedeutung, nur als Aufforderung. Wer اِجْلِسْ versteht, versteht جَالِس ohne Umweg.'
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
    '⚠️ Nicht mit كَبِير verwechseln. Beide heißen im Deutschen manchmal „alt“, meinen aber Verschiedenes: قَدِيم ist alt im Sinne von LANGE DA, كَبِير ist groß und bei Menschen „älter“ im Sinne von größer. Ein alter Stein ist قَدِيم, ein großer Stein كَبِير.'
  ],

  /* قَرِيبٌ - nah */
  '45793': [
    'Der letzte Vers von Sūrat al-ʿAlaq, die du auswendig kannst, endet mit deiner Wurzel: وَٱسْجُدْ وَٱقْتَرِب (96:19) — „wirf dich nieder und sei nah“. اِقْتَرِب ist ein Befehl von ق ر ب. Nähe zu Allah durch die Niederwerfung — ein Bild, das das Wort trägt.',
    'Dieselbe Wurzel trägt أَقْرَب („näher“) und قَرِيب im Sinne von „Verwandter“ — wer nah ist, im Raum wie in der Familie. Im Deutschen sagt man „ein naher Angehöriger“ und meint dasselbe.'
  ],

  /* بَعِيدٌ - fern */
  '45794': [
    'Merke es über die Präposition, die du schon hast: مِنَ heißt „von, aus“ — und بَعِيدٌ مِنْ heißt „weit weg VON“. Nah und fern arbeiten im Arabischen mit derselben Präposition; nur das Adjektiv dreht die Richtung um.',
    '⚠️ Nicht mit بَعْدَ („nach, danach“) verwechseln — dieselben drei Buchstaben ب ع د, aber ein anderes Wort. Der Unterschied ist hörbar: ba-ʿīd mit langem ī gegen baʿ-da. Wenn du im Koran بَعْدُ liest, ist die Zeit gemeint und nicht die Entfernung.'
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
    'Die Sünden werden in zwei Gruppen geteilt: كَبَائِر, die großen, und صَغَائِر, die kleinen. Der Gegensatz, den du im Deutschen als „groß und klein“ lernst, ist im Glauben ein feststehendes Begriffspaar — كَبِير und صَغِير sind seine Bausteine.',
    '⚠️ Wenn das beschriebene Wort weiblich ist, bekommt das Adjektiv eine تاء مَرْبُوطة: بِنْتٌ صَغِيرَةٌ, nicht بِنْتٌ صَغِيرٌ. Das ist die Regel نَعْت — vier Dinge müssen übereinstimmen, und das Geschlecht ist eines davon.'
  ],

  /* كَبِيرٌ - groß */
  '45798': [
    'In Sūrat al-Mulk, die du auswendig kannst, steht das Wort unverändert: وَأَجْرٌ كَبِيرٌ (67:12) — „und großer Lohn". Genau deine Vokabel, genau diese Form, mit Tanwīn wie im Buch. Es lohnt sich, den Vers einmal daraufhin zu lesen: du kennst ihn längst, nur nicht als Vokabel.',
    'Von derselben Wurzel kommt تَكْبِير — das Sprechen von اللهُ أَكْبَر. Und der Vergleich أَكْبَر („größer") ist dasselbe Muster أَفْعَل wie أَصْغَر bei صَغِير. Drei Wörter, eine Wurzel ك ب ر, und eines davon sagst du jeden Tag.'
  ],

  /* خَفِيفٌ - leicht */
  '45799': [
    'Dieselbe Wurzel steht in einer Regel, unter der du selbst betest: wer die Leute im Gebet leitet, soll es leicht machen — فَلْيُخَفِّفْ. Ein Imam, der kurz macht, macht es خَفِيف. (Buḫārī und Muslim.)',
    'Sprich beide laut: خَفِيف läuft durch, die Luft hört nie auf — خ und ف sind Reibelaute ohne Verschluss. ثَقِيل stoppt hart, das ق setzt tief im Rachen ab. Den Unterschied hörst du selbst, du musst ihn dir nicht merken.'
  ],

  /* ثَقِيلٌ - schwer */
  '45800': [
    'Sūrat al-Qāriʿa kannst du auswendig, und deine Wurzel trägt dort den entscheidenden Satz: مَن ثَقُلَتْ مَوَٰزِينُهُ (101:6) — „wessen Waagschalen schwer sind". Schwer ist im Koran das Gute, das wiegt. Ein Bild, das man nicht mehr los wird.',
    'Von derselben Wurzel ث ق ل kommt مِثْقَال, das Gewichtsmaß. Und das مِـ davor ist dasselbe wie in مِفْتَاحٌ (Schlüssel) und مِنْدِيلٌ (Tuch), die du hast: مِـ macht aus einer Handlung ein WERKZEUG oder ein Maß. Ein Muster, das dir immer wieder begegnet.'
  ],

  /* وَرَقٌ - Papier */
  '45801': [
    'Ein وَرَق ist auch das Blatt am Baum — Blatt Papier und Blatt am Baum sind dasselbe Wort, weil es dasselbe Bild ist: etwas Dünnes, Flaches. Wer das einmal so sieht, verwechselt es nie mit كِتَابٌ.',
    'Merke es über den Schreibtisch, den du komplett auf Arabisch hast: auf dem مَكْتَب liegen قَلَم und وَرَق, daneben das كِتَاب. Vier Wörter, ein Bild — und drei davon brauchst du in jeder Unterrichtsstunde.'
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
    'Das Wort ist weit gereist: von Marokko bis Pakistan heißt der Laden دُكَّان — in Urdu geschrieben wie im Arabischen. Wer je einen Basar gesehen hat, hat das Bild schon; es fehlt nur der Name.',
    'Das doppelte ك ist kein Schmuck, es ist die Aussprache: duk-kān, mit Halt auf dem ك. Ohne den Halt wird ein anderes Wort daraus. Sprich es zweimal langsam, dann sitzt es.'
  ],

  /* جَمِيلٌ - schön */
  '45805': [
    'Von derselben Wurzel ج م ل kommt جَمَال, die Schönheit — das Nomen zum Adjektiv. Und im selben Hadith stehen beide: إِنَّ اللهَ جَمِيلٌ, und Er liebt الْجَمَال. Ein Satz, zwei Wortformen, eine Wurzel.',
    'Bauform فَعِيل — fünfzehn Adjektive dieser Form stehen schon in deinem Bestand, unter anderem كَبِيرٌ، صَغِيرٌ، جَدِيدٌ، قَدِيمٌ. جَمِيلٌ ist keine neue Form, nur eine neue Bedeutung in einer Form, die du längst erkennst. ⚠️ Beim weiblichen Wort kommt eine تاء مَرْبُوطة dazu: جَمِيلَةٌ.'
  ],

  /* حُلْوٌ - süß */
  '45806': [
    'Das Wort ist kürzer als die anderen hier und folgt einem eigenen Muster: فُعْل — حُلْو, mit Sukūn auf dem ل. Kein langer Vokal, keine drei Silben. Sprich es einmal gegen نَظِيف: ḥulw ist ein Schlag, na-ẓīf sind zwei. Kurze Adjektive gibt es, sie sind nur seltener.',
    'Deine eigenen Sätze bringen es dreimal: الشَّايُ حُلْوٌ (der Tee), تُفَّاحٌ حُلْوٌ (der Apfel), لَبَنٌ حُلْوٌ (die Milch). Immer dasselbe Adjektiv an einem anderen Nomen. Sprich alle drei — dann hast du das Wort in drei Zusammenhängen statt einmal auf einer Karte.'
  ],

  /* مَرِيضٌ - krank */
  '45807': [
    'مَرَض ist die Krankheit selbst, مَرِيض der Kranke, مُمَرِّضَة die Pflegerin — drei Wörter aus der Wurzel م ر ض, und zwei davon hast du schon. Dazu passt مُسْتَشْفًى (Krankenhaus) aus einer anderen Wurzel: der Ort, an dem der مَرِيض Heilung sucht.',
    '⚠️ Nicht mit طَبِيبٌ verwechseln, das du auch hast: der مَرِيض ist der, dem etwas fehlt, der طَبِيب der, der es behebt. Beide Wörter beschreiben einen Menschen über seinen Zustand oder sein Tun — im Arabischen sagt die Wortform, welches von beidem gemeint ist.'
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
    '⚠️ Nicht mit مِنْ أَيْنَ verwechseln, das du im selben Kapitel triffst: أَيْنَ fragt „wo?“ (der Ort selbst), مِنْ أَيْنَ fragt „woher?“ (die Herkunft). Ein Wort davor, und die Frage kippt. Die Eselsbrücke steckt in مِنْ selbst: es heißt „von“ — und „von wo“ ist „woher“.',
    'Merke die Antwortform mit: auf أَيْنَ folgt kein Verb, sondern gleich das Gesuchte — أَيْنَ الْمِفْتَاحُ؟ ist ein vollständiger Satz aus zwei Wörtern. Das Deutsche braucht ein „ist“, das Arabische nicht. Dieselbe Regel wie bei هَذَا بَيْتٌ.'
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
    'Der Klang trägt fast von selbst: al-Hind — darin steckt, was du aus „Hindu“ und „Hindi“ kennst. ⚠️ Achte nur auf das ه: das ist der gehauchte h-Laut, nicht das kratzige ح aus حَمَّامٌ. Beide heißen im Deutschen „h“, im Arabischen sind es zwei Buchstaben.',
    '⚠️ Das الْـ gehört zum Namen und fällt nie weg — das Land heißt الْهِنْدُ, niemals هِنْدٌ. Ohne Artikel ist هِنْد ein Frauenname; mit Artikel ist es das Land. Genauso trägst du den Artikel bei الْيَابَانُ und الصِّينُ mit. Merke: bei diesen Ländernamen ist الْـ kein Zusatz, sondern Teil des Wortes.'
  ],

  /* مَدْرَسَةٌ - Schule */
  '45817': [
    'Die Mehrzahl verrät die ganze Gruppe: مَدْرَسَةٌ → مَدَارِسُ, und genauso مَكْتَبٌ → مَكَاتِبُ, مَسْجِدٌ → مَسَاجِدُ, مَطْبَخٌ → مَطَابِخُ. Vier Orte, ein Bruchmuster مَفَاعِل. ⭐ Und alle vier enden ohne Tanwīn — das ist المَمْنُوعُ مِنَ الصَّرْفِ, die Regel steht in deiner App.',
    'Das مَـ macht aus einer Handlung einen ORT — und du hast die ganze Reihe: مَسْجِدٌ (Ort der Niederwerfung), مَكْتَبٌ (Ort des Schreibens), مَطْبَخٌ (Ort des Kochens), مَدْرَسَةٌ (Ort des Lernens). ⚠️ Bei مَدْرَسَة kommt eine تاء مَرْبُوطة dazu — deshalb ist sie weiblich, und Adjektive brauchen ein ة: مَدْرَسَةٌ نَظِيفَةٌ.'
  ],

  /* سُوقٌ - Markt */
  '45818': [
    'سُوق ist weiblich, obwohl es keine تاء مَرْبُوطة trägt — man sagt هَذِهِ السُّوقُ und hängt قَدِيمَةٌ daran. Genau die Sorte Wort, vor der dein Lehrer warnt: das Geschlecht steht nicht immer am Wort.',
    'Das Wort ist auch im Deutschen angekommen — der „Souk“ in Marrakesch oder Damaskus ist dasselbe سُوق. Und im Ḥadīth heißt es, die liebsten Orte bei Allah seien مَسَاجِدُهَا, die verhasstesten أَسْوَاقُهَا. (Muslim.)'
  ],

  /* جَامِعَةٌ - Universität */
  '45819': [
    'Die Wurzel ج م ع („sammeln") trägt drei Wörter, die du kennst: الْجُمُعَة ist der Tag der Versammlung, der جَامِع die Freitagsmoschee, in der sich alle versammeln — und die جَامِعَة der Ort, an dem sich alle Fächer versammeln. Ein Stamm, drei Versammlungen.',
    'Im Koran begegnet dir die Wurzel in deinem auswendigen Bereich: ٱلَّذِي جَمَعَ مَالًا (104:2) — „der Besitz zusammenträgt", in Sūrat al-Humaza. Dasselbe جَمَعَ, das in جَامِعَة steckt. Wer den Vers spricht, hat das Wort.'
  ],

  /* مُدِيرٌ - Direktor */
  '45820': [
    'Die Wurzel د و ر hat mit Drehen und Kreisen zu tun — der مُدِير ist der, um den sich der Betrieb dreht. ⭐ Von derselben Wurzel kommt دَار, das Haus im Sinne von „Anwesen“, und دَوْر, die Runde oder Rolle. Wer die Wurzel hat, erkennt sie in allen dreien wieder.',
    'Das مُـ am Anfang ist ein Bauteil, kein Zufall: es macht aus einer Handlung den Menschen, der sie tut. Du hast schon zwei davon — مُؤَذِّنٌ (der ruft) und مُمَرِّضَةٌ (die pflegt). مُدِيرٌ reiht sich ein: der, der leitet. ⭐ Ab jetzt liest du bei jedem مُـ mit: „der, der …“'
  ],

  /* غُرْفَةٌ - Zimmer */
  '45821': [
    'Bau dir das Haus aus deinen eigenen Vokabeln: ein بَيْت hat eine غُرْفَة (Zimmer), einen مَطْبَخ (Küche), ein حَمَّام (Bad) und einen مِرْحَاض (Toilette). Alle fünf Wörter hast du. Geh das Haus einmal in Gedanken ab und benenne die Räume — das hält besser als fünf einzelne Karten.',
    'Die Wurzel غ ر ف heißt schöpfen — mit der hohlen Hand Wasser nehmen. Eine غُرْفَة ist danach benannt: ein Raum ist etwas aus dem Haus Herausgeschöpftes, eine Höhlung. Von derselben Wurzel kommt die Schöpfkelle, مِغْرَفَة. ⚠️ Nicht mit dem ähnlich klingenden عَرَفَ („kennen“) verwechseln: das fängt mit ع an, nicht mit غ.'
  ],

  /* حَمَّامٌ - Badezimmer */
  '45822': [
    'Das Wort ist auch im Deutschen angekommen: der Hammam, das Dampfbad. Wer es einmal so eingeordnet hat, braucht keine weitere Brücke — nur die Aussprache: das doppelte م muss man hören, ḥam-mām.',
    '⚠️ Der erste Buchstabe ist ح, der kratzige Kehllaut, nicht das gehauchte ه aus الْهِنْد. Übe die beiden im Paar: ḥammām gegen al-Hind. Im Deutschen klingt beides wie „h", im Arabischen sind es zwei Buchstaben und zwei Wörter.'
  ],

  /* مَطْبَخٌ - Küche */
  '45823': [
    'Ort-مَـ wie مَدْرَسَةٌ, مَكْتَبٌ und مَسْجِدٌ, die du alle hast: die Wurzel ط ب خ heißt kochen, also ist مَطْبَخ der Ort des Kochens. ⚠️ Nicht mit طَبِيبٌ (Arzt) verwechseln — der hat die Wurzel ط ب ب. Der letzte Buchstabe entscheidet: خ kocht, ب heilt.',
    'Richte die Küche mit deinen eigenen Vokabeln ein: im مَطْبَخ steht der قِدْر (Kochtopf), daneben liegen مِلْعَقَة (Löffel) und سُكَّر (Zucker). Vier Wörter, ein Raum — und du hast sie alle vier. Räume dir die Küche in Gedanken einmal ein, das hält besser als vier einzelne Karten.'
  ],

  /* سَمَاءٌ - Himmel */
  '45824': [
    'In Sūrat al-Mulk, die du auswendig kannst, steht das Wort gleich mehrfach — am schönsten in 67:5: زَيَّنَّا ٱلسَّمَآءَ ٱلدُّنْيَا, „Wir haben den untersten Himmel geschmückt“, nämlich بِمَصَٰبِيحَ, mit Lampen. Und in 67:16 fragt der Vers nach مَّن فِي ٱلسَّمَآءِ. Sechs Stellen allein in dieser einen Sure.',
    '⚠️ سَمَاءٌ ist weiblich, obwohl es keine تاء مَرْبُوطة trägt — dieselbe Sorte Wort wie بِنْتٌ, يَدٌ und عَيْنٌ, die du alle hast. Deshalb heißt es الدُّنْيَا und nicht الْأَدْنَى daneben: das Adjektiv richtet sich nach dem Geschlecht, nicht nach der Endung.'
  ],

  /* فَصْلٌ - Klassenzimmer / Kapitel */
  '45825': [
    'Ein فَصْل ist ein abgetrennter Teil — deshalb heißt dasselbe Wort Klassenzimmer UND Kapitel. Die Wurzel ف ص ل bedeutet trennen. Auch die Jahreszeit heißt so: ein فَصْل des Jahres. Drei Bedeutungen, ein einziges Bild.',
    'Das Trennende steckt auch im Satzzeichen: ein Komma heißt فَاصِلَة, „die Trennerin“ — von derselben Wurzel. Wo im Deutschen drei verschiedene Wörter stehen (Klasse, Kapitel, Komma), steht im Arabischen dreimal ف ص ل. Wer die Wurzel hat, braucht die drei Vokabeln nicht einzeln.'
  ],

  /* مِرْحَاضٌ - Toilette */
  '45826': [
    'Werkzeug- und Ort-مِـ wie bei مِفْتَاحٌ (Schlüssel) und مِنْدِيلٌ (Tuch), die du hast: erst مِـ, dann die Wurzel, dann ein langes ā vor dem letzten Buchstaben. Die Wurzel ر ح ض heißt waschen — der مِرْحَاض ist der Ort zum Waschen.',
    'Der praktische Satz steht schon bei dir: أَيْنَ الْمِرْحَاضُ؟ — „Wo ist die Toilette?" Das ist die Sorte Satz, die man auf einer Reise wirklich braucht, und er besteht aus zwei Vokabeln, die du beide in diesem Kapitel lernst. Sprich ihn ein paarmal, dann sitzt er.'
  ],

  /* ===================== Kapitel 5 — Familie, Orte, Hinweiswörter ==== */

  /* رَسُولٌ - Gesandter */
  '45827': [
    'In Sūrat al-Bayyina, die du auswendig kannst, steht das Wort genau in deiner Form: رَسُولٌ مِّنَ ٱللَّهِ (98:2) — „ein Gesandter von Allah“. Mit Tanwīn, unbestimmt, wie im Vokabelheft. Und in Sūrat al-Fīl steckt dieselbe Wurzel im Verb: وَأَرْسَلَ عَلَيْهِمْ (105:3), „und Er sandte gegen sie“.',
    'Die Wurzel ر س ل heißt senden und trägt eine ganze Familie: رَسُول der Gesandte, رِسَالَة die Botschaft, أَرْسَلَ „er sandte“. Wer eines davon erkennt, erkennt die anderen mit.'
  ],

  /* تَحْتَ - unter */
  '45828': [
    'Die berühmteste Wendung des Korans über das Paradies trägt dein Wort, und sie steht in einer Sure, die du auswendig kannst: تَجْرِي مِن تَحْتِهَا (98:8) — „durcheilt von Bächen", wörtlich „es fließt von unter ihnen". تَحْتِهَا ist dein تَحْتَ mit „ihnen" daran.',
    '⚠️ Der Fachbegriff dazu ist ظَرْف, und dein Lehrer stellt ausdrücklich klar: تَحْتَ ist KEIN حَرْفُ الْجَرِّ, obwohl das Wort danach genauso in den Genitiv kommt — تَحْتَ الْمَكْتَبِ. Es wirkt wie eine Genitivpartikel, gehört aber in eine eigene Kategorie. Das ist der Unterschied, den man kennen muss.'
  ],

  /* عَمٌّ - Onkel väterlicherseits */
  '45829': [
    'Der Trick gegen das Verwechseln liegt im Klang: „ʿamm" ist kurz und hart, „chāl" weich und lang. Sprich beide direkt hintereinander — ʿamm, chāl — dann trennt sich das Paar von selbst. Beide stehen in demselben Kapitel wie ابْنٌ und بِنْتٌ: die Verwandtschaftswörter kommen zusammen und lernen sich zusammen.',
    'Die شَدَّة verrät die Wurzel: ع م م, zwei م, im Singular zu einem zusammengezogen. Im Plural rücken sie auseinander: عَمٌّ → أَعْمَامٌ. Dasselbe siehst du bei أُمٌّ → أُمَّهَاتٌ und bei قِطٌّ. ⚠️ Und der Plural folgt dem Muster أَفْعَال, das du von أَبْوَابٌ und أَقْلَامٌ kennst.'
  ],

  /* اِبْنٌ - Sohn */
  '45830': [
    'Die Hamzat al-waṣl ist hier zum Anfassen — und du sprichst sie täglich: عِيسَى ابْنُ مَرْيَمَ. Allein steht اِبْن mit dem اِ, mitten in der Verbindung verschwindet es und man hört nur „…bnu…“. Genau die Regel هَمْزَةُ الوَصْل aus deinem Unterricht, an einem Namen, den du seit jeher kennst.',
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
    'Die Wurzel خ و ل trägt ein و in der Mitte, und im Plural kommt es zurück: خَالٌ → أَخْوَالٌ. Sein Gegenstück geht im Gleichschritt: عَمٌّ → أَعْمَامٌ. Dasselbe Muster أَفْعَال kennst du von أَبْوَابٌ und أَقْلَامٌ — die beiden Onkel sind also auch grammatisch ein Paar.',
    'Diesen Unterschied gibt es im Deutschen nicht, und genau deshalb muss man ihn bewusst lernen: خَال ist der Bruder der MUTTER, عَمّ der Bruder des VATERS. Eine Eselsbrücke, die trägt: das خ von خَال und das م von أُمّ liegen beide auf der Mutterseite — عَمّ dagegen hat kein خ und gehört zum Vater.'
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
    '⚠️ Die Ausnahme, die man sich merken muss: بِنْتٌ endet auf ein normales ت mit Sukūn, NICHT auf die تاء مَرْبُوطة ة, die sonst weibliche Wörter kennzeichnet. Das Wort ist trotzdem weiblich — dein Lehrer nennt solche Fälle مؤنث بلا تاء, „weiblich ohne Tāʾ“.',
    'Und die Folge daraus siehst du am Adjektiv: بِنْتٌ صَغِيرَةٌ ist richtig, بِنْتٌ صَغِيرٌ nicht. Obwohl das Nomen selbst kein ة trägt, muss das Adjektiv eines bekommen — es richtet sich nach dem Geschlecht, nicht nach der Schreibung. Genau das ist die zweite der vier Bedingungen des نَعْت.'
  ],

  /* اِسْمٌ - Name */
  '45839': [
    'Der allererste Vers, der herabgesandt wurde, trägt dein Wort — und du kannst die Sure auswendig: ٱقْرَأْ بِٱسْمِ رَبِّكَ (96:1), „Lies im Namen deines Herrn“. Dasselbe بِٱسْمِ sprichst du bei jedem بِسْمِ اللهِ. ⚠️ Auch dort fällt das اِ in der Verbindung weg, weil es eine Hamzat al-waṣl ist.',
    'اِسْم ist außerdem einer der drei Fachbegriffe für die Wortarten aus deinem Unterricht: اِسْم – فِعْل – حَرْف. Alles, was kein Verb und keine Partikel ist, ist ein اِسْم. Damit hat dein Vokabelwort „Name“ gleichzeitig eine grammatische Bedeutung — merke beide zusammen.'
  ],

  /* حَقِيبَةٌ - Tasche / Rucksack */
  '45840': [
    'Im ganzen Wortschatz gibt es genau ein zweites Wort mit diesem Rhythmus: مَدِينَةٌ, ma-dī-na, der Name des Lehrbuchs. حَقِيبَةٌ läuft gleich — ḥa-qī-ba, kurz–lang–kurz, hinten das ة.',
    'Warum auf der Karte zwei deutsche Wörter stehen: حَقِيبَة allein ist die Tasche. Der Rucksack heißt حَقِيبَةُ الظَّهْرِ, die Tasche des Rückens. Ein Wort deckt beides, weil erst der Zusatz die Art bestimmt.'
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
    'Werkzeug-مِـ, und die Wurzel ل ع ق heißt lecken — der Löffel ist wörtlich „das Ding zum Lecken“. ⭐ Zusammen mit مِفْتَاحٌ (das Ding zum Öffnen) und مِكْوَاةٌ (das Ding zum Bügeln) hast du drei Werkzeuge nach demselben Bauplan. Das Muster ist die Vokabel, nicht das Einzelwort.',
    'Das Wort sagt selbst, wozu es da ist: ل ع ق ist das Lecken, مِلْعَقَة das Gerät dafür. Kein Bild, keine Eselsbrücke im engeren Sinn — die Bedeutung steht im Wort.'
  ],

  /* فَلَّاحٌ - Bauer */
  '45845': [
    'Du hörst die Wurzel fünfmal am Tag: حَيَّ عَلَى الْفَلَاحِ im Adhān — „auf zum Erfolg". Dieselbe Wurzel ف ل ح steckt im فَلَّاح. Der Bauer pflügt, und wer pflügt, hat Erfolg — das Bild trägt beide Bedeutungen.',
    'Muster فَعَّال für Berufe: der, der etwas VIEL tut. ⚠️ Nicht mit dem Maschinenmuster فَعَّالَة verwechseln — der Unterschied ist nur die تاء مَرْبُوطة: فَلَّاحٌ ist ein Mensch, ثَلَّاجَةٌ ein Gerät. Ein Buchstabe entscheidet, ob es jemand oder etwas ist.'
  ],

  /* أُمٌّ - Mutter */
  '45846': [
    'Der bekannteste Ausdruck damit ist einer, den du kennst: أُمُّ الْقُرَى, „die Mutter der Städte“ — Mekka. Und die Fātiḥa heißt أُمُّ الْكِتَابِ, die Mutter des Buches. „Mutter“ heißt im Arabischen also auch „Ursprung, Hauptsache“. Beides sind إِضافة-Verbindungen, wie du sie gerade lernst.',
    '⭐ Die Wurzel أ م م heißt „vorangehen“ — und daraus kommt إِمَامٌ, das du auch hast: der, der vorangeht. Die Mutter ist die Erste, der Imam steht vorn, أَمَامَ heißt „vor“. Ein Bild trägt drei Wörter: was am Anfang steht.'
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
    '⭐ Im Sujūd berührt die Nase den Boden mit — sie gehört zu den sieben Körperteilen, auf denen man sich niederwirft. Wer sich das einmal beim Beten bewusst macht, hat die Vokabel fünfmal am Tag geübt. ⚠️ Und dieselbe Wurzel أ ن ف trägt أَنَفَة, den Stolz: die Nase hoch tragen heißt auf Arabisch dasselbe wie auf Deutsch.'
  ],

  /* فَمٌ - Mund */
  '45853': [
    'فَمٌ und يَدٌ sind die beiden kürzesten Wörter im ganzen Bestand: zwei Buchstaben und ein Tanwīn. Kurze Wörter für Dinge, die man ständig braucht — das ist in jeder Sprache so, und es hilft beim Wiedererkennen.',
    'Merke es in der Wuḍūʾ-Gruppe mit أَنْفٌ (Nase): beim Waschen kommen Mund und Nase direkt nacheinander. Zwei Vokabeln, eine Handbewegung, die du ohnehin jeden Tag machst.'
  ],

  /* قِدْرٌ - Kochtopf */
  '45854': [
    '⭐ Die Wurzel ق د ر trägt eine der bekanntesten Suren, die du auswendig kannst: لَيْلَةِ ٱلْقَدْرِ (97:1) — die Nacht der Bestimmung. Ein قَدَر ist ein Maß, eine Bestimmung; ein قِدْر ist das Gefäß mit einem bestimmten Maß. Küchentopf und Schicksal aus derselben Wurzel — das vergisst man nicht.',
    '⚠️ Der Stolperstein sitzt beim Nachbarwort: قِدْرٌ (Kochtopf) hat ق د ر, قَدِيمٌ (alt) hat ق د م. Zwei Wörter, die ersten beiden Buchstaben gleich, und nur der letzte entscheidet — ر oder م. Beide hast du als Vokabel; prüf beim Lesen immer den Schluss, nicht den Anfang.'
  ],

  /* أُذُنٌ - Ohr */
  '45855': [
    '⭐ Die stärkste Verknüpfung deiner ganzen Liste: أُذُنٌ (Ohr) und مُؤَذِّنٌ (Gebetsrufer) haben dieselbe Wurzel أ ذ ن. Der Muezzin ruft in die Ohren. Und derselbe Stamm heißt auch „Erlaubnis“ — in Sūrat al-Qadr steht بِإِذْنِ رَبِّهِم (97:4), „mit der Erlaubnis ihres Herrn“. Wer zuhört, gehorcht.',
    '⚠️ Zwei Wörter, ein Zeichen Unterschied: أَذَان ist der Gebetsruf, آذَان sind die Ohren. Der einzige Unterschied ist die Madda ـآ am Anfang — ein kleiner Bogen über dem Alif. Wer ihn übersieht, ruft die Ohren zum Gebet. Beide gehören zur selben Wurzel: der Ruf und das, was ihn hört.'
  ],

  /* عَيْنٌ - Auge */
  '45856': [
    'In Sūrat at-Takāthur, die du auswendig kannst, steht dein Wort wörtlich: عَيْنَ ٱلْيَقِينِ (102:7) — „mit dem Auge der Gewissheit". Eine إِضافة, wie du sie gerade lernst: erstes Wort ohne Tanwīn, zweites im Genitiv.',
    'عَيْنٌ heißt Auge UND Quelle — beides Stellen, aus denen Wasser kommt. ⭐ Genau das steht am Ende von 67:30, das du kennst: بِمَآءٍ مَّعِينٍ, „mit hervorquellendem Wasser". Dieselbe Wurzel ع ي ن. Ein Wort, zwei Bilder, und der Koran benutzt beide.'
  ],

  /* يَدٌ - Hand */
  '45857': [
    'Sūrat al-Masad beginnt damit, und du kannst sie auswendig: تَبَّتْ يَدَآ أَبِي لَهَبٍ (111:1) — „zugrunde gehen sollen die Hände Abū Lahabs“. يَدَا ist der Dual, also genau ZWEI Hände. Dein Wort, dein Vers, und nebenbei die Dualform.',
    'Über das Geben heißt es: «الْيَدُ الْعُلْيَا» — die obere Hand — «خَيْرٌ مِنَ الْيَدِ السُّفْلَى», besser als die untere; die gebende besser als die nehmende. Zweimal dasselbe Wort in einem Satz, den man nicht vergisst. (Buḫārī und Muslim.)'
  ],

  /* رِجْلٌ - Bein / Fuß */
  '45858': [
    '⚠️ Dein wichtigster Verwechslungsfall überhaupt: رِجْلٌ (Bein) und رَجُلٌ (Mann) bestehen aus denselben drei Buchstaben ر ج ل. Nur die Vokale trennen sie: RIDSCH-l gegen RA-DSCHUL. Deshalb immer laut sprechen, nie nur lesen — ohne Taschkīl sieht man den Unterschied nicht.',
    '⭐ Eine Regel, die dir vier Vokabeln auf einmal einordnet: Körperteile, die es zweimal gibt, sind im Arabischen weiblich. رِجْلٌ, يَدٌ, عَيْنٌ und أُذُنٌ — alle vier hast du, keines trägt eine تاء مَرْبُوطة, und alle vier sind trotzdem weiblich. Dieselbe Sorte Wort wie بِنْتٌ.'
  ],

  /* سَرِيعٌ - schnell */
  '45859': [
    'Muster فَعِيل wie das halbe Kapitel 3 — كَبِير, صَغِير, قَرِيب, جَمِيل. ⭐ Und der Plural läuft wie dort: سَرِيعٌ → سِرَاعٌ, genau wie طَوِيلٌ → طِوَالٌ und قَصِيرٌ → قِصَارٌ. Ein Muster für Singular und Plural gleichzeitig.',
    'Von derselben Wurzel س ر ع kommt أَسْرَعَ (sich beeilen) und سُرْعَة (die Geschwindigkeit) — das Wort, das auf Verkehrsschildern steht. Wer die Wurzel hat, liest auch das Schild.'
  ],

  /* نَافِذَةٌ - Fenster */
  '45860': [
    'Die Wurzel ن ف ذ heißt durchdringen — ein Fenster ist die Stelle, durch die Licht und Luft DURCHGEHEN. ⭐ Von derselben Wurzel kommt نُفُوذ, der Einfluss: etwas, das durchdringt. Bild und Wort passen so genau zusammen, dass man es nicht mehr auswendig lernen muss.',
    'Dieselbe Wurzel steckt in تَنْفِيذ, der „Durchführung“: einen Plan تَنْفِيذ heißt, ihn durchgehen zu lassen. Wer das Wort in den Nachrichten hört, hört das Fenster mit.'
  ],

  /* شَرْقٌ - Osten */
  '45861': [
    "Die Sonne steigt im شَرْق über den مَسْجِد. Wer zum Morgengebet geht, hat sie im Rücken — sie kommt aus dem شَرْق.",
    "Merk es an der Gebetsrichtung: von Deutschland aus liegt die كَعْبَةٌ im شَرْق. Jedes Mal, wenn du dich zum Gebet drehst, drehst du dich Richtung شَرْق.",
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
    'Die تاء مَرْبُوطة macht hier das WEIBLICHE Tier, nicht das einzelne Stück. ⚠️ Vergleiche mit بَقَرَةٌ und بَطَّةٌ, wo dasselbe ة das Einzeltier aus der Art heraushebt (بَقَرٌ ist das Rindvieh, بَقَرَةٌ die eine Kuh). Dasselbe Zeichen, zwei Aufgaben — hinsehen, welche gemeint ist.',
    'Nimm sie über die Wurzel: ن و ق. Aus derselben Wurzel kommt أَنِيقٌ, «gepflegt, elegant» — die نَاقَة galt als das schöne, sorgsam gehaltene Tier. ⚠️ Das ist eine Wörterbuchangabe, kein Beleg aus deinem Unterricht; nimm sie nur, wenn sie dir hilft.'
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
    "بَيْضَةٌ und بَيْتٌ fangen gleich an: بَيْ. Und genau das ist es — die بَيْضَةٌ ist das بَيْت des Kükens, seine erste Wohnung.",
    "Bild: der دِيكٌ kräht auf dem Hof, im Stroh darunter liegt eine بَيْضَةٌ. Hahn und Ei, dasselbe Bild, zwei Wörter.",
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
    '⚠️ Am Ende steht eine أَلِف مَقْصورة — das ى ohne Punkte, gesprochen wie langes ā: mus-tasch-fā. Genau der Fachbegriff, den du gelernt hast. Und im Plural wird daraus wieder ein echtes ي: مُسْتَشْفَيَاتٌ. Dasselbe Verhalten wie bei عَلَى → عَلَيْهِ.',
    'مُسْتَشْفًى ist ein ORT, und du hast schon einen: مَكْتَبٌ, das Büro — der Ort des Schreibens (ك ت ب). Genauso ist مُسْتَشْفًى der Ort des Heilung-Suchens (ش ف ي). Arabisch baut Orte aus der Wurzel, statt ein neues Wort zu erfinden: wer die Wurzel kennt, errät den Ort.'
  ],

  /* ===================== Kapitel 9 — Sprache, Stadt, Alltag ========= */

  /* فَاكِهَةٌ - Obst */
  '45875': [
    'Im Koran steht فَاكِهَة für die Früchte des Paradieses — ein Wort, das immer im Zusammenhang mit Belohnung fällt. ⚠️ Der Plural ist فَوَاكِهُ, mit einem و, das im Singular fehlt: fa-wā-kih. Dasselbe Muster wie نَافِذَةٌ → نَوَافِذُ, das du auch hast.',
    'Setz es über dein تُفَّاحٌ (Apfel): der Apfel ist die Sorte, das Obst der Oberbegriff. Dasselbe Verhältnis hast du zweimal in diesem Kapitel — عُصْفُورٌ (Spatz) steht unter طَائِرٌ (Vogel). Oberbegriff und Beispiel zusammen zu lernen ist leichter als jedes für sich.'
  ],

  /* عُصْفُورٌ - Spatz */
  '45876': [
    '⭐ Sūrat al-Fīl, die du auswendig kannst, endet mit deiner Wurzel: كَعَصْفٍ مَّأْكُولٍ (105:5) — „wie abgefressene Halme“. عَصْف sind die zerfressenen Blätter; dieselbe Wurzel ع ص ف trägt عَاصِفَة, den Sturm, und deinen عُصْفُور. Alles, was klein, leicht und weggeweht ist.',
    'Stell die drei Vögel deines Wortschatzes nebeneinander: دَجَاجَةٌ (Henne) und بَطَّةٌ (Ente) leben beim Menschen, der عُصْفُور fliegt frei. ⚠️ Und er ist das längste der drei Wörter — fünf Buchstaben, zwei lange Vokale: ʿuṣ-fūr. Sprich ihn gedehnt, dann sitzt er.'
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
    '⭐ Du benutzt das Wort schon, ohne es zu merken: die Suren werden in مَكِّيَّة und مَدَنِيَّة eingeteilt — die aus Mekka und die aus Medina. مَدَنِيّ heißt „zur Stadt gehörig“, und daher kommt auch „zivil“ im Sinne von „städtisch“. Wer die Sureneinteilung kennt, kennt die Vokabel längst.'
  ],

  /* الْقَاهِرَةُ - Kairo */
  '45886': [
    '⭐ In Sūrat aḍ-Ḍuḥā, die du auswendig kannst, steht die Wurzel als Verb: فَلَا تَقْهَرْ (93:9) — „so unterjoche sie nicht", über die Waise. Dieselbe Wurzel ق ه ر trägt الْقَهَّار, einen der Namen Allahs, und den Namen der Stadt: الْقَاهِرَة, „die Bezwingerin".',
    'Muster فَاعِلَة, also die weibliche Form von فَاعِل — dasselbe wie نَافِذَةٌ (Fenster). Städtenamen sind im Arabischen oft weiblich. ⚠️ Und der Artikel gehört fest dazu: الْقَاهِرَة, nie قَاهِرَة allein.'
  ],

  /* يَوْمٌ - Tag */
  '45887': [
    'Du sprichst es in jedem Gebet: مَٰلِكِ يَوْمِ ٱلدِّينِ (1:4) — „dem Herrscher am Tag des Gerichts“. Das ist zugleich eine إِضافة in einer إِضافة: مَالِكِ zu يَوْمِ, und يَوْمِ zu الدِّينِ. Deine Vokabel steht mitten in einem Satz, den du auswendig kannst.',
    '⭐ In den kurzen Suren, die du auswendig kannst, hörst du يَوْمَئِذٍ ständig — „an jenem Tag“. Es steckt in 99:6 und in 100:11, und es ist nichts anderes als dein Wort mit einem Anhängsel. Wer die Suren spricht, hat die Vokabel Dutzende Male gesagt.'
  ],

  /* لِمَاذَا - warum */
  '45888': [
    'Zerlegen ist hier die ganze Eselsbrücke: لِـ („für") + مَاذَا („was") = „wofür?", also warum. Beide Teile kennst du — لِ aus deinen Regeln und مَا als eigene Vokabel. Ein zusammengesetztes Wort, das man nicht auswendig lernen muss, wenn man es einmal auseinandergenommen hat.',
    'Sortiere es zu den Fragewörtern, die du schon hast: مَا (was), أَيْنَ (wo), لِمَاذَا (warum) — dazu aus deinen Regeln مَنْ (wer), هَلْ und أَ (ja/nein). ⚠️ Alle außer هَلْ und أَ verlangen eine Antwort mit Inhalt, nicht mit ja oder nein.'
  ],

  /* كُوبٌ - Tasse / Becher */
  '45889': [
    'Bau den Tisch aus deinen Vokabeln: ein كُوب (Becher) mit شَاي oder قَهْوَة oder مَاء darin, dazu مِلْعَقَة (Löffel) und سُكَّر (Zucker). Sechs Wörter, eine Szene — und alle sechs hast du.',
    '⭐ Häng die Vokabel an eine Sunna, die du ohnehin befolgst: im Sitzen trinken, mit der rechten Hand, in drei Zügen. Jedes Mal, wenn du den Becher ansetzt, ist das die Gelegenheit, كُوب zu denken. Eine Vokabel, die dreimal am Tag von selbst abgefragt wird.'
  ],

  /* مَكْتَبَةٌ - Bibliothek */
  '45890': [
    '⭐ Drei Wörter, eine Wurzel ك ت ب, und du hast alle drei: كِتَابٌ (das Buch), مَكْتَبٌ (der Schreibtisch, der Ort des Schreibens), مَكْتَبَةٌ (die Bibliothek, der Ort der Bücher). Das مَـ macht den Ort, die تاء مَرْبُوطة macht daraus die Sammlung.',
    'Im Koran steht dieselbe Wurzel als أَهْلِ ٱلْكِتَٰبِ (98:1) — „die Leute der Schrift", in Sūrat al-Bayyina, die du auswendig kannst. Wer den Vers spricht, hat den ganzen Stamm: Buch, Schreibtisch, Bibliothek, Schrift.'
  ],

  /* الْآنَ - jetzt */
  '45891': [
    'Das Madda-Alif آ ist die eigentliche Vokabel: es steht für zwei Alif hintereinander und wird lang gesprochen — al-ān. Dasselbe Zeichen steht mitten in الْقُرْآن, das du täglich schreibst und sprichst. Einmal bewusst ansehen, dann erkennst du es überall.',
    'الْآنَ hörst du nie ohne اَلْ. Es gibt kein blankes آن für „jetzt“ — das Wort kommt immer im Ganzen. Deshalb lohnt es sich, es als ein einziges Stück zu lernen: al-ān, nicht al + ān.'
  ],

  /* مُسْتَوْصَفٌ - Klinik */
  '45892': [
    'Zwei Wörter, ein Bauplan مُسْتَفْعَل, und beide hast du: مُسْتَشْفًى (Krankenhaus, wo man Heilung SUCHT) und مُسْتَوْصَف (Klinik, wo man eine Beschreibung SUCHT, also eine Verschreibung). Das سْتَـ in der Mitte heißt immer „nach etwas suchen“ — merk dir den Baustein, nicht die zwei Wörter.',
    'Die Wurzel و ص ف heißt beschreiben — daher وَصْف (die Beschreibung) und صِفَة (die Eigenschaft). In der Klinik beschreibt der Arzt, was fehlt, und schreibt danach das Mittel auf: der Ort ist nach dieser Handlung benannt.'
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
    'Der Artikel macht den Unterschied: يَوْمٌ ist „ein Tag“, الْيَوْمُ ist „der Tag“ — und damit „heute“. Genau dieselbe Verschiebung gibt es im Deutschen bei „heute“ und „am Tage“. Zwei Vokabeln, die zusammengehören und einzeln nur halb so viel wert sind.',
    '⚠️ Als Zeitangabe wechselt die Endung auf ein Fatḥah: الْيَوْمَ statt الْيَوْمُ. Das ist kein Tippfehler — Zeitangaben stehen im Akkusativ. Dir muss das noch nicht erklärt sein; merk dir vorerst nur, dass die Endung wechselt, sobald das Wort sagt, WANN etwas ist.'
  ],

  /* ===================== Eigene Vokabeln ============================
     Elias' selbst angelegte Wörter: Zahlen, Grammatikbegriffe und ein paar
     Einzelstücke. ⚠️ Die Schreibungen stammen von IHM und werden hier nicht
     angefasst — auch dort nicht, wo sie fehlerhaft aussehen (أَلْمُهَنْدِسٌ
     mit أَلْ statt الْـ, مُضَافْ إِلَيْهِ mit Sukūn auf dem ف). Das gehört auf
     die Liste für ihn, nicht in eine stille Korrektur. */

  /* لَحْمٌ - Fleisch */
  '59e30a8a-e400-4380-8adf-89e811852a1d': [
    'Der Begriff aus dem Glauben trägt es: لَحْم حَلَال — das erlaubte Fleisch. Wer nach Halal-Fleisch fragt, sagt genau dein Wort. ⚠️ Und die Wurzel ل ح م steckt auch in لَحْمَة, dem Zusammenhalt: was zusammengewachsen ist. Fleisch und Verbundenheit aus einem Stamm.',
    'Setz es an den Tisch, den du schon hast: لَحْمٌ (Fleisch), تُفَّاحٌ (Apfel), فَاكِهَةٌ (Obst), لَبَنٌ (Milch), سُكَّرٌ (Zucker), مَاءٌ (Wasser). Sechs Wörter, eine Mahlzeit — und zu jedem hast du ein Adjektiv aus Kapitel 3.'
  ],

  /* لِ - für / gehört */
  '0f311405-7349-450c-885e-e3abefb6fbf3': [
    '⭐ Du sprichst es im zweiten Vers der Fātiḥa: ٱلْحَمْدُ لِلَّهِ (1:2) — „(alles) Lob gehört Allah". Das لِلَّهِ ist dein لِ + اللهُ, und genau daran siehst du die Regel: لِ + اَلْ verschmilzt zu لِلـ. Ein Vers, den du täglich sprichst, mit deiner Vokabel und ihrer Regel darin.',
    '⚠️ Vor einem Eigennamen wird NICHT verschmolzen: لِمُحَمَّدٍ, nicht لِلْمُحَمَّدٍ. Die Regel لِ + اَلْ = لِلـ gilt nur, wenn das Wort wirklich einen Artikel trägt. Und nach لِ steht immer Genitiv — es ist ein حَرْفُ الْجَرِّ, wie du selbst notiert hast.'
  ],

  /* أَيْضاً - auch / ebenfalls */
  '0e23a52d-e2f5-4a57-9082-58eb9f362d88': [
    'أَيْضاً trägt das Tanwīn ـاً, obwohl es kein Nomen ist, das man beugt — es ist erstarrt in dieser Form. Dieselbe Endung siehst du bei جِدًّا („sehr“) und شُكْرًا („danke“). Drei kleine Wörter mit demselben Schwanz; wer eines schreibt, schreibt alle drei richtig.',
    'Merke die Stellung mit: أَيْضاً steht meist ganz am Ende, dort wo auch الْيَوْمَ und الْآنَ landen. Drei Wörter, die um dieselbe Stelle konkurrieren — wer eines davon platzieren kann, kann alle drei.'
  ],

  /* اِسْمٌ مَجْرُورٌ - Nomen im Genitiv */
  '397cfa89-5bc0-4ce7-ae45-30fe8ea64fe2': [
    'Merke es NIE einzeln, sondern immer als Zweiergespann: erst der حَرْفُ الْجَرِّ, dann das اِسْمٌ مَجْرُورٌ. فِي الْبَيْتِ, مِنَ الْمَسْجِدِ, عَلَى الْمَكْتَبِ — dreimal dasselbe Muster mit deinen eigenen Vokabeln. Die Partikel zieht, das Nomen folgt.',
    'Das Anzeichen ist sichtbar: مَجْرُور heißt Kasra ـِ am Ende, oder zwei Kasra ـٍ beim unbestimmten Wort. ⚠️ Und drei Dinge lösen es aus, nicht nur eines: ein حَرْف جَرّ, eine إِضافة, oder eine ظَرْف wie تَحْتَ. Wer die drei Auslöser kennt, erkennt den Fall am Satz statt an der Endung.'
  ],

  /* أَلْمُهَنْدِسٌ - Ingenieur */
  '36e01b96-9367-4f09-acaf-31a82bdcf061': [
    '⚠️ Das Wort ist länger gebaut als die anderen Berufe: die Wurzel hat VIER Buchstaben, ه ن د س. Deshalb passt es nicht zu مُدَرِّس und مُؤَذِّن, die drei haben — dort steht eine شَدَّة, hier nicht. Sprich es in Silben: mu-han-dis.',
    'Die Berufe deiner Liste als Gruppe: مُدَرِّسٌ (Lehrer), مُدِيرٌ (Direktor), مُمَرِّضَةٌ (Krankenschwester), مُؤَذِّنٌ (Gebetsrufer), طَبِيبٌ (Arzt), تَاجِرٌ (Händler), فَلَّاحٌ (Bauer), وَزِيرٌ (Minister) — und der Ingenieur dazu. Alle fangen mit مُـ an oder folgen einem eigenen Berufsmuster.'
  ],

  /* الإِسْمُ - Nomen */
  '65699a81-0913-4e3c-9d5d-fa750d972779': [
    'Es ist eines von genau DREI Wörtern, die es im Arabischen überhaupt gibt: اِسْم (Nomen), فِعْل (Verb), حَرْف (Partikel). Alles, was kein Verb und keine Partikel ist, ist automatisch ein اِسْم — auch Adjektive und Zahlen. Drei Kästen, mehr braucht die Wortartenlehre nicht.',
    'Dasselbe Wort ist deine Vokabel „Name" aus Kapitel 5 — اِسْمٌ. Grammatik und Alltag fallen hier zusammen: ein Nomen ist der NAME einer Sache. Wer das einmal sieht, muss nur ein Wort lernen statt zwei.'
  ],

  /* يَا - Rufpartikel */
  '69179bbf-faa9-4b2a-859c-9e5f3d76b98c': [
    'Du hörst es in jeder Anrede: يَا أَخِي („o mein Bruder"), يَا اللهُ, يَا مُحَمَّدُ. Das يَا macht aus einem Namen einen Anruf — im Deutschen fällt es meist weg, im Arabischen steht es fast immer da.',
    '⚠️ Nach يَا verliert der Name sein Tanwīn: يَا مُحَمَّدُ, nicht يَا مُحَمَّدٌ. Das ist kein Zufall — die Rufform hat ihre eigene Endung. Merke fürs Erste nur: nach يَا wird es kürzer, nicht länger.'
  ],

  /* مُضَافْ إِلَيْهِ - Besitzer */
  'c73787a3-8f9c-4033-b1ff-5644f34995d3': [
    'Die Reihenfolge ist im Deutschen umgekehrt, und genau daran verrutscht es: كِتَابُ اللهِ heißt „das Buch Allahs" — das ERSTE Wort ist der Besitz, das ZWEITE der Besitzer. Im Deutschen steht der Besitzer hinten mit „-s" oder „von", im Arabischen ebenfalls hinten, aber im Genitiv.',
    'Woran du den مُضَاف إِلَيْهِ erkennst: er steht im Genitiv und darf einen Artikel tragen — الْمَسْجِدِ in بَابُ الْمَسْجِدِ. Der مُضَاف davor darf beides NICHT: kein اَلْ, kein Tanwīn. ⚠️ Zwei Wörter, zwei entgegengesetzte Regeln — deshalb immer als Paar prüfen.'
  ],

  /* إِثْنَانِ - Zwei */
  'd3cca272-90df-4963-a3dd-2653d009a77d': [
    'Die Endung ـَانِ ist der Dual — die eigene Form für GENAU ZWEI, die es im Deutschen nicht gibt. ⭐ Du hast sie schon gelesen: يَدَا أَبِي لَهَبٍ (111:1) sind genau zwei Hände. Wer إِثْنَانِ kann, erkennt die Zweizahl überall am ـَانِ.',
    'Dieselbe Wurzel ث ن ي steckt in ثَانَوِيَّةٌ (weiterführende Schule), das du als Vokabel hast — die ZWEITE Schulstufe. Und ثَانِي heißt „der zweite". Eine Wurzel, drei Wörter, und alle mit „zwei" im Kern.'
  ],

  /* صِفْرٌ - Null */
  'a540cdfa-cbaf-4d63-8250-b0b664d3b2b9': [
    'Das Wort bedeutet ursprünglich „leer" — und genau das ist die Null: die leere Stelle. Wer das Bild hat, braucht die Klanghilfe nicht mehr. ⚠️ Und sprich das ص als dunklen s-Laut, nicht als leichtes س: ṣifr.',
    'Nimm die Zahlen als Reihe statt einzeln — sprich sie einmal am Stück: صِفْر, وَاحِد, إِثْنَانِ, ثَلَاثَة, أَرْبَعَة, خَمْسَة, سِتَّة, سَبْعَة, ثَمَانِيَة, تِسْعَة, عَشَرَة. Elf Wörter, die du alle hast. Eine Reihe lernt sich als Melodie, einzelne Karten nicht.'
  ],

  /* حَرْفُ الْجَرِّ - Genitiv-Präposition */
  'c623f2fb-57a5-48b6-b176-55df461b2ada': [
    'Der Name erklärt sich selbst, wenn man ihn zerlegt: حَرْف heißt Partikel, und اَلْجَرّ kommt von مَجْرُور, dem Genitiv. Ein حَرْفُ الْجَرِّ ist also wörtlich „die Partikel des Ziehens" — sie zieht das folgende Nomen in den Genitiv. Merksatz deines Lehrers: der ḥarf al-jarr macht sein Nomen zu majrūr.',
    'Du hast fünf davon als eigene Vokabeln: مِنْ (von), إِلَى (zu), فِي (in), عَلَى (auf), لِ (für). ⚠️ تَحْتَ gehört NICHT dazu, auch wenn es genauso wirkt — dein Lehrer stellt das ausdrücklich klar; das ist eine ظَرْف. Fünf Partikeln und eine Ausnahme, die man kennen muss.'
  ],

  /* وَاحِدٌ - eins */
  '50296': [
    'Du sprichst die Wurzel in Sūrat al-Ikhlāṣ, die du auswendig kannst: قُلْ هُوَ ٱللَّهُ أَحَدٌ (112:1). أَحَد und وَاحِد kommen beide von و ح د — und daher auch تَوْحِيد, das Bekenntnis zur Einheit. Die Eins ist die Zahl, die im Glauben ganz oben steht.',
    'Muster فَاعِل wie جَالِسٌ, وَاقِفٌ, طَائِرٌ, شَارِعٌ — alle hast du. ⚠️ Und die Zahl verhält sich wie ein Adjektiv: sie steht HINTER dem Gezählten und richtet sich nach ihm — كِتَابٌ وَاحِدٌ, „ein Buch". Das ist bei den anderen Zahlen anders, deshalb hier merken.'
  ],

  /* ثَلَاثَةٌ - drei */
  '50297': [
    '⭐ Drei ist die Zahl der Wurzelbuchstaben — jedes arabische Wort, das du lernst, steht auf ثَلَاثَة Buchstaben. Wer die Drei sagt, sagt zugleich das Grundprinzip der Sprache. Ein Merkhaken, der bei jeder neuen Vokabel wieder auftaucht.',
    '⚠️ Achte auf die تاء مَرْبُوطة am Ende: ثَلَاثَةٌ hat sie, obwohl damit männliche Dinge gezählt werden. Das ist die berühmte Umkehrung bei den Zahlen 3 bis 10 — sie steht in deinem Lehrbuch als eigene Lektion. Fürs Erste nur merken: die Endung sieht weiblich aus und ist es nicht.'
  ],

  /* أَرْبَعَةٌ - vier */
  '50298': [
    'Die Wurzel ر ب ع trägt رُبْع, das Viertel — und أَرْبَعِين, die Vierzig. ⭐ Und der Begriff الْأَرْبَعِينَ النَّوَوِيَّة, die vierzig Hadithe an-Nawawis, kommt dir sicher unter. Eine Wurzel, drei Wörter, alle mit der Vier.',
    'Nimm die Zahlen in Zweierschritten, das hält besser als die Reihe am Stück: ثَلَاثَة–أَرْبَعَة, خَمْسَة–سِتَّة, سَبْعَة–ثَمَانِيَة, تِسْعَة–عَشَرَة. Sprich jedes Paar zusammen. ⚠️ Alle acht tragen die تاء مَرْبُوطة, die hier nichts über das Geschlecht sagt.'
  ],

  /* خَمْسَةٌ - fünf */
  '50299': [
    '⭐ Die Fünf ist im Islam überall: الصَّلَوَاتُ الْخَمْسُ, die fünf Gebete, und أَرْكَانُ الْإِسْلَام, die fünf Säulen. Du zählst sie ohnehin jeden Tag — jetzt hast du das Wort dazu.',
    '⚠️ Verwechslungsgefahr im Klang mit خَمِيس (Donnerstag), das wörtlich „der fünfte" ist — der fünfte Tag der Woche, wenn man am Sonntag anfängt. Zahl und Wochentag aus derselben Wurzel: wer die Fünf hat, versteht auch den Donnerstag.'
  ],

  /* سِتَّةٌ - sechs */
  '50300': [
    '⭐ أَرْكَانُ الْإِيمَان, die Glaubensartikel, sind سِتَّة — sechs. Damit hast du die Zahl an einem Begriff, den du kennst, statt an einer Klanghilfe. Und die fünf Säulen daneben geben dir gleich die Fünf mit.',
    'Die شَدَّة auf dem ت ist Pflicht: sit-ta. ⚠️ Die Wurzel ist eigentlich س د س — daher سُدُس, das Sechstel, und سَادِس, „der sechste". Das د ist im gesprochenen Wort zum ت geworden; deshalb sieht die Zahl anders aus als ihre Verwandten.'
  ],

  /* سَبْعَةٌ - sieben */
  '50301': [
    '⭐ In Sūrat al-Mulk, die du auswendig kannst, steht die Zahl gleich im dritten Vers: خَلَقَ سَبْعَ سَمَٰوَٰتٍ (67:3) — „Der sieben Himmel erschaffen hat". Deine Zahl und deine Vokabel سَمَاءٌ in einem Halbvers, den du sprichst.',
    '⚠️ Beachte die Form: im Vers steht سَبْعَ ohne تاء مَرْبُوطة, in deiner Vokabel سَبْعَةٌ mit. Beides ist richtig — die Endung richtet sich nach dem, was gezählt wird. سَمَاوَات ist weiblich, deshalb fällt das ة weg. Genau die Umkehrung, die dein Lehrbuch in einer eigenen Lektion behandelt.'
  ],

  /* ثَمَانِيَةٌ - acht */
  '50302': [
    'Die Wurzel ث م ن trägt ثُمُن, das Achtel, und ثَمِين, „wertvoll". ⚠️ Und sie ist die einzige der kleinen Zahlen mit einem langen ā in der Mitte: tha-mā-ni-ya, vier Silben. Die längste Zahl der Reihe — das allein macht sie unverwechselbar.',
    'Merke sie im Paar mit سَبْعَة: sieben und acht liegen im Zählen nebeneinander und klingen völlig verschieden — sab-ʿa gegen tha-mā-ni-ya. Wer beide hintereinander spricht, verwechselt sie nicht mehr.'
  ],

  /* تِسْعَةٌ - neun */
  '50303': [
    'Kurz vor der Zehn und ihr im Bau sehr ähnlich: تِسْعَة und عَشَرَة teilen sich das ع. ⚠️ Sprich beide hintereinander — tis-ʿa, ʿa-scha-ra. Beim einen steht das ع in der Mitte, beim anderen am Anfang.',
    'Die Zahl begegnet dir in تَاسِع, „der neunte", und in تِسْعِين, „neunzig". Dieselbe Bildung wie bei den anderen: aus der Grundzahl wird mit dem Muster فَاعِل die Ordnungszahl. ⭐ Vergleiche mit وَاحِد, das selbst schon diesem Muster folgt.'
  ],

  /* عَشَرَةٌ - zehn */
  '50304': [
    '⭐ Die Wurzel ع ش ر kennst du aus dem Kalender: عَاشُورَاء ist der ZEHNTE Tag des Muḥarram, und die ersten zehn Tage von Dhū l-Ḥiddscha heißen الْعَشْر. Dazu عُشْر, das Zehntel. Die Zehn steht im Glaubensjahr an mehreren Stellen.',
    'Sie ist die Grenze der kleinen Zahlen: ab elf ändert sich der Bau vollständig. ⚠️ Bis dahin gilt die Umkehrung mit der تاء مَرْبُوطة, die du bei ثَلَاثَة bis عَشَرَة siehst — zehn Zahlen, eine Regel, und du hast alle zehn als Vokabel.'
  ],

  /* ===================== Die Fachbegriffe aus dem Unterricht =========
     Zu data/fachbegriffe.js (17.08.2026). Der erste Vorschlag steht dort im
     Feld `mnemo`; hier stehen die zwei Alternativen dazu. Alle Aussagen sind
     aus seinen eigenen 73 Regeln in grammar-data.js belegt. */

  /* مُضَاف - der Besitz, erstes Wort */
  'gram-mudaf': [
    'So erkennst du ihn beim Lesen, ohne die Regel aufzusagen: ein Nomen OHNE Tanwīn, direkt gefolgt von einem zweiten Nomen — das ist eine إِضافة, und das erste ist der مُضَاف. Sieh dir بَابُ الْمَسْجِدِ an: بَابُ hat kein Tanwīn, obwohl es unbestimmt aussieht. Genau das ist das Zeichen.',
    '⚠️ Der مُضَاف kann jeden Fall annehmen — er bekommt ihn aus dem Satz, nicht aus der Verbindung: كِتَابُ اللهِ im Grundfall, aber عَلَى مَكْتَبِ الْمُدَرِّسِ mit Kasra nach dem حَرْف جَرّ. Nur اَلْ und Tanwīn sind ihm verboten; die Endung selbst ist frei.'
  ],

  /* مَجْرُور - Genitiv */
  'gram-majrur': [
    'Drei Dinge lösen den Genitiv aus, und nur drei — merke sie als Liste, dann erkennst du den Fall am SATZ statt an der Endung: (1) ein حَرْفُ الْجَرِّ davor, (2) eine إِضافة, (3) eine ظَرْف wie تَحْتَ. Alle drei hast du als eigene Fachbegriffe.',
    'Das Anzeichen ist sichtbar und leicht zu prüfen: Kasra ـِ beim bestimmten Wort, zwei Kasra ـٍ beim unbestimmten. فِي الْبَيْتِ gegen فِي بَيْتٍ. ⚠️ Es gibt Wörter, die stattdessen ein Fatḥah bekommen — die begegnen dir später als eigene Regel; wundere dich vorerst nicht darüber.'
  ],

  /* مَرْفُوع - Nominativ */
  'gram-marfu': [
    'Das Anzeichen: Ḍammah ـُ beim bestimmten Wort, zwei Ḍammah ـٌ beim unbestimmten. اَلْبَيْتُ gegen بَيْتٌ. ⚠️ Und die Probe dazu lautet „wer oder was?“ — was diese Frage beantwortet, steht im مَرْفُوع.',
    'Der Name sagt, was passiert: رَفْع heißt „heben“. Der Grundfall ist der gehobene — die Ḍammah ist der Vokal, der oben steht. Dieselbe Wurzel ر ف ع steckt in الرَّفِيع (der Erhabene). Drei Fälle, drei Bewegungen: heben (رَفْع), ziehen (جَرّ), aufstellen (نَصْب).'
  ],

  /* نَعْت - Adjektiv */
  'gram-nat': [
    'Vier Bedingungen, und du prüfst sie an einem Beispiel schneller als du sie aufzählst: بِنْتٌ صَغِيرَةٌ. Geschlecht (beide weiblich), Bestimmtheit (beide unbestimmt), Fall (beide Ḍammah), Zahl (beide Einzahl). Stimmt eines nicht, ist es kein نَعْت.',
    '⚠️ Genau hier entscheidet sich, ob ein SATZ dasteht oder nur eine Wortgruppe: اَلْبَيْتُ جَمِيلٌ heißt „das Haus ist schön" — eine Aussage. اَلْبَيْتُ الْجَمِيلُ heißt nur „das schöne Haus" — kein Satz, nur eine Benennung. Der Unterschied ist ein einziges اَلْ.'
  ],

  /* إِضافة - Genitivverbindung */
  'gram-idafa': [
    '⚠️ Das zweite Glied darf KEIN Adjektiv sein — nur ein Nomen. كِتَابُ اللهِ geht, كِتَابُ الْجَمِيلِ als „das schöne Buch" nicht. Wer ein Adjektiv anhängen will, braucht ein نَعْت, keine إِضافة. Zwei Regeln, die gleich aussehen und Verschiedenes tun.',
    'Die Verbindung lässt sich verketten: بَابُ بَيْتِ الْمُدَرِّسِ — „die Tür des Hauses des Lehrers". Das mittlere Wort ist gleichzeitig مُضَاف إِلَيْهِ zum ersten und مُضَاف zum letzten. ⚠️ Nur das LETZTE Glied darf اَلْ tragen; alle davor stehen nackt.'
  ],

  /* ظَرْف - Zeit-/Ortsangabe */
  'gram-zarf': [
    'Du hast schon zwei davon als Vokabeln: تَحْتَ (unter) und die Ortsangaben aus deinen Regeln أَمَامَ (vor) und خَلْفَ (hinter). Alle drei setzen das folgende Nomen in den Genitiv — تَحْتَ الْمَكْتَبِ, أَمَامَ الْمَسْجِدِ, خَلْفَ الْمَدْرَسَةِ.',
    '⚠️ Der Punkt, den dein Lehrer ausdrücklich betont: تَحْتَ zählt NICHT zu den حُرُوف الْجَرّ, obwohl es genauso wirkt. Es ist eine eigene Kategorie. Merke es als Ausnahme, sonst zählst du beim Aufsagen der Genitivpartikeln eine zu viel.'
  ],

  /* شَكْل - Vokalzeichen */
  'gram-schakl': [
    'Fünf Stück, und du kennst sie alle vom Sehen: فَتْحة (der Strich oben, a), كَسْرة (der Strich unten, i), ضَمّة (das Häkchen oben, u), سُكون (der kleine Kreis, kein Vokal), شَدّة (die Verdopplung). Zähl sie einmal an einem Wort ab, das du kennst — مُدَرِّسٌ hat vier davon.',
    '⚠️ Einzahl und Gesamtheit heißen verschieden: EIN Zeichen ist ein شَكْل, ALLE zusammen heißen تَشْكيل. Wenn jemand sagt „schreib es mit Taschkīl", meint er die vollständige Vokalisierung — nicht ein einzelnes Zeichen.'
  ],

  /* اسْمُ الْإِشَارَة - Hinweiswort */
  'gram-ismul-isara': [
    'Vier Stück, geordnet nach zwei Fragen — nah oder fern, männlich oder weiblich: هَذَا (nah, m), هَذِهِ (nah, w), ذَلِكَ (fern, m), تِلْكَ (fern, w). ⚠️ Das كَ in ذَلِكَ und تِلْكَ ist der Zeigefinger in die Ferne, genau wie in هُنَاكَ, das du als Vokabel hast.',
    '⚠️ Ein اسْمُ الْإِشَارَة plus Nomen ergibt noch KEINEN Satz, sobald das Nomen ein اَلْ trägt: هَذَا بَيْتٌ ist „dies ist ein Haus" — eine Aussage. هَذَا الْبَيْتُ ist nur „dieses Haus" — kein Satz. Derselbe Unterschied wie beim نَعْت, und er hängt wieder an einem einzigen اَلْ.'
  ],

  /* تاء مَرْبُوطة - weibliche Endung */
  'gram-ta-marbuta': [
    '⚠️ Der Umkehrschluss stimmt NICHT: ein ة bedeutet weiblich, aber weiblich bedeutet nicht immer ة. Drei deiner Vokabeln beweisen es — بِنْتٌ (Tochter), أُخْتٌ (Schwester) und سُوقٌ (Markt) sind weiblich und tragen keines. Dein Lehrer nennt sie مؤنث بلا تاء.',
    'Sie kann noch mehr als „weiblich": bei Tieren und Sachen trennt sie das EINZELNE Stück von der Menge — بَقَرٌ ist das Rindvieh, بَقَرَةٌ die eine Kuh; دَجَاجٌ ist Hühnerfleisch, دَجَاجَةٌ die eine Henne. ⚠️ Und nicht jedes Wort lässt sich damit weiblich machen; das geht nur, wo es ein Gegenstück gibt.'
  ],

  /* ===================== Kapitel 10 und 11 (Buchabzug) ==============
     ⭐ Diese fünf sind KEINE Vorratsarbeit für später: Kapitel 10 und 11 sind
     seit dem 17.08.2026 freigeschaltet, die Wörter stehen also schon in seiner
     Kartei. Gefunden hat sie `pruefe-eselsbruecken.js` Abschnitt 6 — der Punkt,
     der den Dauerauftrag „auch die nachfolgenden Kapitel" maschinell wach hält.
     ⚠️ Für keines der fünf gibt es eine Koranstelle in seinem auswendigen
     Bereich; die einzige Kandidatin (93:5 für ف ت ي) ist فَتَرْضَىٰ und gehört
     zur Wurzel ر ض ي. Also Begriff und Muster statt Vers. */

  /* زَمِيلٌ - Kollege / Mitschüler */
  '45899': [
    'Der Plural lohnt sich, weil du das Muster schon dreimal hast: زَمِيلٌ → زُمَلَاءُ, wie فَقِيرٌ → فُقَرَاءُ, غَنِيٌّ → أَغْنِيَاءُ und وَزِيرٌ → وُزَرَاءُ. ⚠️ Alle vier enden auf ُ **ohne Tanwīn** — das ist kein Tippfehler, sondern eine eigene Wortsorte.',
    '⚠️ Ein زَمِيل ist an einen ORT gebunden, nicht an Freundschaft: der, der in derselben مَدْرَسَة, derselben جَامِعَة oder am selben مَكْتَب sitzt. Alle drei Orte hast du als Vokabel. Wer den Ort mitdenkt, trifft die Bedeutung genauer als mit „Freund".'
  ],

  /* زَوْجَةٌ - Ehefrau */
  '45900': [
    '⭐ Die Wurzel ز و ج heißt „Paar" — deshalb heißen die Frauen des Propheten أَزْوَاجُ النَّبِيِّ, und sie tragen den Titel أُمَّهَاتُ الْمُؤْمِنِينَ, „Mütter der Gläubigen". Das أُمَّهَات darin ist der Plural von أُمّ, den du als Vokabel hast. Ein Begriff, zwei bekannte Wörter.',
    'Die تاء مَرْبُوطة macht aus dem Mann die Frau, und du hast das Muster schon: مُدَرِّسٌ → مُدَرِّسَةٌ, مُمَرِّضٌ → مُمَرِّضَةٌ. Und genau dieses ة steht auch am Ende von زَوْجَةٌ. ⚠️ Merke aber: das ة ist hier eine echte Geschlechtsendung — bei بَقَرَة oder بَطَّة trennt dasselbe Zeichen nur das Einzeltier von der Art.'
  ],

  /* طِفْلٌ - Kind */
  '45901': [
    'Der Plural folgt dem Muster, das du von vier eigenen Wörtern kennst: طِفْلٌ → أَطْفَالٌ, wie بَابٌ → أَبْوَابٌ, قَلَمٌ → أَقْلَامٌ, وَلَدٌ → أَوْلَادٌ, وَرَقٌ → أَوْرَاقٌ. Ein أَ vorne, ein langes ا vor dem letzten Buchstaben.',
    'Setz es in die Familie, die du schon vollständig hast: أَبٌ, أُمٌّ, اِبْنٌ, بِنْتٌ, أَخٌ, أُخْتٌ, عَمٌّ, خَالٌ. Alle acht sagen, WER jemand ist; طِفْلٌ sagt nur, WIE ALT — und lässt das Geschlecht offen. ⚠️ Achte auf das ط: der satte, dunkle t-Laut, nicht das leichte ت aus بِنْتٌ.'
  ],

  /* فَتًى - junger Mann */
  '45902': [
    '⭐ Du kennst den Begriff aus der Geschichte der Höhlengefährten: die أَصْحَابُ الْكَهْف werden im Koran als فِتْيَة bezeichnet — junge Männer, die für ihren Glauben fortgingen. Dasselbe Wort, ein Plural davon. Wer die Geschichte kennt, hat die Vokabel.',
    '⚠️ Am Ende steht eine أَلِف مَقْصورة — das ى ohne Punkte, gesprochen wie ein kurzes a mit Tanwīn: fa-tan. Genau der Fachbegriff, den du gelernt hast, und dasselbe Wortende wie bei مُسْتَشْفًى. Die weibliche Form dazu lernst du im nächsten Kapitel — dort wird aus dem ى ein echtes ت.'
  ],

  /* أَحَبَّ - lieben */
  '45903': [
    '⭐ Die Wurzel ح ب ب trägt Wörter, die du täglich hörst: مَحَبَّة (Liebe), حَبِيب (der Geliebte) — und der Prophet ﷺ heißt الْحَبِيب. Dazu der Anfang eines bekannten Hadith: أَحَبُّ الْأَعْمَالِ إِلَى اللهِ, „die beliebtesten Taten bei Allah". Ein Stamm, vier Anläufe, ihn zu behalten.',
    '⚠️ Das ist ein VERB und verhält sich anders als deine übrigen Wörter: أَحَبَّ heißt „er liebte", die Grundform steht also schon in der Vergangenheit und in der dritten Person. Das „er" steckt im Wort — genau wie bei خَرَجَ und ذَهَبَ aus deinen Regeln. Und die شَدَّة auf dem بّ zeigt die beiden ب der Wurzel.'
  ],

  /* أَلِف مَقْصورة - das ى am Wortende */
  'gram-alif-maqsura': [
    'Du hast vier Wörter damit: عَلَى (auf), إِلَى (zu), مُسْتَشْفًى (Krankenhaus) und den Plural مَرْضَى (Kranke). ⚠️ Alle vier enden auf ein langes ā, obwohl dort ein ى steht. Sprich sie hintereinander, dann trennt sich das Schriftbild vom Klang.',
    '⚠️ Sobald etwas angehängt wird, verwandelt sich das ى in ein echtes ي: عَلَى → عَلَيْهِ, إِلَى → إِلَيْهِ, مُسْتَشْفًى → مُسْتَشْفَيَاتٌ. Daran erkennst du, dass es nie ein bloßes Alif war — der Buchstabe darunter ist ein ي, das nur allein am Wortende seine Punkte verliert.'
  ],

  /* ══════ Kapitel 12 ══════ */

  /* عَمَّةٌ - Tante väterlicherseits */
  '45904': [
    '⭐ Der Prophet ﷺ hatte berühmte أَعْمَام — حَمْزَة und الْعَبَّاس — und ihre Schwester صَفِيَّة بِنْت عَبْد الْمُطَّلِب war seine عَمَّة, die Mutter von الزُّبَيْر. Die Namen kennst du; das Verwandtschaftswort steckt zwischen ihnen.',
    'Der Ausdruck, den du am häufigsten hören wirst, ist ابْنُ الْعَمِّ und بِنْتُ الْعَمِّ — Cousin und Cousine von Vaters Seite. Das عَمّ sitzt mitten im Ausdruck, und mit ـة wird die Schwester des Vaters selbst daraus.'
  ],

  /* خَالَةٌ - Tante mütterlicherseits */
  '45905': [
    '⭐ Ein Hadith trägt das Wort und seine Bedeutung zugleich: الْخَالَةُ بِمَنْزِلَةِ الْأُمِّ — „die Tante mütterlicherseits steht an der Stelle der Mutter" (Buḫārī). Wer den Satz einmal gehört hat, weiß auch, welche Seite gemeint ist.',
    'Sprich die beiden Tanten laut nebeneinander: ʿam-ma gegen ḫā-la. Die eine hat eine شَدَّة und ist kurz und hart, die andere ein langes ـَا und fließt. Der Klang trennt sie zuverlässiger als die Bedeutung.'
  ],

  /* شَجَرَةٌ - Baum */
  '45906': [
    '⭐ Zwei Bäume kennst du beim Namen: سِدْرَةُ الْمُنْتَهَىٰ, der Lotusbaum an der äußersten Grenze, und شَجَرَةُ الزَّقُّومِ, der Baum der Höllenspeise. Beide Male steht dasselbe schlichte Wort für „Baum" davor.',
    '⭐ Und der Treueid von al-Ḥudaybiya heißt بَيْعَةُ الرِّضْوَانِ, geleistet تَحْتَ الشَّجَرَةِ — „unter dem Baum". Auch der Baum, dem Ādam ﷺ sich nicht nähern sollte, wird im Koran nur الشَّجَرَة genannt.'
  ],

  /* سُورِيَا - Syrien */
  '45907': [
    '⭐ Dasselbe Land heißt im Arabischen auch الشَّام — das Gebiet, für das der Prophet ﷺ ausdrücklich um Segen bat: اللَّهُمَّ بَارِكْ لَنَا — „O Allah, segne uns“ — فِي شَامِنَا. دِمَشْق mit der Umayyaden-Moschee liegt dort.',
    '⚠️ Verwechslungsfalle: سُورِيَا hat mit سُورَة nichts zu tun. Ländernamen sind entlehnt und haben gar keine arabische Wurzel — die Angabe س و ر ist nur eine Hilfszeile in der Datenbank. Hier trägt allein der Klang.'
  ],

  /* مَدْرَسَةٌ مُتَوَسِّطَةٌ - Mittelschule */
  '45908': [
    '⭐ Dasselbe Wort steckt im Namen des Mittelmeers: الْبَحْرُ الْأَبْيَضُ الْمُتَوَسِّطُ — das „mittlere" Meer zwischen den Kontinenten. Und die صَلَاةٌ وُسْطَىٰ, das mittlere Gebet, trägt dieselbe Wurzel و س ط.',
    'Achte auf das ـة am Ende von مُتَوَسِّطَةٌ: es steht dort nur, weil مَدْرَسَةٌ weiblich ist. Genau deine Regel zur Übereinstimmung — das Adjektiv richtet sich nach dem Nomen. Bei einem männlichen Wort hieße es مُتَوَسِّطٌ.'
  ],

  /* مُفَتِّشٌ - Inspektor */
  '45909': [
    'Das Wort für „Durchsuchung" heißt تَفْتِيشٌ und steht an jedem Sicherheitsschalter eines arabischen Flughafens. Der مُفَتِّشٌ ist der Mann, der das tut — Wurzel und Beruf hängen unmittelbar zusammen.',
    '⚠️ Ein einziger Buchstabe trennt zwei Welten: ف ت ح ist öffnen und trägt مِفْتَاحٌ und الْفَاتِحَة, die du beide kennst. ف ت ش mit ش ist durchsuchen. Wer das ش überliest, macht aus dem Inspektor einen Schlüssel.'
  ],

  /* فَتَاةٌ - junge Frau */
  '45910': [
    '⚠️ Hier wird sichtbar, was in فَتًى versteckt lag: das ى am Ende war nie ein bloßes Alif. Sobald ـة angehängt wird, tritt ein langes ـَا hervor — fa-tan wird zu fa-tāh. Genau der Vorgang, den deine Regel zur أَلِف مَقْصورة beschreibt.',
    'Vier Paare gehen alle gleich: عَمٌّ/عَمَّةٌ, خَالٌ/خَالَةٌ, زَوْجٌ/زَوْجَةٌ (von diesem Paar hast du bisher nur die Frau, der Mann kommt in Kapitel 13) und فَتًى/فَتَاةٌ. Sprich sie als Paare statt als acht einzelne Wörter — dann lernst du sie in vier Portionen.'
  ],

  /* مَالِيزِيَا - Malaysia */
  '45911': [
    'Neben إِنْدُونِيسِيَا aus Kapitel 9 das zweite südostasiatische Land in deiner Liste, und wie dieses mit muslimischer Mehrheit. Beide enden auf ـِيَا, beide sind reine Lautschriften.',
    '⚠️ Vier Silben, und die erste ist schon lang: mā-lī-zi-yā. Das ـَا direkt nach dem م wird gern verschluckt; wer „Maliziya" liest, schreibt es hinterher auch so. Dehne die erste Silbe bewusst.'
  ],

  /* مَمْلَكَةٌ - Königreich */
  '45912': [
    '⭐ Die Wurzel م ل ك sprichst du in jedem Gebet und in jedem Schutzgebet: مَالِكِ يَوْمِ الدِّينِ (1:4) und مَلِكِ النَّاسِ (114:2). Der مَلِك ist der König — die مَمْلَكَة ist das Gebiet, über das er herrscht.',
    '⭐ Und du kennst das Wort aus dem Namen eines Landes: الْمَمْلَكَةُ الْعَرَبِيَّةُ السُّعُودِيَّةُ, das Königreich Saudi-Arabien. Es steht ganz vorn, noch vor der Herkunftsangabe.'
  ],

  /* ══════ Kapitel 13 ══════ */

  /* ضَيْفٌ - Gast */
  '45913': [
    '⭐ Ein Hadith, der das Wort trägt: مَنْ كَانَ يُؤْمِنُ بِاللَّهِ — „Wer an Allah glaubt“ — وَالْيَوْمِ الْآخِرِ — „und an den Jüngsten Tag“ — فَلْيُكْرِمْ ضَيْفَهُ — „der ehre seinen Gast" (Buḫārī und Muslim). إِكْرَامُ الضَّيْفِ ist daraus ein feststehender Begriff geworden.',
    '⭐ Und die Geschichte kennst du: die Engel, die zu Ibrāhīm ﷺ kamen und denen er das gebratene Kalb vorsetzte, heißen im Koran schlicht ضَيْفُ إِبْرَاهِيمَ. Das Wort steht mitten in einer Erzählung, die du schon hast.'
  ],

  /* حَقْلٌ - Feld */
  '45914': [
    'Im Plural begegnet dir das Wort in den Nachrichten: حُقُولُ النِّفْطِ, die Ölfelder. Dieselbe Vokabel, nur größer gedacht — aus dem bestellten Acker wird das Fördergebiet.',
    'Der Bau ist derselbe wie bei بَيْتٌ und عَيْنٌ aus deinen ersten Kapiteln: Fatḥa, dann Sukūn, dann die Endung — ḥaq-l, bay-t, ʿay-n. Ein einsilbiges Wort mit ruhendem Mittelbuchstaben; der Plural dehnt sich dann auf حُقُولٌ.'
  ],

  /* النَّاسُ - die Leute */
  '45915': [
    '⭐ In der letzten Sure steht das Wort fünfmal, in sechs Versen: بِرَبِّ النَّاسِ · مَلِكِ النَّاسِ · إِلَٰهِ النَّاسِ · فِي صُدُورِ النَّاسِ · وَالنَّاسِ. Du sprichst es jedes Mal, wenn du Zuflucht suchst.',
    '⚠️ النَّاس ist ein Sammelwort: die Form ist Einzahl, gemeint sind alle. Deshalb siehst du es fast immer mit اَلْ und nie mit Tanwīn — ein einzelner „Mensch" heißt رَجُلٌ oder إِنْسَانٌ, nicht نَاس.'
  ],

  /* مَطْعَمٌ - Restaurant */
  '45916': [
    '⭐ Die Wurzel ط ع م steht zweimal in deinem auswendigen Bereich: الَّذِي أَطْعَمَهُم مِّن جُوعٍ (106:4) und طَعَامِ الْمِسْكِينِ (107:3). Der مَطْعَم ist genau der Ort, an dem das geschieht.',
    'Halte die beiden Wörter auseinander: طَعَامٌ ist das Essen selbst, مَطْعَمٌ der Ort dafür. Das مَـ macht den Unterschied — dieselbe Verwandlung wie bei مَطْبَخٌ (Küche) und مَكْتَبَةٌ (Bibliothek), die du beide hast.'
  ],

  /* شَيْخٌ - alter Mann / Gelehrter */
  '45917': [
    '⭐ Im Wissen ist der شَيْخ der Lehrer, von dem man überliefert; شَيْخُ الْإِسْلَامِ ist ein Ehrentitel. Das Wort meint beides zugleich — alt an Jahren und alt im Wissen —, und beide Bedeutungen stammen aus derselben Vorstellung.',
    'Sein Gegenstück im Buch ist فَتًى, der junge Mann aus Kapitel 10. Das Alterspaar lohnt sich zusammen: fa-tan gegen šay-ḫ. Plural شُيُوخٌ, daneben gebräuchlich مَشَايِخُ.'
  ],

  /* أُسْتَاذَةٌ - Professorin */
  '45918': [
    '⚠️ Dieses Wort ist aus dem Persischen entlehnt und passt in kein arabisches Wurzelmuster — die Angabe أ س ت ذ ist nur eine Hilfszeile. Bei Lehnwörtern trägt der Klang, nicht die Ableitung: us-tā-ḏa.',
    'Der Ort trennt die Titel: der مُدَرِّسٌ unterrichtet an der مَدْرَسَةٌ, die أُسْتَاذَةٌ an der جَامِعَةٌ — beide Orte hast du aus Kapitel 1 und 4. Wer sich den Ort merkt, verwechselt die Titel nicht.'
  ],

  /* امْرَأَةٌ - Frau */
  '45919': [
    '⭐ Belegt in al-Masad, die du auswendig kannst: وَامْرَأَتُهُ حَمَّالَةَ الْحَطَبِ — „und seine Frau, die Brennholzträgerin" (111:4). Dort steht das Wort schon mit Anhang: امْرَأَتُهُ, „seine Frau".',
    '⚠️ Das Alif am Anfang ist ein Hilfsalif und verschwindet mit dem Artikel: امْرَأَةٌ allein, aber الْمَرْأَةُ mit اَلْ. Wer das nicht weiß, sucht die bestimmte Form vergeblich unter dem ا — sie steht unter dem م.'
  ],

  /* زَوْجٌ - Ehemann */
  '45920': [
    '⭐ Die Wurzel trägt das Wort für die Ehe selbst: الزَّوَاج, und der Ehevertrag heißt عَقْدُ الزَّوَاجِ. Wer heiratet, wird zum زَوْج — Wort und Lebensereignis hängen unmittelbar zusammen.',
    '⚠️ زَوْجٌ heißt eigentlich „einer von einem Paar", nicht „Mann". Deshalb konnte es klassisch beide Seiten meinen. Heute gilt die einfache Regel: ohne ـة er, mit ـة sie — زَوْجٌ und زَوْجَةٌ, die du aus Kapitel 10 schon hast.'
  ],

  /* ══════ Kapitel 14 ══════ */

  /* دُسْتُورٌ - Verfassung */
  '45921': [
    'Aus demselben Kapitel kommt مَحْكَمَةٌ dazu — und beide Wörter treffen sich in einem festen Begriff: الْمَحْكَمَةُ الدُّسْتُورِيَّةُ, das Verfassungsgericht. Zwei neue Vokabeln, ein Ausdruck.',
    'Der Plural دَسَاتِيرُ folgt derselben Form wie فَنَادِقُ von فُنْدُقٌ aus Kapitel 16: vier Wurzelbuchstaben, langes ـِيـ vor dem Ende, und kein Tanwīn. Merk dir die beiden Fremdwörter als Paar, dann stimmt auch der Plural.'
  ],

  /* قِبْلَةٌ - Gebetsrichtung */
  '45922': [
    '⭐ Die Wurzel ق ب ل meint das Zuwenden, und du kennst sie aus mehreren Wörtern: اِسْتَقْبَلَ (empfangen, sich jemandem zuwenden) und مُسْتَقْبَل (Zukunft — das, was auf einen zukommt). Die قِبْلَة ist die Richtung, der man sich zuwendet.',
    '⭐ Der Begriff تَحْوِيلُ الْقِبْلَةِ steht für ein bekanntes Ereignis: die Wende von Jerusalem zur كَعْبَة, die du aus Kapitel 5 hast. Wer das Ereignis kennt, hat auch das Wort.'
  ],

  /* مَحْكَمَةٌ - Gericht */
  '45923': [
    '⭐ Die Wurzel ح ك م trägt zwei der schönen Namen: الْحَكِيمُ (der Allweise) und الْحَكَمُ (der Richtende). Ein Urteil heißt حُكْمٌ — und die مَحْكَمَة ist der Ort, an dem eines gefällt wird.',
    'Der Plural مَحَاكِمُ steht ohne Tanwīn, genau wie مَمَالِكُ von مَمْلَكَةٌ aus Kapitel 12. Beide Wörter beginnen mit مَـ, beide bilden denselben Plural, beide verlieren dabei das Tanwīn. Ein Muster für zwei Vokabeln.'
  ],

  /* حَفِيدٌ - Enkel */
  '45924': [
    '⭐ Die berühmtesten أَحْفَاد der islamischen Geschichte sind الْحَسَن und الْحُسَيْن, die Enkel des Propheten ﷺ über فَاطِمَة. Wenn du an die beiden denkst, hast du das Wort.',
    'Bau die Leiter aus Wörtern, die du hast: أَبٌ (Vater, Kapitel 6) → اِبْنٌ (Sohn) → حَفِيدٌ (Enkel). Drei Generationen, drei Vokabeln — und nur die letzte ist neu.'
  ],

  /* حَدِيقَةٌ - Garten */
  '45925': [
    '⚠️ Im Deutschen heißen beide „Garten", im Arabischen nicht: حَدِيقَةٌ ist der Garten vor dem Haus oder der Park in der Stadt, جَنَّةٌ der Garten des Paradieses. Wer das trennt, verwechselt sie nie wieder.',
    'Der Plural حَدَائِقُ geht wie حَقَائِبُ von حَقِيبَةٌ aus Kapitel 5 — dieselbe Form, dasselbe fehlende Tanwīn. Und weil die Singulare sich schon ähneln, lohnt es sich, die Plurale gleich mitzunehmen.'
  ],

  /* رَجَبٌ - Rajab (Monat) */
  '45926': [
    '⭐ رَجَب ist einer der أَشْهُرٌ حُرُمٌ, der vier heiligen Monate, in denen der Kampf verboten war — zusammen mit ذُو الْقَعْدَةِ, ذُو الْحِجَّةِ und مُحَرَّم. Damit steht das Wort in einer Reihe, die du schon kennst.',
    'Am leichtesten über die Reihenfolge: رَجَب, dann شَعْبَان, dann رَمَضَان. Der dritte ist dir vertraut — zähl von ihm zwei zurück, dann steht رَجَب da.'
  ],

  /* اليُونَانُ - Griechenland */
  '45927': [
    'Das Fach, das über Jahrhunderte ins Arabische übersetzt wurde, heißt الْفَلْسَفَةُ الْيُونَانِيَّةُ — die griechische Philosophie. Die Zugehörigkeitsform يُونَانِيّ begegnet dir häufiger als der Ländername selbst.',
    '⚠️ Nah dran und doch etwas ganz anderes: يُونُس ﷺ, der Prophet Jonas. Beide fangen mit يُو an, sonst haben sie nichts miteinander zu tun. Merk dir das ausdrücklich als Falle, sonst baust du sie dir später selbst.'
  ],

  /* مَطَارٌ - Flughafen */
  '45928': [
    '⭐ Belegt in al-Fīl, die du auswendig kannst: وَأَرْسَلَ عَلَيْهِمْ طَيْرًا أَبَابِيلَ — „und Er sandte gegen sie Vögel in Schwärmen" (105:3). طَيْر und مَطَار teilen die Wurzel ط ي ر; der Flughafen ist der Ort des Fliegens.',
    'Im Alltag begegnet dir die Wurzel als طَيَرَان, das Fliegen: شَرِكَةُ طَيَرَانٍ ist eine Fluggesellschaft. Wer ein Ticket bucht, liest beide Wörter auf demselben Blatt.'
  ],

  /* كُلِّيَّةُ الطِّبِّ - medizinische Fakultät */
  '45929': [
    '⭐ الطِّبُّ النَّبَوِيُّ — die prophetische Medizin — ist ein feststehender Begriff und Buchtitel. Darin steht genau dieses Wort für Medizin, und darin steckt طَبِيبٌ (Arzt) aus Kapitel 1.',
    '⚠️ Achte auf die Vokale von كُلِّيَّة: mit Šadda auf dem لّ ist es die Fakultät, von كُلّ (alles, Kapitel 19) — die Gesamtheit eines Fachs. Ohne Šadda und anders vokalisiert wäre كُلْيَة die Niere. Gleiche Buchstaben, zwei Welten.'
  ],

  /* كُلِّيَّةُ الهَنْدَسَةِ - Ingenieursfakultät */
  '45930': [
    'Ein Fach, zwei deutsche Wörter: هَنْدَسَة heißt sowohl Ingenieurwesen als auch Geometrie. Der Bogen dazwischen ist das Messen und Berechnen — die الْهَنْدَسَةُ الْمِعْمَارِيَّةُ ist die Architektur.',
    '⚠️ Das Wort ist wie دُسْتُورٌ aus diesem Kapitel entlehnt und hat keine echte arabische Wurzel. Deshalb hilft kein Muster, und deshalb sieht es الْهِنْد (Indien) so verwirrend ähnlich, ohne verwandt zu sein.'
  ],

  /* كُلِّيَّةُ التِّجَارَةِ - Wirtschaftsfakultät */
  '45931': [
    '⭐ Ein bekannter Hadith gibt dem Wort ein Gesicht: التَّاجِرُ الصَّدُوقُ الْأَمِينُ — „der ehrliche, treue Händler“ — مَعَ النَّبِيِّينَ وَالصِّدِّيقِينَ وَالشُّهَدَاءِ — „ist mit den Propheten, den Wahrhaftigen und den Märtyrern" (Tirmiḏī).',
    'Drei Wörter aus einem Stamm, verteilt über dein Buch: تَاجِرٌ (Händler, Kapitel 1), التِّجَارَة (der Handel, hier) und مَتْجَرٌ (der Laden, Kapitel 24). Der Stamm ت ج ر hält sie zusammen.'
  ],

  /* كُلِّيَّةُ الشَّرِيعَةِ - Fakultät für islamisches Recht */
  '45932': [
    '⭐ Die Grundbedeutung macht das Wort anschaulich: eine شَرِيعَة war ursprünglich der Weg hinunter zur Wasserstelle — der Zugang zu dem, wovon man lebt. Genau dieses Bild trägt der Begriff bis heute.',
    '⚠️ Nicht dasselbe wie فِقْه: die شَرِيعَة ist das Offenbarte, der فِقْه das daraus erarbeitete Verständnis der Gelehrten. Die Fakultät heißt nach dem Ersten, gelehrt wird beides.'
  ],

  /* نَبِيٌّ - Prophet */
  '45933': [
    '⭐ Du kennst den Titel als feststehenden Ausdruck: خَاتَمُ النَّبِيِّينَ — „das Siegel der Propheten". Darin steht der Plural des Wortes, und der Ausdruck sagt dir zugleich, dass nach ihm ﷺ keiner mehr kam.',
    '⚠️ نَبِيٌّ und رَسُولٌ (Kapitel 5) sind nicht dasselbe: jeder رَسُول ist ein نَبِيّ, aber nicht jeder نَبِيّ ist ein رَسُول. Der Unterschied liegt in der Sendung mit einer eigenen Botschaft.'
  ],

  /* ══════ Kapitel 15 ══════ */

  /* أُسْبُوعٌ - Woche */
  '45934': [
    '⭐ Die Zahl steht in al-Mulk, die du auswendig kannst: الَّذِي خَلَقَ — „Der erschaffen hat“ — سَبْعَ سَمَاوَاتٍ طِبَاقًا — „sieben Himmel in Schichten" (67:3). Dasselbe سَبْع steckt in أُسْبُوع.',
    '⭐ Die Sieben trägt fast jede Handlung der عُمْرَة und des حَجّ: sieben Runden im طَوَاف, sieben Gänge beim سَعْي, sieben Steinchen beim Werfen. Wer die Riten kennt, hat die Zahl längst im Ohr.'
  ],

  /* ══════ Kapitel 16 ══════ */

  /* نَهْرٌ - Fluss */
  '45935': [
    '⭐ In deinem auswendigen Bereich stehen dieselben drei Buchstaben mit einer ganz anderen Bedeutung: وَأَمَّا السَّائِلَ فَلَا تَنْهَرْ — „und was den Bettler angeht, so fahre ihn nicht an" (93:10). ⚠️ Kein Fluss weit und breit; merk dir beides nebeneinander, dann stolperst du später nicht.',
    '⭐ Der Fluss, den du beim Namen kennst, ist الْكَوْثَر: إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ (108:1). Über das Bild des Flusses im Paradies hast du das Wort, ohne es einzeln lernen zu müssen.'
  ],

  /* بَحْرٌ - Meer */
  '45936': [
    '⭐ Ein Land trägt den Dual dieses Wortes im Namen: الْبَحْرَيْن — „die zwei Meere". Und die Begegnung von Mūsā ﷺ mit al-Ḫiḍr fand مَجْمَعَ الْبَحْرَيْنِ statt, am Zusammenfluss der beiden Meere.',
    'Aus Kapitel 12 kennst du schon einen Ausdruck damit: الْبَحْرُ الْأَبْيَضُ الْمُتَوَسِّطُ, das Mittelmeer. Dort steht بَحْر an erster Stelle — du hast das Wort also gelesen, bevor es als Vokabel drankam.'
  ],

  /* فُنْدُقٌ - Hotel */
  '45937': [
    'Das Wort ist über das Griechische ins Arabische gekommen, aus einem Ausdruck für die Herberge des Fremden — dieselbe Wurzel des Wortes, aus dem im Italienischen „fondaco", das Handelshaus, wurde. Deshalb passt es in kein arabisches Muster.',
    'Der Plural فَنَادِقُ geht wie دَسَاتِيرُ von دُسْتُورٌ aus Kapitel 14: vier Wurzelbuchstaben, langer Vokal vor dem Ende, kein Tanwīn. Zwei Lehnwörter, ein Pluralbau.'
  ],

  /* ══════ Kapitel 17 ══════ */

  /* رَخِيصٌ - billig */
  '45938': [
    '⭐ Aus derselben Wurzel ر خ ص kommt رُخْصَةٌ, die Erleichterung — der Reisende darf das Gebet kürzen, der Kranke darf sitzen. Beides meint dasselbe: etwas ist leichter zu haben als sonst.',
    'Sein Gegenstück ist غَالٍ (teuer) aus madina-2. Adjektivpaare lernt man am besten zu zweit — رَخِيص und غَالٍ gehören auf dieselbe Karteikarte im Kopf.'
  ],

  /* ══════ Kapitel 18 ══════ */

  /* عَجَلَةٌ - Rad */
  '45939': [
    '⭐ Dieselbe Wurzel trägt die Eile — und einen Satz, den du kennst: الْعَجَلَةُ مِنَ الشَّيْطَانِ, „die Eile ist vom Satan". Ein Rad ist genau das, was schnell macht; Wort und Sprichwort hängen zusammen.',
    '⚠️ Drei Wörter, drei Buchstaben ع ج ل: عَجَلَة das Rad, عَجَلَة die Eile — und عِجْل das Kalb, aus der Geschichte des goldenen Kalbes. Nur die Vokale trennen sie.'
  ],

  /* سَنَةٌ - Jahr */
  '45940': [
    '⚠️ Ein Buchstabe Unterschied im Klang, Welten im Sinn: سَنَةٌ ist das Jahr, السُّنَّة der Weg des Propheten ﷺ. Die Šadda auf dem نّ macht den ganzen Unterschied — sprich beide laut hintereinander.',
    '⭐ Ein Jahr, das du beim Namen kennst: عَامُ الْفِيلِ, das Jahr des Elefanten, in dem der Prophet ﷺ geboren wurde. Dort steht عَام, das gleichbedeutende Wort — سَنَة und عَام wechseln sich ab.'
  ],

  /* مِسْطَرَةٌ - Lineal */
  '45941': [
    'Die Wurzel س ط ر ist die der Zeile: ein سَطْر ist eine geschriebene Zeile, und أَسَاطِيرُ الْأَوَّلِينَ — „die Schriften der Früheren" — ist ein Ausdruck, der im Koran mehrfach vorkommt. Das Lineal zieht genau das: die Zeile.',
    'Zwei Werkzeuge desselben Tisches: مِسْطَرَةٌ zieht die Linie, قَلَمٌ (Kapitel 1) schreibt darauf. Beide beginnen mit dem Werkzeug-Zeichen, das du schon von مِفْتَاحٌ kennst.'
  ],

  /* سَبُّورَةٌ - Tafel */
  '45942': [
    'Nimm das Klassenzimmer als Ganzes: im فَصْلٌ (Kapitel 4) hängt die سَبُّورَةٌ, auf dem Tisch liegen مِسْطَرَةٌ, قَلَمٌ und كِتَابٌ. Fünf Wörter, ein Raum — so merkt man sie besser als einzeln.',
    '⚠️ Die Šadda auf dem بّ trägt die Bedeutung nicht, aber die Aussprache: sab-bū-ra, mit hörbar doppeltem b und langem ū. Wer sie überspringt, sagt „sabūra" und schreibt es hinterher auch so.'
  ],

  /* رَكْعَةٌ - Gebetseinheit */
  '45943': [
    '⭐ Du zählst dieses Wort jeden Tag siebzehnmal: zwei رَكَعَات im الْفَجْر, vier im الظُّهْر, vier im الْعَصْر, drei im الْمَغْرِب und vier im الْعِشَاء. Die Vokabel ist längst Teil deines Tages.',
    'Die Wurzel ر ك ع ist die der Verbeugung: الرُّكُوع ist die Verbeugung selbst, الرَّاكِع der, der sie vollzieht. Eine رَكْعَة heißt nach der Bewegung, die in ihr steckt.'
  ],

  /* ══════ Kapitel 19 ══════ */

  /* كُلٌّ - alle / jeder */
  '45944': [
    '⭐ Belegt in al-Humaza, die du auswendig kannst: وَيْلٌ لِكُلِّ هُمَزَةٍ لُمَزَةٍ — „Wehe jedem Stichler und Nörgler" (104:1). Dort steht كُلّ genau in seiner häufigsten Rolle: vor einem zweiten Nomen.',
    'Aus derselben Wurzel kommt ein Wort aus Kapitel 14: كُلِّيَّةٌ, die Fakultät — die „Gesamtheit" eines Fachs. Wer كُلّ kennt, versteht auch, warum die Fakultät so heißt.'
  ],

  /* مُخْتَلِفٌ - unterschiedlich */
  '45945': [
    '⭐ Dieselbe Wurzel خ ل ف trägt ein Wort, das du längst kennst: خَلِيفَةٌ, der Nachfolger — und الْخُلَفَاءُ الرَّاشِدُونَ, die rechtgeleiteten Kalifen. Wer nachfolgt, kommt hinterher; was مُخْتَلِف ist, weicht ab.',
    'Der Begriff الِاخْتِلَافُ ist derselbe Bau wie مُخْتَلِف und meint die Meinungsverschiedenheit der Gelehrten — ein Wort, das dir in jedem Fiqh-Buch begegnet. Das eingeschobene ـتَـ erkennst du in beiden.'
  ],

  /* أُورُوبَّا - Europa */
  '45946': [
    '⚠️ Achtung, dieser Ländername endet ANDERS als die übrigen: أَلْمَانِيَا, سُورِيَا und آسِيَا (Kapitel 21) enden auf ـِيَا, أُورُوبَّا dagegen auf ـَّا mit Šadda. Genau da schreibt man sich falsch.',
    'أَلْمَانِيَا aus Kapitel 8 liegt in أُورُوبَّا — Land und Erdteil in einem Satz. Wenn du die beiden zusammen sprichst, hängt der neue Name am alten.'
  ],

  /* يُوغُوسْلَافِيَا - Jugoslawien */
  '45947': [
    'Das غ ist hier der Schlüssel: das Arabische hat kein g, und für ein fremdes g steht meist غ ein — wie in غَانَا. Wer das weiß, liest jeden fremden Namen mit غ richtig.',
    'Ein Land, das es nicht mehr gibt — das Lehrbuch ist an dieser Stelle älter als die Landkarte. Merk es dir als das lange Wort mit den drei Häppchen يُو-غُوسْ-لَافِيَا; die Bedeutung musst du nur einmal einordnen.'
  ],

  /* ثَمَنٌ - Preis */
  '45948': [
    'Aus derselben Wurzel kommt ثَمِينٌ, „wertvoll" — was einen Preis hat, ist etwas wert. Über diesen Bogen hängt der Preis an einer Bedeutung statt an einem Klang.',
    'Häng ihn an Kapitel 17: ein ثَمَن ist entweder رَخِيصٌ (billig) oder غَالٍ (teuer). Drei Wörter, ein Satz — und du hast den ganzen Einkauf beisammen.'
  ],

  /* نِصْفٌ - Hälfte */
  '45949': [
    '⭐ Ein bekannter Hadith trägt das Wort: مَنْ تَزَوَّجَ — „Wer heiratet“ — فَقَدِ اسْتَكْمَلَ نِصْفَ الدِّينِ — „hat die Hälfte der Religion vervollständigt". Darin steckt auch زَوْج aus Kapitel 13.',
    'Und im Gebet begegnet dir die Hälfte praktisch: der Reisende betet statt vier nur zwei رَكَعَات — die Hälfte. Das ist die رُخْصَة, die Erleichterung, die du bei رَخِيصٌ in Kapitel 17 kennengelernt hast.'
  ],

  /* قِرْشٌ - Geldeinheit */
  '45950': [
    '⚠️ Dasselbe Wort, ganz andere Welt: قِرْشٌ heißt im heutigen Arabisch auch „Hai". Wer den Fisch dazudenkt, vergisst die Münze nicht mehr — und stutzt später nicht, wenn sie im Meer auftaucht.',
    'Die Größenordnung merkt man sich am besten praktisch: hundert قُرُوش machen ein جُنَيْه oder einen رِيَال. Der قِرْش ist also das Kleingeld, nicht der Schein.'
  ],

  /* رَاكِبٌ - Passagier */
  '45951': [
    '⚠️ Ein Buchstabe trennt zwei Wörter aus benachbarten Kapiteln: رَكْعَةٌ (Gebetseinheit, Kapitel 18) hat ع am Ende, رَاكِبٌ (Passagier) hat ب. Sprich beide laut, dann trennst du sie dauerhaft.',
    'Aus derselben Wurzel ر ك ب kommt الرُّكُوبُ, das Auf- und Mitfahren, und مَرْكَبَةٌ, das Fahrzeug. Der رَاكِب ist der, der aufsitzt — ob auf dem جَمَلٌ aus Kapitel 1 oder im Bus.'
  ],

  /* سُؤَالٌ - Frage */
  '45952': [
    '⭐ Dieselbe Wurzel س أ ل steht in aḍ-Ḍuḥā, die du auswendig kannst: وَأَمَّا السَّائِلَ فَلَا تَنْهَرْ — „und was den Bittenden angeht, so fahre ihn nicht an" (93:10). Der السَّائِل ist der Fragende und Bittende.',
    'Das Gegenstück heißt جَوَابٌ (Antwort) und steht in Bayna Yadayk 1. سُؤَال und جَوَاب gehören auf dieselbe Karte — im Unterricht kommen sie ohnehin immer zu zweit.'
  ],

  /* ══════ Kapitel 20 ══════ */

  /* كَلِمَةٌ - Wort */
  '45953': [
    '⭐ Der stärkste Anker überhaupt: كَلِمَةُ التَّوْحِيدِ — „das Wort des Tauḥīd", also لَا إِلَٰهَ إِلَّا اللهُ. Ein Satz, den du täglich sprichst, und das Wort für „Wort" steht davor.',
    'Die Wurzel ك ل م trägt eine ganze Familie: تَكَلَّمَ (sprechen), كَلَامٌ (Rede) — und عِلْمُ الْكَلَامِ, die islamische Theologie. Alle vier meinen dasselbe Grundbild: das gesprochene Wort.'
  ],

  /* حَرْفٌ - Buchstabe */
  '45954': [
    '⭐⭐ Das Wort ist einer der drei Grundbegriffe deiner Grammatik: أَقْسَامُ الْكَلِمَةِ sind اِسْمٌ, فِعْلٌ und حَرْفٌ. Im Buchstabensinn ist ein حَرْف ein Zeichen, im Grammatiksinn das Partikelwort — dieselbe Vokabel in zwei Rollen.',
    '⭐ Und du kennst sie aus dem Koran: die الْحُرُوفُ الْمُقَطَّعَةُ, die einzeln gesprochenen Buchstaben am Anfang mancher Suren — الم, يس, ق. Dort steht der Plural حُرُوف.'
  ],

  /* دَرْسٌ - Unterricht; Lektion */
  '45955': [
    '⭐ Dein Lehrbuch trägt das Wort im Titel: دُرُوسُ اللُّغَةِ الْعَرَبِيَّةِ — „Lektionen der arabischen Sprache". Das ist der Plural von دَرْس, und er steht auf dem Umschlag, den du jeden Tag ansiehst.',
    'Vier Wörter aus einer Wurzel د ر س: دَرْسٌ (Lektion), مُدَرِّسٌ (Lehrer, Kapitel 1), مَدْرَسَةٌ (Schule, Kapitel 4) und دِرَاسَةٌ (das Studium). Sprich sie hintereinander, dann hörst du den gemeinsamen Kern.'
  ],

  /* ══════ Kapitel 21 ══════ */

  /* وَاسِعٌ - geräumig */
  '45956': [
    '⭐ الْوَاسِعُ ist einer der schönen Namen — meist zusammen mit dem nächsten gesprochen: وَاسِعٌ عَلِيمٌ, „allumfassend und allwissend". Was وَاسِع ist, umfasst viel.',
    '⚠️ Ein Buchstabe trennt es von einem Wort aus Kapitel 12: و س ع ist weit, و س ط ist mittig — وَاسِعٌ gegen مُتَوَسِّطٌ. Das ع gegen das ط, sonst nichts.'
  ],

  /* آسِيَا - Asien */
  '45957': [
    '⭐ Das آ am Anfang ist ein langes A mit Madda — dasselbe Zeichen, das du in الْقُرْآن jeden Tag siehst. Wenn du es dort erkennst, erkennst du es auch hier.',
    'Zwei Länder deiner Liste liegen in آسِيَا: إِنْدُونِيسِيَا aus Kapitel 9 und مَالِيزِيَا aus Kapitel 11. Der Erdteil sammelt ein, was du schon einzeln kennst.'
  ],

  /* ══════ Kapitel 22 ══════ */

  /* أَحْمَرُ - rot */
  '45958': [
    '⭐ Ein Meer trägt die Farbe im Namen: الْبَحْرُ الْأَحْمَرُ, das Rote Meer, an dessen Ufer جُدَّة aus diesem Kapitel liegt. Und بَحْر hast du aus Kapitel 16.',
    'Die weibliche Form geht bei allen Farben gleich: حَمْرَاءُ, بَيْضَاءُ, سَوْدَاءُ, خَضْرَاءُ — Muster فَعْلَاءُ, und wie die männliche Form ohne Tanwīn. Lern das Paar أَحْمَرُ / حَمْرَاءُ, dann hast du die Regel für alle sechs.'
  ],

  /* أَزْرَقُ - blau */
  '45959': [
    '⭐ Zwei Flüsse treffen sich in Khartum und tragen zwei deiner Farben: النِّيلُ الْأَزْرَقُ und النِّيلُ الْأَبْيَضُ, der Blaue und der Weiße Nil. Dazu نَهْر aus Kapitel 16 — drei Vokabeln in einem Bild.',
    'Weibliche Form زَرْقَاءُ, Plural زُرْقٌ. ⚠️ Achte auf das ق am Ende, nicht ك: زُرْقَة ist das Blau, und der Buchstabe bleibt in allen Formen erhalten.'
  ],

  /* أَخْضَرُ - grün */
  '45960': [
    '⭐ Ein Name aus einer Geschichte, die du kennst: الْخَضِرُ — der Gefährte von Mūsā ﷺ, den er مَجْمَعَ الْبَحْرَيْنِ traf. Sein Name heißt „der Grüne". Dieselbe Wurzel خ ض ر.',
    'Grün ist die حَدِيقَةٌ aus Kapitel 14 und das حَقْلٌ aus Kapitel 13. ⚠️ Und achte auf den zweiten Buchstaben: أَخْضَرُ hat خ, أَحْمَرُ hat ح — im Schriftbild trennt sie nur der Punkt.'
  ],

  /* أَسْوَدُ - schwarz */
  '45961': [
    '⭐ Aus der Abschiedspredigt, in der beide Farben nebeneinander stehen: وَلَا لِأَبْيَضَ عَلَىٰ أَسْوَدَ — „und kein Weißer über einen Schwarzen“ — إِلَّا بِالتَّقْوَىٰ — „außer durch Gottesfurcht". Ein Satz, zwei Vokabeln.',
    'Weibliche Form سَوْدَاءُ, Plural سُودٌ. ⚠️ Das و in der Mitte ist stumm — gesprochen as-wad, nicht as-uu-wad. Genau wie bei أَبْيَضُ das ي: ab-yaḍ.'
  ],

  /* أَصْفَرُ - gelb */
  '45962': [
    '⭐ Die gelbe Kuh aus Sūrat al-Baqara heißt بَقَرَةٌ صَفْرَاءُ — die Geschichte, nach der die ganze Sure benannt ist. Dort steht die weibliche Form dieser Farbe.',
    '⚠️ Dieselben drei Buchstaben ص ف ر tragen صِفْرٌ, die Null — und genau dieses arabische Wort wurde im Deutschen zur „Ziffer". Ein Wort, das du längst benutzt, ohne es zu wissen.'
  ],

  /* أَبْيَضُ - weiß */
  '45963': [
    '⭐ Aus Kapitel 12 kennst du schon einen langen Ausdruck damit: الْبَحْرُ الْأَبْيَضُ الْمُتَوَسِّطُ, das Mittelmeer — wörtlich „das weiße mittlere Meer". Die Farbe stand dort, bevor sie Vokabel wurde.',
    '⭐ Und ein Zeichen von Mūsā ﷺ heißt يَدٌ بَيْضَاءُ, „eine weiße Hand" — seine Hand, die leuchtend weiß hervorkam. Dort steht die weibliche Form بَيْضَاءُ.'
  ],

  /* بَغْدَادُ - Bagdad */
  '45964': [
    '⭐ Ihr alter Beiname war دَارُ السَّلَامِ, „Haus des Friedens", und dort stand بَيْتُ الْحِكْمَةِ, das Haus der Weisheit — die Übersetzerakademie der عَبَّاسِيُّون. Die Stadt hängt an einer Geschichte, nicht an einem Klang.',
    '⚠️ Kein Tanwīn, Endung schlicht ـُ. Das gilt für fast alle fremden Orts- und Ländernamen: بَغْدَادُ und جُدَّةُ hier, إِسْطَنْبُولُ und وَاشِنْطُنُ in Kapitel 23. Wer da ein Tanwīn setzt, verrät sich sofort.'
  ],

  /* جُدَّةُ - Jeddah */
  '45965': [
    '⭐ Die Hafenstadt, über die die Pilger nach Mekka kommen — und sie liegt am الْبَحْر الْأَحْمَر, der Farbe aus diesem Kapitel. Wer an den Weg zum حَجّ denkt, hat die Stadt.',
    '⚠️ Drei Wörter aus denselben Buchstaben ج د د, nur die Vokale trennen sie: جُدَّةُ (die Stadt), جَدِيدٌ (neu, Kapitel 3) und جَدٌّ (Großvater). Dazu جِدًّا, „sehr", das dir in Kapitel 24 begegnet. Sprich sie hintereinander.'
  ],

  /* فِنْجَانٌ - Teetasse */
  '45966': [
    'Der Plural فَنَاجِينُ folgt genau dem Bau von فَنَادِقُ (Kapitel 16) und دَسَاتِيرُ (Kapitel 14): vier Wurzelbuchstaben, langer Vokal vor dem Ende, kein Tanwīn. Drei Lehnwörter, ein Pluralmuster.',
    'Der Unterschied zu كُوبٌ aus Kapitel 9 ist die Größe und der Inhalt: der كُوب ist der Becher, der فِنْجَان die kleine Tasse für قَهْوَةٌ und شَايٌ — beide aus Kapitel 6.'
  ],

  /* دَقِيقَةٌ - Minute */
  '45967': [
    '⚠️ Dasselbe Wort heißt auch „fein" und, als دَقِيق, sogar „Mehl" — das feine Gemahlene. Die Minute ist die feine Unterteilung der Stunde; ein Bild trägt beide Bedeutungen.',
    'Bau die Leiter mit den Wörtern, die du hast: دَقِيقَةٌ (Minute) → سَاعَةٌ (Stunde, Bayna Yadayk 1) → يَوْمٌ (Tag) → أُسْبُوعٌ (Woche, Kapitel 15) → سَنَةٌ (Jahr, Kapitel 18). Fünf Stufen, eine Reihe.'
  ],

  /* قَالَ - sagen */
  '45968': [
    '⭐⭐ Drei Suren aus deinem auswendigen Bereich fangen mit dem Befehl dieses Verbs an: قُلْ هُوَ اللَّهُ أَحَدٌ (112:1), قُلْ يَا أَيُّهَا الْكَافِرُونَ (109:1) und قُلْ أَعُوذُ بِرَبِّ النَّاسِ (114:1). Du sprichst قُلْ jeden Tag mehrfach.',
    '⚠️ Ein hohles Verb: die Wurzel ق و ل hat ein و in der Mitte, das im Wort verschwindet. قَالَ ist „er sagte", aber قُلْتُ ist „ich sagte" — das lange ـَا fällt weg, sobald eine Endung mit Sukūn folgt.'
  ],

  /* ══════ Kapitel 23 ══════ */

  /* إِسْطَنْبُولُ - Istanbul */
  '45969': [
    '⭐ Ihr früherer Name war الْقُسْطَنْطِينِيَّةُ, Konstantinopel — die Stadt, deren Eroberung in einem bekannten Hadith angekündigt wurde: لَتُفْتَحَنَّ الْقُسْطَنْطِينِيَّةُ. Damit hängt der Name an einem Ereignis.',
    '⚠️ Das ط, nicht ت — dieselbe Falle wie bei وَاشِنْطُنُ im selben Kapitel und bei أَرِسْطُو (Aristoteles). Ein fremdes hartes t wird im Arabischen regelmäßig zum ط.'
  ],

  /* وَاشِنْطُنُ - Washington */
  '45970': [
    'Zwei fremde Laute auf einmal: das anlautende و steht für ein W, das das Arabische sonst nicht kennt, und das ط für das harte t. Wer beide Regeln hat, schreibt jeden fremden Namen sicherer.',
    'Merk es als Paar mit إِسْطَنْبُولُ aus demselben Kapitel: beide tragen ط, beide enden ohne Tanwīn auf ـُ. Zwei Städte, eine Schreibregel.'
  ],

  /* الطَّائِفُ - Taif */
  '45971': [
    '⭐ Die Stadt aus der Sīra: dorthin ging der Prophet ﷺ, als Mekka sich verschloss, und wurde abgewiesen — dort sprach er das Bittgebet, das viele auswendig kennen. Der Name hängt an einem Ereignis, nicht an einem Klang.',
    'الطَّائِف ist ein Partizip: „der Umherziehende", von der Wurzel ط و ف — dieselbe wie im طَوَاف um die كَعْبَةٌ aus Kapitel 5. Und الطَّائِفَةُ, die Gruppe, gehört ebenfalls dazu.'
  ],

  /* --- Die fuenf Besitzendungen, je zwei weitere Wege (19.08.2026) --- */
  /* ـِي - die Besitzendung „mein“ — 1. Person */
  'gram-suffix-i': [
    'Im Koran hörst du sie am Ende von al-Kāfirūn: لَكُمْ دِينُكُمْ وَلِيَ دِينِ (109:6). ⭐ Und dort siehst du zugleich, was dein Lehrer über den Sprachgebrauch sagt: beim letzten Wort ist das Yāʾ weggelassen, geblieben ist nur die Kasra. Genau das meint er mit „sie behalten nur die Kasra“.',
    'Die Endung ist keine neue Grammatik: كِتَابِي ist eine إِضَافَة in einem einzigen Wort — das Nomen ist مُضَاف, die Endung ist مُضَاف إِلَيْهِ. Du kennst das aus Kapitel 5, hier steht es nur zusammengeschrieben.'
  ],

  /* ـكَ - die Besitzendung „dein“ — zu einem Mann */
  'gram-suffix-ka': [
    'Im Koran gleich im ersten Vers von aš-Šarḥ: أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ (94:1) — „deine Brust“. Dieselbe Endung an einem Nomen; du sprichst sie im Gebet, ohne darüber nachzudenken.',
    'Merke sie zusammen mit ihrer Ausnahme: normalerweise hängt sie direkt an, aber bei „Vater“ und „Bruder“ schiebt sich erst ein Wāw dazwischen — Seite 65 fragt أَبُوكَ „dein Vater“, nicht die erwartete Form ohne Wāw.'
  ],

  /* ـكِ - die Besitzendung „dein“ — zu einer Frau */
  'gram-suffix-ki': [
    'Hier steht bewusst KEIN Vers: In dem Bereich, den du auswendig kannst, kommt diese Endung nicht vor. Nimm stattdessen das Paar aus dem Buch — dieselbe Frage einmal an einen Mann, einmal an eine Frau, und nur der Vokal am Ende unterscheidet sie.',
    'Ein Zeichen, das man beim Schreiben leicht weglässt, entscheidet hier über die Bedeutung. Wer اسْمُكِ ohne die Kasra schreibt, hat aus der Frau einen Mann gemacht — gerade diese Endung ist ein Grund, das Taschīl mitzuschreiben.'
  ],

  /* ـهُ - die Besitzendung „sein“ */
  'gram-suffix-hu': [
    'Im Koran in al-Qāriʿah: فَأَمَّا مَن ثَقُلَتْ مَوَٰزِينُهُۥ (101:6) — „seine Waagschalen“. Die Endung hängt am Nomen und sagt „ihm gehörend“; du sprichst sie, ohne darüber nachzudenken.',
    '⚠️ Eine Falle, die du auf Seite 61 selbst schon gelesen hast: nach einer Kasra wird aus ـهُ ein هِ. Deshalb heißt es dort فِيهِ und nicht die Form mit Ḍamma. Der Vokal davor zieht den Vokal danach zu sich.'
  ],

  /* ـهَا - die Besitzendung „ihr“ */
  'gram-suffix-ha': [
    'Im Koran in az-Zalzalah: وَأَخْرَجَتِ ٱلْأَرْضُ أَثْقَالَهَا (99:2) — „ihre Lasten“. Die Erde ist im Arabischen weiblich, deshalb ـهَا.',
    'Sie ist die einzige der fünf, die zwei Buchstaben lang ist — und die einzige, die sich nach einer Kasra NICHT ändert. Auf Seite 61 steht فِيهَا „in ihr“ mit Kasra davor, und das Alif bleibt stehen.'
  ],
  /* ------------------------------------------------------------------------
     KAPITEL 24 - EINZELN FREIGESCHALTET (20.08.2026)

     Elias schaltet seit dem 20.08. einzelne Woerter aus spaeteren Kapiteln
     frei, ohne das Kapitel zu oeffnen. Gemessen an dem Tag: alle 67 Woerter
     aus Kapitel 24 hatten genau EINEN Vorschlag. Hier kommen die zwei
     weiteren fuer die sieben, die er namentlich genannt hat.

     ⛔ Die Koranstellen stammen ausschliesslich aus dem, was er auswendig
     kann - Faatiha, al-Mulk und die Suren 93-114. Jede Stelle ist gegen
     quran-text.js geprueft; أَنْتَ und نَعْت kommen dort nicht vor und
     bekommen deshalb keinen Koranbezug, sondern eine Bruecke zum Stoff.
     ------------------------------------------------------------------------ */

  /* أَنَا - ich (madina-1, Kapitel 24) */
  '50154': [
    'Aus al-Kāfirūn, die du auswendig kannst: وَلَا أَنَا عَابِدٌ — „und ich bin kein Diener“ — مَا عَبَدْتُمْ, „dessen, dem ihr dient“ (109:4). Dasselbe أَنَا wie in أَنَا مُدَرِّسٌ, nur mit einer gewichtigeren Aussage dahinter. ⚠️ Im Muṣḥaf steht dort ein kleines Alif über dem Wort — gesprochen wird es kurz, geschrieben lang.',
    'Und in al-Mulk: وَإِنَّمَا أَنَا نَذِيرٌ مُبِينٌ — „ich bin nur ein deutlicher Warner" (67:26). Merk dir die Bauform: أَنَا + ein Nomen, fertig ist der Satz. Genau so baust du أَنَا مُدَرِّسٌ — im Arabischen steht zwischen beiden kein „bin".'
  ],

  /* نَحْنُ - wir (madina-1, Kapitel 24) */
  '50155': [
    'Das ن am Anfang ist das Zeichen für „wir" in der ganzen Sprache — نَحْنُ trägt es, und jedes Verb, das „wir" tut, beginnt ebenfalls damit. Wer das ن hört, weiß: es geht um mehrere, und ich bin dabei.',
    'Häng es an deinen Satz: نَحْنُ فِي الْمَسْجِدِ. Beachte, dass kein „sind" dasteht — im Arabischen genügen zwei Teile, das Pronomen und der Ort. ⚠️ فِي zieht den Genitiv nach sich, deshalb الْمَسْجِدِ mit Kasra und nicht الْمَسْجِدُ.'
  ],

  /* أَنْتَ - du, m. (madina-1, Kapitel 24) */
  '50156': [
    '⭐ Die Brücke zu dem, was du gerade gelernt hast: أَنْتَ und أَنْتِ aus Kapitel 12 sind bis auf den letzten Vokal dasselbe Wort. Fatḥa ـتَ heißt „du" zu einem Mann, Kasra ـتِ zu einer Frau. Ein einziges Zeichen trennt die beiden, und es steht ganz am Ende.',
    'Dein Satz zeigt gleich zwei Dinge auf einmal: أَنْتَ طَالِبٌ جَدِيدٌ. Das جَدِيدٌ hängt an طَالِبٌ und folgt ihm in Unbestimmtheit, Kasus und Geschlecht — das ist das نَعْت, das dein Lehrer meint.'
  ],

  /* هُوَ - er (madina-1, Kapitel 24) */
  '50157': [
    '⭐ Das kennst du längst auswendig: قُلْ هُوَ اللَّهُ أَحَدٌ — „Sag: Er ist Allah, ein Einziger" (112:1). Der erste Vers von al-Ikhlāṣ ist zugleich das klarste Beispiel für هُوَ am Satzanfang.',
    'In al-Mulk gleich mehrfach: قُلْ هُوَ الَّذِي أَنْشَأَكُمْ — „Sag: Er ist es, der euch erschaffen hat" (67:23). Immer dieselbe Stelle im Satz: هُوَ steht vorn und wird danach näher bestimmt. Genau so in هُوَ طَبِيبٌ.'
  ],

  /* هِيَ - sie, Sg. (madina-1, Kapitel 24) */
  '50158': [
    '⭐ Aus al-Qadr, die du auswendig kannst: سَلَامٌ هِيَ — „Frieden ist sie“ — حَتَّى مَطْلَعِ الْفَجْرِ, „bis zum Anbruch der Morgenröte“ (97:5). Das هِيَ meint dort die Nacht, لَيْلَة — ein weibliches Wort, deshalb هِيَ und nicht هُوَ.',
    'Dein Satz macht es sichtbar: هِيَ مُدَرِّسَةٌ. Die تاء مربوطة am Ende zeigt dasselbe an wie das هِيَ davor — beides weiblich. ⚠️ Bei هُوَ مُدَرِّسٌ fällt beides zusammen weg. Das Geschlecht steht nie nur an einer Stelle.'
  ],

  /* هُمْ - sie, Pl. m. (madina-1, Kapitel 24) */
  '50159': [
    '⭐ Aus al-Māʿūn, die du auswendig kannst: الَّذِينَ هُمْ — „die, welche“ — عَنْ صَلَاتِهِمْ سَاهُونَ, „ihr Gebet vernachlässigen“ (107:5). Dort steht هُمْ für eine Gruppe von Menschen, genau wie in deinem Satz.',
    'In al-Bayyina steht es zweimal dicht beieinander: أُولَٰئِكَ هُمْ شَرُّ الْبَرِيَّةِ (98:6) und أُولَٰئِكَ هُمْ خَيْرُ الْبَرِيَّةِ (98:7) — dieselbe Bauform, das Gegenteil an Aussage. ⚠️ Merk dir das ـمْ mit Sukūn am Ende: es ist stumm, aber es ist da.'
  ],

  /* نَعْتٌ - Attribut / Adjektiv (madina-1, Kapitel 24) */
  '50428': [
    'Der Begriff steht in deinem eigenen Satz drin: الْجَدِيدُ نَعْتٌ لِلْكِتَابِ — „‚Neu‘ ist ein Attribut zum Buch." ⚠️ لِ und der Artikel اَلْ verschmelzen zu لِلْـ: das Alif fällt weg, das Lām bleibt doppelt stehen.',
    'Die vier Bedingungen, die dein Lehrer nennt, kannst du an einem Beispiel abzählen: بَيْتٌ كَبِيرٌ. Beide unbestimmt, beide Nominativ, beide männlich, beide Einzahl — stimmt eines nicht, ist es kein نَعْت mehr, sondern ein eigener Satz.'
  ],

  /* ---------- Elias' selbst angelegte Funktionswörter (20.08.2026) ----------

     ⛔ Bis heute stand im Kopf von data/eselsbruecken.js, für diese neun wäre
     eine Eselsbrücke „gestellt“ — sie seien Grundwortschatz und lernten sich
     über den Gebrauch. Elias hat das am 20.08. verworfen: „ich brauche für
     absolut jedes wort drei eselsbrücken.“

     ⭐ Die Quranbelege sind AUSGEZÄHLT, nicht erinnert: ein Skript hat Sure 1,
     67 und 93–114 — also nur, was er auswendig kann — nach dem entvokalisierten
     Wort durchsucht. Vier der neun haben dort einen Beleg (لِمَنْ 98:8,
     لَكَ 93:4+94:1, بَعْدَ 95:7+98:4, كَيْفَ 67:17+105:1, عِنْدَ 67:26+98:8);
     فِيهِ, أَمَامَ und حَال kommen dort NICHT vor und knüpfen deshalb an den
     Unterricht und an seine eigenen Sätze an. [[quranbezug_nur_auswendiges]] */

  /* لِمَن - (für) wem/wen (selbst angelegt) */
  'p_1787184718572': [
    'Du sprichst es in al-Bayyinah: ذَٰلِكَ لِمَنْ خَشِيَ رَبَّهُ — „das ist für jemanden, der seinen Herrn fürchtet" (98:8, letzter Vers). Dasselbe لِمَنْ, dieselbe Bedeutung „für wen".',
    '⚠️ Merk dir die Endung mit: لِمَنْ hat ein Sukūn. Trifft es auf die Hamzat al-waṣl von الْ, wird daraus ein Kasra — لِمَنِ الْكِتَابُ؟, nicht لِمَنْ الْكِتَابُ. Das ist dieselbe Regel wie bei مِنَ الْبَيْتِ, die du aus Folge 5 kennst.'
  ],

  /* لَكَ - für dich (m.) (selbst angelegt) */
  'p_1787185309933': [
    'لِ + كَ, und beide Teile hast du: لِ ist der Ḥarf ǧarr des Besitzes (Folge 9), كَ die Besitzendung „dein" für einen Mann (Folge 15). ⭐ Das لِ wechselt dabei von Kasra zu Fatḥa — لَكَ, nicht لِكَ. Vor einem angehängten Pronomen ist das immer so.',
    'Und ein zweiter Vers aus deinem Bereich: خَيْرٌ لَّكَ مِنَ الْأُولَىٰ — „Und das Jenseits ist wahrlich besser für dich als das Diesseits" (93:4, aḍ-Ḍuḥā).'
  ],

  /* لَكِ - für dich (w.) (selbst angelegt) */
  'p_1787185328882': [
    'Merk das Paar zusammen, dann hast du zwei Wörter für einen Preis. Eselsbrücke für die Richtung: das **i** in Kasra passt zum **i** in „sie" — لَكِ geht an eine Frau.',
    '⚠️ Ohne Taschkīl sehen لَكَ und لَكِ gleich aus (لك). Genau davor warnt deine Regel taschkil-kontext-01 aus Folge 9: das Vokalzeichen ist hier nicht Zierrat, sondern der ganze Unterschied.'
  ],

  /* بَعْدَ - nach / danach (selbst angelegt) */
  'p_1787188396011': [
    'Du sprichst es in al-Bayyinah: مِنْ بَعْدِ مَا جَاءَتْهُمُ — „nachdem der klare Beweis zu ihnen gekommen ist" (98:4). Dort steht بَعْدِ mit Kasra, weil مِنْ davorsteht — dieselbe Ḥarf-ǧarr-Regel wie überall.',
    'Und in at-Tīn, vorletzter Vers: فَمَا يُكَذِّبُكَ بَعْدُ بِالدِّينِ (95:7). ⚠️ Hier steht بَعْدُ mit Ḍamma — weil kein Wort folgt, auf das es zeigt. Mit folgendem Wort: Fatḥa. Ohne: Ḍamma.'
  ],

  /* كَيْفَ - wie (selbst angelegt) */
  'p_1787189022107': [
    'Ein zweites Mal in al-Mulk, die du ebenfalls kannst: فَسَتَعْلَمُونَ كَيْفَ نَذِيرِ — „Dann werdet ihr erfahren, WIE Meine Warnung ist" (67:17).',
    'Der Alltagssatz, der es festnagelt: كَيْفَ حَالُكَ؟ — „Wie geht es dir?", wörtlich „wie ist dein Zustand?". Damit hast du كَيْفَ und حَال in einem Satz.'
  ],

  /* حَالُكْ - dein Zustand (selbst angelegt) */
  'p_1787189076593': [
    'Es kommt fast nur mit كَيْفَ vor: كَيْفَ حَالُكَ؟ — „Wie geht es dir?" Lern die beiden als ein Stück, dann hast du eine ganze Begrüßung statt zwei loser Vokabeln.',
    '⚠️ Deine Karte trägt die Pausalform حَالُكْ mit Sukūn — so sagt man es, wenn man danach aufhört zu sprechen. Im Satz steht حَالُكَ mit Fatḥa. Dasselbe Wort, zwei Sprechlagen; die Karte zeigt die eine, dein Beispielsatz die andere.'
  ],

  /* أَمَامَ - vor / davor (selbst angelegt) */
  'p_1787189287368': [
    'أَمَامَ und خَلْفَ sind ein Gegensatzpaar: davor und dahinter. Der Satz deines Lehrers hat beide: „Die Tafel ist أَمَامَ dem Studenten und sie ist خَلْفَ dem Lehrer."',
    '⚠️ Es endet IMMER auf Fatḥa — أَمَامَ, nie أَمَامُ. Das Ẓarf ist selbst manṣūb, und das Wort danach steht im Genitiv: أَمَامَ الطَّالِبِ. Zwei Endungen in einem Ausdruck, beide fest.'
  ],

  /* فِيهِ - darin / in ihm (selbst angelegt) */
  'p_1787189488747': [
    'Dein eigener Satz zeigt es im Gebrauch: الْبَيْتُ كَبِيرٌ، وَفِيهِ غُرْفَةٌ — „Das Haus ist groß, und darin ist ein Zimmer." ⭐ Beachte den Bau: der Ǧārr wa maǧrūr steht vorn, das Mubtadaʾ غُرْفَةٌ folgt.',
    'فِي ist der allererste Ḥarf ǧarr, den du gelernt hast (Folge 4, zusammen mit عَلَى). Alles, was du über فِي weißt, gilt auch hier — nur dass statt eines Nomens ein angehängtes Pronomen folgt.'
  ],

  /* عِنْدَ - bei (selbst angelegt) */
  'p_1787190874749': [
    'Und in al-Bayyinah, letzter Vers: جَزَاؤُهُمْ عِنْدَ رَبِّهِمْ — „Ihr Lohn BEI ihrem Herrn sind die Gärten Edens" (98:8).',
    '⭐ Der Unterschied zu لِ, den dein Lehrer in Folge 15 ausdrücklich „eine wichtige Regel" nennt: لِ ist für Untrennbares (dein Bruder, dein Name), عِنْدَ für Trennbares (das Buch, das gerade bei dir liegt). Beide heißen auf Deutsch „ich habe" — austauschbar sind sie nicht.'
  ],

  'gram-pron-huwa': [
    'لَا إِلَهَ إِلَّا هُوَ — die Wendung, die du am häufigsten von allen hörst. Dasselbe هُوَ, und es steht dort für Allah: „Es gibt keinen Gott außer Ihm.“ Wer diesen Satz kann, kann das Wort.',
    'هُوَ ist die Form, in der ein Verb im Wörterbuch steht. Wenn du ذَهَبَ nachschlägst, findest du wörtlich „er ging“ — nicht „gehen“. Deshalb ist هُوَ ذَهَبَ der Ausgangspunkt: von hier aus baust du alle dreizehn anderen, indem du hinten etwas anhängst.'
  ],

  'gram-pron-huma-m': [
    'Den Dual erkennst du am Alif — und du benutzt ihn längst: رَكْعَتَانِ, zwei Rakʿas. Genau dieses ـَانِ macht aus einer zwei. Bei هُمَا steckt das Alif am Ende des Pronomens, und dasselbe Alif hängst du ans Verb: ذَهَبَا.',
    'Zwei sind nie „Plural“ im Arabischen: هُمَا ist genau zwei, هُمْ ist ab drei. Im Deutschen gibt es dafür kein eigenes Wort, deshalb muss man es sich als eigene Stufe merken — Singular, Dual, Plural. Dein Lehrer sagt jedes Mal die drei in dieser Reihenfolge auf.'
  ],

  'gram-pron-hum': [
    'أُولَئِكَ هُمْ خَيْرُ الْبَرِيَّةِ — aus سُورَةُ الْبَيِّنَةِ (98:7), die du auswendig kannst. Auch dort steht هُمْ als eigenes Wort mitten im Satz.',
    'Das م ist im Arabischen durchgängig das Zeichen des männlichen Plurals, und du sprichst es täglich in der Fātiḥa: أَنْعَمْتَ عَلَيْهِمْ — „denen Du Gunst erwiesen hast“. Dasselbe مْ steckt in هُمْ, in أَنْتُمْ und in عَلَيْكُمْ.'
  ],

  'gram-pron-hiya': [
    'Warum ist es in سُورَةُ الْقَدْرِ weiblich? Weil der Vers von لَيْلَة spricht, der Nacht — und لَيْلَة trägt die تَاء مَرْبُوطَة, ist also weiblich. هِيَ bezieht sich immer auf ein weibliches Wort, auch wenn es kein Mensch ist.',
    'هُوَ und هِيَ unterscheiden sich in einem Buchstaben: و für ihn, ي für sie. Genauso beim Verb — ذَهَبَ ohne alles für ihn, ذَهَبَتْ mit dem تْ für sie. Ein Zeichen macht den Unterschied, auf beiden Seiten.'
  ],

  'gram-pron-hunna': [
    'م für die Männer, ن für die Frauen — diese eine Regel trägt vier Wörter auf einmal: هُمْ und هُنَّ, أَنْتُمْ und أَنْتُنَّ. Wenn du dir merkst, dass das ن weiblich ist, hast du die Hälfte der Tabelle.',
    'Das ن bleibt nicht im Pronomen stehen, es wandert ins Verb: هُنَّ ذَهَبْنَ. Achte auf die Schadda — sie steht im Pronomen (هُنَّ), aber nicht in der Verbendung (ذَهَبْنَ).'
  ],

  'gram-pron-anta': [
    'اللَّهُمَّ أَنْتَ السَّلَامُ — das sprichst du nach jedem Gebet. Genau dieses أَنْتَ, und es ist die Anrede an Allah: „O Allah, Du bist der Friede.“ Wer das Gebet beendet, hat das Wort schon gesagt.',
    'أَنْتَ und أَنْتِ trennt ein einziges Zeichen: die Fatḥa oben spricht einen Mann an, die Kasra unten eine Frau. Und dasselbe Zeichen entscheidet beim Verb — ذَهَبْتَ gegen ذَهَبْتِ.'
  ],

  'gram-pron-antuma': [
    'أَنْتُمَا ist أَنْتُمْ mit dem Dual-Alif am Ende — dasselbe Alif wie bei هُمَا und bei رَكْعَتَانِ. Wo ein Alif hinten steht, sind genau zwei gemeint.',
    'Das ist die einzige Stelle der ganzen Tabelle, an der du nichts Zusätzliches lernen musst: أَنْتُمَا ذَهَبْتُمَا gilt für zwei Männer und für zwei Frauen. Vierzehn Pronomen, aber nur dreizehn verschiedene Verbformen — hier fällt eine weg.'
  ],

  'gram-pron-antum': [
    'السَّلَامُ عَلَيْكُمْ — du sagst es jeden Tag. Das كُمْ darin ist dasselbe مْ wie in أَنْتُمْ: die Anrede an mehrere Männer. Wer grüßen kann, hat die Endung schon im Ohr.',
    'لَكُمْ دِينُكُمْ — der letzte Vers von سُورَةُ الْكَافِرُونَ (109:6), die du auswendig kannst. Zweimal dasselbe كُمْ in vier Wörtern: „Euch eure Religion.“'
  ],

  'gram-pron-anti': [
    'Die Kasra ist im Arabischen das weibliche Zeichen der Anrede, und du kennst sie schon von der Besitzendung: اسْمُكِ heißt „dein Name“ zu einer Frau gesagt, اسْمُكَ zu einem Mann. Dasselbe Paar findest du bei أَنْتِ und أَنْتَ wieder.',
    'Bei أَنْتِ ذَهَبْتِ steht die Kasra zweimal — einmal am Pronomen, einmal am Verb. Das ist kein Zufall: die zweite Person nimmt ihre Endung direkt mit, und bei ihr ist es eben die Kasra.'
  ],

  'gram-pron-antunna': [
    'Stell die vier Anredeformen nebeneinander, dann siehst du das System: أَنْتَ ein Mann, أَنْتِ eine Frau, أَنْتُمْ mehrere Männer, أَنْتُنَّ mehrere Frauen. Das م ist männlich, das ن weiblich — genau wie bei هُمْ und هُنَّ.',
    'Die Schadda auf dem ن hat أَنْتُنَّ mit هُنَّ gemeinsam, und beide behalten sie auch im Verb: هُنَّ ذَهَبْنَ ohne, أَنْتُنَّ ذَهَبْتُنَّ mit. Merk dir die beiden als Paar — das ن gehört den Frauen.'
  ],

  'gram-pron-ana': [
    'وَلِيَ دِينِ — der Schluss von سُورَةُ الْكَافِرُونَ, die du auswendig kannst: „und mir meine Religion“. Dieselbe Sure sagt in Vers 4 أَنَا, und beide Male geht es um dasselbe Ich, das sich abgrenzt.',
    'أَنَا ist die eine Stelle, an der der Trick deines Lehrers NICHT greift: das Pronomen endet auf Alif, die Verbform aber auf ـْتُ. Merk dir stattdessen das Schlusspaar der Tabelle zusammen — أَنَا ذَهَبْتُ und نَحْنُ ذَهَبْنَا stehen immer nebeneinander.'
  ],

  'gram-pron-nahnu': [
    'إِيَّاكَ نَعْبُدُ — aus der Fātiḥa, die du in jedem Gebet sprichst: „Dir allein dienen wir.“ Das نَ vorn am Verb ist genau dieses „wir“. In der Vergangenheit steht dasselbe ن hinten statt vorn: نَحْنُ ذَهَبْنَا.',
    'نَا ist auch die Besitzendung für „unser“, und die kennst du aus dem Bittgebet: رَبَّنَا — „unser Herr“. Dasselbe نَا hängst du ans Verb. Und pass auf den Unterschied zu هُنَّ auf: ذَهَبْنَا mit Alif heißt „wir“, ذَهَبْنَ ohne Alif heißt „die Frauen“.'
  ],
};
