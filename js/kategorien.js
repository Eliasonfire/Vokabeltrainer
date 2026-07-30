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

  document.getElementById('catPane-roots').innerHTML =
    (eigene || felderHtml)
      ? eigene + felderHtml
      : '<div class="empty-state">Für dieses Buch sind noch keine Wortfelder belegt.</div>';
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

  const alle   = buchVokabeln();
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

  document.querySelectorAll('[data-delcat]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      CUSTOM_CATS = CUSTOM_CATS.filter(c=>c.id!==btn.dataset.delcat);
      saveCustomCats(); frischeEigeneAuf();
    });
  });
  setupDragAndDrop();
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

/* ---------- Drag & Drop (Pointer Events, touch + mouse) ----------

   Seit dem 29.07.2026 mit HALTEN statt Sofortstart. Elias' Meldung:

     "Bei den eigenen Kategorien kann ich kaum die Liste runter wischen auf
      meinem Handy weil ich dauernd auf die Wörter klicke und sie so automatisch
      auswähle. Es wäre gut, wenn ich die Wörter für einen Moment halten muss
      und erst dann wird das Wort ausgewählt, sonst kann man nicht runter
      wischen die Wörter Liste."

   Warum das vorher unvermeidlich war: `startDrag` lief am `pointerdown` und
   rief sofort `e.preventDefault()`. Damit war JEDE Beruehrung eines Worts ein
   Ziehvorgang - und weil preventDefault dem Browser das Rollen verbietet, blieb
   die Liste stehen. Die Wortliste ist auf 38vh gedeckelt und rollt, es gibt
   also gar keinen Weg daran vorbei.

   Jetzt: Der Zeiger wird zwar sofort verfolgt, aber erst nach HALTEN_MS
   wird daraus ein Ziehvorgang. Wer vorher mehr als HALTEN_WEG Pixel bewegt,
   wollte rollen - der Zeitgeber wird verworfen und der Browser behaelt die
   Geste. Bis dahin wird NICHTS unterdrueckt.

   400 ms ist der Wert, den Android fuer den langen Druck selbst benutzt
   (ViewConfiguration.getLongPressTimeout); wer das Geraet kennt, kennt das
   Gefuehl. 10 Pixel entsprechen der Achsenschwelle der Wischgeste in
   js/lernen.js - dieselbe Frage, dieselbe Antwort. */
const HALTEN_MS = 400;
const HALTEN_WEG = 10;

