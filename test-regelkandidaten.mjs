#!/usr/bin/env node
/* test-regelkandidaten.mjs — wer bekommt einen Regelkandidaten?
 * ==========================================================================
 *
 * ⛔⛔ DER SATZ, DEN DIESER PRÜFSTAND BEWACHT — VON ELIAS
 *
 * 11.10.2026, auf die Auskunft, dass drei belegte Regeln aus Folge 22 und 24
 * noch als Frage „Aufnehmen?" auf ihn warten: „wieso stehen die noch aus?"
 * Und auf meine Frage „Soll ich den Auftrag der Wartung so ändern, dass sie
 * belegte Regeln künftig selbst einbaut, statt dich zu fragen?": „ja".
 * Davor schon zweimal dasselbe: 18.08.2026 („du sollst sie selber auswerten …
 * allgemein gilt das so") und 05.10.2026 („ist okay").
 *
 * Trotzdem gingen vom 22.09. bis zum 11.10.2026 sieben belegte Regeln als
 * Frage an ihn — weil drei Werkzeuge jedes für sich festlegten, was „für
 * Elias" ist, und eine Lesart von mir (ein Satz vom 29.07. über BUCHregeln)
 * dort als Regel stand. Seit dem 11.10. entscheidet EINE Datei:
 * `werkzeuge/kandidaten-einordnung.mjs`.
 *
 * Geprüft wird:
 *   A  die Regel selbst (`regel` geht nicht an Elias, `abweichung`/`unbelegt` schon)
 *   B  das Einordnen an gebauten Fällen (einzubauen, eingebaut, Fehlerfälle)
 *   C  drei Störtests: der Text der Datei wird verändert, die Prüfung MUSS es merken
 *   D  die vier Werkzeuge lesen aus der einen Datei und führen keine eigene Liste
 *   E  die echten Urteile: nichts Kaputtes, „eingebaut" zeigt auf eine echte Regel
 *   F  der Auftrag der Wartung sagt dasselbe (nur, wenn der Ordner Automation daliegt)
 *
 * Aufruf: node test-regelkandidaten.mjs      Exit 0 = alles in Ordnung
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const lies = p => fs.readFileSync(path.join(HIER, p), 'utf8');

let fehler = 0, geprueft = 0;
function pruefe(ok, was) {
  geprueft++;
  if (!ok) { fehler++; console.log('  ⛔ ' + was); }
}

/* Lädt den TEXT der Einordnung als eigenes Modul — unverändert oder, für die
   Störtests, verändert. Die Datei hat deshalb keine Importe. */
function ladeModul(text) {
  return import('data:text/javascript;base64,' + Buffer.from(text, 'utf8').toString('base64'));
}

const QUELLE = lies('werkzeuge/kandidaten-einordnung.mjs');
const M = await ladeModul(QUELLE);

/* ====================== A  Die Regel selbst ============================== */
console.log('A  Wer bekommt was');
pruefe(M.gehtAnElias('regel') === false,
  'eine BELEGTE Regel geht als Frage an Elias — sein „ja" vom 11.10.2026 sagt: einbauen, nicht fragen');
pruefe(M.gehtAnElias('abweichung') === true, 'eine Abweichung (Schlüssel gegen Lehrer) geht nicht mehr an Elias');
pruefe(M.gehtAnElias('unbelegt') === true, 'ein unbelegter Kandidat geht nicht mehr an Elias');
pruefe(M.gehtAnElias('weg') === false && M.gehtAnElias('schon-regel') === false,
  '„weg" oder „schon-regel" geht an Elias');
pruefe(M.gehtAnElias('gibt-es-nicht') === false, 'ein unbekanntes Urteil geht an Elias');
pruefe(M.BRAUCHT_QUELLE.includes('regel'),
  'eine belegte Regel braucht keine Fundstelle mehr — sie wird aber ohne sein Ja eingebaut');
