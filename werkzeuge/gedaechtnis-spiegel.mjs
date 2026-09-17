/* gedaechtnis-spiegel.mjs — der Inhalt der App als lesbare Notizen im Obsidian-Gedächtnis
 *
 *   node werkzeuge/gedaechtnis-spiegel.mjs            schreiben (nur Notizen, deren Inhalt sich geändert hat)
 *   node werkzeuge/gedaechtnis-spiegel.mjs --pruefen  nichts schreiben; Exit 1, wenn eine Notiz fehlt oder veraltet ist
 *
 *   Ziel: <Vault>/03 - Projekte/Vokabeltrainer-Spiegel/   (SPIEGEL_ZIEL überschreibt, für Tests)
 *
 * ================== WOZU ===================================================
 *
 * Elias am 16.09.2026, 19:11:57: „ja mein gedächtnis soll immer auf dem
 * aktuellsten stand sein mit allem". Gemeint war der Inhalt der App — Regeln
 * samt Erklärung, die Karten aus Folge 19, Fachbegriffe, Lernwörter, Sätze,
 * Eselsbrücken, Wortfelder. Bis dahin stand das nur in den Datendateien, die er
 * in Obsidian nicht liest.
 *
 * ⭐ WANN: bei jeder Auslieferung. werkzeuge/veroeffentlichen.mjs ruft dieses
 * Werkzeug nach dem erfolgreichen Upload auf — so gibt es keine zweite Stelle,
 * die man vergessen kann, und keine eigene Freigabe für die Routinen: die
 * Wartung liefert über veroeffentlichen.mjs aus (Schritt 1b.6).
 * [[werkzeug_ohne_aufrufer]]
 *
 * ⛔ OHNE arabicroots-Buchvokabeln (data/vokabeln-*.js): deren AGB (Ziffer 3.7
 * und 9) verbieten Weitergabe. Die Eselsbrücken und Sätze zu Buchwörtern stehen
 * nur gezählt bzw. ohne das Wort selbst da.
 *
 * ⛔ Jede Notiz bleibt unter 1,4 MB — ab etwa 2 MB stürzt Obsidian ab, und
 * gedaechtnis-auslagern.mjs würde eine erzeugte Notiz über 1,5 MB zerlegen.
 * Wird eine zu groß, wird sie in Teile geschnitten, nicht gekürzt.
 *
 * ⚠️ Die Kopfzeile „Stand" ändert sich bei jedem Lauf; verglichen wird ohne
 * sie. Sonst schriebe jede Auslieferung alle Notizen neu, und die Frische-
 * Messung des Gedächtnisses (gedaechtnis-frisch.mjs) hielte eine erzeugte
 * Datei für gesicherte Arbeit. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ZIEL = process.env.SPIEGEL_ZIEL
  || 'G:\\1. Workspace\\Obsidian\\Gedächtnis\\Elias Gedächtnis\\03 - Projekte\\Vokabeltrainer-Spiegel';
const PRUEFEN = process.argv.includes('--pruefen');
const GRENZE = 1400 * 1024;

/* ---------- Daten laden ---------- */
const kiste = { window: {}, console: { log(){}, warn(){}, error(){} }, document: { addEventListener(){} } };
kiste.globalThis = kiste;
vm.createContext(kiste);
for (const datei of ['vocab-data.js', 'grammar-data.js', 'regelsammlung-data.js', 'lehrbuch-saetze.js',
                     'data/beispielsaetze.js', 'data/fachbegriffe.js', 'wortfelder-data.js', 'data/eselsbruecken.js']){
  const p = path.join(REPO, datei);
  if (!fs.existsSync(p)){ console.error('⛔ fehlt: ' + datei); process.exit(1); }
  vm.runInContext(fs.readFileSync(p, 'utf8'), kiste, { filename: datei });
}
const hol = n => vm.runInContext('typeof ' + n + ' !== "undefined" ? ' + n + ' : null', kiste);
const VOCAB = hol('VOCAB_DATA') || [];
const REGELN = hol('GRAMMAR_RULES') || [];
const TAGS = hol('SENTENCE_TAGS') || {};
const THEMEN = hol('SATZ_THEMEN') || [];
const KARTEN = hol('FOLGE19_KARTEN') || [];
const LEHRBUCH = hol('LEHRBUCH_SAETZE') || [];
const BEISPIEL = hol('BEISPIELSAETZE') || {};
const FACH = hol('FACHBEGRIFF_VOKABELN') || [];
const FELDER = hol('WORTFELDER') || [];
const BUCH_EB = hol('BUCH_ESELSBRUECKEN') || {};
const EIGENE = (JSON.parse(fs.readFileSync(path.join(REPO, 'data', 'eigene-woerter.json'), 'utf8')).woerter) || [];
const CACHE = (/CACHE_NAME\s*=\s*'([^']+)'/.exec(fs.readFileSync(path.join(REPO, 'sw.js'), 'utf8')) || [])[1] || '?';
if (!REGELN.length || !VOCAB.length){ console.error('⛔ Regeln oder Lernwörter leer — nichts geschrieben.'); process.exit(1); }

