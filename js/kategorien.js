/* kategorien.js -- Kategorien, Wortliste, Ziehen und Ablegen
   Teil der App-Logik; wird in index.html in fester Reihenfolge geladen und
   teilt sich mit den uebrigen js/-Dateien den globalen Namensraum. */
/* ===================== CATEGORIES ===================== */
document.querySelectorAll('.cat-tab').forEach(tab=>{
  tab.addEventListener('click', ()=>{
    document.querySelectorAll('.cat-tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.cat-pane').forEach(p=>p.classList.add('hidden'));
    document.getElementById('catPane-'+tab.dataset.cattab).classList.remove('hidden');
  });
});

function renderCategories(){
  renderChapterCats();
  renderWortfeldCats();
  renderCustomCats();
}

function renderChapterCats(){
  /* Die Kapitelliste kommt jetzt aus dem aktiven Buch - fest 1-9 stimmte nur
     fuer Madina 1 und auch dort nur fuer die freigeschalteten Kapitel. */
  /* ⭐ „Eigene Vokabeln" und die Fachbegriffe stehen seit dem 18.08.2026 GANZ
     OBEN, mit Stern - vorher hingen sie hinter allen 24 Kapiteln.

     Elias: „in der vokabeltrainer app kann ich anscheinend keine eigenen
     begriffe rein machen. die funktion ging mal aber ich finde sie nirgends."

     ⭐ Nachgemessen: die Funktion war die ganze Zeit da. „Eigene Vokabeln" war
     die **26. von 27 Zeilen**, und das Eingabefeld darin (348 px, fuenf Felder)
     erscheint erst, wenn man die Liste geoeffnet hat. Nicht kaputt, sondern
     unauffindbar - und unauffindbar ist fuer ihn dasselbe wie kaputt.

     Dieselbe Entscheidung wie am 29.07.2026 bei den eigenen Kategorien, die er
     ausdruecklich oben haben wollte: seine eigenen sind ihm wichtiger als die
     automatischen, denn er hat sie ja gerade deshalb angelegt. */
  /* ⭐ Seit dem 20.08.2026 nur noch EIN Eintrag. Elias: „ich finde die
     kategorie ,,fachbegriffe" unnötig … sie sollen alle unter eigene
     vokabeln sein." Die fünfzehn Begriffe tragen jetzt selbst chapter
     'personal' und stehen damit in derselben Liste wie seine eigenen
     Wörter — es gibt keine zweite Kachel mehr. */
  const eigeneOben = ['personal'];
  const chapters = [...eigeneOben, ...kapitelDesBuchs()];
  const html = chapters.map(ch=>{
    const words = buchVokabeln().filter(w=>w.chapter===ch);
    const name = CHAPTER_NAMES[ch] || `Kapitel ${ch}`;
    const eigen = eigeneOben.includes(ch);
    /* Die Unterzeile sagt, was man dort TUN kann. Ohne sie ist „Eigene
       Vokabeln" nur eine Liste, und dass das Eingabefeld dahinter liegt, steht
       nirgends - genau daran ist er gescheitert. */
    const unterzeile = ch === 'personal'
      ? `<div class="list-row-sub">Hier trägst du eigene Wörter ein</div>`
      /* ⚠️ Hier standen erst zwei arabische Begriffe als Beispiel. Im
         Bildschirmfoto zerfiel die Zeile: arabischer Text mitten in einem
         deutschen Satz kehrt die Reihenfolge um, und das Komma dazwischen ist
         richtungsneutral und wandert. Rein deutsch ist hier das Richtige - die
         Begriffe selbst stehen ja eine Zeile weiter in der Liste. */
      : '';
    const label = eigen
      ? `<span class="eigen-stern">★</span><span>${name}</span>`
      : `<span>Kap. ${ch} — ${name}</span>`;
    return `<div class="list-row${eigen ? ' list-row-eigen' : ''}" data-openlist="chapter:${ch}">
      <div class="list-row-haupt">
        <div class="list-row-title">${label}</div>
        ${unterzeile}
      </div>
      <div class="list-row-count">${words.length}</div>
    </div>`;
  }).join('');
  document.getElementById('catPane-chapters').innerHTML = html;
}

/* Wortfelder statt Wurzeln (Elias, 29.07.2026: "3 random arabische Buchstaben
   machen fuer mich als Wortstamm keinen Sinn"). Die Reihenfolge kommt aus
   wortfelder-data.js und ist bewusst NICHT nach Groesse sortiert: dort stehen
   erst die Wortarten, dann die Sachgebiete - eine Sortierung nach Anzahl
   wuerfelte "Verben" und "Farben" beliebig durcheinander.
   "Noch ohne Wortfeld" haengt sich hinten an und wird gedaempft dargestellt. */
function renderWortfeldCats(){
  const felder = wortfelder();
  const reihenfolge = (typeof WORTFELDER !== 'undefined') ? WORTFELDER.map(f=>f.name) : [];
  const namen = reihenfolge.filter(n => felder[n] && felder[n].length);
  if (felder[OHNE_WORTFELD]) namen.push(OHNE_WORTFELD);

  /* Elias' eigene Kategorien stehen GANZ OBEN und mit Stern - er hat am
     29.07.2026 zwischen zwei Moeglichkeiten die hier gewaehlt ("Moeglichkeit
     B"). Warum oben und nicht unten: seine eigenen sind ihm wichtiger als die
     automatischen, denn er hat sie ja gerade deshalb angelegt, weil ihm bei den
     automatischen etwas fehlte.

     Eine eigene Kategorie mit demselben Namen wie ein Wortfeld ("Tiere") ist
     KEIN Fehlerfall - der Stern unterscheidet sie, und die Zeilen zeigen auf
     verschiedene Schluessel (cat: gegen feld:).

     Leere eigene Kategorien werden mitgezeigt, im Unterschied zu leeren
     Wortfeldern: ein leeres Wortfeld ist nur eine Luecke in der Tabelle, eine
     leere eigene Kategorie hat Elias absichtlich angelegt und wartet darauf,
     gefuellt zu werden. Sie zu verstecken saehe aus wie ein Datenverlust. */
  const eigene = (typeof CUSTOM_CATS !== 'undefined' ? CUSTOM_CATS : []).map(cat=>
    `<div class="list-row list-row-eigen" data-openlist="cat:${cat.id}">
      <div class="list-row-title"><span class="eigen-stern">★</span><span>${escapeHtml(cat.name)}</span></div>
      <div class="list-row-count">${cat.wordIds.length}</div>
    </div>`).join('');

  const felderHtml = namen.map(name=>{
    const ids = felder[name];
    const rest = name === OHNE_WORTFELD;
    return `<div class="list-row${rest ? ' list-row-rest' : ''}" data-openlist="feld:${name}">
      <div class="list-row-title"><span>${escapeHtml(name)}</span></div>
      <div class="list-row-count">${ids.length}</div>
    </div>`;
  }).join('');

  /* Sagen, WORAUS die Felder gebaut sind. Ohne diese Zeile ist nicht zu sehen,
     warum unter "Tiere" nur ein Teil der Tiere des Buchs steht - und genau so
     eine unsichtbare Einschraenkung hat Elias heute schon einmal als Fehler
     gemeldet. */
  const umfang = (typeof freigeschalteteBeschriftung === 'function') ? freigeschalteteBeschriftung() : null;
  const kopf = umfang
    ? `<div class="pane-hinweis">Nur Wörter, die du kennst: ${escapeHtml(umfang)} und deine eigenen.</div>`
    : '';

  document.getElementById('catPane-roots').innerHTML = kopf +
    ((eigene || felderHtml)
      ? eigene + felderHtml
      : '<div class="empty-state">Für dieses Buch sind noch keine Wortfelder belegt.</div>');
}

