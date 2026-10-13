/* koran-eb-aufloesen.mjs — löst die Platzhalter der Vorlage werkzeuge/koran-vorlagen/eselsbruecken.json auf: arabische Stellen kommen aus den Daten,
   kein arabisches Wort ist von Hand getippt.  {v:S:V:a-b} Wörter a bis b des Verses · {d:N.T:a-b} Wörter aus Text T
   der Dua N · {k:kh-NNN[:feld]} Koran-Karte · {b:ID[:feld]} Wort aus seinem Bestand · {u:XXXX,…} Zeichen nach Nummer.
   Aufruf:  node werkzeuge/koran-eb-aufloesen.mjs [--nur kh-032,kh-035,…] [<vorlage.json> <ziel.json> <lesefassung.txt>]
   Ohne Dateiangaben: Vorlage aus werkzeuge/koran-vorlagen/, Ergebnis nach data-ersatz/arbeit/koran-zwischenordner/
   (eb.json, eb-lesen.txt). Geprüft wird IMMER die ganze Vorlage; --nur schreibt nur die genannten Karten ins Ergebnis
   (für werkzeuge/eselsbruecken-setzen.mjs, wenn die älteren schon gesetzt sind). */
import fs from 'node:fs';
import path from 'node:path';
import { REPO, ARBEIT, VORLAGEN, lade, Z, zitat, woerterVon } from './koran-stellen-lib.mjs';

const ARGS = process.argv.slice(2);
const iNur = ARGS.indexOf('--nur');
const NUR = iNur >= 0 ? new Set(String(ARGS[iNur + 1] || '').split(',').map(s => s.trim()).filter(Boolean)) : null;
if (iNur >= 0) ARGS.splice(iNur, 2);
const [vorlageDatei = path.join(VORLAGEN, 'eselsbruecken.json'), zielDatei = path.join(ARBEIT, 'eb.json'), leseDatei = path.join(ARBEIT, 'eb-lesen.txt')] = ARGS;
fs.mkdirSync(path.dirname(zielDatei), { recursive: true });
const vorlage = JSON.parse(fs.readFileSync(vorlageDatei, 'utf8'));

/* Koran-Karten */
const khText = fs.readFileSync(path.join(REPO, 'koran-haeufig-data.js'), 'utf8');
let KH = null;
{
  const m = khText.match(/(?:const|let|var)\s+([A-Z_0-9]+)\s*=\s*\[/) || khText.match(/window\.([A-Z_0-9]+)\s*=/);
  if (!m) throw new Error('Name der Kartenliste in koran-haeufig-data.js nicht erkannt');
  if (/window\./.test(m[0])) { const f = {}; new Function('window', khText)(f); KH = f[m[1]]; } else KH = lade('koran-haeufig-data.js', m[1]);
}
const kh = new Map(KH.map(k => [String(k.id), k]));

/* Sein Bestand — wie in bestand.mjs: vocab-data.js, Fachbegriffe, eigene Wörter, Buchwörter bis zu seinem Kapitel */
const bestand = new Map();
const merke = w => { if (w && w.id !== undefined && !bestand.has(String(w.id))) bestand.set(String(w.id), w); };
lade('vocab-data.js', 'VOCAB_DATA').forEach(merke);
try { lade('data/fachbegriffe.js', 'FACHBEGRIFF_VOKABELN').forEach(merke); } catch (e) { /* keine Fachbegriffe */ }
try { (JSON.parse(fs.readFileSync(path.join(REPO, 'data/eigene-woerter.json'), 'utf8')).woerter || []).forEach(merke); } catch (e) { /* keine eigenen */ }
const stand = JSON.parse(fs.readFileSync(path.join(REPO, 'data/lernstand.json'), 'utf8'));
for (const [slug, bis] of Object.entries(stand.angabe || {})) {
  if ((stand.nichtInArbeit || {})[slug]) continue;
  const f = {};
  new Function('window', fs.readFileSync(path.join(REPO, 'data', 'vokabeln-' + slug + '.js'), 'utf8'))(f);
  for (const w of ((f.VOKABELN && f.VOKABELN[slug]) || [])) if (Number(w.chapter) <= Number(bis)) merke(w);
}

const fehler = [];
const ersteForm = t => String(t).split(' / ')[0].trim();
function loese(text, wo) {
  return text.replace(/\{([vdkbu]):([^}]*)\}/g, (ganz, art, rest) => {
    try {
      if (art === 'v') { const m = rest.match(/^(\d+):(\d+):(\d+)-(\d+)$/); if (!m) throw new Error('Form'); return zitat(m[1] + ':' + m[2], Number(m[3]), Number(m[4])); }
      if (art === 'd') { const m = rest.match(/^(\d+\.\d+):(\d+)-(\d+)$/); if (!m) throw new Error('Form'); return zitat('D' + m[1], Number(m[2]), Number(m[3])); }
      if (art === 'k') { const [id, feld = 'ar'] = rest.split(':'); const k = kh.get(id); if (!k || !k[feld]) throw new Error('Karte oder Feld fehlt'); return ersteForm(k[feld]); }
      if (art === 'b') { const [id, feld = 'ar'] = rest.split(':'); const w = bestand.get(id); if (!w) throw new Error('nicht in seinem Bestand'); const v = feld === 'ar' ? (w.ar || w.sg) : w[feld]; if (!v) throw new Error('Feld fehlt'); return ersteForm(v); }
      if (art === 'u') return rest.split(',').map(h => Z(parseInt(h.trim(), 16))).join('');
    } catch (e) { fehler.push(wo + ' ' + ganz + ': ' + e.message); return ganz; }
    return ganz;
  }).normalize('NFC');
}
const ARLAUF = new RegExp('[' + Z(0x0621) + '-' + Z(0x0652) + Z(0x0670) + Z(0x0671) + '][' + Z(0x0621) + '-' + Z(0x0652) + Z(0x0670) + Z(0x0671) + ' ]*', 'g');
/* Dieselbe Regel wie werkzeuge/pruefe-marken.mjs: eine Marke (064B–065F, 0670) braucht direkt davor einen Träger.
   Ein Zitat, das auf das kleine Ya oder Waw mit Dehnungszeichen endet (12.10.2026: 2:255, Wort 37), fällt dort
   durch und hält den Sammellauf an — deshalb schon hier beim Auflösen melden, nicht erst vor dem Commit. */
