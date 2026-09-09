#!/usr/bin/env node
/* pruefe-sicherung.mjs — ueberlebt Elias' Stand ein Einspielen?
 *
 * ⛔⛔ WARUM ES DIESE DATEI GIBT (09.09.2026)
 *
 * In js/einstellungen.js stand ZWEIMAL derselbe Satz, mit zwei Jahren
 * Abstand und zwei verschiedenen Schluesseln:
 *   „Wer eine Sicherung einspielte, verlor die Favoriten lautlos."   (vt_quranFav)
 *   „…ist die Sicherung eine Sicherung ohne sie, und das faellt erst
 *     beim Einspielen auf."                                          (vt_notizen)
 *
 * Beim dritten Mal ist es kein Einzelfall mehr, sondern eine fehlende Regel.
 * Gemessen am 09.09.2026: die App schrieb 37 Schluessel, der Geraeteabgleich
 * kannte 29, die Sicherung nur 18 — ELF Schluessel standen im Abgleich und
 * fehlten in der Sicherung. Verloren gingen beim Einspielen unter anderem der
 * Uebungsstand, die einzeln freigeschalteten Woerter, die Aussprache-Runde und
 * die gemessene Lernzeit. [[allgemeine_regel_statt_listeneintrag]]
 *
 * ⭐ DIE REGEL: Was es wert ist, auf ein anderes Geraet getragen zu werden,
 * ist es auch wert, ein Einspielen zu ueberleben. `SYNC_SCHLUESSEL` ist die
 * Entscheidung der App darueber, was Elias gehoert — die Sicherung darf
 * dahinter nicht zurueckfallen, ausser mit benanntem Grund.
 *
 * ⚠️ Das ist die SCHWESTERPRUEFUNG zu pruefe-abgleich.mjs, nicht dieselbe:
 * dort geht es um zwei Geraete, hier um zwei Zeitpunkte. Dieselbe
 * Entscheidung, zwei Werkzeuge — und das zweite fehlte bisher ganz.
 * [[entscheidung_gilt_fuer_das_zweite_werkzeug]]
 *
 * ⚠️ `pruefe-oberflaeche.js` prueft Aehnliches, laeuft aber NUR im Browser
 * (unter node: „SETTINGS is not defined") und ist im Sammellauf nicht dabei.
 * Eine Pruefung, die nur laeuft, wenn jemand sie von Hand anstoesst, hat den
 * Fall zwei Jahre lang nicht gefunden. [[werkzeug_ohne_aufrufer]]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HIER, '..');
let fehler = 0;
const sag = (ok, text) => { if (!ok) fehler++; console.log('  ' + (ok ? 'ok  ' : '⛔  ') + text); };

const lies = (...t) => fs.readFileSync(path.join(REPO, ...t), 'utf8');
const liste = (text, name) => {
  const b = text.match(new RegExp('const ' + name + ' = \\[([\\s\\S]*?)\\n\\];'));
  if (!b) { console.error('⛔ ' + name + ' nicht gefunden — hat die Datei einen neuen Aufbau?'); process.exit(1); }
  return new Set([...b[1].matchAll(/'(vt_[A-Za-z_]+)'/g)].map(m => m[1]));
};

const EINST = lies('js', 'einstellungen.js');
const SYNC  = lies('js', 'sync.js');
const inSicherung = liste(EINST, 'SICHERUNGS_SCHLUESSEL');
const imAbgleich  = liste(SYNC,  'SYNC_SCHLUESSEL');

/* Was die App ueberhaupt schreibt — dieselbe Erhebung wie in pruefe-abgleich.mjs.

   ⛔ Alle DREI Zitierweisen (09.09.2026). Bis dahin suchte diese Zeile nur
   nach einfachen Anfuehrungszeichen. Aufgefallen ist es beim Stoertest zu 2b:
   ein eingesetzter `"vt_probeSchluessel"` blieb unsichtbar, und der Pruefer
   meldete gruen. Ein Schluessel, den das Werkzeug nicht sieht, kann auch nicht
   in der Sicherung fehlen — genau die Sorte gruen, die nichts bedeutet.
   [[gruener_pruefer_beweist_nur_geprueftes]] [[zeichenklasse_nie_sichtbar_kopieren]] */