/* Jede Aenderung an den eigenen Kategorien muss BEIDE Ansichten auffrischen:
   die Werkbank im Reiter "Eigene" und die Sternzeilen oben in der
   Wortfelder-Liste (Moeglichkeit B, Elias' Wahl vom 29.07.2026). Ohne das zeigt
   die Wortfelder-Liste eine gerade geloeschte Kategorie weiter an, bis der
   Bildschirm neu aufgebaut wird. Deshalb rufen alle Stellen, die CUSTOM_CATS
   aendern, diese Funktion und nicht mehr renderCustomCats() allein. */
function frischeEigeneAuf(){
  renderCustomCats();
  renderWortfeldCats();
}

function renderCustomCats(){
  const box = document.getElementById('customCatList');
  box.innerHTML = CUSTOM_CATS.map(cat => `
    <div class="custom-cat-box" data-catid="${cat.id}">
      <div class="cat-title"><span data-openlist="cat:${cat.id}">${cat.name} (${cat.wordIds.length})</span><button data-delcat="${cat.id}">${icon('trash')}Löschen</button></div>
      <div class="chips-wrap" data-dropzone="${cat.id}">
        ${cat.wordIds.map(id=>{ const w=byId(id); if(!w) return ''; return `<span class="word-chip" draggable-id="${id}">${w.ar}<span class="weak-de">(${w.de})</span></span>`; }).join('')}
      </div>
    </div>
  `).join('');

  /* ---------- Zwei Listen: offen und schon einsortiert ----------
     Elias' Entwurf vom 29.07.2026, in seinen Worten:

       "Die beste Lösung wäre, wenn man diese Vokabelliste in bereits
        einkategorisierte und nicht einkategorisierte Vokabeln unterteilt und
        jedes Wort aber in der Vokabelliste permanent lässt. … Mein Gedanke
        dahinter ist, dass ich dann nicht die ganze Zeit die Vokabeln suchen
        muss, die ich noch nicht einkategorisiert habe."

     Der springende Punkt ist das PERMANENT. Vorher verschwand ein Wort aus der
     Liste, sobald es irgendwo lag — damit war es unmöglich, „Lehrer" sowohl
     unter Schule als auch unter Berufe zu legen, obwohl beides stimmt.

     Beide Listen werden BERECHNET, nicht gespeichert. Das erledigt nebenbei
     Elias' letzte Bedingung von selbst: liegt ein Wort in drei Kategorien und
     man löscht sie alle, taucht es genau EINMAL wieder oben auf — eine
     Mengenberechnung kann gar keine Dubletten erzeugen. */
  const zugeordnet = new Map();          // Vokabel-ID -> Anzahl Kategorien
  CUSTOM_CATS.forEach(c => c.wordIds.forEach(id =>
    zugeordnet.set(id, (zugeordnet.get(id) || 0) + 1)));

  /* Nur die Woerter, die Elias kennt - seine Vorgabe vom 30.07.2026: "auch bei
     den eigenen kategorien sollen nur woerter sein die ich auch kenne."
     Vorher standen hier alle 24 Kapitel des geladenen Buchs, also rund 300
     Woerter, davon die meisten aus Kapiteln, die er im Kurs noch nicht hatte -
     und das war zugleich der Grund, warum die Liste so lang war, dass er sie
     kaum durchwischen konnte.

     ⚠️ Die schon ZUGEORDNETEN Chips in den Kategorien oben werden NICHT
     beschnitten. Was er selbst einsortiert hat, bleibt stehen, auch wenn es aus
     einem spaeteren Kapitel kommt - stillschweigend etwas aus seinen eigenen
     Kategorien zu entfernen waere Datenverlust. */
  const alle   = (typeof bekannteVokabeln === 'function') ? bekannteVokabeln() : buchVokabeln();
  const offen  = alle.filter(w => !zugeordnet.has(w.id));
  const fertig = alle.filter(w =>  zugeordnet.has(w.id));

  const chip = (w, n) => `<span class="word-chip" draggable-id="${w.id}">${w.ar}` +
    `<span class="weak-de">(${w.de})</span>` +
    (n ? `<span class="in-kat" title="in ${n} Kategorie${n>1?'n':''}">${n}×</span>` : '') +
    `</span>`;

  document.getElementById('poolWords').innerHTML =
    offen.map(w => chip(w, 0)).join('') ||
    '<div class="empty-state">Alles einsortiert.</div>';
  document.getElementById('poolWordsFertig').innerHTML =
    fertig.map(w => chip(w, zugeordnet.get(w.id))).join('');
  document.getElementById('poolOffenZahl').textContent  = `(${offen.length})`;
  document.getElementById('poolFertigZahl').textContent = `(${fertig.length})`;
  const hinweis = document.getElementById('poolHinweis');
  if (hinweis){
    const umfang = (typeof freigeschalteteBeschriftung === 'function') ? freigeschalteteBeschriftung() : null;
    hinweis.textContent = umfang
      ? `Nur Wörter, die du kennst: ${umfang} und deine eigenen.` : '';
    hinweis.classList.toggle('hidden', !umfang);
  }

  document.querySelectorAll('[data-delcat]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      CUSTOM_CATS = CUSTOM_CATS.filter(c=>c.id!==btn.dataset.delcat);
      saveCustomCats(); frischeEigeneAuf();
    });
  });
  /* Die Markierung ueberlebt den Neuaufbau der Listen. */
  if (typeof zeichneKatAuswahl === "function") zeichneKatAuswahl();
}

document.getElementById('btnAddCat').addEventListener('click', ()=>{
  const input = document.getElementById('newCatName');
  const name = input.value.trim();
  if (!name) return;
  CUSTOM_CATS.push({ id: 'cat_'+Date.now(), name, wordIds: [] });
  saveCustomCats();
  input.value = '';
  frischeEigeneAuf();
});

document.querySelectorAll('[data-openlist]').forEach(()=>{}); // delegated below
document.getElementById('main').addEventListener('click', (e)=>{
  const row = e.target.closest('[data-openlist]');
  if (row) openWordList(row.dataset.openlist);
});

function openWordList(key){
  let words, title;
  if (key.startsWith('chapter:')){
    const ch = key.split(':')[1];
    const chNum = (ch==='personal') ? ch : Number(ch);
    words = buchVokabeln().filter(w=>w.chapter===chNum);
    /* CHAPTER_NAMES benennt nur die neun Kapitel aus Madina 1, zu denen eine
       belegte Grammatikregel vorliegt. Fuer alle uebrigen bleibt die Nummer -
       einen Namen zu erfinden verbietet E.1. */
    const kapName = CHAPTER_NAMES[chNum];
    title = (ch==='personal')
      ? (kapName || ch)
      : (kapName ? `Kapitel ${ch} — ${kapName}` : `Kapitel ${ch}`);
  } else if (key.startsWith('feld:')){
    /* Nicht an ':' zerlegen und das zweite Stueck nehmen - Feldnamen duerfen
       ein '&' und theoretisch auch weitere Zeichen enthalten ("Familie &
       Menschen"). Nur das Praefix abschneiden. */
    const name = key.slice('feld:'.length);
    const ids = new Set(wortfelder()[name] || []);
    words = buchVokabeln().filter(w=>ids.has(w.id));
    title = name;
  } else if (key.startsWith('cat:')){
    const cat = CUSTOM_CATS.find(c=>c.id===key.split(':')[1]);
    words = cat ? cat.wordIds.map(byId).filter(Boolean) : [];
    title = cat ? cat.name : 'Kategorie';
  } else if (key.startsWith('box:')){
    const boxNum = Number(key.split(':')[1]);
    words = buchVokabeln().filter(w=>PROGRESS[w.id] && PROGRESS[w.id].box===boxNum);
    /* Das Intervall gehört in die Überschrift (18.08.2026, Elias' Wunsch nach
       Transparenz). Aus INTERVALS gelesen, nicht hier noch einmal getippt. */
    const t = INTERVALS[boxNum];
    title = `Box ${boxNum} — ${t === 0 ? 'heute fällig' : t === 1 ? 'nach 1 Tag' : `nach ${t} Tagen`}`;
  } else if (key==='quran'){
    words = buchVokabeln().filter(w=>w.quran);
    title = 'Vokabeln im Quran';
  } else { words=[]; title=''; }

  AKTUELLE_LISTE = key;
  BOX_AUSWAHL = new Set();
  document.getElementById('wordlistTitle').textContent = title;
  /* escapeHtml auch hier. Bis zum 04.08.2026 stand `${w.ar}` unmaskiert im
     innerHTML. Bei den Buchvokabeln faellt das nicht auf, aber eigene Vokabeln
     tippt Elias selbst ein - ein '<' darin haette die Liste zerlegt. Im
     Quran-Teil war derselbe Fehler am 30.07. schon behoben, hier nicht. */
  /* ⚠️ Seit dem 18.08.2026 hat das Auswaehlen ein EIGENES Kaestchen. Vorher war
     die ganze Zeile der Schalter; jetzt oeffnet ein Tipp auf die Zeile die
     Wortkarte, und beides braucht getrennte Flaechen. Bewusst zwei feste
     Bedeutungen statt eines Auswahl-Modus: „mal dies, mal das, je nachdem ob
     schon etwas markiert ist" waere an derselben Stelle unvorhersehbar. */
  document.getElementById('wordList').innerHTML = words.map(w=>`
    <div class="word-list-item waehlbar" data-wordid="${escapeHtml(String(w.id))}">
      <button class="wl-wahl" data-wahl aria-label="Zum Verlegen auswählen">
        <span class="kasten"><svg class="ic"><use href="#ic-check"/></svg></span>
      </button>
      <div class="wl-text"><div class="wl-ar">${escapeHtml(w.ar)}</div><div class="wl-de">${escapeHtml(w.de)}</div></div>
      <span class="wl-box">Box ${PROGRESS[w.id]?PROGRESS[w.id].box:1}</span>
    </div>
  `).join('') || '<div class="empty-state">Keine Wörter in dieser Kategorie.</div>';
  document.getElementById('personalVocabAddForm').style.display = key==='chapter:personal' ? 'flex' : 'none';
  zeichneBoxAuswahl();
  showScreen('wordlist');
}

