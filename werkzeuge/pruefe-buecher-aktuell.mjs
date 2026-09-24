#!/usr/bin/env node
/* pruefe-buecher-aktuell.mjs — „Sind Bücher und Kapitel aktuell?"
 * ==========================================================================
 *
 * ⭐ SEIN AUFTRAG (23.09.2026, ~20:40, mit Bild der Vokabeln-Seite, die nur
 * Madina zeigte):
 *
 *   „die vokabeln gehen nur bis medina 24, ich bin aber bayna yadayk. zum
 *   vollen programm dem skill soll auch hinzugefügt werden bzw irgendwer soll
 *   auch gucken ob das meine kapitel hier auch aktuell sind und auch bücher"
 *
 *   und direkt danach: „am besten sobald ich neues buch freischalte soll neues
 *   buch kommen und alle kapteln gezeigt werden da"
 *
 * Die Seite selbst ist seit v585 richtig (pruefe-vokabeln-seite.mjs). Dieses
 * Werkzeug ist das „irgendwer soll auch gucken": es läuft im vollen Programm
 * und in der wöchentlichen Wartung, direkt nach `vorrat.mjs --stand`.
 *
 * ========================= DIE VIER QUELLEN ===============================
 *
 * | Quelle | Datei | wer schreibt sie |
 * |---|---|---|
 * | arabicroots: freigeschaltete Kapitel | `--roots <datei>`, Vorgabe `.stand-freigeschaltet.json` | die Routine, aus `get_unlocked_chapters` |
 * | seine Buchauswahl in der App | `--app <datei>`, Vorgabe `.stand-app.json` | `vorrat.mjs --stand … --app auto` (derselbe KV-Abruf) |
 * | FREIGESCHALTET | `js/kern.js` | `vorrat.mjs --stand` |
 * | die Bücher der App | `data/buecher.js` + `data/vokabeln-<buch>.js` | `hole-vokabeln.mjs` (Buchdateien: nur lokal, rechtlich gesperrt fürs Repo) |
 *
 * ⭐ WAS ZÄHLT, steht in `istBekannt()` (js/kern.js): hat er für ein Buch
 * Kapitel angehakt, entscheidet SEINE Auswahl — FREIGESCHALTET gilt nur für
 * ein Buch ohne Auswahl. [[app_auswahl_entscheidet]] Deshalb ist ein Kapitel,
 * das nur arabicroots freigeschaltet hat, für ihn UNSICHTBAR, sobald er für
 * dieses Buch überhaupt etwas angehakt hat. Genau das ist die Frage an ihn.
 *
 * ========================= DIE MELDUNGEN ==================================
 *
 * Befund (Exit 1) — Arbeit für mich oder die Routine, keine Frage an ihn:
 *   B1  arabicroots meldet eine Buchkennung, die die App nicht kennt
 *       (so fiel „aby-1" = Bayna Yadayk 1 bis 24.09.2026 still heraus;
 *       Zuordnung in werkzeuge/arabicroots-buecher.mjs, nur gemessen)
 *   B2  arabicroots hat ein Kapitel frei, FREIGESCHALTET nicht
 *       (vorrat.mjs --stand nicht gelaufen)
 *   B3  ein Buch, das er lernt oder das frei ist, fehlt in data/buecher.js,
 *       hat keine Buchdatei, oder die Buchdatei hat für ein freies Kapitel
 *       keine Wörter / weniger Kapitel, als data/buecher.js angibt
 *   B4  ein Buch aus data/buecher.js hat keine Kurzform in BUCH_KURZ
 *       (js/buecher.js) — der Kapitel-Chip der Lernkarte zeigt dann den
 *       langen Titel (Elias 24.09.2026: „… sollte das auch immer dabei stehen
 *       aber halt in kurzform")
 *
 * Frage an Elias (Exit 2, Warteseite) — seine Entscheidung, nichts eintragen:
 *   F1  bei arabicroots frei, in seiner Auswahl nicht, obwohl er für dieses
 *       Buch Kapitel angehakt hat (oder das ganze Buch nicht) — soll es dazu?
 *
 * Nur Hinweis (ändert den Exitcode nicht):
 *   H1  ein Kapitel steht in FREIGESCHALTET, aber weder arabicroots noch
 *       seine Auswahl nennen es. Wirkt nur bei einem Buch ohne Auswahl.
 *       FREIGESCHALTET wird nie beschnitten — Zurückdrehen ist seine Sache.
 *
 * Aufruf:
 *   node werkzeuge/pruefe-buecher-aktuell.mjs [--roots <datei>] [--app <datei>]
 *   node werkzeuge/pruefe-buecher-aktuell.mjs --json      nur die Ergebnisse als JSON (für wartet-auf-elias.mjs)
 *   node werkzeuge/pruefe-buecher-aktuell.mjs --stoertest fünf eingebaute Störungen, jede muss ihre Meldung auslösen
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { kapitelAusRoots } from './arabicroots-buecher.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARG = process.argv.slice(2);
const wert = (name) => { const i = ARG.indexOf(name); return i >= 0 ? ARG[i + 1] : null; };
const NUR_JSON = ARG.includes('--json');
const STOERTEST = ARG.includes('--stoertest');
const p = (rel) => path.join(REPO, rel);

/* ---------------------------- Quellen lesen ---------------------------- */

