#!/usr/bin/env node
/* lernlast.mjs — reichen seine 10 Karten am Tag noch? (seit 25.09.2026)
 * ==========================================================================
 *
 * Elias zum Plan für den Rundenbau (5 zu 5, ein Box-1-Platz fürs am längsten
 * falsche Wort, Auffüllen nach derselben Regel, und: „Wartung Mi/So: Sie misst,
 * wie viele Wiederholungen dauerhaft anfallen und wie viel überfällig ist.
 * Reichen 10 Karten am Tag nicht mehr, sagt sie es dir mit Zahl."):
 * „das klingt gut. mach das".
 *
 * Liest seinen Gerätestand aus dem KV (NUR LESEN) und zeigt:
 *   · Karten je Box in seiner Auswahl, davon nie beantwortet,
 *   · fällig heute je Box,
 *   · was Box 5 dauerhaft kostet (Karten / 17 Tage — Box 5 kreist alle 16 Tage;
 *     Box 2–4 kreisen NICHT, sie steigen auf — so nicht mitrechnen),
 *   · wie lange die älteste fällige Wiederholung schon wartet.
 * Exit 2 = 10 am Tag reichen nicht mehr (Box-5-Pflege belegt die 5
 * Wiederholungsplätze, oder eine Wiederholung wartet über 14 Tage) — das ist
 * eine ZAHL FÜR IHN, keine Entscheidung: ob das Tagesziel steigt, sagt er.
 * Exit 0 = reicht · 1 = Stand nicht lesbar.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let D;
try {
  const NS = (fs.readFileSync(path.join(REPO, 'wrangler.toml'), 'utf8').match(/id\s*=\s*"([0-9a-f]{32})"/) || [])[1];
  const text = execFileSync('cmd', ['/c', 'npx', 'wrangler@4.138.0', 'kv', 'key', 'get', '--namespace-id=' + NS,
    'stand:abdurahman.tunk@gmail.com', '--remote'], { cwd: REPO, encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'pipe'] });
  D = JSON.parse(text.slice(text.indexOf('{'))).daten || {};
} catch (e){ console.log('⛔ Stand nicht lesbar: ' + String(e.message).slice(0, 160)); process.exit(1); }
const p = v => { try { return typeof v === 'string' ? JSON.parse(v) : v; } catch (e){ return v; } };
const W = k => p(D[k] && D[k].wert !== undefined ? D[k].wert : D[k]);
const PROG = W('vt_progress') || {}, SET = W('vt_settings') || {};
const auswahl = SET.buecher || {}, ziel = Number(SET.tagesDeckel) || 10;
const ctx = vm.createContext({ window: {} });
for (const f of fs.readdirSync(path.join(REPO, 'data')).filter(f => /^vokabeln-.*\.js$/.test(f)))
  vm.runInContext(fs.readFileSync(path.join(REPO, 'data', f), 'utf8'), ctx);
const buchVon = new Map();
for (const [b, l] of Object.entries(ctx.window.VOKABELN || {})) for (const w of l) buchVon.set(String(w.id), [b, Number(w.chapter)]);
const drin = id => { const x = buchVon.get(String(id)); if (!x) return true; const k = auswahl[x[0]]; return Array.isArray(k) && k.includes(x[1]); };

const heute = new Date(); const tag = `${heute.getFullYear()}-${String(heute.getMonth() + 1).padStart(2, '0')}-${String(heute.getDate()).padStart(2, '0')}`;
const box = [0, 0, 0, 0, 0, 0], faellig = [0, 0, 0, 0, 0, 0]; let neu = 0, aeltesteWdh = null;
const wdhFaellig = [];   // [nextReview, box] der fälligen Wiederholungen (Box 2–5)
for (const [id, x] of Object.entries(PROG)){
  if (!drin(id)) continue;
  const b = x.box || 1; box[b]++;
  if (!(Number(x.correct) > 0) && !(Number(x.wrong) > 0)) neu++;
  if (String(x.nextReview) <= tag){ faellig[b]++; if (b > 1) wdhFaellig.push([String(x.nextReview), b]); if (b > 1 && (!aeltesteWdh || String(x.nextReview) < aeltesteWdh)) aeltesteWdh = String(x.nextReview); }
}
const wdhPlaetze = ziel - Math.round(ziel * 0.5);
const box5ProTag = box[5] / 17;
const wartet = aeltesteWdh ? Math.round((new Date(tag) - new Date(aeltesteWdh)) / 864e5) : 0;
console.log(`Tagesziel ${ziel} (${ziel - wdhPlaetze} Box 1 · ${wdhPlaetze} Wiederholungen)`);
console.log(`Karten: Box 1 ${box[1]} (nie beantwortet ${neu}) · Box 2 ${box[2]} · Box 3 ${box[3]} · Box 4 ${box[4]} · Box 5 ${box[5]}`);
/* ⏰ Seine Erinnerung (25.09.2026, als er das Tagesziel auf 15 stellte): „sobald
   alle neuen wörter einmal durch sind soll ich erinnert werden, dass ich wieder
   auf 10 runter stelle". Neue Karten kommen zuerst auf die Box-1-Plätze; je 10
   Karten gehört einer davon dem ältesten falschen Wort (bei 15 und 20: zwei —
   tagesAuswahl in js/kern.js). Die Wartung (1b.10) schiebt danach das Datum
   seiner Google-Aufgabe; das Tagesziel selbst stellt nur ER um. */
