const CACHE_NAME = 'vokabeltrainer-v173';
const ASSETS = [
  './',
  './index.html',
  './js/kern.js',
  './js/vokabelpaket.js',
  './js/buecher.js',
  './js/irab.js',
  './js/darstellung.js',
  './js/feier.js',
  './js/navigation.js',
  './js/start.js',
  './js/lernen.js',
  './js/sprachausgabe.js',
  './js/kategorien.js',
  './js/saetze.js',
  './js/uebung.js',
  './js/quran.js',
  './js/hoeren.js',
  './js/wurzel.js',
  './js/statistik.js',
  './js/einstellungen.js',
  './js/sync.js',
  './js/init.js',
  './vocab-data.js',
  './data/buecher.js',
  './data/eselsbruecken.js',
  './data/eselsbruecken-alt.js',
  './data/fachbegriffe.js',
  './surah-data.js',
  './quran-seiten.js',
  './grammar-data.js',
  './wortfelder-data.js',
  './lehrbuch-saetze.js',
  './quran-frequency-data.js',
  './quran-text.js',
  './manifest.json',
  './icon.svg',
  './wortmarke.svg',
  './icon-maskable.svg'
];

/* Jede Datei einzeln ablegen statt per addAll: addAll ist alles-oder-nichts -
   scheitert eine einzige Anfrage, bleibt der Cache komplett leer und die App
   ist offline unbenutzbar. Einzeln abgelegt fehlt im schlechtesten Fall eine
   Datei, der Rest steht. Was nicht geklappt hat, holt der fetch-Handler beim
   naechsten Aufruf nach. */
self.addEventListener('install', (e)=>{
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache=>Promise.allSettled(ASSETS.map(a=>cache.add(a))))
      .then(ergebnisse=>{
        const fehler = ergebnisse.filter(r=>r.status==='rejected').length;
        if (fehler) console.warn(`[sw] ${fehler} von ${ASSETS.length} Dateien nicht vorab gecacht`);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e)=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))
  );
  self.clients.claim();
});

/* Netz zuerst, Cache als Rueckfallebene.
 *
 * Vorher lief hier "Cache zuerst, im Hintergrund erneuern". Das ist schnell,
 * liefert aber grundsaetzlich den Stand von gestern - eine Aenderung wird
 * fruehestens beim uebernaechsten Start sichtbar. Genau daran ist am 27. und
 * 28.07.2026 mehrfach eine Fehlersuche gescheitert: die Korrektur war im
 * Browser, wirkte aber nicht, weil der Service Worker die alte Datei
 * ausgeliefert hat. Auf dem Handy hat Elias denselben Effekt gehabt.
 *
 * `cache: 'reload'` umgeht zusaetzlich den HTTP-Cache des Browsers - ohne das
 * schiebt der noch eine zweite alte Ebene dazwischen, die der Service Worker
 * gar nicht sieht.
 *
 * Offline bleibt alles benutzbar: schlaegt die Netzanfrage fehl, kommt die
 * gecachte Fassung. Der Preis ist eine Netzanfrage je Datei beim Start - bei
 * dieser App ein paar hundert Kilobyte, das faellt nicht ins Gewicht. */
/* ---------- Anmeldeseite erkennen (seit dem Umzug hinter Cloudflare Access) ----------
 *
 * ⚠️ Der gefaehrliche Fall ist NICHT "offline". Offline schlaegt fetch fehl,
 * der catch-Zweig greift und der Cache liefert - das hat immer funktioniert.
 *
 * Gefaehrlich ist "online mit abgelaufener Sitzung": Access antwortet mit einer
 * Weiterleitung auf cloudflareaccess.com, fetch FOLGT ihr, und heraus kommt die
 * Anmeldeseite mit HTTP 200. Ohne diese Pruefung landete die unter index.html,
 * js/kern.js und jeder anderen Adresse im Cache - die App wuerde danach
 * Anmelde-HTML ausliefern, wo sie JavaScript erwartet, und zwar auch offline
 * und auch nach erfolgreicher Anmeldung. Der Cache waere dauerhaft vergiftet.
 *
 * Erkennungsmerkmal: die Antwort kommt von einer anderen Adresse als der
 * angefragten. */
function istAnmeldeAntwort(resp){
  if (!resp) return false;
  if (resp.redirected) return true;
  try { return new URL(resp.url).origin !== self.location.origin; }
  catch(err){ return false; }
}

self.addEventListener('fetch', (e)=>{
  if (e.request.method !== 'GET') return;
  /* ⚠️ /api/ NIE anfassen. Dort liegt der Geraeteabgleich (js/sync.js). Wuerde
     der Service Worker die Antwort cachen, bekaeme das Geraet beim naechsten
     Start den Stand von gestern statt den vom anderen Geraet - und wuerde ihn
     danach als "aktuell" wieder hochladen. Der Abgleich haette dann die Arbeit
     zerstoert, die er schuetzen soll. */
  if (new URL(e.request.url).pathname.startsWith('/api/')) return;
  e.respondWith(
    fetch(new Request(e.request, { cache: 'reload' })).then(resp=>{
      if (istAnmeldeAntwort(resp)){
        /* Bei einem Seitenaufruf muss die Anmeldeseite durch - sonst koennte
           Elias sich nie wieder anmelden. Bei allem anderen (Skripte, Daten)
           lieber die gecachte Fassung als HTML an einer JS-Adresse. */
        if (e.request.mode === 'navigate') return resp;
        return caches.match(e.request).then(cached=> cached || resp);
      }
      if (resp && resp.status===200 && resp.type !== 'opaque'){
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(cache=>cache.put(e.request, clone));
      }
      return resp;
    }).catch(()=> caches.match(e.request).then(cached=>{
      if (cached) return cached;
      /* Bei einem Seitenaufruf ohne Netz und ohne Treffer wenigstens die
         Startseite zeigen statt des Browser-Fehlers. */
      return e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error();
    }))
  );
});
