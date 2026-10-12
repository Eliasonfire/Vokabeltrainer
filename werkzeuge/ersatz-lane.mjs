/* ersatz-lane.mjs -- sieht für Plätze der Ersatzdatenbank, die keine andere Quelle belegt, in Lanes
 * arabisch-englischem Lexikon nach (E. W. Lane, 1863–1893, gemeinfrei; Abruf über laneslexicon.com).
 * Nur lesend an der Ersatzdatenbank; es trägt nichts ein -- was als belegt gilt, entscheidet eine Sitzung
 * von Hand (data-ersatz/hand/<buch>.json, Quelle „lane").
 *
 * Elias, 12.10.2026, zu den Plätzen ohne Quelle: „guck nach weiteren möglichkeiten sie zu besorgen".
 *
 * Die bisherige Karte liefert nur das SUCHWORT und die Wurzel, unter der gesucht wird. Beleg ist allein, was
 * die Seite druckt: das Stichwort mit seinen Vokalzeichen und der Anfang seiner Erklärung.
 *
 * Erster Durchgang (ohne Schalter): die Wurzelseite nennt jedes Stichwort als Verweis auf eine eigene Seite.
 *   TREFFER          ein Stichwort hat dieselben Vokalzeichen wie das Suchwort -> Anfang der Erklärung
 *   nur Buchstaben   gleiche Buchstaben, andere oder keine Vokalzeichen -- KEIN Beleg, nur zum Nachsehen
 * Zweiter Durchgang (--formen): sucht das Wort in den ERKLÄRUNGEN der Verbstämme und der Stichwörter mit
 *   gleichen Buchstaben. Dort stehen Verbalnomen und Formen, die Lane nicht als Stichwort führt.
 *
 * Was beim ersten Gebrauch (12.10.2026) aufgefallen ist und das Lesen der Ausgabe ändert:
 *   - Lane druckt Verben mit Objekt MIT angehängtem Fürwort, wechselseitige Verben in der Zweizahl;
 *     der zweite Durchgang meldet das als „MIT FÜRWORT".
 *   - Stichwörter des fünften Stammes tragen oft nur das Verdopplungszeichen.
 *   - Zweilautige Wurzeln (zweiter und dritter Buchstabe gleich) stehen unter ZWEI Buchstaben.
 *   - Ab dem Buchstaben Qaf ist das Lexikon dünn (Lane starb darüber); ein Fehlen dort sagt wenig.
 *
 * Abruf: von selbst wird NICHTS geholt, es zählen die abgelegten Seiten (data-ersatz/quellen/lane/seiten/
 * und …/woerter/). Erst --holen ruft fehlende Seiten ab: jede nur einmal, 1,5 Sekunden Abstand, Ende bei
 * 403/429 oder wenn robots.txt den Abruf verbietet.
 *
 * Wurzel: aus der Tabelle data-ersatz/quellen/lane/wurzeln.json ({ "<Kennung>": ["<Buckwalter>", …] }),
 * sonst aus dem Feld root der Karte abgeleitet (zweilautig gekürzt, ganz, Hamza mit und ohne Träger).
 * ⚠️ Die Ableitung ist ein Anfang, kein Ersatz für die Tabelle. Gemessen am 12.10.2026 an den 35 Plätzen der
 * Tabelle, ohne Abruf: mit Tabelle 10 Treffer, 6 nur Buchstaben, 17 nichts, 2 ohne Seite; abgeleitet 6 Treffer
 * (6 Karten tragen keine Wurzel, bei 5 liegt die Seite unter einer anderen Schreibung der Wurzel).
 * Wer für einen Platz die richtige Schreibung findet, trägt sie in die Tabelle ein.
 *
 * Die Ausgabe zeigt Suchwörter aus dem Bestand und gehört in keine versionierte Datei.
 *
 * Aufruf (aus dem Repo-Wurzelverzeichnis):
 *   node werkzeuge/ersatz-lane.mjs [--ids 123,456] [--formen] [--holen] [--max N] [--ohne-tabelle] [--aus <datei>]
 *   ohne --ids: die Plätze aus data-ersatz/nicht-gefunden.json · ohne --aus: data-ersatz/arbeit/lane.txt
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ladeBuch, BUECHER, vergleich, geruest, ausBW, hatVokalzeichen, wurzelnAus } from './ersatz-bama-lib.mjs';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const REPO = process.env.ERSATZ_REPO || path.join(HIER, '..');
const ERSATZ = path.join(REPO, 'data-ersatz');
const SEITEN = path.join(ERSATZ, 'quellen', 'lane', 'seiten');
const WOERTER = path.join(ERSATZ, 'quellen', 'lane', 'woerter');
const TABELLE = path.join(ERSATZ, 'quellen', 'lane', 'wurzeln.json');
const BASIS = 'https://www.laneslexicon.com';
const KOPF = { 'User-Agent': 'Mozilla/5.0 (privates Lernprojekt; einzelne Seiten, langsam)', Accept: 'text/html' };

const args = process.argv.slice(2);
const wert = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const HOLEN = args.includes('--holen'), FORMEN = args.includes('--formen'), OHNE_TABELLE = args.includes('--ohne-tabelle');
const MAX = Number(wert('--max') || 45);
const ZIEL = wert('--aus') || path.join(ERSATZ, 'arbeit', 'lane.txt');

const Z = n => String.fromCodePoint(n);
const FATHA = Z(0x64E);
const AR = new RegExp('[' + Z(0x621) + '-' + Z(0x63A) + Z(0x640) + '-' + Z(0x652) + Z(0x670) + Z(0x671) + ']+', 'g');
const dateiname = bw => bw.replace(/[^A-Za-z]/g, c => '_' + c.charCodeAt(0)) + '.html';
const warte = ms => new Promise(r => setTimeout(r, ms));
const ohneTags = t => t.replace(/<script[^]*?<\/script>/gi, ' ').replace(/<style[^]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();

/* ---------- die Plätze ---------- */
function plaetze() {
  const ids = wert('--ids');
  if (!ids) {
    const liste = path.join(ERSATZ, 'nicht-gefunden.json');
    if (!fs.existsSync(liste)) { console.log('⛔ data-ersatz/nicht-gefunden.json fehlt (data-ersatz/ liegt nur lokal).'); process.exit(1); }
    return JSON.parse(fs.readFileSync(liste, 'utf8')).map(e => ({ id: String(e.id), buch: e.buch }));
  }
  return ids.split(',').map(s => s.trim()).filter(Boolean).map(id => {
    const buch = BUECHER.find(b => (ladeBuch(REPO, b) || new Map()).has(id));
    return { id, buch: buch || null };
  });
}

