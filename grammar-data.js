/* ===================== GRAMMAR DATA ===================== */
/* Grammatikregeln, kuratiert aus den Arabic-Roots-Unterrichtsaufzeichnungen
   (Folge 01-12, get_recordings via arabicroots-MCP). Jede Regel gibt exakt
   nur wieder, was der Lehrer im Video erklärt hat - keine ergänzten/erfundenen
   Regeln. Quelle (Folge, ungefährer Zeitstempel, Kapitel) ist Pflichtangabe,
   analog zu den geprüften Quran-Zitaten in vocab-data.js. Rohtranskripte
   (Audit-Grundlage) liegen lokal unter transcripts/ (nicht im Git, siehe
   .gitignore - Kursmaterial-Disclaimer verbietet Weitergabe). */

const GRAMMAR_RULES = [
  {
    id: "ismul-isara-hadha-01",
    name: "هَذَا (dies)",
    shortExplanation: "هَذَا (hadha) ist ein اسْمُ الْإِشَارَة (Hinweiswort/Demonstrativpronomen). Es wird nur für Dinge benutzt, die (a) in der Nähe sind und (b) männlich (nicht für Personen, nicht für weibliche Wörter).",
    color: "mubtada",
    source: { folge: 1, video: "Folge 01", approxTimestamp: "10:07", chapter: 1 }
  },
  {
    id: "fragepartikel-alif-01",
    name: "أَ (Fragepartikel)",
    shortExplanation: "Ein أَ vor einen vollständigen Satz gestellt macht aus einer Aussage eine Frage. Anders als هَلْ (hal, Entscheidungsfrage/ja-nein) wird أَ eher allgemein/rhetorisch genutzt.",
    color: "nasab",
    source: { folge: 1, video: "Folge 01", approxTimestamp: "22:48", chapter: 1 }
  },
  {
    id: "istifham-men-01",
    name: "مَنْ (wer)",
    shortExplanation: "مَنْ (men) ist das Fragewort für Personen (\"wer ist dies?\"), im Unterschied zu هَذَا/Fragen nach Gegenständen. Nicht verwechseln mit مِنْ (min, \"von\") - men hat Fatha, min hat Sukun.",
    color: "nasab",
    source: { folge: 2, video: "Folge 02", approxTimestamp: "2:11", chapter: 2 }
  },
  {
    id: "ismul-isara-dhalika-01",
    name: "ذَلِكَ (jenes)",
    shortExplanation: "ذَلِكَ (dhalika) ist wie هَذَا ein اسْمُ الْإِشَارَة (Hinweiswort), aber für Dinge in der Ferne statt in der Nähe. Gilt ebenfalls nur für männliche Wörter. Kann auch auf zuvor Erwähntes zurückverweisen, nicht nur auf räumlich Entferntes.",
    color: "mubtada",
    source: { folge: 2, video: "Folge 02", approxTimestamp: "20:07", chapter: 2 }
  },
  {
    id: "al-tarif-01",
    name: "اَلْ (bestimmter Artikel)",
    shortExplanation: "اَلْ bestimmt ein Nomen (wie \"der/die/das\"). Regel 1: Für ein bestimmtes Wort braucht man den Artikel اَلْ. Regel 2: Das Tanwin fällt dabei weg, z.B. بَيْتٌ (ein Haus) → الْبَيْتُ (das Haus). Artikel und Tanwin schließen sich gegenseitig aus.",
    color: "other",
    source: { folge: 2, video: "Folge 02", approxTimestamp: "32:51", chapter: 3 }
  }
];

const SENTENCE_TAGS = {
  /* Key = vocab-data.js `id` (stabiler Join-Key, NICHT der Satztext) */
  "45751": [
    { ruleId: "ismul-isara-hadha-01", matchText: "هَذَا" }
  ],
  "45776": [
    { ruleId: "fragepartikel-alif-01", matchText: "أَ" }
  ],
  "45787": [
    { ruleId: "al-tarif-01", matchText: "الْمَاءُ" }
  ]
};
