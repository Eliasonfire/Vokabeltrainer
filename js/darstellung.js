/* darstellung.js -- Icons, Bewegungseinstellung, Zahlen-Animation
   Teil der App-Logik; wird in index.html in fester Reihenfolge geladen und
   teilt sich mit den uebrigen js/-Dateien den globalen Namensraum. */
/* ---------- Darstellung: Icons und Bewegung ----------
   Alle Icons kommen aus dem einen SVG-Sprite in index.html. Nie wieder Emoji
   in generiertem Markup - sonst sieht die Haelfte der App anders aus als die
   andere (je nach Geraet und Emoji-Font). */
function icon(name, extraClass){
  return `<svg class="ic${extraClass ? ' ' + extraClass : ''}" aria-hidden="true"><use href="#ic-${name}"/></svg>`;
}

/* Nutzer, die Animationen reduziert haben wollen, bekommen ueberall sofort den
   Endzustand. Wird von allen JS-Animationen unten geprueft, das CSS hat dafuer
   eine eigene prefers-reduced-motion-Regel. */
const REDUCED_MOTION = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

/* ---------- Ziehen zum Aktualisieren ----------
   Eigenbau, und der Grund ist ein Fehler, den ich selbst verursacht habe.

   Am 29.07.2026 kam `html,body{overflow:hidden}` dazu, damit die untere Leiste
   dauerhaft steht (siehe die Begruendung im CSS). Das nimmt dem Browser aber
   seine eingebaute Ziehgeste - Chrome zeigt seinen Kreis nur, wenn das DOKUMENT
   selbst am oberen Anschlag ueberzogen wird. Elias hat es sofort gemerkt: "ich
   kann jetzt bei der gesamten App nicht mehr nach unten ziehen, um die Seite zu
   aktualisieren."

   Beides zusammen geht nicht - also wird die Geste hier nachgebaut. Zwei
   Vorteile gegenueber der eingebauten:
   - sie wirkt auch in der installierten App, wo es gar keine Adressleiste und
     damit auch keine eingebaute Ziehgeste gibt
   - sie zieht an `main`, also genau an dem Bereich, der wirklich rollt

   Ausgeloest wird nur, wenn `main` ganz oben steht UND der Finger weit genug
   nach unten wandert. Waagerechte Bewegungen und alles, was auf einer
   Lernkarte oder einem Wortchip beginnt, sind ausgenommen - dort gibt es schon
   Wischen und Halten, und zwei Gesten am selben Ort schlagen sich.

   ⚠️ ZWEITER VERSUCH — der erste war mit Pointer-Events gebaut und hat auf
   Elias' Handy NICHT funktioniert ("das ist nicht wieder da", 30.07.2026).

   Warum Pointer-Events hier der falsche Weg sind: `main` ist selbst ein
   Rollbereich. Geht der Finger bei `scrollTop 0` nach unten, versucht der
   Browser sofort seine eigene Rollgeste - und sobald er die uebernimmt,
   schickt er ein `pointercancel` und stellt `pointermove` ein. Der alte Code
   beendete die Geste an dieser Stelle, bevor ueberhaupt Weg zusammengekommen
   war. Auf dem Schreibtisch mit der Maus fiel das nicht auf, weil dort keine
   Rollgeste beginnt.

   Touch-Events koennen das, was hier gebraucht wird: `touchmove` laeuft
   weiter, und mit `{ passive: false }` darf `preventDefault()` die Geste
   uebernehmen, bevor der Browser rollt. Das ist der uebliche Bau fuer
   Ziehen-zum-Aktualisieren, und er haengt an keiner Annahme darueber, wie ein
   Browser Zeiger waehrend einer Rollgeste behandelt.

   ⚠️ `{ passive: false }` ist bei `touchmove` PFLICHT. Ohne das ignoriert der
   Browser das preventDefault und rollt trotzdem - dann ist man wieder beim
   alten Fehler. */
const ZIEH_SCHWELLE = 78;

