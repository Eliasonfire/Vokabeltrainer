/* fachbegriffe-nachschlagen.mjs — die Schreibung eines Fachbegriffs bei ZWEI
 * Quellen holen, ohne Browser, und nur bei Übereinstimmung ablegen.
 * ==========================================================================
 *
 *   node werkzeuge/fachbegriffe-nachschlagen.mjs              alle offenen aus dem Prüfer
 *   node werkzeuge/fachbegriffe-nachschlagen.mjs --zeigen     nur zeigen, nichts schreiben
 *   node werkzeuge/fachbegriffe-nachschlagen.mjs --eichen     nur die Eichfälle
 *   node werkzeuge/fachbegriffe-nachschlagen.mjs --datei x.json   Wörter aus einer Liste
 *
 *   Exit 0 = gelaufen (auch wenn nichts belegt werden konnte)
 *        1 = Werkzeugfehler oder Eichung gescheitert
 *
 * ==========================================================================
 * ⛔⛔ WAS ES NICHT TUT: in die App eintragen.
 *
 * Es schreibt ausschließlich nach `werkzeuge/fachbegriffe-belege.json`. Von
 * dort nimmt `fachbegriffe-setzen.mjs` die Form auf — mit seinen eigenen sechs
 * Vorabprüfungen. Goal E.1 („nicht selbst vokalisieren") bleibt damit
 * unberührt: hier wird abgeschrieben, nicht entschieden.
 *
 * ==========================================================================
 * ⭐ DER ANLASS — Elias am 11.09.2026, 21:20:26
 *
 * Auf die Zeile „Frag deinen Lehrer, wie er acht Fachbegriffe vollständig
 * vokalisiert schreibt":
 *
 *     „guck es doch nach bei den wörterbüchern die ich dir gegeben habe"
 *
 * Damals von Hand gemacht (sieben belegt, v473). Seither stand in der To-Do,
 * dass Schritt 1f der Wartung das **selbst** können soll. Am 15.09.2026 fehlte
 * es wieder: `مَقْصورة` brauchte eine zweite Quelle, arabdict allein bot zwei
 * verschiedene Formen zur Wahl — und wählen darf ich nicht.
 *
 * ==========================================================================
 * ⭐⭐ WARUM ZWEI QUELLEN, UND WARUM GENAU DIESE ZWEI
 *
 * Weil eine einzelne täuscht. Am selben Wort gemessen (07.09.2026):
 *
 *     arabdict   كُرْسِيّ   سَيِّدٌ
 *     Reverso    كُرْسِي    سَيِّد
 *
 * arabdict schreibt Schadda und Tanwīn, Reverso lässt beides weg. Beide sind
 * nicht falsch — sie zitieren verschieden. Wer nur eine fragt, hält ihre
 * Schreibweise für DIE Schreibweise. [[zwei_rechtschreibungen_ein_text]]
 *
 * ⛔ Reverso kommt hier NICHT vor: es braucht ein echtes Browserfenster (fetch
 * und headless bekommen HTTP 403) und rund acht Sekunden je Wort. Ein Werkzeug
 * für die nächtliche Wartung darf kein Fenster aufreißen.
 * [[reverso_braucht_echtes_fenster]] en.wiktionary geht über die MediaWiki-API
 * und ist damit die zweite Quelle, die ohne Browser auskommt.
 *
 * ⚠️ Elias' Rangfolge bleibt: 1. arabicroots · 2. seine Bücher · 3. sonstige
 * Belege · 4. arabdict · 5. Langenscheidt im Notfall. Der EIGENE BESTAND steht
 * über allem — deshalb fragt dieses Werkzeug ihn zuerst und die Wörterbücher
 * nur dort, wo er schweigt. [[eigener_bestand_vor_woerterbuch]]
 *
 * ==========================================================================
 * ⛔ DIE WIKTIONARY-FALLE, teuer erkauft am 11.09.2026
 *
 * Der Arabisch-Abschnitt endet an der nächsten Überschrift ZWEITER Ebene. Ein
 * Muster wie `\n==` trifft aber schon `===Etymology===` — dann bricht der
 * Abschnitt nach drei Zeilen ab und das Wort gilt als unbekannt. Richtig ist
 * `^==[^=]`, und zwar mit `m`-Flag. Im Wegwerfskript von damals genau so
 * passiert.
 *
 * ==========================================================================
 * ⭐ DIE EICHUNG (--eichen), zweiseitig
 *
 * Ein Prüfer, der nur „findet", findet auch dort etwas, wo nichts ist. Deshalb
 * drei Fälle, von denen zwei NICHTS ergeben dürfen:
 *
 *   تشكيل     muss belegt werden      (beide Quellen führen تَشْكِيل)
 *   مربوطة    darf NICHT belegt werden (arabdict kennt nur مَرْبُوط, die
 *                                       männliche Grundform — die weibliche
 *                                       Form wäre meine Ableitung)
 *   زقزقنبوط  darf NICHT belegt werden (erfunden, kennt niemand)
 *
 * ⚠️ Repariert man den Eichfall, fällt die Eichung aus. Wird `مربوطة` eines
 * Tages belegt, gehört ein neuer, noch offener Fall hierher — keine gelockerte
 * Schwelle. [[pruefwerkzeug_mit_eingebauter_antwort]]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BELEGE = path.join(REPO, 'werkzeuge', 'fachbegriffe-belege.json');
const ARG = process.argv.slice(2);
const NUR_ZEIGEN = ARG.includes('--zeigen');
const NUR_EICHEN = ARG.includes('--eichen');
const NL = String.fromCharCode(10);

/* ⛔ Auf Windows verlangt der ESM-Lader eine file://-URL — ein Pfad wie „G:/…"
   wird als Protokoll „g:" gelesen und abgewiesen. [[windows_pfad_in_python_string]] */
