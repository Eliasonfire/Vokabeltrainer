/* freigabe-artefakt.mjs -- die Seite, auf der Elias die Regelkandidaten freigibt.
 *
 * ⭐⭐ UMGEBAUT AM 22.09.2026. Bis dahin legte diese Seite ihm ALLE 95
 * Fundstellen zum Durchklicken vor. Sein Satz dazu:
 *
 *   „du hast mir ein regelkandidaten freigeben artefakt gemacht. wir hatten das
 *   thema glaube ich schonmal. wir hatten ausgemacht das du das machen sollst
 *   bzw bewerten sollst und ich hatte dir noch gesagt das du auch meine
 *   unterlagen regelmässig gucken sollst und auch das in deine analyse mit
 *   einbeziehen sollst und auch die schlüssel bücher die wir haben usw."
 *
 * Er hatte recht: die Abmachung steht seit dem 29.07.2026 im Gedächtnis
 * (`04 - Wissen/Lehrwerk-Begleitmaterial.md`, „⭐ Rang der Schlüssel"). Aus
 * seinem „sollte es unterschiede geben … du sollst das einfach markieren" hatte
 * ich „alles markieren" gemacht. Die alte Seite hat er noch in derselben Stunde
 * gelöscht.
 *
 * ⭐ Seither kommt der Inhalt aus `transcripts/kandidaten/bewertung.json`, und
 * darin steht **mein Urteil zu jedem einzelnen Kandidaten**, gefällt gegen die
 * Schlüssel, den Unterricht und seine Unterlagen. Auf die Seite kommen nur noch
 * die drei Sorten, die ohne ihn nicht zu entscheiden sind:
 *
 *   `regel`      mein Vorschlag mit Beleg — er gibt jede Regel selbst frei
 *   `abweichung` Schlüssel und Lehrer widersprechen sich
 *   `unbelegt`   sieht wie eine Regel aus, keine gedruckte Quelle stützt sie
 *
 * Gemessen beim Umbau: **95 Fundstellen → 7 Entscheidungen.**
 *
 * ⛔ Die Seite wird NICHT mehr aus den Rohdaten gebaut. Fehlt die
 * `bewertung.json`, bricht dieses Werkzeug ab statt auf die alte Bauform
 * zurückzufallen — sonst stünden nach einem stillen Fehler wieder 95
 * Fundstellen darin, und niemand sähe es der Seite an.
 *
 * Aufruf:
 *   node werkzeuge/kandidaten-bewerten.mjs      (zuerst, schreibt bewertung.json)
 *   node werkzeuge/freigabe-artefakt.mjs
 * Ergebnis: artefakte/freigabe.html
 *
 * ======================= ⛔⛔ DIESE SEITE NICHT TEILEN =====================
 *
 * Sie enthaelt WOERTLICHEN TRANSKRIPTTEXT aus den Aufzeichnungen. Genau dieses
 * Material liegt unter transcripts/ und ist per .gitignore gesperrt
 * (arabicroots AGB 3.7 und 9, unerlaubte Weitergabe von Kursmaterial).
 *
 * ⭐ Als Artefakt ist die Seite standardmaessig PRIVAT — nur Elias sieht sie.
 * Das ist in Ordnung. Was NICHT in Ordnung waere: sie ueber das Teilen-Menue
 * freizugeben. Der Unterschied ist einen Klick gross, und niemand sieht der
 * Seite an, dass er zaehlt. Deshalb steht der Hinweis seit dem 21.08. auch
 * SICHTBAR im Kopf der erzeugten Seite — ein Vorbehalt, der nur im Quelltext
 * steht, erreicht den Leser nicht. [[regel_gilt_nur_mit_begruendung]]
 *
 * ⚠️ Durch den Umbau steht der Wortlaut nur noch bei 7 statt bei 95
 * Fundstellen in der Seite. Das ist weniger, aber nicht nichts — der Vorbehalt
 * gilt unverändert.
 *
 * ============================ ⛔ EIGENER SPEICHERSCHLUESSEL ================
 *
 * SPEICHER = 'regelkandidaten-v2'.
 *
 * ⚠️ v2, nicht v1: die Seite fragt jetzt etwas anderes, und die alten Antworten
 * aus v1 wuerden auf die neuen Knoepfe gemappt, ohne dass es jemand merkt.
 * NICHT 'regelpruefung-v1' (dort liegen Elias' 55 Urteile ueber die Regeln) und
 * NICHT 'satzmodus-auswahl-v1'. Zwei Seiten auf demselben Schluessel loeschen
 * einander die Antworten, und ich kann seinen localStorage weder lesen noch
 * sichern — der Schaden waere unumkehrbar und unbemerkt.
 */
