/* einstellungen.js -- Einstellungen
   Teil der App-Logik; wird in index.html in fester Reihenfolge geladen und
   teilt sich mit den uebrigen js/-Dateien den globalen Namensraum. */
/* ===================== SETTINGS ===================== */
function renderSettings(){
  const sw = document.getElementById('toggleShowPlural');
  sw.classList.toggle('on', SETTINGS.showPlural);
  document.getElementById('togglePluralKarten').classList.toggle('on', !!SETTINGS.pluralKarten);
  document.getElementById('toggleVerbFormen').classList.toggle('on', !!SETTINGS.showVerbFormen);
  document.getElementById('toggleQuran').classList.toggle('on', !!SETTINGS.showQuran);
  document.getElementById('sessionSizeSelect').value = String(SETTINGS.sessionSize);
  document.getElementById('directionSelect').value = SETTINGS.direction || 'ar-de';
  document.getElementById('toggleTippen').classList.toggle('on', !!SETTINGS.tippenAbBox4);
  /* Wurzelmodus. Die Ausrichtung ist standardmaessig AN, deshalb wird auf
     `!== false` geprueft und nicht auf Wahrheit - ein fehlender Eintrag ist
     hier "an", nicht "aus". */
  document.getElementById('wurzelFarbeSelect').value = SETTINGS.wurzelFarbe || 'normal';
  document.getElementById('wurzelNiveauSelect').value = SETTINGS.wurzelNiveau || 'stand';
  document.getElementById('toggleWurzelAusrichten')
    .classList.toggle('on', SETTINGS.wurzelAusrichten !== false);
  zeichneKenneSchonListe();
  zeichneEinzelnFreiListe();
  loadVoices();
}

/* ---------- Der Rückweg aus „Kenne ich schon" (17.08.2026) ----------

   Ohne diese Liste wäre der Knopf eine Einbahnstraße: ein Fehlgriff, und das
   Wort wäre für immer weg - und nirgends stünde, welches. (Der Knopf steht
   seit dem 18.08.2026 im Hörmodus, vorher auf der Lernkarte. Hier ändert das
   nichts: die Liste ist der Rückweg für beide Fälle.)
   Genau daran ist die Idee beim Aufschreiben der Anleitung gescheitert („dann
   holst du es dir zurück, indem du …" - es gab kein Indem).

   Die Liste steht bewusst offen da und nicht hinter einem Aufklapper: sie ist
   normalerweise leer und stört dann nicht (`:empty{display:none}`), und wenn
   sie etwas enthält, ist genau das die Auskunft, die man sucht. */
/* ⭐ Die Wörter, die er einzeln freigeschaltet hat, obwohl ihr Kapitel noch zu
   ist (20.08.2026). Ohne diese Liste ist der Knopf in der Wortkarte eine
   Einbahnstraße: zurücknehmen ginge nur dort, wo man das Wort erst wieder
   suchen muss. Genau dieselbe Überlegung wie eine Liste weiter oben. */
function zeichneEinzelnFreiListe(){
  const kasten = document.getElementById('einzelnFreiListe');
  const stand  = document.getElementById('einzelnFreiStand');
  const alle   = document.getElementById('btnEinzelnFreiAlle');
  if (!kasten || !stand) return;
  const woerter = (typeof einzelnFreigeschaltete === 'function') ? einzelnFreigeschaltete() : [];

  stand.textContent = woerter.length
    ? `${woerter.length} ${woerter.length===1?'Wort läuft':'Wörter laufen'} mit, obwohl das Kapitel noch zu ist`
    : 'Noch keins freigeschaltet';
  if (alle) alle.disabled = !woerter.length;

  kasten.innerHTML = woerter.map(w =>
    `<div class="kenne-schon-eintrag">
       <div class="kenne-schon-wort">
         <span class="ar" lang="ar" dir="rtl">${escapeHtml(w.sg || w.ar)}</span>
         <span class="de">${escapeHtml(w.de)} · ${escapeHtml(kapitelBeschriftung(w))}</span>
       </div>
       <button class="kenne-schon-zurueck" data-einzelnzurueck="${escapeHtml(String(w.id))}">Wieder zumachen</button>
     </div>`).join('');
}

