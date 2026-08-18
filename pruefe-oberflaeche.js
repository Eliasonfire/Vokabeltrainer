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
  for (const b of bildschirme){
    versuch(`Bildschirm "${b}" oeffnet`, ()=>{ showScreen(b); });
    await warte(30);
  }

  /* ---- 2. Satz-Modus: jeder Satz einmal gerendert, mit I'rab ---- */
  versuch('Satz-Modus baut alle Saetze', ()=>{
    openSentences();
    const n = SENT.list.length;
    for (let i=0;i<n;i++){ SENT.idx = i; renderSentence(); }
    return `${n} Saetze`;
  });
  if (typeof renderIrab === 'function'){
    versuch("I'rab fuer jeden Satz", ()=>{
      for (let i=0;i<SENT.list.length;i++){ SENT.idx = i; renderSentence(); renderIrab(); }
      return `${SENT.list.length} Zerlegungen`;
    });
  }

  /* ---- 3. Markierungen: findet jeder matchText seine Stelle? ---- */
  versuch('Satzmarkierungen loesen auf', ()=>{
    const alle = SENT.list.concat(VOCAB_DATA);
    const fehlend = [];
    Object.entries(SENTENCE_TAGS).forEach(([id, tags])=>{
      const w = alle.find(x=>String(x.id)===id);
      if (!w){ fehlend.push(`${id}: kein Satz`); return; }
      tags.forEach(t=>{ if (!w.sentAr || w.sentAr.indexOf(t.matchText) === -1) fehlend.push(`${id}/${t.ruleId}`); });
    });
    if (fehlend.length) throw new Error(fehlend.slice(0,5).join(', ') + (fehlend.length>5 ? ` (+${fehlend.length-5})` : ''));
    return `${Object.values(SENTENCE_TAGS).flat().length} Markierungen`;
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
    const zeilen = [...document.querySelectorAll('[data-openlist]')];
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
      /* ⚠️ Die zehn Fachbegriffe (chapter und book beide 'grammar') fehlten
         hier bis zum 19.08.2026. js/kern.js schiebt sie seit dem 17.08. in
         VOCAB_DATA, und buchVokabeln() gibt sie bei JEDEM Buch mit heraus -
         Elias wollte sie ausdruecklich als eigene Karteikarten ("die muessen
         inkludiert werden"). In die Soll-Rechnung fielen sie durch: ihr `book`
         ist 'grammar' und passt auf keinen Buch-Slug, ihr `chapter` ist nicht
         'personal'. Folge: JEDES der acht Buecher meldete +10 und damit einen
         Fehler, den es nicht gab. Gemessen an 'quran': 373 = 343 Abzug + 20
         mitreisend + 10 grammar. */
      const fachbegriffe = VOCAB_DATA.filter(w => w.chapter === 'grammar').length;
      const soll = b.vokabeln + mitreisend.length - schonDrin + vonHand + fachbegriffe;
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
