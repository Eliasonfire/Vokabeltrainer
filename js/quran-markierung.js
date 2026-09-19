/* =====================================================================
   ⭐⭐ FEHLERSTELLEN IM KORANTEXT MARKIEREN (20.09.2026, v536)
   =====================================================================

   Elias am 19.09.2026, vom Handy aus:

     „Ich will auch im Koran den Text markieren irgendwie können für Fehler
      zB wo ich tajweed etwas falsch mache. Dafür will ich das."

   Seine drei Entscheidungen am 19.09.2026 um 23:54:21, aus je drei
   Möglichkeiten gewählt:

     1. „ich will einzelne buchstaben machen" — nicht das ganze Wort und
        nicht den ganzen Vers.
     2. Farbe UND eigene Notiz — keine Liste fertiger Regelnamen.
     3. „Erst einmal nur markieren" — noch keine Übersichtsseite, auf der
        alle markierten Stellen gesammelt zum Üben stehen.

   ⛔⛔ DER TEXT WIRD NICHT ANGEFASST. Die Markierung wird ÜBER die Stelle
   gezeichnet, nicht in den Text hineingeschnitten. Der Grund ist das
   Arabische selbst: Buchstaben verbinden sich innerhalb eines Wortes, und
   diese Verbindung reißt in jedem Browser, sobald zwei Buchstaben in zwei
   verschiedenen Elementen stehen. Wer das Wort in `<span>` je Buchstabe
   zerlegt, bekommt lauter Einzelformen — im Muṣḥaf stünde dann ein anderes
   Schriftbild als im Leser. Dasselbe Verbot steht seit dem 13.09.2026 schon
   über quranWorte() in js/quran.js. [[zitieren_am_original]]

   ⭐ Das Werkzeug dafür heißt CSS Custom Highlight API: `new Range()` über
   die Zeichen, `new Highlight(...)` darum, `CSS.highlights.set(name, h)` —
   und in der Formatvorlage `::highlight(name){…}`. Der DOM bleibt dabei
   unverändert, es entsteht kein einziges neues Element im Text. Die
   Markierung liegt darüber wie eine Rechtschreibwelle im Schreibprogramm.

   ⚠️ Erlaubt sind in `::highlight()` nur `color`, `background-color`,
   `text-decoration` (samt Longhands) und `text-shadow`. Kein Rahmen, keine
   Polsterung, keine Schriftgröße — deshalb Fläche + Wellenlinie.

   ⚠️ Es gibt Browser ohne diese Schnittstelle (Chrome vor 105, Safari vor
   17.2, Firefox vor 149). Dort darf die Markierung nicht einfach unsichtbar
   sein — das wäre der stille Ausfall: Elias markiert, und nichts steht da.
   Der Rückfall färbt stattdessen das GANZE Wort ein (Klasse `tj-wort`).
   Ungenauer, aber sichtbar, und die Verbindung hält, weil ein Wort ohnehin
   in einem Element steht. [[ausfall_ist_unsichtbar_gebaut]]

   ---------------------------------------------------------------------
   DIE FORM IM SPEICHER — von Anfang an mit Zeitstempel

   ⛔ Aus der Notiz vom 19.09.2026, bevor die erste Zeile stand: „Den Speicher
   von Anfang an in der Form mit Zeitstempel je Eintrag anlegen
   (`{ id: { an, zeit } }`, wie `vt_hifzVerse` und `vt_notes`). Sonst
   überschreiben sich Handy und Tablet gegenseitig — genau der Fehler vom
   06.09.2026, und Elias will beide Geräte 1:1 identisch. Auch das Entfernen
   einer Markierung muss als `an: false` mitlaufen, sonst taucht sie vom
   anderen Gerät wieder auf."

   Also:

       vt_tajweed = { "sure:vers:wort": { an, stellen, zeichen, farbe,
                                          notiz, zeit } }

   `an: false` bleibt mit Zeitstempel stehen, statt gelöscht zu werden — ein
   fehlender Eintrag verliert jeden Vergleich „der jüngere Stempel gewinnt",
   und das Wegnehmen käme vom anderen Gerät zurück. [[ausfall_ist_unsichtbar_gebaut]]

   ⭐ Der Abgleich braucht dafür KEINEN neuen Zweig: js/sync.js führt
   `vt_bekannt` und Geschwister schon je Id nach Zeitstempel zusammen und
   liest dabei außer `zeit` nichts aus dem Eintrag. Der Schlüssel steht dort
   in derselben Liste — siehe die Begründung dort. [[allgemeine_regel_statt_listeneintrag]]

   ⚠️ EINE Markierung je WORT, nicht je Buchstabe — das ist MEINE Entscheidung
   vom 20.09.2026, nicht seine. Sie ist der Preis dafür, dass Farbe und Notiz
   zusammen an einer Stelle stehen: eine Notiz je Buchstabe hätte er viermal
   für dasselbe Wort tippen müssen. Mehrere Buchstaben desselben Wortes
   gehören deshalb in EINE Markierung (`stellen` ist eine Liste). Sollte er
   zwei verschiedene Fehler im selben Wort auseinanderhalten wollen, ist das
   hier die Stelle, die sich ändern muss. [[wirkung_an_der_quelle_stilllegen]]

   ⚠️ `stellen` sind ZEICHENPOSITIONEN im Wort, keine laufenden Nummern der
   Buchstaben. Ändert sich unten die Regel, wie Zeichen zu Buchstaben
   zusammengefasst werden, zeigt eine alte Markierung trotzdem noch auf
   dasselbe Zeichen. `zeichen` führt die markierten Buchstaben zusätzlich im
   Klartext mit — als Beleg, was gemeint war. [[zahlen_ohne_beleg]]
   ===================================================================== */

