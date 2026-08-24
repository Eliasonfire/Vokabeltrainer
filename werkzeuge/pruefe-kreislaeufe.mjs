/* pruefe-kreislaeufe.mjs -- was ist gebaut, aber nicht angeschlossen?
 *
 *   node werkzeuge/pruefe-kreislaeufe.mjs
 *
 * WARUM ES DAS GIBT (24.08.2026)
 * ==============================
 * Elias: „gibt es das vielleicht auch noch an anderen stellen die wir so in
 * der art haben? das waere nicht gut vorallem wenn wir es nicht bemerken."
 *
 * Anlass war `werkzeuge/vorschlaege-holen.mjs`: gebaut am 19.08.2026, tut
 * genau das Richtige — und niemand ruft es auf. Er tippt in der App auf
 * „Taugt nicht", der Stand wandert in den Abgleich, und dort bleibt er liegen.
 *
 * ⛔ DIESE FEHLERART MELDET SICH NIE VON SELBST. Alles sieht richtig aus: die
 * App speichert, der Abgleich synchronisiert, kein Werkzeug stuerzt ab. Es
 * passiert nur nichts. Genau deshalb braucht es eine Pruefung, die nicht nach
 * Fehlern sucht, sondern nach FEHLENDEN VERBINDUNGEN.
 *
 * Zwei Fragen, die sonst niemand stellt:
 *   1. Welchen Speicher der App wertet niemand aus?
 *   2. Welche erzeugte Datei ist aelter als ihre Quelle?
 *
 * ⚠️ Die dritte — „welches Werkzeug ruft niemand auf?" — stellt
 * `Automation/pruefe-freigaben.mjs` seit dem 18.08.2026 und fuehrt dafuer eine
 * eigene VON_HAND-Liste. Sie steht hier bewusst NICHT noch einmal: zwei Listen
 * ueber dieselbe Frage laufen auseinander, und die vergessene macht die andere
 * zur Luegnerin. [[dieselbe_frage_zwei_antworten]]
 *
 * ⚠️ JEDE AUSNAHME BRAUCHT IHREN GRUND. Eine Ausnahmeliste ohne Begruendung
 * wird zur Muellhalde: irgendwann steht alles darin und die Pruefung ist
 * gruen, ohne etwas zu pruefen. Deshalb ist der Grund hier Pflichtfeld —
 * wer etwas eintraegt, ohne ihn zu nennen, faellt selbst auf.
 * [[pruefwerkzeug_mit_eingebauter_antwort]]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HIER, '..');
const AUTO = path.join(REPO, '..', 'Automation');

const lies = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch { return ''; } };

/* ---------------------------------------------------------------- Ausnahmen
   Werkzeuge, die BEWUSST keinen Aufrufer haben. Jeder Eintrag nennt, warum. */

/* Speicher der App, die von aussen NICHT ausgewertet werden muessen. */
const SPEICHER_AUSNAHMEN = {
  'vt_settings':      'Einstellungen — die App liest sie selbst',
  'vt_settingsFeld':  'Zeitstempel je Feld, nur fuer den Abgleich',
  'vt_syncStatus':    'Zustand des letzten Abgleichs, reine Anzeige',
  'vt_syncStempel':   'Zeitstempel des Abgleichs',
  'vt_geloescht':     'Grabsteine fuer den Abgleich',
  'vt_feiern':        'welche Meilensteine schon gefeiert wurden',
  'vt_hoerTag':       'Tageszaehler des Hoermodus',
  'vt_lesestand':     'wo er im Leser stehengeblieben ist',
  'vt_quranFav':      'seine Lesezeichen im Quran',
  'vt_customCats':    'eigene Kategorien, reine Ansichtssache',
  'vt_bekannt':       'seine „kenne ich schon"-Auswahl — wirkt ueber istBekannt() in der App',
  'vt_streak':        'Serie; der Kalender darunter wertet sie aus',
  'vt_uebungstage':   'Uebungskalender, seit 21.08.2026 — die App zeichnet ihn selbst',
  'vt_vorschlagNr':   'welcher Vorschlag gerade gilt; die ABLEHNUNGEN stehen in vt_vorschlagWeg',
  'vt_einzeln_frei':  'einzeln freigeschaltete Woerter — nur in seinem Speicher, absichtlich',
  'vt_hifzVerse':     'seit 24.08.2026 ueber data/auswendig.json ausgewertet',
  'vt_hifz':          'seit 24.08.2026 ueber data/auswendig.json ausgewertet',
  'vt_notizen':       'seine eigenen Notizen zum Wort — seit 24.08.2026 in eigene-woerter.json unter `eigeneNotizen`',
};

/* Erzeugte Dateien und ihre Quellen: veraltet die eine gegen die andere? */
const ERZEUGNISSE = [
  { datei: 'artefakte/regeln.json', quellen: ['grammar-data.js', 'data/beispielsaetze.js'],
    werkzeug: 'werkzeuge/regeln-sammeln.mjs',
    zweck: 'Grundlage des Regelpruefungs-Artefakts' },
];

/* ------------------------------------------------------- Quellen einsammeln */
const quellen = [];
const sammle = (ordner, tiefe = 0) => {
  if (!fs.existsSync(ordner) || tiefe > 2) return;
  for (const e of fs.readdirSync(ordner, { withFileTypes: true })){
    if (['node_modules', '.git', '.deploy', 'logs', 'transcripts'].includes(e.name)) continue;
    const p = path.join(ordner, e.name);
    if (e.isDirectory()) sammle(p, tiefe + 1);
    else if (/\.(mjs|js|json|md)$/.test(e.name)) quellen.push(p);
  }
};
sammle(REPO);
sammle(path.join(AUTO, 'prompts'));
[path.join(AUTO, 'routines.json'), path.join(AUTO, 'README.md')]
  .filter(f => fs.existsSync(f)).forEach(f => quellen.push(f));

