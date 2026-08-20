/* saetze.js -- Satz-Modus und Grammatik-Hervorhebung
   Teil der App-Logik; wird in index.html in fester Reihenfolge geladen und
   teilt sich mit den uebrigen js/-Dateien den globalen Namensraum. */
/* ===================== SENTENCES =====================
   Der Satz-Modus liest zwei Quellen: die Beispielsaetze der arabicroots-
   Vokabeln und die Saetze aus dem Lehrwerk (lehrbuch-saetze.js). Letztere
   sind noetig, weil die arabicroots-Saetze rein nominal sind - ohne sie
   waeren 20 Grammatikregeln in der App gar nicht erreichbar. Sie liegen in
   einer eigenen Datei, damit ein neuer Datenabzug sie nicht ueberschreibt. */
function alleSaetze(){
  /* Bewusst NICHT aufs aktive Buch gefiltert. Beispielsaetze gibt es nur zu
     Madina 1, Kapitel 1-9 (aus vocab-data.js) und im Lehrwerk - ein Buchfilter
     wuerde den Satz-Modus leerraeumen, sobald Elias ein anderes Buch lernt,
     ohne dass dafuer irgendwo Ersatz stuende. */
  const ausVokabeln = VOCAB_DATA.filter(w=>w.sentAr);
  const ausLehrbuch = (typeof LEHRBUCH_SAETZE!=='undefined') ? LEHRBUCH_SAETZE : [];
  return ausVokabeln.concat(ausLehrbuch).filter(nichtVorausgeschrieben);
}

/* ---------- Nur nach VORN filtern ----------

   Elias am 19.08.2026, als ich ihm den Ablauf geschildert hatte: der Satzmodus
   solle „nur begriffe beinhalten die ich freigeschaltet habe".

   Gemessen war das an dem Tag zufaellig erfuellt — 0 von 215 Saetzen kamen aus
   gesperrten Kapiteln —, aber NICHT geprueft. Und es kippt beim naechsten
   Schritt: die Wartungsroutine schreibt im Fenster +3 VORAUS. Steht er bei
   Kapitel 12, entstehen Saetze fuer 13 bis 15, und die stuenden hier, bevor er
   die Woerter hat.

   ⛔ Bewusst NICHT der volle Buchfilter. Der Kommentar oben warnt zu Recht:
   ein Filter auf das aktive Buch wuerde den Satzmodus leerraeumen, sobald
   Elias ein anderes Buch lernt — Beispielsaetze gibt es fast nur zu Madina 1.
   Deshalb faellt ein Satz nur weg, wenn sein Wort in EINEM BUCH liegt, das er
   lernt, und dort in einem Kapitel VOR ihm liegt. Saetze aus Buechern ohne
   eigene Auswahl bleiben unangetastet. */
function nichtVorausgeschrieben(s){
  if (typeof istBekannt !== 'function') return true;
  /* ⛔ LEHRBUCHSAETZE BLEIBEN IMMER. Erster Anlauf hat sie mitgefiltert und
     dabei vier Saetze aus Kapitel 12 weggenommen (mb1-63-1, mb1-63-2,
     mb1-65-1, sk3-7-1) — 215 wurden zu 211.

     Zwei Gruende, warum das falsch war:
     1. Sie stehen in Elias' EIGENEM gedruckten Buch, das er besitzt und
        gelesen hat. Was arabicroots freischaltet, sagt darueber nichts.
     2. lehrbuch-saetze.js existiert ausdruecklich, um Regeln erreichbar zu
        machen — 22 Regeln lagen ohne sie unerreichbar in grammar-data.js.
        Sie zu verstecken nimmt genau das zurueck.

     Der Fall, um den es hier geht, ist ein anderer: von der Routine im
     Fenster +3 VORAUSGESCHRIEBENE Saetze zu Buchvokabeln. Nur die. */
  if (s.seite !== undefined) return true;
  const w = VOCAB_DATA.find(v => v.id === s.id);
  if (!w) return true;
  /* Nur wenn fuer dieses Buch ueberhaupt eine Auswahl besteht — sonst waere es
     der Buchfilter, den es hier gerade nicht geben soll. */
  const hatAuswahl = (typeof SETTINGS !== 'undefined') && SETTINGS.buecher
                     && Array.isArray(SETTINGS.buecher[w.book]) && SETTINGS.buecher[w.book].length;
  const hatFrei = (typeof FREIGESCHALTET !== 'undefined') && FREIGESCHALTET[w.book];
  if (!hatAuswahl && !hatFrei) return true;
  return istBekannt(w);
}

/* ---------- Themenfilter (Elias' Wunsch vom 29.07.2026) ----------
   Die Themen und die dahinterliegende Zaehlung stehen in grammar-data.js
   (`SATZ_THEMEN`). Hier nur die Anwendung: welche Saetze tragen mindestens
   eine Markierung, deren Regel zu diesem Thema gehoert?

   Regeln, die AUSGEBLENDET sind, zaehlen nicht mit - sonst stuende ein Satz in
   einem Thema, das in ihm gar nicht mehr unterstrichen wird. */
let SATZ_THEMA = 'alle';

function themaRegelIds(themaId){
  const t = (typeof SATZ_THEMEN !== 'undefined') && SATZ_THEMEN.find(x=>x.id===themaId);
  if (!t || !t.muster) return null;
  return new Set(GRAMMAR_RULES.filter(r=>t.muster.test(r.id) && !r.ausgeblendet).map(r=>r.id));
}

function saetzeZumThema(themaId){
  const alle = alleSaetze();
  const ids = themaRegelIds(themaId);
  if (!ids) return alle;
  return alle.filter(w=>{
    const tags = (typeof SENTENCE_TAGS!=='undefined') && SENTENCE_TAGS[w.id];
    return tags && tags.some(t=>ids.has(t.ruleId));
  });
}

/* Waehler statt Wischstreifen — Elias' Entscheidung vom 19.08.2026 (Entwurf A3).
   Sein Grund war die Zukunft, nicht die heutige Groesse: „gerade auch für die
   zukunft wenn mehr und mehr sachen dazu kommen ist das die beste lösung."
   Der alte Streifen wuchs waagerecht mit jedem Thema; ein Blatt waechst nach
   unten, und senkrecht zu rollen ist die Geste, die man ohnehin macht. */
