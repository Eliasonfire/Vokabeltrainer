/* freigabe-seite.mjs -- Baustein D der Regelkette.
 *
 * Baut aus den Kandidatendateien eine Seite zum Durchgehen. Elias entscheidet
 * je Stelle: Regel daraus / verwerfen / spaeter. Das Ergebnis geht als
 * entscheidungen.json an Baustein E.
 *
 * Aufruf:
 *   node werkzeuge/freigabe-seite.mjs          Seite bauen
 *   node werkzeuge/freigabe-seite.mjs --oeffnen  Seite bauen und anzeigen
 *
 * Ergebnis: transcripts/kandidaten/freigabe.html
 *
 * ================== Warum die Seite offline und ohne Server ist ============
 *
 * Sie liegt neben den Daten und wird per Doppelklick geoeffnet. Kein Server,
 * keine Abhaengigkeit, kein Port, der belegt sein koennte. Das ist Absicht:
 * ein Pruefwerkzeug, das erst gestartet werden muss, wird nicht benutzt.
 *
 * ⚠️ Und es ist bewusst NICHT der Pruefserver auf Port 8124. Der hat einen
 * eigenen Speicher und zeigt einen anderen Stand als die App - schon einmal
 * hat das zu einer Stunde Suche nach einem Fehler gefuehrt, den es nicht gab.
 *
 * Die Entscheidungen liegen im Speicher des Browsers UND koennen jederzeit als
 * Datei gesichert werden. Beides, weil eines allein nicht reicht: Nur
 * Browserspeicher waere nach dem Leeren des Verlaufs weg, nur Datei hiesse,
 * dass jede Unterbrechung die Arbeit kostet.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KAND = path.join(REPO, 'transcripts', 'kandidaten');
const ZIEL = path.join(KAND, 'freigabe.html');

if (!fs.existsSync(KAND)) {
  console.log('Keine Kandidaten da. Erst: node werkzeuge/kandidaten.mjs --offen');
  process.exit(0);
}

const dateien = fs.readdirSync(KAND).filter(f => /^folge-\d+\.json$/.test(f)).sort();
if (!dateien.length) {
  console.log('Keine Kandidatendatei in transcripts/kandidaten/.');
  process.exit(0);
}

const folgen = dateien.map(f => JSON.parse(fs.readFileSync(path.join(KAND, f), 'utf8')));
const ohneAbgleich = folgen.filter(f => !f.abgeglichenGegen).map(f => f.folge);
const ohneSprecher = folgen.filter(f => !f.sprecherspur).map(f => f.folge);
const anzahl = folgen.reduce((a, f) => a + f.kandidaten.length, 0);

/* Wie sicher ist die Lehrererkennung?
 *
 * Der Lehrer wird nicht benannt, sondern ueber die Redezeit erkannt - er redet
 * am meisten. Das ist bei 90 % Redeanteil praktisch sicher und bei 48 % eine
 * Annahme. Gemessen am 18.08.2026: Folge 01 = 90,3 %, Folge 15 = 79,1 %,
 * Folge 16 = nur 48,5 % bei 9 Sprechern. Ohne diese Zahl auf der Seite sieht
 * "Lehrer 70 %" bei Folge 16 genauso belastbar aus wie bei Folge 01 - und der
 * Prozentwert an der Stelle ist dann in Wahrheit doppelt unsicher.
 */
