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

