/* hole-vokabeln.mjs -- zieht die komplette arabicroots-Datenbank und schreibt
 * je Buch eine Datendatei nach data/.
 *
 * Aufruf (aus dem Repo-Wurzelverzeichnis):
 *   node werkzeuge/hole-vokabeln.mjs
 *
 * Warum ein eigenes Skript und nicht der MCP-Server: der Abzug sind ueber
 * 4000 Eintraege. Ueber die MCP-Werkzeuge liefe jede Zeile durch Claudes
 * Kontextfenster - unbezahlbar und unnoetig, denn die Daten sollen ja gar
 * nicht gelesen, sondern nur abgelegt werden. Das Skript benutzt dieselben
 * kompilierten Module wie der MCP-Server, also auch dieselbe Anmeldung aus
 * dessen .env. Zugangsdaten werden hier weder gelesen noch ausgegeben.
 *
 * Ergebnis: data/vokabeln-<buch>.js, jede Datei setzt
 *   window.VOKABELN['<buch>'] = [ ... ]
 * damit der Nachlader in js/vokabelquellen.js sie einhaengen kann.
 */
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HIER, '..');
const MCP  = 'G:/1. Workspace/MCP-Servers/arabicroots';

const { loadEnvFile }   = await import(pathToFileURL(`${MCP}/dist/loadEnv.js`));
const { SupabaseAuth }  = await import(pathToFileURL(`${MCP}/dist/auth.js`));
const { SupabaseClient }= await import(pathToFileURL(`${MCP}/dist/supabaseClient.js`));

loadEnvFile(path.join(MCP, '.env'));
const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_ANON_KEY;
if (!url || !key){ console.error('SUPABASE_URL / SUPABASE_ANON_KEY fehlen in der .env des MCP-Servers.'); process.exit(1); }
const db = new SupabaseClient(url, key, new SupabaseAuth(url, key));

console.log('Hole vocabulary ...');
const alle = await db.selectAll('vocabulary', { order: 'book_slug.asc,chapter_position.asc,vocab_position.asc' });
console.log(`  ${alle.length} Eintraege.`);

/* Nur die Felder, die die App wirklich benutzt. Der Rohsatz traegt u.a.
   created_at und interne Zaehler mit - die blaehen die Datei auf, ohne dass
   sie irgendwo gelesen wuerden. */
const schlank = v => ({
  id: String(v.id),
  ar: v.arabic,
  de: v.german,
  type: v.word_type,
  chapter: v.chapter_position,
  gender: v.gender,
  sg: v.singular,
  pl: v.plural,
  femSg: v.feminine_singular,
  femPl: v.feminine_plural,
  root: v.root,
  past: v.verb_past,
  present: v.verb_present,
  imperative: v.verb_imperative,
  masdar: v.verbal_noun,
  note: v.notes,
  book: v.book_slug,
  source: 'vocabulary'
});

const nachBuch = {};
for (const v of alle) (nachBuch[v.book_slug] ||= []).push(schlank(v));

const DATA = path.join(REPO, 'data');
fs.mkdirSync(DATA, { recursive: true });

const uebersicht = [];
for (const [buch, liste] of Object.entries(nachBuch)) {
  const datei = path.join(DATA, `vokabeln-${buch}.js`);
  const kapitel = [...new Set(liste.map(v => v.chapter))].sort((a,b)=>a-b);
  const kopf =
`/* Automatisch erzeugt von werkzeuge/hole-vokabeln.mjs - nicht von Hand aendern.
   Quelle: arabicroots-Datenbank, Buch "${buch}".
   ${liste.length} Vokabeln, Kapitel ${kapitel[0]}-${kapitel[kapitel.length-1]}. */
(window.VOKABELN = window.VOKABELN || {})[${JSON.stringify(buch)}] =
`;
  fs.writeFileSync(datei, kopf + JSON.stringify(liste, null, 1) + ';\n', 'utf8');
  const kb = Math.round(fs.statSync(datei).size / 1024);
  uebersicht.push({ buch, vokabeln: liste.length, kapitel: kapitel.length, kb });
}

/* ---------- Eigene Vokabeln aus arabicroots (C8, 18.08.2026) --------------

   Elias' Entscheidung: „ja."

   Bis hierher hat das Skript nur die Tabelle `vocabulary` geholt - also den
   Lehrbuchstoff. Was Elias sich auf arabicroots SELBST eingetragen hat, lag in
   `personal_vocabulary` und kam im Abzug gar nicht vor. Er hat es also nur
   dort, nirgends sonst; ein verlorener Zugang haette es mitgenommen.

   Sie landen in einer eigenen Datei und NICHT unter window.VOKABELN. Sonst
   waeren sie ein „Buch" und stuenden mit einem Auswahlknopf neben Madina 1 -
   sie sind aber kein Buch, sondern seine eigene Liste.

   ⚠️ Diese Datei faellt unter dieselbe Sperre wie die uebrigen data/vokabeln-*
   Dateien: arabicroots-AGB Ziffer 3.7 und 9, also .gitignore, niemals ins Repo.
   Ausgeliefert wird sie nur ueber veroeffentlichen.mjs --mit-daten, und das
   verlangt den Beleg, dass beide Adressen hinter dem Login liegen. */
