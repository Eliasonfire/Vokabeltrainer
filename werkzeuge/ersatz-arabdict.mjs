/* ersatz-arabdict.mjs -- arabdict.com als weitere Quelle der Ersatzdatenbank: holt zu den Wörtern, die nach
 * den Wörterbuch-Auszügen noch OFFEN sind, je eine Seite und liest die deutsch-arabischen Wortpaare aus.
 *
 * WARUM: Elias' Rangfolge der Belege nennt arabdict an vierter Stelle (1. arabicroots — für die Ersatzdatenbank
 * ausgeschlossen —, 2. seine Bücher, 3. sonstige Belege, 4. arabdict, 5. Langenscheidt nur im Notfall). Und
 * am 11.10.2026: „für das deutsche will ich im optimalfall auch eine quelle haben". Für viele Plätze nennt das
 * Wiktionary das arabische Wort, aber kein Deutsch, das den Sinn der Karte trifft; für rund 260 nennt es gar
 * keinen Eintrag.
 *
 * WAS DIE SEITE HERGIBT (gemessen 11.10.2026 an zwei Probeseiten): je Ergebniszeile <li class="res-item …">
 * eine deutsche Spalte und eine arabische. Das deutsche Stichwort steht im Vorlese-Knopf
 * getsound('…','de'), das arabische — dort MIT Vokalzeichen, wenn die Seite welche führt — in
 * getsound('…','ar'). Hinter dem deutschen Wort steht oft die Wortart „(n.)", „(adj.)", „(v.)" und ein
 * Sachgebiet in geschweiften Klammern. Die Suche selbst achtet nicht auf Vokalzeichen: mit und ohne kommt
 * dieselbe Liste. Es gibt je Suchwort EINE Seite mit höchstens rund 30 Zeilen (oben die genauen Treffer, dann
 * „relevante" und „ähnliche" Fügungen); weitere Seiten bietet arabdict nicht an.
 *
 * WAS IN DEN AUSZUG KOMMT: nur Zeilen, deren arabische Seite GENAU das gesuchte Wort ist (gleiche Buchstaben,
 * Artikel und Hamza-Träger beiseite). Fügungen, die das Wort nur enthalten, bleiben draußen. Ob die
 * Vokalzeichen zur Karte passen, entscheidet erst der Zuordner — hier wird nichts gewählt.
 *
 * RÜCKSICHT: robots.txt der Seite erlaubt den Abruf („User-agent: *  Allow: /"; gesperrt sind dort nur die
 * Sammler für KI-Training). Geholt wird trotzdem langsam, eins nach dem anderen mit Pause, jede Seite nur
 * einmal (Ablage lokal), und bei einer Antwort wie 403 oder 429 hört der Lauf sofort auf.
 *
 * Ablage (alles lokal unter data-ersatz/, nicht im Repo):
 *   data-ersatz/quellen/arabdict/seiten/<prüfsumme>.html   die geholte Seite, unverändert
 *   data-ersatz/quellen/arabdict/index.json                Suchwort → Datei, Zeitpunkt, Antwort
 *   data-ersatz/quellen/auszuege/arabdict.jsonl            die Wortpaare, eine Zeile je Paar
 *
 * Aufruf (aus dem Repo-Wurzelverzeichnis):
 *   node werkzeuge/ersatz-arabdict.mjs --plan                      zählt nur: wie viele Wörter wären zu holen
 *   node werkzeuge/ersatz-arabdict.mjs --holen [--max N] [--pause ms] [--buch <buch>] [--ids a,b,c]
 *                                                                  holt fehlende Seiten, dann den Auszug
 *   node werkzeuge/ersatz-arabdict.mjs --auszug                    baut nur den Auszug aus den abgelegten Seiten
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const REPO = process.env.ERSATZ_REPO || path.join(HIER, '..');
const ERSATZ = path.join(REPO, 'data-ersatz');
const ORDNER = path.join(ERSATZ, 'quellen', 'arabdict');
const SEITEN = path.join(ORDNER, 'seiten');
const INDEX = path.join(ORDNER, 'index.json');
const AUSZUG = path.join(ERSATZ, 'quellen', 'auszuege', 'arabdict.jsonl');
const BASIS = 'https://www.arabdict.com/de/deutsch-arabisch/';
const KOPF = { 'user-agent': 'Mozilla/5.0', 'accept-language': 'de' };
const BUECHER = ['madina-1', 'madina-2', 'madina-3', 'bayna-yadayk-1', 'bayna-yadayk-2', 'bayna-yadayk-3', 'bayna-yadayk-4', 'quran'];

/* Schrift — dieselben Vergleichsschlüssel wie im Zuordner (ersatz-zuordnen.mjs) */
const nfc = t => String(t ?? '').normalize('NFC').trim();
const ZEICHEN = /[ً-ْٰـ]/g;                       // Vokalzeichen, Dolchalif, Dehnungsstrich
export const nackt = t => nfc(t).replace(ZEICHEN, '').replace(/ٱ/g, 'ا');
export const ohneHamza = t => t.replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي');
const ARTIKEL_VOK = /^الْ?/;                           // Alif ohne Vokal + Lam: der Artikel
const hatVokalzeichen = t => /[ً-ْٰ]/.test(t);
const istArabisch = t => /[ء-ي]/.test(t);

