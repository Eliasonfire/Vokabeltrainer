#!/usr/bin/env node
/* namen-allahs-bauen.mjs — erzeugt namen-allahs-data.js aus werkzeuge/namen-allahs-liste.json
 * ===========================================================================================
 *
 * Elias, 08.11.2026: „ich möchte auch als neue vokabeln die namen allahs lernen … ich brauche vor
 * allem namen die ich in duas gut verwenden kann". Die Liste (Namen, Belege) steht in
 * namen-allahs-liste.json und wird von pruefe-namen-allahs.mjs gegen Koran und Duas geprüft.
 *
 * Hier steht nur die REIHENFOLGE, in der er sie lernt — in zehn Stücken. Stück 1 sind die Namen aus
 * den Duas, die er auswendig kann (data/duas.json); das folgt aus seinem Satz. Die Einteilung danach
 * (Vergebung und Barmherzigkeit, Bitten und Erhörung, Schutz und Güte …) ist MEINE Lesart, welche
 * Namen in Duas am häufigsten gebraucht werden — keine Vorgabe von ihm.
 *
 * Aufruf: node werkzeuge/namen-allahs-bauen.mjs            schreibt namen-allahs-data.js
 *         node werkzeuge/namen-allahs-bauen.mjs --pruefen  schreibt nichts, Exit 1 wenn veraltet
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.join(HIER, '..');
const LISTE = JSON.parse(fs.readFileSync(path.join(HIER, 'namen-allahs-liste.json'), 'utf8')).namen;
const DUAS = JSON.parse(fs.readFileSync(path.join(WURZEL, 'data', 'duas.json'), 'utf8')).duas;
const ZIEL = path.join(WURZEL, 'namen-allahs-data.js');
/* Beispielsätze (A9): Schlüssel = nr. Entweder aus seiner Dua { dua, ar, w, de } oder aus seinem
   auswendigen Koranbereich { surah, ayah, ar, w, de }. Geprüft von pruefe-namen-allahs.mjs (N6). */
export const SAETZE = JSON.parse(fs.readFileSync(path.join(HIER, 'namen-allahs-saetze.json'), 'utf8')).saetze;

/* [Titel des Stücks, Nummern aus der Liste] */
export const STUECKE = [
  ['Aus deinen Duas',                 [1, 5, 86, 43, 90, 35, 44, 23, 65, 70, 52]],
  ['Vergebung und Barmherzigkeit',    [30, 31, 47, 13, 46, 29, 78, 58, 85, 98]],
  ['Bitten und Erhörung',             [64, 54, 81, 32, 97, 24, 25, 79, 80, 74]],
  ['Schutz und Güte',                 [72, 59, 17, 15, 16, 87, 11, 82, 83, 96]],
  ['Macht und Weisheit',              [94, 95, 41, 21, 22, 42, 45, 3, 4, 57]],
  ['Der Eine',                        [2, 75, 39, 99, 6, 7, 8, 9, 19, 20]],
  ['Der Schöpfer',                    [27, 10, 67, 28, 34, 60, 73, 14, 62, 88]],
  ['Er sieht und weiß',               [12, 26, 40, 38, 33, 66, 77, 48, 36, 37]],
  ['Er vermag alles',                 [50, 53, 68, 55, 63, 51, 56, 49, 84, 89]],
  ['Weitere Namen',                   [18, 61, 69, 71, 76, 91, 92, 93]]
];

function satzFuer(nr){
  const x = SAETZE[String(nr)];
  if (!x) return null;
  const t = { ar: x.ar, de: x.de, w: x.w };
  if (x.dua) { const du = DUAS.find(y => y.nr === x.dua); if (!du) throw new Error('Satz ' + nr + ': Dua ' + x.dua + ' fehlt'); t.dua = x.dua; t.duaTitel = du.titel; }
  else { t.surah = x.surah; t.ayah = x.ayah; }
  return t;
}

function bauen(){
  const nachNr = new Map(LISTE.map(n => [n.nr, n]));
  const benutzt = new Set();
  const karten = [];
  let rang = 0;
  STUECKE.forEach(([titel, nummern], i) => {
    for (const nr of nummern) {
      const n = nachNr.get(nr);
      if (!n) throw new Error(`Nummer ${nr} steht nicht in der Liste`);
      if (benutzt.has(nr)) throw new Error(`Nummer ${nr} steht zweimal in STUECKE`);
      benutzt.add(nr);
      rang++;
      const duas = (n.dua || []).map(d => (DUAS.find(x => x.nr === d) || {}).titel).filter(Boolean);
      karten.push({
        id: 'na-' + String(nr).padStart(2, '0'), nr, rang, kap: i + 1,
        ar: n.ar, de: n.de, um: n.um, quelle: n.quelle,
        beleg: n.quelle === 'quran' ? 'Koran ' + n.beleg : n.beleg,
        ...(duas.length ? { duas } : {}),
        ...(satzFuer(nr) ? { satz: satzFuer(nr) } : {})
      });
    }
  });
  const fehlen = LISTE.filter(n => !benutzt.has(n.nr)).map(n => n.nr);
  if (fehlen.length) throw new Error('Nicht eingeteilt: ' + fehlen.join(', '));
  const kopf = `/* Automatisch erzeugt von werkzeuge/namen-allahs-bauen.mjs aus werkzeuge/namen-allahs-liste.json.
   NICHT VON HAND ÄNDERN — die Liste ändern und den Erzeuger laufen lassen.

   Die Gruppe „Namen Allahs" (Elias, 08.11.2026): 99 Namen nach Ibn ʿUthaymīn, jeder belegt
   (Koran oder sichere Sunna, geprüft von werkzeuge/pruefe-namen-allahs.mjs). \`kap\` = das Stück,
   \`rang\` = Platz in der Lernreihenfolge, \`duas\` = seine auswendigen Duas, in denen der Name steht,
   \`satz\` = Beispielsatz aus seiner Dua oder seinem auswendigen Koranbereich (namen-allahs-saetze.json). */
`;
  const titel = STUECKE.map(s => s[0]);
  return kopf + 'const NAMEN_ALLAHS = ' + JSON.stringify(karten, null, 1) + ';\n'
    + 'const NAMEN_ALLAHS_STUECKE = ' + JSON.stringify(titel) + ';\n';
}

const text = bauen();
if (process.argv.includes('--pruefen')) {
  const alt = fs.existsSync(ZIEL) ? fs.readFileSync(ZIEL, 'utf8') : '';
  if (alt !== text) { console.log('  ✗ namen-allahs-data.js ist veraltet — node werkzeuge/namen-allahs-bauen.mjs'); process.exit(1); }
  console.log('  ✓ namen-allahs-data.js entspricht der Liste');
} else {
  fs.writeFileSync(ZIEL + '.neu', text, 'utf8');
  fs.renameSync(ZIEL + '.neu', ZIEL);
  console.log('namen-allahs-data.js geschrieben: 99 Karten in ' + STUECKE.length + ' Stücken.');
}
