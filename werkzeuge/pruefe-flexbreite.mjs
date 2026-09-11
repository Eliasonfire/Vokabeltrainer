/* pruefe-flexbreite.mjs — wer kann die Seite quer schieben?
 *
 * ⭐ Der Anlass (09.09.2026): An EINEM Abend drei Stellen gefunden, an denen
 * der Vokabeltrainer auf schmalen Handys waagerecht rollte — und keine davon
 * hatte Elias je gemeldet. Man wischt die Seite zurecht und erzählt es nicht.
 *
 *   Einstellungen  `select#wurzelFarbeSelect`   377 px in einem 364-px-Fenster
 *   Kategorien     `.custom-cat-add input`      386 px in einem 375-px-Fenster
 *                  (seit 11.09.2026 mit dem Reiter „Eigene" entfernt)
 *   Satzmodus      `.ueb-stand` (white-space:nowrap)  332 px in 320 px
 *
 * ⛔ Immer dieselbe Ursache: `flex:1` erlaubt das Schrumpfen, aber
 * `min-width:auto` verbietet es unterhalb der INHALTSbreite — bei einem
 * `<select>` die laengste Option, bei einem `<input>` seine Standardgroesse,
 * bei `nowrap` der ganze Text. Das Kind schiebt dann den Behaelter auf, der
 * Behaelter die Seite. Nichts wird rot. [[layout_min_width_falle]]
 *
 * ⚠️ DAS HIER IST EINE KANDIDATENLISTE, KEINE FEHLERLISTE. Ob eine Stelle
 * wirklich ueberlaeuft, entscheidet der Inhalt zur Laufzeit — das sieht nur
 * der Browser. Gemeldet wird, wo es passieren KANN.
 * [[kandidatenliste_ist_keine_fehlerliste]]
 *
 * ⛔ Und was der Pruefer NICHT kann: die Messung im Browser ersetzen. Die geht
 * so (im Pane, je Bildschirm und bei 320 px Fensterbreite):
 *
 *     [...document.querySelectorAll('.screen.active *')]
 *       .filter(e => e.getBoundingClientRect().right > window.innerWidth + 1)
 *       .filter(e => !hatRollendenVorfahren(e))
 *
 * Der zweite Filter ist Pflicht: der Wochenbalken der Startseite ragt
 * ABSICHTLICH ueber seinen Kasten hinaus und rollt in sich.
 * [[pruefserver_ist_nicht_die_app]]
 */
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

/* ⛔ fileURLToPath, nicht .pathname — der Pfad traegt ein Leerzeichen.
   [[adresse_nie_normalisieren]] */
const HTML = fileURLToPath(new URL('../index.html', import.meta.url));

function regelnLesen(quelle){
  const ab = quelle.indexOf('<style');
  const bis = quelle.lastIndexOf('</style>');
  if (ab < 0 || bis < 0) return [];
  const stil = quelle.slice(ab, bis);
  const regeln = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(stil))){
    const sel = m[1].trim().replace(/\s+/g, ' ');
    if (!sel || sel.startsWith('@')) continue;
    regeln.push({ sel, inhalt: m[2] });
  }
  return regeln;
}

function suche(regeln){
  const hat = (r, eig) => new RegExp('(^|;|\\s)' + eig + '\\s*:', 'i').test(r.inhalt);
  const wert = (r, eig) => {
    const t = r.inhalt.match(new RegExp('(?:^|;|\\s)' + eig + '\\s*:\\s*([^;]+)', 'i'));
    return t ? t[1].trim() : null;
  };

  /* Jeder Selektor, dessen Regel display:flex setzt. */
  const behaelter = new Set();
  for (const r of regeln){
    if (!/display\s*:\s*(inline-)?flex/i.test(r.inhalt)) continue;
    r.sel.split(',').forEach(s => behaelter.add(s.trim()));
  }

  /* Alle min-width-Angaben je Selektor sammeln — auch aus einer ANDEREN Regel.
     ⛔ Ohne das melden wir eine Stelle, die zwei Zeilen weiter unten längst
     abgesichert ist. [[zwei_regeln_selber_selektor]] */
  const abgesichert = new Set();
  for (const r of regeln){
    if (!hat(r, 'min-width')) continue;
    r.sel.split(',').forEach(s => abgesichert.add(grundform(s.trim())));
  }

  const funde = [];
  const gesehen = new Set();
  for (const r of regeln){
    for (const roh of r.sel.split(',').map(s => s.trim())){
      /* ⚠️ Pseudoklassen tragen dieselbe Breite wie ihre Grundregel — sie
         doppelt zu melden macht die Liste unlesbar. */
      const sel = grundform(roh);
      if (sel !== roh) continue;
      if (abgesichert.has(sel)) continue;
      const eltern = [...behaelter].find(b => b !== sel && sel.startsWith(b + ' '));
      if (!eltern) continue;

      const istFeld = /(^|\s|>)(input|select|textarea)\b/i.test(sel);
      const nowrap  = /white-space\s*:\s*nowrap/i.test(r.inhalt);
      /* ⛔ `flex:0 0 auto` ist eine FESTE Breite — dort ist min-width ohne
         Bedeutung, und es waere der haeufigste Fehlalarm der Liste. */
      const f = wert(r, 'flex');
      const schrumpfbar = f && !/^0\s+0\b/.test(f);

      if (!istFeld && !nowrap && !schrumpfbar) continue;
      const schluessel = sel + '|' + eltern;
      if (gesehen.has(schluessel)) continue;
      gesehen.add(schluessel);
      funde.push({ sel, eltern,
        grund: istFeld ? 'Eingabefeld' : nowrap ? 'white-space:nowrap' : 'flex:' + f });
    }
  }
  return { behaelter: behaelter.size, funde };
}

