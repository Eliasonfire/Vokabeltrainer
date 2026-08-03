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
