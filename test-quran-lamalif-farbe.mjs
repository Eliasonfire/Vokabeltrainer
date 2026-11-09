#!/usr/bin/env node
/* test-quran-lamalif-farbe.mjs — ein markiertes Alif im Lām-Alif wird im Verstext farbig
 * =====================================================================================
 *
 * Elias am 08.11.2026, mit zwei Bildern von 93:4 (das Hamza-Alif in وَلَلۡأٓخِرَةُ, rot):
 *   „hier wird das alif nicht markiert, das muss gefixt werden"
 *
 * Lām + Alif ist EIN Zeichen; Chromium färbt es in der Farbe des Lām. Deshalb beginnt der
 * Farb-Span seit v729 beim Lām (tajweedLamAlifFlaeche() in js/quran-markierung.js).
 *
 *   L1  93:4, Hamza-Alif nach Lām: die Fläche umfasst Lām UND Alif
 *   L2  ٱلۡأُولَىٰ (ebenfalls 93:4): genauso
 *   L3  ein Alif NICHT nach einem Lām (مَا) bleibt allein
 *   L4  ein markiertes Lām bleibt allein (nur das Alif zieht das Lām mit)
 *   L5  tajweedZeichnen() ruft die Funktion wirklich auf
 * Störtest: die Funktion gibt den Buchstaben unverändert zurück → L1 und L2 müssen rot werden.
 *
 * Exit 0 = grün und Störtest rot. Exit 1 = sonst.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const QUELLE = fs.readFileSync(path.join(HIER, 'js', 'quran-markierung.js'), 'utf8');

function ausschneiden(quelle){
  const von = quelle.indexOf('const TJ_ALIFE');
  const bis = quelle.indexOf('/* Baut alle Markierungen der offenen Sure neu auf.');
  if (von < 0 || bis < 0 || bis <= von) return null;
  return new Function(quelle.slice(von, bis) + '\n;return tajweedLamAlifFlaeche;')();
}
function cluster(text){
  const seg = new Intl.Segmenter('ar', { granularity: 'grapheme' });
  return [...seg.segment(text)].map(s => ({ i: s.index, len: s.segment.length, text: s.segment }))
    .filter(c => c.text.trim().length > 0);
}
const an = (cl, z) => cl.find(c => c.text[0] === z);

function pruefe(f){
  const fehler = [];
  if (typeof f !== 'function') return ['Funktion tajweedLamAlifFlaeche nicht gefunden'];
  const w1 = 'وَلَلۡأٓخِرَةُ', c1 = cluster(w1), a1 = an(c1, 'أ');
  const r1 = f(c1, a1);
  if (w1.slice(r1.i, r1.i + r1.len) !== 'لۡأٓ') fehler.push('L1: 93:4 färbt „' + w1.slice(r1.i, r1.i + r1.len) + '" statt Lām + Alif');
  const w2 = 'ٱلۡأُولَىٰ', c2 = cluster(w2), a2 = an(c2, 'أ');
  const r2 = f(c2, a2);
  if (w2.slice(r2.i, r2.i + r2.len) !== 'لۡأُ') fehler.push('L2: ٱلۡأُولَىٰ färbt „' + w2.slice(r2.i, r2.i + r2.len) + '"');
  const w3 = 'مَا', c3 = cluster(w3), a3 = an(c3, 'ا');
  const r3 = f(c3, a3);
  if (r3 !== a3) fehler.push('L3: ein Alif ohne Lām davor wurde erweitert');
  const l1 = an(c1.slice(2), 'ل');
  if (f(c1, l1) !== l1) fehler.push('L4: ein markiertes Lām wurde erweitert');
  return fehler;
}

const fehler = pruefe(ausschneiden(QUELLE));
const zeichnen = QUELLE.slice(QUELLE.indexOf('function tajweedZeichnen'), QUELLE.indexOf('function tajweedModusSetzen'));
if (!/tajweedLamAlifFlaeche\(cluster, c\)/.test(zeichnen)) fehler.push('L5: tajweedZeichnen() ruft tajweedLamAlifFlaeche() nicht auf');

const gestoert = QUELLE.replace(/function tajweedLamAlifFlaeche\(cluster, c\)\{/, 'function tajweedLamAlifFlaeche(cluster, c){ return c;');
const stoer = pruefe(ausschneiden(gestoert));
if (!stoer.some(f => f.startsWith('L1')) || !stoer.some(f => f.startsWith('L2')))
  fehler.push('Störtest blieb grün — der Test misst die Ligatur nicht');

if (fehler.length){ for (const f of fehler) console.log('  ✗ ' + f); process.exit(1); }
console.log('  ✓ Lām-Alif: ein markiertes Alif färbt die ganze Ligatur (L1–L5, Störtest rot)');
