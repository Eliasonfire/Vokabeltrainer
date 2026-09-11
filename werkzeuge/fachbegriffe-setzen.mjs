/* fachbegriffe-setzen.mjs — Entscheidungen über Fachbegriff-Kandidaten eintragen
 * ==========================================================================
 *
 *   node werkzeuge/fachbegriffe-setzen.mjs <auftrag.json> --pruefen   alles prüfen, nichts schreiben
 *   node werkzeuge/fachbegriffe-setzen.mjs <auftrag.json>             prüfen, dann schreiben
 *
 *   Exitcode 0 = geschrieben (bzw. --pruefen: alles in Ordnung) · 1 = abgewiesen, nichts geschrieben
 *
 * Elias am 11.09.2026, 20:20:53, Auswahl: „Direkt eintragen (Recommended)" —
 * die Wartung trägt belegte Fachbegriffe selbst ein, er sieht sie danach in der
 * App und kann sie ausblenden. Kandidaten liefert fachbegriffe-finden.mjs.
 *
 * AUFTRAG (JSON, Text nie über die Kommandozeile — [[nutztext_nie_in_shell_strings]]):
 *   {
 *     "aufnehmen": [ { "id": "gram-…", "ar": "…", "de": "…", "type": "noun",
 *                      "regel": "<regel-id>", "mnemo": "…" } ],
 *     "ablehnen":  [ { "ar": "…", "grund": "…" } ],
 *     "fragen":    [ { "ar": "…", "frage": "…" } ]
 *   }
 *
 * ⛔ WAS VOR DEM SCHREIBEN VOLLSTÄNDIG GEPRÜFT WIRD — für JEDEN Eintrag, dann
 * erst wird geschrieben, und zwar alles oder nichts:
 *   1. `ar` steht WÖRTLICH, als eigenes Wort, in grammar-data.js oder
 *      regelsammlung-data.js. Nichts wird vokalisiert, alles abgeschrieben —
 *      die Regel vom 17.08.2026, im Kopf von data/fachbegriffe.js.
 *   2. Das Taschkīl ist vollständig (fachbegriffe-kern.mjs). Sonst gehört der
 *      Begriff unter „fragen": der Lehrer entscheidet, nicht ich.
 *   3. Keine Dublette: nicht schon Fachbegriff, nicht in vocab-data.js, keine
 *      vergebene id. [[einzeln_frei_ist_nur_im_browser]]
 *   4. `regel` gibt es, und ihr Text enthält den Begriff.
 *   5. `type` ist ausdrücklich angegeben und kommt im Bestand vor — KEINE
 *      Vorgabe. `type:'noun'` als Vorgabewert hat schon einmal ein Verb, ein
 *      Fragewort und drei Ẓarf falsch gemacht. [[vorgabewert_sieht_aus_wie_befund]]
 *   6. `de` und `mnemo` sind da. Jedes arabische Wort in `mnemo` steht wörtlich
 *      in seinen Vokabeln, Regeln oder Fachbegriffen — eine Eselsbrücke mit
 *      unbelegter Ḥaraka lernt er auswendig.
 *   7. Ein Kandidat für „ablehnen"/„fragen" braucht Grund bzw. Frage.
 *
 * ⛔ GESCHRIEBEN WIRD ÜBER .neu: data/fachbegriffe.js und
 * werkzeuge/fachbegriffe-entscheidungen.json entstehen erst als .neu, die neue
 * Fachbegriff-Datei wird GELADEN und gezählt, dann ersetzt. Kommentare der
 * Datei bleiben unberührt — die neuen Einträge kommen vor das schließende `];`.
 * [[leere_datei_besteht_jeden_test]]
 */
import fs from 'node:fs';
import path from 'node:path';
import { REPO, lies, ladeDaten, nackt, taschkilLuecken, stehtWoertlich, zaehleNackt, kandidatenAusRegeln, buchDublette, BUCHSTABE } from './fachbegriffe-kern.mjs';