/* ---------- Woerter in eine andere Leitner-Box verlegen ----------

   Elias' Wunsch vom 04.08.2026: "Ich will Woerter aus den Boxen selbstaendig in
   andere Boxen verlegen koennen."

   Dieselbe Geste wie beim Einsortieren in eigene Kategorien: antippen,
   markieren, unten das Ziel antippen. Bewusst KEIN Ziehen und Ablegen - die
   ausfuehrliche Begruendung steht weiter unten bei KAT_AUSWAHL und gilt hier
   unveraendert, denn die Wortliste rollt genauso.

   ⚠️ Warum nextReview mitgesetzt werden MUSS: Die Box allein bestimmt nicht,
   wann eine Karte wieder drankommt - das tut nextReview (siehe dueWords() in
   kern.js). Ohne die zweite Zeile laege ein Wort in Box 5 und waere trotzdem
   morgen wieder faellig; der Umzug waere dann nur ein anderes Etikett.
   INTERVALS[1] ist 0, ein Wort zurueck in Box 1 ist also sofort wieder dran -
   genau so ist "ich kann das doch nicht" gemeint. */
let BOX_AUSWAHL = new Set();
let AKTUELLE_LISTE = '';

function boxAuswahlLeer(){
  BOX_AUSWAHL = new Set();
  zeichneBoxAuswahl();
}

function zeichneBoxAuswahl(){
  document.querySelectorAll('#wordList .word-list-item').forEach(zeile =>
    zeile.classList.toggle('gewaehlt', BOX_AUSWAHL.has(zeile.dataset.wordid)));

  const leiste = document.getElementById('boxZielLeiste');
  if (!leiste) return;
  const n = BOX_AUSWAHL.size;
  leiste.classList.toggle('hidden', n === 0);
  /* Platz unter der Liste schaffen, solange die Leiste steht - sie liegt fest
     ueber der Navigation und verdeckt sonst genau die Zeilen, die man gerade
     markiert hat. */
  const bildschirm = document.getElementById('screen-wordlist');
  if (bildschirm) bildschirm.classList.toggle('leiste-offen', n > 0);
  if (!n) return;

  document.getElementById('boxAuswahlZahl').textContent =
    n === 1 ? '1 Wort ausgewählt' : `${n} Wörter ausgewählt`;

  /* Die Faelligkeit steht mit am Knopf. Ohne sie ist "Box 4" eine blosse
     Nummer - mit "in 7 Tagen" sagt der Knopf, was er bewirkt. */
  const tage = t => t === 0 ? 'sofort' : t === 1 ? 'morgen' : `in ${t} Tagen`;
  document.getElementById('boxZiele').innerHTML =
    [1,2,3,4,5].map(b =>
      `<button class="kat-ziel" data-boxziel="${b}">Box ${b}<span class="box-ziel-tage"> · ${tage(INTERVALS[b])}</span></button>`
    ).join('');
}

/* Ein Tipp auf das Kaestchen markiert, ein Tipp auf den Rest der Zeile oeffnet
   die Wortkarte. */
document.getElementById('wordList').addEventListener('click', (e)=>{
  const zeile = e.target.closest('.word-list-item');
  if (!zeile || !zeile.dataset.wordid) return;
  const id = zeile.dataset.wordid;
  if (e.target.closest('[data-wahl]')){
    if (BOX_AUSWAHL.has(id)) BOX_AUSWAHL.delete(id); else BOX_AUSWAHL.add(id);
    zeichneBoxAuswahl();
    return;
  }
  zeigeWortKarte(id);
});

document.getElementById('boxZiele').addEventListener('click', (e)=>{
  const knopf = e.target.closest('[data-boxziel]');
  if (!knopf || !BOX_AUSWAHL.size) return;
  const ziel = Number(knopf.dataset.boxziel);
  let bewegt = 0, schonDrin = 0;

  BOX_AUSWAHL.forEach(id => {
    /* Ein Wort ohne Fortschrittseintrag gibt es (die Liste zeigt dann "Box 1"
       als Anzeige). Beim Verlegen wird der Eintrag angelegt, sonst ginge der
       Umzug ins Leere. */
    if (!PROGRESS[id]) PROGRESS[id] = { box:1, nextReview: todayStr(0), correct:0, wrong:0 };
    if (PROGRESS[id].box === ziel){ schonDrin++; return; }
    PROGRESS[id].box = ziel;
    PROGRESS[id].nextReview = todayStr(INTERVALS[ziel]);
    /* Auch ein Verschieben von Hand ist eine Aenderung am Wort und braucht
       einen Stempel - sonst gewinnt beim Abgleich die aeltere Fassung des
       anderen Geraets. Siehe js/sync.js. */
    PROGRESS[id].ts = Date.now();
    bewegt++;
  });
  saveProgress();

  /* Die Liste NICHT neu aufbauen - das setzt die Rollposition auf den Anfang
     zurueck, und dann sucht man nach jedem Umzug die Stelle wieder. Stattdessen
     nur die Etiketten nachziehen. Einzige Ausnahme: In einer Box-Liste gehoert
     ein verlegtes Wort nicht mehr dazu, dort verschwindet die Zeile. */
  const istBoxListe = AKTUELLE_LISTE.startsWith('box:');
  BOX_AUSWAHL.forEach(id => {
    const zeile = document.querySelector(`#wordList .word-list-item[data-wordid="${CSS.escape(id)}"]`);
    if (!zeile) return;
    if (istBoxListe && Number(AKTUELLE_LISTE.split(':')[1]) !== ziel){ zeile.remove(); return; }
    const etikett = zeile.querySelector('.wl-box');
    if (etikett) etikett.textContent = `Box ${ziel}`;
  });

  boxAuswahlLeer();
  const teile = [];
  if (bewegt)    teile.push(`${bewegt} Wort${bewegt===1?'':'e'} → Box ${ziel}`);
  if (schonDrin) teile.push(`${schonDrin} lag${schonDrin===1?'':'en'} dort schon`);
  toast(teile.join(' · '));
  /* Die Startseite zeigt die Boxstaende - sonst stimmen sie nach einem Umzug
     nicht mehr mit dem ueberein, was die Wortliste gerade gezeigt hat. */
  if (typeof renderHome === 'function') renderHome();
});

