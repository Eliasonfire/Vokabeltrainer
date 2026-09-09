/* pruefe-stand-api.mjs — trennt /api/stand die Lernstände wirklich je Nutzer?
 * ===========================================================================
 *
 * ⛔⛔ WORUM ES GEHT
 *
 * `functions/api/stand.js` ist die Ablage für Elias' GANZEN Lernstand: Leitner-
 * Boxen, bekannte Wörter, eigene Vokabeln, Notizen. Alles, was er in Monaten
 * aufgebaut hat, geht über GET und PUT durch diese eine Datei.
 *
 * Drei Dinge müssen dort stimmen, und keines davon hat bis zum 09.09.2026
 * jemals ein Werkzeug gemessen (`validate.js` prüft nur, dass die Datei
 * PARST; `pruefe-kreislaeufe` nennt sie, misst sie aber nicht):
 *
 *   1. OHNE KENNUNG NICHTS. Fehlt die Access-Kennung, muss 401 kommen — nicht
 *      ein Sammelschlüssel, unter dem alle landen. Der Kopfkommentar der Datei
 *      sagt das ausdrücklich: „Ein gemeinsamer Sammelschluessel waere bequem
 *      und genau der Fehler, der spaeter fremde Lernstaende vermischt."
 *   2. JE NUTZER EIN SCHLÜSSEL. Zwei Adressen dürfen sich nie überschreiben —
 *      spätestens seit für die Koran-App weitere Adressen freigeschaltet
 *      werden können. [[eingefrorenes_feld_ist_kein_zustand]]
 *   3. KEIN MÜLL IN DEN SPEICHER. Ungültiges JSON und übergroße Körper müssen
 *      abgelehnt werden, BEVOR geschrieben wird — ein kaputter Wert im KV wäre
 *      der Lernstand, den er beim nächsten Abgleich zurückbekommt.
 *
 * ⭐ Gemessen wird nicht am Muster, sondern an der echten Funktion: sie wird
 * importiert und mit gefälschten Anfragen und einem gefälschten KV gerufen.
 * [[testvorlage_selbst_nachgebaut]]
 *
 * ⚠️ Was er NICHT beweist: dass Cloudflare Access davor wirklich steht. Das
 * ist die andere Schranke, und ihr Nachweis liegt in `.access-geprueft.json`
 * (geprüft von veroeffentlichen.mjs). Hier geht es um das Verhalten DAHINTER.
 *
 * Aufruf:  node werkzeuge/pruefe-stand-api.mjs
 * Exit 0 = die Trennung hält · 1 = Störtest greift nicht · 2 = sie hält NICHT
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATEI = path.join(REPO, 'functions', 'api', 'stand.js');

console.log('--- /api/stand: Trennung, Abweisung, Ablage ---\n');

if (!fs.existsSync(DATEI)){
  console.log('⛔ functions/api/stand.js fehlt — dann gibt es keinen Geraeteabgleich.');
  process.exit(2);
}
let api;
try { api = await import(pathToFileURL(DATEI).href); }
catch (e){ console.log('⛔ stand.js laesst sich nicht laden: ' + e.message); process.exit(2); }
if (typeof api.onRequest !== 'function'){
  console.log('⛔ `onRequest` wird nicht exportiert — Cloudflare ruft dann nichts auf.');
  process.exit(2);
}

/* Ein KV, das sich merkt, was es bekommt — damit man SEHEN kann, unter
   welchem Schluessel abgelegt wurde. */
const macheKV = () => {
  const inhalt = new Map();
  return {
    inhalt,
    get: async (k) => (inhalt.has(k) ? inhalt.get(k) : null),
    put: async (k, v) => { inhalt.set(k, v); },
  };
};
const anfrage = (methode, kennung, koerper) => ({
  method: methode,
  headers: { get: (n) => (n.toLowerCase() === 'cf-access-authenticated-user-email' ? kennung : null) },
  text: async () => (koerper == null ? '' : koerper),
});
const ruf = async (methode, kennung, koerper, kv) => {
  const speicher = kv || macheKV();
  const r = await api.onRequest({ request: anfrage(methode, kennung, koerper), env: { STAND: speicher } });
  const txt = r && typeof r.text === 'function' ? await r.text() : '';
  return { status: r ? r.status : null, text: txt, kv: speicher };
};

let fehler = 0;
const pruefe = (was, ist, soll) => {
  if (String(ist) === String(soll)) console.log('  ok   ' + was.padEnd(56) + ist);
  else { fehler++; console.log('  ⛔   ' + was.padEnd(56) + ist + '  (erwartet: ' + soll + ')'); }
};

