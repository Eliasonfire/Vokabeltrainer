#!/usr/bin/env node
/* test-satzmodus-sichtbar.mjs — zählt die Kategorien-Seite nur Sätze, die er sieht?
 * ==========================================================================
 *
 * Elias am 26.10.2026: „Ja, korrigiere die Zählung auf der Seite „Regeln nach
 * Kategorien", damit nur Sätze zählen, die ich schon sehen kann."
 *
 * Geprüft wird ohne Browser und ohne seinen Stand, mit gestellten Messungen:
 *   1  zaehleSichtbar() zählt nur sichtbare Sätze, nennt für den Rest den Grund
 *      und meldet einen markierten Satz, den die Messung nicht kennt.
 *   2  messungLesen() meldet laut, wenn die Messung fehlt, halb ist oder alt
 *      (eine Datei der App hat sich seitdem geändert).
 *   3  werkzeuge/regelkategorien-seite.mjs baut ohne Messung NICHT: Exit 1,
 *      keine Seite geschrieben.
 *   4  Der ganze Bau, zweimal: einmal ist jeder markierte Satz sichtbar, einmal
 *      fehlt einer. Die Zahl jeder Regel dieses Satzes muss um genau seine
 *      Markierungen sinken, keine andere darf sich ändern, und die Seite sagt,
 *      wovon die Zahl ausgeht.
 *      ⛔ Zählte das Werkzeug wieder alle Sätze, wären beide Zahlen gleich — rot.
 *
 * Störtest beim Einbau (26.10.2026): marken in regelkategorien-seite.mjs auf
 * „alle Sätze" gestellt → Teil 4 rot; die Prüfung auf eine fehlende Messung
 * übersprungen → Teil 3 rot. Beides zurückgenommen, dann grün.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { messungLesen, zaehleSichtbar } from './werkzeuge/satzmodus-sichtbar.mjs';

const REPO = path.dirname(fileURLToPath(import.meta.url));
const BAUER = path.join(REPO, 'werkzeuge', 'regelkategorien-seite.mjs');
let gut = 0;
const fehler = [];
const pruefe = (bed, text) => { if (bed) gut++; else fehler.push(text); };
const sha1 = p => crypto.createHash('sha1').update(fs.readFileSync(p)).digest('hex');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'satzmodus-sichtbar-'));

try {
  /* ---------- 1 ---------- */
  const tags = { a: [{ ruleId: 'r1' }, { ruleId: 'r2' }], b: [{ ruleId: 'r1' }], c: [] };
  const z = zaehleSichtbar(tags, { sichtbar: ['a'], ausgeblendet: { b: 'Karte noch nie gesehen' } });
  pruefe(z.marken.r1 === 1 && z.marken.r2 === 1 && z.stellen === 2 && z.saetze === 1,
    '1: nur der sichtbare Satz zählt (erwartet r1=1, r2=1, war ' + JSON.stringify(z.marken) + ')');
  pruefe(z.nichtGezaehlt['Karte noch nie gesehen'] && z.nichtGezaehlt['Karte noch nie gesehen'].stellen === 1,
    '1: der ausgeblendete Satz steht mit Grund und einer Stelle in nichtGezaehlt');
  pruefe(z.unbekannt.length === 0, '1: kein Satz unbekannt');
  const z2 = zaehleSichtbar(tags, { sichtbar: ['a'], ausgeblendet: {} });
  pruefe(z2.unbekannt.length === 1 && z2.unbekannt[0] === 'b', '1: ein markierter Satz ohne Grund ist „unbekannt"');

  /* ---------- 2 ---------- */
  const fehlt = messungLesen(path.join(tmp, 'gibt-es-nicht.json'), REPO);
  pruefe(/fehlt/.test(fehlt.fehler || ''), '2: fehlende Messung meldet „fehlt"');
  const halb = path.join(tmp, 'halb.json');
  fs.writeFileSync(halb, JSON.stringify({ sichtbar: ['a'] }));
  pruefe(/unvollständig/.test(messungLesen(halb, REPO).fehler || ''), '2: halbe Messung meldet „unvollständig"');
  const alt = path.join(tmp, 'alt.json');
  fs.writeFileSync(alt, JSON.stringify({ sichtbar: ['a'], ausgeblendet: {}, dateien: { 'grammar-data.js': '0'.repeat(40) } }));
  pruefe(/alt/.test(messungLesen(alt, REPO).fehler || ''), '2: Messung zu einer geänderten Datei meldet „alt"');

  /* Gestellte, gültige Messungen über den echten Markierungen. */
  const ktx = { window: {}, console };
  vm.createContext(ktx);
  vm.runInContext(fs.readFileSync(path.join(REPO, 'grammar-data.js'), 'utf8')
    + '\nglobalThis.T = SENTENCE_TAGS; globalThis.R = GRAMMAR_RULES;', ktx);
  const TAGS = ktx.T;
  const zeigt = new Set(ktx.R.filter(r => !r.ausgeblendet).map(r => r.id));
  const markiert = Object.keys(TAGS).filter(id => TAGS[id] && TAGS[id].length);
  const x = markiert.find(id => TAGS[id].length >= 2 && TAGS[id].every(t => zeigt.has(t.ruleId)));
  pruefe(!!x, '4: einen Satz mit zwei Markierungen an Regeln gefunden, die in der App sind');
  const fingerabdruck = { 'grammar-data.js': sha1(path.join(REPO, 'grammar-data.js')) };
  const messung = (name, sichtbar, ausgeblendet) => {
    const p = path.join(tmp, name);
    fs.writeFileSync(p, JSON.stringify({ abgefragt: new Date().toISOString(), geaendert: '2026-10-26T18:01:51.000Z',
      dateien: fingerabdruck, sichtbar, ausgeblendet }));
    return p;
  };
  const voll = messung('voll.json', markiert, {});
  pruefe(!!messungLesen(voll, REPO).messung, '2: eine gültige Messung wird gelesen');

  /* ---------- 3 ---------- */
  const ohneOrdner = path.join(tmp, 'ohne-messung');
  const r3 = spawnSync(process.execPath, [BAUER, '--messung', path.join(tmp, 'gibt-es-nicht.json'), '--ziel', ohneOrdner], { encoding: 'utf8' });
  pruefe(r3.status === 1 && /Messung fehlt/.test((r3.stdout || '') + (r3.stderr || '')),
    '3: ohne Messung Exit 1 mit „Messung fehlt" (Exit war ' + r3.status + ')');
  pruefe(!fs.existsSync(path.join(ohneOrdner, 'regelkategorien.html')), '3: ohne Messung keine Seite geschrieben');

  /* ---------- 4 ---------- */
  const bau = (datei, ordner) => {
    const r = spawnSync(process.execPath, [BAUER, '--messung', datei, '--ziel', ordner], { encoding: 'utf8' });
    if (r.status !== 0) { fehler.push('4: Bau endete mit ' + r.status + ': ' + ((r.stdout || '') + (r.stderr || '')).slice(0, 400)); return null; }
    return fs.readFileSync(path.join(ordner, 'regelkategorien.html'), 'utf8');
  };
  const zahlen = html => {
    const m = new Map();
    for (const s of html.split('data-id="').slice(1)) {
      const n = (s.match(/class="lage an">in der App \u00b7 (\d+) Satzstelle/) || [])[1];
      if (n !== undefined) m.set(s.slice(0, s.indexOf('"')), Number(n));
    }
    return m;
  };
  if (x) {
    const seiteVoll = bau(voll, path.join(tmp, 'voll'));
    const seiteOhne = bau(messung('ohne-x.json', markiert.filter(id => id !== x), { [x]: 'Karte noch nie gesehen' }), path.join(tmp, 'ohne-x'));
    if (seiteVoll && seiteOhne) {
      const A = zahlen(seiteVoll), B = zahlen(seiteOhne);
      const jeRegel = {};
      for (const t of TAGS[x]) jeRegel[t.ruleId] = (jeRegel[t.ruleId] || 0) + 1;
      for (const [rid, k] of Object.entries(jeRegel))
        pruefe(A.has(rid) && B.has(rid) && A.get(rid) - B.get(rid) === k,
          '4: Regel ' + rid + ' muss um ' + k + ' sinken (alle sichtbar ' + A.get(rid) + ', ohne ' + x + ' ' + B.get(rid) + ')');
      const andere = [...A.keys()].filter(rid => !jeRegel[rid] && A.get(rid) !== B.get(rid));
      pruefe(!andere.length, '4: keine andere Regel darf sich ändern (geändert: ' + andere.slice(0, 3).join(', ') + ')');
      pruefe(/Gezählt sind nur Stellen in Sätzen, die du im Satzmodus schon sehen\s+kannst \(dein Stand vom 26\.10\.2026, \d\d:\d\d\)/.test(seiteOhne),
        '4: die Seite sagt, wovon die Zahl ausgeht');
    }
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log(fehler.length ? 'ROT (' + gut + ' gut, ' + fehler.length + ' falsch):\n- ' + fehler.join('\n- ')
  : 'GRÜN: ' + gut + ' Prüfungen — die Kategorien-Seite zählt nur Sätze, die er im Satzmodus sieht');
process.exit(fehler.length ? 1 : 0);
