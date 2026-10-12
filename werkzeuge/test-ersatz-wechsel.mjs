/* test-ersatz-wechsel.mjs -- hält der Wechsel auf die Ersatzdatenbank, und kommt man wieder zurück?
 *
 * Elias, 11.10.2026: „… genauso organisiert … wie die bei arabicroots damit man … nahtlos wechseln kann ohne
 * probleme". Bewacht werden ersatz-wechsel.mjs, datenquelle.mjs und die zwei Stellen, die nach einem Wechsel
 * anders arbeiten müssen: hole-vokabeln.mjs (der Abzug schreibt dann nach data-abzug/) und baue-vokabelpaket.mjs
 * (das Paket darf um genau die benannten Plätze kleiner werden).
 *
 * Alles läuft in Wegwerfordnern unter %TEMP%: die echten Skripte, arabicroots durch eine Attrappe ersetzt (wie
 * in test-vokabelabzug.mjs), eine kleine Ersatzdatenbank mit zwei Büchern. Der echte Ordner wird am Ende nur
 * GELESEN. Die Wörter sind Platzhalter, keine arabicroots-Daten; arabische Zeichen entstehen aus Nummern.
 * Die Kennung 46414 steht in WEGGELASSEN (datenquelle.mjs) und dient hier als „darf fehlen", 9001–9004 als
 * „darf nicht fehlen".
 *
 * Drei Störtests belegen, dass der Test rot werden kann. Exit 0 = hält · 1 = ein Fall scheitert · 3 = ein
 * Störtest greift nicht. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ABZUG_GEPARKT, abzugGeparkt, abzugOrdner, liesListe, WEGGELASSEN } from './datenquelle.mjs';
import { stand, vorbedingungen, unterschied, unterschiedVoll, ausgabenLesen, vollstaendigAus } from './ersatz-wechsel.mjs';
import { ladeBuch } from './ersatz-bama-lib.mjs';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HIER, '..');
const MCP_ZEILE = "const MCP  = 'G:/1. Workspace/MCP-Servers/arabicroots';";
const KARTENSPERRE = 'if (ersatzImWeg.length) {';
const LISTENZEILE = 'return fehlt.length && fehlt.every(id => WEGGELASSEN.includes(id)) ? fehlt : null;';
const SATZ = 'Probe: schalte um';
const BAYT = String.fromCodePoint(0x628, 0x64E, 0x64A, 0x652, 0x62A, 0x64C);
const KATABA = String.fromCodePoint(0x643, 0x64E, 0x62A, 0x64E, 0x628, 0x64E);

let ok = 0, schlecht = 0, stoer = false;
function pruefe(was, bedingung, zusatz) {
  if (bedingung) { ok++; console.log('  ok   ' + was); }
  else { schlecht++; console.log('  FEHL ' + was + (zusatz ? '  → ' + String(zusatz).slice(-600) : '')); }
}
function greift(was, bedingung) {
  if (bedingung) console.log('  ok   greift (' + was + ')');
  else { stoer = true; console.log('  FEHL greift nicht (' + was + ')'); }
}

/* ---------- Die Welt: Abzug in data/, Ersatzdatenbank in data-ersatz/ --------------------------------------- */
const ATTRAPPE = `import fs from 'node:fs';
const antwort = t => JSON.parse(fs.readFileSync(process.env.SIM_ANTWORT, 'utf8'))[t];
export class SupabaseClient {
  constructor(){}
  async selectAll(t){ return antwort(t) || []; }
  async select(t){ return antwort(t) || []; }
}
`;
const roh = (id, kap, buch) => ({ id, arabic: 'ar-' + id, german: 'alt-' + id, word_type: 'noun', chapter_position: kap, book_slug: buch });
const eig = id => ({ id, arabic: 'ar-' + id, german: 'de-' + id, word_type: 'other' });
const GRUND = { vocabulary: [roh(9001, 1, 'madina-1'), roh(9002, 1, 'madina-1'), roh(9003, 1, 'madina-2'), roh(46414, 2, 'madina-2')], personal_vocabulary: [eig('u-1')] };

