// pruefe-boxen.mjs — die Box-Rechnung der vier Bewertungsknöpfe (17.11.2026)
//
// Elias, 16.11.2026 (Eingang unterwegs, „Box-Bug dauerhaft verhindern"):
//   „Einen kleinen automatischen Test einbauen: Für jede Box und jede Bewertung
//    (Nochmal, Schwer, Gut, Leicht) muss die erwartete Ziel-Box und das erwartete
//    Intervall herauskommen." und „Bei jeder späteren Änderung … diesen Test vor
//    dem Abschluss laufen lassen und das Ergebnis melden."
//
// Ursache der drei gemeldeten „Box-Bugs" (14.11. курорт, 16.11. порт und
// наве́рное): vorgezogene Karten durften nicht aufsteigen (v603/v604). Darum
// prüft dieser Test JEDE Box in drei Lagen: fällig, vorgezogen, Lerngruppe.
//
// Er liest die ECHTEN Funktionen aus der App (STUFEN und stufeErgebnis aus
// js/lernen.js, INTERVALS, HOECHSTE_BOX, GRUPPE_ABSTAND, tageZwischen aus
// js/kern.js) — keine Kopie, die auseinanderlaufen könnte. answer() und die
// Knopfvorschau rufen beide stufeErgebnis() auf; das prüft Schritt 1.
//
// Aufruf: node werkzeuge/pruefe-boxen.mjs [App-Ordner]   (Vorgabe: dieser)
//         node werkzeuge/pruefe-boxen.mjs --stoertest
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const hier = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const stoer = args.includes('--stoertest');
const app = path.resolve(args.find(a => !a.startsWith('--')) || path.join(hier, '..'));
const lernen = fs.readFileSync(path.join(app, 'js', 'lernen.js'), 'utf8');
const kern = fs.readFileSync(path.join(app, 'js', 'kern.js'), 'utf8');

const fehler = [];
const melde = (s) => fehler.push(s);

// Einen Block ab „start" bis zur passenden schließenden Klammer ausschneiden.
function block(text, start, name) {
  const i = text.indexOf(start);
  if (i < 0) { melde(`nicht gefunden: ${name}`); return ''; }
  let tief = 0, j = text.indexOf('{', i);
  for (; j < text.length; j++) {
    if (text[j] === '{') tief++;
    else if (text[j] === '}') { tief--; if (tief === 0) break; }
  }
  let ende = j + 1;
  if (text[ende] === ';') ende++;
  return text.slice(i, ende);
}
function zeile(text, re, name) {
  const m = text.match(re);
  if (!m) { melde(`nicht gefunden: ${name}`); return ''; }
  return m[0];
}

// 1. Beide Wege benutzen dieselbe Rechnung.
const aufrufe = (lernen.match(/stufeErgebnis\(/g) || []).length;
if (aufrufe < 3) melde(`stufeErgebnis() nur ${aufrufe}× in js/lernen.js — answer() und Vorschau müssen sie beide rufen`);
if (/p\.box\s*=(?!=)(?!\s*erg\.box)/.test(lernen)) melde('js/lernen.js setzt p.box an stufeErgebnis() vorbei');

const quelle = [
  zeile(kern, /const INTERVALS\s*=\s*\{[^}]*\};?/, 'INTERVALS'),
  zeile(kern, /const HOECHSTE_BOX\s*=.*;/, 'HOECHSTE_BOX'),
  zeile(kern, /const GRUPPE_ABSTAND\s*=.*;/, 'GRUPPE_ABSTAND'),
  block(kern, 'function tageZwischen(', 'tageZwischen'),
  block(lernen, 'const STUFEN = {', 'STUFEN'),
  block(lernen, 'function stufeErgebnis(', 'stufeErgebnis'),
].join('\n');

let rechne = null;
if (!fehler.length) {
  let q = quelle;
  if (stoer) q = q.replace('b + 2)', 'b + 1)'); // Störtest: „leicht" wie „gut"
  rechne = new Function('todayStr', q + '\nreturn { stufeErgebnis, INTERVALS, HOECHSTE_BOX, GRUPPE_ABSTAND };')(
    () => '2026-11-17');
}

