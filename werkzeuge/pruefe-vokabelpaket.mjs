#!/usr/bin/env node
/* pruefe-vokabelpaket.mjs — überschreibt ein eingelesenes Paket, was schon da ist?
 *
 * ⛔⛔ DER ANLASS: `js/vokabelpaket.js` (138 Zeilen) war die LETZTE Datei in
 * `js/`, die kein Pruefer nannte. Sie ist der Weg, auf dem Elias die acht
 * Lehrwerke auf ein Geraet bringt — 1,4 MB, die er von Hand uebertraegt und
 * einmal einliest.
 *
 * ⭐ Der Satz, um den es geht, steht als Kommentar im Quelltext:
 *
 *   „Bereits ausgelieferte Dateien gewinnen — sie sind die Quelle, an der
 *    validate.js und die Pruefskripte haengen."
 *
 * Faellt dieser Vorrang weg, ueberschreibt ein aelteres Paket die
 * ausgelieferten Daten — und danach messen ALLE Pruefer gegen einen Bestand,
 * den niemand mehr kontrolliert. Der Fehler waere still: die App liefe weiter,
 * nur mit anderen Woertern. [[eigener_bestand_vor_woerterbuch]]
 *
 * ⛔ Die echten Funktionen werden ausgeschnitten und ausgefuehrt.
 * [[testvorlage_selbst_nachgebaut]]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const V = fs.readFileSync(path.join(REPO, 'js', 'vokabelpaket.js'), 'utf8');

let fehler = 0;
const pruefe = (name, ist, soll) => {
  const ok = JSON.stringify(ist) === JSON.stringify(soll);
  if (!ok) { fehler++; console.log('  ⛔  ' + name + '\n        ist:  ' + JSON.stringify(ist) + '\n        soll: ' + JSON.stringify(soll)); }
  else console.log('  ok  ' + name);
};
const schneide = (name, art = 'function') => {
  const re = art === 'async'
    ? new RegExp('async function\\s+' + name + '\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}')
    : new RegExp('function\\s+' + name + '\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}');
  const m = V.match(re);
  if (!m) { console.log('⛔ ' + name + '() nicht auffindbar — hat js/vokabelpaket.js einen neuen Aufbau?'); process.exit(1); }
  return m[0];
};

/* ---------- Buehne ---------- */
function bauen(vorhandene) {
  const w = { VOKABELN: vorhandene ? JSON.parse(JSON.stringify(vorhandene)) : undefined };
  const quelle = 'let PAKET_STAND = null;\n'
    + schneide('paketEinhaengen') + '\n'
    + 'return { paketEinhaengen, stand: () => PAKET_STAND, fenster: window };';
  /* `BUECHER` bewusst NICHT definiert — genau der Live-Fall, in dem die
     ausgelieferte Datei fehlt. */
  return new Function('window', 'BUECHER', quelle)(w, undefined);
}

console.log('=== Nimmt es nur an, was ein Paket ist? ===\n');
{
  const b = bauen();
  pruefe('null wird abgelehnt', b.paketEinhaengen(null), false);
  pruefe('falsche Art wird abgelehnt', b.paketEinhaengen({ art: 'irgendwas', buecher: {} }), false);
  pruefe('ohne buecher wird abgelehnt', b.paketEinhaengen({ art: 'vokabelpaket' }), false);
  pruefe('ein richtiges Paket wird angenommen',
    b.paketEinhaengen({ art: 'vokabelpaket', buecher: { 'madina-1': [{ id: 1 }] } }), true);
}

console.log('\n=== ⛔ Gewinnen die ausgelieferten Dateien? ===\n');
{
  /* Der Kern: `madina-1` liegt schon vor (ausgeliefert), das Paket bringt eine
     ANDERE Fassung mit. Die ausgelieferte muss stehen bleiben. */
  const b = bauen({ 'madina-1': [{ id: 'AUSGELIEFERT' }] });
  b.paketEinhaengen({
    art: 'vokabelpaket',
    buecher: { 'madina-1': [{ id: 'AUS DEM PAKET' }], 'madina-2': [{ id: 'neu' }] },
  });
  pruefe('die ausgelieferte Fassung bleibt unangetastet',
    b.fenster.VOKABELN['madina-1'][0].id, 'AUSGELIEFERT');
  pruefe('ein Buch, das noch fehlte, kommt aus dem Paket',
    b.fenster.VOKABELN['madina-2'][0].id, 'neu');
}

console.log('\n=== Zaehlt der Stand, was wirklich drin ist? ===\n');
{
  const b = bauen();
  b.paketEinhaengen({
    art: 'vokabelpaket',
    erzeugt: '2026-09-01',
    buecher: {
      'madina-1': [{ id: 1 }, { id: 2 }, { id: 3 }],
      'madina-2': [{ id: 4 }],
      'leer':     [],                 /* leere Liste zaehlt NICHT */
      'kaputt':   'keine Liste',      /* und eine Nicht-Liste auch nicht */
    },
  });
  pruefe('zwei Buecher, vier Vokabeln', [b.stand().buecher, b.stand().vokabeln], [2, 4]);
  pruefe('das Erzeugungsdatum wird mitgefuehrt', b.stand().erzeugt, '2026-09-01');
}

console.log('\n=== Sagt das Einlesen in Klartext, was nicht stimmt? ===\n');
{
  const einlesen = new Function('return (' + schneide('paketEinlesen', 'async')
    .replace(/^async function\s+paketEinlesen/, 'async function') + ');')();
  const datei = (t) => ({ text: async () => t });
  const versuch = async (was, inhalt, wort) => {
    try { await einlesen(datei(inhalt)); pruefe(was, 'kein Fehler geworfen', 'Fehler mit „' + wort + '"'); }
    catch (e) { pruefe(was, e.message.includes(wort), true); }
  };
  await versuch('kaputtes JSON → „keine lesbare Paketdatei"', '{kein json', 'lesbare Paketdatei');
  await versuch('falsche Art → „kein Vokabelpaket"', JSON.stringify({ art: 'anderes' }), 'kein Vokabelpaket');
  await versuch('ohne Buecher → „keine Buecher"', JSON.stringify({ art: 'vokabelpaket', buecher: {} }), 'keine Buecher');
}

console.log('\n=== Stoertest ===\n');
{
  /* Eine Fassung OHNE den Vorrang — die Probe muss den Unterschied sehen. */
  const ohneVorrang = (paket, vorhandene) => {
    Object.entries(paket.buecher).forEach(([slug, liste]) => { vorhandene[slug] = liste; });
    return vorhandene;
  };
  const r = ohneVorrang({ buecher: { 'madina-1': [{ id: 'AUS DEM PAKET' }] } }, { 'madina-1': [{ id: 'AUSGELIEFERT' }] });
  pruefe('ohne Vorrang wuerde die ausgelieferte Fassung ueberschrieben',
    r['madina-1'][0].id, 'AUS DEM PAKET');
}

console.log('');
console.log(fehler ? '⛔ ' + fehler + ' Befund(e).' : '✅ Das Paket ergaenzt, es ueberschreibt nicht.');
process.exit(fehler ? 1 : 0);