function setupDragAndDrop(){
  let ghost=null, sourceEl=null, sourceId=null;
  let warten=null, startX=0, startY=0;
  /* Woher kam das Wort? Aus einer Kategorie-Box oder aus einer der beiden
     Listen unten. Davon haengt ab, was das Ablegen bedeutet — siehe onUp. */
  let herkunftCat=null;

  document.querySelectorAll('.word-chip').forEach(chip=>{
    chip.addEventListener('pointerdown', druckBeginnt);
  });

  function druckAbbrechen(){
    if (warten){ clearTimeout(warten); warten = null; }
    if (sourceEl && !ghost) sourceEl.classList.remove('haltend');
    document.removeEventListener('pointermove', beobachte);
    document.removeEventListener('pointerup', druckAbbrechen);
    document.removeEventListener('pointercancel', druckAbbrechen);
    if (!ghost){ sourceEl = null; sourceId = null; }
  }

  function beobachte(e){
    if (Math.abs(e.clientX-startX) > HALTEN_WEG || Math.abs(e.clientY-startY) > HALTEN_WEG)
      druckAbbrechen();                 // das war Rollen, kein Auswaehlen
  }

  function druckBeginnt(e){
    const chip = e.currentTarget;
    startX = e.clientX; startY = e.clientY;
    sourceEl = chip;
    sourceId = chip.getAttribute('draggable-id');
    const box = chip.closest('.custom-cat-box');
    herkunftCat = box ? box.dataset.catid : null;
    chip.classList.add('haltend');
    /* KEIN preventDefault hier - sonst rollt die Liste wieder nicht. */
    document.addEventListener('pointermove', beobachte);
    document.addEventListener('pointerup', druckAbbrechen);
    document.addEventListener('pointercancel', druckAbbrechen);
    warten = setTimeout(()=>{
      warten = null;
      document.removeEventListener('pointermove', beobachte);
      document.removeEventListener('pointerup', druckAbbrechen);
      document.removeEventListener('pointercancel', druckAbbrechen);
      startDrag(e.clientX, e.clientY);
    }, HALTEN_MS);
  }

  function startDrag(x, y){
    if (!sourceEl) return;
    ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    ghost.textContent = sourceEl.textContent;
    document.body.appendChild(ghost);
    moveGhost(x, y);
    sourceEl.classList.remove('haltend');
    sourceEl.classList.add('dragging');
    /* Kurzes Rueckmelden, dass der Druck angekommen ist - auf dem Handy sieht
       man den Ziehschatten sonst erst, wenn man sich schon bewegt. */
    if (navigator.vibrate) { try { navigator.vibrate(12); } catch(_){} }
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp, {once:true});
  }
  function moveGhost(x,y){ if(ghost){ ghost.style.left = (x-30)+'px'; ghost.style.top = (y-20)+'px'; } }

  /* ---------- Mitrollen, solange gezogen wird ----------
     Elias' zweiter Fehlerbericht vom 29.07.2026:

       "Wenn ich mehrere Kategorien angelegt habe, sodass sie den gesamten
        Bildschirm bedecken, und runterscrolle zu den Vokabeln, eine Vokabel
        auswähle, dann kann ich diese Vokabel nicht an die oberen Kategorien
        hinbewegen … die Seite scrollt nicht automatisch nach oben."

     Stimmt, und es ist die unvermeidliche Folge davon, dass das Ziehen den
     Finger belegt: `onMove` ruft `preventDefault`, der Browser rollt also nicht
     mehr mit. Ohne Ersatz sind nur die Kategorien erreichbar, die gerade im
     Bild stehen — bei sieben Kategorien also die untersten drei oder vier.

     Deshalb rollt der Ziehvorgang selbst: kommt der Finger in die oberen oder
     unteren 90 px von `main`, laeuft `main` in diese Richtung weiter, solange
     er dort bleibt. Die Geschwindigkeit waechst mit der Naehe zum Rand — am
     aeussersten Rand am schnellsten, damit man weite Wege nicht aussitzen muss,
     und in der Naehe langsam, damit Zielen moeglich bleibt. */
  const ROLL_ZONE = 90, ROLL_MAX = 17;
  let rollen = null, letzteY = 0;

  function rollePruefe(y){
    letzteY = y;
    const main = document.getElementById('main');
    if (!main) return;
    const r = main.getBoundingClientRect();
    const schritt = ()=>{
      const oben = letzteY - r.top, unten = r.bottom - letzteY;
      let d = 0;
      if (oben  < ROLL_ZONE) d = -ROLL_MAX * (1 - Math.max(0, oben)  / ROLL_ZONE);
      if (unten < ROLL_ZONE) d =  ROLL_MAX * (1 - Math.max(0, unten) / ROLL_ZONE);
      if (!d){ rollen = null; return; }
      main.scrollTop += d;
      /* Die Ablegemarkierung muss mitwandern, sonst leuchtet unter dem
         stehenden Finger die Kategorie von vorhin. */
      markiereZiel(letzteY);
      rollen = requestAnimationFrame(schritt);
    };
    if (!rollen) rollen = requestAnimationFrame(schritt);
  }
  function rolleStopp(){ if (rollen){ cancelAnimationFrame(rollen); rollen = null; } }

  /* Welche Kategorie liegt unter dem Finger? Der Ziehschatten selbst haengt an
     `document.body` und steht auf `pointer-events:none`, faellt hier also nicht
     ins Gewicht. */
  function markiereZiel(y, x){
    document.querySelectorAll('.custom-cat-box').forEach(b=>b.classList.remove('drop-hover'));
    const el = document.elementFromPoint(x !== undefined ? x : letzteX, y);
    const box = el && el.closest && el.closest('.custom-cat-box');
    if (box) box.classList.add('drop-hover');
    return box;
  }
  let letzteX = 0;

  function onMove(e){
    /* Erst AB HIER unterdruecken, also nachdem der lange Druck durch ist.
       Waehrend des Wartens wuerde dasselbe preventDefault genau den Fehler
       zurueckholen, den der lange Druck behebt. */
    e.preventDefault();
    letzteX = e.clientX;
    moveGhost(e.clientX, e.clientY);
    markiereZiel(e.clientY, e.clientX);
    rollePruefe(e.clientY);
  }
  function onUp(e){
    document.removeEventListener('pointermove', onMove);
    rolleStopp();
    if (ghost) ghost.remove();
    if (sourceEl) sourceEl.classList.remove('dragging','haltend');
    /* Ablegen grosszuegiger machen (Elias: "kann ich jetzt nur noch schwer die
       Vokabel in die Kategorie reinpacken"): Trifft der Finger keine Box, wird
       im Umkreis von 44 px nachgesehen, bevor der Zug als "nirgendwohin"
       gewertet wird. Genau in die Box zu treffen ist auf einem Handy mit einem
       verdeckenden Finger schwer — die Kategorie-Boxen haben nur 64 px Hoehe. */
    let el = document.elementFromPoint(e.clientX, e.clientY);
    let box = el && el.closest && el.closest('.custom-cat-box');
    if (!box){
      for (const dy of [-22, 22, -44, 44]){
        const nah = document.elementFromPoint(e.clientX, e.clientY + dy);
        box = nah && nah.closest && nah.closest('.custom-cat-box');
        if (box) break;
      }
    }
    document.querySelectorAll('.custom-cat-box').forEach(b=>b.classList.remove('drop-hover'));
    if (sourceId){
      /* HIER STAND bis zum 29.07.2026 abends: "Immer zuerst aus allen
         Kategorien entfernen". Das war VERSCHIEBEN, und genau daran ist Elias'
         eigentliches Vorhaben gescheitert — ein Wort konnte nur an einer Stelle
         liegen. Seine Begründung, warum das nicht reicht: "Lehrer kann ich
         sowohl in Schule und Studium als auch in Berufe reinpacken."

         Jetzt entscheidet die HERKUNFT, was das Ablegen bedeutet:
           aus einer Liste  → HINZUFÜGEN (das Wort bleibt in der Liste stehen
                              und kann in weitere Kategorien)
           aus Kategorie A
             … auf Kategorie B → verschieben (A verliert es, B bekommt es)
             … ins Leere       → nur aus A entfernen

         Damit ist Ziehen aus der Liste beliebig oft wiederholbar, und ein Wort
         wieder loszuwerden geht dort, wo man es sieht: in seiner Kategorie. */
      const wort = byId(sourceId);
      const name = wort ? wort.de : 'Das Wort';
      const zielCat = box && CUSTOM_CATS.find(c => c.id === box.dataset.catid);

      if (zielCat){
        const schonDrin = zielCat.wordIds.includes(sourceId);
        if (!schonDrin) zielCat.wordIds.push(sourceId);
        if (herkunftCat && herkunftCat !== zielCat.id){
          const quelle = CUSTOM_CATS.find(c => c.id === herkunftCat);
          if (quelle) quelle.wordIds = quelle.wordIds.filter(id => id !== sourceId);
        }
        toast(schonDrin ? `${name} liegt dort schon.` : `${name} → ${zielCat.name}`);
      } else if (herkunftCat){
        const quelle = CUSTOM_CATS.find(c => c.id === herkunftCat);
        if (quelle){
          quelle.wordIds = quelle.wordIds.filter(id => id !== sourceId);
          toast(`${name} aus „${quelle.name}" entfernt.`);
        }
      }
      saveCustomCats();
      frischeEigeneAuf();
    }
    sourceEl=null; sourceId=null; ghost=null; herkunftCat=null;
  }
}

/* Aufklapper für die schon einsortierten Wörter. Die Liste haengt am Ende des
   Bildschirms; sie standardmaessig zuzuklappen ist der halbe Zweck der
   Trennung — offen waere es wieder die eine lange Liste von vorher. */
document.getElementById('btnPoolFertig').addEventListener('click', ()=>{
  const knopf = document.getElementById('btnPoolFertig');
  const liste = document.getElementById('poolWordsFertig');
  const auf = liste.classList.toggle('hidden');
  knopf.setAttribute('aria-expanded', String(!auf));
});

