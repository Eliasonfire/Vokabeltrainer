/* Lernstand zwischen Geraeten abgleichen.
 *
 * Seit dem Umzug am 11.08.2026 liegt die App hinter Cloudflare Access. Damit
 * gibt es zum ersten Mal eine verlaessliche Kennung (die E-Mail aus dem
 * Access-Token) und einen Ort ausserhalb des Geraets (Cloudflare KV). Erst
 * dadurch wird ein Abgleich ueberhaupt moeglich - vorher waere er ein Backend
 * gewesen, das der Goal-Prompt ausgeschlossen hat.
 *
 * ⚠️ DER SCHWIERIGE TEIL IST NICHT DAS UEBERTRAGEN, SONDERN DAS ZUSAMMENFUEHREN.
 *
 * Wer einfach "der letzte Schreiber gewinnt" baut, verliert Arbeit: Elias lernt
 * morgens auf dem Handy, oeffnet abends den PC, der noch den Stand von gestern
 * hat - und der PC ueberschreibt den Vormittag. Lautlos.
 *
 * Deshalb wird der Fortschritt WORTWEISE zusammengefuehrt, nicht als Ganzes.
 * Jeder Eintrag traegt seit heute einen Zeitstempel `ts`, der beim Antworten
 * gesetzt wird. Bei zwei Fassungen desselben Wortes gewinnt die juengere.
 *
 * Fuer Eintraege ohne `ts` (alles, was vor dem 11.08. gelernt wurde) gibt es
 * eine Ersatzregel: mehr Antworten (correct+wrong) heisst weiter fortgeschritten
 * und gewinnt. Das ist eine Annaeherung, keine Wahrheit - aber sie greift nur
 * einmal, denn ab der ersten Antwort traegt jeder Eintrag einen echten Stempel.
 *
 * Die uebrigen Schluessel (Notizen, Hifz, Favoriten, Lesestand, Einstellungen)
 * werden als Ganzes verglichen. Sie sind klein und aendern sich selten; ein
 * wortweises Zusammenfuehren waere hier Aufwand ohne Gewinn.
 */

const SYNC_SCHLUESSEL = [
  /* ⚠️ Reihenfolge zaehlt: 'vt_settingsFeld' MUSS nach 'vt_settings' stehen.
     Der Einstellungs-Merge liest den lokalen Feldstempel; wuerde der vorher
     schon mit dem fremden vereinigt, gaebe es keinen Unterschied mehr zu
     messen und das andere Geraet gewaenne immer. */
  'vt_progress', 'vt_notes', 'vt_notizen', 'vt_settings', 'vt_settingsFeld', 'vt_streak',
  /* Der Uebungskalender (21.08.2026). Er gehoert aus demselben Grund dazu wie
     'vt_streak': Elias uebt auf Handy UND Tablet, und ein Kalender, der nur
     die Tage EINES Geraets kennt, zeigt Luecken, die es nie gab. */
  'vt_uebungstage',
  /* ⭐ Q3 (08.09.2026): die Trefferquote je Wort. Sie gehoert hierher aus
     genau demselben Grund wie vt_uebungstage darueber — er uebt auf Handy UND
     Tablet, und die Interferenzfrage ist nur an der SUMME beider beantwortbar.
     Ein Bestand, der je Geraet halb gefuellt ist, beantwortet sie nicht. */
  'vt_wortQuote',
  /* Die Trefferquote je Tag (07.09.2026) — aus demselben Grund wie
     'vt_uebungstage': er uebt auf Handy UND Tablet, und der Rauschversuch
     vergleicht Zeitraeume. Eigener Merge-Zweig weiter unten. */
  'vt_quoteTage',
  'vt_personalVocab', 'vt_customCats', 'vt_hifz', 'vt_hifzVerse',
  'vt_quranFav', 'vt_lesestand',
  /* Der Tageszaehler des Hoermodus (17.08.2026). Er gehoert dazu, weil Elias
     auf Tablet UND Handy uebt: ohne Abgleich haette er zwei getrennte
     Tagesziele und muesste jedes doppelt machen. ⚠️ Wie alles ausser
     `vt_progress` wird er als ein Block gemergt - der juengere Stempel gewinnt.
     Bei einem Zaehler, der ohnehin nur waehrend des Uebens waechst, ist das
     tragbar: gewinnt das Geraet, an dem gerade geuebt wurde. */
  'vt_hoerTag',
  /* ⛔ Der Tageszaehler des SATZMODUS (07.09.2026) — aus genau demselben Grund
     wie 'vt_hoerTag' eine Zeile darueber: ohne Abgleich haette Elias zwei
     getrennte Tagesziele und muesste die 13 Aufgaben auf jedem Geraet einzeln
     machen. Ebenfalls als Block, juengerer Stempel gewinnt: ein Zaehler, der
     nur waehrend des Uebens waechst, ist damit gut bedient.
     ⚠️ Gefunden hat das nicht ich, sondern `pruefe-kreislaeufe.mjs` —
     ich hatte den Schluessel angelegt und den Abgleich vergessen. Das ist die
     Fehlerart, die sich nie von selbst meldet. [[daten_ohne_zugang]] */
  'vt_satzTag',
  /* ⭐ Die stille Zeitmessung (08.09.2026). Eigener Merge-Zweig weiter unten,
     und der ist hier nicht optional: Zeit ist ADDITIV. Als Block gemergt
     verlöre ein Tag, an dem Elias auf beiden Geräten geübt hat, die Hälfte —
     genau der Fehler, den `vt_uebungstage` mit seinem Maximum bewusst in Kauf
     nimmt und den eine Zeitangabe nicht vertragen würde.
     ⚠️ `vt_geraetId` steht ABSICHTLICH NICHT hier: würde sie abgeglichen,
     hätten beide Geräte dieselbe Kennung und die Trennung wäre hinfällig. */
  'vt_zeit',
  /* ⭐ „Laut sagen": welche Karte wann zuletzt markiert war, und die laufende
     Rundennummer (07.09.2026). Ohne Abgleich wandert die Markierung auf jedem
     Geraet fuer sich — kein Datenverlust, aber „jedes Wort kommt mal dran"
     wird schlechter erfuellt, und genau das war Elias' Punkt.
     ⚠️ `vt_lautStand` bekommt einen eigenen Zweig (Maximum JE WORT): als Block
     verloere man die Markierungen des anderen Geraets. `vt_lautRunde` ist eine
     einzelne Zahl und laeuft ueber den Schlusszweig. */
  'vt_lautStand', 'vt_lautRunde',
  /* „Kenne ich schon" (17.08.2026). ⚠️ Wird JE WORT zusammengefuehrt, nicht als
     Block - siehe den eigenen Zweig in fuehreZusammen(). Als Block waere er ein
     Rueckschritt hinter genau den Fehler, der heute Nacht bei den Einstellungen
     behoben wurde: markiert Elias auf dem Handy drei Woerter und auf dem Tablet
     eins, verlöre der aeltere Stempel alle drei. */
  'vt_bekannt',
  /* ⛔⛔ Einzeln freigeschaltete Woerter (20.08.2026 nachgetragen, und das war
     ein FEHLER, kein Nachruesten). js/kern.js legt sie in derselben
     {an, zeit}-Form an wie vt_bekannt und begruendet das dort ausdruecklich
     damit, dass „beim Geraeteabgleich auch das ZURUECKNEHMEN ankommen" muss —
     die Form war fuer einen Abgleich gebaut, den es nicht gab.

     Die Folge war doppelt zu: syncGeaendert() steigt bei einem unbekannten
     Schluessel sofort aus, setzt also nicht einmal einen Stempel, und die
     Hochlade-Schleife laeuft ebenfalls nur ueber diese Liste. Der Schluessel
     verliess das Geraet in KEINER Richtung.

     ⚠️ Und Elias konnte es nicht bemerken: die Liste in den Einstellungen
     zeigt auf jedem Geraet genau das, was dieses Geraet gespeichert hat — also
     ueberall etwas Plausibles. Gefunden hat es ein Gegenpruefer.
     [[ausfall_ist_unsichtbar_gebaut]] */
  'vt_einzeln_frei',
  /* Welcher Eselsbruecken-Vorschlag auf der Karte steht (18.08.2026). Ebenfalls
     JE WORT, aus demselben Grund und ueber denselben Zweig. */
  'vt_vorschlagNr',
  /* Verworfene Vorschlaege (19.08.2026). ⚠️ Eigener Zweig in fuehreZusammen(),
     NICHT der von vt_vorschlagNr: dort gewinnt je Wort der juengere Eintrag,
     hier muessen sich zwei Geraete ERGAENZEN. Verwirft er auf dem Handy
     Vorschlag 1 und auf dem Tablet Vorschlag 2, sind das zwei Befunde. */
  'vt_vorschlagWeg',
  /* Seine Korrekturen an Buchvokabeln (18.08.2026). Auch je Wort: aendert er auf
     dem Handy zwei Woerter und am Rechner eins, duerfen die zwei nicht durch
     den aelteren Blockstempel verschwinden. */
  'vt_wortAenderungen',
  /* Ausgeblendete Fachbegriffe (18.08.2026). Je Wort, damit auch das
     Zurückholen auf dem anderen Gerät ankommt. */
  'vt_geloescht',
  /* Fortschritt je Grammatikregel (19.08.2026). Er speist Elias' Auswahl,
     welche Regeln im Satzmodus bleiben — auf EINEM Geraet gefuehrt waere die
     Zahl halb blind, er uebt auf Tablet UND Handy. ⚠️ Eigener Merge-Zweig:
     je Regel das FELDWEISE MAXIMUM. Ein Blockstempel wuerfe die Zaehlungen
     des anderen Geraets weg, Summieren zaehlte nach jedem Abgleich doppelt.
     Das Maximum verliert hoechstens, was BEIDE parallel geuebt haben, und
     richtig<=gestellt bleibt erhalten, weil es je Seite gilt. */
  'vt_regelStand',
  /* ⛔ Fortschritt je Uebungsmodus (06.09.2026). Zwoelf der dreizehn Modi
     hielten ihr Ergebnis vorher gar nicht fest — siehe merkeUebung() in
     js/kern.js. Gleiche Form wie vt_regelStand, laeuft deshalb ueber
     denselben Zweig: Maximum je Feld, juengstes Datum. */
  'vt_uebungStand',
  /* ⛔ Erreichte Meilensteine (06.09.2026 nachgetragen). Ohne sie feiert das
     zweite Geraet den Sieben-Tage-Konfetti ein zweites Mal — kein Datenverlust,
     aber Elias' Ziel lautet ausdruecklich „komplett identische daten […]
     einfach alles". Zusammengefuehrt wird je Marke mit dem FRUEHEREN Datum:
     wann ein Meilenstein erreicht wurde, aendert sich durch einen zweiten
     Blick nicht. */
  'vt_feiern'
];