/* ---------- 1. Ohne Kennung nichts ---------- */
pruefe('GET ohne Kennung', (await ruf('GET', null)).status, 401);
pruefe('PUT ohne Kennung', (await ruf('PUT', null, '{"a":1}')).status, 401);
{
  const r = await ruf('PUT', null, '{"a":1}');
  pruefe('… und es wurde NICHTS abgelegt', r.kv.inhalt.size, 0);
}

/* ---------- 2. Je Nutzer ein Schluessel ---------- */
{
  const kv = macheKV();
  await ruf('PUT', 'elias@example.test', '{"wer":"elias"}', kv);
  await ruf('PUT', 'zweite@example.test', '{"wer":"zweite"}', kv);
  pruefe('zwei Adressen ergeben zwei Schluessel', kv.inhalt.size, 2);
  const a = await ruf('GET', 'elias@example.test', null, kv);
  const b = await ruf('GET', 'zweite@example.test', null, kv);
  pruefe('jeder bekommt SEINEN Stand zurueck (1)', a.text, '{"wer":"elias"}');
  pruefe('jeder bekommt SEINEN Stand zurueck (2)', b.text, '{"wer":"zweite"}');
  /* Grossschreibung darf keinen zweiten Stand anlegen. */
  await ruf('PUT', 'ELIAS@example.test', '{"wer":"gross"}', kv);
  pruefe('dieselbe Adresse GROSS geschrieben legt keinen dritten an', kv.inhalt.size, 2);
  pruefe('… sondern ueberschreibt denselben',
    (await ruf('GET', 'elias@example.test', null, kv)).text, '{"wer":"gross"}');
}

/* ---------- 3. Kein Muell in den Speicher ---------- */
{
  const kv = macheKV();
  pruefe('PUT mit kaputtem JSON', (await ruf('PUT', 'x@y.test', '{kaputt', kv)).status, 400);
  pruefe('… und nichts abgelegt', kv.inhalt.size, 0);
  const zuGross = '"' + 'x'.repeat(3 * 1024 * 1024) + '"';
  pruefe('PUT mit 3 MB', (await ruf('PUT', 'x@y.test', zuGross, kv)).status, 413);
  pruefe('… und immer noch nichts abgelegt', kv.inhalt.size, 0);
  pruefe('DELETE wird abgewiesen', (await ruf('DELETE', 'x@y.test', null, kv)).status, 405);
}

/* ---------- 4. Der erste Abruf ---------- */
pruefe('GET ohne abgelegten Stand liefert ein leeres Objekt',
  (await ruf('GET', 'neu@example.test')).text, '{}');

/* ---------- 5. Ohne KV-Bindung ehrlich scheitern ---------- */
{
  const r = await api.onRequest({ request: anfrage('GET', 'x@y.test'), env: {} });
  pruefe('ohne gebundenen KV kommt 500, nicht stilles Nichts', r.status, 500);
}

/* ---------- ⛔ STOERTEST ---------- */
console.log('\n=== Stoertest ===');
{
  let s = 0;
  const sP = (was, ist, soll) => { if (String(ist) !== String(soll)){ s++; console.log('  ⛔  ' + was); }
    else console.log('  ok   ' + was); };
  /* Kann diese Messung ueberhaupt zwei Schluessel von einem unterscheiden? */
  const kv = macheKV();
  await kv.put('a', '1'); await kv.put('b', '2');
  sP('das Test-KV zaehlt zwei Schluessel als zwei', kv.inhalt.size, 2);
  await kv.put('a', '3');
  sP('… und ein Ueberschreiben nicht als dritten', kv.inhalt.size, 2);
  sP('das Test-KV gibt zurueck, was es bekam', await kv.get('a'), '3');
  /* Und die Kopfzeile muss ueberhaupt ankommen — sonst waere jede Anfrage
     kennungslos und „401" hiesse gar nichts. */
  sP('die gefaelschte Anfrage traegt ihre Kennung',
    anfrage('GET', 'da@example.test').headers.get('cf-access-authenticated-user-email'), 'da@example.test');
  sP('… und ohne Kennung ist sie leer',
    String(anfrage('GET', null).headers.get('cf-access-authenticated-user-email')), 'null');
  if (s){ console.log('\n⛔ Der Stoertest greift nicht — diese Messung unterscheidet nichts.'); process.exit(1); }
}

console.log('');
if (fehler){
  console.log('⛔ ' + fehler + ' Fall/Faelle: /api/stand verhaelt sich nicht wie gedacht.');
  console.log('   Hier haengt Elias\' ganzer Lernstand dran — erst klaeren, dann ausliefern.');
  process.exit(2);
}
console.log('✅ /api/stand trennt je Adresse, weist ohne Kennung ab und laesst');
console.log('   weder kaputtes JSON noch uebergrosse Koerper in den Speicher.');
