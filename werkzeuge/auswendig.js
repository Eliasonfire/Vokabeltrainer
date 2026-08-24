/* auswendig.js -- Elias' auswendiger Koranbereich, aus EINER Quelle.
 *
 * ⛔⛔ WARUM ES DIESE DATEI GIBT (24.08.2026)
 * ==========================================
 * Bis heute stand der Bereich an ZWEI Stellen als fest verdrahtete Liste:
 *
 *     pruefe-eselsbruecken.js:  const AUSWENDIG = new Set([1, 67, 93..114])
 *     werkzeuge/anker.mjs:      derselbe Bereich im Kopfkommentar
 *
 * Beide trugen dazu den Satz „Belegt aus `vt_hifz` (seine eigenen Haekchen im
 * Quran-Leser)". Das beschrieb die HERKUNFT der Zahlen — abgeschrieben am
 * 17.08.2026 —, nicht den Weg. Gelesen hat den Speicher keines von beiden.
 *
 * Die Folge war unsichtbar und ging in seine Richtung schief: Hakt er im
 * Quran-Leser eine weitere Sure ab, aendert sich in den Pruefungen NICHTS.
 * Sein Haken landet im Speicher, wird zwischen seinen Geraeten abgeglichen —
 * und bleibt folgenlos. Eine Eselsbruecke mit einem Vers aus dieser Sure wird
 * weiterhin als „ausserhalb seines auswendigen Bereichs" gemeldet.
 * [[eingefrorenes_feld_ist_kein_zustand]] [[kommentar_beschreibt_absicht_markup_wirkung]]
 *
 * ⛔ NOCH EINE EBENE FEHLTE GANZ: `vt_hifzVerse`. Seit dem 04.08.2026 kann er
 * EINZELNE VERSE abhaken (Schluessel "Sure:Vers"). Kein einziges Werkzeug hat
 * diesen Speicher je gelesen. Wer Vers 2:255 auswendig kann und ihn abhakt,
 * bekam trotzdem „Sure 2 liegt ausserhalb" zu hoeren.
 *
 * ⚠️ CommonJS und nicht ESM, damit BEIDE Seiten es laden koennen:
 * pruefe-eselsbruecken.js arbeitet mit `require`, anker.mjs mit `import`.
 * Aus einer .mjs waere es fuer die erste unerreichbar gewesen — und dann
 * haette es wieder zwei Fassungen gegeben.
 */
const fs = require('fs');
const path = require('path');

/* ⛔ DER RUECKFALL, und warum er LAUT ist.
   Liegt keine Datei vor, gilt der Stand vom 17.08.2026 — sonst faellt die
   Pruefung ganz aus. Aber sie sagt es dann auch: eine stille Rueckfallliste
   ist nicht pruefbar, weil sie immer gruen aussieht.
   [[rueckfallliste_nur_ohne_hauptquelle_pruefbar]] */
const RUECKFALL_SUREN = [1, 67, ...Array.from({ length: 22 }, (_, i) => 93 + i)];
const RUECKFALL_STAND = '17.08.2026';

/* Wie alt darf der Abzug sein? Dieselben 8 Tage wie beim Kapitelstand und beim
   Geraeteabgleich — zwei verpasste Wartungslaeufe. */
const GRENZE_TAGE = 8;

function tageSeit(deutschesDatum){
  const dm = String(deutschesDatum || '').match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!dm) return null;
  return Math.floor((Date.now() - new Date(+dm[3], +dm[2] - 1, +dm[1]).getTime()) / 86400000);
}

/* Liest den auswendigen Bereich.
 *
 * Rueckgabe:
 *   suren      Set<number>   ganz abgehakte Suren
 *   verse      Set<string>   einzeln abgehakte Verse, "Sure:Vers"
 *   quelle     'datei' | 'rueckfall'
 *   stand      Datum als Text
 *   alterTage  Zahl oder null
 *   meldungen  string[]      gehoeren IN DIE AUSGABE des Aufrufers
 */