import fs from 'node:fs';
import { arabischInSeite, BIDI_CSS } from './arabisch-hervorheben.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BEWERTUNG = path.join(REPO, 'transcripts', 'kandidaten', 'bewertung.json');
const AUS = path.join(REPO, 'artefakte');

if (!fs.existsSync(BEWERTUNG)) {
  console.error('⛔ ' + path.relative(REPO, BEWERTUNG) + ' fehlt.');
  console.error('   Erst bewerten:  node werkzeuge/kandidaten-bewerten.mjs');
  console.error('   ⚠️ Ohne sie wuerde die Seite wieder alle Fundstellen zeigen — das ist genau');
  console.error('      der Zustand, den Elias am 22.09.2026 abgeraeumt hat. Deshalb Abbruch.');
  process.exit(1);
}
fs.mkdirSync(AUS, { recursive: true });

const B = JSON.parse(fs.readFileSync(BEWERTUNG, 'utf8'));

/* ⛔ Ein Rückstand von mir darf die Seite nicht erreichen. Unbewertete
   Kandidaten tauchen weder als Entscheidung noch in der Nachlese auf; die Zahl
   steht aber SICHTBAR im Kopf, damit Elias sieht, dass ich noch arbeite. */
const RUECKSTAND = B.rueckstand || 0;

const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const STAND_HEUTE = new Date().toLocaleDateString('de-DE',
  { day: '2-digit', month: '2-digit', year: 'numeric' });

/* Die drei Sorten, die an Elias gehen — je mit ihren eigenen Knöpfen.
   ⛔ Die Knopfbeschriftung ist nicht Kosmetik: bei einer Abweichung ist
   „verwerfen" sinnlos, er muss zwischen ZWEI Fassungen wählen. Eine Seite mit
   immer denselben drei Knöpfen hätte ihn zwingen müssen, sich die eigentliche
   Frage selbst zu übersetzen. */
const SORTEN = {
  regel: {
    titel: 'Neue Regel — dein Ja fehlt',
    farbe: 'gruen',
    vorspann: 'Schlüssel und Unterricht sagen dasselbe. Ich habe den Beleg gesucht und schlage die Regel vor. Aufnehmen darf sie nur dein Ja.',
    knoepfe: [['ja', 'Ja, aufnehmen'], ['nein', 'Nein'], ['spaeter', 'später']],
  },
  abweichung: {
    titel: 'Schlüssel gegen Lehrer',
    farbe: 'gelb',
    vorspann: 'Hier widersprechen sich die Quellen. Deine Regel vom 29.07.2026 ist „im Zweifel die Schlüsselbücher" — aber entscheiden sollst du.',
    knoepfe: [['schluessel', 'Schlüssel gilt'], ['lehrer', 'Lehrer gilt'], ['spaeter', 'später']],
  },
  unbelegt: {
    titel: 'Nur im Unterricht, nirgends gedruckt',
    farbe: 'rot',
    vorspann: 'Der Lehrer sagt es, aber kein Schlüssel, den wir haben, bestätigt es. Es könnte auch ein Hörfehler der Abschrift sein.',
    knoepfe: [['ja', 'Trotzdem aufnehmen'], ['nein', 'Nein'], ['spaeter', 'später']],
  },
};

const fuerElias = (B.kandidaten || []).filter(k => SORTEN[k.urteil]);
const vonMir = (B.kandidaten || []).filter(k => k.urteil === 'schon-regel' || k.urteil === 'weg');

/* ====================== Die Entscheidungen ============================== */

