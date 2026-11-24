
/* test-wochen-balken.mjs — Wochen-Balken statt Übungskalender, und das Logo mittig (23.11.2026).
   Elias, mit einem Bild (sieben Balken, gestrichelte Ziellinie, „Heute: 13 von 10“, „Serie: 52 Tage · Rekord 67“):
   „ich finde statt dem kalender könnten wir sowas einbauen, ich glaube das ist besser“.
   Zum Logo: „mach die beiden zentriert, das sieht so assymetrisch aus“.
   Aus Talib übernommen am 24.11.2026; Elias zur Liste der Unterschiede: „… statistik … sollst du übernehmen“.

   renderUebungskalender() wird aus js/statistik.js GESCHNITTEN und ausgeführt, nicht nachgebaut.
   Störprobe: node test-wochen-balken.mjs <statistik.js> <index.html> */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const W = path.dirname(fileURLToPath(import.meta.url));
const lies = (i, rel) => fs.readFileSync(process.argv[i] || path.join(W, rel), 'utf8');
const stat = lies(2, 'js/statistik.js'), html = lies(3, 'index.html');

let ok = 0, schlecht = 0;
const pruefe = (was, b, gemessen) => {
  if (b) { ok++; console.log('  ✔ ' + was); } else { schlecht++; console.log('  ✘ ' + was + '   gemessen: ' + gemessen); }
};
function schneide(text, name){
  const a = text.indexOf('function ' + name + '(');
  if (a < 0) return null;
  let i = text.indexOf('{', a), t = 0;
  for (; i < text.length; i++){ if (text[i] === '{') t++; else if (text[i] === '}'){ t--; if (!t) return text.slice(a, i + 1); } }
  return null;
}

console.log('test-wochen-balken.mjs — Tagesziel als Wochen-Balken\n');

const HEUTE = '2026-11-23';   // ein Montag
const tagVon = off => new Date(Date.parse(HEUTE + 'T12:00:00Z') + off * 86400000).toISOString().slice(0, 10);
const quelle = schneide(stat, 'renderUebungskalender');
pruefe('renderUebungskalender() steht in js/statistik.js', !!quelle, 'fehlt');

function lauf(tage, { ziel = 10, serie = 0 } = {}){
  const kasten = { innerHTML: '' };
  const c = { document: { getElementById: id => id === 'uebungskalender' ? kasten : null },
    getUebungstage: () => tage, todayStr: off => tagVon(off || 0), tagesDeckel: () => ziel,
    getStreak: () => ({ count: serie }), Math, Number, Date, Object };
  vm.createContext(c);
  vm.runInContext(quelle + '\nrenderUebungskalender();', c);
  const h = kasten.innerHTML;
  const tasten = [...h.matchAll(/<button class="([^"]*)" data-kaltag="([^"]*)"[^>]*><span class="wz-spur"><span class="wz-saeule" style="height:([\d.]+)%"><\/span><\/span><span class="wz-name">([^<]*)<\/span><\/button>/g)]
    .map(m => ({ klasse: m[1], tag: m[2], hoehe: Number(m[3]), name: m[4] }));
  const anzahl = tasten.length;
  while (tasten.length < 7) tasten.push({ klasse: '', tag: '', hoehe: -1, name: '' });   // kein Absturz, wenn Balken fehlen
  return { h, tasten, anzahl, ziel: Number((h.match(/--ziel:([\d.]+)/) || [])[1]) };
}

