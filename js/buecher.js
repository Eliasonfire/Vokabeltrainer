/* buecher.js -- mehrere Lehrwerke, nachgeladen statt alles auf einmal
   Teil der App-Logik; wird in index.html in fester Reihenfolge geladen und
   teilt sich mit den uebrigen js/-Dateien den globalen Namensraum.

   Ausgangslage: vocab-data.js enthielt nur Madina 1, Kapitel 1-9 (74 KB).
   Elias' arabicroots-Konto hat aber 4433 Vokabeln in acht Lehrwerken, und
   fast alle Woerter, die ihm schwerfallen, stehen in Buechern, die die App
   gar nicht kannte.

   Alles in eine Datei zu legen waeren rund 1,7 MB beim ersten Aufruf - am
   Handy spuerbar, und das meiste davon Buecher, die gerade nicht dran sind.
   Entscheidung (Elias, 28.07.2026): eine Datei je Buch, nachgeladen beim
   Umschalten. Der Start bleibt so schnell wie vorher, offline verfuegbar ist
   trotzdem alles, was einmal geoeffnet wurde - der Service Worker legt jede
   geladene Buchdatei ab.

   vocab-data.js bleibt als Anreicherungsschicht bestehen: dort stehen die
   Beispielsaetze und die Quran-Belege zu Madina 1, Kapitel 1-9. Die rohen
   Buchdateien haben so etwas nicht (die arabicroots-Datenbank fuehrt weder
   Beispielsaetze noch Verse). Beim Nachladen wird deshalb angereichert, nicht
   ersetzt: gleiche ID -> die vorhandenen Zusatzfelder bleiben stehen. */

/* ---------- Welche Buecher gerade gelernt werden ----------

   Bis zum 11.08.2026 war es genau EINES (`SETTINGS.aktivesBuch`). Elias:
   "eigentlich will ich auch die option haben mehrere bücher gleichzeitig
   auszuwählen weil wenn wir dann mit medina buch 2 anfangen dann brauche ich
   ja trotzdem die vokabeln von 1."

   ⭐ Mein erster Entwurf dazu war falsch, und seine Rueckfrage hat ihn
   entlarvt: "wie erkenne ich oder betimme ich denn welches das hauptbuch ist
   und wie viele oder welche kapitel ich beim zusatzbuch freigeschalten haben
   möchte". Ich hatte "ein Hauptbuch mit Kapitelauswahl, Zusatzbuecher laufen
   vollstaendig mit" vorgeschlagen - das haette ihm alle 24 Kapitel von
   Madina 1 gegeben statt der neun, die er gelernt hat.

   Richtig ist deshalb: KEIN Hauptbuch. Jedes gewaehlte Buch traegt seine
   EIGENE Kapitelauswahl. Die Einstellung ist eine Zuordnung

       SETTINGS.buecher = { 'madina-1': [1,2,3], 'madina-2': [] }

   Ein leeres Feld heisst "alle Kapitel dieses Buchs" - dieselbe Bedeutung, die
   die leere `selectedChapters`-Liste vorher hatte. */

function aktiveBuecher(){
  const karte = SETTINGS.buecher;
  const slugs = (karte && typeof karte === 'object') ? Object.keys(karte) : [];
  /* Nie leer: ohne Buch zeigt die App gar nichts an und sieht kaputt aus. */
  return slugs.length ? slugs : ['madina-1'];
}

/* Die Kapitelauswahl EINES Buchs. Leer = alle. */
function kapitelAuswahl(slug){
  const karte = SETTINGS.buecher || {};
  return Array.isArray(karte[slug]) ? karte[slug] : [];
}

function buchGewaehlt(slug){ return aktiveBuecher().indexOf(slug) >= 0; }

/* Ist irgendwo eine Kapitelauswahl gesetzt? Diese Frage entscheidet, ob die
   eigenen Vokabeln mitlaufen - siehe passtZurAuswahl() in js/kern.js. */
function irgendwoEingeengt(){
  const karte = SETTINGS.buecher || {};
  return Object.keys(karte).some(s => (karte[s] || []).length > 0);
}

