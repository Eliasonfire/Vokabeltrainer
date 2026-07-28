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
   - mubtada-khabar-01, nominalsatz-ohne-kopula-01  (beide مَرْفوع)
   - harf-jarr-fi-ala-01, harf-jarr-min-ila-01, harf-jarr-li-01  (danach مَجْرور)
   - idafa-01, idafa-zweitglied-01  (مُضاف ohne Tanwin, مُضاف إِلَيْه مَجْرور)
   - nat-vier-bedingungen-01  (نَعْت folgt dem مَنْعوت in Kasus, Zahl,
     Geschlecht und Bestimmtheit)
   - zuruf-makan-01  (ظَرْف, danach folgt ein مَجْرور wie bei der Idafa) */

const KASUS = {
  raf:  { ar: 'مَرْفوع', de: 'Nominativ' },
  jarr: { ar: 'مَجْرور', de: 'Genitiv'   },
  nasb: { ar: 'مَنْصوب', de: 'Akkusativ' }
};

/* Die fuenf Praepositionen aus Madina 1, in der Reihenfolge des Lehrers. */
const HURUF_JARR = ['في', 'على', 'إلى', 'الى', 'من', 'ل'];
/* Ortsangaben. Der Lehrer nennt sie ظَرْف und sagt ausdruecklich, sie
   funktionierten "wie ein مُضاف" - das folgende Wort steht im Genitiv. */
const ZURUF = ['تحت', 'أمام', 'امام', 'خلف', 'فوق', 'عند', 'بين', 'وراء'];
/* Woerter, die nie eine Kasusendung tragen. */
const INDEKLINABEL = ['هذا','هذه','ذلك','تلك','هو','هي','أنا','انا','أنت','انت',
                      'نحن','هم','ما','من','أين','اين','متى','كيف','هل','نعم','لا','بلى',
                      'و','ف','ثم','هناك','هنا','التي','الذي','الذين',
                      /* Adverbien: stehen immer auf Fatha und bekommen nie eine
                         Endung nach ihrer Satzrolle. */
                      'الآن','الان','اليوم','غدا','جدا','أيضا','ايضا','معا','دائما','أبدا',
                      'لماذا','ماذا','كم','أي','اي'];

const ohneVokale = s => (s || '').replace(/[ً-ْٰـ]/g, '');

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
    const roh = ohneVokale(genau);
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
    [v.sg, v.pl, v.femSg, v.femPl, v.past, v.present, v.imperative, v.masdar]
      .forEach(f => merke(f, v.type, false));
  }
}
/* Steht das Wort als Ganzes im Wortschatz? Dann faengt es nicht mit einer
   angeschriebenen Praeposition an. */
function LEXIKON_hat(w){
  if (!LEXIKON) return false;
  const genau = String(w).replace(/[.،؟!«»:؛]/g, '').trim();
  return LEXIKON.has(genau) || (LEXIKON_ROH && LEXIKON_ROH.has(ohneVokale(genau)));
}