let bloecke = '';
for (const sorte of ['regel', 'abweichung', 'unbelegt']) {
  const liste = fuerElias.filter(k => k.urteil === sorte);
  if (!liste.length) continue;
  const S = SORTEN[sorte];
  bloecke += `<h2 id="s-${sorte}"><span class="knr ${S.farbe}">${esc(S.titel)}</span>`
    + `<span class="kzahl">${liste.length}</span></h2>`
    + `<p class="vorspann">${esc(S.vorspann)}</p>`;

  for (const k of liste) {
    const knoepfe = S.knoepfe.map(([w, t]) =>
      `<button type="button" data-w="${w}">${esc(t)}</button>`).join('');
    bloecke += `<article class="stelle ${S.farbe}" data-id="${esc(k.id)}" data-sorte="${sorte}">
  <div class="skopf">
    <span class="zeit">Folge ${k.folge} · ${esc(k.zeitmarke)}</span>
    ${k.belege && k.belege.kapitel ? `<span class="marke">Kapitel ${k.belege.kapitel}</span>` : ''}
  </div>
  <p class="frage">${esc(k.frage || '')}</p>
  <p class="grund">${esc(k.grund || '')}</p>
  ${k.quelle ? `<p class="quelle"><b>Fundstelle:</b> ${esc(k.quelle)}</p>` : ''}
  <details><summary>Was der Lehrer an der Stelle sagt</summary>
    <p class="wortlaut">${esc(k.text || '')}</p></details>
  <div class="wahl" role="group" aria-label="Entscheidung">${knoepfe}</div>
  <textarea class="notiz" rows="1" placeholder="Notiz (freiwillig)"></textarea>
</article>`;
  }
}

/* ====================== Die Nachlese ====================================
   ⛔ Sie ist nicht Beiwerk. Ohne sie müsste Elias mir glauben, dass die
   anderen 88 zu Recht wegfallen — und „vertrau mir" ist bei 88 Stück keine
   Grundlage. Zugeklappt, damit sie die sieben Entscheidungen nicht zudeckt. */
const nachleseZeilen = vonMir.map(k =>
  `<li><span class="nid">F${k.folge} ${esc(k.zeitmarke)}</span>`
  + `<span class="nurteil ${k.urteil === 'weg' ? 'aus' : 'da'}">`
  + (k.urteil === 'weg' ? 'keine Regel' : 'steht schon') + '</span>'
  + `<span class="ngrund">${esc(k.grund || '')}`
  + (k.quelle ? ` <code>${esc(k.quelle)}</code>` : '') + '</span></li>').join('');

/* ====================== Die Seite ======================================= */