/* ⚠️ Bleibt bestehen, hat aber nur noch EINEN Zweck: Beschriftungen, die
   nun einmal einen einzelnen Namen brauchen. Wer damit filtert, baut die
   Mehrfachauswahl wieder aus - dafuer gibt es aktiveBuecher(). */
function aktivesBuch(){ return aktiveBuecher()[0]; }

/* Einmalige Umstellung des alten Standes. Ohne sie stuende nach dem Update
   ploetzlich Madina 1 mit allen Kapiteln da, obwohl Elias auf Kapitel 3
   eingestellt war - ein stiller Rueckschritt mitten in seiner Lernrunde. */
function stelleBuchauswahlUm(){
  if (SETTINGS.buecher && typeof SETTINGS.buecher === 'object') return false;
  const slug = SETTINGS.aktivesBuch || 'madina-1';
  const alt  = Array.isArray(SETTINGS.selectedChapters) ? SETTINGS.selectedChapters : [];
  /* 'personal' war frueher ein Eintrag in derselben Liste wie die Kapitel.
     Eigene Vokabeln gehoeren aber zu keinem Buch, deshalb bekommt der Schalter
     jetzt ein eigenes Feld. */
  SETTINGS.buecher = {};
  SETTINGS.buecher[slug] = alt.filter(k => k !== 'personal');
  SETTINGS.eigeneGewaehlt = alt.indexOf('personal') >= 0;
  return true;
}

/* Die Eintraege aus vocab-data.js kennen kein `book`-Feld - sie stammen alle
   aus Madina 1. Ohne das Feld faende der Buchfilter sie nicht wieder. */
(function basisEinordnen(){
  VOCAB_DATA.forEach(w=>{
    if (!w.book) w.book = (w.chapter === 'personal') ? 'personal' : 'madina-1';
  });
})();

/* Anfangs ist nichts nachgeladen. Frueher stand hier `new Set(['madina-1'])`,
   weil vocab-data.js ja Madina 1 enthaelt - aber eben nur die Kapitel 1 bis 9.
   Die Kapitel 10 bis 24 desselben Buchs fehlten dadurch dauerhaft, und zwar
   unsichtbar: die App meldete "Madina 1 ist geladen" und zeigte 149 statt 298
   Vokabeln. */
const GELADENE_BUECHER = new Set();

/* Buecher, deren Datei sich nicht laden liess. Sie verschwinden aus der
   Auswahl, statt als Knopf dazustehen, der bei jedem Antippen scheitert.
   Zwei Faelle, in denen das wirklich vorkommt: eine abgebrochene Verbindung
   am Handy - und die Auslieferung ohne data/, solange Elias noch nicht
   entschieden hat, ob sein Vokabelabzug ins oeffentliche Repo darf. */
const BUCH_FEHLT = new Set();

function buchInfo(slug){
  return (typeof BUECHER !== 'undefined' ? BUECHER : []).find(b=>b.slug===slug);
}

/* Eine Buchdatei per <script> nachladen. Bewusst kein fetch/JSON: die Dateien
   sind ausfuehrbares JS und haengen sich selbst in window.VOKABELN ein - so
   greift auch der Offline-Cache des Service Workers ohne Sonderbehandlung. */
function ladeBuchDatei(slug){
  return new Promise((fertig, fehler)=>{
    const info = buchInfo(slug);
    if (!info) return fehler(new Error(`Unbekanntes Buch: ${slug}`));
    if (window.VOKABELN && window.VOKABELN[slug]) return fertig(window.VOKABELN[slug]);
    const s = document.createElement('script');
    s.src = info.datei;
    s.onload = ()=> (window.VOKABELN && window.VOKABELN[slug])
      ? fertig(window.VOKABELN[slug])
      : fehler(new Error(`${info.datei} geladen, enthielt aber keine Vokabeln.`));
    s.onerror = ()=> fehler(new Error(`${info.datei} nicht erreichbar.`));
    document.head.appendChild(s);
  });
}

