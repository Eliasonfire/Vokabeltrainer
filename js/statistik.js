/* statistik.js -- Statistik
   Teil der App-Logik; wird in index.html in fester Reihenfolge geladen und
   teilt sich mit den uebrigen js/-Dateien den globalen Namensraum. */
/* ===================== STATS ===================== */
function renderStats(){
  /* ⚠️ `bekannteVokabeln()` statt `buchVokabeln()` seit dem 17.08.2026 — Elias'
     Vorgabe, dass sich die Modi an seinem Wissensstand ausrichten. Die
     Gesamtzahl war vorher der geladene Buchbestand (311), nicht das, was er
     lernt (176). Eine Quote gegen einen fremden Nenner sagt nichts. */
  const total = bekannteVokabeln().length;
  const mastered = bekannteVokabeln().filter(w=>PROGRESS[w.id] && PROGRESS[w.id].box===5).length;
  const totalCorrect = Object.values(PROGRESS).reduce((s,p)=>s+(p.correct||0),0);
  const totalWrong = Object.values(PROGRESS).reduce((s,p)=>s+(p.wrong||0),0);
  const acc = (totalCorrect+totalWrong) ? Math.round(100*totalCorrect/(totalCorrect+totalWrong)) : 0;

  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card"><div class="v" data-count="${total}">0</div><div class="l">Vokabeln gesamt</div></div>
    <div class="stat-card"><div class="v" data-count="${mastered}">0</div><div class="l">In Box 5 (sicher)</div></div>
    <div class="stat-card"><div class="v" data-count="${acc}" data-suffix="%">0%</div><div class="l">Trefferquote (in dieser App)</div></div>
    <div class="stat-card"><div class="v" data-count="${getStreak().count}">0</div><div class="l">Tage-Streak <span aria-hidden="true">🔥</span></div></div>
  `;
  document.querySelectorAll('#statsGrid .v[data-count]').forEach(el=>{
    animateNumber(el, Number(el.dataset.count), el.dataset.suffix || '');
  });

  /* Elias am 29.07.2026: "man könnte bei den Boxen auch noch klarer darstellen,
     dass Box 1 schlecht ist und Box 5 sehr gut ist … Box 5 mit so einem
     grünlichen Rahmen wie wenn ich bei den Karteikarten etwas richtig
     beantworte, Box 1 so rot umrahmt wie bei falsch."

     Deshalb dieselben zwei Farben wie das Antwort-Feedback auf der Lernkarte
     (`.flashcard.answer-right` / `.answer-wrong`) — nicht zwei neue. Wer die
     Karte kennt, liest die Bedeutung hier ohne Legende mit.
     Box 2 bis 4 bleiben neutral: eine fünfstufige Farbskala würde behaupten,
     dass Box 3 schon „halb gut" ist, und das sagt das Leitner-System nicht. */
  const BOX_TON = { 1:'schlecht', 5:'gut' };
  const boxCounts = [1,2,3,4,5].map(b => bekannteVokabeln().filter(w=>PROGRESS[w.id] && PROGRESS[w.id].box===b).length);
  /* ⛔⛔ `#boxBars` GIBT ES SEIT DEM 21.08.2026 NICHT MEHR — und deshalb steht
     hier eine Abfrage statt eines direkten Zugriffs.

     Die Statistik ist an dem Tag auf den Startbildschirm gewandert, direkt
     unter die Box-Uebersicht. Die Balken zeigten dieselben fuenf Zahlen wie
     diese Uebersicht, nur anders gezeichnet; Elias hat sie auf Rueckfrage
     ausdruecklich weggelassen.

     ⚠️ Ohne diese Abfrage waere `getElementById('boxBars').innerHTML` ein
     Wurf auf `null` — und alles DANACH in dieser Funktion (Regelstand!) waere
     nie gelaufen, ohne dass die Oberflaeche etwas meldet. Der Kasten bleibt
     abgefragt statt geloescht, damit ein spaeteres Wiedereinsetzen des
     Balken-Kastens ohne Codeaenderung wirkt.
     [[befund_vor_dem_ende_der_funktion]] [[ausfall_ist_unsichtbar_gebaut]] */
  const balken = document.getElementById('boxBars');
  if (balken){
    balken.innerHTML = boxCounts.map((n,i)=>{
      const ton = BOX_TON[i+1] ? ` box-${BOX_TON[i+1]}` : '';
      return `
      <div class="box-bar-row${ton}">
        <span class="bl">Box ${i+1}</span>
        <div class="box-bar-track"><div class="box-bar-fill" data-width="${total?Math.round(100*n/total):0}"></div></div>
        <span class="bn">${n}</span>
      </div>`;
    }).join('');
    /* Breite erst im naechsten Frame setzen, damit die Balken sichtbar von 0
       aufwachsen (CSS-Transition auf width). Bei unsichtbarer Seite feuert rAF
       nicht - dann sofort setzen, der Wert darf nie von der Animation abhaengen. */
    const setBars = ()=>{
      document.querySelectorAll('#boxBars .box-bar-fill').forEach(el=>{
        el.style.width = el.dataset.width + '%';
      });
    };
    if (REDUCED_MOTION || document.hidden) setBars();
    else requestAnimationFrame(()=>requestAnimationFrame(setBars));
  }

  /* Ohne diese Zeile bliebe die Liste beim Oeffnen leer — und zwar ohne
     jede Fehlermeldung. Genau die Fehlerart, gegen die Punkt 9 gebaut ist. */
  renderRegelStand();
}

