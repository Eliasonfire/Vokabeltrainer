/* Prüfstand: Eintippen auf der Karteikarte — nur noch, wenn die Karte auf
 * Deutsch fragt (v657, 07.10.2026). renderTippfeld() und pruefeTippen() in
 * js/lernen.js.
 *
 * Elias am 07.10.2026: „ich möchte ab jetzt nur noch wenn mir die deutsche
 * seite kommt das arabische hinschreiben. andersherum finde ich machts keinen
 * sinn bzw mache ich sowieso nciht. aber arabisch schreiben da muss ich mir
 * wenigsten mühe machen es auch richtig zu schreiben, das bringt was"
 *
 * Das hebt seinen Wunsch vom 07.09.2026 auf („in beide richtungen"). Der
 * Vorgänger dieser Datei, test-tippen-beide-richtungen.mjs, prüfte den
 * Vergleich der deutschen Eingabe — den gibt es seit v657 nicht mehr.
 *
 * Alles läuft am ECHTEN Quelltext: renderTippfeld(), pruefeTippen() und
 * cardDirection() werden aus js/lernen.js geschnitten. Nachgebildet sind nur
 * die Seite (ein Doppel, das genau so viel kann, wie die Funktionen fragen)
 * und der Zufall. Arabisch steht hier als Codepunkte, damit kein Zeichen beim
 * Kopieren verrutscht.
 *
 * Störtests am Ende: je eine Regel wird aus dem Quelltext genommen, und der
 * dafür zuständige Fall MUSS dann scheitern — sonst prüft er nichts.
 *
 * Aufruf:  node test-tippen-nur-arabisch.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const WURZEL = path.dirname(fileURLToPath(import.meta.url));
const lies = f => fs.readFileSync(path.join(WURZEL, f), 'utf8').replace(/\r\n/g, '\n');
const LERNEN = lies('js/lernen.js'), EINST = lies('js/einstellungen.js'), HTML = lies('index.html');

function schneide(quelle, kopf){
  const a = quelle.indexOf('\n' + kopf);
  if (a < 0) throw new Error('im Quelltext nicht gefunden: ' + kopf);
  let i = quelle.indexOf('{', quelle.indexOf(')', a)), tiefe = 0;
  for (; i < quelle.length; i++){
    if (quelle[i] === '{') tiefe++;
    else if (quelle[i] === '}'){ tiefe--; if (!tiefe) return quelle.slice(a + 1, i + 1); }
  }
  throw new Error('kein Ende gefunden: ' + kopf);
}
function stueck(quelle, muster, was){
  const m = quelle.match(muster);
  if (!m) throw new Error('im Quelltext nicht gefunden: ' + was);
  return m[0].trim();
}

/* Arabisch als Codepunkte. */
const KITAB_VOLL  = 'كِتَابٌ';   /* kitābun, mit Vokalzeichen */
const KITAB_NACKT = 'كتاب';                     /* dasselbe ohne Vokalzeichen */
const KUTUB_VOLL  = 'كُتُبٌ';         /* kutubun */
const QALAM_NACKT = 'قلم';                           /* qalam, ein anderes Wort */
const ACH_VOLL    = 'أَخٌ';                     /* akhun, Alif MIT Hamza */
const ACH_HAMZA   = 'أخ';                                 /* ohne Vokalzeichen, mit Hamza */
const ACH_OHNE    = 'اخ';                                 /* ohne Vokalzeichen, OHNE Hamza */

