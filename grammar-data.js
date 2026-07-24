/* ===================== GRAMMAR DATA ===================== */
/* Grammatikregeln, kuratiert aus den Arabic-Roots-Unterrichtsaufzeichnungen
   (Folge 01-12, get_recordings via arabicroots-MCP). Jede Regel gibt exakt
   nur wieder, was der Lehrer im Video erklärt hat - keine ergänzten/erfundenen
   Regeln. Quelle (Folge, ungefährer Zeitstempel, Kapitel) ist Pflichtangabe,
   analog zu den geprüften Quran-Zitaten in vocab-data.js.

   PLATZHALTER (Stand 24.07.26): Die zwei Eintraege unten sind nur zum Testen
   der Rendering-Pipeline (Unterstrich + Tap-Popup) angelegt und noch NICHT
   gegen die echten Video-Transkripte geprueft. Werden ersetzt, sobald die
   Transkript-Auswertung aller 12 Folgen abgeschlossen ist. */

const GRAMMAR_RULES = [
  {
    id: "mubtada-hadha-01",
    name: "Mubtada mit hadha",
    shortExplanation: "hadha/hadihi steht als Mubtada (Satzgegenstand) am Satzanfang; das folgende Nomen ist der Khabar (die Aussage darüber). [Platzhalter - noch gegen Folge 01 zu verifizieren]",
    color: "mubtada",
    source: { folge: 1, video: "Folge 01", approxTimestamp: "TBD", chapter: 1 }
  },
  {
    id: "mudaf-idafa-01",
    name: "Idafa (Mudaf / Mudaf ilayhi)",
    shortExplanation: "Das erste Wort einer Idafa-Konstruktion (Mudaf) verliert Tanwin und Al-; das zweite Wort (Mudaf ilayhi) steht im Genitiv. [Platzhalter - noch gegen Folge 07/08 zu verifizieren]",
    color: "idafa",
    source: { folge: 7, video: "Folge 07", approxTimestamp: "TBD", chapter: 5 }
  }
];

const SENTENCE_TAGS = {
  /* Key = vocab-data.js `id` (stabiler Join-Key, NICHT der Satztext) */
  "45751": [
    { ruleId: "mubtada-hadha-01", matchText: "هَذَا" }
  ]
};
