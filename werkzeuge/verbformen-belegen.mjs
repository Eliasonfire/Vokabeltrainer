#!/usr/bin/env node
/* verbformen-belegen.mjs — der Beleg für ein Verb der Übung 17 „Verb einsetzen".
 *
 * Die Übung fragt nur Formen, die AUSGESCHRIEBEN in UEB_VERBEN (js/uebung.js)
 * stehen — eine selbst konjugierte Form wäre erfundene Grammatik (js/lernen.js,
 * Goal-Prompt E.1). Dieses Werkzeug holt für ein Verb die Konjugationstabelle
 * bei en.wiktionary.org (nur lesen, action=parse), liest die Zeile „past
 * indicative (perfect)" im Aktiv und legt die dreizehn Formen als Abzug in
 * werkzeuge/verbformen-belege.json ab. test-verb-einsetzen.mjs hält bei jedem
 * Sammellauf die Liste in der App gegen diesen Abzug UND gegen „Stamm + Endung
 * seines Lehrers" (Regel verb-madi-endungen-01, Folge 18).
 *
 * ⛔ Ein Verb kommt nur dazu, wenn sein Lehrer es in einer Folge konjugiert
 * oder aufgegeben hat (Folge 26: eine Verbliste führen). Erst hier belegen,
 * dann die Zeile in UEB_VERBEN eintragen — das Werkzeug druckt sie fertig.
 *
 * ⚠️ Die Reihenfolge der Zellen (M_ZEILE, F_ZEILE) ist an ذَهَبَ gegen die Regel
 * des Lehrers geeicht (13.10.2026): die vierte Zelle der m-Zeile ist bei
 * Wiktionary „wir beide" und gleich „wir". Baut die Seite ihre Tabelle um,
 * stimmt „Stamm + Endung" nicht mehr mit ihr überein — dann wird NICHTS
 * geschrieben (Exit 1), statt eine verschobene Spalte als Beleg abzulegen.
 * Gibt es mehrere Tabellen mit derselben Grundform (ضَرَبَ hat vier), muss die
 * Vergangenheit in allen dieselbe sein.
 *
 *   node werkzeuge/verbformen-belegen.mjs <Grundform mit Vokalzeichen> […]
 *   node werkzeuge/verbformen-belegen.mjs --liste      was im Abzug steht (ohne Netz)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ZIEL = path.join(WURZEL, 'werkzeuge', 'verbformen-belege.json');
const M_ZEILE = ['ana', 'anta', 'huwa', 'nahnu-zwei', 'antuma', 'huma-m', 'nahnu', 'antum', 'hum'];
const F_ZEILE = ['anti', 'hiya', 'huma-f', 'antunna', 'hunna'];
const REIHE = ['huwa', 'huma-m', 'hum', 'hiya', 'huma-f', 'hunna', 'anta', 'antuma', 'antum', 'anti', 'antunna', 'ana', 'nahnu'];
const ENDEN = { 'huwa':'َ', 'huma-m':'َا', 'hum':'ُوا', 'hiya':'َتْ', 'huma-f':'َتَا', 'hunna':'ْنَ', 'anta':'ْتَ', 'antuma':'ْتُمَا', 'antum':'ْتُمْ',
  'anti':'ْتِ', 'antunna':'ْتُنَّ', 'ana':'ْتُ', 'nahnu':'ْنَا' };
const N = s => String(s).normalize('NFC');
const nackt = s => String(s).replace(/<[^>]+>/g, '').trim();
const ohneZeichen = s => N(s).replace(/[ً-ْٰـ]/g, '');
const warte = ms => new Promise(r => setTimeout(r, ms));

const bestand = fs.existsSync(ZIEL) ? JSON.parse(fs.readFileSync(ZIEL, 'utf8')) : { quelle: '', verben: {} };
const args = process.argv.slice(2);
if (!args.length || args.includes('--liste')){
  for (const [g, v] of Object.entries(bestand.verben)) console.log(`${g}  Stand ${v.revid} · geholt ${String(v.geholt).slice(0, 10)} · ${REIHE.map(p => v.formen[p].join('/')).join(' ')}`);
  console.log(`${Object.keys(bestand.verben).length} Verben im Abzug.` + (args.length ? '' : '  Neues Verb: node werkzeuge/verbformen-belegen.mjs <Grundform mit Vokalzeichen>'));
  process.exit(0);
}

async function seite(titel){
  const url = 'https://en.wiktionary.org/w/api.php?action=parse&format=json&formatversion=2&prop=text|revid&redirects=1&page=' + encodeURIComponent(titel);
  for (let versuch = 1; versuch <= 4; versuch++){
    await warte(versuch === 1 ? 2500 : 15000 * versuch);   // die Seite bremst nach wenigen schnellen Abrufen
    const r = await fetch(url, { headers: { 'User-Agent': 'vokabeltrainer-beleg/1.0 (privat, nur lesen)' } });
    const text = await r.text();
    try { const j = JSON.parse(text); return j.error ? { fehler: j.error.info } : { revid: j.parse.revid, html: j.parse.text }; }
    catch (e){ console.log(`   ${titel}: Versuch ${versuch} — HTTP ${r.status}, keine JSON-Antwort`); }
  }
  return { fehler: 'keine Antwort nach vier Versuchen' };
}

let rot = 0, neu = 0;
for (const roh of args){
  const grund = N(roh);
  if (!/َ$/.test(grund)){ console.log(`${grund}: die Grundform muss auf Fatḥa enden (er-Form der Vergangenheit, mit allen Vokalzeichen)`); rot++; continue; }
  const s = await seite(ohneZeichen(grund));
  if (s.fehler){ console.log(`${grund}: ${s.fehler}`); rot++; continue; }
  const passt = (s.html.match(/<table class="inflection-table">[\s\S]*?<\/table>/g) || []).filter(tb => {
    const cap = (/<caption[\s\S]*?<\/caption>/.exec(tb) || [''])[0];
    return N(nackt((/<strong class="selflink">([\s\S]*?)<\/strong>/.exec(cap) || [])[1] || '')) === grund && /\(I,/.test(nackt(cap));
  });
  if (!passt.length){ console.log(`${grund}: keine Tabelle des Grundstamms (Form I) mit genau dieser Grundform`); rot++; continue; }
  const lies = tb => {
    const zz = tb.match(/<tr[\s\S]*?<\/tr>/g) || [];
    const k = zz.findIndex(z => /past indicative/.test(z));                 // die ERSTE: Aktiv steht vor Passiv
    const aktiv = k >= 0 && zz.slice(0, k).some(z => /active voice/i.test(z)) && !zz.slice(0, k).some(z => /passive voice/i.test(z));
    const zellen = z => (String(z || '').match(/<td[\s\S]*?<\/td>/g) || []).map(c =>
      [...new Set((c.match(/<span class="Arab[^"]*" lang="ar">[\s\S]*?<\/span>/g) || []).map(x => N(nackt(x))))]);
    return { aktiv, m: zellen(zz[k]), f: zellen(zz[k + 1]) };
  };
  const gelesen = passt.map(lies);
  if (new Set(gelesen.map(g => JSON.stringify([g.m, g.f]))).size !== 1){ console.log(`${grund}: ${passt.length} Tabellen mit verschiedenen Vergangenheiten — nicht eindeutig`); rot++; continue; }
  const { aktiv, m, f } = gelesen[0];
  const formen = {};
  M_ZEILE.forEach((p, k) => { formen[p] = m[k] || []; });
  F_ZEILE.forEach((p, k) => { formen[p] = f[k] || []; });
  const stamm = grund.replace(/َ$/, '');
  const abweichung = REIHE.filter(p => !(formen[p].length === 1 && formen[p][0] === N(stamm + ENDEN[p])));
  if (!aktiv || m.length !== 9 || f.length !== 5 || abweichung.length){
    console.log(`${grund}: die Tabelle passt nicht zu „Stamm + Endung" (Zellen ${m.length}+${f.length}, Aktiv zuerst: ${aktiv ? 'ja' : 'nein'}` + (abweichung.length ? `, abweichend: ${abweichung.map(p => p + ' ' + JSON.stringify(formen[p])).join(' · ')}` : '') + ') — nichts geschrieben. Unregelmäßiges Verb, oder die Seite ist umgebaut.');
    rot++; continue;
  }
  bestand.verben[grund] = { titel: ohneZeichen(grund), revid: s.revid, geholt: new Date().toISOString(), tabellenMitDieserGrundform: passt.length,
    formen: Object.fromEntries(REIHE.map(p => [p, formen[p]])) };
  neu++;
  console.log(`${grund}: 13 von 13 Formen wie nach der Regel (Stand ${s.revid}). Zeile für UEB_VERBEN:`);
  console.log(`  { de:'…', folge:'Folge …', formen:'${REIHE.map(p => formen[p][0]).join(' ')}' },`);
}
if (neu){
  bestand.quelle = 'en.wiktionary.org (action=parse), Konjugationstabelle Form I, Zeile „past indicative (perfect)", Aktiv';
  fs.writeFileSync(ZIEL + '.neu', JSON.stringify(bestand, null, 1));
  fs.renameSync(ZIEL + '.neu', ZIEL);
}
process.exit(rot ? 1 : 0);
