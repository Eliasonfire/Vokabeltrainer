/* eiche-dua-zitate.mjs — schlaegt pruefe-eselsbruecken.js bei seinen Duas wirklich an?
   ====================================================================================
   Aufruf:  node werkzeuge/eiche-dua-zitate.mjs

   WOZU (30.09.2026, v633)

   Seit v633 sind Elias' Duas Anker fuer Eselsbruecken (data/duas.json). Er am
   29.09.2026: „die duas kannst du für vorschläge nutzen um bessere zu machen …"
   Der Pruefer hat dafuer zwei neue Stellen: Abschnitt 9 (ein Dua-Zitat steht
   woertlich in der Quelle; eine Stelle, die er nur aus einer Dua kennt, wird nur
   mit deren Wortlaut zitiert) und in Abschnitt 7 die Ausnahme „das Ankerwort
   steht in einem woertlichen Dua-Zitat".

   Ein gruener Lauf beweist davon nichts: heute steht kein falsches Zitat in den
   Daten. Diese Eichung stoert deshalb gezielt und verlangt Rot — und einmal
   ausdruecklich Gruen, damit die Ausnahme in Abschnitt 7 nicht alles durchwinkt.
   [[stoertest_muss_wirkung_nachweisen]] [[leere_datei_besteht_jeden_test]]

   ⛔ KEINE DATENDATEI WIRD ANGEFASST. Jede Stoerung steckt in einer KOPIE des
   Pruefers (.stoer-eb-<fall>.js im Projektordner, damit die relativen Pfade
   stimmen), die im finally wieder geloescht wird. Die Kopie ist der ECHTE
   Pruefer plus eine eingefuegte Zeile — keine nachgebaute Bedingung.
   [[handliste_neben_echter_quelle]]

   ⚠️ Die Faelle haengen nicht an heutigen Texten: sie bringen ihren Stoertext
   selbst mit (aus dem ersten belegten Duatext) und setzen die Voraussetzung
   selbst (28:24 als „nur aus einer Dua", ein Wort als „Kapitel 99"). Sonst
   wuerde die Eichung rot, sobald Elias einen Vorschlag ablehnt oder im
   Lernstand weiterkommt — ein Rot, das nichts ueber den Pruefer sagt.

   Exit 0 = alle Faelle wie erwartet · 1 = ein Fall schief · 2 = Ankerstelle im
   Pruefer nicht gefunden (er wurde umgebaut — diese Datei nachziehen). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const W = path.join(HIER, '..');
const { duasLesen, duaNorm } = createRequire(import.meta.url)('./auswendig.js');
const ORIG = fs.readFileSync(path.join(W, 'pruefe-eselsbruecken.js'), 'utf8');

const NACH_ALT = "const ALT        = ladeAusSkript('data/eselsbruecken-alt.js', 'ESELSBRUECKEN_ALT');";
const NACH_BEREICH = 'const BEREICH = auswendigLesen(WURZEL);';
const AUSNAHME_7 = 'if (duaZitatAn(String(text), stelle)) return;';
const IMPORT = "const { auswendigLesen, kannStelle, umfang, duaNorm, duaFundstelle } = require('./werkzeuge/auswendig.js');";
const KAPITEL_7 = "VOCAB_DATA.forEach(w => { merke(w.ar, slug === 'madina-1' ? w.chapter : 0); merkeBox(w.ar, w.id); });";
for (const s of [NACH_ALT, NACH_BEREICH, AUSNAHME_7, IMPORT, KAPITEL_7])
  if (ORIG.split(s).length !== 2){
    console.log('⛔ Ankerstelle nicht genau einmal im Pruefer: ' + s.slice(0, 70) + ' …');
    process.exit(2);
  }

/* Der Stoertext: die ersten zwei Woerter des ersten belegten Duatextes. */
const { duas } = duasLesen(W);
const erste = duas.find(d => d && d.alsAnker && (d.texte || []).length);
if (!erste){ console.log('⛔ data/duas.json hat keine Dua mit alsAnker und Text — nichts zu eichen.'); process.exit(1); }
const PROBE = duaNorm(erste.texte[0].arabisch).split(' ').slice(0, 2).join(' ');
const stelleHaraka = PROBE.search(/[َُِ]/);
if (PROBE.split(' ').length < 2 || stelleHaraka < 0){
  console.log('⛔ Der Anfang von Dua ' + erste.nr + ' taugt nicht als Probe („' + PROBE + '").'); process.exit(1);
}
const FALSCH = PROBE.slice(0, stelleHaraka) + (PROBE[stelleHaraka] === 'َ' ? 'ِ' : 'َ') + PROBE.slice(stelleHaraka + 1);
const ZWEITES = PROBE.split(' ')[1];

