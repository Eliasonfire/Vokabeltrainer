/* antworten-uebernehmen.mjs — Elias' Antworten aus dem Wartungsfragen-Artefakt
 * in data/feld-ausnahmen.js eintragen.
 *
 *   node werkzeuge/antworten-uebernehmen.mjs <datei-mit-seinem-text>
 *   node werkzeuge/antworten-uebernehmen.mjs <datei> --pruefen    nur zeigen
 *
 * ================== WOZU ===================================================
 *
 * Ohne dieses Werkzeug ist das Artefakt eine Einbahnstraße: er beantwortet 48
 * Fragen, kopiert den Text, und dann muss ihn jemand von Hand einpflegen — mit
 * jedem Tippfehler, den das mit sich bringt. [[werkzeug_ohne_aufrufer]]
 *
 * ⛔ ZWEI ZIELE, und sie sind NICHT dasselbe:
 *
 *   „GIBT ES NICHT"  ->  FELD_AUSNAHMEN    (die Frage wird nie wieder gestellt)
 *   ein echter Wert  ->  FELD_ERGAENZUNGEN (der Wert steht künftig in der App)
 *
 * ⛔ WARUM NICHT IN DIE BUCHDATEI: `data/vokabeln-<buch>.js` wird von
 * hole-vokabeln.mjs bei jedem Abzug neu geschrieben. Ein dort eingetragener
 * Plural wäre beim nächsten Lauf weg, und niemand würde es merken — das Wort
 * käme einfach wieder auf die Frageliste.
 */
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ersetzeDatei } from './schreibe-ersetzend.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ZIEL = path.join(REPO, 'data', 'feld-ausnahmen.js');

const ARG = process.argv.slice(2);
const QUELLE = ARG.find(a => !a.startsWith('--'));
const NUR_ZEIGEN = ARG.includes('--pruefen');

if (!QUELLE){
  console.error('Aufruf: node werkzeuge/antworten-uebernehmen.mjs <datei> [--pruefen]');
  console.error('Die Datei enthält den Text, den Elias aus dem Artefakt kopiert hat.');
  process.exit(1);
}
if (!fs.existsSync(QUELLE)){ console.error('Datei nicht gefunden: ' + QUELLE); process.exit(1); }

/* ⛔ split(/\r?\n/): eine aus Windows kopierte Datei trägt \r, und jedes Muster
   mit $ läuft dann ins Leere. [[zeilenende_r_bricht_muster]] */
const zeilen = fs.readFileSync(QUELLE, 'utf8').split(/\r?\n/);

/* ---------- Lesen ---------- */
const FELDER_ERLAUBT = ['pl','sg','gender','femSg','femPl','root','type','past','present','imperative','masdar'];
const WORTARTEN = ['noun','verb','adjective','particle','adverb','expression','vocab'];
/* ⛔⛔ JEDES Feld braucht seine Wertpruefung, nicht nur `type`.
 *
 * Am 20.08.2026 gemessen: die Zeile
 *     48402  الْيَوْمُ  (heute)  -> WORTART FALSH
 * (ein Buchstabendreher in „FALSCH") ging still als femSg-WERT durch. Das Wort
 * haette danach „WORTART FALSH" als weibliche Form getragen — sichtbar auf der
 * Karte, im Iʿrāb-Lexikon und in Uebung 13.
 *
 * ⭐ Eine arabische Angabe muss arabisch sein. Das ist keine Feinheit: es ist
 * die einzige Pruefung, die einen Tippfehler von einer Antwort unterscheidet.
 * [[kennzeichen_mit_zwei_ursachen]]
 *
 * \u0600-\u06FF ist der arabische Block, \u0750-\u077F die Ergaenzung.
 * ⚠️ Als \u-Folge geschrieben, damit ein Editor sie nicht unsichtbar
 * normalisiert. [[zeichenklasse_nie_sichtbar_kopieren]] */
