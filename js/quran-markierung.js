/* =====================================================================
   ⭐⭐ FEHLERSTELLEN IM KORANTEXT MARKIEREN (20.09.2026, v536 → v538)
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

   ⛔⛔ JE BUCHSTABE EIGENE FARBE UND EIGENE NOTIZ (v538). In v536 hatte ich
   eine Markierung je WORT gebaut — mehrere Buchstaben desselben Wortes
   teilten sich Farbe und Notiz; das war als MEINE Entscheidung im Quelltext
   vermerkt. Elias am 20.09.2026 dazu: „übrigens kann ich innerhalb des
   gleichen wortes zwar mehrere buchstaben antippen aber jeder übernimmt
   die gleiche farbe und notiz ist auch nur für ein feld. irgendwie finde
   ich müssen wir das system dahinter nochmals etwas überdenken". Seitdem
   ist die Einheit der BUCHSTABE: jeder hat seinen eigenen Eintrag.
   [[wirkung_an_der_quelle_stilllegen]]

   ⭐ Und die Notiz ist auch OHNE die große Karte zu sehen (v538). Elias:
   „wenn ich einfach so auf den buchstaben tippe [kann ich] gar nicht meine
   notiz sehen. es sollte so ein kleines feld auftauchen wo ich aber noch
   den rest des korans sehe wo ich dann in klein meine notiz sehen kann am
   besten so unter dem wort". Deshalb der Zettel (unten): ein Tipp auf ein
   markiertes Wort zeigt seine Notizen unter dem Wort, der Koran bleibt
   stehen. Bearbeiten geht von dort in die große Karte.

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
   unverändert, es entsteht kein einziges neues Element im Text.

   ⚠️ Erlaubt sind in `::highlight()` nur `color`, `background-color`,
   `text-decoration` (samt Longhands) und `text-shadow`. Kein Rahmen, keine
   Polsterung, keine Schriftgröße. Und KEIN Hintergrund: der füllt die ganze
   Zeilenbox — über einem 120 Pixel hohen Wort stand ein 250 Pixel hoher
   Balken. Gefärbt wird der Buchstabe selbst, dazu eine GERADE Linie
   darunter (Elias 20.09.: „ich will das das unterstrichene gerade ist";
   die Wellenlinie zerfiel bei der Koranschrift in Stücke).

   ⚠️ Es gibt Browser ohne diese Schnittstelle (Chrome vor 105, Safari vor
   17.2, Firefox vor 149). Dort darf die Markierung nicht einfach unsichtbar
   sein — das wäre der stille Ausfall: Elias markiert, und nichts steht da.
   Der Rückfall färbt stattdessen das GANZE Wort ein (Klasse `tj-wort`).
   Ungenauer, aber sichtbar. [[ausfall_ist_unsichtbar_gebaut]]

   ---------------------------------------------------------------------
   DIE FORM IM SPEICHER — von Anfang an mit Zeitstempel

   ⛔ Aus der Notiz vom 19.09.2026, bevor die erste Zeile stand: „Den Speicher
   von Anfang an in der Form mit Zeitstempel je Eintrag anlegen
   (`{ id: { an, zeit } }`, wie `vt_hifzVerse` und `vt_notes`). Sonst
   überschreiben sich Handy und Tablet gegenseitig — genau der Fehler vom
   06.09.2026, und Elias will beide Geräte 1:1 identisch. Auch das Entfernen
   einer Markierung muss als `an: false` mitlaufen, sonst taucht sie vom
   anderen Gerät wieder auf."

   Also, seit v538 je BUCHSTABE:

       vt_tajweed = { "sure:vers:wort:position": { an, zeichen, farbe,
                                                   notiz, zeit } }

   `position` ist die ZEICHENPOSITION im Wort, keine laufende Nummer des
   Buchstabens. Ändert sich unten die Regel, wie Zeichen zu Buchstaben
   zusammengefasst werden, zeigt eine alte Markierung trotzdem noch auf
   dasselbe Zeichen. `zeichen` führt den Buchstaben im Klartext mit — als
   Beleg, was gemeint war. [[zahlen_ohne_beleg]]

   `an: false` bleibt mit Zeitstempel stehen, statt gelöscht zu werden — ein
   fehlender Eintrag verliert jeden Vergleich „der jüngere Stempel gewinnt",
   und das Wegnehmen käme vom anderen Gerät zurück.

   ⚠️ Die Form von v536/v537 („sure:vers:wort" mit einer Liste `stellen`)
   wird beim Laden in Einzelbuchstaben aufgelöst; der alte Eintrag bleibt
   als `an:false` stehen, damit der Abgleich ihn nicht vom anderen Gerät
   zurückbringt. Ein Gerät mit der alten Fassung kann ihn wieder auf `an`
   setzen — dann wird er beim nächsten Laden erneut aufgelöst.

   ⭐ Der Abgleich braucht KEINEN eigenen Zweig: js/sync.js führt
   `vt_bekannt` und Geschwister je Id nach Zeitstempel zusammen und liest
   dabei außer `zeit` nichts aus dem Eintrag. [[allgemeine_regel_statt_listeneintrag]]
   ===================================================================== */