function alterText(datei){
  try {
    const min = Math.round((Date.now() - fs.statSync(datei).mtimeMs) / 60000);
    return min < 120 ? min + ' Min' : (min < 2880 ? Math.round(min / 60) + ' Std' : Math.round(min / 1440) + ' Tage');
  } catch (e) { return '?'; }
}

function rootsLesen(){
  const kandidaten = wert('--roots') ? [wert('--roots')] : ['.stand-freigeschaltet.json', '.kapitel-stand.json'];
  const datei = kandidaten.map(d => path.isAbsolute(d) ? d : p(d)).find(d => fs.existsSync(d));
  if (!datei) return { fehlt: kandidaten.join(' / ') };
  const roh = JSON.parse(fs.readFileSync(datei, 'utf8'));
  const liste = Array.isArray(roh) ? roh : (roh.chapters || roh.data || []);
  const { frei, kennung } = kapitelAusRoots(liste);
  return { datei, alter: alterText(datei), frei, kennung };
}

function appLesen(){
  const w = wert('--app') || '.stand-app.json';
  const datei = path.isAbsolute(w) ? w : p(w);
  if (!fs.existsSync(datei)) return { fehlt: path.relative(REPO, datei) };
  const roh = JSON.parse(fs.readFileSync(datei, 'utf8'));
  const buecher = {};
  Object.entries(roh.buecher || {}).forEach(([b, k]) => {
    const z = (Array.isArray(k) ? k : []).map(Number).filter(n => !Number.isNaN(n));
    if (z.length) buecher[b] = [...new Set(z)].sort((x, y) => x - y);
  });
  return { datei, alter: alterText(datei), stempel: roh.stempel || null, buecher };
}

function freigeschaltetLesen(){
  const q = fs.readFileSync(p('js/kern.js'), 'utf8');
  const m = q.match(/const FREIGESCHALTET\s*=\s*(\{[\s\S]*?\n\});/);
  if (!m) throw new Error('FREIGESCHALTET in js/kern.js nicht gefunden');
  return vm.runInNewContext('(' + m[1] + ')');
}

function kurzLesen(){
  const q = fs.readFileSync(p('js/buecher.js'), 'utf8');
  const m = q.match(/const BUCH_KURZ\s*=\s*(\{[\s\S]*?\n\});/);
  if (!m) throw new Error('BUCH_KURZ in js/buecher.js nicht gefunden');
  return vm.runInNewContext('(' + m[1] + ')');
}

function buecherLesen(){
  const k = vm.createContext({});
  vm.runInContext(fs.readFileSync(p('data/buecher.js'), 'utf8'), k);
  const B = vm.runInContext('typeof BUECHER !== "undefined" ? BUECHER : null', k);
  if (!Array.isArray(B)) throw new Error('BUECHER in data/buecher.js nicht gefunden');
  return B;
}

