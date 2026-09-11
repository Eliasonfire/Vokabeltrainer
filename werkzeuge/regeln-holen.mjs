/* regeln-holen.mjs -- was hat Elias in der Regelsammlung eingetragen?
 *
 *   node werkzeuge/regeln-holen.mjs             aus dem KV holen, nur NEUES zeigen
 *   node werkzeuge/regeln-holen.mjs --alles     alles zeigen, nicht nur Neues
 *   node werkzeuge/regeln-holen.mjs --merken    nach dem Eintragen: das Gezeigte als gesehen merken
 *   node werkzeuge/regeln-holen.mjs <datei>     den Stand aus einer Datei lesen (Ersatzweg, Prüfer)
 *
 *   Exitcode 0 = nichts Neues · 2 = Neues seit dem letzten --merken · 1 = nicht lesbar
 *
 * WARUM ES DAS GIBT (11.09.2026)
 * ==============================
 * Elias, 19:07:37: „da wir jetzt auch ein regeln feld haben in der app, sollen
 * wir unsere routinen dahingehend anpassen oder eine neue aufbauen …"
 * Nachgesehen: KEINE Routine kannte die Regelsammlung. Was er dort einträgt —
 * Notizen, Papierkorb, eigene Regeln, eigene Fassungen —, lag im Geräteabgleich
 * und wurde von niemandem gelesen. Seine Wahl um 19:22:49: alle drei
 * Ergänzungen; dies ist die erste.
 *
 * ⭐ Der Weg ist derselbe wie bei „Taugt nicht" (werkzeuge/vorschlaege-holen.mjs):
 * `vt_regeln` steht in der Abgleichsliste von js/sync.js, wandert damit in den
 * Cloudflare-KV unter `stand:<mail>`, und `wrangler kv key get` holt ihn.
 * ⚠️ Bis heute stand in werkzeuge/pruefe-kreislaeufe.mjs, ein Werkzeug hier
 * „koennte den Stand gar nicht lesen". Das Nachbarwerkzeug tat es seit dem
 * 19.08.2026. [[zusicherung_im_kommentar_ist_keine_pruefung]]
 *
 * ⛔⛔ NUR LESEN. Dieses Werkzeug schreibt nichts in den KV und nichts in
 * grammar-data.js. Ob seine Fassung die des Lehrers in den Daten ersetzt, ist
 * der offene Punkt „Rückweg" — seine Entscheidung. In der App gilt seine
 * Fassung ohnehin schon auf allen Geräten.
 *
 * ⛔ NUR `vt_regeln`. Der abgelegte Stand enthält seinen ganzen Lernfortschritt.
 * Der wird hier weder gedruckt noch gemerkt — wie in vorschlaege-holen.mjs
 * greift das Werkzeug genau ein Feld heraus. pruefe-regelsammlung-routinen.mjs
 * legt einen Köder in ein fremdes Feld und prüft, dass er nie erscheint.
 *
 * ⚠️ LEER HEISST NICHT „NICHTS EINGETRAGEN". Es kann auch heißen, dass sein
 * Gerät seit dem Eintragen nicht abgeglichen hat. Deshalb steht der Zeitpunkt
 * des letzten Abgleichs immer oben. [[leere_liste_ist_keine_messung]]
 *
 * ⚠️ „NEU" UND DAS MERKEN SIND ZWEI SCHRITTE. Der Lauf ohne --merken legt nur
 * `.regeln-stand.neu.json` ab; erst --merken macht daraus den gemerkten Stand,
 * OHNE neu zu holen. Holte --merken selbst, würde ein Eintrag, den er genau
 * dazwischen macht, als gesehen gelten, ohne je gezeigt worden zu sein. Bricht
 * die Routine vor --merken ab, kommt das Neue beim nächsten Lauf wieder.
 * Gemerkt werden nur IDs und Zeiten, keine Texte; beide Dateien stehen in
 * .gitignore. [[zweiter_aufruf_ueberschreibt_still]]
 *
 * ⚠️ Namensraum und Schlüssel stehen auch in vorschlaege-holen.mjs und
 * wrangler.toml. pruefe-regelsammlung-routinen.mjs vergleicht die drei.
 * [[entscheidung_gilt_fuer_das_zweite_werkzeug]]
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NAMENSRAUM = '3bdaa890a2ef4cf382edf335da1067df';   /* STAND, aus wrangler.toml */
const KV_SCHLUESSEL = 'stand:abdurahman.tunk@gmail.com';
const FELD = 'vt_regeln';

