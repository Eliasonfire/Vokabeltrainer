/* regelkategorien-seite.mjs — alle Regeln nach Kategorien, eine Frage je Regel.
 *
 *   node werkzeuge/regelkategorien-seite.mjs
 *
 * Ergebnis: artefakte/regelkategorien.html (fertig zum Veröffentlichen)
 *
 * ================== WOZU ===================================================
 *
 * Elias am 15.09.2026:
 *
 *   „ich glaube es wäre das klügste weil wir jetzt die regeln haben, dass du
 *    das artefakt nochmals in kategorien unterteilst mit den aktuellen regeln
 *    die wir haben und dann kann ich entscheiden ob diese einzelne regel dazu
 *    gehört oder nicht. sollte es regeln geben die du unseren aktuellen regeln
 *    nicht zuordnen kannst dann mach sie in eine kategorie nicht zuordbar oder
 *    so aber eigentlich müssten sie alle zuordbar sein"
 *
 * ⭐ Er hatte recht: gemessen sind **alle 103 zuordbar**, „nicht zuordbar"
 * bleibt leer. Die Kategorie kommt aus `SATZ_THEMEN` in grammar-data.js — das
 * sind dieselben Reiter, die er im Satzmodus sieht. Keine zweite Einteilung
 * erfinden. [[entscheidung_gilt_fuer_das_zweite_werkzeug]]
 *
 * ================== ⛔ EINE FRAGE, NICHT ZWEI =============================
 *
 * Elias am 15.09.2026, und das ist der Grund für den Zuschnitt dieser Seite:
 *
 *   „aber ich frage mich warum ich eine regel für den satz freigeben soll die
 *    ich nicht auf den regeln karten finden kann oder umgekehrt"
 *
 * Gemessen am selben Tag: Regeln-Bereich 93, Satzmodus 93, Abweichung 0.
 * Auf den Karteikarten steht seit dem 26.08.2026 **gar keine** Grammatik mehr
 * (buildSentenceHtml in js/saetze.js). Das Feld `nichtAufKarteikarten` steht
 * noch bei 27 Regeln, wird aber nirgends mehr gelesen.
 *
 * Es gibt also nur EINE Entscheidung: gehört die Regel in die App? Ein „ja"
 * bringt sie an beide Orte, ein „nein" nimmt sie von beiden. Zwei Fragen zu
 * stellen wäre eine Trennung, die es nicht mehr gibt.
 *
 * ================== ⛔ EIGENER SPEICHERSCHLUESSEL =========================
 *
 * 'regelkategorien-v1'. NICHT 'regelpruefung-v1' — dort liegen seine 55
 * Urteile aus dem Durchgang vom August. Zwei Seiten auf einem Schlüssel
 * löschen einander die Antworten, und seinen localStorage kann ich weder
 * lesen noch sichern. [[vier_neue_artefakte]]
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { arabischInSeite, BIDI_CSS } from './arabisch-hervorheben.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ZIEL = path.join(REPO, 'artefakte', 'regelkategorien.html');
const SPEICHER = 'regelkategorien-v1';

const STAND = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

/* ---------- Regeln, Kategorien, Markierungen ---------- */
const ktx = { window: {}, console };
vm.createContext(ktx);
vm.runInContext(fs.readFileSync(path.join(REPO, 'grammar-data.js'), 'utf8')
  + '\nglobalThis.R = GRAMMAR_RULES; globalThis.T = SENTENCE_TAGS; globalThis.TH = SATZ_THEMEN;', ktx);
const REGELN = ktx.R, TAGS = ktx.T, THEMEN = ktx.TH;

