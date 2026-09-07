/* test-trefferflaechen.mjs — bewacht die Mindestgröße der Bedienelemente.
 *
 * Elias will die App **im Gehen** bedienen (07.09.2026, Punkt 6 der ADHS-Liste):
 * „eine Hand, große Trefferflächen, Wischen statt Zielen". Bewegung entlastet
 * bei ADHS das Arbeitsgedächtnis — Stillsitzen kostet ihn Kapazität, die er
 * fürs Wort bräuchte. Die App muss das aushalten.
 *
 * Maßstab: **WCAG 2.5.5 (AAA) = 44×44 CSS-Pixel.**
 *
 * ⚠️⚠️ WAS DIESER PRÜFER MISST — und was nicht.
 * Er liest das STYLESHEET, nicht die gezeichnete Seite. Er kann also sagen, dass
 * eine Regel eine Mindestgröße vorschreibt; er kann NICHT sagen, wie hoch der
 * Knopf am Ende wirklich ist. Genau diese Verwechslung ist am 07.09.2026 der
 * Anlass gewesen: `.hoer-option` hatte gar keine Höhenangabe und kam über das
 * Padding auf **43** px — ein Pixel zu wenig, und im Quelltext stand nichts
 * Falsches. [[kommentar_beschreibt_absicht_markup_wirkung]]
 *
 * ⭐ Die echte Messung ist im Browser gelaufen (375×812, alle 38 Bedienelemente
 * auf Lernkarte, Satzmodus und Hörmodus). Dieser Prüfer hält das Ergebnis fest,
 * damit es nicht unbemerkt zurückfällt — er ersetzt die Messung nicht.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf8');

let ok = 0, schlecht = 0;
const pruefe = (was, bedingung, gemessen) => {
  if (bedingung) { ok++; console.log('  ✔ ' + was); }
  else { schlecht++; console.log('  ✘ ' + was + '   gemessen: ' + gemessen); }
};

/** Alle Blöcke einer Regel — nicht nur den ersten. Eine spätere Regel kann eine
 *  frühere überschreiben, und genau das wäre der Rückfall. */
function bloecke(selektor){
  const gefunden = [];
  const muster = new RegExp('(^|[},\\n])\\s*' + selektor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    + '\\s*(,[^{]*)?\\{([^}]*)\\}', 'g');
  let m;
  while ((m = muster.exec(html))) gefunden.push(m[3]);
  return gefunden;
}

/** Die kleinste Höhe, die eine Regel zusichert. null = sie sagt nichts dazu. */
function hoeheAus(block){
  const h = block.match(/(?:^|;|\s)height\s*:\s*(\d+)px/);
  const mh = block.match(/min-height\s*:\s*(\d+)px/);
  const werte = [h && Number(h[1]), mh && Number(mh[1])].filter(x => Number.isFinite(x));
  return werte.length ? Math.max(...werte) : null;
}

console.log('test-trefferflaechen.mjs — 44×44 CSS-Pixel (WCAG 2.5.5)\n');

/* Die fünf Klassen, die am 07.09.2026 gemessen unter 44 px lagen. Jede steht
   für eine Bedienung, die Elias im Gehen braucht. */
const ZIELE = [
  ['.icon-btn',      'Lernen beenden, Einstellungen — waren 40×40'],
  ['.btn',           'Zurück/Weiter im Satzmodus — waren 43 px hoch'],
  ['.waehler',       'Modus- und Themenwahl — waren 43 px hoch'],
  ['.hoer-option',   'die vier Antworten im Hörmodus — waren 43 px hoch'],
  ['.select-input',  'jede Auswahl in den Einstellungen — war 43 px hoch'],
];

for (const [sel, warum] of ZIELE){
  const bl = bloecke(sel);
  if (!bl.length){ pruefe(sel + ' — Regel gefunden', false, 'keine Regel im Stylesheet'); continue; }
  const hoehen = bl.map(hoeheAus).filter(x => x !== null);
  pruefe(sel + ' sichert eine Höhe zu  (' + warum + ')', hoehen.length > 0,
    'keine height/min-height in ' + bl.length + ' Block/Blöcken');
  if (hoehen.length)
    pruefe(sel + ' → mindestens 44 px', Math.min(...hoehen) >= 44, Math.min(...hoehen) + 'px');
}

/* ⛔ Und die Gegenprobe: eine spätere Regel darf sie nicht wieder unterbieten.
   Genau so wäre der Rückfall: jemand setzt `.btn-klein{height:36px}` und das
   Stylesheet ist wieder unter der Grenze, ohne dass oben etwas fehlt. */
{
  const verdaechtig = [];
  const muster = /([^{}]{1,120})\{([^}]*(?:^|;|\s)(?:min-)?height\s*:\s*(\d+)px[^}]*)\}/g;
  let m;
  while ((m = muster.exec(html))){
    const sel = m[1].replace(/\/\*[\s\S]*?\*\//g, '').trim();
    const h = Number(m[3]);
    /* Nur echte Bedienelemente: Klassen mit btn/option/waehler/nav im Namen. */
    if (h >= 44) continue;
    if (!/(^|[.\s,#])[a-z-]*(btn|option|waehler|nav-|tab)[a-z-]*/i.test(sel)) continue;
    /* Ausnahmen mit Grund: was nicht getippt wird (::-webkit-Teile, disabled). */
    if (/::|:disabled|:hover|:active|:focus/.test(sel)) continue;
    /* ⛔ Und die ICONS in den Knöpfen. `.kenne-schon-btn .ic` ist 16×16 —
       das ist der Inhalt des Ziels, nicht das Ziel. Ein Icon auf 44 px zu
       ziehen wäre eine Verschlechterung, die dieser Prüfer erzwingen würde.
       [[kandidatenliste_ist_keine_fehlerliste]] */
    if (/[.]ic($|[^a-z-])/.test(sel) || /\bsvg\b/.test(sel)) continue;
    verdaechtig.push(sel.slice(0, 60) + ' → ' + h + 'px');
  }
  pruefe('keine spätere Regel unterbietet 44 px bei Bedienelementen',
    verdaechtig.length === 0, verdaechtig.join(' | ') || '—');
}

/* Der Beleg aus dem Browser — festgehalten, damit die Zahl nicht verlorengeht. */
console.log('\n  ⓘ Im Browser gemessen (07.09.2026, 375×812): 38 Bedienelemente auf');
console.log('    Lernkarte, Satzmodus und Hörmodus, davon 0 unter 44×44.');
console.log('    Vorher: 2 auf der Lernkarte (40×40) und 4 im Satzmodus (43 px).');
console.log('    ⛔ Nicht angefasst: Kapitel-Chips (33 px) und die Kalenderzellen');
console.log('    (15×15). Beides ist Konfiguration im Sitzen, kein Gehen-Ziel —');
console.log('    und ein 44-px-Kalender passte nicht mehr auf ein Handy.');

console.log('\n' + (schlecht ? '✘ ' + schlecht + ' von ' + (ok + schlecht) + ' Fällen falsch'
                              : '✅ alle ' + ok + ' Fälle richtig'));
process.exitCode = schlecht ? 1 : 0;
