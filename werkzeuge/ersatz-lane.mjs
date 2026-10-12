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
 * Dritter Gebrauch (--wurzeln, seit dem 12.10.2026): die WURZEL für Ersatzkarten, denen keine andere Quelle eine
 * nennt. Anlass: der Probelauf des Wechsels (ersatz-wechsel.mjs --probe) zeigte, dass von den 331 Wörtern aus Elias'
 * freigeschalteten Kapiteln nach einem Wechsel 58 unvollständig wären, 53 davon ohne Wurzel -- und er will „nahtlos
 * wechseln … ohne probleme" (11.10.2026). Die Bauart stammt von Claude:
 *   · Suchwort ist das Arabisch der ERSATZkarte (data-ersatz/vokabeln-<buch>.js), nicht das des Bestands.
 *   · Die Wurzel der bisherigen Karte ist nur der WEG zur Seite (wurzelSchluessel in ersatz-bama-lib.mjs).
 *   · Beleg ist allein, dass Lane das Wort mit denselben Vokalzeichen als Stichwort unter dieser Wurzel führt; der
 *     Wert kommt vom Namen der Seite, die traf (wurzelWert). Steht das Wort unter zwei Wurzeln, gilt keine.
 *   · Entschieden wird ein Platz erst, wenn JEDE Seite seiner Suchschlüssel bekannt ist (abgelegt, oder der Abruf
 *     ergab „gibt es nicht"). Sonst bleibt er, wie er war -- auch ein Eintrag aus einem früheren Lauf.
 *   · Karten mit mehreren Wörtern bleiben draußen.
 * Das Ergebnis steht in data-ersatz/arbeit/lane-wurzeln.json ({ eintraege: { <Kennung>: { ar, w, wo, bw, nr,
 * stichwort } } }); ersatz-bauen.mjs trägt die Wurzel ein, solange die Karte keine andere hat und ihr Arabisch noch
 * das des Eintrags ist. Je Lauf wird zusammengeführt: ein geprüfter Platz ohne Treffer fällt heraus, ein nicht
 * geprüfter bleibt. Wurzelseiten, die es nicht gibt (Antwort 404), merkt sich data-ersatz/quellen/lane/
 * ohne-seite.json, damit sie nicht bei jedem Lauf neu gefragt werden; wer eine Zeile dort löscht, lässt neu fragen.
 *
 * Aufruf (aus dem Repo-Wurzelverzeichnis):
 *   node werkzeuge/ersatz-lane.mjs [--ids 123,456] [--formen] [--holen] [--max N] [--ohne-tabelle] [--aus <datei>]
 *   ohne --ids: die Plätze aus data-ersatz/nicht-gefunden.json · ohne --aus: data-ersatz/arbeit/lane.txt
 *   node werkzeuge/ersatz-lane.mjs --wurzeln [--ids 123,456] [--holen] [--max N] [--aus <datei>]
 *   ohne --ids: die Plätze, denen laut data-ersatz/unterschiede.json die Wurzel fehlt · --max: höchstens so viele
 *   Abrufe in diesem Lauf (Vorgabe 400) · ohne --aus: data-ersatz/arbeit/lane-wurzeln.txt
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ladeBuch, BUECHER, vergleich, geruest, ausBW, hatVokalzeichen, wurzelnAus, wurzelSchluessel, wurzelWert, laneDateiname } from './ersatz-bama-lib.mjs';
import { liesListe } from './datenquelle.mjs';

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
const WURZELN = args.includes('--wurzeln');
const MAX = Number(wert('--max') || 45);
const MAX_ABRUFE = Number(wert('--max') || 400);
const ZIEL = wert('--aus') || path.join(ERSATZ, 'arbeit', WURZELN ? 'lane-wurzeln.txt' : 'lane.txt');
const WURZELDATEI = path.join(ERSATZ, 'arbeit', 'lane-wurzeln.json');
const OHNE_SEITE = path.join(ERSATZ, 'quellen', 'lane', 'ohne-seite.json');
const schreibe = (datei, text) => { fs.mkdirSync(path.dirname(datei), { recursive: true }); fs.writeFileSync(datei + '.neu', text, 'utf8'); fs.renameSync(datei + '.neu', datei); };
const liesJson = (datei, sonst) => fs.existsSync(datei) ? JSON.parse(fs.readFileSync(datei, 'utf8')) : sonst;
const voll = v => v !== null && v !== undefined && String(v).trim() !== '';
const tag = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