const MCP = 'G:/1. Workspace/MCP-Servers/arabdict/src/';
const { schlageNach: ausArabdict, nackt } =
  await import(pathToFileURL(MCP + 'arabdict.mjs').href);

/* ---------------------------------------------------------------- Zeichen */

const HARAKAT = new Set([0x064B, 0x064C, 0x064D, 0x064E, 0x064F, 0x0650, 0x0651,
  0x0652, 0x0653, 0x0654, 0x0655, 0x0656, 0x0657, 0x0658, 0x0670]);
const skelett = (w) => [...String(w || '').normalize('NFC')]
  .filter(c => !HARAKAT.has(c.codePointAt(0))).join('');

/* ⭐ Der Vergleich läuft „bis auf den Schlussvokal" — so steht es im Kopf von
   fachbegriffe-belege.json, und so ist es richtig: arabdict schreibt die
   Zitierform gern mit Tanwīn (اِسْمٌ), en.wiktionary ohne (اِسْم). Das ist
   dieselbe Schreibung, nur anders zitiert. Ein Unterschied WEITER VORN wäre
   dagegen ein echter. */
const ENDVOKALE = new Set([0x064B, 0x064C, 0x064D, 0x064E, 0x064F, 0x0650, 0x0652]);
function ohneSchluss(w){
  let z = [...String(w || '').normalize('NFC')];
  while (z.length && ENDVOKALE.has(z[z.length - 1].codePointAt(0))) z.pop();
  return z.join('');
}
const gleich = (a, b) => ohneSchluss(a) === ohneSchluss(b);

/* ---------------------------------------------------------- en.wiktionary */

const KOPF = { 'User-Agent':
  'Vokabeltrainer/1.0 (privates Lernprojekt, Kontakt ueber github.com)' };

/* ⛔ DIE FALLE: `\n==` trifft auch `===Etymology===`. Der Arabisch-Abschnitt
   endet an der nächsten Überschrift ZWEITER Ebene — `^==[^=]`, mit m-Flag. */
function arabischerTeil(wt){
  const s = wt.search(/^==\s*Arabic\s*==\s*$/m);
  if (s < 0) return '';
  const rest = wt.slice(s + 1);
  const e = rest.search(/^==[^=][^\n]*==\s*$/m);
  return e < 0 ? rest : rest.slice(0, e);
}

