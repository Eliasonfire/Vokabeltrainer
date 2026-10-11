/* ersatz-quellen.mjs -- baut aus den heruntergeladenen Wörterbuch-Auszügen die schlanken Nachschlagewerke
 * für die Ersatzdatenbank (Elias, 11.10.2026: „1:1 ersatzdatenbank von den vokabeln die alle nicht von mir
 * stammen", „wo anders suchst nach den selben begriffen").
 *
 * Die Quellen liegen lokal unter data-ersatz/quellen/ und kommen nie ins Repo:
 *   enwikt-arabisch/kaikki.org-dictionary-Arabic.jsonl   englisches Wiktionary, arabische Wörter (kaikki.org)
 *   dewikt/raw-wiktextract-data.jsonl.gz                  deutsches Wiktionary, alles (kaikki.org)
 *   enwikt-roh/raw-wiktextract-data.jsonl.gz              englisches Wiktionary, alles (kaikki.org)
 * Wiktionary steht unter CC BY-SA; wird etwas daraus weitergegeben, muss die Quelle genannt werden.
 *
 * Aufruf (aus dem Repo-Wurzelverzeichnis):
 *   node werkzeuge/ersatz-quellen.mjs arabisch     → auszuege/enwikt-arabisch.jsonl
 *   node werkzeuge/ersatz-quellen.mjs deutsch      → auszuege/dewikt-arabisch.jsonl
 *   node werkzeuge/ersatz-quellen.mjs tabellen     → auszuege/enwikt-tabellen.jsonl
 * Die großen Dateien werden zeilenweise gelesen und nie ausgepackt abgelegt.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const REPO = process.env.ERSATZ_REPO || path.join(HIER, '..');
const QUELLEN = path.join(REPO, 'data-ersatz', 'quellen');
const ZIEL = path.join(QUELLEN, 'auszuege');

const zeilenVon = datei => readline.createInterface({
  input: datei.endsWith('.gz') ? fs.createReadStream(datei).pipe(zlib.createGunzip()) : fs.createReadStream(datei, 'utf8'),
  crlfDelay: Infinity,
});
const schreiber = ziel => {
  fs.mkdirSync(path.dirname(ziel), { recursive: true });
  const aus = fs.createWriteStream(ziel + '.neu', 'utf8');
  return { zeile: o => aus.write(JSON.stringify(o) + '\n'), fertig: async () => { await new Promise(r => aus.end(r)); fs.renameSync(ziel + '.neu', ziel); return fs.statSync(ziel).size; } };
};
const UNNUETZ = new Set(['ar-infl-a', 'table-tags', 'inflection-template']);
const sauber = tags => (tags || []).filter(t => !UNNUETZ.has(t));

/* ---------- 1. Englisches Wiktionary, arabische Wörter ------------------------------------------------- */
const ABLEITUNG = /^ar-(verbal noun|active participle|passive participle|noun of place|tool noun|elative|instance noun|nisba|occupational noun|diminutive|characteristic adjective|color\/defect adjective|plural|singulative|feminine)/;
async function arabisch() {
  const quelle = path.join(QUELLEN, 'enwikt-arabisch', 'kaikki.org-dictionary-Arabic.jsonl');
  const aus = schreiber(path.join(ZIEL, 'enwikt-arabisch.jsonl'));
  let gelesen = 0, behalten = 0, verbformen = 0, mitWurzel = 0;
  for await (const zeile of zeilenVon(quelle)) {
    if (!zeile) continue;
    gelesen++;
    const e = JSON.parse(zeile);
    const kopf = (e.head_templates || [])[0] || {};
    if (kopf.name === 'ar-verb form') { verbformen++; continue; }
    if (['character', 'symbol', 'punct'].includes(e.pos)) continue;
    const formen = e.forms || [];
    const kopfformen = [], tabelle = [];
    for (const f of formen) {
      const t = sauber(f.tags);
      if (!f.form || (f.tags || []).some(x => x === 'table-tags' || x === 'inflection-template')) continue;
      if (f.source) {
        // Nominal alle Fälle und Zustände (für Fügungen wie die Genitivverbindung braucht es auch den Genitiv und die
        // Form ohne Tanwin), nur den Dual und die Umgangsform nicht.
        const nominal = f.source === 'declension' && !t.includes('dual') && !t.includes('informal') && (t.includes('nominative') || t.includes('genitive') || t.includes('accusative'));
        const verbal = f.source === 'conjugation' && (t.includes('participle') || t.includes('noun-from-verb')
          || (t.includes('active') && t.includes('singular') && t.includes('masculine')
            && ((t.includes('third-person') && (t.includes('indicative') || t.includes('past') || t.includes('perfective'))) || (t.includes('second-person') && t.includes('imperative')))));
        if (nominal || verbal) tabelle.push({ f: f.form, t, r: f.roman });
      } else if (!t.includes('romanization')) kopfformen.push({ f: f.form, t, r: f.roman });
    }
    let wurzel = null;
    const abl = [];
    for (const v of e.etymology_templates || []) {
      if (v.name === 'ar-root' || v.name === 'ar-rootbox') {
        const a = v.args || {};
        const teile = Object.keys(a).filter(k => /^\d+$/.test(k)).sort((x, y) => x - y).map(k => String(a[k]).trim()).filter(Boolean);
        if (teile.length && !wurzel) wurzel = teile.join(' ').replace(/\s+/g, ' ');
      } else if (ABLEITUNG.test(v.name)) abl.push({ n: v.name, a: (v.args || {})['1'] || null });
    }
    if (wurzel) mitWurzel++;
    const wurzelKat = (e.categories || []).map(k => typeof k === 'string' ? k : k && k.name).filter(k => k && /root/i.test(k)).slice(0, 3);
    aus.zeile({
      w: e.word, pos: e.pos, n: e.etymology_number || null, kn: kopf.name || null, ka: kopf.args || null,
      kx: kopf.expansion ? String(kopf.expansion).slice(0, 400) : null,
      rom: formen.filter(f => (f.tags || []).includes('romanization')).map(f => f.form),
      kopf: kopfformen.filter(f => f.t.includes('canonical')), hf: kopfformen.filter(f => !f.t.includes('canonical')),
      tab: tabelle, wurzel, wk: wurzelKat.length ? wurzelKat : undefined, abl: abl.length ? abl : undefined,
      sinn: (e.senses || []).slice(0, 12).map(s => ({ g: (s.glosses || []).join(' — ').slice(0, 260), t: s.tags, fo: s.form_of && s.form_of.map(x => x.word), ao: s.alt_of && s.alt_of.map(x => x.word) })),
    });
    behalten++;
  }
  const groesse = await aus.fertig();
  console.log(`arabisch: ${gelesen} Zeilen gelesen · ${verbformen} gebeugte Verbformen übersprungen · ${behalten} Einträge behalten · ${mitWurzel} mit Wurzelangabe · ${groesse} B`);
}

