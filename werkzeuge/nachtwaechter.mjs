/* Nachtwaechter — laeuft als sichtbare Hintergrundaufgabe waehrend der Nachtschicht.
   Zweck: Elias soll mit EINEM Blick sehen, ob die Schicht noch arbeitet.

   ⭐ Warum es das gibt: Am 06.09.2026 um 06:33 zeigte Elias das Panel
   „Hintergrundaufgaben" und sagte: „hier will ich die nachtschicht sehen aber
   da ist sie niht". Der Drei-Minuten-Takt (CronCreate) ist KEIN Prozess — er
   ist ein Eintrag in einer Warteschlange und taucht dort nie auf. Auch der
   scheduled-task nicht. Sichtbar wird nur, was wirklich laeuft.

   Der Waechter misst das Alter des Arbeitsstands im Obsidian-Tresor — dieselbe
   Datei, die gedaechtnis-frisch.mjs liest. Steht die Schicht laenger als
   STILL_MIN Minuten, sagt er das deutlich. Er schreibt NICHTS in den Tresor:
   ein Waechter, der selbst Eintraege erzeugt, faerbt seine eigene Messung
   gruen. [[waechter_meldet_ausgeschalteten_rechner]] */
import fs from 'fs';
import path from 'path';

const TRESOR = 'G:/1. Workspace/Obsidian/Gedächtnis/Elias Gedächtnis/03 - Projekte';
const STAND  = path.join(TRESOR, 'To-Do Vokabeltrainer.md');
const WISSEN = path.join(TRESOR, 'Vokabeltrainer-Arabisch.md');
const TAKT_MS   = 3 * 60 * 1000;   // derselbe Takt wie der Cron-Auftrag
const STILL_MIN = 20;              // ab hier gilt die Schicht als stehengeblieben

const uhr = () => new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
const altMin = p => { try { return (Date.now() - fs.statSync(p).mtimeMs) / 60000; } catch { return null; } };

console.log(`Nachtwaechter Vokabeltrainer — gestartet ${uhr()}, Takt ${TAKT_MS/60000} min`);

function runde(){
  const a = altMin(STAND), b = altMin(WISSEN);
  if (a === null){ console.log(`${uhr()}  ⚠️  Arbeitsstand nicht gefunden: ${STAND}`); return; }
  const juengstes = b === null ? a : Math.min(a, b);
  const zeile = `${uhr()}  Arbeitsstand ${a.toFixed(0)} min · Erkenntnis ${b === null ? '—' : b.toFixed(0) + ' min'}`;
  if (juengstes > STILL_MIN) console.log(`${zeile}  ⛔ STEHT SEIT ${juengstes.toFixed(0)} MINUTEN`);
  else                       console.log(`${zeile}  ✅ arbeitet`);
}

runde();
setInterval(runde, TAKT_MS);
