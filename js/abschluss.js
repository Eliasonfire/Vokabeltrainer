/* abschluss.js -- die Seite „Runde geschafft“ nach jeder Lernrunde (24.11.2026, aus Talib d26eeba).

   In Talib Vorschlag 3 der Recherche vom 23.11.2026; Elias dort: „ich nehme alle deine vorschläge“. Für den
   Vokabeltrainer gilt sein Auftrag zur Liste der Unterschiede: „startbildschirm, hören, hot bar, statistik
   und übung sollst du übernehmen“. Vorher endete eine Runde mit einem Banner und nach 900 ms auf der
   Startseite; es gab keinen Moment, der sagt, was man gerade geschafft hat, und keinen Weg zum nächsten
   Schritt.

   Die Seite (#screen-fertig in index.html, Klassen rf-…) zeigt:
     - Haken im Ring und „Runde geschafft“
     - drei Zahlen: Karten der Runde, davon gewusst, neue Wörter
     - die Serie
     - EINE große Taste zum nächsten offenen Ring des Tages (dieselbe Wahl wie die Tagesringe der
       Startseite: ringKarten() und ringExtra() in js/start.js), darunter „Zur Startseite“

   ⛔ Regeln (bewacht von test-abschluss.mjs):
     (1) Die Seite rechnet und zeigt nur. Sie schreibt keinen Lernstand und zählt nichts hoch.
     (2) Ohne Ergebnis einer Runde gibt es die Seite nicht: zeigeBildschirm() führt dann zur Startseite
         (js/navigation.js). Beim Verlassen wird das Ergebnis verworfen und der Eintrag im Verlauf auf
         „Startseite“ umgeschrieben: die Zurück-Taste führt nie auf eine alte Abschluss-Seite und nie in
         eine beendete Runde.
   Wortlaut, Reihenfolge der Tasten und die drei Zahlen sind von Claude (in Talib). */

let RUNDE_ERGEBNIS = null;

/* Reine Rechnung: was die Runde war. `worte` und `rollen` wie in SESSION, `gewusst` der Zähler aus answer(),
   `lernstand` = PROGRESS, `heute` = der Lerntag. Neu ist ein Wort, das heute als neues in die Lerngruppe kam. */
function rundeErgebnis(worte, rollen, gewusst, lernstand, heute){
  const liste = Array.isArray(worte) ? worte : [];
  const karten = liste.filter((_, i) => !(rollen && rollen[i])).length;
  const neu = new Set();
  for (const w of liste){
    const p = w && lernstand && lernstand[w.id];
    if (p && p.gruppe === heute && p.gruppeArt === 'neu') neu.add(String(w.id));
  }
  return { karten, gewusst: Math.max(0, Math.min(Number(gewusst) || 0, karten)), neu: neu.size };
}

/* Reine Rechnung: wohin die große Taste führt. `karten` und `extra` wie ringKarten() und ringExtra(),
   `vorrat` = wie viele Karten heute noch zu holen sind.
   Erst die Karten (solange das Tagesziel offen ist und es noch Karten gibt), dann der zweite Ring,
   sonst nur noch die Startseite. */
function rundeNaechstes(karten, extra, vorrat){
  const k = karten || {}, x = extra || {};
  if (k.ziel && k.stand !== null && k.stand < k.ziel && vorrat > 0){
    const rest = k.ziel - k.stand;
    return { nav: 'learn-entry', taste: 'Nächste Runde',
      satz: rest === 1 ? 'Noch 1 Karte bis zu deinem Tagesziel.' : `Noch ${rest} Karten bis zu deinem Tagesziel.` };
  }
  if (x.ziel && x.stand !== null && x.stand < x.ziel && x.nav){
    return { nav: x.nav, taste: x.nav === 'hoeren' ? 'Weiter mit Hören' : 'Weiter mit Sätzen',
      satz: 'Dein Tagesziel bei den Karten ist erreicht.' };
  }
  return { nav: 'home', taste: 'Zur Startseite', satz: 'Für heute hast du alles geschafft.' };
}

/* Am Ende von answer() (js/lernen.js) gerufen, solange SESSION noch die Runde ist.
   Gibt false zurück, wenn es die Seite nicht gibt: dann läuft das Ende wie früher (Banner, Startseite). */
function rundeAbschlussMerken(){
  if (!document.getElementById('screen-fertig')) return false;
  RUNDE_ERGEBNIS = rundeErgebnis(SESSION.words, SESSION.rollen, SESSION.gewusst,
    (typeof PROGRESS !== 'undefined') ? PROGRESS : {}, todayStr(0));
  return true;
}

function renderRundeFertig(){
  const e = RUNDE_ERGEBNIS;
  if (!e) return;
  const setze = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  setze('rfKarten', String(e.karten));
  setze('rfGewusst', String(e.gewusst));
  setze('rfNeu', String(e.neu));

  const serie = (typeof getStreak === 'function') ? (Number(getStreak().count) || 0) : 0;
  const zeile = document.getElementById('rfSerieZeile');
  if (zeile) zeile.hidden = serie < 1;
  setze('rfSerie', serie === 1 ? 'Erster Tag deiner Serie' : `${serie} Tage in Folge`);

  const vorrat = (typeof tagesPool === 'function') ? tagesPool().length : 0;
  const n = rundeNaechstes(
    (typeof ringKarten === 'function') ? ringKarten() : null,
    (typeof ringExtra === 'function') ? ringExtra() : null, vorrat);
  setze('rfSatz', n.satz);
  const weiter = document.getElementById('rfWeiter');
  const heim = document.getElementById('rfHeim');
  if (weiter){ weiter.textContent = n.taste; weiter.dataset.ziel = n.nav; }
  /* Führt die große Taste schon zur Startseite, wäre die zweite dieselbe Taste noch einmal. */
  if (heim) heim.hidden = n.nav === 'home';

  /* Der Haken zeichnet sich neu, wenn die Seite kommt. */
  const ring = document.querySelector('#screen-fertig .rf-ring');
  if (ring){ ring.classList.remove('an'); void ring.offsetWidth; ring.classList.add('an'); }
}

/* Die Seite verlassen: Ergebnis verwerfen, den Eintrag im Verlauf zur Startseite machen, dann weiter. */
function rundeFertigVerlassen(ziel){
  RUNDE_ERGEBNIS = null;
  try { history.replaceState(Object.assign({}, history.state || {}, { screen: 'home' }), ''); } catch (err){ /* ohne Verlauf */ }
  if (ziel === 'learn-entry' && typeof lernenBeginnen === 'function'){ lernenBeginnen(); return; }
  if (!ziel || ziel === 'home' || ziel === 'learn-entry'){ showScreen('home', { ersetzen: true }); return; }
  showScreen(ziel);
}

(function rundeFertigVorbereiten(){
  const weiter = document.getElementById('rfWeiter');
  const heim = document.getElementById('rfHeim');
  if (weiter) weiter.addEventListener('click', () => rundeFertigVerlassen(weiter.dataset.ziel || 'home'));
  if (heim) heim.addEventListener('click', () => rundeFertigVerlassen('home'));
})();