/* Je Schluessel merken, wann er zuletzt lokal geaendert wurde. Ohne das kann
   nicht entschieden werden, welche Seite neuer ist. */
const STEMPEL_SCHLUESSEL = 'vt_syncStempel';

/* Was der letzte Abgleich ergeben hat - nur zum Anzeigen, nie zum Rechnen.
   ⚠️ Bewusst NICHT ueber LS.set gespeichert: das meldet jede Speicherung an
   syncGeaendert() zurueck, und ein Statusfeld, das einen neuen Abgleich
   ausloest, waere eine Schleife. */
const STATUS_SCHLUESSEL = 'vt_syncStatus';

let SYNC_LAEUFT = false;
let SYNC_GEPLANT = null;
/* Wann zuletzt wegen Sichtbarkeit abgeglichen wurde — siehe visibilitychange
   ganz unten. Bewusst im Speicher und nicht im localStorage: die Sperre soll
   ein schnelles Hin und Her daempfen, nicht einen Neustart. */
let SYNC_ZULETZT = 0;
/* ⛔ Ebenfalls am 06.09.2026 von einer Minute auf zehn Sekunden. Diese Sperre
   bremst das ABHOLEN beim Zurueckkommen — und genau darauf wartet Elias, wenn
   er vom Handy zum Tablet wechselt. Ein GET kostet kein Schreibkontingent;
   teuer ist nur das Ablegen, und das findet ohnehin nur bei einer echten
   Aenderung statt (SYNC_OFFEN). */
const SICHTBAR_ABSTAND = 3 * 1000;

/* ⭐ Liegt hier ueberhaupt etwas Ungesichertes? (05.09.2026)
   Der visibilitychange-Zweig fuers WEGLEGEN kann nicht erst holen und
   vergleichen — der Browser haelt die Seite nicht auf, ein `await` liefe ins
   Leere. Er schickte deshalb IMMER, bei jedem Wegtippen. Im Netzprotokoll des
   Pruefstands standen daraufhin PUT-Anfragen im Dutzend hintereinander, und
   KV erlaubt 1.000 Schreibvorgaenge am Tag.

   Diese Marke ist die Antwort: syncGeaendert() setzt sie, ein geglueckter
   Upload loescht sie. Ohne Aenderung wird beim Weglegen nichts geschickt.
   ⚠️ Sie steht im Speicher, nicht im localStorage: nach einem Neustart holt
   gleicheAb() ohnehin, und eine gespeicherte Marke koennte nach einem Absturz
   faelschlich „nichts zu tun" behaupten. */
let SYNC_OFFEN = false;

function syncStempel(){
  try { return JSON.parse(localStorage.getItem(STEMPEL_SCHLUESSEL) || '{}'); }
  catch (e){ return {}; }
}
function merkeAenderung(schluessel){
  const s = syncStempel();
  s[schluessel] = Date.now();
  localStorage.setItem(STEMPEL_SCHLUESSEL, JSON.stringify(s));
  /* ⭐ „Hier ist gerade etwas passiert" — der Takt schaltet dadurch auf schnell.
     Genau das haelt Elias' Anspruch („sofort auf dem anderen Geraet") am Leben,
     ohne im Leerlauf weiterzufeuern. Siehe SYNC_TAKT_AKTIV weiter unten.
     ⚠️ syncRegung() steht erst spaeter in der Datei — beim AUFRUF existiert es,
     weil merkeAenderung() nie vor dem Laden des ganzen Moduls lauft. Der
     typeof-Test kostet nichts und macht die Reihenfolge egal. */
  if (typeof syncRegung === 'function') syncRegung();
}

/* ---------- Wo der Abgleich ueberhaupt moeglich ist ---------- */

/* Die App laeuft an zwei Adressen: der neuen (Cloudflare, mit /api/stand) und
   vorerst noch der alten auf github.io, wo es diesen Endpunkt nicht gibt. Dort
   wuerde jeder Versuch mit 404 enden und die Anzeige mit einer Fehlermeldung
   fuellen, die nach einem Defekt aussieht - obwohl dort schlicht kein Abgleich
   vorgesehen ist. Deshalb vorher fragen, statt hinterher zu deuten. */
function aufAlterAdresse(){
  return /(^|\.)github\.io$/i.test(location.hostname);
}

/* ⭐ Derselbe Fall wie github.io, nur naeher dran: der lokale Vorschauserver.
   `npx serve` liefert statische Dateien aus und kennt keine Pages Functions —
   /api/stand endet dort IMMER mit 404, egal ob der echte Abgleich funktioniert.

   Elias am 06.09.2026 mit einem Bildschirmfoto von localhost:8124: „warum ist
   hier die fehlermeldung?" und, als Begruendung fuer die Antwort gleich mit:
   „auf dem pc bzw hier der lokale da übe ich ja nicht wirklich, das öffnen wir
   vorallem wenn wir an der app arbeiten also sind da die daten nicht
   repräsentativ." Dann: „ich will aber auch diese fehlermeldung dort nicht
   stehen haben."

   ⛔ Unterdrueckt wird NUR das rote Band, nicht der Abgleich selbst. Wer lokal
   mit `wrangler pages dev` arbeitet, hat die Function und bekommt sie weiter —
   und was der Versuch ergeben hat, steht unveraendert in der Statuszeile.
   Eine Warnung ganz abzuschalten, weil sie an einer Stelle stoert, waere der
   Fehler: auf seinem Geraet muss sie erscheinen. [[wirkung_an_der_quelle_stilllegen]] */
function aufLokalerVorschau(){
  return /^(localhost|127\.0\.0\.1|\[::1\]|.*\.local)$/i.test(location.hostname);
}

/* ⛔⛔ DER PC BLEIBT DRAUSSEN — Elias am 06.09.2026:
     „aber der pc bzw lokalhost hier soll nicht synchron sein mit handy und
      tablet weil hier übe ich nicht sondern hier testen wir und fixen wir
      sachen"

   Das ist keine Bequemlichkeit, sondern eine Sicherung. Der Stand auf dem PC
   ist nicht sein Lernstand: dort stehen 216 Karten mit einem Termin von heute,
   entstanden beim ersten Start aus data/boxen.json — er hat ausdruecklich
   gesagt, die Daten seien nicht repraesentativ. Ein Abgleich von hier aus
   koennte seinen echten Fortschritt ueberschreiben.

   ⚠️ Bis heute fiel das nicht auf, weil `npx serve` keine Pages Functions
   kennt und /api/stand hier ohnehin 404 gibt — der Abgleich scheiterte also
   von selbst. Mit `wrangler pages dev` haette er funktioniert, und seit dem
   laufenden Takt (unten) waere daraus ein Schreibvorgang alle zwanzig
   Sekunden geworden. Ein Schutz, der nur zufaellig haelt, ist keiner.
   [[pc_daten_sind_nicht_sein_lernstand]] [[ausfall_ist_unsichtbar_gebaut]] */
