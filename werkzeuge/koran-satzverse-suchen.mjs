#!/usr/bin/env node
/* koran-satzverse-suchen.mjs — sucht für die Karten von „Koran häufigste" einen Vers als Beispielsatz.
 *
 * Elias, 23.10.2026, 23:25: „für die koranwörter von den häufigsten gibt es keinen beispielsatz, da kannst
 * du ruhig aus dem koran die nehmen vorallem wenn ich sie bereits kenne".
 *
 * Gesucht wird GENAU die Form der Karte (werkzeuge/koran-form-lib.mjs), im ganzen Koran. Gewählt wird so
 * (MEINE Bauart, aus seinem „vorallem wenn ich sie bereits kenne"):
 *   1. ein Vers aus seinem auswendigen Bereich (werkzeuge/auswendig.js liest seine Haken), der kürzeste;
 *   2. sonst der kürzeste Vers mit 4 bis 14 Wörtern; erst danach kürzere oder längere.
 * Bei einem Verb zuerst die Vergangenheit (die Vorderseite der Karte), sonst die Gegenwart, sonst das
 * Verbalsubstantiv — soweit die Felder-Datei sie trägt.
 *
 * Das Werkzeug SCHREIBT NICHTS ins Repo. Es schlägt vor; jede Wahl wird am Wort gelesen und dann von Hand
 * in werkzeuge/koran-vorlagen/satzverse.json eingetragen (ohne ein arabisches Zeichen).
 *
 * Aufruf:
 *   node werkzeuge/koran-satzverse-suchen.mjs                 Karten ohne Stelle und ohne Eintrag
 *   node werkzeuge/koran-satzverse-suchen.mjs kh-030 kh-157   nur diese Karten (auch mit Eintrag)
 *   --json <datei>    alle Treffer als JSON dorthin (für die Durchsicht)
 *   --je <n>          so viele Vorschläge je Karte zeigen (Standard 1)
 *   --bereich         nur zählen: Karten, deren Vers NICHT aus seinem Bereich ist, obwohl dort jetzt einer
 *                     steht (für die Wartung: sein Bereich wächst) — Exit 2, wenn es welche gibt */
import fs from 'node:fs';
import path from 'node:path';
import { quran, bereich, kannStelle, woerterVon, lade, VORLAGEN } from './koran-stellen-lib.mjs';
import { verswortStaemme, kartenFormen, skelett, einheitenGleich, ohneEndungFuer } from './koran-form-lib.mjs';
import { ohneTraeger } from './koran-haeufig-bauen.mjs';
import { zitat } from './koran-stellen-lib.mjs';

const args = process.argv.slice(2);
const wert = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const NUR = args.filter((a, i) => /^kh-\d+$/.test(a) && !['--json', '--je'].includes(args[i - 1]));
const JE = Number(wert('--je') || 1);
const KARTEN = lade('koran-haeufig-data.js', 'KORAN_HAEUFIG') || [];
const lies = n => { try { return JSON.parse(fs.readFileSync(path.join(VORLAGEN, n), 'utf8')); } catch (e){ return {}; } };
const STELLEN = lies('stellen.json'), SATZVERSE = lies('satzverse.json');
const A = bereich();
const Q = quran();
/* Ein Vers, den er nur aus einer Dua kennt, zählt trotzdem als bekannt, wenn die Dua der GANZE Vers ist
   (20:26, 20:27, 20:28 — gezählt an der Wortzahl). Sonst kennt er nur ihren Teil (2:286, 28:24 …). */
const GANZ_AUS_DUA = new Set();
for (const d of A.duas || []) for (const t of d.texte || []) for (const m of JSON.stringify(t).matchAll(/\b(\d{1,3}):(\d{1,3})\b/g)){
  const wo = Number(m[1]) + ':' + Number(m[2]), e = (Q[Number(m[1])] || [])[Number(m[2]) - 1];
  if (A.ausDuas && A.ausDuas.has(wo) && e && woerterVon(e[0]).length === woerterVon(t.arabisch).length) GANZ_AUS_DUA.add(wo);
}
const bekannt = (s, v) => kannStelle(A, s, v) && !(A.ausDuas && A.ausDuas.has(s + ':' + v) && !GANZ_AUS_DUA.has(s + ':' + v));

