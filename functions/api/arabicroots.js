/* Den Karteikarten-Fortschritt nach arabicroots zurueckschreiben.
 *
 * ⭐ ELIAS' AUFTRAG (07.09.2026), mit Bild der Klassenrangliste:
 *
 *   „jedes mal wenn ich am handy oder tablet lerne dann wäre es doch gut wenn
 *    diese daten von meinem vokabeltrainer rüber in arabicroots angezeigt wird
 *    damit der lehrer oder auch die anderen sehen können das ich noch weiter
 *    arbeite. weil der stand ist gleich geblieben seit dem ich meine
 *    vokabeltrainer app benutze."
 *
 * und nach dem Einwand, dass die Zahlen sonst nicht vergleichbar sind:
 *
 *   „ich will dann das es dahingeschrieben wird aber für die berechnung der
 *    quote soll nur die karteikarten übung zählen. auch wann ich das letzte mal
 *    geübt habe soll gezeigt werden. und meine versuche sollen sich laufend
 *    aktualisiern die prozentzahl soll weiter auf der bisherigen aufbauen"
 *
 * Daraus folgen die vier Regeln dieser Datei:
 *
 *   1. NUR die Karteikarten. `PROGRESS[id].correct/wrong` wird ausschliesslich
 *      in `answer()` (js/lernen.js) gesetzt — Satzmodus, Hoermodus und Tippen
 *      fassen es nicht an. Damit ist die Quote drueben mit der der anderen
 *      vergleichbar: Vokabelabfrage gegen Vokabelabfrage.
 *   2. Das letzte Uebungsdatum: `created_at` bekommt `p.ts`, den Zeitstempel
 *      des Wortes aus dem Vokabeltrainer.
 *   3. AUFBAUEN, nicht ersetzen: es werden nur die Versuche angelegt, die
 *      drueben noch fehlen.
 *   4. Laufend: js/sync.js ruft das hier nach jedem geglueckten Abgleich auf.
 *
 * ⛔⛔ WARUM DIE DIFFERENZ AN DER ZIELTABELLE GEMESSEN WIRD, nicht an einem
 * eigenen Merker: Ein Merker („zuletzt uebertragen: 412") lebt auf einem Geraet
 * und kennt das andere nicht. Elias uebt auf Handy UND Tablet — beim zweiten
 * Geraet stuende der Merker auf 0 und alles wuerde ein zweites Mal angelegt.
 * Gezaehlt wird deshalb, was unter der eigenen `device_id` bereits drueben
 * steht. Das ist dieselbe Frage, nur an der Stelle gestellt, an der die Antwort
 * wirklich liegt — und damit ist der Aufruf beliebig oft wiederholbar, ohne
 * dass eine Zahl waechst. [[zweiter_aufruf_ueberschreibt_still]]
 *
 * ⭐ DIE EIGENE `device_id` IST DIE EHRLICHKEIT DES GANZEN. Alles, was von hier
 * kommt, traegt sie. Damit bleibt fuer immer trennbar, was im Vokabeltrainer
 * geuebt wurde und was in arabicroots selbst — eine einzige Abfrage genuegt.
 * Ohne sie waere beides nach dem ersten Lauf ununterscheidbar vermischt.
 *
 * ⛔ OHNE EINGERICHTETE ZUGANGSDATEN PASSIERT NICHTS. Die vier Werte unten sind
 * Cloudflare-Secrets und koennen nur von Elias gesetzt werden; fehlen sie,
 * antwortet diese Funktion mit 501 und die App macht stillschweigend weiter.
 * Ein Fehler an dieser Stelle darf den Lernstand-Abgleich nie aufhalten.
 */

/* Dieselbe Kennungspruefung wie in stand.js — die Funktion liegt hinter
   Cloudflare Access, aber die Kennung wird gelesen und nicht vorausgesetzt. */
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
  } catch (e) { return null; }
}

/* Feste Kennung fuer alles, was aus dem Vokabeltrainer stammt. ⛔ NIE aendern —
   sie ist der Schluessel, an dem der bereits uebertragene Stand gezaehlt wird.
   Eine neue Kennung hiesse: alles noch einmal von vorn. */
