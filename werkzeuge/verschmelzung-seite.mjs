/* verschmelzung-seite.mjs -- baut das Artefakt, auf dem Elias entscheidet,
 * welche aehnlichen Regeln zu EINER werden sollen.
 *
 * Aufruf:  node werkzeuge/verschmelzung-seite.mjs
 * Ergebnis: verschmelzung.html im Projektordner (nicht ausgeliefert, die Seite
 *           wird als Artefakt veroeffentlicht).
 *
 * WOZU
 *
 * Elias am 19.08.2026: „zb حَرْفُ الجَرِّ und die regel für fi und ala oder min
 * und li, sie sollten irgendwie zu einer regel werden statt 5 unterschiedliche
 * die das gleiche meinen."
 *
 * ⛔ NUR VORLEGEN, NICHT VERSCHMELZEN. Seine Reihenfolge ist ausdruecklich:
 * erst sortiert er aus, DANN wird zusammengefasst — und nur unter dem, was
 * bleibt. Er hat selbst gesagt, es sei womoeglich verfrueht, solange nicht
 * alle 95 Regeln beurteilt sind. Die Seite steht deshalb bereit, sie draengt
 * nicht.
 *
 * ⛔ EIGENER SPEICHERSCHLUESSEL: `verschmelzung-v1`.
 * Drei Artefakte liegen bereits im selben localStorage —
 * `regelpruefung-v1`, `satzmodus-auswahl-v1`, `regelkandidaten-v1`. Wer einen
 * davon wiederverwendet, loescht ihm die Antworten aus dem anderen Artefakt,
 * ohne dass irgendetwas meldet.
 *
 * ⛔ SEINE ANTWORTEN LIEGEN IN SEINEM BROWSER, ich komme nicht heran — weder
 * lesen noch sichern. Deshalb unten der Kasten zum Kopieren; ohne ihn waere
 * seine Arbeit in seinem Browser gefangen.
 *
 * WOHER DIE GRUPPEN KOMMEN
 *
 * Aus der Messung vom 19.08.2026 (Wortueberschneidung der Erklaerungen +
 * Namensstamm + geteilte Saetze): 8 Gruppen, 21 Regeln. Sie steht hier
 * FEST im Skript und wird nicht neu berechnet — die Messung war ein
 * Kandidatenfinder, und welche Gruppen vorgelegt werden, ist eine Entscheidung
 * und keine Rechnung.
 *
 * ⚠️ Beim Uebertragen aus der To-Do waren zwei IDs falsch: die Tabelle kuerzt
 * ab (`-genus-01`), und die Regel heisst `mubtada-khabar-genus-01`, nicht
 * `mubtada-genus-01`. Deshalb prueft das Skript unten JEDE ID gegen
 * grammar-data.js und bricht ab, wenn eine fehlt. Eine erfundene ID faellt
 * sonst erst auf, wenn Elias davorsitzt.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const W = path.join(HIER, '..') + path.sep;
const lade = (d, n) => new Function(`${fs.readFileSync(W + d, 'utf8')};return ${n};`)();

const RULES = lade('grammar-data.js', 'GRAMMAR_RULES');
const TAGS  = lade('grammar-data.js', 'SENTENCE_TAGS');
const VOCAB = lade('vocab-data.js', 'VOCAB_DATA');
const LEHR  = lade('lehrbuch-saetze.js', 'LEHRBUCH_SAETZE');

const satzVon = {};
VOCAB.concat(LEHR).forEach(s => { satzVon[String(s.id)] = s; });
const markVon = {};
Object.entries(TAGS).forEach(([sid, liste]) =>
  liste.forEach(t => (markVon[t.ruleId] = markVon[t.ruleId] || []).push({ sid, text: t.matchText })));

/* Die acht Gruppen. `hinweis` ist das, was GEGEN das Verschmelzen spricht —
   bewusst mitgeliefert, damit die Seite kein Verkaufsprospekt ist. */
