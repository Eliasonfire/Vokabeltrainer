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

   ⚠️ Zwei Schreibungen sind in der Quelle UNVOLLSTÄNDIG vokalisiert und wurden
   trotzdem so übernommen, statt ein Taschkīl zu erfinden:
     · إِضافة   — ohne Zeichen auf ض ا ف   (9× so in grammar-data.js)
     · شَكْل    — vollständig, aber der Plural تَشْكيل daneben nicht
     · تاء مَرْبُوطة — das erste Wort ohne jedes Zeichen (4× so, 3× ganz nackt)
     · أَلِف مَقْصورة — مقصورة ohne Zeichen auf ص و ر  (3× so)
   Das gehört auf die Liste für Elias: er kann seinen Lehrer fragen. Ein
   geratenes Taschkīl wäre hier schlimmer als eine sichtbare Lücke, weil er es
   auswendig lernen würde.

   ⚠️ Bei اسْمُ الْإِشَارَة gibt es in der Quelle ZWEI Schreibungen:
   اسْمُ الْإِشَارَة (2×) und اِسْمُ الإِشارَةِ (1×). Genommen ist die häufigere;
   die zweite steht hier, damit die Abweichung nicht unsichtbar verschwindet.

   ---------------------------------------------------------------------------
   TECHNISCH: `chapter: 'grammar'` und `book: 'grammar'`.

   ⛔ Sie laufen bewusst NICHT unter 'personal'. Der Schalter „Eigene" darf sie
   nicht abschalten können — sonst verschwinden genau die Wörter, um die er
   gebeten hat, sobald er den Schalter einmal ausmacht. In `istBekannt()` und
   `passtZurAuswahl()` (js/kern.js) sind sie deshalb bedingungslos dabei.
   --------------------------------------------------------------------------- */

