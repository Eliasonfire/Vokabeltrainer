#!/usr/bin/env node
/* schluessel-zuordnung.mjs — welche Lektion des Schlüssels belegt welche Regel?
 * ==========================================================================
 *
 * ⛔⛔ WOZU
 *
 * 22 der 95 Regeln haben eine Videoquelle, aber keinen `source2` — den
 * gedruckten Zweitbeleg. Alle stammen aus Unterrichtskapitel 1–10, also aus
 * Madina **Buch 1**.
 *
 * Das PDF dazu (`Madina_Book1_German_Key.pdf`) liegt **nicht** mehr im
 * Workspace, nur Band 2 und 3. Ohne die Datei gibt es keine Seitenzahl, und
 * `validate.js` verlangt bei `source2` alle drei Teile.
 *
 * ⭐ Der INHALT ist aber nicht verloren: die Vault-Notiz
 * `04 - Wissen/Schluessel-Regeln.md` hat Schlüssel 1 vollständig ausgewertet
 * (23 Lektionen, am 29.07.2026 gerendert und gelesen).
 *
 * Dieses Werkzeug macht deshalb den TEUREN Teil im Voraus: es schlägt je Regel
 * die Lektion vor und nennt die Textstelle, auf der der Vorschlag beruht.
 * Sobald Elias das PDF freigibt, fehlt nur noch die Seitenzahl.
 *
 * ================== WAS ES AUSDRUECKLICH NICHT TUT ========================
 *
 * ⛔ Es trägt NICHTS in grammar-data.js ein. Ein `source2` ohne Seitenzahl wäre
 * eine halbe Fundstelle — und die ist schlimmer als keine, weil man ihr glaubt
 * (so steht es schon im Kommentar von validate.js).
 *
 * ⛔ Es erfindet keine Seitenzahl. Nur drei Lektionen (1, 2, 7) tragen in der
 * Notiz eine belegte PDF-Seite; bei den übrigen steht hier ein Strich.
 *
 * ⚠️ Und es RAET nicht — weder aus der Kapitelnummer noch aus Stichwörtern.
 * Der Kopf von `schluessel-lektionen.mjs` warnt vor dem Ersten: bei Lektion 8
 * weicht der Schnitt ab (Buch: Lektion 8, Lehrer: Kapitel 6). Und das Zweite
 * hat der erste Bau dieses Werkzeugs selbst vorgeführt: über die arabischen
 * Stichwörter der Regel gesucht, kam `ya-nida-01` auf Lektion 8 heraus, obwohl
 * die Notiz يَا ausdrücklich in Lektion 5 nennt.
 *
 * ⭐ Gesucht wird nach der REGEL-ID, die die Notiz selbst nennt. Steht sie
 * nicht da, sagt das Werkzeug genau das — statt einen Vorschlag zu erfinden.
 *
 * Aufruf:
 *   node werkzeuge/schluessel-zuordnung.mjs           Übersicht
 *   node werkzeuge/schluessel-zuordnung.mjs --lang    mit Fundstellen-Zitat
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HIER, '..');
const LANG = process.argv.includes('--lang');
const NOTIZ = 'G:\\1. Workspace\\Obsidian\\Gedächtnis\\Elias Gedächtnis\\04 - Wissen\\Schluessel-Regeln.md';

/* ---------- Regeln laden ---------- */
const kiste = { window: {} };
vm.createContext(kiste);
vm.runInContext(fs.readFileSync(path.join(REPO, 'grammar-data.js'), 'utf8'), kiste,
  { filename: 'grammar-data.js' });
const REGELN = vm.runInContext('GRAMMAR_RULES', kiste);

/* ---------- Die Notiz in Lektionen zerlegen ---------- */
let text;
try { text = fs.readFileSync(NOTIZ, 'utf8'); }
catch (e) { console.error('⛔ Notiz nicht lesbar: ' + e.message); process.exit(1); }

/* ⛔ split(/\r?\n/): eine unter Windows bearbeitete Datei traegt \r, und jedes
   Muster mit $ laeuft dann ins Leere. [[zeilenende_r_bricht_muster]] */
const zeilen = text.split(/\r?\n/);
const lektionen = [];
zeilen.forEach((z, i) => {
  const m = /^### Lektion ([0-9]+)(?:\s*\+\s*[0-9A-Za-z]+)?(?:–|-)?([0-9]+)?\s*(?:\(S\.\s*([0-9]+))?/.exec(z);
  if (!m) return;
  lektionen.push({ nr: Number(m[1]), bis: m[2] ? Number(m[2]) : null,
                   seite: m[3] ? Number(m[3]) : null, ab: i, ueberschrift: z.slice(4) });
});
lektionen.forEach((l, i) => { l.zu = i + 1 < lektionen.length ? lektionen[i + 1].ab : zeilen.length; });

/* Seitenzahl auch aus den ersten Zeilen des Abschnitts holen — dort steht in
   der Notiz teils „*(PDF-Seite 6)*" statt in der Überschrift. */