function auswendigLesen(wurzel){
  const datei = path.join(wurzel, 'data', 'auswendig.json');
  const meldungen = [];
  if (fs.existsSync(datei)){
    try {
      const d = JSON.parse(fs.readFileSync(datei, 'utf8'));
      const suren = new Set((d.suren || []).map(Number).filter(n => n >= 1 && n <= 114));
      const verse = new Set(d.verse || []);
      const alter = tageSeit(d.geholt);
      if (alter === null)
        meldungen.push('data/auswendig.json: wann geholt, steht nicht lesbar da ("'
          + (d.geholt || '') + '") — das Alter dieses Abzugs ist unbekannt.');
      else if (alter > GRENZE_TAGE)
        meldungen.push('data/auswendig.json ist ' + alter + ' Tage alt (mehr als zwei'
          + ' Wartungslaeufe) — seither abgehakte Suren fehlen hier.');
      /* ⛔ Eine leere Datei ist KEIN gueltiger Stand: sie saehe aus wie „er kann
         nichts auswendig" und wuerde jede Koranstelle beanstanden. Dann lieber
         der Rueckfall, und zwar mit Ansage. [[leere_liste_ist_keine_messung]] */
      if (!suren.size && !verse.size){
        meldungen.push('data/auswendig.json enthaelt WEDER Sure noch Vers —'
          + ' das ist kein Stand, sondern ein leerer Abzug. Rueckfall auf ' + RUECKFALL_STAND + '.');
        return rueckfall(meldungen);
      }
      return { suren, verse, quelle: 'datei', stand: d.geholt || 'unbekannt',
               alterTage: alter, meldungen };
    } catch (e){
      meldungen.push('data/auswendig.json nicht lesbar (' + e.message + ') — Rueckfall auf ' + RUECKFALL_STAND + '.');
      return rueckfall(meldungen);
    }
  }
  meldungen.push('data/auswendig.json fehlt — es gilt der abgeschriebene Stand vom '
    + RUECKFALL_STAND + '. Neu holen: node werkzeuge/vorrat.mjs --stand <datei> --app auto');
  return rueckfall(meldungen);
}

function rueckfall(meldungen){
  return { suren: new Set(RUECKFALL_SUREN), verse: new Set(),
           quelle: 'rueckfall', stand: RUECKFALL_STAND, alterTage: null, meldungen };
}

/* Kann er DIESE Stelle auswendig?
 *
 * ⚠️ Zwei Ebenen, und die Sure gewinnt: ist sie ganz abgehakt, zaehlt jeder
 * ihrer Verse — auch wenn kein Einzelhaken existiert. Umgekehrt reicht ein
 * einzelner Vers NICHT fuer die ganze Sure.
 *
 * ⚠️ Ohne Versangabe wird nach der Sure allein gefragt. Dann zaehlt auch ein
 * einzeln abgehakter Vers daraus: wer 2:255 kann, kennt die Woerter aus 2:255
 * — und mehr behauptet der Aufrufer an dieser Stelle nicht.
 */
function kannStelle(bereich, sure, vers){
  const s = Number(sure);
  if (bereich.suren.has(s)) return true;
  if (vers === undefined || vers === null)
    return [...bereich.verse].some(k => k.startsWith(s + ':'));
  return bereich.verse.has(s + ':' + Number(vers));
}

/* Wie viele Stellen kennt er? Fuer die Ausgabe — eine Zahl ohne ihren Umfang
   ist keine Auskunft. */
function umfang(bereich){
  return bereich.suren.size + ' Sure(n)'
    + (bereich.verse.size ? ' und ' + bereich.verse.size + ' einzelne Vers(e)' : '');
}

module.exports = { auswendigLesen, kannStelle, umfang, RUECKFALL_SUREN, RUECKFALL_STAND };
