/* pruefe-hostsperre.mjs — sperrt functions/_middleware.js fremde Adressen wirklich aus?
 * =====================================================================================
 *
 * ⛔⛔ WORUM ES GEHT — und warum das die Zeile mit den höchsten Folgen ist
 *
 * Auf dieser Seite liegt Kursmaterial von arabicroots. Nach deren AGB (Ziffer
 * 3.7 und 9) darf es nicht weitergegeben werden; deshalb liegt es NICHT im
 * Repo, und deshalb gibt es vor der ausgelieferten Seite zwei Schranken:
 *
 *   1. `functions/_middleware.js` — wer nicht über die erlaubte Adresse kommt,
 *      bekommt **404**. Bewusst 404 und nicht 403: ein „verboten" würde
 *      bestätigen, dass dort etwas liegt.
 *   2. Cloudflare Access — die Anmeldung davor (Nachweis in
 *      `.access-geprueft.json`, geprüft von veroeffentlichen.mjs).
 *
 * `validate.js` prüft, dass die Datei PARST. Ob sie noch SPERRT, hat bis zum
 * 09.09.2026 niemand gemessen. Eine leere `ERLAUBTE_HOSTS`-Liste, ein `!` zu
 * viel oder ein `return context.next()` an der falschen Stelle — und die
 * pages.dev-Adresse liefert alles aus, ohne dass sich irgendetwas meldet.
 * [[ausfall_ist_unsichtbar_gebaut]] [[daten_ohne_zugang]]
 *
 * ⭐ Deshalb wird hier nicht nach Mustern gesucht, sondern die echte Funktion
 * AUSGEFÜHRT — mit einer erlaubten und mehreren fremden Adressen.
 * [[testvorlage_selbst_nachgebaut]]
 *
 * ⚠️ Was er NICHT beweist: dass die Sperre in der Cloud auch greift. Dort
 * entscheidet Cloudflare, ob `functions/` überhaupt ausgeliefert wurde — das
 * misst `veroeffentlichen.mjs` mit dem Access-Nachweis, und der ist die zweite
 * Schranke. Hier geht es nur um die erste.
 *
 * Aufruf:  node werkzeuge/pruefe-hostsperre.mjs
 * Exit 0 = die Sperre greift · 1 = Störtest greift nicht · 2 = sie greift NICHT
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATEI = path.join(REPO, 'functions', '_middleware.js');

console.log('--- Die Hostsperre vor der ausgelieferten Seite ---\n');

if (!fs.existsSync(DATEI)){
  console.log('⛔ functions/_middleware.js fehlt — dann sperrt NICHTS die fremden Adressen aus.');
  process.exit(2);
}
const quelle = fs.readFileSync(DATEI, 'utf8');
let mw;
try { mw = await import(pathToFileURL(DATEI).href); }
catch (e){
  console.log('⛔ functions/_middleware.js laesst sich nicht laden: ' + e.message);
  process.exit(2);
}
if (typeof mw.onRequest !== 'function'){
  console.log('⛔ `onRequest` wird nicht exportiert — Cloudflare ruft dann gar nichts auf.');
  process.exit(2);
}

/* Ein Kontext, wie Cloudflare ihn übergibt. `next()` ist die Durchreiche —
   wird sie gerufen, ist die Adresse als erlaubt durchgegangen. */
const DURCH = Symbol('durchgereicht');
const kontext = (url) => ({
  request: { url },
  next: async () => DURCH,
});
const antwort = async (url) => {
  const r = await mw.onRequest(kontext(url));
  if (r === DURCH) return 'durch';
  return (r && typeof r.status === 'number') ? String(r.status) : 'unbekannt';
};

let fehler = 0;
const pruefe = async (was, url, soll) => {
  const ist = await antwort(url);
  if (ist === soll) console.log('  ok   ' + was.padEnd(52) + ist);
  else { fehler++; console.log('  ⛔   ' + was.padEnd(52) + ist + '  (erwartet: ' + soll + ')'); }
};

/* Die erlaubte Adresse steht in der Datei — sie wird von DORT gelesen, nicht
   hier eingetippt. Eine Erwartung im eigenen Quelltext prueft sich selbst.
   [[pruefwerkzeug_mit_eingebauter_antwort]] */
