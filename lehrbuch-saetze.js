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

  { id: 'mb1-42-2', seite: 42, kapitel: 8,
    sentAr: 'اسْمُ التَّاجِرِ مَحْمُودٌ وَاسْمُ الطَّبِيبِ سَعِيدٌ.',
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

  { id: 'mb1-63-1', seite: 63, kapitel: 12,
    sentAr: 'مَا اسْمُكِ؟ اسْمِي آمِنَةُ.',
    sentDe: 'Wie heißt du? Mein Name ist Amina.' },

  { id: 'mb1-63-2', seite: 63, kapitel: 12,
    sentAr: 'لَا. هِيَ بِنْتُ عَمِّي.',
    /* عَمّ ist ausdrücklich der Onkel väterlicherseits (mütterlicherseits wäre
       خَال). "Cousine" zuerst, weil das die Bedeutung ist; die wörtliche Form
       dahinter, weil genau sie die إِضافة zeigt, um die es im Kapitel geht. */
    sentDe: 'Nein. Sie ist meine Cousine — die Tochter meines Onkels väterlicherseits.' },

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
    sentDe: 'Das Buch, das auf dem Schreibtisch ist, gehört dem Lehrer.' }
];
