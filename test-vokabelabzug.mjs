/* Prueft: der Vokabelabzug wird nie weniger (27.09.2026).
 *
 * Elias, auf die Frage, was nach dem Ende seines arabicroots-Zugangs mit den
 * Vokabeln passiert: „am besten ist doch wenn es nicht weniger wird sondern
 * nur mehr oder? also weniger soll nicht werden aber kann mehr werden"
 *
 * Geprueft wird das ECHTE werkzeuge/hole-vokabeln.mjs und das echte
 * werkzeuge/baue-vokabelpaket.mjs - als Kopie in einem Ordner unter %TEMP%,
 * arabicroots durch eine Attrappe ersetzt. data/, der Downloads-Ordner und
 * arabicroots werden nicht beruehrt. Die Woerter unten sind Platzhalter, keine
 * arabicroots-Daten (AGB 3.7/9).
 *
 * Zwei Stoertests belegen, dass der Test rot werden kann: ohne das
 * Zusammenfuehren schrumpft die Buchdatei, ohne die Paketsperre das Paket.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.dirname(fileURLToPath(import.meta.url));
const MCP_ZEILE = "const MCP  = 'G:/1. Workspace/MCP-Servers/arabicroots';";
const ZUSAMMEN  = 'const bleibt = (bisher[buch] || []).filter(v => !neueIds.has(String(v.id)));';
const SPERRE    = 'if (weniger.length){';

let ok = 0, schlecht = 0, stoer = false;
function pruefe(was, bedingung, zusatz){
  if (bedingung){ ok++; console.log('  ok   ' + was); }
  else { schlecht++; console.log('  FEHL ' + was + (zusatz ? '  → ' + zusatz : '')); }
}

const ATTRAPPE = `import fs from 'node:fs';
const antwort = t => JSON.parse(fs.readFileSync(process.env.SIM_ANTWORT, 'utf8'))[t];
export class SupabaseClient {
  constructor(){}
  async selectAll(t){ const a = antwort(t); if (a === 'fehler') throw new Error(t + ' fehlgeschlagen (401): nicht angemeldet'); return a || []; }
  async select(t){ const a = antwort(t); if (a === 'fehler') throw new Error(t + ' fehlgeschlagen (401)'); return a || []; }
}
`;

/* Ein Arbeitsordner wie das Repo: werkzeuge/ mit den zwei Skripten, data/,
   dazu die Attrappe des MCP-Servers und ein Ersatz fuer den Downloads-Ordner. */
const ORDNER = [];
function ordner(st = {}){
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'vt-abzug-'));
  ORDNER.push(d);
  for (const u of ['werkzeuge', 'data', 'mcp/dist', 'ablage']) fs.mkdirSync(path.join(d, u), { recursive: true });
  let hole = fs.readFileSync(path.join(REPO, 'werkzeuge', 'hole-vokabeln.mjs'), 'utf8');
  if (!hole.includes(MCP_ZEILE)) throw new Error('hole-vokabeln.mjs: MCP-Zeile nicht gefunden - Test anpassen');
  hole = hole.replace(MCP_ZEILE, 'const MCP = process.env.SIM_MCP;');
  if (st.ohneZusammen){
    if (!hole.includes(ZUSAMMEN)) throw new Error('Stoertest: Zusammenfuehren nicht gefunden - Test anpassen');
    hole = hole.replace(ZUSAMMEN, 'const bleibt = [];');
  }
  fs.writeFileSync(path.join(d, 'werkzeuge', 'hole-vokabeln.mjs'), hole);
  let baue = fs.readFileSync(path.join(REPO, 'werkzeuge', 'baue-vokabelpaket.mjs'), 'utf8');
  if (st.ohneSperre){
    if (!baue.includes(SPERRE)) throw new Error('Stoertest: Paketsperre nicht gefunden - Test anpassen');
    baue = baue.replace(SPERRE, 'if (false){');
  }
  fs.writeFileSync(path.join(d, 'werkzeuge', 'baue-vokabelpaket.mjs'), baue);
  fs.writeFileSync(path.join(d, 'mcp', 'dist', 'loadEnv.js'), "export function loadEnvFile(){ process.env.SUPABASE_URL = 'sim'; process.env.SUPABASE_ANON_KEY = 'sim'; }\n");
  fs.writeFileSync(path.join(d, 'mcp', 'dist', 'auth.js'), 'export class SupabaseAuth { constructor(){} }\n');
  fs.writeFileSync(path.join(d, 'mcp', 'dist', 'supabaseClient.js'), ATTRAPPE);
  return d;
}