/* Rohdaten in VOCAB_DATA einhaengen. Ruecklaeufig ist die Zahl der wirklich
   neuen Eintraege - bei Madina 1 ist sie klein, weil die ersten neun Kapitel
   schon aus vocab-data.js dastehen. */
/* ---------- Wann eine rohe Angabe KEINE Angabe ist ----------

   Elias am 04.08.2026: "Vokabel Schweiz fehlt Taschkil." Die Ursache lag nicht
   dort, wo man sie sucht. In vocab-data.js steht die am 30.07. belegte Fassung
   سُوِيسْرَا (Madina-Schluessel 1, L7, S. 29) - und die ist auch nie ueberschrieben
   worden, denn `ar` ist belegt und Vorhandenes gewinnt.

   Ueberschrieben wurde ein Feld, das GAR NICHT gefuellt war: `sg` stand auf
   null, und der Abzug traegt dort سُويسْرَا nach - dasselbe Wort, aber ohne die
   Kasra unter dem و. Weil fast alles im Code auf `w.sg || w.ar` zugreift,
   gewinnt ab da die schlechtere Schreibung. Bei Japan genauso: `ar` ist
   الْيَابَانُ, der Abzug schiebt ueber `sg` das artikellose اليَابَانُ nach.

   Deshalb diese Pruefung: Ein arabisches Feld aus dem Abzug wird NICHT
   nachgetragen, wenn es - ohne Vokalzeichen betrachtet - dasselbe Wort ist wie
   das schon vorhandene `ar`, aber weniger Taschkil traegt. Dann ist es keine
   neue Angabe, sondern eine schlechtere Schreibung derselben.

   Warum nicht nachtragen statt korrigieren: `w.sg || w.ar` faellt dann von
   selbst auf die belegte Fassung zurueck. Es wird also kein einziges
   Vokalzeichen von mir gesetzt - E.1 bleibt unangetastet.

   Ein echter Plural kann hier nicht hineinlaufen: entvokalisiert ist بُيُوتٌ
   nicht dasselbe wie بَيْتٌ, die erste Bedingung greift also gar nicht. */
const ROH_ARAB_FELDER = new Set(['ar','sg','pl','femSg','femPl','past','present','imperative','masdar']);
function rohOhneHarakat(s){ return String(s == null ? '' : s).replace(/[ً-ْٰـ]/g, ''); }
function rohZaehleHarakat(s){ return (String(s == null ? '' : s).match(/[ً-ْٰ]/g) || []).length; }
function istSchlechtereSchreibung(feld, wert, da){
  if (!ROH_ARAB_FELDER.has(feld) || !da.ar) return false;
  if (rohOhneHarakat(wert) !== rohOhneHarakat(da.ar)) return false;
  return rohZaehleHarakat(wert) < rohZaehleHarakat(da.ar);
}

/* ---------- Erfundene Wurzeln nicht uebernehmen (C9, 18.08.2026) ----------

   Elias' Entscheidung: „alle leer lassen — eine erfundene Wurzel täuscht im
   Wurzelmodus eine Familie vor. Ausnahmen عَلَى und تَحْتَ, die belegbar sind."

   Nachgemessen (`vocab-data.js` gegen alle `data/vokabeln-*.js`):
   28 Woerter haben dort keine Wurzel, **10** davon bekaemen aus dem Abzug eine.
   Zwei davon sind echt und bleiben:

   | Wort | Abzug | echt? |
   |---|---|---|
   | عَلَى | ع ل و | **ja** — عَلَا/يَعْلُو „hoch sein", dazu عَلِيّ, أَعْلَى |
   | تَحْتَ | ت ح ت | **ja** — als Wurzel in den Lexika belegt |
   | مِنْ | م ن | nein, zwei Buchstaben des Wortes |
   | إِلَى | ا ل ى | nein |
   | أَيْنَ | ا ي ن | nein |
   | فِي | ف ي | nein |
   | هُنَا | ه ن ا | nein |
   | هُنَاكَ | ه ن ك | nein |
   | لِمَاذَا | ل م ذ | nein — das Wort ist لِ + مَا + ذَا |
   | الْآنَ | ا ن | nein |

   Bleiben **8** zu sperrende. ⚠️ In der To-Do stand „9 davon"; gemessen sind es
   10, und Elias' „8 erfundene" ist die richtige Zahl — 10 minus die zwei
   echten. Die 9 war schlicht falsch.

   ⭐ Gesperrt wird ueber die Id, nicht ueber eine Regel wie „Partikeln kriegen
   keine Wurzel". Eine Regel waere eine Behauptung ueber alle kuenftigen
   Woerter; diese Liste ist eine Aussage ueber zehn nachgesehene Faelle.
   Kommt ein neues Funktionswort dazu, faellt es auf, weil im Wurzelmodus eine
   Familie erscheint, die es nicht gibt - und dann wird es hier eingetragen. */