const GRUPPEN = [
  {
    id: 'harf-jarr', titel: 'حَرْف جَرّ', unter: 'Die Gruppe, die du selbst genannt hast',
    ids: ['harf-jarr-01', 'harf-jarr-fi-ala-01', 'harf-jarr-min-ila-01',
          'harf-jarr-li-01', 'harf-jarr-idafa-01'],
    dafuer: 'Eine Grundregel und vier Nachträge, die je zwei Partikel aus einer '
          + 'Folge nachreichen. Historisch gewachsen: der Lehrer hat die Partikel '
          + 'über fünf Folgen verteilt eingeführt (F4, F4, F5, F7, F9), nicht weil '
          + 'sie verschieden sind, sondern weil sie nacheinander drankamen.',
    dagegen: 'Zwei der fünf haben nur EINE Markierung — beim Zusammenfassen '
           + 'musst du entscheiden, welche Beispielsätze zur neuen Regel gehören.'
  },
  {
    id: 'isara', titel: 'Hinweiswörter', unter: 'هَذَا · هَذِهِ · ذَلِكَ · تِلْكَ',
    ids: ['ismul-isara-hadha-01', 'ismul-isara-hadhihi-01',
          'ismul-isara-tilka-01', 'ismul-isara-dhalika-01'],
    dafuer: 'Vier Regeln nach demselben Bauplan — Hinweiswort plus Nomen.',
    dagegen: '⚠️ Hier spricht das Meiste GEGEN das Zusammenfassen: das sind vier '
           + 'verschiedene Wörter, und der Lehrer hat sie einzeln über vier Folgen '
           + 'eingeführt (F1, F2, F9, F10). Nah/fern und männlich/weiblich sind '
           + 'genau der Unterschied, den man lernen muss. Eine Sammelregel würde '
           + 'ihn zudecken.'
  },
  {
    id: 'mubtada', titel: 'مُبْتَدَأ', unter: 'Grundregel und Genus-Zusatz',
    ids: ['mubtada-khabar-01', 'mubtada-khabar-genus-01'],
    dafuer: 'Die zweite ist ein Zusatz zur ersten: was für den Satzbau gilt, '
          + 'gilt auch fürs Geschlecht.',
    dagegen: '⚠️ Bei der ersten steht noch eine andere Entscheidung an '
           + '(Nachtplan 4: ihr Beleg zeigt auf die Ankündigung in Folge 03 statt '
           + 'auf die Definition in Folge 14). Das erst klären, sonst führt die '
           + 'zusammengefasste Regel den falschen Beleg mit.'
  },
  {
    id: 'asma', titel: 'الأَسْمَاء الخَمْسَة', unter: 'Älter gegen neuer',
    ids: ['asma-khamsa-01', 'asma-khamsa-vollstaendig-01'],
    dafuer: 'Klarer Fall von „dieselbe Sache, zwei Stände": Folge 16 nennt zwei '
          + 'der fünf Nomen, das Buch alle fünf. Die zweite Regel ersetzt die '
          + 'erste inhaltlich.',
    dagegen: 'Beide haben nur je eine Markierung — es geht also wenig verloren, '
           + 'aber es kommt auch wenig zusammen.'
  },
  {
    id: 'schams', titel: 'Sonnen- und Mondbuchstaben', unter: 'Regel und Merkhilfe',
    ids: ['schams-qamar-01', 'schams-qamar-merkhilfe-01'],
    dafuer: 'Beide aus Folge 3, beide mit acht Markierungen — die zweite ist '
          + 'die Eselsbrücke zur ersten, kein eigener Lehrsatz.',
    dagegen: '⭐ Du hast beide bereits von den Karteikarten genommen. Vielleicht '
           + 'erledigt sich die Frage damit von selbst.'
  },
  {
    id: 'zuruf', titel: 'ظُرُوف المَكَان', unter: 'Drei Wörter gegen dreizehn',
    ids: ['zuruf-makan-01', 'zuruf-makan-weitere-01'],
    dafuer: 'Wie bei den fünf Nomen: Folge 12 nennt drei Ortswörter, das Buch '
          + 'dreizehn. Dieselbe Regel, größere Liste.',
    dagegen: 'Die zweite hat nur eine Markierung — die Beispiele der ersten '
           + 'müssten mitwandern.'
  },
  {
    id: 'tamarbuta', titel: 'تَاء مَرْبُوطَة', unter: 'Eine davon hast du abbestellt',
    ids: ['ta-marbuta-fem-01', 'ta-marbuta-grenzen-01'],
    dafuer: 'Beide behandeln, wofür das ة steht und wofür nicht.',
    dagegen: '⚠️ `ta-marbuta-fem-01` ist deine Abbestellung vom 29.07. — sie hat '
           + 'acht Markierungen und soll trotzdem nicht erscheinen. Zusammenfassen '
           + 'würde sie dir zurückholen. Das ist vermutlich der Grund, warum diese '
           + 'Gruppe überhaupt aufgefallen ist, und kein echter Kandidat.'
  },
  {
    id: 'alifmaqsura', titel: 'أَلِف مَقْصُورَة', unter: 'Schreibung gegen Kasus',
    ids: ['alif-maqsura-01', 'alif-maqsura-unveraenderlich-01'],
    dafuer: 'Dasselbe Zeichen, zwei Folgen (F5 und F12).',
    dagegen: '⚠️ Inhaltlich sind es zwei verschiedene Aussagen: die eine erklärt, '
           + 'WIE man es schreibt, die andere, dass sich die Endung NICHT ändert. '
           + 'Zusammen wäre es eine Regel mit zwei Kernen.'
  },
];