document.getElementById('einzelnFreiListe').addEventListener('click', (e)=>{
  const knopf = e.target.closest('[data-einzelnzurueck]');
  if (!knopf) return;
  const id = knopf.dataset.einzelnzurueck;
  setzeEinzelnFrei(id, false);
  zeichneEinzelnFreiListe();
  /* ⚠️ Wie in der Wortkarte: Lernvorrat, Kategorien, Wortfelder und Statistik
     hängen alle an derselben Prüfung und stehen sonst mit der alten Liste da. */
  if (typeof nachAuswahlwechsel === 'function') nachAuswahlwechsel();
  const w = VOCAB_DATA.find(x => String(x.id) === id);
  toast(w ? `${w.de} ist wieder außer Reichweite.` : 'Zurückgenommen.');
});

document.getElementById('btnEinzelnFreiAlle').addEventListener('click', ()=>{
  const woerter = einzelnFreigeschaltete();
  if (!woerter.length) return;
  woerter.forEach(w => setzeEinzelnFrei(w.id, false));
  zeichneEinzelnFreiListe();
  if (typeof nachAuswahlwechsel === 'function') nachAuswahlwechsel();
  toast(`${woerter.length} ${woerter.length===1?'Wort ist':'Wörter sind'} wieder außer Reichweite.`);
});

function zeichneKenneSchonListe(){
  const kasten = document.getElementById('kenneSchonListe');
  const stand  = document.getElementById('kenneSchonStand');
  const alle   = document.getElementById('btnKenneSchonAlle');
  if (!kasten || !stand) return;
  const woerter = (typeof bekannteMarkierungen === 'function') ? bekannteMarkierungen() : [];

  stand.textContent = woerter.length
    ? `${woerter.length} ${woerter.length===1?'Wort wird':'Wörter werden'} nicht mehr abgefragt`
    : 'Noch keins ausgeblendet';
  if (alle) alle.disabled = !woerter.length;

  kasten.innerHTML = woerter.map(w =>
    `<div class="kenne-schon-eintrag">
       <div class="kenne-schon-wort">
         <span class="ar" lang="ar" dir="rtl">${escapeHtml(w.ar)}</span>
         <span class="de">${escapeHtml(w.de)}</span>
       </div>
       <button class="kenne-schon-zurueck" data-zurueck="${escapeHtml(String(w.id))}">Wieder abfragen</button>
     </div>`).join('');
}

document.getElementById('kenneSchonListe').addEventListener('click', (e)=>{
  const knopf = e.target.closest('[data-zurueck]');
  if (!knopf) return;
  const id = knopf.dataset.zurueck;
  setzeKennErSchon(id, false);
  zeichneKenneSchonListe();
  const w = VOCAB_DATA.find(x => String(x.id) === id);
  toast(w ? `${w.de} wird wieder abgefragt.` : 'Wieder in der Abfrage.');
});

document.getElementById('btnKenneSchonAlle').addEventListener('click', ()=>{
  const woerter = bekannteMarkierungen();
  if (!woerter.length) return;
  woerter.forEach(w => setzeKennErSchon(w.id, false));
  zeichneKenneSchonListe();
  toast(`${woerter.length} ${woerter.length===1?'Wort kommt':'Wörter kommen'} wieder in die Abfrage.`);
});

/* Faerbung der Wurzel. Wirkt ueber ein Attribut am <body>, nicht ueber eine
   Klasse an jedem Wort: so laesst sie sich umschalten, ohne irgendetwas neu
   aufzubauen - und der Lesestand einer laufenden Uebung bleibt stehen. */
document.getElementById('wurzelFarbeSelect').addEventListener('change', (e)=>{
  SETTINGS.wurzelFarbe = e.target.value;
  saveSettings();
  document.body.dataset.wurzelfarbe = SETTINGS.wurzelFarbe;
  if (SETTINGS.wurzelFarbe === 'um'){
    toast('Umgekehrt: 32 von 113 Wörtern bestehen restlos aus ihrer Wurzel und stehen dann ganz grau da.');
  }
});
document.getElementById('toggleWurzelAusrichten').addEventListener('click', ()=>{
  SETTINGS.wurzelAusrichten = (SETTINGS.wurzelAusrichten === false);
  saveSettings();
  renderSettings();
  if (typeof wzAusrichten === 'function') wzAusrichten();
});
/* ⚠️ Das Niveau baut den ganzen Bestand neu auf. Danach MUSS eine frische
   Sitzung beginnen - die laufende zeigte sonst noch Woerter vom alten Stand,
   und der Hinweis darunter naennte eine Zahl, die zu ihr nicht passt. */
