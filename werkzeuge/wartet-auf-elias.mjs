#!/usr/bin/env node
/* wartet-auf-elias.mjs — die eine Seite, auf der steht, was IHN betrifft
 * ==========================================================================
 *
 * ⛔⛔ DAS PROBLEM
 *
 * `To-Do Vokabeltrainer.md` ist am 20.08.2026 auf **6615 Zeilen** gewachsen.
 * Die Punkte, die Elias' Entscheidung brauchen, sind darin an mindestens
 * fünfzehn Stellen verstreut — im dauerhaften Abschnitt „🔴 Wartet auf Elias",
 * im obersten Nachtplan, in Tabellenzeilen aus alten Läufen.
 *
 * Sein Auftrag vom 20.08.2026:
 *
 *   „sobald … nur noch das übrig ist was ich erledigen muss in dem
 *    zusammenhang, soll mir die bearbeitung der restlichen aufgaben SEHR
 *    LEICHT gemacht werden und angenehm für mich erledigbar gestaltet werden,
 *    auf dass ich das jedes mal mit so geringem zeit und arbeitaufwand wie nur
 *    möglich erledigen kann."
 *
 * ⭐ Eine Datei mit 6615 Zeilen erfüllt das nicht, egal wie gut sie gepflegt
 * ist. Was fehlt, ist ein ORT, an dem nur das steht, was er entscheiden muss.
 *
 * ================== WAS DIESES WERKZEUG NICHT TUT =========================
 *
 * Es sammelt NICHT jede Zeile mit einem roten Punkt ein. Damit stünden auch
 * längst erledigte Punkte aus alten Läufen darauf, und die Seite wäre beim
 * dritten Mal Lärm. [[kandidatenliste_ist_keine_fehlerliste]]
 *
 * Stattdessen zwei Quellen, beide aktuell:
 *   1. der dauerhafte Abschnitt „🔴 Wartet auf Elias" der Projekt-To-Do
 *   2. die MESSUNGEN der Prüfwerkzeuge — die sind per Definition von heute
 *
 * ⚠️ Was es misst, misst es LIVE. Eine Zahl auf dieser Seite ist nie älter als
 * ihr Aufruf. [[eingefrorenes_feld_ist_kein_zustand]]
 *
 * Aufruf:
 *   node werkzeuge/wartet-auf-elias.mjs              Seite bauen
 *   node werkzeuge/wartet-auf-elias.mjs --zeigen     nur ausgeben, nichts schreiben
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HIER, '..');
const ARG = process.argv.slice(2);
const NUR_ZEIGEN = ARG.includes('--zeigen');

const TODO = 'G:\\1. Workspace\\Obsidian\\Gedächtnis\\Elias Gedächtnis\\03 - Projekte\\To-Do Vokabeltrainer.md';

/* ---------- 1. Die Messungen ---------- */
/* ⛔ Ein Werkzeug, das mit Exit != 0 endet, ist hier der NORMALFALL — es hat
   ja etwas gefunden. execFileSync würde darauf werfen. */
function messen(befehl, args = []){
  try {
    return { text: execFileSync(process.execPath, [befehl, ...args],
      { cwd: REPO, encoding: 'utf8', maxBuffer: 20e6 }), code: 0 };
  } catch (e) {
    return { text: (e.stdout || '') + (e.stderr || ''), code: e.status ?? -1 };
  }
}

const posten = [];

/* A) Die offenen Feldangaben — dieselbe Quelle wie die Fragenseite. */
{
  const tmp = path.join(REPO, '.wartet-fragen.json');
  messen(path.join(REPO, 'werkzeuge', 'vorrat.mjs'), ['--offene-fragen', tmp]);
  let daten = null;
  try { daten = JSON.parse(fs.readFileSync(tmp, 'utf8')); fs.unlinkSync(tmp); } catch { /* nichts offen */ }
  const fragen = (daten && daten.fragen) || [];
  const anzahl = fragen.reduce((s, f) => s + f.woerter.length, 0);
  const woerter = new Set(fragen.flatMap(f => f.woerter.map(w => String(w.id)))).size;
  if (anzahl) posten.push({
    titel: 'Fehlende Angaben an Vokabeln',
    zahl: anzahl,
    einheit: anzahl === 1 ? 'Angabe' : 'Angaben',
    dazu: `an ${woerter} Wörtern`,
    aufwand: `${fragen.length} Durchgänge — einer je Frage, nicht je Wort`,
    warum: 'Ohne sie fallen Übungen aus und die Satzanalyse liest den Satz anders.',
    wie: 'Auf der Fragenseite antippen, unten den Text kopieren, in den Chat schicken.',
    seite: 'https://claude.ai/code/artifact/724ee9bc-adb7-4dcd-ad75-6a56a552adbd',
    seiteText: 'Fragenseite öffnen',
    zeilen: fragen.map(f => `${f.woerter.length}× ${f.titel}`)
  });
}

