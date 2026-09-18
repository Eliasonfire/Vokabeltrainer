#!/usr/bin/env node
/* test-lesezaehlung.mjs — die ENTSCHEIDUNG prüfen, nicht die Optik.
 * ================================================================
 *
 * Woher der Test kommt: Elias hat az-Zalzala auf dem Tablet gelesen, und die
 * Tagesaufgabe blieb offen. Die Zählung hing am Beobachter des Lesestands, und
 * der schneidet unten 60 % ab — eine kurze Sure, die ganz auf den Schirm
 * passt, wurde NIE gezählt.
 *
 * Am selben Abend der zweite Teil: die feste Minute passte nicht. Elias:
 * „und dafür brauche ich wahrscheinlich keine ganze minute um es zu lesen"
 * (al-Ikhlāṣ) und „dann ist sura al mulk aber sicher nicht nach 30 sekunden
 * gelesen". Seitdem hängt die Schwelle an der Wortzahl der Sure — und der Test
 * rechnet mit dem ECHTEN Korantext und der ECHTEN quranWorte(), nicht mit
 * ausgedachten Zahlen.
 *
 * ⛔ IM BROWSER-PANE IST DAS NICHT MESSBAR. Dort steht `document.hidden` auf
 * true und jedes getBoundingClientRect() liefert Nullen; ein IntersectionObserver
 * meldet nichts. Ein „im Browser geprüft" wäre hier eine Behauptung.
 * [[leere_liste_ist_keine_messung]]
 *
 * Deshalb hier: die Funktionen aus js/quran.js isoliert laufen lassen und den
 * Beobachter von Hand auslösen. Geprüft wird, WANN gezählt wird — nicht, ob
 * ein Rechteck im Bild liegt.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
let quelle = fs.readFileSync(path.join(HIER, 'js', 'quran.js'), 'utf8');

/* Störtest: die feste Minute zurückholen, die bis zum 16.09.2026 abends galt.
   Dann MUSS der Test rot werden — sonst prüft er die Länge gar nicht. */
const STOERTEST = process.argv.includes('--stoertest');
if (STOERTEST){
  const alt = 'return Math.max(WDH_MINDESTZEIT, Math.round(woerter * WDH_SEK_JE_WORT * 1000));';
  if (!quelle.includes(alt)){
    console.log('⛔ Störtest: die Zeile, die gestört werden soll, steht nicht mehr in js/quran.js.');
    process.exit(1);
  }
  quelle = quelle.replace(alt, 'return 60 * 1000;');
}
/* 2,3 MB — gelesen vom Skript, nicht vom Modell. */
const koran = fs.readFileSync(path.join(HIER, 'quran-text.js'), 'utf8');

/* Zwei Abschnitte ausschneiden: die Wortzählung des Lesers und den Block von
   der Schwelle bis zum Haken.
   ⚠️ Über indexOf und nicht über einen Regex mit Zeilengrenzen — genau daran
   ist pruefe-zweipuffer.mjs zerbrochen, als eine Zeile umgebrochen wurde.
   [[const_ist_im_vm_kontext_unsichtbar]] */
const MARKEN = [
  ['const WDH_SEK_JE_WORT', '/* ---------- Der Haken am Ende der Sure'],
  ['const QW_TANWIN_FATH', 'function quranWortSpans'],
];
const stuecke = [];
for (const [a, b] of MARKEN){
  const von = quelle.indexOf(a), bis = quelle.indexOf(b);
  if (von < 0 || bis < 0 || bis <= von){
    console.log('⛔ Ein Abschnitt liess sich nicht ausschneiden — Marken in js/quran.js geaendert?');
    console.log('   gesucht: "' + a + '" bis "' + b + '"');
    process.exit(1);
  }
  stuecke.push(quelle.slice(von, bis));
}
const [block, woerter] = stuecke;