const TJ_SCHLUESSEL = 'vt_tajweed';

/* Vier Farben, mehr nicht. ⛔ KEIN Grün: in dieser App heißt Grün seit dem
   04.08.2026 „das kannst du auswendig", und eine Fehlerstelle ist das
   Gegenteil davon. Rot ist die Vorgabe — es ist die Farbe, die er ohnehin
   für „hier stimmt etwas nicht" liest. Die Namen stehen in der Karte, damit
   er sie benennen kann und nicht nur auf Punkte tippt. */
const TJ_FARBEN = [
  { id: 'rot',    name: 'Rot'    },
  { id: 'orange', name: 'Orange' },
  { id: 'blau',   name: 'Blau'   },
  { id: 'lila',   name: 'Lila'   }
];
const TJ_FARBE_VORGABE = 'rot';

/* Kombinierende Zeichen: alles, was KEIN eigener Buchstabe ist, sondern über
   oder unter dem vorigen sitzt — Ḥarakāt (U+064B–U+065F), das kleine Alif
   (U+0670), die quranischen Lesezeichen (U+06D6–U+06ED, ohne U+06DD/U+06DE,
   die eigenständig sind), das Dehnungszeichen Tatweel (U+0640) und die
   unsichtbaren Verbinder. Sie gehören zum Buchstaben davor; ohne diese
   Zusammenfassung hätte ein einziger Buchstabe drei antippbare Stellen.

   ⚠️ Gebraucht wird das nur als Rückfall — wo es `Intl.Segmenter` gibt (jeder
   Browser seit 2021), zählt dessen Einteilung in Graphem-Cluster, und die
   ist die gepflegte Fassung derselben Regel. */
const TJ_KOMBI = /[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0640\u200C\u200D]/;

/* Einmal gebaut und gemerkt: das Zerlegen kostet nichts, aber es passiert
   bei jedem Zeichnen für jedes markierte Wort. */
const TJ_CLUSTER_CACHE = new Map();

let TAJWEED = {};
let TJ_MODUS = false;
/* Was die Karte gerade bearbeitet. `stellen` ist ein Set, weil dasselbe
   Antippen sowohl setzt als auch wegnimmt. */
let TJ_OFFEN = null;

/* ---------------------------------------------------------------------
   Laden und Speichern
   --------------------------------------------------------------------- */

/* Liest den Speicher und bringt jeden Eintrag auf die volle Form. Ein
   kaputter oder halber Eintrag wird übergangen statt die App anzuhalten —
   der Leser muss auch dann laufen, wenn hier einmal Unsinn steht. */
