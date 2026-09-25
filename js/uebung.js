/* uebung.js -- Uebungsmodi im Satz-Modus
   Teil der App-Logik; wird in index.html in fester Reihenfolge geladen und
   teilt sich mit den uebrigen js/-Dateien den globalen Namensraum.

   ===================== Warum es dieses Modul gibt =====================
   Der Satz-Modus konnte bisher nur ZEIGEN. Elias' Wunsch vom 29.07.2026 war
   ein Modus, in dem er selbst antworten muss - "eine Uebung, wo man das Wort
   antippen muss". Am 30.07. hat er meinem Einwand widersprochen, man solle
   erst mehr Material sammeln:

     "man kann ja immer Saetze und weitere Vokabeln hinzufuegen, aber dass das
      Geruest erstmal gebaut ist waere das Wichtigste. Du sollst schon bauen."

   Also alle dreizehn, auch die duennen. Gezaehlt wird trotzdem, aber als
   AUSKUNFT: jeder Modus zeigt seine Fragenzahl am Reiter, und einer ohne
   Fragen sagt das ehrlich statt ins Leere zu laufen.

   ===================== Bauform =====================
   Ein neuer Modus ist ein EINTRAG in UEBUNGEN, kein Umbau - Elias' Auflage,
   dieselbe wie beim Themenfilter. Jeder Eintrag sagt nur, wie die Frage
   lautet, welche Wortstellen richtig sind und welche Antworten zur Wahl
   stehen. Anzeige, Klick, Rueckmeldung und Zaehler macht der gemeinsame
   Ablauf darunter, EINMAL.

   Drei Arten:
     'tippen'   ein Wort im Satz antippen, sofort ausgewertet — seit 16.09.2026
                von keiner Uebung mehr benutzt: es verriet, dass es genau eines ist
     'mehrfach' alle richtigen Woerter antippen, dann pruefen
     'wahl'     ein Wort ist hervorgehoben (oder verdeckt), Antwort auf Knoepfen

   ===================== Woher die Wahrheit kommt =====================
   Fast alles aus `analysiereSatz()` in js/irab.js: je Wort Satzrolle,
   erwarteter Fall, gelesene Endung. Dazu die Markierungen (SENTENCE_TAGS) fuer
   die Regelfrage und das Genusfeld der Vokabeln.

   ⚠️ Nichts wird erfunden (E.1). Wo die Analyse eine Rolle nicht sicher kennt,
   entsteht KEINE Frage - lieber ein Modus mit weniger Fragen als eine Frage
   mit falscher Antwort. Deshalb steht in `baue` ueberall `erwartet` bzw.
   `stimmt !== false` als Bedingung.

   ⚠️ Zaehlt NICHT in die Leitner-Boxen. Elias' Entscheidung vom 29.07.2026:
   die Boxen gehoeren dem Vokabelwissen, eine Grammatikuebung wuerde sie
   verwaessern. Der Zaehler hier gilt nur fuer die laufende Sitzung.
   ===================================================================== */

/* ---------- Nachschlagewerk: Wortform im Satz -> Vokabeleintrag ----------
   Gebraucht fuer Genus (Modus 11) und die weibliche Form (Modus 13).

   Drei Fassungen hat es gebraucht, und alle drei Fehlgriffe waren derselbe:
   ZU VIEL abgezogen - dieselbe Falle wie bei der Wortfeld-Suche.

   1. Ohne Vokalzeichen verglichen: الْمَدْرَسَةِ (Schule) landete auf
      مُدَرِّسَةٌ (Lehrerin), denn blank sind beide "مدرسة". Also MIT Taschkil.
   2. Angeschriebene Partikeln blind abgezogen: فَمٌ (Mund) wurde zu "م", weil
      das فَ als Anknuepfung galt; مَا (was) ebenfalls, weil das lange ا als
      Akkusativ-Alif galt. Deshalb wird die Form ERST so nachgeschlagen, wie
      sie ist, und nur wenn das nichts findet, Stueck fuer Stueck abgezogen.
   3. Den Artikel auch auf der DATENSEITE abgezogen: الْيَوْمُ (heute) und
      يَوْمٌ (Tag) fielen zusammen. Bei الْيَوْمُ gehoert der Artikel zum
      Eintrag - abgezogen wird nur an der Form aus dem Satz.

   Am 30.07.2026 gemessen: 335 Formen aus 171 Vokabeln, 530 der 732
   Wortvorkommen in den 186 Saetzen aufgeloest, eine Doppelung (أُخْت ist
   eigener Eintrag UND weibliche Form von أَخٌ; der eigene Eintrag gewinnt,
   weil `ar` zuerst eingetragen wird). Die nicht aufgeloesten stehen wirklich
   nicht im Wortschatz: هَذَا, ذَلِكَ, die Pronomen, die Fachbegriffe. */

/* Nur die Kasusendung abziehen. Das Alif nach Fathatan gehoert dazu
   (إِمَامًا), ein blankes Alif am Wortende NICHT (مَا, هُنَا).
   ⚠️ Die Endung kann VOR einem Schadda stehen: in قِطٌّ ist die Reihenfolge
   ط + Dammatan + Schadda, letztes Zeichen ist also das Schadda. Das ist die
   kanonische Unicode-Reihenfolge (Schadda hat die hoehere kombinierende
   Klasse), kein Datenfehler - aber ein `[Endung]$` trifft dann nichts. Genau
   daran ist الْقِطُّ zuerst durchgefallen. */
function uebungOhneEndung(s){
  return String(s || '').replace(/[.،؟!«»:؛]/g, '').trim()
    .replace(/ًا$/, '')
    .replace(/[ًٌٍَُِْ](ّ?)$/, '$1');
}

/* Kandidaten aus einer Form IM SATZ, von der wortgetreuesten zur kuehnsten.
   ⚠️ Ein Schadda direkt hinter dem ersten Buchstaben kann es im Arabischen
   nicht geben - ein Wort faengt nie mit einem verdoppelten Laut an. Es ist
   immer das assimilierte Lam des Artikels vor einem Sonnenbuchstaben
   (الطَّبِيبُ = اَل + طَبِيب). Deshalb darf es weg. */
function uebungKandidaten(wort){
  const roh = uebungOhneEndung(wort);
  const k = [roh];
  k.push(roh.replace(/^أ[َ]?(?=[هأ])/, ''));           // Fragepartikel أَهَذَا
  const ohneUF = roh.replace(/^[وف][َُِ]?/, '');
  if (ohneUF !== roh) k.push(ohneUF);
  [roh, ohneUF].forEach(basis=>{
    const ohneAl = basis.replace(/^[اأ][َِ]?ل[ْ]?/, '');
    if (ohneAl !== basis){
      k.push(ohneAl);
      k.push(ohneAl.replace(/^(.[ًٌٍَُِْ]?)ّ/, '$1'));
    }
  });
  return [...new Set(k.filter(Boolean))];
}

let UEBUNG_LEX = null;
function uebungLexikon(){
  if (UEBUNG_LEX) return UEBUNG_LEX;
  UEBUNG_LEX = new Map();
  const eintragen = (form, w)=>{
    if (!form) return;
    String(form).split(/\s*[|/]\s*/).filter(Boolean).forEach(einzel=>{
      const k = uebungOhneEndung(einzel);
      if (k && !UEBUNG_LEX.has(k)) UEBUNG_LEX.set(k, w);
    });
  };
  /* `ar` in einem eigenen Durchgang zuerst: ein Wort, das selbst Vokabel ist,
     schlaegt die femSg-Angabe einer anderen Vokabel. */
  VOCAB_DATA.forEach(w=>eintragen(w.ar, w));
  VOCAB_DATA.forEach(w=>{ eintragen(w.sg, w); eintragen(w.femSg, w); eintragen(w.pl, w); });
  return UEBUNG_LEX;
}
function uebungVokabel(wort){
  const lex = uebungLexikon();
  for (const k of uebungKandidaten(wort)) if (lex.has(k)) return lex.get(k);
  return null;
}

/* ---------- Wortart, korrigiert nach Elias' Unterricht ----------
   ⚠️ NICHT das `type`-Feld des Abzugs nehmen. arabicroots fuehrt تَحْتَ und
   هُنَا als `particle`; Elias' Unterricht nennt sie ausdruecklich Nomen
   (`wortarten-01`, Folge 08 ca. 24:41: "Deshalb zaehlen im Arabischen auch
   Adjektive, Adverbien, Ortsangaben und die Hinweiswoerter … als Nomen").
   Die Ansicht folgt dem Unterricht, der Abzug bleibt unangetastet - dieselbe
   Entscheidung wie bei den Wortfeldern, siehe wortfelder-data.js.

   نَعَمْ und لَا behandelt der Unterricht nicht. Sie bleiben حَرْف, weil
   nichts anderes belegbar waere. */
const UEBUNG_ZARF_ALS_ISM = ['تحت','هنا','هناك','الآن','امام','أمام','خلف','فوق','بين','عند','بعد','قبل'];
function uebungWortart(wort){
  const blank = String(wort||'').replace(/[ً-ْٰـ]/g,'').replace(/[.،؟!«»:؛]/g,'').replace(/^[وف]/,'');
  if (UEBUNG_ZARF_ALS_ISM.includes(blank)) return 'اِسْم';
  const t = (typeof wortart === 'function') ? wortart(wort) : null;
  if (!t) return null;
  if (t === 'verb') return 'فِعْل';
  if (t === 'particle' || t === 'grammar') return 'حَرْف';
  return 'اِسْم';
}

/* Wort ohne Zeichen und ohne Artikel — fuer die Frage „endet es auf ة?".
   Nicht `wortKern`: der wird zum VERGLEICHEN gebraucht und darf hier nicht
   die Endung mitnehmen. */
const uebungNackt = s => String(s||'')
  .replace(/[.،؟!«»:؛]+$/,'').replace(/[ً-ْٰـ]/g,'').replace(/^(?:وَ?|فَ?)?(?:ال|أل)/,'');

/* ⛔⛔ DER NAME DER RICHTIGEN ANTWORT DARF DAS GEFRAGTE WORT NICHT NENNEN.

   Elias am 06.09.2026 zu Uebung 10 an تِلْكَ, wo „تِلْكَ (jene)" zur Wahl
   stand: „man kann hier die antwort direkt schon sehen. entweder sind die
   antwortmoeglickeiten schlecht gewaehlt oder diese spezifische regel bzw
   frageform ist nicht gut umgesetzt und man muesste aendern oder raus nehmen
   aber so ist ja keine uebung."

   Er hat recht, und der Hinweis unter der Frage behauptete sogar das
   Gegenteil: „es reicht nicht, den Namen zu erkennen." Gemessen ueber alle
   387 Aufgaben: bei 85 traegt der Name der richtigen Regel das hervorgehobene
   Wort, und bei 70 davon traegt es KEIN Ablenker — die Aufgabe ist durch
   blosses Abgleichen loesbar, ohne die Regel zu kennen.

   ⛔ Bessere Ablenker koennen das nicht heilen: fuer 37 der 85 nennt im
   ganzen Bestand ueberhaupt keine zweite Regel dieses Wort, fuer 27 genau
   eine. Nur ein einziger Fall haette zwei. Deshalb wird die Aufgabe nicht
   gebaut, statt sie mit einer Notloesung zu retten.
   [[prueffrage_muss_scheitern_koennen]] */
const uebungOhneZeichen = s => String(s || '')
  .replace(/[ً-ْٰـ]/g, '').replace(/[.،؟!«»:؛]/g, '').trim();

function uebungHervorWorte(z, von, bis){
  const out = [];
  for (let i = von; i <= bis && i < z.length; i++){
    const roh = uebungOhneZeichen((z[i] || {}).wort);
    if (!roh) continue;
    out.push(roh);
    /* Mit UND ohne Artikel: im Satz steht الْفَتَاةُ, die Regel heisst فَتَاة. */
    const ohneAl = roh.replace(/^(?:و|ف)?(?:ال|أل)/, '');
    if (ohneAl !== roh && ohneAl.length >= 2) out.push(ohneAl);
    /* ⛔ UND OHNE PRONOMENSUFFIX (06.09.2026, nachgemessen).
       Die Wortpruefung verglich nur ganze Woerter. Im Satz steht aber
       عِنْدِي, und die Regel heisst „لِ oder عِنْدَ?" — für mich zwei
       verschiedene Zeichenketten, für einen Lesenden dasselbe Wort. Genau
       ein Fall im Bestand, aber es ist derselbe Verrat, den Elias gemeldet
       hat. Der Stamm muss drei Zeichen behalten, sonst trifft er alles. */
    for (const suf of ['كما','كم','كن','هما','هم','هن','ها','نا','ي','ك','ه']){
      if (!ohneAl.endsWith(suf)) continue;
      const stamm = ohneAl.slice(0, -suf.length);
      if (stamm.length >= 3) out.push(stamm);
      break;
    }
  }
  return out.filter(w => w.length >= 2);
}

function uebungNameNennt(rule, worte){
  const n = uebungOhneZeichen(rule && (rule.name || rule.text));
  return !!n && worte.some(w => n.includes(w));
}

/* ⛔⛔ WORAN richtet sich die Form? — und die ehrliche Antwort „an nichts".

   Elias am 06.09.2026, nachdem die Genus-Uebung سَهْلَةٌ als maennlich
   gewertet hatte: „du sollst ja nicht nur dieses eine einzige wort verbessern
   sondern der fehler soll nicht mehr da sein."

   Beim Nachmessen ueber alle Aufgaben kam derselbe Fehler ein zweites Mal
   heraus, in Uebung 13: bei „هَذِهِ سَيَّارَةُ الْمُدِيرِ" stand als Begruendung
   „Es richtet sich nach سَيَّارَةُ." — das tut es nicht. الْمُدِيرِ ist
   مُضَاف إِلَيْه und traegt sein Geschlecht selbst; der Direktor kann eine
   Direktorin sein, ohne dass am Satz irgendetwas falsch waere. Wer der
   angegebenen Begruendung folgt, waehlt مُدِيرَةٌ und bekommt „falsch".

   Deshalb gibt diese Funktion `null` zurueck, wenn es KEIN Bezugswort gibt.
   Wer sie benutzt, baut die Aufgabe dann gar nicht erst. Gemessen am
   06.09.2026: 31 der 199 Aufgaben von Uebung 13 waren so nicht loesbar
   (16 مُبْتَدَأ am Satzanfang, 11 مُضَاف إِلَيْه, 3 nach حَرْف جَرّ, 1 فَاعِل).
   [[form_sagt_nicht_welche_beziehung]] */
/* Ist DIESE Wortform im Satz weiblich? — dieselbe Frage, die Uebung 11 stellt,
   hier als eigener Baustein, damit die Antwort an beiden Stellen gleich
   ausfaellt. [[entscheidung_gilt_fuer_das_zweite_werkzeug]] */
function uebungIstWeiblichImSatz(wort){
  const form = String(wort || '').replace(/[.،؟!«»:؛]+$/, '');
  /* Die Hinweiswoerter tragen ihr Geschlecht im Wort selbst und stehen in den
     Daten ohne `gender` — ohne diese vier Zeilen gilt ausgerechnet das
     haeufigste Bezugswort als „unbekannt". */
  const h = uebungNackt(form);
  if (h === 'هذه' || h === 'هٰذه' || h === 'تلك') return true;
  if (h === 'هذا' || h === 'هٰذا' || h === 'ذلك') return false;
  const v = uebungVokabel(form);
  if (!v) return null;
  const gleich = (a, b) => a && b && wortKern(a) === wortKern(b);
  if (gleich(form, v.femSg) || gleich(form, v.femPl)) return true;
  if (!gleich(form, v.ar) && !gleich(form, v.sg)
      && /ة$/.test(uebungNackt(form)) && !/ة$/.test(uebungNackt(v.ar))) return true;
  if (!v.gender) return null;
  return v.gender === 'feminine';
}

function uebungBezugswort(z, i, weiblich){
  const rolle = String((z[i] || {}).rolle || '');
  /* ⛔ Und das Gefundene wird GEGENGEPRUEFT, bevor es genannt wird.

     Bei „لِي أَخٌ وَاحِدٌ اسْمُهُ أُسَامَةُ، وَلِي أُخْتٌ وَاحِدَةٌ …" liest der
     Iʿrāb-Erklaerer alles ab dem zweiten Wort als خَبَر — die Suche nach dem
     مُبْتَدَأ landet deshalb ueber die Satzgrenze hinweg bei أَخٌ, obwohl
     وَاحِدَةٌ zu أُخْتٌ gehoert. Die erste Fassung schrieb dann „hier weiblich
     wegen أَخٌ", also die weibliche Form begruendet mit einem maennlichen
     Wort. Ein Bezug, der der eigenen Antwort widerspricht, wird verschwiegen,
     nicht behauptet. [[vergleichsfunktion_widerspricht_sich]] */
  /* ⚠️ „unbekannt" ist NICHT „widerspricht". Die erste Fassung warf beides in
     einen Topf und verwarf damit 164 richtige Bezuege — allen voran هَذَا,
     das haeufigste Bezugswort ueberhaupt. Verworfen wird nur, was dem eigenen
     Ergebnis nachweislich widerspricht. [[kennzeichen_mit_zwei_ursachen]] */
  const passt = w => {
    if (!w) return false;
    if (weiblich == null) return true;
    const f = uebungIstWeiblichImSatz(w);
    return f == null || f === weiblich;
  };
  /* نَعْت richtet sich nach dem Wort davor — ueber weitere نَعْت hinweg, denn
     „بَيْتٌ جَمِيلٌ وَنَظِيفٌ": نَظِيفٌ gehoert zu بَيْتٌ, nicht zu جَمِيلٌ. */
  if (/نَعْت/.test(rolle)){
    for (let k = i - 1; k >= 0; k--){
      if (!/نَعْت/.test(String((z[k]||{}).rolle||''))){
        const w = (z[k]||{}).rein || null;
        return passt(w) ? w : null;
      }
    }
    return null;
  }
  /* خَبَر richtet sich nach dem مُبْتَدَأ — und der wird BENANNT, nicht der
     linke Nachbar: bei „الطَّالِبُ الْجَدِيدُ جَالِسٌ" waere das sonst
     الْجَدِيدُ, also ein نَعْت statt des Satzgegenstands. */
  if (/خَبَر/.test(rolle)){
    for (let k = i - 1; k >= 0; k--){
      if (/مُبْتَدَأ/.test(String((z[k]||{}).rolle||''))){
        const w = (z[k]||{}).rein || null;
        return passt(w) ? w : null;
      }
    }
    return null;
  }
  return null;
}

/* ---------- Antwortvorraete ----------
   Einmal hier, damit dieselbe Frage in mehreren Modi gleich heisst. */
/* ⭐ FACHBEGRIFFE MIT ENDUNG (16.09.2026). Elias, gefragt „Sollen Fachbegriffe
   mit Endung stehen, also حَرْفُ جَرٍّ statt حَرْف جَرّ, so wie auf deiner
   Regelkarte?": „ja". Jede Form unten steht so in seinem eigenen Material
   (gezählt über vocab-data.js, grammar-data.js, regelsammlung-data.js,
   data/beispielsaetze.js, data/eselsbruecken.js und die Buchabzüge):
   مَرْفُوعٌ 8× · مَجْرُورٌ 22× · مَنْصُوبٌ 7× · مُبْتَدَأٌ 9× · خَبَرٌ 3× ·
   نَعْتٌ 7× · مُضَافٌ 10× · مُضَافٌ إِلَيْهِ 2× · حَرْفُ جَرٍّ 4× ·
   حُرُوفُ جَرٍّ 1× · اِسْمٌ 17× · فِعْلٌ 3× · حَرْفٌ 5×.
   ⛔ Ohne Beleg und deshalb NOCH OHNE Endung: مُذَكَّر (0×, arabdict nur
   مُذكَّر) — nicht selbst ergänzen. */
/* ⛔ AKKUSATIV ERST, WENN ER IHN GELERNT HAT (25.09.2026). Elias zu Übung 7:
   „natürlich akkusativ geht aktuell nicht weil ich es einfach noch nicht weiß
   aber sobald ich es weiß soll es natürlich auch hinzukommen". Schon früher:
   „die Regeln zum Akkusativ kenne ich auch nicht, unser Lehrer hatte es nur
   erwähnt" (grammar-data.js bei SATZ_THEMEN). Gemessen am 25.09.: in seiner
   Auswahl fragte keine Aufgabe nach dem Akkusativ — die Sperre hält das so,
   wenn Sätze mit Objekt dazukommen.
   ⭐ Von selbst frei: kommt der Akkusativ im Unterricht dran, bekommt seine
   Regel die Id `akkusativ-01` (Wartung, Schritt 1b.5) — dann fragen Übung 6 und
   7 ihn mit ab. Die Auswahl (مَنْصُوبٌ, Fatḥa, Fatḥatān) bleibt stehen. */
const UEB_AKKUSATIV_REGEL = 'akkusativ-01';
const uebAkkusativBekannt = () => typeof regelArt === 'function' && !!regelArt(UEB_AKKUSATIV_REGEL);
/* Der Grund einer Endung — die Rolle ohne Klammerzusatz („نَعْت (zum …)" →
   „نَعْت"). uebungMischen() zieht damit innerhalb einer Antwort reihum. */
