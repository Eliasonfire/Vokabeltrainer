#!/usr/bin/env node
/* pruefe-suche.js — misst, ob die Wortsuche findet, was da ist.
 *
 * ⛔ WARUM ES DIESE DATEI GIBT (06.09.2026)
 *
 * Über `SUCH_ZEICHEN` in js/kategorien.js stand seit Wochen:
 *
 *   „Die Zeichenklasse steht als \u-Folgen da und wird NIE sichtbar kopiert.
 *    Eine kopierte Klasse sieht Zeichen für Zeichen gleich aus und trifft
 *    etwas anderes; am 17.08.2026 hat genau das ein Werkzeug lautlos
 *    unbrauchbar gemacht. Danach an bekannten Fällen geeicht (siehe
 *    pruefe-suche.js)."
 *
 * Zwei Aussagen darin waren falsch:
 *   1. `pruefe-suche.js` hat **nie existiert** — `git log --all --` findet
 *      keinen einzigen Eintrag. Die Eichung, auf die sich der Kommentar
 *      beruft, gab es nicht.
 *   2. Die Klasse stand **nicht** als \u-Folgen da, sondern mit sichtbaren
 *      arabischen Zeichen — also genau in der Form, vor der derselbe
 *      Kommentar warnt.
 *
 * ⭐ Nachgemessen war die Klasse trotzdem richtig: sie trifft 61 Zeichen in
 * fünf Spannen (U+0610–061A, U+064B–065F, U+0670, U+06D6–06ED, U+08F0–08F3)
 * und **keinen einzigen Grundbuchstaben**. Das Glück ändert nichts am Befund:
 * eine Zusicherung, die niemand prüft, ist keine.
 * [[erfundene_begruendung_schliesst_den_fall]] [[werkzeug_ohne_aufrufer]]
 *
 * ⭐⭐ Gemessen wird an den ECHTEN Vokabeln, nicht nur an acht Beispielen,
 * die ich mir selbst ausgedacht habe. Der Kern ist Abschnitt 3: jedes Wort
 * des Bestands muss sich selbst finden — voll vokalisiert getippt UND nackt.
 * Acht selbst gewählte Fälle prüfen meine Erwartung, 4400 Wörter prüfen die
 * Suche. [[liste_und_haken_von_mir]]
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const W = __dirname;

let fehler = 0;
const sag = (ok, text) => { if (!ok) fehler++; console.log('  ' + (ok ? 'ok  ' : '⛔  ') + text); };

/* ---------- Die Suche aus der Datei schneiden, nicht abtippen ---------- */
/* ⛔ Abgetippt wäre die Zeichenklasse genau der Fehler, den diese Datei
   sucht: sie sähe gleich aus und träfe etwas anderes. */
const QUELLE = path.join(W, 'js', 'kategorien.js');
const src = fs.readFileSync(QUELLE, 'utf8');

const mKlasse = src.match(/const SUCH_ZEICHEN = (\/[^\n]*\/g);/);
if (!mKlasse) { console.error('⛔ SUCH_ZEICHEN nicht gefunden — hat die Suche einen neuen Aufbau?'); process.exit(1); }
const mFn = src.match(/function suchFlach\(s\)\{[\s\S]*?\n\}/);
if (!mFn) { console.error('⛔ suchFlach() nicht gefunden.'); process.exit(1); }

const SUCH_ZEICHEN = eval(mKlasse[1]);
const suchFlach = eval('(' + mFn[0].replace(/^function suchFlach/, 'function') + ')');

console.log('=== 1. Was trifft die Zeichenklasse? ===\n');
console.log('  ' + mKlasse[1]);

/* ⛔ /g merkt sich lastIndex zwischen den Aufrufen — ohne das Zurücksetzen
   liefert dieselbe Prüfung beim zweiten Zeichen ein anderes Ergebnis.
   [[regexp_g_merkt_sich_lastindex]] */
const trifft = ch => { SUCH_ZEICHEN.lastIndex = 0; return SUCH_ZEICHEN.test(ch); };

const getroffen = [];
for (let cp = 0x0600; cp <= 0x08FF; cp++)
  if (trifft(String.fromCodePoint(cp))) getroffen.push(cp);

