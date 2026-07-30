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
  const chapters = [...kapitelDesBuchs(), 'personal'];
  const html = chapters.map(ch=>{
    const words = buchVokabeln().filter(w=>w.chapter===ch);
    const name = CHAPTER_NAMES[ch] || `Kapitel ${ch}`;
    const label = ch==='personal' ? `${icon('note')}<span>${name}</span>` : `<span>Kap. ${ch} — ${name}</span>`;
    return `<div class="list-row" data-openlist="chapter:${ch}">
      <div class="list-row-title">${label}</div>
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
    const chNum = ch==='personal' ? 'personal' : Number(ch);
    words = buchVokabeln().filter(w=>w.chapter===chNum);
    /* CHAPTER_NAMES benennt nur die neun Kapitel aus Madina 1, zu denen eine
       belegte Grammatikregel vorliegt. Fuer alle uebrigen bleibt die Nummer -
       einen Namen zu erfinden verbietet E.1. */
    const kapName = CHAPTER_NAMES[chNum];
    title = ch==='personal' ? 'Eigene Vokabeln' : (kapName ? `Kapitel ${ch} — ${kapName}` : `Kapitel ${ch}`);
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
    title = `Box ${boxNum}`;
  } else if (key==='quran'){
    words = buchVokabeln().filter(w=>w.quran);
    title = 'Vokabeln im Quran';
  } else { words=[]; title=''; }

  document.getElementById('wordlistTitle').textContent = title;
  document.getElementById('wordList').innerHTML = words.map(w=>`
    <div class="word-list-item">
      <div><div class="wl-ar">${w.ar}</div><div class="wl-de">${w.de}</div></div>
      <span class="wl-box">Box ${PROGRESS[w.id]?PROGRESS[w.id].box:1}</span>
    </div>
  `).join('') || '<div class="empty-state">Keine Wörter in dieser Kategorie.</div>';
  document.getElementById('personalVocabAddForm').style.display = key==='chapter:personal' ? 'flex' : 'none';
  showScreen('wordlist');
}
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

