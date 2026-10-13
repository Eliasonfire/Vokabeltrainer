/* koran-satz-aufloesen.mjs — baut aus werkzeuge/koran-vorlagen/saetze.json die Beispielsätze der Koran-Karten. Jede Wortform kommt aus
   den Daten (Karte, vorhandener Satz) oder aus einer der vier an diesem Satzbestand geeichten Umformungen
   (werkzeuge/eiche-koran-satz.mjs). Schreibt nach data-ersatz/arbeit/koran-zwischenordner/ (lokal, nicht im Repo):
     satz.json          { kennung: { sentAr, sentDe } }
     satz-block.txt     der Abschnitt für data/beispielsaetze.js (mit Kommentaren, auch für die Karten OHNE Satz)
     satz-marken.json   Auftrag für werkzeuge/markierung-setzen.mjs
     satz-lesen.txt     Lesefassung
   Aufruf:  node werkzeuge/koran-satz-aufloesen.mjs [<vorlage.json> [<zielordner>]] */
import fs from 'node:fs';
import path from 'node:path';
import { bestandLaden, saetzeLaden, stamm, nurAr, bestimmt, fall, mudaf, mitBi, lade, Z, REPO, ARBEIT, VORLAGEN } from './koran-satz-lib.mjs';

const vorlageDatei = process.argv[2] || path.join(VORLAGEN, 'saetze.json');
const ordner = process.argv[3] || ARBEIT;
fs.mkdirSync(ordner, { recursive: true });
const vorlage = JSON.parse(fs.readFileSync(vorlageDatei, 'utf8'));
const KH = new Map(lade('koran-haeufig-data.js', 'KORAN_HAEUFIG').map(k => [String(k.id), k]));
const EB = lade('data/eselsbruecken.js', 'BUCH_ESELSBRUECKEN');
const REGELN = new Map(new Function(fs.readFileSync(path.join(REPO, 'grammar-data.js'), 'utf8') + ';return GRAMMAR_RULES;')().map(r => [r.id, r]));
const bestand = bestandLaden();
const saetze = saetzeLaden();
const ersteForm = t => nurAr(String(t).split(' / ')[0]);
const fehler = [], hinweise = [];

const UMFORMUNG = { best: bestimmt, gen: w => fall(w, 'gen'), akk: w => fall(w, 'akk'), mud: mudaf, bi: mitBi };
function hole(ref) {
  const i = ref.indexOf(':');
  const art = ref.slice(0, i), rest = ref.slice(i + 1);
  if (UMFORMUNG[art]) {
    const innen = hole(rest);
    if (innen.length !== 1) throw new Error(art + ': braucht genau ein Wort');
    const neu = UMFORMUNG[art](innen[0]);
    if (!neu) throw new Error(art + ': die Umformung lehnt ' + innen[0] + ' ab');
    return [neu];
  }
  if (art === 'k' || art === 'b') {
    const [id, feld = 'ar'] = rest.split(':');
    const karte = art === 'k' ? KH.get(id) : bestand.get(id);
    if (!karte) throw new Error((art === 'k' ? 'Koran-Karte ' : 'Bestandskarte ') + id + ' fehlt');
    const wert = feld === 'ar' ? (karte.ar || karte.sg) : karte[feld];
    if (!wert) throw new Error('Feld ' + feld + ' fehlt bei ' + id);
    return [ersteForm(wert)];
  }
  if (art === 's') {
    const j = rest.lastIndexOf(':');
    const s = saetze.get(rest.slice(0, j));
    if (!s) throw new Error('Satz ' + rest.slice(0, j) + ' nicht im Bestand');
    const m = rest.slice(j + 1).match(/^(\d+)(?:-(\d+))?$/);
    if (!m) throw new Error('Wortbereich nicht lesbar: ' + rest);
    const von = Number(m[1]), bis = Number(m[2] || m[1]);
    if (!(von >= 1 && bis >= von && bis <= s.w.length)) throw new Error('Bereich ' + von + '-' + bis + ' passt nicht zu ' + s.id + ' (' + s.w.length + ' Wörter)');
    return s.w.slice(von - 1, bis).map(w => w.ar);
  }
  throw new Error('unbekannter Verweis: ' + ref);
}

/* dieselbe Regel wie werkzeuge/pruefe-marken.mjs */
const MARKE = new RegExp('[' + Z(0x64B) + '-' + Z(0x65F) + Z(0x670) + ']');
const TRAEGT = new RegExp('[' + Z(0x620) + '-' + Z(0x64A) + Z(0x64B) + '-' + Z(0x65F) + Z(0x670) + Z(0x66E) + '-' + Z(0x6D3) + ']');
const ohneTraeger = t => { let n = 0; for (let i = 0; i < t.length; i++) if (MARKE.test(t[i]) && !(i > 0 && TRAEGT.test(t[i - 1]))) n++; return n; };

