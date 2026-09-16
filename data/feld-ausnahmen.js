/* data/feld-ausnahmen.js — wo ein leeres Feld KEIN Mangel ist
 * ==========================================================================
 *
 * ⛔⛔ DAS PROBLEM, DAS DIESE DATEI LÖST
 *
 * Ein leeres Feld hat ZWEI Ursachen, und beide sehen gleich aus:
 *
 *   a) „gibt es nicht"        — نَعَمْ hat keine Wurzel, اليَابَانُ keinen Plural
 *   b) „noch nicht eingetragen" — hier ist wirklich Arbeit offen
 *
 * Solange ein Werkzeug beide gleich liest, hat es nur zwei schlechte Wahlen:
 * schweigen (dann meldet es echte Lücken nie) oder alles melden (dann besteht
 * seine Liste zu vier Fünfteln aus Nicht-Fehlern — und wird ab dem vierten Mal
 * ignoriert).
 *
 * Am 20.08.2026 gemessen, über Elias' Fenster von 189 Wörtern:
 *
 *   root leer   31 von 189  →  darunter نَعَمْ, لَا, أَ, مَا, وَ — Partikel
 *   gender leer 10 von 128  →  ALLE ZEHN sind Fachbegriffe (مُضَاف, مَجْرُور …)
 *   pl leer     35 von 128  →  darunter سُكَّرٌ, مَاءٌ, اليَابَانُ, الصِّينُ
 *
 * ==========================================================================
 * ⭐ ZWEI EBENEN, UND DIE REIHENFOLGE IST ABSICHT
 *
 * 1. REGELN aus der Sache — sie decken auch Wörter ab, die noch niemand
 *    gesehen hat. Eine Liste deckt nur ab, was schon aufgefallen ist.
 *    [[allgemeine_regel_statt_listeneintrag]]
 *
 * 2. EINZELFÄLLE, die Elias bestätigt hat. Diese Liste wächst NUR durch seine
 *    Entscheidung — nie durch eine Vermutung von mir. Ein Wort, bei dem ich
 *    unsicher bin, gehört ihm vorgelegt, nicht hier eingetragen.
 *    ⛔ Regel 6 der Nachtschicht: nichts erfinden. Ob مَاءٌ einen Plural hat
 *    (مِيَاه) ist eine Frage an seinen Lehrer, keine, die ich hier entscheide.
 *
 * ==========================================================================
 * Gelesen von: werkzeuge/vorrat.mjs (Vollständigkeitsmessung)
 * Geprüft von: node validate.js
 */

/* ---------- Ebene 1: Regeln aus der Sache ---------- */

