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
  /* Seit v574 (23.09.2026) merkt sich tauscheDublette() jeden Tausch dieses
     Starts — offeneRundeFortsetzen() setzt eine Runde damit fort. */
  KERN.match(/const GETAUSCHT = new Map\(\);/)[0],
  schneide('dubForm'), schneide('dubOhneArtikel'), schneide('dubGleich'), schneide('dubBedeutungGleich'),
  schneide('dubletteImBuch'), schneide('hatFortschritt'), schneide('uebertrageFortschritt'),
  schneide('merkeUebertragen'), schneide('tauscheDublette'), schneide('holeFortschrittNach'),
  schneide('blendeKapitelDublettenAus'),
].join('\n');

/* ---------- Eine kleine App darum herum ---------- */
function baueWelt(code = quelle){
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
    GELOESCHT: {},
    /* Die drei Quellen seiner eigenen Karten — eine gelöschte steht dort weiter. */
    window: { EIGENE_VOKABELN: [] },
    FACHBEGRIFF_VOKABELN: [],
    PERSONAL_VOCAB: [],
    ERREICHBAR: new Set(),
  };
  welt.LS = { set: (k) => welt.gespeichert.push(k) };
  welt.saveProgress  = () => welt.gespeichert.push('vt_progress');
  welt.saveNotes     = () => welt.gespeichert.push('vt_notes');
  welt.saveNotizen   = () => welt.gespeichert.push('vt_notizen');
  welt.setzeEinzelnFrei = (id, an) => { welt.EINZELN[id] = { an: !!an, zeit: 9 }; };
  welt.istGeloescht  = (id) => !!(welt.GELOESCHT[id] && welt.GELOESCHT[id].an);
  welt.istBekannt    = (w) => !!w && (w.chapter === 'personal' || welt.ERREICHBAR.has(String(w.id)) || !!(welt.EINZELN[w.id] && welt.EINZELN[w.id].an));
  welt.istPluralKarte = (id) => String(id).endsWith('#pl');
  welt.loeschePersonalVocab = (id) => {
    const i = welt.VOCAB_DATA.findIndex(w => w.id === id);
    if (i < 0) return false;
    welt.VOCAB_DATA.splice(i, 1);
    welt.GELOESCHT[id] = { an: true, zeit: 1 };
    delete welt.PROGRESS[id]; delete welt.NOTES[id];
    delete welt.NOTIZEN[id];  delete welt.BEKANNT[id];
    return true;
  };
  const namen = Object.keys(welt);
  const fn = new Function(...namen, code + '\nreturn { tauscheDublette, dubletteImBuch, dubGleich, dubOhneArtikel, dubBedeutungGleich, hatFortschritt, holeFortschrittNach, blendeKapitelDublettenAus };');
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
  sag(welt.PROGRESS['p_1'] && welt.PROGRESS['p_1'].correct === 0 && welt.PROGRESS['p_1'].uebertragen === '46368',
      '… ihr Stand ist geleert, nur der Vermerk bleibt (seit 16.09.2026, siehe merkeUebertragen)');
}

/* ⛔⛔ Die Grundregel (16.09.2026): „wenn zwei identisch sind und eines davon aber
   fortschritt hat dann sollte man immer das behalten was fortschritt hat" — und für
   eigene Wörter: „das was im kapitel ist bevorzugen und auf den gleichen stand
   bringen mit den daten wie zb welche box sie drin sit". */