function baue(lernen, opt){
  const ctx = { console: { log(){}, warn(){}, error(){} } };
  vm.createContext(ctx);
  vm.runInContext(`
    /* Ein Doppel der Seite — nur, was renderTippfeld() und pruefeTippen() fragen. */
    const __el = {};
    const document = { getElementById(id){
      if (!__el[id]) __el[id] = { id, value: '', textContent: '', className: '', placeholder: '',
        classList: { menge: new Set(id === 'cardTippBox' ? ['hidden'] : []),
          add(c){ this.menge.add(c); }, remove(c){ this.menge.delete(c); }, contains(c){ return this.menge.has(c); } } };
      return __el[id];
    } };
    let SETTINGS = ${JSON.stringify(opt.einstellungen)};
    let PROGRESS = ${JSON.stringify(opt.fortschritt)};
    let SESSION = { words: ${JSON.stringify(opt.karten)}, idx: 0, dirs: ${JSON.stringify(opt.dirs || [])}, fertig: false };
    /* NACHGEBILDET: der Zufall, damit „Nach Box" ab Box 3 vorhersagbar würfelt. */
    let __zufall = ${opt.zufall === undefined ? 0.1 : opt.zufall};
    Math.random = () => __zufall;
  `, ctx);
  vm.runInContext([
    stueck(lernen, /\nconst RICHTUNG_NUR_ARABISCH_BIS_BOX = [^\n]*;/, 'RICHTUNG_NUR_ARABISCH_BIS_BOX'),
    schneide(lernen, 'function cardDirection('),
    schneide(lernen, 'function renderTippfeld('),
    schneide(lernen, 'function pruefeTippen(')
  ].join('\n'), ctx);
  const hole = n => vm.runInContext(n, ctx);
  return {
    hole,
    zeige: i => hole('SESSION.idx = ' + i + '; renderTippfeld(SESSION.words[' + i + ']);'),
    sichtbar: () => !hole('document.getElementById("cardTippBox").classList.contains("hidden")'),
    tippe: (i, text) => { hole('SESSION.idx = ' + i + '; document.getElementById("cardTippEingabe").value = ' + JSON.stringify(text) + '; pruefeTippen();');
      return { klasse: hole('document.getElementById("cardTippAntwort").className'), text: hole('document.getElementById("cardTippAntwort").textContent') }; }
  };
}

const AN = { tippenAbBox4: true };
const karte = (id, ar, sg) => Object.assign({ id, ar, de: 'das Buch' }, sg ? { sg } : {});

