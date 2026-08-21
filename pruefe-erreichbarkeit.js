/* pruefe-erreichbarkeit.js -- kommt jede Regel bei Elias an?
 *
 * Aufruf:  node pruefe-erreichbarkeit.js
 * Exitcode 0 = alles erreichbar, 2 = es gibt einen Befund.
 *
 * ================== WOZU, UND WARUM ALS EIGENES SKRIPT ====================
 *
 * Am 18.08.2026 lagen 13 der 93 Regeln in `grammar-data.js` und waren in der
 * App nicht zu erreichen. `validate.js` war gruen, `pruefe-markierungen.js`
 * auch. Beide pruefen, ob eine vorhandene Markierung stimmt - keines fragt, ob
 * eine Regel ueberhaupt eine hat.
 *
 * Der Weg zu einer Regel fuehrt ausschliesslich ueber `SENTENCE_TAGS`. Ohne
 * Markierung taucht sie hoechstens als falsche Antwort im Uebungsmodus auf.
 *
 * Dieselbe Bauart hat an dem Tag noch zweimal zugeschlagen: eine Regel im Repo,
 * die nie veroeffentlicht wurde, und ein Automationsschritt, dessen Werkzeuge
 * nicht freigegeben waren. Immer sieht alles richtig aus, und die Wirkung
 * fehlt. Deshalb prueft dieses Skript beides:
 *
 *   1. Ist jede Regel markiert oder ausdruecklich ausgeblendet?
 *   2. Steht in `.deploy/` dasselbe wie im Repo - also ist der letzte Stand
 *      auch wirklich draussen?
 *
 * ⚠️ `ausgeblendet: true` heisst ZWEIERLEI und sieht gleich aus: meist ist es
 * der Platzhalter "kein Beispielsatz gefunden", an `ta-marbuta-fem-01` dagegen
 * ist es Elias' Abbestellung vom 29.07.2026. Das Skript zaehlt beide getrennt,
 * damit die zweite Sorte nicht als offener Punkt erscheint.
 */
const fs = require('fs');
const path = require('path');
const P = __dirname + path.sep;

function lade(ordner) {
  const gd = ordner + 'grammar-data.js';
  if (!fs.existsSync(gd)) return null;
  const o = (new Function(fs.readFileSync(gd, 'utf8')
    + ';return {GRAMMAR_RULES, SENTENCE_TAGS};'))();
  let cache = null;
  const sw = ordner + 'sw.js';
  if (fs.existsSync(sw)) {
    const m = /vokabeltrainer-v(\d+)/.exec(fs.readFileSync(sw, 'utf8'));
    cache = m ? m[0] : null;
  }
  let saetze = 0;
  const lb = ordner + 'lehrbuch-saetze.js';
  if (fs.existsSync(lb)) {
    const l = (new Function(fs.readFileSync(lb, 'utf8')
      + ';return typeof LEHRBUCH_SAETZE!=="undefined"?LEHRBUCH_SAETZE:[];'))();
    saetze = l.length;
  }
  return { ...o, cache, saetze };
}

function auswerten(d) {
  const markiert = new Set();
  for (const k of Object.keys(d.SENTENCE_TAGS))
    for (const t of (d.SENTENCE_TAGS[k] || [])) if (t && t.ruleId) markiert.add(t.ruleId);
  const regeln = d.GRAMMAR_RULES.filter(Boolean);
  return {
    regeln: regeln.length,
    markiert: markiert.size,
    marken: Object.values(d.SENTENCE_TAGS).flat().length,
    saetze: d.saetze,
    cache: d.cache,
    unsichtbar: regeln.filter(r => !markiert.has(r.id)),
    ausgeblendetMitMarke: regeln.filter(r => r.ausgeblendet && markiert.has(r.id)),
    wederNoch: regeln.filter(r => !markiert.has(r.id) && !r.ausgeblendet),
  };
}

const repo = lade(P);
if (!repo) { console.log('⛔ grammar-data.js nicht gefunden'); process.exit(2); }
const a = auswerten(repo);
let befunde = 0;

console.log('=== Repo ===');
console.log('  ' + a.regeln + ' Regeln, ' + a.markiert + ' erreichbar, ' + a.marken
  + ' Markierungen, ' + a.saetze + ' Lehrbuchsaetze, Cache ' + a.cache);