const args = process.argv.slice(2);
const wert = (s) => { const i = args.indexOf(s); return i >= 0 ? args[i + 1] : null; };
const mitWert = new Set(['--ziel', '--entscheidungen']);
const auftragDatei = args.find((a, i) => !a.startsWith('--') && !(i > 0 && mitWert.has(args[i - 1])));
const NUR_PRUEFEN = args.includes('--pruefen');
const ZIEL = path.resolve(wert('--ziel') || path.join(REPO, 'data', 'fachbegriffe.js'));
const ENTSCH = path.resolve(wert('--entscheidungen') || path.join(REPO, 'werkzeuge', 'fachbegriffe-entscheidungen.json'));

if (!auftragDatei){ console.log('⛔ Aufruf: node werkzeuge/fachbegriffe-setzen.mjs <auftrag.json> [--pruefen]'); process.exit(1); }
let auftrag;
try { auftrag = JSON.parse(lies(path.resolve(auftragDatei))); }
catch (e) { console.log('⛔ Auftrag nicht lesbar: ' + String(e.message).split('\n')[0]); process.exit(1); }

const d = ladeDaten({ fachDatei: ZIEL, entscheidungenDatei: ENTSCH });
const { G, F, V, E, grammarText, kartenText } = d;
const heute = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });

const fehler = [];
const bestandNackt = new Set(F.map(f => nackt(f.ar)));
const vokNackt = new Set(V.map(v => nackt(v.ar)));
const ids = new Set([...F.map(f => f.id), ...V.map(v => String(v.id))]);
const typen = new Set([...F, ...V].map(x => x.type).filter(Boolean));
const regelNach = new Map(G.map(r => [r.id, r]));
const belegText = [grammarText, kartenText, lies(ZIEL), lies('vocab-data.js')].join('\n');
const WORT = new RegExp('[' + BUCHSTABE + '][\\u0610-\\u061A\\u064B-\\u065F\\u0670\\u0640' + BUCHSTABE + ']*', 'g');

/* ⭐⭐ WÖRTERBUCH-BELEGE — Elias am 11.09.2026, 21:20:26, auf meine Zeile, er
   solle seinen Lehrer nach acht Schreibungen fragen: „guck es doch nach bei den
   wörterbüchern die ich dir gegeben habe".
   Ein Wort gilt deshalb auch dann als belegt, wenn es nicht in den Regeln steht,
   aber (a) wörtlich in seinem eigenen Bestand — arabicroots-Abzug aller Bücher,
   Vokabeln, Sätze, Fachbegriffe —, oder (b) in werkzeuge/fachbegriffe-belege.json
   mit mindestens ZWEI verschiedenen Quellen, deren Formen übereinstimmen.
   Verglichen wird bis auf den Schlussvokal (arabdict zitiert mit Tanwīn, Reverso
   ohne — taschkil-belegen.mjs hat es gemessen); die Schadda zählt mit.
   ⛔ Eine einzelne Quelle genügt nie, und nach Analogie gebildet wird nichts. */
const BELEGE_DATEI = path.join(REPO, 'werkzeuge', 'fachbegriffe-belege.json');
const ohneSchluss = (w) => {
  const t = String(w || '').normalize('NFC');
  let letzter = -1;
  for (let i = 0; i < t.length; i++) if (new RegExp('[' + BUCHSTABE + ']').test(t[i])) letzter = i;
  return letzter < 0 ? t : t.slice(0, letzter + 1) + t.slice(letzter + 1).replace(/[ً-ِْٰ]/g, '');
};
const BESTAND_DATEIEN = ['vocab-data.js', 'lehrbuch-saetze.js', 'data/beispielsaetze.js', 'data/fachbegriffe.js',
  ...fs.readdirSync(path.join(REPO, 'data')).filter(f => /^vokabeln-.*\.js$/.test(f)).map(f => 'data/' + f)];
