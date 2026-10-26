#!/usr/bin/env node
/* satzmodus-sichtbar.mjs — welche Sätze sieht Elias im Satzmodus? Die echte App sagt es.
 * ==========================================================================
 *
 * Elias am 26.10.2026 (Knopf auf meine Frage, ob ich die Zählung korrigieren soll):
 *   „Ja, korrigiere die Zählung auf der Seite „Regeln nach Kategorien", damit nur
 *    Sätze zählen, die ich schon sehen kann."
 *
 * Seit dem 20.10.2026 zeigt der Satzmodus den Satz einer Karte erst, wenn er die
 * Karte schon gesehen hat (schonGesehen() in js/kern.js, gefragt von
 * nichtVorausgeschrieben() in js/saetze.js). werkzeuge/regelkategorien-seite.mjs
 * baute die Auswahl bis dahin aus den Dateien nach und kannte diese Grenze nicht:
 * gemessen an seinem Stand vom 26.10.2026 zählte die Seite 179 Kartensätze mit
 * 366 Markierungen mit, die er nie zu sehen bekam.
 *
 * ⛔ Darum entscheidet hier die App selbst, kein Nachbau. Dieses Werkzeug startet
 * den Arbeitsordner in einem eigenen Edge (unsichtbar, Playwright aus dem
 * Korantrainer-Ordner, dort nur gelesen), legt SEINEN Gerätestand in den Speicher
 * dieses Edge, wartet auf STARTBESTAND_BEREIT (js/buecher.js) und fragt
 * alleSaetze() (js/saetze.js). Eine zweite Fassung von schonGesehen() hätte beim
 * nächsten Umbau still anders entschieden als die App.
 * [[entscheidung_gilt_fuer_das_zweite_werkzeug]]
 *
 * Sein Stand wird nur GELESEN. Der Edge hat einen eigenen, leeren Speicher ohne
 * Service Worker, jede Anfrage an einen anderen Rechner wird abgebrochen, und
 * /api/stand beantwortet der eigene Dateiserver mit 404. Der Lauf kann also nichts
 * in seinen Lernstand in der Cloud schreiben (wie werkzeuge/oberflaeche-lauf.mjs).
 *
 * ⚠️ Gemessen wird der ARBEITSORDNER, nicht die ausgelieferte Seite — derselbe
 * Stand, aus dem regelkategorien-seite.mjs baut.
 *
 * Ergebnis: .stand-satzmodus.json (nicht im Repo, wie .stand-app.json)
 *   abgefragt     wann sein Stand gelesen wurde (bei --stand: Änderungszeit der Datei)
 *   geaendert     sein letzter Abgleich laut Stand (Feld `geaendert`)
 *   app           CACHE_NAME aus sw.js
 *   dateien       jede .html/.js/.json-Datei, die die App beim Lauf geladen hat, mit
 *                 sha1. regelkategorien-seite.mjs baut nicht, wenn sich eine davon
 *                 seitdem geändert hat — dann ist die Messung alt.
 *   sichtbar      Kennungen aller Sätze aus alleSaetze()
 *   ausgeblendet  je MARKIERTEM Satz, den alleSaetze() nicht liefert, der Grund —
 *                 gefragt bei der App (ganzHinten, schonGesehen, istBekannt), nicht
 *                 nachgerechnet
 *
 * Aufruf:  node werkzeuge/satzmodus-sichtbar.mjs                  Stand aus dem KV holen
 *          node werkzeuge/satzmodus-sichtbar.mjs --stand <datei>  Stand aus einem KV-Abzug
 * Exit 0 = geschrieben · 1 = Lauf fehlerhaft, nichts geschrieben · 3 = kann nicht laufen
 *
 * Bewacht von test-satzmodus-sichtbar.mjs.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { mitWiederholung } from './kv-abruf.mjs';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const MESSUNG = path.join(WURZEL, '.stand-satzmodus.json');

const sha1 = p => crypto.createHash('sha1').update(fs.readFileSync(p)).digest('hex');

/* ---------- Lesen (für regelkategorien-seite.mjs und den Test) ----------
   Gibt { messung } zurück oder { fehler } — nie still eine halbe Messung. */
