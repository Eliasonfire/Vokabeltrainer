/* kern.js -- Konstanten, Speicher, Lernfortschritt, Streak, kleine Helfer
   Teil der App-Logik; wird in index.html in fester Reihenfolge geladen und
   teilt sich mit den uebrigen js/-Dateien den globalen Namensraum. */
/* ===================== Vokabeltrainer - App-Logik ===================== */
/* Leitner-System: 5 Boxen. Box-Intervalle in Tagen bis zur naechsten Faelligkeit. */
const INTERVALS = {1:0, 2:1, 3:3, 4:7, 5:16};
/* Kapitelnamen: wo eine kuratierte Grammatikregel fuer das Kapitel existiert, ist der
   Name deren Thema (Kap. 2 = ذَلِكَ, belegt durch grammar-data.js `ismul-isara-dhalika-01`,
   Quelle Folge 02). Wo keine Regel vorliegt, beschreibt der Name den tatsaechlichen
   Wortschatz des Kapitels - nichts davon ist geraten.
   27.07.2026, nach Auswertung aller 13 Folgen: Kap. 3 und 9 tragen jetzt ihr
   Grammatikthema statt einer Wortschatz-Beschreibung. Kap. 3 = اَلْ mit Sonnen- und
   Mondbuchstaben (`al-tarif-01`, `schams-qamar-01`, Folge 02/03), Kap. 9 = نَعْت
   (`nat-vier-bedingungen-01`, Folge 13) - genau der Wechsel, den Abschnitt A.6 des
   Ziel-Prompts vorgesehen hat. Kap. 8 bleibt "Laender": die Regeln dort drehen sich
   um لِ, das Kapitel selbst fuehrt aber Laendernamen ein. */
const CHAPTER_NAMES = {
  1:"هَذَا (dies)", 2:"ذَلِكَ (jenes)", 3:"اَلْ (bestimmter Artikel)", 4:"Genitivpartikel", 5:"مُضَاف (Bezugswort)",
  6:"هَذِهِ (diese)", 7:"تِلْكَ (jene)", 8:"Länder", 9:"نَعْت (Adjektiv)",

  /* ---------- Kapitel 10 bis 23, ergaenzt am 30.07.2026 ----------
     Elias: "hier bei den weiterfuehrenden kapiteln kannst du gerne als
     ueberschrift das hinmachen was das kapitel behandelt. ansonsten weiss ich ja
     gar nicht wonach jenes kapitel sortiert ist." Vorher stand dort
     "Kap. 10 - Kapitel 10", was tatsaechlich nichts sagt.

     ⚠️ NICHTS DAVON IST GERATEN (E.1). Jeder Name ist die Kurzform des Satzes,
     mit dem der MADINA-SCHLUESSEL 1 die Lektion selbst eroeffnet ("In dieser
     Lektion geht es um das Folgende: ..."). Die Fundstelle steht je Zeile dabei;
     die Seitenzahlen kommen aus dem Inhaltsverzeichnis des Schluessels.
     Wo der Schluessel selbst sagt, dass es keinen neuen Stoff gibt
     (Wiederholung, Fortsetzung, Test), sagt der Name genau das - eine erfundene
     Ueberschrift waere dort schlimmer als "Kapitel 17". */
  10:"Besitz-Fürwörter (ـكَ, ـهُ, ـهَا, ـي)",   // Schl. 1 L10 S. 35
  11:"Wiederholung (nur zwei neue Wörter)",      // Schl. 1 L11 S. 39, wörtlich
  12:"أَنْتِ (weibliches „du“)",                  // Schl. 1 L12 S. 41
  13:"Plural von Nomen & Adjektiven",            // Schl. 1 L13 S. 44, Teil A
  14:"أَنْتُمْ (männlicher Plural)",               // Schl. 1 L14 S. 52
  15:"أَنْتُنَّ (weiblicher Plural)",              // Schl. 1 L15 S. 56
  16:"Rational / irrational",                    // Schl. 1 L16 S. 58
  17:"Fortsetzung von Kapitel 16",               // Schl. 1 L17 S. 60, wörtlich
  18:"Dual (ـانِ, genau zwei)",                   // Schl. 1 L18 S. 61
  19:"Zahlen 3–10 (männlich)",                   // Schl. 1 L19 S. 64
  20:"Zahlen 3–10 (weiblich)",                   // Schl. 1 L20 S. 67
  21:"Testlektion (nur neue Wörter)",            // Schl. 1 L21 S. 69, wörtlich
  22:"Wörter ohne Tanwīn",                       // Schl. 1 L22 S. 70
  23:"Genitiv & Diptota (Fatha statt Kasra)",    // Schl. 1 L23 S. 73

  /* Kapitel 24 ist bei arabicroots kein Lektionskapitel - Madina Buch 1 hat 23
     Lektionen (Madina-Schluessel 1). Es ist ein Anhang: Pronomen, Fragewoerter,
     Zahlen, Grammatik-Fachbegriffe und vermischter Wortschatz. Der Name ist am
     Inhalt abgelesen, nicht geraten - Elias hat am 30.07.26 die neun Zahlen
     daraus angefordert. */
  24:"Anhang (Pronomen, Zahlen, Fachbegriffe)", personal:"Eigene Vokabeln",

  /* Die arabischen Fachbegriffe seines Lehrers (data/fachbegriffe.js,
     17.08.2026). Eigenes Kapitel, NICHT 'personal' - siehe die Begruendung
     dort und bei istBekannt(). */
  grammar:"Fachbegriffe aus dem Unterricht"
};

/* Die kurze Herkunftszeile auf der Lernkarte und unter den Beispielsaetzen.
   Bewusst an EINER Stelle: die beiden Aufrufer schrieben bisher jeder fuer
   sich `chapter==='personal' ? 'Eigene Vokabel' : 'Kap. '+chapter`, und beim
   dritten Kapitelwert ('grammar') haette genau einer davon „Kap. grammar"
   angezeigt - ohne dass es irgendwo aufgefallen waere. */
function kapitelBeschriftung(w){
  if (!w) return '';
  /* Pluralkarten zuerst: bei ihnen ist die Herkunft die interessantere Angabe.
     „Kap. 1" stuende auf der Singularkarte genauso und sagte nicht, wovon der
     Plural ueberhaupt der Plural ist.

     ⭐ Das arabische Wort steht am ENDE der Zeile, nicht in der Mitte. In einem
     deutschen (linkslaeufigen) Satz bleibt ein arabischer Schluss dort, wo er
     hingehoert; steht Arabisches mittendrin, ordnet die Bidi-Regel den Rest
     darum herum um, und die Zeile kommt zerrissen an. Genau das ist am
     18.08.2026 bei der Unterzeile der Fachbegriffe passiert - dort half nur,
     den arabischen Teil ganz herauszunehmen.

     ⛔ Keine unsichtbaren Steuerzeichen (U+2068/U+2069) als Loesung. Die sieht
     man im Quelltext nicht, und was man nicht sieht, prueft man auch nicht. */
  if (w.istPlural && w.sgAr) return `Plural von ${w.sgAr}`;
  if (w.chapter === 'personal') return 'Eigene Vokabel';
  if (w.chapter === 'grammar')  return 'Fachbegriff';
  return `Kap. ${w.chapter}`;
}

/* ---------- Welche Kapitel kennt Elias? ----------
   Elias am 30.07.2026: "bei den wortfeldern sollen erstmal nur woerter von mir
   drinnen sein, die ich auch kenne. sprich bis jetzt woerter aus kapitel 1-9 und
   meine eigenen" - und gleich danach: "auch bei den eigenen kategorien sollen
   nur woerter sein die ich auch kenne."

   ⚠️ Die Liste ist NICHT geraten und nicht aus "1-9" abgeschrieben, sondern am
   30.07.2026 bei arabicroots abgefragt: `get_unlocked_chapters` gab genau
   madina-1-chapter-1 bis -9 zurueck, kein weiteres Buch. Das ist die
   maszgebliche Auskunft darueber, was er im Kurs schon hatte.

   Warum die Zahlen hier im Code stehen und nicht zur Laufzeit geholt werden: die
   App hat keinen Zugang zu arabicroots - sie ist ohne Backend gebaut und laeuft
   offline. Die Wartungsroutine darf `get_unlocked_chapters` aufrufen und traegt
   neue Freischaltungen hier nach.

   Ein Buch, das hier NICHT steht, wird auch nicht beschnitten: dann ist
   unbekannt, was freigeschaltet ist, und etwas zu verbergen waere schlimmer als
   zu viel zu zeigen. */
/* ⚠️ Diese Tabelle wird NICHT von selbst aktuell. Sie stand vom 30.07. bis zum
   17.08.2026 auf 1–9, waehrend arabicroots laengst 1–11 freigegeben hatte —
   Elias hat es gemerkt, nicht ich: "es wäre wichtig das er alle hat aber auch
   immer mehr unlockt mit den kapiteln die ich dann auch kann."
   Nachgefragt wird mit dem arabicroots-MCP:  get_unlocked_chapters
   Ein stehengebliebener Wert faellt hier nie durch eine Pruefung auf — er
   sieht schlicht wie eine bewusste Grenze aus. Siehe die Lehre zum
   eingefrorenen Feld. */
const FREIGESCHALTET = {
  'madina-1': [1,2,3,4,5,6,7,8,9,10,11]   // arabicroots, abgefragt am 17.08.2026
};

