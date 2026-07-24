/* ===================== QURAN FREQUENCY DATA ===================== */
/* Wie oft die Wurzel eines Vokabelworts im Quran vorkommt, berechnet aus dem
   Quranic Arabic Corpus (Kais Dukes, Uni Leeds, morphologische Annotation
   jedes Wortes im Quran inkl. Wurzel) - Quelle:
   https://github.com/mustafa0x/quran-morphology (basiert auf
   corpus.quran.com Morphology 0.4, GNU-Lizenz). Zaehlt eindeutige
   Wort-Vorkommen pro Wurzel; verses-Liste ist auf 15 Eintraege gekappt
   (in der App werden max. 10 angezeigt), count ist aber immer die echte
   Gesamtzahl. Wurzeln ohne Vorkommen im Quran (z.B. moderne Vokabeln wie
   'Kuehlschrank', Laenderamen) sind absichtlich NICHT enthalten - kein
   Eintrag bedeutet 'kommt nicht vor', nicht 'ungeprueft'. */

const QURAN_FREQ = {
 "بيت": {
  "count": 64,
  "verses": [
   {
    "sura": 2,
    "ayah": 125,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 127,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 158,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 189,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 3,
    "ayah": 49,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 96,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 97,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 154,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 4,
    "ayah": 15,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 81,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 100,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 108,
    "surahName": "An-Nisa"
   },
   {
    "sura": 5,
    "ayah": 2,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 5,
    "ayah": 97,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 7,
    "ayah": 4,
    "surahName": "Al-A'raf"
   }
  ]
 },
 "سجد": {
  "count": 73,
  "verses": [
   {
    "sura": 2,
    "ayah": 34,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 58,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 114,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 125,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 144,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 149,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 150,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 187,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 191,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 196,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 217,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 3,
    "ayah": 43,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 113,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 4,
    "ayah": 102,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 154,
    "surahName": "An-Nisa"
   }
  ]
 },
 "بوب": {
  "count": 18,
  "verses": [
   {
    "sura": 2,
    "ayah": 58,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 189,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 4,
    "ayah": 154,
    "surahName": "An-Nisa"
   },
   {
    "sura": 5,
    "ayah": 23,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 6,
    "ayah": 44,
    "surahName": "Al-An'am"
   },
   {
    "sura": 7,
    "ayah": 40,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 7,
    "ayah": 161,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 12,
    "ayah": 23,
    "surahName": "Yusuf"
   },
   {
    "sura": 12,
    "ayah": 25,
    "surahName": "Yusuf"
   },
   {
    "sura": 12,
    "ayah": 67,
    "surahName": "Yusuf"
   },
   {
    "sura": 13,
    "ayah": 23,
    "surahName": "Ar-Ra'd"
   },
   {
    "sura": 15,
    "ayah": 14,
    "surahName": "Al-Hijr"
   },
   {
    "sura": 15,
    "ayah": 44,
    "surahName": "Al-Hijr"
   },
   {
    "sura": 16,
    "ayah": 29,
    "surahName": "An-Nahl"
   },
   {
    "sura": 23,
    "ayah": 77,
    "surahName": "Al-Mu'minun"
   }
  ]
 },
 "كتب": {
  "count": 241,
  "verses": [
   {
    "sura": 2,
    "ayah": 2,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 44,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 53,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 78,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 79,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 85,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 87,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 89,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 101,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 105,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 109,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 113,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 121,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 129,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 144,
    "surahName": "Al-Baqarah"
   }
  ]
 },
 "قلم": {
  "count": 2,
  "verses": [
   {
    "sura": 3,
    "ayah": 44,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 31,
    "ayah": 27,
    "surahName": "Luqman"
   }
  ]
 },
 "فتح": {
  "count": 25,
  "verses": [
   {
    "sura": 2,
    "ayah": 76,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 89,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 4,
    "ayah": 141,
    "surahName": "An-Nisa"
   },
   {
    "sura": 5,
    "ayah": 52,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 6,
    "ayah": 44,
    "surahName": "Al-An'am"
   },
   {
    "sura": 6,
    "ayah": 59,
    "surahName": "Al-An'am"
   },
   {
    "sura": 7,
    "ayah": 40,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 7,
    "ayah": 89,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 7,
    "ayah": 96,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 8,
    "ayah": 19,
    "surahName": "Al-Anfal"
   },
   {
    "sura": 12,
    "ayah": 65,
    "surahName": "Yusuf"
   },
   {
    "sura": 14,
    "ayah": 15,
    "surahName": "Ibrahim"
   },
   {
    "sura": 15,
    "ayah": 14,
    "surahName": "Al-Hijr"
   },
   {
    "sura": 21,
    "ayah": 96,
    "surahName": "Al-Anbya"
   },
   {
    "sura": 23,
    "ayah": 77,
    "surahName": "Al-Mu'minun"
   }
  ]
 },
 "سرر": {
  "count": 25,
  "verses": [
   {
    "sura": 2,
    "ayah": 69,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 77,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 235,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 274,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 3,
    "ayah": 134,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 5,
    "ayah": 52,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 6,
    "ayah": 3,
    "surahName": "Al-An'am"
   },
   {
    "sura": 7,
    "ayah": 95,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 9,
    "ayah": 78,
    "surahName": "At-Tawbah"
   },
   {
    "sura": 10,
    "ayah": 54,
    "surahName": "Yunus"
   },
   {
    "sura": 11,
    "ayah": 5,
    "surahName": "Hud"
   },
   {
    "sura": 12,
    "ayah": 19,
    "surahName": "Yusuf"
   },
   {
    "sura": 12,
    "ayah": 77,
    "surahName": "Yusuf"
   },
   {
    "sura": 13,
    "ayah": 10,
    "surahName": "Ar-Ra'd"
   },
   {
    "sura": 13,
    "ayah": 22,
    "surahName": "Ar-Ra'd"
   }
  ]
 },
 "كرس": {
  "count": 1,
  "verses": [
   {
    "sura": 2,
    "ayah": 255,
    "surahName": "Al-Baqarah"
   }
  ]
 },
 "نجم": {
  "count": 5,
  "verses": [
   {
    "sura": 6,
    "ayah": 97,
    "surahName": "Al-An'am"
   },
   {
    "sura": 7,
    "ayah": 54,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 16,
    "ayah": 12,
    "surahName": "An-Nahl"
   },
   {
    "sura": 16,
    "ayah": 16,
    "surahName": "An-Nahl"
   },
   {
    "sura": 22,
    "ayah": 18,
    "surahName": "Al-Hajj"
   }
  ]
 },
 "ولد": {
  "count": 75,
  "verses": [
   {
    "sura": 2,
    "ayah": 83,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 116,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 180,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 215,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 233,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 3,
    "ayah": 10,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 47,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 116,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 4,
    "ayah": 7,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 11,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 12,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 33,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 36,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 75,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 98,
    "surahName": "An-Nisa"
   }
  ]
 },
 "طلب": {
  "count": 4,
  "verses": [
   {
    "sura": 7,
    "ayah": 54,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 18,
    "ayah": 41,
    "surahName": "Al-Kahf"
   },
   {
    "sura": 22,
    "ayah": 73,
    "surahName": "Al-Hajj"
   }
  ]
 },
 "رجل": {
  "count": 58,
  "verses": [
   {
    "sura": 2,
    "ayah": 228,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 239,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 282,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 4,
    "ayah": 1,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 7,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 12,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 32,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 34,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 75,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 98,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 176,
    "surahName": "An-Nisa"
   },
   {
    "sura": 5,
    "ayah": 6,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 5,
    "ayah": 23,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 5,
    "ayah": 33,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 5,
    "ayah": 66,
    "surahName": "Al-Ma'idah"
   }
  ]
 },
 "تجر": {
  "count": 5,
  "verses": [
   {
    "sura": 2,
    "ayah": 16,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 282,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 4,
    "ayah": 29,
    "surahName": "An-Nisa"
   },
   {
    "sura": 9,
    "ayah": 24,
    "surahName": "At-Tawbah"
   },
   {
    "sura": 24,
    "ayah": 37,
    "surahName": "An-Nur"
   }
  ]
 },
 "كلب": {
  "count": 6,
  "verses": [
   {
    "sura": 5,
    "ayah": 4,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 7,
    "ayah": 176,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 18,
    "ayah": 18,
    "surahName": "Al-Kahf"
   },
   {
    "sura": 18,
    "ayah": 22,
    "surahName": "Al-Kahf"
   }
  ]
 },
 "حمر": {
  "count": 3,
  "verses": [
   {
    "sura": 2,
    "ayah": 259,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 16,
    "ayah": 8,
    "surahName": "An-Nahl"
   },
   {
    "sura": 31,
    "ayah": 19,
    "surahName": "Luqman"
   }
  ]
 },
 "حصن": {
  "count": 15,
  "verses": [
   {
    "sura": 4,
    "ayah": 24,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 25,
    "surahName": "An-Nisa"
   },
   {
    "sura": 5,
    "ayah": 5,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 12,
    "ayah": 48,
    "surahName": "Yusuf"
   },
   {
    "sura": 21,
    "ayah": 80,
    "surahName": "Al-Anbya"
   },
   {
    "sura": 21,
    "ayah": 91,
    "surahName": "Al-Anbya"
   },
   {
    "sura": 24,
    "ayah": 4,
    "surahName": "An-Nur"
   },
   {
    "sura": 24,
    "ayah": 23,
    "surahName": "An-Nur"
   },
   {
    "sura": 24,
    "ayah": 33,
    "surahName": "An-Nur"
   }
  ]
 },
 "جمل": {
  "count": 8,
  "verses": [
   {
    "sura": 7,
    "ayah": 40,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 12,
    "ayah": 18,
    "surahName": "Yusuf"
   },
   {
    "sura": 12,
    "ayah": 83,
    "surahName": "Yusuf"
   },
   {
    "sura": 15,
    "ayah": 85,
    "surahName": "Al-Hijr"
   },
   {
    "sura": 16,
    "ayah": 6,
    "surahName": "An-Nahl"
   },
   {
    "sura": 25,
    "ayah": 32,
    "surahName": "Al-Furqan"
   },
   {
    "sura": 33,
    "ayah": 28,
    "surahName": "Al-Ahzab"
   },
   {
    "sura": 33,
    "ayah": 49,
    "surahName": "Al-Ahzab"
   }
  ]
 },
 "درس": {
  "count": 4,
  "verses": [
   {
    "sura": 3,
    "ayah": 79,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 6,
    "ayah": 105,
    "surahName": "Al-An'am"
   },
   {
    "sura": 6,
    "ayah": 156,
    "surahName": "Al-An'am"
   },
   {
    "sura": 7,
    "ayah": 169,
    "surahName": "Al-A'raf"
   }
  ]
 },
 "أمم": {
  "count": 95,
  "verses": [
   {
    "sura": 2,
    "ayah": 78,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 124,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 128,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 134,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 141,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 143,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 213,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 3,
    "ayah": 7,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 20,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 75,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 104,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 110,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 113,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 4,
    "ayah": 11,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 23,
    "surahName": "An-Nisa"
   }
  ]
 },
 "حجر": {
  "count": 16,
  "verses": [
   {
    "sura": 2,
    "ayah": 24,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 60,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 74,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 4,
    "ayah": 23,
    "surahName": "An-Nisa"
   },
   {
    "sura": 6,
    "ayah": 138,
    "surahName": "Al-An'am"
   },
   {
    "sura": 7,
    "ayah": 160,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 8,
    "ayah": 32,
    "surahName": "Al-Anfal"
   },
   {
    "sura": 11,
    "ayah": 82,
    "surahName": "Hud"
   },
   {
    "sura": 15,
    "ayah": 74,
    "surahName": "Al-Hijr"
   },
   {
    "sura": 15,
    "ayah": 80,
    "surahName": "Al-Hijr"
   },
   {
    "sura": 17,
    "ayah": 50,
    "surahName": "Al-Isra"
   },
   {
    "sura": 25,
    "ayah": 22,
    "surahName": "Al-Furqan"
   },
   {
    "sura": 25,
    "ayah": 53,
    "surahName": "Al-Furqan"
   }
  ]
 },
 "سكر": {
  "count": 6,
  "verses": [
   {
    "sura": 4,
    "ayah": 43,
    "surahName": "An-Nisa"
   },
   {
    "sura": 15,
    "ayah": 15,
    "surahName": "Al-Hijr"
   },
   {
    "sura": 15,
    "ayah": 72,
    "surahName": "Al-Hijr"
   },
   {
    "sura": 16,
    "ayah": 67,
    "surahName": "An-Nahl"
   },
   {
    "sura": 22,
    "ayah": 2,
    "surahName": "Al-Hajj"
   }
  ]
 },
 "لبن": {
  "count": 1,
  "verses": [
   {
    "sura": 16,
    "ayah": 66,
    "surahName": "An-Nahl"
   }
  ]
 },
 "غني": {
  "count": 40,
  "verses": [
   {
    "sura": 2,
    "ayah": 263,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 267,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 273,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 3,
    "ayah": 10,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 97,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 116,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 181,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 4,
    "ayah": 6,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 130,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 131,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 135,
    "surahName": "An-Nisa"
   },
   {
    "sura": 6,
    "ayah": 133,
    "surahName": "Al-An'am"
   },
   {
    "sura": 7,
    "ayah": 48,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 7,
    "ayah": 92,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 8,
    "ayah": 19,
    "surahName": "Al-Anfal"
   }
  ]
 },
 "فقر": {
  "count": 10,
  "verses": [
   {
    "sura": 2,
    "ayah": 268,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 271,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 273,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 3,
    "ayah": 181,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 4,
    "ayah": 6,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 135,
    "surahName": "An-Nisa"
   },
   {
    "sura": 9,
    "ayah": 60,
    "surahName": "At-Tawbah"
   },
   {
    "sura": 22,
    "ayah": 28,
    "surahName": "Al-Hajj"
   },
   {
    "sura": 24,
    "ayah": 32,
    "surahName": "An-Nur"
   },
   {
    "sura": 28,
    "ayah": 24,
    "surahName": "Al-Qasas"
   }
  ]
 },
 "طول": {
  "count": 6,
  "verses": [
   {
    "sura": 4,
    "ayah": 25,
    "surahName": "An-Nisa"
   },
   {
    "sura": 9,
    "ayah": 86,
    "surahName": "At-Tawbah"
   },
   {
    "sura": 17,
    "ayah": 37,
    "surahName": "Al-Isra"
   },
   {
    "sura": 20,
    "ayah": 86,
    "surahName": "Taha"
   },
   {
    "sura": 21,
    "ayah": 44,
    "surahName": "Al-Anbya"
   },
   {
    "sura": 28,
    "ayah": 45,
    "surahName": "Al-Qasas"
   }
  ]
 },
 "قصر": {
  "count": 5,
  "verses": [
   {
    "sura": 4,
    "ayah": 101,
    "surahName": "An-Nisa"
   },
   {
    "sura": 7,
    "ayah": 74,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 7,
    "ayah": 202,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 22,
    "ayah": 45,
    "surahName": "Al-Hajj"
   },
   {
    "sura": 25,
    "ayah": 10,
    "surahName": "Al-Furqan"
   }
  ]
 },
 "برد": {
  "count": 2,
  "verses": [
   {
    "sura": 21,
    "ayah": 69,
    "surahName": "Al-Anbya"
   },
   {
    "sura": 24,
    "ayah": 43,
    "surahName": "An-Nur"
   }
  ]
 },
 "حرر": {
  "count": 11,
  "verses": [
   {
    "sura": 2,
    "ayah": 178,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 3,
    "ayah": 35,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 4,
    "ayah": 92,
    "surahName": "An-Nisa"
   },
   {
    "sura": 5,
    "ayah": 89,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 9,
    "ayah": 81,
    "surahName": "At-Tawbah"
   },
   {
    "sura": 16,
    "ayah": 81,
    "surahName": "An-Nahl"
   },
   {
    "sura": 22,
    "ayah": 23,
    "surahName": "Al-Hajj"
   }
  ]
 },
 "وقف": {
  "count": 3,
  "verses": [
   {
    "sura": 6,
    "ayah": 27,
    "surahName": "Al-An'am"
   },
   {
    "sura": 6,
    "ayah": 30,
    "surahName": "Al-An'am"
   },
   {
    "sura": 34,
    "ayah": 31,
    "surahName": "Saba"
   }
  ]
 },
 "جدد": {
  "count": 6,
  "verses": [
   {
    "sura": 13,
    "ayah": 5,
    "surahName": "Ar-Ra'd"
   },
   {
    "sura": 14,
    "ayah": 19,
    "surahName": "Ibrahim"
   },
   {
    "sura": 17,
    "ayah": 49,
    "surahName": "Al-Isra"
   },
   {
    "sura": 17,
    "ayah": 98,
    "surahName": "Al-Isra"
   },
   {
    "sura": 32,
    "ayah": 10,
    "surahName": "As-Sajdah"
   },
   {
    "sura": 34,
    "ayah": 7,
    "surahName": "Saba"
   }
  ]
 },
 "قدم": {
  "count": 26,
  "verses": [
   {
    "sura": 2,
    "ayah": 95,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 110,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 223,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 250,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 3,
    "ayah": 147,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 182,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 4,
    "ayah": 62,
    "surahName": "An-Nisa"
   },
   {
    "sura": 5,
    "ayah": 80,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 7,
    "ayah": 34,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 8,
    "ayah": 11,
    "surahName": "Al-Anfal"
   },
   {
    "sura": 8,
    "ayah": 51,
    "surahName": "Al-Anfal"
   },
   {
    "sura": 10,
    "ayah": 2,
    "surahName": "Yunus"
   },
   {
    "sura": 10,
    "ayah": 49,
    "surahName": "Yunus"
   },
   {
    "sura": 11,
    "ayah": 98,
    "surahName": "Hud"
   },
   {
    "sura": 12,
    "ayah": 48,
    "surahName": "Yusuf"
   }
  ]
 },
 "قرب": {
  "count": 68,
  "verses": [
   {
    "sura": 2,
    "ayah": 35,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 83,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 177,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 180,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 186,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 187,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 214,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 215,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 222,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 237,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 3,
    "ayah": 45,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 167,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 183,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 4,
    "ayah": 7,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 8,
    "surahName": "An-Nisa"
   }
  ]
 },
 "بعد": {
  "count": 185,
  "verses": [
   {
    "sura": 2,
    "ayah": 27,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 51,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 52,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 56,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 64,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 74,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 75,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 87,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 92,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 109,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 120,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 133,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 145,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 159,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 164,
    "surahName": "Al-Baqarah"
   }
  ]
 },
 "صغر": {
  "count": 12,
  "verses": [
   {
    "sura": 2,
    "ayah": 282,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 6,
    "ayah": 124,
    "surahName": "Al-An'am"
   },
   {
    "sura": 7,
    "ayah": 13,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 7,
    "ayah": 119,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 9,
    "ayah": 29,
    "surahName": "At-Tawbah"
   },
   {
    "sura": 9,
    "ayah": 121,
    "surahName": "At-Tawbah"
   },
   {
    "sura": 10,
    "ayah": 61,
    "surahName": "Yunus"
   },
   {
    "sura": 12,
    "ayah": 32,
    "surahName": "Yusuf"
   },
   {
    "sura": 17,
    "ayah": 24,
    "surahName": "Al-Isra"
   },
   {
    "sura": 18,
    "ayah": 49,
    "surahName": "Al-Kahf"
   },
   {
    "sura": 27,
    "ayah": 37,
    "surahName": "An-Naml"
   },
   {
    "sura": 34,
    "ayah": 3,
    "surahName": "Saba"
   }
  ]
 },
 "كبر": {
  "count": 106,
  "verses": [
   {
    "sura": 2,
    "ayah": 34,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 45,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 87,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 143,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 185,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 217,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 219,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 266,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 282,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 3,
    "ayah": 40,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 118,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 4,
    "ayah": 2,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 6,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 31,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 34,
    "surahName": "An-Nisa"
   }
  ]
 },
 "خفف": {
  "count": 13,
  "verses": [
   {
    "sura": 2,
    "ayah": 86,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 162,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 178,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 3,
    "ayah": 88,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 4,
    "ayah": 28,
    "surahName": "An-Nisa"
   },
   {
    "sura": 7,
    "ayah": 9,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 7,
    "ayah": 189,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 8,
    "ayah": 66,
    "surahName": "Al-Anfal"
   },
   {
    "sura": 9,
    "ayah": 41,
    "surahName": "At-Tawbah"
   },
   {
    "sura": 16,
    "ayah": 80,
    "surahName": "An-Nahl"
   },
   {
    "sura": 16,
    "ayah": 85,
    "surahName": "An-Nahl"
   },
   {
    "sura": 23,
    "ayah": 103,
    "surahName": "Al-Mu'minun"
   },
   {
    "sura": 30,
    "ayah": 60,
    "surahName": "Ar-Rum"
   }
  ]
 },
 "ثقل": {
  "count": 18,
  "verses": [
   {
    "sura": 4,
    "ayah": 40,
    "surahName": "An-Nisa"
   },
   {
    "sura": 7,
    "ayah": 8,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 7,
    "ayah": 57,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 7,
    "ayah": 187,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 7,
    "ayah": 189,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 9,
    "ayah": 38,
    "surahName": "At-Tawbah"
   },
   {
    "sura": 9,
    "ayah": 41,
    "surahName": "At-Tawbah"
   },
   {
    "sura": 10,
    "ayah": 61,
    "surahName": "Yunus"
   },
   {
    "sura": 13,
    "ayah": 12,
    "surahName": "Ar-Ra'd"
   },
   {
    "sura": 16,
    "ayah": 7,
    "surahName": "An-Nahl"
   },
   {
    "sura": 21,
    "ayah": 47,
    "surahName": "Al-Anbya"
   },
   {
    "sura": 23,
    "ayah": 102,
    "surahName": "Al-Mu'minun"
   },
   {
    "sura": 29,
    "ayah": 13,
    "surahName": "Al-'Ankabut"
   },
   {
    "sura": 31,
    "ayah": 16,
    "surahName": "Luqman"
   },
   {
    "sura": 34,
    "ayah": 3,
    "surahName": "Saba"
   }
  ]
 },
 "ورق": {
  "count": 4,
  "verses": [
   {
    "sura": 6,
    "ayah": 59,
    "surahName": "Al-An'am"
   },
   {
    "sura": 7,
    "ayah": 22,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 18,
    "ayah": 19,
    "surahName": "Al-Kahf"
   },
   {
    "sura": 20,
    "ayah": 121,
    "surahName": "Taha"
   }
  ]
 },
 "موه": {
  "count": 41,
  "verses": [
   {
    "sura": 2,
    "ayah": 22,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 74,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 164,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 4,
    "ayah": 43,
    "surahName": "An-Nisa"
   },
   {
    "sura": 5,
    "ayah": 6,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 6,
    "ayah": 99,
    "surahName": "Al-An'am"
   },
   {
    "sura": 7,
    "ayah": 50,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 7,
    "ayah": 57,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 8,
    "ayah": 11,
    "surahName": "Al-Anfal"
   },
   {
    "sura": 10,
    "ayah": 24,
    "surahName": "Yunus"
   },
   {
    "sura": 11,
    "ayah": 7,
    "surahName": "Hud"
   },
   {
    "sura": 11,
    "ayah": 43,
    "surahName": "Hud"
   },
   {
    "sura": 11,
    "ayah": 44,
    "surahName": "Hud"
   },
   {
    "sura": 13,
    "ayah": 4,
    "surahName": "Ar-Ra'd"
   },
   {
    "sura": 13,
    "ayah": 14,
    "surahName": "Ar-Ra'd"
   }
  ]
 },
 "مرض": {
  "count": 19,
  "verses": [
   {
    "sura": 2,
    "ayah": 10,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 184,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 185,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 196,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 4,
    "ayah": 43,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 102,
    "surahName": "An-Nisa"
   },
   {
    "sura": 5,
    "ayah": 6,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 5,
    "ayah": 52,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 8,
    "ayah": 49,
    "surahName": "Al-Anfal"
   },
   {
    "sura": 9,
    "ayah": 91,
    "surahName": "At-Tawbah"
   },
   {
    "sura": 9,
    "ayah": 125,
    "surahName": "At-Tawbah"
   },
   {
    "sura": 22,
    "ayah": 53,
    "surahName": "Al-Hajj"
   },
   {
    "sura": 24,
    "ayah": 50,
    "surahName": "An-Nur"
   },
   {
    "sura": 24,
    "ayah": 61,
    "surahName": "An-Nur"
   },
   {
    "sura": 26,
    "ayah": 80,
    "surahName": "Ash-Shu'ara"
   }
  ]
 },
 "سوق": {
  "count": 7,
  "verses": [
   {
    "sura": 7,
    "ayah": 57,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 8,
    "ayah": 6,
    "surahName": "Al-Anfal"
   },
   {
    "sura": 19,
    "ayah": 86,
    "surahName": "Maryam"
   },
   {
    "sura": 25,
    "ayah": 7,
    "surahName": "Al-Furqan"
   },
   {
    "sura": 25,
    "ayah": 20,
    "surahName": "Al-Furqan"
   },
   {
    "sura": 27,
    "ayah": 44,
    "surahName": "An-Naml"
   },
   {
    "sura": 32,
    "ayah": 27,
    "surahName": "As-Sajdah"
   }
  ]
 },
 "جمع": {
  "count": 91,
  "verses": [
   {
    "sura": 2,
    "ayah": 29,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 38,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 148,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 161,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 165,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 3,
    "ayah": 9,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 25,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 87,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 103,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 155,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 157,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 166,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 173,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 4,
    "ayah": 23,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 71,
    "surahName": "An-Nisa"
   }
  ]
 },
 "دور": {
  "count": 43,
  "verses": [
   {
    "sura": 2,
    "ayah": 84,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 85,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 94,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 243,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 246,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 282,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 3,
    "ayah": 195,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 4,
    "ayah": 66,
    "surahName": "An-Nisa"
   },
   {
    "sura": 5,
    "ayah": 52,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 6,
    "ayah": 32,
    "surahName": "Al-An'am"
   },
   {
    "sura": 6,
    "ayah": 127,
    "surahName": "Al-An'am"
   },
   {
    "sura": 6,
    "ayah": 135,
    "surahName": "Al-An'am"
   },
   {
    "sura": 7,
    "ayah": 78,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 7,
    "ayah": 91,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 7,
    "ayah": 145,
    "surahName": "Al-A'raf"
   }
  ]
 },
 "غرف": {
  "count": 4,
  "verses": [
   {
    "sura": 2,
    "ayah": 249,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 25,
    "ayah": 75,
    "surahName": "Al-Furqan"
   },
   {
    "sura": 29,
    "ayah": 58,
    "surahName": "Al-'Ankabut"
   }
  ]
 },
 "حمم": {
  "count": 4,
  "verses": [
   {
    "sura": 6,
    "ayah": 70,
    "surahName": "Al-An'am"
   },
   {
    "sura": 10,
    "ayah": 4,
    "surahName": "Yunus"
   },
   {
    "sura": 22,
    "ayah": 19,
    "surahName": "Al-Hajj"
   },
   {
    "sura": 26,
    "ayah": 101,
    "surahName": "Ash-Shu'ara"
   }
  ]
 },
 "سمو": {
  "count": 238,
  "verses": [
   {
    "sura": 1,
    "ayah": 1,
    "surahName": "Al-Fatihah"
   },
   {
    "sura": 2,
    "ayah": 19,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 22,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 29,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 31,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 33,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 59,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 107,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 114,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 116,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 117,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 144,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 164,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 255,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 282,
    "surahName": "Al-Baqarah"
   }
  ]
 },
 "فصل": {
  "count": 29,
  "verses": [
   {
    "sura": 2,
    "ayah": 233,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 249,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 6,
    "ayah": 55,
    "surahName": "Al-An'am"
   },
   {
    "sura": 6,
    "ayah": 57,
    "surahName": "Al-An'am"
   },
   {
    "sura": 6,
    "ayah": 97,
    "surahName": "Al-An'am"
   },
   {
    "sura": 6,
    "ayah": 98,
    "surahName": "Al-An'am"
   },
   {
    "sura": 6,
    "ayah": 114,
    "surahName": "Al-An'am"
   },
   {
    "sura": 6,
    "ayah": 119,
    "surahName": "Al-An'am"
   },
   {
    "sura": 6,
    "ayah": 126,
    "surahName": "Al-An'am"
   },
   {
    "sura": 6,
    "ayah": 154,
    "surahName": "Al-An'am"
   },
   {
    "sura": 7,
    "ayah": 32,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 7,
    "ayah": 52,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 7,
    "ayah": 133,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 7,
    "ayah": 145,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 7,
    "ayah": 174,
    "surahName": "Al-A'raf"
   }
  ]
 },
 "رسل": {
  "count": 354,
  "verses": [
   {
    "sura": 2,
    "ayah": 87,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 98,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 101,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 108,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 119,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 129,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 143,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 151,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 214,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 252,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 253,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 279,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 285,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 3,
    "ayah": 32,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 49,
    "surahName": "Ali 'Imran"
   }
  ]
 },
 "عمم": {
  "count": 5,
  "verses": [
   {
    "sura": 4,
    "ayah": 23,
    "surahName": "An-Nisa"
   },
   {
    "sura": 24,
    "ayah": 61,
    "surahName": "An-Nur"
   },
   {
    "sura": 33,
    "ayah": 50,
    "surahName": "Al-Ahzab"
   }
  ]
 },
 "بني": {
  "count": 141,
  "verses": [
   {
    "sura": 2,
    "ayah": 22,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 40,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 47,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 49,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 83,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 87,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 122,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 132,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 133,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 146,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 177,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 211,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 215,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 246,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 253,
    "surahName": "Al-Baqarah"
   }
  ]
 },
 "شرع": {
  "count": 2,
  "verses": [
   {
    "sura": 5,
    "ayah": 48,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 7,
    "ayah": 163,
    "surahName": "Al-A'raf"
   }
  ]
 },
 "سير": {
  "count": 19,
  "verses": [
   {
    "sura": 3,
    "ayah": 137,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 5,
    "ayah": 96,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 6,
    "ayah": 11,
    "surahName": "Al-An'am"
   },
   {
    "sura": 10,
    "ayah": 22,
    "surahName": "Yunus"
   },
   {
    "sura": 12,
    "ayah": 10,
    "surahName": "Yusuf"
   },
   {
    "sura": 12,
    "ayah": 19,
    "surahName": "Yusuf"
   },
   {
    "sura": 12,
    "ayah": 109,
    "surahName": "Yusuf"
   },
   {
    "sura": 13,
    "ayah": 31,
    "surahName": "Ar-Ra'd"
   },
   {
    "sura": 16,
    "ayah": 36,
    "surahName": "An-Nahl"
   },
   {
    "sura": 18,
    "ayah": 47,
    "surahName": "Al-Kahf"
   },
   {
    "sura": 20,
    "ayah": 21,
    "surahName": "Taha"
   },
   {
    "sura": 22,
    "ayah": 46,
    "surahName": "Al-Hajj"
   },
   {
    "sura": 27,
    "ayah": 69,
    "surahName": "An-Naml"
   },
   {
    "sura": 28,
    "ayah": 29,
    "surahName": "Al-Qasas"
   },
   {
    "sura": 29,
    "ayah": 20,
    "surahName": "Al-'Ankabut"
   }
  ]
 },
 "كعب": {
  "count": 3,
  "verses": [
   {
    "sura": 5,
    "ayah": 6,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 5,
    "ayah": 95,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 5,
    "ayah": 97,
    "surahName": "Al-Ma'idah"
   }
  ]
 },
 "خول": {
  "count": 6,
  "verses": [
   {
    "sura": 4,
    "ayah": 23,
    "surahName": "An-Nisa"
   },
   {
    "sura": 6,
    "ayah": 94,
    "surahName": "Al-An'am"
   },
   {
    "sura": 24,
    "ayah": 61,
    "surahName": "An-Nur"
   },
   {
    "sura": 33,
    "ayah": 50,
    "surahName": "Al-Ahzab"
   }
  ]
 },
 "غلق": {
  "count": 1,
  "verses": [
   {
    "sura": 12,
    "ayah": 23,
    "surahName": "Yusuf"
   }
  ]
 },
 "حقب": {
  "count": 1,
  "verses": [
   {
    "sura": 18,
    "ayah": 60,
    "surahName": "Al-Kahf"
   }
  ]
 },
 "كوي": {
  "count": 1,
  "verses": [
   {
    "sura": 9,
    "ayah": 35,
    "surahName": "At-Tawbah"
   }
  ]
 },
 "بقر": {
  "count": 9,
  "verses": [
   {
    "sura": 2,
    "ayah": 67,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 68,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 69,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 70,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 71,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 6,
    "ayah": 144,
    "surahName": "Al-An'am"
   },
   {
    "sura": 6,
    "ayah": 146,
    "surahName": "Al-An'am"
   },
   {
    "sura": 12,
    "ayah": 43,
    "surahName": "Yusuf"
   },
   {
    "sura": 12,
    "ayah": 46,
    "surahName": "Yusuf"
   }
  ]
 },
 "درج": {
  "count": 14,
  "verses": [
   {
    "sura": 2,
    "ayah": 228,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 253,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 3,
    "ayah": 163,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 4,
    "ayah": 95,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 96,
    "surahName": "An-Nisa"
   },
   {
    "sura": 6,
    "ayah": 83,
    "surahName": "Al-An'am"
   },
   {
    "sura": 6,
    "ayah": 132,
    "surahName": "Al-An'am"
   },
   {
    "sura": 6,
    "ayah": 165,
    "surahName": "Al-An'am"
   },
   {
    "sura": 7,
    "ayah": 182,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 8,
    "ayah": 4,
    "surahName": "Al-Anfal"
   },
   {
    "sura": 9,
    "ayah": 20,
    "surahName": "At-Tawbah"
   },
   {
    "sura": 12,
    "ayah": 76,
    "surahName": "Yusuf"
   },
   {
    "sura": 17,
    "ayah": 21,
    "surahName": "Al-Isra"
   },
   {
    "sura": 20,
    "ayah": 75,
    "surahName": "Taha"
   }
  ]
 },
 "فلح": {
  "count": 34,
  "verses": [
   {
    "sura": 2,
    "ayah": 5,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 189,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 3,
    "ayah": 104,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 130,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 200,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 5,
    "ayah": 35,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 5,
    "ayah": 90,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 5,
    "ayah": 100,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 6,
    "ayah": 21,
    "surahName": "Al-An'am"
   },
   {
    "sura": 6,
    "ayah": 135,
    "surahName": "Al-An'am"
   },
   {
    "sura": 7,
    "ayah": 8,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 7,
    "ayah": 69,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 7,
    "ayah": 157,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 8,
    "ayah": 45,
    "surahName": "Al-Anfal"
   },
   {
    "sura": 9,
    "ayah": 88,
    "surahName": "At-Tawbah"
   }
  ]
 },
 "أبو": {
  "count": 95,
  "verses": [
   {
    "sura": 2,
    "ayah": 133,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 170,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 200,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 4,
    "ayah": 11,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 22,
    "surahName": "An-Nisa"
   },
   {
    "sura": 5,
    "ayah": 104,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 6,
    "ayah": 74,
    "surahName": "Al-An'am"
   },
   {
    "sura": 6,
    "ayah": 87,
    "surahName": "Al-An'am"
   },
   {
    "sura": 6,
    "ayah": 91,
    "surahName": "Al-An'am"
   },
   {
    "sura": 6,
    "ayah": 148,
    "surahName": "Al-An'am"
   },
   {
    "sura": 7,
    "ayah": 27,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 7,
    "ayah": 28,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 7,
    "ayah": 70,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 7,
    "ayah": 71,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 7,
    "ayah": 95,
    "surahName": "Al-A'raf"
   }
  ]
 },
 "غرب": {
  "count": 14,
  "verses": [
   {
    "sura": 2,
    "ayah": 115,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 142,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 177,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 258,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 5,
    "ayah": 31,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 7,
    "ayah": 137,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 18,
    "ayah": 17,
    "surahName": "Al-Kahf"
   },
   {
    "sura": 18,
    "ayah": 86,
    "surahName": "Al-Kahf"
   },
   {
    "sura": 20,
    "ayah": 130,
    "surahName": "Taha"
   },
   {
    "sura": 24,
    "ayah": 35,
    "surahName": "An-Nur"
   },
   {
    "sura": 26,
    "ayah": 28,
    "surahName": "Ash-Shu'ara"
   },
   {
    "sura": 28,
    "ayah": 44,
    "surahName": "Al-Qasas"
   }
  ]
 },
 "أنف": {
  "count": 2,
  "verses": [
   {
    "sura": 5,
    "ayah": 45,
    "surahName": "Al-Ma'idah"
   }
  ]
 },
 "قدر": {
  "count": 71,
  "verses": [
   {
    "sura": 2,
    "ayah": 20,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 106,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 109,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 148,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 236,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 259,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 264,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 284,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 3,
    "ayah": 26,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 29,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 165,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 189,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 4,
    "ayah": 133,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 149,
    "surahName": "An-Nisa"
   },
   {
    "sura": 5,
    "ayah": 17,
    "surahName": "Al-Ma'idah"
   }
  ]
 },
 "أذن": {
  "count": 84,
  "verses": [
   {
    "sura": 2,
    "ayah": 19,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 97,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 102,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 213,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 221,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 249,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 251,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 255,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 279,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 3,
    "ayah": 49,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 145,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 152,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 166,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 4,
    "ayah": 25,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 64,
    "surahName": "An-Nisa"
   }
  ]
 },
 "عين": {
  "count": 37,
  "verses": [
   {
    "sura": 2,
    "ayah": 60,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 3,
    "ayah": 13,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 5,
    "ayah": 45,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 5,
    "ayah": 83,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 7,
    "ayah": 116,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 7,
    "ayah": 160,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 7,
    "ayah": 179,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 7,
    "ayah": 195,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 8,
    "ayah": 44,
    "surahName": "Al-Anfal"
   },
   {
    "sura": 9,
    "ayah": 92,
    "surahName": "At-Tawbah"
   },
   {
    "sura": 11,
    "ayah": 31,
    "surahName": "Hud"
   },
   {
    "sura": 11,
    "ayah": 37,
    "surahName": "Hud"
   },
   {
    "sura": 12,
    "ayah": 84,
    "surahName": "Yusuf"
   },
   {
    "sura": 15,
    "ayah": 45,
    "surahName": "Al-Hijr"
   },
   {
    "sura": 15,
    "ayah": 88,
    "surahName": "Al-Hijr"
   }
  ]
 },
 "يدي": {
  "count": 80,
  "verses": [
   {
    "sura": 2,
    "ayah": 66,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 79,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 95,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 97,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 195,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 237,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 249,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 255,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 3,
    "ayah": 3,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 26,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 50,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 73,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 182,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 4,
    "ayah": 43,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 62,
    "surahName": "An-Nisa"
   }
  ]
 },
 "سرع": {
  "count": 20,
  "verses": [
   {
    "sura": 2,
    "ayah": 202,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 3,
    "ayah": 19,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 114,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 133,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 176,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 199,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 5,
    "ayah": 4,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 5,
    "ayah": 41,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 5,
    "ayah": 52,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 5,
    "ayah": 62,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 6,
    "ayah": 62,
    "surahName": "Al-An'am"
   },
   {
    "sura": 6,
    "ayah": 165,
    "surahName": "Al-An'am"
   },
   {
    "sura": 7,
    "ayah": 167,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 10,
    "ayah": 21,
    "surahName": "Yunus"
   },
   {
    "sura": 13,
    "ayah": 41,
    "surahName": "Ar-Ra'd"
   }
  ]
 },
 "شرق": {
  "count": 10,
  "verses": [
   {
    "sura": 2,
    "ayah": 115,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 142,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 177,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 258,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 7,
    "ayah": 137,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 15,
    "ayah": 73,
    "surahName": "Al-Hijr"
   },
   {
    "sura": 19,
    "ayah": 16,
    "surahName": "Maryam"
   },
   {
    "sura": 24,
    "ayah": 35,
    "surahName": "An-Nur"
   },
   {
    "sura": 26,
    "ayah": 28,
    "surahName": "Ash-Shu'ara"
   },
   {
    "sura": 26,
    "ayah": 60,
    "surahName": "Ash-Shu'ara"
   }
  ]
 },
 "نوق": {
  "count": 5,
  "verses": [
   {
    "sura": 7,
    "ayah": 73,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 7,
    "ayah": 77,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 11,
    "ayah": 64,
    "surahName": "Hud"
   },
   {
    "sura": 17,
    "ayah": 59,
    "surahName": "Al-Isra"
   },
   {
    "sura": 26,
    "ayah": 155,
    "surahName": "Ash-Shu'ara"
   }
  ]
 },
 "بيض": {
  "count": 9,
  "verses": [
   {
    "sura": 2,
    "ayah": 187,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 3,
    "ayah": 106,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 107,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 7,
    "ayah": 108,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 12,
    "ayah": 84,
    "surahName": "Yusuf"
   },
   {
    "sura": 20,
    "ayah": 22,
    "surahName": "Taha"
   },
   {
    "sura": 26,
    "ayah": 33,
    "surahName": "Ash-Shu'ara"
   },
   {
    "sura": 27,
    "ayah": 12,
    "surahName": "An-Naml"
   },
   {
    "sura": 28,
    "ayah": 32,
    "surahName": "Al-Qasas"
   }
  ]
 },
 "أمر": {
  "count": 189,
  "verses": [
   {
    "sura": 2,
    "ayah": 27,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 44,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 67,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 68,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 93,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 109,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 117,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 169,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 210,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 222,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 268,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 275,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 3,
    "ayah": 21,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 47,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 80,
    "surahName": "Ali 'Imran"
   }
  ]
 },
 "سكن": {
  "count": 51,
  "verses": [
   {
    "sura": 2,
    "ayah": 35,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 61,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 83,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 177,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 184,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 215,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 248,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 3,
    "ayah": 112,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 4,
    "ayah": 8,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 36,
    "surahName": "An-Nisa"
   },
   {
    "sura": 5,
    "ayah": 89,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 5,
    "ayah": 95,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 6,
    "ayah": 13,
    "surahName": "Al-An'am"
   },
   {
    "sura": 6,
    "ayah": 96,
    "surahName": "Al-An'am"
   },
   {
    "sura": 7,
    "ayah": 19,
    "surahName": "Al-A'raf"
   }
  ]
 },
 "ألم": {
  "count": 51,
  "verses": [
   {
    "sura": 2,
    "ayah": 10,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 104,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 174,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 178,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 3,
    "ayah": 21,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 77,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 91,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 177,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 188,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 4,
    "ayah": 18,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 104,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 138,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 161,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 173,
    "surahName": "An-Nisa"
   },
   {
    "sura": 5,
    "ayah": 36,
    "surahName": "Al-Ma'idah"
   }
  ]
 },
 "شفي": {
  "count": 5,
  "verses": [
   {
    "sura": 9,
    "ayah": 14,
    "surahName": "At-Tawbah"
   },
   {
    "sura": 10,
    "ayah": 57,
    "surahName": "Yunus"
   },
   {
    "sura": 16,
    "ayah": 69,
    "surahName": "An-Nahl"
   },
   {
    "sura": 17,
    "ayah": 82,
    "surahName": "Al-Isra"
   },
   {
    "sura": 26,
    "ayah": 80,
    "surahName": "Ash-Shu'ara"
   }
  ]
 },
 "فكه": {
  "count": 1,
  "verses": [
   {
    "sura": 23,
    "ayah": 19,
    "surahName": "Al-Mu'minun"
   }
  ]
 },
 "عصف": {
  "count": 3,
  "verses": [
   {
    "sura": 10,
    "ayah": 22,
    "surahName": "Yunus"
   },
   {
    "sura": 14,
    "ayah": 18,
    "surahName": "Ibrahim"
   },
   {
    "sura": 21,
    "ayah": 81,
    "surahName": "Al-Anbya"
   }
  ]
 },
 "طير": {
  "count": 22,
  "verses": [
   {
    "sura": 2,
    "ayah": 260,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 3,
    "ayah": 49,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 5,
    "ayah": 110,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 6,
    "ayah": 38,
    "surahName": "Al-An'am"
   },
   {
    "sura": 7,
    "ayah": 131,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 12,
    "ayah": 36,
    "surahName": "Yusuf"
   },
   {
    "sura": 12,
    "ayah": 41,
    "surahName": "Yusuf"
   },
   {
    "sura": 16,
    "ayah": 79,
    "surahName": "An-Nahl"
   },
   {
    "sura": 17,
    "ayah": 13,
    "surahName": "Al-Isra"
   },
   {
    "sura": 21,
    "ayah": 79,
    "surahName": "Al-Anbya"
   },
   {
    "sura": 22,
    "ayah": 31,
    "surahName": "Al-Hajj"
   },
   {
    "sura": 24,
    "ayah": 41,
    "surahName": "An-Nur"
   },
   {
    "sura": 27,
    "ayah": 16,
    "surahName": "An-Naml"
   },
   {
    "sura": 27,
    "ayah": 17,
    "surahName": "An-Naml"
   },
   {
    "sura": 27,
    "ayah": 20,
    "surahName": "An-Naml"
   }
  ]
 },
 "عرب": {
  "count": 12,
  "verses": [
   {
    "sura": 9,
    "ayah": 90,
    "surahName": "At-Tawbah"
   },
   {
    "sura": 9,
    "ayah": 97,
    "surahName": "At-Tawbah"
   },
   {
    "sura": 9,
    "ayah": 98,
    "surahName": "At-Tawbah"
   },
   {
    "sura": 9,
    "ayah": 99,
    "surahName": "At-Tawbah"
   },
   {
    "sura": 9,
    "ayah": 101,
    "surahName": "At-Tawbah"
   },
   {
    "sura": 9,
    "ayah": 120,
    "surahName": "At-Tawbah"
   },
   {
    "sura": 12,
    "ayah": 2,
    "surahName": "Yusuf"
   },
   {
    "sura": 13,
    "ayah": 37,
    "surahName": "Ar-Ra'd"
   },
   {
    "sura": 16,
    "ayah": 103,
    "surahName": "An-Nahl"
   },
   {
    "sura": 20,
    "ayah": 113,
    "surahName": "Taha"
   },
   {
    "sura": 26,
    "ayah": 195,
    "surahName": "Ash-Shu'ara"
   },
   {
    "sura": 33,
    "ayah": 20,
    "surahName": "Al-Ahzab"
   }
  ]
 },
 "لغو": {
  "count": 6,
  "verses": [
   {
    "sura": 2,
    "ayah": 225,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 5,
    "ayah": 89,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 19,
    "ayah": 62,
    "surahName": "Maryam"
   },
   {
    "sura": 23,
    "ayah": 3,
    "surahName": "Al-Mu'minun"
   },
   {
    "sura": 25,
    "ayah": 72,
    "surahName": "Al-Furqan"
   },
   {
    "sura": 28,
    "ayah": 55,
    "surahName": "Al-Qasas"
   }
  ]
 },
 "سهل": {
  "count": 1,
  "verses": [
   {
    "sura": 7,
    "ayah": 74,
    "surahName": "Al-A'raf"
   }
  ]
 },
 "جهد": {
  "count": 35,
  "verses": [
   {
    "sura": 2,
    "ayah": 218,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 3,
    "ayah": 142,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 4,
    "ayah": 95,
    "surahName": "An-Nisa"
   },
   {
    "sura": 5,
    "ayah": 35,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 5,
    "ayah": 53,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 5,
    "ayah": 54,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 6,
    "ayah": 109,
    "surahName": "Al-An'am"
   },
   {
    "sura": 8,
    "ayah": 72,
    "surahName": "Al-Anfal"
   },
   {
    "sura": 8,
    "ayah": 74,
    "surahName": "Al-Anfal"
   },
   {
    "sura": 8,
    "ayah": 75,
    "surahName": "Al-Anfal"
   },
   {
    "sura": 9,
    "ayah": 16,
    "surahName": "At-Tawbah"
   },
   {
    "sura": 9,
    "ayah": 19,
    "surahName": "At-Tawbah"
   },
   {
    "sura": 9,
    "ayah": 20,
    "surahName": "At-Tawbah"
   },
   {
    "sura": 9,
    "ayah": 24,
    "surahName": "At-Tawbah"
   },
   {
    "sura": 9,
    "ayah": 41,
    "surahName": "At-Tawbah"
   }
  ]
 },
 "شهر": {
  "count": 17,
  "verses": [
   {
    "sura": 2,
    "ayah": 185,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 194,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 197,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 217,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 226,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 234,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 4,
    "ayah": 92,
    "surahName": "An-Nisa"
   },
   {
    "sura": 5,
    "ayah": 2,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 5,
    "ayah": 97,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 9,
    "ayah": 2,
    "surahName": "At-Tawbah"
   },
   {
    "sura": 9,
    "ayah": 5,
    "surahName": "At-Tawbah"
   },
   {
    "sura": 9,
    "ayah": 36,
    "surahName": "At-Tawbah"
   },
   {
    "sura": 34,
    "ayah": 12,
    "surahName": "Saba"
   }
  ]
 },
 "مدن": {
  "count": 25,
  "verses": [
   {
    "sura": 7,
    "ayah": 85,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 7,
    "ayah": 111,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 7,
    "ayah": 123,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 9,
    "ayah": 70,
    "surahName": "At-Tawbah"
   },
   {
    "sura": 9,
    "ayah": 101,
    "surahName": "At-Tawbah"
   },
   {
    "sura": 9,
    "ayah": 120,
    "surahName": "At-Tawbah"
   },
   {
    "sura": 11,
    "ayah": 84,
    "surahName": "Hud"
   },
   {
    "sura": 11,
    "ayah": 95,
    "surahName": "Hud"
   },
   {
    "sura": 12,
    "ayah": 30,
    "surahName": "Yusuf"
   },
   {
    "sura": 15,
    "ayah": 67,
    "surahName": "Al-Hijr"
   },
   {
    "sura": 18,
    "ayah": 19,
    "surahName": "Al-Kahf"
   },
   {
    "sura": 18,
    "ayah": 82,
    "surahName": "Al-Kahf"
   },
   {
    "sura": 20,
    "ayah": 40,
    "surahName": "Taha"
   },
   {
    "sura": 22,
    "ayah": 44,
    "surahName": "Al-Hajj"
   },
   {
    "sura": 26,
    "ayah": 36,
    "surahName": "Ash-Shu'ara"
   }
  ]
 },
 "قهر": {
  "count": 6,
  "verses": [
   {
    "sura": 6,
    "ayah": 18,
    "surahName": "Al-An'am"
   },
   {
    "sura": 6,
    "ayah": 61,
    "surahName": "Al-An'am"
   },
   {
    "sura": 7,
    "ayah": 127,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 12,
    "ayah": 39,
    "surahName": "Yusuf"
   },
   {
    "sura": 13,
    "ayah": 16,
    "surahName": "Ar-Ra'd"
   },
   {
    "sura": 14,
    "ayah": 48,
    "surahName": "Ibrahim"
   }
  ]
 },
 "يوم": {
  "count": 268,
  "verses": [
   {
    "sura": 1,
    "ayah": 4,
    "surahName": "Al-Fatihah"
   },
   {
    "sura": 2,
    "ayah": 8,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 48,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 62,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 80,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 85,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 113,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 123,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 126,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 174,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 177,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 184,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 185,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 196,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 203,
    "surahName": "Al-Baqarah"
   }
  ]
 },
 "وصف": {
  "count": 11,
  "verses": [
   {
    "sura": 6,
    "ayah": 100,
    "surahName": "Al-An'am"
   },
   {
    "sura": 6,
    "ayah": 139,
    "surahName": "Al-An'am"
   },
   {
    "sura": 12,
    "ayah": 18,
    "surahName": "Yusuf"
   },
   {
    "sura": 12,
    "ayah": 77,
    "surahName": "Yusuf"
   },
   {
    "sura": 16,
    "ayah": 62,
    "surahName": "An-Nahl"
   },
   {
    "sura": 16,
    "ayah": 116,
    "surahName": "An-Nahl"
   },
   {
    "sura": 21,
    "ayah": 18,
    "surahName": "Al-Anbya"
   },
   {
    "sura": 21,
    "ayah": 22,
    "surahName": "Al-Anbya"
   },
   {
    "sura": 21,
    "ayah": 112,
    "surahName": "Al-Anbya"
   },
   {
    "sura": 23,
    "ayah": 91,
    "surahName": "Al-Mu'minun"
   },
   {
    "sura": 23,
    "ayah": 96,
    "surahName": "Al-Mu'minun"
   }
  ]
 },
 "روح": {
  "count": 37,
  "verses": [
   {
    "sura": 2,
    "ayah": 87,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 164,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 253,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 3,
    "ayah": 117,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 4,
    "ayah": 171,
    "surahName": "An-Nisa"
   },
   {
    "sura": 5,
    "ayah": 110,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 7,
    "ayah": 57,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 8,
    "ayah": 46,
    "surahName": "Al-Anfal"
   },
   {
    "sura": 10,
    "ayah": 22,
    "surahName": "Yunus"
   },
   {
    "sura": 12,
    "ayah": 87,
    "surahName": "Yusuf"
   },
   {
    "sura": 12,
    "ayah": 94,
    "surahName": "Yusuf"
   },
   {
    "sura": 14,
    "ayah": 18,
    "surahName": "Ibrahim"
   },
   {
    "sura": 15,
    "ayah": 22,
    "surahName": "Al-Hijr"
   },
   {
    "sura": 15,
    "ayah": 29,
    "surahName": "Al-Hijr"
   },
   {
    "sura": 16,
    "ayah": 2,
    "surahName": "An-Nahl"
   }
  ]
 },
 "ثني": {
  "count": 22,
  "verses": [
   {
    "sura": 2,
    "ayah": 60,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 4,
    "ayah": 3,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 11,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 176,
    "surahName": "An-Nisa"
   },
   {
    "sura": 5,
    "ayah": 12,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 5,
    "ayah": 106,
    "surahName": "Al-Ma'idah"
   },
   {
    "sura": 6,
    "ayah": 143,
    "surahName": "Al-An'am"
   },
   {
    "sura": 6,
    "ayah": 144,
    "surahName": "Al-An'am"
   },
   {
    "sura": 7,
    "ayah": 160,
    "surahName": "Al-A'raf"
   },
   {
    "sura": 9,
    "ayah": 36,
    "surahName": "At-Tawbah"
   },
   {
    "sura": 9,
    "ayah": 40,
    "surahName": "At-Tawbah"
   },
   {
    "sura": 11,
    "ayah": 5,
    "surahName": "Hud"
   },
   {
    "sura": 11,
    "ayah": 40,
    "surahName": "Hud"
   },
   {
    "sura": 13,
    "ayah": 3,
    "surahName": "Ar-Ra'd"
   },
   {
    "sura": 15,
    "ayah": 87,
    "surahName": "Al-Hijr"
   }
  ]
 },
 "وزر": {
  "count": 15,
  "verses": [
   {
    "sura": 6,
    "ayah": 31,
    "surahName": "Al-An'am"
   },
   {
    "sura": 6,
    "ayah": 164,
    "surahName": "Al-An'am"
   },
   {
    "sura": 16,
    "ayah": 25,
    "surahName": "An-Nahl"
   },
   {
    "sura": 17,
    "ayah": 15,
    "surahName": "Al-Isra"
   },
   {
    "sura": 20,
    "ayah": 29,
    "surahName": "Taha"
   },
   {
    "sura": 20,
    "ayah": 87,
    "surahName": "Taha"
   },
   {
    "sura": 20,
    "ayah": 100,
    "surahName": "Taha"
   },
   {
    "sura": 25,
    "ayah": 35,
    "surahName": "Al-Furqan"
   }
  ]
 },
 "حدد": {
  "count": 17,
  "verses": [
   {
    "sura": 2,
    "ayah": 187,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 229,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 230,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 4,
    "ayah": 13,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 14,
    "surahName": "An-Nisa"
   },
   {
    "sura": 9,
    "ayah": 63,
    "surahName": "At-Tawbah"
   },
   {
    "sura": 9,
    "ayah": 97,
    "surahName": "At-Tawbah"
   },
   {
    "sura": 9,
    "ayah": 112,
    "surahName": "At-Tawbah"
   },
   {
    "sura": 17,
    "ayah": 50,
    "surahName": "Al-Isra"
   },
   {
    "sura": 18,
    "ayah": 96,
    "surahName": "Al-Kahf"
   },
   {
    "sura": 22,
    "ayah": 21,
    "surahName": "Al-Hajj"
   },
   {
    "sura": 33,
    "ayah": 19,
    "surahName": "Al-Ahzab"
   },
   {
    "sura": 34,
    "ayah": 10,
    "surahName": "Saba"
   }
  ]
 },
 "دون": {
  "count": 107,
  "verses": [
   {
    "sura": 2,
    "ayah": 23,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 94,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 107,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 2,
    "ayah": 165,
    "surahName": "Al-Baqarah"
   },
   {
    "sura": 3,
    "ayah": 28,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 64,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 79,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 3,
    "ayah": 118,
    "surahName": "Ali 'Imran"
   },
   {
    "sura": 4,
    "ayah": 48,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 116,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 117,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 119,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 123,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 139,
    "surahName": "An-Nisa"
   },
   {
    "sura": 4,
    "ayah": 144,
    "surahName": "An-Nisa"
   }
  ]
 }
};
