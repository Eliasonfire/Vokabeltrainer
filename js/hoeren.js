/* hoeren.js -- Hoerverstehen: das Wort nur hoeren, dann die Bedeutung waehlen
   Teil der App-Logik; wird in index.html in fester Reihenfolge geladen und
   teilt sich mit den uebrigen js/-Dateien den globalen Namensraum.

   Warum ein eigener Modus: im Lernmodus steht das arabische Wort immer da.
   Wer es liest, uebt Lesen - nicht Hoeren. Hier ist die Schrift bis zur
   Antwort weg, es gibt nur den Ton.

   Die Ablenker sind nicht beliebig gewuerfelt. Seit dem 11.09.2026 kommen
   zuerst Woerter, die sich AEHNLICH ANHOEREN ODER AEHNLICH SCHREIBEN (Block
   „AEHNLICHE ABLENKER" weiter unten), danach wie vorher bevorzugt Woerter aus
   demselben Kapitel und mit derselben Wortart. Alle stammen aus seinem
   Lernbestand — ein Ablenker aus einem Buch, das er nie geoeffnet hat, macht
   die Aufgabe nur scheinbar schwerer.

   Der Fortschritt aus dem Leitner-System wird hier NICHT angefasst: Hoeren
   und Lesen sind verschiedene Faehigkeiten, und eine falsche Hoerantwort
   soll eine sicher gelesene Vokabel nicht zurueckwerfen. Der Modus zaehlt
   nur seine eigene Runde. */

const HOER = { wort: null, optionen: [], beantwortet: false, richtig: 0, gesamt: 0, fertig: false,
  /* ⭐ `zielOffen`: das Tagesziel ist erreicht, aber noch nicht gefeiert —
     siehe hoerZielPruefen(). Nur im Geh-Modus moeglich. */
  zielOffen: false,
  /* ⭐ Q8: bis wann das Weitertippen nach einer falschen Antwort wartet. */
  sperreBis: 0 };

/* ⭐ Fuenf Antworten statt vier (Elias, 11.09.2026: „beim Hörverstehen sollen
   5 Auswahl Möglichkeiten sein"). Die Zahl steht an EINER Stelle — die
   Vorratspruefung, die Ablenkerzahl und die Leermeldung lesen sie alle.
   ⚠️ Hier oben und nicht beim Block der Ablenker: `hoerbareVokabeln()` steht
   davor und liest sie ebenfalls. */
const HOER_ANTWORTEN = 5;

/* ---------- Tagesziel (Elias, 17.08.2026) ----------

   "es sollte beim hören auch ein tagesziel geben wie auch bei den wurzeln oder
   auch bei den karteikarten. einfach so ein paar machen ums tagesziel zu machen
   und es reicht. aktuell sieht es aus als gäbe es da kein ende."

   Er hatte recht: `naechsteHoerfrage()` rief sich schlicht immer weiter auf, es
   gab keinen Punkt, an dem man fertig war.

   ⭐ TAG, nicht Runde - und das ist der Unterschied zu den Karteikarten, wo
   beides existiert (20 Karten = Runde, leerer Vorrat = Tagesziel). Hier gibt es
   keinen "Vorrat", der leer werden koennte: die Fragen werden aus dem ganzen
   Wortschatz gewuerfelt und gingen nie aus. Deshalb ist die Zahl selbst das
   Ziel.

   ⚠️ Nach dem Ziel wird NICHT gesperrt. "es reicht" heisst: er soll wissen,
   wann genug ist - nicht, dass ihm die Uebung weggenommen wird. Der Zaehler
   laeuft weiter ("12 von 10"), der Zustand sieht nur deutlich anders aus.

   ⭐ Seit dem 08.09.2026 EINSTELLBAR (Einstellungen → "Wörter hören pro Tag").
   Elias: "ich will auch einstellen, was mein tagesziel beim hörmodus ist in den
   einstellungen und ich will erstmal nur 5 wörter machen als tagesziel."
   Die feste 10 war ein Jahr lang eine geratene Zahl; die neue Vorgabe ist 5,
   und der Grund dafuer steht bei den SETTINGS-Vorgaben in js/kern.js.

   ⛔ Die Zahl NICHT in einer Konstanten zwischenspeichern. Sie kann sich
   aendern, waehrend der Hoermodus offen ist - eine `const` am Dateianfang
   haette den alten Wert bis zum Neuladen festgehalten. */
const HOER_ZIEL_VORGABE = 5;
function hoerTagesziel(){
  const n = (typeof SETTINGS === 'object' && SETTINGS) ? Number(SETTINGS.hoerZiel) : NaN;
  return (Number.isFinite(n) && n >= 1) ? n : HOER_ZIEL_VORGABE;
}

function hoerTag(){
  const heute = todayStr(0);
  let t = LS.get('vt_hoerTag', null);
  if (!t || t.tag !== heute) t = { tag: heute, gesamt: 0, richtig: 0 };
  return t;
}
function hoerTagSpeichern(t){ LS.set('vt_hoerTag', t); }

/* ⭐⭐ EIN Weg zum Tagesziel, nicht zwei (08.09.2026)

   Elias: „wie wäre es wenn ich mein tagesziel beim hören und gemischte sätze
   (13 aufgaben) beendet habe das danach auch irgendwie konfetti kommt."

   Es GAB das Konfetti schon — 'hoer-tagesziel' steht seit v156 in js/feier.js.
   Nur kam es beim Laufen nie an: `vt_hoerTag.gesamt` waechst an ZWEI Stellen,
   beim Antworten und im Geh-Modus (gehSchleife), und die Feier hing nur an
   der ersten.

   ⛔ Und schlimmer als „einmal verpasst": die Schwelle war danach VERBRANNT.
   Die alte Bedingung fragte den UEBERGANG (`vorher < ziel && gesamt >= ziel`).
   Hatte der Geh-Modus `gesamt` schon ueber das Ziel geschoben, traf sie beim
   naechsten echten Antworten nicht mehr zu — der ganze Tag blieb ohne Feier,
   ohne dass irgendwo etwas meldet. [[ausfall_ist_unsichtbar_gebaut]]

   Deshalb fragt sie jetzt den ZUSTAND statt den Uebergang, steht an EINER
   Stelle und wird von jedem Weg aufgerufen. Dass daraus trotzdem genau eine
   Feier je Tag wird, macht der `einmalig`-Riegel in js/feier.js — die
   Buchfuehrung bleibt dort, wo sie ohnehin schon lag.
   [[endpunkt_der_zuerst_steht]] */
function hoerZielPruefen(){
  const t = hoerTag();
  if (t.gesamt < hoerTagesziel()) return;
  /* ⛔ Im Geh-Modus sieht niemand hin — er laeuft, das Handy steckt in der
     Tasche. Konfetti dort abzufeuern hiesse, den Anlass zu verbrennen, denn
     `einmalig` laesst ihn heute kein zweites Mal zu. Also vormerken und
     nachholen, sobald er wieder auf den Bildschirm schaut: beim Ausschalten
     des Geh-Modus oder beim naechsten Betreten des Hoermodus. Die ANSAGE
     uebernimmt gehSchleife(), die einzige Stelle, die sprechen kann. */
  if (typeof GEH === 'object' && GEH && GEH.an){ HOER.zielOffen = true; return; }
  /* ⛔⛔ UND: nur feiern, wenn er auch hinsieht (09.09.2026).
     Elias: „habe eben 5 wörter angehört und konfeti kam erst bei startseite,
     das soll aber doch kommen beim hörmodus".

     ⭐ Die Kette, nachgelesen statt geraten: Er hört im Geh-Modus, das Ziel
     fällt → oben wird vorgemerkt. Dann drückt er zurück. `zeigeBildschirm()`
     wechselt ZUERST den Bildschirm und schaltet ERST DANACH den Geh-Modus ab
     (js/navigation.js) — `gehModusSetzen(false)` holt die Feier nach, und die
     landet auf der Startseite. Der Aufschub war richtig, nur sein Endpunkt
     lag falsch. [[endpunkt_der_zuerst_steht]]

     ⭐ Diese eine Bedingung deckt ALLE Wege ab, nicht nur den Rückweg: auch
     der Pause-Knopf auf dem Sperrbildschirm ruft gehModusSetzen(false), und
     zwar während das Handy in der Tasche steckt. Konfetti dort verbrennt den
     `einmalig`-Riegel für den ganzen Tag.
     [[bedingung_wird_durch_die_handlung_ungueltig]]

     ⚠️ Verloren geht nichts: `openHoeren()` ruft hoerZielPruefen() bei jedem
     Betreten erneut, und der Riegel liegt in localStorage — die Feier wartet
     also auch über einen Neustart hinweg. */
  const sichtbar = document.visibilityState !== 'hidden'
    && !!document.getElementById('screen-hoeren')
    && document.getElementById('screen-hoeren').classList.contains('active');
  if (!sichtbar){ HOER.zielOffen = true; return; }
  HOER.zielOffen = false;
  if (typeof feiere === 'function') feiere('hoer-tagesziel', { zahl: t.gesamt, richtig: t.richtig });
  /* ⭐ Und danach: war das der dritte von drei? Ausserhalb des `einmalig`-
     Riegels oben, weil der Tag auch komplett werden kann, NACHDEM das
     Hoerziel laengst gefeiert wurde. */
  if (typeof tagKomplettPruefen === 'function') tagKomplettPruefen();
}

