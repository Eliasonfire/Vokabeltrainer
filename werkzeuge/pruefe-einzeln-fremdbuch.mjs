#!/usr/bin/env node
/* pruefe-einzeln-fremdbuch.mjs — ein einzeln freigeschaltetes Wort aus einem Buch, das er NICHT gewählt hat
 * ==========================================================================
 *
 *   node werkzeuge/pruefe-einzeln-fremdbuch.mjs      Exit 0 = hält · 1 = Befund oder Störtest wirkungslos
 *
 * ⛔⛔ DIE SÄTZE, DIE DIESER PRÜFER BEWACHT — Elias in der Nacht auf den 20.10.2026,
 * je mit einem Bild aus seinem Buch:
 *
 *   01:56  „ich brauche daifun also schwach als vokabel"
 *   02:09  „spielplatz also al mulab brauche ich auch als vokabel."
 *
 * Beide Karten gibt es — ḍaʿīf (46549) in Bayna Yadayk 2, Kapitel 2, malʿab (50339) in
 * Madina 2, Kapitel 32 —, aber keines der beiden Bücher hat er gewählt. Die App lud bis
 * dahin nur die gewählten Bücher; die Freischaltung (FREISCHALTEN_AUF_WUNSCH in js/kern.js)
 * war gespeichert und wirkte nicht. Seitdem lädt einzelneAusAnderenBuechern() (js/buecher.js)
 * beim Start genau diese Wörter nach. Und sein Satz vom 20.08.2026 gilt weiter: „ich möchte
 * aber nur die vereinzelnen wörter haben ohne den rest des kapitels zu haben".
 *
 * Gefahren wird der ECHTE Quelltext — einzelneAusAnderenBuechern(), buchVokabeln() und
 * kapitelDesBuchs() aus js/buecher.js, bauePluralKarte() aus js/kern.js — gegen Probebücher:
 *   E1  nur das freigeschaltete Wort kommt, nicht der Rest seines Buchs; mit der Marke einzelnGeladen
 *   E2  fehlt nichts, wird kein Buch geladen; ein zurückgenommenes Wort (an:false) kommt nicht
 *   E3  Kennungen, die keine Buchkennung sind (…#pl, p_…), lösen kein Laden aus
 *   E4  sind alle gefunden, wird kein weiteres Buch geladen
 *   E5  buchVokabeln() führt das Wort (Kategorien, Hörmodus, Statistik); kapitelDesBuchs() zeigt
 *       für sein Buch weiter die Vorschau aller Kapitel, nicht nur dessen Kapitel
 *   E6  seine Mehrzahlkarte trägt die Marke mit
 *   E7  beim Start: nach den gewählten Büchern, VOR seinen Korrekturen, den Mehrzahlkarten und
 *       dem Fortschritt — sonst bekäme das Wort keine Änderung, keine Mehrzahl, keinen Kasten
 *   E8  seine zwei Wörter stehen in FREISCHALTEN_AUF_WUNSCH und in einer Buchdatei (nur lokal)
 *   S   Störtests: der Quelltext wird verändert, der zuständige Fall MUSS scheitern
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lies = p => fs.readFileSync(path.join(REPO, p), 'utf8');
const BUECHER_JS = lies('js/buecher.js'), KERN = lies('js/kern.js');

function schneideFunktion(quelle, kopf){
  const a = quelle.indexOf(kopf);
  if (a < 0) throw new Error('nicht gefunden im Quelltext: ' + kopf);
  let tiefe = 0;
  for (let i = quelle.indexOf('{', a); i >= 0 && i < quelle.length; i++){
    if (quelle[i] === '{') tiefe++;
    else if (quelle[i] === '}'){ tiefe--; if (!tiefe) return quelle.slice(a, i + 1); }
  }
  throw new Error('kein Ende gefunden: ' + kopf);
}
const zeile = (quelle, anfang) => { const a = quelle.indexOf(anfang); if (a < 0) throw new Error('nicht gefunden: ' + anfang); return quelle.slice(a, quelle.indexOf('\n', a)); };

/* Probebücher: m1 ist gewählt, b2/m2/b3 nicht. Reihenfolge wie im Verzeichnis. */
const BUECHER = {
  /* „Haus", nicht „eins": ein Zahlwort bekommt keine Mehrzahlkarte (istZahlwort), dann prüfte E6 nichts. */
  m1: [{ id: '1', book: 'm1', chapter: 1, ar: 'a', de: 'Haus', pl: 'aa' }],
  b2: [{ id: '46549', book: 'b2', chapter: 2, ar: 'x', de: 'schwach', pl: 'xx' }, { id: '46550', book: 'b2', chapter: 2, ar: 'y', de: 'Programm', pl: 'yy' }],
  m2: [{ id: '50339', book: 'm2', chapter: 32, ar: 'z', de: 'Spielplatz', pl: 'zz' }],
  b3: [{ id: '9', book: 'b3', chapter: 1, ar: 'w', de: 'neun' }],
};

