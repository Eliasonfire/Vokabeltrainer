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
     'tippen'   ein Wort im Satz antippen
     'mehrfach' mehrere Woerter antippen, dann pruefen
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

const uebungIstBestimmt = w => /^(ال|وال|فال|بال|كال|لل)/
  .test(String(w||'').replace(/[ً-ْٰـ]/g,'').replace(/^[وف](?=ال)/,''));

/* Wort ohne Zeichen und ohne Artikel — fuer die Frage „endet es auf ة?".
   Nicht `wortKern`: der wird zum VERGLEICHEN gebraucht und darf hier nicht
   die Endung mitnehmen. */
const uebungNackt = s => String(s||'')
  .replace(/[.،؟!«»:؛]+$/,'').replace(/[ً-ْٰـ]/g,'').replace(/^(?:وَ?|فَ?)?(?:ال|أل)/,'');

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
const KASUS_WAHL = [
  { wert:'raf',  text:'مَرْفُوع · Nominativ' },
  { wert:'jarr', text:'مَجْرُور · Genitiv' },
  { wert:'nasb', text:'مَنْصُوب · Akkusativ' }
];
/* Die sechs Endzeichen, die in den Daten wirklich vorkommen (an vocab-data.js
   ausgezaehlt). Bewusst MIT Tanwin-Unterscheidung: genau daran korrigiert der
   Lehrer am haeufigsten - أَمامَ الطّالِبِ, nicht ṭālibu. */
