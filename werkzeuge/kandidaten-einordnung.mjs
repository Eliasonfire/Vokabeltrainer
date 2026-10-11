/* kandidaten-einordnung.mjs — EINE Stelle entscheidet, wohin ein Regelkandidat geht.
 * ==========================================================================
 *
 * Drei Werkzeuge müssen dieselbe Frage gleich beantworten: geht eine Fundstelle
 * an Elias, oder ist sie meine Arbeit? `kandidaten-bewerten.mjs` (zählt und
 * schreibt `bewertung.json`), `freigabe-artefakt.mjs` (seine Seite) und
 * `wartet-auf-elias.mjs` (seine Warteseite). Bis zum 11.10.2026 stand die
 * Antwort in jedem der drei für sich. Jetzt steht sie hier, und die drei
 * fragen diese Datei. [[entscheidung_gilt_fuer_das_zweite_werkzeug]]
 *
 * ⛔⛔ DIE REGEL, DIE DIESE DATEI DURCHSETZT — VON ELIAS, DREIMAL GESAGT
 *
 *   18.08.2026: „du sollst sie selber auswerten. füge dann die fertigen regeln
 *     zu den restlichen regeln hinzu und ich gucke sie mir dann später an aber
 *     du kannst sie schonmal in die app mit aufnehmen. allgemein gilt das so."
 *   05.10.2026: auf meine Frage, ob neue belegte Regeln weiter direkt in die
 *     App dürfen: „ist okay".
 *   11.10.2026: auf meine Frage „Soll ich den Auftrag der Wartung so ändern,
 *     dass sie belegte Regeln künftig selbst einbaut, statt dich zu fragen?":
 *     „ja". Anlass: seine Frage „wieso stehen die noch aus?" — drei belegte
 *     Regeln aus Folge 22 und 24 warteten als Frage „Aufnehmen?" auf ihn,
 *     vier weitere seit dem 22.09.2026.
 *
 *   Eine BELEGTE Regel (der Lehrer sagt sie im Unterricht UND eine gedruckte
 *   Quelle sagt dasselbe) ist deshalb MEINE Arbeit: einbauen, er sieht sie
 *   danach an. An Elias gehen nur noch zwei Sorten:
 *     `abweichung`  Schlüssel und Lehrer widersprechen sich
 *     `unbelegt`    der Lehrer sagt es, keine gedruckte Quelle bestätigt es
 *
 * ⚠️ WAS VORHER GALT, UND WARUM ES NICHT MEHR GILT. Vom 22.09. bis zum
 * 11.10.2026 ging auch `regel` an ihn („mein Vorschlag mit Beleg — dein Ja
 * fehlt"). Die Begründung stand in `kandidaten-bewerten.mjs` und berief sich
 * auf einen Gedächtnissatz vom 29.07.2026: „Band 2 und 3 liefern Kandidaten für
 * neue Regeln, aber sie werden GESAMMELT, NICHT EINGEBAUT: Elias will alle
 * Regeln selbst freigeben." Dieser Satz meint Buchregeln, die dem Unterricht
 * VORAUS sind — nicht Regeln, die sein Lehrer schon gesagt hat. Für die gilt
 * seit dem 18.08. sein „allgemein gilt das so". Die Lesart vom 22.09. war
 * MEINE, und sie hat ihm drei Wochen lang sieben Fragen vorgelegt, die er
 * längst beantwortet hatte.
 *
 * ========================= DIE FÜNF URTEILE ===============================
 *
 * | Urteil | an | was dann geschieht |
 * |---|---|---|
 * | `schon-regel` | mich | steht schon als Regel. Trägt der Eintrag `regel` (Kennung) und `eingebaut` (Datum), ist sie aus DIESER Fundstelle entstanden — Elias liest dann „eingebaut" |
 * | `weg` | mich | keine Regel darin |
 * | `regel` | mich | belegt, aber noch NICHT in der App. Das ist ein Zwischenstand: einbauen (Wartung, Schritt 1b.3), dann auf `schon-regel` mit `regel` und `eingebaut` setzen |
 * | `abweichung` | Elias | braucht `frage` und `quelle` |
 * | `unbelegt` | Elias | braucht `frage` und `quelle` |
 *
 * ⛔ Diese Datei hat KEINE Importe — der Prüfstand `test-regelkandidaten.mjs`
 * lädt ihren Text und verändert ihn für die Störtests. Das soll so bleiben.
 */

