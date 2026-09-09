/* Ein ANDERER Blickwinkel auf „ist das Gedaechtnis aktuell?".
 *
 * Der Wortlaut-Pruefer fragt: steht jeder SATZ von Elias drin?
 * Die Punkteliste fragt: steht jeder Punkt drin, den ICH aufgeschrieben habe.
 * ⛔ Beide koennen gruen sein, waehrend eine ZAHL im Vault falsch ist — und
 *    eine falsche Zahl ist schlimmer als eine fehlende, weil man ihr glaubt.
 *
 * Dieser Pruefer geht rueckwaerts: er nimmt die Behauptungen, die in den
 * Abschnitten dieser Nacht stehen, und misst sie gegen die Wirklichkeit.
 * [[blickwinkel_durchprobieren]] · [[zahlen_ohne_beleg]]
 */
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import vm from 'node:vm';
import { ohneKommentareUndTexte } from './js-quelltext.mjs';

const VAULT = 'G:/1. Workspace/Obsidian/Gedächtnis/Elias Gedächtnis/03 - Projekte/Vokabeltrainer-Arabisch.md';
const TODO  = 'G:/1. Workspace/Obsidian/Gedächtnis/Elias Gedächtnis/03 - Projekte/To-Do Vokabeltrainer.md';
const REPO  = 'G:/1. Workspace/Vokabeltrainer';
const text  = fs.readFileSync(VAULT, 'utf8') + '\n' + fs.readFileSync(TODO, 'utf8');

let fehler = 0;
const pruefe = (was, behauptet, gemessen) => {
  const ok = String(behauptet) === String(gemessen);
  if (ok) console.log('  ok  ' + was.padEnd(46) + behauptet);
  else { fehler++; console.log('  X   ' + was.padEnd(46) + 'Vault: ' + behauptet + '   GEMESSEN: ' + gemessen); }
};

/* ---------- 1. Jeder genannte Commit-Hash muss existieren ---------- */
const hashes = [...new Set([...text.matchAll(/`([0-9a-f]{7})`/g)].map(m => m[1]))];
/* ⛔ EIN git-Aufruf, nicht 577. Und OHNE `^{commit}`: das `^` wird auf
   Windows von der Shell gefressen, und dann meldet `git cat-file -e` JEDEN
   Hash als fehlend. Der erste Lauf dieses Werkzeugs behauptete genau das —
   577 von 577 unbekannt, darunter Commits von vor einer Stunde.
   [[mein_neues_werkzeug_ist_verdaechtig]] */
/* ⭐ Gegen ALLE Repos des Arbeitsbereichs, nicht nur den Vokabeltrainer: der
   Vault nennt auch Commits aus Automation, Quran Trainer und der
   Parfüm-Website — und er sagt das an Ort und Stelle dazu („(Automation)").
   Der zweite Lauf hielt 46 davon für erfunden.
   [[werkzeug_misst_kleineren_bestand]] */
const alleHashes = new Set();
for (const r of ['Vokabeltrainer', 'Automation', 'Quran Trainer', 'Parfum-Website']){
  try {
    execSync('git log --format=%h --abbrev=7 --all',
      { cwd: 'G:/1. Workspace/' + r, maxBuffer: 64 * 1024 * 1024 })
      .toString().split(/\r?\n/).forEach(x => { const t = x.trim(); if (t) alleHashes.add(t); });
  } catch (e) { console.log('  ⓘ kein Zugriff auf Repo: ' + r); }
}
/* ⛔ Zwei Hashes stehen ABSICHTLICH im Vault und gehören in keins dieser Repos:
   `97c56f1` liegt in whisper.cpp außerhalb des Arbeitsbereichs, und `8e70b3c`
   ist ein ERFUNDENER Hash aus einer alten Lehre — der Text daneben sagt selbst
   „der echte ist `f23adaa`". Benannt statt still gefiltert: eine stille
   Ausnahme ist eine, die niemand mehr prüft. */
for (const h of ['97c56f1', '8e70b3c']) alleHashes.add(h);
let unbekannt = 0;
for (const h of hashes){
  if (!alleHashes.has(h)){ unbekannt++; if (unbekannt <= 12) console.log('  X   Commit gibt es nicht: ' + h); }
}
if (unbekannt > 12) console.log('  … und ' + (unbekannt - 12) + ' weitere');
console.log('  ' + (unbekannt ? 'X  ' : 'ok ') + ' Commit-Hashes im Gedaechtnis'.padEnd(46)
  + hashes.length + ' genannt, ' + unbekannt + ' unbekannt');
fehler += unbekannt;

/* ---------- 2. Die Zahlen aus den Abschnitten dieser Nacht ---------- */
const sw = fs.readFileSync(REPO + '/sw.js', 'utf8');
/* ⛔ NICHT die Zahl von damals eintippen. Genau das stand hier bis zum
   08.09.2026 ('vokabeltrainer-v399') — und der Pruefer wurde bei der naechsten
   Auslieferung rot, ohne dass am Gedaechtnis etwas fehlte. Eine Erwartung, die
   von Hand gepflegt werden muss, ist eine Zeitbombe mit Datum.
   [[pruefwerkzeug_mit_eingebauter_antwort]]

   Die richtige Frage lautet: steht der AKTUELLE Stand im Gedaechtnis? Also die
   hoechste im Vault genannte Fassung gegen sw.js. */