function syncMoeglich(){
  return /^https?:$/.test(location.protocol)
      && !aufAlterAdresse()
      && !aufLokalerVorschau();
}

/* ---------- Anzeigen, was los ist ---------- */

/* ⭐ `erfolg` wird MITGEFUEHRT, nicht ueberschrieben (05.09.2026): der
   Zeitpunkt des letzten GEGLUECKTEN Abgleichs ist die Zahl, an der ein stilles
   Auseinanderlaufen sichtbar wird. `zeit` allein sagt nur, wann zuletzt
   VERSUCHT wurde — und ein Versuch, der jede Minute scheitert, sieht in einer
   Zeile mit frischem Zeitstempel taeglich neu aus. */
function merkeStatus(ok, text){
  let erfolg = 0;
  try { erfolg = (JSON.parse(localStorage.getItem(STATUS_SCHLUESSEL) || 'null') || {}).erfolg || 0; }
  catch (e){}
  if (ok) erfolg = Date.now();
  try {
    localStorage.setItem(STATUS_SCHLUESSEL, JSON.stringify({ ok, text, zeit: Date.now(), erfolg }));
  } catch (e){ /* voller Speicher darf den Abgleich nicht kippen */ }
  zeigeStatus();
  zeigeAbgleichWarnung();
}

function zeigeStatus(){
  const feld = document.getElementById('syncStand');
  if (!feld) return;
  let s = null;
  try { s = JSON.parse(localStorage.getItem(STATUS_SCHLUESSEL) || 'null'); } catch (e){}
  if (!s){ feld.textContent = 'Noch nicht abgeglichen'; return; }
  const d = new Date(s.zeit);
  const wann = d.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit' }) +
               ', ' + d.toLocaleTimeString('de-DE', { hour:'2-digit', minute:'2-digit' });
  feld.textContent = (s.ok ? '✓ ' : '⚠ ') + wann + ' — ' + s.text;
}

/* ---------- Die Warnung auf dem Startbildschirm (05.09.2026) ---------------

   ⛔ Die Statuszeile in den Einstellungen gibt es seit dem 11.08.2026, und sie
   hat den Fehler trotzdem nicht aufgedeckt: niemand oeffnet die Einstellungen,
   um zu pruefen, ob etwas funktioniert, von dem er annimmt, dass es
   funktioniert. Elias hat es erst gemerkt, als er beide Geraete nebeneinander
   hielt — Handy 138/24/13/34/44, Tablet 166/14/23/37/13.
   [[ausfall_ist_unsichtbar_gebaut]]

   ⚠️ Die Schwelle haengt am letzten ERFOLG, nicht am letzten Versuch. Ein
   Versuch, der stuendlich scheitert, traegt einen frischen Zeitstempel und
   saehe in jeder anderen Rechnung gesund aus.

   ⚠️ Wer noch NIE abgeglichen hat, bekommt sie auch — aber erst, wenn ein
   Versuch stattgefunden hat und fehlschlug. Ohne diese Bedingung stuende sie
   beim allerersten Start einer frischen Installation da, wo sie nichts
   bedeutet. */
const ABGLEICH_FRIST = 24 * 60 * 60 * 1000;

function zeigeAbgleichWarnung(){
  const band = document.getElementById('syncWarnung');
  if (!band) return;
  const feld = document.getElementById('syncWarnungText');
  let s = null;
  try { s = JSON.parse(localStorage.getItem(STATUS_SCHLUESSEL) || 'null'); } catch (e){}
  /* ⛔ aufLokalerVorschau() steht VOR der Statusprüfung: auf localhost gibt es
     keinen Endpunkt, der 404 sagt also nichts über den echten Abgleich. */
  if (aufLokalerVorschau() || !syncMoeglich() || !s || s.ok){ band.hidden = true; return; }

  const her = s.erfolg ? Date.now() - s.erfolg : null;
  if (her !== null && her < ABGLEICH_FRIST){ band.hidden = true; return; }

  const stunden = her === null ? null : Math.floor(her / 3600000);
  const wann = stunden === null ? 'noch nie'
             : stunden >= 48    ? ('vor ' + Math.floor(stunden/24) + ' Tagen')
                                : ('vor ' + stunden + ' Stunden');
  if (feld) feld.textContent = 'Dieses Gerät gleicht sich gerade nicht ab — zuletzt geglückt: '
    + wann + '. Grund: ' + s.text + '. Solange lernst du hier auf einem eigenen Stand, '
    + 'der auf deinen anderen Geräten nicht ankommt.';
  band.hidden = false;
}

/* Wie viele Woerter nach dem Abgleich lokal stehen. Das ist die Zahl, an der
   Elias erkennt, ob etwas angekommen ist - "abgeglichen" allein sagt nichts. */
function wortzahl(){
  try { return Object.keys(JSON.parse(localStorage.getItem('vt_progress') || '{}')).length; }
  catch (e){ return 0; }
}

/* ---------- Zusammenfuehren ---------- */

function fuehreFortschrittZusammen(hier, dort){
  const raus = {};
  const alle = new Set([...Object.keys(hier || {}), ...Object.keys(dort || {})]);
  alle.forEach(id => {
    const a = hier && hier[id];
    const b = dort && dort[id];
    if (!a) { raus[id] = b; return; }
    if (!b) { raus[id] = a; return; }
    if (a.ts || b.ts){ raus[id] = (a.ts || 0) >= (b.ts || 0) ? a : b; return; }
    /* Kein Stempel auf beiden Seiten: Ersatzregel ueber die Antwortzahl. */
    const za = (a.correct||0) + (a.wrong||0);
    const zb = (b.correct||0) + (b.wrong||0);
    raus[id] = za >= zb ? a : b;
  });
  return raus;
}

/* Einstellungen feldweise mischen. Für jedes Feld entscheidet SEIN eigener
   Stempel, nicht der des ganzen Blocks.

   ⚠️ Kennt eine Seite ein Feld gar nicht, wird der fremde Wert uebernommen -
   sonst kaeme eine neu hinzugekommene Einstellung nie auf das andere Geraet.
   Bei Gleichstand bleibt das Lokale stehen: lieber nichts anfassen. */
function fuehreEinstellungenZusammen(hier, dort, stempelHier, stempelDort){
  const raus = Object.assign({}, hier || {});
  Object.keys(dort || {}).forEach(f => {
    const a = (stempelHier && stempelHier[f]) || 0;
    const b = (stempelDort && stempelDort[f]) || 0;
    if (b > a) raus[f] = dort[f];
    else if (!(f in raus)) raus[f] = dort[f];
  });
  return raus;
}

