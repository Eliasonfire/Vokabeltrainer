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
let SENT = { list: alleSaetze(), idx:0 };

function openSentences(){
  SENT.list = alleSaetze();
  if (SENT.idx >= SENT.list.length) SENT.idx = 0;
  renderSentence();
}

/* Woher stammt der Satz? Bei Lehrbuchsaetzen ist die Seite die eigentliche
   Auskunft - danach kann Elias im Buch nachschlagen. */
function herkunft(w){
  if (w.seite) return `Madina Buch 1, S. ${w.seite}`;
  if (w.chapter === 'personal') return 'Eigene Vokabel';
  return `Kap. ${w.chapter}`;
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
   `opts.ohneLuecke` uebergeht den Lueckenmodus, `opts.passiv` nimmt den
   Unterstreichungen ihre Klickbarkeit - beides braucht die Lernkarte
   (siehe renderCard in js/lernen.js). */
function buildSentenceHtml(w, opts){
  const passiv     = !!(opts && opts.passiv);
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
    html += `<span class="gram-underline${passiv ? ' gram-passiv' : ''}" style="--gram-role:var(--gram-${t.rule.color})" data-rule="${t.rule.id}">${escapeHtml(text.slice(t.von, t.bis))}</span>`;
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
  if (w.quran){
    qBox.classList.remove('hidden');
    document.getElementById('sentQuranAr').textContent = w.quran.ar;
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
    const kasus = t.erwartet
      ? `<span class="irab-kasus" data-k="${t.erwartet}">${KASUS[t.erwartet].ar} · ${KASUS[t.erwartet].de}</span>`
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

document.getElementById('sentAr').addEventListener('click', (e)=>{
  const span = e.target.closest('.gram-underline');
  const pop = document.getElementById('gramPopover');
  if (!span){ pop.classList.remove('show'); return; }
  const rule = GRAMMAR_RULES.find(r=>r.id===span.dataset.rule);
  if (!rule) return;
  pop.innerHTML = `<div class="gp-title">${rule.name}</div><div>${rule.shortExplanation}</div><div class="gp-source">${rule.source.video} · ca. ${rule.source.approxTimestamp}</div>`;
  const rect = span.getBoundingClientRect();
  pop.style.left = Math.max(8, Math.min(rect.left, window.innerWidth-296))+'px';
  pop.style.top = (rect.bottom+8)+'px';
  pop.classList.add('show');
});
document.addEventListener('click', (e)=>{
  /* `.gram-passiv` ausgenommen: die Unterstreichungen auf der Lernkarte oeffnen
     kein Popover, also duerfen sie ein offenes auch nicht offen halten. */
  if (!e.target.closest('.gram-underline:not(.gram-passiv)') && !e.target.closest('#gramPopover'))
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

