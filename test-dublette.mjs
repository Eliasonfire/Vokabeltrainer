/* test-dublette.mjs — ersetzt der Tausch eine eigene Vokabel verlustfrei?
 *
 * ⛔ WARUM ES DIESE DATEI GIBT (07.09.2026)
 *
 * Elias, nachdem ihm سَيِّدٌ als Dublette vorgelegt wurde:
 *   „wenn so ein fall kommt dann kannst du meine durch die im buch ersetzen.
 *    dieses eine wort soll dann schon voher einzeln freigeschalten sein und
 *    möglichst identisch durch meins ersetzt werden."
 *
 * Der Tausch löscht eine Karte. Was daran hängt — Fortschritt, Notiz, eigene
 * Eselsbrücke — ist selbst erarbeitet und nicht wiederherstellbar. Ein Fehler
 * hier ist kein Schönheitsfehler, sondern ein Verlust.
 *
 * ⭐ Die Funktionen werden aus js/kern.js GESCHNITTEN, nicht abgetippt.
 * [[pruefwerkzeug_mit_eingebauter_antwort]]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const KERN = fs.readFileSync(path.join(HIER, 'js', 'kern.js'), 'utf8');

let fehler = 0;
const sag = (ok, t) => { if (!ok) fehler++; console.log('  ' + (ok ? '✔' : '✘') + ' ' + t); };

/* ---------- Die drei Funktionen aus der Quelle holen ---------- */
/* ⛔ Ohne Regex: der Ausschnitt wird ueber indexOf gesucht. Ein Muster mit
   Escapes hat hier zwei Anlaeufe gekostet — jeder Weg ueber Shell oder
   Heredoc zerlegte die Backslashes. Ein Suchtext kann das nicht. */
const schneide = (name) => {
  const auf = KERN.indexOf('function ' + name + '(');
  if (auf < 0) { console.error('⛔ ' + name + '() nicht in js/kern.js gefunden.'); process.exit(1); }
  const zu = KERN.indexOf(String.fromCharCode(10) + '}', auf);
  if (zu < 0) { console.error('⛔ ' + name + '(): kein Ende gefunden.'); process.exit(1); }
  return KERN.slice(auf, zu + 2);
};
const quelle = [
  KERN.match(/const DUB_HARAKA_ENDE = [^\n]*/)[0],
  schneide('dubForm'), schneide('dubGleich'), schneide('dubletteImBuch'), schneide('tauscheDublette'),
].join('\n');

/* ---------- Eine kleine App darum herum ---------- */
function baueWelt(){
  const welt = {
    VOCAB_DATA: [
      { id: 'p_1', ar: 'سَيِّدٌ', de: 'Herr (höflich M)', chapter: 'personal' },
      { id: '46368', ar: 'سَيِّدٌ', de: 'Herr', chapter: 18, book: 'madina-2' },
      { id: 'p_2', ar: 'ظَرْف', de: 'Zeit- oder Ortsangabe', chapter: 'personal' },
      { id: '46352', ar: 'ظَرْفٌ', de: 'Umschlag', chapter: 17, book: 'madina-2' },
      { id: 'p_3', ar: 'لَحْمٌ', de: 'Fleisch', chapter: 'personal' },
    ],
    PROGRESS: { 'p_1': { box: 4, correct: 7, wrong: 1 } },
    NOTES:    { 'p_1': 'meine Eselsbrücke' },
    NOTIZEN:  { 'p_1': 'meine Notiz' },
    BEKANNT:  { 'p_1': { an: true, zeit: 5 } },
    EINZELN:  {},
    gespeichert: [],
    BEKANNT_SCHLUESSEL: 'vt_bekannt',
  };
  welt.LS = { set: (k) => welt.gespeichert.push(k) };
  welt.saveProgress  = () => welt.gespeichert.push('vt_progress');
  welt.saveNotes     = () => welt.gespeichert.push('vt_notes');
  welt.saveNotizen   = () => welt.gespeichert.push('vt_notizen');
  welt.setzeEinzelnFrei = (id, an) => { welt.EINZELN[id] = { an: !!an, zeit: 9 }; };
  welt.loeschePersonalVocab = (id) => {
    const i = welt.VOCAB_DATA.findIndex(w => w.id === id);
    if (i < 0) return false;
    welt.VOCAB_DATA.splice(i, 1);
    delete welt.PROGRESS[id]; delete welt.NOTES[id];
    delete welt.NOTIZEN[id];  delete welt.BEKANNT[id];
    return true;
  };
  const namen = Object.keys(welt);
  const fn = new Function(...namen, quelle + '\nreturn { tauscheDublette, dubletteImBuch, dubGleich };');
  return { welt, api: fn(...namen.map(n => welt[n])) };
}

