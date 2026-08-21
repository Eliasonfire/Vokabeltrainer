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
  const totalCorrect = Object.values(PROGRESS).reduce((s,p)=>s+(p.correct||0),0);
  const totalWrong = Object.values(PROGRESS).reduce((s,p)=>s+(p.wrong||0),0);
  const acc = (totalCorrect+totalWrong) ? Math.round(100*totalCorrect/(totalCorrect+totalWrong)) : 0;

  /* ⛔ ZWEI KARTEN SIND AM 21.08.2026 ENTFALLEN, beide auf Elias' Zuruf:

       „Vokabeln gesamt"   — „das sehe ich auch ganz oben schon"
       „In Box 5 (sicher)" — „stimmt nicht mit dem ueberein was die gruene
                              (richtige) box sagt … kann man sich sparen"

     ⭐ Die Abweichung war ECHT und hatte eine Ursache, die mit dem Loeschen
     nicht verschwunden waere: renderStats() lief nur beim Bildschirmwechsel,
     renderHome() an dreizehn Stellen. Wer die Buch- oder Kapitelauswahl
     aenderte, sah oben neue und hier alte Zahlen — die Trefferquote und die
     Serie waren genauso betroffen. Behoben am Ende von renderHome().
     Erst die Ursache, dann die Kosmetik. [[erst_ursache_dann_zweite_massnahme]] */
  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card"><div class="v" data-count="${acc}" data-suffix="%">0%</div><div class="l">Trefferquote (in dieser App)</div></div>
    <div class="stat-card"><div class="v" data-count="${getStreak().count}">0</div><div class="l">Tage-Streak <span aria-hidden="true">🔥</span></div></div>
  `;
  document.querySelectorAll('#statsGrid .v[data-count]').forEach(el=>{
    animateNumber(el, Number(el.dataset.count), el.dataset.suffix || '');
  });
  if (typeof renderUebungskalender === 'function') renderUebungskalender();

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

/* ===================== UEBUNGSKALENDER (21.08.2026) =====================

   Elias: „bei der 8 tage streak faende ich es gut wenn da so eine art kalender
   ist der mir zeigt an welchem datum ich so geuebt habe und wann nicht und wie
   lange das schon so geht und so."

   Ein Feld je Tag, achtzehn Wochen weit, spaltenweise von Montag nach Sonntag.
   Angetippt sagt jedes Feld sein Datum und seine Kartenzahl.

   ⛔ ZWEI SORTEN VON FELDERN, und der Unterschied ist keine Feinheit:

     gezaehlt    — seit dem 21.08.2026 mitgeschrieben, die Zahl ist gemessen
     erschlossen — aus der laufenden Serie zurueckgerechnet: an dem Tag WURDE
                   geuebt, sonst waere die Serie gebrochen. Wie viel, weiss
                   niemand mehr.

   Erschlossene Felder sind deshalb nur umrandet und nicht gefuellt. Ein
   zurueckgerechneter Tag darf nicht aussehen wie ein gemessener.
   [[zahlen_ohne_beleg]] [[eingefrorenes_feld_ist_kein_zustand]] */
const KAL_WOCHEN = 18;

/* Wie viele Karten sind viel? Die Stufen sind an Elias' Sitzungsgroesse
   ausgerichtet (20 Karten je Runde), nicht frei geraten: eine Runde ist Stufe
   2, drei Runden sind die hoechste. */
function kalStufe(n){
  if (n >= 60) return 4;
  if (n >= 30) return 3;
  if (n >= 10) return 2;
  return 1;
}

function renderUebungskalender(){
  const kasten = document.getElementById('uebungskalender');
  if (!kasten) return;
  const tage = (typeof uebungstageAusSerieErgaenzen === 'function')
    ? uebungstageAusSerieErgaenzen() : (typeof getUebungstage === 'function' ? getUebungstage() : {});

  /* Bis zum Sonntag der laufenden Woche auffuellen, damit die letzte Spalte
     vollstaendig ist und „heute" nicht am Rand klebt. `todayStr` ist die
     einzige Datumsquelle der App — eine eigene Rechnung hier waere eine
     zweite Wahrheit ueber denselben Tag. */
  const heute = todayStr(0);
  const wtag = (new Date(heute).getDay() + 6) % 7;      // Mo=0 … So=6
  const bisSonntag = 6 - wtag;
  const felder = [];
  for (let i = KAL_WOCHEN * 7 - 1 - bisSonntag; i >= -bisSonntag; i--)
    felder.push(todayStr(-i));

  const monate = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
  let letzterMonat = -1;
  const kopf = [];
  for (let s = 0; s < KAL_WOCHEN; s++){
    const d = new Date(felder[s * 7]);
    const m = d.getMonth();
    kopf.push(m !== letzterMonat ? (letzterMonat = m, monate[m]) : '');
  }

  const zelle = (tag) => {
    const wert = tage[tag];
    const kommt = tag > heute;
    const klasse = kommt ? 'kal-zelle kal-spaeter'
      : wert === undefined ? 'kal-zelle'
      : wert === 0 ? 'kal-zelle kal-erschlossen'
      : 'kal-zelle kal-s' + kalStufe(wert);
    return `<button class="${klasse}" data-kaltag="${tag}"${kommt ? ' disabled' : ''} aria-label="${tag}"></button>`;
  };

  /* Kennzahlen. Die laufende Serie kommt aus vt_streak (sie kennt den
     Gnadentag), die uebrigen aus den aufgezeichneten Tagen — deshalb steht
     unten, seit wann aufgezeichnet wird. Eine Bestzahl ohne ihren Zeitraum
     ist keine Auskunft. [[trefferquote_ohne_preis]] */
  const alle = Object.keys(tage).sort();
  let laengste = 0, lauf = 0, vorher = null;
  for (const t of alle){
    lauf = (vorher && (new Date(t) - new Date(vorher)) === 86400000) ? lauf + 1 : 1;
    if (lauf > laengste) laengste = lauf;
    vorher = t;
  }
  const seit = alle.length ? new Date(alle[0]).toLocaleDateString('de-DE',
    { day:'numeric', month:'long', year:'numeric' }) : null;

  /* ⛔ Monatszeile, Wochentagsspalte und Gitter liegen in EINEM Raster, nicht
     nebeneinander in drei Kaesten. Zuerst stand die Monatszeile fuer sich und
     wurde mit `margin-left:calc(1.4rem + 6px)` an die Gitterkante gerechnet —
     gemessen war die Wochentagsspalte aber 14 px breit, nicht 22. Es sah nur
     deshalb richtig aus, weil sich zwei Fehler fast aufhoben (Versatz 1 px).
     Bei anderer Schriftgroesse — und die stellt Elias selbst ein — waere es
     auseinandergelaufen. Ein gemeinsames Raster kann gar nicht verrutschen.
     [[handliste_neben_echter_quelle]] */
  kasten.innerHTML = `
    <div class="kal-block">
      <div></div>
      <div class="kal-kopf">${kopf.map(m=>`<span>${m}</span>`).join('')}</div>
      <div class="kal-wtage"><span>Mo</span><span></span><span>Mi</span><span></span><span>Fr</span><span></span><span>So</span></div>
      <div class="kal-gitter">${felder.map(zelle).join('')}</div>
    </div>
    <div class="kal-zahlen">
      <div><b>${getStreak().count}</b><span>Tage am Stück</span></div>
      <div><b>${laengste}</b><span>längste Serie</span></div>
      <div><b>${alle.length}</b><span>Tage geübt</span></div>
    </div>
    <p class="kal-fuss">${seit
      ? `Aufgezeichnet seit ${seit}. Umrandete Felder sind aus deiner Serie erschlossen — dass du geübt hast, steht fest, die Kartenzahl nicht.`
      : 'Der Kalender füllt sich, sobald du das erste Mal übst.'}</p>
  `;
}

/* Angetippt sagt ein Feld, was es weiss. Delegation auf dem Kasten, damit der
   Handler das naechste Neuzeichnen ueberlebt — der Inhalt wird ersetzt, der
   Kasten nicht. */
document.addEventListener('click', (e)=>{
  const z = e.target.closest('[data-kaltag]');
  if (!z) return;
  const tag = z.dataset.kaltag;
  const tage = (typeof getUebungstage === 'function') ? getUebungstage() : {};
  const wert = tage[tag];
  const datum = new Date(tag).toLocaleDateString('de-DE',
    { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  toast(wert === undefined ? `${datum}: nicht geübt`
      : wert === 0 ? `${datum}: geübt (Anzahl nicht mehr bekannt)`
      : `${datum}: ${wert} ${wert === 1 ? 'Karte' : 'Karten'}`);
});
