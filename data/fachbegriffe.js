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
   TECHNISCH: `book: 'grammar'` (die Herkunft) und `chapter: 'personal'`.
   ⚠️ Das `chapter` war bis zum 20.08.2026 ebenfalls 'grammar'. Elias an
   diesem Tag: „ich finde die kategorie ,,fachbegriffe" unnötig. ich möchte das
   all diese begriffe und zukünftige einfach als meine eigenen begriffe gelten.
   sie sollen alle unter eigene vokabeln sein."
   ⛔ `book` bleibt 'grammar' und ist ab jetzt das EINZIGE Merkmal: daran haengen
   der Fachbegriff-Takt im Lernmodus (jeder sechste Platz), der Hoermodus und die
   Zaehlung in pruefe-oberflaeche.js. Wer es entfernt, schaltet alle drei still ab.

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
    chapter: 'personal',
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
    chapter: 'personal',
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
    chapter: 'personal',
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
    chapter: 'personal',
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
    chapter: 'personal',
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
    chapter: 'personal',
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
    chapter: 'personal',
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
    chapter: 'personal',
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
    chapter: 'personal',
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
    chapter: 'personal',
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
    chapter: 'personal',
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
    chapter: 'personal',
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
    chapter: 'personal',
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
    chapter: 'personal',
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
    chapter: 'personal',
    book: 'grammar',
    regel: 'possessiv-endungen-01',
    belegt: 2,
    sentAr: 'لِي أُخْتٌ اسْمُهَا آمِنَةُ.',
    sentDe: 'Ich habe eine Schwester, ihr Name ist Āmina.',
    mnemo: 'Deinem Lehrer genügt dafür ein Wort: „Ha, mit Elif“. Genau daran erkennst du sie — dasselbe Hāʾ wie beim „sein“, aber ein Alif dahinter macht es weiblich: اسْمُهُ gegen اسْمُهَا (Seite 61).'
  },

  /* ---------------------------------------------------------------------
     DIE VIERZEHN PRONOMEN DER VERGANGENHEIT — Folge 18, Einschub 10:14–24:22

     Elias am 24.08.2026: „wir haben beim letzten video die konjuktionen der
     vergangenheit besprochen … ich brauche alle konjuktionen aus dem video
     die da genannt werden als karteikarten bzw als eigene vokabeln."
     Und danach: „wichtig ist aber auch das es hier um die vergangenheit geht."
     Deshalb traegt JEDE Karte ihre Maadii-Endung im `deNeben` — das Feld wird
     angezeigt UND ist suchbar.

     ⭐ Warum sie hier stehen muessen, gemessen am 24.08.2026 ueber alle 4473
     Woerter aller vier Wege, NFC-normalisiert: SECHS davon (هُوَ هِيَ هُمْ أَنَا
     نَحْنُ أَنْتَ) stehen in madina-1 Kapitel 24 — Elias ist bei Kapitel 12, sie
     sind also nicht freigeschaltet. Die anderen SECHS (هُمَا هُنَّ أَنْتِ أَنْتُمَا
     أَنْتُمْ أَنْتُنَّ) gibt es in keiner Quelle. Sein Lehrer hat damit Stoff
     vorgezogen, den das Buch erst zwoelf Kapitel spaeter bringt.
     ⚠️ Ein grep hatte هُمَا zuerst in madina-2 gefunden — das war ein
     Teiltreffer in einem laengeren Wort. [[namenssuche_trifft_die_welt]]

     ⛔ VIERZEHN FORMEN, ZWOELF WOERTER. هُمَا steht fuer den maennlichen und
     den weiblichen Dual, أَنْتُمَا ebenso. Zwei Karten mit identischer
     Vorderseite waeren beim Abfragen nicht unterscheidbar; die Karte fuer
     هُمَا traegt deshalb BEIDE Verbformen.

     ⛔ HERKUNFT: Nichts hier ist von mir konjugiert. Alle vierzehn Formen hat
     der Lehrer im Video vorgesagt. Die drei Saetze mit إِلَى الْمَسْجِدِ hat er
     woertlich gesprochen (هُوَ, هُمَا, هُمْ); die uebrigen neun setzen die
     belegte Form in denselben belegten Rahmen. مَسْجِدٌ (Kap. 1) und إِلَى
     (Kap. 4) sind beide freigeschaltet. Goal-Prompt E.1.

     ⭐ ESELSBRUECKEN: Fuenf haben einen Vers aus seinem auswendigen Bereich
     (gemessen mit einer NFC-Suche an Wortgrenzen ueber Sure 1, 67, 93–114):
     هُوَ 112:1 · هِيَ 97:5 · هُمْ 107:5 · أَنْتُمْ 109:3 · أَنَا 109:4.
     Die anderen sieben bekommen den Merkhaken des Lehrers statt eines Verses
     ausserhalb seines Bereichs. [[quranbezug_nur_auswendiges]]
     --------------------------------------------------------------------- */
  {
    id: "gram-pron-huwa",
    gender: "masculine",
    ar: "هُوَ",
    de: "er",
    deNeben: "Vergangenheit ohne Endung: ذَهَبَ (er ging)",
    type: 'particle',
    chapter: 'personal',
    book: 'grammar',
    regel: 'verb-madi-endungen-01',
    belegt: 14,
    sentAr: "هُوَ ذَهَبَ إِلَى الْمَسْجِدِ.",
    sentDe: "Er ging in die Moschee.",
    mnemo: "قُلْ هُوَ اللَّهُ أَحَدٌ — der erste Vers von سُورَةُ الْإِخْلَاصِ, den du auswendig kannst. Genau dieses هُوَ. In der Vergangenheit ist er der Einfache: er bekommt gar keine Endung, ذَهَبَ steht nackt da. Alle dreizehn anderen hängen etwas an — er nicht."
  },
  {
    id: "gram-pron-huma-m",
    ar: "هُمَا",
    de: "sie beide (zwei Personen)",
    deNeben: "Vergangenheit: ذَهَبَا (m) · ذَهَبَتَا (f)",
    type: 'particle',
    chapter: 'personal',
    book: 'grammar',
    regel: 'verb-madi-endungen-01',
    belegt: 2,
    sentAr: "هُمَا ذَهَبَا إِلَى الْمَسْجِدِ.",
    sentDe: "Sie beide gingen in die Moschee.",
    mnemo: "Das ist der Dual — im Deutschen gibt es ihn nicht, im Arabischen ist er eine eigene Zahl: genau zwei. Ein Wort für Männer und Frauen; welche gemeint sind, sagt erst das Verb. Männlich hängt dein Lehrer nur ein Alif an: ذَهَبَ → ذَهَبَا. Weiblich kommt das تْ der Einzahl davor: ذَهَبَتْ → ذَهَبَتَا. Und das Alif steckt schon im Pronomen — هُمَـا endet darauf, beide Verbformen auch."
  },
  {
    id: "gram-pron-hum",
    gender: "masculine",
    ar: "هُمْ",
    de: "sie (ab drei, männlich)",
    deNeben: "Vergangenheit auf ـُوا: ذَهَبُوا (sie gingen)",
    type: 'particle',
    chapter: 'personal',
    book: 'grammar',
    regel: 'verb-madi-endungen-01',
    belegt: 3,
    sentAr: "هُمْ ذَهَبُوا إِلَى الْمَسْجِدِ.",
    sentDe: "Sie gingen in die Moschee.",
    mnemo: "الَّذِينَ هُمْ — so fängt Vers 5 von سُورَةُ الْمَاعُونِ an, die du auswendig kannst. Dort steht هُمْ genau so allein, als eigenes Wort. Der Plural fängt im Arabischen erst bei drei an: zwei sind هُمَا. Die Endung ـُوا schreibt man mit einem Alif, das man nicht spricht — wie bei قَالُوا."
  },
  {
    id: "gram-pron-hiya",
    gender: "feminine",
    ar: "هِيَ",
    de: "sie (eine)",
    deNeben: "Vergangenheit auf ـَتْ: ذَهَبَتْ (sie ging)",
    type: 'particle',
    chapter: 'personal',
    book: 'grammar',
    regel: 'verb-madi-endungen-01',
    belegt: 10,
    sentAr: "هِيَ ذَهَبَتْ إِلَى الْمَسْجِدِ.",
    sentDe: "Sie ging in die Moschee.",
    mnemo: "سَلَامٌ هِيَ — so beginnt der letzte Vers von سُورَةُ الْقَدْرِ (97:5), die du auswendig kannst. Die weibliche Endung ist dasselbe تْ, das du von der تَاء مَرْبُوطَة kennst — nur hier als offenes تَاء مَفْتُوحَة geschrieben, weil noch etwas folgen kann. Dein Lehrer sagt dazu ausdrücklich: „ein offenes Ta.“"
  },
  {
    id: "gram-pron-hunna",
    gender: "feminine",
    ar: "هُنَّ",
    de: "sie (ab drei, weiblich)",
    deNeben: "Vergangenheit auf ـْنَ: ذَهَبْنَ (sie gingen)",
    type: 'particle',
    chapter: 'personal',
    book: 'grammar',
    regel: 'verb-madi-endungen-01',
    belegt: 1,
    sentAr: "هُنَّ ذَهَبْنَ إِلَى الْمَسْجِدِ.",
    sentDe: "Sie (die Frauen) gingen in die Moschee.",
    mnemo: "Das weibliche Gegenstück zu هُمْ, das du aus سُورَةُ الْمَاعُونِ kennst: هُمْ endet auf م, هُنَّ auf ن. Genau dieses ن hängst du ans Verb — ذَهَبْنَ. Merk dir das ن als das weibliche Zeichen im Plural: هُنَّ ← ذَهَبْنَ."
  },
  {
    id: "gram-pron-anta",
    gender: "masculine",
    ar: "أَنْتَ",
    de: "du (männlich)",
    deNeben: "Vergangenheit auf ـْتَ: ذَهَبْتَ (du gingst)",
    type: 'particle',
    chapter: 'personal',
    book: 'grammar',
    regel: 'verb-madi-endungen-01',
    belegt: 5,
    sentAr: "أَنْتَ ذَهَبْتَ إِلَى الْمَسْجِدِ.",
    sentDe: "Du gingst in die Moschee.",
    mnemo: "Hier fängt der Trick deines Lehrers an: bei der zweiten Person steckt die Endung schon im Pronomen. أَنْ|تَ — was hinter dem أَنْ steht, hängst du ans Verb: ذَهَبْ|تَ. Das gilt für alle fünf Anredeformen, und deshalb ist die zweite Person die einfachste von allen."
  },
  {
    id: "gram-pron-antuma",
    ar: "أَنْتُمَا",
    de: "ihr beide (zwei Personen)",
    deNeben: "Vergangenheit auf ـْتُمَا: ذَهَبْتُمَا — für Männer und Frauen gleich",
    type: 'particle',
    chapter: 'personal',
    book: 'grammar',
    regel: 'verb-madi-endungen-01',
    belegt: 3,
    sentAr: "أَنْتُمَا ذَهَبْتُمَا إِلَى الْمَسْجِدِ.",
    sentDe: "Ihr beide gingt in die Moschee.",
    mnemo: "Der Trick der zweiten Person trägt auch hier: أَنْ|تُمَا wird zu ذَهَبْ|تُمَا. Und dieses eine Wort spart dir eine ganze Form — im Dual der Anrede gibt es keinen Unterschied zwischen Männern und Frauen. Dein Lehrer sagt es ausdrücklich: „Die Dualform bei der zweiten Person ist identisch. Bei der dritten Person nicht.“ Vierzehn Pronomen, aber nur dreizehn verschiedene Verbformen."
  },
  {
    id: "gram-pron-antum",
    gender: "masculine",
    ar: "أَنْتُمْ",
    de: "ihr (ab drei, männlich)",
    deNeben: "Vergangenheit auf ـْتُمْ: ذَهَبْتُمْ (ihr gingt)",
    type: 'particle',
    chapter: 'personal',
    book: 'grammar',
    regel: 'verb-madi-endungen-01',
    belegt: 2,
    sentAr: "أَنْتُمْ ذَهَبْتُمْ إِلَى الْمَسْجِدِ.",
    sentDe: "Ihr gingt in die Moschee.",
    mnemo: "وَلَا أَنْتُمْ عَابِدُونَ — aus سُورَةُ الْكَافِرُونَ, die du auswendig kannst; dort steht es sogar zweimal, in Vers 3 und Vers 5. Dasselbe م wie in هُمْ zeigt auch hier den männlichen Plural. Und der Trick greift: أَنْ|تُمْ ← ذَهَبْ|تُمْ."
  },
  {
    id: "gram-pron-anti",
    gender: "feminine",
    ar: "أَنْتِ",
    de: "du (weiblich)",
    deNeben: "Vergangenheit auf ـْتِ: ذَهَبْتِ (du gingst)",
    type: 'particle',
    chapter: 'personal',
    book: 'grammar',
    regel: 'verb-madi-endungen-01',
    belegt: 1,
    sentAr: "أَنْتِ ذَهَبْتِ إِلَى الْمَسْجِدِ.",
    sentDe: "Du (Frau) gingst in die Moschee.",
    mnemo: "Der Unterschied zu أَنْتَ ist ein einziges Zeichen: Fatḥa oben für den Mann, Kasra unten für die Frau. Beim Verb genauso — ذَهَبْتَ gegen ذَهَبْتِ. Die Kasra als weibliches Zeichen kennst du schon von der Besitzendung ـكِ (اسْمُكِ — dein Name, zu einer Frau gesagt)."
  },
  {
    id: "gram-pron-antunna",
    gender: "feminine",
    ar: "أَنْتُنَّ",
    de: "ihr (ab drei, weiblich)",
    deNeben: "Vergangenheit auf ـْتُنَّ: ذَهَبْتُنَّ (ihr gingt)",
    type: 'particle',
    chapter: 'personal',
    book: 'grammar',
    regel: 'verb-madi-endungen-01',
    belegt: 2,
    sentAr: "أَنْتُنَّ ذَهَبْتُنَّ إِلَى الْمَسْجِدِ.",
    sentDe: "Ihr (die Frauen) gingt in die Moschee.",
    mnemo: "Wieder das ن als weibliches Zeichen im Plural, genau wie bei هُنَّ — und wieder mit Schadda. Setz sie nebeneinander: هُنَّ ذَهَبْنَ für „sie“, أَنْتُنَّ ذَهَبْتُنَّ für „ihr“. Und der Trick der zweiten Person trägt auch hier: أَنْ|تُنَّ ← ذَهَبْ|تُنَّ."
  },
  {
    id: "gram-pron-ana",
    ar: "أَنَا",
    de: "ich",
    deNeben: "Vergangenheit auf ـْتُ: ذَهَبْتُ (ich ging)",
    type: 'particle',
    chapter: 'personal',
    book: 'grammar',
    regel: 'verb-madi-endungen-01',
    belegt: 3,
    sentAr: "أَنَا ذَهَبْتُ إِلَى الْمَسْجِدِ.",
    sentDe: "Ich ging in die Moschee.",
    mnemo: "وَلَا أَنَا عَابِدٌ — aus سُورَةُ الْكَافِرُونَ, Vers 4, die du auswendig kannst. Achtung, hier hilft der Trick der zweiten Person NICHT: أَنَا endet auf Alif, die Verbform aber auf ـْتُ. Merk dir stattdessen das Paar am Ende der Tabelle: ich ذَهَبْتُ, wir ذَهَبْنَا — die beiden gehören zusammen."
  },
  {
    id: "gram-pron-nahnu",
    ar: "نَحْنُ",
    de: "wir",
    deNeben: "Vergangenheit auf ـْنَا: ذَهَبْنَا (wir gingen)",
    type: 'particle',
    chapter: 'personal',
    book: 'grammar',
    regel: 'verb-madi-endungen-01',
    belegt: 2,
    sentAr: "نَحْنُ ذَهَبْنَا إِلَى الْمَسْجِدِ.",
    sentDe: "Wir gingen in die Moschee.",
    mnemo: "Das ن von نَحْنُ ist dasselbe ن, das ans Verb geht: نَحْنُ ← ذَهَبْنَا. Und daneben das Paar, das man leicht verwechselt: هُنَّ ذَهَبْنَ endet auf نَ ohne Alif, نَحْنُ ذَهَبْنَا mit Alif. Das Alif macht aus „die Frauen“ ein „wir“."
  },

  /* ==================================================================
     Wörter, die Elias freigegeben hat: خَيْرٌ und مَعَ am 26.08.2026
     („ja mach"), الَّذِي am 05.09.2026 („das bräuchte ich aber natürlich als
     karteikarte").

     ⛔ الَّتِي stand hier auch — und musste wieder raus.
     pruefe-duplikate.js fand es als Buchvokabel in madina-2 K21 (id 46401),
     und madina-2 K1-24 IST freigeschaltet. Die To-Do behauptete „Alle drei
     fehlen im Bestand"; das war gegen vocab-data.js gemessen, nicht gegen
     den vollen Abzug. Die vorhandene Karte hat stattdessen ihre Merkhaken
     bekommen (data/eselsbruecken.js). [[werkzeug_misst_kleineren_bestand]]

     ⚠️ مَعَ und الَّذِي stehen beide in madina-1 K24 — freigeschaltet sind
     dort nur K1-12, also kein Duplikat. Gemessen, nicht angenommen.

     ⛔ KEIN ERFUNDENER BEISPIELSATZ. Wo es keinen belegten Satz gibt,
     bleibt sentAr leer und der Koranvers trägt die Illustration —
     Goal-Prompt E.1 und die Regel aus /volles-programm: „Lieber KEIN
     Satz als ein gestellter."
     ================================================================== */
  {
    id: "gram-zarf-maa",
    ar: "مَعَ",
    de: "mit, bei",
    /* Wie تَحْتَ in vocab-data.js: ein ظَرْف wird in dieser App als
       particle geführt. Nicht geraten — dieselbe Wortart wie das
       Ortswort, das der Unterricht behandelt hat. */
    type: 'particle',
    chapter: 'personal',
    book: 'grammar',
    /* ⛔ ABSICHTLICH KEINE `regel`. zarf-01 nennt تَحْتَ, أَمامَ und
       خَلْفَ — مَعَ steht dort NICHT, der Unterricht hat es nicht
       behandelt. Eine Markierung wäre eine Regelaussage, die kein
       Lehrer gemacht hat.
       ⭐ Die App behandelt مَعَ trotzdem richtig: js/irab.js:113 führt
       es in ZURUF, die Funktionsanzeige stimmt also (A8). */
    belegt: 1,
    /* Aus dem Lehrbuch — dort steht مَعَ mit angehängtem Pronomen
       (مَعَكِ), was genau der Normalfall ist. */
    sentAr: "وَمَنْ هَذِهِ الْفَتَاةُ الَّتِي مَعَكِ؟ أَهِيَ أُخْتُكِ؟",
    sentDe: "Und wer ist dieses Mädchen, das bei dir ist? Ist sie deine Schwester?",
    quran: {
      surah: "Ash-Sharh",
      ayah: "94:6",
      ar: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
      de: "gewiß, mit der Erschwernis ist Erleichterung"
    },
    mnemo: "إِنَّ مَعَ الْعُسْرِ يُسْرًا — aus سُورَةُ الشَّرْح, die du auswendig kannst, und dort steht مَعَ zweimal hintereinander (Vers 5 und 6). Wie تَحْتَ ist es kein حَرْف جَرّ, wirkt aber genauso: das Wort dahinter wird مَجْرُور — الْعُسْرِ mit Kasra."
  },
  {
    id: "gram-khayr",
    ar: "خَيْرٌ",
    de: "besser; das Gute",
    /* Ein Wort mit Tanwīn ist ein اِسْم — das ist kein Ratschluss,
       sondern die Probe, die auch js/irab.js benutzt: ein Verb trägt
       nie Tanwīn, eine Partikel auch nicht.
       ⚠️ Dass es ein اِسْم تَفْضِيل (Elativ) ist, steht bewusst NICHT
       als Wortart da — die App kennt diese Kategorie nicht, und sie
       zu erfinden wäre eine Grammatikaussage ohne Unterrichtsbeleg. */
    type: 'noun',
    /* Belegt im arabicroots-Abzug: اِخْتِيَارٌ (Auswahl) und خِيرَة
       (beste Wahl) tragen beide root "خ ي ر". */
    root: "خ ي ر",
    chapter: 'personal',
    book: 'grammar',
    belegt: 1,
    /* ⛔ KEIN sentAr. In allen vier Satzquellen kommt خَيْر kein
       einziges Mal vor, und einen Satz zu bauen hieße, Vokalisation
       und Kasus selbst zu setzen. Der Vers unten trägt die
       Illustration; er ist belegt und steht in seinem Auswendigen. */
    quran: {
      surah: "Ad-Duhaa",
      ayah: "93:4",
      ar: "وَلَلْآخِرَةُ خَيْرٌ لَكَ مِنَ الْأُولَىٰ",
      de: "Und das Jenseits ist wahrlich besser für dich als das Diesseits"
    },
    mnemo: "وَلَلْآخِرَةُ خَيْرٌ لَكَ مِنَ الْأُولَىٰ — aus سُورَةُ الضُّحَى, die du auswendig kannst. Die Bauform ist immer dieselbe: خَيْرٌ … مِنْ … heißt „besser als“. Und die Wurzel خ ي ر kennst du schon aus اِخْتِيَارٌ (Auswahl) — wer wählt, sucht sich das Bessere aus."
  },
  {
    id: "gram-mawsul-alladhi",
    ar: "الَّذِي",
    de: "der, welcher (männliche Form)",
    deNeben: "weiblich: الَّتِي",
    /* Wie die Buchvokabel im Abzug (madina-1 K24, id 50166): particle.
       Nicht geraten, sondern von dort übernommen. */
    type: 'particle',
    /* ⭐ Das Geschlecht IST hier die Lektion: welches der beiden
       Relativpronomen hineingehört, entscheidet allein das Geschlecht des
       Wortes davor — nicht, ob es eine Person ist oder eine Sache. Der
       Genus-Chip auf der Karte zeigt genau das an. */
    gender: "masculine",
    chapter: 'personal',
    book: 'grammar',
    regel: 'ismun-mawsul-alladhi-01',
    belegt: 1,
    /* Aus dem Lehrbuch (lehrbuch-saetze.js) — nicht gebaut. */
    sentAr: "الْكِتَابُ الَّذِي عَلَى الْمَكْتَبِ لِلْمُدَرِّسِ.",
    sentDe: "Das Buch, das auf dem Schreibtisch ist, gehört dem Lehrer.",
    quran: {
      surah: "Al-Humazah",
      ayah: "104:2",
      ar: "الَّذِي جَمَعَ مَالًا وَعَدَّدَهُ",
      de: "der Besitz zusammenträgt und ihn zählt und immer wieder zählt"
    },
    /* ⭐⭐ Beide Formen stehen in DERSELBEN Sure, fünf Verse auseinander —
       104:2 الَّذِي und 104:7 الَّتِي. Ein Merkhaken, den man nicht bauen
       muss, weil er schon dasteht. Belegt mit werkzeuge/vers.mjs 104. */
    mnemo: "سُورَةُ الْهُمَزَة, die du auswendig kannst, hat BEIDE Formen — fünf Verse auseinander. Vers 2: الَّذِي جَمَعَ مَالًا (der Besitz zusammenträgt), Vers 7: نَارُ اللَّهِ … الَّتِي تَطَّلِعُ. ⭐ Warum einmal so und einmal so? نَار (Feuer) ist weiblich, der Stichler aus Vers 1 nicht. Das Geschlecht des Wortes DAVOR entscheidet — nicht, ob es um eine Person geht oder um eine Sache."
  }
];
