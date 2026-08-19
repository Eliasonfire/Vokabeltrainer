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
 * Zahlen, sonst nichts.
 *
 * ⛔⛔ EICHUNG 19.08.2026 -- DAS HIER IST EIN KANDIDATENFINDER
 *
 * Der Lauf meldete 14 Stellen. Jede einzeln gelesen: VIER waren echte Fehler,
 * zehn nicht. Die zehn zerfallen in zwei Sorten:
 *
 *   1. Korrekter Verlauf im Praeteritum. "Lektion 1-9 waren zwar schon gegen
 *      die 73 Regeln gehalten" war damals richtig und ist als Satz ueber die
 *      Vergangenheit weiter richtig. NICHT umschreiben.
 *   2. Fehltreffer des Musters. "an 13 Regeln war es der Platzhalter" und
 *      "mb1-51-1 hatte 4 Markierungen" sind Zahlen INNERHALB eines Befundes,
 *      keine Aussagen ueber die Gesamtzahl. Das Muster "<n> Regeln" kann das
 *      nicht unterscheiden.
 *
 * Echte Fehler waren: der Kurzstand oben in Vokabeltrainer-Arabisch.md (stand
 * auf v181 und nannte erledigte Aufgaben), eine Zahl im Ziel-Prompt, und zwei
 * Saetze im Praesens ("tragen jetzt", "die App hat"). Wo Verlauf im Praesens
 * steht, wird er NICHT umgeschrieben - er bekommt eine datierte Marke daneben.
 *
 * ⛔ FEHLVERSUCH, NICHT WIEDERHOLEN: Die Ueberschriftenerkennung unten sieht
 * nur Zeilenanfaenge. In Vokabeltrainer-Arabisch.md stehen die Kurzstaende
 * aber als ZITATBLOCK ("> ## Davor: Kurzstand 18.08.2026"), also unsichtbar.
 * Der naheliegende Fix - ein Zitat-Praefix in der Ueberschriften-Regex - wurde
 * am 19.08. gebaut und WIEDER ZURUECKGENOMMEN: er raeumte eine Fehlmeldung weg
 * und erzeugte FUENF neue (13 -> 17). Ursache: sobald zitierte Ueberschriften
 * mitzaehlen, hebt eine UNDATIERTE zitierte Ueberschrift die vererbte
 * Verlaufsmarkierung auf, und ganze Abschnitte darunter gelten wieder als
 * Gegenwart.
 * ⭐ Die Lehre gilt allgemein: nach so einer Aenderung die GESAMTZAHL
 * vergleichen, nicht nur den Fall, den man beheben wollte. */
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
/* ⛔ ES GIBT VIER SATZQUELLEN, NICHT ZWEI.
   Bis zum 19.08.2026 zaehlte dieses Werkzeug nur VOCAB_DATA + LEHRBUCH_SAETZE
   und meldete 210, waehrend die App 251 Saetze fuehrte. `alleSaetze()` in
   js/saetze.js liest ausserdem data/beispielsaetze.js und data/fachbegriffe.js
   — genau die beiden, die schon einmal drei Werkzeugen unbekannt waren und
   105 Uebungsaufgaben verschwinden liessen. [[dritte-satzquelle]]
   Ein Zaehlwerkzeug, das nicht alle Wege kennt, meldet eine Zahl, der man
   glaubt. [[vor-dem-eintragen-messen]] */
const { BEISPIELSAETZE }  = auswerten(lies('data/beispielsaetze.js'), ['BEISPIELSAETZE']);
const { FACHBEGRIFF_VOKABELN } = auswerten(lies('data/fachbegriffe.js'), ['FACHBEGRIFF_VOKABELN']);

const markierungen = Object.values(SENTENCE_TAGS).flat();
const belegteIds = new Set(markierungen.map(t => t.ruleId));

