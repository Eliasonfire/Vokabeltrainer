/* vokabelpaket.js -- die acht Lehrwerke aus einer Datei ins Geraet holen
   Teil der App-Logik; wird in index.html VOR js/buecher.js geladen und teilt
   sich mit den uebrigen js/-Dateien den globalen Namensraum.

   Warum es das gibt (Entscheidung offen gehalten, 29.07.2026):
   `data/vokabeln-*.js` steht per .gitignore nicht im oeffentlichen Repo. Das
   ist keine Vorsicht gegenueber den Lehrwerken, sondern gegenueber arabicroots'
   eigener Arbeit: deutsche Uebersetzungen (Madina 1 ist einsprachig arabisch,
   die Uebersetzungen koennen gar nicht aus dem Buch stammen), Wurzelangaben,
   Verbparadigmen - dazu ihre internen Datensatz-Nummern. Live fehlen die
   Dateien deshalb, und die App faellt auf Madina 1, Kapitel 1-9 zurueck.

   Dieser Weg loest das, ohne etwas zu veroeffentlichen: Elias baut das Paket
   lokal (`node werkzeuge/baue-vokabelpaket.mjs`), uebertraegt die eine Datei
   auf ein Geraet und liest sie dort einmal ein. Danach liegt sie im IndexedDB
   dieses Geraets - ueberlebt Neustarts, ueberlebt den Service-Worker-Cache,
   und geht durch keine fremde Hand.

   Warum IndexedDB und nicht localStorage: das Paket ist rund 1,4 MB. Die
   meisten Browser deckeln localStorage bei etwa 5 MB fuer ALLE Schluessel
   zusammen - dort lagen schon Fortschritt, Eselsbruecken und Hifz-Stand. Ein
   fehlgeschlagenes setItem haette den Fortschritt mitgerissen.

   Zusammenspiel mit buecher.js: Dieses Modul haengt die Vokabeln in
   `window.VOKABELN` ein - genau dort, wo `ladeBuchDatei()` ohnehin zuerst
   nachsieht. Dadurch braucht der Ladeweg keine Sonderbehandlung: liegt das
   Paket vor, findet er die Daten schon vorbereitet; liegt es nicht vor, holt
   er wie bisher `data/...js` vom Server. */

const PAKET_DB    = 'vokabeltrainer';
const PAKET_STORE = 'pakete';
const PAKET_KEY   = 'vokabelpaket';

function paketDbOeffnen(){
  return new Promise((fertig, fehler)=>{
    if (!('indexedDB' in window)) return fehler(new Error('IndexedDB steht nicht zur Verfuegung.'));
    const anfrage = indexedDB.open(PAKET_DB, 1);
    anfrage.onupgradeneeded = ()=>{
      const db = anfrage.result;
      if (!db.objectStoreNames.contains(PAKET_STORE)) db.createObjectStore(PAKET_STORE);
    };
    anfrage.onsuccess = ()=> fertig(anfrage.result);
    anfrage.onerror   = ()=> fehler(anfrage.error || new Error('IndexedDB liess sich nicht oeffnen.'));
  });
}

function paketLesen(){
  return paketDbOeffnen().then(db => new Promise((fertig, fehler)=>{
    const a = db.transaction(PAKET_STORE, 'readonly').objectStore(PAKET_STORE).get(PAKET_KEY);
    a.onsuccess = ()=> { fertig(a.result || null); db.close(); };
    a.onerror   = ()=> { fehler(a.error); db.close(); };
  }));
}

function paketSchreiben(paket){
  return paketDbOeffnen().then(db => new Promise((fertig, fehler)=>{
    const t = db.transaction(PAKET_STORE, 'readwrite');
    t.objectStore(PAKET_STORE).put(paket, PAKET_KEY);
    t.oncomplete = ()=> { fertig(); db.close(); };
    t.onerror    = ()=> { fehler(t.error); db.close(); };
  }));
}

function paketLoeschen(){
  return paketDbOeffnen().then(db => new Promise((fertig, fehler)=>{
    const t = db.transaction(PAKET_STORE, 'readwrite');
    t.objectStore(PAKET_STORE).delete(PAKET_KEY);
    t.oncomplete = ()=> { fertig(); db.close(); };
    t.onerror    = ()=> { fehler(t.error); db.close(); };
  }));
}