/* ---------- die Wurzeln, unter denen gesucht wird (Buckwalter-Umschrift) ---------- */
const tabelle = !OHNE_TABELLE && fs.existsSync(TABELLE) ? JSON.parse(fs.readFileSync(TABELLE, 'utf8')) : {};

/* ---------- Seiten: Ablage zuerst, Abruf nur mit --holen ---------- */
let geholt = 0, abbruch = '', robotsGeprueft = false;
async function hole(url, datei) {
  if (fs.existsSync(datei)) return { text: fs.readFileSync(datei, 'utf8'), woher: 'Ablage' };
  if (!HOLEN || abbruch) return { text: '', woher: 'nicht geholt' };
  if (!robotsGeprueft) {
    robotsGeprueft = true;
    try {
      const r = await fetch(BASIS + '/robots.txt', { headers: KOPF });
      const t = r.ok ? await r.text() : '';
      if (/User-agent:\s*\*[^]*?Disallow:\s*\/\s*($|\n)/i.test(t)) abbruch = 'robots.txt verbietet den Abruf';
    } catch (f) { abbruch = 'robots.txt nicht erreichbar: ' + f.message; }
    if (abbruch) return { text: '', woher: 'nicht geholt' };
  }
  await warte(1500);
  const r = await fetch(url, { headers: KOPF, redirect: 'follow' });
  if (r.status === 403 || r.status === 429) { abbruch = 'Antwort ' + r.status + ' — Abruf beendet'; return { text: '', woher: String(r.status) }; }
  const text = r.ok ? await r.text() : '';
  if (text.length > 500) { fs.mkdirSync(path.dirname(datei), { recursive: true }); fs.writeFileSync(datei, text, 'utf8'); geholt++; }
  return { text, woher: String(r.status) };
}
const wurzelseite = bw => hole(BASIS + '/root/' + encodeURIComponent(ausBW(bw)), path.join(SEITEN, dateiname(bw)));
const wortseite = v => hole(BASIS + encodeURI(decodeURI(v.pfad)), path.join(WOERTER, v.nr + '.html'));
const verweiseVon = html => [...html.matchAll(/<a href="(\/word\/[^"]+\/(n\d+))" class="root-word-link">([^]*?)<\/a>/g)]
  .map(m => ({ pfad: m[1], nr: m[2], wort: ohneTags(m[3]) }));