const spannen = [];
for (const cp of getroffen) {
  const l = spannen[spannen.length - 1];
  if (l && l[1] === cp - 1) l[1] = cp; else spannen.push([cp, cp]);
}
const hex = n => 'U+' + n.toString(16).toUpperCase().padStart(4, '0');
console.log('  ' + getroffen.length + ' Zeichen in ' + spannen.length + ' Spannen: '
  + spannen.map(([a, b]) => a === b ? hex(a) : hex(a) + '–' + hex(b)).join(', '));

/* ⛔⛔ Der Test, auf den alles ankommt. Verschluckt die Klasse einen
   Grundbuchstaben, findet die Suche nichts mehr — und zwar lautlos, weil
   Treffer und Nicht-Treffer beide leere Listen sind. */
const BUCHSTABEN = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي';
const verschluckt = [...BUCHSTABEN].filter(trifft);
sag(!verschluckt.length, verschluckt.length
  ? 'Die Klasse verschluckt Grundbuchstaben: ' + verschluckt.join(' ')
  : 'Kein Grundbuchstabe wird getroffen — nur Diakritika.');

/* Und die Gegenrichtung: die häufigsten Ḥarakāt MÜSSEN fallen. */
const HARAKAT = [['َ','Fatha'],['ُ','Damma'],['ِ','Kasra'],['ْ','Sukun'],
                 ['ّ','Schadda'],['ً','Fathatan'],['ٌ','Dammatan'],['ٍ','Kasratan'],
                 ['ٰ','Alif chandschariyya']];
const bleiben = HARAKAT.filter(([z]) => !trifft(z));
sag(!bleiben.length, bleiben.length
  ? 'Diese Ḥaraka bleibt stehen: ' + bleiben.map(x => x[1]).join(', ')
  : 'Alle neun häufigen Ḥarakāt fallen weg.');

/* ---------- 2. Eichfälle ---------- */
console.log('\n=== 2. Eichfälle (meine Erwartung) ===\n');
const FAELLE = [
  ['كِتَابٌ',   'كتاب',   'Vollform mit Ḥarakāt'],
  ['كتاب',     'كتاب',   'nackt getippt — muss dasselbe ergeben'],
  ['مَدْرَسَةٌ', 'مدرسه',  'ة wird zu ه'],
  ['ٱلْكِتَابُ', 'الكتاب', 'Wasla-Alif ٱ wird zu ا'],
  ['أَخٌ',      'اخ',     'Hamza-Alif أ wird zu ا'],
  ['إِلَى',     'الي',    'إ zu ا und ى zu ي'],
  ['كــتاب',   'كتاب',   'Taṭwīl ist reine Streckung'],
  ['فَتًى',     'فتي',    'Tanwīn-Fatḥa auf Alif maqṣūra'],
];
for (const [ein, erwartet, warum] of FAELLE) {
  const ist = suchFlach(ein);
  sag(ist === erwartet, ein + ' → ' + ist + (ist === erwartet ? '' : '   ERWARTET: ' + erwartet)
    + '   (' + warum + ')');
}

/* ---------- 3. ⭐ Der eigentliche Test: an den echten Vokabeln ---------- */
console.log('\n=== 3. Findet die Suche jedes Wort des Bestands? ===\n');

/* ⛔⛔ NICHT nur vocab-data.js. Beim ersten Lauf am 06.09.2026 stand hier
   genau das — und maß 171 Wörter, während die App über **4433** sucht:
   `sucheTreffer()` läuft über VOCAB_DATA, und das ist in der App der volle
   Buchbestand aus data/vokabeln-*.js, nicht die Lernliste.

   Ein Prüfer, der ein Zwanzigstel misst und „alles in Ordnung" meldet, ist
   schlimmer als keiner. [[werkzeug_misst_kleineren_bestand]]

   Die Buchdateien sind rechtlich gesperrt und liegen nur lokal — fehlen sie,
   wird das GESAGT und nicht stillschweigend weniger gemessen. */
