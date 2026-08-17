/* sprachausgabe.js -- Sprachausgabe ueber die Web Speech API
   Teil der App-Logik; wird in index.html in fester Reihenfolge geladen und
   teilt sich mit den uebrigen js/-Dateien den globalen Namensraum. */
/* ===================== TTS (Browser Web Speech API) =====================

   ⚠️ Diese Datei hatte bis zum 16.08.2026 KEINEN einzigen Fehlerpfad: schlug
   `speak()` fehl, passierte nichts - kein Ton, keine Meldung, kein Eintrag in
   der Konsole. Elias am 16.08.: "ich habe eben auf dem tablet geübt und wollte
   bei einer kartekarte den sound des wortes abspielen lassen, ging aber nicht.
   ton war an und ich hab auf handy probiert, da ging es aber beim tablet
   funktioniert es irgendwie nicht."

   Genau das ist die Sorte Fehler, die man nicht einkreisen kann: auf dem Gerät
   ist nichts zu sehen, und aus der Ferne ist nichts zu messen. Deshalb meldet
   die Ausgabe jetzt, WARUM sie schweigt.

   ⭐ Die Sprachausgabe gehoert dem GERAET, nicht der App. Eine Stimme, die auf
   dem Handy da ist, muss auf dem Tablet nicht existieren - und `SETTINGS`
   (mit `voiceURI`) wird zwischen beiden Geraeten abgeglichen. Eine auf dem
   Handy gewaehlte Stimme kann auf dem Tablet also ins Leere zeigen. */

let ARABIC_VOICES = [];

/* Immer frisch nachsehen statt der zwischengespeicherten Liste zu glauben:
   Android fuellt `getVoices()` verzoegert, und die Liste aendert sich, wenn
   der Nutzer eine Stimme nachinstalliert. */
function arabischeStimmen(){
  if (!('speechSynthesis' in window)) return [];
  const alle = speechSynthesis.getVoices() || [];
  return alle.filter(v => v.lang && v.lang.toLowerCase().startsWith('ar'));
}

function loadVoices(){
  ARABIC_VOICES = arabischeStimmen();
  const sel = document.getElementById('voiceSelect');
  if (sel){
    sel.innerHTML = ARABIC_VOICES.length
      ? ARABIC_VOICES.map(v=>`<option value="${v.voiceURI}">${v.name} (${v.lang})</option>`).join('')
      : `<option value="">Keine arabische Stimme gefunden - System-Standard wird genutzt</option>`;
    /* Nur setzen, wenn es die Stimme auf DIESEM Geraet ueberhaupt gibt.
       Sonst stuende im Feld ein leerer Wert, und ein spaeteres Antippen der
       Auswahl schriebe ihn in die abgeglichenen Einstellungen zurueck. */
    if (SETTINGS.voiceURI && ARABIC_VOICES.some(v=>v.voiceURI===SETTINGS.voiceURI)){
      sel.value = SETTINGS.voiceURI;
    }
  }
}
if ('speechSynthesis' in window){
  speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();
}

/* Die Fehlercodes der Web Speech API in Saetze uebersetzen, die sagen, was zu
   TUN ist. `interrupted` und `canceled` kommen von unserem eigenen cancel()
   weiter unten und sind KEIN Fehler - dafuer gibt es bewusst keine Meldung. */
function tonFehlertext(code, stimmenZahl){
  switch (code){
    case 'interrupted':
    case 'canceled':              return null;
    case 'not-allowed':           return 'Der Browser hat den Ton blockiert — Seite antippen und noch einmal probieren.';
    case 'language-unavailable':
    case 'voice-unavailable':     return 'Dieses Gerät hat keine arabische Stimme installiert.';
    case 'audio-busy':            return 'Der Ton ist gerade belegt — einen Moment warten.';
    case 'synthesis-unavailable':
    case 'synthesis-failed':      return 'Die Sprachausgabe des Geräts hat abgelehnt.';
    default:
      return stimmenZahl
        ? 'Sprachausgabe fehlgeschlagen (' + (code || 'ohne Angabe') + ')'
        : 'Dieses Gerät hat keine arabische Stimme installiert.';
  }
}