const ARABISCH = /[\u0600-\u06FF\u0750-\u077F]/;
const NUR_ARABISCH = ['pl','sg','femSg','femPl','past','present','imperative','masdar','root'];
const GESCHLECHTER = ['masculine','feminine'];

let feld = null;
const ausnahmen = [];    /* { id, feld, wort } */
const zweifel = [];      /* { id, feld, wort } — Wortart bestritten */

/* ⛔⛔ DER VORHANDENE `type` — ohne ihn kommt seine Antwort nicht in der App an.

   Gemessen am 20.08.2026 an der echten Kette: Elias beantwortet „خَرَجَ →
   verb", der Wert landet sauber in FELD_ERGAENZUNGEN — und
   wendeFeldErgaenzungenAn() laesst ihn liegen, weil das Feld GEFUELLT ist
   (`noun` aus addPersonalVocab). Nur leer, `null`, `other` und `vocab`
   gelten als leer.

   ⭐ Ebene 4 loest das: ein BESTRITTENER Wert zaehlt seit dem 20.08. wie ein
   leerer (data/feld-ausnahmen.js). Aber der Zweifel wurde bisher nur gesetzt,
   wenn Elias ausdruecklich „ist kein Nomen" angetippt hat — nicht, wenn er
   einfach die richtige Wortart waehlt.

   Also: weicht die Antwort vom vorhandenen Wert ab und ist dieser nicht leer,
   setzen wir den Zweifel SELBST. [[erfolgsmeldung_ohne_wirkung]] */
const BESTAND_TYPE = new Map();
{
  const laden = (rel, name) => {
    try {
      const ctx = { window: {} };
      vm.createContext(ctx);
      vm.runInContext(fs.readFileSync(path.join(REPO, rel), 'utf8'), ctx, { filename: rel });
      const v = vm.runInContext('typeof ' + name + ' !== "undefined" ? ' + name + ' : (window.' + name + ' || null)', ctx);
      return Array.isArray(v) ? v : (v ? Object.values(v).flat() : []);
    } catch (e) { return []; }
  };
  const alle = [
    ...laden('vocab-data.js', 'VOCAB_DATA'),
    ...laden('data/fachbegriffe.js', 'FACHBEGRIFF_VOKABELN'),
    ...laden('data/vokabeln-eigene.js', 'EIGENE_VOKABELN'),
  ];
  try {
    const d = JSON.parse(fs.readFileSync(path.join(REPO, 'data', 'eigene-woerter.json'), 'utf8'));
    if (Array.isArray(d.woerter)) alle.push(...d.woerter);
  } catch (e) { /* nicht da — dann eben ohne */ }
  /* ⚠️ Die gepflegte Fassung gewinnt: vocab-data.js steht zuerst in der Liste,
     also NICHT ueberschreiben. [[pruefwerkzeug_laedt_mehr_als_die_app]] */
  for (const w of alle) if (w && w.id && !BESTAND_TYPE.has(String(w.id)))
    BESTAND_TYPE.set(String(w.id), String(w.type || ''));
}
const giltAlsLeer = (v) => !v || !String(v).trim() || v === 'other' || v === 'vocab';
const werte = [];        /* { id, feld, wert, wort } */
const unklar = [];

