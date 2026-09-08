/* Stoertest fuer die neue ###-Pruefung und ihre „Davor:"-Ausnahme.
 * Zweiseitig: der echte Fall MUSS gemeldet werden, der archivierte NICHT.
 * [[stoertest_muss_wirkung_nachweisen]] */
import fs from 'node:fs';

const quelle = fs.readFileSync('werkzeuge/pruefe-datumsangaben.mjs', 'utf8');
let fehler = 0;

for (const n of ['let unterArchiv = 0;',
                 'const archivMarke = /^###\\s*(?:[^\\p{L}\\d]*\\s*)?Davor\\s*:/u.test(z);',
                 'if (a.block !== b.block) continue;',
                 '|| unterRueckwaerts.length ? 1 : 0);']){
  if (quelle.includes(n)) console.log('  ok  Stelle da: ' + n.slice(0, 46) + '…');
  else { fehler++; console.log('  X   FEHLT: ' + n); }
}

/* Die Logik woertlich nachvollziehen — dieselben Zeilen wie im Pruefer. */
const werte = (zeilen) => {
  const unter = []; let unterArchiv = 0;
  let tiefe = 0, imArchiv = false, blockStart = 0;
  zeilen.forEach((z, i) => {
    const auf = (z.match(/<details/g) || []).length;
    const zu  = (z.match(/<\/details>/g) || []).length;
    imArchiv = tiefe > 0;
    if (z.startsWith('## ')) blockStart = i;
    else if (z.startsWith('### ') && !imArchiv){
      const u = z.match(/(?:^|[\s,~(])(\d{2}:\d{2})(?=\s|[-–—,)]|$)/);
      const archivMarke = /^###\s*(?:[^\p{L}\d]*\s*)?Davor\s*:/u.test(z);
      if (u && archivMarke) unterArchiv++;
      else if (u) unter.push({ block: blockStart, zeit: u[1] });
    }
    tiefe = Math.max(0, tiefe + auf - zu);
  });
  const min = (t) => { const [h, m] = t.split(':'); return +h * 60 + +m; };
  let r = 0;
  for (let i = 1; i < unter.length; i++)
    if (unter[i].block === unter[i-1].block && min(unter[i].zeit) - min(unter[i-1].zeit) < 0) r++;
  return { rueckwaerts: r, archiv: unterArchiv, gezaehlt: unter.length };
};

const pruefe = (name, zeilen, sollR, sollArchiv) => {
  const e = werte(zeilen);
  const ok = e.rueckwaerts === sollR && e.archiv === sollArchiv;
  console.log((ok ? '  ok  ' : '  X   ') + name + ' → rueckwaerts ' + e.rueckwaerts
    + ', archiviert ' + e.archiv + '  (erwartet ' + sollR + ' / ' + sollArchiv + ')');
  if (!ok) fehler++;
};

pruefe('echter Rueckwaertsfall im offenen Text',
  ['## 08.09.2026', '### 02:40 — B', '### 02:34 — A'], 1, 0);
pruefe('richtige Reihenfolge',
  ['## 08.09.2026', '### 02:34 — A', '### 02:40 — B'], 0, 0);
pruefe('„Davor:"-Reihe wird ausgenommen',
  ['## 10.08.2026', '### Davor: Stand 06:44 — X', '### Davor: Stand 05:56 — Y'], 0, 2);
pruefe('„Davor:" mit Emoji davor',
  ['## 10.08.2026', '### 🌙 Davor: Stand 06:44 — X', '### Davor: Stand 05:56 — Y'], 0, 2);
pruefe('ueber zwei ## -Bloecke hinweg wird NICHT verglichen',
  ['## Tag A', '### 06:00 — X', '## Tag B', '### 02:00 — Y'], 0, 0);
pruefe('im <details> wird nichts gezaehlt',
  ['## 08.09.2026', '<details>', '### 06:00 — X', '### 02:00 — Y', '</details>'], 0, 0);
/* ⛔ Und die Gegenprobe zur Ausnahme: „Davor" MITTEN im Titel darf NICHT greifen */
pruefe('„davor" mitten im Titel greift NICHT',
  ['## 08.09.2026', '### 06:00 — was davor: geschah', '### 02:00 — Y'], 1, 0);

console.log('\n' + (fehler ? 'FEHLER: ' + fehler : 'Stoertest bestanden'));
process.exit(fehler ? 1 : 0);