export function messungLesen(datei = MESSUNG, wurzel = WURZEL) {
  if (!fs.existsSync(datei))
    return { fehler: 'Messung fehlt (' + datei + ') — erst `node werkzeuge/satzmodus-sichtbar.mjs` laufen lassen' };
  let m;
  try { m = JSON.parse(fs.readFileSync(datei, 'utf8')); }
  catch (e) { return { fehler: 'Messung unlesbar: ' + e.message }; }
  if (!m || !Array.isArray(m.sichtbar) || !m.sichtbar.length || !m.ausgeblendet
      || !m.dateien || !Object.keys(m.dateien).length)
    return { fehler: 'Messung unvollständig (sichtbar, ausgeblendet oder dateien fehlt)' };
  const geaendert = Object.entries(m.dateien)
    .filter(([rel, h]) => { const p = path.join(wurzel, rel); return !fs.existsSync(p) || sha1(p) !== h; })
    .map(([rel]) => rel);
  if (geaendert.length)
    return { fehler: 'Messung ist alt: ' + geaendert.length + ' Datei(en) der App seit der Messung geändert ('
      + geaendert.slice(0, 6).join(', ') + (geaendert.length > 6 ? ', …' : '') + ') — neu messen mit `node werkzeuge/satzmodus-sichtbar.mjs`' };
  return { messung: m };
}

/* ---------- Zählen ----------
   Markierungen je Regel, aber nur in Sätzen, die die App ihm zeigt. Was nicht
   gezählt wird, steht mit dem Grund der App in `nichtGezaehlt`. Ein markierter
   Satz, den die Messung gar nicht kennt, landet in `unbekannt` — dann passen
   Messung und Daten nicht zusammen, und der Aufrufer muss abbrechen. */
export function zaehleSichtbar(tags, messung) {
  const sichtbar = new Set(messung.sichtbar.map(String));
  const marken = {}, nichtGezaehlt = {}, unbekannt = [];
  let saetze = 0, stellen = 0;
  for (const [satzId, liste] of Object.entries(tags)) {
    if (!liste || !liste.length) continue;
    if (sichtbar.has(satzId)) {
      saetze++;
      for (const t of liste) { marken[t.ruleId] = (marken[t.ruleId] || 0) + 1; stellen++; }
      continue;
    }
    const grund = messung.ausgeblendet[satzId];
    if (!grund) { unbekannt.push(satzId); continue; }
    const g = nichtGezaehlt[grund] || (nichtGezaehlt[grund] = { saetze: 0, stellen: 0 });
    g.saetze++; g.stellen += liste.length;
  }
  return { marken, saetze, stellen, nichtGezaehlt, unbekannt };
}

/* ---------- Messen ---------- */
function kvHolen() {
  /* Derselbe Weg wie vorrat.mjs --app auto: Namensraum aus wrangler.toml,
     wrangler in fester Fassung, cmd /c gegen die zwei Windows-Fallen,
     ein zweiter Versuch über kv-abruf.mjs. [[npm_global_windows_fallen]] */
  const NS = (fs.readFileSync(path.join(WURZEL, 'wrangler.toml'), 'utf8').match(/id\s*=\s*"([0-9a-f]{32})"/) || [])[1];
  if (!NS) throw new Error('KV-Namensraum nicht in wrangler.toml gefunden');
  const SCHLUESSEL = 'stand:' + (process.env.VT_MAIL || 'abdurahman.tunk@gmail.com');
  const win = process.platform === 'win32';
  const args = ['wrangler@4.124.0', 'kv', 'key', 'get', '--namespace-id=' + NS, SCHLUESSEL, '--remote'];
  const r = mitWiederholung(win ? 'cmd' : 'npx', win ? ['/c', 'npx', ...args] : args,
    { cwd: WURZEL, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 180000, maxBuffer: 64 * 1024 * 1024 });
  if (r.versuch > 1) console.log('  ⚠️ KV-Abruf klappte erst im ' + r.versuch + '. Versuch.');
  return r.text;
}