document.getElementById('wurzelNiveauSelect').addEventListener('change', (e)=>{
  SETTINGS.wurzelNiveau = e.target.value;
  saveSettings();
  if (typeof oeffneWurzeln === 'function') oeffneWurzeln();
});
document.getElementById('toggleTippen').addEventListener('click', ()=>{
  SETTINGS.tippenAbBox4 = !SETTINGS.tippenAbBox4;
  saveSettings();
  renderSettings();
  /* Der Hinweis erklaert, warum nach dem Einschalten erst mal nichts passiert:
     Karten in Box 1 bis 3 bleiben unveraendert. */
  if (SETTINGS.tippenAbBox4) toast('Ab Box 4 wird eingetippt — in Richtung Deutsch → Arabisch.');
});
document.getElementById('btnSettings').addEventListener('click', ()=>showScreen('settings'));
document.getElementById('toggleShowPlural').addEventListener('click', ()=>{
  SETTINGS.showPlural = !SETTINGS.showPlural;
  saveSettings();
  renderSettings();
});
/* ---------- Pluralkarten ein- und ausschalten (18.08.2026) ----------

   Anders als die Schalter darueber aendert dieser nicht nur die Anzeige,
   sondern den BESTAND: beim Einschalten kommen rund 120 Karten dazu, beim
   Ausschalten verschwinden sie wieder. Deshalb drei Dinge, die die anderen
   Schalter nicht brauchen:

   1. `wendePluralKartenAn` baut VOCAB_DATA um.
   2. `initProgress()` traegt fuer die neuen Karten eine Startbox nach - ohne
      das saehe man sie in den Kategorien, aber nie in „Jetzt lernen".
   3. Der Startbildschirm und die Kategorien zeigen Zaehlungen, die sich
      dadurch aendern; ohne den Neuaufbau stimmten sie bis zum naechsten Start
      nicht.

   ⭐ Der Fortschritt bleibt beim Ausschalten erhalten. initProgress loescht
   nichts, es traegt nur Fehlendes nach - wer die Karten wieder einschaltet,
   findet seine Kaesten so vor, wie er sie verlassen hat. */
document.getElementById('togglePluralKarten').addEventListener('click', ()=>{
  SETTINGS.pluralKarten = !SETTINGS.pluralKarten;
  saveSettings();
  const stand = wendePluralKartenAn(SETTINGS.pluralKarten);
  PROGRESS = initProgress();
  renderSettings();
  if (typeof renderHome === 'function') renderHome();
  if (typeof renderChapterCats === 'function') renderChapterCats();
  const dazu = Math.abs(stand.nachher - stand.vorher);
  toast(SETTINGS.pluralKarten
    ? `${dazu} Pluralkarten sind dazugekommen — sie starten in Kasten 1.`
    : `${dazu} Pluralkarten ausgeblendet. Ihr Fortschritt bleibt gespeichert.`);
});
/* Verbformen ein- und ausschalten (Elias' Wunsch vom 30.07.2026). Genau wie bei
   den Pluralformen: eine Umschaltung, kein eigener Bildschirm. */
document.getElementById('toggleVerbFormen').addEventListener('click', ()=>{
  SETTINGS.showVerbFormen = !SETTINGS.showVerbFormen;
  saveSettings();
  renderSettings();
});
/* Quran-Bezuege ein- und ausschalten (Elias' Wunsch vom 31.07.2026).
   renderHome() muss mit, weil die Kachel auf dem Startbildschirm daran haengt —
   ohne den Aufruf erschiene sie erst beim naechsten Start. */