const geschrieben = new Map();
for (const datei of fs.readdirSync(path.join(REPO, 'js'))) {
  if (!datei.endsWith('.js')) continue;
  const text = lies('js', datei);
  for (const m of text.matchAll(/['"`](vt_[A-Za-z_]+)['"`]/g))
    if (!geschrieben.has(m[1])) geschrieben.set(m[1], 'js/' + datei);
}

console.log('=== Deckt die Sicherung ab, was Elias gehoert? ===\n');
console.log('  Die App schreibt ' + geschrieben.size + ' Schluessel, der Abgleich kennt '
  + imAbgleich.size + ', die Sicherung ' + inSicherung.size + '.\n');

/* ---------- 1. Kein Abgleich-Schluessel darf in der Sicherung fehlen ----------
   ⛔ Benannt ausgenommen, nicht still gefiltert: eine stille Ausnahme ist
   eine, die niemand mehr prueft. */
/* Bisher LEER, und das ist die Aussage: es gibt derzeit keinen Schluessel, den
   der Abgleich traegt und die Sicherung aus gutem Grund auslaesst. Kommt einer
   dazu, gehoert er hier hinein — MIT seinem Grund, sonst ist die Liste nur
   eine Behauptung. [[regel_gilt_nur_mit_begruendung]] */
const AUSGENOMMEN = new Map();

const fehltInSicherung = [...imAbgleich].filter(k => !inSicherung.has(k) && !AUSGENOMMEN.has(k));
sag(!fehltInSicherung.length, fehltInSicherung.length
  ? fehltInSicherung.length + ' Schluessel stehen im ABGLEICH, aber NICHT in der Sicherung — '
    + 'beim Einspielen gehen sie still verloren: ' + fehltInSicherung.join(', ')
  : 'Jeder Schluessel des Geraeteabgleichs ueberlebt auch ein Einspielen.');
for (const [k, grund] of AUSGENOMMEN) console.log('     (' + k + ': ' + grund + ')');

/* ---------- 2. Keine Leiche in der Sicherung ----------
   Ein Schluessel, den niemand mehr schreibt, laesst vermuten, die Funktion
   gaebe es noch — und blaeht jede Sicherungsdatei. */
const verwaist = [...inSicherung].filter(k => !geschrieben.has(k));
sag(!verwaist.length, verwaist.length
  ? verwaist.length + ' Schluessel stehen in der Sicherung, werden aber nirgends geschrieben: ' + verwaist.join(', ')
  : 'Kein verwaister Schluessel in der Sicherung.');

/* ---------- 2b. Und die dritte Richtung: was in KEINER Liste steht ----------

   ⛔⛔ DIE LUECKE, DIE DEN 11-SCHLUESSEL-FEHLER MOEGLICH GEMACHT HAT
   (09.09.2026). Die Kopfzeile nannte bisher nur die Zahlen — „37 · 29 · 29" —
   und niemand musste erklaeren, wer die acht sind. Genau so verschwanden elf
   Schluessel aus der Sicherung: nicht durch eine falsche Entscheidung, sondern
   durch eine Zahl ohne Liste. [[trefferquote_ohne_preis]] [[zahlen_ohne_beleg]]

   Die Regel ist dieselbe wie oben: benannt ausgenommen, nicht still gefiltert.
   Jeder Schluessel, den die App nennt und der weder im Abgleich noch in der
   Sicherung steht, braucht hier seinen GRUND. Kommt ein neuer dazu, faellt er
   auf — und dann steht die Frage im Raum, statt beantwortet zu scheinen.
   [[regel_gilt_nur_mit_begruendung]] [[daten_ohne_zugang]]

   ⚠️ Die Gruende stehen nicht hier, sondern im Quelltext an der Stelle selbst;
   diese Liste zitiert sie nur. */
const OHNE_LISTE = new Map([
  ['vt_geraetId',    'Geraetekennung — DARF nicht abgeglichen werden, sonst haetten beide '
                   + 'Geraete dieselbe und die Trennung waere hinfaellig (js/zeitmessung.js:73)'],
  ['vt_syncStatus',  'Buchfuehrung des Abgleichs selbst; eingespielt wuerde sie ueber einen '
                   + 'Zustand luegen, den es auf diesem Geraet nie gab'],
  ['vt_syncStempel', 'dito — der Stempel gehoert zum Geraet, nicht zum Lernstand'],
  ['vt_syncPuts',    'Tageszaehler der KV-Schreibvorgaenge, nur fuer die Diagnosekarte '
                   + '(js/sync.js:1175)'],
  ['vt_einstGruppen','welche Abschnitte der Einstellungen aufgeklappt sind — Bedienzustand, '
                   + 'kein Lernstand; ausdruecklich auch aus dem Abgleich genommen'],
  ['vt_feierLog',    'Diagnoseprotokoll der Feiern, begrenzt und geraetelokal (js/feier.js:469)'],
  ['vt_gehLog',      'Diagnoseprotokoll des Hoermodus, „Diagnosewerkzeug, kein Archiv" '
                   + '(js/hoeren.js:634)'],
  ['vt_quranEn',     'Zwischenspeicher der englischen Uebersetzung, hoechstens zwoelf Suren '
                   + 'und jederzeit nachladbar (js/quran.js:484)'],
]);

const ohneListe = [...geschrieben.keys()]
  .filter(k => !inSicherung.has(k) && !imAbgleich.has(k) && !OHNE_LISTE.has(k));
sag(!ohneListe.length, ohneListe.length
  ? ohneListe.length + ' Schluessel steht/stehen in KEINER Liste und haben hier keinen Grund: '
    + ohneListe.map(k => k + ' (' + geschrieben.get(k) + ')').join(', ')
    + ' — entweder in die Sicherung aufnehmen oder den Grund eintragen.'
  : 'Jeder Schluessel ausserhalb der Listen traegt seinen Grund (' + OHNE_LISTE.size + ').');

/* ⚠️ Und die Gegenrichtung: eine Ausnahme fuer einen Schluessel, den es nicht
   mehr gibt, ist eine Behauptung ueber nichts — und sie deckt kuenftig einen
   gleichnamigen neuen zu. */
const totAusgenommen = [...OHNE_LISTE.keys()].filter(k => !geschrieben.has(k));
sag(!totAusgenommen.length, totAusgenommen.length
  ? totAusgenommen.length + ' Grund/Gruende gelten fuer Schluessel, die es nicht mehr gibt: '
    + totAusgenommen.join(', ')
  : 'Kein Grund steht fuer einen Schluessel, den es nicht mehr gibt.');

/* ⚠️ DIESELBEN ACHT STEHEN IN pruefe-abgleich.mjs — mit anderen Gruenden, denn
   dort ist die Frage „gehoert er auf das zweite Geraet?" und hier „gehoert er
   in die Sicherung?". Zwei Fragen, zwei Begruendungen: das ist richtig so.
   ⛔ Was NICHT auseinanderlaufen darf, ist die MENGE. Wer dort einen Schluessel
   ausnimmt und hier nicht, hat ihn aus dem Abgleich UND unbemerkt aus der
   Sicherung genommen — und dann faellt es keinem der beiden Pruefer auf.
   [[dieselbe_frage_zwei_antworten]] [[entscheidung_gilt_fuer_das_zweite_werkzeug]] */
{
  let dort = null;
  try {
    const t = lies('werkzeuge', 'pruefe-abgleich.mjs');
    const b = t.match(/const AUSGENOMMEN = new Map\(\[([\s\S]*?)\n\]\);/);
    if (b) dort = new Set([...b[1].matchAll(/\[\s*'(vt_[A-Za-z0-9_]+)'/g)].map(m => m[1]));
  } catch (e){ /* unten als „nicht lesbar" gemeldet */ }
  if (!dort || !dort.size){
    sag(false, 'Die Ausnahmeliste von pruefe-abgleich.mjs liess sich nicht lesen — '
      + 'der Abgleich der beiden Listen ist damit NICHT geprueft.');
  } else {
    const nurHier = [...OHNE_LISTE.keys()].filter(k => !dort.has(k));
    const nurDort = [...dort].filter(k => !OHNE_LISTE.has(k));
    sag(!nurHier.length && !nurDort.length,
      (nurHier.length || nurDort.length)
        ? 'Die Ausnahmen laufen auseinander — '
          + (nurHier.length ? 'nur hier: ' + nurHier.join(', ') + '. ' : '')
          + (nurDort.length ? 'nur in pruefe-abgleich.mjs: ' + nurDort.join(', ') + '.' : '')
        : 'Beide Werkzeuge nehmen dieselben ' + dort.size + ' Schluessel aus.');
  }
}

/* Stoertest fuer 2b — an einem Fall, dessen Antwort feststeht. */
{
  const erfunden = 'vt_gibtEsNicht';
  const wieOben = (k) => !inSicherung.has(k) && !imAbgleich.has(k) && !OHNE_LISTE.has(k);
  const einListen = [...inSicherung][0];
  const ok = wieOben(erfunden) === true
          && wieOben('vt_geraetId') === false
          && (einListen ? wieOben(einListen) === false : false);
  sag(ok, ok
    ? 'Stoertest: ein unbekannter Schluessel faellt auf, ein begruendeter und ein gelisteter nicht.'
    : 'Stoertest 2b wirkungslos — die Regel unterscheidet die drei Faelle nicht.');
}

/* ---------- 3. Der Rundlauf mit den ECHTEN Funktionen ----------
   ⛔ NICHT nachgebaut. `baueSicherung()` und der Einlese-Zweig werden aus
   js/einstellungen.js ausgeschnitten und ausgefuehrt. Ein Nachbau prueft den
   Nachbau. [[testvorlage_selbst_nachgebaut]] */
console.log('\n=== Rundlauf: sichern → alles loeschen → einspielen ===\n');

const bauQuelle = (EINST.match(/function baueSicherung\(\)\{[\s\S]*?\n\}/) || [''])[0];
sag(!!bauQuelle, 'baueSicherung() ist auffindbar.');

const speicher = new Map();
const localStorage = {
  getItem: (k) => (speicher.has(k) ? speicher.get(k) : null),
  setItem: (k, v) => speicher.set(k, String(v)),
  removeItem: (k) => speicher.delete(k),
};
const VOCAB_DATA = { length: 171 };
const SICHERUNGS_SCHLUESSEL = [...inSicherung];
const baueSicherung = new Function('localStorage', 'VOCAB_DATA', 'SICHERUNGS_SCHLUESSEL',
  bauQuelle + '\nreturn baueSicherung;')(localStorage, VOCAB_DATA, SICHERUNGS_SCHLUESSEL);

/* Ein Stand, der jeden Schluessel belegt — sonst prueft der Rundlauf die
   Schluessel, die gerade zufaellig leer sind, gar nicht.
   [[flaeche_nur_im_gefuellten_zustand]] */
for (const k of geschrieben.keys()) localStorage.setItem(k, JSON.stringify({ probe: k, n: k.length }));
const vorher = new Map(speicher);

const datei = JSON.parse(JSON.stringify(baueSicherung()));
sag(datei.art === 'vokabeltrainer-sicherung', 'Die Datei traegt ihre Kennung.');
sag(Object.keys(datei.daten).length === inSicherung.size,
  'Die Sicherung enthaelt alle ' + inSicherung.size + ' Schluessel (gezaehlt: ' + Object.keys(datei.daten).length + ').');

/* Einspielen — genau der Zweig aus dem change-Ereignis: bekannte Schluessel
   uebernehmen, unbekannte entfernen. */
speicher.clear();
/* ⭐ Zwei Fremdlinge mit ENTGEGENGESETZTER Erwartung — und der erste Entwurf
   dieser Pruefung hatte beide verwechselt und die App zu Unrecht rot gemeldet:
   • `vt_geraetId` liegt SCHON auf dem Geraet und ist bewusst geraetegebunden.
     Er muss ein Einspielen UEBERLEBEN — wird er geloescht, koennen die
     Zeitzweige der Geraete nicht mehr getrennt werden.
   • `vt_boesartig` steht in der DATEI und in keiner Liste. Er darf NICHT
     geschrieben werden: eine Sicherungsdatei ist eine fremde Datei.
   [[kennzeichen_mit_zwei_ursachen]] */
localStorage.setItem('vt_geraetId', 'dieses Geraet');
datei.daten['vt_boesartig'] = 'aus einer fremden Datei';
for (const k of SICHERUNGS_SCHLUESSEL) {
  if (typeof datei.daten[k] === 'string') localStorage.setItem(k, datei.daten[k]);
  else localStorage.removeItem(k);
}

const verloren = [...vorher.keys()].filter(k => imAbgleich.has(k) && !speicher.has(k));
sag(!verloren.length, verloren.length
  ? verloren.length + ' Schluessel haben den Rundlauf NICHT ueberlebt: ' + verloren.join(', ')
  : 'Alle ' + [...vorher.keys()].filter(k => imAbgleich.has(k)).length
    + ' Abgleich-Schluessel haben den Rundlauf ueberlebt.');

/* ⚠️ Nur die GESICHERTEN Schluessel vergleichen. `vt_geraetId` wird oben
   absichtlich ueberschrieben, um seine Geraetebindung zu pruefen — er gehoert
   nicht in diese Frage. Der erste Entwurf verglich alles und meldete damit
   seinen eigenen Aufbau als Befund. [[pruefwerkzeug_mit_eingebauter_antwort]] */
const verfaelscht = [...speicher]
  .filter(([k, v]) => inSicherung.has(k) && vorher.has(k) && vorher.get(k) !== v)
  .map(([k]) => k);
sag(!verfaelscht.length, verfaelscht.length
  ? 'Werte haben sich beim Rundlauf VERAENDERT: ' + verfaelscht.join(', ')
  : 'Kein Wert hat sich beim Rundlauf veraendert.');

sag(!speicher.has('vt_boesartig'),
  'Ein Schluessel, der nur in der DATEI steht, wird nicht uebernommen.');
sag(speicher.get('vt_geraetId') === 'dieses Geraet',
  'Ein geraetegebundener Schluessel ueberlebt das Einspielen unveraendert.');

/* ---------- 4. Stoertests: kann das hier ueberhaupt rot werden? ----------
   [[stoertest_muss_wirkung_nachweisen]] */
console.log('\n=== Stoertests ===\n');
const ohneEinen = new Set([...inSicherung]); ohneEinen.delete([...imAbgleich][0]);
sag([...imAbgleich].some(k => !ohneEinen.has(k)),
  'Fehlt ein Abgleich-Schluessel in der Sicherung, faellt es auf (Probe 1).');

const gekuerzt = { ...datei.daten }; delete gekuerzt[[...inSicherung][0]];
speicher.clear();
for (const k of SICHERUNGS_SCHLUESSEL) {
  if (typeof gekuerzt[k] === 'string') localStorage.setItem(k, gekuerzt[k]);
  else localStorage.removeItem(k);
}
sag(speicher.size === inSicherung.size - 1,
  'Eine unvollstaendige Sicherungsdatei fuehrt zu einem unvollstaendigen Stand — der Rundlauf misst wirklich (Probe 2).');

console.log('');
console.log(fehler ? '⛔ ' + fehler + ' Befund(e) — beim Einspielen ginge Lernstand verloren.'
                   : '✅ Die Sicherung deckt den ganzen Lernstand ab, und der Rundlauf ist verlustfrei.');
process.exit(fehler ? 1 : 0);