function wortart(w){
  if (!LEXIKON) return null;
  const genau = String(w).replace(/[.،؟!«»:؛]/g, '').trim();
  /* Erst die vollstaendig vokalisierte Form - die ist eindeutig. */
  for (const v of [genau, genau.replace(/^[وف][َُِ]?/, '')]){
    if (LEXIKON.has(v)) return LEXIKON.get(v);
  }
  const roh = ohneVokale(genau);
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
  let vorherMudaf = false;     // das Wort davor war ein مُضاف
  let ersteRolleVergeben = false;
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

    if (istHarfJarr(wort)){
      rolle = 'حَرْف جَرّ';
      vorherJarr = true; vorherMudaf = false;
      out.push({ wort, rein, rolle, erwartet:null, gelesen, stimmt:null });
      return;
    } else if (wortart(wort) === 'verb'){
      /* Verben sind مَبْنِيّ - ihre Endung ist keine Kasusendung und wird
         hier nicht bewertet. Nach einem Verb faengt der Satz strukturell neu
         an, das folgende Wort ist فَاعِل und steht im Nominativ. */
      rolle = 'فِعْل';
      vorherJarr = false; vorherMudaf = false; ersteRolleVergeben = false;
      out.push({ wort, rein, rolle, erwartet:null, gelesen, stimmt:null });
      return;
    } else if (istIndeklinabel(wort)){
      rolle = 'unveränderlich';
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
      /* اسْمُ هَذَا الْوَلَدِ - zwischen مُضاف und مُضاف إِلَيْه kann ein
         Demonstrativpronomen stehen. Es traegt selbst keine Endung, die
         Erwartung an das folgende Nomen bleibt bestehen. */
      rolle = 'unveränderlich (im مُضاف إِلَيْه)';
      out.push({ wort, rein, rolle, erwartet:null, gelesen, stimmt:null });
      return;
    } else if (vorherMudaf){
      rolle = 'مُضاف إِلَيْه';
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
      /* نَعْت: ein Adjektiv direkt hinter seinem مَنْعوت stimmt in Kasus,
         Zahl, Geschlecht UND Bestimmtheit mit ihm ueberein - so unterscheidet
         der Lehrer Wortgruppe von Satz (nat-bestimmtheit-01). Stimmt die
         Bestimmtheit nicht ueberein, ist es kein نَعْت, sondern ein خَبَر. */
      rolle = 'نَعْت (Adjektiv zum Wort davor)';
      erwartet = letzterKasus;
    } else if (/^و[َ]?/.test(wort) && ersteRolleVergeben){
      /* Ein angeschriebenes وَ kann zweierlei sein, und am Schriftbild ist
         nicht zu entscheiden was:
           فِي الْبَيْتِ وَالْمَسْجِدِ    -> Anschluss, Genitiv wie davor
           … أَمَامَ الْمَسْجِدِ وَبَيْتُ … -> neuer Satzteil, Nominativ
         Beides waere hier zu begruenden, also wird keine Endung behauptet.
         Das Wort steht trotzdem in der Liste, damit die Zerlegung vollstaendig
         bleibt. */
      rolle = 'Anschluss mit وَ (Kasus nicht eindeutig)';
      /* Kein vorzeitiges Ende: das Wort kann trotzdem ein مُضاف sein
         (وَبَيْتُ الطَّبِيبِ), und dann haengt die Endung des naechsten
         Wortes daran. */
    } else if (!ersteRolleVergeben){
      rolle = 'مُبْتَدَأ';
      erwartet = 'raf';
      ersteRolleVergeben = true;
    } else {
      rolle = 'خَبَر';
      erwartet = 'raf';
    }

    /* مُضاف erkennen: ein bestimmtes oder endungsloses Nomen ohne Tanwin,
       auf das direkt ein weiteres Nomen folgt (idafa-erkennen-01). Nur wenn
       das naechste Wort kein Satzzeichen beendet und keine Praeposition ist. */
    const naechstes = woerter[i+1];
    if (rolle !== 'unveränderlich' && !hatSuffix(wort)
        && !satzende && naechstes && !istHarfJarr(naechstes)
        /* اسْمُ هَذَا الْوَلَدِ: zwischen مُضاف und مُضاف إِلَيْه darf ein
           Demonstrativpronomen stehen - dann folgt das Nomen erst danach. */
        && (!istIndeklinabel(naechstes)
            || (istInListe(naechstes, ['هذا','هذه','ذلك','تلك']) && woerter[i+2]))
        && gelesen && !gelesen.tanwin && !istBestimmt(wort)){
      /* Ein مُضاف kann selbst im Genitiv stehen: عَلى مَكْتَبِ الْمُدَرِّسِ.
         Die Bedingung \"nicht im Genitiv\" hat genau diese Verkettung
         verworfen (harf-jarr-idafa-01). */
      rolle += ' (مُضاف)';
      vorherMudaf = true;
    }

    if (erwartet){ letzterKasus = erwartet; letzteBestimmtheit = istBestimmt(wort); }
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
  module.exports = { analysiereSatz, irabZeilen, endung, setzeLexikon, wortart, KASUS };
}
