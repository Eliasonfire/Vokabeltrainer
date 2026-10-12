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
const schneide = (name, art = 'function', quelle = V) => {
  const re = art === 'async'
    ? new RegExp('async function\\s+' + name + '\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}')
    : new RegExp('function\\s+' + name + '\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}');
  const m = quelle.match(re);
  if (!m) { console.log('⛔ ' + name + '() nicht auffindbar — hat js/vokabelpaket.js einen neuen Aufbau?'); process.exit(1); }
  return m[0];
};

/* ---------- Buehne ---------- */
function bauen(vorhandene) {
  const w = { VOKABELN: vorhandene ? JSON.parse(JSON.stringify(vorhandene)) : undefined };
  const quelle = 'let PAKET_STAND = null; const PAKET_SLUGS = new Set();\n'
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

console.log('\n=== ⛔ Reihenfolge des App-Starts: erst das Paket, dann das Buch ===\n');
{
  /* ⛔ DER ABSCHNITT DARUEBER HAT DAS NICHT GEMESSEN (12.10.2026). Er stellt
     ein Buch auf die Buehne, das „schon ausgeliefert" ist, und haengt dann das
     Paket ein. In der App ist es umgekehrt: PAKET_BEREIT haengt das Paket ein,
     BEVOR setzeBuch() irgendein Buch laedt - und ladeBuchDatei() nahm bis v668,
     was schon dastand. Gemessen mit genau dieser Buehne: mit eingelesenem Paket
     0 Dateianfragen, die App zeigte das Paket. Auf einem solchen Geraet waere
     kein neues Kapitel und kein Wechsel auf die Ersatzdatenbank angekommen.
     [[gruener_pruefer_beweist_nur_geprueftes]]

     Hier laufen beide echten Funktionen in der Reihenfolge des Starts. Die
     „ausgelieferte Datei" ist ein Skript-Element; `datei` sagt, was beim
     Anhaengen passiert:
       'kommt'  die Datei setzt window.VOKABELN[slug] und meldet load
       'fehlt'  error (kein Netz und nichts im Vorrat, oder nicht ausgeliefert)
       'leer'   load, aber nichts gesetzt (etwa eine Anmeldeseite statt der Datei)
     Ergebnis je Lauf: was die App zeigt · Dateianfragen beim ersten Laden ·
     Dateianfragen beim zweiten. */
  const B = fs.readFileSync(path.join(REPO, 'js', 'buecher.js'), 'utf8');
  const echt = schneide('ladeBuchDatei', 'function', B);
  const start = async (mitPaket, datei, ladeQuelle = echt) => {
    const fenster = {};
    let anfragen = 0;
    const dokument = { createElement: () => ({}), head: { appendChild: (s) => {
      anfragen++;
      if (datei === 'fehlt') return s.onerror();
      if (datei === 'kommt') { fenster.VOKABELN = fenster.VOKABELN || {}; fenster.VOKABELN['madina-1'] = [{ id: 'AUSGELIEFERT' }]; }
      s.onload();
    } } };
    const f = new Function('window', 'document',
      'let PAKET_STAND = null; const PAKET_SLUGS = new Set(); const KORAN_BUCH = "koran-haeufig";\n'
      + 'const buchInfo = slug => ({ slug, datei: "data/vokabeln-" + slug + ".js" }); const koranKarten = () => [];\n'
      + schneide('paketEinhaengen') + '\n' + ladeQuelle + '\n'
      + 'return { paketEinhaengen, ladeBuchDatei };')(fenster, dokument);
    if (mitPaket) f.paketEinhaengen({ art: 'vokabelpaket', buecher: { 'madina-1': [{ id: 'AUS DEM PAKET' }] } });
    let zeigt;
    try { zeigt = (await f.ladeBuchDatei('madina-1'))[0].id; } catch { return ['FEHLER', anfragen, 0]; }
    const erste = anfragen;
    await f.ladeBuchDatei('madina-1');
    return [zeigt, erste, anfragen - erste];
  };
  pruefe('Paket eingelesen UND Datei ausgeliefert: die Datei gewinnt, danach keine Anfrage mehr',
    await start(true, 'kommt'), ['AUSGELIEFERT', 1, 0]);
  pruefe('Paket eingelesen, die Datei kommt nicht: das Paket traegt',
    await start(true, 'fehlt'), ['AUS DEM PAKET', 1, 1]);
  pruefe('Paket eingelesen, statt der Datei kommt etwas Leeres: das Paket traegt',
    await start(true, 'leer'), ['AUS DEM PAKET', 1, 1]);
  pruefe('kein Paket, Datei ausgeliefert: wie bisher eine Anfrage, dann keine',
    await start(false, 'kommt'), ['AUSGELIEFERT', 1, 0]);
  pruefe('kein Paket, keine Datei: das Buch fehlt (Fehler, kein leeres Buch)',
    await start(false, 'fehlt'), ['FEHLER', 1, 0]);
  /* Stoertest: die Fassung bis v668 - „steht schon etwas da, nimm es". */
  const VORRANG = 'if (vorhanden && !ausPaket) return fertig(vorhanden);';
  if (!echt.includes(VORRANG)) { console.log('⛔ Stoertest: die Zeile mit dem Vorrang steht nicht mehr so in ladeBuchDatei() — Pruefer anpassen.'); process.exit(1); }
  pruefe('Stoertest: ohne den Vorrang der Datei zeigte die App das Paket, ohne je anzufragen',
    await start(true, 'kommt', echt.replace(VORRANG, 'if (vorhanden) return fertig(vorhanden);')), ['AUS DEM PAKET', 0, 0]);
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
