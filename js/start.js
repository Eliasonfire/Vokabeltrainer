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

/* ⭐⭐ DIE TAGESRINGE (15.09.2026) — sie ersetzen die Zeile „Heute zusätzlich".

   Elias' Vorgaben, alle von diesem Abend:
     „nebeneinander finde ich auch besser, da möchte ich aber, dass erstmal
      immer die karteikarten stehen und dann abwechselnd halt sätze oder
      hörmodus"
     „dass man dort keine zahl hat, jedoch in den einstellungen einstellen kann
      wie viel das tagesziel ist"
     „vorschuss sollte so 10% sein"

   ⛔ WARUM 10 % UND NICHT 0. Der Ring startet nicht leer. Belegt ist das durch
   Nunes & Drèze 2006 (Autowaschkarte): acht leere Stempel gegen zehn mit zwei
   bereits gefüllten — bei gleicher Arbeit fast die doppelte Abschlussrate. Der
   Ring darf ermutigen; die Zahl, die zählt, steht in den Einstellungen und
   bleibt exakt.

   ⛔ EIN ERREICHTES ZIEL ZEIGT EXAKT VOLL. Sonst hiesse „geschafft" plötzlich
   97 %, und der Vorschuss hätte aus einer Ermutigung eine Lüge gemacht.

   ⚠️ Der Wurzelmodus ist bewusst NICHT dabei — Elias: „später sobald der
   wurzelmodus mehr geworden ist und wir mehr damit anfangen können (du
   solltest mir dann auch empfehlen ihn mit einzubinden weil aktuell ja zu
   wenig vokabeln und damit variation und funktion darunter leiden)". Er hat
   seinen Ring im Modus selbst. */
const RING_VORSCHUSS = 0.10;

/* ---------- ⭐⭐ STILLE MESSUNG DER ZIELERFÜLLUNG (15.09.2026) ----------

   Elias: „du sollst messen wie oft ich täglich meinen soll pro tag erfülle und
   wie oft wie viel davon ausgefüllt ist täglich aber nicht mir sagen in app
   sondern nur messen."

   ⛔ NICHTS DAVON WIRD ANGEZEIGT. Kein Ring, keine Zeile, keine Feier. Der
   Speicher wird geschrieben und sonst nichts — sichtbar ist er nur in der
   Diagnose, also dort, wo Elias selbst nachsieht, wenn er will.

   ⭐ Warum das etwas anderes ist als der Übungskalender: der zählt KARTEN
   („2026-09-14: 9"). Hier steht, welcher ANTEIL des jeweiligen Ziels erreicht
   war — und zwar je Ziel getrennt. „9 Karten" sagt nichts darüber, ob das
   Tagesziel 10 oder 30 war. [[ein_stand_sind_mehrere_zahlen]]

   Form: { "2026-09-14": { karten:[9,10], saetze:[13,13], hoeren:[0,5], … } }
   Erster Wert Stand, zweiter Ziel. Zwei Zahlen statt eines Anteils, weil sich
   aus 0,9 nicht mehr rekonstruieren lässt, ob es 9/10 oder 27/30 waren.

   ⚠️ Geschrieben wird bei jedem Zeichnen der Ringe — also oft. Deshalb nur,
   wenn sich wirklich etwas geändert hat; sonst entstünde bei jedem Blick auf
   den Startbildschirm ein Schreibvorgang. */
function merkeZielstand(teil, stand, ziel){
  if (stand === null || !ziel) return;
  const heute = todayStr(0);
  let v;
  try { v = LS.get('vt_zielverlauf', {}) || {}; } catch (e){ return; }
  const tag = v[heute] || (v[heute] = {});
  const alt = tag[teil];
  if (alt && alt[0] === stand && alt[1] === ziel) return;   /* unverändert */
  tag[teil] = [stand, ziel];
  /* ⛔ Nicht unbegrenzt wachsen lassen: 120 Tage sind vier Monate und reichen
     für jede Frage, die Elias stellen würde. Ohne Grenze läge nach einem Jahr
     ein Vielfaches im Abgleich, das niemand je liest.
     [[obsidian_notizgroesse]] */
  const tage = Object.keys(v).sort();
  while (tage.length > 120) delete v[tage.shift()];
  try { LS.set('vt_zielverlauf', v); } catch (e){ /* privates Fenster */ }
}

