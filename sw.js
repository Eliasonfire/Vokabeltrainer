const CACHE_NAME = 'vokabeltrainer-v114';
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
  './js/statistik.js',
  './js/einstellungen.js',
  './js/init.js',
  './vocab-data.js',
  './data/buecher.js',
  './surah-data.js',
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
self.addEventListener('fetch', (e)=>{
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(new Request(e.request, { cache: 'reload' })).then(resp=>{
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