function renderThemenLeiste(){
  const blatt = document.getElementById('themenBlatt');
  if (!blatt || typeof SATZ_THEMEN === 'undefined') return;
  blatt.innerHTML = SATZ_THEMEN.map(t=>{
    const n = saetzeZumThema(t.id).length;
    /* Die Zahl steht dran, weil sie die Erwartung setzt: "Iḍāfa 16" sagt
       vorher, dass es ein kleines Thema ist, statt es hinterher zu zeigen. */
    return `<button class="zeile${t.id===SATZ_THEMA?' aktiv':''}${n?'':' leer'}" type="button" data-thema="${t.id}">`
         + `<span class="links"><span class="ar">${escapeHtml(t.name)}</span></span>`
         + `<span class="n">${n}</span></button>`;
  }).join('');
  /* Der Knopf muss ohne Aufklappen sagen, was gerade gilt — sonst hat man
     eine Ebene gewonnen und eine Auskunft verloren.

     ⭐ Elias am 19.08.2026: „wenn bei einem modus etwas gewählt ist sollte beim
     jeweils anderem modus stehen ‚Modus wählen'." Die beiden Wähler zeigen
     damit, WO er gerade ist: der aktive trägt seinen Wert, der andere die
     Aufforderung. Vorher standen beide auf einem Wert und keiner sagte, welcher
     davon gerade zählt.

     Läuft eine Übung, ist der Lesemodus nicht aktiv — das Thema filtert zwar
     weiter den Vorrat, aber gelesen wird gerade nicht. */
  const uebtGerade = (typeof UEB !== 'undefined') && !!UEB.modus;
  const jetzt = SATZ_THEMEN.find(t=>t.id===SATZ_THEMA);
  const wert = document.getElementById('themenWert');
  const zahl = document.getElementById('themenZahl');
  if (wert) wert.textContent = uebtGerade ? 'Modus wählen' : (jetzt ? jetzt.name : 'Modus wählen');
  if (zahl) zahl.textContent = uebtGerade ? `${SATZ_THEMEN.length} Themen`
                                          : (jetzt ? `${saetzeZumThema(jetzt.id).length} Sätze` : '');
}

/* Auf- und zuklappen. `aria-expanded` traegt zugleich den Pfeil (CSS) — ein
   Zustand an einer Stelle, nicht zwei, die auseinanderlaufen koennen. */
function blattUmschalten(knopfId, blattId, offen){
  const knopf = document.getElementById(knopfId);
  const blatt = document.getElementById(blattId);
  if (!knopf || !blatt) return;
  const auf = (offen === undefined) ? blatt.classList.contains('hidden') : offen;
  /* Elias am 19.08.2026: „wenn ich die eine liste antippe dann sollte die
     andere offene liste sich wieder zuklappen."
     ⭐ Zwei offene Blaetter uebereinander sind zusammen hoeher als der
     Bildschirm — dann steht das untere sofort wieder hinter Zurueck/Weiter,
     genau der Zustand, der eben behoben wurde. */
  if (auf){
    document.querySelectorAll('.blatt').forEach(anderes=>{
      if (anderes.id === blattId || anderes.classList.contains('hidden')) return;
      anderes.classList.add('hidden');
      const zuKnopf = document.querySelector('[aria-controls="' + anderes.id + '"]');
      if (zuKnopf) zuKnopf.setAttribute('aria-expanded', 'false');
    });
  }
  blatt.classList.toggle('hidden', !auf);
  knopf.setAttribute('aria-expanded', auf ? 'true' : 'false');
  navLeisteAnpassen();
  if (!auf) return;
  blatt.scrollTop = 0;
  /* ⛔ Der Deckel muss aus dem PLATZ kommen, nicht aus einer festen Zahl —
     und „Platz" endet nicht am Fensterrand.

     Zwei Anlaeufe, beide am 19.08.2026 auf 375×812:
       `max-height:60vh`   -> Blatt 487 px hoch, Unterkante bei 867 px, also
                              55 px UNTER dem Bildschirmrand.
       Fensterhoehe minus   -> Unterkante 796 px, meine Pruefung sagte „passt".
       Blattanfang            Elias schickte ein Bildschirmfoto: die letzte
                              Gruppe stand hinter Zurueck/Weiter.

     ⭐ `.sent-nav` und `.ueb-fuss` sind `position:fixed` und schweben ueber
     dem Inhalt. Sie kosten keinen Platz im Layout und tauchen in keiner
     Hoehenrechnung auf — sie verdecken einfach. Deshalb wird hier ihre
     OBERKANTE gemessen und als Grenze genommen, nicht innerHeight.
     [[milder_bezugspunkt_verdeckt_mangel]]: „passt auf den Schirm" war die
     falsche Frage, „passt ueber die Leiste" ist die richtige. */
  const oben = blatt.getBoundingClientRect().top;
  /* ⭐ Elias am 19.08.2026: „ich möchte, dass die listen über die zurück und
     weiter tasten gehen, so kann ich dann mehr modis sehen."

     Also NICHT mehr an der Oberkante von .sent-nav aufhoeren, sondern erst an
     der unteren App-Leiste. Die bleibt stehen — sie ist der Weg aus dem
     Bildschirm heraus. Zurueck/Weiter werden solange ausgeblendet statt nur
     ueberdeckt: ein halb verdeckter Knopf sieht kaputt aus, und waehrend die
     Liste offen ist, blaettert man ohnehin nicht. */
  let grenze = window.innerHeight;
  const leiste = document.querySelector('.bottombar');
  if (leiste){
    const r = leiste.getBoundingClientRect();
    if (r.height > 0 && r.top > oben) grenze = r.top;
  }
  const platz = Math.max(200, Math.round(grenze - oben - 12));
  blatt.style.maxHeight = platz + 'px';
}

/* Zurueck/Weiter treten zurueck, solange ein Blatt offen ist — und kommen
   zurueck, sobald das letzte zu ist. Ein Zustand, aus dem DOM gelesen, nicht
   mitgezaehlt: eine eigene Zaehlung liefe irgendwann aus dem Tritt.
   [[zweiter_aufruf_ueberschreibt_still]] */
function navLeisteAnpassen(){
  const offen = [...document.querySelectorAll('.blatt')].some(b=>!b.classList.contains('hidden'));
  document.querySelectorAll('#screen-sentences .sent-nav, #screen-sentences .ueb-fuss')
    .forEach(el=>el.classList.toggle('blatt-verdeckt', offen));
}

function setzeThema(themaId){
  SATZ_THEMA = themaId;
  if (LUECKE.aktiv) beendeLuecke();
  SENT.list = saetzeZumThema(themaId);
  SENT.idx = 0;
  renderThemenLeiste();
  /* Der Themenwechsel tauscht den Vorrat aus, aus dem die Uebungsaufgaben
     gebaut werden. Eine laufende Uebung waere danach eine Aufgabe zu einem
     Satz, der nicht mehr im Thema steht - deshalb wird sie beendet und die
     Fragenzahlen an den Reitern neu gezaehlt (js/uebung.js). */
  if (typeof uebungBeenden === 'function' && UEB.modus) uebungBeenden();
  else if (typeof renderUebungsLeiste === 'function') renderUebungsLeiste();
  renderSentence();
}

let SENT = { list: alleSaetze(), idx:0 };

function openSentences(){
  SENT.list = saetzeZumThema(SATZ_THEMA);
  if (SENT.idx >= SENT.list.length) SENT.idx = 0;
  renderThemenLeiste();
  if (typeof renderUebungsLeiste === 'function') renderUebungsLeiste();
  renderSentence();
}

document.getElementById('themenWaehler').addEventListener('click', ()=>{
  blattUmschalten('themenWaehler', 'themenBlatt');
});