/* ---------- 2. Deutsches Wiktionary: arabische Einträge und deutsche Einträge mit arabischer Übersetzung -- */
async function deutsch() {
  const quelle = path.join(QUELLEN, 'dewikt', 'raw-wiktextract-data.jsonl.gz');
  const aus = schreiber(path.join(ZIEL, 'dewikt-arabisch.jsonl'));
  let gelesen = 0, arab = 0, mitUe = 0, ue = 0;
  for await (const zeile of zeilenVon(quelle)) {
    if (!zeile) continue;
    gelesen++;
    if (!zeile.includes('"ar"')) continue;
    let e; try { e = JSON.parse(zeile); } catch { continue; }
    const istAr = e.lang_code === 'ar';
    const ar = (e.translations || []).filter(t => t.lang_code === 'ar');
    if (!istAr && !ar.length) continue;
    const o = { w: e.word, s: e.lang_code, pos: e.pos, pt: e.pos_title, tags: e.tags, n: e.etymology_number,
      sinn: (e.senses || []).map(s => ({ i: s.sense_index, g: (s.glosses || []).join(' — ').slice(0, 300), t: s.tags, rt: s.raw_tags, fo: s.form_of && s.form_of.map(x => x.word) })) };
    if (istAr) { arab++; o.formen = e.forms; o.ue = (e.translations || []).filter(t => t.lang_code === 'de').map(t => ({ w: t.word, i: t.sense_index, sinn: t.sense, tags: t.tags })); }
    if (ar.length) { if (!istAr) mitUe++; ue += ar.length; o.ar = ar.map(t => ({ w: t.word, r: t.roman, i: t.sense_index, sinn: t.sense, tags: t.tags, unsicher: t.uncertain || undefined })); }
    aus.zeile(o);
  }
  const groesse = await aus.fertig();
  console.log(`deutsch: ${gelesen} Zeilen gelesen · ${arab} Einträge zu arabischen Wörtern · ${mitUe} Einträge mit arabischer Übersetzung (${ue} Übersetzungen) · ${groesse} B`);
}

