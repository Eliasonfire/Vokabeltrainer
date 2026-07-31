/* lernen.js -- Lernkarten, Wischgeste, Antwortlogik (SRS)
   Teil der App-Logik; wird in index.html in fester Reihenfolge geladen und
   teilt sich mit den uebrigen js/-Dateien den globalen Namensraum. */
/* ===================== LEARN / FLASHCARDS ===================== */
let SESSION = { words:[], idx:0, dirs:[], fertig:true };

function startLearningSession(){
  let words = currentPool();
  if (words.length === 0){ toast(SETTINGS.wrongOnly ? 'Keine schwachen Wörter mit dieser Auswahl – stark!' : 'Nichts fällig – schau später wieder vorbei.'); showScreen('home'); return; }
  const size = SETTINGS.sessionSize;
  if (size < words.length) words = words.slice(0, size);
  SESSION = { words, idx:0, dirs:[], fertig:false };
  showScreen('learn');
}

/* Zieht eine LAUFENDE Runde nach, wenn sich Buch oder Kapitelauswahl geaendert
   haben. Ohne das lernte Elias weiter Wörter aus Kapiteln, die er gerade
   abgewählt hatte (im Browser nachgestellt am 30.07.2026: Kapitel 13, 16, 18
   und 24 blieben in der Runde stehen).

   Bewusst NICHT die ganze Runde neu bauen: die schon beantworteten Karten
   sollen beantwortet bleiben. Es werden nur die Wörter entfernt, die nicht mehr
   zur Auswahl passen, und der Zeiger wird mitgezogen, damit er auf derselben
   Karte stehen bleibt wie vorher. Bleibt nichts übrig, ist die Runde vorbei. */
function passeRundeAnAuswahlAn(){
  if (!SESSION.words.length || SESSION.fertig) return false;
  const bisher = SESSION.words;
  const aktuellesWort = bisher[SESSION.idx];
  const bleibt = bisher.filter(passtZurAuswahl);
  if (bleibt.length === bisher.length) return false;      // nichts zu tun

  const entfernt = bisher.length - bleibt.length;
  if (!bleibt.length){
    SESSION = { words:[], idx:0, dirs:[], fertig:true };
    showScreen('home', { ersetzen:true });
    toast('Diese Auswahl enthält keine fälligen Wörter mehr — Runde beendet.');
    return true;
  }
  /* Der Zeiger muss mitwandern: stand er auf Karte 12 und fallen davor drei
     Karten weg, ist dieselbe Karte jetzt Nummer 9. Sonst springt die Runde. */
  let neuerIdx = bleibt.indexOf(aktuellesWort);
  if (neuerIdx < 0) neuerIdx = Math.min(SESSION.idx, bleibt.length - 1);
  SESSION = { words: bleibt, idx: neuerIdx, dirs: [], fertig: false };
  renderCard();
  toast(`${entfernt} Wort${entfernt===1?'':'e'} aus abgewählten Kapiteln entfernt.`);
  return true;
}

function cardDirection(idx){
  if (SETTINGS.direction === 'mixed'){
    if (SESSION.dirs[idx] === undefined) SESSION.dirs[idx] = Math.random()<0.5 ? 'ar-de' : 'de-ar';
    return SESSION.dirs[idx];
  }
  return SETTINGS.direction || 'ar-de';
}