/* ⛔⛔ DIESE DATEI DARF SICH NICHT SELBST ALS BELEG ZAEHLEN.
   Beim ersten Lauf meldete die Pruefung „91 Werkzeuge, 1 ohne Aufrufer" statt
   17 — weil in der Ausnahmeliste oben JEDER Werkzeugname steht. Jeder Name
   war damit „irgendwo gefunden", und zwar hier. Dasselbe bei den Speichern:
   0 statt 15.

   Eine Pruefung, die ihre eigene Ausnahmeliste als Aufruf liest, kann nie rot
   werden. [[pruefwerkzeug_mit_eingebauter_antwort]] */
const SELBST = path.resolve(fileURLToPath(import.meta.url));
const quellenOhneSelbst = quellen.filter(q => path.resolve(q) !== SELBST);
if (quellenOhneSelbst.length === quellen.length){
  console.error('⛔ Diese Datei steht nicht in der eigenen Quellenliste — der');
  console.error('   Selbstausschluss greift ins Leere und die Zahlen unten sind falsch.');
  process.exit(3);
}
quellen.length = 0;
quellen.push(...quellenOhneSelbst);

let fehler = 0, hinweise = 0;
const melde  = (t) => { fehler++;   console.log('  ⛔ ' + t); };
const merke  = (t) => { hinweise++; console.log('  ⚠️  ' + t); };

/* ============ 1. Werkzeuge ohne Aufrufer — macht ein anderer =============
   ⛔ NICHT hier, obwohl es der Anlass war. `Automation/pruefe-freigaben.mjs`
   stellt diese Frage seit dem 18.08.2026 und fuehrt dafuer eine eigene
   VON_HAND-Liste. Eine zweite Fassung haette zwei Listen zu pflegen — und die
   erste, die jemand vergisst, macht die andere zur Luegnerin.
   [[dieselbe_frage_zwei_antworten]]

   Diese Pruefung stellt die zwei Fragen, die SONST NIEMAND stellt. */
console.log('');
console.log('=== 1. Werkzeuge ohne Aufrufer ===');
console.log('  ⓘ  prueft Automation/pruefe-freigaben.mjs (eigene VON_HAND-Liste).');

/* ======================= 2. Speicher ohne Auswertung ====================== */
console.log('');
console.log('=== 2. Speicher der App, den niemand auswertet ===');
const appText = fs.readdirSync(path.join(REPO, 'js')).filter(f => f.endsWith('.js'))
  .map(f => lies(path.join(REPO, 'js', f))).join('\n');
const schluessel = [...new Set([...appText.matchAll(/['"](vt_[A-Za-z0-9_]+)['"]/g)].map(m => m[1]))].sort();
/* ⛔ Der Abgleich und die Sicherung zaehlen NICHT als Auswertung: sie schieben
   die Daten nur weiter bzw. retten sie. Genau darin lag der Irrtum bei
   vt_vorschlagWeg — es sah versorgt aus, weil es synchronisiert wurde. */
const nichtAuswertung = /(js[\\/]sync|js[\\/]einstellungen|test-sync)/;
let ohneAuswertung = 0;
for (const s of schluessel){
  const orte = quellen.filter(q => !/[\\/]js[\\/]/.test(q) && lies(q).includes(s))
    .filter(q => !nichtAuswertung.test(q));
  if (orte.length) continue;
  ohneAuswertung++;
  const grund = SPEICHER_AUSNAHMEN[s];
  if (grund) console.log('  ok   ' + s.padEnd(22) + '(' + grund + ')');
  else melde(s + ' wird gesammelt, aber von keinem Werkzeug gelesen.'
    + ' Entweder auswerten oder als Ausnahme mit Grund eintragen.');
}
console.log('  ' + schluessel.length + ' Schluessel, ' + ohneAuswertung + ' ohne Auswertung ausserhalb der App.');

/* ==================== 3. Erzeugnisse aelter als ihre Quelle =============== */
console.log('');
console.log('=== 3. Erzeugte Dateien gegen ihre Quellen ===');
for (const e of ERZEUGNISSE){
  const ziel = path.join(REPO, e.datei);
  if (!fs.existsSync(ziel)){
    merke(e.datei + ' fehlt — ' + e.zweck + '. Erzeugen: node ' + e.werkzeug);
    continue;
  }
  const zeitZiel = fs.statSync(ziel).mtimeMs;
  const juenger = e.quellen.filter(q => {
    const p = path.join(REPO, q);
    return fs.existsSync(p) && fs.statSync(p).mtimeMs > zeitZiel;
  });
  if (juenger.length)
    melde(e.datei + ' ist AELTER als ' + juenger.join(', ')
      + ' — neu erzeugen: node ' + e.werkzeug);
  else
    console.log('  ok   ' + e.datei.padEnd(32) + 'aktuell gegen ' + e.quellen.length + ' Quelle(n)');
}

/* ================================== Schluss =============================== */
console.log('');
if (fehler){
  console.log('⛔ ' + fehler + ' unfertige(r) Kreislauf/Kreislaeufe.');
  console.log('   Das ist die Fehlerart, die sich nie von selbst meldet:');
  console.log('   alles sieht richtig aus, es passiert nur nichts.');
  process.exit(1);
}
console.log('✅ Jeder Kreislauf ist geschlossen'
  + (hinweise ? ' (' + hinweise + ' Hinweis(e) oben).' : '.'));
process.exit(0);