document.getElementById('btnBoxAuswahlAus').addEventListener('click', boxAuswahlLeer);
document.getElementById('btnWordlistBack').addEventListener('click', geheZurueck);
document.getElementById('btnAddPersonalVocab').addEventListener('click', ()=>{
  const ar = document.getElementById('pvAr').value.trim();
  const de = document.getElementById('pvDe').value.trim();
  const sentAr = document.getElementById('pvSentAr').value.trim();
  const sentDe = document.getElementById('pvSentDe').value.trim();
  if (!ar || !de){ toast('Bitte Arabisch und Deutsch ausfüllen'); return; }
  addPersonalVocab({ar, de, sentAr, sentDe});
  document.getElementById('pvAr').value = '';
  document.getElementById('pvDe').value = '';
  document.getElementById('pvSentAr').value = '';
  document.getElementById('pvSentDe').value = '';
  toast('Vokabel hinzugefügt');
  openWordList('chapter:personal');
});

/* ---------- Einsortieren durch ANTIPPEN, nicht durch Ziehen ----------

   ⚠️ Hier stand bis zum 30.07.2026 ein Ziehen-und-Ablegen ueber Pointer-Events,
   zuletzt mit 400 ms Halten davor. Elias hat den Fehler DREIMAL gemeldet, das
   letzte Mal nach meinem Gesten-Fix: "bei der kategorie eigene ist der bug immer
   noch vorhanden. ich kann das wort nicht vernuenftig in die kategorie packen."

   Deshalb ist die Geste ganz weg. Der Grund ist nicht ein Fehler im Code, sondern
   die Aufgabe selbst: Die Wortliste ist auf 38vh gedeckelt und muss rollen. Auf
   einer rollenden Flaeche muessen sich Ziehen und Wischen dieselbe Beruehrung
   teilen, und die Entscheidung faellt aus Zeit und Weg - also aus einer Schaetzung,
   was gemeint war. Jede Verbesserung an dieser Schaetzung verschiebt nur, welcher
   der beiden Faelle daneben liegt. Antippen braucht diese Entscheidung nicht.

   So geht es jetzt:
     1. Woerter antippen - sie werden markiert, mehrere gleichzeitig moeglich.
     2. Unten erscheint eine Leiste mit den Kategorien.
     3. Kategorie antippen - alle markierten Woerter landen dort.
   Ein Wort IN einer Kategorie antippen nimmt es wieder heraus.

   Mehrfachauswahl ist kein Beiwerk: Elias sortiert 171 Woerter ein. Einzeln
   waeren das 171 mal zwei Tipper, mit Auswahl deutlich weniger. */

let KAT_AUSWAHL = new Set();

function katAuswahlLeer(){
  KAT_AUSWAHL = new Set();
  zeichneKatAuswahl();
}

/* Markierung an den Chips und die Leiste unten. Bewusst OHNE die Listen neu zu
   bauen: renderCustomCats() wuerde die Rollposition auf den Anfang setzen, und
   dann sucht man nach jedem Tipp die Stelle wieder, an der man war. */
function zeichneKatAuswahl(){
  document.querySelectorAll('#poolWords .word-chip, #poolWordsFertig .word-chip')
    .forEach(chip => chip.classList.toggle('gewaehlt', KAT_AUSWAHL.has(chip.getAttribute('draggable-id'))));

  const leiste = document.getElementById('katZielLeiste');
  if (!leiste) return;
  const n = KAT_AUSWAHL.size;
  leiste.classList.toggle('hidden', n === 0);
  if (!n) return;

  document.getElementById('katAuswahlZahl').textContent =
    n === 1 ? '1 Wort ausgewählt' : `${n} Wörter ausgewählt`;
  const ziele = document.getElementById('katZiele');
  ziele.innerHTML = CUSTOM_CATS.length
    ? CUSTOM_CATS.map(c => `<button class="kat-ziel" data-katziel="${c.id}">${escapeHtml(c.name)}</button>`).join('')
    : '<span class="kat-ziel-leer">Erst oben eine Kategorie anlegen.</span>';
}

/* Ein Tipp auf ein Wort im Vorrat: markieren oder Markierung wegnehmen. */
document.getElementById('unassignedPool').addEventListener('click', (e)=>{
  const chip = e.target.closest('.word-chip');
  if (!chip) return;
  const id = chip.getAttribute('draggable-id');
  if (!id) return;
  if (KAT_AUSWAHL.has(id)) KAT_AUSWAHL.delete(id); else KAT_AUSWAHL.add(id);
  zeichneKatAuswahl();
});

/* Ein Tipp auf ein Wort INNERHALB einer Kategorie nimmt es dort heraus. Das ist
   der Weg, der beim Ziehen "aus der Box herausziehen" war. */
document.getElementById('customCatList').addEventListener('click', (e)=>{
  const chip = e.target.closest('.word-chip');
  if (!chip) return;
  const box = chip.closest('[data-catid]');
  const id = chip.getAttribute('draggable-id');
  if (!box || !id) return;
  const cat = CUSTOM_CATS.find(c => c.id === box.dataset.catid);
  const w = byId(id);
  if (!cat) return;
  cat.wordIds = cat.wordIds.filter(x => x !== id);
  saveCustomCats();
  frischeEigeneAuf();
  zeichneKatAuswahl();
  toast(`${w ? w.ar : 'Wort'} aus „${cat.name}" entfernt.`);
});

/* Kategorie antippen: alle markierten Woerter hinein. */
document.getElementById('katZiele').addEventListener('click', (e)=>{
  const knopf = e.target.closest('[data-katziel]');
  if (!knopf) return;
  const cat = CUSTOM_CATS.find(c => c.id === knopf.dataset.katziel);
  if (!cat || !KAT_AUSWAHL.size) return;
  let neu = 0, schonDrin = 0;
  KAT_AUSWAHL.forEach(id => {
    if (cat.wordIds.includes(id)) { schonDrin++; return; }
    cat.wordIds.push(id);
    neu++;
  });
  saveCustomCats();
  katAuswahlLeer();
  frischeEigeneAuf();
  const teile = [];
  if (neu) teile.push(`${neu} Wort${neu===1?'':'e'} → „${cat.name}"`);
  if (schonDrin) teile.push(`${schonDrin} lag${schonDrin===1?'':'en'} dort schon`);
  toast(teile.join(' · '));
});

document.getElementById('btnKatAuswahlAus').addEventListener('click', katAuswahlLeer);

/* Aufklapper für die schon einsortierten Wörter. Die Liste haengt am Ende des
   Bildschirms; sie standardmaessig zuzuklappen ist der halbe Zweck der
   Trennung — offen waere es wieder die eine lange Liste von vorher. */
document.getElementById('btnPoolFertig').addEventListener('click', ()=>{
  const knopf = document.getElementById('btnPoolFertig');
  const liste = document.getElementById('poolWordsFertig');
  const auf = liste.classList.toggle('hidden');
  knopf.setAttribute('aria-expanded', String(!auf));
});


/* ---------- Die Wortkarte zum Nachschlagen (Elias, 18.08.2026) ----------

   „ich will wenn ich in einer box bin oder auch in den kategorien, dass sich
   die karteikarte öffnet damit ich da auch die vorschläge und den satz sehen
   kann. natürlich soll die box weiterhin frei in andere boxen ver[schieben]
   können … möchte aber im selben modus bleiben. also einfach nur im prinzip
   wie ein pop up der karteikarte."

   ⛔ Sie ruehrt den Leitner-Stand NICHT an - keine Bewertung, keine neue
   Faelligkeit, kein Zaehler. Nachschlagen ist kein Ueben; sonst verschoebe
   jedes Nachsehen den Rhythmus einer Karte. Verlegt wird weiterhin ausschliess-
   lich ueber die Kaestchen und die Leiste unten, genau wie vorher.

   ⚠️ Beide Seiten der Lernkarte stehen untereinander statt hintereinander. Zum
   Nachschlagen ist Umdrehen sinnlos - er weiss ja, welches Wort er angetippt
   hat, er will die Rueckseite sehen. */