function tajweedLaden(){
  const roh = LS.get(TJ_SCHLUESSEL, {}) || {};
  const raus = {};
  for (const [id, v] of Object.entries(roh)){
    if (!v || typeof v !== 'object') continue;
    raus[id] = {
      an: !!v.an,
      stellen: Array.isArray(v.stellen) ? v.stellen.map(Number).filter(n => Number.isInteger(n) && n >= 0) : [],
      zeichen: String(v.zeichen || ''),
      farbe: TJ_FARBEN.some(f => f.id === v.farbe) ? v.farbe : TJ_FARBE_VORGABE,
      notiz: String(v.notiz || ''),
      zeit: Number(v.zeit) || 0
    };
  }
  return raus;
}

function tajweedSpeichern(){ LS.set(TJ_SCHLUESSEL, TAJWEED); }

/* Die Markierung eines Wortes — oder null, wenn dort keine (mehr) steht.
   ⚠️ Ein Eintrag mit `an: false` ist NICHT dasselbe wie kein Eintrag: er ist
   die Tatsache „hier war eine und ist weggenommen worden", mit Datum. */
function tajweedStelle(sure, vers, wort){
  const e = TAJWEED[`${sure}:${vers}:${wort}`];
  return (e && e.an && e.stellen.length) ? e : null;
}

/* ---------------------------------------------------------------------
   Buchstaben eines Wortes
   --------------------------------------------------------------------- */

/* Zerlegt ein Wort in das, was Elias als „Buchstaben" sieht: Basiszeichen
   samt allem, was darüber und darunter sitzt. Liefert je Buchstabe die
   Zeichenposition, die Länge und den Text.

   ⚠️ Ein Wort kann ein Leerzeichen enthalten — quranWorte() fasst Tanwīn
   Fatḥ und folgendes Alif zu EINEM Wort zusammen (siehe dort). Das
   Leerzeichen bekommt keine eigene Stelle, es ist kein Buchstabe. */
function tajweedCluster(text){
  const s = String(text || '');
  if (TJ_CLUSTER_CACHE.has(s)) return TJ_CLUSTER_CACHE.get(s);
  let out = [];
  try {
    if (typeof Intl !== 'undefined' && Intl.Segmenter){
      const seg = new Intl.Segmenter('ar', { granularity: 'grapheme' });
      for (const st of seg.segment(s)) out.push({ i: st.index, len: st.segment.length, text: st.segment });
    }
  } catch (e){ out = []; }
  if (!out.length){
    for (let i = 0; i < s.length; i++){
      const z = s[i];
      if (out.length && TJ_KOMBI.test(z)){
        const v = out[out.length - 1];
        v.len += z.length; v.text += z;
      } else out.push({ i, len: z.length, text: z });
    }
  }
  const raus = out.filter(c => c.text.trim().length > 0);
  TJ_CLUSTER_CACHE.set(s, raus);
  return raus;
}

/* Welcher Buchstabe steht an dieser Zeichenposition? Genau der, der dort
   anfängt — und wenn die Zusammenfassungsregel sich einmal geändert hat,
   der, in dem die Position liegt. So zeigt eine alte Markierung weiter auf
   ihr Zeichen, statt lautlos zu verschwinden. */
function tajweedClusterAn(cluster, pos){
  for (const c of cluster) if (c.i === pos) return c;
  for (const c of cluster) if (pos > c.i && pos < c.i + c.len) return c;
  return null;
}

/* ---------------------------------------------------------------------
   Zeichnen im Lesetext
   --------------------------------------------------------------------- */

function tajweedKannHighlight(){
  return typeof CSS !== 'undefined' && CSS.highlights && typeof Highlight === 'function';
}

/* Baut alle Markierungen der offenen Sure neu auf.

   ⛔ Aufzurufen nach JEDEM Neuaufbau der Verse: die Bereiche zeigen auf
   Textknoten, und nach einem Neuaufbau sind das andere Knoten. Die alten
   zeigen dann ins Leere — sichtbar bleibt nichts, gemeldet wird nichts.
   Deshalb steht der Aufruf in renderVerses() an der Quelle, nicht bei den
   einzelnen Auslösern. [[wirkung_an_der_quelle_stilllegen]] */