/* ---------- die zwei Durchgänge ---------- */
async function stichwort(k, wurzeln) {
  const ziel = vergleich(k.ar), zielG = geruest(k.ar), info = [];
  for (const bw of wurzeln) {
    const s = await wurzelseite(bw);
    const verweise = verweiseVon(s.text);
    info.push(bw + ':' + s.woher + '/' + verweise.length + ' Stichw.');
    if (!verweise.length) continue;
    const treffer = verweise.filter(v => v.wort.split(' ').some(w => hatVokalzeichen(w) && vergleich(w) === ziel));
    if (treffer.length) {
      const zeilen = [];
      for (const t of treffer) {
        const w = await wortseite(t);
        const text = ohneTags(w.text);
        const stelle = text.indexOf(t.wort.split(' ')[0]);
        zeilen.push('   ' + t.nr + ' „' + t.wort + '“ (' + w.woher + '): ' + (text ? (stelle >= 0 ? text.slice(stelle, stelle + 900) : text.slice(0, 600)) : '— Seite des Stichworts nicht abgelegt'));
      }
      return { art: 'TREFFER', kopf: 'TREFFER unter ' + bw + ' | ' + info.join(' '), zeilen };
    }
    const nah = [...new Set(verweise.filter(v => geruest(v.wort.split(' ')[0]) === zielG).map(v => v.wort + ' [' + v.nr + ']'))].slice(0, 6);
    if (nah.length) return { art: 'nurBuchstaben', kopf: 'nur Buchstaben unter ' + bw + ' | ' + info.join(' '), zeilen: ['   ' + nah.join(' · ')] };
  }
  const ohne = info.every(i => /\/0 Stichw\.$/.test(i));
  return { art: ohne ? 'ohneSeite' : 'nichts', kopf: (ohne ? '— keine Seite' : '— nicht unter den Stichwörtern') + ' | ' + info.join(' '), zeilen: [] };
}
async function inErklaerungen(k, wurzeln) {
  const ziel = vergleich(k.ar), zielG = geruest(k.ar), zeilen = [];
  for (const bw of wurzeln) {
    const verweise = verweiseVon((await wurzelseite(bw)).text);
    if (!verweise.length) { zeilen.push('   ' + bw + ': keine Seite'); continue; }
    const staemme = verweise.filter(v => /Form/.test(v.wort));
    const treffer = [];
    for (const v of verweise.filter(x => /Form/.test(x.wort) || geruest(x.wort.split(' ')[0]) === zielG).slice(0, MAX)) {
      const t = ohneTags((await wortseite(v)).text);
      if (!t) continue;
      /* Nur die Erklärung selbst: hinter ihr folgt auf jeder Seite die Liste „Related Words from the Same Root",
         also wieder die Stichwörter -- ein Fund dort wäre der erste Durchgang noch einmal (gemessen 12.10.2026:
         109 von 110 abgelegten Seiten tragen die Liste, alle 110 die Überschrift der Erklärung). */
      const i0 = t.indexOf('Full Definition');
      const i1 = t.indexOf('Related Words from the Same Root', Math.max(0, i0));
      const text = t.slice(i0 >= 0 ? i0 + 16 : 0, i1 >= 0 ? i1 : undefined);
      for (const m of text.matchAll(AR)) {
        if (!hatVokalzeichen(m[0])) continue;
        const v2 = vergleich(m[0]);
        const genau = v2 === ziel;
        const mitFuerwort = !genau && v2.startsWith(ziel + FATHA) && v2.length - ziel.length <= 5;
        if (genau || mitFuerwort) { treffer.push('   ' + (genau ? 'GENAU ' : 'MIT FÜRWORT ') + m[0] + ' in ' + v.nr + ' „' + v.wort + '“: … ' + text.slice(Math.max(0, m.index - 70), m.index + m[0].length + 230) + ' …'); break; }
      }
      if (treffer.length >= 2) break;
    }
    if (treffer.length) return { art: 'inErklaerung', zeilen: treffer };
    zeilen.push('   ' + bw + ': in den Erklärungen nicht gefunden (' + verweise.length + ' Stichwörter' + (k.type === 'verb' ? ', Stämme: ' + staemme.map(v => v.wort.replace('Form ', 'F') + ' [' + v.nr + ']').join(' · ') : '') + ')');
  }
  return { art: 'nichts', zeilen };
}

