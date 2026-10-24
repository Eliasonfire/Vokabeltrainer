/* test-quran-sin-markierung.mjs — bewacht das Färben markierter Buchstaben im Koranleser
 * (seit 24.10.2026, v714; js/quran-markierung.js tajweedWortFaerben()).
 *
 * Elias am 23.10.2026, 23:55, mit Bild: „das sin oben drüber wird plötzlich abgeschnitten,
 * fix das an beiden stellen. 75/27 und 83/14".
 * Bis v713 färbte ein `::highlight()` den Buchstaben — und der malt nur im Kasten des
 * Buchstabens. Das kleine sīn (U+06DC) über dem nūn (75:27) bzw. lām (83:14) ragt darüber
 * hinaus; der Teil fehlte. Seit v714 steht der markierte Buchstabe in einem eigenen
 * <span class="tj-buchstabe tj-<farbe>">.
 *
 * Gefahren wird die ECHTE App im Browser (Edge, ohne Service Worker), sechsfach vergrößert:
 *   - Tinte: im Ausschnitt um das Wort wird die Deckung gezählt (Rotkanal über dem dunklen
 *     Hintergrund — Weiß und das Rot der Markierung haben beide R = 255, die Zahl hängt also
 *     nicht an der Farbe). Markiert muss genauso viel Tinte dastehen wie unmarkiert; fehlt
 *     etwas, ist ein Stück abgeschnitten.
 *   - Die Verbindung bleibt: das Wort ist markiert so breit wie unmarkiert (ein Schnitt in
 *     den Text gäbe Einzelformen und eine andere Breite) — auch an einem verbundenen Wort
 *     aus al-Fātiḥa (1:2 Wort 1, Buchstabe in der Mitte markiert).
 *   - Die Farbe ist da (rote Pixel), der Text bleibt Zeichen für Zeichen derselbe, und nach
 *     dem Wegnehmen ist das Wort wieder flach (kein Kind-Element, keine Klasse tj-hat).
 *   - Dasselbe auf der großen Karte (#tjWort).
 * `--bild <ordner>` legt dort je Fall flach/markiert ab.
 * Störtest: `node test-quran-sin-markierung.mjs --mark <alte quran-markierung.js> --index <alte
 * index.html>` — mit dem Stand von v713 (Highlight) muss der Test rot sein.
 * Exit 0 = grün · 1 = Befund · 3 = kann nicht laufen (Playwright fehlt, Hintergrund nicht dunkel).
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
const ERSATZ_MARK = arg('--mark'), ERSATZ_INDEX = arg('--index'), BILD = arg('--bild');
for (const e of [ERSATZ_MARK, ERSATZ_INDEX]) if (e && !fs.existsSync(e)) { console.log('⛔ ' + e + ' gibt es nicht'); process.exit(3); }

const TYP = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  let datei = path.join(WURZEL, p);
  if (ERSATZ_MARK && p === '/js/quran-markierung.js') datei = ERSATZ_MARK;
  else if (ERSATZ_INDEX && p === '/index.html') datei = ERSATZ_INDEX;
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
/* Gemessen am 24.10.2026 (Edge, sechsfach), je 75:27 / 83:14 / 1:2:
     v714 (Span):      verschwunden 0 / 0 / 0,       alle gegen Vorlage 1,0004 / 1,0000 / 0,9987
     v713 (Highlight): verschwunden 129 / 25 / 1002, alle gegen Vorlage 0,9720 / 0,9951 / 0,8557
   Auf der Karte war beides 0 bzw. im Rahmen, auch mit v713 — dort schnitt das Highlight
   nicht ab; die Karte wird trotzdem mitbewacht. */
const TOLERANZ = 0.01;
const VERLUST_MAX = 10;

