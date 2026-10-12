/* ersatz-bama-abgleich.mjs -- gleicht die Plätze „nicht gefunden" der Ersatzdatenbank gegen die Stammliste von
 * Buckwalter (BAMA 1.0, GPL v2) ab. Nur lesend; schreibt allein die genannte Ausgabedatei.
 *
 * Elias, 12.10.2026, zu den Plätzen ohne Quelle: „guck nach weiteren möglichkeiten sie zu besorgen".
 *
 * Vier Stufen, von sicher nach unsicher:
 *   streng     ein Lemma der Liste hat dieselben Vokalzeichen (bis auf Artikel und Schlussendung)
 *   weiblich   das Wort endet auf Ta marbuta, die Liste führt die Form ohne sie
 *   stamm      die Schreibung steht nicht als Lemma, aber als Stamm unter einem Lemma
 *   nah        nur dieselben Buchstaben -- KEIN Beleg, nur ein Hinweis zum Nachsehen
 * Was davon als belegt eingetragen wird, entscheidet eine Sitzung von Hand (data-ersatz/hand/<buch>.json,
 * Quelle „bama"); dieses Werkzeug trägt nichts ein. Das Deutsch nennt die Liste nicht -- sie ist englisch.
 *
 * Die Ausgabe zeigt die Suchwörter aus dem Bestand und gehört deshalb in keine versionierte Datei.
 *
 * Aufruf (aus dem Repo-Wurzelverzeichnis):
 *   node werkzeuge/ersatz-bama-abgleich.mjs [<ausgabe.txt> [<ausgabe.json>]]
 *   ohne Angabe: data-ersatz/arbeit/bama-abgleich.txt
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ladeBama, standardDatei, ladeBuch, vergleich, geruest, ausBW } from './ersatz-bama-lib.mjs';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const REPO = process.env.ERSATZ_REPO || path.join(HIER, '..');
const ERSATZ = path.join(REPO, 'data-ersatz');
const Z = n => String.fromCodePoint(n);
const TA = Z(0x629), FATHA = Z(0x64E);

const quelle = standardDatei(REPO);
const liste = path.join(ERSATZ, 'nicht-gefunden.json');
for (const [was, datei] of [['die Stammliste', quelle], ['die Liste „nicht gefunden"', liste]]) {
  if (!fs.existsSync(datei)) { console.log('⛔ ' + was + ' fehlt: ' + path.relative(REPO, datei) + ' (data-ersatz/ liegt nur lokal)'); process.exit(1); }
}
const ng = JSON.parse(fs.readFileSync(liste, 'utf8'));

const lemmas = ladeBama(quelle);
const nachForm = new Map(), nachStamm = new Map(), nachGeruest = new Map();
const lege = (m, k, v) => { if (!m.has(k)) m.set(k, []); if (!m.get(k).includes(v)) m.get(k).push(v); };
for (const l of lemmas) {
  lege(nachForm, vergleich(l.ar, { artikelWeg: false }), l);
  lege(nachGeruest, geruest(l.ar), l);
  for (const s of l.staemme) lege(nachStamm, vergleich(ausBW(s.mit), { artikelWeg: false }), l);
}

const kurzLemma = l => l.id + ' [' + l.kats.join(',') + '] ' + l.glossen.slice(0, 3).join(' / ').slice(0, 110);
const zeilen = [], daten = [];
const zahl = { streng: 0, weiblich: 0, stamm: 0, nah: 0, nichts: 0 };
for (const e of ng) {
  const k = (ladeBuch(REPO, e.buch) || new Map()).get(String(e.id)) || {};
  const woerter = String(k.ar || '').trim().split(/\s+/);
  const kopf = [e.id, e.buch.replace('bayna-yadayk-', 'by').replace('madina-', 'm') + ' K' + e.kap, (k.type || '?').slice(0, 4), k.ar, k.de].join(' | ');
  if (woerter.length > 1) { zeilen.push(kopf, '   (mehrere Wörter — nicht abgeglichen)', ''); zahl.nichts++; daten.push({ id: e.id, art: 'mehrwort' }); continue; }
  const K = vergleich(k.ar);
  const ohneTa = K.endsWith(TA) ? K.slice(0, -1).replace(new RegExp(FATHA + '$'), '') : null;
  const streng = nachForm.get(K) || [];
  const weiblich = ohneTa ? (nachForm.get(ohneTa) || []) : [];
  const stamm = (nachStamm.get(K) || []).filter(l => !streng.includes(l));
  const nah = (nachGeruest.get(geruest(k.ar)) || []).filter(l => !streng.includes(l) && !weiblich.includes(l) && !stamm.includes(l));
  let art;
  if (streng.length) { art = 'streng'; zahl.streng++; }
  else if (weiblich.length) { art = 'weiblich'; zahl.weiblich++; }
  else if (stamm.length) { art = 'stamm'; zahl.stamm++; }
  else if (nah.length) { art = 'nah'; zahl.nah++; }
  else { art = 'nichts'; zahl.nichts++; }
  zeilen.push(kopf);
  for (const l of streng) zeilen.push('   = ' + kurzLemma(l) + (l.verb ? '  {Stämme: ' + l.staemme.map(s => s.kat + ':' + s.mit).join(' ') + '}' : ''));
  for (const l of weiblich) zeilen.push('   ♀ (männliche Form) ' + kurzLemma(l));
  for (const l of stamm) zeilen.push('   ~ (Stamm unter) ' + kurzLemma(l) + '  {' + l.staemme.filter(s => vergleich(ausBW(s.mit), { artikelWeg: false }) === K).map(s => s.kat + ':' + s.mit).join(' ') + '}');
  for (const l of nah.slice(0, 6)) zeilen.push('   ? (gleiche Buchstaben) ' + l.ar + '  ' + kurzLemma(l));
  if (art === 'nichts') zeilen.push('   — nichts');
  zeilen.push('');
  daten.push({ id: e.id, buch: e.buch, art, streng: streng.map(l => l.id), weiblich: weiblich.map(l => l.id), stamm: stamm.map(l => l.id), nah: nah.map(l => l.id) });
}
const kopfzeile = 'BAMA-Lemmas: ' + lemmas.length + ' · Plätze: ' + ng.length + ' · streng ' + zahl.streng + ' · über die männliche Form ' + zahl.weiblich + ' · als Stamm ' + zahl.stamm + ' · nur gleiche Buchstaben ' + zahl.nah + ' · nichts ' + zahl.nichts;
const ziel = process.argv[2] || path.join(ERSATZ, 'arbeit', 'bama-abgleich.txt');
fs.mkdirSync(path.dirname(ziel), { recursive: true });
fs.writeFileSync(ziel, kopfzeile + '\n\n' + zeilen.join('\n') + '\n', 'utf8');
if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify(daten, null, 1), 'utf8');
console.log(kopfzeile);
console.log('geschrieben: ' + path.relative(REPO, ziel));