function ringBogen(anteil){
  if (!(anteil > 0)) return Math.round(RING_VORSCHUSS * 1000) / 10;
  if (anteil >= 1) return 100;
  return Math.round((RING_VORSCHUSS + (1 - RING_VORSCHUSS) * anteil) * 1000) / 10;
}

/* Ein Ring als Knopf. `nav` führt in den Modus — das war die zweite Aufgabe
   der alten Zeile, und sie bleibt. */
function ringKnopf(name, stand, ziel, nav){
  const voll = (stand !== null && ziel) ? stand >= ziel : false;
  const anteil = (stand !== null && ziel) ? stand / ziel : 0;
  return '<button class="tr-feld' + (voll ? ' voll' : '') + '" type="button"'
    + ' data-nav="' + nav + '"'
    + ' aria-label="' + name + ': ' + (stand === null ? 'kein Stand' : stand + ' von ' + ziel) + '">'
    + '<svg viewBox="0 0 40 40" aria-hidden="true">'
    +   '<circle class="tr-spur" cx="20" cy="20" r="15.9155"></circle>'
    +   '<circle class="tr-fuell" cx="20" cy="20" r="15.9155" pathLength="100"'
    +     ' stroke-dasharray="' + ringBogen(anteil) + ' 100"></circle>'
    +   '<path class="tr-haken" d="M13.5 20.5 18 25 26.5 15.5"></path>'
    + '</svg><span class="tr-name">' + name + '</span></button>';
}