const FELD_REGELN = {

  /* Eine Wurzel hat nur, was aus einer Wurzel ableitbar ist. Partikel sind es
     nicht — sie sind unveränderliche Bausteine (حَرْف). Dasselbe gilt für
     Fremdwörter und Eigennamen, die aus anderen Sprachen übernommen wurden. */
  root: {
    typen: ['particle'],
    /* ⭐ Fachbegriffe HÄTTEN eine Wurzel (مَجْرُور → ج ر ر), aber sie gehören
       nicht in die Wurzelansicht: die ist eine Lernfunktion für Vokabeln
       (js/wurzel.js), und Metasprache in einer Wortfamilie verwässert sie.
       ⚠️ Umkehrbar — steht Elias als EINE Frage vor, nicht als zehn. */
    quellen: ['fachbegriffe'],
    /* ⭐⭐ WORTGRUPPEN HABEN KEINE WURZEL — eine Regel aus der Sache, kein
       Einzelfall (07.09.2026). Eine Wurzel gehört zu EINEM Wort; اِسْمٌ
       مَجْرُورٌ, مُضَافْ إِلَيْهِ und حَرْفُ الْجَرِّ sind Fügungen aus zweien.
       Ihre Bestandteile haben je eine Wurzel, die Fügung selbst nicht.

       ⛔ Aufgefallen bei der Suche nach einer Wurzel-QUELLE: von den 18
       gemeldeten Lücken waren neun Dubletten und sechs Wortgruppen oder
       Partikeln. Ein einziges Wort — أَلْمُهَنْدِسٌ — hatte wirklich eine
       fehlende Wurzel. Eine Kandidatenliste ist keine Fehlerliste.
       [[kandidatenliste_ist_keine_fehlerliste]] [[allgemeine_regel_statt_listeneintrag]] */
    wortgruppe: true,
    grund: 'Ein حَرْف ist nicht ableitbar; ein Fachbegriff gehört nicht in die '
         + 'Wurzelansicht; eine Wortgruppe hat keine eigene Wurzel.'
  },

  /* Fachbegriffe sind METASPRACHE: مُضَاف beschreibt eine Satzstellung, es ist
     kein Ding, dessen Geschlecht oder Plural man abfragen könnte. Eine Übung
     „ist مَجْرُور männlich oder weiblich?" wäre sinnlos.
     ⛔ Erkennung NICHT über den Namen, sondern über die Herkunft: alles aus
     FACHBEGRIFF_VOKABELN. */
  gender: { quellen: ['fachbegriffe'], grund: 'Fachbegriff — Metasprache, kein Übungswort.' },
  sg:     { quellen: ['fachbegriffe'], grund: 'Fachbegriff — Metasprache, kein Übungswort.' },
  pl:     { quellen: ['fachbegriffe'], grund: 'Fachbegriff — Metasprache, kein Übungswort.' },

  /* Nur Adjektive haben eine weibliche Form. */
  femSg: { typen: ['noun', 'particle', 'verb', 'other'], grund: 'Nur Adjektive haben femSg.' },

  /* Nur Verben haben Zeitformen. */
  past:       { typen: ['noun', 'adjective', 'particle', 'other'], grund: 'Kein Verb.' },
  present:    { typen: ['noun', 'adjective', 'particle', 'other'], grund: 'Kein Verb.' },
  imperative: { typen: ['noun', 'adjective', 'particle', 'other'], grund: 'Kein Verb.' },
  masdar:     { typen: ['noun', 'adjective', 'particle', 'other'], grund: 'Kein Verb.' }
};

/* ---------- Ebene 2: Einzelfälle, die Elias bestätigt hat ----------
 *
 * Aufbau:  'wort-id': { feld: 'Grund in einem Satz' }
 *
 * ⛔ Hier steht NUR, was er selbst bestätigt hat. Was ich für wahrscheinlich
 * halte, gehört auf die Vorlage-Liste (werkzeuge/vorrat.mjs --offene-fragen),
 * nicht hierher. Der Unterschied ist der ganze Wert dieser Datei: was hier
 * steht, wird nie wieder gefragt.
 *
 * ⭐ AUSNAHME MIT SEINEM AUFTRAG (16.09.2026). Zur Fragenseite („41 Angaben an
 * 31 Wörtern") schrieb Elias: „das mach selber mit den wörterbüchern." Die
 * Einträge mit „auf Elias’ Auftrag nachgeschlagen" in allen vier Ebenen stammen
 * daher — NICHT von ihm, sondern aus: 1. seinem arabicroots-Abzug (Rang 1:
 * Wurzel/Plural/Geschlecht von حَالٌ, مُهَنْدِسٌ, اِسْمٌ, die Verbformen von
 * خَرَجَ aus Bayna Yadayk 2), 2. en.wiktionary (سُكَّر und شَاي ausdrücklich
 * „uncountable", صِفْر Plural أَصْفَار, سَيِّدَة Plural سَيِّدَات, مَكْسُور
 * weiblich مَكْسُورَة, ثَلَاثَة „f" mit Polaritätsregel), 3. Reverso als zweite
 * Quelle (أيض, هندس, أصفار = Pl. von صفر, مكسورة = gebeugt von مكسور). Die
 * Wortart folgt seinem Unterricht, nicht dem Wörterbuch (Folge 08: Orts- und
 * Zeitangaben sind اِسْم → أَمَامَ, الْيَوْمُ noun). Beleg je Wort: To-Do
 * Vokabeltrainer, 16.09.2026 abends.
 * ⭐ عِنْدَ und بَعْدَ hatte er am 15.09. selbst als Partikel beantwortet; auf
 * „Nach Folge 8 wären sie wie أَمَامَ Nomen. Soll ich sie angleichen?" kam am
 * 16.09.2026 um 22:21:43 „ja" → noun, das ist SEINE Entscheidung („von Elias
 * bestritten am 16.9."). Die Folgefragen (Geschlecht, Plural, Singular) sind am
 * 17.09. auf seinen Auftrag nachgeschlagen: arabicroots führt beide ohne diese
 * Angaben (madina-3 K19 48524, quran K7 49873, quran K6 49855), en.wiktionary
 * als „Preposition" ohne Geschlecht und Plural (أَبْعَاد gehört zu بُعْد
 * „Entfernung"), arabdict ohne Pluralform. Kein Plural bei غَرْب/شَرْق/عَرَبِيَّة/
 * إِنْجِلِيزِيَّة: Himmelsrichtung bzw. Sprachname — keine der Quellen führt einen.
 */