let WK_WORT = null;

function baueWortKarte(w){
  const t = [];
  const box = PROGRESS[w.id] ? PROGRESS[w.id].box : 1;

  /* ⭐ Einzeln freigeschaltet? — Elias am 20.08.2026. Beide Angaben werden
     gebraucht und sind NICHT dasselbe: `istBekannt` sagt bereits Ja, sobald
     ein Wort einzeln frei ist. Wer nur danach frägt, könnte den Rückweg nie
     anbieten, weil das Wort dann wie jedes andere aussieht. */
  const wkEinzeln   = (typeof istEinzelnFrei === 'function') && istEinzelnFrei(w);
  const wkNochNicht = (typeof istBekannt === 'function') && !istBekannt(w);
  const wkEigen     = w.chapter === 'personal';

  t.push(`<div class="wk-kopfzeile">
    <div class="wk-marken">
      <span class="chip chip-chapter">${escapeHtml(kapitelBeschriftung(w))}</span>
      ${wkEinzeln ? `<span class="chip chip-einzeln">einzeln freigeschaltet</span>` : ''}
      ${wkNochNicht ? `<span class="chip chip-fremd">noch nicht dran</span>` : ''}
      <span class="wl-box">Box ${box}</span>
    </div>
    <button class="icon-btn" id="btnCloseWortKarte" aria-label="Schließen"><svg class="ic"><use href="#ic-close"/></svg></button>
  </div>`);

  /* ⚠️ Reihenfolge auf Elias' Ansage vom 18.08.2026: „die deutsche übersetzung
     sollte direkt unter dem arabischen sein … die deutsche übersetzung sollte
     über dem ton zeichen sein." Vorher stand der Lautsprecher dazwischen und
     trennte Wort und Bedeutung. */
  t.push(`<div class="wk-ar" lang="ar" dir="rtl">${escapeHtml(w.sg || w.ar)}</div>`);
  t.push(`<div class="wk-de">${escapeHtml(w.de)}</div>`);
  if (w.deNeben) t.push(`<div class="wk-neben">auch: ${escapeHtml(w.deNeben)}</div>`);
  t.push(`<div class="wk-ton">
    <button class="speak-btn" data-wksprich aria-label="Vorlesen"><svg class="ic"><use href="#ic-speaker"/></svg></button>
  </div>`);

  /* Formen unabhaengig von SETTINGS.showPlural: dieser Kasten ist zum
     Nachschlagen da, und wer hier hersieht, will alles sehen. Auf der Lernkarte
     bleibt der Schalter, was er ist - dort waere die Form ein Ratehinweis. */
  const formen = [];
  if (w.pl)    formen.push(['Plural',   formenAnzeige(w.pl)]);
  if (w.femSg) formen.push(['Fem.',     formenAnzeige(w.femSg)]);
  if (w.femPl) formen.push(['Fem. Pl.', formenAnzeige(w.femPl)]);
  if (w.root)  formen.push(['Wurzel',   w.root]);
  if (formen.length) t.push(`<div class="wk-formen">` + formen.map(([l,v])=>
    `<span><i class="lbl">${escapeHtml(l)}</i><span class="wf-ar">${escapeHtml(v)}</span></span>`).join('') + `</div>`);

  /* Eselsbruecke: seine eigene Notiz schlaegt jeden Vorschlag - dieselbe harte
     Rangfolge wie auf der Lernkarte (Punkt 8 vom 10.08.2026). */
  /* ⭐ Elias, 18.08.2026: „abgesehen davon kann ich die vorschläge nicht mehr
     abändern wenn ich das wollte." Stimmte: auf der Lernkarte öffnet ein Tipp
     auf den Eselsbrücken-Kasten den Notizeditor, hier gab es nichts dergleichen
     — man konnte nur blättern. Jetzt steht in beiden Fällen ein Stift daneben. */
  const notiz = getNote(w.id);
  if (notiz){
    t.push(`<div class="wk-abschnitt">
      <div class="wk-marke"><span>Deine Eselsbrücke</span>
        <button class="wk-stift" data-wkmerk aria-label="Eselsbrücke ändern">${icon('note')}ändern</button></div>
      <div class="de">${arabischHervorheben(notiz)}</div>
    </div>`);
  } else {
    const liste = (typeof vorschlagsListe === 'function') ? vorschlagsListe(w) : [];
    if (liste.length){
      const nr = gewaehlterVorschlag(w.id, liste.length);
      t.push(`<div class="wk-abschnitt">
        <div class="wk-marke"><span>Vorschlag</span>
          <span>${liste.length>1?`${nr+1} von ${liste.length}`:''}
          <button class="wk-stift" data-wkmerk aria-label="Eigene Eselsbrücke schreiben">${icon('note')}eigene</button></span></div>
        <div class="de">${arabischHervorheben(liste[nr])}</div>
        ${liste.length>1?`<div class="wk-blaettern">
          <button class="btn btn-secondary btn-klein" data-wkblatt="-1">← Vorheriger</button>
          <button class="btn btn-secondary btn-klein" data-wkblatt="1">Anderer →</button>
        </div>`:''}
      </div>`);
    } else {
      t.push(`<div class="wk-abschnitt">
        <div class="wk-marke"><span>Eselsbrücke</span>
          <button class="wk-stift" data-wkmerk aria-label="Eselsbrücke schreiben">${icon('note')}schreiben</button></div>
        <div class="de" style="color:var(--text-faint)">Noch keine — schreib dir eine.</div>
      </div>`);
    }
  }

  if (w.sentAr){
    t.push(`<div class="wk-abschnitt">
      <div class="wk-marke"><span>Beispielsatz</span></div>
      <div class="ar" lang="ar" dir="rtl">${buildSentenceHtml(w, { ohneLuecke:true, karteikarte:true })}</div>
      <div class="de">${escapeHtml(w.sentDe || '')}</div>
    </div>`);
  }

  if (w.quran){
    t.push(`<div class="wk-abschnitt">
      <div class="wk-marke"><span>Quran-Bezug</span><span>${escapeHtml(`${w.quran.surah} ${w.quran.ayah}`)}</span></div>
      <div class="ar" lang="ar" dir="rtl">${quranMitTreffer(w.quran.ar, w)}</div>
      <div class="de">${escapeHtml(w.quran.de || w.quran.note || '')}</div>
    </div>`);
  }

  /* Bearbeiten und Loeschen (Elias, 18.08.2026): „ich will auch die vokabeln
     bearbeiten können, alle. aber vorallem will ich auch die möglichkeit haben
     meine eigenen vokabeln auch wieder zu löschen. das kann ich aktuell nicht."

     ⛔ Geloescht wird nur, was ihm gehoert. Eine Buchvokabel zu loeschen waere
     eine Scheinfunktion: der naechste arabicroots-Abzug brachte sie zurueck,
     und niemand wuesste warum. Fuer die gibt es stattdessen das Zuruecksetzen
     auf den Abzug, sobald er etwas geaendert hat. */
  /* ⚠️ Auch die Fachbegriffe (18.08.2026, Elias: „fachbegriffe möchte ich auch
     löschen können"). Sie liegen in einer ausgelieferten Datei und werden nicht
     wirklich gelöscht, sondern beim Laden übersprungen — für ihn ist das
     dasselbe. ⛔ Diese Zeile stand zuerst nur auf 'personal', während kern.js
     schon beide erlaubte: der Knopf erschien nie, obwohl die Funktion dahinter
     fertig war. Aufgefallen nur, weil ich es im Browser durchgeklickt habe. */
  const eigen = w.chapter === 'personal';
  const geaendert = (typeof WORT_AENDERUNGEN !== 'undefined') && !!WORT_AENDERUNGEN[w.id];

  /* ⭐ Pluralkarten sind ABGELEITET (18.08.2026). Sie werden bei jedem Start aus
     dem `pl`-Feld der Grundvokabel neu gebaut; eine Aenderung hier waere beim
     naechsten Start weg, ohne dass irgendetwas meldet, dass sie verlorenging.
     Statt einen Knopf anzubieten, der still nichts tut, fuehrt die Karte zur
     Grundvokabel - dort wird der Plural geaendert, und die Karte folgt.
     Die eigene Eselsbruecke bleibt hier trotzdem moeglich: die haengt an der
     Id und nicht am Datensatz. */
  if (w.istPlural){
    t.push(`<div class="wk-aktionen">
      <button class="btn btn-secondary btn-klein" data-wkgrundwort="${escapeHtml(w.plVon)}">Zur Grundvokabel</button>
    </div>
    <div class="wk-hinweis">Diese Karte entsteht aus dem Plural der Grundvokabel. Ändern lässt sich der Plural dort.</div>`);
    return t.join('');
  }

  /* ⭐⭐ EINZELN FREISCHALTEN — Elias am 20.08.2026: „teilweise benutzt mein
     lehrer begriffe die wir in späteren kapiteln finden … ich möchte aber nur
     die vereinzelnen wörter haben ohne den rest des kapitels zu haben."

     Der Knopf steht in der Wortkarte, weil die Suche schon über den GANZEN
     Bestand geht — auch über zugesperrte Kapitel. Wer نَعْت sucht, findet es
     heute schon; bis jetzt konnte er es nur ansehen und nicht mitnehmen.

     ⛔ Nicht bei eigenen Vokabeln und Fachbegriffen: die sind ohnehin immer
     bekannt, ein Knopf dort wäre eine Scheinfunktion. */
  const wkFreiKnopf = wkEigen ? '' : (wkEinzeln
    ? `<button class="btn btn-secondary btn-klein" data-wkeinzeln="0">Freischaltung zurücknehmen</button>`
    : (wkNochNicht ? `<button class="btn btn-primary btn-klein" data-wkeinzeln="1">${icon('check')}Nur dieses Wort freischalten</button>` : ''));

  /* ⭐⭐ BOX VON HAND WÄHLEN — Elias am 20.08.2026: „ich will auch, dass wenn
     ich auf einer infokarte von einem wort bin, dass ich sie auch beliebig in
     die boxen packen kann … will sie direkt in box 5 packen."

     Die Fälligkeit steht mit am Knopf, genau wie bei der Mehrfachauswahl in der
     Wortliste: „Box 4" allein ist eine bloße Nummer, „in 7 Tagen" sagt, was
     passiert. ⛔ Pluralkarten bekommen die Reihe auch — sie haben einen eigenen
     Fortschritt und werden einzeln abgefragt. */
  const wkTage = t => t === 0 ? 'sofort' : t === 1 ? 'morgen' : `in ${t} Tagen`;
  t.push(`<div class="wk-abschnitt wk-boxwahl">
    <div class="wk-marke"><span>In welcher Box?</span></div>
    <div class="wk-boxziele">${[1,2,3,4,5].map(b =>
      `<button class="kat-ziel${b === box ? ' ist-drin' : ''}" data-wkbox="${b}"${b === box ? ' aria-current="true"' : ''}>Box ${b}<span class="box-ziel-tage"> · ${wkTage(INTERVALS[b])}</span></button>`
    ).join('')}</div>
  </div>`);

  t.push(`<div class="wk-aktionen">
    ${wkFreiKnopf}
    <button class="btn btn-secondary btn-klein" data-wkbearbeiten>${icon('note')}Bearbeiten</button>
    ${eigen ? `<button class="btn btn-secondary btn-klein wk-loeschen" data-wkloeschen>${icon('trash')}Löschen</button>` : ''}
    ${(!eigen && geaendert) ? `<button class="btn btn-secondary btn-klein" data-wkzuruecksetzen>Auf Original zurück</button>` : ''}
  </div>`);

  /* Sagen, was der Knopf tut — und vor allem, was er NICHT tut. Ohne den Satz
     läge der Verdacht nahe, damit werde das ganze Kapitel aufgemacht. */
  if (wkNochNicht && !wkEigen)
    t.push(`<div class="wk-hinweis">Steht in einem Kapitel, das du noch nicht hast. Freischalten holt <b>nur dieses eine Wort</b> in deine Karteikarten, Kategorien, Sätze und Statistik — der Rest des Kapitels bleibt zu.</div>`);
  else if (wkEinzeln)
    t.push(`<div class="wk-hinweis">Dieses Wort hast du einzeln freigeschaltet, obwohl sein Kapitel noch zu ist.</div>`);

  return t.join('');
}