for (const roh of zeilen){
  const z = roh.replace(/\s+$/, '');
  if (!z.trim()) continue;

  const kopf = /^([A-Za-z]+):\s*$/.exec(z.trim());
  if (kopf){
    feld = kopf[1];
    if (!FELDER_ERLAUBT.includes(feld)){ unklar.push('Unbekanntes Feld: ' + feld); feld = null; }
    continue;
  }
  /* Zeilenform aus dem Artefakt:  "  <id>  <arabisch>  (<deutsch>)  -> <antwort>" */
  const m = /^\s+(\S+)\s+(.+?)\s+\((.*?)\)\s+->\s+(.+)$/.exec(z);
  if (!m) continue;
  if (!feld){ unklar.push('Zeile ohne Feldüberschrift: ' + z.trim().slice(0, 60)); continue; }

  const [, id, ar, de, antwortRoh] = m;
  const antwort = antwortRoh.trim();
  if (/^GIBT ES NICHT$/i.test(antwort)){
    ausnahmen.push({ id, feld, wort: ar + ' (' + de + ')' });
  } else if (/^WORTART FALSCH$/i.test(antwort)){
    /* ⭐ Kein Eintrag für DIESES Feld — die Frage verschwindet von selbst,
       sobald `type` als kaputt gilt: felderPruefen() in vorrat.mjs meldet dann
       nur noch `type` und bricht ab. Ein zusätzlicher Ausnahme-Eintrag würde
       die Frage dauerhaft stilllegen, auch NACHDEM die Wortart korrigiert ist —
       und dann fehlte der Plural für immer. [[kennzeichen_mit_zwei_ursachen]] */
    zweifel.push({ id, feld: 'type', wort: ar + ' (' + de + ')' });
  } else if (feld === 'type' && !WORTARTEN.includes(antwort)){
    /* ⛔ Eine erfundene Wortart ließe das Wort aus jeder Kategorie fallen.
       Lieber melden als eintragen. */
    unklar.push('Unbekannte Wortart „' + antwort + '" bei ' + ar + ' (' + id + ')');
  } else if (feld === 'gender' && !GESCHLECHTER.includes(antwort)){
    /* ⚠️ js/uebung.js erkennt nur diese zwei; jeder andere Wert gilt in
       Übung 11 stillschweigend als männlich. Befund A-13 des Skill-Prüfers. */
    unklar.push('Geschlecht muss masculine oder feminine sein, nicht „' + antwort + '" bei ' + ar + ' (' + id + ')');
  } else if (NUR_ARABISCH.includes(feld) && !ARABISCH.test(antwort)){
    unklar.push('„' + antwort + '" enthält kein arabisches Zeichen — als ' + feld
      + ' bei ' + ar + ' (' + id + ') nicht eingetragen. Tippfehler?');
  } else {
    werte.push({ id, feld, wert: antwort, wort: ar + ' (' + de + ')' });
    /* ⭐ Siehe BESTAND_TYPE oben: steht dort schon ein anderer, nicht-leerer
       Wert, braucht die Ergaenzung den Zweifel daneben — sonst wirkt sie nicht. */
    if (feld === 'type'){
      const da = BESTAND_TYPE.get(String(id));
      if (da && !giltAlsLeer(da) && da !== antwort)
        zweifel.push({ id, feld: 'type', wort: ar + ' (' + de + ')',
                       grund: 'Antwort „' + antwort + '" weicht von „' + da + '" ab' });
    }
  }
}

console.log('Gelesen aus ' + path.basename(QUELLE) + ':');
console.log('  ' + String(ausnahmen.length).padStart(4) + ' × „gibt es nicht"  → FELD_AUSNAHMEN');
console.log('  ' + String(werte.length).padStart(4) + ' × ein Wert         → FELD_ERGAENZUNGEN');
console.log('  ' + String(zweifel.length).padStart(4) + ' × „Wortart falsch" → FELD_ZWEIFEL (kommt wieder als type-Frage)');
if (unklar.length){
  console.log('');
  console.log('  ⚠️ ' + unklar.length + ' Zeile(n) nicht übernommen:');
  unklar.forEach(u => console.log('      ' + u));
}
if (!ausnahmen.length && !werte.length){
  console.log('');
  console.log('Nichts zu übernehmen.');
  process.exit(unklar.length ? 2 : 0);
}

/* ---------- Schreiben ---------- */
const alt = fs.readFileSync(ZIEL, 'utf8');

/* Bestehende Einträge lesen, damit nichts verlorengeht. Bewusst mit einer
   engen Regex statt eval: die Datei enthält Kommentare und Funktionen, und
   ein Auswerten würde bei einem Tippfehler die ganze Datei mitreißen. */