/* Attrappen. Nur, was der Block wirklich anfasst. */
let GEZAEHLT = [];
let JETZT = 1000000;
const horcher = {};
const ctx = {
  console,
  Date: { now: () => JETZT },
  document: {
    visibilityState: 'visible',
    addEventListener(name, fn){ horcher[name] = fn; },
  },
  setTimeout: () => 0,          /* die Uhr wird im Test von Hand weitergedreht */
  clearTimeout: () => {},
  IntersectionObserver: class { constructor(fn){ this.fn = fn; } observe(){} disconnect(){} },
  merkeWiederholung: (sure) => { GEZAEHLT.push(sure); },
  VERSE_CACHE: {},
  /* leseSureSetzen() fragt seit 18.09.2026 nach der Seite des Tages; die
     setzt der Test in Abschnitt 9 von Hand (seiteDesTages). */
  todayStr: () => '2026-09-18',
};
vm.createContext(ctx);
/* ⚠️ Alles in EINEM Lauf: die `const` aus quran-text.js und der Wortzählung
   sind sonst für den Block nicht sichtbar. */
vm.runInContext(koran + '\n' + woerter + '\n' + block + `
;globalThis.__api = {
  setzen: leseSureSetzen, start: leseZeitStart, halt: leseZeitHalt,
  jetzt: leseZeitJetzt, pruefe: pruefeWiederholung,
  ende: (an) => { LESE_ENDE_GESEHEN = an; },
  /* so, wie vergissWiederholung() es ruft, wenn Elias den Haken zurücknimmt */
  zurueck: (s) => leseZuruecknahme(s),
  stand: () => ({ sure: LESE_SURE, ende: LESE_ENDE_GESEHEN, laeuft: LESE_SEIT > 0 }),
  schwelle: (s) => wdhSchwelle(s),
  untergrenze: WDH_MINDESTZEIT,
  ohneText: WDH_OHNE_TEXT,
  /* so, wie openSurah() den Zwischenspeicher füllt, bevor die Sure gezeichnet wird */
  laden: (s) => { VERSE_CACHE[s] = QURAN_TEXT[s].map(v => ({ text_uthmani: v[0] })); },
  /* die Seite des Tages (18.09.2026) */
  seiteDesTages: (b) => { zufallsSeiteHeute = () => b; },
  seite: () => SEITE_HIER,
  seiteSchwelle: () => SEITE_SCHWELLE,
  seitenEnde: (an) => { SEITE_ENDE_GESEHEN = an; },
  pruefeSeite: () => pruefeSeite(),
  worte: (s, v) => quranWorte(QURAN_TEXT[s][v - 1][0]).length,
  sekJeWort: WDH_SEK_JE_WORT,
};`, ctx);

const A = ctx.__api;
let ok = 0, schlecht = 0;
const pruefe = (name, ist, soll) => {
  const gleich = JSON.stringify(ist) === JSON.stringify(soll);
  if (gleich){ ok++; console.log('  ✔ ' + name); }
  else { schlecht++; console.log('  ⛔ ' + name + '\n       erwartet: ' + JSON.stringify(soll) + '\n       bekommen: ' + JSON.stringify(ist)); }
};
const neu = () => { GEZAEHLT = []; JETZT = 1000000; A.setzen(null); };
const warte = (sek) => { JETZT += sek * 1000; };
const oeffne = (s) => { A.laden(s); A.setzen(s); };
const sek = (ms) => ms / 1000;

console.log('Lesezählung — wann gilt eine Sure als gelesen?');
console.log('');

/* ---------- 0. Die Schwelle selbst: SEINE drei Sätze ---------------------- */
console.log('0. Wie lange muss eine Sure offen sein?');
for (const s of [108, 112, 97, 99, 67]) A.laden(s);
const S = { kawthar: A.schwelle(108), ikhlas: A.schwelle(112), qadr: A.schwelle(97),
            zalzala: A.schwelle(99), mulk: A.schwelle(67) };
