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
  'vt_progress', 'vt_notes', 'vt_settings', 'vt_streak',
  'vt_personalVocab', 'vt_customCats', 'vt_hifz', 'vt_hifzVerse',
  'vt_quranFav', 'vt_lesestand'
];

/* Je Schluessel merken, wann er zuletzt lokal geaendert wurde. Ohne das kann
   nicht entschieden werden, welche Seite neuer ist. */
const STEMPEL_SCHLUESSEL = 'vt_syncStempel';

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
  SYNC_LAEUFT = true;
  try {
    const fern = await holeVomServer();
    const geaendert = fuehreZusammen(fern);
    await schickeZumServer();
    if (geaendert){
      /* Die App haelt PROGRESS und SETTINGS im Speicher - nach einer Aenderung
         von aussen muessen sie neu eingelesen werden, sonst ueberschreibt der
         naechste lokale Schreibvorgang das gerade Geholte wieder. */
      if (typeof ladeStandNeu === 'function') ladeStandNeu();
      if (!still && typeof toast === 'function') toast('Lernstand abgeglichen.');
    }
  } catch (e){
    /* Offline oder abgemeldet ist kein Fehler, sondern der Normalfall
       unterwegs. Es wird nichts gemeldet und nichts kaputtgemacht - beim
       naechsten Start laeuft es erneut. */
    if (!still && typeof toast === 'function') toast('Abgleich gerade nicht moeglich.');
  } finally {
    SYNC_LAEUFT = false;
  }
}

/* Gebuendelt statt sofort: KV erlaubt im Gratistarif 1.000 Schreibvorgaenge am
   Tag. Nach jeder Karte zu senden waere bei 138 faelligen Woertern schon eine
   Runde am Limit. Zehn Sekunden Ruhe nach der letzten Aenderung reichen. */
function planeAbgleich(){
  clearTimeout(SYNC_GEPLANT);
  SYNC_GEPLANT = setTimeout(()=> gleicheAb(true), 10000);
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
