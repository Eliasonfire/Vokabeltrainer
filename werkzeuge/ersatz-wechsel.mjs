/* ersatz-wechsel.mjs -- auf die Ersatzdatenbank umschalten und wieder zurück, als EIN Befehl
 *
 * Elias, 11.10.2026: „… genauso organisiert … wie die bei arabicroots damit man … nahtlos wechseln kann ohne
 * probleme"; am 12.10.2026: „und könnten wir diese jederzeit nahtlos verwenden? also auch in bücher und kapiteln
 * und so aufgeteilt usw.. und auch einsatzbereit".
 *
 * ⛔ Umgeschaltet wird nur auf sein Wort. --hin verlangt beim ersten Mal seinen Satz als Angabe und legt ihn zum
 * geparkten Abzug (data-abzug/wechsel.json). Alles Weitere in diesem Kopf ist Claudes Ableitung.
 *
 *   node werkzeuge/ersatz-wechsel.mjs --stand              was liegt in data/, wo liegt der Abzug, passt es zusammen?
 *   node werkzeuge/ersatz-wechsel.mjs --probe              der Wechsel in einer Wegwerfkopie: Sammellauf und Paketbau
 *                                                          vorher und nachher, dann der Rückweg (dauert einige Minuten)
 *   node werkzeuge/ersatz-wechsel.mjs --hin "<sein Satz>"  umschalten
 *   node werkzeuge/ersatz-wechsel.mjs --hin                wenn schon umgeschaltet ist: die Karten in data/ nachziehen
 *                                                          (nach jedem Neubau der Ersatzdatenbank)
 *   node werkzeuge/ersatz-wechsel.mjs --zurueck            zurück auf den Abzug von arabicroots
 *
 * WAS --hin TUT. data/ ist, worauf die App läuft (datenquelle.mjs). Der Befehl
 *   1. kopiert die Buchdateien des Abzugs nach data-abzug/, zuletzt das Verzeichnis buecher.js -- mit ihm gilt
 *      der Abzug als geparkt, und hole-vokabeln.mjs wie die Werkzeuge der Ersatzdatenbank lesen ihn von dort;
 *   2. kopiert die Buchdateien und das Verzeichnis aus data-ersatz/ nach data/.
 * --zurueck kopiert den geparkten Abzug nach data/ zurück, prüft Datei für Datei auf Gleichheit, nimmt das
 * geparkte Verzeichnis als Erstes weg und räumt data-abzug/ ab. Jeder Schritt lässt sich wiederholen: bricht ein
 * Lauf mittendrin ab, zeigt --stand den Widerspruch, und --hin oder --zurueck bringen ihn zu Ende.
 *
 * WAS VORHER STIMMEN MUSS (sonst wird nichts angefasst): sein Satz · keine geänderte verfolgte Datei ·
 * pruefe-ersatz.mjs grün · die Ersatzdatenbank passt Platz für Platz auf den Abzug (dieselben Bücher, Kennungen,
 * Kapitel, Reihenfolge) -- fehlen darf nur, was in WEGGELASSEN steht (datenquelle.mjs).
 *
 * WAS DER BEFEHL NICHT TUT: kein Commit, kein Paketbau, keine Auslieferung; nichts an Elias' Lernstand, seinen
 * Notizen oder seiner Auswahl; vokabeln-eigene.js (seine eigenen Wörter) bleibt, wo sie ist. Was nach dem
 * Umschalten noch zu tun ist, nennt die Ausgabe.
 *
 * Bewacht von werkzeuge/test-ersatz-wechsel.mjs (hin und zurück in einem Wegwerfordner, danach steht data/ Byte
 * für Byte da wie vorher). Aufrufer: von Hand, auf Elias' Wort. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ABZUG_GEPARKT, abzugGeparkt, istErsatzkarte, liesListe, WEGGELASSEN } from './datenquelle.mjs';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const VERZEICHNIS = 'buecher.js';
const MERKZETTEL = 'wechsel.json';

/* ---------- Dateien ---------------------------------------------------------------------------------------- */
const gleicheDatei = (a, b) => fs.existsSync(a) && fs.existsSync(b) && fs.readFileSync(a).equals(fs.readFileSync(b));
/* Kopieren über eine Nachbardatei: bricht der Lauf mittendrin ab, steht am Ziel die alte oder die neue Datei,
 * nie eine halbe. Gibt zurück, ob sich am Ziel etwas geändert hat. */
