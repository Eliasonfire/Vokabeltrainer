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
 *      (Die längeren Sätze sind Material, kein Code; die prüft dieser Test
 *      nicht.)
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
    vm.runInContext(sammel + '\n' + konst + '\n' + (fall || '') + '\n' + liste +
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
  const tippModi = U.filter(m => m.art !== 'wahl');
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
  const kern = KERN_QUELLE;
  const freiListe = (kern.match(/const FREISCHALTEN_AUF_WUNSCH\s*=\s*\[([^\]]*)\]/) || [])[1] || '';
  pruefe('هَؤُلَاءِ, أُولَئِكَ, مَتَى, أَيٌّ (Madina 1, K24) werden freigeschaltet',
    ['50164', '50165', '50169', '50170'].every(id => freiListe.includes("'" + id + "'")), freiListe || 'Liste fehlt');
  pruefe('… aber nur, wenn er das Wort nie angefasst hat', /if \(!EINZELN\[id\]\)/.test(kern), 'Bedingung fehlt');

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
}
console.log('\n' + (alleRot ? '✔ jede Störung wurde erkannt' : '✘ mindestens eine Störung blieb unbemerkt'));
process.exit(alleRot ? 0 : 1);
