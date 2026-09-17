/* langenscheidt.mjs — den PLURAL eines arabischen Wortes bei Langenscheidt
 * nachschlagen. Dritte Belegquelle neben arabdict und Reverso.
 *
 * ================== WOZU ===================================================
 *
 * Elias am 07.09.2026: „ja mach das mit langenscheidt für die plurale aber
 * füge das zu to do hinzu, nicht jetzt bearbeiten." Am selben Tag, 03:55, dann
 * die Freigabe zum Bauen: „guck ob du noch weitere aufgaben findest und wenn
 * nicht dann guck nach aufgaben die du erledigen kannst also zusätzlich noch."
 *
 * `pl` ist die größte offene Feldlücke: **25** Wörter im Fenster
 * (`node werkzeuge/vorrat.mjs`, gemessen 07.09.2026 03:54). Ohne `pl` fehlt die
 * eigene Pluralkarte mit eigenem Fortschritt — und niemand merkt es.
 *
 * ⭐ Der Abruf geht OHNE Browser: ein gewöhnlicher `fetch` mit Browser-Kennung
 * bekommt HTTP 200. Reverso weist genau das mit 403 ab und braucht ein echtes
 * Fenster; Langenscheidt ist darin genügsamer.
 *
 * ⛔⛔ ES TRÄGT NICHTS EIN. Es liefert Belege, die neben Elias' Wartungsfrage
 * stehen. Eingetragen wird nur, was er antippt. Goal E.1.
 *
 * ================== ⛔ DREI GEMESSENE GRENZEN ==============================
 *
 * Alle drei am 07.09.2026 an **20** echten Seiten gemessen, nicht angenommen.
 *
 * 1. SCHWEIGEN IST KEIN BELEG FÜR „GIBT ES NICHT".
 *    Die To-Do hielt سكر (Zucker) für den wertvollsten Fall: kein Plural, und
 *    die Quelle schweige richtigerweise. Gemessen schweigt sie aber genauso
 *    bei مهندس (Ingenieur, Plural مهندسون), سيارة (Auto, سيارات) und شاي.
 *    Null Treffer hat also zwei Ursachen, die die Quelle nicht unterscheidet.
 *    Deshalb liefert dieses Werkzeug NIE ein „hat keinen Plural".
 *    [[kennzeichen_mit_zwei_ursachen]]
 *
 * 2. HOMOGRAPHEN KANN ES NICHT TRENNEN.
 *    رجل liefert رجال UND أرجل — die Plurale von ZWEI Wörtern: رَجُل („Mann")
 *    und رِجْل („Bein"). Ebenso كتاب → كتب (Buch) und كتاتيب (Plural von
 *    كُتَّاب, der Koranschule), عين → عيون / أعيان.
 *    Langenscheidts Lemmata tragen KEIN Taschkīl, der Nacktvergleich kann sie
 *    also grundsätzlich nicht auseinanderhalten.
 *    ⛔ Daraus folgt die harte Regel unten: **genau EIN Plural, sonst nichts.**
 *    Bei mehreren steht die Fundstelle im Bericht, und Elias sieht selbst nach.
 *    [[skelettvergleich_wirft_information_weg]]
 *
 * 3. DIE BEDEUTUNG STEHT NICHT VERLÄSSLICH DANEBEN.
 *    Der naheliegende Ausweg aus Punkt 2 wäre, jeden Plural mit der deutschen
 *    Bedeutung seines Eintrags zu belegen. Gemessen: bei sieben Wörtern fand
 *    sich die Übersetzung nur in **drei** von zwölf Fällen, und zweimal
 *    gehörte sie zum falschen Eintrag. Der Weg ist damit zu.
 *
 * ================== ⛔ WARUM DAS LEMMA IM BLOCK STEHEN MUSS ================
 *
 * Der erste Versuch suchte vom Plural aus RÜCKWÄRTS nach dem nächsten Lemma.
 * Gemessen lieferte das für رجال das Lemma „استرجل" — ein ganz anderes Wort
 * aus einem früheren Eintrag. Ein Beleg zum falschen Wort ist schlimmer als
 * gar keiner: er stünde neben der Frage und sähe geprüft aus.
 *
 * Deshalb wird nur INNERHALB eines Blocks gelesen, der beides trägt:
 *
 *   <div class="search-term">  …<h3>بيت</h3>…            <span class="flex">بيوت</span>
 *   <div class="mobile parts"> <span class="lemma-pieces">بيت</span> … <span class="flex">بيوتات</span>
 *
 * [[treffer_und_fundstelle_trennen]] [[stichworttreffer_ist_kein_inhaltstreffer]]
 *
 * Aufruf:
 *   node werkzeuge/langenscheidt.mjs بيت قلم ماء
 */