function blockLesen(text, name){
  const auf = text.indexOf('const ' + name + ' = {');
  if (auf < 0) return { auf: -1, zu: -1, eintraege: {} };
  const start = text.indexOf('{', auf);
  let tiefe = 0, i = start;
  for (; i < text.length; i++){
    if (text[i] === '{') tiefe++;
    else if (text[i] === '}'){ tiefe--; if (!tiefe) break; }
  }
  const inhalt = text.slice(start + 1, i);
  const eintraege = {};
  for (const m of inhalt.matchAll(/'([^']+)':\s*\{([^}]*)\}/g)){
    const felder = {};
    for (const f of m[2].matchAll(/(\w+):\s*'((?:[^'\\]|\\.)*)'/g)) felder[f[1]] = f[2];
    eintraege[m[1]] = felder;
  }
  return { auf: start, zu: i, eintraege };
}

const A = blockLesen(alt, 'FELD_AUSNAHMEN');
const E = blockLesen(alt, 'FELD_ERGAENZUNGEN');
const Z = blockLesen(alt, 'FELD_ZWEIFEL');
if (A.auf < 0 || E.auf < 0 || Z.auf < 0){ console.error('⛔ Blöcke in ' + ZIEL + ' nicht gefunden.'); process.exit(1); }

const heute = new Date().toLocaleDateString('de-DE');
let neuA = 0, neuE = 0, ersetztE = 0, neuZ = 0;
for (const a of ausnahmen){
  A.eintraege[a.id] = A.eintraege[a.id] || {};
  if (!(a.feld in A.eintraege[a.id])) neuA++;
  A.eintraege[a.id][a.feld] = 'von Elias bestätigt am ' + heute + ' — ' + a.wort;
}
for (const w of werte){
  E.eintraege[w.id] = E.eintraege[w.id] || {};
  if (!(w.feld in E.eintraege[w.id])) neuE++; else ersetztE++;
  E.eintraege[w.id][w.feld] = w.wert;
}
for (const z of zweifel){
  Z.eintraege[z.id] = Z.eintraege[z.id] || {};
  if (!(z.feld in Z.eintraege[z.id])) neuZ++;
  Z.eintraege[z.id][z.feld] = 'von Elias bestritten am ' + heute + ' — ' + z.wort;
}
/* ⛔⛔ HIER STAND EINE LÖSCHUNG, UND SIE HAT DIE ANTWORT UNWIRKSAM GEMACHT.

   Der alte Code war:

     for (const w of werte)
       if (w.feld === 'type' && Z.eintraege[w.id]) delete Z.eintraege[w.id].type;

   mit der Begründung: „Beantwortet er die Wortart, ist der Zweifel erledigt —
   sonst stünde das Wort für immer in der type-Frage." ⭐ Das war richtig,
   solange FELD_ZWEIFEL nur eines tat: die Frage erneut stellen.

   Seit dem 20.08.2026 tut es ein Zweites, und das ist wichtiger: ein
   BESTRITTENER Wert zählt in wendeFeldErgaenzungenAn() wie ein LEERER. Nur
   dadurch darf die Ergänzung ein gefülltes Feld überhaupt ersetzen — und die
   14 selbst angelegten Wörter tragen alle ein gefülltes `noun`.

   ⛔ Gemessen: die Löschung entfernte genau den Zweifel, den diese Datei ein
   paar Zeilen darüber selbst eingetragen hatte. `FELD_ZWEIFEL[id]` blieb als
   leeres `{}` stehen, `feldBestritten()` lieferte false, und Elias' Antwort
   „خَرَجَ → verb" kam in der App nicht an.

   ⭐ Gegen die alte Sorge sind jetzt ZWEI andere Sperren gebaut, beide in
   werkzeuge/vorrat.mjs und beide gemessen:
     · `kaputterTyp` zählt einen Zweifel nur, solange KEINE Ergänzung vorliegt
     · `typFestwert()` kennt beide Wege, den Festwert aufzulösen
   Die Frage kommt also nicht wieder — der Zweifel darf und muss bleiben.
   [[erst_ursache_dann_zweite_massnahme]] [[erfolgsmeldung_ohne_wirkung]] */

