/* wortmarke-seite.mjs -- baut das Artefakt, auf dem Elias ueber die Wortmarke
 * im Kopf der App entscheidet.
 *
 * Aufruf:  node werkzeuge/wortmarke-seite.mjs
 * Ergebnis: wortmarke-entwuerfe.html im Projektordner (nicht ausgeliefert).
 *
 * WOZU
 *
 * Elias am 19.08.2026: „mach erstmal vorschlaege was stattdessen dahin kann.
 * das ist ja wie ein logo, wie der app name. das was wir jetzt haben ist auch
 * gut aber ich weiss nicht. aber mach auch neue geruester fuer das was wir
 * jetzt schon haben."
 *
 * Also ZWEI Gruppen, nicht eine:
 *   A) neue Fassungen von طالب العلم — dasselbe Wort, andere Gestalt
 *   B) echte Alternativen — ein anderer Name
 *
 * ⛔ NICHT EINBAUEN. Nur vorlegen; er waehlt.
 *
 * ⭐ DER TECHNISCHE KERN, und er bestimmt den ganzen Aufbau
 *
 * Die heutige Wortmarke ist ein einziger SVG-PFAD (kein Text). Sie sieht auf
 * jedem Geraet gleich aus. Ein Entwurf aus TEXT dagegen haengt davon ab,
 * welche arabische Schrift auf dem Geraet liegt.
 *
 * Im Pruefbrowser am 19.08.2026 nachgemessen — nicht ueber
 * `document.fonts.check()`, das meldete ALLE elf Kandidaten als vorhanden,
 * auch Amiri und Scheherazade, die es dort sicher nicht gibt. Ehrlich ist nur
 * die Breitenmessung gegen den monospace-Fallback (233x102 px bei 64px):
 *
 *     Segoe UI   301x102   <- vorhanden
 *     Tahoma     291x102   <- vorhanden
 *     alle anderen 233x102 <- fallen auf den Fallback zurueck, existieren nicht
 *
 * Daraus folgt der Aufbau:
 *   - Gruppe A benutzt den ECHTEN Pfad aus wortmarke.svg und veraendert nur
 *     Farbe, Anordnung und Umfeld. Was Elias dort sieht, sieht er auf jedem
 *     Geraet genauso.
 *   - Gruppe B muss Text benutzen (es sind neue Woerter, fuer die es keinen
 *     Pfad gibt) — und sagt das auf der Seite ausdruecklich dazu.
 *
 * ⛔ E.1: KEINE UNBELEGTE HARAKA. Jedes Wort in Gruppe B steht in Elias'
 * eigenem Vokabelbestand; die Vokalisierung ist von dort uebernommen, nicht
 * von mir gesetzt. Nachgeschlagen mit NFC auf beiden Seiten — ohne das
 * scheitert der Vergleich lautlos an der Reihenfolge der Diakritika.
 *
 * ⛔ EIGENER SPEICHERSCHLUESSEL `wortmarke-v1`. Vier Artefakte liegen schon im
 * selben localStorage: regelpruefung-v1, satzmodus-auswahl-v1,
 * regelkandidaten-v1, verschmelzung-v1.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const W = path.join(HIER, '..') + path.sep;

/* Den echten Pfad aus der ausgelieferten Wortmarke holen — nicht abschreiben.
   Aendert sich die Marke, aendern sich die Entwuerfe mit. */
