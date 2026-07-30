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
           enthalten. Eine Markierung ueber MEHRERE Woerter (Leerzeichen darin)
           laesst sich auf kein einzelnes Wort hervorheben und wird
           uebersprungen, statt willkuerlich das erste zu nehmen. */
        if (/\s/.test(t.matchText)) return;
        let idx = z.findIndex(zeile=>zeile.rein === t.matchText);
        if (idx < 0) idx = z.findIndex(zeile=>zeile.wort.includes(t.matchText));
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
          frage:'Welche Regel wird am hervorgehobenen Wort sichtbar?',
          wortIdx:idx, optionen, loesung:rule.id,
          aufloesung:rule.name
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
        const weiblich = v.gender === 'feminine';
        const hatTa = /ة/.test(String(v.ar).replace(/[ً-ْٰـ]/g,''));
        return {
          frage:'Ist das hervorgehobene Wort مُذَكَّر oder مُؤَنَّث?',
          wortIdx:i, loesung:weiblich ? 'f' : 'm',
          optionen:[{wert:'m',text:'مُذَكَّر · männlich'},{wert:'f',text:'مُؤَنَّث · weiblich'}],
          /* Dass es eine Ausnahme ist, gehoert in die Aufloesung und nicht in
             die Frage - in der Frage waere es die Antwort. */
          aufloesung: (weiblich && !hatTa)
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
        return {
          frage:'Welche Form gehört hierhin?',
          wortIdx:i, verdeckt:true,
          loesung: istWeiblich ? 'f' : 'm',
          optionen:[{wert:'m',text:maennlich},{wert:'f',text:weiblich}],
          aufloesung: i > 0 ? `Es richtet sich nach ${z[i-1].rein}.` : `${v.ar} — ${v.de}`
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
   nur um die Zahlen an die Reiter zu schreiben. */
let UEB_CACHE = { thema:null, nachModus:null };

function uebungenAufbauen(){
  if (UEB_CACHE.thema === SATZ_THEMA && UEB_CACHE.nachModus) return UEB_CACHE.nachModus;
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
  UEB_CACHE = { thema:SATZ_THEMA, nachModus };
  return nachModus;
}

function renderUebungsLeiste(){
  const leiste = document.getElementById('uebModi');
  if (!leiste) return;
  const alle = uebungenAufbauen();
  leiste.innerHTML = UEBUNGEN.map(m=>{
    const n = alle[m.id].length;
    /* Die Zahl steht dran, auch wenn sie 0 ist. Elias' Auflage: ein Modus
       ohne Fragen sagt das ehrlich, statt ins Leere zu laufen. */
    return `<button class="ueb-modus${UEB.modus===m.id?' active':''}${n?'':' leer'}" data-uebmodus="${m.id}"`
         + `${n?'':' title="In dieser Auswahl gibt es dazu keine Frage."'}>`
         + `${escapeHtml(m.name)}<i>${n}</i></button>`;
  }).join('');
}

function uebungStarten(modusId){
  const alle = uebungenAufbauen();
  const liste = alle[modusId] || [];
  if (!liste.length){
    const m = UEBUNGEN.find(x=>x.id===modusId);
    toast(`${m ? m.name : 'Dieser Modus'}: in dieser Auswahl keine Frage. Anderes Thema wählen.`);
    return;
  }
  if (LUECKE.aktiv) beendeLuecke();
  UEB = { modus:modusId, liste:shuffle(liste.slice()), idx:0, gewaehlt:new Set(),
          beantwortet:false, richtig:0, gestellt:0 };
  document.getElementById('gramPopover').classList.remove('show');
  uebungAnsicht(true);
  renderUebungsLeiste();
  renderUebung();
}

function uebungBeenden(){
  const stand = UEB.gestellt ? `${UEB.richtig} von ${UEB.gestellt} richtig` : null;
  UEB.modus = null;
  uebungAnsicht(false);
  renderUebungsLeiste();
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

/* Der Satz mit antippbaren Woertern. Ein Wort kann verdeckt sein (dann ist es
   selbst die Antwort) oder ohne seine Endung stehen (Modus 7). */
function uebungSatzHtml(a){
  return a.zeilen.map((t,i)=>{
    const gewaehlt = UEB.gewaehlt.has(i);
    const ziel = a.ziele ? a.ziele.includes(i) : (a.wortIdx === i);
    let klassen = 'ueb-wort';
    if (a.wortIdx === i) klassen += ' hervor';
    if (gewaehlt) klassen += ' gewaehlt';
    if (UEB.beantwortet && ziel) klassen += ' richtig';
    if (UEB.beantwortet && gewaehlt && !ziel) klassen += ' falsch';
    let text = t.wort;
    if (a.verdeckt && a.wortIdx === i && !UEB.beantwortet) text = '____';
    else if (a.ohneEndung && a.wortIdx === i && !UEB.beantwortet) text = uebungOhneEndung(t.wort);
    return `<span class="${klassen}" data-uebidx="${i}">${escapeHtml(text)}</span>`;
  }).join(' ');
}

function renderUebung(){
  const a = uebungAktuell();
  const m = UEBUNGEN.find(x=>x.id===UEB.modus);
  if (!a || !m){ uebungBeenden(); return; }

  document.getElementById('uebName').textContent = `${m.nr}. ${m.name}`;
  document.getElementById('uebStand').textContent = `${UEB.idx+1} / ${UEB.liste.length} · ${UEB.richtig} richtig`;
  document.getElementById('uebFrage').textContent = a.frage;
  document.getElementById('uebSatz').innerHTML = uebungSatzHtml(a);
  document.getElementById('uebDe').textContent = a.satz.sentDe || '';
  document.getElementById('uebHerkunft').textContent = herkunft(a.satz);

  const hinweis = document.getElementById('uebHinweis');
  hinweis.textContent = m.hinweis || '';
  hinweis.classList.toggle('hidden', !m.hinweis);

  const wahl = document.getElementById('uebWahl');
  if (a.optionen){
    wahl.innerHTML = a.optionen.map(o=>{
      let k = 'ueb-option';
      if (UEB.beantwortet && o.wert === a.loesung) k += ' richtig';
      if (UEB.beantwortet && UEB.gewaehlt.has(o.wert) && o.wert !== a.loesung) k += ' falsch';
      return `<button class="${k}" data-uebwahl="${escapeHtml(String(o.wert))}" lang="ar">${escapeHtml(o.text)}</button>`;
    }).join('');
    wahl.classList.remove('hidden');
  } else wahl.classList.add('hidden');

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
    rueck.textContent = teile.join(' ');
  }
}

/* Auswertung. Ein Aufruf, drei Arten - und die Zaehlung passiert genau hier,
   damit kein Modus sie vergessen kann. */
function uebungAuswerten(richtig){
  UEB.beantwortet = true;
  UEB.zuletztRichtig = richtig;
  UEB.gestellt++;
  if (richtig) UEB.richtig++;
  renderUebung();
  /* Haken fuer die Feier-Effekte (Nachtplan Punkt 8). Solange es js/feier.js
     nicht gibt, passiert hier nichts - der Aufruf ist bewusst wegoptional. */
  if (typeof feiereUebung === 'function') feiereUebung(richtig, UEB);
}

function uebungWortTipp(i){
  const a = uebungAktuell();
  if (!a || UEB.beantwortet) return;
  const m = UEBUNGEN.find(x=>x.id===UEB.modus);
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
document.getElementById('uebModi').addEventListener('click', (e)=>{
  const knopf = e.target.closest('[data-uebmodus]');
  if (!knopf) return;
  const id = knopf.dataset.uebmodus;
  if (UEB.modus === id) uebungBeenden(); else uebungStarten(id);
});
document.getElementById('uebSatz').addEventListener('click', (e)=>{
  const span = e.target.closest('[data-uebidx]');
  if (span) uebungWortTipp(Number(span.dataset.uebidx));
});
document.getElementById('uebWahl').addEventListener('click', (e)=>{
  const knopf = e.target.closest('[data-uebwahl]');
  if (knopf) uebungWahl(knopf.dataset.uebwahl);
});
document.getElementById('btnUebPruefen').addEventListener('click', uebungMehrfachPruefen);
document.getElementById('btnUebWeiter').addEventListener('click', uebungWeiter);
document.getElementById('btnUebBeenden').addEventListener('click', uebungBeenden);

if (typeof module !== 'undefined' && module.exports){
  module.exports = { UEBUNGEN, uebungOhneEndung, uebungKandidaten, uebungWortart };
}