(function ziehenZumAktualisieren(){
  const main = document.getElementById('main');
  if (!main) return;

  const anzeige = document.createElement('div');
  anzeige.className = 'zieh-anzeige';
  anzeige.innerHTML = '<span class="zieh-ring"></span>';
  document.getElementById('app').appendChild(anzeige);

  let startY = 0, startX = 0, aktiv = false, uebernommen = false, weg = 0;

  function abbrechen(){
    aktiv = false; uebernommen = false; weg = 0;
    anzeige.classList.remove('zieht','bereit');
    anzeige.style.transform = '';
  }

  main.addEventListener('touchstart', (e)=>{
    if (e.touches.length !== 1){ abbrechen(); return; }   // zwei Finger: Zoom
    if (main.scrollTop > 0) return;                       // nur am oberen Anschlag
    if (e.target.closest('#flashcard, .word-chip, input, textarea')) return;
    startY = e.touches[0].clientY;
    startX = e.touches[0].clientX;
    aktiv = true; uebernommen = false; weg = 0;
  }, { passive: true });

  main.addEventListener('touchmove', (e)=>{
    if (!aktiv) return;
    const dy = e.touches[0].clientY - startY;
    const dx = e.touches[0].clientX - startX;

    /* Nach oben, eher waagerecht, oder main rollt doch: nicht unsere Geste. */
    if (dy <= 0 || Math.abs(dx) > Math.abs(dy) || main.scrollTop > 0){
      if (!uebernommen){ abbrechen(); return; }
    }
    /* Erst ab 12 px uebernehmen. Vorher koennte es noch ein Tippen sein, und
       ein preventDefault darauf wuerde Klicks verschlucken. */
    if (!uebernommen && dy < 12) return;
    uebernommen = true;
    e.preventDefault();                 // ab hier gehoert die Geste uns

    /* Gedaempft: 140 px Finger ergeben etwa 78 px Weg. Ohne die Daempfung
       fuehlt es sich an, als klebe die Seite am Finger. */
    weg = Math.max(0, Math.min(ZIEH_SCHWELLE + 26, dy * 0.55));
    anzeige.classList.add('zieht');
    anzeige.classList.toggle('bereit', weg >= ZIEH_SCHWELLE);
    anzeige.style.transform = `translateX(-50%) translateY(${weg}px) rotate(${weg * 3}deg)`;
  }, { passive: false });

  function loslassen(){
    if (!aktiv) return;
    const ausloesen = weg >= ZIEH_SCHWELLE;
    abbrechen();
    if (!ausloesen) return;
    anzeige.classList.add('laedt');
    /* Der Service Worker holt seit v27 Netz zuerst, ein normales Neuladen
       bringt also wirklich den neuen Stand. */
    setTimeout(()=>location.reload(), 220);
  }
  main.addEventListener('touchend', loslassen, { passive: true });
  main.addEventListener('touchcancel', ()=>abbrechen(), { passive: true });
})();

/* Zahlen zaehlen hoch statt umzuspringen - kleine Geste, macht Home und
   Statistik deutlich lebendiger. */
function animateNumber(el, to, suffix, dur){
  if (!el) return;
  suffix = suffix || '';
  dur = dur || 560;
  const from = parseInt(String(el.textContent).replace(/\D/g,''), 10) || 0;
  /* document.hidden: requestAnimationFrame feuert bei unsichtbarer Seite nicht
     (Hintergrund-Tab, abgedecktes PWA-Fenster) - dann muss der Endwert sofort
     stehen, sonst zeigt die Statistik dauerhaft 0. Der korrekte Wert darf nie
     von einer Animation abhaengen. */
  if (REDUCED_MOTION || from === to || document.hidden){ el.textContent = to + suffix; return; }
  const start = performance.now();
  el.textContent = from + suffix;
  (function step(now){
    const p = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(from + (to - from) * eased) + suffix;
    if (p < 1) requestAnimationFrame(step);
  })(performance.now());
}

