/* regeln.js -- die Regelsammlung: nachschlagen, durchlesen, bearbeiten
   Teil der App-Logik; wird in index.html in fester Reihenfolge geladen und
   teilt sich mit den uebrigen js/-Dateien den globalen Namensraum.

   Elias am 11.09.2026, 03:43: „ich würde aber gerne auch einen bereich haben
   wo ich alle regeln nachschlagen kann und mir die einzelnen regeln
   durchlesen kann und sie mir nochmals ins gedächtnis rufen kann."
   Dazu, während ich nachsah:
     03:49 „ich will aber auch die funktion haben es zu bearbeiten, zu löschen usw"
     03:49 „es soll so gut wie möglich in die app integriert werden"
     03:50 „im besten fall soll da auch eine verbindung zum satzmodus irgendwie
            hergestellt werden"

   ⭐ AUFBAU DES BILDSCHIRMS
     oben      die neun Karten aus Folge 19 (regelsammlung-data.js)
     darunter  seine Regeln: passt · ändern · noch nicht beurteilt
     dann      „Von dir" — selbst angelegte Regeln
     unten     verborgen (seine „streichen") und der Papierkorb

   ⛔⛔ NICHTS WIRD GELÖSCHT. Weder eine Regel aus grammar-data.js noch eine
   Karte noch eine eigene Regel verschwindet aus den Daten: „Löschen" legt in
   den Papierkorb, und von dort holt ein Tipp sie zurück. Seine Vorgabe vom
   26.08.2026 steht bei schams-qamar-01 und gilt ausdrücklich für alle: „diese
   und all die anderen regeln sollen nicht gelöscht werden, nur aus der app
   raus genommen werden". werkzeuge/pruefe-regelsammlung.mjs bewacht das mit
   einem Störtest.

   ⛔⛔ DER SCHALTER „IM SATZMODUS" UND DAS ARTEFAKT
   Das Regelprüfungs-Artefakt bleibt (Elias, 11.09.2026, 04:08: „artefakt
   soll da bleiben"). Es gibt also ZWEI Stellen, an denen er entscheidet, ob
   eine Regel im Satzmodus steht: den Export aus dem Artefakt (landet über
   werkzeuge/urteile-uebernehmen.mjs als `ausgeblendet` in grammar-data.js)
   und den Schalter hier. Sie dürfen sich nicht still überschreiben — es gilt
   die JÜNGERE Entscheidung. Dafür trägt jede Regel aus einem Export ihren
   Zeitpunkt (`satzmodusUrteil`), und jeder Schalter hier seinen (`zeit`).
   Ist der Schalter älter als ein späterer Export, gilt der Export — und die
   Karte SAGT es, statt still umzuspringen. [[zwei_stellen_eine_entscheidung]]

   ⚠️ Deshalb liest niemand mehr `rule.ausgeblendet` direkt, sondern
   regelAusgeblendet(rule). Eine einzige Stelle, die das Feld weiter selbst
   liest, zeigte im Satzmodus etwas anderes als die Karte — und beide sähen
   richtig aus. Der Prüfer sucht danach. [[zweiter_fix_deckt_ersten_zu]]

   Gespeichert wird in `vt_regeln` (abgeglichen, js/sync.js):
     satz    { regelId: {an, zeit} }            Schalter „im Satzmodus"
     text    { regelId: {name, kurz, zeit} }    seine Fassung; kurz=null = Original
     notiz   { id: {text, zeit} }
     weg     { id: {an, zeit} }                 Papierkorb; an=false = zurückgeholt
     zeigen  { regelId: {an, zeit} }            „streichen"-Regel wieder zeigen
     eigene  { id: {name, kurz, beispielAr, beispielDe, erstellt, zeit} }
   Jeder Eintrag trägt seine Zeit, damit der Abgleich JE EINTRAG entscheiden
   kann: bearbeitet er am Handy eine Regel und am Tablet eine andere, bleiben
   beide. */

const REGELN_SCHLUESSEL = 'vt_regeln';
const REGELN_ABSCHNITTE = ['satz', 'text', 'notiz', 'weg', 'zeigen', 'eigene'];

/* ⛔ Eine FUNKTION, keine Vorlage mit `{ ...VORLAGE }`: die Abschnitte sind
   Objekte, und eine flache Kopie teilte sie zwischen allen Aufrufern.
   [[eingefrorenes_feld_ist_kein_zustand]] */
function regelnLeer(){
  const s = {};
  REGELN_ABSCHNITTE.forEach(a => { s[a] = {}; });
  return s;
}

/* Gelesen wird bei jedem Aufruf aus dem Speicher — der Abgleich kann den Stand
   jederzeit austauschen, und eine mitgeführte Variable liefe dann auseinander.
   Damit das beim Filtern über 103 Regeln nicht hundertmal JSON zerlegt, merkt
   sich die Funktion den zuletzt gelesenen Text: nur wenn er sich ändert, wird
   neu gelesen.
   ⚠️ Das zurückgegebene Objekt ist GETEILT — ändern nur über regelnAendern(). */
let REGELN_ROH = undefined;
let REGELN_GELESEN = null;
function regelnStand(){
  let roh = null;
  try { roh = localStorage.getItem(REGELN_SCHLUESSEL); } catch (e){ roh = null; }
  if (REGELN_GELESEN && roh === REGELN_ROH) return REGELN_GELESEN;
  const s = regelnLeer();
  if (roh){
    try {
      const o = JSON.parse(roh);
      if (o && typeof o === 'object' && !Array.isArray(o)){
        REGELN_ABSCHNITTE.forEach(a => {
          if (o[a] && typeof o[a] === 'object' && !Array.isArray(o[a])) s[a] = o[a];
        });
      }
    } catch (e){
      if (typeof stillerFehler === 'function') stillerFehler('Regelsammlung: Stand lesen', e);
    }
  }
  REGELN_ROH = roh;
  REGELN_GELESEN = s;
  return s;
}

function regelnAendern(fn){
  const s = JSON.parse(JSON.stringify(regelnStand()));
  fn(s);
  LS.set(REGELN_SCHLUESSEL, s);
  return s;
}

function regelnJetzt(){ return Date.now(); }

/* ---------- Woher eine Regel kommt ---------- */

function f19Karten(){
  return (typeof FOLGE19_KARTEN !== 'undefined' && Array.isArray(FOLGE19_KARTEN)) ? FOLGE19_KARTEN : [];
}
function f19Karte(id){ return f19Karten().find(k => k.id === id) || null; }
function grammatikRegel(id){
  return (typeof GRAMMAR_RULES !== 'undefined') ? (GRAMMAR_RULES.find(r => r.id === id) || null) : null;
}
function eigeneRegel(id){
  const e = regelnStand().eigene[id];
  return (e && typeof e === 'object') ? e : null;
}
/* 'f19' · 'regel' · 'eigen' · null */
function regelArt(id){
  if (f19Karte(id)) return 'f19';
  if (grammatikRegel(id)) return 'regel';
  if (eigeneRegel(id)) return 'eigen';
  return null;
}

/* ---------- Satzmodus: die jüngere Entscheidung gilt ---------- */

function regelUrteilZeit(r){
  const t = Date.parse((r && r.satzmodusUrteil) || '');
  return Number.isFinite(t) ? t : 0;
}

/* Liefert, was gilt, UND woher es kommt — die Karte braucht beides.
   aus        steht die Regel NICHT im Satzmodus?
   von        'app' (sein Schalter) oder 'datei' (Export bzw. Vorgabe)
   ueberholt  sein Schalter war älter als ein späterer Export UND wollte
              etwas anderes — genau das darf nicht still passieren */