function renderTagesringe(){
  const kasten = document.getElementById('tagesringe');
  if (!kasten) return;

  /* ⛔⛔ DAS ZIEL IST DER TAGESDECKEL, NICHT DER RESTVORRAT.

     Erster Versuch war `kZiel = erledigte + tagesPool().length` — und Elias
     meldete sofort: „der ring der karteikarten auf dem startbildschirm zeigt
     mir nicht voll an obwohl ich die karteikarten heute 10 stück (tagesziel)
     gemacht habe."

     Der Grund steht in tagesAuswahl() (js/kern.js): sie gibt IMMER bis zu
     `deckel` Karten zurück, solange überhaupt etwas fällig ist. Und
     Box-1-Karten bleiben nach dem Beantworten heute fällig (INTERVALS[1] = 0).
     Der Restvorrat wird also nie leer, das Ziel wuchs mit jeder Antwort mit,
     und der Ring konnte sich nicht füllen. Eine Zahl, die sich beim Erreichen
     selbst verschiebt, ist kein Ziel.
     [[bedingung_wird_durch_die_handlung_ungueltig]]

     „Karten pro Tag" in den Einstellungen IST das Tagesziel — es steht dort
     wörtlich so. Genau die Zahl gilt.

     ⚠️ Beim Deckel „Aus – alle fälligen" gibt es keine feste Zahl. Dann zählt
     der Anfangsbestand des Tages: erledigte plus Rest. Er wächst zwar auch,
     aber ohne Deckel hat Elias sich bewusst gegen ein Tagesende entschieden. */
  let kStand = null, kZiel = null;
  if (typeof getUebungstage === 'function' && typeof tagesPool === 'function'){
    const heute = todayStr(0);
    kStand = Number((getUebungstage() || {})[heute]) || 0;
    const deckel = (typeof tagesDeckel === 'function') ? Number(tagesDeckel()) : 0;
    kZiel = deckel > 0 ? deckel : (kStand + tagesPool().length);
    if (!kZiel) kZiel = null;               /* nichts fällig: kein Ziel, kein Ring */
  }

  /* Der Modus des Tages — dieselbe Abwechslung wie bisher. */
  const modus = heuteExtraModus();
  let zStand = null, zZiel = null, zName, zNav;
  if (modus === 'hoeren'){
    zName = 'Hören'; zNav = 'hoeren';
    if (typeof hoerTag === 'function' && typeof hoerTagesziel === 'function'){
      zStand = hoerTag().gesamt; zZiel = hoerTagesziel();
    }
  } else {
    zName = 'Sätze'; zNav = 'sentences';
    if (typeof satzTag === 'function' && typeof satzTagesziel === 'function'){
      zStand = satzTag().gesamt; zZiel = satzTagesziel();
    }
  }

  /* ⭐ Die Quran-Ringe stehen seit dem 15.09.2026 hier mit drin — al-Mulk
     täglich, dazu die Wiederholung und die Favoriten-Sure, seit 18.09. auch
     eine zufällige Sure. Elias: „ich finde die sollten einfach bei heute
     stehen." */
  const quran = (typeof quranRingDaten === 'function') ? quranRingDaten() : [];

  /* ⚠️ Fehlt ALLES, bleibt der Kasten weg. Ein Kasten „Heute" mit leeren
     Ringen und ohne Zahl sagt nichts — anders als die alte Zeile, die
     wenigstens einen Hinweis trug. [[leere_liste_ist_keine_messung]] */
  if (kZiel === null && zZiel === null && !quran.length){ kasten.hidden = true; return; }

  const kVoll = (kStand !== null && kZiel) ? kStand >= kZiel : false;
  const zVoll = (zStand !== null && zZiel) ? zStand >= zZiel : false;
  const alles = kVoll && zVoll && quran.every(r => r.voll);

  /* Ein Ring ohne Zwischenstufe: eine Sure ist heute gelesen oder nicht.
     Der Vorschuss gilt trotzdem — sonst stünden hier als einzige Ringe der
     App leere Kreise. */
  const surenRing = r =>
    '<button class="tr-feld' + (r.voll ? ' voll' : '') + '" type="button"'
    + (r.sure ? ' data-surering="' + r.sure + '"' : ' data-nav="' + r.nav + '"')
    + (r.vers ? ' data-vers="' + r.vers + '"' : '')
    + ' aria-label="' + r.txt.replace('<br>', ': ') + (r.voll ? ', heute gelesen' : '') + '">'
    + '<svg viewBox="0 0 40 40" aria-hidden="true">'
    +   '<circle class="tr-spur" cx="20" cy="20" r="15.9155"></circle>'
    +   '<circle class="tr-fuell" cx="20" cy="20" r="15.9155" pathLength="100"'
    +     ' stroke-dasharray="' + ringBogen(r.voll ? 1 : 0) + ' 100"></circle>'
    +   '<path class="tr-haken" d="M13.5 20.5 18 25 26.5 15.5"></path>'
    + '</svg><span class="tr-name">' + r.txt + '</span></button>';

  /* ⚠️ Ab vier Ringen wird es auf 375 px eng — dann kleiner statt gequetscht.
     Gemessen: vier Ringe à 76 px plus Lücken passen nicht in eine Reihe. */
  const anzahl = (kZiel !== null ? 1 : 0) + (zZiel !== null ? 1 : 0) + quran.length;

  /* ⭐ Still mitschreiben, was heute erreicht war — angezeigt wird davon
     nichts. Hier, weil alle Zahlen ohnehin gerade beisammen sind. */
  merkeZielstand('karten', kStand, kZiel);
  merkeZielstand(modus === 'hoeren' ? 'hoeren' : 'saetze', zStand, zZiel);
  /* ⚠️ „Neu lernen" kann seit 17.09.2026 MEHRERE Ringe haben (ein Ring je
     Favorit). Einzeln gemerkt, überschriebe der zweite den ersten — deshalb
     zusammengezählt: wie viele davon voll, von wie vielen. */
  /* ⛔ Der Bereich steht seit 18.09.2026 IM Ring (`teil`), statt aus dem
     angezeigten Text geraten zu werden. Die alte Weiche kannte drei Anfänge und
     warf alles andere zu „Neu lernen" — der Ring „Zufällig" wäre dort still
     mitgezählt worden, und die Messung, um die Elias gebeten hat, stimmte
     nicht mehr. Ein Anzeigetext ist kein Schlüssel. */
  const neu = [0, 0];
  quran.forEach(r => {
    if (r.teil === 'neulernen'){ neu[0] += r.voll ? 1 : 0; neu[1]++; }
    else if (r.teil) merkeZielstand(r.teil, r.voll ? 1 : 0, 1);
  });
  if (neu[1]) merkeZielstand('neulernen', neu[0], neu[1]);

  /* ⭐ Die Unterzeile sagt jetzt, WO er steht — nicht mehr „dein Tag".

     Elias mit Bild der Kopfzeile: „hier sollte sowas wie aufgaben oder so
     stehen, oder was denkst du sollte da stehen?" — „dein Tag" war eine
     Floskel: sie stand immer da und änderte sich nie, also trug sie nichts.

     Stattdessen die einzige Zahl, die an dieser Stelle etwas beantwortet:
     wie viele der Ringe darunter schon voll sind. Sie ändert sich mit jeder
     erledigten Sache und passt genau zu dem, was direkt darunter steht.

     ⛔ Kein Widerspruch zu „keine Zahl an den Ringen" (Elias am 14.09.): die
     Zahlen dort waren pro Modus und lenkten vom Ring ab. Das hier ist die
     Übersicht über alle — und sie ersetzt eine Floskel, sie kommt nicht
     zusätzlich. */
  const vollZahl = (kZiel !== null && kVoll ? 1 : 0) + (zZiel !== null && zVoll ? 1 : 0)
                 + quran.filter(r => r.voll).length;

  /* ⭐ ZWEI REIHEN, OBEN DIE GRÖSSERE HÄLFTE (18.09.2026). Elias, als sechs
     Ringe umbrachen: „du kannst auch die ringe da sie jetzt auf zwei zeilen
     gehen so 3 oben drei unten machen und dann wenns theoretisch mehr werden
     oben anfangen dort mehr zu machen aber jetzt wo es 3 zu 3 sein kann
     sieht so gut aus. am tablet sollten sie aber eig alle nebeneinander passen
     sollten". Vorher brach `flex-wrap` um, wo der Platz endete — oben vier,
     unten zwei. Ab fünf Ringen also zwei feste Reihen (5 → 3+2, 6 → 3+3,
     7 → 4+3); bis vier passt eine Reihe auch am Handy. Ab 700 px (Tablet)
     löst das CSS die beiden Reihen wieder zu einer auf (.tr-zeile
     display:contents). */
  const alleRinge = [];
  if (kZiel !== null) alleRinge.push(ringKnopf('Karteikarten', kStand, kZiel, 'learn-entry'));
  if (zZiel !== null) alleRinge.push(ringKnopf(zName, zStand, zZiel, zNav));
  quran.forEach(r => alleRinge.push(surenRing(r)));
  const oben = Math.ceil(alleRinge.length / 2);
  const reihen = alleRinge.length >= 5
    ? '<div class="tr-reihe zweizeilig">'
      + '<div class="tr-zeile">' + alleRinge.slice(0, oben).join('') + '</div>'
      + '<div class="tr-zeile">' + alleRinge.slice(oben).join('') + '</div></div>'
    : '<div class="tr-reihe">' + alleRinge.join('') + '</div>';

  kasten.hidden = false;
  kasten.className = 'tagesringe' + (anzahl >= 4 ? ' viele' : '');
  kasten.innerHTML =
    '<div class="tr-kopf"><span class="tr-titel">Heute</span>'
    + '<span class="tr-sub">' + (alles ? 'alles geschafft' : vollZahl + ' von ' + anzahl)
    + '</span></div>'
    + reihen;
}