const fehler = [];
const browser = await chromium.launch({ channel: 'msedge', headless: true });
let kannNicht = '';
try {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 6, serviceWorkers: 'block' });
  await ctx.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  const page = await ctx.newPage();
  page.on('pageerror', e => fehler.push(String(e.message).split('\n')[0]));
  await page.goto('http://127.0.0.1:' + server.address().port + '/', { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => typeof showScreen === 'function' && typeof openSurah === 'function' && typeof ladeQuranText === 'function', null, { timeout: 120000 });
  await page.evaluate(() => ladeQuranText());

  /* Deckung im Ausschnitt: Rotkanal über dem Hintergrund (Ecke links oben), dazu rote und
     weiße Pixel. */
  const tinte = async (clip, name) => {
    const buf = await page.screenshot({ clip });
    if (BILD && name) fs.writeFileSync(path.join(BILD, name + '.png'), buf);
    return page.evaluate(async (b64) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      const bg = [d[0], d[1], d[2]];
      let deckung = 0, rot = 0, weiss = 0;
      for (let k = 0; k < d.length; k += 4){
        deckung += Math.max(0, d[k] - bg[0]) / Math.max(1, 255 - bg[0]);
        if (d[k] > 200 && d[k + 1] < 140 && d[k + 2] < 160) rot++;
        if (d[k] > 200 && d[k + 1] > 200 && d[k + 2] > 200) weiss++;
      }
      return { deckung: Math.round(deckung), rot, weiss, bg };
    }, buf.toString('base64')).then(e => Object.assign(e, { b64: buf.toString('base64') }));
  };
  /* Was ist markiert VERSCHWUNDEN? Pixel, die unmarkiert voll gedeckt sind (R > 200), und
     markiert leer (R < 60). Die Farbe ändert daran nichts — Weiß und das Rot der Markierung
     haben beide R = 255, nur die Kanten glättet Chromium verschieden (darum die Schwellen). */
  const verloren = (a, b) => page.evaluate(async ([a, b]) => {
    const lade = async (b64) => { const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0); return g.getImageData(0, 0, c.width, c.height); };
    const x = await lade(a), y = await lade(b);
    if (x.width !== y.width || x.height !== y.height) return -1;
    let n = 0;
    for (let k = 0; k < x.data.length; k += 4) if (x.data[k] > 200 && y.data[k] < 60) n++;
    return n;
  }, [a.b64, b.b64]);
  const setze = (sure, vers, wort, posListe) => page.evaluate(([sure, vers, wort, posListe]) => {
    for (const id of Object.keys(TAJWEED)) if (id.startsWith(sure + ':' + vers + ':' + wort + ':')) delete TAJWEED[id];
    for (const pos of posListe) TAJWEED[sure + ':' + vers + ':' + wort + ':' + pos] = tajweedEintragNormal({ an: true, farbe: 'rot', seit: Date.now(), zeit: Date.now() });
    tajweedZeichnen();
  }, [sure, vers, wort, posListe]);

  /* [sure, vers, wort, welcher Buchstabe: 'letzter' | 'mitte', Name] */
  const FAELLE = [[75, 27, 2, 'letzter', 'kleines sīn über dem nūn'], [83, 14, 2, 'letzter', 'kleines sīn über dem lām'],
    [1, 2, 1, 'mitte', 'verbundenes Wort, Buchstabe in der Mitte']];
  for (const [sure, vers, wort, welcher, name] of FAELLE){
    const ort = sure + ':' + vers + ':' + wort;
    await page.evaluate(() => showScreen('quranfull', { ohneEbene: true }));
    await page.evaluate((s) => openSurah(s), sure);
    const sel = '#verseList .verse-item[data-versnr="' + vers + '"] .verse-ar .qw[data-w="' + wort + '"]';
    await page.waitForSelector(sel, { timeout: 30000 });
    await page.evaluate(async () => { await document.fonts.load("40px 'Uthmanic Hafs'"); await document.fonts.ready; });
    await page.evaluate((sel) => document.querySelector(sel).scrollIntoView({ block: 'center', behavior: 'instant' }), sel);
    await page.waitForTimeout(300);
    await setze(sure, vers, wort, []);
    const vorher = await page.evaluate((sel) => {
      const sp = document.querySelector(sel);
      const r = sp.getBoundingClientRect();
      return { breite: r.width, rect: { x: r.left, y: r.top, w: r.width, h: r.height }, fs: parseFloat(getComputedStyle(sp).fontSize),
        text: sp.textContent, cluster: tajweedCluster(sp.textContent).map(c => ({ i: c.i, len: c.len })) };
    }, sel);
    if (!vorher.cluster.length){ pruefe(ort + ' hat Buchstaben', false, vorher); continue; }
    const m = vorher.fs;
    const clip = { x: Math.max(0, vorher.rect.x - 0.5 * m), y: Math.max(0, vorher.rect.y - 0.5 * m), width: vorher.rect.w + m, height: vorher.rect.h + m };
    const flach = await tinte(clip, BILD ? 'sin-' + sure + '-' + vers + '-flach' : '');
    if (flach.bg[0] > 80){ kannNicht = 'Hintergrund nicht dunkel (' + flach.bg + ')'; break; }
    const ziel = welcher === 'letzter' ? vorher.cluster[vorher.cluster.length - 1] : vorher.cluster[Math.floor(vorher.cluster.length / 2)];
    await setze(sure, vers, wort, [ziel.i]);
    await page.waitForTimeout(100);
    const nachher = await page.evaluate(([sel, ziel]) => {
      const sp = document.querySelector(sel);
      const b = sp.querySelector('.tj-buchstabe');
      return { breite: sp.getBoundingClientRect().width, text: sp.textContent, spans: sp.querySelectorAll('.tj-buchstabe').length,
        spanText: b ? b.textContent : '', klasse: b ? b.className : '', hat: sp.classList.contains('tj-hat'),
        sollText: sp.textContent.slice(ziel.i, ziel.i + ziel.len) };
    }, [sel, ziel]);
    const markiert = await tinte(clip, BILD ? 'sin-' + sure + '-' + vers + '-markiert' : '');
    const weg = await verloren(flach, markiert);
    pruefe(ort + ' (' + name + '): markiert fehlt kein Stück des Wortes (verschwunden: ' + weg + ')', weg >= 0 && weg <= VERLUST_MAX, { verschwunden: weg });
    pruefe(ort + ' (' + name + '): die Markierung ist rot zu sehen, der Rest bleibt weiß', markiert.rot > 50 && markiert.weiss > 50 && flach.rot === 0,
      { rotFlach: flach.rot, rot: markiert.rot, weiss: markiert.weiss });
    pruefe(ort + ': das Wort bleibt verbunden (gleich breit wie unmarkiert)', Math.abs(nachher.breite - vorher.breite) < 0.1,
      { vorher: vorher.breite, nachher: nachher.breite });
    pruefe(ort + ': genau EIN Farb-Span, mit genau dem markierten Buchstaben, Text unverändert',
      nachher.spans === 1 && nachher.spanText === nachher.sollText && nachher.text === vorher.text && /\btj-rot\b/.test(nachher.klasse) && nachher.hat, nachher);
    /* Die Tinte: ALLE Buchstaben markiert gegen das GANZE Wort per style.color rot (die
       Vorlage — dort schneidet nichts). Gleiche Farbe überall, also hängt die Zahl nur daran,
       ob etwas fehlt. ⚠️ Nicht „markiert gegen unmarkiert": Chromium glättet Weiß und Rot
       verschieden stark (gemessen 24.10.2026: 3 Prozent Unterschied ohne jeden Schnitt). */
    await setze(sure, vers, wort, []);
    await page.evaluate((sel) => { document.querySelector(sel).style.color = 'var(--tj-rot)'; }, sel);
    await page.waitForTimeout(100);
    const vorlage = await tinte(clip, BILD ? 'sin-' + sure + '-' + vers + '-vorlage' : '');
    await page.evaluate((sel) => { document.querySelector(sel).style.removeProperty('color'); }, sel);
    await setze(sure, vers, wort, vorher.cluster.map(c => c.i));
    await page.waitForTimeout(100);
    const alle = await tinte(clip, BILD ? 'sin-' + sure + '-' + vers + '-alle' : '');
    const alleDom = await page.evaluate((sel) => { const sp = document.querySelector(sel);
      return { breite: sp.getBoundingClientRect().width, spans: sp.querySelectorAll('.tj-buchstabe').length, text: sp.textContent }; }, sel);
    const verhaeltnis = alle.deckung / vorlage.deckung;
    pruefe(ort + ': alle Buchstaben markiert steht genauso viel Tinte da wie das ganze Wort in Rot (' + verhaeltnis.toFixed(4) + ')',
      Math.abs(verhaeltnis - 1) <= TOLERANZ, { vorlage: vorlage.deckung, alle: alle.deckung, verhaeltnis: +verhaeltnis.toFixed(4) });
    pruefe(ort + ': … und ist dabei so breit wie unmarkiert (' + vorher.cluster.length + ' Farb-Spans, Verbindung bleibt)',
      alleDom.spans === vorher.cluster.length && alleDom.text === vorher.text && Math.abs(alleDom.breite - vorher.breite) < 0.1, { vorher: vorher.breite, alleDom });
    await setze(sure, vers, wort, []);
    const wieder = await page.evaluate((sel) => { const sp = document.querySelector(sel);
      return { kinder: sp.childElementCount, knoten: sp.childNodes.length, hat: sp.classList.contains('tj-hat'), breite: sp.getBoundingClientRect().width }; }, sel);
    pruefe(ort + ': weggenommen ist das Wort wieder flach (ein Textknoten, keine Klasse)', wieder.kinder === 0 && wieder.knoten === 1 && !wieder.hat, wieder);

    if (sure === 75){
      /* Die große Karte: dasselbe Wort, derselbe Buchstabe markiert. */
      await setze(sure, vers, wort, [ziel.i]);
      const offen = async () => {
        await page.evaluate(([sel, vers, wort]) => tajweedKarteOeffnen(document.querySelector(sel), vers, wort), [sel, vers, wort]);
        await page.waitForTimeout(700);
        return page.evaluate(() => { const w = document.getElementById('tjWort'); const r = w.getBoundingClientRect();
          const b = w.querySelector('.tj-buchstabe');
          return { rect: { x: r.left, y: r.top, w: r.width, h: r.height }, spans: w.querySelectorAll('.tj-buchstabe').length, spanText: b ? b.textContent : '',
            text: w.textContent, fs: parseFloat(getComputedStyle(w).fontSize),
            breite: (() => { const g = document.createRange(); g.selectNodeContents(w); return g.getBoundingClientRect().width; })() }; });
      };
      /* Die Trefferflächen werden für jedes Bild ausgeblendet — ihre Striche sind auch rot. */
      const ohneFlaechen = () => page.evaluate(() => { document.getElementById('tjFlaechen').style.visibility = 'hidden'; });
      const k1 = await offen();
      const kclip = (k) => ({ x: Math.max(0, k.rect.x), y: Math.max(0, k.rect.y - 0.2 * k1.fs), width: k1.rect.w, height: k1.rect.h + 0.4 * k1.fs });
      await ohneFlaechen(); await page.waitForTimeout(100);
      const kEins = await tinte(kclip(k1), BILD ? 'sin-karte-markiert' : '');
      await page.evaluate(() => tajweedKarteSchliessen());
      await setze(sure, vers, wort, []);
      const k0 = await offen();
      await ohneFlaechen(); await page.waitForTimeout(100);
      const kFlach = await tinte(kclip(k0), BILD ? 'sin-karte-flach' : '');
      pruefe('Karte ' + ort + ': der markierte Buchstabe steht in einem Farb-Span, Text unverändert',
        k1.spans === 1 && k1.spanText === nachher.sollText && k1.text === vorher.text && k0.spans === 0, { k1, k0 });
      pruefe('Karte ' + ort + ': gleich groß und gleich breit wie unmarkiert', k1.fs === k0.fs && Math.abs(k1.breite - k0.breite) < 0.2, { fs: [k1.fs, k0.fs], breite: [k1.breite, k0.breite] });
      const kWeg = await verloren(kFlach, kEins);
      pruefe('Karte ' + ort + ': markiert fehlt kein Stück des Wortes (verschwunden: ' + kWeg + ')', kWeg >= 0 && kWeg <= VERLUST_MAX * 4, { verschwunden: kWeg });
      /* Tinte wie oben: Vorlage = ganzes Wort rot, dagegen alle Buchstaben markiert. */
      await page.evaluate(() => { document.getElementById('tjFlaechen').style.visibility = 'hidden'; document.getElementById('tjWort').style.color = 'var(--tj-rot)'; });
      await page.waitForTimeout(100);
      const kVorlage = await tinte(kclip(k0), BILD ? 'sin-karte-vorlage' : '');
      await page.evaluate(() => { document.getElementById('tjWort').style.removeProperty('color'); tajweedKarteSchliessen(); });
      await setze(sure, vers, wort, vorher.cluster.map(c => c.i));
      const kAlle = await offen();
      await page.evaluate(() => { document.getElementById('tjFlaechen').style.visibility = 'hidden'; });
      await page.waitForTimeout(100);
      const kTinte = await tinte(kclip(kAlle), BILD ? 'sin-karte-alle' : '');
      await page.evaluate(() => { document.getElementById('tjFlaechen').style.removeProperty('visibility'); tajweedKarteSchliessen(); });
      await setze(sure, vers, wort, []);
      const kv = kTinte.deckung / kVorlage.deckung;
      pruefe('Karte ' + ort + ': alle markiert genauso viel Tinte wie das ganze Wort in Rot, gleich breit',
        Math.abs(kv - 1) <= TOLERANZ && kTinte.rot > 50 && Math.abs(kAlle.breite - k0.breite) < 0.2,
        { vorlage: kVorlage.deckung, alle: kTinte.deckung, verhaeltnis: +kv.toFixed(4), breite: [kAlle.breite, k0.breite] });
    }
  }
  if (!kannNicht) pruefe('keine Seitenfehler', fehler.length === 0, fehler);
} finally { await browser.close(); server.close(); }

if (kannNicht){ console.log('⛔ kann nicht messen: ' + kannNicht); process.exit(3); }
console.log('\n' + ok + ' von ' + (ok + schlecht) + ' grün');
process.exit(schlecht ? 1 : 0);
