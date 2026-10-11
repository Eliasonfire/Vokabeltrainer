/* ersatz-blatt.mjs -- das Arbeitsblatt für die Entscheidungen von Hand: zeigt zu einem Kapitel die Plätze,
 * die noch NICHT belegt sind, je mit dem Suchschlüssel, den Einträgen der Quelle und den deutschen Kandidaten.
 * Das Blatt nennt die Suchschlüssel aus dem Bestand und gehört deshalb in keine versionierte Datei
 * (Ausgabe in eine lokale Datei oder ins Terminal).
 *
 * Aufruf (aus dem Repo-Wurzelverzeichnis):
 *   node werkzeuge/ersatz-blatt.mjs <buch> <kapitel> [--alle]     --alle zeigt auch die belegten Plätze
 *   node werkzeuge/ersatz-blatt.mjs --offen                       Zahl der offenen Plätze je Buch und Kapitel
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const REPO = process.env.ERSATZ_REPO || path.join(HIER, '..');
const ERSATZ = path.join(REPO, 'data-ersatz');
const args = process.argv.slice(2);
const saetze = fs.readFileSync(path.join(ERSATZ, 'arbeit', 'zuordnung.jsonl'), 'utf8').split('\n').filter(Boolean).map(z => JSON.parse(z));
const belegeVon = buch => { const d = path.join(ERSATZ, 'belege-' + buch + '.json'); return fs.existsSync(d) ? JSON.parse(fs.readFileSync(d, 'utf8')) : {}; };
const kurz = (t, n) => { t = String(t ?? ''); return t.length > n ? t.slice(0, n) + '…' : t; };

if (args[0] === '--offen') {
  const z = {};
  const cache = {};
  for (const s of saetze) {
    const b = cache[s.buch] ||= belegeVon(s.buch);
    const k = z[s.buch] ||= {};
    const e = k[s.kap] ||= { alle: 0, offen: 0 };
    e.alle++;
    if (!b[s.id] || b[s.id].status === 'offen') e.offen++;
  }
  for (const [buch, k] of Object.entries(z)) console.log(buch + ': ' + Object.entries(k).filter(([, e]) => e.offen).map(([kap, e]) => `K${kap} ${e.offen}/${e.alle}`).join(' · '));
  process.exit(0);
}
const [buch, kapRoh] = args;
const alle = args.includes('--alle');
const belege = belegeVon(buch);
const liste = saetze.filter(s => s.buch === buch && s.kap === Number(kapRoh));
let gezeigt = 0;
for (const s of liste) {
  const b = belege[s.id] || { status: 'offen' };
  if (b.status === 'belegt' && !alle) continue;
  gezeigt++;
  console.log(`\n#${s.id} ${s.typ} · Stufe ${s.stufe} · ${b.status}${b.grund ? ' (' + b.grund + ')' : ''}`);
  console.log(`  gesucht: ${s.suche.ar}  =  „${kurz(s.suche.de, 70)}“`);
  if (s.vorschlag) {
    const v = s.vorschlag;
    console.log(`  ${s.ref ? 'Eintrag @' + s.ref.split('@')[1] + ' ' + s.ref.split('@')[0] : 'Fügung'}: ` + ['ar', 'gender', 'pl', 'femSg', 'root', 'present', 'imperative', 'masdar'].filter(f => v[f]).map(f => `${f}=${v[f].w}${s.vergleich && !['gleich', 'nur-quelle'].includes(s.vergleich[f]) ? ' ⟨' + s.vergleich[f] + '⟩' : ''}`).join(' · '));
    console.log(`  en: ${kurz((v._en || []).join(' ; '), 200)}`);
  }
  for (const w of (s.wahl || []).slice(0, 6)) console.log(`  zur Wahl @${w.ref.split('@')[1]} ${w.ref.split('@')[0]} · ${w.kopf.join(',')} · ${kurz(w.en.join(' ; '), 110)}`);
  for (const w of (s.andereVokale || []).slice(0, 6)) console.log(`  andere Vokale @${w.ref.split('@')[1]} ${w.ref.split('@')[0]} · ${w.kopf.join(',')} · ${kurz(w.en.join(' ; '), 110)}`);
  for (const t of s.teile || []) console.log(`  Teil ${t.t} → ${t.stufe}${t.form ? ' · Form belegt (' + t.form + ')' : ' · Form NICHT belegt'} · en: ${kurz((t.en || []).join(' ; '), 70)} · de: ${(t.de || []).join(', ')}`);
  const de = (s.deutsch || []).filter(d => !d.erkl);
  const zeig = (liste, n) => [...new Set(liste.map(d => d.de + (d.deckt ? '✓' : '')))].slice(0, n).join(', ');
  const direkt = de.filter(d => d.sicher === 'vokalisiert'), kette = de.filter(d => d.sicher === 'kette'), bild = de.filter(d => d.sicher === 'nur-schriftbild');
  if (direkt.length) console.log(`  Deutsch direkt: ${zeig(direkt, 14)}`);
  if (kette.length) console.log(`  Deutsch über das Englische: ${zeig(kette, 14)}`);
  if (bild.length) console.log(`  Deutsch nur zum Schriftbild: ${zeig(bild, 8)}`);
  const erkl = (s.deutsch || []).filter(d => d.erkl).slice(0, 2).map(d => kurz(d.de, 90));
  if (erkl.length) console.log(`  de.wiktionary erklärt: ${erkl.join(' | ')}`);
}
console.log(`\n${buch} Kapitel ${kapRoh}: ${liste.length} Plätze, gezeigt ${gezeigt}`);
