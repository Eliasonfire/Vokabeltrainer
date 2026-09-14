/* Diagnose-Ablage — der Knopf „An Claude schicken" (15.09.2026).
 *
 * PUT  /api/diagnose   legt den Diagnosetext ab
 * GET  /api/diagnose   liefert ihn zurueck (fuer die App selbst, zur Kontrolle)
 *
 * ⭐ WOZU. Elias am 15.09.2026 um 00:1x, nachdem er mir die Diagnose zweimal
 * als Bildschirmfoto geschickt hatte — beide Male abgeschnitten:
 *     „es sollte bei dieser diagnose auch einen knopf geben wo ich dir die
 *      ganze diagnose einfach per knopf zuschicken kann in der app"
 * und auf den Vorschlag „in die Zwischenablage" ausdruecklich:
 *     „ja aber der soll direkt zu dir gehen das ich einfach nur sagen muss
 *      hab die diagnose geschickt"
 *
 * ⛔ DIE APP KANN NICHTS VERSCHICKEN. Sie ist eine PWA ohne Backend, und ein
 * Zugangsschluessel fuer einen Messenger haette im Browser gelegen — also
 * offen. Der Weg hier nutzt, was ohnehin da ist: denselben KV-Speicher, in
 * dem der Lernstand liegt (functions/api/stand.js). Die App legt den Text ab,
 * Claude liest ihn mit `node werkzeuge/diagnose-holen.mjs`.
 *
 * ⚠️ EIGENE FUNKTION, NICHT /api/stand ERWEITERT. Zwei Gruende: stand.js
 * verlangt gueltiges JSON (die Diagnose ist Fliesstext), und der Lernstand ist
 * das Wertvollste in dieser App — eine Diagnose, die versehentlich unter
 * `stand:` landet, waere ein ueberschriebener Lernstand.
 * [[leere_datei_besteht_jeden_test]]
 *
 * ⚠️ WER DARF WAS: wie bei stand.js haengt der Schluessel an der E-Mail aus
 * dem Access-Token. Fehlt sie, wird abgelehnt statt geraten.
 */

function nutzerKennung(request){
  const kopf = request.headers.get('cf-access-authenticated-user-email');
  if (kopf) return kopf.toLowerCase();

  const jwt = request.headers.get('cf-access-jwt-assertion');
  if (!jwt) return null;
  try {
    const teil = jwt.split('.')[1];
    if (!teil) return null;
    const b64 = teil.replace(/-/g, '+').replace(/_/g, '/');
    const roh = atob(b64 + '='.repeat((4 - b64.length % 4) % 4));
    const daten = JSON.parse(decodeURIComponent(escape(roh)));
    return daten.email ? String(daten.email).toLowerCase() : null;
  } catch (e) {
    return null;
  }
}

function antwort(daten, status = 200){
  return new Response(JSON.stringify(daten), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8',
               'cache-control': 'no-store' }
  });
}

/* Eine Diagnose ist ein paar Kilobyte. Die Grenze ist eine Notbremse, keine
   erwartete Groesse — und sie liegt deutlich unter der des Lernstands, weil
   hier nichts Grosses hingehoert. */
const GRENZE = 256 * 1024;

export async function onRequest(context){
  const { request, env } = context;

  const kennung = nutzerKennung(request);
  if (!kennung) return antwort({ fehler: 'keine Kennung im Access-Token' }, 401);
  if (!env.STAND) return antwort({ fehler: 'KV-Speicher nicht gebunden' }, 500);

  const schluessel = 'diagnose:' + kennung;

  if (request.method === 'GET'){
    const wert = await env.STAND.get(schluessel);
    return new Response(wert || '', {
      status: 200,
      headers: { 'content-type': 'text/plain; charset=utf-8',
                 'cache-control': 'no-store' }
    });
  }

  if (request.method === 'PUT'){
    const text = await request.text();
    if (!text.trim()) return antwort({ fehler: 'leer' }, 400);
    if (text.length > GRENZE) return antwort({ fehler: 'zu gross' }, 413);
    /* ⭐ Zeitstempel davor, nicht in die App: hier steht die Uhr des Servers,
       und die laesst sich nicht aus Versehen falsch stellen. Ausserdem sieht
       Claude sofort, ob die Diagnose von eben ist oder von vorgestern. */
    const kopf = '# Diagnose vom ' + new Date().toISOString() + '\n'
               + '# ' + kennung + '\n\n';
    await env.STAND.put(schluessel, kopf + text);
    return antwort({ ok: true, gespeichert: text.length });
  }

  return antwort({ fehler: 'Methode nicht erlaubt' }, 405);
}
