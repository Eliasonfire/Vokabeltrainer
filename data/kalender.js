/* ---------------------------------------------------------------------------
   Die Wochentage und die zwölf islamischen Monate — als eigene Karten.

   Elias am 23.10.2026: „ich will auch die 7 wochentagen und alle monate als eigene
   vokabel". Auf die Rückfrage, welche Monate: „Islamische Monate". Dann: „die
   islamischen monat bitte auch dazu schreiben welcher im jahr dieser monat ist damit
   ich weiß weil ich weiß nicht wann welcher monat ist".
   Deshalb trägt jeder Monat seinen Platz im Jahr im Deutsch: „Ramadan (9. Monat)".

   ⭐ WAS ES SCHON GAB, BEKOMMT KEINE ZWEITE KARTE (A13)
   arabicroots führt von den 19 Wörtern genau zwei (Suche 23.10.2026):
     · Dienstag  47254  yawm ath-thulāthāʾ  (Madina 3, Kapitel 12) — einzeln freigeschaltet über
       FREISCHALTEN_AUF_WUNSCH in js/kern.js
     · Rajab     45926  Rajab  (Madina 1, Kapitel 14, bei ihm schon frei) — bekommt nur das
       Deutsch „Rajab (7. Monat)" über KALENDER_BUCHKARTEN unten
   Die übrigen 17 stehen hier. In seinem Stand (KV 23.10.2026, 21:29) war keines davon als
   eigenes Wort, ausgeblendet oder einzeln freigeschaltet.

   ⛔ HERKUNFT DES ARABISCHEN — nichts davon ist getippt
   Rangfolge: arabicroots → seine Bücher → sonstige Belege → arabdict. arabicroots hat die 17
   nicht; seine Buch-PDFs (Madina 1, Bayna Yadayk 1A) sind Bilder ohne Textebene. Jede Form
   unten kommt deshalb aus der Beugungstabelle des englischen Wiktionary
   (data-ersatz/quellen/auszuege/enwikt-arabisch.jsonl), ausgelesen per Skript, und steht
   jeweils im Kommentar über der Karte. Gegenprobe arabdict (23.10.2026): al-arbaʿāʾ und
   al-jumuʿa wie hier; die zusammengesetzten Monatsnamen führt arabdict nicht vokalisiert.
   Die beiden Buchkarten schreiben genau wie die Tabelle (vom Bau-Skript verglichen).

   ⚠️ SCHREIBVARIANTEN — bewusst genannt, nicht still entschieden
     · Freitag: al-jumuʿa (hier, wie arabdict und wie seine App es schon schreibt) — auch al-jumʿa
     · Mittwoch: al-arbaʿāʾ (hier, wie Tabelle und arabdict) — auch al-arbiʿāʾ
     · 4. Monat: Rabīʿ al-Ākhir (hier) — auch Rabīʿ ath-Thānī
     · 6. Monat: Jumādā al-Ākhira (hier) — auch Jumādā ath-Thāniya
     · 1. Monat: ohne Artikel wie arabicroots bei Rajab — auch mit Artikel (al-Muḥarram)

   ⚠️ FELDER
     · Wochentage wie arabicroots bei Dienstag: mit yawm (Tag), Nomen, männlich.
     · Wurzel nur mit Beleg (steht je Karte im Kommentar). Wo keine Quelle eine nennt, bleibt
       das Feld leer — nicht geraten. Wortgruppen brauchen keine (FELD_REGELN).
     · Keine Mehrzahl: arabicroots führt auch bei Dienstag und Rajab keine; eine Karte
       „die Ramadane" wäre kein Lernstoff, um den er gebeten hat.
     · Kennung kal-…, ohne Ziffern: diese Karten gibt es bei arabicroots nicht, deshalb gehen
       sie nie dorthin (istArabicrootsWort() in js/lernen.js, der Server nimmt nur Ziffern).
     · chapter/book 'personal': sie verhalten sich wie seine eigenen Wörter (immer frei,
       ausblendbar über vt_geloescht, bearbeitbar).

   Eingehängt in js/kern.js (VOCAB_DATA, vor initProgress) und js/buecher.js (Satz und
   erste Eselsbrücke aus data/beispielsaetze.js und data/eselsbruecken.js).
   Gebaut mit einem Skript im Scratchpad der Sitzung vom 23.10.2026 (kalender-bauen.mjs).
   --------------------------------------------------------------------------- */