const args = process.argv.slice(2);
const wert = (schalter) => { const i = args.indexOf(schalter); return i >= 0 ? args[i + 1] : null; };
/* ⚠️ Schalter und ihre Werte sind keine Dateinamen — sonst landet
   `--zustand <ordner>` als Pfad in readFileSync. [[freigabe_ist_die_ganze_befehlszeile]] */
const mitWert = new Set(['--zustand']);
const datei = args.find((a, i) => !a.startsWith('--') && !(i > 0 && mitWert.has(args[i - 1])));
const ALLES = args.includes('--alles');
const ZUSTAND = path.resolve(wert('--zustand') || REPO);
const GEMERKT = path.join(ZUSTAND, '.regeln-stand.json');
const VORGEMERKT = path.join(ZUSTAND, '.regeln-stand.neu.json');

/* ---------- --merken: das zuletzt Gezeigte als gesehen übernehmen ---------- */
if (args.includes('--merken')){
  if (!fs.existsSync(VORGEMERKT)){
    console.log('⛔ Nichts zu merken: ' + path.basename(VORGEMERKT) + ' fehlt.');
    console.log('   Erst ohne --merken laufen lassen — gemerkt wird nur, was gezeigt wurde.');
    process.exit(1);
  }
  fs.renameSync(VORGEMERKT, GEMERKT);
  const g = JSON.parse(fs.readFileSync(GEMERKT, 'utf8'));
  const n = Object.values(g.zeiten || {}).reduce((a, s) => a + Object.keys(s).length, 0);
  console.log('Gemerkt: ' + n + ' Einträge, Abgleich vom ' + (g.abgleich ? new Date(g.abgleich).toLocaleString('de-DE') : 'unbekannt') + '.');
  process.exit(0);
}

/* ---------- Stand holen ---------- */
let roh;
if (datei){
  try { roh = fs.readFileSync(datei, 'utf8'); }
  catch (e) { console.log('⛔ Datei nicht lesbar: ' + datei); process.exit(1); }
  console.log('Gelesen aus: ' + datei);
} else {
  try {
    /* ⛔ Wie in vorschlaege-holen.mjs: `npx` heißt unter Windows `npx.cmd`, und
       ein direkt aufgerufenes .cmd wirft seit Node 20 EINVAL — `cmd /c npx`
       umgeht beides. Die Fassung ist festgenagelt. [[npm_global_windows_fallen]] */
    const win = process.platform === 'win32';
    const kv = ['wrangler@4.124.0', 'kv', 'key', 'get', KV_SCHLUESSEL,
      '--namespace-id=' + NAMENSRAUM, '--remote', '--text'];
    roh = execFileSync(win ? 'cmd' : 'npx', win ? ['/c', 'npx', ...kv] : kv,
      { cwd: REPO, encoding: 'utf8', maxBuffer: 40 * 1024 * 1024, timeout: 180000 });
  } catch (e) {
    console.log('⛔ KV nicht erreichbar: ' + String(e.message || e).split('\n')[0]);
    console.log('   Ersatzweg: den Stand von Hand holen und die Datei übergeben —');
    console.log('   npx wrangler kv key get "' + KV_SCHLUESSEL + '" --namespace-id=' + NAMENSRAUM + ' --remote --text > stand.json');
    process.exit(1);
  }
}

let ablage;
try { ablage = JSON.parse(String(roh).trim()); }
catch (e) { console.log('⛔ Der abgelegte Stand ist kein JSON.'); process.exit(1); }