/* `.a .b:focus` -> `.a .b` · `.a .b::after` -> `.a .b` */
function grundform(sel){
  return sel.replace(/::?[a-z-]+(\([^)]*\))?/gi, '').trim();
}

const quelle = fs.readFileSync(HTML, 'utf8');
const regeln = quelle ? regelnLesen(quelle) : [];
if (!regeln.length){ console.log('X  Keine CSS-Regeln gefunden.'); process.exit(1); }

const { behaelter, funde } = suche(regeln);

console.log('=== Wer kann die Seite quer schieben? ===\n');
console.log('  ' + regeln.length + ' CSS-Regeln, davon ' + behaelter + ' Flex-Behaelter\n');

if (!funde.length){
  console.log('  ok   Jedes schrumpfbare Kind eines Flex-Behaelters hat eine Untergrenze.');
} else {
  for (const f of funde)
    console.log('  ⚠️  ' + f.grund.padEnd(20) + f.sel.padEnd(40) + ' in ' + f.eltern);
  console.log('\n  ' + funde.length + ' Kandidat(en) ohne `min-width`.');
}

/* ---------- Stoertest ----------
   ⛔ Ohne ihn beweist ein gruener Lauf nur, dass das Skript durchlief.
   Aus der ECHTEN Quelle wird eine bekannte Absicherung entfernt; die Stelle
   muss danach in der Liste stehen. [[stoertest_muss_wirkung_nachweisen]] */
/* ⚠️ Bis zum 11.09.2026 stand hier `.custom-cat-add input` — der Eichfall aus
   dem Anlass oben. Die Werkbank im Reiter „Eigene" gibt es nicht mehr (Elias:
   „weil ich das wirklich nicht nutze"), damit fiel der Stoertest aus und der
   Pruefer wurde ROT, statt still gruen zu bleiben — genau so soll es sein.
   Neuer Eichfall: das Eingabefeld der Regelkarte, dasselbe Muster (ein
   <input> in einem Flex-Behaelter, abgesichert durch `min-width:0`).
   ⚠️ NICHT `.suche-feld input`, obwohl naheliegend — der erste Versuch damit
   griff nicht: vor jener Regel steht ein Kommentar, und regelnLesen() nimmt
   ihn in den Selektor auf. Der Selektor beginnt dann mit „/*", und der
   Behaelter wird nicht erkannt. [[stoertest_muss_wirkung_nachweisen]] */
console.log('\n--- Stoertest: `min-width:0` bei `.rk-feld input` entfernt ---');
const ZIEL = '.rk-feld input';
const ohne = quelle.replace(/(\.rk-feld input,\.rk-feld textarea\{[^}]*?)min-width:0;/, '$1');
if (ohne === quelle){
  console.log('  X  Die Absicherung liess sich nicht entfernen — Stoertest wirkungslos.');
  process.exit(1);
}
const gestoert = suche(regelnLesen(ohne)).funde.some(f => f.sel === ZIEL);
console.log('  ' + (gestoert ? 'ok ' : 'X  ')
  + ZIEL + ' erscheint in der Liste, sobald die Untergrenze fehlt');

/* Und die Gegenprobe zum Stoertest: mit der Absicherung fehlt sie. */
const jetztDrin = funde.some(f => f.sel === ZIEL);
console.log('  ' + (!jetztDrin ? 'ok ' : 'X  ')
  + 'mit der Untergrenze steht sie NICHT drin (Eichung)');

/* ---------- ⛔ Was dieser Pruefer NICHT sieht ----------
   Er kennt nur die Verschachtelung, die im SELEKTOR steht. `.select-input`
   sitzt im Markup in `.setting-row` (einem Flex-Behaelter), aber der Selektor
   sagt das nicht — genau diese Stelle, einer der drei echten Funde vom
   09.09.2026, faellt hier also durch. Das gehoert in die AUSGABE und nicht nur
   in einen Kommentar: ein gruener Lauf beweist sonst mehr, als er gemessen
   hat. [[gruener_pruefer_beweist_nur_geprueftes]] */
const freieKlassen = suche(regelnLesen(quelle.replace(/min-width:0;max-width:100%;/g, '')))
  .funde.some(f => f.sel === '.select-input');
console.log('\n  ⛔ Grenze: Erkannt wird nur, was im SELEKTOR verschachtelt ist.');
console.log('     `.select-input` steht im Markup in `.setting-row` (flex), im CSS aber');
console.log('     allein — dieser Pruefer '
  + (freieKlassen ? 'sieht sie inzwischen doch.' : 'sieht sie NICHT.')
  + ' Die Messung im Browser bei');
console.log('     320 px bleibt deshalb Pflicht; sie steht im Kopf dieser Datei.');

const kaputt = !gestoert || jetztDrin;
console.log('\n' + (kaputt
  ? 'FEHLER: der Stoertest greift nicht — die Liste oben ist ohne Aussagekraft.'
  : funde.length
    ? funde.length + ' Kandidat(en) zum Ansehen — kein Urteil. Ob eine Stelle wirklich\n'
      + 'ueberlaeuft, sagt nur die Messung im Browser bei 320 px.'
    : 'Nichts offen.'));
/* ⚠️ Exitcode 0 auch mit Kandidaten: es ist eine Liste zum Ansehen. Rot wird
   es nur, wenn der Stoertest nicht greift — dann misst der Pruefer nichts.
   [[kandidatenliste_ist_keine_fehlerliste]] */
process.exit(kaputt ? 1 : 0);
