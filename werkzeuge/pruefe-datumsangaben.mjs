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
import { readFileSync, existsSync, statSync } from 'node:fs';
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
/* ⭐ Ein Block INNERHALB eines `<details>` ist ein archivierter Vorgaenger
   (08.09.2026). Der Kurzstand oben wird ueberschrieben, der alte wandert
   eingeklappt darunter — er steht dort absichtlich unter seinem Nachfolger und
   laeuft deshalb zwangslaeufig "rueckwaerts". Ohne diese Unterscheidung meldet
   der Pruefer bei JEDEM neuen Kurzstand einen Fehlalarm, und ein Pruefer, der
   regelmaessig grundlos rot ist, wird ab dem dritten Mal ignoriert.

   ⛔ Die Regel wird dadurch nicht gelockert: ausgenommen ist ausschliesslich,
   was zwischen `<details>` und `</details>` steht. Ein Verlaufsblock im
   offenen Text wird weiterhin gemeldet. */
const bloecke = [];
let tiefe = 0;
zeilen.forEach((z, i) => {
  const auf = (z.match(/<details/g) || []).length;
  const zu  = (z.match(/<\/details>/g) || []).length;
  if (z.startsWith('## ')) bloecke.push({ zeile: i + 1, kopf: z, von: i, imArchiv: tiefe > 0 });
  tiefe = Math.max(0, tiefe + auf - zu);
});
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

/* ---------- Haengengebliebene Hashes (09.09.2026) ----------

   ⛔⛔ Am 08.09.2026 wurden „zwei Belegdateien und vier Langenscheidt-Seiten
   aus allen Commits entfernt". Eine Umschreibung der Historie **vergibt neue
   Hashes**. Die alten Commits existieren als Objekt weiter — `git cat-file -e`
   findet sie —, stehen aber nicht mehr im `git log`.

   Gemessen am 09.09.: von 651 Hashes in der Notiz sind 482 erreichbar,
   **31 nur noch als Objekt**, 138 gar keine Commits.

   ⭐ Ohne diese Unterscheidung meldet der Pruefer sie als ABWEICHUNG — also
   als Fehler in der Notiz, obwohl die Ueberschrift stimmt und nur der Beleg
   entwertet ist. Genau daran ist am 09.09. eine Diagnose zwei Stunden lang
   vorbeigelaufen: gesucht wurde in der Notiz, gelegen hat es an der Historie.
   [[zahlen_ohne_beleg]] [[kennzeichen_mit_zwei_ursachen]]

   ⚠️ `git cat-file -e` allein beantwortet die Frage NICHT — es findet auch
   Objekte, die kein Zweig mehr erreicht. Gefragt werden muss, ob der Hash im
   `git log` steht; das tut `commitTag()` bereits. Hier geht es nur darum, die
   beiden Faelle im BERICHT auseinanderzuhalten. */
const haengendCache = new Map();
function haengenGeblieben(hash) {
  if (haengendCache.has(hash)) return haengendCache.get(hash);
  let ja = false;
  try {
    execFileSync('git', ['-C', REPO, 'cat-file', '-e', hash + '^{commit}'], { stdio: 'ignore' });
    ja = true;                              /* Objekt da, aber nicht im log */
  } catch { ja = false; }                   /* gar kein Commit */
  haengendCache.set(hash, ja);
  return ja;
}

/* Der erste Commit ist die Grenze der Prüfbarkeit. ⛔ Nicht fest eintragen —
 * er verschiebt sich, wenn je der Verlauf umgeschrieben wird. */
let ersterCommit = null;
try {
  ersterCommit = execFileSync('git', ['-C', REPO, 'log', '--reverse', '--format=%ad', '--date=format:%d.%m.%Y %H:%M'],
    { encoding: 'utf8' }).split('\n')[0].trim();
} catch { /* kein Repo */ }

