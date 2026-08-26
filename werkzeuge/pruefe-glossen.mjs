/* pruefe-glossen.mjs — welche Markierung braucht eine Glosse, und hat sie eine?
 * ==========================================================================
 *
 * Elias am 26.08.2026, an Regel 89 "Die Besitzendungen":
 *   "bei so einem speziellen beispiel wäre es auch glaube ich gut, wenn dann
 *    die grammatikregeln kommt das da auch steht, dass كِ ‚dein (W)' ist. also
 *    wenn es um solche speziellen dinge geht die man auch kaum mit hilfe der
 *    übersetzung durchschauen kann"
 *
 * Der Beispielsatz ist مَا اسْمُكِ؟ اسْمِي آمِنَةُ. — "Wie heisst du? Mein Name
 * ist Amina." Dass das markierte ـكِ die WEIBLICHE Anrede ist, steht in der
 * Uebersetzung nirgends: das deutsche "dein" hat gar kein Geschlecht. Die
 * Information fehlt nicht versteckt, sondern vollstaendig.
 *
 * ============================== DIE GRENZE ================================
 *
 * NUR was im Deutschen keine Entsprechung hat:
 *   2. Person mit Geschlecht    du · dein · ihr · euer sind geschlechtslos
 *   3. Person Mehrzahl          "sie" und "ihr" sind geschlechtslos
 *
 * ⛔ NICHT dabei: هُوَ / هِيَ (er/sie), ـهُ / ـهَا (sein/ihr), أَنَا, نَحْنُ,
 *    ـي, ـنَا. Der erste Lauf meldete sie brav mit — richtig erkannt und
 *    trotzdem ueberfluessig, denn Deutsch UNTERSCHEIDET er und sie. Elias'
 *    Kriterium war nicht "grammatische Information", sondern "was die
 *    Uebersetzung nicht traegt".
 *
 * ⛔ UND NICHT DIE ZWEIZAHL, obwohl Deutsch keinen Dual hat. Der Versuch, sie
 *    an den Endungen ـان / ـين zu erkennen, lieferte ZEHN Treffer und ALLE
 *    ZEHN waren falsch: الْيَابَانِ (Japan), الصِّينِ (China), السِّكِّينُ
 *    (Messer), كَسْلَانُ (faul), مِنْ أَيْنَ … lauter Woerter, deren Endung
 *    nichts mit einem Dual zu tun hat. Ein Kennzeichen mit zwei Ursachen —
 *    die Heuristik ist ersatzlos entfallen statt "unsicher" zu melden.
 *    Echte Duale muessen von Hand eingetragen werden.
 *    [[kennzeichen_mit_zwei_ursachen]] · [[kandidatenliste_ist_keine_fehlerliste]]
 *
 * ⛔ Und die Ausnahmen: هُنَاكَ ("dort") und ذَلِكَ / أَذَلِكَ ("jenes") tragen
 *    ein كَ, das KEIN Suffix ist. Beide wurden im ersten Lauf als "dein (m.)"
 *    gemeldet.
 *
 * Aufruf:  node werkzeuge/pruefe-glossen.mjs
 * Exitcode 0 = jede Stelle, die eine Glosse braucht, hat eine
 *          2 = Befunde fuer Elias (nie 1 — 1 ist Werkzeugfehler)
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ⛔ const im vm-Kontext landet NICHT auf globalThis, und zwei runInContext-
   Aufrufe sind zwei Skripte. Deshalb alles zu EINEM verketten. */
const ctx = { window: {}, document: {}, console };
vm.createContext(ctx);
let code = '';
for (const f of ['vocab-data.js', 'grammar-data.js', 'lehrbuch-saetze.js',
                 'data/beispielsaetze.js', 'data/fachbegriffe.js']) {
  try { code += fs.readFileSync(path.join(REPO, f), 'utf8') + '\n;\n'; }
  catch { /* gesperrte Datei fehlt auf einem anderen Rechner — kein Abbruch */ }
}
code += 'globalThis.__X = {};\n';
for (const n of ['VOCAB_DATA', 'GRAMMAR_RULES', 'SENTENCE_TAGS', 'LEHRBUCH_SAETZE',
                 'BEISPIELSAETZE', 'FACHBEGRIFF_VOKABELN'])
  code += 'try{ __X.' + n + ' = ' + n + ' }catch(e){}\n';
vm.runInContext(code, ctx);
const X = ctx.__X, TAGS = X.SENTENCE_TAGS;
if (!TAGS) { console.error('SENTENCE_TAGS nicht gefunden.'); process.exit(1); }

/* ⛔ Alle vier Satzquellen — sie haben nicht dieselbe Gestalt. [[dritte_satzquelle]] */
const SATZ = new Map();
const flach = q => !q ? []
  : Array.isArray(q) ? q.flatMap(flach)
  : typeof q === 'object'
    ? (q.id != null && (q.sentAr || q.ar) ? [q] : Object.values(q).flatMap(flach))
    : [];
for (const liste of [X.VOCAB_DATA, X.LEHRBUCH_SAETZE, X.BEISPIELSAETZE, X.FACHBEGRIFF_VOKABELN])
  for (const s of flach(liste)) {
    const ar = s.sentAr || s.ar; if (!ar) continue;
    SATZ.set(String(s.id), { ar, de: s.sentDe || s.de || '' });
  }

