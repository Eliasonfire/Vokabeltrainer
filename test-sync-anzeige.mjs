/* Prueft die Anzeige-Seite des Geraeteabgleichs: das Warnband auf der alten
 * Adresse, die Einstellungs-Zeile und die Statuszeile.
 *
 * ⚠️ WARUM NICHT IM BROWSER: die entscheidende Verzweigung haengt am Hostnamen.
 * Im Browser-Pane laeuft die Datei unter einer einzigen Adresse; ob das Band auf
 * github.io erscheint UND auf der neuen Adresse ausbleibt, ist dort schlicht
 * nicht messbar. Hier laesst sich der Host setzen.
 *
 * ⚠️ vm-Falle (aus dem Gedaechtnis, 04.08.2026): `const`/`function` in einer per
 * runInContext ausgefuehrten Datei sind LEXIKALISCH und liegen NICHT am
 * Kontextobjekt. Sie sind nur ueber vm.runInContext('NAME', ctx) erreichbar.
 */
import fs from 'node:fs';
import vm from 'node:vm';

const QUELLE = fs.readFileSync(new URL('./js/sync.js', import.meta.url), 'utf8');

let ok = 0, schlecht = 0;
function pruefe(was, bedingung, zusatz){
  if (bedingung){ ok++; console.log('  ok   ' + was); }
  else { schlecht++; console.log('  FEHL ' + was + (zusatz ? '  → ' + zusatz : '')); }
}

/* ---------- Ein sehr kleines DOM, nur so viel wie sync.js anfasst ---------- */
function baueUmgebung(host, protokoll = 'https:'){
  const knoten = {
    altAdresse : { hidden: true, id: 'altAdresse' },
    syncZeile  : { hidden: true, id: 'syncZeile' },
    syncStand  : { textContent: '', id: 'syncStand' },
    btnAbgleich: { textContent: 'Jetzt abgleichen', disabled: false,
                   addEventListener(){}, id: 'btnAbgleich' },
  };
  const speicher = new Map();
  const zuhoerer = {};

  const ctx = {
    console,
    location: { hostname: host, protocol: protokoll },
    navigator: { onLine: true },
    document: {
      getElementById: id => knoten[id] || null,
      addEventListener: (art, fn) => { zuhoerer[art] = fn; },
    },
    localStorage: {
      getItem: k => (speicher.has(k) ? speicher.get(k) : null),
      setItem: (k, v) => speicher.set(k, String(v)),
    },
    setTimeout, clearTimeout,
    fetch: async () => { throw new Error('kein Netz im Pruefstand'); },
    Date, JSON, Object, Set, Error, Number, String,
  };
  vm.createContext(ctx);
  vm.runInContext(QUELLE, ctx);
  return { ctx, knoten, speicher, zuhoerer };
}

/* ---------- 1. Host-Erkennung ---------- */
console.log('\n1. Auf welcher Adresse ist der Abgleich vorgesehen?');
const faelle = [
  ['eliasonfire.github.io',        'https:', true,  false],
  ['vokabeltrainer.elias-lueck.de','https:', false, true ],
  ['vokabeltrainer.pages.dev',     'https:', false, true ],
  ['localhost',                    'http:',  false, true ],
  ['eliasonfire.github.io',        'file:',  true,  false],
  ['github.io',                    'https:', true,  false],
  ['notgithub.io',                 'https:', false, true ],
];
for (const [host, prot, altErwartet, syncErwartet] of faelle){
  const { ctx } = baueUmgebung(host, prot);
  const alt  = vm.runInContext('aufAlterAdresse()', ctx);
  const sync = vm.runInContext('syncMoeglich()', ctx);
  pruefe(`${host} (${prot}) → alt=${altErwartet}, sync=${syncErwartet}`,
         alt === altErwartet && sync === syncErwartet, `alt=${alt}, sync=${sync}`);
}