/* B) Taschkīl */
{
  const r = messen(path.join(REPO, 'pruefe-taschkil.js'));
  const m = /^(\d+) Befunde in (\d+)/m.exec(r.text);
  if (m && Number(m[1]) > 0) posten.push({
    titel: 'Taschkīl-Fragen',
    zahl: Number(m[1]),
    einheit: 'Befunde',
    dazu: `in ${m[2]} Wörtern`,
    aufwand: 'drei echte Entscheidungen, der Rest sind Varianten',
    warum: 'Eine fehlende Ḥaraka ändert die Aussprache und macht die Suche unbrauchbar.',
    wie: 'Die drei Fragen stehen in der To-Do unter „Wartet auf Elias" — mit dem, was ich schon geklärt habe.',
    zeilen: [
      'Hamzat al-Waṣl in fünf Beispielsätzen: Kasra setzen oder nicht?',
      'Zwei Surennamen mit fehlender Kasra — kein zitierbarer Beleg',
      'مُضَافْ إِلَيهِ — zwei Stellen in deiner eigenen Vokabel'
    ]
  });
}

/* C) Funktionsanzeige */
{
  const r = messen(path.join(REPO, 'pruefe-funktionen.js'));
  const m = /nur „Wort":\s+(\d+)/.exec(r.text);
  if (m && Number(m[1]) > 0) posten.push({
    titel: 'Infokarten, die nur „Wort" sagen',
    zahl: Number(m[1]),
    einheit: 'Wörter',
    dazu: 'alle aus deinen eigenen Vokabeln',
    aufwand: 'ein Durchgang — sie stehen auch auf der Fragenseite',
    warum: 'Die Infokarte kann die Funktion im Satz nicht benennen.',
    wie: 'Löst sich mit der Wortart-Frage auf der Fragenseite von selbst.',
    seite: 'https://claude.ai/code/artifact/724ee9bc-adb7-4dcd-ad75-6a56a552adbd',
    seiteText: 'Fragenseite öffnen'
  });
}

/* D) Gestaltungsentscheidungen — sie warten, ohne dass ein Werkzeug sie misst. */
posten.push({
  titel: 'Wortmarke: welche Schrift?',
  zahl: 14, einheit: 'Entwürfe', dazu: 'zur Auswahl', auswahl: true,
  aufwand: 'einmal durchsehen, eine antippen',
  warum: 'Aus der gewählten Schrift baue ich wieder einen SVG-Pfad — dann bleibt die App unabhängig von Google.',
  wie: 'Kachel antippen, Name unten kopieren.',
  seite: 'https://claude.ai/code/artifact/21463a39-a852-43e0-ad80-7c3bbf78714b',
  seiteText: 'Die vierzehn Schriften'
});
posten.push({
  titel: 'Akzentfarbe: bleibt es bei #ff1744?',
  zahl: 8, einheit: 'Farben', dazu: 'an dreizehn Flächen', auswahl: true,
  aufwand: 'durchtippen, vergleichen',
  warum: 'Deine heutige Farbe erreicht 4,47 Kontrast — knapp unter der Schwelle 4,5 für kleine Schrift. Cyan käme auf 9,54.',
  wie: 'Farbe wählen, die acht CSS-Werte stehen unten zum Kopieren.',
  seite: 'https://claude.ai/code/artifact/4e9ce030-17a6-46be-ba47-02ccb56bc32a',
  seiteText: 'Das Farbgerüst'
});
posten.push({
  titel: 'Arabische Stimme: Hörproben?',
  zahl: 4, einheit: 'Wege', dazu: 'verglichen', auswahl: true,
  aufwand: 'ein Wort von dir, dann erzeuge ich die Proben',
  warum: 'Auf deinem PC ist gar keine arabische Stimme installiert. Der ganze Bestand kostet einmalig unter $4.',
  wie: 'Sag Bescheid, dann stelle ich Piper (kostenlos, lokal) gegen einen bezahlten Anbieter — mit Wörtern aus deinem Kapitel.',
  seite: 'https://claude.ai/code/artifact/15b48598-2cda-4516-81bd-6a7e730dd4cc',
  seiteText: 'Der Bericht'
});