/* ⛔ Nur Hochkomma und Backslash schützen — arabische Zeichen bleiben als
   ECHTE Zeichen stehen. Eine \u-Folge wäre für normalize() unsichtbar, und
   die Taschkil-Prüfung würde sie nie sehen. [[escapes_sind_fuer_normalize_unsichtbar]] */
const q = (s) => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
function blockBauen(eintraege, einrueckung = '  '){
  const ids = Object.keys(eintraege).sort();
  if (!ids.length) return '\n  /* (noch leer) */\n';
  return '\n' + ids.map(id =>
    einrueckung + q(id) + ': { ' +
    Object.keys(eintraege[id]).sort().map(f => f + ': ' + q(eintraege[id][f])).join(', ') +
    ' }').join(',\n') + '\n';
}

/* ⭐ Je Block FRISCH suchen statt Positionen fortzuschreiben: nach dem ersten
   Ersetzen stimmen alle Offsets dahinter nicht mehr, und ein vergessener
   Neu-Aufruf schriebe mitten in den Quelltext. So ist die Reihenfolge egal. */
function blockSchreiben(text, name, eintraege){
  const b = blockLesen(text, name);
  if (b.auf < 0) return text;
  return text.slice(0, b.auf + 1) + blockBauen(Object.assign({}, b.eintraege, eintraege)) + text.slice(b.zu);
}
let neu = alt;
neu = blockSchreiben(neu, 'FELD_ZWEIFEL', Z.eintraege);
neu = blockSchreiben(neu, 'FELD_ERGAENZUNGEN', E.eintraege);
neu = blockSchreiben(neu, 'FELD_AUSNAHMEN', A.eintraege);

if (NUR_ZEIGEN){
  console.log('');
  console.log('--pruefen: nichts geschrieben. Es kämen dazu:');
  ausnahmen.forEach(a => console.log('  AUSNAHME   ' + a.feld.padEnd(8) + a.wort));
  werte.forEach(w => console.log('  WERT       ' + w.feld.padEnd(8) + w.wort + '  = ' + w.wert));
  zweifel.forEach(z => console.log('  ZWEIFEL    ' + 'type'.padEnd(8) + z.wort + '  → kommt wieder als type-Frage'));
  process.exit(0);
}

/* ⛔ Erst daneben schreiben, dann umbenennen — UND die Groesse pruefen. Der
   erste Teil faengt den Abbruch mitten im Schreiben, der zweite den
   vollstaendigen Lauf mit falschem Ergebnis: hier werden DREI Bloecke per
   Textersetzung neu gesetzt, und trifft eine davon zu viel, ist die Datei
   formal in Ordnung und der Inhalt halb weg.
   [[leere_datei_besteht_jeden_test]] [[schreibe_ersetzend]] */
ersetzeDatei(ZIEL, neu, {
  grund: 'data/feld-ausnahmen.js traegt FELD_ZWEIFEL, FELD_ERGAENZUNGEN und FELD_AUSNAHMEN '
       + '— die Antworten, die Elias selbst gegeben hat.'
});

console.log('');
console.log('Eingetragen in data/feld-ausnahmen.js:');
console.log('  ' + neuA + ' neue Ausnahme(n), ' + neuE + ' neue Wert(e)'
  + (ersetztE ? ', ' + ersetztE + ' ersetzt' : '')
  + (neuZ ? ', ' + neuZ + ' bestrittene Wortart(en)' : ''));
console.log('');
console.log('Jetzt prüfen:  node validate.js  und  node werkzeuge/vorrat.mjs');