const FELD_AUSNAHMEN = {
  '0f311405-7349-450c-885e-e3abefb6fbf3': { root: 'auf Elias’ Auftrag nachgeschlagen am 16.9.2026 — لِ (für / gehört)' },
  '45781': { pl: 'auf Elias’ Auftrag nachgeschlagen am 16.9.2026 — سُكَّرٌ (Zucker)' },
  '45813': { pl: 'von Elias bestätigt am 15.9.2026 — الفِلِيبِّينُ (Philippinen)' },
  '45814': { pl: 'von Elias bestätigt am 15.9.2026 — اليَابَانُ (Japan)' },
  '45815': { pl: 'von Elias bestätigt am 15.9.2026 — الصِّينُ (China)' },
  '45816': { pl: 'von Elias bestätigt am 15.9.2026 — الهِنْدُ (Indien)' },
  '45833': { pl: 'von Elias bestätigt am 15.9.2026 — كَعْبَةٌ (Kaaba)' },
  '45849': { pl: 'auf Elias’ Auftrag nachgeschlagen am 16.9.2026 — شَايٌ (Tee)' },
  '45850': { pl: 'auf Elias’ Auftrag nachgeschlagen am 16.9.2026 — غَرْبٌ (Westen)' },
  '45861': { pl: 'auf Elias’ Auftrag nachgeschlagen am 16.9.2026 — شَرْقٌ (Osten)' },
  '45868': { pl: 'von Elias bestätigt am 15.9.2026 — أَمْرِيكَا (Amerika)' },
  '45870': { pl: 'von Elias bestätigt am 15.9.2026 — أَلْمَانِيَا (Deutschland)' },
  '45871': { pl: 'von Elias bestätigt am 15.9.2026 — إِنْجِلْتَرَا (England)' },
  '45872': { pl: 'von Elias bestätigt am 15.9.2026 — العِرَاقُ (Irak)' },
  '45873': { pl: 'von Elias bestätigt am 15.9.2026 — سُويسْرَا (Schweiz)' },
  '45878': { pl: 'auf Elias’ Auftrag nachgeschlagen am 16.9.2026 — عَرَبِيَّةٌ (Arabisch)' },
  '45883': { pl: 'auf Elias’ Auftrag nachgeschlagen am 16.9.2026 — إِنْجِلِيزِيَّةٌ (Englisch)' },
  '45886': { pl: 'von Elias bestätigt am 15.9.2026 — القَاهِرَةُ (Kairo)' },
  '45894': { pl: 'von Elias bestätigt am 15.9.2026 — الكُوَيْتُ (Kuwait)' },
  '45898': { pl: 'von Elias bestätigt am 15.9.2026 — إِنْدُونِيسِيَا (Indonesien)' },
  '45907': { pl: 'von Elias bestätigt am 15.9.2026 — سُورِيَا (Syrien)' },
  '45911': { pl: 'von Elias bestätigt am 15.9.2026 — مَالِيزِيَا (Malaysia)' },
  '48402': { pl: 'auf Elias’ Auftrag nachgeschlagen am 16.9.2026 — الْيَوْمُ (heute)' },
  '69179bbf-faa9-4b2a-859c-9e5f3d76b98c': { root: 'auf Elias’ Auftrag nachgeschlagen am 16.9.2026 — يَا (Rufpartikel)' },
  'd3cca272-90df-4963-a3dd-2653d009a77d': { pl: 'auf Elias’ Auftrag nachgeschlagen am 16.9.2026 — إِثْنَانِ (Zwei (2))', sg: 'auf Elias’ Auftrag nachgeschlagen am 16.9.2026 — إِثْنَانِ (Zwei (2))' },
  'p_1787184718572': { root: 'auf Elias’ Auftrag nachgeschlagen am 16.9.2026 — لِمَن ((für) wem/wen)' },
  'p_1787185309933': { root: 'auf Elias’ Auftrag nachgeschlagen am 16.9.2026 — لَكَ (Für dich (M))' },
  'p_1787185328882': { root: 'auf Elias’ Auftrag nachgeschlagen am 16.9.2026 — لَكِ (Für dich (W))' },
  'p_1787188396011': { gender: 'auf Elias’ Auftrag nachgeschlagen am 17.9.2026 — بَعْدَ ((von) nach / danach)', pl: 'auf Elias’ Auftrag nachgeschlagen am 17.9.2026 — بَعْدَ ((von) nach / danach)', sg: 'auf Elias’ Auftrag nachgeschlagen am 17.9.2026 — بَعْدَ ((von) nach / danach)' },
  'p_1787189076593': { pl: 'auf Elias’ Auftrag nachgeschlagen am 16.9.2026 — حَالُكْ (Dein Zustand)', sg: 'auf Elias’ Auftrag nachgeschlagen am 16.9.2026 — حَالُكْ (Dein Zustand)' },
  'p_1787189287368': { gender: 'auf Elias’ Auftrag nachgeschlagen am 16.9.2026 — أَمَامَ (Vor / davor)', pl: 'auf Elias’ Auftrag nachgeschlagen am 16.9.2026 — أَمَامَ (Vor / davor)', sg: 'auf Elias’ Auftrag nachgeschlagen am 16.9.2026 — أَمَامَ (Vor / davor)' },
  'p_1787189488747': { root: 'auf Elias’ Auftrag nachgeschlagen am 16.9.2026 — فِيْهِ (darin / in ihm)' },
  'p_1787190874749': { gender: 'auf Elias’ Auftrag nachgeschlagen am 17.9.2026 — عِنْدَ (Bei)', pl: 'auf Elias’ Auftrag nachgeschlagen am 17.9.2026 — عِنْدَ (Bei)', sg: 'auf Elias’ Auftrag nachgeschlagen am 17.9.2026 — عِنْدَ (Bei)' }
};

