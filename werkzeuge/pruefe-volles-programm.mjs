/* pruefe-volles-programm.mjs — bleibt „das volle Programm" an allen drei Orten
 * dasselbe, und misst es überhaupt jemand?
 *
 *   node werkzeuge/pruefe-volles-programm.mjs              # prüfen
 *   node werkzeuge/pruefe-volles-programm.mjs --angleichen # Kopie neu schreiben
 *
 * Exitcode 0 = alles deckungsgleich, 2 = es läuft auseinander.
 *
 * ================== WOZU ===================================================
 *
 * Elias am 20.08.2026, und das ist der ganze Grund:
 *
 *   „es muss halt recht klar sein was ‚das volle programm‘ ist weil ich glaube
 *    wenn man das nicht aufschreibt, dass du dann nicht das machst was ich
 *    möchte und einfach irgendwas machst."
 *
 * Aufgeschrieben ist es — an DREI Orten. Und genau daran ist es am selben Tag
 * auseinandergelaufen: die Liste wurde nachts von elf auf dreizehn Punkte
 * erweitert (gender, femSg, Verbformen), der Wartungs-Prompt blieb bei elf.
 * Ein neues Nomen hätte damit kein `gender` bekommen, und die Übungen 11 und 12
 * hätten dafür null Aufgaben erzeugt — ohne dass irgendetwas meldet.
 * [[dieselbe_frage_zwei_antworten]]
 *
 * ⛔ Und die zweite Lücke, die dieser Prüfer schliesst: der Wartungs-Prompt
 * verwies auf `C:\Users\abdur\.claude\commands\volles-programm.md` und sagte
 * „jetzt lesen". Die Routine hat `cwd = …\Vokabeltrainer` und `addDirs =
 * ["G:\1. Workspace"]` — `C:\` ist NICHT dabei. Die Anweisung lief seit ihrer
 * Entstehung ins Leere, und ein abgelehnter Zugriff lässt eine Routine nicht
 * abstürzen: sie überspringt und meldet grün. [[anleitung_ohne_berechtigung]]
 *
 * ⭐ Die vierte Prüfung ist die wichtigste: JEDER Punkt der Liste muss von
 * mindestens einem Werkzeug gemessen werden. Ein Punkt, den kein Werkzeug
 * misst, wird nie gemeldet und deshalb nie ergänzt — er steht dann als Anspruch
 * in einer Datei und wirkt nirgends. [[werkzeug_ohne_aufrufer]]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/* ⛔ fileURLToPath, nicht von Hand: der Ordner heisst «1. Workspace» mit
   Leerstelle, die in import.meta.url als %20 steht. */
const HIER   = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.resolve(HIER, '..');

const QUELLE = path.join(WURZEL, 'VOLLES-PROGRAMM.md');
const KOPIE  = 'C:\\Users\\abdur\\.claude\\commands\\volles-programm.md';
const PROMPT = path.resolve(WURZEL, '..', 'Automation', 'prompts', 'vokabeltrainer-wartung.md');
const ROUTINEN = path.resolve(WURZEL, '..', 'Automation', 'routines.json');

const ANGLEICHEN = process.argv.includes('--angleichen');
let fehler = 0;
const sag = (ok, text) => { console.log('  ' + (ok ? 'ok  ' : '⛔  ') + text); if (!ok) fehler++; };

/* ---------- 0. Die Quelle muss es geben ---------- */
if (!fs.existsSync(QUELLE)){
  console.error('⛔ Die Quelle fehlt: ' + QUELLE);
  process.exit(2);
}
const quelle = fs.readFileSync(QUELLE, 'utf8');

/* ---------- 1. Die Kopie für /volles-programm ---------- */
if (ANGLEICHEN){
  fs.mkdirSync(path.dirname(KOPIE), { recursive: true });
  const tmp = KOPIE + '.neu';
  fs.writeFileSync(tmp, quelle, 'utf8');
  fs.renameSync(tmp, KOPIE);           /* ⛔ nie direkt überschreiben: ein Abbruch
                                          beim Schreiben hinterliesse eine leere
                                          Datei, und die besteht jeden Test.
                                          [[leere_datei_besteht_jeden_test]] */
  console.log('  ↻   Kopie neu geschrieben: ' + KOPIE);
}
if (!fs.existsSync(KOPIE)){
  sag(false, 'Die Kopie fehlt: ' + KOPIE + '   (--angleichen schreibt sie)');
} else {
  const kopie = fs.readFileSync(KOPIE, 'utf8');
  if (kopie === quelle) sag(true, 'Kopie /volles-programm ist deckungsgleich mit der Quelle.');
  else {
    /* Wo genau? Die erste abweichende Zeile nennen — „ungleich" allein zwingt
       zum Suchen von Hand. */
    const a = quelle.split(/\r?\n/), b = kopie.split(/\r?\n/);
    let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++;
    sag(false, 'Kopie weicht ab, zuerst in Zeile ' + (i + 1) + ':');
    console.log('        Quelle: ' + String(a[i] ?? '(Ende)').slice(0, 78));
    console.log('        Kopie : ' + String(b[i] ?? '(Ende)').slice(0, 78));
    console.log('        → node werkzeuge/pruefe-volles-programm.mjs --angleichen');
  }
}