const MARKE = new RegExp('[' + Z(0x064B) + '-' + Z(0x065F) + Z(0x0670) + ']');
const TRAEGT = new RegExp('[' + Z(0x0620) + '-' + Z(0x064A) + Z(0x064B) + '-' + Z(0x065F) + Z(0x0670) + Z(0x066E) + '-' + Z(0x06D3) + ']');
const ohneTraeger = t => { let n = 0; for (let i = 0; i < t.length; i++) if (MARKE.test(t[i]) && !(i > 0 && TRAEGT.test(t[i - 1]))) n++; return n; };
const ziel = {}, lese = [];
let texte = 0, langeLaeufe = 0;
for (const [id, e] of Object.entries(vorlage)) {
  if (id === '_') continue;
  const k = kh.get(id);
  if (!k) { fehler.push(id + ': keine Koran-Karte mit dieser Kennung'); continue; }
  const alle = [e.mnemo, ...(e.alt || [])].map((t, i) => loese(t, id + ' Text ' + (i + 1)));
  if (alle.length !== 3) fehler.push(id + ': ' + alle.length + ' Texte statt 3');
  ziel[id] = { mnemo: alle[0], alt: alle.slice(1) };
  lese.push('=== ' + id + ' · ' + k.ar + ' · ' + k.de);
  alle.forEach((t, i) => {
    texte++;
    const zuLang = (t.match(ARLAUF) || []).filter(l => woerterVon(l).length > 4);
    if (zuLang.length) { langeLaeufe++; fehler.push(id + ' Text ' + (i + 1) + ': arabischer Lauf über vier Wörter'); }
    const lose = ohneTraeger(t);
    if (lose) fehler.push(id + ' Text ' + (i + 1) + ': ' + lose + ' Marke(n) ohne Träger — pruefe-marken.mjs hielte an (Zitat anders schneiden)');
    lese.push('  ' + (i + 1) + '. ' + t);
  });
}
const offen = JSON.stringify(ziel).match(/\{[vdkbu]:[^}]*\}/g) || [];
if (NUR) for (const id of NUR) if (!ziel[id]) fehler.push('--nur ' + id + ': steht nicht in der Vorlage');
const schreib = NUR ? Object.fromEntries(Object.entries(ziel).filter(([id]) => NUR.has(id))) : ziel;
fs.writeFileSync(zielDatei, JSON.stringify(schreib, null, 1), 'utf8');
fs.writeFileSync(leseDatei, lese.join('\n') + '\n', 'utf8');
console.log('Karten: ' + Object.keys(ziel).length + (NUR ? ' (geschrieben: ' + Object.keys(schreib).length + ')' : '') + ' · Texte: ' + texte + ' · unaufgelöste Platzhalter: ' + offen.length + ' · lange Läufe: ' + langeLaeufe + ' · Bestand: ' + bestand.size + ' Wörter');
console.log('Fehler: ' + (fehler.length ? '\n  ' + fehler.join('\n  ') : 'keine'));
process.exit(fehler.length ? 1 : 0);
