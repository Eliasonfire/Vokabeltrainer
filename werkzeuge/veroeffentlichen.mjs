/* Veroeffentlichen auf Cloudflare Pages.
 *
 * ⚠️ WARUM DIESES SKRIPT UEBERHAUPT EXISTIERT
 *
 * Seit dem Umzug (11.08.2026) liefert NICHT mehr GitHub Pages die App aus,
 * sondern Cloudflare Pages - und zwar per Direktupload (Wrangler), NICHT ueber
 * eine GitHub-Anbindung. Das heisst: ein `git push` allein bringt gar nichts
 * mehr ins Netz. Wer nur pusht, hat ein aktuelles Repo und eine alte Seite,
 * ohne jede Fehlermeldung.
 *
 * Elias' Frage dazu war berechtigt: "warum solltest du das vergessen, ist das
 * ueberhaupt eine option die jemals eintreffen koennte? weil ich werde es
 * wahrscheinlich nicht merken." Antwort: ja, sicher sogar - eine neue Sitzung
 * startet ohne Erinnerung, und die Gewohnheit aus Monaten GitHub Pages lautet
 * "pushen = fertig". Deshalb gibt es EINEN Befehl, der beides tut.
 *
 * ⚠️ WEISSLISTE, NICHT SCHWARZLISTE
 *
 * Im Projektordner liegen 268 MB Transkripte und der arabicroots-Vokabelabzug.
 * Beides darf nach den AGB (Ziffer 3.7 und 9) nicht veroeffentlicht werden.
 * Eine Ausschlussliste waere hier der falsche Ansatz: alles Neue waere per
 * Voreinstellung dabei. Deshalb wird die Liste der auszuliefernden Dateien
 * AUS DER APP SELBST abgeleitet - aus dem, was index.html und sw.js wirklich
 * laden - und alles andere bleibt draussen.
 *
 * Aufruf:
 *   node werkzeuge/veroeffentlichen.mjs --pruefen     nur zeigen, nichts tun
 *   node werkzeuge/veroeffentlichen.mjs               bauen und hochladen
 *   node werkzeuge/veroeffentlichen.mjs --mit-daten   inkl. arabicroots-Abzug
 *
 * --mit-daten verweigert den Dienst, solange nicht belegt ist, dass BEIDE
 * Adressen (pages.dev und die eigene Domain) hinter dem Access-Login liegen.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

/* ⚠️ fileURLToPath, NICHT die URL von Hand zerlegen: der Ordner heisst
   "1. Workspace" mit Leerzeichen, und das steht in import.meta.url als %20.
   Selbstgebaute Pfadableitung sucht dann nach "1.%20Workspace". */
const WURZEL  = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ZIEL    = path.join(WURZEL, '.deploy');
const PROJEKT = 'vokabeltrainer';

const nurPruefen = process.argv.includes('--pruefen');
const mitDaten   = process.argv.includes('--mit-daten');

/* ---------- Was NIEMALS hochgeht, egal was die Ableitung sagt ---------- */
const VERBOTEN = [
  /^transcripts[\\/]/i,
  /^\.git[\\/]/i,
  /^\.claude[\\/]/i,
  /^werkzeuge[\\/]/i,
  /^vokabelpaket\.json$/i,
  /^CLAUDE\.md$/i,
  /^maintenance-log\.md$/i,
  /^\.gitignore$/i,
  /^validate\.js$/i,
  /^pruefe-.*\.js$/i,
  /^test-.*\.mjs$/i,
  /^\.budget\.json$/i,
  /^\.arbeit\.json$/i,
];
const istVerboten = rel => VERBOTEN.some(r => r.test(rel));

