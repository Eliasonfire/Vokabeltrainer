/* eiche-taschkil-beleg.mjs — haelt die Trennung fest, die dreimal danebenging
   ==========================================================================
   `aussenbelege.mjs` belegt Taschkil-Luecken mit Wiktionary-Formen. Die Frage
   dabei ist nie „steht dort eine Haraka", sondern „ist es ueberhaupt dasselbe
   Wort" — und daran ist die Bedingung am 21.08.2026 dreimal gescheitert:

     1. Zu weit:   اسْمِي („mein Name") traf اِسْمِيّ („nominal"). Skelett gleich,
                   aber Wiktionary hat ein Schadda am Ende. Der Beleg war nur
                   ZUFAELLIG richtig — beide tragen Kasra auf dem Alif.
     2. Zu streng: nach dem Fix fiel إِضافة heraus, weil Wiktionary إِضَافَة
                   fuehrt. Die zusaetzliche Fatha ist aber keine Abweichung,
                   sondern die FEHLENDE Angabe bei Elias.
     3. Richtig:   Vokal und Schadda sind zwei verschiedene Fragen.

   ⭐ DIE TRENNUNG, die beides richtig macht:

       Vokal    nur ein WIDERSPRUCH zaehlt — beide Seiten haben einen, und er
                ist verschieden. Fehlt er bei Elias, ist das die Luecke.
       Schadda  STRUKTURELL. Hat eine Seite eine und die andere nicht, sind es
                verschiedene Woerter — auch bei fehlender Schadda.

   ⛔ Diese Datei ist der Grund, warum das nicht ein viertes Mal passiert.
   Exitcode 1 heisst: die Bedingung hat sich verschoben.
   [[kennzeichen_mit_zwei_ursachen]] [[pruefwerkzeug_mit_eingebauter_antwort]]

   Aufruf:  node werkzeuge/eiche-taschkil-beleg.mjs
*/
const IST_HARAKA = /[ً-ْٰ]/;
const DIA = /[ً-ْٰـٓ-ٕۖ-ۭ]/g;
const skelett = s => (s || '').normalize('NFC').replace(DIA, '').trim();

const konsonantIndex = (wort, stelle) => {
  let n = -1;
  for (let i = 0; i <= stelle && i < wort.length; i++) if (!IST_HARAKA.test(wort[i])) n++;
  return n;
};
const harakaJeKonsonant = (s) => {
  const raus = []; let k = -1;
  for (let i = 0; i < s.length; i++){
    if (IST_HARAKA.test(s[i])) continue;
    k++;
    const m = /^[ً-ْٰ]+/.exec(s.slice(i + 1));
    raus[k] = m ? m[0] : '';
  }
  return raus;
};

/* ⛔ Wortgleich mit der Fassung in aussenbelege.mjs. Weicht eine ab, prueft
   diese Datei etwas anderes als das, was laeuft — und meldet Gruen fuer einen
   Code, den niemand benutzt. */
function harakaAnStelle(kandidat, wort, stelle){
  if (skelett(wort) !== skelett(kandidat)) return null;
  const ziel = konsonantIndex(wort, stelle);
  if (ziel < 0) return null;
  let n = -1, gefunden = null;
  for (let i = 0; i < kandidat.length; i++){
    if (IST_HARAKA.test(kandidat[i])) continue;
    n++;
    if (n === ziel){
      const m = /^[ً-ْٰ]+/.exec(kandidat.slice(i + 1));
      gefunden = m ? m[0] : null;
      break;
    }
  }
  if (!gefunden) return null;
  const hw = harakaJeKonsonant(wort), hk = harakaJeKonsonant(kandidat);
  const SCH = /ّ/;
  const vokal = s => (s || '').replace(SCH, '');
  for (let i = 0; i < Math.min(hw.length, hk.length); i++){
    if (SCH.test(hw[i] || '') !== SCH.test(hk[i] || '')) return null;
    if (i === ziel) continue;
    const a = vokal(hw[i]), b = vokal(hk[i]);
    if (a && b && a !== b) return null;
  }
  return gefunden;
}

/* Elias' Schreibung · Wiktionary-Form · Stelle im vollen String · soll · warum */
const FAELLE = [
  ['اسْمُ',    'اِسْم',      0, true,  'Hamzat al-wasl: nur die gefragte Stelle unterscheidet sich'],
  ['امْرَأَةٌ', 'اِمْرَأَة',  0, true,  'dasselbe, zweites Wort der Gruppe'],
  ['إِضافة',   'إِضَافَة',   2, true,  '⭐ Wiktionary ist VOLLSTAENDIGER — fehlende Fatha ist keine Abweichung'],
  ['تاء',      'تَاء',       0, true,  'einfachster Fall, gar keine Harakat bei Elias'],
  ['اسْمِي',   'اِسْمِيّ',    0, false, '⭐⭐ HOMOGRAPH: „nominal" gegen „mein Name" — die Schadda trennt sie'],
  ['حَالُكْ',   'حَالِك',     0, false, 'Kasra gegen Damma auf demselben Konsonanten = Widerspruch'],
  ['بَيْتٌ',    'بَنْت',      0, false, 'anderes Skelett']
];

let fehler = 0;
console.log('Elias'.padEnd(14) + 'Wiktionary'.padEnd(14) + 'St  ist   soll');
for (const [wort, kand, stelle, soll, warum] of FAELLE){
  const r = harakaAnStelle(kand, wort, stelle) !== null;
  const ok = r === soll;
  if (!ok) fehler++;
  console.log(wort.padEnd(14) + kand.padEnd(14) + String(stelle).padEnd(4)
    + String(r).padEnd(6) + String(soll) + (ok ? '  ok' : '  ⛔ FALSCH'));
  console.log('   ' + warum);
}
console.log('');
if (fehler){ console.log('⛔ ' + fehler + ' von ' + FAELLE.length + ' falsch — die Bedingung hat sich verschoben.'); process.exit(1); }
console.log('✔ ' + FAELLE.length + ' von ' + FAELLE.length + ' richtig, davon 3 die NICHT durchgehen duerfen.');
