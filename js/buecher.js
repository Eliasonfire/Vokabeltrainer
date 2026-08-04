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

/* Welches Buch gerade gelernt wird. Steht in den Einstellungen, damit es
   einen Neustart ueberlebt. */
function aktivesBuch(){ return SETTINGS.aktivesBuch || 'madina-1'; }

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
        da[k] = v; hatErgaenzt = true;
      }
    });
    if (hatErgaenzt) ergaenzt++;
  });
  return { neu, ergaenzt, verworfen };
}

/* Buch umschalten. Laedt bei Bedarf nach, traegt fehlende Fortschritts-
   eintraege nach und baut die Oberflaeche neu auf. */
async function setzeBuch(slug, still){
  if (!buchInfo(slug)) { toast(`Buch "${slug}" gibt es nicht.`); return; }
  const vorher = aktivesBuch();
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
  SETTINGS.aktivesBuch = slug;
  /* Die Kapitelauswahl gilt immer nur innerhalb eines Buchs - Kapitel 3 in
     Madina 1 hat mit Kapitel 3 in Bayna Yadayk nichts zu tun. */
  if (vorher !== slug) SETTINGS.selectedChapters = [];
  saveSettings();
  renderHome();
  /* Dieselbe Nachbesserung wie beim Kapitelfilter: eine laufende Runde gehoert
     zum alten Buch und muss mitgezogen werden. Sonst lernt man in Madina 3
     weiter die Karten aus Madina 1 (js/lernen.js). */
  if (typeof passeRundeAnAuswahlAn === 'function') passeRundeAnAuswahlAn();
  if (typeof renderCategories === 'function') renderCategories();
  if (typeof openSentences === 'function' && document.querySelector('[data-screen="sentences"].active')) openSentences();
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

/* Alle Vokabeln des aktiven Buchs plus die eigenen. Ueberall dort zu benutzen,
   wo frueher direkt ueber VOCAB_DATA gelaufen wurde - sonst zaehlen Kategorien
   und Statistik nach dem ersten Buchwechsel Woerter mit, die gerade gar nicht
   gelernt werden. */
function buchVokabeln(){
  const buch = aktivesBuch();
  return VOCAB_DATA.filter(w => w.book === buch || w.chapter === 'personal');
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
  const aktiv = aktivesBuch();
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
    return `<button class="chip-toggle${b.slug===aktiv?' active':''}" data-buch="${b.slug}"
      title="${b.vokabeln} Vokabeln, ${b.kapitel} Kapitel${geladen?'':' – wird beim Antippen geladen'}">${buchTitel(b.slug)}</button>`;
  }).join('');
}

document.addEventListener('click', (e)=>{
  const b = e.target.closest('[data-buch]');
  if (b) setzeBuch(b.dataset.buch);
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
  const slug = aktivesBuch();
  await setzeBuch(slug, true);
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
