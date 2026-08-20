/* Vokalisierte Surennamen holen und gegenpruefen.
 *
 *   node werkzeuge/surennamen-holen.mjs              nur pruefen und berichten
 *   node werkzeuge/surennamen-holen.mjs --schreiben  Feld arTaschkil eintragen
 *
 * Warum ueberhaupt ein Werkzeug: Elias' Punkt 5 verlangt Taschkil in den
 * Surentiteln. Der Verstext hilft dabei nicht - ein Surenname steht dort in der
 * Regel gar nicht, und wo er vorkommt, dann dekliniert im Satz (nachgesehen am
 * 04.08.2026: 12 von 114). Von Hand eintragen faellt unter E.1 aus.
 *
 * QUELLE DER HARAKAT: https://api.alquran.cloud/v1/surah, Feld "name".
 * Das ist die EINZIGE Quelle fuer die Vokalzeichen - das steht hier so
 * ausdruecklich, damit es niemand fuer zweifach belegt haelt.
 *
 * ZWEIFACH BELEGT ist dagegen das SCHRIFTBILD. Geprueft wird gegen
 *   a) surah-data.js, Feld "ar"  (im Bestand, stammt von quran.com)
 *   b) https://api.quran.com/api/v4/chapters?language=ar, Feld "name_arabic"
 * Nimmt man aus dem vokalisierten Namen alle Zeichen heraus, muss Buchstabe
 * fuer Buchstabe dasselbe herauskommen wie in beiden Listen. Damit ist
 * ausgeschlossen, dass die Quelle einen anderen Namen oder eine andere
 * Schreibung liefert und die Harakat auf ein fremdes Wort gesetzt werden.
 *
 * ZWEI STELLEN, AN DENEN ETWAS ENTSCHIEDEN WIRD - beide bewusst und benannt:
 *
 * 1. Die Quelle liefert den Namen im Genitiv, weil er hinter "سُورَةُ" steht
 *    (Idafa): سُورَةُ الْفَاتِحَةِ. Allein stehend traegt ein Titel keine
 *    Kasusendung, also faellt der letzte kurze Vokal weg -> الْفَاتِحَة.
 *    Das ist ein Weglassen, kein Setzen: kein einziges Vokalzeichen wird
 *    erfunden. So steht es auch in den Inhaltsverzeichnissen der Mushafs.
 *
 * 2. Sure 3 ist der einzige Name aus zwei Woertern: آلِ عِمْرَانَ. Hier traegt
 *    auch das ERSTE Wort noch den Genitiv aus derselben Idafa. Wer ihn
 *    wegnehmen wollte, muesste ein anderes Vokalzeichen SETZEN (آلُ) - das
 *    waere Erfinden. Deshalb bleibt آلِ عِمْرَان stehen, so wie der Name auch
 *    ueblicherweise zitiert wird ("Āli ʿImrān"). ⚠️ Elias entscheidet, ob er
 *    stattdessen آلُ عِمْرَان will; das Werkzeug meldet die Stelle jedes Mal.
 *
 * Orthografie: die Quelle schreibt uthmanisch. Umgesetzt wird nach der
 * Schreibung, die im Bestand schon steht:
 *   ٱ (U+0671 Alif wasla) -> ا      ۡ (U+06E1) -> ْ      ـ (Tatweel) faellt weg
 * Das Dolch-Alif (U+0670) und die Madda (U+0653) bleiben - sie sind Teil der
 * Lesung, nicht der Ausschmueckung.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const DATEI = path.join(HIER, '..', 'surah-data.js');
const SCHREIBEN = process.argv.includes('--schreiben');

const HARAKAT = /[ً-ْٰٓ]/g;
const ENDVOKAL = /[ً-َِ-ًٌٍَُِِ]$/;

function normSchrift(s){
  return String(s)
    .replace(/ٱ/g, 'ا')   // Alif wasla -> Alif
    .replace(/ۡ/g, 'ْ')   // quranisches Sukun -> normales Sukun
    .replace(/آ/g, 'آ')  // Alif + Madda getrennt -> das eine Zeichen آ
    .replace(/ـ/g, '');        // Tatweel weg
}
/* Fuer den VERGLEICH werden alle Alif-Varianten gleichgesetzt. Der Vergleich
   soll beantworten "ist das dasselbe Wort", nicht "ist es gleich geschrieben".
   Beide Fragen sind wichtig, aber es sind zwei - die Schreibunterschiede
   werden weiter unten einzeln gemeldet statt stillschweigend geschluckt.
   Gemessen am 04.08.2026: 5 der 114 Namen schreiben Hamza oder Madda anders
   als surah-data.js, und zwar in BEIDE Richtungen (14 und 76 haben in der
   vokalisierten Quelle ein Hamza, das im Bestand fehlt; 82 und 84 umgekehrt).
   Keine der beiden Listen ist also durchgaengig die "richtige". */
