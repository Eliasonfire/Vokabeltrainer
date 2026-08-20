/* freigabe-artefakt.mjs -- Baustein D der Regelkette, als Artefakt.
 *
 * Elias am 19.08.2026, nachdem er 55 von 95 Regeln im Regelpruefungs-Artefakt
 * beurteilt hatte: "die entscheidung zu treffen muss so leicht sein wie das
 * artefakt das ich heute bearbeitet habe, am besten so in der art machen wir
 * es oder auch genauso."
 *
 * Deshalb dieselbe Bauform wie werkzeuge/regelpruefung-seite.mjs: eine
 * eigenstaendige Seite, Entscheidungen im localStorage, unten ein Kasten zum
 * Kopieren. Sie wird als Artefakt veroeffentlicht und laesst sich am Handy
 * durchgehen.
 *
 * Aufruf:  node werkzeuge/freigabe-artefakt.mjs
 * Ergebnis: artefakte/freigabe.html
 *
 * ============================ ⛔ EIGENER SPEICHERSCHLUESSEL ================
 *
 * SPEICHER = 'regelkandidaten-v1'.
 *
 * NICHT 'regelpruefung-v1' (das Regel-Artefakt, dort liegen Elias' 55
 * Urteile) und NICHT 'satzmodus-auswahl-v1'. Zwei Seiten auf demselben
 * Schluessel loeschen einander die Antworten, und ich kann seinen
 * localStorage weder lesen noch sichern — der Schaden waere unumkehrbar und
 * unbemerkt.
 *
 * ============================ Warum die Vorauswahl mitkommt ===============
 *
 * `kandidaten.mjs` liefert eine VORAUSWAHL, keine Regelliste. Gemessen findet
 * sie rund zwei Drittel der bekannten Regeln wieder, wenn man ein Drittel des
 * Unterrichts liest. Diese Zahl steht auf der Seite, weil eine Liste ohne
 * ihren Preis eine Trefferquote vortaeuscht, die es nicht gibt.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KAND = path.join(REPO, 'transcripts', 'kandidaten');
const AUS  = path.join(REPO, 'artefakte');

if (!fs.existsSync(KAND)) {
  console.log('Keine Kandidaten da. Erst: node werkzeuge/kandidaten.mjs --offen');
  process.exit(0);
}
fs.mkdirSync(AUS, { recursive: true });

const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/* Die vorhandenen Regeln, um "aehnlicheRegeln" mit Namen statt Kennung zu
   zeigen. Eine nackte id sagt Elias nichts. */
const G = new Function(fs.readFileSync(path.join(REPO, 'grammar-data.js'), 'utf8')
  + ';return {GRAMMAR_RULES};')().GRAMMAR_RULES;
const NAME = Object.fromEntries(G.map(r => [r.id, r.name]));

const dateien = fs.readdirSync(KAND).filter(f => /^folge-\d+\.json$/.test(f))
  .sort((a, b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]));
if (!dateien.length) { console.log('Keine folge-XX.json in ' + KAND); process.exit(0); }

/* Text kuerzen, aber an einer Wortgrenze — mitten im Wort abgeschnittene
   Zitate lesen sich wie Uebertragungsfehler. */
function kuerze(t, n) {
  const s = String(t || '').replace(/\s+/g, ' ').trim();
  if (s.length <= n) return [s, ''];
  let i = s.lastIndexOf(' ', n);
  if (i < n * 0.6) i = n;
  return [s.slice(0, i), s.slice(i).trim()];
}

/* ⛔ Das Datum stand bis zum 20.08.2026 FEST als "Stand 19.08.2026" in der
   Seite. Sie behauptete also bei jedem Lauf denselben Tag - genau der Fall,
   in dem eine erzeugte Seite so alt aussieht wie eine handgeschriebene und
   niemand merkt, wann sie zuletzt gemessen hat.
   [[eingefrorenes_feld_ist_kein_zustand]] */
const STAND_HEUTE = new Date().toLocaleDateString('de-DE',
  { day: '2-digit', month: '2-digit', year: 'numeric' });

let bloecke = '', gesamt = 0;
const folgen = [];

