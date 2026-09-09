/* vorschlaege-holen.mjs -- welche Eselsbrücken hat Elias abgelehnt?
 *
 * Elias am 19.08.2026: "du musst dann irgendwie diese liste bekommen. da
 * müssen wir irgendwie ein system entwickeln wie wir das zum klappen bringen."
 *
 * Das System ist der Geräteabgleich, den es schon gibt: Er tippt in der App
 * auf „Taugt nicht", der Stand wandert in den Cloudflare-KV, und dieses
 * Werkzeug holt ihn von dort. Kein Kopieren, kein Verschicken.
 *
 * Aufruf:
 *   node werkzeuge/vorschlaege-holen.mjs            aus dem KV holen
 *   node werkzeuge/vorschlaege-holen.mjs <datei>    aus einer Datei lesen
 *
 * ⛔ ES WERDEN NUR DIE ABGELEHNTEN VORSCHLÄGE AUSGEGEBEN. Der abgelegte Stand
 * enthält auch seinen kompletten Lernfortschritt (155 KB). Der geht niemanden
 * etwas an und wird hier weder gedruckt noch weitergereicht — das Werkzeug
 * greift genau ein Feld heraus.
 *
 * ⚠️ EIN LEERES ERGEBNIS HEISST NICHT „NICHTS ABGELEHNT". Es kann auch heißen:
 * er hat seit dem Tippen nicht abgeglichen. Deshalb steht der Zeitpunkt des
 * letzten Abgleichs immer mit dabei — ohne den ist die Liste nicht deutbar.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NAMENSRAUM = '3bdaa890a2ef4cf382edf335da1067df';   /* STAND, aus wrangler.toml */
const KV_SCHLUESSEL = 'stand:abdurahman.tunk@gmail.com';

/* ⚠️ Schalter sind keine Dateinamen. Bis zum 09.09.2026 stand hier
   `process.argv[2]`, und `--schreiben` landete als Pfad in readFileSync:
   „ENOENT … \--schreiben". [[freigabe_ist_die_ganze_befehlszeile]] */
const datei = process.argv.slice(2).find(a => !a.startsWith('--'));
let roh;
if (datei) {
  roh = fs.readFileSync(datei, 'utf8');
  console.log('Gelesen aus: ' + datei);
} else {
  try {
    /* ⛔⛔ ZWEI WINDOWS-FALLEN HINTEREINANDER (hier erst am 09.09.2026 behoben).
       `npx` allein wirft ENOENT — es heisst `npx.cmd`. Und seit Node 20 wirft
       ein DIREKT aufgerufenes .cmd `EINVAL`. Der Weg, der beides umgeht, ist
       `cmd /c npx …`. [[npm_global_windows_fallen]]

       ⚠️ Genau das stand seit dem 20.08.2026 in werkzeuge/vorrat.mjs, mit
       Begruendung — nur hier nicht. Dieses Werkzeug war deshalb auf Elias'
       Rechner UNBENUTZBAR: jeder Aufruf endete mit „spawnSync npx.cmd EINVAL"
       und dem Rat, es von Hand zu tun. Es sah aus wie ein Werkzeug ohne
       Aufrufer und war eines, das gar nicht laufen konnte.
       [[entscheidung_gilt_fuer_das_zweite_werkzeug]] [[ein_weg_geht_der_andere_nicht]]

       ⚠️ Die Fassung wird festgenagelt wie in vorrat.mjs — ein `npx wrangler`
       ohne Version holt bei jedem Lauf die neueste und kann ohne Vorwarnung
       andere Ausgaben liefern. */
    const win = process.platform === 'win32';
    const args = ['wrangler@4.124.0', 'kv', 'key', 'get', KV_SCHLUESSEL,
      '--namespace-id=' + NAMENSRAUM, '--remote', '--text'];
    roh = execFileSync(win ? 'cmd' : 'npx', win ? ['/c', 'npx', ...args] : args,
      { cwd: REPO, encoding: 'utf8', maxBuffer: 40 * 1024 * 1024, timeout: 180000 });
  } catch (e) {
    console.log('⛔ KV nicht erreichbar: ' + (e.message || e).split('\n')[0]);
    console.log('   Ersatzweg: den Stand von Hand holen und die Datei uebergeben —');
    console.log('   npx wrangler kv key get "' + KV_SCHLUESSEL + '" --namespace-id=' + NAMENSRAUM + ' --remote --text > stand.json');
    process.exit(1);
  }
}

let ablage;
try { ablage = JSON.parse(roh.trim()); }
catch (e) { console.log('⛔ Der abgelegte Stand ist kein JSON.'); process.exit(1); }

