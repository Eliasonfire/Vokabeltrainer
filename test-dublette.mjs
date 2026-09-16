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
      /* ⛔ Sein Fall vom 08.09.2026 (gefunden am 16.09.): أَنْتِ wurde gegen
         „du (m.)" getauscht, weil die letzte Ḥaraka nicht zählte. */
      { id: 'gram-pron-anti', ar: 'أَنْتِ', de: 'du (weiblich)', chapter: 'personal', type: 'particle' },
      { id: 'gram-pron-anta', ar: 'أَنْتَ', de: 'du (männlich)', chapter: 'personal', type: 'particle' },
      { id: '50156', ar: 'أَنْتَ', de: 'du (m.)', chapter: 24, book: 'madina-1', type: 'particle' },
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

  /* ⛔⛔ Die letzte Ḥaraka zählt bei Partikeln (16.09.2026). */
  const anti = welt.VOCAB_DATA.find(w => w.id === 'gram-pron-anti');
  sag(!api.dubletteImBuch(anti), '⛔ أَنْتِ „du (weiblich)" gilt NICHT als Dublette zu أَنْتَ „du (m.)"');
  const anta = welt.VOCAB_DATA.find(w => w.id === 'gram-pron-anta');
  sag(api.dubletteImBuch(anta) && api.dubletteImBuch(anta).id === '50156',
      'أَنْتَ „du (männlich)" findet weiterhin seine Buchvokabel');
  sag(api.dubGleich('بَيْتٌ', 'بَيْتُ') === true, 'bei Nomen zählt die Kasusendung weiterhin nicht (بَيْتٌ = بَيْتُ)');
}

