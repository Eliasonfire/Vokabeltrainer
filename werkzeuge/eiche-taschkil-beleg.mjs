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
import fs from 'node:fs';
const REPO = 'G:/1. Workspace/Vokabeltrainer';

/* ⛔ HIER STANDEN SECHS KOPIEN aus werkzeuge/aussenbelege.mjs — IST_HARAKA,
   DIA, skelett, konsonantIndex, harakaJeKonsonant und harakaAnStelle selbst.
   Diese Datei hat NICHTS aus der Quelle gelesen und damit gruen gemeldet
   fuer Code, den niemand benutzt. Der Kommentar darueber sagte das seit je
   („Weicht eine ab, prueft diese Datei etwas anderes als das, was laeuft")
   — ohne Wirkung, weil es nie jemand nachgemessen hat.

   ⛔⛔ Und es WAR bereits abgewichen, gemessen am 21.08.2026:
     Eichung:  skelett = … .replace(DIA, '')
     Quelle:   skelett = … .replace(DIAKRITIKA, '').replace(STEUER, '')
   Zeichen fuer Zeichen fehlten in DIA genau U+200E und U+200F, die beiden
   RTL-Steuerzeichen. Die Quelle entfernt sie bewusst — dafuer gibt es dort
   die Konstante STEUER. Dazu stand SCH als /ّ/ statt /\u0651/ da.
   [[rtl_richtung_physisch]] [[zeichenklasse_nie_sichtbar_kopieren]]

   ⭐ Bitter daran: aussenbelege.mjs warnt in Z. 95 ausdruecklich „Als
   \u-Folgen, nie sichtbar kopiert: gleiches Bild, andere Codepoints" —
   direkt ueber der Stelle, aus der kopiert wurde. Die Warnung ist nicht
   mitgewandert. [[regel_gilt_nur_mit_begruendung]]

   ⚠️ Ein Textvergleich wie in eiche-plural-beleg.mjs traegt hier NICHT:
   harakaJeKonsonant steht in der Quelle INNERHALB von harakaAnStelle, hier
   stand sie daneben. Die Fassungen sind strukturell verschieden, ein
   Vergleich waere immer rot. Deshalb wird geladen statt verglichen — dann
   gibt es gar keine zweite Fassung mehr, die abweichen koennte. */
const { harakaAnStelle } = (() => {
  const aq = fs.readFileSync(REPO + '/werkzeuge/aussenbelege.mjs', 'utf8');

  /* Block A: die Skelett-Grundlagen. Bis zum Ende der skelett-Zeile. */
  const aVon = aq.indexOf('const DIAKRITIKA');
  if (aVon < 0) throw new Error('aussenbelege.mjs: const DIAKRITIKA nicht gefunden');
  const sk = aq.indexOf('const skelett', aVon);
  if (sk < 0) throw new Error('aussenbelege.mjs: const skelett nicht gefunden');
  const aBis = aq.indexOf('\n', sk);
  if (aBis < 0) throw new Error('aussenbelege.mjs: skelett-Zeile endet nicht');
  const A = aq.slice(aVon, aBis + 1);

  /* Block B: von IST_HARAKA bis zum Ende von harakaAnStelle, per
     Klammerzaehlung — eine Textmarke am Funktionsende verfaellt, sobald
     die Funktion eine Zeile dazubekommt.
     [[indexof_minus_eins_ist_immer_kleiner]] */
  const bVon = aq.indexOf('const IST_HARAKA');
  if (bVon < 0) throw new Error('aussenbelege.mjs: const IST_HARAKA nicht gefunden');
  const fn = aq.indexOf('function harakaAnStelle', bVon);
  if (fn < 0) throw new Error('aussenbelege.mjs: function harakaAnStelle nicht gefunden');
  let i = aq.indexOf('{', fn), tiefe = 0, bBis = -1;
  for (; i < aq.length; i++){
    const c = aq[i], zwei = aq.slice(i, i + 2);
    if (zwei === '/*'){ const e = aq.indexOf('*/', i + 2); if (e < 0) break; i = e + 1; continue; }
    if (zwei === '//'){ const e = aq.indexOf('\n', i + 2); if (e < 0) break; i = e; continue; }
    if (c === '"' || c === "'" || c === '`'){
      for (i++; i < aq.length && aq[i] !== c; i++) if (aq[i] === '\\') i++;
      continue;
    }
    if (c === '{') tiefe++;
    else if (c === '}'){ tiefe--; if (tiefe === 0){ bBis = i + 1; break; } }
  }
  if (bBis < 0) throw new Error('aussenbelege.mjs: Rumpf von harakaAnStelle endet nicht');
  const B = aq.slice(bVon, bBis);

  const raus = new Function(A + '\n' + B + '\nreturn { harakaAnStelle };')();
  if (typeof raus.harakaAnStelle !== 'function')
    throw new Error('harakaAnStelle wurde aus aussenbelege.mjs nicht geladen');
  console.log('  harakaAnStelle aus werkzeuge/aussenbelege.mjs geladen ✔');
  return raus;
})();

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