document.getElementById('toggleQuran').addEventListener('click', ()=>{
  SETTINGS.showQuran = !SETTINGS.showQuran;
  saveSettings();
  renderSettings();
  if (typeof renderHome === 'function') renderHome();
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
  'vt_personalVocab', 'vt_customCats', 'vt_hifz', 'vt_hifzVerse',
  'vt_hoerTag',   /* Tageszaehler Hoermodus, 17.08.2026 */
  'vt_bekannt',   /* „Kenne ich schon" — seine Auswahl, nicht wiederherstellbar */
  'vt_vorschlagNr', /* welcher Eselsbrücken-Vorschlag gilt (18.08.2026) — dito */
  'vt_vorschlagWeg', /* welche Vorschläge er abgelehnt hat (19.08.2026) — dito */
  'vt_wortAenderungen', /* seine Korrekturen an Buchvokabeln (18.08.2026) */
  'vt_geloescht',   /* ausgeblendete Fachbegriffe (18.08.2026) */
  /* Beide am 04.08.2026 nachgetragen. `vt_quranFav` (Favoriten-Suren) war seit
     seiner Einfuehrung am selben Tag nicht dabei - aufgefallen erst, als
     `vt_lesestand` dazukam und die Liste noch einmal gelesen wurde. Wer eine
     Sicherung einspielte, verlor die Favoriten lautlos. */
  'vt_quranFav', 'vt_lesestand',
  /* Seine eigenen Grammatiknotizen an den Wortkarten (20.08.2026). Sie stehen
     nirgends sonst — geht die Liste hier daran vorbei, ist die Sicherung eine
     Sicherung ohne sie, und das faellt erst beim Einspielen auf. */
  'vt_notizen'
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
/* HIER STAND „Streak zurücksetzen". Am 29.07.2026 auf Elias' Wunsch entfernt.
   Der Schlüssel `vt_streak` bleibt selbstverständlich — nur der Knopf ist weg. */

/* ---------- App aktualisieren ----------
   Notausgang aus einem Kreislauf, in dem Elias am 30.07.2026 festhing: Die
   Ziehgeste zum Aktualisieren war kaputt, also kam kein neuer Stand an — auch
   nicht der Fix für die Geste. In der installierten App gibt es weder
   Adressleiste noch Neuladen-Knopf des Browsers.

   Es reicht NICHT, einfach `location.reload()` zu rufen: der Service Worker
   liefert seit v27 zwar Netz zuerst, aber der HTTP-Cache des Browsers ist eine
   zweite, stillere Ebene darunter. Genau daran ist beim Prüfen zweimal ein
   scheinbar alter Stand entstanden, obwohl der Server längst das Neue auslieferte.
   Deshalb wird jede eingebundene Datei einzeln mit `cache:'reload'` geholt —
   das entwertet ihren HTTP-Cache-Eintrag — und danach neu geladen. */
document.getElementById('btnAktualisieren').addEventListener('click', async ()=>{
  const knopf = document.getElementById('btnAktualisieren');
  knopf.disabled = true;
  knopf.textContent = 'lädt …';
  try {
    const dateien = [...document.querySelectorAll('script[src]')]
      .map(s => s.getAttribute('src'))
      .filter(s => s && !/^https?:/.test(s))
      .concat(['index.html', 'manifest.json']);
    /* Einzeln und mit abgefangenem Fehler: eine Datei, die gerade nicht
       erreichbar ist, darf das Aktualisieren nicht verhindern. */
    for (const d of dateien){ try { await fetch(d, { cache: 'reload' }); } catch(_){} }
    /* Den Service-Worker-Cache mitnehmen, sonst liefert er beim nächsten
       Offline-Start weiter den alten Stand. */
    if ('caches' in window){
      const namen = await caches.keys();
      await Promise.all(namen.map(n => caches.delete(n)));
    }
  } catch (e) {
    console.warn('Aktualisieren nur teilweise möglich:', e);
  }
  location.reload();
});

/* ---------- Automatische Sicherung ----------
   Elias am 29.07.2026: "Außerdem sollte die Fortschrittssicherung automatisch
   immer passieren."

   Was hier automatisch geht und was nicht, ist wichtig zu trennen:
   Eine DATEI kann die App nicht von sich aus schreiben — jeder Download braucht
   eine Nutzergeste, sonst blockt der Browser. Automatisch geht deshalb eine
   Sicherung IM GERÄT: derselbe Datenstand, unter einem eigenen Schlüssel im
   IndexedDB, unabhängig von den laufenden localStorage-Einträgen.

   Was das rettet und was nicht — ehrlich, damit niemand sich in falscher
   Sicherheit wiegt:
     ✓ versehentliches „Fortschritt zurücksetzen"
     ✓ ein kaputtgeschriebener localStorage-Eintrag
     ✗ geleerte Browserdaten, neues Handy, anderer Browser
   Für den zweiten Fall braucht es weiterhin die Datei — deshalb bleibt der
   Knopf „Fortschritt sichern" stehen und die Notiz darunter sagt es. */
const AUTO_SICHERUNG_KEY = 'auto-sicherung';

async function sichereAutomatisch(grund){
  try {
    const db = await paketDbOeffnen();
    await new Promise((fertig, fehler)=>{
      const t = db.transaction(PAKET_STORE, 'readwrite');
      t.objectStore(PAKET_STORE).put(
        Object.assign(baueSicherung(), { grund, automatisch: true }), AUTO_SICHERUNG_KEY);
      t.oncomplete = ()=>{ fertig(); db.close(); };
      t.onerror    = ()=>{ fehler(t.error); db.close(); };
    });
  } catch (e) {
    /* Bewusst still: eine fehlgeschlagene Hintergrundsicherung darf den
       Lernfluss nicht mit einer Meldung unterbrechen. Sie steht in der Konsole,
       falls jemand nachsieht. */
    console.warn('Automatische Sicherung nicht möglich:', e);
  }
}

/* `visibilitychange` statt `beforeunload`: Auf Android wird eine App oft gar
   nicht "verlassen", sondern nur weggewischt — `beforeunload` feuert dann
   nicht. `hidden` ist das einzige Ereignis, auf das bei mobilen Browsern
   Verlass ist. Zusätzlich beim Rundenende, weil dort der meiste Fortschritt
   auf einmal entsteht. */
document.addEventListener('visibilitychange', ()=>{
  if (document.visibilityState === 'hidden') sichereAutomatisch('App in den Hintergrund');
});
window.addEventListener('pagehide', ()=>sichereAutomatisch('Seite verlassen'));


/* ---------- Vokabelpaket ----------
   Holt alle acht Lehrwerke auf dieses Geraet, ohne dass arabicroots'
   Datenbankarbeit im oeffentlichen Repo stehen muss. Die Datei baut Elias
   lokal mit `node werkzeuge/baue-vokabelpaket.mjs`; Hintergrund und
   Speicherweg stehen in js/vokabelpaket.js.

   Anders als "Sicherung einlesen" wird hier NICHTS ersetzt: das Paket bringt
   nur Vokabeln mit, Boxen und Eselsbruecken bleiben unberuehrt. Deshalb auch
   keine Rueckfrage und kein Neustart. */
function zeigePaketStand(){
  const ziel = document.getElementById('paketStand');
  if (!ziel) return;
  if (typeof PAKET_STAND !== 'undefined' && PAKET_STAND){
    const wann = PAKET_STAND.erzeugt ? PAKET_STAND.erzeugt.slice(0,10) : 'unbekannt';
    ziel.textContent = `${PAKET_STAND.buecher} Bücher, ${PAKET_STAND.vokabeln} Vokabeln — Stand ${wann}`;
  } else {
    ziel.textContent = 'Alle acht Lehrwerke auf dieses Gerät holen';
  }
}

document.getElementById('btnPaketLaden').addEventListener('click', ()=>{
  document.getElementById('paketDatei').click();
});

document.getElementById('paketDatei').addEventListener('change', async (e)=>{
  const datei = e.target.files && e.target.files[0];
  e.target.value = '';                        // damit dieselbe Datei erneut geht
  if (!datei) return;
  try {
    toast('Lese Vokabelpaket …');
    const paket = await paketEinlesen(datei);
    await paketUebernehmen(paket);
    zeigePaketStand();
    if (typeof renderChapterFilterChips === 'function') renderChapterFilterChips();
    if (typeof renderHome === 'function') renderHome();
    toast(`${PAKET_STAND.buecher} Bücher, ${PAKET_STAND.vokabeln} Vokabeln eingelesen.`);
  } catch (err){
    toast(err.message || 'Das Vokabelpaket liess sich nicht einlesen.');
  }
});

/* Beim Start anzeigen, was auf diesem Geraet liegt - erst wenn das Paket
   wirklich gelesen ist, sonst stuende dort immer der Leertext. */
if (typeof PAKET_BEREIT !== 'undefined') PAKET_BEREIT.then(zeigePaketStand);