const BASIS = 'https://de.langenscheidt.com/arabisch-deutsch/';
/* Ohne Browser-Kennung antwortet die Seite nicht wie im Browser. */
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
         + '(KHTML, like Gecko) Chrome/128.0 Safari/537.36';

const HARAKAT = /[ً-ْٰـ]/g;

/** Nackte Vergleichsform: ohne Ḥarakāt, Hamza-Träger und ة/ى vereinheitlicht.
 *  ⚠️ Absichtlich dieselbe Form wie in `arabdict.mjs` — zwei Fassungen
 *  derselben Normalisierung wären zwei Wahrheiten. */
export function nackt(s) {
  return String(s || '').normalize('NFC').replace(HARAKAT, '')
    .replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').trim();
}

/** ⛔⛔ FÜR DIE URL DARF NICHT `nackt()` GENOMMEN WERDEN.
 *
 * `nackt()` vereinheitlicht ة → ه und أ → ا, damit der VERGLEICH über
 * Schreibvarianten hinweg trägt. In der Adresse ist dasselbe ein anderes Wort:
 * am 07.09.2026 fragte der erste Lauf `اربعه` statt `أربعة` ab und bekam eine
 * leere Seite — woraus fälschlich „Langenscheidt kennt أَرْبَعَةٌ nicht" wurde.
 * Acht von neun Zahlwörtern gingen bei den anderen Quellen durch, eines nicht:
 * genau dieser Widerspruch hat den Fehler aufgedeckt.
 *
 * Für die Abfrage bleiben die Buchstaben also stehen; nur die Ḥarakāt fallen
 * weg, weil Langenscheidts Lemmata keine tragen.
 * [[gleiche_messreihe_falsche_ursache]] [[skelettvergleich_wirft_information_weg]]
 */
export function fuerDieAbfrage(s) {
  return String(s || '').normalize('NFC').replace(HARAKAT, '').trim();
}

/* Ein Block, der Lemma UND Flexionsangaben zusammen trägt. Die Längengrenze
   ist Absicht: sie hält den Block bei seinem eigenen Eintrag. */
const BLOCK = /<div class="(?:search-term|mobile parts)">([\s\S]{0,1200}?)<\/div>/g;
const LEMMA = /<h3[^>]*>([\s\S]*?)<\/h3>|<span class="lemma-pieces">([^<]*)<\/span>/;
/* Die Marke steht als arabischer Titel im abbr; danach folgt der Wert im
   span.flex. Die beiden schließenden spans dazwischen gehören zur
   abbr-Verschachtelung und sind nicht wegzulassen. */
const PLURAL = /<abbr title="جمع \| Plural">[^<]*<\/abbr>\s*<\/span>\s*<\/span>\s*<span class="flex">\s*([^<]*?)\s*<\/span>/g;

/* ⛔ 17.09.2026: WEITERE PLURALE NACH „u.". Bei قهوة steht
     pl قهوة [qahaˈwaːt], u. قهاو [qaˈhaːwin/iː]
   PLURAL oben fängt nur den ersten Wert — der zweite Plural fiel still weg,
   und aus zwei Pluralen wurde ein „eindeutiger". Gesucht wird nur innerhalb
   derselben Angabe <…>, also bis zum schließenden &gt;. */
const UND = /<abbr title="و \| und">[^<]*<\/abbr>\s*<\/span>\s*<\/span>\s*<span class="flex">\s*([^<]*?)\s*<\/span>/g;

/**
 * Wertet eine bereits geholte Seite aus. Getrennt vom Abruf, damit der Test
 * gegen echtes, festgehaltenes HTML laufen kann statt gegen das Netz.
 *
 * @param {string} html   die Seite
 * @param {string} wort   wonach gesucht wurde
 * @returns {{plurale: string[], verworfen: {grund: string, plural: string}[], zweifel: boolean}}
 */
