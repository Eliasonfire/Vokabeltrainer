#!/usr/bin/env node
/* lernlast.mjs — reichen seine Karten am Tag noch? (seit 25.09.2026)
 * ==========================================================================
 *
 * Elias zum Plan für den Rundenbau (25.09.2026): „Wartung Mi/So: Sie misst,
 * wie viele Wiederholungen dauerhaft anfallen und wie viel überfällig ist.
 * Reichen 10 Karten am Tag nicht mehr, sagt sie es dir mit Zahl." — „das
 * klingt gut. mach das".
 *
 * ⭐ v603 (25.09.2026): sieben Boxen (Box 6 = 30 T, Box 7 = 60 T), Box 1
 * mindestens ein Drittel, Wiederholungen nach Verspätung ÷ Abstand, freie
 * Plätze an noch nicht fällige Karten. Abstände und Anteil kommen aus
 * js/kern.js — keine zweite Zahl hier. Dazu drei versprochene Messungen:
 *   · Trefferquote je Box, vor allem Box 6 und 7 (in der Rechnung ANGENOMMEN
 *     0,9) — aus den Feldern b<Box>g/r in vt_quoteTage (merkeQuote()),
 *   · ob vorgezogene Karten später in Box 4/5 so gut halten wie die anderen
 *     (Felder v<Box>g/r = früher vorgezogene, f<Box>g/r = vorgezogene Antwort),
 *   · wie lang die Box-1-Schlange ist (sein Wunsch: nach 2–3 Wochen messen,
 *     die Wartung meldet sie jede Woche).
 * ⛔ Der Bestand zählt wie die App: seine Kapitel UND die einzeln
 * freigeschalteten Wörter (vt_einzeln_frei). Bis v602 fehlten die hier —
 * 25 Karten in Box 2–5 (Lernpunkt vom 25.09.2026).
 * ⛔ Und er zählt NICHT mit, was die App ihm nicht vorlegt (02.10.2026):
 * gelöschte Karten, Fachbegriffe außerhalb der Kartei, „kenne ich schon",
 * übertragene Einträge — nichtVorgelegt() unten. `vt_progress` behält jeden
 * Eintrag, auch wenn die Karte längst weg ist. Bewacht von test-lernlast.mjs.
 *
 * Liest seinen Gerätestand aus dem KV (NUR LESEN). Mit `--stand <datei>` aus
 * einer Datei derselben Form — nur für den Test.
 * Exit 2 = die Karten am Tag reichen nicht mehr (Box-7-Pflege belegt die
 * Wiederholungsplätze, oder eine Wiederholung wartet über 14 Tage) — eine
 * ZAHL FÜR IHN, keine Entscheidung: ob das Tagesziel steigt, sagt er.
 * Exit 0 = reicht · 1 = Stand nicht lesbar.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const kern = fs.readFileSync(path.join(REPO, 'js', 'kern.js'), 'utf8');
const INTERVALS = eval('(' + (kern.match(/const INTERVALS = (\{[^}]+\})/) || [])[1] + ')');
const ANTEIL = Number(eval((kern.match(/const DECKEL_ANTEIL_BOX1\s*=\s*([\d.]+(?:\s*\/\s*[\d.]+)?)\s*;/) || [])[1]));
if (!INTERVALS || !Number.isFinite(ANTEIL)){ console.log('⛔ INTERVALS/DECKEL_ANTEIL_BOX1 nicht aus js/kern.js lesbar'); process.exit(1); }
const BOXEN = Object.keys(INTERVALS).map(Number).sort((a, b) => a - b);
const OBEN = BOXEN[BOXEN.length - 1];

/* --stand <datei>: ein Stand aus einer Datei statt aus dem KV, dieselbe Form
   ({ daten: { vt_progress: …, … } }). Nur für test-lernlast.mjs — die Wartung
   ruft das Werkzeug ohne Schalter auf und liest seinen echten Stand. */
