#!/usr/bin/env node
/* test-lernlast.mjs — zählt werkzeuge/lernlast.mjs nur, was die App ihm vorlegt?
 * ==========================================================================
 * (02.10.2026)
 *
 * Elias: „kann ich mein tagesziel wieder auf 10 stellen? guck mal nach ob ich
 * jetzt schon kann". lernlast.mjs antwortete mit Exit 2: „eine Wiederholung
 * wartet seit 28 Tagen — Frage an ihn: Tagesziel erhöhen?". Das war falsch.
 * Die drei ältesten „Wiederholungen" waren Fachbegriffe, die seit dem 08.09.
 * ausgeblendet sind, die vierte gram-marfu, das seit dem 22.09. keine Karte
 * mehr ist. Echt waren es 12 Tage. `vt_progress` behält jeden Eintrag, auch
 * wenn es die Karte nicht mehr gibt — und das Werkzeug zählte sie alle mit,
 * bei jedem Lauf der Wartung seit dem 25.09.
 *
 * Dieser Test baut SEINEN Fall als kleinen Stand nach (eine echte Karte 12 Tage
 * zu spät, daneben sechs Einträge, die die App nicht vorlegt) und lässt das
 * echte Werkzeug darauf laufen (`--stand`). Die Störtests nehmen je eine Regel
 * aus einer Kopie des Quelltexts und verlangen, dass der Test das merkt.
 *
 * Aufruf: node test-lernlast.mjs      Exit 0 = alles wie erwartet, 1 = nicht
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const WERKZEUG = path.join(HIER, 'werkzeuge', 'lernlast.mjs');
const QUELLE = fs.readFileSync(WERKZEUG, 'utf8');

let fehler = 0;
const gut = t => console.log('  ✅ ' + t);
const schlecht = t => { fehler++; console.log('  ⛔ ' + t); };

/* ---------- Der Lerntag, wie das Werkzeug ihn rechnet (vor 8 Uhr = Vortag) ---------- */
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const jetzt = new Date(); jetzt.setHours(jetzt.getHours() - 8);
const TAG = iso(jetzt);
const vor = n => { const d = new Date(TAG + 'T12:00:00'); d.setDate(d.getDate() - n); return iso(d); };

/* ---------- Echte Kennungen aus den Daten holen ---------- */
const buchWelt = vm.createContext({ window: {} });
for (const f of fs.readdirSync(path.join(HIER, 'data')).filter(f => /^vokabeln-.*\.js$/.test(f)))
  vm.runInContext(fs.readFileSync(path.join(HIER, 'data', f), 'utf8'), buchWelt);
let buch = null, kapitel = null, B = [];
for (const [b, liste] of Object.entries(buchWelt.window.VOKABELN || {})){
  const k = liste.length ? Number(liste[0].chapter) : NaN;
  const ids = liste.filter(w => Number(w.chapter) === k).map(w => String(w.id));
  if (Number.isFinite(k) && ids.length >= 2){ buch = b; kapitel = k; B = ids; break; }
}
if (!buch){ console.log('⛔ Keine Buchdaten (data/vokabeln-*.js) — ohne sie kann lernlast.mjs nicht zählen.'); process.exit(1); }

const fachWelt = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(HIER, 'grammar-data.js'), 'utf8'), fachWelt);
vm.runInContext(fs.readFileSync(path.join(HIER, 'data', 'fachbegriffe.js'), 'utf8'), fachWelt);
/* Was „in der Kartei" heißt, hier noch einmal in eigenen Worten — nicht mit den
   Funktionen der App, sonst prüfte der Test die Regel mit sich selbst. */
const FACH = JSON.parse(vm.runInContext(`JSON.stringify(FACHBEGRIFF_VOKABELN.map(w => ({
  id: String(w.id),
  bestellt: Object.keys(FACHBEGRIFF_AUFTRAG).includes(String(w.id)),
  regelGestrichen: !!(w.regel && (GRAMMAR_RULES.find(r => r && r.id === w.regel) || {}).nichtAufKarteikarten),
  buchTausch: !!w.buchTausch
})))`, fachWelt));
/* Ohne die mit `buchTausch`: die laufen in der App als Buchkarte, nicht selbst. */
const inKartei = FACH.filter(f => f.bestellt && !f.regelGestrichen && !f.buchTausch).map(f => f.id);
const unbestellt = FACH.filter(f => !f.bestellt).map(f => f.id);
const marfu = FACH.find(f => f.id === 'gram-marfu');