document.getElementById('themenBlatt').addEventListener('click', (e)=>{
  const knopf = e.target.closest('[data-thema]');
  if (!knopf) return;
  setzeThema(knopf.dataset.thema);
  /* Nach der Wahl zu. Ein Blatt, das offen bleibt, verdeckt genau den Satz,
     den man gerade sehen wollte. */
  blattUmschalten('themenWaehler', 'themenBlatt', false);
});

/* Woher stammt der Satz? Bei Lehrbuchsaetzen ist die Seite die eigentliche
   Auskunft - danach kann Elias im Buch nachschlagen. */
function herkunft(w){
  if (w.seite) return `Madina Buch 1, S. ${w.seite}`;
  return kapitelBeschriftung(w);
}

/* Im Lueckenmodus wird das Zielwort durch einen Strich ersetzt - als Element
   mit Mindestbreite, damit die Zeile nicht springt, sobald es erscheint. Die
   Grammatik-Unterstreichungen bleiben dabei aussen vor: sie wuerden verraten,
   was fehlt. */
function mitLuecke(text){
  if (!LUECKE.aktiv || LUECKE.geloest || !LUECKE.wort) return null;
  const von = text.indexOf(LUECKE.wort);
  if (von === -1) return null;
  return escapeHtml(text.slice(0, von))
       + `<span class="satz-luecke">${escapeHtml(LUECKE.wort)}</span>`
       + escapeHtml(text.slice(von + LUECKE.wort.length));
}

/* Sitzt eine Fundstelle an einer Wortgrenze, oder mitten in einem Wort?
   Inhaltlich dieselbe Regel wie in pruefe-markierungen.js (Z. 128-133) - beide
   muessen dasselbe sagen, sonst behauptet das Pruefskript "0 Markierungen mitten
   im Wort", waehrend die App welche zeigt. Richtig sind auch angeschriebene
   Partikeln davor: أَ (Frage), وَ und فَ (Anknuepfung).
   NICHT wortgleich, und das ist Absicht: dort heisst der Helfer `blank()`, hier
   `ohneTaschkil()`. Beide entfernen `[ً-ْٰـ]`, sind also gleichwertig - aber wer
   die Stellen vergleicht, soll nicht ueber verschiedene Namen stolpern. Aendert
   sich eine der beiden Definitionen, gehoert die andere mitgezogen. */
const GRENZ_TRENNER  = /[\s.،؟!«»:]/;
const GRENZ_TASCHKIL = /[ً-ْٰ]/;
function anWortgrenze(text, von, matchText){
  /* Manche Markierungen SIND ein Satzzeichen - fragepartikel-erforderlich-01
     zeigt auf das Fragezeichen selbst. Da gibt es keine Wortgrenze zu pruefen. */
  if (!/[ء-ي]/.test(matchText)) return true;
  const bis = von + matchText.length;
  const davor  = von === 0 ? ' ' : text[von - 1];
  const danach = bis >= text.length ? ' ' : text[bis];
  const linksOk = GRENZ_TRENNER.test(davor)
    || (GRENZ_TASCHKIL.test(davor) && /[وفأ]/.test(text[von - 2] || ''))
    || /[وفأ]/.test(davor);
  const rechtsOk = GRENZ_TRENNER.test(danach) || GRENZ_TASCHKIL.test(danach)
    || ohneTaschkil(matchText).length <= 1;
  return linksOk && rechtsOk;
}

/* Baut den Satz mit farbigen Grammatik-Unterstreichungen.
   `opts.ohneLuecke` uebergeht den Lueckenmodus - das braucht die Lernkarte
   (siehe renderCard in js/lernen.js), weil eine im Satz-Modus offene Luecke
   sonst auch auf der Karte ein Wort verdecken wuerde.

   Ein frueheres `opts.passiv` machte die Unterstreichungen auf der Karte
   unklickbar. Es ist am 29.07.2026 entfallen: Elias wollte sie ausdruecklich
   anklicken koennen. */
