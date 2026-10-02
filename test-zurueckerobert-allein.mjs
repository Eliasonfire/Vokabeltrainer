/* test-zurueckerobert-allein.mjs — eine zurückgeholte Karte bekommt NUR „Zurückerobert"
 *
 *   node test-zurueckerobert-allein.mjs
 *
 * ⛔ DER SATZ, DEN DIESER TEST BEWACHT — Elias am 02.10.2026. Erst die Meldung:
 *
 *   „da war eine vokabel die von der 5ten in die 4te box kam und jetzt habe ich
 *    sie wieder zurück in die 5ten gepackt. dabei haben sich zwei
 *    benachrichtigungen überlappt einmal müsste es ,,sitzt" und "zurück" oder
 *    sowas sein. das soll jedenfalls nicht so sein."
 *
 * v639 stellte die zwei Meldungen untereinander. Auf meine Frage danach —
 * „Soll bei einer zurückgeholten Karte nur ‚Zurückerobert' kommen? Dann fällt
 * das Konfetti weg." — er: „ja".
 *
 * Was geprüft wird, mit dem ECHTEN js/feier.js (ganz geladen, nichts nachgebaut;
 * nur die vier Zeichen-Werkzeuge schreiben mit, statt zu zeichnen) und der
 * echten Aufrufstelle in rate() (js/lernen.js):
 *
 *   A  Seine Karte: aus Box 5 gefallen, wieder in Box 5 → genau EIN Banner,
 *      „Zurückerobert", kein „Sitzt!", kein Konfetti. Die Marke box5-<id> steht
 *      trotzdem — sonst käme „Sitzt!" beim nächsten Mal nach.
 *   B  Die Premiere bleibt: eine Karte, die nie gefallen war, bekommt „Sitzt!"
 *      mit Konfetti — genau einmal.
 *   C  Aus Box 6 gefallen, erst in Box 5 angekommen: nichts (meine Ableitung,
 *      im Quelltext als solche gekennzeichnet); bei Box 6 dann „Zurückerobert".
 *   D  Unverändert: aus Box 4 gefallen und mit „leicht" ZUM ERSTEN MAL in Box 5
 *      → beide Meldungen (echte Premiere, danach hat er nicht gefragt).
 *   E  rate() sichert den Merker VOR dem Löschen und ruft feiereAnkunftBoxFuenf()
 *      mit ihm auf; die alte Zeile mit feiere('box-5', …) steht dort nicht mehr.
 *
 * Störtests am echten Quelltext — jeder MUSS rot werden:
 *   1. feiereAnkunftBoxFuenf() fragt den Merker nicht mehr (feiert immer)
 *   2. feierStill() setzt die Marke nicht
 *   3. rate() sichert den Merker erst NACH dem Löschen
 *   4. rate() ruft wieder feiere('box-5', …) direkt auf
 *
 * Exit 0 = hält · 1 = Befund oder wirkungsloser Störtest
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const REPO = path.dirname(fileURLToPath(import.meta.url));
const lies = f => fs.readFileSync(path.join(REPO, f), 'utf8');

/* Lädt js/feier.js GANZ in eine eigene Umgebung. Was die Datei beim Laden und
   in den Effekten vom Rest der App braucht, steht hier als Attrappe; die vier
   Zeichen-Werkzeuge werden NACH dem Laden durch Mitschreiber ersetzt. */
function umgebung(feierQuelle){
  const protokoll = [];
  const speicher = {};
  const element = () => ({ style: {}, classList: { add(){}, remove(){} }, appendChild(){}, remove(){},
    querySelectorAll: () => [], getContext: () => null, offsetHeight: 0, offsetTop: 0, offsetWidth: 0 });
  const ctx = vm.createContext({
    console,
    LS: { get: (k, d) => (k in speicher ? speicher[k] : d), set: (k, v) => { speicher[k] = v; } },
    todayStr: () => '2026-10-02',
    escapeHtml: s => String(s),
    REDUCED_MOTION: false,
    document: { getElementById: () => null, createElement: element, body: element(), querySelector: () => null,
      addEventListener(){}, documentElement: element(), hidden: false },
    window: { addEventListener(){}, matchMedia: () => ({ matches: false, addEventListener(){} }), innerWidth: 400, innerHeight: 800 },
    setTimeout: () => 0, clearTimeout(){}, requestAnimationFrame: () => 0,
    protokoll,
  });
  vm.runInContext(feierQuelle, ctx, { filename: 'js/feier.js' });
  vm.runInContext(`
    feierBanner   = (text) => { protokoll.push('banner:' + text); };
    feierKonfetti = () => { protokoll.push('konfetti'); };
    feierPuls     = () => {};
    feierChip     = (text) => { protokoll.push('chip:' + text); };
    feierNotiz    = () => {};
  `, ctx);
  return { ctx, protokoll, speicher,
    lauf: code => vm.runInContext(code, ctx),
    marken: () => vm.runInContext('Object.keys(FEIERN)', ctx) };
}

