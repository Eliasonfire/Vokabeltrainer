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
  /^\s*Skill \/[a-zäöü-]+ was loaded earlier/,
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
for (const p of DATEIEN) { try { vault.set(path.basename(p), norm(fs.readFileSync(p, 'utf8'))); } catch {} }
console.log('Dateien: ' + vault.size + ' | Aussagen: ' + saetze.length + '\n');

/* ---------- 3. Suchen ---------- */
let woertlich = 0, teile = 0, fehlt = 0;
for (const s of saetze) {
  const ganz = norm(s.t);
  const treffer = [...vault].filter(([, t]) => t.includes(ganz)).map(([n]) => n);
  if (treffer.length) { woertlich++; continue; }

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
console.log('=== ' + woertlich + ' w\u00f6rtlich \u00b7 ' + teile + ' nur sinngem\u00e4ss \u00b7 ' + fehlt + ' fehlen ganz ===');
if (teile) console.log('   (Eine mit \u201e\u2026\u201c gekennzeichnete K\u00fcrzung ist in Ordnung \u2014 jede Zeile lesen,');
if (teile) console.log('    Kandidatenliste ist keine Fehlerliste.)');
process.exit(fehlt ? 1 : 0);