const regelName = new Map(REGELN.map(r => [r.id, r.name]));
const kategorie = r => { const t = THEMEN.find(x => x.muster && x.muster.test(r.id)); return t ? t.name : 'Nicht zuordbar'; };
const stellen = {};
for (const liste of Object.values(TAGS)) for (const t of liste || []) stellen[t.ruleId] = (stellen[t.ruleId] || 0) + 1;
const zeile = (label, wert) => (wert === undefined || wert === null || wert === '' ? '' : '- **' + label + ':** ' + wert + '\n');
const quelle = s => s ? ['Folge ' + s.folge, s.approxTimestamp, s.chapter ? 'Kapitel ' + s.chapter : ''].filter(Boolean).join(', ') : '';
const kopf = (titel, woher, zahl) => '# ' + titel + '\n\n'
  + '> ⛔ **Erzeugt** von `werkzeuge/gedaechtnis-spiegel.mjs` bei jeder Auslieferung — nicht von Hand ändern, '
  + 'der nächste Lauf überschreibt es. Quelle: ' + woher + '.\n'
  + '> Stand: STAND_PLATZHALTER · App ' + CACHE + ' · ' + zahl + '\n\n'
  + 'Übersicht: [[00 Übersicht]]\n\n';

/* ---------- Die Notizen ---------- */
const notizen = {};

/* Regeln, nach den Kategorien des Satzmodus */
{
  const gruppen = new Map();
  for (const r of REGELN){ const k = kategorie(r); if (!gruppen.has(k)) gruppen.set(k, []); gruppen.get(k).push(r); }
  let t = kopf('Vokabeltrainer — Regeln', '`grammar-data.js`', REGELN.length + ' Regeln');
  for (const [k, liste] of gruppen){
    t += '## ' + k + ' (' + liste.length + ')\n\n';
    for (const r of liste){
      const bsp = Object.values(TAGS).flat().find(x => x && x.ruleId === r.id);
      t += '### ' + r.name + '\n\n'
        + zeile('Kennung', '`' + r.id + '`')
        + zeile('Quelle', quelle(r.source) || (r.source2 ? 'Schlüssel ' + r.source2.schluessel + ', Lektion ' + r.source2.lektion + ', S. ' + r.source2.seite : ''))
        + zeile('In der App', r.ausgeblendet ? 'ausgeblendet' : 'an')
        + zeile('Von dir beurteilt', r.satzmodusUrteil ? 'ja (' + String(r.satzmodusUrteil).slice(0, 10) + ')' : 'noch nie')
        + zeile('Satzstellen', stellen[r.id] || 0)
        + zeile('Beispiel', bsp ? bsp.matchText : '')
        + '\n' + (r.shortExplanation || '') + '\n\n';
    }
  }
  notizen['Regeln'] = t;
}

/* Die Karten aus Folge 19 (Regelsammlung) */
{
  let t = kopf('Vokabeltrainer — Regelsammlung (Folge 19)', '`regelsammlung-data.js`', KARTEN.length + ' Karten');
  for (const k of KARTEN){
    t += '## ' + k.nr + '. ' + k.titel + (k.untertitel ? ' — ' + k.untertitel : '') + '\n\n'
      + zeile('Kennung', '`' + k.id + '`') + zeile('Arabisch', k.ar)
      + '\n' + (k.kern || '') + '\n\n';
    for (const g of k.gruppen || []){
      t += '**' + g.name + '**' + (g.rolle ? ' · ' + g.rolle : '') + '\n';
      for (const m of g.merkmale || []) t += '- ' + m + '\n';
      t += '\n';
    }
    if ((k.beispiele || []).length){ t += '**Beispiele**\n'; for (const b of k.beispiele) t += '- ' + b.ar + ' — ' + b.de + '\n'; t += '\n'; }
    if ((k.zerlegung || []).length){ t += '**Zerlegt**\n'; for (const z of k.zerlegung) t += '- ' + (z.ar || '') + ' = ' + (z.de || z.teile || '') + '\n'; t += '\n'; }
    if ((k.lehrer || []).length){ t += '**Dein Lehrer**\n'; for (const l of k.lehrer) t += '- ' + l.zeit + ': „' + l.text + '"\n'; t += '\n'; }
    for (const feld of ['genauer', 'abgrenzung', 'hinweis']) if (typeof k[feld] === 'string') t += zeile(feld[0].toUpperCase() + feld.slice(1), k[feld]);
    if (Array.isArray(k.regeln) && k.regeln.length) t += zeile('Gehört zu', k.regeln.map(id => regelName.get(id) || id).join(' · '));
    t += '\n';
  }
  notizen['Regelsammlung'] = t;
}

