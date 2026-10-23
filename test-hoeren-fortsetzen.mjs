/* test-hoeren-fortsetzen.mjs — bewacht openHoeren() in js/hoeren.js (23.10.2026, v710).
 *
 * Elias um 23:38:50: „ich war eben im hörmodus und habe die antwort geklickt und habe dann
 * eine vokabel im wörterbuch nachgeguckt, als ich dann wieder zu dem hören gekommen bin
 * wurden mir nicht mehr die altern vokabeln angezeigt sondern die näcshte runde. das möchte
 * ich nicht."
 *
 * Gefahren wird die ECHTE App im Browser (Edge, ohne Service Worker), mit genau seinem Weg:
 * Hörmodus öffnen, eine Antwort tippen, zur Suche wechseln, zurück. Dann muss dieselbe Frage
 * dastehen — dasselbe Wort, dieselben fünf Antworten, beantwortet, die Lösung sichtbar.
 * Dazu die Gegenseite, damit ein „bleibt immer stehen" nicht durchkommt:
 *   - nach dem Weitertippen kommt eine NEUE Frage, und sie spielt von selbst (wie bisher),
 *   - beim Zurückkommen spielt nichts von selbst (seine Vorgabe vom 15.09.2026),
 *   - eine Frage, von der ein Wort nicht mehr im Vorrat liegt, wird nicht fortgesetzt.
 * Störtest: `node test-hoeren-fortsetzen.mjs --hoeren <datei>` liefert <datei> statt
 * js/hoeren.js aus — mit dem Stand von v709 muss der Test rot sein.
 * Exit 0 = grün · 1 = Befund · 3 = kann nicht laufen (Playwright fehlt).
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const WURZEL = path.dirname(fileURLToPath(import.meta.url));
const PLAYWRIGHT_BEI = path.join(WURZEL, '..', 'Quran Trainer', 'package.json');
let chromium;
try { ({ chromium } = createRequire(PLAYWRIGHT_BEI)('playwright')); }
catch (e) { console.log('⛔ Playwright nicht gefunden (gesucht über ' + PLAYWRIGHT_BEI + ') — Exit 3 heißt „kann nicht laufen".'); process.exit(3); }

const i = process.argv.indexOf('--hoeren');
const ERSATZ = i > 0 ? path.resolve(process.argv[i + 1]) : null;
if (ERSATZ && !fs.existsSync(ERSATZ)) { console.log('⛔ ' + ERSATZ + ' gibt es nicht'); process.exit(3); }

const TYP = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  let datei = path.join(WURZEL, p);
  if (ERSATZ && p === '/js/hoeren.js') datei = ERSATZ;
  else if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYP[path.extname(datei).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(datei).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));

let ok = 0, schlecht = 0;
const pruefe = (was, bedingung, gemessen) => {
  if (bedingung) { ok++; console.log('  ✔ ' + was); }
  else { schlecht++; console.log('  ✘ ' + was + (gemessen === undefined ? '' : '   gemessen: ' + JSON.stringify(gemessen))); }
};

const fehler = [];
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, serviceWorkers: 'block' });
  await ctx.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  const page = await ctx.newPage();
  page.on('pageerror', e => fehler.push(String(e.message).split('\n')[0]));
  await page.goto('http://127.0.0.1:' + server.address().port + '/', { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => typeof VOCAB_DATA !== 'undefined' && VOCAB_DATA.length > 100 && typeof showScreen === 'function', null, { timeout: 120000 });
  await page.waitForTimeout(1500);
  /* Ton zählen statt abspielen: jeder Aufruf der Sprachausgabe wird mitgeschrieben. */
  await page.evaluate(() => { window.__ton = 0; const echt = window.speakArabic; window.speakArabic = (...a) => { window.__ton++; try { return echt && echt(...a); } catch (e) {} }; });
  const stand = () => page.evaluate(() => ({
    wort: HOER.wort ? String(HOER.wort.id) : null,
    optionen: (HOER.optionen || []).map(w => String(w.id)),
    beantwortet: !!HOER.beantwortet,
    loesung: !document.getElementById('hoerLoesung').classList.contains('hidden'),
    gesperrt: [...document.querySelectorAll('#hoerOptionen [data-hoerwahl]')].filter(b => b.disabled).length,
    ton: window.__ton
  }));
  const weg = async () => { await page.evaluate(() => showScreen('suche')); await page.waitForTimeout(300);
                            await page.evaluate(() => showScreen('hoeren')); await page.waitForTimeout(500); };

  await page.evaluate(() => showScreen('hoeren'));
  await page.waitForTimeout(500);
  const a = await stand();
  pruefe('Hörmodus zeigt eine Frage mit fünf Antworten', a.wort && a.optionen.length === 5, a);
  if (!a.wort) throw new Error('keine Frage — der Rest lässt sich nicht prüfen');

  /* 1. Noch nicht beantwortet: weg und zurück → dieselbe Frage, kein Ton. */
  await weg();
  const b = await stand();
  pruefe('unbeantwortet weg und zurück: dasselbe Wort', b.wort === a.wort, [a.wort, b.wort]);
  pruefe('unbeantwortet weg und zurück: dieselben fünf Antworten', JSON.stringify(b.optionen) === JSON.stringify(a.optionen), [a.optionen, b.optionen]);
  pruefe('unbeantwortet weg und zurück: spielt nicht von selbst', b.ton === a.ton, [a.ton, b.ton]);

  /* 2. Sein Weg: Antwort tippen, zur Suche, zurück. */
  await page.click('#hoerOptionen [data-hoerwahl="0"]');
  await page.waitForTimeout(600);
  const c = await stand();
  pruefe('nach dem Tippen ist die Frage beantwortet, die Lösung steht da', c.beantwortet && c.loesung, c);
  await weg();
  const d = await stand();
  pruefe('beantwortet weg und zurück: dasselbe Wort', d.wort === a.wort, [a.wort, d.wort]);
  pruefe('beantwortet weg und zurück: dieselben fünf Antworten', JSON.stringify(d.optionen) === JSON.stringify(a.optionen), [a.optionen, d.optionen]);
  pruefe('beantwortet weg und zurück: weiter beantwortet, Lösung sichtbar, Antworten gesperrt',
    d.beantwortet && d.loesung && d.gesperrt === 5, d);
  pruefe('beantwortet weg und zurück: spielt nicht von selbst', d.ton === c.ton, [c.ton, d.ton]);

  /* 3. Der normale Lauf: Weitertippen bringt eine neue Frage, und die spielt. */
  await page.waitForTimeout(2800);            // eine falsche Antwort sperrt das Weitertippen kurz (Q8)
  await page.click('#hoerHinweis');
  await page.waitForTimeout(600);
  const e = await stand();
  pruefe('Weitertippen: eine neue, unbeantwortete Frage', !e.beantwortet && e.gesperrt === 0 && e.wort, e);
  pruefe('Weitertippen: das neue Wort spielt von selbst', e.ton > d.ton, [d.ton, e.ton]);

  /* 4. Gehört ein Wort der Frage nicht mehr zum Vorrat, wird neu gefragt. */
  await page.evaluate(() => { HOER.optionen[1] = { id: 'gibt-es-nicht', de: 'gibt es nicht' }; });
  await weg();
  const f = await stand();
  pruefe('Wort nicht mehr im Vorrat: neue Frage statt der alten', !f.optionen.includes('gibt-es-nicht') && f.optionen.length === 5, f);
  await ctx.close();
} catch (e) {
  schlecht++; console.log('  ✘ Lauf abgebrochen: ' + String(e && e.message || e).split('\n')[0]);
} finally { await browser.close(); server.close(); }

pruefe('keine Seitenfehler', !fehler.length, fehler.slice(0, 3));
console.log((schlecht ? '⛔ ' : '✅ ') + ok + ' von ' + (ok + schlecht) + ' Prüfungen grün' + (ERSATZ ? ' (mit ' + path.basename(ERSATZ) + ' statt js/hoeren.js)' : ''));
process.exit(schlecht ? 1 : 0);
