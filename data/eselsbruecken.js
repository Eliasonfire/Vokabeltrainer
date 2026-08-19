/* data/eselsbruecken.js -- Eselsbruecken fuer die Buchvokabeln
   =============================================================

   WOZU DIESE DATEI UEBERHAUPT EXISTIERT

   Die 171 Lernwoerter aus vocab-data.js tragen ihre Eselsbruecke seit dem
   15.08.2026 im Feld `mnemo` direkt am Eintrag. Fuer die Buchvokabeln geht das
   nicht - und zwar aus zwei verschiedenen Gruenden, die beide zaehlen:

   ⛔ NICHT in data/vokabeln-*.js. Diese Dateien erzeugt
      werkzeuge/hole-vokabeln.mjs neu ("nicht von Hand aendern"). Ein `mnemo`
      dort waere beim naechsten Abzug spurlos weg - ohne Fehlermeldung, ohne
      dass es jemand merkt.

   ⛔ AUCH NICHT in vocab-data.js. Dort haengt LERNBESTAND_IDS (js/kern.js:97)
      dran und steuert damit die Freischaltung der Kapitel. 140 neue Eintraege
      haetten die Nebenwirkung, dass diese Woerter als "kennt er schon" gelten.
      Das ist kein Schoenheitsfehler, sondern verschiebt Elias' Lernstand.

   Deshalb diese dritte Datei: eine reine Zuordnung id -> Text. Sie wird von
   eselsbrueckenNachtragen() (js/buecher.js) beim Einhaengen eines Buchs
   angewandt, und zwar NUR dort, wo noch keine Eselsbruecke steht. Vorhandenes
   gewinnt - genau wie bei einhaengen() selbst.

   ---------------------------------------------------------------------------
   WARUM DIESE DATEI IM REPO STEHEN DARF, data/vokabeln-*.js aber nicht

   Die .gitignore dieses Projekts trennt genau so: "Nur die kuratierten, selbst
   formulierten Regeln in grammar-data.js werden committet." Hier steht dieselbe
   Sorte Inhalt - selbst geschriebene Merktexte, keine Ausleitung aus Elias'
   bezahltem arabicroots-Zugang. Es ist keine Vokabelliste: ohne die Buchdatei
   danebengelegt sind das Zahlen und deutscher Fliesstext.

   ✅ ENTSCHIEDEN am 15.08.2026. Elias auf die Frage, ob die Datei ins
   oeffentliche Repo darf: "ja darf". Die .gitignore bleibt unveraendert.

   ⭐ Damit ist die Trennlinie bestaetigt und gilt allgemein fuer dieses Repo:
   selbst geschriebene, kuratierte Inhalte werden committet - Auszuege aus
   Elias' bezahltem arabicroots-Zugang nicht. Genau so steht es schon in der
   .gitignore bei grammar-data.js.

   ---------------------------------------------------------------------------
   WIE DIE TEXTE GEBAUT SIND (Stil bestaetigt von Elias am 15.08.2026 zum
   Geraetemuster von مِرْوَحَةٌ: "so eine hilfe finde ich hilfreicih")

   1. Wurzelfamilie  - das Wort an ein Wort haengen, das er SCHON HAT
   2. Gegenpaar      - heiss/kalt, nah/fern, alle/einige
   3. Wortmuster     - مَـ = Ort · مِـ = Werkzeug · فَعِيلٌ · مُفَعِّلٌ · أَفْعَلُ
   4. Klanghilfe     - nur wo nichts anderes traegt, und IMMER als solche
                       gekennzeichnet ("nur der Klang")

   ⛔ Querverweise gehen ausschliesslich auf Woerter aus vocab-data.js oder auf
   Woerter aus demselben Kapitel. Ein Verweis auf ein Wort, das Elias nicht hat,
   ist wertlos - er kann ihn nicht aufloesen.

   ⚠️ Max. 250 Zeichen je Text. Darueber wird der Kasten auf dem Handy zu hoch
   und die Karte muss gescrollt werden. Geprueft mit scratchpad/pruefe-mnemo.mjs.

   Koranstellen sind belegt, nicht aus dem Gedaechtnis zitiert:
   114:1 und 2:25 wurden mit `node werkzeuge/vers.mjs` nachgeschlagen. */

