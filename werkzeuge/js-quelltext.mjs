/* js-quelltext.mjs — Kommentare und Zeichenketten aus JS-Quelltext entfernen,
   ohne die Zeilennummern zu verschieben.

   ⛔ DER ANLASS (09.09.2026). Die Zahl „37 leere catch-Bloecke, darunter
   feier.js 1" stand als Messung in der To-Do. Sie war falsch: der Treffer in
   `js/feier.js` sass in einem KOMMENTAR, der das Problem beschreibt —
   „das leere `catch {}` hat genau diesen Fall unauffindbar gemacht."
   Ein Prüfer, der roh sucht, findet seine eigene Beschreibung.
   [[stichworttreffer_im_kommentar]]

   Die echte Zahl ist 36 in 7 Dateien.

   ⚠️ Ersetzt wird durch LEERZEICHEN gleicher Laenge, Zeilenumbrueche bleiben
   stehen. Damit stimmen Zeilen- und Spaltennummern des Ergebnisses mit denen
   der Originaldatei ueberein — ein Befund ist danach noch auffindbar.

   ⚠️ Regex-Literale werden erkannt, weil ein `/` sonst als Kommentaranfang
   durchgeht: `a.replace(/\/\/x/, '')` wuerde sonst den Rest der Zeile
   verschlucken. Unterschieden wird am letzten bedeutungstragenden Zeichen
   davor — das ist die uebliche und hier ausreichende Heuristik. */