function renderCard(){
  const w = SESSION.words[SESSION.idx];
  const card = document.getElementById('flashcard');
  const inner = document.getElementById('flashcardInner');

  /* Karte ohne Animation auf die Vorderseite zuruecksetzen. Wuerde man die
     'flipped'-Klasse einfach entfernen, drehte die Karte sichtbar zurueck - und
     weil der neue Inhalt zu dem Zeitpunkt schon gesetzt ist, blitzte dabei die
     Rueckseite der NAECHSTEN Vokabel auf (Spoiler). Reihenfolge ist wichtig:
     erst Uebergaenge abschalten, dann zuruecksetzen, dann per Reflow festschreiben,
     erst danach die Uebergaenge wieder freigeben. */
  card.style.transition = 'none';
  inner.style.transition = 'none';
  card.style.transform = '';
  card.classList.remove('flipped');
  void card.offsetWidth;
  card.style.transition = '';
  inner.style.transition = '';

  /* Offenes Grammatik-Popover schliessen. Es haengt an `position:fixed` am
     Bildschirm, nicht an der Karte - beim Kartenwechsel blieb es deshalb
     stehen und verdeckte die naechste Karte. Elias' Meldung vom 30.07.2026:
     "wenn die Karte umgedreht ist und man auf den Satzbauhinweis drueckt und
     die Karte weg wischt, dann bleibt der Satzbau-Hinweis bestehen ... ich
     sehe schon die naechste Karte doch sie wird teilweise von dem Hinweis
     verdeckt."
     Hier statt im Wisch-Code, weil `renderCard` ALLE Wege abdeckt: Wischen,
     die vier Antwortknoepfe und den Rundenstart. */
  const pop = document.getElementById('gramPopover');
  if (pop) pop.classList.remove('show');

  document.getElementById('cardChapter').textContent = w.chapter==='personal' ? 'Eigene Vokabel' : `Kap. ${w.chapter}`;

  const dir = cardDirection(SESSION.idx);
  const frontEl = document.getElementById('cardArabic');
  const backEl = document.getElementById('cardGerman');
  /* lang/dir IMMER auf beiden Seiten explizit setzen. Frueher wurde beim Wechsel
     zurueck auf ar-de nur `dir` entfernt - `lang="ar"` blieb am deutschen Text
     haengen, was Schriftwahl und Sprachausgabe des Browsers verfaelscht hat. */
  if (dir === 'de-ar'){
    frontEl.textContent = w.de;
    frontEl.classList.add('front-as-german');
    frontEl.setAttribute('dir','ltr'); frontEl.setAttribute('lang','de');
    backEl.textContent = w.ar;
    backEl.classList.add('back-as-arabic');
    backEl.setAttribute('dir','rtl'); backEl.setAttribute('lang','ar');
  } else {
    frontEl.textContent = w.ar;
    frontEl.classList.remove('front-as-german');
    frontEl.setAttribute('dir','rtl'); frontEl.setAttribute('lang','ar');
    backEl.textContent = w.de;
    backEl.classList.remove('back-as-arabic');
    backEl.setAttribute('dir','ltr'); backEl.setAttribute('lang','de');
  }

  /* Geschlecht auf der Rueckseite (arabicroots-Paritaet D). Nur wo es etwas
     aussagt: Partikeln wie فِي oder هَلْ haben keins, dort steht in den Daten
     `null` - und ein leerer Platzhalter waere schlechter als gar keiner. */
  const genusEl = document.getElementById('cardGender');
  const GENUS = {
    masculine: { ar: 'مُذَكَّر', de: 'männlich', farbe: 'var(--gram-mubtada)' },
    feminine:  { ar: 'مُؤَنَّث', de: 'weiblich',  farbe: 'var(--gram-fem)' }
  };
  const genus = GENUS[w.gender];
  if (genus){
    genusEl.innerHTML = `<span class="ar" lang="ar" dir="rtl">${genus.ar}</span><span class="de">${genus.de}</span>`;
    genusEl.style.setProperty('--gender-role', genus.farbe);
    genusEl.classList.remove('hidden');
  } else {
    genusEl.classList.add('hidden');
  }

  // Plural-/Femininum-Formen nur zeigen, wenn in den Einstellungen aktiviert.
  // Label und arabische Form getrennt ausgeben: das Label bleibt klein und
  // lateinisch, die Form selbst wird gross und arabisch gesetzt.
  let forms = [];
  if (SETTINGS.showPlural){
    /* formenAnzeige vereinheitlicht das Trennzeichen: der naechste
       arabicroots-Abzug bringt "|" mit, angezeigt wird immer " / ". */
    if (w.pl) forms.push({label:'Plural', value:formenAnzeige(w.pl)});
    if (w.femSg) forms.push({label:'Fem.', value:formenAnzeige(w.femSg)});
    if (w.femPl) forms.push({label:'Fem. Pl.', value:formenAnzeige(w.femPl)});
  }
  document.getElementById('cardForms').innerHTML = forms.map(f=>
    `<span><i class="lbl">${escapeHtml(f.label)}</i>${escapeHtml(f.value)}</span>`
  ).join('');

  renderVerbFormen(w);

  /* Beispielsatz mit denselben farbigen Grammatik-Unterstreichungen wie im
     Satz-Modus (js/saetze.js). 284 der 316 Markierungen haengen an
     Vokabelsaetzen - ohne das blieb die Farbe ausgerechnet dort aus, wo Elias
     die meiste Zeit verbringt.
     `ohneLuecke`, weil LUECKE zum Satz-Bildschirm gehoert: sonst verschwaende
     eine dort offene Luecke ein Wort auch auf der Karte.
     `passiv`, weil ein Klick auf der Karte die Karte umdreht - siehe CSS zu
     `.gram-passiv`. Deshalb innerHTML statt textContent; buildSentenceHtml
     maskiert den Text selbst mit escapeHtml (js/kern.js). */
  const sentBox = document.getElementById('cardSentenceBox');
  if (w.sentAr){
    sentBox.classList.remove('hidden');
    document.getElementById('cardSentenceAr').innerHTML =
      buildSentenceHtml(w, { ohneLuecke:true });
    document.getElementById('cardSentenceDe').textContent = w.sentDe || '';
  } else sentBox.classList.add('hidden');

  const qBox = document.getElementById('cardQuranBox');
  if (w.quran && SETTINGS.showQuran){
    qBox.classList.remove('hidden');
    document.getElementById('cardQuranAr').innerHTML = quranMitTreffer(w.quran.ar, w);
    document.getElementById('cardQuranRef').textContent = `${w.quran.surah} ${w.quran.ayah}`;
    document.getElementById('cardQuranNote').textContent = w.quran.de || w.quran.note || '';
  } else qBox.classList.add('hidden');

  renderNotiz(w);

  document.getElementById('learnCount').textContent = `${SESSION.idx+1}/${SESSION.words.length}`;
  document.getElementById('learnProgressFill').style.width = `${(SESSION.idx/SESSION.words.length)*100}%`;

  renderQuranFreqBadge(w);
  stufenVorschau();
  renderTippfeld(w);
}

/* ---------- Verbformen (Elias' Wunsch vom 29.07.2026) ----------
   "Was ich brauche ist (für Verben) die (Zeit)formen (Vergangenheit,
    Gegenwart, Befehlsform, Verbalsubstantiv (laut arabicroots))"

   Die vier Formen liegen im arabicroots-Abzug an jedem Verb als
   past / present / imperative / masdar. Sie werden hier NUR angezeigt, nie
   gebildet: eine selbst konjugierte Form waere erfundene Grammatik (E.1).
   Fehlt eine Form im Abzug, bleibt ihr Platz weg statt geraten zu werden.

   Die Beschriftungen sind woertlich Elias' eigene aus der Meldung.

   Die ausgelieferte vocab-data.js (Madina 1, Kapitel 1-9) enthaelt kein
   einziges Verb - der Kasten bleibt dort also immer verborgen. Sichtbar wird
   er mit dem Vokabelpaket: dort stehen 1606 Verben mit allen vier Formen. */