/* ⛔ HERVORHEBUNG ZAEHLT MIT (09.09.2026). Der Vorspann erlaubte vor `v461`
   nur Zeilenanfang, Leerzeichen oder Klammer — `**v461**` fiel also durch, und
   der Pruefer meldete „Vault: 461, GEMESSEN: 460", obwohl die Fassung dastand.
   Ein Fehlalarm ist die harmlose Richtung; die andere waere schlimmer: stuende
   die Fassung NUR fettgedruckt da, haette der Pruefer den veralteten Stand
   nicht bemerkt. In diesen Notizen ist Fettschrift der Normalfall.
   [[zeichenklasse_nie_sichtbar_kopieren]] [[gruener_pruefer_beweist_nur_geprueftes]] */
const vaultVersionen = [...text.matchAll(/vokabeltrainer-v([0-9]+)|(?:^|[\s(*_„"'])v([0-9]{3})(?![0-9])/g)]
  .map(m => Number(m[1] || m[2])).filter(n => n >= 100 && n < 999);
/* Gegenprobe an Ort und Stelle: beide Schreibweisen muessen gefunden werden,
   und eine Zahl mitten im Wort darf NICHT als Fassung durchgehen. */
{
  const probe = (s) => [...s.matchAll(/vokabeltrainer-v([0-9]+)|(?:^|[\s(*_„"'])v([0-9]{3})(?![0-9])/g)]
    .map(m => Number(m[1] || m[2]));
  pruefe('Fassungsmuster: „ v123" wird gefunden', '[123]', JSON.stringify(probe('Stand v123 heute')));
  pruefe('Fassungsmuster: „**v123**" auch',       '[123]', JSON.stringify(probe('Stand **v123** heute')));
  pruefe('Fassungsmuster: „(v123)" auch',         '[123]', JSON.stringify(probe('Stand (v123) heute')));
  pruefe('Fassungsmuster: „abcv123" NICHT',       '[]',    JSON.stringify(probe('abcv123')));
}
const hoechsteImVault = vaultVersionen.length ? Math.max(...vaultVersionen) : null;
const inSw = Number(((sw.match(/CACHE_NAME = 'vokabeltrainer-v([0-9]+)'/) || [])[1]) || 0);
pruefe('hoechste Fassung im Gedaechtnis = sw.js', inSw, hoechsteImVault);

const stat = fs.readFileSync(REPO + '/js/statistik.js', 'utf8');
pruefe('r4: tagesQuote existiert', true, /function tagesQuote\(/.test(stat));
pruefe('r4: gesamtQuote existiert', true, /function gesamtQuote\(/.test(stat));

const lern = fs.readFileSync(REPO + '/js/lernen.js', 'utf8');
pruefe('r6: p.rueckfall wird gesetzt', true, /p\.rueckfall = boxVorher/.test(lern));
pruefe('K2: wort-zurueck wird gefeiert', true, /feiere\('wort-zurueck'/.test(lern));

const feier = fs.readFileSync(REPO + '/js/feier.js', 'utf8');
pruefe('K2: SITZT_MEILEN', '[25, 50, 75, 100, 150, 200, 300]',
  (feier.match(/const SITZT_MEILEN = (\[[^\]]+\])/) || [])[1]);

const kern = fs.readFileSync(REPO + '/js/kern.js', 'utf8');
pruefe('K3: INTERVALS', '{1:0, 2:1, 3:3, 4:7, 5:16}',
  (kern.match(/const INTERVALS = (\{[^}]+\})/) || [])[1]);
pruefe('K3: DECKEL_ANTEIL_BOX1', '0.4',
  (kern.match(/const DECKEL_ANTEIL_BOX1 = ([\d.]+)/) || [])[1]);

/* r3: die Wortartenverteilung */
const ktx = {}; vm.createContext(ktx);
vm.runInContext(fs.readFileSync(REPO + '/vocab-data.js', 'utf8') + '\nthis.R=VOCAB_DATA;', ktx);
const v = ktx.R;
pruefe('r3: 171 Lernwoerter', 171, v.length);
pruefe('r3: 116 Nomen', 116, v.filter(w => w.type === 'noun').length);
pruefe('r3: 29 Adjektive', 29, v.filter(w => w.type === 'adjective').length);
pruefe('r3: 15 Partikeln', 15, v.filter(w => w.type === 'particle').length);

/* Uebungsarten und Hinweise (a2) */
const ueb = fs.readFileSync(REPO + '/js/uebung.js', 'utf8');
pruefe('a2: 13 Uebungsarten', 13, (ueb.match(/^\s*id\s*:\s*'[^']+',\s*nr\s*:/gm) || []).length);
pruefe('a2: 12 mit Hinweis', 12, (ueb.match(/^\s*hinweis\s*:/gm) || []).length);

/* Fachbegriffe (Oberflaechenpruefung) */
const fach = fs.readFileSync(REPO + '/data/fachbegriffe.js', 'utf8');
/* ⚠ Gezaehlt wird, was die APP laedt — nicht ein Regex-Treffer. */
const ktxF = {}; vm.createContext(ktxF);
vm.runInContext(fach + '\nthis.F = (typeof FACHBEGRIFF_VOKABELN !== "undefined") ? FACHBEGRIFF_VOKABELN : null;', ktxF);
pruefe('Oberflaeche: 31 Fachbegriffe', 31, ktxF.F ? ktxF.F.length : 'FACHBEGRIFF_VOKABELN fehlt');

/* Die neuen Ausnahmen in den Pruefern
   ⛔⛔ OHNE KOMMENTARE. Diese vier Zeilen behaupten „steht im Code" — und ein
   Kommentar, der den Namen nur ERWAEHNT, haette sie zufriedengestellt. Genau
   so haette man eine geloeschte Ausnahme nicht bemerkt: die Begruendung
   darueber nennt sie ja weiter. Am 09.09.2026 ist dieselbe Falle an zwei
   anderen Stellen zugeschnappt (pruefe-bidi, validate.js).
   ⚠️ `texte: false`, denn die gesuchten Zeichenketten SIND String-Literale —
   wer die Texte mitmaskiert, sucht ins Leere.
   [[stichworttreffer_im_kommentar]] [[zusicherung_im_kommentar_ist_keine_pruefung]] */
const nurCode = (p) => ohneKommentareUndTexte(fs.readFileSync(REPO + p, 'utf8'), { texte: false });
const abgl = nurCode('/werkzeuge/pruefe-abgleich.mjs');
pruefe('vt_einstGruppen im Abgleich ausgenommen', true, abgl.includes("'vt_einstGruppen'"));
const kreis = nurCode('/werkzeuge/pruefe-kreislaeufe.mjs');
pruefe('vt_einstGruppen im Kreislauf ausgenommen', true, kreis.includes("'vt_einstGruppen'"));
const datum = nurCode('/werkzeuge/pruefe-datumsangaben.mjs');
pruefe('###-Pruefung eingebaut', true, datum.includes('unterBloecke'));
pruefe('Davor-Ausnahme eingebaut', true, datum.includes('archivMarke'));
/* Und die Gegenprobe: blendet `nurCode` ueberhaupt etwas aus? Ohne sie waeren
   die vier Zeilen daruber auch dann gruen, wenn die Maskierung nichts tut. */
{
  const roh = fs.readFileSync(REPO + '/werkzeuge/pruefe-abgleich.mjs', 'utf8');
  pruefe('nurCode blendet wirklich aus (weniger Zeichen als roh)', true, abgl.length === roh.length
    && abgl !== roh);
}

/* Werkzeuge, die im Vault genannt werden, muessen existieren */
for (const w of ['werkzeuge/rechne-boxenverteilung.mjs', 'werkzeuge/eiche-abschnittsfolge.mjs',
                 'werkzeuge/langenscheidt.mjs', 'pruefe-oberflaeche.js']){
  pruefe('Datei existiert: ' + w.split('/').pop(), true, fs.existsSync(REPO + '/' + w));
}

/* ---------- 3. Stoertest: erkennt dieser Pruefer ueberhaupt etwas? ----------

   ⛔ Ohne diesen Teil ist die gruene Schlusszeile wertlos. Der Pruefer hat in
   seinen ersten drei Laeufen DREIMAL danebengelegen (577 „fehlende" Commits
   durch `^{commit}` in der Windows-Shell, 30 statt 31 Fachbegriffe durch einen
   geratenen Regex, 46 Hashes aus fremden Repos) — und jedes Mal sah die
   Ausgabe aus wie ein Befund ueber das Gedaechtnis.
   [[stoertest_muss_wirkung_nachweisen]] · [[mein_neues_werkzeug_ist_verdaechtig]] */
console.log('');
let blind = 0;

/* a) Ein erfundener Hash MUSS als unbekannt gelten. */
if (alleHashes.has('0000000')){ blind++; console.log('  XX  STOERTEST: erfundener Hash gilt als bekannt'); }
else console.log('  ok  Stoertest: ein erfundener Hash (0000000) gilt als unbekannt');

/* b) Ein echter Hash MUSS bekannt sein — sonst filtert die Repo-Liste zu viel. */
if (!alleHashes.has('5de39b1')){ blind++; console.log('  XX  STOERTEST: ein echter Commit gilt als unbekannt'); }
else console.log('  ok  Stoertest: ein echter Commit (5de39b1) wird gefunden');

/* c) Und der Vergleich selbst muss eine falsche Erwartung erkennen. */
if (String(v.length) === '999'){ blind++; console.log('  XX  EICHUNG FAELLT AUS'); }
else console.log('  ok  Eichung: eine falsche Erwartung (171 gegen 999) wuerde auffallen');
fehler += blind;

console.log('\n' + (fehler ? 'FEHLER: ' + fehler : 'Alle Zahlen im Gedaechtnis halten der Messung stand'));
process.exit(fehler ? 1 : 0);
