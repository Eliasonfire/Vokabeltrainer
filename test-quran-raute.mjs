/* test-quran-raute.mjs — bewacht quranRaute() in js/quran.js (seit 24.10.2026, v711/v712).
 *
 * Elias mit Bildern zu 11:41: „hier beim 41 vers da ist unter dem ra bei mir in der app so ein
 * punkt aber eigentlich sollte das so ein rechteckiges zeiczhen sein wie bei quran.com und nicht
 * so ein punkt. das muss verbessert werden". Zu 12:11: „auch das hier in sura yusuf vers 11 sollte
 * aussehen wie quran.com", und: „die hohle raute wird nur in 2 versen vertreten, nicht drei".
 * Nach v711: „jetzt wird das ra abgeschnitten aufgrund der notiz" und „das hier solltest du
 * zwischen mim und nun platzieren. ich will später das nun markieren weil die raute bezieht sich
 * auf das nun deswegen kannst du das irgendwie im code miteinander verbinden aber wie gesagt sie
 * soll zwischen mim und nun stehen."
 *
 * Gefahren wird die ECHTE App im Browser (Edge, ohne Service Worker):
 *   - über den ganzen Koran bekommen genau zwei Wörter die hohle Raute: 11:41:6 („unten") und
 *     12:11:6 („zwischen"); 41:44:9 (gefüllter Punkt) bleibt unverändert,
 *   - in beiden steht statt des Punkts U+034F, gleich lang, gleiche Buchstabengrenzen; sonst ist
 *     kein Zeichen im ganzen Text anders,
 *   - beide Wörter bleiben in Uthmanic Hafs (in Scheherazade wurde das markierte rā abgeschnitten),
 *   - die gezeichnete Raute sitzt in 12:11 auf der Grenze zwischen mīm und nūn, in 11:41 unter dem rā,
 *   - sie trägt die Farbe des nūn bzw. rā, sobald der markiert ist — eine Markierung am mīm färbt
 *     sie NICHT; dasselbe auf der großen Karte.
 * `--bild <ordner>` legt dort raute-11-41.png, raute-12-11.png und raute-karte.png ab.
 * Störtest: `node test-quran-raute.mjs --quran <datei>` liefert <datei> statt js/quran.js aus —
 * mit dem Stand von v710 oder v711 muss der Test rot sein.
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
const HAFS = /^"?'?Uthmanic Hafs/;

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
          if (sp.hasAttribute('data-raute')) raute.push(ort + '=' + sp.getAttribute('data-raute'));
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
  pruefe('genau zwei Wörter bekommen die hohle Raute: 11:41:6 „unten" und 12:11:6 „zwischen"',
    JSON.stringify(ganz.raute) === JSON.stringify(['11:41:6=unten', '12:11:6=zwischen']), ganz.raute);
  pruefe('im ganzen Text sind nur diese zwei Wörter anders als bei quran.com', JSON.stringify(ganz.anders.map(a => a.ort)) === JSON.stringify(['11:41:6', '12:11:6']), ganz.anders.map(a => a.ort));
  const a1 = ganz.anders.find(x => x.ort === '11:41:6') || {}, a2 = ganz.anders.find(x => x.ort === '12:11:6') || {};
  pruefe('11:41:6: U+06EA ist durch U+034F ersetzt', /6ea/.test(a1.vorher || '') && !/6ea/.test(a1.nachher || '') && /631 34f/.test(a1.nachher || ''), a1);
  pruefe('12:11:6: U+06EC nach dem Fatha ist durch U+034F ersetzt', /64e 6ec/.test(a2.vorher || '') && /64e 34f/.test(a2.nachher || '') && !/6ec|6eb/.test(a2.nachher || ''), a2);
  pruefe('beide gleich lang, gleiche Buchstabengrenzen (keine Markierung verschiebt sich)', a1.gleichLang && a1.grenzen && a2.gleichLang && a2.grenzen, [a1, a2]);

  /* 2. Im Leser: Schrift, Lage der Raute, Farbe nach Markierung. */
  for (const [sure, vers, art] of [[11, 41, 'unten'], [12, 11, 'zwischen']]){
    await page.evaluate(() => showScreen('quranfull', { ohneEbene: true }));
    await page.evaluate((s) => openSurah(s), sure);
    const sel = '#verseList .verse-item[data-versnr="' + vers + '"] .verse-ar .qw[data-w="6"]';
    await page.waitForSelector(sel, { timeout: 30000 });
    await page.evaluate(async () => { await document.fonts.load("40px 'Uthmanic Hafs'"); await document.fonts.ready; });
    const m = await page.evaluate(([sel, art]) => {
      const sp = document.querySelector(sel);
      const nb = (w) => sp.parentElement.querySelector('.qw[data-w="' + w + '"]');
      const nach = getComputedStyle(sp, '::after');
      const r = sp.getBoundingClientRect(), fs = parseFloat(getComputedStyle(sp).fontSize);
      const rx = r.left + parseFloat(nach.left), ry = r.top + parseFloat(nach.top);
      const knoten = sp.firstChild, cl = tajweedCluster(knoten.nodeValue);
      const k = cl.findIndex(c => c.text.includes(String.fromCodePoint(0x34F)));
      if (k < 0) return { kein: 'kein U+034F im Wort', schrift: getComputedStyle(sp).fontFamily, nachbarn: [], inhalt: nach.content, rand: nach.borderTopStyle,
        zurGrenze: 99, rechtsVonGrenze: -1, unterMitte: 0, clusterText: '', folgeText: '' };
      const bereich = (c) => { const g = document.createRange(); g.setStart(knoten, c.i); g.setEnd(knoten, c.i + c.len); return g.getBoundingClientRect(); };
      const eigen = bereich(cl[k]);
      return { schrift: getComputedStyle(sp).fontFamily, nachbarn: [getComputedStyle(nb(5)).fontFamily, getComputedStyle(nb(7)).fontFamily],
        inhalt: nach.content, rand: nach.borderTopStyle,
        /* in em: Abstand der Rautenmitte zur linken Kante des eigenen Clusters (mīm bzw. rā), und zur Grundlinie grob über die Kastenmitte */
        zurGrenze: (rx - eigen.left) / fs, rechtsVonGrenze: (eigen.right - rx) / fs, unterMitte: (ry - (r.top + r.height / 2)) / fs,
        clusterText: [...cl[k].text].map(c => c.codePointAt(0).toString(16)).join(' '),
        folgeText: cl[k + 1] ? [...cl[k + 1].text].map(c => c.codePointAt(0).toString(16)).join(' ') : '' };
    }, [sel, art]);
    pruefe(sure + ':' + vers + ' Wort 6 bleibt in Uthmanic Hafs, die Nachbarn auch', HAFS.test(m.schrift) && m.nachbarn.every(f => HAFS.test(f)), m);
    pruefe(sure + ':' + vers + ' die Raute wird gezeichnet (hohl: nur ein Rand)', m.inhalt !== 'none' && m.rand === 'solid', m);
    if (art === 'zwischen'){
      pruefe('12:11 die Raute sitzt auf der Grenze zwischen mīm und nūn', m.clusterText.startsWith('645') && m.folgeText.startsWith('646') && Math.abs(m.zurGrenze) < 0.03, m);
      pruefe('12:11 die Raute steht über der Wortmitte, nicht darunter', m.unterMitte < 0.1, m);
    } else {
      pruefe('11:41 die Raute sitzt unter dem rā (waagerecht innerhalb des rā)', m.clusterText.startsWith('631') && m.zurGrenze > 0 && m.rechtsVonGrenze > 0, m);
      pruefe('11:41 die Raute steht deutlich unter der Wortmitte', m.unterMitte > 0.5, m);
    }
    /* Farbe: erst der falsche Buchstabe (12:11: mīm), dann der richtige (nūn bzw. rā). */
    const farbe = await page.evaluate(([sel, sure, vers, art]) => {
      const sp = document.querySelector(sel);
      const cl = tajweedCluster(sp.firstChild.nodeValue);
      const k = cl.findIndex(c => c.text.includes(String.fromCodePoint(0x34F)));
      if (k < 0) return { falsch: '?', richtig: '', leer: '', kein: 'kein U+034F im Wort' };
      const ziel = art === 'zwischen' ? cl[k + 1] : cl[k];
      const setze = (pos) => { for (const id of Object.keys(TAJWEED)) if (id.startsWith(sure + ':' + vers + ':6:')) delete TAJWEED[id];
        if (pos !== null) TAJWEED[sure + ':' + vers + ':6:' + pos] = tajweedEintragNormal({ an: true, farbe: 'rot', seit: Date.now(), zeit: Date.now() });
        tajweedZeichnen(); return sp.style.getPropertyValue('--raute-farbe'); };
      const falsch = art === 'zwischen' ? setze(cl[k].i) : '(entfällt)';
      const richtig = setze(ziel.i);
      const leer = setze(null);
      setze(ziel.i);
      return { falsch, richtig, leer };
    }, [sel, sure, vers, art]);
    if (art === 'zwischen') pruefe('12:11 eine Markierung am mīm färbt die Raute nicht', farbe.falsch === '', farbe);
    pruefe(sure + ':' + vers + ' markiert man ' + (art === 'zwischen' ? 'das nūn' : 'das rā') + ', wird die Raute rot; ohne Markierung nicht',
      farbe.richtig.replace(/\s/g, '') === 'var(--tj-rot)' && farbe.leer === '', farbe);
    if (BILD){
      await page.evaluate((sel) => document.querySelector(sel).scrollIntoView({ block: 'center', behavior: 'instant' }), sel);
      await page.waitForTimeout(400);
      await page.locator('#verseList .verse-item[data-versnr="' + vers + '"] .verse-ar').screenshot({ path: path.join(BILD, 'raute-' + sure + '-' + vers + '.png') });
    }
    if (art === 'zwischen'){
      /* Die große Karte: dasselbe Wort, dieselbe Raute, Farbe vom nūn. */
      const karte = await page.evaluate((sel) => {
        const sp = document.querySelector(sel);
        tajweedKarteOeffnen(sp, 11, 6);
        const w = document.getElementById('tjWort');
        return { raute: w.dataset.raute || '', schrift: getComputedStyle(w).fontFamily, inhalt: getComputedStyle(w, '::after').content, farbe: w.style.getPropertyValue('--raute-farbe') };
      }, sel);
      pruefe('Karte 12:11: Raute „zwischen", Uthmanic Hafs, gezeichnet, in der Farbe des nūn', karte.raute === 'zwischen' && HAFS.test(karte.schrift) && karte.inhalt !== 'none' && karte.farbe.replace(/\s/g, '') === 'var(--tj-rot)', karte);
      if (BILD){ await page.waitForTimeout(400); await page.locator('#tajweedKarte').screenshot({ path: path.join(BILD, 'raute-karte.png') }); }
      await page.evaluate(() => tajweedKarteSchliessen && tajweedKarteSchliessen());
    }
  }
  pruefe('keine Seitenfehler', fehler.length === 0, fehler);
} finally { await browser.close(); server.close(); }

console.log('\n' + ok + ' von ' + (ok + schlecht) + ' grün');
process.exit(schlecht ? 1 : 0);