export function pluraleAus(html, wort) {
  const plurale = [], verworfen = [];
  let zweifel = false;
  const ziel = nackt(wort);

  for (const b of String(html || '').matchAll(BLOCK)) {
    const inhalt = b[1];
    const gefunden = [];
    for (const m of inhalt.matchAll(PLURAL)) {
      gefunden.push(m[1].trim());
      const rest = inhalt.slice(m.index + m[0].length);
      const ende = rest.indexOf('&gt;');
      for (const u of (ende < 0 ? rest : rest.slice(0, ende)).matchAll(UND)) gefunden.push(u[1].trim());
    }
    if (!gefunden.filter(Boolean).length) continue;

    const m = inhalt.match(LEMMA);
    const lemma = ((m && (m[1] || m[2])) || '').trim();

    for (const pl of gefunden.filter(Boolean)) {
      if (!lemma) { verworfen.push({ grund: 'kein Lemma im Block', plural: pl }); continue; }
      /* ⛔ Wortgruppen gar nicht erst annehmen — der Plural gehört dann zur
         Gruppe, nicht zum Wort. Am 07.09. an 20 Seiten NULL Mal aufgetreten;
         die Schranke ist deshalb im Test mit einem eigenen Störfall belegt,
         nicht mit einem Fund aus dem Bestand. */
      if (/\s/.test(lemma)) { verworfen.push({ grund: 'Wortgruppe „' + lemma + '"', plural: pl }); continue; }
      if (nackt(lemma) !== ziel) { verworfen.push({ grund: 'anderes Wort „' + lemma + '"', plural: pl }); continue; }
      /* ⛔ 17.09.2026: EIN „PLURAL", DER DAS WORT SELBST IST, IST KEIN BELEG.
         Bei قهوة steht im arabischen Feld „قهوة", die Umschrift daneben sagt
         [qahaˈwaːt] — dem Feld fehlt das ات. So stand „Plural: قهوة" in
         data/woerterbuch-belege.json, bereit für seine Fragenseite. Und weil
         ein Plural dieses Eintrags unleserlich ist, sind auch die übrigen kein
         eindeutiger Beleg mehr (`zweifel`). */
      if (nackt(pl) === ziel) {
        verworfen.push({ grund: 'Plural gleich dem Wort — unleserlich, kein Beleg', plural: pl });
        zweifel = true;
        continue;
      }
      if (!plurale.includes(pl)) plurale.push(pl);
    }
  }
  return { plurale, verworfen, zweifel };
}

/**
 * Schlägt ein Wort nach und liefert den Plural NUR, wenn er eindeutig ist.
 *
 * @returns {{wort, url, plural: string|null, alle: string[], eindeutig: boolean,
 *            grund: string, verworfen: Array, status: number}}
 */
export async function schlageNach(wort, holen = fetch) {
  const url = BASIS + encodeURIComponent(fuerDieAbfrage(wort));
  const r = await holen(url, { headers: { 'user-agent': UA } });
  const html = await r.text();
  const { plurale, verworfen, zweifel } = pluraleAus(html, wort);

  let plural = null, eindeutig = false, grund;
  if (zweifel) {
    grund = 'ein Plural der Quelle ist gleich dem Wort (unleserlich) — die übrigen ('
          + (plurale.join(' · ') || 'keine') + ') sind dann kein eindeutiger Beleg';
  }
  else if (plurale.length === 1) { plural = plurale[0]; eindeutig = true; grund = 'genau ein Plural'; }
  else if (plurale.length === 0) {
    /* ⛔ NICHT „hat keinen Plural" — siehe Grenze 1 im Kopf. */
    grund = 'die Quelle nennt keinen — das heißt NICHT, dass es keinen gibt';
  } else {
    grund = plurale.length + ' verschiedene Plurale (' + plurale.join(' · ')
          + ') — können zu verschiedenen Wörtern gehören, das ist kein Beleg';
  }
  return { wort, url, plural, alle: plurale, eindeutig, grund, verworfen, status: r.status };
}

/* ---------- Aufruf von der Kommandozeile ---------- */
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`
 || import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  const woerter = process.argv.slice(2);
  if (!woerter.length) {
    console.log('Aufruf: node werkzeuge/langenscheidt.mjs <wort> [<wort> …]');
  } else {
    for (const w of woerter) {
      try {
        const r = await schlageNach(w);
        console.log(w + '  HTTP ' + r.status);
        console.log('   ' + (r.eindeutig ? '✔ ' + r.plural : '– ' + r.grund));
        for (const v of r.verworfen) console.log('   ⛔ ' + v.plural + ': ' + v.grund);
        console.log('   ' + r.url);
      } catch (e) { console.log(w + '  FEHLER ' + e.message); }
      await new Promise(x => setTimeout(x, 900));
    }
  }
}