function speakArabic(text){
  if (!('speechSynthesis' in window)){
    toast('Sprachausgabe wird von diesem Browser nicht unterstützt');
    return;
  }
  const jetzt = arabischeStimmen();
  if (jetzt.length) ARABIC_VOICES = jetzt;

  speechSynthesis.cancel();
  /* ⚠️ Android laesst `speechSynthesis` gelegentlich PAUSIERT zurueck - etwa
     nachdem die App im Hintergrund war. Danach nimmt speak() die Aeusserung
     entgegen und sagt nichts, ohne Fehler. resume() kostet nichts, wenn gar
     nichts pausiert ist. */
  if (speechSynthesis.paused) speechSynthesis.resume();

  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ar-SA';
  const gewaehlt = ARABIC_VOICES.find(v=>v.voiceURI===SETTINGS.voiceURI) || ARABIC_VOICES[0];
  if (gewaehlt) u.voice = gewaehlt;
  u.rate = 0.85;

  let gemeldet = false;
  let begonnen = 0;
  speakArabic._aktuell = u;
  u.onstart = ()=>{ gemeldet = true; begonnen = Date.now(); };
  u.onerror = (e)=>{
    const txt = tonFehlertext(e && e.error, ARABIC_VOICES.length);
    if (!txt) return;                       // eigenes cancel(), nicht melden
    gemeldet = true;
    toast(txt);
  };
  /* ⛔⛔ Der Fall, der Elias' Tablet erklaert - und der gefaehrlichste, weil er
     wie ein Erfolg aussieht: Fehlt die arabische Stimme, nimmt der Browser die
     Aeusserung an, meldet `onstart` und **acht Millisekunden spaeter** `onend`.
     Kein Fehler, kein Ausbleiben, nichts zum Abfangen. Am 16.08.2026 im
     Prüfbrowser gemessen (3 Stimmen, 0 arabische): 17301 ms -> 17309 ms.

     Gesprochen werden kann das nicht: كِتَابٌ braucht bei Tempo 0,85 ein paar
     Hundert Millisekunden. Eine Dauer unter einer Viertelsekunde heisst also
     "es kam kein Ton", egal was die Ereignisse behaupten.

     ⚠️ Nur fuer die JÜNGSTE Aeusserung auswerten. Wer zweimal schnell tippt,
     bricht die erste ab - manche Browser melden das als `onend` statt als
     Fehler, und dann stuende die Meldung da, obwohl alles in Ordnung ist. */
  u.onend = ()=>{
    if (speakArabic._aktuell !== u || !begonnen) return;
    if (Date.now() - begonnen >= 250) return;
    if ((text || '').trim().length < 2) return;
    toast(ARABIC_VOICES.length
      ? 'Kein Ton — die Stimme hat nichts gesprochen. Einstellungen → andere Stimme wählen.'
      : 'Dieses Gerät hat keine arabische Stimme installiert — in den Geräte-Einstellungen unter „Sprachausgabe / Text-in-Sprache" nachrüsten.');
  };
  speechSynthesis.speak(u);

  /* ⭐ Der haeufigste Fall meldet GAR NICHTS: die Aeusserung wird angenommen,
     und es passiert einfach nie etwas. Ohne diese Uhr bliebe genau der Fall
     unsichtbar, den Elias auf dem Tablet hatte. `pending` und `speaking`
     zaehlen als Erfolg - langsame Geraete brauchen den Vorlauf. */
  clearTimeout(speakArabic._uhr);
  speakArabic._uhr = setTimeout(()=>{
    if (gemeldet || speechSynthesis.speaking || speechSynthesis.pending) return;
    toast(ARABIC_VOICES.length
      ? 'Kein Ton — die arabische Stimme antwortet nicht. Einstellungen → andere Stimme wählen.'
      : 'Dieses Gerät hat keine arabische Stimme installiert.');
  }, 1400);
}