const TJ_SCHLUESSEL = 'vt_tajweed';

/* Vier Farben, mehr nicht. ⛔ KEIN Grün: in dieser App heißt Grün seit dem
   04.08.2026 „das kannst du auswendig", und eine Fehlerstelle ist das
   Gegenteil davon. Rot ist die Vorgabe. Die Namen stehen in der Karte,
   damit er sie benennen kann und nicht nur auf Punkte tippt. */
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

/* Wie breit eine Trefferfläche mindestens sein muss. 34 Pixel ist die
   übliche Untergrenze für einen Finger; darunter tippt man daneben.
   Arabische Buchstaben sind schmal — bei ٱللَّهُ maß einer 19 Pixel. */
const TJ_FLAECHE_MIN = 34;
const TJ_GROESSE_MAX = 132, TJ_GROESSE_MIN = 34;

/* Einmal gebaut und gemerkt: das Zerlegen kostet nichts, aber es passiert
   bei jedem Zeichnen für jedes markierte Wort. */
const TJ_CLUSTER_CACHE = new Map();

let TAJWEED = {};
let TJ_MODUS = false;
/* Was die große Karte gerade bearbeitet: das Wort, der AKTIVE Buchstabe
   (an ihm hängen Farbreihe und Notizfeld) und je Buchstabe sein Stand. */
let TJ_OFFEN = null;
/* Der kleine Zettel unter einem Wort im Lesetext. */
let TJ_ZETTEL = null;

/* ---------------------------------------------------------------------
   Laden und Speichern
   --------------------------------------------------------------------- */

function tajweedEintragNormal(v){
  return {
    an: !!v.an,
    zeichen: String(v.zeichen || ''),
    farbe: TJ_FARBEN.some(f => f.id === v.farbe) ? v.farbe : TJ_FARBE_VORGABE,
    notiz: String(v.notiz || ''),
    zeit: Number(v.zeit) || 0
  };
}

/* Liest den Speicher und bringt jeden Eintrag auf die Form je Buchstabe.
   Ein kaputter oder halber Eintrag wird übergangen statt die App
   anzuhalten — der Leser muss auch dann laufen, wenn hier Unsinn steht.

   ⚠️ Die Wort-Form von v536/v537 (drei Teile in der Id, Liste `stellen`)
   wird hier aufgelöst und sofort zurückgeschrieben. Das alte Wort bleibt
   als `an:false` stehen — siehe Kopf. */
function tajweedLaden(){
  const roh = LS.get(TJ_SCHLUESSEL, {}) || {};
  const raus = {};
  let aufgeloest = false;
  for (const [id, v] of Object.entries(roh)){
    if (!v || typeof v !== 'object') continue;
    const teile = id.split(':');
    if (teile.length === 4){
      raus[id] = tajweedEintragNormal(v);
      continue;
    }
    if (teile.length !== 3) continue;
    const alt = tajweedEintragNormal(v);
    if (Array.isArray(v.stellen) && v.stellen.length){
      const zeichen = String(v.zeichen || '').split(' ');
      v.stellen.map(Number).filter(n => Number.isInteger(n) && n >= 0).forEach((pos, k) => {
        const neuId = id + ':' + pos;
        if (!raus[neuId] || raus[neuId].zeit < alt.zeit)
          raus[neuId] = { an: alt.an, zeichen: zeichen[k] || '', farbe: alt.farbe, notiz: alt.notiz, zeit: alt.zeit };
      });
      aufgeloest = true;
    }
    raus[id] = { an: false, zeit: alt.zeit };
  }
  if (aufgeloest) LS.set(TJ_SCHLUESSEL, raus);
  return raus;
}