/* Die vokalisierten Kopfformen: {{ar-noun|مَقْصُورَة|…}}, auch adj/verb/… */
function formenAus(teil){
  const raus = [];
  const muster = /\{\{ar-(?:noun|adj|verb|part|prep|adv|pron|num|proper noun)[^}|]*\|([^}|]+)/g;
  for (const m of teil.matchAll(muster)){
    const f = m[1].replace(/<[^>]*>/g, '').trim();
    /* \u26D4 Ein f\u00FChrendes \u201E+" ist bei Wiktionary kein Teil des Wortes, sondern der
       Marker f\u00FCr eine WURZELANGABE: `{{ar-noun|+|...}}` bzw. `+\u0633\u0645\u0627` hei\u00DFt \u201Edie
       Form ergibt sich aus der Wurzel". Ohne diesen Filter stand \u201E+\u0633\u0645\u0627" als
       Schreibung von \u0627\u0633\u0645\u064A in der Ausgabe \u2014 eine Wurzel, die wie eine Wortform
       aussieht. [[stichworttreffer_ist_kein_inhaltstreffer]] */
    if (f.startsWith('+')) continue;
    if (f && /[\u0600-\u06FF]/.test(f) && !raus.includes(f)) raus.push(f);
  }
  return raus;
}

const warte = (ms) => new Promise(r => setTimeout(r, ms));

/* ⛔⛔ IN BLÖCKEN FRAGEN, NICHT WORT FÜR WORT.
 *
 * Der erste Entwurf rief die API je Wort einmal auf — und bekam ab dem ersten
 * Wort **HTTP 429** („zu viele Anfragen"). Acht von neun Wörtern hatten damit
 * nur EINE Quelle, und das Werkzeug meldete pflichtschuldig „keine zwei
 * übereinstimmenden Quellen". Das sah aus wie ein Befund über die Wörter und
 * war ein Befund über meine Abrufweise.
 *
 * ⭐ Die MediaWiki-API nimmt bis zu 50 Titel in einem Aufruf (`titles=a|b|c`).
 * Aus zehn Abrufen wird einer — kein Drosseln, und nebenbei zehnmal schneller.
 * Genau so macht es `aussenbelege.mjs` seit dem 21.08.2026, in Blöcken zu 40.
 *
 * ⚠️ Und trotzdem ein Wiederholungsversuch: eine 429 kann auch von einem
 * anderen Prozess kommen. Sie darf das Ergebnis nicht still verfälschen —
 * schlägt auch der zweite Versuch fehl, steht der Fehler im Bericht.
 * [[leere_liste_ist_keine_messung]] */
async function wiktionaryBlock(woerter){
  const raus = new Map();
  const titel = [...new Set(woerter.map(skelett).filter(Boolean))];
  for (let i = 0; i < titel.length; i += 40){
    const block = titel.slice(i, i + 40);
    const url = 'https://en.wiktionary.org/w/api.php?action=query&prop=revisions'
              + '&rvprop=content&rvslots=main&format=json&formatversion=2&titles='
              + block.map(encodeURIComponent).join('%7C');
    let d = null, letzterFehler = null;
    for (const versuch of [0, 1]){
      try {
        if (versuch) await warte(2000);
        const r = await fetch(url, { headers: KOPF });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        d = await r.json();
        break;
      } catch (e){ letzterFehler = e; }
    }
    if (!d){
      for (const t of block) raus.set(t, { fehler: 'wiktionary: ' + letzterFehler.message });
      continue;
    }
    for (const s of (d.query || {}).pages || []){
      if (s.missing){ raus.set(s.title, { formen: [], url: null }); continue; }
      const wt = (((s.revisions || [])[0] || {}).slots || {}).main
        ? s.revisions[0].slots.main.content : '';
      const teil = arabischerTeil(wt);
      raus.set(s.title, {
        formen: teil ? formenAus(teil) : [],
        url: 'https://en.wiktionary.org/wiki/' + encodeURIComponent(s.title) + '#Arabic',
      });
    }
    /* ⚠️ Wiktionary normalisiert Titel — über die Rückgabe zuordnen, nie über
       die Reihenfolge der Anfrage. */
    for (const n of (d.query || {}).normalized || []) raus.set(n.from, raus.get(n.to));
    if (i + 40 < titel.length) await warte(500);
  }
  return raus;
}

/* ------------------------------------------------------- eigener Bestand */

/* ⭐ Elias' Rangfolge: der eigene Bestand steht über den Wörterbüchern. Wenn
   dieselbe Schreibung mehrfach in seinen Dateien steht, ist das der bessere
   Beleg — die Wörterbücher stützen dann nur noch. */
