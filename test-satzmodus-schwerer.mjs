/* test-satzmodus-schwerer.mjs — bewacht drei Sätze von Elias vom 16.09.2026
 * zum Satz-Modus (alle mit Bildschirmfoto; Nachrichten zwischen 18:16:31 und
 * 18:36:36, gemessen an der Sitzungsdatei).
 *
 * 1. Zu „9. Bestimmt?":
 *      „diese übung können wir komplett raus nehmen aus dem satzmodus weil das
 *       ist auch viel zu einfach"
 *      „die regel soll natürlich in der app bleiben aber die übung im
 *       satzmodus brauche ich nicht weil die ist viel zu leicht"
 *    → die Übung ist weg, die Regel al-tanwin-tilgung-01 ist noch da, und die
 *      Nummern der übrigen laufen ohne Lücke.
 *
 * 2. Zu „Tippe den مُضَاف an" und „Tippe das Wort im Genitiv an — es ist
 *    genau eines.":
 *      „außerdem muss man das auch schwerer machen, am besten mit mehr die im
 *       genitiv stehen"
 *      „hier sollte es auch ein etwas längerer satz sein mit mehr mudaf bzw
 *       etwas einfach schwieriger damit man so super leicht es einfach per
 *       ausschluss prinzip machen kann"
 *    → keine Tipp-Aufgabe verrät mehr, WIE VIELE Wörter richtig sind, und
 *      jede ist Mehrfachauswahl mit „Prüfen" — auch bei nur einem Treffer.
 *    → Und seit dem Abend (auf „Ich schreibe neue, längere Sätze, nur mit
 *      Wörtern, die du schon hast", 18:55:17: „mach das") acht längere Sätze
 *      `satz-lang-…` in data/beispielsaetze.js — Abschnitt 2g prüft, dass jede
 *      Form belegt ist, die Analyse sie richtig liest und der Satz-Modus sie
 *      bekommt.
 *
 * 3. Zu الْمُسْتَشْفَى, richtig als Genitiv gezählt:
 *      „und das wort steht gar nicht im genitiv weil es kein kasra hat. oder
 *       ist das irgendeine ausnahme oder so?"
 *    → „Warum?" zeigt bei einem Zielwort auf ى oder ا die Karte
 *      alif-maqsura-unveraenderlich-01 (Folge 12, genau dieses Wort), aber
 *      NICHT bei إِلَى / عَلَى, die als Partikeln keinen Fall haben.
 *
 * Gemessen wird an echten Sätzen (lehrbuch-saetze.js, vocab-data.js,
 * data/beispielsaetze.js) mit derselben Analyse wie in der App (js/irab.js).
 * Ein Test, der nur leere Listen prüft, wäre immer grün — deshalb muss es
 * Aufgaben mit einem UND mit mehreren Treffern geben, und mindestens einen
 * echten Fall mit unsichtbarer Endung. [[leere_liste_ist_keine_messung]]
 *
 *   node test-satzmodus-schwerer.mjs              prüfen
 *   node test-satzmodus-schwerer.mjs --stoertest  beweisen, dass er rot werden kann
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const WURZEL = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const STOERTEST = process.argv.includes('--stoertest');

const ORIGINAL = fs.readFileSync(path.join(WURZEL, 'js', 'uebung.js'), 'utf8');
let FACH_QUELLE = fs.readFileSync(path.join(WURZEL, 'data', 'fachbegriffe.js'), 'utf8');
let KERN_QUELLE = fs.readFileSync(path.join(WURZEL, 'js', 'kern.js'), 'utf8');
/* Für 2g: die längeren Sätze, js/saetze.js und die Wortfelder aus dem Abzug
   (data/vokabeln-madina-1.js liegt nur auf diesem Rechner — fehlt er, sagt 2g das). */
let BEISPIEL_QUELLE = '';
try { BEISPIEL_QUELLE = fs.readFileSync(path.join(WURZEL, 'data', 'beispielsaetze.js'), 'utf8'); } catch (e) { /* 2g meldet es */ }
let SAETZE_QUELLE = fs.readFileSync(path.join(WURZEL, 'js', 'saetze.js'), 'utf8');
const MADINA1 = (() => {
  try {
    const fenster = {};
    new Function('window', fs.readFileSync(path.join(WURZEL, 'data', 'vokabeln-madina-1.js'), 'utf8'))(fenster);
    return (fenster.VOKABELN && fenster.VOKABELN['madina-1']) || [];
  } catch (e) { return []; }
})();
const GRAMMATIK = fs.readFileSync(path.join(WURZEL, 'grammar-data.js'), 'utf8');
const irab = require('./js/irab.js');

const lade = (datei, name) =>
  (new Function(fs.readFileSync(path.join(WURZEL, datei), 'utf8') + ';return ' + name + ';'))();
const VOCAB_DATA = lade('vocab-data.js', 'VOCAB_DATA');
const LEHRBUCH_SAETZE = lade('lehrbuch-saetze.js', 'LEHRBUCH_SAETZE');
let BEISPIELSAETZE = {};
try { BEISPIELSAETZE = lade('data/beispielsaetze.js', 'BEISPIELSAETZE'); } catch (e) { /* optional */ }

/* Wie in der App: setzeLexikon(VOCAB_DATA) vor der Analyse. */
irab.setzeLexikon(VOCAB_DATA);
const SAETZE = [...new Set([
  ...LEHRBUCH_SAETZE.map(s => s.sentAr),
  ...VOCAB_DATA.map(v => v.sentAr),
  ...Object.values(BEISPIELSAETZE).map(s => s && s.sentAr)
].filter(Boolean))];
const ANALYSEN = SAETZE.map(ar => ({ ar, zeilen: irab.analysiereSatz(ar) }));

