/* irab.js -- إِعْراب: welche Rolle hat ein Wort im Satz, und welche Endung
   verlangt diese Rolle?
   Teil der App-Logik; wird in index.html in fester Reihenfolge geladen und
   teilt sich mit den uebrigen js/-Dateien den globalen Namensraum.
   Laeuft auch ausserhalb des Browsers (module.exports am Ende), damit
   pruefe-saetze.js dieselbe Logik benutzt und nicht eine zweite, abweichende.

   Umfang: genau das, was Madina Buch 1 behandelt und was in grammar-data.js
   belegt ist - Nominalsatz, حَرْف جَرّ, إِضافة, نَعْت, ظَرْف. Kein Verbalsatz,
   keine اِنَّ-Schwestern, kein Dual, kein gesunder Plural. Was die Analyse
   nicht sicher entscheiden kann, meldet sie als "unklar" statt zu raten:
   eine falsche Kasusangabe waere schlimmer als gar keine (E.1).

   Grundlage im Unterricht:
   - mubtada-khabar-01, nominalsatz-ohne-kopula-01  (beide مَرْفُوع)
   - harf-jarr-fi-ala-01, harf-jarr-min-ila-01, harf-jarr-li-01  (danach مَجْرُور)
   - idafa-01, idafa-zweitglied-01  (مُضَاف ohne Tanwin, مُضَاف إِلَيْه مَجْرُور)
   - nat-vier-bedingungen-01  (نَعْت folgt dem مَنْعُوت in Kasus, Zahl,
     Geschlecht und Bestimmtheit)
   - zuruf-makan-01  (ظَرْف, danach folgt ein مَجْرُور wie bei der Idafa) */

const KASUS = {
  raf:  { ar: 'مَرْفُوع', de: 'Nominativ' },
  jarr: { ar: 'مَجْرُور', de: 'Genitiv'   },
  nasb: { ar: 'مَنْصُوب', de: 'Akkusativ' }
};

/* Die fuenf Praepositionen aus Madina 1, in der Reihenfolge des Lehrers. */
const HURUF_JARR = ['في', 'على', 'إلى', 'الى', 'من', 'ل'];
/* Praeposition MIT angehaengtem Pronomen - فِيهِ, عَلَيْهَا, مِنْهُ. Das ist
   bereits ein vollstaendiges جَارّ وَمَجْرُور: das Pronomen IST der Genitiv,
   es folgt nichts mehr, und die Endung ist مَبْنِيّ, also keine Kasusendung.
 *
 * ⚠️ Warum das hier stehen muss (18.08.2026): Ohne diesen Fall zerlegte der
 * Erklaerer فِيهِ حَامِدٌ ("in ihm ist Hamid") als إِضافة und behauptete, فِيهِ
 * muesse Nominativ sein und حَامِدٌ Genitiv - beides falsch. Aufgefallen ist es
 * an einem Satz aus dem Lehrwerk (Madina 1, S. 61); die Kontrollgruppe in
 * pruefe-saetze.js ist genau dafuer da. Das war KEIN Fehler des Pruefskripts:
 * dieselbe Zerlegung haette Elias in der App zu sehen bekommen.
 *
 * Bewusst NICHT behauptet wird die Satzrolle. In فِيهِ حَامِدٌ ist فِيهِ ein
 * خَبَر مُقَدَّم, in الْبَيْتُ فِيهِ حَدِيقَةٌ dagegen nicht - am Schriftbild
 * ist das nicht zu entscheiden. Lieber keine Aussage als eine falsche.
 *
 * Aufgenommen sind nur Formen, die mit keinem Wort des Wortschatzes
 * zusammenfallen. لَهُ fehlt deshalb bewusst: das angeschriebene ل ist schon
 * bei hatAngeschriebenesJarr aus demselben Grund draussen. */
const JARR_MIT_PRONOMEN = [
  'فيه','فيها','فيهم','فيهما','فيك','فيكم','فينا',
  'عليه','عليها','عليهم','عليك','علينا',
  'إليه','اليه','إليها','اليها','إليك','اليك','إلينا','الينا',
  'منه','منها','منهم','منك',
  'به','بها','بهم'
];
/* ⛔ NICHT ueber kernWort vergleichen. Das stutzt ein fuehrendes و/ف als
   Anschlusspartikel weg, und bei فِيهِ ist das ف Teil des Wortes: kernWort
   liefert dort 'يه'. Der erste Entwurf am 18.08. tat genau das - die Zerlegung
   blieb unveraendert falsch, ohne jede Fehlermeldung. istInListe prueft beide
   Schreibweisen, ohne das Wort zu verstuemmeln. */
const istJarrMitPronomen = w => istInListe(w, JARR_MIT_PRONOMEN);
/* Ortsangaben. Der Lehrer nennt sie ظَرْف und sagt ausdruecklich, sie
   funktionierten "wie ein مُضَاف" - das folgende Wort steht im Genitiv. */
const ZURUF = ['تحت', 'أمام', 'امام', 'خلف', 'فوق', 'عند', 'بين', 'وراء'];
/* Rufpartikel. Sie war bis zum 18.08.2026 unbekannt, und ein unbekanntes Wort
   bekommt in dieser Zerlegung die naechste freie Nomen-Rolle — in
   «أَيْنَ أَبُوكَ يَا خَالِدُ؟» wurde يَا damit zum خَبَر ueber den Vater.
   Was danach kommt, ist der مُنَادَى: Damma OHNE Tanwin (ya-nida-01). */