/* ⛔ Der alte Name bleibt als Weiterleitung stehen: renderHeuteExtra() wird
   aus js/navigation.js und weiter unten in dieser Datei gerufen. Ihn überall
   umzubenennen hiesse, eine Stelle zu übersehen — und die fiele erst auf,
   wenn die Ringe irgendwo nicht nachziehen. [[werkzeug_ohne_aufrufer]] */
function renderHeuteExtra(){ renderTagesringe(); renderQuranRinge(); }

/* ---------- ⭐⭐ Die Quran-Ringe auf dem Startbildschirm (15.09.2026) -------

   Elias: „man könnte außer fatiha und mulk pro tag dort verlagen das ich eine
   sura lese von denen die ich bereits auswendig kann um sie wieder frisch zu
   halten … + auch noch einen ring für immer die sura die ich als favorieten
   hinzufüge."

   ⛔ KEIN RUNDENBALKEN. Er hatte drei Orte zur Wahl und sich entschieden:
   „Gar nicht" — der Ring sagt, welche Sure heute dran ist, mehr nicht.

   ⚠️ Der Kasten fehlt ganz, solange nichts auswendig ist. Zwei leere Ringe
   ohne Sure wären kein Ziel, sondern ein Vorwurf. */
/* ⭐ Die Quran-Ringe stehen seit dem 15.09.2026 IM „Heute"-Kasten, nicht mehr
   in einem eigenen. Elias mit Bild: „ich finde die sollten einfach bei heute
   stehen und mach noch eine extra für mulk (die soll täglich sein)."

   Diese Funktion liefert sie nur noch — gezeichnet wird in renderTagesringe().
   Der alte Kasten bleibt leer und verborgen. */
