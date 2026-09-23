/* ============================================================================
   Eine Karte aus der Fachbegriff-Datei nur auf Elias' Wort.
   ============================================================================

   Elias am 23.09.2026, 15:08, nachdem er im Hörmodus die Karte „Übereinstimmung
   — die Aussage passt sich im Geschlecht an" gesehen hatte:

     „das ist keine vokabel die ich lernen möchte. wir hatten dieses thema
      schonmal das ich diese fachbegriffe nicht haben will. ich hattte
      spezifisch darum gebeten akkusativ, genitiv und nominativ und vielleicht
      noch eine hand voll weitere zu haben aber nicht solceh dinge. irgendjemand
      fügt sich dauerhaft hinzu und das will ich nicht. prüfe bitte woher das
      kommt und warum und SORGE DAFÜR DAS ES NICHT WIEDER SO DAZU KOMMT."

   ---------------------------------------------------------------------------
   WOHER ES KAM
   ---------------------------------------------------------------------------
   Der „irgendjemand" war werkzeuge/fachbegriffe-setzen.mjs, aufgerufen von der
   Wartungsroutine (Schritt 1f, seit dem 11.09.2026). Es trug an diesem Tag 16
   Fachbegriffe ein (v471, v473), keinen davon hatte er einzeln bestellt. Und
   ein Eintrag in data/fachbegriffe.js WAR bis dahin automatisch eine Karte —
   in Kartei, Hörmodus, Suche und Satzmodus zugleich.
   Der Versuch vom 22.09.2026 (v566) nahm 13 davon nur aus der KARTEI; im
   Hörmodus blieben sie, und dort sah er einen Tag später den nächsten.

   ---------------------------------------------------------------------------
   WAS DIESER PRÜFER BEWACHT — die WIRKSAMKEIT, nicht nur das Ergebnis
   ---------------------------------------------------------------------------
     1. Die Weißliste FACHBEGRIFF_AUFTRAG gibt es, jede Zeile nennt ein Datum
        und SEINEN Satz („…"), und jede zeigt auf einen echten Eintrag.
     2. js/kern.js lässt einen Eintrag nur durch fachbegriffBestellt() in
        VOCAB_DATA — an der EINEN Tür, durch die alle Modi ihre Karten holen.
        Dazu die zwei Nebentüren: Buchtausch und Fortschritt-Nachholen.
     3. fachbegriffBestellt() entscheidet in beide Richtungen richtig
        (zweiseitig geeicht am echten Funktionstext, nicht an einem Nachbau).
     4. Die Wartungsroutine darf fachbegriffe-setzen.mjs NICHT mehr aufrufen —
        weder laut Prompt noch laut Freigabe in routines.json.
     5. Jede der Erkennungen oben wird vorher an einem Gegenbeispiel geeicht:
        ein Prüfer, der nie rot werden kann, beweist nichts.

   Aufruf:  node werkzeuge/pruefe-fachbegriff-auftrag.mjs
            node werkzeuge/pruefe-fachbegriff-auftrag.mjs --liste   (auch die ruhenden)
   Exit 0 = in Ordnung, 1 = ein Befund.
   ============================================================================ */

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import vm from 'node:vm';

const HIER   = path.dirname(url.fileURLToPath(import.meta.url));
const WURZEL = path.resolve(HIER, '..');
const AUTOMATION = path.resolve(WURZEL, '..', 'Automation');
const zeigeAlle = process.argv.includes('--liste');

const befunde = [];
const meldung = (z) => befunde.push(z);

/* ---------- Daten laden ---------- */
/* ⛔ `const NAME = …` landet nicht am globalen Objekt eines vm-Kontexts — deshalb
   wird jeder Name ausdrücklich herausgereicht. [[leere_liste_ist_keine_messung]] */
function ladeNamen(datei, namen){
  const quelltext = fs.readFileSync(path.join(WURZEL, datei), 'utf8');
  const ctx = { window: {}, document: {}, __raus: {} };
  vm.createContext(ctx);
  vm.runInContext(quelltext + '\n;' + namen
    .map(n => `try{__raus[${JSON.stringify(n)}]=${n}}catch(e){}`).join(';'), ctx);
  return ctx.__raus;
}
const { FACHBEGRIFF_VOKABELN, FACHBEGRIFF_AUFTRAG, FACHBEGRIFF_ABBESTELLT } =
  ladeNamen('data/fachbegriffe.js', ['FACHBEGRIFF_VOKABELN', 'FACHBEGRIFF_AUFTRAG', 'FACHBEGRIFF_ABBESTELLT']);