const STAND_DATEI = (() => { const i = process.argv.indexOf('--stand'); return i > 1 ? process.argv[i + 1] : null; })();
let D;
try {
  let text;
  if (STAND_DATEI) text = fs.readFileSync(STAND_DATEI, 'utf8');
  else {
    const NS = (fs.readFileSync(path.join(REPO, 'wrangler.toml'), 'utf8').match(/id\s*=\s*"([0-9a-f]{32})"/) || [])[1];
    text = execFileSync('cmd', ['/c', 'npx', 'wrangler@4.138.0', 'kv', 'key', 'get', '--namespace-id=' + NS,
      'stand:abdurahman.tunk@gmail.com', '--remote'], { cwd: REPO, encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'pipe'] });
  }
  D = JSON.parse(text.slice(text.indexOf('{'))).daten || {};
} catch (e){ console.log('⛔ Stand nicht lesbar: ' + String(e.message).slice(0, 160)); process.exit(1); }
const p = v => { try { return typeof v === 'string' ? JSON.parse(v) : v; } catch (e){ return v; } };
const W = k => p(D[k] && D[k].wert !== undefined ? D[k].wert : D[k]);
const PROG = W('vt_progress') || {}, SET = W('vt_settings') || {}, FREI = W('vt_einzeln_frei') || {};
const QT = W('vt_quoteTage') || {};
const GEL = W('vt_geloescht') || {}, BEK = W('vt_bekannt') || {};
const auswahl = SET.buecher || {}, ziel = Number(SET.tagesDeckel) || 10;
const ctx = vm.createContext({ window: {} });
for (const f of fs.readdirSync(path.join(REPO, 'data')).filter(f => /^vokabeln-.*\.js$/.test(f)))
  vm.runInContext(fs.readFileSync(path.join(REPO, 'data', f), 'utf8'), ctx);
const buchVon = new Map();
for (const [b, l] of Object.entries(ctx.window.VOKABELN || {})) for (const w of l) buchVon.set(String(w.id), [b, Number(w.chapter)]);
const einzelnFrei = id => { const e = FREI[id]; return !!(e && (e === true || e.an)); };
const drin = id => {
  const x = buchVon.get(String(id));
  if (!x) return true;                                  /* eigene Wörter, Fachbegriffe */
  const k = auswahl[x[0]];
  return (Array.isArray(k) && k.includes(x[1])) || einzelnFrei(id);
};

/* ⛔⛔ WAS DIE APP IHM NICHT VORLEGT, ZÄHLT HIER NICHT MIT (02.10.2026).
   Anlass — Elias: „kann ich mein tagesziel wieder auf 10 stellen? guck mal
   nach ob ich jetzt schon kann". Dieses Werkzeug meldete „eine Wiederholung
   wartet seit 28 Tagen — Tagesziel erhöhen?". Die drei ältesten waren
   Fachbegriffe, die seit dem 08.09. ausgeblendet sind (gram-pron-anta, -ana,
   -huwa), die vierte gram-marfu, das seit dem 22.09. keine Karte mehr ist.
   Echt waren es 12 Tage, der Alarm war falsch — und er war es schon bei jedem
   Lauf seit dem 25.09. („21 Tage"). Derselbe Fehler wie am 25.09., nur in die
   andere Richtung: `vt_progress` behält jeden Eintrag, auch wenn es die Karte
   nicht mehr gibt. Vier Gründe, jeder an seiner Stelle in der App abgelesen:
     · übertragen         merkeUebertragen() in js/kern.js — der Fortschritt
                          lebt unter einer anderen Karte weiter, hier bleibt
                          ein Eintrag in Box 1 stehen
     · gelöscht           istGeloescht(): vt_geloescht[id].an
     · „kenne ich schon"  kennErSchon(): vt_bekannt[id].an, in passtZurAuswahl()
     · Fachbegriff        nur bestellte kommen in die Kartei (die Zeile
                          „VOCAB_DATA.push(...FACHBEGRIFF_VOKABELN.filter"), und
                          passtZurAuswahl() nimmt den heraus, dessen Regel von
                          den Karteikarten gestrichen ist
   Die zwei Fachbegriff-Funktionen werden aus js/kern.js GESCHNITTEN und hier
   ausgeführt — keine zweite Fassung der Regel.
   ⚠️ Weiter nur angenähert bleibt die Kapitelwahl in drin(): die App fragt
   zusätzlich istBekannt() und den „Eigene"-Chip. */