if (a.wederNoch.length) {
  befunde++;
  console.log('\n⛔ ' + a.wederNoch.length + ' Regel(n) WEDER markiert NOCH ausgeblendet —');
  console.log('   sie sind unerreichbar, ohne dass es irgendwo vermerkt waere:');
  for (const r of a.wederNoch) console.log('      ' + r.id + '  ' + (r.name || ''));
}
const platzhalter = a.unsichtbar.filter(r => !a.wederNoch.includes(r));
if (platzhalter.length) {
  console.log('\n⚠️  ' + platzhalter.length + ' Regel(n) ausgeblendet, weil kein Beispielsatz gefunden wurde.');
  console.log('   Das ist ein offener Punkt, kein Fehler — aber er wird nur erledigt, wenn er auffaellt:');
  for (const r of platzhalter) console.log('      ' + r.id + '  ' + (r.name || ''));
}
if (a.ausgeblendetMitMarke.length) {
  console.log('\n   ' + a.ausgeblendetMitMarke.length + ' Regel(n) haben Markierungen und sind trotzdem ausgeblendet.');
  console.log('   Das ist in Ordnung, wenn Elias sie abbestellt hat — nachsehen, nicht entsperren:');
  for (const r of a.ausgeblendetMitMarke) console.log('      ' + r.id);
}

/* --- Ist der Stand auch draussen? --- */
console.log('\n=== .deploy/ ===');
const dep = lade(P + '.deploy' + path.sep);
if (!dep) {
  console.log('  kein .deploy/ vorhanden — es wurde noch nie veroeffentlicht.');
} else {
  const b = auswerten(dep);
  console.log('  ' + b.regeln + ' Regeln, ' + b.markiert + ' erreichbar, ' + b.marken
    + ' Markierungen, ' + b.saetze + ' Lehrbuchsaetze, Cache ' + b.cache);
  const abweichung = [];
  for (const f of ['regeln', 'markiert', 'marken', 'saetze', 'cache'])
    if (a[f] !== b[f]) abweichung.push(f + ': Repo ' + a[f] + ', ausgeliefert ' + b[f]);
  if (abweichung.length) {
    befunde++;
    console.log('\n⛔ Der ausgelieferte Stand ist NICHT der aktuelle:');
    for (const x of abweichung) console.log('      ' + x);
    console.log('   ⚠️ `git push` veroeffentlicht nichts. Richtig ist:');
    console.log('      CACHE_NAME in sw.js hochsetzen, dann');
    console.log('      node werkzeuge/veroeffentlichen.mjs --mit-daten');
  } else {
    console.log('  ✅ deckt sich mit dem Repo.');
  }
}


/* =========================================================================
   ERREICHBAR — UND ERREICHBAR HEUTE SIND ZWEI FRAGEN
   =========================================================================
   Oben wird gefragt: hat die Regel ueberhaupt eine Markierung? Fuer Elias
   zaehlt aber nur, ob diese Markierung in einem Satz sitzt, den er SIEHT.

   ⛔ Am 19./20.08.2026 sind 31 vorausgeschriebene Beispielsaetze dazugekommen
   (Kapitel 12 bis 15). `nichtVorausgeschrieben()` in js/saetze.js blendet sie
   aus, bis er das Kapitel anhakt. Saesse die EINZIGE Markierung einer Regel in
   so einem Satz, waere die Regel heute unerreichbar — und die Zaehlung oben
   meldete trotzdem gruen, weil die Markierung ja existiert.

   ⚠️ Massstab ist seine eigene ANGABE aus data/lernstand.json, nicht was
   arabicroots freigeschaltet hat. Freigeschaltet ist nicht gelernt.

   ⛔ WAS DIESES GRUEN HEUTE NICHT BEDEUTET.
   Am 20.08.2026 nachgemessen: KEINE einzige Regel haengt ausschliesslich an
   Beispielsaetzen -- jede hat mindestens eine Markierung in vocab-data.js oder
   in lehrbuch-saetze.js, und die sind immer sichtbar. Der Abschnitt kann heute
   also gar nicht durchfallen; er ist VORSORGE fuer den Tag, an dem eine Regel
   nur ueber einen vorausgeschriebenen Satz erreichbar gemacht wird. Genau das
   liegt beim naechsten Vorschreiben nahe.
   Gegengeprueft, dass der Meldeweg funktioniert: mit `sichtbar => false`
   meldet er alle 95 Regeln. [[pruefwerkzeug-mit-eingebauter-antwort]] */
