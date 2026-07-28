/* init.js -- Start der App
   Teil der App-Logik; wird in index.html in fester Reihenfolge geladen und
   teilt sich mit den uebrigen js/-Dateien den globalen Namensraum. */
/* ===================== INIT ===================== */
document.addEventListener('click', (e)=>{
  const chip = e.target.closest('.word-chip');
  // klick auf Chip im Pool/Kategorie ohne Drag = nichts (Drag uebernimmt), Platzhalter fuer spaeter
});

if ('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  });
}

/* Startzustand als Wurzel der Historie festschreiben. */
history.replaceState({ screen:'home', tiefe:0 }, '');
showScreen('home', { ersetzen: true });