const FACHBEGRIFF_VOKABELN = [
  {
    id: 'gram-mudaf',
    ar: 'مُضَاف',
    de: 'der Besitz — das erste Wort der Genitivverbindung',
    type: 'noun',
    chapter: 'grammar',
    book: 'grammar',
    regel: 'mudaf-01',
    belegt: 23,
    mnemo: 'Das ERSTE Wort einer إِضافة: بَيْتُ اللهِ — das Haus Allahs, die Kaaba. بَيْتٌ hast du als Vokabel; hier steht es als مُضَاف. Du erkennst ihn an dem, was FEHLT: kein اَلْ und kein Tanwīn. Also nicht اَلْبَيْتُ und nicht بَيْتٌ, sondern nacktes بَيْتُ — es braucht keine eigene Bestimmung, das Wort dahinter bestimmt es schon.'
  },
  {
    id: 'gram-majrur',
    ar: 'مَجْرُور',
    de: 'Genitiv (Frage: wessen?)',
    type: 'noun',
    chapter: 'grammar',
    book: 'grammar',
    regel: 'irab-drei-faelle-01',
    belegt: 18,
    mnemo: 'مَجْرُور und حَرْفُ الْجَرِّ sind dasselbe Wort — الْجَرّ. Die Partikel zieht das Nomen dahinter in den Genitiv: aus اَلْبَيْتُ wird فِي الْبَيْتِ. Am Ende steht dann Kasra ـِ statt Damma ـُ. Merksatz deines Lehrers: der ḥarf al-jarr macht sein Nomen zu majrūr. فِي kennst du als Vokabel — das ist die Partikel, die es tut.'
  },
  {
    id: 'gram-marfu',
    ar: 'مَرْفُوع',
    de: 'Nominativ — der Grundfall',
    type: 'noun',
    chapter: 'grammar',
    book: 'grammar',
    regel: 'marfu-grundfall-01',
    belegt: 8,
    mnemo: 'Der Ruhezustand, kein Sonderfall: solange nichts dazukommt, steht jedes Nomen mit Damma am Ende — اَلْبَيْتُ. Erst ein حَرْف جَرّ oder eine إِضافة macht daraus مَجْرُور. Wenn du also ein Wort ohne besonderen Grund siehst, ist es مَرْفُوع.'
  },
  {
    id: 'gram-nat',
    ar: 'نَعْت',
    de: 'Adjektiv — das beschreibende Wort',
    type: 'noun',
    chapter: 'grammar',
    book: 'grammar',
    regel: 'nat-vier-bedingungen-01',
    belegt: 5,
    mnemo: 'نَعْت kommt von „beschreiben“ — und das Wort tut selbst, was es heißt: es steht hinter dem Nomen und macht ihm alles nach. Vier Bedingungen: Geschlecht, Bestimmtheit, Fall und Zahl. Das beschriebene Wort heißt مَنْعُوت, also „das Beschriebene“ — dieselbe Wurzel ن ع ت, einmal aktiv, einmal passiv. Wer den einen Namen hat, hat den anderen.'
  },
  {
    id: 'gram-idafa',
    ar: 'إِضافة',
    de: 'Genitivverbindung — zwei Nomen werden ein Ausdruck',
    type: 'noun',
    chapter: 'grammar',
    book: 'grammar',
    regel: 'idafa-01',
    belegt: 9,
    mnemo: 'بابُ الْمَسْجِدِ — die Tür der Moschee. بَابٌ und مَسْجِدٌ hast du einzeln gelernt, die إِضافة setzt sie zu einem Begriff zusammen. Erstes Wort: مُضَاف. Zweites Wort: مُضَاف إِلَيْهِ, und das steht im Genitiv. Damit kannst du zusammengesetzte Wörter bauen, die es im Arabischen sonst nicht gäbe — Schreibtisch, Wörterbuch, Feuertreppe.'
  },
  {
    id: 'gram-zarf',
    ar: 'ظَرْف',
    de: 'Zeit- oder Ortsangabe',
    type: 'noun',
    chapter: 'grammar',
    book: 'grammar',
    regel: 'zarf-01',
    belegt: 3,
    mnemo: 'Die DRITTE Sache, die den Fall steuert — neben حَرْف جَرّ und إِضافة. تَحْتَ الْمَكْتَبِ: تَحْتَ hast du als Vokabel, und das Wort dahinter wird مَجْرُور, genau wie hinter einem مُضَاف. Dein Lehrer stellt ausdrücklich klar: تَحْتَ selbst ist KEIN حَرْف جَرّ — es wirkt nur so.',
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
    ar: 'شَكْل',
    de: 'Vokalzeichen (ein einzelnes)',
    type: 'noun',
    chapter: 'grammar',
    book: 'grammar',
    regel: 'schakl-01',
    belegt: 3,
    mnemo: 'Die kleinen Zeichen über und unter den Buchstaben. Fünf Stück: فَتْحة, كَسْرة, سُكون, ضَمّة, شَدّة. Alle zusammen heißen تَشْكيل — EINES davon ist ein شَكْل. Dieselbe Sache in Einzahl und Gesamtheit, wie Buchstabe und Alphabet.'
  },
  {
    id: 'gram-ismul-isara',
    ar: 'اسْمُ الْإِشَارَة',
    de: 'Hinweiswort (dieser, jener)',
    type: 'noun',
    chapter: 'grammar',
    book: 'grammar',
    regel: 'ismul-isara-hadha-01',
    belegt: 2,
    varianteInQuelle: 'اِسْمُ الإِشارَةِ',
    mnemo: 'Wörtlich „der Name des Zeigens" — اِسْم ist das Wort für „Nomen", das du aus den drei Wortarten kennst (اِسْم – فِعْل – حَرْف). Vier davon hattest du im Unterricht: هَذَا und هَذِهِ für Nahes, ذَلِكَ und تِلْكَ für Fernes. هَذَا بَيْتٌ — dies ist ein Haus.'
  },
  {
    id: 'gram-ta-marbuta',
    ar: 'تاء مَرْبُوطة',
    de: 'die weibliche Endung ة',
    type: 'noun',
    chapter: 'grammar',
    book: 'grammar',
    regel: 'ta-marbuta-fem-01',
    belegt: 4,
    mnemo: 'Wörtlich das „gebundene Tāʾ" — geschrieben wie ein Kreis mit zwei Punkten. Steht es am Wortende, ist das Wort weiblich: مَدْرَسَةٌ und سَيَّارَةٌ hast du beide als Vokabel, beide sind weiblich. Aber Vorsicht in beide Richtungen: nicht jedes weibliche Wort trägt eins, und nicht jedes Wort lässt sich damit weiblich machen.'
  },
  {
    id: 'gram-alif-maqsura',
    ar: 'أَلِف مَقْصورة',
    de: 'das ى am Wortende (gesprochen wie langes ā)',
    type: 'noun',
    chapter: 'grammar',
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
    chapter: 'grammar',
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
    chapter: 'grammar',
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
    chapter: 'grammar',
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
    chapter: 'grammar',
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
    chapter: 'grammar',
    book: 'grammar',
    regel: 'possessiv-endungen-01',
    belegt: 2,
    sentAr: 'لِي أُخْتٌ اسْمُهَا آمِنَةُ.',
    sentDe: 'Ich habe eine Schwester, ihr Name ist Āmina.',
    mnemo: 'Deinem Lehrer genügt dafür ein Wort: „Ha, mit Elif“. Genau daran erkennst du sie — dasselbe Hāʾ wie beim „sein“, aber ein Alif dahinter macht es weiblich: اسْمُهُ gegen اسْمُهَا (Seite 61).'
  }
];