const html = `<title>Regelkandidaten freigeben</title>
<style>
${BIDI_CSS}
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
.vorspann{color:var(--leise);margin:0 0 var(--sp3);max-width:62ch}
.vorspann strong{color:var(--text)}
code{font-family:var(--mono);font-size:.84em;color:var(--still)}

.privat{font-size:.88rem;color:var(--leise);background:var(--hoch);
        border:1px solid var(--rand);border-left:3px solid var(--gelb);
        border-radius:0 10px 10px 0;padding:10px 14px;margin:0 0 18px}
.privat b{color:var(--text)}

.bilanz{background:var(--flaeche);border:1px solid var(--rand);border-radius:14px;
        padding:var(--sp3);margin:0 0 var(--sp4)}
.bilanz table{width:100%;border-collapse:collapse;font-size:.92rem}
.bilanz td{padding:4px 0;color:var(--leise)}
.bilanz td:first-child{font-family:var(--mono);font-variant-numeric:tabular-nums;
                       color:var(--text);width:3.5em;text-align:right;padding-right:12px}
.bilanz .stark td{color:var(--text);font-weight:600}

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
   font-size:1.05rem;font-weight:600;margin:var(--sp5) 0 var(--sp2);
   padding-bottom:var(--sp1);border-bottom:1px solid var(--rand)}
.knr{font-size:.95rem;font-weight:600}
.knr.gruen{color:var(--gruen)} .knr.gelb{color:var(--gelb)} .knr.rot{color:var(--rot)}
.kzahl{margin-left:auto;font-family:var(--mono);font-size:.8rem;color:var(--still);
       font-variant-numeric:tabular-nums}

.stelle{background:var(--flaeche);border:1px solid var(--rand);border-radius:14px;
        padding:var(--sp3);margin-bottom:var(--sp2);border-left:3px solid var(--rand)}
.stelle.gruen{border-left-color:rgba(47,210,122,.45)}
.stelle.gelb{border-left-color:rgba(255,196,77,.45)}
.stelle.rot{border-left-color:rgba(255,51,85,.45)}
.stelle[data-w]{opacity:.7}
.stelle[data-w] .frage{color:var(--leise)}
.skopf{display:flex;align-items:baseline;gap:var(--sp2);flex-wrap:wrap;margin-bottom:var(--sp2)}
.zeit{font-family:var(--mono);font-size:.82rem;color:var(--blau);font-weight:600}
.marke{font-family:var(--mono);font-size:.68rem;font-weight:600;letter-spacing:.05em;
       padding:2px 7px;border-radius:5px;border:1px solid var(--rand);
       background:var(--hoch);white-space:nowrap;margin-left:auto;color:var(--leise)}
.frage{margin:0 0 var(--sp2);font-size:1.05rem;font-weight:600;line-height:1.35;text-wrap:balance}
.grund{margin:0 0 var(--sp2);color:var(--leise);font-size:.92rem}
.quelle{margin:0;font-size:.85rem;color:var(--still)}
.quelle b{color:var(--leise)}
details{margin-top:var(--sp2)}
summary{cursor:pointer;font-size:.82rem;color:var(--blau);font-weight:600}
summary:focus-visible{outline:2px solid var(--text);outline-offset:2px}
.wortlaut{margin:var(--sp2) 0 0;color:var(--leise);font-size:.9rem}

.wahl{display:flex;gap:var(--sp1);margin-top:var(--sp3);flex-wrap:wrap}
.wahl button{font:inherit;font-size:.85rem;font-weight:600;flex:1 1 auto;min-width:0;
             color:var(--leise);background:var(--hoch);border:1px solid var(--rand);
             border-radius:99px;padding:8px 12px;cursor:pointer}
.wahl button:focus-visible{outline:2px solid var(--text);outline-offset:2px}
.wahl button[aria-pressed="true"][data-w="ja"],
.wahl button[aria-pressed="true"][data-w="schluessel"]{background:#0b1a12;color:var(--gruen);border-color:rgba(47,210,122,.5)}
.wahl button[aria-pressed="true"][data-w="nein"]{background:#1a0b0f;color:var(--rot);border-color:rgba(255,51,85,.5)}
.wahl button[aria-pressed="true"][data-w="lehrer"]{background:#0a1520;color:var(--blau);border-color:rgba(90,169,255,.5)}
.wahl button[aria-pressed="true"][data-w="spaeter"]{background:#1a1206;color:var(--gelb);border-color:rgba(255,196,77,.5)}
.notiz{display:none;width:100%;margin-top:var(--sp2);font:inherit;font-size:.85rem;
       color:var(--text);background:var(--bg);border:1px solid var(--rand);
       border-radius:8px;padding:8px 10px;resize:vertical}
.stelle[data-w] .notiz{display:block}
.notiz:focus-visible{outline:2px solid var(--text);outline-offset:2px}

.nachlese{margin-top:var(--sp5);border-top:1px solid var(--rand);padding-top:var(--sp4)}
.nachlese > summary{font-size:.95rem}
.nachlese ul{list-style:none;margin:var(--sp3) 0 0;padding:0}
.nachlese li{display:grid;grid-template-columns:auto auto 1fr;gap:var(--sp2);
             align-items:baseline;padding:8px 0;border-bottom:1px solid var(--rand2);
             font-size:.85rem}
.nid{font-family:var(--mono);font-size:.76rem;color:var(--blau);white-space:nowrap}
.nurteil{font-family:var(--mono);font-size:.68rem;font-weight:600;padding:1px 6px;
         border-radius:4px;white-space:nowrap;border:1px solid var(--rand)}
.nurteil.aus{color:var(--still)}
.nurteil.da{color:var(--gruen);border-color:rgba(47,210,122,.3)}
.ngrund{color:var(--leise)}
@media (max-width:560px){.nachlese li{grid-template-columns:1fr;gap:2px}}

.ausgabe{margin-top:var(--sp5);border-top:1px solid var(--rand);padding-top:var(--sp4)}
.ausgabe textarea{width:100%;min-height:150px;font-family:var(--mono);font-size:.8rem;
                  color:var(--leise);background:var(--flaeche);border:1px solid var(--rand);
                  border-radius:10px;padding:var(--sp3)}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>

<div class="huelle">
<p class="eyebrow">Stand ${STAND_HEUTE} · ${fuerElias.length} von ${B.gesamt} Fundstellen</p>
<h1>Regelkandidaten freigeben</h1>

<p class="privat"><b>🔒 Diese Seite bitte nicht teilen.</b> Sie zeigt den
wörtlichen Wortlaut aus den Kursaufzeichnungen — dasselbe Material, das
im Repo gesperrt ist (arabicroots AGB 3.7 und 9). Als Artefakt ist sie
privat, und das soll sie bleiben; über das Teilen-Menü wäre es eine
Weitergabe.</p>

<p class="vorspann"><strong>Ich habe die ${B.gesamt} Fundstellen durchgesehen</strong>
und jede gegen die Schlüsselbücher, den Unterricht und deine Unterlagen
geprüft. Übrig sind <strong>${fuerElias.length}</strong>, die ich nicht allein
entscheiden kann. Was ich mit den anderen gemacht habe, steht unten zum
Nachlesen — mit Begründung und Regelnamen, nicht als „vertrau mir".</p>

<div class="bilanz"><table>
<tr class="stark"><td>${fuerElias.length}</td><td>warten auf dich</td></tr>
<tr><td>${vonMir.filter(k => k.urteil === 'schon-regel').length}</td><td>Inhalt steht schon als Regel</td></tr>
<tr><td>${vonMir.filter(k => k.urteil === 'weg').length}</td><td>keine Regel darin (Vokabeln, Organisation, kaputte Abschrift)</td></tr>
${RUECKSTAND ? `<tr><td>${RUECKSTAND}</td><td>habe ich noch nicht durch — mein Rückstand, nicht deiner</td></tr>` : ''}
</table></div>

<div class="fortschritt">
  <div class="balken"><i id="balken"></i></div>
  <div class="fzeile">
    <span><b id="zahl">0</b> von <b>${fuerElias.length}</b> entschieden</span>
    <button type="button" id="kopieren" disabled>Ergebnis kopieren</button>
  </div>
</div>

${bloecke || '<p class="vorspann">✓ Nichts offen. Aus den ausgewerteten Folgen wartet keine Fundstelle mehr auf dich.</p>'}

<details class="nachlese">
  <summary>Was ich mit den anderen ${vonMir.length} gemacht habe</summary>
  <ul>${nachleseZeilen}</ul>
</details>

<div class="ausgabe">
  <h2><span class="knr">Zum Schicken</span></h2>
  <p class="vorspann">Auf <b>Ergebnis kopieren</b> tippen, dann in den Chat
  einfügen. Solange nichts entschieden ist, bleibt der Kasten leer.</p>
  <textarea id="text" readonly aria-label="Ergebnis zum Kopieren"></textarea>
</div>
</div>

<script>
/* ⛔ EIGENER SCHLUESSEL, und v2: die Seite fragt seit dem 22.09.2026 etwas
   anderes als vorher. Alte v1-Antworten wuerden auf neue Knoepfe gemappt,
   ohne dass es jemand merkt. Nicht regelpruefung-v1, nicht satzmodus-auswahl-v1. */
var SPEICHER = 'regelkandidaten-v2';
var stand;
try { stand = JSON.parse(localStorage.getItem(SPEICHER) || '{}'); } catch(e){ stand = {}; }
if (!stand || typeof stand !== 'object') stand = {};

var stellen = Array.prototype.slice.call(document.querySelectorAll('.stelle'));
var GESAMT = ${fuerElias.length};
var WORT = { ja:'JA', nein:'NEIN', spaeter:'SPAETER',
             schluessel:'SCHLUESSEL GILT', lehrer:'LEHRER GILT' };

/* ⛔ Der Ladeversuch oben steht in einem try — das Speichern schluckte
   seinen Fehler bis zum 21.08.2026 aber stumm. Ist der Speicher gesperrt,
   verschwinden Elias' Entscheidungen lautlos, und beim naechsten Oeffnen
   faengt er von vorn an. [[ausfall_ist_unsichtbar_gebaut]] */
var SPEICHER_GEHT = false;
try {
  localStorage.setItem(SPEICHER + '-probe', '1');
  SPEICHER_GEHT = localStorage.getItem(SPEICHER + '-probe') === '1';
  localStorage.removeItem(SPEICHER + '-probe');
} catch(e){ SPEICHER_GEHT = false; }

function warneSpeicher(){
  if (SPEICHER_GEHT || document.getElementById('speicherwarnung')) return;
  var d = document.createElement('div');
  d.id = 'speicherwarnung';
  d.style.cssText = 'background:#210d0c;border:1px solid #5a1f1c;border-left:3px solid #c4483f;'
    + 'padding:.7rem .9rem;border-radius:6px;margin:0 0 1rem;font-size:.9rem;line-height:1.5';
  d.innerHTML = '<b style="color:#e0776d">Dieser Browser behält hier nichts.</b> '
    + 'Deine Entscheidungen stehen nur im Arbeitsspeicher — beim Neuladen oder Schließen '
    + 'sind sie weg. Kopier dir das Ergebnis heraus, bevor du die Seite verlässt.';
  var anker = document.getElementById('balken') || document.getElementById('text');
  if (anker && anker.parentNode) anker.parentNode.insertBefore(d, anker);
}

function sichern(){
  if (!SPEICHER_GEHT) return;
  try { localStorage.setItem(SPEICHER, JSON.stringify(stand)); }
  catch(e){ SPEICHER_GEHT = false; warneSpeicher(); }
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
  document.getElementById('balken').style.width = (GESAMT ? n / GESAMT * 100 : 0) + '%';
  document.getElementById('kopieren').disabled = n === 0;
  bauText();
}

function bauText(){
  var zeilen = [], n = 0;
  stellen.forEach(function(el){
    var e = stand[el.dataset.id];
    if (!e || !e.w) return;
    n++;
    var frage = (el.querySelector('.frage') || {}).textContent || '';
    zeilen.push('  ' + el.dataset.id + '  ' + (WORT[e.w] || e.w)
      + (e.n ? '  — ' + e.n : '') + '\\n    (' + frage.replace(/\\s+/g, ' ').slice(0, 120) + ')');
  });
  document.getElementById('text').value = n
    ? 'Regelkandidaten — ' + n + ' von ' + GESAMT + ' entschieden\\n\\n' + zeilen.join('\\n') + '\\n'
    : '';
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
/* ⛔ AUCH BEIM START warnen. War der Speicher von Anfang an gesperrt, ist
   SPEICHER_GEHT schon false, sichern() kehrt sofort um und die Warnung
   kaeme nie — der haeufigere Fall also stumm. */
warneSpeicher();
</script>`;

const ziel = path.join(AUS, 'freigabe.html');
fs.writeFileSync(ziel, arabischInSeite(html), 'utf8');
console.log('geschrieben: ' + path.relative(REPO, ziel));
console.log('Fuer Elias: ' + fuerElias.length + ' von ' + B.gesamt
  + '  (' + ['regel', 'abweichung', 'unbelegt']
      .map(s => s + ' ' + fuerElias.filter(k => k.urteil === s).length).join(', ') + ')');
console.log('Von mir entschieden: ' + vonMir.length
  + '  (schon-regel ' + vonMir.filter(k => k.urteil === 'schon-regel').length
  + ', weg ' + vonMir.filter(k => k.urteil === 'weg').length + ')');
if (RUECKSTAND) console.log('⚠️ MEIN Rueckstand: ' + RUECKSTAND + ' — steht sichtbar im Kopf der Seite.');
console.log('Speicherschluessel: regelkandidaten-v2  (NICHT v1, NICHT regelpruefung-v1)');