/* Die Standzeile fuehrt das Tagesziel mit - vorher stand dort nur "x von y
   richtig", also die Trefferquote der laufenden Sitzung. Die sagt nichts
   darueber, wie weit man ist. */
function hoerStandSchreiben(){
  const t = hoerTag();
  const ziel = hoerTagesziel();
  const geschafft = t.gesamt >= ziel;
  /* ⛔ Die Quote laeuft ueber `beantwortet`, nicht ueber `gesamt` — seit dem
     Geh-Modus (08.09.2026) sind das zwei verschiedene Zahlen: dort waechst
     `gesamt`, aber niemand tippt eine Antwort an. Stuende hier weiter `gesamt`,
     sagte die Zeile nach zehn gelaufenen Woertern „3 richtig" und meinte
     3 von 3 — sie saehe aber aus wie 3 von 10.
     ⚠️ `?? t.gesamt` fuer alte Staende, die das Feld noch nicht haben; ein
     `||` waere hier falsch, weil eine echte 0 sonst auf `gesamt` zurueckfiele.
     [[vorgabewert_greift_nicht_bei_null]] */
  const beantwortet = (t.beantwortet ?? t.gesamt);
  const quote = beantwortet ? ` · ${t.richtig} von ${beantwortet} richtig` : '';
  document.getElementById('hoerStand').textContent = geschafft
    ? `Tagesziel geschafft — ${t.gesamt} Wörter${quote}`
    : `Tagesziel ${t.gesamt} von ${ziel}${quote}`;
}

/* Nur Vokabeln mit brauchbarer deutscher Bedeutung - ohne die gaebe es keine
   Antwortmoeglichkeiten. */
function hoerbareVokabeln(){
  /* ⚠️ `bekannteVokabeln()` und nicht `buchVokabeln()` — seit dem 17.08.2026.
     Elias: "sind beim hörmodus wirklich mit allen wörtern die ich aktuell
     lerne? es wäre wichtig das er alle hat aber auch immer mehr unlockt mit den
     kapiteln die ich dann auch kann. halt nur das was ich bereits weiß."

     Gemessen war der Vorrat **311** Wörter, davon **140 ausserhalb seines
     Lernbestands** — allein Kapitel 24 steuerte 67 bei, Kapitel 12–23 weitere.
     Der Modus fragte also Wörter ab, die er nie gesehen hat, und zwar sowohl
     als Frage wie als Ablenker. Beim Hören ist das schlimmer als beim Lesen:
     man kann nicht einmal raten, wenn man das Wort nie gehört hat.

     `bekannteVokabeln()` (js/kern.js) ist genau die gesuchte Menge und waechst
     von selbst mit: freigeschaltete Kapitel des jeweiligen Buchs + eigene
     Wörter + der handverlesene Lernbestand aus vocab-data.js. */
  let pool = bekannteVokabeln().filter(w => w.ar && w.de && String(w.de).trim().length > 1);
  /* Die Kapitelauswahl von der Startseite gilt auch hier - sonst uebt man das
     halbe Buch, obwohl oben "Kapitel 3" eingestellt ist. Nur wenn dabei zu
     wenig uebrig bleibt, um alle Antworten zu bilden, wird sie ignoriert;
     eine leere Karte waere unbrauchbarer als ein Ablenker aus Kapitel 4. */
  /* ⚠️ Seit dem 11.08.2026 je Buch: ein Wort zaehlt, wenn SEIN Buch keine
     Kapitel eingeengt hat oder sein Kapitel darin steht. Eine gemeinsame Liste
     waere hier falsch - Kapitel 3 aus Madina 1 wuerde sonst Kapitel 3 aus
     Bayna Yadayk freischalten. */
  if (typeof irgendwoEingeengt === 'function' && irgendwoEingeengt()){
    const eng = pool.filter(w => {
      if (w.chapter === 'personal') return true;
      if (w.book === 'grammar')     return true;   /* Fachbegriffe: kein Lehrwerk. ⛔ `book`, nicht `chapter` — seit dem 20.08.2026 sind sie chapter 'personal'. */
      const sel = kapitelAuswahl(w.book);
      return !sel.length || sel.indexOf(w.chapter) >= 0;
    });
    if (eng.length >= HOER_ANTWORTEN) pool = eng;
  }
  return pool;
}

/* ===== AEHNLICHE ABLENKER — Anfang =====
   ⛔ Diese Markierung und die am Ende NICHT entfernen: werkzeuge/pruefe-hoerablenker.mjs
   schneidet genau diesen Block heraus und misst ihn an den echten Vokabeln.

   Elias am 11.09.2026, unterwegs in einer Claude-Sitzung im Web: „Also beim
   Hörverstehen sollen 5 Auswahl Möglichkeiten sein und es soll schwerer
   gemacht werden und zwar in den man ähnliche Wörter die die sich entweder
   ähnlich anhören oder ähnlich geschrieben werden beim vokabeltrainer"

   ⭐ ZWEI BILDER JE WORT — beide ohne Ḥarakāt, ohne Artikel und ohne ة am Ende:
   - LAUTBILD: was ein deutsches Ohr leicht verwechselt, faellt zusammen —
     die s-Laute, die z-Laute, t/ṭ, d/ḍ, k/q, h/ḥ, Hamza/ʿAin, ḫ/ġ.
   - SCHRIFTBILD: was sich nur durch Punkte unterscheidet, faellt zusammen —
     am Wortende aber NICHT ن und ي, die dort eine eigene Form haben (sonst
     gaelte „jetzt" als Schriftzwilling von „Vater").
   Aehnlichkeit = 1 − Editierabstand / Laenge, der hoehere der beiden Werte.

   ⚠️ Die Vokale zaehlen bewusst NICHT mit: „Mann" und „Bein" (رجل) sind
   genau das Paar, das man hoerend auseinanderhalten soll.

   ⛔ NIE ALS ABLENKER: dasselbe Wort mit Artikel oder anderer Endung („Tag" /
   „heute", „Name" / „Nomen") und eine gleiche Bedeutung („groß (lang)" /
   „groß") — sonst stehen zwei richtige Antworten auf der Karte. Die alte
   Auswahl verglich nur den ganzen deutschen Text; gemessen vor dem Umbau
   (Lernbestand, 171 Woerter, je Wort 20 Karten, drei Laeufe) setzte sie 10,
   13 und 19 Mal zwei gleichwertige Antworten nebeneinander.
   ⚠️ Zusaetze in Klammern trennen dagegen: „du (m.)" und „du (w.)" sind zwei
   verschiedene Antworten und ein gutes Hoerpaar. */

/* Ḥarakāt, Tanwīn, Šadda, Sukūn, Quranzeichen und Tatwīl — dieselben Bereiche
   wie SUCH_ZEICHEN in js/kategorien.js, dazu U+0640. ⛔ Als \u-Folgen, nie als
   sichtbare Zeichen: eine kopierte Klasse sieht gleich aus und trifft anderes. */
const HOER_TASCHKIL = /[ؐ-ًؚ-ٰٟۖ-ࣰۭ-ࣳـ]/g;

/* Je Gruppe steht der erste Buchstabe fuer alle. ⛔ Nur Codepunkte aus dem
   arabischen Grundblock U+0621–U+064A und U+0671 — ein persisches ی oder ک
   saehe gleich aus und traefe kein einziges Wort; der Pruefer eicht jede
   Gruppe an Buchstaben aus echten Vokabeln. */