/* ---------- 3. Englisches Wiktionary: Übersetzungstabellen, in denen Arabisch steht ------------------------ */
async function tabellen() {
  const quelle = path.join(QUELLEN, 'enwikt-roh', 'raw-wiktextract-data.jsonl.gz');
  const aus = schreiber(path.join(ZIEL, 'enwikt-tabellen.jsonl'));
  // Zweite Ausgabe für den Weg ÜBER DAS ENGLISCHE: alle englischen Einträge mit deutscher Übersetzung
  // (arabischer Eintrag nennt die englische Bedeutung, der englische Eintrag nennt dazu das Deutsch).
  const ausDe = schreiber(path.join(ZIEL, 'enwikt-deutsch.jsonl'));
  let gelesen = 0, eintraege = 0, kaesten = 0, mitDeutsch = 0, nurDeutsch = 0;
  for await (const zeile of zeilenVon(quelle)) {
    if (!zeile) continue;
    gelesen++;
    if (!zeile.includes('"translations"')) continue;
    const hatAr = zeile.includes('"ar"'), hatDe = zeile.includes('"de"');
    if (!hatAr && !hatDe) continue;
    let e; try { e = JSON.parse(zeile); } catch { continue; }
    if (e.lang_code !== 'en' || !e.translations) continue;
    const jeSinn = new Map();
    for (const t of e.translations) {
      const code = t.code || t.lang_code;
      if (code !== 'ar' && code !== 'de') continue;
      const s = t.sense || '';
      if (!jeSinn.has(s)) jeSinn.set(s, { ar: [], de: [] });
      jeSinn.get(s)[code].push({ w: t.word, r: t.roman, t: t.tags, a: t.alt, n: t.note });
    }
    const mitDe = [...jeSinn].filter(([, v]) => v.de.length);
    if (mitDe.length) { nurDeutsch++; ausDe.zeile({ w: e.word, pos: e.pos, k: mitDe.map(([sinn, v]) => ({ sinn, de: v.de.map(d => d.w).filter(Boolean) })) }); }
    const kasten = [...jeSinn].filter(([, v]) => v.ar.length).map(([sinn, v]) => ({ sinn, ar: v.ar, de: v.de }));
    if (!kasten.length) continue;
    eintraege++; kaesten += kasten.length; mitDeutsch += kasten.filter(k => k.de.length).length;
    aus.zeile({ w: e.word, pos: e.pos, n: e.etymology_number || null, k: kasten });
  }
  const groesse = await aus.fertig();
  const groesseDe = await ausDe.fertig();
  console.log(`tabellen: ${gelesen} Zeilen gelesen · ${eintraege} englische Einträge mit arabischer Übersetzung · ${kaesten} Bedeutungen mit Arabisch, davon ${mitDeutsch} auch mit Deutsch · ${groesse} B`);
  console.log(`          ${nurDeutsch} englische Einträge mit deutscher Übersetzung (für den Weg über das Englische) · ${groesseDe} B`);
}

