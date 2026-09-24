/* test-upload-beleg.mjs — faellt ein GESCHEITERTER Upload auf? (24.09.2026)
 *
 *   node test-upload-beleg.mjs
 *
 * Anlass: am 24.09.2026 um 22:03 scheiterte der Upload (npm antwortete E404
 * auf wrangler 4.139.0), und werkzeuge/pruefe-ausgeliefert.mjs meldete direkt
 * danach Exit 0 — es verglich das frisch GEBAUTE .deploy/ mit der
 * Arbeitskopie, nicht mit dem, was oben liegt.
 *
 * Der Test spielt Auslieferungen in einer Kopie durch: die App-Dateien aus
 * .deploy/, dazu veroeffentlichen.mjs, pruefe-ausgeliefert.mjs und
 * pruefe-erreichbarkeit.js. Vorn im PATH liegt ein falsches npx.cmd — es
 * schreibt seine Argumente mit und scheitert auf Wunsch mit „E404", wie am
 * 24.09. Cloudflare wird nie erreicht; spraenge doch einmal der echte Wrangler
 * an, scheiterte er am ungueltigen CLOUDFLARE_API_TOKEN.
 *
 *   1. Upload gelingt               → Beleg da, beide Pruefer ohne Befund
 *   2. Aenderung, Upload scheitert  → kein Beleg, beide Pruefer melden es
 *      ⭐ Gegenprobe: mit untergeschobenem Beleg ist derselbe Stand gruen —
 *      der Dateivergleich allein sieht den Fehlschlag nicht. Genau so war es.
 *   3. derselbe Upload gelingt      → wieder gruen
 *   4. npx bekam jedes Mal eine feste Wrangler-Version
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HIER = path.dirname(fileURLToPath(import.meta.url));
let fehler = 0;
const ok = (bed, was) => { console.log((bed ? '  ok   ' : '  FEHLER ') + was); if (!bed) fehler++; };

if (!fs.existsSync(path.join(HIER, '.deploy', 'sw.js'))){
  console.log('⛔ .deploy/ fehlt — ohne eine erste Auslieferung gibt es nichts zu kopieren.');
  process.exit(1);
}

const T = fs.mkdtempSync(path.join(os.tmpdir(), 'test-upload-beleg-'));
const K = path.join(T, 'kopie');   /* die Wurzel der Kopie */
const BIN = path.join(T, 'bin');   /* das falsche npx */
const BELEG = path.join(K, '.deploy', '.hochgeladen.json');
const SCHEITERN = path.join(BIN, 'scheitern');

const pfad = Object.keys(process.env).find(k => k.toUpperCase() === 'PATH') || 'PATH';
const ENV = { ...process.env, [pfad]: BIN + path.delimiter + process.env[pfad],
  CLOUDFLARE_API_TOKEN: 'ungueltig-test-upload-beleg', CLOUDFLARE_ACCOUNT_ID: '0'.repeat(32) };

function lauf(datei, args = []){
  try {
    return { code: 0, text: execFileSync(process.execPath, [path.join(K, datei), ...args],
      { cwd: K, env: ENV, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000 }) };
  } catch (e){
    return { code: e.status ?? -1, text: String(e.stdout || '') + String(e.stderr || '') };
  }
}
const ausliefern = () => lauf('werkzeuge/veroeffentlichen.mjs', ['--mit-daten']);
const ausgeliefert = () => lauf('werkzeuge/pruefe-ausgeliefert.mjs');
const erreichbar = () => lauf('pruefe-erreichbarkeit.js');
const MELDUNG = /NICHT als hochgeladen belegt/;