if (quelle){
  const tage = { [tagVon(-6)]: 12, [tagVon(-5)]: 9, [tagVon(-4)]: 8, [tagVon(-3)]: 0, [tagVon(-1)]: 10, [HEUTE]: 13 };
  for (let i = 7; i < 74; i++) tage[tagVon(-i - 30)] = 5;   // eine alte Serie von 67 Tagen
  const a = lauf(tage, { serie: 52 });
  pruefe('sieben Balken, die letzten sieben Tage bis heute', a.anzahl === 7 && a.tasten[0].tag === tagVon(-6) && a.tasten[6].tag === HEUTE,
    a.tasten.map(t => t.tag).join());
  pruefe('Namen: Wochentage, der letzte heißt „Heute“', a.tasten.map(t => t.name).join() === 'Di,Mi,Do,Fr,Sa,So,Heute', a.tasten.map(t => t.name).join());
  pruefe('Kopf: „Heute: 13 von 10“, als erreicht markiert', /<div class="wz-kopf wz-erreicht">Heute: 13 von 10<\/div>/.test(a.h), a.h.slice(0, 120));
  pruefe('erreichte Tage (12, 10, 13) sind voll, die anderen nicht',
    a.tasten.filter(t => /wz-voll/.test(t.klasse)).map(t => t.tag).join() === [tagVon(-6), tagVon(-1), HEUTE].join(), a.tasten.map(t => t.klasse).join('|'));
  pruefe('heute ist hervorgehoben, sonst kein Tag', a.tasten.filter(t => /wz-heute/.test(t.klasse)).length === 1 && /wz-heute/.test(a.tasten[6].klasse), '');
  pruefe('Höhe nach Karten: 13 ist der höchste Balken (100 %), 9 entsprechend kleiner',
    a.tasten[6].hoehe === 100 && Math.abs(a.tasten[1].hoehe - 9 / 13 * 100) < 0.2, a.tasten.map(t => t.hoehe).join());
  pruefe('Ziellinie auf Höhe des Tagesziels (10 von 13)', Math.abs(a.ziel - 10 / 13) < 0.002, a.ziel);
  pruefe('nicht geübt (Sa): kein Balken', a.tasten[4].hoehe === 0 && !/wz-unbekannt/.test(a.tasten[4].klasse), JSON.stringify(a.tasten[4]));
  pruefe('geübt, Zahl unbekannt (Fr, Wert 0): kleiner Balken mit Rand', a.tasten[3].hoehe === 4 && /wz-unbekannt/.test(a.tasten[3].klasse), JSON.stringify(a.tasten[3]));
  pruefe('Fuß: „Serie: 52 Tage · Rekord 67“', a.h.includes('Serie: 52 Tage · Rekord 67'), (a.h.match(/Serie:[^<]*/) || [])[0]);
  const b = lauf({ [HEUTE]: 3 }, { serie: 1 });
  pruefe('wenig geübt: die Skala reicht bis über das Ziel, Linie bei 80 %', Math.abs(b.ziel - 0.8) < 0.002, b.ziel);
  pruefe('Serie 1: „Serie: 1 Tag · Rekord 1“, Kopf nicht als erreicht', b.h.includes('Serie: 1 Tag · Rekord 1') && /<div class="wz-kopf">Heute: 3 von 10/.test(b.h), b.h.slice(0, 200));
  const c = lauf({}, { serie: 0 });
  pruefe('noch nie geübt: Hinweis, dass sich die Balken füllen', c.h.includes('Die Balken füllen sich') && c.tasten.every(t => t.hoehe === 0), '');
  pruefe('kein Kalender-Gitter mehr', !/kal-gitter|kal-zelle/.test(a.h + stat), 'gefunden');
}

/* ---------- index.html ---------- */
pruefe('Überschrift „Tagesziel“ direkt über dem Kasten', /<h3 class="stats-titel">Tagesziel<\/h3>\s*<div class="uebungskalender" id="uebungskalender">/.test(html), 'fehlt');
const block = (html.match(/Stil-Schicht · Wochen-Balken[\s\S]*?(?=\/\* -----|<\/style>)/) || [''])[0];
pruefe('Stil-Schicht „Wochen-Balken“: gestrichelte Linie und sieben Spalten', /\.wz-linie\{[^}]*dashed/.test(block) && /repeat\(7,1fr\)/.test(block), 'fehlt');
/* Vokabeltrainer (24.11.2026, aus Talib übernommen): kein Hell-Modus (Elias: „brauch ich nicht“), darum hier
   statt der Hell-Farben der Fall „Karten pro Tag aus“, den es in Talib nicht gibt; das Logo steht hier im Block
   „Stil-Schicht · Form“, mit der Marke selbst (VOKABELTRAINER ist breiter als sie). */
if (quelle){
  const d = lauf({ [HEUTE]: 7, [tagVon(-1)]: 14 }, { ziel: 0, serie: 2 });
  pruefe('ohne Tagesziel (0): keine Linie, kein „von 0“, kein Tag als voll, Höhen sind Zahlen',
    !/wz-linie/.test(d.h) && /<div class="wz-kopf">Heute: 7 Karten<\/div>/.test(d.h) && !d.tasten.some(t => /wz-voll/.test(t.klasse))
    && d.tasten[5].hoehe === 100 && Math.abs(d.tasten[6].hoehe - 50) < 0.2, d.h.slice(0, 160) + ' | ' + d.tasten.map(t => t.hoehe).join());
  const e = lauf({ [HEUTE]: 0 }, { ziel: 0, serie: 1 });
  pruefe('ohne Tagesziel und nur ein erschlossener Tag: kein Teilen durch 0 (Balken 4 %)', e.tasten[6].hoehe === 4, e.h.slice(0, 400));
}
const logo = (html.match(/Stil-Schicht · Form[\s\S]*?(?=\/\* -----|<\/style>)/) || [''])[0];
pruefe('Logo: Marke und VOKABELTRAINER mittig übereinander', /\.brand\{align-items:center;\}/.test(logo) && /\.brand-de\{padding-left:\.1em;\}/.test(logo) && /\.brand-mark\{align-self:center;\}/.test(logo), 'fehlt');

console.log('\n' + (schlecht ? '✘ ' : '✔ ') + ok + ' bestanden, ' + schlecht + ' gescheitert');
process.exit(schlecht ? 1 : 0);