const js = s => JSON.stringify(s);
const nach = (anker, zusatz) => t => t.replace(anker, anker + '\n' + zusatz);
const ersetze = (anker, neu) => t => t.replace(anker, neu);
const kette = (...f) => t => f.reduce((x, g) => g(x), t);
/* Ein zusaetzlicher Vorschlag an einem Wort aus madina-1, Kapitel 1 (بَيْتٌ). */
const ZIEL = '45751';
const injiziere = text => nach(NACH_ALT, '(ALT[' + js(ZIEL) + '] = ALT[' + js(ZIEL) + '] || []).push(' + js(text) + ');');
/* Abschnitt 7: das zweite Probewort gilt als Vokabel aus Kapitel 99 von madina-1. */
const spaet = nach(KAPITEL_7, "if (slug === 'madina-1'){ kapitelVon.set(geruest(" + js(ZWEITES) + '), 99); schreibungVon.set(geruest('
  + js(ZWEITES) + '), ' + js(ZWEITES) + '); }');
const buchDa = fs.existsSync(path.join(W, 'data', 'vokabeln-madina-1.js'));

const FAELLE = [
  { name: 'a-haraka', was: '9a: eine Ḥaraka im Dua-Zitat geaendert („' + FALSCH + '")',
    patch: injiziere('Aus deiner Dua: ' + FALSCH + '.'), rot: true, muss: 'steht in KEINER Dua' },
  { name: 'b-versrest', was: '9b: an einer Stelle „nur aus einer Dua" ein Stueck, das in keiner Dua steht',
    patch: kette(nach(NACH_BEREICH, "BEREICH.ausDuas.add('28:24'); BEREICH.verse.add('28:24');"),
                 injiziere('Aus deiner Dua: فَسَقَىٰ لَهُمَا (28:24).')),
    rot: true, muss: 'NUR aus einer Dua' },
  { name: 'c-ohne-datei', was: '9: ein Text nennt eine Dua, data/duas.json fehlt',
    patch: kette(nach(NACH_BEREICH, 'BEREICH.duas = [];'), injiziere('Aus deiner Dua: ' + PROBE + '.')),
    rot: true, muss: 'data/duas.json ist nicht da' },
  { name: 'd-mit-ausnahme', was: '7: Dua-Zitat mit einem Wort „aus Kapitel 99", Ausnahme AN → gruen',
    patch: kette(spaet, injiziere('Aus deiner Dua: ' + PROBE + '.')),
    rot: false, darfNicht: 'aus Kapitel 99', braucht: buchDa },
  { name: 'e-ohne-ausnahme', was: '7: dasselbe Zitat, Ausnahme AUS → rot',
    patch: kette(spaet, injiziere('Aus deiner Dua: ' + PROBE + '.'), ersetze(AUSNAHME_7, '/* Eichung: Ausnahme entfernt */')),
    rot: true, muss: 'aus Kapitel 99', braucht: buchDa },
  { name: 'f-immer-ja', was: 'Gegenprobe: ein Vergleich, der immer die erste Dua liefert',
    patch: ersetze(IMPORT, IMPORT.replace('duaFundstelle }', 'duaFundstelle: _echt }')
      + '\nconst duaFundstelle = (duas) => (duas || []).find(d => d && d.alsAnker) || null;'),
    rot: true, muss: 'Gegenprobe 9 wirkungslos' },
];

let schief = 0, uebersprungen = 0;
for (const f of FAELLE){
  if (f.braucht === false){
    uebersprungen++;
    console.log('hinw ' + f.name + ' uebersprungen: data/vokabeln-madina-1.js fehlt (Abschnitt 7 prueft dann madina-1 nicht).');
    continue;
  }
  const datei = path.join(W, '.stoer-eb-' + f.name + '.js');
  let r;
  try {
    fs.writeFileSync(datei, f.patch(ORIG));
    r = spawnSync(process.execPath, [datei], { cwd: W, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } finally { try { fs.unlinkSync(datei); } catch (e) {} }
  const aus = (r.stdout || '') + (r.stderr || '');
  let ok = (r.status === 1) === f.rot;
  if (ok && f.muss && !aus.includes(f.muss)) ok = false;
  if (ok && f.darfNicht && aus.slice(aus.indexOf('=== 7.'), aus.indexOf('=== 8.')).includes(f.darfNicht)) ok = false;
  if (!ok) schief++;
  console.log((ok ? 'ok   ' : 'SCHIEF ') + f.name + ' — ' + f.was + ' → Exit ' + r.status + ' (erwartet ' + (f.rot ? 1 : 0) + ')');
  if (!ok) aus.split('\n').filter(z => /FEHL|⛔|Gegenprobe|Error/.test(z)).slice(0, 4).forEach(z => console.log('        ' + z.trim().slice(0, 220)));
}
const rest = fs.readdirSync(W).filter(n => n.startsWith('.stoer-eb-'));
if (rest.length){ console.log('⛔ Kopien liegen noch: ' + rest.join(', ')); schief++; }
console.log(schief ? schief + ' Fall/Faelle SCHIEF — der Pruefer schlaegt nicht an, wo er soll.'
                   : 'Alle ' + (FAELLE.length - uebersprungen) + ' Faelle wie erwartet'
                     + (uebersprungen ? ' (' + uebersprungen + ' uebersprungen)' : '') + '.');
process.exit(schief ? 1 : 0);
