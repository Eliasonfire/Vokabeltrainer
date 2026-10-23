/* test-quran-raute.mjs — bewacht quranRaute() in js/quran.js (24.10.2026, v711).
 *
 * Elias mit Bildern zu 11:41: „hier beim 41 vers da ist unter dem ra bei mir in der app so ein
 * punkt aber eigentlich sollte das so ein rechteckiges zeiczhen sein wie bei quran.com und nicht
 * so ein punkt. das muss verbessert werden". Zu 12:11: „auch das hier in sura yusuf vers 11 sollte
 * aussehen wie quran.com", und: „die hohle raute wird nur in 2 versen vertreten, nicht drei".
 *
 * Gefahren wird die ECHTE App im Browser (Edge, ohne Service Worker):
 *   - über den ganzen Koran bekommen genau zwei Wörter die hohle Raute: 11:41 Wort 6 und
 *     12:11 Wort 6. 41:44 Wort 9 (gefüllter Punkt) bleibt in Hafs und unverändert,
 *   - in 12:11 steht U+06EB statt U+06EC, sonst ist kein Zeichen im ganzen Text anders,
 *   - die Buchstabengrenzen der Markierungen bleiben dieselben,
 *   - im Leser stehen die beiden Wörter in Scheherazade New, ihre Nachbarn in Uthmanic Hafs.
 * `--bild <ordner>` legt dort raute-11-41.png und raute-12-11.png ab (zum Ansehen).
 * Störtest: `node test-quran-raute.mjs --quran <datei>` liefert <datei> statt js/quran.js
 * aus — mit dem Stand von v710 muss der Test rot sein.
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

const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? path.resolve(process.argv[i + 1]) : null; };
const ERSATZ = arg('--quran');
const BILD = arg('--bild');
if (ERSATZ && !fs.existsSync(ERSATZ)) { console.log('⛔ ' + ERSATZ + ' gibt es nicht'); process.exit(3); }

const TYP = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  let datei = path.join(WURZEL, p);
  if (ERSATZ && p === '/js/quran.js') datei = ERSATZ;
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
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, serviceWorkers: 'block' });
  await ctx.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  const page = await ctx.newPage();
  page.on('pageerror', e => fehler.push(String(e.message).split('\n')[0]));
  await page.goto('http://127.0.0.1:' + server.address().port + '/', { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => typeof showScreen === 'function' && typeof openSurah === 'function' && typeof ladeQuranText === 'function', null, { timeout: 120000 });
  await page.evaluate(() => ladeQuranText());

  /* 1. Der ganze Text: welche Wörter bekommen die Raute, und was ändert sich am Text? */
  const ganz = await page.evaluate(() => {
    const raute = [], anders = [];
    let woerter = 0;
    const div = document.createElement('div');
    for (let s = 1; s <= 114; s++){
      (QURAN_TEXT[s] || []).forEach((e, i) => {
        const text = Array.isArray(e) ? e[0] : e;
        div.innerHTML = quranWortSpans(text);
        const orig = quranWorte(text);
        div.querySelectorAll('.qw').forEach((sp, j) => {
          woerter++;
          const ort = s + ':' + (i + 1) + ':' + (j + 1);
          if (sp.hasAttribute('data-raute')) raute.push(ort);
          if (sp.textContent !== orig[j]) anders.push({ ort, vorher: [...orig[j]].map(c => c.codePointAt(0).toString(16)).join(' '),
            nachher: [...sp.textContent].map(c => c.codePointAt(0).toString(16)).join(' '),
            gleichLang: sp.textContent.length === orig[j].length,
            grenzen: JSON.stringify(tajweedCluster(sp.textContent).map(c => c.i)) === JSON.stringify(tajweedCluster(orig[j]).map(c => c.i)) });
        });
      });
    }
    return { woerter, raute, anders };
  });
  pruefe('der ganze Koran ist durchlaufen (über 77.000 Wörter)', ganz.woerter > 77000, ganz.woerter);
  pruefe('genau zwei Wörter bekommen die hohle Raute: 11:41:6 und 12:11:6', JSON.stringify(ganz.raute) === JSON.stringify(['11:41:6', '12:11:6']), ganz.raute);
  pruefe('41:44:9 (gefüllter Punkt) bekommt keine Raute', !ganz.raute.includes('41:44:9'), ganz.raute);
  pruefe('im ganzen Text ist nur ein Wort anders als bei quran.com: 12:11:6', ganz.anders.length === 1 && ganz.anders[0].ort === '12:11:6', ganz.anders.map(a => a.ort));
  const a = ganz.anders.find(x => x.ort === '12:11:6') || {};
  pruefe('in 12:11:6 steht U+06EB statt U+06EC, direkt nach dem Fatha', /64e 6eb/.test(a.nachher || '') && !/6ec/.test(a.nachher || '') && /64e 6ec/.test(a.vorher || ''), a);
  pruefe('12:11:6 bleibt gleich lang, die Buchstabengrenzen der Markierungen bleiben gleich', a.gleichLang === true && a.grenzen === true, a);

  /* 2. Im Leser: Schrift der beiden Wörter und ihrer Nachbarn. Erst der Bildschirm, dann die
     Sure — so öffnet auch oeffneSureVomRing() (js/start.js) sie. */
  for (const [sure, vers] of [[11, 41], [12, 11]]){
    await page.evaluate(() => showScreen('quranfull', { ohneEbene: true }));
    await page.evaluate((s) => openSurah(s), sure);
    const sel = '#verseList .verse-item[data-versnr="' + vers + '"]';
    await page.waitForSelector(sel + ' .qw[data-w="6"]', { timeout: 30000 });
    await page.evaluate(async () => { await document.fonts.load("40px 'Scheherazade New'"); await document.fonts.load("40px 'Uthmanic Hafs'"); await document.fonts.ready; });
    const m = await page.evaluate((sel) => {
      const k = document.querySelector(sel);
      const sp = (w) => k.querySelector('.verse-ar .qw[data-w="' + w + '"]');
      const schrift = (el) => el ? getComputedStyle(el).fontFamily : null;
      return { wort: schrift(sp(6)), raute: !!(sp(6) && sp(6).hasAttribute('data-raute')), davor: schrift(sp(5)), danach: schrift(sp(7)),
               geladen: document.fonts.check("40px 'Scheherazade New'") };
    }, sel);
    pruefe(sure + ':' + vers + ' Wort 6 steht in Scheherazade New', m.raute && /^"?'?Scheherazade New/.test(m.wort || ''), m);
    pruefe(sure + ':' + vers + ' Wort 5 und 7 bleiben in Uthmanic Hafs', /^"?'?Uthmanic Hafs/.test(m.davor || '') && /^"?'?Uthmanic Hafs/.test(m.danach || ''), m);
    pruefe(sure + ':' + vers + ' Scheherazade New ist geladen', m.geladen === true, m);
    if (BILD){
      await page.locator(sel).scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await page.locator(sel + ' .verse-ar').screenshot({ path: path.join(BILD, 'raute-' + sure + '-' + vers + '.png') });
    }
  }
  pruefe('keine Seitenfehler', fehler.length === 0, fehler);
} finally { await browser.close(); server.close(); }

console.log('\n' + ok + ' von ' + (ok + schlecht) + ' grün');
process.exit(schlecht ? 1 : 0);