/* Der Index: je Wortart-Gruppe (Verb oder nicht) jeder Stamm jedes Verswortes, nach seinem Buchstabengerüst. */
const index = { verb: new Map(), nomen: new Map() };
for (const s of Object.keys(Q)){
  Q[s].forEach(([ar], vi) => {
    const w = woerterVon(ar);
    /* Ein Vers, dessen Zitat eine Marke ohne Träger hat (kleines Wāw mit Madda: rabbahū), nähme der Erzeuger
       nicht an — die Karte zeigte dort einen leeren Kreis. Gemessen am 24.10.2026: 8 von 202 Vorschlägen. */
    if (ohneTraeger(zitat(s + ':' + (vi + 1), 1, w.length))) return;
    w.forEach((wort, wi) => {
      for (const [gruppe, typ] of [['verb', 'verb'], ['nomen', 'noun']]){
        const gesehen = new Set();
        for (const st of verswortStaemme(wort, typ)){
          const sk = skelett(st.e);
          const schl = sk + '|' + st.e.map(x => x.v + (x.s ? 's' : '')).join(',');
          if (gesehen.has(schl)) continue;
          gesehen.add(schl);
          if (!index[gruppe].has(sk)) index[gruppe].set(sk, []);
          index[gruppe].get(sk).push({ sure: Number(s), vers: vi + 1, wort: wi + 1, n: w.length, e: st.e, u: st.unsicher });
        }
      }
    });
  });
}

function treffer(ar, typ, ohneEndung){
  const gruppe = typ === 'verb' ? 'verb' : 'nomen';
  const verse = new Map();
  for (const f of kartenFormen(ar, typ)){
    for (const t of index[gruppe].get(skelett(f.e)) || []){
      const wo = t.sure + ':' + t.vers;
      const unsicher = !!(f.unsicher || t.u);
      if (verse.has(wo) && (!verse.get(wo).unsicher || unsicher)) continue;
      /* ⛔ Einen Vers, den er NUR aus einer Dua kennt (28:24, 2:286 …), kennt er nicht ganz — dort ist nur der
         Wortlaut der Dua zitierbar (werkzeuge/auswendig.js, ausDuas). Für die Wahl zählt er nicht als bekannt,
         außer die Dua ist der ganze Vers (bekannt() oben). */
      if (einheitenGleich(f.e, t.e, ohneEndung, typ === 'verb')) verse.set(wo, { wo, sure: t.sure, vers: t.vers, wort: t.wort, n: t.n,
        bereich: bekannt(t.sure, t.vers), dua: !!(A.ausDuas && A.ausDuas.has(wo)), unsicher });
    }
  }
  return [...verse.values()];
}
/* Sicher vor unsicher, sein Bereich vor dem Rest, 4 bis 14 Wörter vor kürzer und länger. */
const rang = t => (t.unsicher ? 5000 : 0) + (t.bereich ? 0 : 1000) + (t.n >= 4 && t.n <= 14 ? t.n : t.n < 4 ? 40 + t.n : 100 + t.n);