if (rechne) {
  const { stufeErgebnis, INTERVALS, HOECHSTE_BOX, GRUPPE_ABSTAND } = rechne;
  const heute = '2026-11-17';
  const soll = {
    nochmal: (b) => Math.max(1, b - 1),
    schwer: (b) => b,
    gut: (b) => Math.min(HOECHSTE_BOX, b + 1),
    leicht: (b) => Math.min(HOECHSTE_BOX, b + 2),
  };
  let n = 0;
  for (let b = 1; b <= HOECHSTE_BOX; b++) {
    for (const lage of ['faellig', 'vorgezogen']) {
      const p = { box: b, nextReview: lage === 'faellig' ? heute : '2026-11-21' };
      for (const k of Object.keys(soll)) {
        n++;
        const e = stufeErgebnis(k, p, heute);
        const box = soll[k](b);
        const tage = INTERVALS[box];
        if (e.box !== box || e.tage !== tage || e.bleibt)
          melde(`Box ${b}, ${lage}, ${k}: erwartet Box ${box} in ${tage} Tagen, bekommen Box ${e.box} in ${e.tage} Tagen${e.bleibt ? ' (Termin bleibt)' : ''}`);
      }
      // Gut und Leicht dürfen unter der höchsten Box nie dasselbe ergeben.
      if (b < HOECHSTE_BOX - 1) {
        const g = stufeErgebnis('gut', p, heute), l = stufeErgebnis('leicht', p, heute);
        if (g.box === l.box) melde(`Box ${b}, ${lage}: Gut und Leicht beide Box ${g.box}`);
      }
    }
  }
  // Lerngruppe (Box 1 mit `gruppe`): gut → 2, leicht → 3 raus; nochmal/schwer bleiben.
  for (const lage of ['faellig', 'vorgezogen']) {
    const p = { box: 1, gruppe: '2026-11-15', nextReview: lage === 'faellig' ? heute : '2026-11-18' };
    for (const [k, box, gruppe] of [['gut', 2, 'raus'], ['leicht', 3, 'raus']]) {
      n++;
      const e = stufeErgebnis(k, p, heute);
      if (e.box !== box || e.tage !== INTERVALS[box] || e.gruppe !== gruppe)
        melde(`Lerngruppe ${lage}, ${k}: erwartet Box ${box} (${gruppe}), bekommen Box ${e.box}, ${e.tage} Tage, ${e.gruppe}`);
    }
    for (const k of ['nochmal', 'schwer']) {
      n++;
      const e = stufeErgebnis(k, p, heute);
      const tage = lage === 'faellig' ? GRUPPE_ABSTAND : 1;
      if (e.box !== 1 || e.tage !== tage || e.gruppe !== 'bleibt')
        melde(`Lerngruppe ${lage}, ${k}: erwartet Box 1 in ${tage} Tagen (bleibt), bekommen Box ${e.box}, ${e.tage} Tage, ${e.gruppe}`);
    }
  }
  if (!stoer) console.log(`  ${n} Fälle gerechnet (Box 1–${HOECHSTE_BOX} × fällig/vorgezogen × 4 Knöpfe + Lerngruppe)`);
}

if (stoer) {
  if (fehler.some(f => f.includes('leicht'))) { console.log(`✅ Störtest: Fehler erkannt (${fehler.length} Meldungen, z. B. ${fehler[0]})`); process.exit(0); }
  console.log('⛔ Störtest: „leicht = gut" wurde NICHT erkannt'); process.exit(1);
}
if (fehler.length) {
  console.log(`⛔ ${fehler.length} Befund(e) in ${app}:`);
  for (const f of fehler.slice(0, 30)) console.log('   ' + f);
  process.exit(1);
}
console.log(`✅ Box-Rechnung stimmt (${path.basename(app)})`);
