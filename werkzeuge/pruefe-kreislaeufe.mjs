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
  'vt_satzTag':       'Tageszaehler des Satzmodus (07.09.2026) — wie vt_hoerTag ein reiner App-Zustand',
  'vt_lautStand':     'welche Karte wann zuletzt „laut sagen“ trug — die Auswahl trifft die App beim Rundenaufbau',
  'vt_lautRunde':     'die laufende Rundennummer dazu; sie hat ausserhalb der App keine Bedeutung',
  'vt_lesestand':     'wo er im Leser stehengeblieben ist',
  'vt_quranFav':      'seine Lesezeichen im Quran',
  'vt_customCats':    'eigene Kategorien, reine Ansichtssache',
  'vt_einstGruppen':  'welche Einstellungsgruppe zugeklappt ist (08.09.2026) — eine Anzeigevorliebe des Geraets, an dem man gerade sitzt',
  'vt_bekannt':       'seine „kenne ich schon"-Auswahl — wirkt ueber istBekannt() in der App',
  'vt_streak':        'Serie; der Kalender darunter wertet sie aus',
  'vt_uebungstage':   'Uebungskalender, seit 21.08.2026 — die App zeichnet ihn selbst',
  'vt_vorschlagNr':   'welcher Vorschlag gerade gilt; die ABLEHNUNGEN stehen in vt_vorschlagWeg',
  'vt_einzeln_frei':  'einzeln freigeschaltete Woerter — nur in seinem Speicher, absichtlich',
  'vt_hifzVerse':     'seit 24.08.2026 ueber data/auswendig.json ausgewertet',
  'vt_hifz':          'seit 24.08.2026 ueber data/auswendig.json ausgewertet',
  'vt_notizen':       'seine eigenen Notizen zum Wort — seit 24.08.2026 in eigene-woerter.json unter `eigeneNotizen`',
  /* ⛔⛔ Die zwei Schluessel der stillen Zeitmessung (08.09.2026). Sie stehen
     hier NICHT, weil die Auswertung vergessen wurde, sondern weil Elias
     ausdruecklich verlangt hat, dass die Zahl NICHT in der Oberflaeche
     erscheint: „am besten mir nicht sagen aber wenn ich es bei dir wissen
     will".

     ⭐ Der Abrufweg ist deshalb `zeitBericht()` in der laufenden App — von mir
     im Browser-Pane aufgerufen, genau wie `bekannteVokabeln()`. Ein Werkzeug
     hier koennte es gar nicht: die Daten entstehen beim Ueben und liegen in
     seinem localStorage; kein Werkzeug in diesem Ordner greift auf /api/stand
     zu (gemessen am 08.09.2026). Dieselbe Lage wie bei vt_uebungStand und
     vt_regelStand eine Zeile darunter. */
  /* ⚠️ `vt_geraetId` stand hier beim Nachtragen kurz ZWEIMAL — ein Objekt
     nimmt das klaglos an, der letzte Eintrag gewinnt, und die verwaiste Zeile
     haette fuer immer wie eine gueltige Begruendung ausgesehen. Sofort wieder
     entfernt. [[zweiter_aufruf_ueberschreibt_still]] */
  'vt_gehLog':        'Diagnose des Geh-Modus (08.09.2026) — misst BEIM NUTZER, ob die Sprachausgabe bei gesperrtem Bildschirm anspringt; abgerufen mit gehProtokoll() im Browser-Pane UND seit dem 09.09.2026 in der Diagnosekarte (Einstellungen → Daten & App), weil auf dem Handy niemand eine Konsole oeffnet',
  /* ⭐ Diese beiden werden sehr wohl ausgewertet — nur nicht von einem Werkzeug
     HIER, und das ist ihr ganzer Zweck. Sie entstehen auf SEINEM Geraet und
     sollen dort ablesbar sein, ohne Konsole und ohne Kabel: die Diagnosekarte
     gibt sie als Text aus, den er abfotografieren kann. Ein Werkzeug in diesem
     Ordner koennte sie gar nicht lesen — kein Werkzeug greift auf /api/stand
     zu, und in KV stehen sie ohnehin nicht. [[diagnose_statt_raten]] */
  'vt_feierLog':      'Feier-Protokoll (09.09.2026) — welche Feier wann und auf WELCHEM Bildschirm lief. Der Anlass: „konfeti kam erst bei startseite"; die Frage nach dem Bildschirm trennt „Ausloeser sitzt falsch" von „Effekt war unsichtbar". Ausgewertet in der Diagnosekarte und mit feierProtokoll()',
  'vt_syncPuts':      'Tageszaehler der KV-Schreibvorgaenge (08.09.2026) — die Messung, mit der das Cloudflare-Kontingent ueberhaupt beobachtbar wurde. Ausgewertet in der Diagnosekarte und mit syncPutStand(); ein Werkzeug hier saehe nur den eigenen Rechner, gebraucht wird die Zahl von SEINEN Geraeten',
  'vt_zeit':          'stille Zeitmessung (08.09.2026) — absichtlich nicht in der Oberflaeche; abgerufen mit zeitBericht() im Browser-Pane',
  'vt_quranEn':       'Zwischenspeicher der englischen Uebersetzung von api.quran.com — abgerufener Fremdtext, kein Lernstand. Er gehoert absichtlich NICHT auf andere Geraete: jedes holt sich beim Lesen selbst, was es braucht, und ein Abgleich wuerde nur Text hin- und herschieben, den die API ohnehin liefert. Verworfen wird er von selbst (QURAN_EN_MAX in js/quran.js)',
  'vt_wortQuote':     'Q3, Trefferquote je Wort (08.09.2026) — absichtlich NICHT angezeigt, genau darin liegt ihr Wert; ausgewertet mit wortQuoteBericht() im Browser-Pane, das die Interferenzfrage beantwortet (Woerter mit Wurzelgeschwistern gegen Einzelgaenger)',
  'vt_geraetId':      'trennt die Zeitzweige der Geraete; wird bewusst NICHT abgeglichen und hat ausserhalb der App keine Bedeutung',
  /* ⛔ Kein Werkzeug kann ihn lesen, und das ist kein Versaeumnis: er entsteht
     beim UEBEN und liegt nur in Elias' localStorage. Dasselbe gilt fuer
     vt_regelStand, das aus demselben Grund nie hier stand. Ausgewertet wird er
     in der App selbst — renderUebungStand() in js/statistik.js zeigt je
     Uebungsart, wie oft sie dran war und wie gut sie sass. Ein Werkzeug hier
     koennte nur behaupten, was es nicht weiss. [[daten_ohne_zugang]] */
  'vt_uebungStand':   'Fortschritt je Uebungsmodus — liegt nur auf seinem Geraet, die App zeigt ihn unter „Wie gut sitzen die Übungsarten?"',
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
/* ---------- ⛔ STOERTEST (09.09.2026) ----------

   ⭐ Dieser Pruefer sucht die Fehlerart, „die sich nie von selbst meldet".
   Genau deshalb muss er selbst beweisen, dass er ueberhaupt etwas sieht:
   findet er nichts, weil er nichts FINDET, oder weil er nichts SUCHT? Ohne
   diese Probe sind beide Ausgaenge identisch — und in derselben Nacht hat der
   Stoertest eines anderen Pruefers einen Fehler in vier weiteren aufgedeckt.
   [[stoertest_muss_wirkung_nachweisen]] [[leere_liste_ist_keine_messung]]

   Drei Faelle, deren Antwort unabhaengig feststeht. */
