/* statistik.js -- Statistik
   Teil der App-Logik; wird in index.html in fester Reihenfolge geladen und
   teilt sich mit den uebrigen js/-Dateien den globalen Namensraum. */
/* ===================== STATS ===================== */
function renderStats(){
  const total = VOCAB_DATA.length;
  const mastered = VOCAB_DATA.filter(w=>PROGRESS[w.id] && PROGRESS[w.id].box===5).length;
  const totalCorrect = Object.values(PROGRESS).reduce((s,p)=>s+(p.correct||0),0);
  const totalWrong = Object.values(PROGRESS).reduce((s,p)=>s+(p.wrong||0),0);
  const acc = (totalCorrect+totalWrong) ? Math.round(100*totalCorrect/(totalCorrect+totalWrong)) : 0;

  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card"><div class="v" data-count="${total}">0</div><div class="l">Vokabeln gesamt</div></div>
    <div class="stat-card"><div class="v" data-count="${mastered}">0</div><div class="l">In Box 5 (sicher)</div></div>
    <div class="stat-card"><div class="v" data-count="${acc}" data-suffix="%">0%</div><div class="l">Trefferquote (in dieser App)</div></div>
    <div class="stat-card"><div class="v" data-count="${getStreak().count}">0</div><div class="l">Tage-Streak ${icon('flame')}</div></div>
  `;
  document.querySelectorAll('#statsGrid .v[data-count]').forEach(el=>{
    animateNumber(el, Number(el.dataset.count), el.dataset.suffix || '');
  });

  const boxCounts = [1,2,3,4,5].map(b => VOCAB_DATA.filter(w=>PROGRESS[w.id] && PROGRESS[w.id].box===b).length);
  document.getElementById('boxBars').innerHTML = boxCounts.map((n,i)=>`
    <div class="box-bar-row">
      <span class="bl">Box ${i+1}</span>
      <div class="box-bar-track"><div class="box-bar-fill" data-width="${total?Math.round(100*n/total):0}"></div></div>
      <span class="bn">${n}</span>
    </div>`).join('');
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