function tajweedZeichnen(){
  const liste = document.getElementById('verseList');
  if (!liste) return;
  const sure = (typeof OFFENE_SURE !== 'undefined') ? OFFENE_SURE : null;

  /* Der Rückfall hinterlässt Klassen im DOM — die müssen zuerst weg, sonst
     bliebe eine weggenommene Markierung als Farbe stehen. */
  liste.querySelectorAll('.qw.tj-wort').forEach(el => {
    el.className = 'qw';
  });

  const proFarbe = {};
  TJ_FARBEN.forEach(f => { proFarbe[f.id] = []; });
  if (!sure){ tajweedHighlightsSetzen(proFarbe); return; }

  liste.querySelectorAll('.verse-item[data-versnr]').forEach(karte => {
    const vers = Number(karte.dataset.versnr);
    karte.querySelectorAll('.verse-ar .qw').forEach(span => {
      const wort = Number(span.dataset.w);
      const eintrag = tajweedStelle(sure, vers, wort);
      if (!eintrag) return;
      const knoten = span.firstChild;
      if (!knoten || knoten.nodeType !== 3) return;
      const cluster = tajweedCluster(knoten.nodeValue);
      if (!tajweedKannHighlight()){
        span.classList.add('tj-wort', 'tj-' + eintrag.farbe);
        return;
      }
      for (const pos of eintrag.stellen){
        const c = tajweedClusterAn(cluster, pos);
        if (!c) continue;
        try {
          const r = document.createRange();
          r.setStart(knoten, c.i);
          r.setEnd(knoten, c.i + c.len);
          proFarbe[eintrag.farbe].push(r);
        } catch (e){ /* Position passt nicht mehr zum Text: still übergehen */ }
      }
    });
  });
  tajweedHighlightsSetzen(proFarbe);
}

/* ⛔ NICHT CSS.highlights.clear() — das Register gehört der ganzen Seite,
   und ein Aufräumen dort würde fremde Markierungen mit wegwerfen, sobald es
   je eine gibt. Nur die eigenen Namen werden gesetzt und gelöscht. */
function tajweedHighlightsSetzen(proFarbe){
  if (!tajweedKannHighlight()) return;
  for (const f of TJ_FARBEN){
    const name = 'tajweed-' + f.id;
    const bereiche = proFarbe[f.id] || [];
    try {
      if (bereiche.length) CSS.highlights.set(name, new Highlight(...bereiche));
      else CSS.highlights.delete(name);
    } catch (e){ stillerFehler('Markierung zeichnen (' + f.id + ')', e); }
  }
}

/* ---------------------------------------------------------------------
   Der Modus
   --------------------------------------------------------------------- */

/* ⭐ Ein eigener Modus, kein Dauerzustand: ohne ihn öffnete jedes Antippen
   eines Wortes eine Karte, und das Aufdecken verdeckter Verse (js/quran.js)
   käme nie mehr zum Zug. Solange er läuft, liegt eine Marke am Leser, damit
   man ihn nicht versehentlich anlässt. */
function tajweedModusSetzen(an){
  TJ_MODUS = !!an;
  const liste = document.getElementById('verseList');
  if (liste) liste.classList.toggle('markier-modus', TJ_MODUS);
  const knopf = document.getElementById('btnTajweedModus');
  if (knopf) knopf.classList.toggle('an', TJ_MODUS);
  const text = document.getElementById('tajweedModusText');
  if (text) text.textContent = TJ_MODUS ? 'Markieren aus' : 'Markieren';
  if (TJ_MODUS && typeof toast === 'function') toast('Tippe ein Wort an');
  if (!TJ_MODUS) tajweedKarteSchliessen();
}

/* ---------------------------------------------------------------------
   Die Karte
   --------------------------------------------------------------------- */

/* Das angetippte Wort groß, damit ein Finger einen einzelnen Buchstaben
   trifft. Auch hier wird der Text NICHT zerlegt: die antippbaren Flächen
   liegen als eigene Kästchen darüber, ausgemessen mit denselben Bereichen,
   die auch die Markierung zeichnen. Eine Technik für beides — sonst
   beantworten zwei Stellen dieselbe Frage verschieden.
   [[entscheidung_gilt_fuer_das_zweite_werkzeug]] */