/* ---------- Ebene 3: Werte, die Elias nachgetragen hat ----------
 *
 * ⛔⛔ WARUM DAS NICHT IN DIE BUCHDATEI KANN: `data/vokabeln-<buch>.js` wird von
 * `werkzeuge/hole-vokabeln.mjs` bei jedem Abzug NEU GESCHRIEBEN. Ein dort
 * eingetragener Plural wäre beim nächsten Lauf spurlos weg — und niemand
 * würde es merken, weil das Wort einfach wieder als unvollständig gemeldet
 * würde. [[leere_datei_besteht_jeden_test]]
 *
 * Deshalb hier, in einer Datei, die kein Werkzeug überschreibt.
 *
 * ⭐ Sie wird AUSGELIEFERT und von js/kern.js angewendet — sonst stünde der
 * nachgetragene Plural nur in seinem Browserspeicher und wäre auf jedem
 * zweiten Gerät wieder weg. Seine eigene Änderung (`vt_wortAenderungen`)
 * behält trotzdem Vorrang: sie wird DANACH angewendet.
 *
 * Aufbau:  'wort-id': { feld: 'Wert' }
 *
 * Gefüllt von `werkzeuge/antworten-uebernehmen.mjs` aus dem, was Elias im
 * Wartungsfragen-Artefakt beantwortet hat. ⛔ Nicht von Hand raten.
 */

