/* test-kv-abruf.mjs — der zweite Versuch beim KV-Abruf (17.09.2026)
 *
 *   node test-kv-abruf.mjs
 *
 * Prüft werkzeuge/kv-abruf.mjs mit echten Kindprozessen (kein Netz nötig) und
 * dass vorrat.mjs den Gerätestand wirklich über diesen Weg holt. Anlass: der
 * Abruf scheiterte am 09.09., 13.09. und 16.09. beim ersten Versuch, und
 * vorrat.mjs gab sofort auf.
 *
 * ⭐ Fall 2 ist der Kern und hat seine Gegenprobe eingebaut: derselbe
 * „scheitert einmal, dann klappt es"-Befehl MUSS mit nur einem Versuch
 * scheitern — sonst beweist das Bestehen mit zwei Versuchen nichts.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mitWiederholung } from './werkzeuge/kv-abruf.mjs';

const HIER = path.dirname(fileURLToPath(import.meta.url));
let fehler = 0;
const ok = (bed, was) => { console.log((bed ? '  ok   ' : '  FEHLER ') + was); if (!bed) fehler++; };
const NODE = process.execPath;
const OPT = { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] };
const SCHNELL = { warteSek: 0.1 };

/* 1. Klappt sofort: ein Versuch, Text kommt durch. */
{
  const r = mitWiederholung(NODE, ['-e', 'process.stdout.write("stand")'], OPT, SCHNELL);
  ok(r.text === 'stand' && r.versuch === 1, 'klappt sofort → 1 Versuch, Text unverändert');
}

/* 2. Scheitert einmal, dann klappt es — über eine Zähldatei. */
const zaehler = path.join(os.tmpdir(), 'test-kv-abruf-' + process.pid + '.txt');
const einmalKaputt = 'const f=process.argv[1];const n=require("fs").existsSync(f)?+require("fs").readFileSync(f,"utf8"):0;'
  + 'require("fs").writeFileSync(f,String(n+1));if(n===0)process.exit(1);process.stdout.write("stand")';
try {
  fs.rmSync(zaehler, { force: true });
  let r = null;
  try { r = mitWiederholung(NODE, ['-e', einmalKaputt, zaehler], OPT, SCHNELL); } catch (e){ r = null; }
  ok(r && r.text === 'stand' && r.versuch === 2, 'scheitert einmal → klappt im 2. Versuch');

  fs.rmSync(zaehler, { force: true });
  let geworfen = null;
  try { mitWiederholung(NODE, ['-e', einmalKaputt, zaehler], OPT, { versuche: 1, warteSek: 0 }); }
  catch (e){ geworfen = e; }
  ok(geworfen && /nach 1 Versuch:/.test(geworfen.message), 'Gegenprobe: derselbe Befehl mit nur 1 Versuch scheitert');
} finally {
  fs.rmSync(zaehler, { force: true });
}

/* 3. Scheitert immer: wirft, und die Meldung sagt, wie oft versucht wurde. */
{
  let geworfen = null;
  const t0 = Date.now();
  try { mitWiederholung(NODE, ['-e', 'process.exit(3)'], OPT, SCHNELL); }
  catch (e){ geworfen = e; }
  ok(geworfen && /^nach 2 Versuchen:/.test(geworfen.message), 'scheitert immer → Fehler „nach 2 Versuchen"');
  ok(Date.now() - t0 >= 100, 'zwischen den Versuchen wird gewartet');
}

/* 4. vorrat.mjs benutzt diesen Weg für den KV-Abruf — und nicht wieder den direkten. */
{
  const q = fs.readFileSync(path.join(HIER, 'werkzeuge', 'vorrat.mjs'), 'utf8');
  const code = q.replace(/\/\*[\s\S]*?\*\//g, '');
  ok(/import\s*\{\s*mitWiederholung\s*\}\s*from\s*'\.\/kv-abruf\.mjs'/.test(code), 'vorrat.mjs importiert mitWiederholung');
  const kv = code.slice(code.indexOf("'kv', 'key', 'get'"));
  ok(/mitWiederholung\(befehl/.test(kv.slice(0, 600)) && !/execFileSync\(befehl/.test(kv.slice(0, 600)),
    'der KV-Abruf in vorrat.mjs läuft über mitWiederholung, nicht über execFileSync direkt');
}

console.log(fehler ? '\n⛔ ' + fehler + ' Fehler' : '\n✅ KV-Abruf mit zweitem Versuch geprüft.');
process.exit(fehler ? 1 : 0);
