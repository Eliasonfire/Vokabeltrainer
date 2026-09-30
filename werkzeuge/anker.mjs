/* anker.mjs -- welche Lernwoerter kommen in Elias' AUSWENDIGEM Koranbereich vor?
 *
 * Aufruf:
 *   node werkzeuge/anker.mjs 3            alle Woerter aus Kapitel 3
 *   node werkzeuge/anker.mjs 3 4 5        mehrere Kapitel
 *   node werkzeuge/anker.mjs personal     die eigenen Vokabeln
 *   node werkzeuge/anker.mjs --alle       der ganze Lernbestand
 *   node werkzeuge/anker.mjs --wort كتاب  ein einzelnes Wort
 *   node werkzeuge/anker.mjs 3 --text     mit dem vollen Verstext zum Nachlesen
 *
 * WOZU (17.08.2026)
 *
 * Fuer die Eselsbruecken gilt: ein Koranvers hilft nur, wenn Elias die Sure
 * AUSWENDIG kann. Sonst ist der Merkhaken selbst neuer Stoff. Sein Bereich:
 *
 *     seit dem 30.09.2026: seine Haken (data/auswendig.json — 17 Suren und
 *     Vers 2:255) plus Sure 93 (aḍ-Ḍuḥā) und 94 (aš-Šarḥ)
 *
 * Er am 30.09.2026: "mach wirklich nur die die ich abgehackt habe und
 * zusaätzlich sura scharh und duha. ansonsten kenne ich wirklihc keine
 * weiteren außer die zwei und alle die ich abgehackt habe". Gelesen wird der
 * Bereich aus werkzeuge/auswendig.js — dieselbe Quelle wie im Pruefer.
 * (Bis zum 30.09.2026 stand hier Sure 1 · 67 · 93 bis 114: seine Haken vom
 * 17.08.2026 plus seine Ansage "und ein paar mehr noch bis sura duha aber die
 * sind nicht ganz richtig gelernt aber sie kann man auch inkludieren".)
 *
 * ⚠️ Das Skript findet KANDIDATEN, es faellt kein Urteil. Jeder Treffer gehoert
 * am Original nachgeschlagen - die Suche vergleicht Konsonantengerueste, und
 * die sind mehrdeutig. Belegte Fehltreffer aus der ersten Runde: تَجْرِي (98:8)
 * hat die Wurzel ج ر ي und nicht ت ج ر, أَدْرَاكَ ist nicht د ي ك.
 *
 * ⭐ SEIT v633 (30.09.2026) AUCH SEINE DUAS (data/duas.json) — zweiter
 * Suchbereich, Ausgabe „Dua N (Titel)". Er am 29.09.2026: „die duas kannst du
 * für vorschläge nutzen um bessere zu machen …" — „alle dua fotos kann ich
 * 100%". Durchsucht wird nur der belegte Wortlaut (`texte`) der Duas mit
 * alsAnker. ⛔ Eine Koranstelle, die er NUR aus einer Dua kennt (28:24), wird
 * NICHT als ganzer Vers durchsucht: den Anfang des Verses kann er nicht, und
 * ein Treffer dort waere ein Anker ins Leere. Das Zitat muss dann woertlich aus
 * der Dua kommen — pruefe-eselsbruecken.js, Abschnitt 9.
 *
 * ⚠️ Verglichen wird OHNE Vokalzeichen und mit vereinheitlichten Alif-Varianten.
 * Das ist Absicht und noetig: der Korantext kodiert die Hamzah zerlegt
 * (U+0654 / U+0655), abgeschriebene Vokabeln zusammengesetzt. Ein direkter
 * Vergleich scheitert dann lautlos.
 *
 * Beruehrt keine Daten aus dem arabicroots-Zugang. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.join(HIER, '..');

function ladeAusSkript(datei, name){
  const pfad = path.join(WURZEL, datei);
  if (!fs.existsSync(pfad)){ console.error(`${datei} nicht gefunden.`); process.exit(1); }
  return new Function(`${fs.readFileSync(pfad, 'utf8')};return ${name};`)();
}

const QURAN_TEXT = ladeAusSkript('quran-text.js', 'QURAN_TEXT');
const VOCAB_DATA = ladeAusSkript('vocab-data.js', 'VOCAB_DATA');

/* ⛔ QURAN_TEXT ist bei der SURE 1-basiert und beim VERS 0-basiert:
   QURAN_TEXT[sure][vers-1]. Mit [sure-1] landet man eine Sure zu tief, ohne
   jede Fehlermeldung. */