console.log('   al-Kawthar ' + sek(S.kawthar) + ' s · al-Ikhlāṣ ' + sek(S.ikhlas) + ' s · al-Qadr '
  + sek(S.qadr) + ' s · az-Zalzala ' + sek(S.zalzala) + ' s · al-Mulk ' + sek(S.mulk) + ' s');
pruefe('   „keine ganze minute" für al-Ikhlāṣ', S.ikhlas < 60000, true);
pruefe('   „al mulk sicher nicht nach 30 sekunden" — und auch nicht nach der alten Minute',
  S.mulk > 60000, true);
pruefe('   „nicht überall das selbe maß": al-Mulk > az-Zalzala > al-Ikhlāṣ',
  S.mulk > S.zalzala && S.zalzala > S.ikhlas, true);
pruefe('   „für 5 sek rein geht" reicht nie, auch bei der kürzesten Sure',
  A.untergrenze > 5000 && S.kawthar >= A.untergrenze, true);
pruefe('   ohne zählbaren Text: die alte Minute als Rückfall', A.schwelle(5), A.ohneText);

/* ⛔ Echtes Lesen darf nie durchfallen. Gegenprobe an Mishari al-ʿAfāsī,
   Verszeiten von api.qurancdn.com, gemessen 16.09.2026 (erstes Wort ab 0 ms).
   Elias: „kürze es ungefähr um 1/3 weil die sprechen es recht schön und
   langsam aus und ich nicht" · „manchmal lese ich auch recht schnell".
   Wird die Rate einmal hochgesetzt, fällt DIESE Zeile zuerst — und sagt warum. */
const REZITATION = { 108: 15.5, 112: 13.3, 103: 20.1, 110: 25.2, 113: 23.8, 114: 40.9,
                     97: 35.8, 99: 49.9, 93: 55.0, 96: 83.7, 98: 113.2, 1: 46.5, 67: 444.2 };
const zuStreng = [];
for (const [s, dauer] of Object.entries(REZITATION)){
  A.laden(Number(s));
  const grenze = dauer * 1000 * 2 / 3;
  if (A.schwelle(Number(s)) > grenze)
    zuStreng.push(s + ' (' + sek(A.schwelle(Number(s))) + ' s > ⅔ von ' + dauer + ' s)');
}
pruefe('   „um 1/3 kürzen": bei allen 13 gemessenen Suren höchstens ⅔ der Rezitation', zuStreng, []);
console.log('');

/* ---------- 1. Sein zweiter Fall: al-Ikhlāṣ am Handy ---------------------- */
console.log('1. al-Ikhlāṣ am Handy — ganz auf dem Schirm, schnell gelesen');
neu();
oeffne(112);
A.ende(true); A.pruefe();
pruefe('   nach 0 s noch NICHT gezählt', GEZAEHLT, []);
warte(sek(S.ikhlas) - 1); A.pruefe();
pruefe('   eine Sekunde vor der Schwelle noch nicht', GEZAEHLT, []);
warte(2); A.pruefe();
pruefe('   kurz danach gezählt — ohne eine ganze Minute', GEZAEHLT, [112]);
console.log('');

/* ---------- 2. Seine eigene Begründung: 5 Sekunden reingucken ------------- */
console.log('2. „nicht einfach für 5 sek rein geht, kurz guckt und wieder raus"');
neu();
oeffne(108);                         /* die kürzeste Sure — der schwerste Fall */
A.ende(true);
warte(5); A.pruefe();
pruefe('   5 s reichen auch bei al-Kawthar nicht', GEZAEHLT, []);
A.setzen(null);                      /* raus aus der Sure */
warte(300);                          /* fünf Minuten später */
oeffne(108); A.ende(true); A.pruefe();
pruefe('   und beim Wiederkommen fängt die Uhr von vorn an', GEZAEHLT, []);
console.log('');