const uebGrund = t => String((t && t.rolle) || '').replace(/\s*\(.*$/, '').trim() || null;
const KASUS_WAHL = [
  { wert:'raf',  text:'مَرْفُوعٌ · Nominativ' },
  { wert:'jarr', text:'مَجْرُورٌ · Genitiv' },
  { wert:'nasb', text:'مَنْصُوبٌ · Akkusativ' }
];
/* Die sechs Endzeichen, die in den Daten wirklich vorkommen (an vocab-data.js
   ausgezaehlt). Bewusst MIT Tanwin-Unterscheidung: genau daran korrigiert der
   Lehrer am haeufigsten - أَمامَ الطّالِبِ, nicht ṭālibu. */
/* ⭐ Die Tanwīn-Namen auf „-tayn" (25.09.2026). Elias: „bei den antworten mit
   tanweed sollte so dummatayn, kasratayn, fathatayn stehen und nicht tan".
   Geändert ist nur der ANGEZEIGTE Text; `wert` bleibt der Name aus endung()
   in js/irab.js — daran hängen Lösung und Vergleich. */
const HARAKA_WAHL = [
  { wert:'Damma',    text:'ـُ  Ḍamma' },
  { wert:'Dammatan', text:'ـٌ  Ḍammatayn' },
  { wert:'Kasra',    text:'ـِ  Kasra' },
  { wert:'Kasratan', text:'ـٍ  Kasratayn' },
  { wert:'Fatha',    text:'ـَ  Fatḥa' },
  { wert:'Fathatan', text:'ـً  Fatḥatayn' }
];
/* Der angezeigte Name eines Endzeichens („Kasratan" → „Kasratayn") — für die
   Auflösung von Übung 7, die sonst den inneren Namen zeigte. */
const uebZeichenName = z => { const h = HARAKA_WAHL.find(x => x.wert === z); return h ? h.text.replace(/^\S+\s+/, '') : z; };

/* ---------- Die Tabelle ----------
   `baue(zeilen, satz)` gibt eine Liste von Aufgaben zurueck, jede:
     { frage, ziele:[Wortindex…] }                          bei tippen/mehrfach
     { frage, wortIdx, optionen:[{wert,text}], loesung }     bei wahl
   Zusaetzlich moeglich: `verdeckt:true` (Wort wird als Strich gezeigt, weil es
   selbst die Antwort waere) und `aufloesung` (ein Satz nach der Antwort).
   Eine leere Liste ist erlaubt und heisst: dieser Satz taugt dafuer nicht. */
/* ⚠️ Jeder Reiter traegt den arabischen Fachbegriff UND eine deutsche
   Bezeichnung. Elias am 30.07.2026: "im satzmodus bei den uebungen die ich
   selbst beantworten kann da sind die kategorien nur auf arabisch betitelt. es
   sollte arabisch und die deutsche uebersetzung dazu sein."
   Der deutsche Teil ist absichtlich KURZ - die Leiste rollt waagerecht, und ein
   langer Zusatz macht aus zwei sichtbaren Reitern einen. Er benennt die Sache,
   er erklaert sie nicht; die Erklaerung steht im Hinweis unter der Aufgabe.

   Und alle arabischen Begriffe hier sind voll vokalisiert - seine stehende
   Vorgabe. مَجْرُور, مُضَاف, مَرْفُوع und مَنْصُوب standen vorher ohne die
   Damma auf dem dritten Buchstaben da. */
/* ⭐⭐ EINE STELLE FUER „es kann mehrere geben" (14.09.2026)

   Vier der dreizehn Modi bauten je Fundstelle eine eigene Aufgabe mit genau
   einem Ziel. Steht dieselbe Rolle zweimal im Satz, war die zweite Fundstelle
   eine zweite Aufgabe — und in jeder galt nur ein Wort, obwohl beide richtig
   sind. Elias hat das an „مَنْ مِنَ الصِّينِ؟ عَمَّارٌ مِنَ الصِّينِ."
   gemeldet: „hier sind aber beide antworten richtig".

   ⛔ Diese Funktion ist der Grund, warum es nicht wieder passiert: wer eine
   neue Tipp-Uebung baut, sammelt seine Treffer und gibt sie HIER ab, statt
   selbst `ziele:[i]` zu schreiben. `test-eindeutige-ziele.mjs` prueft das.
   [[wirkung_an_der_quelle_stilllegen]]

   ⛔⛔ SEIT DEM 16.09.2026 VERRÄT DIE FRAGE DIE ANZAHL NICHT MEHR.
   Hier stand: „`viele(n)` … muss die Zahl nennen, sonst raet man, wie viele
   noch fehlen" — und ein Treffer blieb ein Sofort-Antippen mit „Tippe DEN …".
   Genau das machte die Aufgaben per Ausschluss lösbar. Elias an dem Abend,
   zu „Tippe den مُضَاف an" auf عَمَّةُ الْوَلَدِ فِي الْبَيْتِ.:
   „hier sollte es auch ein etwas längerer satz sein mit mehr mudaf bzw etwas
   einfach schwieriger damit man so super leicht es einfach per ausschluss
   prinzip machen kann" — und zu „Alle مَجْرُور" („es ist genau eines"):
   „außerdem muss man das auch schwerer machen".
   Wer weiß, dass es genau eines ist, streicht die anderen und ist fertig.

   Deshalb ist jede Tipp-Aufgabe jetzt `mehrfach`: alle antippen, die man für
   richtig hält, dann „Prüfen" — auch bei nur einem Treffer. Die Frage sagt
   „alle", damit klar ist, dass es mehrere sein KÖNNEN (sein Wunsch vom
   14.09.: „das es mehrere gibt und das man mehrere antippen soll"), aber
   nie, wie viele. test-satzmodus-schwerer.mjs bewacht das. */
function uebungSammel(treffer, frage){
  if (!treffer || !treffer.length) return null;
  return { frage, ziele: treffer, art: 'mehrfach' };
}

/* Eine Orts- oder Zeitangabe (ظَرْف) mit einem Wort im Genitiv dahinter:
   أَمَامَ الْمَسْجِدِ, عِنْدَ الْبَابِ. Die Analyse (js/irab.js, Zweig istZarf,
   Liste ZURUF) nennt das erste „ظَرْف (Ortsangabe)" und das zweite
   „nach حَرْف جَرّ / ظَرْف". Mit angehängtem Pronomen (عِنْدِي) steht dahinter
   kein Genitiv — dann gilt es nicht. Wofür: siehe Übung `idafa`. */
function uebungZarfMitGenitiv(z, i){
  const t = z && z[i], n = z && z[i + 1];
  return !!(t && n && String(t.rolle || '').startsWith('ظَرْف')
    && String(n.rolle || '').startsWith('nach حَرْف جَرّ / ظَرْف'));
}

/* ⭐⭐ WARUM STEHT DAS WORT IM GENITIV? — für Übung 4 und 5 (25.09.2026).
   Elias mit Bild von Übung 5 (الْكِتَابُ عِنْدَ الْمُدَرِّسِ., ein einziges
   Wort im Genitiv): „ich hatte dir bereits gesagt das bei genitiv das zu
   leicht ist. es sollen mehrere sein im genitiv aus unterschiedlichsten
   gründen. lasse auch bei den genitiv präpositionen immer durchrutieren sodass
   ich jede mal sehe und auch die gründe warum es im gentiv ist. du musst das
   etwas schwerer machen". (Zuerst gesagt am 16.09.: „außerdem muss man das
   auch schwerer machen" — damals nahm ich nur die Anzahl aus der Frage.)
   Die vier Gründe sind die aus dem Hinweis von Übung 5: nach حَرْفُ جَرٍّ,
   nach ظَرْفٌ, als مُضَافٌ إِلَيْهِ, als نَعْتٌ zu einem Wort im Genitiv.
   `ausloeser` = die Präposition bzw. der ظَرْف davor (daran läuft das Reihum
   in uebungMischen), `text` = die Begründung, die nach der Antwort dasteht. */
const UEB_PRAEP_KERNE = ['في', 'من', 'على', 'إلى', 'الى', 'عن'];
function uebPraepKern(wort){
  const k = String(wort || '').replace(UEB_ZEICHEN, '').replace(/[.،؟?!«»:؛"„“”]/g, '').trim();
  const ohne = k.slice(1);
  const bekannt = x => UEB_PRAEP_KERNE.includes(x) || (typeof ZURUF !== 'undefined' && ZURUF.includes(x));
  return (/^[وف]/.test(k) && !bekannt(k) && bekannt(ohne)) ? ohne : k;
}
function uebGenitivGruende(z){
  const raus = [];
  z.forEach((t, i) => {
    if (!t || t.erwartet !== 'jarr') return;
    const r = String(t.rolle || ''), v = z[i - 1];
    if (r.startsWith('nach حَرْف جَرّ / ظَرْف') && v){
      const zarf = String(v.rolle || '').startsWith('ظَرْف');
      raus.push({ i, grund: zarf ? 'zarf' : 'praep', ausloeser: uebPraepKern(v.wort),
        text: `${t.rein} — nach ${zarf ? 'ظَرْفٌ' : 'حَرْفُ جَرٍّ'} ${v.rein}` });
    } else if (r.startsWith('nach angeschriebenem')){
      const p = (String(t.rein || t.wort).replace(/^[وف]َ?/, '').match(/^[بلك][َِ]?/) || [''])[0];
      raus.push({ i, grund: 'praep', ausloeser: p.charAt(0) + 'ـ', text: `${t.rein} — nach حَرْفُ جَرٍّ ${p}ـ` });
    } else if (r.startsWith('مُضَاف إِلَيْه')){
      let j = i - 1;
      while (j >= 0 && !String(z[j].rolle || '').includes('(مُضَاف)')) j--;
      raus.push({ i, grund: 'idafa', ausloeser: null, text: `${t.rein} — مُضَافٌ إِلَيْهِ${j >= 0 ? ' zu ' + z[j].rein : ''}` });
    } else if (r.startsWith('نَعْت')){
      let j = i - 1;
      while (j >= 0 && z[j].erwartet !== 'jarr') j--;
      raus.push({ i, grund: 'nat', ausloeser: null, text: `${t.rein} — نَعْتٌ${j >= 0 ? ' zu ' + z[j].rein : ''}` });
    } else raus.push({ i, grund: 'sonst', ausloeser: null, text: `${t.rein} — ${r}` });
  });
  return raus;
}

/* ⭐⭐ `hinweisVerraet` — PFLICHTFELD bei jeder Übung mit `hinweis` (22.09.2026).

   Elias: „Satzmodus-Hinweise: nur die verräterischen erst nach dem Versuch
   zeigen." Er hatte am 07.09.2026 schon Ja gesagt, dass Hinweise erst nach dem
   Versuch kommen sollen; offen war nur, ob bei ALLEN oder nur dort, wo der
   Hinweis die Antwort schon verrät. Die Antwort ist: **nur dort**.

   true  = der Hinweis nennt die Lösung oder eine Antwortoption. Er bleibt
           verborgen, bis beantwortet ist, und erscheint mit richtig/falsch.
           Klarster Fall ist Übung 10: der Hinweis zählt يَدٌ, عَيْنٌ, أُذُنٌ,
           رِجْلٌ und بِنْتٌ auf — das sind die Wörter, nach denen gefragt wird.
   false = der Hinweis ordnet nur ein und nimmt nichts vorweg. Er steht sofort
           da, so wie bisher.

   ⛔ KEIN VORGABEWERT, und das ist der ganze Zweck. Wer eine neue Übung mit
   Hinweis anlegt und das Feld vergisst, wird von `werkzeuge/pruefe-hinweise.mjs`
   rot gemeldet — statt still auf „verrät nichts" zu rutschen, was der bequeme
   und falsche Fall wäre. Elias ausdrücklich: „je Übung ein Pflichtfeld
   hinweisVerraet, kein Vorgabewert." [[vorgabewert_sieht_aus_wie_befund]]

   ⚠️ Übung 6 (kasus) hat gar keinen Hinweis und deshalb auch kein Feld.
   Übung 7 (haraka) trägt `aufgabe` statt `hinweis`: ihr Text IST die
   Aufgabenstellung („Das Wort steht ohne sein Endzeichen"), kein Hinweis —
   er bleibt immer sichtbar. */
/* ⭐⭐ EIN WORT AUS SEINER GRUPPE EINSETZEN (24.09.2026) — Übung 11
   (Hinweiswort), 14 (Fragewort) und 15 (Pronomen) bauen hierauf.

   Elias zu Übung 11: „die 11te übung bei satzmodus hat bisher nur hadha und
   hadhihi aber eigentlich könnte man das mit all diesen hinweiswörtern
   erweitern sodass ich nicht nur zwei übe. natürlich müssen die sätze
   dementsprechend angepasst werden." Um 22:49 zu den Fragewörtern und um
   22:55 zu den Pronomen, beide Male: „zur auswahl halt alle die ich habe und
   natürlich soll auch das immer aktuell bleiben also wenn ich neue lerne dann
   die auch impimentieren sobald sie da sind".

   ⭐ Deshalb steht hier KEINE Liste, die jemand nachpflegen müsste. Die Gruppe
   wird bei jedem Aufbau gelesen, aus zwei Quellen:
   1. seiner Regelkarte (FOLGE19_KARTEN in regelsammlung-data.js — die
      Musterlösung seines Lehrers), vokalisiert, wie er sie gelernt hat;
   2. seinen Karteikarten, die er schon abgefragt wird (istBekannt), wenn ihre
      Bedeutung zur Gruppe passt. Ein neues Fragewort aus einem neuen Kapitel
      steht damit ab dem Tag zur Wahl, an dem es bei ihm freigeschaltet ist.
   Bewacht von werkzeuge/pruefe-satzmodus-aktuell.mjs. */
const UEB_ZEICHEN = /[ً-ْٰـ]/g;
let UEB_WORTGRUPPEN = {};   // je Aufbau neu (uebungenAufbauen); ⛔ UEB_GRUPPEN ist der Wähler weiter unten
function uebSkelett(s){
  return String(s || '').replace(UEB_ZEICHEN, '').replace(/[.،؟?!«»:؛"„“”]/g, '')
    .replace(/[أإآٱ]/g, 'ا').trim();
}
/* Die Vokalzeichen je Grundbuchstabe. Ohne sie sehen أَنْتَ („du", m.) und
   أَنْتِ („du", f.) gleich aus — und مَنْ („wer?") wie مِنْ („von"). */
function uebZeichenJeBuchstabe(s){
  const out = [];
  for (const ch of String(s || '').normalize('NFC')){
    if (/[ً-ْٰ]/.test(ch)){ if (out.length) out[out.length - 1].z += ch; }
    else if (ch === 'ـ' || /[.،؟?!«»:؛\s"„“”]/.test(ch)) continue;
    else out.push({ b: ch, z: '' });
  }
  return out;
}
/* Passen die Zeichen des Wortes im Satz zur Form auf der Karte? Verglichen
   wird nur, wo BEIDE ein Zeichen tragen — der Satz ist oft sparsamer
   vokalisiert als die Karte (هذانِ gegen هَذَانِ). Schadda und Dolch-Alif
   entscheiden nichts; am letzten Buchstaben zählt ein Sukūn nicht, denn vor
   einem Artikel wird er zum Hilfsvokal (هُمْ → هُمُ الْ…).
   Rückgabe: Zahl der bestätigten Stellen, oder -1 bei Widerspruch. */
/* ⭐ kasusFrei (25.09.2026): trägt die Form auf seiner Karte am Ende Tanwīn,
   ist sie ein deklinierbares Nomen in der Nennform (أَيٌّ „welcher?"), und ihr
   letzter Vokal ist die Kasusendung — die richtet sich nach dem Satz: أَيُّ
   كِتَابٍ, فِي أَيِّ دَوْرٍ. Ohne diese Ausnahme traf die Karte nie ein Wort im
   Satz, und „welcher?" blieb in Übung 13 für immer „ohne Satz". Nur uebTreffer
   (Übungen 11, 13, 14) fragt so; die Endungen-Übung vergleicht streng weiter. */
function uebVertraeglich(wort, form, kasusFrei){
  const a = uebZeichenJeBuchstabe(wort), b = uebZeichenJeBuchstabe(form);
  if (a.length !== b.length) return -1;
  let bestaetigt = 0;
  for (let i = 0; i < a.length; i++){
    let va = a[i].z.replace(/[ّٰ]/g, ''), vb = b[i].z.replace(/[ّٰ]/g, '');
    if (i === a.length - 1 && (va === 'ْ' || vb === 'ْ')) continue;
    if (kasusFrei && i === a.length - 1 && /[ًٌٍ]/.test(vb)) continue;
    if (!va || !vb) continue;
    if (va !== vb) return -1;
    bestaetigt++;
  }
  return bestaetigt;
}
/* Was vor dem zweiten Grundbuchstaben steht: das وَ in وَهُوَ, das فَ in
   فَهِيَ, die Frage-Hamza in أَهَذَا — so, wie es im Satz steht. */
function uebVorsatz(wort){
  const s = String(wort || '');
  let n = 0;
  for (let i = 0; i < s.length; i++){
    if (!/[ً-ْٰـ]/.test(s[i])){ n++; if (n === 2) return s.slice(0, i); }
  }
  return '';
}
/* Welches Glied der Gruppe steht hier? `null`, wenn keins — oder wenn es
   nicht eindeutig ist (ein Wort ohne entscheidendes Vokalzeichen wird nicht
   gefragt, sonst wäre die Lösung geraten). */
function uebTreffer(wort, glieder){
  const sk = uebSkelett(wort);
  const versuche = [{ vorsatz: '', rest: wort, sk }];
  if (sk.length > 2 && /^[وفا]/.test(sk)){
    const v = uebVorsatz(wort);
    versuche.push({ vorsatz: v, rest: String(wort || '').slice(v.length), sk: sk.slice(1) });
  }
  for (const v of versuche){
    const kand = glieder.filter(g => g.skelett === v.sk);
    if (!kand.length) continue;
    const passt = kand.filter(g => uebVertraeglich(v.rest, g.form, true) >= 1);
    return passt.length === 1 ? { glied: passt[0], vorsatz: v.vorsatz } : null;
  }
  return null;
}
/* Die Glieder seiner Regelkarte: „هَذَا – dieser, m. Singular" → Form + Deutsch. */
function uebKartenGlieder(kartenId){
  const karten = (typeof FOLGE19_KARTEN !== 'undefined' && Array.isArray(FOLGE19_KARTEN)) ? FOLGE19_KARTEN : [];
  const k = karten.find(x => x && x.id === kartenId);
  const out = [];
  if (!k || !Array.isArray(k.gruppen)) return out;
  for (const g of k.gruppen) for (const m of (g.merkmale || [])){
    const teile = String(m).split(' – ');
    if (teile.length < 2) continue;
    let form = teile[0].trim(), de = teile.slice(1).join(' – ').trim();
    if (/\s/.test(form)){
      /* Ein ganzer Beispielsatz — so steht هَلْ auf der Fragewort-Karte. Dann
         zählt sein erstes Wort, wenn es kurz ist; أَأَنْتَ (die Frage-Hamza am
         Pronomen) ist kein eigenes Wort und fällt so heraus. Zwei Wörter wie
         مِنْ أَيْنَ ohne Fragezeichen am Ende ebenso. */
      if (!/[؟?]$/.test(form)) continue;
      const erstes = form.split(/\s+/)[0];
      if (uebSkelett(erstes).length > 2) continue;
      form = erstes; de = g.name;
    }
    out.push({ form, skelett: uebSkelett(form), de, gruppe: g.name });
  }
  return out;
}
function uebGruppe(kartenId, passtKarte){
  if (UEB_WORTGRUPPEN[kartenId]) return UEB_WORTGRUPPEN[kartenId];
  const glieder = uebKartenGlieder(kartenId);
  const bekannt = (typeof istBekannt === 'function') ? istBekannt : null;
  if (typeof VOCAB_DATA !== 'undefined' && Array.isArray(VOCAB_DATA)) for (const w of VOCAB_DATA){
    if (!w || !w.ar || (bekannt && !bekannt(w)) || !passtKarte(w)) continue;
    const form = String(w.ar).split('/')[0].trim();
    const sk = uebSkelett(form);
    if (!form || /\s|ـ/.test(form) || sk.length < 2) continue;
    if (glieder.some(g => g.skelett === sk && uebVertraeglich(form, g.form) >= 0)) continue;
    glieder.push({ form, skelett: sk, de: String(w.de || ''), gruppe: 'Karte' });
  }
  return (UEB_WORTGRUPPEN[kartenId] = glieder);
}
/* Steht hier eindeutig die Einzahl? Nur dann dürfen Dual und Plural als
   Ablenker stehen — bei هَذِهِ كُتُبٌ (Sachplural) wäre هَؤُلَاءِ sonst eine Falle. */
function uebKlarEinzahl(t){
  if (!t || typeof uebungVokabel !== 'function') return false;
  const v = uebungVokabel(t.wort);
  if (!v) return false;
  const formen = uebungKandidaten(t.wort);
  const hat = f => !!f && formen.includes(uebungOhneEndung(f));
  return (hat(v.ar) || hat(v.sg) || hat(v.femSg)) && !(hat(v.pl) || hat(v.femPl));
}
/* ⭐ DAS VERB DANACH ZEIGT DIE PERSON (Übung 14, 25.09.2026). „du", „sie" und
   „ihr" fragte die Übung nur, wenn das Wort danach ein Nomen mit Geschlecht
   war — bei einem Verb sagte uebungIstWeiblichImSatz „weiß nicht". Dabei zeigt
   gerade die Vergangenheit Person, Geschlecht und Zahl eindeutig, und genau so
   stehen die Pronomen auf seinen Karten: أَنْتَ ذَهَبْتَ, أَنْتِ ذَهَبْتِ,
   أَنْتُمْ ذَهَبْتُمْ … (data/fachbegriffe.js, gram-pron-*: „Vergangenheit auf
   ـْتَ" usw.; verb-madi-endungen-01, Folge 18). Gemessen vorher: 7 der 12
   Pronomen seiner Karte „ohne Satz", obwohl die Beispielsätze dieser Karten sie
   enthalten. Die längste passende Endung gewinnt (ذَهَبْتُمَا endet auch auf
   ـَا wie ذَهَبَا). Nur Vergangenheit: تَذْهَبُ kann أَنْتَ oder هِيَ sein. */
const UEB_MADI_PRONOMEN = [
  ['هُوَ', 'َ'], ['هِيَ', 'َتْ'], ['هُمَا', 'َا'], ['هُمَا', 'َتَا'], ['هُمْ', 'ُوا'], ['هُنَّ', 'ْنَ'],
  ['أَنْتَ', 'ْتَ'], ['أَنْتِ', 'ْتِ'], ['أَنْتُمَا', 'ْتُمَا'], ['أَنْتُمْ', 'ْتُمْ'], ['أَنْتُنَّ', 'ْتُنَّ'],
  ['أَنَا', 'ْتُ'], ['نَحْنُ', 'ْنَا']
].map(([p, e]) => [p.normalize('NFC'), e.normalize('NFC')]);
function uebMadiPronomen(wort){
  if (typeof istMadiForm !== 'function') return null;
  const w = String(wort || '').normalize('NFC').replace(/[.،؟?!«»:؛]+$/, '');
  if (!istMadiForm(w)) return null;
  let best = null, gleichLang = false;
  for (const [p, e] of UEB_MADI_PRONOMEN){
    if (!w.endsWith(e)) continue;
    if (!best || e.length > best.e.length){ best = { p, e }; gleichLang = false; }
    else if (e.length === best.e.length && p !== best.p) gleichLang = true;
  }
  return best && !gleichLang ? best : null;
}
const uebBedeutung = de => String(de || '').toLowerCase().replace(/[?„"“”]/g, '').trim();
const UEB_FRAGE_DE = /^(wer|was|wo|woher|wohin|wie|wie viele?|wann|warum|welche[rsnm]?)\s*\??$/i;

/* ⭐⭐ DIE ENDUNG EINSETZEN (Übung 15, 25.09.2026) — Elias, wörtlich: „wie wäre
   es auch mit einem satz übung wo ich die richtigen endungen hinzufügen muss
   wie zb ki für frau oder ha und hu usw.. also halt alle die bisher zur
   auswahl stehen".

   ⭐ „alle die bisher zur auswahl stehen" = seine Endungs-Karteikarten
   (data/fachbegriffe.js: gram-suffix-i/-ka/-ki/-hu/-ha, „die Besitzendung …").
   Gelesen bei JEDEM Aufbau aus VOCAB_DATA, gefiltert mit istBekannt — dieselbe
   Tür wie in uebGruppe(). Blendet er eine Karte aus oder kommt eine neue dazu
   (ـكُمْ, ـنَا …), ändert sich die Auswahl von selbst; die Erkennung unten
   kennt keine eigene Liste der Endungen.

   ⛔ KEINE SELBST GESETZTE ḤARAKA. Gezeigt wird das Wort aus dem Buch, von dem
   nur etwas WEGGENOMMEN ist: die Endung und der letzte Vokal davor (sonst
   verrät die Kasra von كِتَابِي das ـِي). Zur Wahl stehen die Formen seiner
   Karten, wie sie dort stehen. Kein Wort wird mit einer anderen Endung neu
   zusammengesetzt. */
const UEB_ENDUNG_NICHT = ['هناك', 'هنالك', 'ذلك', 'تلك', 'اولئك', 'كذلك', 'لذلك', 'ايها', 'ايتها', 'الذي', 'التي'];
/* Präpositionen und Ortsangaben, an denen dieselben Endungen hängen: لِي, لَكِ,
   فِيهَا, مَعَهُ, عِنْدَكَ. Verglichen wird das Gerippe dessen, was vor der Endung
   steht (عَلَيْكَ → علي). */
const UEB_ENDUNG_PRAEP = ['ل', 'ب', 'في', 'علي', 'الي', 'من', 'عن', 'مع', 'عند', 'لدي',
  'امام', 'خلف', 'فوق', 'تحت', 'بين', 'بعد', 'قبل'];
/* Was vorn am Wort hängen kann: Frage-Hamza (أَلَكِ), وَ/فَ (وَلِي), بِ/لِ (بِقَلَمِي). */
const UEB_ENDUNG_VORSATZ = [/^/, /^أَ/, /^[وف]َ/, /^[بل]ِ/, /^[وف]َ[بل]ِ/, /^أَ[وف]َ/];
/* Vor einer Endung wird ة zu ت (غُرْفَة → غُرْفَتِي). */
const uebEndungSkelett = s => uebSkelett(s).replace(/ة$/, 'ت');

function uebEndungGlieder(){
  if (UEB_WORTGRUPPEN.endungen) return UEB_WORTGRUPPEN.endungen;
  const bekannt = (typeof istBekannt === 'function') ? istBekannt : null;
  const out = [];
  if (typeof VOCAB_DATA !== 'undefined' && Array.isArray(VOCAB_DATA)) for (const w of VOCAB_DATA){
    if (!w || (bekannt && !bekannt(w))) continue;
    const form = String(w.ar || '').normalize('NFC').trim();
    if (!/^ـ[ً-ْ]?[ء-ي]/.test(form)) continue;
    if (!/Besitzendung/i.test(String(w.de || '')) && !/^possessiv-/.test(String(w.regel || ''))) continue;
    if (out.some(g => g.form === form)) continue;
    const de = String(w.de || '').trim();
    out.push({ form, zeichen: form.slice(1), de,
      /* „dein" steht auf ZWEI Karten (ـكَ, ـكِ) — dann entscheidet der Zusatz
         der Karte („zu einem Mann" / „zu einer Frau"), siehe baue(). */
      bed: (de.match(/[„"“]([^“”"]+)[“”"]/) || [])[1] || '',
      zusatz: de.includes(' — ') ? de.split(' — ').slice(1).join(' — ').trim() : '',
      regel: w.regel || null,
      /* Reihenfolge wie in possessiv-endungen-01: ich, du, er/sie. */
      person: /ك/.test(form) ? 2 : /ه/.test(form) ? 3 : 1 });
  }
  out.sort((a, b) => a.person - b.person);
  return (UEB_WORTGRUPPEN.endungen = out);
}

/* Ist das, was vor der Endung steht, ein Nomen? ⛔ Nur, was in seinen Büchern
   steht — ein unbekannter Stamm wird nicht gefragt (E.1: lieber keine Frage als
   eine falsche). Dazu zählen auch spätere Kapitel seiner Bücher: زَوْجٌ kommt
   in Madina 1 erst in Kapitel 13, زَوْجُهَا steht schon auf Seite 55. Gelernt
   haben muss er das Wort dafür nicht — gefragt wird ja die Endung. */
function uebEndungNomen(){
  if (UEB_WORTGRUPPEN.endungenNomen) return UEB_WORTGRUPPEN.endungenNomen;
  const tab = new Map(), quellen = [];
  if (typeof VOCAB_DATA !== 'undefined' && Array.isArray(VOCAB_DATA)) quellen.push(VOCAB_DATA);
  const buecher = (typeof SETTINGS === 'object' && SETTINGS && SETTINGS.buecher) || {};
  const vok = (typeof window !== 'undefined' && window && window.VOKABELN) || {};
  for (const b of Object.keys(buecher)) if (Array.isArray(vok[b]) && (buecher[b] || []).length) quellen.push(vok[b]);
  for (const liste of quellen) for (const w of liste){
    if (!w || ['verb', 'particle', 'pronoun'].includes(w.type)) continue;
    for (const f of [w.ar, w.sg, w.femSg, w.pl]) for (const einzel of String(f || '').split(/\s*[|/]\s*/)){
      if (!einzel || /\s|ـ/.test(einzel.trim())) continue;
      const form = uebungOhneEndung(einzel.normalize('NFC'));
      const sk = uebEndungSkelett(form);
      if (sk.length < 2) continue;
      if (!tab.has(sk)) tab.set(sk, []);
      tab.get(sk).push(form);
    }
  }
  return (UEB_WORTGRUPPEN.endungenNomen = tab);
}
function uebEndungNomenPasst(form){
  return (uebEndungNomen().get(uebEndungSkelett(form)) || []).some(f => uebVertraeglich(form, f) >= 0);
}
function uebEndungIstNomen(roh){
  const versuche = [roh,
    roh.replace(/(ُو|َا|ِي)$/, ''),   // die fünf Nomen: أَبُوكِ → أَب
    roh.replace(/َ?ت$/, '')];         // die weibliche Form eines bekannten Wortes: صَدِيقَتِي → صَدِيق
  return versuche.some((k, i) => k && (i === 0 || k !== roh) && uebEndungNomenPasst(k));
}
/* Die Endung abschneiden; zurück kommt der Stamm (noch mit seinem letzten Vokal)
   oder null. ⚠️ NFC stellt ein Schadda HINTER den Vokal: عَمِّي ist … ِ ّ ي. Beginnt
   die Endung mit einem Vokal (ـِي), darf dazwischen ein Schadda stehen — das
   gehört zum Stamm (عَمّ). */
function uebEndungAb(kern, zeichen){
  if (kern.endsWith(zeichen)) return kern.slice(0, -zeichen.length);
  if (/^[ً-ْ]/.test(zeichen)){
    const mit = zeichen[0] + 'ّ' + zeichen.slice(1);
    if (kern.endsWith(mit)) return kern.slice(0, -mit.length) + 'ّ';
  }
  return null;
}
/* Trägt dieses Wort eine seiner Endungen? → { glied, vorsatz, stamm, praep } oder null.
   ⛔ Nicht gefragt: ein Verb (Objekt-Endung, nicht seine Karte), ـهِ (عَلَيْهِ —
   steht so auf keiner Karte), ein Wort mit Artikel, ذَلِكَ/تِلْكَ/هُنَاكَ (das ك
   der Entfernung), الَّذِي, und ein Wort, das SELBST so im Wortschatz steht
   (سَمَكَ ist „Fisch", kein سَمـ + ـكَ). */
function uebEndungStelle(t, glieder){
  if (!t || /فِعْل/.test(String(t.rolle || ''))) return null;
  const rein = String(t.rein != null ? t.rein : (t.wort || '')).normalize('NFC')
    .replace(/[.،؟?!«»:؛"„“”]/g, '').trim();
  if (!rein || /\s/.test(rein)) return null;
  const nach = glieder.slice().sort((a, b) => b.zeichen.length - a.zeichen.length);
  for (const muster of UEB_ENDUNG_VORSATZ){
    const m = muster.exec(rein);
    if (!m) continue;
    const vorsatz = m[0], kern = rein.slice(vorsatz.length);
    if (UEB_ENDUNG_NICHT.includes(uebSkelett(kern))) return null;
    if (/^[اٱ]َ?ل/.test(kern)) continue;
    for (const g of nach){
      const stamm = uebEndungAb(kern, g.zeichen);
      if (stamm == null) continue;
      const roh = uebungOhneEndung(stamm);
      const sk = uebEndungSkelett(roh);
      if (!sk) continue;
      if (UEB_ENDUNG_PRAEP.includes(sk)) return { glied: g, vorsatz, stamm: roh, praep: true };
      if (sk.length < 2 || uebEndungNomenPasst(uebungOhneEndung(kern))) continue;
      if (uebEndungIstNomen(roh)) return { glied: g, vorsatz, stamm: roh, praep: false };
    }
  }
  return null;
}

const UEBUNGEN = [
  {
    id:'mubtada-khabar', nr:1, name:'مُبْتَدَأٌ / خَبَرٌ — Satzteile', art:'mehrfach',
    /* ⭐ Dieser Modus ist aus Elias' eigener Rueckfrage vom 30.07. entstanden:
       "war es nicht so, dass mubtadi (nomen) und baat (adjektiv) zusammen
       sind?" Er hatte مُبْتَدَأ+خَبَر mit مَنْعُوت+نَعْت verwechselt. Der
       Unterschied: das erste Paar ist ein ganzer SATZ ("der Lehrer IST neu"),
       das zweite nur eine Wortgruppe ("eine grosse Moschee"), und entscheidend
       ist die Bestimmtheit (`nat-bestimmtheit-01`, Folge 13 ca. 3:11,
       Schluessel 1 L9 S. 30). Deshalb steht die Unterscheidung als Hinweis an
       der Aufgabe, nicht erst in der Aufloesung. */
    hinweis:'مُبْتَدَأٌ + خَبَرٌ bilden einen ganzen Satz („der Lehrer ist neu"). Ein Adjektiv, das nur beschreibt („eine große Moschee"), ist نَعْتٌ.',
    hinweisVerraet:true,
    baue(z){
      const mub = [], kha = [];
      z.forEach((t,i)=>{
        if (/^مُبْتَدَأ/.test(t.rolle)) mub.push(i);
        else if (t.rolle === 'خَبَر') kha.push(i);
      });
      return [
        /* ⛔ Die deutschen Wörter stehen IN der Frage (16.09.2026). Hier stand
           „— worüber wird etwas gesagt?", und Elias an هَذَا قَلَمُكَ.: „hier
           sollte bei mubtada stehen subjekt oder danach bei worüber wird etwas
           gesagtr sollte stehen was ist das subjekt weil sonst verstehe ich
           nicht und weiß nicht was von mir verlangt wrid". Subjekt und Aussage
           sind die Wörter seiner Regelkarte (grammar-data.js: „مُبْتَدَأ وخَبَر
           (Subjekt und Aussage)").
           ⭐ Und die Form: ARABISCH MIT ENDUNG, DEUTSCH IN KLAMMERN. Elias um
           18:52:49: „du kannst sowohl arabisch als auch deutsch, am besten sogar
           auf arabisch und dann in klammern auf deutsch die übersetzung)" — und
           um 18:53:56 „ja" zu den Endungen (Belege bei KASUS_WAHL oben). */
        uebungSammel(mub, 'Tippe alle مُبْتَدَأٌ (Subjekt) an.'),
        uebungSammel(kha, 'Tippe alle خَبَرٌ (Aussage über das Subjekt) an.')
        /* Reihum nach der Art der Frage (25.09.2026, „bei all diesen aufgaben
           bei denen es geht" — uebungSchluessel). */
      ].map((a, k) => a && { ...a, reihum: [k ? 'khabar' : 'mubtada'] }).filter(Boolean);
    }
  },
  {
    id:'nat', nr:2, name:'نَعْتٌ / مَنْعُوتٌ — Adjektiv und sein Nomen', art:'mehrfach',
    hinweis:'Das نَعْتٌ stimmt mit seinem مَنْعُوتٌ (dem Nomen, das es beschreibt) in Fall, Zahl, Geschlecht UND Bestimmtheit überein. Ist die Bestimmtheit anders, ist das Adjektiv kein نَعْتٌ, sondern die Aussage (خَبَرٌ).',
    hinweisVerraet:true,
    baue(z){
      /* ⭐⭐ SCHWERER UND MIT DEM مَنْعُوت (25.09.2026). Elias mit Bild von
         „هَذَا كِتَابٌ جَدِيدٌ.": „hier müssen die sätze auch wesentlich länger
         werden und mit mehreren adjektiven. auch möchte ich im selben modus das
         du nach dem manut fragst. also den zweiten modus umbenennen irgendwie
         und beides fragen und wie gesagt schwerer mit mehreren drinne im satz"
         — und: „du kannst auch so sätze nehmen wo es nur einen unterschied gibt
         also zb nicht gleiche bestimmheit damit es zur verwirrung sorgt".
         Also nur Sätze mit mindestens ZWEI Adjektiven, mindestens eines davon
         نَعْت; das andere darf ein Adjektiv als خَبَر sein (andere
         Bestimmtheit) — genau seine Verwechslung. Gemessen in seiner Auswahl:
         43 Sätze, 14 davon mit dieser Verwechslung. Zwei Fragen, reihum.
         Das مَنْعُوت: rückwärts über weitere نَعْت zum Nomen; beim نَعْت zum
         مُضَاف das Wort mit „(مُضَاف)". Ist es ein Hinweiswort (هَذَا
         التَّاجِرُ), fällt der Satz weg — dort ist „مَنْعُوت" keine saubere
         Antwort. Längere Sätze kommen aus seinen Büchern (To-Do). */
      const nat = [], mant = [];
      let adjektive = 0, unsauber = false;
      z.forEach((t,i)=>{
        const r = String(t.rolle || '');
        if (r.includes('نَعْت')){
          nat.push(i); adjektive++;
          let j = i - 1;
          if (r.includes('zum مُضَاف')){ while (j >= 0 && !String(z[j].rolle || '').includes('(مُضَاف)')) j--; }
          else { while (j >= 0 && String(z[j].rolle || '').includes('نَعْت')) j--; }
          if (j < 0 || (typeof istIndeklinabel === 'function' && istIndeklinabel(z[j].wort))) unsauber = true;
          else if (!mant.includes(j)) mant.push(j);
        } else if (r === 'خَبَر' && typeof wortart === 'function' && wortart(t.wort) === 'adjective') adjektive++;
      });
      if (unsauber || !nat.length || adjektive < 2) return [];
      mant.sort((a,b)=>a-b);
      return [
        uebungSammel(nat, 'Tippe alle نَعْتٌ (Adjektiv zum Nomen) an.'),
        uebungSammel(mant, 'Tippe alle مَنْعُوتٌ (das beschriebene Nomen) an.')
      ].map((a,k) => a && { ...a, reihum: [k ? 'manut' : 'nat'] }).filter(Boolean);
    }
  },
  {
    id:'idafa', nr:3, name:'مُضَافٌ / مُضَافٌ إِلَيْهِ — Besitz', art:'mehrfach',
    /* ⚠️ „im Satz": der Begriff مُضَافٌ trägt als Name selbst ein Tanwīn — das
       Wort, das er bezeichnet, trägt im Satz keines. Ohne den Zusatz sähe der
       Hinweis aus, als widerspräche er sich. */
    hinweis:'Der مُضَافٌ trägt im Satz weder Tanwīn noch Artikel; das مُضَافٌ إِلَيْهِ steht im Genitiv.',
    hinweisVerraet:true,
    baue(z){
      /* ⛔ Vorher stand hier zweimal `findIndex` — das nahm nur das ERSTE
         Vorkommen. In „اسْمُ التَّاجِرِ مَحْمُودٌ وَاسْمُ الطَّبِيبِ سَعِيدٌ."
         stehen zwei Iḍāfa-Paare, und das zweite galt als falsch. */
      /* ⭐⭐ ORTS- UND ZEITANGABEN ZÄHLEN MIT (19.09.2026).
         Elias an „بَيْتُ التَّاجِرِ أَمَامَ الْمَسْجِدِ وَبَيْتُ الطَّبِيبِ خَلْفَ الْمَدْرَسَةِ.",
         wo أَمَامَ und خَلْفَ als falsch galten, 03:16:54: „sollten diese zwei
         als antowrt nicht eigentlich auch richtig sein?" — 03:46:10: „die beiden sind wie mudaf, wenn das der fall ist dann ist das ja auch grundsätzlich richtig"
         — 03:47:24: „lass die zwei dann gelten und auch andere ähnliche ortangaben oder zeitangeben"
         — 03:48:30: „aber nur wenn zeitangeben auch wirklich wie mudaf sind".
         Belegt beim Lehrer: Folge 14, 17:02–17:14 (عِنْدَ): „Und Aynel kann
         sowohl Ortsangabe sein, als auch Zeitangabe. Aynel ist ein Darf. Und
         wir haben gerade Darf, Macht, Modarf. Ileyhi. Oder es klappt wie ein
         Modarf." (Whisper-Mitschrift; gemeint: ظَرْف macht مُضَاف إِلَيْه),
         mit Zeit-Beispielen „Aynel Fajr", „zu Duhr".
         ⚠️ Vorher zählte die Übung sie mit Absicht NICHT — Folge 8, 25:49:
         „Die Ortsangabe ist ein Nomen. Funktioniert aber wie ein Modav. Aber
         ist selbst keins." (Karte zarf-als-mudaf-01). Elias hat das gehört
         und entschieden: weil sie wie ein مُضَاف funktioniert, ist sie richtig.
         Gilt für jede Orts- und Zeitangabe der Liste ZURUF (js/irab.js), und
         das Wort dahinter zählt dann als مُضَاف إِلَيْه. Die Analyse selbst
         nennt sie weiter „ظَرْف" — das ist der Name seines Lehrers. */
      const mudaf = [], zu = [];
      let mitZarf = false;
      z.forEach((t,i)=>{
        if (t.rolle.includes('(مُضَاف)') && !mudaf.includes(i)) mudaf.push(i);
        if (t.rolle.startsWith('مُضَاف إِلَيْه') && !zu.includes(i)) zu.push(i);
        if (uebungZarfMitGenitiv(z, i)){
          if (!mudaf.includes(i)) mudaf.push(i);
          if (!zu.includes(i + 1)) zu.push(i + 1);
          mitZarf = true;
        }
      });
      mudaf.sort((a,b)=>a-b); zu.sort((a,b)=>a-b);
      if (!mudaf.length || !zu.length) return [];
      /* ⭐ Zwei Aufgaben statt einer mit zwei Antippen bleibt: so sagt die
         Rueckmeldung, WELCHER Teil sass und welcher nicht. Neu ist nur, dass
         jede von beiden alle ihre Fundstellen kennt. */
      /* Steht eine Orts- oder Zeitangabe darin, erklärt „Warum?" mit SEINER
         Karte „Ortsangabe als مُضَافٌ" — die allgemeine Iḍāfa-Karte (f19-idafa)
         nennt Ortsangaben gar nicht (19.09.2026 nachgesehen). */
      /* ⭐ NUR NOCH SCHWERE AUFGABEN (22.09.2026). Elias auf die Frage, ob
         die Aufgaben mit mehreren Treffern zuerst kommen sollen: „lieber die
         schwereren, generell alle sollen so sein bei mudaf und ilayhi". Das
         setzt um, was er am 15.09. schon gewählt hatte („die einfachen
         aussortieren · mehr Sätze aufnehmen — so machen wir es"). Ein Satz
         mit einer einzigen Iḍāfa stellt hier deshalb keine Aufgabe mehr; die
         anderen Modi bekommen ihn weiter. Nachschub: satz-lang-09 … 18 in
         data/beispielsaetze.js. test-satzmodus-schwerer.mjs bewacht beides. */
      return [
        mudaf.length > 1 ? uebungSammel(mudaf, 'Tippe alle مُضَافٌ (das Besessene) an.') : null,
        zu.length > 1 ? uebungSammel(zu, 'Tippe alle مُضَافٌ إِلَيْهِ (der Besitzer) an.') : null
        /* Reihum nach der Art der Frage (25.09.2026) — uebungSchluessel. */
      ].map((a, k) => a && { ...a, reihum: [k ? 'mudaf-ilayhi' : 'mudaf'] })
       .filter(Boolean).map(a => mitZarf ? { ...a, warum: 'zarf-als-mudaf-01' } : a);
    }
  },
  {
    id:'jarr-paar', nr:4, name:'حَرْفُ جَرٍّ + مَجْرُورٌ — Präposition', art:'mehrfach',
    hinweis:'Der حَرْفُ جَرٍّ setzt das Nomen dahinter in den Genitiv.',
    hinweisVerraet:true,
    baue(z){
      /* ⛔ DER FALL, DEN ELIAS GEMELDET HAT. Vorher entstand je Partikel eine
         eigene Aufgabe mit genau einer gueltigen Stelle. In
         „مَنْ مِنَ الصِّينِ؟ عَمَّارٌ مِنَ الصِّينِ." sind beide مِنَ حَرْف جَرّ —
         wer das erste antippte, bekam „Nicht ganz". */
      /* ⛔⛔ DIE ZWEITE LISTE IST ENGER ALS DIE ERSTE — und das ist der Kern.
         In „مِنْ أَيْنَ أَنْتَ؟ أَنَا مِنَ الْيَابَانِ." sind BEIDE مِنْ ein
         حَرْف جَرّ, aber nur hinter dem zweiten steht ein Nomen im Genitiv:
         أَيْنَ ist مبني, die App führt es als „unveränderlich".

         Vorher hing die Partikel-Frage an derselben Bedingung wie die
         Genitiv-Frage — also galt das erste مِنْ als falsch, obwohl die Frage
         „Tippe den حَرْف جَرّ an" lautet. Beim Nachmessen nach der grossen
         Reparatur war das die EINE Aufgabe, die noch mehrdeutig blieb.
         [[bedingung_wird_durch_die_handlung_ungueltig]] */
      const partikel = [], nomen = [];
      z.forEach((t,i)=>{
        if (t.rolle !== 'حَرْف جَرّ') return;
        partikel.push(i);                       /* jeder حَرْف جَرّ zählt */
        const n = z[i+1];
        if (n && n.erwartet === 'jarr') nomen.push(i+1);   /* nur mit Nomen dahinter */
      });
      if (!partikel.length || !nomen.length) return [];
      /* ⭐⭐ NUR NOCH SCHWERE AUFGABEN (25.09.2026, 02:05) — wie Übung 5:
         mindestens ZWEI حُرُوفُ جَرٍّ mit je einem Nomen im Genitiv dahinter.
         Elias: „auch hier die sätze schwerer machen wie beim genitiv davor und
         mit mehr präpositionen im satz". Gemessen in seiner Auswahl: 7 von
         120 Sätzen erfüllen das; weitere kommen aus seinen Büchern
         (pruefe-satzmodus-aktuell, Teil F, zeigt die Zahl). Sätze mit nur einer
         Präposition bekommen weiter Übung 6 und 7. */
      if (partikel.length < 2 || nomen.length < 2) return [];
      /* ⭐ Reihum nach Präposition (25.09.2026, Elias: „lasse auch bei den
         genitiv präpositionen immer durchrutieren sodass ich jede mal sehe") —
         die Präpositionen des Satzes tragen die Aufgabe in ihren Korb
         (uebungMischen), innerhalb davon wechseln die beiden Fragen ab. */
      const reihum = [...new Set(partikel.map(i => uebPraepKern(z[i].wort)))];
      return [
        /* Deutsch mit dazu, aus demselben Grund wie beim مُبْتَدَأ: die Frage
           stand hier nur auf Arabisch. */
        uebungSammel(partikel, 'Tippe alle حُرُوفُ جَرٍّ (Präpositionen) an.'),
        uebungSammel(nomen, 'Tippe alle Wörter an, die dadurch مَجْرُورٌ (im Genitiv) sind.')
      ].map((a, k) => a && { ...a, reihum, grundArt: k ? 'nomen' : 'partikel' }).filter(Boolean);
    }
  },
  {
    id:'alle-majrur', nr:5, name:'Alle مَجْرُورٌ — Genitiv', art:'mehrfach',
    hinweis:'Genitiv steht nach einem حَرْفُ جَرٍّ, nach einem ظَرْفٌ, als مُضَافٌ إِلَيْهِ — und als نَعْتٌ zu einem Wort im Genitiv.',
    hinweisVerraet:true,
    baue(z){
      /* ⛔ Hier stand „— es ist genau eines." bzw. „— es sind N.". Elias am
         16.09.2026 an genau dieser Aufgabe: „außerdem muss man das auch
         schwerer machen". Die Anzahl verraten heißt: die übrigen Wörter
         wegstreichen und fertig. Jetzt über uebungSammel wie die anderen. */
      /* ⭐⭐ NUR NOCH SCHWERE AUFGABEN (25.09.2026) — Wortlaut bei
         uebGenitivGruende(): mindestens ZWEI Wörter im Genitiv aus mindestens
         ZWEI verschiedenen Gründen. Ein Satz mit einem einzigen Genitiv stellt
         hier keine Aufgabe mehr; Übung 4, 6 und 7 bekommen ihn weiter. Nach der
         Antwort steht an jedem Wort sein Grund („… die gründe warum es im
         gentiv ist"). Reihum nach Präposition: uebungMischen. Bewacht von
         werkzeuge/pruefe-satzmodus-aktuell.mjs (Teil F). */
      const gen = uebGenitivGruende(z);
      const arten = new Set(gen.map(g => g.grund));
      if (gen.length < 2 || arten.size < 2) return [];
      const a = uebungSammel(gen.map(g => g.i), 'Tippe alle مَجْرُورٌ (Wörter im Genitiv) an.');
      return a ? [{ ...a, reihum: [...new Set(gen.map(g => g.ausloeser).filter(Boolean))],
                    grundArt: [...arten].sort().join('+'),
                    aufloesung: gen.map(g => g.text).join(' · ') }] : [];
    }
  },
  {
    id:'kasus', nr:6, name:'Welcher Fall?', art:'wahl',
    baue(z){
      return z.map((t,i)=>(t.erwartet && (t.erwartet !== 'nasb' || uebAkkusativBekannt())) ? {
        frage:'In welchem Fall steht das hervorgehobene Wort?',
        wortIdx:i, optionen:KASUS_WAHL, loesung:t.erwartet, grund:uebGrund(t),
        aufloesung:`${typeof rolleAnzeige === 'function' ? rolleAnzeige(t.rolle) : t.rolle} → ${KASUS[t.erwartet].ar} (${KASUS[t.erwartet].de})`
      } : null).filter(Boolean);
    }
  },
  {
    id:'haraka', nr:7, name:'Welche Endung?', art:'wahl',
    /* ⭐ Der nuetzlichste der dreizehn, und der einzige, in dem Elias die
       Endung PRODUZIEREN muss statt sie nur zu benennen. Genau das korrigiert
       der Lehrer im Unterricht laufend. Deshalb wird das Wort ohne sein
       Endzeichen gezeigt und die sechs echten Zeichen stehen zur Wahl -
       inklusive der Unterscheidung mit und ohne Tanwin. */
    /* ⛔ `aufgabe`, nicht `hinweis` (22.09.2026). Dieser Text SAGT die Aufgabe:
       ohne ihn sieht Elias ein Wort mit fehlendem Endzeichen und weiß nicht,
       was von ihm verlangt wird. Ihn erst nach dem Versuch zu zeigen hieße,
       die Übung ohne Fragestellung zu stellen. Elias: „7 haraka: Text ist die
       Aufgabenstellung, nicht ein Hinweis -> Feld in aufgabe umbenennen,
       bleibt immer sichtbar." Deshalb trägt Übung 7 kein `hinweisVerraet`. */
    aufgabe:'Das Wort steht ohne sein Endzeichen. Welches gehört dahin? Achte auch darauf, ob ein Tanwīn dazugehört.',
    baue(z){
      return z.map((t,i)=>{
        if (!t.erwartet || !t.gelesen || t.stimmt === false) return null;
        if (t.erwartet === 'nasb' && !uebAkkusativBekannt()) return null;
        if (!HARAKA_WAHL.some(h=>h.wert === t.gelesen.zeichen)) return null;
        return {
          frage:'Welche Endung gehört an das hervorgehobene Wort?',
          wortIdx:i, ohneEndung:true, optionen:HARAKA_WAHL, loesung:t.gelesen.zeichen, grund:uebGrund(t),
          aufloesung:`${typeof rolleAnzeige === 'function' ? rolleAnzeige(t.rolle) : t.rolle} → ${KASUS[t.erwartet].ar}, also ${uebZeichenName(t.gelesen.zeichen)}: ${t.rein}`
        };
      }).filter(Boolean);
    }
  },
  {
    id:'wortart', nr:8, name:'اِسْمٌ / فِعْلٌ / حَرْفٌ — Wortart', art:'wahl',
    hinweis:'Im Arabischen zählen auch Adjektive, Adverbien und Ortsangaben als اِسْمٌ — تَحْتَ und هُنَا also auch.',
    hinweisVerraet:false,
    baue(z){
      return z.map((t,i)=>{
        const a = uebungWortart(t.wort);
        if (!a) return null;
        return {
          frage:'Welche Wortart hat das hervorgehobene Wort?',
          wortIdx:i, loesung:a,
          /* `wert` bleibt ohne Endung — damit vergleicht uebungWortart(); nur
             die Anzeige trägt seit dem 16.09.2026 die Endung. */
          optionen:[{wert:'اِسْم',text:'اِسْمٌ · Nomen'},{wert:'فِعْل',text:'فِعْلٌ · Verb'},{wert:'حَرْف',text:'حَرْفٌ · Partikel'}]
        };
      }).filter(Boolean);
    }
  },
  /* ⛔ „Bestimmt?" (bisher Nr. 9) ist ENTFERNT, 16.09.2026. Elias mit einem
     Bildschirmfoto der Aufgabe: „diese übung können wir komplett raus nehmen
     aus dem satzmodus weil das ist auch viel zu einfach" — und gleich danach:
     „die regel soll natürlich in der app bleiben aber die übung im satzmodus
     brauche ich nicht weil die ist viel zu leicht".
     Die Regel al-tanwin-tilgung-01 bleibt also, nur die Übung ist weg. Nicht
     wieder einbauen; test-satzmodus-schwerer.mjs bewacht beides. */
  {
    id:'regel', nr:9, name:'Welche Regel?', art:'wahl',
    /* Die Ablenker kommen aus DEMSELBEN Thema. Vier zufaellige Regelnamen aus
       73 waeren zu leicht: "Sonnen- und Mondbuchstaben" gegen "Iḍāfa" verraet
       sich schon am Wort. */
    hinweis:'Die falschen Antworten stammen aus demselben Thema — es reicht nicht, den Namen zu erkennen.',
    hinweisVerraet:false,
    baue(z, satz){
      /* ⛔ uebungKeineRegel(): was keine Regel ist, wird hier weder gefragt
         noch als falsche Antwort angeboten (Elias, 19.09.2026 — der Satz
         steht bei der Funktion). Die Markierung selbst bleibt im Satz-Modus. */
      const tags = ((typeof SENTENCE_TAGS!=='undefined' && SENTENCE_TAGS[satz.id]) || [])
        .map(t=>({ t, rule: GRAMMAR_RULES.find(r=>r.id===t.ruleId) }))
        .filter(x=>x.rule && !regelAusgeblendet(x.rule) && !uebungKeineRegel(x.rule) && x.t.matchText);
      const out = [];
      /* Vorlauf: welche Stelle im Satz traegt WIE VIELE Markierungen? Muss vor
         der Schleife stehen, weil jede Aufgabe die Antwort auf ihre eigene
         Stelle braucht. Dieselbe Suche wie unten, deshalb als Funktion. */
      const spanneVon = (mt)=>{
        const w = String(mt).trim().split(/\s+/);
        if (w.length === 1){
          let i = z.findIndex(zeile=>zeile.rein === mt);
          if (i < 0) i = z.findIndex(zeile=>zeile.wort.includes(mt));
          return i < 0 ? null : (i + '-' + i);
        }
        for (let s2 = 0; s2 + w.length <= z.length; s2++){
          let passt = true;
          for (let k = 0; k < w.length; k++){
            if (z[s2+k].rein !== w[k] && !z[s2+k].wort.includes(w[k])){ passt = false; break; }
          }
          if (passt) return s2 + '-' + (s2 + w.length - 1);
        }
        return null;
      };
      const belegteStellen = new Map();
      tags.forEach(({t})=>{
        const sp = spanneVon(t.matchText);
        if (sp) belegteStellen.set(sp, (belegteStellen.get(sp) || 0) + 1);
      });
      tags.forEach(({t, rule})=>{
        /* Die Markierung sitzt auf einem Textstueck, nicht auf einem Wortindex —
           gesucht ist das Wort, in dem sie steckt. Erst wortgleich, dann
           enthalten.

           ⭐ Seit dem 19.08.2026 auch als WORTFOLGE: eine Markierung ueber
           mehrere Woerter (فِي الْحَقِيبَةِ) wurde vorher uebersprungen — damit
           fielen 21 der 95 Regeln komplett aus diesem Modus heraus und
           bekaemen nie einen Messwert in vt_regelStand. Elias' Auswahl saehe
           sie als „nie geuebt", obwohl sie nie GEFRAGT werden konnten.
           Gesucht werden aufeinanderfolgende Woerter, deren `rein` (ohne
           Satzzeichen, mit Harakat) der Folge entspricht. */
        const mtWorte = String(t.matchText).trim().split(/\s+/);
        let idx = -1, bis = -1;
        if (mtWorte.length === 1){
          idx = z.findIndex(zeile=>zeile.rein === t.matchText);
          if (idx < 0) idx = z.findIndex(zeile=>zeile.wort.includes(t.matchText));
          bis = idx;
        } else {
          for (let s = 0; s + mtWorte.length <= z.length; s++){
            let passt = true;
            for (let k = 0; k < mtWorte.length; k++){
              if (z[s+k].rein !== mtWorte[k] && !z[s+k].wort.includes(mtWorte[k])){ passt = false; break; }
            }
            if (passt){ idx = s; bis = s + mtWorte.length - 1; break; }
          }
        }
        if (idx < 0) return;
        /* ⚠️ Traegt dasselbe Wort mehrere Markierungen, ist die Frage nicht
           beantwortbar - dann sind zwei Antworten gleich richtig. Beim ersten
           Lauf am 30.07.2026 kam genau das heraus: an هَذَا standen drei
           Regeln zur Wahl, die alle ueber هَذَا sprechen. Solche Woerter
           werden uebersprungen, nicht willkuerlich einer Regel zugeschlagen.

           ⛔ GEPRUEFT WURDE ABER NUR DER GLEICHE matchText — und das ist nicht
           dieselbe Frage (06.09.2026 gemessen). In 45774
           „أَهَذَا كِتَابٌ؟ نَعَم، هَذَا كِتَابٌ." stehen zwei
           VERSCHIEDENE Markierungen: marfu-grundfall-01 auf „كِتَابٌ" und
           fragepartikel-erforderlich-01 auf „؟". Beide landen auf demselben
           Wort — كِتَابٌ؟ enthaelt beides. Ergebnis: zweimal dieselbe
           hervorgehobene Stelle mit zwei verschiedenen richtigen Antworten.
           Was Elias auch waehlt, einmal heisst es falsch.

           Jetzt zaehlt die STELLE, nicht der Text. Genau ein Fall im Bestand
           (320 Aufgaben), aber es ist derselbe Mangel, den der Kommentar
           darueber schon beschreibt. [[gegenprobe_sagt_wo_nicht_was]] */
        if (tags.filter(x=>x.t.matchText === t.matchText).length > 1) return;
        if (belegteStellen.get(idx + '-' + bis) > 1) return;
        /* Und die Ablenker duerfen nicht selbst in diesem Satz markiert sein -
           sie waeren dann ebenfalls richtig, nur an einem anderen Wort. */
        const imSatz = new Set(tags.map(x=>x.rule.id));
        /* ⛔ Verraet der Name der richtigen Regel das Wort? Dann Ablenker
           bevorzugen, die es AUCH tragen — und wenn davon weniger als zwei
           zusammenkommen, die Aufgabe gar nicht bauen. Warum das so streng
           ist, steht bei uebungNameNennt(). */
        const hervorWorte = uebungHervorWorte(z, idx, bis);
        const nenntWort   = r => uebungNameNennt(r, hervorWorte);
        const verraet     = hervorWorte.length > 0 && nenntWort(rule);
        const ablenker = uebungAblenker(rule, 3, imSatz, verraet ? nenntWort : null);
        if (ablenker.length < 2) return;   // sonst ist es keine Wahl
        if (verraet && ablenker.filter(nenntWort).length < 2) return;
        const optionen = shuffle([rule, ...ablenker]).map(r=>({ wert:r.id, text:r.name }));
        out.push({
          frage: bis > idx ? 'Welche Regel wird an der hervorgehobenen Stelle sichtbar?'
                           : 'Welche Regel wird am hervorgehobenen Wort sichtbar?',
          wortIdx:idx, wortIdxBis: bis > idx ? bis : undefined,
          optionen, loesung:rule.id,
          /* ⭐ Traegt die Markierung eine Glosse, steht sie MIT in der
             Aufloesung (26.08.2026). Elias' Fall: an اسْمُكِ wird nach der
             Regel gefragt, und die Antwort "Die Besitzendungen" sagt ihm
             nicht, dass das ـكِ die WEIBLICHE Anrede ist — das deutsche
             "dein" hat gar kein Geschlecht, die Uebersetzung des Satzes
             traegt die Information also nirgends. Genau dafuer gibt es das
             Feld `bedeutung` an der Markierung. Ohne diese Zeile haette es
             im Satzmodus gewirkt und in der Uebung nicht, und das waere
             niemandem aufgefallen. [[entscheidung_gilt_fuer_das_zweite_werkzeug]] */
          aufloesung: t.bedeutung ? rule.name + ' — ' + t.bedeutung : rule.name,
          /* Fuer den Fortschritt je Regel (19.08.2026). Steht ausdruecklich
             als eigenes Feld da und nicht als `loesung`: `loesung` ist die
             richtige ANTWORT dieser Aufgabe, `regelId` die Regel, die hier
             geuebt wird. In diesem Modus sind sie dasselbe — in einem
             kuenftigen Modus muessen sie es nicht sein. */
          regelId:rule.id
        });
      });
      return out;
    }
  },
  {
    id:'genus', nr:10, name:'مُذَكَّر / مُؤَنَّث — Geschlecht', art:'wahl',
    /* ⭐ Elias' Widerspruch vom 30.07., als ich den Reiter "Weiblich" aus dem
       Themenfilter genommen hatte: "nein das soll rein, es gibt ja auch
       Ausnahmen und Verkettungen von maennlichen und weiblichen Begriffen, das
       ist schon wichtig." Beides gilt gleichzeitig und ist kein Widerspruch:
       durchBLAETTERN wollte er das Thema nicht, GEPRUEFT werden schon. */
    /* ⛔ Der klarste Fall von `hinweisVerraet:true`: die fünf Wörter im
       Hinweis SIND die Wörter, nach denen gefragt wird. Wer den Hinweis vor
       dem Versuch liest, muss nichts mehr wissen. Genau diesen Fall fängt die
       zweite Zusicherung von `werkzeuge/pruefe-hinweise.mjs` mechanisch. */
    hinweis:'Meist zeigt ة das Weibliche an — aber nicht immer. Länder, يَدٌ, عَيْنٌ, أُذُنٌ, رِجْلٌ und بِنْتٌ sind weiblich ohne ة.',
    hinweisVerraet:true,
    baue(z){
      return z.map((t,i)=>{
        const v = uebungVokabel(t.wort);
        if (!v || !v.gender) return null;
        /* ⛔⛔ GEFRAGT IST DAS WORT IM SATZ, NICHT DIE LEXIKONFORM.

           Elias am 06.09.2026 an اللُّغَةُ الْعَرَبِيَّةُ سَهْلَةٌ: „ich habe
           weiblich angetippt und mir wurde gesagt das es falsch ist. aber in
           diesem kontext ist das wort doch weiblich wegen ta marbuta und dem
           kontext des satzes. ja sahlun ist in seiner grundform männlich aber
           in diesem satz ist er weiblich."

           Er hat recht, und die Daten belegen es: سَهْلٌ traegt
           femSg: "سَهْلَةٌ" — genau die Form, die im Satz steht. Die Uebung
           las aber `v.gender` der GRUNDFORM und antwortete „maennlich", obwohl
           die Frage lautet „Ist das hervorgehobene Wort …?".

           ⚠️ Nicht einfach „hat ة also weiblich": مَاennliche Namen auf Taʾ
           marbuta (أُسَامَةُ, حَمْزَةُ) und خَلِيفَة waeren dann falsch. Deshalb
           wird gegen die GEPFLEGTEN weiblichen Formen verglichen — steht das
           Satzwort dort, ist es die abgeleitete Form; sonst gilt das Lexikon.
           [[form_sagt_nicht_welche_beziehung]] */
        /* ⚠️ Ohne Satzzeichen: t.wort ist das Wort SAMT Punkt, und in der
           Aufloesung stand dann „سَهْلَةٌ. ist die weibliche Form". */
        const satzform = String(t.wort || '').replace(/[.،؟!«»:؛]+$/, '');
        const gleich = (a, b) => a && b && wortKern(a) === wortKern(b);
        const gepflegteForm = gleich(satzform, v.femSg) || gleich(satzform, v.femPl);
        /* ⛔⛔ UND der Fall, den `femSg` NICHT abdeckt — der eigentliche Fehler.

           Nach Elias' Satz „der fehler soll nicht mehr da sein" ueber alle 507
           Aufgaben nachgemessen (06.09.2026). Der femSg-Vergleich allein deckte
           43 ab; uebrig blieb einer, und er war falsch gewertet:
           „لِي أُخْتٌ وَاحِدَةٌ" — وَاحِدَةٌ steht in den Daten als `pl` von
           وَاحِدٌ, also greift weder `femSg` noch `femPl`, und die Uebung
           antwortete „maennlich".

           Ein gepflegtes Feld ist also keine Bedingung mehr: traegt die
           Satzform ein ة, das die Lexikonform NICHT hat, ist sie die
           abgeleitete weibliche Form. Damit haengt die Antwort an dem, was
           dasteht, statt an der Vollstaendigkeit der Daten.

           ⚠️ Die zweite Haelfte der Bedingung ist die wichtige: خَلِيفَةٌ,
           أُسَامَةُ und حَمْزَةُ tragen das ة schon im Lexikon und bleiben
           maennlich. Gepruefte Wirkung: genau eine Aufgabe aendert sich. */
        const abgeleitetesTa = !gleich(satzform, v.ar) && !gleich(satzform, v.sg)
          && /ة$/.test(uebungNackt(satzform)) && !/ة$/.test(uebungNackt(v.ar));
        const istFemForm = gepflegteForm || abgeleitetesTa;
        const weiblich = istFemForm || v.gender === 'feminine';
        /* Woran es liegt, wird BENANNT — und nur, wenn es wirklich daran
           liegt. „weil das Wort davor es ist" stimmte bei einem مُضَاف إِلَيْه
           nicht, siehe uebungBezugswort(). */
        const bezug = uebungBezugswort(z, i, weiblich);
        /* ⚠️ „Ausnahme ohne ة" gilt nur fuer NOMEN. Seit dem 05.09.2026 tragen
           auch die acht eindeutigen Personalpronomen ein `gender` (هِيَ, هُنَّ,
           أَنْتِ, أَنْتُنَّ weiblich) — sie haben nie ein ة, und „eine der
           Ausnahmen, die man mitlernen muss" waere dort schlicht falsch: ihr
           Geschlecht steht im Wort selbst, nicht in einer Endung. */
        const hatTa = /ة/.test(String(v.ar).replace(/[ً-ْٰـ]/g,'')) || v.type !== 'noun';
        return {
          frage:'Ist das hervorgehobene Wort مُذَكَّر oder مُؤَنَّث?',
          wortIdx:i, loesung:weiblich ? 'f' : 'm',
          optionen:[{wert:'m',text:'مُذَكَّر · männlich'},{wert:'f',text:'مُؤَنَّث · weiblich'}],
          /* Dass es eine Ausnahme ist, gehoert in die Aufloesung und nicht in
             die Frage - in der Frage waere es die Antwort.
             ⭐ Bei einer abgeleiteten Form nennt die Aufloesung BEIDE Formen.
             Vorher stand dort nur die Grundform („سَهْلٌ — leicht"), obwohl im
             Satz سَهْلَةٌ steht — das las sich wie ein Widerspruch zur eigenen
             Antwort. [[zitierform_ist_nicht_satzkontext]] */
          aufloesung: istFemForm
            ? (bezug
                ? `${satzform} ist die weibliche Form von ${v.ar} (${v.de}) — hier weiblich wegen ${bezug}.`
                : `${satzform} ist die weibliche Form von ${v.ar} (${v.de}).`)
            : (weiblich && !hatTa)
              ? `${v.ar} (${v.de}) ist weiblich OHNE ة — eine der Ausnahmen, die man mitlernen muss.`
              : `${v.ar} — ${v.de}`
        };
      }).filter(Boolean);
    }
  },
  {
    id:'isara', nr:11, name:'هَذَا / ذَلِكَ — alle Hinweiswörter', art:'wahl',
    hinweis:'Das Hinweiswort richtet sich nach Geschlecht und Zahl des Wortes danach (isara-genus-kongruenz-01). Ob nah oder fern, zeigt die deutsche Zeile.',
    /* Diese Wörter der deutschen Zeile bleiben lesbar (renderUebung) — dieselben,
       an denen deNah/deFern unten nah und fern ablesen. */
    deKlar: /^(dies(e|er|es|en|em)?|jen(e|er|es|en|em)?|hier|dort)[.,;:!?]*$/i,
    hinweisVerraet:false,
    /* ⭐⭐ SEIT 24.09.2026 ALLE HINWEISWÖRTER SEINER KARTE, nicht nur zwei.
       Elias: „die 11te übung bei satzmodus hat bisher nur hadha und hadhihi
       aber eigentlich könnte man das mit all diesen hinweiswörtern erweitern
       sodass ich nicht nur zwei übe." Gemessen vorher: 141 Aufgaben, und JEDE
       bot genau zwei Wörter zur Wahl (هَذَا/هَذِهِ oder ذَلِكَ/تِلْكَ).

       Die zehn Formen kommen aus seiner Karte „Ism al-išāra" (FOLGE19_KARTEN,
       f19-isara: Nah und Fern, je Singular m./f., Dual m./f., Plural) — dazu
       jede Karteikarte, die er abgefragt wird und die „dies…"/„jen…" heißt.

       ⛔ Zur Wahl steht nur, was man AM SATZ entscheiden kann:
       - nah oder fern verrät der arabische Satz nicht (هَذَا بَيْتٌ und
         ذَلِكَ بَيْتٌ sind beide richtig). Die andere Entfernung steht deshalb
         nur zur Wahl, wenn die deutsche Zeile sie nennt (dies…/hier bzw.
         jen…/dort) — die deutsche Zeile steht in jeder Übung darunter.
       - Dual und Plural stehen als Ablenker nur, wenn das Wort danach
         eindeutig Einzahl ist, oder wenn die Lösung selbst Dual/Plural ist.
         Sonst wäre هَذِهِ vor einem Sachplural (كُتُبٌ) eine Falle. */
    baue(z, satz){
      const glieder = uebGruppe('f19-isara', w => /^(dies|jen)/i.test(String(w.de || '').trim()));
      if (glieder.length < 2) return [];
      const zahl = g => /beide/i.test(g.de) ? 'dual' : (/plural|\bpl\b/i.test(g.de) ? 'plural' : 'sg');
      const fern = g => g.gruppe === 'Fern' || (g.gruppe === 'Karte' && /^jen/i.test(g.de));
      const de = String((satz && satz.sentDe) || '');
      const deFern = /\b(jen(e|er|es|en|em)?|dort)\b/i.test(de);
      const deNah = /\b(dies(e|er|es|en|em)?|hier)\b/i.test(de);
      const out = [];
      z.forEach((t,i)=>{
        /* Ohne ein Wort danach gibt es nichts, woran man es erkennen koennte. */
        if (!z[i+1]) return;
        const tr = uebTreffer(t.rein, glieder);
        if (!tr) return;
        const L = tr.glied, lFern = fern(L);
        const deSagt = lFern ? (deFern && !deNah) : (deNah && !deFern);
        const einzahl = uebKlarEinzahl(z[i+1]);
        const wahl = glieder.filter(g => g === L
          || ((fern(g) === lFern || deSagt) && (zahl(L) !== 'sg' || zahl(g) === 'sg' || einzahl)));
        if (wahl.length < 2) return;
        out.push({
          frage:'Welches Hinweiswort gehört hierhin?',
          wortIdx:i, verdeckt:true,
          loesung: L.form,
          optionen: wahl.map(g => ({ wert:g.form, text: tr.vorsatz + g.form })),
          aufloesung:`Es geht um ${z[i+1].rein}: ${L.form} heißt „${L.de}" (${lFern ? 'fern' : 'nah'}).`
        });
      });
      return out;
    }
  },
  {
    id:'fem-form', nr:12, name:'صَغِيرٌ / صَغِيرَةٌ — weibliche Form', art:'wahl',
    hinweis:'Männliche oder weibliche Form? Die Antwort steht im Wort davor — oder im Hinweiswort.',
    hinweisVerraet:false,
    baue(z){
      return z.map((t,i)=>{
        const v = uebungVokabel(t.wort);
        if (!v || !v.femSg) return null;
        const maennlich = String(v.sg || v.ar), weiblich = String(v.femSg);
        const formen = uebungKandidaten(t.wort);
        const istWeiblich = formen.includes(uebungOhneEndung(weiblich));
        const istMaennlich = formen.includes(uebungOhneEndung(maennlich));
        /* Nur fragen, wenn eindeutig ist, WELCHE der beiden Formen dasteht. */
        if (istWeiblich === istMaennlich) return null;
        /* ⛔⛔ UND nur fragen, wenn die Antwort AM SATZ ablesbar ist.

           Das Wort ist verdeckt — wer raten soll, braucht einen Anhaltspunkt.
           Bei „هَذِهِ سَيَّارَةُ الْمُدِيرِ" gibt es keinen: الْمُدِيرِ ist
           مُضَاف إِلَيْه, مُدِيرَةٌ waere genauso richtig. Die Aufgabe stand
           trotzdem da, mit der falschen Begruendung „Es richtet sich nach
           سَيَّارَةُ." — sie nannte einfach den linken Nachbarn.

           Am 06.09.2026 gemessen: 31 der 199 Aufgaben waren so gebaut, 11
           davon mit dieser irrefuehrenden Begruendung. Sie fallen jetzt weg;
           168 bleiben. [[bedingung_wird_durch_die_handlung_ungueltig]] */
        const bezug = uebungBezugswort(z, i, istWeiblich);
        if (!bezug) return null;
        return {
          frage:'Welche Form gehört hierhin?',
          wortIdx:i, verdeckt:true,
          loesung: istWeiblich ? 'f' : 'm',
          optionen:[{wert:'m',text:maennlich},{wert:'f',text:weiblich}],
          aufloesung: `Es richtet sich nach ${bezug}.`
        };
      }).filter(Boolean);
    }
  },
  /* ⭐⭐ FRAGEWORT EINSETZEN — Elias am 24.09.2026, 22:49, mit Bild der Karte
     „wann": „wie wäre es mit einem satzmodus übung wo ich die passenden
     fragewörter in den satz einfügen muss und zur auswahl halt alle die ich
     habe und natürlich soll auch das immer aktuell bleiben also wenn ich neue
     lerne dann die auch impimentieren sobald sie da sind".
     Die Auswahl: seine Karte „Fragewörter" (f19-fragen) plus jede Karteikarte,
     die er abgefragt wird und die ein Fragewort ist — gelesen bei jedem
     Aufbau (uebGruppe oben), deshalb kommen neue von selbst dazu.
     ⛔ Drei Fallen, alle drei hier abgefangen:
     - „was?" heißt مَا UND مَاذَا — zwei richtige Antworten wären keine
       Aufgabe. Steht eins als Lösung, fehlt das andere in der Auswahl.
     - مِنْ أَيْنَ („woher") und إِلَى أَيْنَ („wohin") sind zwei Wörter; dort
       wird أَيْنَ nicht gefragt, weil es allein „wo" hieße.
     - مَا ist auch die Verneinung. Gefragt wird nur in einem Fragesatz. */
  {
    id:'fragewort', nr:13, name:'مَنْ / مَا / أَيْنَ … — Fragewort einsetzen', art:'wahl',
    hinweis:'Welches Fragewort gehört hierhin? Die deutsche Zeile sagt, wonach gefragt wird.',
    deKlar: /^(wer|wen|wem|wessen|was|wo|woher|wohin|wie|viele|wann|warum|weshalb|wieso|welche[rsnm]?|ob)[.,;:!?]*$/i,
    hinweisVerraet:false,
    baue(z, satz){
      const frage = /[؟?]\s*$/.test(String((satz && satz.sentAr) || ''))
        || /\?\s*$/.test(String((satz && satz.sentDe) || ''));
      if (!frage) return [];
      const glieder = uebGruppe('f19-fragen', w => {
        const de = String(w.de || '').trim();
        return /\?\s*$/.test(de)
          || (w.type === 'particle' && de.split(/[\/;,]/).some(x => UEB_FRAGE_DE.test(x.trim())));
      });
      const out = [];
      z.forEach((t,i)=>{
        const tr = uebTreffer(t.rein, glieder);
        if (!tr) return;
        const L = tr.glied;
        const davor = i > 0 ? uebSkelett(z[i-1].rein) : '';
        if (L.skelett === 'اين' && ['من', 'الى', 'الي'].includes(davor)) return;
        const bed = uebBedeutung(L.de);
        const wahl = glieder.filter(g => g === L || uebBedeutung(g.de) !== bed);
        if (wahl.length < 2) return;
        out.push({
          frage:'Welches Fragewort gehört hierhin?',
          wortIdx:i, verdeckt:true,
          loesung: L.form,
          optionen: wahl.map(g => ({ wert:g.form, text: tr.vorsatz + g.form })),
          aufloesung:`${L.form} heißt „${L.de}".`
        });
      });
      return out;
    }
  },
  /* ⭐⭐ PRONOMEN EINSETZEN — Elias am 24.09.2026, 22:55, mit Bild seiner Karte
     „الضمائر · Pronomen": „ein satzmodus übung die auch gut wäre, wäre wenn ich
     die jeweilis passenden pronomen in den satz einfügen muss und zur auswahl
     halt alle die ich habe und natürlich soll auch das immer aktuell bleiben".
     Die Auswahl: die zwölf Pronomen seiner Karte (f19-pronomen) plus jede
     Karteikarte vom Typ Pronomen, die er abgefragt wird.
     ⛔ „sie", „du" und „ihr" sind im Deutschen mehrdeutig (هِيَ/هُمْ/هُنَّ,
     أَنْتَ/أَنْتِ …). Dann wird nur gefragt, wenn das Wort danach Geschlecht
     oder Zahl zeigt — sonst wäre die Lösung geraten. */
  {
    id:'pronomen', nr:14, name:'هُوَ / هِيَ / أَنْتَ … — Pronomen einsetzen', art:'wahl',
    /* ⭐ Die Knöpfe laufen von RECHTS nach links (25.09.2026). Elias mit Bild:
       „kannst du mit huwa beginnen ganz rechts oben und dann der reihe nach so
       wie du es hier auch hast weiter machen aber halt einfach andersherum …
       ich will halt huwa, hiya, huma usw". Reihenfolge bleibt, nur gespiegelt. */
    optionenRtl: true,
    hinweis:'Welches Pronomen gehört hierhin? Person, Geschlecht und Zahl zeigen das Wort danach und die deutsche Zeile.',
    deKlar: /^(ich|du|er|sie|es|wir|ihr)[.,;:!?]*$/i,
    hinweisVerraet:false,
    baue(z){
      const glieder = uebGruppe('f19-pronomen', w => w.type === 'pronoun'
        && /^(ich|du|er|sie|es|wir|ihr)\b/i.test(String(w.de || '').trim()));
      if (glieder.length < 2) return [];
      const out = [];
      z.forEach((t,i)=>{
        const tr = uebTreffer(t.rein, glieder);
        if (!tr) return;
        const L = tr.glied;
        let verb = null;
        if (/^(sie|du|ihr)\b/i.test(L.de)){
          const n = z[i+1];
          if (!n) return;
          const nomen = typeof uebungIstWeiblichImSatz === 'function' && uebungIstWeiblichImSatz(n.wort) !== null;
          /* Sonst das Verb danach (uebMadiPronomen, oben): seine Endung muss
             genau zu DIESEM Pronomen gehören. */
          const m = nomen ? null : uebMadiPronomen(n.wort);
          if (!nomen && !(m && m.p === String(L.form).normalize('NFC'))) return;
          if (m) verb = { wort: n.rein, endung: 'ـ' + m.e };
        }
        out.push({
          frage:'Welches Pronomen gehört hierhin?',
          wortIdx:i, verdeckt:true,
          loesung: L.form,
          optionen: glieder.map(g => ({ wert:g.form, text: tr.vorsatz + g.form })),
          aufloesung:`${L.form} heißt „${L.de}".` + (verb ? ` Das Verb ${verb.wort} endet auf ${verb.endung}.` : '')
        });
      });
      return out;
    }
  },
  /* ⭐⭐ ENDUNG EINSETZEN — Elias am 25.09.2026 (Wortlaut bei uebEndungGlieder
     oben): „wo ich die richtigen endungen hinzufügen muss wie zb ki für frau
     oder ha und hu usw.. also halt alle die bisher zur auswahl stehen".
     Das Wort steht ohne Endung da (قَلَمـ), zur Wahl stehen seine Endungen.
     ⛔ Drei Fallen, alle drei hier abgefangen:
     - „dein" sagt nicht, ob ein Mann oder eine Frau gemeint ist (ـكَ/ـكِ) —
       dann steht der Zusatz seiner Karte in der Frage („zu einer Frau").
     - Steht dasselbe Wort mit derselben Endung zweimal im Satz (مَعَهُ …
       مَعَهُ), verriete das zweite die Lösung: es steht dann auch ohne Endung
       da, und aus dem Paar wird EINE Aufgabe.
     - An Präpositionen hängen dieselben Endungen (لِي, فِيهَا, مَعَهُ) — sie
       werden mitgefragt; die deutsche Zeile sagt dort „mir", „darin", „mit ihm". */
  {
    id:'endungen', nr:15, name:'ـكِ / ـهَا / ـهُ … — Endung einsetzen', art:'wahl',
    /* Wie Übung 14: die Knöpfe von rechts nach links, in der Reihenfolge seiner
       Karte (ـِي, ـكَ, ـكِ, ـهُ, ـهَا) — seine Worte dort: „huwa, hiya, huma usw". */
    optionenRtl: true,
    hinweis:'Wer ist gemeint — ich, du, er oder sie? Das zeigt die deutsche Zeile.',
    deKlar: /^((mein|dein|sein|ihr|unser|eur|euer)(e|en|em|er|es)?|ich|du|er|sie|mir|dir|ihm|ihn|mich|dich|darin)[.,;:!?]*$/i,
    hinweisVerraet:false,
    baue(z){
      const glieder = uebEndungGlieder();
      if (glieder.length < 2) return [];
      const stellen = z.map(t => uebEndungStelle(t, glieder));
      const schluessel = st => uebEndungSkelett(st.stamm) + '|' + st.glied.form;
      const erledigt = new Set(), out = [];
      stellen.forEach((st, i) => {
        if (!st || erledigt.has(i)) return;
        const L = st.glied;
        const zwillinge = stellen.map((x, j) => (j !== i && x && schluessel(x) === schluessel(st)) ? j : -1).filter(j => j >= 0);
        zwillinge.forEach(j => erledigt.add(j));
        let zusatz = '';
        if (glieder.filter(g => g.bed && g.bed === L.bed).length > 1){
          /* Ohne Angabe, wer angesprochen ist, wäre die Lösung geraten. */
          if (!/^zu\s/i.test(L.zusatz)) return;
          zusatz = ` Gesprochen wird ${L.zusatz}.`;
        }
        /* Das Satzzeichen dahinter bleibt stehen (أَيْنَ أَبُوـ؟) — das „?" sagt
           mit, was für ein Satz das ist. Gemessen im eigenen Tab: ohne es fehlte
           das Fragezeichen, bis er geantwortet hatte. */
        const ohneSuffix = {};
        [i, ...zwillinge].forEach(j => { ohneSuffix[j] = stellen[j].vorsatz + stellen[j].stamm + 'ـ'
          + ((String(z[j].wort || '').match(/[.،؟?!:؛]+$/) || [''])[0]); });
        out.push({
          frage:'Welche Endung gehört an das hervorgehobene Wort?' + zusatz,
          wortIdx:i, ohneSuffix,
          loesung: L.form,
          optionen: glieder.map(g => ({ wert:g.form, text:g.form })),
          aufloesung:`So heißt es: ${z[i].rein}. ${L.form} ist ${L.de}.`,
          warum: L.regel || undefined
        });
      });
      return out;
    }
  },
  /* ⭐⭐ ÜBERSETZEN — Elias' Auftrag vom 22.09.2026, 21:15, im Wortlaut:

     „es sollte auch im satzmodus eine übung geben, wo mir ein satz gegeben wird
      und den soll ich dann ins deutsche übersetzten. wenn ich falsch mache muss
      erkannt werden was falsch ist und warum und mir das dann zeigen"
     „und die richtige deutsche überstzung und halt warum"

     Die Prüfung selbst steht in js/uebersetzen.js — eigene Datei, damit sie im
     Pflegeplan auftaucht und in den Offline-Vorrat kommt. Hier steht nur, dass
     es die Übung gibt.

     ⛔⛔ `deVerbergen` IST DER GRUND, WARUM DIESE ÜBUNG SONST WERTLOS WÄRE.
     renderUebung() setzt die deutsche Übersetzung in JEDER Satzübung unter den
     arabischen Satz (`uebDe`). Bei allen anderen ist das eine Hilfe; hier
     stünde die Lösung über dem Eingabefeld. Das Feld ist neu und heißt nicht
     „verbergen", sondern sagt, WAS verborgen wird — ein Name wie `verbergen`
     wäre beim nächsten Lesen nicht mehr zuzuordnen.

     ⚠️ Kein `hinweisVerraet:true`: der Hinweis nennt die beiden Dinge, auf die
     zu achten ist, aber keine Lösung. Das Feld ist trotzdem Pflicht und steht
     deshalb ausdrücklich da (pruefe-hinweise.mjs). */
  {
    /* Seit v612 Nummer 16 (vorher 15): die Endungen-Übung ist eine Auswahl-Übung
       und steht in der Liste vor „Schreiben" — Elias: „ich möchte das die liste
       liniar von 1 bis 15 geht ohne das daraus salat gemacht wird". */
    id:'uebersetzen', nr:16, name:'Übersetzen — Arabisch ins Deutsche', art:'schreiben',
    hinweis:'Achte auf die Bestimmtheit (اَلْ oder Tanwīn) und darauf, wer in der إِضَافَة der Besitzer ist.',
    hinweisVerraet:false,
    deVerbergen:true,
    baue(z, satz){
      if (!satz || !String(satz.sentDe || '').trim()) return [];
      /* ⚠️ Ein Satz aus einem einzigen Wort ist keine Übersetzungsaufgabe —
         dort gäbe es nichts zu entscheiden, und jede der sieben Prüfungen
         liefe ins Leere. */
      if (!Array.isArray(z) || z.length < 2) return [];
      return [{
        frage:'Übersetze diesen Satz ins Deutsche.',
        art:'schreiben'
      }];
    }
  }
];

/* ⛔⛔ WAS KEINE REGEL IST, GEHOERT NICHT IN „WELCHE REGEL?" (19.09.2026)

   Elias, 03:10:57, mit einem Bildschirmfoto von „9. Welche Regel?" an
   هَذَا الْكِتَابُ خَفِيفٌ. Hervorgehoben war الْكِتَابُ, zur Wahl standen
   اَللّٰه (helle und dunkle Aussprache) · شَكْل (Vokalzeichen) ·
   اِلْتِقَاءُ السَّاكِنَيْن (zwei Vokallose treffen sich) · هَمْزَةُ الوَصْل:
   „helle und dunkle aussprache von allah ist hier komplett irrelevant. das hat hier nichts zu suchen. und schekel in diesem zusammenhang verstehe ich auch nicht. generell alle antowrtoptionen sind eigentlich keine regeln. was haben die hier zu suchen. mache das weg und alle die dem ähnlich oder gleich sind"

   Gemessen (Nachbau der Uebung ausserhalb der App, 221 Saetze, 294
   Aufgaben): alle vier stammen aus dem Thema „Schrift". Weil die Ablenker
   aus DEMSELBEN Thema kommen (uebungAblenker), sah jede der 27 Aufgaben mit
   einer Schrift-Antwort genau so aus. Das Allah-Wort war NIE die richtige
   Antwort und stand trotzdem rund 21-mal je Aufbau als falsche da.

   Hier faellt weg, als Frage UND als falsche Antwort:
   ① das ganze Thema „Schrift" — wie man Zeichen liest und schreibt. Ueber
     das Muster in SATZ_THEMEN, damit eine neue Schrift-Regel von selbst
     mitfaellt. Das ist „gleich".
   ② Eintraege, die schon im NAMEN sagen, dass sie keine Regel sind: eine
     Namenserklaerung, eine Merkhilfe, ein Ueberblick. An einem Wort
     „sichtbar" ist davon nichts. Das ist MEINE Lesart von „ähnlich";
     test-welche-regel.mjs wird rot, wenn ein neuer Eintrag so heisst und
     hier fehlt.
   ⚠️ Bewusst DRIN (meine Lesart, ihm so gesagt): Aussprache-Regeln, die an
   einem bestimmten Wort haengen — Sonnen-/Mondbuchstaben bei اَلْ (ein
   Pruefungsthema seines Lehrers), مِنَ vor اَلْ, لِلْ, لَكَ, فِيهِ.
   ⚠️ Die Regeln selbst bleiben in der App (Regelsammlung, Markierungen im
   Satz-Modus) — wie bei „Bestimmt?" am 16.09.: nur die Uebung laesst sie weg. */
const UEBUNG_KEINE_REGEL = ['harf-jarr-name-01', 'schams-qamar-merkhilfe-01', 'istifham-uebersicht-01'];
function uebungKeineRegel(r){
  if (!r) return true;
  if (UEBUNG_KEINE_REGEL.includes(r.id)) return true;
  const schrift = (typeof SATZ_THEMEN !== 'undefined') ? SATZ_THEMEN.find(t => t.id === 'schrift') : null;
  return !!(schrift && schrift.muster && schrift.muster.test(r.id));
}

/* Ablenker fuer Modus 10: Regeln aus demselben Thema. Faellt das Thema aus
   (eine Regel, die in keinem Muster steht), wird auf die Farbgruppe
   ausgewichen - die buendelt inhaltlich Verwandtes. */
/* ⚠️ Der Ablenker muss sich AM NAMEN unterscheiden lassen, sonst ist die Frage
   unfair. Beim ersten Lauf am 30.07.2026 standen zur Wahl: "هَذَا (dies)",
   "هَذَا (dies – nicht „das")" und "هَذَا (Alif wird gesprochen, nicht
   geschrieben)". Das sind drei verschiedene, korrekt belegte Regeln - aber an
   ihren Namen ist nicht zu entscheiden, welche gemeint ist.
   Die Ursache liegt in der Benennung in grammar-data.js, nicht in der Auswahl
   hier; geaendert werden die Namen aber NICHT (sie stehen so an vielen
   Stellen). Stattdessen gilt ein Ablenker mit demselben Namensstamm - dem Teil
   vor der Klammer - als letzte Wahl. */
const uebungNamensstamm = r => String(r.name || '').split('(')[0].trim();

function uebungAblenker(rule, anzahl, verboten, bevorzugt){
  const aus = verboten || new Set();
  const stamm = uebungNamensstamm(rule);
  const brauchbar = r => r.id !== rule.id && !regelAusgeblendet(r) && !uebungKeineRegel(r) && !aus.has(r.id);
  /* ⛔ `find` — die ERSTE passende Kategorie gewinnt, und drei Regeln passen
     auf zwei Muster: verb-enthaelt-pronomen-01 (wortarten + verben),
     zarf-als-mudaf-01 (idafa + zarf), adjektive-an-ohne-tanwin-01 (nat + al).
     Fuer sie entscheidet also die REIHENFOLGE in SATZ_THEMEN, welche Regeln
     als falsche Antworten angeboten werden.

     Am 26.08.2026 geprueft und bewusst SO GELASSEN: hier geht es nur um
     plausible Ablenker, und beide Kategorien liefern plausible. Ein Fehler
     waere es erst, wenn davon abhinge, was Elias LERNT.

     ⚠️ Deshalb wird SATZ_THEMEN selbst nicht sortiert. Die Anzeige im
     Satzmodus steht seit dem 26.08. nach Aktualitaet — das rechnet
     themenNachAktualitaet() in js/saetze.js auf einer KOPIE. Wer die Liste
     an der Quelle umsortiert, aendert hier still die Ablenker mit. */
  const thema = (typeof SATZ_THEMEN !== 'undefined')
    ? SATZ_THEMEN.find(t=>t.muster && t.muster.test(rule.id)) : null;
  const imThema = r => thema ? thema.muster.test(r.id) : r.color === rule.color;
  const kandidaten = GRAMMAR_RULES.filter(brauchbar);
  const nah        = kandidaten.filter(r=>uebungNamensstamm(r) === stamm);
  const passend    = kandidaten.filter(r=>!nah.includes(r) && imThema(r));
  const rest       = kandidaten.filter(r=>!nah.includes(r) && !passend.includes(r));
  const reihe = shuffle(passend).concat(shuffle(rest)).concat(shuffle(nah));
  /* ⛐ Bevorzugte zuerst — aber NICHT gefiltert: wer nur sie zuliesse, saehe
     bei einem seltenen Wort gar keine Ablenker mehr und verloere die Aufgabe,
     obwohl der Aufrufer sie danach ohnehin selbst prueft. */
  if (typeof bevorzugt === 'function')
    return reihe.filter(bevorzugt).concat(reihe.filter(r=>!bevorzugt(r))).slice(0, anzahl);
  return reihe.slice(0, anzahl);
}

/* ===================== Ablauf =====================
   Ein Zustand, ein Aufbau, eine Auswertung - fuer alle dreizehn. */
let UEB = { modus:null, liste:[], idx:0, gewaehlt:new Set(), beantwortet:false,
            richtig:0, gestellt:0 };
/* Die Aufgabe, deren deutsche Übersetzung gerade aufgedeckt ist (sonst
   verschwommen — renderUebung, Begründung bei SENT_DE_OFFEN in js/saetze.js). */
let UEB_DE_OFFEN = null;

/* Aufgaben werden je Thema EINMAL gebaut und gemerkt. Ohne das liefe
   analysiereSatz() bei jedem Reiterwechsel 186 mal je Modus - also 2418 mal,
   nur um die Zahlen an die Reiter zu schreiben.

   ⛔ DAS THEMA ALLEIN REICHT ALS SCHLUESSEL NICHT.
   Am 20.08.2026 im Browser gemessen: Satzmodus offen (Cache voll), dann in den
   Einstellungen ein Kapitel abgewaehlt, dann zurueck in den Satzmodus.
   `openSentences()` baut SENT.list richtig neu - 251 Saetze wurden zu 220 -,
   aber SATZ_THEMA war unveraendert, also griff der Cache: die Leiste zeigte
   weiter 5032 Aufgaben statt 4424, und die Aufgaben stammten aus Saetzen, die
   gar nicht mehr im Vorrat sind.

   Das trifft genau den haeufigsten Fall: Elias hakt ein Kapitel an. Deshalb
   gehoert die Satzliste in den Schluessel. Ein Fingerabdruck aus den IDs statt
   nur der Laenge - zwei Listen koennen gleich lang und verschieden sein. */
let UEB_CACHE = { thema:null, liste:null, nachModus:null };
const uebListenAbdruck = () => (typeof SENT !== 'undefined' && SENT.list)
  ? SENT.list.map(s=>s.id).join(',') : '';

/* ⛔⛔ KEINE AUFGABE, DEREN ANTWORT IN DER DEUTSCHEN UEBERSETZUNG STEHT.

   Elias am 06.09.2026, nachdem der arabische Verrat in Uebung 10 behoben war:
   „wenn die deutsche uebersetzung von einer antwortmoeglichkeit bereits
   verraet (so wie bei unseren beispiel zb) dann muss das auch geaendert
   werden" — und danach: „guck ob es irgendsowas gibt".

   Es gibt es, und nicht nur in Uebung 10. Gemessen ueber alle dreizehn:
     10 regel     5 Aufgaben   „jenes"  in „dies ist Zucker und JENES ist Milch."
      8 wortart   6 Aufgaben   „Nomen"  in „«al-bayti» ist ein NOMEN im Genitiv."
      6 kasus     2 Aufgaben   „Genitiv" in „das sind die fuenf GENITIV-Praepositionen."
   Es sind Saetze, die selbst von Grammatik handeln — dort steht die Antwort
   auf Deutsch daneben.

   ⚠️ Verglichen wird WORTWEISE, nicht als Teilzeichenkette. Die erste Fassung
   meldete zusaetzlich fuenf Treffer in Uebung 7, weil „amma" aus „Ḍamma" in
   „Ammars Heft" und in „Muhammad" steckt. Das waren meine Fehler, nicht die
   der Uebung. [[stichworttreffer_ist_kein_inhaltstreffer]]

   ⭐ Die Schranke sitzt in uebungenAufbauen() und gilt damit fuer ALLE Modi,
   auch fuer kuenftige — statt in jedem baue() einzeln.
   [[allgemeine_regel_statt_listeneintrag]] */
const UEB_DE_STOPP = new Set(['dies','das','der','die','den','dem','ein','eine',
  'einer','eines','und','oder','nach','mit','ohne','wird','sind','ist','sich',
  'sein','seine','nicht','auch','beim','vom','zum','zur','für','aus','bei',
  'als','wie','vor','steht','stehen','zwei','drei','alle','man','kann','wenn',
  'dann','immer','nur','hier','dort','dieser','diese','dieses']);
const UEB_DE_WORT = /[a-zäöüß]+/g;
const uebungDeWorte = t => (String(t || '').toLowerCase().match(UEB_DE_WORT) || [])
  .filter(w => w.length >= 4 && !UEB_DE_STOPP.has(w));

/* ⛔⛔ EIN ZITIERTES WORT IST KEIN SATZGLIED (06.09.2026 gemessen).
 *
 * Die Fachbegriff-Saetze sprechen ueber Grammatik und zitieren dabei Woerter
 * in Guillemets: „فِي الْبَيْتِ: «الْبَيْتِ» اِسْمٌ مَجْرُورٌ." Das zweite
 * الْبَيْتِ steht dort in seiner ZITIERFORM — es ist Gegenstand der Aussage,
 * nicht Teil ihres Satzbaus.
 *
 * `analysiereSatz()` weiss das nicht und liest es als مُبْتَدَأ. Ergebnis:
 * eine Aufgabe „In welchem Fall steht das hervorgehobene Wort?" mit der
 * Loesung **raf** — waehrend im selben Satz daneben steht, es sei
 * مَجْرُور. Wer richtig antwortet, bekommt „falsch".
 *
 * Gemessen: 25 Aufgaben stehen auf einem Wort in Guillemets, 13 davon auf
 * einem, dessen Endung die Analyse fuer falsch haelt, dazu 8 Tipp-Aufgaben
 * mit einem Zitatwort als Ziel. Von 4715 sind das 0,5 % — der Verlust ist
 * kleiner als der Schaden einer Aufgabe, die sich selbst widerspricht.
 *
 * ⚠️ Es wird NICHT nach „Anfuehrungszeichen" gesucht, sondern nach den
 * Guillemets « » — die deutschen „ " kommen in den Uebersetzungen vor und
 * haetten die halbe Liste getroffen.
 * [[zitierform_ist_nicht_satzkontext]] [[erfundene_begruendung_schliesst_den_fall]] */
const UEB_ZITAT = /[«»]/;
function uebungAufZitat(a){
  if (!a || !a.zeilen && !a.wortIdx && !a.ziele) return false;
  const wortAn = i => String((a.zeilen && a.zeilen[i] && a.zeilen[i].wort) || '');
  if (a.wortIdx != null){
    /* Auch die Spanne pruefen: eine Markierung kann mehrere Woerter fassen. */
    const bis = a.wortIdxBis != null ? a.wortIdxBis : a.wortIdx;
    for (let i = a.wortIdx; i <= bis; i++) if (UEB_ZITAT.test(wortAn(i))) return true;
  }
  if (Array.isArray(a.ziele)) for (const i of a.ziele) if (UEB_ZITAT.test(wortAn(i))) return true;
  return false;
}

function uebungVerraetDeutsch(a, satz){
  if (!a || !a.optionen || a.loesung == null) return false;
  const de = String((satz && satz.sentDe) || '').toLowerCase();
  if (!de) return false;
  const imSatz = new Set(de.match(UEB_DE_WORT) || []);
  const treffer = a.optionen.filter(o => uebungDeWorte(o.text).some(w => imSatz.has(w)));
  return treffer.length === 1 && treffer[0].wert === a.loesung;
}

function uebungenAufbauen(){
  const abdruck = uebListenAbdruck();
  if (UEB_CACHE.thema === SATZ_THEMA && UEB_CACHE.liste === abdruck && UEB_CACHE.nachModus)
    return UEB_CACHE.nachModus;
  if (typeof setzeLexikon === 'function') setzeLexikon(VOCAB_DATA);
  /* Die Wortgruppen der Übungen 11, 14, 15 je Aufbau neu lesen: eine Karte,
     die heute freigeschaltet wurde, gehört ab jetzt zur Auswahl. */
  UEB_WORTGRUPPEN = {};
  const nachModus = {};
  UEBUNGEN.forEach(m=>nachModus[m.id] = []);
  SENT.list.forEach(satz=>{
    if (!satz.sentAr) return;
    const zeilen = analysiereSatz(satz.sentAr);
    UEBUNGEN.forEach(m=>{
      let aufgaben = [];
      try { aufgaben = m.baue(zeilen, satz) || []; }
      catch(e){ aufgaben = []; }   // ein kaputter Modus darf nicht die anderen mitnehmen
      aufgaben.forEach(a=>{
        if (uebungVerraetDeutsch(a, satz)) return;
        /* ⛔ Die Zeilen muessen VOR der Pruefung dran sein — uebungAufZitat()
           schlaegt sonst im Leeren nach und laesst alles durch. */
        if (uebungAufZitat({ ...a, zeilen })) return;
        nachModus[m.id].push({ ...a, satz, zeilen, modus:m });
      });
    });
  });
  UEB_CACHE = { thema:SATZ_THEMA, liste:abdruck, nachModus };
  return nachModus;
}

/* Waehler mit Gruppen — Elias' Entscheidung vom 19.08.2026 (Entwurf B3).
   Gruppiert wird nach dem Feld `art`, das die Modi ohnehin tragen: die
   Ueberschrift sagt, WAS man tun muss, bevor man den Namen liest.

   ⛔ Der alte Streifen war 2061 px breit bei 13 Modi. Jeder neue Modus
   verlaengerte den Wischweg, ohne dass mehr zu sehen war — genau das, was
   Elias dreimal gemeldet hat. */
/* ⚠️ Seit dem 16.09.2026 sind alle Tipp-Übungen `mehrfach` (die Frage verrät
   die Anzahl nicht mehr, siehe uebungSammel). Die frühere Gruppe
   „Antippen" für `tippen` bliebe leer und fällt deshalb weg. */
const UEB_GRUPPEN = [
  ['Antippen',         'mehrfach'],
  ['Auswählen',        'wahl'],
  /* ⭐ Dritte Gruppe seit dem 22.09.2026 — die Übersetzungsübung. Die
     Überschrift sagt, WAS man tun muss, bevor man den Namen liest; „Schreiben"
     ist bei dieser Übung die eigentliche Information. */
  ['Schreiben',        'schreiben']
];

function renderUebungsLeiste(){
  const blatt = document.getElementById('uebBlatt');
  if (!blatt) return;
  const alle = uebungenAufbauen();
  const zeile = m => {
    /* Die Zahl einer Runde, nicht des ganzen Vorrats — seit „je Antwort gleich
       viele" (uebungAnzahl) ist das nicht mehr dasselbe. */
    const n = uebungAnzahl(alle[m.id]);
    /* Die Zahl steht dran, auch wenn sie 0 ist. Elias' Auflage: ein Modus
       ohne Fragen sagt das ehrlich, statt ins Leere zu laufen. */
    return `<button class="zeile${UEB.modus===m.id?' aktiv':''}${n?'':' leer'}" type="button" data-uebmodus="${m.id}"`
         + `${n?'':' title="In dieser Auswahl gibt es dazu keine Frage."'}>`
         /* ⭐ Die Nummer steht seit dem 06.09.2026 dabei. Elias: „oben
            nummeriert er die satzübung gemäß der reihenfolge in der liste, die
            liste selbst jedoch gibt keine zahlenreihenfolge wider. ich möchte
            das die liste auch diese zahlenreihenfolge hat damit ich nur die
            zahl sehen muss und dann potentiell in diese übung intensiver üben
            kann wenn ich will."
            Ueber der Aufgabe steht sie laengst („10. Welche Regel?"), nur in
            der Auswahl fehlte sie — dieselbe Zahl an zwei Orten, einer davon
            stumm. [[widerspruch_liegt_in_der_beschriftung]] */
         /* ⚠️ Die Nummer steht INNERHALB von .ar, nicht daneben: .links ist
            eine Spalte (flex-direction:column), ein Geschwisterknoten stuende
            also unter dem Namen statt davor. */
         /* ⚠️ arabischHervor() maskiert selbst — escapeHtml() daneben würde
            die eingesetzten <span> gleich wieder unkenntlich machen. Der Name
            traegt bei zehn der dreizehn Uebungen Arabisch („مُبْتَدَأ / خَبَر"),
            und das stand hier bei Faktor 1,00. */
         + `<span class="links"><span class="ar"><span class="unr">${m.nr}.</span>`
         + `${arabischHervor(m.name)}</span></span>`
         + `<span class="n">${n}</span></button>`;
  };
  /* ⚠️ Erst die bekannten Gruppen, danach alles, was in keine passt. Ohne den
     Rest-Zweig wuerde ein neuer Modus mit unbekannter `art` lautlos
     verschwinden — und das ist die Sorte Fehler, die niemand meldet. */
  const vergeben = new Set();
  let html = UEB_GRUPPEN.map(([titel, art])=>{
    const teil = UEBUNGEN.filter(m=>m.art===art);
    teil.forEach(m=>vergeben.add(m.id));
    if (!teil.length) return '';
    return `<div class="gruppe">${escapeHtml(titel)}</div>` + teil.map(zeile).join('');
  }).join('');
  const rest = UEBUNGEN.filter(m=>!vergeben.has(m.id));
  if (rest.length) html += '<div class="gruppe">Weitere</div>' + rest.map(zeile).join('');

  /* Gemischt steht GANZ OBEN und in einer eigenen Gruppe — es ist keine der
     drei Antwortarten, sondern der Verzicht auf die Wahl. Elias' Anlass:
     „wenn man nicht weiß welchen man jetzt unbedingt üben sollte." Wer das
     sucht, sucht es vor der Liste, nicht dahinter. */
  /* v606: Gemischt zeigt den heutigen Teil (satzTeile()) — seit v618 den,
     der gerade dran ist (nach „geschafft" der andere, satzTeilStand()). */
  const teilHeute = satzTeilStand().jetzt, imTeil = new Set(satzTeile()[teilHeute]);
  const gesamt = UEBUNGEN.filter(m => imTeil.has(m.id)).reduce((s,m)=>s + uebungAnzahl(alle[m.id]), 0);
  html = '<div class="gruppe">Ohne Auswahl</div>'
       + `<button class="zeile${UEB.modus===UEB_GEMISCHT?' aktiv':''}${gesamt?'':' leer'}" type="button"`
       + ` data-uebmodus="${UEB_GEMISCHT}"${gesamt?'':' title="In dieser Auswahl gibt es keine Frage."'}>`
       + '<span class="links"><span class="ar">Gemischt — Teil ' + teilHeute + ' (' + imTeil.size + ' Modi reihum)</span></span>'
       + `<span class="n">${gesamt}</span></button>`
       + html;
  blatt.innerHTML = html;

  const jetzt = UEBUNGEN.find(m=>m.id===UEB.modus);
  const wert = document.getElementById('uebWert');
  const zahl = document.getElementById('uebZahl');
  if (wert) wert.textContent = jetzt ? jetzt.name
                             : (UEB.modus===UEB_GEMISCHT ? 'Gemischt' : 'Modus wählen');
  if (zahl) zahl.textContent = jetzt ? `${uebungAnzahl(alle[jetzt.id])} Fragen`
                             : (UEB.modus===UEB_GEMISCHT ? `${gesamt} Fragen`
                                                         : `${UEBUNGEN.length} Modi`);

}

/* ---------- Gemischt läuft beim Öffnen von selbst (07.09.2026) ----------

   Elias, nachdem der erste Versuch ein Knopf war: „ich will nicht diesen
   gemischt starten button haben sondern einfach das ich schon direkt drinnen
   bin in dem modus und direkt anfangen kann mit dem lesen der frage."

   ⛔ Nur, wenn gerade NICHTS läuft. Wer den Satzmodus mit einer laufenden
   Übung verlässt und zurückkommt, bekäme sonst statt seiner Übung den
   gemischten Modus — und der Zwischenstand („4 von 7 richtig") wäre weg, ohne
   dass etwas meldet. [[zweiter_aufruf_ueberschreibt_still]]

   ⚠️ `uebungStarten()` gibt bei leerer Auswahl selbst auf und meldet es per
   Hinweis. Das darf hier NICHT passieren — Elias hat nichts getan, es ist der
   Start. Deshalb wird vorher gezählt und bei null stillschweigend gelesen.
   [[keine_meldung_ohne_seine_handlung]] */
function starteGemischtFallsFrei(){
  if (UEB.modus) return;
  const alle = uebungenAufbauen();
  const gesamt = UEBUNGEN.reduce((s, m) => s + (alle[m.id] || []).length, 0);
  if (!gesamt) return;
  uebungStarten(UEB_GEMISCHT);
}

/* ⭐ JEDE ANTWORT UNGEFÄHR GLEICH OFT (25.09.2026). Elias mit Bild von Übung 11
   (Lösung هَذَا): „hier sind denke ich viele sätze auf hadha ausgelegt aber es
   sollen bewusst ungefähr gleichviele von jeder antwort geben damit jede
   antwort gleich oft ungefähr drankommt". Gemessen in seiner Auswahl: von 152
   Aufgaben hatten 98 die Lösung هَذَا und 34 هَذِهِ — in den ersten 15 kamen im
   Mittel fast zehnmal هَذَا, die übrigen sieben Formen zusammen kaum zweimal.
   Deshalb REIHUM nach Lösung statt einfach gemischt: je Lösung ein Korb,
   gezogen wird abwechselnd aus jedem — dieselbe Idee wie
   uebungGemischteListe() für die Modi. Die ersten Aufgaben enthalten so jede
   Antwort einmal, bevor eine zum zweiten Mal kommt. Kleine Körbe laufen
   früher aus; dann wird der Rest reihum weitergezogen.

   ⭐ FÜR ALLE AUSWAHL-ÜBUNGEN (art 'wahl', 6–14), nicht nur 11, 13, 14. Elias:
   „das sollte auch bei den anderen aufgaben so sein mit reihum die anderen bei
   denen es sinn macht und ich glaube das sollten alle sein bin mir aber nciht
   sicher" — und zu Übung 7: „hier möchte ich auch, dass alle
   antwortmöglichkeiten ungefähr gleich oft dran kommen". Nicht bei „Antippen"
   (1–5: dort gibt es keine einzelne Antwort) und nicht bei „Übersetzen" (15).
   Gemessen am 25.09. in seiner Auswahl: Übung 7 hatte 288 von 605 Aufgaben mit
   Ḍammatān, Übung 8 597 von 717 mit „Nomen", Übung 10 389 von 540 „männlich".

   ⭐ ZWEITE STUFE: DER GRUND. Trägt eine Aufgabe `grund` (Übung 6 und 7: die
   Rolle des Wortes), wird INNERHALB einer Antwort noch einmal reihum nach dem
   Grund gezogen. Elias zu Übung 7: „auch sollen die sätze so konzipiert sein
   das es zb im genitiv steht und deswegen ein kasra zb bekommt … generell auch
   beispielsweise könnte das ein adjektiv sein und deswegen die selbe endung
   bekommen wie das wort davor und ich muss das ganze halt herausfinden … in den
   meisten fällen ist es halt im nominativ und meist mit dumma tanween aber ich
   mcöhte mein kopf etwas bemühen". Kasra kommt dann abwechselnd nach einer
   Präposition, als مُضَاف إِلَيْه und als نَعْت — nicht immer aus demselben Grund. */
function uebungReihum(liste, schluessel, zweiter){
  const koerbe = new Map();
  for (const a of liste){
    const k = schluessel(a);
    if (!koerbe.has(k)) koerbe.set(k, []);
    koerbe.get(k).push(a);
  }
  let runde = shuffle([...koerbe.values()])
    .map(k => (zweiter && k.some(a => zweiter(a) != null)) ? uebungReihum(k, zweiter, null) : shuffle(k));
  const raus = [];
  while (runde.length){
    /* Die Naht: die erste Antwort einer Runde soll nicht die letzte der
       vorigen sein — sonst käme dieselbe zweimal hintereinander. */
    const zuletzt = raus.length ? schluessel(raus[raus.length - 1]) : null;
    if (zuletzt !== null && runde.length > 1 && schluessel(runde[0][0]) === zuletzt) runde.push(runde.shift());
    for (const k of runde) raus.push(k.shift());
    runde = shuffle(runde.filter(k => k.length));
  }
  return raus;
}
/* Wonach reihum gezogen wird — oder null, wenn es nichts gibt.
   ⭐ Übung 1, 3, 4 und 5 tragen `reihum` (25.09.2026, Elias: „lasse auch bei
   den genitiv präpositionen immer durchrutieren sodass ich jede mal sehe und
   auch die gründe warum es im gentiv ist" — und für alle, „bei denen es
   geht"): bei 4/5 die Präpositionen bzw. ظُرُوف des Satzes, bei 1/3 die Art
   der Frage. Eine Aufgabe mit mehreren kommt in den Korb ihres SELTENSTEN —
   so hat jede Präposition, die überhaupt vorkommt, einen eigenen Korb.
   Sonst: die Lösung — entschieden an den AUFGABEN, nicht an m.art
   (test-eindeutige-ziele.mjs); „Antippen" ohne `reihum` und „Übersetzen"
   haben keine einzelne Lösung. */
function uebungSchluessel(liste){
  if (liste.some(a => a && Array.isArray(a.reihum))){
    const n = new Map();
    for (const a of liste) for (const k of (a.reihum || [])) n.set(k, (n.get(k) || 0) + 1);
    return a => {
      const ks = (a.reihum || []).slice().sort((x, y) => (n.get(x) - n.get(y)) || (x < y ? -1 : x > y ? 1 : 0));
      return ks.length ? ks[0] : '—';
    };
  }
  if (liste.some(a => a && a.loesung != null)) return a => String(a.loesung);
  return null;
}
/* ⭐⭐ JE ANTWORT UNGEFÄHR GLEICH VIELE SÄTZE (25.09.2026). Elias, mit Bild von
   Übung 6: „es ist auch wichtig das bei all diesen aufgaben bei denen es geht
   das sie pro antwort ungefähr alle gleich viele sätze haben. also in diesem
   fall wenn es ingesamt 30 sätze zu dieser übung gibt dann sollte jede antwort
   10 sätze haben bei der jene antwort richtig ist. das soll verhindern das zb
   nominativ 100 sätze hat bei der es als richtige antwort geht aber die
   anderen beiden haben nur jeweilis 10 sätze und so wird natürlich nominativ
   öfter dran kommen."
   Reihum allein reichte dafür nicht: sind die kleinen Körbe leer, bleibt am
   Ende nur der große übrig (gemessen: Übung 6 Nominativ 557, Genitiv 240).
   Also bekommt jede Antwort höchstens so viele Aufgaben wie die seltenste —
   aber mindestens UEB_JE_ANTWORT_MIN, sonst schrumpfte eine Übung mit einer
   sehr seltenen Antwort (Übung 7: nur 4 Sätze mit Kasratayn) auf eine
   Handvoll. Ich hatte 10 vorgeschlagen; Elias darauf: „mach mindestens 15". Welche
   Aufgaben einer großen Antwort drankommen, wird je Runde neu gewürfelt — so
   kommt über mehrere Runden jeder Satz dran. Die seltenen Antworten brauchen
   mehr Sätze aus seinen Büchern; das zeigt pruefe-satzmodus-aktuell. */
const UEB_JE_ANTWORT_MIN = 15;
function uebungDeckelJeAntwort(liste, schluessel){
  const n = new Map();
  for (const a of liste){ const k = schluessel(a); n.set(k, (n.get(k) || 0) + 1); }
  return n.size ? Math.max(Math.min(...n.values()), UEB_JE_ANTWORT_MIN) : 0;
}
function uebungGleichViele(liste, schluessel){
  const deckel = uebungDeckelJeAntwort(liste, schluessel), zaehl = new Map();
  return shuffle(liste.slice()).filter(a => {
    const k = schluessel(a), z = zaehl.get(k) || 0;
    if (z >= deckel) return false;
    zaehl.set(k, z + 1);
    return true;
  });
}
/* So viele Aufgaben kommen in einer Runde wirklich dran — für den Wähler, damit
   dort dieselbe Zahl steht wie später in der Aufgabe („1 / N"). */
function uebungAnzahl(liste){
  liste = liste || [];
  const s = uebungSchluessel(liste);
  if (!s) return liste.length;
  const deckel = uebungDeckelJeAntwort(liste, s), n = new Map();
  for (const a of liste){ const k = s(a); n.set(k, (n.get(k) || 0) + 1); }
  let summe = 0;
  for (const v of n.values()) summe += Math.min(v, deckel);
  return summe;
}
function uebungMischen(m, liste){
  const s = uebungSchluessel(liste);
  if (!s) return shuffle(liste.slice());
  const zweiter = liste.some(a => a && Array.isArray(a.reihum))
    ? (a => (a.grundArt == null ? null : String(a.grundArt)))
    : (a => (a.grund == null ? null : String(a.grund)));
  return uebungReihum(uebungGleichViele(liste, s), s, zweiter);
}

function uebungStarten(modusId){
  const alle = uebungenAufbauen();
  /* Gemischt ordnet reihum an und ist deshalb schon fertig gemischt —
     ein zweites shuffle() unten wuerde genau die Abwechslung zerstoeren,
     fuer die Elias den Modus haben wollte. */
  const gemischt = modusId === UEB_GEMISCHT;
  /* v606: „Gemischt" = die Übungen des heutigen Teils reihum (satzTeilAuswahl). */
  const liste = gemischt ? uebungGemischteListe(satzTeilAuswahl(alle)) : (alle[modusId] || []);
  if (!liste.length){
    const m = UEBUNGEN.find(x=>x.id===modusId);
    toast(`${gemischt ? 'Gemischt' : (m ? m.name : 'Dieser Modus')}: in dieser Auswahl keine Frage. Anderes Thema wählen.`);
    return;
  }
  if (LUECKE.aktiv) beendeLuecke();
  UEB = { modus:modusId, liste: gemischt ? liste : uebungMischen(UEBUNGEN.find(x=>x.id===modusId), liste), idx:0, gewaehlt:new Set(),
          beantwortet:false, richtig:0, gestellt:0,
          /* v618: für welchen Teil „Gemischt" gebaut ist (uebungWeiter() baut um). */
          teil: gemischt ? satzTeilStand().jetzt : null };
  document.getElementById('gramPopover').classList.remove('show');
  uebungAnsicht(true);
  renderUebungsLeiste();
  /* ⛔ Auch den Lesemodus-Knopf: er zeigt jetzt „Modus wählen", weil geuebt
     wird. Ohne diese Zeile bliebe er auf dem Thema stehen und beide Waehler
     saehen gleich aktiv aus. */
  if (typeof renderThemenLeiste === "function") renderThemenLeiste();
  renderUebung();
}

function uebungBeenden(){
  const stand = UEB.gestellt ? `${UEB.richtig} von ${UEB.gestellt} richtig` : null;
  UEB.modus = null;
  uebungAnsicht(false);
  renderUebungsLeiste();
  if (typeof renderThemenLeiste === "function") renderThemenLeiste();
  renderSentence();
  if (stand) toast(stand);
}

/* Waehrend einer Uebung tritt der Blaetter-Modus zurueck: der Satz wird von der
   Aufgabe gestellt, nicht von Elias ausgewaehlt. Der Themenfilter bleibt
   sichtbar, damit er den Vorrat wechseln kann. */
function uebungAnsicht(an){
  document.getElementById('sentenceCard').classList.toggle('hidden', an);
  document.getElementById('uebBox').classList.toggle('hidden', !an);
  const nav = document.querySelector('.sent-nav');
  if (nav) nav.classList.toggle('hidden', an);
}

function uebungAktuell(){ return UEB.liste[UEB.idx] || null; }

/* ⭐ Der Modus einer Aufgabe steht AN DER AUFGABE, nicht am Zustand.
   uebungenAufbauen() haengt jeder Aufgabe `modus:m` an. Solange nur ein Modus
   auf einmal lief, war das dasselbe wie UEBUNGEN.find(x=>x.id===UEB.modus) —
   im gemischten Modus ist es das nicht mehr, und dann ist die Aufgabe die
   Wahrheit. Der Rueckfall haelt die Stellen am Leben, die vor der ersten
   Aufgabe fragen. */
function uebungModusVon(a){
  return (a && a.modus) ? a.modus : UEBUNGEN.find(x=>x.id===UEB.modus);
}

/* ---------- Der gemischte Modus (05.09.2026) ---------------------------------
   Elias: „Beim satzmodus sollte es auch einen ‚gemischt' oder ‚Alle' Modus
   geben wo jedes drankommt und immer unterschiedliche. Damit man einfach alle
   üben kann wenn man nicht weiß welchen man jetzt unbedingt üben sollte."

   ⛔ Zwei Anforderungen, nicht eine. „wo jedes drankommt" heisst: kein Modus
   darf hinten liegenbleiben. „und immer unterschiedliche" heisst: nicht
   fuenfmal dieselbe Sorte hintereinander. Blosses shuffle() ueber alles
   erfuellt nur die erste — bei 1152 Aufgaben aus Modus 8 und 23 aus Modus 9
   waeren die ersten zwanzig Fragen mit hoher Wahrscheinlichkeit alle aus
   demselben Topf.

   Deshalb REIHUM statt gemischt: jede Modusliste wird fuer sich gemischt, dann
   wird abwechselnd eine Aufgabe je Modus gezogen. Leere Modi fallen weg, kurze
   laufen frueher aus — die Reihenfolge bleibt bis zuletzt durchmischt.

   ⚠️ Es ist KEIN Eintrag in UEBUNGEN. Ein Eintrag braucht ein eigenes baue(),
   und der gemischte Modus baut nichts eigenes — er ordnet nur an, was die
   dreizehn schon gebaut haben. Er stuende sonst in renderUebungsLeiste()
   zwischen den echten Modi und wuerde in uebungenAufbauen() eine leere Liste
   erzeugen. */
const UEB_GEMISCHT = 'gemischt';

function uebungGemischteListe(nachModus){
  /* ⛔ Auch der ERSTE Durchgang wird gemischt. Ohne das aeussere shuffle()
     begannen alle drei Probelaeufe im Browser mit exakt „1,2,3,…,13" — die
     Umsortierung griff erst ab Runde zwei, und die ersten dreizehn Fragen
     sahen bei jedem Start gleich aus. Genau die sieht Elias zuerst. */
  let koerbe = shuffle(UEBUNGEN.map(m => uebungMischen(m, nachModus[m.id] || []))
                               .filter(k => k.length));
  const raus = [];
  let i = 0;
  while (koerbe.length){
    /* ⭐ Nach jedem vollen Durchgang wird die Reihenfolge der Modi NEU
       gemischt. Ohne das laeuft die Liste stur 1,2,3,…,13,1,2,3,… — im
       Browser gemessen, die ersten 26 Aufgaben waren genau das. Reihum
       allein erfuellt „wo jedes drankommt", aber nicht „und immer
       unterschiedliche": ab der zweiten Runde weiss man, was kommt. */
    if (i >= koerbe.length){
      i = 0;
      const zuletzt = raus.length ? raus[raus.length-1].modus : null;
      koerbe = shuffle(koerbe);
      /* Der erste des neuen Durchgangs darf nicht der letzte des alten sein —
         sonst erzeugt genau die Naht die Wiederholung, die das Mischen
         vermeiden soll. */
      if (zuletzt && koerbe.length > 1 && koerbe[0][koerbe[0].length-1].modus === zuletzt)
        koerbe.push(koerbe.shift());
    }
    raus.push(koerbe[i].pop());
    if (!koerbe[i].length) koerbe.splice(i, 1); else i++;
  }
  return raus;
}

/* Der Satz mit antippbaren Woertern. Ein Wort kann verdeckt sein (dann ist es
   selbst die Antwort) oder ohne seine Endung stehen (Modus 7). */
function uebungSatzHtml(a){
  return a.zeilen.map((t,i)=>{
    const gewaehlt = UEB.gewaehlt.has(i);
    /* wortIdxBis: der Modus „Welche Regel?" kann seit dem 19.08.2026 eine
       WORTFOLGE hervorheben (فِي الْحَقِيبَةِ). Alles zwischen wortIdx und
       wortIdxBis gehoert zur Stelle — auch fuer die Gruen-Faerbung nach der
       Antwort. verdeckt/ohneEndung unten bleiben bewusst am einzelnen
       wortIdx: die Modi, die sie nutzen, setzen nie einen Bereich. */
    const imBereich = (a.wortIdxBis != null)
      ? (i >= a.wortIdx && i <= a.wortIdxBis) : (a.wortIdx === i);
    const ziel = a.ziele ? a.ziele.includes(i) : imBereich;
    let klassen = 'ueb-wort';
    if (imBereich) klassen += ' hervor';
    if (gewaehlt) klassen += ' gewaehlt';
    if (UEB.beantwortet && ziel) klassen += ' richtig';
    if (UEB.beantwortet && gewaehlt && !ziel) klassen += ' falsch';
    let text = t.wort;
    if (a.verdeckt && a.wortIdx === i && !UEB.beantwortet) text = '____';
    else if (a.ohneEndung && a.wortIdx === i && !UEB.beantwortet) text = uebungOhneEndung(t.wort);
    /* Übung 15: das Wort ohne seine Endung (قَلَمـ) — und ein gleiches Wort
       daneben ebenso, sonst verriete es die Lösung. Der Text kommt fertig aus
       baue(): dort ist nur weggenommen, nichts gesetzt. */
    else if (a.ohneSuffix && a.ohneSuffix[i] != null && !UEB.beantwortet) text = a.ohneSuffix[i];
    return `<span class="${klassen}" data-uebidx="${i}">${escapeHtml(text)}</span>`;
  }).join(' ');
}

/* „مَرْفُوع · Nominativ" wird zu zwei Zeilen — Arabisch oben, Deutsch
   darunter, ohne Trennpunkt. Warum, steht bei .opt-ar in index.html.

   ⚠️ Nicht jede Option ist ein Paar: „هَذَا" steht allein, „bestimmt (اَلْ)"
   traegt das Arabische MITTEN im deutschen Wort. Beide bleiben einzeilig und
   laufen weiter ueber arabischHervor() — sonst zerrisse die Klammer.

   Getrennt wird an „ · " oder an zwei Leerzeichen (الحركة-Optionen heissen
   „ـُ  Ḍamma"), und nur, wenn der linke Teil arabisch ist und der rechte
   nicht. */
const AR_ZEICHEN = /[؀-ۿݐ-ݿ]/;
function uebungOptionHtml(text){
  const t = String(text == null ? '' : text);
  const m = /^(.+?)(?:\s+·\s+|\s{2,})(.+)$/.exec(t);
  if (m && AR_ZEICHEN.test(m[1]) && !AR_ZEICHEN.test(m[2]))
    return `<span class="opt-ar" lang="ar">${escapeHtml(m[1].trim())}</span>`
         + `<span class="opt-de">${escapeHtml(m[2].trim())}</span>`;
  return arabischHervor(t);
}

function renderUebung(){
  /* v606: Startzeit je Aufgabe — einmal je Aufgabe, nicht bei jedem Neuzeichnen. */
  if (typeof UEB === 'object' && UEB && UEB.zeitIdx !== UEB.idx){ UEB.zeitIdx = UEB.idx; UEB.startZeit = Date.now(); }
  const a = uebungAktuell();
  const m = uebungModusVon(a);
  if (!a || !m){ uebungBeenden(); return; }

  /* ⛔ ARABISCH GEHÖRT ÜBERALL HERVORGEHOBEN, NICHT NUR IM ANTWORTKNOPF.

     Elias am 06.09.2026: „die sind so gross wie deutsches und das ist klein,
     kann schlecht lesen. die sollen etwas groesser sein." Er zeigte auf die
     Antwortknoepfe — die waren die EINZIGE Stelle, die überhaupt schon
     hervorgehoben war (Faktor 1,40). Name, Frage und Hinweis standen bei
     Faktor 1,00, also genau so gross wie das Deutsche daneben.

     `textContent` war der Grund: es setzt reinen Text, da kann kein `<span>`
     entstehen. Deshalb hier `innerHTML` mit arabischHervor(), das selbst
     maskiert. [[allgemeine_regel_statt_listeneintrag]] */
  document.getElementById('uebName').innerHTML = arabischHervor(`${m.nr}. ${m.name}`);
  /* ⭐ Die Standzeile fuehrt das Tagesziel mit (07.09.2026). Ohne das waere die
     Feier nach 13 Aufgaben eine Ueberraschung aus dem Nichts: man saehe nur
     „7 / 4750", also eine Zahl, die nie kleiner wird. Dieselbe Ueberlegung wie
     im Hoermodus, wo die Standzeile aus demselben Grund erweitert wurde. */
  const st = (typeof satzTag === 'function') ? satzTag() : null;
  /* ⭐ v618: die Zeile nennt den Teil. Vor „geschafft" das Tagesziel des
     Anfangsteils, danach den Teil, mit dem es von selbst weitergeht.
     ⚠️ Kurz gehalten: bei 375 px rutscht der Ring ab etwa 240 px Text in
     eine eigene Zeile (gemessen 25.09.2026 im eigenen Tab). */
  const ts = (st && typeof satzTeilStand === 'function') ? satzTeilStand() : null;
  const zielText = !ts ? ''
    /* ⚠️ Geschuetzte Leerzeichen (U+00A0) in den Zahlenpaaren: die Zeile
       darf an den Trennpunkten umbrechen, aber nie zwischen einer Zahl und
       ihrem Bezugswort. Sichtbar ist der Unterschied nicht, im Umbruch schon. */
    : !ts.geschafft
      ? ` · Teil ${ts.anfang}: ${ts.gesamt} von ${ts.ziel}`
      : ` · ${ts.fertig >= 2 ? 'beide Teile' : 'Teil ' + ts.anfang} geschafft · Teil ${ts.jetzt}: ${ts.stand} von ${ts.groesse}`;
  document.getElementById('uebStand').textContent =
    `${UEB.idx+1} / ${UEB.liste.length} · ${UEB.richtig} richtig${zielText}`;
  /* ⭐ Ring und Balken (15.09.2026): der Ring zeigt den TAG, der Balken die
     RUNDE. Beides stand vorher nur als Text in der Zeile darüber. */
  if (typeof modusRingZeichnen === 'function')
    modusRingZeichnen('satzRing', st.gesamt, satzTageszielHeute());
  if (typeof modusBalkenZeichnen === 'function')
    modusBalkenZeichnen('uebBalken', UEB.idx + 1, UEB.liste.length);
  document.getElementById('uebFrage').innerHTML = arabischHervor(a.frage);
  document.getElementById('uebSatz').innerHTML = uebungSatzHtml(a);
  /* ⛔⛔ DIE DEUTSCHE ÜBERSETZUNG IST BEI EINER ÜBUNG DIE LÖSUNG (22.09.2026).

     Diese Zeile setzt sie in JEDER Satzübung unter den arabischen Satz. Bei
     zwölf Übungen ist das eine Hilfe — bei der dreizehnten („Übersetzen") stünde
     die Antwort direkt über dem Eingabefeld, und die ganze Übung wäre wertlos.
     Gefunden, bevor eine Zeile davon gebaut war; wäre sie es nicht, hätte Elias
     eine Übung bekommen, die sich selbst verrät.

     ⚠️ Der Text wird trotzdem GESETZT und nur die Klasse geschaltet — dieselbe
     Überlegung wie beim verräterischen Hinweis ein Stück weiter unten:
     renderUebung() läuft nach dem Beantworten noch einmal, und ein Feld, das
     nur die eine Hälfte der Fälle füllt, wäre nach dem Wechsel leer. */
  const deFeld = document.getElementById('uebDe');
  /* ⭐ Wo die deutsche Zeile die Antwort mitträgt (11: nah/fern, 13: das
     Fragewort, 14: das Fürwort — m.deKlar), bleibt DIESES Wort lesbar, der Rest
     verschwimmt. Elias an Übung 11 („Wer ist in diesem Haus?"): „in solch einem
     fall soll natürlich das gesuchte wort also in dem fall ,,diesem" nicht
     verschwommen sein aber der rest kann schon". */
  /* ⭐ Und grundsätzlich überall, wo ein Wort verdeckt ist und er es anhand der
     Übersetzung einsetzen muss (Elias: „das gilt aber auch grundsätzlich für
     die anderen übungen wenn da zb ein bestimmtes wort gesucht wird und ich
     muss es anhand der übersetzung einsetzen"): dann bleibt das deutsche Wort
     lesbar, das die Bedeutung des verdeckten Wortes trägt (uebDeKlarAusWort). */
  const klar = m.deKlar || (a.verdeckt ? uebDeKlarAusWort(a) : null);
  if (klar){
    deFeld.innerHTML = String(a.satz.sentDe || '').split(/(\s+)/).map(t => (!t || /^\s+$/.test(t)) ? escapeHtml(t)
      : `<span class="${klar.test(t) ? 'de-klar' : 'de-wort'}">${escapeHtml(t)}</span>`).join('');
    deFeld.classList.add('de-teilweise');
  } else {
    deFeld.textContent = a.satz.sentDe || '';
    deFeld.classList.remove('de-teilweise');
  }
  deFeld.classList.toggle('hidden', !!(m.deVerbergen && !UEB.beantwortet));
  /* ⭐ Verschwommen, bis er antippt — jede neue Aufgabe wieder (Elias,
     25.09.2026; Wortlaut und Begründung bei SENT_DE_OFFEN in js/saetze.js). */
  if (UEB_DE_OFFEN !== a) UEB_DE_OFFEN = null;
  /* Das Wortfenster von „Übersetzen" (Übung 16) gehört zu genau einer Aufgabe — und nach dem
     Prüfen ist es überflüssig (die Rückmeldung steht da). */
  if (typeof uebWortFensterZu === 'function' && UEB_WORT_FENSTER && (UEB_WORT_FENSTER.a !== a || UEB.beantwortet)) uebWortFensterZu();
  if (typeof deVerschwommenSetzen === 'function') deVerschwommenSetzen(deFeld, UEB_DE_OFFEN === a);
  document.getElementById('uebHerkunft').textContent = herkunft(a.satz);

  /* Das Eingabefeld der Übersetzungsübung. Es steht nur dort, wo geschrieben
     wird, und wird nach dem Beantworten gesperrt statt versteckt: er soll
     sehen, was er geschrieben hat, während die Rückmeldung daneben steht. */
  const eingabe = document.getElementById('uebEingabe');
  if (eingabe){
    const schreibt = uebungArtVon(a) === 'schreiben';
    eingabe.classList.toggle('hidden', !schreibt);
    eingabe.disabled = !!UEB.beantwortet;
    if (schreibt && !UEB.beantwortet && UEB.eingabeLeeren){
      eingabe.value = '';
      UEB.eingabeLeeren = false;
    }
  }

  /* ⭐⭐ Verräterische Hinweise erst NACH dem Versuch (22.09.2026).
     Elias: „nur die verräterischen erst nach dem Versuch zeigen."

     Drei Fälle, und alle drei laufen durch dieselbe Zeile:
     · `aufgabe` (nur Übung 7) — die Fragestellung, immer sichtbar.
     · `hinweis` mit `hinweisVerraet:false` — ordnet ein, immer sichtbar.
     · `hinweis` mit `hinweisVerraet:true` — nennt die Lösung, erscheint erst
       zusammen mit richtig/falsch.

     ⚠️ Der Text wird auch im verborgenen Zustand GESETZT, nicht erst später
     eingefügt: `renderUebung()` läuft nach dem Beantworten noch einmal, und
     ein Feld, das nur die eine Hälfte der Fälle füllt, wäre nach dem Wechsel
     zur nächsten Aufgabe leer. Verborgen wird allein über die Klasse.
     ⛔ `hidden` versteckt, `visibility` nicht — sonst bliebe der Platz leer
     stehen und verriete, dass da noch etwas kommt. */
  const hinweis = document.getElementById('uebHinweis');
  const hinweisText = m.aufgabe || m.hinweis || '';
  const nochVerbergen = !!(m.hinweis && m.hinweisVerraet && !UEB.beantwortet);
  hinweis.innerHTML = arabischHervor(hinweisText);
  hinweis.classList.toggle('hidden', !hinweisText || nochVerbergen);

  const wahl = document.getElementById('uebWahl');
  if (a.optionen){
    wahl.innerHTML = a.optionen.map(o=>{
      let k = 'ueb-option';
      if (UEB.beantwortet && o.wert === a.loesung) k += ' richtig';
      if (UEB.beantwortet && UEB.gewaehlt.has(o.wert) && o.wert !== a.loesung) k += ' falsch';
      return `<button class="${k}" data-uebwahl="${escapeHtml(String(o.wert))}" lang="ar">${uebungOptionHtml(o.text)}</button>`;
    }).join('');
    wahl.classList.remove('hidden');
    /* Übung 14: von rechts oben nach links (m.optionenRtl). */
    if (m.optionenRtl) wahl.setAttribute('dir', 'rtl'); else wahl.removeAttribute('dir');
  } else wahl.classList.add('hidden');
  /* Traegt das CSS, das die arabischen Woerter erst nach dem Beantworten
     antippbar aussehen laesst — dieselbe Grenze wie im Klick-Handler. */
  wahl.classList.toggle('beantwortet', !!UEB.beantwortet);

  /* "Prüfen" gibt es nur bei Mehrfachauswahl - sonst zaehlt der erste Tipp,
     und ein zweiter Knopf waere ein Umweg. */
  /* Seit dem 22.09.2026 auch bei „Übersetzen": dort ist „Prüfen" der einzige
     Weg zur Antwort — ein Textfeld hat keinen Klick, der von selbst auswertet. */
  const brauchtPruefen = ['mehrfach', 'schreiben'].includes(uebungArtVon(a));
  document.getElementById('btnUebPruefen').classList.toggle('hidden',
    !brauchtPruefen || UEB.beantwortet);
  const weiterKnopf = document.getElementById('btnUebWeiter');
  weiterKnopf.classList.toggle('hidden', !UEB.beantwortet);
  /* ⭐ Q8: der Zaehler laeuft im Knopf mit. `q8Sperre` ist gegen
     Mehrfachaufruf gesichert — renderUebung() laeuft oefter als einmal je
     Aufgabe. */
  if (typeof q8Sperre === 'function')
    q8Sperre(weiterKnopf, UEB.beantwortet ? (UEB.sperreBis || 0) : 0, 'Weiter');

  const rueck = document.getElementById('uebRueckmeldung');
  rueck.className = 'ueb-rueck' + (UEB.beantwortet ? (UEB.zuletztRichtig ? ' gut' : ' schlecht') : ' hidden');
  if (UEB.beantwortet){
    const teile = [UEB.zuletztRichtig ? 'Richtig.' : 'Nicht ganz.'];
    if (a.aufloesung) teile.push(a.aufloesung);
    /* ⭐ innerHTML statt textContent, damit die arabischen Woerter in der
       Aufloesung dieselbe Behandlung bekommen wie in den Antwortknoepfen:
       groesser und antippbar. arabischHervor() maskiert selbst. */
    const warum = uebungWarum(a);
    rueck.innerHTML = arabischHervor(teile.join(' '))
      + (warum ? `<button class="ueb-warum" type="button" data-regelkarte="${escapeHtml(warum.id)}">Warum? → ${arabischHervor(warum.name)}</button>` : '');
  }
}

/* ---------- Arabische Wörter größer und antippbar ----------

   Elias am 06.09.2026, an einer Aufgabe „Welche Regel?": „auch sind die
   arabischen antowrtmöglichkeiten die man da sieht recht klein und ich kann
   die nur schwer lesen, die sollen etwas größer gemacht werden und ich will
   auch, dass wenn ich auf die arabischen wörter bei der lösung oder erklärung
   klicke, dass mir dann eine übersetzung angezeigt wird weil manchmal weiß ich
   nicht wovon gesprochen wird."

   ⭐ Beides hängt an derselben Voraussetzung: die arabischen Stücke müssen
   EINZELN ansprechbar sein. Vorher war der ganze Knopf ein Textknoten mit
   `lang="ar"` — CSS kann darin arabische von deutschen Zeichen nicht
   unterscheiden, und ein Klickziel gab es auch nicht.

   ⛔ ZERLEGT WIRD MIT arabischHervorheben() AUS js/kern.js — nicht mit einer
   eigenen Fassung. Der erste Anlauf hatte genau das getan und dabei den Namen
   `AR_LAUF` ein zweites Mal vergeben; die App warf „Identifier 'AR_LAUF' has
   already been declared" und diese Datei lud überhaupt nicht mehr. `node
   --check` sah es nicht (es prüft je Datei), die Browser-Konsole schon.
   Die Funktion dort nimmt seitdem einen Klassennamen entgegen.
   [[entscheidung_gilt_fuer_das_zweite_werkzeug]] · [[ein_weg_geht_der_andere_nicht]] */
function arabischHervor(text){
  return (typeof arabischHervorheben === 'function')
    ? arabischHervorheben(text, 'ar-wort')
    : escapeHtml(String(text || ''));
}

/* ---------- „Warum? → Regel" (Goal, Punkt 8, 11.09.2026) ----------

   Elias am 11.09.2026: „vielleicht könnte dann auch im satzmodus sobald das
   steht dort irgendwie drauf hingewiesen werden als eine art begründung warum
   etwas richtig oder falsch ist."

   Nach „Richtig." / „Nicht ganz." steht ein Knopf, der die passende Karte der
   Regelsammlung ÜBER der Aufgabe öffnet — die Aufgabe bleibt, wie sie ist.

   ⭐ Zuordnung für alle zwölf Modi, und zuerst die Folge-19-Karte, wo es
   eine gibt: „primär will ich eigentlich die regeln von folge 19".
     1  mubtada-khabar  mubtada-khabar-01 (keine Folge-19-Karte zum Nominalsatz)
     2  nat             f19-nat
     3  idafa           f19-idafa
     4  jarr-paar       f19-jarr
     5  alle-majrur     f19-irab — der Genitiv hat mehrere Gründe, die Karte der Fälle nennt sie
     6  kasus           nach der ROLLE des Wortes (siehe warumNachRolle), sonst f19-irab
     7  haraka          ebenso
     8  wortart         wortarten-01
     9  regel           die gefragte Regel selbst (regelId)
     10 genus           f19-tanith
     11 isara           f19-isara
     12 fem-form        f19-tanith (das Adjektiv passt sich an — Merkmal auf der Karte)
   Keiner der zwölf bleibt ohne Karte. („Bestimmt?" mit al-tanwin-tilgung-01
   ist seit 16.09.2026 entfernt, siehe die Übungsliste.) */
const UEBUNG_WARUM = {
  'mubtada-khabar': 'mubtada-khabar-01', 'nat': 'f19-nat', 'idafa': 'f19-idafa',
  'jarr-paar': 'f19-jarr', 'alle-majrur': 'f19-irab', 'kasus': 'f19-irab', 'haraka': 'f19-irab',
  'wortart': 'wortarten-01', 'regel': null,
  'genus': 'f19-tanith', 'isara': 'f19-isara', 'fem-form': 'f19-tanith',
  'fragewort': 'f19-fragen', 'pronomen': 'f19-pronomen',
  /* Übung 15: die Karte der Endungen; eine Aufgabe mit ـِي bringt ihre eigene
     mit (a.warum = possessiv-ya-01, die Regel ihrer Karte). */
  'endungen': 'possessiv-endungen-01',
  /* ⛔ `null` IST HIER DIE RICHTIGE ANTWORT, kein vergessener Eintrag.
     Die Übersetzungsübung hat keine feste Regel: welche gilt, sagt erst der
     BEFUND der Prüfung — sie hängt ihn als `a.warum` an die Aufgabe, und
     uebungWarum() liest ihn von dort. Eine Vorgaberegel würde bei jedem
     anderen Fehler die falsche Karte öffnen, und das wäre schlimmer als gar
     keine. Erkennt die Prüfung nichts, bleibt der Knopf weg — so wie bei
     „Welche Regel?" (die zweite Übung mit null) auch.
     ⚠️ Der Eintrag steht trotzdem da: pruefe-regelsammlung.mjs verlangt, dass
     JEDE Übung genannt ist. Genau deshalb fiel er beim Bauen auf.
     [[vorgabewert_sieht_aus_wie_befund]] */
  'uebersetzen': null
};

/* ⭐⭐ UNSICHTBARE ENDUNG → DIE KARTE, DIE GENAU DAS ERKLÄRT (16.09.2026)

   Elias mit einem Bildschirmfoto von „Alle مَجْرُور", richtig beantwortet mit
   الْمُسْتَشْفَى: „und das wort steht gar nicht im genitiv weil es kein kasra
   hat. oder ist das irgendeine ausnahme oder so?"

   Es IST die Ausnahme, und sein Lehrer erklärt sie in Folge 12 mit genau
   diesem Wort (alif-maqsura-unveraenderlich-01). „Warum?" zeigte aber die
   allgemeine Karte der Fälle — also genau die Kasra, die er vermisst hat.

   Deshalb: Ist an einem Zielwort der Fall gefragt und seine Endung nach
   endungUnsichtbar() (js/irab.js) nicht zu sehen, weil es auf ى oder ا endet,
   öffnet „Warum?" diese Karte. Dieselbe Bedingung wie im I'rab-Erklärer
   (js/saetze.js): erwartet UND nichts gelesen. Ohne `!gelesen` hielte die
   Prüfung كِتَابًا für ein Wort „auf Alif".

   ⚠️ Nur wo es um den FALL geht: bei „Welcher Fall?" jedes Wort, sonst nur
   Wörter im Genitiv. إِلَى und عَلَى enden auch auf ى, sind aber Partikeln
   ohne erwarteten Fall und fallen so von selbst heraus. */
const UEBUNG_WARUM_UNSICHTBAR = 'alif-maqsura-unveraenderlich-01';
function uebungUnsichtbarerFall(a){
  if (!a || !a.modus || !a.zeilen || typeof endungUnsichtbar !== 'function') return false;
  const id = a.modus.id;
  if (!['kasus', 'alle-majrur', 'jarr-paar', 'idafa'].includes(id)) return false;
  const stellen = Array.isArray(a.ziele) ? a.ziele : (a.wortIdx != null ? [a.wortIdx] : []);
  return stellen.some(i => {
    const t = a.zeilen[i];
    if (!t || !t.erwartet || t.gelesen) return false;
    if (id !== 'kasus' && t.erwartet !== 'jarr') return false;
    const grund = String(endungUnsichtbar(t.wort) || '');
    return grund.startsWith('اِسْم مَقْصُور') || grund.startsWith('endet auf Alif');
  });
}

/* Bei „Welcher Fall?" und „Welche Endung?" entscheidet die Rolle des Wortes,
   WARUM es in diesem Fall steht — die allgemeine Karte der Fälle nur dann,
   wenn keine genauere passt. Die Rollennamen kommen aus js/irab.js. */
function warumNachRolle(rolle){
  const r = String(rolle || '');
  if (r.includes('مُضَاف إِلَيْه') || r.includes('(مُضَاف)')) return 'f19-idafa';
  if (r.includes('نَعْت')) return 'f19-nat';
  if (r.includes('حَرْف جَرّ') || r.includes('جَارّ وَمَجْرُور')) return 'f19-jarr';
  if (r.startsWith('مُبْتَدَأ') || r === 'خَبَر') return 'mubtada-khabar-01';
  if (r.startsWith('ظَرْف')) return 'zarf-01';
  if (r === 'مُنَادَى') return 'ya-nida-01';
  return null;
}

function uebungWarum(a){
  if (!a || !a.modus || typeof regelArt !== 'function') return null;
  let id = UEBUNG_WARUM[a.modus.id];
  if (a.modus.id === 'regel') id = a.regelId || null;
  /* Eine Aufgabe kann ihre Karte selbst mitbringen (seit 19.09.2026: die
     Iḍāfa-Aufgaben mit einer Orts- oder Zeitangabe). */
  if (a.warum) id = a.warum;
  if ((a.modus.id === 'kasus' || a.modus.id === 'haraka') && a.zeilen && a.zeilen[a.wortIdx]){
    id = warumNachRolle(a.zeilen[a.wortIdx].rolle) || id;
    /* Das Wort nach أَمَامَ steht im Genitiv, weil es zur Ortsangabe gehört,
       nicht wegen einer Genitivpartikel. warumNachRolle() sieht nur
       „nach حَرْف جَرّ / ظَرْف" und zeigte deshalb die Karte der
       Genitivpartikel (19.09.2026, aus dem Code gelesen). */
    if (uebungZarfMitGenitiv(a.zeilen, a.wortIdx - 1) && regelArt('zarf-als-mudaf-01')) id = 'zarf-als-mudaf-01';
  }
  if (uebungUnsichtbarerFall(a) && regelArt(UEBUNG_WARUM_UNSICHTBAR)) id = UEBUNG_WARUM_UNSICHTBAR;
  if (!id || !regelArt(id)) return null;
  const t = (typeof regelText === 'function') ? regelText(id) : null;
  return { id, name: t ? t.name : id };
}

/* Nachschlagen: erst im gepflegten Bestand, dann in den Fachbegriffen.
   ⛔ Verglichen wird über wortKern() aus js/saetze.js — dasselbe Maß, mit dem
   der Satzmodus seine Wörter findet. Zwei verschiedene Normalisierungen für
   dieselbe Frage wären genau die Sorte Fehler, die niemand meldet.
   [[entscheidung_gilt_fuer_das_zweite_werkzeug]] */
function uebersetzungFuer(stueck){
  if (typeof wortKern !== 'function') return null;
  const quelle = [];
  if (typeof bekannteVokabeln === 'function') quelle.push(...bekannteVokabeln());
  else if (typeof VOCAB_DATA !== 'undefined') quelle.push(...VOCAB_DATA);
  if (typeof FACHBEGRIFF_VOKABELN !== 'undefined') quelle.push(...FACHBEGRIFF_VOKABELN);

  const woerter = String(stueck || '').trim().split(/[\s ]+/).filter(Boolean);
  const gefunden = [];
  /* ⭐ Zweite Quelle: seine Regelkarten mit Hinweis-, Frage- und Fürwörtern
     (dieselben Gruppen wie Übung 11, 13 und 14). هَذَا und ذَلِكَ hat er von
     dort, nicht als Karteikarte — gemessen am 25.09.2026 in „Übersetzen":
     „أَذَلِكَ — dazu habe ich keine Vokabel". */
  let karten = [];
  if (typeof uebKartenGlieder === 'function'){
    for (const id of ['f19-isara', 'f19-fragen', 'f19-pronomen']){
      try { karten = karten.concat(uebKartenGlieder(id) || []); }
      catch (e){ /* eine fehlende Karte nimmt nur diese Quelle weg, nicht das Nachschlagen */ }
    }
  }
  /* ⛔ MIT DEN VOKALEN (25.09.2026). Nur über das Gerippe verglichen, hieß
     مَنْ („wer?") „von / aus" — das ist مِنْ. Gemessen beim Bau des Wortfensters
     für „Übersetzen"; eine falsche Übersetzung ist schlimmer als keine. Verglichen
     wird der Kern von hinten (Artikel und وَ stehen vorn), OHNE den letzten
     Buchstaben (dort wechselt die Kasusendung), und nur, wo beide ein Zeichen
     tragen und der Buchstabe derselbe ist. */
  const widerspricht = (wort, form, n) => {
    const a = uebZeichenJeBuchstabe(wort).slice(-n), b = uebZeichenJeBuchstabe(form).slice(-n);
    for (let i = 0; i < Math.min(a.length, b.length) - 1; i++){
      if (a[i].b !== b[i].b) continue;
      const va = a[i].z.replace(/[ّٰ]/g, ''), vb = b[i].z.replace(/[ّٰ]/g, '');
      if (va && vb && va !== vb) return true;
    }
    return false;
  };
  const bedeutung = (k, wort) => {
    const passt = f => !!f && wortKern(f) === k && !widerspricht(wort, f, k.length);
    const v = quelle.find(x => x && x.de && (passt(x.ar) || passt(x.sg) || passt(x.pl) || passt(x.femSg)));
    if (v) return v.de;
    const g = karten.find(x => x && x.de && passt(x.form));
    return g ? g.de : null;
  };
  for (const w of woerter){
    const k = wortKern(w);
    if (k.length < 2) continue;
    const de = bedeutung(k, w);
    if (de){ gefunden.push(`${w} — ${de}`); continue; }
    /* Die Frage-Partikel أَ hängt vorn am Wort (أَذَلِكَ, أَهَذَا). Dann ohne
       sie nachschlagen und es dazusagen. */
    const ohneFrage = String(w).replace(/^أَ?/, '');
    if (ohneFrage !== String(w) && wortKern(ohneFrage).length >= 2){
      const de2 = bedeutung(wortKern(ohneFrage), ohneFrage);
      if (de2) gefunden.push(`${w} — ${de2} (vorn أَ: Frage)`);
    }
  }
  return gefunden.length ? gefunden.join(' · ') : null;
}

/* ⭐⭐ DAS TAGESZIEL IM SATZMODUS (B4, 07.09.2026)
   ================================================================
   Elias' eigener Vorschlag, im Wortlaut: „bei karteikarten braucht man das
   nicht aber bei dem gemischten satzmodus nach 13 aufgaben könnte man das
   einfügen. danach kann man noch weiter üben aber nach diesen 13 aufgaben
   könnte auch so eine animation kommen wie bei karteikarten die dann zeigt
   das man sein tagesziel erreicht hat"

   ⭐ WARUM 16, und warum das keine willkuerliche Zahl ist: der gemischte Modus
   zieht reihum eine Aufgabe je Uebungsart. Nach 16 ist jede der 16 Uebungsarten
   genau einmal drangewesen — eine natuerliche Grenze, keine gesetzte.
   ⭐ SEIT 25.09.2026 SECHZEHN: die Endungen-Übung (15) kam dazu, Übersetzen
   ist jetzt 16 — nach seiner Regel von unten: die Zahl, nach der er „alle
   mache", wächst mit der Zahl der Übungen, und die Einstellung bietet sie an.
   ⭐ SEIT 24.09.2026 FÜNFZEHN (vorher 13): Fragewort (14) und Pronomen (15)
   kamen dazu. Elias: „wenn ich richtig mitgezählt habe dann hätten wir mit
   den zwei neuen vorschlägen von mir insgesamt 15 sätze bei gemischt damit
   ich alle mache. aktuallisere das auch dann in den einstellungen als
   tagesziel als auswahl". test-satz-tagesziel.mjs vergleicht die Vorgabe mit
   der Zahl der Übungen — kommt eine dazu, wird er rot.

   ⚠️ SEIT DEM 16.09.2026 SIND ES ZWÖLF: „Bestimmt?" ist auf Elias' Wunsch
   entfernt. Die Vorgabe bleibt trotzdem 13, denn die Zahl stammt von ihm
   („nach 13 aufgaben"), und ob er sie aus der Zahl der Übungsarten hatte,
   hat er nie gesagt. Wirksam ist ohnehin seine Einstellung: auf seinem
   Bildschirmfoto vom 16.09.2026 steht „Tagesziel 0 von 7".

   ⭐ Der DRITTE Faelle nach demselben Muster: die Karteikarten haben
   'alles-faellig', der Hoermodus hat 'hoer-tagesziel' mit `vt_hoerTag`.
   Ein eigener Zaehler ist richtig, weil die drei Modi verschiedene Vorraete
   haben — ein gemeinsamer wuerde behaupten, 13 Satzaufgaben und 10 gehoerte
   Woerter seien dasselbe.

   ⚠️ NACH DEM ZIEL WIRD NICHT GESPERRT. „danach kann man noch weiter üben" —
   der Zaehler laeuft weiter, gefeiert wird `einmalig` je Tag.
   Dieselbe Entscheidung wie im Hoermodus (js/hoeren.js, Zeile 37).

   ⭐ SEIT DEM 14.09.2026 EINSTELLBAR. Elias an dem Tag: „man [soll] dort keine
   zahl haben, jedoch in den einstellungen einstellen kann wie viel das
   tagesziel ist" — fuer alle vier Modi, in einem eigenen Bereich. Die 13
   bleibt die Vorgabe, weil ihre Begruendung oben unveraendert gilt: sie ist
   die Zahl, nach der jede Uebungsart einmal dran war.

   ⛔ Als FUNKTION, nicht als Konstante — dieselbe Lehre wie im Hoermodus
   (js/hoeren.js, Zeile 60): „Die Zahl NICHT in einer Konstanten
   zwischenspeichern. Sie kann sich aendern, waehrend der Modus offen ist."
   Eine `const` haette den alten Wert bis zum Neuladen festgehalten.
   [[einstellung_wirkt_nicht_weil_zurueckgelesen]]

   ⛔⛔ SEIT v618 (25.09.2026) KEINE EINSTELLUNG MEHR. Die Zahl stellt sich
   selbst ein: ein Satz-Tag ist EIN Teil, jede Übung darin einmal
   (satzTageszielHeute() weiter unten). Elias: „ich stelle mir das so vor das
   die app automatisch meinen ring bzw mein tagesziel einstellt". Entfernt
   sind SATZ_ZIEL_VORGABE und satzTagesziel(); SETTINGS.satzZiel bleibt in
   seinen Einstellungen liegen und wird nicht mehr gelesen. Alles darüber ist
   Geschichte — die 16 sind heute beide Teile zusammen. */

function satzTag(){
  const heute = todayStr(0);
  let t = null;
  try { t = LS.get('vt_satzTag', null); } catch (e) { t = null; }
  if (!t || t.tag !== heute) t = { tag: heute, gesamt: 0, richtig: 0 };
  return t;
}
function satzTagSpeichern(t){ try { LS.set('vt_satzTag', t); } catch (e) { /* privates Fenster */ } }

/* ⭐⭐ v606 — DER SATZMODUS IN ZWEI TEILEN (25.09.2026)
   Elias, wörtlich: „übrigens wir haben mitlerweile vorallem mit den neuen satz
   aufgaben so viele modis das ich finde, dass ich die in zwei teilen sollte.
   also tag 1 satz teil 1, tag 2 hören, tag 3 satz teil 2 und dann wieder
   hören. es muss aber klappen, dass es nicht random ist weil sonst gehen
   einige modis unter und andere sind viel mehr. und dann auch dementsprechend
   das tagesziel darauf auslegen wie viel es ist um genau die hälte zu machen
   … und ich möchte das beide teile ungefähr gleich zeitaufwändig sind
   deswegen guck welche modis man in welches teil packt".
   · Aufteilung (satzTeile()): jede Übung nach ihrer Zeit je Aufgabe —
     GEMESSEN (uebZeitGemessen() in js/kern.js, ab 10 Antworten in 28 Tagen),
     sonst GESCHÄTZT nach ihrer Art (UEB_ZEIT_SCHAETZUNG — ⚠️ Annahme, keine
     Messung: Schreiben dauert länger als Antippen). Verteilt wird die längste
     zuerst, immer in den Teil mit weniger Zeit; so landet auch eine NEUE
     Übung von selbst im kürzeren Teil, und sobald Messungen da sind, gleicht
     sich die Aufteilung selbst aus.
   · Wechsel (satzTeilHeute()): fest, nicht zufällig — ein Satz-Tag nimmt
     immer den ANDEREN Teil als der letzte Tag, an dem er Sätze geübt hat
     (SETTINGS.satzTeil, wird mit abgeglichen). Der Takt Satz/Hören bleibt der
     Tageswechsel aus heuteExtraModus() in js/start.js.
   · „Gemischt" zieht nur die Übungen des heutigen Teils reihum; das
     Tagesziel ist genau ein Teil (satzTageszielHeute()): seine Einstellung
     anteilig. Die Einstellung selbst bleibt unverändert (satzTagesziel()).
   ⛔ Wechsel und Tagesziel sind seit v618 anders — der Block nach satzTeile(). */
const UEB_ZEIT_SCHAETZUNG = { mehrfach: 20, wahl: 12, schreiben: 60 };
function satzTeile(){
  const zeit = {}, quelle = {};
  for (const m of UEBUNGEN){
    const g = (typeof uebZeitGemessen === 'function') ? uebZeitGemessen(m.id) : null;
    zeit[m.id] = g !== null ? g : (UEB_ZEIT_SCHAETZUNG[m.art] || 15);
    quelle[m.id] = g !== null ? 'gemessen' : 'geschaetzt';
  }
  const nr = id => (UEBUNGEN.find(m => m.id === id) || {}).nr || 0;
  const reihe = UEBUNGEN.slice().sort((a, b) => (zeit[b.id] - zeit[a.id]) || (a.nr - b.nr));
  const teil = { 1: [], 2: [] }, summe = { 1: 0, 2: 0 };
  for (const m of reihe){
    const t = summe[1] < summe[2] ? 1 : summe[2] < summe[1] ? 2 : (teil[1].length <= teil[2].length ? 1 : 2);
    teil[t].push(m.id); summe[t] += zeit[m.id];
  }
  teil[1].sort((a, b) => nr(a) - nr(b)); teil[2].sort((a, b) => nr(a) - nr(b));
  return { 1: teil[1], 2: teil[2], zeit, quelle, summe };
}
/* ⭐⭐ v618 — DIE TEILE LAUFEN VON SELBST (25.09.2026)
   Elias, wörtlich: „ich stelle mir das so vor das die app automatisch meinen
   ring bzw mein tagesziel einstellt (einfach so das ich innerhalb von 3 tagen
   halt beide teile mache (zwischendurch halt hören)) und das ich den einen
   teil dann halt am tag mache und wenn ich weiter machen will kommt halt
   automatisch der zweite teil. und am anderen tag halt andersherum, dann
   kommt der zweite teil und dann später der erste sollte ich weiter machen
   ganz automatisch. sollte ich mal an einem tag den satzmodus nicht machen
   dann wartet so lange der teil den ich hätte machen müssen bis ich ihn
   machen." Auf die Zusammenfassung (der Ring stellt sich selbst ein, danach
   kommt von selbst der andere Teil, der nächste Satz-Tag geht andersherum,
   ein Teil, der gar nicht oder nur halb geschafft ist, bleibt dran, der
   Wechsel Satz/Hören bleibt): „ja so will ich das".
   · Tagesziel = die Übungen des ANFANGSTEILS, jede einmal (satzTeile()).
   · SETTINGS.satzTeil = { teil: Anfangsteil, erledigt: Tag, an dem er
     geschafft wurde, oder null } — wird mit abgeglichen. Ein Tag NACH
     „erledigt" beginnt mit dem anderen Teil; ohne „erledigt" wartet der
     Teil, beliebig viele Tage.
   · Geschafft = der Tageszähler (satzTag()) erreicht das Ziel. Halb
     geschafft zählt nicht — der Zähler beginnt jeden Tag bei 0.
   · Danach zieht „Gemischt" den anderen Teil (satzTeilAuswahl(), und
     uebungWeiter() baut eine laufende Liste um).
   ⛔ Meine Entscheidung, nicht seine: nach BEIDEN Teilen geht es reihum
     weiter (Anfangsteil, anderer, …) — gesagt hat er nur, dass nach dem
     einen der zweite kommt. */
function satzTeilZustand(){
  const heute = todayStr(0);
  const st = (typeof SETTINGS === 'object' && SETTINGS && SETTINGS.satzTeil) || null;
  let teil = 1, erledigt = null;
  if (st && (st.teil === 1 || st.teil === 2)){
    teil = st.teil;
    if ('erledigt' in st) erledigt = (typeof st.erledigt === 'string' && st.erledigt) ? st.erledigt : null;
    else if (st.tag && st.tag !== heute){
      /* Altes Format (v606–v617): { teil, tag } = der Teil des letzten Tages
         mit Sätzen. Ob er geschafft war, sagt der Tageszähler, wenn er noch
         von genau diesem Tag ist — sonst gilt die alte Regel: der nächste
         Satz-Tag nimmt den anderen Teil. */
      let roh = null;
      try { roh = LS.get('vt_satzTag', null); } catch (e) { roh = null; }
      const geschafft = !(roh && roh.tag === st.tag) || Number(roh.gesamt) >= satzTeile()[teil].length;
      erledigt = geschafft ? st.tag : null;
    }
  }
  if (erledigt && erledigt < heute){ teil = teil === 1 ? 2 : 1; erledigt = null; }
  return { teil, erledigt, heute };
}
/** Der Tag in Teilen: `anfang` = der Teil, mit dem der Tag beginnt (Ring,
 *  „Satz 1/2"), `ziel` = seine Übungszahl, `geschafft`, `jetzt` = der Teil,
 *  den „Gemischt" gerade zieht, `stand` von `groesse` = wie weit darin,
 *  `fertig` = wie viele Teile heute schon geschafft sind. */
function satzTeilStand(){
  const z = satzTeilZustand();
  const teile = satzTeile();
  const n = { 1: Math.max(1, teile[1].length), 2: Math.max(1, teile[2].length) };
  const a = z.teil, gesamt = satzTag().gesamt;
  const geschafft = gesamt >= n[a] || (!!z.erledigt && z.erledigt >= z.heute);
  let jetzt = a, stand = gesamt, fertig = 0;
  if (geschafft){
    jetzt = a === 1 ? 2 : 1; stand = Math.max(0, gesamt - n[a]); fertig = 1;
    while (stand >= n[jetzt]){ stand -= n[jetzt]; jetzt = jetzt === 1 ? 2 : 1; fertig++; }
  }
  return { anfang: a, ziel: n[a], geschafft, jetzt, stand, groesse: n[jetzt], fertig, gesamt, erledigt: z.erledigt };
}
/** Der Anfangsteil des Tages. Mit `speichern` (nach jeder Satzantwort) wird
 *  der Stand abgelegt — und sobald das Ziel erreicht ist, der Tag als
 *  „erledigt". Gespeichert wird nur, was sich geändert hat. */
function satzTeilHeute(speichern){
  const s = satzTeilStand();
  if (speichern && typeof SETTINGS === 'object' && SETTINGS){
    const erledigt = s.geschafft ? (s.erledigt || todayStr(0)) : null;
    const alt = SETTINGS.satzTeil || null;
    if (!alt || alt.teil !== s.anfang || alt.erledigt !== erledigt || 'tag' in alt){
      SETTINGS.satzTeil = { teil: s.anfang, erledigt };
      if (typeof saveSettings === 'function') saveSettings();
    }
  }
  return s.anfang;
}
/** Das Satz-Tagesziel für HEUTE: die Übungen des Anfangsteils, jede einmal. */
function satzTageszielHeute(){ return satzTeilStand().ziel; }
/** Nur die Übungen des Teils, der gerade dran ist — für „Gemischt". */
function satzTeilAuswahl(alle){
  const nur = new Set(satzTeile()[satzTeilStand().jetzt]);
  const raus = {};
  for (const [id, l] of Object.entries(alle || {})) if (nur.has(id)) raus[id] = l;
  return raus;
}

/* ⭐⭐ DIE REGEL EINER AUFGABE, DIE KEINE regelId TRAEGT (15.09.2026)

   Elias: „ich habe ja zumindest einmal bei gemischt 13/13 durchgägngen gemacht
   und das bedeutet alle regeln die gemessen werden können wurden bereits
   einmal gemacht. das bedeutet das man das auch auf die regeln beziehen kann
   die nicht zu gemischt gehören sondern wirklich nur die regel ist die ich
   beantortet habe. zb wenn ich in gemischt weiblich richtig gemacht habe dann
   kann bei der isolierten regel weiblich ja auch ein fortschritt sein."

   Er hat recht, und es geht: jede Markierung am Satz traegt ihre `ruleId`.
   Bis heute zaehlte nur „Welche Regel?" mit — 315 von 4682 Aufgaben.

   ⛔ NUR BEI EINDEUTIGKEIT. Die Markierung wird ueber ihren TEXT gefunden
   (`matchText`), und derselbe Text kann im Satz mehrfach stehen. Passen zwei,
   ist nicht entscheidbar, welche Regel geuebt wurde — dann lieber nichts
   zaehlen als die falsche. Gemessen am 15.09.2026: von 4279 Aufgaben sind
   1297 eindeutig zuordenbar, 5 mehrdeutig, der Rest hat an der gefragten
   Stelle gar keine Markierung. [[kandidatenliste_ist_keine_fehlerliste]]

   ⚠️ Das Benennen („Welche Regel?") und das Anwenden (die uebrigen zwoelf)
   sind zwei verschiedene Nachweise. Beide landen hier im selben Zaehler —
   der Balken in der Statistik misst deshalb Bestaendigkeit, nicht Verstehen. */
function uebungRegelVon(a){
  if (!a || !a.zeilen || !a.satz) return null;
  if (typeof SENTENCE_TAGS === 'undefined') return null;
  const tags = SENTENCE_TAGS[a.satz.id] || [];
  if (!tags.length) return null;

  /* Die Regel an EINER Stelle (oder einer Wortfolge von..bis). Eindeutig oder
     gar nicht — zwei passende Markierungen heissen, dass die Aufgabe nicht
     sagt, welche gemeint war. */
  const regelAn = (von, bis) => {
    const stueck = a.zeilen.slice(von, bis + 1)
      .map(z => z.wort || '').join(' ').trim();
    if (!stueck) return null;
    const treffer = tags.filter(t => t.matchText
      && (t.matchText === stueck || stueck.indexOf(t.matchText) >= 0));
    return treffer.length === 1 ? treffer[0].ruleId : null;
  };

  /* ⛔⛔ MEHRFACHAUSWAHL (15.09.2026). Seit der Umstellung auf „mehrere
     antippen" tragen fuenf Modi `ziele:[…]` statt `wortIdx` —
     mubtada-khabar, nat, idafa, jarr-paar und alle-majrur. Die alte Fassung
     stieg bei fehlendem `wortIdx` in der ERSTEN Zeile aus, und damit zahlten
     **852 Aufgaben** auf gar keine Regel mehr ein.

     Gemerkt hat es Elias, nicht ich: „aber du hast jetzt gemacht, dass wenn
     ich bei gemischt die übungen mache das auch die einzelnen übungen von
     ihrer prozent hoch gehen ja? also das das nicht einfach alles nur unter
     gemischt betrachtet wird". Die Frage galt dem gemischten Modus — beim
     Nachmessen fiel diese zweite, groessere Luecke mit auf.

     ⭐ Die Bedingung ist streng: ALLE Ziele muessen auf DIESELBE Regel
     zeigen. Eine Aufgabe „tippe beide مُضَاف إِلَيْه an" ist ein Nachweis fuer
     genau eine Regel, auch wenn sie zwei Stellen hat. Zeigt auch nur ein Ziel
     woanders hin oder nirgendwohin, wird NICHTS gezaehlt — lieber keine Zahl
     als eine erfundene. [[kandidatenliste_ist_keine_fehlerliste]] */
  if (Array.isArray(a.ziele) && a.ziele.length){
    const regeln = a.ziele.map(i => regelAn(i, i));
    if (regeln.some(r => !r)) return null;
    return regeln.every(r => r === regeln[0]) ? regeln[0] : null;
  }

  if (a.wortIdx == null) return null;
  const bis = (a.wortIdxBis != null) ? a.wortIdxBis : a.wortIdx;
  return regelAn(a.wortIdx, bis);
}

/* Auswertung. Ein Aufruf, drei Arten - und die Zaehlung passiert genau hier,
   damit kein Modus sie vergessen kann. */
function uebungAuswerten(richtig){
  UEB.beantwortet = true;
  UEB.zuletztRichtig = richtig;
  /* ⭐⭐ Q8 (08.09.2026): nach einer FALSCHEN Antwort ist „Weiter" zwei
     Sekunden gesperrt, mit sichtbarem Zaehler. Die Loesung steht sofort da —
     gewollt ist nur, dass der Blick sie erreicht.
     ⛔ HIER und nicht in renderUebung(): dort wuerde die Sperre bei jedem
     Neuzeichnen von vorn beginnen, und das Neuzeichnen passiert oefter, als
     man denkt. Begruendung und Zahl bei `Q8_SPERRE_MS` in js/kern.js. */
  UEB.sperreBis = richtig ? 0
    : Date.now() + (typeof Q8_SPERRE_MS === 'number' ? Q8_SPERRE_MS : 2500);
  UEB.gestellt++;
  if (richtig) UEB.richtig++;
  /* Fortschritt je Regel. Bewusst HIER und nicht in den drei Auswertern
     darueber — derselbe Grund, aus dem UEB.gestellt hier steht: kein Modus
     kann es vergessen. Aufgaben ohne regelId (zwoelf der dreizehn Modi)
     laufen wirkungslos durch, merkeRegel prueft das selbst. */
  if (typeof merkeRegel === 'function'){
    const a = uebungAktuell();
    const rid = (a && a.regelId) ? a.regelId : uebungRegelVon(a);
    if (rid) merkeRegel(rid, richtig);
  }
  /* ⛔ Und der Fortschritt je MODUS (06.09.2026). Bis dahin hinterliessen
     zwoelf der dreizehn Modi — 4367 von 4682 Aufgaben — keinerlei Spur, weil
     nur „Welche Regel?" eine regelId traegt. Elias' Ziel nennt „aufgaben und
     lösungen" ausdruecklich. Ebenfalls HIER und nicht in den Auswertern, aus
     demselben Grund: kein Modus kann es vergessen.

     ⛔⛔ DIE ART DER AUFGABE, NICHT DER GEWAEHLTE MODUS (15.09.2026).

     Hier stand bis heute `UEB.modus`. Im gemischten Modus ist das
     `'gemischt'` — jede Antwort landete unter diesem einen Schluessel, und
     alle dreizehn Uebungsarten blieben auf „nie" stehen, egal wie oft er sie
     gerade beantwortet hatte.

     Elias mit Bild der Statistik: „weil heute hab ich wieder 13 gemischte
     geübt und sehe jetzt das obwohl ich das erste scheinbar nie geübte heute
     tatsächlich geübt habe und sicherlich noch mehr." Er hatte recht: auf
     seinem Bild stehen die ersten vier Uebungsarten auf „nie", obwohl der
     gemischte Durchgang von jeder genau eine stellt.

     `a.modus` traegt die echte Art — uebungenAufbauen() haengt sie an jede
     Aufgabe (`{ ...a, satz, zeilen, modus:m }`), und uebungModusVon() liest
     schon seit dem 06.09. genau daraus.

     ⛔ NICHT zusaetzlich unter 'gemischt' mitzaehlen: renderUebungStand()
     geht allein UEBUNGEN durch, der Eintrag wuerde nie angezeigt — und zwei
     Zaehler fuer dieselbe Antwort sind zwei Wahrheiten.
     [[dieselbe_frage_zwei_antworten]] */
  if (typeof merkeUebung === 'function'){
    const aM = uebungAktuell();
    const art = (aM && aM.modus && aM.modus.id) ? aM.modus.id
              : (UEB && UEB.modus !== UEB_GEMISCHT ? UEB.modus : null);
    if (art) merkeUebung(art, richtig);
    /* v606: die Zeit dieser Aufgabe (einmal je Aufgabe). Der Teil des Tages
       wird seit v618 erst NACH dem Tageszähler unten gemerkt. */
    if (art && UEB.startZeit && typeof merkeUebZeit === 'function') merkeUebZeit(art, (Date.now() - UEB.startZeit) / 1000);
    UEB.startZeit = 0;
  }
  /* ⭐ Und die Trefferquote je TAG (07.09.2026) — die Grundlage für den
     Rauschversuch und für jede spätere Frage „hat das etwas gebracht".
     Ebenfalls HIER, aus demselben Grund wie die zwei Zeilen darüber: kein
     Modus kann es vergessen. Die Begründung steht bei `merkeQuote()`. */
  if (typeof merkeQuote === 'function') merkeQuote(richtig);
  /* ⭐ Der Tageszaehler des Satzmodus. HIER, aus demselben Grund wie
     UEB.gestellt und merkeUebung darueber: kein Modus kann es vergessen.
     ⛔ VOR renderUebung(), damit die Standzeile den neuen Stand zeigt und
     nicht den von vor der Antwort. */
  const satzT = satzTag();
  const satzVorher = satzT.gesamt;
  satzT.gesamt++;
  if (richtig) satzT.richtig++;
  satzTagSpeichern(satzT);
  /* v618: der Teil des Tages — NACH dem Zähler, damit „geschafft" diese
     Antwort schon mitzählt; VOR der Feier, damit der Tag als erledigt
     gespeichert ist, auch wenn die Feier wirft. */
  if (typeof satzTeilHeute === 'function') satzTeilHeute(true);
  /* ⛔ HIER FEHLT KEIN touchStreak() — das ist Absicht und Elias' Entscheidung
     vom 14.09.2026. Die Serie haengt allein an den Karteikarten
     (js/lernen.js, in answer()); ein Tag mit nur Saetzen zaehlt fuer sie
     nicht. Ihm genau so berichtet und angeboten, es zu aendern, seine
     Antwort: „nein ist gut so". Die ausfuehrliche Begruendung steht an der
     Aufrufstelle in js/lernen.js. ⛔ Nicht „nachruesten". */

  renderUebung();
  /* Haken fuer die Feier-Effekte (Nachtplan Punkt 8). Solange es js/feier.js
     nicht gibt, passiert hier nichts - der Aufruf ist bewusst wegoptional. */
  if (typeof feiereUebung === 'function') feiereUebung(richtig, UEB);

  /* ⭐ Das Tagesziel — genau beim UEBERGANG, nicht bei jedem Stand darueber.
     Ohne den Vorher-Vergleich feuerte es bei Aufgabe 14, 15, 16 … erneut; dass
     der Anlass `einmalig` je Tag ist, faengt das zwar ab, aber eine Bedingung,
     die sich auf eine zweite Sperre verlaesst, ist eine Falle fuer den
     naechsten, der die Sperre anfasst. */
  if (satzVorher < satzTageszielHeute() && satzT.gesamt >= satzTageszielHeute()
      && typeof feiere === 'function'){
    feiere('satz-tagesziel', { zahl: satzT.gesamt, richtig: satzT.richtig });
  }
  /* ⭐ Und danach: war das der dritte von drei? Bewusst AUSSERHALB der
     Uebergangsbedingung darueber — der Tag kann auch bei Aufgabe 20 komplett
     werden, wenn Hoeren und Karten erst danach kamen. */
  if (typeof tagKomplettPruefen === 'function') tagKomplettPruefen();
}

/* ⭐⭐ DIE ART GEHOERT ZUR AUFGABE, NICHT NUR ZUM MODUS (14.09.2026)

   Elias mit einem Bildschirmfoto: „hier sind aber beide antworten richtig".
   Der Satz war „مَنْ مِنَ الصِّينِ؟ عَمَّارٌ مِنَ الصِّينِ." — zwei Mal مِنَ,
   beide حَرْف جَرّ, und die Aufgabe liess nur eines gelten.

   ⛔ Gemessen am selben Tag ueber alle 862 Tipp-Aufgaben: **179 waren
   mehrdeutig** — 107 in mubtada-khabar, 56 in nat, 13 in jarr-paar, 3 in
   idafa. Nur `alle-majrur` war sauber, und zwar weil es von vornherein nach
   ALLEN fragt. Genau dieses Muster bekommen die anderen jetzt auch.

   Elias' eigener Vorschlag dazu: „vielleicht kann man auch sagen das es
   mehrere gibt und das man mehrere antippen soll."

   Deshalb entscheidet ab jetzt die AUFGABE ueber ihre Art: ein Treffer bleibt
   `tippen` (ein Antippen, sofortige Rueckmeldung), mehrere werden `mehrfach`
   (alle antippen, dann „Pruefen"). Der Modus gibt nur noch die Vorgabe.
   [[kandidatenliste_ist_keine_fehlerliste]] */
function uebungArtVon(a){
  if (a && a.art) return a.art;
  const m = uebungModusVon(a);
  return m ? m.art : null;
}

function uebungWortTipp(i){
  const a = uebungAktuell();
  if (!a || UEB.beantwortet) return;
  const m = uebungModusVon(a);
  if (!m) return;
  /* ⭐⭐ BEIM ÜBERSETZEN ZEIGT EIN TIPP AUFS WORT SEINE BEDEUTUNG (25.09.2026).
     Elias, mit Bild von Übung 15 (Übersetzen, seit v612 Nr. 16): „beim überstetzten möchte ich, dass wenn ich
     auf das arabische wort tippe das ein kleines fenster mit der richtigen
     übersetzung steht weil manchmal weiß ich halt nicht was das wort bedeutet
     und dann kann ich es natürlich nciht übersetzten. diese übersetzung soll
     nur auftauchen wenn ich das wort anklicke".
     ⛔ Hier stand bis dahin ein `return` mit MEINER Begründung („ein Tipp aufs
     Wort verrät die Vokabel — die halbe Lösung"). Sein Wort schlägt sie. Das
     Fenster: uebWortFensterZeigen() unten; zweiter Tipp aufs selbe Wort macht
     es zu, die Tastatur bleibt offen (mousedown am Satz). */
  if (uebungArtVon(a) === 'schreiben'){ uebWortFensterZeigen(i); return; }
  if (uebungArtVon(a) === 'mehrfach'){
    if (UEB.gewaehlt.has(i)) UEB.gewaehlt.delete(i); else UEB.gewaehlt.add(i);
    renderUebung();
    return;
  }
  if (uebungArtVon(a) !== 'tippen') return;
  UEB.gewaehlt = new Set([i]);
  uebungAuswerten(a.ziele.includes(i));
}

function uebungMehrfachPruefen(){
  const a = uebungAktuell();
  if (!a || UEB.beantwortet) return;
  /* „Prüfen" bedient seit dem 22.09.2026 zwei Arten. Die Weiche steht HIER und
     nicht im Knopf: der Knopf hat einen Handler, und zwei Handler auf einem
     Knopf sind zwei Wahrheiten darüber, was er tut. */
  if (uebungArtVon(a) === 'schreiben'){ uebungSchreibenPruefen(); return; }
  const soll = new Set(a.ziele);
  const richtig = soll.size === UEB.gewaehlt.size && [...soll].every(i=>UEB.gewaehlt.has(i));
  uebungAuswerten(richtig);
}

/* ⭐⭐ Die Übersetzungsübung — Elias' Auftrag vom 22.09.2026, 21:15:
   „wenn ich falsch mache muss erkannt werden was falsch ist und warum und mir
   das dann zeigen" · „und die richtige deutsche überstzung und halt warum"

   Die Prüfung selbst steht in js/uebersetzen.js. Hier wird nur eingesammelt,
   was sie liefert, und an die Stellen gehängt, die renderUebung() ohnehin
   zeichnet: `aufloesung` trägt den Text, `warum` die Regelkarte.

   ⛔ Fehlt die Datei (Ladefehler, alter Offline-Vorrat), wird NICHT stumm
   ausgewertet. Eine Übung, die jede Antwort als falsch zählt, weil ihre
   Prüfung fehlt, ist schlimmer als eine, die sich abmeldet.
   [[ausfall_ist_unsichtbar_gebaut]] */
function uebungSchreibenPruefen(){
  const a = uebungAktuell();
  if (!a || UEB.beantwortet) return;
  const feld = document.getElementById('uebEingabe');
  const text = feld ? String(feld.value || '') : '';

  if (typeof uebersetzungPruefen !== 'function'){
    if (typeof toast === 'function') toast('Die Übersetzungsprüfung ist nicht geladen — App einmal schließen und neu öffnen.');
    return;
  }
  const erg = uebersetzungPruefen(a.satz, a.zeilen, text);
  /* Ein leeres Feld ist keine falsche Antwort, sondern gar keine. Sie zu werten
     hieße, ihm einen Fehler in die Statistik zu schreiben, den er nie gemacht
     hat. */
  if (erg.leer){
    if (typeof toast === 'function') toast(erg.text);
    return;
  }
  a.aufloesung = (typeof uebersetzungRueckmeldung === 'function')
    ? uebersetzungRueckmeldung(erg) : '';
  /* „Warum? → Regel" greift `a.warum` ab (uebungWarum). Kein Befund mit
     nennbarer Regel: dann bleibt der Knopf weg, statt irgendeine Karte zu
     zeigen. */
  a.warum = (typeof uebersetzungRegel === 'function') ? uebersetzungRegel(erg) : null;
  UEB.eingabeLeeren = false;
  uebungAuswerten(!!erg.richtig);
}

function uebungWahl(wert){
  const a = uebungAktuell();
  if (!a || UEB.beantwortet || !a.optionen) return;
  UEB.gewaehlt = new Set([wert]);
  uebungAuswerten(String(wert) === String(a.loesung));
}

function uebungWeiter(){
  /* ⭐ v618: „Gemischt" geht von selbst in den anderen Teil, sobald der Teil
     geschafft ist — Elias: „wenn ich weiter machen will kommt halt
     automatisch der zweite teil". Die Liste wurde beim Start für EINEN Teil
     gebaut; ab hier kommt der Rest aus dem Teil, der jetzt dran ist. */
  if (UEB.modus === UEB_GEMISCHT && UEB.teil && typeof satzTeilStand === 'function'){
    const jetzt = satzTeilStand().jetzt;
    if (jetzt !== UEB.teil){
      const neu = uebungGemischteListe(satzTeilAuswahl(uebungenAufbauen()));
      if (neu.length){ UEB.liste = UEB.liste.slice(0, UEB.idx + 1).concat(neu); UEB.teil = jetzt; }
    }
  }
  if (UEB.idx + 1 >= UEB.liste.length){
    const stand = `Durch! ${UEB.richtig} von ${UEB.gestellt} richtig.`;
    UEB.modus = null;
    uebungAnsicht(false);
    renderUebungsLeiste();
    renderSentence();
    toast(stand);
    return;
  }
  UEB.idx++;
  UEB.gewaehlt = new Set();
  UEB.beantwortet = false;
  /* ⛔ Das Eingabefeld der Übersetzungsübung leeren — aber über eine Marke und
     nicht hier direkt: renderUebung() entscheidet ohnehin, ob es überhaupt
     sichtbar ist, und zwei Stellen, die dasselbe Feld setzen, laufen früher
     oder später auseinander. Ohne das Leeren stünde die Übersetzung des
     vorigen Satzes in der nächsten Aufgabe. */
  UEB.eingabeLeeren = true;
  renderUebung();
}

/* ---------- Verdrahtung ---------- */
document.getElementById('uebWaehler').addEventListener('click', ()=>{
  blattUmschalten('uebWaehler', 'uebBlatt');
});
document.getElementById('uebBlatt').addEventListener('click', (e)=>{
  const knopf = e.target.closest('[data-uebmodus]');
  if (!knopf) return;
  const id = knopf.dataset.uebmodus;
  if (UEB.modus === id) uebungBeenden(); else uebungStarten(id);
  /* Zu — sonst steht das Blatt ueber der Aufgabe, die es gerade gestartet hat. */
  blattUmschalten('uebWaehler', 'uebBlatt', false);
});
document.getElementById('uebSatz').addEventListener('click', (e)=>{
  const span = e.target.closest('[data-uebidx]');
  if (span) uebungWortTipp(Number(span.dataset.uebidx));
});
/* Beim Übersetzen bleibt das Eingabefeld im Fokus, wenn er ein Wort antippt —
   sonst klappte die Tastatur bei jedem Nachschlagen zu. */
document.getElementById('uebSatz').addEventListener('mousedown', (e)=>{
  const a = uebungAktuell();
  if (a && uebungArtVon(a) === 'schreiben' && e.target.closest('[data-uebidx]')) e.preventDefault();
});

/* ---------- Das kleine Fenster mit der Wortbedeutung („Übersetzen") ----------
   Steht direkt unter dem angetippten Wort, nicht unten als Meldung: dort
   läge es hinter der Handytastatur. Zu geht es beim zweiten Tipp aufs selbe
   Wort, bei einem Tipp daneben und mit jeder neuen Aufgabe (renderUebung). */
let UEB_WORT_FENSTER = null;   // { a, i } — offen für dieses Wort dieser Aufgabe
function uebWortFensterZu(){
  UEB_WORT_FENSTER = null;
  const el = document.getElementById('uebWortFenster');
  if (el) el.classList.add('hidden');
}
function uebWortFensterZeigen(i){
  const a = uebungAktuell();
  if (!a) return;
  if (UEB_WORT_FENSTER && UEB_WORT_FENSTER.a === a && UEB_WORT_FENSTER.i === i){ uebWortFensterZu(); return; }
  const span = document.querySelector(`#uebSatz [data-uebidx="${i}"]`);
  if (!span) return;
  let el = document.getElementById('uebWortFenster');
  if (!el){
    el = document.createElement('div');
    el.id = 'uebWortFenster';
    el.className = 'ueb-wort-fenster hidden';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  const stueck = span.textContent;
  const t = uebersetzungFuer(stueck);
  /* Auch das Nicht-Finden wird gesagt (wie zeigeUebersetzung). */
  el.innerHTML = arabischHervor(t || `${stueck} — dazu habe ich keine Vokabel.`);
  el.classList.remove('hidden');
  const r = span.getBoundingClientRect();
  const b = el.getBoundingClientRect();
  const links = Math.min(Math.max(8, r.left + r.width / 2 - b.width / 2), window.innerWidth - b.width - 8);
  el.style.left = `${Math.round(links)}px`;
  el.style.top = `${Math.round(r.bottom + 8)}px`;
  UEB_WORT_FENSTER = { a, i };
}
document.addEventListener('click', (e)=>{
  if (!UEB_WORT_FENSTER) return;
  if (e.target.closest('#uebWortFenster') || e.target.closest('#uebSatz [data-uebidx]')) return;
  uebWortFensterZu();
});
document.getElementById('uebWahl').addEventListener('click', (e)=>{
  /* ⛔ ZUERST das arabische Wort — aber NUR, wenn schon beantwortet ist.
     Vorher gehoert der Knopf der Antwortwahl; ein Tipp aufs Wort waere sonst
     zugleich eine Antwort, und Elias haette sich beim Nachschlagen die Frage
     verdorben. Er hat es selbst so eingegrenzt: „wenn ich auf die arabischen
     wörter BEI DER LÖSUNG ODER ERKLÄRUNG klicke". */
  const wort = e.target.closest('.ar-wort');
  if (wort && UEB.beantwortet){ zeigeUebersetzung(wort.textContent); return; }
  const knopf = e.target.closest('[data-uebwahl]');
  if (knopf) uebungWahl(knopf.dataset.uebwahl);
});

/* In der Aufloesung gibt es keine Antwortwahl — dort gilt der Tipp immer. */
document.getElementById('uebRueckmeldung').addEventListener('click', (e)=>{
  /* „Warum? → Regel" zuerst: der Knopf trägt selbst arabische Stücke, und ein
     Tipp darauf soll die Karte öffnen, nicht die Übersetzung eines Wortes. Die
     Karte öffnet der Handler in js/regeln.js. */
  if (e.target.closest('.ueb-warum')) return;
  const wort = e.target.closest('.ar-wort');
  if (wort) zeigeUebersetzung(wort.textContent);
});

function zeigeUebersetzung(stueck){
  const t = uebersetzungFuer(stueck);
  /* ⭐ Auch das NICHT-Finden wird gesagt. Ein Tipp, der wortlos nichts tut,
     sieht aus wie ein kaputter Knopf — und Elias haette keinen Anhalt, ob das
     Wort fehlt oder die Funktion. [[ausfall_ist_unsichtbar_gebaut]] */
  if (typeof toast === 'function') toast(t || `${stueck} — dazu habe ich keine Vokabel.`);
}
/* Welche deutschen Wörter zum verdeckten Wort gehören: seine Bedeutung aus den
   Vokabeln und Regelkarten (uebersetzungFuer), verglichen über den Wortanfang
   — „Student" trifft „Studentin", „dieser" trifft „diesem". */
function uebDeKlarAusWort(a){
  const t = a && a.zeilen && a.zeilen[a.wortIdx];
  const txt = t ? uebersetzungFuer(t.rein || t.wort) : null;
  if (!txt) return null;
  const klein = s => String(s).toLowerCase().replace(/[^a-zäöüß]/g, '');
  const woerter = (txt.split(' — ').slice(1).join(' ').toLowerCase().match(/[a-zäöüß]{2,}/g) || [])
    .filter(x => !['m', 'f', 'pl', 'sg', 'singular', 'plural', 'frage', 'vorn'].includes(x));
  if (!woerter.length) return null;
  const gleich = (p, q) => { let n = 0; while (n < p.length && n < q.length && p[n] === q[n]) n++; return n; };
  return { test: w => { const k = klein(w); return k.length > 1 && woerter.some(x => k === x || gleich(k, x) >= 4); } };
}
/* Die Übersetzung unter dem Satz: Tipp zeigt, zweiter Tipp verwischt wieder. */
document.getElementById('uebDe').addEventListener('click', ()=>{
  const a = uebungAktuell();
  if (!a) return;
  UEB_DE_OFFEN = (UEB_DE_OFFEN === a) ? null : a;
  if (typeof deVerschwommenSetzen === 'function') deVerschwommenSetzen(document.getElementById('uebDe'), UEB_DE_OFFEN === a);
});
document.getElementById('btnUebPruefen').addEventListener('click', uebungMehrfachPruefen);
document.getElementById('btnUebWeiter').addEventListener('click', uebungWeiter);
document.getElementById('btnUebBeenden').addEventListener('click', uebungBeenden);

if (typeof module !== 'undefined' && module.exports){
  module.exports = { UEBUNGEN, uebungOhneEndung, uebungKandidaten, uebungWortart };
}