const BESTANDSDATEIEN = [
  'vocab-data.js', 'lehrbuch-saetze.js', 'grammar-data.js', 'surah-data.js',
  'data/fachbegriffe.js', 'data/beispielsaetze.js', 'regelsammlung-data.js',
];
let bestand = null;
function bestandLesen(){
  if (bestand) return bestand;
  bestand = new Map();               // skelett -> Map(form -> anzahl)
  const istAr = (c) => { const k = c.codePointAt(0); return k >= 0x0600 && k <= 0x06FF; };
  for (const d of BESTANDSDATEIEN){
    const pfad = path.join(REPO, d);
    if (!fs.existsSync(pfad)) continue;
    const text = fs.readFileSync(pfad, 'utf8');
    let wort = '';
    for (const c of text){
      if (istAr(c)){ wort += c; continue; }
      if (wort){
        const sk = skelett(wort);
        if (!bestand.has(sk)) bestand.set(sk, new Map());
        const m = bestand.get(sk);
        const k = wort.normalize('NFC');
        m.set(k, (m.get(k) || 0) + 1);
        wort = '';
      }
    }
  }
  return bestand;
}

/* Die VOLLSTÄNDIGSTE Schreibung im Bestand, mit ihrer Häufigkeit.
   ⚠️ „Häufigste" wäre falsch: am 15.09.2026 stand مَقْصورة neunmal im Bestand
   und war neunmal gleich unvollständig — alle Vorkommen aus derselben
   Abschrift. Häufigkeit ist kein Beleg. [[sammelaussage_einzeln_belegen]]
   Deshalb zählt hier, wie viele Ḥarakāt eine Form trägt; bei Gleichstand die
   häufigere. */
function ausBestand(wort){
  const m = bestandLesen().get(skelett(wort));
  if (!m) return null;
  const harakat = (w) => [...w].filter(c => HARAKAT.has(c.codePointAt(0))).length;
  const sortiert = [...m.entries()].sort((a, b) =>
    harakat(b[0]) - harakat(a[0]) || b[1] - a[1]);
  const [form, n] = sortiert[0];
  return { form, n, verschiedene: sortiert.length };
}

/* ------------------------------------------------------------ Nachschlagen */

