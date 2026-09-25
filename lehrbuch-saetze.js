/* lehrbuch-saetze.js -- Beispielsaetze direkt aus dem Lehrwerk
 *
 * Warum diese Datei ueberhaupt existiert:
 * Eine Grammatikregel ist in der App nur erreichbar, wenn ein Beispielsatz sie
 * zeigt (SENTENCE_TAGS -> Unterstreichung im Satz-Modus). Die Saetze in
 * vocab-data.js stammen aus arabicroots und sind rein nominal - kein einziger
 * enthaelt ein Verb, ein Fragewort هَلْ / لِمَنْ, einen Gottesnamen oder einen
 * Eigennamen. 22 Regeln lagen deshalb unerreichbar in grammar-data.js.
 *
 * Die Loesung ist nicht, Saetze zu erfinden (Goal-Prompt E.1), sondern sie aus
 * dem Lehrwerk zu holen: Madina Buch 1, Elias' eigenes beschriftetes Exemplar
 * (SamsungNotes-Export, PDF 2ab9777c-db3d-cf97-0000-019eb2fa6774). Jeder Satz
 * unten traegt seine Buchseite; alles ist dort nachschlagbar.
 *
 * Warum eine eigene Datei und nicht vocab-data.js:
 * vocab-data.js ist ein Spiegel der arabicroots-Datenbank und wird neu erzeugt,
 * sobald neue Kapitel freigeschaltet sind. Eingetragene Lehrbuchsaetze waeren
 * dabei jedes Mal verloren. Deshalb liegen sie getrennt - der Satz-Modus liest
 * beide Quellen.
 *
 * Zur Vokalisation: Wo das Buch den Satz vollstaendig vokalisiert druckt (die
 * Lektionstexte), steht er hier genau so. In den Uebungsteilen druckt das Buch
 * teilweise ohne Taschkil - dort ist die Standardvokalisation ergaenzt, die die
 * Uebung selbst verlangt ("lies mit Endungen"). Solche Saetze tragen
 * `vokalisationErgaenzt: true`, damit nachpruefbar bleibt, was vom Buch kommt
 * und was Regelanwendung ist.
 */
