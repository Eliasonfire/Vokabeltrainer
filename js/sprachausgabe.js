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

/* ⭐⭐ ARABISCH OHNE STIMMENLISTE — der Knopf „Arabisch testen" (v575, 23.09.2026).

   Elias hat in der Nacht auf den 23.09. Arabisch auf BEIDEN Geräten
   installiert (Pixel: „Sprachdienste von Google", Stimme II gewählt; Tablet:
   das Samsung-Modul zeigt „Arabisch (MSA)" als installiert) — und die App
   blieb stumm: „ich habe hier die stimme ausgewählt aber beim hörmodus bekomme
   ich immer noch die fehlermeldung", dann „geht immer noch nicht". Seine
   Diagnose danach (03:40): „keine arabische unter 92 Stimmen" — dieselbe Zahl
   wie vor der Installation.

   ⭐ Der Grund liegt in Chrome, nicht hier (gelesen im Quelltext von
   TtsPlatformImpl.java): in die Stimmenliste kommen nur Sprachen, die das
   Sprachmodul MIT Land meldet (`isLanguageAvailable(locale) > 0`). Beide
   Module führen allgemeines Arabisch ohne Land (Google „ar-XA", Samsung
   „MSA") — es fällt aus der Liste, obwohl es installiert ist. Beim Sprechen
   reicht Chrome `lang` dagegen direkt ans Modul weiter. Eine Äußerung mit
   `lang = 'ar-SA'` OHNE Stimme erreicht das installierte Arabisch also
   vermutlich trotzdem. ⚠️ Vermutung aus dem Quelltext, auf seinen Geräten
   NICHT gemessen — genau deshalb der Test.

   ⛔ Warum die App nicht einfach ohne Liste losspricht: sie kann „arabisch
   gesprochen" nicht von „arabischer Text, deutsch vorgelesen" unterscheiden.
   Genau das passierte am 22.09., und seit v570 gilt sein Auftrag, statt mit
   einer nicht-arabischen Stimme zu sprechen die Meldung mit dem Weg zu zeigen
   (siehe speakArabic). Also entscheidet ER, mit dem Ohr, einmal je Gerät:
   „Arabisch testen" (Einstellungen → Hören) spricht einen Satz ohne Stimme,
   und er antwortet Ja oder Nein. (Den Knopf habe ich vorgeschlagen, nicht er.)

   ⭐ Der Schlüssel gehört dem GERÄT und wird absichtlich NICHT abgeglichen
   (er steht nicht in SYNC_SCHLUESSEL, js/sync.js): auf dem Handy kann Arabisch
   klingen und auf dem Tablet nicht. Eingetragen mit Grund in
   pruefe-abgleich.mjs, pruefe-kreislaeufe.mjs und pruefe-sicherung.mjs.
   Bewacht von werkzeuge/pruefe-sprachausgabe.mjs, samt Störtest. */
const ARABISCH_OHNE_LISTE = 'vt_arabischOhneListe';

/** Hat er auf DIESEM Gerät bestätigt, dass Arabisch ohne Stimmenliste klingt? */
function arabischOhneListe(){
  const v = LS.get(ARABISCH_OHNE_LISTE, null);
  return !!(v && v.ja === true);
}

/** Seine Antwort auf „Klang das arabisch?" merken — mit Zeit, für die Diagnose.
 *  Ein Nein bleibt als `ja:false` stehen, statt den Schlüssel zu löschen: dann
 *  sagt die Diagnose „verneint am …" und nicht „nie getestet". */