function skelett(s){
  return normSchrift(s)
    .replace(HARAKAT, '')
    .replace(/[أإآا]/g, 'ا')
    .replace(/\s+/g, ' ').trim();
}
function schreibvariante(a, b){
  return skelett(a) === skelett(b) && normSchrift(a).replace(HARAKAT, '') !== normSchrift(b).replace(HARAKAT, '');
}

function ladeBestand(){
  const src = fs.readFileSync(DATEI, 'utf8');
  const daten = new Function(src + ';return SURAH_DATA;')();
  return { src, daten };
}

async function holeVokalisiert(){
  const r = await fetch('https://api.alquran.cloud/v1/surah');
  const j = await r.json();
  return (j.data || []).map(s => ({ id: s.number, roh: s.name }));
}
async function holeZweitschrift(){
  const r = await fetch('https://api.quran.com/api/v4/chapters?language=ar');
  const j = await r.json();
  return new Map((j.chapters || []).map(c => [c.id, c.name_arabic]));
}

const { src, daten } = ladeBestand();
const [vokal, zweit] = await Promise.all([holeVokalisiert(), holeZweitschrift()]);

const fehler = [];
const varianten = [];
const ergebnis = new Map();
let mitEndvokal = 0;
let artikelSukun = 0;

if (vokal.length !== 114) fehler.push(`Quelle lieferte ${vokal.length} statt 114 Suren`);
if (zweit.size !== 114)   fehler.push(`Zweitquelle lieferte ${zweit.size} statt 114 Suren`);

for (const { id, roh } of vokal){
  if (!roh.startsWith('سُورَةُ ')){
    fehler.push(`${id}: erwartetes Praefix "سُورَةُ " fehlt — "${roh}"`);
    continue;
  }
  let name = normSchrift(roh.slice('سُورَةُ '.length)).trim();

  // Entscheidung 1: Kasusendung aus der Idafa faellt weg (nur weglassen)
  if (ENDVOKAL.test(name)){ name = name.replace(ENDVOKAL, ''); mitEndvokal++; }

  /* Entscheidung 3: Sukun auf dem Artikel-Lam ergaenzen.
     Die Quelle ist hier UNEINHEITLICH - sie schreibt الْفَاتِحَة mit Sukun,
     aber البَقَرَة ohne. Gemessen am 04.08.2026: von 114 Namen tragen 35 einen
     Sonnenbuchstaben mit Schadda (dort gehoert richtigerweise kein Sukun hin),
     genau EINER hat das Sukun, und 59 lassen es weg.

     Das ist keine Lesart, sondern eine Auslassung, und der Beleg dafuer liegt
     im Projekt: quran-text.js, derselbe Ordner. Von den 59 Namen kommen 32 im
     Korantext als gewoehnliches Wort vor - ALLE 32 mit Sukun auf dem Lam,
     keiner ohne (ٱلْكَهْفِ, ٱلْفُرْقَانَ, ٱلْعَنكَبُوتِ …). Ueber den ganzen
     Korantext gezaehlt: 4356 Woerter mit ٱلْ.
     ⚠️ Die restlichen 27 Namen stehen NICHT im Korantext. Fuer sie ist die
     Regel belegt, das einzelne Wort nicht - das steht hier so, damit niemand
     die Zahl 32 fuer 59 haelt. Gesetzt wird nur dort, wo der Artikel gar keine
     Marke traegt; eine vorhandene Angabe wird nie ueberschrieben. */
  /* ⚠️ NICHT bei blossem Alif dahinter. Bei الانفطار und الانشقاق ist das
     folgende ا ein Hamzat wasl (Verbalnomen VII. Stamm) - zwei Sukun koennen
     nicht aufeinandertreffen, das Lam traegt dort eine Kasra (الِانْفِطَار).
     Genau deshalb laesst die Quelle die Marke dort weg, es ist keine
     Auslassung. Ein erstes, groeberes Muster hatte hier faelschlich ein Sukun
     gesetzt; gefunden hat es pruefe-taschkil.js.
     أ إ آ dagegen sind Hamzat qatʿ (الْأَنْعَام, الْإِخْلَاص) - dort stimmt das
     Sukun. Die Kasra fuer die zwei Wasl-Faelle wird NICHT gesetzt: sie waere
     unbelegt, und die beiden Namen stehen unter "bleibt offen". */
  if (/^ال[^ً-ْٰا]/.test(name) && name[3] !== 'ّ'){
    name = name.slice(0, 2) + 'ْ' + name.slice(2);
    artikelSukun++;
  }

  const imBestand = daten.find(s => s.id === id);
  const skelettQuelle = skelett(name);
  const skelettBestand = skelett(imBestand ? imBestand.ar : '');
  const skelettZweit   = skelett(zweit.get(id) || '');

  if (skelettQuelle !== skelettBestand)
    fehler.push(`${id}: anderes Wort als in surah-data.js — "${skelettQuelle}" statt "${skelettBestand}"`);
  if (skelettQuelle !== skelettZweit)
    fehler.push(`${id}: anderes Wort als bei quran.com — "${skelettQuelle}" statt "${skelettZweit}"`);
  if (imBestand && schreibvariante(name, imBestand.ar))
    varianten.push(`${id}: "${normSchrift(name).replace(HARAKAT, '')}" (Quelle) gegen "${imBestand.ar}" (Bestand)`);

  ergebnis.set(id, name);
}