function kopiere(von, nach) {
  if (gleicheDatei(von, nach)) return false;
  fs.copyFileSync(von, nach + '.neu');
  fs.renameSync(nach + '.neu', nach);
  if (!gleicheDatei(von, nach)) throw new Error(path.basename(nach) + ': die Kopie stimmt nicht mit der Vorlage überein');
  return true;
}
const liesJson = datei => { try { return JSON.parse(fs.readFileSync(datei, 'utf8')); } catch { return null; } };
function schreibeJson(datei, wert) {
  fs.writeFileSync(datei + '.neu', JSON.stringify(wert, null, 1) + '\n', 'utf8');
  fs.renameSync(datei + '.neu', datei);
}
/* Was wann umgeschaltet wurde, bleibt bei der Ersatzdatenbank stehen (lokal) -- der Merkzettel im geparkten Abzug
 * verschwindet mit dem Rückweg. */
function logge(repo, zeile) {
  const ersatz = path.join(repo, 'data-ersatz');
  if (!fs.existsSync(ersatz)) return;
  fs.mkdirSync(path.join(ersatz, 'arbeit'), { recursive: true });
  fs.appendFileSync(path.join(ersatz, 'arbeit', 'wechsel-log.jsonl'), JSON.stringify(zeile) + '\n', 'utf8');
}

/* ---------- Lesen und Vergleichen -------------------------------------------------------------------------- */
/* Ein Ordner mit Verzeichnis und Buchdateien (data/, data-abzug/ oder data-ersatz/), gelesen und gezählt. */
export function liesBestand(ordner) {
  const aus = { ordner, da: false, verzeichnis: [], buecher: {}, fehler: [] };
  const vz = path.join(ordner, VERZEICHNIS);
  if (!fs.existsSync(vz)) return aus;
  aus.da = true;
  try { aus.verzeichnis = liesListe(vz); } catch (e) { aus.fehler.push(VERZEICHNIS + ' ist nicht lesbar (' + e.message + ')'); return aus; }
  for (const b of aus.verzeichnis) {
    // das Verzeichnis nennt den Pfad, unter dem die APP lädt (data/…) -- hier zählt nur der Dateiname
    const name = path.basename(String(b.datei || 'vokabeln-' + b.slug + '.js'));
    const datei = path.join(ordner, name);
    if (!fs.existsSync(datei)) { aus.fehler.push(`${b.slug}: die Buchdatei ${name} fehlt`); continue; }
    let karten;
    try { karten = liesListe(datei); } catch (e) { aus.fehler.push(`${b.slug}: ${name} ist nicht lesbar (${e.message})`); continue; }
    if (karten.length !== b.vokabeln) aus.fehler.push(`${b.slug}: das Verzeichnis nennt ${b.vokabeln} Karten, die Buchdatei hat ${karten.length}`);
    aus.buecher[b.slug] = { name, datei, karten, ersatz: karten.filter(istErsatzkarte).length };
  }
  return aus;
}
const kartenzahl = b => Object.values(b.buecher).reduce((a, x) => a + x.karten.length, 0);
const ersatzzahl = b => Object.values(b.buecher).reduce((a, x) => a + x.ersatz, 0);
/* 'ersatz' = jede Karte stammt aus der Ersatzdatenbank · 'abzug' = keine · 'gemischt' · 'leer' = nichts da */
export function sorte(b) {
  const n = kartenzahl(b), e = ersatzzahl(b);
  return !b.da || !n ? 'leer' : e === n ? 'ersatz' : e === 0 ? 'abzug' : 'gemischt';
}

/* Passt die Ersatzdatenbank Platz für Platz auf den Abzug? Elias, 11.10.2026: „1:1 die selben vokabeln auch an
 * quantität". Was nicht passt, ist ein Hindernis für den Wechsel -- außer den Kennungen in WEGGELASSEN. */
export function vergleiche(abzug, ersatz) {
  const hindernisse = [], weggelassen = [];
  const zeige = ids => ids.slice(0, 8).join(', ') + (ids.length > 8 ? ' …' : '');
  for (const slug of Object.keys(abzug.buecher)) if (!ersatz.buecher[slug]) hindernisse.push(`das Buch ${slug} steht im Abzug, aber nicht in der Ersatzdatenbank — es verschwände aus der App`);
  for (const slug of Object.keys(ersatz.buecher)) if (!abzug.buecher[slug]) hindernisse.push(`das Buch ${slug} steht in der Ersatzdatenbank, aber nicht im Abzug`);
  for (const [slug, a] of Object.entries(abzug.buecher)) {
    const e = ersatz.buecher[slug];
    if (!e) continue;
    const aIds = a.karten.map(k => String(k.id)), eIds = e.karten.map(k => String(k.id));
    const aSet = new Set(aIds), eSet = new Set(eIds);
    if (eSet.size !== eIds.length) hindernisse.push(`${slug}: in der Ersatzdatenbank steht eine Kennung doppelt`);
    const fehlt = aIds.filter(id => !eSet.has(id));
    const unbenannt = fehlt.filter(id => !WEGGELASSEN.includes(id));
    weggelassen.push(...fehlt.filter(id => WEGGELASSEN.includes(id)));
    if (unbenannt.length) hindernisse.push(`${slug}: ${unbenannt.length} Karten des Abzugs fehlen in der Ersatzdatenbank und stehen nicht in der Liste der weggelassenen (${zeige(unbenannt)}) — Elias, 27.09.2026: „weniger soll nicht werden aber kann mehr werden"`);
    const fremd = eIds.filter(id => !aSet.has(id));
    if (fremd.length) hindernisse.push(`${slug}: ${fremd.length} Karten der Ersatzdatenbank kennt der Abzug nicht (${zeige(fremd)})`);
    if (aIds.filter(id => eSet.has(id)).join() !== eIds.filter(id => aSet.has(id)).join()) hindernisse.push(`${slug}: die Karten stehen in anderer Reihenfolge als im Abzug`);
    const kapitel = new Map(a.karten.map(k => [String(k.id), k.chapter]));
    const verrueckt = e.karten.filter(k => kapitel.has(String(k.id)) && kapitel.get(String(k.id)) !== k.chapter).map(k => String(k.id));
    if (verrueckt.length) hindernisse.push(`${slug}: ${verrueckt.length} Karten stehen in einem anderen Kapitel als im Abzug (${zeige(verrueckt)})`);
  }
  return { hindernisse, weggelassen };
}