function regelSatzEntscheidung(r){
  const datei = !!(r && r.ausgeblendet);
  const urteil = regelUrteilZeit(r);
  const s = r ? regelnStand().satz[r.id] : null;
  if (s && typeof s.an === 'boolean' && Number.isFinite(s.zeit)){
    if (s.zeit > urteil) return { aus: !s.an, von: 'app', appZeit: s.zeit, urteilZeit: urteil, ueberholt: false };
    return { aus: datei, von: 'datei', appZeit: s.zeit, urteilZeit: urteil, ueberholt: (!s.an) !== datei };
  }
  return { aus: datei, von: 'datei', appZeit: 0, urteilZeit: urteil, ueberholt: false };
}

function regelAusgeblendet(r){
  if (!r) return true;
  return regelSatzEntscheidung(r).aus;
}

function regelSatzSetzen(id, an){
  regelnAendern(s => { s.satz[id] = { an: !!an, zeit: regelnJetzt() }; });
}

/* ---------- Text: seine Fassung, das Original einen Tipp entfernt ---------- */

function regelOriginal(id){
  const k = f19Karte(id);
  if (k) return { name: k.titel, kurz: k.kern };
  const r = grammatikRegel(id);
  if (r) return { name: r.name, kurz: r.shortExplanation };
  const e = eigeneRegel(id);
  if (e) return { name: e.name, kurz: e.kurz };
  return null;
}

function regelText(id){
  const o = regelOriginal(id);
  if (!o) return null;
  /* Eigene Regeln haben kein Original neben sich — sie SIND seine Fassung. */
  if (regelArt(id) === 'eigen') return { name: o.name, kurz: o.kurz, bearbeitet: false, original: o };
  const t = regelnStand().text[id];
  if (t && typeof t.kurz === 'string' && t.kurz.trim()){
    return { name: (typeof t.name === 'string' && t.name.trim()) ? t.name : o.name,
             kurz: t.kurz, bearbeitet: true, zeit: t.zeit, original: o };
  }
  return { name: o.name, kurz: o.kurz, bearbeitet: false, original: o };
}

function regelTextSetzen(id, name, kurz){
  const art = regelArt(id);
  if (art === 'eigen'){
    regelnAendern(s => {
      const e = s.eigene[id];
      if (!e) return;
      e.name = String(name || '').trim() || e.name;
      e.kurz = String(kurz || '');
      e.zeit = regelnJetzt();
    });
    return;
  }
  regelnAendern(s => { s.text[id] = { name: String(name || ''), kurz: String(kurz || ''), zeit: regelnJetzt() }; });
}

/* Zurücksetzen ist ein EINTRAG mit Zeit, keine Lücke: sonst holte der Abgleich
   die bearbeitete Fassung vom anderen Gerät sofort wieder herein. */
function regelTextZuruecksetzen(id){
  regelnAendern(s => { s.text[id] = { name: null, kurz: null, zeit: regelnJetzt() }; });
}

/* ---------- Notiz ---------- */

function regelNotiz(id){
  const n = regelnStand().notiz[id];
  return (n && typeof n.text === 'string') ? n.text : '';
}
function regelNotizSetzen(id, text){
  regelnAendern(s => { s.notiz[id] = { text: String(text || ''), zeit: regelnJetzt() }; });
}

/* ---------- Papierkorb ---------- */

function regelImPapierkorb(id){
  const w = regelnStand().weg[id];
  return !!(w && w.an);
}
function regelLoeschen(id){
  regelnAendern(s => { s.weg[id] = { an: true, zeit: regelnJetzt() }; });
}
function regelWiederherstellen(id){
  regelnAendern(s => { s.weg[id] = { an: false, zeit: regelnJetzt() }; });
}

/* ---------- Seine Regelprüfung vom 26.08. ---------- */

function regelPruefung(id){
  const P = (typeof REGELPRUEFUNG_26_08 !== 'undefined') ? REGELPRUEFUNG_26_08 : null;
  if (P){
    for (const u of ['passt', 'aendern', 'streichen']){
      if (P[u] && Object.prototype.hasOwnProperty.call(P[u], id)) return { urteil: u, notiz: P[u][id] || '' };
    }
  }
  return { urteil: 'offen', notiz: '' };
}

/* „streichen" heißt: verborgen, bis er sie zurückholt. */
function regelVerborgen(id){
  if (regelPruefung(id).urteil !== 'streichen') return false;
  const z = regelnStand().zeigen[id];
  return !(z && z.an);
}
function regelZeigen(id, an){
  regelnAendern(s => { s.zeigen[id] = { an: !!an, zeit: regelnJetzt() }; });
}

/* ---------- Eigene Regeln ---------- */

function eigeneRegelAnlegen(daten){
  const jetzt = regelnJetzt();
  const id = 'eigen-' + jetzt.toString(36);
  regelnAendern(s => {
    s.eigene[id] = {
      name: String((daten && daten.name) || '').trim(),
      kurz: String((daten && daten.kurz) || '').trim(),
      beispielAr: String((daten && daten.beispielAr) || '').trim(),
      beispielDe: String((daten && daten.beispielDe) || '').trim(),
      erstellt: jetzt, zeit: jetzt
    };
  });
  return id;
}

/* ---------- Die Gliederung der Sammlung ---------- */

function sammlungsGliederung(){
  const regeln = (typeof GRAMMAR_RULES !== 'undefined') ? GRAMMAR_RULES : [];
  const papierkorb = [];
  const karten = f19Karten().filter(k => {
    if (regelImPapierkorb(k.id)){ papierkorb.push(k.id); return false; }
    return true;
  });
  const liste = [], verborgen = [];
  regeln.forEach(r => {
    if (regelImPapierkorb(r.id)){ papierkorb.push(r.id); return; }
    if (regelVerborgen(r.id)){ verborgen.push(r); return; }
    liste.push(r);
  });
  const eigene = Object.keys(regelnStand().eigene)
    .filter(id => {
      if (regelImPapierkorb(id)){ papierkorb.push(id); return false; }
      return true;
    })
    .map(id => Object.assign({ id }, regelnStand().eigene[id]))
    .sort((a, b) => (b.erstellt || 0) - (a.erstellt || 0));
  return { karten, liste, verborgen, eigene, papierkorb };
}

/* Die Regeln nach den Themen des Satzmodus — dieselben Namen, dieselbe
   Reihenfolge (das Neueste oben). Eine zweite Einteilung nur für diese Liste
   wäre eine zweite Antwort auf dieselbe Frage. [[dieselbe_frage_zwei_antworten]] */
function regelnNachThemen(regeln){
  const themen = (typeof themenNachAktualitaet === 'function')
    ? themenNachAktualitaet().filter(t => t.muster)
    : ((typeof SATZ_THEMEN !== 'undefined') ? SATZ_THEMEN.filter(t => t.muster) : []);
  const folge = r => (r.source && r.source.folge) || (r.source2 && r.source2.folge) || 0;
  const gruppen = themen.map(t => ({ name: t.name, regeln: [] }));
  const weitere = { name: 'Weitere', regeln: [] };
  regeln.forEach(r => {
    /* ⚠️ Das ERSTE passende Thema in SATZ_THEMEN entscheidet, nicht das der
       sortierten Anzeige — genauso sucht js/uebung.js das Thema einer Regel. */
    const roh = (typeof SATZ_THEMEN !== 'undefined') ? SATZ_THEMEN.find(t => t.muster && t.muster.test(r.id)) : null;
    const g = roh ? gruppen.find(x => x.name === roh.name) : null;
    (g || weitere).regeln.push(r);
  });
  gruppen.push(weitere);
  gruppen.forEach(g => g.regeln.sort((a, b) => folge(b) - folge(a)));
  return gruppen.filter(g => g.regeln.length);
}