const abgleich = ablage && ablage.geaendert ? new Date(ablage.geaendert) : null;
console.log('Letzter Abgleich: ' + (abgleich && !isNaN(abgleich) ? abgleich.toLocaleString('de-DE') : 'unbekannt'));

const feld = ablage && ablage.daten ? ablage.daten[FELD] : undefined;
let stand = null;
if (feld != null){
  try { stand = (typeof feld === 'string') ? JSON.parse(feld) : feld; }
  catch (e) { console.log('⛔ ' + FELD + ' im Stand ist kein JSON.'); process.exit(1); }
}
if (!stand || typeof stand !== 'object' || Array.isArray(stand)){
  console.log('\nKeine Regelsammlung im abgeglichenen Stand.');
  console.log('⚠️ Das heißt NICHT zwingend „nichts eingetragen" — es kann auch heißen,');
  console.log('   dass sein Gerät seitdem nicht abgeglichen hat. Der Zeitpunkt oben sagt es.');
  process.exit(0);
}

/* ---------- Namen dazu: Regeln, Karten, eigene ---------- */
const namen = new Map();
function ladeNamen(){
  try {
    const src = fs.readFileSync(path.join(REPO, 'grammar-data.js'), 'utf8');
    for (const r of new Function(src + '; return GRAMMAR_RULES;')()) namen.set(r.id, r.name);
  } catch (e) { console.log('⚠️ grammar-data.js nicht ladbar — Regeln erscheinen nur mit ID.'); }
  try {
    const src = fs.readFileSync(path.join(REPO, 'regelsammlung-data.js'), 'utf8');
    /* Jede Karten-Liste, nicht nur FOLGE19_KARTEN: kommt eine zweite
       Zusammenfassungs-Folge dazu, heißt sie nach demselben Muster. */
    const listen = [...src.matchAll(/const\s+(FOLGE\d+_KARTEN)\s*=/g)].map(m => m[1]);
    if (listen.length){
      for (const k of new Function(src + '; return [' + listen.join(',') + '].flat();')()) namen.set(k.id, k.titel);
    }
  } catch (e) { console.log('⚠️ regelsammlung-data.js nicht ladbar — Karten erscheinen nur mit ID.'); }
}
ladeNamen();
const eigene = (stand.eigene && typeof stand.eigene === 'object') ? stand.eigene : {};
for (const [id, e] of Object.entries(eigene)) if (e && e.name) namen.set(id, e.name + ' (eigene Regel)');
const nameVon = (id) => namen.get(id) || '(unbekannte ID)';

/* ---------- Abschnitte ---------- */
const kurz = (t, n) => { const s = String(t == null ? '' : t).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n) + ' …' : s; };
const datum = (z) => z ? new Date(z).toLocaleString('de-DE') : 'ohne Zeit';

/* `zaehlt`: ein neuer Eintrag hier ist Arbeit für die Wartung (Exitcode 2).
   Die zwei Schalter nicht — über den Satzmodus entscheidet die App selbst
   (regelAusgeblendet in js/regeln.js); sie stehen nur zur Auskunft da. */
const ABSCHNITTE = [
  { key: 'notiz',  titel: 'Notizen', zaehlt: true,
    zustand: (e) => (e && String(e.text || '').trim()) ? '„' + kurz(e.text, 400) + '"' : '(Notiz geleert)',
    aktiv: (e) => !!(e && String(e.text || '').trim()) },
  { key: 'weg',    titel: 'Papierkorb', zaehlt: true,
    zustand: (e) => (e && e.an) ? 'im Papierkorb' : 'zurückgeholt',
    aktiv: (e) => !!(e && e.an) },
  { key: 'eigene', titel: 'Eigene Regeln', zaehlt: true,
    zustand: (e) => kurz(e && e.kurz, 300) + ((e && (e.beispielAr || e.beispielDe)) ? '  · Beispiel: ' + kurz([e.beispielAr, e.beispielDe].filter(Boolean).join(' — '), 160) : ''),
    aktiv: (e) => !!e },
  { key: 'text',   titel: 'Eigene Fassungen', zaehlt: true,
    zustand: (e) => (e && typeof e.kurz === 'string' && e.kurz.trim()) ? '„' + kurz(e.kurz, 300) + '"' : 'auf das Original zurückgesetzt',
    aktiv: (e) => !!(e && typeof e.kurz === 'string' && e.kurz.trim()) },
  { key: 'satz',   titel: 'Schalter „im Satzmodus"', zaehlt: false,
    zustand: (e) => (e && e.an) ? 'im Satzmodus' : 'nicht im Satzmodus',
    aktiv: (e) => !!e },
  { key: 'zeigen', titel: '„streichen"-Regeln wieder gezeigt', zaehlt: false,
    zustand: (e) => (e && e.an) ? 'wieder gezeigt' : 'wieder verborgen',
    aktiv: (e) => !!(e && e.an) },
];