const VERB_FORMEN = [
  { feld:'past',       label:'Vergangenheit' },
  { feld:'present',    label:'Gegenwart' },
  { feld:'imperative', label:'Befehlsform' },
  { feld:'masdar',     label:'Verbalsubstantiv' }
];

function renderVerbFormen(w){
  const kasten = document.getElementById('cardVerbForms');
  /* Abschaltbar wie die Pluralformen. Elias am 30.07.2026: "du solltest da die 4
     zeitformen nicht zeigen. die sollen da raus. am besten machen wir sogar eine
     einstellung bei der ich wie die 'plural einstellung' einstellen kann ob die
     unterschiedlichen 4 dinger auch angezeigt werden sollen bei verben."
     Standard ist AUS (siehe SETTINGS in js/kern.js). */
  if (!SETTINGS.showVerbFormen){ kasten.classList.add('hidden'); return; }
  const vorhanden = VERB_FORMEN.filter(f => w[f.feld]);
  if (!vorhanden.length){ kasten.classList.add('hidden'); return; }
  kasten.innerHTML = vorhanden.map(f =>
    `<div><span class="lbl">${escapeHtml(f.label)}</span>` +
    `<span class="frm" lang="ar" dir="rtl">${escapeHtml(formenAnzeige(w[f.feld]))}</span></div>`
  ).join('');
  kasten.classList.remove('hidden');
}

/* ---------- Das Wort im Koranvers hervorheben ----------
   Elias am 29.07.2026: "Es wäre nützlich, wenn bei den Koranbezügen das Wort
   auf das bezogen wird hervorgehoben wird, indem es zum Beispiel unterstrichen
   wird. Einfach weiß oder so."

   Das Wort steht im Vers fast nie so da wie im Vokabeleintrag: aus بَيْتٌ wird
   الْبَيْتَ, aus كِتَابٌ wird الْكِتَابُ. Verglichen wird deshalb der Wortkern -
   ohne Vokalzeichen, ohne اَلْ und ohne angeschriebene Partikel. Dieselbe Idee
   wie `wortKern` in js/saetze.js.

   Findet sich nichts, wird NICHTS hervorgehoben. Lieber keine Markierung als
   eine falsche - eine hervorgehobene Stelle behauptet "das ist dein Wort", und
   das muss stimmen. Auch die Wurzel wird bewusst NICHT als Rueckfallebene
   benutzt: sie traefe bei بَيْت auch أَبْيَات und bei كِتَاب auch كَتَبَ - dann
   waere etwas anderes markiert als angekuendigt. */
function quranKern(s){
  return String(s || '')
    /* Das Alif des Akkusativ-Tanwins gehoert nicht zum Wort: إِمَامًا ist
       dasselbe Wort wie إِمَامٌ, nur im Akkusativ - geschrieben mit einem
       zusaetzlichen Alif. Ohne diese Zeile blieb الإمام in 2:124 unmarkiert
       (im Browser am 29.07.2026 gemessen: 10 von 13 Versen getroffen, dieser
       war der einzige echte Fehltreffer). Muss VOR dem Entfernen der
       Vokalzeichen stehen, sonst ist das Fathatan schon weg und das Alif nicht
       mehr als Tanwin-Alif erkennbar. */
    .replace(/ًا$/, '')
    /* ⚠️ Drei Sorten Zeichen, die der Uthmani-Korantext traegt und ein
       Vokabeleintrag nie. Am 30.07.2026 an den Codepoints der Verse abgelesen,
       nicht vermutet - vorher blieben genau daran drei Verse unmarkiert:

         U+0653-U+0655  Hamza und Madda als EIGENES Zeichen ueber dem Alif.
                        فَأَيْنَ in 81:26 ist dort nicht ف+أ, sondern ف+ا+U+0654.
                        Ebenso أُذُنٌ in 69:12. Der Alif-Abgleich unten greift
                        deshalb nicht, das Zeichen bleibt stehen.
         U+06D6-U+06ED  Koranische Lesezeichen. رَجُلُۢ in 23:25 endet auf
                        U+06E2, und "رجلۢ" ist nicht "رجل".
         U+200E/U+200F  Richtungsmarken, unsichtbar und zaehlen doch mit.

       Alle drei sind reine Zutat: sie zu entfernen kann nie einen Treffer
       kosten, nur welche hinzufuegen. Als \u-Folgen geschrieben, weil ein
       arabischer Bereich mitten in einer Zeichenklasse sich zu leicht falsch
       liest - beim Bauen der Suche ist genau das passiert und hatte alle
       Buchstaben mitgeloescht. */
    .replace(/[ٓ-ٕۖ-ۭ‎‏]/g, '')
    .replace(/[ً-ْٰـ]/g, '')                 // Taschkil und Tatweel
    .replace(/[.،؟!«»:؛]/g, '')              // Satzzeichen
    .replace(/[ٱآأإ]/g, 'ا')                 // Alif in allen Schreibungen gleich lesen
    .trim();
}

/* Das hochgestellte Alif (U+0670) ist der zweite Uthmani-Sonderfall, und der
   einzige, bei dem "wegwerfen" und "als Alif lesen" BEIDE vorkommen koennen:
   ٱلْكِتَٰبُ meint كِتَاب (langes aa ohne eigenes Alif), aber اللّٰه meint الله.
   Deshalb wird hier nicht entschieden, sondern beides als Lesart angeboten -
   quranKern loescht das Zeichen, diese Fassung ersetzt es. Wer beide Lesarten
   vergleicht, kann nur mehr treffen als vorher, nie weniger. */
function quranKernMitAlif(s){
  return quranKern(String(s || '').replace(/ٰ/g, 'ا'));
}