const lokaleFormen = new Map();
for (const [name, text] of [['grammar-data.js', grammarText], ['regelsammlung-data.js', kartenText], ...BESTAND_DATEIEN.map(f => [f, lies(f)])]){
  for (const m of text.normalize('NFC').match(WORT) || []){ const s = ohneSchluss(m); if (!lokaleFormen.has(s)) lokaleFormen.set(s, name); }
}
let WOERTERBUCH = {};
try { WOERTERBUCH = JSON.parse(lies(BELEGE_DATEI)).belege || {}; } catch (e) { /* ohne Datei nur der eigene Bestand */ }
function wortBelegt(w){
  const s = ohneSchluss(w);
  if (lokaleFormen.has(s)) return lokaleFormen.get(s);
  for (const [form, b] of Object.entries(WOERTERBUCH)){
    if (ohneSchluss(form) !== s) continue;
    const passend = new Set((b.quellen || []).filter(q => ohneSchluss(q.form) === s).map(q => q.quelle));
    if (passend.size >= 2) return [...passend].join(' + ');
  }
  return null;
}

const neu = [];
const entscheidungen = { ...((E && E.entscheidungen) || {}) };
/* Die Wörter der Begriffe dieses Auftrags dürfen in ihren eigenen Eselsbrücken
   stehen — sie sind ja gerade die belegten Formen. */
const auftragsWoerter = new Set((auftrag.aufnehmen || []).flatMap(a => String(a.ar || '').normalize('NFC').split(/\s+/).filter(Boolean)));
const schonImAuftrag = new Set();
const zuerst = (k, wo) => { if (schonImAuftrag.has(k)){ fehler.push(wo + ': „' + k + '" steht zweimal im Auftrag'); return false; } schonImAuftrag.add(k); return true; };

for (const [i, a] of (auftrag.aufnehmen || []).entries()){
  const wo = 'aufnehmen[' + i + '] ' + (a.id || a.ar || '');
  const f = [];
  const ar = String(a.ar || '').normalize('NFC').trim();
  const k = nackt(ar);
  if (!ar) f.push('ar fehlt');
  else {
    if (!zuerst(k, wo)) continue;
    if (!stehtWoertlich(grammarText, ar) && !stehtWoertlich(kartenText, ar)){
      const ohne = ar.split(/\s+/).filter(w => !wortBelegt(w));
      if (ohne.length) f.push('nicht belegt: ' + ohne.map(w => '„' + w + '"').join(', ') + ' — steht weder so in seinem Bestand noch mit zwei übereinstimmenden Quellen in werkzeuge/fachbegriffe-belege.json');
    }
    const l = taschkilLuecken(ar);
    if (l.length) f.push('Taschkīl unvollständig (' + l.join('; ') + ') → unter „fragen"');
    if (bestandNackt.has(k)) f.push('ist schon Fachbegriff');
    if (vokNackt.has(k)) f.push('steht schon in vocab-data.js');
  }
  if (!/^gram-[a-z0-9-]+$/.test(String(a.id || ''))) f.push('id muss wie gram-name aussehen');
  else if (ids.has(a.id)) f.push('id ' + a.id + ' ist vergeben');
  const r = regelNach.get(a.regel);
  if (!r) f.push('Regel ' + a.regel + ' gibt es nicht');
  else if (ar){
    /* Jedes Wort des Begriffs steht in der Regel — auch wenn sie ihn anders
       verbindet („حُروف شَمْسِيّة وقَمَرِيّة" nennt beide Begriffe in einem). */
    const inRegel = new Set(nackt(r.name + ' ' + r.shortExplanation).split(/\s+/).map(x => x.replace(/^و(?=\S{3})/, '')));
    if (!k.split(' ').every(x => inRegel.has(x))) f.push('Regel ' + a.regel + ' erwähnt den Begriff nicht');
  }
  if (!a.type) f.push('type fehlt — keine Vorgabe');
  else if (!typen.has(a.type)) f.push('type „' + a.type + '" kommt im Bestand nicht vor (' + [...typen].join(', ') + ')');
  if (!a.de || String(a.de).trim().length < 3) f.push('de fehlt');
  /* ⛔ Buchtausch (seit v471): würde die App den Eintrag beim Start durch eine
     Buchvokabel ersetzen, muss der Auftrag das mit `buchTausch: "<id>"`
     ausdrücklich bestätigen — bei GLEICHER Bedeutung ist es Elias' Regel vom
     07.09.2026. Bei ANDERER Bedeutung ist `de` falsch gefasst und wird geändert. */
  let tausch = null;
  if (ar && a.de){
    try { tausch = buchDublette({ id: a.id, ar, de: String(a.de), chapter: 'personal' }); }
    catch (e) { f.push(e.message); }
    if (tausch && String(a.buchTausch || '') !== String(tausch.id)){
      f.push('die App ersetzt ihn beim Start durch die Buchvokabel ' + tausch.ar + ' „' + tausch.de + '" (' + (tausch.book || '?') + ', Kapitel ' + tausch.chapter + ', id ' + tausch.id
        + ') und schaltet sie einzeln frei — gleiche Bedeutung: buchTausch: "' + tausch.id + '" angeben; andere Bedeutung: de so fassen, dass sie sich nicht überschneidet');
    }
    if (!tausch && a.buchTausch) f.push('buchTausch angegeben, aber kein Tausch zu erwarten — Angabe streichen');
  }
  if (!a.mnemo || String(a.mnemo).trim().length < 40) f.push('mnemo fehlt oder ist kürzer als 40 Zeichen');
  else for (const w of String(a.mnemo).match(WORT) || []){
    if (!stehtWoertlich(belegText, w) && !auftragsWoerter.has(w)) f.push('Eselsbrücke: „' + w + '" steht so nirgends in Vokabeln, Regeln oder Fachbegriffen');
  }
  if (f.length){ fehler.push(wo + ': ' + f.join(' · ')); continue; }
  ids.add(a.id);
  neu.push({ id: a.id, ar, de: String(a.de).trim(), type: a.type, regel: a.regel, belegt: zaehleNackt(grammarText, ar), mnemo: String(a.mnemo).trim(), tausch });
  entscheidungen[k] = { entscheidung: 'aufgenommen', id: a.id, form: ar, ...(tausch ? { buchTausch: String(tausch.id) } : {}), am: heute };
}
for (const [i, a] of (auftrag.ablehnen || []).entries()){
  const k = nackt(a.ar); const wo = 'ablehnen[' + i + '] ' + (a.ar || '');
  if (!k){ fehler.push(wo + ': ar fehlt'); continue; }
  if (!zuerst(k, wo)) continue;
  if (!a.grund || String(a.grund).trim().length < 10){ fehler.push(wo + ': Grund fehlt (mindestens 10 Zeichen)'); continue; }
  entscheidungen[k] = { entscheidung: 'abgelehnt', grund: String(a.grund).trim(), am: heute };
}
/* Für „frage" und „zurueckstellen" wird festgehalten, welche Regeln den Begriff
   HEUTE nennen. Nennt ihn später eine weitere Regel, legt fachbegriffe-finden.mjs
   ihn wieder vor — der Unterricht hat ihn dann womöglich aufgegriffen. */