let gesehen = { zeiten: {} };
try { gesehen = JSON.parse(fs.readFileSync(GEMERKT, 'utf8')); } catch (e) { /* noch nie gemerkt */ }
const ersterLauf = !fs.existsSync(GEMERKT);

const summen = [];
const vormerken = { geholt: new Date().toISOString(), abgleich: ablage.geaendert || null, zeiten: {} };
let neuArbeit = 0, neuAuskunft = 0;
const ausgabe = [];
for (const a of ABSCHNITTE){
  const eintraege = (stand[a.key] && typeof stand[a.key] === 'object' && !Array.isArray(stand[a.key])) ? stand[a.key] : {};
  const alt = (gesehen.zeiten && gesehen.zeiten[a.key]) || {};
  vormerken.zeiten[a.key] = {};
  const liste = [];
  let aktiv = 0;
  for (const [id, e] of Object.entries(eintraege)){
    const zeit = Number(e && e.zeit) || 0;
    vormerken.zeiten[a.key][id] = zeit;
    if (a.aktiv(e)) aktiv++;
    const neu = !(id in alt) || zeit > Number(alt[id] || 0);
    if (neu){ if (a.zaehlt) neuArbeit++; else neuAuskunft++; }
    if (ALLES || neu) liste.push({ id, e, zeit, neu });
  }
  summen.push(aktiv + ' ' + a.titel);
  if (!liste.length) continue;
  liste.sort((x, y) => y.zeit - x.zeit);
  ausgabe.push('');
  ausgabe.push('=== ' + a.titel + (ALLES ? '' : ' — neu') + ' ===');
  for (const x of liste){
    ausgabe.push('  ' + (x.neu ? '🆕 ' : '   ') + x.id + '  ' + nameVon(x.id) + '  (' + datum(x.zeit) + ')');
    ausgabe.push('       ' + a.zustand(x.e));
  }
}

console.log('Regelsammlung im Stand: ' + summen.join(' · '));
console.log(ersterLauf
  ? 'Noch nie gemerkt — alles gilt als neu.'
  : 'Zuletzt gemerkt: ' + datum(Date.parse(gesehen.geholt)) + ' (Abgleich vom ' + (gesehen.abgleich ? datum(Date.parse(gesehen.abgleich)) : 'unbekannt') + ')');
console.log(ausgabe.join('\n'));

fs.writeFileSync(VORGEMERKT, JSON.stringify(vormerken, null, 2) + '\n', 'utf8');
console.log('');
if (neuArbeit){
  console.log('→ ' + neuArbeit + ' neue(r) Eintrag/Einträge, die die Wartung ansehen muss'
    + (neuAuskunft ? ' (dazu ' + neuAuskunft + ' Schalter zur Auskunft)' : '') + '.');
  console.log('  Nach dem Eintragen in die To-Do: node werkzeuge/regeln-holen.mjs --merken');
  process.exit(2);
}
console.log('Nichts Neues, das bearbeitet werden muss' + (neuAuskunft ? ' (' + neuAuskunft + ' Schalter zur Auskunft).' : '.'));
process.exit(0);