const liesJson = (datei, sonst) => fs.existsSync(datei) ? JSON.parse(fs.readFileSync(datei, 'utf8')) : sonst;
function schreibe(datei, text) { fs.mkdirSync(path.dirname(datei), { recursive: true }); fs.writeFileSync(datei + '.neu', text, 'utf8'); fs.renameSync(datei + '.neu', datei); }
const pause = ms => new Promise(r => setTimeout(r, ms));
const arg = name => { const i = process.argv.indexOf(name); return i < 0 ? null : process.argv[i + 1]; };

/* ---------- welche Wörter ------------------------------------------------------------------------------------
 * Die offenen Plätze stehen in der Zuordnung (lokal); „offen" ist ein Platz, dessen Beleg nicht „belegt" sagt.
 * Gesucht wird ohne Vokalzeichen (so sucht die Seite ohnehin) und bei einem einzelnen Wort ohne den Artikel. */
export function suchwortVon(arVokalisiert) {
  const v = nfc(arVokalisiert).replace(/ـ/g, '');
  const einzeln = !/\s/.test(v);
  return nackt(einzeln && ARTIKEL_VOK.test(v) ? v.replace(ARTIKEL_VOK, '') : v).replace(/\s+/g, ' ');
}
function offenePlaetze() {
  const datei = path.join(ERSATZ, 'arbeit', 'zuordnung.jsonl');
  if (!fs.existsSync(datei)) throw new Error('Die Zuordnung fehlt — erst node werkzeuge/ersatz-zuordnen.mjs');
  const saetze = fs.readFileSync(datei, 'utf8').split('\n').filter(Boolean).map(z => JSON.parse(z));
  const belege = {};
  for (const buch of BUECHER) belege[buch] = liesJson(path.join(ERSATZ, 'belege-' + buch + '.json'), {});
  const nurBuch = arg('--buch'), nurIds = arg('--ids') ? new Set(arg('--ids').split(',')) : null;
  return saetze.filter(s => (nurIds ? nurIds.has(String(s.id)) : ((belege[s.buch] || {})[s.id] || {}).status !== 'belegt') && (!nurBuch || s.buch === nurBuch));
}