const HOER_LAUTGRUPPEN = [
  'سصث',                          /* s-Laute:  sīn ṣād ṯāʾ */
  'زذظ',                          /* z-Laute:  zāy ḏāl ẓāʾ */
  'تطة',                          /* t-Laute:  tāʾ ṭāʾ tāʾ marbūṭa */
  'دض',                                /* dāl ḍād */
  'كق',                                /* kāf qāf */
  'هح',                                /* hāʾ ḥāʾ */
  'ءأإآؤئع',  /* Hamza in allen Formen, ʿAin */
  'خغ',                                /* ḫāʾ ġain */
  'يى',                                /* yāʾ, alif maqṣūra */
];
const HOER_SCHRIFTGRUPPEN = [
  'بتثنيىئ',  /* der Zahn: bāʾ tāʾ ṯāʾ nūn yāʾ */
  'جحخ',                          /* ǧīm ḥāʾ ḫāʾ */
  'دذ',                                /* dāl ḏāl */
  'رز',                                /* rāʾ zāy */
  'سش',                                /* sīn šīn */
  'صض',                                /* ṣād ḍād */
  'طظ',                                /* ṭāʾ ẓāʾ */
  'عغ',                                /* ʿain ġain */
  'فق',                                /* fāʾ qāf */
  'هة',                                /* hāʾ tāʾ marbūṭa */
  'اأإآٱ',              /* Alif in allen Formen */
  'وؤ',                                /* wāw */
];
function hoerKarte(gruppen){
  const karte = {};
  for (const g of gruppen) for (const z of g) karte[z] = g[0];
  return karte;
}
const HOER_LAUTKARTE = hoerKarte(HOER_LAUTGRUPPEN);
const HOER_SCHRIFTKARTE = hoerKarte(HOER_SCHRIFTGRUPPEN);

/* ⭐ Die Schwelle, gemessen am 11.09.2026 an seinen Woertern: 0,65 heisst bei
   drei bis vier Buchstaben hoechstens ein Unterschied, ab sechs hoechstens
   zwei. Das Band darunter (0,5 bis 0,6) war beim Durchsehen ueberwiegend
   Zufall — „Student" / „Hund", „alt" / „Stadt". */
const HOER_AEHNLICH = 0.65;
/* Aus wie vielen der naechstbesten gemischt wird — damit eine Karte nicht
   jedes Mal gleich aussieht und man sie am Ende wiedererkennt statt hinhoert. */
const HOER_BAND = 6;

/* Grundbuchstaben ohne Vokalzeichen; der Artikel ال faellt weg, weil er sonst
   jedes bestimmte Wort jedem anderen aehnlich machte. */
function hoerGeruest(text){
  let s = String(text || '').normalize('NFC')
    .replace(HOER_TASCHKIL, '')
    .replace(/[^ء-يٱ]/g, '');
  if (/^[اٱ]ل/.test(s) && s.length >= 4) s = s.slice(2);
  return s;
}

/* Das Wort ohne Artikel und ohne Endung, MIT seinen Vokalen — daran erkennt
   man dasselbe Wort in zwei Eintraegen („Tag" / „heute"), ohne die
   verschiedenen Woerter „Mann" / „Bein" zusammenzuwerfen. */
function hoerWortkern(text){
  let s = String(text || '').normalize('NFC').replace(/ـ/g, '').replace(/\s+/g, ' ').trim()
    .replace(/[آأإٱ]/g, 'ا');
  const artikel = s.match(/^الْ?/);
  if (artikel && s.length > artikel[0].length + 1){
    /* ⚠️ Beim Sonnenbuchstaben traegt der erste Buchstabe danach eine Šadda,
       die das Wort ohne Artikel nicht hat. */
    s = s.slice(artikel[0].length).replace(/^([^ً-ْ])([ً-ِْ]*)ّ/, '$1$2');
  }
  /* Endung weg; eine Šadda am letzten Buchstaben gehoert zum Wort und bleibt. */
  return s.replace(/[ً-ْ]+$/, m => (m.includes('ّ') ? 'ّ' : ''));
}

/* Die Bedeutungen einzeln, je mit ihrem Klammerzusatz. */
function hoerBedeutungen(w){
  return [w.de, w.deNeben].filter(Boolean).join('/')
    .toLowerCase()
    .split(/[\/;,]/)
    .map(t => ({
      kern: t.replace(/\([^)]*\)/g, ' ')
        .replace(/[.!?„“”"']/g, '')
        .replace(/^\s*(der|die|das|ein|eine|einen)\s+/, '')
        .replace(/\s+/g, ' ').trim(),
      zusatz: (t.match(/\([^)]*\)/g) || []).join(' ').replace(/[()]/g, '').replace(/\s+/g, ' ').trim(),
    }))
    .filter(b => b.kern);
}

/* ⚠️ Zwischengespeichert je Wortobjekt — jede Frage vergleicht das gefragte
   Wort mit dem ganzen Vorrat. Die vier Texte werden mitgemerkt und bei jedem
   Zugriff verglichen, damit ein bearbeitetes eigenes Wort nicht mit seiner
   alten Fassung weiterlaeuft. */
const HOER_MERKMALE = new WeakMap();
function hoerMerkmale(w){
  const alt = HOER_MERKMALE.get(w);
  if (alt && alt.ar === w.ar && alt.sg === w.sg && alt.de === w.de && alt.deNeben === w.deNeben) return alt;
  const text = sprechText(w);
  const voll = hoerGeruest(text);
  const g = voll.replace(/ة$/, '');
  let laut = Array.from(g, z => HOER_LAUTKARTE[z] || z).join('');
  /* Ein Alif am Wortanfang wird mit einem Stimmeinsatz gesprochen — fuer das
     Ohr dasselbe wie ein Hamza. */
  if (laut[0] === 'ا' || laut[0] === 'ٱ') laut = 'ء' + laut.slice(1);
  const letzter = g.length - 1;
  const schrift = Array.from(g, (z, i) => {
    if (i === letzter && z === 'ن') return 'ن';
    if (i === letzter && (z === 'ي' || z === 'ى' || z === 'ئ')) return 'ى';
    return HOER_SCHRIFTKARTE[z] || z;
  }).join('');
  const neu = { ar: w.ar, sg: w.sg, de: w.de, deNeben: w.deNeben, laut, schrift, laenge: voll.length,
    kern: hoerWortkern(text), bedeutungen: hoerBedeutungen(w) };
  HOER_MERKMALE.set(w, neu);
  return neu;
}

/* Editierabstand mit zwei wiederverwendeten Zeilen — er laeuft je Frage einmal
   gegen jedes Wort des Vorrats, neue Arrays je Aufruf waeren reiner Muell. */