function fuehreZusammen(fern){
  const meine = syncStempel();
  const fremde = (fern && fern.stempel) || {};
  const fernDaten = (fern && fern.daten) || {};
  let etwasGeaendert = false;

  SYNC_SCHLUESSEL.forEach(k => {
    const hierRoh = localStorage.getItem(k);
    const dortRoh = fernDaten[k];
    if (dortRoh == null) return;                 /* Gegenseite kennt ihn nicht */
    if (hierRoh == null){                        /* wir kennen ihn nicht */
      localStorage.setItem(k, dortRoh);
      etwasGeaendert = true;
      return;
    }
    if (hierRoh === dortRoh) return;

    /* ⭐ Einstellungen FELDWEISE, nicht als Block - siehe die lange Begruendung
       bei saveSettings() in js/kern.js. Ohne das verteidigt ein Kapitel-Chip
       die alte Lernrichtung gegen die neuere vom anderen Geraet. */
    if (k === 'vt_settings'){
      try {
        const zusammen = fuehreEinstellungenZusammen(
          JSON.parse(hierRoh), JSON.parse(dortRoh),
          (typeof settingsFeldStempel === 'function') ? settingsFeldStempel() : {},
          JSON.parse(fernDaten['vt_settingsFeld'] || '{}'));
        const neu = JSON.stringify(zusammen);
        if (neu !== hierRoh){ localStorage.setItem(k, neu); etwasGeaendert = true; }
      } catch (e){ /* kaputtes JSON auf einer Seite: lokal behalten */ }
      return;
    }
    /* Die Stempelkarte selbst: je Feld der spaetere gewinnt. Sie steht in
       SYNC_SCHLUESSEL NACH vt_settings, damit oben noch der eigene Stand gilt. */
    if (k === 'vt_settingsFeld'){
      try {
        const a = JSON.parse(hierRoh), b = JSON.parse(dortRoh);
        const raus = Object.assign({}, a);
        Object.keys(b).forEach(f => { if ((b[f]||0) > (raus[f]||0)) raus[f] = b[f]; });
        const neu = JSON.stringify(raus);
        if (neu !== hierRoh){ localStorage.setItem(k, neu); etwasGeaendert = true; }
      } catch (e){ }
      return;
    }

    /* „Kenne ich schon": je Wort die SPAETERE Entscheidung. Der Eintrag ist
       {an:true|false, zeit:…}, das Zurücknehmen ist also eine Tatsache mit
       Datum und keine Luecke. Eine blosse Vereinigung der markierten Ids waere
       einfacher gewesen und stillschweigend falsch: sie holt ein
       zurueckgenommenes Wort vom anderen Geraet sofort wieder herein.

       ⭐ `vt_vorschlagNr` (18.08.2026) laeuft ueber denselben Zweig: der Eintrag
       ist {nr:…, zeit:…}, und gebraucht wird genau dasselbe - je Id gewinnt der
       spaetere Zeitstempel. Der Zweig liest ausser `zeit` nichts aus dem
       Eintrag, deshalb reicht die zweite Bedingung statt einer Kopie. */
    /* ⛔⛔ vt_hifz, vt_hifzVerse und vt_quranFav sind am 06.09.2026 dazugekommen,
       und das war eine BEHEBUNG, kein Nachruesten. Elias:

         „ich habe eben auf meinem tablet geguckt und die sura zalzala war nicht
          als gelernt markiert […] ich möchte das alles was sowohl auf meinem
          handy, als auch auf meinem tablat 1:1 identisch ist."

       Sie liefen ueber den Schlusszweig unten — „der juengere Stempel gewinnt",
       als ganzer Block. Markiert er auf dem Handy eine Sure und auf dem Tablet
       eine andere, ueberlebte nur die vom juengeren Geraet. Genau der Fehler,
       der hier fuer vt_bekannt und weiter unten fuer vt_notes schon behoben war.
       [[allgemeine_regel_statt_listeneintrag]] */
    if (k === 'vt_bekannt' || k === 'vt_einzeln_frei' || k === 'vt_vorschlagNr' || k === 'vt_wortAenderungen' || k === 'vt_geloescht'
        || k === 'vt_hifz' || k === 'vt_hifzVerse' || k === 'vt_quranFav'){
      try {
        /* ⚠️ Das andere Geraet kann noch die ALTE Fassung fahren und die alte
           Form schicken ({id: true}). Beide Seiten werden deshalb erst auf
           {an, zeit} gebracht. Zeit 0 heisst „schon immer" und verliert gegen
           jede echte Aenderung — ohne das gaebe es einen Datenverlust genau in
           der Uebergangszeit, in der Elias noch nicht beide Geraete neu
           geladen hat. */
        const reich = o => {
          const raus = {};
          for (const [id, v] of Object.entries(o || {}))
            raus[id] = (v && typeof v === 'object') ? { an: !!v.an, zeit: Number(v.zeit) || 0 }
                                                    : { an: !!v, zeit: 0 };
          return raus;
        };
        const zeitform = (k === 'vt_hifz' || k === 'vt_hifzVerse' || k === 'vt_quranFav');
        const a = zeitform ? reich(JSON.parse(hierRoh)) : (JSON.parse(hierRoh) || {});
        const b = zeitform ? reich(JSON.parse(dortRoh)) : (JSON.parse(dortRoh) || {});
        const raus = Object.assign({}, a);
        Object.keys(b).forEach(id => {
          const hier = raus[id], dort = b[id];
          if (!dort || typeof dort !== 'object') return;
          if (!hier || (dort.zeit || 0) > (hier.zeit || 0)) raus[id] = dort;
        });
        const neu = JSON.stringify(raus);
        if (neu !== hierRoh){ localStorage.setItem(k, neu); etwasGeaendert = true; }
      } catch (e){ /* kaputtes JSON auf einer Seite: lokal behalten */ }
      return;
    }

    /* Verworfene Vorschlaege: VEREINIGUNG je Wort UND je Nummer.
       { wortId: { nummer: {text, zeit} } }. Bei einem Treffer auf beiden Seiten
       gewinnt der FRUEHERE Zeitpunkt — er beantwortet die Frage "seit wann
       stoert ihn das", und die aendert sich durch einen zweiten Blick nicht. */
    if (k === 'vt_vorschlagWeg'){
      try {
        const a = JSON.parse(hierRoh) || {}, b = JSON.parse(dortRoh) || {};
        const raus = {};
        for (const id of new Set([...Object.keys(a), ...Object.keys(b)])){
          const ha = (a[id] && typeof a[id] === 'object') ? a[id] : {};
          const hb = (b[id] && typeof b[id] === 'object') ? b[id] : {};
          const zusammen = {};
          for (const nr of new Set([...Object.keys(ha), ...Object.keys(hb)])){
            const x = ha[nr], y = hb[nr];
            if (!x) zusammen[nr] = y;
            else if (!y) zusammen[nr] = x;
            else zusammen[nr] = ((x.zeit || 0) <= (y.zeit || 0)) ? x : y;
          }
          if (Object.keys(zusammen).length) raus[id] = zusammen;
        }
        const neu = JSON.stringify(raus);
        if (neu !== hierRoh){ localStorage.setItem(k, neu); etwasGeaendert = true; }
      } catch (e){ /* kaputtes JSON auf einer Seite: lokal behalten */ }
      return;
    }

    /* ⛔⛔ SEINE EIGENEN TEXTE: VEREINIGUNG JE WORT, nicht Blockersatz.
       ==============================================================
       `vt_notes` (eigene Eselsbruecken) und `vt_notizen` (eigene Notizen) haben
       die Form { wortId: "Text" } — ohne Zeitstempel je Eintrag. Sie liefen bis
       zum 20.08.2026 ueber den Schlusszweig „der juengere Stempel gewinnt", und
       zwar als GANZER BLOCK.

       Die Folge: Schreibt Elias am Handy eine Notiz zu Wort A und am Tablet
       eine zu Wort B, ueberlebt nur die vom juengeren Geraet. Die andere ist
       weg — und es ist selbst geschriebener Text, den niemand wiederherstellen
       kann.

       Genau diesen Fehler beschreibt der Kommentar bei `vt_bekannt` weiter
       oben („verloere der aeltere Stempel alle drei"). Dort wurde er behoben,
       hier stand er noch. `vt_notizen` habe ich am 19.08.2026 selbst
       hinzugefuegt und den Zweig nicht mitgedacht.

       ⚠️ Ohne Zeitstempel je Wort ist ein Feld-fuer-Feld-Vergleich nicht
       moeglich. Deshalb: alles vereinigen, und wo BEIDE Seiten einen Text zum
       selben Wort haben, entscheidet der Blockstempel. Ein Wort, das nur eine
       Seite kennt, ueberlebt in jedem Fall — und das ist der haeufige Fall.
       [[ausfall_ist_unsichtbar_gebaut]] */
    if (k === 'vt_notes' || k === 'vt_notizen'){
      try {
        const a = JSON.parse(hierRoh) || {}, b = JSON.parse(dortRoh) || {};
        const fremdIstNeuer = (fremde[k] || 0) > (meine[k] || 0);
        const raus = Object.assign({}, a);
        Object.keys(b).forEach(id => {
          const hier = raus[id], dort = b[id];
          if (typeof dort !== 'string' || !dort.trim()) return;
          if (typeof hier !== 'string' || !hier.trim()){ raus[id] = dort; return; }
          if (hier !== dort && fremdIstNeuer) raus[id] = dort;
        });
        const neu = JSON.stringify(raus);
        if (neu !== hierRoh){ localStorage.setItem(k, neu); etwasGeaendert = true; }
      } catch (e){ /* kaputtes JSON auf einer Seite: lokal behalten */ }
      return;
    }

    /* Fortschritt je Regel UND je Uebungsmodus: monotone Zaehler, feldweises
       Maximum. ⚠️ Das Maximum, nicht die Summe: derselbe Abgleich kann zweimal
       laufen, und eine Summe zaehlte dann Uebung, die nicht stattfand.
       [[zahlen_ohne_beleg]] */
    if (k === 'vt_regelStand' || k === 'vt_uebungStand'){
      try {
        const a = JSON.parse(hierRoh) || {}, b = JSON.parse(dortRoh) || {};
        const raus = Object.assign({}, a);
        Object.keys(b).forEach(id => {
          const d = b[id];
          if (!d || typeof d !== 'object') return;
          const h = raus[id];
          if (!h){ raus[id] = d; return; }
          raus[id] = {
            gestellt: Math.max(h.gestellt || 0, d.gestellt || 0),
            richtig:  Math.max(h.richtig  || 0, d.richtig  || 0),
            zuletzt:  (String(h.zuletzt || '') >= String(d.zuletzt || '')) ? h.zuletzt : d.zuletzt
          };
        });
        const neu = JSON.stringify(raus);
        if (neu !== hierRoh){ localStorage.setItem(k, neu); etwasGeaendert = true; }
      } catch (e){ /* kaputtes JSON auf einer Seite: lokal behalten */ }
      return;
    }

    /* ⛔⛔ LISTEN UND SAMMLUNGEN, die bis zum 06.09.2026 ebenfalls als BLOCK
       ersetzt wurden — dieselbe Klasse wie vt_hifz, gefunden bei der Suche
       nach weiteren Faellen, nachdem Elias „alles andere an funktionen soll
       syncron sein" verlangt hatte.

       vt_personalVocab  seine SELBST ANGELEGTEN Vokabeln, Array mit `id`.
                         Legt er am Handy eine an und am Tablet eine andere,
                         ueberlebte nur die Liste des juengeren Geraets.
                         ⭐ Vereinigung ist hier sicher, weil das LOESCHEN
                         ueber einen eigenen Schluessel laeuft: `vt_geloescht`
                         (js/buecher.js prueft `weg[w.id] && weg[w.id].an`).
       vt_customCats     eigene Kategorien, Array mit `id` und `wordIds`.
                         Bei gleicher id werden die Wortlisten vereinigt.
                         ⚠️ Eine geloeschte Kategorie kann dadurch von einem
                         Geraet zurueckkommen, das die Loeschung nicht kennt —
                         sichtbar und mit einem Tipp wieder weg. Der Verlust
                         einer selbst angelegten Kategorie waere schlimmer.
       vt_uebungstage    der Uebungskalender, { "2026-09-06": 12 }. Vereinigung
                         je Tag, bei Kollision das MAXIMUM. Nicht die Summe:
                         ein zweiter Abgleich desselben Tages wuerde sonst
                         aufaddieren, und der Kalender behauptete Uebung, die
                         nicht stattgefunden hat. [[zahlen_ohne_beleg]] */
    if (k === 'vt_personalVocab' || k === 'vt_customCats'){
      try {
        const a = JSON.parse(hierRoh), b = JSON.parse(dortRoh);
        if (!Array.isArray(a) || !Array.isArray(b)) throw new Error('kein Array');
        const raus = a.slice();
        const stelle = new Map(raus.map((x, i) => [String(x && x.id), i]));
        for (const x of b){
          if (!x || x.id == null) continue;
          const i = stelle.get(String(x.id));
          if (i === undefined){ stelle.set(String(x.id), raus.length); raus.push(x); continue; }
          if (k === 'vt_customCats' && Array.isArray(raus[i].wordIds) && Array.isArray(x.wordIds)){
            raus[i] = Object.assign({}, raus[i],
              { wordIds: [...new Set([...raus[i].wordIds, ...x.wordIds])] });
          }
        }
        const neu = JSON.stringify(raus);
        if (neu !== hierRoh){ localStorage.setItem(k, neu); etwasGeaendert = true; }
      } catch (e){ /* kaputtes JSON oder unerwartete Form: lokal behalten */ }
      return;
    }

    /* ⛔ Die Serie (06.09.2026). Sie lief ebenfalls ueber den Blockersatz, und
       der Schaden ist hier subtiler als ein fehlender Eintrag: uebt Elias
       taeglich am Handy und einmal am Tablet, das seit Tagen nicht abgeglichen
       hat, sieht `touchStreak()` dort einen alten `last` — und setzt die Serie
       auf 1 zurueck. Vierzig Tage weg, ohne dass irgendetwas gemeldet wird.

       Regel: der juengere `last` gewinnt, denn er beschreibt den aktuelleren
       Stand. Bei GLEICHEM Tag gewinnt der hoehere `count` — dann haben beide
       Geraete denselben Tag gezaehlt, und die laengere Serie ist die wahre.
       `gnadeAm` reist mit dem gewinnenden Eintrag: es gehoert zu dessen
       Zaehlung und waere einzeln genommen eine Behauptung ueber einen Tag,
       den dieser Stand gar nicht kennt. */
    if (k === 'vt_streak'){
      try {
        const a = JSON.parse(hierRoh) || {}, b = JSON.parse(dortRoh) || {};
        const la = String(a.last || ''), lb = String(b.last || '');
        let sieger;
        if (la === lb) sieger = ((Number(a.count) || 0) >= (Number(b.count) || 0)) ? a : b;
        else sieger = (la > lb) ? a : b;
        const neu = JSON.stringify(sieger);
        if (neu !== hierRoh){ localStorage.setItem(k, neu); etwasGeaendert = true; }
      } catch (e){ /* kaputtes JSON auf einer Seite: lokal behalten */ }
      return;
    }

    /* Meilensteine: Vereinigung je Marke, der FRUEHERE Zeitpunkt gewinnt. */
    if (k === 'vt_feiern'){
      try {
        const a = JSON.parse(hierRoh) || {}, b = JSON.parse(dortRoh) || {};
        const raus = Object.assign({}, a);
        for (const [marke, datum] of Object.entries(b))
          if (!raus[marke] || String(datum) < String(raus[marke])) raus[marke] = datum;
        const neu = JSON.stringify(raus);
        if (neu !== hierRoh){ localStorage.setItem(k, neu); etwasGeaendert = true; }
      } catch (e){ /* kaputtes JSON auf einer Seite: lokal behalten */ }
      return;
    }

    if (k === 'vt_uebungstage'){
      try {
        const a = JSON.parse(hierRoh) || {}, b = JSON.parse(dortRoh) || {};
        const raus = Object.assign({}, a);
        for (const [tag, n] of Object.entries(b))
          raus[tag] = Math.max(Number(raus[tag]) || 0, Number(n) || 0);
        const neu = JSON.stringify(raus);
        if (neu !== hierRoh){ localStorage.setItem(k, neu); etwasGeaendert = true; }
      } catch (e){ /* kaputtes JSON auf einer Seite: lokal behalten */ }
      return;
    }

    /* ⭐ Die Trefferquote je Tag (07.09.2026). Sie gehoert aus demselben Grund
       hierher wie `vt_uebungstage`: Elias uebt auf Handy UND Tablet, und eine
       Quote, die nur die Aufgaben EINES Geraets kennt, taugt fuer den
       Rauschversuch nicht.

       ⛔ MAXIMUM je Feld, NICHT Summe. Beide Geraete gleichen sich gegenseitig
       ab — eine Summe waere beim naechsten Durchlauf noch einmal summiert und
       die Zahl verdoppelte sich stillschweigend. Genau deshalb nimmt
       `vt_uebungstage` daneben ebenfalls das Maximum.

       ⚠️ Das UNTERSCHAETZT einen Tag, an dem er auf beiden Geraeten geuebt hat.
       Fuer den Vergleich zweier Zeitraeume ist das hinnehmbar (der Fehler
       trifft beide Seiten gleich), fuer eine absolute Aussage nicht — und
       genau deshalb steht die Zahl in der Statistik immer MIT ihrem Nenner.
       ⭐ `richtig` kann dabei nie ueber `gestellt` steigen: auf jedem Geraet
       gilt richtig ≤ gestellt, also gilt es auch fuer die beiden Maxima. */
    /* ⭐ „Laut sagen" je Wort: { wortId: Rundennummer }. Die HÖHERE Nummer
       gewinnt — sie heißt „zuletzt dran", und wer zuletzt dran war, ist auf
       beiden Geräten dieselbe Aussage. Ein Blockstempel würde die Markierungen
       des anderen Geräts wegwerfen; das Wort käme dort sofort wieder dran und
       ein anderes nie. */
    /* ⭐ Die stille Zeitmessung: { Tag: { Gerät: { learn, sentences, hoeren } } }.
       Vereinigt über beide Ebenen, je Modus das MAXIMUM.

       ⭐ Warum das Maximum hier verlustfrei ist, anders als bei
       `vt_uebungstage`: Dort steht eine Zahl JE TAG, und zwei Geräte
       überschreiben einander. Hier steht sie je Tag UND Gerät — innerhalb
       eines Geräts wächst der Zähler monoton, also ist der größere Wert immer
       der jüngere. Über die Geräte hinweg wird nichts verglichen, sondern
       nebeneinandergelegt; summiert wird erst beim Lesen in `zeitBericht()`. */
    if (k === 'vt_zeit'){
      try {
        const a = JSON.parse(hierRoh) || {}, b = JSON.parse(dortRoh) || {};
        const raus = {};
        for (const tag of new Set([...Object.keys(a), ...Object.keys(b)])){
          raus[tag] = {};
          const ga = a[tag] || {}, gb = b[tag] || {};
          for (const g of new Set([...Object.keys(ga), ...Object.keys(gb)])){
            raus[tag][g] = {};
            const ma = ga[g] || {}, mb = gb[g] || {};
            for (const m of new Set([...Object.keys(ma), ...Object.keys(mb)]))
              raus[tag][g][m] = Math.max(Number(ma[m]) || 0, Number(mb[m]) || 0);
          }
        }
        const neu = JSON.stringify(raus);
        if (neu !== hierRoh){ localStorage.setItem(k, neu); etwasGeaendert = true; }
      } catch (e){ /* kaputtes JSON auf einer Seite: lokal behalten */ }
      return;
    }
    if (k === 'vt_lautStand'){
      try {
        const a = JSON.parse(hierRoh) || {}, b = JSON.parse(dortRoh) || {};
        const raus = Object.assign({}, a);
        for (const [id, nr] of Object.entries(b))
          raus[id] = Math.max(Number(raus[id]) || 0, Number(nr) || 0);
        const neu = JSON.stringify(raus);
        if (neu !== hierRoh){ localStorage.setItem(k, neu); etwasGeaendert = true; }
      } catch (e){ /* kaputtes JSON auf einer Seite: lokal behalten */ }
      return;
    }

    if (k === 'vt_quoteTage'){
      try {
        const a = JSON.parse(hierRoh) || {}, b = JSON.parse(dortRoh) || {};
        const raus = Object.assign({}, a);
        for (const [tag, e] of Object.entries(b)){
          const hier = raus[tag] || {};
          /* ⛔⛔ ÜBER DIE FELDER LAUFEN, nicht zwei fest hinschreiben. Hier
             stand bis zum 07.09.2026 ein Objektliteral mit genau `gestellt`
             und `richtig` — als an diesem Tag `kGestellt`/`kRichtig` für die
             Karteikarten dazukamen, hätte es sie beim ersten Abgleich
             stillschweigend weggeworfen: das Literal ERSETZT den Eintrag, es
             ergänzt ihn nicht. Kein Fehler, keine Meldung, nur eine Zahl, die
             auf beiden Geräten wieder bei null steht.
             [[angleichen_loescht_handarbeit]] · [[ausfall_ist_unsichtbar_gebaut]] */
          const zusammen = {};
          for (const feld of new Set([...Object.keys(hier), ...Object.keys(e || {})]))
            zusammen[feld] = Math.max(Number(hier[feld]) || 0, Number(e && e[feld]) || 0);
          raus[tag] = zusammen;
        }
        const neu = JSON.stringify(raus);
        if (neu !== hierRoh){ localStorage.setItem(k, neu); etwasGeaendert = true; }
      } catch (e){ /* kaputtes JSON auf einer Seite: lokal behalten */ }
      return;
    }

    if (k === 'vt_progress'){
      try {
        const zusammen = fuehreFortschrittZusammen(JSON.parse(hierRoh), JSON.parse(dortRoh));
        const neu = JSON.stringify(zusammen);
        if (neu !== hierRoh){ localStorage.setItem(k, neu); etwasGeaendert = true; }
      } catch (e){ /* kaputtes JSON auf einer Seite: lokal behalten */ }
      return;
    }

    /* Alles andere: der juengere Stempel gewinnt. Bei Gleichstand bleibt das
       Lokale stehen - lieber nichts anfassen als etwas wegwerfen. */
    if ((fremde[k] || 0) > (meine[k] || 0)){
      localStorage.setItem(k, dortRoh);
      etwasGeaendert = true;
    }
  });
  return etwasGeaendert;
}