/* ---------- eine Seite lesen --------------------------------------------------------------------------------- */
const entkomme = t => String(t ?? '').replace(/\\(.)/g, '$1').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, ' ');
const klartext = s => entkomme(String(s).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const WORTART = { n: 'noun', v: 'verb', adj: 'adj', adv: 'adv', 'präp': 'prep', prep: 'prep', konj: 'conj', pron: 'pron', interj: 'intj', num: 'num' };
export function liesSeite(html, such) {
  const text = String(html);
  const anfaenge = [...text.matchAll(/<li class="res-item[^"]*"[^>]*>/g)].map(m => m.index);
  const ueberschriften = [...text.matchAll(/<h5[^>]*>([\s\S]{0,200}?)<\/h5>/g)].map(m => ({ pos: m.index, text: klartext(m[1]) }));
  const abschnittBei = pos => { let t = ''; for (const u of ueberschriften) if (u.pos < pos) t = u.text; return t; };
  const ziel = ohneHamza(nackt(such));
  const zielOhneArtikel = ziel.replace(/^ال/, '');
  const paare = [];
  anfaenge.forEach((a, i) => {
    const s = text.slice(a, i + 1 < anfaenge.length ? anfaenge[i + 1] : a + 6000);
    const de = entkomme((s.match(/getsound\('((?:[^'\\]|\\.)*)','de'/) || [])[1] || '').trim();
    const ar = nfc(entkomme((s.match(/getsound\('((?:[^'\\]|\\.)*)','ar'/) || [])[1] || ''));
    if (!de || !ar || !istArabisch(ar)) return;
    const bar = ohneHamza(nackt(ar)).replace(/\s+/g, ' ');
    // genau das gesuchte Wort: gleiche Buchstaben; bei einem einzelnen Wort zählt der Artikel nicht
    const genau = bar === ziel || (!/\s/.test(bar) && bar.replace(/^ال/, '') === zielOhneArtikel);
    if (!genau) return;
    const spalten = [...s.matchAll(/<div class="item-col([^"]*)"[^>]*>([\s\S]*?)<\/div>/g)];
    const deSpalte = klartext((spalten.find(m => !/\brtl\b/.test(m[1])) || [])[2] || '');
    const arSpalte = klartext((spalten.find(m => /\brtl\b/.test(m[1])) || [])[2] || '');
    const artikel = (deSpalte.match(/^(der|die|das)\s/) || [])[1] || null;
    const kuerzel = (deSpalte.match(/\(\s*(n|v|adj|adv|präp|prep|konj|pron|interj|num)\.\s*\)/i) || [])[1];
    // Geschweifte Klammern führen zweierlei: Beugungsformen eines Verbs („{verschwendete ; verschwendet}") und Sachgebiete
    // („{Recht}"), auch gemischt („{belangte ; belangt,Recht}"). Eckige: Mehrzahl („[pl. …]") oder Steigerung („[… ; am …]").
    const geschweift = [...deSpalte.matchAll(/\{([^}]*)\}/g)].flatMap(m => m[1].split(',')).map(x => x.trim()).filter(Boolean);
    const beugung = geschweift.filter(x => x.includes(';'));
    const gebiet = geschweift.filter(x => !x.includes(';'));
    const eckig = [...deSpalte.matchAll(/\[([^\]]*)\]/g)].map(m => m[1].trim());
    const einWort = !/\s/.test(de);
    /* Die Wortart des deutschen Gegenstücks — nur ein HINWEIS, ob das Paar zur Karte passen kann. „fest" ist allein die
     * Angabe der Seite; alles andere ist aus der Darstellung geschlossen (von Claude so festgelegt, 11.10.2026). */
    let pos = null, wie = null;
    if (kuerzel) { pos = WORTART[kuerzel.toLowerCase()]; wie = 'Wortart laut Seite'; }
    else if (beugung.length) { pos = 'verb'; wie = 'die Seite nennt Beugungsformen eines Verbs'; }
    else if (eckig.some(x => /;\s*am\s/.test(x))) { pos = 'adj'; wie = 'die Seite nennt Steigerungsformen'; }
    else if (einWort && (artikel || eckig.some(x => /^pl\./i.test(x)))) { pos = 'noun'; wie = artikel ? 'deutsches Wort mit Artikel' : 'die Seite nennt eine Mehrzahl'; }
    else if (einWort && /^[A-ZÄÖÜ]/.test(de)) { pos = 'noun'; wie = 'deutsches Wort großgeschrieben'; }
    else if (/(?:^|\s)[a-zäöüß-]+(?:en|ln|rn)$/.test(de) && !/^[A-ZÄÖÜ]/.test(de)) { pos = 'verb'; wie = 'deutsche Grundform eines Verbs'; }
    else if (einWort && /^[a-zäöüß-]+$/.test(de)) { pos = 'adj'; wie = 'deutsches Wort kleingeschrieben, keine Grundform eines Verbs'; }
    const mehrzahl = (arSpalte.match(/\[\s*ج\.\s*([^\]]*)\]/) || [])[1] || null;       // „[ج. …]" hinter dem arabischen Wort
    paare.push({ such, ar, vok: hatVokalzeichen(ar), de, artikel, pos, wie, fest: kuerzel ? true : undefined,
      gebiet: gebiet.length ? gebiet : undefined, mehrzahl: mehrzahl ? mehrzahl.trim() : undefined, abschnitt: abschnittBei(a) || 'oben', nr: i + 1 });
  });
  return { zeilen: anfaenge.length, paare };
}

/* ---------- Lauf --------------------------------------------------------------------------------------------- */
const index = liesJson(INDEX, {});
// „mitIndex": nur der Lauf, der selbst holt, schreibt den Index zurück — ein gleichzeitiger zweiter Aufruf (--auszug,
// während --holen noch läuft) soll ihm nichts überschreiben.
function baueAuszug(mitIndex) {
  const zeilen = [];
  let seiten = 0, mitPaar = 0;
  for (const [such, e] of Object.entries(index)) {
    if (!e.datei) continue;
    const datei = path.join(SEITEN, e.datei);
    if (!fs.existsSync(datei)) continue;
    seiten++;
    const { zeilen: n, paare } = liesSeite(fs.readFileSync(datei, 'utf8'), such);
    if (paare.length) mitPaar++;
    e.ergebniszeilen = n; e.paare = paare.length;
    for (const p of paare) zeilen.push(JSON.stringify(p));
  }
  schreibe(AUSZUG, zeilen.join('\n') + (zeilen.length ? '\n' : ''));
  if (mitIndex) schreibe(INDEX, JSON.stringify(index, null, 1));
  console.log(`AUSZUG: ${seiten} Seiten gelesen · ${mitPaar} mit mindestens einem Wortpaar zum Suchwort · ${zeilen.length} Wortpaare → ${path.relative(REPO, AUSZUG)}`);
}

const offen = (process.argv.includes('--plan') || process.argv.includes('--holen')) ? offenePlaetze() : [];
const woerter = new Map();
for (const s of offen) { const w = suchwortVon(s.suche.ar); if (w) (woerter.get(w) || woerter.set(w, []).get(w)).push(s.id); }
const fehlend = [...woerter.keys()].filter(w => !index[w]);

if (process.argv.includes('--plan')) {
  console.log(`PLAN: ${offen.length} offene Plätze · ${woerter.size} verschiedene Suchwörter · ${woerter.size - fehlend.length} schon abgelegt · ${fehlend.length} zu holen`);
} else if (process.argv.includes('--holen')) {
  const max = Number(arg('--max') || 50), warte = Number(arg('--pause') || 1500);
  fs.mkdirSync(SEITEN, { recursive: true });
  let geholt = 0, abbruch = null;
  for (const such of fehlend.slice(0, max)) {
    let r, html;
    try { r = await fetch(BASIS + encodeURIComponent(such), { headers: KOPF }); html = await r.text(); }
    catch (f) { abbruch = 'Netzfehler: ' + f.message; break; }
    if (r.status !== 200) {
      // 404 heißt bei arabdict „nichts gefunden" und wird gemerkt; alles andere (403, 429, 5xx) beendet den Lauf
      if (r.status === 404) index[such] = { status: 404, geholt: new Date().toISOString() };
      else { abbruch = 'HTTP ' + r.status + ' beim ' + (geholt + 1) + '. Abruf'; break; }
    } else {
      const datei = crypto.createHash('sha1').update(such).digest('hex').slice(0, 16) + '.html';
      schreibe(path.join(SEITEN, datei), html);
      index[such] = { datei, status: 200, zeichen: html.length, geholt: new Date().toISOString() };
    }
    geholt++;
    if (geholt % 20 === 0) schreibe(INDEX, JSON.stringify(index, null, 1));
    await pause(warte);
  }
  schreibe(INDEX, JSON.stringify(index, null, 1));
  console.log(`GEHOLT: ${geholt} Seiten (Pause ${warte} ms) · noch zu holen: ${fehlend.length - geholt}` + (abbruch ? ` · ABGEBROCHEN: ${abbruch}` : ''));
  baueAuszug(true);
} else if (process.argv.includes('--auszug')) {
  baueAuszug(false);
} else {
  console.log('Aufruf: node werkzeuge/ersatz-arabdict.mjs --plan | --holen [--max N] [--pause ms] [--buch <buch>] [--ids a,b] | --auszug');
}