const leer = { pl: null, femSg: null, femPl: null, root: null, present: null, imperative: null, masdar: null, note: null };
const nomen = (id, buch, de) => ({ id, ar: BAYT, de, type: 'noun', chapter: 1, gender: 'masculine', sg: BAYT, ...leer, past: null, book: buch, source: 'ersatz' });
const verb = (id, buch, de) => ({ id, ar: KATABA, de, type: 'verb', chapter: 1, gender: null, sg: null, ...leer, past: KATABA, book: buch, source: 'ersatz' });
const belegNomen = { status: 'belegt', felder: { ar: { wo: 'Probe A', q: 'enwikt' }, de: { wo: 'Probe B', q: 'direkt' }, type: { wo: 'Probe C', q: 'enwikt' }, gender: { wo: 'Probe D', q: 'enwikt' }, sg: { wo: 'Probe A', q: 'enwikt' } } };
const belegVerb = { status: 'belegt', felder: { ar: { wo: 'Probe E', q: 'enwikt' }, de: { wo: 'Probe F', q: 'kette' }, type: { wo: 'Probe G', q: 'enwikt' }, past: { wo: 'Probe E', q: 'enwikt' } } };
function ersatzStand() {
  return {
    plaetze: [{ id: '9001', buch: 'madina-1', kap: 1, platz: 1 }, { id: '9002', buch: 'madina-1', kap: 1, platz: 2 }, { id: '9003', buch: 'madina-2', kap: 1, platz: 1 }, { id: '46414', buch: 'madina-2', kap: 2, platz: 2 }],
    karten: { 'madina-1': [nomen('9001', 'madina-1', 'Haus'), verb('9002', 'madina-1', 'schreiben')], 'madina-2': [nomen('9003', 'madina-2', 'Zuhause')] },
    belege: { 'madina-1': { 9001: belegNomen, 9002: belegVerb }, 'madina-2': { 9003: belegNomen } },
    nichtGefunden: [{ id: '46414', buch: 'madina-2', kap: 2, platz: 2, grund: 'Probe: in keiner Quelle' }],
  };
}
function schreibeErsatz(d, s) {
  const e = path.join(d, 'data-ersatz');
  fs.mkdirSync(e, { recursive: true });
  fs.writeFileSync(path.join(e, 'plaetze.json'), JSON.stringify(s.plaetze));
  fs.writeFileSync(path.join(e, 'nicht-gefunden.json'), JSON.stringify(s.nichtGefunden));
  const verzeichnis = [];
  for (const [buch, karten] of Object.entries(s.karten)) {
    fs.writeFileSync(path.join(e, 'vokabeln-' + buch + '.js'), `/* Probe */\n(window.VOKABELN = window.VOKABELN || {})[${JSON.stringify(buch)}] =\n${JSON.stringify(karten, null, 1)};\n`);
    fs.writeFileSync(path.join(e, 'belege-' + buch + '.json'), JSON.stringify(s.belege[buch]));
    verzeichnis.push({ slug: buch, vokabeln: karten.length, kapitel: new Set(karten.map(k => k.chapter)).size, datei: 'data/vokabeln-' + buch + '.js' });
  }
  fs.writeFileSync(path.join(e, 'buecher.js'), '/* Probe */\nconst BUECHER = ' + JSON.stringify(verzeichnis, null, 1) + ';\n');
}

const ORDNER = [];
const quelle = name => fs.readFileSync(path.join(HIER, name), 'utf8');
function ersetze(text, alt, neu, wo) {
  if (!text.includes(alt)) throw new Error(wo + ': die Zeile „' + alt + '“ steht dort nicht mehr — Test anpassen');
  return text.replace(alt, neu);
}
function welt(st = {}) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'vt-wechsel-'));
  ORDNER.push(d);
  for (const u of ['werkzeuge', 'data', 'mcp/dist', 'ablage']) fs.mkdirSync(path.join(d, u), { recursive: true });
  let hole = ersetze(quelle('hole-vokabeln.mjs'), MCP_ZEILE, 'const MCP = process.env.SIM_MCP;', 'hole-vokabeln.mjs');
  if (st.ohneKartensperre) hole = ersetze(hole, KARTENSPERRE, 'if (false) {', 'hole-vokabeln.mjs');
  fs.writeFileSync(path.join(d, 'werkzeuge', 'hole-vokabeln.mjs'), hole);
  let baue = quelle('baue-vokabelpaket.mjs');
  if (st.ohneListe) baue = ersetze(baue, LISTENZEILE, 'return fehlt.length ? fehlt : null;', 'baue-vokabelpaket.mjs');
  fs.writeFileSync(path.join(d, 'werkzeuge', 'baue-vokabelpaket.mjs'), baue);
  fs.copyFileSync(path.join(HIER, 'datenquelle.mjs'), path.join(d, 'werkzeuge', 'datenquelle.mjs'));
  fs.writeFileSync(path.join(d, 'mcp', 'dist', 'loadEnv.js'), "export function loadEnvFile(){ process.env.SUPABASE_URL = 'sim'; process.env.SUPABASE_ANON_KEY = 'sim'; }\n");
  fs.writeFileSync(path.join(d, 'mcp', 'dist', 'auth.js'), 'export class SupabaseAuth { constructor(){} }\n');
  fs.writeFileSync(path.join(d, 'mcp', 'dist', 'supabaseClient.js'), ATTRAPPE);
  const r = hole_(d, GRUND);
  if (r.code !== 0) throw new Error('Grundstand nicht erzeugt: ' + r.aus.slice(-400));
  fs.writeFileSync(path.join(d, 'data', 'eselsbruecken.js'), 'const PROBE = "gehört nicht zum Wechsel";\n');
  const s = ersatzStand();
  if (st.ersatz) st.ersatz(s);
  schreibeErsatz(d, s);
  return d;
}
function lauf(d, skript, args = [], antwort) {
  if (antwort) fs.writeFileSync(path.join(d, 'antwort.json'), JSON.stringify(antwort));
  const env = { ...process.env, ERSATZ_REPO: d, SIM_ANTWORT: path.join(d, 'antwort.json'), SIM_MCP: path.join(d, 'mcp').replace(/\\/g, '/'), VOKABELPAKET_ABLAGE: path.join(d, 'ablage') };
  const r = spawnSync(process.execPath, [skript, ...args], { cwd: d, env, encoding: 'utf8' });
  return { code: r.status, aus: (r.stdout || '') + (r.stderr || '') };
}
const wechsel = (d, ...args) => lauf(d, path.join(HIER, 'ersatz-wechsel.mjs'), args);
const hole_ = (d, antwort) => lauf(d, path.join(d, 'werkzeuge', 'hole-vokabeln.mjs'), [], antwort);
const paket = d => lauf(d, path.join(d, 'werkzeuge', 'baue-vokabelpaket.mjs'));