function tajweedKarteOeffnen(span, vers, wort){
  const sure = (typeof OFFENE_SURE !== 'undefined') ? OFFENE_SURE : null;
  if (!sure || !span) return;
  const text = span.textContent || '';
  const alt = TAJWEED[`${sure}:${vers}:${wort}`];
  TJ_OFFEN = {
    sure, vers, wort, text,
    stellen: new Set((alt && alt.an) ? alt.stellen : []),
    farbe: (alt && alt.farbe) || TJ_FARBE_VORGABE,
    notiz: (alt && alt.an) ? alt.notiz : '',
    gabEs: !!(alt && alt.an)
  };

  document.getElementById('tjTitel').textContent = `Sure ${sure}, Vers ${vers} · Wort ${wort}`;
  const wortEl = document.getElementById('tjWort');
  wortEl.textContent = text;
  document.getElementById('tjNotiz').value = TJ_OFFEN.notiz;
  document.getElementById('btnTajweedWeg').classList.toggle('hidden', !TJ_OFFEN.gabEs);
  tajweedFarbreiheBauen();

  document.getElementById('tajweedBackdrop').classList.remove('hidden');
  const karte = document.getElementById('tajweedKarte');
  karte.classList.remove('hidden');
  /* Erst sichtbar, dann messen: eine verborgene Karte hat keine Maße, und
     jedes Rechteck käme als 0 zurück. */
  tajweedFlaechenBauen();
  /* ⛔⛔ UND DANN NOCH EINMAL, wenn die Karte fertig aufgegangen ist.
     Gemessen am 20.09.2026: Die Karte fährt mit `popIn` auf, und das ist
     eine Skalierung. Wer WÄHRENDDESSEN misst, bekommt die Maße der noch
     kleinen Karte — beim ersten Öffnen war eine Fläche 1 Pixel breit statt
     49. Ein Fehler wird dabei nicht gemeldet; die Zahlen sehen nur falsch
     aus. Der zweite Aufbau ist billig und richtet es.
     ⚠️ Zusätzlich ein Zeitschloss: läuft das Gerät mit abgeschalteten
     Bewegungen, kommt `animationend` nie. [[leere_liste_ist_keine_messung]] */
  karte.addEventListener('animationend', ()=>{ if (TJ_OFFEN) tajweedFlaechenBauen(); }, { once:true });
  setTimeout(()=>{ if (TJ_OFFEN) tajweedFlaechenBauen(); }, 400);
  overlayAuf('tajweedKarte');
}

function tajweedKarteSchliessen(){
  const karte = document.getElementById('tajweedKarte');
  if (!karte || karte.classList.contains('hidden')) return;
  if (overlayZuUeberHistorie('tajweedKarte')) return;
  karte.classList.add('hidden');
  document.getElementById('tajweedBackdrop').classList.add('hidden');
  if (tajweedKannHighlight()){ try { CSS.highlights.delete('tajweed-wahl'); } catch (e){} }
  TJ_OFFEN = null;
}

function tajweedFarbreiheBauen(){
  const kasten = document.getElementById('tjFarben');
  kasten.innerHTML = TJ_FARBEN.map(f =>
    `<button class="tj-farbe tj-${f.id}${TJ_OFFEN && TJ_OFFEN.farbe === f.id ? ' an' : ''}" data-farbe="${f.id}">${f.name}</button>`
  ).join('');
}

/* Misst jeden Buchstaben des großen Wortes aus und legt eine Trefferfläche
   darüber. Die Flächen sind durchsichtig — sichtbar ist nur, was markiert
   ist, und das zeichnet dieselbe Highlight-Technik wie im Lesetext.

   ⚠️ Die Maße stehen in Pixeln relativ zur Bühne. Sie gelten nur für diese
   Zeichnung: dreht er das Gerät oder ändert die Schriftgröße, wird die Karte
   neu vermessen (siehe resize-Zuhörer unten). */
/* So groß wie es geht: die Schrift wächst, bis das Wort die Karte fast
   füllt. Gemessen am 20.09.2026 war das der Unterschied zwischen bedienbar
   und nicht bedienbar — bei der ersten Fassung war ein Buchstabe von
   ٱللَّهُ elf Pixel breit, und ein Finger deckt ungefähr vierzig.

   ⚠️ Gemessen wird der TEXT, nicht der Kasten: der Kasten ist immer so
   breit wie die Karte, das Wort steht mittig darin. */