function tajweedSpeichern(){ LS.set(TJ_SCHLUESSEL, TAJWEED); }

/* Nach einem Geräteabgleich: js/sync.js schreibt direkt in den Speicher,
   die Variable hier weiß davon nichts. Gerufen aus ladeQuranStandNeu()
   (js/quran.js) — an derselben Stelle wie die Ḥifẓ-Haken. */
function tajweedNachAbgleich(){
  TAJWEED = tajweedLaden();
  tajweedZeichnen();
}

/* Die markierten Buchstaben eines Wortes, nach Position sortiert — oder
   eine leere Liste. ⚠️ Ein Eintrag mit `an: false` ist NICHT dasselbe wie
   kein Eintrag: er ist die Tatsache „hier war eine und ist weggenommen
   worden", mit Datum. Gezeichnet wird er nicht. */
function tajweedStellen(sure, vers, wort){
  const vorne = `${sure}:${vers}:${wort}:`;
  const raus = [];
  for (const [id, e] of Object.entries(TAJWEED)){
    if (!id.startsWith(vorne) || !e.an) continue;
    raus.push({ pos: Number(id.slice(vorne.length)), farbe: e.farbe, notiz: e.notiz, zeichen: e.zeichen });
  }
  return raus.sort((a, b) => a.pos - b.pos);
}

/* Alle markierten Wörter auf einmal, gruppiert — für das Zeichnen einer
   ganzen Sure. Einmal über die Einträge statt einmal je Wort über die
   Einträge: bei al-Baqara sind das 6000 Wörter. */
function tajweedJeWort(){
  const karte = new Map();
  for (const [id, e] of Object.entries(TAJWEED)){
    if (!e.an) continue;
    const teile = id.split(':');
    if (teile.length !== 4) continue;
    const wortId = teile.slice(0, 3).join(':');
    if (!karte.has(wortId)) karte.set(wortId, []);
    karte.get(wortId).push({ pos: Number(teile[3]), farbe: e.farbe, notiz: e.notiz, zeichen: e.zeichen });
  }
  return karte;
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
  liste.querySelectorAll('.qw.tj-wort').forEach(el => { el.className = 'qw'; });

  const proFarbe = {};
  TJ_FARBEN.forEach(f => { proFarbe[f.id] = []; });
  if (!sure){ tajweedHighlightsSetzen('tajweed-', proFarbe); return; }

  const jeWort = tajweedJeWort();
  liste.querySelectorAll('.verse-item[data-versnr]').forEach(karte => {
    const vers = Number(karte.dataset.versnr);
    karte.querySelectorAll('.verse-ar .qw').forEach(span => {
      const stellen = jeWort.get(`${sure}:${vers}:${span.dataset.w}`);
      if (!stellen || !stellen.length) return;
      const knoten = span.firstChild;
      if (!knoten || knoten.nodeType !== 3) return;
      /* Fürs Antippen: das Wort weiß, dass es markiert ist (Zettel). */
      span.classList.add('tj-hat');
      if (!tajweedKannHighlight()){
        span.classList.add('tj-wort', 'tj-' + stellen[0].farbe);
        return;
      }
      const cluster = tajweedCluster(knoten.nodeValue);
      for (const st of stellen){
        const c = tajweedClusterAn(cluster, st.pos);
        if (!c) continue;
        try {
          const r = document.createRange();
          r.setStart(knoten, c.i);
          r.setEnd(knoten, c.i + c.len);
          proFarbe[st.farbe].push(r);
        } catch (e){ /* Position passt nicht mehr zum Text: still übergehen */ }
      }
    });
  });
  tajweedHighlightsSetzen('tajweed-', proFarbe);
}

/* ⛔ NICHT CSS.highlights.clear() — das Register gehört der ganzen Seite,
   und ein Aufräumen dort würde fremde Markierungen mit wegwerfen, sobald es
   je eine gibt. Nur die eigenen Namen werden gesetzt und gelöscht.
   `vorsatz` unterscheidet Lesetext („tajweed-") und Karte („tajweed-karte-"):
   beide leben gleichzeitig, und ein Neuzeichnen des einen darf das andere
   nicht leeren. */
