/* vorschlaege-holen.mjs -- welche Eselsbrücken hat Elias abgelehnt?
 *
 * Elias am 19.08.2026: "du musst dann irgendwie diese liste bekommen. da
 * müssen wir irgendwie ein system entwickeln wie wir das zum klappen bringen."
 *
 * Das System ist der Geräteabgleich, den es schon gibt: Er tippt in der App
 * auf „Taugt nicht", der Stand wandert in den Cloudflare-KV, und dieses
 * Werkzeug holt ihn von dort. Kein Kopieren, kein Verschicken.
 *
 * Aufruf:
 *   node werkzeuge/vorschlaege-holen.mjs            aus dem KV holen
 *   node werkzeuge/vorschlaege-holen.mjs <datei>    aus einer Datei lesen
 *
 * ⛔ ES WERDEN NUR DIE ABGELEHNTEN VORSCHLÄGE AUSGEGEBEN. Der abgelegte Stand
 * enthält auch seinen kompletten Lernfortschritt (155 KB). Der geht niemanden
 * etwas an und wird hier weder gedruckt noch weitergereicht — das Werkzeug
 * greift genau ein Feld heraus.
 *
 * ⚠️ EIN LEERES ERGEBNIS HEISST NICHT „NICHTS ABGELEHNT". Es kann auch heißen:
 * er hat seit dem Tippen nicht abgeglichen. Deshalb steht der Zeitpunkt des
 * letzten Abgleichs immer mit dabei — ohne den ist die Liste nicht deutbar.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NAMENSRAUM = '3bdaa890a2ef4cf382edf335da1067df';   /* STAND, aus wrangler.toml */
const KV_SCHLUESSEL = 'stand:abdurahman.tunk@gmail.com';

const datei = process.argv[2];
let roh;
if (datei) {
  roh = fs.readFileSync(datei, 'utf8');
  console.log('Gelesen aus: ' + datei);
} else {
  try {
    roh = execFileSync('npx.cmd', ['wrangler', 'kv', 'key', 'get', KV_SCHLUESSEL,
      '--namespace-id=' + NAMENSRAUM, '--remote', '--text'],
      { cwd: REPO, encoding: 'utf8', maxBuffer: 40 * 1024 * 1024, timeout: 120000 });
  } catch (e) {
    console.log('⛔ KV nicht erreichbar: ' + (e.message || e).split('\n')[0]);
    console.log('   Ersatzweg: den Stand von Hand holen und die Datei uebergeben —');
    console.log('   npx wrangler kv key get "' + KV_SCHLUESSEL + '" --namespace-id=' + NAMENSRAUM + ' --remote --text > stand.json');
    process.exit(1);
  }
}

let ablage;
try { ablage = JSON.parse(roh.trim()); }
catch (e) { console.log('⛔ Der abgelegte Stand ist kein JSON.'); process.exit(1); }

const wann = ablage.geaendert ? new Date(ablage.geaendert) : null;
console.log('Letzter Abgleich: ' + (wann ? wann.toLocaleString('de-DE') : 'unbekannt'));

const feld = (ablage.daten && ablage.daten['vt_vorschlagWeg']) || null;
let verworfen = {};
if (feld) {
  try { verworfen = (typeof feld === 'string') ? JSON.parse(feld) : feld; }
  catch (e) { verworfen = {}; }
}
const woerter = Object.keys(verworfen || {});
if (!woerter.length) {
  console.log('\nKeine abgelehnten Vorschlaege im abgeglichenen Stand.');
  console.log('⚠️ Das heisst NICHT zwingend "nichts abgelehnt" — es kann auch heissen,');
  console.log('   dass seit dem Tippen kein Abgleich gelaufen ist. Der Zeitpunkt oben sagt es.');
  process.exit(0);
}

/* Wort und Vorschlagsliste dazuholen. ⛔ vorschlagsListe() wird NICHT
   nachgebaut, sondern woertlich aus js/lernen.js uebernommen — eine
   nachempfundene Fassung zaehlte anders und meldete die falsche Nummer. */
const lies = f => fs.readFileSync(path.join(REPO, f), 'utf8');
const src = lies('js/lernen.js');
const von = src.indexOf('function vorschlagsListe(w){');
const bis = src.indexOf('\n}', von) + 2;
if (von < 0) { console.log('⛔ vorschlagsListe() in js/lernen.js nicht gefunden'); process.exit(1); }

const umgebung = new Function('ESELSBRUECKEN_ALT',
  src.slice(von, bis) + '; return vorschlagsListe;');
const alt = new Function(lies('data/eselsbruecken-alt.js') + '; return ESELSBRUECKEN_ALT;')();
const vorschlagsListe = umgebung(alt);
const VOCAB = new Function(lies('vocab-data.js') + '; return VOCAB_DATA;')();
const nachId = Object.fromEntries(VOCAB.map(w => [String(w.id), w]));

console.log('\n=== ' + woerter.length + ' Wort/Woerter mit abgelehnten Vorschlaegen ===\n');
let offenGesamt = 0, ohneErsatz = 0;
for (const id of woerter) {
  const w = nachId[id];
  const liste = w ? vorschlagsListe(w) : [];
  const eintraege = verworfen[id] || {};
  const nrs = Object.keys(eintraege).map(Number).sort((a, b) => a - b);
  const uebrig = liste.length - nrs.length;
  offenGesamt += nrs.length;
  if (uebrig <= 0) ohneErsatz++;

  console.log((w ? w.ar + '  ' + (w.de || '') : '(Wort ' + id + ' nicht gefunden)')
    + '   [' + id + ']');
  console.log('   Vorschlaege gesamt: ' + liste.length
    + ' · abgelehnt: ' + nrs.length
    + ' · uebrig: ' + uebrig + (uebrig <= 0 ? '   ⛔ KEIN ERSATZ MEHR' : ''));
  for (const nr of nrs) {
    const e = eintraege[String(nr)] || {};
    const jetzt = liste[nr];
    const gleich = jetzt != null && String(jetzt).trim() === String(e.text || '').trim();
    console.log('   ✗ Nr. ' + (nr + 1) + (e.zeit ? '  (' + new Date(e.zeit).toLocaleDateString('de-DE') + ')' : ''));
    console.log('     ' + String(e.text || '(kein Text gespeichert)').replace(/\s+/g, ' ').slice(0, 160));
    /* ⚠️ Steht an der Nummer heute etwas anderes, hat sich die Liste seit der
       Ablehnung geaendert. Dann gilt der gespeicherte TEXT, nicht die Nummer. */
    if (!gleich) console.log('     ⚠️ An Nr. ' + (nr + 1) + ' steht heute etwas anderes — die Liste hat sich geaendert.');
  }
  console.log('');
}
console.log('Zusammen: ' + offenGesamt + ' abgelehnte Vorschlaege in ' + woerter.length + ' Woertern.');
if (ohneErsatz) console.log('⛔ Bei ' + ohneErsatz + ' Wort/Woertern ist KEIN Vorschlag mehr uebrig — dort muss einer neu geschrieben werden.');