const HURUF_NIDA = ['يا'];
const istHarfNida = w => istInListe(w, HURUF_NIDA);
/* Woerter, die nie eine Kasusendung tragen. */
const INDEKLINABEL = ['هذا','هذه','ذلك','تلك','هو','هي','أنا','انا','أنت','انت',
                      'نحن','هم','ما','من','أين','اين','متى','كيف','هل','نعم','لا','بلى',
                      'و','ف','ثم','هناك','هنا','التي','الذي','الذين',
                      /* Adverbien: stehen immer auf Fatha und bekommen nie eine
                         Endung nach ihrer Satzrolle. */
                      'الآن','الان','اليوم','غدا','جدا','أيضا','ايضا','معا','دائما','أبدا',
                      'لماذا','ماذا','كم','أي','اي',
                      /* لِمَنْ ist ein festes Fragewort (istifham-liman-01), kein
                         angeschriebenes لِ vor einem Nomen - sonst landet es in der
                         Unklar-Schublade. */
                      'لمن'];

/* Dieselbe Zeile steht in saetze.js als `ohneTaschkil`, und das bleibt mit
   Absicht so: irab.js laeuft auch ausserhalb des Browsers (pruefe-saetze.js
   laedt es per require), wo es die uebrigen Module gar nicht gibt. Ein
   gemeinsamer Helfer in kern.js waere die schoenere Zeile Code und die
   schlechtere Loesung - er wuerde die Node-Nutzung brechen. */

/* Zweiter Fall derselben Regel, und der Beweis, dass der Absatz darueber kein
   Zierrat ist: Am 29.07.2026 wurde `formen()` aus js/kern.js hier aufgerufen -
   genau der "gemeinsame Helfer", vor dem oben gewarnt wird. Im Browser lief es,
   weil index.html kern.js vor irab.js laedt; `node pruefe-saetze.js` starb
   sofort mit "ReferenceError: formen is not defined". Aufgefallen ist es erst
   einem Pruefer, nicht dem Browsertest - der konnte es gar nicht sehen.
   Deshalb steht die Zerlegung hier noch einmal eigenstaendig. Sie muss
   inhaltlich mit formen() in js/kern.js uebereinstimmen; aendert sich eine der
   beiden, gehoert die andere mitgezogen. */
function einzelformen(wert){
  if (typeof wert !== 'string') return [];
  return wert.split(/\s*[|/]\s*/).map(s => s.trim()).filter(Boolean);
}
/* Demonstrativ- und Personalpronomen sind zwar unveraenderlich, aber sie sind
   das مُبْتَدَأ des Satzes - nicht das Wort dahinter. Der Lehrer sagt es
   ausdruecklich (nominalsatz-ohne-kopula-01): هَذَا بَيْتٌ heisst "DIES ist ein
   Haus", also هَذَا = Subjekt, بَيْتٌ = Aussage darueber.
   Fragewoerter gehoeren NICHT dazu: in أَيْنَ الْكَلْبُ؟ ist الْكَلْبُ das
   Subjekt, nicht أَيْنَ. */
const PRONOMEN = ['هذا','هذه','ذلك','تلك','هو','هي','أنا','انا','أنت','انت','نحن','هم'];

const ohneVokale = s => (s || '').replace(/[ً-ْٰـ]/g, '');

/* ---------- Skelettform fuer das Nachschlagen (C2, 18.08.2026) ------------

   Elias' Entscheidung: „اِبْنٌ bleibt, und ich mache den Vergleich fuer die
   Hamzatu-l-waṣl tolerant — dann ist die Frage fuer alle Woerter weg, nicht
   nur fuer dieses."

   Der Anlass war اِبْنٌ (vocab-data.js, wie der Madina-Schluessel) gegen ابْنٌ
   (arabicroots-Abzug, 2× in data/vokabeln-madina-1.js gemessen). Dieser
   Unterschied ist eine Kasra und faellt schon durch `ohneVokale` weg — im
   Browser nachgemessen: beide Schreibungen liefern bereits `noun`.

   Was NICHT wegfaellt, ist die eigentliche Hamzatu-l-waṣl **ٱ** (U+0671). Sie
   steht 18× in vocab-data.js und 24× in data/eselsbruecken-alt.js, praktisch
   immer in zitierten Koranversen — der Korantext schreibt sie so, die
   Lehrbuecher schreiben dasselbe Wort mit schlichtem ا. Fuer das Lexikon waren
   das bisher zwei verschiedene Woerter.

   ⚠️ Die Zeichenklasse steht als `\u`-Folgen und nicht als sichtbare Buchstaben.
   Am 18.08. hat eine sichtbar kopierte Klasse Zeichen fuer Zeichen gleich
   ausgesehen und andere Codepoints gehabt; das Werkzeug fand danach nichts mehr
   und meldete trotzdem Erfolg.

   ⛔ Bewusst NUR die Alif-Varianten. ى→ي und ة→ه wuerden weitere Woerter zu
   einer Skelettform zusammenziehen; wo zwei Wortarten dieselbe Form
   beanspruchen, meldet das Lexikon „mehrdeutig" und sagt dann GAR nichts mehr.
   Toleranz kostet hier Aussagen, deshalb so wenig wie noetig.

   ⚠️ Wird an drei Stellen gebraucht, und alle drei muessen dieselbe Funktion
   benutzen: beim AUFBAU von LEXIKON_ROH und bei den beiden Abfragen. Nimmt der
   Aufbau eine andere Normalisierung als die Abfrage, findet das Lexikon nichts
   mehr — ohne eine einzige Fehlermeldung. */