console.log('Voraussetzungen des Falls');
if (marfu && marfu.bestellt && marfu.regelGestrichen) gut('gram-marfu ist bestellt, seine Regel aber von den Karteikarten gestrichen — sein Fall');
else schlecht('gram-marfu ist nicht mehr „bestellt, Regel gestrichen" — der Fall vom 02.10.2026 lässt sich so nicht mehr nachbauen: ' + JSON.stringify(marfu));
if (inKartei.length >= 2) gut(`${inKartei.length} Fachbegriffe stehen in der Kartei (genommen: ${inKartei[0]}, ${inKartei[1]})`);
else schlecht('weniger als zwei Fachbegriffe in der Kartei — zwei werden gebraucht');
if (unbestellt.length >= 1) gut(`${unbestellt.length} Fachbegriffe sind nicht bestellt (genommen: ${unbestellt[0]})`);
else schlecht('kein unbestellter Fachbegriff in data/fachbegriffe.js — dieser Teil des Falls fehlt');
if (fehler){ console.log(`\n⛔ ${fehler} Voraussetzung(en) fehlen.`); process.exit(1); }

const [B_ECHT, B_KENNT] = B;
const [F_WEG, F_ZURUECK] = inKartei;
const F_UNBESTELLT = unbestellt[0];
const F_FEHLT = 'gram-gibt-es-nicht-mehr';

/* ---------- Sein Fall als kleiner Stand ---------- */
function stand(echtSpaet){
  return { daten: {
    vt_settings: { tagesDeckel: 15, buecher: { [buch]: [kapitel] } },
    vt_einzeln_frei: {}, vt_quoteTage: {},
    vt_geloescht: { [F_WEG]: { an: true, zeit: 1 }, [F_ZURUECK]: { an: false, zeit: 2 } },
    vt_bekannt: { [B_KENNT]: { an: true, zeit: 1 } },
    vt_progress: {
      [B_ECHT]:        { box: 5, nextReview: vor(echtSpaet), correct: 3, wrong: 0 },  /* die echte Karte */
      [B_KENNT]:       { box: 4, nextReview: vor(30), correct: 4, wrong: 0 },         /* „kenne ich schon" */
      [F_WEG]:         { box: 2, nextReview: vor(28), correct: 1, wrong: 0 },         /* ausgeblendet */
      'gram-marfu':    { box: 3, nextReview: vor(16), correct: 2, wrong: 1 },         /* Regel gestrichen */
      [F_UNBESTELLT]:  { box: 3, nextReview: vor(20), correct: 2, wrong: 0 },         /* nie bestellt */
      [F_FEHLT]:       { box: 2, nextReview: vor(25), correct: 1, wrong: 0 },         /* steht nicht mehr in der Datei */
      [F_ZURUECK]:     { box: 2, nextReview: vor(2),  correct: 1, wrong: 0 },         /* zurückgeholt (an:false) — ZÄHLT */
      'eigen-alt':     { box: 1, nextReview: vor(5),  correct: 0, wrong: 0, uebertragen: B_ECHT },
      'eigen-1':       { box: 3, nextReview: vor(1),  correct: 2, wrong: 0 }          /* eigenes Wort — ZÄHLT */
    }
  } };
}

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'lernlast-test-'));
function lauf(werkzeug, daten){
  const datei = path.join(TMP, 'stand.json');
  fs.writeFileSync(datei, JSON.stringify(daten));
  const r = spawnSync(process.execPath, [werkzeug, '--stand', datei], { encoding: 'utf8' });
  return { code: r.status, aus: String(r.stdout || '') + String(r.stderr || '') };
}

/* Was bei seinem Fall herauskommen muss. Gibt die Liste der Abweichungen zurück. */
function abweichungen(r){
  const soll = [
    ['Exit 0 (15 am Tag reichen)', r.code === 0],
    ['älteste echte Wiederholung: 12 Tage', r.aus.includes('älteste fällige Wiederholung wartet 12 Tag(e)')],
    ['fällig: 3 Wiederholungen (Box 2 1 · Box 3 1 · Box 5 1)', r.aus.includes('Heute fällig: Box 1 0 · Box 2–7 3 (Box 2 1 · Box 3 1 · Box 4 0 · Box 5 1 · Box 6 0 · Box 7 0)')],
    ['Karten: nur die drei, Box 1 leer', r.aus.includes('Karten: Box 1 0 · Box 2 1 · Box 3 1 · Box 4 0 · Box 5 1 · Box 6 0 · Box 7 0')],
    ['die Zeile „Nicht mitgezählt" nennt 6 und ihre Gründe', r.aus.includes('Nicht mitgezählt, weil die App sie nicht vorlegt: 6 (gelöscht 1 · Fachbegriff nicht in der Kartei 3 · „kenne ich schon" 1 · auf eine andere Karte übertragen 1)')],
    ['sie nennt die ausgeblendete Karte mit 28 Tagen', r.aus.includes(`${F_WEG} (Box 2, 28 T)`)],
    ['sie nennt gram-marfu mit 16 Tagen', r.aus.includes('gram-marfu (Box 3, 16 T)')],
    ['„reichen noch"', r.aus.includes('✅ 15 am Tag reichen noch.')]
  ];
  return soll.filter(([, ok]) => !ok).map(([t]) => t);
}

