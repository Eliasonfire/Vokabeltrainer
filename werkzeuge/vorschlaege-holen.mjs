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
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NAMENSRAUM = '3bdaa890a2ef4cf382edf335da1067df';   /* STAND, aus wrangler.toml */
const KV_SCHLUESSEL = 'stand:abdurahman.tunk@gmail.com';

/* ⚠️ Schalter sind keine Dateinamen. Bis zum 09.09.2026 stand hier
   `process.argv[2]`, und `--schreiben` landete als Pfad in readFileSync:
   „ENOENT … \--schreiben". [[freigabe_ist_die_ganze_befehlszeile]] */
/* ⭐ 05.10.2026 — `--tor` und `--auftrag <datei>` für die tägliche Routine
   „abgelehnte Eselsbrücken ersetzen" (Begründung und sein Wortlaut unten bei
   nochDa()). Der Dateiname hinter --auftrag ist KEINE Eingabedatei. */
const ARGS = process.argv.slice(2);
const iAuftrag = ARGS.indexOf('--auftrag');
const AUFTRAG = iAuftrag >= 0 ? ARGS[iAuftrag + 1] : null;
if (iAuftrag >= 0 && (!AUFTRAG || AUFTRAG.startsWith('--'))) {
  console.log('⛔ --auftrag braucht einen Dateinamen: node werkzeuge/vorschlaege-holen.mjs --auftrag <datei.json>');
  process.exit(1);
}
const TOR = ARGS.includes('--tor');
/* In beiden Betriebsarten steht am Ende nur, was zu ersetzen ist — nicht die
   ganze Liste aller Ablehnungen (die Ausgabe landet im Routinen-Protokoll). */
const STILL = TOR || !!AUFTRAG;
const sag = STILL ? () => {} : (...a) => console.log(...a);
const datei = ARGS.find((a, i) => !a.startsWith('--') && (iAuftrag < 0 || i !== iAuftrag + 1));
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
  process.exit(STILL ? 3 : 0);
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

sag('\n=== ' + woerter.length + ' Wort/Woerter mit abgelehnten Vorschlaegen ===\n');
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

  sag((w ? w.ar + '  ' + (w.de || '') : '(Wort ' + id + ' steht nicht in vocab-data.js — Buchwort)')
    + '   [' + id + ']');
  sag('   Vorschlaege gesamt: ' + liste.length
    + ' · abgelehnt: ' + nrs.length
    + ' · davon heute noch da: ' + nochAbgelehnt
    + ' · brauchbar: ' + uebrig
    + (w && uebrig <= 0 ? '   ⛔ KEIN ERSATZ MEHR' : ''));
  for (const nr of nrs) {
    const e = eintraege[String(nr)] || {};
    const jetzt = liste[nr];
    const gleich = jetzt != null && String(jetzt).trim() === String(e.text || '').trim();
    sag('   ✗ Nr. ' + (nr + 1) + (e.zeit ? '  (' + new Date(e.zeit).toLocaleDateString('de-DE') + ')' : ''));
    sag('     ' + String(e.text || '(kein Text gespeichert)').replace(/\s+/g, ' ').slice(0, 160));
    /* ⚠️ Steht an der Nummer heute etwas anderes, hat sich die Liste seit der
       Ablehnung geaendert. Dann gilt der gespeicherte TEXT, nicht die Nummer. */
    /* ⛔ Nur behaupten, was gemessen ist (05.10.2026): bei einem Buchwort ist
       `liste` hier LEER, und die Zeile stand trotzdem da — an 8 von 30 Woertern.
       Ob ein Text noch dasteht, sagt fuer ALLE Woerter die Zeile am Ende (nochDa). */
    if (w && !gleich) sag('     ⚠️ An Nr. ' + (nr + 1) + ' steht heute etwas anderes — die Liste hat sich geaendert.');
  }
  sag('');
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
/* Die Liste in der Form von data/abgelehnt.json — EINE Stelle für --schreiben
   und für die Vorprüfung unten. */
function ablehnungsListe() {
  const raus = {};
  let anzahl = 0;
  for (const id of woerter) {
    const e = verworfen[id] || {};
    const l = Object.keys(e).map(Number).sort((a, b) => a - b).map(nr => ({
      nr, text: String((e[String(nr)] || {}).text || ''), zeit: (e[String(nr)] || {}).zeit || null
    })).filter(x => x.text);
    if (l.length) { raus[id] = l; anzahl += l.length; }
  }
  return { raus, anzahl };
}