/* ---------- Beispielsätze aus SENTENCE_TAGS ---------- */

function regelBeispielsaetze(ids, max){
  const menge = new Set(ids || []);
  const raus = [];
  if (typeof SENTENCE_TAGS === 'undefined' || !menge.size) return raus;
  const suche = quelle => {
    for (const w of quelle){
      if (raus.length >= (max || 1)) return;
      if (!w || !w.sentAr || raus.some(x => x.w.id === w.id)) continue;
      const tags = SENTENCE_TAGS[w.id];
      if (!tags) continue;
      const t = tags.find(x => menge.has(x.ruleId));
      if (t) raus.push({ w, t });
    }
  };
  /* Zuerst die Sätze, die er kennt (dieselbe Auswahl wie der Satzmodus), und
     nur wenn dort nichts passt, alle — eine Regel ganz ohne Beispiel wäre
     schlechter als ein Satz aus einem späteren Kapitel. */
  if (typeof alleSaetze === 'function') suche(alleSaetze());
  if (raus.length < (max || 1)){
    const alle = ((typeof VOCAB_DATA !== 'undefined') ? VOCAB_DATA : [])
      .concat((typeof LEHRBUCH_SAETZE !== 'undefined') ? LEHRBUCH_SAETZE : []);
    suche(alle);
  }
  return raus;
}

/* ---------- Suche (Goal, Punkt 10, 11.09.2026) ----------
   „Kategorien-Suche findet auch Regeln (eigener Block über den Wörtern):
   Deutsch, Arabisch mit/ohne Ḥarakāt, Umschrift (mudaf, idafa); dieselbe
   Suche oben in „Regeln"."

   ⛔ EINE Suchfunktion für beide Stellen — dieselbe Frage, dieselbe Antwort.
   Arabisch wird über suchFlach() aus js/kategorien.js verglichen, also genau
   so wie die Wörter: wer مضاف ohne Ḥarakāt tippt, findet مُضَاف.
   [[dieselbe_frage_zwei_antworten]]

   ⭐ Umschrift: Unterpunkte und Längen fallen weg (Iḍāfa → idafa, Muḍāf →
   mudaf), ʿ und ʾ ebenso. Dazu zählt die Regel-Id als Umschrift
   (mudaf-ohne-al-01 → „mudaf ohne al"). */
function regelnFlachDe(s){
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[ʿʾ'’`]/g, '').toLowerCase();
}

function regelSuche(begriff){
  const roh = String(begriff || '').trim();
  if (roh.length < 2) return [];
  const arabisch = /[؀-ۿ]/.test(roh);
  const flachAr = (typeof suchFlach === 'function') ? suchFlach : (s => String(s || ''));
  const q = arabisch ? flachAr(roh) : regelnFlachDe(roh);
  if (!q) return [];
  const passt = texte => texte.some(t => t && (arabisch ? flachAr(t).includes(q) : regelnFlachDe(t).includes(q)));
  const raus = [];
  f19Karten().forEach(k => {
    const t = regelText(k.id);
    /* Die Rollen (Muḍāf, Naʿt, Sonnenbuchstaben …) zählen wie der Titel: wer
       „mudaf" sucht, meint die Karte, auf der der Muḍāf seine Merkmale hat. */
    const titel = [t.name, k.titel, k.untertitel, k.ar].concat((k.gruppen || []).flatMap(g => [g.ar, g.name]));
    const inhalt = [t.kurz, k.hinweis, regelNotiz(k.id)]
      .concat((k.gruppen || []).flatMap(g => [g.rolle].concat(g.merkmale || [])))
      .concat((k.beispiele || []).flatMap(b => [b.ar, b.de]));
    if (passt(titel)) raus.push({ id: k.id, stufe: 0, rang: 0 });
    else if (passt(inhalt)) raus.push({ id: k.id, stufe: 1, rang: 0 });
  });
  ((typeof GRAMMAR_RULES !== 'undefined') ? GRAMMAR_RULES : []).forEach(r => {
    const t = regelText(r.id);
    const umschrift = r.id.replace(/-\d+$/, '').replace(/-/g, ' ');
    if (passt([t.name, umschrift])) raus.push({ id: r.id, stufe: 0, rang: 1 });
    else if (passt([t.kurz, regelNotiz(r.id)])) raus.push({ id: r.id, stufe: 1, rang: 1 });
  });
  Object.keys(regelnStand().eigene).forEach(id => {
    const e = regelnStand().eigene[id];
    if (passt([e.name])) raus.push({ id, stufe: 0, rang: 2 });
    else if (passt([e.kurz, e.beispielAr, e.beispielDe, regelNotiz(id)])) raus.push({ id, stufe: 1, rang: 2 });
  });
  /* Treffer im Namen vor Treffern im Text; bei gleicher Stufe zuerst die
     Folge-19-Karten — „primär will ich eigentlich die regeln von folge 19". */
  return raus.sort((a, b) => (a.stufe - b.stufe) || (a.rang - b.rang));
}

/* Die Trefferzeilen — dieselben Zeilen wie in der Sammlung, mit dem Hinweis,
   wo eine gefundene Regel gerade liegt. Eine verborgene oder weggeworfene
   Regel wird gefunden und als solche markiert, statt zu fehlen. */
function regelSuchZeilenHtml(treffer, max){
  return treffer.slice(0, max || treffer.length).map(x => {
    const t = regelText(x.id);
    const k = f19Karte(x.id);
    const unter = [];
    if (k) unter.push('Folge 19');
    else if (regelArt(x.id) === 'eigen') unter.push('von dir');
    if (regelImPapierkorb(x.id)) unter.push('im Papierkorb');
    else if (regelVerborgen(x.id)) unter.push('verborgen');
    const titel = k ? `<span class="rz-nr">${k.nr}</span><span>${escapeHtml(t.name)}</span>` : regelnAr(t.name);
    return regelZeileHtml(x.id, titel, escapeHtml(unter.join(' · ')), regelMarken(x.id));
  }).join('');
}

/* ---------- „im Satzmodus üben" (Goal, Punkt 9) ---------- */

function regelSatzIds(id){
  const k = f19Karte(id);
  const ids = k ? (k.regeln || []).filter(grammatikRegel) : (grammatikRegel(id) ? [id] : []);
  return ids;
}

function regelSatzZahl(id){
  const ids = new Set(regelSatzIds(id));
  if (!ids.size || typeof alleSaetze !== 'function' || typeof SENTENCE_TAGS === 'undefined') return 0;
  return alleSaetze().filter(w => (SENTENCE_TAGS[w.id] || []).some(t => ids.has(t.ruleId))).length;
}

function regelImSatzmodusUeben(id){
  const ids = regelSatzIds(id);
  if (!ids.length || typeof setzeRegelfilter !== 'function') return;
  const t = regelText(id);
  speichereOffeneRegelEingaben();
  setzeRegelfilter(ids, t ? t.name : id);
  /* Die Karte schließen, OHNE über die Historie zu gehen: history.back() wirkt
     erst im nächsten Zug und nähme sonst den gleich angelegten Satzmodus-
     Eintrag wieder mit. Stattdessen ersetzt der Satzmodus den Eintrag der
     Karte — die Zurück-Taste führt dann in die Sammlung. */
  const box = document.getElementById('regelKarte');
  const hinter = document.getElementById('regelKarteBackdrop');
  if (box) box.classList.add('hidden');
  if (hinter) hinter.classList.add('hidden');
  RK_ID = null; RK_MODUS = 'ansehen';
  showScreen('sentences', { ersetzen: true });
}

/* ========================= Anzeige ========================= */

function regelnDatum(ms){
  try { return new Date(ms).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }); }
  catch (e){ /* Nur die Anzeige des Datums fällt weg; die Entscheidung selbst
               rechnet mit den Zahlen und hängt hieran nicht. */ return ''; }
}
function regelnAr(s){ return arabischHervorheben(String(s == null ? '' : s), 'gp-ar'); }
function regelnFett(s){ return (typeof fett === 'function') ? fett(s) : s; }