const kiste = { window: {} };
kiste.globalThis = kiste;
vm.createContext(kiste);
const DATEN = path.join(W, 'data');
let geladen = [];
try {
  for (const f of fs.readdirSync(DATEN).filter(f => f.startsWith('vokabeln-') && f.endsWith('.js'))) {
    try { vm.runInContext(fs.readFileSync(path.join(DATEN, f), 'utf8'), kiste, { filename: f }); geladen.push(f); }
    catch (e) { console.log('  ! ' + f + ': ' + e.message.split('\n')[0]); }
  }
} catch (e) { console.log('  ⓘ data/ nicht lesbar: ' + e.message); }

/* ⛔ `VOKABELN` ist ein OBJEKT nach Büchern ({ 'madina-1': [...], … }), kein
   Array — ein Filter auf `Array.isArray` überspringt es lautlos und lässt
   4262 Wörter liegen. Beim ersten Versuch genau so passiert: neun Dateien
   geladen, 171 gezählt. Deshalb hier über die Werte, nicht über den Namen. */
const WOERTER = [];
const gesehen = new Set();
const nimm = liste => { for (const w of liste) if (w && w.ar && !gesehen.has(w.id ?? w.ar)) { gesehen.add(w.id ?? w.ar); WOERTER.push(w); } };
for (const wert of Object.values(kiste.window)) {
  if (Array.isArray(wert)) nimm(wert);
  else if (wert && typeof wert === 'object')
    for (const teil of Object.values(wert)) if (Array.isArray(teil)) nimm(teil);
}
/* Die Lernliste kommt dazu — sie enthält elf Wörter, die in keiner Buchdatei
   stehen (die Zahlwörter und أَخٌ / أُخْتٌ). [[volles_programm]] Weg 5 */
const lern = new Function(fs.readFileSync(path.join(W, 'vocab-data.js'), 'utf8')
  + "\nreturn typeof VOCAB_DATA !== 'undefined' ? VOCAB_DATA : [];").call({});
for (const w of lern) if (w && w.ar && !gesehen.has(w.id ?? w.ar)) { gesehen.add(w.id ?? w.ar); WOERTER.push(w); }

console.log('  Bestand: ' + WOERTER.length + ' Wörter aus ' + geladen.length
  + ' Buchdatei(en) + vocab-data.js');
if (WOERTER.length < 1000) {
  console.log('  ⓘ Das ist deutlich weniger als die ~4400 der App — liegen die');
  console.log('     gesperrten Buchdateien hier nicht, misst dieser Abschnitt zu klein.');
}

/* Dieselbe Bedingung wie sucheTreffer(): flach(Wort) enthält flach(Eingabe). */
const findet = (eingabe, w) => suchFlach(w.ar).includes(suchFlach(eingabe));

const nichtVoll = WOERTER.filter(w => !findet(w.ar, w));
sag(!nichtVoll.length, nichtVoll.length
  ? nichtVoll.length + ' Wörter finden sich NICHT, wenn man sie genau so eintippt: '
    + nichtVoll.slice(0, 5).map(w => w.ar).join(' · ')
  : 'Jedes Wort findet sich, voll vokalisiert eingetippt.');

/* ⭐ Der Fall, für den suchFlach überhaupt gebaut wurde: Elias tippt ohne
   Ḥarakāt. Die nackte Form entsteht hier NICHT durch Abtippen, sondern durch
   dieselbe Funktion — sonst prüfte man sie gegen sich selbst. Deshalb wird
   zusätzlich verlangt, dass die nackte Form KÜRZER ist: sonst hätte die
   Vollform gar keine Ḥarakāt und der Fall wäre keiner. */
const mitHarakat = WOERTER.filter(w => suchFlach(w.ar).length < w.ar.length);
const nichtNackt = mitHarakat.filter(w => !findet(suchFlach(w.ar), w));
console.log('  davon ' + mitHarakat.length + ' mit Ḥarakāt in der Schreibweise');
sag(!nichtNackt.length, nichtNackt.length
  ? nichtNackt.length + ' Wörter finden sich nicht ohne Ḥarakāt: '
    + nichtNackt.slice(0, 5).map(w => w.ar).join(' · ')
  : 'Jedes davon findet sich auch nackt getippt.');

/* ⭐ Und der DEUTSCHE Weg — bis zum 06.09.2026 fehlte er hier, obwohl Elias
   ihn genauso benutzt („такой wie arabic roots" hiess für ihn beides). Die
   Bedingung in sucheTreffer() lautet dort schlicht
   `(w.de||'').toLowerCase().includes(de)`, also ohne jede Normalisierung:
   ein Wort mit Grossbuchstaben oder Umlaut findet sich nur, weil beide
   Seiten kleingeschrieben werden. Genau das wird hier gemessen. */