const HARAKA_WAHL = [
  { wert:'Damma',    text:'ـُ  Ḍamma' },
  { wert:'Dammatan', text:'ـٌ  Ḍammatān' },
  { wert:'Kasra',    text:'ـِ  Kasra' },
  { wert:'Kasratan', text:'ـٍ  Kasratān' },
  { wert:'Fatha',    text:'ـَ  Fatḥa' },
  { wert:'Fathatan', text:'ـً  Fatḥatān' }
];

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
const UEBUNGEN = [
  {
    id:'mubtada-khabar', nr:1, name:'مُبْتَدَأ / خَبَر — Satzteile', art:'tippen',
    /* ⭐ Dieser Modus ist aus Elias' eigener Rueckfrage vom 30.07. entstanden:
       "war es nicht so, dass mubtadi (nomen) und baat (adjektiv) zusammen
       sind?" Er hatte مُبْتَدَأ+خَبَر mit مَنْعُوت+نَعْت verwechselt. Der
       Unterschied: das erste Paar ist ein ganzer SATZ ("der Lehrer IST neu"),
       das zweite nur eine Wortgruppe ("eine grosse Moschee"), und entscheidend
       ist die Bestimmtheit (`nat-bestimmtheit-01`, Folge 13 ca. 3:11,
       Schluessel 1 L9 S. 30). Deshalb steht die Unterscheidung als Hinweis an
       der Aufgabe, nicht erst in der Aufloesung. */
    hinweis:'مُبْتَدَأ + خَبَر bilden einen ganzen Satz („der Lehrer ist neu"). Ein Adjektiv, das nur beschreibt („eine große Moschee"), ist نَعْت.',
    baue(z){
      const out = [];
      z.forEach((t,i)=>{
        if (/^مُبْتَدَأ/.test(t.rolle)) out.push({ frage:'Tippe das مُبْتَدَأ an — worüber wird etwas gesagt?', ziele:[i] });
        else if (t.rolle === 'خَبَر') out.push({ frage:'Tippe das خَبَر an — was wird darüber ausgesagt?', ziele:[i] });
      });
      return out;
    }
  },
  {
    id:'nat', nr:2, name:'نَعْت — Adjektiv zum Nomen', art:'tippen',
    hinweis:'Das نَعْت stimmt mit seinem Wort in Fall, Zahl, Geschlecht UND Bestimmtheit überein.',
    baue(z){
      return z.map((t,i)=>t.rolle.includes('نَعْت')
        ? { frage:'Tippe das نَعْت an — das Wort, das ein anderes beschreibt.', ziele:[i] } : null).filter(Boolean);
    }
  },
  {
    id:'idafa', nr:3, name:'مُضَاف / مُضَاف إِلَيْهِ — Besitz', art:'tippen',
    hinweis:'Der مُضَاف trägt weder Tanwīn noch Artikel; das مُضَاف إِلَيْهِ steht im Genitiv.',
    baue(z){
      const mudaf = z.findIndex(t=>t.rolle.includes('(مُضَاف)'));
      const zu    = z.findIndex(t=>t.rolle.startsWith('مُضَاف إِلَيْه'));
      if (mudaf < 0 || zu < 0) return [];
      /* Zwei Aufgaben statt einer mit zwei Antippen: so sagt die Rueckmeldung,
         WELCHER Teil sass und welcher nicht. */
      return [
        { frage:'Tippe den مُضَاف an — das Wort, das besessen wird.', ziele:[mudaf] },
        { frage:'Tippe das مُضَاف إِلَيْهِ an — den Besitzer.', ziele:[zu] }
      ];
    }
  },
  {
    id:'jarr-paar', nr:4, name:'حَرْف جَرّ + مَجْرُور — Präposition', art:'tippen',
    hinweis:'Der حَرْف جَرّ setzt das Nomen dahinter in den Genitiv.',
    baue(z){
      const out = [];
      z.forEach((t,i)=>{
        if (t.rolle !== 'حَرْف جَرّ') return;
        const n = z[i+1];
        if (!n || n.erwartet !== 'jarr') return;
        out.push({ frage:'Tippe den حَرْف جَرّ an.', ziele:[i] });
        out.push({ frage:'Welches Wort steht dadurch im Genitiv (مَجْرُور)?', ziele:[i+1] });
      });
      return out;
    }
  },
  {
    id:'alle-majrur', nr:5, name:'Alle مَجْرُور — Genitiv', art:'mehrfach',
    hinweis:'Genitiv steht nach حَرْف جَرّ, nach ظَرْف, als مُضَاف إِلَيْهِ — und als نَعْت zu einem Wort im Genitiv.',
    baue(z){
      const ziele = z.map((t,i)=>t.erwartet==='jarr' ? i : -1).filter(i=>i>=0);
      if (!ziele.length) return [];
      const frage = ziele.length === 1
        ? 'Tippe das Wort im Genitiv an — es ist genau eines.'
        : `Tippe alle Wörter im Genitiv an — es sind ${ziele.length}.`;
      return [{ frage, ziele }];
    }
  },
  {
    id:'kasus', nr:6, name:'Welcher Fall?', art:'wahl',
    baue(z){
      return z.map((t,i)=>t.erwartet ? {
        frage:'In welchem Fall steht das hervorgehobene Wort?',
        wortIdx:i, optionen:KASUS_WAHL, loesung:t.erwartet,
        aufloesung:`${t.rolle} → ${KASUS[t.erwartet].ar} (${KASUS[t.erwartet].de})`
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
    hinweis:'Das Wort steht ohne sein Endzeichen. Welches gehört dahin? Achte auch darauf, ob ein Tanwīn dazugehört.',
    baue(z){
      return z.map((t,i)=>{
        if (!t.erwartet || !t.gelesen || t.stimmt === false) return null;
        if (!HARAKA_WAHL.some(h=>h.wert === t.gelesen.zeichen)) return null;
        return {
          frage:'Welche Endung gehört an das hervorgehobene Wort?',
          wortIdx:i, ohneEndung:true, optionen:HARAKA_WAHL, loesung:t.gelesen.zeichen,
          aufloesung:`${t.rolle} → ${KASUS[t.erwartet].ar}, also ${t.gelesen.zeichen}: ${t.rein}`
        };
      }).filter(Boolean);
    }
  },
  {
    id:'wortart', nr:8, name:'اِسْم / فِعْل / حَرْف — Wortart', art:'wahl',
    hinweis:'Im Arabischen zählen auch Adjektive, Adverbien und Ortsangaben als اِسْم — تَحْتَ und هُنَا also auch.',
    baue(z){
      return z.map((t,i)=>{
        const a = uebungWortart(t.wort);
        if (!a) return null;
        return {
          frage:'Welche Wortart hat das hervorgehobene Wort?',
          wortIdx:i, loesung:a,
          optionen:[{wert:'اِسْم',text:'اِسْم · Nomen'},{wert:'فِعْل',text:'فِعْل · Verb'},{wert:'حَرْف',text:'حَرْف · Partikel'}]
        };
      }).filter(Boolean);
    }
  },
  {
    id:'bestimmtheit', nr:9, name:'Bestimmt?', art:'wahl',
    hinweis:'اَلْ macht bestimmt, Tanwīn (ـٌ ـٍ ـً) macht unbestimmt. Beides zusammen gibt es nicht.',
    baue(z){
      return z.map((t,i)=>{
        if (!t.gelesen || uebungWortart(t.wort) !== 'اِسْم') return null;
        const bestimmt = uebungIstBestimmt(t.rein);
        /* Widerspruechliche Faelle nicht fragen: Artikel UND Tanwin zugleich
           gibt es nicht, und ein Wort ohne beides (هَذَا) hat keine Antwort. */
        if (bestimmt === t.gelesen.tanwin) return null;
        return {
          frage:'Ist das hervorgehobene Wort bestimmt oder unbestimmt?',
          wortIdx:i, loesung:bestimmt ? 'bestimmt' : 'unbestimmt',
          optionen:[{wert:'bestimmt',text:'bestimmt (اَلْ)'},{wert:'unbestimmt',text:'unbestimmt (Tanwīn)'}],
          aufloesung:bestimmt ? 'Der Artikel اَلْ steht davor.' : `Die Endung ist ${t.gelesen.zeichen} — ein Tanwīn.`
        };
      }).filter(Boolean);
    }
  },
  {
    id:'regel', nr:10, name:'Welche Regel?', art:'wahl',
    /* Die Ablenker kommen aus DEMSELBEN Thema. Vier zufaellige Regelnamen aus
       73 waeren zu leicht: "Sonnen- und Mondbuchstaben" gegen "Iḍāfa" verraet
       sich schon am Wort. */
    hinweis:'Die falschen Antworten stammen aus demselben Thema — es reicht nicht, den Namen zu erkennen.',
    baue(z, satz){
      const tags = ((typeof SENTENCE_TAGS!=='undefined' && SENTENCE_TAGS[satz.id]) || [])
        .map(t=>({ t, rule: GRAMMAR_RULES.find(r=>r.id===t.ruleId) }))
        .filter(x=>x.rule && !x.rule.ausgeblendet && x.t.matchText);
      const out = [];
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
           werden uebersprungen, nicht willkuerlich einer Regel zugeschlagen. */
        if (tags.filter(x=>x.t.matchText === t.matchText).length > 1) return;
        /* Und die Ablenker duerfen nicht selbst in diesem Satz markiert sein -
           sie waeren dann ebenfalls richtig, nur an einem anderen Wort. */
        const imSatz = new Set(tags.map(x=>x.rule.id));
        const ablenker = uebungAblenker(rule, 3, imSatz);
        if (ablenker.length < 2) return;   // sonst ist es keine Wahl
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
    id:'genus', nr:11, name:'مُذَكَّر / مُؤَنَّث — Geschlecht', art:'wahl',
    /* ⭐ Elias' Widerspruch vom 30.07., als ich den Reiter "Weiblich" aus dem
       Themenfilter genommen hatte: "nein das soll rein, es gibt ja auch
       Ausnahmen und Verkettungen von maennlichen und weiblichen Begriffen, das
       ist schon wichtig." Beides gilt gleichzeitig und ist kein Widerspruch:
       durchBLAETTERN wollte er das Thema nicht, GEPRUEFT werden schon. */
    hinweis:'Meist zeigt ة das Weibliche an — aber nicht immer. Länder, يَدٌ, عَيْنٌ, أُذُنٌ, رِجْلٌ und بِنْتٌ sind weiblich ohne ة.',
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
    id:'isara', nr:12, name:'هَذَا / هَذِهِ — Hinweiswort', art:'wahl',
    hinweis:'Das Hinweiswort richtet sich nach dem Geschlecht des Wortes danach (isara-genus-kongruenz-01).',
    baue(z){
      /* Vier Schreibungen, zwei Paare. `istFem` sagt, welche der beiden im
         Satz steht - daran haengt die Loesung, und nicht an einer Ableitung
         aus dem Schriftbild. */
      const HINWEISWOERTER = [
        { blank:'هذا', m:'هَذَا', f:'هَذِهِ', istFem:false },
        { blank:'هذه', m:'هَذَا', f:'هَذِهِ', istFem:true  },
        { blank:'ذلك', m:'ذَلِكَ', f:'تِلْكَ', istFem:false },
        { blank:'تلك', m:'ذَلِكَ', f:'تِلْكَ', istFem:true  }
      ];
      const out = [];
      z.forEach((t,i)=>{
        const blank = String(t.rein).replace(/[ً-ْٰـ]/g,'').replace(/^أ/,'');
        const p = HINWEISWOERTER.find(x=>x.blank === blank);
        /* Ohne ein Wort danach gibt es nichts, woran man es erkennen koennte. */
        if (!p || !z[i+1]) return;
        out.push({
          frage:'Welches Hinweiswort gehört hierhin?',
          wortIdx:i, verdeckt:true,
          loesung: p.istFem ? p.f : p.m,
          optionen:[{wert:p.m,text:p.m},{wert:p.f,text:p.f}],
          aufloesung:`Es geht um ${z[i+1].rein}.`
        });
      });
      return out;
    }
  },
  {
    id:'fem-form', nr:13, name:'صَغِيرٌ / صَغِيرَةٌ — weibliche Form', art:'wahl',
    hinweis:'Männliche oder weibliche Form? Die Antwort steht im Wort davor — oder im Hinweiswort.',
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
  }
];

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

function uebungAblenker(rule, anzahl, verboten){
  const aus = verboten || new Set();
  const stamm = uebungNamensstamm(rule);
  const brauchbar = r => r.id !== rule.id && !r.ausgeblendet && !aus.has(r.id);
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
  return shuffle(passend).concat(shuffle(rest)).concat(shuffle(nah)).slice(0, anzahl);
}

/* ===================== Ablauf =====================
   Ein Zustand, ein Aufbau, eine Auswertung - fuer alle dreizehn. */
let UEB = { modus:null, liste:[], idx:0, gewaehlt:new Set(), beantwortet:false,
            richtig:0, gestellt:0 };

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

function uebungenAufbauen(){
  const abdruck = uebListenAbdruck();
  if (UEB_CACHE.thema === SATZ_THEMA && UEB_CACHE.liste === abdruck && UEB_CACHE.nachModus)
    return UEB_CACHE.nachModus;
  if (typeof setzeLexikon === 'function') setzeLexikon(VOCAB_DATA);
  const nachModus = {};
  UEBUNGEN.forEach(m=>nachModus[m.id] = []);
  SENT.list.forEach(satz=>{
    if (!satz.sentAr) return;
    const zeilen = analysiereSatz(satz.sentAr);
    UEBUNGEN.forEach(m=>{
      let aufgaben = [];
      try { aufgaben = m.baue(zeilen, satz) || []; }
      catch(e){ aufgaben = []; }   // ein kaputter Modus darf nicht die anderen mitnehmen
      aufgaben.forEach(a=>nachModus[m.id].push({ ...a, satz, zeilen, modus:m }));
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
const UEB_GRUPPEN = [
  ['Antippen',         'tippen'],
  ['Mehrere antippen', 'mehrfach'],
  ['Auswählen',        'wahl']
];

function renderUebungsLeiste(){
  const blatt = document.getElementById('uebBlatt');
  if (!blatt) return;
  const alle = uebungenAufbauen();
  const zeile = m => {
    const n = alle[m.id].length;
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
  const gesamt = UEBUNGEN.reduce((s,m)=>s + alle[m.id].length, 0);
  html = '<div class="gruppe">Ohne Auswahl</div>'
       + `<button class="zeile${UEB.modus===UEB_GEMISCHT?' aktiv':''}${gesamt?'':' leer'}" type="button"`
       + ` data-uebmodus="${UEB_GEMISCHT}"${gesamt?'':' title="In dieser Auswahl gibt es keine Frage."'}>`
       + '<span class="links"><span class="ar">Gemischt — alle Modi reihum</span></span>'
       + `<span class="n">${gesamt}</span></button>`
       + html;
  blatt.innerHTML = html;

  const jetzt = UEBUNGEN.find(m=>m.id===UEB.modus);
  const wert = document.getElementById('uebWert');
  const zahl = document.getElementById('uebZahl');
  if (wert) wert.textContent = jetzt ? jetzt.name
                             : (UEB.modus===UEB_GEMISCHT ? 'Gemischt' : 'Modus wählen');
  if (zahl) zahl.textContent = jetzt ? `${alle[jetzt.id].length} Fragen`
                             : (UEB.modus===UEB_GEMISCHT ? `${gesamt} Fragen`
                                                         : `${UEBUNGEN.length} Modi`);
}

function uebungStarten(modusId){
  const alle = uebungenAufbauen();
  /* Gemischt ordnet reihum an und ist deshalb schon fertig gemischt —
     ein zweites shuffle() unten wuerde genau die Abwechslung zerstoeren,
     fuer die Elias den Modus haben wollte. */
  const gemischt = modusId === UEB_GEMISCHT;
  const liste = gemischt ? uebungGemischteListe(alle) : (alle[modusId] || []);
  if (!liste.length){
    const m = UEBUNGEN.find(x=>x.id===modusId);
    toast(`${gemischt ? 'Gemischt' : (m ? m.name : 'Dieser Modus')}: in dieser Auswahl keine Frage. Anderes Thema wählen.`);
    return;
  }
  if (LUECKE.aktiv) beendeLuecke();
  UEB = { modus:modusId, liste: gemischt ? liste : shuffle(liste.slice()), idx:0, gewaehlt:new Set(),
          beantwortet:false, richtig:0, gestellt:0 };
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
  let koerbe = shuffle(UEBUNGEN.map(m => shuffle((nachModus[m.id] || []).slice()))
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
  document.getElementById('uebStand').textContent = `${UEB.idx+1} / ${UEB.liste.length} · ${UEB.richtig} richtig`;
  document.getElementById('uebFrage').innerHTML = arabischHervor(a.frage);
  document.getElementById('uebSatz').innerHTML = uebungSatzHtml(a);
  document.getElementById('uebDe').textContent = a.satz.sentDe || '';
  document.getElementById('uebHerkunft').textContent = herkunft(a.satz);

  const hinweis = document.getElementById('uebHinweis');
  hinweis.innerHTML = arabischHervor(m.hinweis || '');
  hinweis.classList.toggle('hidden', !m.hinweis);

  const wahl = document.getElementById('uebWahl');
  if (a.optionen){
    wahl.innerHTML = a.optionen.map(o=>{
      let k = 'ueb-option';
      if (UEB.beantwortet && o.wert === a.loesung) k += ' richtig';
      if (UEB.beantwortet && UEB.gewaehlt.has(o.wert) && o.wert !== a.loesung) k += ' falsch';
      return `<button class="${k}" data-uebwahl="${escapeHtml(String(o.wert))}" lang="ar">${uebungOptionHtml(o.text)}</button>`;
    }).join('');
    wahl.classList.remove('hidden');
  } else wahl.classList.add('hidden');
  /* Traegt das CSS, das die arabischen Woerter erst nach dem Beantworten
     antippbar aussehen laesst — dieselbe Grenze wie im Klick-Handler. */
  wahl.classList.toggle('beantwortet', !!UEB.beantwortet);

  /* "Prüfen" gibt es nur bei Mehrfachauswahl - sonst zaehlt der erste Tipp,
     und ein zweiter Knopf waere ein Umweg. */
  document.getElementById('btnUebPruefen').classList.toggle('hidden',
    m.art !== 'mehrfach' || UEB.beantwortet);
  document.getElementById('btnUebWeiter').classList.toggle('hidden', !UEB.beantwortet);

  const rueck = document.getElementById('uebRueckmeldung');
  rueck.className = 'ueb-rueck' + (UEB.beantwortet ? (UEB.zuletztRichtig ? ' gut' : ' schlecht') : ' hidden');
  if (UEB.beantwortet){
    const teile = [UEB.zuletztRichtig ? 'Richtig.' : 'Nicht ganz.'];
    if (a.aufloesung) teile.push(a.aufloesung);
    /* ⭐ innerHTML statt textContent, damit die arabischen Woerter in der
       Aufloesung dieselbe Behandlung bekommen wie in den Antwortknoepfen:
       groesser und antippbar. arabischHervor() maskiert selbst. */
    rueck.innerHTML = arabischHervor(teile.join(' '));
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
  for (const w of woerter){
    const k = wortKern(w);
    if (k.length < 2) continue;
    const t = quelle.find(v => v && (wortKern(v.ar || '') === k
                                  || wortKern(v.sg || '') === k
                                  || wortKern(v.pl || '') === k));
    if (t && t.de) gefunden.push(`${w} — ${t.de}`);
  }
  return gefunden.length ? gefunden.join(' · ') : null;
}

/* Auswertung. Ein Aufruf, drei Arten - und die Zaehlung passiert genau hier,
   damit kein Modus sie vergessen kann. */
function uebungAuswerten(richtig){
  UEB.beantwortet = true;
  UEB.zuletztRichtig = richtig;
  UEB.gestellt++;
  if (richtig) UEB.richtig++;
  /* Fortschritt je Regel. Bewusst HIER und nicht in den drei Auswertern
     darueber — derselbe Grund, aus dem UEB.gestellt hier steht: kein Modus
     kann es vergessen. Aufgaben ohne regelId (zwoelf der dreizehn Modi)
     laufen wirkungslos durch, merkeRegel prueft das selbst. */
  if (typeof merkeRegel === 'function'){
    const a = uebungAktuell();
    if (a && a.regelId) merkeRegel(a.regelId, richtig);
  }
  renderUebung();
  /* Haken fuer die Feier-Effekte (Nachtplan Punkt 8). Solange es js/feier.js
     nicht gibt, passiert hier nichts - der Aufruf ist bewusst wegoptional. */
  if (typeof feiereUebung === 'function') feiereUebung(richtig, UEB);
}

function uebungWortTipp(i){
  const a = uebungAktuell();
  if (!a || UEB.beantwortet) return;
  const m = uebungModusVon(a);
  if (!m) return;
  if (m.art === 'mehrfach'){
    if (UEB.gewaehlt.has(i)) UEB.gewaehlt.delete(i); else UEB.gewaehlt.add(i);
    renderUebung();
    return;
  }
  if (m.art !== 'tippen') return;
  UEB.gewaehlt = new Set([i]);
  uebungAuswerten(a.ziele.includes(i));
}

function uebungMehrfachPruefen(){
  const a = uebungAktuell();
  if (!a || UEB.beantwortet) return;
  const soll = new Set(a.ziele);
  const richtig = soll.size === UEB.gewaehlt.size && [...soll].every(i=>UEB.gewaehlt.has(i));
  uebungAuswerten(richtig);
}

function uebungWahl(wert){
  const a = uebungAktuell();
  if (!a || UEB.beantwortet || !a.optionen) return;
  UEB.gewaehlt = new Set([wert]);
  uebungAuswerten(String(wert) === String(a.loesung));
}

function uebungWeiter(){
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
document.getElementById('btnUebPruefen').addEventListener('click', uebungMehrfachPruefen);
document.getElementById('btnUebWeiter').addEventListener('click', uebungWeiter);
document.getElementById('btnUebBeenden').addEventListener('click', uebungBeenden);

if (typeof module !== 'undefined' && module.exports){
  module.exports = { UEBUNGEN, uebungOhneEndung, uebungKandidaten, uebungWortart };
}