/* ---------- 2. Was DOMContentLoaded ein-/ausblendet ---------- */
console.log('\n2. Warnband und Einstellungs-Zeile');
{
  const a = baueUmgebung('eliasonfire.github.io');
  a.zuhoerer.DOMContentLoaded();
  pruefe('alte Adresse: Warnband sichtbar',        a.knoten.altAdresse.hidden === false);
  pruefe('alte Adresse: Abgleich-Zeile bleibt weg', a.knoten.syncZeile.hidden === true);

  const b = baueUmgebung('vokabeltrainer.elias-lueck.de');
  b.zuhoerer.DOMContentLoaded();
  pruefe('neue Adresse: KEIN Warnband',            b.knoten.altAdresse.hidden === true);
  pruefe('neue Adresse: Abgleich-Zeile sichtbar',  b.knoten.syncZeile.hidden === false);
}

/* ---------- 3. Statuszeile ---------- */
console.log('\n3. Statuszeile — sagt sie, was wirklich war?');
{
  const a = baueUmgebung('eliasonfire.github.io');
  a.zuhoerer.DOMContentLoaded();
  pruefe('alte Adresse meldet nicht "Fehler", sondern den Grund',
    /nicht vorgesehen/.test(a.knoten.syncStand.textContent), a.knoten.syncStand.textContent);

  /* Fehlschlag auf der neuen Adresse: fetch wirft im Pruefstand. */
  const b = baueUmgebung('vokabeltrainer.elias-lueck.de');
  b.zuhoerer.DOMContentLoaded();
  /* gleicheAb() ist asynchron - zwei Zyklen warten, bis der Fehler durch ist. */
  await new Promise(r => setImmediate(r));
  await new Promise(r => setImmediate(r));
  pruefe('Fehlschlag wird als Warnung mit Grund angezeigt',
    b.knoten.syncStand.textContent.startsWith('⚠'), b.knoten.syncStand.textContent);

  /* Erfolgsfall von Hand setzen und die Wortzahl pruefen. */
  const c = baueUmgebung('vokabeltrainer.elias-lueck.de');
  c.speicher.set('vt_progress', JSON.stringify({ a:{box:1}, b:{box:2}, c:{box:5} }));
  vm.runInContext('merkeStatus(true, wortzahl() + " Wörter")', c.ctx);
  pruefe('Erfolg nennt die Wortzahl',
    /^✓ .*— 3 Wörter$/.test(c.knoten.syncStand.textContent), c.knoten.syncStand.textContent);

  /* ⚠️ Der Fall, der frueher niemandem aufgefallen waere: kaputtes vt_progress
     darf die Anzeige nicht mitreissen. */
  const d = baueUmgebung('vokabeltrainer.elias-lueck.de');
  d.speicher.set('vt_progress', '{kaputt');
  let geflogen = false;
  try { vm.runInContext('wortzahl()', d.ctx); } catch (e){ geflogen = true; }
  pruefe('kaputtes vt_progress wirft nicht', !geflogen);
}

/* ---------- 4. Der Statusschluessel darf keinen Abgleich ausloesen ---------- */
console.log('\n4. Keine Schleife über den Statusschlüssel');
{
  const a = baueUmgebung('vokabeltrainer.elias-lueck.de');
  const vorher = vm.runInContext('SYNC_GEPLANT', a.ctx);
  vm.runInContext('syncGeaendert("vt_syncStatus")', a.ctx);
  vm.runInContext('syncGeaendert("vt_syncStempel")', a.ctx);
  const nachher = vm.runInContext('SYNC_GEPLANT', a.ctx);
  pruefe('vt_syncStatus und vt_syncStempel planen keinen Abgleich', vorher === nachher);
  vm.runInContext('syncGeaendert("vt_progress")', a.ctx);
  pruefe('vt_progress plant sehr wohl einen', vm.runInContext('SYNC_GEPLANT', a.ctx) !== nachher);
  clearTimeout(vm.runInContext('SYNC_GEPLANT', a.ctx));
}

console.log(`\n${ok} bestanden, ${schlecht} gescheitert.`);
process.exitCode = schlecht ? 1 : 0;