/* Die Woerter, die Elias kennt. Drei Quellen, und die dritte ist der Grund,
   warum das nicht einfach "Kapitel 1 bis 9" heisst:

   1. die freigeschalteten Kapitel des aktiven Buchs (Tabelle oben)
   2. seine eigenen Vokabeln (chapter 'personal')
   3. der LERNBESTAND - alles, was in vocab-data.js steht

   ⚠️ Punkt 3 ist keine Bequemlichkeit, sondern behebt einen Widerspruch: Elias
   hat am 30.07.2026 die neun Zahlen aus Kapitel 24 ausdruecklich angefordert
   ("ja will sie drin haben"), und ebenso أَخٌ und أُخْتٌ aus dem
   Madina-Schluessel. Kapitel 24 ist NICHT freigeschaltet - ein reiner
   Kapitelfilter haette genau die Woerter wieder verschwinden lassen, um die er
   gebeten hat.

   vocab-data.js ist sein handverlesener Lernbestand (171 Woerter, Beispielsaetze,
   Koranbezuege). Was dort steht, kennt er - unabhaengig von der Kapitelnummer.
   Alles Weitere kommt aus dem arabicroots-Paket und ist Vorrat fuer spaeter. */
const LERNBESTAND_IDS = new Set(VOCAB_DATA.map(w => w.id));

/* ⚠️ Seit dem 11.08.2026 wird je WORT nach seinem eigenen Buch gefragt, nicht
   einmal nach "dem" aktiven Buch. Bei mehreren gewaehlten Buechern waere das
   sonst falsch in beide Richtungen: die Freischaltung von Madina 1 haette ueber
   Madina 2 entschieden, und ein Buch ohne hinterlegte Freischaltung haette die
   Einschraenkung fuer alle anderen aufgehoben. */
/* Die Regel als eigene Pruefung, damit sie auch dort gilt, wo nicht ueber eine
   Liste gegangen wird - vor allem in passtZurAuswahl() weiter unten. Vorher
   steckte sie nur im Filter von bekannteVokabeln(), und genau deshalb hat der
   Lernmodus sie nie angewandt. */
function istBekannt(w){
  if (!w) return false;
  if (w.chapter === 'personal') return true;
  /* ⭐ Die Fachbegriffe seines Lehrers (data/fachbegriffe.js). Sie sind
     definitionsgemaess bekannt: sie stammen aus SEINEN 73 Regeln, also aus dem
     Unterricht, den er schon hatte. Ohne diese Zeile fielen sie durch den
     Buchfilter unten, weil 'grammar' in FREIGESCHALTET nicht vorkommt. */
  if (w.chapter === 'grammar') return true;
  if (LERNBESTAND_IDS.has(w.id)) return true;

  /* ⭐⭐ SEINE EIGENE AUSWAHL GEHT VOR — am 19.08.2026 dazu.
     Elias: „die neuen vokabeln müssen auch automatisch in den satzmodus und in
     die kategorien direkt automatisch eingetragen werden … das muss auch immer
     automatisch passieren."

     Bis dahin entschied allein FREIGESCHALTET, eine von Hand gepflegte Zeile
     weiter oben. Gemessen am selben Tag: hakte er Kapitel 12 in der App an,
     waren die 9 Woerter zwar GELADEN (buchVokabeln), aber
       im Lernvorrat        0
       in bekannteVokabeln  0
       in den Wortfeldern   0
     Erst wenn die Routine gelaufen UND veroeffentlicht war, kamen sie an — bis
     zu dreieinhalb Tage spaeter.

     ⭐ Mit dieser Zeile wirkt sein Antippen SOFORT, und drei weitere Dinge
     kommen umsonst mit: Karteikarten, Kategorien und Wortfelder haengen alle
     an dieser einen Pruefung. Gemessen: die 9 Woerter ordnen sich von selbst
     ein (عَمَّةٌ → „Familie & Menschen", شَجَرَةٌ → „Natur & Wetter"), und von
     195 bekannten Woertern steht danach KEINES ohne Feld da.

     ⚠️ Nur wenn seine Liste fuer dieses Buch etwas enthaelt. Eine leere Liste
     heisst „nichts ausgewaehlt", nicht „alles gesperrt" — dann gilt weiter
     FREIGESCHALTET. Sonst raeumte ein versehentliches Abwaehlen den Lernvorrat
     leer. */
  const eigene = (typeof SETTINGS !== 'undefined') && SETTINGS.buecher && SETTINGS.buecher[w.book];
  if (Array.isArray(eigene) && eigene.length)
    return eigene.map(Number).includes(Number(w.chapter));

  const frei = FREIGESCHALTET[w.book];
  if (!frei) return true;                /* fuer dieses Buch ist nichts hinterlegt */
  return frei.includes(w.chapter);
}

function bekannteVokabeln(){
  const alle = (typeof buchVokabeln === 'function') ? buchVokabeln() : VOCAB_DATA;
  return alle.filter(istBekannt);
}

/* Für die Beschriftung: "Kapitel 1–9" statt einer Aufzählung, wenn die Kapitel
   lückenlos aufeinander folgen. */
function freigeschalteteBeschriftung(){
  /* ⚠️ Bei mehreren gewaehlten Buechern gibt es keinen einen Bereich mehr.
     "Kapitel 1–9" waere dann schlicht falsch - es stuende ueber einer Liste,
     die auch Woerter aus Madina 2 enthaelt. Lieber gar keine Beschriftung als
     eine, die eine Grenze behauptet, die es nicht gibt. */
  if (typeof aktiveBuecher === 'function' && aktiveBuecher().length > 1) return null;
  const buch = (typeof aktivesBuch === 'function') ? aktivesBuch() : 'madina-1';
  const frei = FREIGESCHALTET[buch];
  if (!frei || !frei.length) return null;
  const s = [...frei].sort((a,b)=>a-b);
  const lueckenlos = s.every((n,i)=> i===0 || n === s[i-1]+1);
  return lueckenlos && s.length > 1 ? `Kapitel ${s[0]}–${s[s.length-1]}` : `Kapitel ${s.join(', ')}`;
}

/* ---------- Storage ---------- */
const LS = {
  get(key, fallback){ try{ const v = localStorage.getItem(key); return v?JSON.parse(v):fallback; }catch(e){ return fallback; } },
  /* Jede Aenderung wird dem Geraeteabgleich gemeldet (js/sync.js). Das
     geschieht bewusst HIER und nicht an den sechs Aufrufstellen: eine neue
     Speicherstelle waere sonst still vom Abgleich ausgenommen, ohne dass es
     jemandem auffiele. sync.js entscheidet selbst, welche Schluessel es
     betreffen. Der typeof-Test haelt die App lauffaehig, falls js/sync.js
     einmal nicht geladen ist. */
  set(key, val){
    try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){}
    if (typeof syncGeaendert === 'function') syncGeaendert(key);
  }
};

function todayStr(offsetDays=0){
  const d = new Date();
  d.setDate(d.getDate()+offsetDays);
  return d.toISOString().slice(0,10);
}

/* ---------- Eigene Vokabeln (lokal, nicht Teil von vocab-data.js) ---------- */
let PERSONAL_VOCAB = LS.get('vt_personalVocab', []);
function savePersonalVocab(){ LS.set('vt_personalVocab', PERSONAL_VOCAB); }
VOCAB_DATA.push(...PERSONAL_VOCAB);

/* ---------- Fortschritt je GRAMMATIKREGEL (19.08.2026) ----------

   Elias: „vorallem aktuellere und die die ich noch nicht so gut kann wie
   andere." Bis heute war das nicht zu beantworten — PROGRESS zaehlt je
   Vokabel, zu einer Regel wurde gar nichts gemerkt.

   Aufbau: { <regel-id>: { gestellt, richtig, zuletzt } }. Mehr braucht es
   nicht; die Trefferquote ergibt sich daraus und altert nicht.

   ⚠️ Gespeist wird das NUR aus dem Uebungsmodus „Welche Regel?" — die
   anderen zwoelf fragen Rollen und Faelle ab, keine benannte Regel.

   ⭐ Am 19.08.2026 nachgemessen: dieser eine Modus erreicht **94 der 95
   Regeln**. Hier stand vorher 73, und das war der Stand VOR der
   Wortfolgen-Aenderung vom selben Tag (js/uebung.js: eine Markierung ueber
   mehrere Woerter wurde bis dahin uebersprungen, damit fielen 21 Regeln aus
   dem Modus heraus). 73 + 21 = 94 — die Zahl im Kommentar war also nicht
   falsch gemessen, sondern nur nicht mitgezogen worden. Genau daran erkennt
   man, warum eine Zahl im Kommentar ein Verfallsdatum braucht.

   Die eine fehlende ist `ta-marbuta-fem-01`: sie hat acht Markierungen und
   ist trotzdem `ausgeblendet` — Elias' Abbestellung vom 29.07. Wer die Zahlen
   liest, muss das wissen, sonst haelt er sie fuer ungeuebt. Die Ansicht in
   js/statistik.js sagt es deshalb ausdruecklich dazu. */
let REGEL_STAND = LS.get('vt_regelStand', {});
function merkeRegel(regelId, richtig){
  if (!regelId) return;
  const e = REGEL_STAND[regelId] || { gestellt:0, richtig:0, zuletzt:null };
  e.gestellt++;
  if (richtig) e.richtig++;
  e.zuletzt = todayStr(0);
  REGEL_STAND[regelId] = e;
  LS.set('vt_regelStand', REGEL_STAND);
}

