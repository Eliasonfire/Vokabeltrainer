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
 *
 * ⭐ SEIT DEM 30.09.2026 GEHOEREN SEINE DUAS DAZU (data/duas.json, v633).
 * Er am 29.09.2026 (22:52:45): „die duas kannst du für vorschläge nutzen um
 * bessere zu machen. also so wie du ja auch meine auswendig gelernten suren
 * nutzt um bessere eselsbrücken zu machen so kannst du das auch so benutzen
 * damit du weißt was ich auf arabisch auch noch so kann" — und (22:54) „alle
 * dua fotos kann ich 100%".
 *
 * ⛔⛔ Eine Koranstelle, die er NUR aus einer Dua kennt, ist KEIN ganzer Vers.
 * Seine Dua „Auch für Ehegatten" ist der Schluss von 28:24 — den Anfang des
 * Verses (فَسَقَىٰ لَهُمَا …) kennt er nicht. Deshalb zaehlt die Stelle zwar
 * wie ein einzeln abgehakter Vers (sonst meldet Abschnitt 1 von
 * pruefe-eselsbruecken.js „Sure 28 liegt ausserhalb", obwohl er die Worte
 * jeden Tag spricht), steht aber ZUSAETZLICH in `ausDuas`: dort darf nur der
 * Wortlaut der Dua zitiert werden (Abschnitt 9), und anker.mjs durchsucht
 * statt des ganzen Verses nur den Duatext.
 * Kennt er die Stelle ohnehin aus seinem Hifz (20:25 steht in Sure 20, die er
 * abgehakt hat), bleibt sie draussen — dann gilt der ganze Vers.
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
 *   verse      Set<string>   einzeln abgehakte Verse, "Sure:Vers" —
 *                            dazu die Koranstellen seiner Duas
 *   ausDuas    Set<string>   die Stellen darunter, die er NUR aus einer Dua
 *                            kennt (nur deren Wortlaut ist zitierbar)
 *   duas       Array         die Eintraege aus data/duas.json
 *   quelle     'datei' | 'rueckfall'
 *   stand      Datum als Text
 *   alterTage  Zahl oder null
 *   meldungen  string[]      gehoeren IN DIE AUSGABE des Aufrufers
 */
function auswendigLesen(wurzel){
  return mitDuas(hifzLesen(wurzel), wurzel);
}