/* ---------- Regelfortschritt (Nachtplan 9) ----------

   Elias' Befund, den ich selbst gemeldet hatte: `vt_regelStand` wird seit v209
   geschrieben und geraetesynchron abgeglichen — aber NIRGENDS gezeigt.
   Gemessen und unsichtbar ist so gut wie nicht gemessen, und seine
   Regelauswahl soll sich darauf stuetzen.

   ⚠️ DREI Zahlen, die man nicht verwechseln darf:
     95  Regeln gibt es
     94  koennen im Uebungsmodus „Welche Regel?" ueberhaupt gefragt werden
      1  nicht: ta-marbuta-fem-01 ist `ausgeblendet` — Elias' Abbestellung vom
         29.07., nicht ein fehlender Beispielsatz.
   Ohne diesen Hinweis liest man „nie geuebt" als eigenes Versaeumnis.

   ⚠️ Jede Quote traegt ihren NENNER sichtbar daneben („4/6" statt „67 %").
   Eine Quote ohne Bezugsgroesse ist bei kleinen Zahlen wertlos: 1/1 sind
   100 % und sagen nichts. Aus demselben Grund gilt eine Regel erst ab drei
   Versuchen als „schwach" eingefaerbt. */
const REGEL_SORT = { art: 'schwach' };

function regelZeilen(){
  const stand = (typeof REGEL_STAND === 'object' && REGEL_STAND) ? REGEL_STAND : {};
  return GRAMMAR_RULES.map(r => {
    const e = stand[r.id] || { gestellt: 0, richtig: 0, zuletzt: null };
    return {
      id: r.id,
      name: r.name,
      gestellt: e.gestellt || 0,
      richtig: e.richtig || 0,
      zuletzt: e.zuletzt || null,
      abbestellt: !!r.ausgeblendet,
      quote: e.gestellt ? e.richtig / e.gestellt : null
    };
  });
}

function renderRegelStand(){
  const kasten = document.getElementById('regelStand');
  if (!kasten) return;
  const alle = regelZeilen();
  const geuebt = alle.filter(z => z.gestellt > 0);
  let liste;
  if (REGEL_SORT.art === 'nie'){
    liste = alle.filter(z => z.gestellt === 0);
  } else if (REGEL_SORT.art === 'neu'){
    liste = geuebt.slice().sort((a, b) => String(b.zuletzt).localeCompare(String(a.zuletzt)));
  } else {
    /* „Kann ich am schlechtesten" heisst: niedrigste Quote zuerst, und bei
       gleicher Quote die haeufiger gefragte — die ist besser belegt. */
    liste = geuebt.slice().sort((a, b) => (a.quote - b.quote) || (b.gestellt - a.gestellt));
  }

  if (!liste.length){
    kasten.innerHTML = '<div class="regel-hinweis">'
      + (REGEL_SORT.art === 'nie'
        ? 'Keine Regel ist ungeübt — alle 94 abfragbaren waren schon dran.'
        : 'Noch keine Regel geübt. Der Übungsmodus <b>„Welche Regel?"</b> füllt diese Liste.')
      + '</div>';
    return;
  }

  kasten.innerHTML = liste.map(z => {
    const ton = z.gestellt === 0 ? ' leer'
      : (z.gestellt >= 3 && z.quote < 0.6) ? ' schwach'
      : (z.gestellt >= 3 && z.quote >= 0.85) ? ' stark' : '';
    const quote = z.gestellt
      ? z.richtig + '/' + z.gestellt
      : '—';
    const wann = z.zuletzt ? tageHer(z.zuletzt) : (z.abbestellt ? 'abbestellt' : 'nie');
    return '<div class="rz' + ton + '">'
      + '<span class="rn">' + escapeHtml(z.name) + '</span>'
      + '<span class="rq">' + quote + '</span>'
      + '<span class="rd">' + wann + '</span></div>';
  }).join('')
  + '<div class="regel-hinweis">' + geuebt.length + ' von 94 abfragbaren Regeln geübt. '
  + 'Gespeist wird das nur aus <b>„Welche Regel?"</b> — die anderen zwölf Modi '
  + 'fragen Rollen und Fälle ab, keine benannte Regel.'
  + (REGEL_SORT.art === 'nie'
     ? ' ⛔ Eine Zeile trägt <b>abbestellt</b> statt <b>nie</b>: das ist '
       + '<b>تاء مربوطة</b>, die du am 29.07. abbestellt hast. Sie kann gar nicht '
       + 'gefragt werden — sie ist nicht ungeübt, sondern ausgeschaltet.'
     : '')
  + '</div>';
}

/* „vor 3 Tagen" statt eines Datums: die Frage ist nicht WANN, sondern WIE
   LANG HER. `zuletzt` steht als YYYY-MM-DD da, also wird auf Tagesgrenzen
   gerechnet und nicht auf Millisekunden — sonst waere „gestern abend" je nach
   Uhrzeit mal 0 und mal 1 Tag her. */
function tageHer(datum){
  const heute = todayStr(0);
  if (datum === heute) return 'heute';
  const d = (Date.parse(heute + 'T00:00:00') - Date.parse(datum + 'T00:00:00')) / 86400000;
  if (!isFinite(d) || d < 0) return datum;
  if (d === 1) return 'gestern';
  return 'vor ' + Math.round(d) + ' T';
}

document.addEventListener('click', (e)=>{
  const b = e.target.closest('#regelSortierung .rs');
  if (!b) return;
  REGEL_SORT.art = b.dataset.sort;
  document.querySelectorAll('#regelSortierung .rs').forEach(x =>
    x.setAttribute('aria-pressed', String(x === b)));
  renderRegelStand();
});
