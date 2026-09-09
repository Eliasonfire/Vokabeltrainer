#!/usr/bin/env node
/* pruefe-abgleich.mjs — steht JEDER gespeicherte Zustand im Geräteabgleich?
 *
 * ⛔ WARUM ES DIESE DATEI GIBT (06.09.2026)
 *
 * Elias' Ziel, im Wortlaut:
 *   „ich will das handy und tablet die beiden komplett identische daten haben,
 *    immer aktuell sind und das was auf dem einen gerät passiert auch auf dem
 *    anderen sofort passiert inklusive allen funktionen und aufgaben und
 *    lösungen usw, einfach alles"
 *
 * Ein neuer `localStorage`-Schlüssel entsteht beiläufig — jemand baut eine
 * Funktion, speichert etwas, und niemand denkt an `SYNC_SCHLUESSEL`. Der
 * Ausfall ist dann unsichtbar: auf jedem Gerät steht etwas Plausibles, nur
 * eben Verschiedenes.
 *
 * ⭐ Genau so ist `vt_einzeln_frei` monatelang liegengeblieben (siehe die
 * Begründung dort in js/sync.js: „Der Schluessel verliess das Geraet in KEINER
 * Richtung"), und `vt_hifz` lief zwar mit, aber über den Blockersatz — Elias'
 * Sure az-Zalzala verschwand deshalb vom Tablet.
 *
 * Diese Prüfung ist die allgemeine Regel statt des nächsten Einzeleintrags:
 * sie meldet jeden Schlüssel, den die App schreibt und der Abgleich nicht
 * kennt. [[allgemeine_regel_statt_listeneintrag]] [[ausfall_ist_unsichtbar_gebaut]]
 *
 * ⚠️ Sie misst NICHT, ob die Zusammenführung inhaltlich richtig ist — das tut
 * test-hifz-sync.mjs an echten Fällen. Hier geht es nur um die Frage: ist der
 * Schlüssel überhaupt dabei?
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HIER, '..');
let fehler = 0;
const sag = (ok, text) => { if (!ok) fehler++; console.log('  ' + (ok ? 'ok  ' : '⛔  ') + text); };

/* ---------- Was der Abgleich kennt ---------- */
const SYNC = fs.readFileSync(path.join(REPO, 'js', 'sync.js'), 'utf8');
const block = SYNC.match(/const SYNC_SCHLUESSEL = \[([\s\S]*?)\n\];/);
if (!block) { console.error('⛔ SYNC_SCHLUESSEL nicht gefunden — hat sync.js einen neuen Aufbau?'); process.exit(1); }
const imAbgleich = new Set([...block[1].matchAll(/['"`](vt_[A-Za-z0-9_]+)['"`]/g)].map(m => m[1]));

/* ---------- Was die App wirklich schreibt ---------- */
/* ⛔ Zwei Schlüssel gehören AUSDRÜCKLICH nicht hinein, und der Grund steht in
   js/sync.js: sie sind die Buchführung des Abgleichs selbst. Ein Stempel, der
   sich selbst abgleicht, ist eine Endlosschleife. Benannt statt still
   gefiltert — eine stille Ausnahme ist eine, die niemand mehr prüft. */
const AUSGENOMMEN = new Map([
  ['vt_syncStempel', 'die Zeitstempel des Abgleichs selbst — würde sich endlos abgleichen'],
  ['vt_quranEn',     'Zwischenspeicher der englischen Uebersetzung von api.quran.com — abgerufener Fremdtext, kein Lernstand. Er gehoert absichtlich NICHT auf andere Geraete: jedes holt sich beim Lesen selbst, was es braucht, und ein Abgleich wuerde nur Text hin- und herschieben, den die API ohnehin liefert. Verworfen wird er von selbst (QURAN_EN_MAX in js/quran.js)'],
  ['vt_syncStatus',  'der Zustand der letzten Übertragung, gilt nur für DIESES Gerät'],
  /* ⭐ Drei weitere, deren Begründung bis zum 08.09.2026 nur im
     KREISLAUFprüfer stand. Dieselbe Entscheidung, zwei Werkzeuge — und das
     zweite blieb deshalb rot, ohne dass etwas offen gewesen wäre.
     [[entscheidung_gilt_fuer_das_zweite_werkzeug]] */
  ['vt_einstGruppen', 'welche Einstellungsgruppe zugeklappt ist — eine Anzeigevorliebe des Geräts, an dem man gerade sitzt. Über den Abgleich getragen hieße: ein Griff am Handy baut die Ansicht am Tablet um, ohne dass dort jemand etwas getan hat'],
  ['vt_gehLog',       'Diagnose des Geh-Modus — misst auf DIESEM Gerät, ob die Sprachausgabe bei gesperrtem Bildschirm anspringt; genau diese Gerätebindung ist der Zweck'],
  ['vt_geraetId',     'trennt die Zeitzweige der Geräte. Abgeglichen wäre sie auf beiden gleich und könnte nichts mehr trennen'],
  /* ⭐ Zwei Diagnoseschlüssel vom 09.09.2026. Beide sind absichtlich
     gerätegebunden — und beim zweiten wäre der Abgleich sogar widersinnig:
     der Zähler misst die Schreibvorgänge DIESES Geräts gegen ein Kontingent,
     das sich alle Geräte teilen. Übertragen würde er sich gegenseitig
     überschreiben, und jedes Gerät läse die Zahl eines anderen.
     ⛔ Und er ist der einzige Schlüssel, dessen Abgleich das kostet, was er
     misst: jedes Übertragen wäre selbst ein Schreibvorgang.
     [[entscheidung_gilt_fuer_das_zweite_werkzeug]] */
  ['vt_feierLog',     'Feier-Protokoll — welche Feier auf WELCHEM Bildschirm lief. Eine Messung an diesem Gerät; die Feiern eines anderen Geräts hier zu sehen wäre eine falsche Fährte'],
  ['vt_syncPuts',     'Tageszähler der KV-Schreibvorgänge dieses Geräts. Abgeglichen würde er sich gegenseitig überschreiben — und jedes Übertragen wäre selbst ein Schreibvorgang, also genau das, was er begrenzen soll'],
]);

/* ⛔ Alle drei Zitierweisen UND Ziffern (09.09.2026). Bis dahin fand diese
   Zeile nur `'vt_x'` — ein `"vt_x"` oder `vt_hifz2` war unsichtbar, und ein
   Schluessel, den das Werkzeug nicht sieht, kann auch nicht fehlen. Aufgefallen
   an einem Stoertest in pruefe-sicherung.mjs, das dieselbe Erhebung machte;
   pruefe-kreislaeufe.mjs war schon breiter. Drei Werkzeuge, eine Frage — jetzt
   auch dieselbe Antwort. [[entscheidung_gilt_fuer_das_zweite_werkzeug]]
   [[gruener_pruefer_beweist_nur_geprueftes]] */
const gefunden = new Map();          /* schlüssel -> datei */
for (const datei of fs.readdirSync(path.join(REPO, 'js'))) {
  if (!datei.endsWith('.js')) continue;
  const text = fs.readFileSync(path.join(REPO, 'js', datei), 'utf8');
  for (const m of text.matchAll(/['"`](vt_[A-Za-z0-9_]+)['"`]/g))
    if (!gefunden.has(m[1])) gefunden.set(m[1], 'js/' + datei);
}

console.log('=== Schlüssel im Geräteabgleich ===\n');
console.log('  Die App schreibt ' + gefunden.size + ' Schlüssel, der Abgleich kennt ' + imAbgleich.size + '.');

const fehlend = [...gefunden].filter(([k]) => !imAbgleich.has(k) && !AUSGENOMMEN.has(k));
sag(!fehlend.length, fehlend.length
  ? fehlend.length + ' Schlüssel stehen NICHT im Abgleich: '
    + fehlend.map(([k, f]) => k + ' (' + f + ')').join(', ')
  : 'Jeder Schlüssel der App steht im Abgleich oder ist benannt ausgenommen.');
for (const [k, grund] of AUSGENOMMEN)
  console.log('     (' + k + ': ' + grund + ')');

/* Und die Gegenrichtung: ein Schlüssel im Abgleich, den niemand mehr schreibt,
   ist eine Leiche — sie kostet bei jeder Übertragung Platz und lässt vermuten,
   die Funktion gäbe es noch. */
const verwaist = [...imAbgleich].filter(k => !gefunden.has(k));
sag(!verwaist.length, verwaist.length
  ? verwaist.length + ' Schlüssel stehen im Abgleich, werden aber nirgends geschrieben: ' + verwaist.join(', ')
  : 'Kein verwaister Schlüssel im Abgleich.');

/* ---------- Wird das Geholte auch angezeigt? ---------- */
/* ⛔ Der zweite Weg, auf dem Elias' Hifz-Stand verschwand: der Abgleich holte
   ihn, aber die laufende Seite arbeitete mit ihrer Modulvariablen weiter und
   schrieb sie beim nächsten Speichern zurück. Wer eine Variable im Speicher
   hält, MUSS sie in ladeStandNeu() nachlesen. */
console.log('');
console.log('=== Wird das Geholte in die laufende Seite übernommen? ===\n');
const KERN = fs.readFileSync(path.join(REPO, 'js', 'kern.js'), 'utf8');
const laden = (KERN.match(/function ladeStandNeu\(\)\{[\s\S]*?\n\}/) || [''])[0];
const QURAN = fs.readFileSync(path.join(REPO, 'js', 'quran.js'), 'utf8');
const quranLaden = (QURAN.match(/function ladeQuranStandNeu\(\)\{[\s\S]*?\n\}/) || [''])[0];
const zusammen = laden + quranLaden;

const PFLICHT = [
  ['PROGRESS',       /PROGRESS = /],
  ['SETTINGS',       /SETTINGS, frisch|Object\.assign\(SETTINGS/],
  ['BEKANNT',        /BEKANNT = /],
  ['PERSONAL_VOCAB', /PERSONAL_VOCAB = /],
  ['CUSTOM_CATS',    /CUSTOM_CATS = /],
  ['HIFZ',           /HIFZ = /],
  ['HIFZ_VERSE',     /HIFZ_VERSE = /],
  ['QURAN_FAV',      /QURAN_FAV = /],
  ['UEBUNG_STAND',   /UEBUNG_STAND = /],
];
for (const [name, muster] of PFLICHT)
  sag(muster.test(zusammen), name + ' wird nach einem Abgleich neu eingelesen');

/* ---------- Zeigt der Bildschirm das Geholte auch an? ---------- */
/* ⛔ ladeStandNeu() ruft die Zeichenfunktionen ueber `typeof x === 'function'`.
   Das ist richtig — die Module werden einzeln geladen. Es verschluckt aber
   auch einen TIPPFEHLER: ein Aufruf auf einen Namen, den es nicht gibt, tut
   still gar nichts. Beim Bau am 06.09.2026 genau passiert: `renderWurzelBaum`
   und `CARD_ANSWERED` waren geraten, js/wurzel.js hat gar keine solche
   Funktion. [[werkzeug_ohne_aufrufer]] [[pruefung_fragt_einen_stellvertreter_ab]] */
console.log('');
console.log('=== Gibt es jede Funktion, die ladeStandNeu() aufruft? ===');
const alleJs = fs.readdirSync(path.join(REPO, 'js'))
  .filter(f => f.endsWith('.js'))
  .map(f => fs.readFileSync(path.join(REPO, 'js', f), 'utf8')).join(String.fromCharCode(10));
const gerufen = [...laden.matchAll(/typeof (\w+) === 'function'/g)].map(m => m[1]);
const tot = gerufen.filter(n => !alleJs.includes('function ' + n + '('));
console.log('  ' + gerufen.length + ' Funktionen gerufen: ' + gerufen.join(', '));
sag(!tot.length, tot.length
  ? tot.length + ' davon gibt es NICHT: ' + tot.join(', ')
  : 'Jede gerufene Zeichenfunktion existiert.');

/* ---------- Wie schnell kommt es an? ---------- */
/* ⛔ Elias' Ziel heisst „sofort". Erreichbar ist das mit KV nicht (kein Push),
   ABER sein Normalfall — Handy weglegen, Tablet nehmen — ist es praktisch:
   beim Verstecken wird SOFORT geschickt, beim Sichtbarwerden SOFORT geholt.
   Die Sekundenwerte greifen nur, wenn beide Geraete gleichzeitig offen sind.

   Diese Pruefung haelt genau das fest. Wer eine der drei Zahlen erhoeht oder
   den Sofort-Pfad entfernt, macht das Ziel kaputt — und zwar unsichtbar, weil
   nichts fehlt, sondern nur alles langsamer wird. */
console.log('');
console.log('=== Wie schnell kommt eine Aenderung an? ===');
const zahl = (name, muster) => {
  const m = SYNC.match(muster);
  return m ? Number(m[1]) * (m[2] ? Number(m[2]) : 1) : null;
};
const senden  = zahl('senden',  /SYNC_WARTEZEIT = (\d+) \* (\d+)/);
const holen   = zahl('holen',   /SYNC_TAKT = (\d+) \* (\d+)/);
const zurueck = zahl('zurueck', /SICHTBAR_ABSTAND = (\d+) \* (\d+)/);
console.log('  senden nach einer Aenderung: ' + (senden/1000) + ' s'
  + ' | laufender Abholtakt: ' + (holen/1000) + ' s'
  + ' | Sperre beim Zurueckkommen: ' + (zurueck/1000) + ' s');
sag(senden <= 10000,  'gesendet wird spaetestens nach 10 s');
sag(holen  <= 15000,  'geholt wird spaetestens alle 15 s, solange die App offen ist');
sag(zurueck <= 5000,  'beim Zurueckkommen wird fast ohne Sperre geholt');

/* Der Sofort-Pfad: beim Weglegen schicken, ohne auf den Takt zu warten. */
const versteckt = SYNC.slice(SYNC.indexOf(String.fromCharCode(39) + 'visibilitychange'));
/* ⚠️ Das Fenster war 400 Zeichen und riss am 09.09.2026, als zwischen die
   beiden Marken eine Begründung geschrieben wurde. Ein Abstandsmaß in
   ZEICHEN misst die Länge der Kommentare, nicht die Nähe der Anweisungen —
   deshalb großzügig, die Marken tragen die Aussage.
   [[pruefung_fragt_einen_stellvertreter_ab]] */
sag(/if \(!SYNC_OFFEN\) return;[\s\S]{0,1200}schickeZumServer\(/.test(versteckt),
    'beim Weglegen wird SOFORT geschickt (nicht erst nach der Sammelfrist)');
/* ⛔ Und seit dem 09.09.2026 gilt eine zweite Zusicherung an derselben Stelle:
   Die Bremse darf den Versuch abweisen (`null`), und dann muss `SYNC_OFFEN`
   STEHEN BLEIBEN. Andernfalls hielte die App eine Änderung für gesichert, die
   nie abging — die schlimmste der drei möglichen Ausgänge, weil sie sich nie
   von selbst meldet. [[erfolgsmeldung_ohne_wirkung]] */
sag(/schickeZumServer\(\)\.then\(\s*a\s*=>\s*\{\s*if \(a !== null\) SYNC_OFFEN = false/.test(versteckt),
    'eine abgewiesene Übertragung gilt NICHT als gesichert');
/* Und die Bremse sitzt an der Stelle, durch die alle drei Wege müssen. */
sag(/async function schickeZumServer\(absicht\)\{[\s\S]{0,1600}if \(absicht !== .knopf. && !syncDarfSchreiben\(\)\) return null;/.test(SYNC),
    'die Schreibbremse sitzt in schickeZumServer(), nicht bei einem Aufrufer');
sag(/gleicheAb\(false\)/.test(SYNC) && /still \? undefined : .knopf./.test(SYNC),
    '„Jetzt abgleichen" überholt die Bremse (sonst täte der Knopf nichts)');
/* ⚠️ Der Handler prueft `document.visibilityState === 'hidden'`, nicht
   `document.hidden` — mein erstes Muster suchte das Falsche und meldete einen
   Mangel, den es nicht gab. Gepruefte Bedingung statt gerater Schreibweise.
   [[testfehler_kann_echten_mangel_zeigen]] */
sag(/visibilityState/.test(versteckt) && /gleicheAb\(true\)/.test(versteckt),
    '… und beim Zurueckkommen sofort geholt');

/* ---------- Störtest ---------- */
console.log('');
const probe = 'vt_gibtesnicht';
sag(!imAbgleich.has(probe), 'Störtest: ein erfundener Schlüssel gilt als fehlend');
sag(!/vt_gibtesnicht/.test(zusammen), 'Störtest: eine erfundene Variable gilt als nicht nachgelesen');
sag(!alleJs.includes('function rendergibtesnicht('),
    'Störtest: eine erfundene Zeichenfunktion gilt als nicht vorhanden');

console.log('');
if (fehler) { console.log('⛔ ' + fehler + ' Befund(e).'); process.exit(1); }
console.log('✅ Jeder gespeicherte Zustand steht im Abgleich und wird danach neu eingelesen.');
process.exit(0);