/* „nur Wörter, die er hat": Stämme seines Bestands und der 30 Karten der Gruppe, die schon Eselsbrücken tragen */
const bekannt = new Map();
const merke = (form, woher) => { if (form) for (const f of String(form).split(' / ')) { const s = stamm(f); if (s && !bekannt.has(s)) bekannt.set(s, woher); } };
for (const k of bestand.values()) { merke(k.ar, k.id); merke(k.femSg, k.id); merke(k.sg, k.id); }
for (const k of KH.values()) if (EB[k.id]) merke(k.ar, k.id);
const VORN = [Z(0x628), Z(0x648), Z(0x641), Z(0x644)];
const woherBekannt = w => { const s = stamm(w); if (bekannt.has(s)) return bekannt.get(s); for (const v of VORN) if (s.startsWith(v) && bekannt.has(stamm(s.slice(1)))) return bekannt.get(stamm(s.slice(1))); return null; };

const umbruch = (text, breite, einzug) => { const z = []; let akt = ''; for (const w of text.split(/\s+/)) { if ((akt + ' ' + w).trim().length > breite) { z.push(akt); akt = w; } else akt = (akt + ' ' + w).trim(); } if (akt) z.push(akt); return z.join('\n' + einzug); };
const js = t => "'" + String(t).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";

const ziel = {}, block = [], marken = [], lese = [];
let mitSatz = 0, ohneSatz = 0;
for (const [id, e] of Object.entries(vorlage)) {
  if (id === '_') continue;
  const k = KH.get(id);
  if (!k) { fehler.push(id + ': keine Koran-Karte'); continue; }
  const kopf = k.ar + ' — ' + k.de + ' („Koran häufigste", Rang ' + k.rang + ')';
  if (e.ohne) {
    ohneSatz++;
    block.push('  /* ' + id + ' · ' + kopf + '\n     KEIN SATZ, mit Absicht. ' + umbruch(e.ohne, 74, '     ') + ' */', '');
    lese.push('=== ' + id + ' · ' + k.ar + ' · ' + k.de, '   — kein Satz: ' + e.ohne);
    continue;
  }
  try {
    const w = e.teile.flatMap(hole);
    const satz = (w.join(' ') + (e.ende || '.')).normalize('NFC');
    if (ohneTraeger(satz)) throw new Error('Marke ohne Träger');
    if (!w.some(x => stamm(x) === stamm(ersteForm(k.ar)) || VORN.some(v => stamm(x) === v + stamm(ersteForm(k.ar))))) throw new Error('das Wort der Karte kommt im Satz nicht vor');
    if (w.length > 8) throw new Error(w.length + ' Wörter — zu lang');
    for (const x of w) { const wo = woherBekannt(x); if (!wo) hinweise.push(id + ': „' + x + '" steht nicht als Karte in seinem Bestand'); }
    for (const [regel, von, bis, warum] of (e.marken || [])) {
      const r = REGELN.get(regel);
      if (!r) throw new Error('Regel ' + regel + ' gibt es nicht');
      if (r.ausgeblendet) hinweise.push(id + ': Regel ' + regel + ' ist ausgeblendet');
      if (!(von >= 1 && bis >= von && bis <= w.length)) throw new Error('Markierung ' + regel + ': Bereich ' + von + '-' + bis + ' passt nicht (' + w.length + ' Wörter)');
      marken.push({ satzId: id, ruleId: regel, matchText: w.slice(von - 1, bis).join(' ').normalize('NFC'), warum });
    }
    if (!(e.marken || []).length) throw new Error('keine Markierung — der Satz wäre nur unter „Alle" erreichbar');
    ziel[id] = { sentAr: satz, sentDe: e.de };
    mitSatz++;
    block.push('  /* ' + kopf + '\n     ' + umbruch(e.kommentar, 74, '     ') + ' */', '  ' + js(id) + ': {', '    sentAr: ' + js(satz) + ',', '    sentDe: ' + js(e.de), '  },', '');
    lese.push('=== ' + id + ' · ' + k.ar + ' · ' + k.de, '   ' + satz + '   ' + e.de, ...marken.filter(m => m.satzId === id).map(m => '      ' + m.ruleId + ' ⟵ ' + m.matchText));
  } catch (f) { fehler.push(id + ': ' + f.message); }
}
const fehlen = [...KH.values()].filter(k => EB[k.id] && !vorlage[k.id]).map(k => k.id);
if (fehlen.length) fehler.push('in der Vorlage fehlen: ' + fehlen.join(', '));

fs.writeFileSync(path.join(ordner, 'satz.json'), JSON.stringify(ziel, null, 1), 'utf8');
fs.writeFileSync(path.join(ordner, 'satz-block.txt'), block.join('\n') + '\n', 'utf8');
fs.writeFileSync(path.join(ordner, 'satz-marken.json'), JSON.stringify({ markierungen: marken }, null, 1), 'utf8');
fs.writeFileSync(path.join(ordner, 'satz-lesen.txt'), lese.join('\n') + '\n', 'utf8');
console.log('Karten: ' + (mitSatz + ohneSatz) + ' · mit Satz: ' + mitSatz + ' · bewusst ohne: ' + ohneSatz + ' · Markierungen: ' + marken.length);
console.log('Hinweise: ' + (hinweise.length ? '\n  ' + hinweise.join('\n  ') : 'keine'));
console.log('Fehler: ' + (fehler.length ? '\n  ' + fehler.join('\n  ') : 'keine'));
process.exit(fehler.length ? 1 : 0);