/* ---------- Fachbegriffe aus dem Unterricht (17.08.2026) ----------

   Elias: „die müssen inkludiert werden und als eigene vokabeln hinzugefügt
   werden. mach das alles für mich."

   Sie kommen hier dazu und nicht in vocab-data.js, weil diese Datei aus dem
   arabicroots-Abzug erzeugt wird - ein Eintrag von Hand darin waere beim
   naechsten Backfill still weg. Der Zeitpunkt ist bewusst VOR initProgress():
   die Funktion legt fuer jedes Wort ohne Eintrag eine Startbox an, und ohne
   sie taeuchten die fuenfzehn nie in „Jetzt lernen" auf.

   Der typeof-Test haelt die App lauffaehig, falls data/fachbegriffe.js einmal
   nicht geladen ist - dann fehlen fuenfzehn Vokabeln, statt dass gar nichts geht. */
if (typeof FACHBEGRIFF_VOKABELN !== 'undefined' && Array.isArray(FACHBEGRIFF_VOKABELN)){
  /* ⚠️ Die ausgeblendeten ueberspringen (18.08.2026). Die Liste wird hier
     DIREKT aus dem Speicher gelesen und nicht ueber istGeloescht(): GELOESCHT
     ist ein `let` und wird erst weiter unten angelegt - ein Zugriff hier waere
     in der zeitlichen Totzone und stuerzte ab. */
  const wegRoh = LS.get('vt_geloescht', {});
  const weg = (wegRoh && typeof wegRoh === 'object' && !Array.isArray(wegRoh)) ? wegRoh : {};
  VOCAB_DATA.push(...FACHBEGRIFF_VOKABELN.filter(w => !(weg[w.id] && weg[w.id].an)));
}

/* ---------- Pluralformen als eigene Karteikarten (18.08.2026) -------------

   Elias am 18.08. um 04:xx: „ich finde eigentlich, dass die plural formen
   eigene karteikarten bekommen sollten aber noch nicht jetzt, jetzt arbeite
   ich nicht mal mit ihnen und brauche sie deswegen noch nicht."
   Und um 06:0x, mitten in der Nachtschicht: „du kannst sie schonmal bauen."

   ⭐ Aus diesen zwei Saetzen zusammen folgt die Bauform: die Faehigkeit ist da,
   der Schalter steht auf AUS. Waere sie sofort an, staenden ueber Nacht 120
   zusaetzliche Karten in Kasten 1 - genau das, was er mit „brauche sie noch
   nicht" ausgeschlossen hat.

   Die Karten sind ABGELEITET, nicht gespeichert: sie entstehen bei jedem Start
   aus dem `pl`-Feld der Grundvokabel. Damit kann nichts veralten, wenn der
   arabicroots-Abzug einen Plural korrigiert.

   ⚠️ Die deutsche Seite bekommt „(Plural)" fest in den Text statt nur ein
   Abzeichen in der Oberflaeche. Grund: derselbe Text laeuft durch die
   Lernkarte, die Wortlisten, die Suche und den Hoermodus. Ein Abzeichen haette
   an jeder dieser Stellen einzeln nachgebaut werden muessen - und in der
   Abfragerichtung Deutsch→Arabisch waere aus „Haus" sonst بَيْتٌ statt بُيُوتٌ
   geworden, ohne dass die Karte etwas falsch macht.

   ⛔ Der deutsche Plural wird NICHT gebildet. „Haus" → „Häuser" ginge, „Lehrer"
   → „Lehrer" auch, aber es gibt keinen Weg, das ohne Raten zu tun (Regel 6,
   Goal-Prompt E.1). Die Karte fragt die arabische Form ab, und dafuer genuegt
   die Bedeutung mit dem Vermerk.

   ⛔ Kein Beispielsatz, kein Koranbeleg, keine Eselsbruecke wird uebernommen -
   die stehen alle im Singular und waeren auf einer Pluralkarte irrefuehrend.
   (Notiz am Rande fuer spaeter: ein Teil der `alt2`-Eselsbruecken erklaert
   ohnehin nur den Plural. Genau die gehoerten HIERHER statt auf die
   Singularkarte. Das ist eine Einzelfallentscheidung je Text und deshalb
   nichts fuer einen Automatismus.) */
const PLURAL_MARKE = '#pl';
function istPluralKarte(id){
  return typeof id === 'string' && id.endsWith(PLURAL_MARKE);
}

/* Was die Sprachausgabe von einem Wort vorlesen soll.

   ⚠️ Sieben Woerter haben zwei Pluralformen, im Abzug mit Schraegstrich
   geschrieben („بُيُوتٌ / أَبْيَاتٌ"). Auf der Karte gehoeren beide hin - der
   Vorleser wuerde daraus aber einen Satz mit Trennzeichen machen. Er bekommt
   deshalb nur die erste Form.

   ⭐ Steht an EINER Stelle, weil vier Aufrufer sie brauchen (Lernkarte,
   Wortkarte, Hoermodus zweimal). Vorher schrieb jeder `w.sg || w.ar` fuer
   sich hin, und einer davon liess das `sg` sogar weg - solche Abweichungen
   faellt niemandem auf, solange kein Wort sie sichtbar macht. */
function sprechText(w){
  if (!w) return '';
  const roh = w.sg || w.ar || '';
  return roh.split('/')[0].trim() || roh;
}

/* Aus einer Grundvokabel die Pluralkarte bauen - oder null, wenn es keinen
   Plural gibt. Sieben Woerter haben zwei Pluralformen („بُيُوتٌ / أَبْيَاتٌ");
   die stehen bewusst zusammen auf EINER Karte. Zwei Karten daraus zu machen
   haette eine Reihenfolge behauptet, die im Abzug nicht steht. */
function bauePluralKarte(w){
  if (!w || !w.pl || istPluralKarte(w.id)) return null;
  return {
    id: w.id + PLURAL_MARKE,
    ar: w.pl,
    de: (w.de || '') + ' (Plural)',
    chapter: w.chapter,
    type: w.type,
    gender: w.gender,
    root: w.root,
    /* Die Herkunft bleibt am Datensatz haengen: die Oberflaeche zeigt darueber
       „Plural von بَيْتٌ", und ein spaeterer Sprung zur Grundkarte braucht
       keine Zerlegung der Id. */
    istPlural: true,
    plVon: w.id,
    sgAr: w.ar
  };
}

/* Schaltet die Pluralkarten an oder aus. Wird beim Start EINMAL aufgerufen und
   danach bei jedem Umlegen des Schalters.

   ⚠️ Beim Start liest der Aufrufer den Wert aus dem Speicher, NICHT aus
   SETTINGS: SETTINGS ist ein `let` und entsteht erst rund 270 Zeilen weiter
   unten. Derselbe Fallstrick hat am 18.08. schon die Fachbegriffe erwischt -
   ein Zugriff waere in der zeitlichen Totzone und stuerzte ab.

   Der Fortschritt der Pluralkarten bleibt beim Ausschalten stehen. initProgress
   loescht nichts, es traegt nur Fehlendes nach; wer die Karten wieder
   einschaltet, findet seine Kaesten so vor, wie er sie verlassen hat. */
function wendePluralKartenAn(an){
  const vorher = VOCAB_DATA.length;
  for (let i = VOCAB_DATA.length - 1; i >= 0; i--){
    if (istPluralKarte(VOCAB_DATA[i].id)) VOCAB_DATA.splice(i, 1);
  }
  if (an){
    const neu = [];
    VOCAB_DATA.forEach(w => { const p = bauePluralKarte(w); if (p) neu.push(p); });
    VOCAB_DATA.push(...neu);
  }
  return { vorher, nachher: VOCAB_DATA.length };
}

wendePluralKartenAn(!!(LS.get('vt_settings', {}) || {}).pluralKarten);

function addPersonalVocab({ar, de, sentAr, sentDe}){
  const w = { id:'p_'+Date.now(), ar, de, chapter:'personal', type:'noun' };
  if (sentAr) w.sentAr = sentAr;
  if (sentDe) w.sentDe = sentDe;
  PERSONAL_VOCAB.push(w);
  savePersonalVocab();
  VOCAB_DATA.push(w);
  PROGRESS[w.id] = { box:1, nextReview: todayStr(0), correct:0, wrong:0 };
  saveProgress();
  return w;
}

/* ---------- Eigene Vokabel wieder loswerden (Elias, 18.08.2026) ----------

   „vorallem will ich auch die möglichkeit haben meine eigenen vokabeln auch
   wieder zu löschen. das kann ich aktuell nicht."

   Er hatte recht: es gab `addPersonalVocab`, aber kein Gegenstueck. Wer sich
   vertippte, hatte das Wort fuer immer im Stapel.

   ⚠️ An FUENF Stellen aufraeumen, nicht nur in der Liste. Ein Wort, das nur aus
   PERSONAL_VOCAB verschwindet, hinterlaesst einen Fortschrittseintrag (der in
   die Statistik zaehlt), eine Notiz, eine Markierung und womoeglich einen Chip
   in einer eigenen Kategorie - lauter Reste, die niemand mehr zuordnen kann,
   weil das Wort dazu fehlt.

   ⛔ NUR fuer eigene Vokabeln. Ein Wort aus dem arabicroots-Abzug zu loeschen
   waere sinnlos: der naechste Abzug brachte es zurueck. */
/* ---------- Ausgeblendete Fachbegriffe (18.08.2026) ----------

   Elias: „fachbegriffe möchte ich auch löschen können."

   ⚠️ Sie lassen sich nicht wie eigene Vokabeln loeschen: sie stehen in
   data/fachbegriffe.js, einer ausgelieferten Datei. Was dort steht, ist beim
   naechsten Laden wieder da. Deshalb eine Liste der Ids, die beim Einhaengen
   uebersprungen werden - das Loeschen ist aus seiner Sicht dasselbe, nur dass
   es die Datei nicht anfasst.

   Der Zeitstempel je Id ist wie bei BEKANNT: beim Geraeteabgleich muss auch das
   ZURUECKHOLEN ankommen, nicht nur das Loeschen. */
