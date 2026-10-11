/* eiche-ersatz.mjs -- zeigt, dass werkzeuge/pruefe-ersatz.mjs rot werden KANN.
 *
 * Baut in einem Wegwerfordner eine winzige Ersatzdatenbank (drei Plätze, zwei belegt, einer mit Grund nicht
 * gefunden, dazu das Verzeichnis), prüft, dass sie durchgeht, und baut dann der Reihe nach je EINEN Fehler ein. Jeder muss den Prüfer
 * auf Exit 1 bringen und mit dem erwarteten Satz benannt werden. Die echte data-ersatz/ wird nicht angefasst;
 * die arabischen Wörter der Probe stehen als Codepunkte hier und stammen aus keiner Datenbank.
 *
 * Aufruf:  node werkzeuge/eiche-ersatz.mjs      Exit 0 = jede Störung erkannt, Exit 1 = mindestens eine nicht
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const PRUEFER = path.join(HIER, 'pruefe-ersatz.mjs');
const BAYT = 'بَيْتٌ', KATABA = 'كَتَبَ';

function grundstand() {
  return {
    plaetze: [{ id: '1', buch: 'madina-1', kap: 1, platz: 1 }, { id: '2', buch: 'madina-1', kap: 1, platz: 2 }, { id: '3', buch: 'madina-1', kap: 2, platz: 3 }],
    karten: [
      { id: '1', ar: BAYT, de: 'Haus', type: 'noun', chapter: 1, gender: 'masculine', sg: BAYT, pl: null, femSg: null, femPl: null, root: null, past: null, present: null, imperative: null, masdar: null, note: null, book: 'madina-1', source: 'ersatz' },
      { id: '2', ar: KATABA, de: 'schreiben', type: 'verb', chapter: 1, gender: null, sg: null, pl: null, femSg: null, femPl: null, root: null, past: KATABA, present: null, imperative: null, masdar: null, note: null, book: 'madina-1', source: 'ersatz' },
    ],
    belege: {
      1: { status: 'belegt', felder: { ar: { wo: 'Probe A', q: 'enwikt' }, de: { wo: 'Probe B', q: 'direkt' }, type: { wo: 'Probe C', q: 'enwikt' }, gender: { wo: 'Probe D', q: 'enwikt' }, sg: { wo: 'Probe A', q: 'enwikt' } } },
      2: { status: 'belegt', felder: { ar: { wo: 'Probe E', q: 'enwikt' }, de: { wo: 'Probe F', q: 'kette' }, type: { wo: 'Probe G', q: 'enwikt' }, past: { wo: 'Probe E', q: 'enwikt' } } },
    },
    nichtGefunden: [{ id: '3', buch: 'madina-1', kap: 2, platz: 3, grund: 'Probe: in keiner Quelle' }],
    verzeichnis: [{ slug: 'madina-1', vokabeln: 2, kapitel: 1, datei: 'data/vokabeln-madina-1.js' }],
  };
}
function lauf(stand, ordnerDa = true) {
  const ordner = fs.mkdtempSync(path.join(os.tmpdir(), 'eiche-ersatz-'));
  const ziel = ordnerDa ? ordner : path.join(ordner, 'gibt-es-nicht');
  if (ordnerDa) {
    fs.writeFileSync(path.join(ordner, 'plaetze.json'), JSON.stringify(stand.plaetze));
    fs.writeFileSync(path.join(ordner, 'vokabeln-madina-1.js'), '(window.VOKABELN = window.VOKABELN || {})["madina-1"] = ' + JSON.stringify(stand.karten) + ';\n');
    fs.writeFileSync(path.join(ordner, 'belege-madina-1.json'), JSON.stringify(stand.belege));
    fs.writeFileSync(path.join(ordner, 'nicht-gefunden.json'), JSON.stringify(stand.nichtGefunden));
    if (stand.verzeichnis) fs.writeFileSync(path.join(ordner, 'buecher.js'), '/* Probe */\nconst BUECHER = ' + JSON.stringify(stand.verzeichnis, null, 1) + ';\n');
  }
  const r = spawnSync(process.execPath, [PRUEFER, '--ordner', ziel], { encoding: 'utf8' });
  fs.rmSync(ordner, { recursive: true, force: true });
  return { code: r.status, text: (r.stdout || '') + (r.stderr || '') };
}