/* ---------- Uebertragen ---------- */

function baueNutzlast(){
  const daten = {};
  SYNC_SCHLUESSEL.forEach(k => {
    const v = localStorage.getItem(k);
    if (v !== null) daten[k] = v;
  });
  return { fassung: 1, geaendert: Date.now(), stempel: syncStempel(), daten };
}

async function holeVomServer(){
  const antwort = await fetch('/api/stand', { headers: { 'accept': 'application/json' }});
  if (!antwort.ok) throw new Error('Abruf fehlgeschlagen: ' + antwort.status);
  /* ⚠️ Bei abgelaufener Anmeldung leitet Access auf die Loginseite um. Dann
     kommt HTML statt JSON - das darf NICHT als leerer Stand gelten, sonst
     ueberschriebe der naechste Upload den Server mit einem halben Stand. */
  if (antwort.redirected) throw new Error('nicht angemeldet');
  return antwort.json();
}

async function schickeZumServer(){
  const antwort = await fetch('/api/stand', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(baueNutzlast())
  });
  if (!antwort.ok) throw new Error('Ablegen fehlgeschlagen: ' + antwort.status);
  return antwort.json();
}

/* ---------- Ablauf ---------- */

/* ---------- Zurueck nach arabicroots (07.09.2026) ----------

   Elias mit Bild der Klassenrangliste: „damit der lehrer oder auch die anderen
   sehen können das ich noch weiter arbeite. weil der stand ist gleich geblieben
   seit dem ich meine vokabeltrainer app benutze."

   ⛔ NUR die Karteikarten-Zahlen (`correct`/`wrong` je Wort) und der
   Zeitstempel. Bewusst nicht der ganze Lernstand: drueben zaehlt eine
   Vokabelabfrage, und nur die ist mit dem vergleichbar, was die anderen zehn
   in der Liste gemacht haben — Elias' eigene Vorgabe („für die berechnung der
   quote soll nur die karteikarten übung zählen").

   ⚠️ Der Rest ist Sache von functions/api/arabicroots.js: was drueben schon
   steht, wie die Differenz gebildet wird, ob ueberhaupt Zugangsdaten
   eingerichtet sind. Hier wird nur geschickt und geschwiegen.

   ⛔ Und es MELDET NICHTS. Elias hat nichts gedrueckt — der Abgleich laeuft von
   selbst beim Weglegen der App. Ein Hinweis daraus waere genau das Briefing,
   das er abbestellt hat. [[keine_meldung_ohne_seine_handlung]] */
