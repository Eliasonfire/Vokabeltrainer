/* init.js -- Start der App
   Teil der App-Logik; wird in index.html in fester Reihenfolge geladen und
   teilt sich mit den uebrigen js/-Dateien den globalen Namensraum. */
/* ===================== INIT ===================== */
document.addEventListener('click', (e)=>{
  const chip = e.target.closest('.word-chip');
  // klick auf Chip im Pool/Kategorie ohne Drag = nichts (Drag uebernimmt), Platzhalter fuer spaeter
});

/* ⛔⛔ DAS MENÜ DES BROWSERS BLEIBT ZU (09.09.2026).

   Elias mit Bild des aufgeklappten Chrome-Menüs über dem Verstext: „habe
   lange drauf gehlaten an eine stelle und dann ist das auf gegangen, das soll
   eigentlich nicht passieren" — und auf die Rückfrage, ob nur im Leser:
   „grundsätzlich auf der app nichts zu suchen".

   ⭐ Das Menü gehört dem Browser („Zurück, Neu laden, Drucken, QR-Code für
   diese Seite"). In einer installierten App ist es sinnlos und verdeckt beim
   Lesen den halben Bildschirm — man hält den Finger schon mal still.

   ⛔⛔ MIT EINER AUSNAHME, und die ist keine Kür: In einem Eingabefeld ist das
   lange Drücken der einzige Weg zu „Einfügen". Ohne diese Abfrage könnte er in
   die Suche, ins Sprungfeld und ins Vokabelformular nichts mehr einsetzen —
   eine Fähigkeit weggenommen, die niemand zur Sprache gebracht hat.
   [[fehler_trifft_mehr_als_gemeldet]]

   ⚠️ `closest`, nicht `e.target.tagName`: getippt wird oft auf ein Kind des
   Feldes, und `contenteditable` gehört genauso dazu. */
document.addEventListener('contextmenu', (e)=>{
  if (e.target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]')) return;
  e.preventDefault();
});

if ('serviceWorker' in navigator){
  /* ⛔⛔ „ES IST IMMER NOCH DA" — und die Fassung war längst behoben.
     (09.09.2026)

     Am 09.09. hat Elias zweimal hintereinander gemeldet, eine Lücke sei nicht
     weg, während sie im Quelltext seit zwei Auslieferungen behoben war. Seine
     Diagnosekarte zeigte es dann: die App lief auf der VORIGEN Fassung.

     ⭐ Die Ursache ist keine Nachlässigkeit, sondern der normale Ablauf: Der
     Service Worker holt die neue Fassung, `skipWaiting()` und `clients.claim()`
     lassen ihn sofort übernehmen — aber die BEREITS GELADENE Seite behält ihr
     altes JavaScript im Speicher. Es braucht ein zweites Öffnen, und das weiß
     niemand, dem es keiner sagt. [[alte_fassung_beim_nutzer]]

     ⚠️ `controllerchange` feuert auch beim ALLERERSTEN Mal, wenn vorher gar
     kein Service Worker da war. Dann ist nichts veraltet — deshalb wird
     gemerkt, ob beim Laden schon einer steuerte. Ohne diese Abfrage bekäme
     jeder Erststart eine Meldung über eine Aktualisierung, die es nicht gab.
     [[bedingung_wird_durch_die_handlung_ungueltig]]

     ⛔ NICHT von selbst neu laden. Wer mitten in einer Übungsrunde steht,
     verliert sonst seinen Stand — die Meldung fragt, sie handelt nicht. */
  /* ⛔⛔ HIER STAND EINE MELDUNG „Neue Fassung ist da · Jetzt laden" — eine
     halbe Stunde lang (v426 bis v428). Elias mit Bild davon: „und diese
     nachricht will ich auch nicht bekommen, ich lade schon selbst immer".

     Ersatzlos gestrichen, samt Markup und Stil. Was bleibt, ist die
     Versionszeile in der Diagnosekarte — die meldet sich nicht, man muss sie
     ansehen. Der Grund für die Meldung (die schon geladene Seite behält ihr
     altes JavaScript, bis sie ein zweites Mal geöffnet wird) gilt weiter;
     er ist im Gedächtnis festgehalten, nicht in der App.
     [[schweigen_ist_kein_auftrag]] [[keine_meldung_ohne_seine_handlung]] */
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  });
}

/* Startzustand als Wurzel der Historie festschreiben. */
history.replaceState({ screen:'home', tiefe:0 }, '');
showScreen('home', { ersetzen: true });

