/* Hält jede „## "-Überschrift der Vault-Notiz gegen die Commits, die im Block
 * darunter stehen. Punkt 15, gebaut am 18.08.2026 nach dem ersten Durchgang.
 *
 * ⛔ WARUM ES DAS GIBT. Am 13.08.2026 standen 39 Stellen in 12 Dateien auf
 *    einem Tag, den es noch nicht gab. Beim Audit am 18.08. kamen vier
 *    verschobene Überschriften dazu — und am selben Tag ist mir derselbe
 *    Fehler ein drittes Mal passiert: `node -e "new Date()"` meldete den
 *    15.08., ich habe zehn Stellen damit beschriftet, und erst eine zweite
 *    Quelle zeigte den 18.
 *
 *    Ein Datum meldet sich nie von selbst. Es sieht immer plausibel aus.
 *
 * ⛔ ZWEI FALLEN, an denen so ein Werkzeug wertlos wird:
 *
 *   1. Erwartungswerte im eigenen Quelltext führen. Dann meldet es dasselbe,
 *      egal was in der Notiz steht. Hier kommt ALLES von außen: die
 *      Überschriften aus der Datei, die Daten aus `git log`.
 *   2. „Kein Commit" mit „falsch" verwechseln. Der erste Commit des Repos ist
 *      vom 11.08.2026 22:11 — alles davor KANN keinen nennen. Solche Blöcke
 *      werden als „nicht prüfbar" gezählt, nicht als Fehler.
 *
 * Gegenprobe, mit der sich das Werkzeug widerlegen lässt: eine Überschrift in
 * der Notiz um einen Tag verstellen. Dann MUSS hier eine rote Zeile stehen.
 *
 * ⛔⛔ DIESE FASSUNG GEHOERT ZUM VOKABELTRAINER. Kopiert am 20.08.2026 aus
 *    dem Korantrainer — dort gab es das Werkzeug seit dem 18.08., hier
 *    nicht, und genau hier ist derselbe Fehler zum zehnten Mal passiert:
 *    vier Ueberschriften mit „22:5x" und „23:1x", waehrend die gemessene
 *    Uhr 22:33 zeigte. Eine Entscheidung ueber ein Werkzeug gilt fuer
 *    jedes Werkzeug derselben Bauart.
 *    [[entscheidung_gilt_fuer_das_zweite_werkzeug]]
 *
 *    ⛔ Der Korantrainer-Ordner wurde dabei NICHT veraendert (Regel 5).
 *
 * Aufruf:  node werkzeuge/pruefe-datumsangaben.mjs [--alle]
 *          --alle zeigt auch die Blöcke, die stimmen.
 */
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const NOTIZ = 'G:\\1. Workspace\\Obsidian\\Gedächtnis\\Elias Gedächtnis\\03 - Projekte\\Vokabeltrainer-Arabisch.md';
const ALLE = process.argv.includes('--alle');

let zeilen;
try { zeilen = readFileSync(NOTIZ, 'utf8').split(/\r?\n/); }
catch {
  /* ⛔ „Nicht da" hat ZWEI Ursachen, und nur eine ist harmlos. Fehlt der
     ganze Vault-Ordner, ist das ein fremder Rechner — der Normalfall. Ist der
     Ordner da und die Datei nicht, ist etwas kaputt, und ein stilles Exit 0
     verschweigt es. [[kennzeichen_mit_zwei_ursachen]] [[ausfall_ist_unsichtbar_gebaut]] */
  const ordner = NOTIZ.slice(0, NOTIZ.lastIndexOf(String.fromCharCode(92)));
  if (!existsSync(ordner)){
    console.log('⚠️  Vault-Ordner nicht da — fremder Rechner, übersprungen.');
    process.exit(0);
  }
  console.log('⛔ Der Vault-Ordner ist da, die Notiz aber nicht lesbar:');
  console.log('   ' + NOTIZ);
  console.log('   Das ist KEIN fremder Rechner — hier fehlt etwas.');
  process.exit(1);
}