async function schickeNachArabicroots(){
  try {
    if (typeof PROGRESS === 'undefined' || !PROGRESS) return;
    const fortschritt = {};
    for (const [id, p] of Object.entries(PROGRESS)){
      if (!p) continue;
      const c = Number(p.correct) || 0, w = Number(p.wrong) || 0;
      if (!c && !w) continue;          /* nie beantwortet — nichts zu melden */
      fortschritt[id] = { correct: c, wrong: w, ts: Number(p.ts) || 0 };
    }
    if (!Object.keys(fortschritt).length) return;
    await fetch('/api/arabicroots', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fortschritt }),
    });
  } catch (e){ /* offline, nicht eingerichtet, Zeitgrenze: alles folgenlos */ }
}

async function gleicheAb(still){
  if (SYNC_LAEUFT) return;
  if (!syncMoeglich()){
    merkeStatus(false, aufAlterAdresse()
      ? 'auf dieser alten Adresse nicht vorgesehen'
      : 'nur ueber das Netz moeglich');
    return;
  }
  SYNC_LAEUFT = true;
  try {
    const fern = await holeVomServer();
    const geaendert = fuehreZusammen(fern);
    /* ⭐ Nur schreiben, wenn sich wirklich etwas unterscheidet (05.09.2026).
       KV erlaubt im Gratistarif 1.000 Schreibvorgaenge am Tag, aber 100.000
       Lesevorgaenge — ein Abruf ist also fast gratis, ein Ablegen nicht. Vorher
       schrieb JEDER Abgleich, auch der, bei dem beide Seiten schon gleich
       waren. Das ist die Voraussetzung dafuer, beim Zurueckkommen in die App
       abgleichen zu duerfen (siehe visibilitychange unten). */
    const gleich = JSON.stringify(baueNutzlast().daten)
                === JSON.stringify((fern && fern.daten) || {});
    if (!gleich) await schickeZumServer();
    SYNC_OFFEN = false;
    merkeStatus(true, wortzahl() + ' Wörter' + (geaendert ? ', Stand aktualisiert' : ''));
    if (geaendert){
      /* ⭐ Von fern kam etwas — also sitzt er wahrscheinlich gerade an beiden
         Geraeten. Den Takt wach halten, damit die naechste Aenderung nicht
         90 Sekunden braucht. */
      if (typeof syncRegung === 'function') syncRegung();
      /* Die App haelt PROGRESS und SETTINGS im Speicher - nach einer Aenderung
         von aussen muessen sie neu eingelesen werden, sonst ueberschreibt der
         naechste lokale Schreibvorgang das gerade Geholte wieder. */
      if (typeof ladeStandNeu === 'function') ladeStandNeu();
      if (!still && typeof toast === 'function') toast('Lernstand abgeglichen.');
    }
    /* ⭐ Und danach nach arabicroots zurueckschreiben (07.09.2026). Elias:
       „meine versuche sollen sich laufend aktualisiern die prozentzahl soll
       weiter auf der bisherigen aufbauen." Hier ist die Stelle dafuer: der
       Abgleich laeuft ohnehin bei jedem Weglegen der App, auf Handy wie
       Tablet, und der Stand ist gerade frisch zusammengefuehrt.

       ⛔ NACH dem Abgleich und bewusst OHNE `await` im Erfolgspfad: was drueben
       passiert, darf den Lernstand hier nie aufhalten. Ist arabicroots
       langsam, nicht eingerichtet oder gerade weg, ist das fuer den
       Vokabeltrainer folgenlos. [[fehler_trifft_mehr_als_gemeldet]] */
    schickeNachArabicroots();
  } catch (e){
    /* Offline oder abgemeldet ist kein Fehler, sondern der Normalfall
       unterwegs. Es wird nichts kaputtgemacht - beim naechsten Start laeuft es
       erneut. Gemeldet wird es aber sehr wohl, nur eben leise in die Statuszeile
       statt als Meldung mitten ins Lernen. */
    const grund = /nicht angemeldet|401|403/.test(e.message) ? 'nicht angemeldet — App neu laden'
                : (navigator.onLine === false)               ? 'offline'
                : 'nicht erreichbar (' + e.message + ')';
    merkeStatus(false, grund);
    if (!still && typeof toast === 'function') toast('Abgleich gerade nicht moeglich: ' + grund);
  } finally {
    SYNC_LAEUFT = false;
  }
}

