/* icon-vorschau.mjs -- baut vorschau-icon.html aus den Entwürfen in
   entwuerfe-icon/ und legt sie im Hauptordner ab.
   ==========================================================================

   ⛔ WARUM DIE SVGs EINGEBETTET WERDEN UND NICHT VERLINKT

   `werkzeuge/veroeffentlichen.mjs` baut seine Weißliste aus zwei Quellen:
   `index.html` und `sw.js`. Vorschauseiten kommen zusätzlich dazu, aber ihre
   VERWEISE werden nicht verfolgt (Zeile 44 dort: nur `vorschau*.html` im
   Hauptordner). Eine Seite, die `entwuerfe-icon/d-ilm.svg` lädt, wird also
   ausgeliefert — und zeigt auf Elias' Handy leere Kästen.

   Genau das ist am 18.08.2026 schon einmal passiert: die erste Vorschauseite
   lag in `entwuerfe-icon/` und das Vergleichsicon des Korantrainers lud nicht.
   Aufgefallen ist es nur, weil jemand hingesehen hat.

   Deshalb: eine einzige Datei im Hauptordner, alles darin. Sie hängt an
   nichts, und was sie zeigt, ist das, was ausgeliefert wurde.

   AUFRUF
     node werkzeuge/icon-vorschau.mjs
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORDNER = path.join(WURZEL, 'entwuerfe-icon');
const ZIEL   = path.join(WURZEL, 'vorschau-icon.html');

/* Reihenfolge und Beschriftung von Hand: die Dateinamen allein sagen nicht,
   was die Idee war, und genau die braucht Elias zum Aussuchen. */
const ENTWUERFE = [
  { datei: 'vergleich-korantrainer.svg', name: 'Zum Vergleich: Korantrainer',
    idee: 'Das aufgeschlagene Buch. Davon soll sich das neue Icon deutlich unterscheiden — daneben halten, nicht einzeln ansehen.', vergleich: true },
  { datei: '../icon.svg', name: 'Jetzige Fassung',
    idee: 'Rote Scheibe mit عِلْم. Sie ist nicht schlecht — aber sie hat keinen schwarzen Grund und wirkt neben dem Korantrainer laut.' },
  { datei: 'd-ilm.svg', name: 'D — عِلْم mit rotem Strich',
    idee: 'Das Wort auf Schwarz, darunter eine rote Grundlinie wie eine Unterstreichung im Heft.' },
  { datei: 'e-qalam.svg', name: 'E — das Schreibrohr (قَلَم)',
    idee: '„Der mit dem Schreibrohr gelehrt hat“ (96:4). Die Spitze ist das Rote.' },
  { datei: 'f-lampe.svg', name: 'F — die Lampe',
    idee: 'Wissen als Licht. Der Docht ist das einzige Rote.' },
  { datei: 'g-wurzel.svg', name: 'G — die Wurzel',
    idee: 'Drei Buchstaben, aus denen die Wortfamilie wächst.' },
  { datei: 'h-haraka.svg', name: 'H — عِلْم mit rotem Vokalzeichen',
    idee: 'Das Rote ist eine Ḥarakah. Genau daran arbeitest du — und genau das unterscheidet die App vom Korantrainer.' },
  { datei: 'i-wurzel-drei.svg', name: 'I — die drei Wurzelplätze',
    idee: 'Ohne Buchstaben: drei Felder, von rechts gelesen, das erste rot. Darunter wachsen zwei Wortformen heraus.' },
  { datei: 'j-bogen.svg', name: 'J — عِلْم im Fortschrittsbogen',
    idee: 'Der Ring ist der Lernstand und schliesst sich bewusst nicht — beim Vokabellernen ist man nie fertig.' }
];

/* Eine SVG-Datei so vorbereiten, dass sie mehrfach in einer Seite stehen kann.
   ⚠️ Ids innerhalb der Datei (Verläufe!) würden sich sonst zwischen den
   Kopien in die Quere kommen: die zweite Kopie greift auf die id der ersten
   zu, und in manchen Browsern verschwindet die Füllung. Deshalb bekommt jede
   Datei ein eigenes Präfix auf alle ihre Ids. */
function einbetten(roh, praefix){
  let s = roh.replace(/<\?xml[^>]*\?>/g, '').replace(/<!DOCTYPE[^>]*>/gi, '');
  const ids = [...s.matchAll(/\sid\s*=\s*"([^"]+)"/g)].map(m => m[1]);
  for (const id of new Set(ids)){
    const neu = praefix + '-' + id;
    s = s.split('id="' + id + '"').join('id="' + neu + '"');
    s = s.split('url(#' + id + ')').join('url(#' + neu + ')');
    s = s.split('href="#' + id + '"').join('href="#' + neu + '"');
  }
  /* Die Größe steuert das CSS, nicht die Datei. */
  s = s.replace(/<svg\b/, '<svg preserveAspectRatio="xMidYMid meet"');
  return s.trim();
}

