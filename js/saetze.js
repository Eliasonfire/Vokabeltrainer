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
  return ausVokabeln.concat(ausLehrbuch);
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

/* ---------- Satzsuche (Elias' Wunsch vom 19.08.2026) ----------

   „ein suchfeld ganz oben … am besten ist es ebenfalls in dem modus aktiv in
   dem ich es einsetzte. also wenn ich bei genitiv übungen bin und da ein
   bestimmtes wort eingebe das mir dann die sätze angezeigt werden im
   übungsmodus mit dem satz."

   ⭐ Deshalb steht der Filter HIER und nirgends sonst: uebungenAufbauen() in
   js/uebung.js baut seine Aufgaben aus SENT.list, und SENT.list kommt aus
   dieser Funktion. Ein Filter an dieser einen Stelle wirkt damit im Lesemodus
   UND im Uebungsmodus — zwei Suchen waeren zwei Gelegenheiten, auseinander zu
   laufen. */
let SATZ_SUCHE = '';

/* ⚠️ Gesucht wird ohne Ḥarakāt. Das wirft Information weg — مِنْ und مَنْ
   sehen danach gleich aus — und genau das ist hier richtig: Elias tippt ein
   Wort, keine vollvokalisierte Form. Fuer einen Vergleich zwischen Datensaetzen
   waere es falsch ([[skelettvergleich_wirft_information_weg]]), fuer ein
   Suchfeld ist es die einzige brauchbare Grobheit.
   Alif-Varianten werden vereinheitlicht, damit اِ und أ und ا dasselbe finden. */
