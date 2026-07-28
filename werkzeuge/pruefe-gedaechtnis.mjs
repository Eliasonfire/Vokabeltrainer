/* pruefe-gedaechtnis.mjs -- stimmen die Zahlen im Gedaechtnis noch mit dem Code?
 *
 * Aufruf:  node werkzeuge/pruefe-gedaechtnis.mjs
 *
 * Warum es das gibt: Die Projektnotizen im Obsidian-Vault und die Projekt-Memory
 * sind chronologisch gewachsen. Darin stehen Saetze wie "73 Regeln, 284
 * Markierungen" - richtig zum Zeitpunkt des Schreibens, falsch als Aussage ueber
 * heute. Wer die Notiz spaeter liest, kann das nicht unterscheiden. Dieses
 * Skript haelt jede solche Zahl gegen den Ist-Stand aus dem Code.
 *
 * Der springende Punkt ist die Unterscheidung Verlauf/Gegenwart. Ein Absatz
 * unter einer Ueberschrift wie "Nachtschicht 28.07.2026" IST ein Verlaufseintrag
 * und darf alte Zahlen tragen - der wird nicht gemeldet. Gemeldet wird nur, was
 * ohne solche Kennzeichnung als aktueller Stand dasteht. Ohne diese Regel meldet
 * das Skript zwanzig Zeilen, die alle in Ordnung sind, und wird nach dem zweiten
 * Lauf ignoriert.
 *
 * Was es NICHT kann: pruefen, ob eine Aussage inhaltlich stimmt. Es vergleicht
 * Zahlen, sonst nichts. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const V = path.join(HIER, '..') + path.sep;
const lies = f => fs.readFileSync(V + f, 'utf8');
const auswerten = (quelle, namen) =>
  (new Function(quelle + `;return {${namen.join(',')}};`))();

const { GRAMMAR_RULES, SENTENCE_TAGS } = auswerten(lies('grammar-data.js'), ['GRAMMAR_RULES', 'SENTENCE_TAGS']);
const { VOCAB_DATA }      = auswerten(lies('vocab-data.js'), ['VOCAB_DATA']);
const { LEHRBUCH_SAETZE } = auswerten(lies('lehrbuch-saetze.js'), ['LEHRBUCH_SAETZE']);

const markierungen = Object.values(SENTENCE_TAGS).flat();
const belegteIds = new Set(markierungen.map(t => t.ruleId));

const IST = {
  Regeln:         GRAMMAR_RULES.length,
  Markierungen:   markierungen.length,
  Module:         fs.readdirSync(V + 'js').filter(f => f.endsWith('.js')).length,
  Lehrbuchsaetze: LEHRBUCH_SAETZE.length,
  Saetze:         VOCAB_DATA.filter(v => v.sentAr).length + LEHRBUCH_SAETZE.length,
  CACHE:          Number((lies('sw.js').match(/vokabeltrainer-v(\d+)/) || [])[1])
};
const erreichbar = GRAMMAR_RULES.filter(r => belegteIds.has(r.id)).length;

console.log('Ist-Stand aus dem Code:');
Object.entries(IST).forEach(([k, v]) => console.log(`   ${k.padEnd(16)} ${v}`));
console.log(`   ${'erreichbar'.padEnd(16)} ${erreichbar} von ${IST.Regeln}`);
if (erreichbar !== IST.Regeln)
  console.log(`   !! ${IST.Regeln - erreichbar} Regel(n) ohne Markierung - in der App unsichtbar.`);

const VAULT = 'F:/Workspace/Obsidian/Gedächtnis/Elias Gedächtnis/';
const MEM   = 'C:/Users/abdur/.claude/projects/F--Workspace-Obsidian/memory/';
const DATEIEN = [
  VAULT + '03 - Projekte/Vokabeltrainer-Arabisch.md',
  VAULT + '03 - Projekte/Vokabeltrainer-Generalcheck.md',
  VAULT + '03 - Projekte/Vokabeltrainer-Goal-Prompt.md',
  VAULT + '03 - Projekte/To-Do.md',
  VAULT + 'INDEX.md',
  VAULT + '00 - Claude Profil/Elias_KI_Profil.md',
  MEM + 'vokabeltrainer_project.md',
  MEM + 'vokabeltrainer_zweite_tonspur.md'
];

const DATUM   = /\b\d{1,2}\.\d{1,2}\.\d{2,4}\b/;
const COMMIT  = /`[0-9a-f]{7}`/;
/* Woerter, die eine Zahl selbst als vergangen ausweisen, auch ohne Datum. */
const RUECKBLICK = /historisch|damals|inzwischen|Nachtrag|Verlauf|vorher|statt \d|zuerst|noch nicht|unklar/i;