function buildSentenceHtml(w, opts){
  const ohneLuecke = !!(opts && opts.ohneLuecke);
  if (!ohneLuecke){
    const verdeckt = mitLuecke(w.sentAr || '');
    if (verdeckt !== null) return verdeckt;
  }
  const tags = (typeof SENTENCE_TAGS!=='undefined') && SENTENCE_TAGS[w.id];
  if (!SETTINGS.grammarHighlight || !tags || !tags.length) return escapeHtml(w.sentAr);
  // Erst alle Fundstellen im Rohtext einsammeln, dann in einem Durchgang
  // auszeichnen. Vorher lief je Markierung ein html.replace() auf dem bereits
  // ausgezeichneten HTML. Solange sich keine zwei Markierungen ueberschneiden,
  // faellt das nicht auf - sobald doch, greift die kuerzere in den Text der
  // laengeren hinein und erzeugt verschachtelte Spans. Mit Positionen statt
  // Textersetzung kann das nicht mehr passieren.
  const text = w.sentAr;
  const treffer = [];
  tags.forEach(t=>{
    const rule = GRAMMAR_RULES.find(r=>r.id===t.ruleId);
    if (!rule || !t.matchText) return;
    /* Von Elias abbestellte Regeln bleiben in den Daten (ihr Beleg aus dem
       Unterricht ist ja nicht falsch geworden), werden aber nicht mehr
       angezeigt. Siehe `ausgeblendet` in grammar-data.js. */
    if (rule.ausgeblendet) return;
    /* Elias am 19.08.2026: drei Regeln sollen "im satzmodus gerne bleiben aber
       nicht bei den karteikarten als erklaerung". Deshalb wird hier nur
       unterdrueckt, wenn der Aufrufer eine Karteikarte zeichnet - die
       Satzansicht (Zeile 212) uebergibt `karteikarte` nicht und zeigt sie. */
    if (rule.nichtAufKarteikarten && opts && opts.karteikarte) return;
    /* Frueher nur die erste Fundstelle. In «أَهَذَا كِتَابٌ؟ نَعَمْ، هَذَا
       كِتَابٌ.» war damit das erste كِتَابٌ unterstrichen und das zweite nicht -
       dieselbe Regel, willkuerlich nur einmal gezeigt.
       Die ERSTE Fundstelle bleibt ungeprueft durch: sie ist die von Hand
       gesetzte, pruefe-markierungen.js hat sie gegengelesen. Jede WEITERE
       findet die App selbst, die pruefe ich auf Wortgrenzen, weil sie niemand
       gesehen hat.

       HIER STAND: "So kann diese Aenderung nur hinzufuegen, nie eine bestehende
       Unterstreichung entfernen." Das war zu absolut und wurde am 29.07.2026
       widerlegt. Der Gegenfall: Ueberschneiden sich zwei Markierungen, kann ein
       neu gefundener ZWEITtreffer der laengeren `pos` ueber die kuerzere
       hinausschieben - und `if (t.von < pos) continue` weiter unten laesst die
       kuerzere dann aus. Eine heute sichtbare Unterstreichung koennte so
       verschwinden.
       Auf dem heutigen Datenbestand tritt das NICHT ein: pruefe-markierungen.js
       meldet 0 Ueberschneidungen bei 316 Markierungen, und die 3 zusaetzlichen
       Treffer beruehren keine. Die Zusage gilt also fuer die Daten, nicht fuer
       den Code - und genau deshalb steht die Ueberschneidungspruefung dort. */
    let erste = true;
    for (let von = text.indexOf(t.matchText); von !== -1;
             von = text.indexOf(t.matchText, von + 1)){
      if (erste || anWortgrenze(text, von, t.matchText))
        treffer.push({ von, bis: von + t.matchText.length, rule });
      erste = false;
    }
  });
  // Von links nach rechts, bei gleichem Start gewinnt die laengere Markierung.
  treffer.sort((a,b)=> a.von - b.von || (b.bis - b.von) - (a.bis - a.von));

  /* ⛔ 21.08.2026: HIER STAND `if (t.von < pos) continue;` — und liess damit
     jede Markierung aus, die eine schon gesetzte beruehrt. STILL: kein
     Hinweis, keine Meldung. Gemessen mit dieser Funktion selbst fehlte in
     vier Saetzen je eine von zwei Regeln:
       45958  الْكِتَابُ أَحْمَرُ.      mamnu-min-as-sarf-01
       50154  أَنَا مُدَرِّسٌ.          nominalsatz-ohne-kopula-01
       50155  نَحْنُ فِي الْمَسْجِدِ.    harf-jarr-fi-ala-01
       50156  أَنْتَ طَالِبٌ جَدِيدٌ.    nat-vier-bedingungen-01

     ⭐ Der Kommentar oben hatte es vorhergesagt und war veraltet: er berief
     sich auf „0 Ueberschneidungen bei 316 Markierungen" (29.07.2026).
     Heute sind es 587 Markierungen und 4 Ueberschneidungen. Die Zusage galt
     fuer die Daten, nicht fuer den Code — und die Daten sind gewachsen.
     [[eingefrorenes_feld_ist_kein_zustand]] [[daten_ohne_zugang]]

     Jetzt: der Text wird an ALLEN Grenzen zerlegt. Jedes Stueck weiss,
     welche Regeln es ueberdecken, und wird so tief verschachtelt, wie es
     Regeln gibt — die laengste aussen, die kuerzeste innen. Damit kann
     keine Markierung mehr verschwinden, egal wie die Daten wachsen. */
  const grenzen = new Set([0, text.length]);
  treffer.forEach(t => { grenzen.add(t.von); grenzen.add(t.bis); });
  const punkte = Array.from(grenzen).sort((a,b)=> a - b);

  /* ⛔ Die Ebene gilt fuer den GANZEN Satz, nicht je Stueck. Sonst springt
     die Linie: in الْكِتَابُ أَحْمَرُ lag mubtada-khabar-01 links auf Ebene 0
     und rechts — wo mamnu-min-as-sarf-01 daruntersteckt — auf Ebene 1.
     Die laengste Markierung bekommt die oberste Linie. */
  const nachLaenge = treffer.slice().sort((a,b)=> (b.bis - b.von) - (a.bis - a.von));
  const ebeneVon = new Map();
  nachLaenge.forEach(t => {
    if (ebeneVon.has(t.rule.id)) return;
    /* Die niedrigste Ebene, die keine UEBERLAPPENDE Markierung schon hat.
       Zwei Markierungen, die einander nicht beruehren, duerfen dieselbe
       Ebene teilen — sonst rutschte jede weitere Regel im Satz tiefer,
       auch wenn sie am anderen Ende steht. */
    let e = 0;
    while (treffer.some(o => ebeneVon.get(o.rule.id) === e
             && o.von < t.bis && t.von < o.bis)) e++;
    ebeneVon.set(t.rule.id, e);
  });

  let html = '';
  for (let i = 0; i < punkte.length - 1; i++){
    const von = punkte[i], bis = punkte[i+1];
    if (von >= bis) continue;
    /* Alle Markierungen, die dieses Stueck GANZ ueberdecken. Ein Stueck
       liegt per Konstruktion entweder ganz in einer Markierung oder ganz
       ausserhalb — deshalb reicht der Vergleich der beiden Grenzen. */
    const hier = treffer.filter(t => t.von <= von && t.bis >= bis)
                        .sort((a,b)=> ebeneVon.get(a.rule.id) - ebeneVon.get(b.rule.id));
    let stueck = escapeHtml(text.slice(von, bis));
    /* Von innen nach aussen bauen: die kuerzeste Regel sitzt am tiefsten
       und bekommt die unterste Linie. Ohne den wachsenden Abstand laegen
       zwei Unterstreichungen exakt aufeinander und man saehe nur eine. */
    for (let k = hier.length - 1; k >= 0; k--){
      const t = hier[k];
      stueck = '<span class="gram-underline"'
        + ' style="--gram-role:var(--gram-' + t.rule.color + ')'
        + (ebeneVon.get(t.rule.id)
             ? ';padding-bottom:' + (1 + ebeneVon.get(t.rule.id) * 4) + 'px'
               /* ⛔ Duenner statt gestrichelt: `dashed` heisst in dieser App
                  schon „hier fehlt ein Wort" (.satz-luecke). Im Browser
                  gemessen teilen sich 96 von 320 Regelpaaren im selben Satz
                  die Farbe — ohne Unterschied in der Staerke waeren zwei
                  blaue Linien 4px uebereinander nicht zuzuordnen. */
               + ';border-bottom-width:1px'
             : '') + '"'
        + ' data-rule="' + t.rule.id + '">' + stueck + '</span>';
    }
    html += stueck;
  }
  return html;
}

function renderSentence(){
  if (SENT.list.length===0){
    document.getElementById('sentAr').textContent='Keine Sätze in dieser Auswahl.';
    aktualisiereAndererSatz();
    return;
  }
  const w = SENT.list[SENT.idx];
  document.getElementById('sentChapter').textContent = herkunft(w);
  document.getElementById('sentAr').innerHTML = buildSentenceHtml(w);
  document.getElementById('sentDe').textContent = w.sentDe || '';
  /* Jeder neue Satz kommt wieder verdeckt — sonst waere das Aufdecken des
     vorigen ein Freifahrtschein fuer alle folgenden. */
  verdeckungAnwenden();
  document.getElementById('sentPos').textContent = `${SENT.idx+1} / ${SENT.list.length}`;

  const qBox = document.getElementById('sentQuranBox');
  if (w.quran && SETTINGS.showQuran){
    qBox.classList.remove('hidden');
    /* Auch hier hervorheben, nicht nur auf der Lernkarte - siehe die
       Begruendung in js/quran.js. `innerHTML` ist hier ungefaehrlich, weil
       quranMitTreffer selbst maskiert. */
    document.getElementById('sentQuranAr').innerHTML = quranMitTreffer(w.quran.ar, w);
    document.getElementById('sentQuranRef').textContent = `${w.quran.surah} ${w.quran.ayah}`;
    document.getElementById('sentQuranDe').textContent = w.quran.de || w.quran.note || '';
  } else qBox.classList.add('hidden');

  aktualisiereAndererSatz();
  /* Beim Blaettern die Analyse mitziehen, wenn sie offen ist - sonst stuende
     dort die Zerlegung des vorigen Satzes unter dem neuen. */
  const irabKasten = document.getElementById('sentIrabBox');
  if (irabKasten && !irabKasten.classList.contains('hidden')) renderIrab();
}
/* Beim Blaettern die Luecke schliessen: sie gehoert zu genau diesem Satz, und
   das Zielwort des naechsten waere ein anderes. */