/* Kapitel je Buchdatei: { kapitel: {nr: anzahl}, fehlt: bool }. Nur gelesen. */
function buchdateiLesen(eintrag){
  const datei = eintrag && eintrag.datei ? p(eintrag.datei) : null;
  if (!datei || !fs.existsSync(datei)) return { fehlt: true, kapitel: {} };
  const k = vm.createContext({ window: {} });
  vm.runInContext(fs.readFileSync(datei, 'utf8'), k);
  const liste = (k.window.VOKABELN || {})[eintrag.slug] || [];
  const kapitel = {};
  liste.forEach(w => { const c = Number(w && w.chapter); if (!Number.isNaN(c)) kapitel[c] = (kapitel[c] || 0) + 1; });
  return { fehlt: false, kapitel };
}

/* ---------------------------- die Prüfung ------------------------------ */
/* Rein: bekommt alles als Daten, liest nichts selbst — damit der Störtest
   dieselbe Funktion mit gestörten Daten aufrufen kann. */
function pruefe({ roots, app, frei, buecher, dateien, kurz }){
  const befunde = [], fragen = [], hinweise = [];
  /* B4: jedes Buch braucht eine Kurzform für den Kapitel-Chip */
  if (kurz) buecher.forEach(e => {
    if (!kurz[e.slug]) befunde.push({ art: 'B4', buch: e.slug,
      text: e.slug + ': keine Kurzform in BUCH_KURZ (js/buecher.js) — der Kapitel-Chip auf der Lernkarte zeigt dann den langen Titel und schneidet die Kapitelzahl ab.' });
  });
  const slugs = new Set(buecher.map(b => b.slug));
  const eintrag = (s) => buecher.find(b => b.slug === s);
  const bereich = (l) => {
    const s = [...l].sort((x, y) => x - y);
    return s.every((n, i) => i === 0 || n === s[i - 1] + 1) && s.length > 2 ? s[0] + '–' + s[s.length - 1] : s.join(', ');
  };

  const R = roots.frei || {};
  const A = (app && app.buecher) || null;

  /* B1: unbekannte Kennung */
  Object.keys(R).forEach(b => {
    if (!slugs.has(b)) befunde.push({ art: 'B1', buch: b,
      text: 'arabicroots meldet „' + (roots.kennung[b] || b) + '" (Kapitel ' + bereich(R[b])
        + ') — die App kennt kein solches Buch. Zuordnung in werkzeuge/arabicroots-buecher.mjs ergänzen, aber nur gemessen.' });
  });

  /* B2: arabicroots frei, FREIGESCHALTET nicht */
  Object.keys(R).filter(b => slugs.has(b)).forEach(b => {
    const fehlt = R[b].filter(c => !((frei[b] || []).includes(c)));
    if (fehlt.length) befunde.push({ art: 'B2', buch: b,
      text: b + ': arabicroots hat Kapitel ' + bereich(fehlt) + ' frei, FREIGESCHALTET (js/kern.js) nicht — '
        + 'vorrat.mjs --stand <datei> --app auto nicht gelaufen?' });
  });

  /* B3: Buch und Buchdatei */
  const gebraucht = new Set([...Object.keys(R), ...Object.keys(A || {}), ...Object.keys(frei)].filter(b => slugs.has(b) || (A && A[b])));
  gebraucht.forEach(b => {
    const e = eintrag(b);
    if (!e){ befunde.push({ art: 'B3', buch: b, text: b + ': in deiner Auswahl, aber nicht in data/buecher.js — die App kann es nicht zeigen.' }); return; }
    const d = dateien[b] || { fehlt: true, kapitel: {} };
    if (d.fehlt){ befunde.push({ art: 'B3', buch: b, text: b + ': ' + e.datei + ' fehlt — ohne Buchdatei keine Wörter (hole-vokabeln.mjs).' }); return; }
    const vorhanden = Object.keys(d.kapitel).map(Number);
    if (e.kapitel && vorhanden.length !== e.kapitel) befunde.push({ art: 'B3', buch: b,
      text: b + ': data/buecher.js sagt ' + e.kapitel + ' Kapitel, die Buchdatei hat ' + vorhanden.length + '.' });
    /* Nur was arabicroots oder seine Auswahl nennt — FREIGESCHALTET allein
       wirkt fast nie (H1). Ein Kapitel HINTER dem Ende der Buchdatei heißt:
       die Datei ist älter als arabicroots. Ein leeres Kapitel MITTEN darin kann
       auch schlicht keine Vokabeln haben (Madina 2, Kapitel 8, 22, 24 —
       gemessen 24.09.2026) — das ist ein Hinweis, kein Befund. */
    const quellen = [...new Set([...(R[b] || []), ...((A && A[b]) || [])])];
    const maxDatei = vorhanden.length ? Math.max(...vorhanden) : 0;
    const jenseits = quellen.filter(c => c > maxDatei);
    if (jenseits.length) befunde.push({ art: 'B3', buch: b,
      text: b + ': Kapitel ' + bereich(jenseits) + ' ist frei oder angehakt, aber die Buchdatei reicht nur bis Kapitel '
        + maxDatei + ' — älter als arabicroots? (hole-vokabeln.mjs)' });
    const leer = quellen.filter(c => c <= maxDatei && !d.kapitel[c]);
    if (leer.length) hinweise.push({ art: 'H2', buch: b,
      text: b + ': Kapitel ' + bereich(leer) + ' ist frei oder angehakt und hat in der Buchdatei keine Wörter.' });
  });

  /* F1: arabicroots frei, seine Auswahl nicht */
  if (A){
    Object.keys(R).filter(b => slugs.has(b)).forEach(b => {
      const fehlt = R[b].filter(c => !((A[b] || []).includes(c)));
      if (!fehlt.length) return;
      fragen.push({ art: 'F1', buch: b, kapitel: fehlt,
        text: A[b]
          ? b + ': bei arabicroots ist Kapitel ' + bereich(fehlt) + ' frei, in deiner App-Auswahl nicht (angehakt: ' + bereich(A[b]) + '). Solange du für dieses Buch etwas angehakt hast, zählt nur deine Auswahl — soll es dazu?'
          : b + ': bei arabicroots ist Kapitel ' + bereich(fehlt) + ' frei, in der App hast du das Buch nicht angehakt. Soll es dazu?' });
    });
  }

  /* H1: nur noch in FREIGESCHALTET */
  if (A){
    Object.keys(frei).forEach(b => {
      const ohne = (frei[b] || []).filter(c => !((R[b] || []).includes(c)) && !((A[b] || []).includes(c)));
      if (ohne.length) hinweise.push({ art: 'H1', buch: b,
        text: b + ': Kapitel ' + bereich(ohne) + ' steht in FREIGESCHALTET, aber weder arabicroots noch deine Auswahl nennen es. '
          + (A[b] ? 'Wirkt nicht — für dieses Buch zählt deine Auswahl.' : 'Wirkt nur, wenn du das Buch ohne Kapitel anhakst.') });
    });
  }
  return { befunde, fragen, hinweise };
}

