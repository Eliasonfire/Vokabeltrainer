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
      let j = i + 1;
      while (j < n) {
        if (quelle[j] === '\\') { j += 2; continue; }
        if (quelle[j] === c) { j++; break; }
        j++;
      }
      if (texte) leeren(i + 1, Math.max(i + 1, j - 1));
      i = j;
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
