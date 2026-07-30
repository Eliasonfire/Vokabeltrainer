/* feier.js -- Meilensteine und Rueckmeldung
   Teil der App-Logik; wird in index.html in fester Reihenfolge geladen und
   teilt sich mit den uebrigen js/-Dateien den globalen Namensraum.

   ===================== Warum es dieses Modul gibt =====================
   Elias' Wunsch vom 29.07.2026, woertlich: "Wenn man zum Beispiel eine Woche
   lang dauerhaft gelernt hat, dann kommt zum Beispiel Konfetti … Wenn man
   fuenfmal hintereinander bei den Karteikarten richtig war, dann kann auch so
   eine schoene Animation kommen, damit man Dopamin ausstoesst." Am 30.07.
   nachgereicht: "gerne auch insgesamt mehr Animationen in der App oder coole
   visuelle Effekte, sei da kreativ."

   ⭐ UND DIE LEITLINIE, DIE ER SELBST GESCHAERFT HAT, als ich einen Effekt bei
   jeder Karte vorgeschlagen hatte: "das ist eine richtig schlechte idee, mach
   das bitte nicht. in dieser app soll nichts nerven. im gegenteil, sie soll
   spass machen."

   Deshalb die Regel, an der jeder Eintrag unten gemessen wird: EINE ANIMATION
   MUSS ETWAS BEDEUTEN. Elias hat an manchen Tagen 148 faellige Karten - ein
   Effekt, der bei jeder feuert, ist nach zehn Minuten kein Dopamin mehr,
   sondern eine Bremse. Also Meilensteine und echte Rueckmeldung, keine Deko.

   ===================== Bauform =====================
   Eine TABELLE von Anlaessen, kein Code je Effekt - dieselbe Bauform, die Elias
   beim Satz-Modus und bei den Uebungsmodi verlangt hat. Ein neuer Anlass ist ein
   Eintrag in FEIER_ANLAESSE, und die Ausloeser im uebrigen Code rufen alle
   dieselbe Funktion `feiere(anlass, daten)`.

   ===================== Drei technische Auflagen =====================
   1. KEIN FREMDCODE. Das Konfetti ist auf <canvas> selbst gezeichnet.
   2. REDUCED_MOTION wird UEBERALL geprueft. Wer Animationen reduziert haben
      will, bekommt den Endzustand sofort und keinen Effekt.
   3. ⚠️ EIN EFFEKT DARF NIE DEN ENDZUSTAND TRAGEN. Bei unsichtbarer Seite
      feuert `requestAnimationFrame` nicht - genau daran hat die Statistik
      einmal dauerhaft 0 gezeigt. Alles hier ist reine Zutat: nimmt man dieses
      Modul weg, bleibt die App vollstaendig funktionsfaehig.
   4. Meilensteine feiern EINMAL. Der 7-Tage-Konfetti darf nicht bei jedem Start
      des siebten Tages wiederkommen; erreichte Meilensteine stehen in einem
      eigenen localStorage-Schluessel.
   ===================================================================== */

const FEIER_KEY = 'vt_feiern';
let FEIERN = LS.get(FEIER_KEY, {});
const feierMerken = (marke) => { FEIERN[marke] = todayStr(0); LS.set(FEIER_KEY, FEIERN); };

/* Serien-Meilensteine. Sieben ist Elias' eigener Vorschlag; die uebrigen sind
   die naheliegende Fortsetzung und bewusst weit auseinander - ein Meilenstein
   alle drei Tage waere keiner mehr. */
const SERIE_MEILEN = [7, 14, 30, 100];

/* ---------- Werkzeuge ---------- */

/* Eine Schicht ueber der ganzen App, in der Effekte leben. Sie faengt keine
   Klicks ab (pointer-events:none in der CSS) - ein Effekt darf das Bedienen
   nicht blockieren. */
function feierBuehne(){
  let el = document.getElementById('feierBuehne');
  if (!el){
    el = document.createElement('div');
    el.id = 'feierBuehne';
    el.className = 'feier-buehne';
    document.body.appendChild(el);
  }
  return el;
}

/* Kurze Einblendung in der Mitte. `stufe` steuert nur die Groesse: 'gross' fuer
   den Tagesabschluss, 'mittel' fuer eine Runde, 'klein' fuer alles andere. */