function quranRingDaten(){
  if (typeof wdhHeute !== 'function' || typeof SURAH_DATA === 'undefined') return [];
  const heute = todayStr(0);
  const name = id => {
    const s = SURAH_DATA.find(x => x.id === id);
    return s ? s.name : ('Sure ' + id);
  };
  const gelesen = id => (typeof WDH === 'object' && WDH[id] === heute);
  const ringe = [];

  /* ⭐ Al-Mulk TÄGLICH — eigener Ring, nicht in der Rotation. Elias' Vorgabe:
     „mach noch eine extra für mulk (die soll täglich sein)". Er liest sie
     ohnehin jeden Tag; der Ring hält fest, ob es heute schon war. */
  if (HIFZ[67]) ringe.push({ txt: 'Täglich<br>Al-Mulk', voll: gelesen(67), sure: 67, teil: 'mulk' });

  /* Die Rotation über alles andere, was auswendig sitzt. */
  const wdh = wdhHeute();
  if (wdh) ringe.push({ txt: 'Wiederholen<br>' + name(wdh.sure), voll: wdh.erledigt, sure: wdh.sure, teil: 'wiederholen' });

  /* Die Suren, die gerade gelernt werden — JEDER Favorit ein eigener Ring,
     auch wenn er schon als auswendig abgehakt ist. Elias am 14.09.: „jede
     sura kannst du einen eigenen ring geben", am 17.09.: „erst wenn ich sie
     von den favouriten löse dann kann sie tatsächlich weg". */
  const favoriten = (typeof wdhFavoriten === 'function') ? wdhFavoriten() : [];
  favoriten.forEach(fav => ringe.push({ txt: 'Neu lernen<br>' + name(fav), voll: gelesen(fav), sure: fav, teil: 'neulernen' }));

  /* ⭐ Jeden Tag eine zufällige SEITE, die er noch nicht auswendig kann
     (18.09.2026). Elias: „Random sura die ich nicht auswendig kann als Ring
     machen Claude", dann: „gib mir immer nur eine ganze seite zum lesen und du
     sollst die seite auch vor geben … wenn ich auf link drücke soll es mich
     direkt dahinbringen". `vers` = erster Vers der Seite — dorthin springt der
     Ring. Welche und warum den ganzen Tag dieselbe: zufallsSeiteHeute() in
     js/quran.js. */
  const seite = (typeof zufallsSeiteHeute === 'function') ? zufallsSeiteHeute() : null;
  if (seite) ringe.push({ txt: 'Zufällig<br>Seite ' + seite.seite, voll: gelesen(seitenSchluessel(seite.seite)), sure: seite.sure, vers: seite.von, teil: 'zufall' });

  /* ⛔⛔ JEDER Quran-Ring trägt seine Sure — `sure` oben, nicht nur `nav`.

     Bis zum 15.09.2026 stand hier allein `nav: 'quranfull'`. Alle drei Ringe
     landeten damit auf der Surenliste, und Elias musste genau die Sure, die
     der Ring gerade nennt, dort von Hand suchen. Er mit Bild: „ich will das
     die jeweiligen koran suren mich direkt zu den jeweiligen suren bringt."

     Ein Ring, der eine Sure NENNT, muss sie auch ÖFFNEN. `nav` bleibt als
     Rückfallweg stehen: fehlte `sure` einmal, führt der Knopf wenigstens noch
     auf die Liste statt ins Leere. */
  return ringe.map(r => Object.assign(r, { nav: 'quranfull' }));
}

/* ⛔ Bleibt als Weiterleitung: merkeWiederholung() in js/quran.js ruft sie,
   und der Aufruf soll nicht ins Leere gehen, wenn die Ringe umziehen. */
function renderQuranRinge(){ renderTagesringe(); }