const FELD_ERGAENZUNGEN = {
  '0e23a52d-e2f5-4a57-9082-58eb9f362d88': { root: 'ء ي ض', type: 'adverb' },
  '36e01b96-9367-4f09-acaf-31a82bdcf061': { gender: 'masculine', pl: 'مُهَنْدِسُونَ', root: 'ه ن د س', sg: 'مُهَنْدِسٌ', type: 'noun' },
  '45802': { pl: 'مِيَاه / أَمْوَاه / أَمْوَاء' },
  '45841': { pl: 'مَكَاوٍ' },
  '45851': { pl: 'قَهَوَات / قَهَاوٍ' },
  '45908': { pl: 'مَدَارِسُ مُتَوَسِّطَةٌ' },
  '48402': { type: 'noun' },
  '50297': { gender: 'feminine' },
  '50298': { gender: 'feminine' },
  '50299': { gender: 'feminine' },
  '50300': { gender: 'feminine' },
  '50301': { gender: 'feminine' },
  '50302': { gender: 'feminine' },
  '50303': { gender: 'feminine' },
  '50304': { gender: 'feminine' },
  '59e30a8a-e400-4380-8adf-89e811852a1d': { gender: 'masculine', pl: 'لُحُوم / لِحَام / لِحْمَان / لُحْمَان / أَلْحُم', root: 'ل ح م', sg: 'لَحْمٌ', type: 'noun' },
  '65699a81-0913-4e3c-9d5d-fa750d972779': { root: 'س م و' },
  'a540cdfa-cbaf-4d63-8250-b0b664d3b2b9': { gender: 'masculine', pl: 'أَصْفَار', root: 'ص ف ر', sg: 'صِفْرٌ', type: 'noun' },
  'd3cca272-90df-4963-a3dd-2653d009a77d': { gender: 'masculine', root: 'ث ن ي', type: 'noun' },
  'p_1787183484954': { femSg: 'مَكْسُورَة', root: 'ك س ر', type: 'adjective' },
  'p_1787184718572': { type: 'particle' },
  'p_1787185012359': { gender: 'masculine', pl: 'سَادَةٌ', root: 'س و د', sg: 'سَيِّدٌ', type: 'noun' },
  'p_1787185031977': { gender: 'feminine', pl: 'سَيِّدَات', root: 'س و د', sg: 'سَيِّدَةٌ', type: 'noun' },
  'p_1787185309933': { type: 'particle' },
  'p_1787185328882': { type: 'particle' },
  'p_1787188396011': { root: 'ب ع د', type: 'noun' },
  'p_1787189022107': { root: 'ك ي ف', type: 'particle' },
  'p_1787189076593': { gender: 'masculine', root: 'ح و ل', type: 'noun' },
  'p_1787189287368': { root: 'ء م م', type: 'noun' },
  'p_1787189488747': { type: 'particle' },
  'p_1787189845886': { imperative: 'اُخْرُجْ', masdar: 'خُرُوجٌ', past: 'خَرَجَ', present: 'يَخْرُجُ', root: 'خ ر ج', type: 'verb' },
  'p_1787190874749': { root: 'ع ن د', type: 'noun' },
  'p_1787191371934': { root: 'ك س ل', type: 'adjective' }
};

/* ---------- Ebene 4: Wortarten, die Elias bestritten hat ----------
 *
 * ⛔⛔ WOZU: Eine Frage nach `femSg` setzt voraus, dass das Wort ein Adjektiv
 * IST. Stimmt die Wortart nicht, ist die Frage nicht schwer, sondern
 * **unbeantwortbar** — und Elias sitzt davor und überlegt, was er falsch
 * versteht.
 *
 * Am 20.08.2026 aufgefallen an `id 48402`: الْيَوْمُ („heute") steht im
 * arabicroots-Abzug als `type: "adjective"`. Es ist ein Nomen (يَوْمٌ, mit
 * Artikel adverbial gebraucht, ظَرْفُ زَمَانٍ) und hat keine weibliche Form.
 * Die Fragenseite hätte danach gefragt.
 *
 * ⭐ Die Wirkung reicht weiter als eine ausgefallene Übung: `setzeLexikon()`
 * in js/irab.js trägt `type` ins Iʿrāb-Lexikon ein — JEDER Satz mit dem Wort
 * wird danach zerlegt. Ein falsches Feld ist schädlicher als ein leeres.
 *
 * Aufbau:  'wort-id': { feld: 'was im Abzug steht' }
 *
 * Wirkung: das Wort kommt bei der nächsten Messung wieder in die Frage
 * „Welche Wortart?", obwohl das Feld gefüllt ist. Beantwortet er sie, landet
 * der neue Wert in FELD_ERGAENZUNGEN und der Zweifel ist erledigt.
 *
 * ⛔ Auch hier gilt Ebene 2: NUR was er selbst bestritten hat. Ein Verdacht
 * von mir gehört ihm vorgelegt, nicht hier eingetragen.
 */

