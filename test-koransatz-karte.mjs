#!/usr/bin/env node
/* test-koransatz-karte.mjs — der Koransatz steht auf der Lernkarte und in der Wortkarte (24.10.2026).
 *
 * Elias, 23.10.2026, 23:25: „für die koranwörter von den häufigsten gibt es keinen beispielsatz, da kannst du ruhig
 * aus dem koran die nehmen vorallem wenn ich sie bereits kenne".
 *
 * Die echte App in Edge (headless, ohne Service Worker). Geprüft wird:
 *   1. koranKarten() bringt `koranSatz` an jede Karte der Gruppe;
 *   2. eine Karte OHNE eigenen Satz zeigt auf der Rückseite den Vers: Kasten sichtbar, genau EIN Wort hervorgehoben,
 *      und zwar das an Stelle `w`; darunter das Deutsch (verwischt wie jeder Kartensatz) und Sure mit Vers;
 *   3. eine Karte MIT eigenem Satz zeigt ihren Satz und keine Quellenzeile — der Vers ist nur der Ersatz;
 *   4. die Wortkarte zeigt den Vers unter „Beispielsatz" mit „aus dem Koran";
 *   5. der Satzmodus nimmt keinen Koransatz auf (seine Liste liest nur `sentAr`).
 * Störtest: node test-koransatz-karte.mjs --lernen <js/lernen.js ohne den Koransatz> → muss rot werden
 *           (zuletzt mit der Fassung von v715: 4 von 9 grün). */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const WURZEL = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const wert = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const ERSATZ = wert('--lernen');