const Z = n => String.fromCodePoint(n);
const FATHA = Z(0x64E);
const AR = new RegExp('[' + Z(0x621) + '-' + Z(0x63A) + Z(0x640) + '-' + Z(0x652) + Z(0x670) + Z(0x671) + ']+', 'g');
const dateiname = laneDateiname;
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
/* „bekannt" sagt, ob feststeht, was die Seite enthält: abgelegt, oder der Abruf ergab „gibt es nicht" (404, nur bei
 * Wurzelseiten gemerkt). Nicht bekannt ist eine Seite, die nicht geholt wurde oder deren Abruf scheiterte. */
let geholt = 0, abrufe = 0, abbruch = '', grenze = false, robotsGeprueft = false, ohneSeiteNeu = 0;
const ohneSeite = liesJson(OHNE_SEITE, {});
async function hole(url, datei, merkName) {
  if (fs.existsSync(datei)) return { text: fs.readFileSync(datei, 'utf8'), woher: 'Ablage', bekannt: true, datei };
  if (merkName && ohneSeite[merkName]) return { text: '', woher: 'keine Seite (gemerkt ' + ohneSeite[merkName] + ')', bekannt: true };
  if (!HOLEN || abbruch) return { text: '', woher: 'nicht geholt', bekannt: false };
  if (WURZELN && abrufe >= MAX_ABRUFE) { grenze = true; return { text: '', woher: 'nicht geholt (Grenze --max)', bekannt: false }; }
  if (!robotsGeprueft) {
    robotsGeprueft = true;
    try {
      const r = await fetch(BASIS + '/robots.txt', { headers: KOPF });
      const t = r.ok ? await r.text() : '';
      if (/User-agent:\s*\*[^]*?Disallow:\s*\/\s*($|\n)/i.test(t)) abbruch = 'robots.txt verbietet den Abruf';
    } catch (f) { abbruch = 'robots.txt nicht erreichbar: ' + f.message; }
    if (abbruch) return { text: '', woher: 'nicht geholt', bekannt: false };
  }
  await warte(1500);
  abrufe++;
  let r;
  try { r = await fetch(url, { headers: KOPF, redirect: 'follow' }); }
  catch (f) { abbruch = 'Abruf gescheitert: ' + f.message; return { text: '', woher: 'Fehler', bekannt: false }; }
  if (r.status === 403 || r.status === 429) { abbruch = 'Antwort ' + r.status + ' — Abruf beendet'; return { text: '', woher: String(r.status), bekannt: false }; }
  const text = r.ok ? await r.text() : '';
  if (text.length > 500) { fs.mkdirSync(path.dirname(datei), { recursive: true }); fs.writeFileSync(datei, text, 'utf8'); geholt++; return { text, woher: String(r.status), bekannt: true, datei }; }
  if (r.status === 404 && merkName) { ohneSeite[merkName] = tag(new Date()); ohneSeiteNeu++; return { text: '', woher: '404', bekannt: true }; }
  return { text, woher: String(r.status), bekannt: false };
}
const wurzelseite = bw => hole(BASIS + '/root/' + encodeURIComponent(ausBW(bw)), path.join(SEITEN, dateiname(bw)), bw);
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