async function nachschlagen(wort, wikiMap){
  const erg = { wort, bestand: null, arabdict: [], wiktionary: [], url: null, fehler: [] };

  erg.bestand = ausBestand(wort);

  try {
    const a = await ausArabdict(skelett(wort));
    /* ⛔ NUR Formen, die GENAU DAS WORT sind. „بيت الفلاح" ist kein Treffer
       für „بيت", und مَرْبُوط ist keiner für مربوطة — arabdict sagt das selbst
       über `genauDasWort`. Wer das übergeht, belegt eine Ableitung.
       [[stichworttreffer_ist_kein_inhaltstreffer]] */
    erg.arabdict = (a.formen || [])
      .filter(f => f.genauDasWort && f.taschkil && !f.wortgruppe)
      .map(f => f.form);
  } catch (e){ erg.fehler.push('arabdict: ' + e.message); }

  /* Die Wiktionary-Antworten kommen aus dem Block, der vorher geholt wurde. */
  const w = (wikiMap || new Map()).get(skelett(wort));
  if (!w) erg.fehler.push('wiktionary: nicht abgefragt');
  else if (w.fehler) erg.fehler.push(w.fehler);
  else { erg.wiktionary = w.formen; erg.url = w.url; }

  /* ---- Das Urteil. Zwei übereinstimmende Quellen, sonst nichts. ---- */
  const quellen = [];
  if (erg.bestand) quellen.push({ quelle: 'eigener Bestand', form: erg.bestand.form,
    hinweis: erg.bestand.n + '× in seinen Dateien'
      + (erg.bestand.verschiedene > 1 ? ', ' + erg.bestand.verschiedene + ' Schreibweisen' : '') });
  for (const f of erg.arabdict) quellen.push({ quelle: 'arabdict', form: f });
  for (const f of erg.wiktionary) quellen.push({ quelle: 'en.wiktionary', form: f, url: erg.url });

  /* Welche Form tragen MINDESTENS ZWEI VERSCHIEDENE Quellen? */
  const gruppen = [];
  for (const q of quellen){
    let g = gruppen.find(x => gleich(x.form, q.form));
    if (!g){ g = { form: q.form, quellen: [] }; gruppen.push(g); }
    /* ⛔ Dieselbe Quelle zweimal ist EINE Quelle. */
    if (!g.quellen.some(x => x.quelle === q.quelle)) g.quellen.push(q);
    /* ⭐ Welche Schreibung führt die Gruppe an?
       Die mit den meisten Ḥarakāt **im Wortinneren** — und bei Gleichstand die
       KÜRZERE, also die ohne Tanwīn.

       ⛔ Der erste Versuch zählte alle Ḥarakāt und wählte damit `تَشْكِيلٌ`
       statt `تَشْكِيل`: arabdict zitiert gern mit Tanwīn, der eigene Bestand
       ohne. Für einen Fachbegriff in einem Regelnamen ist die **Zitierform**
       richtig — ein Tanwīn dort wäre eine Kasusendung, die das Wort an dieser
       Stelle gar nicht trägt. `pruefe-taschkil.js` nennt genau das „Zitierform
       eines Fachbegriffs (ohne Endung, richtig so)".

       ⚠️ Beide Schreibungen bleiben als Quellen im Beleg stehen — Elias sieht
       also, dass arabdict die Endung führt, und kann sie nehmen. */
    const innen = (w) => [...ohneSchluss(w)]
      .filter(c => HARAKAT.has(c.codePointAt(0))).length;
    if (innen(q.form) > innen(g.form)
        || (innen(q.form) === innen(g.form) && q.form.length < g.form.length))
      g.form = q.form;
  }
  const belegt = gruppen.filter(g => g.quellen.length >= 2)
    .sort((a, b) => b.quellen.length - a.quellen.length);

  erg.gruppen = gruppen;
  /* ⛔ Genau EINE belegte Gruppe, sonst ist die Frage offen: zwei Gruppen mit
     je zwei Quellen heißt, dass die Quellen sich WIDERSPRECHEN — dann
     entscheidet Elias, nicht ich. */
  erg.urteil = belegt.length === 1 ? belegt[0] : null;
  erg.grund = belegt.length === 0
    ? (quellen.length ? 'keine zwei uebereinstimmenden Quellen' : 'keine Quelle kennt es')
    : belegt.length > 1 ? 'die Quellen widersprechen sich (' + belegt.length + ' Formen)' : '';
  return erg;
}

/* ------------------------------------------------------------------ Eichung */

const EICHFAELLE = [
  { wort: 'تشكيل',   sollBelegt: true,
    warum: 'beide Quellen fuehren تَشْكِيل — der Beleg vom 11.09.2026 steht bereits' },
  { wort: 'مربوطة',  sollBelegt: false,
    warum: 'arabdict kennt nur die maennliche Grundform مَرْبُوط (genauDasWort:false);'
         + ' die weibliche Form waere MEINE Ableitung' },
  { wort: 'زقزقنبوط', sollBelegt: false,
    warum: 'erfunden — kennt niemand' },
];

async function eichen(){
  console.log('=== Eichung (zweiseitig: zwei Faelle MUESSEN leer ausgehen) ===');
  let fehler = 0;
  const wiki = await wiktionaryBlock(EICHFAELLE.map(f => f.wort));
  for (const f of EICHFAELLE){
    const e = await nachschlagen(f.wort, wiki);
    const belegt = !!e.urteil;
    const ok = belegt === f.sollBelegt;
    if (!ok) fehler++;
    console.log('  ' + (ok ? 'ok  ' : '⛔  ') + f.wort.padEnd(10)
      + (belegt ? 'belegt: ' + e.urteil.form + ' ('
          + e.urteil.quellen.map(q => q.quelle).join(' + ') + ')'
        : 'nicht belegt — ' + e.grund));
    if (!ok) console.log('       erwartet: ' + (f.sollBelegt ? 'BELEGT' : 'NICHT belegt')
      + ' — ' + f.warum);
    if (e.fehler.length) console.log('       ⚠️ ' + e.fehler.join(' · '));
  }
  return fehler;
}