/* ---------- Was vor dem ERSTEN Umschalten stimmen muss ----------------------------------------------------- */
/* git liegt nicht in jedem PATH (arbeit.mjs, 29.07.2026) -- dieselben Orte wie dort. Rückgabe: Liste der
 * geänderten verfolgten Dateien · null = kein Git-Ordner (Wegwerfkopie) · undefined = git nicht aufrufbar. */
const GIT_ORTE = [
  'git',
  path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Git', 'cmd', 'git.exe'),
  path.join(process.env.USERPROFILE || '', '.local', 'Git', 'Git', 'cmd', 'git.exe'),
  'C:\\Program Files\\Git\\cmd\\git.exe',
  'C:\\Program Files (x86)\\Git\\cmd\\git.exe',
];
function geaenderteVerfolgte(repo) {
  if (!fs.existsSync(path.join(repo, '.git'))) return null;
  for (const git of GIT_ORTE) {
    const r = spawnSync(git, ['-C', repo, 'status', '--porcelain', '--untracked-files=no'], { encoding: 'utf8' });
    if (r.status === 0) return r.stdout.split('\n').filter(Boolean).map(z => z.slice(3));
  }
  return undefined;
}
/* Getrennt von der Ausführung, damit der Test jede Bedingung einzeln verlangen kann. */
export function vorbedingungen({ satz, geaendert, prueferCode, prueferZeile }) {
  const h = [];
  if (!satz || !String(satz).trim()) h.push('ohne Elias\' Satz wird nicht umgeschaltet — Aufruf: --hin "<sein Satz, wörtlich>"');
  if (geaendert === undefined) h.push('git ließ sich nicht aufrufen — ob verfolgte Dateien geändert sind, ist nicht prüfbar');
  else if (geaendert && geaendert.length) h.push(`es liegen geänderte verfolgte Dateien da (${geaendert.slice(0, 5).join(', ')}${geaendert.length > 5 ? ' …' : ''}) — erst committen oder zurücknehmen; der Wechsel soll die einzige Änderung sein`);
  if (prueferCode !== 0) h.push(`pruefe-ersatz.mjs ist nicht grün (Exit ${prueferCode}): ${prueferZeile || ''}`);
  return h;
}
function pruefeErsatz(repo) {
  const r = spawnSync(process.execPath, [path.join(HIER, 'pruefe-ersatz.mjs'), '--knapp'], { encoding: 'utf8', env: { ...process.env, ERSATZ_REPO: repo } });
  const zeilen = ((r.stdout || '') + (r.stderr || '')).trim().split(/\r?\n/);
  return { code: r.status, zeile: (zeilen[zeilen.length - 1] || '').slice(0, 200) };
}