const FELD_ZWEIFEL = {
  '48402': { type: 'auf Elias’ Auftrag nachgeschlagen am 16.9.2026 — الْيَوْمُ (heute)' },
  'p_1787183484954': { type: 'von Elias bestritten am 15.9.2026 — مَكْسُورٌ (Kaputt)' },
  'p_1787184718572': { type: 'auf Elias’ Auftrag nachgeschlagen am 16.9.2026 — لِمَن ((für) wem/wen)' },
  'p_1787185309933': { type: 'auf Elias’ Auftrag nachgeschlagen am 16.9.2026 — لَكَ (Für dich (M))' },
  'p_1787185328882': { type: 'auf Elias’ Auftrag nachgeschlagen am 16.9.2026 — لَكِ (Für dich (W))' },
  'p_1787188396011': { type: 'von Elias bestritten am 16.9.2026 — بَعْدَ ((von) nach / danach)' },
  'p_1787189022107': { type: 'von Elias bestritten am 15.9.2026 — كَيْفَ (Wie)' },
  'p_1787189488747': { type: 'auf Elias’ Auftrag nachgeschlagen am 16.9.2026 — فِيْهِ (darin / in ihm)' },
  'p_1787189845886': { type: 'von Elias bestritten am 15.9.2026 — خَرَجَ (Herausgehen/ herauskommen)' },
  'p_1787190874749': { type: 'von Elias bestritten am 16.9.2026 — عِنْدَ (Bei)' },
  'p_1787191371934': { type: 'von Elias bestritten am 15.9.2026 — كَسْلَانُ (Faul)' }
};

/* ---------- Prüffunktion ---------- */

/**
 * Ist ein leeres Feld an diesem Wort erklärt?
 * @param {object} w      das Wort
 * @param {string} feld   Feldname, z. B. 'root'
 * @param {string} quelle 'madina-1' | 'eigene' | 'fachbegriffe' | …
 * @returns {string|null} der Grund, oder null wenn es eine echte Lücke ist
 */
function feldAusnahme(w, feld, quelle){
  const id = String(w && w.id || '');
  if (FELD_AUSNAHMEN[id] && FELD_AUSNAHMEN[id][feld]) return FELD_AUSNAHMEN[id][feld];

  const r = FELD_REGELN[feld];
  if (!r) return null;
  if (r.quellen && r.quellen.includes(quelle)) return r.grund;
  if (r.typen && r.typen.includes(String(w && w.type || ''))) return r.grund;
  /* ⭐ Wortgruppen (07.09.2026). Erkannt am Leerzeichen im arabischen Text —
     das ist die Sache selbst, nicht ein Namensmuster: was aus zwei Wörtern
     besteht, hat keine EIGENE Wurzel. ⚠️ NFC und trim, weil ein Wort mit
     schließendem Leerzeichen sonst als Gruppe gälte. */
  if (r.wortgruppe && /\s/.test(String(w && w.ar || '').normalize('NFC').trim())) return r.grund;
  return null;
}

/* ⛔ `other` und `vocab` sind bei `type` KEINE Angabe, auch wenn das Feld
   gefüllt ist: auf der Karte wird daraus „Wort", und Kategorie, Statistik und
   Übung 8 fallen genauso aus wie bei einem leeren Feld. Genau daran wäre die
   Nachtragung sonst wirkungslos geblieben — seine 11 eigenen Vokabeln stehen
   alle auf `other`, und eine Prüfung auf „leer" hätte sie nie ersetzt.
   [[kennzeichen_mit_zwei_ursachen]] */