try {
  const lsPfad = P + 'data' + path.sep + 'lernstand.json';
  const bsPfad = P + 'data' + path.sep + 'beispielsaetze.js';
  const vkPfad = P + 'data' + path.sep + 'vokabeln-madina-1.js';
  if (fs.existsSync(lsPfad) && fs.existsSync(bsPfad) && fs.existsSync(vkPfad)) {
    const ls = JSON.parse(fs.readFileSync(lsPfad, 'utf8'));
    const a1 = (ls.angabe && ls.angabe['madina-1']) || {};
    const stand = Number(a1.kapitel ?? a1 ?? 0);
    const fen = {};
    new Function('window', fs.readFileSync(vkPfad, 'utf8'))(fen);
    const M1 = (fen.VOKABELN && fen.VOKABELN['madina-1']) || [];
    const kapVon = new Map(M1.map(w => [String(w.id), Number(w.chapter)]));
    const { BEISPIELSAETZE } =
      (new Function(fs.readFileSync(bsPfad, 'utf8') + ';return {BEISPIELSAETZE};'))();

    /* Nur Beispielsaetze zu Buchvokabeln koennen ausgeblendet sein.
     *
     * ⛔⛔ DER FALL, DEN DIE ERSTE FASSUNG FALSCH BEURTEILTE: `kapVon` kennt
     * nur madina-1. Von den 148 Beispielsaetzen haengen 14 an Elias' EIGENEN
     * Woertern (`p_`-Ids) — dort liefert kapVon `undefined`, und die alte
     * Bedingung `k !== undefined && k <= stand` machte daraus "nicht
     * sichtbar". Genau umgekehrt ist es richtig: eigene Woerter tragen
     * `chapter: 'personal'`, und `istBekannt()` in js/kern.js:149 gibt dafuer
     * bedingungslos true zurueck — sie sind IMMER sichtbar, an keinem Kapitel
     * haengend.
     *
     * ⚠️ Am 21.08.2026 traf es noch keine Regel: 10 haben eine Markierung an
     * einem eigenen Wort, aber **keine ausschliesslich dort**. Der Fehler war
     * also latent — er haette beim ersten Mal zugeschlagen, wenn eine Regel
     * nur noch an einer eigenen Karte haengt, und dann als "nicht erreichbar"
     * gemeldet, was in Wahrheit die am besten erreichbare Stelle ist.
     * [[app_auswahl_entscheidet]] [[werkzeug_misst_kleineren_bestand]] */
    const sichtbar = id => {
      const s = String(id);
      if (!BEISPIELSAETZE[s]) return true;
      const k = kapVon.get(s);
      if (k === undefined) return true;   /* keine madina-1-Vokabel = kein Kapitel = immer sichtbar */
      return k <= stand;
    };

    const versteckt = [];
    /* ⛔ Ab dem 21.08.2026 wird auch GEZAEHLT, wie viele Regeln ueberhaupt
       geprueft wurden. Ohne die Zahl staende bei einer leeren Schleife
       derselbe gruene Satz - und die beiden Abschnitte darueber nennen
       ihre Zahlen ja auch. [[leere_liste_ist_keine_messung]] */
    let mitMarkierung = 0;
    for (const r of repo.GRAMMAR_RULES) {
      const traeger = Object.entries(repo.SENTENCE_TAGS)
        .filter(([, tags]) => tags.some(t => t.ruleId === r.id)).map(([id]) => id);
      if (!traeger.length) continue;
      mitMarkierung++;
      if (!traeger.some(sichtbar)) versteckt.push([r.id, traeger]);
    }
    console.log('\n=== Erreichbar HEUTE (Lernstand madina-1 Kapitel ' + stand + ') ===');
    if (!versteckt.length) {
      console.log(`  ✅ Alle ${mitMarkierung} markierten Regeln haben mindestens eine`
        + ' Markierung in einem Satz, den er sieht.');
      if (!mitMarkierung) console.log('  ⛔ …aber es sind NULL — hier wurde nichts geprueft.');
    } else {
      befunde++;
      console.log('  ⛔ ' + versteckt.length + ' Regel(n) nur in vorausgeschriebenen Saetzen markiert:');
      for (const [id, t] of versteckt) console.log('     ' + id.padEnd(30) + 'nur in ' + t.join(', '));
      console.log('   Abhilfe: eine Markierung in einem Satz setzen, den er heute schon sieht.');
    }
  }
} catch (e) {
  /* ⛔ Kein stummes catch: ein Ausfall dieser Pruefung darf nicht wie ein
     bestandener Test aussehen. [[ausfall-ist-unsichtbar-gebaut]] */
  console.log('\n⚠️ Abschnitt "Erreichbar HEUTE" nicht lauffaehig: ' + e.message);
}

console.log('\n' + (befunde
  ? '⛔ ' + befunde + ' Befund(e) — siehe oben.'
  : '✅ Jede Regel ist erreichbar, und der ausgelieferte Stand ist aktuell.'));
process.exit(befunde ? 2 : 0);