const kandidaten = kandidatenAusRegeln(G);
const regelnVon = (k) => kandidaten.has(k) ? [...kandidaten.get(k).regeln.keys()] : [];
for (const [i, a] of (auftrag.fragen || []).entries()){
  const k = nackt(a.ar); const wo = 'fragen[' + i + '] ' + (a.ar || '');
  if (!k){ fehler.push(wo + ': ar fehlt'); continue; }
  if (!zuerst(k, wo)) continue;
  if (!a.frage || String(a.frage).trim().length < 10){ fehler.push(wo + ': Frage fehlt'); continue; }
  entscheidungen[k] = { entscheidung: 'frage', frage: String(a.frage).trim(), form: String(a.ar).normalize('NFC'), regeln: regelnVon(k), am: heute };
}
for (const [i, a] of (auftrag.zurueckstellen || []).entries()){
  const k = nackt(a.ar); const wo = 'zurueckstellen[' + i + '] ' + (a.ar || '');
  if (!k){ fehler.push(wo + ': ar fehlt'); continue; }
  if (!zuerst(k, wo)) continue;
  if (!a.grund || String(a.grund).trim().length < 10){ fehler.push(wo + ': Grund fehlt (mindestens 10 Zeichen)'); continue; }
  entscheidungen[k] = { entscheidung: 'zurueckgestellt', grund: String(a.grund).trim(), regeln: regelnVon(k), am: heute };
}