function regelQuelleText(r){
  const WERK_KURZ = { 'sharh-madinah-1': 'Sharḥ Madīnah 1', 'bayna-yadayk-2': 'Bayna Yadayk 2' };
  const teile = [];
  if (r.ergaenzung && r.buchQuelle){
    const b = r.buchQuelle;
    teile.push(`${WERK_KURZ[b.werk] || b.werk} · L${b.lektion} S. ${b.seite} — im Unterricht nicht gesagt`);
  } else if (r.source){
    teile.push(`${r.source.video} · ca. ${r.source.approxTimestamp}`);
  }
  if (r.source2 && r.source2.schluessel) teile.push(`Schl. ${r.source2.schluessel} L${r.source2.lektion} S. ${r.source2.seite}`);
  return teile.join(' · ');
}

function satzMitTreffer(ar, treffer){
  const s = String(ar || ''), m = String(treffer || '');
  const i = m ? s.indexOf(m) : -1;
  if (i < 0) return escapeHtml(s);
  return escapeHtml(s.slice(0, i)) + '<mark class="rk-treffer">' + escapeHtml(m) + '</mark>' + escapeHtml(s.slice(i + m.length));
}

function regelZeileHtml(id, titelHtml, unterHtml, markenHtml, aktionHtml){
  return `<div class="regel-zeile-rahmen">
    <button class="list-row regel-zeile" type="button" data-regelkarte="${escapeHtml(id)}">
      <span class="rz-haupt">
        <span class="rz-titel">${titelHtml}</span>
        ${unterHtml ? `<span class="rz-unter">${unterHtml}</span>` : ''}
      </span>
      ${markenHtml ? `<span class="rz-marken">${markenHtml}</span>` : ''}
    </button>
    ${aktionHtml || ''}
  </div>`;
}

function regelMarken(id){
  const m = [];
  const r = grammatikRegel(id);
  if (r && regelPruefung(id).urteil === 'aendern') m.push('<span class="rz-marke rz-aendern">ändern</span>');
  if (r && regelAusgeblendet(r)) m.push('<span class="rz-marke">nicht im Satzmodus</span>');
  const t = regelText(id);
  if (t && t.bearbeitet) m.push('<span class="rz-marke">bearbeitet</span>');
  if (regelNotiz(id).trim()) m.push(`<span class="rz-marke">${icon('note')}Notiz</span>`);
  return m.join('');
}

/* Welche Aufklapper offen sind, überlebt das Neuzeichnen — sonst klappt jeder
   Tipp auf „wieder zeigen" die Liste zu, in der er gerade arbeitet. */
const REGELN_AUF = { verborgen: false, papierkorb: false };

function renderRegeln(){
  const box = document.getElementById('regelnInhalt');
  if (!box) return;
  /* Sucht er, stehen nur die Treffer da — wie in den Kategorien, wo die
     Reiter während der Suche verschwinden. */
  const feld = document.getElementById('regelnSuche');
  const begriff = feld ? feld.value.trim() : '';
  if (begriff.length >= 2){
    const treffer = regelSuche(begriff);
    box.innerHTML = `<div class="pane-hinweis">${treffer.length
        ? `${treffer.length} ${treffer.length === 1 ? 'Regel' : 'Regeln'} für „${escapeHtml(begriff)}"`
        : `Keine Regel für „${escapeHtml(begriff)}". Arabisch geht auch ohne Ḥarakāt, Umschrift ohne Punkte (mudaf, idafa).`}</div>`
      + regelSuchZeilenHtml(treffer);
    return;
  }
  const g = sammlungsGliederung();

  const karten = g.karten.map(k => {
    const t = regelText(k.id);
    return regelZeileHtml(k.id,
      `<span class="rz-nr">${k.nr}</span><span>${escapeHtml(t ? t.name : k.titel)}</span>`,
      `${escapeHtml(k.untertitel || '')} <span class="rz-ar" lang="ar" dir="rtl">${escapeHtml(k.ar)}</span>`,
      regelMarken(k.id));
  }).join('');

  const themen = regelnNachThemen(g.liste).map(gr => `
    <div class="regeln-thema">${escapeHtml(gr.name)} <span class="regeln-zahl">${gr.regeln.length}</span></div>
    ${gr.regeln.map(r => {
      const t = regelText(r.id);
      const f = (r.source && r.source.folge) ? `Folge ${String(r.source.folge).padStart(2, '0')}` : (r.buchQuelle ? 'Buch' : '');
      return regelZeileHtml(r.id, regelnAr(t.name), escapeHtml(f), regelMarken(r.id));
    }).join('')}`).join('');

  const eigene = g.eigene.map(e =>
    regelZeileHtml(e.id, regelnAr(e.name || 'Ohne Namen'), 'von dir', regelMarken(e.id))).join('');

  const verborgen = g.verborgen.map(r =>
    regelZeileHtml(r.id, regelnAr(r.name), 'in deiner Regelprüfung gestrichen', '',
      `<button class="btn btn-secondary rz-aktion" type="button" data-regelzeigen="${escapeHtml(r.id)}">wieder zeigen</button>`)).join('');

  const korb = g.papierkorb.map(id => {
    const t = regelText(id);
    return regelZeileHtml(id, regelnAr(t ? t.name : id), 'im Papierkorb', '',
      `<button class="btn btn-secondary rz-aktion" type="button" data-regelzurueck="${escapeHtml(id)}">wiederherstellen</button>`);
  }).join('');

  const aufklapper = (schluessel, titel, zahl, inhalt, leer) => `
    <button class="pool-schalter regeln-schalter" type="button" data-regelnauf="${schluessel}" aria-expanded="${REGELN_AUF[schluessel]}">
      ${icon('right')}<span>${titel} <span class="regeln-zahl">${zahl}</span></span>
    </button>
    <div class="regeln-aufgeklappt${REGELN_AUF[schluessel] ? '' : ' hidden'}">${inhalt || `<div class="pane-hinweis">${leer}</div>`}</div>`;

  box.innerHTML = `
    <section class="regeln-abschnitt">
      <h3 class="regeln-kopf">Folge 19 — Grammatikabfrage</h3>
      <div class="pane-hinweis">Dein Lehrer: „wenn ihr das hier könnt, reicht das vollkommen aus"</div>
      ${karten || '<div class="pane-hinweis">Alle neun Karten liegen im Papierkorb.</div>'}
    </section>
    <section class="regeln-abschnitt">
      <h3 class="regeln-kopf">Deine Regeln <span class="regeln-zahl">${g.liste.length}</span></h3>
      <div class="pane-hinweis">passt · ändern · noch nicht beurteilt — nach deiner Regelprüfung vom 26.08.</div>
      ${themen}
    </section>
    <section class="regeln-abschnitt">
      <h3 class="regeln-kopf">Von dir <span class="regeln-zahl">${g.eigene.length}</span></h3>
      ${eigene}
      <button class="btn btn-secondary regeln-anlegen" type="button" id="btnRegelAnlegen">${icon('plus')}Eigene Regel anlegen</button>
    </section>
    <section class="regeln-abschnitt">
      ${aufklapper('verborgen', 'Verborgen', g.verborgen.length, verborgen, 'Keine verborgene Regel.')}
      ${aufklapper('papierkorb', 'Papierkorb', g.papierkorb.length, korb, 'Der Papierkorb ist leer.')}
    </section>`;
}

/* ========================= Die Karte ========================= */

let RK_ID = null;
let RK_MODUS = 'ansehen';

function rkAbschnitt(marke, inhalt, klasse){
  return `<div class="wk-abschnitt${klasse ? ' ' + klasse : ''}"><div class="wk-marke">${marke}</div>${inhalt}</div>`;
}

function rkBeispielsatzHtml(ids){
  const b = regelBeispielsaetze(ids, 1)[0];
  if (!b) return rkAbschnitt('Beispielsatz', '<div class="de">Zu dieser Regel ist noch kein Satz markiert.</div>');
  return rkAbschnitt('Beispielsatz aus deinen Sätzen',
    `<div class="ar" lang="ar" dir="rtl">${satzMitTreffer(b.w.sentAr, b.t.matchText)}</div>` +
    (b.w.sentDe ? `<div class="de">${escapeHtml(b.w.sentDe)}</div>` : ''));
}

function rkKernUndRest(text){
  const voll = String(text || '');
  const kern = (typeof kernSatz === 'function') ? kernSatz(voll) : voll;
  const rest = voll.slice(kern.length).trim();
  return `<div class="rk-kern">${regelnFett(regelnAr(kern))}</div>` +
    (rest ? `<button class="gp-mehr" type="button" data-rkmehr>ausführlich</button><div class="rk-rest hidden">${regelnFett(regelnAr(rest))}</div>` : '');
}

function rkSatzSchalterHtml(r){
  const e = regelSatzEntscheidung(r);
  let woher = '';
  if (e.von === 'app') woher = `von dir in der App umgestellt am ${regelnDatum(e.appZeit)}`;
  else if (e.urteilZeit) woher = `so in deiner Regelprüfung vom ${regelnDatum(e.urteilZeit)}`;
  const ueberholt = e.ueberholt
    ? `<div class="rk-warnung">${icon('warning')}Deine Umstellung in der App vom ${regelnDatum(e.appZeit)} ist älter als deine Regelprüfung vom ${regelnDatum(e.urteilZeit)} — es gilt die Regelprüfung.</div>`
    : '';
  return rkAbschnitt('Satzmodus',
    `<label class="rk-schalter"><input type="checkbox" data-rksatz ${e.aus ? '' : 'checked'}><span>im Satzmodus</span></label>` +
    (woher ? `<div class="rk-klein">${escapeHtml(woher)}</div>` : '') + ueberholt);
}

/* Ältere Fassungen, die der Abgleich nicht wegwerfen durfte (js/sync.js,
   fuehreRegelnZusammen): schreibt er dieselbe Notiz auf zwei Geräten, steht
   hier, was auf dem anderen stand — mit einem Tipp zurückzuholen. */
function rkFrueherHtml(eintrag, feldName){
  const liste = (eintrag && Array.isArray(eintrag.frueher)) ? eintrag.frueher : [];
  if (!liste.length) return '';
  return `<div class="rk-klein">Ältere Fassung${liste.length > 1 ? 'en' : ''} (vom anderen Gerät oder vorher):</div>` +
    liste.map((f, i) => `<div class="rk-frueher"><div class="de">„${regelnAr(f.text)}"${f.zeit ? ` <span class="rk-zeit">${regelnDatum(f.zeit)}</span>` : ''}</div>` +
      `<button class="rk-link" type="button" data-rkfrueher="${feldName}:${i}">diese zurückholen</button></div>`).join('');
}