const IST = {
  Regeln:         GRAMMAR_RULES.length,
  Markierungen:   markierungen.length,
  Module:         fs.readdirSync(V + 'js').filter(f => f.endsWith('.js')).length,
  Lehrbuchsaetze: LEHRBUCH_SAETZE.length,
  Saetze:         VOCAB_DATA.filter(v => v.sentAr).length + LEHRBUCH_SAETZE.length
                  + Object.keys(BEISPIELSAETZE).length
                  + FACHBEGRIFF_VOKABELN.filter(v => v.sentAr).length,
  Beispielsaetze: Object.keys(BEISPIELSAETZE).length,
  CACHE:          Number((lies('sw.js').match(/vokabeltrainer-v(\d+)/) || [])[1])
};
const erreichbar = GRAMMAR_RULES.filter(r => belegteIds.has(r.id)).length;

console.log('Ist-Stand aus dem Code:');
Object.entries(IST).forEach(([k, v]) => console.log(`   ${k.padEnd(16)} ${v}`));
console.log(`   ${'erreichbar'.padEnd(16)} ${erreichbar} von ${IST.Regeln}`);
if (erreichbar !== IST.Regeln)
  console.log(`   !! ${IST.Regeln - erreichbar} Regel(n) ohne Markierung - in der App unsichtbar.`);

const VAULT = 'G:/1. Workspace/Obsidian/Gedächtnis/Elias Gedächtnis/';
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

/* ---------- Zweite Pruefung: sagt die Kurzbeschreibung noch dasselbe wie der Text? ----------
 *
 * Zahlen sind nur die eine Haelfte. Die andere sind Zustandsaussagen: eine
 * Datei sagt im Text "erledigt", ihre `description:` sagt weiter "offen". Nach
 * der Beschreibung wird beim Erinnern entschieden, ob eine Datei ueberhaupt
 * aufgeschlagen wird - eine veraltete Beschreibung traegt den Irrtum also
 * weiter, auch wenn im Text die Wahrheit steht.
 *
 * Das ist am 28.07.26 ZWEIMAL passiert. Einmal bei der Sprechertrennung
 * (Beschreibung "offen, braucht Elias' Hugging-Face-Schritt", obwohl seit dem
 * Vortag fertig) - ich habe Elias daraufhin eine Aufgabe genannt, die er
 * laengst erledigt hatte. Und einmal beim Tag-Audit ("Fixes noch nicht
 * angewendet", obwohl 31 Markierungen entfernt waren). */
const MEMDIR = 'C:/Users/abdur/.claude/projects/F--Workspace-Obsidian/memory/';
const OFFEN  = /\boffen\b|noch nicht|ausstehend|wartet auf|steht aus|verschoben/i;
const FERTIG = /\bERLEDIGT\b|\babgeschlossen\b|\bkomplett erledigt\b|\bist fertig\b|\bdurch\b.*\berledigt\b/;

let widersprueche = 0;
if (fs.existsSync(MEMDIR)) {
  for (const f of fs.readdirSync(MEMDIR).filter(n => n.endsWith('.md') && n !== 'MEMORY.md')) {
    const text = fs.readFileSync(MEMDIR + f, 'utf8');
    const besch = (text.match(/^description:\s*"?(.*?)"?\s*$/m) || [])[1] || '';
    if (!OFFEN.test(besch)) continue;
    /* Eine Beschreibung, die BEIDES nennt ("Vulkan ist offen - die
       Sprechertrennung dagegen ist fertig"), unterscheidet die Zustaende
       bereits selbst und ist damit genau richtig. Nur wer pauschal "offen"
       sagt, waehrend der Text "erledigt" meldet, wird gemeldet. */
    if (/\bfertig\b|\berledigt\b|\babgeschlossen\b|\bdurch\b/i.test(besch)) continue;
    /* Nur die ersten Absaetze nach dem Frontmatter ansehen - dort steht der
       aktuelle Stand, weiter unten faengt der Verlauf an. */
    const kopf = text.split(/^---\s*$/m).slice(2).join('---').split(/\n\n/).slice(0, 4).join('\n\n');
    if (FERTIG.test(kopf)) {
      widersprueche++;
      console.log(`\n!! ${f}`);
      console.log(`   description sagt sinngemaess "offen": "${besch.slice(0, 90)}..."`);
      console.log(`   der Text darueber sagt aber "erledigt". Beschreibung nachziehen.`);
    }
  }
}
if (!widersprueche) console.log('Keine Kurzbeschreibung widerspricht ihrem eigenen Text.');