/* Ein Wort im Vers kann angeschriebene Zeichen vor sich haben, das gesuchte
   Wort selbst hat sie nie. Deshalb werden die Vorsilben AUSSCHLIESSLICH vom
   Vers-Wort abgezogen, und zwar als Auswahl moeglicher Lesarten - nicht als
   eine feste Kette von Ersetzungen.

   Der Unterschied ist nicht theoretisch. Der erste Versuch zog auch dem
   gesuchten Wort ein fuehrendes و/ف/ب/ك/ل ab. Damit wurde aus بَيْتٌ "Haus" der
   Rest يت - das ب wurde fuer die Praeposition bi- gehalten. Im Browser
   nachgemessen am 29.07.2026: quranKern('بَيْتٌ') gab "يت". Getroffen haette
   das dann jedes Wort mit dem Rest "يت".

   Das Wort selbst wird also nur von اَلْ befreit (falls es ueberhaupt bestimmt
   im Abzug steht); alles andere bleibt Buchstabe fuer Buchstabe stehen. */
function quranLesarten(wortImVers){
  const lesarten = [];
  /* Beide Deutungen des hochgestellten Alifs, siehe quranKernMitAlif. Bei einem
     Wort ohne dieses Zeichen sind die zwei Fassungen gleich und die Menge
     bleibt so gross wie vorher. */
  for (const k of new Set([quranKern(wortImVers), quranKernMitAlif(wortImVers)])){
    lesarten.push(k);
    if (k.startsWith('ال')) lesarten.push(k.slice(2));
    if (/^[وفبكل]/.test(k)){
      const ohnePartikel = k.slice(1);
      lesarten.push(ohnePartikel);
      if (ohnePartikel.startsWith('ال')) lesarten.push(ohnePartikel.slice(2));
    }
  }
  return lesarten;
}

function quranMitTreffer(vers, w){
  const text = String(vers || '');
  /* Auch das gesuchte Wort in beiden Lesarten des hochgestellten Alifs - sonst
     waere die Normalisierung einseitig, und einseitig war jeder der bisherigen
     Fehlgriffe. */
  const ziele = [...new Set([quranKern(w.sg || w.ar), quranKernMitAlif(w.sg || w.ar)])]
    .map(z => z.replace(/^ال/, ''))
    .filter(z => z.length >= 2);
  if (!ziele.length) return escapeHtml(text);
  /* Ueber die Wortgrenzen des Verses gehen statt eine Zeichenkette zu suchen:
     so kann die Markierung nie mitten in einem Wort anfangen. */
  let getroffen = false;
  const html = text.split(/(\s+)/).map(stueck => {
    if (!getroffen && /\S/.test(stueck)
        && quranLesarten(stueck).some(l => ziele.includes(l))){
      getroffen = true;
      return `<span class="quran-treffer">${escapeHtml(stueck)}</span>`;
    }
    return escapeHtml(stueck);
  }).join('');
  return getroffen ? html : escapeHtml(text);
}

/* ---------- Ab Box 4 eintippen ----------
   Umdrehen und "wusste ich" denken ist Wiedererkennung. Freier Abruf ist
   deutlich schwerer und naeher an dem, was im Unterricht verlangt wird - aber
   fuer eine frische Vokabel waere er nur frustrierend. Deshalb erst ab Box 4:
   dort sitzt das Wort schon, und die Frage ist, ob es auch ohne Vorlage kommt.

   Bewusst standardmaessig AUS. Arabisch auf einer Handytastatur zu tippen ist
   umstaendlich, und ob Elias eine eingerichtet hat, weiss die App nicht. Der
   Schalter steht in den Einstellungen. */
function renderTippfeld(w){
  const kasten = document.getElementById('cardTippBox');
  const p = PROGRESS[w.id];
  const dran = SETTINGS.tippenAbBox4 && p && p.box >= 4 && cardDirection(SESSION.idx) === 'de-ar';
  if (!dran){ kasten.classList.add('hidden'); return; }
  document.getElementById('cardTippEingabe').value = '';
  document.getElementById('cardTippAntwort').textContent = '';
  document.getElementById('cardTippAntwort').className = 'tipp-antwort';
  kasten.classList.remove('hidden');
}

function pruefeTippen(){
  const w = SESSION.words[SESSION.idx];
  const eingabe = document.getElementById('cardTippEingabe').value;
  const feld = document.getElementById('cardTippAntwort');
  if (!eingabe.trim()){ feld.className='tipp-antwort'; feld.textContent=''; return; }
  /* Ohne Vokalzeichen vergleichen - getippt wird auf dem Handy, und die
     Taschkil ist hier nicht der Punkt. Die richtige Schreibweise steht auf
     der Rueckseite vollstaendig da. */
  const roh = s => String(s||'').replace(/[ً-ْٰـ]/g,'').replace(/[.،؟!«»:؛]/g,'').trim();
  const richtig = roh(eingabe) === roh(w.ar) || roh(eingabe) === roh(w.sg || '');
  feld.className = 'tipp-antwort ' + (richtig ? 'richtig' : 'falsch');
  feld.textContent = richtig ? 'Richtig — umdrehen und einordnen.' : 'Noch nicht.';
}

document.getElementById('cardTippEingabe').addEventListener('click', (e)=>e.stopPropagation());
document.getElementById('cardTippEingabe').addEventListener('keydown', (e)=>{
  e.stopPropagation();
  if (e.key === 'Enter'){ e.preventDefault(); pruefeTippen(); }
});
document.getElementById('cardTippEingabe').addEventListener('pointerdown', (e)=>e.stopPropagation());

/* ---------- Quran-Vorkommen (Wurzel-Häufigkeit, aus dem Quranic Arabic Corpus) ---------- */
/* QURAN_FREQ[Wurzel] = [Anzahl, [[Sure, Vers], ...]]. Der Surenname stand
   frueher bei jedem einzelnen Vers ausgeschrieben in der Datei; seit die
   Tabelle alle acht Lehrwerke abdeckt (1038 statt 92 Wurzeln) waere das die
   dreifache Dateigroesse fuer dieselbe Information. Er kommt jetzt aus
   surah-data.js. */
