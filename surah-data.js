// Sure-Metadaten (Name, Verszahl). Der Verstext liegt seit dem 27./28.07.2026
// vollstaendig offline in quran-text.js; quran.com ist nur noch Rueckfallebene.
// Einzelne Verse ohne die 2,3-MB-Datei zu oeffnen: node werkzeuge/vers.mjs 2:255
const SURAH_DATA = [
 {
  "id": 1,
  "ar": "الفاتحة",
  "name": "Al-Fatihah",
  "verses": 7
 },
 {
  "id": 2,
  "ar": "البقرة",
  "name": "Al-Baqarah",
  "verses": 286
 },
 {
  "id": 3,
  "ar": "آل عمران",
  "name": "Ali 'Imran",
  "verses": 200
 },
 {
  "id": 4,
  "ar": "النساء",
  "name": "An-Nisa",
  "verses": 176
 },
 {
  "id": 5,
  "ar": "المائدة",
  "name": "Al-Ma'idah",
  "verses": 120
 },
 {
  "id": 6,
  "ar": "الأنعام",
  "name": "Al-An'am",
  "verses": 165
 },
 {
  "id": 7,
  "ar": "الأعراف",
  "name": "Al-A'raf",
  "verses": 206
 },
 {
  "id": 8,
  "ar": "الأنفال",
  "name": "Al-Anfal",
  "verses": 75
 },
 {
  "id": 9,
  "ar": "التوبة",
  "name": "At-Tawbah",
  "verses": 129
 },
 {
  "id": 10,
  "ar": "يونس",
  "name": "Yunus",
  "verses": 109
 },
 {
  "id": 11,
  "ar": "هود",
  "name": "Hud",
  "verses": 123
 },
 {
  "id": 12,
  "ar": "يوسف",
  "name": "Yusuf",
  "verses": 111
 },
 {
  "id": 13,
  "ar": "الرعد",
  "name": "Ar-Ra'd",
  "verses": 43
 },
 {
  "id": 14,
  "ar": "ابراهيم",
  "name": "Ibrahim",
  "verses": 52
 },
 {
  "id": 15,
  "ar": "الحجر",
  "name": "Al-Hijr",
  "verses": 99
 },
 {
  "id": 16,
  "ar": "النحل",
  "name": "An-Nahl",
  "verses": 128
 },
 {
  "id": 17,
  "ar": "الإسراء",
  "name": "Al-Isra",
  "verses": 111
 },
 {
  "id": 18,
  "ar": "الكهف",
  "name": "Al-Kahf",
  "verses": 110
 },
 {
  "id": 19,
  "ar": "مريم",
  "name": "Maryam",
  "verses": 98
 },
 {
  "id": 20,
  "ar": "طه",
  "name": "Taha",
  "verses": 135
 },
 {
  "id": 21,
  "ar": "الأنبياء",
  "name": "Al-Anbya",
  "verses": 112
 },
 {
  "id": 22,
  "ar": "الحج",
  "name": "Al-Hajj",
  "verses": 78
 },
 {
  "id": 23,
  "ar": "المؤمنون",
  "name": "Al-Mu'minun",
  "verses": 118
 },
 {
  "id": 24,
  "ar": "النور",
  "name": "An-Nur",
  "verses": 64
 },
 {
  "id": 25,
  "ar": "الفرقان",
  "name": "Al-Furqan",
  "verses": 77
 },
 {
  "id": 26,
  "ar": "الشعراء",
  "name": "Ash-Shu'ara",
  "verses": 227
 },
 {
  "id": 27,
  "ar": "النمل",
  "name": "An-Naml",
  "verses": 93
 },
 {
  "id": 28,
  "ar": "القصص",
  "name": "Al-Qasas",
  "verses": 88
 },
 {
  "id": 29,
  "ar": "العنكبوت",
  "name": "Al-'Ankabut",
  "verses": 69
 },
 {
  "id": 30,
  "ar": "الروم",
  "name": "Ar-Rum",
  "verses": 60
 },
 {
  "id": 31,
  "ar": "لقمان",
  "name": "Luqman",
  "verses": 34
 },
 {
  "id": 32,
  "ar": "السجدة",
  "name": "As-Sajdah",
  "verses": 30
 },
 {
  "id": 33,
  "ar": "الأحزاب",
  "name": "Al-Ahzab",
  "verses": 73
 },
 {
  "id": 34,
  "ar": "سبإ",
  "name": "Saba",
  "verses": 54
 },
 {
  "id": 35,
  "ar": "فاطر",
  "name": "Fatir",
  "verses": 45
 },
 {
  "id": 36,
  "ar": "يس",
  "name": "Ya-Sin",
  "verses": 83
 },
 {
  "id": 37,
  "ar": "الصافات",
  "name": "As-Saffat",
  "verses": 182
 },
 {
  "id": 38,
  "ar": "ص",
  "name": "Sad",
  "verses": 88
 },
 {
  "id": 39,
  "ar": "الزمر",
  "name": "Az-Zumar",
  "verses": 75
 },
 {
  "id": 40,
  "ar": "غافر",
  "name": "Ghafir",
  "verses": 85
 },
 {
  "id": 41,
  "ar": "فصلت",
  "name": "Fussilat",
  "verses": 54
 },
 {
  "id": 42,
  "ar": "الشورى",
  "name": "Ash-Shuraa",
  "verses": 53
 },
 {
  "id": 43,
  "ar": "الزخرف",
  "name": "Az-Zukhruf",
  "verses": 89
 },
 {
  "id": 44,
  "ar": "الدخان",
  "name": "Ad-Dukhan",
  "verses": 59
 },
 {
  "id": 45,
  "ar": "الجاثية",
  "name": "Al-Jathiyah",
  "verses": 37
 },
 {
  "id": 46,
  "ar": "الأحقاف",
  "name": "Al-Ahqaf",
  "verses": 35
 },
 {
  "id": 47,
  "ar": "محمد",
  "name": "Muhammad",
  "verses": 38
 },
 {
  "id": 48,
  "ar": "الفتح",
  "name": "Al-Fath",
  "verses": 29
 },
 {
  "id": 49,
  "ar": "الحجرات",
  "name": "Al-Hujurat",
  "verses": 18
 },
 {
  "id": 50,
  "ar": "ق",
  "name": "Qaf",
  "verses": 45
 },
 {
  "id": 51,
  "ar": "الذاريات",
  "name": "Adh-Dhariyat",
  "verses": 60
 },
 {
  "id": 52,
  "ar": "الطور",
  "name": "At-Tur",
  "verses": 49
 },
 {
  "id": 53,
  "ar": "النجم",
  "name": "An-Najm",
  "verses": 62
 },
 {
  "id": 54,
  "ar": "القمر",
  "name": "Al-Qamar",
  "verses": 55
 },
 {
  "id": 55,
  "ar": "الرحمن",
  "name": "Ar-Rahman",
  "verses": 78
 },
 {
  "id": 56,
  "ar": "الواقعة",
  "name": "Al-Waqi'ah",
  "verses": 96
 },
 {
  "id": 57,
  "ar": "الحديد",
  "name": "Al-Hadid",
  "verses": 29
 },
 {
  "id": 58,
  "ar": "المجادلة",
  "name": "Al-Mujadila",
  "verses": 22
 },
 {
  "id": 59,
  "ar": "الحشر",
  "name": "Al-Hashr",
  "verses": 24
 },
 {
  "id": 60,
  "ar": "الممتحنة",
  "name": "Al-Mumtahanah",
  "verses": 13
 },
 {
  "id": 61,
  "ar": "الصف",
  "name": "As-Saf",
  "verses": 14
 },
 {
  "id": 62,
  "ar": "الجمعة",
  "name": "Al-Jumu'ah",
  "verses": 11
 },
 {
  "id": 63,
  "ar": "المنافقون",
  "name": "Al-Munafiqun",
  "verses": 11
 },
 {
  "id": 64,
  "ar": "التغابن",
  "name": "At-Taghabun",
  "verses": 18
 },
 {
  "id": 65,
  "ar": "الطلاق",
  "name": "At-Talaq",
  "verses": 12
 },
 {
  "id": 66,
  "ar": "التحريم",
  "name": "At-Tahrim",
  "verses": 12
 },
 {
  "id": 67,
  "ar": "الملك",
  "name": "Al-Mulk",
  "verses": 30
 },
 {
  "id": 68,
  "ar": "القلم",
  "name": "Al-Qalam",
  "verses": 52
 },
 {
  "id": 69,
  "ar": "الحاقة",
  "name": "Al-Haqqah",
  "verses": 52
 },
 {
  "id": 70,
  "ar": "المعارج",
  "name": "Al-Ma'arij",
  "verses": 44
 },
 {
  "id": 71,
  "ar": "نوح",
  "name": "Nuh",
  "verses": 28
 },
 {
  "id": 72,
  "ar": "الجن",
  "name": "Al-Jinn",
  "verses": 28
 },
 {
  "id": 73,
  "ar": "المزمل",
  "name": "Al-Muzzammil",
  "verses": 20
 },
 {
  "id": 74,
  "ar": "المدثر",
  "name": "Al-Muddaththir",
  "verses": 56
 },
 {
  "id": 75,
  "ar": "القيامة",
  "name": "Al-Qiyamah",
  "verses": 40
 },
 {
  "id": 76,
  "ar": "الانسان",
  "name": "Al-Insan",
  "verses": 31
 },
 {
  "id": 77,
  "ar": "المرسلات",
  "name": "Al-Mursalat",
  "verses": 50
 },
 {
  "id": 78,
  "ar": "النبإ",
  "name": "An-Naba",
  "verses": 40
 },
 {
  "id": 79,
  "ar": "النازعات",
  "name": "An-Nazi'at",
  "verses": 46
 },
 {
  "id": 80,
  "ar": "عبس",
  "name": "'Abasa",
  "verses": 42
 },
 {
  "id": 81,
  "ar": "التكوير",
  "name": "At-Takwir",
  "verses": 29
 },
 {
  "id": 82,
  "ar": "الإنفطار",
  "name": "Al-Infitar",
  "verses": 19
 },
 {
  "id": 83,
  "ar": "المطففين",
  "name": "Al-Mutaffifin",
  "verses": 36
 },
 {
  "id": 84,
  "ar": "الإنشقاق",
  "name": "Al-Inshiqaq",
  "verses": 25
 },
 {
  "id": 85,
  "ar": "البروج",
  "name": "Al-Buruj",
  "verses": 22
 },
 {
  "id": 86,
  "ar": "الطارق",
  "name": "At-Tariq",
  "verses": 17
 },
 {
  "id": 87,
  "ar": "الأعلى",
  "name": "Al-A'la",
  "verses": 19
 },
 {
  "id": 88,
  "ar": "الغاشية",
  "name": "Al-Ghashiyah",
  "verses": 26
 },
 {
  "id": 89,
  "ar": "الفجر",
  "name": "Al-Fajr",
  "verses": 30
 },
 {
  "id": 90,
  "ar": "البلد",
  "name": "Al-Balad",
  "verses": 20
 },
 {
  "id": 91,
  "ar": "الشمس",
  "name": "Ash-Shams",
  "verses": 15
 },
 {
  "id": 92,
  "ar": "الليل",
  "name": "Al-Layl",
  "verses": 21
 },
 {
  "id": 93,
  "ar": "الضحى",
  "name": "Ad-Duhaa",
  "verses": 11
 },
 {
  "id": 94,
  "ar": "الشرح",
  "name": "Ash-Sharh",
  "verses": 8
 },
 {
  "id": 95,
  "ar": "التين",
  "name": "At-Tin",
  "verses": 8
 },
 {
  "id": 96,
  "ar": "العلق",
  "name": "Al-'Alaq",
  "verses": 19
 },
 {
  "id": 97,
  "ar": "القدر",
  "name": "Al-Qadr",
  "verses": 5
 },
 {
  "id": 98,
  "ar": "البينة",
  "name": "Al-Bayyinah",
  "verses": 8
 },
 {
  "id": 99,
  "ar": "الزلزلة",
  "name": "Az-Zalzalah",
  "verses": 8
 },
 {
  "id": 100,
  "ar": "العاديات",
  "name": "Al-'Adiyat",
  "verses": 11
 },
 {
  "id": 101,
  "ar": "القارعة",
  "name": "Al-Qari'ah",
  "verses": 11
 },
 {
  "id": 102,
  "ar": "التكاثر",
  "name": "At-Takathur",
  "verses": 8
 },
 {
  "id": 103,
  "ar": "العصر",
  "name": "Al-'Asr",
  "verses": 3
 },
 {
  "id": 104,
  "ar": "الهمزة",
  "name": "Al-Humazah",
  "verses": 9
 },
 {
  "id": 105,
  "ar": "الفيل",
  "name": "Al-Fil",
  "verses": 5
 },
 {
  "id": 106,
  "ar": "قريش",
  "name": "Quraysh",
  "verses": 4
 },
 {
  "id": 107,
  "ar": "الماعون",
  "name": "Al-Ma'un",
  "verses": 7
 },
 {
  "id": 108,
  "ar": "الكوثر",
  "name": "Al-Kawthar",
  "verses": 3
 },
 {
  "id": 109,
  "ar": "الكافرون",
  "name": "Al-Kafirun",
  "verses": 6
 },
 {
  "id": 110,
  "ar": "النصر",
  "name": "An-Nasr",
  "verses": 3
 },
 {
  "id": 111,
  "ar": "المسد",
  "name": "Al-Masad",
  "verses": 5
 },
 {
  "id": 112,
  "ar": "الإخلاص",
  "name": "Al-Ikhlas",
  "verses": 4
 },
 {
  "id": 113,
  "ar": "الفلق",
  "name": "Al-Falaq",
  "verses": 5
 },
 {
  "id": 114,
  "ar": "الناس",
  "name": "An-Nas",
  "verses": 6
 }
];
