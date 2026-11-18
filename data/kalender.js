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

  /* ---------- Islamische Wörter (18.11.2026) ----------
     Elias in der Sitzung „Russisch Vokabeltrainer App": „für die arabisch app brauche ich auch die
     die wir gesagt hatte" — die Liste der islamischen Wörter, dazu „ich brauche auch morgen und
     abend als vokabel" (hier direkt gesagt). Und auf die Frage nach der Quelle der Vokalzeichen:
     „guck die sätze und so nach mit den wörterbüchern die wir haben".
     ⭐ Was es als Buchkarte schon gibt, bekommt keine zweite Karte (A13): beten, Moschee, Prophet,
     Imam, Ramadan und Teppich hat er schon; 13 weitere Buchkarten (Muslim, fasten, Seele, Sünde,
     Hidschab, Mekka, Morgen, Gottheit, Paradies, gute Tat, Engel, heilig, Almosen) schaltet
     FREISCHALTEN_AUF_WUNSCH in js/kern.js einzeln frei.
     ⛔ HERKUNFT: jede Form aus dem enwikt-Auszug (data-ersatz/quellen/auszuege/enwikt-arabisch.jsonl),
     gegengeprüft bei arabdict am 18.11.2026. Abweichungen: Wudu — arabdict nennt zuerst wadūʾ
     (das Waschwasser), enwikt wuḍūʾ für die Waschung (hier); Suhur — enwikt saḥūr für die Mahlzeit
     (hier), arabdict suḥūr (das Verbalnomen). Allah wie überall in der App: اللَّهُ. */
  { id: 'isl-islam', ar: 'الْإِسْلَامُ', sg: 'الْإِسْلَامُ', de: 'der Islam', type: 'noun', gender: 'masculine', root: 'س ل م', chapter: 'personal', book: 'personal' },
  { id: 'isl-muslima', ar: 'مُسْلِمَةٌ', sg: 'مُسْلِمَةٌ', pl: 'مُسْلِمَاتٌ', de: 'Muslimin', type: 'noun', gender: 'feminine', root: 'س ل م', chapter: 'personal', book: 'personal' },
  { id: 'isl-quran', ar: 'الْقُرْآنُ', sg: 'الْقُرْآنُ', de: 'der Koran', type: 'noun', gender: 'masculine', root: 'ق ر أ', chapter: 'personal', book: 'personal' },
  { id: 'isl-allah', ar: 'اللَّهُ', sg: 'اللَّهُ', de: 'Allah', type: 'noun', gender: 'masculine', chapter: 'personal', book: 'personal' },
  { id: 'isl-iman', ar: 'إِيمَانٌ', sg: 'إِيمَانٌ', de: 'Glaube', type: 'noun', gender: 'masculine', root: 'أ م ن', chapter: 'personal', book: 'personal' },
  { id: 'isl-jahannam', ar: 'جَهَنَّمُ', sg: 'جَهَنَّمُ', de: 'Hölle', type: 'noun', gender: 'feminine', chapter: 'personal', book: 'personal' },
  { id: 'isl-salah', ar: 'صَلَاةٌ', sg: 'صَلَاةٌ', pl: 'صَلَوَاتٌ', de: 'Pflichtgebet (Salah)', type: 'noun', gender: 'feminine', root: 'ص ل و', chapter: 'personal', book: 'personal' },
  { id: 'isl-wudu', ar: 'وُضُوءٌ', sg: 'وُضُوءٌ', de: 'rituelle Waschung (Wudu)', type: 'noun', gender: 'masculine', root: 'و ض أ', chapter: 'personal', book: 'personal' },
  { id: 'isl-siyam', ar: 'صِيَامٌ', sg: 'صِيَامٌ', de: 'das Fasten', type: 'noun', gender: 'masculine', root: 'ص و م', chapter: 'personal', book: 'personal' },
  { id: 'isl-eid-fitr', ar: 'عِيدُ الْفِطْرِ', sg: 'عِيدُ الْفِطْرِ', de: 'Fest des Fastenbrechens', type: 'noun', gender: 'masculine', chapter: 'personal', book: 'personal' },
  { id: 'isl-eid-adha', ar: 'عِيدُ الْأَضْحَى', sg: 'عِيدُ الْأَضْحَى', de: 'Opferfest', type: 'noun', gender: 'masculine', chapter: 'personal', book: 'personal' },
  { id: 'isl-hajj', ar: 'حَجٌّ', sg: 'حَجٌّ', de: 'Hadsch (Pilgerfahrt)', type: 'noun', gender: 'masculine', root: 'ح ج ج', chapter: 'personal', book: 'personal' },
  { id: 'isl-iftar', ar: 'إِفْطَارٌ', sg: 'إِفْطَارٌ', de: 'Iftar (Fastenbrechen am Abend)', type: 'noun', gender: 'masculine', root: 'ف ط ر', chapter: 'personal', book: 'personal' },
  { id: 'isl-suhur', ar: 'سَحُورٌ', sg: 'سَحُورٌ', de: 'Suhur (Mahlzeit vor der Morgendämmerung)', type: 'noun', gender: 'masculine', root: 'س ح ر', chapter: 'personal', book: 'personal' },
  { id: 'isl-zakat', ar: 'زَكَاةٌ', sg: 'زَكَاةٌ', de: 'Zakat (Pflichtabgabe)', type: 'noun', gender: 'feminine', root: 'ز ك و', chapter: 'personal', book: 'personal' },
  { id: 'isl-halal', ar: 'حَلَالٌ', sg: 'حَلَالٌ', de: 'halal (erlaubt)', type: 'adjective', root: 'ح ل ل', chapter: 'personal', book: 'personal' },
  { id: 'isl-haram', ar: 'حَرَامٌ', sg: 'حَرَامٌ', femSg: 'حَرَامٌ', de: 'haram (verboten)', type: 'adjective', root: 'ح ر م', chapter: 'personal', book: 'personal' },
  { id: 'isl-adhan', ar: 'أَذَانٌ', sg: 'أَذَانٌ', de: 'Gebetsruf (Adhan)', type: 'noun', gender: 'masculine', root: 'أ ذ ن', chapter: 'personal', book: 'personal' },
  { id: 'isl-mumin', ar: 'مُؤْمِنٌ', sg: 'مُؤْمِنٌ', pl: 'مُؤْمِنُونَ', de: 'Gläubiger', type: 'noun', gender: 'masculine', root: 'أ م ن', chapter: 'personal', book: 'personal' },
  { id: 'isl-subha', ar: 'سُبْحَةٌ', sg: 'سُبْحَةٌ', pl: 'سُبُحَاتٌ', de: 'Gebetskette', type: 'noun', gender: 'feminine', root: 'س ب ح', chapter: 'personal', book: 'personal' },
  { id: 'isl-sabr', ar: 'صَبْرٌ', sg: 'صَبْرٌ', de: 'Geduld', type: 'noun', gender: 'masculine', root: 'ص ب ر', chapter: 'personal', book: 'personal' },
  { id: 'isl-maghfira', ar: 'مَغْفِرَةٌ', sg: 'مَغْفِرَةٌ', de: 'Vergebung', type: 'noun', gender: 'feminine', root: 'غ ف ر', chapter: 'personal', book: 'personal' },
  { id: 'isl-niyya', ar: 'نِيَّةٌ', sg: 'نِيَّةٌ', pl: 'نِيَّاتٌ', de: 'Absicht (Niyya)', type: 'noun', gender: 'feminine', root: 'ن و ي', chapter: 'personal', book: 'personal' },
  { id: 'isl-qiyama', ar: 'يَوْمُ الْقِيَامَةِ', sg: 'يَوْمُ الْقِيَامَةِ', de: 'Tag des Gerichts', type: 'noun', gender: 'masculine', chapter: 'personal', book: 'personal' },
  { id: 'isl-masa', ar: 'مَسَاءٌ', sg: 'مَسَاءٌ', pl: 'أَمْسِيَةٌ', de: 'Abend', type: 'noun', gender: 'masculine', root: 'م س ي', chapter: 'personal', book: 'personal' },
];

/* Buchkarten, die nur ein anderes Deutsch bekommen (angewandt in js/buecher.js, vor seinen
   eigenen Änderungen — was er selbst eintippt, gewinnt). */
const KALENDER_BUCHKARTEN = {
  /* Rajab, Madina 1, Kapitel 14 — arabicroots: „Rajab (Monat)". Sein Wunsch: der Platz im Jahr. */
  '45926': { de: 'Rajab (7. Monat)' },
};