pruefe(!M.BRAUCHT_FRAGE.includes('regel'), 'eine belegte Regel verlangt noch eine Frage an Elias');
pruefe(M.BRAUCHT_FRAGE.includes('abweichung') && M.BRAUCHT_FRAGE.includes('unbelegt'),
  'was an Elias geht, braucht keine Frage mehr');

/* ====================== B  Einordnen an gebauten Fällen ================== */
console.log('B  Einordnen');
const G = 'ausfuehrliche Begruendung';
const FAELLE = [
  { id: 'a', urteil: 'regel', grund: G, quelle: 'Schluessel 1, Lektion 1' },
  { id: 'b', urteil: 'schon-regel', grund: G, regel: 'x-01', eingebaut: '2026-10-11' },
  { id: 'c', urteil: 'schon-regel', grund: G, regel: 'fehlt-01', eingebaut: '2026-10-11' },
  { id: 'd', urteil: 'unbelegt', grund: G, quelle: 'Unterricht Folge 1', frage: 'Regel daraus machen?' },
  { id: 'e', urteil: 'abweichung', grund: G, quelle: 'Unterricht Folge 1', frage: '' },
  { id: 'f', urteil: null },
  { id: 'g', urteil: 'weg', grund: 'kurz' },
  { id: 'h', urteil: 'regel', grund: G, quelle: '' },
  { id: 'i', urteil: 'weg', grund: G, eingebaut: '2026-10-11' },
  { id: 'j', urteil: 'erfunden', grund: G },
  { id: 'k', urteil: 'schon-regel', grund: G },
];
const IDS = new Set(['x-01']);
const nur = liste => liste.map(k => k.id).join(',');
const E = M.einordnen(FAELLE, IDS);
pruefe(nur(E.anElias) === 'd,e', 'an Elias gehen nicht genau die Abweichung und der unbelegte Fall: ' + nur(E.anElias));
pruefe(nur(E.einzubauen) === 'a,h', 'einzubauen sind nicht genau die zwei belegten Regeln: ' + nur(E.einzubauen));
pruefe(nur(E.eingebaut) === 'b,c', 'als eingebaut zählen nicht genau die zwei mit Datum: ' + nur(E.eingebaut));
pruefe(nur(E.eingebautOhneRegel) === 'c', '„eingebaut" ohne vorhandene Regel wird nicht bemerkt: ' + nur(E.eingebautOhneRegel));
pruefe(nur(E.eingebautFalscheArt) === 'i', '„eingebaut" an einem Urteil „weg" wird nicht bemerkt: ' + nur(E.eingebautFalscheArt));
pruefe(nur(E.ohneUrteil) === 'f', 'der Fall ohne Urteil wird nicht bemerkt: ' + nur(E.ohneUrteil));
pruefe(nur(E.unbekannteArt) === 'j', 'das erfundene Urteil wird nicht bemerkt: ' + nur(E.unbekannteArt));
pruefe(nur(E.ohneGrund) === 'g', 'das Urteil ohne Begründung wird nicht bemerkt: ' + nur(E.ohneGrund));
pruefe(nur(E.ohneFrage) === 'e', 'die Abweichung ohne Frage wird nicht bemerkt: ' + nur(E.ohneFrage));
pruefe(nur(E.ohneQuelle) === 'h', 'die belegte Regel ohne Fundstelle wird nicht bemerkt: ' + nur(E.ohneQuelle));
pruefe(nur(E.vonMir) === 'a,b,c,g,h,i,k', 'von mir entschieden ist nicht alles außer den Fragen an Elias: ' + nur(E.vonMir));
pruefe(E.anElias.every(k => k.urteil !== 'regel'), 'unter den Fragen an Elias steht eine belegte Regel');

