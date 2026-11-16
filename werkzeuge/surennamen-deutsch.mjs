#!/usr/bin/env node
/* surennamen-deutsch.mjs — deutsche Bedeutung der Surennamen (17.11.2026)
 * ==========================================================================
 *
 *   node werkzeuge/surennamen-deutsch.mjs          nur anzeigen (nichts schreiben)
 *   node werkzeuge/surennamen-deutsch.mjs --json     als JSON ausgeben
 *
 * Elias (Eingang, 16.11.2026): „bei jeder Sure (114 Suren) neben dem Titel auch die Bedeutung des
 * Titels anzeigen" · „Quelle der Bedeutungen vorher klären, nichts frei erfinden."
 *
 * Quelle: deutsche Wikipedia, „Liste der Koransuren", Spalte „deutsch" (CC BY-SA 4.0). quran.com,
 * die Quelle von surah-data.js, hat keine deutschen Namen (gemessen 17.11.2026: language=de liefert
 * bei 114 von 114 die englischen). Genommen wird die ERSTE Bedeutung der Zelle (vor dem ersten
 * Zeilenumbruch); Nebennamen und Erläuterungen in <small> fallen weg.
 * Prüft: 114 Zeilen, Nummern 1–114 lückenlos, die arabische Schreibung je Zeile passt (ohne
 * Vokalzeichen) zu `ar` in surah-data.js.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const WURZEL = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const URL_WP = 'https://de.wikipedia.org/w/api.php?action=parse&page=Liste_der_Koransuren&prop=wikitext&format=json';

const antwort = await fetch(URL_WP, { headers: { 'User-Agent': 'vokabeltrainer-werkzeug/1.0' } });
if (!antwort.ok) { console.log('⛔ Wikipedia antwortet ' + antwort.status); process.exit(1); }
const text = (await antwort.json()).parse.wikitext['*'];

const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(WURZEL, 'surah-data.js'), 'utf8') + '\nglobalThis.S = SURAH_DATA;', ctx);
const SURAH = ctx.S;

const ohneVokale = s => String(s || '').normalize('NFC').replace(/[ً-ٰٟۖ-ۭـ]/g, '')
  .replace(/[أإآٱ]/g, 'ا').replace(/\s+/g, ' ').trim();
const sauber = s => String(s || '')
  .replace(/<ref[^>]*\/>/g, '').replace(/<ref[\s\S]*?<\/ref>/g, '')
  .split(/<br\s*\/?>/i)[0]
  .replace(/<small>[\s\S]*?(<\/small>|$)/gi, '')
  .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1')
  .replace(/''+/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').replace(/[,;]\s*$/, '').trim();

const tabelle = text.slice(text.indexOf('{|'), text.indexOf('|}'));
const zeilen = tabelle.split(/\n\|-/).slice(1).map(z => z.split('\n').filter(l => l.startsWith('|')).map(l => l.replace(/^\|(align="right"\|)?/, '')));
const raus = [], befunde = [];
for (const z of zeilen) {
  const nr = Number(z[0]);
  const s = SURAH.find(x => x.id === nr);
  const de = sauber(z[3]);
  const arWp = ohneVokale(String(z[2] || '').split(/<br\s*\/?>/i)[0].replace(/<[^>]*>/g, '').replace(/‎/g, ''));
  if (!s) { befunde.push('Nr. ' + z[0] + ' nicht in surah-data.js'); continue; }
  if (!de) befunde.push(nr + ': keine deutsche Bedeutung');
  if (arWp !== ohneVokale(s.ar)) befunde.push(nr + ': arabisch ' + arWp + ' ≠ ' + ohneVokale(s.ar) + ' (nur Hinweis)');
  raus.push({ id: nr, name: s.name, ar: s.ar, de });
}
const nummern = raus.map(r => r.id).join(',');
if (raus.length !== 114 || nummern !== Array.from({ length: 114 }, (_, i) => i + 1).join(','))
  befunde.unshift('⛔ nicht 114 lückenlose Zeilen: ' + raus.length);

if (process.argv.includes('--json')) { console.log(JSON.stringify(raus, null, 1)); }
else for (const r of raus) console.log(String(r.id).padStart(3) + '  ' + r.name.padEnd(16) + ' ' + r.de);
console.log('\n' + raus.length + ' Bedeutungen · ' + befunde.length + ' Hinweise');
for (const b of befunde) console.log('  ' + b);
/* exitCode statt process.exit(): nach fetch() bricht Node unter Windows sonst mit einer
   libuv-Assertion ab und meldet 127 (gemessen 17.11.2026). */
process.exitCode = befunde.some(b => b.startsWith('⛔') || /keine deutsche/.test(b)) ? 1 : 0;