function schneideFunktion(text, name){
  const anfang = text.indexOf('function ' + name + '(');
  if (anfang < 0) return null;
  let i = text.indexOf('{', anfang), tiefe = 0;
  for (; i < text.length; i++){
    if (text[i] === '{') tiefe++;
    else if (text[i] === '}'){ tiefe--; if (!tiefe) return text.slice(anfang, i + 1); }
  }
  return null;
}
function schneideListe(text, kopf){
  const anfang = text.indexOf(kopf);
  if (anfang < 0) return null;
  const ende = text.indexOf('\n];', anfang);
  return ende < 0 ? null : text.slice(anfang, ende + 3);
}
const ohneKommentare = t => t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

function laufe(quelle, still){
  let ok = 0, schlecht = 0;
  const pruefe = (was, bedingung, gemessen) => {
    if (bedingung) { ok++; if (!still) console.log('  ✔ ' + was); }
    else { schlecht++; if (!still) console.log('  ✘ ' + was + '   gemessen: ' + gemessen); }
  };
  const log = s => { if (!still) console.log(s); };

  const sammel = schneideFunktion(quelle, 'uebungSammel');
  const liste = schneideListe(quelle, 'const UEBUNGEN = [');
  const fall = schneideFunktion(quelle, 'uebungUnsichtbarerFall');
  const konst = (quelle.match(/const UEBUNG_WARUM_UNSICHTBAR\s*=\s*'[^']+';/) || [''])[0];
  pruefe('uebungSammel(), UEBUNGEN und uebungUnsichtbarerFall() sind in js/uebung.js zu finden',
    !!sammel && !!liste && !!fall && !!konst,
    [!sammel && 'uebungSammel', !liste && 'UEBUNGEN', !fall && 'uebungUnsichtbarerFall', !konst && 'UEBUNG_WARUM_UNSICHTBAR'].filter(Boolean).join(', '));
  if (!sammel || !liste) return schlecht;

  const c = { console, endungUnsichtbar: irab.endungUnsichtbar };
  vm.createContext(c);
  try {
    /* uebungZarfMitGenitiv: seit 19.09.2026 ruft die Iḍāfa-Übung sie auf — ohne
       sie stürbe deren baue() hier still im catch unten, und die Übung fiele
       aus diesem Test heraus, ohne dass etwas rot wird. */
    vm.runInContext(sammel + '\n' + (schneideFunktion(quelle, 'uebungZarfMitGenitiv') || '') + '\n' + konst + '\n' + (fall || '') + '\n' + liste +
      '\n;globalThis.__U = UEBUNGEN; globalThis.__F = (typeof uebungUnsichtbarerFall === "function") ? uebungUnsichtbarerFall : null;' +
      '\nglobalThis.__K = (typeof UEBUNG_WARUM_UNSICHTBAR === "string") ? UEBUNG_WARUM_UNSICHTBAR : null;', c);
  } catch (e) {
    pruefe('die Übungsliste lässt sich laden', false, e.message);
    return schlecht;
  }
  const U = c.__U, F = c.__F;

  /* ---------- 1. „Bestimmt?" ist raus, die Regel bleibt ---------- */
  log('\n1. „Bestimmt?" ist aus dem Satz-Modus entfernt, die Regel bleibt');
  pruefe('keine Übung mit der Kennung bestimmtheit', !U.some(m => m.id === 'bestimmtheit'),
    U.filter(m => m.id === 'bestimmtheit').map(m => m.nr + '. ' + m.name).join(' · '));
  pruefe('keine Übung heißt „Bestimmt?"', !U.some(m => /^Bestimmt\?/.test(m.name)), '—');
  pruefe('die Regel al-tanwin-tilgung-01 steht weiter in grammar-data.js',
    /id:\s*"al-tanwin-tilgung-01"/.test(GRAMMATIK), 'Regel fehlt');
  const nummern = U.map(m => m.nr);
  pruefe('die Nummern laufen ohne Lücke von 1 bis ' + U.length,
    nummern.every((n, i) => n === i + 1), nummern.join(','));
  const zuordnung = ohneKommentare(quelle).match(/const UEBUNG_WARUM\s*=\s*\{[\s\S]*?\};/);
  pruefe('„Warum?" kennt keine Übung bestimmtheit mehr',
    !!zuordnung && !zuordnung[0].includes("'bestimmtheit'"), zuordnung ? 'steht noch drin' : 'UEBUNG_WARUM fehlt');

  /* ---------- 2. Die Anzahl wird nicht verraten ---------- */
  log('\n2. Keine Tipp-Aufgabe verrät, wie viele Wörter richtig sind');
  /* ⛔ 'schreiben' ist keine Tipp-Übung (22.09.2026). Bis dahin genügte „alles
     ausser 'wahl'", weil es nur zwei Arten gab. Mit der Übersetzungsübung gibt
     es eine dritte: dort wird getippt wie auf einer Tastatur, nicht auf ein
     Wort im Satz — sie hat keine `ziele`, keine Anzahl zu verraten und keine
     Gruppe „Antippen". Dieser Abschnitt prüft ausdrücklich das ANTIPPEN, und
     eine Übung ohne Antippen gehört nicht hinein.
     ⚠️ Der Test war deshalb zu Recht rot: eine neue Art soll auffallen. Was
     hier steht, ist die Antwort darauf — kein Stummschalten. */
  const tippModi = U.filter(m => m.art !== 'wahl' && m.art !== 'schreiben');
  pruefe('es gibt Tipp-Übungen (sonst prüft dieser Abschnitt nichts)', tippModi.length >= 5,
    tippModi.map(m => m.id).join(', '));
  const aufgaben = [];
  for (const m of tippModi){
    for (const s of ANALYSEN){
      let liste = [];
      try { liste = m.baue(s.zeilen, { sentAr: s.ar, id: 'test' }) || []; } catch (e) { liste = []; }
      for (const a of liste) aufgaben.push({ ...a, modus: m, zeilen: s.zeilen, ar: s.ar });
    }
  }
  const eins = aufgaben.filter(a => Array.isArray(a.ziele) && a.ziele.length === 1).length;
  const mehr = aufgaben.filter(a => Array.isArray(a.ziele) && a.ziele.length >= 2).length;
  log('     gemessen: ' + ANALYSEN.length + ' Sätze, ' + aufgaben.length + ' Tipp-Aufgaben, davon ' +
    eins + ' mit einem und ' + mehr + ' mit mehreren Treffern');
  pruefe('echte Aufgaben mit EINEM Treffer sind dabei', eins > 0, eins);
  pruefe('echte Aufgaben mit MEHREREN Treffern sind dabei', mehr > 0, mehr);
  const artVon = a => a.art || a.modus.art;
  const nichtMehrfach = aufgaben.filter(a => artVon(a) !== 'mehrfach');
  pruefe('jede Tipp-Aufgabe ist Mehrfachauswahl mit „Prüfen"', nichtMehrfach.length === 0,
    nichtMehrfach.length + '× ' + (nichtMehrfach[0] ? nichtMehrfach[0].modus.id + ': ' + nichtMehrfach[0].frage : ''));
  const verraet = aufgaben.filter(a => /\d|genau ein|es sind|es ist nur/.test(String(a.frage)));
  pruefe('keine Frage nennt eine Anzahl', verraet.length === 0,
    verraet.length + '× z. B. „' + (verraet[0] ? verraet[0].frage : '') + '"');
  const einzahl = aufgaben.filter(a => /^Tippe (den|das|die) /.test(String(a.frage)));
  pruefe('keine Frage sagt „Tippe den/das …" (verrät, dass es genau eines ist)', einzahl.length === 0,
    einzahl.length + '× z. B. „' + (einzahl[0] ? einzahl[0].frage : '') + '"');
  const gruppe = tippModi.filter(m => m.art !== 'mehrfach');
  pruefe('alle Tipp-Übungen stehen in derselben Gruppe', gruppe.length === 0,
    gruppe.map(m => m.id + ':' + m.art).join(', '));

  /* ---------- 2b. Die Frage sagt auf DEUTSCH, was gesucht ist ---------- */
  /* Elias, 18:34, zu „Tippe das مُبْتَدَأ an — worüber wird etwas gesagt?":
     „hier sollte bei mubtada stehen subjekt oder danach bei worüber wird etwas
      gesagtr sollte stehen was ist das subjekt weil sonst verstehe ich nicht
      und weiß nicht was von mir verlangt wrid" */
  log('\n2b. Jede Tipp-Frage sagt auf Deutsch, was gesucht ist');
  const fragen = [...new Set(aufgaben.map(a => a.modus.id + ' ' + a.frage))].map(x => x.split(' '));
  const nurArabisch = fragen.filter(([, f]) => {
    const deutsch = f.replace(/[؀-ۿݐ-ݿ]+/g, ' ')
      .replace(/\bTippe\b|\balle\b|\ban\b/g, ' ')
      .split(/[^A-Za-zÄÖÜäöüß]+/).filter(w => w.length >= 4);
    return deutsch.length === 0;
  });
  pruefe('keine Tipp-Frage steht nur auf Arabisch', nurArabisch.length === 0,
    nurArabisch.map(([id, f]) => id + ': ' + f).join(' · '));
  const subjekt = fragen.filter(([id, f]) => id === 'mubtada-khabar' && f.includes('مُبْتَدَأ'));
  pruefe('die مُبْتَدَأ-Frage gibt es (sonst prüft die nächste Zeile nichts)', subjekt.length > 0, subjekt.length);
  pruefe('und sie sagt „Subjekt" — sein Wort', subjekt.length > 0 && subjekt.every(([, f]) => /Subjekt/.test(f)),
    subjekt.map(([, f]) => f).join(' · '));

  /* ---------- 2c. Arabisch zuerst, Deutsch in Klammern dahinter ---------- */
  /* Elias, 18:52:49: „du kannst sowohl arabisch als auch deutsch, am besten
     sogar auf arabisch und dann in klammern auf deutsch die übersetzung)" */
  log('\n2c. Jeder arabische Begriff in einer Tipp-Frage hat seine deutsche Klammer dahinter');
  const ohneKlammer = fragen.filter(([, f]) => {
    const laeufe = [...f.matchAll(/[؀-ۿ]+(?:\s+[؀-ۿ]+)*/g)];
    return laeufe.some(m => !/^\s*\([A-Za-zÄÖÜäöüß][^)]*\)/.test(f.slice(m.index + m[0].length)));
  });
  const mitArabisch = fragen.filter(([, f]) => /[؀-ۿ]/.test(f));
  pruefe('es gibt Fragen mit arabischem Begriff (sonst prüft die nächste Zeile nichts)', mitArabisch.length >= 5, mitArabisch.length);
  pruefe('hinter jedem arabischen Begriff steht „(Deutsch)"', ohneKlammer.length === 0,
    ohneKlammer.map(([id, f]) => id + ': ' + f).join(' · '));

  /* ---------- 2d. Fachbegriffe mit Endung ---------- */
  /* Elias, 18:53:56, auf „Sollen Fachbegriffe mit Endung stehen, also حَرْفُ جَرٍّ
     statt حَرْف جَرّ, so wie auf deiner Regelkarte?": „ja". Geprüft werden die
     Formen, für die sein eigenes Material die Endung belegt; مُذَكَّر fehlt mit
     Absicht (kein Beleg, siehe js/uebung.js bei KASUS_WAHL). */
  log('\n2d. In Namen, Hinweisen, Fragen und Antworten stehen die Fachbegriffe mit Endung');
  const OHNE_ENDUNG = ['مُبْتَدَأ', 'خَبَر', 'نَعْت', 'مُضَاف', 'حَرْف جَرّ', 'حُرُوف جَرّ',
    'مَجْرُور', 'مَرْفُوع', 'مَنْصُوب', 'اِسْم', 'فِعْل', 'حَرْف'];
  const sichtbar = [
    ...U.map(m => m.name), ...U.map(m => m.hinweis || ''),
    ...fragen.map(([, f]) => f),
    ...[...quelle.matchAll(/text\s*:\s*'([^']*)'/g)].map(m => m[1])
  ];
  const nackt = [];
  for (const text of sichtbar)
    for (const form of OHNE_ENDUNG)
      if (new RegExp('(?<![\\u0600-\\u06FF])' + form + '(?![\\u0600-\\u06FF])').test(text)) nackt.push(form + ' in „' + text.slice(0, 50) + '"');
  pruefe('kein belegter Fachbegriff steht mehr ohne Endung', nackt.length === 0, nackt.slice(0, 4).join(' · '));

  /* ---------- 2e. Auch die Karteikarten der Fachbegriffe ---------- */
  /* Sein „ja" galt den Fachbegriffen, nicht nur dem Satzmodus. Die 15 Karten,
     deren Form mit Endung in seinem Material belegt ist (data/fachbegriffe.js,
     Kopfkommentar), müssen sie tragen. */
  log('\n2e. Die 15 belegten Fachbegriff-Karten tragen ihre Endung');
  const SOLL = { 'gram-mudaf': 'مُضَافٌ', 'gram-majrur': 'مَجْرُورٌ', 'gram-marfu': 'مَرْفُوعٌ', 'gram-nat': 'نَعْتٌ',
    'gram-idafa': 'إِضَافَةٌ', 'gram-zarf': 'ظَرْفٌ', 'gram-schakl': 'شَكْلٌ', 'gram-mubtada': 'مُبْتَدَأٌ',
    'gram-khabar': 'خَبَرٌ', 'gram-mansub': 'مَنْصُوبٌ', 'gram-harf': 'حَرْفٌ', 'gram-fil': 'فِعْلٌ',
    'gram-madd': 'مَدٌّ', 'gram-mutabaqa': 'مُطَابَقَةٌ', 'gram-taqdim': 'تَقْدِيمٌ' };
  const karten = FACH_QUELLE ? (new Function(FACH_QUELLE + ';return FACHBEGRIFF_VOKABELN;'))() : [];
  const falsch = Object.entries(SOLL).filter(([id, form]) => {
    const k = karten.find(x => x.id === id);
    return !k || String(k.ar).normalize('NFC') !== form.normalize('NFC');
  });
  pruefe('alle 15 Karten gefunden und mit Endung', karten.length > 0 && falsch.length === 0,
    falsch.map(([id]) => id + ' = ' + ((karten.find(x => x.id === id) || {}).ar || 'fehlt')).join(' · '));

  /* ---------- 2f. Die Wortlisten seiner Musterlösung werden abgefragt ---------- */
  /* Elias, 19:15–19:28, Seite für Seite: „die brauche ich als neue karteikarten
     damit ich danach abgefragt werde" · „hab ich die auch schon als karteikarten
     die mich abfragen? das sind auch wichtige vokabeln". */
  log('\n2f. Karten und Freischaltungen aus seiner Musterlösung');
  const MUSTER_KARTEN = { 'gram-isara-hadhani': 'هَذَانِ', 'gram-isara-hatani': 'هَاتَانِ', 'gram-isara-dhanika': 'ذَانِكَ',
    'gram-isara-tanika': 'تَانِكَ', 'gram-frage-madha': 'مَاذَا', 'gram-frage-kam': 'كَمْ',
    'gram-frage-min-ayna': 'مِنْ أَيْنَ', 'gram-frage-ila-ayna': 'إِلَى أَيْنَ' };
  const ohneKarte = Object.entries(MUSTER_KARTEN).filter(([id, ar]) => {
    const k = karten.find(x => x.id === id);
    return !k || String(k.ar).normalize('NFC') !== ar.normalize('NFC') || !k.sentAr;
  });
  pruefe('die acht neuen Karten stehen da, mit Satz', karten.length > 0 && ohneKarte.length === 0, ohneKarte.map(([id]) => id).join(' · '));
  /* Elias, 19:47, auf „Soll ich für die Weiblichkeit Karten zu ـاء (wie حَمْرَاءُ)
     und ى (wie كُبْرَى) anlegen?" und „… Präpositionen بِ und كَ …":
     „ja beides als karteikarten machen". كُبْرَى hat bewusst KEINEN Satz
     (Begründung an der Karte) — deshalb wird dort nur die Karte verlangt. */
  const BEIDES = { 'gram-fem-hamra': ['حَمْرَاءُ', true], 'gram-fem-kubra': ['كُبْرَى', false],
    'gram-harf-bi': ['بِ', true], 'gram-harf-ka': ['كَ', true] };
  const beidesFehlt = Object.entries(BEIDES).filter(([id, [ar, mitSatz]]) => {
    const k = karten.find(x => x.id === id);
    return !k || String(k.ar).normalize('NFC') !== ar.normalize('NFC') || (mitSatz && !k.sentAr);
  });
  pruefe('ـاء, ى, بِ und كَ als Karten', karten.length > 0 && beidesFehlt.length === 0, beidesFehlt.map(([id]) => id).join(' · '));
  /* Elias, 20:32:24: „die vokabeln die ich dort aufgeschrieben habe mit rot die
     brauche ich auch als karteikarten" — und 20:34:11: „ich hab da auch scon die
     übersetzung hingeschrieben die mein lehrer gesagt hat". Von der Seite fehlte
     nur أَوْلَادٌ mit SEINER Bedeutung „Kinder" (die übrigen hat er aus den Büchern). */
  const awlad = karten.find(x => x.id === 'gram-awlad');
  pruefe('أَوْلَادٌ „Kinder" (Übersetzung seines Lehrers) als Karte, mit Satz',
    !!awlad && String(awlad.ar).normalize('NFC') === 'أَوْلَادٌ'.normalize('NFC') && awlad.de === 'Kinder' && !!awlad.sentAr,
    awlad ? awlad.ar + ' „' + awlad.de + '"' : 'fehlt');
  /* هَيَّا بِنَا von derselben Seite — Elias hörte das Schadda im Video nach (20:51:27
     „hayya hat ein schadda"). Und die Analyse darf هَيَّا NICHT als مُبْتَدَأ lesen,
     sonst fragt der Satzmodus es als Subjekt ab. */
  const hayya = karten.find(x => x.id === 'gram-hayya-bina');
  pruefe('هَيَّا بِنَا „Los geht\'s" als Karte, mit Schadda und Buchsatz',
    !!hayya && String(hayya.ar).normalize('NFC') === 'هَيَّا بِنَا'.normalize('NFC') && hayya.de === "Los geht's" && !!hayya.sentAr,
    hayya ? hayya.ar + ' „' + hayya.de + '"' : 'fehlt');
  const hayyaRollen = irab.analysiereSatz('هَيَّا بِنَا إِلَى الْمَسْجِدِ.');
  pruefe('die Analyse liest هَيَّا als unveränderlich, nicht als مُبْتَدَأ',
    hayyaRollen.length > 0 && hayyaRollen[0].rolle === 'unveränderlich', hayyaRollen.length ? hayyaRollen[0].rolle : 'keine Analyse');
  const kern = KERN_QUELLE;
  const freiListe = (kern.match(/const FREISCHALTEN_AUF_WUNSCH\s*=\s*\[([^\]]*)\]/) || [])[1] || '';
  pruefe('هَؤُلَاءِ, أُولَئِكَ, مَتَى, أَيٌّ (Madina 1, K24) werden freigeschaltet',
    ['50164', '50165', '50169', '50170'].every(id => freiListe.includes("'" + id + "'")), freiListe || 'Liste fehlt');
  pruefe('… aber nur, wenn er das Wort nie angefasst hat', /if \(!EINZELN\[id\]\)/.test(kern), 'Bedingung fehlt');

  /* ---------- 2g. Längere Sätze aus seinen Wörtern ---------- */
  /* Elias zu „Tippe alle مُضَافٌ an": „hier sollte es auch ein etwas längerer satz
     sein mit mehr mudaf bzw etwas einfach schwieriger damit man so super leicht es
     einfach per ausschluss prinzip machen kann" — und auf „Ich schreibe neue,
     längere Sätze, nur mit Wörtern, die du schon hast" (18:55:17): „mach das".
     ⛔ Kein Zeichen selbst vokalisiert: jede Form steht GENAU SO in einem Satz
     seines Lehrbuchs oder in einem Wortfeld seines freigeschalteten Bestands.
     Ein Satz, den eine Sitzung geschrieben hat, zählt nicht — sonst belegt sich
     ein Fehler selbst. [[zitat_ueber_die_stelle]] */
  log('\n2g. Längere Sätze: jede Form belegt, richtig gelesen, im Satz-Modus');
  let bsp = {};
  try { bsp = BEISPIEL_QUELLE ? (new Function(BEISPIEL_QUELLE + ';return BEISPIELSAETZE;'))() : {}; } catch (e) { bsp = {}; }
  const lang = Object.entries(bsp).filter(([id, s]) => id.startsWith('satz-lang-') && s && s.sentAr);
  pruefe('mindestens acht längere Sätze stehen in data/beispielsaetze.js', lang.length >= 8, lang.length);
  const nurForm = t => String(t).normalize('NFC').replace(/^[.،؟!:«»؛()]+|[.،؟!:«»؛()]+$/g, '');
  const BELEG = new Set();
  const merke = f => { const t = nurForm(f); if (/[ً-ْ]/.test(t)) BELEG.add(t); };
  LEHRBUCH_SAETZE.forEach(s => String(s.sentAr || '').split(/\s+/).forEach(merke));
  const freiM1 = ((KERN_QUELLE.match(/'madina-1':\s*\[([0-9,\s]*)\]/) || [])[1] || '')
    .split(',').map(Number).filter(Boolean);
  pruefe('der Abzug madina-1 und seine Freischaltung sind lesbar (sonst fehlen die Wortfelder als Beleg)',
    MADINA1.length > 0 && freiM1.length > 0, MADINA1.length + ' Wörter, Kapitel ' + freiM1.join(','));
  for (const w of VOCAB_DATA.concat(MADINA1.filter(x => freiM1.includes(Number(x.chapter))))){
    ['ar', 'sg', 'femSg', 'femPl'].forEach(f => { if (w[f]) merke(w[f]); });
    if (w.pl) String(w.pl).split(/\s*\/\s*/).forEach(merke);
  }
  const unbelegt = [];
  for (const [id, s] of lang)
    for (const t of String(s.sentAr).split(/\s+/)) if (!BELEG.has(nurForm(t))) unbelegt.push(id + ': ' + nurForm(t));
  pruefe('jede Form steht so in seinem Buch oder einem Wortfeld', lang.length > 0 && unbelegt.length === 0, unbelegt.join(' · '));
  const laenge = lang.filter(([, s]) => { const n = String(s.sentAr).trim().split(/\s+/).length; return n < 4 || n > 10; });
  pruefe('4 bis 10 Wörter (10 = der längste Satz seines Buchs)', laenge.length === 0, laenge.map(([id]) => id).join(' · '));

  const modusIdafa = U.find(m => m.id === 'idafa');
  const widerspruch = [];
  let zweiMudaf = 0, genitivOhneIdafa = 0;
  for (const [id, s] of lang){
    const zeilen = irab.analysiereSatz(s.sentAr);
    zeilen.filter(z => z.stimmt === false).forEach(z => widerspruch.push(id + ': ' + z.wort + ' (' + z.rolle + ')'));
    let auf = [];
    try { auf = modusIdafa ? (modusIdafa.baue(zeilen, { sentAr: s.sentAr, id }) || []) : []; } catch (e) { auf = []; }
    const mudaf = auf.find(a => /Besessene/.test(String(a.frage)));
    if (mudaf && Array.isArray(mudaf.ziele) && mudaf.ziele.length >= 2) zweiMudaf++;
    if (zeilen.some(z => /^نَعْت/.test(String(z.rolle)) && z.gelesen && z.gelesen.kasus === 'jarr')) genitivOhneIdafa++;
  }
  pruefe('die Analyse liest jeden längeren Satz ohne Widerspruch', lang.length > 0 && widerspruch.length === 0, widerspruch.join(' · '));
  pruefe('mindestens drei haben zwei مُضَاف — die Frage ist nicht mehr per Ausschluss lösbar', zweiMudaf >= 3, zweiMudaf);
  pruefe('mindestens einer hat ein Wort im Genitiv, das KEIN مُضَاف إِلَيْهِ ist (نَعْت)', genitivOhneIdafa >= 1, genitivOhneIdafa);

  /* 22.09.2026 — Elias: „lieber die schwereren, generell alle sollen so sein bei
     mudaf und ilayhi". Der Modus idafa stellt nur noch Aufgaben mit MEHR ALS
     EINEM Treffer, und die längeren Sätze liefern den Nachschub. */
  let idafaAufgaben = 0, idafaEinzeln = 0;
  for (const { ar, zeilen } of ANALYSEN){
    let auf = [];
    try { auf = modusIdafa ? (modusIdafa.baue(zeilen, { sentAr: ar }) || []) : []; } catch (e) { auf = []; }
    for (const a of auf){ idafaAufgaben++; if (!Array.isArray(a.ziele) || a.ziele.length < 2) idafaEinzeln++; }
  }
  pruefe('Mudaf und Mudaf ilayhi: keine Aufgabe mit nur einem Treffer', idafaAufgaben > 0 && idafaEinzeln === 0,
    idafaEinzeln + ' von ' + idafaAufgaben);
  const zweiUndZwei = lang.filter(([id, s]) => {
    let auf = [];
    try { auf = modusIdafa ? (modusIdafa.baue(irab.analysiereSatz(s.sentAr), { sentAr: s.sentAr, id }) || []) : []; } catch (e) { auf = []; }
    return auf.length === 2;
  }).length;
  pruefe('mindestens zehn längere Sätze tragen BEIDE Aufgaben (je zwei Treffer)', zweiUndZwei >= 10, zweiUndZwei);

  const fnAlle = schneideFunktion(SAETZE_QUELLE, 'alleSaetze');
  const fnLang = schneideFunktion(SAETZE_QUELLE, 'laengereSaetze');
  const fnVorn = schneideFunktion(SAETZE_QUELLE, 'nichtVorausgeschrieben');
  const fnHerk = schneideFunktion(SAETZE_QUELLE, 'herkunft');
  pruefe('alleSaetze(), laengereSaetze() und herkunft() stehen in js/saetze.js', !!fnAlle && !!fnLang && !!fnVorn && !!fnHerk,
    [!fnAlle && 'alleSaetze', !fnLang && 'laengereSaetze', !fnVorn && 'nichtVorausgeschrieben', !fnHerk && 'herkunft'].filter(Boolean).join(', '));
  if (fnAlle && fnLang && fnVorn && fnHerk){
    const welt = { VOCAB_DATA: [], LEHRBUCH_SAETZE: [], BEISPIELSAETZE: bsp, kapitelBeschriftung: () => 'Kap. ?' };
    vm.createContext(welt);
    try {
      vm.runInContext(fnVorn + '\n' + fnLang + '\n' + fnAlle + '\n' + fnHerk
        + '\n;globalThis.__A = alleSaetze; globalThis.__H = herkunft;', welt);
      const imModus = welt.__A().filter(s => String(s.id).startsWith('satz-lang-'));
      pruefe('der Satz-Modus bekommt alle längeren Sätze (alleSaetze())', lang.length > 0 && imModus.length === lang.length,
        imModus.length + ' von ' + lang.length);
      const kopf = imModus.length ? welt.__H(imModus[0]) : '';
      pruefe('über ihnen steht „Längerer Satz aus deinen Wörtern", nicht „Kap. …"', kopf === 'Längerer Satz aus deinen Wörtern', kopf);
    } catch (e) {
      pruefe('js/saetze.js lässt sich für den Test laden', false, e.message);
    }
  }

  /* ---------- 3. „Warum?" bei unsichtbarer Endung ---------- */
  log('\n3. „Warum?" zeigt bei ى/ا die Karte zur unsichtbaren Endung');
  pruefe('uebungUnsichtbarerFall() ist ladbar', typeof F === 'function', typeof F);
  pruefe('die Karte heißt alif-maqsura-unveraenderlich-01', c.__K === 'alif-maqsura-unveraenderlich-01', c.__K);
  pruefe('und steht in grammar-data.js',
    /id:\s*"alif-maqsura-unveraenderlich-01"/.test(GRAMMATIK), 'Regel fehlt');
  const warum = schneideFunktion(ohneKommentare(quelle), 'uebungWarum') || '';
  pruefe('uebungWarum() fragt uebungUnsichtbarerFall(a)', /uebungUnsichtbarerFall\(\s*a\s*\)/.test(warum),
    warum ? 'Aufruf fehlt' : 'uebungWarum() fehlt');
  if (typeof F === 'function'){
    const unsichtbarIn = a => (a.ziele || []).some(i => {
      const t = a.zeilen[i];
      if (!t || !t.erwartet || t.gelesen || t.erwartet !== 'jarr') return false;
      return /^(اِسْم مَقْصُور|endet auf Alif)/.test(String(irab.endungUnsichtbar(t.wort) || ''));
    });
    const genitiv = aufgaben.filter(a => a.modus.id === 'alle-majrur');
    const mit = genitiv.filter(unsichtbarIn);
    const ohne = genitiv.filter(a => !unsichtbarIn(a));
    log('     gemessen: ' + genitiv.length + ' Genitiv-Aufgaben, ' + mit.length + ' davon mit unsichtbarer Endung');
    const stationaer = mit.find(a => a.ar.includes('الْمُسْتَشْفَى'));
    pruefe('Elias\' Fall ist dabei: ein Satz mit الْمُسْتَشْفَى', !!stationaer, 'kein solcher Satz gefunden');
    const mitFalsch = mit.filter(a => F(a) !== true);
    pruefe('bei jedem dieser Fälle öffnet „Warum?" die Karte', mit.length > 0 && mitFalsch.length === 0,
      mit.length + ' Fälle, ' + mitFalsch.length + ' ohne Karte');
    const ohneFalsch = ohne.filter(a => F(a) !== false);
    pruefe('bei sichtbarer Kasra bleibt es bei der allgemeinen Karte', ohne.length > 0 && ohneFalsch.length === 0,
      ohne.length + ' Fälle, ' + ohneFalsch.length + ' fälschlich umgeleitet, z. B. ' + (ohneFalsch[0] ? ohneFalsch[0].ar : ''));
    /* ⛔ Die Gegenprobe, auf die es ankommt: إِلَى und عَلَى enden auch auf ى. */
    const partikel = aufgaben.filter(a => a.modus.id === 'jarr-paar'
      && (a.ziele || []).every(i => a.zeilen[i] && !a.zeilen[i].erwartet)
      && (a.ziele || []).some(i => /[ىا]$/.test(String(a.zeilen[i].wort).replace(/[ً-ْٰ.،؟!]/g, ''))));
    pruefe('Gegenprobe vorhanden: Partikel-Aufgaben mit إِلَى/عَلَى', partikel.length > 0, partikel.length);
    const partikelFalsch = partikel.filter(a => F(a) !== false);
    pruefe('dort erscheint die Karte NICHT', partikelFalsch.length === 0,
      partikelFalsch.length + '× z. B. ' + (partikelFalsch[0] ? partikelFalsch[0].ar : ''));
  }
  return schlecht;
}

