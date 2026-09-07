/* test-auswahl-einzelnfrei.mjs — zwei Befunde vom 07.09.2026
 *
 * ⛔ WARUM ES DIESE DATEI GIBT
 *
 * 1. Elias: „ich habe eben nur kapitel 1 ausgewählt … und trotzdem kommt eine
 *    kartei aus kapitel 24. ja ich habe kapitel 24 nicht aktiv angehabt, es ist
 *    eine ausnahme freigeschaltete vokabel aber sie sollte so wie meine eigenen
 *    hinzugefügten vokabeln behandelt werden solange ich nicht wirklich bis an
 *    das kapitel angekommen bin beziehungsweise es freigeschalten habe“
 *
 * 2. Elias, zu einer Meldung, die bei jedem Start kam: „ich möchte einfach beim
 *    starten der app nicht irgeneine benachrichtigung bekommen oder eine
 *    checkliste was gemacht wurde. ich habe nichts gedrückt oder gemacht und
 *    trotzdem wird mir was angezeigt … wenn ich ein wort verändere und dann
 *    dort steht ,,gespeichert“ oder so dann ist das gut zu wissen“
 *
 * ⭐ Beide Aenderungen sind WEGNAHMEN, und eine Wegnahme kann zu weit gehen.
 * Deshalb steht neben jedem „ist jetzt weg“ eine Gegenprobe „ist noch da“ —
 * ohne sie beweist ein gruener Lauf nur, dass etwas verschwunden ist, nicht
 * dass das Richtige verschwunden ist. [[gruener_pruefer_beweist_nur_geprueftes]]
 *
 * ⛔ Die geprueften Funktionen werden aus js/kern.js GESCHNITTEN, nicht
 * abgetippt. [[pruefwerkzeug_mit_eingebauter_antwort]] [[testvorlage_selbst_nachgebaut]]
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const KERN = fs.readFileSync(path.join(HIER, 'js', 'kern.js'), 'utf8');

let fehler = 0;
const sag = (ok, t) => { if (!ok) fehler++; console.log('  ' + (ok ? '✔' : '✘') + ' ' + t); };

/* ⛔ Ohne Regex geschnitten: ein Muster mit Escapes hat in test-dublette.mjs
   zwei Anlaeufe gekostet, weil jeder Weg ueber die Shell die Backslashes
   zerlegte. [[python_backslash_b_wird_backspace]] */
const schneide = (name) => {
  const auf = KERN.indexOf('function ' + name + '(');
  if (auf < 0) { console.error('⛔ ' + name + '() nicht in js/kern.js gefunden.'); process.exit(1); }
  const zu = KERN.indexOf(String.fromCharCode(10) + '}', auf);
  if (zu < 0) { console.error('⛔ ' + name + '(): kein Ende gefunden.'); process.exit(1); }
  return KERN.slice(auf, zu + 2);
};

/* ============================================================ 1. Die Auswahl */
console.log('\nEinzeln freigeschaltet: gilt die Kapitelauswahl?');

/* ⚠️ `var` und nicht `const` fuer alles, was der geschnittene Code sieht:
   ein `const` im vm-Kontext ist fuer spaeter ausgewerteten Code unsichtbar,
   und die Pruefung liefe gegen undefined statt gegen den Wert.
   [[const_ist_im_vm_kontext_unsichtbar]] */
function auswahlWelt({ kapitelWahl, einzeln, eigeneGewaehlt = false, buecher }){
  const welt = {
    SETTINGS: { buecher: buecher || { 'madina-1': kapitelWahl }, eigeneGewaehlt },
    EINZELN: einzeln || {},
    console,
  };
  welt.istBekannt   = () => true;      /* Wissensgrenze: hier nicht die Frage */
  welt.kennErSchon  = () => false;
  welt.istEinzelnFrei = (w) => !!(welt.EINZELN[w.id] && welt.EINZELN[w.id].an);
  /* ⛔ Wortgleich aus js/buecher.js:62 — nicht sinngemaess nachgebaut. Eine
     Attrappe, die anders rechnet als das Original, prueft die eigene Erfindung.
     [[testvorlage_selbst_nachgebaut]] */
  welt.irgendwoEingeengt = () => {
    const karte = welt.SETTINGS.buecher || {};
    return Object.keys(karte).some(s => (karte[s] || []).length > 0);
  };
  vm.createContext(welt);
  vm.runInContext('var passtZurAuswahl = ' + schneide('passtZurAuswahl').replace(/^function /, 'function '), welt);
  vm.runInContext(schneide('passtZurAuswahl'), welt);
  return welt;
}