/* --------------------------------------------------------------- Wortliste */

/* ⛔ Die Wörter kommen aus dem PRÜFER, nicht aus einer Handliste. Eine Liste,
   die ich danebenlege, veraltet in dem Moment, in dem ein Befund verschwindet,
   und behauptet dann Arbeit, die keine mehr ist. [[handliste_neben_echter_quelle]] */
function offeneWoerter(){
  const i = ARG.indexOf('--datei');
  if (i >= 0){
    const d = JSON.parse(fs.readFileSync(ARG[i + 1], 'utf8'));
    return (Array.isArray(d) ? d : d.woerter || []).map(String);
  }
  let aus = '';
  try {
    aus = execFileSync(process.execPath, ['pruefe-taschkil.js'],
      { encoding: 'utf8', cwd: REPO, maxBuffer: 20e6 });
  } catch (e){
    /* ⛔ pruefe-taschkil.js endet mit 1, SOBALD es Befunde gibt — das ist sein
       Sinn, kein Fehler. execFileSync wirft trotzdem, und die Ausgabe hängt
       dann am Fehlerobjekt. */
    aus = String(e.stdout || '');
    if (!aus) { console.error('⛔ pruefe-taschkil.js nicht lesbar: ' + e.message); process.exit(1); }
  }
  const woerter = [];
  let inGruppe = false;
  for (const zeile of aus.split(/\r?\n/)){
    const k = /^=== (.+?): \d+ ===$/.exec(zeile);
    if (k){ inGruppe = !k[1].startsWith('[kein Mangel]'); continue; }
    if (zeile.startsWith('===')){ inGruppe = false; continue; }
    if (!inGruppe) continue;
    const m = /^\s{2}(\S+)\s/.exec(zeile);
    if (!m || !/[\u0600-\u06FF]/.test(m[1])) continue;
    /* \u2B50\u2B50 WO das Wort beanstandet wurde, geh\u00F6rt in den Beleg \u2014 sonst wird aus
       \u201Eso schreibt man dieses Wort" sp\u00E4ter \u201Eso muss der Satz aussehen".
       Der Pr\u00FCfer nennt Feld und ID in derselben Zeile:
           \u0627\u0633\u0652\u0645\u064F    Stelle 0 (\u0627)  sentAr  id mb1-42-2
       \u26D4 Ein `mb1-\u2026`-Satz ist ein ZITAT aus dem Madina-Buch. Ein Zitat wird
       nicht korrigiert, auch wenn beide W\u00F6rterb\u00FCcher es anders schreiben \u2014
       die App soll zeigen, was im Buch steht. Am 15.09.2026 h\u00E4tte genau das
       fast zu drei ge\u00E4nderten Lehrbuchs\u00E4tzen gef\u00FChrt. */
    const feld = (/\b(ar|sg|pl|femSg|femPl|sentAr)\b/.exec(zeile) || [])[1] || '';
    const id = (/\bid\s+(\S+)/.exec(zeile) || [])[1] || '';
    if (!woerter.some(w => w.wort === m[1]))
      woerter.push({ wort: m[1], feld, id, zitat: /^mb\d/.test(id) });
  }
  return woerter;
}

/* -------------------------------------------------------------------- Lauf */

const eichFehler = await eichen();
if (eichFehler){
  console.log('');
  console.log('⛔ Die Eichung greift nicht — jede Messung danach saegte nichts.');
  console.log('   ⚠️ Repariert jemand einen Eichfall, gehoert ein NEUER, noch offener');
  console.log('      Fall hierher — keine gelockerte Schwelle.');
  process.exit(1);
}
if (NUR_EICHEN){ console.log(''); console.log('✔ Eichung bestanden.'); process.exit(0); }

const woerter = offeneWoerter();
console.log('');
console.log('=== ' + woerter.length + ' offene(s) Wort/Woerter aus pruefe-taschkil.js ===');
console.log('');

/* ⭐ EIN Wiktionary-Abruf für alle Wörter, bevor die Schleife beginnt — siehe
   `wiktionaryBlock()`. Wort für Wort zu fragen hat HTTP 429 eingebracht. */
const wiki = await wiktionaryBlock(woerter.map(w => w.wort));