/* ---------- Steht ein abgelehnter Text noch da? (05.10.2026) ----------

   Elias, 05.10.2026: „da jetzt immer die gleichen wörter meistens da sind denke
   ich es ist jetzt wichtig, dass eine routine sich täglich drum kümmert das die
   eselsbrücken die ich für untauglich gemacht habe direkt ersetzt werden".

   Bis dahin ersetzte nur die Wartung (Mi 22:00, So 13:00) — er wartete bis zu
   3 Tage 15 Stunden. Die Routine `vokabeltrainer-eselsbruecken` fragt jetzt
   täglich `--tor`; nur wenn hier etwas steht, startet überhaupt eine KI.

   ⛔ GEFRAGT WIRD DER PRÜFER, NICHT EINE ZWEITE RECHNUNG. `pruefe-eselsbruecken.js`
   Abschnitt 8 kennt alle drei Stellen, an denen ein Text stehen kann (mnemo in
   vocab-data.js, die Buchkarte in data/eselsbruecken.js, die Alternativen), und
   er ist es, der am Ende der Routine wieder grün sein muss. Die lange Liste oben
   kennt nur vocab-data.js: am 05.10.2026 standen 8 von 30 Wörtern nicht darin,
   und für ihre Ablehnungen hätte ein Tor, das auf der Liste oben rechnet, NIE
   einen Auftrag erteilt. [[dieselbe_frage_zwei_antworten]]

   Der frische Stand geht dem Prüfer über eine Datei im Temp-Ordner zu
   (ABGELEHNT_DATEI), seine Befunde kommen als JSON zurück
   (ABGELEHNT_BEFUNDE_NACH). Im Repo wird dabei nichts geschrieben.
   Rückgabe: { geprueft, befunde: [{id, wort, quelle, nr, zeit, text}],
               woerter: { id: { ar, de, texte: [{quelle, text}] } } }
   oder { fehler } — dann ist die Frage NICHT beantwortet. */
function nochDa() {
  const { raus, anzahl } = ablehnungsListe();
  if (!anzahl) return { geprueft: 0, befunde: [], woerter: {} };
  let tmp;
  try {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'abgelehnt-'));
    const liste = path.join(tmp, 'liste.json'), befunde = path.join(tmp, 'befunde.json');
    fs.writeFileSync(liste, JSON.stringify({
      stempel: (ablage.stempel && ablage.stempel.vt_vorschlagWeg) || null,
      geholt: new Date().toLocaleDateString('de-DE'),
      woerter: raus
    }), 'utf8');
    try {
      execFileSync(process.execPath, [path.join(REPO, 'pruefe-eselsbruecken.js')], {
        cwd: REPO, encoding: 'utf8', maxBuffer: 40 * 1024 * 1024, timeout: 120000, stdio: ['ignore', 'pipe', 'pipe'],
        env: Object.assign({}, process.env, { ABGELEHNT_DATEI: liste, ABGELEHNT_BEFUNDE_NACH: befunde })
      });
    } catch (e) {
      /* Ein Exitcode ungleich 0 ist hier der NORMALFALL: steht ein abgelehnter
         Text noch da, meldet der Prüfer ihn als Befund. Entscheidend ist allein,
         ob er seine Befunde geschrieben hat. */
    }
    if (!fs.existsSync(befunde)) return { fehler: 'pruefe-eselsbruecken.js hat keine Befunde geschrieben (abgestürzt vor Abschnitt 8?)' };
    const erg = JSON.parse(fs.readFileSync(befunde, 'utf8'));
    if (erg.fehler) return { fehler: 'pruefe-eselsbruecken.js konnte die Liste nicht lesen: ' + erg.fehler };
    return erg;
  } catch (e) {
    return { fehler: String((e && e.message) || e) };
  } finally {
    if (tmp) { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) { /* Temp-Ordner bleibt liegen: harmlos */ } }
  }
}
const kurzZeit = z => z ? new Date(z).toLocaleString('de-DE') : 'Zeit unbekannt';