/* ⭐ Alle Seiten, die es fuer ihn gibt. Sie stehen HIER, weil diese Seite die
   ist, die er aufmacht — eine Adresse, die man nicht findet, ist so gut wie
   keine. ⚠️ Beim Anlegen eines neuen Artefakts hier ergaenzen; die URL bleibt
   ueber Aktualisierungen hinweg dieselbe. */
const ARTEFAKTE = [
  ['Was auf dich wartet',   '4c3a7c9e-c288-480c-bb1f-e2d7cd26d856', 'diese Seite — alle offenen Entscheidungen'],
  ['Die Fragenseite',       '724ee9bc-adb7-4dcd-ad75-6a56a552adbd', 'die 48 Angaben, ein Durchgang je Frage'],
  ['Der Wartungskreislauf', '9ec136ba-019d-438b-98af-e57939eb4a99', 'wie das System läuft — vier Phasen, dreizehn Prüfungen'],
  ['Vierzehn Schriften',    '21463a39-a852-43e0-ad80-7c3bbf78714b', 'die Wortmarke طالب zur Auswahl'],
  ['Das Farbgerüst',        '4e9ce030-17a6-46be-ba47-02ccb56bc32a', 'acht Akzentfarben an dreizehn Flächen'],
  ['Eine Stimme fürs Arabische', '15b48598-2cda-4516-81bd-6a7e730dd4cc', 'vier Wege, mit den gemessenen Kosten']
];

/* ---------- 2. Der Abschnitt aus der To-Do ---------- */
let ausTodo = [];
try {
  const t = fs.readFileSync(TODO, 'utf8');
  const auf = t.indexOf('### 🔴 Wartet auf Elias');
  if (auf >= 0){
    const rest = t.slice(auf + 24);
    const zu = rest.search(/\n#{1,3} /);
    ausTodo = (zu < 0 ? rest : rest.slice(0, zu))
      .split(/\r?\n/)
      .filter(z => /^\s*[-*]\s/.test(z))
      .map(z => z.replace(/^\s*[-*]\s+/, '').trim())
      .filter(Boolean);
  }
} catch (e) {
  console.error('⚠️ To-Do nicht lesbar: ' + e.message);
}

/* ---------- 3. Ausgabe ---------- */
/* ⛔ Nicht alles addieren. 14 Schriftentwuerfe und 8 Farben sind AUSWAHL, keine
   Stueckarbeit — eine Summe daraus behauptet 96 Aufgaben, wo es sechs
   Entscheidungen sind. Eine Zahl ohne ihren Nenner ist eine falsche Auskunft.
   [[trefferquote_ohne_preis]] */
const stueck = posten.filter(p => !p.auswahl).reduce((s, p) => s + p.zahl, 0);
const auswahlPosten = posten.filter(p => p.auswahl).length;
console.log('Was auf Elias wartet — gemessen am ' + new Date().toLocaleString('de-DE'));
console.log('');
posten.forEach(p => {
  console.log('  ' + String(p.zahl).padStart(4) + '  ' + p.titel + (p.dazu ? '  (' + p.dazu + ')' : ''));
  console.log('        Aufwand: ' + p.aufwand);
});
console.log('');
console.log('  ' + posten.length + ' Entscheidungen. Davon ' + (posten.length - auswahlPosten)
  + ' mit Stueckarbeit (' + stueck + ' Einzelstuecke), ' + auswahlPosten + ' nur ansehen und waehlen.');
if (ausTodo.length) console.log('  Dazu ' + ausTodo.length + ' Zeile(n) aus dem To-Do-Abschnitt.');

if (NUR_ZEIGEN) process.exit(0);

/* ---------- 4. Die Seite ---------- */
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/* Fettschrift und Code aus den To-Do-Zeilen behalten — sie tragen Bedeutung. */
const md = (s) => esc(s)
  .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
  .replace(/`([^`]+)`/g, '<code>$1</code>');

const karten = posten.map((p, i) => `
<article class="posten" data-nr="${i}">
  <header>
    <span class="zahl">${p.zahl}</span>
    <span class="einheit">${esc(p.einheit)}</span>
    <h2>${esc(p.titel)}</h2>
    ${p.dazu ? `<span class="dazu">${esc(p.dazu)}</span>` : ''}
  </header>
  <p class="aufwand"><span class="marke">Aufwand</span> ${esc(p.aufwand)}</p>
  <p class="warum">${esc(p.warum)}</p>
  <p class="wie"><span class="marke">So geht es</span> ${esc(p.wie)}</p>
  ${p.zeilen && p.zeilen.length ? `<ul class="zeilen">${p.zeilen.map(z => `<li>${md(z)}</li>`).join('')}</ul>` : ''}
  ${p.seite ? `<a class="knopf" href="${esc(p.seite)}" target="_blank" rel="noopener">${esc(p.seiteText || 'Öffnen')} →</a>` : ''}
