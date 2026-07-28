/* sprachausgabe.js -- Sprachausgabe ueber die Web Speech API
   Teil der App-Logik; wird in index.html in fester Reihenfolge geladen und
   teilt sich mit den uebrigen js/-Dateien den globalen Namensraum. */
/* ===================== TTS (Browser Web Speech API) ===================== */
let ARABIC_VOICES = [];
function loadVoices(){
  const voices = speechSynthesis.getVoices();
  ARABIC_VOICES = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('ar'));
  const sel = document.getElementById('voiceSelect');
  if (sel){
    sel.innerHTML = ARABIC_VOICES.length
      ? ARABIC_VOICES.map(v=>`<option value="${v.voiceURI}">${v.name} (${v.lang})</option>`).join('')
      : `<option value="">Keine arabische Stimme gefunden - System-Standard wird genutzt</option>`;
    if (SETTINGS.voiceURI) sel.value = SETTINGS.voiceURI;
  }
}
if ('speechSynthesis' in window){
  speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();
}
function speakArabic(text){
  if (!('speechSynthesis' in window)){ toast('TTS wird von diesem Browser nicht unterstützt'); return; }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ar-SA';
  const chosen = ARABIC_VOICES.find(v=>v.voiceURI===SETTINGS.voiceURI) || ARABIC_VOICES[0];
  if (chosen) u.voice = chosen;
  u.rate = 0.85;
  speechSynthesis.speak(u);
}

