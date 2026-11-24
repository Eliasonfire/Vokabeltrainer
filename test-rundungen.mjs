
/* test-rundungen.mjs — die Rundungen der Oberfläche haben vier Stufen (23.11.2026, Vorschlag 6 der Recherche
   „Gestaltung und Dranbleiben“; Elias: „ich nehme alle deine vorschläge“).
   Vorher gemessen: zwölf verschiedene Werte auf den Seiten (3 bis 28 px und „ganz rund“).
   Jetzt: 4, 12, 18 und 24 px, dazu „ganz rund“ für Pillen und Kreise.

   Geprüft wird das ganze Stylesheet von index.html, nicht eine Liste von Namen:
   jede Regel mit einer Rundung nennt entweder eine Stufe (--r-0 bis --r-5, --r-full), 0 oder 50 %, oder ihr
   fest geschriebener Wert wird im Block „Stil-Schicht · Rundungen“ von einer Regel mit demselben Namen auf
   eine Stufe geführt. Aufruf mit einer anderen Datei (Störprobe): node test-rundungen.mjs <Datei> */

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

console.log('test-rundungen.mjs — vier Stufen für alle Rundungen\n');

const MARKE = '/* ----- Stil-Schicht · Rundungen';
const roh = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');
const blockAnfang = roh.indexOf(MARKE);
pruefe('der Block „Stil-Schicht · Rundungen“ steht im Stylesheet', blockAnfang >= 0, 'nicht gefunden');
if (blockAnfang < 0) { console.log('\n✘ ' + ok + ' bestanden, ' + schlecht + ' gescheitert'); process.exit(1); }

/* Kommentare durch Leerzeichen ersetzen, damit die Stellen im Text gleich bleiben */
const css = roh.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));
/* der Block reicht bis zum nächsten Kommentar nach seinem eigenen Kopf */
const kopfEnde = roh.indexOf('*/', blockAnfang);
const naechster = roh.indexOf('/*', kopfEnde);
const blockEnde = naechster < 0 ? roh.length : naechster;

/* Alle Regeln mit Rundung lesen: Name, Wert, Stelle, in @media oder nicht */
const regeln = [];
function lies(text, versatz, inMedien) {
  let i = 0;
  while (i < text.length) {
    const auf = text.indexOf('{', i);
    if (auf < 0) break;
    const kopf = text.slice(i, auf).trim();
    let tiefe = 1, j = auf + 1;
    for (; j < text.length && tiefe; j++) { if (text[j] === '{') tiefe++; else if (text[j] === '}') tiefe--; }
    const rumpf = text.slice(auf + 1, j - 1);
    if (kopf.startsWith('@media') || kopf.startsWith('@supports')) lies(rumpf, versatz + auf + 1, true);
    else if (!kopf.startsWith('@')) {
      for (const m of rumpf.matchAll(/(?:^|[;\s])border-radius\s*:\s*([^;}]+)/g)) {
        regeln.push({ sel: kopf.replace(/\s+/g, ' '), wert: m[1].trim(), pos: versatz + auf, inMedien });
      }
      const v = rumpf.match(/--r-\d\s*:/);
      if (v && /^:root$/.test(kopf)) regeln.push({ sel: ':root', stufen: rumpf, pos: versatz + auf });
    }
    i = j;
  }
}
lies(css, 0, false);

/* ---------- 1. Die Stufen ---------- */
const ERLAUBT = ['4px', '12px', '18px', '24px'];
{
  const imBlock = regeln.filter(r => r.stufen && r.pos > blockAnfang && r.pos < blockEnde);
  pruefe('der Block legt die Stufen fest', imBlock.length === 1, imBlock.length + ' Festlegungen');
  const werte = {};
  if (imBlock[0]) for (const m of imBlock[0].stufen.matchAll(/--(r-\d)\s*:\s*([^;]+)/g)) werte[m[1]] = m[2].trim();
  for (const name of ['r-0', 'r-1', 'r-2', 'r-3', 'r-4', 'r-5']) {
    pruefe('--' + name + ' ist eine der vier Stufen', ERLAUBT.includes(werte[name]), String(werte[name]));
  }
  const verschieden = new Set(Object.values(werte));
  pruefe('zusammen sind es genau vier verschiedene Werte', verschieden.size === 4, [...verschieden].join(', '));
  const spaeter = regeln.filter(r => r.stufen && r.pos > blockEnde);
  pruefe('nach dem Block legt niemand die Stufen noch einmal fest', spaeter.length === 0, spaeter.length + ' weitere');
}

/* ---------- 2. Jede Rundung nennt eine Stufe oder wird auf eine geführt ---------- */
{
  const stufeRx = /^var\(--r-(?:\d|full)\)$/;
  const teilOk = t => stufeRx.test(t) || t === '0' || t === '0px' || t === '50%' || t === 'inherit';
  const frei = r => r.wert.split(/\s+/).every(teilOk);
  const fuehrend = regeln.filter(r => !r.stufen && r.pos > blockAnfang && r.pos < blockEnde);
  /* Der Block fasst Namen mit Komma zusammen; verglichen wird jeder Name einzeln. */
  const einzeln = sel => sel.split(',').map(s => s.trim()).filter(Boolean);
  const namen = new Set(fuehrend.flatMap(r => einzeln(r.sel)));

  pruefe('die Regeln des Blocks nennen selbst nur Stufen',
    fuehrend.length > 0 && fuehrend.every(frei), fuehrend.filter(r => !frei(r)).map(r => r.sel + ' → ' + r.wert).join(' | ') || 'keine Regel');

  const fest = regeln.filter(r => !r.stufen && !frei(r));
  const offen = fest.filter(r => !einzeln(r.sel).every(n => namen.has(n)));
  pruefe('kein fest geschriebener Wert bleibt ohne Stufe (' + fest.length + ' geführt)',
    offen.length === 0, offen.map(r => r.sel + ' → ' + r.wert).join(' | '));

  const zuSpaet = fest.filter(r => r.pos > blockEnde);
  pruefe('kein fest geschriebener Wert steht hinter dem Block (dort gewönne er wieder)',
    zuSpaet.length === 0, zuSpaet.map(r => r.sel + ' → ' + r.wert).join(' | '));

  /* Im Vokabeltrainer (24.11.2026, aus Talib übernommen) gibt es weniger Seiten als in Talib: gemessen 171
     Regeln mit Rundung. Die Schwelle prüft nur, dass das ganze Stylesheet gelesen wurde. */
  pruefe('die Messung sieht das ganze Stylesheet (über 150 Regeln mit Rundung)',
    regeln.length > 150, regeln.length + ' Regeln');
}

console.log('\n' + (schlecht ? '✘ ' : '✔ ') + ok + ' bestanden, ' + schlecht + ' gescheitert');
process.exit(schlecht ? 1 : 0);