async function messen() {
  const args = process.argv.slice(2);
  const iStand = args.indexOf('--stand');
  let text, abgefragt, quelle;
  try {
    if (iStand >= 0) {
      if (!args[iStand + 1]) { console.error('⛔ --stand braucht eine Datei.'); process.exit(3); }
      quelle = path.resolve(args[iStand + 1]);
      text = fs.readFileSync(quelle, 'utf8');
      abgefragt = fs.statSync(quelle).mtime.toISOString();
    } else {
      quelle = 'KV';
      text = kvHolen();
      abgefragt = new Date().toISOString();
    }
  } catch (e) {
    console.error('⛔ Sein Stand ist nicht zu bekommen: ' + String(e.message || e).split('\n')[0]);
    console.error('   Exit 3 heißt „kann nicht laufen". Die alte Messung bleibt liegen.');
    process.exit(3);
  }
  let kv;
  try { kv = JSON.parse(String(text).trim()); } catch (e) { console.error('⛔ Der Stand ist kein JSON.'); process.exit(1); }
  if (!kv || !kv.daten || typeof kv.daten !== 'object') { console.error('⛔ Im Stand fehlt `daten`.'); process.exit(1); }
  const eintraege = Object.entries(kv.daten).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]);
  let kvFortschritt = 0;
  try { kvFortschritt = Object.keys(JSON.parse(kv.daten.vt_progress || '{}')).length; } catch (e) { /* bleibt 0 */ }

  let chromium;
  try { ({ chromium } = createRequire(path.join(WURZEL, '..', 'Quran Trainer', 'package.json'))('playwright')); }
  catch (e) { console.error('⛔ Playwright nicht gefunden (gesucht im Korantrainer-Ordner). Exit 3.'); process.exit(3); }

  const TYP = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json',
    '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };
  const geladen = new Set();
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const datei = path.join(WURZEL, p);
    if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) { res.writeHead(404); res.end(); return; }
    if (/\.(?:html|m?js|json)$/i.test(datei)) geladen.add(path.relative(WURZEL, datei).split(path.sep).join('/'));
    res.writeHead(200, { 'content-type': TYP[path.extname(datei).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
    fs.createReadStream(datei).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));

  const seitenfehler = [], fremd = new Map();
  let e;
  let browser;
  try { browser = await chromium.launch({ channel: 'msedge', headless: true }); }
  catch (err) { server.close(); console.error('⛔ Edge startet nicht: ' + String(err.message || err).split('\n')[0] + ' — Exit 3.'); process.exit(3); }
  try {
    const ADRESSE = 'http://127.0.0.1:' + server.address().port;
    /* Sein Stand in den Speicher DIESES Edge — über storageState, einmal beim
       Anlegen und nur für diese eine Adresse. */
    const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, serviceWorkers: 'block',
      storageState: { cookies: [], origins: [{ origin: ADRESSE, localStorage: eintraege.map(([name, value]) => ({ name, value })) }] } });
    await ctx.route('**/*', route => {
      const u = new URL(route.request().url());
      if (u.hostname === '127.0.0.1') return route.continue();
      fremd.set(u.host, (fremd.get(u.host) || 0) + 1);
      return route.abort();
    });
    const page = await ctx.newPage();
    page.on('pageerror', err => seitenfehler.push(String(err.message || err).split('\n')[0]));
    await page.goto(ADRESSE + '/', { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => typeof STARTBESTAND_BEREIT !== 'undefined' && typeof alleSaetze === 'function',
      null, { timeout: 120000 });
    e = await page.evaluate(async () => {
      await STARTBESTAND_BEREIT;
      const ids = () => alleSaetze().map(s => String(s.id));
      const sichtbar = ids();
      /* Zweimal fragen: ändert sich die Liste noch, war der Bestand nicht fertig. */
      await new Promise(r => setTimeout(r, 1500));
      const nochmal = ids();
      const sicht = new Set(sichtbar);
      const nachId = new Map();
      for (const w of VOCAB_DATA) { const k = String(w.id); if (!nachId.has(k)) nachId.set(k, w); }
      const ausgeblendet = {};
      for (const [id, liste] of Object.entries(SENTENCE_TAGS)) {
        if (!liste || !liste.length || sicht.has(id)) continue;
        const w = nachId.get(id);
        ausgeblendet[id] = !w ? 'keine Karte in der App'
          : !w.sentAr ? 'Karte ohne Satz'
          : (typeof ganzHinten === 'function' && ganzHinten(w)) ? 'ganz hinten'
          : !schonGesehen(w) ? 'Karte noch nie gesehen'
          : (typeof istBekannt === 'function' && !istBekannt(w)) ? 'Kapitel nicht freigeschaltet'
          : 'anderer Grund';
      }
      const buecher = Object.keys((SETTINGS && SETTINGS.buecher) || {})
        .filter(b => Array.isArray(SETTINGS.buecher[b]) && SETTINGS.buecher[b].length);
      return {
        sichtbar, stabil: JSON.stringify(sichtbar) === JSON.stringify(nochmal), ausgeblendet,
        lehrbuchFehlt: (typeof LEHRBUCH_SAETZE !== 'undefined' ? LEHRBUCH_SAETZE : []).map(s => String(s.id)).filter(id => !sicht.has(id)),
        fortschritt: Object.keys(PROGRESS || {}).length,
        buecher, geladen: [...GELADENE_BUECHER], fehlt: (typeof BUCH_FEHLT !== 'undefined') ? [...BUCH_FEHLT] : [],
        app: (typeof CACHE_NAME !== 'undefined') ? CACHE_NAME : null,
      };
    });
    await ctx.close();
  } finally {
    await browser.close();
    server.close();
  }

  /* ---------- Ist die Messung brauchbar? Sonst nichts schreiben. ---------- */
  const probleme = [];
  if (seitenfehler.length) probleme.push(seitenfehler.length + ' Seitenfehler (erster: ' + seitenfehler[0] + ')');
  if (!e.stabil) probleme.push('alleSaetze() änderte sich nach STARTBESTAND_BEREIT noch — Bestand nicht fertig');
  if (!e.sichtbar.length) probleme.push('alleSaetze() ist leer');
  if (e.lehrbuchFehlt.length) probleme.push(e.lehrbuchFehlt.length + ' Lehrbuchsätze fehlen, die immer kommen müssten (z. B. ' + e.lehrbuchFehlt.slice(0, 3).join(', ') + ')');
  const nichtGeladen = e.buecher.filter(b => !e.geladen.includes(b) || e.fehlt.includes(b));
  if (nichtGeladen.length) probleme.push('Buch nicht geladen: ' + nichtGeladen.join(', '));
  if (kvFortschritt && !e.fortschritt) probleme.push('sein Fortschritt kam nicht in der App an (Stand: ' + kvFortschritt + ' Einträge, App: 0)');
  if (probleme.length) {
    console.error('⛔ Messung unbrauchbar, nichts geschrieben:');
    for (const p of probleme) console.error('   - ' + p);
    process.exit(1);
  }

  const swText = fs.readFileSync(path.join(WURZEL, 'sw.js'), 'utf8');
  const app = (swText.match(/CACHE_NAME\s*=\s*['"]([^'"]+)['"]/) || [])[1] || e.app || null;
  const dateien = {};
  for (const rel of [...geladen].sort()) dateien[rel] = sha1(path.join(WURZEL, rel));
  const messung = {
    abgefragt, quelle,
    geaendert: kv.geaendert ? new Date(Number(kv.geaendert)).toISOString() : null,
    app, dateien,
    sichtbar: e.sichtbar,
    ausgeblendet: e.ausgeblendet,
  };
  fs.writeFileSync(MESSUNG + '.neu', JSON.stringify(messung, null, 1) + '\n', 'utf8');
  fs.renameSync(MESSUNG + '.neu', MESSUNG);

  /* ---------- Bericht ---------- */
  const gruende = {};
  for (const g of Object.values(e.ausgeblendet)) gruende[g] = (gruende[g] || 0) + 1;
  const wann = messung.geaendert ? new Date(messung.geaendert).toLocaleString('de-DE') : 'unbekannt';
  console.log('Geschrieben: ' + path.relative(WURZEL, MESSUNG));
  console.log('  sein Stand: ' + (quelle === 'KV' ? 'aus dem KV' : quelle) + ', letzter Abgleich ' + wann
    + ' · Fortschritt ' + e.fortschritt + ' Einträge (Stand: ' + kvFortschritt + ')');
  console.log('  Bücher: ' + (e.buecher.join(', ') || '—') + ' · App ' + (app || '?') + ' · ' + Object.keys(dateien).length + ' Dateien im Fingerabdruck');
  console.log('  sichtbar: ' + e.sichtbar.length + ' Sätze · markiert, aber nicht sichtbar: '
    + Object.keys(e.ausgeblendet).length + ' Sätze ('
    + Object.entries(gruende).sort((a, b) => b[1] - a[1]).map(([g, n]) => g + ' ' + n).join(', ') + ')');
  if (fremd.size) console.log('  abgebrochen (anderer Rechner): ' + [...fremd].map(([h, n]) => h + ' ' + n).join(', '));
  if (gruende['anderer Grund']) console.log('  ⚠️ ' + gruende['anderer Grund'] + ' Satz/Sätze aus einem Grund, den dieses Werkzeug nicht benennt — nachsehen.');
}

const direkt = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (direkt) await messen();
