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
 *
 * Liest seinen Gerätestand aus dem KV (NUR LESEN).
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

let D;
try {
  const NS = (fs.readFileSync(path.join(REPO, 'wrangler.toml'), 'utf8').match(/id\s*=\s*"([0-9a-f]{32})"/) || [])[1];
  const text = execFileSync('cmd', ['/c', 'npx', 'wrangler@4.138.0', 'kv', 'key', 'get', '--namespace-id=' + NS,
    'stand:abdurahman.tunk@gmail.com', '--remote'], { cwd: REPO, encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'pipe'] });
  D = JSON.parse(text.slice(text.indexOf('{'))).daten || {};
} catch (e){ console.log('⛔ Stand nicht lesbar: ' + String(e.message).slice(0, 160)); process.exit(1); }
const p = v => { try { return typeof v === 'string' ? JSON.parse(v) : v; } catch (e){ return v; } };
const W = k => p(D[k] && D[k].wert !== undefined ? D[k].wert : D[k]);
const PROG = W('vt_progress') || {}, SET = W('vt_settings') || {}, FREI = W('vt_einzeln_frei') || {};
const QT = W('vt_quoteTage') || {};
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

const heute = new Date(); heute.setHours(heute.getHours() - 8);   /* wie todayStr(): vor 8 Uhr zählt zum Vortag */
const tag = `${heute.getFullYear()}-${String(heute.getMonth() + 1).padStart(2, '0')}-${String(heute.getDate()).padStart(2, '0')}`;
const tageZwischen = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 864e5);
const box = {}, faellig = {}, spaetMax = {};
BOXEN.forEach(b => { box[b] = 0; faellig[b] = 0; spaetMax[b] = 0; });
let neu = 0, vorgezogeneKarten = 0;
/* v604: die Lerngruppe (Mitglieder = Box 1 mit `gruppe`) */
const gruppe = { alle: 0, neu: 0, frueher: 0, faellig: 0, neuInSchlange: 0 };
const wdhFaellig = [];   // { v, b } der fälligen Wiederholungen
for (const [id, x] of Object.entries(PROG)){
  if (!x || !drin(id)) continue;
  const b = Number(x.box) || 1; if (!(b in box)) box[b] = 0;
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

console.log(`Box ${OBEN} kostet dauerhaft ≈ ${obenProTag.toFixed(1)} Wiederholungen am Tag · älteste fällige Wiederholung wartet ${wartet} Tag(e)`);
const knapp = obenProTag >= wdhPlaetze || wartet > 14;
console.log(knapp
  ? `⚠️ ${ziel} am Tag reichen nicht mehr: ${obenProTag >= wdhPlaetze ? `Box ${OBEN} allein braucht ${obenProTag.toFixed(1)} von ${wdhPlaetze} Wiederholungsplätzen` : `eine Wiederholung wartet seit ${wartet} Tagen`} — Frage an ihn: Tagesziel erhöhen?`
  : `✅ ${ziel} am Tag reichen noch.`);
process.exit(knapp ? 2 : 0);