/* ⭐⭐ SEIT DEM 24.08.2026 AUS DEM SPEICHER, nicht mehr abgeschrieben.
   Hier stand `[1, 67, 93..114]` — der Stand vom 17.08.2026, von Hand
   uebertragen. Hakte Elias eine Sure ab, aenderte sich hier nichts, und
   einzelne Verse (`vt_hifzVerse`) kannte ueberhaupt kein Werkzeug.
   Dieselbe Quelle wie pruefe-eselsbruecken.js — eine Auslegung, nicht zwei.
   [[eingefrorenes_feld_ist_kein_zustand]] */
const { auswendigLesen, umfang } = createRequire(import.meta.url)('./auswendig.js');
const AUSW = auswendigLesen(WURZEL);
AUSW.meldungen.forEach(m => console.log('  hinw ' + m));
console.log('Auswendiger Bereich: ' + umfang(AUSW)
  + ' (Quelle: ' + (AUSW.quelle === 'datei' ? 'data/auswendig.json, Stand ' + AUSW.stand
                                            : 'abgeschriebener Stand ' + AUSW.stand) + ')');

/* ⛔⛔ Die Zeichenklasse steht als \u-Folge da und NICHT als sichtbarer Text.
   Genau daran ist die erste Fassung dieses Skripts gescheitert: die Klasse aus
   werkzeuge/vers.mjs sah nach dem Kopieren Zeichen fuer Zeichen gleich aus,
   hatte aber eine ANDERE Reihenfolge der Codepoints - kombinierende Zeichen
   werden beim Anzeigen umsortiert. Aus `ؐ-ؚ` und `ً-ٟ`
   wurde dabei `ؐ-ً` und `ؚ-ٰ`, und dieser eine Bereich
   verschluckt das gesamte arabische Alphabet. Ergebnis: jedes Wort war
   angeblich "zu kurz zum Suchen" - kein Absturz, keine Fehlermeldung.
   Bereiche: Koranzeichen · Harakat · hochgestelltes Alif · weitere Zeichen. */
const ZEICHEN = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08F0-\u08F3]/g;

const flach = s => String(s)
  .replace(ZEICHEN, '')
  .replace(/\u0640/g, '')                                /* Tatwil */
  .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627')   /* Alif-Varianten -> Alif */
  .replace(/\u0629/g, '\u0647')                          /* Ta marbuta -> Ha */
  .replace(/\u0649/g, '\u064A');                         /* Alif maqsura -> Ya */

/* Das Konsonantengeruest der WORTFORM. Bewusst OHNE Abschneiden von
   Vorsilben: Vokabeln stehen in der Grundform, da gibt es keine - dafuer
   haette ein Abschneiden bei Woertern, die MIT einem dieser Buchstaben
   ANFANGEN, den ersten Radikal gefressen. Geeicht an vier bekannten Faellen,
   die dadurch alle als "zu kurz zum Suchen" durchfielen.
   Die Tanwin-Endung faellt schon mit den Vokalzeichen weg. */
function geruest(ar){
  return flach(ar).trim();
}

/* Die WURZEL als zweiter Weg. Ohne sie findet man das Geruest von
   "Moschee" nicht in "und wirf dich nieder" (96:19) - dieselbe Wurzel, eine
   voellig andere Wortform. Gesucht wird: alle Wurzelbuchstaben in der
   richtigen REIHENFOLGE innerhalb EINES Wortes.
   ⚠️ Das ist grob und liefert Fehltreffer. Deshalb steht in der Ausgabe
   dabei, WORAN es lag - Wortform oder Wurzel; ein Wurzeltreffer ist ein
   Hinweis zum Nachschlagen, kein Beleg. */
