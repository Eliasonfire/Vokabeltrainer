/* Prueft die Aufgabenuhr (v628, 27.09.2026): die Zeit je Satzaufgabe zaehlt
 * zwischen zwei Beruehrungen hoechstens eine Minute, verborgene Zeit gar nicht.
 *
 * Elias: „ich will nicht das die app 1h aufzählt obwohl ich nichts gemacht
 * habe" — und auf den Vorschlag: „ja mach das aber teilweise denke ich schon
 * manchmal so eine oder zwei minuten nach, dann wird einfach eine minute
 * gezählt und passst dann eigentlich auch so oder".
 *
 * Die echten Funktionen aus js/zeitmessung.js, mit gestellter Uhr.
 */
import fs from 'node:fs';
import vm from 'node:vm';

const zm = fs.readFileSync(new URL('./js/zeitmessung.js', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const ueb = fs.readFileSync(new URL('./js/uebung.js', import.meta.url), 'utf8');

let ok = 0, schlecht = 0, stoer = false;
function pruefe(was, bedingung, zusatz){
  if (bedingung){ ok++; console.log('  ok   ' + was); }
  else { schlecht++; console.log('  FEHL ' + was + (zusatz ? '  → ' + zusatz : '')); }
}
function schneide(text, name){
  const a = text.indexOf('function ' + name + '(');
  if (a < 0) return null;
  let i = text.indexOf('{', a), t = 0;
  for (; i < text.length; i++){ if (text[i] === '{') t++; else if (text[i] === '}' && !--t) return text.slice(a, i + 1); }
  return null;
}
const zeile = re => (zm.match(re) || [])[0];
const teile = [zeile(/const ZEIT_RUHE_MS\s*=\s*\d+;/), zeile(/const AUFGABE_UHR = \{[^}]*\};/),
  ...['aufgabeUhrStart', 'aufgabeUhrFortschreiben', 'aufgabeUhrSekunden', 'aufgabeUhrSichtbarkeit'].map(n => schneide(zm, n))];
if (teile.some(t => !t)){ console.log('FEHL Aufgabenuhr im Quelltext nicht gefunden'); process.exit(1); }
const echt = teile.join('\n');

function uhr(quelle){
  const k = { T: 0, document: { visibilityState: 'visible' }, Math };
  k.Date = { now: () => k.T };
  vm.createContext(k);
  vm.runInContext(quelle, k);
  const ruf = n => vm.runInContext(n + '()', k);
  return { k, start: t => { k.T = t; ruf('aufgabeUhrStart'); }, beruehre: t => { k.T = t; ruf('aufgabeUhrFortschreiben'); },
    sicht: (t, zustand) => { k.T = t; k.document.visibilityState = zustand; ruf('aufgabeUhrSichtbarkeit'); },
    antwort: t => { k.T = t; return ruf('aufgabeUhrSekunden'); } };
}

console.log('\nAufgabenuhr');
{ const u = uhr(echt); u.start(0); u.beruehre(10000); pruefe('flüssig beantwortet: 20 s bleiben 20 s', u.antwort(20000) === 20); }
{ const u = uhr(echt); u.start(0); pruefe('2½ Minuten nichts angefasst: zählt 1 Minute', u.antwort(150000) === 60); }
{ const u = uhr(echt); u.start(0); u.beruehre(50000); u.beruehre(170000);
  pruefe('zwei Minuten nachgedacht (dazwischen): zählt als eine — 50 + 60 + 10 = 120 s', u.antwort(180000) === 120); }
{ const u = uhr(echt); u.start(0); u.sicht(5000, 'hidden'); u.sicht(300000, 'visible');
  pruefe('5 s, dann andere App bis 300 s, dann 10 s: zählt 15 s', u.antwort(310000) === 15); }

console.log('\nAngeschlossen');
const code = ueb.replace(/\/\*[\s\S]*?\*\//g, '');
pruefe('die Aufgabe startet die Uhr', /UEB\.startZeit = Date\.now\(\); if \(typeof aufgabeUhrStart === 'function'\) aufgabeUhrStart\(\);/.test(code));
pruefe('merkeUebZeit() bekommt die Aufgabenuhr', /merkeUebZeit\(art, typeof aufgabeUhrSekunden === 'function' \? aufgabeUhrSekunden\(\)/.test(code));
pruefe('jede Berührung schreibt die Uhr fort', /function zeitRegung\(\)\{ aufgabeUhrFortschreiben\(\);/.test(zm));
pruefe('der Wechsel in eine andere App wird bemerkt', /document\.addEventListener\('visibilitychange', aufgabeUhrSichtbarkeit\)/.test(zm));

console.log('\nStörtest: ohne die Minuten-Grenze');
{
  const kaputt = echt.replace('AUFGABE_UHR.ms += Math.min(Math.max(0, jetzt - AUFGABE_UHR.marke), ZEIT_RUHE_MS);\n  AUFGABE_UHR.marke = jetzt;\n}\nfunction aufgabeUhrSekunden',
    'AUFGABE_UHR.ms += Math.max(0, jetzt - AUFGABE_UHR.marke);\n  AUFGABE_UHR.marke = jetzt;\n}\nfunction aufgabeUhrSekunden');
  const u = uhr(kaputt); u.start(0);
  const n = u.antwort(150000);
  if (kaputt !== echt && n === 150) console.log(`  ok   greift (${n} s statt 60)`);
  else { stoer = true; console.log('  FEHL greift nicht (' + n + ')'); }
}

console.log(`\n${ok} bestanden, ${schlecht} gescheitert.`);
if (stoer){ console.log('⛔ Der Stoertest greift nicht — die Faelle oben sagen nichts.'); process.exitCode = 3; }
else process.exitCode = schlecht ? 1 : 0;