const ohneHarakat = [...ergebnis].filter(([, n]) => !/[ً-ْ]/.test(n));

console.log(`Vokalisierte Namen von alquran.cloud: ${vokal.length}`);
console.log(`Schriftbild gegen surah-data.js und quran.com geprueft: ${ergebnis.size} Namen`);
console.log(`Davon Kasusendung entfernt: ${mitEndvokal}`);
console.log(`Sukun auf dem Artikel-Lam ergaenzt: ${artikelSukun} (Beleg: 32 dieser Namen stehen so im Korantext, 4356 Woerter mit ٱلْ insgesamt — siehe Kopf)`);
console.log(`Ohne jedes Vokalzeichen (Muqattaʿat, so in der Quelle): ${ohneHarakat.map(([i, n]) => i + ' ' + n).join(' · ') || 'keine'}`);
console.log(`Schreibvarianten gegenueber surah-data.js (Hamza/Madda): ${varianten.length}`);
for (const v of varianten) console.log('   ', v);
console.log(`⚠️ Sure 3 bleibt "${ergebnis.get(3)}" — erstes Wort traegt den Genitiv der Idafa, siehe Kopf dieser Datei.`);

if (fehler.length){
  console.log(`\n❌ ${fehler.length} Abweichung(en) — es wird NICHTS geschrieben:`);
  for (const f of fehler.slice(0, 20)) console.log('  ', f);
  process.exitCode = 1;
} else if (!SCHREIBEN){
  console.log('\n✅ Alle Gegenproben sauber. Mit --schreiben eintragen.');
  console.log('Beispiele:', [1, 2, 3, 20, 112].map(i => i + ': ' + ergebnis.get(i)).join('  |  '));
} else {
  /* Zeilenweise einsetzen statt die Datei neu zu serialisieren: die
     Kopfkommentare und die Einrueckung bleiben so unangetastet. */
  /* Vorhandene arTaschkil-Zeilen erst entfernen, damit ein zweiter Lauf nicht
     ein zweites Feld danebenschreibt. */
  const zeilen = src.split('\n').filter(z => !/^\s*"arTaschkil":/.test(z));
  let gesetzt = 0, aktuelleId = null;
  const raus = [];
  for (const z of zeilen){
    const m = z.match(/^\s*"id":\s*(\d+),/);
    if (m) aktuelleId = Number(m[1]);
    raus.push(z);
    const ar = z.match(/^(\s*)"ar":\s*".*",\s*$/);
    if (ar && aktuelleId && ergebnis.has(aktuelleId)){
      raus.push(`${ar[1]}"arTaschkil": ${JSON.stringify(ergebnis.get(aktuelleId))},`);
      gesetzt++;
    }
  }
  if (gesetzt !== 114){
    console.log(`\n❌ ${gesetzt} statt 114 Zeilen getroffen — es wird NICHTS geschrieben.`);
    process.exitCode = 1;
  } else {
    /* ⛔ Nie direkt auf die bestehende Datei: surah-data.js — 114 Surennamen.
       Bricht der Lauf mitten im Schreiben ab, steht dort eine leere Datei —
       und eine leere Datei besteht jeden Test. Erst daneben, dann umbenennen;
       rename ist auf demselben Laufwerk unteilbar.
       [[leere_datei_besteht_jeden_test]] */
    fs.writeFileSync(DATEI + '.neu', raus.join('\n'));
    fs.renameSync(DATEI + '.neu', DATEI);
    console.log(`\n✅ ${gesetzt} Namen als "arTaschkil" eingetragen.`);
  }
}