/* ---------- Die Ausliefer-Liste aus der App ableiten ---------- */
function ausIndex(){
  const html = fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf8');
  const raus = new Set();
  /* <script src="...">, <link href="...">, <img src="..."> - nur lokale Pfade */
  const muster = /(?:src|href)\s*=\s*["']([^"']+)["']/g;
  let t;
  while ((t = muster.exec(html))){
    const p = t[1];
    if (/^(https?:)?\/\//.test(p) || p.startsWith('data:') || p.startsWith('#')) continue;
    raus.add(p.replace(/^\.\//, '').split('?')[0]);
  }
  return raus;
}
function ausServiceWorker(){
  const sw = fs.readFileSync(path.join(WURZEL, 'sw.js'), 'utf8');
  const raus = new Set();
  /* die Cache-Liste besteht aus String-Literalen mit Dateiendung */
  const muster = /['"]\.?\/?([A-Za-z0-9_\-./]+\.(?:js|css|html|json|svg|png|woff2?))['"]/g;
  let t;
  while ((t = muster.exec(sw))) raus.add(t[1].replace(/^\.\//, ''));
  return raus;
}

const liste = new Set([
  'index.html', 'manifest.json', 'sw.js',
  ...ausIndex(), ...ausServiceWorker(),
]);

/* Vorschauseiten sind nicht im SW-Cache und werden von index.html nicht
   verlinkt - Elias ruft sie von Hand auf. Trotzdem ausliefern. */
fs.readdirSync(WURZEL).filter(f => /^vorschau.*\.html$/.test(f)).forEach(f => liste.add(f));

/* Der arabicroots-Abzug nur auf ausdruecklichen Wunsch. */
if (mitDaten){
  const d = path.join(WURZEL, 'data');
  if (fs.existsSync(d))
    fs.readdirSync(d).filter(f => /^vokabeln-.*\.js$/.test(f)).forEach(f => liste.add('data/' + f));
}

/* ---------- Pruefen ---------- */
const dabei = [], fehlend = [], abgelehnt = [];
[...liste].sort().forEach(rel => {
  const norm = rel.replace(/\//g, path.sep);
  if (istVerboten(rel)){ abgelehnt.push(rel); return; }
  const voll = path.join(WURZEL, norm);
  if (!fs.existsSync(voll)){ fehlend.push(rel); return; }
  dabei.push({ rel, groesse: fs.statSync(voll).size });
});

const gesamt = dabei.reduce((a, d) => a + d.groesse, 0);
const mb = n => (n / 1048576).toFixed(2) + ' MB';

console.log('=== Cloudflare Pages: ' + PROJEKT + ' ===');
console.log('Dateien: ' + dabei.length + '   Gesamt: ' + mb(gesamt));
console.log('');
dabei.slice().sort((a, b) => b.groesse - a.groesse).slice(0, 8)
  .forEach(d => console.log('   ' + mb(d.groesse).padStart(9) + '  ' + d.rel));
if (dabei.length > 8) console.log('   … und ' + (dabei.length - 8) + ' weitere');
console.log('');

if (abgelehnt.length){
  console.log('⛔ ABGELEHNT (stehen auf der Verbotsliste):');
  abgelehnt.forEach(r => console.log('   ' + r));
  console.log('');
}
if (fehlend.length){
  console.error('⛔ Referenziert, aber nicht vorhanden:');
  fehlend.forEach(r => console.error('   ' + r));
  console.error('Das ist ein Fehler - nichts wird hochgeladen.');
  process.exit(1);
}

/* Grenzen von Cloudflare Pages im Gratistarif, nachgesehen am 11.08.2026 */
const zuGross = dabei.filter(d => d.groesse > 25 * 1048576);
if (zuGross.length){
  console.error('⛔ Ueber der 25-MiB-Grenze je Datei:');
  zuGross.forEach(d => console.error('   ' + d.rel + '  ' + mb(d.groesse)));
  process.exit(1);
}
if (dabei.length > 20000){
  console.error('⛔ Mehr als 20.000 Dateien - das laesst der Gratistarif nicht zu.');
  process.exit(1);
}

if (mitDaten){
  const nachweis = path.join(WURZEL, '.access-geprueft.json');
  if (!fs.existsSync(nachweis)){
    console.error('⛔ --mit-daten verweigert.');
    console.error('   Der arabicroots-Abzug darf erst hoch, wenn BELEGT ist, dass');
    console.error('   pages.dev UND die eigene Domain hinter dem Access-Login liegen.');
    console.error('   Nachweis fehlt: .access-geprueft.json');
    process.exit(1);
  }
  console.log('⚠️  --mit-daten: arabicroots-Abzug ist dabei (' +
    dabei.filter(d => d.rel.startsWith('data/vokabeln-')).length + ' Dateien).');
  console.log('   Access-Nachweis vom ' + JSON.parse(fs.readFileSync(nachweis,'utf8')).geprueft);
  console.log('');
}

if (nurPruefen){ console.log('--pruefen: nichts gebaut, nichts hochgeladen.'); process.exit(0); }

/* ---------- Ordner bauen ---------- */
fs.rmSync(ZIEL, { recursive: true, force: true });
dabei.forEach(d => {
  const von  = path.join(WURZEL, d.rel.replace(/\//g, path.sep));
  const nach = path.join(ZIEL,   d.rel.replace(/\//g, path.sep));
  fs.mkdirSync(path.dirname(nach), { recursive: true });
  fs.copyFileSync(von, nach);
});
console.log('Ordner .deploy gebaut: ' + dabei.length + ' Dateien, ' + mb(gesamt));

/* ---------- Hochladen ---------- */
console.log('');
console.log('Lade zu Cloudflare hoch …');
try {
  execSync(`npx.cmd wrangler pages deploy "${ZIEL}" --project-name=${PROJEKT} --commit-dirty=true`,
           { cwd: WURZEL, stdio: 'inherit' });
} catch (e) {
  console.error('');
  console.error('⛔ Der Upload ist fehlgeschlagen. Die Seite ist NICHT aktualisiert.');
  process.exit(1);
}
console.log('');
console.log('✅ Veroeffentlicht.');