/* ⛔ Vorabprüfung: jede ID muss es geben. Ohne sie baut das Skript stillschweigend
   eine Seite mit leeren Kästen — und der Fehler fällt erst auf, wenn Elias
   davorsitzt. */
const fehlend = GRUPPEN.flatMap(g => g.ids).filter(id => !RULES.some(r => r.id === id));
if (fehlend.length) {
  console.error('⛔ Diese Regel-IDs gibt es nicht: ' + fehlend.join(', '));
  process.exit(1);
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));

function quelle(r) {
  if (r.source) return 'Folge ' + r.source.folge + (r.source.approxTimestamp ? ' · ' + r.source.approxTimestamp : '');
  if (r.source2) return 'Schlüssel ' + r.source2.schluessel + ', Lektion ' + r.source2.lektion;
  return 'nur Buch';
}

function regelKarte(id) {
  const r = RULES.find(x => x.id === id);
  const m = markVon[id] || [];
  const beispiele = m.slice(0, 3).map(x => {
    const s = satzVon[x.sid];
    return '<li><b>' + esc(x.text) + '</b>' + (s ? ' <span class="satz">' + esc(String(s.sentAr).slice(0, 60)) + '</span>' : '') + '</li>';
  }).join('');
  const marken = [];
  if (r.ausgeblendet) marken.push('<span class="marke weg">ausgeblendet</span>');
  if (r.nichtAufKarteikarten) marken.push('<span class="marke weg">nicht auf Karteikarten</span>');
  return '<article class="regel">'
    + '<header><h4>' + esc(r.name) + '</h4>' + marken.join('') + '</header>'
    + '<div class="id">' + esc(id) + ' · ' + esc(quelle(r)) + ' · ' + m.length + ' Markierung' + (m.length === 1 ? '' : 'en') + '</div>'
    + '<p>' + esc(r.shortExplanation) + '</p>'
    + (beispiele ? '<ul class="bsp">' + beispiele + '</ul>' : '<p class="leer">keine Markierung</p>')
    + '</article>';
}

const gruppenHtml = GRUPPEN.map((g, i) => `
<section class="gruppe" data-gruppe="${g.id}">
  <div class="gkopf">
    <div>
      <span class="nr">${i + 1} von ${GRUPPEN.length}</span>
      <h2 lang="ar">${esc(g.titel)}</h2>
      <div class="unter">${esc(g.unter)} · ${g.ids.length} Regeln</div>
    </div>
    <div class="wahl">
      <button class="w" data-w="zusammen">zu einer Regel</button>
      <button class="w" data-w="getrennt">getrennt lassen</button>
      <button class="w" data-w="spaeter">später</button>
    </div>
  </div>
  <div class="waagen">
    <div class="waage dafuer"><h3>Dafür</h3><p>${esc(g.dafuer)}</p></div>
    <div class="waage dagegen"><h3>Dagegen</h3><p>${esc(g.dagegen)}</p></div>
  </div>
  <div class="regeln">${g.ids.map(regelKarte).join('')}</div>
  <label class="notiz">Notiz an mich (freiwillig)
    <textarea rows="2" placeholder="z.B. „nur die ersten drei zusammen""></textarea></label>
</section>`).join('');