/* ---------- Hin ------------------------------------------------------------------------------------------- */
export function hin(repo, { satz = '', ersatzOrdner = path.join(repo, 'data-ersatz'), jetzt = new Date().toISOString(), vorab = [] } = {}) {
  const data = path.join(repo, 'data'), park = path.join(repo, ABZUG_GEPARKT);
  const geparkt = abzugGeparkt(repo);
  const abzug = liesBestand(geparkt ? park : data), ersatz = liesBestand(ersatzOrdner);
  const h = [...vorab];
  if (!abzug.da) h.push(`${geparkt ? ABZUG_GEPARKT : 'data'}/${VERZEICHNIS} fehlt — es gibt keinen Abzug, auf den die Ersatzdatenbank passen könnte`);
  if (!ersatz.da) h.push(`in ${ersatzOrdner} liegt kein Verzeichnis ${VERZEICHNIS} — erst „node werkzeuge/ersatz-bauen.mjs“`);
  h.push(...abzug.fehler.map(f => 'Abzug: ' + f), ...ersatz.fehler.map(f => 'Ersatzdatenbank: ' + f));
  if (abzug.da && !abzug.fehler.length && sorte(abzug) !== 'abzug') h.push(`der Abzug (${geparkt ? ABZUG_GEPARKT : 'data'}/) enthält ${sorte(abzug) === 'leer' ? 'keine Karten' : 'Karten der Ersatzdatenbank'} — „--stand“ zeigt die Lage`);
  if (ersatz.da && !ersatz.fehler.length && sorte(ersatz) !== 'ersatz') h.push('in der Ersatzdatenbank stehen Karten, die nicht aus ihr stammen (source ist nicht „ersatz“)');
  const v = abzug.da && ersatz.da ? vergleiche(abzug, ersatz) : { hindernisse: [], weggelassen: [] };
  h.push(...v.hindernisse);
  if (h.length) return { ok: false, hindernisse: h };

  if (!geparkt) {
    fs.mkdirSync(park, { recursive: true });
    for (const b of Object.values(abzug.buecher)) kopiere(b.datei, path.join(park, b.name));
    schreibeJson(path.join(park, MERKZETTEL), { seit: jetzt, satz: String(satz).trim(), nachgezogen: jetzt });
    kopiere(path.join(data, VERZEICHNIS), path.join(park, VERZEICHNIS));   // als LETZTES: ab hier gilt der Abzug als geparkt
  }
  const geaendert = [];
  for (const b of Object.values(ersatz.buecher)) if (kopiere(b.datei, path.join(data, b.name))) geaendert.push(b.name);
  if (kopiere(path.join(ersatzOrdner, VERZEICHNIS), path.join(data, VERZEICHNIS))) geaendert.push(VERZEICHNIS);
  if (geparkt && geaendert.length) schreibeJson(path.join(park, MERKZETTEL), { ...(liesJson(path.join(park, MERKZETTEL)) || {}), nachgezogen: jetzt });
  if (!geparkt || geaendert.length) logge(repo, { wann: jetzt, was: geparkt ? 'nachgezogen' : 'hin', satz: geparkt ? undefined : String(satz).trim(), dateien: geaendert, karten: kartenzahl(ersatz), weggelassen: v.weggelassen.length });
  return { ok: true, erstmals: !geparkt, geaendert, karten: kartenzahl(ersatz), buecher: Object.keys(ersatz.buecher).length, abzugKarten: kartenzahl(abzug), weggelassen: v.weggelassen };
}

/* ---------- Zurück ---------------------------------------------------------------------------------------- */
export function zurueck(repo, { jetzt = new Date().toISOString() } = {}) {
  const data = path.join(repo, 'data'), park = path.join(repo, ABZUG_GEPARKT);
  if (!abzugGeparkt(repo)) {
    const d = liesBestand(data);
    if (sorte(d) === 'abzug' && !d.fehler.length) return { ok: true, nichtsZuTun: true, karten: kartenzahl(d) };
    return { ok: false, hindernisse: [sorte(d) === 'ersatz' || sorte(d) === 'gemischt'
      ? `in data/ liegen Karten der Ersatzdatenbank, aber es gibt keinen geparkten Abzug (${ABZUG_GEPARKT}/${VERZEICHNIS} fehlt) — zurück geht dann nur über einen neuen Abzug: die Buchdateien der Ersatzdatenbank aus data/ wegnehmen, danach „node werkzeuge/hole-vokabeln.mjs“`
      : 'in data/ liegt kein lesbarer Abzug und es ist auch keiner geparkt: ' + (d.fehler.join('; ') || 'kein Verzeichnis')] };
  }
  const abzug = liesBestand(park);
  const h = abzug.fehler.map(f => 'geparkter Abzug: ' + f);
  if (!abzug.fehler.length && sorte(abzug) !== 'abzug') h.push(`der geparkte Abzug enthält ${sorte(abzug) === 'leer' ? 'keine Karten' : 'Karten der Ersatzdatenbank'} — nichts angefasst`);
  if (h.length) return { ok: false, hindernisse: h };

  const jetztDa = liesBestand(data), geaendert = [];
  for (const b of Object.values(abzug.buecher)) if (kopiere(b.datei, path.join(data, b.name))) geaendert.push(b.name);
  // eine Buchdatei, die nur die Ersatzdatenbank kannte, geht mit ihr (heute gibt es keine solche)
  for (const [slug, b] of Object.entries(jetztDa.buecher)) if (!abzug.buecher[slug] && b.ersatz === b.karten.length) { fs.rmSync(b.datei); geaendert.push('entfernt: ' + b.name); }
  if (kopiere(path.join(park, VERZEICHNIS), path.join(data, VERZEICHNIS))) geaendert.push(VERZEICHNIS);
  // erst nachsehen, dann abräumen: der geparkte Abzug ist die einzige Fassung, solange er nicht in data/ steht
  for (const b of Object.values(abzug.buecher)) if (!gleicheDatei(b.datei, path.join(data, b.name))) throw new Error(b.name + ': steht in data/ nicht so da wie im geparkten Abzug — nichts abgeräumt');
  const merk = liesJson(path.join(park, MERKZETTEL));
  fs.rmSync(path.join(park, VERZEICHNIS));                                  // als ERSTES: ab hier liegt der Abzug wieder in data/
  for (const b of Object.values(abzug.buecher)) fs.rmSync(b.datei);
  fs.rmSync(path.join(park, MERKZETTEL), { force: true });
  const rest = fs.readdirSync(park);
  if (!rest.length) fs.rmdirSync(park);
  logge(repo, { wann: jetzt, was: 'zurueck', dateien: geaendert, karten: kartenzahl(abzug), umgeschaltetSeit: merk ? merk.seit : undefined });
  return { ok: true, geaendert, karten: kartenzahl(abzug), buecher: Object.keys(abzug.buecher).length, rest, seit: merk ? merk.seit : null };
}

