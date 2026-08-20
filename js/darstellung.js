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
    /* ⛔ Elias am 19.08.2026: „wenn ich hier bei den listen am handy
       runtergescrollt habe und wieder hoch scrollen möchte dann geht das nicht
       sondern die app aktualisiert sich."

       Die Ursache: `main.scrollTop` ist 0, weil nicht die SEITE gerollt wurde,
       sondern ein Behaelter darin (das Modus-Blatt hat `overflow-y:auto`).
       Die Geste sah also einen oberen Anschlag, den es fuer den Finger gar
       nicht gab — und lud die App neu.

       ⭐ Deshalb nicht auf einzelne Bauteile pruefen, sondern auf die
       EIGENSCHAFT: liegt unter dem Finger irgendein eigener Rollbereich,
       gehoert die Geste ihm. Eine Liste von IDs waere beim naechsten
       aufklappbaren Ding wieder unvollstaendig.
       [[geste_auf_rollflaeche]] */
    for (let el = e.target; el && el !== main; el = el.parentElement){
      if (!el.getBoundingClientRect) continue;
      const art = getComputedStyle(el).overflowY;
      if ((art === 'auto' || art === 'scroll') && el.scrollHeight > el.clientHeight + 1) return;
    }
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


/* ---------- Hoehe der unteren App-Leiste messen ----------
   Elias am 19.08.2026: „hier ist so eine lücke und die sieht nicht schön
   aus … damit wir mehr platz raus holen."

   Die schwebenden Leisten sassen auf einer geratenen 78 px, die App-Leiste
   ist 66 px hoch — 12 px Luft, die niemand wollte. Statt die Zahl zu
   ersetzen, wird sie hier gemessen: ihre Hoehe haengt an Schriftgroesse und
   Geraeterand, und beides kann sich aendern.

   ⚠️ `getBoundingClientRect().height` enthaelt den Safe-Area-Rand bereits —
   die Leiste rechnet ihn in ihr eigenes Padding. Wer hier nochmal
   `--safe-bottom` addiert, baut die Luecke wieder ein. */
(function leisteMessen(){
  const leiste = document.querySelector('.bottombar');
  if (!leiste) return;
  const setzen = ()=>{
    const h = Math.round(leiste.getBoundingClientRect().height);
    if (h > 0) document.documentElement.style.setProperty('--leiste-unten', h + 'px');
  };
  setzen();
  addEventListener('resize', setzen);
  /* Nach dem Laden der Schriften kann sie eine Spur anders sein. */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(setzen);
})();

/* ===================== AKZENTFARBE (20.08.2026) =====================

   Elias, nachdem er die Vergleichsseite durchgesehen hatte: „die farben die
   ich umrahmt habe gefallen mir, die anderen können verworfen werden. du
   sollst am besten alle die mir gefallen in den einstellungen für mich
   verfügbar machen (das alte sollte gekennzeichnet werden)."

   ⭐ WARUM GERECHNET UND NICHT JE FARBE HINTERLEGT

   An der Akzentfarbe hängen sieben Variablen, nicht eine: --red, --red-bright,
   --red-soft, --red-dim, --red-glow, --red-wash und --accent-grad. Fünf Farben
   × sieben Werte wären 35 Zahlen von Hand — und beim nächsten Farbwunsch
   nochmal sieben. Die Ableitung ist deshalb aus der HEUTIGEN Familie um
   #ff1744 zurückgerechnet:

       bright = L+10        soft = L+20
       dim    = L-34, S-21  rand = L-12, S-15

   Gegengeprüft an #ff1744 selbst: die Formel muss die vorhandenen Werte
   wieder herausgeben, sonst stimmt sie nicht. Genau dafür steht unten der
   Sonderfall — bei der heutigen Farbe werden die HANDGEPFLEGTEN Werte aus
   index.html gesetzt, nicht die gerechneten. Sie sind über Wochen an echten
   Flächen nachgemessen worden (--rand-wrongonly bei Kontrast 1,26), und eine
   Formel, die sie um ein Grad verfehlt, wäre kein Fortschritt.

   ⚠️ NICHT im :root von index.html ändern. Dort stehen die Voreinstellungen,
   die gelten, solange nichts gewählt ist — sie sind der Rückweg. */

const AKZENT_FARBEN = [
  { hex:'#ff1744', name:'Torch Red', heute:true },
  { hex:'#ff0000', name:'Rot pur' },
  { hex:'#0a84ff', name:'Azure' },
  { hex:'#0066ff', name:'Ultramarin' },
  { hex:'#00d2ff', name:'Cyan' }
];

