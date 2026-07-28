/* einstellungen.js -- Einstellungen
   Teil der App-Logik; wird in index.html in fester Reihenfolge geladen und
   teilt sich mit den uebrigen js/-Dateien den globalen Namensraum. */
/* ===================== SETTINGS ===================== */
function renderSettings(){
  const sw = document.getElementById('toggleShowPlural');
  sw.classList.toggle('on', SETTINGS.showPlural);
  document.getElementById('sessionSizeSelect').value = String(SETTINGS.sessionSize);
  document.getElementById('directionSelect').value = SETTINGS.direction || 'ar-de';
  loadVoices();
}
document.getElementById('btnSettings').addEventListener('click', ()=>showScreen('settings'));
document.getElementById('toggleShowPlural').addEventListener('click', ()=>{
  SETTINGS.showPlural = !SETTINGS.showPlural;
  saveSettings();
  renderSettings();
});
document.getElementById('sessionSizeSelect').addEventListener('change', (e)=>{
  SETTINGS.sessionSize = Number(e.target.value);
  saveSettings();
});
document.getElementById('directionSelect').addEventListener('change', (e)=>{
  SETTINGS.direction = e.target.value;
  saveSettings();
});
document.getElementById('voiceSelect').addEventListener('change', (e)=>{
  SETTINGS.voiceURI = e.target.value;
  saveSettings();
});
document.getElementById('btnResetProgress').addEventListener('click', ()=>{
  if (!confirm('Wirklich den gesamten Lernfortschritt zurücksetzen? Alle Karten gehen zurück auf Box 1.')) return;
  PROGRESS = {};
  VOCAB_DATA.forEach(w=>{ PROGRESS[w.id] = { box:1, nextReview: todayStr(0), correct:0, wrong:0 }; });
  saveProgress();
  toast('Lernfortschritt zurückgesetzt');
  renderHome();
});
document.getElementById('btnResetStats').addEventListener('click', ()=>{
  if (!confirm('Wirklich den Tages-Streak zurücksetzen?')) return;
  LS.set('vt_streak', {count:0, last:null});
  toast('Streak zurückgesetzt');
  renderHome();
});

