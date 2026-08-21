/* regelauswahl-seite.mjs -- baut das Artefakt, auf dem Elias entscheidet,
 * welche Grammatikregeln im Satzmodus trainierbar sein sollen.
 *
 * Aufruf:  node werkzeuge/regelauswahl-seite.mjs
 * Ergebnis: regelauswahl.html im Projektordner (nicht ausgeliefert, die Seite
 *           wird als Artefakt veroeffentlicht).
 *
 * WOZU
 *
 * Elias am 19.08.2026: „es wäre auch gut wenn du ein artefakt erstellt mit den
 * 95 regeln die ich dann in dem satzbau modus trainieren kann und alle anderen
 * sollen dann nicht da drin sein. … sobald neue regel gibt, soll sie
 * automatisch in den satzmodus rein gehen als modus (wenn es ein größeres thema
 * ist, kleinere vereinzelnte außnahme regeln müssen nicht) und dann sammeln und
 * ich entscheide dann was wirklich bleibt. am besten auch irgendwie als
 * routine."
 *
 * Deshalb ein SKRIPT und keine von Hand gepflegte Seite: bei jeder neuen Regel
 * einmal laufen lassen, und die Liste stimmt wieder. Von Hand gepflegt waere
 * sie nach dem dritten Mal veraltet.
 *
 * ⛔ WAS ICH NICHT KANN, und das bestimmt den Aufbau
 *
 * Seine Haekchen liegen im localStorage SEINES Browsers. Ich komme da nicht
 * heran — weder lesen noch sichern ([[regelpruefung_artefakt]]). Deshalb hat
 * die Seite unten einen Kasten, aus dem er die Auswahl als Textzeile kopieren
 * und mir schicken kann. Ohne den waere seine Arbeit in seinem Browser
 * gefangen.
 *
 * ⛔ EIGENER SPEICHERSCHLUESSEL. Das Regelpruefungs-Artefakt benutzt
 * `regelpruefung-v1`. Hier ist es `satzmodus-auswahl-v1` — wer beide auf
 * denselben Schluessel legt, loescht ihm seine Antworten aus dem anderen.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const W = path.join(HIER, '..') + path.sep;
const lade = (d, n) => new Function(`${fs.readFileSync(W + d, 'utf8')};return ${n};`)();

const G = lade('grammar-data.js', 'GRAMMAR_RULES');
const T = lade('grammar-data.js', 'SENTENCE_TAGS');
const TH = lade('grammar-data.js', 'SATZ_THEMEN').filter(x => x.muster);

const saetze = {};
for (const [sid, tags] of Object.entries(T)) for (const t of tags) (saetze[t.ruleId] ||= new Set()).add(sid);

/* Schneidet nach dem letzten ganzen Wort ab und haengt ein Auslassungs-
   zeichen an. Faellt kein Leerzeichen in die letzten 30 Zeichen, wird hart
   geschnitten — bei einem Wort ohne Leerzeichen geht es nicht anders. */
function kuerze(s, max){
  if (s.length <= max) return s;
  const stueck = s.slice(0, max);
  const luecke = stueck.lastIndexOf(' ');
  return (luecke > max - 30 ? stueck.slice(0, luecke) : stueck).replace(/[ ,;:.]+$/, '') + ' …';
}

const REGELN = G.map(r => {
  const kat = TH.filter(x => x.muster.test(r.id)).map(x => x.name);
  let q = '';
  if (r.source && r.source.folge != null) q = `Folge ${r.source.folge}`;
  else if (r.buchQuelle) q = String(r.buchQuelle);
  else if (r.ergaenzung) q = 'Buch';
  if (r.source2) q += ` · Schlüssel ${r.source2.schluessel}`;
  return {
    id: r.id,
    name: String(r.name || '').trim(),
    kat: kat[0] || '—',
    n: (saetze[r.id] || new Set()).size,
    q: q || '—',
    /* ⚠️ An der WORTGRENZE kuerzen, nicht bei Zeichen 170. Sonst endet jede
       zweite Erklaerung mitten im Wort ("diese sind fuer di") und sieht aus
       wie ein Datenfehler statt wie eine Kuerzung. */
    e: kuerze(String(r.shortExplanation || '').replace(/\s+/g, ' '), 165),
  };
});