if (!Array.isArray(FACHBEGRIFF_VOKABELN) || !FACHBEGRIFF_VOKABELN.length){
  console.log('✖ data/fachbegriffe.js liefert keine Einträge — nichts zu prüfen.');
  process.exit(1);
}

/* ---------- Die Erkennungen, als Funktionen — damit sie geeicht werden können ---------- */

const DATUM = /\b\d{2}\.\d{2}\.\d{4}\b/;
const ZITAT = /„[^“"]{3,}[“"]/;
function zeilenFehler(auftrag, ids, name = 'FACHBEGRIFF_AUFTRAG'){
  const f = [];
  if (!auftrag || typeof auftrag !== 'object' || Array.isArray(auftrag)){
    f.push(name === 'FACHBEGRIFF_AUFTRAG'
      ? 'FACHBEGRIFF_AUFTRAG fehlt in data/fachbegriffe.js — ohne die Liste gilt in der App NICHTS als bestellt, alle Fachbegriff-Karten wären weg.'
      : name + ' fehlt in data/fachbegriffe.js — dann böte die Warteseite ihm Begriffe an, die er schon abgelehnt hat.');
    return f;
  }
  for (const [id, wert] of Object.entries(auftrag)){
    if (!ids.has(id)) f.push(name + ' nennt ' + id + ', aber diesen Eintrag gibt es nicht (verwaist oder vertippt).');
    const w = String(wert || '');
    if (!DATUM.test(w)) f.push(name + '[' + id + ']: kein Datum (TT.MM.JJJJ) — wann hat er es gesagt?');
    if (!ZITAT.test(w)) f.push(name + '[' + id + ']: kein Satz von ihm in „…" — ohne sein Wort ist die Zeile eine Vermutung.');
  }
  return f;
}
/* Bestellt UND abbestellt zugleich geht nicht: dann entschiede die Reihenfolge
   im Code, und keiner merkt es. */
function konfliktFehler(auftrag, abbestellt){
  if (!auftrag || !abbestellt) return [];
  return Object.keys(abbestellt).filter(id => Object.prototype.hasOwnProperty.call(auftrag, id))
    .map(id => id + ' steht in FACHBEGRIFF_AUFTRAG UND in FACHBEGRIFF_ABBESTELLT — sagt er doch ja, muss die Zeile unter ABBESTELLT raus.');
}