const BUCH_ESELSBRUECKEN = {

  /* ---------- Madina 1, Kapitel 10 ---------- */

  "45899": "Gleiche Form wie جَمِيلٌ (schön) und قَصِيرٌ (kurz): فَعِيلٌ. Ein زَمِيلٌ ist der, der neben dir am selben مَكْتَبٌ (Schreibtisch) sitzt — Kollege oder Mitschüler. Plural زُمَلَاءُ.",

  "45900": "Die Wurzel ز و ج heißt „Paar“ — die Ehefrau ist die eine Hälfte davon. ⚠️ Das و in der Mitte bleibt stehen, der Plural hängt nur an: زَوْجَةٌ → زَوْجَاتٌ, wie سَيَّارَةٌ → سَيَّارَاتٌ und جَامِعَةٌ → جَامِعَاتٌ. Ein weiblicher Plural, der nichts umbaut.",

  "45901": "Zwischen وَلَدٌ (Junge) und بِنْتٌ (Tochter) steht طِفْلٌ: das Kind, ohne dass das Geschlecht mitgesagt wird. Genau dann brauchst du es. Plural أَطْفَالٌ.",

  "45902": "Eine Altersleiter, ganz aus Wörtern, die du hast: طِفْلٌ (Kind, dieses Kapitel), dann وَلَدٌ (Junge), dann فَتًى (junger Mann), dann رَجُلٌ (Mann). Vier Stufen, vier Vokabeln. Das ـً am Ende von فَتًى ist die Besonderheit — dazu der dritte Vorschlag.",

  /* ---------- Kapitel 11 ---------- */

  "45903": "Wurzel ح ب ب mit doppeltem ب — deshalb die Schadda auf dem بّ. Dasselbe siehst du bei قِطٌّ (Katze, ق ط ط) und حَارٌّ (heiß, ح ر ر), die du schon hast: wo zwei gleiche Buchstaben zusammenstoßen, steht ein Zeichen statt zweier.",

  /* ---------- Kapitel 12 ---------- */

  "45904": "Du hast schon عَمٌّ (Onkel väterlicherseits). عَمَّةٌ ist dieselbe Wurzel ع م م plus ـة: seine Schwester, also die Tante von Vaters Seite. ⚠️ Nicht mit أُمٌّ (Mutter) verwechseln — die hat أ م م.",

  "45905": "Spiegelbild zu عَمَّةٌ: خَالٌ ist der Onkel von Mutters Seite, خَالَةٌ mit ـة seine Schwester. Merkregel für beide Paare: خ steht für Mutters Seite, ع für Vaters Seite. Vier Wörter, zwei Buchstaben.",

  "45906": "Das ـة macht aus der Gattung das einzelne Stück: شَجَرَةٌ ist EIN Baum. Dasselbe Muster kennst du von بَقَرَةٌ (Kuh) und بَيْضَةٌ (Ei). Plural أَشْجَارٌ.",

  "45907": "Ländername — hier trägt nur der Klang: „Suriya“. Wie أَلْمَانِيَا (Deutschland) und إِنْدُونِيسِيَا (Indonesien), die du schon hast, endet es auf ـِيَا.",

  "45908": "Du kennst مَدْرَسَةٌ (Schule) schon. مُتَوَسِّطَةٌ heißt „mittlere“ — in der Mitte steckt وَسَط. Also die Schule dazwischen: über der Grundschule, unter der ثَانَوِيَّةٌ (weiterführende Schule), die du auch hast.",

  "45909": "Muster مُفَعِّلٌ wie مُدَرِّسٌ (Lehrer) und مُؤَذِّنٌ (Gebetsrufer): مُـ am Anfang, Schadda in der Mitte — bei allen dreien die Person, die etwas regelmäßig tut. Der مُفَتِّشٌ ist der, der nachsieht.",

  "45910": "Gegenstück zu فَتًى (junger Mann): dieselbe Wurzel ف ت ي, mit ـة wird die junge Frau daraus. Genau wie bei عَمٌّ/عَمَّةٌ und خَالٌ/خَالَةٌ macht das ـة aus dem männlichen Wort das weibliche.",

  "45911": "Ländername, nur der Klang: „Malaysia“ ist hörbar drin. Wie أَلْمَانِيَا und سُورِيَا endet es auf ـِيَا. ⚠️ Achte auf das lange ـَا nach dem م — مَا, nicht مَ.",

  "45912": "مَـ am Anfang, ـة am Ende: dieselbe Form wie مَدْرَسَةٌ (Schule) und مَكْتَبَةٌ (Bibliothek) — ein Ort. Ein Königreich ist der Ort, über den ein König herrscht. Plural مَمَالِكُ, ohne Tanwin.",

  /* ---------- Kapitel 13 ---------- */

  "45913": "⭐ Überraschende Verwandtschaft: ضَيْفٌ (Gast) trägt dieselbe Wurzel ض ي ف wie مُضَافْ إِلَيْهِ aus deiner Grammatik. Ein Gast ist der Hinzugekommene — und genau das tut die Idafa: sie fügt hinzu.",

  "45914": "Kurzes Wort mit Sukun in der Mitte, gebaut wie نَجْمٌ (Stern) und لَحْمٌ (Fleisch), die du schon hast: Fatha, Sukun, Endung. Das حَقْلٌ ist das bestellte Feld. Plural حُقُولٌ.",

  "45915": "⭐ Belegt in 114:1 — قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ, „Sag: Ich nehme Zuflucht beim Herrn der Menschen“. Die letzte Sure trägt diesen Namen. النَّاسُ steht immer mit اَلْ und meint die Menschen als Ganzes.",

  "45916": "Das مَـ am Anfang zeigt den Ort: مَطْبَخٌ ist die Küche, مَكْتَبٌ das Büro, مَدْرَسَةٌ die Schule — und مَطْعَمٌ der Ort, an dem gegessen wird. Merk dir die Form, dann brauchst du das Wort nicht einzeln.",

  "45917": "Kennst du aus dem Deutschen als „Scheich“. Im Buch meint es zuerst schlicht den alten Mann — das Gegenstück zu فَتًى (junger Mann) aus Kapitel 10. Plural شُيُوخٌ.",

  "45918": "Weibliche Form auf ـة, wie مُمَرِّضَةٌ (Krankenschwester), die du hast. ⚠️ Nicht mit مُدَرِّسٌ (Lehrer) mischen: der unterrichtet in der مَدْرَسَةٌ, die أُسْتَاذَةٌ an der جَامِعَةٌ (Universität).",

  "45919": "⚠️ Der Plural passt nicht zum Singular: امْرَأَةٌ wird zu نِسَاءٌ — ein ganz anderes Wort. Das lernst du als Paar, Ableiten hilft hier nicht. Gegenstück ist رَجُلٌ (Mann), das du schon hast.",

  "45920": "Gegenstück zu زَوْجَةٌ (Ehefrau), gleiche Wurzel ز و ج. Der Plural أَزْوَاجٌ steht in 2:25: وَلَهُمْ فِيهَآ أَزْوَٰجٌ مُّطَهَّرَةٌ. ⚠️ Nicht mit زَمِيلٌ (Kollege) verwechseln — زَوْج hat das و in der Mitte.",

  /* ---------- Kapitel 14 ---------- */

  "45921": "Fremdwort mit vierbuchstabiger Wurzel د س ت ر — deshalb passt es in kein Muster, das du kennst. Klanghilfe, nur der Klang: „Dustur“. Die Verfassung ist das Papier, das über allem steht. Plural دَسَاتِيرُ.",

  "45922": "Die قِبْلَةٌ ist die Richtung, der du dich im Gebet zuwendest — zur كَعْبَةٌ (Kaaba), die du schon hast. ⚠️ Verwechslungsgefahr mit قَرِيبٌ (nah): beide beginnen mit ق, die Wurzeln sind aber ق ب ل und ق ر ب.",

  "45923": "Wieder das مَـ für den Ort, wie in مَدْرَسَةٌ und مَطْبَخٌ: مَحْكَمَةٌ ist der Ort, an dem geurteilt wird. Der Plural مَحَاكِمُ steht ohne Tanwin da — das ist kein Tippfehler, sondern gehört zu dieser Pluralform.",

  "45924": "Muster فَعِيلٌ wie جَمِيلٌ (schön), قَصِيرٌ (kurz) und مَرِيضٌ (krank), die du alle hast. Der حَفِيدٌ ist der Sohn deines اِبْنٌ (Sohn) — eine Generation weiter. Plural أَحْفَادٌ.",

  "45925": "Form فَعِيلَةٌ, genau wie حَقِيبَةٌ (Tasche), die du schon hast: beide mit ـِيـ vor dem ـة. ⚠️ Und genau deshalb verwechselbar — حَدِيقَةٌ hat ein د, حَقِيبَةٌ ein ق. Plural حَدَائِقُ.",

  "45926": "Einer der Monate des islamischen Kalenders — hier hilft nur der Klang: „Radschab“. ⚠️ Nicht mit رَجُلٌ (Mann) verwechseln, das du schon hast: رَجَب endet auf ب, رَجُل auf ل.",

  "45927": "Ländername mit اَلْ, wie الْيَابَانُ (Japan), الصِّينُ (China) und الْهِنْدُ (Indien) in deinem Bestand. Klanghilfe, nur der Klang: „al-Yunan“. ⚠️ اليُونَان und الْيَابَان beginnen beide mit الْيَ.",

  "45928": "⭐ Dieselbe Wurzel ط ي ر wie طَائِرٌ (Vogel), das du schon hast. Der مَطَارٌ ist der Ort, an dem geflogen wird — wieder das مَـ für den Ort, wie in مَطْبَخٌ (Küche) und مَدْرَسَةٌ (Schule).",

  "45929": "كُلِّيَّةٌ ist die Fakultät, الطِّبّ die Medizin — und darin steckt طَبِيبٌ (Arzt), das du schon hast. Wurzel ط ب ب mit doppeltem ب, daher die Schadda. Die Fakultät des Arztes.",

  "45930": "Zu أَلْمُهَنْدِسٌ (Ingenieur), das du schon hast: الهَنْدَسَة ist sein Fach. ⚠️ Falle: الْهِنْدُ (Indien) hat dieselben Buchstaben ه ن د und trotzdem nichts damit zu tun — hier trennen nur die Vokale.",

  "45931": "Darin steckt تَاجِرٌ (Händler), das du schon hast: التِّجَارَة ist der Handel, die Fakultät also die des Händlers. Gleiche Wurzel ت ج ر — in Kapitel 24 begegnet dir noch مَتْجَرٌ, der Ort des Handels.",

  "45932": "⭐ Dieselbe Wurzel ش ر ع wie شَارِعٌ (Straße), das du schon hast. Beides ist ein Weg: der شَارِع führt durch die Stadt, die شَرِيعَة durch das Recht. Die Wurzel hält beide zusammen.",

  "45933": "Muster فَعِيلٌ mit Schadda am Ende, wie غَنِيٌّ (reich), das du schon hast. Im selben Feld liegt رَسُولٌ (Gesandter) aus deinem Bestand — andere Wurzel, verwandter Sinn. Plural أَنْبِيَاءُ, ohne Tanwin.",

  /* ---------- Kapitel 15 ---------- */

  "45934": "⭐ Wurzel س ب ع — dieselbe wie in سَبْعَةٌ (sieben) aus Kapitel 24. Eine Woche ist sieben Tage. Wenn du das einmal siehst, musst du das Wort nie wieder einzeln lernen. Plural أَسَابِيعُ.",

  /* ---------- Kapitel 16 ---------- */

  "45935": "Kurzes Wort mit Sukun wie نَجْمٌ (Stern). Der Plural أَنْهَارٌ steht in 2:25: جَنَّٰتٍ تَجْرِي مِن تَحْتِهَا ٱلْأَنْهَٰرُ — „Gärten, durcheilt von Bächen“. Damit hast du ihn schon einmal gelesen.",

  "45936": "Paar mit نَهْرٌ (Fluss) aus demselben Kapitel, beide kurz und mit Sukun gebaut: نَهْرٌ das süße Wasser, بَحْرٌ das große salzige. Plural بِحَارٌ.",

  "45937": "Vierbuchstabige Wurzel ف ن د ق, deshalb passt kein Muster, das du kennst. Klanghilfe, nur der Klang: „funduq“ klingt an „Fonda“ an, den Gasthof. Plural فَنَادِقُ, ohne Tanwin.",

  /* ---------- Kapitel 17 ---------- */

  "45938": "Muster فَعِيلٌ wie قَصِيرٌ (kurz) und جَمِيلٌ (schön). Inhaltlich gehört es zu فَقِيرٌ und غَنِيٌّ (arm/reich), die du hast: wer فَقِيرٌ ist, sucht رَخِيصٌ. Plural رِخَاصٌ.",

  /* ---------- Kapitel 18 ---------- */

  "45939": "Das Rad. Du hast schon دَرَّاجَةٌ (Fahrrad) und سَيَّارَةٌ (Auto) — beide fahren auf عَجَلَات. Merk dir das Wort über die Dinge, die du schon kennst, nicht über den Klang.",

  "45940": "⚠️ Zwei Plurale, beide richtig: سَنَوَاتٌ und سِنُونَ. Das ist selten genug, um es sich zu merken. Und bau dir die Zeitleiter, deren erste Stufe erst in Kapitel 22 dazukommt: دَقِيقَةٌ (Minute) → يَوْمٌ (Tag) → أُسْبُوعٌ (Woche) → سَنَةٌ (Jahr).",

  "45941": "⭐ Das مِـ am Anfang zeigt das Werkzeug — wie bei مِفْتَاحٌ (Schlüssel), مِلْعَقَةٌ (Löffel), مِكْوَاةٌ (Bügeleisen) und مِرْوَحَةٌ (Ventilator), die du alle schon hast. Das Lineal ist das Werkzeug für die Linie.",

  "45942": "Die Tafel im فَصْلٌ (Klassenzimmer), das du schon hast. Schadda auf dem بّ — sprich das ب doppelt. Merk sie zusammen mit مِسْطَرَةٌ (Lineal): beide gehören ins Klassenzimmer, beide tragen ein س.",

  "45943": "Die Einzelportion auf ـة, wie بَيْضَةٌ (Ei): eine von vielen. Eine رَكْعَة ist ein Durchgang im Gebet. Die Wurzel ر ك ع ist die der Verbeugung — du machst sie in jeder Rakʿa. Plural رَكَعَاتٌ.",

  /* ---------- Kapitel 19 ---------- */

  "45944": "Wurzel ك ل ل mit doppeltem ل, deshalb die Schadda. Gegenstück ist بَعْضٌ (einige) aus Kapitel 24 — lern die beiden als Paar. ⚠️ Nicht mit كَلْبٌ (Hund) verwechseln: كُلّ hat kein ب.",

  "45945": "Muster مُفْتَعِلٌ: مُـ am Anfang, ein ـتَـ eingeschoben. Wurzel خ ل ف. Wenn Dinge مُخْتَلِف sind, gehören sie gerade nicht zusammen — das ist der ganze Inhalt des Worts.",

  "45946": "Ländername, nur der Klang: „Uruubba“. ⚠️ Die Schadda auf dem بّ ist die Falle — doppeltes b. Reiht sich bei آسِيَا (Asien) aus Kapitel 21 ein.",

  "45947": "Das längste Wort des Kapitels, und nur Klang: „Yughuslafiya“. Zerleg es beim Lesen in drei Häppchen: يُو-غُوسْ-لَافِيَا. Der Staat existiert heute nicht mehr — das Wort steht so im Lehrbuch.",

  "45948": "⚠️ Falle: dieselbe Wurzel ث م ن wie ثَمَانِيَةٌ (acht) aus Kapitel 24 — mit dem Preis hat die Acht aber nichts zu tun. Merk sie über die Länge: ثَمَن kurz, ثَمَانِيَة lang. Plural أَثْمَانٌ.",

  "45949": "Die Hälfte. Häng es an die Zahlen aus Kapitel 24: die Hälfte von عَشَرَةٌ (zehn) ist خَمْسَةٌ (fünf). Kurzes Wort mit Sukun, Wurzel ن ص ف. Plural أَنْصَافٌ.",

  "45950": "Eine kleine Münzeinheit, wie bei uns der Cent. Klanghilfe, nur der Klang: „Qirsch“ — im Deutschen klingt der „Groschen“ ähnlich. Plural قُرُوشٌ.",

  "45951": "Muster فَاعِلٌ wie جَالِسٌ (sitzend) und وَاقِفٌ (stehend), die du hast: der im Zustand. Der رَاكِب ist der Aufsitzende — in der سَيَّارَةٌ (Auto) oder auf dem جَمَلٌ (Kamel). Plural رُكَّابٌ.",

  "45952": "Wurzel س أ ل. ⚠️ Die Schreibfalle ist das Hamza: im Singular sitzt es auf einem و (ؤ), im Plural أَسْئِلَةٌ auf einem ي (ئ). Dasselbe Wort, zwei Sitze.",

  /* ---------- Kapitel 20 ---------- */

  "45953": "⚠️⚠️ Sehr enge Falle: كَلِمَةٌ (Wort, ك ل م) und قَلَمٌ (Stift, ق ل م), das du schon hast. Ein einziger Punkt trennt ك von ق. Merksatz: Mit dem قَلَم schreibst du die كَلِمَة.",

  "45954": "⭐ Du hast schon حَرْفُ الْجَرِّ (Genitiv-Präposition) — dort steckt genau dieses Wort. حَرْفٌ ist der Buchstabe, in der Grammatik aber auch das Partikelwort. Plural حُرُوفٌ.",

  "45955": "⭐ Die Wurzel د ر س kennst du jetzt dreifach: مُدَرِّسٌ (Lehrer), مَدْرَسَةٌ (Schule) — und دَرْسٌ, die Lektion selbst. Der Lehrer gibt den Unterricht in der Schule. Drei Wörter, eine Wurzel.",

  /* ---------- Kapitel 21 ---------- */

  "45956": "Muster فَاعِلٌ wie وَاقِفٌ (stehend), das du hast — beide beginnen sogar mit وَا. Neben كَبِيرٌ (groß), aber وَاسِعٌ meint den Platz darin: eine غُرْفَةٌ ist وَاسِعَة, wenn viel hineinpasst.",

  "45957": "Nur der Klang: „Asiya“. Das آ am Anfang ist ein langes A mit Madda — dasselbe Zeichen wie in الْآنَ (jetzt), das du schon hast. Reiht sich bei أُورُوبَّا (Europa) ein.",

  /* ---------- Kapitel 22: die Farben ---------- */

  "45958": "⭐ Alle sechs Farben folgen einem Muster أَفْعَلُ: أَحْمَرُ · أَزْرَقُ · أَخْضَرُ · أَسْوَدُ · أَصْفَرُ · أَبْيَضُ. Keine trägt ein Tanwin. Lern sie als Block. ⚠️ حِمَارٌ (Esel) hat dieselben Buchstaben ح م ر.",

  "45959": "Aus dem Farbblock أَفْعَلُ. Klanghilfe, nur der Klang: „azraq“ — das Blau des بَحْرٌ (Meer) aus Kapitel 16. Plural زُرْقٌ, ohne das أَ am Anfang.",

  "45960": "Aus dem Farbblock أَفْعَلُ. Grün wie die شَجَرَةٌ (Baum) und das حَقْلٌ (Feld), beide aus diesem Buch. ⚠️ أَخْضَر und أَحْمَر sind gleich gebaut — achte auf den zweiten Buchstaben: خ gegen ح.",

  "45961": "Aus dem Farbblock أَفْعَلُ, Gegenstück zu أَبْيَضُ (weiß) — merk die beiden immer als Paar. Der Stein in der كَعْبَةٌ heißt الْحَجَر الْأَسْوَد, „der schwarze Stein“; حَجَرٌ und كَعْبَةٌ hast du beide schon.",

  "45962": "Aus dem Farbblock أَفْعَلُ. ⚠️ Verwechslungsgefahr mit عُصْفُورٌ (Spatz), das du schon hast: beide tragen ص und ف, sind aber verschiedene Wörter. Plural صُفْرٌ.",

  "45963": "⭐ Die stärkste Farbbrücke: أَبْيَضُ (weiß) und بَيْضَةٌ (Ei) teilen die Wurzel ب ي ض, und das Ei hast du schon. Ein Ei ist weiß. Gegenstück: أَسْوَدُ (schwarz). Plural بِيضٌ.",

  "45964": "Städtename ohne Tanwin — بَغْدَادُ endet auf ـُ. Klanghilfe, nur der Klang: „Baghdad“, das kennst du längst. Merk es neben الْقَاهِرَةُ (Kairo) aus deinem Bestand: beide Hauptstädte, beide ohne Tanwin.",

  "45965": "⭐ Wurzel ج د د — dieselbe wie in جَدِيدٌ (neu), das du schon hast. Merkbild: die neue Stadt am Meer. Schadda auf dem دّ, Endung ـُ ohne Tanwin wie bei den anderen Städtenamen hier.",

  "45966": "Du hast schon كُوبٌ (Tasse/Becher). Der فِنْجَان ist die kleine Tasse für شَايٌ (Tee) und قَهْوَةٌ (Kaffee) — beide hast du auch. Vierbuchstabige Wurzel, deshalb kein Muster. Plural فَنَاجِينُ.",

  "45967": "Muster فَعِيلَةٌ, Wurzel د ق ق mit doppeltem ق. Häng sie an deine Zeitleiter: دَقِيقَةٌ (Minute) → يَوْمٌ (Tag) → أُسْبُوعٌ (Woche) → سَنَةٌ (Jahr). Plural دَقَائِقُ, ohne Tanwin.",

  "45968": "Eines der häufigsten Verben im Koran: قَالُوا („sie sagten“) steht zum Beispiel in 2:25. Die Wurzel ق و ل hat ein و in der Mitte, das im Wort zum langen ـَا wird — deshalb siehst du das و gar nicht.",

  /* ---------- Kapitel 23 ---------- */

  "45969": "Nur der Klang: „Istanbul“. Ohne Tanwin, endet auf ـُ wie بَغْدَادُ und جُدَّةُ aus Kapitel 22. Zerleg es beim Lesen: إِسْـ طَنْـ بُولُ.",

  "45970": "Nur der Klang: „Waschintun“. ⚠️ Die Schreibfalle ist das ط, nicht ت — genau da verschreibt man sich. Ohne Tanwin, wie alle Städtenamen dieses Kapitels.",

  "45971": "⭐ Wurzel ط و ف — dieselben Buchstaben wie im طَوَاف, dem Umkreisen der كَعْبَةٌ, die du schon hast. Die Stadt الطَّائِف liegt nahe Mekka. Mit اَلْ und ohne Tanwin.",

  /* ---------- Kapitel 24: Pronomen ---------- */

  "50154": "Lern die Reihe als Block, nicht einzeln: أَنَا (ich) · نَحْنُ (wir) · أَنْتَ (du) · هُوَ (er) · هِيَ (sie). Fünf Wörter, ein Durchgang. Einzeln gelernt verwechselst du sie garantiert.",

  "50155": "Die Mehrzahl zu أَنَا (ich). Merk das Paar am Anfangsbuchstaben: أَنَا beginnt mit أ und meint einen, نَحْنُ beginnt mit ن und meint mehrere.",

  "50156": "„Du“ zu einem Mann. Beginnt wie أَنَا (ich) mit أَنْ — der Unterschied steckt ganz am Ende: أَنَا endet auf ـَا, أَنْتَ auf ـتَ. ⚠️ Genau dort passieren die Fehler.",

  "50157": "Paar mit هِيَ (sie): هُوَ hat das و und meint „er“, هِيَ hat das ي und meint „sie“. Merkbrücke über den Vokal — هُـ mit Damma männlich, هِـ mit Kasra weiblich. Dieselbe Trennung siehst du bei هَذَا und هَذِهِ.",

  "50158": "Gegenstück zu هُوَ (er): ي heißt sie, و heißt er. Wenn du unsicher bist, sprich es laut — هِيَ klingt schlank, wie das ي aussieht. Dasselbe ي steckt in هَذِهِ (diese), ebenfalls weiblich.",

  "50159": "Die Mehrzahl zu هُوَ (er): aus einem wird eine Gruppe. Merk die kurze Kette هُوَ → هُمْ, beide mit هُـ am Anfang. Das ـمْ am Ende steht für die Gruppe.",

  "50160": "⭐ Die Vierertafel, die alles ordnet — nah/fern gegen männlich/weiblich: هَذَا dieser (nah, m.) · هَذِهِ diese (nah, w.) · ذَلِكَ jener (fern, m.) · تِلْكَ jene (fern, w.). Nah beginnt mit هَـ, fern nicht.",

  "50161": "Weibliche Form zu هَذَا, beide „nah“. Erkennungszeichen ist das ذِهِ mit Kasra — schlank wie هِيَ (sie). Die Gegenstücke in der Ferne sind ذَلِكَ (m.) und تِلْكَ (w.).",

  "50162": "„Fern“ heißt hier: kein هَـ am Anfang. ذَلِكَ ist das ferne Gegenstück zu هَذَا (dieser). Verknüpf es mit بَعِيدٌ (fern) aus deinem Bestand — und هَذَا mit قَرِيبٌ (nah).",

  "50163": "Fern und weiblich, das Gegenstück zu هَذِهِ (diese). Die vier zusammen: هَذَا · هَذِهِ nah, ذَلِكَ · تِلْكَ fern. ⚠️ تِلْكَ beginnt mit ت, nicht mit ذ wie ذَلِكَ.",

  "50164": "Mehrzahl zu هَذَا und هَذِهِ — und wieder gilt: nah beginnt mit هَـ. Das Gegenstück in der Ferne ist أُولَئِكَ (jene). In deinen Daten steht هَؤُلَاءِ ohne Geschlechtsangabe, anders als im Singular.",

  "50165": "Fern und Mehrzahl, Gegenstück zu هَؤُلَاءِ (diese). ⚠️ Schreibfalle: nach أُو folgt ein لَـ, das ا wird nicht gesprochen. Die Endung ـئِكَ teilt es mit ذَلِكَ und تِلْكَ.",

  "50166": "Verbindet zwei Sätze: „der Mann, DER …“. Belegt in 2:25 — هَٰذَا ٱلَّذِي رُزِقْنَا مِن قَبْلُ, „Das ist ja das, womit wir zuvor versorgt wurden“. Merk die Schadda auf dem لّ.",

  /* ---------- Kapitel 24: Frage- und Funktionswörter ---------- */

  "50167": "Leitet eine Ja/Nein-Frage ein — dieselbe Aufgabe wie أَ, das du schon hast. Wie genau sich die beiden unterscheiden, ist in deinen Regeln noch offen. Fürs Lernen reicht: هَلْ steht als eigenes Wort davor, أَ klebt am Folgewort.",

  "50168": "⚠️⚠️ Die gefährlichste Verwechslung des Kapitels: مَنْ (wer) und مِنْ (von/aus), das du schon hast. Gleiche Buchstaben, nur der Vokal trennt sie — Fatha heißt wer, Kasra heißt von. Sprich beide beim Lernen laut mit.",

  "50169": "Häng es an die Fragewörter, die du schon hast: أَيْنَ (wo), مَا (was), لِمَاذَا (warum) — dazu jetzt مَتَى (wann) und مَنْ (wer). Lern sie als Kette ab: wer, was, wo, wann, warum.",

  "50170": "Fragt nach der Auswahl: nicht „was“, sondern „welches von diesen“. Verwandt im Schriftbild mit أَيْنَ (wo), das du hast — beide beginnen mit أَيْ. Die Schadda auf dem يّ ist das Erkennungszeichen.",

  "50171": "Kurzes Wort, große Wirkung: مَعَ heißt „zusammen mit“. Stell es zu den Präpositionen, die du schon hast — مِنْ (von), إِلَى (nach), فِي (in), عَلَى (auf). Dort gehört es hin.",

  "50201": "Der Gegensatz-Anschluss: „…, aber …“. ⚠️ Erkennungszeichen ist die Schadda auf dem نّ. Dieselbe Schadda trägt كَأَنَّ (als ob), das du in diesem Kapitel ebenfalls lernst — merk die beiden zusammen.",

  "50285": "„Ein Teil von“ — das Gegenstück zu كُلٌّ (alle) aus Kapitel 19. Merk sie als Paar: كُلٌّ ganz, بَعْضٌ teilweise. ⚠️ Nicht mit بَعِيدٌ (fern) verwechseln, das du schon hast.",

  "50287": "Zusammengesetzt aus كَـ („wie“) und أَنَّ — daher „als ob“. Trägt dieselbe Schadda wie لَكِنَّ (aber) aus demselben Kapitel. Beide schließen einen ganzen Satz an, kein einzelnes Wort.",

  "50289": "Steht IMMER hinter dem Wort, das es verstärkt: كَبِيرٌ جِدًّا heißt „sehr groß“. Erkennungszeichen sind das ـًا am Ende und die Schadda auf dem دّ. Genauso gebaut wie شُكْرًا (danke).",

  "50290": "Das ـًا am Ende hat es mit جِدًّا gemeinsam — beide sind feste Ausdrücke, die so und nicht anders stehen. شُكْرًا جَزِيلًا heißt „vielen Dank“; جَزِيلٌ (reichlich) lernst du in diesem Kapitel gleich mit.",

  /* ---------- Kapitel 24: Nomen und Adjektive ---------- */

  "50312": "Muster مُفْعِلٌ mit مُـ am Anfang, wie مُدَرِّسٌ (Lehrer) und مُؤَذِّنٌ (Gebetsrufer): die Person, die etwas tut. Wurzel س ل م — dieselben drei Buchstaben, die im Gruß السَّلَامُ عَلَيْكُمْ stecken.",

  "50338": "⭐ Doppelt verankert: die Wurzel ت ج ر kennst du von تَاجِرٌ (Händler), und das مَـ zeigt wieder den Ort — wie in مَطْبَخٌ und مَكْتَبٌ. Der مَتْجَر ist der Ort des Händlers. Gleiche Bedeutung wie دُكَّانٌ.",

  "50357": "⚠️ Kein Tanwin am Ende — genau wie bei den Farben أَحْمَرُ, أَزْرَقُ, أَخْضَرُ aus Kapitel 22. Diese Wörter tragen nie ein ـٌ. Bild dazu: Wer غَضْبَانُ ist, wird أَحْمَرُ (rot).",

  "50358": "Muster فَاعِلٌ wie جَالِسٌ (sitzend), وَاقِفٌ (stehend) und طَالِبٌ (Student), die du alle hast: die Person im Zustand. عَاقِلٌ ist, wer seinen Verstand gebraucht.",

  "50387": "Wurzel ح ج ج mit doppeltem ج, deshalb die Schadda — genau wie bei حَارٌّ (heiß, ح ر ر) und حَادٌّ (scharf, ح د د), die du schon hast. Alle drei: Form فَاعِلٌ, zwei gleiche Buchstaben zusammengezogen.",

  "50466": "Verb mit Hamza in der Mitte: د أ ب. Genau das ist die Besonderheit — beim Sprechen setzt du in der Mitte kurz ab. Bedeutung: dranbleiben, ohne nachzulassen.",

  /* ---------- Kapitel 24: die Grammatikbegriffe ---------- */

  "50467": "⭐ Das kennst du halb: es gehört zu اِسْمٌ مَجْرُورٌ und مُضَافْ إِلَيْهِ aus deinem Bestand. Der مُبْتَدَأ ist „das Angefangene“ — er steht am Anfang des Nominalsatzes. Gleiche Wurzel ب د أ wie اِبْتِدَائِيٌّ.",

  "50468": "⭐ Merk die Dreiergruppe der Satzrollen zusammen: فَاعِلٌ (wer tut) · مَفْعُولٌ بِهِ (an wem getan wird) · مُبْتَدَأٌ (Anfang des Nominalsatzes). Alle drei aus diesem Kapitel — einzeln gelernt verwechselst du sie.",

  "50469": "Dieselbe Form فَاعِلٌ, die du von جَالِسٌ (sitzend) und طَالِبٌ (Student) kennst: der Handelnde. Hier ist es zugleich der Name der Satzrolle — der فَاعِل ist der, der tut. Gegenstück: مَفْعُولٌ بِهِ.",

  "50470": "⭐ Drei Kasusnamen, ein Muster مَفْعُولٌ: مَرْفُوعٌ (Nominativ) · مَنْصُوبٌ (Akkusativ) · مَجْرُورٌ (Genitiv). Das letzte hast du schon als اِسْمٌ مَجْرُورٌ. Lern sie als Dreierblock, nur die Wurzel wechselt.",

  "50471": "Der mittlere der drei Kasusnamen: مَرْفُوعٌ · مَنْصُوبٌ · مَجْرُورٌ. Alle drei nach dem Muster مَفْعُولٌ gebaut — wenn du eines erkennst, erkennst du alle. Wurzel hier: ن ص ب.",

  "50472": "Das kennst du schon halb: اِسْمٌ مَجْرُورٌ steht in deinem Bestand, حَرْفُ الْجَرِّ ebenso. Beide teilen die Wurzel ج ر ر mit doppeltem ر — daher die Schadda in الْجَرِّ. Der dritte im Bunde: مَرْفُوعٌ und مَنْصُوبٌ.",

  "50473": "⭐ Du hast schon مُضَافْ إِلَيْهِ (Besitzer). مُضَافٌ ist der andere Teil derselben Verbindung: das Besessene. Beide teilen die Wurzel ض ي ف mit ضَيْفٌ (Gast) aus Kapitel 13 — was hinzukommt, wird angefügt.",

  "50474": "Der Name der ganzen Konstruktion, die aus مُضَافٌ und مُضَافْ إِلَيْهِ besteht — beide hast du. Wurzel ض ي ف, dieselbe wie bei ضَيْفٌ (Gast): das Hinzugefügte.",

  "50428": "Das Wort, das ein Nomen näher beschreibt — بَيْتٌ كَبِيرٌ, „ein großes Haus“; beide Wörter hast du. Wurzel ن ع ت. ⚠️ Anders als فَاعِلٌ und مُبْتَدَأٌ ist das نَعْت keine Rolle im Satz, sondern eine Beigabe zum Nomen.",

  /* ---------- Kapitel 24: Länder und Zugehörigkeit ---------- */

  "50480": "Ländername, nur der Klang: „Faransa“. Reiht sich bei أَلْمَانِيَا (Deutschland) und إِنْجِلْتَرَا (England) ein, die du schon hast. ⚠️ Es endet auf ـَا, nicht auf ـِيَا wie أَلْمَانِيَا.",

  "50498": "⭐ Direkt aus الْيَابَانُ (Japan), das du schon hast: Land plus ـِيٌّ ergibt die Zugehörigkeit. Dasselbe siehst du bei إِنْجِلِيزِيَّةٌ (Englisch) und عَرَبِيَّةٌ (Arabisch) in deinem Bestand. Die Schadda gehört dazu.",

  "50503": "Gleiche Wurzel ب د أ wie مُبْتَدَأٌ aus diesem Kapitel — beides hat mit „Anfang“ zu tun. Die Endung ـِيٌّ macht daraus ein Eigenschaftswort, genau wie bei يَابَانِيٌّ (japanisch). Die اِبْتِدَائِيَّة ist die Grundschule.",

  /* ---------- Kapitel 24: Universität und Alltag ---------- */

  "50172": "„Gegenseitiges“ steckt schon in der deutschen Übersetzung — im Arabischen trägt es der Bau: das تَـ am Anfang und das ـَا in der Mitte. Wurzel ع ر ف. Nicht „kennen“, sondern einander kennenlernen.",

  "50173": "Ein Gespräch zwischen zweien, Wurzel ح و ر. Klanghilfe, nur der Klang: „hiwar“ — im Deutschen gibt es keinen Anknüpfungspunkt. Merk es neben تَعَارُفٌ aus demselben Kapitel: beim Kennenlernen führt man einen حِوَار.",

  "50174": "Muster مُفْعِلٌ mit مُـ, wie مُدَرِّسٌ (Lehrer) und مُسْلِمٌ (Muslim): die Person, die etwas tut. Der مُرْشِد ist der, der den Weg weist — dein Studienberater. Wurzel ر ش د.",

  "50175": "Endet auf ـة und meint eine Einrichtung, wie مَكْتَبَةٌ (Bibliothek) und جَامِعَةٌ (Universität), die du hast. Die عِمَادَة ist die Verwaltung einer Fakultät. ⚠️ Nicht mit عَمَّةٌ (Tante) verwechseln.",

  "50176": "Beginnt mit اِسْتِـ — dieselbe Silbe, die مُسْتَشْفًى (Krankenhaus) und مُسْتَوْصَفٌ (Klinik) aus deinem Bestand tragen. Das Formular ist das Blatt, das du in der عِمَادَةٌ (Dekanat) ausfüllst. Plural اِسْتِمَارَاتٌ.",

  "50177": "⚠️ Falle: Wurzel س ك ن — dieselben Buchstaben wie in سِكِّينٌ (Messer), das du schon hast. Mit dem Wohnen hat das Messer nichts zu tun, hier trennen nur die Vokale. إِسْكَان ist das Wohnungswesen.",

  "50178": "Muster فَعِيلٌ wie جَمِيلٌ (schön) und قَصِيرٌ (kurz). Du triffst es fast nur in einer Wendung: شُكْرًا جَزِيلًا, „vielen Dank“ — und شُكْرًا lernst du hier mit. ⚠️ جَزِيل und جَمِيل trennt ein Buchstabe.",

  "50179": "Wurzel ش ع ب. Singular mit Sukun (شُعْبَةٌ), Plural mit Fatha (شُعَبٌ) — das ist der ganze Unterschied im Schriftbild, und genau daran erkennst du ihn. Die شُعْبَة ist ein Teil einer كُلِّيَّة.",

  "50180": "⭐ Endet auf ـً ى — genauso wie مُسْتَشْفًى (Krankenhaus), das du schon hast, und beide beginnen mit مُسْتَـ. Wenn du eines schreiben kannst, kannst du das andere. Plural مُسْتَوَيَاتٌ.",

  "50181": "⭐ Vervollständigt deine Himmelsrichtungen: شَرْقٌ (Osten) und غَرْبٌ (Westen) hast du schon, jetzt kommt جَنُوبٌ (Süden) dazu. Wurzel ج ن ب. Merk alle drei an einer Karte, nicht einzeln.",

  "50182": "Muster مُفَعِّلٌ mit Schadda, wie مُدَرِّسٌ (Lehrer) und مُؤَذِّنٌ (Gebetsrufer), die du hast. Gut zu merken: Der مُؤَذِّن zum Fadschr kommt مُبَكِّرٌ — früh. Wurzel ب ك ر.",

  "50183": "Wurzel ف ط ر — dieselben drei Buchstaben stecken in عِيد الْفِطْر, dem Fest des Fastenbrechens. Das فَطُور ist die Mahlzeit, die das Fasten der Nacht bricht. Deshalb heißt es beides: Frühstück und Fastenbrechen.",

  "50184": "Muster فَاعِلَةٌ wie نَافِذَةٌ (Fenster), das du schon hast. Die deutsche Übersetzung „Vorgeschichte“ sagt schon alles: der Fall, der vorangegangen ist. Plural سَوَابِقُ, ohne Tanwin.",

  "50185": "Muster فَاعِلٌ wie جَالِسٌ (sitzend) und وَاقِفٌ (stehend). Inhaltlich steht es neben نَظِيفٌ (sauber) und gegen وَسِخٌ (schmutzig) — beide hast du schon. Plural أَطْهَارٌ.",

  "50186": "Sehr kurzes Wort mit Schadda: ف ذ ذ, zwei gleiche Buchstaben zusammengezogen — wie bei قِطٌّ (Katze) und حَارٌّ (heiß), die du hast. Bedeutung: einzeln, einzigartig. Plural أَفْذَاذٌ.",

  "50187": "Muster فَاعِلَةٌ wie نَافِذَةٌ (Fenster). Die خَاصِرَة ist die schmale Stelle zwischen Rippen und Hüfte. Reih sie bei deinen Körperteilen ein: أَنْفٌ, أُذُنٌ, عَيْنٌ, يَدٌ, رِجْلٌ — die hast du alle.",

  "50188": "Beginnt mit تَـ und hat ein ـِيـ vor der Endung — die Form für den Vorgang selbst. Das Gegenteil im Sinn ist مُبَكِّرٌ (früh) aus demselben Kapitel. Merk das Paar: zu früh gegen zu spät.",

  "50189": "Wurzel ه و ي. ⚠️ Sieht حِوَارٌ (Dialog) aus demselben Kapitel ähnlich, und beide sind neu — هِوَايَة beginnt mit هـ, حِوَار mit حـ. Zwei ganz verschiedene Wörter. Plural هِوَايَاتٌ.",

  "50190": "Wurzel ف ر ع. Der فَرْع ist der Zweig — am Baum (شَجَرَةٌ aus Kapitel 12) genauso wie bei einer Firma. Plural فُرُوعٌ, dasselbe Muster wie حُقُولٌ zu حَقْلٌ.",

  "50191": "Die Einzelportion auf ـة, wie بَيْضَةٌ (Ei) und شَجَرَةٌ (Baum): das ـة macht aus der Masse das einzelne Stück. Eine لُقْمَة ist ein Bissen Brot. Plural لُقَمٌ.",

  "50192": "Ein Wort ohne Brücke im Bestand — hier hilft nur Wiederholung, und das sage ich lieber, als etwas zu erfinden. Wurzel م ث ل, Bedeutung: einer Anweisung genau folgen. Endung ـَال wie bei إِسْكَانٌ aus diesem Kapitel.",

  "50193": "Wurzel ض ح ي — dieselben Buchstaben wie in عِيد الْأَضْحَى, dem Opferfest. Die أُضْحِيَة ist das Tier, das dabei geschlachtet wird. Wenn du das Fest kennst, kennst du das Wort. Plural أَضَاحِيُّ.",

  "50194": "Muster فَاعُولَةٌ. Klanghilfe, nur der Klang: „qarura“ — das rollende ر klingt wie eine Flasche, die über den Tisch rollt. Plural قَوَارِيرُ, ohne Tanwin.",

  "50195": "Muster فَاعِلٌ wie طَائِرٌ (Vogel), das du schon hast — beide mit dem ئ in der Mitte. ⚠️ Nicht mit سُؤَالٌ (Frage) aus Kapitel 19 verwechseln: die Wurzeln sind س ي ل und س أ ل, und das Hamza sitzt anders.",

  "50196": "⭐ Genau das, was du gerade tust. Beginnt mit اِسْتَـ — dieselbe Silbe wie مُسْتَشْفًى (Krankenhaus) und مُسْتَوًى (Niveau). Wurzel ذ ك ر, dieselben drei Buchstaben wie in ذِكْر, dem Gedenken.",

  "50197": "Wurzel ف ض ل — dieselben Buchstaben wie in فَضْل, „Vorzug, Güte“. ⚠️ Nicht mit فَصْلٌ (Klassenzimmer/Kapitel) verwechseln, das du schon hast: hier ض, dort ص. Ein Zahn Unterschied, zwei Wörter."

};