const liste = (quelle.match(/const ERLAUBTE_HOSTS\s*=\s*\[([\s\S]*?)\]/) || [])[1] || '';
const hosts = [...liste.matchAll(/['"]([^'"]+)['"]/g)].map(m => m[1]);
console.log('  Erlaubt laut Datei: ' + (hosts.length ? hosts.join(', ') : '(KEINE)') + '\n');
if (!hosts.length){
  console.log('⛔ Die Liste ERLAUBTE_HOSTS ist leer oder nicht lesbar — dann kommt NIEMAND');
  console.log('   durch, oder (schlimmer) die Sperre wurde ausgebaut. Nachsehen.');
  process.exit(2);
}

for (const h of hosts) await pruefe('erlaubt: ' + h, 'https://' + h + '/index.html', 'durch');
/* Die Adressen, um die es wirklich geht. */
await pruefe('pages.dev (die Nebenadresse)', 'https://vokabeltrainer-cgv.pages.dev/index.html', '404');
await pruefe('eine Vorschau-Unteradresse',   'https://d08b5a5e.vokabeltrainer-cgv.pages.dev/', '404');
await pruefe('irgendein fremder Host',       'https://beispiel.invalid/index.html', '404');
await pruefe('und auch fuer die Daten',      'https://vokabeltrainer-cgv.pages.dev/data/vokabeln-madina-1.js', '404');
/* Grossschreibung darf die Sperre nicht aushebeln — Hostnamen sind egal
   geschrieben, der Vergleich in der Datei senkt deshalb ab. */
await pruefe('erlaubt, aber GROSS geschrieben', 'https://' + hosts[0].toUpperCase() + '/', 'durch');

/* ---------- ⛔ STOERTEST ---------- */
console.log('\n=== Stoertest ===');
{
  let s = 0;
  const sP = (was, ist, soll) => { if (ist !== soll){ s++; console.log('  ⛔  ' + was); }
    else console.log('  ok   ' + was); };
  /* ⛔ HIER STEHEN NUR AUSSAGEN UEBER DAS WERKZEUG, keine ueber die Sperre.
     Beim ersten Anlauf standen auch „die echte Fassung laesst nicht durch" und
     „404 statt 403" hier — mit der Folge, dass eine AUSGEBAUTE Sperre den
     Exitcode 1 („der Stoertest greift nicht") ergab statt 2 („die Sperre
     greift nicht"). Ein kaputtes Schloss meldete sich als kaputter
     Schluesselpruefer. Die beiden Aussagen stehen jetzt oben bei den Faellen,
     wo sie hingehoeren. [[kennzeichen_mit_zwei_ursachen]]

     Was hier bleibt: kann diese Messung UEBERHAUPT einen Durchlaeufer von
     einer Sperre unterscheiden? */
  const offen = new Function('return { onRequest: async (c) => c.next() };')();
  const zu = new Function('return { onRequest: async () => new Response("x", { status: 404 }) };')();
  const alsDurch = async (m) => {
    const r = await m.onRequest(kontext('https://beispiel.invalid/'));
    return r === DURCH ? 'durch' : (r && typeof r.status === 'number' ? String(r.status) : '?');
  };
  sP('eine Fassung ohne Sperre wird als „durch" erkannt', await alsDurch(offen), 'durch');
  sP('eine Fassung mit Sperre als „404"',                 await alsDurch(zu), '404');
  sP('die Hostliste wurde wirklich aus der Datei gelesen', hosts.length > 0, true);
  if (s){ console.log('\n⛔ Der Stoertest greift nicht — diese Messung unterscheidet nichts.'); process.exit(1); }
}

console.log('');
if (fehler){
  console.log('⛔ ' + fehler + ' Fall/Faelle: die Hostsperre greift nicht wie gedacht.');
  console.log('   Bis das geklaert ist, NICHT mit --mit-daten ausliefern.');
  process.exit(2);
}
console.log('✅ Die Hostsperre greift: ' + hosts.length + ' erlaubte Adresse(n) kommen durch,');
console.log('   jede andere bekommt 404 — auch die pages.dev-Adressen und die Daten.');