/* ---------- dritter Gebrauch (--wurzeln): die Wurzel für Ersatzkarten ohne Wurzel ---------- */
const aus = [], zahl = {};
const zaehle = art => { zahl[art] = (zahl[art] || 0) + 1; };
const _ersatz = new Map();
function ersatzBuch(buch) {
  if (!_ersatz.has(buch)) {
    const datei = path.join(ERSATZ, 'vokabeln-' + buch + '.js');
    _ersatz.set(buch, fs.existsSync(datei) ? new Map(liesListe(datei).map(k => [String(k.id), k])) : new Map());
  }
  return _ersatz.get(buch);
}
function wurzelPlaetze() {
  const ids = wert('--ids');
  if (ids) {
    const alle = new Map(liesJson(path.join(ERSATZ, 'plaetze.json'), []).map(p => [String(p.id), p.buch]));
    return ids.split(',').map(s => s.trim()).filter(Boolean).map(id => ({ id, buch: alle.get(id) || null }));
  }
  const liste = path.join(ERSATZ, 'unterschiede.json');
  if (!fs.existsSync(liste)) { console.log('⛔ data-ersatz/unterschiede.json fehlt (erst ersatz-bauen.mjs; data-ersatz/ liegt nur lokal).'); process.exit(1); }
  return JSON.parse(fs.readFileSync(liste, 'utf8')).filter(u => u.feld === 'root' && u.art === 'fehlt im Ersatz').map(u => ({ id: String(u.id), buch: u.buch }));
}
/* Die Vergleichsform für diesen Gebrauch: vergleich() und dazu zwei Eigenheiten von Lanes Druck, gemessen am
 * 12.10.2026 an den abgelegten Seiten („krs": das Stichwort für „Stuhl" endet auf Alif maqsura mit Verdopplung;
 * „ftw", „$jr": langes a vor Hamza steht als Alif mit Madda):
 *   · das Ya am Wortende druckt Lane ohne Punkte -- beim Vergleich zählen Ya und Alif maqsura gleich
 *   · Alif mit Madda vor einem Hamza zählt als Alif
 * Beides gilt für beide Seiten des Vergleichs. Ein Treffer bleibt ein Wort mit denselben Vokalzeichen auf der Seite
 * der Wurzel, unter der gesucht wurde. */