function laufe(lernen, einst, html){
  const erg = new Map();
  const fall = (name, fn) => {
    let r;
    try { r = fn(); } catch (e){ r = 'wirft: ' + e.message; }
    erg.set(name, { ok: r === true, zusatz: r === true ? '' : String(r) });
  };

  fall('T1 Fragt die Karte auf Deutsch (Box 4, Schalter an), steht das Feld da — leer und ohne altes Urteil', () => {
    const u = baue(lernen, { einstellungen: Object.assign({ direction: 'de-ar' }, AN), fortschritt: { k: { box: 4 } }, karten: [karte('k', KITAB_VOLL)] });
    u.hole('document.getElementById("cardTippEingabe").value = "alt"; document.getElementById("cardTippAntwort").textContent = "Noch nicht."; document.getElementById("cardTippAntwort").className = "tipp-antwort falsch";');
    u.zeige(0);
    if (!u.sichtbar()) return 'das Feld ist verborgen';
    const rest = u.hole('[document.getElementById("cardTippEingabe").value, document.getElementById("cardTippAntwort").textContent, document.getElementById("cardTippAntwort").className].join("|")');
    return rest === '||tipp-antwort' ? true : 'vom vorigen Wort steht noch etwas da: ' + rest;
  });

  fall('T2 Fragt die Karte auf Arabisch, steht KEIN Feld da — sein Satz vom 07.10.2026', () => {
    const u = baue(lernen, { einstellungen: Object.assign({ direction: 'ar-de' }, AN), fortschritt: { k: { box: 5 } }, karten: [karte('k', KITAB_VOLL)] });
    u.zeige(0);
    return u.sichtbar() ? 'das Feld steht da, obwohl die Karte auf Arabisch fragt' : true;
  });

  fall('T3 Bei seiner Einstellung „Nach Box" entscheidet die Richtung DIESER Karte: gewürfelt Deutsch → Feld, gewürfelt Arabisch → kein Feld', () => {
    const opt = z => ({ einstellungen: Object.assign({ direction: 'box' }, AN), fortschritt: { k: { box: 5 } }, karten: [karte('k', KITAB_VOLL)], zufall: z });
    const de = baue(lernen, opt(0.9)); de.zeige(0);          /* cardDirection(): unter 0,5 = ar-de, sonst de-ar */
    if (de.hole('cardDirection(0)') !== 'de-ar') return 'der Würfel 0,9 ergab nicht de-ar — der Fall misst nichts';
    if (!de.sichtbar()) return 'auf Deutsch gefragt, aber kein Feld';
    const ar = baue(lernen, opt(0.1)); ar.zeige(0);
    if (ar.hole('cardDirection(0)') !== 'ar-de') return 'der Würfel 0,1 ergab nicht ar-de — der Fall misst nichts';
    return ar.sichtbar() ? 'auf Arabisch gefragt, und trotzdem ein Feld' : true;
  });

  fall('T4 Unverändert: erst ab Box 4, und nur mit dem Schalter in den Einstellungen', () => {
    const box3 = baue(lernen, { einstellungen: Object.assign({ direction: 'de-ar' }, AN), fortschritt: { k: { box: 3 } }, karten: [karte('k', KITAB_VOLL)] });
    box3.zeige(0);
    if (box3.sichtbar()) return 'Box 3 bekommt ein Feld';
    const aus = baue(lernen, { einstellungen: { direction: 'de-ar', tippenAbBox4: false }, fortschritt: { k: { box: 6 } }, karten: [karte('k', KITAB_VOLL)] });
    aus.zeige(0);
    return aus.sichtbar() ? 'ohne den Schalter steht ein Feld da' : true;
  });

  fall('T5 Ein Feld, das bei der vorigen Karte offen war, verschwindet bei einer Karte, die auf Arabisch fragt', () => {
    const u = baue(lernen, { einstellungen: Object.assign({ direction: 'box' }, AN), fortschritt: { a: { box: 4 }, b: { box: 4 } },
      karten: [karte('a', KITAB_VOLL), karte('b', KUTUB_VOLL)], dirs: ['de-ar', 'ar-de'] });
    u.zeige(0);
    if (!u.sichtbar()) return 'erste Karte (auf Deutsch gefragt): kein Feld';
    u.zeige(1);
    return u.sichtbar() ? 'zweite Karte (auf Arabisch gefragt): das Feld der ersten steht noch da' : true;
  });

  const tipp = () => baue(lernen, { einstellungen: Object.assign({ direction: 'de-ar' }, AN), fortschritt: { k: { box: 4 }, p: { box: 4 }, h: { box: 4 } },
    karten: [karte('k', KITAB_VOLL), karte('p', KUTUB_VOLL, KITAB_VOLL), karte('h', ACH_VOLL)] });

  fall('T6 Das arabische Wort ohne Vokalzeichen getippt gilt, mit Vokalzeichen auch — ein anderes Wort nicht', () => {
    const u = tipp();
    const nackt = u.tippe(0, KITAB_NACKT), voll = u.tippe(0, KITAB_VOLL), anders = u.tippe(0, QALAM_NACKT);
    if (nackt.klasse !== 'tipp-antwort richtig') return 'ohne Vokalzeichen: ' + JSON.stringify(nackt);
    if (voll.klasse !== 'tipp-antwort richtig') return 'mit Vokalzeichen: ' + JSON.stringify(voll);
    return (anders.klasse === 'tipp-antwort falsch' && anders.text === 'Noch nicht.') ? true : 'ein anderes Wort: ' + JSON.stringify(anders);
  });

  fall('T7 Die Schreibung zählt (sein „richtig zu schreiben"): ein Alif ohne Hamza ist nicht das Wort mit Hamza', () => {
    const u = tipp();
    const mit = u.tippe(2, ACH_HAMZA), ohne = u.tippe(2, ACH_OHNE);
    if (mit.klasse !== 'tipp-antwort richtig') return 'mit Hamza: ' + JSON.stringify(mit);
    return ohne.klasse === 'tipp-antwort falsch' ? true : 'ohne Hamza gilt als richtig: ' + JSON.stringify(ohne);
  });

  fall('T8 Wie bisher: trägt die Karte zusätzlich das Feld sg, gilt auch dessen Schreibung; eine leere Eingabe bekommt kein Urteil', () => {
    const u = tipp();
    const sg = u.tippe(1, KITAB_NACKT), leer = u.tippe(1, '   ');
    if (sg.klasse !== 'tipp-antwort richtig') return 'Feld sg: ' + JSON.stringify(sg);
    return (leer.klasse === 'tipp-antwort' && leer.text === '') ? true : 'leere Eingabe: ' + JSON.stringify(leer);
  });

  fall('T9 Die Beschriftungen versprechen nichts anderes: kein „beide Richtungen" und kein „arabisch oder deutsch" mehr, das Feld heißt „Wort auf Arabisch eintippen", und der deutsche Vergleich ist aus dem Code', () => {
    const ohneKomm = q => q.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');
    const e = ohneKomm(einst), h = ohneKomm(html), l = ohneKomm(lernen);
    const meldung = (e.match(/if \(SETTINGS\.tippenAbBox4\) toast\('([^']*)'\);/) || [])[1];
    if (!meldung) return 'die Meldung beim Einschalten wurde nicht gefunden';
    if (/beide Richtungen/i.test(meldung)) return 'die Meldung beim Einschalten sagt noch „beide Richtungen": ' + meldung;
    if (!/auf Deutsch/.test(meldung)) return 'die Meldung beim Einschalten nennt die Richtung nicht: ' + meldung;
    if (/arabisch oder deutsch, je nach Richtung/.test(h)) return 'die Beschreibung in den Einstellungen sagt noch „arabisch oder deutsch"';
    if (!/id="cardTippEingabe"[^>]*lang="ar"[^>]*dir="rtl"[^>]*placeholder="Wort auf Arabisch eintippen/.test(h)) return 'das Feld im HTML ist nicht arabisch/rtl mit dem neuen Platzhalter';
    if (/tippVariantenDe|tippPutz/.test(l)) return 'der Vergleich der deutschen Eingabe steht noch im Code';
    return true;
  });

  return erg;
}

let rot = 0;
const erg = laufe(LERNEN, EINST, HTML);
console.log('=== Eintippen auf der Karteikarte: nur noch Deutsch → Arabisch ===');
for (const [name, e] of erg){ if (!e.ok) rot++; console.log((e.ok ? '  ok   ' : '  FEHL ') + name + (e.zusatz ? '  -> ' + e.zusatz : '')); }

function ersetze(quelle, alt, neu, wo){
  const n = quelle.split(alt).length - 1;
  if (n !== 1) throw new Error('Störtest „' + wo + '": die Stelle kommt ' + n + '-mal vor (erwartet 1) — Quelltext hat sich geändert');
  return quelle.replace(alt, () => neu);
}
const STOER = [
  { name: 'S1 das Feld wieder in beiden Richtungen (so war es vom 07.09. bis v656)', muss: ['T2', 'T3', 'T5'],
    lernen: q => ersetze(q, " && p.box >= 4 && cardDirection(SESSION.idx) === 'de-ar';", ' && p.box >= 4;', 'S1') },
  { name: 'S2 ohne die Schwelle Box 4', muss: ['T4'],
    lernen: q => ersetze(q, "SETTINGS.tippenAbBox4 && p && p.box >= 4 && cardDirection", "SETTINGS.tippenAbBox4 && p && p.box >= 1 && cardDirection", 'S2') },
  { name: 'S3 ohne den Schalter in den Einstellungen', muss: ['T4'],
    lernen: q => ersetze(q, '  const dran = SETTINGS.tippenAbBox4 && p && ', '  const dran = p && ', 'S3') },
  { name: 'S4 jede Eingabe gilt als richtig', muss: ['T6', 'T7'],
    lernen: q => ersetze(q, '  const richtig = roh(eingabe) === roh(w.ar) || (!!w.sg && roh(eingabe) === roh(w.sg));', '  const richtig = true;', 'S4') },
  { name: 'S5 die Meldung beim Einschalten verspricht wieder beide Richtungen', muss: ['T9'],
    einst: q => ersetze(q, "toast('Ab Box 4: Fragt die Karte auf Deutsch, schreibst du das arabische Wort.", "toast('Ab Box 4 wird eingetippt — in beide Richtungen.", 'S5') }
];
console.log('\n=== Störtests: ohne die Regel MUSS der zuständige Fall scheitern ===');
for (const s of STOER){
  let e;
  try { e = laufe(s.lernen ? s.lernen(LERNEN) : LERNEN, s.einst ? s.einst(EINST) : EINST, HTML); }
  catch (err){ rot++; console.log('  FEHL ' + s.name + '  -> ' + err.message); continue; }
  const gescheitert = [...e].filter(([, v]) => !v.ok).map(([n]) => n.split(' ')[0]);
  const fehlt = s.muss.filter(k => !gescheitert.includes(k));
  if (fehlt.length){ rot++; console.log('  FEHL ' + s.name + '  -> ' + fehlt.join(', ') + ' blieb grün (gescheitert: ' + (gescheitert.join(', ') || 'nichts') + ')'); }
  else console.log('  ok   ' + s.name + '  -> scheitert wie verlangt: ' + gescheitert.join(', '));
}
console.log('\n' + (rot ? rot + ' Befund(e).' : 'Alles grün: ' + erg.size + ' Fälle, ' + STOER.length + ' Störtests.'));
process.exit(rot ? 1 : 0);
