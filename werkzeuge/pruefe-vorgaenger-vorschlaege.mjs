#!/usr/bin/env node
/* pruefe-vorgaenger-vorschlaege.mjs — erbt eine Buchkarte die Eselsbrücken der
 * Karte, die sie ersetzt hat?
 *
 * ⛔ DER ANLASS (23.09.2026, Nachtschicht): seine Diagnose vom 22.09. meldete
 * „nur EIN Vorschlag: لَحْمٌ Fleisch · كَسْلَانُ faul". Nachgemessen im
 * abgeschotteten Nachbau mit seinem Stand (KV 02:55): beide hatten NULL.
 * Beide sind Buchkarten (46039, 46054), die eine eigene Karte ersetzt haben
 * (tauscheDublette in js/kern.js). Deren Eselsbrücken hingen an der ALTEN
 * Kennung — mitgenommen wurden beim Tausch nur seine Notizen.
 * Seitdem: vorgaengerVon() in js/kern.js, das Erben in vorschlagsListe() in
 * js/lernen.js. Im Nachbau danach: 3 und 2 Vorschläge, vorschlaegeKnapp() leer.
 *
 * Die echten Funktionen werden ausgeschnitten und ausgeführt; der Störtest
 * nimmt das Erben heraus und muss die Probe kippen lassen.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KERN = fs.readFileSync(path.join(REPO, 'js', 'kern.js'), 'utf8');
const LERNEN = fs.readFileSync(path.join(REPO, 'js', 'lernen.js'), 'utf8');

let fehler = 0;
const pruefe = (name, ist, soll) => {
  const ok = JSON.stringify(ist) === JSON.stringify(soll);
  if (!ok){ fehler++; console.log('  ⛔  ' + name + '\n        ist:  ' + JSON.stringify(ist) + '\n        soll: ' + JSON.stringify(soll)); }
  else console.log('  ok  ' + name);
};
const schneide = (quelle, name) => {
  const m = quelle.match(new RegExp('function\\s+' + name + '\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}'));
  if (!m){ console.log('⛔ ' + name + '() nicht auffindbar'); process.exit(1); }
  return m[0];
};

const ERBEN_ANFANG = '  /* ---------- Die Buchkarte erbt von der Karte, die sie ersetzt hat';
function welt(lernenQuelle, { getauscht = [], progress = {}, abgeloest = {}, alt = {}, verworfen = [], vokabeln = [] } = {}){
  const ctx = {
    VOCAB_DATA: vokabeln,
    GETAUSCHT: new Map(getauscht),
    PROGRESS: progress,
    ABGELOESTE_MNEMO: new Map(Object.entries(abgeloest)),
    ESELSBRUECKEN_ALT: alt,
    istVorschlagVerworfen: (id, i, t) => verworfen.some(([vid, vt]) => vid === String(id) && vt === t),
    istPluralKarte: () => false,
    PLURAL_MARKE: '#pl',
  };
  vm.createContext(ctx);
  vm.runInContext(schneide(KERN, 'vorgaengerVon') + '\n' + schneide(lernenQuelle, 'vorschlagsListe')
    + '\nthis.vorschlagsListe = vorschlagsListe; this.vorgaengerVon = vorgaengerVon;', ctx);
  return ctx;
}

console.log('=== Erbt die Buchkarte die Eselsbrücken ihres Vorgängers? ===\n');
const BUCH = { id: '46039', ar: 'x' };            // keine eigene Eselsbrücke, wie im Buch
{
  const w = welt(LERNEN, { getauscht: [['alt-1', '46039']], vokabeln: [BUCH, { id: 'alt-1', mnemo: 'M' }],
                           alt: { 'alt-1': ['A1', 'A2'] } });
  pruefe('Tausch in DIESEM Lauf (GETAUSCHT): mnemo und Alternativen kommen an', w.vorschlagsListe(BUCH), ['M', 'A1', 'A2']);
}
{
  const w = welt(LERNEN, { progress: { 'alt-2': { uebertragen: '46039' } }, abgeloest: { 'alt-2': 'M2' },
                           alt: { 'alt-2': ['B1'] }, vokabeln: [BUCH] });
  pruefe('Tausch aus einem FRÜHEREN Lauf (uebertragen), alte Karte beim Start entfernt', w.vorschlagsListe(BUCH), ['M2', 'B1']);
}
{
  const w = welt(LERNEN, { getauscht: [['alt-1', '46039']], vokabeln: [BUCH, { id: 'alt-1', mnemo: 'M' }],
                           alt: { 'alt-1': ['A1', 'A2'] }, verworfen: [['alt-1', 'A1']] });
  pruefe('was er an der alten Karte verworfen hat, kommt nicht wieder', w.vorschlagsListe(BUCH), ['M', 'A2']);
}
{
  const eigen = { id: '46039', ar: 'x', mnemo: 'M' };
  const w = welt(LERNEN, { getauscht: [['alt-1', '46039']], vokabeln: [eigen, { id: 'alt-1', mnemo: 'M' }] });
  pruefe('derselbe Text steht nur einmal da', w.vorschlagsListe(eigen), ['M']);
}
{
  const w = welt(LERNEN, { vokabeln: [BUCH] });
  pruefe('ohne Vorgänger bleibt es, wie es war', w.vorschlagsListe(BUCH), []);
}

console.log('\n=== Störtest: hängt die Probe am echten Code? ===\n');
{
  const i = LERNEN.indexOf(ERBEN_ANFANG);
  const j = i >= 0 ? LERNEN.indexOf('  /* ---------- Pluralkarten erben vom Singular', i) : -1;
  pruefe('der Erb-Block steht in vorschlagsListe()', i >= 0 && j > i, true);
  if (i >= 0 && j > i){
    const ohne = LERNEN.slice(0, i) + LERNEN.slice(j);
    const w = welt(ohne, { getauscht: [['alt-1', '46039']], vokabeln: [BUCH, { id: 'alt-1', mnemo: 'M' }],
                           alt: { 'alt-1': ['A1'] } });
    pruefe('ohne den Erb-Block steht „Fleisch" wieder ohne Eselsbrücke da — die erste Probe fiele', w.vorschlagsListe(BUCH), []);
  }
}

console.log('');
console.log(fehler ? '⛔ ' + fehler + ' Befund(e).' : '✅ Eine Buchkarte erbt die Eselsbrücken der Karte, die sie ersetzt hat.');
process.exit(fehler ? 1 : 0);
