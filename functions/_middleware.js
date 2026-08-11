/* Host-Sperre für Cloudflare Pages.
 *
 * ⚠️ WARUM DAS HIER STEHT
 *
 * Ein Pages-Projekt ist IMMER auch unter seiner pages.dev-Adresse erreichbar,
 * zusaetzlich zur eigenen Domain - und jede einzelne Veroeffentlichung bekommt
 * obendrein eine eigene Vorschau-Adresse (z. B. 3d596f83.vokabeltrainer-cgv.
 * pages.dev). Alle liefern denselben Inhalt aus.
 *
 * Sobald Elias' arabicroots-Abzug mit ausgeliefert wird, waeren diese Adressen
 * ein offenes Scheunentor: die Daten duerfen nach den AGB (Ziffer 9) nicht
 * veroeffentlicht werden. Cloudflares eigene Oberfläche sagt dazu ausdruecklich
 * "This protects preview deployment URLs only. Production pages.dev and custom
 * domains are managed separately in Zero Trust." - der eingebaute Schutz deckt
 * also NICHT alles ab.
 *
 * Statt jede dieser Adressen einzeln zu bewachen, nimmt diese Funktion sie aus
 * dem Verkehr: Wer nicht ueber die erlaubte Domain kommt, bekommt 404 und
 * keinerlei Inhalt. Das ist kein Ersatz fuer den Access-Login (der regelt, WER
 * darf) - es ist die Ebene darunter (ueber WELCHE Adresse ueberhaupt).
 *
 * Zwei Schutzschichten also, mit verschiedenen Ausfallarten:
 *   1. diese Sperre  - wirkt auch, wenn eine Access-Regel falsch gesetzt ist
 *   2. Access-Login  - wirkt auch, wenn diese Datei einmal fehlt
 */

const ERLAUBTE_HOSTS = [
  'vokabeltrainer.elias-lueck.de',
];

export async function onRequest(context) {
  const host = new URL(context.request.url).hostname.toLowerCase();

  if (!ERLAUBTE_HOSTS.includes(host)) {
    /* Bewusst 404 und nicht 403: eine Weiterleitung oder ein "verboten" wuerde
       bestaetigen, dass hier etwas liegt. 404 sagt nichts aus. */
    return new Response('Not found', {
      status: 404,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        /* Suchmaschinen sollen die pages.dev-Adressen gar nicht erst aufnehmen */
        'x-robots-tag': 'noindex, nofollow',
      },
    });
  }

  return context.next();
}