const FAELLE = [
  ['Grundstand geht durch', s => s, 0, 'ERSATZ VOLLSTÄNDIG: 3 von 3 Plätzen'],
  ['Karte ohne Deutsch', s => { s.karten[0].de = ''; }, 1, 'de fehlt'],
  ['Angabe ohne Fundstelle', s => { delete s.belege[1].felder.ar; }, 1, 'ar ohne Fundstelle'],
  ['Fundstelle nennt arabicroots', s => { s.belege[2].felder.de.wo = 'arabicroots, Kapitel 1'; }, 1, 'nennt arabicroots'],
  ['Reihenfolge vertauscht', s => { s.karten.reverse(); }, 1, 'anderer Reihenfolge'],
  ['anderes Kapitel', s => { s.karten[1].chapter = 5; }, 1, 'Kapitel 5'],
  ['belegt und zugleich nicht gefunden', s => { s.nichtGefunden.push({ id: '1', buch: 'madina-1', kap: 1, platz: 1, grund: 'Probe' }); }, 1, 'belegt UND'],
  ['fremde Kennung', s => { s.karten[1].id = '99'; s.belege[99] = s.belege[2]; }, 1, 'gehört nicht zu den Plätzen'],
  ['nicht NFC', s => { s.karten[0].ar = 'آبٌ'; }, 1, 'nicht NFC'],
  ['Strich statt Form', s => { s.karten[1].past = '-'; }, 1, 'keine arabischen Buchstaben'],
  ['nicht gefunden ohne Grund', s => { s.nichtGefunden[0].grund = ''; }, 1, 'ohne Grund'],
  ['Karte doppelt', s => { s.karten.push({ ...s.karten[1] }); }, 1, 'doppelt'],
  ['Karte ohne Beleg-Eintrag', s => { delete s.belege[2]; }, 1, 'ohne Beleg-Eintrag'],
  ['unbekannte Wortart', s => { s.karten[0].type = 'nomen'; }, 1, 'unbekannte Wortart'],
  ['ein Platz offen heißt nicht vollständig', s => { s.karten.pop(); s.verzeichnis[0].vokabeln = 1; }, 0, 'ERSATZ UNVOLLSTÄNDIG: 1 von 3 Plätzen belegt'],
  ['Kapitel ohne Karte wird genannt', s => s, 0, 'Kapitel: 1 von 2 haben mindestens eine Karte — ohne Karte: madina-1 Kapitel 2'],
  ['Verzeichnis fehlt', s => { s.verzeichnis = null; }, 1, 'das Verzeichnis fehlt'],
  ['Verzeichnis nennt andere Kartenzahl', s => { s.verzeichnis[0].vokabeln = 3; }, 1, 'Verzeichnis nennt für madina-1 3 Karten, die Buchdatei hat 2'],
  ['Verzeichnis nennt andere Kapitelzahl', s => { s.verzeichnis[0].kapitel = 2; }, 1, 'Verzeichnis nennt für madina-1 2 Kapitel, die Buchdatei hat 1'],
  ['Verzeichnis zeigt auf andere Datei', s => { s.verzeichnis[0].datei = 'data-ersatz/vokabeln-madina-1.js'; }, 1, 'statt data/vokabeln-madina-1.js'],
  ['Verzeichnis führt ein Buch ohne Datei', s => { s.verzeichnis.push({ slug: 'madina-2', vokabeln: 5, kapitel: 1, datei: 'data/vokabeln-madina-2.js' }); }, 1, 'dazu gibt es keine Buchdatei mit Karten'],
];
let gut = 0;
for (const [name, stoere, code, satz] of FAELLE) {
  const s = grundstand();
  stoere(s);
  const r = lauf(s);
  const ok = r.code === code && r.text.includes(satz);
  if (ok) gut++;
  else console.log(`  ✗ ${name}: erwartet Exit ${code} mit „${satz}“, bekommen Exit ${r.code}: ${r.text.trim().split('\n').slice(-2).join(' | ').slice(0, 200)}`);
}
const ohneOrdner = lauf(grundstand(), false);
const okOhne = ohneOrdner.code === 0 && ohneOrdner.text.includes('nichts zu prüfen');
if (!okOhne) console.log(`  ✗ fehlender Ordner: erwartet Exit 0 mit „nichts zu prüfen“, bekommen Exit ${ohneOrdner.code}`);
const gesamt = FAELLE.length + 1;
console.log(`Eichung pruefe-ersatz: ${gut + (okOhne ? 1 : 0)} von ${gesamt} Fällen wie erwartet`);
process.exit(gut + (okOhne ? 1 : 0) === gesamt ? 0 : 1);
