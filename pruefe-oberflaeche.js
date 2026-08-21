/* pruefe-oberflaeche.js -- Regressionslauf durch die laufende App
 *
 * Aufruf: die App im Browser oeffnen, Entwicklerkonsole auf, und
 *
 *   fetch('pruefe-oberflaeche.js').then(r=>r.text()).then(eval)
 *
 * Danach steht der Bericht in der Konsole.
 *
 * Warum es das gibt: Goal-Prompt E.6 verlangt, dass bestehende Bildschirme
 * nicht kaputtgehen. Geprueft wurde das bisher jedes Mal von Hand mit einem
 * frisch getippten Konsolenschnipsel - bei neun Bildschirmen, acht Buechern
 * und inzwischen 185 Saetzen ist das weder vollstaendig noch wiederholbar.
 * "Keine Testcheckliste fuer Regressionen" stand seit Juli als offener Punkt
 * im Projektgedaechtnis.
 *
 * Diese Datei wird NICHT von index.html geladen. Sie ist Werkzeug, kein Teil
 * der App - im Cache des Service Workers hat sie deshalb auch nichts verloren.
 *
 * Was sie NICHT kann: sehen, ob etwas gut aussieht. Sie stellt fest, dass
 * nichts wirft, dass die Zaehlwerte zusammenpassen und dass jeder Datensatz
 * einmal durch seine Darstellung gelaufen ist. Layout, Lesbarkeit und ob eine
 * Erklaerung inhaltlich stimmt, bleiben Augenarbeit. */
/* ⛔ Dieses Werkzeug laeuft NUR im Browser — es braucht SETTINGS, localStorage
   und das DOM der laufenden App. Unter `node` warf es bis zum 20.08.2026 einen
   nackten ReferenceError, und der sieht aus wie ein Befund: ich bin selbst
   darauf hereingefallen und habe nach einer Ursache gesucht, die es nicht gab.
   Ein Werkzeug soll sagen, warum es nicht laufen kann. */
if (typeof window === 'undefined' || typeof localStorage === 'undefined'){
  console.error('');
  console.error('  ⛔ pruefe-oberflaeche.js laeuft NICHT unter node.');
  console.error('     Es prueft die LAUFENDE App und braucht Browser, DOM und localStorage.');
  console.error('');
  console.error('     So geht es: App im Browser oeffnen, Entwicklerkonsole auf, dann');
  console.error("       fetch('pruefe-oberflaeche.js').then(r=>r.text()).then(eval)");
  console.error('');
  console.error('     Exit 3 heisst „falsch aufgerufen", nicht „Fehler gefunden".');
  process.exit(3);
}