async function welt(q, einzeln){
  const ctx = { console: { log(){}, warn(){}, error(){} }, __DATEN: BUECHER };
  vm.createContext(ctx);
  vm.runInContext(`
    let VOCAB_DATA = ${JSON.stringify(BUECHER.m1)};
    let EINZELN = ${JSON.stringify(einzeln)};
    const BUECHER = ${JSON.stringify(Object.keys(BUECHER).map(slug => ({ slug, kapitel: 9 })))};
    const KORAN_BUCH = 'koran-haeufig';
    const BUCHDUBLETTEN_AUSBLENDEN = new Set(['45984']);
    const GELADENE_BUECHER = new Set(['m1']);
    const BUCH_FEHLT = new Set();
    const __geladen = [], __nach = { esels: 0, saetze: 0, ersetzen: 0, schreib: 0 };
    function aktiveBuecher(){ return ['m1']; }
    function aktivesBuch(){ return 'm1'; }
    function buchInfo(s){ return BUECHER.find(b => b.slug === s) || null; }
    async function ladeBuchDatei(s){ __geladen.push(s); const l = __DATEN[s]; if (!l) throw new Error('fehlt'); return l; }
    function eselsbrueckenNachtragen(l){ __nach.esels += l.length; return 0; }
    function eselsbrueckenErsetzen(){ __nach.ersetzen++; }
    function schreibweisenErsetzen(){ __nach.schreib++; }
    function saetzeNachtragen(l){ __nach.saetze += l.length; return 0; }
  ` + [schneideFunktion(q.buecher, 'async function einzelneAusAnderenBuechern('), schneideFunktion(q.buecher, 'function buchVokabeln('),
    schneideFunktion(q.buecher, 'function kapitelDesBuchs('), zeile(q.kern, 'const ZAHLWORT_DE = '), schneideFunktion(q.kern, 'function istZahlwort('),
    zeile(q.kern, 'const PLURAL_MARKE = '), schneideFunktion(q.kern, 'function istPluralKarte('), schneideFunktion(q.kern, 'function bauePluralKarte(')].join('\n'), ctx);
  const n = await vm.runInContext('einzelneAusAnderenBuechern()', ctx);
  const hole = c => vm.runInContext(c, ctx);
  return { n, hole, ids: hole('VOCAB_DATA.map(w => w.id)'), geladen: hole('__geladen.slice()'), nach: hole('({...__nach})') };
}