/* Gebuendelt statt sofort: KV erlaubt im Gratistarif 1.000 Schreibvorgaenge am
   Tag. Nach jeder Karte zu senden waere bei 138 faelligen Woertern schon eine
   Runde am Limit.

   ⭐ Am 19.08.2026 von zehn Sekunden auf fuenf Minuten verlaengert. Elias:
   „vielleicht will ich nur mal kurz rein gucken oder was testen. da sind 5 min
   denke ich besser bevor was in gang gesetzt wird."

   Der Grund ist nicht das Schreibkontingent, sondern die Absicht: ein Blick in
   die App ist noch keine Entscheidung. Wer ein Kapitel antippt und es gleich
   wieder abwaehlt, soll damit keine Wartungsroutine ausloesen.

   ⚠️ Gefahrlos NUR wegen der Sicherung weiter unten: `visibilitychange`
   bricht die Wartezeit ab und gleicht sofort ab, sobald die App weggelegt
   wird. Ohne die waere jede Aenderung fuenf Minuten lang ungesichert — und
   auf dem Handy wird eine App selten fuenf Minuten lang bewusst geschlossen. */
/* ⛔ AM 06.09.2026 VON FUENF MINUTEN AUF ZEHN SEKUNDEN ZURUECK — auf Elias'
   ausdruecklichen Wunsch, und damit gegen seine eigene Entscheidung vom
   19.08.: „ich möchte das es auch nahtlos und sofort syncronisiert wird."

   Sein Grund von damals bleibt gueltig, trifft aber nicht: „ein Blick in die
   App ist noch keine Entscheidung" — der Takt startet nur ueber
   syncGeaendert(), also erst, wenn wirklich etwas gespeichert wurde. Wer nur
   hineinschaut, loest weiterhin nichts aus.

   ⚠️ Am selben Tag weiter auf FUENF Sekunden, zusammen mit einem laufenden
   Abholtakt von acht — Elias' Ziel lautet „das was auf dem einen gerät
   passiert auch auf dem anderen sofort passiert". Damit liegt die
   schlechteste Verzoegerung bei rund dreizehn Sekunden.

   ⭐ Am selben Tag noch einmal nachgeschaerft: senden nach 3 s, holen alle
   4 s — schlechtestenfalls rund SIEBEN Sekunden, typisch vier.

   ⚠️ Der Normalfall ist ohnehin schneller als jede dieser Zahlen: legt Elias
   ein Geraet weg, wird SOFORT geschickt (visibilitychange unten), und nimmt er
   das andere, wird SOFORT geholt. Die Sekundenwerte greifen nur, wenn beide
   Geraete gleichzeitig offen nebeneinanderliegen.

   ⚠️ Fuenf Sekunden buendeln eine Lernrunde noch: wer zuegig antwortet,
   erzeugt EINEN Schreibvorgang fuer mehrere Karten. Bei 216 Karten und je
   fuenf Sekunden Denkzeit waeren es im schlimmsten Fall 216 von 1.000
   erlaubten am Tag. Wird es je knapp, ist die Zahl hier zu erhoehen — nicht
   die Sicherung wegzunehmen.

   ⛔ Schneller geht es mit diesem Aufbau nicht ehrlich: KV kennt kein Push.
   Wirklich „sofort" braeuchte eine stehende Verbindung (SSE oder WebSocket),
   und die gibt es auf Pages Functions nicht ohne Durable Objects. Das waere
   ein eigener Umbau, keine Zahl. */
const SYNC_WARTEZEIT = 3 * 1000;
function planeAbgleich(){
  clearTimeout(SYNC_GEPLANT);
  SYNC_GEPLANT = setTimeout(()=> gleicheAb(true), SYNC_WARTEZEIT);
}

/* ⛔⛔ UND EIN LAUFENDER TAKT, SOLANGE DIE APP OFFEN IST (06.09.2026)
   ==================================================================
   Elias: „egal was ich auf welchem gerät mache wird auch sofort auf dem
   anderen gerät angezeigt".

   Bis hierher stimmte das nur fuer den Weg HIN: eine Aenderung ging nach zehn
   Sekunden hoch. Geholt wurde aber ausschliesslich beim Start und beim
   Sichtbarwerden — ein Tablet, das offen danebenliegt, bekam NICHTS mit,
   solange man es nicht wegtippte und zurueckkam. Genau die Lage, in der Elias
   fragt: er sitzt vor beiden Geraeten.

   ⚠️ Der Takt holt nur (GET). Das kostet kein Schreibkontingent — die 1.000
   Schreibvorgaenge am Tag gelten fuer PUT, und der laeuft weiterhin nur bei
   einer echten Aenderung. Zwanzig Sekunden ergeben bei vier Stunden offener
   App rund 720 Leseanfragen; die Grenze liegt bei 100.000.

   ⚠️ Nur bei SICHTBARER Seite. Ein Hintergrundtab soll nicht im Minutentakt
   ans Netz — und Android drosselt Timer dort ohnehin.
   [[hintergrund_tab_drosselt_timer]] */
/* ⛔⛔ HIER STAND `4 * 1000` — UND DER KOMMENTAR DARÜBER RECHNETE MIT ZWANZIG
   SEKUNDEN. Jemand hat den Wert gefuenftelt und die Begruendung stehen lassen;
   seitdem stimmte die Rechnung im Text nicht mehr mit dem Code ueberein.
   [[kommentar_beschreibt_absicht_markup_wirkung]]

   Cloudflare hat es am 08.09.2026 um 12:17 UTC gemeldet: „50% of the daily
   Workers KV free tier limit". Nachgerechnet:

     alle 4 s          =    15 Abrufe/Minute =   900/Stunde
     ein Geraet, 24 h  = 21.600 Abrufe/Tag
     Handy + Tablet + PC (der PC laeuft durch) ≈ 65.000/Tag
     Gratistarif                                100.000/Tag

   Reisst die Grenze, antwortet KV mit 429 — dann gleicht sich GAR NICHTS mehr
   ab, und zwar stumm. Der teure Teil war nie das Schreiben, sondern das
   ununterbrochene Lesen im Leerlauf.

   ⭐ Die Loesung ist nicht „einfach langsamer". Elias will „egal was ich auf
   welchem geraet mache wird auch sofort auf dem anderen geraet angezeigt" —
   also bleibt es schnell, SOLANGE ETWAS PASSIERT, und wird im Leerlauf ruhig:

     lokale Aenderung ODER Aenderung von fern  →  6 s, fuer 2 Minuten
     nichts davon                              →  90 s

   Gerechnet fuer einen Tag mit einer Stunde echter Nutzung und 23 Stunden
   offener App: 600 + 920 ≈ 1.500 Abrufe statt 21.600 — Faktor 14. */
