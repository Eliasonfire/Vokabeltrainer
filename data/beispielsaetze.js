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

  /* ------------------------------------------------------------------------
     KAPITEL 19-21 — VORGESCHRIEBEN (20.08.2026)

     Wie bei 16-18: alle vierzehn Wörter haben ihre drei Eselsbrücken und ihre
     Wurzel, keines einen Beispielsatz.

     ⛔ Nur Kapitel 1-12 — mit einer benannten Ausnahme: ثَمَنٌ und قِرْشٌ
     stützen sich gegenseitig, ebenso ثَمَنٌ und نِصْفٌ. Sie stehen im SELBEN
     Kapitel: wer eines davon hat, hat auch das andere.

     ⚠️ قَلِيل und سَاعَة stehen NICHT in seinem Bestand — die
     naheliegenden Sätze zu ثَمَنٌ („der Preis ist niedrig“) und نِصْفٌ („eine
     halbe Stunde“) gehen deshalb nicht.
     ------------------------------------------------------------------------ */

  /* كُلٌّ — alle / jeder (madina-1, Kapitel 19)
     ⭐ Eine إِضَافَة mit UNBESTIMMTEM Zweitglied: كُلُّ steht ohne Tanwin,
     طَالِبٍ im Genitiv mit Tanwin — und genau dadurch heißt es „jeder
     Student“ und nicht „der ganze Student“. */
  '45944': {
    sentAr: 'كُلُّ طَالِبٍ فِي الْمَدْرَسَةِ.',
    sentDe: 'Jeder Student ist in der Schule.'
  },

  /* مُخْتَلِفٌ — unterschiedlich (madina-1, Kapitel 19)
     Hinweiswort mit bestimmtem Nomen, das Adjektiv folgt als خَبَر. */
  '45945': {
    sentAr: 'هَذَا الْكِتَابُ مُخْتَلِفٌ.',
    sentDe: 'Dieses Buch ist anders.'
  },

  /* أُورُوبَّا — Europa (madina-1, Kapitel 19)
     ⚠️ Ländernamen sind im Arabischen weiblich, deshalb كَبِيرَةٌ mit Tāʾ
     marbūṭa — obwohl am Wort selbst nichts Weibliches zu sehen ist. Und sie
     tragen kein Tanwin: أُورُوبَّا ist مَمْنُوع مِنَ الصَّرْف. */
  '45946': {
    sentAr: 'أُورُوبَّا كَبِيرَةٌ.',
    sentDe: 'Europa ist groß.'
  },

  /* يُوغُوسْلَافِيَا — Jugoslawien (madina-1, Kapitel 19)
     فِي zieht den Genitiv nach sich — an أُورُوبَّا ist davon nichts zu
     sehen, weil das Alif am Ende unveränderlich ist. */
  '45947': {
    sentAr: 'يُوغُوسْلَافِيَا فِي أُورُوبَّا.',
    sentDe: 'Jugoslawien liegt in Europa.'
  },

  /* ثَمَنٌ — Preis (madina-1, Kapitel 19)
     Frage mit مَا und einer إِضَافَة dahinter — genau die Form, in der man
     im Buch nach dem Preis fragt. */
  '45948': {
    sentAr: 'مَا ثَمَنُ الْكِتَابِ؟',
    sentDe: 'Was kostet das Buch?'
  },

  /* نِصْفٌ — Hälfte (madina-1, Kapitel 19)
     نِصْفُ steht ohne Tanwin als مُضَاف; الثَّمَنِ ist der مُضَاف إِلَيْهِ.
     Beide Wörter stehen im selben Kapitel. */
  '45949': {
    sentAr: 'هَذَا نِصْفُ الثَّمَنِ.',
    sentDe: 'Das ist die Hälfte des Preises.'
  },

  /* قِرْشٌ — Geldeinheit (madina-1, Kapitel 19) */
  '45950': {
    sentAr: 'ثَمَنُ الْقَلَمِ قِرْشٌ.',
    sentDe: 'Der Preis des Stifts ist ein Qirš.'
  },

  /* رَاكِبٌ — Passagier (madina-1, Kapitel 19) */
  '45951': {
    sentAr: 'الرَّاكِبُ فِي السَّيَّارَةِ.',
    sentDe: 'Der Passagier ist im Auto.'
  },

  /* سُؤَالٌ — Frage (madina-1, Kapitel 19) */
  '45952': {
    sentAr: 'هَذَا سُؤَالٌ جَدِيدٌ.',
    sentDe: 'Das ist eine neue Frage.'
  },

  /* كَلِمَةٌ — Wort (madina-1, Kapitel 20)
     Weibliches Hinweiswort und weibliches نَعْت — die Tāʾ marbūṭa steht
     zweimal. */
  '45953': {
    sentAr: 'هَذِهِ كَلِمَةٌ جَدِيدَةٌ.',
    sentDe: 'Das ist ein neues Wort.'
  },

  /* حَرْفٌ — Buchstabe (madina-1, Kapitel 20)
     ⭐ Eine إِضَافَة mit zwei Wörtern aus demselben Kapitel: حَرْفُ ohne
     Tanwin, الْكَلِمَةِ im Genitiv. */
  '45954': {
    sentAr: 'حَرْفُ الْكَلِمَةِ جَدِيدٌ.',
    sentDe: 'Der Buchstabe des Wortes ist neu.'
  },

  /* دَرْسٌ — Unterricht (madina-1, Kapitel 20) */
  '45955': {
    sentAr: 'الدَّرْسُ فِي الْمَدْرَسَةِ.',
    sentDe: 'Der Unterricht ist in der Schule.'
  },

  /* وَاسِعٌ — geräumig (madina-1, Kapitel 21) */
  '45956': {
    sentAr: 'الْبَيْتُ الْوَاسِعُ جَمِيلٌ.',
    sentDe: 'Das geräumige Haus ist schön.'
  },

  /* آسِيَا — Asien (madina-1, Kapitel 21)
     Wie أُورُوبَّا: Ländername, also weiblich und ohne Tanwin. */
  '45957': {
    sentAr: 'آسِيَا كَبِيرَةٌ.',
    sentDe: 'Asien ist groß.'
  },

  /* ------------------------------------------------------------------------
     KAPITEL 22-23 — VORGESCHRIEBEN (20.08.2026)

     ⭐ Kapitel 22 ist die Farbenlektion, und die Farben sind alle
     مَمْنُوع مِنَ الصَّرْف: sie tragen KEIN Tanwin, obwohl sie unbestimmt
     sind — أَحْمَرُ und nicht أَحْمَرٌ. Das ist der ganze Grund, warum sie ein
     eigenes Kapitel bekommen, und jeder Satz hier zeigt es.

     ⚠️ Zwei Wörter bekommen bewusst KEINEN Satz mit Ortsangabe: جُدَّةُ und
     الطَّائِفُ liegen beide in der السُّعُودِيَّة, und die steht nicht in seinem
     Bestand. Stattdessen مَدِينَةٌ aus Kapitel 9.

     ⛔ وَاشِنْطُنُ fängt mit و an — dasselbe Problem wie bei وَاسِعٌ eine
     Lektion vorher. Das Wort steht deshalb NICHT am Satzanfang.
     ------------------------------------------------------------------------ */

  /* أَحْمَرُ — rot (madina-1, Kapitel 22)
     ⭐ Kein Tanwin, obwohl das Wort unbestimmt ist: أَحْمَرُ ist
     مَمْنُوع مِنَ الصَّرْف. Genau daran erkennt man die Farbform. */
  '45958': {
    sentAr: 'الْكِتَابُ أَحْمَرُ.',
    sentDe: 'Das Buch ist rot.'
  },

  /* أَزْرَقُ — blau (madina-1, Kapitel 22) */
  '45959': {
    sentAr: 'الْبَابُ أَزْرَقُ.',
    sentDe: 'Die Tür ist blau.'
  },

  /* أَخْضَرُ — grün (madina-1, Kapitel 22) */
  '45960': {
    sentAr: 'الْقَلَمُ أَخْضَرُ.',
    sentDe: 'Der Stift ist grün.'
  },

  /* أَسْوَدُ — schwarz (madina-1, Kapitel 22) */
  '45961': {
    sentAr: 'الْكُرْسِيُّ أَسْوَدُ.',
    sentDe: 'Der Stuhl ist schwarz.'
  },

  /* أَصْفَرُ — gelb (madina-1, Kapitel 22) */
  '45962': {
    sentAr: 'الْمِفْتَاحُ أَصْفَرُ.',
    sentDe: 'Der Schlüssel ist gelb.'
  },

  /* أَبْيَضُ — weiß (madina-1, Kapitel 22) */
  '45963': {
    sentAr: 'الْمَسْجِدُ أَبْيَضُ.',
    sentDe: 'Die Moschee ist weiß.'
  },

  /* بَغْدَادُ — Bagdad (madina-1, Kapitel 22)
     Auch Städtenamen sind مَمْنُوع مِنَ الصَّرْف — بَغْدَادُ ohne Tanwin.
     Und weiblich, deshalb كَبِيرَةٌ. */
  '45964': {
    sentAr: 'بَغْدَادُ مَدِينَةٌ كَبِيرَةٌ.',
    sentDe: 'Bagdad ist eine große Stadt.'
  },

  /* جُدَّةُ — Jeddah (madina-1, Kapitel 22) */
  '45965': {
    sentAr: 'جُدَّةُ مَدِينَةٌ جَمِيلَةٌ.',
    sentDe: 'Jeddah ist eine schöne Stadt.'
  },

  /* فِنْجَانٌ — Teetasse (madina-1, Kapitel 22) */
  '45966': {
    sentAr: 'الْفِنْجَانُ عَلَى الْمَكْتَبِ.',
    sentDe: 'Die Teetasse steht auf dem Schreibtisch.'
  },

  /* دَقِيقَةٌ — Minute (madina-1, Kapitel 22) */
  '45967': {
    sentAr: 'هَذِهِ دَقِيقَةٌ طَوِيلَةٌ.',
    sentDe: 'Das ist eine lange Minute.'
  },

  /* قَالَ — sagen (madina-1, Kapitel 22)
     ⭐ Das einzige VERB der beiden Lektionen, deshalb ein Verbalsatz: قَالَ
     zuerst, dann der فَاعِل im Nominativ. Genau die Reihenfolge, die den
     Verbalsatz vom Nominalsatz unterscheidet. */
  '45968': {
    sentAr: 'قَالَ الْمُدَرِّسُ.',
    sentDe: 'Der Lehrer sagte.'
  },

  /* إِسْطَنْبُولُ — Istanbul (madina-1, Kapitel 23) */
  '45969': {
    sentAr: 'إِسْطَنْبُولُ مَدِينَةٌ كَبِيرَةٌ.',
    sentDe: 'Istanbul ist eine große Stadt.'
  },

  /* وَاشِنْطُنُ — Washington (madina-1, Kapitel 23)
     ⛔ Das Wort steht bewusst AM SATZANFANG: es fängt mit و an, und der
     Iʿrāb-Erklärer liest ein و als Konjunktion, sobald schon eine Rolle vergeben
     ist. Als erstes Wort greift dieser Zweig nicht.
     ⚠️ Am Satzende gemessen: „Anschluss mit و, Kasus nicht eindeutig“ — dieselbe
     Falle wie bei وَاسِعٌ in Kapitel 21, nur anders zu lösen. */
  '45970': {
    sentAr: 'وَاشِنْطُنُ مَدِينَةٌ كَبِيرَةٌ.',
    sentDe: 'Washington ist eine große Stadt.'
  },

  /* الطَّائِفُ — Taif (madina-1, Kapitel 23)
     ⚠️ Der einzige Städtename der Lektion MIT Artikel — und deshalb trägt er
     die normale Ḍamma, nicht die eines مَمْنُوع. */
  '45971': {
    sentAr: 'الطَّائِفُ مَدِينَةٌ جَمِيلَةٌ.',
    sentDe: 'Taif ist eine schöne Stadt.'
  },

  /* ------------------------------------------------------------------------
     KAPITEL 24, GRUPPE 1 — DIE HINWEIS- UND FRAGEWÖRTER (20.08.2026)

     Elf Wörter, die sein Lehrer ständig benutzt und zu denen es eigene Regeln
     gibt (ismul-isara-hadha/hadhihi/dhalika/tilka, isara-genus-kongruenz).
     Kapitel 24 hat 54 Wörter ohne Beispielsatz; das hier ist die erste
     Gruppe — die übrigen folgen.

     ⭐ Die vier Sätze zu هَذَا / هَذِهِ / ذَلِكَ / تِلْكَ sind bewusst
     PARALLEL gebaut: gleiche Bauform, nur nah gegen fern und männlich gegen
     weiblich. So sieht man den einen Unterschied, um den es geht.
     ------------------------------------------------------------------------ */

  /* هَذَا — dieser, m. (madina-1, Kapitel 24)
     Das Urbeispiel des Nominalsatzes, mit dem Madina 1 auf Seite 1 anfängt. */
  '50160': {
    sentAr: 'هَذَا كِتَابٌ جَدِيدٌ.',
    sentDe: 'Das ist ein neues Buch.'
  },

  /* هَذِهِ — diese, f. (madina-1, Kapitel 24)
     Dieselbe Bauform wie eine Zeile darüber, nur weiblich — an drei Stellen:
     هَذِهِ, die Tāʾ marbūṭa und das Adjektiv. */
  '50161': {
    sentAr: 'هَذِهِ مَدْرَسَةٌ جَدِيدَةٌ.',
    sentDe: 'Das ist eine neue Schule.'
  },

  /* ذَلِكَ — jener, m. (madina-1, Kapitel 24)
     Das Gegenstück zu هَذَا: nicht nah, sondern fern — deshalb بَعِيدٌ. */
  '50162': {
    sentAr: 'ذَلِكَ بَيْتٌ بَعِيدٌ.',
    sentDe: 'Jenes ist ein weit entferntes Haus.'
  },

  /* تِلْكَ — jene, f. (madina-1, Kapitel 24) */
  '50163': {
    sentAr: 'تِلْكَ مَدِينَةٌ بَعِيدَةٌ.',
    sentDe: 'Jene ist eine weit entfernte Stadt.'
  },

  /* هَؤُلَاءِ — diese, Pl. (madina-1, Kapitel 24)
     ⚠️ Der Plural gilt für Männer UND Frauen — anders als im Singular gibt
     es hier keine zweite Form nach Geschlecht. */
  '50164': {
    sentAr: 'هَؤُلَاءِ أَوْلَادٌ.',
    sentDe: 'Das sind Jungen.'
  },

  /* أُولَئِكَ — jene, Pl. (madina-1, Kapitel 24) */
  '50165': {
    sentAr: 'أُولَئِكَ رِجَالٌ.',
    sentDe: 'Jene sind Männer.'
  },

  /* مَنْ — wer (madina-1, Kapitel 24)
     ⚠️ Nicht mit مَا verwechseln: مَنْ fragt nach Personen, مَا nach Sachen.
     Beide sehen ohne Ḥarākāt fast gleich aus. */
  '50168': {
    sentAr: 'مَنْ هَذَا الرَّجُلُ؟',
    sentDe: 'Wer ist dieser Mann?'
  },

  /* أَيٌّ — welcher (madina-1, Kapitel 24)
     ⭐ أَيُّ steht als مُضَاف ohne Tanwin, das Gefragte folgt im Genitiv. */
  '50170': {
    sentAr: 'أَيُّ كِتَابٍ هَذَا؟',
    sentDe: 'Welches Buch ist das?'
  },

  /* مَعَ — mit (madina-1, Kapitel 24)
     مَعَ ist eine Ortsangabe wie تَحْتَ und zieht den Genitiv nach sich. */
  '50171': {
    sentAr: 'الْوَلَدُ مَعَ الْمُدَرِّسِ.',
    sentDe: 'Der Junge ist beim Lehrer.'
  },

  /* مُسْلِمٌ — Muslim (madina-1, Kapitel 24) */
  '50312': {
    sentAr: 'هَذَا الرَّجُلُ مُسْلِمٌ.',
    sentDe: 'Dieser Mann ist Muslim.'
  },

  /* جِدًّا — sehr (madina-1, Kapitel 24)
     ⚠️ Steht immer HINTER dem Adjektiv, nie davor — anders als im Deutschen. */
  '50289': {
    sentAr: 'الْبَيْتُ كَبِيرٌ جِدًّا.',
    sentDe: 'Das Haus ist sehr groß.'
  },

  /* ------------------------------------------------------------------------
     KAPITEL 24, GRUPPE 2 — DIE ALLTAGSWÖRTER (20.08.2026)

     Zwölf Wörter, die man tatsächlich braucht, im Gegensatz zum
     Universitätsvokabular derselben Lektion (تَعَارُفٌ, عِمَادَةٌ,
     اِسْتِمَارَةٌ …), das noch offen ist.

     ⚠️ مَتى war der schwierigste: die naheliegenden Antworten („wann ist
     der Unterricht / das Gebet / die Prüfung“) brauchen alle ein Wort, das er
     nicht hat. Der Satz fragt deshalb nach einer Person und einem Ort — beides
     aus Kapitel 1 und 5.
     ------------------------------------------------------------------------ */

  /* مَتَى — wann (madina-1, Kapitel 24) */
  '50169': {
    sentAr: 'مَتَى الْمُدَرِّسُ هُنَا؟',
    sentDe: 'Wann ist der Lehrer hier?'
  },

  /* لَكِنَّ — aber (madina-1, Kapitel 24)
     ⚠️ لَكِنَّ verlangt einen Akkusativ hinter sich — hier steckt der im
     angehängten ـهُ, das er als Fachbegriff kennt. */
  '50201': {
    sentAr: 'الْبَيْتُ صَغِيرٌ لَكِنَّهُ جَمِيلٌ.',
    sentDe: 'Das Haus ist klein, aber es ist schön.'
  },

  /* كَأَنَّ — als ob (madina-1, Kapitel 24)
     Dieselbe Bauform wie لَكِنَّ: ein angehängtes Pronomen übernimmt den
     Akkusativ, den die Partikel verlangt. */
  '50287': {
    sentAr: 'كَأَنَّهُ مُدَرِّسٌ.',
    sentDe: 'Es ist, als wäre er ein Lehrer.'
  },

  /* بَعْضٌ — einige (madina-1, Kapitel 24)
     ⭐ Wie كُلُّ eine إِضَافَة: بَعْضُ ohne Tanwin, das Gezählte im
     Genitiv dahinter. */
  '50285': {
    sentAr: 'بَعْضُ الطُّلَّابِ فِي الْمَدْرَسَةِ.',
    sentDe: 'Einige der Studenten sind in der Schule.'
  },

  /* شُكْرًا — danke (madina-1, Kapitel 24)
     ⚠️ Das Tanwin mit Fatḥa ist kein Zufall: شُكْرًا steht im Akkusativ, weil
     ein gedachtes Verb davorsteht („ich danke dir Dank“). */
  '50290': {
    sentAr: 'شُكْرًا يَا مُدَرِّسُ.',
    sentDe: 'Danke, Lehrer!'
  },

  /* مَتْجَرٌ — Laden (madina-1, Kapitel 24) */
  '50338': {
    sentAr: 'الْمَتْجَرُ قَرِيبٌ مِنَ الْبَيْتِ.',
    sentDe: 'Der Laden ist nahe beim Haus.'
  },

  /* غَضْبَانُ — wütend (madina-1, Kapitel 24)
     ⭐ Kein Tanwin: das Muster فَعْلَانُ ist مَمْنُوع مِنَ الصَّرْف, genau
     wie die Farben aus Kapitel 22. */
  '50357': {
    sentAr: 'الْوَلَدُ غَضْبَانُ.',
    sentDe: 'Der Junge ist wütend.'
  },

  /* عَاقِلٌ — vernünftig (madina-1, Kapitel 24) */
  '50358': {
    sentAr: 'الطَّالِبُ عَاقِلٌ.',
    sentDe: 'Der Student ist vernünftig.'
  },

  /* حَاجٌّ — Pilger (madina-1, Kapitel 24) */
  '50387': {
    sentAr: 'الْحَاجُّ فِي الْمَسْجِدِ.',
    sentDe: 'Der Pilger ist in der Moschee.'
  },

  /* فَرَنْسَا — Frankreich (madina-1, Kapitel 24)
     Ländernamen sind weiblich — deshalb بَعِيدَةٌ. */
  '50480': {
    sentAr: 'فَرَنْسَا بَعِيدَةٌ.',
    sentDe: 'Frankreich ist weit weg.'
  },

  /* يَابَانِيٌّ — Japaner (madina-1, Kapitel 24)
     Die Nisba-Endung ـِيّ macht aus einem Land eine Herkunft. */
  '50498': {
    sentAr: 'هَذَا الطَّالِبُ يَابَانِيٌّ.',
    sentDe: 'Dieser Student ist Japaner.'
  },

  /* اِبْتِدَائِيٌّ — Grund-, Anfangs- (madina-1, Kapitel 24)
     Ebenfalls eine Nisba, hier weiblich als نَعْت zu الْمَدْرَسَةُ — beide
     bestimmt, beide Nominativ, beide weiblich. */
  '50503': {
    sentAr: 'الْمَدْرَسَةُ الْاِبْتِدَائِيَّةُ قَرِيبَةٌ.',
    sentDe: 'Die Grundschule ist nah.'
  },

  /* ------------------------------------------------------------------------
     KAPITEL 24, GRUPPE 3 (20.08.2026)

     Vierzehn Wörter: die vier Grammatikbegriffe, die es auch als Fachbegriff
     gibt (مَرْفُوعٌ, مَجْرُورٌ, مُضَافٌ, إِضَافَةٌ), und zehn
     alltagsnahe.

     ⛔ BEWUSST NICHT DABEI: das Verwaltungsvokabular derselben Lektion —
     تَعَارُفٌ, حِوَارٌ, مُرْشِدٌ, عِمَادَةٌ, اِسْتِمَارَةٌ, إِسْكَانٌ,
     شُعْبَةٌ, مُسْتَوًى, سَابِقَةٌ, اِمْتِثَالٌ, خَاصِرَةٌ, تَأْخِيرٌ, فَذٌّ,
     جَزِيلٌ und die drei Verben. Sie stammen aus einem Dialog an der
     Universität; ein Satz darüber bräuchte Wörter, die er nicht hat, und
     einzeln freischalten wird er sie kaum. Steht als offener Punkt in der
     To-Do.
     ------------------------------------------------------------------------ */

  /* مَرْفُوعٌ — im Nominativ (madina-1, Kapitel 24)
     ⚠️ Es gibt das Wort auch als Fachbegriff (gram-marfu). Der Satz hier
     ist die Buchvokabel; beide zeigen dasselbe von zwei Seiten. */
  '50470': {
    sentAr: 'الْمُبْتَدَأُ مَرْفُوعٌ.',
    sentDe: 'Das Mubtadaʾ steht im Nominativ.'
  },

  /* مَجْرُورٌ — im Genitiv (madina-1, Kapitel 24) */
  '50472': {
    sentAr: 'الْاِسْمُ بَعْدَ فِي مَجْرُورٌ.',
    sentDe: 'Das Nomen nach „fī“ steht im Genitiv.'
  },

  /* مُضَافٌ — Besitzobjekt (madina-1, Kapitel 24)
     Der Satz ZEIGT, was er sagt: بَيْتُ steht selbst ohne Tanwin da. */
  '50473': {
    sentAr: 'بَيْتُ الْمُدَرِّسِ كَبِيرٌ.',
    sentDe: 'Das Haus des Lehrers ist groß.'
  },

  /* إِضَافَةٌ — Genitivverbindung (madina-1, Kapitel 24) */
  '50474': {
    sentAr: 'مِفْتَاحُ الْبَابِ صَغِيرٌ.',
    sentDe: 'Der Schlüssel der Tür ist klein.'
  },

  /* فَطُورٌ — Frühstück (madina-1, Kapitel 24) */
  '50183': {
    sentAr: 'الْفَطُورُ فِي الْبَيْتِ.',
    sentDe: 'Das Frühstück ist im Haus.'
  },

  /* هِوَايَةٌ — Hobby (madina-1, Kapitel 24) */
  '50189': {
    sentAr: 'هَذِهِ هِوَايَةٌ جَدِيدَةٌ.',
    sentDe: 'Das ist ein neues Hobby.'
  },

  /* مُبَكِّرٌ — früh (madina-1, Kapitel 24) */
  '50182': {
    sentAr: 'الْفَطُورُ مُبَكِّرٌ.',
    sentDe: 'Das Frühstück ist früh.'
  },

  /* طَاهِرٌ — rein (madina-1, Kapitel 24)
     ⚠️ Das Wort gehört zur Gebetsreinheit — der Satz bleibt bewusst
     beim Ort, weil طَهَارَة und وُضُوء nicht in seinem Bestand stehen. */
  '50185': {
    sentAr: 'الْمَسْجِدُ طَاهِرٌ.',
    sentDe: 'Die Moschee ist rein.'
  },

  /* جَنُوبٌ — Süden (madina-1, Kapitel 24) */
  '50181': {
    sentAr: 'الْمَدِينَةُ فِي الْجَنُوبِ.',
    sentDe: 'Die Stadt liegt im Süden.'
  },

  /* فَرْعٌ — Zweig, Filiale (madina-1, Kapitel 24) */
  '50190': {
    sentAr: 'فَرْعُ الْمَدْرَسَةِ قَرِيبٌ.',
    sentDe: 'Die Zweigstelle der Schule ist nah.'
  },

  /* قَارُورَةٌ — Fläschchen (madina-1, Kapitel 24) */
  '50194': {
    sentAr: 'الْقَارُورَةُ عَلَى الْمَكْتَبِ.',
    sentDe: 'Das Fläschchen steht auf dem Schreibtisch.'
  },

  /* سَائِلٌ — Flüssigkeit (madina-1, Kapitel 24) */
  '50195': {
    sentAr: 'الْمَاءُ سَائِلٌ.',
    sentDe: 'Wasser ist eine Flüssigkeit.'
  },

  /* لُقْمَةٌ — Bissen (madina-1, Kapitel 24) */
  '50191': {
    sentAr: 'هَذِهِ لُقْمَةٌ صَغِيرَةٌ.',
    sentDe: 'Das ist ein kleiner Bissen.'
  },

  /* أُضْحِيَةٌ — Opfertier (madina-1, Kapitel 24)
     ⭐ Ein Wort aus seinem Glauben: das Tier, das zum عِيد الأَضْحَى
     geschlachtet wird. Beide Wörter tragen dieselbe Wurzel ض ح ي. */
  '50193': {
    sentAr: 'هَذِهِ أُضْحِيَةٌ كَبِيرَةٌ.',
    sentDe: 'Das ist ein großes Opfertier.'
  },

  /* ------------------------------------------------------------------------
     KAPITEL 24, GRUPPE 4 — DAS UNIVERSITÄTSVOKABULAR (20.08.2026)

     Die Wörter aus dem Dialog an der Universität. Sie sind der Rest, den ich
     in Gruppe 3 bewusst liegengelassen hatte — hier sind die, die sich mit
     جَامِعَةٌ (Kap. 4), غُرْفَةٌ (Kap. 4) und den Adjektiven aus Kapitel 3
     natürlich bauen lassen.

     ⛔ DREI WÖRTER BEKOMMEN WEITERHIN KEINEN SATZ, und das ist Absicht:
       خَاصِرَةٌ (Taille)      — Körperteil ohne Zusammenhang in seinem Bestand
       اِمْتِثَالٌ (Befolgung) — abstrakt, jeder Satz wäre gestellt
       سَابِقَةٌ (Präzedenzfall) — dito
     Dazu die drei Verben دَأَبَ, اِسْتَذْكَرَ, فَضَلَ: ein Verbalsatz
     braucht ein Objekt, und die passenden Objekte stehen nicht in seinem
     Bestand. Ein gestellter Satz ist schlechter als keiner.
     ------------------------------------------------------------------------ */

  /* جَزِيلٌ — reichlich (madina-1, Kapitel 24)
     ⭐ Die feste Wendung, in der das Wort fast immer steht: شُكْرًا جَزِيلًا.
     Beide Wörter im Akkusativ, weil ein gedachtes Verb davorsteht — und
     جَزِيلًا folgt شُكْرًا als نَعْت in Kasus und Unbestimmtheit. */
  '50178': {
    sentAr: 'شُكْرًا جَزِيلًا.',
    sentDe: 'Vielen Dank!'
  },

  /* مُرْشِدٌ — Studienberater (madina-1, Kapitel 24) */
  '50174': {
    sentAr: 'الْمُرْشِدُ فِي الْجَامِعَةِ.',
    sentDe: 'Der Studienberater ist an der Universität.'
  },

  /* عِمَادَةٌ — Dekanat (madina-1, Kapitel 24) */
  '50175': {
    sentAr: 'عِمَادَةُ الْجَامِعَةِ قَرِيبَةٌ.',
    sentDe: 'Das Dekanat der Universität ist nah.'
  },

  /* اِسْتِمَارَةٌ — Formular (madina-1, Kapitel 24) */
  '50176': {
    sentAr: 'هَذِهِ اِسْتِمَارَةٌ جَدِيدَةٌ.',
    sentDe: 'Das ist ein neues Formular.'
  },

  /* إِسْكَانٌ — Unterbringung (madina-1, Kapitel 24) */
  '50177': {
    sentAr: 'الْإِسْكَانُ قَرِيبٌ مِنَ الْجَامِعَةِ.',
    sentDe: 'Die Unterbringung ist nahe bei der Universität.'
  },

  /* شُعْبَةٌ — Abteilung (madina-1, Kapitel 24) */
  '50179': {
    sentAr: 'شُعْبَةُ الْجَامِعَةِ كَبِيرَةٌ.',
    sentDe: 'Die Abteilung der Universität ist groß.'
  },

  /* مُسْتَوًى — Niveau (madina-1, Kapitel 24)
     ⭐ Wie فَتًى: mit dem Artikel verschwindet das Tanwin und aus مُسْتَوًى
     wird الْمُسْتَوَى — die أَلِف مَقْصورة bleibt, das ـً faellt weg. */
  '50180': {
    sentAr: 'الْمُسْتَوَى جَدِيدٌ.',
    sentDe: 'Das Niveau ist neu.'
  },

  /* تَعَارُفٌ — gegenseitiges Kennenlernen (madina-1, Kapitel 24) */
  '50172': {
    sentAr: 'هَذَا تَعَارُفٌ جَدِيدٌ.',
    sentDe: 'Das ist ein neues Kennenlernen.'
  },

  /* حِوَارٌ — Dialog (madina-1, Kapitel 24) */
  '50173': {
    sentAr: 'هَذَا حِوَارٌ قَصِيرٌ.',
    sentDe: 'Das ist ein kurzer Dialog.'
  },

  /* فَذٌّ — einzigartig (madina-1, Kapitel 24) */
  '50186': {
    sentAr: 'هَذَا الطَّالِبُ فَذٌّ.',
    sentDe: 'Dieser Student ist einzigartig.'
  },

  /* تَأْخِيرٌ — Verspätung (madina-1, Kapitel 24) */
  '50188': {
    sentAr: 'التَّأْخِيرُ طَوِيلٌ.',
    sentDe: 'Die Verspätung ist lang.'
  },

  /* ---------- Die letzten sechs aus Kapitel 24 (21.08.2026) ------------

     Damit ist madina-1 vollstaendig: 298 Woerter, jedes mit Eselsbruecke
     und Satz. Gemessen vorher: 76 Woerter in K24, davon 70 mit Satz.

     ⛔ Diese sechs sind KEIN Anfaengerwortschatz — Kapitel 24 ist der
     Anhang des Buches. Die Saetze halten den uebrigen Wortschatz deshalb
     bewusst einfach (K1-K9), damit nur das NEUE Wort neu ist.
     [[was_geuebt_werden_soll]] */

  /* دَأَبَ — beharrlich sein / unermuedlich tun (madina-1, Kapitel 24)
     Verbalsatz in der Grundfolge: Verb, dann الطَّالِبُ als فَاعِل im Nominativ,
     dann die Praepositionalphrase. دَأَبَ verlangt عَلَى fuer das, worin man
     beharrt — nicht فِي und nicht den blossen Akkusativ. */
  '50466': {
    sentAr: 'دَأَبَ الطَّالِبُ عَلَى الْعَمَلِ.',
    sentDe: 'Der Student arbeitete unermüdlich.'
  },

  /* سَابِقَةٌ — Praezedenzfall / Vorgeschichte (madina-1, Kapitel 24)
     ⭐ Der Satz uebt die Uebereinstimmung des نَعْت: جَدِيدَةٌ folgt سَابِقَةٌ in
     Geschlecht (feminin), Kasus (Nominativ) und Bestimmtheit (beide ohne
     اَلْ). Dazu هَذِهِ als feminines مُبْتَدَأ — nicht هَذَا. */
  '50184': {
    sentAr: 'هَذِهِ سَابِقَةٌ جَدِيدَةٌ فِي الْمَدْرَسَةِ.',
    sentDe: 'Das ist ein neuer Präzedenzfall in der Schule.'
  },

  /* خَاصِرَةٌ — Taille / Flanke (madina-1, Kapitel 24)
     ⭐ Zwei إِضَافَة in einem Satz: يَدُ الطَّبِيبِ traegt kein Tanwin, weil ein
     zweites Nomen folgt, und خَاصِرَةِ الْمَرِيضِ steht komplett im Genitiv,
     weil عَلَى davor steht. Genau die Regel mudaf-ohne-al-01. */
  '50187': {
    sentAr: 'يَدُ الطَّبِيبِ عَلَى خَاصِرَةِ الْمَرِيضِ.',
    sentDe: 'Die Hand des Arztes liegt auf der Flanke des Kranken.'
  },

  /* اِمْتِثَالٌ — Befolgung / Gehorsam (madina-1, Kapitel 24)
     ⚠️ Die Schreibung ist die Schwierigkeit, nicht die Bedeutung: اِمْتِثَالٌ
     beginnt mit einer هَمْزَة وَصْل. Tritt اَلْ davor, faellt sie weg und das لـ
     bekommt das Kasra — الِامْتِثَالُ, nicht الْاِمْتِثَالُ.
     Sonst: مَصْدَر als مُبْتَدَأ, أَمْرِ اللَّهِ als إِضَافَة hinter لِـ. */
  '50192': {
    sentAr: 'الِامْتِثَالُ لِأَمْرِ اللَّهِ وَاجِبٌ.',
    sentDe: 'Die Befolgung des Befehls Allahs ist Pflicht.'
  },

  /* اِسْتَذْكَرَ — lernen / auswendig lernen (madina-1, Kapitel 24)
     Verb der zehnten Form. Am Satzanfang traegt seine هَمْزَة وَصْل ein Kasra
     (اِسْتَذْكَرَ); دُرُوسَهُ ist مَفْعُول بِهِ im Akkusativ, gebrochener Plural mit
     angehaengtem Pronomen. ⭐ Und قَبْلَ الِامْتِحَانِ zeigt dieselbe هَمْزَة وَصْل
     wie der Satz darueber — zweimal dasselbe Muster, einmal am Wortanfang,
     einmal hinter dem Artikel. */
  '50196': {
    sentAr: 'اِسْتَذْكَرَ الطَّالِبُ دُرُوسَهُ قَبْلَ الِامْتِحَانِ.',
    sentDe: 'Der Student wiederholte seine Lektionen vor der Prüfung.'
  },

  /* فَضَلَ — vorzueglich / ueberlegen sein (madina-1, Kapitel 24)
     ⭐ Der klarste Kasus-Satz der sechs: beide Nomen tragen اَلْ, nur die
     Endung trennt die Rollen — الْعِلْمُ ist فَاعِل (Nominativ), الْمَالَ ist
     مَفْعُول بِهِ (Akkusativ). Ohne die Harakat waere der Satz zweideutig.
     ⚠️ Der Abzug uebersetzt فَضَلَ als „vorzueglich / ueberlegen sein";
     gebraucht wird es transitiv (فَضَلَهُ = er uebertraf ihn), und genau das
     zeigt der Satz. Die intransitive Lesart gehoert zu فَضُلَ. */
  '50197': {
    sentAr: 'فَضَلَ الْعِلْمُ الْمَالَ.',
    sentDe: 'Das Wissen übertrifft das Vermögen.'
  },

  /* ---------- Elias' selbst angelegte Woerter (Weg 3, vt_personalVocab) -----

     ⛔ Diese vierzehn standen bis zum 20.08.2026 ohne Satz da, und ein Satz
     haette sie auch nicht erreicht: js/buecher.js rief saetzeNachtragen()
     nur mit der Buchliste auf, nie mit PERSONAL_VOCAB. Der Aufruf ist
     nachgetragen — ohne ihn waere jeder Satz hier tote Schrift.
     [[entscheidung_gilt_fuer_das_zweite_werkzeug]]

     Nur Woerter aus madina-1 Kapitel 1-12 oder aus dem Lernbestand.
     Vollstaendig vokalisiert, jede Kasusendung gesetzt. */

  /* مَكْسُورٌ — kaputt (selbst angelegt am 20.08.2026, Weg 3)
     Mubtadaʾ + Ḫabar, beide marfūʿ. بَابٌ aus K1. */
  'p_1787183484954': {
    sentAr: 'الْبَابُ مَكْسُورٌ.',
    sentDe: 'Die Tür ist kaputt.'
  },

  /* سَيِّدٌ — Herr (selbst angelegt am 20.08.2026, Weg 3)
     Ḫabar ist ein Ǧārr wa maǧrūr. فِي und بَيْتٌ aus K1/K7. */
  'p_1787185012359': {
    sentAr: 'السَّيِّدُ فِي الْبَيْتِ.',
    sentDe: 'Der Herr ist im Haus.'
  },

  /* سَيِّدَةٌ — Dame (selbst angelegt am 20.08.2026, Weg 3)
     Beide marfūʿ, das Ḫabar unbestimmt. مُدَرِّسَةٌ steht im Lernbestand. */
  'p_1787185031977': {
    sentAr: 'السَّيِّدَةُ مُدَرِّسَةٌ.',
    sentDe: 'Die Dame ist Lehrerin.'
  },

  /* خَرَجَ — herausgehen (selbst angelegt am 20.08.2026, Weg 3)
     Verb + Fāʿil (marfūʿ) + Ǧārr wa maǧrūr. مِنْ wird vor Hamzat al-waṣl zu مِنَ. */
  'p_1787189845886': {
    sentAr: 'خَرَجَ الْوَلَدُ مِنَ الْبَيْتِ.',
    sentDe: 'Der Junge ging aus dem Haus.'
  },

  /* كَسْلَانُ — faul (selbst angelegt am 20.08.2026, Weg 3)
     كَسْلَانُ folgt dem Muster فَعْلَان (Fem. فَعْلَى) und ist damit mamnūʿ min aṣ-ṣarf — deshalb Ḍamma OHNE Tanwīn, obwohl das Ḫabar unbestimmt ist. */
  'p_1787191371934': {
    sentAr: 'الطَّالِبُ كَسْلَانُ.',
    sentDe: 'Der Student ist faul.'
  },

  /* لَكَ — für dich (m.) (selbst angelegt am 20.08.2026, Weg 3)
     لِ + كَ; das Ḫabar ist der Ǧārr wa maǧrūr. Vor dem Personalpronomen wird لِ zu لَ. */
  'p_1787185309933': {
    sentAr: 'الْكِتَابُ لَكَ.',
    sentDe: 'Das Buch ist für dich.'
  },

  /* لَكِ — für dich (f.) (selbst angelegt am 20.08.2026, Weg 3)
     Dieselbe Bauart wie لَكَ, nur die weibliche Anrede. حَقِيبَةٌ aus K8. */
  'p_1787185328882': {
    sentAr: 'الْحَقِيبَةُ لَكِ.',
    sentDe: 'Die Tasche ist für dich.'
  },

  /* فِيْهِ — darin (selbst angelegt am 20.08.2026, Weg 3)
     فِي + هِ. Der zweite Satzteil stellt den Ǧārr wa maǧrūr voran, das Mubtadaʾ غُرْفَةٌ folgt. */
  'p_1787189488747': {
    sentAr: 'الْبَيْتُ كَبِيرٌ، وَفِيهِ غُرْفَةٌ.',
    sentDe: 'Das Haus ist groß, und darin ist ein Zimmer.'
  },

  /* كَيْفَ — wie (selbst angelegt am 20.08.2026, Weg 3)
     Fragewort + Mubtadaʾ mit angehängtem Pronomen. ⚠️ Seine Zitierform حَالُكْ traegt die Pausalendung; im Satz steht حَالُكَ. */
  'p_1787189022107': {
    sentAr: 'كَيْفَ حَالُكَ؟',
    sentDe: 'Wie geht es dir?'
  },

  /* حَالُكْ — dein Zustand (selbst angelegt am 20.08.2026, Weg 3)
     Derselbe Satz wie bei كَيْفَ — die beiden Woerter kommen nur zusammen vor. */
  'p_1787189076593': {
    sentAr: 'كَيْفَ حَالُكَ؟',
    sentDe: 'Wie geht es dir?'
  },

  /* بَعْدَ — nach (selbst angelegt am 20.08.2026, Weg 3)
     بَعْدَ ist ein Ẓarf und Muḍāf: das folgende Wort steht im Genitiv (الْمَسْجِدِ). */
  'p_1787188396011': {
    sentAr: 'الْمَكْتَبَةُ بَعْدَ الْمَسْجِدِ.',
    sentDe: 'Die Bibliothek ist nach der Moschee.'
  },

  /* عِنْدَ — bei (selbst angelegt am 20.08.2026, Weg 3)
     Ẓarf + Muḍāf ilayh im Genitiv. */
  'p_1787190874749': {
    sentAr: 'الْكِتَابُ عِنْدَ الْمُدَرِّسِ.',
    sentDe: 'Das Buch ist beim Lehrer.'
  },

  /* أَمَامَ — vor (selbst angelegt am 20.08.2026, Weg 3)
     Ẓarf makān + Muḍāf ilayh im Genitiv. سَيَّارَةٌ aus K9. */
  'p_1787189287368': {
    sentAr: 'السَّيَّارَةُ أَمَامَ الْبَيْتِ.',
    sentDe: 'Das Auto ist vor dem Haus.'
  },

  /* لِمَن — für wen (selbst angelegt am 20.08.2026, Weg 3)
     ⚠️ لِمَنْ endet auf Sukūn; trifft es auf die Hamzat al-waṣl von الْ, bekommt es ein Kasra: لِمَنِ. */
  'p_1787184718572': {
    sentAr: 'لِمَنِ الْكِتَابُ؟',
    sentDe: 'Wem gehört das Buch?'
  },
};