const GELOESCHT_SCHLUESSEL = 'vt_geloescht';
let GELOESCHT = LS.get(GELOESCHT_SCHLUESSEL, {});
if (!GELOESCHT || typeof GELOESCHT !== 'object' || Array.isArray(GELOESCHT)) GELOESCHT = {};
function istGeloescht(id){ const e = GELOESCHT[id]; return !!(e && e.an); }

function loeschePersonalVocab(id){
  const w = VOCAB_DATA.find(x => x.id === id);
  if (!w || (w.chapter !== 'personal' && w.chapter !== 'grammar')) return false;

  /* ⚠️ Seit C8 (18.08.2026) stehen unter 'personal' ZWEI Herkuenfte: was Elias
     hier im Trainer angelegt hat (PERSONAL_VOCAB im Geraetespeicher) und was er
     sich auf arabicroots eingetragen hat (data/vokabeln-eigene.js, erkennbar an
     `source:'personal_vocabulary'`). Nur das Erste laesst sich wirklich
     loeschen; das Zweite kommt aus einer Datei und wird - wie die Fachbegriffe -
     ausgeblendet.

     Ohne diese Unterscheidung waere das Loeschen eines arabicroots-Wortes eine
     Scheinfunktion: es verschwaende aus der Liste und stuende beim naechsten
     Start wieder da. Genau diese Art Fehler faellt niemandem auf, weil sie im
     Moment des Klickens richtig aussieht. */
  const ausDatei = w.source === 'personal_vocabulary';
  if (w.chapter === 'personal' && !ausDatei){
    PERSONAL_VOCAB = PERSONAL_VOCAB.filter(x => x.id !== id);
    savePersonalVocab();
  } else {
    GELOESCHT[id] = { an: true, zeit: Date.now() };
    LS.set(GELOESCHT_SCHLUESSEL, GELOESCHT);
  }

  const i = VOCAB_DATA.findIndex(x => x.id === id);
  if (i >= 0) VOCAB_DATA.splice(i, 1);

  delete PROGRESS[id];
  saveProgress();

  if (typeof NOTES !== 'undefined' && NOTES && NOTES[id] !== undefined){
    delete NOTES[id];
    if (typeof saveNotes === 'function') saveNotes();
  }
  if (typeof BEKANNT !== 'undefined' && BEKANNT && BEKANNT[id] !== undefined){
    delete BEKANNT[id];
    LS.set(BEKANNT_SCHLUESSEL, BEKANNT);
  }
  if (typeof VORSCHLAG_WAHL !== 'undefined' && VORSCHLAG_WAHL && VORSCHLAG_WAHL[id] !== undefined){
    delete VORSCHLAG_WAHL[id];
    LS.set(VORSCHLAG_SCHLUESSEL, VORSCHLAG_WAHL);
  }
  if (typeof CUSTOM_CATS !== 'undefined' && Array.isArray(CUSTOM_CATS)){
    let beruehrt = false;
    CUSTOM_CATS.forEach(c => {
      const vorher = c.wordIds.length;
      c.wordIds = c.wordIds.filter(x => x !== id);
      if (c.wordIds.length !== vorher) beruehrt = true;
    });
    if (beruehrt && typeof saveCustomCats === 'function') saveCustomCats();
  }
  return true;
}

/* ---------- Vokabeln bearbeiten (Elias, 18.08.2026) ----------

   „ich will auch die vokabeln bearbeiten können, alle."

   ⭐ Zwei verschiedene Wege, und der Unterschied ist wichtig:

   - EIGENE Vokabeln stehen in `vt_personalVocab` und werden dort direkt
     geaendert. Sie gehoeren ihm, es gibt keine zweite Fassung.
   - BUCHVOKABELN kommen aus dem arabicroots-Abzug. Sie direkt zu aendern waere
     wirkungslos: `hole-vokabeln.mjs` schreibt vocab-data.js beim naechsten Lauf
     neu, und die Aenderung waere stillschweigend weg. Deshalb liegt seine
     Fassung DANEBEN, in `vt_wortAenderungen`, und wird beim Start darueber
     gelegt. Der Abzug bleibt der Abzug, seine Korrektur bleibt seine.

   Das ist dieselbe Trennung wie bei den Eselsbruecken: sein Text schlaegt den
   vorgeschlagenen, ohne ihn zu ueberschreiben. */
const AENDERUNGS_SCHLUESSEL = 'vt_wortAenderungen';
let WORT_AENDERUNGEN = LS.get(AENDERUNGS_SCHLUESSEL, {});
if (!WORT_AENDERUNGEN || typeof WORT_AENDERUNGEN !== 'object' || Array.isArray(WORT_AENDERUNGEN)) WORT_AENDERUNGEN = {};

/* Welche Felder er ueberhaupt anfassen darf. Bewusst eine feste Liste und kein
   Object.assign: sonst koennte ein alter oder kaputter Eintrag `id`, `chapter`
   oder `book` ueberschreiben und das Wort aus jeder Auswahl fallen lassen. */
const AENDERBAR = ['ar','de','sentAr','sentDe','pl','root'];

function wendeWortAenderungenAn(){
  Object.keys(WORT_AENDERUNGEN).forEach(id => {
    const w = VOCAB_DATA.find(x => x.id === id);
    if (!w) return;
    const a = WORT_AENDERUNGEN[id];
    if (!a || typeof a !== 'object') return;
    AENDERBAR.forEach(f => { if (typeof a[f] === 'string') w[f] = a[f]; });
  });
}

function speichereWortAenderung(id, felder){
  const w = VOCAB_DATA.find(x => x.id === id);
  if (!w) return false;
  const sauber = {};
  AENDERBAR.forEach(f => { if (typeof felder[f] === 'string') sauber[f] = felder[f].trim(); });
  if (!sauber.ar || !sauber.de) return false;      /* ohne die beiden ist es keine Vokabel */

  if (w.chapter === 'personal'){
    /* Seine eigene Vokabel: direkt am Original aendern, kein Zweitspeicher. */
    const eigen = PERSONAL_VOCAB.find(x => x.id === id);
    if (eigen) AENDERBAR.forEach(f => { if (sauber[f] !== undefined) eigen[f] = sauber[f]; });
    savePersonalVocab();
  } else {
    WORT_AENDERUNGEN[id] = Object.assign({}, WORT_AENDERUNGEN[id], sauber, { zeit: Date.now() });
    LS.set(AENDERUNGS_SCHLUESSEL, WORT_AENDERUNGEN);
  }
  AENDERBAR.forEach(f => { if (sauber[f] !== undefined) w[f] = sauber[f]; });
  return true;
}

/* Zurueck auf den Abzug - nur bei Buchvokabeln sinnvoll. Ohne diesen Weg waere
   jede Korrektur eine Einbahnstrasse, derselbe Fehler wie beim
   „Kenne ich schon"-Knopf ohne seine Liste in den Einstellungen. */
function verwirfWortAenderung(id){
  if (!WORT_AENDERUNGEN[id]) return false;
  delete WORT_AENDERUNGEN[id];
  LS.set(AENDERUNGS_SCHLUESSEL, WORT_AENDERUNGEN);
  return true;
}

/* ⚠️ Hier und nicht oben bei den Fachbegriffen: `WORT_AENDERUNGEN` ist ein
   `let` und liegt bis zu seiner Zeile in der zeitlichen Totzone - ein Aufruf
   davor stuerzte mit ReferenceError ab. Es genuegt, dass es VOR initProgress()
   steht (Zeile ~447), und das tut es. */
wendeWortAenderungenAn();

/* ---------- „Kenne ich schon" (17.08.2026) ----------

   Elias: „so sachen wie ja auf arabisch oder nein oder imam oder sowas was
   irgendwie selbstverständlich oder auch sehr einfach oder mit grundwissen ist
   brauche ich nicht wie moschee oder ja oder sowas halt."

   ⛔ Die Auswahl trifft ER. Hier steht bewusst KEINE Liste „zu leichter"
   Woerter von mir - was fuer ihn selbstverstaendlich ist, waere fuer einen
   anderen Lerner neu, und andersherum. Der Knopf auf der Lernkarte ist der
   einzige Weg hinein, die Liste in den Einstellungen der einzige hinaus.

   ⭐ Warum ein Zeitstempel je Wort und nicht einfach eine Id-Liste: Beim
   Geraeteabgleich muss auch das ZURUECKNEHMEN ankommen. Bei zwei nackten
   Listen waere die Vereinigung das Naheliegende - und die holt ein
   zurueckgenommenes Wort vom anderen Geraet sofort wieder herein, ohne dass
   irgendwo ein Fehler auftraete. Mit `{an:false, zeit:…}` bleibt die Ruecknahme
   eine Tatsache mit Datum, und die spaetere Entscheidung gewinnt. */
const BEKANNT_SCHLUESSEL = 'vt_bekannt';
let BEKANNT = LS.get(BEKANNT_SCHLUESSEL, {});
if (!BEKANNT || typeof BEKANNT !== 'object' || Array.isArray(BEKANNT)) BEKANNT = {};

function kennErSchon(w){
  if (!w) return false;
  const e = BEKANNT[w.id];
  return !!(e && e.an);
}