const SYNC_TAKT_AKTIV = 6 * 1000;
const SYNC_TAKT_RUHE  = 90 * 1000;
/* Wie lange nach der letzten Regung schnell weitergetaktet wird. */
const SYNC_NACHLAUF   = 120 * 1000;
let SYNC_UHR = null;
let SYNC_LETZTE_REGUNG = 0;
let SYNC_TAKT_JETZT = 0;

/* Von merkeAenderung() und von gleicheAb() gerufen: „hier ist gerade etwas
   passiert, bleib eine Weile wach." */
function syncRegung(){
  SYNC_LETZTE_REGUNG = Date.now();
  /* Laeuft die Uhr gerade im Ruhetakt, sofort auf den schnellen umstellen —
     sonst wartet die naechste Abfrage bis zu 90 Sekunden. */
  if (SYNC_UHR && SYNC_TAKT_JETZT !== SYNC_TAKT_AKTIV) taktNeuSetzen();
}

function taktNeuSetzen(){
  const wach = (Date.now() - SYNC_LETZTE_REGUNG) < SYNC_NACHLAUF;
  const takt = wach ? SYNC_TAKT_AKTIV : SYNC_TAKT_RUHE;
  if (SYNC_UHR && takt === SYNC_TAKT_JETZT) return;   // nichts zu tun
  clearInterval(SYNC_UHR);
  SYNC_TAKT_JETZT = takt;
  SYNC_UHR = setInterval(()=>{
    /* ⚠️ Der Wechsel zurueck in den Ruhetakt passiert HIER und nicht ueber
       einen zweiten Timer: ein Intervall, das sich selbst neu setzt, ist eine
       Uhr weniger, die man vergessen kann. */
    const sollWach = (Date.now() - SYNC_LETZTE_REGUNG) < SYNC_NACHLAUF;
    if ((sollWach ? SYNC_TAKT_AKTIV : SYNC_TAKT_RUHE) !== SYNC_TAKT_JETZT){
      taktNeuSetzen();
      return;
    }
    if (document.hidden) return;
    gleicheAb(true);
  }, takt);
}

function taktStarten(){
  if (SYNC_UHR || !syncMoeglich()) return;
  /* Beim Start ist gerade etwas passiert — die App wurde geoeffnet. */
  SYNC_LETZTE_REGUNG = Date.now();
  taktNeuSetzen();
}
function taktStoppen(){ clearInterval(SYNC_UHR); SYNC_UHR = null; SYNC_TAKT_JETZT = 0; }

/* Von aussen aufrufbar - LS.set() in js/kern.js meldet JEDE Speicherung hierher.
   Der Filter sitzt deshalb hier: die App muss nicht wissen, was abgeglichen
   wird, und ein neuer Schluessel taucht nicht versehentlich im Abgleich auf.
   ⚠️ vt_syncStempel selbst darf nie durchkommen - er wird von merkeAenderung()
   geschrieben, das waere eine Endlosschleife. Er laeuft ueber
   localStorage.setItem statt LS.set und kommt hier gar nicht erst an; der Test
   steht trotzdem, falls das jemand aendert. */
function syncGeaendert(schluessel){
  if (schluessel === STEMPEL_SCHLUESSEL) return;
  if (SYNC_SCHLUESSEL.indexOf(schluessel) < 0) return;
  merkeAenderung(schluessel);
  SYNC_OFFEN = true;
  planeAbgleich();
}

document.addEventListener('DOMContentLoaded', ()=>{
  /* Das Warnband auf der alten Adresse. Es haengt bewusst hier und nicht an
     einem eigenen Skript: sync.js ist genau das Modul, das auf der alten
     Adresse nichts tun kann - der Hinweis gehoert an dieselbe Stelle wie der
     Grund dafuer. */
  const band = document.getElementById('altAdresse');
  if (band && aufAlterAdresse()) band.hidden = false;
  const bleiben = document.getElementById('altAdresseBleiben');
  /* Nur fuer diesen Besuch weggeklickt, nicht dauerhaft: wer hier eine Sicherung
     zieht, soll das koennen - aber beim naechsten Start steht der Hinweis wieder
     da. Eine dauerhafte Abschaltung waere genau die Falle, die er verhindert. */
  if (bleiben && band) bleiben.addEventListener('click', ()=>{ band.hidden = true; });

  /* Die Abgleich-Zeile in den Einstellungen erscheint nur, wo es den Endpunkt
     gibt. Eine Zeile, die dauerhaft "nicht verfuegbar" sagt, ist schlechter als
     keine - sie sieht nach einem Defekt aus. */
  const zeile = document.getElementById('syncZeile');
  if (zeile && syncMoeglich()) zeile.hidden = false;
  /* Der laufende Takt beginnt mit der Seite und endet mit ihr. */
  taktStarten();
  zeigeStatus();
  /* Beim Start schon anzeigen, was der letzte Lauf ergeben hat — sonst stuende
     das Band erst da, wenn der erste Abgleich dieser Sitzung durch ist, und
     bei einem Geraet ohne Netz waere das nie. */
  zeigeAbgleichWarnung();

  const knopf = document.getElementById('btnAbgleich');
  if (knopf) knopf.addEventListener('click', async ()=>{
    const alt = knopf.textContent;
    knopf.disabled = true; knopf.textContent = 'Läuft …';
    await gleicheAb(false);          /* nicht still: hier will er eine Antwort */
    knopf.textContent = alt; knopf.disabled = false;
  });

  /* Beim Start einmal holen - damit ein Geraetewechsel sofort greift. */
  gleicheAb(true);
});

/* Beim Weglegen der App noch schnell sichern. `visibilitychange` ist dafuer der
   verlaessliche Weg; `beforeunload` feuert auf Android oft gar nicht. */
document.addEventListener('visibilitychange', ()=>{
  if (document.visibilityState === 'hidden'){
    clearTimeout(SYNC_GEPLANT);
    /* ⭐ Nur wenn hier wirklich etwas Ungesichertes liegt. Vorher schickte
       JEDES Wegtippen — im Netzprotokoll standen PUT-Anfragen im Dutzend. */
    if (!SYNC_OFFEN) return;
    /* Kein await moeglich - der Browser haelt die Seite nicht auf. sendBeacon
       waere zuverlaessiger, kann aber keine PUT-Anfrage. Der Versuch reicht:
       schlaegt er fehl, holt der naechste Start es nach. */
    schickeZumServer().then(()=>{ SYNC_OFFEN = false; }).catch(()=>{});
    return;
  }

  /* ⭐⭐ UND BEIM ZURUECKKOMMEN WIRD GEHOLT (05.09.2026).
     Elias mit zwei Bildern desselben Augenblicks: „Auf meinem Tablet und Handy
     wird mir nicht die gleichen Vokabeln in den jeweiligen Boxen angezeigt …
     ich will das mein Tablet und Handy synchron sind und das immer."
     Handy 138/24/13/34/44, Tablet 166/14/23/37/13.

     ⛔ Der Abgleich war nur zur HAELFTE verdrahtet. Beim Weglegen wurde
     geschickt, beim Zurueckkommen aber nichts geholt — geholt wurde allein bei
     `DOMContentLoaded`. Auf Android bleibt eine installierte PWA tagelang
     geladen; wer zwischen Handy und Tablet wechselt, ohne die App wirklich zu
     BEENDEN, sieht auf dem zweiten Geraet weiter dessen alten Stand. Genau das
     zeigen seine beiden Bilder.

     Das ist die stille Sorte Fehler: nichts meldet sich, die Statuszeile in den
     Einstellungen steht auf „✓ abgeglichen" — sie sagt ja die Wahrheit ueber
     den letzten Abgleich, nur ist der Tage her. [[ausfall_ist_unsichtbar_gebaut]]

     ⚠️ Mit Mindestabstand, sonst loest jedes kurze Wegtippen einen Lauf aus.
     Eine Minute genuegt: die teure Haelfte (das Ablegen) findet seit heute nur
     noch statt, wenn sich wirklich etwas unterscheidet. */
  if (Date.now() - SYNC_ZULETZT < SICHTBAR_ABSTAND) return;
  SYNC_ZULETZT = Date.now();
  gleicheAb(true);
});