/* Jede Datei unter einem Ordner mit ihrem Fingerabdruck -- „Byte für Byte" heißt: dieselbe Zeichenkette. */
function abdruck(ordner) {
  const aus = {};
  (function geh(o, rel) {
    for (const e of fs.readdirSync(o, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : 1)) {
      const r = rel ? rel + '/' + e.name : e.name;
      if (e.isDirectory()) geh(path.join(o, e.name), r);
      else aus[r] = createHash('sha256').update(fs.readFileSync(path.join(o, e.name))).digest('hex');
    }
  })(ordner, '');
  return JSON.stringify(aus);
}
const text = (d, f) => fs.readFileSync(path.join(d, f), 'utf8');
const gleich = (d, a, b) => fs.readFileSync(path.join(d, a)).equals(fs.readFileSync(path.join(d, b)));
const ids = (d, f) => liesListe(path.join(d, f)).map(k => String(k.id));
/* eine Karte von Hand aus einer Buchdatei in data/ nehmen, Verzeichnis passend */
function nimmHeraus(d, buch, id) {
  const datei = path.join(d, 'data', 'vokabeln-' + buch + '.js');
  const rest = liesListe(datei).filter(k => String(k.id) !== id);
  fs.writeFileSync(datei, `/* von Hand */\n(window.VOKABELN = window.VOKABELN || {})[${JSON.stringify(buch)}] =\n${JSON.stringify(rest, null, 1)};\n`);
  const v = liesListe(path.join(d, 'data', 'buecher.js')).map(b => b.slug === buch ? { ...b, vokabeln: rest.length } : b);
  fs.writeFileSync(path.join(d, 'data', 'buecher.js'), `const BUECHER = ${JSON.stringify(v, null, 1)};\n`);
}