console.log('\n=== ⛔ Die Reparatur für أَنْتِ greift beim ERSTEN Start ===\n');
{
  /* Die Fachbegriffe werden in js/kern.js früh eingehängt. Stünde die
     Reparatur dahinter, käme أَنْتِ erst beim zweiten Start zurück. */
  const rep = KERN.indexOf("id: 'gram-pron-anti'");
  const einhaengen = KERN.indexOf('VOCAB_DATA.push(...FACHBEGRIFF_VOKABELN');
  sag(rep > 0 && einhaengen > 0 && rep < einhaengen, 'die Reparatur steht VOR dem Einhängen der Fachbegriffe');
  sag(/ausgeblendetVor:\s*Date\.parse\('2026-09-16/.test(KERN), 'sie holt nur zurück, was VOR der Behebung ausgeblendet wurde');
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

/* ---------- Doppelt in zwei Büchern (16.09.2026) ----------
   Gefragt: „أَخٌ (Bruder) und أُخْتٌ (Schwester) stehen in beiden Büchern und kommen
   deshalb doppelt. Soll ich die aus Bayna Yadayk ausblenden?" — Elias: „ja".
   einhaengen() aus js/buecher.js wird AUSGEFÜHRT: die zwei Bayna-Yadayk-Einträge
   dürfen nicht in VOCAB_DATA landen, ein drittes Wort desselben Buchs schon. */
console.log('\nDoppelt in zwei Büchern — أَخٌ/أُخْتٌ aus Bayna Yadayk bleiben draußen:');
{
  const vmMod = await import('node:vm');
  const BUECHER_JS = fs.readFileSync(path.join(HIER, 'js', 'buecher.js'), 'utf8');
  const schneideBuecher = (name) => {
    const auf = BUECHER_JS.indexOf('function ' + name + '(');
    if (auf < 0) return null;
    let i = BUECHER_JS.indexOf('{', auf), tiefe = 0;
    for (; i < BUECHER_JS.length; i++){
      if (BUECHER_JS[i] === '{') tiefe++;
      else if (BUECHER_JS[i] === '}'){ tiefe--; if (!tiefe) return BUECHER_JS.slice(auf, i + 1); }
    }
    return null;
  };
  const menge = (BUECHER_JS.match(/const BUCHDUBLETTEN_AUSBLENDEN = new Set\(\[[\s\S]*?\]\);/) || [])[0];
  const einh = schneideBuecher('einhaengen');
  sag(!!menge && !!einh, 'BUCHDUBLETTEN_AUSBLENDEN und einhaengen() stehen in js/buecher.js');
  if (menge && einh){
    const lauf = (code) => {
      const welt = { VOCAB_DATA: [], KEINE_WURZEL_UEBERNEHMEN: new Set(), Map, Set, String, Object,
        istSchlechtereSchreibung: () => false, eselsbrueckenNachtragen: () => 0,
        eselsbrueckenErsetzen: () => {}, schreibweisenErsetzen: () => {}, saetzeNachtragen: () => 0 };
      vmMod.createContext(welt);
      vmMod.runInContext(menge + '\n' + code + '\n;globalThis.__e = einhaengen;', welt);
      welt.__e([
        { id: '45984', ar: 'أَخٌ', de: 'Bruder', chapter: 1, book: 'bayna-yadayk-1' },
        { id: '45986', ar: 'أُخْتٌ', de: 'Schwester', chapter: 1, book: 'bayna-yadayk-1' },
        { id: '45991', ar: 'جِنْسِيَّةٌ', de: 'Nationalität', chapter: 1, book: 'bayna-yadayk-1' }
      ]);
      return welt.VOCAB_DATA.map(w => w.id);
    };
    const ids = lauf(einh);
    sag(!ids.includes('45984') && !ids.includes('45986'), 'أَخٌ und أُخْتٌ aus Bayna Yadayk kommen nicht in VOCAB_DATA  (' + ids.join(', ') + ')');
    sag(ids.includes('45991'), '… جِنْسِيَّةٌ aus demselben Buch schon');
    /* ⛔ Gegenprobe: ohne die Zeile wären beide wieder da. */
    const ohne = einh.replace("if (BUCHDUBLETTEN_AUSBLENDEN.has(String(roh.id))) return;", '');
    const ids2 = ohne !== einh ? lauf(ohne) : [];
    sag(ohne !== einh && ids2.includes('45984') && ids2.includes('45986'), 'Gegenprobe: ohne die Sperre stünden beide doppelt da');
    const vorrat = fs.readFileSync(path.join(HIER, 'werkzeuge', 'vorrat.mjs'), 'utf8');
    sag(vorrat.includes('BUCHDUBLETTEN_AUSBLENDEN'), 'werkzeuge/vorrat.mjs liest dieselbe Liste (keine Eselsbrücken für ausgeblendete Karten)');
  }
}

/* ---------- Die Dubletten-Prüfung kennt seine Antwort (16.09.2026, Wartungslauf) ----------
   pruefe-duplikate.js meldete أَخٌ/أُخْتٌ nach v512 weiter als Befund — die Seite
   „Was auf dich wartet" hätte ihn ein zweites Mal gefragt. Und die Liste kann
   veralten: eine Kennung ohne Zwilling blendet ein Wort aus, das er dann gar
   nicht mehr hat. Das Werkzeug wird AUSGEFÜHRT, einmal echt und dreimal gestört
   (Quelltext über stdin, damit nichts im Ordner liegen bleibt). */
console.log('\nDubletten-Prüfung — entschieden ist kein Befund, eine verwaiste Ausblendung schon:');
{
  const { spawnSync } = await import('node:child_process');
  const QUELLE = fs.readFileSync(path.join(HIER, 'pruefe-duplikate.js'), 'utf8');
  const lauf = (quelle) => {
    const r = spawnSync(process.execPath, ['-'], { cwd: HIER, input: quelle, encoding: 'utf8', maxBuffer: 20e6 });
    const text = (r.stdout || '') + (r.stderr || '');
    const ab = text.indexOf('Befund(e) ===');
    return { code: r.status, text, befunde: ab < 0 ? '' : text.slice(ab) };
  };
  const echt = lauf(QUELLE);
  sag(echt.text.includes('im zweiten ausgeblendet (kein Befund): 2'), 'echter Lauf: أَخٌ und أُخْتٌ stehen unter „ausgeblendet (kein Befund)"');
  sag(!echt.befunde.includes('madina1-l6-ach') && !echt.befunde.includes('madina1-l6-ucht'), '… und nicht mehr unter den Befunden');
  sag(!echt.text.includes('Ausblendung(en) veraltet'), '… keine veraltete Ausblendung');

  const MARKE = '/* Wie die App: was ausgeblendet ist';
  const ohneListe = QUELLE.replace('const BUCHDUBLETTEN_AUSBLENDEN = new Set', 'const GIBT_ES_NICHT = new Set');
  const g1 = ohneListe !== QUELLE ? lauf(ohneListe) : { befunde: '', text: '' };
  sag(ohneListe !== QUELLE && g1.befunde.includes('madina1-l6-ach') && g1.befunde.includes('madina1-l6-ucht'),
      'Gegenprobe: liest sie die Liste nicht, sind beide wieder Befund');

  const verwaist = QUELLE.replace(MARKE, "AUSGEBLENDET.add('gibt-es-nicht');\n" + MARKE);
  const g2 = verwaist !== QUELLE ? lauf(verwaist) : { code: 0, text: '' };
  sag(verwaist !== QUELLE && g2.code === 2 && g2.text.includes('id gibt-es-nicht') && g2.text.includes('verwaist'),
      'Störtest: eine Kennung, die kein Buch mehr hat → „verwaist", Exit 2');

  const ohneZwilling = QUELLE.replace(MARKE, "AUSGEBLENDET.add('45991');\n" + MARKE);
  const g3 = ohneZwilling !== QUELLE ? lauf(ohneZwilling) : { code: 0, text: '' };
  sag(ohneZwilling !== QUELLE && g3.code === 2 && g3.text.includes('id 45991') && g3.text.includes('fehlt es ihm ganz'),
      'Störtest: جِنْسِيَّةٌ (45991) ausgeblendet, obwohl er es sonst nirgends hat → Befund, Exit 2');
}

console.log('');
console.log(fehler ? '⛔ ' + fehler + ' Fehler' : '✅ alle Fälle richtig');
process.exit(fehler ? 1 : 0);