console.log('');
console.log('=== Stoertest ===');
let stoer = 0;
const sProbe = (was, ist, soll) => {
  if (ist !== soll){ stoer++; console.log('  ⛔  ' + was + ': ' + ist + ' statt ' + soll); }
  else console.log('  ok   ' + was);
};

/* 1. Die Schluesselerhebung muss ueberhaupt Schluessel finden. Am 09.09.2026
   waren es 37; faellt die Zahl unter zehn, liest sie js/ nicht mehr. */
sProbe('die App-Schluessel werden gefunden (>= 10)', schluessel.length >= 10, true);

/* 2. Ein erfundener Schluessel darf NICHT als „ausgewertet" durchgehen — er
   steht nirgends, also findet ihn auch kein Werkzeug. */
const erfunden = 'vt_gibtEsGarNichtXyz';
const orteErfunden = quellen.filter(q => !/[\\/]js[\\/]/.test(q) && lies(q).includes(erfunden))
  .filter(q => !nichtAuswertung.test(q));
sProbe('ein erfundener Schluessel hat keine Auswertung', orteErfunden.length, 0);

/* 3. ⛔ Und der Kern: der Abgleich zaehlt NICHT als Auswertung. Genau darin lag
   der Irrtum bei vt_vorschlagWeg — es sah versorgt aus, weil es
   synchronisiert wurde. Die Ausnahme muss also greifen. */
sProbe('js/sync.js gilt nicht als Auswertung', nichtAuswertung.test('werkzeuge/../js/sync.js'), true);
sProbe('ein echtes Werkzeug gilt als Auswertung', nichtAuswertung.test('werkzeuge/vorrat.mjs'), false);

if (stoer){
  console.log('');
  console.log('⛔ ' + stoer + ' Stoertest(s) gescheitert — dieser Pruefer misst nicht,');
  console.log('   und damit ist sein „alles geschlossen" wertlos.');
  process.exit(1);
}

console.log('');
console.log('✅ Jeder Kreislauf ist geschlossen'
  + (hinweise ? ' (' + hinweise + ' Hinweis(e) oben).' : '.'));
process.exit(0);