/* ---------- ⛔ NUR STELLEN, DIE ER AUCH SIEHT (16.09.2026) ----------

   SENTENCE_TAGS hat 617 Markierungen, aber nur 400 davon liegen auf einem Satz,
   den es wirklich gibt. Der Rest hängt an Madina-1-Vokabeln ohne Beispielsatz
   (113) und an Fachbegriffskarten (35) — beides Stellen, die im Satzmodus nie
   auftauchen.

   ⚠️ Der Unterschied ist nicht klein, und er ändert die REIHENFOLGE. Über alle
   617 gerechnet stünden Nominalsatz, Adjektiv und Iḍāfa oben; über die 400, die
   er sieht, sind es Genitiv, Kasus, اَلْ und Schrift — also genau die vier, die
   ich ihm genannt habe. Eine Zahl, die Unsichtbares mitzählt, hätte ihn hier an
   die falschen vier Kategorien geschickt. [[werkzeug_misst_kleineren_bestand]]

   ⚠️ Die Zahl auf jeder Regelkarte („· n Satzstellen") folgt derselben
   Rechnung — sie soll nicht mehr versprechen, als er zu sehen bekommt.

   ⛔⛔ 17.09.2026: DIE VORAUSSETZUNG OBEN GALT NICHT MEHR. Seit dem 16.09.
   trägt jede Markierung einen Satztext (data/beispielsaetze.js, Fachbegriffe,
   eigene Wörter), und der Satzmodus zeigt mehr als vocab-data.js und das
   Lehrbuch — js/saetze.js alleSaetze() + nichtVorausgeschrieben() und
   js/kern.js istBekannt():
     · die längeren Sätze `satz-lang-…` (immer)
     · die Sätze der Fachbegriffe und eigenen Wörter (chapter 'personal',
       immer bekannt)
     · die Sätze aus data/beispielsaetze.js zu den Buchwörtern der Kapitel,
       die er lernt (saetzeNachtragen in js/buecher.js)
   Gezählt wurden nur 400 von 749 Markierungen. An seinem Gerätestand vom
   16.09. 21:58 gemessen (scratchpad rangfolge-sichtbar.cjs): sichtbar sind
   355 Sätze mit 645 Markierungen, und oben standen Genitiv · Kasus · Schrift
   · Adjektiv, wo es Genitiv · إِضَافَة · Kasus · Adjektiv sein muss —
   إِضَافَة stand auf Platz 7 und hat nach Genitiv die meisten offenen Stellen,
   die er wirklich sieht. [[aufgabenzahl_haengt_am_filter]]

   Der Kapitelstand kommt aus data/lernstand.json (`angabe` = seine eigene
   Angabe, `nichtInArbeit` bleibt draußen), nicht aus seinem Browser. Seine
   einzeln freigeschalteten Wörter kennt das Werkzeug nicht
   [[einzeln_frei_ist_nur_im_browser]] — gemessen ändern sie die obersten fünf
   nicht (mit ihnen 645 Stellen, ohne 602). */
const satzKtx = { window: {}, console: { log(){}, warn(){}, error(){} }, document: { addEventListener(){} } };
vm.createContext(satzKtx);
for (const datei of ['vocab-data.js', 'lehrbuch-saetze.js', 'data/beispielsaetze.js', 'data/fachbegriffe.js']) {
  try { vm.runInContext(fs.readFileSync(path.join(REPO, datei), 'utf8'), satzKtx); }
  catch (e) { console.log('  ⛔ ' + datei + ' nicht lesbar: ' + e.message); process.exit(1); }
}
vm.runInContext('globalThis.S = { VD: VOCAB_DATA, LB: LEHRBUCH_SAETZE, BS: BEISPIELSAETZE, FB: FACHBEGRIFF_VOKABELN };', satzKtx);
const S = satzKtx.S;
const EIGENE = JSON.parse(fs.readFileSync(path.join(REPO, 'data/eigene-woerter.json'), 'utf8')).woerter || [];
const LERNSTAND = JSON.parse(fs.readFileSync(path.join(REPO, 'data/lernstand.json'), 'utf8'));
const ANGABE = LERNSTAND.angabe || {}, NICHT_IN_ARBEIT = LERNSTAND.nichtInArbeit || {};
/* Der Buchabzug darf nicht ins Repo (arabicroots AGB 3.7/9) und liegt nur hier
   auf der Platte. ⛔ Fehlt er für ein Buch, das er lernt, bricht das Werkzeug
   ab: still weitergezählt käme die alte, zu kleine Rangfolge heraus. */
const buchFenster = {};
for (const n of fs.readdirSync(path.join(REPO, 'data')).filter(n => /^vokabeln-.*\.js$/.test(n)))
  new Function('window', fs.readFileSync(path.join(REPO, 'data', n), 'utf8'))(buchFenster);
const BUCH = buchFenster.VOKABELN || {};

const lernIds = new Set(S.VD.map(w => String(w.id)));
const ECHTE_SAETZE = new Set();
S.VD.filter(w => w.sentAr).forEach(w => ECHTE_SAETZE.add(String(w.id)));
S.LB.forEach(s => ECHTE_SAETZE.add(String(s.id)));
Object.keys(S.BS).filter(id => id.startsWith('satz-lang-') && S.BS[id] && S.BS[id].sentAr)
  .forEach(id => ECHTE_SAETZE.add(id));