const pruefeGrundregel = (code, still) => {
  let rot = 0;
  const pruef = (ok, t) => { if (!ok) rot++; if (!still) sag(ok, t); };
  const tausch = (vorbereiten) => {
    const { welt, api } = baueWelt(code);
    vorbereiten(welt);
    const r = api.tauscheDublette(welt.VOCAB_DATA.find(w => w.id === 'p_1'));
    return { welt, api, r };
  };

  if (!still) console.log('\n=== ⛔⛔ Sein Fall: der LEERE Eintrag am Ziel ist kein Fortschritt ===\n');
  {
    /* Jede Buchkarte hat beim Start einen Eintrag (ergaenzeProgress). So stand
       لَحْمٌ am 16.09.2026 um 21:57:54 nach dem Tausch in Box 1 statt Box 4. */
    const { welt, r } = tausch(w => { w.PROGRESS['46368'] = { box: 1, nextReview: '2026-08-29', correct: 0, wrong: 0 }; });
    pruef(welt.PROGRESS['46368'].box === 4 && welt.PROGRESS['46368'].correct === 7,
        'ein Eintrag „Box 1, nie beantwortet" am Ziel bekommt den Stand der eigenen Karte (Box 4, 7 richtig)');
    pruef(r && r.mitgenommen.includes('Fortschritt'), '… und der Tausch meldet es');
  }
  {
    /* أَلْمُهَنْدِسٌ: Box 1, aber viermal falsch — auch das ist Fortschritt. */
    const { welt } = tausch(w => {
      w.PROGRESS['p_1'] = { box: 1, correct: 0, wrong: 4, ts: 5 };
      w.PROGRESS['46368'] = { box: 1, correct: 0, wrong: 0 };
    });
    pruef(welt.PROGRESS['46368'].wrong === 4 && welt.PROGRESS['46368'].ts === 5,
        'Box 1 mit 4 falschen Antworten zählt als Fortschritt und wandert mit — samt Stempel der letzten Antwort');
  }

  if (!still) console.log('\n=== Beide mit Fortschritt: die höhere Box gewinnt ===\n');
  {
    const { welt, r } = tausch(w => { w.PROGRESS['46368'] = { box: 2, correct: 3, wrong: 4, ts: 7 }; w.NOTES['46368'] = 'schon vorhanden'; });
    pruef(welt.PROGRESS['46368'].box === 4 && welt.PROGRESS['46368'].correct === 7,
        'eigene Box 4 gegen Kapitelkarte Box 2 → die Kapitelkarte bekommt Box 4');
    pruef(welt.PROGRESS['46368'].ts > 7, '… mit neuem Stempel, sonst holte der Abgleich Box 2 zurück');
    pruef(welt.PROGRESS['46368'].correct !== 10, '… und nichts wird zusammengezählt (7 + 3)');
    pruef(r && r.mitgenommen.includes('Fortschritt (höhere Box)'), '… und der Tausch nennt es');
    pruef(welt.NOTES['46368'] === 'schon vorhanden', 'eine vorhandene Eselsbrücke am Ziel bleibt unangetastet');
    pruef(!welt.VOCAB_DATA.some(w => w.id === 'p_1'), 'die eigene Karte ist trotzdem weg — die Kapitelkarte wird bevorzugt');
  }
  {
    const { welt } = tausch(w => { w.PROGRESS['46368'] = { box: 5, correct: 9, wrong: 0, ts: 7 }; });
    pruef(welt.PROGRESS['46368'].box === 5 && welt.PROGRESS['46368'].correct === 9 && welt.PROGRESS['46368'].ts === 7,
        'Kapitelkarte Box 5 gegen eigene Box 4 → die Kapitelkarte bleibt, wie sie ist');
  }
  {
    const { welt } = tausch(w => { w.PROGRESS['p_1'] = { box: 1, correct: 0, wrong: 0 }; w.PROGRESS['46368'] = { box: 3, correct: 2, wrong: 0 }; });
    pruef(welt.PROGRESS['46368'].box === 3, 'eine eigene Karte ohne Fortschritt ändert am Ziel nichts');
  }

  if (!still) console.log('\n=== Der Vermerk an der weggenommenen Karte ===\n');
  {
    const { welt } = tausch(w => { w.PROGRESS['46368'] = { box: 1, correct: 0, wrong: 0 }; });
    const v = welt.PROGRESS['p_1'];
    pruef(v && v.uebertragen === '46368' && v.correct === 0 && v.wrong === 0 && v.box === 1 && v.ts > 0,
        'die eigene Karte hinterlässt einen LEEREN Eintrag mit Vermerk und neuem Stempel (nichts doppelt in der Statistik)');
  }

  if (!still) console.log('\n=== ⛔⛔ Nachholen: getauscht, aber der Stand blieb zurück ===\n');
  const nachholWelt = (vorbereiten) => {
    const { welt, api } = baueWelt(code);
    /* لَحْمٌ: eigene Karte aus vokabeln-eigene.js, gelöscht, Stand noch im Abgleich. */
    welt.VOCAB_DATA.splice(welt.VOCAB_DATA.findIndex(w => w.id === 'p_3'), 1);
    welt.window.EIGENE_VOKABELN.push({ id: '59e30a8a', ar: 'لَحْمٌ', de: 'Fleisch', chapter: 'personal' });
    welt.VOCAB_DATA.push({ id: '46039', ar: 'لَحْمٌ', de: 'Fleisch', chapter: 5, book: 'bayna-yadayk-1' });
    welt.GELOESCHT['59e30a8a'] = { an: true, zeit: 1 };
    welt.PROGRESS['59e30a8a'] = { box: 4, nextReview: '2026-09-22', correct: 4, wrong: 1, ts: 11 };
    welt.PROGRESS['46039'] = { box: 1, nextReview: '2026-08-29', correct: 0, wrong: 0 };
    if (vorbereiten) vorbereiten(welt);
    return { welt, api };
  };
  {
    const { welt, api } = nachholWelt();
    const n = api.holeFortschrittNach();
    pruef(n.length === 1 && welt.PROGRESS['46039'].box === 4 && welt.PROGRESS['46039'].correct === 4 && welt.PROGRESS['46039'].ts === 11,
        'لَحْمٌ: der zurückgebliebene Stand (Box 4, 4 richtig) kommt in die leere Kapitelkarte');
    pruef(welt.PROGRESS['59e30a8a'].uebertragen === '46039', '… und die gelöschte Karte bekommt den Vermerk');
    pruef(api.holeFortschrittNach().length === 0, 'ein zweiter Start holt nichts mehr nach');
    /* Er legt die Kapitelkarte von Hand zurück nach Box 1 — der alte Stand darf nicht wiederkommen. */
    welt.PROGRESS['46039'] = { box: 1, nextReview: '2026-09-17', correct: 0, wrong: 0, ts: 99 };
    api.holeFortschrittNach();
    pruef(welt.PROGRESS['46039'].box === 1, '⛔ auch nicht, nachdem er die Kapitelkarte von Hand nach Box 1 gelegt hat');
  }
  {
    const { welt, api } = nachholWelt(w => { w.PROGRESS['46039'] = { box: 2, correct: 1, wrong: 0, ts: 20 }; });
    api.holeFortschrittNach();
    pruef(welt.PROGRESS['46039'].box === 2 && welt.PROGRESS['46039'].ts === 20,
        '⛔ hat er die Kapitelkarte seither beantwortet, bleibt SEIN neuer Stand — ein alter überschreibt ihn nie');
  }
  {
    const { welt, api } = nachholWelt(w => { delete w.GELOESCHT['59e30a8a']; });
    api.holeFortschrittNach();
    pruef(welt.PROGRESS['46039'].box === 1, 'eine NICHT gelöschte eigene Karte fasst das Nachholen nicht an (das macht der Tausch)');
  }
  {
    const { welt, api } = nachholWelt(w => {
      w.GELOESCHT['p_9'] = { an: true, zeit: 1 };
      w.PERSONAL_VOCAB.push({ id: 'p_9', ar: 'كَسْلَانُ', de: 'Faul', chapter: 'personal' });
      w.PROGRESS['p_9'] = { box: 1, correct: 0, wrong: 1, ts: 3 };
      w.VOCAB_DATA.push({ id: '46054', ar: 'كَسْلَانُ', de: 'faul', chapter: 6, book: 'bayna-yadayk-1' });
      w.PROGRESS['46054'] = { box: 1, correct: 0, wrong: 0 };
    });
    api.holeFortschrittNach();
    pruef(welt.PROGRESS['46054'].wrong === 1, 'كَسْلَانُ aus vt_personalVocab (gelöscht, einmal falsch) wird ebenso nachgeholt');
  }

  if (!still) console.log('\n=== Der Artikel gehört nicht zum Wort ===\n');
  {
    const { welt, api } = baueWelt(code);
    welt.VOCAB_DATA.push({ id: '45992', ar: 'مُهَنْدِسٌ', de: 'Ingenieur', chapter: 1, book: 'bayna-yadayk-1', type: 'noun' });
    welt.VOCAB_DATA.push({ id: '45887', ar: 'يَوْمٌ', de: 'Tag', chapter: 9, book: 'madina-1', type: 'noun' });
    welt.VOCAB_DATA.push({ id: 'x-schams', ar: 'شَمْسٌ', de: 'Sonne', chapter: 3, book: 'madina-1', type: 'noun' });
    const findet = (ar, de, type) => api.dubletteImBuch({ id: 'p_x', ar, de, type, chapter: 'personal' });
    const m = findet('أَلْمُهَنْدِسٌ', 'Ingenieur', 'noun');
    pruef(m && m.id === '45992', 'أَلْمُهَنْدِسٌ „Ingenieur" (seine Karte) findet مُهَنْدِسٌ aus Bayna Yadayk 1');
    pruef(!!findet('الْمُهَنْدِسُ', 'Ingenieur', 'noun'), '… ebenso mit اَلْ ohne Hamza');
    pruef(!findet('الْيَوْمُ', 'heute', 'noun'), '⛔ الْيَوْمُ „heute" ist NICHT يَوْمٌ „Tag" — die Bedeutung entscheidet');
    pruef(!!findet('الشَّمْسُ', 'Sonne', 'noun'), 'Sonnenbuchstabe: الشَّمْسُ findet شَمْسٌ (die Schadda gehört zum Artikel)');
    welt.VOCAB_DATA.push({ id: 'x-aan', ar: 'آنَ', de: 'jetzt', chapter: 4, book: 'madina-1', type: 'particle' });
    welt.VOCAB_DATA.push({ id: 'x-taqa', ar: 'تَقَى', de: 'treffen', chapter: 4, book: 'madina-1', type: 'verb' });
    pruef(!findet('الْآنَ', 'jetzt', 'particle'), 'Partikeln behalten ihren Artikel: الْآنَ findet kein آنَ');
    pruef(!findet('اِلْتَقَى', 'treffen', 'verb'), 'Verben ebenso: اِلْتَقَى (Stamm VIII) findet kein تَقَى');
    pruef(api.dubOhneArtikel('اِلْتَقَى') === 'تَقَى'.normalize('NFC'), '… obwohl die Form allein wie ein Artikel aussähe (deshalb entscheidet die Wortart)');
    pruef(api.dubOhneArtikel('أَلْفٌ') === 'أَلْفٌ'.normalize('NFC'), 'أَلْفٌ „tausend": übrig bliebe ein Buchstabe → kein Artikel');
    pruef(api.dubOhneArtikel('أَلَمٌ') === 'أَلَمٌ'.normalize('NFC'), 'أَلَمٌ „Schmerz": Lam mit Fatha → kein Artikel');
    pruef(api.dubOhneArtikel('المهندس') === 'المهندس', 'unvokalisiertes ال bleibt stehen (nicht zu entscheiden)');
  }

  if (!still) console.log('\n=== ⛔ Eine Bedeutung, die mit einer Klammer beginnt ===\n');
  {
    const { api } = baueWelt(code);
    pruef(api.dubBedeutungGleich({ de: '(von) nach / danach' }, { de: 'nach' }) === true, '„(von) nach / danach" trägt „nach"');
    pruef(api.dubBedeutungGleich({ de: '(von) nach / danach' }, { de: 'Ferne' }) === false, '… aber nicht „Ferne"');
    pruef(api.dubBedeutungGleich({ de: '(gr)' }, { de: 'Ferne' }) === false,
        '⛔ ein LEERER Kopf passt auf nichts — bis v517 steckte er in jedem Text, die Prüfung sagte immer ja');
    pruef(api.dubBedeutungGleich({ de: '(gr) Genitiv' }, { de: 'Genitiv (Fall)' }) === true,
        'der Kopf wird ohne Klammer gelesen: „(gr) Genitiv" trägt „Genitiv (Fall)"');
  }

  if (!still) console.log('\n=== ⛔⛔ Zwei Kapitelkarten: die mit Fortschritt bleibt ===\n');
  const kapitelWelt = (vorbereiten) => {
    const { welt, api } = baueWelt(code);
    welt.VOCAB_DATA.length = 0;
    welt.VOCAB_DATA.push(
      { id: '45751', ar: 'بَيْتٌ', de: '(1) Haus; (2) Vers (Poesie)', chapter: 1, book: 'madina-1', type: 'noun' },
      { id: '50045', ar: 'بَيْت', de: 'Haus / Heim', chapter: 17, book: 'quran', type: 'noun' },
      { id: '46011', ar: 'سَكَنَ', de: 'wohnen / leben', chapter: 3, book: 'bayna-yadayk-1', type: 'verb' },
      { id: '46013', ar: 'سَكَنٌ', de: 'Wohnort / Unterkunft', chapter: 3, book: 'bayna-yadayk-1', type: 'noun' },
      { id: '45751#pl', ar: 'بُيُوتٌ', de: 'Häuser', chapter: 1, book: 'madina-1', type: 'noun' },
      { id: 'p_7', ar: 'بَيْتٌ', de: 'Haus', chapter: 'personal', type: 'noun' }
    );
    welt.PROGRESS['45751'] = { box: 5, correct: 6, wrong: 0 };
    welt.PROGRESS['50045'] = { box: 1, correct: 0, wrong: 0 };
    welt.PROGRESS['46011'] = { box: 3, correct: 2, wrong: 0 };
    welt.PROGRESS['46013'] = { box: 1, correct: 0, wrong: 0 };
    welt.ERREICHBAR.add('45751');
    if (vorbereiten) vorbereiten(welt);
    const bericht = api.blendeKapitelDublettenAus();
    return { welt, bericht, ids: welt.VOCAB_DATA.map(w => w.id) };
  };
  {
    const { ids, bericht } = kapitelWelt();
    pruef(!ids.includes('50045') && ids.includes('45751'), 'بَيْتٌ Madina 1 (Box 5) bleibt, بَيْت aus dem Quran-Buch (nie beantwortet) fällt weg');
    pruef(bericht.length === 1 && bericht[0].bleibt === '45751', '… und nur dieses eine Paar wird gemeldet');
    pruef(ids.includes('46011') && ids.includes('46013'), '⛔ سَكَنَ „wohnen" und سَكَنٌ „Wohnort": gleiche Form, andere Bedeutung → beide bleiben');
    pruef(ids.includes('p_7'), 'eigene Karten fasst diese Regel nicht an (dafür gibt es den Tausch)');
    pruef(ids.includes('45751#pl'), 'Pluralkarten fasst sie nicht an');
  }
  {
    const { ids } = kapitelWelt(w => { w.PROGRESS['50045'] = { box: 2, correct: 1, wrong: 0 }; });
    pruef(ids.includes('45751') && ids.includes('50045'), '⛔ BEIDE mit Fortschritt → beide bleiben (seine Regel sagt dazu nichts)');
  }
  {
    const { ids } = kapitelWelt(w => { w.PROGRESS['45751'] = { box: 1, correct: 0, wrong: 0 }; });
    pruef(ids.includes('45751') && ids.includes('50045'), 'KEINE mit Fortschritt → beide bleiben');
  }
  {
    const { welt, ids } = kapitelWelt(w => {
      w.PROGRESS['45751'] = { box: 1, correct: 0, wrong: 0 };
      w.PROGRESS['50045'] = { box: 3, correct: 2, wrong: 0 };
    });
    pruef(!ids.includes('45751') && ids.includes('50045'), 'andersherum: hat die Quran-Karte den Fortschritt, fällt die Madina-Karte weg');
    pruef(welt.EINZELN['50045'] && welt.EINZELN['50045'].an,
        '⛔ … und weil die weggefallene für ihn erreichbar war, die bleibende nicht, wird die bleibende einzeln freigeschaltet');
  }
  return rot;
};
{
  const rot = pruefeGrundregel(quelle, false);
  if (rot) console.log('  (' + rot + ' der Grundregel-Fälle rot)');
}