/* ====================== C  Störtests ==================================== */
console.log('C  Störtests (der Text der Einordnung wird verändert)');
async function stoere(was, alt, neu, bemerkt) {
  const text = QUELLE.split(alt).join(neu);
  pruefe(text !== QUELLE, 'Störtest „' + was + '": die Stelle im Quelltext wurde nicht gefunden — der Störtest prüft nichts');
  if (text === QUELLE) return;
  const S = await ladeModul(text);
  pruefe(bemerkt(S), 'Störtest „' + was + '" wird NICHT bemerkt');
}
await stoere('belegte Regel wieder an Elias',
  "'regel':       { an: 'claude'", "'regel':       { an: 'elias'",
  S => S.gehtAnElias('regel') === true && S.einordnen(FAELLE, IDS).anElias.some(k => k.urteil === 'regel'));
await stoere('belegte Regel ohne Fundstelle erlaubt',
  "BRAUCHT_QUELLE = ['regel', 'abweichung', 'unbelegt']", "BRAUCHT_QUELLE = ['abweichung', 'unbelegt']",
  S => nur(S.einordnen(FAELLE, IDS).ohneQuelle) !== 'h');
await stoere('„eingebaut" ohne Regel durchgelassen',
  '&& !(k.regel && ids.has(k.regel))', '&& false',
  S => nur(S.einordnen(FAELLE, IDS).eingebautOhneRegel) !== 'c');

/* ====================== D  Die Werkzeuge lesen aus der einen Datei ======= */
console.log('D  Eine Stelle entscheidet');
const BEW = lies('werkzeuge/kandidaten-bewerten.mjs');
const FRE = lies('werkzeuge/freigabe-artefakt.mjs');
const WAR = lies('werkzeuge/wartet-auf-elias.mjs');
const RUE = lies('werkzeuge/rueckstand.mjs');
const ALL = lies('werkzeuge/alle-pruefer.mjs');
const VON = "from './kandidaten-einordnung.mjs'";
pruefe(BEW.includes(VON) && !BEW.includes('const URTEILSARTEN ='),
  'kandidaten-bewerten.mjs führt wieder eine eigene Liste der Urteilsarten');
pruefe(BEW.includes('einzubauen.length ? 2 : 0'),
  'kandidaten-bewerten.mjs meldet eine belegte, nicht eingebaute Regel nicht mehr mit Exit 2');
pruefe(FRE.includes(VON) && FRE.includes('gehtAnElias(k.urteil)'),
  'freigabe-artefakt.mjs fragt nicht mehr die Einordnung, wer an Elias geht');
const sorten = FRE.slice(FRE.indexOf('const SORTEN = {'), FRE.indexOf('const fuerElias'));
pruefe(sorten.length > 50 && !sorten.includes('regel:') && !FRE.includes('Ja, aufnehmen'),
  'freigabe-artefakt.mjs legt Elias wieder eine belegte Regel mit dem Knopf „Ja, aufnehmen" vor');
pruefe(FRE.includes("for (const sorte of ['abweichung', 'unbelegt'])"),
  'freigabe-artefakt.mjs baut nicht mehr genau die zwei Sorten für Elias');
pruefe(WAR.includes(VON) && WAR.includes('filter(k => gehtAnElias(k.urteil))')
  && !WAR.includes("k.urteil === 'regel' ||"),
  'wartet-auf-elias.mjs zählt belegte Regeln wieder als Entscheidung für Elias');
pruefe(RUE.includes(VON) && RUE.includes('wartetAufEinbau(u)'),
  'rueckstand.mjs misst nicht mehr, ob eine belegte Regel noch einzubauen ist');
const luecke = ALL.slice(ALL.indexOf('const LUECKE_FUER_WARTUNG ='), ALL.indexOf('const gelaufenRot'));
pruefe(luecke.includes("'werkzeuge/kandidaten-bewerten.mjs'"),
  'alle-pruefer.mjs: kandidaten-bewerten.mjs steht nicht mehr unter LUECKE_FUER_WARTUNG — sein Exit 2 sperrte jede Auslieferung');