S.FB.concat(EIGENE).filter(w => w && w.sentAr).forEach(w => ECHTE_SAETZE.add(String(w.id)));
let buchSaetze = 0;
for (const [slug, bis] of Object.entries(ANGABE)) {
  if (NICHT_IN_ARBEIT[slug]) continue;
  if (!BUCH[slug]) {
    console.log('  ⛔ data/vokabeln-' + slug + '.js fehlt — ohne den Buchabzug fehlen seine Buchsätze in der Rangfolge.');
    process.exit(1);
  }
  for (const w of BUCH[slug]) {
    const id = String(w.id);
    if (lernIds.has(id) || ECHTE_SAETZE.has(id) || !(Number(w.chapter) <= Number(bis))) continue;
    if (S.BS[id] && S.BS[id].sentAr) { ECHTE_SAETZE.add(id); buchSaetze++; }
  }
}
if (!ECHTE_SAETZE.size) {
  console.log('  ⛔ Keine Sätze gefunden — VOCAB_DATA/LEHRBUCH_SAETZE leer?');
  process.exit(1);
}

/* ⛔ Nicht gezählt werden darf nur ein Buchwort außerhalb seines Fensters.
   Jede andere Markierung, die hier herausfiele, gehört zu einer Satzquelle,
   die dieses Werkzeug nicht kennt — genau so ist die Rangfolge vom 16.09.
   still falsch geworden (neue Quellen, alte Zählung). Dann lieber abbrechen. */
const buchIds = new Set(Object.values(BUCH).flat().map(w => String(w.id)));
const marken = {};
const fremd = [];
for (const [satzId, liste] of Object.entries(TAGS)) {
  if (!liste || !liste.length) continue;
  if (!ECHTE_SAETZE.has(satzId)) {
    if (!buchIds.has(satzId) || lernIds.has(satzId)) fremd.push(satzId);
    continue;
  }
  for (const t of liste) marken[t.ruleId] = (marken[t.ruleId] || 0) + 1;
}
if (fremd.length) {
  console.log('  ⛔ ' + fremd.length + ' markierte Sätze aus keiner bekannten Quelle (z. B. ' + fremd.slice(0, 5).join(', ')
    + ') — erst klären, ob er sie sieht, sonst stimmt die Rangfolge nicht.');
  process.exit(1);
}

/* Ein Beispielsatz je Regel — die Stelle, an der er die Regel wirklich sieht. */
const beispiel = {};
for (const [satzId, liste] of Object.entries(TAGS))
  for (const t of liste) if (!beispiel[t.ruleId]) beispiel[t.ruleId] = t.matchText;

/* ---------- zuordnen ---------- */
const mitMuster = THEMEN.filter(t => t.muster);
const zuKategorie = new Map();
for (const r of REGELN) {
  const treffer = mitMuster.filter(t => t.muster.test(r.id));
  zuKategorie.set(r.id, treffer);
}
const roheGruppen = new Map(mitMuster.map(t => [t.id, { name: t.name, regeln: [] }]));
roheGruppen.set('__ohne__', { name: 'Nicht zuordbar', regeln: [] });
for (const r of REGELN) {
  const t = zuKategorie.get(r.id);
  roheGruppen.get(t.length ? t[0].id : '__ohne__').regeln.push(r);
}

/* ---------- ⭐⭐ DIE WIRKSAMSTEN ZUERST (16.09.2026) ----------

   Elias: „mach sie ganz nach oben und hebe sie hervor".

   Gemeint waren die vier Kategorien, die ich ihm genannt hatte — Genitiv,
   Kasus, اَلْ und Schrift. ⛔ Sie stehen hier trotzdem NICHT als Liste.
   Eine feste Auswahl von vier Namen wäre in dem Moment falsch, in dem er drei
   davon erledigt hat: die Seite führte ihn dann weiter zu Kategorien, in denen
   nichts mehr offen ist, und die nächstwichtige stünde unten.
   [[allgemeine_regel_statt_listeneintrag]]

   Gerechnet wird stattdessen, was die Auswahl damals BEGRÜNDET hat: wie viele
   Satzstellen an Regeln hängen, die er noch nie beurteilt hat. Nach diesem Maß
   sortiert, stehen heute genau seine vier oben — und morgen die, die dann
   oben stehen müssen. [[regel_gilt_nur_mit_begruendung]]

   ⚠️ „Nie beurteilt" heißt: kein `satzmodusUrteil`. Das Feld trägt den
   Zeitpunkt seines letzten Exports; 34 der 103 Regeln haben es.
   ⚠️ Der Stand kommt aus grammar-data.js, nicht aus seinem Browser. Was er auf
   der Seite schon angetippt, aber noch nicht geschickt hat, kann sie hier
   nicht wissen. [[einzeln_frei_ist_nur_im_browser]] */