const wann = ablage.geaendert ? new Date(ablage.geaendert) : null;
console.log('Letzter Abgleich: ' + (wann ? wann.toLocaleString('de-DE') : 'unbekannt'));

const feld = (ablage.daten && ablage.daten['vt_vorschlagWeg']) || null;
let verworfen = {};
if (feld) {
  try { verworfen = (typeof feld === 'string') ? JSON.parse(feld) : feld; }
  catch (e) { verworfen = {}; }
}
const woerter = Object.keys(verworfen || {});
if (!woerter.length) {
  console.log('\nKeine abgelehnten Vorschlaege im abgeglichenen Stand.');
  console.log('⚠️ Das heisst NICHT zwingend "nichts abgelehnt" — es kann auch heissen,');
  console.log('   dass seit dem Tippen kein Abgleich gelaufen ist. Der Zeitpunkt oben sagt es.');
  process.exit(0);
}

/* Wort und Vorschlagsliste dazuholen. ⛔ vorschlagsListe() wird NICHT
   nachgebaut, sondern woertlich aus js/lernen.js uebernommen — eine
   nachempfundene Fassung zaehlte anders und meldete die falsche Nummer. */
const lies = f => fs.readFileSync(path.join(REPO, f), 'utf8');
const src = lies('js/lernen.js');
const von = src.indexOf('function vorschlagsListe(w){');
const bis = src.indexOf('\n}', von) + 2;
if (von < 0) { console.log('⛔ vorschlagsListe() in js/lernen.js nicht gefunden'); process.exit(1); }

const umgebung = new Function('ESELSBRUECKEN_ALT',
  src.slice(von, bis) + '; return vorschlagsListe;');
const alt = new Function(lies('data/eselsbruecken-alt.js') + '; return ESELSBRUECKEN_ALT;')();
const vorschlagsListe = umgebung(alt);
const VOCAB = new Function(lies('vocab-data.js') + '; return VOCAB_DATA;')();
const nachId = Object.fromEntries(VOCAB.map(w => [String(w.id), w]));