const GERAET_VOKABELTRAINER = '5eba1c9e-0000-4000-8000-766f6b746e7231';

/* arabicroots kennt genau zwei Richtungen (gemessen am 07.09.2026 an 200
   Zeilen: `de_ar` und `ar_de`, mit Unterstrich). Die Karteikarte im
   Vokabeltrainer haelt die Richtung je Versuch NICHT fest — sie ergibt sich
   aus einer Einstellung und wird nicht mitgeschrieben. Deshalb steht hier ein
   fester Wert, und das ist eine ehrliche Luecke und keine Messung.
   [[kann_ist_nicht_ist]] */
const RICHTUNG = 'ar_de';

/* Cloudflare Pages Functions haben 128 MB und eine Zeitgrenze. Bei einem
   Rueckstand von Tausenden Versuchen wird portionsweise gearbeitet: der Rest
   kommt beim naechsten Abgleich. Eine Anfrage, die in die Zeitgrenze laeuft,
   liefert gar nichts — und hinterliesse einen halb geschriebenen Stand. */
const HOECHSTENS_JE_LAUF = 400;

function antwort(daten, status = 200){
  return new Response(JSON.stringify(daten), {
    status, headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

/* ---------- Anmeldung: Refresh-Token, nicht Passwort ----------

   ⛔⛔ Hier stand zuerst eine Anmeldung mit E-Mail und Passwort. Elias am
   07.09.2026: „ich melde mich normalerweise mit google ein." Damit gibt es gar
   kein Passwort — der Weg konnte nie funktionieren. Der arabicroots-MCP löst
   es genauso: `SUPABASE_REFRESH_TOKEN`, und in seiner .env steht der Hinweis
   dazu ausdrücklich als „Option B, falls du dich per Google/Apple anmeldest".
   [[kann_ist_nicht_ist]]

   ⛔⛔ UND EIN REFRESH-TOKEN IST EINMALIG. Supabase gibt bei jeder Erneuerung
   einen NEUEN aus und macht den alten ungültig. Stünde hier fest der Wert aus
   dem Secret, liefe der erste Aufruf und jeder weitere nicht mehr — und zwar
   ohne dass irgendwo etwas meldet, weil diese Funktion ihre Fehler
   absichtlich schluckt. Deshalb:

     1. Zuerst der zuletzt gespeicherte Token aus KV.
     2. Nur beim allerersten Mal (oder wenn der gespeicherte nicht mehr geht)
        der aus dem Secret.
     3. Der neu erhaltene wird SOFORT abgelegt, bevor irgendetwas anderes
        passiert — geht der Aufruf danach schief, ist die Kette trotzdem heil.

   ⚠️ Der Token gehört einer EIGENEN Sitzung. Wird derselbe benutzt, den auch
   Elias' Browser hält, macht die Rotation hier seine Anmeldung drüben kaputt
   und er fliegt aus arabicroots. Deshalb: nach dem Kopieren arabicroots.de
   einmal neu laden — dann hat sein Browser einen frischen und die beiden
   Ketten laufen getrennt weiter. */
const KV_REFRESH = 'arabicroots:refresh';

async function tokenHolen(env, refresh){
  const res = await fetch(`${env.AR_SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { apikey: env.AR_ANON_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ refresh_token: refresh }),
  });
  if (!res.ok) return null;
  const daten = await res.json();
  if (!daten.access_token) return null;
  return daten;
}

async function anmelden(env){
  const gespeichert = env.STAND ? await env.STAND.get(KV_REFRESH) : null;
  /* Der gespeicherte zuerst — und nur wenn er versagt, der aus dem Secret.
     Andersherum wäre der Secret-Token nach dem ersten Lauf tot und jeder
     weitere Aufruf begänne mit einem sicheren Fehlschlag. */
  let daten = gespeichert ? await tokenHolen(env, gespeichert) : null;
  let quelle = 'gespeichert';
  if (!daten && env.AR_REFRESH_TOKEN){
    daten = await tokenHolen(env, env.AR_REFRESH_TOKEN);
    quelle = 'Secret';
  }
  if (!daten)
    throw new Error('Anmeldung bei arabicroots fehlgeschlagen — Refresh-Token abgelaufen. '
      + 'Einen neuen aus dem Browser holen und AR_REFRESH_TOKEN neu setzen.');

  if (env.STAND && daten.refresh_token && daten.refresh_token !== gespeichert)
    await env.STAND.put(KV_REFRESH, daten.refresh_token);

  return { token: daten.access_token, userId: daten.user && daten.user.id, quelle };
}

async function rest(env, token, pfad, optionen = {}){
  const res = await fetch(`${env.AR_SUPABASE_URL}/rest/v1/${pfad}`, {
    ...optionen,
    headers: {
      apikey: env.AR_ANON_KEY,
      Authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      ...(optionen.headers || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${optionen.method || 'GET'} ${pfad}: ${res.status} ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

/* ⭐ Der Kern, bewusst als reine Funktion ohne Netz: was muss angelegt werden?
 *
 * @param fortschritt  { "45751": { correct, wrong, ts }, … } aus dem Vokabeltrainer
 * @param schonDa      { "45751": { richtig, falsch }, … }    bereits uebertragen
 * @param bekannt      Set der IDs, die es in arabicroots wirklich gibt
 * @returns Array der anzulegenden Zeilen (ohne user_id)
 */
export function offeneVersuche(fortschritt, schonDa, bekannt){
  const zeilen = [];
  for (const [id, p] of Object.entries(fortschritt || {})){
    /* ⛔ Nur Woerter, die es drueben gibt. Eigene Vokabeln des Vokabeltrainers
       und die Fachbegriffe aus dem Unterricht haben dort keinen Eintrag; eine
       Zeile mit unbekannter vocabulary_id waere ein Fremdschluesselfehler und
       wuerde den ganzen Block scheitern lassen. */
    if (!bekannt.has(String(id))) continue;
    const da = schonDa[String(id)] || { richtig: 0, falsch: 0 };
    const fehltR = Math.max(0, (Number(p && p.correct) || 0) - da.richtig);
    const fehltF = Math.max(0, (Number(p && p.wrong)   || 0) - da.falsch);
    if (!fehltR && !fehltF) continue;
    /* Alle nachgetragenen Versuche eines Wortes bekommen SEINEN Zeitstempel.
       ⚠️ Der Vokabeltrainer haelt nur den LETZTEN fest (`p.ts`), die einzelnen
       Zeitpunkte gibt es nicht. Damit stimmt „zuletzt geuebt" — Elias' dritter
       Punkt — und die Verteilung ueber die Zeit ist bewusst grob.
       [[daten_ohne_zugang]] */
    const wann = new Date(Number(p && p.ts) || Date.now()).toISOString();
    for (let i = 0; i < fehltR; i++)
      zeilen.push({ vocabulary_id: String(id), direction: RICHTUNG, correct: true,  created_at: wann });
    for (let i = 0; i < fehltF; i++)
      zeilen.push({ vocabulary_id: String(id), direction: RICHTUNG, correct: false, created_at: wann });
  }
  return zeilen;
}

export async function onRequest(context){
  const { request, env } = context;

  if (!nutzerKennung(request))
    return antwort({ fehler: 'keine Kennung im Access-Token' }, 401);

  /* ⭐ GET sagt, ob es überhaupt läuft — ohne etwas zu schreiben.
     ⛔ Ohne diesen Weg wäre der Ausfall unsichtbar gebaut: die Übertragung
     schluckt ihre Fehler absichtlich (sie darf den Lernstand nie aufhalten),
     und Elias sähe monatelang nichts drüben, ohne zu wissen warum. Ein
     stiller Dienst braucht eine Stelle, an der man ihn fragen kann.
     [[ausfall_ist_unsichtbar_gebaut]] */
  if (request.method === 'GET'){
    const fehlt = ['AR_SUPABASE_URL', 'AR_ANON_KEY', 'AR_REFRESH_TOKEN'].filter(k => !env[k]);
    if (fehlt.length) return antwort({ eingerichtet: false, fehlend: fehlt });
    try {
      const { token, userId, quelle } = await anmelden(env);
      const eigene = await rest(env, token,
        `attempts?device_id=eq.${GERAET_VOKABELTRAINER}&select=vocabulary_id&limit=20000`);
      return antwort({ eingerichtet: true, anmeldung: 'geht (' + quelle + ')',
        nutzerkennung: userId ? 'vorhanden' : 'fehlt',
        bereitsUebertragen: (eigene || []).length });
    } catch (e){
      return antwort({ eingerichtet: true, anmeldung: 'FEHLER',
        fehler: String(e && e.message || e) }, 502);
    }
  }

  if (request.method !== 'POST')
    return antwort({ fehler: 'nur GET oder POST' }, 405);

  const fehlend = ['AR_SUPABASE_URL', 'AR_ANON_KEY', 'AR_REFRESH_TOKEN']
    .filter(k => !env[k]);
  if (fehlend.length)
    return antwort({ eingerichtet: false, fehlend,
      hinweis: 'In Cloudflare Pages → Settings → Variables and Secrets setzen.' }, 501);

  let fortschritt;
  try {
    const koerper = await request.json();
    fortschritt = koerper && koerper.fortschritt;
  } catch (e) { return antwort({ fehler: 'ungueltiger Koerper' }, 400); }
  if (!fortschritt || typeof fortschritt !== 'object')
    return antwort({ fehler: 'fortschritt fehlt' }, 400);

  try {
    const { token, userId } = await anmelden(env);
    if (!userId) return antwort({ fehler: 'keine Nutzerkennung von arabicroots' }, 502);

    /* Was steht drueben schon unter unserer Kennung? Nur die eigenen Zeilen —
       was er in arabicroots selbst geuebt hat, wird nicht angefasst und nicht
       mitgezaehlt. */
    const eigene = await rest(env, token,
      `attempts?device_id=eq.${GERAET_VOKABELTRAINER}&select=vocabulary_id,correct&limit=20000`);
    const schonDa = {};
    for (const z of eigene || []){
      const k = String(z.vocabulary_id);
      if (!schonDa[k]) schonDa[k] = { richtig: 0, falsch: 0 };
      if (z.correct) schonDa[k].richtig++; else schonDa[k].falsch++;
    }

    /* Welche IDs gibt es drueben wirklich? Nur die numerischen abfragen —
       eigene Woerter des Vokabeltrainers haben dort ohnehin keinen Eintrag. */
    const ids = Object.keys(fortschritt).filter(k => /^\d+$/.test(k));
    const bekannt = new Set();
    for (let i = 0; i < ids.length; i += 300){
      const teil = ids.slice(i, i + 300);
      const rows = await rest(env, token,
        `vocabulary?id=in.(${teil.join(',')})&select=id`);
      for (const r of rows || []) bekannt.add(String(r.id));
    }

    const offen = offeneVersuche(fortschritt, schonDa, bekannt);
    const jetzt = offen.slice(0, HOECHSTENS_JE_LAUF)
      .map(z => ({ ...z, user_id: userId, device_id: GERAET_VOKABELTRAINER }));

    if (jetzt.length){
      /* In Bloecken zu 100: eine einzelne riesige Anfrage laeuft in die
         Zeitgrenze, und was dann fehlschlaegt, ist alles auf einmal. */
      for (let i = 0; i < jetzt.length; i += 100)
        await rest(env, token, 'attempts', {
          method: 'POST', body: JSON.stringify(jetzt.slice(i, i + 100)),
          headers: { Prefer: 'return=minimal' },
        });
    }

    return antwort({
      eingerichtet: true,
      geschrieben: jetzt.length,
      offenGeblieben: Math.max(0, offen.length - jetzt.length),
      woerterBekannt: bekannt.size,
      bereitsUebertragen: Object.keys(schonDa).length,
    });
  } catch (e) {
    /* ⚠️ Die Meldung darf keine Zugangsdaten enthalten — `rest()` kuerzt den
       Fremdtext auf 200 Zeichen, und angemeldet wird ohne Echo. */
    return antwort({ fehler: String(e && e.message || e) }, 502);
  }
}