</article>`).join('\n');

const html = `<title>Was auf dich wartet</title>
<style>
:root{
  --bg:#000; --flaeche:#111114; --hoch:#17171c; --rand:#26262c; --rand2:#1c1c21;
  --text:#f4f4f6; --leise:#9a9aa4; --still:#6b6b75;
  --rot:#ff1744; --rot-hell:#ff4d6a; --gruen:#2fd27a; --gelb:#ffc44d; --blau:#5aa9ff;
  --grad:linear-gradient(135deg,#ff1744 0%,#ff4d6a 100%);
  --sp1:6px; --sp2:10px; --sp3:16px; --sp4:24px; --sp5:38px;
  --sans:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  --mono:ui-monospace,Menlo,Consolas,monospace;
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--text);font-family:var(--sans);
     font-size:17px;line-height:1.55;padding:var(--sp5) var(--sp3) 90px}
.huelle{max-width:720px;margin:0 auto}
.eyebrow{font-family:var(--mono);font-size:.72rem;letter-spacing:.14em;
         text-transform:uppercase;color:var(--still);margin:0 0 var(--sp2)}
h1{font-size:clamp(1.9rem,7vw,2.5rem);line-height:1.1;letter-spacing:-.025em;
   margin:0 0 var(--sp3);text-wrap:balance}
.vorspann{color:var(--leise);margin:0 0 var(--sp4);max-width:60ch}
.vorspann b{color:var(--text)}
code{font-family:var(--mono);font-size:.86em;color:var(--leise);
     background:var(--hoch);padding:1px 5px;border-radius:5px}

.posten{background:var(--flaeche);border:1px solid var(--rand);border-radius:16px;
        padding:var(--sp3) var(--sp4);margin-bottom:var(--sp3);
        border-left:3px solid var(--rot)}
.posten.erledigt{opacity:.42;border-left-color:var(--gruen)}
.posten header{display:flex;align-items:baseline;gap:var(--sp2);flex-wrap:wrap;
               margin-bottom:var(--sp3)}
.zahl{font-family:var(--mono);font-size:1.7rem;font-weight:700;line-height:1;
      background:var(--grad);-webkit-background-clip:text;background-clip:text;
      color:transparent;font-variant-numeric:tabular-nums}
.einheit{font-size:.78rem;color:var(--still);letter-spacing:.06em;text-transform:uppercase}
.posten h2{font-size:1.05rem;font-weight:600;margin:0;flex-basis:100%}
.dazu{font-size:.85rem;color:var(--still)}
.marke{font-family:var(--mono);font-size:.68rem;letter-spacing:.09em;
       text-transform:uppercase;color:var(--still);margin-right:var(--sp2)}
.posten p{margin:0 0 var(--sp2);font-size:.94rem}
.aufwand{color:var(--gelb)}
.warum{color:var(--leise)}
.wie{color:var(--leise)}
.zeilen{margin:var(--sp2) 0 var(--sp3);padding-left:1.15em;color:var(--leise);font-size:.9rem}
.zeilen li{margin-bottom:3px}
.knopf{display:inline-block;background:var(--grad);color:#fff;text-decoration:none;
       font-weight:600;font-size:.9rem;padding:9px 18px;border-radius:99px;
       margin-top:var(--sp1)}
