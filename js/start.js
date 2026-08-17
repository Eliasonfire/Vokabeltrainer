/* start.js -- Startbildschirm
   Teil der App-Logik; wird in index.html in fester Reihenfolge geladen und
   teilt sich mit den uebrigen js/-Dateien den globalen Namensraum. */
/* ===================== HOME ===================== */
function renderHome(){
  const pool = currentPool();
  animateNumber(document.getElementById('dueCount'), pool.length);
  document.getElementById('dueSub').textContent = pool.length
    ? `Sitzungsgröße: ${SETTINGS.sessionSize===9999?'alle':SETTINGS.sessionSize} Karten pro Runde${SETTINGS.wrongOnly?' · Nur falsche Wörter':''}`
    : (SETTINGS.wrongOnly ? 'Keine schwachen Wörter mit dieser Auswahl.' : 'Alles erledigt für heute – super gemacht.');
  document.getElementById('streakCount').textContent = getStreak().count;

  /* ⚠️ `bekannteVokabeln()` statt `buchVokabeln()` seit dem 17.08.2026: die
     Box-Zahlen zaehlten alle 311 Woerter des geladenen Buchs, also auch die
     140, die Elias nie hatte. Auf der Startseite stand damit ein Lernstand
     ueber einem Bestand, den er gar nicht lernt. Dieselbe Umstellung wie in
     js/statistik.js und in passtZurAuswahl(). */
  const boxCounts = [1,2,3,4,5].map(b => bekannteVokabeln().filter(w=>PROGRESS[w.id] && PROGRESS[w.id].box===b).length);
  /* Box 1 rot, Box 5 gruen - Elias' Wunsch vom 29.07.2026. Dieselbe Tabelle wie
     in js/statistik.js; 2-4 bleiben neutral, weil eine fuenfstufige Farbskala
     behaupten wuerde, Box 3 sei "halb gut". */
  const BOX_TON = { 1:'schlecht', 5:'gut' };
  document.getElementById('boxOverview').innerHTML = boxCounts.map((n,i)=>`
    <div class="box-pip${BOX_TON[i+1] ? ' box-'+BOX_TON[i+1] : ''}" data-openlist="box:${i+1}"><div class="n">${n}</div><div class="l">Box ${i+1}</div></div>
  `).join('');

  /* Die Kachel haengt an der Einstellung (Elias, 31.07.2026). Sie zeigt genau
     die Woerter mit kuratiertem Beleg — ohne die Belege waere sie eine Liste
     ohne Inhalt, deshalb geht sie mit weg statt leer stehenzubleiben. */
  const quranCount = bekannteVokabeln().filter(w=>w.quran).length;
  document.getElementById('quranTile').classList.toggle('hidden', !SETTINGS.showQuran);
  document.getElementById('quranTileSub').textContent = `${quranCount} Vokabeln`;

  renderBuchChips();
  renderChapterFilterChips();
  document.getElementById('btnWrongOnly').classList.toggle('active', !!SETTINGS.wrongOnly);
}

/* Die Kapitelliste haengt am Buch: Madina 1 hat 24, Madina 3 hat 35, und
   frueher stand hier fest 1-9.

   Seit dem 11.08.2026 koennen mehrere Buecher gleichzeitig gewaehlt sein, und
   jedes traegt seine eigene Kapitelauswahl. Die Anzeige unterscheidet deshalb
   zwei Faelle:

   - EIN Buch: genau wie vorher, eine Reihe Chips ohne Ueberschrift. Der haeufige
     Fall soll nicht umstaendlicher werden, nur weil es jetzt auch anders geht.
   - MEHRERE: je Buch eine eigene Reihe mit dem Buchnamen davor. Ohne den Namen
     waere "3" nicht mehr eindeutig - Kapitel 3 gibt es dann mehrfach, und in
     jedem Buch bedeutet es etwas anderes.

   Der "Eigene"-Chip steht genau einmal ganz unten. Eigene Vokabeln gehoeren zu
   keinem Buch; ihn je Buch anzubieten waere dieselbe Einstellung mehrfach. */
function renderChapterFilterChips(){
  const ziel = document.getElementById('chapterFilterChips');
  if (!ziel) return;
  const buecher = (typeof aktiveBuecher === 'function') ? aktiveBuecher() : ['madina-1'];
  const mehrere = buecher.length > 1;

  const chip = (buch, wert, text, an) =>
    `<button class="chip-toggle${an?' active':''}" data-chfilter="${wert}"`
    + (buch ? ` data-chbuch="${buch}"` : '') + `>${text}</button>`;

  const reihen = buecher.map(slug=>{
    const sel = (typeof kapitelAuswahl === 'function') ? kapitelAuswahl(slug) : [];
    const chips = [chip(slug, 'all', 'Alle', sel.length === 0)]
      .concat(kapitelDesBuchs(slug).map(n => chip(slug, n, n, sel.indexOf(n) >= 0)))
      .join('');
    if (!mehrere) return chips;
    return `<div class="chapter-book"><span class="chapter-book-name">${buchTitel(slug)}</span>`
         + `<div class="chip-row">${chips}</div></div>`;
  }).join('');

  const eigene = chip(null, 'personal', 'Eigene', !!SETTINGS.eigeneGewaehlt);
  ziel.innerHTML = mehrere
    ? reihen + `<div class="chapter-book"><div class="chip-row">${eigene}</div></div>`
    : reihen + eigene;
}