console.log('=== Dublette erkennen ===\n');
{
  const { welt, api } = baueWelt();
  const eigen = welt.VOCAB_DATA.find(w => w.id === 'p_1');
  sag(api.dubletteImBuch(eigen) && api.dubletteImBuch(eigen).id === '46368',
      'سَيِّدٌ findet die Buchvokabel madina-2 K18');
  const zarf = welt.VOCAB_DATA.find(w => w.id === 'p_2');
  sag(!api.dubletteImBuch(zarf),
      '⛔ ظَرْف (Zeit-/Ortsangabe) gilt NICHT als Dublette zu ظَرْفٌ (Umschlag)');
  const lahm = welt.VOCAB_DATA.find(w => w.id === 'p_3');
  sag(!api.dubletteImBuch(lahm), 'لَحْمٌ ohne Gegenstück bleibt unberührt');
}

console.log('\n=== Der Tausch selbst ===\n');
{
  const { welt, api } = baueWelt();
  const r = api.tauscheDublette(welt.VOCAB_DATA.find(w => w.id === 'p_1'));
  sag(r && r.nach === '46368', 'meldet, worauf getauscht wurde');
  sag(welt.EINZELN['46368'] && welt.EINZELN['46368'].an,
      'die Buchvokabel ist VORHER einzeln freigeschaltet');
  sag(welt.PROGRESS['46368'] && welt.PROGRESS['46368'].box === 4,
      'der Fortschritt ist mitgewandert (Box 4, 7 richtig)');
  sag(welt.NOTES['46368'] === 'meine Eselsbrücke', 'die eigene Eselsbrücke ist mitgewandert');
  sag(welt.NOTIZEN['46368'] === 'meine Notiz',      'die Notiz ist mitgewandert');
  sag(welt.BEKANNT['46368'] && welt.BEKANNT['46368'].an, '„kenne ich schon" ist mitgewandert');
  sag(welt.gespeichert.includes('vt_bekannt'),
      '… und wurde auch GESPEICHERT (BEKANNT hat keine save-Funktion)');
  sag(!welt.VOCAB_DATA.some(w => w.id === 'p_1'), 'die eigene Karte ist weg');
  sag(!welt.PROGRESS['p_1'], '… samt ihrem Fortschritt');
}

console.log('\n=== ⛔ Vorhandenes am Ziel wird NICHT überschrieben ===\n');
{
  const { welt, api } = baueWelt();
  welt.PROGRESS['46368'] = { box: 2, correct: 3, wrong: 4 };
  welt.NOTES['46368'] = 'schon vorhanden';
  api.tauscheDublette(welt.VOCAB_DATA.find(w => w.id === 'p_1'));
  sag(welt.PROGRESS['46368'].box === 2 && welt.PROGRESS['46368'].correct === 3,
      'ein vorhandener Fortschritt am Ziel bleibt unangetastet');
  sag(welt.NOTES['46368'] === 'schon vorhanden', 'eine vorhandene Eselsbrücke ebenso');
  sag(!welt.VOCAB_DATA.some(w => w.id === 'p_1'),
      '… die Dublette wird trotzdem entfernt — sie ist die schwächere Karte');
}

console.log('\n=== Störtest: kann das hier überhaupt scheitern? ===\n');
{
  const { welt, api } = baueWelt();
  /* Ein Tausch OHNE Freischalten wäre der Fehler, vor dem Elias' Auflage
     schützt: das Wort verschwände aus seiner Reichweite. */
  const vorher = JSON.stringify(welt.EINZELN);
  api.tauscheDublette(welt.VOCAB_DATA.find(w => w.id === 'p_3'));   /* لَحْمٌ, keine Dublette */
  sag(JSON.stringify(welt.EINZELN) === vorher,
      'ohne Dublette wird NICHTS freigeschaltet und nichts gelöscht');
  sag(welt.VOCAB_DATA.some(w => w.id === 'p_3'), '… und die Karte bleibt stehen');
}

console.log('');
console.log(fehler ? '⛔ ' + fehler + ' Fehler' : '✅ alle Fälle richtig');
process.exit(fehler ? 1 : 0);
