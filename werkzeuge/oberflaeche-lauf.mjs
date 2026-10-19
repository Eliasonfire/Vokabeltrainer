/* oberflaeche-lauf.mjs — pruefe-oberflaeche.js ohne Browser-Pane laufen lassen
 * ==========================================================================
 *
 * ⛔ WARUM ES DAS GIBT (19.10.2026). pruefe-oberflaeche.js braucht die laufende
 * App und lief deshalb nur von Hand im Vorschaubrowser — zuletzt am 09.09.2026.
 * Vierzig Tage lang meldete jede Wartung „39 Tage alt", und niemand lief ihn:
 * der Pane ist Elias' Fenster, und der Lauf schreibt in den localStorage
 * (vt_progress, vt_uebungstage, vt_quoteTage — zurueckgesetzt, aber geschrieben).
 * Der erste Lauf danach fand zwei echte Fehler der App (vier Fachbegriffe ohne
 * Beispielsatz, eine unsichtbare Markierung) und einen veralteten Pruefer.
 * [[routine_ohne_termin_ist_unbewacht]] [[pruefserver_ist_nicht_die_app]]
 *
 * Was es tut: ein eigener Dateiserver nur auf 127.0.0.1 ueber diesem Ordner,
 * ein eigener Edge (Playwright, `channel: 'msedge'`) mit LEEREM Speicher, ohne
 * Service Worker — und jede Anfrage an einen anderen Rechner wird abgebrochen.
 * Damit kann der Lauf nichts in seinen Lernstand in der Cloud schreiben, auch
 * nicht aus Versehen. Der Pruefer laeuft ZWEIMAL: beim ersten Mal sind die
 * Buecher noch nicht eingehaengt (sein eigener Hinweis), gezaehlt wird der zweite.
 *
 * ⚠️ Playwright liegt nicht hier, sondern im Korantrainer-Ordner — es wird nur
 * GELESEN, nichts dort veraendert. Fehlt es, sagt das Werkzeug es (Exit 3).
 *
 * ⚠️ Gemessen wird der ARBEITSORDNER, nicht die ausgelieferte Seite. Wer den
 * Stempel setzt, sollte vorher ausgeliefert haben — sonst steht im Stempel
 * eine Fassung, die Elias nicht hat.
 *
 * Aufruf:  node werkzeuge/oberflaeche-lauf.mjs            nur laufen, Bericht
 *          node werkzeuge/oberflaeche-lauf.mjs --stempel  dazu data/oberflaeche-lauf.json
 * Exit 0 = kein Fehler · 1 = Fehler gefunden · 3 = kann nicht laufen
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STEMPEL = path.join(WURZEL, 'data', 'oberflaeche-lauf.json');
const PLAYWRIGHT_BEI = path.join(WURZEL, '..', 'Quran Trainer', 'package.json');

let chromium;
try { ({ chromium } = createRequire(PLAYWRIGHT_BEI)('playwright')); }
catch (e) {
  console.error('⛔ Playwright nicht gefunden (gesucht ueber ' + PLAYWRIGHT_BEI + ').');
  console.error('   Exit 3 heisst „kann nicht laufen", nicht „Fehler gefunden".');
  process.exit(3);
}

const TYP = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const datei = path.join(WURZEL, p);
  if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYP[path.extname(datei).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(datei).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const ADRESSE = 'http://127.0.0.1:' + server.address().port + '/';

const fremd = new Map(), seitenfehler = [], konsolenfehler = [];
let ergebnis = null;
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const ctx = await browser.newContext({ viewport: { width: 448, height: 906 }, serviceWorkers: 'block' });
  await ctx.route('**/*', (route) => {
    const u = new URL(route.request().url());
    if (u.hostname === '127.0.0.1') return route.continue();
    fremd.set(u.host, (fremd.get(u.host) || 0) + 1);
    return route.abort();
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => seitenfehler.push(String(e.message).split('\n')[0]));
  page.on('console', (m) => { if (m.type() === 'error') konsolenfehler.push(m.text().split('\n')[0].slice(0, 200)); });
  await page.goto(ADRESSE, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => typeof SETTINGS !== 'undefined' && typeof showScreen === 'function', null, { timeout: 120000 });
  await page.waitForTimeout(3000);
  /* ⛔ AWAITEN und den Rueckgabewert lesen — die Datei ist eine asynchrone IIFE
     (siehe `_wie_2` im Stempel: ohne await kam am 09.09.2026 ein leerer Bericht). */
  const lauf = () => page.evaluate(async () => {
    const t = await (await fetch('/pruefe-oberflaeche.js', { cache: 'no-store' })).text();
    const r = await (0, eval)(t);
    return { fehler: r.fehler, ergebnis: r.ergebnis };
  });
  await lauf();
  await page.waitForTimeout(5000);
  ergebnis = await lauf();
  await ctx.close();
} finally {
  await browser.close();
  server.close();
}