/* Das Bearbeitungsformular liegt IN der Wortkarte, nicht in einem zweiten
   Fenster: ein Fenster ueber einem Fenster ist auf dem Handy kaum noch
   wegzutippen, und er soll beim Aendern sehen, was daneben steht. */
function baueWortFormular(w){
  const feld = (id, beschriftung, wert, arabisch) => `
    <label class="wk-feld">
      <span>${escapeHtml(beschriftung)}</span>
      <input type="text" id="${id}" value="${escapeHtml(wert || '')}"
             ${arabisch ? 'lang="ar" dir="rtl"' : ''} autocomplete="off" spellcheck="false">
    </label>`;
  return `<div class="wk-kopfzeile">
      <div class="wk-marken"><span class="chip chip-chapter">Bearbeiten</span></div>
      <button class="icon-btn" id="btnCloseWortKarte" aria-label="Schließen"><svg class="ic"><use href="#ic-close"/></svg></button>
    </div>
    ${feld('wkAr', 'Arabisch', w.ar, true)}
    ${feld('wkDe', 'Deutsch', w.de, false)}
    ${feld('wkPl', 'Plural (optional)', w.pl, true)}
    ${feld('wkSentAr', 'Beispielsatz Arabisch (optional)', w.sentAr, true)}
    ${feld('wkSentDe', 'Beispielsatz Deutsch (optional)', w.sentDe, false)}
    <div class="wk-aktionen">
      <button class="btn btn-secondary btn-klein" data-wkabbrechen>Abbrechen</button>
      <button class="btn btn-primary btn-klein" data-wkspeichern>${icon('check')}Speichern</button>
    </div>`;
}

/* ---------- Eselsbrücke schreiben oder ändern ----------

   ⛔ Ein LEERES Feld löscht die eigene Notiz und lässt den Vorschlag wieder
   erscheinen. Das ist der Rückweg, ohne den die Funktion eine Einbahnstraße
   wäre — derselbe Gedanke wie bei der Liste in den Einstellungen.

   ⚠️ Vorgefüllt wird ausschließlich mit SEINEM Text, nie mit dem Vorschlag.
   Punkt 8 vom 10.08.2026: ein vorgefüllter Vorschlag wäre die stille
   Übernahme, die es nicht geben soll. Wer den Vorschlag als Grundlage will,
   kopiert ihn bewusst — er steht direkt darüber. */
function baueMerkFormular(w){
  return `<div class="wk-kopfzeile">
      <div class="wk-marken"><span class="chip chip-chapter">Eselsbrücke</span></div>
      <button class="icon-btn" id="btnCloseWortKarte" aria-label="Schließen"><svg class="ic"><use href="#ic-close"/></svg></button>
    </div>
    <div class="wk-ar" lang="ar" dir="rtl" style="font-size:clamp(1.8rem,8vw,2.6rem)">${escapeHtml(w.sg || w.ar)}</div>
    <label class="wk-feld">
      <span>Deine eigene Eselsbrücke — leer lassen, um wieder den Vorschlag zu sehen</span>
      <textarea id="wkMerkText" rows="5" lang="de" placeholder="Wie merkst du dir dieses Wort?">${escapeHtml(getNote(w.id))}</textarea>
    </label>
    <div class="wk-aktionen">
      <button class="btn btn-secondary btn-klein" data-wkabbrechen>Abbrechen</button>
      <button class="btn btn-primary btn-klein" data-wkmerkspeichern>${icon('check')}Speichern</button>
    </div>`;
}