function setzeKennErSchon(id, an){
  BEKANNT[id] = { an: !!an, zeit: Date.now() };
  LS.set(BEKANNT_SCHLUESSEL, BEKANNT);
}

/* Die Woerter hinter den Markierungen - fuer die Liste in den Einstellungen.
   ⚠️ Ueber VOCAB_DATA und nicht ueber buchVokabeln(): ein ausgeblendetes Wort
   aus einem gerade abgewaehlten Buch waere sonst unsichtbar UND weiterhin
   ausgeblendet. Genau die Falle, gegen die die Liste ueberhaupt gebaut ist. */
function bekannteMarkierungen(){
  return Object.keys(BEKANNT)
    .filter(id => BEKANNT[id] && BEKANNT[id].an)
    .map(id => VOCAB_DATA.find(w => w.id === id))
    .filter(Boolean)
    .sort((a,b) => (BEKANNT[b.id].zeit || 0) - (BEKANNT[a.id].zeit || 0));
}

/* ---------- Welcher Eselsbruecken-Vorschlag gilt (18.08.2026) ----------

   Elias: „wenn ich einen anderen vorschlag durchlese und der gut ist, ihn aber
   nicht speichere dann wird der ursprüngliche vorschlag wieder angezeigt. ich
   will aber erstmal noch nicht speichern. die vorschläge sollten mir bei der
   karte das anzeigen die ich auch ausgewählt habe auch wenn ich nicht
   gespeichert habe."

   Vorher war das Blaettern rein fluechtig: `VORSCHLAG_NR` lebte nur, solange
   das Notizfenster offen war, und die Karte zeigte danach wieder `w.mnemo`.
   Wer den dritten Vorschlag gut fand, hatte nur die Wahl zwischen „uebernehmen
   und speichern" und „vergessen".

   ⛔ Das ist AUSDRUECKLICH keine Uebernahme. Punkt 8 (10.08.2026) bleibt
   unangetastet: gespeichert wird nur, was er selbst ins Feld schreibt und mit
   „Speichern" bestaetigt. Hier wird lediglich gemerkt, WELCHEN der vorgelegten
   Texte er sehen will - `vt_notes` wird nicht angefasst, der Text bleibt als
   „Vorschlag:" beschriftet, und der Punkt auf der Vorderseite geht nicht an.

   ⭐ Gespeichert wird die NUMMER, nicht der Text. Wird eine Eselsbruecke in
   data/eselsbruecken-alt.js spaeter verbessert, sieht er die verbesserte
   Fassung - beim Text stuende seine alte Kopie fuer immer da, ohne dass es je
   auffiele. Zeitstempel wie bei BEKANNT, damit der Geraeteabgleich je Wort die
   spaetere Entscheidung nehmen kann. */
const VORSCHLAG_SCHLUESSEL = 'vt_vorschlagNr';
let VORSCHLAG_WAHL = LS.get(VORSCHLAG_SCHLUESSEL, {});
if (!VORSCHLAG_WAHL || typeof VORSCHLAG_WAHL !== 'object' || Array.isArray(VORSCHLAG_WAHL)) VORSCHLAG_WAHL = {};

/* ⚠️ `anzahl` ist Pflicht und wird geprueft: die Liste kann schrumpfen, wenn
   ein Wort seine Alternativen verliert. Eine Nummer ins Leere wuerde sonst
   einen leeren Vorschlagskasten zeigen - sichtbar kaputt, aber ohne Fehler. */
function gewaehlterVorschlag(id, anzahl){
  const e = VORSCHLAG_WAHL[id];
  const nr = (e && typeof e.nr === 'number') ? e.nr : 0;
  return (nr > 0 && nr < anzahl) ? nr : 0;
}

function setzeGewaehltenVorschlag(id, nr){
  VORSCHLAG_WAHL[id] = { nr: Number(nr) || 0, zeit: Date.now() };
  LS.set(VORSCHLAG_SCHLUESSEL, VORSCHLAG_WAHL);
}

/* ---------- Verworfene Vorschlaege (Elias, 19.08.2026) ----------

   "wenn ich vorschlaege finde die ich gar nicht gut finde ... das ich da auch
   einen knopf habe der aussagt, dass dieser vorschlag entfernt und verbessert
   bzw ausgetauscht werden muss durch einen besseren."

   Aufbau: { wortId: { nummer: { text, zeit } } }

   ⭐ Der TEXT wird mitgespeichert, nicht nur die Nummer. data/eselsbruecken-alt.js
   kann sich aendern; eine gespeicherte 2 zeigte dann auf einen anderen
   Vorschlag als den, den er abgelehnt hat. Der Text ueberlebt das.

   ⚠️ Verworfen heisst NICHT versteckt. Der Vorschlag bleibt sichtbar und
   traegt eine Marke — sonst verschwaende beim Verwerfen des letzten
   Vorschlags der ganze Kasten, und er saehe nicht mehr, was er abgelehnt
   hat. */
const VORSCHLAG_WEG_SCHLUESSEL = 'vt_vorschlagWeg';
let VORSCHLAG_WEG = LS.get(VORSCHLAG_WEG_SCHLUESSEL, {});
if (!VORSCHLAG_WEG || typeof VORSCHLAG_WEG !== 'object' || Array.isArray(VORSCHLAG_WEG)) VORSCHLAG_WEG = {};

function istVorschlagVerworfen(id, nr){
  const e = VORSCHLAG_WEG[id];
  return !!(e && e[String(nr)]);
}

/* Nochmal derselbe Knopf nimmt die Ablehnung zurueck — ohne das kaeme er aus
   einem Fehlgriff nicht mehr heraus. Gibt zurueck, ob es jetzt verworfen ist. */
function schalteVorschlagWeg(id, nr, text){
  const schl = String(nr);
  const e = VORSCHLAG_WEG[id] || {};
  if (e[schl]) { delete e[schl]; }
  else { e[schl] = { text: String(text || '').slice(0, 400), zeit: Date.now() }; }
  if (Object.keys(e).length) VORSCHLAG_WEG[id] = e; else delete VORSCHLAG_WEG[id];
  LS.set(VORSCHLAG_WEG_SCHLUESSEL, VORSCHLAG_WEG);
  return !!(VORSCHLAG_WEG[id] && VORSCHLAG_WEG[id][schl]);
}

/* Fortschritt initialisieren: Startbox aus Arabic-Roots-Daten importieren.
   WICHTIG: Laeuft NICHT nur beim allerersten Start. Frueher stieg die Funktion bei
   vorhandenem Speicherstand sofort aus - Vokabeln, die spaeter zu VOCAB_DATA
   dazukamen (neu freigeschaltete Kapitel, Backfill), bekamen dadurch nie einen
   PROGRESS-Eintrag und tauchten nie in "Jetzt lernen" auf, obwohl sie in den
   Kategorien sichtbar waren. Jetzt werden fehlende Eintraege bei jedem Start
   nachgetragen, ohne bestehenden Fortschritt anzufassen. */
function initProgress(){
  let progress = LS.get('vt_progress', null);
  let changed = false;
  if (!progress){ progress = {}; changed = true; }
  VOCAB_DATA.forEach(w=>{
    if (!progress[w.id]){
      progress[w.id] = { box: w.box || 1, nextReview: todayStr(0), correct:0, wrong:0 };
      changed = true;
    }
  });
  if (changed) LS.set('vt_progress', progress);
  return progress;
}
let PROGRESS = initProgress();
function saveProgress(){ LS.set('vt_progress', PROGRESS); }

let SETTINGS = Object.assign(
  /* showVerbFormen steht bewusst auf FALSE. Die vier Verbformen waren am
     29.07.2026 auf Elias' Wunsch dazugekommen, und am 30.07. hat er sie so
     wieder abbestellt: "du solltest da die 4 zeitformen nicht zeigen. die
     sollen da raus." Der Schalter bleibt, damit er sie holen kann, wenn er
     sie braucht - aber der Standard ist aus.

     showQuran genauso, seit dem 31.07.2026: "blende die quran bezuege in der
     app aus". Betroffen ist der KURATIERTE Beleg (das Feld `quran` an einer
     Vokabel, ein Vers, in dem genau dieses Wort vorkommt) - nicht der
     Quran-Leser und nicht die Haeufigkeitsangabe aus dem Quranic Arabic
     Corpus; das sind eigene Sachen mit eigenen Namen in der Oberflaeche.
     Die Belege bleiben in vocab-data.js stehen, sie werden nur nicht
     angezeigt: geprueft und belegt ist Arbeit, die man nicht wegwirft, nur
     weil sie gerade nicht auf dem Bildschirm sein soll. */
  /* pluralKarten steht aus demselben Grund auf FALSE wie showVerbFormen: Elias
     hat die Pluralkarten am 18.08.2026 ausdruecklich bestellt UND ausdruecklich
     noch nicht in Betrieb genommen („brauche sie deswegen noch nicht" /
     „du kannst sie schonmal bauen"). Der Schalter liegt in den Einstellungen
     unter „Lernkarte". */
  { showPlural:false, pluralKarten:false, showVerbFormen:false, showQuran:false, sessionSize:20, voiceURI:null, direction:'ar-de', selectedChapters:[], wrongOnly:false, grammarHighlight:true },
  LS.get('vt_settings', {})
);
/* ---------- Zeitstempel JE EINSTELLUNG (17.08.2026) ----------

   Elias: "lernrichtung ist bei mir wieder von arabisch zu deutsch automatisch
   gewechselt, das ist ein echtes problem. ich will gemischt haben."

   ⛔ Die Ursache war der Abgleich, und sie ist am Datenstand belegt: im KV lag
   `direction: "mixed"` mit Stempel **16.08. 23:42**, auf dem Handy stand
   „gemischt", auf dem Tablet „ar-de". `vt_settings` wurde bis dahin als EIN
   BLOCK zusammengefuehrt - der juengere Stempel gewinnt und bringt ALLE seine
   Werte mit.

   ⭐ Der Haken daran: In `SETTINGS` liegen auch Buch- und Kapitelauswahl. Ein
   Tippen auf einen Kapitel-Chip stempelt damit den **ganzen** Block frisch -
   und dieser frische Stempel verteidigt anschliessend eine ALTE Lernrichtung
   gegen die neuere vom anderen Geraet. Kein Fehler in der Richtungslogik, kein
   Fehler beim Speichern: eine Einstellung wird von einer voellig anderen
   ueberfahren, nur weil sie zufaellig im selben JSON steht.

   Deshalb bekommt jedes Feld seinen eigenen Stempel, und der Abgleich mischt
   feldweise - genau wie er den Fortschritt wortweise mischt. */
