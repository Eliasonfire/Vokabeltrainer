/* zeitmessung.js -- wie lange wirklich geuebt wird
   Teil der App-Logik; wird in index.html in fester Reihenfolge geladen und
   teilt sich mit den uebrigen js/-Dateien den globalen Namensraum.

   ---------- Der Auftrag (Elias, 08.09.2026, 00:38) ----------

   "es wäre denke ich gut wenn die app messen würde wie lange ich für die
   karteikarten brauche und für den satzmodus und hörmodus wenn ich wirklich
   daran übe. am besten mir nicht sagen aber wenn ich es bei dir wissen will
   oder es nützlich ist damit zu arbeiten wäre es denke ich gut als information"

   ⛔⛔ DREI Vorgaben stecken in diesem Satz, und alle drei sind Bau-Entscheidungen:

   1. "wenn ich WIRKLICH daran übe" — nicht die Wanduhr. Ein offener Bildschirm
      auf dem Nachttisch ist keine Uebungszeit.
   2. "am besten mir NICHT sagen" — ⛔ DIESE ZAHL GEHOERT IN KEINE OBERFLAECHE.
      Kein Element, keine Zeile in der Statistik, kein Zusatz in einer Feier.
      Eine sichtbare Uhr macht aus Uebung eine Pruefung; bei ADHS ist das genau
      die falsche Richtung. [[adhs_enkodieren_ist_die_luecke]]
   3. "wenn ich es bei dir wissen will" — sie muss ABRUFBAR sein, sonst ist sie
      wertlos. ⚠️ Genau daran ist `vt_regelStand` einmal gescheitert: seit v209
      geschrieben, geraetesynchron abgeglichen und NIRGENDS zu sehen. Der
      Abrufweg ist deshalb Teil dieses Baus und nicht Kuer: `zeitBericht()` in
      der Konsole. [[daten_ohne_zugang]] [[werkzeug_ohne_aufrufer]]

   ---------- Wie gemessen wird ----------

   Ein Takt von 5 Sekunden schreibt jeweils 5 Sekunden gut, WENN alle drei
   Bedingungen zugleich gelten:

     · ein gemessener Bildschirm ist offen  (Karteikarten, Saetze, Hoeren)
     · die Seite ist sichtbar               (`visibilityState`)
     · die letzte Beruehrung ist < 60 s her

   ⭐ Warum ein Takt und keine Differenz zweier Zeitstempel: Eine Differenz
   misst auch die Stunden, in denen das Handy im Standby lag oder die App im
   Hintergrund stand. Der Takt kann das gar nicht — er laeuft nur, wenn er
   laeuft. Der Preis ist eine Unterschaetzung von bis zu 5 s je Sitzung, und
   das ist die richtige Richtung: lieber zu wenig als eine Zahl, die schmeichelt.

   ⚠️ Dass der Browser `setInterval` im Hintergrund drosselt, ist hier kein
   Problem, sondern erwuenscht — dort wird ohnehin nichts gutgeschrieben.
   [[hintergrund_tab_drosselt_timer]]

   ---------- Warum je Geraet getrennt ----------

   `vt_uebungstage` nimmt beim Abgleich das MAXIMUM und unterschaetzt damit
   jeden Tag, an dem Elias auf Handy UND Tablet geuebt hat — im Kommentar dort
   offen zugegeben. Fuer eine Zeitangabe waere das falsch: 5 Minuten hier und
   3 Minuten dort sind 8 Minuten, nicht 5.

   ⭐ Deshalb bekommt jedes Geraet einen eigenen Zweig:

     vt_zeit = { "2026-09-08": { "g4k2xa": { learn: 412, hoeren: 95 } } }

   Innerhalb eines Geraets waechst der Zaehler monoton — dort ist das Maximum
   exakt richtig und verliert nichts. Ueber Geraete hinweg wird summiert, weil
   sie nebeneinander stehen. Kein Verlust, keine Doppelzaehlung. */

const ZEIT_SCHLUESSEL = 'vt_zeit';
const ZEIT_TAKT_MS    = 5000;      /* alle 5 s gutschreiben */
const ZEIT_TAKT_SEK   = 5;
const ZEIT_RUHE_MS    = 60000;     /* 60 s ohne Beruehrung = Pause */
const ZEIT_TAGE       = 180;       /* so viele Tage aufheben */

/* Nur diese drei. Die Startseite, die Einstellungen und der Quran-Leser sind
   ausdruecklich NICHT dabei — Elias hat drei Modi genannt, und Blaettern in
   einer Wortliste ist keine Uebung. */
const ZEIT_MODI = { learn: 'Karteikarten', sentences: 'Satzmodus', hoeren: 'Hörmodus' };

const ZEIT_LAUF = { modus: null, letzteRegung: 0, ticker: null };

/* ⚠️ Die Geraetekennung darf NICHT abgeglichen werden — sonst haetten beide
   Geraete dieselbe und die Trennung waere hinfaellig. Sie steht deshalb nicht
   in der Schluesselliste von js/sync.js. */
function zeitGeraet(){
  let g = null;
  try { g = localStorage.getItem('vt_geraetId'); } catch (e){ /* privates Fenster: unten wird eine neue Kennung gewuerfelt */ }
  if (!g){
    g = 'g' + Math.random().toString(36).slice(2, 8);
    try { localStorage.setItem('vt_geraetId', g); } catch (e){ /* privates Fenster: die Kennung gilt dann nur fuer diese Sitzung */ }
  }
  return g;
}

function zeitDaten(){
  const d = LS.get(ZEIT_SCHLUESSEL, {});
  return (d && typeof d === 'object') ? d : {};
}

