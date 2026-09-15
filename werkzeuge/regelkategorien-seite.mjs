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

const marken = {};
for (const liste of Object.values(TAGS))
  for (const t of liste) marken[t.ruleId] = (marken[t.ruleId] || 0) + 1;

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
const gruppen = new Map(mitMuster.map(t => [t.id, { name: t.name, regeln: [] }]));
gruppen.set('__ohne__', { name: 'Nicht zuordbar', regeln: [] });
for (const r of REGELN) {
  const t = zuKategorie.get(r.id);
  gruppen.get(t.length ? t[0].id : '__ohne__').regeln.push(r);
}

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

  bloecke += `
  <section class="block" data-kat="${esc(id)}">
    <h2>${esc(g.name)} <span class="zahl"><span data-fertig>0</span>/${g.regeln.length}</span></h2>
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
console.log('  ' + gesamt + ' Regeln in ' + [...gruppen.values()].filter(g => g.regeln.length).length + ' Kategorien');
for (const [, g] of gruppen) if (g.regeln.length)
  console.log('    ' + String(g.regeln.length).padStart(3) + '  ' + g.name);
console.log('');
console.log('  ⛔ Speicherschlüssel: ' + SPEICHER + '  (NICHT regelpruefung-v1 — dort liegen seine 55 Urteile)');
console.log('  ⚠️ Veröffentlichen kann die Routine nicht selbst — das braucht eine Sitzung.');