const TJ_GROESSE_MAX = 132, TJ_GROESSE_MIN = 34;
/* Wie breit eine Trefferfläche mindestens sein muss. 34 Pixel ist die
   übliche Untergrenze für einen Finger; darunter tippt man daneben.
   Arabische Buchstaben sind schmal — bei ٱللَّهُ maß einer 19 Pixel. */
const TJ_FLAECHE_MIN = 34;
function tajweedWortGroesse(){
  const buehne = document.getElementById('tjBuehne');
  const wortEl = document.getElementById('tjWort');
  const knoten = wortEl && wortEl.firstChild;
  if (!buehne || !wortEl || !knoten || knoten.nodeType !== 3) return;
  const platz = Math.max(120, buehne.clientWidth - 24);
  const breite = ()=>{
    try {
      const r = document.createRange();
      r.selectNodeContents(wortEl);
      return r.getBoundingClientRect().width;
    } catch (e){ return 0; }
  };
  let px = TJ_GROESSE_MAX;
  wortEl.style.fontSize = px + 'px';
  while (px > TJ_GROESSE_MIN && breite() > platz){ px -= 4; wortEl.style.fontSize = px + 'px'; }
}

/* Wo fängt welche Trefferfläche an? Bekommt die ausgemessenen Buchstaben in
   Bildschirmreihenfolge (links nach rechts) und die Breite der Bühne,
   liefert n+1 Kanten.

   ⛔ Bewusst OHNE DOM: das ist die Rechnung, an der es hängt, und sie muss
   ohne Browser prüfbar sein (werkzeuge/pruefe-markierung.mjs). Eine Rechnung,
   die nur im laufenden Browser existiert, wird nie von einem Prüfer
   angefasst. [[werkzeug_ohne_aufrufer]] */
function tajweedKanten(sortiert, breite){
  const n = sortiert.length;
  if (!n) return [0];
  /* ⚠️ Der Streifen reicht nur ein Stück über das Wort hinaus, NICHT bis an
     den Kartenrand. Sonst bekäme der erste Buchstabe von ٱللَّهُ eine Fläche
     von 191 Pixeln (gemessen am 20.09.2026) — wer weit neben dem Wort tippt,
     meint keinen Buchstaben. */
  const UEBERHANG = 24;
  const noetig = TJ_FLAECHE_MIN * n;
  let von = Math.max(0, sortiert[0].links - UEBERHANG);
  let bis = Math.min(breite, sortiert[n - 1].rechts + UEBERHANG);
  /* Reicht der Streifen für die Mindestbreiten nicht, wächst er — erst nach
     beiden Seiten, und wo die Bühne zu Ende ist, in die andere Richtung. */
  if (bis - von < noetig){
    von = Math.max(0, von - (noetig - (bis - von)) / 2);
    bis = Math.min(breite, von + noetig);
    von = Math.max(0, bis - noetig);
  }
  const kanten = [von];
  for (let k = 1; k < n; k++) kanten.push((sortiert[k - 1].rechts + sortiert[k].links) / 2);
  kanten.push(bis);

  /* ⭐ Jetzt die Mindestbreite durchsetzen, einmal von links und einmal von
     rechts. Passt selbst die Bühne nicht, wird gleichmäßig geteilt — dann
     liegt die Fläche nicht mehr genau über ihrem Buchstaben, aber jede ist
     gleich gut erreichbar. Das ist die ehrlichere Aufteilung als lauter
     Flächen, die keiner trifft. */
  if (bis - von >= noetig){
    for (let k = 1; k <= n; k++) kanten[k] = Math.max(kanten[k], kanten[k - 1] + TJ_FLAECHE_MIN);
    for (let k = n - 1; k >= 0; k--) kanten[k] = Math.min(kanten[k], kanten[k + 1] - TJ_FLAECHE_MIN);
  } else {
    for (let k = 0; k <= n; k++) kanten[k] = von + (bis - von) * k / n;
  }
  return kanten;
}