/* Was gerade im Geraet liegt - fuer die Anzeige in den Einstellungen. */
let PAKET_STAND = null;

/* Ein gelesenes Paket in die laufende App einhaengen.

   `BUECHER` ist in data/buecher.js ein `const` auf oberster Ebene. Fehlt die
   Datei (Live-Fall), existiert die Bindung gar nicht - dann macht
   `window.BUECHER = …` den Namen ueberhaupt erst aufloesbar. Ist die Datei da,
   verdeckt das `const` das Fensterobjekt, und die Zuweisung bleibt folgenlos.
   Beides ist richtig: mit ausgelieferten Dateien gilt deren Verzeichnis. */
function paketEinhaengen(paket){
  if (!paket || paket.art !== 'vokabelpaket' || !paket.buecher) return false;
  window.VOKABELN = window.VOKABELN || {};
  let buecher = 0, vokabeln = 0;
  Object.entries(paket.buecher).forEach(([slug, liste])=>{
    if (!Array.isArray(liste) || !liste.length) return;
    /* Bereits ausgelieferte Dateien gewinnen - sie sind die Quelle, an der
       validate.js und die Pruefskripte haengen. */
    if (!window.VOKABELN[slug]) window.VOKABELN[slug] = liste;
    buecher++; vokabeln += liste.length;
  });
  if (Array.isArray(paket.verzeichnis) && typeof BUECHER === 'undefined'){
    window.BUECHER = paket.verzeichnis;
  }
  PAKET_STAND = { buecher, vokabeln, erzeugt: paket.erzeugt || null };
  return true;
}

/* Laeuft sofort beim Laden dieser Datei, nicht erst bei DOMContentLoaded:
   js/buecher.js wartet auf dieses Versprechen, bevor es das aktive Buch
   aufbaut. Ein Fehler hier darf die App nicht aufhalten - dann startet sie
   eben ohne Paket, so wie bisher. */
const PAKET_BEREIT = paketLesen()
  .then(p => { if (p) paketEinhaengen(p); })
  .catch(e => { console.warn('Vokabelpaket nicht lesbar:', e); });

/* Eine vom Nutzer gewaehlte Datei uebernehmen. Gibt eine Klartextmeldung
   zurueck, damit der Aufrufer nur noch anzeigen muss. */
async function paketEinlesen(datei){
  const text = await datei.text();
  let paket;
  try { paket = JSON.parse(text); }
  catch { throw new Error('Das ist keine lesbare Paketdatei.'); }
  if (paket.art !== 'vokabelpaket') throw new Error('Die Datei ist kein Vokabelpaket.');
  if (!paket.buecher || !Object.keys(paket.buecher).length) throw new Error('Das Paket enthaelt keine Buecher.');
  await paketSchreiben(paket);
  return paket;
}

/* Nach dem Einlesen soll die Buchzeile sofort dastehen, ohne Neustart.
   BUCH_FEHLT muss dabei geleert werden: dort stehen die Buecher, deren Datei
   vorher nicht erreichbar war - genau die sind jetzt verfuegbar. */
function paketUebernehmen(paket){
  paketEinhaengen(paket);
  if (typeof BUCH_FEHLT !== 'undefined') BUCH_FEHLT.clear();
  if (typeof renderBuchChips === 'function') renderBuchChips();
  /* ⚠️ ALLE gewaehlten Buecher, nicht nur das erste: seit dem 11.08.2026 koennen
     mehrere gleichzeitig aktiv sein, und nach dem Einlesen eines Pakets muessen
     sie alle wieder eingehaengt werden - sonst faellt die Auswahl still auf ein
     Buch zusammen. */
  if (typeof setzeBuch === 'function'){
    const slugs = (typeof aktiveBuecher === 'function') ? aktiveBuecher() : ['madina-1'];
    return slugs.reduce((kette, s) => kette.then(()=> setzeBuch(s, true)), Promise.resolve());
  }
}
