/* test-ganz-hinten.mjs -- drei Karten ganz ans Ende der Lernreihenfolge (26.10.2026).
 *
 * Elias, mit dem Bild seiner Suche (die drei Fakultäten aus Madina 1, Kapitel 14):
 * „diese 3 wörter will ich jetzt nicht lernen. packe sie ganz ans ende der liste damit ich
 * diese wörter von den 3 büchern am letzten lerne".
 *
 * Geprüft wird die ECHTE App-Logik aus js/kern.js (ganzHinten, neueZuerst, istGruppenwort,
 * lerngruppeHeute, herausgeschnitten und in einer leeren Umgebung ausgeführt):
 *   H0  die drei Kennungen sind wirklich seine drei Fakultäten (aus data/vokabeln-madina-1.js)
 *   H1  neueZuerst: die drei stehen hinter JEDER anderen Box-1-Karte, auch hinter Koranwörtern
 *       und schon begonnenen Karten
 *   H2  45930 (bei ihm seit 23.10. in der Lerngruppe) zählt nicht mehr als Gruppenwort
 *   H3  die Runde von heute nimmt keine der drei, solange andere Wörter da sind
 *   H4  weg sind sie nicht: ist sonst nichts mehr da, kommen sie dran
 * Die übrigen Karten und Stände sind erfunden. Störtests am Ende.
 */
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.dirname(fileURLToPath(import.meta.url));
const KERN = fs.readFileSync(path.join(REPO, 'js', 'kern.js'), 'utf8');
const DREI = ['45929', '45930', '45931'];

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

/* Erfundene Karten: Unterricht (neu), Koran häufigste (neu), eine schon begonnene, ein
   Gruppenmitglied, dazu seine drei mit dem Stand, den sie bei ihm haben. */
const KARTEN = [
  { id: '45929', book: 'madina-1', chapter: 14 },
  { id: '45930', book: 'madina-1', chapter: 14 },
  { id: '45931', book: 'madina-1', chapter: 14 },
  { id: 'u1', book: 'madina-1', chapter: 15 },
  { id: 'u2', book: 'bayna-yadayk-1', chapter: 4 },
  { id: 'k1', book: 'koran-haeufig', chapter: 1, koranRang: 1 },
  { id: 'k2', book: 'koran-haeufig', chapter: 1, koranRang: 2 },
  { id: 'a1', book: 'madina-1', chapter: 12 },
  { id: 'm1', book: 'madina-1', chapter: 13 },
];
const FORTSCHRITT = {
  '45929': { box: 1, nextReview: '2026-08-11', correct: 0, wrong: 0 },
  '45930': { box: 1, nextReview: '2026-10-26', correct: 0, wrong: 2, gruppe: '2026-10-23', gruppeArt: 'neu' },
  '45931': { box: 1, nextReview: '2026-08-11', correct: 0, wrong: 0 },
  u1: { box: 1, nextReview: '2026-08-11', correct: 0, wrong: 0 },
  u2: { box: 1, nextReview: '2026-08-29', correct: 0, wrong: 0 },
  k1: { box: 1, nextReview: '2026-10-11', correct: 0, wrong: 0 },
  k2: { box: 1, nextReview: '2026-10-11', correct: 0, wrong: 0 },
  a1: { box: 1, nextReview: '2026-10-20', correct: 0, wrong: 1 },
  m1: { box: 1, nextReview: '2026-10-26', correct: 0, wrong: 1, gruppe: '2026-10-24', gruppeArt: 'neu' },
};

function laufe(kern){
  const stuecke = ['function nieAbgefragt(', 'function ganzHinten(', 'function neueZuerst(',
    'function istGruppenwort(', 'function lerngruppeHeute('].map(k => schneide(kern, k)).join('\n');
  const ctx = { console: { log(){}, warn(){}, error(){} } };
  vm.createContext(ctx);
  vm.runInContext(`let PROGRESS = ${JSON.stringify(FORTSCHRITT)};
    const KARTEN = ${JSON.stringify(KARTEN)};
    const K = id => KARTEN.find(k => k.id === id);
    ${stuecke}
    globalThis.__h = { neueZuerst, istGruppenwort, lerngruppeHeute, K, KARTEN };`, ctx);
  const h = ctx.__h;
  const ids = l => l.map(w => w.id);
  const erg = new Map();
  const fall = (name, ok, zusatz) => erg.set(name, { ok: !!ok, zusatz });

  /* H1: die drei absichtlich VORNE in die Eingabe, dazu alles andere. */
  const reihe = ids(h.neueZuerst(h.KARTEN));
  const hinten3 = reihe.slice(-3);
  fall('H1 neueZuerst: die drei ganz hinten, hinter Koran und Begonnenem',
    DREI.every(id => hinten3.includes(id)) && reihe.indexOf('k2') < reihe.length - 3 && reihe.indexOf('a1') < reihe.length - 3,
    reihe.join(' '));

  /* H2: Gruppenmitglied ja/nein. */
  fall('H2 45930 ist kein Gruppenwort mehr, m1 schon',
    !h.istGruppenwort(h.K('45930')) && h.istGruppenwort(h.K('m1')),
    '45930: ' + h.istGruppenwort(h.K('45930')) + ', m1: ' + h.istGruppenwort(h.K('m1')));

  /* H3: eine Runde mit 3 Box-1-Plätzen (Gruppe 6), alles fällig, Beitritt erlaubt. */
  const pool = h.KARTEN.slice();
  const g = h.lerngruppeHeute(pool, h.neueZuerst(pool), pool, 3, true);
  const heute = ids(g.heute);
  fall('H3 die Runde nimmt keine der drei, solange andere da sind',
    heute.length > 0 && !heute.some(id => DREI.includes(id)), heute.join(' '));

  /* H4: nur noch die drei übrig. */
  const nurDrei = h.KARTEN.filter(k => DREI.includes(k.id));
  const g4 = h.lerngruppeHeute(nurDrei, h.neueZuerst(nurDrei), nurDrei, 3, true);
  const heute4 = ids(g4.heute);
  fall('H4 ist sonst nichts da, kommen sie dran (zuletzt, nicht nie)',
    heute4.some(id => DREI.includes(id)), heute4.join(' ') || '(leer)');
  return erg;
}

