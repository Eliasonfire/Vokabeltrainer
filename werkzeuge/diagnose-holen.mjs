/* diagnose-holen.mjs — holt die Diagnose, die Elias in der App geschickt hat.
 *
 *     node werkzeuge/diagnose-holen.mjs
 *
 * ⭐ WOZU. Elias am 15.09.2026: „es sollte bei dieser diagnose auch einen knopf
 * geben wo ich dir die ganze diagnose einfach per knopf zuschicken kann in der
 * app … der soll direkt zu dir gehen das ich einfach nur sagen muss hab die
 * diagnose geschickt."
 *
 * Vorher ging das nur als Bildschirmfoto, und zweimal hintereinander war
 * genau die Zeile abgeschnitten, auf die es ankam („35 von 76 Dateien FEHLEN:
 * index.html …" — welche 35?).
 *
 * Der Weg: Die App legt den Text ueber PUT /api/diagnose in denselben
 * Cloudflare-KV, in dem der Lernstand liegt. Dieses Werkzeug liest ihn dort.
 *
 * ⚠️ Es liest NUR. Der Schluessel wird nicht geloescht: eine Diagnose, die
 * beim ersten Lesen verschwindet, laesst sich nicht noch einmal ansehen, und
 * genau das braucht man beim Vergleichen von vorher und nachher.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* Die Namespace-ID steht in wrangler.toml — nicht hier abgeschrieben, sonst
   zeigt sie eines Tages auf einen Speicher, den es nicht mehr gibt. */
const toml = fs.readFileSync(path.join(WURZEL, 'wrangler.toml'), 'utf8');
const block = toml.slice(toml.indexOf('binding = "STAND"'));
const treffer = block.match(/id\s*=\s*"([0-9a-f]+)"/);
if (!treffer){
  console.log('⛔ Keine KV-Namespace-ID in wrangler.toml gefunden.');
  process.exit(1);
}
const namespace = treffer[1];

const args = process.argv.slice(2);
const wrangler = ['--yes', 'wrangler@4.120.1'];

/* ⛔ `npx` heisst unter Windows `npx.cmd`, und ein direkt aufgerufenes .cmd
   wirft seit Node 20 EINVAL — `cmd /c npx` geht durch die Shell und
   funktioniert. Genau so machen es regeln-holen.mjs, vorschlaege-holen.mjs
   und veroeffentlichen.mjs; `pruefe-werkzeugaufrufe.mjs` bewacht es.

   ⚠️ Hier stand bis zum 15.09.2026 `execFileSync('npx', …, { shell: true })`.
   Auf MEINEM Rechner lief das, weil die Shell das .cmd aufloest — auf Elias'
   nicht zwingend, und der Fehler waere erst aufgetreten, wenn er das Werkzeug
   selbst braucht. Ein Aufruf, der nur beim Entwickler funktioniert, ist kein
   funktionierender Aufruf. [[befehle_fuer_elias_powershell]] */
const WIN = process.platform === 'win32';

function ruf(unter){
  const args = [...wrangler, ...unter];
  return execFileSync(WIN ? 'cmd' : 'npx', WIN ? ['/c', 'npx', ...args] : args, {
    cwd: WURZEL, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']
  });
}

/* Welche Diagnose-Schluessel gibt es? Mehrere Adressen sind moeglich —
   Elias' Mutter und Schwester sind fuer die Koran-App freigeschaltet. */
let liste;
try {
  liste = JSON.parse(ruf(['kv', 'key', 'list', '--namespace-id', namespace, '--remote']));
} catch (e){
  console.log('⛔ Konnte den Speicher nicht lesen. Ist wrangler angemeldet?');
  console.log('   ' + String(e.message || e).split('\n')[0]);
  process.exit(1);
}

const schluessel = liste.map(x => x.name).filter(n => n.startsWith('diagnose:'));
if (!schluessel.length){
  console.log('Noch keine Diagnose da.');
  console.log('In der App: Einstellungen → Diagnose → Anzeigen → „An Claude schicken".');
  process.exit(0);
}

for (const s of schluessel){
  if (args.length && !s.includes(args[0])) continue;
  let text = '';
  try {
    text = ruf(['kv', 'key', 'get', s, '--namespace-id', namespace, '--remote']);
  } catch (e){
    console.log('⛔ ' + s + ' — nicht lesbar: ' + String(e.message || e).split('\n')[0]);
    continue;
  }
  console.log('═'.repeat(70));
  console.log(s);
  console.log('═'.repeat(70));
  console.log(text.trim());
  console.log('');
}