function lauf(d, skript, antwort){
  if (antwort) fs.writeFileSync(path.join(d, 'antwort.json'), JSON.stringify(antwort));
  const env = { ...process.env,
    SIM_ANTWORT: path.join(d, 'antwort.json'),
    SIM_MCP: path.join(d, 'mcp').replace(/\\/g, '/'),
    VOKABELPAKET_ABLAGE: path.join(d, 'ablage') };
  const r = spawnSync(process.execPath, [path.join(d, 'werkzeuge', skript)], { cwd: d, env, encoding: 'utf8' });
  return { code: r.status, aus: (r.stdout || '') + (r.stderr || '') };
}

const text  = (d, f) => { const p = path.join(d, f); return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null; };
const liste = (d, f) => {
  const t = text(d, f); if (t == null) return null;
  const m = t.match(/=\s*(\[[\s\S]*\])\s*;?\s*$/); return m ? JSON.parse(m[1]) : null;
};
const ids = l => (l || []).map(v => v.id);
const gleich = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const DATEIEN = ['data/buecher.js', 'data/vokabeln-buchA.js', 'data/vokabeln-buchB.js', 'data/vokabeln-buchC.js',
  'data/vokabeln-eigene.js', 'vokabelpaket.json', 'ablage/vokabelpaket.json'];
const schnappschuss = d => Object.fromEntries(DATEIEN.map(f => [f, text(d, f)]));
const unveraendert = (a, b) => DATEIEN.every(f => a[f] === b[f]);

/* Rohzeilen, wie arabicroots sie liefert (nur die Felder, die hier zaehlen) */
const roh = (id, kap, buch) => ({ id, arabic: 'ar-' + id, german: 'de-' + id, word_type: 'noun', chapter_position: kap, book_slug: buch });
const eig = id => ({ id, arabic: 'ar-' + id, german: 'de-' + id, word_type: 'other' });
const A1 = roh(1, 1, 'buchA'), A2 = roh(2, 1, 'buchA'), A3 = roh(3, 2, 'buchA');
const B4 = roh(4, 1, 'buchB'), B5 = roh(5, 1, 'buchB');
const E1 = eig('u-1'), E2 = eig('u-2');
const GRUND = { vocabulary: [A1, A2, A3, B4, B5], personal_vocabulary: [E1, E2] };

function grundstand(st){
  const d = ordner(st);
  const r = lauf(d, 'hole-vokabeln.mjs', GRUND);
  if (r.code !== 0) throw new Error('Grundstand nicht erzeugt: ' + r.aus.slice(-400));
  return d;
}

/* Buch B "auf anderem Weg" auf ein Wort schrumpfen - Verzeichnis passend, damit
   die Sollzahl-Pruefung von baue-vokabelpaket.mjs durchgeht. */
function schrumpfeB(d){
  const b = liste(d, 'data/vokabeln-buchB.js').slice(0, 1);
  fs.writeFileSync(path.join(d, 'data', 'vokabeln-buchB.js'),
    `/* geschrumpft */\n(window.VOKABELN = window.VOKABELN || {})["buchB"] =\n${JSON.stringify(b, null, 1)};\n`);
  const v = liste(d, 'data/buecher.js').map(x => x.slug === 'buchB' ? { ...x, vokabeln: 1 } : x);
  fs.writeFileSync(path.join(d, 'data', 'buecher.js'), `const BUECHER = ${JSON.stringify(v, null, 1)};\n`);
}

