/* Lernstand-Ablage fuer den Abgleich zwischen Geraeten.
 *
 * GET  /api/stand   liefert den zuletzt abgelegten Stand (oder {} beim ersten Mal)
 * PUT  /api/stand   legt einen Stand ab
 *
 * ⚠️ WER DARF WAS
 *
 * Diese Funktion liegt hinter Cloudflare Access - ohne gueltige Anmeldung kommt
 * die Anfrage hier gar nicht an. Trotzdem wird die Kennung NICHT vorausgesetzt,
 * sondern gelesen: der Schluessel im Speicher haengt an der E-Mail-Adresse aus
 * dem Access-Token. Zwei Nutzer koennen sich so nie gegenseitig ueberschreiben,
 * auch wenn spaeter weitere Adressen freigeschaltet werden (Elias' Mutter und
 * Schwester fuer die Koran-App).
 *
 * Fehlt die Kennung, wird abgelehnt statt geraten. Ein gemeinsamer Sammel-
 * schluessel waere bequem und genau der Fehler, der spaeter fremde Lernstaende
 * vermischt.
 */

/* Die E-Mail aus dem Access-Token holen.
   Access legt sie in zwei Formen bei; die Kopfzeile ist die einfachere, das
   Token die verlaesslichere. Geprueft wird die Signatur hier NICHT - das
   uebernimmt Access selbst, bevor die Anfrage diese Funktion erreicht. Wer
   ohne gueltiges Token kommt, wird vorher weggeschickt. */
function nutzerKennung(request){
  const kopf = request.headers.get('cf-access-authenticated-user-email');
  if (kopf) return kopf.toLowerCase();

  const jwt = request.headers.get('cf-access-jwt-assertion');
  if (!jwt) return null;
  try {
    const teil = jwt.split('.')[1];
    if (!teil) return null;
    /* base64url -> base64, dann entschluesseln */
    const b64 = teil.replace(/-/g, '+').replace(/_/g, '/');
    const roh = atob(b64 + '='.repeat((4 - b64.length % 4) % 4));
    const daten = JSON.parse(decodeURIComponent(escape(roh)));
    return daten.email ? String(daten.email).toLowerCase() : null;
  } catch (e) {
    return null;
  }
}

/* KV im Gratistarif: 1.000 Schreibvorgaenge am Tag, 25 MiB je Wert.
   Der Lernstand ist wenige Kilobyte gross - diese Grenze ist eine Notbremse
   gegen einen Fehler auf der Gegenseite, keine erwartete Groesse. */
const GRENZE = 2 * 1024 * 1024;

export async function onRequest(context){
  const { request, env } = context;

  const kennung = nutzerKennung(request);
  if (!kennung){
    return antwort({ fehler: 'keine Kennung im Access-Token' }, 401);
  }
  if (!env.STAND){
    return antwort({ fehler: 'KV-Speicher nicht gebunden' }, 500);
  }
  const schluessel = 'stand:' + kennung;

  if (request.method === 'GET'){
    const wert = await env.STAND.get(schluessel);
    return new Response(wert || '{}', {
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8',
                 'cache-control': 'no-store' }
    });
  }

  if (request.method === 'PUT'){
    const text = await request.text();
    if (text.length > GRENZE) return antwort({ fehler: 'zu gross' }, 413);
    try { JSON.parse(text); }
    catch (e){ return antwort({ fehler: 'kein gueltiges JSON' }, 400); }
    await env.STAND.put(schluessel, text);
    return antwort({ ok: true, gespeichert: text.length });
  }

  return antwort({ fehler: 'Methode nicht erlaubt' }, 405);
}

function antwort(objekt, status){
  return new Response(JSON.stringify(objekt), {
    status: status || 200,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}