const SETTINGS_FELD_SCHLUESSEL = 'vt_settingsFeld';

function settingsFeldStempel(){
  let karte = {};
  try { karte = JSON.parse(localStorage.getItem(SETTINGS_FELD_SCHLUESSEL) || '{}'); }
  catch (e){ karte = {}; }
  if (karte && Object.keys(karte).length) return karte;

  /* ⚠️ Erstbelegung, und sie ist keine Kosmetik. Ohne Startwert haben beide
     Geraete fuer jedes Feld die Stempelzeit 0 - dann gewinnt bei jedem
     Vergleich das Lokale, und der feldweise Abgleich taete gar nichts. Genau
     das war am 17.08.2026 zu sehen: `direction` stand im KV richtig auf
     "mixed", die Stempelkarte war aber leer, weil Elias' Umstellung auf dem
     Geraet keinen Unterschied erzeugt hatte (dort stand der Wert schon so).

     Als Startwert dient der alte BLOCK-Stempel: er sagt zwar nur, wann
     irgendetwas an den Einstellungen zuletzt geschrieben wurde, ist aber die
     einzige echte Zeitangabe, die es fuer diesen Stand gibt. Ab der ersten
     bewussten Aenderung ueberschreibt saveSettings() ihn feldgenau. */
  let block = 0;
  try {
    const s = JSON.parse(localStorage.getItem('vt_syncStempel') || '{}');
    block = s['vt_settings'] || 0;
  } catch (e){ }
  if (!block) return {};                    /* nie abgeglichen: nichts zu erben */
  const gesetzt = {};
  Object.keys(SETTINGS).forEach(f => { gesetzt[f] = block; });
  try { localStorage.setItem(SETTINGS_FELD_SCHLUESSEL, JSON.stringify(gesetzt)); } catch (e){ }
  return gesetzt;
}

function saveSettings(){
  /* Nur die WIRKLICH geaenderten Felder stempeln. Wer alle stempelt, hat den
     Blockfehler nur eine Ebene tiefer wiederholt. */
  let alt = {};
  try { alt = JSON.parse(localStorage.getItem('vt_settings') || '{}'); } catch (e){}
  const stempel = settingsFeldStempel();
  const jetzt = Date.now();
  Object.keys(SETTINGS).forEach(f => {
    if (JSON.stringify(SETTINGS[f]) !== JSON.stringify(alt[f])) stempel[f] = jetzt;
  });
  try { localStorage.setItem(SETTINGS_FELD_SCHLUESSEL, JSON.stringify(stempel)); } catch (e){}
  LS.set('vt_settings', SETTINGS);
}

/* Nach einem Abgleich mit einem anderen Geraet steht der neue Stand zwar im
   localStorage, aber PROGRESS und SETTINGS haelt die App im Arbeitsspeicher.
   Ohne dieses Neueinlesen wuerde der naechste lokale Schreibvorgang das gerade
   Geholte sofort wieder ueberschreiben - der Abgleich saehe aus, als haette er
   nicht stattgefunden. Aufgerufen von js/sync.js. */
function ladeStandNeu(){
  PROGRESS = initProgress();
  const frisch = LS.get('vt_settings', null);
  if (frisch) Object.assign(SETTINGS, frisch);
  /* ⚠️ BEKANNT liegt als Variable im Speicher, nicht nur im localStorage. Ohne
     dieses Nachlesen haette der Abgleich die Markierungen zwar geholt, die
     laufende Seite arbeitete aber weiter mit dem alten Stand - und der naechste
     Griff an den Knopf schriebe ihn zurueck. Dieselbe Falle wie bei SETTINGS
     eine Zeile darueber. */
  const bekanntFrisch = LS.get(BEKANNT_SCHLUESSEL, null);
  if (bekanntFrisch && typeof bekanntFrisch === 'object' && !Array.isArray(bekanntFrisch)){
    BEKANNT = bekanntFrisch;
  }
  /* Dieselbe Falle wie eine Zeile darueber, aus demselben Grund. */
  const wahlFrisch = LS.get(VORSCHLAG_SCHLUESSEL, null);
  if (wahlFrisch && typeof wahlFrisch === 'object' && !Array.isArray(wahlFrisch)){
    VORSCHLAG_WAHL = wahlFrisch;
  }
  /* Seine Korrekturen ebenso - und danach neu ueberlegen, sonst zeigt die
     laufende Seite weiter den Text aus dem Abzug. */
  const aendFrisch = LS.get(AENDERUNGS_SCHLUESSEL, null);
  if (aendFrisch && typeof aendFrisch === 'object' && !Array.isArray(aendFrisch)){
    WORT_AENDERUNGEN = aendFrisch;
    wendeWortAenderungenAn();
  }
  if (typeof renderHome === 'function') renderHome();
  if (typeof renderCategories === 'function') renderCategories();
  /* ⚠️ Auch den Einstellungs-Bildschirm nachziehen (17.08.2026). Ohne das zeigt
     das Auswahlfeld weiter den alten Wert, obwohl SETTINGS schon den neuen
     traegt - und der naechste Griff dorthin schreibt den angezeigten, also
     falschen, Wert zurueck. Genau so haette sich die Lernrichtung selbst nach
     dem Merge wieder umgestellt. */
  if (typeof renderSettings === 'function' &&
      document.getElementById('screen-settings') &&
      document.getElementById('screen-settings').classList.contains('active')) renderSettings();
  if (typeof passeRundeAnAuswahlAn === 'function') passeRundeAnAuswahlAn();
}

/* Eigene Eselsbruecken pro Vokabel (arabicroots-Paritaet D): { [vokabelId]: Text }.
   Bewusst getrennt von PROGRESS - beim "Fortschritt zuruecksetzen" soll das,
   was Elias sich selbst ausgedacht hat, nicht mit weggeworfen werden. */
let NOTES = LS.get('vt_notes', {});
function saveNotes(){ LS.set('vt_notes', NOTES); }
function getNote(id){ return (NOTES[id] || '').trim(); }
function setNote(id, text){
  const t = (text || '').trim();
  if (t) NOTES[id] = t; else delete NOTES[id];
  saveNotes();
}

let CUSTOM_CATS = LS.get('vt_customCats', []);
function saveCustomCats(){ LS.set('vt_customCats', CUSTOM_CATS); }

/* ---------- Streak ---------- */
/* Ein verpasster Tag hat die Serie bisher hart auf 1 zurueckgesetzt. Wer nach
   vierzig Tagen einmal krank ist oder eine Klausur schreibt, faengt bei null
   an - das bestraft das Leben, nicht die Nachlaessigkeit. Deshalb ein
   Gnadentag: EIN uebersprungener Tag laesst die Serie stehen, statt sie zu
   loeschen. Sie waechst an so einem Tag aber auch nicht, und der naechste
   Gnadentag ist erst nach einer Woche wieder zu haben - sonst waere es kein
   Gnadentag mehr, sondern jeder zweite Tag frei. */
function touchStreak(){
  let s = LS.get('vt_streak', {count:0,last:null,gnadeAm:null});
  const t = todayStr(0), y = todayStr(-1), vy = todayStr(-2);
  const vorher = s.count;
  if (s.last === t) { /* schon heute gezaehlt */ }
  else if (s.last === y) { s.count += 1; s.last = t; }
  else if (s.last === vy && gnadeVerfuegbar(s, t)) {
    /* Genau ein Tag ausgelassen und die Gnade ist frei: Serie bleibt stehen. */
    s.count += 1; s.last = t; s.gnadeAm = t;
    toast('Gestern ausgelassen — die Serie zählt trotzdem weiter.');
  }
  else { s.count = 1; s.last = t; }
  LS.set('vt_streak', s);
  if (s.count !== vorher){
    const badge = document.getElementById('streakBadge');
    const zahl = document.getElementById('streakCount');
    if (zahl) zahl.textContent = s.count;
    if (badge && !REDUCED_MOTION){
      badge.classList.remove('bump');
      void badge.offsetWidth;
      badge.classList.add('bump');
    }
    /* Serien-Meilenstein (js/feier.js). Elias' ausdruecklicher Wunsch: "Wenn man
       zum Beispiel eine Woche lang dauerhaft gelernt hat, dann kommt zum
       Beispiel Konfetti."
       Nur INNERHALB dieses Zweigs, also nur wenn die Serie sich heute wirklich
       geaendert hat - sonst feuerte der Meilenstein bei jeder Karte des siebten
       Tages neu. Die Einmaligkeit steckt zusaetzlich in feiere() selbst; hier
       stehen also zwei Sperren hintereinander, und das ist Absicht. */
    if (typeof feiere === 'function' && typeof SERIE_MEILEN !== 'undefined'
        && SERIE_MEILEN.includes(s.count))
      feiere('serie-meilenstein', { tage: s.count });
  }
  return s;
}
/* Sieben Tage Abstand, gerechnet in Tagen statt in Millisekunden - die
   Datumsstrings sind ohnehin schon auf den Tag genau. */