const KEINE_WURZEL_UEBERNEHMEN = new Set([
  '45808', /* مِنْ    */ '45809', /* إِلَى   */ '45810', /* أَيْنَ  */
  '45812', /* فِي     */ '45834', /* هُنَا   */ '45836', /* هُنَاكَ */
  '45888', /* لِمَاذَا */ '45891'  /* الْآنَ  */
]);

function einhaengen(liste){
  const nachId = new Map(VOCAB_DATA.map(w=>[String(w.id), w]));
  let neu = 0, ergaenzt = 0, verworfen = 0;
  liste.forEach(roh=>{
    const da = nachId.get(String(roh.id));
    if (!da){ VOCAB_DATA.push(Object.assign({}, roh)); neu++; return; }
    /* Vorhandenes gewinnt: Beispielsatz, Quran-Beleg und Startbox aus
       vocab-data.js duerfen nicht von den rohen Feldern ueberschrieben
       werden. Nur was fehlt, wird nachgetragen. */
    let hatErgaenzt = false;
    Object.entries(roh).forEach(([k,v])=>{
      if (v !== null && v !== undefined && (da[k] === null || da[k] === undefined)){
        if (istSchlechtereSchreibung(k, v, da)){ verworfen++; return; }
        /* C9: acht Funktionswoerter bekommen im Abzug eine aus ihren eigenen
           Buchstaben gebaute „Wurzel". Die bleibt draussen - siehe die Tabelle
           bei KEINE_WURZEL_UEBERNEHMEN. Alle uebrigen Felder dieser Woerter
           werden ganz normal ergaenzt. */
        if (k === 'root' && KEINE_WURZEL_UEBERNEHMEN.has(String(roh.id))){ verworfen++; return; }
        da[k] = v; hatErgaenzt = true;
      }
    });
    if (hatErgaenzt) ergaenzt++;
  });
  const eselsbruecken = eselsbrueckenNachtragen(liste);
  return { neu, ergaenzt, verworfen, eselsbruecken };
}

/* ---------- Eselsbruecken fuer die Buchvokabeln nachtragen ----------

   Die 171 Lernwoerter aus vocab-data.js tragen ihr `mnemo` direkt am Eintrag.
   Fuer die Buchvokabeln geht das nicht: data/vokabeln-*.js wird von
   hole-vokabeln.mjs neu erzeugt (alles Handgeschriebene waere beim naechsten
   Abzug weg), und vocab-data.js scheidet aus, weil LERNBESTAND_IDS
   (js/kern.js) daran die Kapitelfreischaltung haengt - 140 neue Eintraege
   dort wuerden als "kennt er schon" gelten.

   Deshalb liegen sie getrennt in data/eselsbruecken.js und werden hier
   angewandt, gleich nachdem ein Buch eingehaengt wurde.

   ⚠️ NUR wo noch keine steht. Dieselbe Regel wie oben in einhaengen():
   Vorhandenes gewinnt. Sonst koennte eine Buch-Eselsbruecke die handverlesene
   aus vocab-data.js ueberschreiben - und zwar unbemerkt, weil beide Felder
   gleich heissen und gleich aussehen.

   ⚠️ Die Karte wird NACH dem Einhaengen gebaut, nicht davor: die frisch per
   VOCAB_DATA.push() dazugekommenen Woerter sollen ihre Eselsbruecke ja auch
   bekommen. Mit einer vorher gebauten Karte waeren genau die leer ausgegangen -
   also gerade die 140, um die es geht. */