/* Alte Tage wegwerfen. ⚠️ Nur hier, nicht beim Lesen: wer beim Lesen aufraeumt,
   loescht auf einem Geraet, das gerade nur nachschaut. */
function zeitAufraeumen(d){
  const tage = Object.keys(d).sort();
  while (tage.length > ZEIT_TAGE) delete d[tage.shift()];
  return d;
}

function zeitGutschreiben(modus, sek){
  if (!ZEIT_MODI[modus]) return;
  const tag = todayStr(0);
  const g   = zeitGeraet();
  const d   = zeitDaten();
  if (!d[tag])    d[tag]    = {};
  if (!d[tag][g]) d[tag][g] = {};
  d[tag][g][modus] = (Number(d[tag][g][modus]) || 0) + sek;
  LS.set(ZEIT_SCHLUESSEL, zeitAufraeumen(d));
}

/* ⭐ Der Geh-Modus ist die eine Ausnahme von BEIDEN Bedingungen (08.09.2026).
   Er laeuft mit ausgeschaltetem Bildschirm — dort ist die Seite `hidden`, und
   beruehrt wird 20 Minuten lang nichts. Beide Wachen wuerden ihn ausschliessen.

   ⛔ Und das waere falsch herum: Genau dann wird tatsaechlich geuebt. Die
   Messung haette ausgerechnet die Uebungsform nicht gesehen, fuer die Elias
   sie sich gewuenscht hat. Dass der Modus laeuft, ist hier der bessere Beleg
   fuer „er uebt gerade" als jede Beruehrung. */
function zeitTakt(){
  if (!ZEIT_LAUF.modus) return;
  const gehtGerade = (typeof GEH === 'object' && GEH && GEH.an);
  if (!gehtGerade){
    if (document.visibilityState !== 'visible') return;
    if (Date.now() - ZEIT_LAUF.letzteRegung > ZEIT_RUHE_MS) return;
  }
  zeitGutschreiben(ZEIT_LAUF.modus, ZEIT_TAKT_SEK);
}

/* Wird am Ende von zeigeBildschirm() gerufen — der einen Stelle, durch die
   JEDER Bildschirmwechsel geht. Ein zweiter Einhaengepunkt waere eine zweite
   Stelle fuer dieselbe Entscheidung. [[entscheidung_gilt_fuer_das_zweite_werkzeug]] */
function zeitBildschirm(name){
  ZEIT_LAUF.modus = ZEIT_MODI[name] ? name : null;
  /* Er hat gerade getippt, um hierherzukommen — sonst zaehlte die erste Minute
     als Ruhe und die kuerzeste Uebung waere immer 0. */
  ZEIT_LAUF.letzteRegung = Date.now();
}

function zeitRegung(){ ZEIT_LAUF.letzteRegung = Date.now(); }

document.addEventListener('pointerdown', zeitRegung, { passive: true });
document.addEventListener('keydown',     zeitRegung, { passive: true });
ZEIT_LAUF.ticker = setInterval(zeitTakt, ZEIT_TAKT_MS);

/* ---------- Der Abrufweg (Punkt 3 des Auftrags) ----------

   In der Konsole:  zeitBericht()        die letzten 14 Tage
                    zeitBericht(60)      die letzten 60 Tage
                    zeitRoh()            das blanke Objekt

   ⛔ NICHT in der Oberflaeche aufrufen. "am besten mir nicht sagen." */
function zeitFormat(sek){
  sek = Math.round(Number(sek) || 0);
  const m = Math.floor(sek / 60), s = sek % 60;
  return m ? `${m} min ${String(s).padStart(2, '0')} s` : `${s} s`;
}

function zeitBericht(tage){
  tage = Number(tage) || 14;
  const d = zeitDaten();
  const zeilen = [];
  const summe = { learn: 0, sentences: 0, hoeren: 0 };
  Object.keys(d).sort().slice(-tage).forEach(tag => {
    /* ⭐ Hier wird ueber die Geraete SUMMIERT — das ist der ganze Grund fuer
       die getrennten Zweige. */
    const z = { learn: 0, sentences: 0, hoeren: 0 };
    Object.values(d[tag] || {}).forEach(pro => {
      Object.keys(z).forEach(m => { z[m] += Number(pro[m]) || 0; });
    });
    Object.keys(z).forEach(m => { summe[m] += z[m]; });
    zeilen.push({
      Tag: tag,
      Karteikarten: zeitFormat(z.learn),
      Satzmodus:    zeitFormat(z.sentences),
      Hörmodus:     zeitFormat(z.hoeren),
      Gesamt:       zeitFormat(z.learn + z.sentences + z.hoeren),
      Geräte:       Object.keys(d[tag] || {}).length
    });
  });
  if (!zeilen.length){ console.log('Noch keine Zeit gemessen.'); return zeilen; }
  console.table(zeilen);
  const g = summe.learn + summe.sentences + summe.hoeren;
  console.log(`Summe über ${zeilen.length} Tage mit Daten: ${zeitFormat(g)}`
    + ` · Karteikarten ${zeitFormat(summe.learn)}`
    + ` · Sätze ${zeitFormat(summe.sentences)}`
    + ` · Hören ${zeitFormat(summe.hoeren)}`);
  /* ⚠️ Der Schnitt bezieht sich auf Tage MIT Uebung, nicht auf `tage`. Sonst
     sagte er "3 min am Tag", wo er "9 min an jedem dritten Tag" meint — und
     das sind zwei verschiedene Aussagen. [[historisch_oder_aktuell_steht_im_wort_davor]] */
  console.log(`Schnitt je Übungstag: ${zeitFormat(g / zeilen.length)}`
    + `  (${zeilen.length} Tage mit Übung)`);
  return zeilen;
}

function zeitRoh(){ return zeitDaten(); }