lektionen.forEach(l => {
  if (l.seite) return;
  const kopf = zeilen.slice(l.ab, Math.min(l.ab + 8, l.zu)).join(' ');
  const m = /PDF-Seite\s*([0-9]+)/.exec(kopf);
  if (m) l.seite = Number(m[1]);
});

/* ---------- Zuordnen ---------- */
/* ⛔⛔ NICHT über Stichwörter raten.
 *
 * Der erste Bau zählte, wie oft die arabischen Wörter einer Regel in einem
 * Lektionsabschnitt vorkommen. Das sah plausibel aus und war in mindestens
 * drei Fällen falsch: `ya-nida-01` landete auf Lektion 8, obwohl die Notiz
 * يَا ausdrücklich in Lektion 5 nennt; `possessiv-endungen-01` auf 5 statt 10.
 * Häufige Wörter stehen in jeder Lektion und sagen nichts.
 * [[stichworttreffer_ist_kein_inhaltstreffer]]
 *
 * ⭐ Die Notiz nennt die Regel-IDs SELBST — in ihren Gegenüberstellungs-
 * Tabellen, am 20.08.2026 sechzig Stück. Danach wird gesucht, nicht geraten.
 * Was dort nicht steht, wird als „nicht in der Notiz" gemeldet — eine ehrliche
 * Lücke schlägt einen plausiblen Vorschlag. */
const offen = REGELN.filter(r => !r.source2 && !r.ausgeblendet && r.source);

/* Welche Regel-IDs nennt die Notiz überhaupt? */
const genannt = new Set([...text.matchAll(/`([a-z][a-z0-9-]*-[0-9]{2})`/g)].map(m => m[1]));

const ergebnis = offen.map(r => {
  const treffer = [];
  for (const l of lektionen){
    for (let i = l.ab; i < l.zu; i++){
      if (zeilen[i].includes('`' + r.id + '`')){
        treffer.push({ lektion: l.nr, seite: l.seite, zeile: i + 1,
                       beleg: zeilen[i].trim().slice(0, 120) });
      }
    }
  }
  return {
    regel: r,
    inNotiz: genannt.has(r.id),
    treffer,
    lektion: treffer.length ? treffer[0].lektion : null,
    seite: treffer.length ? treffer[0].seite : null,
    beleg: treffer.length ? treffer[0].beleg : null,
    /* ⚠️ Mehrere Treffer in DERSELBEN Lektion sind eindeutig — die Notiz nennt
       eine Regel dort gern zweimal (Gegenueberstellung und Zusammenfassung).
       Der erste Bau zaehlte Zeilen statt Lektionen und meldete
       `hadha-al-kein-satz-01` als "2 Lektionen: 8, 8". */
    eindeutig: new Set(treffer.map(x => x.lektion)).size === 1 && treffer.length > 0
  };
});

/* ---------- Ausgabe ---------- */
console.log('Zweitbelege vorbereiten — Schlüssel 1, Lektionen aus der Vault-Notiz');
console.log('');
console.log('  ' + lektionen.length + ' Lektionen gelesen, davon '
  + lektionen.filter(l => l.seite).length + ' mit belegter PDF-Seite.');
console.log('  ' + offen.length + ' Regeln ohne source2.');
console.log('');
console.log('  Regel                            K    Lektion  Seite  sicher?');
console.log('  ' + '-'.repeat(74));
let sicher = 0, mitSeite = 0;
for (const e of ergebnis){
  if (e.eindeutig) sicher++;
  if (e.seite) mitSeite++;
  const nr = [...new Set(e.treffer.map(x => x.lektion))];
  const wie = e.eindeutig ? 'in der Notiz benannt'
            : nr.length > 1 ? '⚠️ ' + nr.length + ' Lektionen: ' + nr.join(', ')
            : '⛔ steht nicht in der Notiz';
  console.log('  ' + e.regel.id.padEnd(32)
    + ('K' + e.regel.source.chapter).padEnd(5)
    + (e.lektion ? String(e.lektion) : '—').padStart(4) + '     '
    + (e.seite ? String(e.seite) : '—').padStart(4) + '   ' + wie);
  if (LANG && e.beleg) console.log('        ↳ ' + e.beleg);
}
console.log('');
console.log('  ' + sicher + ' von ' + offen.length + ' eindeutig zugeordnet, '
  + mitSeite + ' davon mit belegter Seite.');
console.log('  ' + ergebnis.filter(e => !e.treffer.length).length
  + ' Regel(n) nennt die Notiz gar nicht — dort hilft nur das PDF.');
console.log('');
console.log('  ⛔ Nichts davon wird eingetragen: ohne Seitenzahl waere es eine halbe');
console.log('     Fundstelle, und die ist schlimmer als keine. Das PDF von Band 1 fehlt');
console.log('     im Workspace — die Freigabe zum Herunterladen liegt bei Elias.');
process.exit(sicher < offen.length ? 2 : 0);
