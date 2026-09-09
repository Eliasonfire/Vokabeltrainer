/* gedaechtnis-wortlaut.mjs -- prueft, ob Elias' Saetze WOERTLICH im Vault stehen.
 *
 * ⛔ WARUM ES DIESES WERKZEUG GIBT UND NICHT NUR pruefe-gedaechtnis.mjs
 *
 * Am 21.08.2026 und wieder am 25.08.2026 lief ein Abgleich gruen und war
 * trotzdem falsch: Beide Male hatte ICH die Punkteliste geschrieben, gegen die
 * geprueft wurde. Ein Test, den ich selbst formuliere und selbst bestehe,
 * misst nichts — er bestaetigt nur, dass ich mich an das erinnere, was ich
 * gerade geschrieben habe. [[pruefwerkzeug_mit_eingebauter_antwort]]
 *
 * Dieses Werkzeug nimmt die Saetze deshalb aus dem TRANSKRIPT, nicht aus
 * meinem Kopf, und sucht sie im Wortlaut. Am 25.08. fand es dadurch, dass ich
 * in einem Auftragszitat Elias' Tippfehler korrigiert hatte ("abgefraget" ->
 * "abgefragt") — und ein korrigiertes Zitat ist nicht mehr auffindbar und
 * damit nicht mehr ueberpruefbar. [[zitieren_am_original]]
 *
 * Aufruf:
 *   node werkzeuge/gedaechtnis-wortlaut.mjs <sitzungsdatei.jsonl> [abZeile]
 *   node werkzeuge/gedaechtnis-wortlaut.mjs --letzte            (juengste Sitzung)
 *
 * Exitcode 1, wenn ein Satz gar nicht belegt ist.
 *
 * ⛔ DREI GESTALTEN, NICHT ZWEI. Elias' Nachrichten liegen als
 *      `user`                                        — normal getippt
 *      `queue-operation`                             — eingereiht, nur Text
 *      `attachment` mit attachment.type=queued_command — mitten im Zug, Text+Bild
 *    Am 24.08. kannte ein Filter nur zwei und zaehlte 10 statt 11; am 25.08.
 *    kannte er dieselben zwei und verlor "ja stimmt, das was du sagst ist
 *    richtig" — die Nachricht, mit der Elias einen Befund bestaetigt hatte.
 *
 * ⛔ NICHT mit einem Textmuster nach der Komprimierungsmarke suchen. Am 25.08.
 *    traf mein Muster ("Compacted", "isCompactSummary") meinen EIGENEN
 *    Skripttext, der inzwischen im Transkript stand — die Marke wanderte ans
 *    Ende und das Werkzeug meldete "0 Aussagen". Eine unmoegliche Zahl ist ein
 *    Geschenk; eine knapp zu kleine waere durchgegangen.
 *    [[zitat_ueber_die_stelle]] · [[unmoegliche_zahl_ist_ein_geschenk]]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const VAULT = 'G:/1. Workspace/Obsidian/Gedächtnis/Elias Gedächtnis/';
const AUTO  = 'C:/Users/abdur/.claude/projects/G--1--Workspace/memory/';
const SITZUNGEN = 'C:/Users/abdur/.claude/projects/G--1--Workspace/';

/* ---------- Sitzungsdatei bestimmen ---------- */
let datei = process.argv[2];
if (!datei || datei === '--letzte') {
  const kandidaten = fs.readdirSync(SITZUNGEN)
    .filter(f => f.endsWith('.jsonl'))
    .map(f => ({ f, t: fs.statSync(SITZUNGEN + f).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  if (!kandidaten.length) { console.error('Keine .jsonl gefunden in ' + SITZUNGEN); process.exit(2); }
  datei = SITZUNGEN + kandidaten[0].f;
  console.log('Sitzung: ' + kandidaten[0].f);

  /* ---------- ⛔⛔ WAS DIESER LAUF NICHT ANGESEHEN HAT (09.09.2026) --------

     ANLASS: Elias' Frage „ist gedächtnis wirklich aktuell?" — zum zweiten Mal
     an diesem Tag, und zum zweiten Mal fand sie etwas. `--letzte` nimmt genau
     EINE Datei. An diesem Tag lief die Arbeit in ZWEI: die Nachtschicht (14
     Aussagen) und die Sitzung danach (5). Der Lauf meldete „4 wörtlich, 0
     fehlen" — richtig, und er hatte 14 der 18 Aussagen nie angesehen. Darin
     eine, die im Vault fehlte: seine Absage des Aufwach-Auftrags um 05:22.

     ⭐ Deshalb steht hier ein HINWEIS und keine Automatik. Ein Versuch,
     einfach „alle Sitzungen von heute" mitzuprüfen, war schlechter: im selben
     Ordner liegen auch Sitzungen zu anderen Themen, und der Sammelwert
     („236 fehlen ganz") lädt zu einem falschen Schluss ein. Eine Zahl, die
     mehr misst als die Frage, ist keine bessere Antwort.
     [[werkzeug_misst_kleineren_bestand]] [[kandidatenliste_ist_keine_fehlerliste]]

     ⚠️ Gefiltert wird über den ZEITSTEMPEL der letzten Zeile, nicht über die
     mtime: eine alte Sitzungsdatei bekommt eine neue mtime, sobald irgendetwas
     sie liest. Nach mtime waren es 13 Dateien, nach Inhalt 11. */
  const anderswo = [];
  for (const k of kandidaten.slice(1)) {
    let letzte = null;
    try {
      for (const z of fs.readFileSync(SITZUNGEN + k.f, 'utf8').split(/\r?\n/)) {
        const t = z.indexOf('"timestamp":"');
        if (t < 0) continue;
        letzte = z.slice(t + 13, z.indexOf('"', t + 13));
      }
    } catch { continue; }
    if (letzte && new Date(letzte).toDateString() === new Date().toDateString())
      anderswo.push(k.f);
  }
  if (anderswo.length) {
    console.log('⚠️ ' + anderswo.length + ' weitere Sitzung(en) waren heute aktiv und sind hier NICHT geprüft:');
    for (const f of anderswo.slice(0, 6)) console.log('     ' + f);
    if (anderswo.length > 6) console.log('     … und ' + (anderswo.length - 6) + ' weitere');
    console.log('   Gehört eine davon zu dieser Arbeit, mit ihrem Pfad als Argument nachfahren.');
  }
}
const AB = Number(process.argv[3] || 0);

/* ---------- 1. Elias' Saetze ---------- */
const zeilen = fs.readFileSync(datei, 'utf8').split(/\r?\n/).filter(Boolean);
/* Was KEINE Aussage von ihm ist: Systemtexte, Skilltexte, Werkzeugergebnisse
   und die Bildbeschreibungen der Bilder, die ICH per Read geladen habe. */
const RAUS = [
  /^\s*<(system-reminder|local-command|command-name|command-message|command-args|task-notification)/,
  /tool_use_id|Result of calling|Caveat: The messages below/,
  /^\s*\[Image: original \d+x\d+/,
  /^\s*Continue from where you left off\.?\s*$/,
  /^This session is being continued/,
  /^\s*\/[a-zäöü-]+\b.{0,60}$/,          /* reine Slash-Aufrufe */
  /* ⛔ MEINE EIGENEN CRON-PROMPTS kommen als user-Nachricht zurueck. Ein
     Auftrag, den ich selbst fuer eine Nachtschicht oder eine Abschaltung
     geschrieben habe, ist kein Satz von Elias — und er kann im Vault nie
     woertlich stehen. Erkennungszeichen: er redet ueber Elias in der DRITTEN
     Person. Elias schreibt seinen eigenen Namen nicht.
     ⚠️ Nur zusammen mit der Laenge, damit eine kurze Nachricht, in der er
     seinen Namen doch einmal erwaehnt, nicht stillschweigend wegfaellt. */
  /* ⚠️ Der VOLLTEXT eines Skills landet als user-Nachricht im Transkript,
     sobald Elias ihn aufruft. Das sind Hunderte Zeilen, die natuerlich
     nirgends im Vault stehen — sie wuerden die Ausgabe zumuellen und den
     einen echten Befund darin unsichtbar machen. Die Anfangszeilen der
     Skills, die es hier gibt; bewusst eng, damit nichts von IHM wegfaellt. */
  /^\s*Aktualisiere mein Obsidian-Ged/,
  /^\s*Gib neuen Vokabeln und neuen Regeln/,
  /^\s*Arbeite unbeaufsichtigt weiter/,
  /^\s*Schreib eine Übergabe-Notiz/,
  /^\s*Prüft vor dem Start, ob sich Agenten/,
  /* ⚠️ ZWEI Wortlaute, nicht einer (09.09.2026). Ruft Elias einen Skill zum
     zweiten Mal in derselben Sitzung auf, antwortet die Umgebung mit
     „Skill /x is already loaded above; instructions unchanged." statt mit
     „was loaded earlier". Der Filter kannte nur die erste Fassung — und der
     Lauf meldete prompt „1 fehlt ganz" fuer einen Satz, den Elias nie gesagt
     hat. Ein Pruefer, der Falsches meldet, wird beim naechsten Mal ueberlesen.
     [[allgemeine_regel_statt_listeneintrag]] */
  /^\s*Skill \/[a-zäöü-]+ (?:was loaded earlier|is already loaded)/,
];

const roh = [];
for (let i = AB; i < zeilen.length; i++) {
  let o; try { o = JSON.parse(zeilen[i]); } catch { continue; }
  let t = '';
  if (o.type === 'attachment' && o.attachment?.type === 'queued_command') {
    const p = o.attachment.prompt;
    t = Array.isArray(p) ? p.filter(x => x?.type === 'text').map(x => x.text).join(' ') : String(p || '');
  } else if (o.type === 'user' || o.type === 'queue-operation') {
    const c = o.message?.content ?? o.content ?? o.prompt;
    if (typeof c === 'string') t = c;
    else if (Array.isArray(c)) t = c.filter(x => x?.type === 'text').map(x => x.text).join(' ');
  } else continue;
  t = t.trim();
  if (!t || RAUS.some(r => r.test(t))) continue;
  /* ⛔ ZITIERT ER MICH, GEHOERT MIR DAS ZITAT — nicht ihm.
     Antwortet Elias, indem er eine Zeile von mir zitiert, kommt die Nachricht
     als ein Block an:
         <!-- attach -->
         > Grammatik-Heft مُضَاف / مُضَاف إِلَيْهِ vertauscht
         habe bereits geändert
     Gesucht wurde dann der GANZE Block, und der kann im Vault nie stehen —
     die Haelfte davon ist mein eigener Text. Am 26.08.2026 meldete das
     Werkzeug so zwei Nachrichten als "fehlt ganz", deren eigentliche Aussage
     ("habe bereits geändert", "ja mach") laengst zweimal im Gedaechtnis stand.
     Eine Fehlmeldung, die man drei Runden lang nachprueft, ist teurer als die
     Luecke, die sie sucht. [[kandidatenliste_ist_keine_fehlerliste]] */
  t = t.split(/\r?\n/)
       .filter(z => !/^\s*<!--\s*attach\s*-->\s*$/.test(z) && !/^\s*>/.test(z))
       .join('\n').trim();
  if (!t) continue;
  if (t.length > 200 && /\bElias\b/.test(t)) continue;   // eigener Cron-Prompt
  roh.push({ i, t });
}
const gesehen = new Set();
const saetze = roh.filter(s => { const k = s.t.replace(/\s+/g, ' '); if (gesehen.has(k)) return false; gesehen.add(k); return true; });

if (!saetze.length) { console.error('⛔ 0 Aussagen gefunden — das kann nicht stimmen. Filter pruefen.'); process.exit(2); }

/* ---------- 2. Vault einlesen ---------- */
const DATEIEN = [];
(function sammle(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) sammle(p); else if (e.name.endsWith('.md')) DATEIEN.push(p);
  }
})(VAULT);
if (fs.existsSync(AUTO)) for (const f of fs.readdirSync(AUTO)) if (f.endsWith('.md')) DATEIEN.push(AUTO + f);

/* ⚠️ Ohne diese Normalisierung faellt JEDES Zitat durch, das im Vault ueber
   zwei Zeilen umbricht oder als Blockzitat mit "> " steht. */
const norm = s => String(s).toLowerCase()
  .replace(/[\u201e\u201c\u201d\u2018\u2019\u00ab\u00bb"']/g, '')
  .replace(/^\s*>\s?/gm, ' ')
  .replace(/[*_`\[\]()#]/g, '')
  .replace(/[\u2013\u2014]/g, '-')
  .replace(/\s+/g, ' ').trim();

const vault = new Map();
for (const p of DATEIEN) {
  try {
    vault.set(path.basename(p), norm(fs.readFileSync(p, 'utf8')));
  } catch {}
}
const fundorte = [];
console.log('Dateien: ' + vault.size + ' | Aussagen: ' + saetze.length + '\n');

/* ---------- 3. Suchen ---------- */
let woertlich = 0, teile = 0, fehlt = 0;
for (const s of saetze) {
  const ganz = norm(s.t);
  const treffer = [...vault].filter(([, t]) => t.includes(ganz)).map(([n]) => n);
  if (treffer.length) {
    woertlich++;
    /* ---------- ⛔⛔ WO steht der Satz eigentlich? (09.09.2026) ----------

       ANLASS, und schon wieder Elias' Frage „ist gedächtnis wirklich aktuell?":
       Er bat um einen Kurzbericht — *„gib mir einen kurzen bericht was du alles
       seit 2 uhr nachts heute gemacht hast"* —, das Werkzeug meldete
       „6 wörtlich · 0 fehlen", und der Satz stand in keiner Vokabeltrainer-Notiz.
       Gefunden wurde er in `03 - Projekte/Quran-Lesen-Lernen-App.md`: dieselbe
       Bitte, ANDERES PROJEKT, anderer Tag.

       ⭐ Die Suche fragt „steht dieser Satz IRGENDWO", die eigentliche Frage
       lautet „ist er DIESMAL aufgeschrieben worden". Ein gleichlautender Satz
       von früher beantwortet sie nicht.

       ⛔ Ein erster Versuch, das über das ALTER der Fundstelle zu entscheiden
       („liegt jede Fundstelle in einer Datei, die seit Sitzungsbeginn nicht
       angefasst wurde"), ging daneben: die Quran-Notiz war um 20:21 von einer
       PARALLEL laufenden Sitzung geschrieben worden und galt damit als frisch.
       Das Alter einer Datei sagt nichts darüber, WER sie geschrieben hat.
       [[zwei_sitzungen_eine_todo]] [[mein_neues_werkzeug_ist_verdaechtig]]

       ⭐ Deshalb kein Urteil, sondern die Tatsache: am Ende steht, WO jeder
       Satz gefunden wurde. Eine Fundstelle im falschen Projekt sieht man dann
       in einer Sekunde. [[zahlen_ohne_beleg]] */
    fundorte.push({ i: s.i, t: s.t, wo: treffer });
    continue;
  }

  /* Nicht woertlich — welches STUECK fehlt? Sechs Woerter, Schritt drei. */
  const w = ganz.split(' ');
  const stuecke = [];
  for (let k = 0; k + 6 <= w.length; k += 3) stuecke.push(w.slice(k, k + 6).join(' '));
  if (!stuecke.length) stuecke.push(ganz);
  const belegt = stuecke.filter(st => [...vault.values()].some(t => t.includes(st)));

  if (!belegt.length) {
    fehlt++;
    console.log('⛔ FEHLT GANZ  [Z' + s.i + ']');
    console.log('   \u201e' + s.t.replace(/\s+/g, ' ').slice(0, 140) + '\u201c\n');
  } else {
    teile++;
    console.log('⚠️  NUR SINNGEM\u00c4SS  [Z' + s.i + ']  (' + belegt.length + '/' + stuecke.length + ' Textst\u00fccke belegt)');
    console.log('   \u201e' + s.t.replace(/\s+/g, ' ').slice(0, 140) + '\u201c');
    const offen = stuecke.filter(st => !belegt.includes(st));
    console.log('   nicht belegt: \u201e' + offen.slice(0, 2).join('\u201c \u00b7 \u201e') + '\u201c\n');
  }
}
/* \u2b50 WO die woertlichen Treffer stehen \u2014 die Tatsache, nicht ein Urteil.
   Ein Satz, der nur in der Notiz eines ANDEREN Projekts steht, ist hier in
   einer Sekunde zu sehen; genau so ist der Kurzbericht-Auftrag am 09.09.
   durchgerutscht (gefunden in Quran-Lesen-Lernen-App.md). */
if (fundorte.length) {
  console.log('Wo die woertlichen Treffer stehen:');
  for (const f of fundorte)
    console.log('  [Z' + String(f.i).padStart(5) + '] '
      + f.t.replace(/\s+/g, ' ').slice(0, 46).padEnd(48)
      + f.wo.slice(0, 2).join(', ') + (f.wo.length > 2 ? ' +' + (f.wo.length - 2) : ''));
  console.log('');
}
console.log('=== ' + woertlich + ' w\u00f6rtlich \u00b7 ' + teile + ' nur sinngem\u00e4ss \u00b7 ' + fehlt + ' fehlen ganz ===');
if (teile) console.log('   (Eine mit \u201e\u2026\u201c gekennzeichnete K\u00fcrzung ist in Ordnung \u2014 jede Zeile lesen,');
if (teile) console.log('    Kandidatenliste ist keine Fehlerliste.)');
process.exit(fehlt ? 1 : 0);
