/* data/beispielsaetze.js -- geschriebene Beispielsaetze je Vokabel
 * ================================================================
 *
 * WOZU
 *
 * Elias am 19.08.2026: „warum gibts hier keinen beispielsatz? normalerweise
 * sollte jede vokabel mit einem beispielsatz kommen aus den kapiteln." Und auf
 * die Rueckfrage, wer sie schreibt: „die sollst du auch eigentlich bauen aber
 * da muss drauf geachtet werden, dass es natürlich dann auch die richtige
 * grammatik hat."
 *
 * Gemessen an dem Tag: von 4.446 Woertern hatten 171 einen Satz — alle aus
 * madina-1 Kapitel 1 bis 9. Ab Kapitel 10 kam nichts mehr.
 *
 * ⛔ WARUM NICHT IN vocab-data.js UND NICHT IN lehrbuch-saetze.js
 *
 * vocab-data.js ist ein Spiegel der arabicroots-Datenbank und wird neu
 * erzeugt, sobald Kapitel dazukommen — eingetragene Saetze waeren jedes Mal
 * weg. lehrbuch-saetze.js ist etwas anderes: dort steht ausdruecklich nur,
 * was IM LEHRWERK steht, jeder Satz mit seiner Buchseite. Ein geschriebener
 * Satz dort drin wuerde die Herkunft verwischen, und genau die ist der Wert
 * jener Datei.
 *
 * Deshalb eine dritte Datei. Was hier steht, ist VERFASST, nicht abgeschrieben
 * — und das bleibt nachpruefbar getrennt.
 *
 * ⭐⭐ DIE BEDINGUNG IST DIE KORREKTHEIT, NICHT DIE HERKUNFT
 *
 * Elias am 29.07.2026 zu genau dieser Frage: „solange deine Sätze richtig sind
 * und alle Regeln der arabischen Sprache folgen ist dem nichts auszusetzen."
 * Das ist die Freigabe — und zugleich die ganze Anforderung.
 *
 * ⛔ DREI REGELN FUER JEDEN NEUEN SATZ
 *
 * 1. NUR WOERTER, DIE ER HAT. Jedes Wort im Satz muss aus einem
 *    freigeschalteten Kapitel stammen (heute madina-1 Kapitel 1-11) oder aus
 *    seinem eigenen Bestand. Ein Satz, der mit Unbekanntem erklaert, erklaert
 *    nichts. Pruefen mit `node werkzeuge/vorrat.mjs`, das den Freischaltstand
 *    aus js/kern.js liest.
 * 2. VOLLSTAENDIG VOKALISIERT, mit korrekten Kasusendungen. Der Satz wird im
 *    Satz-Modus zerlegt und vom I'rab-Erklaerer analysiert — eine falsche
 *    Endung wird dort zur falschen Lehre.
 * 3. NUR BAUFORMEN, DIE ER KENNT. Nominalsatz, Idafa, Nomen mit Adjektiv,
 *    Praeposition mit Genitiv, einfacher Verbalsatz. Kein Passiv, keine
 *    Nebensaetze, keine Formen aus spaeteren Kapiteln.
 *
 * ⚠️ Der Satz soll moeglichst die REGEL zeigen, die zum Wort passt. زَوْجَةُ
 * التَّاجِرِ ist deshalb eine Idafa: das Wort steht in einer Konstruktion, die
 * Elias gerade lernt, statt in einem beliebigen Satz.
 *
 * AUFBAU
 *
 *   BEISPIELSAETZE[<id>] = { sentAr: '...', sentDe: '...' }
 *
 * Angewandt wird das in js/buecher.js, gleich nach dem Einhaengen eines Buchs
 * — und NUR dort, wo noch kein Satz steht. Vorhandenes gewinnt.
 */

