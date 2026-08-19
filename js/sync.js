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
  'vt_progress', 'vt_notes', 'vt_settings', 'vt_settingsFeld', 'vt_streak',
  'vt_personalVocab', 'vt_customCats', 'vt_hifz', 'vt_hifzVerse',
  'vt_quranFav', 'vt_lesestand',
  /* Der Tageszaehler des Hoermodus (17.08.2026). Er gehoert dazu, weil Elias
     auf Tablet UND Handy uebt: ohne Abgleich haette er zwei getrennte
     Tagesziele und muesste jedes doppelt machen. ⚠️ Wie alles ausser
     `vt_progress` wird er als ein Block gemergt - der juengere Stempel gewinnt.
     Bei einem Zaehler, der ohnehin nur waehrend des Uebens waechst, ist das
     tragbar: gewinnt das Geraet, an dem gerade geuebt wurde. */
  'vt_hoerTag',
  /* „Kenne ich schon" (17.08.2026). ⚠️ Wird JE WORT zusammengefuehrt, nicht als
     Block - siehe den eigenen Zweig in fuehreZusammen(). Als Block waere er ein
     Rueckschritt hinter genau den Fehler, der heute Nacht bei den Einstellungen
     behoben wurde: markiert Elias auf dem Handy drei Woerter und auf dem Tablet
     eins, verlöre der aeltere Stempel alle drei. */
  'vt_bekannt',
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
  'vt_regelStand'
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

function syncStempel(){
  try { return JSON.parse(localStorage.getItem(STEMPEL_SCHLUESSEL) || '{}'); }
  catch (e){ return {}; }
}
function merkeAenderung(schluessel){
  const s = syncStempel();
  s[schluessel] = Date.now();
  localStorage.setItem(STEMPEL_SCHLUESSEL, JSON.stringify(s));
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
function syncMoeglich(){
  return /^https?:$/.test(location.protocol) && !aufAlterAdresse();
}

/* ---------- Anzeigen, was los ist ---------- */

function merkeStatus(ok, text){
  try {
    localStorage.setItem(STATUS_SCHLUESSEL, JSON.stringify({ ok, text, zeit: Date.now() }));
  } catch (e){ /* voller Speicher darf den Abgleich nicht kippen */ }
  zeigeStatus();
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
    if (k === 'vt_bekannt' || k === 'vt_vorschlagNr' || k === 'vt_wortAenderungen' || k === 'vt_geloescht'){
      try {
        const a = JSON.parse(hierRoh) || {}, b = JSON.parse(dortRoh) || {};
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

    /* Fortschritt je Regel: monotone Zaehler, feldweises Maximum. */
    if (k === 'vt_regelStand'){
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
    await schickeZumServer();
    merkeStatus(true, wortzahl() + ' Wörter' + (geaendert ? ', Stand aktualisiert' : ''));
    if (geaendert){
      /* Die App haelt PROGRESS und SETTINGS im Speicher - nach einer Aenderung
         von aussen muessen sie neu eingelesen werden, sonst ueberschreibt der
         naechste lokale Schreibvorgang das gerade Geholte wieder. */
      if (typeof ladeStandNeu === 'function') ladeStandNeu();
      if (!still && typeof toast === 'function') toast('Lernstand abgeglichen.');
    }
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
const SYNC_WARTEZEIT = 5 * 60 * 1000;
function planeAbgleich(){
  clearTimeout(SYNC_GEPLANT);
  SYNC_GEPLANT = setTimeout(()=> gleicheAb(true), SYNC_WARTEZEIT);
}

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
  zeigeStatus();

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
    /* Kein await moeglich - der Browser haelt die Seite nicht auf. sendBeacon
       waere zuverlaessiger, kann aber keine PUT-Anfrage. Der Versuch reicht:
       schlaegt er fehl, holt der naechste Start es nach. */
    schickeZumServer().catch(()=>{});
  }
});