try {
  fs.cpSync(path.join(HIER, '.deploy'), K, { recursive: true,
    filter: q => path.basename(q) !== '.hochgeladen.json' });
  fs.mkdirSync(path.join(K, 'werkzeuge'));
  for (const f of ['werkzeuge/veroeffentlichen.mjs', 'werkzeuge/pruefe-ausgeliefert.mjs',
                   'pruefe-erreichbarkeit.js', '.access-geprueft.json'])
    fs.copyFileSync(path.join(HIER, f), path.join(K, f));
  fs.mkdirSync(BIN);
  fs.writeFileSync(path.join(BIN, 'npx.cmd'), '@echo off\r\n'
    + '>>"%~dp0aufrufe.txt" echo %*\r\n'
    + 'if exist "%~dp0scheitern" (\r\n'
    + '  echo npm error code E404 1>&2\r\n'
    + '  exit /b 1\r\n'
    + ')\r\n'
    + 'echo Attrappe: Deployment complete\r\n'
    + 'exit /b 0\r\n');

  /* 1. Upload gelingt */
  let v = ausliefern();
  ok(v.code === 0 && fs.existsSync(BELEG), '1. Upload gelingt → Exit ' + v.code + ', Beleg in .deploy/');
  let p = ausgeliefert();
  ok(p.code === 0, '   pruefe-ausgeliefert gruen (Exit ' + p.code + ')');
  let e = erreichbar();
  ok(!MELDUNG.test(e.text), '   pruefe-erreichbarkeit ohne Upload-Befund');

  /* 2. Eine Aenderung, und der Upload scheitert — der Fall vom 24.09. */
  fs.appendFileSync(path.join(K, 'sw.js'), '\n// test-upload-beleg: eine Aenderung, die nie oben ankommt\n');
  fs.writeFileSync(SCHEITERN, '');
  v = ausliefern();
  ok(v.code !== 0 && /Upload ist fehlgeschlagen/.test(v.text), '2. Upload scheitert (E404) → Exit ' + v.code);
  ok(!fs.existsSync(BELEG), '   kein Beleg in .deploy/');
  ok(fs.readFileSync(path.join(K, '.deploy', 'sw.js'), 'utf8').includes('test-upload-beleg'),
    '   .deploy/ ist trotzdem neu gebaut — die Falle ist nachgestellt');
  p = ausgeliefert();
  ok(p.code === 1 && MELDUNG.test(p.text), '   pruefe-ausgeliefert ROT (Exit ' + p.code + ')');
  e = erreichbar();
  ok(e.code !== 0 && MELDUNG.test(e.text), '   pruefe-erreichbarkeit meldet es auch (Exit ' + e.code + ')');
  fs.writeFileSync(BELEG, '{ "hochgeladen": "2026-09-24T20:03:00.000Z", "wrangler": "untergeschoben" }\n');
  p = ausgeliefert();
  ok(p.code === 0, '   Gegenprobe: mit untergeschobenem Beleg Exit ' + p.code
    + ' — der Dateivergleich allein sieht den Fehlschlag nicht');
  fs.rmSync(BELEG);

  /* 3. Derselbe Upload gelingt */
  fs.rmSync(SCHEITERN);
  v = ausliefern();
  ok(v.code === 0 && fs.existsSync(BELEG), '3. derselbe Upload gelingt → Beleg wieder da');
  p = ausgeliefert();
  ok(p.code === 0, '   pruefe-ausgeliefert wieder gruen (Exit ' + p.code + ')');

  /* 4. Was npx bekommen hat */
  const aufrufe = fs.readFileSync(path.join(BIN, 'aufrufe.txt'), 'utf8').trim().split(/\r?\n/);
  ok(aufrufe.length === 3, '4. das falsche npx wurde ' + aufrufe.length + '-mal gerufen (3 erwartet)');
  ok(aufrufe.every(z => /pages deploy/.test(z) && /wrangler@\d+\.\d+\.\d+ /.test(z)),
    '   jedes Mal mit fester Version: ' + (aufrufe[0].match(/wrangler@\S+/) || ['keine'])[0]);
} finally {
  fs.rmSync(T, { recursive: true, force: true });
}

console.log(fehler ? '\n⛔ ' + fehler + ' Fehler' : '\n✅ Ein gescheiterter Upload faellt auf, und Wrangler hat eine feste Version.');
process.exit(fehler ? 1 : 0);