(async function pruefeOberflaeche(){
  const ergebnis = [];
  const ok   = (was, zusatz) => ergebnis.push({ status:'ok',   was, zusatz: zusatz || '' });
  const fehl = (was, zusatz) => ergebnis.push({ status:'FEHLER', was, zusatz: zusatz || '' });
  const warn = (was, zusatz) => ergebnis.push({ status:'Hinweis', was, zusatz: zusatz || '' });

  const versuch = (was, fn) => {
    try { const r = fn(); ok(was, typeof r === 'string' ? r : ''); return true; }
    catch (e){ fehl(was, e.message); return false; }
  };
  const warte = ms => new Promise(r=>setTimeout(r, ms));

  /* Den Zustand des Nutzers nicht anfassen: der Lauf schaltet Bildschirme um
     und laedt Buecher nach, aber er darf keinen Fortschritt veraendern. Was
     er doch anfasst (aktives Buch, Kapitelauswahl), wird am Ende
     zurueckgesetzt. */
  /* ⚠️ Am 15.08.2026 nachgezogen. Vorher stand hier nur `buch` (ein einziger
     Slug) und `kapitel` aus SETTINGS.selectedChapters - beides aus dem alten
     Modell mit GENAU EINEM aktiven Buch. Seit der Mehrfachauswahl fuehrt
     SETTINGS.buecher eine Karte { slug: [kapitel] }, und selectedChapters
     steuert nichts mehr. Die Wiederherstellung am Ende griff damit ins Leere:
     der Lauf liess ALLE acht Buecher ausgewaehlt zurueck und meldete trotzdem,
     er habe zurueckgesetzt. Wer das in seiner echten App laufen liess, hatte
     danach eine andere Buchauswahl als vorher - ohne Hinweis. */
  const vorher = { buecher: JSON.parse(JSON.stringify(SETTINGS.buecher || {})),
                   eigene: !!SETTINGS.eigeneGewaehlt,
                   kapitel: (SETTINGS.selectedChapters || []).slice(),
                   fortschritt: localStorage.getItem('vt_progress'),
                   /* Auch die laufende Lernrunde sichern: die Stufenpruefung
                      unten baut sich eine eigene SESSION. Ohne das waere eine
                      angefangene Runde nach dem Lauf weg. */
                   session: (typeof SESSION !== 'undefined')
                     ? { words: SESSION.words.slice(), idx: SESSION.idx,
                         dirs: SESSION.dirs.slice(), fertig: SESSION.fertig }
                     : null };

  /* ---- 1. Alle Bildschirme ---- */
  const bildschirme = [...document.querySelectorAll('.screen')].map(s=>s.dataset.screen).filter(Boolean);
  /* ⛔ Ohne diese Zeile prueft der ganze Abschnitt nichts: eine Schleife ueber
     eine leere Liste laeuft fehlerfrei durch und meldet keinen einzigen Punkt.
     Am 21.08.2026 im Browser gezaehlt: 11 Bildschirme. [[leere_liste_ist_keine_messung]] */
  versuch('Bildschirme im Markup', ()=>{
    if (!bildschirme.length) throw new Error('kein einziges .screen[data-screen] gefunden');
    return `${bildschirme.length} Bildschirme`;
  });
  /* ⛔ Und „oeffnet" hiess bis zum 21.08.2026 nur „showScreen() ist nicht
     abgestuerzt". Ob danach ueberhaupt ein Bildschirm aktiv war, wurde nie
     geprueft. [[pruefung_fragt_einen_stellvertreter_ab]]

     ⚠️ Sichtbarkeit ueber getComputedStyle, nicht ueber die Klasse .active —
     eine eigene display-Regel kann sie still aushebeln.
     [[hidden_verliert_gegen_display]]

     ⚠️ EINE Umleitung ist Absicht und darf nicht als Fehler gelten:
     js/navigation.js:11 schickt `learn` auf `home`, wenn keine Lernrunde
     laeuft. Hier steht nur ihr ERGEBNIS, nicht die Bedingung nachgebaut —
     sonst laufen beide Fassungen auseinander. [[vorabpruefung_kennt_ihr_tor_nicht]] */
  const ERLAUBTE_UMLEITUNG = { learn: 'home' };
  for (const b of bildschirme){
    versuch(`Bildschirm "${b}" oeffnet`, ()=>{
      showScreen(b);
      const aktiv = document.querySelector('.screen.active');
      if (!aktiv) throw new Error('nach showScreen ist KEIN Bildschirm aktiv');
      const gezeigt = aktiv.dataset.screen;
      if (getComputedStyle(aktiv).display === 'none')
        throw new Error(`"${gezeigt}" ist aktiv, steht aber auf display:none`);
      if (gezeigt !== b){
        if (ERLAUBTE_UMLEITUNG[b] !== gezeigt)
          throw new Error(`sollte "${b}" zeigen, zeigt aber "${gezeigt}"`);
        return `absichtlich auf "${gezeigt}" umgeleitet`;
      }
      return 'sichtbar';
    });
    await warte(30);
  }

  /* ---- 2. Satz-Modus: jeder Satz einmal gerendert, mit I'rab ---- */
  versuch('Satz-Modus baut alle Saetze', ()=>{
    openSentences();
    const n = SENT.list.length;
    /* ⛔ Bis zum 21.08.2026 fehlte diese Zeile: bei n = 0 laeuft die Schleife
       nie, der Block meldet „0 Saetze" — und ein Totalausfall der Satzliste
       sah genauso aus wie ein fehlerfreier Bestand.
       Am 21.08.2026 im Browser gezaehlt: 216 Saetze. */
    if (!n) throw new Error('SENT.list ist leer — kein einziger Satz gebaut');
    for (let i=0;i<n;i++){ SENT.idx = i; renderSentence(); }
    return `${n} Saetze`;
  });
  /* ⛔ Zwei Luecken auf einmal, beide am 21.08.2026 geschlossen:
     1. Fehlte renderIrab, verschwand die Pruefung OHNE jede Meldung — aus 18
        Bloecken wurden still 17. [[ausfall_ist_unsichtbar_gebaut]]
     2. Bei leerer Satzliste meldete sie „0 Zerlegungen" als Erfolg. */
  if (typeof renderIrab === 'function'){
    versuch("I'rab fuer jeden Satz", ()=>{
      if (!SENT.list.length) throw new Error('SENT.list ist leer — nichts zu zerlegen');
      for (let i=0;i<SENT.list.length;i++){ SENT.idx = i; renderSentence(); renderIrab(); }
      return `${SENT.list.length} Zerlegungen`;
    });
  } else {
    fehl("I'rab fuer jeden Satz", 'renderIrab() gibt es nicht — die Zerlegung ist ausgebaut');
  }

  /* ---- 3. Markierungen: findet jeder matchText seine Stelle? ---- */
  /* ⛔ ZWEI URSACHEN, EINE MELDUNG — und das machte die Pruefung unbrauchbar.
     Am 19.08.2026 gemessen: direkt nach dem Laden meldete dieser Abschnitt
     „45899: kein Satz" fuer alle fuenf verfassten Beispielsaetze, ein zweiter
     Lauf auf DERSELBEN Seite meldete null Fehler.

     Grund: js/buecher.js haengt die Buchvokabeln erst nach dem Laden ein, und
     mit ihnen die Saetze aus data/beispielsaetze.js. Wer vorher prueft, findet
     die Kennungen nicht.

     Eine Pruefung, die grundlos Alarm schlaegt, wird beim naechsten echten
     Fehler weggeklickt. Deshalb wird jetzt unterschieden, statt zu melden.
     [[kennzeichen_mit_zwei_ursachen]] */
  versuch('Satzmarkierungen loesen auf', ()=>{
    const alle = SENT.list.concat(VOCAB_DATA);
    const ausBeispielen = (typeof BEISPIELSAETZE !== 'undefined') ? Object.keys(BEISPIELSAETZE) : [];
    const fehlend = [], nochNichtDa = [];
    Object.entries(SENTENCE_TAGS).forEach(([id, tags])=>{
      const w = alle.find(x=>String(x.id)===id);
      if (!w){
        if (ausBeispielen.includes(id)) nochNichtDa.push(id); else fehlend.push(`${id}: kein Satz`);
        return;
      }
      tags.forEach(t=>{ if (!w.sentAr || w.sentAr.indexOf(t.matchText) === -1) fehlend.push(`${id}/${t.ruleId}`); });
    });
    if (nochNichtDa.length){
      warn('Buchvokabeln noch nicht eingehaengt',
        `${nochNichtDa.length} Beispielsatz-Kennung(en) fehlen noch (${nochNichtDa.slice(0,3).join(', ')}). ` +
        'js/buecher.js haengt sie erst nach dem Laden ein — Pruefung gleich noch einmal starten.');
    }
    if (fehlend.length) throw new Error(fehlend.slice(0,5).join(', ') + (fehlend.length>5 ? ` (+${fehlend.length-5})` : ''));
    return `${Object.values(SENTENCE_TAGS).flat().length} Markierungen` +
      (nochNichtDa.length ? `, ${nochNichtDa.length} noch ohne Satz (Buch nicht geladen)` : '');
  });

  /* ---- 4. Jede Regel erreichbar? ---- */
  versuch('Regeln mit Beleg', ()=>{
    const belegt = new Set(Object.values(SENTENCE_TAGS).flat().map(t=>t.ruleId));
    const ohne = GRAMMAR_RULES.filter(r=>!belegt.has(r.id));
    if (ohne.length) warn('Regeln ohne Beleg', ohne.map(r=>r.id).join(', '));
    return `${GRAMMAR_RULES.length - ohne.length} von ${GRAMMAR_RULES.length} erreichbar`;
  });

  /* ---- 5. Lernkarte fuer jede Vokabel ---- */
  versuch('Quran-Anzeige fuer jede Vokabel', ()=>{
    let mit = 0;
    /* ⛔ Bis zum 21.08.2026 ohne Untergrenze: eine leere Vokabelliste ergab
       „0 von 0 mit Quran-Bezug" und galt als in Ordnung.
       Am 21.08.2026 im Browser gezaehlt: 326 Vokabeln. */
    if (!buchVokabeln().length) throw new Error('buchVokabeln() ist leer — keine einzige Vokabel geladen');
    buchVokabeln().forEach(w=>{
      renderQuranFreqBadge(w);
      const wurzel = w.root && w.root.replace(/\s+/g,'');
      const f = wurzel && QURAN_FREQ[wurzel];
      if (f){ mit++; openQuranFreqPopover(w, f); }
    });
    closeQuranFreqPopover();
    return `${mit} von ${buchVokabeln().length} mit Quran-Bezug`;
  });

  /* ---- 6. Kategorien: jede Liste einmal oeffnen ---- */
  versuch('Kategorien-Listen', ()=>{
    showScreen('categories');
    /* ⛔ Zwei Fehler, beide am 21.08.2026 behoben:
       1. Die Suche lief ueber das GANZE Dokument. Alle Bildschirme liegen
          gleichzeitig im DOM, nur auf display:none — die Zeile griff deshalb
          auch die fuenf Box-Kacheln des Startbildschirms (js/start.js) ab und
          klickte sie an. Gemessen: 55 Treffer im Dokument, 50 im Bildschirm.
       2. Ohne Untergrenze meldete sie bei leerem Markup „0 Listen" als Erfolg.
          Verschwinden alle Kategoriezeilen, faellt die Pruefung gruen aus. */
    const bildschirm = document.querySelector('.screen[data-screen="categories"]');
    if (!bildschirm) throw new Error('der Kategorien-Bildschirm fehlt im Markup');
    const zeilen = [...bildschirm.querySelectorAll('[data-openlist]')];
    if (!zeilen.length) throw new Error('keine einzige [data-openlist]-Zeile im Kategorien-Bildschirm');
    zeilen.forEach(z=>z.click());
    return `${zeilen.length} Listen`;
  });

  /* ---- 7. Buchwechsel durch alle Buecher ---- */
  if (typeof BUECHER !== 'undefined' && typeof setzeBuch === 'function'){
    for (const b of BUECHER){
      if (BUCH_FEHLT.has(b.slug)) { warn(`Buch ${b.slug}`, 'Datei nicht verfuegbar, uebersprungen'); continue; }
      /* ⚠️ Erst leeren, dann setzen. setzeBuch() FUEGT HINZU, seit es mehrere
         Buecher gleichzeitig geben kann - es schaltet nicht mehr um. Ohne das
         Leeren summiert die Schleife alle acht Buecher auf, und ab dem zweiten
         Durchgang meldet jede Zeile "4446 Vokabeln, erwartet 311". Genau so
         standen hier am 15.08.2026 acht Fehler, die keine waren: der Pruefer
         hatte die Umstellung auf Mehrfachauswahl nicht mitbekommen und pruefte
         seitdem nicht mehr, was er behauptet. */
      SETTINGS.buecher = {};
      SETTINGS.eigeneGewaehlt = false;
      const t0 = performance.now();
      await setzeBuch(b.slug);
      const dauer = Math.round(performance.now() - t0);
      /* `b.vokabeln` ist die Zahl AUS DEM ARABICROOTS-ABZUG (data/buecher.js,
         erzeugt von werkzeuge/hole-vokabeln.mjs). Dazu kommen die persoenlichen
         Vokabeln - und seit dem 30.07.2026 auch von Hand nachgetragene
         Eintraege, deren Herkunft NICHT arabicroots ist: أَخٌ und أُخْتٌ aus
         dem Madina-Schluessel 1 (siehe Kommentar in vocab-data.js).
         Sie werden hier mitgezaehlt, aber NICHT der Abzugszahl zugeschlagen -
         sonst muesste man `b.vokabeln` falschen, und das ist die einzige
         Stelle, die noch sagt, was arabicroots tatsaechlich geliefert hat.
         Ohne diese Unterscheidung meldete die Pruefung "311 Vokabeln, erwartet
         309" und damit einen Fehler, der keiner ist. */
      /* ⚠️ Gezaehlt wird nach HERKUNFT, nicht nach chapter. Am 30.07.2026 sind
         die neun Zahlen von `chapter: 24` auf `chapter: 'personal'` umgestellt
         worden (Elias: "ich habe jetzt ploetzlich die moeglichkeit auch auf
         kapitel 24 zuzugreifen. das ist ein fehler."). Sie stammen aber weiter
         aus dem Abzug und stecken damit schon in `b.vokabeln` - wer sie
         zusaetzlich als "persoenlich" zaehlt, zaehlt sie doppelt und erwartet
         320 statt 311. Genau das hat diese Pruefung gemeldet.
         `source: 'vocabulary'` heisst: aus dem Abzug. Alles andere ist
         zusaetzlich - Elias' eigene Vokabeln (`personal_vocabulary`) und was von
         Hand nachgetragen wurde (`madina-schluessel-1`). */
      /* Drei Gruppen, und die dritte ist der Grund, warum es nicht eine Summe
         sein kann:
           mitreisend  alles mit chapter 'personal' - buchVokabeln() haengt das
                       BEWUSST an jedes Buch an, damit eigene Woerter immer da
                       sind (siehe js/buecher.js).
           schonDrin   die davon, die AUS DEM ABZUG DIESES BUCHS stammen. Fuer
                       madina-1 sind das die neun Zahlen; sie stecken bereits in
                       b.vokabeln und duerfen nicht doppelt gezaehlt werden.
           vonHand     zusaetzliche Eintraege, die zu diesem Buch gehoeren, aber
                       nicht aus dem Abzug kommen (أَخٌ, أُخْتٌ aus dem
                       Madina-Schluessel). */
      const mitreisend = VOCAB_DATA.filter(w=>w.chapter === 'personal');
      const schonDrin  = mitreisend.filter(w=>w.source === 'vocabulary' && (w.book || 'madina-1') === b.slug).length;
      const vonHand    = VOCAB_DATA.filter(w=>w.chapter !== 'personal'
                          && w.source !== 'vocabulary' && (w.book || 'madina-1') === b.slug).length;
      /* ⚠️ Die fuenfzehn Fachbegriffe (chapter und book beide 'grammar') fehlten
         hier bis zum 19.08.2026. js/kern.js schiebt sie seit dem 17.08. in
         VOCAB_DATA, und buchVokabeln() gibt sie bei JEDEM Buch mit heraus -
         Elias wollte sie ausdruecklich als eigene Karteikarten ("die muessen
         inkludiert werden"). In die Soll-Rechnung fielen sie durch: ihr `book`
         ist 'grammar' und passt auf keinen Buch-Slug, ihr `chapter` ist nicht
         'personal'. Folge: JEDES der acht Buecher meldete +10 und damit einen
         Fehler, den es nicht gab. Gemessen an 'quran': 373 = 343 Abzug + 20
         mitreisend + 10 grammar. */
      /* ⛔ SEIT DEM 20.08.2026 NICHT MEHR EXTRA ADDIEREN. Die fünfzehn
         Fachbegriffe tragen jetzt chapter 'personal' und stecken damit bereits
         in `mitreisend` — ein zweiter Summand zählte sie doppelt. Gemessen
         direkt nach dem Umbau: ALLE ACHT Bücher meldeten genau +15,
         „518 Vokabeln, erwartet 533“. Kein Datenfehler, ein Rechenfehler hier.
         ⭐ Genau dafür ist dieser Lauf da: er hat den Umbau erwischt, während
         validate.js grün blieb — das kennt die Summe je Buch nicht.
         Ihr `book` ist weiterhin 'grammar'; wer sie zählen will, fragt danach
         und NICHT nach `chapter`. */
      const soll = b.vokabeln + mitreisend.length - schonDrin + vonHand;
      const ist = buchVokabeln().length;
      if (ist !== soll) fehl(`Buch ${b.slug}`, `${ist} Vokabeln, erwartet ${soll}`);
      else ok(`Buch ${b.slug}`, `${ist} Vokabeln, ${dauer} ms`);
    }
  }

  /* ---- 8. Hoerverstehen: eine Runde ---- */
  if (typeof openHoeren === 'function'){
    versuch('Hoerverstehen: zehn Fragen', ()=>{
      showScreen('hoeren');
      for (let i=0;i<10;i++){
        if (!HOER.wort) throw new Error('keine Frage aufgebaut');
        const richtig = HOER.optionen.findIndex(w=>w.id===HOER.wort.id);
        if (richtig < 0) throw new Error('die richtige Antwort fehlt unter den Optionen');
        beantworteHoerfrage(richtig);
        naechsteHoerfrage();
      }
      return `${HOER.richtig} von ${HOER.gesamt} richtig`;
    });
  }

  /* ---- 8b. Die vier Antwortstufen ---- */
  if (typeof STUFEN !== 'undefined'){
    versuch('Antwortstufen bewegen die Box richtig', ()=>{
      const w = buchVokabeln()[0];
      const gesichert = PROGRESS[w.id];
      /* ⛔ Diese Tabelle stand bis zum 19.08.2026 auf der Fassung VOR dem
         16.08. und meldete deshalb sieben Fehler, die keine waren. Elias am
         16.08.2026: "nochmal sollte die selbe funktion haben wie schwer, also
         dass man einfach nur eine einzige box weiter runter geht. und schwer
         sollte die funktion haben, dass man in der selben box bleibt."
         Seitdem ist die Reihe gleichmaessig -1 / 0 / +1 / +2, siehe STUFEN in
         js/lernen.js. ⚠️ Wer diesen Lauf "gruen macht", indem er die App
         anpasst, nimmt ihm genau das zurueck, worum er gebeten hat. */
      const soll = {
        nochmal: [1,1,2,3,4],   // max(1, b-1)
        schwer:  [1,2,3,4,5],   // b
        gut:     [2,3,4,5,5],   // min(5, b+1)
        leicht:  [3,4,5,5,5]    // min(5, b+2)
      };
      const falsch = [];
      Object.keys(soll).forEach(stufe=>{
        [1,2,3,4,5].forEach((start, i)=>{
          PROGRESS[w.id] = { box:start, nextReview:todayStr(0), correct:0, wrong:0 };
          SESSION = { words:[w], idx:0, dirs:[], fertig:false };
          answer._busy = false;
          answer(stufe);
          if (PROGRESS[w.id].box !== soll[stufe][i])
            falsch.push(`${stufe} aus Box ${start} -> ${PROGRESS[w.id].box}, erwartet ${soll[stufe][i]}`);
        });
      });
      /* Die Wischgeste gibt weiter true/false herein - das muss weiter gehen. */
      PROGRESS[w.id] = { box:2, nextReview:todayStr(0), correct:0, wrong:0 };
      SESSION = { words:[w], idx:0, dirs:[], fertig:false }; answer._busy = false; answer(true);
      if (PROGRESS[w.id].box !== 3) falsch.push('Wisch nach rechts landet nicht auf Box 3');
      PROGRESS[w.id] = gesichert;
      if (falsch.length) throw new Error(falsch.join('; '));
      return '4 Stufen x 5 Boxen + Wischgeste';
    });
  }

  /* ---- 8c. Regel-Fortschritt und Wortfolgen (19.08.2026) ----
     Der Modus "Welche Regel?" speist vt_regelStand — die Zahl, auf die
     Elias' Regelauswahl sich stuetzt. Und seit dem 19.08. zeigt er auch auf
     WORTFOLGEN (matchText ueber mehrere Woerter); vorher fielen 21 der 95
     Regeln komplett heraus. Beides darf nicht still zurueckfallen. */
  if (typeof uebungenAufbauen === 'function' && typeof merkeRegel === 'function'){
    versuch('Regelmodus: Wortfolgen und Fortschritt', ()=>{
      const gesichertStand = localStorage.getItem('vt_regelStand');
      const gesichertRegel = (typeof REGEL_STAND !== 'undefined') ? REGEL_STAND : null;
      try {
        UEB_CACHE = { thema:null, nachModus:null };
        const alle = uebungenAufbauen();
        const aufgaben = alle['regel'] || [];
        const mitBereich = aufgaben.filter(a=>a.wortIdxBis != null);
        const regeln = new Set(aufgaben.map(a=>a.regelId));
        if (!aufgaben.length) throw new Error('keine Aufgaben im Regelmodus');
        if (!mitBereich.length) throw new Error('keine einzige Bereichs-Aufgabe — Wortfolgen-Erkennung zurueckgefallen?');
        if (!aufgaben.every(a=>a.regelId)) throw new Error('Aufgabe ohne regelId — Fortschritt bliebe blind');
        /* merkeRegel selbst, am Rande: schreibt, zaehlt, ignoriert null. */
        REGEL_STAND = {};
        merkeRegel('pruefe-oberflaeche-test', true);
        merkeRegel('pruefe-oberflaeche-test', false);
        merkeRegel(null, true);
        const e = JSON.parse(localStorage.getItem('vt_regelStand'))['pruefe-oberflaeche-test'];
        if (!e || e.gestellt !== 2 || e.richtig !== 1) throw new Error('merkeRegel zaehlt falsch: ' + JSON.stringify(e));
        if (Object.keys(JSON.parse(localStorage.getItem('vt_regelStand'))).length !== 1) throw new Error('merkeRegel(null) hat einen Eintrag angelegt');
        return `${aufgaben.length} Aufgaben, ${mitBereich.length} mit Wortfolge, ${regeln.size} Regeln erreichbar`;
      } finally {
        if (gesichertStand == null) localStorage.removeItem('vt_regelStand');
        else localStorage.setItem('vt_regelStand', gesichertStand);
        if (gesichertRegel !== null) REGEL_STAND = gesichertRegel;
      }
    });
  }

  /* ---- 8d. Sync-Merge fuer vt_regelStand: feldweises Maximum ----
     Blockstempel wuerfe die Zaehlungen des anderen Geraets weg, Summieren
     zaehlte nach jedem Abgleich doppelt. Der Merge muss das MAXIMUM je Feld
     nehmen — genau das wird hier mit einem gestellten Fern-Stand geprueft. */
  if (typeof fuehreZusammen === 'function'){
    versuch('Sync: Regel-Fortschritt merged feldweise', ()=>{
      const gesichert = localStorage.getItem('vt_regelStand');
      try {
        localStorage.setItem('vt_regelStand', JSON.stringify({ a:{gestellt:6,richtig:1,zuletzt:'2026-08-18'}, nurHier:{gestellt:2,richtig:2,zuletzt:'2026-08-19'} }));
        fuehreZusammen({ stempel:{}, daten:{ vt_regelStand: JSON.stringify({ a:{gestellt:2,richtig:2,zuletzt:'2026-08-19'}, nurDort:{gestellt:3,richtig:0,zuletzt:'2026-08-17'}, kaputt:'kein-objekt' }) } });
        const r = JSON.parse(localStorage.getItem('vt_regelStand'));
        if (!r.a || r.a.gestellt !== 6 || r.a.richtig !== 2) throw new Error('kein feldweises Maximum: ' + JSON.stringify(r.a));
        if (r.a.zuletzt !== '2026-08-19') throw new Error('zuletzt nicht der spaetere Tag: ' + r.a.zuletzt);
        if (!r.nurHier || !r.nurDort) throw new Error('einseitige Eintraege ueberleben nicht');
        if (r.kaputt) throw new Error('kaputter Ferneintrag wurde uebernommen');
        return 'g6r1+g2r2 -> g6r2, beide Einzelseiten ueberleben';
      } finally {
        if (gesichert == null) localStorage.removeItem('vt_regelStand');
        else localStorage.setItem('vt_regelStand', gesichert);
      }
    });
  }

  /* ---- 9. Sicherung: Runde durch Export und Import ---- */
  if (typeof baueSicherung === 'function'){
    versuch('Sicherung enthaelt alle Schluessel', ()=>{
      const s = baueSicherung();
      const fehlend = SICHERUNGS_SCHLUESSEL.filter(k => localStorage.getItem(k) !== null && !(k in s.daten));
      if (fehlend.length) throw new Error('fehlt in der Sicherung: ' + fehlend.join(', '));
      return `${Object.keys(s.daten).length} Schluessel, ${Math.round(JSON.stringify(s).length/1024)} KB`;
    });
  }

  /* ---- Zustand zuruecksetzen ---- */
  /* ⚠️ Die Karte direkt zuruecksetzen, NICHT ueber setzeBuch(): setzeBuch fuegt
     hinzu und loescht bewusst nichts (der Start laeuft damit ueber jedes
     gemerkte Buch). Wiederherstellen heisst hier aber "genau der Zustand von
     vorher", einschliesslich der Buecher, die NICHT gewaehlt waren. */
  SETTINGS.buecher = JSON.parse(JSON.stringify(vorher.buecher));
  SETTINGS.eigeneGewaehlt = vorher.eigene;
  SETTINGS.selectedChapters = vorher.kapitel;
  /* ---- 8e. „Taugt nicht": bleibt bei EINEM Vorschlag ehrlich? ----

     Am 19.08.2026 gemessen: 135 der geladenen Woerter haben genau einen
     Vorschlag. Der Knopf hiess bis dahin immer „Taugt nicht — bitte ersetzen"
     und versprach damit etwas, das die App nicht halten kann: sie hat keine
     KI und kein Backend, sie blaettert nur durch einen Vorrat.

     Geprueft wird deshalb BEIDES — der Einzelfall UND der Mehrfachfall. Nur
     den Einzelfall zu pruefen wuerde nicht merken, wenn die Unterscheidung
     ganz verschwindet und ueberall „einziger" steht. */
  if (typeof vorschlagsListe === 'function' && typeof zeigeVorschlag === 'function'){
    versuch('Vorschlaege: einer gegen mehrere', ()=>{
      const gesichertSession = (typeof SESSION !== 'undefined') ? SESSION : null;
      const gesichertListe = (typeof VORSCHLAEGE !== 'undefined') ? VORSCHLAEGE : null;
      const gesichertNr = (typeof VORSCHLAG_NR !== 'undefined') ? VORSCHLAG_NR : 0;
      try {
        const einer = VOCAB_DATA.find(w=>vorschlagsListe(w).length === 1);
        const viele = VOCAB_DATA.find(w=>vorschlagsListe(w).length > 1);
        if (!einer) return 'kein Wort mit genau einem Vorschlag — nichts zu pruefen';
        if (!viele) throw new Error('kein Wort mit mehreren Vorschlaegen — Vorrat leer?');

        const marke = document.querySelector('#neVorschlag .ne-vorschlag-marke');
        const knopf = document.getElementById('btnVorschlagWeg');
        if (!marke || !knopf) throw new Error('Vorschlagskasten fehlt im Markup');

        const lies = (w)=>{
          SESSION.words = [w]; SESSION.idx = 0;
          VORSCHLAEGE = vorschlagsListe(w); VORSCHLAG_NR = 0;
          zeigeVorschlag();
          return { marke: marke.textContent, knopf: knopf.textContent };
        };
        const a = lies(einer), b = lies(viele);
        if (!/einziger/.test(a.marke)) throw new Error('bei einem Vorschlag fehlt „einziger": ' + a.marke);
        if (/ersetzen/.test(a.knopf)) throw new Error('verspricht Ersatz, den es nicht gibt: ' + a.knopf);
        if (/einziger/.test(b.marke)) throw new Error('bei mehreren steht faelschlich „einziger": ' + b.marke);
        if (!/ersetzen/.test(b.knopf)) throw new Error('bei mehreren fehlt „ersetzen": ' + b.knopf);
        const zahl = VOCAB_DATA.filter(w=>vorschlagsListe(w).length === 1).length;
        return `${zahl} von ${VOCAB_DATA.length} Woertern mit genau einem Vorschlag, beide Faelle richtig beschriftet`;
      } finally {
        if (gesichertListe !== null) VORSCHLAEGE = gesichertListe;
        VORSCHLAG_NR = gesichertNr;
        if (gesichertSession !== null) SESSION = gesichertSession;
      }
    });
  }

  /* ---- 8f. Regelfortschritt: die Anzeige, nicht nur die Messung ----

     `vt_regelStand` wurde seit v209 geschrieben und war bis v221 NIRGENDS zu
     sehen. Genau deshalb prueft dieser Abschnitt die ANZEIGE: dass sie
     ueberhaupt Zeilen baut, dass die Sortierung „schwaechste zuerst" wirklich
     aufsteigend ist, und dass der leere Fall einen Satz zeigt statt einer
     leeren Flaeche.

     ⚠️ Eine Quote ohne Nenner ist bei kleinen Zahlen wertlos (1/1 sind 100 %).
     Deshalb wird auch geprueft, dass die Zeile „richtig/gestellt" zeigt und
     nicht bloss ein Prozentzeichen. */
  if (typeof renderRegelStand === 'function' && typeof merkeRegel === 'function'){
    versuch('Regelfortschritt: Anzeige und Sortierung', ()=>{
      const gesichertStand = localStorage.getItem('vt_regelStand');
      const gesichertRegel = (typeof REGEL_STAND !== 'undefined') ? REGEL_STAND : null;
      const gesichertSort = (typeof REGEL_SORT !== 'undefined') ? REGEL_SORT.art : 'schwach';
      try {
        const kasten = document.getElementById('regelStand');
        if (!kasten) throw new Error('#regelStand fehlt im Markup');

        REGEL_STAND = {}; localStorage.removeItem('vt_regelStand');
        REGEL_SORT.art = 'schwach';
        renderRegelStand();
        if (kasten.querySelectorAll('.rz').length) throw new Error('leerer Stand zeigt Zeilen');
        if (!/Noch keine Regel/.test(kasten.textContent)) throw new Error('leerer Stand ohne Erklaerung');

        const ids = GRAMMAR_RULES.filter(r=>!r.ausgeblendet).slice(0, 3).map(r=>r.id);
        merkeRegel(ids[0], true); merkeRegel(ids[0], true); merkeRegel(ids[0], true);   /* 3/3 */
        merkeRegel(ids[1], false); merkeRegel(ids[1], false); merkeRegel(ids[1], true); /* 1/3 */
        merkeRegel(ids[2], true); merkeRegel(ids[2], false);                            /* 1/2 */
        renderRegelStand();
        const zeilen = [...kasten.querySelectorAll('.rz')];
        if (zeilen.length !== 3) throw new Error('erwartet 3 Zeilen, gezeigt ' + zeilen.length);
        const quoten = zeilen.map(z=>z.querySelector('.rq').textContent.trim());
        if (!quoten.every(q=>/^\d+\/\d+$/.test(q))) throw new Error('Quote ohne Nenner: ' + quoten.join(', '));
        const werte = quoten.map(q=>{ const [r,g] = q.split('/').map(Number); return r/g; });
        for (let i = 1; i < werte.length; i++)
          if (werte[i] < werte[i-1] - 1e-9) throw new Error('nicht aufsteigend sortiert: ' + quoten.join(' < '));
        /* Faerbung erst ab drei Versuchen — 1/2 darf nicht rot sein. */
        const zweier = zeilen.find(z=>z.querySelector('.rq').textContent.trim() === '1/2');
        if (zweier && zweier.classList.contains('schwach'))
          throw new Error('1/2 als schwach gefaerbt — die Schwelle von 3 Versuchen greift nicht');

        REGEL_SORT.art = 'nie';
        renderRegelStand();
        const nie = kasten.querySelectorAll('.rz').length;
        if (nie !== GRAMMAR_RULES.length - 3)
          throw new Error(`„nie geuebt" zeigt ${nie}, erwartet ${GRAMMAR_RULES.length - 3}`);
        return `leer, ${zeilen.length} geuebt aufsteigend (${quoten.join(' ')}), ${nie} nie geuebt`;
      } finally {
        if (typeof REGEL_SORT !== 'undefined') REGEL_SORT.art = gesichertSort;
        if (gesichertStand == null) localStorage.removeItem('vt_regelStand');
        else localStorage.setItem('vt_regelStand', gesichertStand);
        if (gesichertRegel !== null) REGEL_STAND = gesichertRegel;
        if (typeof renderRegelStand === 'function') renderRegelStand();
      }
    });
  }

  /* ---- 8g. Icons: Sprite vollstaendig, App-Icons vorhanden ----

     Zwei verschiedene Dinge, die beide „Icon" heissen:
       - der SVG-Sprite in index.html, aus dem `icon(name)` zieht. Fehlt ein
         Symbol, malt der Browser NICHTS und meldet auch nichts — die Stelle
         sieht einfach leer aus.
       - die App-Icons aus manifest.json (icon.svg, icon-maskable.svg), die
         auf dem Startbildschirm landen.
     Der erste Fall ist der haeufigere und der stillere. */
  versuch('Icons: Sprite und App-Icon', ()=>{
    const vorhanden = new Set([...document.querySelectorAll('svg symbol[id^="ic-"]')].map(s=>s.id.slice(3)));
    if (!vorhanden.size) throw new Error('kein einziges Sprite-Symbol gefunden');
    /* Jede benutzte Verweisstelle muss ein Symbol haben. */
    const benutzt = new Set([...document.querySelectorAll('svg.ic use')]
      .map(u=>(u.getAttribute('href') || '').replace('#ic-', '')).filter(Boolean));
    const fehlend = [...benutzt].filter(n=>!vorhanden.has(n));
    if (fehlend.length) throw new Error('Verweis ohne Symbol: ' + fehlend.join(', '));
    /* Und die Wortmarke im Kopf, die kein Sprite ist, sondern eine Datei. */
    const marke = document.querySelector('.brand-mark');
    if (!marke) throw new Error('.brand-mark fehlt im Kopf');
    if (marke.tagName === 'IMG' && marke.naturalWidth === 0 && marke.complete)
      throw new Error('wortmarke.svg laedt nicht (naturalWidth 0)');
    return `${vorhanden.size} Sprite-Symbole, ${benutzt.size} davon in Gebrauch, Wortmarke geladen`;
  });


  /* ================= KETTE: kommt jede Wortgruppe bis in die Kartei? ========
     ⛔ ANLASS, 20.08.2026: Der Schalter "Pluralformen als eigene Karteikarten"
     meldete "192 Pluralkarten sind dazugekommen - sie starten in Kasten 1", und
     KEINE EINZIGE erschien je in "Jetzt lernen". `bauePluralKarte()` uebernahm
     chapter, type, gender und root - aber nicht `book`. In passtZurAuswahl()
     steht `const kapitel = karte[w.book]`, und bei undefined faellt die Karte
     durch. Alle Zwischenstufen waren in Ordnung: bekannt, Fortschritt, faellig,
     in dueWords() alle 192 - nur currentPool() lieferte 0.

     Kein bestehendes Pruefwerkzeug konnte das sehen: validate.js laeuft unter
     node und kennt die Pluralkarten gar nicht, weil sie erst im Browser
     entstehen. Deshalb steht die Pruefung hier.

     ⭐ Die Frage ist nicht "gibt es Karten?", sondern "wieviel PROZENT einer
     Gruppe kommt durch?". Ein Absturz von 100 auf 0 ist der Befund; eine
     Gruppe, von der nur ein Teil durchkommt, ist der Normalfall (Kapitel
     ausserhalb der Auswahl). */
  versuch('Kette: Wortgruppen bis in die Kartei', () => {
    const gruppen = [
      ['Buchvokabeln', VOCAB_DATA.filter(w => w.book && !(typeof istPluralKarte === 'function' && istPluralKarte(w.id)))],
      ['Pluralkarten', VOCAB_DATA.filter(w => typeof istPluralKarte === 'function' && istPluralKarte(w.id))],
      ['Fachbegriffe', VOCAB_DATA.filter(w => w.book === 'grammar')]
    ];
    const teile = [];
    for (const [name, liste] of gruppen){
      if (!liste.length) continue;
      const bekannt = liste.filter(w => typeof istBekannt === 'function' ? istBekannt(w) : true).length;
      const durch   = liste.filter(w => passtZurAuswahl(w)).length;
      teile.push(`${name} ${durch}/${liste.length}`);
      /* Der Befund: bekannt, aber NICHTS kommt durch. Das ist kein Filter mehr,
         das ist ein Abriss. */
      if (bekannt > 0 && durch === 0)
        throw new Error(`${name}: ${bekannt} von ${liste.length} sind bekannt, aber KEINE kommt durch passtZurAuswahl() `
                      + `- fehlt ein Pflichtfeld (book/chapter)?`);
    }
    /* ⚠️ Die eigenen Vokabeln stehen BEWUSST nicht in der Liste: sie fallen
       gewollt heraus, solange eingeengt ist und der Schalter "Eigene" aus ist.
       Ein Abriss waere dort der Normalzustand und wuerde die Pruefung stumpf
       machen. */
    return teile.join(' · ');
  });

  /* Pflichtfelder je Datensatz - dieselbe Ursache, eine Ebene tiefer.
     Ein Wort ohne `book` und ohne Sonderkapitel kann nirgends ankommen. */
  versuch('Kette: kein Datensatz ohne Herkunft', () => {
    const ohne = VOCAB_DATA.filter(w => !w.book && w.chapter !== 'personal');
    if (ohne.length)
      throw new Error(`${ohne.length} Datensaetze ohne book und ohne Sonderkapitel, z.B. `
                    + ohne.slice(0, 3).map(w => `${w.id} (${w.ar})`).join(', '));
    return `${VOCAB_DATA.length} Datensaetze, jeder mit Herkunft`;
  });

  /* ---- Einzeln freigeschaltete Woerter (20.08.2026) ----

     Elias: „ich möchte aber nur die vereinzelnen wörter haben ohne den rest
     des kapitels zu haben.“ Die Freischaltung hängt an ZWEI Zeilen — einer in
     istBekannt() und einer in passtZurAuswahl(). Verschwindet die zweite,
     fällt das Wort still durch den Buchfilter zurück; nichts meldet es, und
     der Knopf in der Wortkarte sieht weiter aus, als täte er etwas.

     ⛔ Der Test greift sich ein Wort aus einem gesperrten Kapitel, engt die
     Auswahl AUSDRÜCKLICH ein und misst beide Richtungen. Ohne die Einengung
     wäre er wertlos: bei weiter Auswahl käme das Wort auch ohne die zweite
     Zeile durch. */
  versuch('Kette: einzeln freigeschaltete Woerter', () => {
    if (typeof setzeEinzelnFrei !== 'function' || typeof istEinzelnFrei !== 'function')
      throw new Error('setzeEinzelnFrei/istEinzelnFrei fehlen — die Freischaltung ist ausgebaut');
    const kandidat = VOCAB_DATA.find(w => w.book === 'madina-1' && !w.istPlural
                                       && Number(w.chapter) >= 13 && !istBekannt(w));
    if (!kandidat) return 'kein gesperrtes Wort mehr da — nichts zu pruefen';

    const sicherAuswahl = JSON.parse(JSON.stringify(SETTINGS.buecher || {}));
    const warFrei = istEinzelnFrei(kandidat);
    try {
      SETTINGS.buecher = { 'madina-1': [1, 2, 3] };      /* der unguenstigste Fall */
      setzeEinzelnFrei(kandidat.id, false);
      if (passtZurAuswahl(kandidat))
        throw new Error(`${kandidat.ar} kommt OHNE Freischaltung durch — die Wissensgrenze greift nicht`);
      setzeEinzelnFrei(kandidat.id, true);
      if (!istBekannt(kandidat))
        throw new Error(`${kandidat.ar}: istBekannt() kennt die einzelne Freischaltung nicht`);
      if (!passtZurAuswahl(kandidat))
        throw new Error(`${kandidat.ar}: istBekannt() sagt ja, aber passtZurAuswahl() wirft es hinaus `
                      + `— die zweite Zeile fehlt, und der Buchfilter gewinnt`);
      if (typeof einzelnFreigeschaltete === 'function'
          && !einzelnFreigeschaltete().some(w => w.id === kandidat.id))
        throw new Error(`${kandidat.ar} steht nicht in der Liste zum Zuruecknehmen — der Rueckweg fehlt`);
      return `${kandidat.ar} (Kap. ${kandidat.chapter}): gesperrt → frei → in der Auswahl, Rueckweg da`;
    } finally {
      setzeEinzelnFrei(kandidat.id, warFrei);
      SETTINGS.buecher = sicherAuswahl;
    }
  });

  saveSettings();
  if (typeof renderBuchChips === 'function') renderBuchChips();
  if (typeof renderHome === 'function') renderHome();
  if (vorher.fortschritt !== localStorage.getItem('vt_progress')){
    localStorage.setItem('vt_progress', vorher.fortschritt);
    /* Und die Kopie im Speicher gleich mit. Sie allein zurueckzuschreiben
       reichte NICHT: PROGRESS ist ein Objekt im Arbeitsspeicher, und das
       naechste saveProgress() haette den veraenderten Stand wieder in den
       localStorage geschrieben - der Lauf haette den echten Lernfortschritt
       still ueberschrieben, obwohl er ihn "zurueckgesetzt" meldete. */
    if (typeof PROGRESS !== 'undefined' && vorher.fortschritt){
      const alt = JSON.parse(vorher.fortschritt);
      Object.keys(PROGRESS).forEach(k=>{ delete PROGRESS[k]; });
      Object.assign(PROGRESS, alt);
    }
    warn('Fortschritt', 'wurde vom Lauf beruehrt und vollstaendig zurueckgeschrieben');
  }
  if (vorher.session && typeof SESSION !== 'undefined') SESSION = vorher.session;
  showScreen('home');

  /* ---- Bericht ---- */
  const fehler = ergebnis.filter(e=>e.status==='FEHLER');
  console.log('%c--- Oberflaechenpruefung ---', 'font-weight:bold');
  console.table(ergebnis);
  console.log(fehler.length
    ? `%c${fehler.length} Fehler - nicht pushen.`
    : '%cKein Fehler. Layout und Inhalt bleiben trotzdem Augenarbeit.',
    `color:${fehler.length ? '#f87171' : '#34d399'};font-weight:bold`);
  return { fehler: fehler.length, ergebnis };
})();
