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
  }

};