for (const datei of dateien) {
  const d = JSON.parse(fs.readFileSync(path.join(KAND, datei), 'utf8'));
  const liste = d.kandidaten || [];
  if (!liste.length) continue;
  gesamt += liste.length;
  folgen.push({ folge: d.folge, n: liste.length, anteil: d.anteilGelesen });

  bloecke += `<h2 id="f${d.folge}"><span class="knr">Folge ${d.folge}</span>`
    + `<span class="ktitel">${liste.length} Fundstellen</span>`
    + `<span class="kzahl">${d.anteilGelesen != null
        ? Math.round(d.anteilGelesen * 100) + ' % des Unterrichts' : ''}</span></h2>`;

  liste.forEach((k, i) => {
    const id = 'f' + d.folge + '-' + k.zeitmarke.replace(/:/g, '');
    const [kern, rest] = kuerze(k.text, 340);
    const begriffe = Object.entries(k.begriffe || {})
      .sort((a, b) => b[1] - a[1])
      .map(([w, n]) => `<span class="chip">${esc(w)}${n > 1 ? ' ×' + n : ''}</span>`).join('');
    const nah = (k.aehnlicheRegeln || []).slice(0, 3)
      .map(r => {
        const rid = typeof r === 'string' ? r : (r.id || r.regel || '');
        return `<li><b>${esc(NAME[rid] || rid)}</b> <code>${esc(rid)}</code></li>`;
      }).join('');

    bloecke += `<article class="stelle" data-id="${esc(id)}" data-folge="${d.folge}">
  <div class="skopf">
    <span class="snr">${i + 1}</span>
    <span class="zeit">${esc(k.zeitmarke)}</span>
    ${k.lehreranteil != null
      ? `<span class="marke ${k.lehreranteil >= 0.6 ? 'lehrer' : 'gemischt'}">Lehrer ${Math.round(k.lehreranteil * 100)} %</span>` : ''}
  </div>
  ${begriffe ? `<div class="chips">${begriffe}</div>` : ''}
  <p class="wortlaut">${esc(kern)}${rest ? '…' : ''}</p>
  ${rest ? `<details><summary>ganzer Abschnitt</summary><p class="wortlaut rest">${esc(rest)}</p></details>` : ''}
  ${nah ? `<details class="nah"><summary>Was es schon gibt (${(k.aehnlicheRegeln || []).length})</summary><ul>${nah}</ul></details>` : ''}
  <div class="wahl" role="group" aria-label="Entscheidung">
    <button type="button" data-w="regel">Regel daraus</button>
    <button type="button" data-w="weg">verwerfen</button>
    <button type="button" data-w="spaeter">später</button>
  </div>
  <textarea class="notiz" rows="1" placeholder="Notiz (freiwillig)"></textarea>
</article>`;
  });
}