try {
  console.log('\nA. Sein Fall: eine echte Karte 12 Tage zu spät, sechs Einträge, die die App nicht vorlegt');
  const a = lauf(WERKZEUG, stand(12));
  const offen = abweichungen(a);
  if (!offen.length) gut('8 von 8 Erwartungen erfüllt (Exit 0, 12 Tage, 3 fällig, 6 nicht mitgezählt)');
  else { offen.forEach(t => schlecht(t)); console.log(a.aus.split('\n').slice(0, 14).map(z => '      ' + z.slice(0, 200)).join('\n')); }

  console.log('\nB. Der Alarm geht noch: dieselbe echte Karte 15 Tage zu spät');
  const b = lauf(WERKZEUG, stand(15));
  if (b.code === 2 && b.aus.includes('eine Wiederholung wartet seit 15 Tagen')) gut('Exit 2 und „wartet seit 15 Tagen"');
  else schlecht(`erwartet Exit 2 mit „wartet seit 15 Tagen", bekommen Exit ${b.code}`);

  console.log('\nC. Ohne Schalter liest das Werkzeug weiter den KV (der Schalter ist nur für den Test)');
  if (/STAND_DATEI\) text = fs\.readFileSync/.test(QUELLE) && /'kv', 'key', 'get'/.test(QUELLE)) gut('beide Wege stehen im Quelltext');
  else schlecht('der KV-Abruf oder der Datei-Weg fehlt im Quelltext');

  /* ---------- Störtests: je eine Regel aus einer Kopie nehmen ---------- */
  console.log('\nStörtests (eine Kopie des Werkzeugs, je eine Regel herausgenommen — der Test muss es merken)');
  const REPO_ZEILE = "const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');";
  const STOERUNGEN = [
    ['ausgeblendete Karten zählen wieder mit', "  if (an(GEL, id)) return 'geloescht';", ''],
    ['„kenne ich schon" zählt wieder mit', "  if (an(BEK, id)) return 'bekannt';", ''],
    ['Fachbegriffe außerhalb der Kartei zählen wieder mit', '!FACH.get(String(id))', 'false'],
    ['ein Fachbegriff, den die Datei nicht führt, zählt wieder mit', "String(id).startsWith('gram-')", 'false'],
    ['übertragene Einträge zählen wieder mit', "  if (x.uebertragen != null) return 'uebertragen';", ''],
    ['eine zurückgeholte Karte (an:false) gilt als ausgeblendet', 'return !!(e && e.an);', 'return !!e;']
  ];
  STOERUNGEN.forEach(([name, alt, neu], i) => {
    if (!QUELLE.includes(REPO_ZEILE) || QUELLE.split(alt).length !== 2){
      schlecht(`${name}: die Stelle steht nicht genau einmal im Quelltext — der Störtest greift ins Leere`);
      return;
    }
    const kopie = path.join(TMP, `lernlast-stoer-${i}.mjs`);
    fs.writeFileSync(kopie, QUELLE.replace(REPO_ZEILE, 'const REPO = ' + JSON.stringify(HIER) + ';').replace(alt, neu));
    const s = lauf(kopie, stand(12));
    const gemerkt = abweichungen(s);
    if (gemerkt.length) gut(`${name} → rot (${gemerkt.length} Erwartung(en) verfehlt, Exit ${s.code})`);
    else schlecht(`${name} → der Test blieb GRÜN, er sieht diese Regel nicht`);
  });
} finally {
  fs.rmSync(TMP, { recursive: true, force: true });
}

console.log(fehler ? `\n⛔ ${fehler} Befund(e).` : '\n✅ lernlast.mjs zählt nur, was die App vorlegt; sechs Störtests rot.');
process.exit(fehler ? 1 : 0);
