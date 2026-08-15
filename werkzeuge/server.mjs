/* Kleiner Testserver fuer die lokale Ansicht.
 *
 * WARUM ES IHN GIBT: Die veroeffentlichte App liegt hinter Cloudflare Access.
 * Im Browser-Pane ist man dort nicht angemeldet, und im angemeldeten Chrome
 * laesst sich die Fenstergroesse nicht steuern (gemessen am 15.08.2026:
 * resize_window meldete Erfolg, `innerWidth` blieb auf 1920). Fuer Arbeit an
 * den Breakpoints braucht es aber genau das - eine Adresse, die man oeffnen
 * UND in der Breite verstellen kann.
 *
 * Aufruf:  node werkzeuge/server.mjs [port]
 *
 * ⚠️ Nur zum Ansehen. Der Abgleich ueber Cloudflare KV funktioniert hier
 * nicht (kein Access-Login) - sync.js meldet das sichtbar als "nicht
 * angemeldet", das ist richtig so und kein Fehler.
 *
 * ⚠️ Bewusst eine EIGENE Datei, obwohl der Korantrainer einen fast gleichen
 * Server hat: die beiden Projekte werden nicht verlinkt, sondern kopiert.
 * Zwei Projekte, die auf dieselbe Datei zeigen, sind der schnellste Weg
 * zurueck zur Vermischung.
 */
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/* ⚠️ fileURLToPath, NICHT die URL von Hand zerlegen: der Ordner heisst
   "1. Workspace" mit Leerzeichen und steht in import.meta.url als %20. */
const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.argv[2]) || 8124;

const TYPEN = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.mjs':  'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.webp': 'image/webp',
  '.woff2':'font/woff2',
  '.mp3':  'audio/mpeg',
  '.m4a':  'audio/mp4',
};

http.createServer(async (anfrage, antwort) => {
  try {
    const pfad = decodeURIComponent(new URL(anfrage.url, 'http://x').pathname);
    let ziel = path.join(WURZEL, pfad === '/' ? 'index.html' : pfad);

    /* Ausbruch aus dem Projektordner verhindern (../../..) */
    if (!ziel.startsWith(WURZEL)) {
      antwort.writeHead(403).end('Ausserhalb des Projekts');
      return;
    }

    const s = await stat(ziel).catch(() => null);
    if (s && s.isDirectory()) ziel = path.join(ziel, 'index.html');

    const inhalt = await readFile(ziel);
    antwort.writeHead(200, {
      'content-type': TYPEN[path.extname(ziel).toLowerCase()] || 'application/octet-stream',
      /* Kein Zwischenspeicher: sonst misst man beim naechsten Lauf die alte
         Fassung und haelt sie fuer die neue. Genau das ist am 15.08. im
         echten Browser passiert - eine tagealte Kopie sah aus wie der Stand. */
      'cache-control': 'no-store',
    });
    antwort.end(inhalt);
  } catch (e) {
    antwort.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    antwort.end('Nicht gefunden: ' + anfrage.url);
  }
}).listen(PORT, () => {
  console.log(`Vokabeltrainer laeuft auf http://localhost:${PORT}`);
  console.log(`Ordner: ${WURZEL}`);
});