/* Blöcke abgrenzen: von einer „## "-Überschrift bis zur nächsten. */
const bloecke = [];
zeilen.forEach((z, i) => { if (z.startsWith('## ')) bloecke.push({ zeile: i + 1, kopf: z, von: i }); });
bloecke.forEach((b, i) => { b.bis = i + 1 < bloecke.length ? bloecke[i + 1].von : zeilen.length; });

const cache = new Map();
/* ⏱ EINMAL statt hundertmal — nachgeruestet am 20.08.2026.

   Vorher startete diese Funktion fuer JEDEN Hash einen eigenen git-Prozess.
   Gemessen: 10.572 ms fuer einen Lauf, gegen 1.764 ms fuer validate.js und
   104 ms fuer vorrat.mjs. Bei 470 Commits im Repo und Hunderten Nennungen
   in der Notiz ist das der ganze Unterschied.

   Jetzt: ein einziger `git log`, daraus eine Karte kurzer Hash -> Datum.
   ⛔ Der Einzelaufruf bleibt als Rueckfall — die Notiz nennt vereinzelt
   VOLLE 40-Zeichen-Hashes, und die stehen in der Kurzform-Liste nicht. */
const alleCommits = new Map();
const vollHashes = new Map();
try {
  const roh = execFileSync('git',
    ['-C', REPO, 'log', '--format=%h %H %ad', '--date=format:%d.%m.%Y %H:%M'],
    { encoding: 'utf8', maxBuffer: 20e6 });
  for (const zeile of roh.split(/\r?\n/)){
    /* Drei Felder: kurzer Hash, voller Hash, Datum. */
    const t = zeile.split(' ');
    if (t.length < 3) continue;
    const datum = t.slice(2).join(' ').trim();
    alleCommits.set(t[0], datum);
    vollHashes.set(t[1], datum);
  }
} catch { /* kein Repo — dann greift der Rueckfall unten */ }

function commitTag(hash) {
  if (cache.has(hash)) return cache.get(hash);
  let d = null;
  /* Der Normalfall: ein 7-stelliger Hash steht so in der Karte. */
  if (alleCommits.has(hash)) d = alleCommits.get(hash);
  else {
    /* ⛔ Laengere Zeichenketten sind hier meist GAR KEINE Commits: die Notiz
       verlinkt Artefakte, und deren UUIDs fangen mit acht Hex-Zeichen an
       (`d9916aee`, `1e11a0ef`). Am 20.08.2026 gezaehlt: 63 von 425. Fuer
       jede lief ein git-Prozess ins Leere — zusammen rund zwei Sekunden.
       Ein Praefixvergleich gegen die vollen Hashes kostet nichts. */
    for (const [voll, datum] of vollHashes){
      if (voll.startsWith(hash)){ d = datum; break; }
    }
  }
  cache.set(hash, d);
  return d;
}

/* Der erste Commit ist die Grenze der Prüfbarkeit. ⛔ Nicht fest eintragen —
 * er verschiebt sich, wenn je der Verlauf umgeschrieben wird. */
let ersterCommit = null;
try {
  ersterCommit = execFileSync('git', ['-C', REPO, 'log', '--reverse', '--format=%ad', '--date=format:%d.%m.%Y %H:%M'],
    { encoding: 'utf8' }).split('\n')[0].trim();
} catch { /* kein Repo */ }

let stimmt = 0, weicht = 0, nichtPruefbar = 0, ohneDatum = 0;
const rot = [], erklaert = [];