/* ⭐⭐ Ein Quran-Ring öffnet SEINE Sure (15.09.2026)

   Elias mit Bild vom Startbildschirm: „ich will das die jeweiligen koran suren
   mich direkt zu den jeweiligen suren bringt."

   ⛔ Am `document`, nicht am Kasten: `#tagesringe` wird bei jedem Anstrich per
   innerHTML neu befüllt, und `renderTagesringe()` läuft auch, bevor diese
   Datei fertig geladen ist. Ein Handler am Kasten selbst überlebt das zwar
   (das Element bleibt), aber er hinge an einer Reihenfolge, die niemand
   bewacht. Die Delegation am Dokument ist derselbe Weg, den [data-nav] in
   js/navigation.js geht.

   ⚠️ Der Knopf trägt ENTWEDER data-surering ODER data-nav, nie beides —
   sonst schöbe der Handler in js/navigation.js zusätzlich `quranfull` in die
   Historie, und die Gerätetaste „zurück" landete zweimal hintereinander auf
   der Surenliste statt auf dem Startbildschirm. */
document.addEventListener('click', async (e)=>{
  const knopf = e.target.closest('[data-surering]');
  if (!knopf) return;
  const id = Number(knopf.dataset.surering);
  if (!id) return;
  /* Erst der Bildschirm, dann die Sure — genau wie in oeffneVersImLeser()
     (js/lernen.js). openSurah() allein zeigt nichts an, solange der
     Quran-Bildschirm nicht sichtbar ist. */
  if (typeof showScreen === 'function') showScreen('quranfull');
  /* ⭐ Der Ring „Zufällig" trägt dazu den ersten Vers seiner Seite (18.09.2026) —
     „wenn ich auf link drücke soll es mich direkt dahinbringen". */
  const vers = Number(knopf.dataset.vers) || 0;
  if (typeof openSurah === 'function') await openSurah(id, vers ? { vers } : undefined);
});

/* ---------- ⭐⭐ Die Tagesringe IN den Modi (15.09.2026) ----------

   Elias: „der Ring fürs Tagesziel kommt in alle vier Modi — dieselbe Form wie
   auf dem Startbildschirm." Der Wurzelmodus hat seinen eigenen (wzRing in
   js/wurzel.js), weil er in einer Kopfzeile mit Versalien sitzt.

   ⛔ EINE Funktion für alle drei. Drei Abschriften desselben Rings wären drei
   Orte, an denen der Vorschuss auseinanderlaufen kann.
   [[allgemeine_regel_statt_listeneintrag]]

   ⚠️ Verborgen, solange es kein Ziel gibt — nicht „0 %" anzeigen. */
/* ⛔ `ohneZahl` für den Lernmodus. Elias mit Bild: „und hier ist es scheinbar
   doppelt" — dort stand rechts schon „1/10" für die RUNDE, und der Ring
   schrieb „0/10" für den TAG daneben. Zwei Zahlen im selben Format, die
   Verschiedenes meinen, sind schlimmer als eine Zahl weniger.

   In den anderen Modi bleibt die Zahl: dort gibt es keine zweite.
   Was der Ring meint, steht beim langen Drücken (`title`). */
function modusRingZeichnen(id, stand, ziel, ohneZahl){
  const el = document.getElementById(id);
  if (!el) return;
  if (stand === null || !ziel){ el.hidden = true; return; }
  const anteil = Math.min(stand / ziel, 1);
  el.hidden = false;
  el.classList.toggle('voll', anteil >= 1);
  el.title = stand + ' von ' + ziel + ' heute';
  el.innerHTML =
    '<svg viewBox="0 0 40 40" aria-hidden="true">'
    + '<circle class="spur" cx="20" cy="20" r="15.9155"></circle>'
    + '<circle class="fuell" cx="20" cy="20" r="15.9155" pathLength="100"'
    + ' stroke-dasharray="' + ringBogen(anteil) + ' 100"></circle></svg>'
    + (ohneZahl ? '' : '<span>' + stand + '/' + ziel + '</span>');
}

/* Ein Balken für eine Runde. `voll` heisst hier NICHT grün — eine Runde ist
   keine Leistung, sondern eine Strecke. Grün bleibt dem Tagesziel. */