if (fehler.length){
  console.log('⛔ ' + fehler.length + ' Eintrag/Einträge abgewiesen — NICHTS geschrieben:');
  fehler.forEach(x => console.log('  · ' + x));
  process.exit(1);
}
console.log('Geprüft: ' + neu.length + ' aufnehmen · ' + (auftrag.ablehnen || []).length + ' ablehnen · ' + (auftrag.fragen || []).length + ' fragen · ' + (auftrag.zurueckstellen || []).length + ' zurückstellen.');
neu.forEach(n => console.log('  + ' + n.id.padEnd(26) + n.ar + '  — ' + n.de + '  (' + n.type + ', Regel ' + n.regel + ', belegt ' + n.belegt + '×)'
  + (n.tausch ? '\n      ↳ Buchtausch bestätigt: die App ersetzt ihn beim Start durch ' + n.tausch.ar + ' (id ' + n.tausch.id + ') und schaltet diese einzeln frei' : '')));
if (NUR_PRUEFEN){ console.log('--pruefen: nichts geschrieben.'); process.exit(0); }

/* ---------- schreiben: erst .neu, laden, zählen, dann ersetzen ---------- */
const alt = lies(ZIEL);
const ende = alt.lastIndexOf('\n];');
if (ende < 0 || alt.slice(ende + 3).trim() !== ''){ console.log('⛔ Das schließende `];` am Dateiende von ' + path.basename(ZIEL) + ' ist nicht eindeutig — nichts geschrieben.'); process.exit(1); }
const js = (s) => JSON.stringify(s);
const block = neu.map(n => '  {\n'
  + '    /* Eingetragen am ' + heute + ' von fachbegriffe-setzen.mjs — Schreibung wörtlich aus Regel ' + n.regel + '. */\n'
  + '    id: ' + js(n.id) + ',\n    ar: ' + js(n.ar) + ',\n    de: ' + js(n.de) + ',\n    type: ' + js(n.type) + ',\n'
  + "    chapter: 'personal',\n    book: 'grammar',\n"
  + '    regel: ' + js(n.regel) + ',\n    belegt: ' + n.belegt + ',\n    mnemo: ' + js(n.mnemo) + '\n  }').join(',\n');
const vorEnde = alt.slice(0, ende).replace(/\s+$/, '');
const neuText = neu.length ? vorEnde + ',\n' + block + '\n];\n' : alt;
const zielNeu = ZIEL + '.neu';
const entschNeu = ENTSCH + '.neu';
fs.writeFileSync(zielNeu, neuText, 'utf8');
let geladen;
try { geladen = new Function(neuText + '; return FACHBEGRIFF_VOKABELN;')(); }
catch (e) { fs.unlinkSync(zielNeu); console.log('⛔ Die neue Datei lädt nicht: ' + e.message + ' — nichts ersetzt.'); process.exit(1); }
if (geladen.length !== F.length + neu.length || !neu.every(n => geladen.some(g => g.id === n.id && g.ar === n.ar))){
  fs.unlinkSync(zielNeu); console.log('⛔ Zählung stimmt nicht (' + geladen.length + ' statt ' + (F.length + neu.length) + ') — nichts ersetzt.'); process.exit(1);
}
const entschObjekt = { _zweck: (E && E._zweck) || 'Entscheidungen über Fachbegriff-Kandidaten aus fachbegriffe-finden.mjs — jeder Begriff (Vergleichsform ohne Vokalzeichen und Artikel) wird nur einmal entschieden.', entscheidungen };
fs.writeFileSync(entschNeu, JSON.stringify(entschObjekt, null, 2) + '\n', 'utf8');
JSON.parse(fs.readFileSync(entschNeu, 'utf8'));
fs.renameSync(zielNeu, ZIEL);
fs.renameSync(entschNeu, ENTSCH);
console.log('✓ geschrieben: ' + path.basename(ZIEL) + ' (' + F.length + ' → ' + geladen.length + ' Fachbegriffe), ' + path.basename(ENTSCH) + ' (' + Object.keys(entscheidungen).length + ' Entscheidungen).');
if (neu.length) console.log('  Danach: Eselsbrücken-Alternativen und Satz über das volle Programm (vorrat.mjs), dann ausliefern wie in Schritt 1b.6.');
process.exit(0);