const seite = `<!doctype html>
<html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Ähnliche Regeln zusammenfassen?</title>
<style>
:root{
  --bg:#0a0a0b; --karte:#141416; --karte2:#1c1c1f; --rand:#2a2a2e; --rand2:#3a3a40;
  --text:#f2f2f3; --dim:#a8a8ae; --faint:#76767c;
  --rot:#ff4d5e; --rot-w:rgba(255,77,94,.12); --gruen:#2fd07a; --gruen-w:rgba(47,208,122,.12);
  --gelb:#f5b942; --gelb-w:rgba(245,185,66,.12);
  --ar:1.55em;
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);
  font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
  padding:20px 16px 80px;}
.huelle{max-width:940px;margin:0 auto}
h1{font-size:1.5rem;margin:0 0 6px}
.vorwort{color:var(--dim);font-size:.94rem;margin:0 0 8px}
.vorwort b{color:var(--text)}
.warnung{background:var(--gelb-w);border:1px solid var(--gelb);border-radius:10px;
  padding:12px 14px;margin:16px 0 26px;font-size:.92rem;color:var(--text)}
.gruppe{background:var(--karte);border:1px solid var(--rand);border-radius:14px;
  padding:16px;margin:0 0 20px}
.gruppe.beantwortet{border-color:var(--rand2)}
.gkopf{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap}
.nr{font-size:.75rem;color:var(--faint);text-transform:uppercase;letter-spacing:.06em}
.gkopf h2{margin:2px 0 2px;font-size:1.3rem}
.unter{color:var(--dim);font-size:.86rem}
.wahl{display:flex;gap:6px;flex-wrap:wrap}
.w{background:var(--karte2);border:1px solid var(--rand2);color:var(--dim);
  border-radius:999px;padding:7px 13px;font:inherit;font-size:.84rem;font-weight:600;cursor:pointer}
.w:hover{border-color:var(--faint);color:var(--text)}
.w.an[data-w="zusammen"]{background:var(--gruen-w);border-color:var(--gruen);color:var(--gruen)}
.w.an[data-w="getrennt"]{background:var(--rot-w);border-color:var(--rot);color:var(--rot)}
.w.an[data-w="spaeter"]{background:var(--gelb-w);border-color:var(--gelb);color:var(--gelb)}
.waagen{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0}
@media(max-width:640px){.waagen{grid-template-columns:1fr}}
.waage{border:1px solid var(--rand);border-radius:10px;padding:10px 12px;font-size:.88rem}
.waage h3{margin:0 0 4px;font-size:.76rem;text-transform:uppercase;letter-spacing:.06em}
.waage p{margin:0;color:var(--dim)}
.dafuer h3{color:var(--gruen)} .dagegen h3{color:var(--rot)}
.regeln{display:grid;gap:8px}
.regel{background:var(--karte2);border:1px solid var(--rand);border-radius:10px;padding:11px 13px}
.regel header{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.regel h4{margin:0;font-size:1rem;font-weight:700}
.marke{font-size:.7rem;padding:2px 7px;border-radius:999px;font-weight:700}
.marke.weg{background:var(--rot-w);color:var(--rot);border:1px solid var(--rot)}
.regel .id{font-size:.74rem;color:var(--faint);font-family:ui-monospace,monospace;margin:3px 0 7px}
.regel p{margin:0;color:var(--dim);font-size:.89rem}
.bsp{margin:8px 0 0;padding:0 0 0 16px;font-size:.86rem;color:var(--faint)}
.bsp b{color:var(--text)}
.satz{color:var(--faint);margin-inline-start:6px}
.leer{color:var(--faint);font-style:italic}
:is(h2,.bsp b,.satz){font-feature-settings:"kern"}
[lang=ar],.bsp b,.satz{font-size:var(--ar);line-height:1.9}
.notiz{display:block;margin-top:12px;font-size:.8rem;color:var(--faint)}
.notiz textarea{display:block;width:100%;margin-top:5px;background:var(--karte2);
  border:1px solid var(--rand);border-radius:8px;color:var(--text);
  padding:8px 10px;font:inherit;font-size:.88rem;resize:vertical}
.fuss{background:var(--karte);border:1px solid var(--rand);border-radius:14px;padding:16px;margin-top:26px}
.fuss h2{margin:0 0 8px;font-size:1.1rem}
.stand{color:var(--dim);font-size:.9rem;margin:0 0 10px}
#ausgabe{width:100%;height:130px;background:var(--bg);border:1px solid var(--rand);
  border-radius:8px;color:var(--text);padding:10px;font:12px/1.5 ui-monospace,monospace;resize:vertical}
.knoepfe{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
.kopier{background:var(--rot);border:0;color:#fff;border-radius:999px;padding:9px 16px;
  font:inherit;font-weight:700;cursor:pointer}
.zuruecksetzen{background:transparent;border:1px solid var(--rand2);color:var(--faint);
  border-radius:999px;padding:9px 16px;font:inherit;cursor:pointer}
</style></head><body><div class="huelle">

<h1>Ähnliche Regeln zusammenfassen?</h1>
<p class="vorwort">Deine Worte vom 19.08.: <i>„zb حَرْفُ الجَرِّ und die regel für
fi und ala oder min und li, sie sollten irgendwie zu einer regel werden statt 5
unterschiedliche die das gleiche meinen."</i></p>
<p class="vorwort">Gemessen wurden <b>${GRUPPEN.length} Gruppen mit ${GRUPPEN.flatMap(g=>g.ids).length} Regeln</b>
(Wortüberschneidung der Erklärungen, Namensstamm und geteilte Sätze). Deine
Gruppe حَرْف جَرّ ist Treffer Nummer eins.</p>
<!-- ⛔ NICHT „حَرْف-جَرّ-Gruppe" schreiben. Der Bidi-Algorithmus dreht den
     arabischen Lauf, und die Bindestriche landen auf der falschen Seite —
     im Bildschirmfoto vom 19.08. stand dort „-حَرْف جَرّ" mit vorangestelltem
     Strich. Ein Leerzeichen kennt keine Richtung, ein Bindestrich schon. -->

<div class="warnung">⚠️ <b>Das ist ein Kandidatenfinder, kein Urteil.</b> Die
Messung erkennt Wortlaut, nicht Lehrabsicht — bei den Hinweiswörtern spricht
das Meiste <b>gegen</b> das Zusammenfassen. Deshalb steht bei jeder Gruppe
beides. <b>Nichts ist verschmolzen</b>, und nichts passiert, bis du entschieden
hast. Du hattest selbst gesagt, es sei womöglich verfrüht, solange nicht alle
95 Regeln beurteilt sind — die Seite wartet, sie drängt nicht.</div>

${gruppenHtml}

<div class="fuss">
  <h2>Und dann schick mir das hier</h2>
  <p class="stand" id="stand">Noch nichts beantwortet.</p>
  <textarea id="ausgabe" readonly></textarea>
  <div class="knoepfe">
    <button class="kopier" id="btnKopieren">In die Zwischenablage</button>
    <button class="zuruecksetzen" id="btnZuruecksetzen">Alles zurücksetzen</button>
  </div>
  <p class="stand" style="margin-top:10px">Deine Antworten liegen nur in diesem
  Browser (<code>verschmelzung-v1</code>). Ich kann sie nicht lesen — ohne diesen
  Kasten bliebe deine Arbeit hier gefangen.</p>
</div>

</div><script>
/* ⛔ Eigener Schluessel. regelpruefung-v1, satzmodus-auswahl-v1 und
   regelkandidaten-v1 liegen im selben localStorage — wer einen davon
   wiederverwendet, loescht Elias die Antworten aus dem anderen Artefakt. */
const SCHLUESSEL = 'verschmelzung-v1';
const stand = JSON.parse(localStorage.getItem(SCHLUESSEL) || '{}');

function sichern(){
  localStorage.setItem(SCHLUESSEL, JSON.stringify(stand));
  zeichnen();
}
function zeichnen(){
  document.querySelectorAll('.gruppe').forEach(sec => {
    const g = sec.dataset.gruppe;
    const e = stand[g] || {};
    sec.classList.toggle('beantwortet', !!e.wahl);
    sec.querySelectorAll('.w').forEach(b => b.classList.toggle('an', b.dataset.w === e.wahl));
    const t = sec.querySelector('textarea');
    if (document.activeElement !== t) t.value = e.notiz || '';
  });
  const n = Object.values(stand).filter(x => x.wahl).length;
  const gesamt = document.querySelectorAll('.gruppe').length;
  document.getElementById('stand').textContent = n === 0
    ? 'Noch nichts beantwortet.'
    : n + ' von ' + gesamt + ' Gruppen beantwortet' + (n === gesamt ? ' — fertig.' : '.');
  const zeilen = [...document.querySelectorAll('.gruppe')].map(sec => {
    const g = sec.dataset.gruppe, e = stand[g] || {};
    if (!e.wahl) return null;
    const titel = sec.querySelector('h2').textContent;
    return '- ' + g + ' (' + titel + '): ' + e.wahl + (e.notiz ? '  // ' + e.notiz : '');
  }).filter(Boolean);
  document.getElementById('ausgabe').value = zeilen.length
    ? 'VERSCHMELZUNG ' + zeilen.length + '/' + gesamt + '\\n' + zeilen.join('\\n')
    : '';
}
document.addEventListener('click', e => {
  const b = e.target.closest('.w');
  if (!b) return;
  const g = b.closest('.gruppe').dataset.gruppe;
  stand[g] = stand[g] || {};
  /* Nochmal auf dieselbe Antwort tippen nimmt sie zurueck — sonst kaeme man
     aus einer versehentlichen Wahl nicht mehr heraus. */
  stand[g].wahl = stand[g].wahl === b.dataset.w ? null : b.dataset.w;
  sichern();
});
document.addEventListener('input', e => {
  if (!e.target.matches('.notiz textarea')) return;
  const g = e.target.closest('.gruppe').dataset.gruppe;
  stand[g] = stand[g] || {};
  stand[g].notiz = e.target.value;
  localStorage.setItem(SCHLUESSEL, JSON.stringify(stand));
  zeichnen();
});
document.getElementById('btnKopieren').addEventListener('click', async () => {
  const t = document.getElementById('ausgabe');
  if (!t.value) return;
  const knopf = document.getElementById('btnKopieren');
  try { await navigator.clipboard.writeText(t.value); knopf.textContent = 'Kopiert'; }
  catch { t.select(); document.execCommand('copy'); knopf.textContent = 'Kopiert'; }
  setTimeout(() => { knopf.textContent = 'In die Zwischenablage'; }, 1600);
});
document.getElementById('btnZuruecksetzen').addEventListener('click', () => {
  if (!confirm('Alle Antworten auf dieser Seite löschen?')) return;
  Object.keys(stand).forEach(k => delete stand[k]);
  sichern();
});
zeichnen();
</script></body></html>`;

const ZIEL = W + 'verschmelzung.html';
fs.writeFileSync(ZIEL, seite, 'utf8');
console.log('  ok  ' + path.basename(ZIEL) + ' gebaut');
console.log('      ' + GRUPPEN.length + ' Gruppen, ' + GRUPPEN.flatMap(g => g.ids).length + ' Regeln');
console.log('      Speicherschluessel: verschmelzung-v1  (nicht regelpruefung-v1 / satzmodus-auswahl-v1 / regelkandidaten-v1)');
console.log('      ' + (seite.length / 1024).toFixed(0) + ' KB');