function eselsbrueckenNachtragen(liste){
  if (typeof BUCH_ESELSBRUECKEN === 'undefined') return 0;
  const nachId = new Map(VOCAB_DATA.map(w=>[String(w.id), w]));
  let n = 0;
  liste.forEach(roh=>{
    const w = nachId.get(String(roh.id));
    if (!w || w.mnemo) return;
    const text = BUCH_ESELSBRUECKEN[String(roh.id)];
    if (text){ w.mnemo = text; n++; }
  });
  return n;
}

/* Ein Buch in die Auswahl aufnehmen oder herausnehmen. Das ist der Weg, den
   die Knoepfe auf der Startseite gehen.

   ⚠️ Das letzte Buch laesst sich nicht abwaehlen. Sonst stuende die App ohne
   jede Vokabel da - und der Weg zurueck waere derselbe Knopf, den man gerade
   ausgeschaltet hat. */
async function schalteBuch(slug){
  if (!buchInfo(slug)) { toast(`Buch "${slug}" gibt es nicht.`); return; }
  const karte = SETTINGS.buecher || (SETTINGS.buecher = {});
  if (buchGewaehlt(slug)){
    if (aktiveBuecher().length < 2){
      toast('Mindestens ein Buch muss ausgewaehlt bleiben.');
      return;
    }
    delete karte[slug];
    saveSettings();
    nachAuswahlwechsel();
    return;
  }
  await setzeBuch(slug);
}

/* Alles, was nach einer Aenderung der Buch- oder Kapitelauswahl nachgezogen
   werden muss. Frueher stand diese Folge dreimal fast gleich im Code; beim
   Kapitelfilter fehlte dabei einmal das Mitziehen der laufenden Runde, was
   Elias am 30.07.2026 gemeldet hat. */
function nachAuswahlwechsel(){
  renderHome();
  if (typeof passeRundeAnAuswahlAn === 'function') passeRundeAnAuswahlAn();
  if (typeof renderCategories === 'function') renderCategories();
  if (typeof openSentences === 'function' && document.querySelector('[data-screen="sentences"].active')) openSentences();
}

/* Buch laden und in die Auswahl aufnehmen. Laedt bei Bedarf nach, traegt
   fehlende Fortschrittseintraege nach und baut die Oberflaeche neu auf. */
async function setzeBuch(slug, still){
  if (!buchInfo(slug)) { toast(`Buch "${slug}" gibt es nicht.`); return; }
  if (!GELADENE_BUECHER.has(slug)){
    if (!still) toast('Lade ' + buchTitel(slug) + ' …');
    try {
      const liste = await ladeBuchDatei(slug);
      const { neu } = einhaengen(liste);
      GELADENE_BUECHER.add(slug);
      /* Neue Vokabeln brauchen einen Fortschrittseintrag, sonst tauchen sie
         in "Jetzt lernen" nie auf - derselbe Fehler wie frueher beim
         Kapitel-Backfill. */
      VOCAB_DATA.forEach(w=>{
        if (!PROGRESS[w.id]) PROGRESS[w.id] = { box: w.box || 1, nextReview: todayStr(0), correct:0, wrong:0 };
      });
      saveProgress();
      if (!still) toast(`${buchTitel(slug)}: ${neu} neue Vokabeln.`);
    } catch (e){
      /* Nicht nur melden, sondern merken: ein Buch, dessen Datei fehlt, hat
         in der Auswahl nichts verloren. Sonst steht dort ein Knopf, der bei
         jedem Antippen dieselbe Fehlermeldung bringt. */
      BUCH_FEHLT.add(slug);
      renderBuchChips();
      if (!still) toast(buchTitel(slug) + ' ist gerade nicht verfuegbar.');
      return;
    }
  }
  /* Neu in der Auswahl heisst: alle Kapitel dieses Buchs. Die Kapitelauswahl
     gilt immer nur innerhalb eines Buchs - Kapitel 3 in Madina 1 hat mit
     Kapitel 3 in Bayna Yadayk nichts zu tun.
     ⚠️ Eine schon vorhandene Auswahl wird NICHT ueberschrieben: setzeBuch()
     laeuft auch beim Start ueber jedes gemerkte Buch, und dabei duerfen seine
     Kapitel nicht verlorengehen. */
  if (!SETTINGS.buecher || typeof SETTINGS.buecher !== 'object') SETTINGS.buecher = {};
  if (!Array.isArray(SETTINGS.buecher[slug])) SETTINGS.buecher[slug] = [];
  saveSettings();
  if (!still) nachAuswahlwechsel();
}