const SVG = fs.readFileSync(W + 'wortmarke.svg', 'utf8');
const PFAD = (SVG.match(/<path[^>]*\sd="([^"]+)"/) || [])[1];
const GRUPPE = (SVG.match(/<g\s+fill="[^"]*"\s+transform="([^"]+)"/) || [])[1];
if (!PFAD || !GRUPPE) {
  console.error('⛔ wortmarke.svg hat nicht den erwarteten Aufbau (ein <g transform> mit einem <path d>).');
  console.error('   Ohne beides kann Gruppe A nicht aus dem echten Pfad gebaut werden.');
  process.exit(1);
}

/* Gruppe A: derselbe Pfad, andere Gestalt. `fuellung` ist entweder eine Farbe
   oder ein Verweis auf einen Verlauf, den `defs` unten mitliefert. */
/* ⛔ `verlauf: true` statt eines gemeinsamen `url(#v-ist)`. Beim ersten Bau
   war der Verlauf NUR in der ersten Karte definiert und wurde von dreien
   benutzt. Das funktioniert in SVG zufaellig (IDs gelten dokumentweit), aber
   es ist still zerbrechlich: faellt die erste Karte weg oder wird sie
   umsortiert, verlieren die anderen ihre Fuellung — und `getComputedStyle`
   meldet weiterhin brav `url("#v-ist")`, weil es nur den Verweis kennt und
   nicht, ob er ins Leere zeigt. Jetzt traegt jede Karte ihren eigenen
   Verlauf mit eigener ID. */
const FASSUNGEN = [
  {
    id: 'a-ist', titel: 'So sieht es heute aus', ist: true,
    verlauf: true,
    unterzeile: 'VOKABELTRAINER', unterStil: 'weit',
    was: 'Roter Verlauf von links oben nach rechts unten, darunter klein und '
       + 'gesperrt „VOKABELTRAINER". 2 rem hoch im Kopf.'
  },
  {
    id: 'a-ruhig', titel: 'Ruhiger — eine Farbe statt Verlauf',
    fuellung: '#ff2d55',
    unterzeile: 'VOKABELTRAINER', unterStil: 'weit',
    was: 'Derselbe Schriftzug, aber ohne Verlauf. Auf OLED-Schwarz wirkt eine '
       + 'flache Farbe oft klarer — der Verlauf macht die dünnen Striche oben '
       + 'links dunkler als unten rechts.'
  },
  {
    id: 'a-hell', titel: 'Weiß, Rot nur als Akzent',
    fuellung: '#f2f2f3',
    unterzeile: 'VOKABELTRAINER', unterStil: 'rot',
    was: 'Der Name in Weiß, das Rot wandert in die Unterzeile. Der Schriftzug '
       + 'tritt zurück, das Rot bleibt als Erkennungsfarbe der App erhalten.'
  },
  {
    id: 'a-ohne', titel: 'Ohne Unterzeile',
    verlauf: true,
    unterzeile: null,
    was: 'Nur der arabische Name. „Vokabeltrainer" steht ohnehin im '
       + 'Startbildschirm-Namen und im Browsertab — im Kopf ist es womöglich '
       + 'doppelt.'
  },
  {
    id: 'a-deutsch', titel: 'Deutsche Bedeutung statt Gattung',
    verlauf: true,
    unterzeile: 'STUDENT DES WISSENS', unterStil: 'zart',
    was: 'Statt zu sagen, WAS die App ist, sagt die Unterzeile, was der Name '
       + 'BEDEUTET. Für jemanden, der Arabisch lernt, ist das die nützlichere '
       + 'Information.'
  },
];

/* Gruppe B: echte Alternativen. `belegIn` nennt, wo das Wort in seinem
   Bestand steht — ohne diesen Nachweis kommt kein Wort auf die Seite. */
const ALTERNATIVEN = [
  {
    id: 'b-miftah', wort: 'مِفْتَاح', lat: 'miftāḥ', de: 'Schlüssel',
    belegIn: 'vocab-data.js und madina-1, dort als مِفْتَاحٌ',
    warum: 'Kurz, ein einziges Wort, und es sagt, wozu die App da ist — '
         + 'Grammatik als Schlüssel zum Text. Du hast das Wort schon gelernt.'
  },
  {
    id: 'b-kalima', wort: 'كَلِمَة', lat: 'kalima', de: 'Wort',
    belegIn: 'madina-1 und der Quran-Liste, dort als كَلِمَةٌ',
    warum: 'Das schlichteste, was ein Vokabeltrainer heißen kann. Sehr kurz, '
         + 'sehr breit — sagt aber nichts über die Grammatik.'
  },
  {
    id: 'b-lugha', wort: 'لُغَة', lat: 'lugha', de: 'Sprache',
    belegIn: 'vocab-data.js und madina-1, dort als لُغَةٌ',
    warum: 'Weiter gefasst als „Wort". Klingt eher nach Sprachkurs als nach '
         + 'Karteikarten.'
  },
  {
    id: 'b-nur', wort: 'نُور', lat: 'nūr', de: 'Licht',
    belegIn: 'madina-3 und der Quran-Liste, dort als نُورٌ',
    warum: 'Kein Sachbegriff, sondern ein Bild. Passt zum Gehirn-Icon, ist '
         + 'aber weit weg vom Vokabellernen — mehr Stimmung als Aussage.'
  },
  {
    id: 'b-talib', wort: 'طَالِب', lat: 'ṭālib', de: 'Student, Suchender',
    belegIn: 'vocab-data.js, madina-1 und bayna-yadayk-3, dort als طَالِبٌ',
    warum: 'Die Hälfte des heutigen Namens. Halb so lang, dieselbe Idee — und '
         + 'du bleibst bei dem, was schon da ist.'
  },
  {
    id: 'b-ilm', wort: 'عِلْم', lat: 'ʿilm', de: 'Wissen, Wissenschaft',
    belegIn: 'madina-2 und madina-3, dort als عِلْمٌ',
    warum: 'Die andere Hälfte. Ein Wort, das jeder Muslim kennt, und kürzer '
         + 'als alles andere hier.'
  },
];

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

/* Die Marke einmal, mit auswechselbarer Fuellung. Der Pfad ist derselbe wie in
   der App — deshalb ist das hier kein Bild von der Marke, sondern die Marke. */
function marke(f) {
  /* Eigene Verlaufs-ID je Karte — siehe die Warnung an FASSUNGEN. */
  const vid = 'v-' + f.id;
  const fuellung = f.verlauf ? 'url(#' + vid + ')' : f.fuellung;
  const defs = f.verlauf
    ? '<defs><linearGradient id="' + vid + '" x1="0" y1="0" x2="1" y2="1">'
      + '<stop offset="0" stop-color="#ff1744"/><stop offset="1" stop-color="#ff7a92"/></linearGradient></defs>'
    : '';
  return '<svg viewBox="0 0 346 152" role="img" aria-label="طالب العلم">'
    + defs
    + '<g fill="' + fuellung + '" transform="' + GRUPPE + '"><path d="' + PFAD + '"/></g>'
    + '</svg>';
}

const fassungenHtml = FASSUNGEN.map((f, i) => `
<article class="karte" data-wahl="${f.id}">
  <header>
    <span class="nr">A${i + 1}</span>
    <h3>${esc(f.titel)}</h3>
    ${f.ist ? '<span class="marke-ist">heute</span>' : ''}
  </header>
  <div class="buehne">
    <div class="kopfzeile">
      <div class="brand">
        ${marke(f)}
        ${f.unterzeile ? '<span class="unter ' + (f.unterStil || '') + '">' + esc(f.unterzeile) + '</span>' : ''}
      </div>
      <span class="streak">🔥 7</span>
    </div>
  </div>
  <p class="was">${esc(f.was)}</p>
  <button class="w" data-w="${f.id}">das gefällt mir</button>
</article>`).join('');

const altHtml = ALTERNATIVEN.map((a, i) => `
<article class="karte" data-wahl="${a.id}">
  <header>
    <span class="nr">B${i + 1}</span>
    <h3 lang="ar">${esc(a.wort)}</h3>
    <span class="lat">${esc(a.lat)} · ${esc(a.de)}</span>
  </header>
  <div class="buehne">
    <div class="kopfzeile">
      <div class="brand">
        <span class="alt-wort" lang="ar">${esc(a.wort)}</span>
        <span class="unter weit">VOKABELTRAINER</span>
      </div>
      <span class="streak">🔥 7</span>
    </div>
  </div>
  <p class="was"><b>Warum:</b> ${esc(a.warum)}</p>
  <p class="beleg">Belegt in ${esc(a.belegIn)}</p>
  <button class="w" data-w="${a.id}">das gefällt mir</button>
</article>`).join('');

const seite = `<!doctype html>
<html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Die Wortmarke im Kopf der App</title>
<style>
:root{
  --bg:#0a0a0b; --karte:#141416; --karte2:#1c1c1f; --rand:#2a2a2e; --rand2:#3a3a40;
  --text:#f2f2f3; --dim:#a8a8ae; --faint:#76767c;
  --rot:#ff2d55; --rot-w:rgba(255,45,85,.12); --gruen:#2fd07a; --gelb:#f5b942; --gelb-w:rgba(245,185,66,.1);
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);
  font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:20px 16px 80px}
.huelle{max-width:960px;margin:0 auto}
h1{font-size:1.5rem;margin:0 0 6px}
h2{font-size:1.15rem;margin:34px 0 4px}
.vorwort{color:var(--dim);font-size:.94rem;margin:0 0 10px}
.vorwort b{color:var(--text)}
.hinweis{background:var(--gelb-w);border:1px solid var(--gelb);border-radius:10px;
  padding:12px 14px;margin:14px 0 8px;font-size:.9rem}
.reihe{display:grid;grid-template-columns:repeat(auto-fill,minmax(288px,1fr));gap:14px;margin-top:14px}
.karte{background:var(--karte);border:1px solid var(--rand);border-radius:14px;padding:14px}
.karte.an{border-color:var(--gruen)}
.karte header{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin-bottom:10px}
.nr{font-size:.7rem;color:var(--faint);font-weight:700;letter-spacing:.08em}
.karte h3{margin:0;font-size:1rem}
.karte h3[lang=ar]{font-size:1.5rem}
.lat{font-size:.8rem;color:var(--faint)}
.marke-ist{font-size:.68rem;background:var(--rot-w);color:var(--rot);border:1px solid var(--rot);
  border-radius:999px;padding:2px 8px;font-weight:700}
/* Die Buehne bildet den echten Kopf der App nach: gleicher Grund, gleiche
   Hoehe (2rem), Streak rechts. Eine Marke allein auf weissem Grund sagt
   nichts darueber, wie sie im Kopf wirkt. */
.buehne{background:#000;border:1px solid var(--rand);border-radius:10px;padding:12px 14px}
.kopfzeile{display:flex;justify-content:space-between;align-items:center;gap:12px}
.brand{display:flex;flex-direction:column;gap:3px;min-width:0}
.brand svg{display:block;height:2rem;width:auto}
.alt-wort{display:block;font-size:1.9rem;line-height:1.15;color:var(--rot);font-weight:700}
.unter{font-size:.62rem;color:var(--dim);font-weight:600}
.unter.weit{letter-spacing:.1em}
.unter.rot{color:var(--rot);letter-spacing:.1em}
.unter.zart{color:var(--faint);letter-spacing:.06em}
.streak{background:var(--karte2);border:1px solid var(--rand);border-radius:999px;
  padding:4px 10px;font-size:.8rem;font-weight:700;flex:0 0 auto}
.was{margin:10px 0 0;color:var(--dim);font-size:.88rem}
.was b{color:var(--text)}
.beleg{margin:5px 0 0;color:var(--faint);font-size:.78rem}
.w{margin-top:10px;background:var(--karte2);border:1px solid var(--rand2);color:var(--dim);
  border-radius:999px;padding:7px 14px;font:inherit;font-size:.83rem;font-weight:600;cursor:pointer}
.w:hover{border-color:var(--faint);color:var(--text)}
.w.an{background:rgba(47,208,122,.12);border-color:var(--gruen);color:var(--gruen)}
.fuss{background:var(--karte);border:1px solid var(--rand);border-radius:14px;padding:16px;margin-top:30px}
.fuss h2{margin:0 0 8px;font-size:1.1rem}
.stand{color:var(--dim);font-size:.9rem;margin:0 0 10px}
#ausgabe{width:100%;height:96px;background:var(--bg);border:1px solid var(--rand);border-radius:8px;
  color:var(--text);padding:10px;font:12px/1.5 ui-monospace,monospace;resize:vertical}
#notiz{width:100%;margin-top:10px;background:var(--karte2);border:1px solid var(--rand);
  border-radius:8px;color:var(--text);padding:9px 11px;font:inherit;font-size:.9rem;resize:vertical}
.knoepfe{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
.kopier{background:var(--rot);border:0;color:#fff;border-radius:999px;padding:9px 16px;font:inherit;font-weight:700;cursor:pointer}
.zuruecksetzen{background:transparent;border:1px solid var(--rand2);color:var(--faint);
  border-radius:999px;padding:9px 16px;font:inherit;cursor:pointer}
</style></head><body><div class="huelle">

<h1>Die Wortmarke im Kopf der App</h1>
<p class="vorwort">Deine Worte vom 19.08.: <i>„mach erstmal vorschläge was
stattdessen dahin kann. das ist ja wie ein logo, wie der app name. das was wir
jetzt haben ist auch gut aber ich weiß nicht. aber mach auch neue gerüste für
das was wir jetzt schon haben."</i></p>
<p class="vorwort">Deshalb <b>zwei Gruppen</b>: erst neue Fassungen von dem,
was schon da ist — dann echte Alternativen. Jede Karte zeigt die Marke im
<b>echten Kopf der App</b>, nicht freistehend: gleicher schwarzer Grund,
gleiche Höhe (2 rem), Streak rechts daneben.</p>
<p class="vorwort">⛔ <b>Nichts ist eingebaut.</b> Die App sieht unverändert aus.</p>

<h2>A — Neue Fassungen von طالب العلم</h2>
<p class="vorwort">Alle fünf benutzen <b>denselben Schriftzug wie heute</b> —
den echten Pfad aus <code>wortmarke.svg</code>, nicht nachgezeichnet. Was du
hier siehst, siehst du auf jedem Gerät genauso.</p>
<div class="reihe">${fassungenHtml}</div>

<h2>B — Echte Alternativen</h2>
<div class="hinweis">⚠️ <b>Diese sechs sind als Text gesetzt, nicht als
Zeichnung</b> — für ein neues Wort gibt es noch keinen Pfad. Das heißt: auf
deinem Handy sieht die Schrift <b>anders aus als hier</b>, weil dein Android
eine andere arabische Schrift mitbringt als mein Prüfbrowser (dort gibt es
nachgemessen nur Segoe UI und Tahoma). Entscheide also nach dem <b>Wort</b>,
nicht nach der Schriftform — die zeichne ich nach, sobald du eines gewählt hast.</div>
<p class="vorwort">⛔ <b>Jedes Wort steht in deinem eigenen Vokabelbestand</b>,
und die Vokalisierung ist von dort übernommen, nicht von mir gesetzt. Die
Marke zeigt sie ohne Tanwīn — so steht ein Name üblicherweise da; die Ḥarakāt
im Wortinneren bleiben unverändert.</p>
<div class="reihe">${altHtml}</div>

<div class="fuss">
  <h2>Und dann schick mir das hier</h2>
  <p class="stand" id="stand">Noch nichts gewählt.</p>
  <textarea id="ausgabe" readonly></textarea>
  <textarea id="notiz" rows="2" placeholder="Notiz (freiwillig) — z.B. „A2, aber die Unterzeile weg&quot;"></textarea>
  <div class="knoepfe">
    <button class="kopier" id="btnKopieren">In die Zwischenablage</button>
    <button class="zuruecksetzen" id="btnZuruecksetzen">Zurücksetzen</button>
  </div>
  <p class="stand" style="margin-top:10px">Deine Wahl liegt nur in diesem
  Browser (<code>wortmarke-v1</code>). Ich kann sie nicht lesen — ohne diesen
  Kasten bliebe sie hier gefangen.</p>
</div>

</div><script>
/* ⛔ Eigener Schluessel. regelpruefung-v1, satzmodus-auswahl-v1,
   regelkandidaten-v1 und verschmelzung-v1 liegen im selben localStorage. */
const SCHLUESSEL = 'wortmarke-v1';

/* ⛔ HIER STAND 'JSON.parse(localStorage.getItem(...))' OHNE try (bis
   21.08.2026). Ist der Speicher gesperrt — und bei einer lokal geoeffneten
   Datei ist er das oft —, wirft schon das getItem, und dann stirbt das
   ganze Skript BEIM LADEN. Nicht das Speichern ging still schief: die
   Seite waere gar nicht erst benutzbar gewesen, ohne jede Meldung.
   [[localstorage_kann_werfen]]

   Die Loesung ist aus werkzeuge/freigabe-seite.mjs uebernommen, wo sie seit
   einem echten Vorfall steht („Storage is disabled inside data: URLs …
   beim naechsten Neuladen waere die Arbeit von einer Stunde weg gewesen").
   Sie war nie zu den anderen Artefakt-Seiten gewandert.
   [[entscheidung_gilt_fuer_das_zweite_werkzeug]] */
let SPEICHER_GEHT = false;
try {
  localStorage.setItem(SCHLUESSEL + '-probe', '1');
  SPEICHER_GEHT = localStorage.getItem(SCHLUESSEL + '-probe') === '1';
  localStorage.removeItem(SCHLUESSEL + '-probe');
} catch(e) { SPEICHER_GEHT = false; }

let stand = { wahl: [], notiz: '' };
if (SPEICHER_GEHT) {
  try { stand = JSON.parse(localStorage.getItem(SCHLUESSEL) || '{"wahl":[],"notiz":""}'); }
  catch(e) { stand = { wahl: [], notiz: '' }; }
}
if (!Array.isArray(stand.wahl)) stand.wahl = [];

function sichern(){
  if (SPEICHER_GEHT) {
    try { localStorage.setItem(SCHLUESSEL, JSON.stringify(stand)); }
    catch(e) { SPEICHER_GEHT = false; warneSpeicher(); }
  }
  zeichnen();
}

/* Sichtbar machen, wenn nichts behalten wird. Eine stille Fehlfunktion ist
   hier schlimmer als gar keine Seite: sie sieht aus, als wuerde sie
   arbeiten. [[ausfall_ist_unsichtbar_gebaut]] */
function warneSpeicher(){
  if (SPEICHER_GEHT || document.getElementById('speicherwarnung')) return;
  const d = document.createElement('div');
  d.id = 'speicherwarnung';
  d.style.cssText = 'background:#210d0c;border:1px solid #5a1f1c;border-left:3px solid #c4483f;'
    + 'padding:.7rem .9rem;border-radius:6px;margin:0 0 1rem;font-size:.9rem;line-height:1.5';
  d.innerHTML = '<b style="color:#e0776d">Dieser Browser behält hier nichts.</b> '
    + 'Deine Auswahl steht nur im Arbeitsspeicher — beim Neuladen oder Schließen '
    + 'ist sie weg. Kopier dir den Text unten heraus, bevor du die Seite verlässt.';
  const anker = document.getElementById('stand');
  if (anker && anker.parentNode) anker.parentNode.insertBefore(d, anker);
}
function zeichnen(){
  document.querySelectorAll('.karte').forEach(k => {
    const an = stand.wahl.includes(k.dataset.wahl);
    k.classList.toggle('an', an);
    const b = k.querySelector('.w');
    b.classList.toggle('an', an);
    b.textContent = an ? 'gewählt' : 'das gefällt mir';
  });
  const n = stand.wahl.length;
  document.getElementById('stand').textContent = n === 0 ? 'Noch nichts gewählt.'
    : n + (n === 1 ? ' Entwurf gewählt.' : ' Entwürfe gewählt — mehrere sind erlaubt.');
  const namen = stand.wahl.map(id => {
    const k = document.querySelector('[data-wahl="' + id + '"]');
    return id + ' (' + k.querySelector('h3').textContent.trim() + ')';
  });
  document.getElementById('ausgabe').value = namen.length
    ? 'WORTMARKE\\n' + namen.map(x => '- ' + x).join('\\n')
      + (stand.notiz ? '\\n// ' + stand.notiz : '')
    : '';
  const t = document.getElementById('notiz');
  if (document.activeElement !== t) t.value = stand.notiz || '';
}
document.addEventListener('click', e => {
  const b = e.target.closest('.w');
  if (!b) return;
  const id = b.dataset.w;
  /* Mehrfachwahl ist Absicht: „A2 gefaellt mir, B1 auch" ist eine
     brauchbare Antwort, „genau eine" waere eine erfundene Einschraenkung. */
  const i = stand.wahl.indexOf(id);
  if (i < 0) stand.wahl.push(id); else stand.wahl.splice(i, 1);
  sichern();
});
document.getElementById('notiz').addEventListener('input', e => {
  stand.notiz = e.target.value;
  sichern();   /* geht ueber sichern(), damit die Warnung auch hier greift */
});
document.getElementById('btnKopieren').addEventListener('click', async () => {
  const t = document.getElementById('ausgabe'), k = document.getElementById('btnKopieren');
  if (!t.value) return;
  try { await navigator.clipboard.writeText(t.value); k.textContent = 'Kopiert'; }
  catch { t.select(); document.execCommand('copy'); k.textContent = 'Kopiert'; }
  setTimeout(() => { k.textContent = 'In die Zwischenablage'; }, 1600);
});
document.getElementById('btnZuruecksetzen').addEventListener('click', () => {
  if (!confirm('Auswahl löschen?')) return;
  stand.wahl = []; stand.notiz = '';
  sichern();
});
zeichnen();
/* ⛔ AUCH BEIM START warnen, nicht nur wenn der Speicher mitten in der
   Sitzung ausfaellt. War er von Anfang an gesperrt, ist SPEICHER_GEHT
   schon false, der try-Block in sichern() wird uebersprungen und die
   Warnung kaeme nie — und genau das ist der haeufigere Fall.
   Aufgefallen an einer Probe, die die erzeugte Seite gegen einen
   werfenden Speicher laufen laesst. [[ausfall_ist_unsichtbar_gebaut]] */
warneSpeicher();
</script></body></html>`;

const ZIEL = W + 'wortmarke-entwuerfe.html';
fs.writeFileSync(ZIEL, seite, 'utf8');
console.log('  ok  ' + path.basename(ZIEL) + ' gebaut');
console.log('      Gruppe A: ' + FASSUNGEN.length + ' Fassungen aus dem ECHTEN Pfad (' + PFAD.length + ' Zeichen)');
console.log('      Gruppe B: ' + ALTERNATIVEN.length + ' Alternativen, alle im Vokabelbestand belegt');
console.log('      Speicherschluessel: wortmarke-v1');
console.log('      ' + (seite.length / 1024).toFixed(0) + ' KB');