function hifzLesen(wurzel){
  const datei = path.join(wurzel, 'data', 'auswendig.json');
  const meldungen = [];
  if (fs.existsSync(datei)){
    try {
      const d = JSON.parse(fs.readFileSync(datei, 'utf8'));
      /* ⛔⛔ VEREINIGUNG, nicht Ersetzung — am 24.08.2026 an seinem echten
         Stand gemessen und beinahe falsch gebaut.

         Abgehakt hat er 14 Suren (1, 67, 102-114 ohne 104). Die
         abgeschriebene Liste kennt 24, denn sie enthaelt zusaetzlich seine
         ANSAGE vom 17.08.: „und ein paar mehr noch bis sura duha aber die
         sind nicht ganz richtig gelernt aber sie kann man auch inkludieren."

         Beides sind Aussagen von ihm, und keine widerruft die andere. Haette
         ich die Datei die Liste ERSETZEN lassen, waeren zehn Suren (93-101,
         104) stillschweigend aus seinem Bereich gefallen — und Merkhaken, die
         er kennt, waeren als „ausserhalb" gemeldet worden.

         ⭐ Dasselbe Prinzip wie bei FREIGESCHALTET in js/kern.js: was er
         einmal genannt hat, verliert er nicht, weil ein Haken fehlt.
         Zuruecknehmen ist SEINE Entscheidung, nicht die einer Messung.
         [[kann_ist_nicht_ist]] [[eingefrorenes_feld_ist_kein_zustand]] */
      const ausDatei = new Set((d.suren || []).map(Number).filter(n => n >= 1 && n <= 114));
      const suren = new Set([...ausDatei, ...RUECKFALL_SUREN]);
      const nurAnsage = RUECKFALL_SUREN.filter(s => !ausDatei.has(s));
      if (nurAnsage.length)
        meldungen.push('Sure ' + nurAnsage.join(', ') + ' stehen nicht in seinen Haken,'
          + ' aber in seiner Ansage vom ' + RUECKFALL_STAND + ' — beide zaehlen.');
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

/* ---------- Seine Duas (data/duas.json) ----------

   ⛔ Zitierbar ist NUR `texte` — der Wortlaut aus einer Quelle (Hadith-Ausgabe,
   Ḥiṣn al-Muslim, quran-text.js), per Skript geschnitten. `weitereQuellen`
   stehen nur zum Nachsehen da, und eine Dua mit `alsAnker: false` hat fuer
   SEINE Fassung keinen belegten Wortlaut. */
function duasLesen(wurzel){
  const datei = path.join(wurzel, 'data', 'duas.json');
  const meldungen = [];
  /* ⚠️ Fehlt die Datei, wird das GESAGT — eine stillschweigend kleinere
     Pruefung sieht aus wie eine bestandene. [[werkzeug_misst_kleineren_bestand]] */
  if (!fs.existsSync(datei)){
    meldungen.push('data/duas.json fehlt — seine Duas zaehlen nirgends als Anker.');
    return { duas: [], meldungen, quelle: 'fehlt', stand: null };
  }
  try {
    const d = JSON.parse(fs.readFileSync(datei, 'utf8'));
    const duas = Array.isArray(d.duas) ? d.duas : [];
    if (!duas.length)
      meldungen.push('data/duas.json enthaelt keine Dua — das ist kein Stand, sondern eine leere Datei.');
    return { duas, meldungen, quelle: 'datei', stand: d.stand || 'unbekannt' };
  } catch (e){
    meldungen.push('data/duas.json nicht lesbar (' + e.message + ') — seine Duas zaehlen nicht.');
    return { duas: [], meldungen, quelle: 'kaputt', stand: null };
  }
}

/* Vereinheitlichung fuer den Wortlautvergleich — bewusst SCHMAL: NFC, das
   Leerzeichen, das quran-text.js an 2375 Stellen zwischen Tanwīn-Fatḥa und Alif
   traegt (عِلْمً ا waere sonst zwei Woerter), Satzzeichen, Pausenzeichen des
   Korantextes (U+06D6–U+06DC stehen auf dem Wort, gehoeren aber nicht zu ihm)
   und Leerraum. Jede Ḥaraka bleibt: „woertlich" heisst mit allen Zeichen. */
const TANWIN_LUECKE = new RegExp('ً ا', 'g');
function duaNorm(s){
  return String(s || '').normalize('NFC')
    .replace(TANWIN_LUECKE, 'ًا')
    .replace(/[ۖ-ۜ]/g, '')
    .replace(/[،,.;:!?«»„“”"()]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

/* In welcher Dua steht dieser Lauf WOERTLICH? Ganze Woerter: „رَحْ لَكَ" ist
   kein Treffer in „نَشْرَحْ لَكَ". Mit `stelle` ("28:24") nur die Duas, die
   genau diese Koranstelle tragen. Rueckgabe: die Dua oder null. */
function duaFundstelle(duas, lauf, stelle){
  const gesucht = ' ' + duaNorm(lauf) + ' ';
  if (gesucht.trim() === '') return null;
  for (const d of duas || []){
    if (!d || !d.alsAnker) continue;
    if (stelle && !(d.koranstellen || []).includes(stelle)) continue;
    for (const t of d.texte || [])
      if ((' ' + duaNorm(t.arabisch) + ' ').includes(gesucht)) return d;
  }
  return null;
}

/* Die Koranstellen seiner Duas in den Bereich einfuegen — siehe Kopf. */
function mitDuas(bereich, wurzel){
  const gelesen = duasLesen(wurzel);
  bereich.meldungen.push(...gelesen.meldungen);
  bereich.duas = gelesen.duas;
  bereich.duasStand = gelesen.stand;
  bereich.ausDuas = new Set();
  for (const d of gelesen.duas){
    if (!d || !d.alsAnker) continue;
    for (const k of d.koranstellen || []){
      const m = String(k).match(/^(\d{1,3}):(\d{1,3})$/);
      if (!m){ bereich.meldungen.push('data/duas.json, Dua ' + d.nr + ': Koranstelle „' + k + '" ist keine Sure:Vers-Angabe.'); continue; }
      if (kannStelle(bereich, Number(m[1]), Number(m[2]))) continue;   /* kennt er aus seinem Hifz */
      bereich.verse.add(Number(m[1]) + ':' + Number(m[2]));
      bereich.ausDuas.add(Number(m[1]) + ':' + Number(m[2]));
    }
  }
  return bereich;
}

/* Wie viele Stellen kennt er? Fuer die Ausgabe — eine Zahl ohne ihren Umfang
   ist keine Auskunft. */
function umfang(bereich){
  const nurDua = bereich.ausDuas ? [...bereich.ausDuas] : [];
  const anker = (bereich.duas || []).filter(d => d && d.alsAnker).length;
  return bereich.suren.size + ' Sure(n)'
    + (bereich.verse.size ? ' und ' + bereich.verse.size + ' einzelne Vers(e)' : '')
    + (nurDua.length ? ', davon ' + nurDua.length + ' nur aus seinen Duas (' + nurDua.join(', ') + ')' : '')
    + (bereich.duas ? ' · ' + anker + ' von ' + bereich.duas.length + ' Duas als Anker'
                      + (bereich.duasStand ? ' (data/duas.json, Stand ' + bereich.duasStand + ')' : '') : '');
}

module.exports = { auswendigLesen, kannStelle, umfang, duasLesen, duaNorm, duaFundstelle,
                   RUECKFALL_SUREN, RUECKFALL_STAND };