/* أ U+0623 · إ U+0625 · آ U+0622 · ٱ U+0671  werden alle zu  ا U+0627.
   Als \u-Folgen geschrieben: eine sichtbar kopierte Zeichenklasse sah am
   18.08.2026 Zeichen fuer Zeichen richtig aus und hatte andere Codepoints. */
const skelett = s => ohneVokale(s).replace(/[\u0623\u0625\u0622\u0671]/g, '\u0627');

/* ---------- Endung eines Wortes lesen ----------
   Zurueck kommt, was am Wortende steht: Damma/Dammatan (raf), Kasra/Kasratan
   (jarr), Fatha/Fathatan (nasb) - oder null, wenn das Wort unvokalisiert ist.
   Ein Schluss-Sukun oder ein stummes Alif zaehlt nicht als Kasusendung. */
/* Haengt ein Personalsuffix am Wort (اسْمُكِ, بَيْتُهُ, رَبِّي), steht die
   Kasusendung VOR dem Suffix - اسْمُكِ ist im Nominativ, die Kasra ganz
   hinten gehoert zum "dein". Ohne diese Abtrennung liest der Pruefer jedes
   Wort mit Suffix als Genitiv. */
const SUFFIXE = ['كَ','كِ','كُمْ','كُنَّ','هُ','هَا','هُمْ','هُنَّ','نَا','ي'];
function hatSuffix(w){
  const rein = String(w).replace(/[.،؟!«»:؛]/g, '');
  return SUFFIXE.some(suf => rein.length > suf.length + 2 && rein.endsWith(suf));
}
function ohneSuffix(w){
  for (const suf of SUFFIXE){
    if (w.length > suf.length + 2 && w.endsWith(suf)){
      /* Beim ي des Sprechers ('mein') verschmilzt die Kasusendung mit dem
         Suffix - رَبِّي und اسْمِي sehen im Nominativ, Genitiv und
         Akkusativ gleich aus. Da ist keine Endung mehr zu lesen. */
      if (suf === 'ي') return null;
      return w.slice(0, -suf.length);
    }
  }
  return w;
}

function endung(wort){
  /* Die Schadda ist kein Kasuszeichen, steht in den Daten aber mal vor und mal
     hinter dem Vokal (عَمُّ liegt als Damma+Schadda vor). Solange sie drinsteht,
     findet eine Endungssuche "von hinten" bei jedem verdoppelten Konsonanten
     nichts - das hat den Pruefer bei عَمُّ und أُمُّ jedes Mal danebenliegen
     lassen. Also raus damit, bevor gelesen wird. */
  const w = ohneSuffix((wort || '').replace(/[.،؟!«»:؛]/g, '').replace(/ّ/g, ''));
  if (w === null) return null;
  /* Ein Schluss-Alif gehoert nur zur Endung, wenn ein Fathatan davorsteht
     (كِتَابًا). Bei einfacher Fatha ist es ein langes aa und ueberhaupt keine
     Kasusendung - أَمْرِيكَا und أَلْمَانِيَا sind unveraenderlich. */
  if (/ً[اـ]?$/.test(w)) return { kasus:"nasb", tanwin:true, zeichen:"Fathatan" };
  const m = w.match(/([ٌٍَُِ])$/);
  if (!m) return null;
  const z = m[1];
  if (z === 'ُ') return { kasus:'raf',  tanwin:false, zeichen:'Damma' };
  if (z === 'ٌ') return { kasus:'raf',  tanwin:true,  zeichen:'Dammatan' };
  if (z === 'ِ') return { kasus:'jarr', tanwin:false, zeichen:'Kasra' };
  if (z === 'ٍ') return { kasus:'jarr', tanwin:true,  zeichen:'Kasratan' };
  if (z === 'َ') return { kasus:'nasb', tanwin:false, zeichen:'Fatha' };
  if (z === 'ً') return { kasus:'nasb', tanwin:true,  zeichen:'Fathatan' };
  return null;
}

const istBestimmt = w => /^(ال|وال|فال|بال|كال|لل)/.test(ohneVokale(w).replace(/^[وف](?=ال)/, ''));

/* Wortkern ohne Vokalzeichen, Satzzeichen und angeschriebenes وَ / فَ.
   Das و/ف darf NUR abgeschnitten werden, wenn danach noch ein brauchbares
   Wort steht: sonst wird aus فِي ("in") das Fragment ي, und die Praeposition
   ist nicht mehr erkennbar. Genau dieser Fehler hat den Pruefer bei jedem
   Satz mit فِي danebenliegen lassen. */