function blaettere(schritt){
  if (LUECKE.aktiv) beendeLuecke();
  SENT.idx = (SENT.idx + schritt + SENT.list.length) % SENT.list.length;
  renderSentence();
}

document.getElementById('btnSentPrev').addEventListener('click', ()=>{
  blaettere(-1);
});
document.getElementById('btnSentNext').addEventListener('click', ()=>{
  blaettere(1);
});
/* ---------- Satz verdecken und hoeren ----------

   Elias am 19.08.2026: „wie beim quran lesen die sätze verdecken kann und dann
   zuhören … so kann ich ganze sätze trainieren und gucken, ob ich den satz
   richtig verstanden habe."

   ⭐ Bewusst dieselbe Bauart wie im Quran-Leser: verschwommen, und ein Tipp auf
   den Satz deckt genau ihn auf. Wer die Geste dort kennt, kennt sie hier.

   ⚠️ Die deutsche Uebersetzung bleibt STEHEN. Sie ist die Aufgabe: er hoert das
   Arabische, liest die Bedeutung und prueft, ob er es zusammenbekommt. Beides
   zu verdecken waere kein Selbsttest, sondern nur Raten. */
function verdeckungAnwenden(){
  const satz = document.getElementById('sentAr');
  const knopf = document.getElementById('btnSentVerdeckt');
  if (!satz || !knopf) return;
  const an = !!SETTINGS.satzVerdeckt;
  satz.classList.toggle('verdeckt', an);
  knopf.classList.toggle('an', an);
  knopf.setAttribute('aria-pressed', an ? 'true' : 'false');
  knopf.title = an ? 'Verdecken aus' : 'Satz verdecken — zuhören und prüfen';
}

document.getElementById('btnSentVerdeckt').addEventListener('click', ()=>{
  SETTINGS.satzVerdeckt = !SETTINGS.satzVerdeckt;
  saveSettings();
  verdeckungAnwenden();
  /* Beim Einschalten gleich vorlesen: das ist der ganze Zweck, und ein
     zusaetzlicher Griff zum Lautsprecher waere nur im Weg. */
  if (SETTINGS.satzVerdeckt && SENT.list.length && typeof speakArabic === 'function')
    speakArabic(SENT.list[SENT.idx].sentAr);
});

/* Antippen deckt genau diesen Satz auf, ohne den Modus zu verlassen — der
   naechste kommt wieder verdeckt. Zweites Antippen verdeckt ihn erneut. */
document.getElementById('sentAr').addEventListener('click', (e)=>{
  if (!SETTINGS.satzVerdeckt) return;
  /* ⛔ Nicht auf ein markiertes Wort: dort haengt schon das Grammatik-Popup,
     und zwei Bedeutungen an einem Tipp schlagen sich. */
  if (e.target.closest('.gram-underline')) return;
  document.getElementById('sentAr').classList.toggle('verdeckt');
});

document.getElementById('btnSentSpeak').addEventListener('click', ()=>{
  speakArabic(SENT.list[SENT.idx].sentAr);
});

/* ---------- Anderer Satz zum selben Wort ----------
   Jede Vokabel bringt genau einen Beispielsatz mit; zu einem Wort gibt es
   also nicht "noch einen". Selbst welche zu erzeugen verbietet E.1 (nichts
   erfinden, was nicht aus dem Unterricht oder dem Lehrwerk stammt).
   Stattdessen springt der Knopf zu den Saetzen ANDERER Vokabeln, in denen
   dasselbe Wort oder dieselbe Wurzel vorkommt - echtes Material, das das
   Wort in einem zweiten Zusammenhang zeigt. Gibt es keinen, sagt das die
   Zeile unter dem Knopf, statt ihn wortlos auszugrauen. */
function ohneTaschkil(s){ return (s||'').replace(/[ً-ْٰـ]/g,''); }

/* Dasselbe Wort sieht im Satz anders aus als im Vokabeleintrag: قِطٌّ steht
   dort als الْقِطُّ, نَظِيفٌ als وَنَظِيفٌ. Deshalb Vokalzeichen, Satzzeichen
   und die angeschriebenen Partikeln اَلْ, وَ und فَ abziehen, bevor verglichen
   wird. */
function wortKern(s){
  return ohneTaschkil(s)
    .replace(/[.،؟!«»:]/g, '')
    .replace(/^[وف]/, '')
    .replace(/^ال/, '');
}

function verwandteSatzPlaetze(w){
  const wort = wortKern(w.sg || w.ar);
  const platz = [];
  SENT.list.forEach((k, i)=>{
    if (k.id === w.id) return;
    // Wurzelgleichheit zaehlt mit: كِتَاب und كُتُب stehen im Satz in ganz
    // verschiedener Gestalt, sind fuers Lernen aber dasselbe Wortfeld.
    const gleicheWurzel = w.root && k.root && w.root === k.root;
    // Ganze Woerter vergleichen, nicht Teilzeichenketten. Ein Teilstring-
    // Vergleich braeuchte eine Mindestlaenge als Schutz vor Zufallstreffern -
    // und die schloss ausgerechnet kurze Woerter wie قِطّ und يَد aus, zu
    // denen es sehr wohl zweite Saetze gibt.
    const gleichesWort = wort.length >= 2 &&
      ohneTaschkil(k.sentAr).split(/\s+/).some(x => wortKern(x) === wort);
    if (gleicheWurzel || gleichesWort) platz.push(i);
  });
  return platz;
}

function aktualisiereAndererSatz(){
  const knopf = document.getElementById('btnSentOther');
  const zeile = document.getElementById('sentOtherHint');
  const w = SENT.list[SENT.idx];
  if (!w){ knopf.disabled = true; zeile.textContent = ''; return; }
  const n = verwandteSatzPlaetze(w).length;
  knopf.disabled = n === 0;
  zeile.textContent = n === 0
    ? 'Zu diesem Wort gibt es keinen weiteren Satz im Lehrwerk.'
    : '';
}

document.getElementById('btnSentOther').addEventListener('click', ()=>{
  const w = SENT.list[SENT.idx];
  const platz = verwandteSatzPlaetze(w);
  if (!platz.length) return;
  /* Wie beim Blaettern: die Luecke gehoert zum aktuellen Satz. Ohne das blieb
     das Eingabefeld offen und wartete auf ein Wort, das im neuen Satz gar
     nicht vorkommt. */
  if (LUECKE.aktiv) beendeLuecke();
  /* Reihum weiter, nicht zufaellig: bei zwei verwandten Saetzen wuerde Zufall
     denselben mehrfach hintereinander zeigen und der Knopf wirkte kaputt. */
  const naechster = platz.find(i => i > SENT.idx);
  SENT.idx = naechster !== undefined ? naechster : platz[0];
  renderSentence();
});

