/* start.js -- Startbildschirm
   Teil der App-Logik; wird in index.html in fester Reihenfolge geladen und
   teilt sich mit den uebrigen js/-Dateien den globalen Namensraum. */
/* ===================== HOME ===================== */
function renderHome(){
  /* ⭐⭐ „heute 10 · 42 warten" statt „52 fällig".
     Elias am 07.09.2026: „das ist gut". Der Rückstand bleibt bestehen, er hört
     nur auf, als Zahl im Weg zu stehen — bei ADHS ist die typische
     Verlaufsform nicht Nachlassen, sondern Abbruch.
     ⛔ Die grosse Zahl zeigt die TAGESRATION, nicht den Rückstand: sie ist
     das, was er heute tun soll. Der Rest steht klein darunter und wird nicht
     verschwiegen — eine Zahl zu verstecken wäre eine andere Sache als sie
     einzuordnen. */
  const alle = currentPool();
  const pool = (typeof tagesPool === 'function') ? tagesAuswahl(alle, tagesDeckel()) : alle;
  const wartet = alle.length - pool.length;
  /* ⭐ Beim Wiedereinstieg nach einer Pause fällt die Wartezahl weg (B2). Der
     Grund steht bei `istWiedereinstieg()` in js/kern.js: nach zwei Wochen ist
     der Berg genau das, was zum Aufhören führt. Für einen Tag reicht
     „heute 10". Ab morgen steht die Zahl wieder da. */
  const zurueck = (typeof istWiedereinstieg === 'function') && istWiedereinstieg();
  const groesse = `Sitzungsgröße: ${SETTINGS.sessionSize===9999?'alle':SETTINGS.sessionSize} Karten pro Runde${SETTINGS.wrongOnly?' · Nur falsche Wörter':''}`;
  animateNumber(document.getElementById('dueCount'), pool.length);
  document.getElementById('dueSub').textContent = pool.length
    ? (zurueck ? `Willkommen zurück – wir fangen klein an · ${groesse}`
       : wartet > 0 ? `Heute dran · ${wartet} warten noch · ${groesse}`
       : groesse)
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
  /* ⭐ Das Intervall steht seit dem 18.08.2026 an der Kachel. Elias: „am besten
     schreibst du auch dazu bei den boxen in welchem intervall das abgefragt
     wird weil das ist aktuell nicht sichtbar und nicht transparent."

     Er hat recht: die Zahlen 1 bis 5 sagen von sich aus gar nichts. Erst mit
     „heute / 1 Tag / 3 Tage / 7 Tage / 16 Tage" wird sichtbar, was das
     Hochwandern eigentlich bewirkt — und warum eine Vokabel in Box 5 wochenlang
     nicht auftaucht.

     ⚠️ Die Zahlen kommen aus INTERVALS (js/kern.js) und werden NICHT hier noch
     einmal hingeschrieben. Zwei Listen derselben Zahlen laufen sonst
     auseinander, sobald jemand eine davon ändert — und die Anzeige log dann,
     ohne dass es auffällt. */
  const intervallText = b => {
    const t = INTERVALS[b];
    return t === 0 ? 'heute' : t === 1 ? '1 Tag' : `${t} Tage`;
  };
  document.getElementById('boxOverview').innerHTML = boxCounts.map((n,i)=>`
    <div class="box-pip${BOX_TON[i+1] ? ' box-'+BOX_TON[i+1] : ''}" data-openlist="box:${i+1}"><div class="n">${n}</div><div class="l">Box ${i+1}</div><div class="iv">${intervallText(i+1)}</div></div>
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

  /* ⛔⛔ DIE STATISTIK GEHOERT SEIT DEM 21.08.2026 ZU DIESEM BILDSCHIRM — und
     muss deshalb HIER mitlaufen, nicht nur beim Bildschirmwechsel.

     Elias mit Bildschirmfoto: „die box 5 mit 13 sicher stimmt nicht mit dem
     ueberein was die gruene (richtige) box sagt". Gemessen war die Box-Reihe
     bei 25 und die Statistik darunter bei 13 — und die fuenf Boxen summierten
     sich auf 240, waehrend „Vokabeln gesamt" 200 sagte. Eine Teilmenge, die
     groesser ist als ihre Menge: unmoeglich, also war eine der beiden Zahlen
     alt. [[unmoegliche_zahl_ist_ein_geschenk]]

     Die Ursache: renderHome() wird an DREIZEHN Stellen gerufen (Buchauswahl,
     Kapitelauswahl, Einstellungen, Zuruecktaste …), renderStats() stand an
     genau EINER — beim Wechsel auf den Startbildschirm. Wer die Auswahl
     aenderte, sah die Boxen sofort neu und die Statistik von vorhin.

     ⭐ Deshalb haengt sie jetzt am Ende von renderHome(): wer die eine Zahl
     neu rechnet, rechnet die andere mit. Ein zweiter Aufrufort waere wieder
     eine Stelle, die jemand vergisst.
     [[dieselbe_frage_zwei_antworten]] [[zweiter_aufruf_ueberschreibt_still]]

     ⚠️ `typeof`, weil js/statistik.js nach dieser Datei geladen wird. */
  if (typeof renderStats === 'function') renderStats();
  renderHeuteExtra();
}

/* ---------- „Heute zusätzlich" (09.09.2026) ----------

   Elias: „es wäre auch gut, wenn du mir auf dem startbildschirm noch täglich
   sagst das ich zusätzlich zu den 10 karten entweder im satzmodus noch übe
   oder am nächsten tag dann den hörmodus übe. immer abwechselnd soll das
   passieren."

   ⛔ Der Wechsel wird aus dem LERNTAG GERECHNET, nicht gespeichert. Ein
   gemerkter Zähler liefe zwischen Handy und Tablet auseinander, sobald er
   einen Tag nur auf einem Gerät öffnet — dann stünde auf beiden etwas
   anderes, und keiner der beiden Stände wäre falsch genug, um aufzufallen.
   Aus `todayStr(0)` folgt auf jedem Gerät dieselbe Zahl.
   [[dieselbe_frage_zwei_antworten]]

   ⚠️ `todayStr(0)` und nicht `new Date()`: der Lerntag der App beginnt um
   8 Uhr morgens, nicht um Mitternacht. Wer um 2 Uhr nachts übt, ist noch im
   Tag davor — und soll dann auch noch dieselbe Zusatzübung sehen.
   [[tagesbegriff_der_app_ist_utc]]

   ⭐ Die Zeile zeigt auch den STAND und wird grün, wenn das Tagesziel des
   jeweiligen Modus erreicht ist. Ein Hinweis, der nach dem Üben unverändert
   dasteht, sieht aus wie eine Mahnung — und wird ab dem dritten Tag
   überlesen. */
function heuteExtraModus(){
  /* Tage seit dem 1.1.1970 aus dem Lerntag; gerade → Sätze, ungerade → Hören. */
  const t = (typeof todayStr === 'function') ? todayStr(0) : '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (!m) return 'saetze';
  const tage = Math.floor(Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86400000);
  return (tage % 2 === 0) ? 'saetze' : 'hoeren';
}

function renderHeuteExtra(){
  const knopf = document.getElementById('heuteExtra');
  if (!knopf) return;
  const modus = heuteExtraModus();
  let stand = null, ziel = null, name, symbol, ziel_nav;

  if (modus === 'hoeren'){
    name = 'Hörmodus'; symbol = 'ic-ohr'; ziel_nav = 'hoeren';
    if (typeof hoerTag === 'function' && typeof hoerTagesziel === 'function'){
      stand = hoerTag().gesamt; ziel = hoerTagesziel();
    }
  } else {
    name = 'Satzmodus'; symbol = 'ic-chat'; ziel_nav = 'sentences';
    if (typeof satzTag === 'function' && typeof SATZ_TAGESZIEL === 'number'){
      stand = satzTag().gesamt; ziel = SATZ_TAGESZIEL;
    }
  }

  /* ⚠️ Fehlt der Zähler (das Modul ist nicht geladen), wird die Zeile trotzdem
     gezeigt — nur ohne Stand. Sie ganz wegzulassen hiesse, den Hinweis
     ausgerechnet dann zu verschlucken, wenn etwas nicht stimmt.
     [[ausfall_ist_unsichtbar_gebaut]] */
  const geschafft = (stand !== null && ziel !== null && stand >= ziel);
  const unten = (stand === null || ziel === null)
    ? 'Zusätzlich zu den Karteikarten'
    : geschafft ? `Geschafft — ${stand} von ${ziel}`
                : `${stand} von ${ziel} · zusätzlich zu den Karteikarten`;

  knopf.hidden = false;
  knopf.classList.toggle('geschafft', geschafft);
  knopf.dataset.nav = ziel_nav;
  knopf.innerHTML =
    '<svg class="ic"><use href="#' + (geschafft ? 'ic-check' : symbol) + '"/></svg>'
    + '<span class="hx-text">'
    +   '<span class="hx-titel">Heute zusätzlich: ' + name + '</span>'
    +   '<span class="hx-sub">' + unten + '</span>'
    + '</span>'
    + '<svg class="ic hx-pfeil"><use href="#ic-right"/></svg>';
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