function tajweedHighlightsSetzen(vorsatz, proFarbe){
  if (!tajweedKannHighlight()) return;
  for (const f of TJ_FARBEN){
    const name = vorsatz + f.id;
    const bereiche = proFarbe[f.id] || [];
    try {
      if (bereiche.length) CSS.highlights.set(name, new Highlight(...bereiche));
      else CSS.highlights.delete(name);
    } catch (e){ stillerFehler('Markierung zeichnen (' + name + ')', e); }
  }
}

/* ---------------------------------------------------------------------
   Der Modus
   --------------------------------------------------------------------- */

/* ⭐ Ein eigener Modus zum SETZEN: ohne ihn öffnete jedes Antippen eines
   Wortes die große Karte, und das Aufdecken verdeckter Verse (js/quran.js)
   käme nie mehr zum Zug. Das ANSEHEN einer Notiz braucht den Modus nicht —
   ein markiertes Wort zeigt seinen Zettel immer. */
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
   Der Zettel: die Notizen eines Wortes, klein, unter dem Wort
   --------------------------------------------------------------------- */

function tajweedZettelZeigen(span, sure, vers, wort){
  const zettel = document.getElementById('tajweedZettel');
  if (!zettel) return;
  const stellen = tajweedStellen(sure, vers, wort);
  if (!stellen.length){ tajweedZettelSchliessen(); return; }
  const text = span.textContent || '';
  const cluster = tajweedCluster(text);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  zettel.innerHTML = stellen.map(st => {
    const c = tajweedClusterAn(cluster, st.pos);
    const buchstabe = c ? c.text : st.zeichen;
    return `<div class="tz-zeile">
      <span class="tz-buchstabe tj-${st.farbe}" lang="ar" dir="rtl">${esc(buchstabe)}</span>
      <span class="tz-notiz${st.notiz ? '' : ' leer'}">${st.notiz ? esc(st.notiz) : 'ohne Notiz'}</span>
    </div>`;
  }).join('') + `<button class="btn btn-secondary btn-klein tz-bearbeiten" id="btnTajweedZettelBearbeiten">Bearbeiten</button>`;
  zettel.classList.remove('hidden');
  TJ_ZETTEL = { span, sure, vers, wort };

  /* Unter das Wort, waagerecht auf dessen Mitte, aber im Bild. Fest
     positioniert und beim Rollen geschlossen — ein Zettel, der beim Rollen
     mitfahren müsste, wäre ein zweiter Rollzuhörer für nichts. */
  const r = span.getBoundingClientRect();
  const b = zettel.getBoundingClientRect();
  const rand = 8;
  let links = r.left + r.width / 2 - b.width / 2;
  links = Math.max(rand, Math.min(links, window.innerWidth - b.width - rand));
  let oben = r.bottom + 6;
  if (oben + b.height > window.innerHeight - rand) oben = Math.max(rand, r.top - b.height - 6);
  zettel.style.left = links + 'px';
  zettel.style.top = oben + 'px';
}