const VORRANG_ANZAHL = 4;

for (const g of roheGruppen.values()) {
  g.offen = g.regeln.filter(r => !r.satzmodusUrteil);
  g.offeneStellen = g.offen.reduce((s, r) => s + (marken[r.id] || 0), 0);
}

/* Sortiert wird eine KOPIE der Reihenfolge, die Zuordnung oben bleibt
   unberührt — bei Regeln, die auf zwei Muster passen, entscheidet dort die
   Reihenfolge in SATZ_THEMEN, welche Kategorie gewinnt.
   [[zweiter_aufruf_ueberschreibt_still]] */
const sortiert = [...roheGruppen.entries()]
  .filter(([, g]) => g.regeln.length)
  .sort((a, b) => b[1].offeneStellen - a[1].offeneStellen);

/* Hervorgehoben wird nur, was auch wirklich offen ist. Ein Rahmen um eine
   fertige Kategorie wäre eine Auszeichnung ohne Aufgabe. */
const vorrangIds = new Set(sortiert.filter(([, g]) => g.offen.length)
  .slice(0, VORRANG_ANZAHL).map(([id]) => id));
const gruppen = new Map(sortiert);
const vorrangListe = sortiert.filter(([id]) => vorrangIds.has(id));
const vorrangRegeln = vorrangListe.reduce((s, [, g]) => s + g.offen.length, 0);
const vorrangStellen = vorrangListe.reduce((s, [, g]) => s + g.offeneStellen, 0);
const offenGesamt = sortiert.reduce((s, [, g]) => s + g.offen.length, 0);
const stellenGesamt = sortiert.reduce((s, [, g]) => s + g.offeneStellen, 0);

const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const STERNCHEN = new RegExp('\\*\\*([^*]+)\\*\\*', 'g');
const fett = s => String(s).replace(STERNCHEN, '<b>$1</b>');

/* Erster Satz als Kern, Rest hinter „ausführlich" — sonst sind 103 Regeln
   eine Textwand. Dasselbe Verfahren wie im Regel-Pop-up der App. */
function kernUndRest(t) {
  const s = String(t || '');
  const m = /^(.{40,320}?[.!?])\s/.exec(s);
  return m ? [m[1], s.slice(m[1].length).trim()] : [s, ''];
}

/* ---------- Seite ---------- */
let bloecke = '', gesamt = 0;
for (const [id, g] of gruppen) {
  if (!g.regeln.length && id === '__ohne__') continue;   /* leere „Nicht zuordbar" weglassen */
  if (!g.regeln.length) continue;

  let karten = '';
  for (const r of g.regeln) {
    gesamt++;
    const [kern, rest] = kernUndRest(r.shortExplanation);
    const mehrfach = zuKategorie.get(r.id);
    const auchIn = mehrfach.length > 1
      ? '<span class="auch">auch: ' + esc(mehrfach.slice(1).map(x => x.name).join(', ')) + '</span>' : '';
    const n = marken[r.id] || 0;
    const stand = r.ausgeblendet
      ? '<span class="lage aus">zurzeit AUS der App</span>'
      : '<span class="lage an">in der App · ' + n + ' Satzstelle' + (n === 1 ? '' : 'n') + '</span>';
    const bsp = beispiel[r.id]
      ? '<div class="bsp"><span class="ar">' + esc(beispiel[r.id]) + '</span></div>' : '';

    karten += `
    <div class="regel" data-id="${esc(r.id)}">
      <div class="kopf">
        <div class="titel"><span class="ar">${esc(r.name)}</span></div>
        <div class="meta">${stand}${auchIn}</div>
      </div>
      <div class="text">${fett(esc(kern))}</div>
      ${rest ? `<details><summary>ausführlich</summary><div class="mehr">${fett(esc(rest))}</div></details>` : ''}
      ${bsp}
      <div class="wahl">
        <button data-w="ja">gehört rein</button>
        <button data-w="nein">raus</button>
        <button data-w="spaeter">später</button>
        <button data-w="kategorie" class="neben">falsche Kategorie</button>
      </div>
    </div>`;
  }

  const vorn = vorrangIds.has(id);
  bloecke += `
  <section class="block${vorn ? ' vorrang' : ''}" data-kat="${esc(id)}">
    <h2>${vorn ? '<span class="marke">zuerst</span> ' : ''}${esc(g.name)} <span class="zahl"><span data-fertig>0</span>/${g.regeln.length}</span></h2>
    ${vorn ? `<p class="warum">${g.offen.length} noch nie beurteilt · sie hängen an ${g.offeneStellen} Satzstellen</p>` : ''}
    <div class="sammel">
      <button data-alle="ja">alle „gehört rein"</button>
      <button data-alle="spaeter">alle „später"</button>
      <button data-alle="leer">zurücksetzen</button>
    </div>
    ${karten}
  </section>`;
}