const VOR_REGEX = new Set(['(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '<', '>', '~', '^']);

/** Ersetzt Kommentare und Zeichenketten durch Leerzeichen gleicher Laenge.
 *
 *  ⚠️ `{ texte: false }` laesst den INHALT der Zeichenketten stehen und
 *  entfernt nur Kommentare. Der Anlass (09.09.2026): eine Pruefung suchte
 *  `typeof x === 'function'` — und fand null Treffer, weil der Stripper das
 *  Wort `function` in den Anfuehrungszeichen geleert hatte. Ihre Eichung
 *  meldete es sofort („nur 0 Riegel gefunden"); ohne die haette sie gruen
 *  gemeldet, ohne etwas gemessen zu haben.
 *  [[leere_liste_ist_keine_messung]] [[gruener_pruefer_beweist_nur_geprueftes]]
 */
/* Ueberspringt EINE Zeichenkette ab `start` und gibt den Index dahinter zurueck.
 *
 * ⛔⛔ VERSCHACHTELTE TEMPLATE-LITERALE (der Fehler, gefunden am 09.09.2026).
 * `js/kategorien.js:142` baut Markup so:
 *
 *     box.innerHTML = CUSTOM_CATS.map(cat => `
 *       <div …>${cat.wordIds.map(id => { … return `<span …`; })}</div>`
 *
 * Die alte Fassung suchte stumpf den naechsten Backtick — und der gehoerte zur
 * INNEREN Zeichenkette. Ab da war alles vertauscht: Code galt als Text, Text
 * als Code, und ein `/*` wurde nicht mehr als Kommentaranfang gesehen. VIER
 * Pruefer haben dadurch in dieser Datei (1398 Zeilen) und in js/statistik.js
 * still zu wenig gemessen — ohne dass einer davon rot wurde.
 *
 * ⭐ Gefunden hat es der Stoertest eines fuenften Pruefers: ein absichtlich
 * eingebauter, ECHTER Aufruf wurde nicht gefunden. Ohne diesen Stoertest waere
 * der Fehler unentdeckt geblieben — die vier anderen meldeten weiter gruen.
 * [[gruener_pruefer_beweist_nur_geprueftes]] [[stoertest_muss_wirkung_nachweisen]]
 *
 * Im Einschub `${ … }` steht wieder CODE, also wird dort rekursiv weiter
 * unterschieden statt blind bis zum naechsten Backtick zu springen.
 */
function zeichenketteUeberspringen(q, start, aus, texte, leeren) {
  const n = q.length;
  const anf = q[start];
  let i = start + 1;
  while (i < n) {
    if (q[i] === '\\') { i += 2; continue; }
    if (q[i] === anf) { i++; break; }
    if (anf === '`' && q[i] === '$' && q[i + 1] === '{') {
      /* Der Textteil davor darf geleert werden, der Einschub nicht. */
      if (texte) leeren(start + 1, i);
      let tiefe = 1;
      i += 2;
      while (i < n && tiefe > 0) {
        const z = q[i];
        if (z === '\\') { i += 2; continue; }
        if (z === '"' || z === "'" || z === '`') { i = zeichenketteUeberspringen(q, i, aus, texte, leeren); continue; }
        if (z === '{') tiefe++;
        else if (z === '}') tiefe--;
        i++;
      }
      start = i - 1;                 /* der Text nach dem Einschub faengt hier an */
      continue;
    }
    i++;
  }
  if (texte) leeren(start + 1, Math.max(start + 1, i - 1));
  return i;
}

export function ohneKommentareUndTexte(quelle, { texte = true } = {}) {
  const aus = quelle.split('');
  const n = quelle.length;
  let i = 0;
  /* Das letzte Zeichen, das kein Leerraum war — entscheidet, ob ein `/`
     eine Division oder ein Regex-Literal einleitet. */
  let davor = '';

  const leeren = (von, bis) => {
    for (let k = von; k < bis; k++) if (aus[k] !== '\n' && aus[k] !== '\r') aus[k] = ' ';
  };

  while (i < n) {
    const c = quelle[i];
    const c2 = quelle[i + 1];

    if (c === '/' && c2 === '/') {
      let j = i;
      while (j < n && quelle[j] !== '\n') j++;
      leeren(i, j);
      i = j;
      continue;
    }
    if (c === '/' && c2 === '*') {
      let j = i + 2;
      while (j < n && !(quelle[j] === '*' && quelle[j + 1] === '/')) j++;
      j = Math.min(n, j + 2);
      leeren(i, j);
      i = j;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      i = zeichenketteUeberspringen(quelle, i, aus, texte, leeren);
      davor = c;
      continue;
    }
    if (c === '/' && (davor === '' || VOR_REGEX.has(davor))) {
      /* Regex-Literal — bis zum unmaskierten `/`, Zeichenklassen beachten. */
      let j = i + 1, klasse = false, zu = -1;
      while (j < n && quelle[j] !== '\n') {
        if (quelle[j] === '\\') { j += 2; continue; }
        if (quelle[j] === '[') klasse = true;
        else if (quelle[j] === ']') klasse = false;
        else if (quelle[j] === '/' && !klasse) { zu = j; break; }
        j++;
      }
      if (zu > 0) {
        leeren(i + 1, zu);
        i = zu + 1;
        davor = '/';
        continue;
      }
      /* Kein Abschluss in derselben Zeile — dann war es doch eine Division. */
    }
    if (!/\s/.test(c)) davor = c;
    i++;
  }
  return aus.join('');
}

/** Zeilennummer (1-basiert) zu einem Zeichenversatz. */
export function zeileVon(quelle, versatz) {
  let z = 1;
  for (let i = 0; i < versatz && i < quelle.length; i++) if (quelle[i] === '\n') z++;
  return z;
}

/* ⛔⛔ EICHUNG BEIM LADEN (11.09.2026) — ein kaputter Stripper wirft, statt zu schweigen.

   Gemessen am 11.09.2026: ohneKommentareUndTexte() probeweise stillgelegt (gibt
   die Quelle unveraendert zurueck), dann der Sammellauf — 13 rot statt 3, aber
   NEUN der Pruefer, die auf diesem Werkzeug stehen, blieben gruen:
   pruefe-abgleich, pruefe-diagnosekarte, pruefe-zeitmarken,
   funktionen-ohne-aufrufer, test-wurzel, test-satz-tagesziel, test-p1, test-p6,
   test-p8. Bei der Sorte „X hat kein Y" heisst Schweigen: die Befunde
   verschwinden — nicht, dass alles in Ordnung ist.

   ⭐ Statt neun Pruefern je eine eigene Eichung einzubauen, prueft sich das
   Werkzeug beim Laden selbst — an den Faellen, an denen es schon einmal
   gescheitert ist (verschachtelte Template-Literale, `//` im Regex-Literal,
   `texte:false`). Faellt eine Probe durch, wirft der Import, und JEDER
   Abhaengige wird rot, auch einer, der morgen dazukommt.
   [[stoertest_muss_wirkung_nachweisen]] [[allgemeine_regel_statt_listeneintrag]] */
{
  const probe = [
    'a(); // weg-eins',
    '/* weg-zwei */ b();',
    'c("weg-drei");',
    'const t = `<a>${x.map(y => `<b weg-vier>`)}</a>`; /* weg-fuenf */ e();',
    'f(/\\/\\/x/); // weg-sechs',
    'g();'
  ].join('\n');
  const ist = ohneKommentareUndTexte(probe);
  const fehler = [];
  if (ist.length !== probe.length) fehler.push('die Laenge hat sich veraendert');
  if (ist.split('\n').length !== probe.split('\n').length) fehler.push('Zeilen verschoben');
  for (const w of ['weg-eins', 'weg-zwei', 'weg-drei', 'weg-vier', 'weg-fuenf', 'weg-sechs'])
    if (ist.includes(w)) fehler.push('„' + w + '" steht noch da');
  for (const code of ['a();', 'b();', 'c(', 'e();', 'f(', 'g();'])
    if (!ist.includes(code)) fehler.push('Code „' + code + '" ist verschwunden');
  if (!ohneKommentareUndTexte("h('function'); // x", { texte: false }).includes("'function'"))
    fehler.push('texte:false leert die Zeichenkette trotzdem');
  if (fehler.length)
    throw new Error('js-quelltext.mjs besteht seine eigene Eichung nicht: ' + fehler.join(' · ')
      + ' — jeder Pruefer, der hierauf steht, faende sonst still zu wenig.');
}