console.log('Hole personal_vocabulary ...');
let eigene = [];
try {
  eigene = await db.select('personal_vocabulary', { order: 'created_at.desc' });
} catch (e) {
  /* Kein Abbruch: der Lehrbuchstoff ist schon geschrieben, und der ist der
     Hauptzweck. Aber sichtbar melden - eine leere Datei saehe hinterher aus
     wie „er hat keine eigenen Woerter". */
  console.error('  FEHLGESCHLAGEN:', e.message);
  eigene = null;
}
if (Array.isArray(eigene)) {
  console.log(`  ${eigene.length} eigene Vokabeln.`);
  const eigenSchlank = eigene.map(v => ({
    /* ⛔ Die Id bleibt die nackte UUID - KEIN Praefix.

       Ich hatte zuerst 'ar_' davorgesetzt, mit dem Argument, eine Zahlen-Id
       des Lehrbuchstoffs koennte auf eine UUID treffen. Das Argument war
       theoretisch (eine UUID ist nie eine Zahl), und der Preis war real:
       im Browser nachgemessen standen danach **22 statt 11** Woerter da.
       Dieselben elf zweimal.

       Der Grund: die elf sind laengst in der App - ueber das Vokabelpaket im
       Geraetespeicher (js/vokabelpaket.js), mit der nackten UUID als Id. Und
       die dortige Fassung ist die BESSERE: „Zwei (2)" statt „Zwei 2",
       „Genitiv-Praeposition" statt „Genitiv Praeposition", مُضَافْ إِلَيْهِ mit
       dem Sukun auf dem Ya. Das sind Elias' eigene Korrekturen.

       Mit derselben Id greift die Doppelpruefung beim Einhaengen, die Fassung
       aus dem Paket gewinnt, und die Datei ist das, was sie sein soll: der
       Rueckhalt, falls der Geraetespeicher einmal weg ist. */
    id: String(v.id),
    ar: v.arabic,
    de: v.german,
    type: v.word_type,
    chapter: 'personal',             /* zeigt sie in der App unter „Eigene
                                        Vokabeln" - dort sucht er sie. */
    gender: v.gender,
    sg: v.singular,
    pl: v.plural,
    femSg: v.feminine_singular,
    femPl: v.feminine_plural,
    past: v.verb_past,
    present: v.verb_present,
    imperative: v.verb_imperative,
    masdar: v.verbal_noun,
    note: v.notes,
    source: 'personal_vocabulary'    /* damit spaeter unterscheidbar bleibt, was
                                        aus arabicroots kommt und was er im
                                        Trainer selbst angelegt hat. */
  }));
  fs.writeFileSync(path.join(DATA, 'vokabeln-eigene.js'),
`/* Automatisch erzeugt von werkzeuge/hole-vokabeln.mjs - nicht von Hand aendern.
   Quelle: arabicroots-Tabelle "personal_vocabulary", ${eigenSchlank.length} Eintraege.
   Bewusst NICHT unter window.VOKABELN: das sind keine Buchvokabeln und sollen
   in der Buchauswahl nicht als achtes Buch erscheinen. */
window.EIGENE_VOKABELN = ${JSON.stringify(eigenSchlank, null, 1)};
`, 'utf8');
  console.log(`  Geschrieben: data/vokabeln-eigene.js`);
}

/* Ein kleines Verzeichnis, damit die App weiss, was es gibt, ohne alles zu laden. */
fs.writeFileSync(path.join(DATA, 'buecher.js'),
`/* Automatisch erzeugt von werkzeuge/hole-vokabeln.mjs.
   Verzeichnis der verfuegbaren Buecher. Die App laedt daraus zuerst nur das
   Buch, in dem gelernt wird; die uebrigen kommen beim Umschalten dazu. */
const BUECHER = ${JSON.stringify(uebersicht.map(u => ({
  slug: u.buch, vokabeln: u.vokabeln, kapitel: u.kapitel,
  datei: `data/vokabeln-${u.buch}.js`
})), null, 1)};
`, 'utf8');

console.table(uebersicht);
console.log('Geschrieben nach', DATA);