console.log('\n=== ' + woerter.length + ' Wort/Woerter mit abgelehnten Vorschlaegen ===\n');
let offenGesamt = 0, ohneErsatz = 0;
for (const id of woerter) {
  const w = nachId[id];
  const liste = w ? vorschlagsListe(w) : [];
  const eintraege = verworfen[id] || {};
  const nrs = Object.keys(eintraege).map(Number).sort((a, b) => a - b);
  offenGesamt += nrs.length;

  /* ⛔⛔ GEZAEHLT WIRD DER TEXT, NICHT DIE NUMMER (09.09.2026).
     Hier stand `liste.length - nrs.length`. Das rechnete jede Ablehnung gegen
     die HEUTIGE Liste, auch wenn an der Nummer laengst etwas anderes steht —
     und die Ersetzungen sind ja genau der Zweck der Uebung. Ergebnis an
     diesem Morgen: „Bei 10 Woertern ist KEIN Vorschlag mehr uebrig", obwohl
     bei KEINEM einzigen ein abgelehnter Text noch dastand. Vier davon
     meldeten sogar `uebrig: -1` — eine unmoegliche Zahl, und damit der
     Hinweis, dass die Rechnung nicht stimmt.
     [[unmoegliche_zahl_ist_ein_geschenk]] [[kandidatenliste_ist_keine_fehlerliste]]

     ⭐ Dieselbe Regel wie in der App: `istVorschlagVerworfen()` vergleicht
     seit v447 den Text (auf 400 Zeichen gekuerzt, so speichert js/kern.js
     ihn), nicht den Platz in der Liste. Zwei Werkzeuge, eine Frage — jetzt
     auch dieselbe Antwort. [[dieselbe_frage_zwei_antworten]] */
  const kurz = (t) => String(t == null ? '' : t).trim().slice(0, 400);
  const abgelehnteTexte = new Set(nrs.map(nr => kurz((eintraege[String(nr)] || {}).text)).filter(Boolean));
  const nochAbgelehnt = liste.filter(t => abgelehnteTexte.has(kurz(t))).length;
  const uebrig = liste.length - nochAbgelehnt;
  /* ⚠️ Ein Wort, das gar nicht in vocab-data.js steht, hat hier 0 Vorschlaege —
     das ist kein fehlender Ersatz, sondern ein fehlendes Wort. Es wird eine
     Zeile weiter unten ohnehin als „nicht gefunden" ausgewiesen. */
  if (w && uebrig <= 0) ohneErsatz++;

  console.log((w ? w.ar + '  ' + (w.de || '') : '(Wort ' + id + ' nicht gefunden)')
    + '   [' + id + ']');
  console.log('   Vorschlaege gesamt: ' + liste.length
    + ' · abgelehnt: ' + nrs.length
    + ' · davon heute noch da: ' + nochAbgelehnt
    + ' · brauchbar: ' + uebrig
    + (w && uebrig <= 0 ? '   ⛔ KEIN ERSATZ MEHR' : ''));
  for (const nr of nrs) {
    const e = eintraege[String(nr)] || {};
    const jetzt = liste[nr];
    const gleich = jetzt != null && String(jetzt).trim() === String(e.text || '').trim();
    console.log('   ✗ Nr. ' + (nr + 1) + (e.zeit ? '  (' + new Date(e.zeit).toLocaleDateString('de-DE') + ')' : ''));
    console.log('     ' + String(e.text || '(kein Text gespeichert)').replace(/\s+/g, ' ').slice(0, 160));
    /* ⚠️ Steht an der Nummer heute etwas anderes, hat sich die Liste seit der
       Ablehnung geaendert. Dann gilt der gespeicherte TEXT, nicht die Nummer. */
    if (!gleich) console.log('     ⚠️ An Nr. ' + (nr + 1) + ' steht heute etwas anderes — die Liste hat sich geaendert.');
  }
  console.log('');
}
/* ---------- --schreiben: data/abgelehnt.json nachziehen ----------

   ⛔ WARUM DAS HIER DAZUGEHOERT (09.09.2026). pruefe-eselsbruecken.js liest
   data/abgelehnt.json und meldet jeden abgelehnten Text, der noch dasteht.
   Geschrieben wurde die Datei bisher NUR von `vorrat.mjs --stand … --app auto`
   — und das Werkzeug zieht zugleich FREIGESCHALTET nach, greift also in den
   Lernfenster-Stand ein. Wer nur die Ablehnungen auffrischen will, musste
   deshalb den ganzen Lauf nehmen oder es lassen.

   Gelassen wurde es: die Datei war am 09.09.2026 drei Tage alt, und in dieser
   Zeit hatte Elias einen weiteren Vorschlag abgelehnt (غُرْفَةٌ Nr. 3, um
   04:07 abgeglichen). Der Pruefer konnte ihn nicht sehen und meldete gruen.
   [[werkzeug_ohne_aufrufer]] [[historisch_oder_aktuell_steht_im_wort_davor]]

   ⚠️ DIESELBE DATEI, ZWEI SCHREIBER. Die Form muss deckungsgleich bleiben mit
   `abgelehnteSchreiben()` in werkzeuge/vorrat.mjs — Felder `stempel`,
   `geholt`, `woerter`. Wer eine aendert, aendert beide.
   [[dieselbe_frage_zwei_antworten]]

   ⚠️ Und wie dort: ein LEERES Ergebnis wird nicht geschrieben. „Er hat nichts
   abgelehnt" und „wir haben nichts geholt" saehen sonst gleich aus.
   [[leere_liste_ist_keine_messung]] */
if (process.argv.includes('--schreiben')) {
  const raus = {};
  let anzahl = 0;
  for (const id of woerter) {
    const e = verworfen[id] || {};
    const l = Object.keys(e).map(Number).sort((a, b) => a - b).map(nr => ({
      nr, text: String((e[String(nr)] || {}).text || ''), zeit: (e[String(nr)] || {}).zeit || null
    })).filter(x => x.text);
    if (l.length) { raus[id] = l; anzahl += l.length; }
  }
  if (!anzahl) {
    console.log('\n⚠️ Nichts zu schreiben — data/abgelehnt.json bleibt, wie sie war.');
  } else {
    const ziel = path.join(REPO, 'data', 'abgelehnt.json');
    fs.writeFileSync(ziel, JSON.stringify({
      stempel: (ablage.stempel && ablage.stempel.vt_vorschlagWeg) || null,
      geholt: new Date().toLocaleDateString('de-DE'),
      woerter: raus
    }, null, 2) + '\n', 'utf8');
    console.log('\n→ data/abgelehnt.json geschrieben: ' + anzahl + ' Ablehnung(en) in '
      + Object.keys(raus).length + ' Woertern.');
  }
}

console.log('Zusammen: ' + offenGesamt + ' abgelehnte Vorschlaege in ' + woerter.length + ' Woertern.');
if (ohneErsatz) console.log('⛔ Bei ' + ohneErsatz + ' Wort/Woertern ist KEIN Vorschlag mehr uebrig — dort muss einer neu geschrieben werden.');