const LEHRBUCH_SAETZE = [
  { id: 'mb1-13-1', seite: 13, kapitel: 2,
    sentAr: 'أَذَلِكَ قِطٌّ؟ لَا، ذَلِكَ كَلْبٌ.',
    sentDe: 'Ist jenes eine Katze? Nein, jenes ist ein Hund.' },

  { id: 'mb1-15-1', seite: 15, kapitel: 3, vokalisationErgaenzt: true,
    sentAr: 'الْقَمِيصُ وَسِخٌ.',
    sentDe: 'Das Hemd ist schmutzig.' },

  { id: 'mb1-17-1', seite: 17, kapitel: 3,
    sentAr: 'الطَّالِبُ مَرِيضٌ.',
    sentDe: 'Der Student ist krank.' },

  { id: 'mb1-21-1', seite: 21, kapitel: 4,
    sentAr: 'أَيْنَ آمِنَةُ؟ هِيَ فِي الْمَطْبَخِ.',
    sentDe: 'Wo ist Amina? Sie ist in der Küche.' },

  { id: 'mb1-24-1', seite: 24, kapitel: 4,
    sentAr: 'مِنْ أَيْنَ أَنْتَ؟ أَنَا مِنَ الْيَابَانِ.',
    sentDe: 'Woher bist du? Ich bin aus Japan.' },

  { id: 'mb1-25-1', seite: 25, kapitel: 4, vokalisationErgaenzt: true,
    sentAr: 'مَنْ مِنَ الصِّينِ؟ عَمَّارٌ مِنَ الصِّينِ.',
    sentDe: 'Wer ist aus China? Ammar ist aus China.' },

  { id: 'mb1-25-2', seite: 25, kapitel: 4, vokalisationErgaenzt: true,
    sentAr: 'خَرَجَ الْمُدَرِّسُ مِنَ الْفَصْلِ وَذَهَبَ إِلَى الْمُدِيرِ.',
    sentDe: 'Der Lehrer verließ das Klassenzimmer und ging zum Direktor.' },

  { id: 'mb1-27-1', seite: 27, kapitel: 5,
    sentAr: 'لَا، هَذَا كِتَابُ حَامِدٍ.',
    sentDe: 'Nein, dies ist Hamids Buch.' },

  { id: 'mb1-27-2', seite: 27, kapitel: 5,
    sentAr: 'أَيْنَ دَفْتَرُ عَمَّارٍ؟ هُوَ عَلَى مَكْتَبِ الْمُدَرِّسِ.',
    sentDe: 'Wo ist Ammars Heft? Es liegt auf dem Schreibtisch des Lehrers.' },

  { id: 'mb1-27-3', seite: 27, kapitel: 5,
    sentAr: 'أَيْنَ حَقِيبَةُ الْمُدَرِّسِ؟ هِيَ تَحْتَ الْمَكْتَبِ.',
    sentDe: 'Wo ist die Tasche des Lehrers? Sie ist unter dem Schreibtisch.' },

  { id: 'mb1-28-1', seite: 28, kapitel: 5,
    sentAr: 'الْقُرْآنُ كِتَابُ اللهِ.',
    sentDe: 'Der Koran ist das Buch Allahs.' },

  { id: 'mb1-29-1', seite: 29, kapitel: 5,
    sentAr: 'أَيْنَ مَسْجِدُ رَسُولِ اللهِ؟ هُوَ فِي الْمَدِينَةِ الْمُنَوَّرَةِ.',
    sentDe: 'Wo ist die Moschee des Gesandten Allahs? Sie ist in Madina al-Munawwara.' },

  { id: 'mb1-30-1', seite: 30, kapitel: 5,
    sentAr: 'مُحَمَّدٌ رَسُولُ اللهِ.',
    sentDe: 'Muhammad ist der Gesandte Allahs.' },

  { id: 'mb1-30-2', seite: 30, kapitel: 5, vokalisationErgaenzt: true,
    sentAr: 'أَيْنَ الْكَلْبُ؟ هُوَ تَحْتَ السَّيَّارَةِ.',
    sentDe: 'Wo ist der Hund? Er ist unter dem Auto.' },

  { id: 'mb1-34-1', seite: 34, kapitel: 6,
    sentAr: 'لِمَنْ هَذِهِ؟ هَذِهِ لِخَالِدٍ.',
    /* هَذِهِ steht hier ohne Nomen (im Buch zeigt ein Bild darauf). Wörtlich
       "wem gehört diese" ergibt im Deutschen keinen Satz, deshalb "das hier". */
    sentDe: 'Wem gehört das hier? Das gehört Khalid.' },

  { id: 'mb1-37-1', seite: 37, kapitel: 7,
    sentAr: 'مُحَمَّدٌ طَالِبٌ.',
    sentDe: 'Muhammad ist Student.' },

  { id: 'mb1-37-2', seite: 37, kapitel: 7,
    sentAr: 'الْبَابُ مُغْلَقٌ.',
    sentDe: 'Die Tür ist geschlossen.' },

  { id: 'mb1-42-1', seite: 42, kapitel: 8,
    sentAr: 'هَذَا الْبَيْتُ لِلتَّاجِرِ وَذَلِكَ الْبَيْتُ لِلطَّبِيبِ.',
    sentDe: 'Dieses Haus gehört dem Händler und jenes Haus gehört dem Arzt.' },

  /* ⭐ 17.09.2026 nachgesehen (PDF-Seite 55, 500 dpi): das Buch druckt am
     Satzanfang اِسْمُ MIT Kasra unter dem Alif, mitten im Satz وٱسْمُ mit Wasla.
     Hier stand اسْمُ ohne Kasra — pruefe-taschkil.js meldete es, Elias hat die
     Taschkīl-Fragen am 16.09. übergeben. محمود, الطبيب, سعيد sind im Druck ohne
     Zeichen, deshalb jetzt auch `vokalisationErgaenzt`. */
  { id: 'mb1-42-2', seite: 42, kapitel: 8, vokalisationErgaenzt: true,
    gedruckt: 'اِسْمُ التاجرِ und وٱسْمُ vokalisiert; محمود, الطبيب, سعيد ohne Zeichen',
    sentAr: 'اِسْمُ التَّاجِرِ مَحْمُودٌ وَاسْمُ الطَّبِيبِ سَعِيدٌ.',
    sentDe: 'Der Name des Händlers ist Mahmud und der Name des Arztes ist Said.' },

  { id: 'mb1-42-3', seite: 42, kapitel: 8,
    sentAr: 'بَيْتُ التَّاجِرِ أَمَامَ الْمَسْجِدِ وَبَيْتُ الطَّبِيبِ خَلْفَ الْمَدْرَسَةِ.',
    sentDe: 'Das Haus des Händlers ist vor der Moschee und das Haus des Arztes hinter der Schule.' },

  { id: 'mb1-43-1', seite: 43, kapitel: 8,
    sentAr: 'لِمَنْ هَذَا الْكِتَابُ؟ هَذَا الْكِتَابُ لِمُحَمَّدٍ.',
    sentDe: 'Wem gehört dieses Buch? Dieses Buch gehört Muhammad.' },

  { id: 'mb1-46-1', seite: 46, kapitel: 9, vokalisationErgaenzt: true,
    sentAr: 'هَذَا الْكِتَابُ لِعِيسَى وَذَلِكَ الْكِتَابُ لِمُوسَى.',
    sentDe: 'Dieses Buch gehört Isa und jenes Buch gehört Musa.' },

  { id: 'mb1-46-2', seite: 46, kapitel: 9, vokalisationErgaenzt: true,
    sentAr: 'السَّبُّورَةُ أَمَامَ الطَّالِبِ وَهِيَ خَلْفَ الْمُدَرِّسِ.',
    sentDe: 'Die Tafel ist vor dem Studenten und sie ist hinter dem Lehrer.' },

  { id: 'mb1-51-1', seite: 51, kapitel: 10, vokalisationErgaenzt: true,
    sentAr: 'لِمَنْ تِلْكَ السَّيَّارَةُ الْجَمِيلَةُ؟ هِيَ لِلْمُدِيرِ الْجَدِيدِ.',
    sentDe: 'Wem gehört jenes schöne Auto? Es gehört dem neuen Direktor.' },

  { id: 'mb1-51-2', seite: 51, kapitel: 10, vokalisationErgaenzt: true,
    sentAr: 'اللُّغَةُ الْعَرَبِيَّةُ سَهْلَةٌ.',
    sentDe: 'Die arabische Sprache ist leicht.' },

  /* ⭐ 17.09.2026 nachgesehen (PDF-Seite 84, 600 dpi): ما ٱسْمُكِ mit Wasla
     (mitten im Satz, stumm — richtig ohne Kasra), aber اسمي آمنةُ nur mit der
     Endung. اِسْمِي beginnt den zweiten Satz; dort setzt das Buch auf S. 42 die
     Kasra (اِسْمُ التاجرِ). Die Kasra hier ist also die Schreibung des Buches am
     Satzanfang, keine eigene — und die übrige Vokalisierung war schon ergänzt. */
  { id: 'mb1-63-1', seite: 63, kapitel: 12, vokalisationErgaenzt: true,
    gedruckt: 'ما ٱسْمُكِ mit Wasla, Sukun, Damma und Kasra; اسمي آمنةُ nur mit der Endung',
    sentAr: 'مَا اسْمُكِ؟ اِسْمِي آمِنَةُ.',
    sentDe: 'Wie heißt du? Mein Name ist Amina.' },

  { id: 'mb1-63-2', seite: 63, kapitel: 12,
    sentAr: 'لَا. هِيَ بِنْتُ عَمِّي.',
    /* عَمّ ist ausdrücklich der Onkel väterlicherseits (mütterlicherseits wäre
       خَال). "Cousine" zuerst, weil das die Bedeutung ist; die wörtliche Form
       dahinter, weil genau sie die إِضَافَة zeigt, um die es im Kapitel geht. */
    sentDe: 'Nein. Sie ist meine Cousine — die Tochter meines Onkels väterlicherseits.' },

  /* ===== Nachtrag 25.08.2026: die Saetze zu Folge 17 (Kapitel 12) ==========
   *
   * Folge 17 war die einzige Folge mit Rohmaterial und NULL Regeln
   * (rueckstand.mjs: "17 ... OFFEN"). Vier neue Regeln kommen aus ihr; drei
   * brauchten einen Satz, der sie zeigt.
   *
   * Beide Saetze unten stehen im LEKTIONSTEXT auf Buchseite 63 — dort, wo das
   * Buch vollstaendig vokalisiert druckt. Bei 600 dpi nachgemessen. */

  /* ⭐ Der einzige Beleg fuer بِـ im ganzen Bestand. Gedruckt ist die Kasrah
     unter dem بـ UND das Kasratan unter dem رٍ — beides eindeutig bei 600 dpi.
     Genau danach fragt ein Mitschueler in Folge 17 bei 10:47: "Aber warum ist
     bi khayrin? Warum nicht bi khayri?" — "Weil das Wort khayr unbestimmt
     ist." Der Satz traegt also die Regel und ihre Begruendung. */
  { id: 'mb1-63-3', seite: 63, kapitel: 12, vokalisationErgaenzt: true,
    gedruckt: 'بِخَيْرٍ und الْحَمْدُ vollständig; أنا und و ohne Zeichen',
    sentAr: 'أَنَا بِخَيْرٍ وَالْحَمْدُ لِلَّهِ.',
    sentDe: 'Mir geht es gut, und das Lob gebührt Allah.' },

  /* ⭐ Der einzige Beleg fuer الَّتِي. Das Wort ist im Buch VOLL vokalisiert
     gedruckt — Schadda mit Fatha auf dem Lam, Kasra unter dem Ta —, also
     nichts daran ergaenzt. Der Rest der Zeile traegt nur die Kasusendungen.
     Der Lehrer geht in Folge 17 ab 32:06 zehn Uebungssaetze durch, in denen
     zwischen الَّذِي und الَّتِي zu entscheiden ist. */
  { id: 'mb1-63-4', seite: 63, kapitel: 12, vokalisationErgaenzt: true,
    gedruckt: 'الْفَتَاةُ الَّتِي مَعَكِ und أُخْتُكِ vollständig; ومن هذه أهي ohne Zeichen',
    sentAr: 'وَمَنْ هَذِهِ الْفَتَاةُ الَّتِي مَعَكِ؟ أَهِيَ أُخْتُكِ؟',
    sentDe: 'Und wer ist dieses Mädchen, das bei dir ist? Ist sie deine Schwester?' },

  /* ===== Nachtrag 18.08.2026: die Saetze zu den unerreichbaren Regeln ======
   *
   * Neun Regeln aus Folge 14/15/16 lagen in grammar-data.js, ohne dass ein
   * einziger der 198 vorhandenen Saetze sie zeigt - keiner enthaelt عِنْدَ,
   * لِي, فِيهِ, أَبُو/أَخُو oder eine Besitzendung. Gemessen, nicht geschaetzt:
   * die Suche nach jedem Ausloeser ergab 0 Treffer.
   *
   * Gefunden wurden sie auf Buchseite 61 (Lektion 11, بَيْتِي) und 53. Die
   * Lektion 11 traegt gleich fuenf davon auf einer Seite.
   *
   * ⚠️ ZUR VOKALISATION - hier steckt die eigentliche Sorgfalt:
   * Das Buch druckt in Lektion 11 NUR die Kasusendungen. Das ist bei 600 dpi
   * nachgemessen; bei 110 dpi war nicht zu unterscheiden, ob ueber dem Alif
   * von اسمه eine Maddah oder eine Waslah steht. Alles andere ist ergaenzt,
   * deshalb `vokalisationErgaenzt: true` - und `gedruckt` sagt bei jedem Satz,
   * was tatsaechlich im Buch steht.
   *
   * Jedes Wort wurde gegen den vorhandenen Bestand geprueft (vocab-data.js,
   * diese Datei UND grammar-data.js, wo die Regeln ihre eigenen belegten
   * Formen mitfuehren). Belegt gefunden: فِيهِ, لِي, مَاذَا, الَّذِي,
   * لِلْمُدَرِّسِ, عِنْدَ. Nicht im Bestand und damit neu: أُسَامَةُ, سُعَادُ,
   * دَفْتَر, حَدِيقَة - sie stehen auf der Liste fuer Elias.
   */
  { id: 'mb1-61-1', seite: 61, kapitel: 11, vokalisationErgaenzt: true,
    gedruckt: 'ohne jedes Zeichen',
    sentAr: 'هَذَا بَيْتِي. بَيْتِي أَمَامَ الْمَسْجِدِ.',
    sentDe: 'Dies ist mein Haus. Mein Haus ist vor der Moschee.' },

  /* Der Satz, an dem أُسَامَةُ haengt: das Buch setzt dort eine einzelne
     Dammah, waehrend أَخٌ, وَاحِدٌ, أُخْتٌ und وَاحِدَةٌ in derselben Zeile
     das Tanwin tragen. Der Gegensatz ist gedruckt und musste nicht ergaenzt
     werden - genau er ist die Regel. */
  { id: 'mb1-61-2', seite: 61, kapitel: 11, vokalisationErgaenzt: true,
    gedruckt: 'أَخٌ وَاحِدٌ أُخْتٌ وَاحِدَةٌ mit Tanwin, أُسَامَةُ und سُعَادُ mit einfacher Dammah',
    sentAr: 'لِي أَخٌ وَاحِدٌ اسْمُهُ أُسَامَةُ، وَلِي أُخْتٌ وَاحِدَةٌ اسْمُهَا سُعَادُ.',
    sentDe: 'Ich habe einen Bruder, sein Name ist Usāma, und ich habe eine Schwester, ihr Name ist Suʿād.' },

  /* Hier druckt das Buch فِيْهِ vollstaendig vokalisiert - die Kasrah unter
     dem هـ ist also BELEGT und nicht ergaenzt. Das ist der bessere Beleg fuer
     hu-nach-kasra-01 als der Lektionstext, wo فيه ohne Zeichen steht.
     Abweichung vom Druck: das Buch setzt ein Sukun auf das ي (فِيْهِ). Diese
     Datei schreibt Langvokale sonst ohne Sukun (فِي in mb1-21-1), deshalb hier
     فِيهِ - dieselbe Form, die auch grammar-data.js fuehrt. */
  { id: 'mb1-61-3', seite: 61, kapitel: 11, vokalisationErgaenzt: true,
    gedruckt: 'فِيْهِ vollstaendig; der Rest ohne Zeichen',
    sentAr: 'مَنْ فِي هَذَا الْبَيْتِ؟ فِيهِ حَامِدٌ.',
    sentDe: 'Wer ist in diesem Haus? In ihm ist Hamid.' },

  { id: 'mb1-61-4', seite: 61, kapitel: 11, vokalisationErgaenzt: true,
    gedruckt: 'فِيْهَا vollstaendig; der Rest ohne Zeichen',
    sentAr: 'مَاذَا فِي الْحَقِيبَةِ؟ فِيهَا كِتَابِي وَقَلَمِي وَدَفْتَرِي.',
    sentDe: 'Was ist in der Tasche? In ihr sind mein Buch, mein Stift und mein Heft.' },

  /* Buchseite 53, Uebung اِقْرَأْ - dort ist الذي in allen fuenf Saetzen
     unterstrichen. Ohne jedes Vokalzeichen gedruckt, aber jedes der fuenf
     Woerter ist im Bestand vokalisiert belegt. */
  { id: 'mb1-53-1', seite: 53, kapitel: 10, vokalisationErgaenzt: true,
    gedruckt: 'ohne jedes Zeichen',
    sentAr: 'الْكِتَابُ الَّذِي عَلَى الْمَكْتَبِ لِلْمُدَرِّسِ.',
    sentDe: 'Das Buch, das auf dem Schreibtisch ist, gehört dem Lehrer.' },

  /* Buchseite 57, Uebung (3) — Frage und Antwort stehen dort als Muster.
     Die Lektion beginnt auf Buchseite 54 mit der Ueberschrift
     (١٠) الدَّرْسُ الْعَاشِرُ, deshalb kapitel 10.
     ⛔ Gedruckt ist أَعِنْـدَك mit Kaschida und OHNE Zeichen auf dem Kaf
     (Pausalform); die Endung ـكَ zaehlt der Lehrer in
     possessiv-endungen-01 mit ihrem Vokal auf, und mb1-65-1 fuehrt أَبُوكَ
     genauso. نعم steht ohne Zeichen und ist als نَعَمْ im Bestand belegt.
     Alles Uebrige steht so im Buch, bei 600 dpi nachgesehen. */
  { id: 'mb1-57-1', seite: 57, kapitel: 10, vokalisationErgaenzt: true,
    gedruckt: 'أَعِنْـدَك ohne Zeichen auf dem Kaf, نعم ganz ohne Zeichen',
    sentAr: 'أَعِنْدَكَ قَلَمٌ؟ نَعَمْ. عِنْدِي قَلَمٌ.',
    sentDe: 'Hast du einen Stift? Ja. Ich habe einen Stift.' },

  /* Buchseite 58, Musterzeile des Possessiv-Paradigmas:
     قَلَمٌ · هذا قَلَمِي · هذا قَلَمُكَ · هذا قَلَمُهُ · هذا قَلَمُهَا
     Genommen ist die zweite Zelle. Die erste doppelt mb1-61-1 (هَذَا بَيْتِي),
     und possessiv-endungen-01 haengt bisher an اسْمُكِ, also der WEIBLICHEN
     Endung — قَلَمُكَ bringt die maennliche ـكَ dazu.
     ⛔ Gedruckt ist قَلَمُكَ voll vokalisiert, هذا ohne Zeichen. */
  { id: 'mb1-58-1', seite: 58, kapitel: 10, vokalisationErgaenzt: true,
    gedruckt: 'هذا ohne Zeichen, قَلَمُكَ voll vokalisiert',
    sentAr: 'هَذَا قَلَمُكَ.',
    sentDe: 'Dies ist dein Stift.' },

  /* ===== Zwei Saetze aus Bayna Yadayk Band 2, Lektion 13, Seite 231 ========
   *
   * Erstmals stammt hier etwas nicht aus Madina 1, deshalb das Feld `werk`.
   * Der Anlass: عِنْدَ und فَوْقَ kommen in KEINEM der 203 anderen Saetze vor,
   * und damit lagen inda-ort-und-zeit-01 und zuruf-makan-weitere-01
   * unerreichbar in grammar-data.js.
   *
   * ⭐ Gesucht werden musste dafuer nichts: zuruf-makan-weitere-01 zitiert
   * beide Saetze schon woertlich, mit Fundstelle. Es lohnt sich, vor der
   * PDF-Arbeit erst nachzusehen, was die Regeln selbst mitbringen - sie
   * fuehren ihre Belege bei sich.
   *
   * Abweichung vom Zitat: dort steht الكِتابِ ohne Sukun am Lam und ohne
   * Alif-Zeichen, wie Bayna Yadayk teilvokalisiert druckt. Hier steht die
   * volle Form الْكِتَابِ, die auch vocab-data.js fuehrt. */
  { id: 'by2-231-1', werk: 'bayna-yadayk-2', seite: 231, lektion: 13, kapitel: 8,
    gedruckt: 'vollstaendig vokalisiert im Zitat',
    sentAr: 'الطَّبِيبُ عِنْدَ الْبَابِ.',
    sentDe: 'Der Arzt ist bei der Tür.' },

  { id: 'by2-231-2', werk: 'bayna-yadayk-2', seite: 231, lektion: 13, kapitel: 8,
    vokalisationErgaenzt: true,
    gedruckt: 'الكِتابِ im Zitat nur teilvokalisiert',
    sentAr: 'الْقَلَمُ فَوْقَ الْكِتَابِ.',
    sentDe: 'Der Stift ist über dem Buch.' },

  /* Buchseite 65, Uebung (٢) Nr. 5 - der einzige Beleg fuer die Waw-Form.
   *
   * ⭐ Neun Seiten des Buchs waren vorher abgesucht (45, 53, 61, 62, 69, 73,
   * 77, 85, 93) und zeigten ausschliesslich أَبِي und أَخِي, also die
   * Yaa-Form. Genau die ist die AUSNAHME, die asma-khamsa-01 nennt („Ausser
   * bei mein. Da kommt das Yaa direkt hinten dran") - sie zu markieren waere
   * das Gegenteil der Regel gewesen.
   *
   * Was gedruckt ist: nur die Fatha auf dem كَ. Die ist der Beleg, dass hier
   * die Besitzendung -ka steht und nicht etwa ein Wortteil; der Lehrer nennt
   * ihren Vokal ausdruecklich („Kev, mit Fetha", possessiv-endungen-01).
   * Das Waw selbst steht ohnehin als Buchstabe da und ist nicht zu ergaenzen.
   *
   * Abweichung vom Druck: das Buch setzt ياخالد ohne Leerzeichen. Hier steht
   * يَا خَالِدُ getrennt, wie يَا وَلَدُ! in vocab-data.js - sonst faende die
   * Markierung von ya-nida-01 die Rufpartikel nicht als eigenes Wort. */
  { id: 'mb1-65-1', seite: 65, kapitel: 12, vokalisationErgaenzt: true,
    gedruckt: 'nur die Fatha auf dem كَ von أبوكَ',
    sentAr: 'أَيْنَ أَبُوكَ يَا خَالِدُ؟',
    sentDe: 'Wo ist dein Vater, Khalid?' },

  /* ⭐ Buchseite 65, Uebung (2) Satz 8. Das Buch druckt in dieser ganzen
     Uebung fast nichts — und ausgerechnet die Fatha auf dem كَ von أَلَكَ
     steht da. Sie ist der Lernpunkt: aus لِ wird vor einem Suffix لَـ.
     Die Gegenprobe steht schon im Bestand: mb1-61-2 hat لِي أَخٌ وَاحِدٌ mit
     Kasra — dieselbe Praeposition, dasselbe Wort أَخ, anderer Vokal.

     ياحامد ist im Buch zusammengeschrieben; hier getrennt, siehe mb1-65-1. */
  { id: 'mb1-65-2', seite: 65, kapitel: 12, vokalisationErgaenzt: true,
    gedruckt: 'nur die Fatha auf dem كَ von ألك',
    sentAr: 'أَلَكَ أَخٌ يَا حَامِدُ؟',
    sentDe: 'Hast du einen Bruder, Hamid?' },

  /* Aus dem deutschen Madina-Schluessel 3, Lektion 1, Seite 7 - dort steht der
   * Abschnitt "c) Die Fuenf Nomen". Der Satz ist das Beispiel des Buchs fuer
   * die Waw-Endung, und daneben steht ausdruecklich: "Beachte es ist أَبُو
   * (abu) mit waw, nicht أَبُ (abu)."
   *
   * ⛔ Der Wortlaut kommt aus dem GERENDERTEN Bild (300 dpi), nicht aus der
   * Textebene. Die liefert an dieser Stelle ‫ماذا قالَ ا َُٔبو بلالٍ؟‬ - die
   * Hamza ist zerlegt und die Zeichen sind verschoben. Gemessen ueber Band 3:
   * kein Extraktionsweg ist zitierfaehig, der beste hat 3,6 % Widersprueche.
   * Deshalb `python werkzeuge/schluessel_zeile.py <wort>`, dann ablesen.
   *
   * Vollstaendig vokalisiert gedruckt, deshalb KEIN vokalisationErgaenzt. */
  { id: 'sk3-7-1', werk: 'madina-schluessel-3', seite: 7, lektion: 1, kapitel: 12,
    gedruckt: 'vollstaendig vokalisiert',
    sentAr: 'مَاذَا قَالَ أَبُو بِلَالٍ؟',
    sentDe: 'Was hat Bilāls Vater gesagt?' },

  /* Buchseite 48, Lektionstext zu Kapitel 9 (النَّعْت).
   *
   * ⭐ Der Satz ist deshalb wertvoll, weil er den Gegensatz in EINER Zeile
   * druckt: مُجْتَهِدٌ traegt das Tanwin, كَسْلَانُ daneben nur eine einfache
   * Dammah - und beide stehen an demselben Wort طَالِبٌ. Genau das ist
   * adjektive-an-ohne-tanwin-01, und seit dem 18.08. auch der Beleg fuer die
   * Adjektivhaelfte von mamnu-min-as-sarf-01 (Schema فَعْلانُ).
   *
   * Vollstaendig vokalisiert gedruckt, bei 600 dpi nachgemessen - jedes der
   * fuenf Woerter steht zeichengleich schon im Bestand. */
  { id: 'mb1-48-1', seite: 48, kapitel: 9,
    gedruckt: 'vollstaendig vokalisiert',
    sentAr: 'عَمَّارٌ طَالِبٌ مُجْتَهِدٌ، وَمَحْمُودٌ طَالِبٌ كَسْلَانُ.',
    sentDe: 'Ammar ist ein fleißiger Student, und Mahmud ist ein fauler Student.' },
  /* ⭐ Madina-Schlüssel 3, Seite 58 — die Hinweiswörter im Dual (24.09.2026).
   * Elias zu Übung 11: „die 11te übung bei satzmodus hat bisher nur hadha und
   * hadhihi aber eigentlich könnte man das mit all diesen hinweiswörtern
   * erweitern sodass ich nicht nur zwei übe. natürlich müssen die sätze
   * dementsprechend angepasst werden." Bis dahin stand kein Satz mit einem
   * Dual-Hinweiswort im Bestand (gemessen: 0 von 231 Sätzen).
   * Der Schlüssel erklärt dort: Dual und Plural von هذا kennt Buch 1, jetzt
   * kommen die von ذلك dazu (ذانِكَ, „dhānika").
   * Wortlaut vom gerenderten Bild (600 dpi, werkzeuge/schluessel_zeile.py,
   * transcripts/schluessel-stellen/band3-s058-0*.png), NICHT aus der Textebene —
   * so sparsam vokalisiert wie gedruckt, nichts ergänzt. Das Deutsch der
   * beiden letzten steht im Schlüssel; beim ersten fehlt es dort, es ist meine
   * Übersetzung. ⚠️ Die Vokalzeichen sind ERGÄNZT (vokalisationErgaenzt), nur aus
 * Belegen: die Hinweiswörter aus seiner Karte (f19-isara, Musterlösung Nr. 3),
 * die Stämme aus seinen Karten (مَسْجِدٌ, مَدْرَسَةٌ, مُدَرِّسٌ, طَالِبٌ, طَبِيبَةٌ,
 * مُمَرِّضَةٌ), dazu was die Schrift erzwingt (Fatha vor Alif, وَ, Sukun am
 * Artikel-Lam vor م). Gedruckt stand weniger — `gedruckt` sagt, was. Ein
 * Skript hat geprüft, dass kein gedrucktes Zeichen verändert wurde.
 * Die Nomen kennt er alle: مسجد, مدرسة, مدرس, طالب, طبيبة
   * (Madina 1, Kap. 1), ممرضة (Kap. 7) — hier im Dual. */
  { id: 'sk3-58-1', werk: 'madina-schluessel-3', vokalisationErgaenzt: true, seite: 58, kapitel: 1,
    gedruckt: 'nur einzelne Zeichen: die Endungen, مَسْجدانِ und مَدْرَستانِ teilweise',
    sentAr: 'هَذَانِ مَسْجِدَانِ، وَهَاتَانِ مَدْرَسَتَانِ.',
    sentDe: 'Diese beiden sind Moscheen, und diese beiden sind Schulen.' },
  { id: 'sk3-58-2', werk: 'madina-schluessel-3', vokalisationErgaenzt: true, seite: 58, kapitel: 7,
    gedruckt: 'هاتانِ nur mit der Endung, der Rest vokalisiert',
    sentAr: 'هَاتَانِ طَبِيبَتَانِ، وَتَانِكَ مُمَرِّضَتَانِ.',
    sentDe: 'Diese beiden sind Ärztinnen und jene beiden sind Krankenschwestern.' },
  { id: 'sk3-58-3', werk: 'madina-schluessel-3', vokalisationErgaenzt: true, seite: 58, kapitel: 1,
    gedruckt: 'هذانِ, وذانِكَ und طالبانِ nur mit der Endung, مُدَرِّسانِ vokalisiert',
    sentAr: 'هَذَانِ مُدَرِّسَانِ، وَذَانِكَ طَالِبَانِ.',
    sentDe: 'Diese beiden sind Lehrer und jene beiden sind Studenten.' },

  /* Madina-Schlüssel 3, Seite 208 — هَؤُلَاءِ („diese", Plural) im Satz, mit dem
   * Pronomen هُنَّ dazwischen (so erklärt der Schlüssel dort das Trennpronomen).
   * Aus zwei Zeilenbildern derselben Zeile (band3-s208-03: هَؤُلاءِ, band3-s208-01:
   * هُنَّ المُسْلِماتُ.). Deutsch aus dem Schlüssel.
   * ⚠️ مُسْلِم ist bei ihm eine Karte aus Kapitel 24 — deshalb kapitel: 24. */
  { id: 'sk3-208-1', werk: 'madina-schluessel-3', vokalisationErgaenzt: true, seite: 208, kapitel: 24,
    gedruckt: 'vollstaendig vokalisiert (هَؤُلاءِ ohne Fatha auf dem Lam)',
    sentAr: 'هَؤُلَاءِ هُنَّ الْمُسْلِمَاتُ.',
    sentDe: 'Diese sind die Muslima (muslimischen Frauen).' },
  /* ⭐ Bayna Yadayk 1 (sein Buch, Samsung-Archiv „Arabya Bayna Yadayk 1A"),
   * 25.09.2026. Elias: „auch möchte ich, dass die sätze im satzmodus ein
   * bisschen anteil an den neusten vokabeln haben … eine gute balance soll da
   * sein" — und die Fragewort-Übung braucht Fragesätze. Buchseite 82 = PDF-S. 104
   * (Lektion 28, Kapitel 4 — sein neuestes), Buchseite 2 = PDF-S. 24 (Lektion 1).
   * Wortlaut vom 600-dpi-Bild (scratchpad/by600, Sitzung 08c1f540). Der Druck
   * ist fast voll vokalisiert; ERGÄNZT nur, was die Schrift erzwingt (Fatha vor
   * Alif und ى, Sukun am Artikel-Lam, فِي, وَ, إِلَى) und بَعْدَ, das auf derselben
   * Seite voll gedruckt steht → vokalisationErgaenzt. Das Deutsch ist MEINE
   * Übersetzung, im Buch steht keins. Vier Sätze (by1-82-2, -3,
   * -4, -6) waren am 25.09. kurz wieder draußen: der Satzzerleger las die
   * Präsensformen (ich/du wache auf, schläfst, machst, fahre) nicht als Verb.
   * Seit istMudariForm() in js/irab.js stehen sie wieder da. Nicht genommen:
   * Sätze, deren Endung im
   * Druck nicht sicher zu lesen war (sie wäre eigene Ḥaraka). */
  { id: 'by1-82-1', werk: 'bayna-yadayk-1', seite: 82, kapitel: 4, vokalisationErgaenzt: true,
    gedruckt: 'مَتى ohne Fatha auf dem Ta, sonst vokalisiert',
    sentAr: 'مَتَى تَسْتَيْقِظُ؟', sentDe: 'Wann wachst du auf?' },
  { id: 'by1-82-2', werk: 'bayna-yadayk-1', seite: 82, kapitel: 4, vokalisationErgaenzt: true,
    gedruckt: 'الفَجْرِ ohne Sukun am Lam, sonst vokalisiert',
    sentAr: 'أَسْتَيْقِظُ عِنْدَ الْفَجْرِ.', sentDe: 'Ich wache beim Fajr auf.' },
  { id: 'by1-82-3', werk: 'bayna-yadayk-1', seite: 82, kapitel: 4, vokalisationErgaenzt: true,
    gedruckt: 'تَنامُ und الصَّلاةِ ohne Fatha vor dem Alif',
    sentAr: 'هَلْ تَنَامُ بَعْدَ الصَّلَاةِ؟', sentDe: 'Schläfst du nach dem Gebet?' },
  { id: 'by1-82-4', werk: 'bayna-yadayk-1', seite: 82, kapitel: 4, vokalisationErgaenzt: true,
    gedruckt: 'ماذا ohne Zeichen, بَعدَ ohne Sukun, الصَّلاةِ ohne Fatha vor dem Alif',
    sentAr: 'مَاذَا تَفْعَلُ بَعْدَ الصَّلَاةِ؟', sentDe: 'Was machst du nach dem Gebet?' },
  { id: 'by1-82-5', werk: 'bayna-yadayk-1', seite: 82, kapitel: 4, vokalisationErgaenzt: true,
    gedruckt: 'ومَتى und إلى ohne Zeichen am Anfang/Ende, الـمَدْرَسَةِ ohne Sukun am Lam',
    sentAr: 'وَمَتَى تَذْهَبُ إِلَى الْمَدْرَسَةِ؟', sentDe: 'Und wann gehst du zur Schule?' },
  { id: 'by1-82-6', werk: 'bayna-yadayk-1', seite: 82, kapitel: 4, vokalisationErgaenzt: true,
    gedruckt: 'لا ohne Zeichen, بِالحافِلَةِ ohne Sukun am Lam und ohne Fatha vor dem Alif',
    sentAr: 'لَا، أَذْهَبُ بِالْحَافِلَةِ.', sentDe: 'Nein, ich fahre mit dem Bus.' },
  { id: 'by1-2-1', werk: 'bayna-yadayk-1', seite: 2, kapitel: 1, vokalisationErgaenzt: true,
    gedruckt: 'حالُكَ ohne Fatha auf dem Ha, sonst vokalisiert',
    sentAr: 'وَكَيْفَ حَالُكَ أَنْتَ؟', sentDe: 'Und wie geht es dir?' },
  /* ⭐ Bayna Yadayk 1, zweite Lese (25.09.2026, nach dem Komprimieren). Für
   * die Lücken, die pruefe-satzmodus-aktuell Teil H meldete (Pflichtprogramm:
   * jede Übung mindestens 15 Aufgaben): Übung 4 hatte 14, Übung 13 hatte 14,
   * Übung 14 hatte 7. Elias: „das es immer aktuell bleibt und passende wörter
   * hinzufügt" (SATZMODUS-PFLICHTPROGRAMM.md, Pflicht 5) und die Notfallregel:
   * erst die Bücher, erfunden wird nichts.
   * ⚠️ Die Seitenbilder im Buch-PDF haben nur ≈ 970 × 1333 Pixel (≈ 130 dpi,
   * gemessen mit pymupdf; das in Samsung Notes eingebettete Original ist
   * dasselbe). Ein Rendern mit 400 oder 600 dpi vergrößert nur. Genommen ist
   * deshalb nur, wo das Endzeichen SICHTBAR über oder unter dem Buchstaben
   * steht. Nicht genommen: die Dialoge auf S. 4 und die Übung auf S. 22 (dort
   * Pausalform: „مِصْرِيَّة", „طالِب" ohne Endung — sie zu setzen wäre eigene
   * Ḥaraka), „الْمَطَارِ" auf S. 56 (Fatha auf dem Mim nicht sicher zu lesen).
   * ERGÄNZT ist nur, was die Schrift erzwingt: Fatha vor Alif, Kasra vor dem
   * ي, Damma vor dem و, Sukun am Artikel-Lam, فِي, وَ → vokalisationErgaenzt.
   * ⛔ Nicht genommen, weil der Satzzerleger sie FALSCH zerlegt (eigener Punkt
   * in der To-Do): Verbsätze mit Objekt oder Futur سَـ (S. 84, 108), Sätze mit
   * Namen hinter einem Verwandtschaftswort (هَذَا أَخِي عِيسَى, S. 28/30/48 —
   * seit v624 zerlegt der Zerleger sie richtig, die belegten stehen im Block
   * „Namen hinter Vater, Onkel, Sohn" ganz unten) und وَالِدِي/وَالِدُهُ hinter
   * einem Wort (gilt als „Anschluss mit وَ").
   * Das Deutsch ist MEINE Übersetzung, im Buch steht keins. */
  { id: 'by1-2-2', werk: 'bayna-yadayk-1', seite: 2, kapitel: 1, vokalisationErgaenzt: true,
    gedruckt: 'حالُكِ ohne Fatha auf dem Ha, sonst vokalisiert',
    sentAr: 'وَكَيْفَ حَالُكِ أَنْتِ؟', sentDe: 'Und wie geht es dir?' },
  { id: 'by1-4-1', werk: 'bayna-yadayk-1', seite: 4, kapitel: 1, vokalisationErgaenzt: true,
    gedruckt: 'أَنا und تُرْكِيا ohne Fatha vor dem Alif',
    sentAr: 'أَنَا مِنْ تُرْكِيَا.', sentDe: 'Ich bin aus der Türkei.' },
  { id: 'by1-4-2', werk: 'bayna-yadayk-1', seite: 4, kapitel: 1, vokalisationErgaenzt: true,
    gedruckt: 'أَنا und سورِيا ohne Fatha vor dem Alif, ohne Damma vor dem Waw',
    sentAr: 'أَنَا مِنْ سُورِيَا.', sentDe: 'Ich bin aus Syrien.' },
  { id: 'by1-6-1', werk: 'bayna-yadayk-1', seite: 6, kapitel: 1, vokalisationErgaenzt: true,
    gedruckt: 'هَذا ohne Fatha vor dem Alif, أَخي ohne Kasra vor dem ي',
    sentAr: 'هَذَا أَخِي. هُوَ مُدَرِّسٌ.', sentDe: 'Das ist mein Bruder. Er ist Lehrer.' },
  { id: 'by1-6-2', werk: 'bayna-yadayk-1', seite: 6, kapitel: 1, vokalisationErgaenzt: true,
    gedruckt: 'هَذا ohne Fatha vor dem Alif, صَديقي ohne Kasra vor dem ي',
    sentAr: 'هَذَا صَدِيقِي. هُوَ مُهَنْدِسٌ.', sentDe: 'Das ist mein Freund. Er ist Ingenieur.' },
  { id: 'by1-6-3', werk: 'bayna-yadayk-1', seite: 6, kapitel: 1, vokalisationErgaenzt: true,
    gedruckt: 'أُخْتي und طَبيبَةٌ ohne Kasra vor dem ي',
    sentAr: 'هَذِهِ أُخْتِي. هِيَ طَبِيبَةٌ.', sentDe: 'Das ist meine Schwester. Sie ist Ärztin.' },
  { id: 'by1-6-4', werk: 'bayna-yadayk-1', seite: 6, kapitel: 1, vokalisationErgaenzt: true,
    gedruckt: 'صَديقَتي ohne Kasra vor dem ي, طالِبَةٌ ohne Fatha vor dem Alif',
    sentAr: 'هَذِهِ صَدِيقَتِي. هِيَ طَالِبَةٌ.', sentDe: 'Das ist meine Freundin. Sie ist Schülerin.' },
  { id: 'by1-28-1', werk: 'bayna-yadayk-1', seite: 28, kapitel: 2, vokalisationErgaenzt: true,
    gedruckt: 'صورَةُ ohne Damma vor dem Waw, أُسْرَتي ohne Kasra vor dem ي',
    sentAr: 'هَذِهِ صُورَةُ أُسْرَتِي.', sentDe: 'Das ist ein Bild meiner Familie.' },
  { id: 'by1-28-2', werk: 'bayna-yadayk-1', seite: 28, kapitel: 2, vokalisationErgaenzt: true,
    gedruckt: 'وهَذا ohne Zeichen auf dem وَ und ohne Fatha vor dem Alif, جَدَّتي ohne Kasra vor dem ي',
    sentAr: 'وَهَذَا جَدِّي. وَهَذِهِ جَدَّتِي.', sentDe: 'Und das ist mein Großvater. Und das ist meine Großmutter.' },
  { id: 'by1-36-1', werk: 'bayna-yadayk-1', seite: 36, kapitel: 2, vokalisationErgaenzt: true,
    gedruckt: 'المِعْطَفُ ohne Sukun am Artikel-Lam, هَذا ohne Fatha vor dem Alif',
    sentAr: 'أَيْنَ الْمِعْطَفُ؟ هَذَا هُوَ الْمِعْطَفُ.', sentDe: 'Wo ist der Mantel? Das hier ist der Mantel.' },
  { id: 'by1-36-2', werk: 'bayna-yadayk-1', seite: 36, kapitel: 2, vokalisationErgaenzt: true,
    gedruckt: 'الغُرْفَةُ ohne Sukun am Artikel-Lam',
    sentAr: 'أَيْنَ الْغُرْفَةُ؟ هَذِهِ هِيَ الْغُرْفَةُ.', sentDe: 'Wo ist das Zimmer? Das hier ist das Zimmer.' },
  { id: 'by1-43-1', werk: 'bayna-yadayk-1', seite: 43, kapitel: 2, vokalisationErgaenzt: true,
    gedruckt: 'صورَةُ ohne Damma vor dem Waw, أَخي ohne Kasra vor dem ي',
    sentAr: 'هَذِهِ صُورَةُ أَخِي. هُوَ مُهَنْدِسٌ.', sentDe: 'Das ist ein Bild meines Bruders. Er ist Ingenieur.' },
  { id: 'by1-45-1', werk: 'bayna-yadayk-1', seite: 45, kapitel: 2, vokalisationErgaenzt: true,
    gedruckt: 'والِدُكَ ohne Fatha vor dem Alif',
    sentAr: 'مَنْ وَالِدُكَ؟', sentDe: 'Wer ist dein Vater?' },
  { id: 'by1-45-2', werk: 'bayna-yadayk-1', seite: 45, kapitel: 2, vokalisationErgaenzt: true,
    gedruckt: 'صَديقُكَ ohne Kasra vor dem ي',
    sentAr: 'مَنْ صَدِيقُكَ؟', sentDe: 'Wer ist dein Freund?' },
  { id: 'by1-48-1', werk: 'bayna-yadayk-1', seite: 48, kapitel: 2, vokalisationErgaenzt: true,
    gedruckt: 'يُصَلّي ohne Kasra vor dem ي',
    sentAr: 'هُوَ يُصَلِّي.', sentDe: 'Er betet.' },
  { id: 'by1-56-1', werk: 'bayna-yadayk-1', seite: 56, kapitel: 3, vokalisationErgaenzt: true,
    gedruckt: 'في zweimal ohne Kasra; Frage (Hassan) und Antwort (Ahmad) stehen untereinander',
    sentAr: 'هَلْ تَسْكُنُ فِي بَيْتٍ؟ نَعَمْ، أَسْكُنُ فِي بَيْتٍ.', sentDe: 'Wohnst du in einem Haus? Ja, ich wohne in einem Haus.' },
  { id: 'by1-56-2', werk: 'bayna-yadayk-1', seite: 56, kapitel: 3, vokalisationErgaenzt: true,
    gedruckt: 'ما ohne Fatha vor dem Alif',
    sentAr: 'مَا رَقْمُ شَقَّتِكَ؟', sentDe: 'Was ist die Nummer deiner Wohnung?' },
  { id: 'by1-84-1', werk: 'bayna-yadayk-1', seite: 84, kapitel: 4, vokalisationErgaenzt: true,
    gedruckt: 'هَذا ohne Fatha vor dem Alif, العُطْلَةِ ohne Sukun am Artikel-Lam',
    sentAr: 'هَذَا يَوْمُ الْعُطْلَةِ.', sentDe: 'Das ist der freie Tag.' },
  { id: 'by1-84-2', werk: 'bayna-yadayk-1', seite: 84, kapitel: 4, vokalisationErgaenzt: true,
    gedruckt: 'هَذا ohne Fatha vor dem Alif, العَمَلِ ohne Sukun am Artikel-Lam',
    sentAr: 'هَذَا يَوْمُ الْعَمَلِ.', sentDe: 'Das ist der Arbeitstag.' },
  { id: 'by1-85-1', werk: 'bayna-yadayk-1', seite: 85, kapitel: 4, vokalisationErgaenzt: true,
    gedruckt: 'أَفْرادُ ohne Fatha vor dem Alif, الأُسْرَةِ ohne Sukun am Artikel-Lam',
    sentAr: 'كَمْ أَفْرَادُ الْأُسْرَةِ؟', sentDe: 'Wie viele Mitglieder hat die Familie?' },
  /* ⭐ Bayna Yadayk 1, dritte Lese (25.09.2026, v610) — möglich erst durch
   * v608/v609: der Satzzerleger liest jetzt das Futur سَـ als Verb und ein
   * Nomen mit Fatha direkt nach dem Verb als Objekt. Vorher galt سَأَكْنُسُ als
   * مُبْتَدَأ und الْمَلَابِسَ als فَاعِل mit „falscher" Fatha. Kapitel 4 ist sein
   * neuestes (Balance im Satzmodus: 7,4 % der Sätze mit einem Wort daraus).
   * Jede Endung am Scan geprüft (≈ 130 dpi, vergrößert). ERGÄNZT nur, was die
   * Schrift erzwingt (Fatha vor Alif, Kasra vor ي, Damma vor و, Sukun am
   * Artikel-Lam, فِي, وَ). NICHT genommen: لَدَيْنَا شَقَّةٌ جَمِيلَة (S. 58,
   * Pausalform) · فِي أَيِّ دَوْر الشَّقَّةُ؟ (S. 58: دَوْر ohne gedruckte Endung —
   * „welcher?" bleibt deshalb ohne Satz) · أنا سَأَغْسِلُ …/وأنا سَأَقْرَأُ … (S. 84:
   * keine Fatha auf dem Hamza gedruckt, die wäre meine) · يا لَطِيفَة (Pausal) ·
   * مَتَى هَذَا الْحِوَارُ؟ (S. 85: الْحِوَارُ würde zweites خَبَر statt بَدَل — Frage
   * an ihn, To-Do) · der Lesetext S. 108 bis auf einen Satz (Pausal: المَسْجِد,
   * صَلاة الفَجْر) und die FALSCHEN Aussagen des Selbsttests (4, 5, 7).
   * Das Deutsch ist MEINE Übersetzung, im Buch steht keins. */
  { id: 'by1-58-1', werk: 'bayna-yadayk-1', seite: 58, kapitel: 3, vokalisationErgaenzt: true,
    gedruckt: 'في zweimal ohne Kasra, sonst vokalisiert',
    sentAr: 'كَمْ غُرْفَةً فِي الشَّقَّةِ؟ فِي الشَّقَّةِ خَمْسُ غُرَفٍ.', sentDe: 'Wie viele Zimmer sind in der Wohnung? In der Wohnung sind fünf Zimmer.' },
  { id: 'by1-58-2', werk: 'bayna-yadayk-1', seite: 58, kapitel: 3, vokalisationErgaenzt: true,
    gedruckt: 'في ohne Kasra, الخامِسِ ohne Sukun am Artikel-Lam und ohne Fatha vor dem Alif',
    sentAr: 'الشَّقَّةُ فِي الدَّوْرِ الْخَامِسِ.', sentDe: 'Die Wohnung ist im fünften Stock.' },
  { id: 'by1-84-3', werk: 'bayna-yadayk-1', seite: 84, kapitel: 4, vokalisationErgaenzt: true,
    gedruckt: 'ماذا, يا und طارِقُ ohne Fatha vor dem Alif',
    sentAr: 'مَاذَا سَتَفْعَلُ يَا طَارِقُ؟', sentDe: 'Was wirst du machen, Tariq?' },
  { id: 'by1-84-4', werk: 'bayna-yadayk-1', seite: 84, kapitel: 4, vokalisationErgaenzt: true,
    gedruckt: 'الجُلوسِ ohne Sukun am Artikel-Lam und ohne Damma vor dem Waw',
    sentAr: 'سَأَكْنُسُ غُرْفَةَ الْجُلُوسِ.', sentDe: 'Ich werde das Wohnzimmer fegen.' },
  { id: 'by1-84-5', werk: 'bayna-yadayk-1', seite: 84, kapitel: 4, vokalisationErgaenzt: true,
    gedruckt: 'وماذا ohne Zeichen auf dem وَ und ohne Fatha vor dem Alif, يا ohne Fatha vor dem Alif',
    sentAr: 'وَمَاذَا سَتَفْعَلِينَ يَا فَاطِمَةُ؟', sentDe: 'Und was wirst du machen, Fatima?' },
  { id: 'by1-84-6', werk: 'bayna-yadayk-1', seite: 84, kapitel: 4, vokalisationErgaenzt: false,
    gedruckt: 'vollständig vokalisiert',
    sentAr: 'سَأَكْنُسُ غُرْفَةَ النَّوْمِ.', sentDe: 'Ich werde das Schlafzimmer fegen.' },
  { id: 'by1-84-7', werk: 'bayna-yadayk-1', seite: 84, kapitel: 4, vokalisationErgaenzt: true,
    gedruckt: 'وماذا ohne Zeichen auf dem وَ und ohne Fatha vor dem Alif, يا ohne Fatha vor dem Alif',
    sentAr: 'وَمَاذَا سَتَفْعَلُ يَا أَحْمَدُ؟', sentDe: 'Und was wirst du machen, Ahmad?' },
  { id: 'by1-84-8', werk: 'bayna-yadayk-1', seite: 84, kapitel: 4, vokalisationErgaenzt: true,
    gedruckt: 'المَلابِسَ ohne Sukun am Artikel-Lam und ohne Fatha vor dem Alif',
    sentAr: 'سَأَغْسِلُ الْمَلَابِسَ.', sentDe: 'Ich werde die Kleidung waschen.' },
  { id: 'by1-84-9', werk: 'bayna-yadayk-1', seite: 84, kapitel: 4, vokalisationErgaenzt: true,
    gedruckt: 'سَأَكْوي ohne sichtbare Kasra vor dem ي, المَلابِسَ ohne Sukun am Artikel-Lam und ohne Fatha vor dem Alif',
    sentAr: 'سَأَكْوِي الْمَلَابِسَ.', sentDe: 'Ich werde die Kleidung bügeln.' },
  { id: 'by1-85-2', werk: 'bayna-yadayk-1', seite: 85, kapitel: 4, vokalisationErgaenzt: true,
    gedruckt: 'المَلابِسَ ohne Sukun am Artikel-Lam und ohne Fatha vor dem Alif',
    sentAr: 'مَنْ يَغْسِلُ الْمَلَابِسَ؟', sentDe: 'Wer wäscht die Kleidung?' },
  { id: 'by1-85-3', werk: 'bayna-yadayk-1', seite: 85, kapitel: 4, vokalisationErgaenzt: true,
    gedruckt: 'الجُلوسِ ohne Sukun am Artikel-Lam und ohne Damma vor dem Waw',
    sentAr: 'مَنْ سَيَكْنُسُ غُرْفَةَ الْجُلُوسِ؟', sentDe: 'Wer wird das Wohnzimmer fegen?' },
  { id: 'by1-85-4', werk: 'bayna-yadayk-1', seite: 85, kapitel: 4, vokalisationErgaenzt: true,
    gedruckt: 'القُرْآنَ ohne Sukun am Artikel-Lam',
    sentAr: 'مَنْ سَيَقْرَأُ الْقُرْآنَ؟', sentDe: 'Wer wird den Koran lesen?' },
  { id: 'by1-85-5', werk: 'bayna-yadayk-1', seite: 85, kapitel: 4, vokalisationErgaenzt: false,
    gedruckt: 'vollständig vokalisiert',
    sentAr: 'مَنْ سَيَكْنُسُ غُرْفَةَ النَّوْمِ؟', sentDe: 'Wer wird das Schlafzimmer fegen?' },
  { id: 'by1-85-6', werk: 'bayna-yadayk-1', seite: 85, kapitel: 4, vokalisationErgaenzt: true,
    gedruckt: 'الأَطْباقَ ohne Sukun am Artikel-Lam und ohne Fatha vor dem Alif',
    sentAr: 'مَنْ سَيَغْسِلُ الْأَطْبَاقَ؟', sentDe: 'Wer wird das Geschirr spülen?' },
  { id: 'by1-85-7', werk: 'bayna-yadayk-1', seite: 85, kapitel: 4, vokalisationErgaenzt: true,
    gedruckt: 'سَيَكْوي ohne sichtbare Kasra vor dem ي, المَلابِسَ ohne Sukun am Artikel-Lam und ohne Fatha vor dem Alif',
    sentAr: 'مَنْ سَيَكْوِي الْمَلَابِسَ؟', sentDe: 'Wer wird die Kleidung bügeln?' },
  { id: 'by1-85-8', werk: 'bayna-yadayk-1', seite: 85, kapitel: 4, vokalisationErgaenzt: false,
    gedruckt: 'vollständig vokalisiert',
    sentAr: 'مَنْ هُمْ؟', sentDe: 'Wer sind sie?' },
  { id: 'by1-108-1', werk: 'bayna-yadayk-1', seite: 108, kapitel: 4, vokalisationErgaenzt: true,
    gedruckt: 'القُرْآنَ ohne Sukun am Artikel-Lam; aus dem Lesetext des Selbsttests (Einheiten 3 und 4)',
    sentAr: 'هُوَ يَقْرَأُ الْقُرْآنَ.', sentDe: 'Er liest den Koran.' },
  /* ⭐ v619 (25.09.2026) — ein SCHWERER Satz mit إِلَى für Übung 5 („Alle
   * Genitive"): drei Genitive aus zwei Gründen (الْفَجْرِ nach dem ظَرْف عِنْدَ,
   * الْبَيْتِ und الْمَسْجِدِ nach حَرْف جَرّ). Elias zu den offenen Lücken:
   * „dann mach die noch fertig". Aus dem Lesetext (Übung 6) auf S. 102,
   * Lektion 35; Wortlaut vom 230-dpi-Ausschnitt. ERGÄNZT nur, was die Schrift
   * erzwingt (Fatha vor Alif, Sukun am Artikel-Lam, وَ, فِي, إِلَى) →
   * vokalisationErgaenzt. Das Deutsch ist MEINE Übersetzung. */
  { id: 'by1-102-1', werk: 'bayna-yadayk-1', seite: 102, kapitel: 4, vokalisationErgaenzt: true,
    gedruckt: 'طاهِرٌ ohne Fatha vor dem Alif, الفَجْرِ und البَيْتِ und المَسْجِدِ ohne Sukun am Artikel-Lam, ويَتَوَضَّأُ und ويَذْهَبُ ohne Fatha am Waw, في und إلى ohne Zeichen',
    sentAr: 'يَسْتَيْقِظُ طَاهِرٌ عِنْدَ الْفَجْرِ، وَيَتَوَضَّأُ فِي الْبَيْتِ، وَيَذْهَبُ إِلَى الْمَسْجِدِ.',
    sentDe: 'Tahir wacht beim Fajr auf, macht zu Hause die Gebetswaschung und geht zur Moschee.' },
  /* ⭐ Madina 1, Lektionen 10–12 (25.09.2026, v611) — für die Endungen-Übung.
   * Elias: „wie wäre es auch mit einem satz übung wo ich die richtigen endungen
   * hinzufügen muss wie zb ki für frau oder ha und hu usw.. also halt alle die
   * bisher zur auswahl stehen". Gezählt in seiner Auswahl (356 Sätze, Madina 1
   * K1–12 + Bayna Yadayk 1 K1–4): ـِي ≈ 15, ـكَ 6, ـكِ 3, ـهُ 2, ـهَا 1 —
   * ausgerechnet die drei, die er nennt, fast leer. Bayna Yadayk 1 hat in
   * Einheit 1–4 (Buchseiten 1–108, ganz durchgesehen) KEINEN Satz mit ـهَا.
   * Buchseite = PDF-Seite − 21 (sein beschriftetes Exemplar, 146 Seiten).
   * Madina 1 druckt in den Lektionen fast nur die Endungen. ERGÄNZT ist, was die
   * Schrift erzwingt (Fatha vor Alif, Kasra vor ي, Damma vor و, Sukun am
   * Artikel-Lam), sonst NUR aus Belegen: Wörter seiner Karten (هَذَا, هَذِهِ,
   * غُرْفَة, نَافِذَة, كَبِير, مِرْوَحَة, جَمِيل, مُهَنْدِس, بِنْت, أَيْنَ, أَب,
   * أُخْت) und Formen, die das Buch in derselben Zeile oder der nächsten voll
   * druckt (خَرَجَ, اسْمُهُ, اسْمُهَا). `gedruckt` sagt je Satz, was dasteht.
   * Eine fehlende Endung heißt: nicht genommen. NICHT genommen: S. 55
   * لُغَتُه اليابانيّةُ (يَابَانِيّ und صَعْب auf keiner Karte) · S. 56 حَمْزَةُ،
   * عِنْدَه سيارةٌ (Zerleger: حَمْزَةُ = مُضَاف) · S. 58 زَمِيلِي له أَخٌ وأُخْتٌ
   * (Zerleger: أَخٌ = خَبَر statt مُبْتَدَأ مُؤَخَّر) und أُخْتِي لَهَا طِفْلٌ صغير
   * (صغير ohne Endung) · S. 59 آمنة معها زوجها, زينب في الرياض …, هذا الطالب
   * أبوه وزير … (ohne Endungen) · S. 62 مَن في السيارة؟ فيها أبي … und S. 64
   * Übung (1): die Vokale dort sind seine rote Handschrift, gedruckt fast
   * nichts · S. 57 Übung (2): die Endung ist die Lücke · S. 63 اسمُها فاطمة
   * (فاطمة ohne Endung — nur die Frage davor genommen) und أهي زَمِيلَتُكِ؟
   * (Zerleger: زَمِيلَتُكِ = مُبْتَدَأ statt خَبَر). Das Deutsch ist MEINE
   * Übersetzung, im Buch steht keins.
   * ⭐ Nachtrag v615 (25.09.2026): Die drei mit „Zerleger:“ zerlegt die App seit
   * v613 richtig — sie stehen jetzt unten (mb1-56-1, mb1-58-4, mb1-63-8), bei
   * 600 dpi am Buch nachgesehen, ergänzt nach denselben Regeln. */
  { id: 'mb1-55-1', seite: 55, kapitel: 10, vokalisationErgaenzt: true,
    gedruckt: 'زَوْجُها voll bis auf die Fatha vor dem Alif, مهندسٌ nur mit der Endung',
    sentAr: 'زَوْجُهَا مُهَنْدِسٌ.', sentDe: 'Ihr Mann ist Ingenieur.' },
  /* حمزة trägt hier nur die Fatha auf dem ز und die Endung. VOLL gedruckt steht
     der Name zwei Seiten vorher im selben Dialog (S. 54, PDF 73: اسمه حَمْزَةُ) —
     daher Fatha und Sukun. ـهُ an عِنْدَ: seine Karte ـهُ; سَيَّارَة: seine Karte (K5). */
  { id: 'mb1-56-1', seite: 56, kapitel: 10, vokalisationErgaenzt: true,
    gedruckt: 'حمزَةُ ohne Zeichen auf ح und م (voll auf S. 54), عِنْدَه ohne Zeichen auf dem ه, سيارةٌ nur mit der Endung',
    sentAr: 'حَمْزَةُ، عِنْدَهُ سَيَّارَةٌ.', sentDe: 'Hamza hat ein Auto.' },
  { id: 'mb1-58-2', seite: 58, kapitel: 10, vokalisationErgaenzt: true,
    gedruckt: 'هذا ohne Zeichen, قَلَمُهُ voll vokalisiert (Musterzeile wie mb1-58-1)',
    sentAr: 'هَذَا قَلَمُهُ.', sentDe: 'Das ist sein Stift.' },
  { id: 'mb1-58-3', seite: 58, kapitel: 10, vokalisationErgaenzt: true,
    gedruckt: 'هذا ohne Zeichen, قَلَمُهَا voll vokalisiert (Musterzeile wie mb1-58-1)',
    sentAr: 'هَذَا قَلَمُهَا.', sentDe: 'Das ist ihr Stift.' },
  /* لَهُ mit Fatha: li-mit-suffix-01 („لَهُ (ihm)“, am Buch belegt mit أَلَكَ auf
     S. 65); وَ und das Sukun in أُخْت: seine Karten. */
  { id: 'mb1-58-4', seite: 58, kapitel: 10, vokalisationErgaenzt: true,
    gedruckt: 'زَمِيْلِي und أَخٌ vollständig, وأُختٌ ohne Zeichen auf و und خ, له ohne Zeichen',
    sentAr: 'زَمِيلِي لَهُ أَخٌ وَأُخْتٌ.', sentDe: 'Mein Mitschüler hat einen Bruder und eine Schwester.' },
  { id: 'mb1-59-1', seite: 59, kapitel: 10, vokalisationErgaenzt: true,
    gedruckt: 'voll vokalisiert bis auf die Fatha am Ende des zweiten خَرَج (das erste steht voll da); عمّي wie in mb1-63-2',
    sentAr: 'مَنْ خَرَجَ مَعَهُ؟ خَرَجَ مَعَهُ عَمِّي.', sentDe: 'Wer ist mit ihm hinausgegangen? Mein Onkel ist mit ihm hinausgegangen.' },
  { id: 'mb1-61-5', seite: 61, kapitel: 11, vokalisationErgaenzt: true,
    gedruckt: 'nur die Endungen نافذةٌ كبيرةٌ ومِرْوَحَةٌ جَميلةٌ; هذه غرفتي und فيها ohne Zeichen',
    sentAr: 'هَذِهِ غُرْفَتِي. فِيهَا نَافِذَةٌ كَبِيرَةٌ وَمِرْوَحَةٌ جَمِيلَةٌ.', sentDe: 'Das ist mein Zimmer. Darin sind ein großes Fenster und ein schöner Ventilator.' },
  { id: 'mb1-63-5', seite: 63, kapitel: 12, vokalisationErgaenzt: true,
    gedruckt: 'ما ٱسمها mit Wasla, ohne Damma; die Damma steht in der Antwortzeile darunter (اسمُها)',
    sentAr: 'مَا اسْمُهَا؟', sentDe: 'Wie heißt sie?' },
  { id: 'mb1-63-6', seite: 63, kapitel: 12, vokalisationErgaenzt: true,
    gedruckt: 'كَيْفَ حالُكِ يابنتُ — ohne Zeichen auf ب von بنت; يا und بنت im Druck ohne Leerzeichen',
    sentAr: 'كَيْفَ حَالُكِ يَا بِنْتُ؟', sentDe: 'Wie geht es dir, Mädchen?' },
  { id: 'mb1-63-7', seite: 63, kapitel: 12, vokalisationErgaenzt: true,
    gedruckt: 'nur die Kasra auf dem ك von أبوكِ',
    sentAr: 'أَيْنَ أَبُوكِ؟', sentDe: 'Wo ist dein Vater?' },
  /* أهي ohne Zeichen wie in mb1-63-4 (أَ und هِيَ: seine Karten). Das ز trägt
     die Fatha auf seiner Karte زَمِيلٌ (weiblich زَمِيلَةٌ) und im Buch auf S. 54
     (هو زَمِيْلي). */
  { id: 'mb1-63-8', seite: 63, kapitel: 12, vokalisationErgaenzt: true,
    gedruckt: 'زمِيْلَتُكِ ohne Zeichen auf dem ز, أهي ohne Zeichen',
    sentAr: 'أَهِيَ زَمِيلَتُكِ؟', sentDe: 'Ist sie deine Mitschülerin?' },
  { id: 'mb1-64-1', seite: 64, kapitel: 12, vokalisationErgaenzt: true,
    gedruckt: 'ما ٱسمُه und ٱسمُهُ سَعْدٌ mit Wasla; die Damma auf dem ه steht nur in der Antwort',
    sentAr: 'مَا اسْمُهُ؟ اِسْمُهُ سَعْدٌ.', sentDe: 'Wie heißt er? Sein Name ist Saad.' },
  { id: 'mb1-64-2', seite: 64, kapitel: 12, vokalisationErgaenzt: true,
    gedruckt: 'ألَكِ أختٌ — die Hamza-Vokale ohne Zeichen',
    sentAr: 'أَلَكِ أُخْتٌ؟', sentDe: 'Hast du eine Schwester?' },

  /* ⭐ „welcher?" (أَيّ) für Übung 13 (25.09.2026). In seinen Büchern bis
     Madina 1 K12 / Bayna Yadayk 1 K4 steht أَيّ nur auf BY1 S. 58 («فِي أَيِّ
     دَوْر الشَّقَّةُ؟»), und dort trägt دَوْر keine gedruckte Endung — eine
     Ḥaraka dazuzusetzen wäre unbelegt. Dieser Satz steht in der MUSTERLÖSUNG
     seines Lehrers (Folge 19, Nr. 9, S. 12–13, „Fragewörter"; regelsammlung-
     data.js und werkzeuge/regelsammlung-abschrift.json, Seite 13) — voll
     vokalisiert, Wort für Wort übernommen, nichts ergänzt; die deutsche Zeile
     ist die der Musterlösung. */
  { id: 'mf19-13-1', werk: 'musterloesung-f19', seite: 13,
    gedruckt: 'vollständig vokalisiert (Musterlösung Nr. 9)',
    sentAr: 'أَيُّ كِتَابٍ قَرَأْتَ؟', sentDe: 'Welches Buch hast du gelesen?' },

  /* ⭐ v617 (25.09.2026): die übrigen Beispielsätze derselben Seiten, für die
     Fragewörter, die in Übung 13 dünn waren (هَلْ 1, لِمَاذَا 1, مَتَى 2 Sätze in
     seiner Auswahl). Wie mf19-13-1: Wort für Wort aus der Musterlösung
     (regelsammlung-data.js, Karte f19-fragen; Abschrift S. 12–13), nichts
     ergänzt, die deutsche Zeile ist die der Musterlösung. NICHT genommen, weil
     schon da: كَمْ طَالِبًا فِي الْفَصْلِ؟ (gram-frage-kam), إِلَى أَيْنَ ذَهَبَ
     مُحَمَّدٌ؟ (gram-frage-ila-ayna), مَا هَذَا؟ (45777), كَيْفَ حَالُكَ؟ (by1-2-1),
     مِنْ أَيْنَ أَنْتَ؟ (gram-frage-min-ayna). */
  { id: 'mf19-12-1', werk: 'musterloesung-f19', seite: 12,
    gedruckt: 'vollständig vokalisiert (Musterlösung Nr. 9, Ja/Nein-Frage)',
    sentAr: 'هَلْ أَنْتَ طَالِبٌ؟', sentDe: 'Bist du Student?' },
  { id: 'mf19-13-2', werk: 'musterloesung-f19', seite: 13,
    gedruckt: 'vollständig vokalisiert (Musterlösung Nr. 9)',
    sentAr: 'هَلْ أَنْتَ مُدَرِّسٌ؟', sentDe: 'Bist du Lehrer?' },
  { id: 'mf19-13-3', werk: 'musterloesung-f19', seite: 13,
    gedruckt: 'vollständig vokalisiert (Musterlösung Nr. 9)',
    sentAr: 'مَتَى ذَهَبْتَ؟', sentDe: 'Wann bist du gegangen?' },
  { id: 'mf19-13-4', werk: 'musterloesung-f19', seite: 13,
    gedruckt: 'vollständig vokalisiert (Musterlösung Nr. 9)',
    sentAr: 'لِمَاذَا ذَهَبْتَ؟', sentDe: 'Warum bist du gegangen?' },
  { id: 'mf19-13-5', werk: 'musterloesung-f19', seite: 13,
    gedruckt: 'vollständig vokalisiert (Musterlösung Nr. 9)',
    sentAr: 'مَنْ هَذَا؟', sentDe: 'Wer ist das?' },
  { id: 'mf19-13-6', werk: 'musterloesung-f19', seite: 13,
    gedruckt: 'vollständig vokalisiert (Musterlösung Nr. 9)',
    sentAr: 'أَيْنَ الْكِتَابُ؟', sentDe: 'Wo ist das Buch?' },
  /* ⭐ Bayna Yadayk 1, Namen hinter „Vater", „Onkel", „Sohn" (25.09.2026, v624)
   * — möglich erst durch den neuen Zweig in js/irab.js: der Name hinter einem
   * Wort mit Besitzendung (وَالِدُهُ عَدْنَانُ) galt bis dahin als zweites خَبَر.
   * Elias am 25.09.2026 zuerst „vorerst draußen", dann zu meinem „Sätze mit
   * Namen nach „Bruder" oder „Vater": Die bleiben draußen": „aber eigentlich
   * ist das sogar auch okay weil wir bearbeiten das ja gerade".
   * Jedes Zeichen am Scan geprüft (Seitenbild ≈ 130 dpi, vergrößert). ERGÄNZT
   * wie oben nur, was die Schrift erzwingt (Fatha vor Alif, Kasra vor ي, وَ) —
   * dazu drei Zeichen, die dasselbe Wort in DIESEM Buch anderswo gedruckt
   * trägt: die Fatha auf dem Hamza von أَحْمَدُ (S. 84, «يَا أَحْمَدُ», by1-84-7)
   * und von أَخِي (S. 6, by1-6-1) und die Fatha auf dem ersten ه von هَذِهِ
   * (S. 6, 28, 43). Kein Endzeichen ist ergänzt.
   * Auf S. 30 steht «عَبْدُاللهِ» ohne Leerzeichen, eine Zeile davor «عَبْدُ الله»
   * mit — hier mit Leerzeichen: sonst liest der Zerleger EIN Wort mit Kasra am
   * Ende und meldet einen falschen Genitiv.
   * NICHT genommen (Pausalform, das Endzeichen fehlt — es zu setzen wäre eigene
   * Ḥaraka): S. 28 «هَذا والِدي عَدْنان وهُوَ مُهَنْدِس» und «هَذا أخِي عيسى وهُوَ
   * طالِب»; S. 30 عَبْدُ الله (erste Nennung), آمِنَة, عَبْدُ الـمُطَّلِب, العَبّاس,
   * حَمْزَة, أبو طالِب, صَفِيَّة, القاسِم, إبْراهيم, فاطِمَة, أُمّ كُلْثوم. «هَذا
   * والِدي عَدْنانُ» (S. 38, Übung 4) steckt ganz in by1-38-1.
   * Das Deutsch ist MEINE Übersetzung, im Buch steht keins. */
  { id: 'by1-30-1', werk: 'bayna-yadayk-1', seite: 30, kapitel: 2, vokalisationErgaenzt: true,
    gedruckt: 'وهَذا ohne Zeichen auf dem وَ und ohne Fatha vor dem Alif; عَبْدُاللهِ ohne Leerzeichen',
    sentAr: 'وَهَذَا ابْنُهُ عَبْدُ اللهِ.', sentDe: 'Und das ist sein Sohn Abdullah.' },
  { id: 'by1-30-2', werk: 'bayna-yadayk-1', seite: 30, kapitel: 2, vokalisationErgaenzt: true,
    gedruckt: 'وهذِهِ ohne Zeichen auf dem وَ und ohne Fatha auf dem ersten ه (gedruckt auf S. 6, 28, 43); اِبْنَتُهُ mit Kasra auf dem Alif',
    sentAr: 'وَهَذِهِ اِبْنَتُهُ رُقَيَّةُ.', sentDe: 'Und das ist seine Tochter Ruqayya.' },
  { id: 'by1-30-3', werk: 'bayna-yadayk-1', seite: 30, kapitel: 2, vokalisationErgaenzt: true,
    gedruckt: 'وهذِهِ ohne Zeichen auf dem وَ und ohne Fatha auf dem ersten ه (gedruckt auf S. 6, 28, 43); اِبْنَتُهُ mit Kasra auf dem Alif',
    sentAr: 'وَهَذِهِ اِبْنَتُهُ زَيْنَبُ.', sentDe: 'Und das ist seine Tochter Zainab.' },
  { id: 'by1-38-1', werk: 'bayna-yadayk-1', seite: 38, kapitel: 2, vokalisationErgaenzt: true,
    gedruckt: 'Übung 3, Beispiel (ط ٢): هَذا, والِدي und عَدْنانُ ohne Fatha vor dem Alif, والِدي ohne Kasra vor dem ي',
    sentAr: 'هَذَا وَالِدِي عَدْنَانُ، هُوَ مُهَنْدِسٌ.', sentDe: 'Das ist mein Vater Adnan, er ist Ingenieur.' },
  { id: 'by1-38-2', werk: 'bayna-yadayk-1', seite: 38, kapitel: 2, vokalisationErgaenzt: true,
    gedruckt: 'Übung 4, Beispiel (ط ٢): هَذا, والِدُهُ und عَدْنانُ ohne Fatha vor dem Alif',
    sentAr: 'هَذَا وَالِدُهُ عَدْنَانُ.', sentDe: 'Das ist sein Vater Adnan.' },
  { id: 'by1-48-2', werk: 'bayna-yadayk-1', seite: 48, kapitel: 2, vokalisationErgaenzt: true,
    gedruckt: 'Bildunterschrift in zwei Zeilen, ohne Schlusspunkt; هَذا ohne Fatha vor dem Alif; أحْمَدُ ohne Fatha auf dem Hamza (gedruckt auf S. 84: يا أَحْمَدُ)',
    sentAr: 'هَذَا عَمُّهُ أَحْمَدُ، هُوَ مُهَنْدِسٌ.', sentDe: 'Das ist sein Onkel Ahmad, er ist Ingenieur.' },
  { id: 'by1-48-3', werk: 'bayna-yadayk-1', seite: 48, kapitel: 2, vokalisationErgaenzt: true,
    gedruckt: 'Bildunterschrift; هَذا ohne Fatha vor dem Alif; أخِي: Fatha auf dem Hamza nicht sicher zu lesen (gedruckt auf S. 6: أَخي)',
    sentAr: 'هَذَا أَخِي عَمَّارٌ، هُوَ مُعَلِّمٌ.', sentDe: 'Das ist mein Bruder Ammar, er ist Lehrer.' }
];