/* ---------- 3. al-Mulk: die feste Minute hätte sie zu früh gezählt -------- */
console.log('3. al-Mulk — „sicher nicht nach 30 sekunden gelesen"');
neu();
oeffne(67);
A.ende(true);
warte(30); A.pruefe();
pruefe('   nach 30 s nicht gezählt', GEZAEHLT, []);
warte(30); A.pruefe();
pruefe('   ⛔ nach 60 s (der alten Minute) auch nicht', GEZAEHLT, []);
warte(sek(S.mulk) - 60 + 1); A.pruefe();
pruefe('   erst nach ' + Math.ceil(sek(S.mulk)) + ' s gezählt', GEZAEHLT, [67]);
console.log('');

/* ---------- 4. Zeit allein reicht nicht: das Ende muss gesehen sein ------- */
console.log('4. Lange genug drin, aber nie bis zum Ende gerollt');
neu();
oeffne(67);
warte(600); A.pruefe();
pruefe('   10 Minuten ohne das Ende: nicht gezählt', GEZAEHLT, []);
A.ende(true); A.pruefe();
pruefe('   sobald das Ende sichtbar wird: gezählt', GEZAEHLT, [67]);
console.log('');

/* ---------- 5. ⛔ Die App wird weggelegt — die Uhr muss anhalten ---------- */
console.log('5. App weglegen und in zehn Minuten zurückkommen');
neu();
oeffne(99);
A.ende(true);
warte(10);
ctx.document.visibilityState = 'hidden'; horcher.visibilitychange();
pruefe('   weggelegt: Uhr steht', A.stand().laeuft, false);
warte(600);                          /* zehn Minuten in der Tasche */
ctx.document.visibilityState = 'visible'; horcher.visibilitychange();
A.pruefe();
pruefe('   ⛔ die zehn Minuten zählen NICHT mit', GEZAEHLT, []);
pruefe('   die 10 s von vorher sind aber noch da', Math.round(A.jetzt() / 1000), 10);
warte(sek(S.zalzala) - 10 - 1); A.pruefe();
pruefe('   eine Sekunde vor der Schwelle noch nicht', GEZAEHLT, []);
warte(2); A.pruefe();
pruefe('   danach gezählt', GEZAEHLT, [99]);
console.log('');

/* ---------- 6. Wechsel zwischen zwei Suren --------------------------------*/
console.log('6. Von einer Sure in die nächste wechseln');
neu();
oeffne(97);
A.ende(true);
warte(sek(S.qadr) - 1);
oeffne(99);                          /* jetzt die nächste öffnen */
A.ende(true); A.pruefe();
pruefe('   die neue Sure erbt die Sekunden der alten NICHT', GEZAEHLT, []);
pruefe('   ihre Uhr steht bei 0', Math.round(A.jetzt() / 1000), 0);
pruefe('   und sie hat IHRE Schwelle, nicht die der alten', A.schwelle(99), S.zalzala);
warte(sek(S.zalzala) + 1); A.pruefe();
pruefe('   nach eigener Schwelle gezählt, und zwar die richtige', GEZAEHLT, [99]);
console.log('');

/* ---------- 7. Zurückgenommen: die Automatik trägt nicht sofort nach ------- */
/* ⭐ Elias am 17.09.2026: „dass ich in die sure nach unten gehen kann und das
   heute gelesen antippen kann damit es nicht mehr als gelesen gilt und auch
   der ring dann wieder nicht voll ist".
   ⛔ Der gefährliche Fall ist genau dieser: Er tippt den Haken weg, während er
   noch UNTEN in der Sure steht. Das Ende ist sichtbar, die Zeit ist längst
   voll — ohne Sperre trüge der nächste Ruck am Bildschirm den Haken sofort
   wieder ein, und die Rücknahme wäre ein Knopf ohne Wirkung.
   [[wirkung_an_der_quelle_stilllegen]] */