/* Fachbegriffe */
{
  let t = kopf('Vokabeltrainer — Fachbegriffe', '`data/fachbegriffe.js`', FACH.length + ' Karten');
  for (const w of FACH){
    t += '### ' + w.ar + ' — ' + w.de + '\n\n'
      + zeile('Wortart', w.type) + zeile('Regel', w.regel ? (regelName.get(w.regel) || w.regel) : '')
      + zeile('Eselsbrücke', w.mnemo) + zeile('Satz', w.sentAr ? w.sentAr + ' — ' + (w.sentDe || '') : '') + '\n';
  }
  notizen['Fachbegriffe'] = t;
}

/* Lernwörter: sein gepflegter Bestand und seine eigenen Wörter — keine Buchvokabeln */
{
  const liste = VOCAB.map(w => Object.assign({ herkunft: 'Lernbestand' }, w))
    .concat(EIGENE.map(w => Object.assign({ herkunft: 'selbst angelegt' }, w)));
  let t = kopf('Vokabeltrainer — Lernwörter', '`vocab-data.js` und deine eigenen Wörter (`data/eigene-woerter.json`); '
    + 'die Buchvokabeln von arabicroots stehen hier absichtlich NICHT (AGB)', VOCAB.length + ' + ' + EIGENE.length + ' Wörter');
  const nachKapitel = new Map();
  for (const w of liste){ const k = w.herkunft === 'selbst angelegt' ? 'Selbst angelegt' : 'Kapitel ' + w.chapter; if (!nachKapitel.has(k)) nachKapitel.set(k, []); nachKapitel.get(k).push(w); }
  for (const [k, ws] of nachKapitel){
    t += '## ' + k + ' (' + ws.length + ')\n\n';
    for (const w of ws){
      t += '### ' + w.ar + ' — ' + w.de + '\n\n'
        + zeile('Wortart', w.type) + zeile('Plural', w.pl) + zeile('Weiblich', w.femSg) + zeile('Wurzel', w.root)
        + zeile('Eselsbrücke', w.mnemo) + zeile('Satz', w.sentAr ? w.sentAr + ' — ' + (w.sentDe || '') : '') + '\n';
    }
  }
  notizen['Lernwörter'] = t;
}

/* Sätze mit ihren Markierungen */
{
  const markiert = id => (TAGS[String(id)] || []).map(x => x.matchText + ' → ' + (regelName.get(x.ruleId) || x.ruleId)).join(' · ');
  const lang = Object.keys(BEISPIEL).filter(id => id.startsWith('satz-lang-'));
  const buch = Object.keys(BEISPIEL).filter(id => !id.startsWith('satz-lang-'));
  let t = kopf('Vokabeltrainer — Sätze', '`lehrbuch-saetze.js`, `data/beispielsaetze.js`, die Sätze der Lernwörter',
    LEHRBUCH.length + ' Lehrbuch · ' + lang.length + ' längere · ' + buch.length + ' zu Buchwörtern · '
    + VOCAB.filter(w => w.sentAr).length + ' zu Lernwörtern');
  t += '## Aus dem Lehrbuch (' + LEHRBUCH.length + ')\n\n';
  for (const s of LEHRBUCH) t += '### ' + s.sentAr + '\n\n' + zeile('Deutsch', s.sentDe) + zeile('Fundstelle', [s.werk, s.kapitel ? 'Kapitel ' + s.kapitel : '', s.seite ? 'S. ' + s.seite : ''].filter(Boolean).join(', ')) + zeile('Markiert', markiert(s.id)) + '\n';
  t += '## Längere Sätze (' + lang.length + ')\n\n';
  for (const id of lang) t += '### ' + BEISPIEL[id].sentAr + '\n\n' + zeile('Deutsch', BEISPIEL[id].sentDe) + zeile('Markiert', markiert(id)) + '\n';
  t += '## Zu Buchwörtern (' + buch.length + ')\n\n> Das Buchwort selbst steht hier nicht (arabicroots-AGB), nur der Satz, den die App dazu zeigt.\n\n';
  for (const id of buch) if (BEISPIEL[id] && BEISPIEL[id].sentAr) t += '### ' + BEISPIEL[id].sentAr + '\n\n' + zeile('Deutsch', BEISPIEL[id].sentDe) + zeile('Markiert', markiert(id)) + '\n';
  notizen['Sätze'] = t;
}