/* ---------- 4. Zusatzformen: gebeugte Formen zu den Wörtern der Plätze -----------------------------------
 * Der schlanke Auszug (1) führt von jedem Verb nur die dritte Person und die Befehlsform und vom Nomen nicht die
 * Zweizahl. Manche Karten führen aber genau solche Formen („du hast …", „ich hoffe", eine Zweizahl). Hier werden aus
 * den VOLLSTÄNDIGEN Tabellen der Quelle nur die Formen geholt, die einem Wort eines Platzes gleichen (gleiche
 * Buchstaben) — ob auch die Vokalzeichen passen, entscheidet der Zuordner. Die Wörter kommen aus der Zuordnung.
 * ⛔ Gesucht wird zu ALLEN Plätzen, nicht nur zu den offenen: am 11.10.2026 suchte diese Stelle nur zu den offenen,
 * und beim nächsten Lauf fehlten genau die Formen, über die inzwischen vier Plätze belegt waren — sie fielen
 * wieder heraus. Ein Auszug darf nicht vom Stand des Baus abhängen. */
async function zusatz() {
  const ERSATZ = path.join(REPO, 'data-ersatz');
  const nfc = t => String(t ?? '').normalize('NFC').trim();
  const bar = t => nfc(t).replace(/[ً-ْٰـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي');
  const saetze = fs.readFileSync(path.join(ERSATZ, 'arbeit', 'zuordnung.jsonl'), 'utf8').split('\n').filter(Boolean).map(z => JSON.parse(z));
  const gesucht = new Set();
  // auch der Rest hinter einem ersten Buchstaben, der eine angehängte Vorsilbe sein kann (bi-, wa-, fa-, li-, ka-, sa-);
  // nach „li" fällt das Alif des Artikels in der Schrift weg, darum auch „Alif + Rest"
  for (const s of saetze) for (const t of bar(s.suche.ar).split(/\s+/)) {
    if (t.length > 1) gesucht.add(t);
    if (t.length > 3 && /^[فوبلكس]/.test(t)) { gesucht.add(t.slice(1)); gesucht.add('ا' + t.slice(1)); }
  }
  const quelle = path.join(QUELLEN, 'enwikt-arabisch', 'kaikki.org-dictionary-Arabic.jsonl');
  const aus = schreiber(path.join(ZIEL, 'enwikt-zusatzformen.jsonl'));
  const gesehen = new Set(), gefunden = new Set();
  let gelesen = 0, formen = 0;
  for await (const zeile of zeilenVon(quelle)) {
    if (!zeile) continue;
    gelesen++;
    const e = JSON.parse(zeile);
    const kopf = (e.head_templates || [])[0] || {};
    if (kopf.name === 'ar-verb form') continue;       // Verweis-Einträge; die Formen stehen in der Tabelle des Verbs
    const stich = ((e.forms || []).find(f => (f.tags || []).includes('canonical')) || {}).form || null;
    for (const f of e.forms || []) {
      if (!f.form || !f.source) continue;
      if ((f.tags || []).some(x => x === 'table-tags' || x === 'inflection-template')) continue;
      const b = bar(f.form);
      if (!gesucht.has(b)) continue;
      const t = sauber(f.tags);
      const schl = [e.word, e.pos, e.etymology_number || '', stich || '', f.form, t.join(',')].join('#');
      if (gesehen.has(schl)) continue;
      gesehen.add(schl);
      gefunden.add(b);
      aus.zeile({ w: e.word, pos: e.pos, n: e.etymology_number || null, k: stich, f: f.form, t, q: f.source });
      formen++;
    }
  }
  const groesse = await aus.fertig();
  console.log(`zusatz: ${saetze.length} Plätze · ${gesucht.size} verschiedene Wörter gesucht ·${gelesen} Zeilen gelesen · ${formen} Formen zu ${gefunden.size} Wörtern gefunden · ${groesse} B`);
}

const was = process.argv[2];
const t0 = Date.now();
if (was === 'arabisch') await arabisch();
else if (was === 'deutsch') await deutsch();
else if (was === 'tabellen') await tabellen();
else if (was === 'zusatz') await zusatz();
else { console.error('Aufruf: node werkzeuge/ersatz-quellen.mjs arabisch|deutsch|tabellen|zusatz'); process.exit(2); }
console.log('Dauer: ' + Math.round((Date.now() - t0) / 1000) + ' s');