function tajweedZettelSchliessen(){
  const zettel = document.getElementById('tajweedZettel');
  if (zettel) zettel.classList.add('hidden');
  TJ_ZETTEL = null;
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
  tajweedZettelSchliessen();
  const text = span.textContent || '';
  const buchstaben = new Map();
  for (const st of tajweedStellen(sure, vers, wort)) buchstaben.set(st.pos, { farbe: st.farbe, notiz: st.notiz });
  const vorher = new Map();
  for (const [pos, b] of buchstaben) vorher.set(pos, { farbe: b.farbe, notiz: b.notiz });
  TJ_OFFEN = { sure, vers, wort, text, buchstaben, vorher, aktiv: buchstaben.size ? [...buchstaben.keys()].sort((a, b) => a - b)[0] : null };

  document.getElementById('tjTitel').textContent = `Sure ${sure}, Vers ${vers} · Wort ${wort}`;
  document.getElementById('tjWort').textContent = text;
  tajweedKarteNachziehen();

  document.getElementById('tajweedBackdrop').classList.remove('hidden');
  const karte = document.getElementById('tajweedKarte');
  karte.classList.remove('hidden');
  /* Erst sichtbar, dann messen: eine verborgene Karte hat keine Maße, und
     jedes Rechteck käme als 0 zurück. */
  tajweedFlaechenBauen();
  /* ⛔⛔ UND DANN NOCH EINMAL, wenn die Karte fertig aufgegangen ist.
     Gemessen am 20.09.2026: Wer WÄHREND der Aufgeh-Bewegung misst, bekommt
     die Maße der noch bewegten Karte — beim ersten Öffnen war eine Fläche
     1 Pixel breit statt 49. Ein Fehler wird dabei nicht gemeldet; die
     Zahlen sehen nur falsch aus. Der zweite Aufbau ist billig und richtet
     es. ⚠️ Zusätzlich ein Zeitschloss: läuft das Gerät mit abgeschalteten
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
  const leer = {};
  TJ_FARBEN.forEach(f => { leer[f.id] = []; });
  tajweedHighlightsSetzen('tajweed-karte-', leer);
  TJ_OFFEN = null;
}

/* Farbreihe, Notizfeld, Hinweis und Knöpfe — alles hängt am AKTIVEN
   Buchstaben. Ohne aktiven Buchstaben sind Farbreihe und Notizfeld
   gesperrt: sonst stünde eine Farbe da, die zu nichts gehört. */
function tajweedKarteNachziehen(){
  if (!TJ_OFFEN) return;
  const aktiv = TJ_OFFEN.aktiv !== null ? TJ_OFFEN.buchstaben.get(TJ_OFFEN.aktiv) : null;
  const cluster = tajweedCluster(TJ_OFFEN.text);
  const c = TJ_OFFEN.aktiv !== null ? tajweedClusterAn(cluster, TJ_OFFEN.aktiv) : null;

  const hinweis = document.getElementById('tjHinweis');
  if (hinweis){
    if (aktiv && c) hinweis.innerHTML = 'Farbe und Notiz für <span class="tj-hinweis-buchstabe" lang="ar" dir="rtl"></span>';
    else hinweis.textContent = 'Tippe die Buchstaben an, bei denen es hakt.';
    const hb = hinweis.querySelector('.tj-hinweis-buchstabe');
    if (hb) hb.textContent = c.text;
  }

  const kasten = document.getElementById('tjFarben');
  kasten.innerHTML = TJ_FARBEN.map(f =>
    `<button class="tj-farbe tj-${f.id}${aktiv && aktiv.farbe === f.id ? ' an' : ''}" data-farbe="${f.id}"${aktiv ? '' : ' disabled'}>${f.name}</button>`
  ).join('');

  const notiz = document.getElementById('tjNotiz');
  notiz.value = aktiv ? aktiv.notiz : '';
  notiz.disabled = !aktiv;
  notiz.placeholder = aktiv ? 'Notiz zu diesem Buchstaben' : 'Erst einen Buchstaben antippen';

  document.getElementById('btnTajweedWeg').classList.toggle('hidden', !aktiv);
}

/* So groß wie es geht: die Schrift wächst, bis das Wort die Karte fast
   füllt. Gemessen am 20.09.2026 war das der Unterschied zwischen bedienbar
   und nicht bedienbar — bei der ersten Fassung war ein Buchstabe von
   ٱللَّهُ elf Pixel breit, und ein Finger deckt ungefähr vierzig.

   ⚠️ Gemessen wird der TEXT, nicht der Kasten: der Kasten ist immer so
   breit wie die Karte, das Wort steht mittig darin. */
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

/* Misst jeden Buchstaben des großen Wortes aus und legt eine Trefferfläche
   darüber. Die Flächen sind durchsichtig — sichtbar ist die Markierung
   selbst (Highlight in der jeweiligen Farbe) und beim aktiven Buchstaben
   ein Strich darunter.

   ⚠️ Die Maße stehen in Pixeln relativ zur Bühne. Sie gelten nur für diese
   Zeichnung: dreht er das Gerät oder ändert die Schriftgröße, wird die Karte
   neu vermessen (siehe resize-Zuhörer unten). */
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
  const proFarbe = {};
  TJ_FARBEN.forEach(f => { proFarbe[f.id] = []; });
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
    const b = TJ_OFFEN.buchstaben.get(c.i);
    if (b && bereich) proFarbe[b.farbe].push(bereich);
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
    const grenze = grenzen.get(g.c.i);
    const b = TJ_OFFEN.buchstaben.get(g.c.i);
    const knopf = document.createElement('button');
    knopf.type = 'button';
    knopf.className = 'tj-flaeche' + (b ? ' an tj-' + b.farbe : '') + (TJ_OFFEN.aktiv === g.c.i ? ' aktiv' : '');
    knopf.dataset.pos = String(g.c.i);
    knopf.setAttribute('aria-label', 'Buchstabe ' + g.c.text);
    knopf.setAttribute('aria-pressed', b ? 'true' : 'false');
    knopf.style.left = grenze.von + 'px';
    knopf.style.width = Math.max(1, grenze.bis - grenze.von) + 'px';
    knopf.style.top = '0px';
    knopf.style.height = bb.height + 'px';
    flaechen.appendChild(knopf);
  }
  tajweedHighlightsSetzen('tajweed-karte-', proFarbe);
}