/* ---------- 1b. Die Kurzliste im Wartungs-Prompt ----------

   ⭐ Sie wird ERZEUGT, nicht gepflegt. Eine von Hand geführte Zweitliste läuft
   auseinander, sobald jemand nur einen der beiden Orte anfasst — genau so ist
   der Prompt bei elf Punkten stehengeblieben, während die Quelle dreizehn
   hatte. Was erzeugt wird, kann nicht driften. */
const M_AUF = '<!-- ANFANG erzeugte Liste';
const M_ZU  = '<!-- ENDE erzeugte Liste -->';

function kurzlisteBauen(text){
  const zeilen = [...text.matchAll(/^\| (A\d+) \| (.+?) \| (.+?) \| (.+?) \|$/gm)];
  if (!zeilen.length) return null;
  const z = ['', 'Die ' + zeilen.length + ' Bestandteile in Kurzform — Einzelheiten, Belege und',
    'Fallstricke stehen in `VOLLES-PROGRAMM.md` selbst:', '',
    '| # | Bestandteil | wer es misst | was ohne es ausfällt |', '|---|---|---|---|'];
  zeilen.forEach(m => z.push('| ' + m[1] + ' | ' + m[2] + ' | ' + m[3] + ' | ' + m[4] + ' |'));
  const b = [...text.matchAll(/^\| (B\d+) \| (.+?) \| (.+?) \|$/gm)];
  if (b.length){
    z.push('', 'Und für eine **neue Regel** die ' + b.length + ' Punkte aus Teil B:', '',
      '| # | Bestandteil | Prüfung |', '|---|---|---|');
    b.forEach(m => z.push('| ' + m[1] + ' | ' + m[2] + ' | ' + m[3] + ' |'));
  }
  z.push('');
  return z.join('\n');
}

if (fs.existsSync(PROMPT)){
  const p0 = fs.readFileSync(PROMPT, 'utf8');
  const i = p0.indexOf(M_AUF), j = p0.indexOf(M_ZU);
  if (i < 0 || j < 0 || j < i){
    sag(false, 'Im Wartungs-Prompt fehlen die Marker fuer die erzeugte Kurzliste.');
  } else {
    const kopfEnde = p0.indexOf('-->', i) + 3;
    const jetzt = p0.slice(kopfEnde, j);
    const soll  = '\n' + (kurzlisteBauen(quelle) || '') + '\n';
    if (ANGLEICHEN && jetzt !== soll){
      const neu = p0.slice(0, kopfEnde) + soll + p0.slice(j);
      const tmp = PROMPT + '.neu';
      fs.writeFileSync(tmp, neu, 'utf8');
      fs.renameSync(tmp, PROMPT);
      console.log('  ↻   Kurzliste im Wartungs-Prompt neu erzeugt.');
    } else if (jetzt !== soll){
      sag(false, 'Die Kurzliste im Wartungs-Prompt ist nicht die aus der Quelle erzeugte.');
      console.log('        → node werkzeuge/pruefe-volles-programm.mjs --angleichen');
    } else {
      const n = (soll.match(/^\| A\d+ \|/gm) || []).length;
      sag(true, 'Kurzliste im Wartungs-Prompt ist erzeugt und aktuell (' + n + ' Punkte).');
    }
  }
}