/* ---------- Stand ----------------------------------------------------------------------------------------- */
export function stand(repo) {
  const data = path.join(repo, 'data'), park = path.join(repo, ABZUG_GEPARKT), ersatzOrdner = path.join(repo, 'data-ersatz');
  const geparkt = abzugGeparkt(repo);
  const d = liesBestand(data), p = geparkt ? liesBestand(park) : null, e = liesBestand(ersatzOrdner);
  const sd = sorte(d), widerspruch = [], hinweise = [];
  widerspruch.push(...d.fehler.map(f => 'data/: ' + f));
  if (p) widerspruch.push(...p.fehler.map(f => ABZUG_GEPARKT + '/: ' + f));
  if (p && !p.fehler.length && sorte(p) !== 'abzug') widerspruch.push(`${ABZUG_GEPARKT}/ enthält ${sorte(p) === 'leer' ? 'keine Karten' : 'Karten der Ersatzdatenbank'} statt des Abzugs`);
  if (sd === 'gemischt') widerspruch.push('in data/ stehen Karten der Ersatzdatenbank und Karten von arabicroots nebeneinander');
  if (geparkt && sd === 'abzug') widerspruch.push('der Abzug ist geparkt, aber in data/ liegen (noch) die Karten von arabicroots — ein Wechsel ist nicht zu Ende gelaufen: „--hin“ bringt ihn zu Ende, „--zurueck“ nimmt ihn zurück');
  if (!geparkt && sd === 'ersatz') widerspruch.push(`in data/ liegen Karten der Ersatzdatenbank, aber ${ABZUG_GEPARKT}/${VERZEICHNIS} fehlt — der Abzug ist nicht da, wo er sein müsste`);
  const veraltet = [];
  if (geparkt && sd === 'ersatz' && e.da) {
    for (const b of Object.values(e.buecher)) if (!gleicheDatei(b.datei, path.join(data, b.name))) veraltet.push(b.name);
    if (!gleicheDatei(path.join(ersatzOrdner, VERZEICHNIS), path.join(data, VERZEICHNIS))) veraltet.push(VERZEICHNIS);
    if (veraltet.length) hinweise.push(`data-ersatz/ ist neuer als die Karten in data/ (${veraltet.length} Dateien) — „--hin“ zieht sie nach`);
  }
  const abzug = geparkt ? p : sd === 'abzug' ? d : null;
  const vergleich = abzug && !abzug.fehler.length && e.da && !e.fehler.length && sorte(e) === 'ersatz' ? vergleiche(abzug, e) : null;
  if (e.da && !e.fehler.length) {
    const hat = new Set(Object.values(e.buecher).flatMap(b => b.karten.map(k => String(k.id))));
    const belegt = WEGGELASSEN.filter(id => hat.has(id));
    if (belegt.length) hinweise.push(`${belegt.length} Kennungen stehen in WEGGELASSEN (datenquelle.mjs), haben inzwischen aber eine Karte: ${belegt.join(', ')} — dort herausnehmen`);
  }
  return { geparkt, quelle: sd, widerspruch, hinweise, veraltet, vergleich,
    merk: geparkt ? liesJson(path.join(park, MERKZETTEL)) : null,
    data: { karten: kartenzahl(d), buecher: Object.keys(d.buecher).length },
    abzug: abzug ? { karten: kartenzahl(abzug), buecher: Object.keys(abzug.buecher).length, ordner: geparkt ? ABZUG_GEPARKT : 'data' } : null,
    ersatz: e.da ? { karten: kartenzahl(e), buecher: Object.keys(e.buecher).length, fehler: e.fehler } : null };
}

