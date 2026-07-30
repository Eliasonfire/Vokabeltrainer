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
  24:"Anhang (Pronomen, Zahlen, Fachbegriffe)", personal:"Eigene Vokabeln"
};

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
const FREIGESCHALTET = {
  'madina-1': [1,2,3,4,5,6,7,8,9]      // arabicroots, abgefragt am 30.07.2026
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

function bekannteVokabeln(){
  const alle = (typeof buchVokabeln === 'function') ? buchVokabeln() : VOCAB_DATA;
  const buch = (typeof aktivesBuch === 'function') ? aktivesBuch() : 'madina-1';
  const frei = FREIGESCHALTET[buch];
  if (!frei) return alle;
  return alle.filter(w => w.chapter === 'personal'
                       || frei.includes(w.chapter)
                       || LERNBESTAND_IDS.has(w.id));
}

/* Für die Beschriftung: "Kapitel 1–9" statt einer Aufzählung, wenn die Kapitel
   lückenlos aufeinander folgen. */
function freigeschalteteBeschriftung(){
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
  set(key, val){ try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){} }
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
     sie braucht - aber der Standard ist aus. */
  { showPlural:false, showVerbFormen:false, sessionSize:20, voiceURI:null, direction:'ar-de', selectedChapters:[], wrongOnly:false, grammarHighlight:true },
  LS.get('vt_settings', {})
);
function saveSettings(){ LS.set('vt_settings', SETTINGS); }

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

   Gelernt wird immer in genau einem Lehrwerk. Ohne den Buchfilter mischten sich
   nach dem ersten Buchwechsel alle geladenen Buecher in eine Runde - und die
   Kapitelnummern darunter meinen in jedem Buch etwas anderes. Eigene Vokabeln
   laufen bewusst in jedem Buch mit. */
function passtZurAuswahl(w){
  const buch = (typeof aktivesBuch === 'function') ? aktivesBuch() : 'madina-1';
  if (!(w.book === buch || w.chapter === 'personal')) return false;
  const sel = SETTINGS.selectedChapters || [];
  if (sel.length && !sel.includes(w.chapter)) return false;
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