/* ---------- Lückentext ----------
   Einen Satz zu lesen und zu verstehen ist Wiedererkennung. Ob ein Wort
   wirklich sitzt, zeigt sich erst beim aktiven Abruf - deshalb wird das
   Zielwort ausgeblendet und muss selbst ergaenzt werden.

   Welches Wort ausgeblendet wird, ist nicht beliebig:
   - bei einem Vokabelsatz das Wort der Vokabel selbst, zu der der Satz gehoert
   - bei einem Lehrbuchsatz die Stelle, an der eine Grammatikregel haengt -
     also genau das, was der Satz zeigen soll
   Findet sich keines von beidem, gibt es keine Luecke. Ein zufaellig
   ausgeblendetes Wort waere Ratearbeit statt Abfrage. */
let LUECKE = { aktiv:false, wort:'', geloest:false };

function ohnePunkt(s){ return (s||'').replace(/[.،؟!«»:؛]/g,''); }

/* Vergleich ohne Vokalzeichen: Elias tippt auf dem Handy, und ob er die
   Taschkil mitschreibt, ist fuer diese Uebung nicht der Punkt. Die richtige
   Schreibweise steht danach vollstaendig da. */
function gleichesWortLose(a, b){
  return ohneTaschkil(ohnePunkt(a)).trim() === ohneTaschkil(ohnePunkt(b)).trim();
}

function findeZielwort(w){
  const woerter = String(w.sentAr || '').split(/\s+/);
  /* Vokabelsatz: das Wort der Vokabel im Satz suchen. */
  if (w.ar || w.sg){
    const kern = wortKern(w.sg || w.ar);
    const treffer = woerter.find(x => kern.length >= 2 && wortKern(x) === kern);
    if (treffer) return ohnePunkt(treffer);
  }
  /* Lehrbuchsatz: die markierte Stelle - aber nur, wenn sie genau ein Wort
     ist. Eine ganze Wortgruppe auszublenden waere zu viel auf einmal. */
  const tags = (typeof SENTENCE_TAGS!=='undefined') && SENTENCE_TAGS[w.id];
  if (tags){
    for (const t of tags){
      if (t.matchText && !/\s/.test(t.matchText) && w.sentAr.includes(t.matchText)) return t.matchText;
    }
  }
  return null;
}

function startLuecke(){
  const w = SENT.list[SENT.idx];
  const kasten = document.getElementById('sentLueckeBox');
  const ziel = w && findeZielwort(w);
  if (!ziel){ toast('Zu diesem Satz gibt es kein eindeutiges Zielwort.'); return; }
  /* Die I'rab-Zerlegung listet JEDES Wort des Satzes auf, auch das gesuchte -
     bei offener Luecke waere sie schlicht die Loesung. Beide Ansichten
     schliessen sich deshalb gegenseitig aus. */
  document.getElementById('sentIrabBox').classList.add('hidden');
  LUECKE = { aktiv:true, wort:ziel, geloest:false };
  document.getElementById('lueckeEingabe').value = '';
  document.getElementById('lueckeAntwort').textContent = '';
  document.getElementById('lueckeAntwort').className = 'luecke-antwort';
  kasten.classList.remove('hidden');
  renderSentence();
  document.getElementById('lueckeEingabe').focus();
}

function beendeLuecke(){
  LUECKE = { aktiv:false, wort:'', geloest:false };
  document.getElementById('sentLueckeBox').classList.add('hidden');
  renderSentence();
}

function pruefeLuecke(aufloesen){
  if (!LUECKE.aktiv) return;
  const eingabe = document.getElementById('lueckeEingabe').value;
  const feld = document.getElementById('lueckeAntwort');
  const richtig = !aufloesen && gleichesWortLose(eingabe, LUECKE.wort);
  if (aufloesen || richtig){
    LUECKE.geloest = true;
    renderSentence();
    feld.className = 'luecke-antwort ' + (richtig ? 'richtig' : 'falsch');
    feld.innerHTML = richtig
      ? `Richtig: <span class="luecke-wort" lang="ar" dir="rtl">${escapeHtml(LUECKE.wort)}</span>`
      : `Es hiess <span class="luecke-wort" lang="ar" dir="rtl">${escapeHtml(LUECKE.wort)}</span>`;
    /* Nach dem Schreiben des Feldes, nicht davor: der Effekt greift auf das
       Wort darin zu (js/feier.js). Elias hat den Lueckentext ausdruecklich
       gelobt - hier lohnt die Rueckmeldung. */
    if (richtig && typeof feiere === 'function') feiere('luecke-richtig');
    return;
  }
  feld.className = 'luecke-antwort falsch';
  feld.textContent = eingabe.trim() ? 'Noch nicht — versuch es nochmal.' : 'Tippe das fehlende Wort ein.';
}

document.getElementById('btnSentLuecke').addEventListener('click', ()=>{
  if (LUECKE.aktiv) beendeLuecke(); else startLuecke();
});
document.getElementById('btnLueckePruefen').addEventListener('click', ()=>pruefeLuecke(false));
document.getElementById('btnLueckeAufloesen').addEventListener('click', ()=>pruefeLuecke(true));
document.getElementById('lueckeEingabe').addEventListener('keydown', (e)=>{
  if (e.key === 'Enter'){ e.preventDefault(); pruefeLuecke(false); }
});

/* ---------- إِعْراب ----------
   Zeigt je Wort, welche Rolle es im Satz hat und welchen Kasus diese Rolle
   verlangt. Die Analyse steht in js/irab.js und arbeitet ausschliesslich mit
   dem, was im Unterricht behandelt wurde. Wo sie sich nicht sicher ist, sagt
   sie nichts - eine falsche Kasusangabe waere schlimmer als gar keine (E.1).
   Die Wortarten kommen aus dem geladenen Wortschatz; ohne sie liefe die
   Analyse zwar, koennte aber Verben nicht von Nomen unterscheiden. */
function renderIrab(){
  const kasten = document.getElementById('sentIrabBox');
  const liste  = document.getElementById('sentIrabList');
  const w = SENT.list[SENT.idx];
  if (!w){ kasten.classList.add('hidden'); return; }
  if (typeof setzeLexikon === 'function') setzeLexikon(VOCAB_DATA);
  const zeilen = analysiereSatz(w.sentAr);
  liste.innerHTML = zeilen.map(t=>{
    /* Warum am Wort keine Endung zu sehen ist, obwohl der Fall feststeht:
       das Possessiv-Yāʾ, die fuenf Nomen, ein اِسْم مَقْصُور, ein Name auf Alif.
       Ohne diesen Zusatz sucht man an اسْمِي nach einer Damma, die es nach der
       Regel gar nicht geben kann. */
    const unsichtbar = (t.erwartet && !t.gelesen && typeof endungUnsichtbar === 'function')
      ? endungUnsichtbar(t.wort) : null;
    const kasus = t.erwartet
      ? `<span class="irab-kasus" data-k="${t.erwartet}">${KASUS[t.erwartet].ar} · ${KASUS[t.erwartet].de}` +
        (unsichtbar ? `<span class="irab-unsichtbar">nicht sichtbar — ${escapeHtml(unsichtbar)}</span>` : '') +
        '</span>'
      : '<span class="irab-kasus">keine Endung</span>';
    return `<div class="irab-zeile">
      <span class="irab-wort" lang="ar" dir="rtl">${escapeHtml(t.rein)}</span>
      <span class="irab-rolle">${escapeHtml(t.rolle)}<br>${kasus}</span>
    </div>`;
  }).join('');
  kasten.classList.remove('hidden');
}