function surenName(nr){
  const s = (typeof SURAH_DATA!=='undefined') && SURAH_DATA.find(x=>x.id===nr);
  return s ? (s.name || `Sure ${nr}`) : `Sure ${nr}`;
}

function renderQuranFreqBadge(w){
  const badge = document.getElementById('cardQuranFreq');
  const root = w.root && (typeof QURAN_FREQ!=='undefined') ? w.root.replace(/\s+/g,'') : null;
  const freq = root && QURAN_FREQ[root];
  if (!freq){ badge.classList.add('hidden'); return; }
  badge.innerHTML = `${icon('crescent')}<span>${freq[0]}× im Quran</span>`;
  badge.classList.remove('hidden');
  badge.onclick = (e)=>{ e.stopPropagation(); openQuranFreqPopover(w, freq); };
}

function openQuranFreqPopover(w, freq){
  const [anzahl, verse] = freq;
  const shown = verse.slice(0, 10);
  /* Zwei verschiedene Zahlen, und der Unterschied ist lehrreich: die Wurzel
     ب ي ت steht 73-mal im Quran, das Wort بَيْت selbst deutlich seltener - der
     Rest sind Haeuser, Verse und andere Ableitungen derselben Wurzel. Die
     Wortzahl gibt es nur, wo das Schriftbild im Korpus eindeutig ist; bei
     كتب (Buch und schrieb) steht bewusst nichts. */
  const wortZahl = (typeof QURAN_WORT !== 'undefined') && QURAN_WORT[w.sg || w.ar];
  const zusatz = wortZahl ? `<div class="qfp-wortzahl">Das Wort selbst: ${wortZahl}×</div>` : '';
  document.getElementById('qfpTitle').innerHTML = `${icon('crescent')} <span lang="ar" dir="rtl">${escapeHtml(w.ar)}</span> im Quran (${anzahl}×)${zusatz}`;
  document.getElementById('qfpList').innerHTML = shown.map(([sura, ayah])=>`
    <div class="qfp-item" data-vers="${sura}:${ayah}" role="button" tabindex="0">
      <span class="qfp-pfeil">${icon('right')}</span>
      <span class="qfp-ref">${sura}:${ayah}</span> — ${escapeHtml(surenName(sura))}
    </div>
  `).join('') + (anzahl > shown.length ? `<div class="qfp-note">Erste ${shown.length} von ${anzahl} Fundstellen</div>` : '');
  document.getElementById('qfpBackdrop').classList.remove('hidden');
  document.getElementById('quranFreqPopover').classList.remove('hidden');
}
function closeQuranFreqPopover(){
  document.getElementById('qfpBackdrop').classList.add('hidden');
  document.getElementById('quranFreqPopover').classList.add('hidden');
}
/* Von der Fundstelle direkt in den Quran-Leser. Vorher war die Liste eine
   Sackgasse: man sah, dass das Wort in 2:125 vorkommt, musste den Vers aber
   selbst heraussuchen - genau das verlangt Goal-Prompt C.3 anders. */
document.getElementById('qfpList').addEventListener('click', (e)=>{
  const zeile = e.target.closest('[data-vers]');
  if (zeile) oeffneVersImLeser(zeile.dataset.vers);
});
document.getElementById('qfpList').addEventListener('keydown', (e)=>{
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const zeile = e.target.closest('[data-vers]');
  if (zeile){ e.preventDefault(); oeffneVersImLeser(zeile.dataset.vers); }
});

async function oeffneVersImLeser(schluessel){
  const [sura, ayah] = schluessel.split(':').map(Number);
  closeQuranFreqPopover();
  showScreen('quranfull');
  await openSurah(sura);
  /* Der Leser baut die Verse erst nach dem Laden des Korantexts auf; vorher
     gibt es das Element noch nicht. */
  const finden = () => document.querySelector(`#verseList .verse-item:nth-of-type(${ayah})`);
  for (let versuch = 0; versuch < 40 && !finden(); versuch++) await new Promise(r=>setTimeout(r, 50));
  const el = finden();
  if (!el){ toast(`${sura}:${ayah} liess sich nicht anspringen.`); return; }
  /* Bewusst ohne weiches Scrollen: bis Vers 125 von Al-Baqarah sind es ueber
     30.000 Pixel. So eine Fahrt bricht der Browser ab, und selbst wenn nicht,
     dauerte sie ewig. Der kurze Leuchteffekt uebernimmt die Orientierung.

     Gescrollt wird nicht das Fenster: der Rumpf steht auf `overflow:hidden`,
     die Bildschirme rollen in #main. scrollIntoView beruecksichtigt das von
     selbst; der Nachsatz darunter ist die Rueckfallebene, falls die Fahrt
     nicht angekommen ist. */
  el.scrollIntoView({ block:'center', behavior:'auto' });
  const kasten = el.closest('#main') || document.scrollingElement;
  if (kasten && kasten.scrollTop === 0 && el.offsetTop > kasten.clientHeight){
    kasten.scrollTop = Math.max(0, el.offsetTop - kasten.clientHeight / 2 + el.offsetHeight / 2);
  }
  el.classList.remove('angesteuert');
  void el.offsetWidth;                       // Animation neu starten
  el.classList.add('angesteuert');
}

document.getElementById('qfpBackdrop').addEventListener('click', closeQuranFreqPopover);
document.getElementById('btnCloseQuranFreq').addEventListener('click', closeQuranFreqPopover);