/* ⛔⛔ AUCH DIE UHRZEIT, nicht nur der Tag — nachgerüstet am 20.08.2026.
 *
 * In der Nacht davor trugen **25 von 25** Blöcken erfundene Uhrzeiten: eine
 * lückenlose, plausible Kette von „00:00–01:00" bis „15:30–16:15", während die
 * ganze Arbeit zwischen 23:00 und 05:20 lief. Dieses Werkzeug war die ganze
 * Zeit grün — es schnitt die Uhrzeit mit `.slice(0, 10)` weg und sah nur den
 * Tag. Der Tag stimmte ja.
 *
 * ⭐ Die Lehre ist allgemeiner als die Uhrzeit: **ein Prüfwerkzeug kann nur
 *    fehlschlagen an dem, was es überhaupt ansieht.** „Grün" heißt nie „alles
 *    in Ordnung", sondern „das Geprüfte ist in Ordnung".
 *
 * Die Spanne unten ist großzügig, und das mit Absicht: ein Block darf vor
 * seinem ersten Commit begonnen und nach dem letzten geschrieben worden sein.
 * Gesucht sind keine Minuten, sondern die STUNDEN-Sprünge — der Fehler oben
 * lag elf Stunden daneben. */
const SPANNE_MIN = 90;

function minuten(hhmm) {
  const m = hhmm.match(/^(\d{2}):(\d{2})$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/* Abstand in Minuten, über Mitternacht hinweg gerechnet: 23:50 und 00:10
 * liegen 20 Minuten auseinander, nicht 1420. */
function abstand(a, b) {
  const d = Math.abs(a - b);
  return Math.min(d, 1440 - d);
}
let zeitStimmt = 0, zeitOhne = 0;
const zeitRot = [];

/* Ein Block darf sein Datum erklären, statt ihm zu widersprechen. Zwei Fälle
 * gibt es wirklich: ein KURZSTAND ist am Folgetag datiert („Stand von wann"),
 * und die Prüfnotiz selbst zitiert genau die Commits, die sie geprüft hat.
 * ⛔ Die Marke steht IM TEXT der Notiz, nicht hier — ein Werkzeug, das seine
 *    Ausnahmen im eigenen Quelltext führt, prüft am Ende sich selbst. */
const MARKE = /<!-- datum-geprueft: (\d{2}\.\d{2}\.\d{4}) -->/;

for (const b of bloecke) {
  const m = b.kopf.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (!m) { ohneDatum++; continue; }

  const text = zeilen.slice(b.von, b.bis).join('\n');
  /* ⛔ Nur Hashes in Backticks. Ohne sie trifft das Muster auch Farbwerte
   *    wie `#a75c53` und Wortteile in Umschriften. */
  const hashes = [...new Set([...text.matchAll(/`([0-9a-f]{7,40})`/g)].map((t) => t[1]))];
  const echte = hashes.map((h) => ({ h, d: commitTag(h) })).filter((x) => x.d);

  if (!echte.length) { nichtPruefbar++; continue; }

  const marke = text.match(MARKE);
  const tage = [...new Set(echte.map((x) => x.d.slice(0, 10)))];
  if (marke && !tage.includes(m[0])) {
    erklaert.push({ b, behauptet: m[0], seit: marke[1] });
    continue;
  }
  if (tage.includes(m[0])) {
    stimmt++;
    if (ALLE) console.log('  ✅ Z' + String(b.zeile).padStart(4) + '  ' + m[0] + '  ' + b.kopf.slice(3, 60));
    /* Stimmt der Tag, wird zusätzlich die Uhrzeit geprüft — aber nur gegen die
       Commits DIESES Tages. Ein Block, der einen älteren Commit zitiert, soll
       daran nicht scheitern. */
    /* ⛔⛔ ANGEPASST fuer den Vokabeltrainer. Im Korantrainer stand hier
       /\b(\d{2}:\d{2})\s*Uhr\b/ — das Wort „Uhr" kommt in DIESER Notiz in
       keiner einzigen Ueberschrift vor. Das Werkzeug waere gruen gewesen,
       ohne je eine Uhrzeit angesehen zu haben. Genau die Falle, die sein
       eigener Kommentar oben beschreibt: „ein Pruefwerkzeug kann nur
       fehlschlagen an dem, was es ueberhaupt ansieht".

       Drei Schreibweisen kommen hier wirklich vor:
         „## 20.08.2026, 22:1x — …"      Zehnerminute als Platzhalter
         „## 20.08.2026, ~22:25 — …"     ungefaehr
         „## 20.08.2026, 05:00–06:00 — …" Spanne (der ERSTE Wert zaehlt)
       ⛔ Das `x` wird zu `5` — die Mitte des Zehnerfensters. Sonst wuerde
       „22:1x" als 22:10 gelesen und laege systematisch fuenf Minuten
       frueher, als es gemeint war. */
    const uRoh = b.kopf.match(/(?:^|[\s,~(])(\d{2}:\d{2}|\d{2}:\d[x])(?=\s|[-–—,)]|$)/);
    const u = uRoh ? [uRoh[0], uRoh[1].replace(/x$/, '5')] : null;
    if (!u) { zeitOhne++; continue; }
    /* ⛔ Die Marke erklaert auch die UHRZEIT, nicht nur den Tag.
       Im Korantrainer wurde sie nur im Tag-Zweig geprueft. Hier gibt es
       Bloecke wie „Stand nach der Nachtschicht (29.07.2026, 13:35 —
       fortgeschrieben bis …)": der Tag stimmt, die Uhrzeit ist ein
       Fortschreibungszeitpunkt und liegt absichtlich Stunden nach den
       Commits. Ohne diese Zeile bleibt so ein Block dauerhaft rot — und ein
       Werkzeug, das dauerhaft dasselbe meldet, wird ueberlesen. */
    if (marke) { zeitOhne++; continue; }
    /* ⛔ Ein Block, in dem NICHTS committet wurde, nennt trotzdem Hashes —
       er verweist ja auf früher Gebautes. Seine Uhrzeit gegen einen fremden
       Commit zu halten, ist ein Fehlalarm: genau das meldete das Werkzeug in
       der ersten Fassung über seinen eigenen Entstehungsblock („07:06 Uhr,
       nächster Commit 133 min entfernt" — die 07:06 waren zweimal gemessen).
       ⭐ Die Ausnahme steht IM TEXT der Notiz, nicht hier. Ein Werkzeug, das
       seine Ausnahmen im eigenen Quelltext führt, prüft am Ende sich selbst —
       dieselbe Begründung wie bei der Marke `datum-geprueft` oben. */
    if (/\bKein Commit\b/i.test(text)) { zeitOhne++; continue; }
    const soll = minuten(u[1]);
    const commitZeiten = echte.filter((x) => x.d.slice(0, 10) === m[0])
                              .map((x) => minuten(x.d.slice(11, 16)))
                              .filter((x) => x !== null);
    if (soll === null || !commitZeiten.length) { zeitOhne++; continue; }
    const naechster = Math.min(...commitZeiten.map((c) => abstand(soll, c)));
    if (naechster <= SPANNE_MIN) zeitStimmt++;
    else zeitRot.push({ b, sagt: u[1], naechster, commits: echte.filter((x) => x.d.slice(0, 10) === m[0]) });
    continue;
  }
  weicht++;
  rot.push({ b, behauptet: m[0], echte, tage });
}

console.log('Vault-Notiz: ' + zeilen.length + ' Zeilen · ' + bloecke.length + ' Blöcke');
if (ersterCommit) console.log('Erster Commit im Repo: ' + ersterCommit + '  (alles davor ist nicht prüfbar)');
console.log('');
console.log('  mit Datum im Kopf:   ' + (stimmt + weicht + nichtPruefbar) + '   (ohne Datum: ' + ohneDatum + ')');
console.log('    ✅ stimmt:          ' + stimmt);
console.log('    ⬜ nicht prüfbar:   ' + nichtPruefbar + '   (kein Commit im Block genannt)');
console.log('    📌 erklärt:         ' + erklaert.length + '   (Marke im Text, siehe --alle)');
console.log('    ❌ weicht ab:       ' + weicht);

if (ALLE) for (const e of erklaert) {
  console.log('\n  📌 Z' + e.b.zeile + '  ' + e.b.kopf.slice(3, 66));
  console.log('     Kopf sagt ' + e.behauptet + ', Commits sagen anderes — erklärt am ' + e.seit);
}

for (const r of rot) {
  console.log('\n❌ Z' + r.b.zeile + '  ' + r.b.kopf.slice(3, 72));
  console.log('     Überschrift sagt: ' + r.behauptet);
  console.log('     Commits sagen:    ' + r.tage.join(', '));
  for (const e of r.echte) console.log('       · ' + e.h + '  ' + e.d);
}

console.log('');
console.log('  Uhrzeit im Kopf:     ' + (zeitStimmt + zeitRot.length)
  + '   (ohne Uhrzeit oder ohne Commit desselben Tages: ' + zeitOhne + ')');
console.log('    ✅ passt (±' + SPANNE_MIN + ' min): ' + zeitStimmt);
console.log('    ❌ weicht ab:       ' + zeitRot.length);

for (const z of zeitRot) {
  console.log('\n❌ Z' + z.b.zeile + '  ' + z.b.kopf.slice(3, 72));
  console.log('     Überschrift sagt: ' + z.sagt + ' Uhr');
  console.log('     nächster Commit:  ' + Math.round(z.naechster) + ' min entfernt');
  for (const e of z.commits) console.log('       · ' + e.h + '  ' + e.d);
}

/* ⛔⛔ ZWEITE PRUEFUNG: DIE REIHENFOLGE — nachgeruestet am 20.08.2026.

   Alles oben haengt an einem Commit. Von 211 datierten Bloecken nennen
   **84 keinen** — fuer die ist jede Uhrzeit ungeprueft.

   Diese Pruefung braucht keinen: die Notiz waechst durch Anhaengen, also
   muss die Uhrzeit innerhalb eines Tages aufsteigen.

   ⛔ WAS SIE NICHT KANN, im Stoertest gemessen: eine geschaetzte Zeit, die
   zufaellig SPAETER liegt als der Block davor, faellt nicht auf. Genau so
   ein Fall war der Anlass (23:27 statt 23:24, letzter Block der Datei) —
   und meine erste Begruendung behauptete faelschlich, sie faenge ihn ab.
   [[erfundene_begruendung_schliesst_den_fall]]

   ⭐ Was sie WIRKLICH gefunden hat: den Bruch „22:2x" vor „22:1x" am
   20.08.2026 — zwei geschaetzte Zeiten in der falschen Reihenfolge. Sechs
   Ueberschriften stehen seitdem auf ihren Commit-Zeiten.

   ⛔ ZWEI Einschraenkungen, beide gemessen und beide noetig:

     a) Bloecke mit einer ZEITSPANNE im Kopf („02:29-02:42") sind
        ausgenommen. Von 66 Bloecken mit Uhrzeit haben 25 eine Spanne, und
        ALLE VIER verbliebenen Rueckwaertssprünge betreffen sie — es sind
        nachtraeglich eingefuegte Verlaufsbloecke, kein Fehler. Ohne sie:
        null Fehlalarme.

     b) Ein Rueckwaertssprung von mehr als zwoelf Stunden ist ein
        Tageswechsel (Nachtschicht) und kein Fehler.
   [[kandidatenliste_ist_keine_fehlerliste]] [[uhrzeit_messen_nicht_schaetzen]] */
const zeitBloecke = [];
for (const b of bloecke){
  const d = b.kopf.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  const u = b.kopf.match(/(?:^|[\s,~(])(\d{2}:\d{2}|\d{2}:\d[x])(?=\s|[-–—,)]|$)/);
  if (!d || !u) continue;
  /* Zwei Uhrzeiten im Kopf = Spanne. */
  const spanne = (b.kopf.match(/\d{2}:\d[0-9x]/g) || []).length > 1;
  zeitBloecke.push({ b, tag: d[0], zeit: u[1].replace(/x$/, '5'), spanne });
}
const jeTag = new Map();
for (const x of zeitBloecke){
  if (!jeTag.has(x.tag)) jeTag.set(x.tag, []);
  jeTag.get(x.tag).push(x);
}
const rueckwaerts = [];
for (const [, xs] of jeTag){
  for (let i = 1; i < xs.length; i++){
    if (xs[i].spanne || xs[i - 1].spanne) continue;
    const d = minuten(xs[i].zeit) - minuten(xs[i - 1].zeit);
    if (d < 0 && d > -12 * 60) rueckwaerts.push({ vor: xs[i - 1], jetzt: xs[i] });
  }
}
console.log('');
console.log('  Reihenfolge:         ' + zeitBloecke.filter(x => !x.spanne).length
  + ' Bloecke ohne Zeitspanne   (mit Spanne, ausgenommen: ' + zeitBloecke.filter(x => x.spanne).length + ')');
console.log('    ' + (rueckwaerts.length ? '❌' : '✅') + ' rueckwaerts:      ' + rueckwaerts.length);
for (const r of rueckwaerts){
  console.log('\n❌ Z' + r.jetzt.b.zeile + '  ' + r.jetzt.b.kopf.slice(3, 72));
  console.log('     sagt ' + r.jetzt.zeit + ', der Block davor (Z' + r.vor.b.zeile + ') sagt ' + r.vor.zeit + '.');
  console.log('     Die Notiz waechst durch Anhaengen — eine spaetere Zeile mit frueherer');
  console.log('     Uhrzeit ist entweder nachgetragen oder geschaetzt. ⛔ Nicht raten:');
  console.log('     git log --format=\'%h %cd %s\' --date=format:\'%H:%M\'');
}

/* ⛔ Bis zum 21.08.2026 stand hier `if (!weicht)` — die gruene Zeile sprach
   also nur ueber EINE der drei Pruefungen, stand aber ganz unten und las
   sich als Gesamturteil. An dem Tag lieferte das Skript "✅ Keine
   Ueberschrift widerspricht ihren Commits." UND Exitcode 1: ein
   rueckwaerts laufender Block war gefunden, aber unten nicht mehr erwaehnt.
   Wer die Ausgabe liest, sah gruen; wer den Exitcode prueft, sah rot.
   [[widerspruch_liegt_in_der_beschriftung]] [[erfolgsmeldung_ohne_wirkung]] */
const alleSauber = !weicht && !zeitRot.length && !rueckwaerts.length;
if (alleSauber) console.log('\n✅ Alle drei Pruefungen sauber: Datum, Uhrzeit, Reihenfolge.');
else if (!weicht) console.log('\n✅ Kein Datum widerspricht seinen Commits'
  + (rueckwaerts.length || zeitRot.length ? ' — aber siehe unten.' : '.'));
else console.log('\n⚠️  ' + weicht + ' Überschrift(en) prüfen — und NICHT blind umschreiben:'
  + '\n   Ein Kurzstand darf am Folgetag datiert sein („Stand von wann"), ein'
  + '\n   Verlaufsblock nicht („wann passierte es"). Erst den Block lesen.');
if (zeitRot.length) console.log('⚠️  ' + zeitRot.length + ' Uhrzeit(en) prüfen — dasselbe gilt hier:'
  + '\n   erst den Block lesen, dann die Zahl korrigieren. Die Commit-Zeit ist'
  + '\n   die bessere Quelle als jede Erinnerung.');
/* ⛔ Dieser Hinweis fehlte bis zum 21.08.2026 als einziger von dreien —
   und ausgerechnet er war der, der an dem Tag zuschlug. */
if (rueckwaerts.length) console.log('⚠️  ' + rueckwaerts.length + ' Block/Bloecke laufen zeitlich RUECKWAERTS.'
  + '\n   Eine spaetere Zeile mit frueherer Uhrzeit ist nachgetragen oder'
  + '\n   geschaetzt. Die Fundstellen stehen oben, mit Zeilennummer.');

process.exit(weicht || zeitRot.length || rueckwaerts.length ? 1 : 0);