function feierBanner(text, unterzeile, stufe){
  const b = document.createElement('div');
  b.className = 'feier-banner feier-' + (stufe || 'klein');
  b.innerHTML = `<div class="fb-text">${escapeHtml(text)}</div>`
    + (unterzeile ? `<div class="fb-sub">${escapeHtml(unterzeile)}</div>` : '');
  feierBuehne().appendChild(b);
  /* Der Effekt entfernt sich selbst. Ohne das sammeln sich die Knoten an, und
     nach einer langen Sitzung liegen hundert unsichtbare Banner im Baum. */
  setTimeout(()=>b.remove(), stufe === 'gross' ? 2600 : 1700);
}

/* Ein kleiner Chip, der aufsteigt und verblasst - fuer die Boxaenderung.
   Er startet dort, wo das Auge schon ist: an der Karte. */
function feierChip(text, ton){
  const chip = document.createElement('div');
  chip.className = 'feier-chip' + (ton ? ' feier-chip-' + ton : '');
  chip.textContent = text;
  const karte = document.getElementById('flashcard');
  const r = karte ? karte.getBoundingClientRect() : null;
  /* ⚠️ Auf `r.width > 0` pruefen, nicht nur auf `karte`. Ein verborgenes Element
     EXISTIERT und liefert trotzdem lauter Nullen - der Chip landete dadurch in
     der linken obereren Ecke, im Browser nachgemessen (left: 0px). Nur ein
     Element mit Ausdehnung ist ein brauchbarer Anker. */
  if (r && r.width > 0){
    chip.style.left = (r.left + r.width / 2) + 'px';
    chip.style.top  = (r.top + r.height * 0.28) + 'px';
  } else {
    chip.style.left = '50%';
    chip.style.top = '38%';
  }
  feierBuehne().appendChild(chip);
  setTimeout(()=>chip.remove(), 1200);
}

/* Konfetti, selbst gezeichnet. Kein Fremdcode - Auflage aus dem Nachtplan und
   ausserdem die Hausregel "kein Backend, keine Abhaengigkeiten".

   Die Teilchen fallen mit Schwerkraft und drehen sich; die Farben kommen aus den
   CSS-Variablen der App, damit das Konfetti nicht wie aus einer anderen Welt
   aussieht. Nach `DAUER` ist Schluss, und das Canvas wird entfernt - ein
   endloses rAF haelt sonst das Geraet wach. */