try {
  console.log('\n1. Ohne data-abzug/ ist alles wie bisher');
  {
    const d = welt();
    pruefe('der Abzug liegt in data/', abzugOrdner(d) === path.join(d, 'data') && !abzugGeparkt(d));
    pruefe('hole-vokabeln.mjs hat nach data/ geschrieben, data-abzug/ gibt es nicht', fs.existsSync(path.join(d, 'data', 'vokabeln-madina-1.js')) && !fs.existsSync(path.join(d, ABZUG_GEPARKT)));
    const r = wechsel(d, '--stand');
    pruefe('--stand: Exit 0, „der Abzug von arabicroots", 4 Karten', r.code === 0 && /der Abzug von arabicroots — data\/ hat 4 Karten in 2 Büchern/.test(r.aus), r.aus);
    pruefe('--stand: Ersatz und Abzug passen, 1 benannter Platz weggelassen', /passen Platz für Platz zusammen; 1 benannte/.test(r.aus), r.aus);
  }

  console.log('\n2. Verweigert wird, ohne etwas anzufassen');
  {
    const faelle = [
      ['ohne seinen Satz', {}, ['--hin'], /ohne Elias' Satz/],
      ['Ersatzkarte ohne Deutsch (pruefe-ersatz.mjs rot)', { ersatz: s => { s.karten['madina-1'][0].de = ''; } }, ['--hin', SATZ], /pruefe-ersatz\.mjs ist nicht grün/],
      ['es fehlt eine Karte, die nicht in der Liste der weggelassenen steht', { ersatz: s => { s.karten['madina-1'].pop(); delete s.belege['madina-1'][9002]; s.nichtGefunden.push({ id: '9002', buch: 'madina-1', kap: 1, platz: 2, grund: 'Probe' }); } }, ['--hin', SATZ], /madina-1: 1 Karten des Abzugs fehlen .*9002/],
      ['eine Karte steht in einem anderen Kapitel', { ersatz: s => { s.karten['madina-1'][1].chapter = 7; s.plaetze[1].kap = 7; } }, ['--hin', SATZ], /anderen Kapitel als im Abzug \(9002\)/],
    ];
    for (const [name, st, args, muster] of faelle) {
      const d = welt(st), vor = abdruck(d), r = wechsel(d, ...args);
      pruefe(name + ': Exit 1 und der Grund steht da', r.code === 1 && muster.test(r.aus), r.aus);
      pruefe(name + ': kein Byte geändert', abdruck(d) === vor && !fs.existsSync(path.join(d, ABZUG_GEPARKT)));
    }
    const d = welt();
    fs.rmSync(path.join(d, 'data-ersatz', 'buecher.js'));
    const vor = abdruck(d), r = wechsel(d, '--hin', SATZ);
    pruefe('ohne Verzeichnis der Ersatzdatenbank: Exit 1, kein Byte geändert', r.code === 1 && abdruck(d) === vor, r.aus);
    const basis = { satz: SATZ, geaendert: [], prueferCode: 0, prueferZeile: '' };
    pruefe('Vorbedingungen: alles in Ordnung ergibt kein Hindernis (auch ohne Git-Ordner)', vorbedingungen(basis).length === 0 && vorbedingungen({ ...basis, geaendert: null }).length === 0);
    pruefe('Vorbedingungen: eine geänderte verfolgte Datei ist ein Hindernis', /geänderte verfolgte Dateien da \(index\.html\)/.test(vorbedingungen({ ...basis, geaendert: ['index.html'] }).join()));
    pruefe('Vorbedingungen: git nicht aufrufbar ist ein Hindernis', /nicht prüfbar/.test(vorbedingungen({ ...basis, geaendert: undefined }).join()));
    pruefe('Vorbedingungen: ein Satz aus Leerzeichen zählt nicht', /ohne Elias' Satz/.test(vorbedingungen({ ...basis, satz: '   ' }).join()));
  }

  console.log('\n3. Hin: data/ trägt die Ersatzkarten, der Abzug steht vollständig in data-abzug/');
  let dHin, vorHin;
  {
    const d = dHin = welt(); vorHin = abdruck(path.join(d, 'data'));
    const abzugVor = { a: text(d, 'data/vokabeln-madina-1.js'), b: text(d, 'data/vokabeln-madina-2.js'), v: text(d, 'data/buecher.js'), e: text(d, 'data/vokabeln-eigene.js'), x: text(d, 'data/eselsbruecken.js') };
    const r = wechsel(d, '--hin', SATZ);
    pruefe('Exit 0, „Umgeschaltet", 3 Karten in 2 Büchern, 1 weggelassen', r.code === 0 && /Umgeschaltet\. In data\/ liegt jetzt die Ersatzdatenbank: 3 Karten in 2 Büchern/.test(r.aus) && /weggelassen sind 1 benannte/.test(r.aus), r.aus);
    pruefe('data/ ist Byte für Byte die Ersatzdatenbank (zwei Bücher und das Verzeichnis)', gleich(d, 'data/vokabeln-madina-1.js', 'data-ersatz/vokabeln-madina-1.js') && gleich(d, 'data/vokabeln-madina-2.js', 'data-ersatz/vokabeln-madina-2.js') && gleich(d, 'data/buecher.js', 'data-ersatz/buecher.js'));
    pruefe('data-abzug/ ist Byte für Byte der Abzug von vorher', text(d, 'data-abzug/vokabeln-madina-1.js') === abzugVor.a && text(d, 'data-abzug/vokabeln-madina-2.js') === abzugVor.b && text(d, 'data-abzug/buecher.js') === abzugVor.v);
    pruefe('seine eigenen Wörter und fremde Dateien in data/ sind nicht angefasst', text(d, 'data/vokabeln-eigene.js') === abzugVor.e && text(d, 'data/eselsbruecken.js') === abzugVor.x && !fs.existsSync(path.join(d, ABZUG_GEPARKT, 'vokabeln-eigene.js')));
    const merk = JSON.parse(text(d, 'data-abzug/wechsel.json'));
    pruefe('sein Satz und der Zeitpunkt stehen beim geparkten Abzug', merk.satz === SATZ && /^\d{4}-\d\d-\d\dT/.test(merk.seit));
    const s = wechsel(d, '--stand');
    pruefe('--stand: Exit 0, „die Ersatzdatenbank", nennt seinen Satz', s.code === 0 && /WORAUF DIE APP LÄUFT: die Ersatzdatenbank/.test(s.aus) && s.aus.includes(SATZ), s.aus);
    pruefe('ein zweites --hin findet nichts nachzuziehen', /Nichts nachzuziehen/.test(wechsel(d, '--hin').aus));
  }

  console.log('\n4. Nach dem Wechsel: die Werkzeuge lesen und schreiben den Abzug in data-abzug/');
  {
    const d = dHin;
    pruefe('der Abzug liegt jetzt in data-abzug/', abzugOrdner(d) === path.join(d, ABZUG_GEPARKT));
    const bestand = ladeBuch(d, 'madina-1');
    pruefe('die Werkzeuge der Ersatzdatenbank bekommen als Bestand die arabicroots-Karten', bestand && bestand.get('9001').source === 'vocabulary' && bestand.get('9001').de === 'alt-9001');
    const p = lauf(d, path.join(HIER, 'pruefe-ersatz.mjs'), ['--knapp']);
    pruefe('pruefe-ersatz.mjs bleibt grün', p.code === 0, p.aus);
    const ersatzVor = text(d, 'data/vokabeln-madina-1.js'), verzeichnisVor = text(d, 'data/buecher.js');
    const r = hole_(d, { vocabulary: [...GRUND.vocabulary, roh(9004, 2, 'madina-1')], personal_vocabulary: [eig('u-1'), eig('u-2')] });
    pruefe('der Abzug läuft durch und nennt den Ort', r.code === 0 && /Ersatzdatenbank ist eingeschaltet/.test(r.aus), r.aus);
    pruefe('die neue Karte von arabicroots steht in data-abzug/', ids(d, 'data-abzug/vokabeln-madina-1.js').join() === '9001,9002,9004' && liesListe(path.join(d, 'data-abzug', 'buecher.js'))[0].vokabeln === 3);
    pruefe('die Ersatzkarten in data/ sind nicht angefasst', text(d, 'data/vokabeln-madina-1.js') === ersatzVor && text(d, 'data/buecher.js') === verzeichnisVor);
    pruefe('seine eigenen Wörter gehen weiter nach data/', ids(d, 'data/vokabeln-eigene.js').includes('u-2'));
    const s = wechsel(d, '--stand');
    pruefe('--stand nennt, was einem Nachziehen jetzt im Weg steht (9004 hat noch keine Ersatzkarte)', s.code === 0 && /madina-1: 1 Karten des Abzugs fehlen .*9004/.test(s.aus), s.aus);
    const z = wechsel(d, '--zurueck');
    pruefe('--zurueck bringt den NEUEREN Abzug nach data/ (mehr darf es werden)', z.code === 0 && ids(d, 'data/vokabeln-madina-1.js').join() === '9001,9002,9004' && !fs.existsSync(path.join(d, ABZUG_GEPARKT)), z.aus);
  }

  console.log('\n5. Nachziehen nach einem Neubau der Ersatzdatenbank');
  {
    const d = welt();
    wechsel(d, '--hin', SATZ);
    const seit = JSON.parse(text(d, 'data-abzug/wechsel.json')).seit;
    const s = ersatzStand(); s.karten['madina-1'][0].de = 'Haus, Heim'; schreibeErsatz(d, s);
    const lage = wechsel(d, '--stand');
    pruefe('--stand meldet, dass data-ersatz/ neuer ist', lage.code === 0 && /data-ersatz\/ ist neuer/.test(lage.aus), lage.aus);
    const r = wechsel(d, '--hin');
    pruefe('--hin ohne Satz zieht nach: Exit 0, die geänderte Karte steht in data/', r.code === 0 && /Nachgezogen: 1 Dateien/.test(r.aus) && liesListe(path.join(d, 'data', 'vokabeln-madina-1.js'))[0].de === 'Haus, Heim', r.aus);
    const merk = JSON.parse(text(d, 'data-abzug/wechsel.json'));
    pruefe('Satz und Beginn bleiben stehen', merk.satz === SATZ && merk.seit === seit);
    const kaputt = ersatzStand(); kaputt.karten['madina-1'][0].de = ''; schreibeErsatz(d, kaputt);
    const vor = abdruck(path.join(d, 'data')), n = wechsel(d, '--hin');
    pruefe('eine kaputte Ersatzdatenbank wird nicht nachgezogen', n.code === 1 && abdruck(path.join(d, 'data')) === vor, n.aus);
  }

  console.log('\n6. Zurück: data/ steht Byte für Byte da wie vor dem Wechsel');
  {
    const d = welt(), vor = abdruck(path.join(d, 'data'));
    wechsel(d, '--hin', SATZ);
    pruefe('nach --hin ist data/ ein anderer Stand', abdruck(path.join(d, 'data')) !== vor);
    const r = wechsel(d, '--zurueck');
    pruefe('Exit 0, „Zurückgeschaltet", 4 Karten', r.code === 0 && /Zurückgeschaltet\. In data\/ liegt wieder der Abzug von arabicroots: 4 Karten in 2 Büchern/.test(r.aus), r.aus);
    pruefe('data/ Byte für Byte wie vorher', abdruck(path.join(d, 'data')) === vor);
    pruefe('data-abzug/ ist abgeräumt, der Abzug liegt wieder in data/', !fs.existsSync(path.join(d, ABZUG_GEPARKT)) && abzugOrdner(d) === path.join(d, 'data'));
    pruefe('ein zweites --zurueck hat nichts zu tun', /Nichts zu tun/.test(wechsel(d, '--zurueck').aus));
    const log = text(d, 'data-ersatz/arbeit/wechsel-log.jsonl').trim().split('\n').map(z => JSON.parse(z).was);
    pruefe('hin und zurück stehen im Protokoll der Ersatzdatenbank', log.join() === 'hin,zurueck', log.join());
  }

  console.log('\n7. Ein Wechsel, der mittendrin abgebrochen ist');
  {
    const baue = () => {
      const d = welt(), vor = abdruck(path.join(d, 'data'));
      fs.mkdirSync(path.join(d, ABZUG_GEPARKT));
      for (const f of ['vokabeln-madina-1.js', 'vokabeln-madina-2.js', 'buecher.js']) fs.copyFileSync(path.join(d, 'data', f), path.join(d, ABZUG_GEPARKT, f));
      return { d, vor };
    };
    const a = baue(), s = wechsel(a.d, '--stand');
    pruefe('--stand: Exit 2 und nennt den Widerspruch', s.code === 2 && /nicht zu Ende gelaufen/.test(s.aus), s.aus);
    const h = wechsel(a.d, '--hin');
    pruefe('--hin bringt ihn zu Ende', h.code === 0 && gleich(a.d, 'data/vokabeln-madina-2.js', 'data-ersatz/vokabeln-madina-2.js') && wechsel(a.d, '--stand').code === 0, h.aus);
    const b = baue(), z = wechsel(b.d, '--zurueck');
    pruefe('--zurueck nimmt ihn zurück: data/ Byte für Byte wie vorher', z.code === 0 && abdruck(path.join(b.d, 'data')) === b.vor && !fs.existsSync(path.join(b.d, ABZUG_GEPARKT)), z.aus);
  }

  console.log('\n8. Das Paket: kleiner nur um die benannten Plätze, und nur wenn umgeschaltet ist');
  {
    const d = welt();
    let r = paket(d);
    pruefe('vor dem Wechsel: Paket mit 4 Karten', r.code === 0 && /2 Buecher, 4 Vokabeln/.test(r.aus), r.aus);
    wechsel(d, '--hin', SATZ);
    r = paket(d);
    const p = JSON.parse(text(d, 'ablage/vokabelpaket.json'));
    pruefe('nach dem Wechsel: Exit 0, nennt die Ausnahme und die Kennung 46414', r.code === 0 && /nur um die 1 benannten Plaetze/.test(r.aus) && /Kennungen: 46414/.test(r.aus), r.aus);
    pruefe('das Paket trägt die 3 Ersatzkarten', Object.values(p.buecher).flat().length === 3 && Object.values(p.buecher).flat().every(k => k.source === 'ersatz'));
    const kopieVor = text(d, 'ablage/vokabelpaket.json');
    nimmHeraus(d, 'madina-1', '9001');
    r = paket(d);
    pruefe('fehlt danach eine Karte, die NICHT benannt ist: Exit 1 und „WENIGER"', r.code === 1 && /WENIGER als im letzten Paket - nichts geschrieben/.test(r.aus), r.aus);
    pruefe('die Kopie im Downloads-Ersatz ist nicht angefasst', text(d, 'ablage/vokabelpaket.json') === kopieVor);

    const e = welt();
    paket(e);
    nimmHeraus(e, 'madina-2', '46414');
    r = paket(e);
    pruefe('ohne Wechsel gilt die Ausnahme nicht: auch die benannte Kennung darf nicht fehlen', r.code === 1 && /WENIGER als im letzten Paket - nichts geschrieben/.test(r.aus), r.aus);
  }

  console.log('\n9. data-abzug/ ist weg, obwohl umgeschaltet war: nichts wird überschrieben');
  {
    const d = welt();
    wechsel(d, '--hin', SATZ);
    fs.rmSync(path.join(d, ABZUG_GEPARKT), { recursive: true });
    const vor = abdruck(path.join(d, 'data'));
    const r = hole_(d, GRUND);
    pruefe('der Abzug bricht ab und nennt den Grund', r.code !== 0 && /liegen Karten der Ersatzdatenbank/.test(r.aus), r.aus);
    pruefe('in data/ ist kein Byte geändert', abdruck(path.join(d, 'data')) === vor);
    const s = wechsel(d, '--stand');
    pruefe('--stand: Exit 2, der Abzug ist nicht da, wo er sein müsste', s.code === 2 && /nicht da, wo er sein müsste/.test(s.aus), s.aus);
    const z = wechsel(d, '--zurueck');
    pruefe('--zurueck verweigert und sagt, wie es weitergeht', z.code === 1 && /keinen geparkten Abzug/.test(z.aus) && abdruck(path.join(d, 'data')) === vor, z.aus);
    const p = lauf(d, path.join(HIER, 'pruefe-ersatz.mjs'), ['--knapp']);
    pruefe('pruefe-ersatz.mjs wird rot: als Bestand liegen Ersatzkarten da', p.code === 1 && /als Bestand liegen Karten der Ersatzdatenbank/.test(p.aus), p.aus);
  }

  console.log('\n10. Die Probe vergleicht zwei Sammelläufe richtig');
  {
    const zeile = (zeichen, name, code, schluss) => `  ${zeichen} ${name.padEnd(40)} exit  ${code}   ${schluss}`;
    const a = [zeile('✅', 'pruefe-a.js', 0, 'alles gut'), zeile('✅', 'pruefe-b.js', 0, '4433 Wörter'), zeile('✅', 'pruefe-c.js', 0, 'gleich'), zeile('✅', 'pruefe-c.js', 0, 'zweiter Lauf'), zeile('⛔', 'pruefe-d.js', 1, '1 gescheitert')].join('\n');
    const b = [zeile('⛔', 'pruefe-a.js', 1, '1 Befund'), zeile('✅', 'pruefe-b.js', 0, '4414 Wörter'), zeile('✅', 'pruefe-c.js', 0, 'gleich'), zeile('✅', 'pruefe-c.js', 0, 'zweiter Lauf'), zeile('⛔', 'pruefe-d.js', 1, '2 gescheitert')].join('\n');
    const u = unterschied(a, b);
    pruefe('fünf Prüfer gelesen (ein doppelter zählt zweimal)', u.pruefer === 5, JSON.stringify(u));
    pruefe('einer NEU ROT, einer mit anderer Schlusszeile, zwei gleich', u.aus.length === 3 && u.aus.find(x => x.name === 'pruefe-a.js').art === 'NEU ROT' && u.aus.find(x => x.name === 'pruefe-b.js').art === 'andere Schlusszeile', JSON.stringify(u.aus));
    // so zeigte sich am 12.10.2026 das Hindernis im Fachbegriff-Prüfer: in der Kopie vorher schon rot, nachher ein Befund mehr
    pruefe('ein Prüfer, der rot bleibt und einen Befund dazubekommt, fällt eigens auf', u.aus.find(x => x.name === 'pruefe-d.js').art === 'ROT GEBLIEBEN, andere Schlusszeile', JSON.stringify(u.aus));
  }

  console.log('\n11. Die Probe liest auch, was hinter gleicher Schlusszeile anders ist');
  {
    // Die Formen stammen aus dem Lauf vom 12.10.2026: dort sah der Vergleich nach Schlusszeile 5 von 22 Prüfern.
    const vorher = {
      '001-pruefe-duplikate.js': 'exit 0\nVerglichen gegen 456 von 4433 Buchvokabeln\nfertig',
      '002-test-wurzel.mjs': 'exit 0\n  ok   Buchdatei bringt 298 Einträge, davon 270 mit Wurzel',
      '003-pruefe-buchtausch.mjs': 'exit 2\n  gram-x: kein Tausch\n  (jetzt 19:41, Kopie C:\\Temp\\vt-wechselprobe-AbC123\\data, 106 s)\n21 offen',
      '004-gleich.mjs': 'exit 0\ngleich',
      '005-nur-vorher.mjs': 'exit 0',
    };
    const nachher = {
      '001-pruefe-duplikate.js': 'exit 0\nVerglichen gegen 456 von 4414 Buchvokabeln\nfertig',
      '002-test-wurzel.mjs': 'exit 0\n  ok   Buchdatei bringt 298 Einträge, davon 189 mit Wurzel',
      '003-pruefe-buchtausch.mjs': 'exit 2\n  gram-x ← Buch 50467\n  (jetzt 19:43, Kopie C:\\Temp\\vt-wechselprobe-xYz789\\data, 105 s)\n21 offen',
      '004-gleich.mjs': 'exit 0\ngleich',
      '006-nur-nachher.mjs': 'exit 0',
    };
    const v = unterschiedVoll(vorher, nachher), nach = n => v.find(x => x.name === n);
    pruefe('fünf von sechs Namen unterscheiden sich, der gleiche fehlt in der Liste', v.length === 5 && !nach('004-gleich.mjs'), JSON.stringify(v.map(x => x.name)));
    pruefe('andere Kartenzahl: als „nur Zahlen" erkannt — und trotzdem gezeigt', nach('001-pruefe-duplikate.js').nurZahlen === true && nach('001-pruefe-duplikate.js').weg.length === 1, JSON.stringify(nach('001-pruefe-duplikate.js')));
    pruefe('weniger Karten mit Wurzel: auch „nur Zahlen" — deshalb wird diese Sorte nie ausgeblendet', nach('002-test-wurzel.mjs').nurZahlen === true && /189/.test(nach('002-test-wurzel.mjs').neu[0]), JSON.stringify(nach('002-test-wurzel.mjs')));
    const t = nach('003-pruefe-buchtausch.mjs');
    pruefe('gleiche Schlusszeile, anderer Inhalt: eine Zeile weg, eine neu, keine „nur Zahlen"', t.nurZahlen === false && t.weg.length === 1 && t.neu.length === 1 && /50467/.test(t.neu[0]), JSON.stringify(t));
    pruefe('Uhrzeit, Dauer und der Name des Wegwerfordners zählen nicht als Unterschied', !t.weg.some(z => /jetzt/.test(z)) && !t.neu.some(z => /jetzt/.test(z)), JSON.stringify(t));
    pruefe('ein Prüfer, der nur auf einer Seite lief, steht eigens da', nach('005-nur-vorher.mjs').art === 'nur vorher' && nach('006-nur-nachher.mjs').art === 'nur nachher', JSON.stringify(v));
    // vorrat.mjs: die zwei Formen seiner Ausgabe (alles vollständig · mit fehlenden Feldern)
    const alles = '  geprueft:                 331 Woerter aus freigeschalteten Kapiteln\n  vollstaendig:             331\n  unvollstaendig:           0\n    Felder (13 Punkte):     alle vollstaendig\n';
    const luecken = '  geprueft:                 331 Woerter aus freigeschalteten Kapiteln\n  vollstaendig:             273\n  unvollstaendig:           58\n\n  Felder des vollen Programms, die fehlen (ohne die erklaerten Faelle\n  aus data/feld-ausnahmen.js):\n    root:       53   Wurzelansicht und Wortfamilie\n    pl:         11   Pluralanzeige auf der Karte\n    gender:      9   Uebung 11\n    sg:          1   Hoermodus ueberspringt das Wort\n\n  je Kapitel:\n    madina-1 K1     7 Woerter, 0 Eselsbruecken, 0 Saetze\n';
    const a = vollstaendigAus(alles), l = vollstaendigAus(luecken);
    pruefe('vorrat.mjs ohne Lücken: 331 von 331, kein Feld fehlt', a.geprueft === 331 && a.vollstaendig === 331 && a.unvollstaendig === 0 && Object.keys(a.felder).length === 0, JSON.stringify(a));
    pruefe('vorrat.mjs mit Lücken: 273 vollständig (nicht die 58 aus „unvollstaendig"), vier Felder mit ihrer Zahl', l.vollstaendig === 273 && l.unvollstaendig === 58 && JSON.stringify(l.felder) === JSON.stringify({ root: 53, pl: 11, gender: 9, sg: 1 }), JSON.stringify(l));
    pruefe('eine Ausgabe ohne die Zeilen gilt als nicht lesbar, nicht als null Wörter', vollstaendigAus('Fehler: Datei fehlt').vollstaendig === null);
    // die Ablage der vollen Ausgaben: der Sammellauf schreibt sie nur auf Wunsch, und die Probe liest sie zurück
    const sammel = fs.readFileSync(path.join(HIER, 'alle-pruefer.mjs'), 'utf8');
    pruefe('alle-pruefer.mjs legt volle Ausgaben nur ab, wenn PRUEFER_AUSGABEN gesetzt ist', /if \(process\.env\.PRUEFER_AUSGABEN\)\{/.test(sammel) && sammel.split('process.env.PRUEFER_AUSGABEN').length === 4, String(sammel.split('process.env.PRUEFER_AUSGABEN').length - 1) + ' Stellen');
    const ablage = fs.mkdtempSync(path.join(os.tmpdir(), 'vt-wechseltest-aus-'));
    try {
      fs.writeFileSync(path.join(ablage, '002-b.mjs.txt'), 'exit 0\nb', 'utf8');
      fs.writeFileSync(path.join(ablage, '001-a.js.txt'), 'exit 1\na', 'utf8');
      const gelesen = ausgabenLesen(ablage);
      pruefe('abgelegte Ausgaben kommen mit ihrem Namen zurück; ein fehlender Ordner ist leer, kein Absturz', JSON.stringify(Object.keys(gelesen)) === '["001-a.js","002-b.mjs"]' && gelesen['001-a.js'] === 'exit 1\na' && Object.keys(ausgabenLesen(path.join(ablage, 'gibt-es-nicht'))).length === 0, JSON.stringify(gelesen));
    } finally { fs.rmSync(ablage, { recursive: true, force: true }); }
  }

  console.log('\nStörtest 1: ohne die Kartensperre überschreibt der Abzug die Ersatzkarten');
  {
    const d = welt({ ohneKartensperre: true });
    wechsel(d, '--hin', SATZ);
    fs.rmSync(path.join(d, ABZUG_GEPARKT), { recursive: true });
    hole_(d, GRUND);
    greift('in data/ stehen danach arabicroots-Karten', liesListe(path.join(d, 'data', 'vokabeln-madina-1.js')).some(k => k.source === 'vocabulary'));
  }
  console.log('\nStörtest 2: ohne die Liste der benannten Plätze wird das Paket um jede Karte kleiner');
  {
    const d = welt({ ohneListe: true });
    paket(d); wechsel(d, '--hin', SATZ); paket(d);
    nimmHeraus(d, 'madina-1', '9001');
    const r = paket(d);
    greift('Exit 0, Paket mit 2 Karten', r.code === 0 && Object.values(JSON.parse(text(d, 'ablage/vokabelpaket.json')).buecher).flat().length === 2);
  }
  console.log('\nStörtest 3: der Vergleich „Byte für Byte" merkt ein einziges geändertes Zeichen');
  {
    const d = welt(), vor = abdruck(path.join(d, 'data'));
    fs.writeFileSync(path.join(d, 'data', 'vokabeln-madina-2.js'), text(d, 'data/vokabeln-madina-2.js').replace('alt-9003', 'alt-9003.'));
    greift('der Fingerabdruck ist ein anderer', abdruck(path.join(d, 'data')) !== vor);
  }

  console.log('\nDer echte Ordner (nur gelesen)');
  {
    const sperre = fs.readFileSync(path.join(REPO, '.gitignore'), 'utf8').split(/\r?\n/).map(z => z.trim());
    pruefe('data-abzug/ steht in .gitignore (arabicroots-Karten, nie ins Repo)', sperre.includes(ABZUG_GEPARKT + '/'));
    pruefe('WEGGELASSEN nennt keine Kennung doppelt', new Set(WEGGELASSEN).size === WEGGELASSEN.length);
    if (!fs.existsSync(path.join(REPO, 'data', 'vokabeln-madina-1.js'))) console.log('  ⚠️ ÜBERSPRUNGEN: die Buchdateien liegen auf diesem Rechner nicht (sie sind nur lokal).');
    else {
      const s = stand(REPO);
      console.log(`  ⓘ ${s.geparkt ? 'umgeschaltet' : 'nicht umgeschaltet'}: data/ hat ${s.data.karten} Karten (${s.quelle})${s.ersatz ? ', die Ersatzdatenbank ' + s.ersatz.karten : ''}.`);
      pruefe('die Lage ist in sich stimmig (kein Widerspruch zwischen data/, data-abzug/ und den Karten)', s.widerspruch.length === 0, s.widerspruch.join(' | '));
      pruefe('keine Kennung steht in WEGGELASSEN, die inzwischen eine Ersatzkarte hat', !s.hinweise.some(t => t.includes('WEGGELASSEN')), s.hinweise.join(' | '));
      // nach einem Neubau der Ersatzdatenbank liefe die App sonst auf älteren Karten, als pruefe-ersatz.mjs geprüft hat
      pruefe('ist umgeschaltet, dann sind die Karten in data/ auf dem Stand von data-ersatz/ („--hin“ zieht nach)', s.veraltet.length === 0, s.veraltet.join(', '));
      if (s.vergleich && s.vergleich.hindernisse.length) console.log('  ⓘ einem Wechsel steht zurzeit im Weg: ' + s.vergleich.hindernisse.join(' | ').slice(0, 400));
    }
  }
} finally {
  for (const d of ORDNER) fs.rmSync(d, { recursive: true, force: true });
}

console.log(`\n${ok} bestanden, ${schlecht} gescheitert.`);
if (stoer) { console.log('⛔ Ein Störtest greift nicht — die Fälle oben sagen nichts.'); process.exitCode = 3; }
else process.exitCode = schlecht ? 1 : 0;