let chromium;
try { ({ chromium } = createRequire(path.join(WURZEL, '..', 'Quran Trainer', 'package.json'))('playwright')); }
catch (e){ console.log('⚠️ playwright nicht gefunden (Quran Trainer/node_modules) — Test nicht gelaufen'); process.exit(1); }
const TYP = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.woff2': 'font/woff2', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const datei = (ERSATZ && p === '/js/lernen.js') ? path.resolve(ERSATZ) : path.join(WURZEL, p);
  if (!fs.existsSync(datei) || fs.statSync(datei).isDirectory()){ res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYP[path.extname(datei).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(datei).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
let ok = 0, rot = 0;
const pruefe = (name, bed, info) => { if (bed){ ok++; console.log('  ✔ ' + name); } else { rot++; console.log('  ✘ ' + name + (info !== undefined ? ' — ' + JSON.stringify(info).slice(0, 300) : '')); } };
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await (await browser.newContext({ viewport: { width: 420, height: 900 }, serviceWorkers: 'block' })).newPage();
  const fehler = [];
  page.on('pageerror', e => fehler.push(String(e.message || e)));
  await page.goto('http://127.0.0.1:' + server.address().port + '/', { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => typeof renderCard === 'function' && typeof koranKarten === 'function' && typeof baueWortKarte === 'function'
    && typeof KORAN_HAEUFIG !== 'undefined', null, { timeout: 120000 });
  const m = await page.evaluate(() => {
    const karten = koranKarten();
    const BS = (typeof BEISPIELSAETZE !== 'undefined') ? BEISPIELSAETZE : {};
    const zeige = (k) => {
      SESSION.words = [k]; SESSION.idx = 0;
      let wurf = null;
      try { renderCard(); } catch (e){ wurf = String(e && e.message || e); }
      const box = document.getElementById('cardSentenceBox');
      const ref = document.getElementById('cardSentenceRef');
      const de = document.getElementById('cardSentenceDe');
      return { wurf, sichtbar: !!box && !box.classList.contains('hidden'),
        treffer: [...document.querySelectorAll('#cardSentenceAr .quran-treffer')].map(x => x.textContent),
        ar: document.getElementById('cardSentenceAr').textContent, de: de.textContent,
        verwischt: de.classList.contains('de-verschwommen'),
        ref: ref ? ref.textContent : null, refSichtbar: !!ref && !ref.classList.contains('hidden') };
    };
    const ohne = karten.find(k => k.koranSatz && !(BS[k.id] && BS[k.id].sentAr) && k.koranSatz.w > 1);
    const mitId = Object.keys(BS).find(id => id.startsWith('kh-') && BS[id].sentAr && karten.some(k => k.id === id && k.koranSatz));
    const mit = mitId ? Object.assign({}, karten.find(k => k.id === mitId), { sentAr: BS[mitId].sentAr, sentDe: BS[mitId].sentDe || '' }) : null;
    const a = ohne ? zeige(ohne) : null;
    const b = mit ? zeige(mit) : null;
    let wk = '';
    try { wk = ohne ? String(baueWortKarte(ohne)) : ''; } catch (e){ wk = 'WURF ' + e.message; }
    let wkMit = '';
    try { wkMit = mit ? String(baueWortKarte(mit)) : ''; } catch (e){ wkMit = 'WURF ' + e.message; }
    return { anzahl: karten.length, mitSatz: karten.filter(k => k.koranSatz && k.koranSatz.ar && k.koranSatz.w >= 1).length,
      ohne: ohne && { id: ohne.id, ks: ohne.koranSatz }, mitId, a, b,
      wkKoran: wk.includes('aus dem Koran') && wk.includes('quran-treffer'), wkMitKoran: wkMit.includes('aus dem Koran'),
      satzmodus: VOCAB_DATA.some(w => w && w.koranSatz && w.sentAr === w.koranSatz.ar) };
  });
  pruefe('jede Karte der Gruppe trägt einen Koransatz (koranKarten)', m.anzahl > 200 && m.mitSatz === m.anzahl, { anzahl: m.anzahl, mitSatz: m.mitSatz });
  if (!m.ohne || !m.a){ pruefe('eine Karte ohne eigenen Satz gefunden', false, m.ohne); }
  else {
    const woerter = m.ohne.ks.ar.split(/\s+/);
    pruefe(`${m.ohne.id} ohne eigenen Satz: der Satzkasten steht da`, m.a.sichtbar && !m.a.wurf, m.a);
    pruefe(`… mit genau einem hervorgehobenen Wort, dem an Stelle ${m.ohne.ks.w}`, m.a.treffer.length === 1 && m.a.treffer[0] === woerter[m.ohne.ks.w - 1], { treffer: m.a.treffer.length, w: m.ohne.ks.w });
    pruefe('… darunter das Deutsch, verwischt wie jeder Kartensatz', m.a.de === m.ohne.ks.de && m.a.verwischt, { de: m.a.de.slice(0, 60), verwischt: m.a.verwischt });
    pruefe('… und Sure mit Vers', m.a.refSichtbar && m.a.ref === m.ohne.ks.surah + ' ' + m.ohne.ks.ayah, { ref: m.a.ref, sichtbar: m.a.refSichtbar });
  }
  if (!m.b) pruefe('eine Karte der Gruppe mit eigenem Satz gefunden', false, m.mitId);
  else pruefe(`${m.mitId} mit eigenem Satz zeigt ihren Satz, keinen Vers und keine Quellenzeile`, m.b.sichtbar && !m.b.treffer.length && !m.b.refSichtbar && !m.b.wurf, m.b);
  pruefe('die Wortkarte zeigt den Vers unter „Beispielsatz" mit „aus dem Koran" — bei eigenem Satz nicht', m.wkKoran && !m.wkMitKoran, { wkKoran: m.wkKoran, wkMitKoran: m.wkMitKoran });
  pruefe('der Satzmodus nimmt keinen Koransatz auf', !m.satzmodus);
  pruefe('keine Seitenfehler', !fehler.length, fehler.slice(0, 3));
  /* --bild <datei> [<kennung>]: die Rückseite einer Karte als Bild, zum Ansehen */
  if (wert('--bild')){
    const id = args[args.indexOf('--bild') + 2] && /^kh-/.test(args[args.indexOf('--bild') + 2]) ? args[args.indexOf('--bild') + 2] : (m.ohne && m.ohne.id);
    /* Der Lernbildschirm ist beim Start nicht offen: der Kasten wird als Kopie obenauf gelegt (Klassen bleiben, also die Gestaltung). */
    await page.evaluate((id) => { const k = koranKarten().find(x => x.id === id); SESSION.words = [k]; SESSION.idx = 0; renderCard();
      const c = document.getElementById('cardSentenceBox').cloneNode(true); c.id = 'bildKasten';
      c.style.cssText = 'position:fixed;left:8px;top:8px;width:400px;z-index:99999;display:block'; document.body.appendChild(c); }, id);
    await page.waitForTimeout(700);
    await page.locator('#bildKasten').screenshot({ path: wert('--bild') });
    console.log('  Bild: ' + wert('--bild') + ' (' + id + ')');
  }
} finally { await browser.close(); server.close(); }
console.log(rot ? `⛔ test-koransatz-karte: ${rot} von ${ok + rot} rot.` : `✅ test-koransatz-karte: ${ok} von ${ok} grün.`);
process.exit(rot ? 1 : 0);
