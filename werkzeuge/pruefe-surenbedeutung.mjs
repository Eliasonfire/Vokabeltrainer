#!/usr/bin/env node
/* pruefe-surenbedeutung.mjs — jede Sure hat ihre deutsche Bedeutung, und die App zeigt sie (17.11.2026)
 * ==========================================================================
 *
 *   node werkzeuge/pruefe-surenbedeutung.mjs        Exit 0 = grün, 1 = Befund
 *
 * Elias (Eingang, 16.11.2026): „bei jeder Sure (114 Suren) neben dem Titel auch die Bedeutung des
 * Titels" · „Anzeige überall, wo Suren-Titel auftauchen: Suren-Liste und Ansicht innerhalb einer
 * Sure" · auf die Quellenfrage (17.11.2026): „Ja, Wikipedia".
 *   B1  114 Suren, jede mit nicht leerem Feld `de` (eingetragen von werkzeuge/surennamen-deutsch.mjs)
 *   B2  `de` ist deutsch: keine arabischen Zeichen, kein Wiki-Markup (<, [[, ''), höchstens 40 Zeichen
 *   B3  feste Fälle aus der Quelle: 2 „Die Kuh", 1 „Die Eröffnung", 112 „Die Aufrichtigkeit"
 *   B4  js/quran.js liest das Feld an allen drei Stellen: Liste, Kopf der Sure (statt der Umschrift, 20.11.2026), Suche
 * Störtest: eine Bedeutung gelöscht und eine mit Markup → B1 und B2 müssen rot werden.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const WURZEL = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(WURZEL, 'surah-data.js'), 'utf8') + '\nglobalThis.S = SURAH_DATA;', ctx);
const QURAN = fs.readFileSync(path.join(WURZEL, 'js', 'quran.js'), 'utf8');

function pruefen(S) {
  const r = {};
  const ohne = S.filter(s => !String(s.de || '').trim()).map(s => s.id);
  r.B1 = { ok: S.length === 114 && !ohne.length, ist: { anzahl: S.length, ohne } };
  const schlecht = S.filter(s => s.de && (/[؀-ۿ]/.test(s.de) || /<|\[\[|''/.test(s.de) || s.de.length > 40)).map(s => s.id + ' ' + s.de);
  r.B2 = { ok: !schlecht.length, ist: schlecht };
  const de = id => (S.find(s => s.id === id) || {}).de;
  r.B3 = { ok: de(2) === 'Die Kuh' && de(1) === 'Die Eröffnung' && de(112) === 'Die Aufrichtigkeit', ist: [de(1), de(2), de(112)] };
  return r;
}

let fehler = 0;
const zeige = (name, e) => { console.log((e.ok ? '  ok ' : '  X  ') + name + (e.ok ? '' : '   ist: ' + JSON.stringify(e.ist).slice(0, 300))); if (!e.ok) fehler++; };
const echt = pruefen(ctx.S);
zeige('B1 114 Suren, jede mit Bedeutung', echt.B1);
zeige('B2 Bedeutung deutsch, ohne Markup, höchstens 40 Zeichen', echt.B2);
zeige('B3 feste Fälle (Die Eröffnung, Die Kuh, Die Aufrichtigkeit)', echt.B3);
const stellen = {
  liste: /class="sr-de">\$\{escapeHtml\(surenBedeutung\(s\)\)\}/.test(QURAN),
  /* Seit dem 20.11.2026 im Kopf an der Stelle der Umschrift, nicht mehr kursiv darunter. Elias:
     „übrigens möchte ich, dass diese deutsche umlautschrift des namens komplett wegfällt und
     stattdessen die übersetzung des namens an die stelle kommt aber nicht in kursiv sondern
     normal". Rot, wenn im Kopf wieder `surah.name` allein steht. */
  kopf: /class="qt-um">\$\{escapeHtml\(surenBedeutung\(surah\) \|\| surah\.name\)\}/.test(QURAN)
    && !/class="qt-um">\$\{escapeHtml\(surah\.name\)\}/.test(QURAN),
  suche: /surenBedeutung\(s\)\.toLowerCase\(\)\.includes\(q\)/.test(QURAN),
};
zeige('B4 js/quran.js zeigt sie in Liste, im Kopf der Sure und Suche', { ok: Object.values(stellen).every(Boolean), ist: stellen });

const gestoert = JSON.parse(JSON.stringify(ctx.S));
delete gestoert[1].de; gestoert[5].de = "[[Vieh]] ''x''";
const s = pruefen(gestoert);
const rot = !s.B1.ok && !s.B2.ok;
console.log(rot ? '  ok STÖRTEST — Bedeutung gelöscht und Markup eingesetzt: B1 und B2 rot' : '  X  STÖRTEST nicht rot');
if (!rot) fehler++;
console.log(fehler ? `X  ${fehler} Befund(e)` : '✅ Surenbedeutungen: alle 114 da und angezeigt');
process.exit(fehler ? 1 : 0);