function rkNotizHtml(id){
  return rkAbschnitt('Deine Notiz',
    `<textarea class="rk-notiz" data-rknotiz rows="3" placeholder="Was du dir dazu merken willst …">${escapeHtml(regelNotiz(id))}</textarea>` +
    `<button class="btn btn-secondary rk-klein-knopf" type="button" data-rknotizspeichern>Notiz speichern</button>` +
    rkFrueherHtml(regelnStand().notiz[id], 'notiz'), 'wk-notiz');
}

function rkUebenHtml(id){
  const n = regelSatzZahl(id);
  if (!n) return '';
  const r = grammatikRegel(id);
  const aus = r && regelAusgeblendet(r);
  return `<button class="btn btn-secondary rk-ueben" type="button" data-rkueben>${icon('chat')}im Satzmodus üben <span class="regeln-zahl">${n} ${n === 1 ? 'Satz' : 'Sätze'}</span></button>` +
    (aus ? '<div class="rk-klein">Die Regel steht gerade nicht im Satzmodus — die Sätze kommen, aber sie wird darin nicht unterstrichen.</div>' : '');
}

function rkAktionenHtml(id, art){
  const t = regelText(id);
  return `<div class="wk-aktionen">
    ${t && t.bearbeitet ? `<button class="btn btn-secondary" type="button" data-rkzuruecksetzen>Auf Original zurücksetzen</button>` : ''}
    <button class="btn btn-secondary" type="button" data-rkbearbeiten>${icon('note')}Bearbeiten</button>
    ${regelImPapierkorb(id)
      ? `<button class="btn btn-secondary" type="button" data-rkzurueck>Wiederherstellen</button>`
      : `<button class="btn btn-secondary" type="button" data-rkloeschen>${icon('trash')}${art === 'eigen' ? 'Löschen' : 'In den Papierkorb'}</button>`}
  </div>`;
}

function rkKopfHtml(marken){
  return `<div class="wk-kopfzeile"><div class="wk-marken">${marken}</div>
    <button class="icon-btn" type="button" data-rkzu aria-label="Schließen">${icon('close')}</button></div>`;
}

function rkTextBlockHtml(id){
  const t = regelText(id);
  let html = `<div class="rk-titel">${regelnAr(t.name)}</div>` + rkKernUndRest(t.kurz);
  if (t.bearbeitet){
    html += `<button class="rk-link" type="button" data-rkoriginal>Original zeigen</button>
      <div class="rk-original hidden">${rkAbschnitt('Original', `<div class="rk-titel-klein">${regelnAr(t.original.name)}</div><div class="de">${regelnFett(regelnAr(t.original.kurz))}</div>`)}</div>`;
  }
  if (regelArt(id) !== 'eigen') html += rkFrueherHtml(regelnStand().text[id], 'text');
  return html;
}