const html = `<title>Regelkandidaten freigeben</title>
<style>
/* Gleiche Bauform wie das Regelpruefungs-Artefakt: OLED-Schwarz, ein Thema,
   alles explizit gemalt. Elias hat ausdruecklich "genauso" gesagt. */
:root{
  --bg:#000; --flaeche:#111114; --hoch:#17171c; --rand:#26262c; --rand2:#1c1c21;
  --text:#f4f4f6; --leise:#9a9aa4; --still:#6b6b75;
  --rot:#ff3355; --gruen:#2fd27a; --gelb:#ffc44d; --blau:#5aa9ff;
  --sp1:6px; --sp2:10px; --sp3:16px; --sp4:24px; --sp5:38px;
  --sans:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  --mono:ui-monospace,Menlo,Consolas,monospace;
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--text);font-family:var(--sans);
     font-size:17px;line-height:1.55;padding:var(--sp5) var(--sp3) 80px}
.huelle{max-width:760px;margin:0 auto}
.eyebrow{font-family:var(--mono);font-size:.72rem;letter-spacing:.14em;
         text-transform:uppercase;color:var(--still);margin:0 0 var(--sp2)}
h1{font-size:clamp(1.9rem,7vw,2.5rem);line-height:1.1;letter-spacing:-.025em;
   margin:0 0 var(--sp3);text-wrap:balance}
.vorspann{color:var(--leise);margin:0 0 var(--sp3);max-width:60ch}
.vorspann strong{color:var(--text)}
code{font-family:var(--mono);font-size:.86em;color:var(--leise)}

.warnkasten{background:#1a1206;border:1px solid #4a3410;border-left:3px solid var(--gelb);
            border-radius:12px;padding:var(--sp3);margin:0 0 var(--sp4);
            color:#e8d5ac;font-size:.92rem}
.warnkasten b{color:var(--gelb)}

.fortschritt{position:sticky;top:0;z-index:10;background:var(--bg);
             padding:var(--sp2) 0;margin-bottom:var(--sp3);
             border-bottom:1px solid var(--rand)}
.balken{height:6px;background:var(--rand2);border-radius:99px;overflow:hidden}
.balken i{display:block;height:100%;width:0;background:var(--gruen);transition:width .2s ease}
.fzeile{display:flex;justify-content:space-between;align-items:center;gap:var(--sp2);
        margin-top:var(--sp1);font-size:.85rem;color:var(--leise);flex-wrap:wrap}
.fzeile b{font-family:var(--mono);font-variant-numeric:tabular-nums;color:var(--text)}
.fzeile button{font:inherit;font-size:.82rem;font-weight:600;color:var(--bg);
               background:var(--gruen);border:0;border-radius:99px;padding:6px 14px;cursor:pointer}
.fzeile button:disabled{background:var(--rand);color:var(--still);cursor:default}
.fzeile button:focus-visible{outline:2px solid var(--text);outline-offset:2px}

h2{display:flex;align-items:baseline;gap:var(--sp2);flex-wrap:wrap;
   font-size:1.05rem;font-weight:600;margin:var(--sp5) 0 var(--sp3);
   padding-bottom:var(--sp1);border-bottom:1px solid var(--rand)}
.knr{font-family:var(--mono);font-size:.78rem;letter-spacing:.06em;
     text-transform:uppercase;color:var(--blau)}
.ktitel{font-weight:600}
.kzahl{margin-left:auto;font-family:var(--mono);font-size:.75rem;color:var(--still);
       font-variant-numeric:tabular-nums}

.stelle{background:var(--flaeche);border:1px solid var(--rand);border-radius:14px;
        padding:var(--sp3);margin-bottom:var(--sp2);border-left:3px solid var(--rand)}
.stelle[data-w="regel"]{border-left-color:var(--gruen)}
.stelle[data-w="weg"]{border-left-color:var(--rot);opacity:.62}
.stelle[data-w="spaeter"]{border-left-color:var(--gelb)}
.skopf{display:flex;align-items:baseline;gap:var(--sp2);flex-wrap:wrap;margin-bottom:var(--sp2)}
.snr{font-family:var(--mono);font-size:.74rem;color:var(--still);min-width:2ch;
     font-variant-numeric:tabular-nums}
.zeit{font-family:var(--mono);font-size:.9rem;color:var(--blau);font-weight:600}
.marke{font-family:var(--mono);font-size:.68rem;font-weight:600;letter-spacing:.05em;
       padding:2px 7px;border-radius:5px;border:1px solid var(--rand);
       background:var(--hoch);white-space:nowrap;margin-left:auto}
.marke.lehrer{color:var(--gruen);border-color:rgba(47,210,122,.35)}
.marke.gemischt{color:var(--gelb);border-color:rgba(255,196,77,.32)}

.chips{display:flex;flex-wrap:wrap;gap:var(--sp1);margin-bottom:var(--sp2)}
.chip{font-family:var(--mono);font-size:.7rem;color:var(--leise);
      background:var(--hoch);border:1px solid var(--rand2);border-radius:99px;padding:2px 8px}

.wortlaut{margin:0;color:var(--text);font-size:.95rem}
.wortlaut.rest{color:var(--leise);margin-top:var(--sp2)}
details{margin-top:var(--sp2)}
summary{cursor:pointer;font-size:.82rem;color:var(--blau);font-weight:600}
summary:focus-visible{outline:2px solid var(--text);outline-offset:2px}
.nah ul{margin:var(--sp2) 0 0;padding-left:1.1rem;font-size:.85rem;color:var(--leise)}
.nah b{color:var(--text);font-weight:600}

.wahl{display:flex;gap:var(--sp1);margin-top:var(--sp3);flex-wrap:wrap}
.wahl button{font:inherit;font-size:.85rem;font-weight:600;flex:1 1 auto;min-width:0;
             color:var(--leise);background:var(--hoch);border:1px solid var(--rand);
             border-radius:99px;padding:8px 12px;cursor:pointer}
.wahl button:focus-visible{outline:2px solid var(--text);outline-offset:2px}
.wahl button[aria-pressed="true"][data-w="regel"]{background:#0b1a12;color:var(--gruen);border-color:rgba(47,210,122,.5)}
.wahl button[aria-pressed="true"][data-w="weg"]{background:#1a0b0f;color:var(--rot);border-color:rgba(255,51,85,.5)}
.wahl button[aria-pressed="true"][data-w="spaeter"]{background:#1a1206;color:var(--gelb);border-color:rgba(255,196,77,.5)}
.notiz{display:none;width:100%;margin-top:var(--sp2);font:inherit;font-size:.85rem;
       color:var(--text);background:var(--bg);border:1px solid var(--rand);
       border-radius:8px;padding:8px 10px;resize:vertical}
.stelle[data-w] .notiz{display:block}
.notiz:focus-visible{outline:2px solid var(--text);outline-offset:2px}

.ausgabe{margin-top:var(--sp5);border-top:1px solid var(--rand);padding-top:var(--sp4)}
.ausgabe textarea{width:100%;min-height:180px;font-family:var(--mono);font-size:.8rem;
                  color:var(--leise);background:var(--flaeche);border:1px solid var(--rand);
                  border-radius:10px;padding:var(--sp3)}
.leermeldung{color:var(--still);font-size:.9rem;display:none}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>

<div class="huelle">
<p class="eyebrow">Stand ${STAND_HEUTE} · ${gesamt} Fundstellen · Folge ${folgen.map(f => f.folge).join(', ')}</p>
<h1>Regelkandidaten freigeben</h1>

<p class="vorspann"><strong>Du entscheidest, was eine Regel ist</strong> — die
Maschine sucht nur die Stellen. Je Fundstelle steht hier, was der Lehrer sagt,
wo im Video es liegt, welche Fachbegriffe vorkommen und was es an ähnlichen
Regeln schon gibt.</p>

<div class="warnkasten">
<b>⚠️ Das ist eine Vorauswahl, keine Regelliste.</b> Gemessen findet sie rund
<b>zwei Drittel</b> der bereits bekannten Regeln wieder — dafür muss man etwa
<b>ein Drittel</b> des Unterrichts lesen. Es fehlt also etwas, und manches
hier ist keine Regel. Beides ist normal.
<br><br>
<b>Deine Antworten bleiben auf dieser Seite.</b> Sie werden im Browser
gespeichert — aber sie erreichen mich <b>erst, wenn du den Text unten kopierst
und schickst.</b>
</div>

<div class="fortschritt">
  <div class="balken"><i id="balken"></i></div>
  <div class="fzeile">
    <span><b id="zahl">0</b> von <b>${gesamt}</b> entschieden</span>
    <button type="button" id="kopieren" disabled>Ergebnis kopieren</button>
  </div>
</div>

${bloecke}

<div class="ausgabe">
  <h2><span class="knr">Zum Schicken</span></h2>
  <p class="vorspann">Auf <b>Ergebnis kopieren</b> tippen, dann in den Chat
  einfügen. Solange nichts entschieden ist, bleibt der Kasten leer.</p>
  <textarea id="text" readonly aria-label="Ergebnis zum Kopieren"></textarea>
</div>
</div>

<script>
/* ⛔ EIGENER SCHLUESSEL. Nicht regelpruefung-v1 (dort liegen die 55 Urteile
   ueber die Regeln) und nicht satzmodus-auswahl-v1. Zwei Seiten auf einem
   Schluessel loeschen einander die Antworten — und niemand merkt es. */
var SPEICHER = 'regelkandidaten-v1';
var stand;
try { stand = JSON.parse(localStorage.getItem(SPEICHER) || '{}'); } catch(e){ stand = {}; }
if (!stand || typeof stand !== 'object') stand = {};

var stellen = Array.prototype.slice.call(document.querySelectorAll('.stelle'));
var WORT = { regel:'REGEL DARAUS', weg:'VERWERFEN', spaeter:'SPAETER' };

function sichern(){
  try { localStorage.setItem(SPEICHER, JSON.stringify(stand)); } catch(e){}
}

function zeichne(el){
  var id = el.dataset.id;
  var e = stand[id];
  if (e && e.w){ el.dataset.w = e.w; } else { delete el.dataset.w; }
  el.querySelectorAll('.wahl button').forEach(function(b){
    b.setAttribute('aria-pressed', String(!!e && e.w === b.dataset.w));
  });
  var n = el.querySelector('.notiz');
  if (n && e && e.n != null && n.value !== e.n) n.value = e.n;
}

function standZeigen(){
  var n = stellen.filter(function(el){ return stand[el.dataset.id] && stand[el.dataset.id].w; }).length;
  document.getElementById('zahl').textContent = n;
  document.getElementById('balken').style.width = (n / ${gesamt} * 100) + '%';
  document.getElementById('kopieren').disabled = n === 0;
  bauText();
}

function bauText(){
  var gruppen = { regel:[], weg:[], spaeter:[] };
  stellen.forEach(function(el){
    var e = stand[el.dataset.id];
    if (!e || !e.w) return;
    var zeit = el.querySelector('.zeit').textContent;
    var folge = el.dataset.folge;
    gruppen[e.w].push('  F' + folge + ' ' + zeit + (e.n ? '  — ' + e.n : ''));
  });
  var n = gruppen.regel.length + gruppen.weg.length + gruppen.spaeter.length;
  var t = 'Regelkandidaten — ' + n + ' von ${gesamt} entschieden\\n';
  ['regel','weg','spaeter'].forEach(function(k){
    if (!gruppen[k].length) return;
    t += '\\n' + WORT[k] + ' (' + gruppen[k].length + '):\\n' + gruppen[k].join('\\n') + '\\n';
  });
  document.getElementById('text').value = n ? t : '';
}

document.addEventListener('click', function(ev){
  var b = ev.target.closest('.wahl button');
  if (!b) return;
  var el = b.closest('.stelle'), id = el.dataset.id;
  var e = stand[id] || {};
  /* Nochmal dieselbe Taste = Entscheidung zuruecknehmen. Ohne das kaeme man
     aus einem Fehlgriff nicht mehr heraus. */
  e.w = (e.w === b.dataset.w) ? null : b.dataset.w;
  if (!e.w && !e.n) delete stand[id]; else stand[id] = e;
  sichern(); zeichne(el); standZeigen();
});

document.addEventListener('input', function(ev){
  var n = ev.target.closest('.notiz');
  if (!n) return;
  var el = n.closest('.stelle'), id = el.dataset.id;
  var e = stand[id] || {};
  e.n = n.value.trim() || null;
  if (!e.w && !e.n) delete stand[id]; else stand[id] = e;
  sichern(); bauText();
});

document.getElementById('kopieren').addEventListener('click', function(){
  var t = document.getElementById('text');
  t.select();
  var ok = false;
  try { ok = document.execCommand('copy'); } catch(e){}
  if (navigator.clipboard) navigator.clipboard.writeText(t.value).catch(function(){});
  this.textContent = ok || navigator.clipboard ? 'kopiert ✓' : 'bitte von Hand markieren';
  var b = this;
  setTimeout(function(){ b.textContent = 'Ergebnis kopieren'; }, 1800);
});

stellen.forEach(zeichne);
standZeigen();
</script>`;