const SICHER_AB = 60;
const wackelig = [];
for (const f of folgen) {
  const p = path.join(REPO, 'transcripts', 'sprecher',
    'folge-' + String(f.folge).padStart(2, '0') + '.json');
  if (!fs.existsSync(p)) continue;
  const m = JSON.parse(fs.readFileSync(p, 'utf8'));
  const anteil = m.redeanteil[m.vermutlichLehrer];
  f.lehrerAnteilFolge = anteil;
  f.lehrerSprecher = m.vermutlichLehrer;
  f.sprecherzahl = m.sprecher;
  if (anteil < SICHER_AB) wackelig.push({ folge: f.folge, anteil, sprecher: m.sprecher });
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nn = n => String(n).padStart(2, '0');

/* Die Daten werden als JSON eingebettet, nicht als HTML erzeugt: so kann die
   Seite selbst filtern und zaehlen, ohne dass hier Markup dupliziert wird. */
const daten = JSON.stringify(folgen).replace(/</g, '\\u003c');

const html = `<!doctype html>
<html lang="de">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Regelkandidaten — Freigabe</title>
<style>
  :root{
    --grund:#000; --karte:#111318; --rand:#262b33; --text:#e8eaed;
    --leise:#9aa1ab; --gold:#d8a13a; --gruen:#3fa860; --rot:#c4483f;
    --blau:#4a86c9;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--grund);color:var(--text);
       font:16px/1.6 "Segoe UI",system-ui,sans-serif;padding:0 0 120px}
  header{position:sticky;top:0;z-index:5;background:#000;
         border-bottom:1px solid var(--rand);padding:14px 20px}
  h1{margin:0 0 4px;font-size:19px;font-weight:600}
  .zaehler{color:var(--leise);font-size:14px}
  .zaehler b{color:var(--text)}
  main{max-width:900px;margin:0 auto;padding:0 16px}
  .hinweis{background:#1a1408;border:1px solid #4a3a12;border-left:3px solid var(--gold);
           padding:12px 16px;margin:16px 0;border-radius:6px;font-size:14px}
  .hinweis b{color:var(--gold)}
  h2{margin:32px 0 10px;font-size:17px;border-bottom:1px solid var(--rand);
     padding-bottom:8px}
  .karte{background:var(--karte);border:1px solid var(--rand);border-radius:8px;
         padding:14px 16px;margin:12px 0}
  .karte.ja{border-color:var(--gruen);background:#0d1a12}
  .karte.nein{opacity:.42}
  .karte.spaeter{border-color:var(--blau);background:#0c1420}
  .kopf{display:flex;flex-wrap:wrap;gap:10px;align-items:baseline;
        justify-content:space-between;margin-bottom:8px}
  .marke{font-weight:600;font-size:17px;font-variant-numeric:tabular-nums}
  .meta{color:var(--leise);font-size:13px;font-variant-numeric:tabular-nums}
  .begriffe{display:flex;flex-wrap:wrap;gap:5px;margin:8px 0}
  .begriffe span{background:#1c222b;border:1px solid var(--rand);border-radius:99px;
                 padding:1px 9px;font-size:12px;color:#b9c1cc}
  .wortlaut{background:#0a0c10;border:1px solid var(--rand);border-radius:6px;
            padding:11px 13px;margin:8px 0;font-size:14.5px;color:#cfd4da;
            max-height:8.5em;overflow:auto}
  .wortlaut.offen{max-height:none}
  .mehr{background:none;border:none;color:var(--blau);cursor:pointer;
        font-size:13px;padding:2px 0;text-decoration:underline}
  .aehnlich{font-size:13px;color:var(--leise);margin:6px 0}
  .aehnlich .warn{color:var(--gold)}
  .knoepfe{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
  button.w{font:inherit;font-size:14px;padding:6px 14px;border-radius:6px;
           border:1px solid var(--rand);background:#181c22;color:var(--text);
           cursor:pointer}
  button.w:hover{border-color:#3b434e}
  button.w[aria-pressed="true"]{font-weight:600}
  button.ja[aria-pressed="true"]{background:var(--gruen);border-color:var(--gruen);color:#04150a}
  button.nein[aria-pressed="true"]{background:var(--rot);border-color:var(--rot);color:#fff}
  button.spaeter[aria-pressed="true"]{background:var(--blau);border-color:var(--blau);color:#04121f}
  textarea{width:100%;margin-top:9px;background:#0a0c10;color:var(--text);
           border:1px solid var(--rand);border-radius:6px;padding:9px;
           font:inherit;font-size:14px;resize:vertical;min-height:2.6em}
  footer{position:fixed;bottom:0;left:0;right:0;background:#000;
         border-top:1px solid var(--rand);padding:11px 16px;
         display:flex;gap:10px;align-items:center;justify-content:center;
         flex-wrap:wrap}
  footer button{font:inherit;font-size:15px;padding:9px 18px;border-radius:6px;
                border:1px solid var(--rand);background:#181c22;color:var(--text);
                cursor:pointer}
  footer button.haupt{background:var(--gold);border-color:var(--gold);color:#1a1204;
                      font-weight:600}
  #stand{color:var(--leise);font-size:13px}
  @media (max-width:560px){ .kopf{flex-direction:column;gap:2px} }
</style>

<header>
  <h1>Regelkandidaten aus dem Unterricht</h1>
  <div class="zaehler" id="zaehler"></div>
</header>

<main>
  <div class="hinweis">
    <b>Das hier ist eine Vorauswahl, keine Fehlerliste.</b>
    Gemessen findet die Vorauswahl rund zwei Drittel der bekannten Regeln, wenn
    man ein Drittel des Unterrichts liest — der Rest bleibt liegen. Eine Stelle,
    die fehlt, ist also kein Beweis, dass dort nichts war.
    <span id="luecken"></span>
  </div>
  <div id="liste"></div>
</main>

<footer>
  <span id="stand"></span>
  <button id="sichern" class="haupt">Entscheidungen sichern</button>
  <button id="kopieren">In die Zwischenablage</button>
</footer>

<script>
const FOLGEN = ${daten};
const SPEICHER = 'regelkandidaten-entscheidungen-v1';

/* Ob der Browser hier ueberhaupt etwas behalten kann - wird GEPRUEFT, nicht
   angenommen. Beim Test in der Vorschau war der Speicher gesperrt ("Storage is
   disabled inside data: URLs"); der try/catch weiter unten haette das still
   geschluckt, und beim naechsten Neuladen waere die Arbeit von einer Stunde
   weg gewesen - ohne dass irgendetwas darauf hingewiesen haette. */
let SPEICHER_GEHT = false;
try {
  localStorage.setItem(SPEICHER + '-probe', '1');
  SPEICHER_GEHT = localStorage.getItem(SPEICHER + '-probe') === '1';
  localStorage.removeItem(SPEICHER + '-probe');
} catch(e) { SPEICHER_GEHT = false; }

let wahl = {};
if (SPEICHER_GEHT) {
  try { wahl = JSON.parse(localStorage.getItem(SPEICHER) || '{}'); } catch(e) { wahl = {}; }
}

const schluessel = (f, k) => 'f' + f + '-' + Math.round(k.von);
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

function zeichne(){
  const liste = document.getElementById('liste');
  liste.innerHTML = '';
  for (const f of FOLGEN){
    const h = document.createElement('h2');
    const teil = Math.round((f.anteilGelesen || 0) * 100);
    h.textContent = 'Folge ' + String(f.folge).padStart(2,'0')
      + ' — ' + f.kandidaten.length + ' Stellen'
      + (teil ? ' (' + teil + ' % der Folge)' : '');
    liste.appendChild(h);

    for (const k of f.kandidaten){
      const id = schluessel(f.folge, k);
      const e = wahl[id] || {};
      const karte = document.createElement('div');
      karte.className = 'karte' + (e.wahl ? ' ' + e.wahl : '');

      const lehrer = k.lehreranteil === null || k.lehreranteil === undefined
        ? 'Lehreranteil nicht gemessen'
        : 'Lehrer ' + Math.round(k.lehreranteil * 100) + ' %';
      const begriffe = Object.keys(k.begriffe || {})
        .map(b => '<span>' + esc(b) + '</span>').join('');

      let aehn = '';
      if (k.aehnlicheRegeln && k.aehnlicheRegeln.length){
        const a = k.aehnlicheRegeln[0];
        const hoch = a.wert >= 0.45;
        aehn = '<div class="aehnlich">' + (hoch
          ? '<span class="warn">≈ ähnelt stark</span> '
          : 'am ehesten wie ')
          + esc(a.id) + ' (Folge ' + String(a.folge).padStart(2,'0')
          + ', ' + esc(a.zeitmarke) + ') · ' + a.wert + '</div>';
      }

      karte.innerHTML =
        '<div class="kopf"><span class="marke">' + esc(k.zeitmarke) + '</span>'
        + '<span class="meta">' + k.punkte + ' Punkte · ' + lehrer + '</span></div>'
        + '<div class="begriffe">' + begriffe + '</div>'
        + '<div class="wortlaut">' + esc(k.text) + '</div>'
        + '<button class="mehr">ganzen Wortlaut zeigen</button>'
        + aehn
        + '<div class="knoepfe">'
        +   '<button class="w ja" data-w="ja">Regel daraus</button>'
        +   '<button class="w nein" data-w="nein">verwerfen</button>'
        +   '<button class="w spaeter" data-w="spaeter">später</button>'
        + '</div>'
        + '<textarea placeholder="Worum geht es? (ein Satz genügt — hilft beim Eintragen)"></textarea>';

      const wl = karte.querySelector('.wortlaut');
      const mehr = karte.querySelector('.mehr');
      mehr.onclick = () => {
        wl.classList.toggle('offen');
        mehr.textContent = wl.classList.contains('offen')
          ? 'Wortlaut einklappen' : 'ganzen Wortlaut zeigen';
      };

      const ta = karte.querySelector('textarea');
      ta.value = e.notiz || '';
      ta.oninput = () => {
        wahl[id] = Object.assign({}, wahl[id], {
          notiz: ta.value, folge: f.folge, von: k.von, zeitmarke: k.zeitmarke });
        sichereLokal();
      };

      for (const b of karte.querySelectorAll('.w')){
        b.setAttribute('aria-pressed', String(e.wahl === b.dataset.w));
        b.onclick = () => {
          const neu = e.wahl === b.dataset.w ? null : b.dataset.w;
          wahl[id] = Object.assign({}, wahl[id], {
            wahl: neu, folge: f.folge, von: k.von, zeitmarke: k.zeitmarke,
            notiz: ta.value });
          if (!neu && !ta.value) delete wahl[id];
          sichereLokal(); zeichne();
        };
      }
      liste.appendChild(karte);
    }
  }
  zaehle();
}

function sichereLokal(){
  if (!SPEICHER_GEHT) return;
  try { localStorage.setItem(SPEICHER, JSON.stringify(wahl)); } catch(e){
    SPEICHER_GEHT = false; warneSpeicher();
  }
}

/* Sichtbar machen, wenn nichts behalten wird. Eine stille Fehlfunktion ist
   hier schlimmer als gar keine Seite: sie sieht aus, als wuerde sie arbeiten. */
function warneSpeicher(){
  if (SPEICHER_GEHT || document.getElementById('speicherwarnung')) return;
  const d = document.createElement('div');
  d.id = 'speicherwarnung';
  d.className = 'hinweis';
  d.style.cssText = 'background:#210d0c;border-color:#5a1f1c;border-left-color:#c4483f';
  d.innerHTML = '<b style="color:#e0776d">Dieser Browser behält hier nichts.</b> '
    + 'Die Entscheidungen stehen nur im Arbeitsspeicher — beim Neuladen oder '
    + 'Schließen sind sie weg. Deshalb zwischendurch auf '
    + '<b>„Entscheidungen sichern"</b> drücken, nicht erst am Ende.';
  const liste = document.getElementById('liste');
  liste.parentNode.insertBefore(d, liste);
}

function zaehle(){
  const w = Object.values(wahl);
  const n = s => w.filter(x => x.wahl === s).length;
  const gesamt = FOLGEN.reduce((a,f) => a + f.kandidaten.length, 0);
  const entschieden = w.filter(x => x.wahl).length;
  document.getElementById('zaehler').innerHTML =
    '<b>' + entschieden + '</b> von <b>' + gesamt + '</b> entschieden · '
    + n('ja') + ' als Regel · ' + n('nein') + ' verworfen · '
    + n('spaeter') + ' später';
  document.getElementById('stand').textContent =
    entschieden === gesamt && gesamt
      ? 'Alles entschieden — jetzt sichern.'
      : (gesamt - entschieden) + ' noch offen';
}

function alsJson(){
  const raus = [];
  for (const [id, e] of Object.entries(wahl)){
    if (!e.wahl && !e.notiz) continue;
    raus.push({ id, folge: e.folge, von: e.von, zeitmarke: e.zeitmarke,
                wahl: e.wahl || null, notiz: e.notiz || '' });
  }
  raus.sort((a,b) => a.folge - b.folge || a.von - b.von);
  return JSON.stringify({ stand: new Date().toISOString(),
                          entscheidungen: raus }, null, 1);
}

document.getElementById('sichern').onclick = () => {
  const b = new Blob([alsJson()], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b);
  a.download = 'entscheidungen.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};

document.getElementById('kopieren').onclick = async (ev) => {
  try {
    await navigator.clipboard.writeText(alsJson());
    ev.target.textContent = 'kopiert ✓';
    setTimeout(() => ev.target.textContent = 'In die Zwischenablage', 1800);
  } catch(e) {
    /* Kein Zugriff auf die Zwischenablage (kommt bei file:// vor). Dann den
       Text zeigen statt zu behaupten, es habe geklappt. */
    const t = document.createElement('textarea');
    t.value = alsJson(); t.style.cssText =
      'position:fixed;inset:8%;z-index:99;font-size:13px';
    document.body.appendChild(t); t.select();
    ev.target.textContent = 'bitte von Hand kopieren';
  }
};

document.getElementById('luecken').innerHTML = ${JSON.stringify(
  (ohneSprecher.length
    ? `<br><b>Ohne Sprechertrennung:</b> Folge ${ohneSprecher.map(nn).join(', ')} — `
      + 'dort ist nicht unterschieden, ob der Lehrer oder ein Schüler spricht. '
      + 'Eine Schülerantwort darf nicht als Regel in die App.'
    : '')
  + (ohneAbgleich.length
    ? `<br><b>Ohne Abgleich:</b> Folge ${ohneAbgleich.map(nn).join(', ')} — `
      + 'node werkzeuge/abgleich.mjs war hier noch nicht dran.'
    : '')
  + (wackelig.length
    ? '<br><b>Lehrer nur vermutet:</b> '
      + wackelig.map(w => `Folge ${nn(w.folge)} (${w.anteil} % Redeanteil bei `
        + `${w.sprecher} Sprechern)`).join(', ')
      + ' — der Lehrer wird über die Redezeit erkannt, nicht benannt. Bei über '
      + '80 % ist das sicher; hier ist es eine Annahme, und der Prozentwert an '
      + 'jeder Stelle ist entsprechend unsicher.'
    : ''))};

zeichne();
warneSpeicher();
</script>
</html>
`;

fs.writeFileSync(ZIEL, html, 'utf8');
const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
console.log(`Freigabeseite gebaut: ${path.relative(REPO, ZIEL)} (${kb} KB)`);
console.log(`${anzahl} Stellen aus ${folgen.length} Folgen`
  + ` (${folgen.map(f => nn(f.folge)).join(', ')}).`);
if (ohneSprecher.length) {
  console.log(`⚠️  ohne Sprechertrennung: Folge ${ohneSprecher.map(nn).join(', ')}`);
}
if (ohneAbgleich.length) {
  console.log(`⚠️  ohne Abgleich: Folge ${ohneAbgleich.map(nn).join(', ')}`);
}
console.log('');
console.log('Oeffnen per Doppelklick. Entscheidungen bleiben im Browser gespeichert;');
console.log('mit "Entscheidungen sichern" als entscheidungen.json in diesen Ordner');
console.log('legen - daraus baut Baustein E die Regeln.');

if (process.argv.includes('--oeffnen')) {
  execFile('cmd', ['/c', 'start', '', ZIEL], () => {});
}
