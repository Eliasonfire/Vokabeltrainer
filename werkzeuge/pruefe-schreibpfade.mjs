/* pruefe-schreibpfade.mjs — wer ueberschreibt Lerninhalt ohne Zwischenschritt?
 * ==========================================================================
 *
 * ⛔ DIE REGEL: nie direkt auf eine bestehende Datei schreiben. Bricht der
 * Lauf mitten im Schreiben ab, steht dort eine LEERE Datei — und eine leere
 * Datei besteht jeden Test. [[leere_datei_besteht_jeden_test]]
 *
 * Sicher ist: erst daneben schreiben, dann umbenennen. `rename` ist auf
 * demselben Laufwerk unteilbar — entweder die alte Datei oder die neue, nie
 * eine halbe.
 *
 * ==========================================================================
 * ⚠️ „writeFileSync ohne .neu" ist noch KEIN Befund
 *
 * Die meisten Werkzeuge ERZEUGEN eine Datei (Artefaktseiten, JSON-Ausgaben).
 * Dort ist direktes Schreiben richtig, und eine Liste, die sie alle meldet,
 * bestuende zu vier Fuenfteln aus Nicht-Fehlern — und wuerde ab dem dritten
 * Lauf ueberlesen. [[kandidatenliste_ist_keine_fehlerliste]]
 *
 * ⭐ Das Kennzeichen fuer „bestehender Inhalt" ist ein anderes: dieselbe
 * Datei wird im selben Werkzeug erst GELESEN und dann geschrieben.
 *
 * Am 21.08.2026 gemessen: 67 Werkzeuge, 18 solche Stellen. Sechs trugen
 * Lerninhalt oder App-Code und sind seitdem abgesichert:
 *
 *     grammar-data.js         95 Regeln, 587 Markierungen   (2 Werkzeuge)
 *     vocab-data.js           171 Lernwoerter
 *     data/eselsbruecken-alt.js  ·  data/eselsbruecken.js
 *     js/kern.js              die Freischaltliste
 *     surah-data.js           114 Surennamen                (2 Werkzeuge)
 *
 * ⚠️ Sie liegen in git, ein Verlust waere behebbar. Aber die Wartungsroutine
 * macht danach `git add -A; git commit` — dann ist der Schaden committet.
 *
 * Aufruf:  node werkzeuge/pruefe-schreibpfade.mjs
 * Exitcode 2 = eine NEUE Stelle schreibt direkt auf Lerninhalt.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER   = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.resolve(HIER, '..');

/* Was zaehlt als Lerninhalt oder App-Code? Am Bezeichner erkannt, weil der
   Pfad im Quelltext oft zusammengesetzt ist. */
const KOSTBAR = /grammar-data|vocab-data|eselsbruecken|kern\.js|surah-data|lehrbuch-saetze|beispielsaetze|fachbegriffe|wortfelder|quran-text/i;

/* Zustandsdateien: klein, bei jedem Lauf neu geschrieben, ein Verlust kostet
   den Stand einer Schicht — keinen Lerninhalt. ⛔ Diese Liste waechst nur mit
   einer Begruendung. */
const ZUSTAND = {
  '.arbeit.json':            'die Abbruchmarke — wird bei jedem Lauf neu gesetzt',
  '.budget.json':            'das Haushaltsbuch — Stand einer Schicht, kein Inhalt',
  '.vokabelpaket-stand.json':'Zwischenstand des Paketbaus',
  'entwuerfe.json':          'Zwischenstand der Regelkette',
  'export-index':            'wird aus dem Bestand erzeugt'
};

const dateien = [];
for (const d of [path.join(WURZEL, 'werkzeuge'), WURZEL]){
  let e; try { e = fs.readdirSync(d); } catch { continue; }
  for (const f of e){
    if (!/\.(mjs|js)$/.test(f)) continue;
    if (d === WURZEL && !/^(pruefe-|validate)/.test(f)) continue;
    dateien.push(path.join(d, f));
  }
}

const befunde = [];
for (const datei of dateien){
  const t = fs.readFileSync(datei, 'utf8');
  const zeilen = t.split(/\r?\n/);

  const gelesen = new Set();
  for (const m of t.matchAll(/readFileSync\(\s*([A-Za-z_$][\w$]*)/g)) gelesen.add(m[1]);

  for (let i = 0; i < zeilen.length; i++){
    const m = /writeFileSync\(\s*([A-Za-z_$][\w$]*)\s*[,)]/.exec(zeilen[i]);
    if (!m) continue;
    const ziel = m[1];
    if (!gelesen.has(ziel)) continue;
    const umfeld = zeilen.slice(Math.max(0, i - 4), i + 5).join(' ');
    if (/renameSync/.test(umfeld)) continue;

    /* Worauf zeigt der Bezeichner? Die Zuweisung im selben Werkzeug suchen. */
    const zu = new RegExp('(?:const|let|var)\\s+' + ziel + '\\s*=\\s*([^;\\n]+)').exec(t);
    const wohin = zu ? zu[1] : '';
    if (Object.keys(ZUSTAND).some(k => wohin.includes(k))) continue;
    if (!KOSTBAR.test(wohin)) continue;      /* kein Lerninhalt — kein Befund */

    befunde.push({ datei: path.relative(WURZEL, datei), zeile: i + 1, ziel, wohin: wohin.slice(0, 70) });
  }
}

console.log(dateien.length + ' Werkzeuge durchgesehen.');
console.log('');
if (!befunde.length){
  console.log('✅ Keine Stelle schreibt direkt auf Lerninhalt oder App-Code.');
  process.exit(0);
}
console.log('⛔ ' + befunde.length + ' Stelle(n) ueberschreiben Lerninhalt OHNE Zwischenschritt:');
for (const b of befunde){
  console.log('   ' + b.datei + ':' + b.zeile + '   ' + b.ziel + ' = ' + b.wohin);
}
console.log('');
console.log('   Abhilfe:  fs.writeFileSync(X + ".neu", inhalt);  fs.renameSync(X + ".neu", X);');
process.exit(2);