const an = (o, id) => { const e = o && o[id]; return !!(e && e.an); };
const schneide = name => {
  const auf = kern.indexOf('function ' + name + '(');
  const zu = auf < 0 ? -1 : kern.indexOf('\n}', auf);
  if (zu < 0){ console.log('⛔ ' + name + '() nicht in js/kern.js gefunden'); process.exit(1); }
  return kern.slice(auf, zu + 2);
};
let FACH;   /* id → steht in der Kartei (bestellt und nicht von der Regel herausgenommen) */
try {
  const welt = vm.createContext({});
  for (const f of ['grammar-data.js', path.join('data', 'fachbegriffe.js')])
    vm.runInContext(fs.readFileSync(path.join(REPO, f), 'utf8'), welt, { filename: f });
  vm.runInContext(schneide('fachbegriffBestellt') + '\n' + schneide('fachbegriffFolgtRegel'), welt);
  FACH = new Map(vm.runInContext(
    'FACHBEGRIFF_VOKABELN.map(w => [String(w.id), !!fachbegriffBestellt(w) && !fachbegriffFolgtRegel(w)])', welt));
} catch (e){ console.log('⛔ Fachbegriffe nicht lesbar: ' + String(e.message).slice(0, 160)); process.exit(1); }
const nichtVorgelegt = (id, x) => {
  if (x.uebertragen != null) return 'uebertragen';
  if (an(GEL, id)) return 'geloescht';
  if (an(BEK, id)) return 'bekannt';
  /* Ein Fachbegriff, den die Datei nicht (mehr) führt, ist auch keine Karte:
     die Datei ist die einzige Tür in die App. */
  if (FACH.has(String(id)) ? !FACH.get(String(id)) : String(id).startsWith('gram-')) return 'fachbegriff';
  return null;
};

const heute = new Date(); heute.setHours(heute.getHours() - 8);   /* wie todayStr(): vor 8 Uhr zählt zum Vortag */
const tag = `${heute.getFullYear()}-${String(heute.getMonth() + 1).padStart(2, '0')}-${String(heute.getDate()).padStart(2, '0')}`;
const tageZwischen = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 864e5);
const box = {}, faellig = {}, spaetMax = {};
BOXEN.forEach(b => { box[b] = 0; faellig[b] = 0; spaetMax[b] = 0; });
let neu = 0, vorgezogeneKarten = 0;
/* v604: die Lerngruppe (Mitglieder = Box 1 mit `gruppe`) */
const gruppe = { alle: 0, neu: 0, frueher: 0, faellig: 0, neuInSchlange: 0 };
const wdhFaellig = [];   // { v, b } der fälligen Wiederholungen
const draussen = { geloescht: 0, fachbegriff: 0, bekannt: 0, uebertragen: 0 };
const draussenFaellig = [];   // die fälligen Wiederholungen darunter, damit man SIEHT, was nicht mitzählt
for (const [id, x] of Object.entries(PROG)){
  if (!x || !drin(id)) continue;
  const b = Number(x.box) || 1;
  const grund = nichtVorgelegt(id, x);
  if (grund){
    draussen[grund]++;
    /* --draussen: jede nicht mitgezählte Karte einzeln — zum Nachsehen, ob
       eine darunter ist, die er doch noch gelernt hat (letzte Antwort, Gruppe). */
    if (process.argv.includes('--draussen'))
      console.log(`  draußen: ${String(id).padEnd(38)} ${grund.padEnd(11)} Box ${b} · fällig ${x.nextReview || '–'} · letzte Antwort ${x.ts ? new Date(x.ts).toLocaleString('de-DE') : '–'}${x.gruppe ? ' · IN DER LERNGRUPPE' : ''}`);
    if (b > 1 && String(x.nextReview) <= tag)
      draussenFaellig.push(`${id} (Box ${b}, ${Math.max(0, tageZwischen(String(x.nextReview), tag))} T)`);
    continue;
  }
  if (!(b in box)) box[b] = 0;
  box[b]++;
  if (b === 1 && !(Number(x.correct) > 0) && !(Number(x.wrong) > 0)) neu++;
  if (b === 1 && x.gruppe){
    gruppe.alle++;
    if (x.gruppeArt === 'neu') gruppe.neu++; else gruppe.frueher++;
    if (String(x.nextReview) <= tag) gruppe.faellig++;
  } else if (b === 1 && !(Number(x.correct) > 0) && !(Number(x.wrong) > 0)) gruppe.neuInSchlange++;
  if (Number(x.vorgezogen) > 0) vorgezogeneKarten++;
  if (String(x.nextReview) <= tag){
    faellig[b] = (faellig[b] || 0) + 1;
    if (b > 1){
      const spaet = Math.max(0, tageZwischen(String(x.nextReview), tag));
      spaetMax[b] = Math.max(spaetMax[b] || 0, spaet);
      wdhFaellig.push({ v: spaet / (INTERVALS[b] || 1), b });
    }
  }
}
const platz1 = Math.round(ziel * ANTEIL), wdhPlaetze = ziel - platz1;
const obenProTag = box[OBEN] / ((INTERVALS[OBEN] || 0) + 1);
const wartet = Math.max(0, ...BOXEN.filter(b => b > 1).map(b => spaetMax[b]));
const zeile = (von, f) => BOXEN.filter(b => b >= von).map(b => `Box ${b} ${f(b)}`).join(' · ');