function zeigeWortKarte(id){
  const w = byId(id);
  if (!w) return;
  WK_WORT = w;
  const karte = document.getElementById('wortKarte');
  karte.innerHTML = baueWortKarte(w);
  karte.scrollTop = 0;                       /* nicht dort anfangen, wo das letzte Wort aufhoerte */
  karte.classList.remove('hidden');
  document.getElementById('wortKarteBackdrop').classList.remove('hidden');
  overlayAuf('wortKarte');
}

function schliesseWortKarte(){
  if (overlayZuUeberHistorie('wortKarte')) return;
  WK_WORT = null;
  document.getElementById('wortKarte').classList.add('hidden');
  document.getElementById('wortKarteBackdrop').classList.add('hidden');
}

document.getElementById('wortKarteBackdrop').addEventListener('click', schliesseWortKarte);
document.getElementById('wortKarte').addEventListener('click', (e)=>{
  if (e.target.closest('#btnCloseWortKarte')) { schliesseWortKarte(); return; }
  if (e.target.closest('[data-wksprich]') && WK_WORT){ speakArabic(sprechText(WK_WORT)); return; }
  const karte = document.getElementById('wortKarte');

  /* Von der Pluralkarte zur Grundvokabel. `zeigeWortKarte` baut die offene
     Karte um, statt eine zweite darueberzulegen - zwei Fenster uebereinander
     sind auf dem Handy kaum noch wegzutippen. */
  const zurGrund = e.target.closest('[data-wkgrundwort]');
  if (zurGrund){
    const zielId = zurGrund.getAttribute('data-wkgrundwort');
    if (zielId && VOCAB_DATA.some(x => x.id === zielId)) zeigeWortKarte(zielId);
    return;
  }

  /* ⚠️ Steht VOR allen anderen Zweigen und baut die Karte neu — sonst zeigt
     die Marke im Kopf weiter die alte Box, und es sähe aus, als hätte der
     Knopf nichts getan. */
  const boxKnopf = e.target.closest('[data-wkbox]');
  if (boxKnopf && WK_WORT){
    const ziel = Number(boxKnopf.getAttribute('data-wkbox'));
    const bewegt = verschiebeInBox(WK_WORT.id, ziel);
    karte.innerHTML = baueWortKarte(WK_WORT);
    if (typeof renderHome === 'function') renderHome();
    toast(bewegt ? `In Box ${ziel} gelegt — ${ziel === 1 ? 'sofort wieder dran' : 'wieder dran ' + (INTERVALS[ziel] === 1 ? 'morgen' : 'in ' + INTERVALS[ziel] + ' Tagen')}.`
                 : `Steht schon in Box ${ziel}.`);
    return;
  }
  const einzelnKnopf = e.target.closest('[data-wkeinzeln]');
  if (einzelnKnopf && WK_WORT){
    const an = einzelnKnopf.getAttribute('data-wkeinzeln') === '1';
    setzeEinzelnFrei(WK_WORT.id, an);
    karte.innerHTML = baueWortKarte(WK_WORT);
    karte.scrollTop = 0;
    /* ⚠️ Nicht nur die Karte neu zeichnen. Die Freischaltung wirkt auf den
       Lernvorrat, die Kategorien, die Wortfelder und die Statistik — stehen
       die noch mit der alten Liste da, sieht es aus, als hätte der Knopf
       nichts getan. Genau derselbe Fall wie bei der Buchauswahl. */
    /* ⚠️ nachAuswahlwechsel() und sonst NICHTS als Ausweich — der zweite Name,
       den ich hier zuerst stehen hatte (frischeKategorienAuf), gibt es gar
       nicht. Ein Ausweichzweig auf eine Funktion, die nirgends steht, sieht
       nach Absicherung aus und ist eine Attrappe. */
    if (typeof nachAuswahlwechsel === 'function') nachAuswahlwechsel();
    if (typeof zeichneSuche === 'function') zeichneSuche();
    toast(an ? 'Freigeschaltet — das Wort lernst du ab jetzt mit.'
             : 'Zurückgenommen — das Wort ist wieder außer Reichweite.');
    return;
  }
  if (e.target.closest('[data-wkbearbeiten]') && WK_WORT){
    karte.innerHTML = baueWortFormular(WK_WORT);
    karte.scrollTop = 0;
    return;
  }
  if (e.target.closest('[data-wkmerk]') && WK_WORT){
    karte.innerHTML = baueMerkFormular(WK_WORT);
    karte.scrollTop = 0;
    document.getElementById('wkMerkText').focus();
    return;
  }
  if (e.target.closest('[data-wkmerkspeichern]') && WK_WORT){
    const text = (document.getElementById('wkMerkText')?.value || '').trim();
    setNote(WK_WORT.id, text);
    karte.innerHTML = baueWortKarte(WK_WORT);
    toast(text ? 'Eselsbrücke gespeichert' : 'Eigene Eselsbrücke entfernt — der Vorschlag steht wieder da.');
    return;
  }
  if (e.target.closest('[data-wkabbrechen]') && WK_WORT){
    karte.innerHTML = baueWortKarte(WK_WORT);
    return;
  }
  if (e.target.closest('[data-wkspeichern]') && WK_WORT){
    const wert = id => (document.getElementById(id)?.value || '').trim();
    const ok = speichereWortAenderung(WK_WORT.id, {
      ar: wert('wkAr'), de: wert('wkDe'), pl: wert('wkPl'),
      sentAr: wert('wkSentAr'), sentDe: wert('wkSentDe')
    });
    if (!ok){ toast('Arabisch und Deutsch dürfen nicht leer sein'); return; }
    karte.innerHTML = baueWortKarte(WK_WORT);
    openWordList(AKTUELLE_LISTE);          /* die Liste dahinter zeigt sonst den alten Text */
    toast('Gespeichert');
    return;
  }
  if (e.target.closest('[data-wkzuruecksetzen]') && WK_WORT){
    /* Nur die eigene Fassung wegwerfen; das Original steht in vocab-data.js und
       ist nach dem Neuladen wieder da. Ohne Neuladen bliebe die geaenderte
       Fassung im Speicher stehen - deshalb der ausdrueckliche Hinweis. */
    verwirfWortAenderung(WK_WORT.id);
    schliesseWortKarte();
    toast('Zurückgesetzt — beim nächsten Start steht wieder das Original da.');
    return;
  }
  if (e.target.closest('[data-wkloeschen]') && WK_WORT){
    /* ⚠️ HIER eine Rueckfrage, anders als beim „Kenne ich schon"-Knopf. Der
       Unterschied ist die Umkehrbarkeit: dort holt derselbe Knopf das Wort
       sofort zurueck, hier ist es endgueltig weg - mitsamt Fortschritt, Notiz
       und Zuordnung. Eine Sicherheitsfrage bei etwas Unwiederbringlichem ist
       keine Belaestigung. */
    const w = WK_WORT;
    if (!confirm(`„${w.ar}" (${w.de}) wirklich löschen? Das lässt sich nicht rückgängig machen.`)) return;
    if (loeschePersonalVocab(w.id)){
      schliesseWortKarte();
      openWordList(AKTUELLE_LISTE);
      if (typeof renderCategories === 'function') renderCategories();
      toast('Vokabel gelöscht');
    } else {
      toast('Nur eigene Vokabeln lassen sich löschen');
    }
    return;
  }

  const blatt = e.target.closest('[data-wkblatt]');
  if (blatt && WK_WORT){
    const liste = vorschlagsListe(WK_WORT);
    if (liste.length < 2) return;
    const jetzt = gewaehlterVorschlag(WK_WORT.id, liste.length);
    const neu = (jetzt + Number(blatt.dataset.wkblatt) + liste.length) % liste.length;
    /* Dieselbe Ablage wie im Notizfenster (js/kern.js). Wer hier blaettert,
       aendert damit auch, was auf der Lernkarte steht - genau so ist Elias'
       Wunsch vom selben Tag gemeint, und es ist weiterhin KEINE Uebernahme. */
    setzeGewaehltenVorschlag(WK_WORT.id, neu);
    const stand = karte.scrollTop;
    karte.innerHTML = baueWortKarte(WK_WORT);
    karte.scrollTop = stand;                 /* sonst springt die Karte bei jedem Blaettern nach oben */
  }
});
/* Escape schliesst - dieselbe Erwartung wie bei jedem anderen Fenster. */
document.addEventListener('keydown', (e)=>{
  if (e.key === 'Escape' && !document.getElementById('wortKarte').classList.contains('hidden')) schliesseWortKarte();
});