const karten = ENTWUERFE.map((e, i) => {
  const p = path.join(ORDNER, e.datei);
  if (!fs.existsSync(p)) return { fehlt: e.datei };
  const svg = einbetten(fs.readFileSync(p, 'utf8'), 'e' + i);
  return { ...e, svg };
});

const fehlend = karten.filter(k => k.fehlt);
if (fehlend.length){
  console.error('⛔ Diese Dateien fehlen, nichts geschrieben:');
  fehlend.forEach(k => console.error('   ' + k.fehlt));
  process.exit(2);
}

const groessen = [['g192','112'],['g96','64'],['g48','40']];
const block = k => `
  <div class="karte${k.vergleich ? ' vergleich' : ''}">
    <div class="name">${k.name}</div>
    <div class="idee">${k.idee}</div>
    <div class="groessen">
      ${groessen.map(([cls, px]) => `<figure><div class="huelle ${cls}">${k.svg}</div><figcaption>${px}</figcaption></figure>`).join('\n      ')}
      <figure class="rund"><div class="huelle g96">${k.svg}</div><figcaption>rund</figcaption></figure>
    </div>
  </div>`;

const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>App-Icon — Entwürfe zur Auswahl</title>
<style>
  :root{ --bg:#000; --flaeche:#111014; --linie:#26222a; --text:#f3ecef; --dim:#9c9095; --rot:#ff2d4f; --sp:16px; }
  *{box-sizing:border-box}
  body{ margin:0; background:var(--bg); color:var(--text);
        font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
        line-height:1.5; padding:var(--sp); }
  h1{font-size:1.35rem; margin:.2em 0 .1em}
  p.hinweis{color:var(--dim); margin:.2em 0 1.4em; max-width:60ch}
  .netz{display:grid; gap:var(--sp); grid-template-columns:repeat(auto-fill,minmax(280px,1fr))}
  .karte{ background:var(--flaeche); border:1px solid var(--linie); border-radius:16px; padding:var(--sp); }
  .karte.vergleich{border-color:var(--rot)}
  .name{font-weight:600; margin-bottom:.15em}
  .idee{color:var(--dim); font-size:.87rem; margin-bottom:.9em; min-height:3.2em}
  /* Die drei Groessen, in denen er es wirklich sieht. Ein Icon, das nur bei
     512 px gut aussieht, ist kein Icon. */
  .groessen{display:flex; align-items:flex-end; gap:18px; flex-wrap:wrap}
  .groessen figure{margin:0; text-align:center}
  .huelle{overflow:hidden; border-radius:22%}
  .huelle svg{display:block; width:100%; height:100%}
  .g192{width:112px;height:112px}
  .g96 {width:64px; height:64px}
  .g48 {width:40px; height:40px}
  .groessen figcaption{color:var(--dim); font-size:.72rem; margin-top:.35em}
  /* Der Zuschnitt, den Android macht. Wer hier etwas verliert, verliert es
     auf dem Handy wirklich. */
  .rund .huelle{border-radius:50%}
  .fuss{color:var(--dim); font-size:.85rem; margin-top:2em; max-width:70ch}
  code{background:#1a171c; padding:.1em .35em; border-radius:5px}
</style>
</head>
<body>
<h1>App-Icon — Entwürfe zur Auswahl</h1>
<p class="hinweis">
  OLED-Schwarz wie beim Korantrainer, Akzent in knalligem Rot
  (<code>#ff2d4f</code>), klar unterscheidbar vom aufgeschlagenen Buch.
  <b>A bis C sind verworfen</b> (Karteikarten, Umdrehen, Leitner-Boxen).
  Jede Reihe zeigt dieselbe Zeichnung in <b>112, 64 und 40 px</b> — und ganz
  rechts rund zugeschnitten, so wie Android es tut.
</p>

<div class="netz">${karten.map(block).join('\n')}
</div>

<p class="fuss">
  ⚠️ Der arabische Schriftzug in D, H und J ist <b>nicht gezeichnet</b>, sondern
  derselbe Pfad wie im bisherigen Icon — aus einer echten Schrift abgeleitet.
  Ein selbst gemaltes arabisches Wort wäre der eine Fehler, der sich nie von
  allein meldet.<br>
  Sag mir einfach den Buchstaben. Dann baue ich daraus <code>icon.svg</code>,
  <code>icon-maskable.svg</code> und den Eintrag im <code>manifest.json</code>.
</p>
</body>
</html>
`;

fs.writeFileSync(ZIEL, html, 'utf8');
console.log(`vorschau-icon.html geschrieben: ${karten.length} Entwuerfe, ${Math.round(Buffer.byteLength(html,'utf8')/1024)} KB.`);
console.log('Die Zeichnungen stehen EINGEBETTET darin - die Seite haengt an keiner weiteren Datei.');