console.log(`Tagesziel ${ziel} (mindestens ${platz1} Box 1 aus der Lerngruppe · ${wdhPlaetze} Wiederholungen; freie Plätze: Box 2/3 → andere Hälfte der Gruppe → Box 4–${OBEN})`);
console.log(`Karten: ${zeile(1, b => box[b])}`);
{
  const summe = Object.values(draussen).reduce((a, n) => a + n, 0);
  if (summe)
    console.log(`Nicht mitgezählt, weil die App sie nicht vorlegt: ${summe} (gelöscht ${draussen.geloescht} · Fachbegriff nicht in der Kartei ${draussen.fachbegriff} · „kenne ich schon" ${draussen.bekannt} · auf eine andere Karte übertragen ${draussen.uebertragen})`
      + (draussenFaellig.length ? ` — darunter fällige Wiederholungen: ${draussenFaellig.join(', ')}` : ''));
}
/* v604: Box 1 = Lerngruppe + Schlange. Gruppe = 2 × Box-1-Plätze. */
const schlange = box[1] - gruppe.alle;
console.log(`Lerngruppe: ${gruppe.alle} von ${2 * platz1} (neu ${gruppe.neu} · früher ${gruppe.frueher}; heute fällig ${gruppe.faellig})`);
console.log(`Schlange Box 1: ${schlange} (nie beantwortet ${gruppe.neuInSchlange} · falsch ${schlange - gruppe.neuInSchlange})`);
console.log(`Heute fällig: Box 1 ${faellig[1]} · Box 2–${OBEN} ${BOXEN.filter(b => b > 1).reduce((s, b) => s + faellig[b], 0)} (${zeile(2, b => faellig[b])})`);
console.log(`Am spätesten je Box (Tage): ${zeile(2, b => spaetMax[b])}`);

/* Die Wiederholungsplätze heute, wie tagesAuswahl() sie vergibt: die gemessen
   an ihrem Abstand spätesten zuerst, bei Gleichstand die niedrigere Box. */
const heuteWdh = wdhFaellig.sort((a, b) => (b.v - a.v) || (a.b - b.b)).slice(0, wdhPlaetze);
console.log(`Die ${wdhPlaetze} Wiederholungsplätze heute: ${zeile(2, b => heuteWdh.filter(x => x.b === b).length)}`);

/* ⏰ Seine Erinnerung „wieder auf 10" — Google-Aufgabe „Vokabeltrainer:
   Tagesziel wieder auf 10 stellen", fällig 02.10.2026. Das Datum hat ER am
   25.09.2026 gewählt („ja" auf „02.10. legen?"); ⛔ die Wartung verschiebt es
   NICHT mehr, sie meldet nur. Das Tagesziel stellt nur er um. */
/* v604: neue Wörter kommen nur noch über freie Plätze der Lerngruppe (2/3 der
   Gruppe sind Neu-Plätze) — wie viele am Tag, hängt davon ab, wie schnell er
   Gruppenwörter mit „gut" hinausbringt. Deshalb keine Tagesrate mehr hier. */
console.log(neu > 0
  ? `Neue Wörter: ${neu} nie beantwortet (davon in der Lerngruppe ${neu - gruppe.neuInSchlange})`
  : 'Neue Wörter: alle mindestens einmal beantwortet');