if (STILL) {
  /* Exit 0 = Auftrag · 3 = nichts zu tun · 1 = die Frage ließ sich nicht
     beantworten. So liest es Automation\run-routine.ps1 (`vorpruefung`). */
  const erg = nochDa();
  if (erg.fehler) { console.log('⛔ Vorprüfung nicht möglich: ' + erg.fehler); process.exit(1); }
  const ids = Object.keys(erg.woerter || {});
  console.log('Abgelehnt: ' + offenGesamt + ' Vorschläge in ' + woerter.length + ' Wörtern · gegen den Bestand geprüft: '
    + erg.geprueft + ' · steht noch da: ' + erg.befunde.length + (ids.length ? ' (an ' + ids.length + ' Wort/Wörtern)' : ''));
  for (const b of erg.befunde)
    console.log('  ✗ [' + b.id + '] ' + b.wort + ' — ' + b.quelle + ', abgelehnt ' + kurzZeit(b.zeit));
  if (!erg.befunde.length) {
    console.log('Nichts zu tun — jeder abgelehnte Text ist ersetzt.');
    process.exit(3);
  }
  if (AUFTRAG) {
    /* Was die Routine je Wort braucht: was zu ersetzen ist, was heute an dem
       Wort steht (damit der neue Text keinem gleicht), und ALLES, was er an dem
       Wort je abgelehnt hat (er lehnt die Idee ab, nicht nur den Wortlaut). */
    const auftrag = { geschrieben: new Date().toISOString(), abgleich: wann ? wann.toISOString() : null, woerter: {} };
    for (const id of ids) {
      const e = verworfen[id] || {};
      auftrag.woerter[id] = {
        ar: erg.woerter[id].ar, de: erg.woerter[id].de,
        ersetzen: erg.befunde.filter(b => b.id === id).map(b => ({ quelle: b.quelle, nr: b.nr, abgelehntAm: kurzZeit(b.zeit), text: b.text })),
        stehtHeute: erg.woerter[id].texte,
        alleAbgelehnten: Object.keys(e).map(k => String((e[k] || {}).text || '')).filter(Boolean)
      };
    }
    fs.writeFileSync(AUFTRAG, JSON.stringify(auftrag, null, 2) + '\n', 'utf8');
    console.log('→ Auftrag geschrieben: ' + AUFTRAG);
  }
  if (TOR) {
    /* ⛔ HÖCHSTENS ZWEI AUFTRÄGE FÜR DIESELBEN BEFUNDE. Kann die Routine einen
       Text nicht ersetzen (kein brauchbarer Einfall, ein Prüfer bleibt rot), steht
       er beim nächsten Lauf wieder da — ohne diese Bremse startete dann dreimal
       täglich eine KI für dieselbe Stelle, auf unbestimmte Zeit. Die Routine
       meldet so einen Fall selbst als „handlungsbedarf"; hier wird nur verhindert,
       dass er endlos Läufe kostet. Lehnt Elias etwas Neues ab, ändern sich die
       Befunde, und es wird wieder von vorn gezählt.
       Der Zähler steht in Automation/.state/ (nicht im Repo), wie der Zustand von
       neue-kapitel.mjs;
       gezählt wird nur beim echten Abruf, nicht beim Lesen aus einer Datei —
       außer ein Test nennt den Ort ausdrücklich (ABGELEHNT_TOR_STAND). */
    const HOECHSTENS = 2;
    const standDatei = process.env.ABGELEHNT_TOR_STAND || (datei ? null : path.resolve(REPO, '..', 'Automation', '.state', 'eselsbruecken-tor.json'));
    if (standDatei) {
      const fp = erg.befunde.map(b => b.id + '|' + b.quelle + '|' + String(b.text).length + '|' + String(b.text).slice(0, 40)).sort().join('\n');
      let st = {};
      try { st = JSON.parse(fs.readFileSync(standDatei, 'utf8')); } catch (e) { st = {}; }
      const gleich = st.fingerabdruck === fp;
      if (gleich && st.versuche >= HOECHSTENS) {
        console.log('KEIN AUFTRAG: für genau diese Ablehnungen wurden schon ' + st.versuche + ' Aufträge erteilt (zuletzt '
          + kurzZeit(st.zuletzt) + ') — ein weiterer Lauf fände dasselbe. Das gehört in eine Sitzung.');
        process.exit(3);
      }
      fs.mkdirSync(path.dirname(standDatei), { recursive: true });
      fs.writeFileSync(standDatei + '.neu', JSON.stringify({ fingerabdruck: fp, versuche: gleich ? st.versuche + 1 : 1, zuletzt: new Date().toISOString() }, null, 1) + '\n', 'utf8');
      fs.renameSync(standDatei + '.neu', standDatei);
    }
  }
  console.log('AUFTRAG: ' + erg.befunde.length + ' abgelehnte Eselsbrücke(n) an ' + ids.length + ' Wort/Wörtern ersetzen.');
  process.exit(0);
}

if (process.argv.includes('--schreiben')) {
  const { raus, anzahl } = ablehnungsListe();
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
/* Die eine Zeile, die für ALLE Wörter gilt — auch für Buchwörter, die die Liste
   oben nicht kennt (nochDa() fragt den Prüfer). */
{
  const erg = nochDa();
  if (erg.fehler) console.log('⚠️ Ob ein abgelehnter Text noch dasteht, ließ sich nicht prüfen: ' + erg.fehler);
  else {
    console.log('Steht noch da: ' + erg.befunde.length + ' von ' + erg.geprueft + ' geprüften Ablehnungen'
      + (erg.befunde.length ? ' — zu ersetzen:' : ' — jeder abgelehnte Text ist ersetzt.'));
    for (const b of erg.befunde)
      console.log('  ✗ [' + b.id + '] ' + b.wort + ' — ' + b.quelle + ', abgelehnt ' + kurzZeit(b.zeit));
  }
}
if (ohneErsatz) console.log('⛔ Bei ' + ohneErsatz + ' Wort/Woertern ist KEIN Vorschlag mehr uebrig — dort muss einer neu geschrieben werden.');