const MADDA_VOR_HAMZA = new RegExp(Z(0x622) + '(?=[' + Z(0x621) + Z(0x624) + Z(0x626) + '])', 'g');
const laneForm = w => vergleich(String(w).normalize('NFC').replace(MADDA_VOR_HAMZA, Z(0x627))).replaceAll(Z(0x649), Z(0x64A));
async function wurzelLauf() {
  const eintraege = { ...(liesJson(WURZELDATEI, {}).eintraege || {}) };
  const vorher = Object.keys(eintraege).length;
  let neu = 0, weg = 0;
  const raus = id => { if (eintraege[id]) { delete eintraege[id]; weg++; } };
  for (const p of wurzelPlaetze()) {
    const e = p.buch ? ersatzBuch(p.buch).get(p.id) : null;
    const kopf = p.id + ' ' + String(p.buch || '?').replace('bayna-yadayk-', 'by').replace('madina-', 'm') + (e ? ' K' + e.chapter + ' ' + String(e.type || '?').slice(0, 4) + ' ' + e.ar : '');
    if (!e || !voll(e.ar)) { aus.push(kopf + ' | (keine Ersatzkarte)'); zaehle('ohneKarte'); raus(p.id); continue; }
    // Trägt die Karte ihre Wurzel aus einem Eintrag von hier, wird der Platz neu geprüft; sonst hat sie eine andere Quelle.
    if (voll(e.root) && !eintraege[p.id]) { aus.push(kopf + ' | (die Karte hat schon eine Wurzel aus einer anderen Quelle)'); zaehle('hatWurzel'); continue; }
    if (String(e.ar).trim().split(/\s+/).length > 1) { aus.push(kopf + ' | (mehrere Wörter — nicht nachgesehen)'); zaehle('mehrwort'); raus(p.id); continue; }
    const bisher = (ladeBuch(REPO, p.buch) || new Map()).get(p.id);
    const feld = bisher && bisher.root;
    const schluessel = tabelle[p.id] || wurzelSchluessel(feld);
    if (!schluessel.length) { aus.push(kopf + ' | (kein Suchschlüssel: die bisherige Karte nennt keine Wurzel)'); zaehle('ohneSchluessel'); raus(p.id); continue; }
    const ziel = laneForm(e.ar), funde = [], info = [];
    let unbekannt = 0, stichwoerter = 0;
    for (const bw of schluessel) {
      const s = await wurzelseite(bw);
      if (!s.bekannt) { unbekannt++; info.push(bw + ':' + s.woher); continue; }
      const verweise = verweiseVon(s.text);
      stichwoerter += verweise.length;
      info.push(bw + ':' + s.woher + '/' + verweise.length);
      for (const v of verweise) if (v.wort.split(' ').some(w => hatVokalzeichen(w) && laneForm(w) === ziel)) funde.push({ bw, nr: v.nr, wort: v.wort, wert: wurzelWert(bw, feld), datei: s.datei });
    }
    if (unbekannt) {
      aus.push(kopf + ' | nicht geprüft — ' + unbekannt + ' Seite(n) noch nicht bekannt | ' + info.join(' '));
      zaehle('nichtGeprueft');
      if (abbruch) break;
      continue;
    }
    const werte = [...new Set(funde.map(f => f.wert).filter(Boolean))];
    if (werte.length === 1) {
      const f = funde.find(x => x.wert === werte[0]);
      if (!eintraege[p.id]) neu++;
      eintraege[p.id] = {
        ar: e.ar, w: f.wert,
        wo: 'Lane, Arabic-English Lexicon: Stichwort „' + f.wort + '“ (' + f.nr + ') unter der Wurzel „' + ausBW(f.bw) + '“ — laneslexicon.com, abgelegt ' + tag(fs.statSync(f.datei).mtime),
        bw: f.bw, nr: f.nr, stichwort: f.wort,
      };
      aus.push(kopf + ' | TREFFER unter ' + f.bw + ' → ' + f.wert + ' | ' + f.nr + ' „' + f.wort + '“ | ' + info.join(' '));
      zaehle('TREFFER');
      continue;
    }
    raus(p.id);
    const art = werte.length > 1 ? 'mehrdeutig' : funde.length ? 'ohneWert' : stichwoerter ? 'nichts' : 'ohneSeite';
    const text = {
      mehrdeutig: 'steht unter zwei Wurzeln: ' + werte.join(' / '),
      ohneWert: 'Stichwort gefunden (' + funde.map(f => f.bw + ' ' + f.nr).join(', ') + '), aber der Name der Seite ist keine Wurzel aus drei oder vier Radikalen',
      nichts: '— nicht unter den Stichwörtern',
      ohneSeite: '— keine Seite',
    }[art];
    aus.push(kopf + ' | ' + text + ' | ' + info.join(' '));
    zaehle(art);
  }
  schreibe(WURZELDATEI, JSON.stringify({
    erzeugt: new Date().toISOString(),
    hinweis: 'Wurzeln aus Lanes Lexikon für Ersatzkarten, denen keine andere Quelle eine nennt. Erzeugt von werkzeuge/ersatz-lane.mjs --wurzeln, gelesen von werkzeuge/ersatz-bauen.mjs. Nicht von Hand ändern.',
    eintraege,
  }, null, 1));
  return 'Einträge ' + Object.keys(eintraege).length + ' (vorher ' + vorher + ', neu ' + neu + ', herausgefallen ' + weg + ')';
}

/* ---------- Lauf ---------- */
let wurzelBilanz = '';
if (WURZELN) wurzelBilanz = await wurzelLauf();
else for (const p of plaetze()) {
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
if (ohneSeiteNeu) schreibe(OHNE_SEITE, JSON.stringify(ohneSeite, null, 1));
const kopfzeile = 'LANE (' + (WURZELN ? 'Wurzeln' : FORMEN ? 'Erklärungen' : 'Stichwörter') + '): ' + JSON.stringify(zahl) + (WURZELN ? ' · ' + wurzelBilanz : '')
  + ' · neu geholte Seiten: ' + geholt + (ohneSeiteNeu ? ' · als „gibt es nicht“ gemerkt: ' + ohneSeiteNeu : '')
  + (HOLEN ? '' : ' (ohne --holen: nur die Ablage)') + (grenze ? ' · GRENZE --max ' + MAX_ABRUFE + ' erreicht — noch einmal laufen lassen' : '') + (abbruch ? ' · ABBRUCH: ' + abbruch : '');
fs.mkdirSync(path.dirname(ZIEL), { recursive: true });
fs.writeFileSync(ZIEL, kopfzeile + '\n\n' + aus.join(WURZELN ? '\n' : '\n\n') + '\n', 'utf8');
console.log(kopfzeile);
console.log('geschrieben: ' + path.relative(REPO, ZIEL));