function suchForm(s){
  return String(s || '').normalize('NFC')
    .replace(/[ً-ْٰـ]/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .toLowerCase().trim();
}

function passtZurSuche(w){
  if (!SATZ_SUCHE) return true;
  const n = suchForm(SATZ_SUCHE);
  if (!n) return true;
  /* Arabisch UND Deutsch, damit er in der Sprache suchen kann, die ihm
     gerade einfaellt. */
  return suchForm(w.sentAr).indexOf(n) >= 0
      || String(w.sentDe || '').toLowerCase().indexOf(n) >= 0;
}

/* `ohneSuche` liefert den Vorrat VOR dem Suchfilter — gebraucht fuer den
   Nenner der Trefferzeile. ⚠️ Ohne diesen Schalter rief die Trefferzeile
   dieselbe gefilterte Funktion und haette immer „12 von 12" gemeldet: eine
   Quote, die per Bauart nie etwas anderes sagen kann. */
function saetzeZumThema(themaId, ohneSuche){
  const alle = alleSaetze();
  const ids = themaRegelIds(themaId);
  const nachThema = !ids ? alle : alle.filter(w=>{
    const tags = (typeof SENTENCE_TAGS!=='undefined') && SENTENCE_TAGS[w.id];
    return tags && tags.some(t=>ids.has(t.ruleId));
  });
  return (SATZ_SUCHE && !ohneSuche) ? nachThema.filter(passtZurSuche) : nachThema;
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
     eine Ebene gewonnen und eine Auskunft verloren. */
  const jetzt = SATZ_THEMEN.find(t=>t.id===SATZ_THEMA);
  const wert = document.getElementById('themenWert');
  const zahl = document.getElementById('themenZahl');
  if (wert) wert.textContent = jetzt ? jetzt.name : 'Thema wählen';
  if (zahl) zahl.textContent = jetzt ? `${saetzeZumThema(jetzt.id).length} Sätze` : '';
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
  let grenze = window.innerHeight;
  document.querySelectorAll('.sent-nav, .ueb-fuss').forEach(el=>{
    const r = el.getBoundingClientRect();
    /* Hoehe 0 heisst versteckt — waehrend einer Uebung steht .ueb-fuss statt
       .sent-nav, und umgekehrt. */
    if (r.height > 0 && r.top > oben && r.top < grenze) grenze = r.top;
  });
  const platz = Math.max(200, Math.round(grenze - oben - 12));
  blatt.style.maxHeight = platz + 'px';
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

/* ---------- Satzsuche: Verdrahtung ----------
   ⚠️ Verzoegert, nicht bei jedem Tastendruck: saetzeZumThema() laeuft ueber
   215 Saetze und uebungenAufbauen() zerlegt sie danach neu. Bei jedem
   Buchstaben waere das spuerbar. */
let SUCH_UHR = null;
function sucheAnwenden(){
  const feld = document.getElementById('satzSuche');
  const aus  = document.getElementById('satzSucheAus');
  const zeile = document.getElementById('satzTreffer');
  SATZ_SUCHE = feld.value.trim();
  aus.classList.toggle('hidden', !SATZ_SUCHE);

  /* ⛔ Der Aufgaben-Zwischenspeicher haengt am Thema. Ohne den Suchbegriff im
     Schluessel bliebe er stehen, und der Uebungsmodus zeigte weiter die alten
     Aufgaben — die Suche waere im Lesemodus sichtbar und im Uebungsmodus
     wirkungslos. Genau das, was Elias ausdruecklich NICHT wollte. */
  if (typeof UEB_CACHE !== 'undefined') UEB_CACHE = { thema:null, nachModus:null };

  /* Eine laufende Uebung wird beendet: ihre Aufgaben stammen aus einem
     Vorrat, den es so nicht mehr gibt. Dieselbe Begruendung wie beim
     Themenwechsel. */
  if (typeof uebungBeenden === 'function' && typeof UEB !== 'undefined' && UEB.modus) uebungBeenden();

  SENT.list = saetzeZumThema(SATZ_THEMA);
  SENT.idx = 0;
  if (LUECKE.aktiv) beendeLuecke();
  renderThemenLeiste();
  if (typeof renderUebungsLeiste === 'function') renderUebungsLeiste();
  renderSentence();

  if (!SATZ_SUCHE){ zeile.classList.add('hidden'); return; }
  const n = SENT.list.length;
  zeile.classList.remove('hidden');
  zeile.classList.toggle('leer', n === 0);
  /* ⚠️ Der Nenner gehoert dazu. „12 Sätze" allein sagt nicht, ob das viel
     oder wenig ist. [[trefferquote_ohne_preis]] */
  const gesamt = saetzeZumThema(SATZ_THEMA, true).length;
  zeile.innerHTML = n
    ? `<b>${n}</b> von ${gesamt} — gesucht in ${escapeHtml(themaName(SATZ_THEMA))}`
    : `<b>Kein Satz</b> mit „${escapeHtml(SATZ_SUCHE)}" in ${escapeHtml(themaName(SATZ_THEMA))}`;
}
function themaName(id){
  const t = (typeof SATZ_THEMEN !== 'undefined') && SATZ_THEMEN.find(x=>x.id===id);
  return t ? t.name : 'allen Sätzen';
}
document.getElementById('satzSuche').addEventListener('input', ()=>{
  clearTimeout(SUCH_UHR);
  SUCH_UHR = setTimeout(sucheAnwenden, 220);
});
document.getElementById('satzSucheAus').addEventListener('click', ()=>{
  document.getElementById('satzSuche').value = '';
  sucheAnwenden();
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

  let html = '', pos = 0;
  for (const t of treffer){
    if (t.von < pos) continue;                 // ueberschneidet eine gesetzte
    html += escapeHtml(text.slice(pos, t.von));
    html += `<span class="gram-underline" style="--gram-role:var(--gram-${t.rule.color})" data-rule="${t.rule.id}">${escapeHtml(text.slice(t.von, t.bis))}</span>`;
    pos = t.bis;
  }
  return html + escapeHtml(text.slice(pos));
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
    + `<div class="gp-source">${escapeHtml(quelle.join(' · '))}</div>`;
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