function kernWort(w){
  const roh = ohneVokale(w).replace(/[.،؟!«»:؛]/g, '');
  const gestutzt = roh.replace(/^[وف]/, '');
  return gestutzt.length >= 2 ? gestutzt : roh;
}
/* Beide Schreibweisen pruefen - وَهَذَا ist dasselbe Wort wie هَذَا. */
function istInListe(w, liste){
  const roh = ohneVokale(w).replace(/[.،؟!«»:؛]/g, '');
  return liste.includes(roh) || liste.includes(roh.replace(/^[وف]/, ''));
}
const istIndeklinabel = w => INDEKLINABEL.includes(ohneFragepartikel(w))
                         || INDEKLINABEL.includes(ohneFragepartikel(w).replace(/^[وف]/, ""))
                         || istInListe(w, INDEKLINABEL);

/* Ein angeschriebenes لِلْ / بِالْ / كَالْ ist selbst ein حَرْف جَرّ - لِلطَّبِيبِ
   ist nicht "zufaellig Genitiv", sondern لِ + الطبيب.
   Ein einzelnes angeschriebenes ل bleibt bewusst aussen vor: وَلَدٌ und لَبَنٌ
   fangen genauso an, und ob das ل zum Wort gehoert oder eine Praeposition ist,
   entscheidet sich nicht am Schriftbild. Lieber keine Aussage als eine
   falsche. */
const hatAngeschriebenesJarr = w => /^(لل|بال|كال)/.test(kernWort(w));

/* مِنْ (von) und مَنْ (wer) sehen ohne Vokalzeichen gleich aus - der Lehrer
   macht daraus eine eigene Regel (min-man-unterscheiden-01). Hier steht das
   Vokalzeichen zur Verfuegung, also wird es auch benutzt. */
function istMinPraeposition(w){
  const roh = (w || '').replace(/[.،؟!«»:؛]/g, '');
  /* Nur das ganze Wort, nicht sein Anfang: مِنْدِيلٌ faengt genauso an
     und ist ein Tuch, keine Praeposition. */
  return /^[وف]?مِن[َْ]?$/.test(roh);   // Kasra am م = "von", Fatha waere "wer"
}
function istHarfJarr(w){
  if (istMinPraeposition(w)) return true;
  const k = kernWort(w);
  if (k === 'من') return false;    // unvokalisiert nicht entscheidbar
  return HURUF_JARR.includes(k) && k.length > 1;
}
const istZarf = w => istInListe(w, ZURUF);

/* الأَسْمَاءُ الخَمْسَةُ in ihrer إِضَافَة-Form. Ihre Kasusendung ist ein
 * BUCHSTABE (Wāw im Nominativ, Alif im Akkusativ, Yāʾ im Genitiv) und keine
 * Ḥaraka - `endung()` liest dort nichts.
 *
 * ⚠️ Warum das hier stehen muss (18.08.2026): Die Erkennung eines مُضَاف
 * verlangt `gelesen && !gelesen.tanwin`, also eine lesbare Endung. Bei أَبُو
 * ist `gelesen` null, der Erklaerer sah keine إِضَافَة - und verlangte in
 * مَاذَا قَالَ أَبُو بِلَالٍ؟ von بِلَالٍ einen Nominativ. Richtig ist Genitiv,
 * denn بِلَال ist das مُضَاف إِلَيْه. Beleg: Madina-Schluessel 3, Lektion 1,
 * S. 7 (asma-khamsa-vollstaendig-01).
 *
 * ⛔ Bewusst NUR أَب, أَخ und حَم. فُو/فَا/فِي und ذُو/ذَا/ذِي fehlen, weil sie
 * mit der Praeposition فِي und mit Formen von هَذَا zusammenfallen - eine
 * falsche Zerlegung waere schlimmer als eine fehlende. Lieber keine Aussage
 * als eine falsche, wie schon bei hatAngeschriebenesJarr.
 *
 * ⛔ Ebenfalls NICHT dabei: أَبِي/أَخِي als "mein Vater/Bruder". Dort steht das
 * Ich-Pronomen, und genau dann greifen die Sekundaerendungen nach dem Buch
 * NICHT ("und der مُضافٌ إليه nicht ein Pronomen der ersten Person Singular
 * ist"). Am Schriftbild ist أَبِي بِلَالٍ von أَبِي "mein Vater" nicht zu
 * unterscheiden - deshalb zaehlt hier nur, ob ein Nomen folgt; das prueft die
 * Bedingung an der Fundstelle ohnehin. */
const FUENF_NOMEN = ['أبو', 'أخو', 'حمو', 'أبا', 'أخا', 'حما', 'أبي', 'أخي', 'حمي'];
const istFuenfNomen = w => istInListe(w, FUENF_NOMEN);

/* Verben, die in den Beispielsaetzen dieses Repos vorkommen. Ohne diese Liste
   haengt ihre Erkennung am geladenen Vokabelbestand — und der ist bei Elias
   kleiner als beim Pruefwerkzeug: am 18.08.2026 im laufenden Browser gemessen
   321 Eintraege mit 5 Verben, waehrend pruefe-saetze.js 4433 mit 1606 laedt.
   In «خَرَجَ الْمُدَرِّسُ مِنَ الْفَصْلِ» stand deshalb bei ihm خَرَجَ als
   مُبْتَدَأ und الْمُدَرِّسُ als مُضَاف إِلَيْه — „der Ausgang des Lehrers".
   ⛔ Nicht ueber ein Konsonantengeruest erweitern: مِنْ trifft dann مَنَّ,
   صِفْر trifft صَفَرَ, عَمِّي trifft عَمَّ. Jeder Eintrag hier ist an einem
   Satz nachgeschlagen. */