const neuProTag = Math.max(1, ziel - wdhPlaetze - Math.max(1, Math.round(ziel / 10)));
const lerntage = Math.ceil(neu / neuProTag);
const bis = new Date(heute); bis.setDate(bis.getDate() + lerntage);
console.log(neu > 0
  ? `Neue Wörter: ${neu} nie beantwortet, ${neuProTag} am Tag → noch etwa ${lerntage} Lerntage (≈ ${bis.toLocaleDateString('de-DE')})`
  : 'Neue Wörter: alle mindestens einmal beantwortet');
if (ziel > 10 && neu === 0)
  console.log(`⏰ Alle neuen Wörter waren einmal dran, das Tagesziel steht noch auf ${ziel} — Erinnerung fällig: wieder auf 10 (sein Wunsch vom 25.09.2026).`);
console.log(`Heute fällig: Box 1 ${faellig[1]} · Box 2–5 ${faellig[2] + faellig[3] + faellig[4] + faellig[5]} (Box 5: ${faellig[5]})`);
/* Elias, 25.09.2026: „ich frage mich halt ob dann theoretisch die übrigen plätze
   zb nur oder fast ausschließlich von vokabeln aus box 5 kommen könnten?" —
   also messen, aus welchen Boxen die Wiederholungsplätze HEUTE kommen: am
   längsten fällig zuerst, bei Gleichstand die niedrigere Box (tagesAuswahl). */
const heuteWdh = wdhFaellig.sort((a, b) => a[0].localeCompare(b[0]) || a[1] - b[1]).slice(0, wdhPlaetze);
const jeBox = [2, 3, 4, 5].map(b => `Box ${b}: ${heuteWdh.filter(x => x[1] === b).length}`).join(' · ');
console.log(`Die ${wdhPlaetze} Wiederholungsplätze heute: ${jeBox}`);
console.log(`Box 5 kostet dauerhaft ≈ ${box5ProTag.toFixed(1)} Wiederholungen am Tag · älteste fällige Wiederholung wartet ${wartet} Tag(e)`);
const knapp = box5ProTag >= wdhPlaetze || wartet > 14;
console.log(knapp
  ? `⚠️ ${ziel} am Tag reichen nicht mehr: ${box5ProTag >= wdhPlaetze ? `Box 5 allein braucht ${box5ProTag.toFixed(1)} von ${wdhPlaetze} Wiederholungsplätzen` : `eine Wiederholung wartet seit ${wartet} Tagen`} — Frage an ihn: Tagesziel erhöhen?`
  : `✅ ${ziel} am Tag reichen noch.`);
process.exit(knapp ? 2 : 0);