/* ---------- Eigene Eselsbruecke pro Vokabel (arabicroots-Paritaet D) ---------- */
function renderNotiz(w){
  const kasten = document.getElementById('cardNoteBox');
  const text   = document.getElementById('cardNoteText');
  const punkt  = document.getElementById('cardNoteDot');
  const notiz  = getNote(w.id);
  text.textContent = notiz || 'Eselsbrücke hinzufügen';
  kasten.classList.toggle('hat-notiz', !!notiz);
  /* Der Punkt sitzt auf der VORDERSEITE. Er verraet die Loesung nicht, sagt
     aber "zu diesem Wort hast du dir schon etwas notiert" - genau der Hinweis,
     den man beim Ueberlegen brauchen kann. */
  punkt.classList.toggle('hidden', !notiz);
}

function oeffneNotizEditor(){
  const w = SESSION.words[SESSION.idx];
  if (!w) return;
  document.getElementById('neWort').textContent = w.ar;
  const feld = document.getElementById('neText');
  feld.value = getNote(w.id);
  document.getElementById('btnDeleteNote').style.visibility = getNote(w.id) ? 'visible' : 'hidden';
  document.getElementById('noteBackdrop').classList.remove('hidden');
  document.getElementById('noteEditor').classList.remove('hidden');
  feld.focus();
}
function schliesseNotizEditor(){
  document.getElementById('noteBackdrop').classList.add('hidden');
  document.getElementById('noteEditor').classList.add('hidden');
}
document.getElementById('cardNoteBox').addEventListener('click', (e)=>{
  e.stopPropagation();          // sonst dreht sich die Karte gleich mit um
  oeffneNotizEditor();
});
document.getElementById('btnCloseNote').addEventListener('click', schliesseNotizEditor);
document.getElementById('noteBackdrop').addEventListener('click', schliesseNotizEditor);
document.getElementById('btnSaveNote').addEventListener('click', ()=>{
  const w = SESSION.words[SESSION.idx];
  setNote(w.id, document.getElementById('neText').value);
  renderNotiz(w);
  schliesseNotizEditor();
  toast(getNote(w.id) ? 'Eselsbrücke gespeichert.' : 'Eselsbrücke entfernt.');
});
document.getElementById('btnDeleteNote').addEventListener('click', ()=>{
  const w = SESSION.words[SESSION.idx];
  setNote(w.id, '');
  renderNotiz(w);
  schliesseNotizEditor();
  toast('Eselsbrücke entfernt.');
});

let __suppressCardClick = false;

/* Welche Satzbau-Markierung liegt unter diesem Klick?

   `e.target` allein reicht hier NICHT, und das ist der Kern von Elias' Meldung
   vom 29.07.2026 ("ich kann die Satzbau-Hinweise nicht anklicken, es wird
   einfach nur direkt die Karte wieder umgedreht"). Die Karte ist eine
   3D-Drehung: `.flashcard-inner` steht auf `transform-style:preserve-3d`, die
   Rueckseite auf `rotateY(180deg)`. In dieser Anordnung benennt Chrome als
   Klickziel nicht immer das Element, das man sieht - im Browser nachgemessen
   ergab `document.elementFromPoint` auf der Markierung mal `flashcard-inner`,
   mal die abgewandte Vorderseite.

   Deshalb wird zusaetzlich der ganze Stapel unter dem Zeiger befragt.
   `elementsFromPoint` liefert die Markierung auch dann, wenn `elementFromPoint`
   nur den Behaelter nennt. Das kommt ohne Annahme darueber aus, wie ein
   bestimmter Browser 3D-Ebenen trifft - und genau darum geht es hier. */
function markierungUnterKlick(e){
  const direkt = e.target.closest && e.target.closest('.gram-underline');
  if (direkt) return direkt;
  if (typeof e.clientX !== 'number' || !document.elementsFromPoint) return null;
  for (const el of document.elementsFromPoint(e.clientX, e.clientY)){
    const treffer = el.closest && el.closest('.gram-underline');
    if (treffer) return treffer;
  }
  return null;
}

document.getElementById('flashcard').addEventListener('click', (e)=>{
  if (e.target.id === 'btnSpeakWord') return;
  if (e.target.closest('#cardNoteBox')) return;   // hat einen eigenen Klick
  if (e.target.closest('#cardTippBox')) return;   // Tippen dreht die Karte nicht um
  if (__suppressCardClick){ __suppressCardClick = false; return; }
  /* Satzbau-Markierung oeffnet ihre Erklaerung, statt die Karte umzudrehen.
     Die Erklaerung selbst kommt aus js/saetze.js, damit Satz-Modus und
     Lernkarte dieselbe zeigen und nicht zwei Fassungen auseinanderlaufen. */
  const markierung = markierungUnterKlick(e);
  if (markierung){ zeigeGrammatikPopover(markierung); return; }
  document.getElementById('flashcard').classList.toggle('flipped');
});
document.getElementById('btnSpeakWord').addEventListener('click', (e)=>{
  e.stopPropagation();
  speakArabic(SESSION.words[SESSION.idx].ar);
});
/* Das X beendet die Runde bewusst - danach startet "Lernen" wieder eine neue. */
document.getElementById('btnExitLearn').addEventListener('click', ()=>{
  SESSION.fertig = true;
  /* Auch beim vorzeitigen Abbrechen pruefen - wer die letzte schwache Vokabel
     richtig hatte und dann abbricht, soll den Modus nicht angeschaltet
     zuruecklassen. */
  pruefeNurFalscheModus();
  showScreen('home', { ersetzen: true });
});

