const CACHE_NAME = 'vokabeltrainer-v22';
const ASSETS = [
  './',
  './index.html',
  './js/kern.js',
  './js/darstellung.js',
  './js/navigation.js',
  './js/start.js',
  './js/lernen.js',
  './js/sprachausgabe.js',
  './js/kategorien.js',
  './js/saetze.js',
  './js/quran.js',
  './js/statistik.js',
  './js/einstellungen.js',
  './js/init.js',
  './vocab-data.js',
  './surah-data.js',
  './grammar-data.js',
  './quran-frequency-data.js',
  './quran-text.js',
  './manifest.json',
  './icon.svg',
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

self.addEventListener('fetch', (e)=>{
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached=>{
      const fetchPromise = fetch(e.request).then(resp=>{
        if (resp && resp.status===200){
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache=>cache.put(e.request, clone));
        }
        return resp;
      }).catch(()=>cached);
      return cached || fetchPromise;
    })
  );
});