try {
  console.log('\n1. Dieselbe Antwort noch einmal: alles bleibt Byte für Byte gleich');
  {
    const d = grundstand(); const vor = schnappschuss(d);
    const r = lauf(d, 'hole-vokabeln.mjs', GRUND);
    pruefe('Exit 0', r.code === 0, r.aus.slice(-300));
    pruefe('alle Dateien unverändert', unveraendert(vor, schnappschuss(d)));
    pruefe('kein „BEHALTEN" in der Ausgabe', !/BEHALTEN/.test(r.aus));
  }

  console.log('\n2. arabicroots liefert nichts, ohne Fehler (Zugang zu Ende?)');
  {
    const d = grundstand();
    let r = lauf(d, 'baue-vokabelpaket.mjs');
    pruefe('erstes Paket gebaut', r.code === 0 && text(d, 'ablage/vokabelpaket.json') != null, r.aus.slice(-300));
    const vor = { A: liste(d, 'data/vokabeln-buchA.js'), B: liste(d, 'data/vokabeln-buchB.js'),
      E: liste(d, 'data/vokabeln-eigene.js'), V: liste(d, 'data/buecher.js'), kopie: text(d, 'ablage/vokabelpaket.json') };
    r = lauf(d, 'hole-vokabeln.mjs', { vocabulary: [], personal_vocabulary: [] });
    pruefe('Exit 0', r.code === 0, r.aus.slice(-300));
    pruefe('Buch A vollständig (3)', gleich(liste(d, 'data/vokabeln-buchA.js'), vor.A));
    pruefe('Buch B vollständig (2)', gleich(liste(d, 'data/vokabeln-buchB.js'), vor.B));
    pruefe('Eigenliste vollständig (2)', gleich(liste(d, 'data/vokabeln-eigene.js'), vor.E));
    pruefe('Verzeichnis unverändert (2 Bücher)', gleich(liste(d, 'data/buecher.js'), vor.V));
    pruefe('meldet „0 Vokabeln geliefert"', /0 Vokabeln geliefert/.test(r.aus));
    pruefe('meldet „BEHALTEN" für A, B und die Eigenliste', /buchA\s+3/.test(r.aus) && /buchB\s+2/.test(r.aus) && /eigene\s+2/.test(r.aus), r.aus.slice(-400));
    r = lauf(d, 'baue-vokabelpaket.mjs');
    pruefe('Paket danach „UNVERAENDERT"', r.code === 0 && /UNVERAENDERT/.test(r.aus), r.aus.slice(-300));
    pruefe('Kopie im Downloads-Ersatz unberührt', text(d, 'ablage/vokabelpaket.json') === vor.kopie);
  }

  console.log('\n3. arabicroots liefert nur einen Teil, eins davon korrigiert');
  {
    const d = grundstand();
    const r = lauf(d, 'hole-vokabeln.mjs', { vocabulary: [{ ...A1, german: 'de-1 korrigiert' }], personal_vocabulary: [E1] });
    const A = liste(d, 'data/vokabeln-buchA.js'), B = liste(d, 'data/vokabeln-buchB.js');
    const E = liste(d, 'data/vokabeln-eigene.js'), V = liste(d, 'data/buecher.js');
    pruefe('Exit 0', r.code === 0, r.aus.slice(-300));
    pruefe('Buch A hat weiter 3, in der alten Reihenfolge', gleich(ids(A), ['1', '2', '3']), JSON.stringify(ids(A)));
    pruefe('die Korrektur ist angekommen', A && A[0].de === 'de-1 korrigiert');
    pruefe('Buch B bleibt mit 2', B && B.length === 2);
    pruefe('Eigenliste hat weiter 2', E && E.length === 2);
    pruefe('Verzeichnis: A 3, B 2', V && V.length === 2 && V[0].vokabeln === 3 && V[1].vokabeln === 2, JSON.stringify(V));
    pruefe('„BEHALTEN" nennt A 2, B 2, eigene 1', /buchA\s+2/.test(r.aus) && /buchB\s+2/.test(r.aus) && /eigene\s+1/.test(r.aus), r.aus.slice(-400));
  }

  console.log('\n4. arabicroots liefert mehr: neues Wort, neues Buch, neues eigenes Wort');
  {
    const d = grundstand();
    const r = lauf(d, 'hole-vokabeln.mjs', { vocabulary: [A1, A2, A3, roh(6, 2, 'buchA'), B4, B5, roh(7, 1, 'buchC')],
      personal_vocabulary: [eig('u-3'), E1, E2] });
    const V = liste(d, 'data/buecher.js');
    pruefe('Exit 0', r.code === 0, r.aus.slice(-300));
    pruefe('Buch A 4, B 2, C 1', liste(d, 'data/vokabeln-buchA.js').length === 4 && liste(d, 'data/vokabeln-buchB.js').length === 2
      && liste(d, 'data/vokabeln-buchC.js').length === 1);
    pruefe('Verzeichnis A, B, C', gleich(V.map(b => b.slug), ['buchA', 'buchB', 'buchC']), JSON.stringify(V));
    pruefe('Eigenliste 3', liste(d, 'data/vokabeln-eigene.js').length === 3);
    pruefe('kein „BEHALTEN"', !/BEHALTEN/.test(r.aus));
  }

  console.log('\n5. Ein Wort wandert in ein anderes Buch: danach nur dort, nicht doppelt');
  {
    const d = grundstand();
    const r = lauf(d, 'hole-vokabeln.mjs', { vocabulary: [A1, A3, { ...A2, book_slug: 'buchB' }, B4, B5], personal_vocabulary: [E1, E2] });
    const alleIds = [...ids(liste(d, 'data/vokabeln-buchA.js')), ...ids(liste(d, 'data/vokabeln-buchB.js'))];
    pruefe('Exit 0', r.code === 0, r.aus.slice(-300));
    pruefe('Wort 2 steht genau einmal, in Buch B', alleIds.filter(i => i === '2').length === 1
      && ids(liste(d, 'data/vokabeln-buchB.js')).includes('2'), JSON.stringify(alleIds));
    pruefe('kein „BEHALTEN"', !/BEHALTEN/.test(r.aus));
  }

  console.log('\n6. arabicroots meldet einen Fehler: nichts wird geschrieben');
  {
    const d = grundstand(); const vor = schnappschuss(d);
    const r = lauf(d, 'hole-vokabeln.mjs', { vocabulary: 'fehler', personal_vocabulary: 'fehler' });
    pruefe('Exit ungleich 0', r.code !== 0);
    pruefe('alle Dateien unverändert', unveraendert(vor, schnappschuss(d)));
  }

  console.log('\n7. Eine bisherige Datei ist unlesbar: Abbruch, BEVOR etwas geschrieben ist');
  {
    const d = grundstand();
    fs.writeFileSync(path.join(d, 'data', 'vokabeln-buchB.js'), 'kaputt');
    const vor = schnappschuss(d);
    const r = lauf(d, 'hole-vokabeln.mjs', GRUND);
    pruefe('Exit ungleich 0', r.code !== 0);
    pruefe('nichts geschrieben, auch Buch A nicht', unveraendert(vor, schnappschuss(d)));
  }

  console.log('\n8. Das Paket wird nie kleiner, mehr geht');
  {
    const d = grundstand();
    let r = lauf(d, 'baue-vokabelpaket.mjs');
    pruefe('erstes Paket gebaut', r.code === 0, r.aus.slice(-300));
    const paketVor = text(d, 'vokabelpaket.json'), kopieVor = text(d, 'ablage/vokabelpaket.json');
    schrumpfeB(d);
    r = lauf(d, 'baue-vokabelpaket.mjs');
    pruefe('geschrumpftes Buch: Exit 1 und „WENIGER"', r.code === 1 && /WENIGER/.test(r.aus), r.aus.slice(-300));
    pruefe('vokabelpaket.json nicht angefasst', text(d, 'vokabelpaket.json') === paketVor);
    pruefe('Kopie im Downloads-Ersatz nicht angefasst', text(d, 'ablage/vokabelpaket.json') === kopieVor);
    r = lauf(d, 'hole-vokabeln.mjs', { vocabulary: [A1, A2, A3, roh(6, 2, 'buchA'), B4, B5], personal_vocabulary: [E1, E2] });
    r = lauf(d, 'baue-vokabelpaket.mjs');
    const paket = JSON.parse(text(d, 'ablage/vokabelpaket.json'));
    pruefe('mit einem Wort mehr: „GEAENDERT", Paket 6', r.code === 0 && /GEAENDERT/.test(r.aus)
      && Object.values(paket.buecher).reduce((a, l) => a + l.length, 0) === 6, r.aus.slice(-300));
  }

  console.log('\nStoertest 1: ohne das Zusammenführen schrumpft Buch A');
  {
    const d = grundstand({ ohneZusammen: true });
    lauf(d, 'hole-vokabeln.mjs', { vocabulary: [A1], personal_vocabulary: [E1] });
    const n = (liste(d, 'data/vokabeln-buchA.js') || []).length;
    if (n < 3) console.log(`  ok   greift (Buch A danach ${n} statt 3)`);
    else { stoer = true; console.log('  FEHL greift nicht'); }
  }

  console.log('\nStoertest 2: ohne die Paketsperre wird die Downloads-Kopie kleiner');
  {
    const d = grundstand({ ohneSperre: true });
    lauf(d, 'baue-vokabelpaket.mjs');
    const kopieVor = text(d, 'ablage/vokabelpaket.json');
    schrumpfeB(d);
    const r = lauf(d, 'baue-vokabelpaket.mjs');
    if (r.code === 0 && text(d, 'ablage/vokabelpaket.json') !== kopieVor) console.log('  ok   greift (kleineres Paket überschreibt die Kopie)');
    else { stoer = true; console.log('  FEHL greift nicht'); }
  }
} finally {
  for (const d of ORDNER) fs.rmSync(d, { recursive: true, force: true });
}

console.log(`\n${ok} bestanden, ${schlecht} gescheitert.`);
if (stoer){
  console.log('⛔ Ein Stoertest greift nicht — die Faelle oben sagen nichts.');
  process.exitCode = 3;
} else process.exitCode = schlecht ? 1 : 0;
