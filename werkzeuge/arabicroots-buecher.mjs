/* arabicroots-buecher.mjs — welches Buch der App steckt hinter einer
 * Kapitelkennung von arabicroots?
 * ==========================================================================
 *
 * ⛔⛔ WARUM ES DIESE DATEI GIBT (24.09.2026, gemessen)
 *
 * `get_unlocked_chapters` meldet Bayna Yadayk 1 als „aby-1-chapter-N". Die
 * App, `data/buecher.js` und die Buchdateien aus `hole-vokabeln.mjs` (die
 * arabicroots-DATENBANK) nennen dasselbe Buch „bayna-yadayk-1". Zwei
 * Schnittstellen desselben Anbieters, zwei Namen.
 *
 * `vorrat.mjs --stand` las die Kennung bis heute wörtlich, fand „aby-1" nicht
 * unter den Büchern der App und warf es STILL weg (die Zeile
 * `ueber.forEach(b => delete neu[b])`). Bayna Yadayk kam nur deshalb in
 * FREIGESCHALTET, weil Elias die Kapitel zusätzlich in der App angehakt hatte.
 * Hätte er ein Kapitel nur bei arabicroots freigeschaltet, wäre es nie
 * angekommen — gegen seine Regel „wenn EINE der beiden freischaltet".
 *
 * Anlass war sein Auftrag vom 23.09.2026, ~20:40: „zum vollen programm dem
 * skill soll auch hinzugefügt werden bzw irgendwer soll auch gucken ob das
 * meine kapitel hier auch aktuell sind und auch bücher".
 *
 * ⛔ NUR GEMESSENE ZUORDNUNGEN. „aby-2" für Bayna Yadayk 2 liegt nahe, ist
 * aber nicht gemessen. Eine unbekannte Kennung wird NICHT geraten: sie bleibt,
 * wie sie ist, und `pruefe-buecher-aktuell.mjs` meldet sie als Befund.
 * [[kann_ist_nicht_ist]]
 *
 * Benutzt von: werkzeuge/vorrat.mjs (Freischaltung nachziehen) und
 * werkzeuge/pruefe-buecher-aktuell.mjs (die Prüfung). Eine Stelle, zwei Leser.
 */

/* Gemessen 24.09.2026, 13:2x: get_unlocked_chapters → aby-1-chapter-1 … 4;
   seine App-Auswahl (KV 04:47) → bayna-yadayk-1: 1 … 4. */
export const ZUORDNUNG = Object.freeze({
  'aby-1': 'bayna-yadayk-1',
});

export function appBuch(kennung){
  return Object.prototype.hasOwnProperty.call(ZUORDNUNG, kennung) ? ZUORDNUNG[kennung] : kennung;
}

/* Liest die Liste aus get_unlocked_chapters. Gibt die Kapitel je App-Buch
   zurück und, je App-Buch, unter welcher Kennung arabicroots es gemeldet hat
   (für die Meldung „unbekannte Kennung"). */
export function kapitelAusRoots(liste){
  const frei = {}, kennung = {};
  (Array.isArray(liste) ? liste : []).forEach(e => {
    const id = String((e && typeof e === 'object' ? (e.chapter_id || e.chapterId) : e) || '');
    const m = id.match(/^(.*)-chapter-(\d+)$/);
    if (!m) return;
    const b = appBuch(m[1]);
    (frei[b] = frei[b] || []).push(Number(m[2]));
    kennung[b] = m[1];
  });
  Object.keys(frei).forEach(b => { frei[b] = [...new Set(frei[b])].sort((x, y) => x - y); });
  return { frei, kennung };
}