function gnadeVerfuegbar(s, heute){
  if (!s.gnadeAm) return true;
  const tage = (new Date(heute) - new Date(s.gnadeAm)) / 86400000;
  return tage >= 7;
}
function getStreak(){ return LS.get('vt_streak', {count:0,last:null,gnadeAm:null}); }

/* ---------- Vocab helpers ---------- */
function byId(id){ return VOCAB_DATA.find(w=>w.id===id); }

/* Fisher-Yates, arbeitet auf einer Kopie. */
function shuffle(arr){
  const a = arr.slice();
  for (let i=a.length-1; i>0; i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Erst mischen, dann stabil nach Box sortieren: Die Leitner-Prioritaet (niedrige
   Box zuerst) bleibt erhalten, aber innerhalb einer Box ist die Reihenfolge
   zufaellig. Ohne das Mischen kam die Sitzung in VOCAB_DATA-Reihenfolge heraus -
   da alle Woerter anfangs in derselben Box liegen, bestand eine 20er-Runde
   ausschliesslich aus Kapitel 1. */
function dueWords(){
  const t = todayStr(0);
  const due = VOCAB_DATA.filter(w => PROGRESS[w.id] && PROGRESS[w.id].nextReview <= t);
  /* Zuerst das, was am laengsten ueberfaellig ist, danach die niedrige Box.
     Vorher entschied allein die Box - eine Karte aus Box 4, die seit zwei
     Wochen faellig ist, kam damit hinter jede frische Box-1-Karte, obwohl
     genau sie am ehesten vergessen wird. Innerhalb desselben Faelligkeitstags
     bleibt es beim Zufall (Fisher-Yates vorher), sonst bestuende eine
     20er-Runde wieder nur aus Kapitel 1. */
  return shuffle(due).sort((a,b)=>
    (PROGRESS[a.id].nextReview < PROGRESS[b.id].nextReview ? -1 :
     PROGRESS[a.id].nextReview > PROGRESS[b.id].nextReview ?  1 : 0)
    || PROGRESS[a.id].box - PROGRESS[b.id].box);
}
function allRoots(){
  const map = {};
  /* Nur das aktive Buch: die Wurzelliste steht im Kategorien-Bildschirm, und
     der zeigt sonst nach dem ersten Buchwechsel Wurzeln aus Buechern, die
     gerade gar nicht gelernt werden. */
  const quelle = (typeof buchVokabeln === 'function') ? buchVokabeln() : VOCAB_DATA;
  quelle.forEach(w=>{ if(w.root){ (map[w.root] = map[w.root]||[]).push(w.id); } });
  return map;
}

/* ---------- Wortfelder statt Wurzeln ----------
   Ersetzt seit dem 29.07.2026 die Wurzelliste im Kategorien-Bildschirm. Elias:
   "3 random arabische Buchstaben machen fuer mich als Wortstamm keinen Sinn."
   Die Tabelle steht in wortfelder-data.js, dort auch die Begruendung, warum
   das keine erfundene Sprachinformation ist.

   Ein Wort kann in mehreren Feldern liegen - ausdruecklich gewuenscht. */

/* Nur Tatweel und Leerraum weg - die Vokalzeichen bleiben AUSDRUECKLICH stehen.
   Sie wegzuwerfen war der erste Versuch und ein Fehler, der beim Nachmessen am
   29.07.2026 auffiel: ohne Taschkil ist مِنْ min ("von") nicht mehr von مَنْ man
   ("wer") zu unterscheiden, und beide sind Partikeln - der Wortart-Filter
   trennt sie also auch nicht. مَنْ landete dadurch unter den
   Genitivpraepositionen. Deshalb wird hier buchstabengenau verglichen, und
   Schreibvarianten stehen einzeln in der Tabelle. */
function wortfeldForm(s){
  return String(s || '').replace(/ـ/g, '').trim();
}

/* Die deutsche Uebersetzung in einzelne Woerter zerlegen. Bewusst ueber die
   Zeichenklasse und nicht ueber \b: \w kennt kein ä, ö, ü, ß, und "Füße"
   haette damit Wortgrenzen mitten im Wort. */
const WORTFELD_TRENNER = /[^A-Za-zÀ-ÿ]+/;

/* Verglichen wird nur GANZ oder mit ausdruecklichem Stern am Anfang.
   Ein Versuch, deutsche Komposita ueber die Wortendung mitzunehmen ("Klassen-
   zimmer" zu "Zimmer"), stand hier kurz und wurde nach der Messung wieder
   entfernt: er zog "durchbohren" zu Ohren, "unterdruecken" und "druecken" zu
   Ruecken, "staubsaugen" und "saugen" zu Augen, "gottesfuerchtiger" zu Tiger.
   Auch eine Mindestlaenge half nicht - "praktisch" endet auf "tisch". Eine
   falsche Einordnung ist schlimmer als eine fehlende, weil man ihr glaubt;
   Komposita gehoeren deshalb ausgeschrieben in die Tabelle. */
function wortfeldTreffer(text, woerter){
  const teile = String(text || '').toLowerCase().split(WORTFELD_TRENNER).filter(Boolean);
  return woerter.some(roh => {
    const suche = roh.toLowerCase();
    if (suche.endsWith('*')) return teile.some(t => t.startsWith(suche.slice(0, -1)));
    return teile.includes(suche);
  });
}

/* Steht dieses Wort buchstabengenau in einer Formenliste? */
function istEineDerFormen(w, formen){
  const form = wortfeldForm(w.sg || w.ar);
  return formen.some(f => wortfeldForm(f) === form);
}

/* Ein Feld kann mehrere Merkmale nennen; sie wirken als ODER. Gebraucht seit
   dem 29.07.2026 fuer „Adverbien": die Wortart deckt nur einen Teil ab, أَيْضاً
   „auch" steht im Abzug als `vocab` und waere sonst durchgefallen. */
function passtInsFeld(w, feld){
  /* Zwei Arten von Sperren, beide kippen einen Treffer unabhaengig davon,
     wodurch er zustande kam:
     `nicht`       - deutsche Doppeldeutigkeit ("ich weiss nicht" ist keine Farbe)
     `nichtFormen` - einzelne Woerter, die die Wortart des Abzugs falsch einordnet.
                     Siehe die Begruendung zu تَحْتَ und هُنَا in wortfelder-data.js:
                     Elias' Unterricht nennt sie Nomen, der Abzug nennt sie
                     Partikeln. Der Abzug bleibt unangetastet, die Ansicht folgt
                     dem Unterricht. */
  if (feld.nicht && wortfeldTreffer(w.de, feld.nicht)) return false;
  if (feld.nichtFormen && istEineDerFormen(w, feld.nichtFormen)) return false;

  if (feld.typ){
    const typen = Array.isArray(feld.typ) ? feld.typ : [feld.typ];
    if (typen.includes(w.type)) return true;
  }
  /* `formen` nimmt Partikeln UND Grammatik-Eintraege: لِ steht im Abzug als
     `grammar`, ist aber dieselbe Genitivpraeposition wie فِي. Ein Nomen kann
     hier nicht hineinrutschen, weil buchstabengenau mit Taschkil verglichen
     wird. */
  if (feld.formen && ['particle', 'grammar'].includes(w.type)
      && istEineDerFormen(w, feld.formen)) return true;

  if (feld.woerter && wortfeldTreffer(w.de, feld.woerter)) return true;
  return false;
}

const OHNE_WORTFELD = 'Noch ohne Wortfeld';

function wortfelder(){
  /* Nur die Woerter, die Elias kennt - seine Vorgabe vom 30.07.2026. Vorher stand
     hier buchVokabeln(), also alle 24 Kapitel des geladenen Buchs; unter "Tiere"
     standen dadurch Tiere aus Kapiteln, die er im Kurs noch nicht hatte. */
  const quelle = (typeof bekannteVokabeln === 'function') ? bekannteVokabeln()
               : (typeof buchVokabeln === 'function') ? buchVokabeln() : VOCAB_DATA;
  const tabelle = (typeof WORTFELDER !== 'undefined') ? WORTFELDER : [];
  const map = {};
  const rest = [];
  quelle.forEach(w => {
    let getroffen = false;
    tabelle.forEach(feld => {
      if (!passtInsFeld(w, feld)) return;
      (map[feld.name] = map[feld.name] || []).push(w.id);
      getroffen = true;
    });
    if (!getroffen) rest.push(w.id);
  });
  /* Der Rest steht bewusst mit drin und bewusst ganz unten: eine Vokabel darf
     durch diese Ansicht nicht unauffindbar werden. */
  if (rest.length) map[OHNE_WORTFELD] = rest;
  return map;
}
function isWeak(w){ return !!(PROGRESS[w.id] && PROGRESS[w.id].box<=2); }
function weakWords(){
  /* currentPool() filtert danach ohnehin aufs aktive Buch; die Sortierung
     bleibt hier bei der Boxnummer, weil "schwach" genau das meint. */
  return shuffle(VOCAB_DATA.filter(isWeak)).sort((a,b)=> PROGRESS[a.id].box - PROGRESS[b.id].box);
}
/* Gehoert diese Vokabel zur aktuellen Auswahl aus Buch und Kapiteln?

   Steht bewusst als EIGENE Funktion und nicht mehr nur in currentPool():
   dieselbe Frage muss auch eine LAUFENDE Runde beantworten koennen.

   ⚠️ Elias am 30.07.2026: "ich habe gerade ein bisschen die vokabelkarteien
   gemacht und sehe hier woerter die erst in spaeteren kapiteln haetten dran
   kommen sollen, obwohl ich nur kapitel 1-9 ausgewaehlt habe."
   Nachgestellt und bestaetigt: der Filter selbst rechnete richtig, aber eine
   schon LAUFENDE Runde behielt ihre Woerter. Wer mitten in einer Runde die
   Kapitel umstellt, lernte weiter Kapitel 13, 16, 18, 24 - im Browser gemessen.
   Die Runde wird jetzt mitgezogen, siehe passeRundeAnAuswahlAn() in
   js/lernen.js.

   Seit dem 11.08.2026 koennen MEHRERE Lehrwerke gleichzeitig gewaehlt sein,
   jedes mit seiner eigenen Kapitelauswahl (js/buecher.js). Der Buchfilter
   bleibt trotzdem noetig: ohne ihn mischten sich alle geladenen Buecher in
   eine Runde, auch die abgewaehlten - und die Kapitelnummern darunter meinen
   in jedem Buch etwas anderes.

   Eigene Vokabeln laufen bewusst in jeder Auswahl mit. Sie gehoeren zu keinem
   Buch, deshalb entscheidet ueber sie ein eigener Schalter - und zwar mit
   genau der Bedeutung, die der alte 'personal'-Eintrag in selectedChapters
   hatte: solange nirgends eingeengt wurde, sind sie dabei; sobald irgendwo
   Kapitel gewaehlt sind, nur noch wenn ihr Schalter an ist. */
function passtZurAuswahl(w){
  /* ⚠️ Seit dem 17.08.2026 steht die WISSENSGRENZE vor der Auswahl. Elias:
     "die wurzeln, hörmodus und so die sollen je nach meinem wissensstand (also
     den kapiteln) sich erweitern oder begrenzen. die sollen daran verknüpft
     sein."

     Vorher entschieden hier nur Buch und Kapitel-Chips. Mit "Alle" angehakt
     kamen deshalb alle 311 Woerter des geladenen Buchs in die Kartei - im
     Browser gemessen, davon **140 ausserhalb seines Lernbestands**, allein
     Kapitel 24 mit 67. Die Chips sind eine Einengung von Hand; sie waren nie
     als Wissensgrenze gedacht, haben sie aber faktisch ersetzt.

     Diese eine Zeile wirkt auf ALLES, was ueber currentPool() laeuft: faellige
     Karten, "nur falsche Woerter" und - ueber passeRundeAnAuswahlAn() - auch
     eine schon laufende Runde. */
  if (typeof istBekannt === 'function' && !istBekannt(w)) return false;
  /* ⛔ „Kenne ich schon" steht GANZ VORNE, vor jedem anderen Ja. Weiter unten
     geben mehrere Zweige ein bedingungsloses `return true` zurueck (eigene
     Vokabeln, Fachbegriffe) - stuende die Pruefung dahinter, waere sie fuer
     genau die Woerter wirkungslos, ohne dass es je auffiele. */
  if (typeof kennErSchon === 'function' && kennErSchon(w)) return false;
  const karte = (SETTINGS.buecher && typeof SETTINGS.buecher === 'object')
    ? SETTINGS.buecher : { 'madina-1': [] };
  /* ⛔ Die Fachbegriffe stehen VOR dem Eigene-Schalter und haben keinen
     eigenen. Elias hat sie ausdruecklich bestellt; ein Schalter, der sie
     wieder verschwinden laesst, waere genau der Fehler, den der Punkt in der
     To-Do benennt: „Nicht hinter Eigene verstecken." Wer einen einzelnen
     Begriff nicht mehr sehen will, nimmt den „Kenne ich schon"-Knopf. */
  if (w.chapter === 'grammar') return true;
  if (w.chapter === 'personal'){
    const eng = (typeof irgendwoEingeengt === 'function') ? irgendwoEingeengt() : false;
    return !eng || !!SETTINGS.eigeneGewaehlt;
  }
  const kapitel = karte[w.book];
  if (!Array.isArray(kapitel)) return false;         /* Buch nicht gewaehlt */
  if (kapitel.length && kapitel.indexOf(w.chapter) < 0) return false;
  return true;
}

function currentPool(){
  const pool = SETTINGS.wrongOnly ? weakWords() : dueWords();
  return pool.filter(passtZurAuswahl);
}

/* "Nur falsche Wörter" wieder abschalten, sobald keine mehr da sind
   (arabicroots-Paritaet D). Der Schalter war bisher dauerhaft: hat man die
   letzte schwache Vokabel geschafft, blieb er an, "Lernen" meldete jedes Mal
   "Keine schwachen Woerter" und sprang zurueck - bis man von selbst merkt,
   dass oben noch ein Knopf leuchtet.
   Bewusst NICHT beim blossen Umschalten pruefen, sonst spraenge der Schalter
   sofort wieder zurueck und wirkte kaputt. Nur nach einer Antwort und am Ende
   einer Runde, also genau dann, wenn man die Liste wirklich leergeraeumt hat. */
function pruefeNurFalscheModus(){
  if (!SETTINGS.wrongOnly) return false;
  if (currentPool().length) return false;
  SETTINGS.wrongOnly = false;
  saveSettings();
  toast('Keine schwachen Wörter mehr – zurück zum normalen Modus.');
  return true;
}
function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ---------- Arabisch mitten im deutschen Fliesstext lesbar machen ----------

   Elias am 16.08.2026 zum Vorschlagstext auf der Lernkarte: "es ist so klein
   und deswegen kann ich es schlecht lesen und muss immer nah ran gehen und
   mich behuemen ... unten beim beispielsatz da hast du das arabische auch viel
   groesser als das deutsche, das kann man gut lesen."

   ⭐ Das ist kein Versehen im CSS, sondern eine Eigenart der Schrift: bei
   GLEICHER Punktgroesse traegt Naskh viel weniger Hoehe als die Lateinschrift,
   und die Harakat teilen sich diese Hoehe auch noch. Deshalb rechnet die ganze
   App Arabisch ueberall mit `--ar-faktor` (steht auf 2) hoch - `.example-ar`,
   `.wl-ar`, `.hl-ar` und ein Dutzend weitere Stellen.

   Nur im Fliesstext ging das bisher nicht: dort stecken beide Schriften in
   EINEM Textknoten, und `font-size` gilt immer fuer das ganze Element. Genau
   das loest diese Funktion - die arabischen Laeufe bekommen beim Anzeigen
   einen eigenen Span und damit dieselbe Regel wie ueberall sonst.

   Der gespeicherte Text aendert sich nicht. Es ist reine Darstellung, und der
   Rueckweg ist `textContent` statt `innerHTML`.

   ⚠️ ZUSAMMENHAENGENDE arabische Woerter bleiben EIN Lauf, samt der
   Leerzeichen dazwischen. Zerlegte man هَذَا وَلَدٌ in zwei Spans, laege
   zwischen ihnen ein deutsches Leerzeichen - halb so breit wie die Schrift
   daneben, und der Satz sieht aus, als klebten die Woerter aneinander.

   ⚠️ KEIN `dir="rtl"` am Span. Der Bidi-Algorithmus des Browsers dreht einen
   arabischen Lauf von selbst richtig herum; ein gesetztes `dir` wuerde
   zusaetzlich die angrenzenden Satzzeichen an sich ziehen (die Klammer nach
   قَرِيبٌ landete dann auf der falschen Seite). */
const AR_BEREICH = '\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFF';
const AR_LAUF = new RegExp(
  '[' + AR_BEREICH + ']+(?:[ \\u00A0\\u200E\\u200F]+[' + AR_BEREICH + ']+)*', 'g');

function arabischHervorheben(text){
  /* Erst maskieren, dann verpacken - nie umgekehrt. Der Kasten zeigt auch
     Elias' EIGENE Notizen an, also fremden Text im HTML-Zusammenhang. */
  return escapeHtml(text).replace(AR_LAUF, lauf => `<span class="mn-ar" lang="ar">${lauf}</span>`);
}

/* Manche Vokabeln haben zwei gueltige Plurale: بُيُوتٌ / أَبْيَاتٌ. arabicroots
   trennt sie im Abzug mit "|", in der App steht " / ". Beide Schreibweisen
   muessen ueberall gleich behandelt werden - bisher nirgends:
   - die Lernkarte zeigte den Rohwert, ein "|" waere also sichtbar geblieben
   - js/irab.js legte "بُيُوتٌ / أَبْيَاتٌ" als EINEN Lexikoneintrag ab, der auf
     kein einzelnes Wort im Satz passt. Die 7 doppelten Plurale waren fuer die
     Satzanalyse damit unsichtbar.
   `formen()` gibt die Einzelformen, `formenAnzeige()` die vereinheitlichte
   Schreibweise fuer die Anzeige. */
const FORM_TRENNER = /\s*[|/]\s*/;
function formen(wert){
  if (typeof wert !== 'string') return [];
  return wert.split(FORM_TRENNER).map(s => s.trim()).filter(Boolean);
}
function formenAnzeige(wert){ return formen(wert).join(' / '); }

function toast(msg){
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>el.classList.remove('show'), 2200);
}