const reihe = TH.map(x => x.name).concat(['—']);
REGELN.sort((a, b) => (reihe.indexOf(a.kat) - reihe.indexOf(b.kat)) || (b.n - a.n));

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const html = `<title>Regelauswahl Satzmodus</title>
<style>
/* Bewusst nur DUNKEL. Elias arbeitet nachts und die App ist OLED-schwarz;
   ein heller Zwilling waere hier eine Ueberraschung, kein Dienst. Alle Farben
   stehen deshalb ausdruecklich da, damit die Seite auf jedem Untergrund haelt. */
:root{
  --grund:#0a0d0c; --flaeche:#121614; --flaeche2:#181e1b; --rand:#252d29;
  --text:#eef2f0; --dim:#98a29d; --faint:#6d7873;
  --ja:#3ddc97; --ja-wash:rgba(61,220,151,.10); --ja-rand:#1d5e42;
  --nein:#ff6b6b; --nein-wash:rgba(255,107,107,.09);
  --ui:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  --ar:'Amiri','Traditional Arabic','Segoe UI',serif;
}
*{box-sizing:border-box;}
body{margin:0;background:var(--grund);color:var(--text);font-family:var(--ui);
     font-size:15px;line-height:1.65;padding:0 0 80px;}
.wrap{max-width:62ch;margin:0 auto;padding:0 18px;}
header{padding:30px 0 18px;}
h1{font-size:1.45rem;line-height:1.25;margin:0 0 10px;letter-spacing:-.01em;}
.lead{color:var(--dim);font-size:.92rem;margin:0 0 4px;}
.lead b{color:var(--text);}
.zitat{border-left:2px solid var(--ja-rand);padding:2px 0 2px 14px;margin:16px 0 0;
       color:var(--dim);font-size:.86rem;font-style:italic;}

/* Zaehler bleibt oben stehen — sonst weiss er nach 40 Regeln nicht mehr, wo er steht. */
.stand{position:sticky;top:0;z-index:5;background:var(--grund);
       border-bottom:1px solid var(--rand);padding:12px 0;margin:22px 0 0;}
.stand .zahl{font-size:1.5rem;font-weight:800;font-variant-numeric:tabular-nums;
             color:var(--ja);line-height:1;}
.stand .von{color:var(--faint);font-size:.82rem;}
.balken{height:5px;background:var(--flaeche2);border-radius:99px;margin-top:9px;overflow:hidden;}
.balken div{height:100%;background:var(--ja);border-radius:99px;transition:width .2s;}

.knopfreihe{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0 0;}
.mini{background:var(--flaeche);border:1px solid var(--rand);color:var(--dim);
      border-radius:99px;padding:6px 13px;font:inherit;font-size:.78rem;font-weight:600;
      cursor:pointer;}
.mini:hover{border-color:var(--faint);color:var(--text);}
.mini.an{background:var(--ja-wash);border-color:var(--ja-rand);color:var(--ja);}

h2{font-size:.78rem;text-transform:uppercase;letter-spacing:.09em;color:var(--faint);
   margin:34px 0 10px;font-weight:700;display:flex;align-items:baseline;gap:9px;}
h2 em{font-style:normal;color:var(--dim);font-size:.9em;font-weight:600;
      font-variant-numeric:tabular-nums;}
h2 button{margin-left:auto;background:none;border:none;color:var(--faint);
          font:inherit;font-size:.75rem;text-transform:none;letter-spacing:0;
          cursor:pointer;text-decoration:underline;padding:0;}
h2 button:hover{color:var(--text);}

.regel{display:flex;gap:12px;align-items:flex-start;background:var(--flaeche);
       border:1px solid var(--rand);border-radius:13px;padding:12px 13px;margin-bottom:8px;
       cursor:pointer;transition:border-color .15s,background .15s;}
.regel:hover{border-color:var(--faint);}
.regel.aus{background:var(--nein-wash);border-color:#3a2020;}
.regel.aus .name{color:var(--faint);text-decoration:line-through;text-decoration-thickness:1px;}
.regel.aus .erkl{opacity:.45;}
.haken{flex:0 0 22px;height:22px;margin-top:2px;border-radius:7px;
       border:1.5px solid var(--ja-rand);background:var(--ja-wash);
       display:flex;align-items:center;justify-content:center;
       font-size:13px;color:var(--ja);font-weight:900;}
.regel.aus .haken{border-color:#5a2a2a;background:transparent;color:var(--nein);}
.mitte{min-width:0;flex:1;}
.name{font-weight:700;font-size:.93rem;line-height:1.35;font-family:var(--ar);}
.erkl{color:var(--dim);font-size:.81rem;line-height:1.5;margin-top:3px;}
.meta{color:var(--faint);font-size:.72rem;margin-top:5px;display:flex;gap:10px;
      flex-wrap:wrap;font-variant-numeric:tabular-nums;}
.meta code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.95em;}
.wenig{color:#e8b04b;}

.aus-kasten{margin:40px 0 0;background:var(--flaeche);border:1px solid var(--rand);
            border-radius:15px;padding:16px;}
.aus-kasten h3{margin:0 0 6px;font-size:.95rem;}
.aus-kasten p{margin:0 0 12px;color:var(--dim);font-size:.84rem;}
textarea{width:100%;min-height:110px;background:var(--grund);color:var(--text);
         border:1px solid var(--rand);border-radius:10px;padding:11px;
         font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.78rem;
         line-height:1.55;resize:vertical;}
.gross{background:var(--ja-wash);border:1px solid var(--ja-rand);color:var(--ja);
       border-radius:11px;padding:10px 18px;font:inherit;font-weight:700;font-size:.86rem;
       cursor:pointer;margin-top:10px;}
.gross:hover{background:rgba(61,220,151,.17);}
footer{color:var(--faint);font-size:.78rem;margin-top:34px;padding-top:16px;
       border-top:1px solid var(--rand);}
</style>

<div class="wrap">
<header>
  <h1>Welche Regeln willst du im Satzmodus üben?</h1>
  <p class="lead">Alle <b>${REGELN.length}</b> Grammatikregeln der App. <b>Standard ist „drin"</b> —
     tipp die an, die du <b>nicht</b> im Satzmodus haben willst.</p>
  <p class="zitat">„sobald neue regel gibt, soll sie automatisch in den satzmodus rein gehen
     … und dann sammeln und ich entscheide dann was wirklich bleibt."</p>

  <div class="stand">
    <div><span class="zahl" id="zahl">${REGELN.length}</span> <span class="von">von ${REGELN.length} im Satzmodus</span></div>
    <div class="balken"><div id="balken" style="width:100%"></div></div>
  </div>

  <div class="knopfreihe">
    <button class="mini" data-filter="alle">Alle zeigen</button>
    <button class="mini" data-filter="wenig">nur mit 1–2 Sätzen</button>
    <button class="mini" data-filter="ohnekat">nur ohne Kategorie</button>
    <button class="mini" data-filter="aus">nur die aussortierten</button>
  </div>
</header>

<main id="liste"></main>

<div class="aus-kasten">
  <h3>Deine Auswahl zum Schicken</h3>
  <p>⛔ Ich kann deine Häkchen <b>nicht lesen</b> — sie liegen in deinem Browser.
     Kopier den Text hier und schick ihn mir, dann trage ich es ein.</p>
  <textarea id="ausgabe" readonly></textarea>
  <button class="gross" id="kopieren">In die Zwischenablage</button>
</div>

<footer>
  Erzeugt aus <code>grammar-data.js</code> — bei neuen Regeln neu bauen mit
  <code>node werkzeuge/regelauswahl-seite.mjs</code>. Deine Häkchen bleiben dabei
  erhalten, sie hängen an der Regel-ID.
</footer>
</div>

<script>
const REGELN = ${JSON.stringify(REGELN)};
const SPEICHER = 'satzmodus-auswahl-v1';

/* ⛔ HIER WURDE DAS SPEICHERN STILL VERSCHLUCKT (bis 21.08.2026): das Laden
   stand zwar in einem try, aber sichern() fing den Fehler mit einem leeren
   catch ab. Ist der Speicher gesperrt — und bei einer lokal geoeffneten
   Datei ist er das oft —, verschwinden Elias' Haekchen lautlos, und beim
   naechsten Oeffnen faengt er von vorn an.
   [[localstorage_kann_werfen]] [[ausfall_ist_unsichtbar_gebaut]]

   Uebernommen aus werkzeuge/freigabe-seite.mjs, wo die Loesung seit einem
   echten Vorfall steht und nie zu den Nachbarseiten gewandert ist:
   [[entscheidung_gilt_fuer_das_zweite_werkzeug]] */
let SPEICHER_GEHT = false;
try {
  localStorage.setItem(SPEICHER + '-probe', '1');
  SPEICHER_GEHT = localStorage.getItem(SPEICHER + '-probe') === '1';
  localStorage.removeItem(SPEICHER + '-probe');
} catch(e) { SPEICHER_GEHT = false; }

let aus = new Set();
if (SPEICHER_GEHT) {
  try { aus = new Set(JSON.parse(localStorage.getItem(SPEICHER) || '[]')); } catch(e){}
}

/* Sichtbar machen, wenn nichts behalten wird. Eine stille Fehlfunktion ist
   hier schlimmer als gar keine Seite: sie sieht aus, als wuerde sie
   arbeiten. */
function warneSpeicher(){
  if (SPEICHER_GEHT || document.getElementById('speicherwarnung')) return;
  const d = document.createElement('div');
  d.id = 'speicherwarnung';
  d.style.cssText = 'background:#210d0c;border:1px solid #5a1f1c;border-left:3px solid #c4483f;'
    + 'padding:.7rem .9rem;border-radius:6px;margin:0 0 1rem;font-size:.9rem;line-height:1.5';
  d.innerHTML = '<b style="color:#e0776d">Dieser Browser behält hier nichts.</b> '
    + 'Deine Haken stehen nur im Arbeitsspeicher — beim Neuladen oder Schließen '
    + 'sind sie weg. Kopier dir den Text unten heraus, bevor du die Seite verlässt.';
  const anker = document.getElementById('liste');
  if (anker && anker.parentNode) anker.parentNode.insertBefore(d, anker);
}
let filter = 'alle';

const sichtbar = r =>
  filter === 'alle'    ? true :
  filter === 'wenig'   ? r.n <= 2 :
  filter === 'ohnekat' ? r.kat === '—' :
  filter === 'aus'     ? aus.has(r.id) : true;

function zeichne(){
  const liste = document.getElementById('liste');
  const gezeigt = REGELN.filter(sichtbar);
  let html = '', letzteKat = null;
  for (const r of gezeigt){
    if (r.kat !== letzteKat){
      letzteKat = r.kat;
      const inKat = REGELN.filter(x => x.kat === r.kat);
      const drin = inKat.filter(x => !aus.has(x.id)).length;
      html += '<h2>' + (r.kat === '—' ? 'ohne Kategorie' : r.kat)
            + ' <em>' + drin + '/' + inKat.length + '</em>'
            + '<button data-kat="' + r.kat + '">' + (drin ? 'alle raus' : 'alle rein') + '</button></h2>';
    }
    const off = aus.has(r.id);
    html += '<div class="regel' + (off ? ' aus' : '') + '" data-id="' + r.id + '">'
          + '<div class="haken">' + (off ? '\\u2715' : '\\u2713') + '</div>'
          + '<div class="mitte">'
          + '<div class="name">' + r.name + '</div>'
          + '<div class="erkl">' + r.e + '</div>'
          + '<div class="meta"><span class="' + (r.n <= 2 ? 'wenig' : '') + '">'
          + r.n + ' Satz' + (r.n === 1 ? '' : 'e') + '</span><span>' + r.q + '</span>'
          + '<code>' + r.id + '</code></div>'
          + '</div></div>';
  }
  liste.innerHTML = html || '<p style="color:var(--faint)">Nichts in dieser Ansicht.</p>';

  const drin = REGELN.length - aus.size;
  document.getElementById('zahl').textContent = drin;
  document.getElementById('balken').style.width = (drin / REGELN.length * 100) + '%';
  document.getElementById('ausgabe').value = aus.size
    ? 'Nicht im Satzmodus (' + aus.size + ' von ' + REGELN.length + '):\\n'
      + [...aus].sort().join('\\n')
    : 'Alle ' + REGELN.length + ' Regeln bleiben im Satzmodus.';
  document.querySelectorAll('.mini').forEach(b =>
    b.classList.toggle('an', b.dataset.filter === filter));
}

function sichern(){
  if (!SPEICHER_GEHT) return;
  try { localStorage.setItem(SPEICHER, JSON.stringify([...aus])); }
  catch(e) { SPEICHER_GEHT = false; warneSpeicher(); }
}

document.addEventListener('click', e => {
  const f = e.target.closest('[data-filter]');
  if (f){ filter = f.dataset.filter; zeichne(); return; }
  const k = e.target.closest('[data-kat]');
  if (k){
    const inKat = REGELN.filter(x => x.kat === k.dataset.kat);
    const allesRaus = inKat.every(x => aus.has(x.id));
    inKat.forEach(x => allesRaus ? aus.delete(x.id) : aus.add(x.id));
    sichern(); zeichne(); return;
  }
  const r = e.target.closest('.regel');
  if (r){
    aus.has(r.dataset.id) ? aus.delete(r.dataset.id) : aus.add(r.dataset.id);
    sichern(); zeichne(); return;
  }
  if (e.target.id === 'kopieren'){
    const t = document.getElementById('ausgabe');
    t.select();
    navigator.clipboard.writeText(t.value).then(
      () => { e.target.textContent = 'kopiert \\u2713'; setTimeout(() => e.target.textContent = 'In die Zwischenablage', 1600); },
      () => { e.target.textContent = 'markiert \\u2014 jetzt kopieren'; });
  }
});
zeichne();
/* ⛔ AUCH BEIM START warnen: war der Speicher von Anfang an gesperrt, ist
   SPEICHER_GEHT schon false, sichern() kehrt sofort um und die Warnung
   kaeme nie — der haeufigere Fall also stumm. */
warneSpeicher();
</script>
`;

const ziel = W + 'regelauswahl.html';
fs.writeFileSync(ziel, html, 'utf8');
console.log(`  ${REGELN.length} Regeln, ${TH.length} Kategorien`);
console.log(`  ohne Kategorie: ${REGELN.filter(r => r.kat === '—').length}`);
console.log(`  mit 1-2 Saetzen: ${REGELN.filter(r => r.n <= 2).length}`);
console.log(`  geschrieben: ${ziel} (${Math.round(html.length / 1024)} KB)`);