const wort24  = { id: '99001', ar: 'تِسْعَةٌ', de: 'neun',  book: 'madina-1', chapter: 24 };
const wort1   = { id: '99002', ar: 'بَيْتٌ',   de: 'Haus',  book: 'madina-1', chapter: 1 };
const fremd24 = { id: '99003', ar: 'شَيْءٌ',   de: 'Sache', book: 'madina-1', chapter: 24 };

{
  /* Der gemeldete Fall: nur Kapitel 1 angehakt. */
  const w = auswahlWelt({ kapitelWahl: [1], einzeln: { '99001': { an: true } } });
  sag(w.passtZurAuswahl(wort24) === false,
    'Kapitel 1 gewaehlt → das einzeln freigeschaltete Wort aus Kapitel 24 faellt heraus');
  sag(w.passtZurAuswahl(wort1) === true,
    'Kapitel 1 gewaehlt → ein Wort AUS Kapitel 1 bleibt drin');
}
{
  /* ⭐ Gegenprobe: ein einzeln freigeschaltetes Wort aus einem GEWAEHLTEN
     Kapitel darf nicht mit verschwinden. Genau hier waere ein zu grober
     Schnitt unsichtbar geblieben. */
  const w = auswahlWelt({ kapitelWahl: [1], einzeln: { '99002': { an: true } } });
  sag(w.passtZurAuswahl(wort1) === true,
    'einzeln frei UND im gewaehlten Kapitel → bleibt drin');
}
{
  /* Nichts eingeengt: laeuft mit, wie die eigenen Vokabeln. */
  const w = auswahlWelt({ kapitelWahl: [], einzeln: { '99001': { an: true } } });
  sag(w.passtZurAuswahl(wort24) === true,
    'kein Kapitel eingeengt → das freigeschaltete Wort laeuft mit');
}
{
  /* „Eigene“ angehakt: dann will er sie sehen. */
  const w = auswahlWelt({ kapitelWahl: [1], einzeln: { '99001': { an: true } }, eigeneGewaehlt: true });
  sag(w.passtZurAuswahl(wort24) === true,
    'Kapitel 1 + „Eigene“ angehakt → das freigeschaltete Wort ist wieder da');
}
{
  /* Ist er wirklich bis Kapitel 24 gekommen, gilt die normale Regel. */
  const w = auswahlWelt({ kapitelWahl: [1, 24], einzeln: { '99001': { an: true } } });
  sag(w.passtZurAuswahl(wort24) === true,
    'Kapitel 24 selbst angehakt → normal dabei');
}
{
  /* ⛔ Der Fall „Buch gar nicht gewaehlt“ — vom Stoertest am 07.09.2026
     nachgetragen. Er fehlte, und damit war der eine der beiden Rueckgabewege
     UNBEWACHT: die alte Fassung liess das Wort dort weiter durch, und der
     Test blieb gruen. [[gruener_pruefer_beweist_nur_geprueftes]] */
  const w = auswahlWelt({ buecher: { 'madina-2': [3] }, einzeln: { '99001': { an: true } } });
  sag(w.passtZurAuswahl(wort24) === false,
    'Madina 2 Kap. 3 gewaehlt → das freigeschaltete Madina-1-Wort faellt heraus');

  const offen = auswahlWelt({ buecher: { 'madina-2': [3] }, einzeln: { '99001': { an: true } }, eigeneGewaehlt: true });
  sag(offen.passtZurAuswahl(wort24) === true,
    'dasselbe mit „Eigene“ angehakt → es ist da');

  /* ⚠️ Und der Fall dazwischen, den mein erster Entwurf falsch erwartet hatte:
     Buch abgewaehlt, aber NIRGENDS ein Kapitel gesetzt. Dann laeuft es mit —
     genau wie eine eigene Vokabel, und genau das hat Elias verlangt. */
  const frei = auswahlWelt({ buecher: { 'madina-2': [] }, einzeln: { '99001': { an: true } } });
  sag(frei.passtZurAuswahl(wort24) === true,
    'anderes Buch, aber kein Kapitel eingeengt → laeuft mit wie eine eigene Vokabel');
}
{
  /* Und ein Wort, das NICHT freigeschaltet ist, kommt so oder so nicht. */
  const w = auswahlWelt({ kapitelWahl: [1], einzeln: {} });
  sag(w.passtZurAuswahl(fremd24) === false,
    'nicht freigeschaltetes Wort aus Kapitel 24 → bleibt draussen');
  const alles = auswahlWelt({ kapitelWahl: [], einzeln: {} });
  sag(alles.passtZurAuswahl(fremd24) === true,
    'ohne Einengung → auch das nicht freigeschaltete Wort ist dabei (Wissensgrenze zaehlt, nicht die Chips)');
}

/* ====================================================== 2. Der Toast-Riegel */
console.log('\nKein Briefing beim Start:');