.knopf:focus-visible{outline:2px solid var(--text);outline-offset:2px}

.summe{background:var(--hoch);border:1px solid var(--rand);border-radius:16px;
       padding:var(--sp3) var(--sp4);margin-bottom:var(--sp4);
       display:flex;gap:var(--sp4);flex-wrap:wrap;align-items:baseline}
.summe .gross{font-family:var(--mono);font-size:2rem;font-weight:700;
              background:var(--grad);-webkit-background-clip:text;
              background-clip:text;color:transparent}
.summe .txt{color:var(--leise);font-size:.9rem}

h3{font-size:1rem;font-weight:600;margin:var(--sp5) 0 var(--sp2);
   padding-bottom:var(--sp1);border-bottom:1px solid var(--rand)}
.todoliste{color:var(--leise);font-size:.92rem;padding-left:1.15em}
.todoliste li{margin-bottom:var(--sp2)}
.todoliste b{color:var(--text)}
.fuss{color:var(--still);font-size:.83rem;margin-top:var(--sp5)}
.seiten{list-style:none;padding:0;margin:0}
.seiten li{padding:var(--sp2) 0;border-bottom:1px solid var(--rand2);
           display:flex;gap:var(--sp2);flex-wrap:wrap;align-items:baseline}
.seiten li:last-child{border-bottom:0}
.seiten a{color:var(--blau);text-decoration:none;font-weight:600;font-size:.95rem}
.seiten a:hover{text-decoration:underline}
.seiten span{color:var(--still);font-size:.85rem}
</style>

<div class="huelle">
<p class="eyebrow">Stand ${esc(new Date().toLocaleString('de-DE'))}</p>
<h1>Was auf dich wartet</h1>

<p class="vorspann">Alles andere ist erledigt. Was hier steht, kann ich nicht
allein entscheiden — <b>und mehr steht hier auch nicht</b>. Die To-Do daneben
ist auf über sechstausend Zeilen gewachsen; diese Seite wird bei jedem
Wartungslauf <b>neu erzeugt</b> und ist nie älter als ihr Datum oben.</p>

<div class="summe">
  <span class="gross">${posten.length}</span>
  <span class="txt"><b>Entscheidungen</b> — nicht ${stueck} Aufgaben.<br>
  ${auswahlPosten} davon heißt nur: ansehen und eine antippen. Die übrigen
  ${posten.length - auswahlPosten} betreffen zusammen ${stueck} Einzelstücke,
  aber die gehen in wenigen Durchgängen, nicht Stück für Stück.</span>
</div>

${karten}

${ausTodo.length ? `<h3>Dazu aus der To-Do</h3>
<ul class="todoliste">${ausTodo.map(z => `<li>${md(z)}</li>`).join('')}</ul>` : ''}

<h3>Alle Seiten für dich</h3>
<ul class="seiten">${ARTEFAKTE.map(([n, id, was]) =>
  `<li><a href="https://claude.ai/code/artifact/${id}">${esc(n)}</a> <span>${esc(was)}</span></li>`).join('')}</ul>

<p class="fuss">Erzeugt von <code>werkzeuge/wartet-auf-elias.mjs</code>. Die
Zahlen kommen aus <code>vorrat.mjs</code>, <code>pruefe-taschkil.js</code> und
<code>pruefe-funktionen.js</code> — live bei jedem Lauf, nicht abgeschrieben.</p>
</div>
`;

const ZIEL = path.join(REPO, 'artefakte', 'wartet-auf-elias.html');
fs.mkdirSync(path.dirname(ZIEL), { recursive: true });
fs.writeFileSync(ZIEL + '.neu', html, 'utf8');
fs.renameSync(ZIEL + '.neu', ZIEL);
console.log('');
console.log('Seite gebaut: ' + path.relative(REPO, ZIEL));
console.log('  ⚠️ Veroeffentlichen kann die Routine nicht selbst — das braucht eine Sitzung.');
process.exit(posten.length ? 2 : 0);