function farbeZuHsl(hex){
  const r = parseInt(hex.slice(1,3),16)/255,
        g = parseInt(hex.slice(3,5),16)/255,
        b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max-min;
  let h = 0;
  if (d){
    if (max === r)      h = 60 * (((g-b)/d) % 6);
    else if (max === g) h = 60 * ((b-r)/d + 2);
    else                h = 60 * ((r-g)/d + 4);
  }
  if (h < 0) h += 360;
  const l = (max+min)/2;
  const s = d ? d / (1 - Math.abs(2*l - 1)) : 0;
  return [h, s*100, l*100];
}

function farbeAusHsl(h, s, l){
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  const c = (1 - Math.abs(2*l - 1)) * s, x = c * (1 - Math.abs((h/60) % 2 - 1)),
        m = l - c/2;
  let r=0,g=0,b=0;
  if      (h <  60){ r=c; g=x; }
  else if (h < 120){ r=x; g=c; }
  else if (h < 180){ g=c; b=x; }
  else if (h < 240){ g=x; b=c; }
  else if (h < 300){ r=x; b=c; }
  else             { r=c; b=x; }
  const f = v => ('0' + Math.round((v+m)*255).toString(16)).slice(-2);
  return '#' + f(r) + f(g) + f(b);
}

function akzentFamilie(hex){
  const [h,s,l] = farbeZuHsl(hex);
  const r = parseInt(hex.slice(1,3),16),
        g = parseInt(hex.slice(3,5),16),
        b = parseInt(hex.slice(5,7),16);
  return {
    basis:  hex,
    bright: farbeAusHsl(h+2, s, l+10),
    soft:   farbeAusHsl(h+2, s, l+20),
    dim:    farbeAusHsl(h, s-21, l-34),
    rand:   farbeAusHsl(h, s-15, l-12),
    glow:   'rgba(' + r + ',' + g + ',' + b + ',.34)',
    wash:   'rgba(' + r + ',' + g + ',' + b + ',.09)'
  };
}

/* ⛔ Der Sonderfall ist kein Schönheitsfehler, sondern Absicht: für die
   heutige Farbe gelten die handgepflegten Werte aus index.html, nicht die
   gerechneten. Sie sind an echten Flächen nachgemessen; die Formel trifft sie
   nah, aber nicht auf den Punkt. Wer sie hier überschreibt, verschlechtert
   den einzigen Zustand, der geprüft ist. */
const AKZENT_HEUTE = {
  basis:'#ff1744', bright:'#ff4d6a', soft:'#ff8095', dim:'#5e0b1c',
  rand:'#cb1036',
  glow:'rgba(255,23,68,.34)', wash:'rgba(255,23,68,.09)'
};

function wendeAkzentfarbeAn(hex){
  const gewaehlt = AKZENT_FARBEN.some(f => f.hex === hex) ? hex : '#ff1744';
  const f = gewaehlt === '#ff1744' ? AKZENT_HEUTE : akzentFamilie(gewaehlt);
  const w = document.documentElement.style;
  w.setProperty('--red',        f.basis);
  w.setProperty('--red-bright', f.bright);
  w.setProperty('--red-soft',   f.soft);
  w.setProperty('--red-dim',    f.dim);
  w.setProperty('--red-glow',   f.glow);
  w.setProperty('--red-wash',   f.wash);
  w.setProperty('--rand-wrongonly', f.rand);
  w.setProperty('--accent-grad', 'linear-gradient(135deg,' + f.basis + ' 0%,' + f.bright + ' 100%)');
  /* ⛔ Die Adressleiste bleibt SCHWARZ. Der erste Entwurf zog sie mit —
     nachgesehen steht in index.html aber <meta name="theme-color"
     content="#000000">, und das ist Absicht: die App ist OLED-schwarz, eine
     farbige Leiste darüber wäre ein Fremdkörper. Der Code dafür ist wieder
     raus, statt als wirkungslose Zeile stehen zu bleiben. */
  return gewaehlt;
}

/* Sofort anwenden, nicht erst wenn die Einstellungen geöffnet werden.
   ⚠️ Direkt aus dem Speicher gelesen statt über SETTINGS: dieses Modul lädt
   nach js/kern.js, aber vor allem, was zeichnet — so gibt es kein Aufblitzen
   der alten Farbe. Dasselbe Muster nutzt wendePluralKartenAn() in kern.js. */
try {
  const s = (typeof LS !== 'undefined' && LS.get) ? (LS.get('vt_settings', {}) || {}) : {};
  if (s.akzentFarbe) wendeAkzentfarbeAn(s.akzentFarbe);
} catch (e) { /* gesperrter Speicher: dann bleibt die Voreinstellung, das ist der Rückweg */ }