const KALENDER_VOKABELN = [
  /* enwikt „يوم الأحد“ (noun), Beugungstabelle, Nominativ · Wurzel: enwikt „الأحد“ */
  { id: 'kal-sonntag', ar: 'يَوْمُ الْأَحَدِ', sg: 'يَوْمُ الْأَحَدِ', de: 'Sonntag', type: 'noun', gender: 'masculine', root: 'أ ح د', chapter: 'personal', book: 'personal', wochentag: 1 },
  /* enwikt „يوم الاثنين“ (noun), Beugungstabelle, Nominativ · Wurzel: enwikt „اثنان“ (zwei); frwikt al-ithnayn: „le (jour de) deux“ */
  { id: 'kal-montag', ar: 'يَوْمُ الِاثْنَيْنِ', sg: 'يَوْمُ الِاثْنَيْنِ', de: 'Montag', type: 'noun', gender: 'masculine', root: 'ث ن ي', chapter: 'personal', book: 'personal', wochentag: 2 },
  /* enwikt „يوم الأربعاء“ (noun), Beugungstabelle, Nominativ · Wurzel: seine Karte 50298 (vier); frwikt arbaʿāʾ: „le quatrième (jour)“ */
  { id: 'kal-mittwoch', ar: 'يَوْمُ الْأَرْبَعَاءِ', sg: 'يَوْمُ الْأَرْبَعَاءِ', de: 'Mittwoch', type: 'noun', gender: 'masculine', root: 'ر ب ع', chapter: 'personal', book: 'personal', wochentag: 4 },
  /* enwikt „يوم الخميس“ (noun), Beugungstabelle, Nominativ · Wurzel: enwikt „الخميس“ */
  { id: 'kal-donnerstag', ar: 'يَوْمُ الْخَمِيسِ', sg: 'يَوْمُ الْخَمِيسِ', de: 'Donnerstag', type: 'noun', gender: 'masculine', root: 'خ م س', chapter: 'personal', book: 'personal', wochentag: 5 },
  /* enwikt „يوم“ (Konstruktform, Nominativ) + enwikt „الجمعة“ (Genitiv, erste Lesart al-jumuʿa — wie arabdict und wie seine App schon schreibt) · Wurzel: enwikt „جمعة“ */
  { id: 'kal-freitag', ar: 'يَوْمُ الْجُمُعَةِ', sg: 'يَوْمُ الْجُمُعَةِ', de: 'Freitag', type: 'noun', gender: 'masculine', root: 'ج م ع', chapter: 'personal', book: 'personal', wochentag: 6 },
  /* enwikt „يوم السبت“ (noun), Beugungstabelle, Nominativ · Wurzel: enwikt „السبت“ */
  { id: 'kal-samstag', ar: 'يَوْمُ السَّبْتِ', sg: 'يَوْمُ السَّبْتِ', de: 'Samstag', type: 'noun', gender: 'masculine', root: 'س ب ت', chapter: 'personal', book: 'personal', wochentag: 7 },
  /* enwikt „محرم“ (name), Beugungstabelle, Nominativ · Wurzel: frwikt muḥarram = Partizip von ḥarrama */
  { id: 'kal-muharram', ar: 'مُحَرَّمٌ', sg: 'مُحَرَّمٌ', de: 'Muharram (1. Monat)', type: 'noun', gender: 'masculine', root: 'ح ر م', chapter: 'personal', book: 'personal', monat: 1 },
  /* enwikt „صفر“ (name), Beugungstabelle, Nominativ · Wurzel: keine Quelle nennt sie (Eigenname) */
  { id: 'kal-safar', ar: 'صَفَرٌ', sg: 'صَفَرٌ', de: 'Safar (2. Monat)', type: 'noun', gender: 'masculine', chapter: 'personal', book: 'personal', monat: 2 },
  /* enwikt „ربيع الأول“ (name), Beugungstabelle, Nominativ · Wurzel: enwikt „ربيع“ (Frühling) */
  { id: 'kal-rabi1', ar: 'رَبِيعٌ الْأَوَّلُ', sg: 'رَبِيعٌ الْأَوَّلُ', de: 'Rabi al-Awwal (3. Monat)', type: 'noun', gender: 'masculine', root: 'ر ب ع', chapter: 'personal', book: 'personal', monat: 3 },
  /* enwikt „ربيع الآخر“ (name), Beugungstabelle, Nominativ · Wurzel: enwikt „ربيع“; auch Rabīʿ ath-Thānī */
  { id: 'kal-rabi2', ar: 'رَبِيعٌ الْآخِرُ', sg: 'رَبِيعٌ الْآخِرُ', de: 'Rabi al-Akhir (4. Monat)', type: 'noun', gender: 'masculine', root: 'ر ب ع', chapter: 'personal', book: 'personal', monat: 4 },
  /* enwikt „جمادى الأولى“ (name), Beugungstabelle, Nominativ · Wurzel: keine Quelle nennt sie (Wortgruppe) */
  { id: 'kal-jumada1', ar: 'جُمَادَى الْأُولَى', sg: 'جُمَادَى الْأُولَى', de: 'Jumada al-Ula (5. Monat)', type: 'noun', gender: 'feminine', chapter: 'personal', book: 'personal', monat: 5 },
  /* enwikt „جمادى الآخرة“ (name), Beugungstabelle, Nominativ · Wurzel: keine Quelle nennt sie (Wortgruppe); auch Jumādā ath-Thāniya */
  { id: 'kal-jumada2', ar: 'جُمَادَى الْآخِرَةُ', sg: 'جُمَادَى الْآخِرَةُ', de: 'Jumada al-Akhira (6. Monat)', type: 'noun', gender: 'feminine', chapter: 'personal', book: 'personal', monat: 6 },
  /* enwikt „شعبان“ (name), Beugungstabelle, Nominativ · Wurzel: keine Quelle nennt sie (Eigenname) */
  { id: 'kal-shaban', ar: 'شَعْبَانُ', sg: 'شَعْبَانُ', de: 'Shaban (8. Monat)', type: 'noun', gender: 'masculine', chapter: 'personal', book: 'personal', monat: 8 },
  /* enwikt „رمضان“ (name), Beugungstabelle, Nominativ · Wurzel: keine Quelle nennt sie (Eigenname) */
  { id: 'kal-ramadan', ar: 'رَمَضَانُ', sg: 'رَمَضَانُ', de: 'Ramadan (9. Monat)', type: 'noun', gender: 'masculine', chapter: 'personal', book: 'personal', monat: 9 },
  /* enwikt „شوال“ (name), Beugungstabelle, Nominativ · Wurzel: enwikt „شوال“ */
  { id: 'kal-shawwal', ar: 'شَوَّالٌ', sg: 'شَوَّالٌ', de: 'Shawwal (10. Monat)', type: 'noun', gender: 'masculine', root: 'ش و ل', chapter: 'personal', book: 'personal', monat: 10 },
  /* enwikt „ذو القعدة“ (name), Beugungstabelle, Nominativ · Wurzel: keine Quelle nennt sie (Wortgruppe) */
  { id: 'kal-dhulqada', ar: 'ذُو الْقَعْدَةِ', sg: 'ذُو الْقَعْدَةِ', de: 'Dhul-Qada (11. Monat)', type: 'noun', gender: 'masculine', chapter: 'personal', book: 'personal', monat: 11 },
  /* enwikt „ذو الحجة“ (name), Beugungstabelle, Nominativ · Wurzel: enwikt „حجة“ */
  { id: 'kal-dhulhijja', ar: 'ذُو الْحِجَّةِ', sg: 'ذُو الْحِجَّةِ', de: 'Dhul-Hijja (12. Monat)', type: 'noun', gender: 'masculine', root: 'ح ج ج', chapter: 'personal', book: 'personal', monat: 12 },
];

/* Buchkarten, die nur ein anderes Deutsch bekommen (angewandt in js/buecher.js, vor seinen
   eigenen Änderungen — was er selbst eintippt, gewinnt). */
const KALENDER_BUCHKARTEN = {
  /* Rajab, Madina 1, Kapitel 14 — arabicroots: „Rajab (Monat)". Sein Wunsch: der Platz im Jahr. */
  '45926': { de: 'Rajab (7. Monat)' },
};