/* ⛔ Auch hier der Leerfall: sind alle Kandidaten abgearbeitet, waere `gesamt`
   null — die Seite zeigte "0 von 0 entschieden" und der Fortschrittsbalken
   rechnete n/0. Vor allem aber bliebe die ALTE Fassung als Artefakt stehen
   und zeigte Fundstellen, die er laengst entschieden hat.
   [[flaeche_nur_im_gefuellten_zustand]] */
if (!gesamt) {
  const leer = ['<title>Regelkandidaten freigeben</title>',
    '<style>:root{color-scheme:dark}body{margin:0;background:#000;color:#f4f4f6;'
    + 'font:17px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:38px 16px}'
    + '.h{max-width:640px;margin:0 auto}h1{font-size:2rem;margin:0 0 16px}p{color:#9a9aa4}'
    + 'b{color:#f4f4f6}</style>',
    '<div class="h">', '<h1>✓ Nichts offen</h1>',
    '<p><b>Alle Fundstellen sind entschieden.</b> Aus den ausgewerteten Folgen'
    + ' wartet keine mehr auf dein Ja oder Nein.</p>',
    '<p>Sobald eine neue Folge ausgewertet ist, stehen die Kandidaten wieder hier.</p>',
    '<p style="color:#6b6b75;font-size:.85rem">Stand ' + STAND_HEUTE + '</p>', '</div>'
  ].join(String.fromCharCode(10));
  fs.writeFileSync(path.join(AUS, 'freigabe.html'), leer, 'utf8');
  console.log('Nichts offen — Seite zeigt jetzt "✓ Nichts offen" statt alter Fundstellen.');
  console.log('  ⚠️ Trotzdem veroeffentlichen, sonst zeigt das Artefakt die alten:');
  console.log('     https://claude.ai/code/artifact/d9916aee-b679-4d91-bb0c-c3642f8889ac');
  process.exit(0);
}

const ziel = path.join(AUS, 'freigabe.html');
fs.writeFileSync(ziel, html, 'utf8');
console.log('geschrieben: ' + ziel);
console.log('Fundstellen: ' + gesamt + ' aus ' + folgen.length + ' Folge(n) — '
  + folgen.map(f => 'F' + f.folge + ': ' + f.n).join(' · '));
console.log('Speicherschluessel: regelkandidaten-v1  (NICHT regelpruefung-v1)');
