
/* test-abstaende.mjs — die Abstände der Oberfläche liegen in einem Raster (23.11.2026, Vorschlag 6 der
   Recherche „Gestaltung und Dranbleiben“; Elias: „ich nehme alle deine vorschläge“).
   Vorher gemessen: auf den Einstellungen lagen 471 von 705 Abständen im 4er-Raster, in der Vokabelliste
   296 von 422. Jetzt gilt für jeden fest geschriebenen Abstand (padding, margin, gap) im Stylesheet:
     · unter 8 px nur 1 (Haarlinie), 2, 4 oder 6
     · ab 8 px nur Vielfache von 4
     · ab 48 px frei (Platz für Leisten und feste Flächen)
   Die Abstands-Variablen (--sp-1 bis --sp-8, --gutter) sind auf jeder Bildschirmbreite Vielfache von 4.
   Werte in em und rem und Rechnungen (calc, env) wachsen mit der Schrift oder dem Gerät und bleiben frei.

   Aus Talib übernommen am 24.11.2026; Elias zur Liste der Unterschiede (Punkt 6, Rundungen und Abstände):
   „übernimm das in beiden apps also russich und arabisch“. Im Vokabeltrainer lagen 23 Werte daneben.

   Aufruf mit einer anderen Datei (Störprobe): node test-abstaende.mjs <Datei> */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = path.dirname(fileURLToPath(import.meta.url));
const datei = process.argv[2] || path.join(WURZEL, 'index.html');
const html = fs.readFileSync(datei, 'utf8');

let ok = 0, schlecht = 0;
const pruefe = (was, bedingung, gemessen) => {
  if (bedingung) { ok++; console.log('  ✔ ' + was); }
  else { schlecht++; console.log('  ✘ ' + was + '   gemessen: ' + gemessen); }
};

console.log('test-abstaende.mjs — Abstände im Raster\n');

const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n')
  .replace(/\/\*[\s\S]*?\*\//g, ' ');

const imRaster = n => n >= 48 || (n < 8 ? (n <= 2 || n % 2 === 0) : n % 4 === 0);

/* ---------- 1. Fest geschriebene Abstände ---------- */
{
  const FELD = /(^|[;{\s])((?:padding|margin)(?:-(?:top|right|bottom|left|inline|block|inline-start|inline-end|block-start|block-end))?|gap|row-gap|column-gap)\s*:\s*([^;}]+)/g;
  let gelesen = 0, werte = 0;
  const krumm = [];
  for (const m of css.matchAll(FELD)) {
    gelesen++;
    /* nur Stücke auf oberster Ebene, nicht in calc(), var(), env() */
    let tiefe = 0, stueck = '';
    const stuecke = [];
    for (const c of m[3] + ' ') {
      if (c === '(') tiefe++;
      if (c === ')') tiefe--;
      if (/\s/.test(c) && tiefe === 0) { if (stueck) stuecke.push(stueck); stueck = ''; }
      else stueck += c;
    }
    for (const s of stuecke) {
      const t = s.match(/^-?(\d+(?:\.\d+)?)px$/);
      if (!t) continue;
      werte++;
      if (!imRaster(Number(t[1]))) krumm.push(m[2] + ':' + m[3].trim());
    }
  }
  /* gemessen in Talib am 23.11.2026: 794 Angaben, davon 304 feste Werte in px. Im Vokabeltrainer
     (24.11.2026, übernommen) gibt es weniger Seiten: 642 Angaben, 136 feste Werte. */
  pruefe('die Messung sieht das ganze Stylesheet (über 600 Angaben, über 120 feste Werte)',
    gelesen > 600 && werte > 120, gelesen + ' Angaben, ' + werte + ' Werte');
  pruefe('kein fest geschriebener Abstand liegt neben dem Raster (' + werte + ' Werte geprüft)',
    krumm.length === 0, krumm.length + ' daneben: ' + krumm.slice(0, 8).join(' | '));
}

/* ---------- 2. Die Variablen, auf jeder Breite ---------- */
{
  const funde = [...css.matchAll(/--(sp-\d|gutter)\s*:\s*([^;}]+)/g)].map(m => ({ name: m[1], wert: m[2].trim() }));
  pruefe('die Abstands-Variablen sind für drei Breiten festgelegt (Handy, Tablet, PC)',
    funde.filter(f => f.name === 'gutter').length === 3 && funde.filter(f => f.name === 'sp-3').length === 3,
    funde.filter(f => f.name === 'gutter').length + ' × --gutter, ' + funde.filter(f => f.name === 'sp-3').length + ' × --sp-3');
  const krumm = funde.filter(f => { const t = f.wert.match(/^(\d+)px$/); return !t || Number(t[1]) % 4 !== 0; });
  pruefe('jede Abstands-Variable ist ein Vielfaches von 4 (' + funde.length + ' Festlegungen)',
    funde.length >= 20 && krumm.length === 0, krumm.map(f => '--' + f.name + ':' + f.wert).join(' | ') || funde.length + ' Festlegungen');
}

console.log('\n' + (schlecht ? '✘ ' : '✔ ') + ok + ' bestanden, ' + schlecht + ' gescheitert');
process.exit(schlecht ? 1 : 0);