function toastWelt(){
  const gezeigt = [];
  const el = { textContent: '', classList: { add: (c) => gezeigt.push(c), remove: () => {} } };
  const hoerer = [];
  const welt = {
    document: {
      getElementById: () => el,
      addEventListener: (art, fn) => hoerer.push({ art, fn }),
    },
    setTimeout: () => 0, clearTimeout: () => {}, console,
    gezeigt, hoerer,
  };
  vm.createContext(welt);
  /* Der Riegel und die Funktion kommen beide aus der Quelle: die Schleife, die
     die drei Hoerer anmeldet, steht direkt ueber toast(). */
  const auf = KERN.indexOf('let TOAST_FREI = false;');
  if (auf < 0) { console.error('⛔ Der Riegel steht nicht mehr in js/kern.js.'); process.exit(1); }
  vm.runInContext(KERN.slice(auf, KERN.indexOf('function toast(', auf)) + schneide('toast'), welt);
  return welt;
}

{
  const w = toastWelt();
  w.toast('11 Woerter standen doppelt …');
  sag(w.gezeigt.length === 0, 'vor dem ersten Eingriff → nichts wird angezeigt');

  /* ⭐ Der Stoertest muss seine Wirkung nachweisen: erst wenn der Hoerer
     feuert, darf der Hinweis durchkommen. Kaeme er auch OHNE, pruefte der
     Test oben nur, dass die Attrappe leer ist. [[stoertest_muss_wirkung_nachweisen]] */
  sag(w.hoerer.length === 3, 'drei Hoerer angemeldet (pointerdown, keydown, touchstart)');
  sag(w.hoerer.some(h => h.art === 'pointerdown'),
    'pointerdown ist dabei — es feuert VOR click, sonst kaeme sein eigener Tipp zu frueh');

  w.hoerer[0].fn();                      /* Elias tippt zum ersten Mal */
  w.toast('Gespeichert');
  sag(w.gezeigt.length === 1, 'nach dem ersten Tipp → die Rueckmeldung kommt an');
}

/* ========================================== 3. Loeschen, das auch haelt */
console.log('\nAusgeblendet bleibt ausgeblendet:');

{
  /* ⛔ Der Fachbegriff traegt chapter:'personal', aber KEIN source-Feld. Vor
     dem 07.09.2026 lief er in den PERSONAL_VOCAB-Zweig, wo er nie stand —
     nichts wurde entfernt, nichts vermerkt, und beim naechsten Start war er
     wieder da. [[kennzeichen_mit_zwei_ursachen]] */
  const welt = {
    VOCAB_DATA: [
      { id: 'gram-majrur', ar: 'مَجْرُورٌ', de: 'im Genitiv', chapter: 'personal' },
      { id: 'p_7',         ar: 'هُوَ',      de: 'er',          chapter: 'personal' },
    ],
    PERSONAL_VOCAB: [{ id: 'p_7', ar: 'هُوَ', de: 'er', chapter: 'personal' }],
    PROGRESS: {}, GELOESCHT: {}, GELOESCHT_SCHLUESSEL: 'vt_geloescht',
    geschrieben: [], console,
  };
  welt.LS = { set: (k, v) => welt.geschrieben.push(k) };
  welt.saveProgress = () => {};
  welt.savePersonalVocab = () => welt.geschrieben.push('vt_personalVocab');
  vm.createContext(welt);
  vm.runInContext(schneide('loeschePersonalVocab'), welt);

  welt.loeschePersonalVocab('gram-majrur');
  sag(welt.GELOESCHT['gram-majrur'] && welt.GELOESCHT['gram-majrur'].an === true,
    'Fachbegriff ohne source → wird als ausgeblendet vermerkt (vorher: gar nichts)');
  /* ⛔ Vom Stoertest nachgetragen: ohne diese Zeile blieb der Test gruen, auch
     wenn die Herkunft wieder aus `source` GERATEN wurde — der zweite Teil des
     Fixes deckte den ersten zu. Geprueft wird deshalb die Wirkung, die nur der
     erste hat: an einer Liste, in der das Wort nie stand, wird nicht
     herumgeschrieben. [[gruener_pruefer_beweist_nur_geprueftes]] */
  sag(!welt.geschrieben.includes('vt_personalVocab'),
    'Fachbegriff → die Geraeteliste wird gar nicht erst angefasst');

  welt.loeschePersonalVocab('p_7');
  sag(welt.PERSONAL_VOCAB.length === 0,
    'eigenes Wort → aus der Geraeteliste entfernt');
  sag(welt.GELOESCHT['p_7'] && welt.GELOESCHT['p_7'].an === true,
    'eigenes Wort → ZUSAETZLICH vermerkt, sonst holt der Geraeteabgleich es zurueck');
}

console.log(fehler === 0 ? '\n✔ alles in Ordnung' : '\n✘ ' + fehler + ' Fehler');
process.exit(fehler ? 1 : 0);