function modusBalkenZeichnen(id, stand, ziel){
  const el = document.getElementById(id);
  if (!el) return;
  const kasten = el.parentElement;
  if (!ziel){ if (kasten) kasten.hidden = true; return; }
  if (kasten) kasten.hidden = false;
  el.style.width = ringBogen(Math.min(stand / ziel, 1)) + '%';
}

/* ⛔⛔ DER TAGESRING IM LERNMODUS IST WEG (15.09.2026, 03:00).

   Elias mit Bild der Kopfzeile, Ring und Balken rot umrandet:
       „hier sind ring und balken, ring soll raus"

   Er hat recht, und es war mein Fehler aus der Nacht davor: die Lernleiste mit
   „1/10" stand dort längst, und ich habe einen Ring danebengesetzt, weil der
   Auftrag „in alle vier Modi" lautete. Zwei Anzeigen nebeneinander für
   denselben Blick sind keine doppelte Information, sondern geteilte
   Aufmerksamkeit — der Balken gewinnt, weil er die Zahl schon trägt.

   ⚠️ Die Rechnung war nicht falsch (Ring = Tag, Balken = Runde). Sie war nur
   ein Unterschied, den beim Üben niemand macht. [[zwei_regeln_selber_selektor]]

   ⛔ Wer hier wieder einen Ring einbauen will: erst nachsehen, ob im selben
   Blick schon eine Zahl steht. Im Lernmodus und im Hörmodus tut sie das.
   [[zwei_regeln_selber_selektor]] */

/* ⭐ DIE RUNDENLEISTE — Balken und Zahl, eine Funktion für beide Modi.

   Elias am 15.09.2026 zum Hörmodus, mit Bild:
       „mach es hier einfach genau so wie bei den karteikarten. ohne richtig
        oder falsch einfach nur balken mit 1/10 und dann geht es hoch normal
        wie bei krateikarten"

   „Genau so" heißt wörtlich genommen: dieselbe Rechnung, nicht nur dasselbe
   Aussehen. Deshalb steht sie hier einmal statt zweimal abgeschrieben — sonst
   laufen die beiden beim nächsten Anfassen auseinander, und zwar lautlos.

   ⚠️ Balken und Zahl zeigen absichtlich VERSCHIEDENE Werte:
     · der Balken den ERLEDIGTEN Anteil (`erledigt / ziel`),
     · die Zahl die LAUFENDE Nummer (`erledigt + 1`).
   Beim Betrachten von Karte 1 sind null Karten geschafft — der Balken steht
   also am Anfang, die Zahl sagt trotzdem „1/10". Das ist kein Widerspruch,
   sondern der Grund, warum es zwei Angaben gibt. So stand es im Lernmodus seit
   jeher; der Hörmodus übernimmt es hiermit unverändert.

   ⚠️ Die Zahl wird bei `ziel` gedeckelt. Der Lernmodus braucht das nicht (eine
   Runde ist endlich), der Hörmodus schon: dort gehen die Fragen nie aus, und
   ohne Deckel stünde nach dem Tagesziel „13/10". Der Balken deckelt aus
   demselben Grund über `Math.min(…, 1)`.

   ⛔ Nicht mit `modusBalkenZeichnen()` zusammenlegen: die versteckt ihren
   Elternknoten, wenn kein Ziel gesetzt ist. Im Lernmodus wäre dieser
   Elternknoten die ganze Kopfzeile — mitsamt dem Knopf zum Beenden. */