/* Wortfelder */
{
  let t = kopf('Vokabeltrainer — Wortfelder', '`wortfelder-data.js`', FELDER.length + ' Felder');
  for (const f of FELDER){
    t += '### ' + f.name + '\n\n' + zeile('Wortart', f.typ || f.wortart)
      + zeile('Erkennt Wörter mit', Array.isArray(f.formen) ? f.formen.join(', ') : '')
      + zeile('Wörter', Array.isArray(f.woerter) ? f.woerter.join(', ') : '') + '\n';
  }
  notizen['Wortfelder'] = t;
}

/* Übersicht */
{
  const ebBuch = Object.keys(BUCH_EB).length;
  notizen['00 Übersicht'] = kopf('Vokabeltrainer — Spiegel', 'die Datendateien der App', 'Übersicht')
    + 'Elias am 16.09.2026: *„ja mein gedächtnis soll immer auf dem aktuellsten stand sein mit allem"*.\n\n'
    + '| Notiz | Inhalt |\n|---|---|\n'
    + '| [[Regeln]] | ' + REGELN.length + ' Regeln nach Kategorien, mit Erklärung, Quelle und Satzstellen |\n'
    + '| [[Regelsammlung]] | ' + KARTEN.length + ' Karten aus Folge 19 (Musterlösung) |\n'
    + '| [[Fachbegriffe]] | ' + FACH.length + ' Fachbegriff-Karten mit Eselsbrücke und Satz |\n'
    + '| [[Lernwörter]] | ' + VOCAB.length + ' Wörter aus dem Lernbestand, ' + EIGENE.length + ' selbst angelegte |\n'
    + '| [[Sätze]] | Lehrbuch, längere Sätze, Sätze zu Buchwörtern — mit ihren Markierungen |\n'
    + '| [[Wortfelder]] | ' + FELDER.length + ' Wortfelder |\n\n'
    + '⚠️ Nicht hier: die Buchvokabeln von arabicroots und ihre ' + ebBuch + ' Eselsbrücken (AGB Ziffer 3.7/9). '
    + 'Die Eselsbrücken der Lernwörter und Fachbegriffe stehen in deren Notizen.\n';
}

/* ---------- Schreiben oder prüfen ---------- */
const ohneStand = s => s.replace(/Stand: [^·\n]*·/, 'Stand: ·');
const stand = new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });
const dateien = [];
for (const [name, text] of Object.entries(notizen)){
  if (Buffer.byteLength(text) <= GRENZE){ dateien.push([name + '.md', text]); continue; }
  /* zu groß: an ### -Grenzen in Teile schneiden */
  const stuecke = text.split(/(?=\n### )/);
  let teil = 1, puffer = '';
  for (const s of stuecke){
    if (Buffer.byteLength(puffer + s) > GRENZE && puffer){ dateien.push([name + ' ' + teil + '.md', puffer]); teil++; puffer = kopf(name + ' (Teil ' + teil + ')', 'wie Teil 1', 'Fortsetzung'); }
    puffer += s;
  }
  dateien.push([name + ' ' + teil + '.md', puffer]);
}

let neu = 0, gleich = 0, veraltet = [];
if (!PRUEFEN) fs.mkdirSync(ZIEL, { recursive: true });
for (const [datei, text] of dateien){
  const ziel = path.join(ZIEL, datei);
  const vorher = fs.existsSync(ziel) ? fs.readFileSync(ziel, 'utf8') : null;
  if (vorher !== null && ohneStand(vorher) === ohneStand(text)){ gleich++; continue; }
  if (PRUEFEN){ veraltet.push(datei + (vorher === null ? ' (fehlt)' : '')); continue; }
  fs.writeFileSync(ziel + '.neu', text.replace('STAND_PLATZHALTER', stand));
  fs.renameSync(ziel + '.neu', ziel);
  neu++;
}
if (PRUEFEN){
  if (veraltet.length){ console.log('⛔ Spiegel veraltet: ' + veraltet.join(', ') + ' — node werkzeuge/gedaechtnis-spiegel.mjs'); process.exit(1); }
  console.log('✅ Spiegel aktuell: ' + gleich + ' Notizen.');
  process.exit(0);
}
console.log('Gedächtnis-Spiegel: ' + neu + ' Notiz(en) neu geschrieben, ' + gleich + ' unverändert → ' + ZIEL);