if (ziel > 10)
  console.log(`⏰ Tagesziel steht auf ${ziel} — seine Erinnerung „wieder auf 10" ist fällig am 02.10.2026 (nur melden, nicht verschieben).`);

/* Die versprochenen Messungen aus vt_quoteTage (seit v603). */
const sum = (von) => {
  const s = {};
  for (const [t, e] of Object.entries(QT)){
    if (t < von || !e) continue;
    for (const [k, n] of Object.entries(e)) if (/^[bfv]\d+[gr]$/.test(k)) s[k] = (s[k] || 0) + (Number(n) || 0);
  }
  return s;
};
const s = sum('2026-09-25');
const quote = (g, r) => g ? `${r} von ${g} = ${Math.round(100 * r / g)} %` : 'noch keine Antwort';
console.log(`Trefferquote je Box seit v603: ${BOXEN.map(b => `Box ${b} ${quote(s['b' + b + 'g'] || 0, s['b' + b + 'r'] || 0)}`).join(' · ')}`);
console.log(`  (Box 6/7 waren in der Rechnung ANGENOMMEN 0,9 — deutlich unter 0,8 → Abstände zur Entscheidung vorlegen)`);
const regulaer = b => {
  const g = (s['b' + b + 'g'] || 0) - (s['f' + b + 'g'] || 0) - (s['v' + b + 'g'] || 0);
  const r = (s['b' + b + 'r'] || 0) - (s['f' + b + 'r'] || 0) - (s['v' + b + 'r'] || 0);
  return quote(g, r);
};
console.log(`Vorgezogen: ${vorgezogeneKarten} Karten markiert · vorgezogene Antworten ${quote(BOXEN.reduce((a, b) => a + (s['f' + b + 'g'] || 0), 0), BOXEN.reduce((a, b) => a + (s['f' + b + 'r'] || 0), 0))}`);
console.log(`  später in Box 4/5 — früher vorgezogene: Box 4 ${quote(s.v4g || 0, s.v4r || 0)} · Box 5 ${quote(s.v5g || 0, s.v5r || 0)} | übrige: Box 4 ${regulaer(4)} · Box 5 ${regulaer(5)}`);

/* v606: Zeit je Satzübung (vt_quoteTage zn_/zs_, merkeUebZeit()). Ab 10
   Antworten in 28 Tagen nimmt die App die Messung statt der Schätzung für die
   zwei gleich langen Teile (satzTeile() in js/uebung.js) — hier steht, wie
   weit das ist, damit die Wartung es ihm sagen kann. */
{
  const von = (() => { const d = new Date(tag + 'T12:00:00'); d.setDate(d.getDate() - 28); return d.toISOString().slice(0, 10); })();
  const je = {};
  for (const [t, e] of Object.entries(QT)){
    if (t < von || !e) continue;
    for (const [k, n] of Object.entries(e)){
      const m = /^z([ns])_(.+)$/.exec(k);
      if (!m) continue;
      je[m[2]] = je[m[2]] || { n: 0, s: 0 };
      je[m[2]][m[1]] += Number(n) || 0;
    }
  }
  const ids = Object.keys(je).sort();
  console.log(ids.length
    ? `Satzübungen, Zeit je Aufgabe (28 Tage): ${ids.map(id => `${id} ${je[id].n ? Math.round(je[id].s / je[id].n) : '–'} s (${je[id].n})`).join(' · ')} — gemessen zählt ab 10 Antworten`
    : 'Satzübungen: noch keine Zeit gemessen — die zwei Teile beruhen auf der Schätzung');
}
console.log(`Box ${OBEN} kostet dauerhaft ≈ ${obenProTag.toFixed(1)} Wiederholungen am Tag · älteste fällige Wiederholung wartet ${wartet} Tag(e)`);
const knapp = obenProTag >= wdhPlaetze || wartet > 14;
console.log(knapp
  ? `⚠️ ${ziel} am Tag reichen nicht mehr: ${obenProTag >= wdhPlaetze ? `Box ${OBEN} allein braucht ${obenProTag.toFixed(1)} von ${wdhPlaetze} Wiederholungsplätzen` : `eine Wiederholung wartet seit ${wartet} Tagen`} — Frage an ihn: Tagesziel erhöhen?`
  : `✅ ${ziel} am Tag reichen noch.`);
process.exit(knapp ? 2 : 0);