let stimmt = 0, weicht = 0, nichtPruefbar = 0, ohneDatum = 0;
const rot = [], erklaert = [], entwertet = [];

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

  /* ⛔ Steht der Hash aus der UEBERSCHRIFT nicht mehr im `git log`, ist die
     Ueberschrift nicht falsch — ihr Beleg ist entwertet. Das gehoert unter
     „nicht pruefbar", nicht unter „weicht ab". Sonst sucht man den Fehler in
     der Notiz, und er liegt in der Historie. */
  const kopfHash = (b.kopf.match(/`([0-9a-f]{7,40})`/) || [])[1];
  if (kopfHash && !commitTag(kopfHash) && haengenGeblieben(kopfHash)) {
    entwertet.push({ b, hash: kopfHash, behauptet: m[0] });
    nichtPruefbar++;
    continue;
  }

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
  /* ⛔ LETZTE FRAGE VOR DEM ROT (09.09.2026): Traegt einer der Hashes, die es
     im `git log` NICHT mehr gibt, genau das behauptete Datum? Dann ist die
     Ueberschrift richtig und nur ihr Beleg entwertet.

     Der Fall, an dem das auffiel: Der Block vom 07.09.2026 nennt acht
     Commits, ALLE vom 07.09. und ALLE bei der Umschreibung vom 08.09. ersetzt.
     Erreichbar blieb allein `20dbc82` (11.08.) — eine historische Erwaehnung
     im Fliesstext. Der Pruefer verglich also die Ueberschrift mit dem einzigen
     Hash, der nichts mit ihr zu tun hat. [[historisch_oder_aktuell_steht_im_wort_davor]] */
  const verloren = hashes.filter((h) => !commitTag(h) && haengenGeblieben(h));
  const verloreneTage = [];
  for (const h of verloren) {
    let d = null;
    try {
      d = execFileSync('git', ['-C', REPO, 'log', '-1', '--format=%ad', '--date=format:%d.%m.%Y', h],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch { /* nicht lesbar — dann eben nicht */ }
    if (d) verloreneTage.push({ h, d });
  }
  if (verloreneTage.some((x) => x.d === m[0])) {
    entwertet.push({ b, hash: verloreneTage.find((x) => x.d === m[0]).h, behauptet: m[0] });
    nichtPruefbar++;
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
console.log('    ⬜ nicht prüfbar:   ' + nichtPruefbar + '   (kein Commit im Block genannt'
  + (entwertet.length ? ', davon ' + entwertet.length + ' mit entwertetem Beleg' : '') + ')');
if (entwertet.length){
  console.log('');
  console.log('  ⚠️ ' + entwertet.length + ' Block/Bloecke nennen im Kopf einen Commit, den es im');
  console.log('     `git log` NICHT mehr gibt — er wurde bei einer Umschreibung der');
  console.log('     Historie ersetzt (08.09.2026: Belegdateien aus allen Commits entfernt).');
  console.log('     ⛔ Die Ueberschrift ist deshalb nicht falsch, nur ihr Beleg ist weg.');
  for (const e of entwertet)
    console.log('       Z' + e.b.zeile + '  ' + e.behauptet + '  `' + e.hash + '`  ' + e.b.kopf.slice(3, 58));
  console.log('     ⚠️ Die Hashes NICHT durch die neuen ersetzen: ein Verlaufseintrag sagt,');
  console.log('        welchen Hash ein Commit DAMALS trug. [[zahlen_ohne_beleg]]');
}
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

   Diese Pruefung braucht keinen: innerhalb eines Tages muss die Uhrzeit der
   Wuchsrichtung der Notiz folgen. ⛔ Und die Richtung wird GEMESSEN, seit sie
   sich am 25./26.08.2026 in derselben Datei geaendert hat — siehe den Block
   dazu weiter unten.

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
/* ⛔⛔ DIE RICHTUNG WIRD GEMESSEN, NICHT ANGENOMMEN (26.08.2026).

   Bis heute stand hier die Annahme »die Notiz waechst durch Anhaengen, also
   muss die Uhrzeit innerhalb eines Tages aufsteigen«. Am 20.08. stimmte das
   und ergab null Fehlalarme. Seitdem sind mehrere Bloecke OBEN eingefuegt
   worden statt unten angehaengt — und der Pruefer meldete daraufhin drei
   Bloecke als »rueckwaerts«, die in einer neueste-oben-Notiz voellig richtig
   stehen. Eine Annahme, die einmal gestimmt hat, ist keine Messung.
   [[eingefrorenes_feld_ist_kein_zustand]]

   Deshalb wird die Richtung jetzt aus der Datei selbst bestimmt: an allen
   Nachbarpaaren, deren DATUM sich unterscheidet (dort ist die Richtung
   eindeutig, ohne Uhrzeit). Die Mehrheit gibt die Richtung vor; die
   Minderheit ist der eigentliche Befund, denn sie zeigt, wo jemand gegen
   die Wuchsrichtung geschrieben hat. */
const richtungPaare = [];
for (let i = 1; i < bloecke.length; i++){
  const a = (bloecke[i - 1].kopf.match(/(\d{2})\.(\d{2})\.(\d{4})/) || []);
  const b = (bloecke[i].kopf.match(/(\d{2})\.(\d{2})\.(\d{4})/) || []);
  if (!a[0] || !b[0]) continue;
  const sa = a[3] + a[2] + a[1], sb = b[3] + b[2] + b[1];
  if (sa === sb) continue;
  richtungPaare.push({ i, auf: sb > sa });
}
const anzAuf = richtungPaare.filter(p => p.auf).length;
const anzAb  = richtungPaare.length - anzAuf;
const AUFSTEIGEND = anzAuf >= anzAb;          // true = aelteste oben, angehaengt
console.log('');
console.log('  Wuchsrichtung:       ' + (AUFSTEIGEND ? 'ANGEHAENGT (neueste unten)' : 'VORANGESTELLT (neueste oben)')
  + '  — ' + Math.max(anzAuf, anzAb) + ' von ' + richtungPaare.length + ' Tageswechseln');
if (Math.min(anzAuf, anzAb) > 0){
  console.log('    ⚠️ gegen die Richtung: ' + Math.min(anzAuf, anzAb) + ' Stelle(n)');
  console.log('       Dort ist jemand von der Wuchsrichtung abgewichen. Das ist kein');
  console.log('       Datumsfehler, aber es macht die Notiz an dieser Stelle unlesbar:');
  console.log('       wer von oben liest, springt in der Zeit.');
  for (const p of richtungPaare.filter(p => p.auf !== AUFSTEIGEND).slice(0, 8))
    console.log('       Z' + bloecke[p.i].zeile + '  ' + bloecke[p.i].kopf.slice(3, 70));
}

const zeitBloecke = [];
for (const b of bloecke){
  const d = b.kopf.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  const u = b.kopf.match(/(?:^|[\s,~(])(\d{2}:\d{2}|\d{2}:\d[x])(?=\s|[-–—,)]|$)/);
  if (!d || !u) continue;
  /* Zwei Uhrzeiten im Kopf = Spanne. */
  const spanne = (b.kopf.match(/\d{2}:\d[0-9x]/g) || []).length > 1;
  /* ⛔⛔ EIN KURZSTAND IST KEIN VERLAUFSBLOCK (09.09.2026).

     Ein Block, der mit „Stand" beginnt, ist eine Momentaufnahme — und die
     steht in dieser Notiz absichtlich OBEN, neueste zuerst. Der Pruefer
     verglich sie bisher gegen die gemessene Wuchsrichtung des Rests
     (angehaengt, neueste unten) und meldete dadurch jeden Kurzstand als
     „laeuft rueckwaerts". Am 09.09. waren das zehn von elf Befunden — alle
     falsch, alle vom selben Typ.

     ⭐ Der Unterschied steht schon weiter oben in dieser Datei: „Ein
     Kurzstand darf am Folgetag datiert sein („Stand von wann"), ein
     Verlaufsblock nicht." Dieselbe Unterscheidung gilt fuer die Reihenfolge.

     ⚠️ Das entschuldigt NICHT, neun Kurzstaende an einem Abend uebereinander
     zu stapeln — ein Kurzstand ist EINER und wird ueberschrieben. Dafuer ist
     dieser Pruefer aber nicht zustaendig. [[kurzstand_veraltet_beim_anhaengen]] */
  const kurzstand = /^##+\s*(⛔+\s*)?Stand\b/.test(b.kopf);
  zeitBloecke.push({ b, tag: d[0], zeit: u[1].replace(/x$/, '5'), spanne, kurzstand, imArchiv: b.imArchiv });
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
    /* Archivierte Vorgaenger stehen absichtlich unter ihrem Nachfolger. */
    if (xs[i].imArchiv || xs[i - 1].imArchiv) continue;
    /* Kurzstaende stehen absichtlich neueste-zuerst — siehe oben. */
    if (xs[i].kurzstand || xs[i - 1].kurzstand) continue;
    /* Gegen die GEMESSENE Wuchsrichtung, nicht gegen eine angenommene. */
    const roh2 = minuten(xs[i].zeit) - minuten(xs[i - 1].zeit);
    const d = AUFSTEIGEND ? roh2 : -roh2;
    if (d < 0 && d > -12 * 60) rueckwaerts.push({ vor: xs[i - 1], jetzt: xs[i] });
  }
}
/* ---- Die Unterabschnitte einer Nacht (08.09.2026) -------------------------

   ⛔ Bis heute sah dieser Pruefer nur `## `-Bloecke. Ein Verlaufsabschnitt
   INNERHALB einer Nacht ist aber eine `### `-Zeile, und genau dort standen am
   08.09.2026 zwei Abschnitte verkehrt herum: „### 02:40 — sechs rote Pruefer"
   vor „### 02:39 — K3 durchgerechnet". Beide Zeiten waren geschaetzt, die
   Commits sagten 02:34 und 02:40. Der Pruefer schwieg.

   ⚠️ Gezaehlt werden NUR `### `-Zeilen MIT Uhrzeit, und nur gegeneinander
   innerhalb desselben `## `-Blocks. Ueberschriften ohne Uhrzeit sind
   Gliederung, keine Chronologie — sie mitzunehmen ergaebe lauter Fehlalarme.
   [[kandidatenliste_ist_keine_fehlerliste]]

   ⚠️ Und dieselbe Archiv-Ausnahme wie oben: was in einem `<details>` steht,
   ist ein archivierter Vorgaenger. */
/* ---- Die BELEGTE Ausnahme (09.09.2026) -----------------------------------

   ⛔ Ein Pruefer, der dauerhaft rot steht, wird nicht mehr gelesen. Genau eine
   Stelle stand seit dem 08.09.2026 dauerhaft in der Liste: „### ⛔⛔ 03:45 —
   der teuerste Fund der Nacht". Sie wurde nachgesehen, und die Uhrzeit ist
   RICHTIG — die Auto-Gedaechtnisdatei traegt den Stempel 2026-09-07T02:04:57Z.
   Rueckwaerts laeuft nicht die Uhr, sondern der Abschnitt: seine
   Unterabschnitte stehen in der Reihenfolge der ERZAEHLUNG.

   ⚠️ Eine Ausnahme, die man nur behaupten muss, waere ein Schalter zum
   Ausschalten des Pruefers. Deshalb zwei Bedingungen, die BEIDE erfuellt sein
   muessen, und beide stehen im Text selbst:

     1. der Satz „geprueft, nicht geschaetzt" (auch mit ü) im Abschnitt
     2. ein BELEG im selben Abschnitt — ein ISO-Stempel, ein Datum oder ein
        Commit-Kuerzel. Ohne Beleg bleibt der Befund stehen.

   ⚠️ Die Ausnahme gilt NUR fuer die Reihenfolge, nie fuer „liegt in der
   Zukunft" — eine Uhrzeit, die noch nicht war, kann niemand belegt haben.
   [[regel_gilt_nur_mit_begruendung]] [[zusicherung_im_kommentar_ist_keine_pruefung]] */
const SATZ  = /gepr[üu]ft,\s*nicht\s*gesch[äa]tzt/i;
const BELEG = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}|\d{2}\.\d{2}\.\d{4}|\b[0-9a-f]{7}\b/;
function belegteAusnahme(zeilen, ab){
  let text = '';
  for (let i = ab + 1; i < zeilen.length && !/^#{1,3} /.test(zeilen[i]); i++) text += zeilen[i] + '\n';
  return SATZ.test(text) && BELEG.test(text);
}

const unterBloecke = [];
let unterArchiv = 0;
const unterBelegt = [];
{
  let tiefe = 0, imArchiv = false, blockStart = 0;
  zeilen.forEach((z, i) => {
    const auf = (z.match(/<details/g) || []).length;
    const zu  = (z.match(/<\/details>/g) || []).length;
    imArchiv = tiefe > 0;
    if (z.startsWith('## ')) blockStart = i;
    else if (z.startsWith('### ') && !imArchiv){
      const u = z.match(/(?:^|[\s,~(])(\d{2}:\d{2})(?=\s|[-–—,)]|$)/);
      /* ⛔ „Davor:" kennzeichnet einen ARCHIVIERTEN Vorgaenger — eine Reihe
         aelterer Staende, absichtlich absteigend sortiert. Ohne diese Ausnahme
         meldete der Pruefer beim ersten Lauf FUENF Fehlalarme aus einer
         einzigen solchen Reihe (10.08.2026: 06:44 → 05:56 → 05:15 → 05:10 →
         04:15). Dieselbe Sache wie der eingeklappte Kurzstand, nur ohne
         <details>. [[kandidatenliste_ist_keine_fehlerliste]] */
      const archivMarke = /^###\s*(?:[^\p{L}\d]*\s*)?Davor\s*:/u.test(z);
      if (u && archivMarke) unterArchiv++;
      else if (u) unterBloecke.push({ zeile: i + 1, kopf: z, block: blockStart, zeit: u[1],
                                      belegt: belegteAusnahme(zeilen, i) });
    }
    tiefe = Math.max(0, tiefe + auf - zu);
  });
}
const unterRueckwaerts = [];
for (let i = 1; i < unterBloecke.length; i++){
  const a = unterBloecke[i - 1], b = unterBloecke[i];
  if (a.block !== b.block) continue;
  if (minuten(b.zeit) - minuten(a.zeit) >= 0) continue;
  /* ⚠️ Ausgenommen wird EINZELN und mit Namen — eine stille Ausnahme waere
     dasselbe wie ein abgeschalteter Pruefer. */
  if (b.belegt){ unterBelegt.push(b); continue; }
  unterRueckwaerts.push({ vor: a, jetzt: b });
}
/* ---- Eine Uhrzeit, die noch gar nicht da war (08.09.2026) -----------------

   ⛔ Der Rueckwaerts-Test faengt nur VERTAUSCHTE Abschnitte. Steigen alle
   Zeiten sauber an, schweigt er — auch dann, wenn sie insgesamt erfunden sind.

   Genau das passierte in derselben Nacht, in der die ###-Pruefung entstand.
   Zwei Stunden nachdem sie gebaut war (gegen geschaetzte Uhrzeiten!), schrieb
   ich zwei Abschnitte mit „03:35" und „03:40" — in richtiger Reihenfolge.
   Gemessen: der letzte Commit lag um 03:09, die Datei war um 03:07 zuletzt
   geschrieben. Beide Zeiten waren um rund eine halbe Stunde zu spaet, und der
   frische Pruefer sah nichts.
   [[uhrzeit_messen_nicht_schaetzen]] · [[zweiter_fix_deckt_ersten_zu]]

   ⭐ Eine Zeit, die noch nicht eingetreten ist, kann niemand aufgeschrieben
   haben. Das braucht keine Commits und keine Heuristik — nur die Uhr.

   ⚠️ Nur Bloecke, deren Datum HEUTE ist. Ein Abschnitt „01:55" im Block vom
   Vortag ist keine Zukunft, sondern eine Nachtschicht ueber Mitternacht.
   ⚠️ Zwei Minuten Toleranz, benannt statt still: wer „03:21" schreibt, waehrend
   die Uhr 03:20:50 zeigt, hat aufgerundet und nicht erfunden. */
const jetzt = new Date();
const HEUTE_DE = String(jetzt.getDate()).padStart(2, '0') + '.'
  + String(jetzt.getMonth() + 1).padStart(2, '0') + '.' + jetzt.getFullYear();
const JETZT_MIN = jetzt.getHours() * 60 + jetzt.getMinutes();
const JETZT_HHMM = String(jetzt.getHours()).padStart(2, '0') + ':'
  + String(jetzt.getMinutes()).padStart(2, '0');
const TOLERANZ_MIN = 2;
const zuSpaet = (hhmm) => minuten(hhmm) > JETZT_MIN + TOLERANZ_MIN;
const datumDerZeile = (i) => ((zeilen[i] || '').match(/(\d{2}\.\d{2}\.\d{4})/) || [])[1] || null;
const zukunft = [];
for (const b of unterBloecke){
  if (datumDerZeile(b.block) !== HEUTE_DE) continue;
  if (zuSpaet(b.zeit)) zukunft.push(b);
}
/* Die `## `-Bloecke selbst tragen oft ebenfalls eine Uhrzeit ("NACHTPLAN
   08.09.2026, 01:55") — dieselbe Pruefung, dieselbe Begruendung. */
zeilen.forEach((z, i) => {
  if (!z.startsWith('## ') || datumDerZeile(i) !== HEUTE_DE) return;
  const u = z.match(/(?:^|[\s,~(])(\d{2}:\d{2})(?=\s|[-–—,)]|$)/);
  if (u && zuSpaet(u[1])) zukunft.push({ zeile: i + 1, kopf: z, zeit: u[1] });
});
/* ⛔ Der Stoertest. Ohne ihn beweist eine leere Liste nur, dass die Schleife
   gelaufen ist. Beide Richtungen, denn eine Pruefung, die ALLES meldet, ist
   genauso blind wie eine, die nichts meldet.
   [[stoertest_muss_wirkung_nachweisen]] */
const hhmm = (min) => String(Math.floor((min % 1440) / 60)).padStart(2, '0') + ':'
  + String(min % 60).padStart(2, '0');
const stoerOk = (JETZT_MIN + 90 < 1440) ? zuSpaet(hhmm(JETZT_MIN + 90)) : true;
const eichOk  = (JETZT_MIN - 90 >= 0)   ? !zuSpaet(hhmm(JETZT_MIN - 90)) : true;

/* Stoertest fuer die belegte Ausnahme: sie darf NUR greifen, wenn Satz UND
   Beleg dastehen. Sonst waere sie ein Schalter zum Ausschalten des Pruefers. */
const ausnahmeOk = (() => {
  const bau = (koerper) => ['### 03:45 — Beispiel'].concat(koerper.split('\n')).concat(['## Ende']);
  const mit   = belegteAusnahme(bau('ℹ️ Die 03:45 ist geprüft, nicht geschätzt (2026-09-07T02:04).'), 0);
  const ohne  = belegteAusnahme(bau('ℹ️ Die 03:45 ist geprüft, nicht geschätzt.'), 0);
  const nurB  = belegteAusnahme(bau('Nachgesehen am 2026-09-07T02:04, sah gut aus.'), 0);
  const leer  = belegteAusnahme(bau('Nichts dazu.'), 0);
  return mit === true && ohne === false && nurB === false && leer === false;
})();
console.log('');
console.log('  Unterabschnitte:     ' + unterBloecke.length + ' \'###\'-Zeilen mit Uhrzeit');
if (unterArchiv) console.log('    ⓘ mit „Davor:" gekennzeichnet (archiviert), ausgenommen: ' + unterArchiv);
for (const b of unterBelegt)
  console.log('    ⓘ Z' + b.zeile + ' ausgenommen: „geprueft, nicht geschaetzt" MIT Beleg — '
    + b.kopf.slice(4, 58));
console.log('    ' + (unterRueckwaerts.length ? '❌' : '✅') + ' rueckwaerts:      ' + unterRueckwaerts.length);
console.log('    ' + (zukunft.length ? '❌' : '✅') + ' in der Zukunft:   ' + zukunft.length
  + '   (heutige Abschnitte gegen die Uhr, jetzt ' + JETZT_HHMM + ')');
if (!stoerOk || !eichOk) console.log('    ⛔ STOERTEST: die Zukunftspruefung misst nichts —'
  + (stoerOk ? '' : ' +90 min gilt als Vergangenheit;')
  + (eichOk ? '' : ' -90 min gilt als Zukunft.'));
console.log('    ' + (ausnahmeOk ? '✅' : '⛔') + ' Stoertest: die belegte Ausnahme greift nur mit '
  + 'Satz UND Beleg' + (ausnahmeOk ? '' : ' — sie greift zu leicht, jeder Befund waere abschaltbar'));
for (const z of zukunft.slice(0, 8)){
  console.log('\n❌ Z' + z.zeile + '  ' + z.kopf.slice(0, 72));
  console.log('     sagt ' + z.zeit + ', die Uhr sagt ' + JETZT_HHMM + ' — diese Zeit war noch nicht.');
  console.log('     ⛔ Nicht raten, MESSEN: node -e "new Date().toLocaleString(\'de-DE\')"');
}
for (const r of unterRueckwaerts.slice(0, 8)){
  console.log('\n❌ Z' + r.jetzt.zeile + '  ' + r.jetzt.kopf.slice(4, 72));
  console.log('     sagt ' + r.jetzt.zeit + ', der Abschnitt davor (Z' + r.vor.zeile + ') sagt ' + r.vor.zeit + '.');
  console.log('     ⛔ Nicht raten: git log --format=\'%h %cd %s\' --date=format:\'%H:%M\'');
}

console.log('');
const imArchiv = zeitBloecke.filter(x => x.imArchiv).length;
console.log('  Reihenfolge:         ' + zeitBloecke.filter(x => !x.spanne && !x.imArchiv).length
  + ' Bloecke ohne Zeitspanne   (mit Spanne, ausgenommen: ' + zeitBloecke.filter(x => x.spanne).length + ')');
if (imArchiv) console.log('    ⓘ eingeklappt (archivierter Kurzstand), ausgenommen: ' + imArchiv);
console.log('    ' + (rueckwaerts.length ? '❌' : '✅') + ' rueckwaerts:      ' + rueckwaerts.length);
for (const r of rueckwaerts){
  console.log('\n❌ Z' + r.jetzt.b.zeile + '  ' + r.jetzt.b.kopf.slice(3, 72));
  console.log('     sagt ' + r.jetzt.zeit + ', der Block davor (Z' + r.vor.b.zeile + ') sagt ' + r.vor.zeit + '.');
  console.log('     Die Notiz waechst ' + (AUFSTEIGEND ? 'durch ANHAENGEN' : 'durch VORANSTELLEN')
    + ' — die Uhrzeit muss innerhalb eines Tages also');
  console.log('     ' + (AUFSTEIGEND ? 'aufsteigen' : 'absteigen') + '. Eine Abweichung ist nachgetragen oder geschaetzt. ⛔ Nicht raten:');
  console.log('     git log --format=\'%h %cd %s\' --date=format:\'%H:%M\'');
}

/* ⛔ Bis zum 21.08.2026 stand hier `if (!weicht)` — die gruene Zeile sprach
   also nur ueber EINE der drei Pruefungen, stand aber ganz unten und las
   sich als Gesamturteil. An dem Tag lieferte das Skript "✅ Keine
   Ueberschrift widerspricht ihren Commits." UND Exitcode 1: ein
   rueckwaerts laufender Block war gefunden, aber unten nicht mehr erwaehnt.
   Wer die Ausgabe liest, sah gruen; wer den Exitcode prueft, sah rot.
   [[widerspruch_liegt_in_der_beschriftung]] [[erfolgsmeldung_ohne_wirkung]] */
/* ---------- 4. DIE ZEILEN DER TO-DO GEGEN IHRE COMMITS UND DIE DATEI -------
 *
 * ⛔⛔ DER ANLASS: ACHT MAL AN EINEM TAG (09.09.2026)
 *
 * Die Abschnitte oben pruefen `Vokabeltrainer-Arabisch.md`. Die Uhrzeiten, die
 * ich an diesem Tag ACHT MAL nach oben gerundet habe, standen aber woanders:
 * in der Tabelle „✅ Erledigt in dieser Schicht" der To-Do — Zeilen der Form
 *   | 13:54 | … | `4c7dd93` |
 * und die hat bis heute niemand angesehen.
 *
 * ⭐ Der Mechanismus des Fehlers: messen, einen langen Eintrag schreiben, und
 * beim Tippen des Zeitstempels die Schreibdauer dazurechnen. Ein Zeitstempel
 * darf altern, aber nicht wachsen. [[uhrzeit_messen_nicht_schaetzen]]
 *
 * ZWEI REGELN, beide ohne Ermessen:
 *
 *   (a) Keine Zeile darf spaeter sein als die DATEI selbst. Die mtime sagt,
 *       wann zuletzt geschrieben wurde; eine Zeile, die danach liegt, kann
 *       niemand getippt haben.
 *   (b) Keine Zeile darf frueher sein als der Commit, den sie NENNT. Man kann
 *       nicht berichten, was noch nicht passiert ist.
 *
 * ⚠️ Was sie NICHT prueft: eine Zeile, die absichtlich einen frueheren Vorgang
 * nachtraegt („| 10:45 | …" um 13:00 geschrieben). Das ist erlaubt und haeufig.
 * Deshalb greift (a) nur nach oben und (b) nur nach unten.
 */
/* Das Urteil steht als eigene Funktion da, damit der Stoertest darunter GENAU
   sie prueft und keinen Nachbau. [[testvorlage_selbst_nachgebaut]] */
function zeileWiderspricht(zeitMin, mtimeMin, commitMin){
  if (zeitMin > mtimeMin + TOLERANZ_MIN) return 'spaeter als die Datei';
  if (commitMin != null && zeitMin + TOLERANZ_MIN < commitMin) return 'frueher als ihr Commit';
  return null;
}
const todoRot = [];
let todoZeilen = 0;
try {
  const TODO = 'G:\\1. Workspace\\Obsidian\\Gedächtnis\\Elias Gedächtnis\\03 - Projekte\\To-Do Vokabeltrainer.md';
  if (existsSync(TODO)){
    const roh = readFileSync(TODO, 'utf8').split(/\r?\n/);
    const stat = statSync(TODO);
    const mtimeMin = stat.mtime.getHours() * 60 + stat.mtime.getMinutes();
    const heuteDatei = String(stat.mtime.getDate()).padStart(2, '0') + '.'
      + String(stat.mtime.getMonth() + 1).padStart(2, '0') + '.' + stat.mtime.getFullYear();
    /* ⛔⛔ NUR DIE TABELLE DER LAUFENDEN SCHICHT. Der erste Lauf durchsuchte die
       ganze Datei und meldete sieben Zeilen — alle sieben waren Fehlalarme:
       vier Zitatzeilen einer aelteren Nacht („| 22:49 | „Das heisst, immer wenn
       ihr seht …"") und drei VIDEOSTELLEN aus einem Transkript („| 45:10 |").
       45:10 ist gar keine Uhrzeit. Ein Muster, das ueberall sucht, findet
       ueberall etwas. [[kandidatenliste_ist_keine_fehlerliste]]
       Der Anker ist die Ueberschrift der Tabelle; sie endet am naechsten `---`
       oder an der naechsten Ueberschrift. */
    const von = roh.findIndex(z => /^###\s+✅\s+Erledigt in dieser Schicht/.test(z));
    let bis = roh.length;
    if (von >= 0){
      for (let k = von + 1; k < roh.length; k++){
        if (/^---\s*$/.test(roh[k]) || /^#{2,3}\s/.test(roh[k])){ bis = k; break; }
      }
    }
    /* Nur solange die Datei von HEUTE ist — sonst vergleicht man Tage. */
    if (heuteDatei === HEUTE_DE && von >= 0){
      for (let i = von; i < bis; i++){
        const m = roh[i].match(/^\|\s*(\d{2}:\d{2})\s*\|/);
        if (!m || Number(m[1].slice(0, 2)) > 23) continue;
        todoZeilen++;
        const t = minuten(m[1]);
        /* Der genannte Commit, wenn es einen gibt und er von heute ist. */
        let commitMin = null, cHash = null, cZeit = null;
        const h = roh[i].match(/`([0-9a-f]{7})`/);
        if (h){
          const cz = commitTag(h[1]);          // aus der schon geladenen Karte
          const cm = cz && cz.match(/^(\d{2}\.\d{2}\.\d{4}) (\d{2}:\d{2})$/);
          if (cm && cm[1] === HEUTE_DE){ commitMin = minuten(cm[2]); cHash = h[1]; cZeit = cm[2]; }
        }
        const grund = zeileWiderspricht(t, mtimeMin, commitMin);
        if (grund) todoRot.push({ zeile: i + 1, zeit: m[1], grund: grund === 'spaeter als die Datei'
          ? 'spaeter als die Datei zuletzt geschrieben wurde ('
            + String(stat.mtime.getHours()).padStart(2, '0') + ':'
            + String(stat.mtime.getMinutes()).padStart(2, '0') + ')'
          : 'frueher als der genannte Commit ' + cHash + ' (' + cZeit + ')' });
      }
    }
  }
} catch (e){
  todoRot.push({ zeile: 0, zeit: '--:--', grund: 'To-Do nicht pruefbar: ' + e.message });
}
/* ⛔ STOERTEST fuer Abschnitt 4. Ohne ihn heisst „keine widerspricht sich" nur,
   dass die Schleife gelaufen ist. Beide Richtungen, und die Toleranz mit. */
{
  const p = [];
  const sp = (was, ist, soll) => { if (ist !== soll) p.push(was + ': ' + JSON.stringify(ist)); };
  sp('eine Zeile NACH der Datei faellt auf', zeileWiderspricht(800, 700, null), 'spaeter als die Datei');
  sp('eine Zeile VOR der Datei nicht',       zeileWiderspricht(600, 700, null), null);
  sp('genau die Toleranz geht noch durch',   zeileWiderspricht(700 + TOLERANZ_MIN, 700, null), null);
  sp('eine Minute mehr nicht',               zeileWiderspricht(700 + TOLERANZ_MIN + 1, 700, null), 'spaeter als die Datei');
  sp('eine Zeile VOR ihrem Commit faellt auf', zeileWiderspricht(600, 900, 650), 'frueher als ihr Commit');
  sp('eine Zeile NACH ihrem Commit nicht',     zeileWiderspricht(700, 900, 650), null);
  sp('ohne Commit wird nur die Datei geprueft', zeileWiderspricht(600, 900, null), null);
  if (p.length){
    console.log('');
    console.log('⛔ Der Stoertest von Abschnitt 4 greift nicht — die Zeile darunter misst nichts:');
    for (const x of p) console.log('     ' + x);
    todoRot.push({ zeile: 0, zeit: '--:--', grund: 'Stoertest gescheitert' });
  }
}
console.log('');
console.log('  Zeilen der To-Do (heute):  ' + todoZeilen + ' geprueft, '
  + (todoRot.length ? '❌ ' + todoRot.length + ' widersprechen sich' : '✅ keine widerspricht sich'));
for (const r of todoRot.slice(0, 8))
  console.log('     ❌ Z' + String(r.zeile).padStart(5) + '  ' + r.zeit + '  ' + r.grund);
if (todoRot.length > 8) console.log('     … und ' + (todoRot.length - 8) + ' weitere');

const alleSauber = !weicht && !zeitRot.length && !rueckwaerts.length && !unterRueckwaerts.length && !zukunft.length && !todoRot.length;
if (alleSauber) console.log('\n✅ Alle vier Pruefungen sauber: Datum, Uhrzeit, Reihenfolge, To-Do-Zeilen.');
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

if (unterRueckwaerts.length) console.log('⚠️  ' + unterRueckwaerts.length + ' Unterabschnitt(e) laufen zeitlich RUECKWAERTS.'
  + '\n   Innerhalb EINER Nacht — der haeufigste Fall geschaetzter Uhrzeiten.');
if (zukunft.length){
  console.log('⚠️  ' + zukunft.length + ' Uhrzeit(en) liegen in der ZUKUNFT.');
  console.log('   Die kann niemand geschrieben haben — sie sind geschaetzt. Die Uhr');
  console.log('   und die Commit-Zeit sind die Quellen, nicht die Erinnerung.');
}
process.exit(weicht || zeitRot.length || rueckwaerts.length || unterRueckwaerts.length || zukunft.length || todoRot.length ? 1 : 0);