const zaehl = {};
for (const e of ergebnis.ergebnis) zaehl[e.status] = (zaehl[e.status] || 0) + 1;
const nichtOk = ergebnis.ergebnis.filter((x) => x.status !== 'ok');
console.log('Pruefungen: ' + ergebnis.ergebnis.length + ' · ' + Object.entries(zaehl).map(([k, v]) => k + ' ' + v).join(' · '));
for (const e of nichtOk) console.log('  ' + e.status + ' — ' + e.was + (e.zusatz ? ' — ' + e.zusatz : ''));
console.log('Seitenfehler: ' + seitenfehler.length + ' · Konsolenfehler: ' + konsolenfehler.length
  + ' · abgebrochene Anfragen an fremde Rechner: ' + (fremd.size ? [...fremd].map(([h, n]) => h + ' ×' + n).join(', ') : 'keine'));
for (const f of [...new Set(seitenfehler.concat(konsolenfehler))].slice(0, 10)) console.log('  ' + f);

if (process.argv.includes('--stempel')) {
  const alt = JSON.parse(fs.readFileSync(STEMPEL, 'utf8'));
  const sw = fs.readFileSync(path.join(WURZEL, 'sw.js'), 'utf8');
  const fassung = (sw.match(/const CACHE_NAME = '([^']+)'/) || [])[1] || '?';
  const jetzt = new Date();
  const heute = jetzt.getFullYear() + '-' + String(jetzt.getMonth() + 1).padStart(2, '0') + '-' + String(jetzt.getDate()).padStart(2, '0');
  const neu = {};
  for (const [k, v] of Object.entries(alt)) if (k.startsWith('_') && k !== '_laeufe_heute' && k !== '_belegt') neu[k] = v;
  neu._wie_3 = 'Seit 19.10.2026 ohne Pane: node werkzeuge/oberflaeche-lauf.mjs --stempel — eigener Edge, Dateiserver nur auf 127.0.0.1, fremde Rechner gesperrt, leerer Speicher; der Pruefer laeuft zweimal, gezaehlt wird der zweite. Der Stempel unten ist von diesem Werkzeug geschrieben.';
  Object.assign(neu, {
    gelaufen: heute, fassung, pruefungen: ergebnis.ergebnis.length, fehler: ergebnis.fehler, hinweise: zaehl.Hinweis || 0,
    hinweis_inhalt: nichtOk.map((e) => e.was + (e.zusatz ? ': ' + e.zusatz : '')),
    seitenfehler: seitenfehler.length, konsolenfehler: konsolenfehler.length,
  });
  fs.writeFileSync(STEMPEL + '.neu', JSON.stringify(neu, null, 2) + '\n', 'utf8');
  JSON.parse(fs.readFileSync(STEMPEL + '.neu', 'utf8'));
  fs.renameSync(STEMPEL + '.neu', STEMPEL);
  console.log('Stempel geschrieben: ' + heute + ' · ' + fassung);
}
process.exit(ergebnis.fehler ? 1 : 0);
