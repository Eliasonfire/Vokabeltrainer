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
  /* (noch leer — wird aus seinen Freigaben gefüllt) */
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
  /* (noch leer — wird aus seinen Antworten gefüllt) */
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
  /* (noch leer — wird aus seinen Antworten gefüllt) */
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