const MUSTER = [
  [/(\d+)\s+Regeln\b/gi,           'Regeln'],
  [/(\d+)\s+Markierungen\b/gi,     'Markierungen'],
  [/(\d+)\s+(?:JS-)?Module\b/gi,   'Module'],
  [/(\d+)\s+Lehrbuchsätze\b/gi,    'Lehrbuchsaetze'],
  [/CACHE_NAME\s+v(\d+)/gi,        'CACHE']
];

let gemeldet = 0;
for (const datei of DATEIEN) {
  if (!fs.existsSync(datei)) { console.log(`\n!! fehlt: ${datei}`); continue; }
  const zeilen = fs.readFileSync(datei, 'utf8').split(/\r?\n/);

  /* Steht der Absatz unter einer datierten Ueberschrift? Dann ist er Verlauf.
     Wichtig ist dabei die Verschachtelung: ein "### Fuenf Regeln entfernt"
     unterhalb von "## 28.07.2026 - Nachtschicht" gehoert zum Verlauf, auch wenn
     die Unterueberschrift selbst kein Datum traegt. Die Kennzeichnung wird
     deshalb nach unten VERERBT und erst von einer Ueberschrift derselben oder
     einer hoeheren Ebene aufgehoben. Ohne das meldete der Lauf sieben Zeilen,
     die alle in einem sauber datierten Abschnitt standen. */
  let verlaufAbEbene = 0;          // 0 = wir sind nicht im Verlauf
  const befunde = [];

  zeilen.forEach((z, i) => {
    const h = z.match(/^(#{1,6})\s/);
    if (h) {
      const ebene = h[1].length;
      if (verlaufAbEbene && ebene <= verlaufAbEbene) verlaufAbEbene = 0;
      /* Ab Ebene 2. Der Dokumenttitel traegt oft ein Datum ("# Ziel-Prompt
         (Stand 28.07.26)") - das heisst "zuletzt ueberarbeitet am", nicht
         "alles darunter ist Protokoll". Zaehlte er mit, waere die ganze Datei
         als Verlauf abgetan und das Skript pruefte sie faktisch nicht mehr.
         Genau das ist passiert: eine veraltete Zahl im Ziel-Prompt fiel
         dadurch heraus. */
      if (!verlaufAbEbene && ebene >= 2 && (DATUM.test(z) || COMMIT.test(z))) verlaufAbEbene = ebene;
    }
    if (verlaufAbEbene) return;
    if (DATUM.test(z) || COMMIT.test(z) || RUECKBLICK.test(z)) return;

    for (const [re, schluessel] of MUSTER) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(z))) {
        if (Number(m[1]) !== IST[schluessel])
          befunde.push(`   Z${i + 1}  "${m[0].trim()}"  -> im Code: ${IST[schluessel]}`);
      }
    }
  });

  if (befunde.length) {
    gemeldet += befunde.length;
    console.log(`\n${path.basename(datei)}`);
    [...new Set(befunde)].forEach(b => console.log(b));
  }
}

console.log(gemeldet
  ? `\n${gemeldet} Stelle(n) ansehen - sie stehen NICHT in einem datierten Abschnitt und lesen sich deshalb wie der aktuelle Stand.`
  : '\nKeine widersprechende Zahl ausserhalb der Verlaufsabschnitte.');