export const URTEILSARTEN = {
  'schon-regel': { an: 'claude', text: 'Der Inhalt steht bereits als Regel' },
  'weg':         { an: 'claude', text: 'Keine Regel darin' },
  'regel':       { an: 'claude', text: 'Belegte Regel — ich baue sie ein, er sieht sie danach an' },
  'abweichung':  { an: 'elias',  text: 'Schlüssel und Unterricht widersprechen sich' },
  'unbelegt':    { an: 'elias',  text: 'Keine gedruckte Quelle bestätigt es' },
};

/* Ein Kandidat, der zu Elias geht, braucht eine FRAGE an ihn. Ohne sie steht er
   vor einem Textblock und soll raten, was von ihm erwartet wird — genau der
   Zustand, den er am 22.09.2026 abgeräumt hat. */
export const BRAUCHT_FRAGE = ['abweichung', 'unbelegt'];

/* ⛔ Und eine Fundstelle. Eine „belegte Regel" ohne genannten Beleg ist eine
   Behauptung — und sie wird jetzt ohne sein Ja eingebaut. Deshalb braucht
   gerade `regel` die Quelle. */
export const BRAUCHT_QUELLE = ['regel', 'abweichung', 'unbelegt'];

export function gehtAnElias(urteil) {
  const art = URTEILSARTEN[urteil];
  return !!art && art.an === 'elias';
}

/* Belegt, aber noch nicht in der App: MEIN Rückstand beim Einbauen. */
export function wartetAufEinbau(k) {
  return !!k && k.urteil === 'regel';
}

/* Aus dieser Fundstelle ist eine Regel geworden — er liest „eingebaut". */
export function istEingebaut(k) {
  return !!k && k.urteil === 'schon-regel' && !!k.eingebaut;
}

/* Ordnet alle Kandidaten ein. `regelIds` sind die Kennungen aus grammar-data.js:
   nennt ein Urteil eine Regel, muss es sie geben. */
export function einordnen(alle, regelIds) {
  const ids = regelIds instanceof Set ? regelIds : new Set(regelIds || []);
  const bekannt = k => !!URTEILSARTEN[k.urteil];
  const zuKurz = (s, n) => !s || String(s).trim().length < n;
  return {
    ohneUrteil:    alle.filter(k => !k.urteil),
    unbekannteArt: alle.filter(k => k.urteil && !bekannt(k)),
    anElias:       alle.filter(k => gehtAnElias(k.urteil)),
    vonMir:        alle.filter(k => bekannt(k) && !gehtAnElias(k.urteil)),
    einzubauen:    alle.filter(wartetAufEinbau),
    eingebaut:     alle.filter(istEingebaut),
    /* „eingebaut" gemeldet, aber die genannte Regel gibt es nicht (mehr): dann
       läse Elias „eingebaut" über etwas, das in der App fehlt. */
    eingebautOhneRegel: alle.filter(k => k.urteil === 'schon-regel' && (k.eingebaut || k.regel)
      && !(k.regel && ids.has(k.regel))),
    /* `eingebaut` an einem anderen Urteil als `schon-regel` ist ein Widerspruch. */
    eingebautFalscheArt: alle.filter(k => k.eingebaut && k.urteil !== 'schon-regel'),
    ohneGrund:  alle.filter(k => k.urteil && zuKurz(k.grund, 15)),
    ohneFrage:  alle.filter(k => BRAUCHT_FRAGE.includes(k.urteil) && zuKurz(k.frage, 15)),
    ohneQuelle: alle.filter(k => BRAUCHT_QUELLE.includes(k.urteil) && zuKurz(k.quelle, 10)),
  };
}
