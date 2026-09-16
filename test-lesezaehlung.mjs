#!/usr/bin/env node
/* test-lesezaehlung.mjs — die ENTSCHEIDUNG prüfen, nicht die Optik.
 * ================================================================
 *
 * Woher der Test kommt: Elias hat az-Zalzala auf dem Tablet gelesen, und die
 * Tagesaufgabe blieb offen. Die Zählung hing am Beobachter des Lesestands, und
 * der schneidet unten 60 % ab — eine kurze Sure, die ganz auf den Schirm
 * passt, wurde NIE gezählt.
 *
 * ⛔ IM BROWSER-PANE IST DAS NICHT MESSBAR. Dort steht `document.hidden` auf
 * true und jedes getBoundingClientRect() liefert Nullen; ein IntersectionObserver
 * meldet nichts. Ein „im Browser geprüft" wäre hier eine Behauptung.
 * [[leere_liste_ist_keine_messung]]
 *
 * Deshalb hier: die vier Funktionen aus js/quran.js isoliert laufen lassen und
 * den Beobachter von Hand auslösen. Geprüft wird, WANN gezählt wird — nicht,
 * ob ein Rechteck im Bild liegt.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const quelle = fs.readFileSync(path.join(HIER, 'js', 'quran.js'), 'utf8');

/* Den Block ausschneiden: von der Mindestzeit bis zum Beobachter.
   ⚠️ Über indexOf und nicht über einen Regex mit Zeilengrenzen — genau daran
   ist pruefe-zweipuffer.mjs zerbrochen, als eine Zeile umgebrochen wurde.
   [[const_ist_im_vm_kontext_unsichtbar]] */
const von = quelle.indexOf('const WDH_MINDESTZEIT');
const bis = quelle.indexOf('/* ---------- Der Haken am Ende der Sure');
if (von < 0 || bis < 0 || bis <= von){
  console.log('⛔ Der Abschnitt liess sich nicht ausschneiden — Marken in js/quran.js geaendert?');
  console.log('   gesucht: "const WDH_MINDESTZEIT" und "/* ---------- Der Haken am Ende der Sure"');
  process.exit(1);
}
const block = quelle.slice(von, bis);

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
};
vm.createContext(ctx);
vm.runInContext(block + `
;globalThis.__api = {
  setzen: leseSureSetzen, start: leseZeitStart, halt: leseZeitHalt,
  jetzt: leseZeitJetzt, pruefe: pruefeWiederholung,
  ende: (an) => { LESE_ENDE_GESEHEN = an; },
  stand: () => ({ sure: LESE_SURE, ende: LESE_ENDE_GESEHEN, laeuft: LESE_SEIT > 0 }),
  schwelle: WDH_MINDESTZEIT
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

console.log('Lesezählung — wann gilt eine Sure als gelesen?');
console.log('');
console.log('Die Schwelle steht bei ' + (A.schwelle / 1000) + ' Sekunden.');
console.log('');

/* ---------- 1. Elias' Fall: kurze Sure, Ende von Anfang an sichtbar ------- */
console.log('1. Az-Zalzala auf dem Tablet — das Ende ist sofort sichtbar');
neu();
A.setzen(99);
A.ende(true); A.pruefe();
pruefe('   nach 0 s noch NICHT gezählt (er hat nur hineingesehen)', GEZAEHLT, []);
warte(59); A.pruefe();
pruefe('   nach 59 s immer noch nicht', GEZAEHLT, []);
warte(2); A.pruefe();
pruefe('   nach 61 s gezählt', GEZAEHLT, [99]);
console.log('');

/* ---------- 2. Seine eigene Begründung: 5 Sekunden reingucken ------------- */
console.log('2. „nicht einfach für 5 sek rein geht, kurz guckt und wieder raus"');
neu();
A.setzen(99);
A.ende(true);
warte(5); A.pruefe();
pruefe('   5 s reichen nicht', GEZAEHLT, []);
A.setzen(null);                     /* raus aus der Sure */
warte(300);                          /* fünf Minuten später */
A.setzen(99); A.ende(true); A.pruefe();
pruefe('   und beim Wiederkommen fängt die Uhr von vorn an', GEZAEHLT, []);
console.log('');

/* ---------- 3. Zeit allein reicht nicht: das Ende muss gesehen sein ------- */
console.log('3. Lange genug drin, aber nie bis zum Ende gerollt');
neu();
A.setzen(2);                        /* al-Baqarah */
warte(600); A.pruefe();
pruefe('   10 Minuten ohne das Ende: nicht gezählt', GEZAEHLT, []);
A.ende(true); A.pruefe();
pruefe('   sobald das Ende sichtbar wird: gezählt', GEZAEHLT, [2]);
console.log('');

/* ---------- 4. ⛔ Die App wird weggelegt — die Uhr muss anhalten ---------- */
console.log('4. App weglegen und in zwei Minuten zurückkommen');
neu();
A.setzen(99);
A.ende(true);
warte(10);
ctx.document.visibilityState = 'hidden'; horcher.visibilitychange();
pruefe('   weggelegt: Uhr steht', A.stand().laeuft, false);
warte(600);                          /* zehn Minuten in der Tasche */
ctx.document.visibilityState = 'visible'; horcher.visibilitychange();
A.pruefe();
pruefe('   ⛔ die zehn Minuten zählen NICHT mit', GEZAEHLT, []);
pruefe('   die 10 s von vorher sind aber noch da', Math.round(A.jetzt() / 1000), 10);
warte(51); A.pruefe();
pruefe('   nach weiteren 51 s echter Lesezeit: gezählt', GEZAEHLT, [99]);
console.log('');

/* ---------- 5. Wechsel zwischen zwei Suren --------------------------------*/
console.log('5. Von einer Sure in die nächste wechseln');
neu();
A.setzen(97);
A.ende(true);
warte(59);
A.setzen(99);                        /* jetzt die nächste öffnen */
A.ende(true); A.pruefe();
pruefe('   die neue Sure erbt die 59 s NICHT', GEZAEHLT, []);
pruefe('   ihre Uhr steht bei 0', Math.round(A.jetzt() / 1000), 0);
warte(61); A.pruefe();
pruefe('   nach eigenen 61 s: gezählt, und zwar die richtige', GEZAEHLT, [99]);
console.log('');

/* ---------- 6. Ohne offene Sure passiert nichts --------------------------- */
console.log('6. Keine Sure offen');
neu();
A.ende(true);
warte(600); A.pruefe();
pruefe('   nichts wird gezählt', GEZAEHLT, []);
console.log('');

console.log(schlecht
  ? '⛔ ' + schlecht + ' von ' + (ok + schlecht) + ' Zusicherungen gescheitert.'
  : '✅ ' + ok + ' Zusicherungen, alle richtig.');
process.exit(schlecht ? 1 : 0);