/* ---------- Probe ----------------------------------------------------------------------------------------- */
/* Die Übersicht des Sammellaufs (alle-pruefer.mjs --knapp) als Karte Prüfer -> Exit und Schlusszeile. Ein
 * Prüfer, der zweimal läuft (mit anderen Angaben), bekommt eine Nummer. */
export function uebersicht(text) {
  const aus = new Map(), zaehler = new Map();
  for (const z of String(text).split(/\r?\n/)) {
    const m = z.match(/^\s*\S+\s+(\S+)\s+exit\s+(-?\d+)\s+(.*)$/);
    if (!m) continue;
    const n = (zaehler.get(m[1]) || 0) + 1;
    zaehler.set(m[1], n);
    aus.set(m[1] + (n > 1 ? ' (' + n + '. Lauf)' : ''), { code: Number(m[2]), zeile: m[3].trim() });
  }
  return aus;
}
export function unterschied(vorher, nachher) {
  const a = uebersicht(vorher), b = uebersicht(nachher), aus = [];
  for (const name of new Set([...a.keys(), ...b.keys()])) {
    const x = a.get(name), y = b.get(name);
    if (!x || !y) aus.push({ name, art: x ? 'nur vorher' : 'nur nachher', vorher: x || null, nachher: y || null });
    else if (x.code !== y.code) aus.push({ name, art: x.code === 0 ? 'NEU ROT' : y.code === 0 ? 'neu grün' : 'anderer Exit', vorher: x, nachher: y });
    // ein Prüfer, der in der Kopie schon vorher rot war (sie hat kein Git), kann durch den Wechsel einen Befund
    // dazubekommen -- das zeigt dann nur die Schlusszeile, nicht der Exit
    else if (x.zeile !== y.zeile) aus.push({ name, art: x.code !== 0 ? 'ROT GEBLIEBEN, andere Schlusszeile' : 'andere Schlusszeile', vorher: x, nachher: y });
  }
  return { pruefer: a.size, aus };
}
function abdruckVon(ordner) {
  const aus = {};
  for (const name of fs.readdirSync(ordner).sort()) {
    const datei = path.join(ordner, name);
    if (fs.statSync(datei).isFile()) aus[name] = createHash('sha256').update(fs.readFileSync(datei)).digest('hex');
  }
  return JSON.stringify(aus);
}
/* Der Probelauf vom 12.10.2026 als Befehl: eine Wegwerfkopie des Projekts (ohne .git, transcripts, data-ersatz,
 * .deploy), darin Sammellauf und Paketbau mit dem Abzug, dann der echte Wechsel, dann beides noch einmal, dann
 * der Rückweg. Der UNTERSCHIED ist der Befund. Der echte Ordner wird nur gelesen; das Paket der Probe geht in
 * die Kopie, nie in den Downloads-Ordner. */