/* ⭐ Speichern heißt hier: jeden Buchstaben, der VORHER markiert war oder
   JETZT markiert ist, SETZEN. Ein weggenommener Buchstabe bekommt
   `an:false` mit neuem Zeitpunkt — ein Wegnehmen ohne Datum holt der
   Abgleich vom anderen Gerät zurück. Ein Buchstabe, an dem sich nichts
   geändert hat, behält seinen alten Stempel — sonst gälte jedes Öffnen
   der Karte als Änderung, und das zuletzt angefasste Gerät gewänne jeden
   Abgleich. Dieselbe Regel wie in hakenSpeichern() (js/quran.js). */
function tajweedFertig(){
  if (!TJ_OFFEN) return;
  const { sure, vers, wort, text, buchstaben, vorher } = TJ_OFFEN;
  const cluster = tajweedCluster(text);
  let geaendert = false;
  for (const pos of new Set([...vorher.keys(), ...buchstaben.keys()])){
    const id = `${sure}:${vers}:${wort}:${pos}`;
    const jetzt = buchstaben.get(pos);
    const an = !!jetzt;
    const notiz = an ? (jetzt.notiz || '').trim() : '';
    const farbe = an ? jetzt.farbe : ((vorher.get(pos) || {}).farbe || TJ_FARBE_VORGABE);
    const alt = TAJWEED[id];
    const gleich = alt && !!alt.an === an && alt.farbe === farbe && alt.notiz === notiz;
    if (gleich) continue;
    const c = tajweedClusterAn(cluster, pos);
    TAJWEED[id] = { an, zeichen: c ? c.text : '', farbe, notiz, zeit: Date.now() };
    geaendert = true;
  }
  if (geaendert) tajweedSpeichern();
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
     das Abfangen ginge beim Markieren jedes Mal auch der Vers auf.
     ⚠️ Ein VERDECKTER Vers geht vor: dort tut der Tipp, was er immer tat
     (aufdecken) — sonst verriete der Zettel den Buchstaben. */
  const liste = document.getElementById('verseList');
  if (liste) liste.addEventListener('click', (e)=>{
    const span = e.target.closest && e.target.closest('.qw');
    if (!span){ tajweedZettelSchliessen(); return; }
    const karte = span.closest('.verse-item[data-versnr]');
    const versAr = span.closest('.verse-ar');
    if (!karte || (versAr && versAr.classList.contains('verdeckt'))){ tajweedZettelSchliessen(); return; }
    const vers = Number(karte.dataset.versnr), wort = Number(span.dataset.w);
    const sure = (typeof OFFENE_SURE !== 'undefined') ? OFFENE_SURE : null;
    if (TJ_MODUS){
      e.stopPropagation(); e.preventDefault();
      tajweedKarteOeffnen(span, vers, wort);
      return;
    }
    if (sure && tajweedStellen(sure, vers, wort).length){
      e.stopPropagation(); e.preventDefault();
      if (TJ_ZETTEL && TJ_ZETTEL.span === span) tajweedZettelSchliessen();
      else tajweedZettelZeigen(span, sure, vers, wort);
      return;
    }
    tajweedZettelSchliessen();
  }, true);

  const zettel = document.getElementById('tajweedZettel');
  if (zettel) zettel.addEventListener('click', (e)=>{
    if (!e.target.closest('#btnTajweedZettelBearbeiten') || !TJ_ZETTEL) return;
    const { span, vers, wort } = TJ_ZETTEL;
    tajweedKarteOeffnen(span, vers, wort);
  });
  /* Ein Tipp irgendwo sonst schließt den Zettel; Rollen auch — er ist fest
     positioniert und würde sonst über dem falschen Wort stehen. */
  document.addEventListener('click', (e)=>{
    if (!TJ_ZETTEL) return;
    if (e.target.closest('#tajweedZettel') || e.target.closest('#verseList .qw')) return;
    tajweedZettelSchliessen();
  });
  window.addEventListener('scroll', ()=>{ if (TJ_ZETTEL) tajweedZettelSchliessen(); }, { passive:true });

  /* Ein Tipp auf einen Buchstaben macht ihn zum AKTIVEN — und markiert ihn,
     falls er es noch nicht ist. Wegnehmen geht über den Knopf, nicht über
     einen zweiten Tipp: sonst wüsste man nie, ob ein Tipp auswählt oder
     löscht. */
  const flaechen = document.getElementById('tjFlaechen');
  if (flaechen) flaechen.addEventListener('click', (e)=>{
    const knopf = e.target.closest('.tj-flaeche');
    if (!knopf || !TJ_OFFEN) return;
    const pos = Number(knopf.dataset.pos);
    if (!TJ_OFFEN.buchstaben.has(pos)) TJ_OFFEN.buchstaben.set(pos, { farbe: TJ_FARBE_VORGABE, notiz: '' });
    TJ_OFFEN.aktiv = pos;
    tajweedKarteNachziehen();
    tajweedFlaechenBauen();
  });

  const farben = document.getElementById('tjFarben');
  if (farben) farben.addEventListener('click', (e)=>{
    const knopf = e.target.closest('[data-farbe]');
    if (!knopf || !TJ_OFFEN || TJ_OFFEN.aktiv === null) return;
    const b = TJ_OFFEN.buchstaben.get(TJ_OFFEN.aktiv);
    if (!b) return;
    b.farbe = knopf.dataset.farbe;
    tajweedKarteNachziehen();
    tajweedFlaechenBauen();
  });

  /* Die Notiz wird beim Tippen mitgeführt, nicht erst bei „Fertig" — sonst
     ginge sie beim Wechsel auf einen anderen Buchstaben verloren. */
  const notiz = document.getElementById('tjNotiz');
  if (notiz) notiz.addEventListener('input', ()=>{
    if (!TJ_OFFEN || TJ_OFFEN.aktiv === null) return;
    const b = TJ_OFFEN.buchstaben.get(TJ_OFFEN.aktiv);
    if (b) b.notiz = notiz.value;
  });

  const fertig = document.getElementById('btnTajweedFertig');
  if (fertig) fertig.addEventListener('click', tajweedFertig);

  /* „Buchstabe weg" nimmt nur den AKTIVEN Buchstaben heraus; die anderen
     bleiben. Gespeichert wird erst mit „Fertig". */
  const weg = document.getElementById('btnTajweedWeg');
  if (weg) weg.addEventListener('click', ()=>{
    if (!TJ_OFFEN || TJ_OFFEN.aktiv === null) return;
    TJ_OFFEN.buchstaben.delete(TJ_OFFEN.aktiv);
    const rest = [...TJ_OFFEN.buchstaben.keys()].sort((a, b) => a - b);
    TJ_OFFEN.aktiv = rest.length ? rest[0] : null;
    tajweedKarteNachziehen();
    tajweedFlaechenBauen();
  });

  const zu = document.getElementById('btnCloseTajweed');
  if (zu) zu.addEventListener('click', tajweedKarteSchliessen);
  const hinter = document.getElementById('tajweedBackdrop');
  if (hinter) hinter.addEventListener('click', tajweedKarteSchliessen);

  /* Dreht er das Gerät, stimmen die ausgemessenen Flächen nicht mehr. Die
     Markierungen im Text brauchen nichts davon — Bereiche wandern mit dem
     Text, das ist der Vorteil dieser Technik gegenüber gezeichneten Kästen. */
  window.addEventListener('resize', ()=>{ if (TJ_OFFEN) tajweedFlaechenBauen(); if (TJ_ZETTEL) tajweedZettelSchliessen(); });
});