document.getElementById('btnSentIrab').addEventListener('click', ()=>{
  const kasten = document.getElementById('sentIrabBox');
  if (kasten.classList.contains('hidden')){
    /* Umgekehrt genauso: wer die Zerlegung aufmacht, bekommt das gesuchte
       Wort darin zu sehen - dann ist die Luecke erledigt. */
    if (LUECKE.aktiv) beendeLuecke();
    renderIrab();
  }
  else kasten.classList.add('hidden');
});

/* Oeffnet die Erklaerung zu einer Markierung. Seit dem 29.07.2026 eine eigene
   Funktion, weil die Lernkarte sie ebenfalls aufruft (js/lernen.js): Elias
   konnte die Satzbau-Hinweise auf der Karte nicht anklicken. Zwei Fassungen
   derselben Erklaerung waeren die naheliegende und die falsche Loesung. */
/* ---------- Kurzfassung einer Erklaerung ----------
   Elias am 30.07.2026: "die satzhinweise insgesamt kuerzer von ihrer laenge sein
   sollen. teilweise gehen sie noch weiter unter den bildschirmende hinaus"

   ⚠️ Nicht geloescht wird nichts. Die Erklaerungen tragen Zitate mit Fundstelle,
   und seine eigene stehende Vorgabe verlangt genau diesen Wortlaut - an manchen
   Stellen besteht der Lehrer ausdruecklich auf der Formulierung (عَلَى heisst
   "auf", nicht "ueber"). Gekuerzt wird also nur die SICHTBARE Laenge: der erste
   Satz steht sofort da, der Rest hinter einem Schalter, Wort fuer Wort
   unveraendert.

   ⚠️ Und der Schnitt ist BERECHNET, nicht in die Daten geschrieben. Ein neues
   Feld `kern` haette 73 handverfasste Eintraege gebraucht, davon 17 mit Urteil -
   erfundene Formulierungen im Datenbestand, ohne dass jemand gegenliest. So gibt
   es nur eine Fassung des Textes, und die stammt aus dem Unterricht.

   Am 30.07.2026 an grammar-data.js gemessen: 73 Erklaerungen, Median 418
   Zeichen, laengste 912.

   ⚠️⚠️ NACHGEBESSERT AM 30.07.2026, weil die erste Fassung den Hinweis
   SCHLECHTER gemacht hat statt kuerzer. Sie nahm genau EINEN Satz - und der
   erste Satz einer Erklaerung ist oft nur der Vorspann. Elias hat vier Faelle
   hintereinander gemeldet, jeder davon eine leere Kurzfassung:

     irab-drei-faelle-01  "Es gibt drei Fälle, die wir zuerst brauchen
                          (eigentlich sind es vier)."  -> nennt die Faelle nicht
     hamzatul-wasl-01     "Der Lehrer erwähnt هَمْزَةُ الوَصْل … das hatten wir
                          schon im Buchstabenkurs."    -> erklaert nichts
     madd-tabii-01        "Ein Schüler fragt, ob …"     -> erzaehlt die Stunde
     schakl-01            "Auf die Frage eines Schülers …"

   Sein Urteil dazu, woertlich: "die erklärung hilft auch überhaupt nicht
   weiter" und "es hat auch nichts erklärt".

   Deshalb wird jetzt nach LAENGE geschnitten, nicht nach Satzanzahl: es kommen
   ganze Saetze dazu, solange KERN_BUDGET nicht ueberschritten ist, mindestens
   aber einer. Damit ueberspringt die Kurzfassung den Vorspann von selbst, denn
   ein Vorspann ist kurz - und der Satz mit der Regel folgt direkt darauf. */
const KERN_ABKUERZUNGEN = ['z.B.','ca.','bzw.','usw.','d.h.','u.a.','S.','L.','Nr.','vgl.','ggf.'];
/* Rund die Haelfte des Medians. Gross genug, dass nach einem kurzen Vorspann der
   tragende Satz mitkommt, klein genug, dass das Fenster auf dem Handy passt -
   beides am 30.07.2026 nachgemessen. */
const KERN_BUDGET = 240;

/* Alle Satzenden eines Textes, Abkuerzungen uebersprungen - sonst endet die
   Kurzfassung von fem-ohne-ta-marbuta-01 mitten im Satz bei "z.B." und sagt gar
   nichts. */
function satzEnden(t){
  const RE = /[.!?](?=\s|$)/g;
  const enden = [];
  let m;
  while ((m = RE.exec(t)) !== null){
    const bis = m.index + 1;
    if (KERN_ABKUERZUNGEN.some(a => t.slice(0, bis).endsWith(a))) continue;
    enden.push(bis);
  }
  return enden;
}

function kernSatz(text){
  const t = String(text || '').trim();
  const enden = satzEnden(t);
  if (!enden.length) return t;
  /* Den letzten Schnitt nehmen, der noch ins Budget passt - aber immer
     mindestens den ersten Satz, auch wenn der allein schon laenger ist. */
  let bis = enden[0];
  for (const e of enden) if (e <= KERN_BUDGET) bis = e;
  return t.slice(0, bis);
}