const html = `<title>Regeln nach Kategorien</title>
<style>
${BIDI_CSS}
:root{
  --bg:#000; --karte:#0d0f12; --rand:#1e2228; --text:#e9edf2; --leise:#8b95a3;
  --an:#4ade80; --aus:#f87171; --ja:#22c55e; --nein:#ef4444; --spaeter:#eab308; --kat:#60a5fa;
  --sp:16px;
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);
  font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;
  padding-block:var(--sp);padding-left:var(--sp);padding-right:var(--sp)}
.huelle{max-width:780px;margin:0 auto}
h1{font-size:22px;margin:0 0 6px;letter-spacing:-.2px}
.unter{color:var(--leise);font-size:14px;margin:0 0 20px}
.balken{position:sticky;top:0;z-index:5;background:rgba(0,0,0,.94);
  backdrop-filter:blur(8px);padding:10px 0 12px;margin-bottom:8px;border-bottom:1px solid var(--rand)}
.fortschritt{height:5px;background:var(--rand);border-radius:3px;overflow:hidden}
.fortschritt>i{display:block;height:100%;width:0;background:var(--an);transition:width .2s}
.zaehler{font-size:13px;color:var(--leise);margin-top:7px;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}
h2{font-size:17px;margin:26px 0 4px;display:flex;align-items:baseline;gap:9px;flex-wrap:wrap}
.zahl{font-size:13px;color:var(--leise);font-variant-numeric:tabular-nums}
/* ---------- Die vier, die zuerst drankommen (Elias, 16.09.2026) ----------
   „mach sie ganz nach oben und hebe sie hervor". Der Rahmen sitzt links, nicht
   rundherum: ein Kasten um vier von vierzehn Abschnitten trennt sie vom Rest
   der Seite, ein Strich führt das Auge daran entlang. */
.block.vorrang{border-left:3px solid var(--an);padding-left:14px;margin-left:-17px}
.block.vorrang h2{margin-top:22px}
.marke{background:var(--an);color:#04121f;font-size:11.5px;font-weight:700;
  letter-spacing:.4px;text-transform:uppercase;border-radius:5px;padding:3px 7px;
  align-self:center}
.warum{color:var(--leise);font-size:13px;margin:0 0 10px;font-variant-numeric:tabular-nums}
.auftrag{border:1px solid var(--an);background:rgba(74,222,128,.07);
  border-radius:10px;padding:13px 15px;margin:0 0 22px}
.auftrag b{color:var(--an)}
.auftrag p{margin:0}
.auftrag p + p{margin-top:7px}
.auftrag .klein{color:var(--leise);font-size:13px}
.sammel{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 12px}
.sammel button{background:transparent;color:var(--leise);border:1px solid var(--rand);
  border-radius:7px;padding:5px 10px;font-size:12.5px;cursor:pointer}
.sammel button:hover{color:var(--text);border-color:#2c323a}
.regel{background:var(--karte);border:1px solid var(--rand);border-radius:11px;
  padding:13px 14px;margin-bottom:9px;transition:border-color .15s}
.regel[data-w="ja"]{border-color:var(--ja)}
.regel[data-w="nein"]{border-color:var(--nein);opacity:.62}
.regel[data-w="spaeter"]{border-color:var(--spaeter)}
.regel[data-w="kategorie"]{border-color:var(--kat)}
.kopf{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;margin-bottom:7px}
.titel{font-size:17px;font-weight:600}
.meta{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.lage{font-size:11.5px;padding:2px 7px;border-radius:5px;white-space:nowrap}
.lage.an{color:var(--an);background:rgba(74,222,128,.1)}
.lage.aus{color:var(--aus);background:rgba(248,113,113,.1)}
.auch{font-size:11.5px;color:var(--leise)}
.text{color:#cbd3dc;font-size:14px}
details{margin-top:7px}
summary{cursor:pointer;color:var(--leise);font-size:12.5px}
.mehr{color:#b6bfca;font-size:13.5px;margin-top:6px}
.bsp{margin-top:9px;padding:7px 10px;background:#000;border:1px solid var(--rand);border-radius:7px}
.bsp .ar{font-size:18px}
.wahl{display:flex;gap:7px;margin-top:11px;flex-wrap:wrap}
.wahl button{flex:1 1 0;min-width:88px;background:#13161b;color:var(--text);
  border:1px solid var(--rand);border-radius:7px;padding:8px 6px;font-size:13px;cursor:pointer}
.wahl button:hover{border-color:#333a43}
.wahl button.neben{flex:0 0 auto;color:var(--leise);font-size:12px}
.regel[data-w="ja"] button[data-w="ja"]{background:var(--ja);color:#04120a;border-color:var(--ja);font-weight:600}
.regel[data-w="nein"] button[data-w="nein"]{background:var(--nein);color:#1a0505;border-color:var(--nein);font-weight:600}
.regel[data-w="spaeter"] button[data-w="spaeter"]{background:var(--spaeter);color:#181200;border-color:var(--spaeter);font-weight:600}
.regel[data-w="kategorie"] button[data-w="kategorie"]{background:var(--kat);color:#04121f;border-color:var(--kat);font-weight:600}
.ausgabe{margin-top:30px;border-top:1px solid var(--rand);padding-top:18px}
textarea{width:100%;min-height:150px;background:#07090b;color:#cbd3dc;border:1px solid var(--rand);
  border-radius:9px;padding:11px;font:12.5px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;resize:vertical}
#kopieren{margin-top:9px;background:var(--an);color:#04120a;border:none;border-radius:8px;
  padding:11px 18px;font-size:14.5px;font-weight:600;cursor:pointer}
#kopieren:disabled{background:var(--rand);color:var(--leise);cursor:default}
.hinweis{color:var(--leise);font-size:13px;margin:10px 0 0}
</style>

<div class="huelle">
<h1>Regeln nach Kategorien</h1>
<p class="unter">${gesamt} Regeln in ${[...gruppen.values()].filter(g => g.regeln.length).length} Kategorien · Stand ${STAND}</p>

<div class="balken">
  <div class="fortschritt"><i id="bal"></i></div>
  <div class="zaehler">
    <span><b id="fertig">0</b> von ${gesamt} entschieden</span>
    <span id="verteilung"></span>
  </div>
</div>

<p class="hinweis">Eine Frage je Regel: <b>gehört sie in die App?</b> Ein „gehört rein“ bringt
sie in den Satzmodus <i>und</i> in den Regeln-Bereich — das sind seit dem 26.08. nicht mehr
zwei getrennte Orte. Die Kategorien sind dieselben Reiter wie im Satzmodus.</p>

<div class="auftrag">
  <p><b>Die ${vorrangListe.length} oben zuerst</b> — ${vorrangListe.map(([, g]) => esc(g.name)).join(' · ')}</p>
  <p>Das sind <b>${vorrangRegeln} von ${offenGesamt}</b> offenen Regeln und erledigt
  <b>${stellenGesamt ? Math.round(100 * vorrangStellen / stellenGesamt) : 0} %</b> der Satzstellen,
  an denen noch nie eine Entscheidung hing (${vorrangStellen} von ${stellenGesamt}).</p>
  <p class="klein">Danach kannst du aufhören — der Rest sind kleine Kategorien, bei denen
  eine Entscheidung ein oder zwei Stellen betrifft. Die Reihenfolge rechnet sich bei jedem
  Neubau der Seite neu: was du erledigt hast, rutscht nach unten.</p>
</div>

${bloecke}

<div class="ausgabe">
  <h2>Fertig? Text kopieren und mir schicken</h2>
  <textarea id="text" readonly></textarea>
  <button id="kopieren" disabled>Kopieren</button>
</div>
</div>

<script>
(function(){
  var SPEICHER = ${JSON.stringify(SPEICHER)};
  var stand = {};
  var SPEICHER_GEHT = true;

  /* ⛔ EINE ECHTE PROBE, nicht nur ein try/catch ums Schreiben.
     werkzeuge/pruefe-seitenspeicher.mjs hat diese Seite beim ersten Bau rot
     gemeldet: sie speicherte stumm. Ist localStorage gesperrt (privates
     Fenster, geloeschte Seitendaten), verschwinden seine Antworten lautlos
     und er faengt beim naechsten Oeffnen von vorn an — nach 103 Regeln.
     ⛔ Die Warnung muss AUCH BEIM START kommen: war der Speicher von Anfang
     an zu, wird sichern() nie aufgerufen und die Warnung kaeme nie.
     [[ausfall_ist_unsichtbar_gebaut]] */
  try {
    localStorage.setItem(SPEICHER + '__probe', '1');
    localStorage.removeItem(SPEICHER + '__probe');
  } catch(e) { SPEICHER_GEHT = false; }

  try { stand = JSON.parse(localStorage.getItem(SPEICHER) || '{}') || {}; } catch(e) { stand = {}; }

  function warneSpeicher(){
    if (SPEICHER_GEHT || document.getElementById('speicherwarnung')) return;
    var d = document.createElement('div');
    d.id = 'speicherwarnung';
    d.style.cssText = 'background:#210d0c;border:1px solid #5a1f1c;border-left:3px solid #c4483f;'
      + 'border-radius:9px;padding:11px 13px;margin:12px 0;font-size:13.5px;color:#e9c9c5';
    d.innerHTML = '<b style="color:#e0776d">Dieser Browser behält hier nichts.</b> '
      + 'Deine Entscheidungen stehen nur im Arbeitsspeicher — beim Neuladen oder '
      + 'Schließen sind sie weg. Geh die Regeln deshalb in einem Zug durch und '
      + 'kopier den Text unten, bevor du die Seite verlässt.';
    var b = document.querySelector('.balken');
    b.parentNode.insertBefore(d, b.nextSibling);
  }

  function sichern(){
    if (!SPEICHER_GEHT) return;
    try { localStorage.setItem(SPEICHER, JSON.stringify(stand)); }
    catch(e) { SPEICHER_GEHT = false; warneSpeicher(); }
  }

  var regeln = Array.prototype.slice.call(document.querySelectorAll('.regel'));

  function malen(el){
    var w = stand[el.getAttribute('data-id')];
    if (w) el.setAttribute('data-w', w); else el.removeAttribute('data-w');
  }

  function zaehlen(){
    var n = 0, ja = 0, nein = 0, sp = 0, kat = 0;
    regeln.forEach(function(el){
      var w = stand[el.getAttribute('data-id')];
      if (!w) return;
      n++;
      if (w === 'ja') ja++; else if (w === 'nein') nein++;
      else if (w === 'spaeter') sp++; else if (w === 'kategorie') kat++;
    });
    document.getElementById('fertig').textContent = n;
    document.getElementById('bal').style.width = (regeln.length ? n / regeln.length * 100 : 0) + '%';
    var teile = [];
    if (ja) teile.push(ja + '× rein');
    if (nein) teile.push(nein + '× raus');
    if (sp) teile.push(sp + '× später');
    if (kat) teile.push(kat + '× Kategorie');
    document.getElementById('verteilung').textContent = teile.join(' · ');
    document.getElementById('kopieren').disabled = n === 0;

    Array.prototype.forEach.call(document.querySelectorAll('.block'), function(b){
      var m = 0, ws = b.querySelectorAll('.regel');
      Array.prototype.forEach.call(ws, function(el){ if (stand[el.getAttribute('data-id')]) m++; });
      b.querySelector('[data-fertig]').textContent = m;
    });
    ausgabe();
  }

  /* ⛔ DAS FORMAT GEHOERT werkzeuge/urteile-uebernehmen.mjs, nicht mir.
     Es liest Bloecke „DRIN (n):" / „AENDERN (n):" / „RAUS (n):" mit
     eingerueckten Regel-Ids darunter, optional „— Notiz". Ein eigenes Format
     haette ein zweites Werkzeug noetig gemacht — und die Seite waere bis dahin
     eine Einbahnstrasse gewesen. [[werkzeug_ohne_aufrufer]]
     „spaeter" kennt das Werkzeug nicht; es steht deshalb UNTER der Trennlinie,
     die dort einen Block beendet, und wird dadurch nicht verarbeitet. */
  function ausgabe(){
    var drin = [], raus = [], aendern = [], spaeter = [], katVon = {};
    Array.prototype.forEach.call(document.querySelectorAll('.block'), function(b){
      var name = b.querySelector('h2').childNodes[0].textContent.trim();
      Array.prototype.forEach.call(b.querySelectorAll('.regel'), function(el){
        var id = el.getAttribute('data-id'), w = stand[id];
        if (!w) return;
        katVon[id] = name;
        if (w === 'ja') drin.push(id);
        else if (w === 'nein') raus.push(id);
        else if (w === 'kategorie') aendern.push(id);
        else if (w === 'spaeter') spaeter.push(id);
      });
    });
    var z = [];
    function block(titel, liste, notiz){
      if (!liste.length) return;
      z.push(titel + ' (' + liste.length + '):');
      liste.forEach(function(id){
        z.push('  ' + id + (notiz ? '  — ' + notiz + ': ' + katVon[id] : ''));
      });
      z.push('');
    }
    block('DRIN', drin);
    block('RAUS', raus);
    block('AENDERN', aendern, 'falsche Kategorie, steht zurzeit unter');
    if (spaeter.length){
      z.push('---');
      z.push('SPAETER (' + spaeter.length + ') — nicht eintragen, nur zur Kenntnis:');
      spaeter.forEach(function(id){ z.push('  ' + id + '  (' + katVon[id] + ')'); });
    }
    document.getElementById('text').value = z.join('\\n');
  }

  regeln.forEach(function(el){
    malen(el);
    Array.prototype.forEach.call(el.querySelectorAll('.wahl button'), function(b){
      b.addEventListener('click', function(){
        var id = el.getAttribute('data-id'), w = b.getAttribute('data-w');
        if (stand[id] === w) delete stand[id]; else stand[id] = w;
        malen(el); sichern(); zaehlen();
      });
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('.sammel button'), function(b){
    b.addEventListener('click', function(){
      var w = b.getAttribute('data-alle');
      var block = b.closest('.block');
      Array.prototype.forEach.call(block.querySelectorAll('.regel'), function(el){
        var id = el.getAttribute('data-id');
        if (w === 'leer') delete stand[id]; else stand[id] = w;
        malen(el);
      });
      sichern(); zaehlen();
    });
  });

  document.getElementById('kopieren').addEventListener('click', function(){
    var t = document.getElementById('text');
    t.removeAttribute('readonly'); t.select();
    try { document.execCommand('copy'); } catch(e){}
    t.setAttribute('readonly', 'readonly');
    var b = document.getElementById('kopieren'), alt = b.textContent;
    b.textContent = 'Kopiert ✓';
    setTimeout(function(){ b.textContent = alt; }, 1400);
  });

  warneSpeicher();   /* ⛔ beim START, nicht erst beim ersten Schreibversuch */
  zaehlen();
})();
</script>
`;