function wurzelPruefer(root){
  if (!root) return null;
  const b = flach(root).split(/\s+/).filter(Boolean);
  if (b.length < 2) return null;
  return new RegExp(b.map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.{0,3}'));
}

const args = process.argv.slice(2);
const mitText = args.includes('--text');
const rest = args.filter(a => a !== '--text');

let woerter;
if (rest[0] === '--wort'){
  const g = geruest(rest[1] || '');
  woerter = [{ id: '(direkt)', ar: rest[1], de: '', chapter: '-' }];
  if (!g || g.length < 3){ console.error('Zu kurz zum Suchen.'); process.exit(1); }
} else if (rest.includes('--alle')){
  woerter = VOCAB_DATA;
} else if (rest.length){
  const kap = rest.map(k => (k === 'personal' ? 'personal' : Number(k)));
  woerter = VOCAB_DATA.filter(w => kap.includes(w.chapter));
} else {
  console.error('Aufruf: node werkzeuge/anker.mjs <Kapitel…> | --alle | --wort <arabisch>');
  process.exit(1);
}

if (!woerter.length){ console.error('Keine Woerter zu dieser Auswahl.'); process.exit(1); }

/* Den Bereich einmal flach vorbereiten, statt je Wort neu. */
const verse = [];
const schon = new Set();
const nimm = (s, nr, v) => {
  const k = s + ':' + nr;
  if (schon.has(k)) return;
  schon.add(k);
  verse.push({ sure: s, nr, ar: v[0], de: v[1], flach: flach(v[0]) });
};
/* Erst die ganz abgehakten Suren ... */
AUSW.suren.forEach(s => {
  const liste = QURAN_TEXT[s];
  if (!liste) return;
  liste.forEach((v, i) => nimm(s, i + 1, v));
});
/* ... dann die EINZELN abgehakten Verse. `schon` verhindert Doppelte, wenn
   ein Vers zusaetzlich in einer ganz abgehakten Sure steht.
   ⛔ Ohne die Stellen, die er nur aus einer Dua kennt — siehe Kopf. */
AUSW.verse.forEach(k => {
  if (AUSW.ausDuas && AUSW.ausDuas.has(k)) return;
  const [s, nr] = String(k).split(':').map(Number);
  const v = (QURAN_TEXT[s] || [])[nr - 1];
  if (v) nimm(s, nr, v);
});

/* Der zweite Bereich: der belegte Wortlaut seiner Duas. */
const duaTexte = [];
(AUSW.duas || []).filter(d => d && d.alsAnker).forEach(d => {
  (d.texte || []).forEach(t => duaTexte.push({ dua: d, ar: t.arabisch, flach: flach(t.arabisch) }));
});

let mit = 0, ohne = 0;
woerter.forEach(w => {
  const g = geruest(w.ar);
  const wz = wurzelPruefer(w.root);
  if ((!g || g.length < 3) && !wz){
    ohne++; console.log(`- ${w.ar}  (${w.de}) - zu kurz und ohne Wurzel`); return;
  }
  const trifft = x => {
    const formTreffer = g.length >= 3 && x.flach.includes(g);
    const wurzelTreffer = !formTreffer && wz && x.flach.split(/\s+/).some(y => wz.test(y));
    return formTreffer ? 'Form' : (wurzelTreffer ? 'Wurzel' : null);
  };
  const treffer = [];
  verse.forEach(v => { const art = trifft(v); if (art) treffer.push({ v, art }); });
  const inDuas = [];
  duaTexte.forEach(t => { const art = trifft(t); if (art) inDuas.push({ t, art }); });
  if (!treffer.length && !inDuas.length){ ohne++; console.log(`- ${w.ar}  (${w.de})`); return; }
  mit++;
  console.log(`* ${w.ar}  (${w.de})  [id ${w.id}, Kap. ${w.chapter}, Wurzel ${w.root || '-'}]  -> ${treffer.length}`
    + (inDuas.length ? ` + ${inDuas.length} in Duas` : ''));
  treffer.slice(0, 6).forEach(t => {
    console.log(`    ${t.v.sure}:${t.v.nr}  (${t.art})` + (mitText ? `  ${t.v.ar}\n        ${t.v.de}` : ''));
  });
  if (treffer.length > 6) console.log(`    ... und ${treffer.length - 6} weitere`);
  inDuas.slice(0, 4).forEach(x => {
    console.log(`    Dua ${x.t.dua.nr} (${x.t.dua.titel})  (${x.art})` + (mitText ? `  ${x.t.ar}` : ''));
  });
  if (inDuas.length > 4) console.log(`    ... und ${inDuas.length - 4} weitere Dua-Stellen`);
});

console.log(`\n${mit} Wort/Woerter mit Kandidaten, ${ohne} ohne — von ${woerter.length}.`);
console.log('⚠️ Kandidaten, kein Urteil: jeden Treffer am Original nachschlagen.');