async function laufe(q){
  const erg = new Map();
  const fall = async (name, fn) => { let r; try { r = await fn(); } catch (e){ r = 'wirft: ' + e.message; } erg.set(name, { ok: r === true, zusatz: r === true ? '' : String(r) }); };
  const BEIDE = { '46549': { an: true, zeit: 1 }, '50339': { an: true, zeit: 2 } };

  await fall('E1 Nur die freigeschalteten Wörter kommen, nicht der Rest ihres Buchs — mit der Marke einzelnGeladen und derselben Nachbearbeitung wie ein Buch', async () => {
    const w = await welt(q, BEIDE);
    if (w.n !== 2 || !w.ids.includes('46549') || !w.ids.includes('50339')) return 'eingehängt: ' + w.n + ' · ' + w.ids.join(',');
    if (w.ids.includes('46550')) return 'der Rest des Buchs kam mit (46550) — „ohne den rest des kapitels zu haben"';
    if (!w.hole("VOCAB_DATA.filter(x => x.id === '46549' || x.id === '50339').every(x => x.einzelnGeladen === true)")) return 'die Marke einzelnGeladen fehlt';
    if (w.hole("VOCAB_DATA.find(x => x.id === '1').einzelnGeladen")) return 'ein Wort aus einem gewählten Buch trägt die Marke';
    return w.nach.esels === 2 && w.nach.saetze === 2 && w.nach.ersetzen === 1 && w.nach.schreib === 1 ? true : 'Nachbearbeitung: ' + JSON.stringify(w.nach);
  });
  await fall('E2 Fehlt nichts, wird kein Buch geladen — auch nicht für ein zurückgenommenes (an:false) oder ein schon vorhandenes Wort', async () => {
    for (const einzeln of [{}, { '46549': { an: false, zeit: 1 } }, { '1': { an: true, zeit: 1 } }]){
      const w = await welt(q, einzeln);
      if (w.geladen.length || w.n) return JSON.stringify(einzeln) + ' lud ' + w.geladen.join(',') + ' und hängte ' + w.n + ' ein';
    }
    return true;
  });
  await fall('E3 Kennungen, die keine Buchkennung sind (…#pl, p_…), lösen kein Laden aus', async () => {
    const w = await welt(q, { '46549#pl': { an: true, zeit: 1 }, 'p_123': { an: true, zeit: 1 } });
    return !w.geladen.length ? true : 'geladen: ' + w.geladen.join(',');
  });
  await fall('E4 Sind alle gefunden, wird kein weiteres Buch geladen', async () => {
    const eins = await welt(q, { '46549': { an: true, zeit: 1 } });
    if (eins.geladen.join(',') !== 'b2') return 'für ein Wort aus b2 geladen: ' + eins.geladen.join(',');
    const beide = await welt(q, BEIDE);
    return beide.geladen.join(',') === 'b2,m2' ? true : 'für b2 und m2 geladen: ' + beide.geladen.join(',');
  });
  await fall('E5 buchVokabeln() führt das Wort; kapitelDesBuchs() zeigt für sein Buch weiter alle Kapitel, nicht nur dessen Kapitel', async () => {
    const w = await welt(q, BEIDE);
    const ids = w.hole('buchVokabeln().map(x => x.id)');
    if (!ids.includes('46549') || !ids.includes('50339')) return 'buchVokabeln(): ' + ids.join(',');
    const k = w.hole("kapitelDesBuchs('b2').length + '/' + kapitelDesBuchs('m2').length");
    return k === '9/9' ? true : 'Kapitelvorschau b2/m2: ' + k + ' (erwartet 9/9)';
  });
  await fall('E6 Die Mehrzahlkarte eines solchen Worts trägt die Marke mit, die eines gewöhnlichen nicht', async () => {
    const w = await welt(q, BEIDE);
    const pk = w.hole("JSON.stringify(bauePluralKarte(VOCAB_DATA.find(x => x.id === '46549')))");
    const gew = w.hole("JSON.stringify(bauePluralKarte(VOCAB_DATA.find(x => x.id === '1')))");
    if (!JSON.parse(pk).einzelnGeladen) return 'Mehrzahlkarte ohne Marke: ' + pk;
    return !('einzelnGeladen' in JSON.parse(gew)) ? true : 'eine gewöhnliche Mehrzahlkarte trägt die Marke: ' + gew;
  });
  await fall('E7 Beim Start nach den gewählten Büchern und VOR Korrekturen, Mehrzahlkarten und Fortschritt', async () => {
    const b = q.buecher, ruf = b.indexOf('  await einzelneAusAnderenBuechern();');
    if (ruf < 0) return 'der Aufruf fehlt';
    const vor = b.indexOf('for (const s of slugs) await setzeBuch(s, true);');
    const nach = ["wendeFeldErgaenzungenAn(VOCAB_DATA);", 'wendeWortAenderungenAn();', 'wendePluralKartenAn(pluralKartenStufe(SETTINGS));', 'ergaenzeProgress();']
      .map(t => [t, b.indexOf(t, vor)]);
    if (vor < 0 || ruf < vor) return 'der Aufruf steht nicht hinter dem Laden der gewählten Bücher';
    const zuFrueh = nach.filter(([, i]) => i < 0 || i < ruf).map(([t]) => t);
    return zuFrueh.length ? 'steht nicht vor: ' + zuFrueh.join(' · ') : true;
  });
  return erg;
}

let fehler = 0;
const sag = (ok, text) => { if (!ok) fehler++; console.log((ok ? '  ok   ' : '  FEHL ') + text); };
const ECHT = { buecher: BUECHER_JS, kern: KERN };

console.log('=== Einzeln freigeschaltete Wörter aus nicht gewählten Büchern (Elias, 20.10.2026) ===');
const erg = await laufe(ECHT);
for (const [name, e] of erg) sag(e.ok, name + (e.zusatz ? '  -> ' + e.zusatz : ''));