/* ---------------------------- Störtest --------------------------------- */

function kopie(x){ return JSON.parse(JSON.stringify(x)); }

function stoertest(eingabe){
  const faelle = [
    ['S1 Zuordnung fehlt (so war es bis 24.09.)', (e) => {
      const b = Object.keys(e.roots.frei)[0];
      e.roots.frei['nie-gesehen-1'] = e.roots.frei[b]; e.roots.kennung['nie-gesehen-1'] = 'nie-gesehen-1';
    }, (r) => r.befunde.some(x => x.art === 'B1')],
    ['S2 arabicroots schaltet ein Kapitel mehr frei', (e) => {
      const b = Object.keys(e.roots.frei).find(x => e.app.buecher[x]) || Object.keys(e.roots.frei)[0];
      e.roots.frei[b] = [...e.roots.frei[b], Math.max(...e.roots.frei[b]) + 1];
    }, (r) => r.fragen.some(x => x.art === 'F1')],
    ['S3 FREIGESCHALTET nicht nachgezogen', (e) => {
      const b = Object.keys(e.roots.frei).find(x => e.frei[x]);
      e.frei[b] = e.frei[b].filter(c => c !== e.roots.frei[b][0]);
    }, (r) => r.befunde.some(x => x.art === 'B2')],
    ['S4 Buchdatei endet vor einem angehakten Kapitel', (e) => {
      const b = Object.keys(e.app.buecher).find(x => e.dateien[x] && !e.dateien[x].fehlt);
      const letztes = Math.max(...e.app.buecher[b]);
      Object.keys(e.dateien[b].kapitel).map(Number).filter(c => c >= letztes)
        .forEach(c => { delete e.dateien[b].kapitel[c]; });
    }, (r) => r.befunde.some(x => x.art === 'B3' && /reicht nur bis/.test(x.text))],
    ['S5 neues Buch ohne Kurzform', (e) => {
      delete e.kurz[e.buecher[0].slug];
    }, (r) => r.befunde.some(x => x.art === 'B4')],
  ];
  let rot = 0;
  for (const [name, stoeren, erkannt] of faelle){
    const e = kopie(eingabe);
    try { stoeren(e); } catch (err) { console.log('  ⛔ ' + name + ': Störung nicht anwendbar (' + err.message + ')'); continue; }
    const ok = erkannt(pruefe(e));
    console.log('  ' + (ok ? '✅' : '⛔') + ' ' + name + (ok ? ' — erkannt' : ' — NICHT erkannt'));
    if (ok) rot++;
  }
  console.log(rot === faelle.length ? '\n✅ Störtest: alle ' + rot + ' Störungen erkannt.' : '\n⛔ Störtest: nur ' + rot + ' von ' + faelle.length + ' erkannt.');
  process.exit(rot === faelle.length ? 0 : 1);
}