/* Die Aufrufstelle, wie sie in rate() steht: erst die Ankunft in Box 5, dann
   die Rückkehr. `zurueck` ist das, was rate() als `zurueckerobert` errechnet. */
function antwort(u, { id, von, nach, rueckfall }){
  const zurueck = (rueckfall && nach >= rueckfall) ? rueckfall : 0;
  u.protokoll.length = 0;
  u.lauf(`feiereAnkunftBoxFuenf({ id: ${id}, ar: 'wort${id}' }, ${von}, ${nach}, ${rueckfall || 0});`);
  if (zurueck) u.lauf(`feiere('wort-zurueck', { wort: 'wort${id}', box: ${zurueck} });`);
  return u.protokoll.slice();
}

function pruefeAlles(feierQuelle, lernenQuelle){
  const befunde = [];
  const pruefe = (was, ok, ist) => { if (!ok) befunde.push(was + (ist !== undefined ? ' — ist: ' + JSON.stringify(ist) : '')); };
  let u;
  try { u = umgebung(feierQuelle); }
  catch (e) { return ['js/feier.js lässt sich nicht laden: ' + e.message]; }
  if (u.lauf('typeof feiereAnkunftBoxFuenf') !== 'function') return ['feiereAnkunftBoxFuenf() fehlt in js/feier.js'];

  /* A — seine Karte */
  let p = antwort(u, { id: 7, von: 4, nach: 5, rueckfall: 5 });
  pruefe('A: genau ein Banner, „Zurückerobert"', p.filter(x => x.startsWith('banner:')).join('|') === 'banner:Zurückerobert', p);
  pruefe('A: kein Konfetti', !p.includes('konfetti'), p);
  pruefe('A: die Marke box5-7 steht trotzdem', u.marken().includes('box5-7'), u.marken());
  /* … und beim zweiten Mal (wieder gefallen, wieder zurück) dasselbe */
  p = antwort(u, { id: 7, von: 4, nach: 5, rueckfall: 5 });
  pruefe('A: auch beim zweiten Zurückholen nur „Zurückerobert"', p.join('|') === 'banner:Zurückerobert', p);
  /* … und sollte der Merker einmal fehlen, hält die Marke „Sitzt!" zurück */
  p = antwort(u, { id: 7, von: 4, nach: 5, rueckfall: 0 });
  pruefe('A: ohne Merker kommt „Sitzt!" nicht nach (Marke steht)', p.length === 0, p);

  /* B — die Premiere */
  p = antwort(u, { id: 8, von: 4, nach: 5, rueckfall: 0 });
  pruefe('B: Premiere zeigt „Sitzt!"', p.includes('banner:Sitzt!'), p);
  pruefe('B: Premiere mit Konfetti', p.includes('konfetti'), p);
  p = antwort(u, { id: 8, von: 4, nach: 5, rueckfall: 0 });
  pruefe('B: die Premiere gibt es nur einmal', p.length === 0, p);
  p = antwort(u, { id: 11, von: 4, nach: 6, rueckfall: 0 });
  pruefe('B: „leicht" aus Box 4 in Box 6 ist auch eine Premiere', p.includes('banner:Sitzt!'), p);

  /* C — aus Box 6 gefallen */
  p = antwort(u, { id: 9, von: 4, nach: 5, rueckfall: 6 });
  pruefe('C: aus Box 6 gefallen, in Box 5 angekommen: nichts', p.length === 0, p);
  pruefe('C: die Marke box5-9 steht', u.marken().includes('box5-9'), u.marken());
  p = antwort(u, { id: 9, von: 5, nach: 6, rueckfall: 6 });
  pruefe('C: bei Box 6 dann „Zurückerobert", sonst nichts', p.join('|') === 'banner:Zurückerobert', p);

  /* D — echte Premiere, die mit einer Rückkehr zusammenfällt */
  p = antwort(u, { id: 10, von: 3, nach: 5, rueckfall: 4 });
  pruefe('D: aus Box 4 gefallen, zum ersten Mal in Box 5: beide Meldungen',
    p.includes('banner:Sitzt!') && p.includes('banner:Zurückerobert') && p.includes('konfetti'), p);

  /* Keine Ankunft in Box 5 — dann darf gar nichts geschehen */
  for (const [von, nach] of [[5, 6], [4, 4], [5, 4], [2, 3], [6, 5]]){
    u.protokoll.length = 0;
    u.lauf(`feiereAnkunftBoxFuenf({ id: 99, ar: 'x' }, ${von}, ${nach}, 0);`);
    pruefe(`keine Ankunft (${von}→${nach}): nichts`, u.protokoll.length === 0 && !u.marken().includes('box5-99'), u.protokoll.slice());
  }

  /* E — die Aufrufstelle in rate() */
  const iSichern = lernenQuelle.indexOf('const rueckfallVorher = p.rueckfall || 0;');
  const iLoeschen = lernenQuelle.indexOf('delete p.rueckfall;');
  const iAufruf = lernenQuelle.indexOf('feiereAnkunftBoxFuenf(w, boxVorher, p.box, rueckfallVorher);');
  pruefe('E: rate() sichert den Merker', iSichern > 0);
  pruefe('E: … und zwar VOR dem Löschen', iSichern > 0 && iLoeschen > iSichern, { iSichern, iLoeschen });
  pruefe('E: rate() ruft feiereAnkunftBoxFuenf() mit dem gesicherten Merker auf', iAufruf > iLoeschen && iLoeschen > 0, { iAufruf, iLoeschen });
  pruefe("E: die alte Zeile feiere('box-5', …) steht nicht mehr in js/lernen.js", !/feiere\(\s*'box-5'/.test(lernenQuelle));
  const iZurueck = lernenQuelle.indexOf("feiere('wort-zurueck'");
  pruefe('E: „Zurückerobert" wird weiter ausgelöst, und zwar nach der Ankunft', iZurueck > iAufruf && iAufruf > 0, { iZurueck, iAufruf });

  return befunde;
}

const FEIER = lies('js/feier.js');
const LERNEN = lies('js/lernen.js');

const befunde = pruefeAlles(FEIER, LERNEN);
console.log('test-zurueckerobert-allein.mjs');
if (befunde.length){
  console.log('❌ ' + befunde.length + ' Befund(e):');
  befunde.forEach(b => console.log('   - ' + b));
} else {
  console.log('✅ Eine zurückgeholte Karte bekommt nur „Zurückerobert"; die Premiere bleibt.');
}

/* ---------- Störtests: jede Verfälschung des echten Quelltexts muss auffallen ---------- */
function ersetze(quelle, alt, neu, name){
  if (!quelle.includes(alt)) throw new Error('Störtest ' + name + ': Stelle nicht gefunden — der Quelltext hat sich geändert, den Störtest nachziehen');
  return quelle.replace(alt, neu);
}
const STOER = [
  ['1 feiereAnkunftBoxFuenf() fragt den Merker nicht mehr',
    () => [ersetze(FEIER, 'if (rueckfallVorher >= 5){', 'if (false){', '1'), LERNEN]],
  ['2 feierStill() setzt die Marke nicht',
    () => [ersetze(FEIER, 'if (!FEIERN[marke]) feierMerken(marke);\n}\n\nfunction feiereAnkunftBoxFuenf', '}\n\nfunction feiereAnkunftBoxFuenf', '2'), LERNEN]],
  ['3 rate() sichert den Merker erst nach dem Löschen',
    () => {
      let q = ersetze(LERNEN, '  const rueckfallVorher = p.rueckfall || 0;\n', '', '3a');
      q = ersetze(q, 'delete p.rueckfall;', 'delete p.rueckfall;\n  const rueckfallVorher = p.rueckfall || 0;', '3b');
      return [FEIER, q];
    }],
  ["4 rate() ruft wieder feiere('box-5', …) direkt auf",
    () => [FEIER, ersetze(LERNEN, 'feiereAnkunftBoxFuenf(w, boxVorher, p.box, rueckfallVorher);',
      "if (p.box >= 5 && boxVorher < 5) feiere('box-5', { id: w.id, wort: w.ar, box: p.box });", '4')]],
];
let stumm = 0;
for (const [name, bau] of STOER){
  let rot;
  try { const [f, l] = bau(); rot = pruefeAlles(f, l).length > 0; }
  catch (e) { console.log('   ⛔ ' + e.message); rot = false; }
  console.log((rot ? '   ✅ Störtest wird rot: ' : '   ❌ Störtest bleibt GRÜN: ') + name);
  if (!rot) stumm++;
}

process.exit(befunde.length || stumm ? 1 : 0);