function rundenLeiste(balkenId, zahlId, erledigt, ziel){
  const balken = document.getElementById(balkenId);
  /* ⭐ Der Vorschuss (Nunes & Drèze 2006) steckt in `ringBogen()`: bei 0 sind
     es 10 %. Elias: „und generell alle leisten die einen forstschirtt zeigen
     lasse sie bereits etwas ausgefüllt haben nicht nur bei 0." */
  if (balken) balken.style.width =
    (ziel ? ringBogen(Math.min(erledigt / ziel, 1)) : ringBogen(0)) + '%';
  const zahl = zahlId && document.getElementById(zahlId);
  if (zahl) zahl.textContent = ziel
    ? Math.min(erledigt + 1, ziel) + '/' + ziel
    : '';
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


/* ---------- ⭐⭐ Der stille Zielverlauf: die AUSWERTUNG (15.09.2026) --------

   Elias am 15.09.2026: „und du sollst messen wie oft ich täglich meinen soll
   pro tag erfülle und wie viel davon ausgefüllt ist täglich aber nicht mir
   sagen in app sondern nur messen."

   ⛔ Bis zu dieser Funktion war nur die HAELFTE davon gebaut.
   `merkeZielstand()` schrieb jeden Tag mit, und **kein einziges Werkzeug las
   je nach** — gefunden hat das `werkzeuge/pruefe-kreislaeufe.mjs`, nicht ich.
   Eine stille Messung ist besonders heimtueckisch: sie SOLL nichts anzeigen,
   also sieht „nichts zu sehen" nach Absicht aus, auch wenn niemand mehr
   hinschaut. [[werkzeug_ohne_aufrufer]] [[zwischenstand_wird_nicht_mitgebaut]]

   ⚠️ Der Abrufweg ist die laufende App, nicht ein Werkzeug im Ordner: die
   Daten entstehen beim Ueben und liegen in Elias' localStorage. Dieselbe Lage
   wie bei `zeitBericht()` und `wortQuoteBericht()` — im Browser-Pane
   aufrufen, nicht in der Oberflaeche zeigen.

   Aufruf:  zielverlaufBericht()        letzte 30 Tage
            zielverlaufBericht(120)     alles, was da ist              */
function zielverlaufBericht(tage){
  tage = Number(tage) || 30;
  let v;
  try { v = LS.get('vt_zielverlauf', {}) || {}; } catch (e){ v = {}; }
  const namen = { karten:'Karteikarten', saetze:'Sätze', hoeren:'Hören',
                  mulk:'al-Mulk', wiederholen:'Wiederholen', neulernen:'Neu lernen',
                  zufall:'Zufällig' };
  const tageListe = Object.keys(v).sort().slice(-tage);
  if (!tageListe.length){ console.log('Noch nichts aufgezeichnet.'); return []; }

  const zeilen = [];
  /* je Bereich: an wie vielen Tagen kam er vor, wie oft war er voll, und wie
     weit im Schnitt. */
  const summe = {};
  for (const tag of tageListe){
    const eintrag = v[tag] || {};
    const zeile = { Tag: tag };
    let voll = 0, offen = 0;
    for (const teil of Object.keys(namen)){
      const p = eintrag[teil];
      if (!Array.isArray(p)){ zeile[namen[teil]] = '—'; continue; }
      const [stand, ziel] = p;
      const anteil = ziel ? Math.min(1, stand / ziel) : 0;
      zeile[namen[teil]] = stand + '/' + ziel;
      const s = summe[teil] || (summe[teil] = { tage:0, voll:0, anteil:0 });
      s.tage++; s.anteil += anteil;
      if (anteil >= 1){ s.voll++; voll++; } else offen++;
    }
    zeile['voll'] = voll + ' von ' + (voll + offen);
    zeilen.push(zeile);
  }
  console.table(zeilen);

  const uebersicht = Object.keys(summe).map(teil => ({
    Bereich: namen[teil],
    'Tage mit Ziel': summe[teil].tage,
    'davon erfüllt': summe[teil].voll,
    'Quote': Math.round(summe[teil].voll / summe[teil].tage * 100) + ' %',
    'im Schnitt gefüllt': Math.round(summe[teil].anteil / summe[teil].tage * 100) + ' %'
  }));
  console.table(uebersicht);

  /* ⚠️ Die Quote bezieht sich auf Tage, an denen es das Ziel ueberhaupt GAB —
     nicht auf `tage`. Ein Ring, den es an 8 von 30 Tagen nicht gab (nichts
     faellig, keine Sure in der Runde), haette sonst eine Quote, die nur
     aussagt, wie selten er erschien. [[historisch_oder_aktuell_steht_im_wort_davor]] */
  const alleTage = tageListe.length;
  const ganzVoll = zeilen.filter(z => {
    const m = String(z['voll']).match(/^(\d+) von (\d+)$/);
    return m && m[1] === m[2] && Number(m[2]) > 0;
  }).length;
  console.log('Aufgezeichnet: ' + alleTage + ' Tage'
    + ' · an ' + ganzVoll + ' davon war ALLES voll'
    + ' (' + Math.round(ganzVoll / alleTage * 100) + ' %)');
  return { zeilen, uebersicht };
}