pruefe(ALL.includes("['test-regelkandidaten.mjs', []]"), 'dieser Prüfstand steht nicht im Sammellauf');

/* ====================== E  Die echten Urteile ============================ */
console.log('E  Die echten Urteile');
const urteile = JSON.parse(lies('werkzeuge/kandidaten-urteile.json')).urteile || {};
const regelIds = new Set((new Function(lies('grammar-data.js') + ';return GRAMMAR_RULES;'))().map(r => r.id));
const echte = Object.entries(urteile).map(([id, u]) => ({ id, ...u }));
pruefe(echte.length >= 150, 'es wurden nur ' + echte.length + ' Urteile gelesen (erwartet: über 150)');
pruefe(regelIds.size >= 100, 'es wurden nur ' + regelIds.size + ' Regeln gelesen (erwartet: über 100)');
const R = M.einordnen(echte, regelIds);
pruefe(R.unbekannteArt.length === 0, 'unbekannte Urteilsart: ' + nur(R.unbekannteArt));
pruefe(R.ohneGrund.length === 0, 'Urteil ohne Begründung: ' + nur(R.ohneGrund));
pruefe(R.ohneFrage.length === 0, 'Frage an Elias fehlt: ' + nur(R.ohneFrage));
pruefe(R.ohneQuelle.length === 0, 'Fundstelle fehlt: ' + nur(R.ohneQuelle));
pruefe(R.eingebautOhneRegel.length === 0,
  '„eingebaut" zeigt auf eine Regel, die es in grammar-data.js nicht gibt: ' + nur(R.eingebautOhneRegel));
pruefe(R.eingebautFalscheArt.length === 0, '„eingebaut" an einem falschen Urteil: ' + nur(R.eingebautFalscheArt));
pruefe(R.eingebaut.every(k => /^\d{4}-\d{2}-\d{2}$/.test(String(k.eingebaut))),
  '„eingebaut" ist kein Datum der Form JJJJ-MM-TT: ' + nur(R.eingebaut.filter(k => !/^\d{4}-\d{2}-\d{2}$/.test(String(k.eingebaut)))));
pruefe(R.anElias.every(k => k.urteil === 'abweichung' || k.urteil === 'unbelegt'),
  'an Elias geht etwas anderes als Abweichung oder unbelegt');

/* ====================== F  Der Auftrag der Wartung ======================= */
console.log('F  Der Auftrag der Wartung');
const AUFTRAG = path.join(HIER, '..', 'Automation', 'prompts', 'vokabeltrainer-wartung.md');
if (!fs.existsSync(AUFTRAG)) {
  console.log('  (übersprungen: ' + AUFTRAG + ' liegt hier nicht)');
} else {
  const A = fs.readFileSync(AUFTRAG, 'utf8');
  pruefe(A.includes('kandidaten-einordnung.mjs'),
    'der Auftrag der Wartung nennt die Einordnung nicht — er weiß nicht, wer einen Kandidaten bekommt');
  pruefe(A.includes('BELEGTE Regel wird EINGEBAUT'),
    'der Auftrag der Wartung sagt nicht mehr, dass eine belegte Regel eingebaut wird');
  pruefe(!A.includes('**ich bewerte, er gibt frei.**') && !A.includes('er gibt jede Regel selbst\nfrei'),
    'im Auftrag der Wartung steht wieder „ich bewerte, er gibt frei" als geltende Regel');
  pruefe(!A.includes('X Stellen warten auf Freigabe'),
    'die Statuszeile der Wartung meldet noch „Stellen warten auf Freigabe"');
}

console.log('\ntest-regelkandidaten: ' + geprueft + ' Prüfungen, ' + fehler + ' Fehler'
  + ' · echte Urteile: ' + echte.length + ' (an Elias ' + R.anElias.length
  + ', eingebaut ' + R.eingebaut.length + ', noch einzubauen ' + R.einzubauen.length + ')');
process.exit(fehler ? 1 : 0);
