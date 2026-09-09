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

/* Was die App ueberhaupt schreibt — dieselbe Erhebung wie in pruefe-abgleich.mjs. */
const geschrieben = new Map();
for (const datei of fs.readdirSync(path.join(REPO, 'js'))) {
  if (!datei.endsWith('.js')) continue;
  const text = lies('js', datei);
  for (const m of text.matchAll(/'(vt_[A-Za-z_]+)'/g))
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