export function probe(repo, { melde = () => {} } = {}) {
  const ersatzOrdner = path.join(repo, 'data-ersatz');
  if (abzugGeparkt(repo)) return { ok: false, hindernisse: ['es ist schon umgeschaltet — die Probe misst den Wechsel HIN und braucht dafür den Stand davor'] };
  if (!fs.existsSync(path.join(ersatzOrdner, VERZEICHNIS))) return { ok: false, hindernisse: [`data-ersatz/${VERZEICHNIS} fehlt — es gibt keine Ersatzdatenbank, auf die umgeschaltet werden könnte`] };
  const ziel = fs.mkdtempSync(path.join(os.tmpdir(), 'vt-wechselprobe-'));
  try {
    const AUSGELASSEN = new Set(['.git', 'transcripts', 'data-ersatz', '.deploy', 'node_modules']);
    melde('Kopie anlegen …');
    fs.cpSync(repo, ziel, { recursive: true, dereference: true, filter: von => !AUSGELASSEN.has(path.relative(repo, von).split(path.sep)[0]) });
    const env = { ...process.env, VOKABELPAKET_ABLAGE: path.join(ziel, '.ablage-probe') };
    delete env.ERSATZ_REPO;
    const lauf = (skript, args = []) => {
      const r = spawnSync(process.execPath, [path.join(ziel, skript), ...args], { cwd: ziel, env, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
      return { code: r.status, text: (r.stdout || '') + (r.stderr || '') };
    };
    const datenVorher = abdruckVon(path.join(ziel, 'data'));
    melde('Sammellauf und Paketbau mit dem Abzug …');
    const vorher = { sammel: lauf('werkzeuge/alle-pruefer.mjs', ['--knapp']), paket: lauf('werkzeuge/baue-vokabelpaket.mjs') };
    const wechsel = hin(ziel, { satz: 'Probe in einer Wegwerfkopie — kein Satz von Elias', ersatzOrdner });
    if (!wechsel.ok) return { ok: false, hindernisse: wechsel.hindernisse.map(t => 'der Wechsel in der Kopie: ' + t) };
    melde('Sammellauf und Paketbau mit der Ersatzdatenbank …');
    const nachher = { sammel: lauf('werkzeuge/alle-pruefer.mjs', ['--knapp']), paket: lauf('werkzeuge/baue-vokabelpaket.mjs') };
    const rueck = zurueck(ziel);
    const rueckwegGleich = rueck.ok && abdruckVon(path.join(ziel, 'data')) === datenVorher && !fs.existsSync(path.join(ziel, ABZUG_GEPARKT));
    return { ok: true, wechsel, vorher, nachher, ...unterschied(vorher.sammel.text, nachher.sammel.text), rueckwegGleich };
  } finally {
    fs.rmSync(ziel, { recursive: true, force: true });
  }
}

/* ---------- Aufruf ---------------------------------------------------------------------------------------- */
function haupt() {
  const args = process.argv.slice(2);
  const REPO = process.env.ERSATZ_REPO || path.join(HIER, '..');
  const angabe = n => { const w = args[args.indexOf(n) + 1]; return w && !w.startsWith('--') ? w : ''; };
  const verweigert = (was, hindernisse) => {
    console.log(`⛔ ${was} — nichts angefasst:`);
    for (const t of hindernisse) console.log('   · ' + t);
    process.exit(1);
  };

  if (args.includes('--hin')) {
    const geparkt = abzugGeparkt(REPO), p = pruefeErsatz(REPO);
    const vorab = geparkt
      ? (p.code !== 0 ? [`pruefe-ersatz.mjs ist nicht grün (Exit ${p.code}): ${p.zeile}`] : [])
      : vorbedingungen({ satz: angabe('--hin'), geaendert: geaenderteVerfolgte(REPO), prueferCode: p.code, prueferZeile: p.zeile });
    const r = hin(REPO, { satz: angabe('--hin'), vorab });
    if (!r.ok) verweigert(geparkt ? 'Nicht nachgezogen' : 'Nicht umgeschaltet', r.hindernisse);
    if (!r.erstmals) {
      console.log(r.geaendert.length
        ? `✅ Nachgezogen: ${r.geaendert.length} Dateien in data/ sind jetzt auf dem Stand von data-ersatz/ (${r.geaendert.join(', ')}).`
        : '✅ Nichts nachzuziehen: data/ steht schon auf dem Stand von data-ersatz/.');
      if (r.geaendert.length) console.log('   Noch nicht geschehen: Sammellauf, Commit (falls data/buecher.js anders ist), Auslieferung, Paket.');
      return;
    }
    console.log(`✅ Umgeschaltet. In data/ liegt jetzt die Ersatzdatenbank: ${r.karten} Karten in ${r.buecher} Büchern.`);
    console.log(`   Der Abzug von arabicroots (${r.abzugKarten} Karten) steht in ${ABZUG_GEPARKT}/; weggelassen sind ${r.weggelassen.length} benannte Plätze.`);
    console.log('   Noch NICHT geschehen — das gehört nicht zu diesem Befehl:');
    console.log('   1. node werkzeuge/alle-pruefer.mjs --knapp   (misst jetzt die Ersatzkarten)');
    console.log('   2. data/buecher.js committen — die einzige verfolgte Datei, die sich geändert hat');
    console.log('   3. CACHE_NAME in sw.js erhöhen, dann node werkzeuge/veroeffentlichen.mjs --mit-daten');
    console.log('   4. node werkzeuge/baue-vokabelpaket.mjs — und das neue Paket auf jedem Gerät einlesen, auf dem schon');
    console.log('      eines eingelesen ist: dort geht das eingelesene Paket den ausgelieferten Buchdateien vor.');
    console.log('   Zurück: node werkzeuge/ersatz-wechsel.mjs --zurueck');
    return;
  }

  if (args.includes('--zurueck')) {
    const r = zurueck(REPO);
    if (!r.ok) verweigert('Nicht zurückgeschaltet', r.hindernisse);
    if (r.nichtsZuTun) { console.log(`✅ Nichts zu tun: in data/ liegt der Abzug von arabicroots (${r.karten} Karten), geparkt ist nichts.`); return; }
    console.log(`✅ Zurückgeschaltet. In data/ liegt wieder der Abzug von arabicroots: ${r.karten} Karten in ${r.buecher} Büchern.`);
    if (r.rest.length) console.log(`   ⚠️ In ${ABZUG_GEPARKT}/ liegen noch Dateien, die nicht vom Wechsel stammen: ${r.rest.join(', ')}`);
    console.log('   Noch nicht geschehen: Sammellauf, Commit (data/buecher.js), Auslieferung, Paket.');
    return;
  }

  if (args.includes('--probe')) {
    const r = probe(REPO, { melde: t => console.log('… ' + t) });
    if (!r.ok) verweigert('Probe nicht gelaufen', r.hindernisse);
    const kurz = x => `Exit ${x.code}  ${x.zeile.slice(0, 110)}`;
    console.log(`\nPROBE: Wechsel in einer Wegwerfkopie — ${r.wechsel.karten} Ersatzkarten statt ${r.wechsel.abzugKarten}, ${r.wechsel.weggelassen.length} benannte Plätze weggelassen.`);
    console.log(`Sammellauf: ${r.pruefer} Prüfer verglichen, ${r.aus.length} verhalten sich anders.`);
    for (const art of ['NEU ROT', 'ROT GEBLIEBEN, andere Schlusszeile', 'anderer Exit', 'nur vorher', 'nur nachher', 'neu grün', 'andere Schlusszeile']) {
      const teil = r.aus.filter(u => u.art === art);
      if (!teil.length) continue;
      console.log(`\n  ${art} (${teil.length}):`);
      for (const u of teil) {
        console.log('   ' + u.name);
        if (u.vorher) console.log('      vorher:  ' + kurz(u.vorher));
        if (u.nachher) console.log('      nachher: ' + kurz(u.nachher));
      }
    }
    const ende = t => t.trim().split(/\r?\n/).filter(Boolean).slice(-4).map(z => '      ' + z.slice(0, 150)).join('\n');
    console.log(`\nPaketbau vorher:  Exit ${r.vorher.paket.code}\n${ende(r.vorher.paket.text)}`);
    console.log(`Paketbau nachher: Exit ${r.nachher.paket.code}\n${ende(r.nachher.paket.text)}`);
    console.log(`\nRückweg in der Kopie: ${r.rueckwegGleich ? '✅ data/ steht danach Byte für Byte da wie vorher' : '⛔ data/ steht danach NICHT da wie vorher'}`);
    console.log('⚠️ Grenze der Messung: verglichen sind Exit und Schlusszeile je Prüfer. Ein Prüfer, der mit Ersatzkarten andere');
    console.log('   Einzelheiten, aber dieselbe Schlusszeile meldet, fällt so nicht auf.');
    const rot = r.aus.filter(u => u.art === 'NEU ROT' || u.art.startsWith('ROT GEBLIEBEN') || u.art === 'anderer Exit' || u.art === 'nur vorher').length;
    process.exit(rot || r.nachher.paket.code !== 0 || !r.rueckwegGleich ? 2 : 0);
  }

  if (!args.length || args.includes('--stand')) {
    const s = stand(REPO);
    const was = { ersatz: 'die Ersatzdatenbank', abzug: 'der Abzug von arabicroots', gemischt: 'beides durcheinander', leer: 'nichts' }[s.quelle];
    console.log(`WORAUF DIE APP LÄUFT: ${was} — data/ hat ${s.data.karten} Karten in ${s.data.buecher} Büchern.`);
    if (s.geparkt) console.log(`Der Abzug von arabicroots steht geparkt in ${ABZUG_GEPARKT}/${s.abzug ? ` (${s.abzug.karten} Karten)` : ''}${s.merk ? `, umgeschaltet seit ${s.merk.seit}, zuletzt nachgezogen ${s.merk.nachgezogen}` : ''}.`);
    if (s.merk && s.merk.satz) console.log(`Elias' Satz dazu: „${s.merk.satz}“`);
    if (s.ersatz) console.log(`Ersatzdatenbank (data-ersatz/): ${s.ersatz.karten} Karten in ${s.ersatz.buecher} Büchern${s.ersatz.fehler.length ? ' — ⚠️ ' + s.ersatz.fehler.join('; ') : ''}.`);
    else console.log('Ersatzdatenbank (data-ersatz/): liegt auf diesem Rechner nicht.');
    if (s.vergleich) console.log(s.vergleich.hindernisse.length
      ? `Einem Wechsel steht im Weg (${s.vergleich.hindernisse.length}):\n` + s.vergleich.hindernisse.map(t => '   · ' + t).join('\n')
      : `Ersatzdatenbank und Abzug passen Platz für Platz zusammen; ${s.vergleich.weggelassen.length} benannte Plätze sind weggelassen.`);
    for (const t of s.hinweise) console.log('ⓘ ' + t);
    if (s.widerspruch.length) {
      console.log(`⛔ WIDERSPRUCH (${s.widerspruch.length}):`);
      for (const t of s.widerspruch) console.log('   · ' + t);
      process.exit(2);
    }
    console.log('✅ Die Lage ist in sich stimmig.');
    return;
  }

  console.log('Aufruf: node werkzeuge/ersatz-wechsel.mjs --stand | --probe | --hin "<Elias\' Satz>" | --hin | --zurueck');
  process.exit(1);
}

const selbst = fileURLToPath(import.meta.url), aufgerufen = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (process.platform === 'win32' ? selbst.toLowerCase() === aufgerufen.toLowerCase() : selbst === aufgerufen) haupt();
