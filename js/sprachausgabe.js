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
      /* ⛔ „System-Standard wird genutzt" stand hier bis zum 22.09.2026 und war
         irreführend: genutzt wird dann irgendeine der Stimmen des Geräts, und
         die liest arabischen Text deutsch vor. Seit v570 spricht die App in
         diesem Fall gar nicht mehr, sondern nennt den Weg — die Auswahl sagt
         jetzt dasselbe. Elias' Diagnose: „keine arabische unter 92 Stimmen". */
      : `<option value="">Keine arabische Stimme auf diesem Gerät — Ton bleibt aus</option>`;
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
/* ⭐ DER WEG ZUM INSTALLIEREN, und zwar der, der auf SEINEM Gerät gilt.

   Elias liest die Meldung auf dem Handy oder dem Tablet — beides Android
   (gemessen 22.09.2026: Pixelverhältnis 3 bzw. 1,75, beide „installierte App
   (standalone)"). Ein allgemeines „in den Geräte-Einstellungen nachrüsten"
   lässt ihn suchen; der Pfad steht deshalb ausgeschrieben.

   ⛔ Kein Link und kein Knopf, der irgendwo hinführt: eine Seite kann die
   Sprachausgabe-Einstellungen des Geräts nicht öffnen, und ein Knopf, der
   nichts tut, ist schlimmer als ein Satz, der den Weg nennt.
   ⚠️ Die Erkennung ist bewusst grob und nennt im Zweifel BEIDE Wege — ein
   falsch geratener Pfad schickt ihn in ein Menü, das es nicht gibt.
   [[kann_ist_nicht_ist]] */
function stimmeFehltText(){
  const ua = String((navigator && navigator.userAgent) || '');
  const android = /Android/i.test(ua);
  const apple = /iPhone|iPad|iPod/i.test(ua);
  /* ⛔ Seit v573 KEIN Herstellerpfad mehr. Bis v572 stand hier für jedes
     Android-Gerät der Samsung-Weg („Allgemeine Verwaltung"). Elias am
     23.09.2026: „ich habe ein pixel 10 pro xl und samsung galaxy tablet S9
     ultra" — auf dem Pixel gibt es dieses Menü nicht. Genau der Fall aus dem
     Kommentar oben.
     Unterscheiden lässt sich das hier nicht: Chrome nennt im userAgent statt
     des Modells nur „K" (User-Agent-Reduktion). Das ist bekannt, auf seinen
     Geräten aber NICHT gemessen — die Diagnose führt den userAgent nicht. Die
     Suche in den Einstellungen gibt es auf beiden Geräten.
     ⚠️ Auch die Wörter hier (Zahnrad, „Sprachdaten installieren") sind nicht
     auf seinen Geräten nachgesehen. Nennt er andere, hier eintragen.
     Bewacht von werkzeuge/pruefe-sprachausgabe.mjs. */
  if (android)
    return 'Dieses Gerät hat keine arabische Stimme — deshalb kein Ton. '
         + 'Einstellungen öffnen und oben nach „Sprachausgabe" suchen. Dort beim '
         + 'Sprachmodul (Google oder Samsung) aufs Zahnrad tippen → Sprachdaten installieren → '
         + 'Arabisch. Danach die App einmal schließen und neu öffnen.';
  if (apple)
    return 'Dieses Gerät hat keine arabische Stimme — deshalb kein Ton. '
         + 'Einstellungen → Bedienungshilfen → Gesprochene Inhalte → Stimmen → Arabisch laden. '
         + 'Danach die App einmal schließen und neu öffnen.';
  return 'Dieses Gerät hat keine arabische Stimme — deshalb kein Ton. '
       + 'In den Sprachausgabe-Einstellungen des Geräts („Text-zur-Sprache") Arabisch nachinstallieren, '
       + 'dann die App einmal schließen und neu öffnen.';
}

function tonFehlertext(code, stimmenZahl){
  switch (code){
    case 'interrupted':
    case 'canceled':              return null;
    case 'not-allowed':           return 'Der Browser hat den Ton blockiert — Seite antippen und noch einmal probieren.';
    case 'language-unavailable':
    case 'voice-unavailable':     return stimmeFehltText();
    case 'audio-busy':            return 'Der Ton ist gerade belegt — einen Moment warten.';
    case 'synthesis-unavailable':
    case 'synthesis-failed':      return 'Die Sprachausgabe des Geräts hat abgelehnt.';
    default:
      return stimmenZahl
        ? 'Sprachausgabe fehlgeschlagen (' + (code || 'ohne Angabe') + ')'
        : stimmeFehltText();
  }
}

function speakArabic(text){
  if (!('speechSynthesis' in window)){
    toast('Sprachausgabe wird von diesem Browser nicht unterstützt');
    return;
  }
  const jetzt = arabischeStimmen();
  if (jetzt.length) ARABIC_VOICES = jetzt;

  /* ⭐⭐ KEINE ARABISCHE STIMME: SOFORT SAGEN, NICHT ERST NACH 1,4 SEKUNDEN.

     Elias' Diagnose vom 22.09.2026, auf BEIDEN Geräten gleich:
     „Arabische Stimmen: keine arabische unter 92 Stimmen". Es ist also kein
     Fehler der App — auf keinem seiner Geräte ist eine arabische Stimme
     installiert. Trotzdem nahm die App die Äußerung entgegen, der Browser
     griff sich irgendeine der 92 Stimmen, und heraus kam arabischer Text,
     deutsch vorgelesen. Erst 1,4 Sekunden später kam die Meldung.

     Sein Auftrag: die App soll es am Lautsprecherknopf sagen und den Weg zum
     Installieren nennen, statt stumm mit einer nicht-arabischen Stimme zu
     sprechen.

     ⛔ Der Sprechversuch entfällt hier bewusst. Ein Wort in deutscher
     Aussprache ist beim Vokabellernen schlimmer als gar kein Ton: er würde
     sich die falsche Lautung einprägen. [[vokabeln_sind_der_teuerste_teil]]

     ⚠️ Geprüft wird die FRISCH gelesene Liste, nicht die gemerkte: Android
     liefert die Stimmen verzögert nach, und eine alte leere Liste würde die
     Ansage auch dann zeigen, wenn inzwischen eine Stimme da ist.
     [[eingefrorenes_feld_ist_kein_zustand]] */
  if (!ARABIC_VOICES.length){
    toast(stimmeFehltText());
    return;
  }

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
      : stimmeFehltText());
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
      : stimmeFehltText());
  }, 1400);
}
