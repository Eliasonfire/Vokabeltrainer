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
    grund: 'Ein حَرْف ist nicht ableitbar; ein Fachbegriff gehört nicht in die Wurzelansicht.'
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
 */

const FELD_AUSNAHMEN = {
  /* (noch leer — wird durch Elias' Freigaben gefüllt) */
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
  return null;
}

if (typeof window !== 'undefined'){
  window.FELD_REGELN = FELD_REGELN;
  window.FELD_AUSNAHMEN = FELD_AUSNAHMEN;
  window.feldAusnahme = feldAusnahme;
}
if (typeof module !== 'undefined' && module.exports){
  module.exports = { FELD_REGELN, FELD_AUSNAHMEN, feldAusnahme };
}