/* Anzeigenamen. Die Datenbank fuehrt nur Kuerzel wie "bayna-yadayk-2"; das
   ist als Beschriftung unbrauchbar. */
const BUCH_TITEL = {
  'madina-1': 'Madina 1', 'madina-2': 'Madina 2', 'madina-3': 'Madina 3',
  'bayna-yadayk-1': 'Bayna Yadayk 1', 'bayna-yadayk-2': 'Bayna Yadayk 2',
  'bayna-yadayk-3': 'Bayna Yadayk 3', 'bayna-yadayk-4': 'Bayna Yadayk 4',
  'quran': 'Quran'
};
function buchTitel(slug){ return BUCH_TITEL[slug] || slug; }

/* Alle Vokabeln der gewaehlten Buecher plus die eigenen. Ueberall dort zu
   benutzen, wo frueher direkt ueber VOCAB_DATA gelaufen wurde - sonst zaehlen
   Kategorien und Statistik Woerter mit, die gerade gar nicht gelernt werden.
   Eigene Vokabeln laufen bewusst in jeder Auswahl mit. */
function buchVokabeln(){
  const gewaehlt = new Set(aktiveBuecher());
  /* 'grammar' sind die zehn Fachbegriffe aus dem Unterricht
     (data/fachbegriffe.js). Sie gehoeren zu keinem Lehrwerk und laufen
     deshalb - wie die eigenen Vokabeln - in jeder Buchauswahl mit. Ohne
     diese Bedingung waeren sie unsichtbar, denn 'grammar' steht in keiner
     Buchliste und kann auch nicht angehakt werden. */
  return VOCAB_DATA.filter(w => gewaehlt.has(w.book)
                             || w.chapter === 'personal'
                             || w.chapter === 'grammar');
}

/* Alle Kapitelnummern des aktiven Buchs, aufsteigend. Fuer Madina 1 tragen
   die ersten neun Kapitel einen sprechenden Namen (CHAPTER_NAMES); in den
   uebrigen Buechern gibt es den nicht, dort steht nur die Nummer. */
function kapitelDesBuchs(slug){
  const s = slug || aktivesBuch();
  const info = buchInfo(s);
  /* ⚠️ ALLE Kapitel, die geladen sind - hier wird NICHT auf die freigeschalteten
     eingeengt. Am 30.07.2026 stand hier kurz eine solche Sperre, und Elias hat
     sie sofort zurueckgenommen: "es sollten alle kapitel zur verfuegung stehen."

     Warum sie ueberhaupt entstand: Er hatte gemeldet, dass Kapitel 24 ploetzlich
     auftauchte. Die Ursache war aber NICHT die Kapitelliste, sondern ich - die
     neun Zahlen, die er angefordert hatte, trugen `chapter: 24`, und damit galt
     das Kapitel als vorhanden. Das ist behoben (die Zahlen stehen auf
     'personal'); die Sperre hier war die falsche zweite Haelfte und ist weg.

     Die Lehre: erst die Ursache beheben, dann pruefen, ob die zweite Massnahme
     noch gebraucht wird. Hier wurde beides gleichzeitig gemacht, und die zweite
     hat ihm etwas weggenommen, was er wollte.

     FREIGESCHALTET (js/kern.js) gilt weiterhin - aber nur fuer die Frage, welche
     WOERTER in den Wortfeldern und im Vorrat der eigenen Kategorien stehen. Das
     ist eine andere Frage als die, welche Kapitel er lernen darf. */
  const vorhanden = [...new Set(VOCAB_DATA.filter(w=>w.book===s && typeof w.chapter==='number')
    .map(w=>w.chapter))].sort((a,b)=>a-b);
  /* Was tatsaechlich geladen ist, gilt. Die Zahl aus dem Verzeichnis ist nur
     die Vorschau fuer ein Buch, das noch nicht angetippt wurde - stuende sie
     auch danach da, zeigte die App Kapitel an, hinter denen nichts liegt. */
  if (vorhanden.length) return vorhanden;
  if (GELADENE_BUECHER.has(s) || BUCH_FEHLT.has(s)) return [];
  return info ? Array.from({length: info.kapitel}, (_,i)=>i+1) : [];
}