function feldGiltAlsLeer(feld, wert){
  if (wert === undefined || wert === null || String(wert).trim() === '') return true;
  return feld === 'type' && (wert === 'other' || wert === 'vocab');
}

/**
 * Hat Elias die Wortart dieses Wortes bestritten?
 * ⭐ Ein bestrittener `type` zählt wie ein leerer: das Wort kommt wieder in
 * die Frage „Welche Wortart?". Sonst bliebe der falsche Wert für immer stehen,
 * weil das Feld ja gefüllt IST. [[kennzeichen_mit_zwei_ursachen]]
 * @param {object} w   das Wort
 * @param {string} feld  Feldname
 * @returns {boolean}
 */
function feldBestritten(w, feld){
  const id = String(w && w.id || '');
  return !!(FELD_ZWEIFEL[id] && FELD_ZWEIFEL[id][feld]);
}

/**
 * Die nachgetragenen Werte auf den Bestand legen.
 * ⛔ Nur wo das Feld leer ist (siehe feldGiltAlsLeer) — ein vorhandener Wert
 * aus dem Abzug hat Vorrang, sonst überschriebe eine alte Nachtragung eine
 * spätere Korrektur des Verlags, ohne dass es auffällt.
 * @param {Array} liste  VOCAB_DATA oder eine Buchliste
 * @returns {number} wie viele Felder gesetzt wurden
 */
function wendeFeldErgaenzungenAn(liste){
  if (!Array.isArray(liste)) return 0;
  let n = 0;
  for (const w of liste){
    const e = FELD_ERGAENZUNGEN[String(w && w.id)];
    if (!e) continue;
    for (const f of Object.keys(e)){
      /* ⛔⛔ LEER **ODER BESTRITTEN** — bis zum 20.08.2026 stand hier nur die
         erste Haelfte, und damit war Ebene 4 wirkungslos.

         feldBestritten() traegt seit dem Vortag den Kommentar „Ein bestrittener
         `type` zaehlt wie ein leerer" — das war die ABSICHT. Die Wirkung fehlte:
         die Funktion wurde in js/ nirgends aufgerufen (gemessen: 0 Treffer
         ausser in dieser Datei und in werkzeuge/vorrat.mjs).

         Was das hiess: Elias sagt „die Wortart stimmt nicht", beantwortet die
         Frage neu, antworten-uebernehmen.mjs traegt den Wert in
         FELD_ERGAENZUNGEN — und die App liess ihn liegen, weil das Feld ja
         GEFUELLT war. Der falsche Wert blieb fuer immer stehen.

         ⭐ Betroffen war genau der Fall, fuer den Ebene 4 gebaut wurde:
         id 48402, الْيَوْمُ, steht im Abzug als type:"adjective" und ist ein
         Nomen. `adjective` gilt nicht als leer.
         [[kommentar_beschreibt_absicht_markup_wirkung]]
         [[erfolgsmeldung_ohne_wirkung]] */
      if (feldGiltAlsLeer(f, w[f]) || feldBestritten(w, f)){ w[f] = e[f]; n++; }
    }
  }
  return n;
}

if (typeof window !== 'undefined'){
  window.FELD_REGELN = FELD_REGELN;
  window.FELD_AUSNAHMEN = FELD_AUSNAHMEN;
  window.FELD_ERGAENZUNGEN = FELD_ERGAENZUNGEN;
  window.FELD_ZWEIFEL = FELD_ZWEIFEL;
  window.feldBestritten = feldBestritten;
  window.feldAusnahme = feldAusnahme;
  window.wendeFeldErgaenzungenAn = wendeFeldErgaenzungenAn;
  window.feldGiltAlsLeer = feldGiltAlsLeer;
}
if (typeof module !== 'undefined' && module.exports){
  module.exports = { FELD_REGELN, FELD_AUSNAHMEN, FELD_ERGAENZUNGEN, FELD_ZWEIFEL,
    feldAusnahme, wendeFeldErgaenzungenAn, feldGiltAlsLeer, feldBestritten };
}
