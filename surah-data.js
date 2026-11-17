// Sure-Metadaten (Name, Verszahl). Der Verstext liegt seit dem 27./28.07.2026
// vollstaendig offline in quran-text.js; quran.com ist nur noch Rueckfallebene.
// Einzelne Verse ohne die 2,3-MB-Datei zu oeffnen: node werkzeuge/vers.mjs 2:255
//
// Das Feld "juz" kam am 04.08.2026 dazu. Es ist NICHT von Hand eingetragen,
// sondern erzeugt von werkzeuge/juz-holen.mjs aus https://api.quran.com/api/v4/juzs
// - derselben API, die oben als Rueckfallebene steht. Das Werkzeug schreibt nur,
// wenn beide von der API gelieferten Datensaetze uebereinstimmen UND die
// Verszahlen aus dem verse_mapping je Sure genau die "verses" hier treffen.
// Neu erzeugen (und damit nachpruefen): node werkzeuge/juz-holen.mjs
const SURAH_DATA = [
 {
  "id": 1,
  "ar": "الفاتحة",
  "arTaschkil": "الْفَاتِحَة",
  "name": "Al-Fatihah",
  "de": "Die Eröffnung",
  "verses": 7,
  "juz": [
   1
  ]
 },
 {
  "id": 2,
  "ar": "البقرة",
  "arTaschkil": "الْبَقَرَة",
  "name": "Al-Baqarah",
  "de": "Die Kuh",
  "verses": 286,
  "juz": [
   1,
   2,
   3
  ]
 },
 {
  "id": 3,
  "ar": "آل عمران",
  "arTaschkil": "آلِ عِمْرَان",
  "name": "Ali 'Imran",
  "de": "Die Sippe Imrans",
  "verses": 200,
  "juz": [
   3,
   4
  ]
 },
 {
  "id": 4,
  "ar": "النساء",
  "arTaschkil": "النِّسَاء",
  "name": "An-Nisa",
  "de": "Die Frauen",
  "verses": 176,
  "juz": [
   4,
   5,
   6
  ]
 },
 {
  "id": 5,
  "ar": "المائدة",
  "arTaschkil": "الْمَائِدَة",
  "name": "Al-Ma'idah",
  "de": "Der Tisch",
  "verses": 120,
  "juz": [
   6,
   7
  ]
 },
 {
  "id": 6,
  "ar": "الأنعام",
  "arTaschkil": "الْأَنْعَام",
  "name": "Al-An'am",
  "de": "Das Vieh",
  "verses": 165,
  "juz": [
   7,
   8
  ]
 },
 {
  "id": 7,
  "ar": "الأعراف",
  "arTaschkil": "الْأَعْرَاف",
  "name": "Al-A'raf",
  "de": "Die Höhen",
  "verses": 206,
  "juz": [
   8,
   9
  ]
 },
 {
  "id": 8,
  "ar": "الأنفال",
  "arTaschkil": "الْأَنفَال",
  "name": "Al-Anfal",
  "de": "Die Beute",
  "verses": 75,
  "juz": [
   9,
   10
  ]
 },
 {
  "id": 9,
  "ar": "التوبة",
  "arTaschkil": "التَّوْبَة",
  "name": "At-Tawbah",
  "de": "Die Buße",
  "verses": 129,
  "juz": [
   10,
   11
  ]
 },
 {
  "id": 10,
  "ar": "يونس",
  "arTaschkil": "يُونُس",
  "name": "Yunus",
  "de": "Jonas",
  "verses": 109,
  "juz": [
   11
  ]
 },
 {
  "id": 11,
  "ar": "هود",
  "arTaschkil": "هُود",
  "name": "Hud",
  "de": "Hud",
  "verses": 123,
  "juz": [
   11,
   12
  ]
 },
 {
  "id": 12,
  "ar": "يوسف",
  "arTaschkil": "يُوسُف",
  "name": "Yusuf",
  "de": "Joseph",
  "verses": 111,
  "juz": [
   12,
   13
  ]
 },
 {
  "id": 13,
  "ar": "الرعد",
  "arTaschkil": "الرَّعْد",
  "name": "Ar-Ra'd",
  "de": "Der Donner",
  "verses": 43,
  "juz": [
   13
  ]
 },
 {
  "id": 14,
  "ar": "ابراهيم",
  "arTaschkil": "إِبْرَاهِيم",
  "name": "Ibrahim",
  "de": "Abraham",
  "verses": 52,
  "juz": [
   13
  ]
 },
 {
  "id": 15,
  "ar": "الحجر",
  "arTaschkil": "الْحِجْر",
  "name": "Al-Hijr",
  "de": "Das steinige Land",
  "verses": 99,
  "juz": [
   14
  ]
 },
 {
  "id": 16,
  "ar": "النحل",
  "arTaschkil": "النَّحْل",
  "name": "An-Nahl",
  "de": "Die Biene",
  "verses": 128,
  "juz": [
   14
  ]
 },
 {
  "id": 17,
  "ar": "الإسراء",
  "arTaschkil": "الْإِسْرَاء",
  "name": "Al-Isra",
  "de": "Die nächtliche Reise",
  "verses": 111,
  "juz": [
   15
  ]
 },
 {
  "id": 18,
  "ar": "الكهف",
  "arTaschkil": "الْكَهْف",
  "name": "Al-Kahf",
  "de": "Die Höhle",
  "verses": 110,
  "juz": [
   15,
   16
  ]
 },
 {
  "id": 19,
  "ar": "مريم",
  "arTaschkil": "مَرْيَم",
  "name": "Maryam",
  "de": "Maria",
  "verses": 98,
  "juz": [
   16
  ]
 },
 {
  "id": 20,
  "ar": "طه",
  "arTaschkil": "طه",
  "name": "Taha",
  "de": "Ta Ha",
  "verses": 135,
  "juz": [
   16
  ]
 },
 {
  "id": 21,
  "ar": "الأنبياء",
  "arTaschkil": "الْأَنبِيَاء",
  "name": "Al-Anbya",
  "de": "Die Propheten",
  "verses": 112,
  "juz": [
   17
  ]
 },
 {
  "id": 22,
  "ar": "الحج",
  "arTaschkil": "الْحَجّ",
  "name": "Al-Hajj",
  "de": "Die Wallfahrt",
  "verses": 78,
  "juz": [
   17
  ]
 },
 {
  "id": 23,
  "ar": "المؤمنون",
  "arTaschkil": "الْمُؤْمِنُون",
  "name": "Al-Mu'minun",
  "de": "Die Gläubigen",
  "verses": 118,
  "juz": [
   18
  ]
 },
 {
  "id": 24,
  "ar": "النور",
  "arTaschkil": "النُّور",
  "name": "An-Nur",
  "de": "Das Licht",
  "verses": 64,
  "juz": [
   18
  ]
 },
 {
  "id": 25,
  "ar": "الفرقان",
  "arTaschkil": "الْفُرْقَان",
  "name": "Al-Furqan",
  "de": "Die Rettung",
  "verses": 77,
  "juz": [
   18,
   19
  ]
 },
 {
  "id": 26,
  "ar": "الشعراء",
  "arTaschkil": "الشُّعَرَاء",
  "name": "Ash-Shu'ara",
  "de": "Die Dichter",
  "verses": 227,
  "juz": [
   19
  ]
 },
 {
  "id": 27,
  "ar": "النمل",
  "arTaschkil": "النَّمْل",
  "name": "An-Naml",
  "de": "Die Ameisen",
  "verses": 93,
  "juz": [
   19,
   20
  ]
 },
 {
  "id": 28,
  "ar": "القصص",
  "arTaschkil": "الْقَصَص",
  "name": "Al-Qasas",
  "de": "Die Geschichte",
  "verses": 88,
  "juz": [
   20
  ]
 },
 {
  "id": 29,
  "ar": "العنكبوت",
  "arTaschkil": "الْعَنكَبُوت",
  "name": "Al-'Ankabut",
  "de": "Die Spinne",
  "verses": 69,
  "juz": [
   20,
   21
  ]
 },
 {
  "id": 30,
  "ar": "الروم",
  "arTaschkil": "الرُّوم",
  "name": "Ar-Rum",
  "de": "Die Römer",
  "verses": 60,
  "juz": [
   21
  ]
 },
 {
  "id": 31,
  "ar": "لقمان",
  "arTaschkil": "لُقْمَان",
  "name": "Luqman",
  "de": "Luqman",
  "verses": 34,
  "juz": [
   21
  ]
 },
 {
  "id": 32,
  "ar": "السجدة",
  "arTaschkil": "السَّجْدَة",
  "name": "As-Sajdah",
  "de": "Die Niederwerfung",
  "verses": 30,
  "juz": [
   21
  ]
 },
 {
  "id": 33,
  "ar": "الأحزاب",
  "arTaschkil": "الْأَحْزَاب",
  "name": "Al-Ahzab",
  "de": "Die Gruppen",
  "verses": 73,
  "juz": [
   21,
   22
  ]
 },
 {
  "id": 34,
  "ar": "سبإ",
  "arTaschkil": "سَبَإ",
  "name": "Saba",
  "de": "Die Sabäer",
  "verses": 54,
  "juz": [
   22
  ]
 },
 {
  "id": 35,
  "ar": "فاطر",
  "arTaschkil": "فَاطِر",
  "name": "Fatir",
  "de": "Der Schöpfer",
  "verses": 45,
  "juz": [
   22
  ]
 },
 {
  "id": 36,
  "ar": "يس",
  "arTaschkil": "يسٓ",
  "name": "Ya-Sin",
  "de": "Ya-Sin",
  "verses": 83,
  "juz": [
   22,
   23
  ]
 },
 {
  "id": 37,
  "ar": "الصافات",
  "arTaschkil": "الصَّافَّات",
  "name": "As-Saffat",
  "de": "Die in Reih und Glied stehen",
  "verses": 182,
  "juz": [
   23
  ]
 },
 {
  "id": 38,
  "ar": "ص",
  "arTaschkil": "صٓ",
  "name": "Sad",
  "de": "Sad",
  "verses": 88,
  "juz": [
   23
  ]
 },
 {
  "id": 39,
  "ar": "الزمر",
  "arTaschkil": "الزُّمَر",
  "name": "Az-Zumar",
  "de": "Die Scharen",
  "verses": 75,
  "juz": [
   23,
   24
  ]
 },
 {
  "id": 40,
  "ar": "غافر",
  "arTaschkil": "غَافِر",
  "name": "Ghafir",
  "de": "Der Vergebende",
  "verses": 85,
  "juz": [
   24
  ]
 },
 {
  "id": 41,
  "ar": "فصلت",
  "arTaschkil": "فُصِّلَتْ",
  "name": "Fussilat",
  "de": "Auseinandergesetzt sind",
  "verses": 54,
  "juz": [
   24,
   25
  ]
 },
 {
  "id": 42,
  "ar": "الشورى",
  "arTaschkil": "الشُّورَىٰ",
  "name": "Ash-Shuraa",
  "de": "Die Beratung",
  "verses": 53,
  "juz": [
   25
  ]
 },
 {
  "id": 43,
  "ar": "الزخرف",
  "arTaschkil": "الزُّخْرُف",
  "name": "Az-Zukhruf",
  "de": "Der Prunk",
  "verses": 89,
  "juz": [
   25
  ]
 },
 {
  "id": 44,
  "ar": "الدخان",
  "arTaschkil": "الدُّخَان",
  "name": "Ad-Dukhan",
  "de": "Der Rauch",
  "verses": 59,
  "juz": [
   25
  ]
 },
 {
  "id": 45,
  "ar": "الجاثية",
  "arTaschkil": "الْجَاثِيَة",
  "name": "Al-Jathiyah",
  "de": "Das Knien",
  "verses": 37,
  "juz": [
   25
  ]
 },
 {
  "id": 46,
  "ar": "الأحقاف",
  "arTaschkil": "الْأَحْقَاف",
  "name": "Al-Ahqaf",
  "de": "Die Dünen",
  "verses": 35,
  "juz": [
   26
  ]
 },
 {
  "id": 47,
  "ar": "محمد",
  "arTaschkil": "مُحَمَّد",
  "name": "Muhammad",
  "de": "Mohammed",
  "verses": 38,
  "juz": [
   26
  ]
 },
 {
  "id": 48,
  "ar": "الفتح",
  "arTaschkil": "الْفَتْح",
  "name": "Al-Fath",
  "de": "Der Erfolg",
  "verses": 29,
  "juz": [
   26
  ]
 },
 {
  "id": 49,
  "ar": "الحجرات",
  "arTaschkil": "الْحُجُرَات",
  "name": "Al-Hujurat",
  "de": "Die Gemächer",
  "verses": 18,
  "juz": [
   26
  ]
 },
 {
  "id": 50,
  "ar": "ق",
  "arTaschkil": "قٓ",
  "name": "Qaf",
  "de": "Qaf",
  "verses": 45,
  "juz": [
   26
  ]
 },
 {
  "id": 51,
  "ar": "الذاريات",
  "arTaschkil": "الذَّارِيَات",
  "name": "Adh-Dhariyat",
  "de": "Das Aufwirbeln",
  "verses": 60,
  "juz": [
   26,
   27
  ]
 },
 {
  "id": 52,
  "ar": "الطور",
  "arTaschkil": "الطُّور",
  "name": "At-Tur",
  "de": "Der Berg",
  "verses": 49,
  "juz": [
   27
  ]
 },
 {
  "id": 53,
  "ar": "النجم",
  "arTaschkil": "النَّجْم",
  "name": "An-Najm",
  "de": "Der Stern",
  "verses": 62,
  "juz": [
   27
  ]
 },
 {
  "id": 54,
  "ar": "القمر",
  "arTaschkil": "الْقَمَر",
  "name": "Al-Qamar",
  "de": "Der Mond",
  "verses": 55,
  "juz": [
   27
  ]
 },
 {
  "id": 55,
  "ar": "الرحمن",
  "arTaschkil": "الرَّحْمَٰن",
  "name": "Ar-Rahman",
  "de": "Der Barmherzige",
  "verses": 78,
  "juz": [
   27
  ]
 },
 {
  "id": 56,
  "ar": "الواقعة",
  "arTaschkil": "الْوَاقِعَة",
  "name": "Al-Waqi'ah",
  "de": "Die hereinbrechende Katastrophe",
  "verses": 96,
  "juz": [
   27
  ]
 },
 {
  "id": 57,
  "ar": "الحديد",
  "arTaschkil": "الْحَدِيد",
  "name": "Al-Hadid",
  "de": "Das Eisen",
  "verses": 29,
  "juz": [
   27
  ]
 },
 {
  "id": 58,
  "ar": "المجادلة",
  "arTaschkil": "الْمُجَادِلَة",
  "name": "Al-Mujadila",
  "de": "Der Streit",
  "verses": 22,
  "juz": [
   28
  ]
 },
 {
  "id": 59,
  "ar": "الحشر",
  "arTaschkil": "الْحَشْر",
  "name": "Al-Hashr",
  "de": "Die Versammlung",
  "verses": 24,
  "juz": [
   28
  ]
 },
 {
  "id": 60,
  "ar": "الممتحنة",
  "arTaschkil": "الْمُمْتَحَنَة",
  "name": "Al-Mumtahanah",
  "de": "Die Prüfung",
  "verses": 13,
  "juz": [
   28
  ]
 },
 {
  "id": 61,
  "ar": "الصف",
  "arTaschkil": "الصَّفّ",
  "name": "As-Saf",
  "de": "Reih und Glied",
  "verses": 14,
  "juz": [
   28
  ]
 },
 {
  "id": 62,
  "ar": "الجمعة",
  "arTaschkil": "الْجُمُعَة",
  "name": "Al-Jumu'ah",
  "de": "Der Freitag",
  "verses": 11,
  "juz": [
   28
  ]
 },
 {
  "id": 63,
  "ar": "المنافقون",
  "arTaschkil": "الْمُنَافِقُون",
  "name": "Al-Munafiqun",
  "de": "Die Heuchler",
  "verses": 11,
  "juz": [
   28
  ]
 },
 {
  "id": 64,
  "ar": "التغابن",
  "arTaschkil": "التَّغَابُن",
  "name": "At-Taghabun",
  "de": "Die Übervorteilung",
  "verses": 18,
  "juz": [
   28
  ]
 },
 {
  "id": 65,
  "ar": "الطلاق",
  "arTaschkil": "الطَّلَاق",
  "name": "At-Talaq",
  "de": "Die Entlassung (Scheidung)",
  "verses": 12,
  "juz": [
   28
  ]
 },
 {
  "id": 66,
  "ar": "التحريم",
  "arTaschkil": "التَّحْرِيم",
  "name": "At-Tahrim",
  "de": "Das Verbot",
  "verses": 12,
  "juz": [
   28
  ]
 },
 {
  "id": 67,
  "ar": "الملك",
  "arTaschkil": "الْمُلْك",
  "name": "Al-Mulk",
  "de": "Die Königsherrschaft",
  "verses": 30,
  "juz": [
   29
  ]
 },
 {
  "id": 68,
  "ar": "القلم",
  "arTaschkil": "الْقَلَم",
  "name": "Al-Qalam",
  "de": "Die Schreibfeder",
  "verses": 52,
  "juz": [
   29
  ]
 },
 {
  "id": 69,
  "ar": "الحاقة",
  "arTaschkil": "الْحَاقَّة",
  "name": "Al-Haqqah",
  "de": "Die Wahrheit",
  "verses": 52,
  "juz": [
   29
  ]
 },
 {
  "id": 70,
  "ar": "المعارج",
  "arTaschkil": "الْمَعَارِج",
  "name": "Al-Ma'arij",
  "de": "Die Himmelsleiter",
  "verses": 44,
  "juz": [
   29
  ]
 },
 {
  "id": 71,
  "ar": "نوح",
  "arTaschkil": "نُوح",
  "name": "Nuh",
  "de": "Noah",
  "verses": 28,
  "juz": [
   29
  ]
 },
 {
  "id": 72,
  "ar": "الجن",
  "arTaschkil": "الْجِنّ",
  "name": "Al-Jinn",
  "de": "Die Jinn",
  "verses": 28,
  "juz": [
   29
  ]
 },
 {
  "id": 73,
  "ar": "المزمل",
  "arTaschkil": "الْمُزَّمِّل",
  "name": "Al-Muzzammil",
  "de": "Der sich eingehüllt hat",
  "verses": 20,
  "juz": [
   29
  ]
 },
 {
  "id": 74,
  "ar": "المدثر",
  "arTaschkil": "الْمُدَّثِّر",
  "name": "Al-Muddaththir",
  "de": "Der sich zugedeckt hat",
  "verses": 56,
  "juz": [
   29
  ]
 },
 {
  "id": 75,
  "ar": "القيامة",
  "arTaschkil": "الْقِيَامَة",
  "name": "Al-Qiyamah",
  "de": "Die Auferstehung",
  "verses": 40,
  "juz": [
   29
  ]
 },
 {
  "id": 76,
  "ar": "الانسان",
  "arTaschkil": "الْإِنسَان",
  "name": "Al-Insan",
  "de": "Der Mensch",
  "verses": 31,
  "juz": [
   29
  ]
 },
 {
  "id": 77,
  "ar": "المرسلات",
  "arTaschkil": "الْمُرْسَلَات",
  "name": "Al-Mursalat",
  "de": "Die Gesandten",
  "verses": 50,
  "juz": [
   29
  ]
 },
 {
  "id": 78,
  "ar": "النبإ",
  "arTaschkil": "النَّبَإ",
  "name": "An-Naba",
  "de": "Die Ankündigung",
  "verses": 40,
  "juz": [
   30
  ]
 },
 {
  "id": 79,
  "ar": "النازعات",
  "arTaschkil": "النَّازِعَات",
  "name": "An-Nazi'at",
  "de": "Die ausziehen",
  "verses": 46,
  "juz": [
   30
  ]
 },
 {
  "id": 80,
  "ar": "عبس",
  "arTaschkil": "عَبَس",
  "name": "'Abasa",
  "de": "Er zog die Stirne kraus",
  "verses": 42,
  "juz": [
   30
  ]
 },
 {
  "id": 81,
  "ar": "التكوير",
  "arTaschkil": "التَّكْوِير",
  "name": "At-Takwir",
  "de": "Das Einhüllen",
  "verses": 29,
  "juz": [
   30
  ]
 },
 {
  "id": 82,
  "ar": "الإنفطار",
  "arTaschkil": "الانفِطَار",
  "name": "Al-Infitar",
  "de": "Die Spaltung",
  "verses": 19,
  "juz": [
   30
  ]
 },
 {
  "id": 83,
  "ar": "المطففين",
  "arTaschkil": "الْمُطَفِّفِين",
  "name": "Al-Mutaffifin",
  "de": "Die Betrüger",
  "verses": 36,
  "juz": [
   30
  ]
 },
 {
  "id": 84,
  "ar": "الإنشقاق",
  "arTaschkil": "الانشِقَاق",
  "name": "Al-Inshiqaq",
  "de": "Das Zerbrechen",
  "verses": 25,
  "juz": [
   30
  ]
 },
 {
  "id": 85,
  "ar": "البروج",
  "arTaschkil": "الْبُرُوج",
  "name": "Al-Buruj",
  "de": "Die Türme",
  "verses": 22,
  "juz": [
   30
  ]
 },
 {
  "id": 86,
  "ar": "الطارق",
  "arTaschkil": "الطَّارِق",
  "name": "At-Tariq",
  "de": "Der bei Nacht kommende",
  "verses": 17,
  "juz": [
   30
  ]
 },
 {
  "id": 87,
  "ar": "الأعلى",
  "arTaschkil": "الْأَعْلَىٰ",
  "name": "Al-A'la",
  "de": "Der Allerhöchste",
  "verses": 19,
  "juz": [
   30
  ]
 },
 {
  "id": 88,
  "ar": "الغاشية",
  "arTaschkil": "الْغَاشِيَة",
  "name": "Al-Ghashiyah",
  "de": "Die zudecken wird",
  "verses": 26,
  "juz": [
   30
  ]
 },
 {
  "id": 89,
  "ar": "الفجر",
  "arTaschkil": "الْفَجْر",
  "name": "Al-Fajr",
  "de": "Die Morgendämmerung",
  "verses": 30,
  "juz": [
   30
  ]
 },
 {
  "id": 90,
  "ar": "البلد",
  "arTaschkil": "الْبَلَد",
  "name": "Al-Balad",
  "de": "Die Stadt",
  "verses": 20,
  "juz": [
   30
  ]
 },
 {
  "id": 91,
  "ar": "الشمس",
  "arTaschkil": "الشَّمْس",
  "name": "Ash-Shams",
  "de": "Die Sonne",
  "verses": 15,
  "juz": [
   30
  ]
 },
 {
  "id": 92,
  "ar": "الليل",
  "arTaschkil": "اللَّيْل",
  "name": "Al-Layl",
  "de": "Die Nacht",
  "verses": 21,
  "juz": [
   30
  ]
 },
 {
  "id": 93,
  "ar": "الضحى",
  "arTaschkil": "الضُّحَىٰ",
  "name": "Ad-Duhaa",
  "de": "Der Morgen",
  "verses": 11,
  "juz": [
   30
  ]
 },
 {
  "id": 94,
  "ar": "الشرح",
  "arTaschkil": "الشَّرْح",
  "name": "Ash-Sharh",
  "de": "Das Weiten",
  "verses": 8,
  "juz": [
   30
  ]
 },
 {
  "id": 95,
  "ar": "التين",
  "arTaschkil": "التِّين",
  "name": "At-Tin",
  "de": "Die Feigenbäume",
  "verses": 8,
  "juz": [
   30
  ]
 },
 {
  "id": 96,
  "ar": "العلق",
  "arTaschkil": "الْعَلَق",
  "name": "Al-'Alaq",
  "de": "Der Blutklumpen",
  "verses": 19,
  "juz": [
   30
  ]
 },
 {
  "id": 97,
  "ar": "القدر",
  "arTaschkil": "الْقَدْر",
  "name": "Al-Qadr",
  "de": "Die Bestimmung",
  "verses": 5,
  "juz": [
   30
  ]
 },
 {
  "id": 98,
  "ar": "البينة",
  "arTaschkil": "الْبَيِّنَة",
  "name": "Al-Bayyinah",
  "de": "Der klare Beweis",
  "verses": 8,
  "juz": [
   30
  ]
 },
 {
  "id": 99,
  "ar": "الزلزلة",
  "arTaschkil": "الزَّلْزَلَة",
  "name": "Az-Zalzalah",
  "de": "Das Beben",
  "verses": 8,
  "juz": [
   30
  ]
 },
 {
  "id": 100,
  "ar": "العاديات",
  "arTaschkil": "الْعَادِيَات",
  "name": "Al-'Adiyat",
  "de": "Das Laufen",
  "verses": 11,
  "juz": [
   30
  ]
 },
 {
  "id": 101,
  "ar": "القارعة",
  "arTaschkil": "الْقَارِعَة",
  "name": "Al-Qari'ah",
  "de": "Die Polternde",
  "verses": 11,
  "juz": [
   30
  ]
 },
 {
  "id": 102,
  "ar": "التكاثر",
  "arTaschkil": "التَّكَاثُر",
  "name": "At-Takathur",
  "de": "Die Sucht, mehr zu haben",
  "verses": 8,
  "juz": [
   30
  ]
 },
 {
  "id": 103,
  "ar": "العصر",
  "arTaschkil": "الْعَصْر",
  "name": "Al-'Asr",
  "de": "Der Nachmittag",
  "verses": 3,
  "juz": [
   30
  ]
 },
 {
  "id": 104,
  "ar": "الهمزة",
  "arTaschkil": "الْهُمَزَة",
  "name": "Al-Humazah",
  "de": "Der Stichler",
  "verses": 9,
  "juz": [
   30
  ]
 },
 {
  "id": 105,
  "ar": "الفيل",
  "arTaschkil": "الْفِيل",
  "name": "Al-Fil",
  "de": "Der Elefant",
  "verses": 5,
  "juz": [
   30
  ]
 },
 {
  "id": 106,
  "ar": "قريش",
  "arTaschkil": "قُرَيْش",
  "name": "Quraysh",
  "de": "Die Quraisch",
  "verses": 4,
  "juz": [
   30
  ]
 },
 {
  "id": 107,
  "ar": "الماعون",
  "arTaschkil": "الْمَاعُون",
  "name": "Al-Ma'un",
  "de": "Die Hilfeleistung",
  "verses": 7,
  "juz": [
   30
  ]
 },
 {
  "id": 108,
  "ar": "الكوثر",
  "arTaschkil": "الْكَوْثَر",
  "name": "Al-Kawthar",
  "de": "Die Fülle",
  "verses": 3,
  "juz": [
   30
  ]
 },
 {
  "id": 109,
  "ar": "الكافرون",
  "arTaschkil": "الْكَافِرُون",
  "name": "Al-Kafirun",
  "de": "Die Ungläubigen",
  "verses": 6,
  "juz": [
   30
  ]
 },
 {
  "id": 110,
  "ar": "النصر",
  "arTaschkil": "النَّصْر",
  "name": "An-Nasr",
  "de": "Die Hilfe",
  "verses": 3,
  "juz": [
   30
  ]
 },
 {
  "id": 111,
  "ar": "المسد",
  "arTaschkil": "الْمَسَد",
  "name": "Al-Masad",
  "de": "Der Palmfaserstrick",
  "verses": 5,
  "juz": [
   30
  ]
 },
 {
  "id": 112,
  "ar": "الإخلاص",
  "arTaschkil": "الْإِخْلَاص",
  "name": "Al-Ikhlas",
  "de": "Die Aufrichtigkeit",
  "verses": 4,
  "juz": [
   30
  ]
 },
 {
  "id": 113,
  "ar": "الفلق",
  "arTaschkil": "الْفَلَق",
  "name": "Al-Falaq",
  "de": "Das Frühlicht",
  "verses": 5,
  "juz": [
   30
  ]
 },
 {
  "id": 114,
  "ar": "الناس",
  "arTaschkil": "النَّاس",
  "name": "An-Nas",
  "de": "Die Menschheit",
  "verses": 6,
  "juz": [
   30
  ]
 }
];