/* ---------- Swipe-Gesten (rechts=richtig, links=falsch) ---------- */
(function setupSwipe(){
  const card = document.getElementById('flashcard');
  const hintR = document.getElementById('swipeHintRight');
  const hintL = document.getElementById('swipeHintLeft');
  let startX=0, startY=0, dx=0, dragging=false, achse=null, zeiger=null;

  card.addEventListener('pointerdown', (e)=>{
    /* Sobald die Karte angefasst wird, verschwindet eine offene Erklaerung.
       `renderCard` schliesst sie ebenfalls - das hier ist der frueher wirkende
       Weg: das Popover soll schon beim Anfassen weg sein und nicht erst, wenn
       die naechste Karte steht. Ein Wisch ist kein Klick, der globale
       Klick-Handler in js/saetze.js greift also nicht. */
    const pop = document.getElementById('gramPopover');
    if (pop && !e.target.closest('.gram-underline')) pop.classList.remove('show');
    startX=e.clientX; startY=e.clientY; dx=0; dragging=true; achse=null;
    /* Den Zeiger einfangen: sonst landet das pointerup auf dem Element, ueber
       dem der Finger gerade ist, sobald er die Karte verlaesst - und das
       passiert bei 90px Schwelle staendig. endDrag laeuft dann nie, die Karte
       bleibt schraeg stehen und die naechste Beruehrung wirkt wie ein Klick. */
    zeiger = e.pointerId;
    try { card.setPointerCapture(zeiger); } catch(_){}
  });
  card.addEventListener('pointermove', (e)=>{
    if (!dragging) return;
    const dxRoh = e.clientX - startX;
    const dy = e.clientY - startY;
    /* Richtung einmal festlegen und dann dabei bleiben. Vorher wurde dx auch
       bei einer senkrechten Bewegung mitgezaehlt; eine schraege Wischbewegung
       zum Scrollen konnte am Ende ueber der Schwelle landen und eine Vokabel
       ungefragt als richtig oder falsch verbuchen. */
    if (!achse && (Math.abs(dxRoh) > 10 || Math.abs(dy) > 10)){
      achse = Math.abs(dxRoh) > Math.abs(dy) ? 'x' : 'y';
    }
    if (achse !== 'x') return;
    /* Sobald feststeht, dass gewischt wird, dem Browser die Geste wegnehmen.
       Ohne das kann er sie auf der GEDREHTEN Karte noch an sich ziehen: die
       Rueckseite ist ein eigener Rollbereich (`.flashcard-back` steht auf
       overflow-y:auto), und eine leicht schraege Bewegung darauf wird dann als
       Rollen ausgelegt - der Zeiger kommt als pointercancel zurueck, die Karte
       federt zurueck und das Wischen wirkt kaputt. Genau Elias' Meldung vom
       29.07.2026: "wenn die Vokabelkarte umgedreht ist kann ich sie nicht nach
       links oder rechts wischen".
       Auf der Vorderseite aendert die Zeile nichts - dort gibt es nichts zu
       rollen. `pointermove` ist nicht passiv, preventDefault greift also. */
    if (e.cancelable) e.preventDefault();
    dx = dxRoh;
    card.classList.add('swiping');
    card.style.transform = `translateX(${dx}px) rotate(${dx/22}deg)`;
    hintR.classList.toggle('show', dx>40);
    hintL.classList.toggle('show', dx<-40);
  });
  function endDrag(e){
    if (!dragging) return;
    dragging=false;
    if (zeiger !== null){ try { card.releasePointerCapture(zeiger); } catch(_){} zeiger = null; }
    card.classList.remove('swiping');
    hintR.classList.remove('show'); hintL.classList.remove('show');
    const threshold = 90;
    if (Math.abs(dx) > threshold){
      __suppressCardClick = true;
      const goingRight = dx>0;
      card.style.transition = 'transform .22s ease';
      card.style.transform = `translateX(${goingRight?600:-600}px) rotate(${goingRight?25:-25}deg)`;
      setTimeout(()=>{ answer(goingRight); }, 180);
    } else {
      card.style.transform = '';
    }
    dx=0;
  }
  card.addEventListener('pointerup', endDrag);
  card.addEventListener('pointercancel', endDrag);
  /* Zusaetzlich am Fenster, nicht nur an der Karte. setPointerCapture kann
     fehlschlagen (aeltere WebViews, oder der Browser hat den Zeiger schon fuer
     eine eigene Geste beansprucht). Ohne diesen zweiten Weg bliebe die Karte
     dann schraeg stehen, weil das pointerup nie bei ihr ankommt. endDrag
     laeuft durch das dragging-Flag hoechstens einmal. */
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
})();

/* ---------- Vier Stufen statt richtig/falsch ----------
   Ein binaeres Urteil wirft zwei sehr verschiedene Faelle zusammen: "wusste
   ich sofort" und "hab ich mit Mueh und Not zusammengekratzt" landen beide in
   derselben Box. Vier Stufen geben je Wiederholung mehr Information, und das
   Leitner-System kann damit besser einteilen.

   Was jede Stufe mit der Box macht:
     nochmal  zurueck auf 1  - gar nicht gewusst, von vorn
     schwer   eine Box runter (mindestens 1) - gewusst, aber muehsam
     gut      eine Box rauf  - das bisherige "richtig"
     leicht   zwei Boxen rauf - sass sofort, laenger nicht noetig

   Nur "gut" verhaelt sich wie vorher; die Wischgeste bleibt deshalb bei
   nochmal/gut. Fuer die Statistik zaehlen "nochmal" und "schwer" als
   Fehlversuch, "gut" und "leicht" als Treffer - sonst waere die Trefferquote
   der Statistik nicht mehr mit den frueheren Werten vergleichbar. */