/* ---------------------------- Lauf ------------------------------------- */

const roots = rootsLesen();
const app = appLesen();
const frei = freigeschaltetLesen();
const buecher = buecherLesen();
const brauch = new Set([...Object.keys(roots.frei || {}), ...Object.keys(app.buecher || {}), ...Object.keys(frei)]);
const dateien = {};
brauch.forEach(b => { const e = buecher.find(x => x.slug === b); if (e) dateien[b] = buchdateiLesen(e); });

if (roots.fehlt){
  console.log('⛔ Keine arabicroots-Datei (' + roots.fehlt + ') — get_unlocked_chapters speichern und mit --roots mitgeben.');
  process.exit(1);
}
const eingabe = { roots, app: app.fehlt ? null : app, frei, buecher, dateien, kurz: kurzLesen() };

if (STOERTEST){
  /* Ohne .stand-app.json (vorrat.mjs lief noch nicht mit --app) nimmt der
     Störtest die arabicroots-Kapitel als Auswahl — er prüft die LOGIK, und die
     braucht nur irgendeine Auswahl. Sonst wäre er im Sammellauf rot, ohne dass
     etwas kaputt ist. */
  if (!eingabe.app){
    console.log('  (keine App-Auswahl — Störtest nimmt die arabicroots-Kapitel als Auswahl)');
    eingabe.app = { buecher: kopie(roots.frei) };
  }
  stoertest(eingabe);
}

const erg = pruefe(eingabe);
if (NUR_JSON){
  console.log(JSON.stringify({ roots: { datei: path.relative(REPO, roots.datei), alter: roots.alter },
    app: app.fehlt ? null : { datei: path.relative(REPO, app.datei), alter: app.alter }, ...erg }, null, 1));
  process.exit(erg.befunde.length ? 1 : (erg.fragen.length ? 2 : 0));
}

const liste = (o) => Object.entries(o).map(([b, k]) => b + ' ' + (k.length ? k[0] + '–' + k[k.length - 1] : '—')).join(' · ') || '—';
console.log('Sind Bücher und Kapitel aktuell?');
console.log('  arabicroots:     ' + liste(roots.frei) + '   (' + path.relative(REPO, roots.datei) + ', vor ' + roots.alter + ')');
console.log('  deine Auswahl:   ' + (app.fehlt ? '⚠️ fehlt (' + app.fehlt + ') — F1 und H1 NICHT geprüft' : liste(app.buecher)
  + '   (' + (app.stempel ? 'Stand ' + new Date(app.stempel).toLocaleString('de-DE') : 'Datei vor ' + app.alter) + ')'));
console.log('  FREIGESCHALTET:  ' + liste(frei));
console.log('');
erg.befunde.forEach(x => console.log('  ⛔ ' + x.art + ' ' + x.text));
erg.fragen.forEach(x => console.log('  ❓ ' + x.art + ' ' + x.text));
erg.hinweise.forEach(x => console.log('  ·  ' + x.art + ' ' + x.text));
if (!erg.befunde.length && !erg.fragen.length) console.log('  ✅ aktuell — ' + brauch.size + ' Bücher geprüft, keine Abweichung, die etwas bewirkt.');
process.exit(erg.befunde.length ? 1 : (erg.fragen.length ? 2 : 0));