function tajweedFlaechenBauen(){
  const buehne = document.getElementById('tjBuehne');
  const wortEl = document.getElementById('tjWort');
  const flaechen = document.getElementById('tjFlaechen');
  if (!buehne || !wortEl || !flaechen || !TJ_OFFEN) return;
  const knoten = wortEl.firstChild;
  flaechen.innerHTML = '';
  if (!knoten || knoten.nodeType !== 3) return;
  tajweedWortGroesse();

  const bb = buehne.getBoundingClientRect();
  const cluster = tajweedCluster(TJ_OFFEN.text);
  const wahl = [];
  /* Erst alle Buchstaben ausmessen, dann die Flächen verteilen — die Breite
     eines Buchstabens hängt von seinen Nachbarn ab. */
  const gemessen = [];
  for (const c of cluster){
    let rect = null, bereich = null;
    try {
      bereich = document.createRange();
      bereich.setStart(knoten, c.i);
      bereich.setEnd(knoten, c.i + c.len);
      rect = bereich.getBoundingClientRect();
    } catch (e){ continue; }
    if (!rect || !rect.width) continue;
    if (TJ_OFFEN.stellen.has(c.i) && bereich) wahl.push(bereich);
    gemessen.push({ c, links: rect.left - bb.left, rechts: rect.right - bb.left });
  }

  /* ⭐ Jede Fläche reicht bis zur MITTE zum Nachbarn. Zwei Gründe: ein
     arabischer Buchstabe ist oft nur zehn Pixel breit, und zwischen den
     Buchstaben darf kein toter Streifen liegen, auf dem ein Tipp ins Leere
     geht. So trifft jeder Tipp den nächstgelegenen Buchstaben.
     ⚠️ Sortiert nach Bildschirmlage, nicht nach Lesefolge: der Text läuft
     von rechts nach links, die Pixel nicht. */
  const sortiert = gemessen.slice().sort((a, b) => a.links - b.links);
  const kanten = tajweedKanten(sortiert, bb.width);
  const grenzen = new Map();
  sortiert.forEach((s, k) => { grenzen.set(s.c.i, { von: kanten[k], bis: kanten[k + 1] }); });

  /* Volle Höhe der Bühne: die Ḥaraka sitzt über dem Buchstaben, der
     Buchstabe selbst tief darunter — wer auf das Zeichen zielt, soll auch
     dann treffen, wenn er etwas zu hoch tippt. */
  for (const g of gemessen){
    const b = grenzen.get(g.c.i);
    const knopf = document.createElement('button');
    knopf.type = 'button';
    knopf.className = 'tj-flaeche' + (TJ_OFFEN.stellen.has(g.c.i) ? ' an' : '');
    knopf.dataset.pos = String(g.c.i);
    knopf.setAttribute('aria-label', 'Buchstabe ' + g.c.text);
    knopf.setAttribute('aria-pressed', TJ_OFFEN.stellen.has(g.c.i) ? 'true' : 'false');
    knopf.style.left = b.von + 'px';
    knopf.style.width = Math.max(1, b.bis - b.von) + 'px';
    knopf.style.top = '0px';
    knopf.style.height = bb.height + 'px';
    flaechen.appendChild(knopf);
  }
  /* Die Vorschau in der Karte trägt dieselbe Farbe wie später im Text —
     sonst wählt er hier Blau und findet im Leser etwas anderes wieder. */
  const buehneEl = document.getElementById('tjBuehne');
  if (buehneEl) buehneEl.dataset.farbe = TJ_OFFEN.farbe;
  if (tajweedKannHighlight()){
    try {
      if (wahl.length) CSS.highlights.set('tajweed-wahl', new Highlight(...wahl));
      else CSS.highlights.delete('tajweed-wahl');
    } catch (e){ stillerFehler('Markierung vorschauen', e); }
  }
}

/* ⭐ Speichern heißt hier: den Eintrag SETZEN, auch wenn nichts mehr gewählt
   ist. Eine leere Auswahl ist ein Wegnehmen — und ein Wegnehmen braucht
   einen Zeitpunkt, sonst holt es der Abgleich vom anderen Gerät zurück. */