const STUFEN = {
  nochmal: { box: () => 1,                       richtig: false, feedback: 'answer-wrong' },
  schwer:  { box: (b) => Math.max(1, b - 1),     richtig: false, feedback: 'answer-wrong' },
  gut:     { box: (b) => Math.min(5, b + 1),     richtig: true,  feedback: 'answer-right' },
  leicht:  { box: (b) => Math.min(5, b + 2),     richtig: true,  feedback: 'answer-right' }
};

/* Was unter den Knoepfen steht: wann die Karte bei dieser Wahl wiederkommt.
   Ohne das waere die Wahl zwischen "gut" und "leicht" reine Bauchsache. */
function stufenVorschau(){
  const w = SESSION.words[SESSION.idx];
  const p = w && PROGRESS[w.id];
  if (!p) return;
  const text = (tage) => tage === 0 ? 'heute' : tage === 1 ? 'morgen' : `in ${tage} Tagen`;
  const ziel = { nochmal:'Nochmal', schwer:'Schwer', gut:'Gut', leicht:'Leicht' };
  Object.keys(STUFEN).forEach(k=>{
    const el = document.getElementById('stufe' + ziel[k]);
    if (el) el.textContent = text(INTERVALS[STUFEN[k].box(p.box)]);
  });
}

function answer(stufe){
  /* Schutz gegen Doppelauslösung: waehrend das Antwort-Feedback laeuft, wird ein
     zweiter Klick/Swipe ignoriert - sonst ueberspringt die Runde eine Karte. */
  if (answer._busy) return;
  /* Die Wischgeste und aeltere Aufrufe geben weiter true/false herein. */
  if (stufe === true) stufe = 'gut';
  if (stufe === false) stufe = 'nochmal';
  const s = STUFEN[stufe] || STUFEN.nochmal;

  const w = SESSION.words[SESSION.idx];
  const p = PROGRESS[w.id];
  const boxVorher = p.box;
  p.box = s.box(p.box);
  if (s.richtig) p.correct = (p.correct||0)+1;
  else           p.wrong   = (p.wrong||0)+1;
  p.nextReview = todayStr(INTERVALS[p.box]);
  saveProgress();
  touchStreak();

  /* ---------- Meilensteine (js/feier.js) ----------
     Erst gespeichert, DANN gefeiert. Ein Effekt darf den Endzustand nie tragen:
     bei unsichtbarer Seite feuert requestAnimationFrame nicht, und dann waere
     der Fortschritt weg. Fehlt js/feier.js ganz, passiert hier gar nichts.

     Die Serie richtiger Antworten haengt an SESSION und nicht am Fortschritt:
     sie meint "fuenf hintereinander in DIESER Runde", nicht "fuenf richtige
     ueberhaupt". */
  if (typeof feiere === 'function'){
    SESSION.serie = s.richtig ? (SESSION.serie || 0) + 1 : 0;
    if (p.box !== boxVorher)
      feiere(p.box > boxVorher ? 'box-auf' : 'box-ab', { von: boxVorher, nach: p.box });
    if (p.box === 5 && boxVorher !== 5) feiere('box-5', { id: w.id, wort: w.ar });
    /* Alle fuenf, nicht nur beim fuenften: eine Serie von zehn soll zweimal
       etwas sagen. Aber bewusst nicht bei jeder Karte - genau das hat Elias
       abgelehnt. */
    if (SESSION.serie >= 5 && SESSION.serie % 5 === 0)
      feiere('fuenf-richtig', { serie: SESSION.serie });
  }

  const card = document.getElementById('flashcard');
  const feedback = s.feedback;

  function weiter(){
    answer._busy = false;
    card.classList.remove('answer-right','answer-wrong');
    if (SESSION.idx < SESSION.words.length-1){
      SESSION.idx++;
      renderCard();
    } else {
      document.getElementById('learnProgressFill').style.width = '100%';
      SESSION.fertig = true;
      /* Erst pruefen, ob der "nur falsche"-Modus jetzt leer ist: dessen
         Meldung ist die wichtigere und soll nicht vom "Runde geschafft"
         ueberschrieben werden. */
      const anderes = pruefeNurFalscheModus();
      /* ⭐ Zwei verschiedene Anlaesse, und der Unterschied ist Absicht (Elias am
         30.07.): RUNDE FERTIG sind die 20 Karten einer Sitzung, ALLES FAELLIG
         ist das Tagesziel. Bei 148 faelligen Karten sind das sieben Runden -
         das Tagesziel ist der seltenere und deshalb groessere Anlass. Waeren
         beide gleich, wuerde der grosse entwertet.
         Gemessen wird das Tagesziel an currentPool(): ist der Vorrat nach dieser
         Runde leer, ist fuer heute nichts mehr faellig. */
      const restVorrat = (typeof currentPool === 'function') ? currentPool().length : 0;
      if (typeof feiere === 'function'){
        feiere('runde-fertig', { karten: SESSION.words.length });
        if (!restVorrat) feiere('alles-faellig', { zahl: SESSION.words.length });
      } else if (!anderes) toast('Runde geschafft!');
      /* Beendete Runde ersetzt den Lern-Eintrag in der Historie, statt einen
         neuen anzulegen - sonst landet die Zurueck-Taste auf einer Runde,
         die es nicht mehr gibt. */
      setTimeout(()=>showScreen('home', { ersetzen: true }), 900);
    }
  }

  if (REDUCED_MOTION){ weiter(); return; }
  /* Kurzes Farbsignal auf der Karte, bevor die naechste kommt: gruener Rahmen
     bei richtig, roter bei falsch. Bewusst kurz gehalten, damit der Lernfluss
     nicht ausgebremst wird. */
  answer._busy = true;
  card.classList.add(feedback);
  setTimeout(weiter, 210);
}
document.getElementById('answerButtons').addEventListener('click', (e)=>{
  const b = e.target.closest('[data-stufe]');
  if (b) answer(b.dataset.stufe);
});