function zeichneF19Karte(k){
  const id = k.id;
  const gruppen = (k.gruppen || []).map(g => `
    <div class="rk-gruppe">
      <div class="rk-gruppe-kopf">${g.ar ? `<span class="rk-ar" lang="ar" dir="rtl">${escapeHtml(g.ar)}</span>` : ''}<b>${escapeHtml(g.name)}</b>${g.rolle ? ` · ${escapeHtml(g.rolle)}` : ''}</div>
      <ul class="rk-merkmale">${(g.merkmale || []).map(m => `<li>${regelnAr(m)}</li>`).join('')}</ul>
    </div>`).join('');
  const zerlegung = (k.zerlegung || []).length
    ? rkAbschnitt('Zerlegt', k.zerlegung.map(z => `<div class="rk-zerlegung"><span class="rk-ar" lang="ar" dir="rtl">${escapeHtml(z.ar)}</span> = <span class="rk-ar" lang="ar" dir="rtl">${escapeHtml(z.rolle)}</span></div>`).join(''))
    : '';
  const beispiele = (k.beispiele || []).length
    ? rkAbschnitt('Beispiele aus der Musterlösung', k.beispiele.map(b => `<div class="rk-beispiel"><div class="ar" lang="ar" dir="rtl">${escapeHtml(b.ar)}</div><div class="de">${escapeHtml(b.de)}</div></div>`).join(''))
    : '';
  const abgrenzung = k.abgrenzung
    ? rkAbschnitt('Aber: kein Adjektiv', `<div class="ar" lang="ar" dir="rtl">${escapeHtml(k.abgrenzung.ar)}</div><div class="de">${regelnAr(k.abgrenzung.text)}</div>` +
        (k.abgrenzung.hinweis ? `<div class="rk-klein">${regelnAr(k.abgrenzung.hinweis)}</div>` : ''))
    : '';
  const hinweis = k.hinweis ? `<div class="rk-hinweis">${regelnAr(k.hinweis)}</div>` : '';
  const lehrer = (k.lehrer || []).length
    ? rkAbschnitt('Dein Lehrer in Folge 19', k.lehrer.map(l => `<div class="de"><span class="rk-zeit">${escapeHtml(l.zeit)}</span> „${escapeHtml(l.text)}"</div>`).join(''))
    : '';
  const genauer = (k.genauer || []).length
    ? rkAbschnitt('Genauer in deinen Regeln', k.genauer.map(x => {
        const r = grammatikRegel(x.regel);
        return `<div class="rk-genauer"><button class="rk-link" type="button" data-regelkarte="${escapeHtml(x.regel)}">${regelnAr(r ? r.name : x.regel)}</button><div class="de">${regelnAr(x.text)}</div></div>`;
      }).join(''))
    : '';
  const verwandt = (k.regeln || []).filter(grammatikRegel);
  const verwandtHtml = verwandt.length
    ? rkAbschnitt(`Alle Regeln dazu <span class="regeln-zahl">${verwandt.length}</span>`,
        `<div class="rk-verwandt">${verwandt.map(rid => `<button class="rk-link" type="button" data-regelkarte="${escapeHtml(rid)}">${regelnAr(grammatikRegel(rid).name)}</button>`).join('')}</div>`)
    : '';
  return rkKopfHtml(`<span class="chip">Folge 19</span><span class="chip chip-fremd">Musterlösung ${escapeHtml(k.quelle.muster)}</span>`)
    + `<div class="rk-ar-gross" lang="ar" dir="rtl">${escapeHtml(k.ar)}</div>`
    + rkTextBlockHtml(id)
    + (k.untertitel ? `<div class="rk-klein">${escapeHtml(k.untertitel)}</div>` : '')
    + gruppen + zerlegung + abgrenzung + hinweis + beispiele
    + rkBeispielsatzHtml(verwandt)
    + rkUebenHtml(id)
    + genauer + lehrer + verwandtHtml
    + `<div class="wk-quelle">Folge 19, ${escapeHtml(k.quelle.folge)} · Musterlösung ${escapeHtml(k.quelle.muster)}</div>`
    + rkNotizHtml(id) + rkAktionenHtml(id, 'f19');
}

/* ---------- Entwurf für eine bessere Fassung (regelsammlung-data.js) ---------- */

function regelEntwurf(id){
  return (typeof REGEL_ENTWUERFE !== 'undefined' && REGEL_ENTWUERFE[id]) || null;
}

/* Übernimmt er den Entwurf, wird daraus SEINE Fassung als Text — die Tabelle
   Zeile für Zeile, damit sie auch dort lesbar bleibt, wo nur Text steht (der
   Aufklapper im Lesemodus). */
function entwurfAlsText(e){
  const zeilen = (e.tabelle && e.tabelle.zeilen || []).map(z => z[0] + ': ' + z.slice(1).filter(Boolean).join(' · '));
  return [e.kern, zeilen.join('\n') + (e.tabelle && e.tabelle.hinweis ? '\n' + e.tabelle.hinweis : '')]
    .concat(e.merksaetze || []).filter(Boolean).join('\n\n');
}