function feierKonfetti(anzahl){
  if (REDUCED_MOTION) return;
  const buehne = feierBuehne();
  const cv = document.createElement('canvas');
  cv.className = 'feier-canvas';
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const B = window.innerWidth, H = window.innerHeight;
  cv.width = B * dpr; cv.height = H * dpr;
  cv.style.width = B + 'px'; cv.style.height = H + 'px';
  buehne.appendChild(cv);
  const ctx = cv.getContext('2d');
  ctx.scale(dpr, dpr);

  const stil = getComputedStyle(document.documentElement);
  /* Die Farben kommen aus den CSS-Variablen der App, damit das Konfetti nicht
     wie aus einer anderen Welt aussieht. An index.html nachgesehen, nicht
     geraten: --gold und --blue gibt es dort NICHT, die bunten Toene heissen
     --gram-*. Ein Fehlgriff waere hier stumm - getPropertyValue gibt fuer
     einen unbekannten Namen einen leeren String, und das Teilchen bliebe
     unsichtbar. */
  const farben = ['--red-bright','--green','--gram-mubtada','--gram-nasab','--gram-idafa','--text']
    .map(v => stil.getPropertyValue(v).trim()).filter(Boolean);
  if (farben.length < 3) farben.push('#ff4d6a', '#2ee6a6', '#ffffff');

  const N = anzahl || 90;
  const teile = [];
  for (let i = 0; i < N; i++){
    teile.push({
      x: B * (0.15 + Math.random() * 0.7),
      y: -20 - Math.random() * H * 0.3,
      vx: (Math.random() - 0.5) * 2.4,
      vy: 2 + Math.random() * 3.2,
      w: 5 + Math.random() * 6,
      h: 3 + Math.random() * 5,
      dreh: Math.random() * Math.PI,
      dv: (Math.random() - 0.5) * 0.22,
      farbe: farben[(Math.random() * farben.length) | 0]
    });
  }

  const DAUER = 2600;
  let t0 = null;
  function schritt(t){
    if (t0 === null) t0 = t;
    const vergangen = t - t0;
    ctx.clearRect(0, 0, B, H);
    teile.forEach(p => {
      p.vy += 0.045;                       // Schwerkraft
      p.x += p.vx; p.y += p.vy; p.dreh += p.dv;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.dreh);
      ctx.globalAlpha = Math.max(0, 1 - vergangen / DAUER);
      ctx.fillStyle = p.farbe;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (vergangen < DAUER) requestAnimationFrame(schritt);
    else cv.remove();
  }
  requestAnimationFrame(schritt);
  /* ⚠️ Zweiter Weg zum Aufraeumen, und er ist nicht nur Vorsicht. Auf einer
     unsichtbaren Seite feuert `requestAnimationFrame` GAR NICHT - dann laeuft
     `schritt` nie, und das Canvas bliebe fuer immer im Baum stehen. Im Browser
     nachgemessen: nach sieben Aufrufen in einem verborgenen Tab lagen sieben
     Canvasse uebereinander. Dieselbe Falle, an der die Statistik einmal
     dauerhaft 0 gezeigt hat - nur sind hier die Folgen milder.
     `setTimeout` wird in verborgenen Tabs gebremst, aber es feuert. */
  setTimeout(()=>cv.remove(), DAUER + 400);
}

/* Ein Element kurz eine Klasse tragen lassen. Das `void offsetWidth` erzwingt
   den Neuaufbau - ohne das feuert dieselbe Animation zweimal hintereinander
   nicht, weil sich die Klassenliste nicht wirklich geaendert hat. */
const FEIER_PULS_KLASSEN = ['feier-rand','feier-gut','feier-zittern','feier-aufleuchten'];
function feierPuls(el, klasse, ms){
  if (!el || REDUCED_MOTION) return;
  /* ⚠️ Erst ALLE Effektklassen weg, nicht nur die eigene. Sonst tragen zwei
     Effekte gleichzeitig an demselben Element: im Browser nachgemessen stand
     nach einer richtigen und einer schnell folgenden falschen Antwort
     "ueb-satz feier-gut feier-zittern" da - der gruene Schimmer der vorigen
     Antwort lag noch auf dem Zittern der neuen. Der Aufraeum-Timer des ersten
     Effekts war einfach noch nicht gelaufen. */
  FEIER_PULS_KLASSEN.forEach(k => el.classList.remove(k));
  void el.offsetWidth;
  el.classList.add(klasse);
  setTimeout(()=>el.classList.remove(klasse), ms || 700);
}

/* ---------- Die Tabelle ----------
   `einmalig(daten)` gibt eine Marke zurueck; ist sie schon gespeichert,
   passiert nichts. Fehlt die Funktion, darf der Anlass beliebig oft feuern -
   das ist bei Rueckmeldung am Ort der Antwort richtig und bei Meilensteinen
   falsch. */
const FEIER_ANLAESSE = {

  /* Elias' ausdruecklicher Wunsch, und der einzige Anlass mit Konfetti. Genau
     deshalb ist es Konfetti: es soll der seltenste Effekt der App bleiben. */
  'serie-meilenstein': {
    einmalig: d => `serie-${d.tage}`,
    effekt: d => {
      feierKonfetti(d.tage >= 30 ? 140 : 90);
      feierBanner(`${d.tage} Tage in Folge`, 'Serie gehalten — weiter so.', 'gross');
    }
  },

  /* Sein zweiter ausdruecklicher Wunsch. Bewusst KEIN Konfetti: fuenf richtige
     kommen mehrmals je Sitzung, und der Meilenstein oben wuerde entwertet. */
  'fuenf-richtig': {
    effekt: d => {
      const karte = document.getElementById('flashcard');
      feierPuls(karte, 'feier-rand', 900);
      feierChip(`${d.serie}× richtig`, 'gut');
    }
  },

  /* Der wichtigste Moment je Wort - und bisher voellig unsichtbar. Wer eine
     Vokabel in Box 5 bringt, hat sie gelernt. Einmalig je Wort: faellt sie
     spaeter zurueck und steigt wieder auf, ist das keine Premiere mehr. */
  'box-5': {
    einmalig: d => `box5-${d.id}`,
    effekt: d => {
      feierKonfetti(38);
      feierBanner('Sitzt!', `${d.wort} ist in Box 5.`, 'mittel');
    }
  },

  /* Die Boxaenderung passiert heute unsichtbar. Ein Chip, der aufsteigt und
     verblasst, sagt sie ohne den Lernfluss zu bremsen. */
  'box-auf': {
    effekt: d => feierChip(`Box ${d.von} → ${d.nach}`, 'gut')
  },
  'box-ab': {
    effekt: d => feierChip(`Box ${d.von} → ${d.nach}`, 'schlecht')
  },

  /* ⭐ Elias am 30.07. ausdruecklich nachgefordert: "du kannst auch eine schoene
     animation machen wenn ich meine vokabel karten fuer heute geuebt habe. also
     aktuell sinds 20 karten die ich uebe pro sitzung". */
  'runde-fertig': {
    effekt: d => {
      feierKonfetti(55);
      feierBanner('Runde geschafft', `${d.karten} Karten durch.`, 'mittel');
    }
  },

  /* ⚠️ NICHT dasselbe wie die Runde, und das ist der ganze Punkt. Bei 148
     faelligen Karten sind das sieben Runden - das Tagesziel ist der seltenere
     und damit groessere Anlass. Die beiden Effekte muessen sich deutlich
     unterscheiden, sonst wirkt der grosse entwertet. Einmal je Tag. */
  'alles-faellig': {
    einmalig: () => `tag-${todayStr(0)}`,
    effekt: d => {
      feierKonfetti(160);
      feierBanner('Alles für heute geschafft', d.zahl
        ? `${d.zahl} Karten heute wiederholt.` : 'Nichts mehr fällig.', 'gross');
    }
  },

  /* Rueckmeldung genau dort, wo man hinsieht. Kein Meilenstein, darf oft. */
  'luecke-richtig': {
    /* Nicht der Satz: nach dem Loesen baut renderSentence() den Satz neu auf
       und die Luecke ist verschwunden - ein Puls darauf traefe ins Leere.
       Das Wort in der Antwortzeile steht dagegen sicher da. */
    effekt: () => feierPuls(document.querySelector('#lueckeAntwort .luecke-wort'), 'feier-aufleuchten', 900)
  },
  'uebung-richtig': {
    effekt: () => feierPuls(document.getElementById('uebSatz'), 'feier-gut', 620)
  },
  'uebung-falsch': {
    effekt: () => feierPuls(document.getElementById('uebSatz'), 'feier-zittern', 420)
  },

  /* Zehn richtige in einer Uebungsrunde - dieselbe Ueberlegung wie bei den
     fuenf Karten, nur im Satz-Modus. */
  'uebung-serie': {
    effekt: d => feierChip(`${d.serie}× richtig`, 'gut')
  }
};

/* ---------- Der einzige Eingang ----------
   Alle Ausloeser im uebrigen Code rufen diese Funktion. Sie ist absichtlich
   still, wenn etwas fehlt: ein unbekannter Anlass oder ein Fehler im Effekt
   darf niemals das Lernen unterbrechen. */
function feiere(anlass, daten){
  const a = FEIER_ANLAESSE[anlass];
  if (!a) return;
  const d = daten || {};
  if (a.einmalig){
    const marke = a.einmalig(d);
    if (FEIERN[marke]) return;
    feierMerken(marke);
  }
  /* REDUCED_MOTION: die Meilenstein-Marke wird trotzdem gesetzt (sonst feiert
     die App denselben Meilenstein spaeter nachtraeglich), nur der Effekt
     entfaellt. Ein Banner ohne Bewegung ist erlaubt und bleibt. */
  try { a.effekt(d); } catch (e) { /* Effekte duerfen nie stoeren */ }
}

/* Von js/uebung.js aufgerufen. Zaehlt die Serie innerhalb der Uebungsrunde. */
let UEBUNG_SERIE = 0;
function feiereUebung(richtig, stand){
  if (richtig){
    UEBUNG_SERIE++;
    feiere('uebung-richtig');
    if (UEBUNG_SERIE > 0 && UEBUNG_SERIE % 10 === 0) feiere('uebung-serie', { serie: UEBUNG_SERIE });
  } else {
    UEBUNG_SERIE = 0;
    feiere('uebung-falsch');
  }
}