/* ---------- 2. Verweist der Wartungs-Prompt auf einen ERREICHBAREN Ort? ---------- */
if (!fs.existsSync(PROMPT)){
  sag(false, 'Wartungs-Prompt nicht gefunden: ' + PROMPT);
} else {
  const prompt = fs.readFileSync(PROMPT, 'utf8');
  const rout   = fs.existsSync(ROUTINEN)
    ? JSON.parse(fs.readFileSync(ROUTINEN, 'utf8')).routines['vokabeltrainer-wartung'] : null;
  /* Was darf die Routine überhaupt lesen? cwd + addDirs, sonst nichts. */
  const erlaubt = rout ? [rout.cwd, ...(rout.addDirs || [])].map(s => s.toLowerCase()) : [];

  const nennt = prompt.includes('VOLLES-PROGRAMM.md');
  sag(nennt, nennt
    ? 'Wartungs-Prompt verweist auf VOLLES-PROGRAMM.md (liegt in cwd, also lesbar).'
    : 'Wartungs-Prompt nennt VOLLES-PROGRAMM.md nicht — Schritt 1c.4 hat keine Quelle.');

  /* Jeder absolute Pfad im Prompt, der ausserhalb von cwd+addDirs liegt, ist
     eine Anweisung, die die Routine nicht ausführen kann. */
  const pfade = [...prompt.matchAll(/`([A-Za-z]:\\[^`\n]+)`/g)].map(m => m[1]);
  const drausssen = [...new Set(pfade)].filter(p =>
    !erlaubt.some(e => p.toLowerCase().startsWith(e)));
  if (drausssen.length){
    sag(false, drausssen.length + ' Pfad(e) im Prompt liegen ausserhalb von cwd + addDirs:');
    drausssen.forEach(p => console.log('        ' + p));
    console.log('        Die Routine kann sie nicht lesen — sie überspringt still und meldet grün.');
  } else {
    sag(true, 'Alle ' + pfade.length + ' absoluten Pfade im Prompt liegen in cwd oder addDirs.');
  }
}

/* ---------- 3. Kennt der Prompt alle Punkte? ---------- */
const aPunkte = [...quelle.matchAll(/^## (A\d+) . (.+)$/gm)].map(m => ({ id: m[1], titel: m[2] }));
const bPunkte = [...quelle.matchAll(/^\| (B\d+) \| (.+?) \|/gm)].map(m => ({ id: m[1], titel: m[2] }));
console.log('');
console.log('  Die Liste führt ' + aPunkte.length + ' Punkte für eine Vokabel und '
  + bPunkte.length + ' für eine Regel.');

/* Alle Feldnamen, die die Liste als Pflicht nennt */
const felder = new Set();
for (const p of aPunkte) for (const m of p.titel.matchAll(/`([a-zA-Z_][a-zA-Z0-9_]*)`/g)) felder.add(m[1]);

/* ---------- 4. ⭐ Misst überhaupt jemand diese Felder? ---------- */
const MESSER = ['werkzeuge/vorrat.mjs', 'validate.js', 'pruefe-wortfelder.js',
                'pruefe-eselsbruecken.js', 'pruefe-saetze.js', 'pruefe-markierungen.js',
                'pruefe-erreichbarkeit.js', 'pruefe-taschkil.js', 'pruefe-quran.js'];
const quelltexte = {};
for (const m of MESSER){
  const d = path.join(WURZEL, m);
  if (fs.existsSync(d)) quelltexte[m] = fs.readFileSync(d, 'utf8');
}
console.log('');
console.log('  Wird jedes Pflichtfeld von einem Werkzeug gemessen?');
const ungemessen = [];
for (const f of [...felder].sort()){
  /* Ein Werkzeug misst das Feld, wenn es den Namen als Zeichenkette ODER als
     Eigenschaftszugriff führt. Blosse Erwähnung im Kommentar zählt nicht —
     deshalb wird der Kommentaranteil vorher entfernt. [[stichworttreffer_im_kommentar]] */
  const wer = Object.entries(quelltexte).filter(([, t]) => {
    const ohneKommentar = t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
    return new RegExp("[.'\"]" + f + "\\b").test(ohneKommentar);
  }).map(([m]) => m);
  if (wer.length) console.log('    ok   ' + f.padEnd(12) + wer.join(', '));
  else { console.log('    ⛔   ' + f.padEnd(12) + 'KEIN Werkzeug misst dieses Feld'); ungemessen.push(f); }
}
if (ungemessen.length){
  fehler++;
  console.log('');
  console.log('  ⛔ ' + ungemessen.length + ' Feld(er) stehen als Pflicht in der Liste, werden aber von');
  console.log('     keinem Werkzeug gemessen. Sie werden deshalb nie gemeldet und nie');
  console.log('     ergänzt — die Liste verspricht dort etwas, das nicht stattfindet.');
}

console.log('');
if (fehler){
  console.log('⛔ ' + fehler + ' Befund(e). „Das volle Programm" ist nicht an allen Orten dasselbe.');
  process.exit(2);
}
console.log('✅ Quelle, Kopie, Wartungs-Prompt und Messwerkzeuge sind deckungsgleich.');
process.exit(0);