function rkEntwurfHtml(id){
  const e = regelEntwurf(id);
  if (!e) return '';
  const t = regelText(id);
  const uebernommen = t && t.bearbeitet && t.kurz === entwurfAlsText(e);
  const tab = e.tabelle
    ? `<div class="rk-tabelle-rahmen"><table class="rk-tabelle"><thead><tr>${e.tabelle.kopf.map(k => `<th>${escapeHtml(k)}</th>`).join('')}</tr></thead>
        <tbody>${e.tabelle.zeilen.map(z => `<tr><th>${escapeHtml(z[0])}</th>${z.slice(1).map(c => `<td lang="ar" dir="rtl">${escapeHtml(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
      + (e.tabelle.hinweis ? `<div class="de">${regelnAr(e.tabelle.hinweis)}</div>` : '')
    : '';
  return rkAbschnitt('Entwurf für eine bessere Fassung',
    `<div class="rk-klein">Du im Satzmodus-Export: „${escapeHtml(e.anlass)}". Entwurf von Claude, ${escapeHtml(e.vom.split('-').reverse().join('.'))} — die Regel oben ist unverändert.</div>`
    + `<div class="rk-titel-klein">${regelnAr(e.name)}</div>`
    + `<div class="rk-kern">${regelnFett(regelnAr(e.kern))}</div>`
    + tab
    + (e.merksaetze || []).map(m => `<div class="de">${regelnFett(regelnAr(m))}</div>`).join('')
    + (uebernommen
        ? '<div class="rk-klein">✓ Als deine Fassung übernommen — „Auf Original zurücksetzen" nimmt es zurück.</div>'
        : '<button class="btn btn-secondary rk-klein-knopf" type="button" data-rkentwurf>als meine Fassung übernehmen</button>'),
    'rk-entwurf');
}

function zeichneRegelKarteInhalt(id){
  const r = grammatikRegel(id);
  const p = regelPruefung(id);
  const PRUEF_TEXT = { passt: 'passt', aendern: 'ändern', streichen: 'streichen', offen: 'noch nicht beurteilt' };
  const pruefung = rkAbschnitt('Deine Regelprüfung vom 26.08.',
    `<div class="de"><b>${PRUEF_TEXT[p.urteil]}</b></div>` + (p.notiz ? `<div class="de">„${escapeHtml(p.notiz)}"</div>` : '') +
    (p.urteil === 'streichen'
      ? (regelVerborgen(id)
          ? `<button class="btn btn-secondary rk-klein-knopf" type="button" data-rkzeigen>In der Liste wieder zeigen</button>`
          : `<button class="btn btn-secondary rk-klein-knopf" type="button" data-rkverbergen>Wieder verbergen</button>`)
      : ''));
  const f = r.source && r.source.folge ? `Folge ${String(r.source.folge).padStart(2, '0')}` : (r.buchQuelle ? 'Buch' : '');
  return rkKopfHtml((f ? `<span class="chip">${escapeHtml(f)}</span>` : '') +
      (regelImPapierkorb(id) ? '<span class="chip chip-fremd">im Papierkorb</span>' : ''))
    + rkTextBlockHtml(id)
    + rkEntwurfHtml(id)
    + rkBeispielsatzHtml([id])
    + rkUebenHtml(id)
    + `<div class="wk-quelle">${escapeHtml(regelQuelleText(r))}</div>`
    + pruefung
    + rkSatzSchalterHtml(r)
    + rkNotizHtml(id)
    + rkAktionenHtml(id, 'regel');
}

function zeichneEigeneKarte(id){
  const e = eigeneRegel(id);
  const beispiel = (e.beispielAr || e.beispielDe)
    ? rkAbschnitt('Dein Beispiel', (e.beispielAr ? `<div class="ar" lang="ar" dir="rtl">${escapeHtml(e.beispielAr)}</div>` : '') +
        (e.beispielDe ? `<div class="de">${escapeHtml(e.beispielDe)}</div>` : ''))
    : '';
  return rkKopfHtml('<span class="chip">von dir</span>' + (regelImPapierkorb(id) ? '<span class="chip chip-fremd">im Papierkorb</span>' : ''))
    + rkTextBlockHtml(id)
    + beispiel
    + `<div class="rk-klein">Eigene Regeln haben noch keine markierten Sätze — deshalb gibt es hier keinen Satzmodus-Schalter.</div>`
    + rkNotizHtml(id)
    + rkAktionenHtml(id, 'eigen');
}

function zeichneFormular(id){
  const neu = !id;
  const t = neu ? { name: '', kurz: '' } : regelText(id);
  const e = (!neu && regelArt(id) === 'eigen') ? eigeneRegel(id) : null;
  return rkKopfHtml(`<span class="chip">${neu ? 'Neue Regel' : 'Bearbeiten'}</span>`)
    + `<label class="rk-feld"><span>Name</span><input type="text" data-rkname value="${escapeHtml(t.name)}" maxlength="120"></label>`
    + `<label class="rk-feld"><span>Erklärung</span><textarea data-rkkurz rows="7">${escapeHtml(t.kurz)}</textarea></label>`
    + ((neu || e)
        ? `<label class="rk-feld"><span>Beispiel auf Arabisch (freiwillig)</span><input type="text" data-rkbspar dir="rtl" lang="ar" value="${escapeHtml(e ? e.beispielAr : '')}"></label>
           <label class="rk-feld"><span>Beispiel auf Deutsch (freiwillig)</span><input type="text" data-rkbspde value="${escapeHtml(e ? e.beispielDe : '')}"></label>`
        : `<div class="rk-klein">Das Original bleibt erhalten und steht auf der Karte einen Tipp entfernt.</div>`)
    + `<div class="wk-aktionen">
         <button class="btn btn-secondary" type="button" data-rkabbrechen>Abbrechen</button>
         <button class="btn btn-primary" type="button" data-rkspeichern>Speichern</button>
       </div>`;
}

function zeichneRegelKarte(){
  const box = document.getElementById('regelKarte');
  if (!box) return;
  if (RK_MODUS === 'anlegen'){ box.innerHTML = zeichneFormular(null); return; }
  const art = regelArt(RK_ID);
  if (!art){ box.innerHTML = rkKopfHtml('') + '<div class="empty-state">Diese Regel gibt es nicht mehr.</div>'; return; }
  if (RK_MODUS === 'bearbeiten'){ box.innerHTML = zeichneFormular(RK_ID); return; }
  if (art === 'f19') box.innerHTML = zeichneF19Karte(f19Karte(RK_ID));
  else if (art === 'regel') box.innerHTML = zeichneRegelKarteInhalt(RK_ID);
  else box.innerHTML = zeichneEigeneKarte(RK_ID);
}

function oeffneRegelKarte(id, modus){
  const box = document.getElementById('regelKarte');
  const hinter = document.getElementById('regelKarteBackdrop');
  if (!box || !hinter) return;
  const warOffen = !box.classList.contains('hidden');
  if (warOffen) speichereOffeneRegelEingaben();
  RK_ID = id || null;
  RK_MODUS = modus || 'ansehen';
  zeichneRegelKarte();
  box.scrollTop = 0;
  box.classList.remove('hidden');
  hinter.classList.remove('hidden');
  /* Nur beim ersten Öffnen einen Historieneintrag: ein Sprung von Karte zu
     Karte (über „Genauer in deinen Regeln") bleibt EINE Ebene — sonst müsste
     er für jeden Sprung einmal zurück tippen. */
  if (!warOffen && typeof overlayAuf === 'function') overlayAuf('regelKarte');
}

/* Was er getippt hat, geht beim Schließen nicht verloren — genau wie auf der
   Wortkarte. Zurücksetzen kann er immer, verloren wäre es nicht mehr zu holen. */
function speichereOffeneRegelEingaben(){
  const box = document.getElementById('regelKarte');
  if (!box || box.classList.contains('hidden')) return false;
  let gespeichert = false;
  const notiz = box.querySelector('[data-rknotiz]');
  if (notiz && RK_ID && notiz.value !== regelNotiz(RK_ID)){ regelNotizSetzen(RK_ID, notiz.value); gespeichert = true; }
  const name = box.querySelector('[data-rkname]');
  const kurz = box.querySelector('[data-rkkurz]');
  if (name && kurz){
    if (RK_MODUS === 'anlegen'){
      if (name.value.trim() && kurz.value.trim()){ speichereRegelFormular(); gespeichert = true; }
    } else if (RK_ID){
      const t = regelText(RK_ID);
      if (t && (name.value !== t.name || kurz.value !== t.kurz)){ speichereRegelFormular(); gespeichert = true; }
    }
  }
  return gespeichert;
}

function speichereRegelFormular(){
  const box = document.getElementById('regelKarte');
  const name = (box.querySelector('[data-rkname]') || {}).value || '';
  const kurz = (box.querySelector('[data-rkkurz]') || {}).value || '';
  const bspAr = (box.querySelector('[data-rkbspar]') || {}).value || '';
  const bspDe = (box.querySelector('[data-rkbspde]') || {}).value || '';
  if (RK_MODUS === 'anlegen'){
    if (!name.trim() || !kurz.trim()){ toast('Bitte Name und Erklärung ausfüllen'); return false; }
    RK_ID = eigeneRegelAnlegen({ name, kurz, beispielAr: bspAr, beispielDe: bspDe });
    RK_MODUS = 'ansehen';
    return true;
  }
  if (!RK_ID) return false;
  const t = regelText(RK_ID);
  if (regelArt(RK_ID) === 'eigen'){
    regelnAendern(s => {
      const e = s.eigene[RK_ID];
      if (!e) return;
      e.name = name.trim() || e.name;
      e.kurz = kurz;
      e.beispielAr = bspAr.trim();
      e.beispielDe = bspDe.trim();
      e.zeit = regelnJetzt();
    });
  } else if (t && (name !== t.original.name || kurz !== t.original.kurz)){
    regelTextSetzen(RK_ID, name, kurz);
  } else if (t && t.bearbeitet){
    /* Genau auf das Original zurückgeschrieben: dann ist es auch keins mehr. */
    regelTextZuruecksetzen(RK_ID);
  }
  RK_MODUS = 'ansehen';
  return true;
}

function schliesseRegelKarte(){
  if (typeof overlayZuUeberHistorie === 'function' && overlayZuUeberHistorie('regelKarte')) return;
  const gespeichert = speichereOffeneRegelEingaben();
  const box = document.getElementById('regelKarte');
  const hinter = document.getElementById('regelKarteBackdrop');
  if (box) box.classList.add('hidden');
  if (hinter) hinter.classList.add('hidden');
  RK_ID = null;
  RK_MODUS = 'ansehen';
  if (gespeichert) toast('Gespeichert');
  regelnNachziehen();
}

/* Nach jeder Änderung: die Liste und — falls er gerade dort steht — der
   Satzmodus. Ein Schalter, der erst nach einem Bildschirmwechsel wirkt, sähe
   kaputt aus. */
function regelnNachziehen(){
  const sichtbar = id => { const el = document.getElementById(id); return el && el.classList.contains('active'); };
  if (sichtbar('screen-regeln')) renderRegeln();
  if (sichtbar('screen-sentences')){
    if (typeof renderThemenLeiste === 'function') renderThemenLeiste();
    if (typeof renderSentence === 'function') renderSentence();
  }
}

function regelnVerdrahten(){
  const karte = document.getElementById('regelKarte');
  const hinter = document.getElementById('regelKarteBackdrop');
  const schirm = document.getElementById('screen-regeln');

  hinter.addEventListener('click', schliesseRegelKarte);

  karte.addEventListener('click', (e) => {
    const ziel = e.target.closest('button');
    if (!ziel) return;
    if (ziel.hasAttribute('data-rkzu')){ schliesseRegelKarte(); return; }
    if (ziel.hasAttribute('data-rkmehr')){
      const rest = ziel.nextElementSibling;
      if (rest){ const zu = rest.classList.toggle('hidden'); ziel.textContent = zu ? 'ausführlich' : 'weniger'; }
      return;
    }
    if (ziel.hasAttribute('data-rkoriginal')){
      const o = ziel.nextElementSibling;
      if (o){ const zu = o.classList.toggle('hidden'); ziel.textContent = zu ? 'Original zeigen' : 'Original verbergen'; }
      return;
    }
    if (ziel.dataset.regelkarte){ oeffneRegelKarte(ziel.dataset.regelkarte); return; }
    if (!RK_ID && RK_MODUS !== 'anlegen') return;
    if (ziel.hasAttribute('data-rkueben')){ regelImSatzmodusUeben(RK_ID); return; }
    if (ziel.hasAttribute('data-rkentwurf')){
      const e = regelEntwurf(RK_ID);
      if (!e) return;
      regelTextSetzen(RK_ID, e.name, entwurfAlsText(e));
      toast('Entwurf ist jetzt deine Fassung — das Original bleibt einen Tipp entfernt');
      zeichneRegelKarte(); regelnNachziehen();
      return;
    }
    if (ziel.dataset.rkfrueher){
      const [feldName, nr] = ziel.dataset.rkfrueher.split(':');
      const eintrag = regelnStand()[feldName] && regelnStand()[feldName][RK_ID];
      const alt = eintrag && Array.isArray(eintrag.frueher) ? eintrag.frueher[Number(nr)] : null;
      if (!alt) return;
      if (feldName === 'notiz'){ regelNotizSetzen(RK_ID, alt.text); toast('Ältere Notiz zurückgeholt'); }
      else { const t = regelText(RK_ID); regelTextSetzen(RK_ID, t ? t.name : '', alt.text); toast('Ältere Fassung zurückgeholt'); }
      zeichneRegelKarte(); regelnNachziehen();
      return;
    }
    if (ziel.hasAttribute('data-rknotizspeichern')){
      const feld = karte.querySelector('[data-rknotiz]');
      regelNotizSetzen(RK_ID, feld ? feld.value : '');
      toast('Notiz gespeichert');
      regelnNachziehen();
      return;
    }
    if (ziel.hasAttribute('data-rkbearbeiten')){
      speichereOffeneRegelEingaben();
      RK_MODUS = 'bearbeiten'; zeichneRegelKarte(); return;
    }
    if (ziel.hasAttribute('data-rkabbrechen')){
      if (RK_MODUS === 'anlegen'){ RK_MODUS = 'ansehen'; RK_ID = null;
        /* Nichts angelegt: das Formular leeren, dann schließen — sonst
           speicherte speichereOffeneRegelEingaben() es doch noch. */
        karte.innerHTML = ''; schliesseRegelKarte(); return; }
      RK_MODUS = 'ansehen'; zeichneRegelKarte(); return;
    }
    if (ziel.hasAttribute('data-rkspeichern')){
      if (speichereRegelFormular()){ zeichneRegelKarte(); toast('Gespeichert'); regelnNachziehen(); }
      return;
    }
    if (ziel.hasAttribute('data-rkzuruecksetzen')){
      regelTextZuruecksetzen(RK_ID); zeichneRegelKarte(); toast('Original wiederhergestellt'); regelnNachziehen(); return;
    }
    if (ziel.hasAttribute('data-rkloeschen')){
      speichereOffeneRegelEingaben();
      regelLoeschen(RK_ID);
      toast('Im Papierkorb — unten in „Regeln" wiederherstellbar');
      karte.innerHTML = '';
      schliesseRegelKarte();
      return;
    }
    if (ziel.hasAttribute('data-rkzurueck')){
      regelWiederherstellen(RK_ID); zeichneRegelKarte(); toast('Wiederhergestellt'); regelnNachziehen(); return;
    }
    if (ziel.hasAttribute('data-rkzeigen')){ regelZeigen(RK_ID, true); zeichneRegelKarte(); regelnNachziehen(); return; }
    if (ziel.hasAttribute('data-rkverbergen')){ regelZeigen(RK_ID, false); zeichneRegelKarte(); regelnNachziehen(); return; }
  });

  karte.addEventListener('change', (e) => {
    const schalter = e.target.closest('[data-rksatz]');
    if (!schalter || !RK_ID) return;
    regelSatzSetzen(RK_ID, schalter.checked);
    zeichneRegelKarte();
    toast(schalter.checked ? 'Im Satzmodus' : 'Nicht mehr im Satzmodus');
    regelnNachziehen();
  });

  schirm.addEventListener('click', (e) => {
    const zeigen = e.target.closest('[data-regelzeigen]');
    if (zeigen){ regelZeigen(zeigen.dataset.regelzeigen, true); renderRegeln(); toast('Steht wieder in der Liste'); return; }
    const zurueck = e.target.closest('[data-regelzurueck]');
    if (zurueck){ regelWiederherstellen(zurueck.dataset.regelzurueck); renderRegeln(); toast('Wiederhergestellt'); return; }
    const auf = e.target.closest('[data-regelnauf]');
    if (auf){ const k = auf.dataset.regelnauf; REGELN_AUF[k] = !REGELN_AUF[k]; renderRegeln(); return; }
    if (e.target.closest('#btnRegelAnlegen')){ oeffneRegelKarte(null, 'anlegen'); return; }
    const zeile = e.target.closest('[data-regelkarte]');
    if (zeile) oeffneRegelKarte(zeile.dataset.regelkarte);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !karte.classList.contains('hidden')) schliesseRegelKarte();
    /* Die Zeilen „Wie gut sitzen die Regeln?" sind <div role=button>. */
    if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.matches
        && e.target.matches('[role="button"][data-regelkarte]')){
      e.preventDefault();
      oeffneRegelKarte(e.target.dataset.regelkarte);
    }
  });

  /* ⭐ Überall sonst in der App: ein Element mit data-regelkarte öffnet die
     Karte (Goal, Punkte 8 und 9) — der Knopf „Warum? → Regel" im
     Übungsmodus, „in der Sammlung öffnen" im Aufklapper des Lesemodus, die
     Zeilen „Wie gut sitzen die Regeln?" auf dem Start und die Regeltreffer der
     Kategorien-Suche. EIN Handler statt vier: sonst öffnete eine Stelle die
     Karte mit Historieneintrag und eine andere ohne.
     Die Sammlung und die Karte selbst haben ihre eigenen Handler oben. */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-regelkarte]');
    if (!el || el.closest('#regelKarte') || el.closest('#screen-regeln')) return;
    e.preventDefault();
    const pop = document.getElementById('gramPopover');
    if (pop) pop.classList.remove('show');
    oeffneRegelKarte(el.dataset.regelkarte);
  });

  const suche = document.getElementById('regelnSuche');
  if (suche) suche.addEventListener('input', renderRegeln);
}

if (typeof document !== 'undefined' && document.getElementById && document.getElementById('regelKarte')) regelnVerdrahten();