const VERBEN = ['خرج', 'ذهب', 'قال'];
/* Und die Gegenrichtung: der Vokabelabzug haelt diese vier fuer Verben, weil
   ihr Konsonantengeruest mit einem Verb zusammenfaellt. Im Satz sind sie
   keines — صِفْرٌ ist die Null, عَمِّي mein Onkel, جَرٍّ der Genitiv, لِ eine
   Praeposition. Ohne diese Liste macht die Zerlegung daraus einen Verbalsatz
   und das naechste Wort zum فَاعِل. */
const NICHT_VERB = ['صفر', 'عمي', 'جر', 'ل'];
const istVerb = w => !istInListe(w, NICHT_VERB) && istInListe(w, VERBEN);
const giltAlsVerb = w => !istInListe(w, NICHT_VERB) && (wortart(w) === 'verb' || istInListe(w, VERBEN));

/* Warum bei manchen Woertern KEINE Kasusendung zu lesen ist — und das kein
   Mangel ist, sondern die Regel. Zwei Faelle, beide in dieser Datei schon
   behandelt, hier nur benannt:
     ـِي   das Possessiv-Yāʾ verschmilzt mit der Endung (siehe ohneSuffix())
     أَبُو  die fuenf Nomen tragen ihre Endung als BUCHSTABEN (siehe FUENF_NOMEN)
   Gibt den Grund zurueck oder null. */
function endungUnsichtbar(w){
  const rein = String(w).replace(/[.،؟!«»:؛]/g, '');
  const ohne = ohneVokale(rein).replace(/^[و]/, '');
  /* Die fuenf Nomen — auch mit angehaengtem Pronomen: أَبُوكَ ist أبو + كَ,
     und die Liste kennt nur die nackte Form. */
  if (istFuenfNomen(rein)) return 'الأَسْمَاءُ الخَمْسَةُ (Endung ist ein Buchstabe)';
  for (const n of FUENF_NOMEN)
    if (ohne.startsWith(n) && ohne.length > n.length)
      return 'الأَسْمَاءُ الخَمْسَةُ (Endung ist ein Buchstabe)';
  /* Das Yāʾ des Sprechers. Die Ausnahmen sind Woerter, deren Yāʾ zum Wort
     gehoert — sie stehen ohnehin schon in INDEKLINABEL bzw. HURUF_JARR, aber
     eine Auskunft, die von der Reihenfolge der Pruefungen abhaengt, ist keine.
     ⚠️ Zwei Zeichen reichen: لِي ist ohne Vokale nur لي. */
  if (ohne.length >= 2 && ohne.endsWith('ي')
      && !['في','التي','الذي','الذين','هي','اي','الي'].includes(ohne))
    return 'Yāʾ des Sprechers (Endung verschmilzt)';
  /* اِسْم مَقْصُور: endet auf أَلِف مَقْصُورة und aendert sich in keinem Fall —
     الْمُسْتَشْفَى sieht im rafʿ, naṣb und jarr gleich aus. */
  if (ohne.endsWith('ى')) return 'اِسْم مَقْصُور (unveraenderlich)';
  /* Fremde Ortsnamen auf Alif: أَمْرِيكَا, أَلْمَانِيَا, سُوِيسْرَا. Steht so
     schon weiter oben in dieser Datei, dort aber nur fuer die Endungspruefung. */
  if (ohne.endsWith('ا')) return 'endet auf Alif (unveraenderlich)';
  return null;
}

/* Ein vorangestelltes Fragepartikel-أ gehoert nicht zum Wort: أَهَذَا ist
   أ + هَذَا und damit genauso unveraenderlich wie هَذَا allein. */
function ohneFragepartikel(w){
  const roh = ohneVokale(w).replace(/[.،؟!«»:؛]/g, '');
  return /^أ./.test(roh) ? roh.slice(1) : roh;
}

/* ---------- Wortart aus dem Wortschatz ----------
   Ob ein Wort Verb, Nomen oder Adjektiv ist, steht nicht im Schriftbild -
   خَرَجَ und حَجَرٌ sehen strukturell gleich aus. Die arabicroots-Daten fuehren
   die Wortart aber mit (2115 Nomen, 1606 Verben, 506 Adjektive), und damit
   laesst sich beides sauber trennen:
     - ein Verb bekommt gar keine Kasusendung, es ist مَبْنِيّ
     - ein Adjektiv direkt hinter einem Nomen ist ein نَعْت und uebernimmt
       dessen Kasus (nat-vier-bedingungen-01)
   Ohne Lexikon arbeitet die Analyse weiter, nur eben ohne diese beiden
   Unterscheidungen - sie meldet dann "unklar" statt zu raten. */