let rot = 0;

/* H0 gegen seine Kartendatei. Die liegt nur lokal (rechtlich nicht im Repo) — fehlt sie,
   wird der Fall übersprungen und so benannt, nicht grün gemeldet. */
const DATEI = path.join(REPO, 'data', 'vokabeln-madina-1.js');
console.log('=== Drei Karten ganz ans Ende ===');
if (fs.existsSync(DATEI)){
  const text = fs.readFileSync(DATEI, 'utf8');
  const de = id => { const m = text.match(new RegExp('"id": "' + id + '"[\\s\\S]*?"de": "([^"]*)"')); return m ? m[1] : null; };
  const soll = { '45929': 'medizinische Fakultät', '45930': 'Ingenieursfakultät', '45931': 'Wirtschaftsfakultät' };
  const ist = DREI.map(id => id + '=' + de(id));
  const ok = DREI.every(id => de(id) === soll[id]);
  if (!ok) rot++;
  console.log((ok ? '  ok   ' : '  FEHL ') + 'H0 die drei Kennungen sind seine drei Fakultäten  -> ' + ist.join(', '));
} else console.log('  --   H0 übersprungen: data/vokabeln-madina-1.js fehlt hier');

const erg = laufe(KERN);
for (const [name, e] of erg){ if (!e.ok) rot++; console.log((e.ok ? '  ok   ' : '  FEHL ') + name + (e.zusatz ? '  -> ' + e.zusatz : '')); }

function ersetze(quelle, alt, neu, wo){
  const n = quelle.split(alt).length - 1;
  if (n !== 1) throw new Error('Störtest „' + wo + '": die Stelle kommt ' + n + '-mal vor (erwartet 1) — Quelltext hat sich geändert');
  return quelle.replace(alt, () => neu);
}
const STOER = [
  { name: 'S1 neueZuerst ohne das Ende', muss: ['H1'],
    kern: q => ersetze(q, '  return alle.filter(w => !hinten(w)).concat(alle.filter(hinten));', '  return alle;', 'S1') },
  { name: 'S2 die Lerngruppe hält 45930 weiter fest', muss: ['H2', 'H3'],
    kern: q => ersetze(q, "  if (typeof ganzHinten === 'function' && ganzHinten(w)) return false;\n", '', 'S2') },
  { name: 'S3 die Liste ohne 45930', muss: ['H1', 'H2'],
    kern: q => ersetze(q, "['45929', '45930', '45931']", "['45929', '45931']", 'S3') },
];
console.log('\n=== Störtests: ohne die Regel MUSS der zuständige Fall scheitern ===');
for (const s of STOER){
  let e;
  try { e = laufe(s.kern(KERN)); }
  catch (err){ rot++; console.log('  FEHL ' + s.name + '  -> ' + err.message); continue; }
  const gescheitert = [...e].filter(([, v]) => !v.ok).map(([n]) => n.split(' ')[0]);
  const fehlt = s.muss.filter(k => !gescheitert.includes(k));
  if (fehlt.length){ rot++; console.log('  FEHL ' + s.name + '  -> ' + fehlt.join(', ') + ' blieb grün (gescheitert: ' + (gescheitert.join(', ') || 'nichts') + ')'); }
  else console.log('  ok   ' + s.name + '  -> scheitert wie verlangt: ' + gescheitert.join(', '));
}
console.log('\n' + (rot ? rot + ' Befund(e).' : 'Alles grün: ' + (erg.size + 1) + ' Fälle, ' + STOER.length + ' Störtests.'));
process.exit(rot ? 1 : 0);