let HOER_ZEILE_VORHER = new Int32Array(64), HOER_ZEILE_JETZT = new Int32Array(64);
function hoerAbstand(a, b){
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  if (b.length + 1 > HOER_ZEILE_VORHER.length){
    HOER_ZEILE_VORHER = new Int32Array(b.length + 1);
    HOER_ZEILE_JETZT = new Int32Array(b.length + 1);
  }
  let vorher = HOER_ZEILE_VORHER, jetzt = HOER_ZEILE_JETZT;
  for (let j = 0; j <= b.length; j++) vorher[j] = j;
  for (let i = 1; i <= a.length; i++){
    jetzt[0] = i;
    for (let j = 1; j <= b.length; j++){
      jetzt[j] = Math.min(vorher[j] + 1, jetzt[j - 1] + 1,
        vorher[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    [vorher, jetzt] = [jetzt, vorher];
  }
  return vorher[b.length];
}
function hoerMass(a, b){
  const n = Math.max(a.length, b.length);
  return n ? 1 - hoerAbstand(a, b) / n : 0;
}

function hoerAehnlichkeit(ziel, w){
  const a = hoerMerkmale(ziel), b = hoerMerkmale(w);
  const laut = hoerMass(a.laut, b.laut);
  const schrift = hoerMass(a.schrift, b.schrift);
  const wert = Math.max(laut, schrift);
  /* ⚠️ Unter drei Buchstaben nur bei vollem Gleichklang: bei zwei Buchstaben
     waere sonst jedes Wort aehnlich, das einen davon teilt. */
  const kurz = Math.min(a.laenge, b.laenge) < 3;
  return { wert, laut, schrift, aehnlich: wert >= HOER_AEHNLICH && (!kurz || wert === 1) };
}

function hoerGleicheBedeutung(a, b){
  const liste = hoerMerkmale(b).bedeutungen;
  for (const x of hoerMerkmale(a).bedeutungen) for (const y of liste){
    if (x.kern !== y.kern) continue;
    if (!x.zusatz || !y.zusatz || x.zusatz === y.zusatz) return true;
  }
  return false;
}

function hoerTaugtAlsAblenker(ziel, w){
  return w.id !== ziel.id
    && hoerMerkmale(w).kern !== hoerMerkmale(ziel).kern
    && !hoerGleicheBedeutung(ziel, w);
}

function waehleAblenker(ziel, pool, anzahl){
  /* Gemischt VOR dem Sortieren: die Sortierung ist stabil, Gleichstaende
     bleiben also zufaellig verteilt. Bei gleichem Wert zuerst das Hoerpaar. */
  const kandidaten = shuffle(pool.filter(w => hoerTaugtAlsAblenker(ziel, w)))
    .map(w => ({ w, ...hoerAehnlichkeit(ziel, w) }))
    .sort((a, b) => (b.wert - a.wert) || (b.laut - a.laut));
  const raus = [];
  const nimm = x => {
    if (raus.length >= anzahl || raus.includes(x.w)) return;
    /* Auch untereinander keine zwei gleichwertigen Antworten. */
    if (raus.some(r => !hoerTaugtAlsAblenker(r, x.w))) return;
    raus.push(x.w);
  };

  /* 1. Der aehnlichste kommt immer mit — genau dieses Paar soll er
     auseinanderhalten lernen. */
  const aehnlich = kandidaten.filter(x => x.aehnlich);
  if (aehnlich.length) nimm(aehnlich[0]);
  /* 2. Dazu hoechstens zwei weitere aus den naechstbesten, gemischt. Ein
     Platz bleibt frei: waeren alle vier Ablenker fest, saehe die Karte zu
     diesem Wort jedes Mal gleich aus. */
  for (const x of shuffle(aehnlich.slice(1, 1 + HOER_BAND))){
    if (raus.length >= Math.max(1, anzahl - 1)) break;
    nimm(x);
  }
  /* 3. Der Rest wie bisher — erst Kapitel und Wortart, dann Kapitel, dann
     alles, innerhalb jeder Stufe die aehnlicheren zuerst. Gezogen wird aus
     einem Fenster, das immer etwas groesser ist als noetig: sonst liefert ein
     Kapitel mit genau vier passenden Woertern jedes Mal dieselben vier
     (gemessen vorher: 8 von 171 Woertern mit immer gleichem Satz, jetzt 0). */
  const stufen = [
    x => x.w.chapter === ziel.chapter && x.w.type === ziel.type,
    x => x.w.chapter === ziel.chapter,
    () => true,
  ];
  const rest = [];
  const eingereiht = new Set();
  for (const passt of stufen) for (const x of kandidaten){
    if (passt(x) && !eingereiht.has(x)){ eingereiht.add(x); rest.push(x); }
  }
  while (raus.length < anzahl && rest.length){
    const fenster = Math.min(rest.length, Math.max(HOER_BAND, anzahl - raus.length + 2));
    const [x] = rest.splice(Math.floor(Math.random() * fenster), 1);
    nimm(x);
  }
  return raus;
}
/* ===== AEHNLICHE ABLENKER — Ende ===== */

function naechsteHoerfrage(){
  const pool = hoerbareVokabeln();
  const leer = document.getElementById('hoerLeer');
  const karte = document.getElementById('hoerKarte');
  /* Der „Kenne ich schon"-Knopf gehoert zum GERADE GELOESTEN Wort. Er wird
     deshalb bei jeder neuen Frage weggeschaltet, auch im Leer-Fall - sonst
     zeigte er auf das Wort davor und wuerde das Falsche ausblenden. */
  document.getElementById('hoerKenneSchonZeile').classList.add('hidden');
  if (pool.length < HOER_ANTWORTEN){
    karte.classList.add('hidden');
    leer.classList.remove('hidden');
    /* Alle gewaehlten Buecher nennen, nicht nur das erste - sonst sucht man in
       einem Buch nach der Ursache, waehrend die Auswahl aus dreien besteht. */
    const namen = (typeof aktiveBuecher === 'function' ? aktiveBuecher() : [aktivesBuch()])
      .map(buchTitel).join(', ');
    leer.textContent = `In ${namen} stehen zu wenige Vokabeln mit Bedeutung `
      + `(${pool.length}), um ${HOER_ANTWORTEN} Antworten anzubieten. Waehle oben auf der Startseite mehr aus.`;
    return;
  }
  karte.classList.remove('hidden');
  leer.classList.add('hidden');

  /* „Kenne ich schon" gilt auch hier - aber nur fuer die FRAGE, nicht fuer die
     Ablenker. Ein Wort, das Elias sicher kann, ist als falsche Antwort sogar
     besonders brauchbar: er erkennt es und schliesst es aus. Wuerde man es aus
     dem ganzen Pool nehmen, verloere der Modus die besten Ablenker und
     schrumpfte womoeglich unter die noetigen Antworten. */
  const fragbar = pool.filter(w => !(typeof kennErSchon === 'function' && kennErSchon(w)));
  HOER.wort = shuffle(fragbar.length ? fragbar : pool)[0];
  HOER.optionen = shuffle([HOER.wort, ...waehleAblenker(HOER.wort, pool, HOER_ANTWORTEN - 1)]);
  HOER.beantwortet = false;
  HOER.fertig = false;
  HOER.sperreBis = 0;

  hoerStandSchreiben();
  document.getElementById('hoerHinweis').textContent = 'Was bedeutet das Wort?';
  document.getElementById('hoerLoesung').classList.add('hidden');
  document.getElementById('hoerOptionen').innerHTML = HOER.optionen.map((w, i)=>
    `<button class="hoer-option" data-hoerwahl="${i}">${escapeHtml(w.de)}</button>`).join('');
  /* ⚠️ Seit es fuenf Antworten sind (11.09.2026): bei den laengsten Bedeutungen
     — den Fachbegriffen — lag die fuenfte gemessen 23 px UNTER der unteren
     Leiste, in 3 von 300 Fragen (Browser 375×812, Vorrat 215 Woerter). Nichts
     deutete darauf hin, dass da noch eine Antwort steht. freiRollen() rollt
     nur, wenn wirklich etwas verdeckt ist. */
  freiRollen(document.getElementById('hoerOptionen'));

  hoerAbspielen();
}

function hoerAbspielen(){
  if (!HOER.wort) return;
  const knopf = document.getElementById('btnHoerPlay');
  knopf.classList.add('spielt');
  setTimeout(()=>knopf.classList.remove('spielt'), 600);
  /* Die Vollform mit Endung sprechen, nicht die nackte Schreibweise - so
     hoert Elias das Wort, wie es im Satz klingt. */
  speakArabic(sprechText(HOER.wort));
}

function beantworteHoerfrage(i){
  if (HOER.beantwortet) return;
  HOER.beantwortet = true;
  HOER.gesamt++;
  const gewaehlt = HOER.optionen[i];
  const richtig = gewaehlt.id === HOER.wort.id;
  if (richtig) HOER.richtig++;

  document.querySelectorAll('#hoerOptionen .hoer-option').forEach((b, j)=>{
    b.disabled = true;
    if (HOER.optionen[j].id === HOER.wort.id) b.classList.add('richtig');
    else if (j === i) b.classList.add('falsch');
  });

  const w = HOER.wort;
  const l = document.getElementById('hoerLoesung');
  l.innerHTML = `<div class="hl-ar" lang="ar" dir="rtl">${escapeHtml(w.sg || w.ar)}</div>`
    /* ⚠️ Die Wurzel stand hier bis zum 30.07.2026 dahinter. Elias: "bei dem
       hoerverstehen sollen die wurzeln weg, da soll einfach nur die uebersetzung
       stehen." Dieselbe Entscheidung wie bei den Wortfeldern, wo er den
       Wurzel-Reiter abgewaehlt hat: "3 random arabische Buchstaben machen fuer
       mich als Wortstamm keinen Sinn." Die Wurzel bleibt in den Daten. */
    + `<div class="hl-de">${escapeHtml(w.de)}</div>`;
  l.classList.remove('hidden');
  zeichneHoerKenneSchon();

  /* Tageszaehler fortschreiben, BEVOR die Standzeile neu geschrieben wird -
     sonst zeigt sie den Stand von vor dieser Antwort. */
  const t = hoerTag();
  const vorher = t.gesamt;
  t.gesamt++;
  /* ⭐ Der Zaehler der WIRKLICH beantworteten Fragen (08.09.2026). Er trennt
     sich hier von `gesamt`, weil der Geh-Modus mitzaehlt, ohne dass jemand
     antwortet — siehe hoerStandSchreiben(). */
  t.beantwortet = (t.beantwortet ?? 0) + 1;
  if (richtig) t.richtig++;
  hoerTagSpeichern(t);
  hoerStandSchreiben();

  /* ⭐ Die Trefferquote je TAG (07.09.2026). Der Hoermodus zaehlt mit, weil
     „richtig" hier objektiv feststeht — anders als bei den vier
     Bewertungsstufen der Karteikarte, wo Elias selbst einschaetzt. Die
     Begruendung steht bei `merkeQuote()` in js/kern.js. */
  /* ⭐ Q3 (08.09.2026): und je WORT. Der Hoermodus ist neben der Karteikarte
     die zweite Stelle, an der eine Antwort eindeutig EINEM Wort gehoert. */
  if (typeof merkeQuote === 'function') merkeQuote(richtig, undefined, w && w.id);

  const ziel = hoerTagesziel();
  const zielJetztErreicht = vorher < ziel && t.gesamt >= ziel;
  if (zielJetztErreicht){
    HOER.fertig = true;
    document.getElementById('hoerHinweis').textContent =
      'Tagesziel geschafft — tippe, wenn du trotzdem weitermachen willst.';
  } else {
    document.getElementById('hoerHinweis').textContent = richtig
      ? 'Richtig — tippe für das nächste Wort.'
      : 'Nicht ganz — sieh dir die Lösung an.';
  }
  /* ⭐⭐ Q8 (08.09.2026): nach einer FALSCHEN Antwort zwei Sekunden Sperre.
     Hier gibt es keinen Knopf, sondern einen Tipp auf die Karte — gesperrt
     wird deshalb die Zeit, nicht ein Element. Die Loesung steht trotzdem
     sofort da; nur das Weitertippen wartet.
     Begruendung und Zahl bei `Q8_SPERRE_MS` in js/kern.js. */
  HOER.sperreBis = richtig ? 0
    : Date.now() + (typeof Q8_SPERRE_MS === 'number' ? Q8_SPERRE_MS : 2500);
  if (!richtig) setTimeout(() => {
    /* Nur wenn immer noch dieselbe Frage steht — sonst ueberschreibt die
       Meldung den Hinweis der naechsten. */
    if (HOER.beantwortet && Date.now() >= HOER.sperreBis)
      document.getElementById('hoerHinweis').textContent = 'Tippe für das nächste Wort.';
  }, (typeof Q8_SPERRE_MS === 'number' ? Q8_SPERRE_MS : 2500) + 30);

  /* ⭐ AUSSERHALB des Uebergangs, und deshalb auch dann, wenn das Ziel schon
     im Geh-Modus gefallen ist: hier wird die aufgeschobene Feier nachgeholt.
     Ein zweites Mal am selben Tag passiert dabei nichts — `einmalig`. */
  hoerZielPruefen();

  /* Nach der Antwort noch einmal vorsprechen: jetzt sieht man die Schrift
     dazu, und genau dabei praegt sich der Klang ein. */
  setTimeout(()=>speakArabic(sprechText(w)), 320);
}

document.getElementById('hoerOptionen').addEventListener('click', (e)=>{
  const b = e.target.closest('[data-hoerwahl]');
  if (!b || HOER.beantwortet) return;
  /* ⚠️ Diesen einen Klick markieren. Er blubbert gleich weiter zur Karte, und
     dort steht `beantwortet` dann schon auf true - ohne die Marke wuerde
     derselbe Fingertipp erst antworten und sofort weiterschalten, die Loesung
     waere nie zu sehen. Am ZIEL des Klicks ist das nicht zu unterscheiden: nach
     dem Antworten liegt der Knopf am selben Fleck und ist dann abgeschaltet. */
  e._hatBeantwortet = true;
  beantworteHoerfrage(Number(b.dataset.hoerwahl));
});
/* ---------- Weiter durch Tippen auf die Karte (Elias, 17.08.2026) ----------

   "ich will aber eigentlich sobald ich eine antwort gegeben habe auf dem grauen
   feld auf der karte einfach klicken damit das nächste kommt."

   Vorher hoerten nur zwei kleine Ziele darauf: der Lautsprecher und die
   Hinweiszeile. Der Hinweis sagte zwar schon "tippe für das nächste Wort", die
   Flaeche dazu war aber nur die Textzeile selbst - man tippt aber dorthin, wo
   man gerade hinschaut, und das sind die Antwortfelder.

   ⚠️ EIN Zuhoerer an der Karte statt drei einzelne. Der Lautsprecher liegt auf
   der Karte; ein eigener Zuhoerer dort wuerde zusaetzlich hochblubbern und
   naechsteHoerfrage() zweimal ausloesen - also ein Wort ueberspringen, ohne
   dass es wie ein Fehler aussieht. Deshalb entscheidet eine Stelle, was der
   Klick bedeutet.

   ⚠️ Ein Klick auf ein Antwortfeld ist KEIN Weiter: `#hoerOptionen` beantwortet
   die Frage, danach setzt der Browser die Knoepfe auf `disabled`. Damit die
   Karte darunter den Klick trotzdem bekommt, tragen abgeschaltete Knoepfe
   `pointer-events:none` (siehe index.html). */
document.getElementById('hoerKarte').addEventListener('click', (e)=>{
  if (e._hatBeantwortet) return;                        /* genau dieser Klick war die Antwort */
  if (HOER.beantwortet){
    /* ⛔ Q8: waehrend der Sperre passiert nichts — auch keine Fehlermeldung.
       Ein Ton oder ein Ruckeln waere Strafe; gewollt ist nur, dass der Blick
       zwei Sekunden auf der Loesung bleibt. */
    if (HOER.sperreBis && Date.now() < HOER.sperreBis) return;
    naechsteHoerfrage(); return; /* egal wo auf der Karte, auch nach dem Tagesziel */
  }
  if (e.target.closest('#btnHoerPlay')) hoerAbspielen();
});

/* ---------- „Kenne ich schon" (hier seit 18.08.2026) ----------

   Elias: „das ist an der falschen stelle, das sollte eigentlich beim hörmodus
   doch sein." Vorher stand der Knopf unter den vier Stufen der Lernkarte.

   ⭐ Warum der Hoermodus die richtige Stelle ist: die Karteikarte hat mit
   „Leicht" laengst eine Stufe fuer „das kann ich" - dort war der Knopf eine
   fuenfte Bewertung neben vier bestehenden. Der Hoermodus hat gar keine
   Bewertung (er fasst den Leitner-Stand bewusst nicht an), und man hoert einem
   Wort sofort an, ob es selbstverstaendlich ist.

   Ein Tipp, und das Wort wird nicht mehr GEFRAGT - weder hier noch bei den
   Karteikarten, denn `kennErSchon` haengt in kern.js `passtZurAuswahl`. Als
   Ablenker bleibt es (siehe naechsteHoerfrage). Bewusst OHNE Rueckfrage: der
   Fehlgriff ist folgenlos, weil derselbe Knopf ihn sofort zuruecknimmt und die
   Liste in den Einstellungen ihn dauerhaft zurueckholt.

   ⚠️ Es wird NICHT weitergeschaltet. Wer gerade die Loesung liest, will sie zu
   Ende lesen; das Wort faellt ab der naechsten Frage weg. */
function zeichneHoerKenneSchon(){
  const zeile = document.getElementById('hoerKenneSchonZeile');
  const b     = document.getElementById('btnHoerKenneSchon');
  if (!zeile || !b || !HOER.wort) return;
  const markiert = (typeof kennErSchon === 'function') && kennErSchon(HOER.wort);
  zeile.classList.remove('hidden');
  b.classList.toggle('ist-markiert', markiert);
  b.querySelector('span').textContent = markiert
    ? 'Ausgeblendet — wieder abfragen'
    : 'Kenne ich schon — nicht mehr abfragen';
  freiRollen(zeile);
}

/* ⚠️ Gemessen am 18.08.2026: bei den vier laengsten Bedeutungen aus seinem
   eigenen Hoervorrat (186 Woerter; die Fachbegriffe haben lange deutsche
   Erklaerungen wie „Genitivverbindung — zwei Nomen werden ein Ausdruck") wird
   die Karte so hoch, dass die Knopfzeile **54 px unter der unteren Leiste**
   landet. Der Bildschirm laesst sich zwar rollen - 78 px Weg -, er sieht aber
   nicht danach aus.

   ⛔ `scrollIntoView({block:'nearest'})` hilft hier NICHT, und zwar ohne
   Fehlermeldung: fuer den Browser liegt die Zeile im sichtbaren Bereich von
   `main`. Die `.bottombar` ist `position:fixed`, also ein Ueberzug DARUEBER und
   kein Teil des Rollbereichs - gemessen blieb `scrollTop` auf 0. Deshalb wird
   der verdeckte Teil hier selbst ausgerechnet.

   Gerollt wird nur, wenn wirklich etwas verdeckt ist. Ein Bildschirm, der nach
   jeder Antwort springt, waere derselbe Fehler wie der Hinweis, der frueher die
   naechste Lernkarte verdeckt hat. */
function freiRollen(el){
  const roller = el.closest('main');
  const leiste = document.querySelector('.bottombar');
  if (!roller) return;
  const grenze = leiste ? leiste.getBoundingClientRect().top : window.innerHeight;
  const zuviel = el.getBoundingClientRect().bottom - grenze;
  if (zuviel > 0) roller.scrollTop += zuviel + 8;   /* 8 px Luft, nicht auf Kante */
}

document.getElementById('btnHoerKenneSchon').addEventListener('click', ()=>{
  const w = HOER.wort;
  if (!w) return;
  const jetztAn = !kennErSchon(w);
  setzeKennErSchon(w.id, jetztAn);
  zeichneHoerKenneSchon();
  if (typeof zeichneKenneSchonListe === 'function') zeichneKenneSchonListe();
  toast(jetztAn
    ? `${w.de} kommt nicht mehr — zurückholen in den Einstellungen.`
    : `${w.de} wird wieder abgefragt.`);
});

/* ================= GEH-MODUS (08.09.2026) =================

   Elias am 08.09.2026 um 01:1x, nachdem ich ihm den Modus beschrieben hatte:

     "klingt gut aber am besten kann ich ihn im modus selbst an und ausschalten"

   ⭐ Deshalb sitzt der Schalter im Hoermodus selbst und NICHT in den
   Einstellungen: Man schaltet ihn ein, wenn man die Wohnung verlaesst — nicht
   vorher am Schreibtisch, wo man noch gar nicht weiss, ob man laufen wird.

   ---------- Was er tut ----------

   Wort (arabisch) → Pause zum Selbstantworten → Bedeutung (deutsch) → weiter.
   Kein Tippen, kein Hinsehen, kein Ende ausser dem Ausschalten.

   ---------- Der Beleg, und der Widerspruch dazu ----------

   Schmidt-Kassow u. a. 2013 (N=81, Polnisch-Vokabeln ueber Kopfhoerer):
   Bewegung WAEHREND des Lernens schlug Sitzen mit d = 0,84 nach 48 h; bei den
   anfangs schwachen Lernern d = 1,2. Bewegung VORHER brachte nichts.
   ⚠️ Amico & Schaefer 2020 fanden denselben Effekt NUR bei Kindern, nicht bei
   jungen Erwachsenen (Ø 21,5 J.). Beide stehen nebeneinander in
   Lernen-mit-ADHS.md, Teil 18 — der Widerspruch ist nicht aufgeloest.

   ---------- Drei Entscheidungen, die man im Code nicht sieht ----------

   ⭐ 1. ER ZAEHLT AUFS TAGESZIEL, ABER NICHT AUF DIE TREFFERQUOTE.
   `t.gesamt` waechst, `t.richtig` und `t.beantwortet` bleiben unberuehrt, und
   `merkeQuote()` wird NICHT gerufen. Hier gibt es keine objektiv richtige oder
   falsche Antwort — niemand tippt etwas an. Eine Quote, die stillschweigend
   Ungemessenes mitzaehlt, waere schlimmer als keine.
   [[kennzeichen_mit_zwei_ursachen]]

   ⭐ 2. `zeitRegung()` BEI JEDEM WORT. Die stille Zeitmessung pausiert nach
   60 s ohne Beruehrung — und im Geh-Modus beruehrt er 20 Minuten lang nichts.
   Ohne diese Zeile haette die Messung ausgerechnet die Uebungsform nicht
   gesehen, fuer die sie am interessantesten ist. Gefunden beim Bauen, nicht
   beim Testen. [[ausfall_ist_unsichtbar_gebaut]]

   ⭐ 3. DER LEITNER-FORTSCHRITT WIRD NICHT ANGEFASST — wie im uebrigen
   Hoermodus auch. Hoeren und Lesen sind verschiedene Faehigkeiten.

   ⚠️ WAS ER NICHT KANN: Sperrt das Handy den Bildschirm, drosseln Android und
   iOS die Timer der Seite, und die Kette kann stehenbleiben. Bildschirm an
   lassen. Ein Modus, der das ueberlebt, braeuchte die Media Session API mit
   echtem Audio — das ist ein eigener Bau, kein Zusatz hier. */
const GEH = { an:false, lauf:0 };

const GEH_PAUSE_ANTWORT = 4500;   /* Zeit zum Selbstantworten */
const GEH_PAUSE_DANACH  = 1800;   /* Luft vor dem naechsten Wort */

/* ================= BEI GESPERRTEM BILDSCHIRM (08.09.2026) =================

   Elias: "kann man es auch zum funktionieren bringen auch bei ausgeschaltetem
   bildschrim, das wäre mir wichtig"

   ---------- Was das Problem ist ----------

   Sperrt das Handy den Bildschirm, friert der Browser die Seite ein (Page
   Lifecycle: `frozen`). `setTimeout` laeuft nicht mehr, die Kette bleibt
   stehen. ⛔ Die EINE Ausnahme, die der Browser macht: **eine Seite, die
   Audio abspielt, wird nicht eingefroren** — sonst wuerde jede Musik-App beim
   Sperren verstummen.

   ---------- Was hier deshalb gebaut ist ----------

   1. ⭐ Ein **stiller Ton in Endlosschleife** (`stille.wav`, 5 s, 39 KB) laeuft,
      solange der Geh-Modus an ist. Damit gilt die Seite als "spielt Medien ab"
      und bleibt wach. Die Datei ist echte Stille (8-bit-Mitte 128), kein
      Rauschen — man hoert sie nicht, der Browser sieht sie.

   2. ⭐ **MediaSession**: Auf dem Sperrbildschirm erscheint eine Steuerung, mit
      der er den Geh-Modus **anhalten kann, ohne das Handy zu entsperren**. Das
      ist unabhaengig vom Rest ein Gewinn.

   3. ⛔ **Ein Protokoll, das BEIM NUTZER misst.** Ob die Sprachausgabe bei
      gesperrtem Bildschirm wirklich spricht, ist geraeteabhaengig und konnte
      hier nicht geprueft werden: Der Pruefbrowser hat keinen Sperrbildschirm.
      Statt zu raten, schreibt jedes Wort einen Eintrag mit Zeitstempel,
      Sichtbarkeit und der Frage, ob `speechSynthesis` ueberhaupt angefangen
      hat. Nach dem Spaziergang steht dort, ob es lief — und wenn nicht, wo es
      aufhoerte. [[diagnose_statt_raten]]

   ⚠️ EHRLICHE GRENZE: Punkt 1 haelt die TIMER am Leben, das ist gut belegt.
   Ob Android die SPRACHAUSGABE im gesperrten Zustand zulaesst, ist es nicht —
   die Recherche am 08.09.2026 fand dazu nur Plattform-Beschraenkungen ohne
   verlaesslichen Ausweg. Bleibt sie stumm, ist der naechste Schritt, die
   Woerter als echte Audiodateien vorzurendern; dann spielt der Geh-Modus
   Dateien statt TTS und funktioniert wie ein Podcast. Das ist ein eigener Bau
   und erst sinnvoll, wenn das Protokoll zeigt, dass er noetig ist. */
let GEH_STILLE = null;

/* ⛔⛔ Zwei Stimmen gleichzeitig (09.09.2026)

   Der Geh-Modus und der Quran-Leser sind zwei unabhaengige Tonquellen, und
   beide beschriften DIESELBE Mediensitzung (`navigator.mediaSession` gibt es
   im Fenster nur einmal). Wer zuletzt schreibt, gewinnt — die Folge waere eine
   Benachrichtigung, die „Vokabeln hören" anzeigt, deren Pause-Knopf aber die
   Rezitation anhaelt, oder umgekehrt. Genau so entsteht „ich kann ihn hier
   nicht anhalten".

   ⭐ Deshalb schliessen sie einander aus: wer anfaengt, beendet den anderen.
   Die umgekehrte Richtung steht in `audioSpiele()` in js/quran-audio.js — an
   BEIDEN Stellen, weil jede fuer sich zuerst dran sein kann.
   [[entscheidung_gilt_fuer_das_zweite_werkzeug]] */
function gehAnderenTonAus(){
  try {
    if (QAUDIO && QAUDIO.sure !== null && typeof audioAus === 'function') audioAus();
  } catch (e){ gehNotiz('quran-aus-fehler'); }
}

function gehStilleAn(){
  gehAnderenTonAus();
  try {
    if (!GEH_STILLE){
      GEH_STILLE = new Audio('stille.wav');
      GEH_STILLE.loop = true;
      GEH_STILLE.volume = 1;          /* die DATEI ist still, nicht der Regler —
                                         ein Element auf volume 0 zaehlt bei
                                         manchen Browsern nicht als Wiedergabe */
    }
    /* ⚠️ Braucht eine Nutzergeste. Der Schalter IST eine — deshalb wird das
       hier und nirgends sonst gestartet. */
    const p = GEH_STILLE.play();
    if (p && p.catch) p.catch(()=>{ gehNotiz('stille-abgelehnt'); });
  } catch (e){ gehNotiz('stille-fehler'); }

  if ('mediaSession' in navigator){
    try {
      /* ⛔ NICHT „Geh-Modus". Elias am 08.09.2026 mit einem Bild der
         Benachrichtigung: „auch die betitelung soll geändert werden, ich will
         nicht geh modus da stehen haben." Der Name ist eine INTERNE
         Bezeichnung; auf dem Sperrbildschirm steht er neben Musik-Apps und
         sagt niemandem etwas.
         ⚠️ Bewusst NICHT das laufende Wort: das waere die Loesung, bevor er
         geraten hat — auf dem Sperrbildschirm und in jeder Vorschau. */
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Vokabeln hören', artist: 'Vokabeltrainer', album: 'Arabisch'
      });
      navigator.mediaSession.playbackState = 'playing';
      /* Beide Wege belegen, damit der Knopf auf dem Sperrbildschirm in jedem
         Fall etwas tut: manche Oberflaechen schicken `pause`, andere `stop`. */
      navigator.mediaSession.setActionHandler('pause', ()=>gehModusSetzen(false));
      navigator.mediaSession.setActionHandler('stop',  ()=>gehModusSetzen(false));
      navigator.mediaSession.setActionHandler('play',  ()=>gehModusSetzen(true));
      /* ⚠️ Wirft schon `new MediaMetadata(...)`, sind die drei Knoepfe
         darunter NIE angemeldet worden — der Sperrbildschirm zeigt dann
         Knoepfe, die nichts tun. Von aussen sieht das aus wie ein haengender
         Geh-Modus. [[befund_vor_dem_ende_der_funktion]] */
    } catch (e){ stillerFehler('Hoeren: Sperrbildschirm einrichten', e); }
  }
}

function gehStilleAus(){
  try { if (GEH_STILLE) GEH_STILLE.pause(); } catch (e){ /* nichts zu pausieren ist kein Fehler */ }
  if ('mediaSession' in navigator){
    try { navigator.mediaSession.playbackState = 'paused'; } catch (e){ /* ohne MediaSession gibt es nichts zu setzen */ }
    /* ⛔ Die Knoepfe werden WIEDER FREIGEGEBEN. Ohne das bliebe der
       Pause-Handler des Geh-Modus liegen, und der naechste Ton der App —
       eine Rezitation — bekaeme auf dem Sperrbildschirm einen Knopf, der den
       falschen Modus anhaelt. Der Quran-Leser macht dasselbe beim Beenden
       (`quranMedienKnoepfe(false)`); es fehlte nur auf dieser Seite.
       [[wirkung_an_der_quelle_stilllegen]] */
    ['play', 'pause', 'stop'].forEach(n => {
      try { navigator.mediaSession.setActionHandler(n, null); } catch (e){ /* Abmelden einer nie angemeldeten Taste */ }
    });
  }
}

/* ---------- Das Protokoll ----------

   ⚠️ Nur die letzten 200 Eintraege, und nur der laufende Tag. Es ist ein
   Diagnosewerkzeug, kein Archiv — ein unbegrenzt wachsender Speicher waere
   nach zwei Wochen das groessere Problem als der Fehler, den er finden soll. */
const GEH_LOG_SCHLUESSEL = 'vt_gehLog';

function gehNotiz(was, dazu){
  try {
    let log = LS.get(GEH_LOG_SCHLUESSEL, null);
    if (!log || log.tag !== todayStr(0)) log = { tag: todayStr(0), zeilen: [] };
    log.zeilen.push(Object.assign({
      uhr: new Date().toTimeString().slice(0,8),
      was: was,
      sichtbar: document.visibilityState
    }, dazu || {}));
    if (log.zeilen.length > 200) log.zeilen = log.zeilen.slice(-200);
    LS.set(GEH_LOG_SCHLUESSEL, log);
    /* ⛔⛔ Das ist das MESSWERKZEUG selbst. Faellt es aus, zeigt die
       Diagnosekarte „(nicht gelaufen)" — und wir suchen den Fehler dann im
       Geh-Modus statt im Protokoll. Ein Werkzeug, das still ausfaellt,
       verfaelscht jede Messung, die danach kommt.
       [[leere_liste_ist_keine_messung]] */
  } catch (e){ stillerFehler('Geh-Protokoll schreiben', e); }
}

/** Die Zeilen des laufenden Tages, ohne Ausgabe. Die Diagnosekarte in den
 *  Einstellungen liest sie — auf dem Handy öffnet niemand eine Konsole.
 *  ⚠️ Der Tag wird geprüft: ein Protokoll von gestern wäre kein Befund über
 *  heute, sondern eine falsche Fährte. */
function gehProtokollZeilen(){
  const log = LS.get(GEH_LOG_SCHLUESSEL, null);
  return (log && log.tag === todayStr(0) && log.zeilen) ? log.zeilen : [];
}

/* Abruf in der Konsole: gehProtokoll() */
function gehProtokoll(){
  const log = LS.get(GEH_LOG_SCHLUESSEL, null);
  if (!log || !log.zeilen || !log.zeilen.length){ console.log('Noch kein Geh-Modus gelaufen.'); return []; }
  console.table(log.zeilen);
  const stumm = log.zeilen.filter(z => z.was === 'wort' && z.sprach === false).length;
  const woerter = log.zeilen.filter(z => z.was === 'wort').length;
  console.log(`${woerter} Wörter · davon ${stumm} ohne Ton`
    + ` · ${log.zeilen.filter(z => z.sichtbar === 'hidden').length} bei ausgeschaltetem Bildschirm`);
  return log.zeilen;
}

/* Sprechen mit Warten auf das Ende. ⛔ Die Notbremse ist keine Kuer: manche
   Geraete melden weder `onend` noch `onerror`, und ohne sie bliebe die Kette
   fuer immer stehen — lautlos, mitten im Gehen. */
function gehSprich(text, sprache){
  return new Promise((fertig)=>{
    if (!('speechSynthesis' in window) || !text) return fertig();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = sprache;
    if (sprache.startsWith('ar')){
      const stimme = ARABIC_VOICES.find(v => v.voiceURI === SETTINGS.voiceURI) || ARABIC_VOICES[0];
      if (stimme) u.voice = stimme;
      u.rate = 0.85;
    } else {
      u.rate = 0.95;
    }
    /* ⭐ `begonnen` ist die Diagnose fuer den gesperrten Bildschirm: Kommt
       `onstart` nicht, hat die Sprachausgabe gar nicht angefangen — genau der
       Fall, den wir bei ausgeschaltetem Bildschirm vermuten und nicht selbst
       messen koennen. Das Ergebnis wandert ins Protokoll. */
    let raus = false, begonnen = false;
    const ende = ()=>{ if (!raus){ raus = true; clearTimeout(uhr); fertig(begonnen); } };
    const uhr = setTimeout(ende, 8000);
    u.onstart = ()=>{ begonnen = true; };
    u.onend = ende; u.onerror = ende;
    /* Wie in speakArabic(): Android laesst die Sprachausgabe gelegentlich
       PAUSIERT zurueck, nimmt danach jede Aeusserung an und sagt nichts. */
    if (speechSynthesis.paused) speechSynthesis.resume();
    speechSynthesis.speak(u);
  });
}

function gehWarte(ms){ return new Promise(f => setTimeout(f, ms)); }

/* ⚠️ Nach JEDEM await pruefen, ob dieser Lauf noch der aktuelle ist. Wer den
   Schalter zweimal schnell drueckt, haette sonst zwei Schleifen, die sich
   gegenseitig ins Wort fallen — und zwar hoerbar. */
async function gehSchleife(){
  const meiner = ++GEH.lauf;
  const gilt = () => GEH.an && GEH.lauf === meiner;

  while (gilt()){
    const pool = hoerbareVokabeln();
    if (!pool.length){
      document.getElementById('hoerHinweis').textContent =
        'Keine Wörter zum Hören — wähle oben auf der Startseite mehr aus.';
      gehModusSetzen(false);
      return;
    }
    const fragbar = pool.filter(w => !(typeof kennErSchon === 'function' && kennErSchon(w)));
    const w = shuffle(fragbar.length ? fragbar : pool)[0];
    HOER.wort = w;                      /* damit der Lautsprecherknopf weiterhin dieses Wort spricht */
    HOER.beantwortet = false;

    /* ⭐ Die Zeitmessung wachhalten — hier wird 20 Minuten lang nichts berührt. */
    if (typeof zeitRegung === 'function') zeitRegung();

    document.getElementById('hoerHinweis').textContent = 'Hör hin — was bedeutet es?';
    document.getElementById('hoerLoesung').classList.add('hidden');
    const knopf = document.getElementById('btnHoerPlay');
    knopf.classList.add('spielt');
    const sprach = await gehSprich(sprechText(w), 'ar-SA');
    knopf.classList.remove('spielt');
    /* ⛔ Der Eintrag steht NACH dem Sprechen, nicht davor: `sprach` ist die
       eigentliche Frage („hat die Stimme ueberhaupt angefangen?"), und
       `sichtbar` sagt, ob der Bildschirm da gerade aus war. Zusammen
       beantworten die beiden, was ich hier nicht pruefen kann. */
    gehNotiz('wort', { wort: w.de, sprach: sprach, stille: !!(GEH_STILLE && !GEH_STILLE.paused) });
    if (!gilt()) return;

    await gehWarte(GEH_PAUSE_ANTWORT);
    if (!gilt()) return;

    /* Erst jetzt die Schrift zeigen: Wer doch hinsieht, soll die Lösung sehen,
       nicht die Frage. Wer nicht hinsieht, verliert nichts. */
    const loesung = document.getElementById('hoerLoesung');
    /* ⛔ `hl-ar` / `hl-de` — genau die Klassen, die beantworteHoerfrage() setzt.
       Ich hatte hier zuerst eigene Namen erfunden; die haetten keine CSS-Regel
       getroffen, und die Schrift waere lateinisch-klein und ohne RTL erschienen,
       ohne dass irgendwo etwas meldet. [[klasse_ohne_css_regel]] */
    loesung.innerHTML = `<div class="hl-ar" lang="ar" dir="rtl">${escapeHtml(w.sg || w.ar)}</div>`
      + `<div class="hl-de">${escapeHtml(w.de)}</div>`;
    loesung.classList.remove('hidden');
    document.getElementById('hoerHinweis').textContent = '';
    await gehSprich(w.de, 'de-DE');
    if (!gilt()) return;

    /* ⛔ Tagesziel ja, Trefferquote nein — die Begründung steht im Kopf. */
    const t = hoerTag();
    const zielVorher = t.gesamt;
    t.gesamt++;
    hoerTagSpeichern(t);
    hoerStandSchreiben();

    /* ⭐ Das Ziel kann genau hier fallen, und bis zum 08.09.2026 blieb das
       folgenlos. Gesehen wird beim Laufen nichts — also SAGEN wir es, und
       hoerZielPruefen() hebt die sichtbare Feier auf, bis er hinschaut. */
    if (zielVorher < hoerTagesziel() && t.gesamt >= hoerTagesziel()){
      hoerZielPruefen();
      await gehSprich('Tagesziel geschafft. ' + t.gesamt + ' Wörter.', 'de-DE');
      if (!gilt()) return;
    }

    await gehWarte(GEH_PAUSE_DANACH);
  }
}

function gehModusSetzen(an){
  GEH.an = !!an;
  GEH.lauf++;                                   /* laufende Schleife ungültig machen */
  const schalter = document.getElementById('toggleGehModus');
  if (schalter) schalter.classList.toggle('on', GEH.an);
  document.getElementById('screen-hoeren').classList.toggle('geht', GEH.an);
  if (GEH.an){
    gehStilleAn();                 /* ⛔ VOR der Schleife: der Klick auf den Schalter
                                      ist die Nutzergeste, die `play()` erlaubt.
                                      Nach dem ersten `await` waere sie verbraucht. */
    gehNotiz('start');
    gehSchleife();
  } else {
    gehStilleAus();
    gehNotiz('stop');
    /* ⭐ Jetzt schaut er wieder hin: eine im Laufen aufgeschobene Feier wird
       hier faellig. Ohne dieses eine Wort waere die Aufschiebung oben eine
       Beerdigung. [[werkzeug_ohne_aufrufer]] */
    hoerZielPruefen();
    try { speechSynthesis.cancel(); } catch (e){ /* nichts zu unterbrechen ist kein Fehler */ }
    /* Zurück in den normalen Betrieb: eine frische Frage mit Antwortknöpfen.
       Ohne das stünde die letzte Lösung da und nichts ginge weiter. */
    if (document.getElementById('screen-hoeren').classList.contains('active')) naechsteHoerfrage();
  }
}

document.getElementById('toggleGehModus').addEventListener('click', ()=>{
  gehModusSetzen(!GEH.an);
});

/* ⭐ Der letzte Weg zurück zur aufgeschobenen Feier (09.09.2026).
   Ohne ihn bliebe eine Lücke: Wer im Geh-Modus sein Ziel erreicht und den
   PAUSE-Knopf auf dem SPERRBILDSCHIRM drückt, bleibt anschließend im
   Hörmodus — `openHoeren()` läuft dann nicht mehr, weil der Bildschirm gar
   nicht gewechselt wird. Die Feier wartete bis zum nächsten Wechsel.
   ⚠️ `hoerZielPruefen()` prüft selbst, ob überhaupt etwas offen ist; ein
   Aufruf bei jedem Zurückschalten kostet nichts. [[werkzeug_ohne_aufrufer]] */
document.addEventListener('visibilitychange', ()=>{
  if (document.visibilityState !== 'visible') return;
  const s = document.getElementById('screen-hoeren');
  if (s && s.classList.contains('active') && typeof hoerZielPruefen === 'function') hoerZielPruefen();
});

function openHoeren(){
  /* Ohne arabische Stimme waere der Modus stumm und damit sinnlos - das
     lieber sagen als eine leere Karte zeigen. */
  if (!('speechSynthesis' in window)){
    document.getElementById('hoerKarte').classList.add('hidden');
    const leer = document.getElementById('hoerLeer');
    leer.classList.remove('hidden');
    leer.textContent = 'Dieser Browser kann keine Sprachausgabe. Ohne sie funktioniert der Hörmodus nicht.';
    return;
  }
  HOER.richtig = 0; HOER.gesamt = 0;
  naechsteHoerfrage();
  /* ⭐ Der dritte Weg, und der einzige, der einen App-Neustart ueberlebt:
     `HOER.zielOffen` liegt nur im Arbeitsspeicher, der `einmalig`-Riegel
     dagegen in localStorage. Wer im Geh-Modus sein Ziel erreicht und die App
     schliesst, bekommt seine Feier beim naechsten Oeffnen. */
  hoerZielPruefen();
}