fs.mkdirSync(path.dirname(ZIEL), { recursive: true });
fs.writeFileSync(ZIEL + '.neu', arabischInSeite(html), 'utf8');
fs.renameSync(ZIEL + '.neu', ZIEL);

console.log('Seite gebaut: ' + path.relative(REPO, ZIEL));
console.log('  gezählt über ' + ECHTE_SAETZE.size + ' Sätze, die er sieht (davon ' + buchSaetze + ' Buchsätze bis '
  + (Object.entries(ANGABE).filter(([b]) => !NICHT_IN_ARBEIT[b]).map(([b, k]) => b + ' K' + k).join(', ') || '—') + ') · '
  + Object.values(marken).reduce((a, n) => a + n, 0) + ' Satzstellen');
console.log('  zuerst: ' + vorrangListe.map(([, g]) => g.name + ' (' + g.offeneStellen + ')').join(' · '));
console.log('  ' + gesamt + ' Regeln in ' + [...gruppen.values()].filter(g => g.regeln.length).length + ' Kategorien');
for (const [, g] of gruppen) if (g.regeln.length)
  console.log('    ' + String(g.regeln.length).padStart(3) + '  ' + g.name);
console.log('');
console.log('  ⛔ Speicherschlüssel: ' + SPEICHER + '  (NICHT regelpruefung-v1 — dort liegen seine 55 Urteile)');
console.log('  ⚠️ Veröffentlichen kann die Routine nicht selbst — das braucht eine Sitzung.');
