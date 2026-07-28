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
/* ---------- Sicherung ----------
   Alles, was Elias selbst erarbeitet hat, steht im localStorage dieses einen
   Browsers: Leitner-Boxen, eigene Eselsbruecken, abgehakte Verse, eigene
   Vokabeln, eigene Kategorien. Ein geleerter Browserspeicher, ein neues Handy
   oder ein anderer Browser - und es ist weg. Die App hat kein Backend und soll
   auch keines bekommen (Goal-Prompt), also ist eine Datei der richtige Weg:
   sie liegt bei ihm, geht durch keine fremde Hand und funktioniert offline.

   Der Wortschatz selbst wird NICHT mitgesichert. Der steht in den Datendateien
   der App und kommt beim naechsten Aufruf ohnehin wieder - ihn mitzuschreiben
   blaehte die Sicherung von wenigen Kilobyte auf ueber ein Megabyte auf. */
const SICHERUNGS_SCHLUESSEL = [
  'vt_progress', 'vt_notes', 'vt_settings', 'vt_streak',
  'vt_personalVocab', 'vt_customCats', 'vt_hifz', 'vt_hifzVerse'
];

function baueSicherung(){
  const daten = {};
  SICHERUNGS_SCHLUESSEL.forEach(k=>{
    const v = localStorage.getItem(k);
    if (v !== null) daten[k] = v;
  });
  return {
    art: 'vokabeltrainer-sicherung',
    fassung: 1,
    erstellt: new Date().toISOString(),
    vokabelnImGeraet: VOCAB_DATA.length,   // nur zur Orientierung beim Einlesen
    daten
  };
}

document.getElementById('btnSicherung').addEventListener('click', ()=>{
  const inhalt = JSON.stringify(baueSicherung(), null, 1);
  const url = URL.createObjectURL(new Blob([inhalt], {type:'application/json'}));
  const a = document.createElement('a');
  a.href = url;
  a.download = `vokabeltrainer-sicherung-${todayStr(0)}.json`;
  a.click();
  /* Erst nach dem Klick freigeben - sonst ist die URL weg, bevor der Browser
     sie gelesen hat. */
  setTimeout(()=>URL.revokeObjectURL(url), 2000);
  toast('Sicherung gespeichert.');
});

document.getElementById('btnSicherungLaden').addEventListener('click', ()=>{
  document.getElementById('sicherungDatei').click();
});

document.getElementById('sicherungDatei').addEventListener('change', (e)=>{
  const datei = e.target.files && e.target.files[0];
  e.target.value = '';                      // damit dieselbe Datei erneut geht
  if (!datei) return;
  const leser = new FileReader();
  leser.onload = ()=>{
    let sicherung;
    try { sicherung = JSON.parse(leser.result); }
    catch { toast('Das ist keine lesbare Sicherungsdatei.'); return; }
    if (!sicherung || sicherung.art !== 'vokabeltrainer-sicherung' || !sicherung.daten){
      toast('Diese Datei stammt nicht aus dem Vokabeltrainer.');
      return;
    }
    const wann = sicherung.erstellt ? sicherung.erstellt.slice(0,10) : 'unbekannt';
    if (!confirm(`Sicherung vom ${wann} einlesen?\n\nDer aktuelle Stand auf diesem Gerät wird dabei ersetzt — Boxen, Eselsbrücken, Hifz, eigene Vokabeln.`)) return;
    /* Nur die bekannten Schluessel uebernehmen. Eine Sicherungsdatei ist eine
       fremde Datei; ungepruefte Schluessel aus ihr in den localStorage zu
       schreiben waere unnoetig grosszuegig. */
    SICHERUNGS_SCHLUESSEL.forEach(k=>{
      if (typeof sicherung.daten[k] === 'string') localStorage.setItem(k, sicherung.daten[k]);
      else localStorage.removeItem(k);
    });
    toast('Sicherung eingelesen — die App startet neu.');
    /* Neu laden statt den halben Zustand im Speicher nachzuziehen: PROGRESS,
       NOTES, SETTINGS, HIFZ und die eigenen Vokabeln haengen an Modulvariablen,
       die beim Start gefuellt werden. */
    setTimeout(()=>location.reload(), 900);
  };
  leser.onerror = ()=> toast('Die Datei liess sich nicht lesen.');
  leser.readAsText(datei);
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