let LEXIKON = null;         // genau vokalisierte Form -> Wortart
let LEXIKON_ROH = null;     // Form ohne Vokalzeichen -> Wortart oder "mehrdeutig"
function setzeLexikon(eintraege){
  LEXIKON = new Map(); LEXIKON_ROH = new Map();
  const putz = x => String(x).replace(/[.،؟!«»:؛]/g, '').trim();
  const merke = (form, typ, istGrundform) => {
    if (!form) return;
    const genau = putz(form);
    if (!genau) return;
    if (!LEXIKON.has(genau)) LEXIKON.set(genau, typ);
    const roh = skelett(genau);
    /* Ohne Vokalzeichen faellt عَمٌّ (Onkel) mit عَمَّ (verbreitete sich)
       zusammen. Wo zwei Wortarten dieselbe Skelettform beanspruchen, wird
       KEINE gemeldet - lieber "unbekannt" als eine falsche Kasusaussage.
       Aber: die Grundform eines Eintrags wiegt schwerer als eine seiner
       Nebenformen. قَرِيبٌ ist als Grundform ein Adjektiv; dass zufaellig
       auch ein Plural eines anderen Nomens so aussieht, darf das nicht
       ueberdecken. */
    const da = LEXIKON_ROH.get(roh);
    if (!da){ LEXIKON_ROH.set(roh, { typ, grund: !!istGrundform }); return; }
    if (da.typ === typ) { da.grund = da.grund || !!istGrundform; return; }
    if (istGrundform && !da.grund){ LEXIKON_ROH.set(roh, { typ, grund:true }); return; }
    if (!istGrundform && da.grund) return;
    LEXIKON_ROH.set(roh, { typ: 'mehrdeutig', grund: true });
  };
  for (const v of eintraege || []){
    merke(v.ar, v.type, true);
    /* Doppelformen einzeln merken - sonst steht "بُيُوتٌ / أَبْيَاتٌ" als EIN
       Eintrag im Lexikon und passt auf kein Wort im Satz. */
    [v.sg, v.pl, v.femSg, v.femPl, v.past, v.present, v.imperative, v.masdar]
      .forEach(f => einzelformen(f).forEach(einzel => merke(einzel, v.type, false)));
  }
}
/* Steht das Wort als Ganzes im Wortschatz? Dann faengt es nicht mit einer
   angeschriebenen Praeposition an. */
function LEXIKON_hat(w){
  if (!LEXIKON) return false;
  const genau = String(w).replace(/[.،؟!«»:؛]/g, '').trim();
  return LEXIKON.has(genau) || (LEXIKON_ROH && LEXIKON_ROH.has(skelett(genau)));
}

function wortart(w){
  if (!LEXIKON) return null;
  const genau = String(w).replace(/[.،؟!«»:؛]/g, '').trim();
  /* Erst die vollstaendig vokalisierte Form - die ist eindeutig. */
  for (const v of [genau, genau.replace(/^[وف][َُِ]?/, '')]){
    if (LEXIKON.has(v)) return LEXIKON.get(v);
  }
  const roh = skelett(genau);
  for (const v of [roh, roh.replace(/^[وف]/, ''), roh.replace(/^[وف]?ال/, '')]){
    const t = LEXIKON_ROH && LEXIKON_ROH.get(v);
    if (t && t.typ !== 'mehrdeutig') return t.typ;
    if (t) return null;
  }
  return null;
}

/* ---------- Analyse eines Satzes ----------
   Rueckgabe: je Wort { wort, rolle, erwartet, gelesen, stimmt } - `erwartet`
   und `stimmt` sind null, wo die Analyse die Rolle nicht sicher kennt. */