if (!STOERTEST){
  console.log('test-satzmodus-schwerer.mjs — drei Wünsche von Elias vom 16.09.2026');
  const schlecht = laufe(ORIGINAL, false);
  console.log('\n' + (schlecht ? '✘ ' + schlecht + ' gescheitert' : '✔ alles bestanden'));
  process.exit(schlecht ? 1 : 0);
}

/* ---------- Störtest: jede Sperre muss einzeln rot werden können ---------- */
const STOERUNGEN = [
  ['die Frage verrät wieder die Anzahl',
    q => q.replace("return { frage, ziele: treffer, art: 'mehrfach' };",
      "if (treffer.length === 1) return { frage: frage + ' — es ist genau eines.', ziele: treffer, art: 'tippen' };\n  return { frage: frage + ' — es sind ' + treffer.length + '.', ziele: treffer, art: 'mehrfach' };")],
  ['„Bestimmt?" ist wieder da',
    q => q.replace("const UEBUNGEN = [", "const UEBUNGEN = [\n  { id:'bestimmtheit', nr:0, name:'Bestimmt?', art:'wahl', baue(){ return []; } },")],
  ['die Partikel-Sperre fehlt (إِلَى bekäme die Karte)',
    q => q.replace('if (!t || !t.erwartet || t.gelesen) return false;', 'if (!t) return false;')
          .replace("if (id !== 'kasus' && t.erwartet !== 'jarr') return false;", '')],
  ['„Warum?" fragt die unsichtbare Endung nicht mehr ab',
    q => q.replace(/\n\s*if \(uebungUnsichtbarerFall\(a\)[^\n]*/, '')],
  ['die مُبْتَدَأ-Frage sagt wieder nur „worüber wird etwas gesagt?"',
    q => q.replace("'Tippe alle مُبْتَدَأٌ (Subjekt) an.'", "'Tippe alle مُبْتَدَأٌ an — worüber wird etwas gesagt?'")],
  ['die Präpositions-Frage steht wieder nur auf Arabisch',
    q => q.replace("'Tippe alle حُرُوفُ جَرٍّ (Präpositionen) an.'", "'Tippe alle حُرُوفُ جَرٍّ an.'")],
  ['die deutsche Klammer steht wieder VOR dem Arabischen',
    q => q.replace("'Tippe alle مَجْرُورٌ (Wörter im Genitiv) an.'", "'Tippe alle Wörter im Genitiv (مَجْرُورٌ) an.'")],
  ['ein Übungsname steht wieder ohne Endung',
    q => q.replace("name:'حَرْفُ جَرٍّ + مَجْرُورٌ — Präposition'", "name:'حَرْف جَرّ + مَجْرُور — Präposition'")]
];
let alleRot = true;
console.log('Störtest: jede Störung muss mindestens eine Prüfung rot machen\n');
for (const [name, stoere] of STOERUNGEN){
  const gestoert = stoere(ORIGINAL);
  if (gestoert === ORIGINAL){ alleRot = false; console.log('  ✘ ' + name + ' — Störung griff nicht (Text nicht gefunden)'); continue; }
  const schlecht = laufe(gestoert, true);
  if (schlecht > 0) console.log('  ✔ ' + name + ' → ' + schlecht + ' rot');
  else { alleRot = false; console.log('  ✘ ' + name + ' → blieb grün'); }
}
/* Und eine Störung an den KARTEN, nicht am Satzmodus. */
{
  const echt = FACH_QUELLE;
  FACH_QUELLE = echt.replace("ar: 'مُضَافٌ',", "ar: 'مُضَاف',");
  if (FACH_QUELLE === echt){ alleRot = false; console.log('  ✘ die Karte مُضَافٌ ohne Endung — Störung griff nicht'); }
  else {
    const schlecht = laufe(ORIGINAL, true);
    if (schlecht > 0) console.log('  ✔ die Karte مُضَافٌ steht wieder ohne Endung → ' + schlecht + ' rot');
    else { alleRot = false; console.log('  ✘ die Karte مُضَافٌ ohne Endung → blieb grün'); }
  }
  FACH_QUELLE = echt;

  FACH_QUELLE = echt.replace('de: "Kinder",', 'de: "Junge",');
  if (FACH_QUELLE === echt){ alleRot = false; console.log('  ✘ أَوْلَادٌ mit falscher Bedeutung — Störung griff nicht'); }
  else {
    const schlecht = laufe(ORIGINAL, true);
    if (schlecht > 0) console.log('  ✔ أَوْلَادٌ heißt nicht mehr „Kinder" → ' + schlecht + ' rot');
    else { alleRot = false; console.log('  ✘ أَوْلَادٌ mit falscher Bedeutung → blieb grün'); }
  }
  FACH_QUELLE = echt;

  FACH_QUELLE = echt.replace('id: "gram-harf-ka",', 'id: "gram-harf-kx",');
  if (FACH_QUELLE === echt){ alleRot = false; console.log('  ✘ die Karte كَ fehlt — Störung griff nicht'); }
  else {
    const schlecht = laufe(ORIGINAL, true);
    if (schlecht > 0) console.log('  ✔ die Karte كَ fehlt → ' + schlecht + ' rot');
    else { alleRot = false; console.log('  ✘ die Karte كَ fehlt → blieb grün'); }
  }
  FACH_QUELLE = echt;

  const kernEcht = KERN_QUELLE;
  KERN_QUELLE = kernEcht.replace("'50169', ", '');
  if (KERN_QUELLE === kernEcht){ alleRot = false; console.log('  ✘ مَتَى aus der Freischaltliste — Störung griff nicht'); }
  else {
    const schlecht = laufe(ORIGINAL, true);
    if (schlecht > 0) console.log('  ✔ مَتَى fehlt in der Freischaltliste → ' + schlecht + ' rot');
    else { alleRot = false; console.log('  ✘ مَتَى fehlt in der Freischaltliste → blieb grün'); }
  }
  KERN_QUELLE = kernEcht;

  /* 2g: die längeren Sätze. Eine selbst gesetzte Ḥaraka, ein Satz-Modus ohne sie,
     eine Kopfzeile „Kap. undefined" — jede Störung einzeln. */
  const bspEcht = BEISPIEL_QUELLE, saetzeEcht = SAETZE_QUELLE;
  const STOERUNGEN_2G = [
    ['eine Ḥaraka selbst gesetzt (حَقِيبَةَ statt حَقِيبَةُ)', () => { BEISPIEL_QUELLE = bspEcht.replace("'حَقِيبَةُ الطَّالِبِ الْجَدِيدِ عَلَى", "'حَقِيبَةَ الطَّالِبِ الْجَدِيدِ عَلَى"); return BEISPIEL_QUELLE !== bspEcht; }],
    ['der Satz-Modus holt die längeren Sätze nicht mehr', () => { SAETZE_QUELLE = saetzeEcht.replace('ausLehrbuch, laengereSaetze()', 'ausLehrbuch'); return SAETZE_QUELLE !== saetzeEcht; }],
    ['über dem Satz stünde wieder „Kap. …"', () => { SAETZE_QUELLE = saetzeEcht.replace("if (w.laengerSatz) return 'Längerer Satz aus deinen Wörtern';", ''); return SAETZE_QUELLE !== saetzeEcht; }]
  ];
  for (const [name, stoere] of STOERUNGEN_2G){
    if (!stoere()){ alleRot = false; console.log('  ✘ ' + name + ' — Störung griff nicht'); }
    else {
      const schlecht = laufe(ORIGINAL, true);
      if (schlecht > 0) console.log('  ✔ ' + name + ' → ' + schlecht + ' rot');
      else { alleRot = false; console.log('  ✘ ' + name + ' → blieb grün'); }
    }
    BEISPIEL_QUELLE = bspEcht; SAETZE_QUELLE = saetzeEcht;
  }

  /* 22.09.2026: der Modus idafa stellt wieder Aufgaben mit einem Treffer. */
  const leicht = ORIGINAL.replace('mudaf.length > 1 ?', 'mudaf.length > 0 ?').replace('zu.length > 1 ?', 'zu.length > 0 ?');
  if (leicht === ORIGINAL){ alleRot = false; console.log('  ✘ Iḍāfa wieder mit einem Treffer — Störung griff nicht'); }
  else {
    const schlecht = laufe(leicht, true);
    if (schlecht > 0) console.log('  ✔ Iḍāfa wieder mit einem Treffer → ' + schlecht + ' rot');
    else { alleRot = false; console.log('  ✘ Iḍāfa wieder mit einem Treffer → blieb grün'); }
  }
}
console.log('\n' + (alleRot ? '✔ jede Störung wurde erkannt' : '✘ mindestens eine Störung blieb unbemerkt'));
process.exit(alleRot ? 0 : 1);
