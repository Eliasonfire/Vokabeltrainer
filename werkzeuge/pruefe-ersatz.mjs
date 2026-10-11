/* pruefe-ersatz.mjs -- prüft die Ersatzdatenbank (data-ersatz/) gegen ihre Plätze.
 *
 * Elias, 11.10.2026: „1:1 die selben vokabeln auch an quantität" · „genauso organisiert … wie die bei
 * arabicroots damit man … nahtlos wechseln kann ohne probleme" · „für das deutsche will ich im optimalfall
 * auch eine quelle haben". Daraus folgt, was hier bewacht wird:
 *   - dieselben Kennungen, Kapitel und dieselbe Reihenfolge wie im Bestand (daran hängt sein Lernstand)
 *   - jede Karte hat Arabisch, Deutsch und Wortart, und zu JEDER Angabe steht eine Fundstelle
 *   - keine Fundstelle heißt arabicroots
 *   - ein Platz ist belegt ODER steht mit Grund unter „nicht gefunden" ODER ist offen — nie zwei davon
 *   - das Verzeichnis buecher.js nennt je Buch die Karten- und Kapitelzahl, die in der Buchdatei wirklich steht
 *     (die App zeigt diese Zahlen an, und das Vokabelpaket lässt sich nur bauen, wenn sie stimmen)
 * Von Claude stammt die Grenze: eine Karte ohne Deutsch zählt nicht als belegt.
 * Gemeldet, aber kein Widerspruch: ein Kapitel, in dem keine einzige Karte steht (Zeile „Kapitel: …").
 *
 * Ausgabe, letzte Zeile:  ERSATZ VOLLSTÄNDIG: 4433 von 4433 Plätzen, 8 von 8 Büchern
 *                   oder  ERSATZ UNVOLLSTÄNDIG: n von 4433 Plätzen belegt …
 * Exit 0, solange nichts widersprüchlich ist — auch wenn noch Plätze offen sind, und auch wenn es den Ordner
 * data-ersatz/ auf diesem Rechner gar nicht gibt (er ist lokal). Exit 1 nur bei einem Widerspruch.
 *
 * Aufruf:  node werkzeuge/pruefe-ersatz.mjs [--knapp] [--ordner <anderer Ordner statt data-ersatz>]
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const REPO = process.env.ERSATZ_REPO || path.join(HIER, '..');
const args = process.argv.slice(2);
const knapp = args.includes('--knapp');
const ERSATZ = args.includes('--ordner') ? path.resolve(args[args.indexOf('--ordner') + 1]) : path.join(REPO, 'data-ersatz');
const BUECHER = ['madina-1', 'madina-2', 'madina-3', 'bayna-yadayk-1', 'bayna-yadayk-2', 'bayna-yadayk-3', 'bayna-yadayk-4', 'quran'];
const ARTEN = ['noun', 'verb', 'adjective', 'particle', 'adverb', 'expression', 'phrase'];
const FELDER = ['ar', 'de', 'type', 'gender', 'sg', 'pl', 'femSg', 'femPl', 'root', 'past', 'present', 'imperative', 'masdar', 'note'];
const ARABISCHE_FELDER = ['ar', 'sg', 'pl', 'femSg', 'femPl', 'past', 'present', 'imperative', 'masdar'];
const voll = v => v !== null && v !== undefined && String(v).trim() !== '';

const plaetzeDatei = path.join(ERSATZ, 'plaetze.json');
if (!fs.existsSync(ERSATZ) || !fs.existsSync(plaetzeDatei)) {
  console.log('ERSATZ: nichts zu prüfen — ' + (fs.existsSync(ERSATZ) ? 'plaetze.json fehlt' : 'der Ordner data-ersatz fehlt auf diesem Rechner') + '.');
  process.exit(0);
}
const befunde = [];
const melde = t => { if (befunde.length < 400) befunde.push(t); };
const liesJson = (datei, sonst) => { try { return fs.existsSync(datei) ? JSON.parse(fs.readFileSync(datei, 'utf8')) : sonst; } catch (e) { melde(`${path.basename(datei)}: nicht lesbar (${String(e.message).slice(0, 80)})`); return sonst; } };
function ladeKarten(datei, buch) {
  if (!fs.existsSync(datei)) return null;
  const fenster = {};
  try { vm.runInContext(fs.readFileSync(datei, 'utf8'), vm.createContext({ window: fenster }), { filename: datei }); } catch (e) { melde(`${path.basename(datei)}: nicht ausführbar (${String(e.message).slice(0, 80)})`); return null; }
  return (fenster.VOKABELN || {})[buch] || null;
}

const plaetze = liesJson(plaetzeDatei, []);
const nichtGefunden = liesJson(path.join(ERSATZ, 'nicht-gefunden.json'), []);
const ngIds = new Map(nichtGefunden.map(n => [String(n.id), n]));
for (const n of nichtGefunden) if (!voll(n.grund)) melde(`nicht-gefunden.json: Platz ${n.id} steht ohne Grund da`);

// 1. Die Plätze selbst: stimmen sie noch mit dem Bestand überein? (nur wo der Bestand auf dem Rechner liegt)
const ids = new Set();
for (const p of plaetze) { if (ids.has(String(p.id))) melde(`plaetze.json: Kennung ${p.id} doppelt`); ids.add(String(p.id)); }
// Ändert sich der BESTAND (arabicroots liefert neue Vokabeln), ist das kein Widerspruch in der Ersatzdatenbank,
// sondern Arbeit, die ansteht: dann stimmen die Plätze nicht mehr, und Zuordner und Erzeuger müssen neu laufen.
// Das wird gemeldet, macht den Prüfer aber nicht rot — sonst wäre der Sammellauf nach jedem neuen Kapitel rot.
let bestandGeprueft = 0;
const hinweise = [];
if (!args.includes('--ordner')) for (const buch of BUECHER) {
  const bestand = ladeKarten(path.join(REPO, 'data', 'vokabeln-' + buch + '.js'), buch);
  if (!bestand) continue;
  bestandGeprueft++;
  const soll = plaetze.filter(p => p.buch === buch);
  if (soll.length !== bestand.length) { hinweise.push(`${buch}: der Bestand hat ${bestand.length} Plätze, plaetze.json nennt ${soll.length}`); continue; }
  for (let i = 0; i < bestand.length; i++) if (String(bestand[i].id) !== String(soll[i].id) || bestand[i].chapter !== soll[i].kap) { hinweise.push(`${buch}: ab Platz ${i + 1} weicht der Bestand von plaetze.json ab (Kennung oder Kapitel)`); break; }
}

// 2. Je Buch: Karten, Belege, Reihenfolge
const z = {};
// Sorten des deutschen Belegs — dieselbe Liste wie in ersatz-bauen.mjs: nur diese zählen als „mit Quelle direkt"
const DIREKT = ['direkt', 'dewikt', 'enwikt-tab', 'schluessel', 'arabdict', 'buch', 'wikipedia'];
let belegtAlle = 0, ngAlle = 0, offenAlle = 0, direkt = 0, kette = 0, teile = 0, ohne = 0;
for (const buch of BUECHER) {
  const soll = plaetze.filter(p => p.buch === buch);
  const stelle = new Map(soll.map((p, i) => [String(p.id), i]));
  const karten = ladeKarten(path.join(ERSATZ, 'vokabeln-' + buch + '.js'), buch) || [];
  const belege = liesJson(path.join(ERSATZ, 'belege-' + buch + '.json'), {});
  const gesehen = new Set();
  let letzte = -1;
  for (const k of karten) {
    const id = String(k.id), wo = `${buch} ${id}`;
    if (!stelle.has(id)) { melde(`${wo}: Kennung gehört nicht zu den Plätzen dieses Buchs`); continue; }
    if (gesehen.has(id)) { melde(`${wo}: Karte doppelt`); continue; }
    gesehen.add(id);
    const i = stelle.get(id);
    if (i < letzte) melde(`${wo}: steht in anderer Reihenfolge als im Bestand`);
    letzte = Math.max(letzte, i);
    if (k.chapter !== soll[i].kap) melde(`${wo}: Kapitel ${k.chapter}, im Bestand ${soll[i].kap}`);
    if (k.book !== buch) melde(`${wo}: Feld book ist „${k.book}“`);
    if (ngIds.has(id)) melde(`${wo}: belegt UND unter „nicht gefunden“`);
    for (const f of ['ar', 'de', 'type']) if (!voll(k[f])) melde(`${wo}: ${f} fehlt — eine Karte ohne ${f === 'de' ? 'Deutsch' : f === 'ar' ? 'Arabisch' : 'Wortart'} zählt nicht als belegt`);
    if (voll(k.type) && !ARTEN.includes(k.type)) melde(`${wo}: unbekannte Wortart „${k.type}“`);
    if (voll(k.gender) && !['masculine', 'feminine'].includes(k.gender)) melde(`${wo}: unbekanntes Geschlecht „${k.gender}“`);
    const b = belege[id];
    if (!b || b.status !== 'belegt' || !b.felder) { melde(`${wo}: Karte ohne Beleg-Eintrag`); continue; }
    for (const f of FELDER) {
      const wert = k[f];
      if (!voll(wert)) { if (b.felder[f]) melde(`${wo}: Beleg für ${f}, aber das Feld ist leer`); continue; }
      if (String(wert) !== String(wert).normalize('NFC')) melde(`${wo}: ${f} ist nicht NFC`);
      if (ARABISCHE_FELDER.includes(f)) {
        if (!/[ء-ي]/.test(wert)) melde(`${wo}: ${f} enthält keine arabischen Buchstaben`);
        else if (!/[ً-ْ]/.test(wert) && String(wert).replace(/[^ء-ي]/g, '').length > 2) melde(`${wo}: ${f} ohne jedes Vokalzeichen`);
      }
      const beleg = b.felder[f];
      if (!beleg || !voll(beleg.wo)) melde(`${wo}: ${f} ohne Fundstelle`);
      else if (/arabic\s?roots/i.test(beleg.wo) || /arabic\s?roots/i.test(beleg.q || '')) melde(`${wo}: Fundstelle für ${f} nennt arabicroots`);
    }
    const q = b.felder.de && b.felder.de.q;
    if (q === 'kette') kette++; else if (q === 'teile') teile++; else if (DIREKT.includes(q)) direkt++; else ohne++;
  }
  const ng = soll.filter(p => ngIds.has(String(p.id)) && !gesehen.has(String(p.id))).length;
  const kapKarten = new Set(karten.map(k => k.chapter));
  const kapPlaetze = [...new Set(soll.map(p => p.kap))];
  z[buch] = { plaetze: soll.length, belegt: gesehen.size, ng, offen: soll.length - gesehen.size - ng,
    karten: karten.length, kapitelKarten: kapKarten.size, kapitel: kapPlaetze.length, kapitelLeer: kapPlaetze.filter(k => !kapKarten.has(k)) };
  belegtAlle += gesehen.size; ngAlle += ng; offenAlle += z[buch].offen;
}
for (const id of ngIds.keys()) if (!ids.has(id)) melde(`nicht-gefunden.json: Kennung ${id} gehört zu keinem Platz`);

// 3. Das Verzeichnis: nennt es je Buch, was in der Buchdatei wirklich steht?
const verzeichnisDatei = path.join(ERSATZ, 'buecher.js');
let verzeichnis = null;
if (fs.existsSync(verzeichnisDatei)) {
  // wie baue-vokabelpaket.mjs: die Liste hinter dem letzten „= [" lesen, ohne das Skript auszuführen
  const m = fs.readFileSync(verzeichnisDatei, 'utf8').match(/=\s*(\[[\s\S]*\])\s*;?\s*$/);
  try { verzeichnis = m ? JSON.parse(m[1]) : null; } catch { verzeichnis = null; }
}
const mitKarten = BUECHER.filter(b => z[b].karten > 0);
if (!Array.isArray(verzeichnis)) { if (mitKarten.length) melde('buecher.js: das Verzeichnis fehlt oder ist nicht lesbar — ohne es zeigt die App die Bücher nicht („node werkzeuge/ersatz-bauen.mjs“ schreibt es)'); }
else {
  for (const buch of mitKarten) {
    const e = verzeichnis.find(v => v.slug === buch);
    if (!e) { melde(`buecher.js: das Buch ${buch} fehlt im Verzeichnis`); continue; }
    if (e.vokabeln !== z[buch].karten) melde(`buecher.js: Verzeichnis nennt für ${buch} ${e.vokabeln} Karten, die Buchdatei hat ${z[buch].karten}`);
    if (e.kapitel !== z[buch].kapitelKarten) melde(`buecher.js: Verzeichnis nennt für ${buch} ${e.kapitel} Kapitel, die Buchdatei hat ${z[buch].kapitelKarten}`);
    if (e.datei !== 'data/vokabeln-' + buch + '.js') melde(`buecher.js: Verzeichnis nennt für ${buch} die Datei „${e.datei}“ statt data/vokabeln-${buch}.js`);
  }
  for (const e of verzeichnis) if (!mitKarten.includes(e.slug)) melde(`buecher.js: Verzeichnis führt „${e.slug}“, dazu gibt es keine Buchdatei mit Karten`);
}
const kapitelAlle = BUECHER.reduce((n, b) => n + z[b].kapitel, 0);
const kapitelLeer = BUECHER.flatMap(b => z[b].kapitelLeer.map(k => `${b} Kapitel ${k}`));

if (!knapp) for (const buch of BUECHER) console.log(`  ${buch.padEnd(15)} ${String(z[buch].belegt).padStart(4)} von ${String(z[buch].plaetze).padStart(4)} belegt · ${z[buch].ng} nicht gefunden · ${z[buch].offen} offen · Kapitel mit Karten ${z[buch].kapitelKarten} von ${z[buch].kapitel}`);
console.log(`  Kapitel: ${kapitelAlle - kapitelLeer.length} von ${kapitelAlle} haben mindestens eine Karte` + (kapitelLeer.length ? ` — ohne Karte: ${kapitelLeer.slice(0, 12).join(', ')}${kapitelLeer.length > 12 ? ' …' : ''}` : ''));
console.log(`  Deutsch: ${direkt} mit Quelle direkt · ${kette} über das Englische (zwei Schritte) · ${teile} aus belegten Teilen zusammengesetzt · ${ohne} ohne deutsche Quelle` + (bestandGeprueft ? ` · Plätze gegen den Bestand geprüft: ${bestandGeprueft} von 8 Büchern` : ' · der Bestand liegt hier nicht, Plätze nur in sich geprüft'));
if (befunde.length) {
  console.log(`\nERSATZ WIDERSPRÜCHLICH: ${befunde.length} Befund(e)`);
  for (const b of befunde.slice(0, knapp ? 8 : 60)) console.log('  ✗ ' + b);
  process.exit(1);
}
const fertigeBuecher = BUECHER.filter(b => z[b].offen === 0 && z[b].plaetze > 0).length;
if (hinweise.length) {
  console.log(`  ⚠ Der Bestand hat sich seit dem letzten Bau geändert — erst „node werkzeuge/ersatz-zuordnen.mjs“, dann „node werkzeuge/ersatz-bauen.mjs“:`);
  for (const h of hinweise) console.log('     ' + h);
  console.log(`ERSATZ UNVOLLSTÄNDIG: ${belegtAlle} von ${plaetze.length} Plätzen belegt — die Plätze selbst sind nicht mehr aktuell`);
} else if (offenAlle === 0 && plaetze.length > 0) console.log(`ERSATZ VOLLSTÄNDIG: ${belegtAlle + ngAlle} von ${plaetze.length} Plätzen, ${fertigeBuecher} von ${BUECHER.length} Büchern` + (ngAlle ? ` (davon ${ngAlle} mit Grund nicht gefunden)` : ''));
else console.log(`ERSATZ UNVOLLSTÄNDIG: ${belegtAlle} von ${plaetze.length} Plätzen belegt, ${ngAlle} mit Grund nicht gefunden, ${offenAlle} offen · ${fertigeBuecher} von ${BUECHER.length} Büchern fertig`);