function arabischOhneListeMerken(ja){
  LS.set(ARABISCH_OHNE_LISTE, { ja: !!ja, am: new Date().toISOString() });
}

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
         jetzt dasselbe. Elias' Diagnose: „keine arabische unter 92 Stimmen".
         ⚠️ Seit v575 heißt es „gemeldet", nicht „auf diesem Gerät": auf
         seinen beiden Geräten IST Arabisch installiert, Chrome meldet es nur
         nicht (siehe ARABISCH_OHNE_LISTE oben). */
      /* Kurz, weil die Auswahl auf dem Pixel (448 px) nach ~45 Zeichen
         abschneidet — der Knopf „Arabisch testen" steht direkt darunter. */
      : (arabischOhneListe()
          ? `<option value="">Arabisch per Test bestätigt</option>`
          : `<option value="">Keine arabische Stimme gemeldet</option>`);
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
function stimmeFehltText(nachTest){
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
     Bewacht von werkzeuge/pruefe-sprachausgabe.mjs.

     ⭐ Seit v575 steht der Test VOR dem Weg zum Installieren: auf seinen
     beiden Geräten ist Arabisch installiert, nur meldet Chrome es nicht
     (siehe ARABISCH_OHNE_LISTE oben). „Dieses Gerät hat keine arabische
     Stimme" stimmte dort nie — es heißt jetzt „meldet der App".
     `nachTest` = er hat im Test „Nein" gesagt; dann nur noch der Weg.

     ⚠️ Auch der Satz für unbekannte Geräte führt jetzt über die Suche. Ein
     Helfer vermutete am 23.09.2026, Chrome fordere auf dem großen Tablet die
     Desktop-Seite an — dann fehlt „Android" im userAgent, und hier stand der
     Menüname „Text-zur-Sprache", den es auf dem Tablet so nicht gibt.
     Vermutung, nicht gemessen; die Suche stimmt in beiden Fällen. */
  const anfang = nachTest
    ? 'Dann fehlt Arabisch in der Sprachausgabe dieses Geräts. '
    : 'Dieses Gerät meldet der App keine arabische Stimme — deshalb kein Ton. '
      + 'Ist Arabisch schon installiert: in der App unter Einstellungen → Hören auf „Arabisch testen" tippen. ';
  if (android)
    return anfang + 'Zum Installieren die Einstellungen des Geräts öffnen und oben nach „Sprachausgabe" suchen. '
         + 'Dort beim Sprachmodul (Google oder Samsung) aufs Zahnrad tippen → Sprachdaten installieren → '
         + 'Arabisch. Danach hier „Arabisch testen".';
  if (apple)
    return anfang + 'Zum Installieren: Einstellungen → Bedienungshilfen → Gesprochene Inhalte → Stimmen → Arabisch laden. '
         + 'Danach die App einmal schließen und neu öffnen.';
  return anfang + 'Zum Installieren in den Einstellungen des Geräts nach „Sprachausgabe" suchen und dort '
       + 'Arabisch nachinstallieren. Danach hier „Arabisch testen".';
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

/* `probe` = der Knopf „Arabisch testen": sprechen, als wäre Arabisch ohne
   Liste schon bestätigt — genau so, wie die App es nach seinem Ja tut. Der
   Test geht also durch DIESELBEN Wachen (onend, 1400-ms-Uhr) wie jedes Wort. */
function speakArabic(text, probe){
  if (!('speechSynthesis' in window)){
    toast('Sprachausgabe wird von diesem Browser nicht unterstützt');
    return;
  }
  const jetzt = arabischeStimmen();
  if (jetzt.length) ARABIC_VOICES = jetzt;
  /* ⭐ v575: Keine Stimme in der Liste, aber er hat auf diesem Gerät gehört,
     dass es arabisch klingt → ohne Stimme sprechen, nur mit `lang`. Begründung
     bei ARABISCH_OHNE_LISTE oben. */
  const ohneListe = !ARABIC_VOICES.length && (probe === true || arabischOhneListe());

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
     [[eingefrorenes_feld_ist_kein_zustand]]

     ⭐ Seit v575 mit EINER Ausnahme: er hat auf diesem Gerät per „Arabisch
     testen" gehört, dass es ohne Liste arabisch klingt (`ohneListe`). Die
     Regel oben bleibt damit unangetastet — nur entscheidet jetzt sein Ohr,
     nicht mehr Chromes Liste, ob die Stimme arabisch ist. */
  if (!ARABIC_VOICES.length && !ohneListe){
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
  /* Bei `ohneListe` bleibt `u.voice` absichtlich leer (die Liste ist ja leer):
     dann reicht Chrome nur `lang` ans Sprachmodul des Geräts weiter. */
  u.rate = 0.85;
  /* Ohne Liste gibt es keine „andere Stimme", die man wählen könnte — der Weg
     zurück ist der Test, bei dem er „Nein" sagen kann. */
  const KEIN_TON_OHNE_LISTE = 'Kein Ton — die Sprachausgabe des Geräts hat nichts gesprochen. '
    + 'Zum Prüfen: Einstellungen → Hören → „Arabisch testen".';

  let gemeldet = false;
  let begonnen = 0;
  speakArabic._aktuell = u;
  u.onstart = ()=>{ gemeldet = true; begonnen = Date.now(); };
  u.onerror = (e)=>{
    /* Ohne Liste, aber bestätigt, zählt wie „eine Stimme ist da": ein
       unbekannter Fehler nennt dann seinen Code statt des Installierwegs. */
    const txt = tonFehlertext(e && e.error, ARABIC_VOICES.length || (ohneListe ? 1 : 0));
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
      : KEIN_TON_OHNE_LISTE);
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
      : KEIN_TON_OHNE_LISTE);
  }, 1400);
}

/* ---------- Der Knopf „Arabisch testen" (v575) ----------
   Ein Satz aus den eigenen Daten, kein selbst geschriebenes Arabisch: der
   erste Beispielsatz im Lernbestand. Ein ganzer Satz statt eines Wortes,
   damit er am Klang hört, ob es arabisch ist. */
function arabischProbeText(){
  const w = (typeof VOCAB_DATA !== 'undefined' && Array.isArray(VOCAB_DATA))
    ? VOCAB_DATA.find(x => x && typeof x.sentAr === 'string' && x.sentAr.trim())
    : null;
  return w ? w.sentAr.trim() : '';
}

/* Spricht den Probesatz und sagt, auf welchem Weg: 'liste' (eine gemeldete
   Stimme — wie immer, eine Frage braucht es dann nicht), 'ohne' (keine
   gemeldet — gesprochen nur mit `lang`, genau wie nach seinem Ja) oder ''
   (dieser Browser kann gar nicht sprechen, oder es gibt keinen Satz). */
function arabischProbeSprechen(){
  if (!('speechSynthesis' in window)){
    toast('Sprachausgabe wird von diesem Browser nicht unterstützt');
    return '';
  }
  const text = arabischProbeText();
  if (!text){ toast('Kein Probesatz gefunden — die Wortliste ist noch nicht geladen.'); return ''; }
  const weg = arabischeStimmen().length ? 'liste' : 'ohne';
  speakArabic(text, true);
  return weg;
}