console.log('\n=== Störtests zur Grundregel: jede Sicherung muss fehlen dürfen, ohne dass es grün bleibt ===\n');
{
  const stoerungen = [
    ['„Fortschritt" wieder als „es gibt einen Eintrag" (der Fehler bis v517)',
      'return !!p && ((Number(p.box) || 1) > 1 || Number(p.correct) > 0 || Number(p.wrong) > 0);', 'return !!p;'],
    ['die weggenommene Karte behält ihren alten Stand (kein leerer Eintrag)',
      "PROGRESS[String(von)] = { box: 1, nextReview: alt.nextReview || '', correct: 0, wrong: 0, ts: Date.now(), uebertragen: String(nach) };", ';'],
    ['Klammern bleiben im Kopf der Bedeutung',
      ".replace(/\\([^)]*\\)/g, ' ')", ''],
    ['Artikel wird nicht mehr entfernt',
      'const f = v => dubForm(artikelWeg ? dubOhneArtikel(v) : v, endungBehalten);', 'const f = v => dubForm(v, endungBehalten);'],
    ['Kapitelregel blendet auch aus, wenn beide Fortschritt haben',
      '      if (hatFortschritt(w.id)) continue;\n', ''],
    ['höhere Box zählt nicht',
      'if (beideVergleichen && (Number(quelle.box) || 1) > (Number(PROGRESS[String(nach)].box) || 1)){', 'if (false){'],
    ['leerer Kopf der Bedeutung passt wieder auf alles',
      '(kopf.length > 0 && a.includes(kopf))', 'a.includes(kopf)'],
    ['keine Freischaltung der bleibenden Kapitelkarte',
      'setzeEinzelnFrei(String(bleibt.id), true);', ';'],
  ];
  for (const [name, alt, neu] of stoerungen){
    const gestoert = quelle.split(alt).join(neu);
    if (gestoert === quelle){ sag(false, 'Störung „' + name + '" greift nicht — der Suchtext steht nicht (mehr) im Code'); continue; }
    let rot;
    try { rot = pruefeGrundregel(gestoert, true); } catch (e) { rot = 1; }
    sag(rot > 0, 'Störung „' + name + '" → ' + rot + ' Fall/Fälle rot');
  }
}