const BEISPIELSAETZE = {

  /* زَمِيلٌ — Kollege / Mitschüler (madina-1, Kapitel 10)
     Nominalsatz mit Nisba-Anschluss: زَمِيلِي ist durch das angehaengte ي
     bestimmt, deshalb steht das Praedikat ohne Artikel. */
  '45899': {
    sentAr: 'زَمِيلِي طَالِبٌ جَدِيدٌ فِي الْجَامِعَةِ.',
    sentDe: 'Mein Mitschüler ist ein neuer Student an der Universität.'
  },

  /* زَوْجَةٌ — Ehefrau (madina-1, Kapitel 10)
     ⭐ Bewusst eine Idafa: زَوْجَةُ traegt kein Tanwin, weil ein zweites Nomen
     folgt — genau die Regel mudaf-ohne-al-01, an der Elias gerade arbeitet.
     التَّاجِرِ steht im Genitiv als مُضَاف إِلَيْهِ. */
  '45900': {
    sentAr: 'زَوْجَةُ التَّاجِرِ فِي الْبَيْتِ.',
    sentDe: 'Die Frau des Händlers ist im Haus.'
  },

  /* طِفْلٌ — Kind (madina-1, Kapitel 10)
     Nomen mit Adjektiv: الصَّغِيرُ folgt الطِّفْلُ in Bestimmtheit, Kasus und
     Geschlecht — die Uebereinstimmung des نَعْت. */
  '45901': {
    sentAr: 'الطِّفْلُ الصَّغِيرُ فِي الْغُرْفَةِ.',
    sentDe: 'Das kleine Kind ist im Zimmer.'
  },

  /* فَتًى — junger Mann (madina-1, Kapitel 10)
     ⭐ Der Satz zeigt die Besonderheit des Wortes: mit اَلْ verschwindet das
     Tanwin und aus فَتًى wird الْفَتَى — die أَلِف مَقْصورة bleibt, das ـً
     faellt weg. Genau das ist an dieser Vokabel schwierig. */
  '45902': {
    sentAr: 'الْفَتَى طَالِبٌ فِي الْجَامِعَةِ.',
    sentDe: 'Der junge Mann ist Student an der Universität.'
  },

  /* أَحَبَّ — lieben (madina-1, Kapitel 11)
     ⭐ Das einzige Verb der fuenf, deshalb ein Verbalsatz: أَحَبَّ (Verb),
     الْوَلَدُ als Taeter im Nominativ, أُمَّهُ als Objekt im Akkusativ. Die
     Schadda auf dem بّ zieht die beiden ب der Wurzel zusammen. */
  '45903': {
    sentAr: 'أَحَبَّ الْوَلَدُ أُمَّهُ.',
    sentDe: 'Der Junge liebte seine Mutter.'
  },

  /* ------------------------------------------------------------------------
     KAPITEL 12 — VORGESCHRIEBEN (19.08.2026)

     Elias steht bei Kapitel 11. Gemessen an dem Tag: Kapitel 12 bis 15 haben
     ALLE ihre drei Eselsbruecken, aber ZUSAMMEN NULL Beispielsaetze. Hakt er
     Kapitel 12 an, kaemen die neun Woerter ohne einen einzigen Satz an — und
     damit ohne Markierung und ohne eine einzige Uebungsaufgabe.

     ⭐ Sichtbar werden sie erst, wenn er das Kapitel anhakt:
     `nichtVorausgeschrieben()` in js/saetze.js blendet jeden Satz aus, dessen
     Wort er noch nicht hat. Vorschreiben, nicht vorzeigen — genau das meint
     das Fenster Lernstand+3 in werkzeuge/vorrat.mjs.

     ⛔ HERKUNFT: kein Zeichen ist hier von Hand vokalisiert.
     Grundformen und weibliche Formen stehen so im arabicroots-Abzug (`ar`,
     `femSg`). Dazu kommen genau zwei Umformungen — unbestimmt → bestimmt und
     das erste Wort einer Idafa — und beide sind an **359 wirklich
     vorkommenden Wortformen** geeicht worden, bevor sie benutzt wurden.
     Die Eichung hat drei Fehler gefunden, die alle kaputtes Arabisch ergeben
     haetten: Tanwin vor einem Alif maqsura, Tanwin hinter einer Schadda, und
     Fathatan, die zur Fatha werden muss statt zu verschwinden.
     ------------------------------------------------------------------------ */

  /* عَمَّةٌ — Tante väterlicherseits (madina-1, Kapitel 12)
     Idafa: das erste Wort traegt kein Tanwin, das zweite steht im Genitiv. */
  '45904': {
    sentAr: 'عَمَّةُ الْوَلَدِ فِي الْبَيْتِ.',
    sentDe: 'Die Tante des Jungen ist im Haus.'
  },

  /* خَالَةٌ — Tante mütterlicherseits (madina-1, Kapitel 12)
     Idafa als Subjekt, Beruf als unbestimmtes Praedikat. */
  '45905': {
    sentAr: 'خَالَةُ الْبِنْتِ مُمَرِّضَةٌ.',
    sentDe: 'Die Tante des Mädchens ist Krankenschwester.'
  },

  /* شَجَرَةٌ — Baum (madina-1, Kapitel 12)
     Nomen mit Adjektiv, beide bestimmt und weiblich; Sonnenbuchstabe zweimal. */
  '45906': {
    sentAr: 'الشَّجَرَةُ الْكَبِيرَةُ فِي الشَّارِعِ.',
    sentDe: 'Der große Baum ist in der Straße.'
  },

  /* سُورِيَا — Syrien (madina-1, Kapitel 12)
     Laendername nach einer Praeposition, unveraenderlich. */
  '45907': {
    sentAr: 'الْمُدَرِّسُ مِنْ سُورِيَا.',
    sentDe: 'Der Lehrer ist aus Syrien.'
  },

  /* مَدْرَسَةٌ مُتَوَسِّطَةٌ — Mittelschule (madina-1, Kapitel 12)
     Zweiteiliger Begriff: Nomen und Adjektiv beide bestimmt. */
  '45908': {
    sentAr: 'الْمَدْرَسَةُ الْمُتَوَسِّطَةُ قَرِيبَةٌ.',
    sentDe: 'Die Mittelschule ist nah.'
  },

  /* مُفَتِّشٌ — Inspektor (madina-1, Kapitel 12)
     Einfacher Nominalsatz mit Ortsangabe. */
  '45909': {
    sentAr: 'الْمُفَتِّشُ فِي الْمَدْرَسَةِ.',
    sentDe: 'Der Inspektor ist in der Schule.'
  },

  /* فَتَاةٌ — junge Frau (madina-1, Kapitel 12)
     Gegenstueck zum Satz von fata aus Kapitel 10 — dieselbe Form, weiblich. */
  '45910': {
    sentAr: 'الْفَتَاةُ طَالِبَةٌ فِي الْجَامِعَةِ.',
    sentDe: 'Die junge Frau ist Studentin an der Universität.'
  },

  /* مَالِيزِيَا — Malaysia (madina-1, Kapitel 12)
     Nomen mit Adjektiv, dann Praeposition mit Laendernamen. */
  '45911': {
    sentAr: 'الطَّالِبُ الْجَدِيدُ مِنْ مَالِيزِيَا.',
    sentDe: 'Der neue Student ist aus Malaysia.'
  },

  /* مَمْلَكَةٌ — Königreich (madina-1, Kapitel 12)
     Nomen mit bestimmtem Adjektiv, danach das unbestimmte Praedikat. */
  '45912': {
    sentAr: 'الْمَمْلَكَةُ الْجَدِيدَةُ بَعِيدَةٌ.',
    sentDe: 'Das neue Königreich ist fern.'
  },

  /* ------------------------------------------------------------------------
     KAPITEL 13 — VORGESCHRIEBEN (19.08.2026)

     Gemessen am selben Tag: Kapitel 13 hat 8 Woerter, ALLE mit ihren drei
     Eselsbruecken — und null Beispielsaetzen. Haekt Elias das Kapitel an,
     kaemen die Woerter ohne einen einzigen Satz an, also ohne Markierung und
     ohne eine einzige Uebungsaufgabe.

     ⛔ HERKUNFT: kein Zeichen ist von Hand vokalisiert. Grundformen und
     weibliche Formen stehen so im arabicroots-Abzug; hadha, hadhihi,
     Muhammad, Allahi und mina sind BELEGE aus dem vorhandenen Satzbestand,
     jeder mit Eindeutigkeitspruefung geholt. Die vier Umformungen dazwischen
     sind an 111 wirklich vorkommenden Bestandsformen geeicht.
     ------------------------------------------------------------------------ */

  /* ضَيْفٌ — Gast (madina-1, Kapitel 13)
     Nominalsatz mit Ortsangabe; Sonnenbuchstabe im Artikel. */
  '45913': {
    sentAr: 'الضَّيْفُ فِي الْبَيْتِ.',
    sentDe: 'Der Gast ist im Haus.'
  },

  /* حَقْلٌ — Feld (madina-1, Kapitel 13)
     Der Bauer aus Kapitel 6 trifft sein Feld — zwei Woerter, die zusammengehoeren. */
  '45914': {
    sentAr: 'الْفَلَّاحُ فِي الْحَقْلِ.',
    sentDe: 'Der Bauer ist auf dem Feld.'
  },

  /* النَّاسُ — die Leute (madina-1, Kapitel 13)
     Das Wort bringt den Artikel schon mit und steht immer bestimmt. */
  '45915': {
    sentAr: 'النَّاسُ فِي السُّوقِ.',
    sentDe: 'Die Leute sind auf dem Markt.'
  },

  /* مَطْعَمٌ — Restaurant (madina-1, Kapitel 13)
     Vor einem Wort mit Artikel heisst die Praeposition mina, nicht min. */
  '45916': {
    sentAr: 'الْمَطْعَمُ قَرِيبٌ مِنَ الْجَامِعَةِ.',
    sentDe: 'Das Restaurant ist nahe an der Universität.'
  },

  /* شَيْخٌ — alter Mann / Gelehrter (madina-1, Kapitel 13)
     Der Ort, an dem man einen schaych am ehesten trifft. */
  '45917': {
    sentAr: 'الشَّيْخُ فِي الْمَسْجِدِ.',
    sentDe: 'Der Gelehrte ist in der Moschee.'
  },

  /* أُسْتَاذَةٌ — Professorin (madina-1, Kapitel 13)
     Artikel vor einem Hamzah-Anlaut, wie in al-uchtu aus dem Bestand. */
  '45918': {
    sentAr: 'الْأُسْتَاذَةُ فِي الْجَامِعَةِ.',
    sentDe: 'Die Professorin ist an der Universität.'
  },

  /* امْرَأَةٌ — Frau (madina-1, Kapitel 13)
     Unbestimmt gelassen: mit Artikel faellt das Alif weg (al-marʾatu) — eine Umformung, die noch nicht drankam. */
  '45919': {
    sentAr: 'هَذِهِ امْرَأَةٌ مُجْتَهِدَةٌ.',
    sentDe: 'Dies ist eine fleißige Frau.'
  },

  /* زَوْجٌ — Ehemann (madina-1, Kapitel 13)
     Idafa als Subjekt, Beruf als unbestimmtes Praedikat. */
  '45920': {
    sentAr: 'زَوْجُ الْمُدَرِّسَةِ تَاجِرٌ.',
    sentDe: 'Der Ehemann der Lehrerin ist Händler.'
  },

  /* ------------------------------------------------------------------------
     KAPITEL 14 — VORGESCHRIEBEN (19.08.2026)   13 Woerter, vorher null Saetze

     Die vier Fakultaeten sind im Abzug bereits zusammengesetzte Ausdruecke
     (kulliyyatu t-tibbi). Sie bleiben als Ganzes stehen; nur das erste Wort
     traegt den Kasus, und der Artikel des zweiten wird auf die Schreibung des
     Satzbestands gebracht — der setzt 160x ein Sukun aufs Lam, der Abzug 10x
     keines.

     ⚠️ Bei rajab bleibt die Abzugsform mit Tanwin stehen. Ob der Monatsname
     als Eigenname zu den mamnu min as-sarf gehoert und deshalb OHNE Tanwin
     stuende, ist eine Frage an seinen Lehrer — nicht eine, die ich still
     entscheide.
     ------------------------------------------------------------------------ */

  /* دُسْتُورٌ — Verfassung (madina-1, Kapitel 14)
     Das Koenigreich aus Kapitel 12 bekommt seine Verfassung. */
  '45921': {
    sentAr: 'دُسْتُورُ الْمَمْلَكَةِ جَدِيدٌ.',
    sentDe: 'Die Verfassung des Königreichs ist neu.'
  },

  /* قِبْلَةٌ — Gebetsrichtung (madina-1, Kapitel 14)
     ila mit Genitiv; die Kaaba kennt er aus Kapitel 5. */
  '45922': {
    sentAr: 'الْقِبْلَةُ إِلَى الْكَعْبَةِ.',
    sentDe: 'Die Gebetsrichtung ist zur Kaaba.'
  },

  /* مَحْكَمَةٌ — Gericht (madina-1, Kapitel 14)
     Weibliches Nomen, weibliches Adjektiv — die Angleichung ist hoerbar. */
  '45923': {
    sentAr: 'الْمَحْكَمَةُ قَرِيبَةٌ مِنَ السُّوقِ.',
    sentDe: 'Das Gericht ist nahe am Markt.'
  },

  /* حَفِيدٌ — Enkel (madina-1, Kapitel 14)
     Idafa mit dem schaych aus Kapitel 13 — drei Generationen in vier Woertern. */
  '45924': {
    sentAr: 'حَفِيدُ الشَّيْخِ طَالِبٌ.',
    sentDe: 'Der Enkel des Gelehrten ist Student.'
  },

  /* حَدِيقَةٌ — Garten (madina-1, Kapitel 14)
     Zwei Praedikate mit wa- verbunden, beide weiblich. */
  '45925': {
    sentAr: 'الْحَدِيقَةُ جَمِيلَةٌ وَنَظِيفَةٌ.',
    sentDe: 'Der Garten ist schön und sauber.'
  },

  /* رَجَبٌ — Rajab (Monat) (madina-1, Kapitel 14)
     Beide Formen stehen unveraendert im Abzug: der Monatsname ist im Grundfall belassen. */
  '45926': {
    sentAr: 'رَجَبٌ قَرِيبٌ.',
    sentDe: 'Rajab ist nah.'
  },

  /* اليُونَانُ — Griechenland (madina-1, Kapitel 14)
     Laendername mit Artikel nach mina — dasselbe Muster wie mina s-sini. */
  '45927': {
    sentAr: 'الْأُسْتَاذَةُ مِنَ الْيُونَانِ.',
    sentDe: 'Die Professorin ist aus Griechenland.'
  },

  /* مَطَارٌ — Flughafen (madina-1, Kapitel 14)
     Gegenstueck zum Restaurant-Satz: einmal nah, einmal fern. */
  '45928': {
    sentAr: 'الْمَطَارُ بَعِيدٌ مِنَ الْمَدِينَةِ.',
    sentDe: 'Der Flughafen ist weit von der Stadt entfernt.'
  },

  /* كُلِّيَّةُ الطِّبِّ — medizinische Fakultät (madina-1, Kapitel 14)
     Der Begriff ist selbst schon eine Idafa und bleibt als Ganzes stehen. */
  '45929': {
    sentAr: 'كُلِّيَّةُ الطِّبِّ فِي الْجَامِعَةِ.',
    sentDe: 'Die medizinische Fakultät ist an der Universität.'
  },

  /* كُلِّيَّةُ الهَنْدَسَةِ — Ingenieursfakultät (madina-1, Kapitel 14)
     Das Praedikat richtet sich nach kulliyyah — weiblich, obwohl der Begriff zwei Woerter hat. */
  '45930': {
    sentAr: 'كُلِّيَّةُ الْهَنْدَسَةِ جَدِيدَةٌ.',
    sentDe: 'Die Ingenieursfakultät ist neu.'
  },

  /* كُلِّيَّةُ التِّجَارَةِ — Wirtschaftsfakultät (madina-1, Kapitel 14)
     Dieselbe Bauform wie beim Gericht, nur mit einem zweiteiligen Subjekt. */
  '45931': {
    sentAr: 'كُلِّيَّةُ التِّجَارَةِ قَرِيبَةٌ مِنَ الْمَكْتَبَةِ.',
    sentDe: 'Die Wirtschaftsfakultät ist nahe an der Bibliothek.'
  },

  /* كُلِّيَّةُ الشَّرِيعَةِ — Fakultät für islamisches Recht (madina-1, Kapitel 14)
     Die vierte Fakultaet — vier gleich gebaute Saetze, die sich nur im Praedikat unterscheiden. */
  '45932': {
    sentAr: 'كُلِّيَّةُ الشَّرِيعَةِ مَشْهُورَةٌ.',
    sentDe: 'Die Fakultät für islamisches Recht ist berühmt.'
  },

  /* نَبِيٌّ — Prophet (madina-1, Kapitel 14)
     Echo auf den Satz muhammadun rasulu llahi, den er schon hat. */
  '45933': {
    sentAr: 'مُحَمَّدٌ نَبِيُّ اللهِ.',
    sentDe: 'Muhammad ist der Prophet Allahs.'
  },

  /* ------------------------------------------------------------------------
     KAPITEL 15 — VORGESCHRIEBEN (19.08.2026)   bisher nur 1 Wort im Abzug
     ------------------------------------------------------------------------ */

  /* أُسْبُوعٌ — Woche (madina-1, Kapitel 15)
     hadha vor einem bestimmten Nomen — dieselbe Bauform wie hadha l-kursiyyu. */
  '45934': {
    sentAr: 'هَذَا الْأُسْبُوعُ طَوِيلٌ.',
    sentDe: 'Diese Woche ist lang.'
  },


  /* ------------------------------------------------------------------------
     KAPITEL 24 — EINZELN FREIGESCHALTET (20.08.2026)

     Elias: „teilweise benutzt mein lehrer begriffe die wir in späteren
     kapiteln finden … beispielsweise wird in kapitel 24 das wort naat
     (adjektiv) freigeschaltet oder ich, du. wir usw.. ich möchte aber nur die
     vereinzelnen wörter haben ohne den rest des kapitels zu haben."

     Seit demselben Tag kann er einzelne Wörter freischalten, ohne das Kapitel
     zu öffnen. Gemessen an dem Tag: ALLE 67 Wörter aus Kapitel 24 haben genau
     EINEN Vorschlag und NULL Beispielsätze — wer eines davon freischaltet,
     bekommt also eine nackte Karte. Die sieben hier sind die, die er
     namentlich genannt hat.

     ⛔ Alle Sätze bauen ausschließlich auf Kapitel 1–12 auf, geprüft gegen
     vocab-data.js: مُدَرِّسٌ/طَالِبٌ/طَبِيبٌ/مَسْجِدٌ/بَيْتٌ/كِتَابٌ (Kap. 1),
     جَدِيدٌ/صَغِيرٌ (Kap. 3), فِي (Kap. 4), بِنْتٌ (Kap. 5). Die femininen Formen
     مُدَرِّسَةٌ und صَغِيرَةٌ stehen als `femSg` an ihren Grundwörtern.

     ⚠️ Der maskuline Plural (مُسْلِمُونَ) wäre bei „wir“ und „sie“ das
     Naheliegende — er steht aber erst in Kapitel 14. Deshalb beide Male ein
     Ortssatz mit Präposition statt eines Prädikatsnomens im Plural.
     ------------------------------------------------------------------------ */

  /* أَنَا — ich (madina-1, Kapitel 24)
     Nominalsatz in seiner einfachsten Form: das Pronomen ist Mubtadaʾ und
     trägt kein Kasuszeichen (es ist مَبْنِيٌّ), das Chābar steht unbestimmt im
     Nominativ. Genau die Bauform, mit der Kapitel 24 die Pronomen einführt. */
  '50154': {
    sentAr: 'أَنَا مُدَرِّسٌ.',
    sentDe: 'Ich bin ein Lehrer.'
  },

  /* نَحْنُ — wir (madina-1, Kapitel 24)
     ⭐ Bewusst ein Ortssatz: das Prädikat wäre sonst ein maskuliner Plural,
     und den lernt er erst in Kapitel 14. فِي zieht den Genitiv nach sich,
     deshalb الْمَسْجِدِ mit Kasra. */
  '50155': {
    sentAr: 'نَحْنُ فِي الْمَسْجِدِ.',
    sentDe: 'Wir sind in der Moschee.'
  },

  /* أَنْتَ — du (m.) (madina-1, Kapitel 24)
     ⭐ Mit Adjektiv, damit der Satz gleich das نَعْت zeigt: جَدِيدٌ folgt
     طَالِبٌ in Unbestimmtheit, Kasus und Geschlecht. */
  '50156': {
    sentAr: 'أَنْتَ طَالِبٌ جَدِيدٌ.',
    sentDe: 'Du bist ein neuer Student.'
  },

  /* هُوَ — er (madina-1, Kapitel 24) */
  '50157': {
    sentAr: 'هُوَ طَبِيبٌ.',
    sentDe: 'Er ist ein Arzt.'
  },

  /* هِيَ — sie (Sg.) (madina-1, Kapitel 24)
     Das Gegenstück zu أَنَا مُدَرِّسٌ: dieselbe Bauform, aber feminin — die
     Tāʾ marbūṭa macht den Unterschied sichtbar. */
  '50158': {
    sentAr: 'هِيَ مُدَرِّسَةٌ.',
    sentDe: 'Sie ist eine Lehrerin.'
  },

  /* هُمْ — sie (Pl. m.) (madina-1, Kapitel 24)
     Wieder ein Ortssatz aus demselben Grund wie bei نَحْنُ. */
  '50159': {
    sentAr: 'هُمْ فِي الْبَيْتِ.',
    sentDe: 'Sie sind im Haus.'
  },

  /* نَعْتٌ — Attribut / Adjektiv (madina-1, Kapitel 24)
     ⭐ Das Wort erklärt sich hier selbst: الْجَدِيدُ ist das Attribut, und der
     Satz sagt genau das über es aus. لِ + الْكِتَابِ verschmilzt zu لِلْكِتَابِ —
     das Alif des Artikels fällt weg, das Lām bleibt doppelt stehen.
     ⚠️ مَنْعُوتٌ (das Beschriebene) wäre das Gegenstück, steht aber nicht in
     seinem Bestand — deshalb hier nur die eine Hälfte des Begriffspaars. */
  '50428': {
    sentAr: 'الْجَدِيدُ نَعْتٌ لِلْكِتَابِ.',
    sentDe: '‚Neu‘ ist ein Attribut zum Buch.'
  },

  /* ------------------------------------------------------------------------
     KAPITEL 16-18 — VORGESCHRIEBEN (20.08.2026)

     Elias steht bei Kapitel 12, das Fenster reicht drei Kapitel voraus — also
     bis 15, und die sind versorgt. Hakt er 13 an, wandert das Fenster auf 16.
     Gemessen an diesem Tag: die neun Woerter aus 16, 17 und 18 haben ALLE ihre
     drei Eselsbruecken, ihre Wurzel und ihren Plural — nur der Beispielsatz
     fehlt bei jedem einzelnen. Ohne ihn kaemen sie ohne Markierung und ohne
     eine einzige Uebungsaufgabe an.

     ⛔ Alle Saetze benutzen ausschliesslich Kapitel 1-12.
     ------------------------------------------------------------------------ */

  /* نَهْرٌ — Fluss (madina-1, Kapitel 16)
     Hinweiswort mit unbestimmtem Nomen und نَعْت: كَبِيرٌ folgt نَهْرٌ in
     Unbestimmtheit, Kasus und Geschlecht. */
  '45935': {
    sentAr: 'هَذَا نَهْرٌ كَبِيرٌ.',
    sentDe: 'Das ist ein großer Fluss.'
  },

  /* بَحْرٌ — Meer (madina-1, Kapitel 16)
     Der schlichteste Nominalsatz: bestimmtes Mubtadaʾ, unbestimmtes Chabar.
     Genau daran erkennt man, wo der Satz aufhoert — waeren beide bestimmt,
     waere بَارِدٌ ein نَعْت und der Satz noch gar nicht fertig. */
  '45936': {
    sentAr: 'الْبَحْرُ بَارِدٌ.',
    sentDe: 'Das Meer ist kalt.'
  },

  /* فُنْدُقٌ — Hotel (madina-1, Kapitel 16)
     ⭐ Mit مِنَ statt مِنْ: vor dem Artikel bekommt die Praeposition eine
     Fatḥa, weil zwei Sukun nicht aufeinandertreffen duerfen — das نْ von مِنْ
     und das لْ von اَلْ. Dieselbe Regel wie bei مِنَ الْبَيْتِ. */
  '45937': {
    sentAr: 'الْفُنْدُقُ قَرِيبٌ مِنَ الْمَسْجِدِ.',
    sentDe: 'Das Hotel ist nahe bei der Moschee.'
  },

  /* رَخِيصٌ — billig (madina-1, Kapitel 17)
     Hinweiswort mit BESTIMMTEM Nomen — dann steht das Chabar dahinter und
     bleibt unbestimmt. Das Gegenstueck zu هَذَا نَهْرٌ كَبِيرٌ eine Zeile
     weiter oben. */
  '45938': {
    sentAr: 'هَذَا الْقَلَمُ رَخِيصٌ.',
    sentDe: 'Dieser Stift ist billig.'
  },

  /* عَجَلَةٌ — Rad (madina-1, Kapitel 18)
     ⭐ Eine إِضَافَة: عَجَلَةُ traegt KEIN Tanwin, weil ein zweites Nomen
     folgt, und السَّيَّارَةِ steht im Genitiv als مُضَاف إِلَيْهِ. Das
     Adjektiv am Ende gehoert zum ERSTEN Wort, nicht zum zweiten. */
  '45939': {
    sentAr: 'عَجَلَةُ السَّيَّارَةِ صَغِيرَةٌ.',
    sentDe: 'Das Rad des Autos ist klein.'
  },

  /* سَنَةٌ — Jahr (madina-1, Kapitel 18)
     Das weibliche Gegenstueck zu هَذَا الْأُسْبُوعُ طَوِيلٌ (Kapitel 15):
     هَذِهِ statt هَذَا und طَوِيلَةٌ statt طَوِيلٌ — dieselbe Bauform, an
     zwei Stellen weiblich. */
  '45940': {
    sentAr: 'هَذِهِ السَّنَةُ طَوِيلَةٌ.',
    sentDe: 'Dieses Jahr ist lang.'
  },

  /* مِسْطَرَةٌ — Lineal (madina-1, Kapitel 18) */
  '45941': {
    sentAr: 'الْمِسْطَرَةُ عَلَى الْمَكْتَبِ.',
    sentDe: 'Das Lineal ist auf dem Schreibtisch.'
  },

  /* سَبُّورَةٌ — Tafel (madina-1, Kapitel 18) */
  '45942': {
    sentAr: 'السَّبُّورَةُ فِي الْفَصْلِ.',
    sentDe: 'Die Tafel ist im Klassenzimmer.'
  },

  /* رَكْعَةٌ — Gebetseinheit (madina-1, Kapitel 18)
     ⚠️ صَلَاة steht nicht in seinem Bestand, deshalb kein Satz ueber das
     Gebet selbst. Hinweiswort und نَعْت genuegen und bleiben richtig. */
  '45943': {
    sentAr: 'هَذِهِ رَكْعَةٌ طَوِيلَةٌ.',
    sentDe: 'Das ist eine lange Gebetseinheit.'
  },

  /* ------------------------------------------------------------------------
     KAPITEL 24 — DIE GRAMMATIKBEGRIFFE SEINES LEHRERS (20.08.2026)

     Gemessen an diesem Tag: Kapitel 24 enthält elf grammatische Fachbegriffe.
     Fünf davon hat er längst als Fachbegriff (نَعْت, مَرْفُوع, مَجْرُور,
     مُضَاف, إِضَافَة) — diese sechs nicht. Alle bis auf مَفْعُول kommen
     in SEINEN eigenen Regeln vor: مُبْتَدَأ in 3, مَنْصُوب in 4, هَلْ in 3
     (mit eigener Regel), الَّذِي in ismun-mawsul-alladhi-01.

     ⚠ـ️ Sie stehen hier, damit sie FERTIG sind, wenn er sie einzeln
     freischaltet — nicht weil sie fest dazugehören sollen. Ob sie
     Fachbegriffe werden, ist eine Frage an ihn und steht in der To-Do.

     ⛔ Metasprache ist knapp: فَتْحَة, عَلَامَة, جُمْلَة, حَرْف und فِعْل
     stehen NICHT in seinem Bestand. Verfügbar sind اِسْمٌ (Kap. 5) und die
     fünfzehn Fachbegriffe. Danach sind die Sätze gebaut.
     ------------------------------------------------------------------------ */

  /* مُبْتَدَأٌ — Subjekt des Nominalsatzes (madina-1, Kapitel 24)
     Der Satz sagt beides auf einmal: was das Wort IST und in welchem Fall es
     steht. مَرْفُوع hat er als Fachbegriff. */
  '50467': {
    sentAr: 'الْبَيْتُ مُبْتَدَأٌ.',
    sentDe: '‚Das Haus‘ ist ein Mubtadaʾ.'
  },

  /* فَاعِلٌ — Subjekt des Verbalsatzes (madina-1, Kapitel 24)
     Dieselbe Bauform wie beim مُبْتَدَأ — und genau das ist der Punkt: beide
     stehen im Nominativ, nur in verschiedenen Satzarten. */
  '50469': {
    sentAr: 'الطَّالِبُ فَاعِلٌ.',
    sentDe: '‚Der Student‘ ist ein Fāʿil.'
  },

  /* مَفْعُولٌ بِهِ — direktes Objekt (madina-1, Kapitel 24)
     ⚠️ Ohne مَنْصُوب im Satz, obwohl es dazugehört: das Wort steht selbst erst
     in Kapitel 24, und ein Satz, der mit Unbekanntem erklärt, erklärt nichts. */
  '50468': {
    sentAr: 'الْكِتَابُ مَفْعُولٌ بِهِ.',
    sentDe: '‚Das Buch‘ ist ein direktes Objekt.'
  },

  /* مَنْصُوبٌ — im Akkusativ (madina-1, Kapitel 24)
     ⭐ Eine Aufzählung statt eines Satzes, und mit Absicht: von den drei Fällen
     hat er مَرْفُوع und مَجْرُور als Fachbegriff, مَنْصُوب fehlt als
     einziger. Hier stehen sie zum ersten Mal beisammen — dieselbe Bauform wie
     صِفْرٌ، وَاحِدٌ، اِثْنَانِ. */
  '50471': {
    sentAr: 'هَذَا الْاِسْمُ مَنْصُوبٌ.',
    sentDe: 'Dieses Nomen steht im Akkusativ.'
  },

  /* الَّذِي — Relativpronomen (madina-1, Kapitel 24)
     Seine Regel dazu ist ismun-mawsul-alladhi-01. Das Relativpronomen
     schließt an ein BESTIMMTES Nomen an — deshalb الطَّالِبُ mit Artikel. */
  '50166': {
    sentAr: 'الطَّالِبُ الَّذِي فِي الْمَدْرَسَةِ.',
    sentDe: 'Der Student, der in der Schule ist.'
  },

  /* هَلْ — Fragepartikel (madina-1, Kapitel 24)
     Drei seiner Regeln behandeln sie, eine davon heißt fragepartikel-hal-01.
     هَلْ steht ganz vorn und macht aus einer Aussage eine Ja-Nein-Frage,
     ohne dass sich sonst etwas ändert. */
  '50167': {
    sentAr: 'هَلْ هَذَا كِتَابٌ؟',
    sentDe: 'Ist das ein Buch?'
  },
};