const neueBelege = [];
for (const eintrag of woerter){
  const w = eintrag.wort;
  const e = await nachschlagen(w, wiki);
  e.fundstelle = eintrag;
  if (e.urteil){
    console.log('  ✔ ' + w.padEnd(14) + '→ ' + e.urteil.form
      + '   [' + e.urteil.quellen.map(q => q.quelle).join(' + ') + ']'
      + (eintrag.zitat ? '   ⛔ ZITAT aus ' + eintrag.id : ''));
    neueBelege.push(e);
  } else {
    console.log('  ⛔ ' + w.padEnd(14) + e.grund);
    for (const g of e.gruppen)
      console.log('       ' + g.form + '  (' + g.quellen.map(q => q.quelle).join(', ') + ')');
  }
  if (e.fehler.length) console.log('       ⚠️ ' + e.fehler.join(' · '));
}

const zitate = neueBelege.filter(e => e.fundstelle.zitat);
if (zitate.length){
  console.log('');
  console.log('  ⛔⛔ ' + zitate.length + ' der Belege betreffen ein ZITAT aus dem Madina-Buch:');
  for (const e of zitate)
    console.log('       ' + e.wort + ' in ' + e.fundstelle.id
      + ' — Beleg wird abgelegt, der SATZ bleibt wie gedruckt.');
}

console.log('');
if (!neueBelege.length){
  console.log('Nichts zu belegen — alle offenen Woerter brauchen Elias.');
  process.exit(0);
}

if (NUR_ZEIGEN){
  console.log(neueBelege.length + ' Beleg(e) waeren eintragbar. --zeigen: nichts geschrieben.');
  process.exit(0);
}

/* ---- Schreiben: nur ERGÄNZEN, nie überschreiben ---- */
const datei = JSON.parse(fs.readFileSync(BELEGE, 'utf8'));
const heute = new Date().toISOString().slice(0, 10);
let neu = 0, schon = 0;
for (const e of neueBelege){
  const schluessel = e.urteil.form;
  if (datei.belege[schluessel]){ schon++; continue; }
  datei.belege[schluessel] = {
    bedeutung: '(nachgeschlagen, Bedeutung nachtragen)',
    quellen: e.urteil.quellen.map(q => {
      const o = { quelle: q.quelle, form: q.form };
      if (q.url) o.url = q.url;
      if (q.hinweis) o.hinweis = q.hinweis;
      return o;
    }),
    am: heute,
    nachgeschlagen_von: 'werkzeuge/fachbegriffe-nachschlagen.mjs',
    /* ⭐ Woher die Frage kam — und die Warnung, wenn es ein Zitat ist. */
    beanstandet_in: (e.fundstelle.feld || '?') + ' von ' + (e.fundstelle.id || '?'),
    /* ⛔ Der Schlüssel steht in Anführungszeichen: ein Emoji ist kein gültiger
       JS-Bezeichner, und `{ ⛔_zitat: … }` ist ein Syntaxfehler. In JSON ist
       er danach trotzdem ein ganz normaler Schlüssel. */
    ...(e.fundstelle.zitat ? { '⛔_zitat':
      'Diese Fundstelle ist ein ZITAT aus dem Madina-Buch (' + e.fundstelle.id + '). '
      + 'Der Beleg sagt, wie das WORT geschrieben wird — nicht, dass der SATZ zu '
      + 'aendern waere. Ein Zitat wird nicht korrigiert; die App soll zeigen, was '
      + 'im Buch steht. Ob die Schreibung dort abweicht, sagt nur die Buchseite.' } : {}),
  };
  neu++;
}
if (!neu){
  console.log(schon + ' Beleg(e) standen schon da — nichts geschrieben.');
  process.exit(0);
}
fs.writeFileSync(BELEGE + '.neu', JSON.stringify(datei, null, 2) + NL, 'utf8');
fs.renameSync(BELEGE + '.neu', BELEGE);
console.log('✔ ' + neu + ' neue(r) Beleg(e) in werkzeuge/fachbegriffe-belege.json'
  + (schon ? ' (' + schon + ' standen schon da)' : '') + '.');
console.log('⚠️ Eingetragen ist damit NICHTS — das macht fachbegriffe-setzen.mjs');
console.log('   mit seinen eigenen sechs Vorabpruefungen.');