function tajweedFertig(){
  if (!TJ_OFFEN) return;
  const { sure, vers, wort } = TJ_OFFEN;
  const id = `${sure}:${vers}:${wort}`;
  const stellen = [...TJ_OFFEN.stellen].sort((a, b) => a - b);
  const cluster = tajweedCluster(TJ_OFFEN.text);
  const notiz = (document.getElementById('tjNotiz').value || '').trim();
  const an = stellen.length > 0;
  /* Ein Eintrag, der sich NICHT geändert hat, behält seinen alten Stempel —
     sonst gälte jedes Öffnen der Karte als Änderung, und das zuletzt
     angefasste Gerät gewänne jeden Abgleich. Dieselbe Regel wie in
     hakenSpeichern() (js/quran.js). */
  const alt = TAJWEED[id];
  const gleich = alt && !!alt.an === an && alt.farbe === TJ_OFFEN.farbe
    && alt.notiz === notiz && String(alt.stellen) === String(stellen);
  if (!gleich){
    TAJWEED[id] = {
      an,
      stellen,
      zeichen: stellen.map(p => { const c = tajweedClusterAn(cluster, p); return c ? c.text : ''; }).join(' '),
      farbe: TJ_OFFEN.farbe,
      notiz: an ? notiz : '',
      zeit: Date.now()
    };
    tajweedSpeichern();
  }
  tajweedKarteSchliessen();
  tajweedZeichnen();
}

/* ---------------------------------------------------------------------
   Verdrahtung
   --------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', ()=>{
  TAJWEED = tajweedLaden();

  const modusKnopf = document.getElementById('btnTajweedModus');
  if (modusKnopf) modusKnopf.addEventListener('click', ()=> tajweedModusSetzen(!TJ_MODUS));

  /* ⛔ In der EINFANGENDEN Phase und mit stopPropagation: js/quran.js hört
     auf demselben Kasten und deckt beim Antippen verdeckte Verse auf. Ohne
     das Abfangen ginge beim Markieren jedes Mal auch der Vers auf. */
  const liste = document.getElementById('verseList');
  if (liste) liste.addEventListener('click', (e)=>{
    if (!TJ_MODUS) return;
    const span = e.target.closest && e.target.closest('.qw');
    if (!span) return;
    const karte = span.closest('.verse-item[data-versnr]');
    if (!karte) return;
    e.stopPropagation();
    e.preventDefault();
    tajweedKarteOeffnen(span, Number(karte.dataset.versnr), Number(span.dataset.w));
  }, true);

  const flaechen = document.getElementById('tjFlaechen');
  if (flaechen) flaechen.addEventListener('click', (e)=>{
    const knopf = e.target.closest('.tj-flaeche');
    if (!knopf || !TJ_OFFEN) return;
    const pos = Number(knopf.dataset.pos);
    if (TJ_OFFEN.stellen.has(pos)) TJ_OFFEN.stellen.delete(pos);
    else TJ_OFFEN.stellen.add(pos);
    tajweedFlaechenBauen();
  });

  const farben = document.getElementById('tjFarben');
  if (farben) farben.addEventListener('click', (e)=>{
    const knopf = e.target.closest('[data-farbe]');
    if (!knopf || !TJ_OFFEN) return;
    TJ_OFFEN.farbe = knopf.dataset.farbe;
    tajweedFarbreiheBauen();
    tajweedFlaechenBauen();
  });

  const fertig = document.getElementById('btnTajweedFertig');
  if (fertig) fertig.addEventListener('click', tajweedFertig);

  /* „Markierung weg" leert die Auswahl und speichert sofort — er muss nicht
     erst jeden Buchstaben einzeln wieder abwählen. */
  const weg = document.getElementById('btnTajweedWeg');
  if (weg) weg.addEventListener('click', ()=>{
    if (!TJ_OFFEN) return;
    TJ_OFFEN.stellen.clear();
    document.getElementById('tjNotiz').value = '';
    tajweedFertig();
  });

  const zu = document.getElementById('btnCloseTajweed');
  if (zu) zu.addEventListener('click', tajweedKarteSchliessen);
  const hinter = document.getElementById('tajweedBackdrop');
  if (hinter) hinter.addEventListener('click', tajweedKarteSchliessen);

  /* Dreht er das Gerät, stimmen die ausgemessenen Flächen nicht mehr. Die
     Markierungen im Text brauchen nichts davon — Bereiche wandern mit dem
     Text, das ist der Vorteil dieser Technik gegenüber gezeichneten Kästen. */
  window.addEventListener('resize', ()=>{ if (TJ_OFFEN) tajweedFlaechenBauen(); });
});