console.log('7. Haken zurückgenommen, während die Sure noch offen ist');
neu();
oeffne(99);
A.ende(true);
warte(sek(S.zalzala) + 1); A.pruefe();
pruefe('   erst ganz normal gezählt', GEZAEHLT, [99]);
GEZAEHLT = [];
A.zurueck(99);                       /* er tippt „Heute gelesen — zurücknehmen" */
A.ende(true); A.pruefe();            /* und rollt weiter: Ende wieder gemeldet */
pruefe('   danach zählt dieselbe Lesung NICHT noch einmal', GEZAEHLT, []);
warte(600); A.pruefe();
pruefe('   auch zehn Minuten später nicht', GEZAEHLT, []);
A.zurueck(97);                       /* eine ANDERE Sure geht die Sperre nichts an */
oeffne(99); A.ende(true);            /* raus und wieder rein */
warte(sek(S.zalzala) + 1); A.pruefe();
pruefe('   beim erneuten Öffnen zählt sie wieder normal', GEZAEHLT, [99]);
console.log('');

/* ---------- 8. Ohne offene Sure passiert nichts --------------------------- */
console.log('8. Keine Sure offen');
neu();
A.ende(true);
warte(600); A.pruefe();
pruefe('   nichts wird gezählt', GEZAEHLT, []);
console.log('');

/* ---------- 9. Die Seite des Tages (18.09.2026) ----------------------------
   Elias: „ich will halt einfach eine ganze seite lesen darum geht es". Seite
   106 fängt in an-Nisāʾ an (4:176) und endet in al-Māʾida (5:2). Gezählt wird
   in der Sure, in der sie ENDET, mit der Wortzahl IHRES Teils dort — die Uhr
   fängt beim Öffnen jeder Sure neu an. */
console.log('9. Die Seite des Tages');
const teil = (s, von, bis) => { let n = 0; for (let v = von; v <= bis; v++) n += A.worte(s, v); return n; };
const schwelleAus = (w) => Math.max(A.untergrenze, Math.round(w * A.sekJeWort * 1000));

neu();
A.seiteDesTages({ seite: 3, sure: 2, von: 6, bisSure: 2, bis: 16 });
oeffne(2);
const soll3 = schwelleAus(teil(2, 6, 16));
pruefe('   Seite 3 (2:6–16): die Schwelle kommt aus Vers 6 bis 16 (' + sek(soll3) + ' s), nicht ab Vers 1',
  A.seiteSchwelle(), soll3);

neu();
A.seiteDesTages({ seite: 106, sure: 4, von: 176, bisSure: 5, bis: 2 });
oeffne(4);
pruefe('   Seite 106 in an-Nisāʾ, wo sie ANFÄNGT: dort wird sie nicht gezählt', A.seite(), null);
oeffne(5);
pruefe('   in al-Māʾida, wo sie endet, ist sie die Seite hier', A.seite() && A.seite().seite, 106);
const soll106 = schwelleAus(teil(5, 1, 2));
pruefe('   die Schwelle kommt aus 5:1–2 (' + sek(soll106) + ' s)', A.seiteSchwelle(), soll106);
A.seitenEnde(true);
warte(sek(soll106) - 1); A.pruefeSeite();
pruefe('   Seitenende gesehen, aber zu kurz offen: noch nicht gezählt', GEZAEHLT, []);
warte(2); A.pruefeSeite();
pruefe('   lange genug: gezählt als „seite:106"', GEZAEHLT, ['seite:106']);
A.zurueck('seite:106');
GEZAEHLT = [];
warte(600); A.pruefeSeite();
pruefe('   von Hand zurückgenommen: in dieser Lesung nicht wieder gezählt', GEZAEHLT, []);
console.log('');

if (STOERTEST){
  if (schlecht){ console.log('✔ Störtest: mit der festen Minute wird der Test rot (' + schlecht + ' Befund(e)).'); process.exit(0); }
  console.log('⛔ Störtest: der Test blieb GRÜN, obwohl wieder eine feste Minute gilt.');
  process.exit(1);
}
console.log(schlecht
  ? '⛔ ' + schlecht + ' von ' + (ok + schlecht) + ' Zusicherungen gescheitert.'
  : '✅ ' + ok + ' Zusicherungen, alle richtig.');
process.exit(schlecht ? 1 : 0);