/* ---------- Suche ueber den ganzen Wortschatz (Elias, 18.08.2026) ----------

   „außerdem möchte ich auch eine funktion haben, wo ich nach einem begriff
   suchen kann. das fehlt uns aktuell noch sehr. am besten soll mir das dann
   auch die karteikarte anzeigen wenn ich drauf drücke und soll auch anzeigen
   wie oft es dieses wort im quran gibt. … ich will wegen der suche sowas
   ähnliches wie arabic roots."

   ⭐ Arabisch wird OHNE Vokalzeichen verglichen. Wer „كتاب" eintippt, hat keine
   Ḥarakāt getippt — mit einem strengen Vergleich faende er كِتَابٌ nie, und die
   Suche saehe kaputt aus, obwohl das Wort da ist.

   ⛔ Die Zeichenklasse steht als \u-Folgen da und wird NIE sichtbar kopiert.
   Eine kopierte Klasse sieht Zeichen fuer Zeichen gleich aus und trifft etwas
   anderes; am 17.08.2026 hat genau das ein Werkzeug lautlos unbrauchbar
   gemacht. Danach an bekannten Faellen geeicht (siehe pruefe-suche.js).

   ⭐ Gesucht wird ueber VOCAB_DATA, nicht ueber bekannteVokabeln(): wer sucht,
   will wissen, OB es das Wort gibt. Treffer aus gesperrten Kapiteln werden
   angezeigt und als „noch nicht dran" markiert - weglassen waere eine
   unsichtbare Einschraenkung, und genau die hat Elias schon einmal als Fehler
   gemeldet. */
const SUCH_ZEICHEN = /[ؐ-ًؚ-ٰٟۖ-ࣰۭ-ࣳ]/g;
function suchFlach(s){
  return String(s || '')
    .replace(SUCH_ZEICHEN, '')
    .replace(/ـ/g, '')                       /* Tatwīl, reine Streckung */
    .replace(/[آأإٱ]/g, 'ا')  /* آ أ إ ٱ -> ا */
    .replace(/ى/g, 'ي')                 /* ى -> ي */
    .replace(/ة/g, 'ه')                 /* ة -> ه */
    .trim();
}

function sucheTreffer(begriff){
  const roh = String(begriff || '').trim();
  if (roh.length < 2) return [];
  const de = roh.toLowerCase();
  const ar = suchFlach(roh);
  const arWurzel = ar.replace(/\s+/g, '');
  return VOCAB_DATA.filter(w => {
    if ((w.de || '').toLowerCase().includes(de)) return true;
    if ((w.deNeben || '').toLowerCase().includes(de)) return true;
    if (suchFlach(w.ar).includes(ar)) return true;
    if (w.sg && suchFlach(w.sg).includes(ar)) return true;
    if (w.pl && suchFlach(w.pl).includes(ar)) return true;
    if (w.root && suchFlach(w.root).replace(/\s+/g, '').includes(arWurzel)) return true;
    return false;
  }).sort((a, b) => {
    /* Was er lernt, zuerst - dann die Wörter aus noch gesperrten Kapiteln. */
    const ka = istBekannt(a) ? 0 : 1, kb = istBekannt(b) ? 0 : 1;
    if (ka !== kb) return ka - kb;
    /* Ein Treffer, der GENAU das Gesuchte ist, steht vor einem, der es nur
       enthält: wer „باب" tippt, will بَابٌ oben sehen, nicht أَبْوَاب. */
    const ga = (suchFlach(a.ar) === ar || (a.de || '').toLowerCase() === de) ? 0 : 1;
    const gb = (suchFlach(b.ar) === ar || (b.de || '').toLowerCase() === de) ? 0 : 1;
    return ga - gb;
  });
}

/* Wie oft die WURZEL im Quran steht. Dieselbe Quelle wie das Abzeichen auf der
   Lernkarte (js/lernen.js), damit nicht zwei Stellen verschiedene Zahlen
   nennen. */
function quranHaeufigkeit(w){
  if (!w.root || typeof QURAN_FREQ === 'undefined') return null;
  const eintrag = QURAN_FREQ[w.root.replace(/\s+/g, '')];
  return eintrag ? eintrag[0] : null;
}

function zeichneSuche(){
  const feld    = document.getElementById('sucheEingabe');
  const treffer = document.getElementById('sucheTreffer');
  const hinweis = document.getElementById('sucheHinweis');
  const leeren  = document.getElementById('btnSucheLeeren');
  const tabs    = document.getElementById('catTabs');
  if (!feld) return;
  const begriff = feld.value.trim();

  leeren.classList.toggle('hidden', !begriff);
  /* Bei leerer Suche sind die Reiter wieder da. Sie zu verstecken, solange
     nichts gesucht wird, nähme ihm den normalen Weg durch die Kategorien. */
  const sucht = begriff.length >= 2;
  tabs.classList.toggle('hidden', sucht);
  document.querySelectorAll('.cat-pane').forEach(p => p.classList.toggle('such-aus', sucht));
  treffer.classList.toggle('hidden', !sucht);
  hinweis.classList.toggle('hidden', !begriff);

  if (!sucht){
    hinweis.textContent = begriff ? 'Mindestens zwei Zeichen eingeben.' : '';
    treffer.innerHTML = '';
    return;
  }

  const liste = sucheTreffer(begriff);
  hinweis.textContent = liste.length
    ? `${liste.length} Treffer für „${begriff}“`
    : `Nichts gefunden für „${begriff}“. Arabisch geht auch ohne Ḥarakāt.`;

  treffer.innerHTML = liste.slice(0, 60).map(w => {
    const freq = quranHaeufigkeit(w);
    const fremd = !istBekannt(w);
    return `<div class="word-list-item" data-suchwort="${escapeHtml(String(w.id))}">
      <div class="wl-text">
        <div class="wl-ar">${escapeHtml(w.sg || w.ar)}</div>
        <div class="wl-de">${escapeHtml(w.de)} · ${escapeHtml(kapitelBeschriftung(w))}</div>
      </div>
      <div class="wl-marken">
        ${freq ? `<span class="wl-quran">${icon('crescent')}${freq}×</span>` : ''}
        ${fremd ? `<span class="wl-fremd">noch nicht dran</span>` : ''}
      </div>
    </div>`;
  }).join('');

  /* Sagen, dass gekürzt wurde. Eine stille Obergrenze sieht aus wie „mehr gibt
     es nicht" — und das wäre gelogen. */
  if (liste.length > 60){
    hinweis.textContent += ` — die ersten 60 werden gezeigt.`;
  }
}

document.getElementById('sucheEingabe').addEventListener('input', zeichneSuche);
document.getElementById('btnSucheLeeren').addEventListener('click', ()=>{
  document.getElementById('sucheEingabe').value = '';
  zeichneSuche();
  document.getElementById('sucheEingabe').focus();
});
/* Ein Tipp auf einen Treffer öffnet die Wortkarte — Elias' ausdrücklicher
   Wunsch: „am besten soll mir das dann auch die karteikarte anzeigen wenn ich
   drauf drücke." Kein Kästchen zum Auswählen: hier wird nachgeschlagen, nicht
   einsortiert. */
document.getElementById('sucheTreffer').addEventListener('click', (e)=>{
  const zeile = e.target.closest('[data-suchwort]');
  if (zeile) zeigeWortKarte(zeile.dataset.suchwort);
});