function renderBuchChips(){
  const ziel = document.getElementById('bookFilterChips');
  if (!ziel || typeof BUECHER === 'undefined') return;
  /* Die Ueberschrift steht fest in index.html und muss mitverschwinden. Sonst
     bleibt sie ueber einer leeren Zeile stehen und die Startseite sieht kaputt
     aus - genau so war es live, solange data/ nicht ausgeliefert wird. */
  const beschriftung = document.getElementById('bookFilterLabel');
  const sichtbar = BUECHER.filter(b => !BUCH_FEHLT.has(b.slug));
  /* Bleibt nur ein Buch uebrig, ist die Auswahlzeile ueberfluessig. */
  if (sichtbar.length < 2){
    ziel.innerHTML = '';
    if (beschriftung) beschriftung.classList.add('hidden');
    return;
  }
  if (beschriftung) beschriftung.classList.remove('hidden');
  ziel.innerHTML = sichtbar.map(b=>{
    const geladen = GELADENE_BUECHER.has(b.slug);
    const an = buchGewaehlt(b.slug);
    /* aria-pressed statt nur einer Klasse: die Knoepfe schalten jetzt
       mehrere Zustaende gleichzeitig, das ist keine Auswahl aus einer Reihe
       mehr, sondern eine Ansammlung von Schaltern. */
    return `<button class="chip-toggle${an?' active':''}" data-buch="${b.slug}" aria-pressed="${an}"
      title="${b.vokabeln} Vokabeln, ${b.kapitel} Kapitel${geladen?'':' – wird beim Antippen geladen'}">${buchTitel(b.slug)}</button>`;
  }).join('');
}

document.addEventListener('click', (e)=>{
  const b = e.target.closest('[data-buch]');
  if (b) schalteBuch(b.dataset.buch);
});

/* Beim Start das zuletzt gewaehlte Buch nachladen - auch Madina 1, denn
   vocab-data.js deckt davon nur die Kapitel 1 bis 9 ab. Ohne diesen Aufruf
   stand nach einem Neustart zwar das richtige Buch in den Einstellungen,
   geladen war es aber nicht: die App zeigte dann ausser den eigenen Vokabeln
   nichts an und sah kaputt aus. `still` unterdrueckt die Meldungen - beim
   normalen Start soll nichts aufblitzen. */