const ergebnis = [];
for (const k of KARTEN){
  /* --alle: auch Karten, die schon einen Eintrag haben (um die Vorlage neu zu bauen) — nie die mit Stelle. */
  if (NUR.length ? !NUR.includes(k.id) : (STELLEN[k.id] && STELLEN[k.id].wo) || (SATZVERSE[k.id] && !args.includes('--alle'))) continue;
  const versuche = [['ar', k.ar, k.type, ohneEndungFuer(k.type)]];
  if (k.type === 'verb'){
    if (k.present) versuche.push(['present', k.present, 'verb', true]);
    if (k.masdar) versuche.push(['masdar', k.masdar, 'noun', true]);
  }
  let liste = [], form = null;
  for (const [feld, ar, typ, ohne] of versuche){
    liste = treffer(ar, typ, ohne);
    if (liste.length){ form = feld; break; }
  }
  liste.sort((a, b) => rang(a) - rang(b) || a.sure - b.sure || a.vers - b.vers);
  ergebnis.push({ id: k.id, rang: k.rang, type: k.type, de: k.de, form, anzahl: liste.length, imBereich: liste.filter(t => t.bereich).length, vorschlaege: liste.slice(0, 8) });
}

if (args.includes('--bereich')){
  /* Für die Wartung: ein Eintrag mit Vers außerhalb seines Bereichs, obwohl jetzt einer darin steht. */
  const besser = [];
  for (const [id, e] of Object.entries(SATZVERSE)){
    if (id === '_' || !e || !e.wo) continue;
    const [s, v] = String(e.wo).split(':').map(Number);
    if (bekannt(s, v)) continue;
    const k = KARTEN.find(x => x.id === id); if (!k) continue;
    const feld = e.form || 'ar';
    const ar = feld === 'ar' ? k.ar : k[feld];
    const typ = feld === 'masdar' ? 'noun' : k.type;
    if (ar && treffer(ar, typ, feld === 'ar' ? ohneEndungFuer(k.type) : true).some(t => t.bereich)) besser.push(id);
  }
  console.log(besser.length ? `⏳ ${besser.length} Karte(n) haben einen Vers außerhalb seines Bereichs, obwohl jetzt einer darin steht: ${besser.join(', ')} — neu wählen (node werkzeuge/koran-satzverse-suchen.mjs ${besser.slice(0, 3).join(' ')}).`
    : '✅ Kein Koransatz hätte jetzt einen Vers aus seinem Bereich, der noch nicht gewählt ist.');
  process.exit(besser.length ? 2 : 0);
}

if (wert('--json')) fs.writeFileSync(wert('--json'), JSON.stringify(ergebnis, null, 1), 'utf8');
let ohne = 0;
for (const r of ergebnis){
  if (!r.vorschlaege.length){ ohne++; console.log(`${r.id} (${r.type}) ${r.de} — KEIN Vers mit genau dieser Form`); continue; }
  /* Ist der beste Vers aus seinem Bereich lang, steht der beste kurze von außerhalb daneben. */
  const zeigen = r.vorschlaege.slice(0, JE);
  const kurz = r.vorschlaege.find(t => !t.bereich && t.n <= 14 && !t.unsicher);
  if (zeigen[0] && zeigen[0].bereich && zeigen[0].n > 14 && kurz && !zeigen.includes(kurz)) zeigen.push(kurz);
  for (const t of zeigen){
    const w = woerterVon(Q[t.sure][t.vers - 1][0]).map((x, i) => i + 1 === t.wort ? '[' + x + ']' : x).join(' ');
    const de = String(Q[t.sure][t.vers - 1][1]).replace(/\s+/g, ' ');
    console.log(`${r.id} (${r.type}${r.form !== 'ar' ? ', ' + r.form : ''}) ${r.de} · ${t.wo} W${t.wort}/${t.n}${t.bereich ? ' AUSWENDIG' : ''}${t.unsicher ? ' UNSICHER' : ''} · ${r.anzahl} Verse (${r.imBereich} im Bereich) · ${t.n > 20 ? '(lang)' : w} — ${de.slice(0, 150)}`);
  }
}
console.log(`\n${ergebnis.length} Karte(n) gesucht · ${ergebnis.length - ohne} mit Vorschlag · ${ohne} ohne · davon aus seinem Bereich: ${ergebnis.filter(r => r.vorschlaege[0] && r.vorschlaege[0].bereich).length}`);