console.log('\n=== Aufgerufen wird die Kapitelregel beim Start — NACH dem Tausch ===\n');
{
  const BJ = fs.readFileSync(path.join(HIER, 'js', 'buecher.js'), 'utf8');
  const t = BJ.indexOf("if (typeof tauscheDubletten === 'function') tauscheDubletten();");
  const k = BJ.indexOf("if (typeof blendeKapitelDublettenAus === 'function') blendeKapitelDublettenAus();");
  sag(t > 0 && k > t, 'js/buecher.js ruft blendeKapitelDublettenAus() hinter tauscheDubletten() auf');
  sag(/holeFortschrittNach\(\);/.test(schneide('tauscheDubletten')), 'tauscheDubletten() ruft holeFortschrittNach() auf');
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
  /* Mit gesetztem Fortschritt statt data/boxen.json — so hängt der Test nicht an
     seinem Lernstand von heute. */
  const osMod = await import('node:os');
  const tempDateien = [];
  const mitBoxen = (quelle, inhalt) => {
    if (inhalt === null) return quelle.replace("path.join(REPO, 'data', 'boxen.json')", JSON.stringify(path.join(osMod.tmpdir(), 'gibt-es-nicht-boxen.json')));
    const datei = path.join(osMod.tmpdir(), 'test-dublette-boxen-' + process.pid + '-' + tempDateien.length + '.json');
    fs.writeFileSync(datei, JSON.stringify(inhalt));
    tempDateien.push(datei);
    return quelle.replace("path.join(REPO, 'data', 'boxen.json')", JSON.stringify(datei));
  };
  const entschiedenTeil = (r) => r.text.slice(r.text.indexOf('entscheidet die App nach seiner Grundregel'), Math.max(0, r.text.indexOf('Befund(e) ===')) || undefined);
  const g1 = ohneListe !== QUELLE ? lauf(mitBoxen(ohneListe, { boxen: { 'madina1-l6-ach': 4, '45984': 1, 'madina1-l6-ucht': 4, '45986': 1 }, angefangen: [] })) : { befunde: '', text: '' };
  sag(ohneListe !== QUELLE && !g1.text.includes('im zweiten ausgeblendet')
      && entschiedenTeil(g1).includes('Buchvokabel id madina1-l6-ach') && entschiedenTeil(g1).includes('Buchvokabel id madina1-l6-ucht')
      && !g1.befunde.includes('madina1-l6-ach'),
      'Gegenprobe: liest sie die Liste nicht, entscheidet die Grundregel beide (Madina hat Box 4) — und keins steht mehr unter „ausgeblendet"');

  /* ⛔⛔ Die Grundregel in der Prüfung (16.09.2026): nur was die Regel NICHT
     entscheidet, wird ihm vorgelegt. */
  const beide = lauf(mitBoxen(ohneListe, { boxen: { 'madina1-l6-ach': 4, '45984': 2, 'madina1-l6-ucht': 4, '45986': 1 }, angefangen: [] }));
  sag(beide.code === 2 && beide.befunde.includes('madina1-l6-ach') && !beide.befunde.includes('madina1-l6-ucht'),
      'BEIDE Karten mit Fortschritt (أَخٌ) → Befund, die Frage geht an ihn; أُخْتٌ (nur Madina) nicht');
  const angefangenFall = lauf(mitBoxen(ohneListe, { boxen: { 'madina1-l6-ach': 1, '45984': 1, 'madina1-l6-ucht': 1, '45986': 1 }, angefangen: ['madina1-l6-ach'] }));
  sag(angefangenFall.text.includes('die Karte mit Fortschritt bleibt (madina-1 K6 id madina1-l6-ach)'),
      'Box 1 mit Antworten (`angefangen`) zählt als Fortschritt — sonst wäre das „noch keine"');
  sag(angefangenFall.text.includes('noch keine mit Fortschritt'), '… und أُخْتٌ ohne jede Antwort auf beiden Seiten: „noch keine mit Fortschritt", kein Befund');
  const ohneBoxen = lauf(mitBoxen(ohneListe, null));
  sag(ohneBoxen.code === 2 && ohneBoxen.befunde.includes('madina1-l6-ach') && ohneBoxen.befunde.includes('madina1-l6-ucht') && ohneBoxen.text.includes('boxen.json fehlt'),
      'ohne data/boxen.json ist Fortschritt nicht messbar → beide bleiben Befund (lieber fragen als raten)');
  sag(echt.text.includes('أَلْمُهَنْدِسٌ') && echt.text.includes('entscheidet die App nach seiner Grundregel'),
      'echter Lauf: أَلْمُهَنْدِسٌ (mit Artikel) wird gefunden und steht unter „entscheidet die App"');
  sag(!echt.text.includes('id 48402'), '⛔ echter Lauf: الْيَوْمُ „heute" steht NICHT als Doppelung zu يَوْمٌ „Tag" da');
  const ohneBedeutung = lauf(QUELLE.replace('return APP.dubGleich(w.ar, eigen.ar, endung, artikel) && APP.dubBedeutungGleich(eigen, w);', 'return false;'));
  sag(ohneBedeutung.befunde.includes('p_1787185012359'),
      'Störtest: erkennt die Prüfung die Bedeutung der App nicht, steht سَيِّدٌ wieder als Frage da');
  for (const d of tempDateien) { try { fs.unlinkSync(d); } catch (e) { /* schon weg */ } }

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