const mitDe = WOERTER.filter(w => (w.de || '').trim().length > 1);
const findetDe = (eingabe, w) => (w.de || '').toLowerCase().includes(String(eingabe).trim().toLowerCase());
const nichtDe = mitDe.filter(w => !findetDe(w.de, w));
console.log('  ' + mitDe.length + ' Wörter mit deutscher Bedeutung');
sag(!nichtDe.length, nichtDe.length
  ? nichtDe.length + ' finden sich nicht über ihre eigene Bedeutung: '
    + nichtDe.slice(0, 5).map(w => w.de).join(' · ')
  : 'Jedes findet sich über seine eigene deutsche Bedeutung.');

/* ⛔ Die Suche verlangt mindestens ZWEI Zeichen (`roh.length < 2` → []).
   Eine Bedeutung, die nur ein Zeichen lang ist, waere über sich selbst nie
   auffindbar — hier wird gezählt, ob es solche gibt. */
const zuKurz = WOERTER.filter(w => (w.de || '').trim().length === 1);
sag(!zuKurz.length, zuKurz.length
  ? zuKurz.length + ' Bedeutung(en) sind einzeichig und damit unsuchbar: '
    + zuKurz.slice(0, 5).map(w => w.ar + '=' + w.de).join(' · ')
  : 'Keine Bedeutung ist so kurz, dass die Zwei-Zeichen-Schranke sie ausschliesst.');

/* ---------- 4. Störtest: kann diese Prüfung überhaupt scheitern? ---------- */
console.log('\n=== 4. Störtest ===\n');
/* Eine absichtlich zu breite Klasse — sie frisst auch die Buchstaben. Fällt
   die Prüfung damit NICHT durch, misst sie nichts. [[stoertest_muss_wirkung_nachweisen]] */
const zuBreit = s => String(s || '').replace(/[؀-ۿ]/g, '');
const stoerFaellt = FAELLE.some(([ein, erw]) => zuBreit(ein) !== erw);
sag(stoerFaellt, stoerFaellt
  ? 'Abschnitt 2 fällt mit einer zu breiten Zeichenklasse durch — er misst also.'
  : 'Abschnitt 2 besteht auch mit einer kaputten Klasse — er misst nichts.');

/* ⛔⛔ UND Abschnitt 3 eigens stören. Er ist der wertvollste — 4446 Wörter,
   alle „ok" — und genau deshalb der gefährlichste: eine Bedingung, die immer
   wahr ist, sieht dort aus wie ein makelloser Bestand.

   Gestört wird mit einer Suche, die zu VIEL wegwirft: fällt auch das ة, dann
   findet مَدْرَسَةٌ sich selbst noch (die Vollform verliert es ebenso), aber
   die NACKTE Eingabe eines Wortes, dessen Nachbar sich nur im ة
   unterscheidet, trifft plötzlich beide. Deshalb wird hier andersherum
   gestört: die Eingabe wird flach gemacht, das WORT aber nicht — genau das,
   was ein vergessenes suchFlach() auf der Wortseite anrichten würde.
   [[stoertest_muss_wirkung_nachweisen]] [[leere_liste_ist_keine_messung]] */
const findetKaputt = (eingabe, w) => String(w.ar).includes(suchFlach(eingabe));
const stoer3 = mitHarakat.filter(w => !findetKaputt(suchFlach(w.ar), w)).length;
sag(stoer3 > 0, stoer3 > 0
  ? 'Abschnitt 3 fällt ohne suchFlach() auf der Wortseite durch (' + stoer3
    + ' von ' + mitHarakat.length + ') — er misst also.'
  : 'Abschnitt 3 besteht auch ohne suchFlach() — die 4446 „ok" bedeuten nichts.');

console.log('');
if (fehler) { console.log('⛔ ' + fehler + ' Befund(e).'); process.exit(1); }
console.log('✅ Die Suche findet, was da ist — an ' + WOERTER.length
  + ' Wörtern gemessen, nicht an Beispielen.');
process.exit(0);