/* ---------- Lauf ---------- */
const aus = [], zahl = {};
const zaehle = art => { zahl[art] = (zahl[art] || 0) + 1; };
for (const p of plaetze()) {
  const k = p.buch ? (ladeBuch(REPO, p.buch) || new Map()).get(p.id) : null;
  const kopf = p.id + ' ' + String(p.buch || '?').replace('bayna-yadayk-', 'by').replace('madina-', 'm') + ' ' + String((k && k.type) || '?').slice(0, 4);
  if (!k || !k.ar) { aus.push(kopf + ' | (Karte nicht im Bestand)'); zaehle('ohneKarte'); continue; }
  if (String(k.ar).trim().split(/\s+/).length > 1) { aus.push(kopf + ' ' + k.ar + ' | (mehrere Wörter — nicht nachgesehen)'); zaehle('mehrwort'); continue; }
  const wurzeln = tabelle[p.id] || wurzelnAus(k.root);
  if (!wurzeln.length) { aus.push(kopf + ' ' + k.ar + ' | (keine Wurzel: weder in der Tabelle noch auf der Karte)'); zaehle('ohneWurzel'); continue; }
  if (FORMEN) {
    const e = await inErklaerungen(k, wurzeln);
    aus.push(kopf + ' ' + k.ar + ' | Wurzeln: ' + wurzeln.join(', ') + '\n' + e.zeilen.join('\n'));
    zaehle(e.art);
  } else {
    const e = await stichwort(k, wurzeln);
    aus.push(kopf + ' ' + k.ar + ' | ' + e.kopf + (e.zeilen.length ? '\n' + e.zeilen.join('\n') : ''));
    zaehle(e.art);
  }
  if (abbruch) break;
}
const kopfzeile = 'LANE (' + (FORMEN ? 'Erklärungen' : 'Stichwörter') + '): ' + JSON.stringify(zahl) + ' · neu geholte Seiten: ' + geholt
  + (HOLEN ? '' : ' (ohne --holen: nur die Ablage)') + (abbruch ? ' · ABBRUCH: ' + abbruch : '');
fs.mkdirSync(path.dirname(ZIEL), { recursive: true });
fs.writeFileSync(ZIEL, kopfzeile + '\n\n' + aus.join('\n\n') + '\n', 'utf8');
console.log(kopfzeile);
console.log('geschrieben: ' + path.relative(REPO, ZIEL));