console.log('\n=== E8 Seine zwei Wörter (nur lokal: die Buchdateien liegen nicht im Repo) ===');
{
  const m = KERN.match(/const FREISCHALTEN_AUF_WUNSCH\s*=\s*\[([^\]]*)\]/);
  const liste = m ? (m[1].match(/'[^']+'|"[^"]+"/g) || []).map(s => s.slice(1, -1)) : [];
  sag(liste.includes('46549') && liste.includes('50339'), 'FREISCHALTEN_AUF_WUNSCH enthält 46549 (ḍaʿīf, „schwach") und 50339 (malʿab, „Spielplatz")');
  const dateien = fs.existsSync(path.join(REPO, 'data')) ? fs.readdirSync(path.join(REPO, 'data')).filter(f => /^vokabeln-.*\.js$/.test(f)) : [];
  if (!dateien.length) console.log('  ⓘ    nicht messbar: keine Buchdateien in data/');
  else {
    const ctx = { window: { VOKABELN: {} } }; ctx.globalThis = ctx; vm.createContext(ctx);
    for (const f of dateien) vm.runInContext(fs.readFileSync(path.join(REPO, 'data', f), 'utf8'), ctx);
    const wo = {};
    for (const [buch, l] of Object.entries(ctx.window.VOKABELN)) for (const w of l) wo[String(w.id)] = buch;
    const ohne = liste.filter(id => !wo[id]);
    sag(!ohne.length, 'jede Kennung aus FREISCHALTEN_AUF_WUNSCH steht in einer Buchdatei' + (ohne.length ? ' — fehlt: ' + ohne.join(', ') : ''));
    console.log('  ⓘ    46549 → ' + (wo['46549'] || '—') + ' · 50339 → ' + (wo['50339'] || '—'));
  }
}

function ersetze(quelle, alt, neu, wo){
  const n = quelle.split(alt).length - 1;
  if (n !== 1) throw new Error('Störtest „' + wo + '": die Stelle kommt ' + n + '-mal vor (erwartet 1)');
  return quelle.replace(alt, () => neu);
}
const STOER = [
  { name: 'S1 das ganze Buch kommt mit', muss: ['E1'],
    buecher: q => ersetze(q, '      if (!fehlen.has(id) || BUCHDUBLETTEN_AUSBLENDEN.has(id)) return;', '      if (BUCHDUBLETTEN_AUSBLENDEN.has(id)) return;', 'S1') },
  { name: 'S2 die Marke einzelnGeladen fehlt', muss: ['E1', 'E5'],
    buecher: q => ersetze(q, '{ einzelnGeladen: true })));', '{})));', 'S2') },
  { name: 'S3 auch Kennungen ohne Ziffern lösen das Laden aus', muss: ['E3'],
    buecher: q => ersetze(q, '/^\\d+$/.test(id) && ', '', 'S3') },
  { name: 'S4 es wird weitergeladen, obwohl alles gefunden ist', muss: ['E4'],
    buecher: q => ersetze(q, '    if (!fehlen.size) break;\n', '', 'S4') },
  { name: 'S5 buchVokabeln() lässt das Wort draußen', muss: ['E5'],
    buecher: q => ersetze(q, "\n                             || w.einzelnGeladen === true);", ');', 'S5') },
  { name: 'S6 die Kapitelvorschau zählt das einzelne Wort mit', muss: ['E5'],
    buecher: q => ersetze(q, " && !w.einzelnGeladen)\n", ")\n", 'S6') },
  { name: 'S7 die Mehrzahlkarte verliert die Marke', muss: ['E6'],
    kern: q => ersetze(q, '    ...(w.einzelnGeladen === true ? { einzelnGeladen: true } : {})\n', '', 'S7') },
  { name: 'S8 der Aufruf beim Start fehlt', muss: ['E7'],
    buecher: q => ersetze(q, '  await einzelneAusAnderenBuechern();\n', '', 'S8') },
];
console.log('\n=== S  Störtests: ohne die Regel MUSS der zuständige Fall scheitern ===');
for (const s of STOER){
  let e;
  try { e = await laufe({ buecher: s.buecher ? s.buecher(BUECHER_JS) : BUECHER_JS, kern: s.kern ? s.kern(KERN) : KERN }); }
  catch (err){ fehler++; console.log('  FEHL ' + s.name + '  -> ' + err.message); continue; }
  const gescheitert = [...e].filter(([, v]) => !v.ok).map(([n]) => n.split(' ')[0]);
  const fehlt = s.muss.filter(k => !gescheitert.includes(k));
  if (fehlt.length){ fehler++; console.log('  FEHL ' + s.name + '  -> ' + fehlt.join(', ') + ' blieb grün (gescheitert: ' + (gescheitert.join(', ') || 'nichts') + ')'); }
  else console.log('  ok   ' + s.name + '  -> scheitert wie verlangt: ' + gescheitert.join(', '));
}

console.log('\n' + (fehler ? '⛔ ' + fehler + ' Befund(e).' : '✅ Einzeln freigeschaltete Wörter aus nicht gewählten Büchern kommen an — nur sie, mit Marke, Mehrzahl und Kasten. ' + erg.size + ' Fälle, ' + STOER.length + ' Störtests.'));
process.exit(fehler ? 1 : 0);