function analysiereSatz(satz){
  const woerter = String(satz || '')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(Boolean);

  const out = [];
  let vorherJarr = false;      // das Wort davor war Praeposition oder Zarf
  let vorherMudaf = false;     // das Wort davor war ein مُضَاف
  let ersteRolleVergeben = false;
  let nachNida = false;   /* steht das naechste Wort hinter يا? */
  let nachVerb = false;   /* steht das naechste Wort hinter einem Verb? */
  let letzterKasus = null;        // Kasus des zuletzt bewerteten Nomens
  let letzteBestimmtheit = null;  // und ob es bestimmt war - fuers نَعْت

  woerter.forEach((wort, i)=>{
    const rein = wort.replace(/[.،؟!«»:؛]/g, '');
    const satzende = /[.؟!]$/.test(wort);
    const gelesen = endung(wort);
    /* Dual und gesunder Plural haben eigene Endungen (ـانِ, ـَيْنِ, ـُونَ,
       ـِينَ) und kommen in Madina 1 noch nicht vor. Darueber wird hier
       nichts behauptet. */
    const dualOderPlural = /(انِ|َيْنِ|ُونَ|ِينَ)$/.test(wort.replace(/[.،؟!«»:؛]/g, ''));
    let rolle = null, erwartet = null;

    if (istJarrMitPronomen(wort)){
      /* Vollstaendige Einheit: das Pronomen ist der Genitiv, es folgt nichts.
         Deshalb wird vorherJarr NICHT gesetzt - das naechste Wort haengt nicht
         an dieser Praeposition. */
      rolle = 'جَارّ وَمَجْرُور (مَبْنِيّ)';
      vorherJarr = false; vorherMudaf = false;
      out.push({ wort, rein, rolle, erwartet:null, gelesen, stimmt:null });
      if (satzende){ ersteRolleVergeben = false; letzterKasus = null; }
      return;
    } else if (istHarfJarr(wort)){
      rolle = 'حَرْف جَرّ';
      vorherJarr = true; vorherMudaf = false;
      out.push({ wort, rein, rolle, erwartet:null, gelesen, stimmt:null });
      return;
    } else if (giltAlsVerb(wort)){
      /* Verben sind مَبْنِيّ - ihre Endung ist keine Kasusendung und wird
         hier nicht bewertet. Nach einem Verb faengt der Satz strukturell neu
         an, das folgende Wort ist فَاعِل und steht im Nominativ. */
      rolle = 'فِعْل';
      vorherJarr = false; vorherMudaf = false; ersteRolleVergeben = false;
      nachVerb = true;
      out.push({ wort, rein, rolle, erwartet:null, gelesen, stimmt:null });
      return;
    } else if (istHarfNida(wort)){
      rolle = 'حَرْف نِدَاء';
      nachNida = true;
      vorherJarr = false; vorherMudaf = false;
      out.push({ wort, rein, rolle, erwartet:null, gelesen, stimmt:null });
      return;
    } else if (istIndeklinabel(wort)){
      /* Steht ein Pronomen am Anfang, ist es das Subjekt - dann wird das
         folgende Nomen zur Aussage darueber und nicht selbst zum Subjekt. */
      const istPronomen = istInListe(wort, PRONOMEN);
      if (istPronomen && !ersteRolleVergeben){
        rolle = 'مُبْتَدَأ (unveränderlich)';
        ersteRolleVergeben = true;
      } else {
        rolle = 'unveränderlich';
      }
      /* Ein Demonstrativpronomen faengt einen neuen Satzteil an: was danach
         kommt, beschreibt nicht mehr das Wort davor. Ohne dieses
         Zuruecksetzen galt in هَذَا الْبَيْتُ لِلتَّاجِرِ وَذَلِكَ الْبَيْتُ das zweite
         الْبَيْتُ als نَعْت zu لِلتَّاجِرِ und damit als Kasusfehler. */
      letzterKasus = null; letzteBestimmtheit = null;
    } else if (istZarf(wort)){
      rolle = 'ظَرْف (Ortsangabe)';
      vorherJarr = true; vorherMudaf = false;
      out.push({ wort, rein, rolle, erwartet:null, gelesen, stimmt:null });
      return;
    } else if (vorherJarr){
      rolle = 'nach حَرْف جَرّ / ظَرْف';
      erwartet = 'jarr';
      vorherJarr = false;
    } else if (vorherMudaf && istIndeklinabel(wort)){
      /* اسْمُ هَذَا الْوَلَدِ - zwischen مُضَاف und مُضَاف إِلَيْه kann ein
         Demonstrativpronomen stehen. Es traegt selbst keine Endung, die
         Erwartung an das folgende Nomen bleibt bestehen. */
      rolle = 'unveränderlich (im مُضَاف إِلَيْه)';
      out.push({ wort, rein, rolle, erwartet:null, gelesen, stimmt:null });
      return;
    } else if (vorherMudaf){
      rolle = 'مُضَاف إِلَيْه';
      erwartet = 'jarr';
      vorherMudaf = false;
    } else if (hatAngeschriebenesJarr(wort)){
      rolle = 'nach angeschriebenem حَرْف جَرّ';
      erwartet = 'jarr';
    } else if (/^لِ/.test(wort) && !LEXIKON_hat(wort)){
      /* Ein Lam mit Kasra am Wortanfang ist meistens die Praeposition
         (لِخَالِدٍ), manchmal aber der erste Wurzelbuchstabe (لِسَانٌ).
         Am Schriftbild ist das nicht zu entscheiden - also keine
         Kasusaussage statt einer falschen. */
      rolle = 'unklar (لِ + Wort oder eigenes Wort?)';
    } else if (wortart(wort) === 'adjective' && letzterKasus
               && istBestimmt(wort) === letzteBestimmtheit){
      /* نَعْت: ein Adjektiv direkt hinter seinem مَنْعُوت stimmt in Kasus,
         Zahl, Geschlecht UND Bestimmtheit mit ihm ueberein - so unterscheidet
         der Lehrer Wortgruppe von Satz (nat-bestimmtheit-01). Stimmt die
         Bestimmtheit nicht ueberein, ist es kein نَعْت, sondern ein خَبَر. */
      rolle = 'نَعْت (Adjektiv zum Wort davor)';
      erwartet = letzterKasus;
    } else if (letzterKasus && letzteBestimmtheit && istBestimmt(wort)){
      /* Zwei bestimmte Nomen hintereinander: das zweite beschreibt das erste
         und stimmt mit ihm ueberein - الْمَدِينَةِ الْمُنَوَّرَةِ. Das gilt auch,
         wenn das Wort nicht im Wortschatz steht und die Wortart deshalb
         unbekannt ist; die Uebereinstimmung in der Bestimmtheit reicht
         (nat-vier-bedingungen-01). Ohne diesen Zweig galt الْمُنَوَّرَةِ als
         خَبَر und damit als Kasusfehler im Lehrbuchsatz. */
      rolle = 'نَعْت (richtet sich nach dem Wort davor)';
      erwartet = letzterKasus;
    } else if (/^و[َ]?/.test(wort) && ersteRolleVergeben && !LEXIKON_hat(wort)){
      /* Nur wenn das Wort als Ganzes NICHT im Wortschatz steht. Sonst gilt
         وَسِخٌ (schmutzig) als وَ + سِخ, und ein richtiger خَبَر faellt aus der
         Pruefung heraus. */
      /* Ein angeschriebenes وَ kann zweierlei sein, und am Schriftbild ist
         nicht zu entscheiden was:
           فِي الْبَيْتِ وَالْمَسْجِدِ    -> Anschluss, Genitiv wie davor
           … أَمَامَ الْمَسْجِدِ وَبَيْتُ … -> neuer Satzteil, Nominativ
         Beides waere hier zu begruenden, also wird keine Endung behauptet.
         Das Wort steht trotzdem in der Liste, damit die Zerlegung vollstaendig
         bleibt. */
      rolle = 'Anschluss mit وَ (Kasus nicht eindeutig)';
      /* Kein vorzeitiges Ende: das Wort kann trotzdem ein مُضَاف sein
         (وَبَيْتُ الطَّبِيبِ), und dann haengt die Endung des naechsten
         Wortes daran. */
    } else if (nachVerb){
      /* Das Subjekt eines Verbalsatzes. Belegt in Schluessel 2, Lektion 5,
         S. 24: «Das Subjekt eines Verbalsatzes wird fā'il genannt ... Der
         fā'il ist marfū'.» */
      rolle = 'فَاعِل';
      erwartet = 'raf';
      nachVerb = false;
      ersteRolleVergeben = true;
    } else if (nachNida){
      /* Der Angerufene steht auf Damma und ohne Tanwin — genau der Fall, den
         Elias' Regel ya-nida-01 am Namen ياسِرُ zeigt. */
      rolle = 'مُنَادَى';
      erwartet = 'raf';
      nachNida = false;
    } else if (!ersteRolleVergeben){
      rolle = 'مُبْتَدَأ';
      erwartet = 'raf';
      ersteRolleVergeben = true;
    } else {
      rolle = 'خَبَر';
      erwartet = 'raf';
    }

    /* مُضَاف erkennen: ein bestimmtes oder endungsloses Nomen ohne Tanwin,
       auf das direkt ein weiteres Nomen folgt (idafa-erkennen-01). Nur wenn
       das naechste Wort kein Satzzeichen beendet und keine Praeposition ist. */
    const naechstes = woerter[i+1];
    if (!String(rolle).includes('unveränderlich') && !hatSuffix(wort)
        && !satzende && naechstes && !istHarfJarr(naechstes)
        /* اسْمُ هَذَا الْوَلَدِ: zwischen مُضَاف und مُضَاف إِلَيْه darf ein
           Demonstrativpronomen stehen - dann folgt das Nomen erst danach. */
        && (!istIndeklinabel(naechstes)
            || (istInListe(naechstes, ['هذا','هذه','ذلك','تلك']) && woerter[i+2]))
        /* Entweder eine lesbare Endung ohne Tanwin - oder eines der fuenf
           Nomen, deren Endung ein Buchstabe ist und die `endung()` deshalb
           gar nicht sieht. */
        && ((gelesen && !gelesen.tanwin) || istFuenfNomen(wort))
        && !istBestimmt(wort)){
      /* Ein مُضَاف kann selbst im Genitiv stehen: عَلى مَكْتَبِ الْمُدَرِّسِ.
         Die Bedingung \"nicht im Genitiv\" hat genau diese Verkettung
         verworfen (harf-jarr-idafa-01). */
      rolle += ' (مُضَاف)';
      vorherMudaf = true;
    }

    if (erwartet){ letzterKasus = erwartet; letzteBestimmtheit = istBestimmt(wort); }
    /* Nach einem Punkt, Frage- oder Ausrufezeichen faengt ein neuer Satz an:
       in مَا اسْمُكِ؟ اسْمِي آمِنَةُ. ist اسْمِي wieder ein مُبْتَدَأ und nicht der
       خَبَر des vorigen Satzes. Ohne dieses Zuruecksetzen liefen die Rollen
       ueber die Satzgrenze hinweg weiter. */
    if (satzende){
      ersteRolleVergeben = false;
      letzterKasus = null; letzteBestimmtheit = null;
      vorherJarr = false; vorherMudaf = false; nachVerb = false; nachNida = false;
    }
    const stimmt = (erwartet && gelesen && !dualOderPlural) ? (gelesen.kasus === erwartet) : null;
    out.push({ wort, rein, rolle, erwartet, gelesen, stimmt });
  });

  return out;
}

/* Kurzfassung fuer die Anzeige: nur die Woerter, deren Rolle eine Endung
   verlangt, mit arabischem und deutschem Namen des Kasus. */
function irabZeilen(satz){
  return analysiereSatz(satz).map(t => ({
    wort: t.wort,
    rolle: t.rolle,
    kasusAr: t.erwartet ? KASUS[t.erwartet].ar : null,
    kasusDe: t.erwartet ? KASUS[t.erwartet].de : null,
    gelesen: t.gelesen ? t.gelesen.zeichen : null,
    stimmt: t.stimmt
  }));
}

if (typeof module !== 'undefined' && module.exports){
  module.exports = { analysiereSatz, irabZeilen, endung, setzeLexikon, wortart, KASUS,
                     endungUnsichtbar };
}