function zeigeGrammatikPopover(span){
  const pop = document.getElementById('gramPopover');
  const rule = GRAMMAR_RULES.find(r=>r.id===span.dataset.rule);
  if (!rule) return;
  /* Quellenzeile. Elias' Auflage bei der Freigabe des zweiten Feldes (29.07.26):
     "sollte die quellenangabe in der app sein dann soll beide sehr kurz sein
     damit nicht viel text dafuer drauf geht". Deshalb bleibt es EINE Zeile in
     Kleinschrift, der Buchbeleg wird abgekuerzt (Schl. 1 L5 S. 18) und steht
     nur da, wo es ihn gibt. */
  /* ⭐ Seit dem 18.08.2026 gibt es Regeln OHNE Unterrichtsquelle: die elf
     Lehrbuch-Ergaenzungen aus Block B. Ohne diese Fallunterscheidung stuerzte
     die Popup-Anzeige hier ab (`rule.source.video` an einem undefined).
     Sie bekommen stattdessen ihre Buchfundstelle — und davor den Hinweis, dass
     sie NICHT vom Lehrer stammen. Genau dafuer hat Elias die Kennzeichnung
     gewollt: bei der Regelfreigabe muss auf einen Blick klar sein, was aus dem
     Unterricht kommt und was aus einem Buch. */
  const WERK_KURZ = { 'sharh-madinah-1': 'Sharḥ Madīnah 1', 'bayna-yadayk-2': 'Bayna Yadayk 2' };
  const quelle = [];
  if (rule.ergaenzung && rule.buchQuelle){
    const b = rule.buchQuelle;
    quelle.push(`📖 ${WERK_KURZ[b.werk] || b.werk} · L${b.lektion} S. ${b.seite} — im Unterricht nicht gesagt`);
  } else if (rule.source){
    quelle.push(`${rule.source.video} · ca. ${rule.source.approxTimestamp}`);
  }
  if (rule.source2) quelle.push(`Schl. ${rule.source2.schluessel} L${rule.source2.lektion} S. ${rule.source2.seite}`);
  const voll = String(rule.shortExplanation || '');
  const kern = kernSatz(voll);
  const rest = voll.slice(kern.length).trim();
  pop.innerHTML = `<div class="gp-title">${escapeHtml(rule.name)}</div>`
    + `<div class="gp-kern">${escapeHtml(kern)}</div>`
    + (rest
        ? `<button class="gp-mehr" type="button">ausführlich</button>`
          + `<div class="gp-rest hidden">${escapeHtml(rest)}</div>`
        : '')
    + `<div class="gp-source">${escapeHtml(quelle.join(' · '))}</div>`
    /* ⛔ 21.08.2026: WEITERE REGELN AN DERSELBEN STELLE.
       Seit die Zerlegung ueberschneidende Markierungen verschachtelt statt
       sie wegzulassen, koennen zwei Regeln denselben Text tragen — in
       أَنَا مُدَرِّسٌ sogar Zeichen fuer Zeichen denselben. Ein Klick trifft
       aber immer nur den innersten Span. Ohne diese Zeile waere die zweite
       Regel zu SEHEN und nicht zu erreichen.
       [[flaeche_nur_im_gefuellten_zustand]] */
    + (function(){
        const andere = [];
        /* nach aussen: alle umschliessenden Markierungen */
        for (let el = span.parentElement; el; el = el.parentElement){
          if (!el.classList || !el.classList.contains('gram-underline')) break;
          if (el.dataset.rule && el.dataset.rule !== rule.id) andere.push(el.dataset.rule);
        }
        /* nach innen: alle enthaltenen */
        span.querySelectorAll('.gram-underline').forEach(el => {
          if (el.dataset.rule && el.dataset.rule !== rule.id
              && andere.indexOf(el.dataset.rule) < 0) andere.push(el.dataset.rule);
        });
        if (!andere.length) return '';
        const namen = andere.map(id => {
          const r = GRAMMAR_RULES.find(x => x.id === id);
          return r ? `<button class="gp-andere" type="button" data-rule="${id}">${escapeHtml(r.name)}</button>` : '';
        }).filter(Boolean);
        return namen.length
          ? `<div class="gp-auch">Hier gilt auch: ${namen.join(' ')}</div>` : '';
      })();
  pop._anker = span;
  platzierePopover();
  pop.classList.add('show');
}

/* Die Platzierung steht getrennt, weil sie ZWEIMAL gebraucht wird: beim Oeffnen
   und nach dem Aufklappen von „ausführlich".

   ⚠️ Ohne den zweiten Aufruf war Elias' Beschwerde nur halb behoben. Im Browser
   auf 375x812 gemessen: zugeklappt 162 px hoch und vollstaendig im Bild,
   aufgeklappt 407 px - und damit wieder unter dem Bildschirmrand, weil das
   Fenster von seinem festen oberen Rand nach unten waechst. Genau das hatte er
   gemeldet ("teilweise gehen sie noch weiter unter den bildschirmende hinaus").
   Jetzt wird nach jeder Groessenaenderung neu entschieden, ob es nach unten oder
   nach oben aufgeht. */
function platzierePopover(){
  const pop = document.getElementById('gramPopover');
  const span = pop && pop._anker;
  if (!span || !span.isConnected) return;
  const rect = span.getBoundingClientRect();
  pop.style.left = Math.max(8, Math.min(rect.left, window.innerWidth-296))+'px';
  /* Nach unten, wenn darunter Platz fuer die TATSAECHLICHE Hoehe ist, sonst
     darueber. Frueher stand hier die feste Zahl 170 - die stimmte fuer die
     zugeklappte Fassung und war fuer die aufgeklappte zu klein. */
  pop.style.top = '0px'; pop.style.bottom = 'auto';
  const hoehe = pop.offsetHeight || 170;
  const platzUnten = window.innerHeight - rect.bottom - 8;
  const platzOben  = rect.top - 8;
  if (platzUnten >= hoehe || platzUnten >= platzOben){
    pop.style.top = Math.max(8, Math.min(rect.bottom + 8, window.innerHeight - hoehe - 8)) + 'px';
    pop.style.bottom = 'auto';
  } else {
    pop.style.top = 'auto';
    pop.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
  }
}

document.getElementById('sentAr').addEventListener('click', (e)=>{
  const span = e.target.closest('.gram-underline');
  if (!span){ document.getElementById('gramPopover').classList.remove('show'); return; }
  zeigeGrammatikPopover(span);
});
/* „ausführlich" klappt den Rest auf. Muss VOR dem Zumachen unten stehen und den
   Klick anhalten - sonst schliesst der Zuklapp-Handler das Popover, waehrend man
   gerade mehr lesen will. */
document.getElementById('gramPopover').addEventListener('click', (e)=>{
  /* ⭐ Zuerst die Knoepfe fuer die anderen Regeln an derselben Stelle:
     sie tauschen den Inhalt aus und behalten denselben Anker. */
  const anders = e.target.closest('.gp-andere');
  if (anders){
    e.stopPropagation();
    const pop = document.getElementById('gramPopover');
    const anker = pop._anker;
    if (!anker) return;
    /* Einen Span mit der gewuenschten Regel in derselben Kette finden —
       sonst wuesste zeigeGrammatikPopover nicht, welche gemeint ist. */
    let ziel = null;
    for (let el = anker; el && el.classList && el.classList.contains('gram-underline'); el = el.parentElement)
      if (el.dataset.rule === anders.dataset.rule){ ziel = el; break; }
    if (!ziel) ziel = anker.querySelector('.gram-underline[data-rule="' + anders.dataset.rule + '"]');
    if (ziel) zeigeGrammatikPopover(ziel);
    return;
  }
  const knopf = e.target.closest('.gp-mehr');
  if (!knopf) return;
  e.stopPropagation();
  const rest = knopf.parentElement.querySelector('.gp-rest');
  if (!rest) return;
  const zu = rest.classList.toggle('hidden');
  knopf.textContent = zu ? 'ausführlich' : 'weniger';
  /* Neu platzieren, sonst waechst das Fenster unter den Bildschirmrand. */
  platzierePopover();
});
document.addEventListener('click', (e)=>{
  if (!e.target.closest('.gram-underline') && !e.target.closest('#gramPopover'))
    document.getElementById('gramPopover').classList.remove('show');
});
const gramToggleBtn = document.getElementById('toggleGrammarHighlight');
gramToggleBtn.classList.toggle('on', SETTINGS.grammarHighlight);
gramToggleBtn.addEventListener('click', ()=>{
  SETTINGS.grammarHighlight = !SETTINGS.grammarHighlight;
  gramToggleBtn.classList.toggle('on', SETTINGS.grammarHighlight);
  saveSettings();
  renderSentence();
});