document.addEventListener('DOMContentLoaded', async ()=>{
  /* Erst das im Geraet abgelegte Vokabelpaket einhaengen, dann das Buch
     aufbauen. Ohne dieses Warten liefe setzeBuch() gegen ein noch leeres
     window.VOKABELN und meldete das Buch als fehlend - obwohl es Sekunden
     spaeter dagewesen waere. Siehe js/vokabelpaket.js. */
  if (typeof PAKET_BEREIT !== 'undefined') await PAKET_BEREIT;
  if (stelleBuchauswahlUm()) saveSettings();
  /* ALLE gemerkten Buecher laden, nicht nur eines. Nacheinander und nicht
     ueber Promise.all: einhaengen() schreibt in dieselbe Liste VOCAB_DATA und
     baut sich dafuer jedes Mal einen Index darueber auf - zwei gleichzeitige
     Laeufe wuerden mit einem veralteten Index arbeiten. */
  const slugs = aktiveBuecher();
  for (const s of slugs) await setzeBuch(s, true);

  /* ---------- Eigene Vokabeln von arabicroots (C8, 18.08.2026) ------------

     Sie stehen in data/vokabeln-eigene.js und tragen `chapter:'personal'`, also
     erscheinen sie in der Kapitelliste ganz oben unter „Eigene Vokabeln" -
     genau dort, wo er sie sucht. Die Datei wird nachgeladen wie die Buecher;
     fehlt sie (Deploy ohne --mit-daten), laeuft die App unveraendert weiter.

     ⚠️ Die ausgeblendeten ueberspringen. Ohne diese Zeile kaeme ein geloeschtes
     Wort beim naechsten Start wieder - und das Loeschen waere eine
     Scheinfunktion, die niemandem auffaellt, weil sie im Moment des Klickens
     richtig aussieht. */
  await new Promise(fertig => {
    if (window.EIGENE_VOKABELN) return fertig();
    const s = document.createElement('script');
    s.src = 'data/vokabeln-eigene.js';
    s.onload = fertig; s.onerror = fertig;
    document.head.appendChild(s);
  });
  if (Array.isArray(window.EIGENE_VOKABELN)){
    const wegRoh = LS.get('vt_geloescht', {});
    const weg = (wegRoh && typeof wegRoh === 'object' && !Array.isArray(wegRoh)) ? wegRoh : {};
    const da = new Set(VOCAB_DATA.map(w => String(w.id)));
    const neu = window.EIGENE_VOKABELN.filter(w =>
      !da.has(String(w.id)) && !(weg[w.id] && weg[w.id].an));
    if (neu.length) VOCAB_DATA.push(...neu.map(w => Object.assign({}, w)));
  }

  /* ---------- Pluralkarten NACH den Buechern neu bauen (18.08.2026) --------

     ⚠️ Ein Fehler, den nur die Zahl verraten hat. `wendePluralKartenAn` laeuft
     in kern.js beim Laden - da stehen aber erst die 171 Woerter aus
     vocab-data.js in der Liste. Die Buchvokabeln kommen erst hier dazu, weil
     ihre Dateien nachgeladen werden.

     Gemessen: nach dem Neuladen 120 Pluralkarten, nach einem Umlegen des
     Schalters im laufenden Betrieb 190. Dieselbe Einstellung, zwei Ergebnisse
     - je nachdem, ob man die App neu gestartet oder den Schalter angefasst
     hatte. Aufgefallen ist es nur, weil beide Zahlen im selben Protokoll
     standen; einzeln sah jede plausibel aus.

     Der Aufruf ist gefahrlos, wenn der Schalter aus ist: dann raeumt er die
     Liste auf und legt nichts an. */
  if (typeof wendePluralKartenAn === 'function' && typeof SETTINGS !== 'undefined'){
    wendePluralKartenAn(!!SETTINGS.pluralKarten);
    VOCAB_DATA.forEach(w=>{
      if (!PROGRESS[w.id]) PROGRESS[w.id] = { box: w.box || 1, nextReview: todayStr(0), correct:0, wrong:0 };
    });
    saveProgress();
  }

  renderBuchChips();
  if (typeof renderHome === 'function') renderHome();
  const slug = slugs[0];
  /* Scheitert schon der Start, fehlt nicht dieses eine Buch, sondern der
     ganze Ordner data/ - die Dateien werden immer zusammen ausgeliefert.
     Dann verschwindet die Buchzeile ganz, statt sieben Knoepfe anzubieten,
     die alle ins Leere fuehren. Die App faellt auf das zurueck, was in
     vocab-data.js steht: Madina 1, Kapitel 1 bis 9. */
  if (BUCH_FEHLT.has(slug)){
    (typeof BUECHER !== 'undefined' ? BUECHER : []).forEach(b => BUCH_FEHLT.add(b.slug));
    renderBuchChips();
    renderChapterFilterChips();
  }
});