const NFC = s => String(s || '').normalize('NFC');
const OHNE = s => NFC(s).replace(/[ً-ْٰـ]/g, '');
const gleich = s => OHNE(s).replace(/[آأإٱ]/g, 'ا');

const KEIN_SUFFIX = ['هناك', 'ذلك', 'تلك', 'كذلك', 'أولئك', 'ذاك'];
const SUFFIXE = [
  ['كما', 'ـكُمَا = euer beider (Zweizahl)'],
  ['كن',  'ـكُنَّ = euer (Mehrzahl, weiblich)'],
  ['كم',  'ـكُمْ = euer (Mehrzahl, männlich)'],
  ['هما', 'ـهُمَا = ihrer beider (Zweizahl)'],
  ['هن',  'ـهُنَّ = ihr (Mehrzahl, weiblich)'],
  ['هم',  'ـهُمْ = ihr (Mehrzahl, männlich)'],
  ['ك',   null],
];
const PRONOMEN = {
  'هما':   'هُمَا = die beiden (Zweizahl)',
  'أنتما': 'أَنْتُمَا = ihr beide (Zweizahl)',
  'أنتن':  'أَنْتُنَّ = ihr (Mehrzahl, weiblich)',
  'أنتم':  'أَنْتُمْ = ihr (Mehrzahl, männlich)',
  'هن':    'هُنَّ = sie (Mehrzahl, weiblich)',
  'هم':    'هُمْ = sie (Mehrzahl, männlich)',
};
const KAF_M = 'كَ';                        // كَ
const KAF_W = 'كِ';                        // كِ
const ANTA  = 'أَنْتَ'; // أَنْتَ
const ANTI  = 'أَنْتِ'; // أَنْتِ

function braucht(matchText) {
  const v = NFC(matchText), o = gleich(matchText);
  for (const [k, b] of Object.entries(PRONOMEN)) if (o === gleich(k)) return b;
  if (v.includes(ANTA)) return 'أَنْتَ = du (männlich)';
  if (v.includes(ANTI)) return 'أَنْتِ = du (weiblich)';
  if (KEIN_SUFFIX.some(w => o.endsWith(gleich(w)))) return null;
  for (const [suf, bed] of SUFFIXE) {
    const s = gleich(suf);
    if (!o.endsWith(s) || o.length < s.length + 3) continue;
    if (bed !== null) return bed;
    if (v.includes(KAF_W)) return 'ـكِ = dein (weiblich)';
    if (v.includes(KAF_M)) return 'ـكَ = dein (männlich)';
    return 'UNVOKALISIERT — dein (m.) oder (w.)? Nicht raten, nachsehen.';
  }
  return null;
}

let fehlend = 0, vorhanden = 0, abweichend = 0, gesamt = 0;
const meldungen = [];
for (const [satzId, liste] of Object.entries(TAGS)) {
  const s = SATZ.get(String(satzId));
  for (const t of liste) {
    gesamt++;
    if (!t.matchText) continue;
    const soll = braucht(t.matchText);
    if (!soll) {
      /* ⭐ Auch die Gegenrichtung: eine Glosse, wo das Kriterium keine
         verlangt, ist kein Fehler — aber sie sollte auffallen, damit sie
         jemand bestaetigt statt sie zu vergessen. [[form_sagt_nicht_welche_beziehung]] */
      if (t.bedeutung) meldungen.push({ art: 'zusaetzlich', satzId, t, soll: null });
      continue;
    }
    if (!t.bedeutung) { fehlend++; meldungen.push({ art: 'fehlt', satzId, t, soll, de: s && s.de }); }
    else if (t.bedeutung !== soll) { abweichend++; meldungen.push({ art: 'anders', satzId, t, soll }); }
    else vorhanden++;
  }
}

console.log('Markierungen: ' + gesamt + ' | mit Glosse noetig: '
  + (fehlend + vorhanden + abweichend) + ' | davon gesetzt: ' + vorhanden);
for (const m of meldungen) {
  if (m.art === 'fehlt')
    console.log('\n⛔ FEHLT   ' + m.satzId + '  ' + m.t.matchText
      + '\n   Vorschlag: ' + m.soll + (m.de ? '\n   Übersetzung: ' + m.de : ''));
  else if (m.art === 'anders')
    console.log('\n⚠️  ANDERS  ' + m.satzId + '  ' + m.t.matchText
      + '\n   steht da:  ' + m.t.bedeutung + '\n   erwartet:  ' + m.soll
      + '\n   (Wenn deine Fassung besser ist, ist das in Ordnung — dann bleibt die Meldung stehen.)');
  else
    console.log('\nℹ️  ZUSÄTZLICH  ' + m.satzId + '  ' + m.t.matchText
      + '\n   ' + m.t.bedeutung + '  — vom Kriterium nicht verlangt, von Hand gesetzt.');
}
console.log('\n' + (fehlend
  ? '⛔ ' + fehlend + ' Markierung(en) ohne Glosse.'
  : '✅ Jede Stelle, die eine Glosse braucht, hat eine.'));
process.exit(fehlend ? 2 : 0);