/* Die EINE Tür: die Zeile, die Fachbegriffe in VOCAB_DATA hängt, muss filtern. */
function tuerFehler(kernText){
  const f = [];
  if (!/function\s+fachbegriffBestellt\s*\(/.test(kernText))
    f.push('js/kern.js: function fachbegriffBestellt fehlt.');
  const push = kernText.match(/VOCAB_DATA\.push\(\s*\.\.\.FACHBEGRIFF_VOKABELN[^\n]*/g) || [];
  if (!push.length) f.push('js/kern.js: die Zeile VOCAB_DATA.push(...FACHBEGRIFF_VOKABELN…) ist nicht zu finden — der Prüfer kann die Tür nicht belegen.');
  for (const z of push)
    if (!/fachbegriffBestellt/.test(z)) f.push('js/kern.js hängt Fachbegriffe ohne fachbegriffBestellt() in VOCAB_DATA: ' + z.trim().slice(0, 120));
  const koerper = (name) => {
    const i = kernText.indexOf('function ' + name + '(');
    return i < 0 ? null : kernText.slice(i, kernText.indexOf('\n}', i) + 2);
  };
  for (const name of ['fachbegriffeMitBuchkarte', 'holeFortschrittNach']){
    const k = koerper(name);
    if (k === null) f.push('js/kern.js: ' + name + '() nicht gefunden.');
    else if (/FACHBEGRIFF_VOKABELN/.test(k) && !/fachbegriffBestellt/.test(k))
      f.push('js/kern.js: ' + name + '() liest FACHBEGRIFF_VOKABELN ohne fachbegriffBestellt() — ein ruhender Begriff könnte dort eine Buchkarte umschreiben oder Fortschritt vererben.');
  }
  return f;
}

/* Die Routine: darf fachbegriffe-setzen.mjs weder genannt bekommen noch freigegeben haben. */
const SETZEN = /fachbegriffe-setzen\.mjs/;
function freigabeFehler(prompt, routinen){
  const f = [];
  if (prompt === null) f.push('Automation/prompts/vokabeltrainer-wartung.md nicht lesbar — die Routine lässt sich nicht prüfen.');
  else {
    const werkzeugzeile = prompt.split('\n').filter(z => /Bash\(node werkzeuge\/fachbegriffe-setzen\.mjs/.test(z));
    if (werkzeugzeile.length) f.push('Wartungsprompt gibt fachbegriffe-setzen.mjs als Werkzeug frei: ' + werkzeugzeile[0].trim().slice(0, 100));
    const aufruf = prompt.split('\n').filter(z => /^\s*node werkzeuge\/fachbegriffe-setzen\.mjs/.test(z));
    if (aufruf.length) f.push('Wartungsprompt ruft fachbegriffe-setzen.mjs auf: ' + aufruf[0].trim().slice(0, 100));
  }
  if (routinen === null) f.push('Automation/routines.json nicht lesbar — die Freigaben lassen sich nicht prüfen.');
  else {
    const lauf = (x, pfad) => {
      if (Array.isArray(x)) x.forEach((y, i) => {
        if (typeof y === 'string' && SETZEN.test(y)) f.push('routines.json gibt frei: ' + y + ' (' + pfad + ')');
        else lauf(y, pfad + '[' + i + ']');
      });
      else if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) lauf(v, pfad + '.' + k);
    };
    lauf(routinen, '');
  }
  return f;
}

/* ---------- 0. Eichung der Erkennungen an Gegenbeispielen ---------- */

const eichung = [];
{
  const ids = new Set(['a']);
  if (zeilenFehler({ a: '23.09.2026 — „mach das"' }, ids).length) eichung.push('Zeilenprüfung meldet eine gute Zeile.');
  if (!zeilenFehler({ a: 'weil es in seinen Regeln steht' }, ids).length) eichung.push('Zeilenprüfung übersieht eine Zeile ohne Datum und Satz.');
  if (!zeilenFehler({ b: '23.09.2026 — „x y z"' }, ids).length) eichung.push('Zeilenprüfung übersieht eine verwaiste Kennung.');
  if (!zeilenFehler(undefined, ids).length) eichung.push('Zeilenprüfung übersieht eine fehlende Liste.');
  if (!konfliktFehler({ a: 'x' }, { a: 'y' }).length) eichung.push('Konfliktprüfung übersieht eine Kennung, die bestellt UND abbestellt ist.');

  const gut = 'function fachbegriffBestellt(w){}\nVOCAB_DATA.push(...FACHBEGRIFF_VOKABELN.filter(w => fachbegriffBestellt(w) && x));\n'
    + 'function fachbegriffeMitBuchkarte(){\n  FACHBEGRIFF_VOKABELN.filter(f => fachbegriffBestellt(f));\n}\nfunction holeFortschrittNach(){\n  FACHBEGRIFF_VOKABELN.filter(fachbegriffBestellt);\n}\n';
  const schlecht = gut.replace('fachbegriffBestellt(w) && x', 'x');
  if (tuerFehler(gut).length) eichung.push('Türprüfung meldet einen guten Quelltext: ' + tuerFehler(gut)[0]);
  if (!tuerFehler(schlecht).length) eichung.push('Türprüfung übersieht eine Tür ohne Filter.');

  if (freigabeFehler('`Bash(node werkzeuge/fachbegriffe-finden.mjs)`', { a: { allowedTools: ['Bash(node werkzeuge/fachbegriffe-finden.mjs:*)'] } }).length)
    eichung.push('Freigabeprüfung meldet eine erlaubte Freigabe.');
  if (!freigabeFehler('**`Bash(node werkzeuge/fachbegriffe-setzen.mjs)`**', { a: {} }).length)
    eichung.push('Freigabeprüfung übersieht das Werkzeug im Prompt.');
  if (!freigabeFehler('', { a: { allowedTools: ['Bash(node werkzeuge/fachbegriffe-setzen.mjs:*)'] } }).length)
    eichung.push('Freigabeprüfung übersieht die Freigabe in routines.json.');
}
for (const e of eichung) meldung('Eichung: ' + e);

/* ---------- 1. Die Liste ---------- */

const ids = new Set(FACHBEGRIFF_VOKABELN.map(w => String(w.id)));
zeilenFehler(FACHBEGRIFF_AUFTRAG, ids).forEach(meldung);
zeilenFehler(FACHBEGRIFF_ABBESTELLT, ids, 'FACHBEGRIFF_ABBESTELLT').forEach(meldung);
konfliktFehler(FACHBEGRIFF_AUFTRAG, FACHBEGRIFF_ABBESTELLT).forEach(meldung);

/* ---------- 2. Die Tür in der App ---------- */

const kern = fs.readFileSync(path.join(WURZEL, 'js/kern.js'), 'utf8');
tuerFehler(kern).forEach(meldung);

/* ---------- 3. Die Funktion selbst, zweiseitig — am ECHTEN Funktionstext ---------- */

const iF = kern.indexOf('function fachbegriffBestellt(');
if (iF >= 0){
  const quelle = kern.slice(iF, kern.indexOf('\n}', iF) + 2);
  const teste = (liste, w) => {
    const ctx = liste === undefined ? {} : { FACHBEGRIFF_AUFTRAG: liste };
    vm.createContext(ctx);
    return vm.runInContext(quelle + '\n;fachbegriffBestellt(' + JSON.stringify(w) + ')', ctx);
  };
  try {
    if (teste({ 'gram-x': '23.09.2026 — „ja"' }, { id: 'gram-x' }) !== true) meldung('fachbegriffBestellt(): ein bestellter Eintrag gilt nicht als bestellt.');
    if (teste({ 'gram-x': '23.09.2026 — „ja"' }, { id: 'gram-mutabaqa' }) !== false) meldung('fachbegriffBestellt(): ein NICHT bestellter Eintrag geht durch.');
    if (teste(undefined, { id: 'gram-x' }) !== false) meldung('fachbegriffBestellt(): ohne Liste geht ein Eintrag durch — es muss dann NICHTS durchgehen.');
    if (teste({ toString: 'x' }, { id: 'toString' }) !== true || teste({}, { id: 'toString' }) !== false)
      meldung('fachbegriffBestellt(): prüft über den Prototyp („toString" gälte als bestellt) — hasOwnProperty fehlt.');
  } catch (e){
    meldung('fachbegriffBestellt() lässt sich nicht ausführen: ' + String(e.message).slice(0, 120));
  }
}

/* ---------- 4. Die Routine ---------- */

const lies = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch (e) { return null; } };
const prompt = lies(path.join(AUTOMATION, 'prompts', 'vokabeltrainer-wartung.md'));
let routinen = null;
{ const t = lies(path.join(AUTOMATION, 'routines.json')); try { routinen = t === null ? null : JSON.parse(t); } catch (e) { routinen = null; } }
freigabeFehler(prompt, routinen).forEach(meldung);

/* ---------- Ausgabe ---------- */

const bestellt = FACHBEGRIFF_VOKABELN.filter(w => FACHBEGRIFF_AUFTRAG && Object.prototype.hasOwnProperty.call(FACHBEGRIFF_AUFTRAG, String(w.id)));
const ruhend   = FACHBEGRIFF_VOKABELN.filter(w => !bestellt.includes(w));
console.log('--- Fachbegriff-Karten nur auf sein Wort ---\n');
console.log('Einträge in data/fachbegriffe.js:  ' + FACHBEGRIFF_VOKABELN.length);
console.log('davon bestellt (eine Karte):       ' + bestellt.length);
console.log('ruhend (in keinem Modus):          ' + ruhend.length + (zeigeAlle ? '' : '   (--liste zeigt sie)'));
if (zeigeAlle) for (const w of ruhend) console.log('  ' + String(w.id).padEnd(24) + String(w.de || '').slice(0, 60));
console.log('davon ausdrücklich abbestellt:     ' + (FACHBEGRIFF_ABBESTELLT ? Object.keys(FACHBEGRIFF_ABBESTELLT).length : 0) + '   (die Warteseite fragt sie nicht mehr)');
console.log('Eichung der Erkennungen:           ' + (eichung.length ? eichung.length + ' Fehler' : '10 von 10 Gegenproben richtig'));

if (befunde.length){
  console.log('\n✖ ' + befunde.length + ' Befund(e):');
  befunde.forEach(z => console.log('  · ' + z));
  process.exit(1);
}
console.log('\n✅ Nur Bestelltes wird eine Karte, die Tür in der App filtert, und die Routine kann nichts mehr eintragen.');
process.exit(0);
